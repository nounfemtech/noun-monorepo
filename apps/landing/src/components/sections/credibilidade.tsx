import { IconRocket, IconUsers, IconGavel } from '@tabler/icons-react'

const PONTOS = [
  {
    icon: IconRocket,
    title: 'Apoiado pelo Centelha',
    body: 'Noun foi validado e apoiado pelo Centelha, programa de inovação que impulsiona startups em estágio inicial.',
  },
  {
    icon: IconUsers,
    title: 'Equipe fundadora dedicada',
    body: 'Construído por uma equipe fundadora com dedicação integral ao problema da saúde hormonal fragmentada.',
  },
  {
    icon: IconGavel,
    title: 'Compromisso com conformidade',
    body: 'Compromisso declarado com a LGPD e com a Resolução CFM sobre telemedicina, desde a primeira linha de código.',
  },
]

export function Credibilidade() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Um projeto validado antes mesmo de nascer.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PONTOS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/50 p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-background">
                <Icon className="size-5 text-foreground" stroke={2} aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground text-pretty">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
