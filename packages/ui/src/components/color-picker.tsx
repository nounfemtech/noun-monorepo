'use client'

import * as React from 'react'
import { IconCheck } from '@tabler/icons-react'
import { useColorTheme } from '../providers/color-theme-provider'
import { COLOR_NAMES, colors, type ColorName } from '../tokens/colors'

/** Label exibida no ColorPicker para cada paleta */
const COLOR_LABELS: Record<ColorName, string> = {
  slate: 'Slate', gray: 'Gray', zinc: 'Zinc', neutral: 'Neutral', stone: 'Stone',
  red: 'Red', orange: 'Orange', amber: 'Amber', yellow: 'Yellow', lime: 'Lime',
  green: 'Green', emerald: 'Emerald', teal: 'Teal', cyan: 'Cyan', sky: 'Sky',
  blue: 'Blue', indigo: 'Indigo', violet: 'Violet', purple: 'Purple',
  fuchsia: 'Fuchsia', pink: 'Pink', rose: 'Rose',
}

/**
 * Seletor de paleta de cores — estilo Nuxt UI.
 * Grid de swatches clicáveis com preview ao hover.
 * Persiste a escolha via ColorThemeProvider.
 */
export function ColorPicker({ className }: { className?: string }) {
  const { colorTheme, setColorTheme } = useColorTheme()
  const [hoveredColor, setHoveredColor] = React.useState<ColorName | null>(null)

  const previewColor = hoveredColor ?? colorTheme

  return (
    <div className={['flex flex-col gap-3', className].filter(Boolean).join(' ')}>
      {/* Label da cor em destaque */}
      <div className="flex items-center gap-2 h-5">
        <div
          className="h-4 w-4 rounded-full border border-border/50 transition-all"
          style={{ backgroundColor: colors[previewColor][500] }}
        />
        <span className="text-sm font-medium text-foreground capitalize">
          {COLOR_LABELS[previewColor]}
        </span>
      </div>

      {/* Grid de swatches */}
      <div
        role="radiogroup"
        aria-label="Paleta de cores"
        className="grid grid-cols-11 gap-1.5"
      >
        {COLOR_NAMES.map((color) => {
          const isActive = color === colorTheme
          const swatch = colors[color][500]

          return (
            <button
              key={color}
              role="radio"
              aria-checked={isActive}
              aria-label={COLOR_LABELS[color]}
              title={COLOR_LABELS[color]}
              onClick={() => setColorTheme(color)}
              onMouseEnter={() => setHoveredColor(color)}
              onMouseLeave={() => setHoveredColor(null)}
              className={[
                'relative h-6 w-6 rounded-full border-2 transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'hover:scale-110 active:scale-95',
                isActive ? 'border-foreground shadow-md scale-110' : 'border-transparent hover:border-foreground/30',
              ].join(' ')}
              style={{ backgroundColor: swatch }}
            >
              {isActive && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <IconCheck
                    size={12}
                    className="text-white drop-shadow-sm"
                    strokeWidth={3}
                  />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
