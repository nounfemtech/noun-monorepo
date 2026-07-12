import {
  IconUserHeart,
  IconStethoscope,
  IconPrescription,
  IconTimeline,
  IconFileText,
  IconQrcode,
} from '@tabler/icons-react'

const FEATURES = [
  {
    icon: IconUserHeart,
    title: 'Perfil que entende você',
    body: 'Cadastro com espaço pra identidade de gênero, histórico hormonal e preferências de privacidade, do jeito que você quiser contar.',
  },
  {
    icon: IconStethoscope,
    title: 'Agende com o especialista certo',
    body: 'Ginecologia, Endocrinologia, Nutrição, Psicologia, Urologia. Filtre por avaliação e disponibilidade, consulte por vídeo sem sair de casa.',
  },
  {
    icon: IconPrescription,
    title: 'Receita e farmácia, sem enrolação',
    body: 'Receita digital direto no app, farmácias parceiras perto de você, pedido acompanhado em tempo real da "produção" ao "entregue".',
  },
  {
    icon: IconTimeline,
    title: 'Sua jornada hormonal, num só lugar',
    body: 'Linha do tempo com consultas, exames e sintomas, diário hormonal e lembretes de medicação e consulta.',
  },
  {
    icon: IconFileText,
    title: 'Conteúdo que fala a sua língua',
    body: 'Biblioteca de artigos sobre saúde hormonal, curada por especialistas, organizada por identidade e tema.',
  },
  {
    icon: IconQrcode,
    title: 'Pagamento simples e seguro',
    body: 'Pagamento Pix com histórico e nota fiscal, sem burocracia.',
  },
]

export function AppFeatures() {
  return (
    <section className="relative overflow-hidden bg-rose-50/40">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Tudo que sua saúde hormonal precisa, num app só.
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-rose-100">
                <Icon className="size-5 text-rose-700" stroke={2} aria-hidden="true" />
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
