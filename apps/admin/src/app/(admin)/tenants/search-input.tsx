'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconSearch } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'

export function SearchInput({ initial, status }: { initial: string; status: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initial)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      if (status) params.set('status', status)
      router.push(`/tenants?${params.toString()}`)
    }, 400)
    return () => clearTimeout(timer)
  }, [value, status, router])

  return (
    <div className="relative w-full max-w-[320px]">
      <IconSearch
        size={16}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por ID, nome, CNPJ ou data"
        className="pl-8"
      />
    </div>
  )
}
