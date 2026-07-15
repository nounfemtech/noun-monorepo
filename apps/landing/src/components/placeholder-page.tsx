export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center sm:py-32">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground text-pretty">
        Esta página está em construção. Volte em breve para conferir.
      </p>
    </section>
  )
}
