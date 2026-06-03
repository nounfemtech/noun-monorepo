import { createServerClient as _createServerClient } from '@supabase/ssr'
import type { cookies } from 'next/headers'

import type { Database } from './database.types'

type CookieStore = Awaited<ReturnType<typeof cookies>>

export function createServerClient(cookieStore: CookieStore) {
  const supabaseUrl = process.env['SUPABASE_URL']
  const supabaseAnonKey = process.env['SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars: SUPABASE_URL and SUPABASE_ANON_KEY')
  }

  return _createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // setAll foi chamado em um Server Component — cookies só podem ser
          // setados em Route Handlers ou Server Actions
        }
      },
    },
  })
}

export function createServiceClient() {
  const supabaseUrl = process.env['SUPABASE_URL']
  const serviceKey = process.env['SUPABASE_SERVICE_KEY']

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase env vars: SUPABASE_URL and SUPABASE_SERVICE_KEY')
  }

  // Service client bypassa RLS — usar apenas em contextos seguros de servidor
  return _createServerClient<Database>(supabaseUrl, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}
