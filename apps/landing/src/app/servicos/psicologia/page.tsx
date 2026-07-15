import type { Metadata } from 'next'
import { EspecialidadePage } from '@/components/especialidade-page'

export const metadata: Metadata = { title: 'Psicologia' }

export default function Page() {
  return <EspecialidadePage slug="psicologia" />
}
