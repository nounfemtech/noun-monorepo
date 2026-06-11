import { Suspense, Fragment } from 'react'
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
import { PeriodoFilter } from '@/components/periodo-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TransactionsEmpty } from './transactions-empty'
import { UsersMapCard, type CityPoint } from './users-map-card'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

function getMonthRange(offset = 0) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59)
  return { start: start.toISOString(), end: end.toISOString() }
}

function getMonthLabel(offset: number) {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

function getPeriodRange(periodo: string) {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  let start: Date
  switch (periodo) {
    case '3meses': start = new Date(now.getFullYear(), now.getMonth() - 2, 1); break
    case '6meses': start = new Date(now.getFullYear(), now.getMonth() - 5, 1); break
    case 'ano':    start = new Date(now.getFullYear(), 0, 1); break
    default:       start = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return { start: start.toISOString(), end: end.toISOString() }
}

function getPeriodLabel(periodo: string) {
  switch (periodo) {
    case '3meses': return 'Últimos 3 meses'
    case '6meses': return 'Últimos 6 meses'
    case 'ano':    return 'Este ano'
    default:       return 'Este mês'
  }
}

interface AppointmentRow {
  id: string
  price: number | null
  paid_at: string | null
  status: string | null
  created_at: string
  patient_id: string | null
}

interface OrderRow {
  id: string
  total_price: number | null
  status: string | null
  created_at: string
  patient_id: string | null
}

interface TransactionDisplay {
  id: string
  name: string
  paymentMethod: 'Pix' | 'Crédito' | 'Débito'
  value: number
  date: string
  kind: 'Consulta' | 'Pedido'
}

interface PharmacyRankRow {
  pharmacy_id: string
  pharmacy_name: string
  order_count: number
}

async function DashboardContent({ periodo }: { periodo: string }) {
  const supabase = await createSupabaseServer()

  const { start: monthStart, end: monthEnd } = getMonthRange(0)
  const { start: periodStart, end: periodEnd } = getPeriodRange(periodo)

  // --- Existing metric variables ---
  let patientsCount = 0
  let professionalsCount = 0
  let pharmaciesCount = 0
  let appointmentsCount = 0
  let totalGmvAppointments = 0
  let totalGmvOrders = 0
  let nounsRevenue = 0
  let monthGmvAppointments = 0
  let monthGmvOrders = 0
  let monthRevenue = 0
  const chartData: Array<{ month: string; gmvClinico: number; gmvFarmacia: number; receitaNoun: number }> = []
  let lastTransactions: TransactionDisplay[] = []
  let mapCities: CityPoint[] = []

  // --- BLOCO 1 — Crescimento e engajamento ---
  let newPatientsCount = 0
  let retentionRate = 0
  let activePatientsCount = 0

  // --- BLOCO 2 — Funil clínico ---
  let scheduledCount = 0
  let completedFunnelCount = 0
  let cancelledFunnelCount = 0
  let avgDaysToFirst: number | null = null

  // --- BLOCO 3 — Farmácia ---
  let ordersTotal = 0
  let deliveredTotal = 0
  let avgOrderTicket = 0
  let topPharmacies: PharmacyRankRow[] = []

  // --- BLOCO 4 — Saúde da plataforma ---
  let activeTenantsCount = 0
  let churnedTenantsCount = 0

  // --- BLOCO 5 — Financeiro avançado ---
  let takeRate = 0
  let periodClinicalRevenue = 0

  try {
    const [
      patientsRes,
      professionalsRes,
      pharmaciesRes,
      appointmentsRes,
      allAppointmentsRes,
      allOrdersRes,
      allEarningsRes,
      monthAppointmentsRes,
      monthOrdersRes,
      monthEarningsRes,
      recentAppointmentsRes,
      recentOrdersRes,
      cityDistRes,
      // BLOCO 1
      newPatientsRes,
      retentionRes,
      periodApptPatientsRes,
      periodOrderPatientsRes,
      // BLOCO 2
      scheduledRes,
      completedFunnelRes,
      cancelledFunnelRes,
      avgDaysRes,
      // BLOCO 3
      ordersCountRes,
      deliveredCountRes,
      avgTicketRes,
      topPharmaciesRes,
      // BLOCO 4
      activeTenantsRes,
      churnedTenantsRes,
      // BLOCO 5
      periodEarningsRes,
    ] = await Promise.all([
      // --- existing ---
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['doctor', 'nutritionist', 'psychologist', 'pharmacist']).eq('is_active', true),
      supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('type', 'pharmacy').eq('status', 'active'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('appointments').select('price').eq('status', 'completed'),
      supabase.from('orders').select('total_price').eq('status', 'completed'),
      supabase.from('professional_earnings').select('noun_fee'),
      supabase.from('appointments').select('price').eq('status', 'completed').gte('created_at', monthStart).lte('created_at', monthEnd),
      supabase.from('orders').select('total_price').eq('status', 'completed').gte('created_at', monthStart).lte('created_at', monthEnd),
      supabase.from('professional_earnings').select('noun_fee').gte('created_at', monthStart).lte('created_at', monthEnd),
      supabase.from('appointments').select('id, price, paid_at, status, created_at, patient_id').order('created_at', { ascending: false }).limit(5),
      supabase.from('orders').select('id, total_price, status, created_at, patient_id').order('created_at', { ascending: false }).limit(5),
      supabase.rpc('get_patient_city_distribution'),
      // --- BLOCO 1 ---
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient').gte('created_at', periodStart).lte('created_at', periodEnd),
      supabase.rpc('get_retention_rate'),
      supabase.from('appointments').select('patient_id').gte('created_at', periodStart).lte('created_at', periodEnd),
      supabase.from('orders').select('patient_id').gte('created_at', periodStart).lte('created_at', periodEnd),
      // --- BLOCO 2 ---
      supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('created_at', periodStart).lte('created_at', periodEnd),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', periodStart).lte('created_at', periodEnd),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).in('status', ['cancelled', 'no_show']).gte('created_at', periodStart).lte('created_at', periodEnd),
      supabase.rpc('get_avg_days_to_first_appt', { p_start: periodStart, p_end: periodEnd }),
      // --- BLOCO 3 ---
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', periodStart).lte('created_at', periodEnd),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered').gte('created_at', periodStart).lte('created_at', periodEnd),
      supabase.from('orders').select('total_price').gte('created_at', periodStart).lte('created_at', periodEnd),
      supabase.rpc('get_top_pharmacies', { p_start: periodStart, p_end: periodEnd }),
      // --- BLOCO 4 ---
      supabase.rpc('get_active_tenants_count', { p_start: periodStart, p_end: periodEnd }),
      supabase.rpc('get_churned_tenants_count'),
      // --- BLOCO 5 ---
      supabase.from('professional_earnings').select('appointment_price, noun_fee').gte('created_at', periodStart).lte('created_at', periodEnd),
    ])

    // Existing
    patientsCount      = patientsRes.count ?? 0
    professionalsCount = professionalsRes.count ?? 0
    pharmaciesCount    = pharmaciesRes.count ?? 0
    appointmentsCount  = appointmentsRes.count ?? 0

    totalGmvAppointments = (allAppointmentsRes.data ?? []).reduce((s, r) => s + (r.price ?? 0), 0)
    totalGmvOrders       = (allOrdersRes.data ?? []).reduce((s, r) => s + (r.total_price ?? 0), 0)
    nounsRevenue         = (allEarningsRes.data ?? []).reduce((s, r) => s + (r.noun_fee ?? 0), 0)
    monthGmvAppointments = (monthAppointmentsRes.data ?? []).reduce((s, r) => s + (r.price ?? 0), 0)
    monthGmvOrders       = (monthOrdersRes.data ?? []).reduce((s, r) => s + (r.total_price ?? 0), 0)
    monthRevenue         = (monthEarningsRes.data ?? []).reduce((s, r) => s + (r.noun_fee ?? 0), 0)

    const appts = (recentAppointmentsRes.data ?? []) as AppointmentRow[]
    const orders = (recentOrdersRes.data ?? []) as OrderRow[]
    const combined: TransactionDisplay[] = [
      ...appts.map((a) => ({
        id: a.id, name: 'Consulta médica', paymentMethod: 'Pix' as const,
        value: a.price ?? 0, date: a.created_at, kind: 'Consulta' as const,
      })),
      ...orders.map((o) => ({
        id: o.id, name: 'Pedido farmácia', paymentMethod: 'Pix' as const,
        value: o.total_price ?? 0, date: o.created_at, kind: 'Pedido' as const,
      })),
    ]
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    lastTransactions = combined.slice(0, 5)

    const chartMonths = await Promise.all(
      Array.from({ length: 6 }, (_, i) => 5 - i).map(async (offset) => {
        const { start, end } = getMonthRange(offset)
        const label = getMonthLabel(offset)
        const [apptRes, orderRes, earnRes] = await Promise.all([
          supabase.from('appointments').select('price').eq('status', 'completed').gte('created_at', start).lte('created_at', end),
          supabase.from('orders').select('total_price').eq('status', 'completed').gte('created_at', start).lte('created_at', end),
          supabase.from('professional_earnings').select('noun_fee').gte('created_at', start).lte('created_at', end),
        ])
        return {
          month: label.charAt(0).toUpperCase() + label.slice(1),
          gmvClinico:  (apptRes.data ?? []).reduce((s, r) => s + (r.price ?? 0), 0),
          gmvFarmacia: (orderRes.data ?? []).reduce((s, r) => s + (r.total_price ?? 0), 0),
          receitaNoun: (earnRes.data ?? []).reduce((s, r) => s + (r.noun_fee ?? 0), 0),
        }
      })
    )
    chartData.push(...chartMonths)

    mapCities = (cityDistRes.data ?? []).map((row: { city: string; state: string; user_count: number; longitude: number; latitude: number }) => ({
      city:        row.city,
      state:       row.state,
      count:       Number(row.user_count),
      coordinates: [Number(row.longitude), Number(row.latitude)] as [number, number],
    }))

    // BLOCO 1
    newPatientsCount = newPatientsRes.count ?? 0
    retentionRate    = Number(retentionRes.data ?? 0)

    const apptPatientSet = new Set(
      (periodApptPatientsRes.data ?? [])
        .map((r: { patient_id: string | null }) => r.patient_id)
        .filter((id): id is string => id !== null)
    )
    const orderPatientSet = new Set(
      (periodOrderPatientsRes.data ?? [])
        .map((r: { patient_id: string | null }) => r.patient_id)
        .filter((id): id is string => id !== null)
    )
    activePatientsCount = new Set([...apptPatientSet, ...orderPatientSet]).size

    // BLOCO 2
    scheduledCount       = scheduledRes.count ?? 0
    completedFunnelCount = completedFunnelRes.count ?? 0
    cancelledFunnelCount = cancelledFunnelRes.count ?? 0
    avgDaysToFirst       = avgDaysRes.data !== null ? Number(avgDaysRes.data) : null

    // BLOCO 3
    ordersTotal    = ordersCountRes.count ?? 0
    deliveredTotal = deliveredCountRes.count ?? 0
    const ticketRows = (avgTicketRes.data ?? []) as Array<{ total_price: number | null }>
    avgOrderTicket = ticketRows.length > 0
      ? ticketRows.reduce((s, r) => s + (r.total_price ?? 0), 0) / ticketRows.length
      : 0
    topPharmacies = (topPharmaciesRes.data ?? []) as PharmacyRankRow[]

    // BLOCO 4
    activeTenantsCount  = Number(activeTenantsRes.data ?? 0)
    churnedTenantsCount = Number(churnedTenantsRes.data ?? 0)

    // BLOCO 5
    const earnRows = (periodEarningsRes.data ?? []) as Array<{ appointment_price: number | null; noun_fee: number | null }>
    const totalApptPrice = earnRows.reduce((s, r) => s + (r.appointment_price ?? 0), 0)
    const totalNounFee   = earnRows.reduce((s, r) => s + (r.noun_fee ?? 0), 0)
    takeRate              = totalApptPrice > 0 ? Math.round((totalNounFee / totalApptPrice) * 1000) / 10 : 0
    periodClinicalRevenue = totalNounFee

  } catch {
    // usa defaults
  }

  const totalGmv = totalGmvAppointments + totalGmvOrders
  const monthGmv  = monthGmvAppointments + monthGmvOrders
  const conversionRate = scheduledCount > 0 ? Math.round((completedFunnelCount / scheduledCount) * 1000) / 10 : 0

  const now = new Date()
  const daysElapsed  = now.getDate()
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthProjection = daysElapsed > 0 ? (monthRevenue / daysElapsed) * daysInMonth : 0

  const today = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const periodLabel = getPeriodLabel(periodo)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{today}</p>
        </div>
        <PeriodoFilter value={periodo} basePath="/dashboard" />
      </div>

      {/* ROW 1 — Métricas operacionais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de usuários"
          value={patientsCount.toLocaleString('pt-BR')}
          icon={<IconUser size={18} className="text-primary" />}
          description="Cadastrados na plataforma"
        />
        <StatsCard
          title="Profissionais ativos"
          value={professionalsCount.toLocaleString('pt-BR')}
          icon={<IconStethoscope size={18} className="text-primary" />}
          description="Médico, Nutri e Psico"
        />
        <StatsCard
          title="Farmácias ativas"
          value={pharmaciesCount.toLocaleString('pt-BR')}
          icon={<IconBuildingStore size={18} className="text-primary" />}
          description="Parceiras da plataforma"
        />
        <StatsCard
          title="Consultas realizadas"
          value={appointmentsCount.toLocaleString('pt-BR')}
          icon={<IconCalendarCheck size={18} className="text-primary" />}
          description="Total de consultas concluídas"
        />
      </div>

      {/* ROW 2 — Métricas financeiras */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="GMV acumulado"
          value={brl.format(totalGmv)}
          icon={<IconTrendingUp size={18} className="text-primary" />}
          description="Volume total transacionado"
          highlight
        />
        <StatsCard
          title="Receita Noun acumulada"
          value={brl.format(nounsRevenue)}
          icon={<IconCurrencyReal size={18} className="text-primary" />}
          description="Take rate sobre GMV total"
          highlight
        />
        <StatsCard
          title="GMV este mês"
          value={brl.format(monthGmv)}
          icon={<IconCalendar size={18} className="text-primary" />}
          description="Clínico + Farmácia"
          highlight
        />
        <StatsCard
          title="Receita este mês"
          value={brl.format(monthRevenue)}
          icon={<IconCoins size={18} className="text-primary" />}
          description="Receita líquida Noun"
          highlight
        />
      </div>

      {/* ROW 3 — Gráfico + Últimas transações */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução de GMV e Receita</CardTitle>
            <p className="text-sm text-muted-foreground">GMV por canal e receita Noun nos últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4">
            <CardTitle className="text-base">Últimas transações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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

      {/* ROW 4 — Mapa de usuários por região */}
      <UsersMapCard cities={mapCities} />

      {/* BLOCO 1 — Crescimento e engajamento */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Crescimento e engajamento</h2>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Novos pacientes"
            value={newPatientsCount.toLocaleString('pt-BR')}
            description="Cadastros no período"
          />
          <StatsCard
            title="Taxa de retenção"
            value={`${retentionRate}%`}
            description="Pacientes com mais de 1 consulta concluída"
          />
          <StatsCard
            title="Pacientes ativos"
            value={activePatientsCount.toLocaleString('pt-BR')}
            description="Com consulta ou pedido no período"
          />
        </div>
      </div>

      {/* BLOCO 2 — Funil clínico */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Funil clínico</h2>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Consultas agendadas"
            value={scheduledCount.toLocaleString('pt-BR')}
            description="Total de agendamentos criados no período"
          />
          <StatsCard
            title="Consultas realizadas"
            value={completedFunnelCount.toLocaleString('pt-BR')}
            description="Status concluído no período"
          />
          <StatsCard
            title="Consultas canceladas"
            value={cancelledFunnelCount.toLocaleString('pt-BR')}
            description="Canceladas ou não comparecimento"
          />
          <StatsCard
            title="Taxa de conversão"
            value={`${conversionRate}%`}
            description="Realizadas sobre agendadas"
          />
          <StatsCard
            title="Tempo até 1a consulta"
            value={avgDaysToFirst !== null
              ? `${avgDaysToFirst.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`
              : '0 dias'}
            description="Média: cadastro até primeira consulta"
          />
        </div>
      </div>

      {/* BLOCO 3 — Farmácia */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Farmácia</h2>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Pedidos realizados"
            value={ordersTotal.toLocaleString('pt-BR')}
            description="Total de pedidos no período"
          />
          <StatsCard
            title="Pedidos entregues"
            value={deliveredTotal.toLocaleString('pt-BR')}
            description="Status entregue no período"
          />
          <StatsCard
            title="Ticket médio"
            value={brl.format(avgOrderTicket)}
            description="Valor médio por pedido"
          />
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Farmácias mais ativas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {topPharmacies.length === 0 ? (
                <p className="text-2xl font-bold tabular-nums">0</p>
              ) : (
                <ol className="space-y-2 mt-1">
                  {topPharmacies.map((p, i) => (
                    <li key={p.pharmacy_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5 truncate min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                        <span className="truncate">{p.pharmacy_name}</span>
                      </span>
                      <span className="font-semibold tabular-nums shrink-0">{p.order_count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BLOCO 4 — Saúde da plataforma */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Saúde da plataforma</h2>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Tenants ativos"
            value={activeTenantsCount.toLocaleString('pt-BR')}
            description="Com consulta ou pedido no período"
          />
          {/* TODO: tabela de agendas/disponibilidades não existe ainda */}
          <StatsCard
            title="Profissionais com agenda"
            value="0"
            description="Disponível quando agenda for implantada"
            footer="Tabela de disponibilidades pendente"
          />
          <StatsCard
            title="Churn de tenants"
            value={churnedTenantsCount.toLocaleString('pt-BR')}
            description="Sem transação nos últimos 30 dias"
          />
        </div>
      </div>

      {/* BLOCO 5 — Financeiro avançado */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Financeiro avançado</h2>
          <p className="text-sm text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Take rate médio"
            value={`${takeRate}%`}
            description="Noun fee sobre GMV clínico no período"
          />
          <StatsCard
            title="Receita canal clínico"
            value={brl.format(periodClinicalRevenue)}
            description="Noun fee em consultas no período"
          />
          {/* TODO: receita farmácia não disponível em professional_earnings */}
          <StatsCard
            title="Receita canal farmácia"
            value={brl.format(0)}
            description="Disponível quando noun fee de pedidos for implantado"
            footer="Estrutura de repasse farmácia pendente"
          />
          <StatsCard
            title="Projeção do mês"
            value={brl.format(monthProjection)}
            description={`Projeção linear, dia ${daysElapsed} de ${daysInMonth}`}
          />
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo = 'mes' } = await searchParams

  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      }
    >
      <DashboardContent periodo={periodo} />
    </Suspense>
  )
}
