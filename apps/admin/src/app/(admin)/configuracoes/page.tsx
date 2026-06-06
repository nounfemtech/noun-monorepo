'use client'

import * as React from 'react'
import { PrimaryColorPicker } from '@noun/ui'
import { useSpacemanTheme } from '@space-man/react-theme-animation'
import type { Theme } from '@space-man/react-theme-animation'
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize a aparência do Vaughan.
        </p>
      </div>

      <Separator />

      {/* ── Modo de tema ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium">Aparência</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Escolha o tema e as cores da interface.
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Modo</p>
          <ThemeModeSwitcher />
        </div>
      </section>

      <Separator />

      {/* ── Cor primária ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-medium">Cor primária</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define a cor de destaque em botões, links e elementos interativos.
            Os tons neutros são ajustados automaticamente de acordo com a cor e o modo.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Paleta e tonalidade</CardTitle>
            <CardDescription>
              Escolha a cor e a intensidade para toda a interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PrimaryColorPicker />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
