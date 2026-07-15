import { IconActivity, IconBulb, IconCircleCheck, IconShieldLock } from '@tabler/icons-react'

type Block = {
  icon: typeof IconShieldLock
  heading: string
  paragraph: string
  bullets: string[]
  image: string
  imageAlt: string
  imageFirst?: boolean
  imageWide?: boolean
}

const BLOCKS: Block[] = [
  {
    icon: IconShieldLock,
    heading: 'Seu dado de saúde é seu.',
    paragraph:
      'Dado de identidade de gênero e histórico hormonal é dado sensível. No Noun, você decide o que compartilhar e com quem. Tratamento de dados segue a LGPD desde o primeiro cadastro.',
    bullets: [
      'Consentimento granular no cadastro.',
      'Você controla quem vê seu histórico.',
      'Dados de saúde protegidos ponta a ponta.',
    ],
    image: '/smart-dados.png',
    imageAlt: 'Visualização abstrata de fluxo de dados criptografados',
    imageWide: true,
  },
  {
    icon: IconActivity,
    heading: 'Seu status hormonal, sempre à vista.',
    paragraph:
      'Registre sintomas, ciclos e exames num só lugar e acompanhe sua evolução ao longo do tratamento. O Noun transforma seus dados em painéis simples, pra você entender o que está mudando no seu corpo antes mesmo da próxima consulta.',
    bullets: [
      'Linha do tempo de sintomas e exames.',
      'Alertas de janela ideal para reposição e exames.',
      'Histórico completo pronto pra compartilhar com seu médico.',
    ],
    image: '/modelo-noun.png',
    imageAlt: 'Mulher sorrindo, representando bem-estar e autoconhecimento',
    imageFirst: true,
  },
  {
    icon: IconBulb,
    heading: 'Aprenda sobre seu corpo, sem jargão médico.',
    paragraph:
      'Conteúdo assinado por especialistas em saúde hormonal, feito pra explicar o que os exames e sintomas realmente significam. Sem promessa milagrosa, sem letra miúda: só informação clara pra você decidir com segurança.',
    bullets: [
      'Artigos e guias sobre hormônios e identidade.',
      'Explicações simples pra resultados de exames.',
      'Conteúdo revisado por profissionais de saúde.',
    ],
    image: '/noun-model1.png',
    imageAlt: 'Mulher representando a jornada de autoconhecimento no Noun',
  },
]

export function SegurancaPrivacidade() {
  return (
    <section className="relative">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-20 sm:gap-28 sm:py-24">
        {BLOCKS.map((block) => (
          <div
            key={block.heading}
            className={`grid grid-cols-1 items-center gap-10 lg:gap-16 ${
              block.imageWide ? 'lg:grid-cols-[2fr_3fr]' : 'lg:grid-cols-2'
            }`}
          >
            <div className={block.imageFirst ? 'lg:order-first' : 'lg:order-last'}>
              <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl">
                <img src={block.image} alt={block.imageAlt} className="h-full w-full object-cover" />
              </div>
            </div>

            <div>
              <span className="flex size-12 items-center justify-center rounded-xl bg-blue-100">
                <block.icon className="size-6 text-blue-600" stroke={2} aria-hidden="true" />
              </span>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {block.heading}
              </h2>

              <p className="mt-4 text-lg text-muted-foreground text-pretty">{block.paragraph}</p>

              <ul className="mt-8 flex flex-col gap-4">
                {block.bullets.map((text) => (
                  <li key={text} className="flex items-center gap-3">
                    <IconCircleCheck className="size-5 shrink-0 text-blue-600" stroke={2} aria-hidden="true" />
                    <span className="text-foreground/90">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
