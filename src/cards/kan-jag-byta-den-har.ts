import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Kan jag byta den här?" — CA-NIÁ BI(R)ÚTA... DEN RRÉR?
 *
 * A sereia comprou o DENTE de ouro da loja de souvenirs (o mesmo de 'Vad
 * kostar den här?') e se arrependeu: ele não para de rosnar RRÉR. Ela volta à
 * loja batendo o tridente de CANA — CA-NIÁ! —, senta na beirada do balcão de
 * trocas e enfia o dente na boca larga da BIRUTA-trocadora deitada no tampo
 * (a mesma biruta listrada de 'Var ska jag byta?'): pela ponta fina rola pra
 * fora uma pérola. Trocado.
 *
 * Diorama: piso de tábuas claras; balcão branco de tampo turquesa com a placa
 * BYTE na frente; a sereia sentada na beirada, cauda esmeralda escamada
 * pendurada pela frente do balcão até a barbatana turquesa em leque; o
 * tridente de cana fincado no chão à esquerda; a biruta laranja e branca
 * deitada à direita. Acento saturado (laranja) reservado à BIRUTA (byta).
 */

const SOIL = '#6f5a43'
const FLOOR = '#dcc6a0'
const FLOOR_GAP = '#b59a70'
const COUNTER = '#f1ece3'
const COUNTER_SHADE = '#dcd4c6'
const COUNTER_TOP = '#3aa39e' // tampo azul-turquesa
const COUNTER_TOP_DARK = '#2b827d'
const SOCK = '#f26a1b' // ACENTO saturado — a BIRUTA (as cores de 'Var ska jag byta?')
const SOCK_WHITE = '#f4f0e7'
const STEEL = '#525b63'
const SKIN = '#f1c9a5'
const HAIR = '#b4432b'
const HAIR_DARK = '#93341f'
const SHELL = '#b993d9'
const SHELL_DARK = '#9670bd'
const TAIL_A = '#12825a'
const TAIL_B = '#22ad8f'
const FIN = '#35c2c4'
const FIN_RIB = '#a3e8e3'
const GOLD = '#f2b32c' // o DENTE de ouro (o mesmo de 'Vad kostar den här?')
const GOLD_DARK = '#d99f24'
const IVORY = '#e8dcc0'
const CANE = '#6e4c74'
const CANE_LIGHT = '#836087'
const CANE_NODE = '#8fa65a'
const TRIDENT = '#e2b33f'
const PEARL = '#f8f4ee'
const GROWL = '#9aa3ab'
const INK = '#1e2024'

const R = 2.62 // raio do diorama
const FY = 0.15 // topo do piso
const TOP = 0.95 // tampo do balcão
const CF = 0.62 // face da frente do balcão
const CB = -0.52 // fundo do balcão
const CW = 3.7 // largura do balcão

// sereia: sentada na beirada, virada um pouco pra biruta (direita)
const H = 1.5
const MX = -0.84
const MZ = 0.36
const MYAW = 0.4
const HAND = 0.19 * H + 0.32 * 0.52 * H // ombro → centro da mão (após shoulderPivot)

// biruta deitada: boca larga virada pra sereia, ponta fina pra direita/fundo
const RM = 0.33 // raio da boca
const RT = 0.15 // raio da ponta
const SOCK_L = 1.22
const ALPHA = Math.atan2(RM - RT, SOCK_L) // inclinação: a geratriz de baixo deita no tampo
const PSI = 0.2 // guinada: a ponta vai pra direita e um pouco pro fundo
const SOCK_Y = RM + 0.02 // altura do eixo na boca acima do tampo

// dente na mão: a mão empurra as cúspides; o colo entra um pouco na boca
const TOOTH_K = 1.4 // dente GIGANTE
const TOOTH_TILT = 0.35 // coroa levantada em direção à mão
const GRIP = 0.27 * TOOTH_K + 0.07 // do colo do dente ao centro da mão
const NECK_IN = -0.04 // colo do dente rente à boca: só as raízes entram

const RP = 0.12 // raio da pérola
const TRI_TOP = 2.0 // topo do cabo do tridente

const CAM: [number, number, number] = [0.55, 1.85, 5.3]
const CAM_TARGET: [number, number, number] = [0.12, 1.3, 0.3]

const Y = new THREE.Vector3(0, 1, 0)
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b — membros, mechas, nervuras. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(Y, d.normalize())
  return m
}

/** Cilindro de a até b — hastes. */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = b.clone().sub(a)
  const m = cylinder(r, r, d.length(), color, opts, 16)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(Y, d.normalize())
  return m
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Escamas sobrepostas: grade hexagonal (linhas ao longo da cauda, colunas em
 * volta). Em cada ponto vale a escama da linha mais próxima da cintura que o
 * cobre — a borda livre de cada uma cai por cima da seguinte, como em peixe.
 * Devolve a altura 0..1 (sobe em direção à borda livre).
 */
function scaleHeight(q: number, p: number) {
  const RS = 0.74
  let bestRow = Infinity
  let bestD = Infinity
  let h = 0
  const i0 = Math.floor(q)
  for (let i = i0 - 1; i <= i0 + 1; i++) {
    const off = i & 1 ? 0.5 : 0
    const cq = i + 0.5
    const j0 = Math.floor(p - off)
    for (let j = j0 - 1; j <= j0 + 1; j++) {
      const cp = j + 0.5 + off
      const dq = q - cq
      const d = Math.hypot(dq, p - cp)
      if (d >= RS) continue
      if (i < bestRow || (i === bestRow && d < bestD)) {
        bestRow = i
        bestD = d
        const t = (dq + RS) / (2 * RS) // 0 na borda presa, 1 na borda livre
        const rim = smooth(Math.min(1, Math.max(0, (d - (RS - 0.14)) / 0.14)))
        h = (0.2 + 0.8 * t) * (1 - 0.45 * rim)
      }
    }
  }
  return h
}

/**
 * Cauda de sereia: tubo de seção elíptica e raio variável ao longo de uma
 * curva, com escamas em relevo (deslocamento) e sombreadas nas bordas (cor
 * por vértice), fechado nas duas pontas.
 */
function tailMesh(curve: THREE.Curve<THREE.Vector3>, radii: (u: number) => [number, number]) {
  const NCOL = 16 // escamas em volta
  const PER = 7 // vértices por escama
  const NR = NCOL * PER
  const K = 0.42 // comprimento da escama em raios
  const total = curve.getLength()

  // coordenada de linha q(u) = ∫ ds / (K·r): escamas diminuem rumo à barbatana
  const M = 800
  const qAt = [0]
  for (let i = 1; i <= M; i++) {
    const [a, b] = radii((i - 0.5) / M)
    qAt.push(qAt[i - 1] + total / M / (K * Math.max(0.075, (a + b) / 2)))
  }
  const Q = qAt[M]
  const NS = Math.ceil(Q * PER) + 1

  const pos: number[] = []
  const col: number[] = []
  const ca = new THREE.Color(TAIL_A)
  const cb = new THREE.Color(TAIL_B)
  const S = v3(1, 0, 0) // lateral, transportada em paralelo ao longo da curva
  const N = new THREE.Vector3()
  for (let k = 0; k < NS; k++) {
    const q = (k / (NS - 1)) * Q
    let i = 1
    while (i < M && qAt[i] < q) i++
    const f = (q - qAt[i - 1]) / Math.max(1e-9, qAt[i] - qAt[i - 1])
    const u = Math.min(1, Math.max(0, (i - 1 + f) / M))
    const P = curve.getPointAt(u)
    const T = curve.getTangentAt(u)
    S.addScaledVector(T, -S.dot(T)).normalize()
    N.crossVectors(T, S)
    const [a, b] = radii(u)
    const base = ca.clone().lerp(cb, smooth(u))
    for (let j = 0; j < NR; j++) {
      const th = (j / NR) * Math.PI * 2
      const h = scaleHeight(q, (j / NR) * NCOL)
      const k2 = 1 + 0.06 * h
      const cx = Math.cos(th) * a * k2
      const cy = Math.sin(th) * b * k2
      pos.push(P.x + S.x * cx + N.x * cy, P.y + S.y * cx + N.y * cy, P.z + S.z * cx + N.z * cy)
      const shade = 0.62 + 0.48 * h
      col.push(base.r * shade, base.g * shade, base.b * shade)
    }
  }
  const index: number[] = []
  for (let k = 0; k < NS - 1; k++) {
    for (let j = 0; j < NR; j++) {
      const a = k * NR + j
      const b = k * NR + ((j + 1) % NR)
      const c = (k + 1) * NR + j
      const d = (k + 1) * NR + ((j + 1) % NR)
      index.push(a, b, c, b, d, c)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  geo.setIndex(index)
  geo.computeVertexNormals()
  const material = mat('#ffffff', { roughness: 0.36, metalness: 0.15, size: 0.4 })
  material.vertexColors = true
  const mesh = new THREE.Mesh(geo, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Um lobo da barbatana (s = ±1): leque com ponta externa e entalhe central. */
function finLobe(s: number) {
  const g = new THREE.Group()
  const sh = new THREE.Shape()
  sh.moveTo(0, 0)
  sh.quadraticCurveTo(s * 0.15, 0.04, s * 0.28, 0.2)
  sh.quadraticCurveTo(s * 0.4, 0.35, s * 0.46, 0.54)
  sh.quadraticCurveTo(s * 0.36, 0.43, s * 0.25, 0.45)
  sh.quadraticCurveTo(s * 0.12, 0.46, s * 0.02, 0.31)
  sh.lineTo(0, 0)
  const depth = 0.028
  const geo = new THREE.ExtrudeGeometry(sh, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 20,
  })
  geo.translate(0, 0, -depth / 2)
  const m = new THREE.Mesh(geo, mat(FIN, { roughness: 0.35, size: 0.5 }))
  m.castShadow = true
  m.receiveShadow = true
  g.add(m)
  // nervuras do leque nas duas faces
  const tips: [number, number][] = [[0.43, 0.49], [0.35, 0.42], [0.25, 0.43], [0.14, 0.4], [0.06, 0.31]]
  for (const [tx, ty] of tips) {
    for (const fz of [-1, 1]) {
      const z = fz * (depth / 2 + 0.01)
      g.add(limb(v3(s * 0.02, 0.04, z), v3(s * tx * 0.94, ty * 0.94, z), 0.007, FIN_RIB, { roughness: 0.4 }))
    }
  }
  return g
}

/** Concha de vieira lilás: leque abaulado com gomos. */
function shell() {
  const g = new THREE.Group()
  const body = sphere(0.088, SHELL, { roughness: 0.4 })
  body.scale.set(1.05, 0.92, 0.42)
  g.add(body)
  for (let k = -2; k <= 2; k++) {
    const a = k * 0.36
    const rib = limb(
      v3(Math.sin(a) * 0.012, -0.062, 0.03),
      v3(Math.sin(a) * 0.082, -0.062 + Math.cos(a) * 0.13, 0.024),
      0.011,
      SHELL_DARK,
      { roughness: 0.45 },
    )
    g.add(rib)
  }
  const hinge = rbox(0.06, 0.03, 0.03, 0.01, SHELL_DARK, { roughness: 0.45 })
  hinge.position.set(0, -0.075, 0.012)
  g.add(hinge)
  return g
}

/** Mecha ondulada de cabelo: contas fundidas ao longo de uma curva. */
function lock(points: THREE.Vector3[], r0: number, r1: number, color: string) {
  const g = new THREE.Group()
  const curve = new THREE.CatmullRomCurve3(points)
  const n = 9
  let prev = curve.getPointAt(0)
  for (let i = 1; i <= n; i++) {
    const p = curve.getPointAt(i / n)
    const r = r0 + (r1 - r0) * (i / n)
    g.add(limb(prev, p, r, color, { roughness: 0.75 }))
    prev = p
  }
  return g
}

/** Traço de letra da placa: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.008, COUNTER, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** B Y T E — letras de traço grosso, legíveis a distância de diorama. */
function letter(which: 'B' | 'Y' | 'T' | 'E') {
  const g = new THREE.Group()
  const t = 0.03
  if (which === 'B') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.072, t, -0.008, 0.066))
    g.add(stroke(0.072, t, -0.008, 0))
    g.add(stroke(0.072, t, -0.008, -0.066))
    g.add(stroke(t, 0.06, 0.03, 0.035))
    g.add(stroke(t, 0.06, 0.03, -0.035))
  } else if (which === 'Y') {
    g.add(stroke(t, 0.09, 0, -0.035))
    g.add(stroke(t, 0.1, -0.026, 0.04, 0.58))
    g.add(stroke(t, 0.1, 0.026, 0.04, -0.58))
  } else if (which === 'T') {
    g.add(stroke(0.11, t, 0, 0.066))
    g.add(stroke(t, 0.16, 0, -0.005))
  } else {
    g.add(stroke(t, 0.16, -0.035, 0))
    g.add(stroke(0.078, t, 0.0, 0.066))
    g.add(stroke(0.064, t, -0.007, 0))
    g.add(stroke(0.078, t, 0.0, -0.066))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const camPos = v3(...CAM)

  // ---- loja: piso de tábuas claras -----------------------------------------
  const base = new THREE.Group()
  const soil = cylinder(R, R + 0.08, 0.1, SOIL, { roughness: 0.9 })
  soil.position.y = 0.05
  base.add(soil)
  const floor = cylinder(R - 0.04, R, 0.05, FLOOR, { roughness: 0.7 })
  floor.position.y = FY - 0.025
  base.add(floor)
  // frestas entre as tábuas (cordas do círculo)
  for (let z = -2.25; z <= 2.3; z += 0.45) {
    const half = Math.sqrt(Math.max(0.01, (R - 0.1) ** 2 - z * z))
    const gap = rbox(half * 2, 0.012, 0.022, 0.005, FLOOR_GAP, { roughness: 0.8 })
    gap.position.set(0, FY + 0.002, z)
    base.add(gap)
  }
  // emendas de topo, alternadas
  for (let k = 0; k < 10; k++) {
    const z = -2.025 + k * 0.45
    const x = (k % 2 ? -0.9 : 0.6) + (k % 3) * 0.35
    if (x * x + z * z > (R - 0.2) ** 2) continue
    const joint = rbox(0.018, 0.012, 0.43, 0.005, FLOOR_GAP, { roughness: 0.8 })
    joint.position.set(x, FY + 0.002, z)
    base.add(joint)
  }
  root.add(base)

  // ---- balcão de trocas: madeira branca, tampo turquesa --------------------
  const balcao = new THREE.Group()
  const depth = CF - CB
  const zc = (CF + CB) / 2
  const bodyH = TOP - 0.07 - FY
  const front = rbox(CW, bodyH, depth, 0.03, COUNTER, { roughness: 0.6 })
  front.position.set(0, FY + bodyH / 2, zc)
  balcao.add(front)
  // tábuas verticais do frontal
  for (let i = -7; i <= 7; i++) {
    const groove = rbox(0.016, bodyH - 0.16, 0.02, 0.006, COUNTER_SHADE, { roughness: 0.7 })
    groove.position.set(i * 0.22, FY + 0.08 + (bodyH - 0.16) / 2 + 0.02, CF + 0.002)
    balcao.add(groove)
  }
  const kick = rbox(CW + 0.02, 0.1, depth + 0.02, 0.03, COUNTER_SHADE, { roughness: 0.7 })
  kick.position.set(0, FY + 0.05, zc)
  balcao.add(kick)
  const tampo = rbox(CW + 0.1, 0.07, depth + 0.1, 0.03, COUNTER_TOP, { roughness: 0.35 })
  tampo.position.set(0, TOP - 0.035, zc + 0.02)
  balcao.add(tampo)
  const friso = rbox(CW + 0.04, 0.035, 0.04, 0.012, COUNTER_TOP_DARK, { roughness: 0.4 })
  friso.position.set(0, TOP - 0.09, CF + 0.02)
  balcao.add(friso)
  // recibo (kvitto) no tampo, perto da boca da biruta
  const kvitto = new THREE.Group()
  kvitto.position.set(0.55, TOP + 0.004, 0.45)
  kvitto.rotation.y = -0.35
  const paper = rbox(0.16, 0.006, 0.26, 0.003, '#fbfaf6', { roughness: 0.8 })
  kvitto.add(paper)
  for (let k = 0; k < 5; k++) {
    const line = rbox(k === 4 ? 0.06 : 0.11, 0.004, 0.012, 0.002, '#9aa0a6', { roughness: 0.8 })
    line.position.set(k === 4 ? 0.03 : 0, 0.004, -0.09 + k * 0.042)
    kvitto.add(line)
  }
  balcao.add(kvitto)
  root.add(balcao)

  // ---- placa BYTE na frente do balcão --------------------------------------
  const placa = new THREE.Group()
  placa.position.set(0.98, 0.56, CF + 0.025)
  const plaque = rbox(0.78, 0.34, 0.04, 0.05, COUNTER_TOP, { roughness: 0.4 })
  placa.add(plaque)
  const glyphs: ['B' | 'Y' | 'T' | 'E', number][] = [['B', -0.24], ['Y', -0.08], ['T', 0.08], ['E', 0.24]]
  for (const [gl, lx] of glyphs) {
    const l = letter(gl)
    l.position.set(lx, 0, 0.025)
    l.scale.setScalar(1.3)
    placa.add(l)
  }
  root.add(placa)

  // ---- a sereia (person: tronco, cabeça e braços esculpidos) ---------------
  const sereia = person({ body: SKIN, skin: SKIN, height: H, armAngle: 0.35 })
  sereia.position.set(MX, TOP - 0.02, MZ)
  sereia.rotation.y = MYAW
  root.add(sereia)
  const bR = H * 0.17 // raio do corpo

  // top de duas conchas lilás + alcinha
  for (const s of [-1, 1]) {
    const c = shell()
    c.position.set(s * 0.1, 0.585, bR * 0.86)
    c.rotation.set(-0.2, s * 0.4, s * -0.12)
    sereia.add(c)
  }
  const strap = torus(bR + 0.004, 0.012, SHELL_DARK, { roughness: 0.45 })
  strap.rotation.x = Math.PI / 2
  strap.position.y = 0.585
  sereia.add(strap)

  // babado de escamas-barbatana na cintura, onde a pele vira cauda
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const fl = sphere(0.062, FIN, { roughness: 0.4 })
    fl.scale.set(1.15, 0.6, 0.32)
    fl.position.set(Math.sin(a) * (bR + 0.005), 0.44, Math.cos(a) * (bR + 0.005))
    fl.rotation.set(0.35, a, 0, 'YXZ')
    sereia.add(fl)
  }

  // rosto: sobrancelhas bravas, boca aberta (CA-NIÁ!), cílios, bochechas
  const head = sereia.getObjectByName('head') as THREE.Group
  head.rotation.set(0.08, 0.22, 0)
  const hr = H * 0.19
  for (const s of [-1, 1]) {
    const brow = capsule(0.016, 0.075, HAIR_DARK, { roughness: 0.6 })
    brow.rotation.z = Math.PI / 2 + s * 0.38
    brow.position.set(s * hr * 0.4, hr * 0.42, hr * 0.84)
    head.add(brow)
    for (let k = 0; k < 3; k++) {
      const lash = capsule(0.006, 0.03, INK, { roughness: 0.5 })
      lash.position.set(s * (hr * 0.47 + k * 0.016), hr * 0.33 - k * 0.008, hr * 0.86)
      lash.rotation.z = -s * (0.5 + k * 0.35)
      head.add(lash)
    }
    const cheek = sphere(0.038, '#ec9c90', { roughness: 0.6 })
    cheek.scale.set(1.2, 0.8, 0.4)
    cheek.position.set(s * hr * 0.6, -hr * 0.18, hr * 0.78)
    head.add(cheek)
  }
  const mouth = sphere(0.06, '#5a2028', { roughness: 0.6 })
  mouth.scale.set(1.5, 0.78, 0.5)
  mouth.position.set(0, -hr * 0.42, hr * 0.88)
  head.add(mouth)
  const lip = torus(0.062, 0.008, '#c8605e', { roughness: 0.5 })
  lip.scale.set(1.5, 0.78, 1)
  lip.position.set(0, -hr * 0.42, hr * 0.9)
  head.add(lip)
  const tongue = sphere(0.032, '#d9707a', { roughness: 0.5 })
  tongue.scale.set(1.3, 0.6, 0.6)
  tongue.position.set(0, -hr * 0.5, hr * 0.92)
  head.add(tongue)

  // ---- cabelo ruivo comprido e ondulado (peça orgânica) --------------------
  const cabelo = new THREE.Group()
  head.add(cabelo)
  const cap = sphere(hr * 1.07, HAIR, { roughness: 0.75 })
  cap.position.set(0, hr * 0.26, -hr * 0.2)
  cabelo.add(cap)
  // franja de lado
  for (const [fx, fy, fz, fr] of [
    [-0.17, 0.2, 0.15, 0.085], [-0.06, 0.245, 0.17, 0.09], [0.07, 0.235, 0.17, 0.088],
    [0.17, 0.185, 0.15, 0.08], [0.23, 0.09, 0.1, 0.07],
  ] as const) {
    const tuft = sphere(fr, HAIR, { roughness: 0.75 })
    tuft.position.set(fx, fy, fz)
    tuft.scale.set(1.2, 0.85, 0.9)
    cabelo.add(tuft)
  }
  // mechas caindo nas costas (largas, para a silhueta ler dos lados)
  for (const [sx, sz, w] of [[-0.2, -0.14, 0.1], [0, -0.22, 0.11], [0.2, -0.14, 0.1], [-0.3, 0.0, 0.085], [0.3, -0.02, 0.08]] as const) {
    const pts = [
      v3(sx * 0.9, 0.05, sz - 0.1),
      v3(sx * 1.15 + 0.03, -0.18, sz - 0.12),
      v3(sx * 1.25 - 0.03, -0.38, sz - 0.1),
      v3(sx * 1.3 + 0.03, -0.56, sz - 0.12),
      v3(sx * 1.32, -0.7, sz - 0.08),
    ]
    cabelo.add(lock(pts, w, w * 0.55, HAIR))
  }
  // uma mecha pela frente do ombro esquerdo (o direito empurra o dente)
  cabelo.add(lock([
    v3(-0.25, 0.02, 0.06), v3(-0.3, -0.2, 0.12), v3(-0.26, -0.38, 0.17), v3(-0.3, -0.55, 0.2),
  ], 0.075, 0.045, HAIR))

  // ---- braços: o esquerdo segura o tridente, o direito o dente -------------
  const bracoR = sereia.getObjectByName('armR') as THREE.Mesh
  const bracoL = sereia.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoR, H)
  shoulderPivot(bracoL, H)
  root.updateMatrixWorld(true)
  const toLocalDir = (d: THREE.Vector3) => d.clone().applyAxisAngle(Y, -MYAW)
  const DOWN = v3(0, -1, 0)

  // eixo da biruta deitada (boca → ponta) e a cadeia ombro → mão → dente → boca
  const D = v3(Math.cos(ALPHA) * Math.cos(PSI), -Math.sin(ALPHA), -Math.cos(ALPHA) * Math.sin(PSI))
  // o dente entra inclinado: coroa pra cima e pra sereia, raízes na boca
  const toothUp = D.clone().negate().multiplyScalar(Math.cos(TOOTH_TILT)).add(v3(0, Math.sin(TOOTH_TILT), 0)).normalize()
  const SR = sereia.localToWorld(bracoR.position.clone())
  const dy = (TOP + SOCK_Y + NECK_IN * D.y + GRIP * toothUp.y - SR.y) / HAND
  const dh = Math.sqrt(Math.max(0, 1 - dy * dy))
  const PHI = 0.32
  const reach = v3(dh * Math.cos(PHI), dy, -dh * Math.sin(PHI))
  const G = SR.clone().addScaledVector(reach, HAND) // centro da mão
  const toothO = G.clone().addScaledVector(toothUp, -GRIP) // colo do dente
  const mouthC = toothO.clone().addScaledVector(D, -NECK_IN) // centro da boca da biruta

  bracoR.quaternion.setFromUnitVectors(DOWN, toLocalDir(reach))
  const REACH = bracoR.rotation.clone()
  const raised = new THREE.Quaternion().setFromUnitVectors(DOWN, v3(0.62, 0.58, 0.48).normalize())
  const RAISED = new THREE.Euler().setFromQuaternion(raised)

  const SL = sereia.localToWorld(bracoL.position.clone())
  const reachL = v3(-0.6, -0.5, 0.62).normalize()
  const GL = SL.clone().addScaledVector(reachL, HAND)
  bracoL.quaternion.setFromUnitVectors(DOWN, toLocalDir(reachL))

  // ---- cauda esmeralda escamada, pendurada pela frente do balcão -----------
  const fwd = v3(Math.sin(MYAW), 0, Math.cos(MYAW))
  const hip = v3(MX, TOP + 0.17, MZ)
  const edgeX = hip.x + fwd.x * 0.32 + 0.02
  const tailCurve = new THREE.CatmullRomCurve3([
    hip.clone().addScaledVector(fwd, -0.36).add(v3(0, 0.02, 0)),
    hip.clone().addScaledVector(fwd, 0.02),
    hip.clone().addScaledVector(fwd, 0.24),
    v3(edgeX, TOP - 0.06, CF + 0.23),
    v3(edgeX + 0.03, TOP - 0.42, CF + 0.27),
    v3(edgeX + 0.06, FY + 0.27, CF + 0.33),
    v3(edgeX + 0.26, FY + 0.13, CF + 0.5),
    v3(edgeX + 0.48, FY + 0.18, CF + 0.56),
    v3(edgeX + 0.6, FY + 0.42, CF + 0.55),
  ], false, 'centripetal')
  const radKeys: [number, number, number][] = [
    [0, 0.3, 0.25], [0.17, 0.3, 0.25], [0.3, 0.225, 0.215], [0.55, 0.16, 0.155],
    [0.8, 0.105, 0.1], [0.94, 0.072, 0.07], [1, 0.064, 0.062],
  ]
  const radii = (u: number): [number, number] => {
    let k = 1
    while (k < radKeys.length - 1 && radKeys[k][0] < u) k++
    const [u0, a0, b0] = radKeys[k - 1]
    const [u1, a1, b1] = radKeys[k]
    const t = smooth(Math.min(1, Math.max(0, (u - u0) / (u1 - u0))))
    let m = 1
    if (u < 0.07) m = Math.sqrt(Math.max(0, 1 - (1 - u / 0.07) ** 2)) // ponta arredondada atrás do quadril
    if (u > 0.97) m = Math.sqrt(Math.max(0, 1 - ((u - 0.97) / 0.03) ** 2))
    return [(a0 + (a1 - a0) * t) * m, (b0 + (b1 - b0) * t) * m]
  }
  const cauda = new THREE.Group()
  cauda.add(tailMesh(tailCurve, radii))
  root.add(cauda)

  // ---- barbatana turquesa em leque (filha da cauda) -------------------------
  const finU = 0.955
  const finBase = tailCurve.getPointAt(finU)
  const finT = tailCurve.getTangentAt(finU)
  const toCam = camPos.clone().sub(finBase).normalize()
  const fz = toCam.clone().addScaledVector(finT, -toCam.dot(finT)).normalize()
  const fx = new THREE.Vector3().crossVectors(finT, fz)
  const barbatana = new THREE.Group()
  barbatana.position.copy(finBase)
  barbatana.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(fx, finT, fz))
  const finHub = sphere(0.075, FIN, { roughness: 0.35 })
  finHub.scale.set(1.1, 1.3, 0.8)
  barbatana.add(finHub)
  for (const s of [-1, 1]) {
    const lobe = finLobe(s)
    lobe.position.y = 0.02
    lobe.scale.setScalar(0.9)
    barbatana.add(lobe)
  }
  cauda.add(barbatana)

  // ---- tridente com cabo de cana-de-açúcar, fincado no chão ----------------
  const tridente = new THREE.Group()
  tridente.position.set(GL.x, FY, GL.z)
  root.add(tridente)
  const SEG = 8
  const segL = (TRI_TOP - FY) / SEG
  for (let k = 0; k < SEG; k++) {
    const gomo = lathe(
      [[0, 0], [0.034, 0], [0.039, segL * 0.25], [0.04, segL * 0.6], [0.036, segL], [0, segL]],
      k % 2 ? CANE : CANE_LIGHT,
      { roughness: 0.45 },
      18,
    )
    gomo.position.y = k * segL
    tridente.add(gomo)
    if (k > 0) {
      const no = torus(0.04, 0.011, CANE_NODE, { roughness: 0.55 })
      no.rotation.x = Math.PI / 2
      no.position.y = k * segL
      tridente.add(no)
      // cicatriz da folha no nó
      const bud = sphere(0.014, CANE_NODE, { roughness: 0.55 })
      bud.position.set(Math.sin(k * 2.1) * 0.04, k * segL + 0.02, Math.cos(k * 2.1) * 0.04)
      tridente.add(bud)
    }
  }
  const metalT = { roughness: 0.25, metalness: 0.85 }
  const triH = TRI_TOP - FY
  const collar = cylinder(0.05, 0.045, 0.07, TRIDENT, metalT, 20)
  collar.position.y = triH + 0.02
  tridente.add(collar)
  // garfo em U de frente pra câmera, três pontas com farpas
  const camYaw = Math.atan2(camPos.x - GL.x, camPos.z - GL.z)
  const garfo = new THREE.Group()
  garfo.position.y = triH + 0.05
  garfo.rotation.y = camYaw
  tridente.add(garfo)
  const uBend = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.024, 12, 28, Math.PI), mat(TRIDENT, { ...metalT, size: 0.3 }))
  uBend.rotation.z = Math.PI
  uBend.position.y = 0.15
  uBend.castShadow = true
  garfo.add(uBend)
  for (const px of [-0.15, 0, 0.15]) {
    const y0 = px === 0 ? 0 : 0.15
    const y1 = 0.42
    garfo.add(rod(v3(px, y0, 0), v3(px, y1, 0), px === 0 ? 0.027 : 0.024, TRIDENT, metalT))
    const tip = cone(0.05, 0.13, TRIDENT, metalT, 16)
    tip.position.set(px, y1 + 0.06, 0)
    garfo.add(tip)
  }

  // ---- biruta-trocadora deitada no balcão ----------------------------------
  const biruta = new THREE.Group()
  biruta.position.copy(mouthC)
  biruta.rotation.set(0, PSI, -ALPHA)
  root.add(biruta)
  const sockBody = new THREE.Group()
  sockBody.rotation.z = -Math.PI / 2 // perfil torneado ao longo de +x
  biruta.add(sockBody)
  const radiusAt = (s: number) => RM - (RM - RT) * s + 0.02 * Math.sin(Math.PI * s)
  const BANDS = 5
  for (let i = 0; i < BANDS; i++) {
    const s0 = i / BANDS
    const s1 = (i + 1) / BANDS
    const sm = (s0 + s1) / 2
    const y0 = s0 * SOCK_L
    const y1 = s1 * SOCK_L
    const ym = (y0 + y1) / 2
    const t = 0.014
    const band = lathe(
      [
        [radiusAt(s0), y0], [radiusAt(sm) + 0.004, ym], [radiusAt(s1), y1],
        [radiusAt(s1) - t, y1], [radiusAt(sm) - t + 0.004, ym], [radiusAt(s0) - t, y0], [radiusAt(s0), y0],
      ],
      i % 2 ? SOCK_WHITE : SOCK,
      { roughness: 0.85 },
      40,
    )
    sockBody.add(band)
    if (i > 0) {
      const seam = torus(radiusAt(s0) + 0.002, 0.008, i % 2 ? '#d85a14' : '#d9d3c6', { roughness: 0.85 })
      seam.rotation.x = Math.PI / 2
      seam.position.y = y0
      sockBody.add(seam)
    }
  }
  // barra de lona e aro de aço na boca larga
  const cuff = lathe(
    [[RM + 0.018, -0.02], [RM + 0.02, 0.07], [RM + 0.002, 0.07], [RM, -0.02], [RM + 0.018, -0.02]],
    '#e9e3d6',
    { roughness: 0.8 },
    40,
  )
  sockBody.add(cuff)
  const hoop = torus(RM + 0.012, 0.02, STEEL, { roughness: 0.35, metalness: 0.7 })
  hoop.rotation.x = Math.PI / 2
  hoop.position.y = -0.015
  sockBody.add(hoop)
  // garganta escura: lá dentro a troca acontece
  const throat = cylinder(RM - 0.06, RM - 0.06, 0.01, '#3b2a24', { roughness: 0.9 }, 32)
  throat.position.y = SOCK_L * 0.32
  sockBody.add(throat)

  // ---- o DENTE de ouro rosnador (filho da mão direita) ---------------------
  // Deitado (coroa pra sereia, raízes na boca), mas com a cara de pé: os
  // traços do rosto ficam num grupo girado 90° na face da coroa.
  const dente = new THREE.Group()
  const molar = new THREE.Group()
  molar.scale.setScalar(TOOTH_K)
  dente.add(molar)
  const gold = { roughness: 0.28, metalness: 0.6 }
  const crown = rbox(0.34, 0.22, 0.27, 0.07, GOLD, gold)
  crown.position.y = 0.12
  molar.add(crown)
  for (const cx of [-1, 1]) {
    for (const cz of [-1, 1]) {
      const cusp = sphere(0.078, GOLD, gold)
      cusp.position.set(cx * 0.08, 0.215, cz * 0.06)
      cusp.scale.y = 0.75
      molar.add(cusp)
    }
  }
  const neck = cylinder(0.125, 0.135, 0.06, GOLD_DARK, gold)
  neck.position.y = -0.01
  molar.add(neck)
  for (const s of [-1, 1]) {
    const raiz = capsule(0.052, 0.16, IVORY, { roughness: 0.3 })
    raiz.position.set(s * 0.07, -0.13, 0)
    raiz.rotation.z = s * 0.2
    raiz.scale.set(1, 1, 0.85)
    molar.add(raiz)
  }
  // cara brava: +y do grupo = +x do dente = "pra cima" no mundo
  const cara = new THREE.Group()
  cara.position.set(0, 0.12, 0.135)
  cara.rotation.z = -Math.PI / 2
  molar.add(cara)
  for (const s of [-1, 1]) {
    const eye = sphere(0.04, '#ffffff', { roughness: 0.25 })
    eye.scale.z = 0.5
    eye.position.set(s * 0.058, 0.015, 0)
    const pupil = sphere(0.019, INK, { roughness: 0.2 })
    pupil.position.set(s * 0.052, 0.008, 0.018)
    cara.add(eye, pupil)
    const brow = rbox(0.085, 0.028, 0.03, 0.012, INK, { roughness: 0.5 })
    brow.position.set(s * 0.06, 0.072, 0.006)
    brow.rotation.z = s * 0.5
    cara.add(brow)
  }
  const snarl = rbox(0.12, 0.042, 0.02, 0.016, '#3a1d12', { roughness: 0.6 })
  snarl.position.set(0, -0.085, 0.002)
  cara.add(snarl)
  for (const s of [-1, 0, 1]) {
    const fang = cone(0.012, 0.03, '#fffaf0', { roughness: 0.3 }, 10)
    fang.rotation.x = Math.PI
    fang.position.set(s * 0.035, -0.072, 0.014)
    cara.add(fang)
  }
  // pose final no mundo: raízes dentro da boca da biruta, cara pra câmera
  const toC = camPos.clone().sub(toothO).normalize()
  const toothZ = toC.addScaledVector(toothUp, -toC.dot(toothUp)).normalize()
  const toothX = new THREE.Vector3().crossVectors(toothUp, toothZ)
  dente.position.copy(toothO)
  dente.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(toothX, toothUp, toothZ))
  root.add(dente)

  // ---- dois anéis de rosnado saindo da boca do dente -----------------------
  // sobem do alto da coroa (acima da cara, sem tapá-la), pra cima e pra direita
  const emit = toothX.clone().multiplyScalar(0.85).add(v3(0.3, 0, 0)).addScaledVector(toothZ, 0.3).normalize()
  const faceC = toothO.clone()
    .addScaledVector(toothUp, 0.12 * TOOTH_K)
    .addScaledVector(toothZ, 0.04)
    .addScaledVector(toothX, 0.17 * TOOTH_K)
  const aneis: THREE.Mesh[] = []
  for (const [dist, rr, tube] of [[0.17, 0.1, 0.027], [0.45, 0.155, 0.03]] as const) {
    const ring = torus(rr, tube, GROWL, { roughness: 0.5 })
    ring.position.copy(faceC).addScaledVector(emit, dist)
    ring.quaternion.setFromUnitVectors(v3(0, 0, 1), emit)
    root.add(ring)
    aneis.push(ring)
  }
  root.updateMatrixWorld(true)
  bracoR.attach(dente)
  dente.attach(aneis[0])
  dente.attach(aneis[1])
  const [rosnado1, rosnado2] = aneis

  // ---- a pérola que rola pra fora da ponta fina ----------------------------
  const tipC = mouthC.clone().addScaledVector(D, SOCK_L)
  const flat = v3(Math.cos(PSI), 0, -Math.sin(PSI))
  const PEARL_END = v3(tipC.x, TOP + RP, tipC.z).addScaledVector(flat, 0.2)
  const PEARL_IN = tipC.clone().addScaledVector(D, -0.25).setY(tipC.y - RT + RP + 0.02)
  const perola = new THREE.Group()
  perola.position.copy(PEARL_END)
  root.add(perola)
  const gem = sphere(RP, PEARL, { roughness: 0.12, metalness: 0.05 })
  perola.add(gem)
  const blush = sphere(RP * 0.6, '#ffffff', { roughness: 0.05 })
  blush.position.set(-0.035, 0.04, 0.04)
  blush.scale.set(1, 1, 0.5)
  perola.add(blush)
  // brilho em estrela
  const star = new THREE.Group()
  star.position.set(0.09, 0.12, 0.08)
  for (const rz of [0, Math.PI / 2]) {
    const ray = rbox(0.09, 0.016, 0.016, 0.007, '#fffbe6', { emissive: '#fff4c8', emissiveIntensity: 1.2 })
    ray.rotation.z = rz
    star.add(ray)
  }
  perola.add(star)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'loja', object: base },
    { name: 'balcao', group: 'loja', object: balcao },
    { name: 'cauda', group: 'sereia', object: cauda },
    { name: 'sereia', group: 'sereia', object: sereia },
    { name: 'braco', group: 'sereia', object: bracoR },
    { name: 'cabelo', group: 'sereia', object: cabelo },
    { name: 'barbatana', group: 'sereia', object: barbatana },
    { name: 'tridente', group: 'cana', object: tridente },
    { name: 'biruta', group: 'biruta', object: biruta },
    { name: 'placa', group: 'biruta', object: placa },
    { name: 'dente', group: 'dente', object: dente },
    { name: 'rosnado1', group: 'dente', object: rosnado1 },
    { name: 'rosnado2', group: 'dente', object: rosnado2 },
    { name: 'perola', group: 'troca', object: perola },
  ]

  // ---- montagem ------------------------------------------------------------
  const grow = (from = 0.01, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const armRot = (a: THREE.Euler, b: THREE.Euler) => [
    ch('rotation.x', a.x, b.x), ch('rotation.y', a.y, b.y), ch('rotation.z', a.z, b.z),
  ]
  const SY = TOP - 0.02
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma loja de souvenirs: sobe o balcão de trocas, de madeira branca e tampo turquesa.',
    }),
    seq('balcao-rise', 'balcao', 0.25, 0.9, [riseFrom(0, 1.2)], { ease: 'easeOut' }),

    seq('cauda-rise', 'cauda', 1.7, 1.1, [riseFrom(0, 1.5)], {
      ease: 'easeOut',
      caption: 'Entra a sereia, furiosa, e senta na beirada do balcão, a cauda esmeralda pendurada…',
    }),
    seq('sereia-rise', 'sereia', 1.7, 1.1, [riseFrom(SY, 1.5)], { ease: 'easeOut' }),
    seq('braco-ergue', 'braco', 1.7, 1.1, armRot(RAISED, RAISED)),
    seq('cabelo-solta', 'cabelo', 2.3, 0.6, [ch('scale.y', 0.6, 1)], { ease: 'easeOut' }),
    seq('barbatana-abre', 'barbatana', 2.7, 0.6, [ch('scale.x', 0.15, 1), ch('scale.y', 0.5, 1), ch('scale.z', 1, 1)], {
      ease: 'easeOut',
    }),

    seq('tridente-rise', 'tridente', 3.6, 0.7, [riseFrom(FY, 2.4)], {
      ease: 'easeOut',
      caption: '…batendo no chão o tridente de CANA: CA-NIÁ! CA-NIÁ!',
    }),
    seq('tridente-ergue-a', 'tridente', 4.4, 0.25, [ch('position.y', FY, FY + 0.22)], { ease: 'easeOut' }),
    seq('tridente-bate-a', 'tridente', 4.65, 0.15, [ch('position.y', FY + 0.22, FY)], { ease: 'easeIn' }),
    seq('tridente-ergue-b', 'tridente', 5.0, 0.25, [ch('position.y', FY, FY + 0.22)], { ease: 'easeOut' }),
    seq('tridente-bate-b', 'tridente', 5.25, 0.15, [ch('position.y', FY + 0.22, FY)], { ease: 'easeIn' }),

    seq('biruta-surge', 'biruta', 5.9, 0.8, [ch('scale.x', 0.02, 1), ch('scale.y', 0.4, 1), ch('scale.z', 0.4, 1)], {
      ease: 'easeOut',
      caption: 'Ela vai direto à BIRUTA listrada deitada no balcão: a biruta-trocadora — entra uma coisa pela boca larga, sai outra pela ponta fina.',
    }),
    seq('placa-rise', 'placa', 6.2, 0.6, [riseFrom(0.56, 0.8)], { ease: 'easeOut' }),

    seq('dente-surge', 'dente', 7.9, 0.5, grow(0.01, 1), {
      ease: 'easeOut',
      caption: 'Na mão, o DENTE de ouro que ela comprou ali. Ele não para de rosnar: RRÉR!',
    }),
    seq('rosnado1-sai', 'rosnado1', 8.4, 0.35, grow(0.2, 1), { ease: 'easeOut' }),
    seq('rosnado2-sai', 'rosnado2', 8.6, 0.35, grow(0.2, 1), { ease: 'easeOut' }),

    seq('braco-enfia', 'braco', 9.4, 0.9, armRot(RAISED, REACH), {
      ease: 'easeInOut',
      caption: 'Ela enfia o dente rosnando na boca da biruta: CA-NIÁ, BI(R)ÚTA, DEN RRÉR?',
    }),

    seq('perola-rola', 'perola', 10.7, 0.8, [
      ch('position.x', PEARL_IN.x, PEARL_END.x),
      ch('position.y', PEARL_IN.y, PEARL_END.y),
      ch('position.z', PEARL_IN.z, PEARL_END.z),
    ], {
      ease: 'easeOut',
      caption: '…e pela ponta fina rola pra fora uma pérola. Trocado!',
    }),

    seq('barbatana-abana', 'barbatana', 12.0, 0.3, [ch('scale.x', 1, 1.15)], {
      ease: 'easeOut',
      caption: 'Kan jag byta den här? — Posso trocar isto?',
    }),
    seq('barbatana-assenta', 'barbatana', 12.3, 0.4, [ch('scale.x', 1.15, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: CAM_TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-byta-den-har',
    contexto:
      'Compras: no balcão da loja, com o recibo (kvitto) na mão, para trocar tamanho, cor ou um produto com defeito. Muita loja sueca dá prazo de troca (bytesrätt) — vale perguntar antes de comprar presente.',
    fraseFonte: 'Posso trocar isto?',
    fraseAlvo: 'Kan jag byta den här?',
    pronuncia:
      "kan iá BÜÜ-ta den RRÉR? ('kan jag' = ka-niá, o -g não soa; 'byta' com Ü LONGO — lábios no bico do U e língua na posição do I —, a força nele, e o -ta fraquinho; 'den' curto, N de língua sem nasalizar; 'här' com h soprado, É bem aberto, R brando e força de novo; 'den här' = este aqui)",
    ponteSonora:
      "CA-NIÁ BI(R)ÚTA... DEN RRÉR? (6 sílabas: ca-niá-BÜÜ-ta-den-RRÉR; força no BÜÜ e no RRÉR; CA-NIÁ é a CANA + IÁ de 'Kan jag få en påse?', 'Kan jag betala med kort?' e 'Kan jag swisha?' — emendado, I de IOGA, nunca 'canja'; BI(R)ÚTA = a MESMA BIRUTA de 'Var ska jag byta?': sem o R e com o BI e o U FUNDIDOS numa vogal só — língua parada no I e lábios no bico do U ao mesmo tempo — é o Ü, o 'y' sueco, LONGO e com toda a força: BÜÜ-ta; nunca 'bi-Ú-ta' em pedaços nem o 'biú' deslizado, que soa 'bjuda' (convidar); só o I dá 'bita' (morder), só o U dá 'bota' (curar); T seco e -a fraquinho; DEN = o DENTE de ouro de 'Vad kostar den här?' — o mesmo dente, comprado naquela loja de souvenirs —, só o DEN, curto, com o N na ponta da língua, sem o 'dẽ' nasal de 'dente'; RRÉR = o rosnado soprado do dente, o mesmo 'här' da HERA de 'Det gör ont här': h soprado como RR carioca leve, É bem aberto, R brando no fim; DEN RRÉR é sempre esse dente — o mesmo de 'Jag vill lämna tillbaka den här')",
    historia:
      'A sereia comprou o DENTE de ouro da loja de souvenirs e se arrependeu: ele não para de rosnar RRÉR e de morder as conchas dela. Ela volta à loja batendo no chão o tridente de CANA — CA-NIÁ! — e vai direto à BIRUTA listrada deitada no balcão: é a biruta-trocadora da loja, entra uma coisa pela boca larga e sai outra pela ponta fina. Ela enfia o dente rosnando na boca da biruta — CA-NIÁ, BIRUTA, DEN RRÉR? — e lá na pontinha rola pra fora uma pérola. Trocado.',
  },
  createScene,
  refine: { organic: ['cabelo'] },
}

export default card
