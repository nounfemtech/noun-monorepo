import { IconFileCheck, IconBellRinging, IconMapPin } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

const BULLETS = [
  {
    icon: IconFileCheck,
    text: 'Pedido com receita já validada.',
  },
  {
    icon: IconBellRinging,
    text: 'Status de produção comunicado automaticamente à paciente.',
  },
  {
    icon: IconMapPin,
    text: 'Visibilidade para pacientes da sua região.',
  },
]

export function Farmacias() {
  return (
    <section className="bg-violet-50/40">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
            Para farmácias
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Fila de pedido organizada, paciente de verdade.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {BULLETS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
                <Icon className="size-5 text-violet-700" stroke={2} aria-hidden="true" />
              </span>
              <span className="font-medium text-foreground/90">{text}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <a href="/lista-de-espera?tipo=farmacia">Quero ser farmácia parceira</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
