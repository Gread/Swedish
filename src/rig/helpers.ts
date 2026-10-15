import * as THREE from 'three'
import { GLTFLoader, RoundedBoxGeometry } from 'three-stdlib'
import type { Channel, ChannelTarget, Ease, Sequence } from './types'
import { surfaceDetail } from './textures'
import { rng } from './rand'

export { rng }

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

export interface MatOpts {
  roughness?: number
  metalness?: number
  emissive?: string | number
  emissiveIntensity?: number
  flat?: boolean
  /** multiplicador do relevo fino de superfície; 0 desliga */
  detail?: number
  /** dimensão característica da peça, em unidades de cena (calibra o grão) */
  size?: number
}

/**
 * Material padrão do app. Além da cor, dá a toda superfície a variação de
 * microrrelevo e de brilho que separa "plástico de brinquedo" de objeto real,
 * e infere a resposta física a partir dos números que a carta já declara:
 * metal ganha verniz, superfície muito fosca ganha sheen (tecido/terra).
 */
export function mat(color: string | number, opts: MatOpts = {}) {
  const roughness = opts.roughness ?? 0.55
  const metalness = opts.metalness ?? 0.05
  const isMetal = metalness >= 0.5
  const isSoft = !isMetal && roughness >= 0.85

  const params = {
    color,
    roughness,
    metalness,
    flatShading: opts.flat ?? false,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? (opts.emissive ? 0.6 : 0),
  }

  const material = isMetal
    ? Object.assign(new THREE.MeshPhysicalMaterial(params), {
        clearcoat: 0.18,
        clearcoatRoughness: 0.25,
      })
    : isSoft
      ? Object.assign(new THREE.MeshPhysicalMaterial(params), {
          sheen: 0.3,
          sheenRoughness: 0.8,
          sheenColor: new THREE.Color(color),
        })
      : new THREE.MeshStandardMaterial(params)

  // Emissores são luz, não superfície: grão neles lê como sujeira.
  const strength = opts.detail ?? 1
  if (!opts.emissive && strength > 0) {
    const { normalMap, roughnessMap } = surfaceDetail(opts.size)
    material.roughnessMap = roughnessMap
    // flatShading é escolha de estilo (rochas): relevo fino brigaria com ela
    if (!opts.flat) {
      // relevo proporcional à rugosidade: o que é polido é liso, o que é
      // fosco tem grão — sem isso o plástico brilhante vira arenito
      const scale = (isMetal ? 0.25 : 0.32) * roughness * strength
      material.normalMap = normalMap
      material.normalScale = new THREE.Vector2(scale, scale)
    }
  }

  return material
}

function shaded<T extends THREE.Mesh>(mesh: T): T {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/**
 * Cada primitiva informa sua dimensão característica ao material, para o grão
 * de superfície ter a mesma escala física num botão e num piso.
 * Também aceita número no lugar de opts (assinatura antiga: segments posicional).
 */
function sized(opts: MatOpts | number | undefined, size: number): MatOpts {
  const o = typeof opts === 'number' || !opts ? {} : opts
  return { ...o, size: o.size ?? size }
}

export function box(w: number, h: number, d: number, color: string | number, opts?: MatOpts) {
  return shaded(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, sized(opts, Math.max(w, h, d)))))
}

/** Caixa de cantos arredondados — use no lugar de box para quase tudo. */
export function rbox(w: number, h: number, d: number, radius: number, color: string | number, opts?: MatOpts) {
  const r = Math.min(radius, w / 2, h / 2, d / 2)
  return shaded(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat(color, sized(opts, Math.max(w, h, d)))))
}

export function cylinder(rTop: number, rBottom: number, h: number, color: string | number, opts?: MatOpts | number, segments = 32) {
  const size = Math.max(rTop * 2, rBottom * 2, h)
  return shaded(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat(color, sized(opts, size))))
}

export function sphere(r: number, color: string | number, opts?: MatOpts | number, segments = 32) {
  return shaded(new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), mat(color, sized(opts, r * 2))))
}

/** Cápsula — corpos, braços, pernas, dedos: quase tudo orgânico é cápsula. */
export function capsule(r: number, length: number, color: string | number, opts?: MatOpts) {
  return shaded(new THREE.Mesh(new THREE.CapsuleGeometry(r, length, 8, 24), mat(color, sized(opts, length + r * 2))))
}

export function cone(r: number, h: number, color: string | number, opts?: MatOpts | number, segments = 32) {
  return shaded(new THREE.Mesh(new THREE.ConeGeometry(r, h, segments), mat(color, sized(opts, Math.max(r * 2, h)))))
}

export function torus(r: number, tube: number, color: string | number, opts?: MatOpts) {
  return shaded(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 20, 48), mat(color, sized(opts, r * 2))))
}

/**
 * Sólido de revolução a partir do perfil [[raio, y], ...] (de baixo para cima).
 * Garrafas, xícaras, vasos, troncos, chapéus, cúpulas.
 */
export function lathe(profile: [number, number][], color: string | number, opts?: MatOpts, segments = 40) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y))
  const ys = profile.map(([, y]) => y)
  const size = Math.max(
    ...profile.map(([r]) => r * 2),
    Math.max(...ys) - Math.min(...ys),
  )
  return shaded(new THREE.Mesh(new THREE.LatheGeometry(pts, segments), mat(color, sized(opts, size))))
}

/** Rocha low-poly: icosaedro com vértices deslocados por ruído semeado. */
export function rock(radius: number, color: string | number, seed = 1, opts?: MatOpts) {
  const geo = new THREE.IcosahedronGeometry(radius, 1)
  const rand = rng(seed)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  // A geometria não é indexada: cada canto de face é um vértice próprio. O
  // deslocamento é sorteado por POSIÇÃO (não por vértice), senão os cantos
  // que coincidem se separam e a rocha vira cacos com frestas de luz.
  const offsets = new Map<string, number>()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
    let k = offsets.get(key)
    if (k === undefined) offsets.set(key, (k = 1 + (rand() - 0.5) * 0.45))
    v.multiplyScalar(k)
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

/*
 * Peças-base esculpidas no Blender (tools/blender/bases.py → public/assets/
 * bases.glb): cabeça com nariz/orelhas/órbitas, corpo com ombros e pés, braço
 * afunilado com punho de manga, mão-luva com polegar. Autoradas para um
 * personagem de altura 1 nas MESMAS dimensões das primitivas que substituem,
 * então person() troca só a geometria — hierarquia, nomes e posições ficam
 * idênticos e os adereços das cartas continuam encaixando.
 */
let bases: Record<string, THREE.BufferGeometry> | null = null

/** Carrega as peças-base. Chamado uma vez antes de montar qualquer cena. */
export async function loadBases(url = '/assets/bases.glb') {
  try {
    const gltf = await new GLTFLoader().loadAsync(url)
    const found: Record<string, THREE.BufferGeometry> = {}
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && m.name.startsWith('base_')) found[m.name] = m.geometry
    })
    bases = found
  } catch {
    bases = null // sem as peças-base, person() segue com as primitivas
  }
}

/** Troca a geometria do mesh pela peça-base escalada, se ela existir. */
function useBase(mesh: THREE.Mesh, name: string, scale: number) {
  const g = bases?.[name]
  if (!g) return
  mesh.geometry.dispose()
  mesh.geometry = g.clone().scale(scale, scale, scale)
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
  useBase(bodyMesh, 'base_body', height)
  bodyMesh.name = 'body'
  bodyMesh.position.y = bodyH / 2
  g.add(bodyMesh)

  const head = new THREE.Group()
  head.name = 'head'
  head.position.y = bodyH + headR * 0.85
  const skull = sphere(headR, skin)
  useBase(skull, 'base_head', height)
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
    useBase(arm, 'base_arm', height)
    arm.name = side < 0 ? 'armL' : 'armR'
    arm.position.set(side * bodyR * 1.15, bodyH * 0.62, 0)
    arm.rotation.z = -side * armAngle
    const hand = sphere(bodyR * 0.4, skin)
    useBase(hand, 'base_hand', height)
    hand.position.y = -bodyH * 0.32
    arm.add(hand)
    g.add(arm)
  }
  return g
}

/**
 * Os braços de person() giram pelo MEIO (a mão fica a ~0.19·h abaixo do pivô
 * e o topo do braço, acima). Para levantar/estender um braço de verdade —
 * acenar, apontar, erguer algo acima da cabeça — chame isto antes de girar:
 * o pivô passa para o OMBRO, a pose de repouso não muda e `rotation` passa a
 * girar o braço inteiro em torno do ombro.
 *   const braco = p.getObjectByName('armL')!; shoulderPivot(braco, 1.5)
 */
export function shoulderPivot(arm: THREE.Object3D, height = 1.5) {
  const d = 0.19 * height
  const m = arm as THREE.Mesh
  m.geometry = m.geometry.clone().translate(0, -d, 0)
  m.position.y += d
  for (const c of m.children) c.position.y -= d
}
