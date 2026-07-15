'use server'

import { createSupabaseServer } from '@/lib/supabase-server'

export type WaitlistTipo = 'paciente' | 'medico' | 'farmacia'

export type WaitlistState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

const TIPOS: WaitlistTipo[] = ['paciente', 'medico', 'farmacia']

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidTelefone(telefone: string) {
  return /^\d{10,11}$/.test(telefone.replace(/\D/g, ''))
}

export async function joinWaitlist(
  _prevState: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const nome = String(formData.get('nome') ?? '').trim()
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const telefone = String(formData.get('telefone') ?? '').trim()
  const whatsapp = String(formData.get('whatsapp') ?? '').trim()
  const cidade = String(formData.get('cidade') ?? '').trim()
  const estado = String(formData.get('estado') ?? '').trim().toUpperCase()
  const tipo = String(formData.get('tipo') ?? '')

  if (!nome) {
    return { status: 'error', message: 'Digite seu nome.' }
  }

  if (!isValidEmail(email)) {
    return { status: 'error', message: 'Digite um e-mail válido.' }
  }

  if (!isValidTelefone(telefone)) {
    return { status: 'error', message: 'Digite um telefone válido.' }
  }

  if (!isValidTelefone(whatsapp)) {
    return { status: 'error', message: 'Digite um WhatsApp válido.' }
  }

  if (!cidade) {
    return { status: 'error', message: 'Digite sua cidade.' }
  }

  if (!ESTADOS.includes(estado)) {
    return { status: 'error', message: 'Selecione um estado válido.' }
  }

  if (!TIPOS.includes(tipo as WaitlistTipo)) {
    return { status: 'error', message: 'Tipo inválido.' }
  }

  const supabase = await createSupabaseServer()

  const { error } = await supabase
    .from('landing_waitlist')
    .insert({ nome, email, telefone, whatsapp, cidade, estado, tipo })

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
