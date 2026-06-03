import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Noun — Portal',
  description: 'Portal web para médicos, farmácias e administradores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
