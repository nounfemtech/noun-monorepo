import type { Metadata } from 'next'
import { EspecialidadePage } from '@/components/especialidade-page'

export const metadata: Metadata = { title: 'Nutrição' }

export default function Page() {
  return <EspecialidadePage slug="nutricao" />
}
