import { useAuth } from '@/providers/auth-provider'

// ============================================================
// useSession — acesso rápido à sessão ativa
// ============================================================

export function useSession() {
  const { session, loading, isAuthenticated } = useAuth()
  return { session, isLoading: loading, isAuthenticated }
}
