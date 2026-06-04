import React from 'react'
import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native'

// ============================================================
// Button — NativeWind v4
// ============================================================

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  default:     { container: 'bg-violet-600 active:bg-violet-700',      text: 'text-white' },
  secondary:   { container: 'bg-slate-100 active:bg-slate-200',         text: 'text-slate-900' },
  outline:     { container: 'border border-slate-200 bg-transparent active:bg-slate-50', text: 'text-slate-900' },
  ghost:       { container: 'bg-transparent active:bg-slate-100',       text: 'text-slate-900' },
  destructive: { container: 'bg-red-600 active:bg-red-700',             text: 'text-white' },
}

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'h-8 px-3 rounded-md', text: 'text-sm font-medium' },
  md: { container: 'h-10 px-4 rounded-lg', text: 'text-sm font-semibold' },
  lg: { container: 'h-12 px-6 rounded-xl', text: 'text-base font-semibold' },
}

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const { container, text } = variantClasses[variant]
  const { container: sizeContainer, text: sizeText } = sizeClasses[size]
  const isDisabled = disabled || loading

  return (
    <Pressable
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center gap-2',
        container,
        sizeContainer,
        isDisabled ? 'opacity-50' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color="currentColor" />}
      {typeof children === 'string' ? (
        <Text className={[text, sizeText].join(' ')}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
