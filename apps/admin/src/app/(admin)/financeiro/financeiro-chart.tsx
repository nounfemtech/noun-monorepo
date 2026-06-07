'use client'

import * as React from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useColorTheme, colors } from '@noun/ui'

interface ChartDataPoint {
  label: string
  gmv: number
  receitaNoun: number
}

interface FinanceiroChartProps {
  data: ChartDataPoint[]
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

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-md text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name === 'gmv' ? 'GMV' : 'Receita Noun'}:</span>
          <span className="font-medium">{brl.format(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function FinanceiroChart({ data }: FinanceiroChartProps) {
  const { primary } = useColorTheme()

  const colorGmv     = colors[primary.palette][700]
  const colorReceita = colors[primary.palette][400]

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={60} />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(value) => value === 'gmv' ? 'GMV' : 'Receita Noun'} />
        <Bar dataKey="gmv" name="gmv" fill={colorGmv} radius={[3, 3, 0, 0]} />
        <Line
          type="monotone"
          dataKey="receitaNoun"
          name="receitaNoun"
          stroke={colorReceita}
          strokeWidth={2}
          dot={{ fill: colorReceita, r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
