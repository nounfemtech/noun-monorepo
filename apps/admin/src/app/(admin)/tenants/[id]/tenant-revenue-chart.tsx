'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { IconTrendingUp } from '@tabler/icons-react'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface DataPoint {
  month: string
  gmvClinico: number
  gmvFarmacia: number
  receitaNoun: number
}

const specialistConfig: ChartConfig = {
  gmvClinico:  { label: 'GMV Especialista', color: 'var(--chart-1)' },
  receitaNoun: { label: 'Receita Noun',     color: 'var(--chart-5)' },
}

const pharmacyConfig: ChartConfig = {
  gmvFarmacia: { label: 'GMV Farmácia', color: 'var(--chart-1)' },
  receitaNoun: { label: 'Receita Noun', color: 'var(--chart-5)' },
}

export function TenantRevenueChart({
  data,
  tenantType,
  className,
}: {
  data: DataPoint[]
  tenantType: 'specialist' | 'pharmacy'
  className?: string
}) {
  const isPharmacy   = tenantType === 'pharmacy'
  const chartConfig  = isPharmacy ? pharmacyConfig : specialistConfig
  const gmvKey       = isPharmacy ? 'gmvFarmacia' : 'gmvClinico'

  return (
    <Card className={className}>
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-base">Evolução de GMV e Receita</CardTitle>
        <CardDescription>
          {isPharmacy ? 'GMV de farmácia' : 'GMV especialista'} e receita Noun nos últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey={gmvKey}      fill={`var(--color-${gmvKey})`} radius={[3, 3, 0, 0]} />
            <Bar dataKey="receitaNoun" fill="var(--color-receitaNoun)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Receita cresce junto ao GMV <IconTrendingUp size={16} />
        </div>
        <div className="leading-none text-muted-foreground">
          Volume acumulado dos últimos 6 meses
        </div>
      </CardFooter>
    </Card>
  )
}
