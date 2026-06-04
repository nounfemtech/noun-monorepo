import React from 'react'
import { TextInput, View, Text, type TextInputProps } from 'react-native'

// ============================================================
// Input — NativeWind v4
// ============================================================

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  className?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </Text>
      )}
      <TextInput
        className={[
          'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900',
          'focus:border-violet-500 focus:outline-none',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          error ? 'border-red-500' : '',
          className,
        ].filter(Boolean).join(' ')}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && (
        <Text className="text-xs text-red-500">{error}</Text>
      )}
    </View>
  )
}
