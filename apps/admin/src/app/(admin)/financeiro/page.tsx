import { Suspense } from 'react'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PeriodoFilter } from './periodo-filter'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  IconCurrencyReal,
  IconTrendingUp,
  IconChartBar,
  IconReceipt,
} from '@tabler/icons-react'
import { StatsCard } from '@/components/stats-card'
import { FinanceiroChart } from './financeiro-chart'
import { ExportCSVButton } from './export-csv-button'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function getDateRange(periodo: string, fromParam?: string, toParam?: string): { from: string; to: string; label: string } {
  const now = new Date()

  if (periodo === 'custom' && fromParam && toParam) {
    return { from: fromParam, to: toParam, label: 'Período personalizado' }
  }

  let from: Date
  let label: string

  switch (periodo) {
    case '3meses':
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      label = 'Últimos 3 meses'
      break
    case '6meses':
      from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      label = 'Últimos 6 meses'
      break
    case 'ano':
      from = new Date(now.getFullYear(), 0, 1)
      label = 'Este ano'
      break
    default: // mes
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      label = 'Este mês'
  }

  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    label,
  }
}

interface EarningsRow {
  noun_fee: number | null
  appointment_price: number | null
  tenant_id: string | null
  created_at: string
}

interface TenantRow {
  id: string
  name: string
  type: string
}

interface TenantBreakdown {
  id: string
  name: string
  type: string
  gmv: number
  commission: number
  nounRevenue: number
  transactions: number
}

interface ChartDataPoint {
  label: string
  gmv: number
  receitaNoun: number
}

interface PageProps {
  searchParams: Promise<{ periodo?: string; from?: string; to?: string }>
}

async function FinanceiroContent({ searchParams }: PageProps) {
  const params = await searchParams
  const periodo = params.periodo ?? 'mes'
  const { from: fromDate, to: toDate, label: periodoLabel } = getDateRange(
    periodo,
    params.from,
    params.to
  )

  const supabase = await createSupabaseServer()

  let earningsData: EarningsRow[] = []
  let tenants: TenantRow[] = []

  try {
    const [earningsRes, tenantsRes] = await Promise.all([
      supabase
        .from('professional_earnings')
        .select('noun_fee, appointment_price, tenant_id, created_at')
        .gte('created_at', fromDate)
        .lte('created_at', toDate),
      supabase.from('tenants').select('id, name, type'),
    ])
    earningsData = (earningsRes.data ?? []) as EarningsRow[]
    tenants = (tenantsRes.data ?? []) as TenantRow[]
  } catch {
    // sem dados
  }

  const totalGmv = earningsData.reduce((s, r) => s + (r.appointment_price ?? 0), 0)
  const totalNounRevenue = earningsData.reduce((s, r) => s + (r.noun_fee ?? 0), 0)
  const totalTransactions = earningsData.length
  const avgTakeRate = totalGmv > 0 ? (totalNounRevenue / totalGmv) * 100 : 0

  // Breakdown por tenant
  const tenantMap = new Map<string, TenantBreakdown>()
  for (const t of tenants) {
    tenantMap.set(t.id, { id: t.id, name: t.name, type: t.type, gmv: 0, commission: 0, nounRevenue: 0, transactions: 0 })
  }
  for (const row of earningsData) {
    if (!row.tenant_id) continue
    if (!tenantMap.has(row.tenant_id)) continue
    const entry = tenantMap.get(row.tenant_id)!
    entry.gmv += row.appointment_price ?? 0
    entry.nounRevenue += row.noun_fee ?? 0
    entry.commission += (row.noun_fee ?? 0)
    entry.transactions += 1
  }
  const breakdown = Array.from(tenantMap.values())
    .filter((t) => t.transactions > 0)
    .sort((a, b) => b.gmv - a.gmv)

  // Chart data — agrupa por semana/mês
  const chartDataMap = new Map<string, { gmv: number; receitaNoun: number }>()
  for (const row of earningsData) {
    const d = new Date(row.created_at)
    const key = periodo === 'mes'
      ? `Sem ${Math.ceil(d.getDate() / 7)}`
      : d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    if (!chartDataMap.has(key)) chartDataMap.set(key, { gmv: 0, receitaNoun: 0 })
    const entry = chartDataMap.get(key)!
    entry.gmv += row.appointment_price ?? 0
    entry.receitaNoun += row.noun_fee ?? 0
  }
  const chartData: ChartDataPoint[] = Array.from(chartDataMap.entries())
    .map(([label, val]) => ({ label, ...val }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground text-sm">Receita e transações da plataforma</p>
        </div>
        <ExportCSVButton data={breakdown} />
      </div>

      {/* Seletor de período */}
      <PeriodoFilter value={periodo} />

      {/* Cards métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="GMV total"
          value={brl.format(totalGmv)}
          icon={<IconTrendingUp size={18} className="text-primary" />}
          description="Volume de consultas"
          highlight
        />
        <StatsCard
          title="Receita Noun"
          value={brl.format(totalNounRevenue)}
          icon={<IconCurrencyReal size={18} className="text-primary" />}
          description="Take rate sobre GMV"
          highlight
        />
        <StatsCard
          title="Take rate médio"
          value={`${avgTakeRate.toFixed(1)}%`}
          icon={<IconChartBar size={18} className="text-primary" />}
          description="Percentual médio de comissão"
          highlight
        />
        <StatsCard
          title="Nº transações"
          value={totalTransactions.toLocaleString('pt-BR')}
          icon={<IconReceipt size={18} className="text-primary" />}
          description="Registros de earnings"
          highlight
        />
      </div>

      {/* Gráfico */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução no período</CardTitle>
          </CardHeader>
          <CardContent>
            <FinanceiroChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Breakdown por tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown por tenant</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {breakdown.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma transação no período selecionado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">GMV</TableHead>
                  <TableHead className="text-right">Receita Noun</TableHead>
                  <TableHead className="text-right">Take rate</TableHead>
                  <TableHead className="text-right">Transações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/tenants/${t.id}`} className="font-medium hover:underline">
                        {t.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          t.type === 'clinic'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 text-xs'
                            : 'bg-orange-100 text-orange-700 border-orange-200 text-xs'
                        }
                      >
                        {t.type === 'clinic' ? 'Clínica' : 'Farmácia'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{brl.format(t.gmv)}</TableCell>
                    <TableCell className="text-right font-medium text-violet-700">
                      {brl.format(t.nounRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.gmv > 0 ? `${((t.nounRevenue / t.gmv) * 100).toFixed(1)}%` : '—'}
                    </TableCell>
                    <TableCell className="text-right">{t.transactions}</TableCell>
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

export default function FinanceiroPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <FinanceiroContent {...props} />
    </Suspense>
  )
}
