'use client'

import { useState } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Label,
  XAxis, CartesianGrid,
} from 'recharts'
import { IconTrendingUp } from '@tabler/icons-react'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { PeriodoFilter } from '@/components/periodo-filter'

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

const FUNNEL_DATA: Record<PeriodKey, { t: string; realizadas: number; canceladas: number }[]> = {
  mes: [
    { t: 'S1', realizadas: 62, canceladas: 8 },
    { t: 'S2', realizadas: 68, canceladas: 7 },
    { t: 'S3', realizadas: 70, canceladas: 9 },
    { t: 'S4', realizadas: 78, canceladas: 10 },
  ],
  '3meses': [
    { t: 'Jan', realizadas: 248, canceladas: 28 },
    { t: 'Fev', realizadas: 270, canceladas: 28 },
    { t: 'Mar', realizadas: 285, canceladas: 32 },
  ],
  '6meses': [
    { t: 'Out', realizadas: 219, canceladas: 27 },
    { t: 'Nov', realizadas: 235, canceladas: 26 },
    { t: 'Dez', realizadas: 258, canceladas: 28 },
    { t: 'Jan', realizadas: 248, canceladas: 28 },
    { t: 'Fev', realizadas: 270, canceladas: 26 },
    { t: 'Mar', realizadas: 260, canceladas: 20 },
  ],
  ano: [
    { t: 'Abr', realizadas: 189, canceladas: 19 },
    { t: 'Mai', realizadas: 195, canceladas: 20 },
    { t: 'Jun', realizadas: 210, canceladas: 20 },
    { t: 'Jul', realizadas: 218, canceladas: 22 },
    { t: 'Ago', realizadas: 228, canceladas: 23 },
    { t: 'Set', realizadas: 232, canceladas: 22 },
    { t: 'Out', realizadas: 219, canceladas: 25 },
    { t: 'Nov', realizadas: 235, canceladas: 24 },
    { t: 'Dez', realizadas: 258, canceladas: 26 },
    { t: 'Jan', realizadas: 248, canceladas: 25 },
    { t: 'Fev', realizadas: 270, canceladas: 24 },
    { t: 'Mar', realizadas: 232, canceladas: 28 },
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

// ---- chart configs (fora do componente — referências estáveis) ------------------

const chartConfigGrowth = {
  novos:  { label: 'Novos usuários',  color: 'var(--chart-1)' },
  ativos: { label: 'Usuários ativos', color: 'var(--chart-2)' },
} satisfies ChartConfig

const chartConfigFunnel = {
  realizadas: { label: 'Realizadas', color: 'var(--chart-1)' },
  canceladas: { label: 'Canceladas', color: 'var(--chart-2)' },
} satisfies ChartConfig

const chartConfigOrders = {
  entregues: { label: 'Entregues', color: 'var(--chart-1)' },
  pendentes: { label: 'Pendentes', color: 'var(--chart-2)' },
} satisfies ChartConfig

const chartConfigPlatform = {
  medicos:   { label: 'Médicos',                color: 'var(--chart-2)' },
  saude:     { label: 'Profissionais de saúde', color: 'var(--chart-1)' },
  farmacias: { label: 'Farmácias',              color: 'var(--chart-4)' },
} satisfies ChartConfig

// composição de tenants ativos por tipo (mock, varia por período)
const TENANT_TYPES: Record<PeriodKey, { medicos: number; saude: number; farmacias: number }> = {
  mes:      { medicos: 7,  saude: 4, farmacias: 3 },
  '3meses': { medicos: 9,  saude: 5, farmacias: 4 },
  '6meses': { medicos: 12, saude: 7, farmacias: 5 },
  ano:      { medicos: 16, saude: 9, farmacias: 6 },
}

const chartConfigRevenue = {
  clinico:  { label: 'Canal clínico',  color: 'var(--chart-1)' },
  farmacia: { label: 'Canal farmácia', color: 'var(--chart-2)' },
} satisfies ChartConfig

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
  const [p1, setP1] = useState<PeriodKey>('mes')
  const [p2, setP2] = useState<PeriodKey>('mes')
  const [p3, setP3] = useState<PeriodKey>('mes')
  const [p4, setP4] = useState<PeriodKey>('mes')
  const [p5, setP5] = useState<PeriodKey>('mes')

  const [activeGrowth,  setActiveGrowth]  = useState<'novos' | 'ativos'>('novos')
  const [activeFunnel,  setActiveFunnel]  = useState<'realizadas' | 'canceladas'>('realizadas')
  const [activeRevenue, setActiveRevenue] = useState<'clinico' | 'farmacia'>('clinico')

  const b1 = data[p1]
  const b2 = data[p2]
  const b3 = data[p3]
  const b5 = data[p5]

  const conversionRate     = b2.scheduled > 0 ? Math.round((b2.completed / b2.scheduled) * 1000) / 10 : 0
  const takeRate           = b5.earn_gmv > 0  ? Math.round((b5.earn_fee  / b5.earn_gmv)  * 1000) / 10 : 0
  const farmaciaRevenue    = b5.earn_fee_farmacia ?? 0
  const pending            = Math.max(0, b3.orders_total - b3.orders_delivered)

  const growthTotals  = { novos: b1.new_patients,  ativos: b1.active_patients }
  const funnelTotals  = { realizadas: b2.completed, canceladas: b2.cancelled }
  const revenueTotals = { clinico: b5.earn_fee,    farmacia: farmaciaRevenue }

  const ordersData = [
    { name: 'entregues', value: b3.orders_delivered, fill: 'var(--color-entregues)' },
    { name: 'pendentes', value: pending,             fill: 'var(--color-pendentes)' },
  ]

  const tt = TENANT_TYPES[p4]
  const platformData = [
    { name: 'medicos',   value: tt.medicos,   fill: 'var(--color-medicos)' },
    { name: 'saude',     value: tt.saude,     fill: 'var(--color-saude)' },
    { name: 'farmacias', value: tt.farmacias, fill: 'var(--color-farmacias)' },
  ]
  const platformTotal = tt.medicos + tt.saude + tt.farmacias

  return (
    <>
      {/* ================================================================
          BLOCO 1 — Crescimento e engajamento
          Area Chart - Interactive (tabs novos / ativos)
      ================================================================ */}
      <Card className="!py-0">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle className="text-base">Crescimento e engajamento</CardTitle>
            <CardDescription>
              Evolução da base de usuários e retenção ao longo do tempo
            </CardDescription>
          </div>
          <div className="flex">
            {(['novos', 'ativos'] as const).map((key) => (
              <button
                key={key}
                data-active={activeGrowth === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-4"
                onClick={() => setActiveGrowth(key)}
              >
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {chartConfigGrowth[key].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {growthTotals[key].toLocaleString('pt-BR')}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <div className="flex justify-end mb-4">
            <PeriodoFilter value={p1} onChange={(v) => setP1(v as PeriodKey)} />
          </div>
          <ChartContainer config={chartConfigGrowth} className="aspect-auto h-[250px] w-full [&_.recharts-surface]:overflow-visible">
            <AreaChart data={GROWTH_DATA[p1]} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={`var(--color-${activeGrowth})`} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={`var(--color-${activeGrowth})`} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="t" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                type="monotone"
                dataKey={activeGrowth}
                stroke={`var(--color-${activeGrowth})`}
                fill="url(#fillGrowth)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Taxa de retenção acumulada: {data.retention_rate}% <IconTrendingUp size={16} />
          </div>
          <div className="leading-none text-muted-foreground">
            Base de {b1.active_patients.toLocaleString('pt-BR')} usuários ativos no período selecionado
          </div>
        </CardFooter>
      </Card>

      {/* ================================================================
          BLOCO 2 — Funil clínico
          Bar Chart - Interactive (tabs realizadas / canceladas)
      ================================================================ */}
      <Card className="!py-0">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle className="text-base">Funil clínico</CardTitle>
            <CardDescription>
              Conversão de agendamentos em consultas realizadas
            </CardDescription>
          </div>
          <div className="flex">
            {(['realizadas', 'canceladas'] as const).map((key) => (
              <button
                key={key}
                data-active={activeFunnel === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-4"
                onClick={() => setActiveFunnel(key)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfigFunnel[key].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {funnelTotals[key].toLocaleString('pt-BR')}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <div className="flex justify-end mb-4">
            <PeriodoFilter value={p2} onChange={(v) => setP2(v as PeriodKey)} />
          </div>
          <ChartContainer config={chartConfigFunnel} className="aspect-auto h-[250px] w-full [&_.recharts-surface]:overflow-visible">
            <BarChart data={FUNNEL_DATA[p2]} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="t" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
              <Bar
                dataKey={activeFunnel}
                fill={`var(--color-${activeFunnel})`}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Taxa de conversão: {conversionRate}% <IconTrendingUp size={16} />
          </div>
          <div className="leading-none text-muted-foreground">
            Tempo médio até a 1ª consulta:{' '}
            {b2.avg_days_to_first !== null
              ? `${b2.avg_days_to_first.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`
              : 'N/A'}
          </div>
        </CardFooter>
      </Card>

      {/* ================================================================
          BLOCOS 3 e 4 — Farmácia + Saúde da plataforma (mesma linha)
      ================================================================ */}
      <div className="grid gap-6 lg:grid-cols-2">
      {/* ================================================================
          BLOCO 3 — Farmácia
          Pie Chart - Donut with Text
      ================================================================ */}
      <Card className="flex flex-col">
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-base">Farmácia</CardTitle>
          <CardDescription>
            Volume de pedidos e status das farmácias parceiras
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pt-6 pb-0">
          <div className="flex justify-start mb-4">
            <PeriodoFilter value={p3} onChange={(v) => setP3(v as PeriodKey)} />
          </div>
          <ChartContainer
            config={chartConfigOrders}
            className="mx-auto aspect-square max-h-[280px]"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
              <Pie
                data={ordersData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {b3.orders_total.toLocaleString('pt-BR')}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            pedidos
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Ticket médio: {brl.format(b3.avg_ticket)} <IconTrendingUp size={16} />
          </div>
          <div className="leading-none text-muted-foreground">
            {b3.orders_delivered.toLocaleString('pt-BR')} pedidos entregues de{' '}
            {b3.orders_total.toLocaleString('pt-BR')} realizados
          </div>
        </CardFooter>
      </Card>

      {/* ================================================================
          BLOCO 4 — Saúde da plataforma
          Pie Chart - Donut (tenants ativos por tipo)
      ================================================================ */}
      <Card className="flex flex-col">
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-base">Saúde da plataforma</CardTitle>
          <CardDescription>
            Distribuição dos tenants ativos por tipo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pt-6 pb-0">
          <div className="flex justify-start mb-4">
            <PeriodoFilter value={p4} onChange={(v) => setP4(v as PeriodKey)} />
          </div>
          <ChartContainer
            config={chartConfigPlatform}
            className="mx-auto aspect-square max-h-[280px]"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
              <Pie
                data={platformData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {platformTotal.toLocaleString('pt-BR')}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            tenants
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            {platformTotal} tenants ativos na plataforma <IconTrendingUp size={16} />
          </div>
          <div className="leading-none text-muted-foreground">
            {tt.medicos} médicos, {tt.saude} profissionais de saúde e {tt.farmacias} farmácias
          </div>
        </CardFooter>
      </Card>
      </div>

      {/* ================================================================
          BLOCO 5 — Financeiro avançado
          Line Chart - Interactive (canal clínico vs farmácia)
      ================================================================ */}
      <Card className="!py-0">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle className="text-base">Financeiro avançado</CardTitle>
            <CardDescription>
              Take rate e receita por canal ao longo do período selecionado
            </CardDescription>
          </div>
          <div className="flex">
            {(['clinico', 'farmacia'] as const).map((key) => (
              <button
                key={key}
                data-active={activeRevenue === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-4"
                onClick={() => setActiveRevenue(key)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfigRevenue[key].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {brl.format(revenueTotals[key])}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <div className="flex justify-end mb-4">
            <PeriodoFilter value={p5} onChange={(v) => setP5(v as PeriodKey)} />
          </div>
          <ChartContainer config={chartConfigRevenue} className="aspect-auto h-[250px] w-full [&_.recharts-surface]:overflow-visible">
            <AreaChart data={REVENUE_TREND[p5]} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={`var(--color-${activeRevenue})`} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={`var(--color-${activeRevenue})`} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="t" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                type="monotone"
                dataKey={activeRevenue}
                stroke={`var(--color-${activeRevenue})`}
                fill="url(#fillRevenue)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Take rate médio: {takeRate}% <IconTrendingUp size={16} />
          </div>
          <div className="leading-none text-muted-foreground">
            Projeção do mês: {brl.format(monthProjection)} (dia {daysElapsed} de {daysInMonth})
          </div>
        </CardFooter>
      </Card>
    </>
  )
}
