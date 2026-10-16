import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock,
} from '../rig/helpers'

/**
 * "Jaså?" — iá, SÔ?
 *
 * O mineiro tirou a senha 4817 no posto de saúde e esperou tanto que virou
 * esqueleto: chapéu de palha torto, pão de queijo de pedra na mão, teia entre
 * as costelas. O painel enfim acende o número dele, a enfermeira diz que os
 * ossos estão perfeitos — e a caveira inclina, desconfiada: iá, SÔ? Só DEPOIS
 * do SÔ a mandíbula despenca no colo.
 *
 * Diorama: piso de linóleo verde-água, fileira de três cadeiras laranja numa
 * barra cinza, planta murcha no canto, painel de senhas num poste à direita.
 * Acento saturado RESERVADO ao número vermelho aceso no painel.
 */

const UNDER = '#3d5953'
const LINO = '#86bdae' // linóleo verde-água
const LINO_LINE = '#a9d5c8'
const CHAIR = '#d0783a' // plástico laranja (fosco, sem brigar com o acento)
const CHAIR_DARK = '#a95c2a'
const METAL = '#8d959c'
const METAL_DARK = '#4a5057'
const RUBBER = '#2a2d31'
const BONE = '#ece2c8' // marfim
const TOOTH = '#f7f2e3'
const HOLLOW = '#1d1916' // órbitas e nariz
const STRAW = '#ead58f'
const STRAW_DARK = '#cdb466'
const BAND = '#5b3b25'
const STONE = '#8e8b85' // pão de queijo petrificado
const STONE_DARK = '#5f5c58'
const WEB = '#f6f5f0'
const PAPER = '#f3efe4'
const INK = '#3a3a3a'
const PANEL = '#23262a'
const BEZEL = '#0d0e10'
const LED_OFF = '#261212'
const LED = '#e0140c'
const LED_GLOW = '#ff0d05' // ÚNICO acento saturado: a senha acesa
const POT = '#ddd6c8'
const SOIL = '#4a3a2c'
const STEM = '#8b8440'
const LEAF = '#c9b54f'
const LEAF_DRY = '#a88a3c'
const LEAF_DEAD = '#8a6a35'

const GY = 0.16 // topo do linóleo
const SEAT = GY + 0.46 // tampo do assento das cadeiras
const SK_Z = 0.02 // esqueleto um tiquinho à frente do encosto

// caveira: pivô no topo do pescoço (coordenadas locais do esqueleto)
const NECK = new THREE.Vector3(0, 0.775, -0.055)
const TILT = new THREE.Euler(-0.22, 0.58, 0.42) // virada pro painel e tombada: desconfiada
const SKULL = 1.2 // caveira (e mandíbula) maiores: cabeção de desenho, lê de longe
// mandíbula presa: centro do arco em relação ao pivô da caveira
const JAW_OFF = new THREE.Vector3(0, -0.03, 0.065)
// mandíbula no colo (pose final), apoiada nos dois fêmures
const JAW_LAP = new THREE.Vector3(-0.01, 0.122, 0.25)
const JAW_LAP_ROT = new THREE.Euler(0.8, 0.12, -0.06) // dentes virados pra câmera

const HAT_Y = 0.22
const HAT_RX = -0.12
const HAT_RZ = 0.24

const PANEL_POS = new THREE.Vector3(1.32, 0, -0.32)
const BOX_Y = 1.68

const TICKET_HAND = new THREE.Vector3(0.17, SEAT + 0.16, SK_Z + 0.38)
const TICKET_FLOOR = new THREE.Vector3(0.34, GY + 0.004, 0.7)

const UP = new THREE.Vector3(0, 1, 0)
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Osso: cápsula ligando dois pontos. */
function bone(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string = BONE) {
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const m = capsule(r, Math.max(len - r * 0.6, 0.002), color, { roughness: 0.5 })
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Fio de teia: cilindro finíssimo entre dois pontos. */
function strand(a: THREE.Vector3, b: THREE.Vector3, r = 0.0055) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = cylinder(r, r, d.length(), WEB, { roughness: 0.4, detail: 0 }, 6)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  m.castShadow = false
  return m
}

/** Costela: anel elíptico de tubo (horizontal, centro na origem). */
function rib(rx: number, rz: number, tube: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    pts.push(v(Math.sin(a) * rx, 0, Math.cos(a) * rz))
  }
  const curve = new THREE.CatmullRomCurve3(pts, true)
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 72, tube, 8, true),
    mat(BONE, { roughness: 0.5, size: rx * 2 }),
  )
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/**
 * Teia de aranha no plano xy (virada para +z): raios irregulares saindo do
 * centro e voltas poligonais ligando os raios. `from`/`to` limitam o leque
 * (teia de canto usa só um quarto de volta).
 */
function web(radius: number, spokes: number, seed: number, from = 0, to = Math.PI * 2, center = true) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const full = to - from >= Math.PI * 2 - 1e-6
  const ends: THREE.Vector3[] = []
  const n = full ? spokes : spokes - 1
  for (let i = 0; i < spokes; i++) {
    const a = from + ((to - from) * i) / n + (full ? (rand() - 0.5) * 0.25 : 0)
    const r = radius * (0.85 + rand() * 0.25)
    ends.push(v(Math.cos(a) * r, Math.sin(a) * r, 0))
  }
  const hub = v(0, 0, 0)
  for (const e of ends) g.add(strand(hub, e))
  for (const f of [0.32, 0.55, 0.78, 0.97]) {
    const ring = ends.map((e) => e.clone().multiplyScalar(f * (0.94 + rand() * 0.1)))
    const count = full ? ring.length : ring.length - 1
    for (let i = 0; i < count; i++) g.add(strand(ring[i], ring[(i + 1) % ring.length], 0.0045))
  }
  if (center) {
    const knot = sphere(0.012, WEB, { roughness: 0.4, detail: 0 }, 10)
    knot.castShadow = false
    g.add(knot)
  }
  return g
}

/** Dígito de sete segmentos: acesos em vermelho, apagados em vinho escuro. */
const SEGMENTS: Record<string, string> = { '4': 'bcfg', '8': 'abcdefg', '1': 'bc', '7': 'abc' }
function digit(d: string) {
  const g = new THREE.Group()
  const H = 0.19
  const W = 0.1
  const T = 0.028
  const lit = mat(LED, { emissive: LED_GLOW, emissiveIntensity: 0.6, roughness: 0.4 })
  const off = mat(LED_OFF, { roughness: 0.6, detail: 0 })
  const layout: Record<string, [number, number, boolean]> = {
    a: [0, H / 2, true],
    g: [0, 0, true],
    d: [0, -H / 2, true],
    f: [-W / 2, H / 4, false],
    b: [W / 2, H / 4, false],
    e: [-W / 2, -H / 4, false],
    c: [W / 2, -H / 4, false],
  }
  for (const [name, [x, y, horiz]] of Object.entries(layout)) {
    const on = SEGMENTS[d].includes(name)
    const geo = horiz
      ? new THREE.BoxGeometry(W - T * 0.5, T, 0.014)
      : new THREE.BoxGeometry(T, H / 2 - T * 0.5, 0.014)
    const seg = new THREE.Mesh(geo, on ? lit : off)
    seg.position.set(x, y, on ? 0.004 : 0)
    g.add(seg)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(48)

  // ---- base: piso de linóleo verde-água -----------------------------------
  const base = new THREE.Group()

  const under = cylinder(2.35, 2.42, 0.1, UNDER, { roughness: 0.9 })
  under.position.y = 0.05
  base.add(under)

  const lino = cylinder(2.3, 2.33, 0.06, LINO, { roughness: 0.42 })
  lino.position.y = 0.13
  base.add(lino)

  // rejunte das placas de linóleo: cordas do círculo nas duas direções
  for (let i = -4; i <= 4; i++) {
    const c = i * 0.5
    const len = 2 * Math.sqrt(Math.max(2.24 * 2.24 - c * c, 0.01))
    const lineX = rbox(len, 0.008, 0.018, 0.003, LINO_LINE, { roughness: 0.5 })
    lineX.position.set(0, GY + 0.002, c)
    base.add(lineX)
    const lineZ = rbox(0.018, 0.008, len, 0.003, LINO_LINE, { roughness: 0.5 })
    lineZ.position.set(c, GY + 0.002, 0)
    base.add(lineZ)
  }

  // rodapé de borracha na borda, como em corredor de posto
  const skirting = torus(2.3, 0.03, '#5f8a80', { roughness: 0.6 })
  skirting.rotation.x = Math.PI / 2
  skirting.position.y = GY
  base.add(skirting)

  root.add(base)

  // ---- fileira de três cadeiras laranja numa barra cinza ------------------
  const cadeiras = new THREE.Group()

  const beam = rbox(1.86, 0.06, 0.08, 0.02, METAL, { roughness: 0.3, metalness: 0.7 })
  beam.position.set(0, GY + 0.3, -0.04)
  cadeiras.add(beam)

  for (const lx of [-0.62, 0.62]) {
    const post = rbox(0.06, 0.3, 0.06, 0.02, METAL, { roughness: 0.3, metalness: 0.7 })
    post.position.set(lx, GY + 0.15, -0.04)
    cadeiras.add(post)
    const foot = rbox(0.07, 0.04, 0.56, 0.018, METAL_DARK, { roughness: 0.35, metalness: 0.6 })
    foot.position.set(lx, GY + 0.02, -0.04)
    cadeiras.add(foot)
    for (const fz of [-0.3, 0.22]) {
      const cap = cylinder(0.035, 0.035, 0.03, RUBBER, { roughness: 0.8 })
      cap.rotation.x = Math.PI / 2
      cap.position.set(lx, GY + 0.02, fz)
      cadeiras.add(cap)
    }
  }

  for (const cx of [-0.58, 0, 0.58]) {
    const seat = rbox(0.5, 0.055, 0.46, 0.025, CHAIR, { roughness: 0.38 })
    seat.position.set(cx, SEAT - 0.0275, 0)
    cadeiras.add(seat)

    const lipRoll = cylinder(0.028, 0.028, 0.48, CHAIR, { roughness: 0.38 })
    lipRoll.rotation.z = Math.PI / 2
    lipRoll.position.set(cx, SEAT - 0.03, 0.225)
    cadeiras.add(lipRoll)

    const back = rbox(0.48, 0.5, 0.05, 0.03, CHAIR, { roughness: 0.38 })
    back.position.set(cx, SEAT + 0.23, -0.245)
    back.rotation.x = -0.1
    cadeiras.add(back)

    // vão de pegar a cadeira, no alto do encosto
    const grip = rbox(0.16, 0.045, 0.056, 0.02, CHAIR_DARK, { roughness: 0.5 })
    grip.position.set(cx, SEAT + 0.4, -0.262)
    grip.rotation.x = -0.1
    cadeiras.add(grip)

    const bracket = rbox(0.08, 0.1, 0.3, 0.02, METAL_DARK, { roughness: 0.35, metalness: 0.6 })
    bracket.position.set(cx, SEAT - 0.1, -0.04)
    cadeiras.add(bracket)
  }

  // revista esquecida na cadeira da esquerda
  const mag = rbox(0.22, 0.015, 0.28, 0.006, '#4f7fa8', { roughness: 0.5 })
  mag.position.set(-0.6, SEAT + 0.008, 0.02)
  mag.rotation.y = 0.35
  cadeiras.add(mag)
  const magStripe = rbox(0.18, 0.004, 0.06, 0.002, '#e9e3d4', { roughness: 0.5 })
  magStripe.position.set(0, 0.009, -0.08)
  mag.add(magStripe)

  root.add(cadeiras)

  // ---- planta murcha e amarelada no canto ---------------------------------
  const vaso = new THREE.Group()
  vaso.position.set(-1.46, GY, -0.42)
  vaso.rotation.y = rand() * Math.PI
  vaso.scale.setScalar(1.15)

  const pot = lathe(
    [[0, 0], [0.13, 0], [0.16, 0.24], [0.178, 0.26], [0.172, 0.285], [0.15, 0.265], [0, 0.25]],
    POT,
    { roughness: 0.35 },
  )
  vaso.add(pot)
  const soil = cylinder(0.15, 0.15, 0.02, SOIL, { roughness: 0.95 })
  soil.position.y = 0.262
  vaso.add(soil)

  // hastes que sobem e tombam por cima da borda: a planta desistiu de esperar
  const leafColors = [LEAF, LEAF_DRY, LEAF, LEAF_DEAD, LEAF_DRY]
  const hang = (at: THREE.Vector3, a: number, swing: number, len: number, color: string) => {
    const leafG = new THREE.Group()
    leafG.position.copy(at)
    leafG.rotation.set(0, -a, swing)
    const leaf = sphere(len / 2, color, { roughness: 0.75 })
    leaf.scale.set(0.34, 1, 0.1)
    leaf.position.y = -len / 2
    leafG.add(leaf)
    vaso.add(leafG)
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4 + rand() * 0.4
    const out = v(Math.cos(a), 0, Math.sin(a))
    const h = 0.42 + rand() * 0.22
    const foot = out.clone().multiplyScalar(0.03).setY(0.26)
    const knee = out.clone().multiplyScalar(0.1).setY(0.26 + h)
    const tip = out.clone().multiplyScalar(0.24).setY(0.26 + h - 0.13)
    vaso.add(bone(foot, knee, 0.011, STEM))
    vaso.add(bone(knee, tip, 0.009, STEM))
    hang(tip, a, 0.25, 0.17, leafColors[i])
    hang(knee, a, 0.75, 0.15, leafColors[(i + 2) % 5])
    hang(knee.clone().lerp(foot, 0.4), a, 1.05, 0.13, leafColors[(i + 1) % 5])
  }
  // folhas que já caíram no piso
  for (const [fx, fz, c] of [[0.3, 0.2, LEAF_DEAD], [0.22, 0.36, LEAF_DRY]] as const) {
    const fallen = sphere(0.07, c, { roughness: 0.8 })
    fallen.scale.set(0.42, 0.06, 1)
    fallen.position.set(fx, 0.006, fz)
    fallen.rotation.y = rand() * Math.PI
    vaso.add(fallen)
  }
  root.add(vaso)

  // ---- ESQUELETO sentado na cadeira do meio --------------------------------
  // origem: centro do quadril no tampo do assento; olha para +z (câmera)
  const esqueleto = new THREE.Group()
  esqueleto.position.set(0, SEAT, SK_Z)
  root.add(esqueleto)

  // bacia
  // bacia: bacia de verdade — uma tigela larga e rasa, aberta em cima
  const pelvis = lathe(
    [[0.05, 0.03], [0.095, 0.07], [0.13, 0.13], [0.142, 0.175], [0.128, 0.182], [0.116, 0.14], [0.082, 0.085], [0.04, 0.05]],
    BONE,
    { roughness: 0.5 },
  )
  ;(pelvis.material as THREE.Material).side = THREE.DoubleSide
  pelvis.scale.set(1, 1, 0.6)
  pelvis.position.set(0, 0, -0.035)
  pelvis.rotation.x = -0.18
  esqueleto.add(pelvis)
  for (const side of [-1, 1]) {
    const ischium = bone(v(side * 0.085, 0.06, -0.03), v(side * 0.035, 0.04, 0.05), 0.02)
    esqueleto.add(ischium)

    const hipBall = sphere(0.036, BONE, { roughness: 0.5 })
    hipBall.position.set(side * 0.105, 0.065, 0.0)
    esqueleto.add(hipBall)
  }
  const sacrum = rbox(0.08, 0.13, 0.05, 0.02, BONE, { roughness: 0.5 })
  sacrum.position.set(0, 0.13, -0.09)
  esqueleto.add(sacrum)
  esqueleto.add(bone(v(-0.05, 0.04, 0.05), v(0.05, 0.04, 0.05), 0.022))

  // coluna: vértebras empilhadas sobre um eixo fino
  esqueleto.add(bone(v(0, 0.18, -0.095), v(0, 0.78, -0.07), 0.014))
  for (let k = 0; k < 11; k++) {
    const vert = rbox(0.062 - k * 0.0018, 0.03, 0.052, 0.012, BONE, { roughness: 0.5 })
    vert.position.set(0, 0.2 + k * 0.046, -0.095)
    esqueleto.add(vert)
  }
  for (const [k, y] of [0.695, 0.73, 0.765].entries()) {
    const cerv = cylinder(0.026 - k * 0.002, 0.026 - k * 0.002, 0.024, BONE, { roughness: 0.5 })
    cerv.position.set(0, y, -0.072)
    esqueleto.add(cerv)
  }

  // costelas: anéis inclinados (a frente desce), presos na coluna
  const ribs: [number, number, number][] = [
    [0.63, 0.1, 0.085],
    [0.575, 0.13, 0.105],
    [0.52, 0.148, 0.118],
    [0.465, 0.156, 0.122],
    [0.41, 0.15, 0.118],
    [0.358, 0.134, 0.104],
  ]
  for (const [y, rx, rz] of ribs) {
    const r = rib(rx, rz, 0.0135)
    r.position.set(0, y, -0.095 + rz)
    r.rotation.x = 0.28
    esqueleto.add(r)
  }
  const sternum = bone(v(0, 0.61, 0.075), v(0, 0.39, 0.13), 0.02)
  sternum.scale.set(1.5, 1, 0.7)
  esqueleto.add(sternum)

  // clavículas e ombros
  for (const side of [-1, 1]) {
    esqueleto.add(bone(v(side * 0.03, 0.655, 0.07), v(side * 0.19, 0.675, -0.01), 0.016))
    const shoulder = sphere(0.035, BONE, { roughness: 0.5 })
    shoulder.position.set(side * 0.2, 0.665, -0.02)
    esqueleto.add(shoulder)
  }

  // braço direito (x−): antebraço pra frente, mão de palma pra cima com o pão
  {
    const S = v(-0.2, 0.665, -0.02)
    const E = v(-0.25, 0.43, 0.06)
    const W = v(-0.3, 0.43, 0.3)
    esqueleto.add(bone(S, E, 0.022))
    const elbow = sphere(0.03, BONE, { roughness: 0.5 })
    elbow.position.copy(E)
    esqueleto.add(elbow)
    esqueleto.add(bone(E.clone().add(v(-0.014, 0, 0)), W.clone().add(v(-0.014, 0, 0)), 0.012))
    esqueleto.add(bone(E.clone().add(v(0.014, 0, 0)), W.clone().add(v(0.014, 0, 0)), 0.012))
    const palm = rbox(0.075, 0.02, 0.07, 0.008, BONE, { roughness: 0.5 })
    palm.position.set(-0.3, 0.432, 0.34)
    esqueleto.add(palm)
    // dedos curvados por cima da frente do pão
    for (let f = 0; f < 4; f++) {
      const fx = -0.327 + f * 0.018
      esqueleto.add(bone(v(fx, 0.435, 0.37), v(fx, 0.462, 0.405), 0.0075))
      esqueleto.add(bone(v(fx, 0.462, 0.405), v(fx, 0.495, 0.4), 0.0068))
    }
    esqueleto.add(bone(v(-0.268, 0.435, 0.33), v(-0.255, 0.475, 0.36), 0.008)) // polegar
  }

  // braço esquerdo (x+): mão largada sobre o joelho
  {
    const S = v(0.2, 0.665, -0.02)
    const E = v(0.29, 0.4, 0.14)
    const W = v(0.19, 0.18, 0.34)
    esqueleto.add(bone(S, E, 0.022))
    const elbow = sphere(0.03, BONE, { roughness: 0.5 })
    elbow.position.copy(E)
    esqueleto.add(elbow)
    esqueleto.add(bone(E.clone().add(v(-0.012, 0, 0)), W.clone().add(v(-0.012, 0, 0)), 0.012))
    esqueleto.add(bone(E.clone().add(v(0.012, 0, 0)), W.clone().add(v(0.012, 0, 0)), 0.012))
    const palm = rbox(0.07, 0.02, 0.075, 0.008, BONE, { roughness: 0.5 })
    palm.position.set(0.165, 0.13, 0.4)
    palm.rotation.x = 0.7
    esqueleto.add(palm)
    for (let f = 0; f < 4; f++) {
      const fx = 0.138 + f * 0.017
      esqueleto.add(bone(v(fx, 0.11, 0.43), v(fx - 0.004, 0.07, 0.465), 0.0072))
    }
  }

  // pernas: fêmur na horizontal sobre o assento, tíbia e fíbula até o chão
  const FLOOR = GY - SEAT
  for (const side of [-1, 1]) {
    const H = v(side * 0.105, 0.065, 0.0)
    const K = v(side * 0.15, 0.075, 0.41)
    const A = v(side * 0.16, FLOOR + 0.08, 0.45)
    esqueleto.add(bone(H, K, 0.028))
    const knee = sphere(0.04, BONE, { roughness: 0.5 })
    knee.position.copy(K)
    esqueleto.add(knee)
    const patella = sphere(0.026, BONE, { roughness: 0.5 })
    patella.scale.z = 0.55
    patella.position.copy(K).add(v(0, 0.012, 0.038))
    esqueleto.add(patella)
    esqueleto.add(bone(K, A, 0.024))
    esqueleto.add(bone(v(side * 0.185, 0.04, 0.41), v(side * 0.19, FLOOR + 0.09, 0.44), 0.012))
    const ankle = sphere(0.03, BONE, { roughness: 0.5 })
    ankle.position.copy(A)
    esqueleto.add(ankle)
    const foot = rbox(0.085, 0.034, 0.12, 0.014, BONE, { roughness: 0.5 })
    foot.position.set(side * 0.17, FLOOR + 0.019, 0.5)
    esqueleto.add(foot)
    const heel = sphere(0.03, BONE, { roughness: 0.5 })
    heel.position.set(side * 0.162, FLOOR + 0.03, 0.43)
    esqueleto.add(heel)
    for (let t = 0; t < 4; t++) {
      const tx = side * (0.142 + t * 0.019)
      esqueleto.add(bone(v(tx, FLOOR + 0.02, 0.555), v(tx, FLOOR + 0.012, 0.61), 0.0085))
    }
  }

  // ---- teia entre as costelas (filha do esqueleto) -------------------------
  const teiaPeito = web(0.13, 9, 7)
  teiaPeito.position.set(0.045, 0.5, 0.15)
  teiaPeito.rotation.set(-0.25, 0, 0.2)
  esqueleto.add(teiaPeito)

  // ---- pão de queijo de pedra na mão direita -------------------------------
  const pao = new THREE.Group()
  pao.position.set(-0.3, 0.492, 0.352)
  esqueleto.add(pao)
  // bolinha achatada de casca rachada — só que de pedra facetada
  const paoBody = rock(0.078, STONE, 5, { roughness: 0.95 })
  paoBody.scale.set(1, 0.74, 1)
  pao.add(paoBody)
  for (const [cx, cz, ry, len] of [[-0.012, 0.008, 0.4, 0.07], [0.016, -0.012, -0.9, 0.06], [0.0, 0.03, 1.9, 0.04]] as const) {
    const crack = rbox(len, 0.008, 0.008, 0.003, STONE_DARK, { roughness: 0.9 })
    crack.position.set(cx, 0.057, cz)
    crack.rotation.y = ry
    pao.add(crack)
  }

  // ---- caveira (pivô no pescoço) -------------------------------------------
  const caveira = new THREE.Group()
  caveira.position.copy(NECK)
  caveira.rotation.copy(TILT)
  caveira.scale.setScalar(SKULL)
  esqueleto.add(caveira)

  const cranium = sphere(0.15, BONE, { roughness: 0.48 })
  cranium.scale.set(0.92, 0.95, 1)
  cranium.position.set(0, 0.16, 0)
  caveira.add(cranium)

  const face = sphere(0.1, BONE, { roughness: 0.48 })
  face.scale.set(0.92, 0.7, 0.85)
  face.position.set(0, 0.07, 0.06)
  caveira.add(face)

  for (const side of [-1, 1]) {
    const cheek = sphere(0.04, BONE, { roughness: 0.48 })
    cheek.position.set(side * 0.08, 0.09, 0.085)
    caveira.add(cheek)

    // órbita: calota aberta (meia esfera) — malha aberta fica nítida no
    // refine, por cima da pele fundida, em vez de virar mancha serrilhada
    const orbit = new THREE.Mesh(
      new THREE.SphereGeometry(0.043, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(HOLLOW, { roughness: 0.9, detail: 0 }),
    )
    orbit.rotation.x = Math.PI / 2
    orbit.scale.set(1, 0.45, 1.05)
    orbit.position.set(side * 0.053, 0.14, 0.131)
    caveira.add(orbit)
  }

  const nose = cone(0.022, 0.045, HOLLOW, { roughness: 0.9, detail: 0 })
  nose.scale.z = 0.4
  nose.position.set(0, 0.086, 0.141)
  caveira.add(nose)

  for (let k = 0; k < 7; k++) {
    const a = (k - 3) * 0.2
    const tooth = rbox(0.022, 0.034, 0.016, 0.006, TOOTH, { roughness: 0.3 })
    tooth.position.set(0.085 * Math.sin(a), 0.025, 0.065 + 0.085 * Math.cos(a))
    tooth.rotation.y = a
    caveira.add(tooth)
  }
  const gumUp = new THREE.Mesh(
    new THREE.TorusGeometry(0.073, 0.011, 8, 24, Math.PI * 0.8),
    mat(HOLLOW, { roughness: 0.9, detail: 0 }),
  )
  gumUp.rotation.set(Math.PI / 2, 0, Math.PI * 0.1)
  gumUp.position.set(0, 0.022, 0.065)
  caveira.add(gumUp)

  // ---- chapéu de palha torto (filho da caveira) ----------------------------
  const chapeu = new THREE.Group()
  chapeu.position.set(0.0, HAT_Y, -0.005)
  chapeu.rotation.set(HAT_RX, 0, HAT_RZ)
  caveira.add(chapeu)

  const brim = lathe(
    [[0.115, 0.03], [0.2, 0.016], [0.29, -0.006], [0.318, -0.018], [0.322, -0.006], [0.3, 0.006], [0.2, 0.028], [0.115, 0.042]],
    STRAW,
    { roughness: 0.85 },
  )
  ;(brim.material as THREE.Material).side = THREE.DoubleSide
  chapeu.add(brim)

  const crown = lathe(
    [[0.128, 0.02], [0.132, 0.08], [0.124, 0.135], [0.106, 0.163], [0.07, 0.168], [0.03, 0.152], [0.0, 0.148]],
    STRAW,
    { roughness: 0.85 },
  )
  ;(crown.material as THREE.Material).side = THREE.DoubleSide
  chapeu.add(crown)

  // trama da palha em anéis na aba e na copa
  for (const [rr, ry] of [[0.17, 0.026], [0.225, 0.015], [0.275, 0.003]] as const) {
    const weave = torus(rr, 0.0045, STRAW_DARK, { roughness: 0.85 })
    weave.rotation.x = Math.PI / 2
    weave.position.y = ry
    chapeu.add(weave)
  }
  for (const ry of [0.08, 0.115]) {
    const weave = torus(0.131 - (ry - 0.08) * 0.2, 0.004, STRAW_DARK, { roughness: 0.85 })
    weave.rotation.x = Math.PI / 2
    weave.position.y = ry
    chapeu.add(weave)
  }
  const band = cylinder(0.134, 0.134, 0.032, BAND, { roughness: 0.7 })
  band.position.y = 0.05
  chapeu.add(band)

  // ---- mandíbula (filha do esqueleto: cai da caveira até o colo) ----------
  const mandibula = new THREE.Group()
  mandibula.position.copy(JAW_LAP)
  mandibula.rotation.copy(JAW_LAP_ROT)
  mandibula.scale.setScalar(SKULL)
  esqueleto.add(mandibula)

  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.085, 0.021, 12, 32, Math.PI),
    mat(BONE, { roughness: 0.48, size: 0.2 }),
  )
  arc.castShadow = true
  arc.receiveShadow = true
  arc.rotation.x = Math.PI / 2
  mandibula.add(arc)
  const chin = sphere(0.03, BONE, { roughness: 0.48 })
  chin.scale.set(1.3, 0.9, 0.8)
  chin.position.set(0, -0.012, 0.088)
  mandibula.add(chin)
  for (const side of [-1, 1]) {
    const ramus = rbox(0.024, 0.075, 0.036, 0.01, BONE, { roughness: 0.48 })
    ramus.position.set(side * 0.085, 0.03, -0.006)
    mandibula.add(ramus)
  }
  for (let k = 0; k < 7; k++) {
    const a = (k - 3) * 0.19
    const tooth = rbox(0.022, 0.032, 0.015, 0.005, TOOTH, { roughness: 0.3 })
    tooth.position.set(0.085 * Math.sin(a), 0.024, 0.085 * Math.cos(a))
    tooth.rotation.y = a
    mandibula.add(tooth)
  }
  // fundo escuro atrás dos dentes: separa um dente do outro de longe
  const gumLow = new THREE.Mesh(
    new THREE.TorusGeometry(0.073, 0.011, 8, 24, Math.PI * 0.8),
    mat(HOLLOW, { roughness: 0.9, detail: 0 }),
  )
  gumLow.rotation.set(Math.PI / 2, 0, Math.PI * 0.1)
  gumLow.position.y = 0.022
  mandibula.add(gumLow)

  // poses da mandíbula: presa (caveira reta), presa (caveira inclinada)
  const jawUp = NECK.clone().add(JAW_OFF.clone().multiplyScalar(SKULL))
  const jawTilt = NECK.clone().add(JAW_OFF.clone().multiplyScalar(SKULL).applyEuler(TILT))

  // ---- papelzinho de senha caído aos pés -----------------------------------
  const senha = new THREE.Group()
  senha.position.copy(TICKET_FLOOR)
  senha.rotation.set(0, 0.55, 0)
  root.add(senha)
  const ticket = rbox(0.1, 0.006, 0.15, 0.003, PAPER, { roughness: 0.7 })
  senha.add(ticket)
  for (const [lz, lw] of [[-0.045, 0.06], [-0.015, 0.075], [0.025, 0.04]] as const) {
    const line = rbox(lw, 0.002, 0.012, 0.001, INK, { roughness: 0.7 })
    line.position.set(-0.012, 0.004, lz)
    senha.add(line)
  }

  // ---- teia entre a cadeira e o chão (canto do pé direito) -----------------
  const teiaCadeira = web(0.36, 6, 11, 0.02, Math.PI / 2 - 0.02, false)
  teiaCadeira.position.set(0.655, GY + 0.005, 0.0)
  root.add(teiaCadeira)

  // ---- painel de senhas num poste -----------------------------------------
  const painel = new THREE.Group()
  painel.position.copy(PANEL_POS)
  painel.rotation.y = -0.38
  root.add(painel)

  const plate = cylinder(0.17, 0.19, 0.035, METAL_DARK, { roughness: 0.35, metalness: 0.6 })
  plate.position.y = GY + 0.018
  painel.add(plate)
  const pole = cylinder(0.028, 0.028, BOX_Y - 0.15 - GY, METAL, { roughness: 0.3, metalness: 0.7 })
  pole.position.y = GY + (BOX_Y - 0.15 - GY) / 2
  painel.add(pole)
  const collar = cylinder(0.05, 0.05, 0.05, METAL_DARK, { roughness: 0.35, metalness: 0.6 })
  collar.position.y = BOX_Y - 0.17
  painel.add(collar)

  const box = rbox(0.86, 0.36, 0.13, 0.045, PANEL, { roughness: 0.45 })
  box.position.y = BOX_Y
  painel.add(box)
  const bezel = rbox(0.76, 0.26, 0.02, 0.02, BEZEL, { roughness: 0.25 })
  bezel.position.set(0, BOX_Y, 0.062)
  painel.add(bezel)
  // alto-falante do "bip" em cima do painel
  const speaker = cylinder(0.065, 0.075, 0.05, METAL_DARK, { roughness: 0.4, metalness: 0.5 })
  speaker.position.set(0.27, BOX_Y + 0.205, 0)
  painel.add(speaker)
  const grill = cylinder(0.05, 0.05, 0.006, RUBBER, { roughness: 0.8 })
  grill.position.set(0.27, BOX_Y + 0.232, 0)
  painel.add(grill)

  // ---- número 4817 aceso (filho do painel) ---------------------------------
  const numero = new THREE.Group()
  numero.position.set(0, BOX_Y, 0.074)
  painel.add(numero)
  for (const [i, d] of ['4', '8', '1', '7'].entries()) {
    const dg = digit(d)
    dg.position.x = -0.255 + i * 0.17
    numero.add(dg)
  }
  // o "bip": ondas de som saindo do alto-falante
  for (const [k, r] of [0.075, 0.115].entries()) {
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.009, 8, 20, 1.3),
      mat('#f1ede2', { roughness: 0.5, detail: 0 }),
    )
    wave.position.set(0.27 + 0.02 * k, 0.215, -0.074)
    wave.rotation.z = -0.15
    numero.add(wave)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'cadeiras', group: 'sala', object: cadeiras },
    { name: 'vaso', group: 'sala', object: vaso },
    { name: 'esqueleto', group: 'mineiro', object: esqueleto },
    { name: 'caveira', group: 'mineiro', object: caveira },
    { name: 'mandibula', group: 'mineiro', object: mandibula },
    { name: 'chapeu', group: 'mineiro', object: chapeu },
    { name: 'pao', group: 'mineiro', object: pao },
    { name: 'senha', group: 'mineiro', object: senha },
    { name: 'teiaPeito', group: 'espera', object: teiaPeito },
    { name: 'teiaCadeira', group: 'espera', object: teiaCadeira },
    { name: 'painel', group: 'painel', object: painel },
    { name: 'numero', group: 'painel', object: numero },
  ]

  const grow = (to = 1, from = 0.01) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const hold = (p: 'position' | 'rotation', x: number, y: number, z: number) => [
    ch(`${p}.x`, x, x), ch(`${p}.y`, y, y), ch(`${p}.z`, z, z),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Sala de espera do posto de saúde: piso verde-água e a fileira de cadeiras laranja.',
    }),
    seq('cadeiras-rise', 'cadeiras', 0.25, 0.8, [riseFrom(0, 1.0)], { ease: 'easeOut' }),
    seq('vaso-rise', 'vaso', 0.5, 0.7, [riseFrom(GY, 0.9)], { ease: 'easeOut' }),

    seq('esqueleto-senta', 'esqueleto', 1.9, 0.75, [ch('position.y', SEAT + 1.4, SEAT)], {
      ease: 'easeOut',
      caption: 'Um mineiro tirou a senha 4817 e sentou pra esperar, de chapéu de palha e pão de queijo na mão…',
    }),
    seq('caveira-surge', 'caveira', 2.2, 0.5, [...grow(SKULL), ...hold('rotation', 0, 0, 0)], { ease: 'easeOut' }),
    seq(
      'mandibula-surge',
      'mandibula',
      2.2,
      0.5,
      [...grow(SKULL), ...hold('position', jawUp.x, jawUp.y, jawUp.z), ...hold('rotation', 0, 0, 0)],
      { ease: 'easeOut' },
    ),
    seq('chapeu-cai', 'chapeu', 2.6, 0.55, [ch('position.y', 0.75, HAT_Y), ch('rotation.z', -0.8, HAT_RZ)], {
      ease: 'easeOut',
    }),
    seq('pao-surge', 'pao', 2.95, 0.45, grow(), { ease: 'easeOut' }),
    seq(
      'senha-surge',
      'senha',
      3.1,
      0.45,
      [
        ...grow(),
        ...hold('position', TICKET_HAND.x, TICKET_HAND.y, TICKET_HAND.z),
        ...hold('rotation', 0.6, 0.2 + Math.PI * 2, 0),
      ],
      { ease: 'easeOut' },
    ),

    seq('teia-peito', 'teiaPeito', 4.6, 0.8, grow(), {
      ease: 'easeOut',
      caption: 'Esperou tanto que virou ESQUELETO: teia entre as costelas, e o pão de queijo virou pedra.',
    }),
    seq('teia-cadeira', 'teiaCadeira', 4.85, 0.8, grow(), { ease: 'easeOut' }),
    seq(
      'senha-cai',
      'senha',
      5.0,
      0.9,
      [
        ch('position.x', TICKET_HAND.x, TICKET_FLOOR.x),
        ch('position.y', TICKET_HAND.y, TICKET_FLOOR.y),
        ch('position.z', TICKET_HAND.z, TICKET_FLOOR.z),
        ch('rotation.x', 0.6, 0),
        ch('rotation.y', 0.2 + Math.PI * 2, 0.55),
        ch('rotation.z', 0, 0),
      ],
      { ease: 'easeIn' },
    ),

    seq('painel-rise', 'painel', 6.9, 0.85, [riseFrom(0, 2.1)], {
      ease: 'easeOut',
      caption: 'Até que, enfim, o painel apita a senha dele: 4817!',
    }),
    seq('numero-acende', 'numero', 7.75, 0.35, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
    }),
    seq('numero-pisca-a', 'numero', 8.2, 0.2, [ch('scale.x', 1, 1.12), ch('scale.y', 1, 1.12)], {
      ease: 'easeOut',
      caption: 'E a enfermeira anuncia, toda animada: "O senhor está ótimo! Os ossos estão perfeitos!"',
    }),
    seq('numero-pisca-b', 'numero', 8.4, 0.25, [ch('scale.x', 1.12, 1), ch('scale.y', 1.12, 1)]),

    seq(
      'caveira-inclina',
      'caveira',
      9.5,
      0.6,
      [ch('rotation.x', 0, TILT.x), ch('rotation.y', 0, TILT.y), ch('rotation.z', 0, TILT.z)],
      { caption: 'O esqueleto inclina a caveira, surpreso e meio desconfiado: iá, SÔ?' },
    ),
    seq('mandibula-acompanha', 'mandibula', 9.5, 0.6, [
      ch('position.x', jawUp.x, jawTilt.x),
      ch('position.y', jawUp.y, jawTilt.y),
      ch('position.z', jawUp.z, jawTilt.z),
      ch('rotation.x', 0, TILT.x),
      ch('rotation.y', 0, TILT.y),
      ch('rotation.z', 0, TILT.z),
    ]),

    seq(
      'mandibula-despenca',
      'mandibula',
      10.6,
      0.45,
      [
        ch('position.x', jawTilt.x, JAW_LAP.x),
        ch('position.y', jawTilt.y, JAW_LAP.y),
        ch('position.z', jawTilt.z, JAW_LAP.z),
        ch('rotation.x', TILT.x, JAW_LAP_ROT.x),
        ch('rotation.y', TILT.y, JAW_LAP_ROT.y),
        ch('rotation.z', TILT.z, JAW_LAP_ROT.z),
      ],
      { ease: 'easeIn', caption: '…e só DEPOIS do SÔ o queixo despenca no colo!' },
    ),
    seq('mandibula-quica', 'mandibula', 11.05, 0.14, [ch('position.y', JAW_LAP.y, JAW_LAP.y + 0.045)], {
      ease: 'easeOut',
    }),
    seq('mandibula-assenta', 'mandibula', 11.19, 0.16, [ch('position.y', JAW_LAP.y + 0.045, JAW_LAP.y)], {
      ease: 'easeIn',
    }),
    seq('chapeu-pula', 'chapeu', 10.65, 0.22, [ch('position.y', HAT_Y, HAT_Y + 0.09)], { ease: 'easeOut' }),
    seq('chapeu-volta', 'chapeu', 10.87, 0.3, [ch('position.y', HAT_Y + 0.09, HAT_Y)], { ease: 'easeIn' }),

    seq('numero-pisca-c', 'numero', 11.7, 0.2, [ch('scale.x', 1, 1.12), ch('scale.y', 1, 1.12)], {
      ease: 'easeOut',
      caption: 'Jaså? — É mesmo? / Ah, é?',
    }),
    seq('numero-pisca-d', 'numero', 11.9, 0.3, [ch('scale.x', 1.12, 1), ch('scale.y', 1.12, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.62, 1.92, 3.5], target: [0.27, 0.97, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jasa',
    contexto:
      "Conversa: quando o colega conta uma novidade no fika ('Vi har köpt hus i Uppsala') ou alguém dá uma informação que você não esperava ('Affären har stängt'). É o 'ah, é?' de quem está ouvindo e quer que o outro continue.",
    fraseFonte: 'É mesmo? / Ah, é?',
    fraseAlvo: 'Jaså?',
    pronuncia:
      "iá-SÔÔ? ('ja' curtinho e fraco, UMA sílaba só, com I de IOGA — nunca o J chiado de 'já'; 'så' com Ô FECHADO de 'avô', LONGO, e a força cai nele; a voz sobe no fim, de pergunta — dito descendo e arrastado, soa desconfiado)",
    ponteSonora:
      "iá, SÔ? (2 sílabas: iá-SÔÔ; a força toda no SÔ; é o 'uai, sô?' do mineiro que acabou de ouvir uma novidade, só que começando em IÁ; iá = o 'ja' (sim) do sueco, UMA sílaba só, curtinha, SEM força e colada no SÔ — I de IOGA, nunca o J chiado de 'já', e nunca o 'Í-a' de 'ele ia', que racha em duas sílabas e puxa a força pro I; é o mesmo IÁ de 'Ja, precis!', aqui sem a pancada; SÔ = o 'sô' mineiro, o MESMO 'så' de 'Tack så mycket' (TAC, SÔ MUQUE) e do ÓK, SÔ! da capivara mineira de 'Ja, precis! Det tycker jag också': Ô FECHADO de 'avô', LONGO, com a voz subindo de pergunta; nunca o Ó aberto de 'só' — na história o queixo do esqueleto só despenca DEPOIS do SÔ; tudo num fôlego, iá-SÔÔ, como uma palavra só)",
    historia:
      "O esqueleto mineiro chegou ao posto de saúde com dor nas costas, tirou a senha 4817 e sentou pra esperar, de chapéu de palha e com um pão de queijo na mão. Esperou tanto que virou esqueleto: as teias se esticaram entre as costelas e o pão de queijo virou pedra. Hoje, enfim, o painel apita o número dele e a enfermeira anuncia, toda animada: 'O senhor está ótimo! Os ossos estão perfeitos!' O esqueleto inclina a caveira, surpreso e meio desconfiado — iá, SÔ? — e o queixo despenca no colo. É mesmo?",
  },
  createScene,
  refine: { organic: ['caveira'] },
}

export default card
