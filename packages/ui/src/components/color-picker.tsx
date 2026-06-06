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
  red: 'Red', orange: 'Orange', amber: 'Amber', yellow: 'Yellow', lime: 'Lime',
  green: 'Green', emerald: 'Emerald', teal: 'Teal', cyan: 'Cyan', sky: 'Sky',
  blue: 'Blue', indigo: 'Indigo', violet: 'Violet', purple: 'Purple',
  fuchsia: 'Fuchsia', pink: 'Pink', rose: 'Rose',
}

const NEUTRAL_LABELS: Record<NeutralName, string> = {
  slate: 'Slate', gray: 'Gray', zinc: 'Zinc', neutral: 'Neutral', stone: 'Stone',
}

// Shades expostos no picker — começa em 100 (50 excluído)
const PICKER_SHADES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
type PickerShade = (typeof PICKER_SHADES)[number]

// ---------------------------------------------------------------------------
// PaletteCircles — base interna: grid de círculos de paleta (sem shade strip)
// ---------------------------------------------------------------------------

interface PaletteCirclesProps<T extends ColorName> {
  palettes: readonly T[]
  labels: Record<T, string>
  selected: ColorName
  onSelect: (palette: T) => void
  className?: string
}

function PaletteCircles<T extends ColorName>({
  palettes,
  labels,
  selected,
  onSelect,
  className,
}: PaletteCirclesProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label="Paleta"
      className={['flex flex-wrap gap-1.5', className].filter(Boolean).join(' ')}
    >
      {palettes.map((p) => {
        const isActive = selected === p
        return (
          <button
            key={p}
            role="radio"
            aria-checked={isActive}
            aria-label={labels[p]}
            title={labels[p]}
            onClick={() => onSelect(p)}
            className={[
              'relative h-6 w-6 rounded-full border-2 transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'hover:scale-110 active:scale-95',
              isActive
                ? 'border-foreground shadow-md scale-110'
                : 'border-transparent hover:border-foreground/30',
            ].join(' ')}
            style={{ backgroundColor: colors[p][500] }}
          >
            {isActive && (
              <span className="absolute inset-0 flex items-center justify-center">
                <IconCheck size={11} className="text-white drop-shadow-sm" strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PrimaryColorPicker — 17 paletas cromáticas, círculos apenas
// ---------------------------------------------------------------------------

export function PrimaryColorPicker({ className }: { className?: string }) {
  const { primary, setPrimary } = useColorTheme()
  return (
    <PaletteCircles
      palettes={CHROMATIC_NAMES}
      labels={CHROMATIC_LABELS}
      selected={primary.palette}
      onSelect={(palette) => setPrimary({ ...primary, palette })}
      className={className}
    />
  )
}

// ---------------------------------------------------------------------------
// ShadeColorPicker — círculos de tonalidade (100–950) da paleta primária ativa
// ---------------------------------------------------------------------------

export function ShadeColorPicker({ className }: { className?: string }) {
  const { primary, setPrimary } = useColorTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tonalidade"
      className={['flex flex-wrap gap-3', className].filter(Boolean).join(' ')}
    >
      {PICKER_SHADES.map((shade) => {
        const isActive = primary.shade === shade
        // shades claros (≤ 300): check escuro; escuros: check branco
        const checkClass = shade <= 300 ? 'text-gray-900' : 'text-white'

        return (
          <div key={shade} className="flex flex-col items-center gap-1">
            <button
              role="radio"
              aria-checked={isActive}
              aria-label={String(shade)}
              title={String(shade)}
              onClick={() => setPrimary({ ...primary, shade: shade as ColorShadeValue })}
              className={[
                'relative h-6 w-6 rounded-full border-2 transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'hover:scale-110 active:scale-95',
                isActive
                  ? 'border-foreground shadow-md scale-110'
                  : 'border-transparent hover:border-foreground/30',
              ].join(' ')}
              style={{ backgroundColor: colors[primary.palette][shade] }}
            >
              {isActive && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <IconCheck size={11} className={`${checkClass} drop-shadow-sm`} strokeWidth={3} />
                </span>
              )}
            </button>
            <span className="text-[10px] text-muted-foreground leading-none select-none">
              {shade}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NeutralColorPicker — 5 paletas neutras, círculos apenas (sem shade)
// O shade é determinado automaticamente pelo provider com base no modo.
// ---------------------------------------------------------------------------

export function NeutralColorPicker({ className }: { className?: string }) {
  const { neutral, setNeutral } = useColorTheme()
  return (
    <PaletteCircles
      palettes={NEUTRAL_NAMES}
      labels={NEUTRAL_LABELS}
      selected={neutral.palette}
      onSelect={(palette) => setNeutral({ ...neutral, palette })}
      className={className}
    />
  )
}

/**
 * @deprecated Use PrimaryColorPicker.
 */
export function ColorPicker({ className }: { className?: string }) {
  return <PrimaryColorPicker className={className} />
}
