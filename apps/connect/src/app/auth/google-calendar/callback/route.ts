import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { exchangeCodeForTokens } from '@/lib/google-calendar'

// Callback do OAuth "conectar Google Calendar" do medico (Prompt 3), distinto de
// apps/connect/src/app/auth/callback/route.ts (esse e o login/convite do Supabase Auth).
// Nao precisa entrar na allowlist de rotas publicas do middleware.ts: o medico ja esta
// autenticado no Supabase (mesmo navegador) quando o Google redireciona de volta aqui.

const STATE_COOKIE = 'google_oauth_state'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete(STATE_COOKIE)

  if (errorParam || !code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/perfil?google=error`)
  }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.redirect(`${origin}/perfil?google=error`)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const admin = createSupabaseAdmin()
    const { error } = await admin.from('doctor_google_credentials').upsert(
      {
        doctor_id: user.id,
        tenant_id: profile.tenant_id,
        google_email: tokens.googleEmail,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        scope: tokens.scope,
        token_expires_at: tokens.expiresAt,
      },
      { onConflict: 'doctor_id' }
    )

    if (error) throw error

    return NextResponse.redirect(`${origin}/perfil?google=connected`)
  } catch {
    return NextResponse.redirect(`${origin}/perfil?google=error`)
  }
}
