import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { StatsCard } from '@/components/stats-card'
import { TenantGestaoZones } from './tenant-actions'
import { NovoTenantForm, type TenantEditData } from '../novo/form'
import { TenantRevenueChart } from './tenant-revenue-chart'
import { TenantMetricasBlocks } from './tenant-metricas-blocks'
import type { BlocksData, BlockMetrics } from '@/app/(admin)/dashboard/dashboard-blocks'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Fragment } from 'react'
import { TransactionsEmpty } from '@/app/(admin)/dashboard/transactions-empty'
import { IconCreditCard } from '@tabler/icons-react'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const EMPTY_METRICS: BlockMetrics = {
  new_patients: 0, active_patients: 0, scheduled: 0, completed: 0,
  cancelled: 0, avg_days_to_first: null, orders_total: 0, orders_delivered: 0,
  avg_ticket: 0, top_pharmacies: [], active_tenants: 0, earn_gmv: 0, earn_fee: 0,
}
const EMPTY_BLOCKS: BlocksData = {
  mes: EMPTY_METRICS, '3meses': EMPTY_METRICS, '6meses': EMPTY_METRICS,
  ano: EMPTY_METRICS, retention_rate: 0, churned_tenants: 0,
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const SUBTYPE_LABELS: Record<string, string> = {
  clinico_geral:    'Clínico Geral',
  endocrinologista: 'Endocrinologista',
  ginecologista:    'Ginecologista',
  urologista:       'Urologista',
  psiquiatra:       'Psiquiatra',
  nutrologo:        'Nutrólogo',
  psicologo:        'Psicólogo',
  nutricionista:    'Nutricionista',
  farmacia:         'Farmácia',
}

function statusBadge(status: string) {
  switch (status) {
    case 'active':    return <Badge variant="success">Ativo</Badge>
    case 'suspended': return <Badge variant="destructive">Suspenso</Badge>
    case 'draft':     return <Badge variant="secondary">Rascunho</Badge>
    default:          return <Badge variant="outline">{status}</Badge>
  }
}

function PaymentIcon({ method, brand }: { method: string | null; brand: string | null }) {
  const box = 'w-12 h-8 rounded border border-border flex items-center justify-center overflow-hidden shrink-0'
  if (brand === 'visa') return (
    <div className={cn(box, 'bg-[#1A1F71]')}>
      <span className="text-white font-bold italic text-[11px] tracking-wider">VISA</span>
    </div>
  )
  if (brand === 'mastercard') return (
    <div className={cn(box, 'bg-white dark:bg-white')}>
      <svg viewBox="0 0 30 20" className="w-8 h-5" aria-label="Mastercard">
        <circle cx="11" cy="10" r="8" fill="#EB001B" />
        <circle cx="19" cy="10" r="8" fill="#F79E1B" />
      </svg>
    </div>
  )
  if (brand === 'elo') return (
    <div className={cn(box, 'bg-[#FFD100]')}>
      <span className="font-bold italic text-[11px] text-[#1D1D1B]">elo</span>
    </div>
  )
  if (brand === 'amex') return (
    <div className={cn(box, 'bg-[#007BC1]')}>
      <span className="text-white font-bold text-[10px] tracking-tight">AMEX</span>
    </div>
  )
  if (brand === 'hipercard') return (
    <div className={cn(box, 'bg-[#B11116]')}>
      <span className="text-white font-bold text-[10px]">hiper</span>
    </div>
  )
  if (method === 'pix') return (
    <div className={cn(box, 'bg-[#32BCAD]')}>
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-label="Pix">
        <path d="M12 12 L19 5 L17 3 L10 10 Z" fill="white" />
        <path d="M12 12 L19 5 L17 3 L10 10 Z" fill="white" transform="rotate(90 12 12)" />
        <path d="M12 12 L19 5 L17 3 L10 10 Z" fill="white" transform="rotate(180 12 12)" />
        <path d="M12 12 L19 5 L17 3 L10 10 Z" fill="white" transform="rotate(270 12 12)" />
      </svg>
    </div>
  )
  return (
    <div className={cn(box, 'bg-muted')}>
      <IconCreditCard className="size-4 text-muted-foreground" />
    </div>
  )
}

function paymentLabel(method: string | null, brand: string | null): string {
  const brands: Record<string, string> = {
    visa: 'Visa', mastercard: 'Mastercard', elo: 'Elo',
    amex: 'American Express', hipercard: 'Hipercard',
  }
  const b = brand ? (brands[brand] ?? '') : ''
  if (method === 'pix')    return 'Pix'
  if (method === 'credit') return `Crédito${b ? ` ${b}` : ''}`
  if (method === 'debit')  return `Débito${b ? ` ${b}` : ''}`
  return 'Consulta'
}

function paymentSubtitle(method: string | null): string {
  if (method === 'pix')    return 'Transferência instantânea'
  if (method === 'credit') return 'Cartão de crédito'
  if (method === 'debit')  return 'Cartão de débito'
  return 'Método não informado'
}

// ─── tab content ─────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  price: number
  status: string
  created_at: string
  payment_method: string | null
  card_brand: string | null
}

function MetricasTab({
  gmv, revenue, count, avg,
  chartData, lastTransactions, blocks, tenantType,
}: {
  gmv: number
  revenue: number
  count: number
  avg: number
  chartData: { month: string; gmvClinico: number; gmvFarmacia: number; receitaNoun: number }[]
  lastTransactions: Transaction[]
  blocks: BlocksData
  tenantType: 'specialist' | 'pharmacy'
}) {
  const dtFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard title="GMV acumulado"       value={brl.format(gmv)}     description="Soma de consultas concluídas" />
        <StatsCard title="Receita Noun"         value={brl.format(revenue)} description="Repasses acumulados" />
        <StatsCard title="Consultas concluídas" value={count}               description="Consultas com status concluído" />
        <StatsCard title="Ticket médio"         value={brl.format(avg)}     description="Valor médio por consulta" />
      </div>

      {/* Evolução de GMV e Receita + Últimas transações 2:1 */}
      <div className="grid grid-cols-5 gap-4 items-stretch">
        <TenantRevenueChart data={chartData} tenantType={tenantType} className="col-span-3" />

        <Card className="col-span-2 flex flex-col">
          <CardHeader className="py-4 border-b shrink-0">
            <CardTitle className="text-base">Últimas transações</CardTitle>
            <CardDescription>Consultas e pedidos mais recentes</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto min-h-0 p-0">
            {lastTransactions.length === 0 ? (
              <TransactionsEmpty />
            ) : (
              <div>
                {lastTransactions.map((tx, index) => (
                  <Fragment key={tx.id}>
                    {index > 0 && <div className="mx-6 border-t border-border" />}
                    <div className="px-6 py-3 flex items-center gap-3">
                      <PaymentIcon method={tx.payment_method} brand={tx.card_brand} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{paymentLabel(tx.payment_method, tx.card_brand)}</p>
                        <p className="text-xs text-muted-foreground">{paymentSubtitle(tx.payment_method)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">+ {brl.format(tx.price)}</p>
                        <p className="text-xs text-muted-foreground">{dtFmt.format(new Date(tx.created_at))}</p>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Blocks: Crescimento, Funil/Farmácia, Financeiro avançado */}
      <TenantMetricasBlocks data={blocks} tenantType={tenantType} />
    </div>
  )
}

function GestaoTab({ tenantId, currentStatus }: { tenantId: string; currentStatus: string }) {
  return <TenantGestaoZones tenantId={tenantId} currentStatus={currentStatus} />
}

// ─── page ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { key: 'detalhes', label: 'Detalhes' },
  { key: 'metricas', label: 'Métricas' },
  { key: 'gestao',   label: 'Gestão'   },
]

export default async function TenantDetailPage({ params, searchParams }: PageProps) {
  const { id }               = await params
  const { tab = 'detalhes' } = await searchParams

  const { profile, session } = await requireAdmin()
  const adminName = profile.full_name ?? profile.email ?? session.user.email ?? 'Admin'

  const supabase = await createSupabaseServer()

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (!tenantData) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenant = tenantData as any
  const tenantType: 'specialist' | 'pharmacy' = tenant.type === 'pharmacy' ? 'pharmacy' : 'specialist'

  const [
    appointmentsRes,
    earningsRes,
    chartRes,
    txRes,
    blocksRes,
  ] = await Promise.all([
    supabase.from('appointments').select('price').eq('tenant_id', id).eq('status', 'completed'),
    supabase.from('professional_earnings').select('noun_fee').eq('tenant_id', id),
    supabase.rpc('get_tenant_monthly_chart_data', { p_tenant_id: id }),
    supabase.rpc('get_tenant_last_transactions',  { p_tenant_id: id }),
    supabase.rpc('get_tenant_blocks_data', { p_tenant_id: id }),
  ])

  const gmvTotal          = (appointmentsRes.data ?? []).reduce((s, r) => s + (r.price ?? 0), 0)
  const nounRevenue       = (earningsRes.data ?? []).reduce((s, r) => s + (r.noun_fee ?? 0), 0)
  const appointmentsCount = appointmentsRes.data?.length ?? 0
  const avgTicket         = appointmentsCount > 0 ? gmvTotal / appointmentsCount : 0

  const MOCK_CHART_DATA = tenantType === 'pharmacy'
    ? [
        { month: 'Jan', gmvClinico: 0, gmvFarmacia: 6200,  receitaNoun: 620  },
        { month: 'Fev', gmvClinico: 0, gmvFarmacia: 7400,  receitaNoun: 740  },
        { month: 'Mar', gmvClinico: 0, gmvFarmacia: 6800,  receitaNoun: 680  },
        { month: 'Abr', gmvClinico: 0, gmvFarmacia: 9100,  receitaNoun: 910  },
        { month: 'Mai', gmvClinico: 0, gmvFarmacia: 8300,  receitaNoun: 830  },
        { month: 'Jun', gmvClinico: 0, gmvFarmacia: 10600, receitaNoun: 1060 },
      ]
    : [
        { month: 'Jan', gmvClinico: 8400,  gmvFarmacia: 0, receitaNoun: 840  },
        { month: 'Fev', gmvClinico: 10200, gmvFarmacia: 0, receitaNoun: 1020 },
        { month: 'Mar', gmvClinico: 9600,  gmvFarmacia: 0, receitaNoun: 960  },
        { month: 'Abr', gmvClinico: 12800, gmvFarmacia: 0, receitaNoun: 1280 },
        { month: 'Mai', gmvClinico: 11400, gmvFarmacia: 0, receitaNoun: 1140 },
        { month: 'Jun', gmvClinico: 14200, gmvFarmacia: 0, receitaNoun: 1420 },
      ]

  const rawChartData = (chartRes.data ?? []).map((row: {
    month_num: number; year_num: number;
    gmv_clinico: number; gmv_farmacia: number; receita_noun: number
  }) => ({
    month:       MONTH_NAMES[(row.month_num - 1) % 12],
    gmvClinico:  Number(row.gmv_clinico),
    gmvFarmacia: Number(row.gmv_farmacia),
    receitaNoun: Number(row.receita_noun),
  }))
  const hasChartData = rawChartData.some((r: { gmvClinico: number; gmvFarmacia: number; receitaNoun: number }) => r.gmvClinico > 0 || r.gmvFarmacia > 0 || r.receitaNoun > 0)
  const chartData = hasChartData ? rawChartData : MOCK_CHART_DATA

  const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'a1b2c3d4-0000-0000-0000-000000000001', price: 320, status: 'completed', created_at: '2026-06-18T14:32:00Z', payment_method: 'pix',    card_brand: null },
    { id: 'a1b2c3d4-0000-0000-0000-000000000002', price: 180, status: 'completed', created_at: '2026-06-17T10:15:00Z', payment_method: 'credit', card_brand: 'visa' },
    { id: 'a1b2c3d4-0000-0000-0000-000000000003', price: 250, status: 'completed', created_at: '2026-06-16T09:00:00Z', payment_method: 'debit',  card_brand: 'mastercard' },
  ]

  const rawTx = (txRes.data ?? []).map((row: {
    id: string; price: number; status: string; created_at: string
    payment_method: string | null; card_brand: string | null
  }) => ({
    id:             row.id,
    price:          Number(row.price),
    status:         row.status,
    created_at:     row.created_at,
    payment_method: row.payment_method,
    card_brand:     row.card_brand,
  }))
  const lastTransactions: Transaction[] = rawTx.length > 0 ? rawTx : MOCK_TRANSACTIONS

  const blocks: BlocksData = (blocksRes.data as BlocksData | null) ?? EMPTY_BLOCKS

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold">{tenant.name}</h1>
          {statusBadge(tenant.status)}
          {tenant.subtype && (
            <Badge variant="outline">
              {SUBTYPE_LABELS[tenant.subtype] ?? tenant.subtype}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          {tenant.razao_social && (
            <>
              <span>{tenant.razao_social}</span>
              <span>·</span>
            </>
          )}
          <span className="font-mono text-xs">{tenant.code}</span>
        </div>
      </div>

      {/* Tab line */}
      <div className="flex gap-6 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/tenants/${id}?tab=${t.key}`}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      {tab === 'detalhes' && (
        <NovoTenantForm
          adminName={adminName}
          initialData={tenant as unknown as TenantEditData}
          noPadding
        />
      )}
      {tab === 'metricas' && (
        <MetricasTab
          gmv={gmvTotal}
          revenue={nounRevenue}
          count={appointmentsCount}
          avg={avgTicket}
          chartData={chartData}
          lastTransactions={lastTransactions}
          blocks={blocks}
          tenantType={tenantType}
        />
      )}
      {tab === 'gestao' && <GestaoTab tenantId={id} currentStatus={tenant.status} />}
    </div>
  )
}
