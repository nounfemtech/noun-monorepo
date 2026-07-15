import type { Metadata } from 'next'
import { Farmacias } from '@/components/sections/farmacias'

export const metadata: Metadata = { title: 'Farmácia e medicamento' }

export default function Page() {
  return <Farmacias />
}
