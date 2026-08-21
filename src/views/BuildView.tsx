import { useMemo, useRef, useState } from 'react'
import type { Card } from '../rig/types'
import { disposeScene, sceneDuration, stepTargets } from '../rig/pose'
import { CardCanvas } from '../components/CardCanvas'
import { BuildPlayer } from '../components/BuildPlayer'
import { useProgress } from '../store/progress'

export function BuildView({ card, onDone }: { card: Card; onDone: () => void }) {
  const scene = useMemo(() => card.createScene(), [card])
  const duration = useMemo(() => sceneDuration(scene), [scene])
  const targets = useMemo(() => stepTargets(scene), [scene])
  const sceneRef = useRef(scene)
  sceneRef.current = scene

  const [target, setTarget] = useState(0)
  const [caption, setCaption] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const markBuilt = useProgress((s) => s.markBuilt)

  const finished = progress >= duration - 1e-3
  const nextStep = targets.find((t) => t > target + 1e-3)

  const conclude = () => {
    markBuilt(card.meta.id)
    disposeScene(sceneRef.current)
    onDone()
  }

  return (
    <div className="view build-view">
      <header>
        <span className="chip">{card.meta.contexto}</span>
        <h1>{card.meta.fraseFonte}</h1>
        <p className="hint">Assista a cena se montar — ela é a ponte para o sueco.</p>
      </header>

      <div className="canvas-wrap">
        <CardCanvas scene={scene}>
          <BuildPlayer
            scene={scene}
            target={target}
            onCaption={setCaption}
            onTime={(t) => setProgress(t)}
          />
        </CardCanvas>
        {caption && <div className="caption">{caption}</div>}
        <div className="progress-bar">
          <div style={{ width: `${(progress / duration) * 100}%` }} />
        </div>
      </div>

      {!finished ? (
        <div className="controls">
          <button className="primary" onClick={() => setTarget(duration)}>
            ▶ Montar tudo
          </button>
          {nextStep !== undefined && (
            <button onClick={() => setTarget(nextStep)}>Próximo passo →</button>
          )}
        </div>
      ) : (
        <div className="reveal">
          <div className="answer">
            <span className="sv">{card.meta.fraseAlvo}</span>
            <span className="pron">🗣 {card.meta.pronuncia}</span>
            <span className="bridge">🔊 {card.meta.ponteSonora}</span>
          </div>
          <p className="story">{card.meta.historia}</p>
          <button className="primary" onClick={conclude}>
            Gravei a cena — concluir ✓
          </button>
        </div>
      )}
    </div>
  )
}
