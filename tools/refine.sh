#!/bin/bash
# Pipeline completo do Blender para uma carta:
#   1. exporta o blockout das peças (geometria procedural) via Chrome headless
#   2. lê as peças orgânicas declaradas na carta (card.refine.organic)
#   3. Blender funde/esculpe/faz bake de AO dessas peças
#   4. publica em public/refined/<id>.glb (o app passa a usar)
#   5. renderiza a folha de revisão com o resultado
#
# uso: tools/refine.sh <id>
# Sem peças orgânicas declaradas, remove qualquer refinado antigo e a carta
# segue 100% procedural.
set -euo pipefail
ID="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
cd "$ROOT"
mkdir -p blockout/refined public/refined

"$ROOT/tools/headless.sh" "?export=$ID" "blockout/$ID.json" >/dev/null
ORGANIC="$(node -e "const m=require('$ROOT/blockout/$ID.json'); process.stdout.write((m.organic||[]).join(','))")"

if [ -z "$ORGANIC" ]; then
  rm -f "public/refined/$ID.glb"
  echo "$ID: nenhuma peça orgânica declarada — segue procedural"
else
  rm -f "blockout/refined/$ID.glb" # sem resto de execução anterior mascarando falha
  "$BLENDER" -b --python tools/blender/refine.py -- \
    "blockout/$ID.glb" "blockout/refined/$ID.glb" --organic "$ORGANIC" --ao 2>&1 \
    | grep -E "^\[refine\]|Error|Traceback" || true
  [ -f "blockout/refined/$ID.glb" ] || { echo "$ID: Blender não gerou saída" >&2; exit 1; }
  cp "blockout/refined/$ID.glb" "public/refined/$ID.glb"
  echo "$ID: refinado ($ORGANIC)"
fi

"$ROOT/tools/render.sh" "$ID"
