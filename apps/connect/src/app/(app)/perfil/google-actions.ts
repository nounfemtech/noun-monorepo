'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { buildGoogleAuthUrl, revokeGoogleToken } from '@/lib/google-calendar'

const STATE_COOKIE = 'google_oauth_state'

export async function iniciarConexaoGoogle() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  try {
    return { url: buildGoogleAuthUrl(state) }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao iniciar conexao com o Google' }
  }
}

export async function desconectarGoogle() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const admin = createSupabaseAdmin()
  const { data: credential } = await admin
    .from('doctor_google_credentials')
    .select('refresh_token')
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (credential?.refresh_token) {
    await revokeGoogleToken(credential.refresh_token)
  }

  const { error } = await admin.from('doctor_google_credentials').delete().eq('doctor_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/perfil')
  return { success: true }
}
