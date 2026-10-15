import { useMemo, useState } from 'react'
import type { Card } from './rig/types'
import { cards } from './data/cards'
import { HomeView } from './views/HomeView'
import { BuildView } from './views/BuildView'
import { ReviewView } from './views/ReviewView'
import { CardCanvas } from './components/CardCanvas'
import { ReviewScene } from './components/ReviewScene'
import { useProgress } from './store/progress'
import { ContactSheet, ExportBlockout, RenderReview } from './dev/DevTools'
import { useCardScene } from './rig/useCardScene'
import './App.css'

function PoseDebug({ card, raw }: { card: Card; raw: boolean }) {
  const refined = useCardScene(card)
  const plain = useMemo(() => card.createScene(), [card])
  const scene = raw ? plain : refined.scene
  if (!raw && !refined.ready) return null
  return (
    <div className="view" style={{ height: '100vh' }}>
      <div className="canvas-wrap">
        <CardCanvas scene={scene}>
          <ReviewScene scene={scene} opacity={1} />
        </CardCanvas>
      </div>
    </div>
  )
}

type Route = { view: 'home' } | { view: 'build'; card: Card } | { view: 'review'; cards: Card[] }

// rotas de inspeção (não tocam no progresso):
//   ?pose=<id>   pose final de uma carta com o palco completo
//   ?contact     folha de contato de todas as cartas
//   ?export=<id|all>  exporta o blockout das peças para o pipeline do Blender
const params = new URLSearchParams(window.location.search)
const poseId = params.get('pose')
const contact = params.has('contact')
const exportId = params.get('export')
// ?render=<id|a,b|all>[&raw]  folha de revisão em blockout/review/<id>.jpg
const renderId = params.get('render')

export default function App() {
  const [route, setRoute] = useState<Route>({ view: 'home' })
  const isDue = useProgress((s) => s.isDue)

  const goHome = () => setRoute({ view: 'home' })

  if (poseId) {
    const card = cards.find((c) => c.meta.id === poseId)
    // &raw mostra a versão 100% procedural, para comparar com a refinada
    if (card) return <PoseDebug card={card} raw={params.has('raw')} />
  }
  if (contact) return <ContactSheet cards={cards} />
  const pick = (v: string) => (v === 'all' ? cards : cards.filter((c) => v.split(',').includes(c.meta.id)))
  if (exportId) return <ExportBlockout cards={pick(exportId)} />
  if (renderId) return <RenderReview cards={pick(renderId)} raw={params.has('raw')} />

  return (
    <div className="app">
      {route.view !== 'home' && (
        <button className="back" onClick={goHome}>
          ← Início
        </button>
      )}
      {route.view === 'home' && (
        <HomeView
          cards={cards}
          onBuild={(card) => setRoute({ view: 'build', card })}
          onReview={() =>
            setRoute({ view: 'review', cards: cards.filter((c) => isDue(c.meta.id)) })
          }
        />
      )}
      {route.view === 'build' && <BuildView card={route.card} onDone={goHome} />}
      {route.view === 'review' && <ReviewView cards={route.cards} onExit={goHome} />}
    </div>
  )
}
