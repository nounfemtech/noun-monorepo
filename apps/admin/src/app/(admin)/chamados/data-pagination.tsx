'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const PER_PAGE_OPTIONS = [10, 20, 50]

interface DataPaginationProps {
  tab: string
  q: string
  status: string
  page: number
  totalPages: number
  totalCount: number
  perPage: number
}

export function DataPagination({
  tab,
  q,
  status,
  page,
  totalPages,
  perPage,
}: DataPaginationProps) {
  const router = useRouter()

  function navigate(newPage: number, newPerPage = perPage) {
    const params = new URLSearchParams({ tab, page: String(newPage), per_page: String(newPerPage) })
    if (q)      params.set('q',      q)
    if (status) params.set('status', status)
    router.push(`/chamados?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
      {/* Per-page selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border bg-background p-0.5 gap-0.5">
          {PER_PAGE_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => navigate(1, n)}
              className={cn(
                'px-2.5 py-0.5 text-xs rounded-md transition-colors',
                perPage === n
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <span>por página</span>
      </div>

      {/* Page info + navigation */}
      <div className="flex items-center gap-3">
        <span>Página {page} de {totalPages}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate(page - 1)}
            className="h-8 gap-1.5"
          >
            <IconChevronLeft size={14} />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => navigate(page + 1)}
            className="h-8 gap-1.5"
          >
            Próxima
            <IconChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
