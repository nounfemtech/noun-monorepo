import React, { createContext, useContext } from 'react'
import { useColorScheme } from 'react-native'

// ============================================================
// Theme Provider — Mobile (Expo / React Native)
// Usa useColorScheme do React Native em vez de next-themes.
// ============================================================

type ColorScheme = 'light' | 'dark'

interface MobileThemeContextValue {
  colorScheme: ColorScheme
  isDark: boolean
}

const MobileThemeContext = createContext<MobileThemeContextValue>({
  colorScheme: 'light',
  isDark: false,
})

export function MobileThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme() ?? 'light'
  const colorScheme: ColorScheme = scheme === 'dark' ? 'dark' : 'light'

  return (
    <MobileThemeContext.Provider value={{ colorScheme, isDark: colorScheme === 'dark' }}>
      {children}
    </MobileThemeContext.Provider>
  )
}

export function useMobileTheme() {
  return useContext(MobileThemeContext)
}
