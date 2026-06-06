'use client'

import * as React from 'react'
import { useColorTheme } from '../providers/color-theme-provider'
import {
  CHROMATIC_NAMES,
  NEUTRAL_NAMES,
  PICKER_SHADES,
  colors,
  type ColorName,
  type ColorShadeValue,
  type PaletteSelection,
} from '../tokens/colors'

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const ALL_LABELS: Record<ColorName, string> = {
  red: 'Red',      orange: 'Orange',  amber: 'Amber',   yellow: 'Yellow',
  lime: 'Lime',    green: 'Green',    emerald: 'Emerald', teal: 'Teal',
  cyan: 'Cyan',    sky: 'Sky',        blue: 'Blue',     indigo: 'Indigo',
  violet: 'Violet', purple: 'Purple', fuchsia: 'Fuchsia', pink: 'Pink',
  rose: 'Rose',
  slate: 'Slate',  gray: 'Gray',      zinc: 'Zinc',     neutral: 'Neutral',
  stone: 'Stone',
}

// Ordem de exibição: cromáticas + neutros
const PICKER_PALETTES: readonly ColorName[] = [...CHROMATIC_NAMES, ...NEUTRAL_NAMES]

// ---------------------------------------------------------------------------
// Helper: cn
// ---------------------------------------------------------------------------

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// PrimaryColorPicker
// ---------------------------------------------------------------------------

export function PrimaryColorPicker({ className }: { className?: string }) {
  const { primary, setPrimary } = useColorTheme()

  function selectPalette(palette: ColorName) {
    // Mantém o shade atual se estiver disponível no intervalo 100-950,
    // senão usa 400 como padrão
    const currentShade = primary.shade === 50 ? 400 : primary.shade
    setPrimary({ palette, shade: currentShade })
  }

  function selectShade(shade: ColorShadeValue) {
    setPrimary({ palette: primary.palette, shade })
  }

  return (
    <div className={cn('space-y-5', className)}>
      {/* ── Grade de paletas ── */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Cor primária
        </p>
        <div
          role="radiogroup"
          aria-label="Paleta de cor"
          className="grid grid-cols-3 gap-1.5"
        >
          {PICKER_PALETTES.map((name) => {
            const isActive = primary.palette === name
            return (
              <button
                key={name}
                role="radio"
                aria-checked={isActive}
                aria-label={ALL_LABELS[name]}
                onClick={() => selectPalette(name)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  isActive
                    ? 'border-primary bg-primary/5 text-foreground font-medium'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/40',
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors[name][500] }}
                />
                <span className="truncate leading-none">{ALL_LABELS[name]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Seletor de tonalidade ── */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Tonalidade
          <span className="ml-2 normal-case font-normal text-foreground/70">
            {primary.shade}
          </span>
        </p>
        <div
          role="radiogroup"
          aria-label="Tonalidade"
          className="flex gap-1"
        >
          {PICKER_SHADES.map((shade) => {
            const isActive = primary.shade === shade
            return (
              <button
                key={shade}
                role="radio"
                aria-checked={isActive}
                aria-label={String(shade)}
                title={String(shade)}
                onClick={() => selectShade(shade)}
                className={cn(
                  'flex-1 h-7 rounded transition-all',
                  'focus-visible:outline-none',
                  'hover:scale-y-[1.15] active:scale-95',
                  isActive ? 'ring-2 ring-offset-1 ring-foreground shadow-sm' : '',
                )}
                style={{ backgroundColor: colors[primary.palette][shade] }}
              />
            )
          })}
        </div>
        <div className="flex gap-1 mt-1 text-[10px] text-muted-foreground select-none">
          {PICKER_SHADES.map((shade) => (
            <span key={shade} className="flex-1 text-center leading-none">
              {shade === 100 || shade === 500 || shade === 950 ? shade : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NeutralColorPicker — mantido por compatibilidade, sem efeito
// @deprecated — neutrals são aplicados automaticamente pelo ColorThemeProvider
// ---------------------------------------------------------------------------

/** @deprecated Neutrals são calculados automaticamente. Este componente não faz nada. */
export function NeutralColorPicker({ className: _ }: { className?: string }) {
  return null
}

/**
 * @deprecated Use PrimaryColorPicker.
 */
export function ColorPicker({ className }: { className?: string }) {
  return <PrimaryColorPicker className={className} />
}
