import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react'

interface TrendInfo {
  value: number
  label?: string
}

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  trend?: TrendInfo
  className?: string
  // backward-compat — ignored in new design
  icon?: React.ReactNode
  highlight?: boolean
  footer?: string
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  className,
}: StatsCardProps) {
  const isPositive = trend ? trend.value >= 0 : null

  return (
    <Card className={cn('overflow-hidden flex flex-col', className)}>
      <CardContent className="px-4 pt-4 pb-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          {trend && (
            <span
              className={cn(
                'flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium shrink-0',
                isPositive
                  ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800'
                  : 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800',
              )}
            >
              {isPositive
                ? <IconTrendingUp size={11} />
                : <IconTrendingDown size={11} />}
              {isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold mt-2 tabular-nums">{value}</p>
      </CardContent>

      {description && (
        <div className="border-t bg-muted/40 px-4 py-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            {trend && (
              isPositive
                ? <IconTrendingUp size={14} className="text-green-600 shrink-0" />
                : <IconTrendingDown size={14} className="text-red-500 shrink-0" />
            )}
            {description}
          </p>
        </div>
      )}
    </Card>
  )
}
