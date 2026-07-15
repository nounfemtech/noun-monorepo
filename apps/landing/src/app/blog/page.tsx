import type { Metadata } from 'next'
import { PlaceholderPage } from '@/components/placeholder-page'

export const metadata: Metadata = { title: 'Blog' }

export default function Page() {
  return <PlaceholderPage title="Blog" />
}
