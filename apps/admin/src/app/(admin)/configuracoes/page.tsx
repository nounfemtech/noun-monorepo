'use client'

import * as React from 'react'
import { PrimaryColorPicker, NeutralColorPicker } from '@noun/ui'
import { useSpacemanTheme } from '@space-man/react-theme-animation'
import type { Theme } from '@space-man/react-theme-animation'
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const MODES: { value: Theme; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { value: 'light',  label: 'Claro',   Icon: IconSun },
  { value: 'system', label: 'Sistema', Icon: IconDeviceDesktop },
  { value: 'dark',   label: 'Escuro',  Icon: IconMoon },
]

function ThemeModeSwitcher() {
  const { theme, switchThemeFromElement } = useSpacemanTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <div
      role="group"
      aria-label="Modo de tema"
      className="inline-flex items-center rounded-lg border border-border bg-muted p-1 gap-1"
    >
      {MODES.map(({ value, label, Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            onClick={(e) => switchThemeFromElement(value, e.currentTarget)}
            aria-pressed={active}
            title={label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function ConfiguracoesPage() {
  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize a aparência do Vaughan.
        </p>
      </div>

      <Separator />

      {/* Aparência */}
      <section className="space-y-8">
        <div>
          <h2 className="text-base font-medium">Aparência</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Escolha o tema e as cores da interface.
          </p>
        </div>

        {/* Modo: Light / System / Dark */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Modo</p>
          <ThemeModeSwitcher />
        </div>

        <Separator />

        {/* Cor primária */}
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Cor primária</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecione a paleta e a tonalidade principal da interface.
            </p>
          </div>
          <PrimaryColorPicker />
        </div>

        <Separator />

        {/* Cor neutra */}
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Tons neutros</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Controla bordas, fundos secundários e textos auxiliares.
            </p>
          </div>
          <NeutralColorPicker />
        </div>
      </section>
    </div>
  )
}
