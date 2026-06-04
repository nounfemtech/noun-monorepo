// ============================================================
// Noun Design System — Typography Tokens
// ============================================================

/** Reddit Sans — fonte principal (sans-serif) */
export const FONT_SANS = {
  /** Nome exato para Google Fonts / next/font */
  name: 'Reddit Sans' as const,
  /** CSS variable exposta pela fonte */
  variable: '--font-sans' as const,
  /** Pesos disponíveis */
  weights: [300, 400, 500, 600, 700, 800, 900] as const,
  subsets: ['latin'] as const,
}

/** Reddit Mono — fonte monospace (código) */
export const FONT_MONO = {
  name: 'Reddit Mono' as const,
  variable: '--font-mono' as const,
  weights: [300, 400, 500, 600, 700] as const,
  subsets: ['latin'] as const,
}

/** Pesos explícitos para fontWeight no Tailwind */
export const fontWeight = {
  thin:       '100',
  extralight: '200',
  light:      '300',
  normal:     '400',
  medium:     '500',
  semibold:   '600',
  bold:       '700',
  extrabold:  '800',
  black:      '900',
} as const
