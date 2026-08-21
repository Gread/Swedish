import { useMemo, useState } from 'react'
import type { Card } from '../rig/types'
import { CardCanvas } from '../components/CardCanvas'
import { ReviewScene } from '../components/ReviewScene'
import { LEVEL_OPACITY, useProgress } from '../store/progress'

function ReviewCard({ card, onNext }: { card: Card; onNext: () => void }) {
  const scene = useMemo(() => card.createScene(), [card])
  const [revealed, setRevealed] = useState(false)
  const [feedback, setFeedback] = useState<'certo' | 'errado' | null>(null)
  const answer = useProgress((s) => s.answer)
  const level = useProgress((s) => s.get(card.meta.id).nivelOpacidade)

  const opacity = LEVEL_OPACITY[level]

  const respond = (correct: boolean) => {
    answer(card.meta.id, correct)
    setFeedback(correct ? 'certo' : 'errado')
    setTimeout(onNext, 1100)
  }

  return (
    <div className="view review-view">
      <header>
        <span className="chip">{card.meta.contexto}</span>
        <h1>{card.meta.fraseFonte}</h1>
        <p className="hint">
          {level === 0
            ? 'Sem imagem — você já aprendeu esta. Ainda lembra?'
            : 'Use a cena como pista e diga em sueco.'}
        </p>
      </header>

      <div className="canvas-wrap">
        <CardCanvas scene={scene}>
          <ReviewScene scene={scene} opacity={feedback === 'errado' ? 1 : opacity} />
        </CardCanvas>
        {feedback && (
          <div className={`feedback ${feedback}`}>
            {feedback === 'certo' ? 'A imagem enfraquece ✨' : 'A imagem volta pra te ajudar'}
          </div>
        )}
      </div>

      {!revealed ? (
        <div className="controls">
          <button className="primary" onClick={() => setRevealed(true)}>
            Mostrar resposta
          </button>
        </div>
      ) : (
        <div className="reveal">
          <div className="answer">
            <span className="sv">{card.meta.fraseAlvo}</span>
            <span className="pron">🗣 {card.meta.pronuncia}</span>
          </div>
          {!feedback && (
            <div className="controls">
              <button className="wrong" onClick={() => respond(false)}>
                Errei
              </button>
              <button className="right" onClick={() => respond(true)}>
                Acertei
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ReviewView({ cards, onExit }: { cards: Card[]; onExit: () => void }) {
  const [index, setIndex] = useState(0)

  if (cards.length === 0 || index >= cards.length) {
    return (
      <div className="view done-view">
        <h1>Revisão concluída 🎉</h1>
        <button className="primary" onClick={onExit}>
          Voltar
        </button>
      </div>
    )
  }

  return (
    <ReviewCard
      key={`${cards[index].meta.id}-${index}`}
      card={cards[index]}
      onNext={() => setIndex((i) => i + 1)}
    />
  )
}
