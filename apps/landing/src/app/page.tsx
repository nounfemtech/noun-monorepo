import { Hero } from '@/components/sections/hero'
import { AppFeatures } from '@/components/sections/app-features'
import { AppDownloadCta } from '@/components/sections/app-download-cta'
import { Especialidades } from '@/components/sections/especialidades'
import { ParaQuem } from '@/components/sections/para-quem'
import { SegurancaPrivacidade } from '@/components/sections/seguranca-privacidade'
import { Medicos } from '@/components/sections/medicos'
import { Farmacias } from '@/components/sections/farmacias'
import { Credibilidade } from '@/components/sections/credibilidade'
import { EstamosComecando } from '@/components/sections/estamos-comecando'
import { Faq } from '@/components/sections/faq'
import { CtaFinalRodape } from '@/components/sections/cta-final-rodape'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <AppFeatures />
      <AppDownloadCta />
      <Especialidades />
      <ParaQuem />
      <SegurancaPrivacidade />
      <Medicos />
      <Farmacias />
      <Credibilidade />
      <EstamosComecando />
      <Faq />
      <CtaFinalRodape />
    </main>
  )
}
