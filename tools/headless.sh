#!/bin/bash
# Abre uma rota de dev do app num Chrome headless e espera um arquivo aparecer.
#
# uso: tools/headless.sh "<query>" <arquivo-esperado> [timeout_s]
#   ex.: tools/headless.sh "?render=vi-ses" blockout/review/vi-ses.jpg
#
# Requer o dev server rodando em 127.0.0.1:5173 (use 127.0.0.1, não localhost:
# nesta máquina o IPv6 ::1 trava por causa da VPN).
set -euo pipefail
QUERY="$1"
WAIT="$2"
TIMEOUT="${3:-90}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

cd "$ROOT"
rm -f "$WAIT"
# perfil próprio por execução: vários agentes podem renderizar em paralelo
PROF="$ROOT/blockout/.chrome/$$-$RANDOM"
mkdir -p "$PROF"

"$CHROME" --headless=new --no-first-run --no-default-browser-check \
  --user-data-dir="$PROF" --use-angle=metal --ignore-gpu-blocklist \
  --window-size=1200,900 "http://127.0.0.1:5173/$QUERY" >/dev/null 2>&1 &
PID=$!

ok=0
for _ in $(seq 1 "$TIMEOUT"); do
  if [ -f "$WAIT" ]; then sleep 1; ok=1; break; fi
  sleep 1
done
kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true
rm -rf "$PROF"

if [ "$ok" != 1 ]; then
  echo "timeout esperando $WAIT (o dev server está rodando? a carta compila?)" >&2
  exit 1
fi
echo "ok $WAIT"
