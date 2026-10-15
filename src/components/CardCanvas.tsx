import { useLayoutEffect, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Effects } from './Effects'
import { DustMotes, HORIZON, KeySoftbox, SkyDome, StarField, StudioEnv } from './Stage'
import type { CardScene } from '../rig/types'
import { BASE_FOV, fitCamera } from '../rig/camera'

/** Reenquadra a câmera quando o canvas muda de proporção (ex.: celular em pé). */
function FitCamera({ position, target }: { position: [number, number, number]; target: [number, number, number] }) {
  const camera = useThree((s) => s.camera)
  const { width, height } = useThree((s) => s.size)
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (!cam.isPerspectiveCamera || !width || !height) return
    fitCamera(cam, position, target, width / height)
  }, [camera, width, height, ...position, ...target])
  return null
}

/**
 * Canvas compartilhado: céu com profundidade, estúdio de iluminação,
 * atmosfera e pós-processamento — o mesmo palco para todas as cartas.
 */
export function CardCanvas({ scene, children }: { scene: CardScene; children?: ReactNode }) {
  const camPos = scene.cameraHint?.position ?? ([4, 3.2, 5.5] as [number, number, number])
  const camTarget = scene.cameraHint?.target ?? ([0, 1, 0] as [number, number, number])
  return (
    <Canvas
      camera={{ position: camPos, fov: BASE_FOV }}
      // VSM: penumbra real — sombra dura é o que mais denuncia render de brinquedo
      shadows="variance"
      dpr={[1, 2]}
      // absoluto dentro do .canvas-wrap: altura 100% falha em janelas altas
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* fog casado com a banda do horizonte: a junção chão/céu dissolve */}
      <fogExp2 attach="fog" args={[HORIZON, 0.03]} />

      <SkyDome />
      <StarField />
      <StudioEnv />

      {/* chave quente (sombras) + softbox coincidente + preenchimento frio + contra-luz */}
      <hemisphereLight args={['#fff4e2', '#3b3226', 0.5]} />
      <directionalLight
        position={[5, 9, 4]}
        intensity={1.9}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        // VSM: bias 0 + normalBias; o desfoque vem de radius/blurSamples
        shadow-bias={0}
        shadow-normalBias={0.02}
        shadow-radius={4}
        shadow-blurSamples={16}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <KeySoftbox />
      <directionalLight position={[-6, 4, -2]} intensity={0.45} color="#7fa8d9" />
      <directionalLight position={[0, 5, -7]} intensity={0.85} color="#cfe0ff" />

      {/* palco: disco na família do fog + sombra de contato macia */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#222c3a" roughness={0.95} />
      </mesh>
      <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={12} blur={2.4} far={4} resolution={512} />

      <FitCamera position={camPos} target={camTarget} />
      <DustMotes />
      {children}

      <Effects />

      {/* maxPolarAngle acima do horizonte: peças "subterrâneas" nunca aparecem antes da hora */}
      <OrbitControls
        target={camTarget}
        enablePan={false}
        minDistance={2.5}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2 - 0.08}
      />
    </Canvas>
  )
}
