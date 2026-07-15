import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@tabler/icons-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute size-[34rem] translate-x-20 -translate-y-20 rounded-full bg-rose-100/60" />
        <div className="absolute size-[40rem] -translate-x-64 translate-y-48 rounded-full bg-yellow-100/60" />
        <div className="absolute size-[34rem] -translate-x-full -translate-y-64 rounded-full bg-blue-100/60" />
        <div className="absolute size-[34rem] translate-x-64 -translate-y-full rounded-full bg-violet-100/60" />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-14 lg:grid-cols-2 lg:py-16">
        <div className="relative z-10 flex flex-col items-start gap-6">
          <span className="text-sm font-medium text-black">
            Saúde hormonal, do seu jeito.
          </span>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            O cuidado hormonal que a sua identidade merece, do começo ao fim.
          </h1>

          <p className="max-w-lg text-lg text-muted-foreground text-pretty">
            Noun conecta mulheres cis, mulheres trans e todas as identidades
            femininas a especialistas e farmácias parceiras, com sua jornada
            de saúde hormonal.
          </p>

          <div className="pt-2">
            <Button asChild size="lg" className="group h-11">
              <a href="/lista-de-espera?tipo=paciente">
                Entrar na lista de espera
                <IconArrowRight className="transition-transform group-hover:translate-x-0.5" stroke={2} />
              </a>
            </Button>
          </div>
        </div>

        <div className="relative order-first lg:order-last">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
            <img
              src="/hero-model.png"
              alt="Mulher de cabelo cacheado, iluminada por luzes coloridas nas cores da marca Noun"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
