import type { Metadata } from 'next'
import { PlaceholderPage } from '@/components/placeholder-page'

export const metadata: Metadata = { title: 'Nossa missão' }

export default function Page() {
  return <PlaceholderPage title="Nossa missão" />
}
