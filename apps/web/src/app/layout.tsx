import type { Metadata } from 'next'
import { Reddit_Sans, Reddit_Mono } from 'next/font/google'
import { ThemeProvider, ColorThemeProvider } from '@noun/ui'
import './globals.css'

// ============================================================
// Fontes — Reddit Sans + Reddit Mono (Google Fonts via next/font)
// ============================================================

const fontSans = Reddit_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const fontMono = Reddit_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

// ============================================================
// Metadata
// ============================================================

export const metadata: Metadata = {
  title: 'Noun: Portal',
  description: 'Portal web para médicos, farmácias e administradores',
}

// ============================================================
// Root Layout
// ============================================================

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable}`}>
        <ThemeProvider>
          <ColorThemeProvider defaultColorTheme="violet">
            {children}
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
