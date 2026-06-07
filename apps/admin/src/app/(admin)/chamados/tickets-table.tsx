'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { IconTicket, IconChevronRight } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  financeiro: 'Financeiro',
  tecnico:    'Técnico',
  duvida:     'Dúvida',
  outro:      'Outro',
}

const PRIORITY_LABELS: Record<string, string> = {
  baixa:   'Baixa',
  media:   'Média',
  alta:    'Alta',
  urgente: 'Urgente',
}

const STATUS_LABELS: Record<string, string> = {
  aberto:        'Aberto',
  em_andamento:  'Em andamento',
  resolvido:     'Resolvido',
  fechado:       'Fechado',
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls: Record<string, string> = {
    baixa:   'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    media:   'bg-blue-100  text-blue-700  border-blue-200  dark:bg-blue-900  dark:text-blue-300  dark:border-blue-800',
    alta:    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800',
    urgente: 'bg-red-100   text-red-700   border-red-200   dark:bg-red-900   dark:text-red-300   dark:border-red-800',
  }
  return (
    <Badge className={cn('text-xs', cls[priority] ?? 'bg-muted')}>
      {PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    aberto:       'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800',
    em_andamento: 'bg-blue-100   text-blue-700   border-blue-200   dark:bg-blue-900  dark:text-blue-300  dark:border-blue-800',
    resolvido:    'bg-green-100  text-green-700  border-green-200  dark:bg-green-900 dark:text-green-300 dark:border-green-800',
    fechado:      'bg-slate-100  text-slate-600  border-slate-200  dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  }
  return (
    <Badge className={cn('text-xs', cls[status] ?? 'bg-muted')}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

export interface TicketRow {
  id: string
  title: string
  category: string
  priority: string
  status: string
  source: string
  created_at: string
  profiles: { full_name: string | null } | null
  tenants:   { name: string } | null
}

interface TicketsTableProps {
  tickets: TicketRow[]
  tabLabel: string
}

export function TicketsTable({ tickets, tabLabel }: TicketsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allSelected  = tickets.length > 0 && selected.size === tickets.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(tickets.map(t => t.id)))
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (tickets.length === 0) {
    return (
      <Empty className="py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon"><IconTicket /></EmptyMedia>
          <EmptyTitle>Nenhum chamado</EmptyTitle>
          <EmptyDescription>
            Chamados de {tabLabel.toLowerCase()} aparecerão aqui.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 pl-4">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={toggleAll}
              aria-label="Selecionar todos"
            />
          </TableHead>
          <TableHead>Assunto</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Abertura</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map(ticket => (
          <TableRow
            key={ticket.id}
            className={cn(
              'hover:bg-muted/50',
              selected.has(ticket.id) && 'bg-muted/40',
            )}
          >
            <TableCell className="pl-4" onClick={e => e.stopPropagation()}>
              <Checkbox
                checked={selected.has(ticket.id)}
                onCheckedChange={() => toggle(ticket.id)}
                aria-label={`Selecionar ${ticket.title}`}
              />
            </TableCell>
            <TableCell className="font-medium max-w-[240px] truncate">
              {ticket.title}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
              {ticket.tenants?.name ?? ticket.profiles?.full_name ?? '—'}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">
                {CATEGORY_LABELS[ticket.category] ?? ticket.category}
              </Badge>
            </TableCell>
            <TableCell>
              <PriorityBadge priority={ticket.priority} />
            </TableCell>
            <TableCell>
              <StatusBadge status={ticket.status} />
            </TableCell>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell>
              <Link
                href={`/chamados/${ticket.id}`}
                className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <IconChevronRight size={16} />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
