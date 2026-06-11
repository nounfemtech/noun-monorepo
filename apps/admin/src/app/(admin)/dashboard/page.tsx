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
import { Card, CardContent } from '@/components/ui/card'
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
}

interface PharmacyRankRow {
  pharmacy_id: string
  pharmacy_name: string
  order_count: number
}

async function DashboardContent({
  p1, p2, p3, p4, p5,
}: {
  p1: string; p2: string; p3: string; p4: string; p5: string
}) {
  const supabase = await createSupabaseServer()

  const { start: monthStart, end: monthEnd } = getMonthRange(0)
  const { start: s1, end: e1 } = getPeriodRange(p1)
  const { start: s2, end: e2 } = getPeriodRange(p2)
  const { start: s3, end: e3 } = getPeriodRange(p3)
  const { start: s4, end: e4 } = getPeriodRange(p4)
  const { start: s5, end: e5 } = getPeriodRange(p5)

  // Existing metric defaults
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

  // BLOCO 1 defaults
  let newPatientsCount = 0
  let retentionRate = 0
  let activePatientsCount = 0

  // BLOCO 2 defaults
  let scheduledCount = 0
  let completedFunnelCount = 0
  let cancelledFunnelCount = 0
  let avgDaysToFirst: number | null = null

  // BLOCO 3 defaults
  let ordersTotal = 0
  let deliveredTotal = 0
  let avgOrderTicket = 0
  let topPharmacies: PharmacyRankRow[] = []

  // BLOCO 4 defaults
  let activeTenantsCount = 0
  let churnedTenantsCount = 0

  // BLOCO 5 defaults
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
      b1ApptPatientsRes,
      b1OrderPatientsRes,
      // BLOCO 2
      b2ScheduledRes,
      b2CompletedRes,
      b2CancelledRes,
      b2AvgDaysRes,
      // BLOCO 3
      b3OrdersCountRes,
      b3DeliveredCountRes,
      b3AvgTicketRes,
      b3TopPharmaciesRes,
      // BLOCO 4
      b4ActiveTenantsRes,
      b4ChurnedTenantsRes,
      // BLOCO 5
      b5EarningsRes,
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
      // --- BLOCO 1 (p1 range) ---
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient').gte('created_at', s1).lte('created_at', e1),
      supabase.rpc('get_retention_rate'),
      supabase.from('appointments').select('patient_id').gte('created_at', s1).lte('created_at', e1),
      supabase.from('orders').select('patient_id').gte('created_at', s1).lte('created_at', e1),
      // --- BLOCO 2 (p2 range) ---
      supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('created_at', s2).lte('created_at', e2),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', s2).lte('created_at', e2),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).in('status', ['cancelled', 'no_show']).gte('created_at', s2).lte('created_at', e2),
      supabase.rpc('get_avg_days_to_first_appt', { p_start: s2, p_end: e2 }),
      // --- BLOCO 3 (p3 range) ---
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', s3).lte('created_at', e3),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered').gte('created_at', s3).lte('created_at', e3),
      supabase.from('orders').select('total_price').gte('created_at', s3).lte('created_at', e3),
      supabase.rpc('get_top_pharmacies', { p_start: s3, p_end: e3 }),
      // --- BLOCO 4 (p4 range; churn always fixed 30-day window) ---
      supabase.rpc('get_active_tenants_count', { p_start: s4, p_end: e4 }),
      supabase.rpc('get_churned_tenants_count'),
      // --- BLOCO 5 (p5 range) ---
      supabase.from('professional_earnings').select('appointment_price, noun_fee').gte('created_at', s5).lte('created_at', e5),
    ])

    // --- Existing ---
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
        value: a.price ?? 0, date: a.created_at,
      })),
      ...orders.map((o) => ({
        id: o.id, name: 'Pedido farmácia', paymentMethod: 'Pix' as const,
        value: o.total_price ?? 0, date: o.created_at,
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

    // --- BLOCO 1 ---
    newPatientsCount = newPatientsRes.count ?? 0
    retentionRate    = Number(retentionRes.data ?? 0)

    const apptPatientSet = new Set(
      (b1ApptPatientsRes.data ?? [])
        .map((r: { patient_id: string | null }) => r.patient_id)
        .filter((id): id is string => id !== null)
    )
    const orderPatientSet = new Set(
      (b1OrderPatientsRes.data ?? [])
        .map((r: { patient_id: string | null }) => r.patient_id)
        .filter((id): id is string => id !== null)
    )
    activePatientsCount = new Set([...apptPatientSet, ...orderPatientSet]).size

    // --- BLOCO 2 ---
    scheduledCount       = b2ScheduledRes.count ?? 0
    completedFunnelCount = b2CompletedRes.count ?? 0
    cancelledFunnelCount = b2CancelledRes.count ?? 0
    avgDaysToFirst       = b2AvgDaysRes.data !== null ? Number(b2AvgDaysRes.data) : null

    // --- BLOCO 3 ---
    ordersTotal    = b3OrdersCountRes.count ?? 0
    deliveredTotal = b3DeliveredCountRes.count ?? 0
    const ticketRows = (b3AvgTicketRes.data ?? []) as Array<{ total_price: number | null }>
    avgOrderTicket = ticketRows.length > 0
      ? ticketRows.reduce((s, r) => s + (r.total_price ?? 0), 0) / ticketRows.length
      : 0
    topPharmacies = (b3TopPharmaciesRes.data ?? []) as PharmacyRankRow[]

    // --- BLOCO 4 ---
    activeTenantsCount  = Number(b4ActiveTenantsRes.data ?? 0)
    churnedTenantsCount = Number(b4ChurnedTenantsRes.data ?? 0)

    // --- BLOCO 5 ---
    const earnRows = (b5EarningsRes.data ?? []) as Array<{ appointment_price: number | null; noun_fee: number | null }>
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

  return (
    <div className="p-6 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">{today}</p>
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
          description="Clínico e farmácia"
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

      {/* BLOCO 1 — Crescimento e engajamento */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Crescimento e engajamento</h2>
          <p className="text-sm text-muted-foreground">Evolução da base de pacientes e engajamento com a plataforma</p>
          <PeriodoFilter value={p1} paramName="p1" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Novos pacientes"
            value={newPatientsCount.toLocaleString('pt-BR')}
            description="Pacientes que se cadastraram no período"
          />
          <StatsCard
            title="Taxa de retenção"
            value={`${retentionRate}%`}
            description="Pacientes com pelo menos 2 consultas concluídas"
          />
          <StatsCard
            title="Pacientes ativos"
            value={activePatientsCount.toLocaleString('pt-BR')}
            description="Com consulta ou pedido registrado no período"
          />
        </div>
      </div>

      {/* BLOCO 2 — Funil clínico */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Funil clínico</h2>
          <p className="text-sm text-muted-foreground">Acompanhamento do processo de agendamento e realização de consultas</p>
          <PeriodoFilter value={p2} paramName="p2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Consultas agendadas"
            value={scheduledCount.toLocaleString('pt-BR')}
            description="Agendamentos criados no período"
          />
          <StatsCard
            title="Consultas realizadas"
            value={completedFunnelCount.toLocaleString('pt-BR')}
            description="Agendamentos concluídos com sucesso"
          />
          <StatsCard
            title="Consultas canceladas"
            value={cancelledFunnelCount.toLocaleString('pt-BR')}
            description="Canceladas ou ausência confirmada"
          />
          <StatsCard
            title="Taxa de conversão"
            value={`${conversionRate}%`}
            description="Consultas realizadas sobre agendadas"
          />
          <StatsCard
            title="Tempo até 1a consulta"
            value={avgDaysToFirst !== null
              ? `${avgDaysToFirst.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`
              : '0 dias'}
            description="Média de dias entre cadastro e primeira consulta"
          />
        </div>
      </div>

      {/* BLOCO 3 — Farmácia */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Farmácia</h2>
          <p className="text-sm text-muted-foreground">Volume de pedidos e performance das farmácias parceiras</p>
          <PeriodoFilter value={p3} paramName="p3" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Pedidos realizados"
            value={ordersTotal.toLocaleString('pt-BR')}
            description="Pedidos feitos nas farmácias parceiras"
          />
          <StatsCard
            title="Pedidos entregues"
            value={deliveredTotal.toLocaleString('pt-BR')}
            description="Com confirmação de entrega ao paciente"
          />
          <StatsCard
            title="Ticket médio"
            value={brl.format(avgOrderTicket)}
            description="Valor médio por pedido no período"
          />
          <Card className="overflow-hidden flex flex-col">
            <CardContent className="px-4 pt-4 pb-4 flex-1">
              <p className="text-sm text-muted-foreground">Farmácias mais ativas</p>
              {topPharmacies.length === 0 ? (
                <p className="text-2xl font-bold tabular-nums mt-2">0</p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {topPharmacies.map((ph, i) => (
                    <li key={ph.pharmacy_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground shrink-0 w-3">{i + 1}</span>
                        <span className="truncate font-medium">{ph.pharmacy_name}</span>
                      </span>
                      <span className="font-semibold tabular-nums shrink-0">{ph.order_count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
            <div className="border-t bg-muted/40 px-4 py-3">
              <p className="text-sm font-semibold">Classificadas por volume de pedidos</p>
            </div>
          </Card>
        </div>
      </div>

      {/* BLOCO 4 — Saúde da plataforma */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Saúde da plataforma</h2>
          <p className="text-sm text-muted-foreground">Atividade e engajamento dos tenants cadastrados na plataforma</p>
          <PeriodoFilter value={p4} paramName="p4" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Tenants ativos"
            value={activeTenantsCount.toLocaleString('pt-BR')}
            description="Com consulta ou pedido gerado no período"
          />
          {/* TODO: tabela de disponibilidades de agenda não existe ainda */}
          <StatsCard
            title="Profissionais com agenda"
            value="0"
            description="Com horários configurados para agendamento"
          />
          <StatsCard
            title="Churn de tenants"
            value={churnedTenantsCount.toLocaleString('pt-BR')}
            description="Inativos nos últimos 30 dias"
          />
        </div>
      </div>

      {/* BLOCO 5 — Financeiro avançado */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Financeiro avançado</h2>
          <p className="text-sm text-muted-foreground">Análise detalhada de receita, take rate e projeções financeiras</p>
          <PeriodoFilter value={p5} paramName="p5" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Take rate médio"
            value={`${takeRate}%`}
            description="Proporção da receita Noun sobre o GMV clínico"
          />
          <StatsCard
            title="Receita canal clínico"
            value={brl.format(periodClinicalRevenue)}
            description="Noun fee acumulado em consultas"
          />
          {/* TODO: noun fee de pedidos de farmácia não disponível em professional_earnings */}
          <StatsCard
            title="Receita canal farmácia"
            value={brl.format(0)}
            description="Noun fee acumulado em pedidos de farmácia"
          />
          <StatsCard
            title="Projeção do mês"
            value={brl.format(monthProjection)}
            description={`Estimativa de receita ao final do mês, dia ${daysElapsed} de ${daysInMonth}`}
          />
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string; p3?: string; p4?: string; p5?: string }>
}) {
  const sp = await searchParams
  const p1 = sp.p1 ?? 'mes'
  const p2 = sp.p2 ?? 'mes'
  const p3 = sp.p3 ?? 'mes'
  const p4 = sp.p4 ?? 'mes'
  const p5 = sp.p5 ?? 'mes'

  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      }
    >
      <DashboardContent p1={p1} p2={p2} p3={p3} p4={p4} p5={p5} />
    </Suspense>
  )
}
