import { IconSparkles } from '@tabler/icons-react'

export function EstamosComecando() {
  return (
    <section className="relative overflow-hidden bg-secondary/50">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-sm font-medium text-foreground">
          <IconSparkles className="size-4" stroke={2} aria-hidden="true" />
          Estamos apenas começando
        </span>

        <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Esse é só o primeiro passo da nossa jornada.
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-pretty">
          O Noun está no início. Estamos construindo com cuidado, ouvindo cada
          pessoa que confia em nós e evoluindo a cada semana. Tem muita
          novidade a caminho: novas especialidades, novos recursos no app e
          formas ainda melhores de cuidar da sua saúde hormonal.
        </p>

        <p className="mx-auto mt-4 max-w-xl text-sm font-medium text-foreground">
          Entre na lista de espera e acompanhe de perto tudo o que vem por aí.
        </p>
      </div>
    </section>
  )
}
