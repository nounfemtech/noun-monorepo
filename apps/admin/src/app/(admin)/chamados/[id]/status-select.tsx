'use client'

import { useTransition } from 'react'
import { updateTicketStatus } from './actions'

const OPTIONS = [
  { value: 'aberto',       label: 'Aberto'       },
  { value: 'em_andamento', label: 'Em andamento'  },
  { value: 'resolvido',    label: 'Resolvido'     },
  { value: 'fechado',      label: 'Fechado'       },
]

export function StatusSelect({ ticketId, current }: { ticketId: string; current: string }) {
  const [pending, startTransition] = useTransition()

  function handleChange(value: string) {
    startTransition(() => updateTicketStatus(ticketId, value))
  }

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value)}
      className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
