'use client'

import { useRouter } from 'next/navigation'
import { RefreshCcwIcon } from 'lucide-react'
import { IconReceipt } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function TransactionsEmpty() {
  const router = useRouter()
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-8">
          <IconReceipt className="size-5" />
        </EmptyMedia>
        <EmptyTitle>Nenhuma transação</EmptyTitle>
        <EmptyDescription>
          As transações recentes aparecerão aqui.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="xs" onClick={() => router.refresh()}>
          <RefreshCcwIcon />
          Atualizar
        </Button>
      </EmptyContent>
    </Empty>
  )
}
