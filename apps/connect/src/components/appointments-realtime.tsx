'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { createSupabaseBrowser } from '@/lib/supabase'

// Notificacao in-app de novas marcacoes/cancelamentos via Supabase Realtime
// (postgres_changes). Infra montada no Prompt 2; o gatilho real (criacao de
// appointments pelo fluxo de agendamento) chega no Prompt 3. A tabela
// public.appointments foi adicionada a publication supabase_realtime na
// migration create_availability_rules_and_blocks. E-mail/push ficam para
// quando a automacao (n8n) existir.

export function AppointmentsRealtime({ userId }: { userId: string }) {
  React.useEffect(() => {
    const supabase = createSupabaseBrowser()

    const channel = supabase
      .channel(`appointments-doctor-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as { status?: string } | null
          if (payload.eventType === 'INSERT') {
            toast.info('Nova consulta marcada na sua agenda.')
          } else if (payload.eventType === 'UPDATE' && next?.status === 'cancelled') {
            toast.warning('Uma consulta foi cancelada.')
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return null
}
