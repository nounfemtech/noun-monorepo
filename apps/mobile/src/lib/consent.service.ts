import { supabase } from './supabase'

// ============================================================
// Consent Service — LGPD (NOUN-6)
// Gerencia consentimentos na tabela user_consents
// ============================================================

export const TERMS_VERSION = '1.0.0'

export const REQUIRED_CONSENTS = ['terms_of_use', 'privacy_policy', 'health_data'] as const

export type ConsentType = 'terms_of_use' | 'privacy_policy' | 'marketing' | 'health_data'

export interface ConsentRecord {
  id:            string
  user_id:       string
  consent_type:  ConsentType
  accepted:      boolean
  accepted_at:   string | null
  revoked_at:    string | null
  terms_version: string
  created_at:    string
  updated_at:    string
}

export interface SaveConsentInput {
  consentType: ConsentType
  accepted:    boolean
}

class ConsentService {
  /**
   * Salva (ou atualiza) um conjunto de consentimentos para o usuário.
   * Usa upsert com conflito em (user_id, consent_type, terms_version).
   */
  async saveConsents(userId: string, consents: SaveConsentInput[]): Promise<void> {
    const now = new Date().toISOString()
    const records = consents.map((c) => ({
      user_id:       userId,
      consent_type:  c.consentType,
      accepted:      c.accepted,
      accepted_at:   c.accepted ? now : null,
      revoked_at:    null,
      terms_version: TERMS_VERSION,
      updated_at:    now,
    }))

    const { error } = await supabase
      .from('user_consents')
      .upsert(records, { onConflict: 'user_id,consent_type,terms_version' })

    if (error) throw new Error(error.message)
  }

  /**
   * Retorna todos os consentimentos da versão atual para o usuário.
   */
  async getConsents(userId: string): Promise<ConsentRecord[]> {
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .eq('terms_version', TERMS_VERSION)

    if (error) throw new Error(error.message)
    return (data ?? []) as ConsentRecord[]
  }

  /**
   * Revoga um consentimento (seta accepted=false, revoked_at=now).
   * Usado para revogar marketing.
   */
  async revokeConsent(userId: string, consentType: ConsentType): Promise<void> {
    const { error } = await supabase
      .from('user_consents')
      .update({
        accepted:   false,
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('consent_type', consentType)
      .eq('terms_version', TERMS_VERSION)

    if (error) throw new Error(error.message)
  }

  /**
   * Reativa um consentimento previamente revogado.
   */
  async reactivateConsent(userId: string, consentType: ConsentType): Promise<void> {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('user_consents')
      .update({
        accepted:    true,
        accepted_at: now,
        revoked_at:  null,
        updated_at:  now,
      })
      .eq('user_id', userId)
      .eq('consent_type', consentType)
      .eq('terms_version', TERMS_VERSION)

    if (error) throw new Error(error.message)
  }

  /**
   * Verifica se o usuário aceitou todos os consentimentos obrigatórios
   * (terms_of_use, privacy_policy, health_data) na versão atual.
   * Retorna false em caso de erro de rede (fail-safe).
   */
  async hasRequiredConsents(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_consents')
      .select('consent_type')
      .eq('user_id', userId)
      .eq('accepted', true)
      .eq('terms_version', TERMS_VERSION)
      .in('consent_type', [...REQUIRED_CONSENTS])

    if (error) return false
    return (data?.length ?? 0) >= REQUIRED_CONSENTS.length
  }
}

export const consentService = new ConsentService()
