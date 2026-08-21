import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { CardScene } from '../rig/types'
import { captionAt, poseAt, sceneDuration } from '../rig/pose'

interface BuildPlayerProps {
  scene: CardScene
  /** Instante-alvo (s): o player anima até ele e pausa. */
  target: number
  speed?: number
  onCaption?: (caption: string | null) => void
  onTime?: (t: number, duration: number) => void
}

/** Vive dentro do Canvas: avança o relógio da montagem até `target` e posa as peças. */
export function BuildPlayer({ scene, target, speed = 1, onCaption, onTime }: BuildPlayerProps) {
  const time = useRef(0)
  const lastCaption = useRef<string | null>(null)
  const duration = useMemo(() => sceneDuration(scene), [scene])

  useEffect(() => {
    time.current = 0
    lastCaption.current = null
    poseAt(scene, 0)
  }, [scene])

  useFrame((_, dt) => {
    if (time.current < target) {
      time.current = Math.min(target, duration, time.current + dt * speed)
      poseAt(scene, time.current)
      onTime?.(time.current, duration)
      const caption = captionAt(scene, time.current)
      if (caption !== lastCaption.current) {
        lastCaption.current = caption
        onCaption?.(caption)
      }
    }
  })

  return <primitive object={scene.root} />
}
