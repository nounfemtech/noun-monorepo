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
- **Estilo:** Tailwind CSS v3.4, CVA, shadcn/Radix UI
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
- `--radius: 0.6rem` como base global. A escala é gerada pelo preset do Tailwind em `packages/config/tailwind/preset.ts`.
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
| `tenants` | Clínicas e farmácias. Campos: `id`, `name`, `legal_name`, `cnpj`, `type` (clinic/pharmacy), `status`, `plan`, `settings` (jsonb com `commission_rate`), `contract_signed_at` |
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
- Card "Usuários por região": mapa SVG do Brasil com drill-down hierárquico.

#### Mapa de Usuários por Região
- SVG puro (sem `react-simple-maps`). Paths dos estados em `apps/admin/src/data/brazil-states-paths.json`.
- Projeção manual: `W=500, H=420`, limites `WEST=-73.98, EAST=-28.86, NORTH=5.27, SOUTH=-33.74`.
- Dados reais via RPC `get_patient_city_distribution` (pacientes com endereço geolocalizado).
- Drill-down: Brasil → Região → Estado → Cidade. O `viewBox` do SVG anima com tween (rAF, easing cubic) a cada nível usando `getBBox` dos estados em escopo.
- Painel direito navega por breadcrumb entre os níveis.
- Pontos/traços mantêm tamanho visual constante independente do zoom (fator `k = viewBox.w / W`).
- Dots: pulso animado (`animate-ping`) no hover e ao selecionar cidade, sombra suave (`drop-shadow`) na cor `--primary-foreground` para destacar em claro e escuro.
- Cores dos estados via `REGION_TONES` (dim/base/active por região), sem hardcode.

### Tenants (`/tenants`)
- Listagem com busca, filtro de status, tipo (clínica/farmácia).
- Detalhe do tenant: dados cadastrais, métricas financeiras (GMV, receita Noun, nº consultas, ticket médio), lista de profissionais.
- Ações: alterar status, editar taxa de comissão.

### Usuários (`/usuarios`)
- Listagem com busca e filtros.
- Detalhe do usuário: dados do perfil, tenant associado, últimas consultas (como paciente ou profissional).

### Configurações (`/configuracoes`)
- Seletor de cor primária (picker com tonalidades nomeadas).
- Slider de tonalidade com stops descritivos.
- Seletor de tema (claro/escuro/system).
- Popovers de dica para cada configuração.

### Login
- Gradiente da coluna de capa reativo à cor primária (usa paleta do `ColorThemeProvider`).

---

## Padrões e Decisões Técnicas

### Componentes
- Usar `'use client'` apenas quando necessário (interatividade, hooks). Preferir Server Components.
- Tooltip nativo (`title`) proibido: usar componente Radix `<Tooltip>`.
- Select nativo (`<select>`) proibido: usar `<Select>` do shadcn.
- Focus ring sem gap: `box-shadow: 0 0 0 2px hsl(var(--ring))` (sem `ring-offset`).

### Queries Supabase
- Sempre usar `createSupabaseServer()` em Server Components.
- Para joins entre tabelas sem FK formal, criar RPC.
- RPCs usam `SECURITY DEFINER`, `LANGUAGE sql`, `SET search_path = public`.

### Notion
- Sempre atualizar o log de implementação após cada tarefa concluída.
- Nunca usar em dashes (`—`) ou arrows (`->`, `=>`) nas páginas do Notion.
