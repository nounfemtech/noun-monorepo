import { notFound } from 'next/navigation'
import { IconArrowRight } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { ESPECIALIDADES, type EspecialidadeSlug } from '@/lib/especialidades'

export function EspecialidadePage({ slug }: { slug: EspecialidadeSlug }) {
  const especialidade = ESPECIALIDADES.find((item) => item.slug === slug)

  if (!especialidade) {
    notFound()
  }

  const { icon: Icon, title, body } = especialidade

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
      <span className="flex size-12 items-center justify-center rounded-xl bg-violet-100">
        <Icon className="size-6 text-violet-700" stroke={2} aria-hidden="true" />
      </span>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>

      <p className="mt-4 text-lg text-muted-foreground text-pretty">{body}</p>

      <Button asChild size="lg" className="group mt-8 h-11">
        <a href="/lista-de-espera?tipo=paciente">
          Entrar na lista de espera
          <IconArrowRight className="transition-transform group-hover:translate-x-0.5" stroke={2} />
        </a>
      </Button>
    </section>
  )
}
