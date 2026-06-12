'use client'

import { useState, type ReactNode } from 'react'
import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { IconArrowRight, IconArrowUpRight } from '@tabler/icons-react'
import { useColorTheme, colors } from '@noun/ui'
import { Card, CardContent } from '@/components/ui/card'
import { PeriodoFilter } from '@/components/periodo-filter'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// ---- interfaces ----------------------------------------------------------------

export interface PharmacyRank {
  pharmacy_id: string
  pharmacy_name: string
  order_count: number
}

export interface BlockMetrics {
  new_patients: number
  active_patients: number
  scheduled: number
  completed: number
  cancelled: number
  avg_days_to_first: number | null
  orders_total: number
  orders_delivered: number
  avg_ticket: number
  top_pharmacies: PharmacyRank[]
  active_tenants: number
  earn_gmv: number
  earn_fee: number
  earn_fee_farmacia?: number
  professionals_with_schedule?: number
}

export interface BlocksData {
  mes: BlockMetrics
  '3meses': BlockMetrics
  '6meses': BlockMetrics
  ano: BlockMetrics
  retention_rate: number
  churned_tenants: number
}

type PeriodKey = 'mes' | '3meses' | '6meses' | 'ano'

// ---- mock time-series (exibido enquanto dados reais não existem) ---------------

const GROWTH_DATA: Record<PeriodKey, { t: string; novos: number; ativos: number }[]> = {
  mes: [
    { t: 'S1', novos: 58, ativos: 1680 }, { t: 'S2', novos: 62, ativos: 1710 },
    { t: 'S3', novos: 67, ativos: 1763 }, { t: 'S4', novos: 60, ativos: 1843 },
  ],
  '3meses': [
    { t: 'Jan', novos: 195, ativos: 1612 }, { t: 'Fev', novos: 218, ativos: 1710 },
    { t: 'Mar', novos: 221, ativos: 1843 },
  ],
  '6meses': [
    { t: 'Out', novos: 156, ativos: 1490 }, { t: 'Nov', novos: 178, ativos: 1563 },
    { t: 'Dez', novos: 189, ativos: 1612 }, { t: 'Jan', novos: 195, ativos: 1680 },
    { t: 'Fev', novos: 205, ativos: 1763 }, { t: 'Mar', novos: 205, ativos: 1843 },
  ],
  ano: [
    { t: 'Abr', novos: 142, ativos: 1210 }, { t: 'Mai', novos: 156, ativos: 1290 },
    { t: 'Jun', novos: 167, ativos: 1380 }, { t: 'Jul', novos: 178, ativos: 1430 },
    { t: 'Ago', novos: 185, ativos: 1490 }, { t: 'Set', novos: 189, ativos: 1563 },
    { t: 'Out', novos: 156, ativos: 1490 }, { t: 'Nov', novos: 178, ativos: 1563 },
    { t: 'Dez', novos: 210, ativos: 1636 }, { t: 'Jan', novos: 218, ativos: 1710 },
    { t: 'Fev', novos: 216, ativos: 1763 }, { t: 'Mar', novos: 221, ativos: 1843 },
  ],
}

const CONVERSION_DATA: Record<PeriodKey, { t: string; taxa: number }[]> = {
  mes: [
    { t: 'S1', taxa: 87 }, { t: 'S2', taxa: 91 },
    { t: 'S3', taxa: 88 }, { t: 'S4', taxa: 89 },
  ],
  '3meses': [{ t: 'Jan', taxa: 85 }, { t: 'Fev', taxa: 90 }, { t: 'Mar', taxa: 89 }],
  '6meses': [
    { t: 'Out', taxa: 82 }, { t: 'Nov', taxa: 84 }, { t: 'Dez', taxa: 87 },
    { t: 'Jan', taxa: 85 }, { t: 'Fev', taxa: 90 }, { t: 'Mar', taxa: 89 },
  ],
  ano: [
    { t: 'Abr', taxa: 80 }, { t: 'Mai', taxa: 78 }, { t: 'Jun', taxa: 82 },
    { t: 'Jul', taxa: 84 }, { t: 'Ago', taxa: 86 }, { t: 'Set', taxa: 87 },
    { t: 'Out', taxa: 82 }, { t: 'Nov', taxa: 84 }, { t: 'Dez', taxa: 88 },
    { t: 'Jan', taxa: 85 }, { t: 'Fev', taxa: 90 }, { t: 'Mar', taxa: 89 },
  ],
}

const TENANTS_DATA: Record<PeriodKey, { t: string; tenants: number; profis: number }[]> = {
  mes: [
    { t: 'S1', tenants: 13, profis: 41 }, { t: 'S2', tenants: 13, profis: 43 },
    { t: 'S3', tenants: 14, profis: 44 }, { t: 'S4', tenants: 14, profis: 47 },
  ],
  '3meses': [
    { t: 'Jan', tenants: 12, profis: 38 }, { t: 'Fev', tenants: 13, profis: 43 },
    { t: 'Mar', tenants: 14, profis: 47 },
  ],
  '6meses': [
    { t: 'Out', tenants: 10, profis: 31 }, { t: 'Nov', tenants: 11, profis: 35 },
    { t: 'Dez', tenants: 11, profis: 37 }, { t: 'Jan', tenants: 12, profis: 38 },
    { t: 'Fev', tenants: 13, profis: 43 }, { t: 'Mar', tenants: 14, profis: 47 },
  ],
  ano: [
    { t: 'Abr', tenants: 7, profis: 22 }, { t: 'Mai', tenants: 8, profis: 25 },
    { t: 'Jun', tenants: 9, profis: 28 }, { t: 'Jul', tenants: 9, profis: 29 },
    { t: 'Ago', tenants: 10, profis: 31 }, { t: 'Set', tenants: 10, profis: 33 },
    { t: 'Out', tenants: 10, profis: 31 }, { t: 'Nov', tenants: 11, profis: 35 },
    { t: 'Dez', tenants: 12, profis: 39 }, { t: 'Jan', tenants: 12, profis: 38 },
    { t: 'Fev', tenants: 13, profis: 43 }, { t: 'Mar', tenants: 14, profis: 47 },
  ],
}

const REVENUE_TREND: Record<PeriodKey, { t: string; clinico: number; farmacia: number }[]> = {
  mes: [
    { t: 'S1', clinico: 2100, farmacia: 750 }, { t: 'S2', clinico: 2250, farmacia: 820 },
    { t: 'S3', clinico: 2180, farmacia: 780 }, { t: 'S4', clinico: 2220, farmacia: 850 },
  ],
  '3meses': [
    { t: 'Jan', clinico: 7900, farmacia: 2800 }, { t: 'Fev', clinico: 8200, farmacia: 3000 },
    { t: 'Mar', clinico: 8650, farmacia: 3200 },
  ],
  '6meses': [
    { t: 'Out', clinico: 6400, farmacia: 2100 }, { t: 'Nov', clinico: 7100, farmacia: 2400 },
    { t: 'Dez', clinico: 7600, farmacia: 2600 }, { t: 'Jan', clinico: 7900, farmacia: 2800 },
    { t: 'Fev', clinico: 8200, farmacia: 3000 }, { t: 'Mar', clinico: 8650, farmacia: 3200 },
  ],
  ano: [
    { t: 'Abr', clinico: 4800, farmacia: 1200 }, { t: 'Mai', clinico: 5200, farmacia: 1400 },
    { t: 'Jun', clinico: 5800, farmacia: 1700 }, { t: 'Jul', clinico: 6000, farmacia: 1800 },
    { t: 'Ago', clinico: 6200, farmacia: 1900 }, { t: 'Set', clinico: 6400, farmacia: 2100 },
    { t: 'Out', clinico: 6200, farmacia: 2000 }, { t: 'Nov', clinico: 7100, farmacia: 2400 },
    { t: 'Dez', clinico: 7600, farmacia: 2600 }, { t: 'Jan', clinico: 7900, farmacia: 2800 },
    { t: 'Fev', clinico: 8200, farmacia: 3000 }, { t: 'Mar', clinico: 8650, farmacia: 3200 },
  ],
}

// ---- status semaphore ----------------------------------------------------------

type StatusLevel = 'healthy' | 'warning' | 'critical' | 'inactive'

const STATUS: Record<StatusLevel, { dot: string; badge: string; label: string }> = {
  healthy:  { dot: 'bg-green-500',  badge: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400', label: 'Saudável' },
  warning:  { dot: 'bg-yellow-400', badge: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400', label: 'Atenção' },
  critical: { dot: 'bg-red-500',    badge: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400', label: 'Crítico' },
  inactive: { dot: 'bg-border',     badge: '', label: 'Inativo' },
}

// ---- sub-components ------------------------------------------------------------

function BlockHeader({ title, description, filter }: { title: string; description: string; filter: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      {filter}
    </div>
  )
}

function ArcGauge({ pct }: { pct: number }) {
  const c = Math.min(100, Math.max(0, pct))
  const θ = Math.PI * (1 - c / 100)
  const ex = (60 + 50 * Math.cos(θ)).toFixed(2)
  const ey = (60 - 50 * Math.sin(θ)).toFixed(2)
  return (
    <svg viewBox="0 0 120 68" className="w-44 h-28" aria-hidden>
      <path d="M 10,60 A 50,50 0 0,1 110,60" fill="none" strokeLinecap="round" strokeWidth="10" style={{ stroke: 'hsl(var(--border))' }} />
      {c > 0.5 && (
        <path d={`M 10,60 A 50,50 0 0,1 ${ex},${ey}`} fill="none" strokeLinecap="round" strokeWidth="10" style={{ stroke: 'hsl(var(--primary))' }} />
      )}
    </svg>
  )
}

function SemaphoreItem({ value, label, status }: { value: string; label: string; status: StatusLevel }) {
  const s = STATUS[status]
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-5 py-4">
      <div className={cn('h-3.5 w-3.5 shrink-0 rounded-full', s.dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {s.badge
        ? <Badge variant="outline" className={cn('shrink-0 text-xs', s.badge)}>{s.label}</Badge>
        : <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">{s.label}</Badge>
      }
    </div>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  formatValue?: (v: number, name: string) => string
  labelMap?: Record<string, string>
}

function ChartTooltip({ active, payload, label, formatValue, labelMap }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-md text-sm min-w-[140px]">
      {label && <p className="font-semibold mb-1.5">{label}</p>}
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 mb-0.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: e.color }} />
          <span className="text-muted-foreground">{labelMap?.[e.name] ?? e.name}:</span>
          <span className="font-medium ml-auto pl-2">{formatValue ? formatValue(e.value, e.name) : e.value}</span>
        </div>
      ))}
    </div>
  )
}

function ColorSwatch({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
      {value && <span className="font-semibold tabular-nums ml-1">{value}</span>}
    </div>
  )
}

// ---- main component ------------------------------------------------------------

export function DashboardBlocks({
  data,
  monthProjection,
  daysElapsed,
  daysInMonth,
}: {
  data: BlocksData
  monthProjection: number
  daysElapsed: number
  daysInMonth: number
}) {
  const { primary } = useColorTheme()

  const [p1, setP1] = useState<PeriodKey>('mes')
  const [p2, setP2] = useState<PeriodKey>('mes')
  const [p3, setP3] = useState<PeriodKey>('mes')
  const [p4, setP4] = useState<PeriodKey>('mes')
  const [p5, setP5] = useState<PeriodKey>('mes')

  const b1 = data[p1]
  const b2 = data[p2]
  const b3 = data[p3]
  const b4 = data[p4]
  const b5 = data[p5]

  const conversionRate        = b2.scheduled > 0 ? Math.round((b2.completed / b2.scheduled) * 1000) / 10 : 0
  const takeRate              = b5.earn_gmv > 0  ? Math.round((b5.earn_fee / b5.earn_gmv) * 1000) / 10   : 0
  const farmaciaRevenue       = b5.earn_fee_farmacia ?? 0
  const profisWithSchedule    = b4.professionals_with_schedule ?? 0

  const tenantsStatus: StatusLevel = b4.active_tenants > 0 ? 'healthy' : 'inactive'
  const profisStatus:  StatusLevel =
    profisWithSchedule === 0 ? 'inactive' : profisWithSchedule < 3 ? 'warning' : 'healthy'
  const churnStatus:   StatusLevel = data.churned_tenants > 0 ? 'critical' : 'healthy'

  const delivered   = b3.orders_delivered
  const pending     = Math.max(0, b3.orders_total - b3.orders_delivered)
  const orderPie    = [{ name: 'entregues', value: delivered }, { name: 'pendentes', value: pending }]
  const pharmaBar   = b3.top_pharmacies.map((p) => ({ name: p.pharmacy_name, pedidos: p.order_count }))

  const totalCanal = b5.earn_fee + farmaciaRevenue || 1

  const projectionDesc: Record<PeriodKey, string> = {
    mes: `Dia ${daysElapsed} de ${daysInMonth}, estimativa ao final do mês`,
    '3meses': 'Estimativa para o mês atual, com base nos últimos 3 meses',
    '6meses': 'Estimativa para o mês atual, com base nos últimos 6 meses',
    ano: 'Estimativa para o mês atual, com base no histórico anual',
  }

  // hex colors via @noun/ui (funciona como atributos SVG em recharts)
  const c700 = colors[primary.palette][700]
  const c500 = colors[primary.palette][500]
  const c400 = colors[primary.palette][400]
  const c300 = colors[primary.palette][300]

  const tick = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

  return (
    <>
      {/* ================================================================
          BLOCO 1 — Crescimento e engajamento
          Stat row + dois AreaCharts (novos pacientes / ativos acumulados)
      ================================================================ */}
      <Card>
        <CardContent className="p-6">
          <BlockHeader
            title="Crescimento e engajamento"
            description="Evolução da base de pacientes e retenção ao longo do tempo"
            filter={<PeriodoFilter value={p1} onChange={(v) => setP1(v as PeriodKey)} />}
          />

          <div className="flex items-stretch mb-8">
            <div className="flex-1 py-3 text-center">
              <p className="text-4xl font-bold tabular-nums">{b1.new_patients.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-muted-foreground mt-1.5">Novos pacientes</p>
            </div>
            <Separator orientation="vertical" />
            <div className="flex-1 py-3 text-center">
              <p className="text-4xl font-bold tabular-nums">{data.retention_rate}%</p>
              <p className="text-sm text-muted-foreground mt-1.5">Taxa de retenção</p>
            </div>
            <Separator orientation="vertical" />
            <div className="flex-1 py-3 text-center">
              <p className="text-4xl font-bold tabular-nums">{b1.active_patients.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-muted-foreground mt-1.5">Pacientes ativos</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Novos pacientes por período</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={GROWTH_DATA[p1]} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradNovos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c500} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={c500} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  {grid}
                  <XAxis dataKey="t" tick={tick} />
                  <YAxis tick={tick} />
                  <Tooltip content={<ChartTooltip formatValue={(v) => v.toLocaleString('pt-BR')} labelMap={{ novos: 'Novos pacientes' }} />} />
                  <Area type="monotone" dataKey="novos" stroke={c500} fill="url(#gradNovos)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Pacientes ativos acumulados</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={GROWTH_DATA[p1]} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradAtivos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c700} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={c700} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  {grid}
                  <XAxis dataKey="t" tick={tick} />
                  <YAxis tick={tick} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip formatValue={(v) => v.toLocaleString('pt-BR')} labelMap={{ ativos: 'Pacientes ativos' }} />} />
                  <Area type="monotone" dataKey="ativos" stroke={c700} fill="url(#gradAtivos)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          BLOCO 2 — Funil clínico
          Funil visual + LineChart taxa de conversão
      ================================================================ */}
      <Card>
        <CardContent className="p-6">
          <BlockHeader
            title="Funil clínico"
            description="Conversão de agendamentos em consultas realizadas"
            filter={<PeriodoFilter value={p2} onChange={(v) => setP2(v as PeriodKey)} />}
          />

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground mb-3">Consultas no período</p>
              <div className="rounded-lg border overflow-hidden flex flex-col flex-1">
                <div className="flex-1 flex items-stretch min-h-[148px]">
                  <div className="flex-1 flex flex-col items-center justify-center py-9 px-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Agendadas</p>
                    <p className="text-4xl font-bold tabular-nums">{b2.scheduled.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-center justify-center gap-1 px-2">
                    <span className="text-xs font-bold text-primary leading-none">{conversionRate}%</span>
                    <IconArrowRight size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center py-9 px-4 bg-primary/5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Realizadas</p>
                    <p className="text-4xl font-bold tabular-nums">{b2.completed.toLocaleString('pt-BR')}</p>
                  </div>
                  <Separator orientation="vertical" className="mx-1" />
                  <div className="flex-1 flex flex-col items-center justify-center py-9 px-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Canceladas</p>
                    <p className="text-4xl font-bold tabular-nums text-destructive">{b2.cancelled.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="border-t bg-muted/40 px-5 py-3 flex items-center gap-2 shrink-0">
                  <p className="text-sm text-muted-foreground">Tempo médio até a 1ª consulta:</p>
                  <p className="text-sm font-semibold">
                    {b2.avg_days_to_first !== null
                      ? `${b2.avg_days_to_first.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Evolução da taxa de conversão</p>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={CONVERSION_DATA[p2]} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  {grid}
                  <XAxis dataKey="t" tick={tick} />
                  <YAxis domain={[70, 100]} tick={tick} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<ChartTooltip formatValue={(v) => `${v}%`} labelMap={{ taxa: 'Taxa de conversão' }} />} />
                  <Line type="monotone" dataKey="taxa" stroke={c500} strokeWidth={2.5} dot={{ fill: c500, r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          BLOCO 3 — Farmácia
          Stat row + Horizontal BarChart por farmácia + Donut status pedidos
      ================================================================ */}
      <Card>
        <CardContent className="p-6">
          <BlockHeader
            title="Farmácia"
            description="Volume de pedidos e performance das farmácias parceiras"
            filter={<PeriodoFilter value={p3} onChange={(v) => setP3(v as PeriodKey)} />}
          />

          <div className="flex items-stretch mb-8">
            <div className="flex-1 py-3 text-center">
              <p className="text-4xl font-bold tabular-nums">{b3.orders_total.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-muted-foreground mt-1.5">Pedidos realizados</p>
            </div>
            <Separator orientation="vertical" />
            <div className="flex-1 py-3 text-center">
              <p className="text-4xl font-bold tabular-nums">{b3.orders_delivered.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-muted-foreground mt-1.5">Pedidos entregues</p>
            </div>
            <Separator orientation="vertical" />
            <div className="flex-1 py-3 text-center">
              <p className="text-4xl font-bold tabular-nums">{brl.format(b3.avg_ticket)}</p>
              <p className="text-sm text-muted-foreground mt-1.5">Ticket médio</p>
            </div>
          </div>

          {pharmaBar.length === 0 ? (
            <div className="rounded-lg border px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma farmácia ativa no período</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Pedidos por farmácia</p>
                <ResponsiveContainer width="100%" height={Math.max(180, pharmaBar.length * 60)}>
                  <BarChart data={pharmaBar} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={tick} />
                    <YAxis type="category" dataKey="name" tick={tick} width={150} tickLine={false} axisLine={false} />
                    <Tooltip cursor={false} content={<ChartTooltip formatValue={(v) => `${v} pedidos`} labelMap={{ pedidos: 'Pedidos' }} />} />
                    <Bar dataKey="pedidos" fill={c500} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-muted-foreground">Status dos pedidos</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={orderPie} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value">
                      <Cell fill={c700} />
                      <Cell fill={c300} />
                    </Pie>
                    <Tooltip content={<ChartTooltip formatValue={(v) => v.toLocaleString('pt-BR')} labelMap={{ entregues: 'Entregues', pendentes: 'Pendentes' }} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-6">
                  <ColorSwatch color={c700} label="Entregues" value={delivered.toLocaleString('pt-BR')} />
                  <ColorSwatch color={c300} label="Pendentes" value={pending.toLocaleString('pt-BR')} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================
          BLOCO 4 — Saúde da plataforma
          Semáforos + Grouped BarChart evolução tenants/profissionais
      ================================================================ */}
      <Card>
        <CardContent className="p-6">
          <BlockHeader
            title="Saúde da plataforma"
            description="Atividade e engajamento dos tenants e profissionais cadastrados"
            filter={<PeriodoFilter value={p4} onChange={(v) => setP4(v as PeriodKey)} />}
          />

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="grid gap-3">
              <SemaphoreItem value={b4.active_tenants.toLocaleString('pt-BR')} label="Tenants ativos" status={tenantsStatus} />
              <SemaphoreItem value={profisWithSchedule.toLocaleString('pt-BR')} label="Profissionais com agenda" status={profisStatus} />
              <SemaphoreItem value={data.churned_tenants.toLocaleString('pt-BR')} label="Churn de tenants" status={churnStatus} />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Evolução de tenants e profissionais</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={TENANTS_DATA[p4]} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  {grid}
                  <XAxis dataKey="t" tick={tick} />
                  <YAxis tick={tick} />
                  <Tooltip cursor={false} content={<ChartTooltip formatValue={(v) => v.toLocaleString('pt-BR')} labelMap={{ tenants: 'Tenants', profis: 'Profissionais' }} />} />
                  <Bar dataKey="tenants" fill={c700} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="profis"  fill={c400} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-5 justify-center mt-2">
                <ColorSwatch color={c700} label="Tenants" value="" />
                <ColorSwatch color={c400} label="Profissionais" value="" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          BLOCO 5 — Financeiro avançado
          Arc gauge + barras de canal + LineChart receita por canal + Projeção
      ================================================================ */}
      <Card>
        <CardContent className="p-6">
          <BlockHeader
            title="Financeiro avançado"
            description="Take rate, receita por canal e projeção para o mês atual"
            filter={<PeriodoFilter value={p5} onChange={(v) => setP5(v as PeriodKey)} />}
          />

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Arco de take rate + barras de canal */}
            <div className="flex flex-col items-center text-center">
              <p className="text-sm font-medium text-muted-foreground">Take rate médio</p>
              <ArcGauge pct={takeRate} />
              <p className="text-5xl font-bold tabular-nums -mt-3">{takeRate}%</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
                Proporção da receita Noun sobre o GMV clínico
              </p>

              <div className="w-full mt-8 space-y-4 text-left">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">Canal clínico</span>
                    <span className="font-semibold tabular-nums">{brl.format(b5.earn_fee)}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--border))' }}>
                    <div className="h-full rounded-full" style={{ width: `${(b5.earn_fee / totalCanal) * 100}%`, backgroundColor: c700 }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">Canal farmácia</span>
                    <span className="font-semibold tabular-nums">{brl.format(farmaciaRevenue)}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--border))' }}>
                    <div className="h-full rounded-full" style={{ width: `${(farmaciaRevenue / totalCanal) * 100}%`, backgroundColor: c400 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Line chart: receita por canal ao longo do período */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Receita por canal ao longo do período</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={REVENUE_TREND[p5]} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                  {grid}
                  <XAxis dataKey="t" tick={tick} />
                  <YAxis tick={tick} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={56} />
                  <Tooltip content={<ChartTooltip formatValue={(v) => brl.format(v)} labelMap={{ clinico: 'Canal clínico', farmacia: 'Canal farmácia' }} />} />
                  <Line type="monotone" dataKey="clinico"  stroke={c700} strokeWidth={2.5} dot={{ fill: c700, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="farmacia" stroke={c400} strokeWidth={2}   dot={{ fill: c400, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-5 justify-center mt-2">
                <ColorSwatch color={c700} label="Canal clínico"  value={brl.format(b5.earn_fee)} />
                <ColorSwatch color={c400} label="Canal farmácia" value={brl.format(farmaciaRevenue)} />
              </div>
            </div>
          </div>

          {/* Projeção do mês */}
          <div className="mt-6 rounded-lg border bg-muted/30 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Projeção do mês</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {projectionDesc[p5]}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-3xl font-bold tabular-nums">{brl.format(monthProjection)}</p>
              {monthProjection > 0
                ? <IconArrowUpRight size={22} className="text-primary" />
                : <IconArrowRight   size={22} className="text-muted-foreground" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
