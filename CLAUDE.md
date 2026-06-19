# Noun — Convenções, Decisões e Estado do Projeto

## Fluxo de trabalho com Claude

- Sempre ler este arquivo no início de cada sessão.
- Atualizar ao final quando houver novas decisões ou convenções.
- Nunca usar em dashes (`—`) em textos de UI ou páginas do Notion: usar dois pontos, vírgula ou reformular.

---

## Deploy e CI/CD

- Iterar localmente até aprovar visualmente, depois **um único commit** com tudo consolidado.
- Push direto em `main`. A Vercel deploya automaticamente via integração nativa com o GitHub.
- **Nunca** commitar ajustes pequenos separados: cada commit extra dobra a fila de build no Vercel.
- O ruleset `protect-main` foi removido. Push direto sem PR obrigatório.
- Os arquivos `deploy-admin.yml` e `deploy-web.yml` foram deletados. Apenas `ci.yml` permanece (typecheck, lint).

## Localhost

- Admin: `http://localhost:3002` — iniciar com `cd apps/admin && pnpm dev`
- Web: `http://localhost:3000` — iniciar com `cd apps/web && pnpm dev`

## Preview MCP

- **Não usar** o Claude Preview MCP (`preview_screenshot`, `preview_start`, `preview_click`).
- A Úrsula revisa diretamente no `localhost:3002`.

---

## Stack

- **Framework:** Next.js 15 App Router
- **Banco:** Supabase (Postgres 17) — project `noun-app` (`vpcjzkygiwtodokcentu`), região `us-east-2`
- **Estilo:** Tailwind CSS v4 (admin, web, landing) / v3.4 (mobile, `packages/config` preset), CVA, shadcn/Radix UI. Migração oklch ainda pendente.
- **Monorepo:** pnpm workspaces + Turborepo
- **Deploy:** Vercel (integração nativa com GitHub, branch `main`)
- **Mobile:** Expo SDK 54, expo-router v6, NativeWind

## Estrutura do Monorepo

```
apps/
  admin/    Next.js 15 — painel administrativo (porta 3002)
  web/      Next.js 15 — app público (porta 3000)
  mobile/   Expo — app mobile (iOS/Android)
packages/
  ui/       Componentes compartilhados (shadcn/Radix + NativeWind)
  config/   Tailwind preset, tokens de design, tipos Supabase
```

---

## Design System

- Cor primária: **amarela** (yellow). Token `--primary` injetado pelo `ColorThemeProvider` em `packages/ui/src/providers/color-theme-provider.tsx`.
- Todas as cores usam paletas Tailwind 50-950 via CSS vars (`hsl(var(--primary))`, etc.). **Nunca** usar cores hardcoded nos componentes ou charts.
- `--radius: 0.45rem` (preset Small do shadcn v4). Escala multiplicativa: `sm=*0.6`, `md=*0.8`, `lg=1x`, `xl=*1.4`, `2xl=*1.8`, `3xl=*2.2`, `4xl=*2.6`. Definida em `globals.css` (@theme inline) e `packages/config/tailwind/preset.ts`.
- Fontes: `Reddit Sans` (sans) e `Reddit Mono` (mono).
- Modo claro/escuro/system via `ColorThemeProvider`. Neutros usam Zinc.
- Tonalidades disponíveis no picker: 300, 400, 500, 600, 700, 800 (removidas 100, 200, 900, 950).
- Títulos de página: `text-xl font-semibold`.
- Tamanho padrão de componentes shadcn: `sm`.

## Variáveis de Ambiente

| Variável | Uso | Onde configurar |
|---|---|---|
| `SUPABASE_URL` | Servidor (SSR) | `.env.local` e Vercel |
| `SUPABASE_ANON_KEY` | Servidor (SSR) | `.env.local` e Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser (client) | `.env.local` e Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser (client) | `.env.local` e Vercel |

---

## MCPs Ativos

- **Shadcn MCP:** usar `mcp__shadcn__*` para buscar e instalar componentes antes de qualquer instalação manual.
- **Supabase MCP:** usar para queries, migrations e RPC. Project ID: `vpcjzkygiwtodokcentu`.
- **Vercel MCP:** disponível para consultar deploys e logs.
- **Notion MCP:** disponível para atualizar o log de implementação após cada tarefa.

---

## Banco de Dados (Supabase)

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `tenants` | Clínicas e farmácias. Campos: `id`, `code` (legível, `NT-0001`, default via `tenant_code_seq`, migration `add_tenant_code`), `name`, `legal_name`, `cnpj`, `type` (clinic/pharmacy), `status` (active/pending_approval/suspended), `plan`, `settings` (jsonb com `commission_rate`), `contract_signed_at` |
| `profiles` | Usuários. Campos: `id`, `full_name`, `email`, `role` (patient/doctor/nutritionist/psychologist/pharmacist/attendant/noun_admin), `is_active`, `tenant_id` |
| `addresses` | Endereços dos usuários. Campos: `user_id` (FK manual para profiles.id), `city`, `state`, `latitude`, `longitude`, `is_active` |
| `appointments` | Consultas. Campos: `patient_id`, `doctor_id`, `tenant_id`, `price`, `status` (completed/cancelled/scheduled), `type` |
| `professional_earnings` | Repasses. Campo `noun_fee` (receita da Noun por consulta) |
| `patient_profiles` | Perfil de saúde do paciente |
| `user_consents` | Consentimentos LGPD |

### Observações importantes

- **Não há FK formal** entre `addresses.user_id` e `profiles.id`. Usar JOIN explícito em RPCs em vez de nested selects do Supabase JS.
- Para agregações com join entre tabelas sem FK formal, criar RPC com `SECURITY DEFINER` e `LANGUAGE sql`.

### RPCs criadas

- `get_patient_city_distribution()` — retorna `(city, state, latitude, longitude, user_count)` de pacientes ativos com endereço geolocalizado. Fonte real para o mapa do Dashboard.

---

## Módulos Implementados (admin)

### Dashboard (`/dashboard`)
- KPIs financeiros: GMV, receita Noun, consultas concluídas, ticket médio.
- Gráfico de receita mensal (bar chart).
- Card "Últimas Transações" (tabela paginada de appointments).
- Card "Usuários por região": mapa SVG do Brasil com pan/zoom livre e drill-down hierárquico.

#### Mapa de Usuários por Região
- **Escopo Brasil apenas** (decisão de 16/06/2026). Código mundial/internacional foi removido.
- SVG puro (sem libs externas, sem tiles, sem API): apenas dados próprios e geometria pública pré-projetada.
- **Espaço de coordenadas:** viewBox nativo `0 0 500 420`. Paths dos estados em `apps/admin/src/data/brazil-states-paths.json` (Natural Earth, projeção equiretangular, curvas Catmull-Rom via comando `C`, `fillRule="evenodd"` para ilhas costeiras). Bounds: `WEST=-73.96, EAST=-24.65, NORTH=5.31, SOUTH=-33.70`. Projeção: `brProject(lng, lat)`.
- **Estilo CartoDB claro:** fundo branco e terra cinza. Cores via CSS vars `--map-bg`, `--map-land`, `--map-land-hover`, `--map-land-active`, `--map-border`, `--map-label` (claras/escuras no `globals.css`). **Sem `--primary` nas terras.** Os dots permanecem em `--primary`.
- **Dots uniformes e sutis:** todos com o mesmo raio (`DOT_R = 0.0062 * viewBox.w`), tamanho visual constante em qualquer zoom; não escala por contagem. Halo discreto (1.5x, opacidade baixa), pulso `animate-ping` so no hover/seleção, sombra `drop-shadow` em `--primary-foreground`.
- **Pan/zoom livre:** arrastar move o mapa (pointer events + threshold de 4px, `draggedRef` impede seleção acidental), scroll do mouse da zoom no ponteiro, botões `+`/`-` dão zoom no centro e botão de foco (`IconCurrentLocation`) volta para o Brasil. O `viewBox` mantém o aspect do container (medido por `ResizeObserver` em `dims`). `clampVB` limita o zoom (`MIN_W=4`, max = Brasil inteiro) e o centro dentro do Brasil.
- **Filtro de escopo (button group):** Todas (Brasil inteiro); 5 regiões (Norte, Nordeste, Centro Oeste, Sudeste, Sul) animam para a bbox da região via `boxFromBrIds`.
- **Rótulos progressivos por nível de zoom (LOD):** estados (`viewBox.w < 550`, sempre nome completo) e cidades (`viewBox.w < 250`). Centroides/larguras pré-medidos em `stateMeta` via `useLayoutEffect`.
- Dados reais via RPC `get_patient_city_distribution`. Mock exibido quando o banco está vazio.
- Drill-down pelo painel direito com breadcrumb (`BackBtn`): Brasil > Região > Estado > Cidade. Áreas de scroll usam a classe `.map-scroll` (scrollbar temático, corrige fundo branco no modo escuro).
- Tooltip estilo `ChartTooltipContent` com line indicator em `--primary`, posicionado por fração do `viewBox` (nítido em qualquer zoom).
- Fullscreen nativo do card via Fullscreen API (`.map-fullscreen-card:fullscreen` em `globals.css`).

### Tenants (`/tenants`)
- Cards de monitoramento no topo: Ativos, Pendentes, Suspensos (contagens `head: true` da base inteira).
- Tabela em card único com a anatomia: header (título + descrição), action section (filtros) e tabela full-bleed, separados por dividers `border-b`. Sem container interno com borda.
- Action section: button group de status (`status-filter.tsx`, segmentado, navegação instantânea via URL) à esquerda e input de busca com debounce 400ms (`search-input.tsx`) à direita.
- Busca server-side por ID (`code`), nome, razão social e CNPJ (via `.or` + `ilike`); data `dd/mm/aaaa` filtra o dia de `created_at`.
- Coluna ID exibe `tenants.code` (`NT-0001`) em fonte mono.
- Não há filtro/tabs por tipo: o tipo aparece apenas como badge na tabela.
- Detalhe do tenant: dados cadastrais, métricas financeiras (GMV, receita Noun, nº consultas, ticket médio), lista de profissionais.
- Ações: alterar status, editar taxa de comissão.

### Usuários (removido)
- A página `/usuarios` foi apagada por privacidade: dados precisos de usuário são sensíveis e o admin só exibe dados macro (decisão de 11/06/2026). Comportamento individual será tratado no app mobile.

### Configurações (`/configuracoes`)
- Seletor de cor primária (picker com tonalidades nomeadas).
- Slider de tonalidade com stops descritivos.
- Seletor de tema (claro/escuro/system).
- Popovers de dica para cada configuração.

### Login
- Gradiente da coluna de capa reativo à cor primária (usa paleta do `ColorThemeProvider`).
- Botão de mostrar/ocultar senha no campo Senha (`IconEye` / `IconEyeOff` do Tabler, dentro do input com `type` alternado).

### Chamados (`/chamados`, `/chamados/[id]`)
- Listagem por tab (source): usuário, farmácia, médico, psicólogo, nutricionista.
- Cards de stats: Abertos, Em andamento, Resolvidos.
- Detalhe: thread de mensagens, reply form, StatusSelect client component.

### Financeiro (`/financeiro`)
- KPIs: GMV total, receita Noun, take rate médio, nº transações.
- Gráfico de evolução por período.
- Breakdown por tenant com export CSV.
- Seletor de período: mês, 3 meses, 6 meses, ano, personalizado.

---

## Padrões e Decisões Técnicas

### Consumo de componentes Shadcn (regra permanente)

- Componentes Shadcn são consumidos exatamente como vêm da lib. **Nunca** sobrescrever propriedades visuais base (ring, border, radius, shadow, padding, height) com classes Tailwind inline ou regras globais em `globals.css`.
- A única customização permitida é via CSS vars semânticos no `globals.css` (`--primary`, `--ring`, `--border`, etc.), que o próprio Shadcn já consome internamente.
- Exceção: adaptações que a Úrsula indicar explicitamente. As exceções vigentes (sancionadas) são:
  1. **Focus ring outline sem gap** (regra global `*:focus-visible` em `globals.css`): convenção Noun deliberada, ver subseção Componentes abaixo. Substitui o ring nativo do Shadcn em todo o admin.
  2. **Bounce tátil leve em botões** (`active:scale-[0.97]` na base do `button.tsx`): efeito de clique pedido pela Úrsula, aplicado **apenas** a botões.
  3. **Variantes semânticas** adicionadas a `Badge` e `Alert` (`info`, `success`, `warning`, `destructive`): extensões intencionais do conjunto base.
- Escala de radius já migrada para padrão multiplicativo do shadcn v4 (admin, web, preset, tokens). Migração de espaço de cor para `oklch` ainda pendente: depende de migrar o mobile (Tailwind v3.4 + NativeWind) e o `ColorThemeProvider` (HSL).

### Componentes
- Usar `'use client'` apenas quando necessário (interatividade, hooks). Preferir Server Components.
- Tooltip nativo (`title`) proibido: usar componente Radix `<Tooltip>`.
- Select nativo (`<select>`) proibido: usar `<Select>` do shadcn.
- Focus ring outline sem gap: `outline: 2px solid hsl(var(--ring))` + `outline-offset: 0` (anel rente à borda, segue o `border-radius`).
- Menus Radix excluídos da regra global de focus ring via `:not([role='menu'], [role='menuitem'], ...)` em `globals.css`.
- Não usar botões de "Voltar" em páginas de detalhe: a navegação é feita pelo breadcrumb do header.

### Badge
- Tamanho padrão: `sm` (default) = `text-xs` (12px). **Nunca** passar `className="text-xs"` explicitamente.
- Sem hover em nenhuma variante.
- Variantes semânticas: `success` (verde), `warning` (âmbar), `info` (azul), `destructive` (vermelho soft), `secondary` (neutro intermediário), `outline` (categórico/encerrado), `default` (primária, uso reservado).
- Mapeamento: Ativo/Resolvido = success; Pendente/Aberto/Alta = warning; Em andamento = info; Suspenso/Inativo/Urgente = destructive; roles/Média = secondary; tipos/categorias/Fechado/Baixa = outline.

### Alert
- Componente `Alert` instalado em `apps/admin/src/components/ui/alert.tsx`.
- Mesmas 5 variantes semânticas do badge: `default`, `info`, `success`, `warning`, `destructive`.
- Uso: `<Alert variant="warning"><AlertTitle>...</AlertTitle><AlertDescription>...</AlertDescription></Alert>` com ícone Tabler opcional dentro.

### Actions dropdown em tabelas
- Padrão shadcn data-table: `Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted"` + ícone `MoreHorizontal`.
- Row com `className="[&:has([data-state=open])]:bg-muted/50"`.
- `onCloseAutoFocus={(e) => e.preventDefault()}` no `DropdownMenuContent`.
- `DropdownMenuItem` suporta `variant="warning"` (âmbar) e `variant="destructive"` (vermelho), separados por `DropdownMenuSeparator`.

### Queries Supabase
- Sempre usar `createSupabaseServer()` em Server Components.
- Para joins entre tabelas sem FK formal, criar RPC.
- RPCs usam `SECURITY DEFINER`, `LANGUAGE sql`, `SET search_path = public`.

### Notion
- Sempre atualizar o log de implementação após cada tarefa concluída.
- Nunca usar em dashes (`—`) ou arrows (`->`, `=>`) nas páginas do Notion.
