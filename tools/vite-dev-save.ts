import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve, relative, isAbsolute } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Endpoint só de desenvolvimento: `POST /__dev/save?path=<relativo>` grava o
 * corpo da requisição em disco, restrito à pasta `blockout/` do projeto.
 *
 * Existe para o navegador exportar a geometria das cenas (GLTFExporter) e o
 * pipeline do Blender pegar os arquivos sem intermediário manual.
 */
export function devSave(root: string): Plugin {
  const allowed = resolve(root, 'blockout')
  return {
    name: 'dev-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/save', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('use POST')
          return
        }
        const url = new URL(req.url ?? '', 'http://x')
        const rel = url.searchParams.get('path') ?? ''
        const target = resolve(allowed, rel)
        const inside = relative(allowed, target)
        if (!rel || inside.startsWith('..') || isAbsolute(inside)) {
          res.statusCode = 400
          res.end('path fora de blockout/')
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (c: Buffer) => chunks.push(c))
        req.on('end', () => {
          mkdirSync(dirname(target), { recursive: true })
          writeFileSync(target, Buffer.concat(chunks))
          res.statusCode = 200
          res.end('ok')
        })
      })
    },
  }
}
