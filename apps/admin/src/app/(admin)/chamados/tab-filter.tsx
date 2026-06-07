'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { value: 'parceiro', label: 'Parceiros' },
  { value: 'usuario',  label: 'Usuárias'  },
]

export function TabFilter({ current }: { current: string }) {
  const router = useRouter()
  return (
    <div className="inline-flex border rounded-md overflow-hidden w-fit">
      {tabs.map((t, i) => (
        <button
          key={t.value}
          onClick={() => router.push(`/chamados?tab=${t.value}`)}
          className={cn(
            'px-3 h-8 text-sm font-medium transition-colors',
            i < tabs.length - 1 && 'border-r',
            current === t.value
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
