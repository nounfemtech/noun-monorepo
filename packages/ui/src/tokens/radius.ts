// ============================================================
// Noun Design System — Border Radius Tokens
// ============================================================

/** Escala named baseada em --radius (CSS variable, default 0.375rem) */
export const radius = {
  none: '0',
  sm:   'calc(var(--radius) - 4px)',   // ~0.25rem
  md:   'var(--radius)',                // 0.375rem  ← padrão
  DEFAULT: 'var(--radius)',
  lg:   'calc(var(--radius) + 2px)',   // ~0.5rem
  xl:   'calc(var(--radius) + 4px)',   // ~0.625rem
  '2xl':'calc(var(--radius) + 8px)',   // ~0.75rem
  '3xl':'calc(var(--radius) + 16px)',  // ~1rem
  '4xl':'calc(var(--radius) + 24px)',  // ~1.25rem
  full: '9999px',
} as const

/** Escala numérica de 0 a 1rem em steps de 0.125rem */
export const radiusNumeric = {
  'r-0': '0',
  'r-1': '0.125rem',
  'r-2': '0.25rem',
  'r-3': '0.375rem',
  'r-4': '0.5rem',
  'r-5': '0.625rem',
  'r-6': '0.75rem',
  'r-7': '0.875rem',
  'r-8': '1rem',
} as const

export type RadiusKey = keyof typeof radius
export type RadiusNumericKey = keyof typeof radiusNumeric
