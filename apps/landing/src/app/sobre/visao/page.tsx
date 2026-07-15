import type { Metadata } from 'next'
import { PlaceholderPage } from '@/components/placeholder-page'

export const metadata: Metadata = { title: 'Visão do Noun' }

export default function Page() {
  return <PlaceholderPage title="Visão do Noun" />
}
