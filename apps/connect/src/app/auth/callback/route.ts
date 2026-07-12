import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const isInvite = searchParams.get('type') === 'invite'

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (isInvite) {
    return NextResponse.redirect(`${origin}/auth/set-password`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
