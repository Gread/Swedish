import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Effects } from './Effects'
import type { CardScene } from '../rig/types'

/**
 * Canvas compartilhado: estúdio de iluminação, pedestal, fundo com
 * profundidade e pós-processamento — o mesmo palco para todas as cartas.
 */
export function CardCanvas({ scene, children }: { scene: CardScene; children?: ReactNode }) {
  const camPos = scene.cameraHint?.position ?? [4, 3.2, 5.5]
  const camTarget = scene.cameraHint?.target ?? [0, 1, 0]
  return (
    <Canvas camera={{ position: camPos, fov: 38 }} shadows dpr={[1, 2]}>
      <color attach="background" args={['#151b26']} />
      <fog attach="fog" args={['#151b26', 12, 26]} />

      {/* chave quente + preenchimento frio + contra-luz, estilo estúdio */}
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[5, 9, 4]}
        intensity={2.2}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-6, 4, -2]} intensity={0.5} color="#7fa8d9" />
      <directionalLight position={[0, 5, -7]} intensity={0.9} color="#cfe0ff" />

      {/* reflexos de estúdio sem depender de HDR externo */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={1.2} position={[0, 5, -9]} scale={[10, 10, 1]} color="#dfe9f5" />
        <Lightformer intensity={0.8} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#ffe9c9" />
        <Lightformer intensity={0.6} position={[5, 2, 0]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#bcd4f0" />
      </Environment>

      {/* palco: disco amplo + sombra de contato macia */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#232b38" roughness={0.95} />
      </mesh>
      <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={12} blur={2.4} far={4} resolution={512} />

      {children}

      <Effects />

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
