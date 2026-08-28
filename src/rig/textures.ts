import * as THREE from 'three'
import { rng } from './rand'

/*
 * Mapas de superfície procedurais compartilhados.
 *
 * O que separava as cenas de "plástico de brinquedo" para "objeto real" não era
 * a geometria: era a ausência de qualquer variação de microssuperfície. Toda
 * superfície real tem grão, desgaste e brilho irregular. Aqui geramos UMA vez
 * um normal map fino e um roughness map manchado, ambos sem emenda (ruído
 * periódico), e todo material do app os recebe.
 */

/** Ruído de valor periódico: a grade dá a volta, então a textura não tem emenda. */
function periodicNoise(gridSize: number, rand: () => number) {
  const g = new Float32Array(gridSize * gridSize)
  for (let i = 0; i < g.length; i++) g[i] = rand()
  const wrap = (n: number) => ((n % gridSize) + gridSize) % gridSize
  return (u: number, v: number) => {
    const x = u * gridSize
    const y = v * gridSize
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const fx = x - x0
    const fy = y - y0
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const j0 = wrap(x0)
    const j1 = wrap(x0 + 1)
    const i0 = wrap(y0)
    const i1 = wrap(y0 + 1)
    const a = g[i0 * gridSize + j0]
    const b = g[i0 * gridSize + j1]
    const c = g[i1 * gridSize + j0]
    const d = g[i1 * gridSize + j1]
    return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy
  }
}

/** fBm periódico somando oitavas cujas grades também dão a volta. */
function periodicFbm(seed: number, octaves: { grid: number; gain: number }[]) {
  const rand = rng(seed)
  const layers = octaves.map((o) => ({ noise: periodicNoise(o.grid, rand), gain: o.gain }))
  const total = layers.reduce((s, l) => s + l.gain, 0)
  return (u: number, v: number) => {
    let sum = 0
    for (const l of layers) sum += l.noise(u, v) * l.gain
    return sum / total
  }
}

const SIZE = 256

/** Campo de altura fino: grão de superfície, não relevo de forma. */
function heightField(): Float32Array {
  const fbm = periodicFbm(90210, [
    { grid: 8, gain: 0.5 },
    { grid: 16, gain: 0.3 },
    { grid: 32, gain: 0.14 },
    { grid: 64, gain: 0.06 },
  ])
  const h = new Float32Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      h[y * SIZE + x] = fbm(x / SIZE, y / SIZE)
    }
  }
  return h
}

/** Normal map por Sobel sobre o campo de altura (dados lineares, sem sRGB). */
function buildNormalMap(strength = 2.4): THREE.CanvasTexture {
  const h = heightField()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(SIZE, SIZE)
  const at = (x: number, y: number) => h[(((y % SIZE) + SIZE) % SIZE) * SIZE + (((x % SIZE) + SIZE) % SIZE)]

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1))
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1))
      const len = Math.hypot(dx * strength, dy * strength, 1)
      const nx = (dx * strength) / len
      const ny = (dy * strength) / len
      const nz = 1 / len
      const i = (y * SIZE + x) * 4
      img.data[i] = (nx * 0.5 + 0.5) * 255
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.NoColorSpace
  tex.anisotropy = 4
  return tex
}

/**
 * Manchas de rugosidade: o brilho nunca é uniforme numa superfície real.
 * O roughnessMap MULTIPLICA a rugosidade base, então centramos perto de 1
 * (0.72–1.0) para variar sem transformar o material.
 */
function buildRoughnessMap(): THREE.CanvasTexture {
  const fbm = periodicFbm(1337, [
    { grid: 4, gain: 0.55 },
    { grid: 8, gain: 0.28 },
    { grid: 24, gain: 0.17 },
  ])
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(SIZE, SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const v = 0.72 + fbm(x / SIZE, y / SIZE) * 0.28
      const c = v * 255
      const i = (y * SIZE + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = c
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.NoColorSpace
  return tex
}

/**
 * Escada de densidades. O UV de uma primitiva vai de 0 a 1 seja ela um botão
 * ou um piso inteiro, então uma densidade fixa faz manchas gigantes nas peças
 * grandes. Cada peça escolhe o degrau pelo seu tamanho real, e o conjunto
 * fechado mantém o número de texturas na GPU baixo.
 */
const LADDER: number[] = [4, 8, 16, 32]

let base: { normal: THREE.CanvasTexture; roughness: THREE.CanvasTexture } | null = null
const variants = new Map<number, { normalMap: THREE.Texture; roughnessMap: THREE.Texture }>()

function snap(repeat: number) {
  let best = LADDER[0]
  for (const step of LADDER) {
    if (Math.abs(step - repeat) < Math.abs(best - repeat)) best = step
  }
  return best
}

/**
 * Mapas de detalhe para um material. `size` é a dimensão característica da
 * peça em unidades de cena; a densidade do grão é derivada dela.
 */
export function surfaceDetail(size = 1) {
  if (!base) base = { normal: buildNormalMap(), roughness: buildRoughnessMap() }
  const repeat = snap(Math.max(0.2, size) * 8)
  const hit = variants.get(repeat)
  if (hit) return hit

  const normalMap = base.normal.clone()
  const roughnessMap = base.roughness.clone()
  for (const t of [normalMap, roughnessMap]) {
    t.repeat.set(repeat, repeat)
    t.needsUpdate = true
  }
  const made = { normalMap, roughnessMap }
  variants.set(repeat, made)
  return made
}
