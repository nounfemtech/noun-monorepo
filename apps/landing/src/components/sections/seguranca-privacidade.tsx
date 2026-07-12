import { IconCircleCheck, IconShieldLock } from '@tabler/icons-react'

const BULLETS = [
  'Consentimento granular no cadastro.',
  'Você controla quem vê seu histórico.',
  'Dados de saúde protegidos ponta a ponta.',
]

export function SegurancaPrivacidade() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
        <span className="flex size-12 items-center justify-center rounded-xl bg-blue-100">
          <IconShieldLock className="size-6 text-blue-600" stroke={2} aria-hidden="true" />
        </span>

        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Seu dado de saúde é seu.
        </h2>

        <p className="mt-4 text-lg text-muted-foreground text-pretty">
          Dado de identidade de gênero e histórico hormonal é dado sensível.
          No Noun, você decide o que compartilhar e com quem. Tratamento de
          dados segue a LGPD desde o primeiro cadastro.
        </p>

        <ul className="mt-8 flex flex-col gap-4">
          {BULLETS.map((text) => (
            <li key={text} className="flex items-center gap-3">
              <IconCircleCheck
                className="size-5 shrink-0 text-blue-600"
                stroke={2}
                aria-hidden="true"
              />
              <span className="text-foreground/90">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
