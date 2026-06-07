import { Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { IconTicket, IconChevronRight } from '@tabler/icons-react'
import { TabFilter } from './tab-filter'

export const dynamic = 'force-dynamic'

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

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    baixa:   'bg-slate-100 text-slate-700 border-slate-200',
    media:   'bg-blue-100 text-blue-700 border-blue-200',
    alta:    'bg-orange-100 text-orange-700 border-orange-200',
    urgente: 'bg-red-100 text-red-700 border-red-200',
  }
  return <Badge className={`text-xs ${map[priority] ?? 'bg-muted'}`}>{PRIORITY_LABELS[priority] ?? priority}</Badge>
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    aberto:       'bg-yellow-100 text-yellow-700 border-yellow-200',
    em_andamento: 'bg-blue-100 text-blue-700 border-blue-200',
    resolvido:    'bg-green-100 text-green-700 border-green-200',
    fechado:      'bg-slate-100 text-slate-600 border-slate-200',
  }
  return <Badge className={`text-xs ${map[status] ?? 'bg-muted'}`}>{STATUS_LABELS[status] ?? status}</Badge>
}

interface TicketRow {
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

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

async function ChamadosContent({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = params.tab === 'usuario' ? 'usuario' : 'parceiro'

  const supabase = await createSupabaseServer()

  let tickets: TicketRow[] = []
  try {
    const { data } = await supabase
      .from('support_tickets')
      .select('id, title, category, priority, status, source, created_at, profiles(full_name), tenants(name)')
      .eq('source', tab)
      .order('created_at', { ascending: false })
    tickets = (data ?? []) as TicketRow[]
  } catch {
    // sem dados
  }

  const abertos       = tickets.filter(t => t.status === 'aberto').length
  const emAndamento   = tickets.filter(t => t.status === 'em_andamento').length
  const resolvidos    = tickets.filter(t => ['resolvido', 'fechado'].includes(t.status)).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Chamados</h1>
        <p className="text-sm text-muted-foreground">Suporte a parceiros e usuárias do app</p>
      </div>

      <TabFilter current={tab} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Abertos</p>
            <p className="text-2xl font-bold text-yellow-600">{abertos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Em andamento</p>
            <p className="text-2xl font-bold text-blue-600">{emAndamento}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Resolvidos</p>
            <p className="text-2xl font-bold text-green-600">{resolvidos}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {tab === 'parceiro' ? 'Chamados de Parceiros' : 'Chamados de Usuárias'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconTicket />
                </EmptyMedia>
                <EmptyTitle>Nenhum chamado</EmptyTitle>
                <EmptyDescription>
                  {tab === 'parceiro'
                    ? 'Chamados abertos por parceiros aparecerão aqui.'
                    : 'Chamados abertos por usuárias do app aparecerão aqui.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead>{tab === 'parceiro' ? 'Parceiro' : 'Usuária'}</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium max-w-[220px] truncate">{ticket.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ticket.tenants?.name ?? ticket.profiles?.full_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[ticket.category] ?? ticket.category}</Badge>
                    </TableCell>
                    <TableCell>{priorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{statusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Link href={`/chamados/${ticket.id}`} className="text-muted-foreground hover:text-foreground">
                        <IconChevronRight size={16} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ChamadosPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ChamadosContent {...props} />
    </Suspense>
  )
}
