#!/bin/bash
# Renderiza a folha de revisão de uma carta: pose final + 4 quadros da montagem.
#
# uso: tools/render.sh <id> [raw] [LxA]
#   gera blockout/review/<id>.jpg   (ou <id>-raw.jpg sem os modelos do Blender;
#   com LxA, ex. 400x700, renderiza nessa proporção: <id>-400x700.jpg)
# Abra a imagem com a ferramenta Read para ver o resultado.
set -euo pipefail
ID="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
QUERY="?render=$ID"
OUT="$ID"
for arg in "${@:2}"; do
  case "$arg" in
    raw) QUERY="$QUERY&raw"; OUT="$OUT-raw" ;;
    [0-9]*x[0-9]*) QUERY="$QUERY&size=$arg"; OUT="$OUT-$arg" ;;
  esac
done
exec "$ROOT/tools/headless.sh" "$QUERY" "blockout/review/$OUT.jpg"
