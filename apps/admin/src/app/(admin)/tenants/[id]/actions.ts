'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function gerarAcesso(tenantId: string) {
  await requireAdmin()

  const supabase = await createSupabaseServer()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, email, user_id, name')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { error: 'Tenant nao encontrado' }
  if (tenant.user_id) return { error: 'Este tenant ja possui acesso' }
  if (!tenant.email) return { error: 'Tenant sem e-mail cadastrado' }

  const admin = createSupabaseAdmin()
  const redirectTo = `${process.env.NEXT_PUBLIC_CONNECT_URL}/auth/callback?type=invite`

  const { data, error } = await admin.auth.admin.inviteUserByEmail(tenant.email, {
    redirectTo,
    data: { tenant_id: tenant.id, tenant_name: tenant.name },
  })

  if (error) return { error: error.message }

  await supabase
    .from('tenants')
    .update({ user_id: data.user.id })
    .eq('id', tenantId)

  revalidatePath(`/tenants/${tenantId}`)
  return { success: true }
}

export async function atualizarTenant(
  id: string,
  data: Record<string, unknown>,
) {
  await requireAdmin()

  const supabase = await createSupabaseServer()

  const { error } = await supabase
    .from('tenants')
    .update(data)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/tenants/${id}`)
  return { success: true }
}

export async function reenviarConvite(tenantId: string) {
  await requireAdmin()

  const supabase = await createSupabaseServer()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, email, user_id, name')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { error: 'Tenant nao encontrado' }
  if (!tenant.user_id) return { error: 'Este tenant nao possui acesso' }
  if (!tenant.email) return { error: 'Tenant sem e-mail cadastrado' }

  const admin = createSupabaseAdmin()
  const redirectTo = `${process.env.NEXT_PUBLIC_CONNECT_URL}/auth/callback?type=invite`

  const { error } = await admin.auth.admin.inviteUserByEmail(tenant.email, {
    redirectTo,
    data: { tenant_id: tenant.id, tenant_name: tenant.name },
  })

  if (error) return { error: error.message }

  revalidatePath(`/tenants/${tenantId}`)
  return { success: true }
}
