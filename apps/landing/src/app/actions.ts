'use server'

import { createSupabaseServer } from '@/lib/supabase-server'

export type WaitlistTipo = 'paciente' | 'medico' | 'farmacia'

export type WaitlistState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

const TIPOS: WaitlistTipo[] = ['paciente', 'medico', 'farmacia']

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function joinWaitlist(
  _prevState: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const tipo = String(formData.get('tipo') ?? '')

  if (!isValidEmail(email)) {
    return { status: 'error', message: 'Digite um e-mail válido.' }
  }

  if (!TIPOS.includes(tipo as WaitlistTipo)) {
    return { status: 'error', message: 'Tipo inválido.' }
  }

  const supabase = await createSupabaseServer()

  const { error } = await supabase.from('landing_waitlist').insert({ email, tipo })

  if (error) {
    if (error.code === '23505') {
      return { status: 'success', message: 'Você já está na lista de espera.' }
    }
    return {
      status: 'error',
      message: 'Não foi possível cadastrar agora. Tente novamente.',
    }
  }

  return { status: 'success', message: 'Você entrou na lista de espera.' }
}
