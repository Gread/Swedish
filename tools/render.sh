#!/bin/bash
# Renderiza a folha de revisão de uma carta: pose final + 4 quadros da montagem.
#
# uso: tools/render.sh <id> [raw]
#   gera blockout/review/<id>.jpg   (ou <id>-raw.jpg sem os modelos do Blender)
# Abra a imagem com a ferramenta Read para ver o resultado.
set -euo pipefail
ID="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ "${2:-}" = "raw" ]; then
  exec "$ROOT/tools/headless.sh" "?render=$ID&raw" "blockout/review/$ID-raw.jpg"
fi
exec "$ROOT/tools/headless.sh" "?render=$ID" "blockout/review/$ID.jpg"
