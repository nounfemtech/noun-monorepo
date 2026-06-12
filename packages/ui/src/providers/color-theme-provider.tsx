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

function getHsl(palette: ColorName, shade: ColorShadeValue): string {
  return hexToHsl(colors[palette][shade])
}

/**
 * Recebe uma string HSL no formato "H S% L%" e limita a lightness a maxL.
 * Usado no dark mode para garantir bordas suaves independente do neutro escolhido:
 * preserva o hue e a saturação da paleta, mas impede que a lightness
 * fique acima do teto, evitando divisores muito marcantes num fundo escuro.
 */
function capLightness(hsl: string, maxL: number): string {
  const parts = hsl.split(' ')
  const l = parseFloat(parts[2] ?? '0')
  return l <= maxL ? hsl : `${parts[0]} ${parts[1]} ${maxL}%`
}

// ---------------------------------------------------------------------------
// WCAG contrast utilities
// ---------------------------------------------------------------------------

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/** Retorna o shade (50 ou 950) da mesma paleta que oferece maior contraste com bgShade */
function bestFgShade(palette: ColorName, bgShade: ColorShadeValue): ColorShadeValue {
  const bg = colors[palette][bgShade]
  const c950 = contrastRatio(bg, colors[palette][950])
  const c50  = contrastRatio(bg, colors[palette][50])
  return c950 >= c50 ? 950 : 50
}

// Shades banidos do picker — remap automático para o mais próximo válido
const REMOVED_SHADE_REMAP: Partial<Record<number, ColorShadeValue>> = {
  100: 300,
  200: 300,
  900: 800,
  950: 800,
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
      (COLOR_SHADES as unknown as number[]).includes(parsed.shade) &&
      colors[parsed.palette as ColorName]
    ) {
      // Migra shades removidos para o mais próximo permitido
      if (parsed.shade in REMOVED_SHADE_REMAP) {
        parsed.shade = REMOVED_SHADE_REMAP[parsed.shade]
      }
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
  const fgShade = bestFgShade(sel.palette, sel.shade)
  const fgHsl = getHsl(sel.palette, fgShade)

  root.style.setProperty('--primary', primaryHsl)
  root.style.setProperty('--primary-foreground', fgHsl)
  root.style.setProperty('--ring', primaryHsl)
  root.style.setProperty('--sidebar-primary', primaryHsl)
  root.style.setProperty('--sidebar-primary-foreground', fgHsl)
  root.style.setProperty('--sidebar-ring', primaryHsl)
  root.style.setProperty('--sidebar-accent', primaryHsl)
  root.style.setProperty('--sidebar-accent-foreground', fgHsl)

  // Shadcn chart vars — mesmas tonalidades usadas nos gráficos do dashboard
  root.style.setProperty('--chart-1', colors[sel.palette][500])
  root.style.setProperty('--chart-2', colors[sel.palette][700])
  root.style.setProperty('--chart-3', colors[sel.palette][400])
  root.style.setProperty('--chart-4', colors[sel.palette][300])
  root.style.setProperty('--chart-5', colors[sel.palette][600])
}

// ---------------------------------------------------------------------------
// Apply neutral CSS vars
//
// Light: shades fixos (100 / 500 / 200).
// Dark:  usa capLightness para preservar hue+sat de cada neutro mas limitar
//        a lightness a um teto, evitando bordas muito marcantes num fundo
//        escuro (~8% lightness). Tetos calibrados por tipo de variável:
//   --muted           ≤ 18%  (fundos de hover/badge — precisam de alguma visibilidade)
//   --border / --input ≤ 14%  (divisores — sutis, ~6 pp acima do fundo)
//   --sidebar-border  ≤ 12%  (linha da sidebar — quase imperceptível)
// ---------------------------------------------------------------------------

export function applyNeutral(sel: PaletteSelection): void {
  const root = document.documentElement
  const isDark = root.classList.contains('dark')

  if (isDark) {
    root.style.setProperty('--muted',            capLightness(getHsl(sel.palette, 700), 18))
    root.style.setProperty('--muted-foreground', getHsl(sel.palette, 400))
    root.style.setProperty('--border',           capLightness(getHsl(sel.palette, 700), 14))
    root.style.setProperty('--input',            capLightness(getHsl(sel.palette, 700), 14))
    root.style.setProperty('--sidebar-border',   capLightness(getHsl(sel.palette, 700), 12))
  } else {
    root.style.setProperty('--muted',            getHsl(sel.palette, 100))
    root.style.setProperty('--muted-foreground', getHsl(sel.palette, 500))
    root.style.setProperty('--border',           getHsl(sel.palette, 200))
    root.style.setProperty('--input',            getHsl(sel.palette, 200))
    root.style.setProperty('--sidebar-border',   getHsl(sel.palette, 200))
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
