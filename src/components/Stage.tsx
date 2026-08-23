import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RectAreaLightUniformsLib, RoomEnvironment } from 'three-stdlib'
import { rng } from '../rig/helpers'

/*
 * Palco atmosférico compartilhado. Técnicas adaptadas das cenas MIT do
 * MengTo/threeui (landscape, bookshelf, temple-night):
 * céu-gradiente com pico de brilho NA banda do horizonte, fog casado com a
 * cor do horizonte para dissolver a junção chão/fundo, estrelas em três
 * classes de tamanho, poeira estática seeded e RoomEnvironment calibrado.
 */

/** Cor de encontro céu/chão — também é a cor do FogExp2 e a família do piso. */
export const HORIZON = '#253243'

/** Domo de céu: gradiente vertical em CanvasTexture, BackSide, imune ao fog. */
export function SkyDome() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, 0, 512)
    grad.addColorStop(0, '#0a0f1c')
    grad.addColorStop(0.28, '#101a2c')
    grad.addColorStop(0.46, '#16223a')
    grad.addColorStop(0.6, '#1d2f47')
    grad.addColorStop(0.74, '#33506b') // banda do horizonte: o ponto mais claro
    grad.addColorStop(0.88, HORIZON)
    grad.addColorStop(1, '#10161f')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 8, 512)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  return (
    <mesh renderOrder={-20}>
      <sphereGeometry args={[80, 32, 24]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  )
}

/** Estrelas em 3 classes de tamanho, só acima do horizonte, aditivas. */
export function StarField() {
  const layers = useMemo(() => {
    const sprite = (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const ctx = c.getContext('2d')!
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.25, 'rgba(255,255,255,0.85)')
      g.addColorStop(0.55, 'rgba(255,255,255,0.18)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(c)
    })()

    const rand = rng(4711)
    const makeLayer = (count: number, size: number) => {
      const pos = new Float32Array(count * 3)
      const col = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        // esfera r=70, só elevação > ~5° acima do horizonte
        const az = rand() * Math.PI * 2
        const el = 0.09 + rand() * (Math.PI / 2 - 0.12)
        pos[i * 3] = Math.cos(el) * Math.cos(az) * 70
        pos[i * 3 + 1] = Math.sin(el) * 70
        pos[i * 3 + 2] = Math.cos(el) * Math.sin(az) * 70
        const b = 0.46 + Math.pow(rand(), 1.7) * 0.54
        const t = rand()
        const tint: [number, number, number] =
          t < 0.13 ? [0.74, 0.84, 1] : t < 0.25 ? [1, 0.87, 0.7] : [0.97, 0.97, 0.93]
        col[i * 3] = tint[0] * b
        col[i * 3 + 1] = tint[1] * b
        col[i * 3 + 2] = tint[2] * b
      }
      return { pos, col, size, count }
    }
    return { sprite, layers: [makeLayer(520, 1.6), makeLayer(140, 2.6), makeLayer(40, 4)] }
  }, [])

  return (
    <group renderOrder={-15}>
      {layers.layers.map((l, i) => (
        <points key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[l.pos, 3]} />
            <bufferAttribute attach="attributes-color" args={[l.col, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={layers.sprite}
            size={l.size}
            vertexColors
            transparent
            opacity={0.8}
            depthWrite={false}
            fog={false}
            sizeAttenuation={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </group>
  )
}

/** Poeira estática no ar do diorama — seeded, custo zero por frame. */
export function DustMotes() {
  const pos = useMemo(() => {
    const rand = rng(20260821)
    const p = new Float32Array(90 * 3)
    for (let i = 0; i < 90; i++) {
      p[i * 3] = (rand() - 0.5) * 10
      p[i * 3 + 1] = 0.4 + rand() * 3.6
      p[i * 3 + 2] = (rand() - 0.5) * 8
    }
    return p
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#cbd4e0"
        size={0.02}
        transparent
        opacity={0.28}
        depthWrite={false}
      />
    </points>
  )
}

/** RoomEnvironment em PMREM: resposta especular sem HDR externo. */
export function StudioEnv() {
  const { gl, scene } = useThree()
  useEffect(() => {
    RectAreaLightUniformsLib.init()
    const pmrem = new THREE.PMREMGenerator(gl)
    const target = pmrem.fromScene(RoomEnvironment(), 0.04)
    scene.environment = target.texture
    scene.environmentIntensity = 0.72
    pmrem.dispose()
    return () => {
      scene.environment = null
      target.dispose()
    }
  }, [gl, scene])
  return null
}

/** Softbox coincidente com a key: wrap macio que a directional não dá. */
export function KeySoftbox() {
  const ref = useRef<THREE.RectAreaLight>(null)
  useEffect(() => {
    ref.current?.lookAt(0, 1, 0)
  }, [])
  return (
    <rectAreaLight
      ref={ref}
      color="#ffe8c2"
      intensity={3.2}
      width={4.8}
      height={5.6}
      position={[4, 7, 3.5]}
    />
  )
}
