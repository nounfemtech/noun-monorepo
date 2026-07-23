import { createClient } from '@supabase/supabase-js'

// Client com service role: bypassa RLS. Uso restrito a server actions/route handlers que
// precisam ler/escrever public.doctor_google_credentials (tokens do Google Calendar do medico,
// tabela sem nenhuma policy de RLS por design). Nunca importar em client components.
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
