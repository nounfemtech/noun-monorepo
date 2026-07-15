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
- **Página em branco ao clicar no link de convite (investigação em andamento)**: hipótese líder é que o provedor de e-mail transacional (Brevo, domínio de tracking `sendibt3.com`) reescreve o link para métricas de clique, e o bot/scanner de pré-visualização do provedor consome o código de uso único do Supabase antes do clique real do usuário, gerando "link already used"/"token not found". Evidência: logs do Auth (`get_logs`, service `auth`) mostraram um `/verify` falho ("One-time token not found" / "403: Email link is invalid or has expired") poucos minutos antes do `/verify` bem-sucedido do mesmo convite. Mitigação recomendada: desativar click-tracking nos e-mails transacionais da Brevo (ou trocar de provedor para um sem tracking por padrão, ex. Resend). SMTP nativo do Supabase não é opção viável mesmo para baixo volume (rate limit muito agressivo).
  - Segunda hipótese, ainda não confirmada, a checar: os logs de login mostraram `login_method: "implicit"`. Se o projeto Supabase estiver configurado para fluxo **implicit** (tokens no fragmento da URL, depois do `#`) em vez de **PKCE** (`?code=`), o `auth/callback/route.ts` atual nunca funcionaria, porque fragmento de URL não chega ao servidor. Precisa confirmar em Authentication → URL Configuration no painel do Supabase, ou inspecionando a URL real recebida no clique (`#access_token=...` vs `?code=...`).

## 6. Tema dual-canal (`data-tenant-type`)

Cada tipo de tenant tem sua própria paleta `--primary` (e chart/sidebar derivados), via CSS vars em `globals.css`, seguindo a mesma regra do resto do monorepo (nunca hardcode de cor em componente):

- Sem atributo / `specialist`: tema padrão (tons de azul).
- `[data-tenant-type="pharmacy"]`: tema teal/verde-azulado, com variante dark equivalente (`[data-tenant-type="pharmacy"].dark`).

O atributo é aplicado uma vez no wrapper raiz de `(app)/layout.tsx`, resolvido a partir de `tenants.type` (`pharmacy` -> canal farmácia, qualquer outro valor -> canal especialista). `theme/page.tsx` é a página de preview lado a lado dos dois canais, claro/escuro, botões, inputs e cards.

## 7. Pendências

- Corrigir `reenviarConvite` para tenants já confirmados (seção 5).
- Confirmar e, se necessário, corrigir causa raiz da página em branco no clique do convite (click-tracking e/ou flow type implicit vs PKCE).
- Dashboard do parceiro (`(app)/dashboard/page.tsx`) ainda é placeholder, sem métricas reais.
- Nenhuma mudança desta investigação foi commitada ainda: aguardando validação end-to-end do fluxo de convite antes do commit único (regra do CLAUDE.md raiz).
