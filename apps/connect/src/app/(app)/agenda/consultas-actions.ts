'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import { ensureValidAccessToken, createCalendarEvent, deleteCalendarEvent, GoogleCalendarError } from '@/lib/google-calendar'
import { slotsForDay } from './lib'
import type { RuleRow, BlockRow } from './lib'
import type { PatientSearchResult } from '@noun/types'

const TIPOS_PERMITIDOS = ['first_visit', 'follow_up', 'return', 'telemedicine']

async function getDoctorContext() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, default_consultation_price')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Perfil sem tenant vinculado' as const }
  return {
    supabase,
    userId: user.id,
    tenantId: profile.tenant_id as string,
    defaultPrice: profile.default_consultation_price as number | null,
  }
}

export async function buscarPacientes(query: string) {
  const ctx = await getDoctorContext()
  if ('error' in ctx) return { error: ctx.error }
  if (query.trim().length < 3) return { data: [] }

  const { data, error } = await ctx.supabase.rpc('search_tenant_patients', { p_query: query.trim() })
  if (error) return { error: error.message }

  const results: PatientSearchResult[] = (data ?? []).map(
    (row: { id: string; full_name: string; email: string | null; phone_mobile: string | null }) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phoneMobile: row.phone_mobile,
    })
  )
  return { data: results }
}

export async function criarConsulta(input: {
  patientId: string
  date: string
  time: string
  durationMinutes: number
  type: string
}) {
  const ctx = await getDoctorContext()
  if ('error' in ctx) return { error: ctx.error }

  if (!TIPOS_PERMITIDOS.includes(input.type)) return { error: 'Tipo de consulta invalido' }

  const [rulesRes, blocksRes] = await Promise.all([
    ctx.supabase
      .from('availability_rules')
      .select('id, weekday, start_time, end_time, slot_duration_minutes, consultation_type, is_active')
      .eq('doctor_id', ctx.userId),
    ctx.supabase
      .from('availability_blocks')
      .select('id, starts_at, ends_at, reason')
      .eq('doctor_id', ctx.userId),
  ])

  const rules = (rulesRes.data ?? []) as RuleRow[]
  const blocks = (blocksRes.data ?? []) as BlockRow[]

  const dayDate = new Date(`${input.date}T00:00:00`)
  const daySlots = slotsForDay(dayDate, rules, blocks)
  const matchingSlot = daySlots.find((s) => s.time === input.time)

  if (!matchingSlot) return { error: 'Horario fora da disponibilidade configurada' }
  if (matchingSlot.blocked) return { error: 'Horario bloqueado' }

  const startsAt = new Date(`${input.date}T${input.time}:00`)
  const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000)

  const { data: overlapping } = await ctx.supabase
    .from('appointments')
    .select('id, availability_slots!inner(starts_at, ends_at)')
    .eq('doctor_id', ctx.userId)
    .not('status', 'in', '(cancelled,no_show)')
    .lt('availability_slots.starts_at', endsAt.toISOString())
    .gt('availability_slots.ends_at', startsAt.toISOString())

  if (overlapping && overlapping.length > 0) {
    return { error: 'Ja existe uma consulta marcada nesse horario' }
  }

  const { data: slot, error: slotError } = await ctx.supabase
    .from('availability_slots')
    .insert({
      doctor_id: ctx.userId,
      tenant_id: ctx.tenantId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      is_booked: true,
      price: ctx.defaultPrice,
    })
    .select('id')
    .single()

  if (slotError || !slot) return { error: slotError?.message ?? 'Erro ao reservar horario' }

  const { error: apptError } = await ctx.supabase.from('appointments').insert({
    patient_id: input.patientId,
    doctor_id: ctx.userId,
    tenant_id: ctx.tenantId,
    slot_id: slot.id,
    status: 'pending',
    type: input.type,
    price: ctx.defaultPrice,
  })

  if (apptError) return { error: apptError.message }

  revalidatePath('/agenda')
  return { success: true }
}

export async function confirmarConsulta(appointmentId: string) {
  const ctx = await getDoctorContext()
  if ('error' in ctx) return { error: ctx.error }

  const { data: appointment, error: apptError } = await ctx.supabase
    .from('appointments')
    .select(
      'id, availability_slots!inner(starts_at, ends_at), patient:profiles!patient_id(full_name, email)'
    )
    .eq('id', appointmentId)
    .eq('doctor_id', ctx.userId)
    .single()

  if (apptError || !appointment) return { error: 'Consulta nao encontrada' }

  try {
    const accessToken = await ensureValidAccessToken(ctx.userId)
    const slot = appointment.availability_slots as unknown as { starts_at: string; ends_at: string }
    const patient = appointment.patient as unknown as { full_name: string; email: string | null }

    const event = await createCalendarEvent({
      accessToken,
      summary: `Consulta - ${patient.full_name}`,
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      attendeeEmail: patient.email ?? undefined,
    })

    const { error: updateError } = await ctx.supabase
      .from('appointments')
      .update({
        status: 'confirmed',
        telemedicine_url: event.meetUrl,
        google_calendar_event_id: event.eventId,
      })
      .eq('id', appointmentId)

    if (updateError) return { error: updateError.message }

    revalidatePath('/agenda')
    return { success: true }
  } catch (err) {
    if (err instanceof GoogleCalendarError) return { error: err.message }
    return { error: 'Erro inesperado ao confirmar a consulta' }
  }
}

export async function cancelarConsulta(appointmentId: string, reason?: string) {
  const ctx = await getDoctorContext()
  if ('error' in ctx) return { error: ctx.error }

  const { data: appointment } = await ctx.supabase
    .from('appointments')
    .select('id, slot_id, google_calendar_event_id')
    .eq('id', appointmentId)
    .eq('doctor_id', ctx.userId)
    .single()

  if (!appointment) return { error: 'Consulta nao encontrada' }

  if (appointment.google_calendar_event_id) {
    try {
      const accessToken = await ensureValidAccessToken(ctx.userId)
      const ok = await deleteCalendarEvent(accessToken, appointment.google_calendar_event_id)
      if (!ok) {
        console.warn(`Falha ao apagar evento do Google Calendar da consulta ${appointmentId}`)
      }
    } catch {
      console.warn(`Nao foi possivel apagar o evento do Google Calendar da consulta ${appointmentId}`)
    }
  }

  const { error: updateError } = await ctx.supabase
    .from('appointments')
    .update({ status: 'cancelled', cancelled_by: ctx.userId, cancelled_reason: reason ?? null })
    .eq('id', appointmentId)

  if (updateError) return { error: updateError.message }

  if (appointment.slot_id) {
    await ctx.supabase.from('availability_slots').update({ is_booked: false }).eq('id', appointment.slot_id)
  }

  revalidatePath('/agenda')
  return { success: true }
}
