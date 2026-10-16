// Exporta os metadados das cartas (sem as cenas 3D) para dist/cards.json,
// que o painel do Omarchy lê. Roda depois do build: npm run build:omarchy
import { createServer } from 'vite'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
try {
  const { cards } = await server.ssrLoadModule('/src/data/cards.ts')
  const metas = cards.map((c: { meta: Record<string, string> }, index: number) => ({ index, ...c.meta }))
  mkdirSync(resolve(root, 'dist'), { recursive: true })
  writeFileSync(resolve(root, 'dist/cards.json'), JSON.stringify({ cards: metas }, null, 1))
  console.log(`cards.json: ${metas.length} cartas`)
} finally {
  await server.close()
}
