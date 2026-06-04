import React from 'react'
import { View, Text } from 'react-native'

// ============================================================
// Badge — NativeWind v4
// ============================================================

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, { container: string; text: string }> = {
  default:     { container: 'bg-violet-600',                    text: 'text-white' },
  secondary:   { container: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-700 dark:text-slate-300' },
  outline:     { container: 'border border-slate-200',          text: 'text-slate-700' },
  destructive: { container: 'bg-red-600',                       text: 'text-white' },
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const { container, text } = variantClasses[variant]

  return (
    <View className={['inline-flex rounded-full px-2.5 py-0.5', container, className].filter(Boolean).join(' ')}>
      <Text className={['text-xs font-semibold', text].join(' ')}>
        {typeof children === 'string' ? children : children}
      </Text>
    </View>
  )
}
