# Noun Design System — Especificação Técnica

> **Fonte da verdade:** `apps/admin`. Este documento foi extraído por leitura direta do código-fonte em 17/07/2026 (globals.css, components.json, `src/components/ui/*`, `src/lib/utils.ts`, `src/hooks/use-mobile.tsx`, `src/app/providers.tsx`, e os providers/tokens compartilhados em `packages/ui`). Nenhum arquivo de aplicação foi alterado para produzir este documento — é um mapeamento read-only do estado real do código, não do que a documentação anterior descrevia.
>
> Este arquivo é o padrão **imutável** para qualquer produto novo do monorepo (`apps/connect`, `apps/landing`, futuros apps web). Alterações aqui só devem acontecer quando o próprio `apps/admin` mudar — nunca o contrário.

---

## 0. Onde cada coisa vive

| Peça | Caminho |
|---|---|
| Tokens CSS + dark mode | `apps/admin/src/app/globals.css` |
| Config shadcn/ui | `apps/admin/components.json` |
| Primitivos shadcn | `apps/admin/src/components/ui/*.tsx` (29 arquivos) |
| Utilitário `cn()` | `apps/admin/src/lib/utils.ts` |
| Hook de breakpoint | `apps/admin/src/hooks/use-mobile.tsx` |
| Providers de tema (raiz do app) | `apps/admin/src/app/providers.tsx` |
| Provider de tema claro/escuro (compartilhado) | `packages/ui/src/providers/theme-provider.tsx` |
| Provider de cor dinâmica (compartilhado) | `packages/ui/src/providers/color-theme-provider.tsx` |
| Tokens compartilhados (cores, radius, border, tipografia) | `packages/ui/src/tokens/*.ts` |
| Preset Tailwind compartilhado | `packages/config/tailwind/preset.ts` — **ver Achado 1, não está em uso** |

---

## 1. Stack e Setup

- **Tailwind CSS v4**, config 100% CSS-first (`@theme inline` em `globals.css`). Não existe `tailwind.config.ts` no admin — apesar de `components.json` referenciar um (`"config": "tailwind.config.ts"`), esse arquivo **não existe** e não é necessário no v4 (ver Achado 1).
- `postcss.config.js`: só o plugin `@tailwindcss/postcss`.
- **shadcn/ui**: `components.json` declara `style: "new-york"`, `baseColor: "slate"`, `cssVariables: true`, `prefix: ""`, `iconLibrary: "lucide"`, RSC habilitado. Aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`.
- Ícones: **dois** sistemas coexistem — `lucide-react` (usado dentro dos primitivos `ui/*.tsx`, ex. `Check`, `ChevronRight`, `X`) e `@tabler/icons-react` (usado no código de aplicação/páginas, ex. `IconEye`, `IconX` em `alert.tsx`). Não é uma inconsistência a corrigir — é a convenção deliberada: primitivos shadcn mantêm o ícone que vêm de fábrica (lucide), páginas usam Tabler.
- Fontes: `Reddit Sans` (`--font-sans`) e `Reddit Mono` (`--font-mono`), carregadas via `next/font/google` em `app/layout.tsx`, pesos 300-900 (sans) e 300-700 (mono).
- Dependências centrais de estilo: `class-variance-authority` (cva), `clsx`, `tailwind-merge`, `tw-animate-css`, `radix-ui` (pacote unificado, não os pacotes `@radix-ui/react-*` individuais).

---

## 2. Tokens de tema

### 2.1 Sistema de cor em duas camadas

Existem **duas fontes de verdade sobrepostas** para as CSS custom properties, e entender a ordem é essencial para qualquer produto novo:

1. **`globals.css` (`:root` / `.dark`)** — valores de fallback usados na primeira renderização SSR, antes da hidratação do React.
2. **`ColorThemeProvider` (client, `packages/ui`)** — no mount, lê `localStorage` (chaves `vaughan-primary` e `vaughan-neutral`) e aplica os valores reais via `document.documentElement.style.setProperty(...)` (inline style no `<html>`), **sobrescrevendo** os fallbacks do passo 1. É o mecanismo por trás do seletor de cor em `/configuracoes`.

Ou seja: o admin **não tem uma cor primária fixa no CSS** — o azul do preset antigo, o teal, etc., não existem mais como conceito. A cor primária real é sempre computada em runtime a partir de uma paleta Tailwind (`ColorName`) + um shade (`ColorShadeValue`), com default `{ palette: 'yellow', shade: 400 }` (`DEFAULT_PRIMARY`) e neutro default `{ palette: 'zinc', shade: 950 }` (`DEFAULT_NEUTRAL`).

**Vars setadas por `applyPrimary(selection)`:**

| CSS var | Valor |
|---|---|
| `--primary` | HSL do shade escolhido |
| `--primary-foreground` | HSL do shade 50 ou 950 da mesma paleta (o que der mais contraste WCAG contra o `--primary`, calculado via luminância relativa) |
| `--ring` | = `--primary` |
| `--sidebar-primary` | = `--primary` |
| `--sidebar-primary-foreground` | = `--primary-foreground` |
| `--sidebar-ring` | = `--primary` |
| `--sidebar-accent` | = `--primary` |
| `--sidebar-accent-foreground` | = `--primary-foreground` |
| `--chart-1` a `--chart-5` | shades 500/700/400/300/600 da paleta escolhida (hex puro, não HSL) |

**Vars setadas por `applyNeutral(selection)`** (recalculadas também quando a classe `.dark` muda, via `MutationObserver`):

| CSS var | Light | Dark |
|---|---|---|
| `--muted` | shade 100 do neutro | shade 700, com lightness limitada a 18% |
| `--muted-foreground` | shade 500 | shade 400 |
| `--border` | shade 200 | shade 700, lightness ≤ 14% |
| `--input` | shade 200 | shade 700, lightness ≤ 14% |
| `--sidebar-border` | shade 200 | shade 700, lightness ≤ 12% |

O "cap de lightness" no dark mode existe para impedir que um neutro claro (ex. `stone`) gere bordas/divisores excessivamente visíveis sobre fundo escuro — preserva o *hue* e a *saturação* da paleta escolhida, só limita a *lightness*.

Shades `100`, `200`, `900`, `950` são **removidos do picker de UI** e remapeados automaticamente para `300`/`300`/`800`/`800` respectivamente se encontrados no `localStorage` (migração silenciosa de seleções antigas).

### 2.2 Vars estáticas em `globals.css` (fallback SSR + tokens que o provider NÃO toca)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --radius: 0.5rem;
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-border: 220 13% 91%;
}

.dark {
  --background: 240 6% 8%;
  --foreground: 0 0% 96%;
  --card: 240 6% 8%;
  --popover: 240 6% 8%;
  --secondary: 240 4% 18%;
  --accent: 240 4% 18%;
  --destructive: 0 72.2% 50.6%;
  --sidebar-background: 240 6% 8%;
  --sidebar-border: 240 4% 12%;
}
```

Todas as vars acima estão em formato **"H S% L%" sem `hsl()`** — o `@theme inline` do Tailwind envolve cada uma em `hsl(var(--x))`. `--destructive` **não** é afetado pela cor primária dinâmica; é fixo (vermelho semântico), correto e esperado.

Tokens extras fora do sistema shadcn padrão: `--map-bg`, `--map-land`, `--map-land-hover`, `--map-land-active`, `--map-border`, `--map-label` (claro/escuro) — específicos do mapa de usuários do Dashboard, não fazem parte do design system genérico, não portar para outros apps a menos que o produto tenha um mapa equivalente.

### 2.3 Radius

Escala multiplicativa baseada em uma única var `--radius` (default `0.5rem`):

| Token | Fórmula | Valor com `--radius: 0.5rem` |
|---|---|---|
| `rounded-sm` | `calc(var(--radius) * 0.6)` | 0.3rem |
| `rounded-md` | `calc(var(--radius) * 0.8)` | 0.4rem |
| `rounded-lg` | `var(--radius)` | 0.5rem |
| `rounded-xl` | `calc(var(--radius) * 1.4)` | 0.7rem |
| `rounded-2xl` | `calc(var(--radius) * 1.8)` | 0.9rem |
| `rounded-3xl` | `calc(var(--radius) * 2.2)` | 1.1rem |
| `rounded-4xl` | `calc(var(--radius) * 2.6)` | 1.3rem |

Existe também uma escala numérica fixa (`r-0` a `r-8`, de `0` a `1rem` em passos de `0.125rem`) em `packages/ui/src/tokens/radius.ts`, não usada nos primitivos `ui/*.tsx` do admin — disponível para uso pontual em páginas de aplicação.

### 2.4 Border width

`border-thin` (0.5px), `border` (1px, default do Tailwind), `border-medium` (1.5px), `border-3` (3px), `border-4` (4px). Únicos usos vistos nos primitivos são a espessura default (`border`, `border-t`, `border-b`, etc.) — a escala estendida existe para uso em páginas de aplicação.

### 2.5 Dark / Light mode

Dois mecanismos independentes, empilhados em `app/providers.tsx`:

```tsx
<SpacemanThemeProvider defaultTheme="system" animationType={ThemeAnimationType.CIRCLE} duration={500}>
  <ColorThemeProvider defaultColorTheme="yellow">
    {children}
  </ColorThemeProvider>
</SpacemanThemeProvider>
```

- **`SpacemanThemeProvider`** (`@space-man/react-theme-animation`) controla light/dark/system com uma transição animada em círculo ao trocar (usado no toggle da sidebar footer e em `/configuracoes`). Por baixo, ainda é a estratégia `attribute="class"` do `next-themes` — a classe `.dark` no `<html>` é o que efetivamente ativa as vars do bloco `.dark` do CSS.
- **`ColorThemeProvider`** cuida só da cor primária/neutra (independente de light/dark).
- Existe também um `ThemeProvider` genérico em `packages/ui/src/providers/theme-provider.tsx` que envolve `next-themes` diretamente (sem a animação Spaceman) — é o que `apps/connect` usa hoje (`@space-man/react-theme-animation` não é dependência do connect).

### 2.6 Tipografia

- `Reddit Sans` — pesos 300 a 900, variável `--font-sans`.
- `Reddit Mono` — pesos 300 a 700, variável `--font-mono`.
- `fontWeight` explícito exposto como utilities Tailwind (`font-thin` a `font-black`).
- Sem escala de `font-size` customizada — usa a escala default do Tailwind (`text-xs` a `text-9xl`).

### 2.7 Sombras e breakpoints

- **Sombras**: nenhum token customizado. Os primitivos usam as utilities padrão do Tailwind (`shadow-sm`, `shadow-md`, `shadow-lg`) diretamente, sem indireção via CSS var.
- **Breakpoints**: escala default do Tailwind (`sm`/`md`/`lg`/`xl`/`2xl`), sem override. O único breakpoint com significado de produto é `768px` (`md`), hardcoded em `useIsMobile()` (não lido de uma var Tailwind) para decidir entre sidebar fixa e `Sheet` (drawer).

### 2.8 Animações

`accordion-down`, `accordion-up` (usadas pelo Radix Accordion, componente não instalado no admin ainda mas os keyframes já existem) e `fade-in` (translateY 4px → 0, opacity 0 → 1, 0.2s ease-out). Mais o pacote `tw-animate-css`, que fornece as classes `animate-in`/`animate-out`/`fade-in-0`/`zoom-in-95`/`slide-in-from-*` usadas extensivamente em `dialog`, `dropdown-menu`, `select`, `sheet`, `popover`, `tooltip`.

---

## 3. Catálogo de Primitivos (`src/components/ui/`)

29 arquivos. Todos client components exceto `badge`, `skeleton`, `table`, `breadcrumb`, `textarea`, `empty` (server-compatible, sem `"use client"`).

| Componente | Variantes (`cva`) | Tamanhos | Customização vs. shadcn stock |
|---|---|---|---|
| **button** | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` | `xs`, `sm` (default!), `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg` | ⚠️ `active:scale-[0.97]` (bounce tátil, sancionado). `defaultVariants.size = "sm"` — diverge do stock (`default`). |
| **input** | — | `xs`, `sm` (default), `default`, `lg` | Tamanhos via `cva` (stock shadcn não tem `size` prop). |
| **label** | — | — | Idêntico ao stock. |
| **card** | — | — | Idêntico ao stock (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`; **sem** `CardAction`, sem `size`, sem `ring`/spacing customizado). |
| **textarea** | — | `xs`, `sm` (default), `default`, `lg` | Tamanhos via `cva`, igual ao Input. |
| **select** | — (trigger) | `xs`, `sm` (default), `default`, `lg` | Tamanhos via `cva` no `SelectTrigger`. |
| **switch** | — | — | Idêntico ao stock. |
| **checkbox** | — | — | Idêntico ao stock. |
| **radio-group** | — | — | Idêntico ao stock. |
| **badge** | `default`, `secondary`, `destructive`, `success`, `warning`, `info`, `outline` | `xs`, `sm` (default), `default`, `lg` | ⚠️ Variantes semânticas **adicionadas** (`success`/`warning`/`info` não existem no shadcn stock). `rounded-full` (stock costuma ser `rounded-md`). |
| **alert** | `default`, `info`, `success`, `warning`, `destructive` (cor) × `card`, `banner` (`shape`) | — | ⚠️ Variantes semânticas adicionadas + dimensão `shape` inteira (não existe no stock) + subcomponentes extras `AlertActions`/`AlertAction`/`AlertClose` (não existem no stock, que só tem `Alert`/`AlertTitle`/`AlertDescription`). |
| **alert-dialog** | — | — | Idêntico ao stock (usa `buttonVariants` do `button.tsx` local para Action/Cancel). |
| **dialog** | — | — | Idêntico ao stock. |
| **sheet** | `top`, `bottom`, `left`, `right` (`side`) | — | Idêntico ao stock. |
| **dropdown-menu** | `Item`: `default`, `warning`, `destructive` (`variant` prop) | — | ⚠️ `variant="warning"` **adicionado** ao `DropdownMenuItem` (stock só tem `default`/`destructive`). |
| **popover** | — | — | Idêntico ao stock. |
| **tooltip** | — | — | Idêntico ao stock, exceto `delayDuration` default `0` (stock é `700`). |
| **command** (cmdk) | — | — | Idêntico ao stock. |
| **table** | — | — | Idêntico ao stock. |
| **tabs** | `TabsList`/`TabsTrigger`: `default`, `underline` | — | ⚠️ Variante `underline` **adicionada** (navegação por abas sublinhadas, usada em `/configuracoes` e `/tenants/[id]`) além do `default` (pill). |
| **breadcrumb** | — | — | Idêntico ao stock. |
| **avatar** | — | — | Idêntico ao stock. |
| **separator** | — | — | Idêntico ao stock. |
| **skeleton** | — | — | Idêntico ao stock. |
| **sonner** (Toaster) | — | — | Cores forçadas via CSS vars inline (`--normal-bg`, `--success-bg`, etc., todas mapeadas para `--popover`/`--border`/`--popover-foreground`) — sonner por padrão usaria cores fixas próprias; aqui tudo vem do tema. `theme="system"` fixo. |
| **sidebar** | `SidebarMenuButton`: `default`, `outline` (`variant`) × `default`, `sm`, `lg` (`size`) | — | Componente composto grande (SidebarProvider + 20 subcomponentes). Sem alteração vs. stock shadcn "sidebar-07" block, exceto pela integração com `--sidebar-accent` dinâmico (ver seção 2.1). Cookie `sidebar_state`, 7 dias. Larguras fixas: `16rem` (expandida), `18rem` (mobile/Sheet), `3rem` (ícone). Atalho de teclado `Cmd/Ctrl+B`. Breakpoint mobile: `768px` via `useIsMobile()`. |
| **empty** | `EmptyMedia`: `default`, `icon` | — | Não existe no shadcn stock oficial (é um bloco/pattern, não um primitivo Radix) — construído do zero seguindo a convenção de `data-slot`. |
| **input-group** | `Addon`: 4 posições (`inline-start`, `inline-end`, `block-start`, `block-end`). `Button` interno: `xs` (default), `sm`, `icon-xs`, `icon-sm` | — | Não existe no shadcn stock oficial — wrapper composto para agrupar Input/Textarea com ícones/botões/texto acoplado. |
| **chart** | — | — | Wrapper padrão do shadcn sobre Recharts (`ChartContainer`, `ChartTooltip`, `ChartLegend`). Sem alteração de estrutura visual — os overrides são de seletor CSS para estilizar elementos internos do Recharts (grid, cursor, eixos) via tokens do tema. |

### 3.1 Exceções visuais sancionadas (aplicam-se a TODOS os apps que seguem este design system)

1. **Bounce tátil em botões**: `active:scale-[0.97]` na classe base de `button.tsx`. Único lugar do sistema com uma transformação de escala no `:active`.
2. **`defaultVariants.size = "sm"`** em `Button`, `Input`, `Select`, `Textarea` — o tamanho "padrão" do design system é o `sm` (h-8), não o `default` (h-9) do shadcn stock. Isso é deliberado e consistente nos 4 componentes.
3. **Variantes semânticas de cor** (`info`/`success`/`warning`, além de `destructive`) em `Badge`, `Alert` e `DropdownMenuItem`. Sempre no mesmo padrão de cor por categoria:
   - `success` → `green-100`/`green-700` (light), `green-500/15`/`green-400` (dark)
   - `warning` → `amber-100`/`amber-700` (light), `amber-500/15`/`amber-400` (dark) — exceto em `DropdownMenuItem`, que usa `yellow-*` em vez de `amber-*` para o warning (inconsistência pontual real do código, ver Achado 3)
   - `info` → `blue-100`/`blue-700` (light), `blue-500/15`/`blue-400` (dark)
   - `destructive` → `red-*` (Badge/Alert) ou o token semântico `--destructive` (DropdownMenuItem, AlertDialog)
4. **Variante `underline` em Tabs** — navegação por abas sublinhadas (border-b-2, sem pill de fundo), alternativa à variante `default` (pill sobre `bg-muted`).

---

## 4. Utilitários e Helpers

### 4.1 `cn()` — `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Usado em **100%** dos primitivos para compor `className`. Qualquer componente novo deve seguir o mesmo padrão: `cn(baseClasses, variantClasses, props.className)` — o `className` do consumidor sempre por último, para que `twMerge` resolva conflitos a favor do que foi passado de fora.

### 4.2 Seletor de variantes — `cva` (class-variance-authority)

Todo componente com mais de uma aparência usa `cva()`, nunca `if/else` manual de classes. Padrão:

```ts
const xVariants = cva(
  "classes-base-sempre-aplicadas",
  {
    variants: {
      variant: { default: "...", outline: "..." },
      size: { sm: "...", default: "..." },
    },
    defaultVariants: { variant: "default", size: "sm" },
  }
)
```

O tipo de props é sempre `VariantProps<typeof xVariants>`, exportado junto com o componente quando outro arquivo precisa compor variantes (ex. `AlertDialogAction` reaproveita `buttonVariants` de `button.tsx`).

### 4.3 `useIsMobile()` — `src/hooks/use-mobile.tsx`

Hook de 19 linhas, breakpoint fixo `768px`, via `window.matchMedia`. Único hook de UI compartilhado nos primitivos (usado por `sidebar.tsx` para decidir entre `Sidebar` fixa e `Sheet`/drawer).

### 4.4 Tokens programáticos — `packages/ui/src/tokens/`

- `colors.ts`: 27 paletas (`COLOR_NAMES`), split em 18 cromáticas (`CHROMATIC_NAMES`, usadas no picker de cor primária) e 9 neutras (`NEUTRAL_NAMES`, picker de neutro). Cada paleta tem os 11 shades padrão Tailwind (`50`-`950`) como hex. `hexToHsl(hex)` converte para o formato `"H S% L%"` usado nas CSS vars.
- `radius.ts` / `border.ts` / `typography.ts`: constantes espelhando os tokens do `globals.css`, para uso em JS/TS (ex. cálculos de contraste, previews).

---

## 5. Achados relevantes (discrepâncias documentação × código real)

Estes pontos foram encontrados durante a extração e **não foram corrigidos** (fora do escopo desta tarefa, que é só leitura/documentação). Sinalizados para decisão do time:

1. **`packages/config/tailwind/preset.ts` não está em uso.** Nenhum app (`admin`, `connect`, `landing`) importa esse preset — todos usam Tailwind v4 CSS-first via `@theme inline` direto no `globals.css` de cada app. O preset (e a referência a `tailwind.config.ts` em `components.json`) parecem ser resquícios de uma configuração Tailwind v3 anterior à migração para v4. Não deletei nada, só registro que é código morto do ponto de vista do design system ativo.
2. **A regra global de focus ring documentada no `CLAUDE.md` raiz não existe no código.** O `CLAUDE.md` raiz descreve uma "exceção sancionada": `outline: 2px solid hsl(var(--ring))` + `outline-offset: 0` em `*:focus-visible`, com exclusão de menus Radix via `:not([role='menu'], ...)`. Essa regra **não foi encontrada** em `apps/admin/src/app/globals.css` nem em nenhum outro arquivo do admin. Ou foi removida em algum momento sem atualizar a documentação, ou nunca chegou a ser implementada. Os primitivos hoje usam o focus ring padrão do shadcn (`focus-visible:ring-[3px] focus-visible:ring-ring/50` + `focus-visible:border-ring`), sem outline customizado.
3. **Inconsistência pontual de cor no `warning`**: `Badge` e `Alert` usam `amber-*` para a variante `warning`; `DropdownMenuItem` usa `yellow-*` para a mesma variante semântica. Provavelmente não intencional (mesmo papel semântico, paleta diferente).
4. **`components.json` diz `iconLibrary: "lucide"`**, mas a maior parte do código de aplicação (fora de `ui/*.tsx`) usa `@tabler/icons-react`. Não é uma inconsistência de fato — é a convenção real (primitivo = lucide, página = tabler) — mas o campo do `components.json` não reflete isso, é só a preferência do CLI do shadcn para instalar novos componentes.
5. **`--radius` real é `0.5rem`, não `0.45rem`.** O `CLAUDE.md` raiz (seção "Design System", antes desta atualização) documentava `--radius: 0.45rem` como o preset "Small" do shadcn v4. O valor lido direto de `apps/admin/src/app/globals.css` é `0.5rem`. Corrigido na seção do `CLAUDE.md` que aponta para este documento — mas vale investigar se `0.45rem` foi um valor usado em algum momento e revertido, ou se a documentação nunca bateu com o código.

---

## 6. Regras de Contribuição

Estas regras são **obrigatórias** para qualquer código novo em qualquer app do monorepo que declare seguir o Noun Design System.

### 6.1 Nunca sobrescrever propriedade visual de base

Ao consumir um componente de `components/ui/`, não passar `className` que sobrescreva `ring`, `border`, `radius`, `shadow`, `padding` ou `height` do componente base. Se o visual built-in não serve, a decisão correta é uma de:
- (a) usar uma variante/tamanho já existente (`variant`, `size`);
- (b) propor uma variante nova via `cva`, seguindo o padrão da seção 4.2, com PR revisado à parte;
- (c) customizar só via CSS var semântica em `globals.css` (nunca inline, nunca hardcoded).

### 6.2 Nunca hardcodar cor

Zero `bg-[#...]`, `text-[#...]`, `style={{ color: '...' }}` em componentes ou páginas. Toda cor passa por uma CSS var semântica (`bg-primary`, `text-muted-foreground`, `border-destructive`, etc.) ou, para paletas categóricas (gráficos, mapas), pelas vars `--chart-1..5` ou pelas paletas nomeadas de `packages/ui/src/tokens/colors.ts`.

### 6.3 Variantes semânticas seguem o vocabulário existente

Se um componente novo precisa de estados de cor com significado (sucesso/aviso/informação/erro), usar exatamente os quatro nomes já estabelecidos — `success`, `warning`, `info`, `destructive` — nas mesmas paletas Tailwind (`green`, `amber`, `blue`, `red`/token `--destructive`). Não introduzir um quinto nome nem trocar a paleta de um já existente.

### 6.4 Tamanho padrão é `sm`

Qualquer componente novo com prop `size` deve ter `defaultVariants.size: "sm"` para ficar consistente com `Button`/`Input`/`Select`/`Textarea`. Se o componente não tiver motivo de negócio para escala de tamanho, não adicionar a prop.

### 6.5 `cn()` é obrigatório, nunca concatenação manual de string

`className={cn(base, condicional && "classe", props.className)}` — sempre nessa ordem, sempre via `cn`. Nunca `` `${base} ${props.className}` `` nem `classNames` de outra lib.

### 6.6 Novo componente shadcn: instalar antes de criar manualmente

Antes de escrever um primitivo do zero, verificar se existe uma versão oficial do shadcn/ui equivalente e instalá-la (via CLI ou MCP shadcn quando disponível), depois aplicar as customizações descritas neste documento por cima. Só construir do zero (como `empty.tsx` e `input-group.tsx`, que não são primitivos Radix) quando não houver equivalente oficial.

### 6.7 Toda variante nova precisa ser documentada aqui

Se um componente ganhar uma variante, tamanho, ou prop nova em qualquer app, a mudança correspondente precisa ser refletida neste `DESIGN_SYSTEM.md` (tabela da seção 3) na mesma tarefa — este documento não pode ficar defasado do código do admin, porque ele é a fonte que todos os outros produtos consultam.

### 6.8 Não duplicar tokens entre apps

Cores, radius, border-width e tipografia são definidos uma vez (hoje: por app, em `globals.css`, já que o preset compartilhado está inativo — Achado 1). Um app novo deve copiar a estrutura de `globals.css` do admin (as vars da seção 2.2, mais o mecanismo do `ColorThemeProvider` se o app quiser cor customizável pelo usuário) em vez de inventar uma nomenclatura de var própria.

### 6.9 Dark mode não é opcional

Todo componente/página novo precisa funcionar em `.dark` sem ajuste manual — se o componente só usa as CSS vars semânticas (nunca cor hardcoded), isso já é automático. Testar visualmente nos dois modos antes de considerar pronto.

---

## 7. Próximos passos sugeridos (não executados nesta tarefa)

- Decidir se a regra global de focus ring (Achado 2) deve ser implementada de fato ou removida da documentação do `CLAUDE.md` raiz.
- Decidir se `packages/config/tailwind/preset.ts` deve ser removido (código morto) ou se há um plano de voltar a usá-lo.
- Corrigir a inconsistência `amber` vs `yellow` no warning do `DropdownMenuItem` (Achado 3), se confirmado não-intencional.
