# Criação do Deploy #

cat > /home/painelagendacom/deploy_painelagenda.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

FRONT_REPO="/home/painelagendacom/app"
FRONT_DIST="$FRONT_REPO/dist"
WEB_ROOT="/home/painelagendacom/public_html"

API_NAME="painelagenda-api"
BRANCH="main"

echo "==> (1/7) Repo: $FRONT_REPO"
cd "$FRONT_REPO"

echo "==> (2/7) Git update (branch: $BRANCH)"
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> (3/7) Install deps"
npm ci

echo "==> (4/7) Build frontend"
npm run build

echo "==> (5/7) Safety check: NÃO pode existir portalagenda.com.br/api no build"
if grep -R "portalagenda.com.br/api" -n "$FRONT_DIST/assets" 2>/dev/null | head -n 1; then
  echo "ERRO: Build contém portalagenda.com.br/api."
  echo "Verifique .env.production: VITE_API_BASE_URL=/api"
  exit 1
fi

echo "==> (6/7) Publish dist -> public_html (swap atômico)"
TMP_DIR="$(mktemp -d)"
cp -a "$FRONT_DIST/." "$TMP_DIR/"

rm -rf "${WEB_ROOT}.prev" 2>/dev/null || true
if [ -d "$WEB_ROOT" ]; then
  mv "$WEB_ROOT" "${WEB_ROOT}.prev"
fi
mv "$TMP_DIR" "$WEB_ROOT"

chmod -R u+rwX,go+rX "$WEB_ROOT" || true

echo "==> (7/7) Restart API (PM2): $API_NAME"
pm2 restart "$API_NAME"

echo "==> OK: Deploy finalizado."
EOF

chmod +x /home/painelagendacom/deploy_painelagenda.sh
