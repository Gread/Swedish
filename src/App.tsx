import { useState } from 'react'
import type { Card } from './rig/types'
import { cards } from './data/cards'
import { HomeView } from './views/HomeView'
import { BuildView } from './views/BuildView'
import { ReviewView } from './views/ReviewView'
import { useProgress } from './store/progress'
import './App.css'

type Route = { view: 'home' } | { view: 'build'; card: Card } | { view: 'review'; cards: Card[] }

export default function App() {
  const [route, setRoute] = useState<Route>({ view: 'home' })
  const isDue = useProgress((s) => s.isDue)

  const goHome = () => setRoute({ view: 'home' })

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
