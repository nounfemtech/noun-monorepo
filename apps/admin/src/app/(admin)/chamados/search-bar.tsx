'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { IconSearch } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: '',             label: 'Todos'        },
  { value: 'aberto',       label: 'Abertos'      },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'resolvido',    label: 'Resolvidos'   },
]

interface SearchBarProps {
  tab: string
  currentStatus: string
  currentQ: string
}

export function SearchBar({ tab, currentStatus, currentQ }: SearchBarProps) {
  const router = useRouter()
  const [q, setQ] = useState(currentQ)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQ(currentQ) }, [currentQ])

  function push(updates: { q?: string; status?: string }) {
    const params = new URLSearchParams({ tab, page: '1' })
    const newQ      = updates.q      !== undefined ? updates.q      : q
    const newStatus = updates.status !== undefined ? updates.status : currentStatus
    if (newQ)      params.set('q',      newQ)
    if (newStatus) params.set('status', newStatus)
    router.push(`/chamados?${params.toString()}`)
  }

  function onSearchChange(value: string) {
    setQ(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => push({ q: value }), 350)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status button group */}
      <div className="flex items-center rounded-lg border bg-background p-0.5 gap-0.5">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => push({ status: opt.value })}
            className={cn(
              'px-3 py-1 text-sm rounded-md transition-colors',
              currentStatus === opt.value
                ? 'bg-foreground text-background font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Search input */}
      <div className="relative w-64">
        <IconSearch
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          placeholder="Buscar chamado..."
          value={q}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-8 pr-12 h-9 text-sm"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 select-none rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>
    </div>
  )
}
