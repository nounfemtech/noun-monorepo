// ============================================================
// @noun/ui — ponto de entrada
// ============================================================

// Utilidades
export { cn } from './lib/utils'

// Tokens do Design System
export * from './tokens'

// Providers
export { ThemeProvider } from './providers/theme-provider'
export { ColorThemeProvider, useColorTheme } from './providers/color-theme-provider'

// Componentes compartilhados
export { ThemeSwitcher } from './components/theme-switcher'
export { ColorPicker } from './components/color-picker'

// Componentes Shadcn/UI (adicionados via shadcn add em cada app)
// Os componentes gerados pelo Shadcn ficam em cada app — não aqui.
// Somente componentes 100% compartilhados e sem CSS-in-JS vivem neste pacote.
