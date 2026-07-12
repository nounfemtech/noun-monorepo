export function AppDownloadCta() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pt-12 sm:pt-16 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div className="max-w-xl pb-12 sm:pb-16">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Seu cuidado hormonal, sempre à mão.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground text-pretty">
            Agende com especialistas, acompanhe sua receita e veja sua
            jornada hormonal completa, direto do seu celular, onde você
            estiver.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button type="button" className="transition-transform active:scale-[0.97]">
              <img
                src="/app-store-badge.svg"
                alt="Baixar na App Store"
                className="h-11 w-auto sm:h-12"
              />
            </button>

            <button type="button" className="transition-transform active:scale-[0.97]">
              <img
                src="/google-play-badge.svg"
                alt="Disponível no Google Play"
                className="h-11 w-auto sm:h-12"
              />
            </button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">Em breve nas lojas.</p>
        </div>

        <div className="relative flex flex-col items-center justify-end">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-10 top-0 size-56 rounded-full bg-blue-100 blur-3xl" />
            <div className="absolute right-0 top-6 size-64 rounded-full bg-yellow-100 blur-3xl" />
            <div className="absolute -left-6 bottom-6 size-60 rounded-full bg-violet-100 blur-3xl" />
            <div className="absolute right-4 bottom-0 size-52 rounded-full bg-rose-100 blur-3xl" />
          </div>

          <img
            src="/app-home-screen.svg"
            alt="Tela inicial do app Noun"
            className="w-[360px] sm:w-[480px] lg:w-[560px]"
          />
        </div>
      </div>
    </section>
  )
}
