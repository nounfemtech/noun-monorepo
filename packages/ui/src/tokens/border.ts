// ============================================================
// Noun Design System — Border Width Tokens
// ============================================================

/**
 * Escala de border-width disponível.
 * Utilities geradas: border-0, border-thin, border, border-medium, border-2, border-3, border-4
 */
export const borderWidth = {
  '0':      '0px',
  'thin':   '0.5px',
  DEFAULT:  '1px',
  'medium': '1.5px',
  '2':      '2px',
  '3':      '3px',
  '4':      '4px',
} as const

export type BorderWidthKey = keyof typeof borderWidth
