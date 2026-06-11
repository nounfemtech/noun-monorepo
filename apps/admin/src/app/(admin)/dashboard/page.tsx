import { Fragment } from 'react'
import {
  IconUser,
  IconStethoscope,
  IconBuildingStore,
  IconCalendarCheck,
  IconTrendingUp,
  IconCurrencyReal,
  IconCalendar,
  IconCoins,
} from '@tabler/icons-react'
import { createSupabaseServer } from '@/lib/supabase-server'
import { StatsCard } from '@/components/stats-card'
import { RevenueChart } from '@/components/revenue-chart'
import { Card, CardContent } from '@/components/ui/card'
import { TransactionsEmpty } from './transactions-empty'
import { UsersMapCard, type CityPoint } from './users-map-card'
import { DashboardBlocks, type BlocksData, type BlockMetrics } from './dashboard-blocks'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

interface AppointmentRow {
  id: string
  price: number | null
  created_at: string
}

interface OrderRow {
  id: string
  total_price: number | null
  created_at: string
}

interface TransactionDisplay {
  id: string
  name: string
  paymentMethod: 'Pix' | 'Crédito' | 'Débito'
  value: number
  date: string
}

interface ChartRow {
  month_num: number
  year_num: number
  gmv_clinico: number
  gmv_farmacia: number
  receita_noun: number
}

interface KpiJson {
  gmv_appointments: number
  gmv_orders: number
  noun_revenue: number
}

interface SummaryJson {
  patients: number
  professionals: number
  pharmacies: number
  appointments_completed: number
  alltime: KpiJson
  month: KpiJson
}

const EMPTY_METRICS: BlockMetrics = {
  new_patients: 0,
  active_patients: 0,
  scheduled: 0,
  completed: 0,
  cancelled: 0,
  avg_days_to_first: null,
  orders_total: 0,
  orders_delivered: 0,
  avg_ticket: 0,
  top_pharmacies: [],
  active_tenants: 0,
  earn_gmv: 0,
  earn_fee: 0,
}

const EMPTY_BLOCKS: BlocksData = {
  mes: EMPTY_METRICS,
  '3meses': EMPTY_METRICS,
  '6meses': EMPTY_METRICS,
  ano: EMPTY_METRICS,
  retention_rate: 0,
  churned_tenants: 0,
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()

  let patientsCount = 0
  let professionalsCount = 0
  let pharmaciesCount = 0
  let appointmentsCount = 0
  let totalGmv = 0
  let nounsRevenue = 0
  let monthGmv = 0
  let monthRevenue = 0
  const chartData: Array<{ month: string; gmvClinico: number; gmvFarmacia: number; receitaNoun: number }> = []
  let lastTransactions: TransactionDisplay[] = []
  let mapCities: CityPoint[] = []
  let blocks: BlocksData = EMPTY_BLOCKS

  try {
    const [
      summaryRes,
      chartRes,
      blocksRes,
      recentAppointmentsRes,
      recentOrdersRes,
      cityDistRes,
    ] = await Promise.all([
      // contadores + KPIs financeiros (acumulado e mês) em 1 chamada
      supabase.rpc('get_dashboard_summary'),
      // 6 meses de GMV/receita em 1 chamada
      supabase.rpc('get_monthly_chart_data'),
      // métricas dos 5 blocos para os 4 períodos em 1 chamada
      supabase.rpc('get_dashboard_blocks'),
      supabase.from('appointments').select('id, price, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('orders').select('id, total_price, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.rpc('get_patient_city_distribution'),
    ])

    const summary = summaryRes.data as SummaryJson | null
    if (summary) {
      patientsCount      = Number(summary.patients)
      professionalsCount = Number(summary.professionals)
      pharmaciesCount    = Number(summary.pharmacies)
      appointmentsCount  = Number(summary.appointments_completed)
      totalGmv     = Number(summary.alltime.gmv_appointments) + Number(summary.alltime.gmv_orders)
      nounsRevenue = Number(summary.alltime.noun_revenue)
      monthGmv     = Number(summary.month.gmv_appointments) + Number(summary.month.gmv_orders)
      monthRevenue = Number(summary.month.noun_revenue)
    }

    chartData.push(...((chartRes.data ?? []) as ChartRow[]).map((row) => {
      const d = new Date(row.year_num, row.month_num - 1, 1)
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      return {
        month:       label.charAt(0).toUpperCase() + label.slice(1),
        gmvClinico:  Number(row.gmv_clinico),
        gmvFarmacia: Number(row.gmv_farmacia),
        receitaNoun: Number(row.receita_noun),
      }
    }))

    if (blocksRes.data) {
      blocks = blocksRes.data as BlocksData
    }

    const appts  = (recentAppointmentsRes.data ?? []) as AppointmentRow[]
    const orders = (recentOrdersRes.data ?? []) as OrderRow[]
    const combined: TransactionDisplay[] = [
      ...appts.map((a) => ({ id: a.id, name: 'Consulta médica', paymentMethod: 'Pix' as const, value: a.price ?? 0, date: a.created_at })),
      ...orders.map((o) => ({ id: o.id, name: 'Pedido farmácia', paymentMethod: 'Pix' as const, value: o.total_price ?? 0, date: o.created_at })),
    ]
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    lastTransactions = combined.slice(0, 5)

    mapCities = (cityDistRes.data ?? []).map((row: { city: string; state: string; user_count: number; longitude: number; latitude: number }) => ({
      city:        row.city,
      state:       row.state,
      count:       Number(row.user_count),
      coordinates: [Number(row.longitude), Number(row.latitude)] as [number, number],
    }))
  } catch {
    // usa defaults
  }

  const now = new Date()
  const daysElapsed     = now.getDate()
  const daysInMonth     = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthProjection = daysElapsed > 0 ? (monthRevenue / daysElapsed) * daysInMonth : 0

  const today = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="p-6 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">{today}</p>
      </div>

      {/* ROW 1 — Métricas operacionais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total de usuários"     value={patientsCount.toLocaleString('pt-BR')}      icon={<IconUser          size={18} className="text-primary" />} description="Cadastrados na plataforma" />
        <StatsCard title="Profissionais ativos"  value={professionalsCount.toLocaleString('pt-BR')} icon={<IconStethoscope   size={18} className="text-primary" />} description="Médico, Nutri e Psico" />
        <StatsCard title="Farmácias ativas"      value={pharmaciesCount.toLocaleString('pt-BR')}    icon={<IconBuildingStore size={18} className="text-primary" />} description="Parceiras da plataforma" />
        <StatsCard title="Consultas realizadas"  value={appointmentsCount.toLocaleString('pt-BR')}  icon={<IconCalendarCheck size={18} className="text-primary" />} description="Total de consultas concluídas" />
      </div>

      {/* ROW 2 — Métricas financeiras */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="GMV acumulado"          value={brl.format(totalGmv)}     icon={<IconTrendingUp   size={18} className="text-primary" />} description="Volume total transacionado" highlight />
        <StatsCard title="Receita Noun acumulada" value={brl.format(nounsRevenue)} icon={<IconCurrencyReal size={18} className="text-primary" />} description="Take rate sobre GMV total" highlight />
        <StatsCard title="GMV este mês"           value={brl.format(monthGmv)}     icon={<IconCalendar     size={18} className="text-primary" />} description="Clínico e farmácia" highlight />
        <StatsCard title="Receita este mês"       value={brl.format(monthRevenue)} icon={<IconCoins        size={18} className="text-primary" />} description="Receita líquida Noun" highlight />
      </div>

      {/* ROW 3 — Gráfico + Últimas transações */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <p className="text-base font-semibold">Evolução de GMV e Receita</p>
            <p className="text-sm text-muted-foreground mb-4">GMV por canal e receita Noun nos últimos 6 meses</p>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <p className="text-base font-semibold px-4 pt-4 pb-3">Últimas transações</p>
            {lastTransactions.length === 0 ? <TransactionsEmpty /> : null}
            <div>
              {lastTransactions.map((item, index) => (
                <Fragment key={item.id}>
                  {index > 0 && <div className="mx-4 border-t border-border" />}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.paymentMethod}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{brl.format(item.value)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(item.date)}</p>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 4 — Mapa */}
      <UsersMapCard cities={mapCities} />

      {/* BLOCOS 1 a 5 — filtros client-side com dados pré-computados */}
      <DashboardBlocks
        data={blocks}
        monthProjection={monthProjection}
        daysElapsed={daysElapsed}
        daysInMonth={daysInMonth}
      />
    </div>
  )
}
