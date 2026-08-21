import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { CardScene } from '../rig/types'
import { poseAt, sceneDuration, setSceneOpacity } from '../rig/pose'

/** Cena congelada na pose final, com fade suave até a opacidade-alvo do nível atual. */
export function ReviewScene({ scene, opacity }: { scene: CardScene; opacity: number }) {
  const current = useRef(opacity)
  const duration = useMemo(() => sceneDuration(scene), [scene])

  useEffect(() => {
    poseAt(scene, duration)
    setSceneOpacity(scene, current.current)
  }, [scene, duration])

  useFrame((_, dt) => {
    if (Math.abs(current.current - opacity) < 0.002) return
    const k = 1 - Math.exp(-dt * 4)
    current.current += (opacity - current.current) * k
    setSceneOpacity(scene, current.current)
  })

  return <primitive object={scene.root} />
}
