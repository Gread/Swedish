import { useEffect, useMemo, useState } from 'react'
import type { Card } from './types'
import { applyRefined } from './refined'

/**
 * Cria a cena da carta e aplica os modelos refinados do Blender, se houver.
 * `ready` só fica verdadeiro depois da troca, para a cena nunca aparecer
 * primeiro com as primitivas e depois "pular" para o modelo refinado.
 */
export function useCardScene(card: Card) {
  const scene = useMemo(() => card.createScene(), [card])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    setReady(false)
    applyRefined(card.meta.id, scene).finally(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [card, scene])

  return { scene, ready }
}
