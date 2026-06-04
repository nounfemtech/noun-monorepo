#!/usr/bin/env bash
# .github/setup-secrets.sh
#
# Configura os GitHub Secrets do repositório Noun via gh CLI.
# Pré-requisito: gh auth login
#
# Uso: bash .github/setup-secrets.sh

set -euo pipefail

REPO="nounfemtech/noun-monorepo"
GH="gh secret set --repo $REPO"

echo "=== Configurando GitHub Secrets — Noun ==="
echo ""

# ─────────────────────────────────────────────
# Vercel
# ─────────────────────────────────────────────
echo "[Vercel] Configurando VERCEL_ORG_ID..."
$GH VERCEL_ORG_ID --body "team_SJTidJCAYJqrmRvlMOw7jdiK"

echo "[Vercel] Configurando VERCEL_PROJECT_ID_WEB..."
$GH VERCEL_PROJECT_ID_WEB --body "prj_30HgVPflZbcv7kt7vYyIiAVnTmIL"

echo ""
echo "[Vercel] VERCEL_TOKEN precisa ser configurado manualmente:"
echo "  1. Acesse: https://vercel.com/account/settings/tokens"
echo "  2. Crie um token com escopo 'Full Account'"
echo "  3. Execute:"
echo "       gh secret set VERCEL_TOKEN --repo $REPO"
echo ""
echo "[Vercel] VERCEL_PROJECT_ID_ADMIN — configurar após criar o projeto admin na Vercel:"
echo "  1. Crie o projeto em: https://vercel.com/new"
echo "  2. Copie o Project ID em: Project Settings → General"
echo "  3. Execute:"
echo "       gh secret set VERCEL_PROJECT_ID_ADMIN --repo $REPO"

# ─────────────────────────────────────────────
# Supabase
# ─────────────────────────────────────────────
echo ""
echo "[Supabase] Configurando SUPABASE_PROJECT_ID..."
$GH SUPABASE_PROJECT_ID --body "vpcjzkygiwtodokcentu"

echo ""
echo "[Supabase] SUPABASE_ACCESS_TOKEN precisa ser configurado manualmente:"
echo "  1. Acesse: https://supabase.com/dashboard/account/tokens"
echo "  2. Gere um novo Access Token"
echo "  3. Execute:"
echo "       gh secret set SUPABASE_ACCESS_TOKEN --repo $REPO"

# ─────────────────────────────────────────────
# Discord
# ─────────────────────────────────────────────
echo ""
echo "[Discord] DISCORD_WEBHOOK_URL precisa ser configurado manualmente:"
echo "  Execute:"
echo "    gh secret set DISCORD_WEBHOOK_URL --repo $REPO"

# ─────────────────────────────────────────────
# Verificação final
# ─────────────────────────────────────────────
echo ""
echo "=== Secrets configurados. Verifique com: ==="
echo "  gh secret list --repo $REPO"
