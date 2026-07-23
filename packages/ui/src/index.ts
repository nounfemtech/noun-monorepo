// ============================================================
// @noun/ui — ponto de entrada
// ============================================================

// Utilidades
export { cn } from './lib/utils'
export { formatCRM, formatRQE, formatCRP, formatCRN, formatCRF } from './lib/formatters'

// Tokens do Design System
export * from './tokens'

// Providers
export { ThemeProvider } from './providers/theme-provider'
export {
  ColorThemeProvider,
  useColorTheme,
  applyPrimary,
  applyNeutral,
  DEFAULT_PRIMARY,
  DEFAULT_NEUTRAL,
} from './providers/color-theme-provider'

// Componentes compartilhados
export { ThemeSwitcher } from './components/theme-switcher'
export { ColorPicker, PrimaryColorPicker, NeutralColorPicker, ShadeColorPicker } from './components/color-picker'

// Componentes Shadcn/UI (adicionados via shadcn add em cada app)
// Os componentes gerados pelo Shadcn ficam em cada app — não aqui.
// Somente componentes 100% compartilhados e sem CSS-in-JS vivem neste pacote.
