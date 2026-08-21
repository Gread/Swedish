import { useMemo, useState } from 'react'
import type { Card } from './rig/types'
import { cards } from './data/cards'
import { HomeView } from './views/HomeView'
import { BuildView } from './views/BuildView'
import { ReviewView } from './views/ReviewView'
import { CardCanvas } from './components/CardCanvas'
import { ReviewScene } from './components/ReviewScene'
import { useProgress } from './store/progress'
import './App.css'

function PoseDebug({ card }: { card: Card }) {
  const scene = useMemo(() => card.createScene(), [card])
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

// rota de inspeção: ?pose=<id> renderiza a pose final de uma carta, sem tocar no progresso
const poseId = new URLSearchParams(window.location.search).get('pose')

export default function App() {
  const [route, setRoute] = useState<Route>({ view: 'home' })
  const isDue = useProgress((s) => s.isDue)

  const goHome = () => setRoute({ view: 'home' })

  if (poseId) {
    const card = cards.find((c) => c.meta.id === poseId)
    if (card) return <PoseDebug card={card} />
  }

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
