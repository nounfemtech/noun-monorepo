import { supabase } from './supabase'

// ============================================================
// Patient Profile Service — NOUN-31
// Gerencia o perfil de saúde da paciente na tabela patient_profiles
// e uploads de avatar no bucket "avatares" do Supabase Storage.
// ============================================================

export type GenderIdentity =
  | 'cisgender_woman'
  | 'trans_woman'
  | 'non_binary'
  | 'gender_fluid'
  | 'prefer_not_to_say'
  | 'other'

export interface PatientProfile {
  user_id:                string
  preferred_name:         string | null
  gender_identity:        GenderIdentity | null
  gender_identity_custom: string | null
  avatar_url:             string | null
  health_conditions:      string[]
  current_medications:    string | null
  allergies:              string | null
  created_at:             string
  updated_at:             string
}

export interface PatientProfileInput {
  preferred_name?:         string | null
  gender_identity?:        GenderIdentity | null
  gender_identity_custom?: string | null
  avatar_url?:             string | null
  health_conditions?:      string[]
  current_medications?:    string | null
  allergies?:              string | null
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024 // 2 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}

class PatientProfileService {
  // ──────────────────────────────────────────────────────────
  // Leitura
  // ──────────────────────────────────────────────────────────

  /** Busca o perfil de saúde da paciente. Retorna null se ainda não existe. */
  async getProfile(userId: string): Promise<PatientProfile | null> {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return null

    return {
      ...data,
      health_conditions: data.health_conditions ?? [],
    } as PatientProfile
  }

  // ──────────────────────────────────────────────────────────
  // Escrita
  // ──────────────────────────────────────────────────────────

  /**
   * Cria ou atualiza o perfil de saúde da paciente.
   * Usa upsert com conflito em user_id (PK).
   */
  async upsertProfile(userId: string, input: PatientProfileInput): Promise<PatientProfile> {
    const now = new Date().toISOString()

    const record = {
      user_id:    userId,
      updated_at: now,
      ...input,
    }

    const { data, error } = await supabase
      .from('patient_profiles')
      .upsert(record, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return {
      ...data,
      health_conditions: data.health_conditions ?? [],
    } as PatientProfile
  }

  // ──────────────────────────────────────────────────────────
  // Avatar
  // ──────────────────────────────────────────────────────────

  /**
   * Faz upload de uma imagem local para o bucket "avatares" do Supabase Storage.
   * Sobrescreve o avatar anterior (upsert: true, mesmo caminho).
   * Atualiza avatar_url no perfil e retorna a URL pública.
   *
   * @param userId  - ID da usuária autenticada
   * @param imageUri - URI local da imagem (file:// ou content://)
   * @returns URL pública do avatar
   */
  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    // Lê o arquivo como Blob via fetch (suportado pelo runtime Expo)
    const response = await fetch(imageUri)
    const blob = await response.blob()

    // Valida tamanho
    if (blob.size > AVATAR_MAX_BYTES) {
      throw new Error('A imagem deve ter no máximo 2 MB. Tente uma imagem menor.')
    }

    // Determina content-type e extensão
    const mimeType = blob.type || 'image/jpeg'
    const ext      = MIME_TO_EXT[mimeType] ?? 'jpg'
    const filePath = `${userId}/avatar.${ext}`

    // Upload com upsert (sobrescreve se já existe)
    const { error: uploadError } = await supabase.storage
      .from('avatares')
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert:      true,
      })

    if (uploadError) throw new Error(uploadError.message)

    // Obtém URL pública
    const { data: urlData } = supabase.storage
      .from('avatares')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Persiste no perfil
    await this.upsertProfile(userId, { avatar_url: publicUrl })

    return publicUrl
  }

  /**
   * Remove o avatar da paciente do Storage e limpa avatar_url no perfil.
   */
  async deleteAvatar(userId: string): Promise<void> {
    const profile = await this.getProfile(userId)
    if (!profile?.avatar_url) return

    // Extrai o caminho a partir da URL pública
    // Formato: https://[project].supabase.co/storage/v1/object/public/avatares/[path]
    const url       = profile.avatar_url
    const marker    = '/avatares/'
    const markerIdx = url.indexOf(marker)
    if (markerIdx !== -1) {
      // Remove query params (cache buster) antes de extrair o caminho
      const rawPath    = url.slice(markerIdx + marker.length)
      const bucketPath = rawPath.split('?')[0] ?? rawPath

      if (bucketPath) {
        const { error } = await supabase.storage.from('avatares').remove([bucketPath])
        if (error) throw new Error(error.message)
      }
    }

    await this.upsertProfile(userId, { avatar_url: null })
  }
}

export const patientProfileService = new PatientProfileService()
