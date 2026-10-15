import { useMemo } from 'react'
import type { Card } from '../rig/types'
import { CardCanvas } from '../components/CardCanvas'
import { ReviewScene } from '../components/ReviewScene'
import { useCardScene } from '../rig/useCardScene'
import { ExportBlockout, RenderReview } from './DevTools'

export function PoseDebug({ card, raw }: { card: Card; raw: boolean }) {
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

export type DevKind = 'pose' | 'export' | 'render'

/** Rotas de inspeção de cartas específicas, sem carregar o baralho inteiro. */
export function DevRoute({ kind, cards, raw }: { kind: DevKind; cards: Card[]; raw: boolean }) {
  if (kind === 'pose') return cards[0] ? <PoseDebug card={cards[0]} raw={raw} /> : null
  if (kind === 'export') return <ExportBlockout cards={cards} />
  return <RenderReview cards={cards} raw={raw} />
}
