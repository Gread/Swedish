import { useEffect, useState } from 'react'
import { cards } from '../data/cards'
import { BuildView } from '../views/BuildView'
import { ReviewView } from '../views/ReviewView'
import { useProgress } from '../store/progress'
import '../App.css'
import './omarchy.css'

// Janela da cena aberta pelo painel do Omarchy:
//   ?omarchy&mode=build&card=<id>        monta uma cena
//   ?omarchy&mode=review&cards=<a,b,…>   revisa essas cartas (ou "due": as pendentes)
const params = new URLSearchParams(window.location.search)
const mode = params.get('mode') === 'review' ? 'review' : 'build'

/** Cores do tema atual do Omarchy viram variáveis CSS (omarchy.css usa). */
async function applyTheme() {
  try {
    const colors: Record<string, string> = await (await fetch('/api/theme', { cache: 'no-store' })).json()
    const root = document.documentElement.style
    for (const [key, value] of Object.entries(colors)) {
      if (/^#[0-9a-f]{3,8}$/i.test(value)) root.setProperty(`--om-${key.replace(/_/g, '-')}`, value)
    }
  } catch {
    // sem tema: ficam as cores padrão de omarchy.css
  }
}

function closeWindow() {
  window.close()
}

function useHydrated() {
  const [hydrated, setHydrated] = useState(useProgress.persist.hasHydrated())
  useEffect(() => useProgress.persist.onFinishHydration(() => setHydrated(true)), [])
  return hydrated
}

export function OmarchyApp() {
  const hydrated = useHydrated()
  const isDue = useProgress((s) => s.isDue)

  useEffect(() => {
    document.body.classList.add('omarchy')
    applyTheme()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWindow()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!hydrated) return <div className="app omarchy-loading">…</div>

  if (mode === 'build') {
    const card = cards.find((c) => c.meta.id === params.get('card'))
    if (!card) return <Missing />
    return (
      <div className="app">
        <BuildView card={card} onDone={closeWindow} />
      </div>
    )
  }

  const wanted = params.get('cards') ?? 'due'
  const list =
    wanted === 'due' ? cards.filter((c) => isDue(c.meta.id)) : cards.filter((c) => wanted.split(',').includes(c.meta.id))
  return (
    <div className="app">
      <ReviewView cards={list} onExit={closeWindow} />
    </div>
  )
}

function Missing() {
  return (
    <div className="app">
      <div className="view done-view">
        <h1>Carta não encontrada</h1>
        <button className="primary" onClick={closeWindow}>
          Fechar
        </button>
      </div>
    </div>
  )
}
