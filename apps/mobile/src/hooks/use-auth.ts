import { useAuth as _useAuth } from '@/providers/auth-provider'
import { authService } from '@/lib/auth.service'

// ============================================================
// useAuth — expõe estado de autenticação + métodos do authService
// ============================================================

export function useAuth() {
  const ctx = _useAuth()

  return {
    // Estado
    user:            ctx.user,
    session:         ctx.session,
    loading:         ctx.loading,
    isAuthenticated: ctx.isAuthenticated,
    hasProfile:      ctx.hasProfile,
    refreshProfile:  ctx.refreshProfile,

    // Métodos (delegam para authService)
    signIn:        (email: string, password: string) =>
      authService.signInWithPassword(email, password),
    signOut:       () => authService.signOut(),
    resetPassword: (email: string) => authService.resetPassword(email),
  }
}
