# Noun — Plataforma HealthTech/FemTech

Monorepo com Turborepo + pnpm workspaces contendo todos os produtos da Noun.

## Estrutura

```
noun/
├── apps/
│   ├── web/        → Portal web (médicos, farmácias, admin) — Next.js 15
│   ├── mobile/     → App para pacientes — React Native + Expo
│   ├── landing/    → Landing page — Next.js 15
│   └── admin/      → Painel administrativo — Next.js 15
├── packages/
│   ├── ui/         → Componentes compartilhados (Shadcn/UI)
│   ├── config/     → Configs compartilhadas (ESLint, Prettier, TS, Supabase)
│   └── types/      → Tipos TypeScript compartilhados
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Node.js    | 20.x          |
| pnpm       | 9.x           |

### Instalar Node.js 20

```bash
# Recomendado: usar nvm (Linux/macOS) ou nvm-windows
nvm install 20
nvm use 20
```

### Instalar pnpm

```bash
npm install -g pnpm@9
```

## Setup Local (primeiros passos)

```bash
# 1. Clone o repositório
git clone https://github.com/noun-health/noun.git
cd noun

# 2. Copie e configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com os valores do Supabase (peça ao tech lead)

# 3. Instale as dependências de todos os workspaces
pnpm install

# 4. Rode todos os apps em modo dev
pnpm dev

# Ou rode apenas um app específico:
pnpm dev:web      # http://localhost:3000
pnpm dev:landing  # http://localhost:3001
pnpm dev:admin    # http://localhost:3002
pnpm dev:mobile   # abre o Expo Go
```

## Scripts disponíveis

| Comando             | Descrição                                       |
|---------------------|-------------------------------------------------|
| `pnpm dev`          | Inicia todos os apps em modo desenvolvimento    |
| `pnpm build`        | Build de produção de todos os workspaces        |
| `pnpm lint`         | Roda ESLint em todos os workspaces              |
| `pnpm lint:fix`     | Corrige problemas de lint automaticamente       |
| `pnpm format`       | Formata todos os arquivos com Prettier          |
| `pnpm format:check` | Verifica formatação sem modificar               |
| `pnpm type-check`   | Roda `tsc --noEmit` em todos os workspaces      |
| `pnpm clean`        | Remove todos os artefatos de build              |

## Variáveis de Ambiente

Veja `.env.example` para a lista completa. As variáveis Supabase são obtidas em:  
`Supabase Dashboard → Project Settings → API`

| Variável                      | Onde usar         | Descrição                       |
|-------------------------------|-------------------|---------------------------------|
| `SUPABASE_URL`                | Server-side       | URL do projeto Supabase         |
| `SUPABASE_ANON_KEY`           | Server-side       | Chave anônima (RLS aplicado)    |
| `SUPABASE_SERVICE_KEY`        | Server-side only  | Chave de serviço (bypassa RLS)  |
| `NEXT_PUBLIC_SUPABASE_URL`    | Client-side       | URL pública do Supabase         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side    | Chave anônima pública           |

> **Atenção:** `SUPABASE_SERVICE_KEY` NUNCA deve ter prefixo `NEXT_PUBLIC_`. Ela bypassa Row Level Security.

## Adicionando um novo pacote compartilhado

```bash
# Criar o pacote
mkdir packages/meu-pacote && cd packages/meu-pacote
pnpm init

# Instalar em um app específico
pnpm --filter web add @noun/meu-pacote
```

## Adicionando uma dependência

```bash
# Em um app específico
pnpm --filter web add react-query

# Em um pacote compartilhado
pnpm --filter @noun/ui add clsx

# Como devDependency na raiz
pnpm add -Dw eslint
```

## CI/CD

GitHub Actions roda em cada PR:
- Lint
- Type-check
- Build

Ver `.github/workflows/ci.yml`.

## Supabase

O cliente Supabase está em `packages/config/src/supabase/`. Use os helpers:

```ts
import { createBrowserClient, createServerClient } from '@noun/config/supabase'
```

## Contribuindo

1. Crie uma branch a partir de `main`: `git checkout -b feat/NOUN-XXX-descricao`
2. Faça suas alterações
3. Rode `pnpm lint && pnpm type-check` antes de commitar
4. Abra um PR para `main`
