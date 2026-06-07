import { Suspense } from 'react'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/stats-card'
import { TabFilter } from './tab-filter'
import { SearchBar } from './search-bar'
import { TicketsTable, type TicketRow } from './tickets-table'
import { DataPagination } from './data-pagination'

export const dynamic = 'force-dynamic'

const VALID_TABS = ['usuario', 'farmacia', 'medico', 'psicologo', 'nutricionista'] as const
type TabValue = typeof VALID_TABS[number]

const TAB_LABELS: Record<TabValue, string> = {
  usuario:       'Usuários',
  farmacia:      'Farmácias',
  medico:        'Médicos',
  psicologo:     'Psicólogos',
  nutricionista: 'Nutricionistas',
}

interface PageProps {
  searchParams: Promise<{
    tab?:      string
    q?:        string
    status?:   string
    page?:     string
    per_page?: string
  }>
}

async function ChamadosContent({ searchParams }: PageProps) {
  const params  = await searchParams
  const tab: TabValue = VALID_TABS.includes(params.tab as TabValue)
    ? (params.tab as TabValue)
    : 'usuario'

  const q       = params.q ?? ''
  const status  = params.status ?? ''
  const page    = Math.max(1, parseInt(params.page    ?? '1',  10))
  const perPage = [10, 20, 50].includes(parseInt(params.per_page ?? '10', 10))
    ? parseInt(params.per_page ?? '10', 10)
    : 10
  const offset  = (page - 1) * perPage

  const supabase = await createSupabaseServer()

  // Paginated + filtered query
  let query = supabase
    .from('support_tickets')
    .select(
      'id, title, category, priority, status, source, created_at, profiles(full_name), tenants(name)',
      { count: 'exact' },
    )
    .eq('source', tab)

  if (q)      query = query.ilike('title', `%${q}%`)
  if (status) query = query.eq('status', status)

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  const tickets    = (data ?? []) as unknown as TicketRow[]
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))

  // Stats always show full source totals (unaffected by search/status filter)
  const { data: statsRaw } = await supabase
    .from('support_tickets')
    .select('status')
    .eq('source', tab)

  const all         = statsRaw ?? []
  const abertos     = all.filter(t => t.status === 'aberto').length
  const emAndamento = all.filter(t => t.status === 'em_andamento').length
  const resolvidos  = all.filter(t => ['resolvido', 'fechado'].includes(t.status)).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Chamados</h1>
        <p className="text-sm text-muted-foreground">Suporte a usuários e profissionais de saúde</p>
      </div>

      <TabFilter current={tab} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Abertos"       value={abertos}     description="Aguardando atendimento"    />
        <StatsCard title="Em andamento"  value={emAndamento} description="Em tratamento pela equipe" />
        <StatsCard title="Resolvidos"    value={resolvidos}  description="Chamados concluídos"       />
      </div>

      {/* Table card */}
      <Card>
        {/* Title + count badge */}
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              Chamados de {TAB_LABELS[tab]}
            </CardTitle>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
              {totalCount}
            </span>
          </div>
        </CardHeader>

        {/* Filter bar */}
        <div className="px-6 pb-4">
          <SearchBar tab={tab} currentStatus={status} currentQ={q} />
        </div>

        {/* Table */}
        <div className="border-t">
          <TicketsTable tickets={tickets} tabLabel={TAB_LABELS[tab]} />
        </div>

        {/* Pagination */}
        <DataPagination
          tab={tab}
          q={q}
          status={status}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          perPage={perPage}
        />
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
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <ChamadosContent {...props} />
    </Suspense>
  )
}
