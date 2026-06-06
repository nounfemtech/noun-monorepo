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

export const DEFAULT_PRIMARY: PaletteSelection = { palette: 'yellow', shade: 400 }

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
  // Auto-contraste: shade ≤ 400 → foreground 950 (escuro); shade ≥ 500 → foreground 50
  const fgShade: ColorShadeValue = shadeIndex(sel.shade) <= shadeIndex(400) ? 950 : 50
  const fgHsl = getHsl(sel.palette, fgShade)

  root.style.setProperty('--primary',                    primaryHsl)
  root.style.setProperty('--primary-foreground',         fgHsl)
  root.style.setProperty('--ring',                       primaryHsl)
  root.style.setProperty('--sidebar-primary',            primaryHsl)
  root.style.setProperty('--sidebar-primary-foreground', fgHsl)
  root.style.setProperty('--sidebar-ring',               primaryHsl)
}

// ---------------------------------------------------------------------------
// Apply neutral CSS vars — automático por modo, sem input do usuário.
// Usa zinc como paleta neutra base em ambos os modos.
// ---------------------------------------------------------------------------

export function applyNeutral(): void {
  const root = document.documentElement
  const isDark = root.classList.contains('dark')

  if (isDark) {
    // dark: fundos sutis e bordas escuras
    root.style.setProperty('--muted',            getHsl('zinc', 800))
    root.style.setProperty('--muted-foreground', getHsl('zinc', 400))
    root.style.setProperty('--border',           getHsl('zinc', 700))
    root.style.setProperty('--input',            getHsl('zinc', 700))
  } else {
    // light: fundos claros, bordas suaves
    root.style.setProperty('--muted',            getHsl('zinc', 100))
    root.style.setProperty('--muted-foreground', getHsl('zinc', 500))
    root.style.setProperty('--border',           getHsl('zinc', 200))
    root.style.setProperty('--input',            getHsl('zinc', 200))
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ColorThemeContextValue {
  primary: PaletteSelection
  setPrimary: (sel: PaletteSelection) => void
  /** @deprecated — use primary.palette */
  colorTheme: ColorName
  /** @deprecated — use setPrimary */
  setColorTheme: (color: ColorName) => void
}

const ColorThemeContext = React.createContext<ColorThemeContextValue>({
  primary: DEFAULT_PRIMARY,
  setPrimary: () => {},
  colorTheme: DEFAULT_PRIMARY.palette as ColorName,
  setColorTheme: () => {},
})

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode
  /** @deprecated — ignorado; use localStorage["vaughan-primary"] */
  defaultColorTheme?: string
}) {
  const [primary, setPrimaryState] = React.useState<PaletteSelection>(DEFAULT_PRIMARY)

  // Boot: lê localStorage e aplica primary + neutral
  React.useEffect(() => {
    const p = readStorage(PRIMARY_KEY, DEFAULT_PRIMARY)
    setPrimaryState(p)
    applyPrimary(p)
    applyNeutral()
  }, [])

  // Re-aplica neutral automaticamente quando o modo claro/escuro muda
  React.useEffect(() => {
    const observer = new MutationObserver(() => applyNeutral())
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

  return (
    <ColorThemeContext.Provider
      value={{
        primary,
        setPrimary,
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
