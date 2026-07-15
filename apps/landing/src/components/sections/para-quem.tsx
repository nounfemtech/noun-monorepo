import { Button } from '@/components/ui/button'

export function ParaQuem() {
  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-6 py-20 sm:py-24 lg:grid-cols-[auto_1fr]">
        <div className="relative w-full max-w-md">
          <img
            src="/noun-model1.png"
            alt="Modelo representando a diversidade de identidades atendidas pelo Noun"
            className="h-auto w-full rounded-3xl"
          />
        </div>

        <div className="flex flex-col items-start text-left">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Feito para toda identidade que já cansou de se explicar de novo.
          </h2>
          <p className="mt-6 text-lg text-foreground/90 text-pretty">
            Mulheres cis, mulheres trans e outras identidades femininas. O
            Noun nasceu para ser o primeiro lugar de saúde hormonal que
            trata sua identidade como ponto de partida, não como obstáculo.
          </p>

          <Button asChild size="lg" className="mt-8">
            <a href="/lista-de-espera?tipo=paciente">Entrar na lista de espera</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
