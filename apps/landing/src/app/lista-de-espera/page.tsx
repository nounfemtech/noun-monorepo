import type { Metadata } from 'next'
import { WaitlistPageForm } from '@/components/waitlist-page-form'
import type { WaitlistTipo } from '@/app/actions'

export const metadata: Metadata = {
  title: 'Lista de espera',
}

const TIPOS_VALIDOS: WaitlistTipo[] = ['paciente', 'medico', 'farmacia']

const TITULOS: Record<WaitlistTipo, string> = {
  paciente: 'Entre na lista de espera',
  medico: 'Quero ser parceiro(a) médico(a)',
  farmacia: 'Quero ser farmácia parceira',
}

const DESCRICOES: Record<WaitlistTipo, string> = {
  paciente:
    'Deixe seus dados para ser avisada assim que o Noun estiver disponível na sua região.',
  medico:
    'Deixe seus dados e nossa equipe entra em contato para os próximos passos da parceria.',
  farmacia:
    'Deixe os dados da sua farmácia e nossa equipe entra em contato para os próximos passos da parceria.',
}

export default async function ListaDeEsperaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const { tipo: tipoParam } = await searchParams
  const tipo: WaitlistTipo = TIPOS_VALIDOS.includes(tipoParam as WaitlistTipo)
    ? (tipoParam as WaitlistTipo)
    : 'paciente'

  return (
    <section className="mx-auto max-w-lg px-6 py-24 sm:py-32">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {TITULOS[tipo]}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-pretty">
        {DESCRICOES[tipo]}
      </p>

      <div className="mt-10">
        <WaitlistPageForm tipo={tipo} />
      </div>
    </section>
  )
}
