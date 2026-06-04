'use client'

import * as React from 'react'
import { COLOR_NAMES, type ColorName } from '../tokens/colors'

const STORAGE_KEY = 'noun-color-theme'
const DEFAULT_COLOR: ColorName = 'violet'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ColorThemeContextValue {
  colorTheme: ColorName
  setColorTheme: (color: ColorName) => void
}

const ColorThemeContext = React.createContext<ColorThemeContextValue>({
  colorTheme: DEFAULT_COLOR,
  setColorTheme: () => {},
})

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ColorThemeProvider({
  children,
  defaultColorTheme = DEFAULT_COLOR,
}: {
  children: React.ReactNode
  defaultColorTheme?: ColorName
}) {
  const [colorTheme, setColorThemeState] = React.useState<ColorName>(defaultColorTheme)

  // Lê do localStorage na montagem e aplica o atributo no <html>
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorName | null
    const initial = stored && (COLOR_NAMES as ReadonlyArray<string>).includes(stored)
      ? (stored as ColorName)
      : defaultColorTheme
    setColorThemeState(initial)
    applyAttribute(initial)
  }, [defaultColorTheme])

  function applyAttribute(color: ColorName) {
    document.documentElement.setAttribute('data-color-theme', color)
  }

  function setColorTheme(color: ColorName) {
    setColorThemeState(color)
    applyAttribute(color)
    localStorage.setItem(STORAGE_KEY, color)
  }

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useColorTheme() {
  const ctx = React.useContext(ColorThemeContext)
  if (!ctx) throw new Error('useColorTheme must be used within ColorThemeProvider')
  return ctx
}
