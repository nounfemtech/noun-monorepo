import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import {
  patientProfileService,
  PatientProfile,
  PatientProfileInput,
} from '@/lib/patient-profile.service'

// ============================================================
// usePatientProfile — NOUN-31
// Gerencia o estado do perfil de saúde da paciente autenticada.
// ============================================================

export interface UsePatientProfileReturn {
  profile:         PatientProfile | null
  isLoading:       boolean
  isSaving:        boolean
  isUploadingAvatar: boolean
  loadProfile:     () => Promise<void>
  saveProfile:     (data: PatientProfileInput) => Promise<void>
  uploadAvatar:    (imageUri: string) => Promise<string | null>
  deleteAvatar:    () => Promise<void>
}

export function usePatientProfile(): UsePatientProfileReturn {
  const { user } = useAuth()

  const [profile,           setProfile]           = useState<PatientProfile | null>(null)
  const [isLoading,         setIsLoading]         = useState(false)
  const [isSaving,          setIsSaving]          = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // ── Carrega o perfil do Supabase ─────────────────────────
  const loadProfile = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const data = await patientProfileService.getProfile(user.id)
      setProfile(data)
    } catch {
      // Silencioso: perfil pode não existir ainda
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // ── Salva (upsert) o perfil ──────────────────────────────
  const saveProfile = useCallback(async (data: PatientProfileInput) => {
    if (!user?.id) return
    setIsSaving(true)
    try {
      const updated = await patientProfileService.upsertProfile(user.id, data)
      setProfile(updated)
    } finally {
      setIsSaving(false)
    }
  }, [user?.id])

  // ── Upload de avatar ─────────────────────────────────────
  const uploadAvatar = useCallback(async (imageUri: string): Promise<string | null> => {
    if (!user?.id) return null
    setIsUploadingAvatar(true)
    try {
      const url = await patientProfileService.uploadAvatar(user.id, imageUri)
      // Atualiza estado local com novo avatar_url
      setProfile((prev) => prev ? { ...prev, avatar_url: url } : null)
      return url
    } finally {
      setIsUploadingAvatar(false)
    }
  }, [user?.id])

  // ── Delete de avatar ─────────────────────────────────────
  const deleteAvatar = useCallback(async () => {
    if (!user?.id) return
    setIsUploadingAvatar(true)
    try {
      await patientProfileService.deleteAvatar(user.id)
      setProfile((prev) => prev ? { ...prev, avatar_url: null } : null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }, [user?.id])

  // ── Carrega ao montar ────────────────────────────────────
  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  return {
    profile,
    isLoading,
    isSaving,
    isUploadingAvatar,
    loadProfile,
    saveProfile,
    uploadAvatar,
    deleteAvatar,
  }
}
