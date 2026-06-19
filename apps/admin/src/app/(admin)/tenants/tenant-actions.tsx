'use client'

import { useRouter } from 'next/navigation'
import { IconEye, IconCopy } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function TenantActions({ id, code }: { id: string; code: string }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(code)}>
            <IconCopy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copiar ID</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/tenants/${id}`)}>
            <IconEye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ver</TooltipContent>
      </Tooltip>
    </div>
  )
}
