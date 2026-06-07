'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { value: 'usuario',       label: 'Usuários'       },
  { value: 'farmacia',      label: 'Farmácias'      },
  { value: 'medico',        label: 'Médicos'        },
  { value: 'psicologo',     label: 'Psicólogos'     },
  { value: 'nutricionista', label: 'Nutricionistas' },
]

export function TabFilter({ current }: { current: string }) {
  const router = useRouter()
  return (
    <div className="flex items-center border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => router.push(`/chamados?tab=${t.value}`)}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium px-3 h-10 border-b-2 -mb-px transition-colors focus-visible:outline-none',
            current === t.value
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
