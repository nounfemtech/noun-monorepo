import { WaitlistForm } from '@/components/waitlist-form'

const RODAPE_LINKS = [
  { label: 'Termos de uso', href: '/termos' },
  { label: 'Política de privacidade', href: '/privacidade' },
  { label: 'Contato', href: '/contato' },
  { label: 'Redes sociais', href: '/redes-sociais' },
]

export function CtaFinalRodape() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 pt-20 sm:pt-24">
        <div className="flex flex-col items-center gap-8 rounded-3xl bg-foreground px-6 py-16 text-center sm:px-16">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance text-background sm:text-4xl">
            Sua saúde hormonal não devia ser um labirinto.
          </h2>
          <div className="w-full max-w-md rounded-2xl bg-background p-2">
            <WaitlistForm tipo="paciente" className="sm:[&>div]:justify-center" />
          </div>
        </div>
      </div>

      <footer className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 border-t border-border pt-10 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Saúde hormonal, do seu jeito.
          </p>
          <nav aria-label="Rodapé">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {RODAPE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </section>
  )
}
