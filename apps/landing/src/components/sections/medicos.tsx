import {
  IconCalendarCheck,
  IconVideo,
  IconCoin,
  IconClipboardHeart,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

const BULLETS = [
  {
    icon: IconCalendarCheck,
    text: 'Agenda organizada, sem esforço de captação de paciente.',
  },
  {
    icon: IconVideo,
    text: 'Atendimento 100% remoto, por videochamada.',
  },
  {
    icon: IconCoin,
    text: 'Repasse automático pelo que você atender.',
  },
  {
    icon: IconClipboardHeart,
    text: 'Paciente já chega com contexto de saúde hormonal.',
  },
]

export function Medicos() {
  return (
    <section className="bg-blue-50/40">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            Para médicos e médicas
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Atenda o que você mais sabe fazer. O resto é com a gente.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          {BULLETS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Icon className="size-5 text-blue-700" stroke={2} aria-hidden="true" />
              </span>
              <span className="pt-2 font-medium text-foreground/90">{text}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button size="lg">Quero ser parceiro(a)</Button>
        </div>
      </div>
    </section>
  )
}
