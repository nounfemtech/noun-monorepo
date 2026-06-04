import React from 'react'
import { View, Text, type ViewProps } from 'react-native'

// ============================================================
// Card — NativeWind v4
// ============================================================

interface CardProps extends ViewProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={[
        'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </View>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={['text-base font-semibold text-slate-900 dark:text-slate-100', className].filter(Boolean).join(' ')}>
      {children}
    </Text>
  )
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={['text-sm text-slate-500 dark:text-slate-400', className].filter(Boolean).join(' ')}>
      {children}
    </Text>
  )
}
