'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const periodos = [
  { value: 'mes',    label: 'Este mês' },
  { value: '3meses', label: 'Últimos 3 meses' },
  { value: '6meses', label: 'Últimos 6 meses' },
  { value: 'ano',    label: 'Este ano' },
]

export function PeriodoFilter({
  value,
  onChange,
  paramName = 'periodo',
  basePath: _basePath,
}: {
  value: string
  // modo client-side: troca instantânea sem roundtrip ao servidor
  onChange?: (value: string) => void
  paramName?: string
  basePath?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <div className="inline-flex border rounded-md overflow-hidden w-fit">
      {periodos.map((p, i) => (
        <button
          key={p.value}
          onClick={() => {
            if (onChange) {
              onChange(p.value)
              return
            }
            const next = new URLSearchParams(searchParams.toString())
            next.set(paramName, p.value)
            router.replace(`?${next.toString()}`, { scroll: false })
          }}
          className={cn(
            'px-3 h-8 text-sm font-medium transition-colors',
            i < periodos.length - 1 && 'border-r',
            value === p.value
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
