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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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

const MOCK_TRANSACTIONS: TransactionDisplay[] = [
  { id: 'mock-1', name: 'Dr. Ana Lima',        paymentMethod: 'Pix',     value: 250.00, date: '2026-06-05T10:30:00Z', kind: 'Consulta' },
  { id: 'mock-2', name: 'Farmácia São Lucas',  paymentMethod: 'Crédito', value: 189.90, date: '2026-06-05T08:15:00Z', kind: 'Pedido'   },
  { id: 'mock-3', name: 'Dr. Carlos Mendes',   paymentMethod: 'Pix',     value: 300.00, date: '2026-06-04T14:00:00Z', kind: 'Consulta' },
  { id: 'mock-4', name: 'Farmácia Bem Estar',  paymentMethod: 'Débito',  value: 450.50, date: '2026-06-03T16:45:00Z', kind: 'Pedido'   },
  { id: 'mock-5', name: 'Dra. Marina Costa',   paymentMethod: 'Pix',     value: 175.00, date: '2026-06-02T11:20:00Z', kind: 'Consulta' },
]

async function DashboardContent() {
  const supabase = await createSupabaseServer()

  const { start: monthStart, end: monthEnd } = getMonthRange(0)

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
  let lastTransactions: TransactionDisplay[] = MOCK_TRANSACTIONS

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
    ] = await Promise.all([
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
    ])

    patientsCount = patientsRes.count ?? 0
    professionalsCount = professionalsRes.count ?? 0
    pharmaciesCount = pharmaciesRes.count ?? 0
    appointmentsCount = appointmentsRes.count ?? 0

    totalGmvAppointments = (allAppointmentsRes.data ?? []).reduce((sum, r) => sum + (r.price ?? 0), 0)
    totalGmvOrders = (allOrdersRes.data ?? []).reduce((sum, r) => sum + (r.total_price ?? 0), 0)
    nounsRevenue = (allEarningsRes.data ?? []).reduce((sum, r) => sum + (r.noun_fee ?? 0), 0)
    monthGmvAppointments = (monthAppointmentsRes.data ?? []).reduce((sum, r) => sum + (r.price ?? 0), 0)
    monthGmvOrders = (monthOrdersRes.data ?? []).reduce((sum, r) => sum + (r.total_price ?? 0), 0)
    monthRevenue = (monthEarningsRes.data ?? []).reduce((sum, r) => sum + (r.noun_fee ?? 0), 0)

    // Últimas transações — usa mocks se não houver dados reais
    const appts = (recentAppointmentsRes.data ?? []) as AppointmentRow[]
    const orders = (recentOrdersRes.data ?? []) as OrderRow[]
    const combined: TransactionDisplay[] = [
      ...appts.map((a) => ({
        id: a.id,
        name: 'Consulta médica',
        paymentMethod: 'Pix' as const,
        value: a.price ?? 0,
        date: a.created_at,
        kind: 'Consulta' as const,
      })),
      ...orders.map((o) => ({
        id: o.id,
        name: 'Pedido farmácia',
        paymentMethod: 'Pix' as const,
        value: o.total_price ?? 0,
        date: o.created_at,
        kind: 'Pedido' as const,
      })),
    ]
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (combined.length > 0) lastTransactions = combined.slice(0, 5)

    // Chart — últimos 6 meses fixo
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
          gmvClinico: (apptRes.data ?? []).reduce((s, r) => s + (r.price ?? 0), 0),
          gmvFarmacia: (orderRes.data ?? []).reduce((s, r) => s + (r.total_price ?? 0), 0),
          receitaNoun: (earnRes.data ?? []).reduce((s, r) => s + (r.noun_fee ?? 0), 0),
        }
      })
    )
    chartData.push(...chartMonths)
  } catch {
    // usa defaults
  }

  const totalGmv = totalGmvAppointments + totalGmvOrders
  const monthGmv = monthGmvAppointments + monthGmvOrders

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm capitalize">{today}</p>
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
        {/* Gráfico */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução de GMV e Receita</CardTitle>
            <p className="text-sm text-muted-foreground">GMV por canal e receita Noun nos últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <RevenueChart data={chartData} />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas transações */}
        <Card>
          <CardHeader className="px-4">
            <CardTitle className="text-base">Últimas transações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
    </div>
  )
}

export default function DashboardPage() {
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
      <DashboardContent />
    </Suspense>
  )
}
