'use client'

import * as React from 'react'
import { IconCheck } from '@tabler/icons-react'
import { useColorTheme } from '../providers/color-theme-provider'
import {
  CHROMATIC_NAMES,
  NEUTRAL_NAMES,
  colors,
  type ChromaticName,
  type NeutralName,
  type ColorName,
  type ColorShadeValue,
} from '../tokens/colors'

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const CHROMATIC_LABELS: Record<ChromaticName, string> = {
  black: 'Black', red: 'Red', orange: 'Orange', amber: 'Amber', yellow: 'Yellow',
  lime: 'Lime', green: 'Green', emerald: 'Emerald', teal: 'Teal', cyan: 'Cyan',
  sky: 'Sky', blue: 'Blue', indigo: 'Indigo', violet: 'Violet', purple: 'Purple',
  fuchsia: 'Fuchsia', pink: 'Pink', rose: 'Rose',
}

const NEUTRAL_LABELS: Record<NeutralName, string> = {
  slate: 'Slate', gray: 'Gray', zinc: 'Zinc', neutral: 'Neutral', stone: 'Stone',
  taupe: 'Taupe', mauve: 'Mauve', mist: 'Mist', olive: 'Olive',
}

// Shades expostos no picker — 950 removido (contraste insuficiente em dark mode)
const PICKER_SHADES = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const

// ---------------------------------------------------------------------------
// ColorItem — retângulo com dot colorido + label (base de todos os pickers)
// ---------------------------------------------------------------------------

function ColorItem({
  label,
  dotColor,
  isActive,
  onClick,
}: {
  label: string
  dotColor: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-2 px-3 py-1.5 rounded-sm border text-sm transition-colors w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        isActive
          ? 'bg-muted border-border text-foreground font-medium'
          : 'border-border text-foreground/70 hover:text-foreground hover:bg-muted/40',
      ].join(' ')}
    >
      <span
        className="h-2 w-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span className="truncate leading-none">{label}</span>
      {isActive && <IconCheck size={14} className="ml-auto flex-shrink-0" />}
    </button>
  )
}

// ---------------------------------------------------------------------------
// PrimaryColorPicker — 18 paletas cromáticas em grade 3 colunas
// ---------------------------------------------------------------------------

export function PrimaryColorPicker({ className }: { className?: string }) {
  const { primary, setPrimary } = useColorTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Cor primária"
      className={['grid grid-cols-3 gap-1.5 max-w-sm', className].filter(Boolean).join(' ')}
    >
      {CHROMATIC_NAMES.map((name) => (
        <ColorItem
          key={name}
          label={CHROMATIC_LABELS[name]}
          dotColor={name === 'black' ? colors[name][950] : colors[name][500]}
          isActive={primary.palette === name}
          onClick={() => setPrimary({ ...primary, palette: name })}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ShadeColorPicker — shades 100–950 da paleta primária ativa, grade 3 colunas
// ---------------------------------------------------------------------------

export function ShadeColorPicker({ className }: { className?: string }) {
  const { primary, setPrimary } = useColorTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tonalidade"
      className={['grid grid-cols-3 gap-1.5 max-w-sm', className].filter(Boolean).join(' ')}
    >
      {PICKER_SHADES.map((shade) => (
        <ColorItem
          key={shade}
          label={String(shade)}
          dotColor={colors[primary.palette][shade]}
          isActive={primary.shade === shade}
          onClick={() => setPrimary({ ...primary, shade: shade as ColorShadeValue })}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NeutralColorPicker — 9 paletas neutras, grade 3 colunas (sem shade)
// O shade é calculado automaticamente pelo provider (Tailwind v4 defaults).
// ---------------------------------------------------------------------------

export function NeutralColorPicker({ className }: { className?: string }) {
  const { neutral, setNeutral } = useColorTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tons neutros"
      className={['grid grid-cols-3 gap-1.5 max-w-sm', className].filter(Boolean).join(' ')}
    >
      {NEUTRAL_NAMES.map((name) => (
        <ColorItem
          key={name}
          label={NEUTRAL_LABELS[name]}
          dotColor={colors[name][500]}
          isActive={neutral.palette === name}
          onClick={() => setNeutral({ ...neutral, palette: name })}
        />
      ))}
    </div>
  )
}

/**
 * @deprecated Use PrimaryColorPicker.
 */
export function ColorPicker({ className }: { className?: string }) {
  return <PrimaryColorPicker className={className} />
}
