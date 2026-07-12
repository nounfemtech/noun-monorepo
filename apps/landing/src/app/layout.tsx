import type { Metadata } from 'next'
import { Reddit_Sans, Reddit_Mono } from 'next/font/google'
import { Header } from '@/components/header'
import { siteDescription, siteName, siteTitle, siteUrl } from '@/lib/site'
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
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'saúde hormonal',
    'telemedicina',
    'endocrinologia',
    'ginecologia',
    'saúde trans',
    'farmácia de manipulação',
    'nutrição',
    'psicologia',
    'urologia',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${fontSans.variable} ${fontMono.variable}`}>
        <Header />
        {children}
      </body>
    </html>
  )
}
