import { ESPECIALIDADES } from '@/lib/especialidades'

export function Especialidades() {
  return (
    <section className="relative overflow-hidden bg-violet-50/40">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Especialistas que entendem de saúde hormonal.
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {ESPECIALIDADES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col items-center gap-4 text-center">
              <span className="flex size-10 items-center justify-center rounded-lg bg-violet-100">
                <Icon className="size-5 text-violet-700" stroke={2} aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground text-pretty">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
