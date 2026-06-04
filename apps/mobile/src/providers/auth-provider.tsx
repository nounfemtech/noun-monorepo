import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// ============================================================
// Auth Context
// ============================================================

interface AuthContextValue {
  user:            User | null
  session:         Session | null
  loading:         boolean
  isAuthenticated: boolean
  hasProfile:      boolean | null   // null = ainda não verificado
  refreshProfile:  () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user:            null,
  session:         null,
  loading:         true,
  isAuthenticated: false,
  hasProfile:      null,
  refreshProfile:  async () => {},
})

// ============================================================
// AuthProvider
// ============================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)

  /** Verifica se o userId tem registro em profiles */
  async function checkProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    setHasProfile(!!data)
  }

  /** Exposto para que as telas atualizem o estado após saveProfile() */
  async function refreshProfile() {
    if (user?.id) await checkProfile(user.id)
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
      isAuthenticated: !!session,
      hasProfile,
      refreshProfile,
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
