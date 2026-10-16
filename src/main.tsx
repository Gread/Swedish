import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { loadBases } from './rig/helpers'
import type { Card } from './rig/types'

// Em dev, ?pose= / ?export= / ?render= com ids carregam SÓ essas cartas, por
// import preguiçoso: uma carta quebrada (outra pessoa/agente no meio de uma
// edição) não derruba a renderização das outras, e cartas ainda não
// registradas em data/cards.ts já podem ser renderizadas e refinadas.
async function devRoute(): Promise<ReactNode | null> {
  if (!import.meta.env.DEV) return null
  const p = new URLSearchParams(window.location.search)
  const kind = (['pose', 'export', 'render'] as const).find((k) => p.has(k))
  const ids = kind ? p.get(kind)!.split(',') : []
  if (!kind || ids.includes('all')) return null
  const modules = import.meta.glob<{ default: Card }>('./cards/*.ts')
  const cards: Card[] = []
  for (const id of ids) {
    const load = modules[`./cards/${id}.ts`]
    if (load) cards.push((await load()).default)
  }
  const { DevRoute } = await import('./dev/DevRoutes')
  return <DevRoute kind={kind} cards={cards} raw={p.has('raw')} />
}

async function boot() {
  // As peças-base do Blender precisam estar na memória antes de qualquer cena
  // ser montada: person() as usa de forma síncrona dentro de createScene().
  await loadBases()
  let root = await devRoute()
  if (!root && new URLSearchParams(window.location.search).has('omarchy')) {
    const { OmarchyApp } = await import('./omarchy/OmarchyApp')
    root = <OmarchyApp />
  }
  if (!root) {
    const { default: App } = await import('./App.tsx')
    root = <App />
  }
  createRoot(document.getElementById('root')!).render(<StrictMode>{root}</StrictMode>)
}

boot()
