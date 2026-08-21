import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { CardScene } from '../rig/types'

/** Canvas compartilhado: luzes, chão e câmera iguais em construção e revisão. */
export function CardCanvas({ scene, children }: { scene: CardScene; children?: ReactNode }) {
  const camPos = scene.cameraHint?.position ?? [4, 3.2, 5.5]
  const camTarget = scene.cameraHint?.target ?? [0, 1, 0]
  return (
    <Canvas camera={{ position: camPos, fov: 42 }} shadows dpr={[1, 2]}>
      <color attach="background" args={['#101418']} />
      <hemisphereLight args={['#cfe8ff', '#3a2f28', 0.9]} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#1b2129" roughness={1} />
      </mesh>
      {children}
      {/* maxPolarAngle acima do horizonte: peças "subterrâneas" nunca aparecem antes da hora */}
      <OrbitControls
        target={camTarget}
        enablePan={false}
        minDistance={2.5}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2 - 0.08}
      />
    </Canvas>
  )
}
