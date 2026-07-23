'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'

const DURACOES_PERMITIDAS = [15, 20, 30, 45, 60, 90, 120]
const MODALIDADES = ['in_person', 'telemedicine', 'both']

async function getDoctorContext() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Perfil sem tenant vinculado' as const }
  return { supabase, userId: user.id, tenantId: profile.tenant_id as string }
}

export async function criarRegra(input: {
  weekday: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
  consultationType: string
}) {
  const ctx = await getDoctorContext()
  if ('error' in ctx) return { error: ctx.error }

  if (!Number.isInteger(input.weekday) || input.weekday < 0 || input.weekday > 6) {
    return { error: 'Dia da semana invalido' }
  }
  if (!/^\d{2}:\d{2}$/.test(input.startTime) || !/^\d{2}:\d{2}$/.test(input.endTime)) {
    return { error: 'Horario invalido' }
  }
  if (input.endTime <= input.startTime) {
    return { error: 'O horario final deve ser depois do inicial' }
  }
  if (!DURACOES_PERMITIDAS.includes(input.slotDurationMinutes)) {
    return { error: 'Duracao de consulta invalida' }
  }
  if (!MODALIDADES.includes(input.consultationType)) {
    return { error: 'Tipo de consulta invalido' }
  }

  const { error } = await ctx.supabase.from('availability_rules').insert({
    doctor_id: ctx.userId,
    tenant_id: ctx.tenantId,
    weekday: input.weekday,
    start_time: input.startTime,
    end_time: input.endTime,
    slot_duration_minutes: input.slotDurationMinutes,
    consultation_type: input.consultationType,
  })

  if (error) return { error: error.message }
  revalidatePath('/agenda')
  return { success: true }
}

export async function alternarRegra(id: string, isActive: boolean) {
  const ctx = await getDoctorContext()
  if ('error' in ctx) return { error: ctx.error }

  const { error } = await ctx.supabase
    .from('availability_rules')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('doctor_id', ctx.userId)

  if (error) return { error: error.message }
  revalidatePath('/agenda')
  return { success: true }
}

export async function removerRegra(id: string) {
  const ctx = await getDoctorContext()
  if ('error' in ctx) return { error: ctx.error }

  const { error } = await ctx.supabase
    .from('availability_rules')
    .delete()
    .eq('id', id)
    .eq('doctor_id', ctx.userId)

  if (error) return { error: error.message }
  revalidatePath('/agenda')
  return { success: true }
}

export async function criarBloqueio(input: { startsAt: string; endsAt: string; reason: string | null }) {
  const ctx = await getDoctorContext()
  if ('error' in ctx) return { error: ctx.error }

  const starts = new Date(input.startsAt)
  const ends = new Date(input.endsAt)
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
    return { error: 'Data invalida' }
  }
  if (ends <= starts) {
    return { error: 'O fim do bloqueio deve ser depois do inicio' }
  }

  const { error } = await ctx.supabase.from('availability_blocks').insert({
    doctor_id: ctx.userId,
    tenant_id: ctx.tenantId,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    reason: input.reason?.trim() || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/agenda')
  return { success: true }
}

export async function removerBloqueio(id: string) {
  const ctx = await getDoctorContext()
  if ('error' in ctx) return { error: ctx.error }

  const { error } = await ctx.supabase
    .from('availability_blocks')
    .delete()
    .eq('id', id)
    .eq('doctor_id', ctx.userId)

  if (error) return { error: error.message }
  revalidatePath('/agenda')
  return { success: true }
}
