import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'

export function createBrowserClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }

  return _createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
