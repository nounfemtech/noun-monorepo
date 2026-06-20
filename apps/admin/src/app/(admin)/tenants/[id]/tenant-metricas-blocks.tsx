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
import type { BlocksData } from '@/app/(admin)/dashboard/dashboard-blocks'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

type PeriodKey = 'mes' | '3meses' | '6meses' | 'ano'

// ---- mock time-series (visual decoration — mesma estratégia do dashboard) ----

const GROWTH_DATA: Record<PeriodKey, { t: string; novos: number; ativos: number }[]> = {
  mes: [
    { t: 'S1', novos: 8,  ativos: 32 }, { t: 'S2', novos: 10, ativos: 36 },
    { t: 'S3', novos: 9,  ativos: 40 }, { t: 'S4', novos: 11, ativos: 48 },
  ],
  '3meses': [
    { t: 'Jan', novos: 28, ativos: 98  }, { t: 'Fev', novos: 34, ativos: 118 },
    { t: 'Mar', novos: 38, ativos: 142 },
  ],
  '6meses': [
    { t: 'Out', novos: 18, ativos: 62 }, { t: 'Nov', novos: 22, ativos: 74 },
    { t: 'Dez', novos: 26, ativos: 88 }, { t: 'Jan', novos: 28, ativos: 98 },
    { t: 'Fev', novos: 34, ativos: 118 }, { t: 'Mar', novos: 38, ativos: 142 },
  ],
  ano: [
    { t: 'Abr', novos: 10, ativos: 28 }, { t: 'Mai', novos: 13, ativos: 36 },
    { t: 'Jun', novos: 15, ativos: 44 }, { t: 'Jul', novos: 17, ativos: 54 },
    { t: 'Ago', novos: 18, ativos: 62 }, { t: 'Set', novos: 20, ativos: 72 },
    { t: 'Out', novos: 18, ativos: 70 }, { t: 'Nov', novos: 22, ativos: 82 },
    { t: 'Dez', novos: 26, ativos: 94 }, { t: 'Jan', novos: 28, ativos: 106 },
    { t: 'Fev', novos: 34, ativos: 124 }, { t: 'Mar', novos: 38, ativos: 142 },
  ],
}

const FUNNEL_DATA: Record<PeriodKey, { t: string; realizadas: number; canceladas: number }[]> = {
  mes: [
    { t: 'S1', realizadas: 14, canceladas: 2 }, { t: 'S2', realizadas: 18, canceladas: 2 },
    { t: 'S3', realizadas: 16, canceladas: 3 }, { t: 'S4', realizadas: 20, canceladas: 2 },
  ],
  '3meses': [
    { t: 'Jan', realizadas: 52, canceladas: 6 }, { t: 'Fev', realizadas: 60, canceladas: 7 },
    { t: 'Mar', realizadas: 64, canceladas: 8 },
  ],
  '6meses': [
    { t: 'Out', realizadas: 42, canceladas: 5 }, { t: 'Nov', realizadas: 48, canceladas: 5 },
    { t: 'Dez', realizadas: 56, canceladas: 6 }, { t: 'Jan', realizadas: 52, canceladas: 6 },
    { t: 'Fev', realizadas: 60, canceladas: 7 }, { t: 'Mar', realizadas: 64, canceladas: 8 },
  ],
  ano: [
    { t: 'Abr', realizadas: 32, canceladas: 4 }, { t: 'Mai', realizadas: 36, canceladas: 4 },
    { t: 'Jun', realizadas: 40, canceladas: 5 }, { t: 'Jul', realizadas: 44, canceladas: 5 },
    { t: 'Ago', realizadas: 48, canceladas: 5 }, { t: 'Set', realizadas: 50, canceladas: 6 },
    { t: 'Out', realizadas: 46, canceladas: 5 }, { t: 'Nov', realizadas: 52, canceladas: 6 },
    { t: 'Dez', realizadas: 58, canceladas: 7 }, { t: 'Jan', realizadas: 52, canceladas: 6 },
    { t: 'Fev', realizadas: 60, canceladas: 7 }, { t: 'Mar', realizadas: 64, canceladas: 8 },
  ],
}

const chartConfigGrowth = {
  novos:  { label: 'Novos pacientes',  color: 'var(--chart-1)' },
  ativos: { label: 'Pacientes ativos', color: 'var(--chart-2)' },
} satisfies ChartConfig

const chartConfigFunnel = {
  realizadas: { label: 'Realizadas', color: 'var(--chart-1)' },
  canceladas: { label: 'Canceladas', color: 'var(--chart-2)' },
} satisfies ChartConfig

const chartConfigOrders = {
  entregues: { label: 'Entregues', color: 'var(--chart-1)' },
  pendentes: { label: 'Pendentes', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function TenantMetricasBlocks({
  data,
  tenantType,
}: {
  data: BlocksData
  tenantType: 'specialist' | 'pharmacy'
}) {
  const [p1, setP1] = useState<PeriodKey>('mes')
  const [p2, setP2] = useState<PeriodKey>('mes')
  const [p3, setP3] = useState<PeriodKey>('mes')

  const [activeGrowth,  setActiveGrowth]  = useState<'novos' | 'ativos'>('novos')
  const [activeFunnel,  setActiveFunnel]  = useState<'realizadas' | 'canceladas'>('realizadas')

  const b1 = data[p1]
  const b2 = data[p2]
  const b3 = data[p3]

  const conversionRate = b2.scheduled > 0 ? Math.round((b2.completed / b2.scheduled) * 1000) / 10 : 0
  const pending        = Math.max(0, b3.orders_total - b3.orders_delivered)

  const growthTotals  = { novos: b1.new_patients,  ativos: b1.active_patients }
  const funnelTotals  = { realizadas: b2.completed, canceladas: b2.cancelled }

  const ordersData = [
    { name: 'entregues', value: b3.orders_delivered, fill: 'var(--color-entregues)' },
    { name: 'pendentes', value: pending,             fill: 'var(--color-pendentes)' },
  ]

  return (
    <>
      {/* ── Crescimento e engajamento ──────────────────────────────────────────── */}
      <Card className="!py-0">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle className="text-base">Crescimento e engajamento</CardTitle>
            <CardDescription>Evolução da base de pacientes ao longo do tempo</CardDescription>
          </div>
          <div className="flex">
            {(['novos', 'ativos'] as const).map((key) => (
              <button
                key={key}
                data-active={activeGrowth === key}
                className="relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-4"
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
                <linearGradient id="fillTenantGrowth" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#fillTenantGrowth)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Base de pacientes no período <IconTrendingUp size={16} />
          </div>
          <div className="leading-none text-muted-foreground">
            {b1.active_patients.toLocaleString('pt-BR')} pacientes ativos no período selecionado
          </div>
        </CardFooter>
      </Card>

      {/* ── Funil de consultas (apenas especialistas) ──────────────────────────── */}
      {tenantType === 'specialist' && (
        <Card className="!py-0">
          <CardHeader className="flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
              <CardTitle className="text-base">Funil de consultas</CardTitle>
              <CardDescription>Conversão de agendamentos em consultas realizadas</CardDescription>
            </div>
            <div className="flex">
              {(['realizadas', 'canceladas'] as const).map((key) => (
                <button
                  key={key}
                  data-active={activeFunnel === key}
                  className="relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-4"
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
                <Bar dataKey={activeFunnel} fill={`var(--color-${activeFunnel})`} radius={[4, 4, 0, 0]} />
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
      )}

      {/* ── Farmácia (apenas farmácias) ─────────────────────────────────────────── */}
      {tenantType === 'pharmacy' && (
        <Card className="flex flex-col">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-base">Farmácia</CardTitle>
            <CardDescription>Volume de pedidos e status de entrega</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-6 pb-0">
            <div className="flex justify-start mb-4">
              <PeriodoFilter value={p3} onChange={(v) => setP3(v as PeriodKey)} />
            </div>
            <ChartContainer config={chartConfigOrders} className="mx-auto aspect-square max-h-[280px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                <Pie data={ordersData} dataKey="value" nameKey="name" innerRadius={70} strokeWidth={5}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                              {b3.orders_total.toLocaleString('pt-BR')}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-sm">
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
      )}

    </>
  )
}
