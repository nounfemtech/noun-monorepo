import type { Metadata } from 'next'
import { Reddit_Sans, Reddit_Mono } from 'next/font/google'
import { Providers } from './providers'
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
