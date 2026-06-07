import { Suspense } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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

interface EarningsRow {
  noun_fee: number | null
  appointment_id: string | null
  created_at: string
}

type TransactionItem =
  | (AppointmentRow & { kind: 'Consulta' })
  | (OrderRow & { kind: 'Pedido' })

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
  const lastTransactions: TransactionItem[] = []

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

    // Últimas transações
    const appts = (recentAppointmentsRes.data ?? []) as AppointmentRow[]
    const orders = (recentOrdersRes.data ?? []) as OrderRow[]

    const combined: TransactionItem[] = [
      ...appts.map((a) => ({ ...a, kind: 'Consulta' as const })),
      ...orders.map((o) => ({ ...o, kind: 'Pedido' as const })),
    ]
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    lastTransactions.push(...combined.slice(0, 10))

    // Chart dos últimos 6 meses
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
    // Sem dados — layout ainda exibido zerado
  }

  const totalGmv = totalGmvAppointments + totalGmvOrders
  const monthGmv = monthGmvAppointments + monthGmvOrders

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  function getStatusBadge(status: string | null, kind: string) {
    if (kind === 'Consulta') {
      switch (status) {
        case 'completed': return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Concluída</Badge>
        case 'scheduled': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Agendada</Badge>
        case 'cancelled': return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Cancelada</Badge>
        default: return <Badge variant="secondary" className="text-xs">{status ?? '—'}</Badge>
      }
    }
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Concluído</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pendente</Badge>
      case 'processing': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Processando</Badge>
      case 'cancelled': return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Cancelado</Badge>
      default: return <Badge variant="secondary" className="text-xs">{status ?? '—'}</Badge>
    }
  }

  function getTransactionValue(item: TransactionItem): number {
    if (item.kind === 'Consulta') {
      return (item as AppointmentRow).price ?? 0
    }
    return (item as OrderRow).total_price ?? 0
  }

  function getTransactionStatus(item: TransactionItem): string | null {
    return item.status
  }

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
          title="Total de pacientes"
          value={patientsCount.toLocaleString('pt-BR')}
          icon={<IconUser size={18} className="text-primary" />}
          description="Cadastrados na plataforma"
        />
        <StatsCard
          title="Profissionais ativos"
          value={professionalsCount.toLocaleString('pt-BR')}
          icon={<IconStethoscope size={18} className="text-primary" />}
          description="Médicos, nutricionistas e psicólogos"
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
            <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <RevenueChart data={chartData} />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas transações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas transações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lastTransactions.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              <div className="divide-y">
                {lastTransactions.map((item) => (
                  <div key={item.id} className="px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge
                        className={
                          item.kind === 'Consulta'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 text-xs'
                            : 'bg-orange-100 text-orange-700 border-orange-200 text-xs'
                        }
                      >
                        {item.kind}
                      </Badge>
                      <span className="text-sm font-semibold">
                        {brl.format(getTransactionValue(item))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(getTransactionStatus(item), item.kind)}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
