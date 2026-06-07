'use client'

import * as React from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useColorTheme, colors } from '@noun/ui'

interface RevenueDataPoint {
  month: string
  gmvClinico: number
  gmvFarmacia: number
  receitaNoun: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatYAxis(value: number): string {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`
  return `R$${value}`
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

const SERIES_LABELS: Record<string, string> = {
  gmvClinico:  'GMV Clínico',
  gmvFarmacia: 'GMV Farmácia',
  receitaNoun: 'Receita Noun',
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-md text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{SERIES_LABELS[entry.name] ?? entry.name}:</span>
          <span className="font-medium">{brl.format(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data }: RevenueChartProps) {
  const { primary } = useColorTheme()

  const colorClinico  = colors[primary.palette][700]
  const colorFarmacia = colors[primary.palette][400]
  const colorReceita  = colors[primary.palette][600]

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={60} />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(value) => SERIES_LABELS[value] ?? value} />
        <Bar dataKey="gmvClinico"  name="gmvClinico"  fill={colorClinico}  radius={[3, 3, 0, 0]} />
        <Bar dataKey="gmvFarmacia" name="gmvFarmacia" fill={colorFarmacia} radius={[3, 3, 0, 0]} />
        <Bar dataKey="receitaNoun" name="receitaNoun" fill={colorReceita}  radius={[3, 3, 0, 0]} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
