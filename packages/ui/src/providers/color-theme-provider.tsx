'use client'

import * as React from 'react'
import {
  colors,
  hexToHsl,
  COLOR_SHADES,
  type ColorName,
  type ColorShadeValue,
  type PaletteSelection,
} from '../tokens/colors'

// ---------------------------------------------------------------------------
// Storage keys + defaults
// ---------------------------------------------------------------------------

const PRIMARY_KEY = 'vaughan-primary'
const NEUTRAL_KEY = 'vaughan-neutral'

export const DEFAULT_PRIMARY: PaletteSelection = { palette: 'yellow', shade: 400 }
export const DEFAULT_NEUTRAL: PaletteSelection = { palette: 'zinc', shade: 950 }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHADE_ORDER: ColorShadeValue[] = [...COLOR_SHADES]

function shadeIndex(shade: ColorShadeValue): number {
  return SHADE_ORDER.indexOf(shade)
}

function getHsl(palette: ColorName, shade: ColorShadeValue): string {
  return hexToHsl(colors[palette][shade])
}

/** Reads a PaletteSelection from localStorage, falls back to defaultVal */
function readStorage(key: string, defaultVal: PaletteSelection): PaletteSelection {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultVal
    const parsed = JSON.parse(raw) as Partial<PaletteSelection>
    if (
      parsed.palette &&
      typeof parsed.palette === 'string' &&
      parsed.shade &&
      typeof parsed.shade === 'number' &&
      (SHADE_ORDER as number[]).includes(parsed.shade) &&
      colors[parsed.palette as ColorName]
    ) {
      return parsed as PaletteSelection
    }
  } catch {
    // ignore
  }
  return defaultVal
}

// ---------------------------------------------------------------------------
// Apply primary CSS vars
// ---------------------------------------------------------------------------

export function applyPrimary(sel: PaletteSelection): void {
  const root = document.documentElement
  const primaryHsl = getHsl(sel.palette, sel.shade)
  // Auto-contrast: shade index ≤ index of 400 → use 950 (dark fg); else use 50
  const fgShade: ColorShadeValue = shadeIndex(sel.shade) <= shadeIndex(400) ? 950 : 50
  const fgHsl = getHsl(sel.palette, fgShade)

  root.style.setProperty('--primary', primaryHsl)
  root.style.setProperty('--primary-foreground', fgHsl)
  root.style.setProperty('--ring', primaryHsl)
  root.style.setProperty('--sidebar-primary', primaryHsl)
  root.style.setProperty('--sidebar-primary-foreground', fgHsl)
  root.style.setProperty('--sidebar-ring', primaryHsl)
}

// ---------------------------------------------------------------------------
// Apply neutral CSS vars
// Shades seguem o padrão Tailwind v4: 100/500/200 no light, 800/400/700 no dark.
// Controla: --muted (fundo secundário), --muted-foreground (texto auxiliar),
//           --border (bordas), --input (bordas de input)
// ---------------------------------------------------------------------------

export function applyNeutral(sel: PaletteSelection): void {
  const root = document.documentElement
  const isDark = root.classList.contains('dark')

  if (isDark) {
    // Tailwind v4 dark defaults: fundos escuros, bordas sutis, texto médio
    root.style.setProperty('--muted',            getHsl(sel.palette, 800))
    root.style.setProperty('--muted-foreground', getHsl(sel.palette, 400))
    root.style.setProperty('--border',           getHsl(sel.palette, 700))
    root.style.setProperty('--input',            getHsl(sel.palette, 700))
    root.style.setProperty('--sidebar-border',   getHsl(sel.palette, 700))
    root.style.setProperty('--sidebar-accent',   getHsl(sel.palette, 800))
    root.style.setProperty('--sidebar-accent-foreground', getHsl(sel.palette, 100))
  } else {
    // Tailwind v4 light defaults: fundos quase-brancos, bordas leves, texto cinza médio
    root.style.setProperty('--muted',            getHsl(sel.palette, 100))
    root.style.setProperty('--muted-foreground', getHsl(sel.palette, 500))
    root.style.setProperty('--border',           getHsl(sel.palette, 200))
    root.style.setProperty('--input',            getHsl(sel.palette, 200))
    root.style.setProperty('--sidebar-border',   getHsl(sel.palette, 200))
    root.style.setProperty('--sidebar-accent',   getHsl(sel.palette, 100))
    root.style.setProperty('--sidebar-accent-foreground', getHsl(sel.palette, 700))
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ColorThemeContextValue {
  primary: PaletteSelection
  neutral: PaletteSelection
  setPrimary: (sel: PaletteSelection) => void
  setNeutral: (sel: PaletteSelection) => void
  /** @deprecated — use primary.palette */
  colorTheme: ColorName
  /** @deprecated — use setPrimary */
  setColorTheme: (color: ColorName) => void
}

const ColorThemeContext = React.createContext<ColorThemeContextValue>({
  primary: DEFAULT_PRIMARY,
  neutral: DEFAULT_NEUTRAL,
  setPrimary: () => {},
  setNeutral: () => {},
  colorTheme: DEFAULT_PRIMARY.palette as ColorName,
  setColorTheme: () => {},
})

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ColorThemeProvider({
  children,
  defaultColorTheme,
}: {
  children: React.ReactNode
  /** @deprecated — ignored; use localStorage["vaughan-primary"] */
  defaultColorTheme?: string
}) {
  const [primary, setPrimaryState] = React.useState<PaletteSelection>(DEFAULT_PRIMARY)
  const [neutral, setNeutralState] = React.useState<PaletteSelection>(DEFAULT_NEUTRAL)

  // Boot: read from localStorage and apply
  React.useEffect(() => {
    const p = readStorage(PRIMARY_KEY, DEFAULT_PRIMARY)
    const n = readStorage(NEUTRAL_KEY, DEFAULT_NEUTRAL)
    setPrimaryState(p)
    setNeutralState(n)
    applyPrimary(p)
    applyNeutral(n)
  }, [])

  // Re-apply neutral when dark-mode class changes
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentNeutral = readStorage(NEUTRAL_KEY, DEFAULT_NEUTRAL)
      applyNeutral(currentNeutral)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  function setPrimary(sel: PaletteSelection) {
    setPrimaryState(sel)
    applyPrimary(sel)
    localStorage.setItem(PRIMARY_KEY, JSON.stringify(sel))
  }

  function setNeutral(sel: PaletteSelection) {
    setNeutralState(sel)
    applyNeutral(sel)
    localStorage.setItem(NEUTRAL_KEY, JSON.stringify(sel))
  }

  return (
    <ColorThemeContext.Provider
      value={{
        primary,
        neutral,
        setPrimary,
        setNeutral,
        colorTheme: primary.palette as ColorName,
        setColorTheme: (color: ColorName) => setPrimary({ ...primary, palette: color }),
      }}
    >
      {children}
    </ColorThemeContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useColorTheme() {
  const ctx = React.useContext(ColorThemeContext)
  if (!ctx) throw new Error('useColorTheme must be used within ColorThemeProvider')
  return ctx
}
