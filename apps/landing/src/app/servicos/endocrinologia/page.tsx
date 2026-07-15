import type { Metadata } from 'next'
import { EspecialidadePage } from '@/components/especialidade-page'

export const metadata: Metadata = { title: 'Endocrinologia' }

export default function Page() {
  return <EspecialidadePage slug="endocrinologia" />
}
