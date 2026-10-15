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
# Tenta primeiro na GPU (Metal); se travar — acontece com a GPU disputada por
# vários bakes/renders, ou com sessão de compartilhamento de tela aberta —
# repete com o rasterizador em software (SwiftShader), mais lento mas estável.
attempt() {
  local angle="$1" secs="$2"
  # perfil próprio por execução: vários agentes podem renderizar em paralelo
  local prof="$ROOT/blockout/.chrome/$$-$RANDOM"
  mkdir -p "$prof"
  "$CHROME" --headless=new --no-first-run --no-default-browser-check \
    --user-data-dir="$prof" --use-angle="$angle" --enable-unsafe-swiftshader \
    --ignore-gpu-blocklist --window-size=1200,900 \
    "http://127.0.0.1:5173/$QUERY" >/dev/null 2>&1 &
  local pid=$! ok=0
  for _ in $(seq 1 "$secs"); do
    if [ -f "$WAIT" ]; then sleep 1; ok=1; break; fi
    sleep 1
  done
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  rm -rf "$prof" 2>/dev/null || true
  [ "$ok" = 1 ]
}

# No máximo 4 Chromes ao mesmo tempo: com muitos agentes renderizando em
# paralelo a GPU trava e os buffers de rede da máquina se esgotam
# (ERR_NO_BUFFER_SPACE). Vagas por mkdir; vaga de processo morto é liberada.
SLOT=""
while [ -z "$SLOT" ]; do
  for i in 0 1 2 3; do
    d="$ROOT/blockout/.render-slot$i"
    if mkdir "$d" 2>/dev/null; then echo $$ > "$d/pid"; SLOT="$d"; break; fi
    holder="$(cat "$d/pid" 2>/dev/null || true)"
    if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then rm -rf "$d"; fi
  done
  [ -n "$SLOT" ] || sleep 1
done
trap 'rm -rf "$SLOT"' EXIT

if attempt metal "$TIMEOUT" || attempt swiftshader $((TIMEOUT * 2)); then
  echo "ok $WAIT"
else
  echo "timeout esperando $WAIT (o dev server está rodando? a carta compila?)" >&2
  exit 1
fi
