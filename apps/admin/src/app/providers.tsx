'use client'

import { SpacemanThemeProvider, ThemeAnimationType } from '@space-man/react-theme-animation'
import { ColorThemeProvider } from '@noun/ui'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SpacemanThemeProvider
      defaultTheme="system"
      animationType={ThemeAnimationType.CIRCLE}
      duration={500}
    >
      <ColorThemeProvider defaultColorTheme="yellow">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </ColorThemeProvider>
    </SpacemanThemeProvider>
  )
}
