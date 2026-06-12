'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const options = [
  { value: '',                 label: 'Todos'     },
  { value: 'active',           label: 'Ativos'    },
  { value: 'pending_approval', label: 'Pendentes' },
  { value: 'suspended',        label: 'Suspensos' },
]

export function StatusFilter({ current, q }: { current: string; q: string }) {
  const router = useRouter()
  return (
    <div
      role="group"
      className="inline-flex items-center rounded-md border border-input shadow-sm overflow-hidden divide-x divide-input"
    >
      {options.map((o) => {
        const params = new URLSearchParams()
        if (o.value) params.set('status', o.value)
        if (q) params.set('q', q)
        return (
          <button
            key={o.value || 'all'}
            onClick={() => router.push(`/tenants?${params.toString()}`)}
            className={cn(
              'h-8 px-3 text-sm font-medium transition-colors focus-visible:outline-none',
              current === o.value
                ? 'bg-secondary text-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
