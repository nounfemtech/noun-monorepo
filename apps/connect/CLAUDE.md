# CLAUDE.md — apps/connect (Noun)

> Ler este arquivo no início de toda sessão do Claude Code que trabalhar em `apps/connect`. Complementa o `CLAUDE.md` raiz do monorepo (convenções gerais já valem aqui).

## 1. O que é esta app

Noun Connect é o portal de acesso para parceiros da Noun: especialistas (médicos, nutricionistas, psicólogos) e farmácias de manipulação. É o ponto de entrada e primeiro acesso desses tenants depois que o admin gera o convite.

Não confundir com `apps/admin` (painel interno da Noun) nem `apps/landing` (site público). Localhost: `http://localhost:3003` — iniciar com `cd apps/connect && pnpm dev`.

## 2. Stack técnica

- Next.js 15 App Router, TypeScript
- Tailwind CSS v4 + shadcn/Radix (`packages/ui`), tokens em oklch
- Supabase Auth via `@supabase/ssr` (client browser + server, cookies)
- Validação de formulário: `zod`
- Ícones: Tabler Icons

## 3. Estrutura de rotas

```
src/app/
  page.tsx                    redirect -> /login
  (auth)/login/page.tsx       login com email/senha
  auth/callback/route.ts      troca o code do Supabase por sessão
  auth/set-password/page.tsx  definição de senha no primeiro acesso
  (app)/layout.tsx            layout autenticado, resolve tenant_type e redireciona se !user
  (app)/dashboard/page.tsx    dashboard do parceiro (placeholder)
  theme/page.tsx              preview do design system dual-canal
```

`middleware.ts` protege todas as rotas exceto `/login`, `/auth/callback`, `/auth/set-password` (redireciona para `/login` se não autenticado; redireciona autenticado para `/dashboard` se tentar acessar `/login`).

## 4. Fluxo de convite e primeiro acesso

1. Admin (`apps/admin/src/app/(admin)/tenants/[id]/actions.ts`, `gerarAcesso`) chama `admin.auth.admin.inviteUserByEmail(email, { redirectTo: '.../auth/callback?type=invite' })` com a service-role key.
2. Supabase envia o e-mail de convite (hoje via SMTP customizado, provedor Brevo) e, ao clicar, redireciona para `auth/callback` com o parâmetro `type=invite`.
3. `auth/callback/route.ts` troca o `code` por sessão (`exchangeCodeForSession`) e, se `type=invite`, redireciona para `/auth/set-password`; senão vai direto para `/dashboard`.
4. `/auth/set-password` valida a senha com zod (mínimo 8 caracteres, confirmação) e chama `supabase.auth.updateUser({ password })`, depois `router.push('/dashboard')`.
5. `(app)/layout.tsx` resolve `profiles.tenant_id -> tenants.type` para decidir o canal (`specialist` ou `pharmacy`) e aplica `data-tenant-type` no wrapper raiz, que dirige o tema (ver seção 6).

### Decisão: `type=invite` em vez de heurística de timestamp

Versão anterior detectava primeiro acesso comparando `last_sign_in_at === created_at`, o que é não confiável (sempre há um delta entre a criação do convite e o clique real). Corrigido para usar o parâmetro explícito `?type=invite` no `redirectTo`, checado em `auth/callback/route.ts`. Aplicado tanto em `gerarAcesso` quanto em `reenviarConvite` (ambos em `apps/admin`).

## 5. Bugs conhecidos (não resolvidos)

- **`reenviarConvite` falha para tenants já confirmados**: `inviteUserByEmail` só funciona para usuários que nunca confirmaram o e-mail. Para um tenant que já ativou o acesso, a chamada retorna 422 `"A user with this email address has already been registered"`. Precisa trocar para outro fluxo (ex.: `admin.auth.admin.generateLink` com tipo `recovery`, ou reset de senha) quando o usuário já existe.
- **Página em branco ao clicar no link de convite (migração para Resend em andamento, 16/07/2026)**: hipótese líder era que o provedor de e-mail transacional anterior (Brevo, domínio de tracking `sendibt3.com`) reescrevia o link para métricas de clique, e o bot/scanner de pré-visualização do provedor consumia o código de uso único do Supabase antes do clique real do usuário, gerando "link already used"/"token not found". Evidência: logs do Auth (`get_logs`, service `auth`) mostraram um `/verify` falho ("One-time token not found" / "403: Email link is invalid or has expired") poucos minutos antes do `/verify` bem-sucedido do mesmo convite. **Decisão:** trocar o SMTP customizado do Supabase Auth de Brevo para Resend (sem click-tracking por padrão), o que deve eliminar essa causa raiz. A troca é feita só pelo Supabase Dashboard (Authentication → Emails → SMTP Settings) — nenhuma ferramenta de automação disponível configura isso, é passo manual. Valores a usar: host `smtp.resend.com`, porta `465` (SSL) ou `587` (TLS), usuário `resend`, senha = `RESEND_API_KEY` (mesma key salva em `RESEND_API_KEY`, `.env.local`/Vercel), campo "From" com um domínio verificado na Resend (Resend → Domains). Confirmar após a troca se o bug de link em branco realmente some antes de marcar como resolvido. SMTP nativo do Supabase não é opção viável mesmo para baixo volume (rate limit muito agressivo).
- **Uso de Resend no código (além do SMTP do Supabase Auth)**: `@noun/config/email/resend` (`packages/config/src/email/resend.ts`) expõe `createResendClient()`, que lê `RESEND_API_KEY` e lança erro claro se a variável não estiver setada. Ainda sem nenhum envio real conectado a esse client — criado como base pronta para quando surgir a necessidade (ex.: possível fix do bug `reenviarConvite` abaixo, usando `admin.auth.admin.generateLink` + envio custom via Resend em vez do `inviteUserByEmail`).
  - Segunda hipótese, ainda não confirmada, a checar: os logs de login mostraram `login_method: "implicit"`. Se o projeto Supabase estiver configurado para fluxo **implicit** (tokens no fragmento da URL, depois do `#`) em vez de **PKCE** (`?code=`), o `auth/callback/route.ts` atual nunca funcionaria, porque fragmento de URL não chega ao servidor. Precisa confirmar em Authentication → URL Configuration no painel do Supabase, ou inspecionando a URL real recebida no clique (`#access_token=...` vs `?code=...`).

## 6. Tema dual-canal (`data-tenant-type`)

Cada tipo de tenant tem sua própria paleta `--primary` (e chart/sidebar derivados), via CSS vars em `globals.css`, seguindo a mesma regra do resto do monorepo (nunca hardcode de cor em componente):

- Sem atributo / `specialist`: tema padrão (tons de azul).
- `[data-tenant-type="pharmacy"]`: tema lilás/violeta (tons da marca Noun, mesma paleta violet da landing), com variante dark equivalente. Era teal até 17/07/2026.
- **Paridade visual com o admin (refinamento de 17/07/2026):** neutros (background, card, muted, border, secondary, accent, destructive, sidebar), `--radius: 0.5rem`, seletor do dark variant, tokens de border-width e base styles do `globals.css` são idênticos aos do `apps/admin` (fonte de verdade do design system). A única divergência sancionada é a primária fixa por canal em vez do `ColorThemeProvider` dinâmico. **O connect NÃO monta o `ColorThemeProvider`** (removido de `providers.tsx` em 17/07/2026): o provider injeta triplets HSL (`"H S% L%"`) inline no `<html>` no mount (formato do pipeline do admin, `hsl(var(--x))`), e como o connect guarda cores completas (`--x: hsl(...)`), a injeção tornava `--border`/`--muted`/`--input`/`--sidebar-border` inválidos e o CSS caía em `currentColor` (bordas pretas) logo após a hidratação: era a causa raiz do "flash of incorrect theme" e do visual pesado/boxy reportado. Sem o provider, servidor e client renderizam idênticos por construção. Os pickers de cor foram removidos de `/theme` (viravam no-ops); o `ThemeSwitcher` claro/escuro permanece (next-themes). Se algum dia o connect quiser cor customizável pelo usuário, o pré-requisito é migrar os tokens do `globals.css` para o formato triplet do admin antes de montar o provider. O layout autenticado também segue o padrão do admin: header com `SidebarTrigger` + `Separator` + `NavBreadcrumb` (labels do connect em `src/components/nav-breadcrumb.tsx`), conteúdo centralizado em `mx-auto w-full max-w-6xl px-6`, páginas com container `p-6 space-y-4` (sem max-width próprio) e subtítulos `text-sm text-muted-foreground mt-1`. Atenção: os tokens do connect guardam **cores completas** (`hsl(...)`/`oklch(...)`), não triplets HSL como no admin — qualquer override inline de `--primary` (ex. login) precisa passar a cor completa.
- **Paridade de primitivos `ui/` completa (auditoria de 17/07/2026, ver `DESIGN_SYSTEM.md`):** os 29 arquivos de `apps/admin/src/components/ui/` existem em `apps/connect/src/components/ui/`, byte-idênticos (deps novas adicionadas: `cmdk`, `recharts`, para `command.tsx`/`chart.tsx`). Nenhuma tela do connect usa `alert`, `alert-dialog`, `chart`, `checkbox`, `command`, `dialog`, `empty`, `input-group`, `popover`, `radio-group` ou `table` ainda — foram trazidos por paridade preventiva, não por necessidade imediata de uma página.
- **Correção pontual do Achado 3 do `DESIGN_SYSTEM.md`:** `DropdownMenuItem` `variant="warning"` usa `amber-*` no connect (era `yellow-*` na cópia original do admin, inconsistente com `Badge`/`Alert`). Divergência intencional de uma linha em relação ao arquivo do admin — se o admin for corrigido no mesmo sentido depois, esse arquivo passa a ser byte-idêntico de novo.

O atributo é aplicado uma vez no wrapper raiz de `(app)/layout.tsx`, resolvido a partir de `tenants.type` (`pharmacy` -> canal farmácia, qualquer outro valor -> canal especialista). `theme/page.tsx` é a página de preview lado a lado dos dois canais, claro/escuro, botões, inputs e cards.

## 7. Pendências

- Corrigir `reenviarConvite` para tenants já confirmados (seção 5).
- Confirmar e, se necessário, corrigir causa raiz da página em branco no clique do convite (click-tracking e/ou flow type implicit vs PKCE).
- Dashboard do parceiro (`(app)/dashboard/page.tsx`) ainda é placeholder, sem métricas reais.
- Nenhuma mudança desta investigação foi commitada ainda: aguardando validação end-to-end do fluxo de convite antes do commit único (regra do CLAUDE.md raiz).

---

## 8. Módulo Specialist (médico) — decisões e plano

> Seção acrescentada em 16/07/2026 a partir de `D:\trabalho\noun-modulo-medico-levantamento.md` e `D:\trabalho\noun-modulo-medico-plano.md`. Complementa (não substitui) as seções 1-7 acima, que documentam o que já está implementado no connect hoje (auth, convite, tema dual).

Decisões tomadas pela Fran para o módulo de médico (canal `specialist`):

- **Local:** o módulo mora 100% aqui em `apps/connect`, dentro do canal `specialist` já existente. Sem app novo.
- **Modelo de dados:** `profiles` (role `doctor`, com `tenant_id`) + `tenants`. **Não usar** `packages/types/src/doctor.ts` nem a tabela `doctors` legada (`supabase/migrations/20260603000000_initial_schema.sql`) — ambos descartados como referência de schema.
- **Sem split de pagamento no MVP.** Cobrança ao paciente via Pix direto; repasse ao médico não é automatizado no primeiro momento.
- **Agenda/teleconsulta:** Google Calendar API (evento) + Google Meet (link via `conferenceData` do evento), acionado na confirmação de um `appointment`.
- **Receita digital:** exige assinatura ICP-Brasil por lei para receita de controle especial/antimicrobiano (Portaria MS 467/2020, Resolução CFM 2.299/2021, e futuramente integração ao SNCR da RDC 1.000/2025 da Anvisa, prazo até 30/09/2026). Caminho recomendado no MVP: integrar plataforma de prescrição pronta (ex. Memed) em vez de implementar certificado/assinatura própria — detalhamento completo de opções e prós/contras em `noun-modulo-medico-plano.md`, seção 3.
- **Ordem de construção sugerida** dos 6 sub-módulos do PRD: Onboarding & Perfil → Agenda → Atendimento & Prontuário → Receitas → Gestão de Pacientes → Financeiro (cada etapa depende de dados criados pela anterior; detalhe completo no plano).
- **App mobile do paciente é o último produto do roadmap** — não existe hoje nenhuma tela do lado paciente para agendar com médico; isso é esperado, não é bloqueio para este módulo.

### Prompt 0 executado em 16/07/2026 — schema real confirmado

> O levantamento e o plano em `D:\trabalho\` partiam da premissa de que nada disso existia no banco. **Não é verdade**: o schema real (confirmado via Supabase MCP, projeto `vpcjzkygiwtodokcentu`) já está bem mais avançado. Qualquer prompt seguinte (1-6) deve reler esta seção antes de criar tabela nova, para não duplicar o que já existe.

**Achado crítico de segurança (corrigido nesta sessão):** as 5 tabelas do schema `medical` (`records`, `record_evolutions`, `prescriptions`, `reports`, `exam_requests`) estavam com RLS **desabilitada** desde a criação — prontuário e receitas totalmente expostos a `anon`/`authenticated`. Corrigido via migration `20260716115000_enable_rls_medical_schema.sql`, políticas no mesmo padrão de `public.appointments`/`public.availability_slots` (`is_noun_admin()`, `auth.uid()`, `is_professional()`; médico gerencia os próprios registros, paciente só lê os seus, sem policy de `DELETE` em nenhuma tabela).

**`tenants.type` (resolvido):** os valores reais são `pharmacy`, `platform`, `specialist` (enum `tenant_type`). Nem o CLAUDE.md raiz (`clinic/pharmacy`) nem o form do admin (`specialist/pharmacy`) estavam certos — falta `platform` em ambos, `clinic` não existe. CLAUDE.md raiz deveria ser corrigido numa próxima sessão de manutenção (fora do escopo deste módulo).

**O que já existe e NÃO precisa de migration nova:**
- `public.profiles`: `council_id`, `council_state`, `medical_specialty` já existem (CRM/UF/especialidade). RQE e conselho vivem em `public.tenants` (`rqe`, `conselho_numero`, `conselho_uf`), junto com `tenants.subtype` (enum `tenant_subtype`: `clinico_geral`, `endocrinologista`, `urologista`, `ginecologista`, `psiquiatra`, `psicologo`, `nutricionista`, mais `rede`/`manipulacao` do canal farmácia).
- **Agenda já existe**: `public.availability_slots` (`doctor_id`, `tenant_id`, `starts_at`, `ends_at`, `is_booked`, `price`), RLS habilitada, com policies de `SELECT`/gestão própria já no padrão atual (`current_user_id()`, `current_tenant_id()`).
- **Prontuário já existe**: `medical.records` (queixa, história, exame físico, diagnóstico, CID-10, plano terapêutico, `signature_hash`/`cfm_certificate` para assinatura ICP-Brasil, `is_finalized`/`finalized_at` para o "sem hard delete") + `medical.record_evolutions`.
- **Receitas já existem**: `medical.prescriptions`, já modelada para a regulação (`type` enum `prescription_type`: `common/special_a/special_b1/special_b2/controlled_c1/controlled_c2/antimicrobial`, `medications` jsonb, `digital_signature`, `qr_code_url`).
- **Laudos/atestados/exames**: `medical.reports`, `medical.exam_requests` (esta última documentada como "fluxo pós-MVP").
- **Financeiro já existe**: `public.professional_compensation` (modelo de remuneração por profissional), `public.professional_earnings`, `public.professional_payouts` — mais completo do que só `professional_earnings.noun_fee` citado no CLAUDE.md raiz.
- **Storage buckets já existem**, com nomes diferentes do diagrama original do PRD: `avatares` (público), `documentos` (privado), `receitas` (privado) — não `medical-docs`/`partner-docs`.
- `public.appointments` já tem `telemedicine_url` — campo pronto para o link do Meet gerado na integração com Google Calendar (Prompt 3).

**O que genuinamente faltava e foi criado nesta sessão** (`20260716120000_add_doctor_profile_fields.sql`, em `public.profiles`): `bio`, `default_consultation_price` (valor padrão; `availability_slots.price` pode sobrescrever por horário), `accepts_insurance`, `accepted_insurance_plans`. Sem RLS nova: as policies `profiles: update own`/`profiles_update_own` já existentes cobrem o próprio profissional editar essas colunas.

**Gap conhecido em `database.types.ts`:** a geração via `generate_typescript_types` (MCP) cobre apenas o schema `public`. O schema `medical` (prontuário/receitas/laudos/exames) não está incluído — qualquer query direta a `medical.*` no código não tem checagem de tipo contra o schema real ainda. Os tipos de domínio para `medical.*` foram escritos à mão em `packages/types/src/specialist.ts` como paliativo; resolver a geração multi-schema (ou empacotar acesso via RPC `SECURITY DEFINER` com retorno tipado) é uma pendência técnica antes de codar o Prompt 3/4 a sério.

**`packages/types/src/doctor.ts` removido** (era legado, descartado como referência desde a decisão de 16/07/2026, e não tinha nenhum import fora deste próprio pacote). `ConsultationType` foi movido para `packages/types/src/specialist.ts`; `appointment.ts` foi atualizado para importar de lá.

Plano de implementação completo, com o passo a passo por sub-módulo e a pesquisa de assinatura digital: `D:\trabalho\noun-modulo-medico-plano.md` (mantém o valor como plano de sub-módulos 1-6, mas a premissa de "nada existe no banco" na seção 0 desse documento está desatualizada — usar esta seção do CLAUDE.md como fonte de verdade sobre o schema real).

### Prompt 1 executado em 17/07/2026 — Onboarding & Perfil

- **Página `/perfil` implementada** (`(app)/perfil/`): `page.tsx` Server Component lê `profiles` + `tenants`; interatividade em client components separados (`form.tsx`, `avatar-upload.tsx`, `documentos.tsx`); gravação via server action (`actions.ts`, `atualizarPerfil`, RLS `profiles_update_own`).
- **Decisão: CRM/UF/RQE/especialidade são somente leitura no connect.** São dados validados no credenciamento; correção passa pelo time Noun via admin. Exibidos no card "Registro profissional" com formatter por role (CRM médico, CRP psicólogo, CRN nutricionista).
- **Campos editáveis pelo profissional:** foto (bucket `avatares`), bio, valor de consulta (`default_consultation_price`, máscara BRL), aceita convênio + convênios aceitos (chips).
- **Documentos:** upload para o bucket privado `documentos` (path `<user_id>/<tipo>-<timestamp>-<nome>`, tipos diploma/registro/certificação, PDF/PNG/JPG até 10MB, download via signed URL). O bucket existia **sem nenhuma policy** (inacessível até para o dono) — corrigido em `20260717100000_storage_documentos_rls_policies.sql` (dono gerencia os próprios arquivos, admin Noun lê tudo). Os buckets `medical-docs`/`partner-docs` do diagrama original não existem; os reais são `avatares`/`documentos`/`receitas`.
- **Formatters compartilhados:** `formatCRM`/`formatRQE`/`formatCRP`/`formatCRN`/`formatCRF` movidos para `@noun/ui` (`packages/ui/src/lib/formatters.ts`); `apps/admin/src/lib/formatters.ts` virou re-export.
- **Deps novas no connect:** `react-hook-form` + `@hookform/resolvers` (zod v4 já existia). Componentes copiados do admin: `textarea`, `switch`, `badge`, `select`.
- **Override workspace:** `@types/react`/`@types/react-dom` fixados em `^19.2.0` via `pnpm.overrides` no root (duas cópias de `@types/react` passaram a coexistir após o install e quebravam o type-check do admin com TS2742).
- Validação manual pendente da Úrsula/Fran no localhost:3003 (editar bio/valor, recarregar e confirmar persistência) — conta de teste: Dra. Renata (NT-0005), login `franxxby@gmail.com`.

### Prompt 2 executado em 17/07/2026 — Gestão de Agenda

- **Correção de premissa:** o plano dizia que não existia tabela de agenda, mas `public.availability_slots` (slots concretos, `appointments.slot_id` aponta para ela) já existia desde o schema inicial. O que faltava era o modelo **recorrente** e os **bloqueios**. Criados em `20260717110000_create_availability_rules_and_blocks.sql`:
  - `availability_rules`: dia da semana (0 = domingo) + `start_time`/`end_time` + `slot_duration_minutes` (10 a 240) + `consultation_type` (enum novo `consultation_modality`: `in_person`/`telemedicine`/`both`) + `is_active`. RLS: profissional gerencia as próprias, admin tudo.
  - `availability_blocks`: `starts_at`/`ends_at` timestamptz (dia inteiro ou faixa) + `reason` opcional. Mesma RLS.
  - No Prompt 3, o agendamento consulta as regras menos bloqueios para calcular slots livres (e materializa em `availability_slots` se necessário).
- **Decisão de lib de calendário: componente customizado com shadcn/Tailwind, sem lib externa.** Motivo: react-big-calendar e similares trazem CSS próprio que conflita com a regra "shadcn sem sobrescrever visual" e dependências de data desnecessárias; a visualização precisa só de grid semanal/mensal derivado das regras. Cálculo de slots em `(app)/agenda/lib.ts` (Date nativo, sem dependência). Semana começa na segunda.
- **UI em `(app)/agenda/`**: card Visualização (tabs Semana/Mês, navegação anterior/hoje/próximo, slots bloqueados riscados), card Disponibilidade recorrente (adicionar/pausar/remover faixas), card Bloqueios (dia inteiro ou faixa de horário, motivo opcional). Server actions em `actions.ts`; toasts via sonner.
- **Realtime:** a publication `supabase_realtime` estava **vazia** (nenhuma tabela emitia `postgres_changes`); `public.appointments` foi adicionada na migration. `AppointmentsRealtime` (client, montado em `(app)/layout.tsx` junto com o `Toaster`) assina INSERT/UPDATE filtrado por `doctor_id` e mostra toast de nova marcação/cancelamento — gatilho real chega no Prompt 3.
- **RLS testada via SQL** (role `authenticated` + `request.jwt.claims`): Renata vê a própria regra (1), outro usuário vê 0 e um UPDATE na regra alheia afeta 0 linhas.
- Componentes copiados do admin: `tabs`, `sonner`. Seed de exemplo criado para a Dra. Renata (segunda 08:00 as 12:00, 30 min, telemedicina).
- **Pendência técnica:** `database.types.ts` foi gerado antes de `availability_rules`/`availability_blocks` — regenerar antes do Prompt 3 (que vai querer `appointments` tipado).

### Prompt 3 executado em 23/07/2026 — Atendimento & Prontuário (Google Calendar/Meet)

- **OAuth por médico (confirmado com a Fran), não conta de serviço da Noun.** Motivo: o evento criado precisa aparecer na agenda pessoal de quem atende, não numa conta corporativa. Cada médico conecta a própria conta Google a partir do card "Agenda Google" em `(app)/perfil/`.
- **`packages/types/src/appointment.ts` foi reescrito** para bater com o `public.appointments` real (`slotId`, `telemedicineUrl`, `priceReais`, `type` enum `appointment_type`, `status` sem `rescheduled`). A versão anterior modelava o schema legado descartado (`scheduledAt`/`durationMinutes`/`meetingUrl`/`paymentAmountReais`) e nunca tinha sido importada em nenhum app, então a reescrita não quebrou nada.
- **Acesso ao schema `medical` é via RPC `SECURITY DEFINER` em `public`, nunca client direto.** Achado: `supabase/config.toml` tem `[api] schemas = ["public", "graphql_public"]` — o schema `medical` (records/record_evolutions/prescriptions/reports/exam_requests) não é exposto ao PostgREST. `supabase.from('medical.records')` falharia contra o projeto hospedado. RPCs criadas em `supabase/migrations/20260723091000_create_specialist_prompt3_rpcs.sql`: `search_tenant_patients`, `get_medical_record`, `upsert_medical_record`, `add_record_evolution`, `finalize_medical_record`, `list_record_evolutions`, `list_patient_medical_records`. Cada uma valida `auth.uid()` internamente (contra `doctor_id` do appointment/record) antes de tocar em `medical.*`; RLS de `medical.*` continua habilitada como defesa em profundidade.
- **Busca de paciente para agendamento restrita a quem já tem histórico no mesmo tenant** (RPC `search_tenant_patients`, deriva o `tenant_id` do próprio `auth.uid()`, não aceita parâmetro de tenant). Decisão confirmada com a Fran: não é busca livre em toda a base de pacientes da Noun. Efeito colateral aceito: um médico não consegue, por esta tela, marcar consulta para um paciente genuinamente novo no tenant (esse fluxo de intake fica para outro momento/canal).
- **Sem dependência `googleapis`.** Integração via `fetch` puro contra `accounts.google.com`/`oauth2.googleapis.com`/`www.googleapis.com/calendar/v3` em `apps/connect/src/lib/google-calendar.ts`. Mesmo espírito da decisão do Prompt 2 (calendário customizado em vez de `react-big-calendar`): a superfície necessária (token exchange + criar/apagar evento com `conferenceData`) não justificava o SDK inteiro.
- **`doctor_google_credentials` (nova tabela) não tem NENHUMA policy de RLS**, de propósito — só o service role (via novo `apps/connect/src/lib/supabase-admin.ts`, espelha o do admin) lê/escreve. Nem o próprio médico dono do token acessa via client normal. `public.appointments` ganhou a coluna `google_calendar_event_id` (link com `telemedicine_url`, que já existia, guarda a URL do Meet).
- **Fluxo de confirmação nunca deixa o appointment inconsistente**: `confirmarConsulta` (`(app)/agenda/consultas-actions.ts`) só muda `status` para `confirmed` DEPOIS que o evento do Google Calendar é criado com sucesso; falha na Calendar API mantém `status='pending'` e retorna erro legível (nunca falha silenciosa). Cancelamento tenta apagar o evento do Google best-effort (loga aviso, não bloqueia o cancelamento no banco).
- **Variáveis de ambiente novas** (adicionar em `apps/connect/.env.local` local e na Vercel, nunca commitar valor real): `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI` (`http://localhost:3003/auth/google-calendar/callback` em dev), `SUPABASE_SERVICE_ROLE_KEY` (conectar precisava pela primeira vez no connect, já existia no admin). **Pré-requisito externo que não foi feito nesta sessão**: criar o projeto no Google Cloud Console, habilitar a Calendar API, configurar a tela de consentimento OAuth e gerar `client_id`/`client_secret` — isso é passo manual de quem tem acesso ao Google Cloud, não algo que o Claude Code executa.
- **Migrations criadas, ainda NÃO aplicadas no banco**: `20260723090000_create_doctor_google_credentials.sql` e `20260723091000_create_specialist_prompt3_rpcs.sql`. Este ambiente não tinha o Supabase CLI logado (`supabase login` pendente) nem MCP do Supabase disponível na sessão, então não foi possível aplicar via `supabase db push` nem confirmar contra o schema real. Aplicar manualmente (SQL Editor do Supabase Dashboard, projeto `vpcjzkygiwtodokcentu`, ou `supabase db push` após `supabase login`) antes de testar o fluxo ponta a ponta.
- **`database.types.ts` continua sem regenerar** (mesma pendência do Prompt 2, sem CLI logado). Comando para rodar depois: `supabase login` seguido de `supabase gen types typescript --project-id vpcjzkygiwtodokcentu > packages/config/src/supabase/database.types.ts`.
- **Prontuário**: reaproveita `medical.records`/`medical.record_evolutions` que já existiam (não foi criada tabela nova, ao contrário do que o prompt original sugeria antes de confirmar que o schema já tinha isso). UI em `(app)/prontuario/` (lista) e `(app)/prontuario/[appointmentId]/` (detalhe: formulário + evoluções + histórico do paciente). Sem hard delete: `finalize_medical_record` só marca `is_finalized`/`finalized_at`; depois de finalizado, só entra evolução nova (`add_record_evolution`), nunca edição dos campos originais.
- **Achado à parte, fora do escopo deste módulo**: não existe `eslint.config.js`/`.eslintrc.*` em NENHUM app do monorepo hoje (`pnpm lint` falha com "ESLint couldn't find an eslint.config file" em qualquer filtro). O `ci.yml` também está desatualizado: type-check/build só rodam para `apps/web` (removido do monorepo, commit `d9dc658`) e `apps/admin`, sem lint, sem `apps/connect`/`apps/landing`. Não corrigido aqui por estar fora do escopo do módulo Specialist; sinalizado à parte.
