import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    question: 'O que é o Noun?',
    answer:
      'Noun é uma plataforma de saúde hormonal que conecta você a especialistas e farmácias parceiras, com sua jornada de cuidado guardada em um só lugar.',
  },
  {
    question: 'Preciso pagar para usar o app?',
    answer:
      'Criar sua conta e entrar na lista de espera é gratuito. Valores de consulta e de farmácia variam por profissional e parceiro, e ficam sempre visíveis antes de você confirmar.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer:
      'Sim. Seus dados de identidade de gênero e histórico hormonal são dados sensíveis, e você decide o que compartilhar e com quem. Seguimos a LGPD desde o primeiro cadastro.',
  },
  {
    question: 'Funciona para mulheres trans e homens trans?',
    answer:
      'Sim. O Noun foi criado para mulheres cis, mulheres trans, homens trans e todas as identidades femininas, com cadastro pensado para respeitar como você se identifica.',
  },
  {
    question: 'Como funciona a consulta por vídeo?',
    answer:
      'Você agenda com o especialista certo pra você e faz a consulta por videochamada, direto pelo app, sem sair de casa.',
  },
  {
    question: 'Preciso ter plano de saúde?',
    answer:
      'Não. Você agenda e paga diretamente pelo app, sem depender de plano de saúde.',
  },
  {
    question: 'Como funciona a entrega da farmácia parceira?',
    answer:
      'Depois da receita, você escolhe uma farmácia parceira perto de você e acompanha o pedido em tempo real, do "em produção" até a entrega.',
  },
]

export function Faq() {
  return (
    <section className="bg-rose-50/40">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Perguntas frequentes
        </h2>

        <Accordion type="single" collapsible className="mt-10 w-full">
          {FAQS.map(({ question, answer }) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
