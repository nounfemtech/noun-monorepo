import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseServer } from '@/lib/supabase-server'
import { NovoTenantForm, type TenantEditData } from '../../novo/form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarTenantPage({ params }: PageProps) {
  const { id } = await params
  const { profile, session } = await requireAdmin()
  const adminName = profile.full_name ?? profile.email ?? session.user.email ?? 'Admin'

  const supabase = await createSupabaseServer()
  const { data: raw } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (!raw) notFound()

  return <NovoTenantForm adminName={adminName} initialData={raw as unknown as TenantEditData} />
}
