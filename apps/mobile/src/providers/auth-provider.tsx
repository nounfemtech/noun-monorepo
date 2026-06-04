import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { consentService } from '@/lib/consent.service'

// ============================================================
// Auth Context
// ============================================================

interface AuthContextValue {
  user:                User | null
  session:             Session | null
  loading:             boolean
  isAuthenticated:     boolean
  hasProfile:          boolean | null   // null = ainda não verificado
  hasRequiredConsents: boolean | null   // null = ainda não verificado
  refreshProfile:      () => Promise<void>
  refreshConsents:     () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user:                null,
  session:             null,
  loading:             true,
  isAuthenticated:     false,
  hasProfile:          null,
  hasRequiredConsents: null,
  refreshProfile:      async () => {},
  refreshConsents:     async () => {},
})

// ============================================================
// AuthProvider
// ============================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,                setUser]                = useState<User | null>(null)
  const [session,             setSession]             = useState<Session | null>(null)
  const [loading,             setLoading]             = useState(true)
  const [hasProfile,          setHasProfile]          = useState<boolean | null>(null)
  const [hasRequiredConsents, setHasRequiredConsents] = useState<boolean | null>(null)

  /** Verifica consentimentos obrigatórios */
  async function checkConsents(userId: string) {
    const result = await consentService.hasRequiredConsents(userId)
    setHasRequiredConsents(result)
  }

  /** Verifica se userId tem registro em profiles; se sim, verifica consentimentos */
  async function checkProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    const exists = !!data
    setHasProfile(exists)
    if (exists) {
      await checkConsents(userId)
    } else {
      setHasRequiredConsents(null)
    }
  }

  /** Exposto para que telas atualizem o estado após saveProfile() */
  async function refreshProfile() {
    if (user?.id) await checkProfile(user.id)
  }

  /** Exposto para que telas atualizem o estado após saveConsents() */
  async function refreshConsents() {
    if (user?.id) await checkConsents(user.id)
  }

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await checkProfile(session.user.id)
      } else {
        setHasProfile(null)
        setHasRequiredConsents(null)
      }
      setLoading(false)
    })

    // Listener de mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (event === 'SIGNED_IN' && session?.user) {
          await checkProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setHasProfile(null)
          setHasRequiredConsents(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAuthenticated:     !!session,
      hasProfile,
      hasRequiredConsents,
      refreshProfile,
      refreshConsents,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
