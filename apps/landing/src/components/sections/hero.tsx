import { WaitlistForm } from '@/components/waitlist-form'

export function Hero() {
  return (
    <section id="waitlist" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse 90% 55% at 50% 0%, black 35%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 55% at 50% 0%, black 35%, transparent 85%)',
        }}
      >
        <div className="absolute size-12 bg-rose-200/30" style={{ left: 96, top: 0 }} />
        <div className="absolute size-12 bg-yellow-200/30" style={{ left: 336, top: 96 }} />
        <div className="absolute size-12 bg-blue-200/30" style={{ left: 624, top: 48 }} />
        <div className="absolute size-12 bg-violet-200/30" style={{ left: 864, top: 0 }} />
        <div className="absolute size-12 bg-rose-200/30" style={{ left: 1104, top: 144 }} />
        <div className="absolute size-12 bg-blue-200/30" style={{ left: 192, top: 240 }} />
        <div className="absolute size-12 bg-violet-200/30" style={{ left: 480, top: 192 }} />
        <div className="absolute size-12 bg-yellow-200/30" style={{ left: 768, top: 288 }} />
        <div className="absolute size-12 bg-rose-200/30" style={{ left: 960, top: 336 }} />
        <div className="absolute size-12 bg-blue-200/30" style={{ left: 48, top: 96 }} />
        <div className="absolute size-12 bg-yellow-200/30" style={{ left: 240, top: 0 }} />
        <div className="absolute size-12 bg-rose-200/30" style={{ left: 576, top: 144 }} />
        <div className="absolute size-12 bg-blue-200/30" style={{ left: 912, top: 96 }} />
        <div className="absolute size-12 bg-violet-200/30" style={{ left: 144, top: 192 }} />
        <div className="absolute size-12 bg-blue-200/30" style={{ left: 432, top: 288 }} />
        <div className="absolute size-12 bg-rose-200/30" style={{ left: 720, top: 0 }} />
        <div className="absolute size-12 bg-yellow-200/30" style={{ left: 1008, top: 192 }} />
        <div className="absolute size-12 bg-violet-200/30" style={{ left: 288, top: 336 }} />
        <div className="absolute size-12 bg-rose-200/30" style={{ left: 672, top: 240 }} />
        <div className="absolute size-12 bg-blue-200/30" style={{ left: 1056, top: 48 }} />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:py-32">
        <div className="relative z-10 flex flex-col items-start gap-6">
          <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700">
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
            <WaitlistForm tipo="paciente" />
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
