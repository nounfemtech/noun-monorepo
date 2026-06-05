import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TrendInfo {
  value: number
  label: string
}

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: TrendInfo
  className?: string
  highlight?: boolean
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
  highlight,
}: StatsCardProps) {
  const isPositiveTrend = trend && trend.value >= 0

  return (
    <Card className={cn(highlight && 'border-primary/20 shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className={cn('font-medium text-muted-foreground', highlight ? 'text-sm' : 'text-sm')}>
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', highlight && 'p-2.5')}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('font-bold', highlight ? 'text-2xl' : 'text-2xl')}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              'text-xs mt-1 font-medium',
              isPositiveTrend ? 'text-green-600' : 'text-red-500'
            )}
          >
            {isPositiveTrend ? '+' : ''}
            {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
