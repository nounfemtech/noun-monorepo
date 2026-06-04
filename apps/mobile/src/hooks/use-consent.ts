import { useState, useCallback } from 'react'
import { consentService, ConsentRecord, SaveConsentInput } from '@/lib/consent.service'
import { useAuth } from '@/providers/auth-provider'

// ============================================================
// useConsent — hook para gerenciar consentimentos LGPD (NOUN-6)
// ============================================================

export function useConsent() {
  const { user, refreshConsents } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [consents,  setConsents]  = useState<ConsentRecord[]>([])

  /** Carrega todos os consentimentos da versão atual do usuário */
  const loadConsents = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const data = await consentService.getConsents(user.id)
      setConsents(data)
    } catch {
      // erro silencioso — UI exibe estado vazio
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  /**
   * Salva consentimentos e sincroniza o AuthProvider (hasRequiredConsents).
   * Lança erro se o usuário não estiver autenticado.
   */
  const saveConsents = useCallback(async (inputs: SaveConsentInput[]) => {
    if (!user?.id) throw new Error('Usuário não autenticado')
    setIsLoading(true)
    try {
      await consentService.saveConsents(user.id, inputs)
      // Recarrega lista local
      const data = await consentService.getConsents(user.id)
      setConsents(data)
      // Sincroniza estado global do AuthProvider
      await refreshConsents()
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, refreshConsents])

  /** Revoga consentimento de marketing */
  const revokeMarketingConsent = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      await consentService.revokeConsent(user.id, 'marketing')
      const data = await consentService.getConsents(user.id)
      setConsents(data)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  return {
    consents,
    isLoading,
    loadConsents,
    saveConsents,
    revokeMarketingConsent,
  }
}
