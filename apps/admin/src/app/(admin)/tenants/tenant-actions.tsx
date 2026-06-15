'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function TenantActions({ id, code }: { id: string; code: string }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(code)}>
          Copiar ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/tenants/${id}`)}>
          Ver
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/tenants/${id}/editar`)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="warning">Suspender</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Deletar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
