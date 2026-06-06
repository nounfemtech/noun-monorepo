// ============================================================
// Noun Design System — Color Tokens
// Paleta completa Tailwind v3 (50–950) — NÃO alterar sem decisão de design
// ============================================================

export const COLOR_NAMES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'black', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
] as const

/** 18 paletas cromáticas — usadas no picker primário */
export const CHROMATIC_NAMES = [
  'black', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
] as const

/** 5 paletas neutras — usadas no picker neutro */
export const NEUTRAL_NAMES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
] as const

export type ColorName = (typeof COLOR_NAMES)[number]
export type ChromaticName = (typeof CHROMATIC_NAMES)[number]
export type NeutralName = (typeof NEUTRAL_NAMES)[number]

/** Shades disponíveis para seleção */
export const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type ColorShadeValue = (typeof COLOR_SHADES)[number]

/** Seleção persistida no localStorage */
export interface PaletteSelection {
  palette: ColorName
  shade: ColorShadeValue
}

export type ColorShades = {
  50: string; 100: string; 200: string; 300: string; 400: string
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string
}

/** HSL completo por paleta × shade (formato "H S% L%", sem hsl()) */
export type HslShades = Record<ColorShadeValue, string>
export type FullHslMap = Record<ColorName, HslShades>

// ---------------------------------------------------------------------------
// Utility: convert hex → "H S% L%" string (sem hsl())
// ---------------------------------------------------------------------------
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return `0 0% ${Math.round(l * 1000) / 10}%`
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    default: h = ((r - g) / d + 4) / 6
  }
  return `${Math.round(h * 3600) / 10} ${Math.round(s * 1000) / 10}% ${Math.round(l * 1000) / 10}%`
}

// ---------------------------------------------------------------------------
// HSL values for CSS variables (shade 600 = light primary, shade 500 = dark primary)
// Format: "H S% L%" (sem "hsl()")
// ---------------------------------------------------------------------------
export const COLOR_HSL: Record<ColorName, { light: string; dark: string; lightFg: string; darkFg: string }> = {
  black:   { light: '0 0% 9%',          dark: '0 0% 63.9%',      lightFg: '0 0% 100%',   darkFg: '0 0% 100%' },
  slate:   { light: '215 27.9% 16.9%',  dark: '215 16.3% 46.9%', lightFg: '0 0% 100%',   darkFg: '0 0% 100%' },
  gray:    { light: '220 8.9% 35.3%',   dark: '220 8.9% 46.1%',  lightFg: '0 0% 100%',   darkFg: '0 0% 100%' },
  zinc:    { light: '240 3.7% 15.9%',   dark: '240 5.2% 33.9%',  lightFg: '0 0% 100%',   darkFg: '0 0% 100%' },
  neutral: { light: '0 0% 32.2%',        dark: '0 0% 45.1%',      lightFg: '0 0% 100%',   darkFg: '0 0% 100%' },
  stone:   { light: '33.3 5.5% 32.4%',  dark: '25 5.9% 44.7%',   lightFg: '0 0% 100%',   darkFg: '0 0% 100%' },
  red:     { light: '0 72.2% 50.6%',    dark: '0 84.2% 60.2%',   lightFg: '0 0% 100%',   darkFg: '0 0% 100%' },
  orange:  { light: '24.6 94.4% 40.0%', dark: '20.5 90.2% 48.2%',lightFg: '0 0% 100%',   darkFg: '0 0% 100%' },
  amber:   { light: '32.1 94.6% 43.7%', dark: '37.7 92.1% 50.2%',lightFg: '222.2 84% 4.9%', darkFg: '222.2 84% 4.9%' },
  yellow:  { light: '40.6 96.1% 40.4%', dark: '47.9 95.8% 53.1%',lightFg: '222.2 84% 4.9%', darkFg: '222.2 84% 4.9%' },
  lime:    { light: '84.8 61.4% 35.3%', dark: '84.1 80.5% 44.3%',lightFg: '0 0% 100%',   darkFg: '222.2 84% 4.9%' },
  green:   { light: '142.1 76.2% 36.3%',dark: '142.1 70.6% 45.3%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  emerald: { light: '161.4 93.5% 30.4%',dark: '158.1 64.4% 40.8%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  teal:    { light: '174.7 83.9% 31.6%',dark: '173.4 80.4% 40.0%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  cyan:    { light: '197.4 71.4% 36.1%',dark: '192.9 90.2% 44.1%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  sky:     { light: '200.6 82.4% 39.0%',dark: '199.4 89.1% 47.6%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  blue:    { light: '221.2 83.2% 53.3%',dark: '217.2 91.2% 59.8%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  indigo:  { light: '243.4 75.4% 58.5%',dark: '238.7 83.5% 66.7%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  violet:  { light: '262.1 83.3% 57.8%',dark: '257.9 89.9% 65.1%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  purple:  { light: '270.7 91.0% 65.1%',dark: '270 95.2% 75.3%',  lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  fuchsia: { light: '292.2 84.1% 60.6%',dark: '292 91.4% 72.5%',  lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  pink:    { light: '330.4 81.2% 60.4%',dark: '330.7 97.2% 72.4%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
  rose:    { light: '346.8 77.2% 49.8%',dark: '347.3 86.7% 60.2%',lightFg: '0 0% 100%',  darkFg: '0 0% 100%' },
}

// ---------------------------------------------------------------------------
// Full hex palette — usado no ColorPicker e NativeWind
// ---------------------------------------------------------------------------
export const colors: Record<ColorName, ColorShades> = {
  black: {
    50: '#f5f5f5', 100: '#e8e8e8', 200: '#d0d0d0', 300: '#b0b0b0',
    400: '#888888', 500: '#5e5e5e', 600: '#3d3d3d', 700: '#2a2a2a',
    800: '#1a1a1a', 900: '#0d0d0d', 950: '#000000',
  },
  slate: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
    400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
    800: '#1e293b', 900: '#0f172a', 950: '#020617',
  },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827', 950: '#030712',
  },
  zinc: {
    50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8',
    400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46',
    800: '#27272a', 900: '#18181b', 950: '#09090b',
  },
  neutral: {
    50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
    400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
    800: '#262626', 900: '#171717', 950: '#0a0a0a',
  },
  stone: {
    50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
    400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
    800: '#292524', 900: '#1c1917', 950: '#0c0a09',
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
    800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
  },
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
    800: '#9a3412', 900: '#7c2d12', 950: '#431407',
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    800: '#92400e', 900: '#78350f', 950: '#451a03',
  },
  yellow: {
    50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047',
    400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207',
    800: '#854d0e', 900: '#713f12', 950: '#422006',
  },
  lime: {
    50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264',
    400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f',
    800: '#3f6212', 900: '#365314', 950: '#1a2e05',
  },
  green: {
    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
    400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
    800: '#166534', 900: '#14532d', 950: '#052e16',
  },
  emerald: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
    400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
    800: '#065f46', 900: '#064e3b', 950: '#022c22',
  },
  teal: {
    50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
    400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
    800: '#115e59', 900: '#134e4a', 950: '#042f2e',
  },
  cyan: {
    50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9',
    400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490',
    800: '#155e75', 900: '#164e63', 950: '#083344',
  },
  sky: {
    50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
    400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
    800: '#075985', 900: '#0c4a6e', 950: '#082f49',
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
  },
  indigo: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
  },
  violet: {
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
    800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
  },
  purple: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
    400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
    800: '#6b21a8', 900: '#581c87', 950: '#3b0764',
  },
  fuchsia: {
    50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc',
    400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf',
    800: '#86198f', 900: '#701a75', 950: '#4a044e',
  },
  pink: {
    50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
    400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
    800: '#9d174d', 900: '#831843', 950: '#500724',
  },
  rose: {
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
    400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
    800: '#9f1239', 900: '#881337', 950: '#4c0519',
  },
}
