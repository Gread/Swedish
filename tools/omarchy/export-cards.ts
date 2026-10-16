// Exporta os metadados das cartas (sem as cenas 3D) para dist/cards.json,
// que o painel do Omarchy lê: frase, tradução, pronúncia, e os decks de cada
// carta (lote, tema, nível). Roda depois do build: npm run build:omarchy
import { createServer } from 'vite'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')

/** Lote de cada carta: os comentários "// Lote N" que agrupam os imports em data/cards.ts. */
function lotes(): Record<string, number> {
  const out: Record<string, number> = {}
  let lote = 0
  for (const line of readFileSync(resolve(root, 'src/data/cards.ts'), 'utf8').split('\n')) {
    const header = line.match(/^\/\/ Lote (\d+)/)
    if (header) lote = Number(header[1])
    const card = line.match(/from '\.\.\/cards\/([^']+)'/)
    if (card) out[card[1]] = lote
  }
  return out
}

const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
try {
  const { cards } = await server.ssrLoadModule('/src/data/cards.ts')
  const { classificar, TEMAS, NIVEIS } = await server.ssrLoadModule('/src/data/decks.ts')
  const loteDe = lotes()
  const metas = cards.map((c: { meta: Record<string, string> }, index: number) => ({
    index,
    ...c.meta,
    lote: loteDe[c.meta.id] ?? 0,
    ...classificar(c),
  }))
  mkdirSync(resolve(root, 'dist'), { recursive: true })
  writeFileSync(
    resolve(root, 'dist/cards.json'),
    JSON.stringify({ temas: TEMAS, niveis: NIVEIS, cards: metas }, null, 1),
  )
  console.log(`cards.json: ${metas.length} cartas`)
} finally {
  await server.close()
}
