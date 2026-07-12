# CLAUDE.md — apps/landing (Noun)

> Ler este arquivo no início de toda sessão do Claude Code que trabalhar em `apps/landing`. Ele é a fonte de verdade para produto, marca, design system e copy desta app dentro do `noun-monorepo`.

## 1. O que é esta app

Landing page pública do Noun. Primeira impressão da marca para três públicos diferentes: pacientes, médicos parceiros e farmácias parceiras. Objetivo é conversão, não é o produto em si (o app mobile e os portais são produtos separados no mesmo monorepo).

Produto irmão no roadmap: NOUN-32 (Fase 0, Fundação). Stack definida no PRD: Next.js + Shadcn/UI, deploy Vercel.

Norte do Noun: cuidado em saúde hormonal para todas as pessoas e identidades. Tagline: "Saúde hormonal, do seu jeito."

## 2. Público e prioridade de conversão

Três públicos, três CTAs diferentes:

| Público | O que a página precisa provar | CTA |
|---|---|---|
| Pacientes (mulheres cis, mulheres trans, homens trans, identidades femininas) | Que existe um lugar que entende sua identidade e centraliza sua saúde hormonal | Entrar na lista de espera |
| Médicos e médicas parceiras (Gineco, Endócrino, Nutri, Psico, Uro) | Que vale a pena atender por aqui: agenda, repasse, sem esforço de captação | Quero ser parceiro(a) |
| Farmácias de manipulação parceiras | Que o fluxo de pedidos é organizado e a base de pacientes é real | Quero ser farmácia parceira |

Status atual do produto (jul/2026): pré-lançamento, app mobile ainda em construção. CTA principal de paciente deve ser waitlist/lista de espera, não "baixar app". Trocar para "Baixar o app" quando o app for publicado nas lojas.

## 3. Stack técnica

- Next.js (App Router, TypeScript), dentro de `apps/landing` no monorepo Turborepo + pnpm
- Tailwind CSS v4 (`@theme inline`, tokens em oklch, sem `tailwind.config.ts`)
- Shadcn/UI — sem design system proprietário, componentes consumidos sem alterar propriedades visuais base (só via CSS vars em `globals.css`, mesma regra do resto do monorepo)
- Ícones: Tabler Icons
- Tipografia: Reddit Sans (100–900) + Reddit Mono (uso pontual, dado/código)
- Deploy: Vercel, projeto `noun-monorepo-web` com Root Directory reapontado para `apps/landing` (jul/2026: `apps/web`, o app público separado, ainda é só scaffold sem páginas reais, então o domínio existente foi reaproveitado em vez de criar um projeto novo). URL: `noun-monorepo-web.vercel.app`.
- Backend do formulário de waitlist: Supabase (mesmo projeto do ecossistema)

## 4. Sistema de design

### 4.1 Cores de marca (definitivas)

Paleta primária: 4 cores, direto da paleta padrão do Tailwind, sem redefinição de hue. Como já existem no palette default do Tailwind v4, `bg-blue-300`, `bg-yellow-400`, `bg-rose-300` e `bg-violet-300` funcionam sem precisar sobrescrever nada. Os valores exatos (para referência e para eventuais tokens semânticos):

| Cor de marca | Classe Tailwind | oklch |
|---|---|---|
| Blue 300 | `blue-300` | `oklch(80.9% 0.105 251.813)` |
| Yellow 400 | `yellow-400` | `oklch(85.2% 0.199 91.936)` |
| Rose 300 | `rose-300` | `oklch(81% 0.117 11.638)` |
| Violet 300 | `violet-300` | `oklch(81.1% 0.111 293.571)` |

Os demais tons de cada uma dessas quatro paletas (50–950) ficam disponíveis como apoio (hover, backgrounds sutis, texto sobre fundo colorido, etc.), nunca como cor principal de uma seção.

**Alocação implementada por seção** (`bg-*-50/40` para fundo de seção, `bg-*-100`/`text-*-700` para badge de ícone):
- **Yellow 400**: cor de ação. Botões primários e CTAs em toda a página.
- **Rose**: Hero (eyebrow badge) e seção 2 "O que você pode fazer no app" (`app-features.tsx`, `bg-rose-50/40`).
- **Violet**: seção 3 "Especialidades disponíveis" (`especialidades.tsx`, `bg-violet-50/40`, ícones `bg-violet-100`/`text-violet-700`).
- **Blue**: badge de ícone da seção "Segurança e privacidade" (`seguranca-privacidade.tsx`).
- Seção 4 "Para quem é o Noun" (`para-quem.tsx`) usa `bg-background` (branco/neutro), sem cor de marca dominante.
- "Para médicos" e "Para farmácias" ainda não migradas para esse padrão sem-card; alocação de cor (blue/violet, respectivamente) segue como proposta original até serem revisadas.

### 4.2 Neutro

Paleta `neutral` (Tailwind), 50–950. Base de texto, fundo e bordas em toda a página.

| Token | oklch |
|---|---|
| neutral-50 | oklch(98.5% 0 0) |
| neutral-100 | oklch(97% 0 0) |
| neutral-200 | oklch(92.2% 0 0) |
| neutral-300 | oklch(87% 0 0) |
| neutral-400 | oklch(70.8% 0 0) |
| neutral-500 | oklch(55.6% 0 0) |
| neutral-600 | oklch(43.9% 0 0) |
| neutral-700 | oklch(37.1% 0 0) |
| neutral-800 | oklch(26.9% 0 0) |
| neutral-900 | oklch(20.5% 0 0) |
| neutral-950 | oklch(14.5% 0 0) |

### 4.3 Semânticas

Convenção padrão do Tailwind/shadcn, independente das 4 cores de marca:
- Sucesso: `green-500`
- Aviso: `amber-500`
- Erro/destrutivo: `red-500`
- Informação: `blue-500` (tom mais escuro que o Blue 300 de marca, sem ambiguidade visual)

### 4.4 Tipografia e ícones

- Display/headings e corpo: Reddit Sans, pesos 100–900, carregada via `next/font`
- Uso técnico/dado pontual: Reddit Mono
- Ícones: Tabler Icons (`@tabler/icons-react`)

### 4.5 Radius e bordas

- Radius global: escala 0–1rem (sm/md/lg/xl/2xl/3xl/4xl), mesma convenção do resto do monorepo
- Border width: default/0/0.5px/1px/1.5px/2px/3px/4px

### 4.6 Modo de cor

Light mode como padrão de lançamento (marketing converte melhor em fundo claro). Dark mode como fast-follow, reaproveitando os tokens do Vaughan (`ColorThemeProvider`) se fizer sentido depois.

### 4.7 Direção visual (guia para quem for construir)

Elemento de assinatura implementado no Hero: grade de linhas de fundo (`linear-gradient` 48px x 48px, cor `var(--border)`) com fade curvo de opacidade via `radial-gradient` em `maskImage`/`WebkitMaskImage`, e alguns quadrados de 48px pintados nas 4 cores de marca (`rose/blue/yellow/violet-200` a 30% de opacidade), alinhados aos vértices da grade. Ver `hero.tsx`.

Seções sem cards: a partir da revisão de jul/2026, ícone + título + texto ficam direto no fundo colorido da seção (sem wrapper de card, sem borda, sem sombra). Ícone em badge quadrado com cantos arredondados (`rounded-lg`), nunca círculo.

Evitar os clichês visuais mais comuns de página gerada por IA: fundo bege com serifada de alto contraste e terracota; fundo quase preto com um único acento neon; layout jornal com hairlines e radius zero. Nenhum dos três combina com um produto de saúde inclusivo e acolhedor.

## 5. Arquitetura de informação

Ordem real implementada em `page.tsx` (a seção "Problema & Solução / Como Funciona" da v1 do PRD foi removida da página; "O que você pode fazer no app" passou a ser a seção 2 visível):

| # | Seção | Componente | Objetivo |
|---|---|---|---|
| 1 | Hero | `hero.tsx` | Comunicar em 3 segundos o que é o Noun e para quem é |
| 2 | O que você pode fazer no app | `app-features.tsx` | Detalhar os módulos do app mobile em benefícios, não em features técnicas |
| — | CTA de download do app | `app-download-cta.tsx` | Badges de loja (App Store / Google Play), não conta como seção numerada |
| 3 | Especialidades disponíveis | `especialidades.tsx` | Gineco, Endócrino, Nutri, Psico, Uro |
| 4 | Para quem é o Noun | `para-quem.tsx` | Reforço de identidade e inclusão, nomeando os públicos, com CTA de waitlist |
| 5 | Segurança e privacidade | `seguranca-privacidade.tsx` | Confiança em dado de saúde sensível, LGPD, controle da paciente |
| — | Para médicos e médicas parceiras | `medicos.tsx` | Aquisição de médicos |
| — | Para farmácias parceiras | `farmacias.tsx` | Aquisição de farmácias |
| — | Credibilidade | `credibilidade.tsx` | Prova de seriedade sem depoimento inventado (pré-lançamento) |
| — | Estamos começando | `estamos-comecando.tsx` | Reforço de estágio pré-lançamento |
| — | FAQ | `faq.tsx` | Reduzir objeção antes da conversão |
| — | CTA final + Rodapé | `cta-final-rodape.tsx` | Última chance de conversão + navegação institucional |

## 6. Copy de referência (PT-BR)

> Copy inicial para desenvolvimento. Sujeita a revisão da Úrsula antes de ir para produção.

### 1. Hero
- Eyebrow: Saúde hormonal, do seu jeito.
- H1: O cuidado hormonal que a sua identidade merece, do começo ao fim.
- Sub: Noun conecta mulheres cis, mulheres trans, homens trans e todas as identidades femininas a especialistas e farmácias parceiras, com sua jornada de saúde guardada com você, sempre.
- CTA primário: Entrar na lista de espera
- CTA secundário: Sou profissional de saúde

### 2. Problema & Solução
- Eyebrow: O problema
- H2: Saúde hormonal não devia ser um labirinto.
- Bloco problema: Histórico espalhado entre clínicas. Repetir a mesma história em cada consulta. Especialista que não entende sua identidade de gênero. Farmácia de manipulação difícil de achar perto de você.
- Bloco solução: No Noun, seu histórico fica com você. Você agenda com quem entende de saúde hormonal de verdade, recebe a receita direto no app e acompanha o pedido na farmácia parceira até a entrega.

### 3. Como Funciona
- H2: Do agendamento à entrega, em um só lugar.
- Pacientes: 1. Cadastre-se e conte sua história de saúde. 2. Agende com o especialista certo pra você. 3. Receba sua receita direto no app. 4. Peça na farmácia parceira e acompanhe a entrega.
- Médicos: 1. Cadastro e aprovação. 2. Organize sua agenda. 3. Atenda por videochamada. 4. Receba seu repasse.
- Farmácias: 1. Cadastro e aprovação. 2. Receba pedidos. 3. Produza e informe o status. 4. Entregue com rastreio.

### 4. O que você pode fazer no app
- H2: Tudo que sua saúde hormonal precisa, num app só.
- Perfil que entende você: cadastro com espaço pra identidade de gênero, histórico hormonal e preferências de privacidade, do jeito que você quiser contar.
- Agende com o especialista certo: Ginecologia, Endocrinologia, Nutrição, Psicologia, Urologia. Filtre por avaliação e disponibilidade, consulte por vídeo sem sair de casa.
- Receita e farmácia, sem enrolação: receita digital direto no app, farmácias parceiras perto de você, pedido acompanhado em tempo real do "em produção" ao "entregue".
- Sua jornada hormonal, num só lugar: linha do tempo com consultas, exames e sintomas, diário hormonal e lembretes de medicação e consulta.
- Conteúdo que fala a sua língua: biblioteca de artigos sobre saúde hormonal, curada por especialistas, organizada por identidade e tema.
- Pagamento simples e seguro: Pix e outras formas de pagamento, histórico e nota fiscal, sem burocracia.

### 5. Especialidades disponíveis
- H2: Especialistas que entendem de saúde hormonal.
- Cards: Ginecologia · Endocrinologia · Nutrição · Psicologia · Urologia (uma linha de apoio por especialidade, focada em quando procurar cada uma)

### 6. Para quem é o Noun
- H2: Feito para toda identidade que já cansou de se explicar de novo.
- Corpo: Mulheres cis, mulheres trans, homens trans e outras identidades femininas. O Noun nasceu para ser o primeiro lugar de saúde hormonal que trata sua identidade como ponto de partida, não como obstáculo.

### 7. Segurança e privacidade
- H2: Seu dado de saúde é seu.
- Corpo: Dado de identidade de gênero e histórico hormonal é dado sensível. No Noun, você decide o que compartilhar e com quem. Tratamento de dados segue a LGPD desde o primeiro cadastro.
- Bullets: Consentimento granular no cadastro. Você controla quem vê seu histórico. Dados de saúde protegidos ponta a ponta.

### 8. Para médicos e médicas parceiras
- Eyebrow: Para médicos e médicas
- H2: Atenda o que você mais sabe fazer. O resto é com a gente.
- Bullets: Agenda organizada, sem esforço de captação de paciente. Atendimento 100% remoto, por videochamada. Repasse automático pelo que você atender. Paciente já chega com contexto de saúde hormonal.
- CTA: Quero ser parceiro(a)

### 9. Para farmácias parceiras
- Eyebrow: Para farmácias
- H2: Fila de pedido organizada, paciente de verdade.
- Bullets: Pedido com receita já validada. Status de produção comunicado automaticamente à paciente. Visibilidade para pacientes da sua região.
- CTA: Quero ser farmácia parceira

### 10. Credibilidade
> Não inventar depoimento de usuária real antes de existir. Enquanto não há early users, usar prova de seriedade institucional em vez de depoimento fabricado.
- H2 sugerido: Um projeto validado antes mesmo de nascer.
- Conteúdo possível: menção ao apoio via Centelha (programa de inovação), formação da equipe fundadora, compromisso declarado com LGPD e Resolução CFM sobre telemedicina. Trocar por depoimentos reais assim que existirem early adopters.

### 11. FAQ
- O que é o Noun?
- Preciso pagar para usar o app?
- Meus dados estão seguros?
- Funciona para mulheres trans e homens trans?
- Como funciona a consulta por vídeo?
- Preciso ter plano de saúde?
- Como funciona a entrega da farmácia parceira?

### 12. CTA final + Rodapé
- H2 final: Sua saúde hormonal não devia ser um labirinto.
- CTA: Entrar na lista de espera
- Rodapé: Termos de uso · Política de privacidade · Contato · Redes sociais · Saúde hormonal, do seu jeito.

## 7. Voz e tom

- Tom caloroso e direto, nunca clínico ou frio, mesmo em conteúdo institucional
- Ativa, não passiva: "você agenda", não "pode ser agendado"
- Nomear os quatro públicos por extenso quando o espaço permitir: mulheres cis, mulheres trans, homens trans, identidades femininas, antes de fechar com "e todas as identidades"
- Sem promessa clínica ou de resultado de tratamento (risco regulatório CFM/ANVISA). Falar em acesso e continuidade de cuidado, não em cura ou resultado
- Sem depoimento fabricado. Prova social só com dado real
- Evitar travessão (—) e seta (→) no copy, inclusive em qualquer conteúdo que for para o Notion

## 8. SEO e performance (metas do PRD)

- Meta tags otimizadas por página, Open Graph para compartilhamento
- Core Web Vitals: LCP < 2,5s · CLS < 0,1 · FID < 100ms
- Sitemap + robots.txt
- Imagens via `next/image`
- Analytics: a definir (Plausible ou Google Analytics)

## 9. Regras de workflow (herdadas do monorepo)

- Nunca commitar sem revisão visual da Úrsula
- Ao concluir a task NOUN-32 no Notion, adicionar seção "📋 Log de Implementação" com data, responsável (Úrsula), commit, arquivos criados/modificados, decisões tomadas, verificação e observações
- Componentes shadcn consumidos sem alterar propriedade visual base, só via CSS vars em `globals.css`
- Prompts de Claude Code sempre em bloco de código, nunca em prosa solta

## 10. Em aberto (decidir com a Úrsula)

- Analytics: Plausible ou Google Analytics
- Onde armazenar a lista de espera: tabela nova no Supabase (`landing_waitlist`) é o caminho mais simples dado o backend já existente
- Se a seção "Credibilidade" entra no lançamento ou só depois dos primeiros early adopters
- Alocação final das 4 cores por seção (proposta na seção 4.1 é ponto de partida)
- Dark mode: lançar já ou como fast-follow
