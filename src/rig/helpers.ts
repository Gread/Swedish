import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'
import type { Channel, ChannelTarget, Ease, Sequence } from './types'

export function ch(target: ChannelTarget, from: number, to: number): Channel {
  return { target, from, to }
}

export function seq(
  name: string,
  part: string,
  at: number,
  dur: number,
  channels: Channel[],
  extra?: { ease?: Ease; caption?: string },
): Sequence {
  return { name, part, at, dur, channels, ...extra }
}

/** Sobe do subsolo até y final — o movimento padrão de "brotar do chão". */
export function riseFrom(finalY: number, depth = 1.2): Channel {
  return ch('position.y', finalY - depth, finalY)
}

/** PRNG determinístico — cenas idênticas em toda montagem/revisão. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface MatOpts {
  roughness?: number
  metalness?: number
  emissive?: string | number
  emissiveIntensity?: number
  flat?: boolean
}

export function mat(color: string | number, opts: MatOpts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.05,
    flatShading: opts.flat ?? false,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? (opts.emissive ? 0.6 : 0),
  })
}

function shaded<T extends THREE.Mesh>(mesh: T): T {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function box(w: number, h: number, d: number, color: string | number, opts?: MatOpts) {
  return shaded(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts)))
}

/** Caixa de cantos arredondados — use no lugar de box para quase tudo. */
export function rbox(w: number, h: number, d: number, radius: number, color: string | number, opts?: MatOpts) {
  const r = Math.min(radius, w / 2, h / 2, d / 2)
  return shaded(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat(color, opts)))
}

/** aceita número no lugar de opts (assinatura antiga: segments posicional) */
function normOpts(opts?: MatOpts | number): MatOpts | undefined {
  return typeof opts === 'number' ? undefined : opts
}

export function cylinder(rTop: number, rBottom: number, h: number, color: string | number, opts?: MatOpts | number, segments = 32) {
  return shaded(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat(color, normOpts(opts))))
}

export function sphere(r: number, color: string | number, opts?: MatOpts | number, segments = 32) {
  return shaded(new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), mat(color, normOpts(opts))))
}

/** Cápsula — corpos, braços, pernas, dedos: quase tudo orgânico é cápsula. */
export function capsule(r: number, length: number, color: string | number, opts?: MatOpts) {
  return shaded(new THREE.Mesh(new THREE.CapsuleGeometry(r, length, 8, 24), mat(color, opts)))
}

export function cone(r: number, h: number, color: string | number, opts?: MatOpts | number, segments = 32) {
  return shaded(new THREE.Mesh(new THREE.ConeGeometry(r, h, segments), mat(color, normOpts(opts))))
}

export function torus(r: number, tube: number, color: string | number, opts?: MatOpts) {
  return shaded(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 20, 48), mat(color, opts)))
}

/**
 * Sólido de revolução a partir do perfil [[raio, y], ...] (de baixo para cima).
 * Garrafas, xícaras, vasos, troncos, chapéus, cúpulas.
 */
export function lathe(profile: [number, number][], color: string | number, opts?: MatOpts, segments = 40) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y))
  return shaded(new THREE.Mesh(new THREE.LatheGeometry(pts, segments), mat(color, opts)))
}

/** Rocha low-poly: icosaedro com vértices deslocados por ruído semeado. */
export function rock(radius: number, color: string | number, seed = 1, opts?: MatOpts) {
  const geo = new THREE.IcosahedronGeometry(radius, 1)
  const rand = rng(seed)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    v.multiplyScalar(1 + (rand() - 0.5) * 0.45)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return shaded(new THREE.Mesh(geo, mat(color, { flat: true, ...opts })))
}

/** Aglomerado de esferas: arbustos, copas, nuvens, cabelos, fumaça congelada. */
export function puff(radius: number, color: string | number, lumps = 6, seed = 1, opts?: MatOpts) {
  const group = new THREE.Group()
  const rand = rng(seed)
  group.add(sphere(radius, color, opts))
  for (let i = 0; i < lumps; i++) {
    const s = sphere(radius * (0.45 + rand() * 0.35), color, opts)
    const a = rand() * Math.PI * 2
    const b = (rand() - 0.5) * Math.PI * 0.8
    s.position.set(
      Math.cos(a) * Math.cos(b) * radius * 0.75,
      Math.sin(b) * radius * 0.6,
      Math.sin(a) * Math.cos(b) * radius * 0.75,
    )
    group.add(s)
  }
  return group
}

export interface PersonOpts {
  body: string | number
  skin: string | number
  /** altura total aproximada (default 1.5) */
  height?: number
  /** ângulo dos braços em radianos a partir do corpo (default levemente abertos) */
  armAngle?: number
}

/**
 * Personagem padrão: corpo-cápsula, cabeça com olhos (esclera+pupila+brilho),
 * braços-cápsula. Retorna o Group; filhos acessíveis por nome:
 * body, head, armL, armR (para pendurar adereços/chapéus na cabeça etc).
 */
export function person({ body, skin, height = 1.5, armAngle = 0.5 }: PersonOpts) {
  const g = new THREE.Group()
  const bodyH = height * 0.52
  const bodyR = height * 0.17
  const headR = height * 0.19

  const bodyMesh = capsule(bodyR, bodyH - bodyR * 2, body)
  bodyMesh.name = 'body'
  bodyMesh.position.y = bodyH / 2
  g.add(bodyMesh)

  const head = new THREE.Group()
  head.name = 'head'
  head.position.y = bodyH + headR * 0.85
  const skull = sphere(headR, skin)
  head.add(skull)
  for (const side of [-1, 1]) {
    const eye = sphere(headR * 0.22, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * headR * 0.38, headR * 0.12, headR * 0.82)
    eye.scale.z = 0.6
    const pupil = sphere(headR * 0.1, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * headR * 0.38, headR * 0.12, headR * 0.97)
    head.add(eye, pupil)
  }
  g.add(head)

  for (const side of [-1, 1]) {
    const arm = capsule(bodyR * 0.38, bodyH * 0.5, body)
    arm.name = side < 0 ? 'armL' : 'armR'
    arm.position.set(side * bodyR * 1.15, bodyH * 0.62, 0)
    arm.rotation.z = -side * armAngle
    const hand = sphere(bodyR * 0.4, skin)
    hand.position.y = -bodyH * 0.32
    arm.add(hand)
    g.add(arm)
  }
  return g
}
