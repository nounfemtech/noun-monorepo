// ============================================================
// Noun Design System — Border Radius Tokens (shadcn v4 scale)
// ============================================================

/** Escala multiplicativa baseada em --radius (CSS variable, default 0.5rem) */
export const radius = {
  none: '0',
  sm:   'calc(var(--radius) * 0.6)',
  md:   'calc(var(--radius) * 0.8)',
  DEFAULT: 'var(--radius)',
  lg:   'var(--radius)',
  xl:   'calc(var(--radius) * 1.4)',
  '2xl':'calc(var(--radius) * 1.8)',
  '3xl':'calc(var(--radius) * 2.2)',
  '4xl':'calc(var(--radius) * 2.6)',
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
