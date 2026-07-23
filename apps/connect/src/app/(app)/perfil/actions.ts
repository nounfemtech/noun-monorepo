'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'

export interface AtualizarPerfilInput {
  bio: string | null
  default_consultation_price: number | null
  accepts_insurance: boolean
  accepted_insurance_plans: string[]
}

export async function atualizarPerfil(input: AtualizarPerfilInput) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Nao autenticado' }

  const price = input.default_consultation_price
  if (price !== null && (Number.isNaN(price) || price < 0 || price > 100000)) {
    return { error: 'Valor de consulta invalido' }
  }

  const plans = input.accepts_insurance
    ? input.accepted_insurance_plans.map((p) => p.trim()).filter(Boolean).slice(0, 30)
    : []

  const { error } = await supabase
    .from('profiles')
    .update({
      bio: input.bio?.trim() || null,
      default_consultation_price: price,
      accepts_insurance: input.accepts_insurance,
      accepted_insurance_plans: plans,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/perfil')
  return { success: true }
}
