'use client'

import { SpacemanThemeProvider, ThemeAnimationType } from '@space-man/react-theme-animation'
import { ColorThemeProvider } from '@noun/ui'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SpacemanThemeProvider
      defaultTheme="system"
      animationType={ThemeAnimationType.CIRCLE}
      duration={500}
    >
      <ColorThemeProvider defaultColorTheme="yellow">
        {children}
      </ColorThemeProvider>
    </SpacemanThemeProvider>
  )
}
