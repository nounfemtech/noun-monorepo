import { redirect } from 'next/navigation'
import { createSupabaseServer } from './supabase'
import type { Session } from '@supabase/supabase-js'

export interface AdminProfile {
  id: string
  full_name: string | null
  role: string
  is_active: boolean | null
  tenant_id: string | null
  email: string | null
  created_at: string
}

export interface AdminSession {
  session: Session
  profile: AdminProfile
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServer()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'noun_admin') return null

  return { session, profile: profile as AdminProfile }
}

export async function requireAdmin(): Promise<AdminSession> {
  const adminSession = await getAdminSession()
  if (!adminSession) {
    redirect('/login')
  }
  return adminSession
}
