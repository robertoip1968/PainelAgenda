cat > /home/painelagendacom/healthcheck_painelagenda.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

BASE="https://cir.painelagenda.com.br"

echo "==> Site / (HTML)"
curl -4 -k -sS -I --connect-timeout 3 --max-time 10 "$BASE/" | egrep -i "HTTP/|content-type|server"

echo "==> JS do build (index.html -> assets/index-*.js)"
JS_PATH=$(grep -oE 'src="/assets/index-[^"]+\.js"' /home/painelagendacom/public_html/index.html | head -n1 | cut -d'"' -f2)
echo "JS_PATH=$JS_PATH"

echo "==> Asset JS (deve ser application/javascript)"
curl -4 -k -sS -I --connect-timeout 3 --max-time 10 "$BASE$JS_PATH" | egrep -i "HTTP/|content-type|content-length"

echo "==> API tenant"
curl -4 -k -sS --connect-timeout 3 --max-time 10 "$BASE/api/tenant" -H "X-Tenant-Slug: cir" | head -c 200 && echo

echo "==> API patients"
curl -4 -k -sS --connect-timeout 3 --max-time 10 "$BASE/api/patients" -H "X-Tenant-Slug: cir" | head -c 200 && echo

echo "==> OK"
EOF

chmod +x /home/painelagendacom/healthcheck_painelagenda.sh
