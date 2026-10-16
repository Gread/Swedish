import type { StateStorage } from 'zustand/middleware'

/** Aberto pela extensão do Omarchy (janela da cena, servida por omarchy/server.py). */
export const isOmarchy = new URLSearchParams(window.location.search).has('omarchy')

/** Progresso guardado pelo servidor local em ~/.local/state/swedish/progress.json. */
export const serverStorage: StateStorage = {
  getItem: async () => {
    const res = await fetch('/api/progress', { cache: 'no-store' })
    if (!res.ok) return null
    const text = await res.text()
    return text === 'null' ? null : text
  },
  setItem: async (_name, value) => {
    await fetch('/api/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: value })
  },
  removeItem: async () => {
    await fetch('/api/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"state":{"cards":{}},"version":0}' })
  },
}
