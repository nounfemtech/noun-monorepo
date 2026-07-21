'use client'

import { ThemeProvider } from '@noun/ui'

// Sem ColorThemeProvider aqui, de proposito: o connect usa cores fixas por canal
// via [data-tenant-type] no globals.css (decisao sancionada, ver CLAUDE.md secao 6).
// O provider injeta triplets HSL ("H S% L%") inline no <html> no mount, formato do
// pipeline do admin (hsl(var(--x))); o connect guarda cores completas (--x: hsl(...)),
// entao a injecao tornava --border/--muted/--input invalidos e o CSS caia em
// currentColor (bordas pretas) apos a hidratacao: o "flash of incorrect theme".
export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
