import type { Metadata } from 'next'
import { Faq } from '@/components/sections/faq'

export const metadata: Metadata = { title: 'Perguntas frequentes' }

export default function Page() {
  return <Faq />
}
