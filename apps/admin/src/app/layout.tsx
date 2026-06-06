import type { Metadata } from 'next'
import { Reddit_Sans, Reddit_Mono } from 'next/font/google'
import { SpacemanThemeProvider, ThemeAnimationType } from '@space-man/react-theme-animation'
import { ColorThemeProvider } from '@noun/ui'
import './globals.css'

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

export const metadata: Metadata = {
  title: 'Noun Admin',
  description: 'Painel administrativo Noun',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable}`}>
        <SpacemanThemeProvider
          defaultTheme="system"
          animationType={ThemeAnimationType.CIRCLE}
          duration={500}
        >
          <ColorThemeProvider defaultColorTheme="yellow">
            {children}
          </ColorThemeProvider>
        </SpacemanThemeProvider>
      </body>
    </html>
  )
}
