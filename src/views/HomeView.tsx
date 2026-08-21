import type { Card } from '../rig/types'
import { MAX_LEVEL, useProgress } from '../store/progress'

interface HomeViewProps {
  cards: Card[]
  onBuild: (card: Card) => void
  onReview: () => void
}

export function HomeView({ cards, onBuild, onReview }: HomeViewProps) {
  const progress = useProgress()
  const dueCount = cards.filter((c) => progress.isDue(c.meta.id)).length
  const learned = cards.filter(
    (c) => progress.get(c.meta.id).built && progress.get(c.meta.id).nivelOpacidade === 0,
  ).length
  const nextUnbuilt = cards.find((c) => !progress.get(c.meta.id).built)

  return (
    <div className="view home-view">
      <header>
        <h1>Svenska 🇸🇪</h1>
        <p className="hint">
          {learned}/{cards.length} aprendidas · a imagem some quando você aprende
        </p>
      </header>

      <div className="home-actions">
        {nextUnbuilt && (
          <button className="primary big" onClick={() => onBuild(nextUnbuilt)}>
            🔨 Construir próxima cena
            <small>{nextUnbuilt.meta.fraseFonte}</small>
          </button>
        )}
        <button className="big" disabled={dueCount === 0} onClick={onReview}>
          🔁 Revisar {dueCount > 0 ? `(${dueCount})` : '— nada pendente'}
        </button>
      </div>

      <ul className="card-list">
        {cards.map((c) => {
          const p = progress.get(c.meta.id)
          const status = !p.built
            ? { label: 'não construída', cls: 'todo' }
            : p.nivelOpacidade === 0
              ? { label: 'aprendida ✓', cls: 'learned' }
              : { label: `imagem ${Math.round((p.nivelOpacidade / MAX_LEVEL) * 100)}%`, cls: 'learning' }
          return (
            <li key={c.meta.id}>
              <div>
                <strong>{c.meta.fraseFonte}</strong>
                {p.built && <span className="sv-small">{c.meta.fraseAlvo}</span>}
              </div>
              <span className={`status ${status.cls}`}>{status.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
