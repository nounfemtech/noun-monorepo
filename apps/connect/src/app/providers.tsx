'use client'

import { ThemeProvider, ColorThemeProvider } from '@noun/ui'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ColorThemeProvider>
        {children}
      </ColorThemeProvider>
    </ThemeProvider>
  )
}
