'use client'

import * as React from 'react'
import { IconCheck } from '@tabler/icons-react'
import { useColorTheme } from '../providers/color-theme-provider'
import {
  CHROMATIC_NAMES,
  NEUTRAL_NAMES,
  COLOR_SHADES,
  colors,
  type ChromaticName,
  type NeutralName,
  type ColorName,
  type ColorShadeValue,
  type PaletteSelection,
} from '../tokens/colors'

// ---------------------------------------------------------------------------
// Label maps
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

// ---------------------------------------------------------------------------
// TwoLevelPicker — generic: palette grid → shade strip
// ---------------------------------------------------------------------------

interface TwoLevelPickerProps<T extends ColorName> {
  palettes: readonly T[]
  labels: Record<T, string>
  value: PaletteSelection
  onChange: (sel: PaletteSelection) => void
  defaultShade: ColorShadeValue
}

function TwoLevelPicker<T extends ColorName>({
  palettes,
  labels,
  value,
  onChange,
  defaultShade,
}: TwoLevelPickerProps<T>) {
  const [hovered, setHovered] = React.useState<T | null>(null)
  const previewPalette = hovered ?? (value.palette as T)

  function handlePaletteClick(p: T) {
    if (value.palette === p) return // já selecionado, mantém shade
    onChange({ palette: p, shade: defaultShade })
  }

  function handleShadeClick(shade: ColorShadeValue) {
    onChange({ palette: value.palette, shade })
  }

  return (
    <div className="space-y-3">
      {/* Linha de preview da paleta hover/ativa */}
      <div className="flex items-center gap-2 h-5">
        <div
          className="h-4 w-4 rounded-full border border-border/50 transition-all"
          style={{ backgroundColor: colors[previewPalette][500] }}
        />
        <span className="text-sm font-medium text-foreground capitalize">
          {labels[previewPalette]}
          {value.palette === previewPalette && (
            <span className="text-muted-foreground font-normal ml-1">— {value.shade}</span>
          )}
        </span>
      </div>

      {/* Grid de paletas */}
      <div
        role="radiogroup"
        aria-label="Paleta"
        className="flex flex-wrap gap-1.5"
      >
        {palettes.map((p) => {
          const isActive = value.palette === p
          return (
            <button
              key={p}
              role="radio"
              aria-checked={isActive}
              aria-label={labels[p]}
              title={labels[p]}
              onClick={() => handlePaletteClick(p)}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
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

      {/* Strip de shades — só aparece quando a paleta está selecionada */}
      {value.palette && (
        <div
          role="radiogroup"
          aria-label={`Tonalidade de ${labels[value.palette as T] ?? value.palette}`}
          className="flex gap-1"
        >
          {COLOR_SHADES.map((shade) => {
            const isActiveShade = value.shade === shade
            return (
              <button
                key={shade}
                role="radio"
                aria-checked={isActiveShade}
                aria-label={String(shade)}
                title={String(shade)}
                onClick={() => handleShadeClick(shade)}
                className={[
                  'relative flex-1 h-6 min-w-[18px] rounded transition-all',
                  'focus-visible:outline-none',
                  'hover:scale-y-110 active:scale-95',
                  isActiveShade ? 'ring-2 ring-offset-1 ring-foreground' : '',
                ].join(' ')}
                style={{ backgroundColor: colors[value.palette as ColorName][shade] }}
              />
            )
          })}
        </div>
      )}

      {/* Label dos shades */}
      <div className="flex gap-1 text-[10px] text-muted-foreground select-none">
        {COLOR_SHADES.map((shade) => (
          <span key={shade} className="flex-1 text-center leading-none">
            {shade === 50 ? '50' : shade === 950 ? '950' : shade >= 100 && shade % 200 === 0 ? String(shade) : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Public components
// ---------------------------------------------------------------------------

/** Picker de cor primária — 17 paletas cromáticas com seletor de shade */
export function PrimaryColorPicker({ className }: { className?: string }) {
  const { primary, setPrimary } = useColorTheme()
  return (
    <div className={className}>
      <TwoLevelPicker
        palettes={CHROMATIC_NAMES}
        labels={CHROMATIC_LABELS}
        value={primary}
        onChange={setPrimary}
        defaultShade={400}
      />
    </div>
  )
}

/** Picker de cor neutra — 5 paletas com seletor de shade */
export function NeutralColorPicker({ className }: { className?: string }) {
  const { neutral, setNeutral } = useColorTheme()
  return (
    <div className={className}>
      <TwoLevelPicker
        palettes={NEUTRAL_NAMES}
        labels={NEUTRAL_LABELS}
        value={neutral}
        onChange={setNeutral}
        defaultShade={200}
      />
    </div>
  )
}

/**
 * @deprecated Use PrimaryColorPicker.
 * Mantido para retrocompatibilidade — seleciona apenas a paleta primária.
 */
export function ColorPicker({ className }: { className?: string }) {
  return <PrimaryColorPicker className={className} />
}
