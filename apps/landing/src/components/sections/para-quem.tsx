import { Button } from '@/components/ui/button'

export function ParaQuem() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Feito para toda identidade que já cansou de se explicar de novo.
        </h2>
        <p className="mt-6 text-lg text-foreground/90 text-pretty">
          Mulheres cis, mulheres trans, homens trans e outras identidades
          femininas. O Noun nasceu para ser o primeiro lugar de saúde
          hormonal que trata sua identidade como ponto de partida, não como
          obstáculo.
        </p>

        <Button asChild size="lg" className="mt-8">
          <a href="#waitlist">Entrar na lista de espera</a>
        </Button>
      </div>
    </section>
  )
}
