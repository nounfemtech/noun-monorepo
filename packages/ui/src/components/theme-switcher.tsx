'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react'

type Mode = 'light' | 'dark' | 'system'

const MODES: { value: Mode; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: 'light',  label: 'Claro',  Icon: IconSun },
  { value: 'system', label: 'Sistema', Icon: IconDeviceDesktop },
  { value: 'dark',   label: 'Escuro', Icon: IconMoon },
]

/**
 * Toggle segmentado Light / System / Dark.
 * Usa next-themes. Importar dentro de <ThemeProvider>.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div
      role="group"
      aria-label="Tema"
      className={[
        'inline-flex items-center rounded-lg border border-border bg-muted p-1 gap-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {MODES.map(({ value, label, Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            aria-pressed={active}
            title={label}
            className={[
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
