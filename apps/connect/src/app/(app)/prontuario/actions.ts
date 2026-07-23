'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import type { SaveMedicalRecordInput } from '@noun/types'

export async function salvarProntuario(input: SaveMedicalRecordInput) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const { appointmentId, patientId, ...fields } = input

  const { error } = await supabase.rpc('upsert_medical_record', {
    p_appointment_id: appointmentId,
    p_patient_id: patientId,
    p_fields: fields,
  })

  if (error) return { error: error.message }

  revalidatePath(`/prontuario/${appointmentId}`)
  return { success: true }
}

export async function adicionarEvolucao(recordId: string, notes: string) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  if (!notes.trim()) return { error: 'Evolucao nao pode ser vazia' }

  const { error } = await supabase.rpc('add_record_evolution', {
    p_record_id: recordId,
    p_notes: notes.trim(),
  })

  if (error) return { error: error.message }

  return { success: true }
}

export async function finalizarProntuario(recordId: string, appointmentId: string) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const { error } = await supabase.rpc('finalize_medical_record', { p_record_id: recordId })
  if (error) return { error: error.message }

  revalidatePath(`/prontuario/${appointmentId}`)
  return { success: true }
}
