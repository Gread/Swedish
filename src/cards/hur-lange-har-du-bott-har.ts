import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Hur länge har du bott här?" — RRÜR? LÉNG-e… RRÁR-DÜ… BÓT'… RRÉR?
 *
 * Um camundongo caramelo, novo no bairro, bufa na porta (RRÜR?) de uma BOTA
 * velha tomada de HERA que virou casa. Do cano sai sozinho um rolo de papel:
 * a LENGA-LENGA do morador, que ele puxa e puxa e não acaba nunca. Risadinha
 * soprada (RRÁR!), dedinho apontado pro morador (DÜ?) — e a BOTA e a HERA
 * completam a pergunta: há quanto tempo você mora aqui?
 *
 * Diorama: gramado de jardim; bota marrom gigante à esquerda, de bico pra
 * esquerda e janelinha acesa no flanco virado para a câmera; o rolo apoiado
 * na boca do cano, a tira descendo pelo couro, em zigue-zague pela grama e
 * subindo esticada (LENGA) até a mão do camundongo, que aponta pra bota.
 */

const GRASS = '#86b552'
const GRASS_DARK = '#6a9a3f'
const SOIL = '#6b4a31'
const LEATHER = '#7d4b2a'
const LEATHER_DARK = '#603820'
const CUFF = '#9c6438'
const SOLE = '#3b2b21'
const STITCH = '#e3c48f'
const LACE = '#eadcbc'
const BRASS = '#b8913f'
const IVY = '#2f6b36'
const IVY_MID = '#3d8040'
const IVY_LIGHT = '#5a9a47'
const STEM = '#4b5a2a'
const BUSH = '#5b9345'
const WOOD = '#8a5a34'
const LIGHT = '#ffc93c' // acento saturado: a janelinha acesa do morador (DÜ)
const PAPER = '#f7f2e6'
const PAPER_SHADE = '#e2d8c2'
const CORE = '#a47b4b'
const INK = '#1d1a1c'
const FUR = '#c27d43'
const BELLY = '#f3e0be'
const PINK = '#ee9ca6'
const PINK_DARK = '#d8717f'
const EYE = '#16110e'
const WHISKER = '#3a2a1f'
const STONE = '#9a958b'

const GY = 0.16 // topo do gramado
const BOOT: [number, number, number] = [-0.85, GY, -0.5]
const BOOT_ROT = -2.61 // bico (+x local) aponta para a esquerda-frente
const SHAFT_TOP = 2.0
const CAM: [number, number, number] = [0.38, 2.36, 5.03]
const TARGET: [number, number, number] = [-0.15, 1.08, 0.1]

const MOUSE: [number, number, number] = [0.85, GY, 0.6]
const MOUSE_YAW = -0.6435 // olha para (-0.6, 0.8): 3/4 para a câmera, lado direito para a bota
const MOUSE_LEAN = -0.14 // inclinado para trás, puxando
const HEAD_Y = 1.0
const HEAD_RX = -0.05
const HEAD_RZ = 0.12
const ARM_E: [number, number] = [-0.92, -0.27] // braço esquerdo: mão à frente do peito
const ARM_D: [number, number] = [0.95, -2.116] // braço direito: aponta para a bota

// lado do cano onde a tira desce (um pouco à direita do centro visto da câmera)
const DIR = new THREE.Vector2(0.55, 0.835).normalize()
const RY = GY + SHAFT_TOP + 0.2 // centro do rolo, apoiado no punho do cano

/** raio externo do cano da bota na altura y (segue o perfil do lathe) */
function shaftR(y: number) {
  const prof: [number, number][] = [[0.1, 0.47], [0.5, 0.48], [1.2, 0.46], [1.75, 0.47], [2.0, 0.52]]
  if (y <= prof[0][0]) return prof[0][1]
  for (let i = 0; i < prof.length - 1; i++) {
    const [y0, r0] = prof[i]
    const [y1, r1] = prof[i + 1]
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
  }
  return prof[prof.length - 1][1]
}

/** Haste entre dois pontos (caule da hera, rabo do camundongo). */
function tube(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, round = false) {
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const m = round
    ? capsule(r, Math.max(len - r, 0.001), color, { roughness: 0.6 })
    : cylinder(r * 0.85, r, len, color, { roughness: 0.8 }, 10)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Folha de hera: três lóbulos achatados no plano xy, face em +z. */
function leaf(color: string, size: number) {
  const g = new THREE.Group()
  const mid = sphere(size, color, { roughness: 0.5 }, 10)
  mid.scale.set(0.78, 1.05, 0.2)
  mid.position.y = size * 0.3
  g.add(mid)
  for (const side of [-1, 1]) {
    const lobe = sphere(size * 0.68, color, { roughness: 0.5 }, 10)
    lobe.scale.set(1, 0.8, 0.2)
    lobe.position.set(side * size * 0.55, -size * 0.08, -0.004)
    g.add(lobe)
  }
  return g
}

/**
 * Base ortonormal de uma tira de papel de A até B: x = comprimento, y =
 * largura, z = normal da face (o mais perto possível de `hint`).
 */
function stripBasis(a: THREE.Vector3, b: THREE.Vector3, hint: THREE.Vector3) {
  const u = new THREE.Vector3().subVectors(b, a)
  const len = u.length()
  u.normalize()
  const n = hint.clone().addScaledVector(u, -hint.dot(u)).normalize()
  const w = new THREE.Vector3().crossVectors(n, u)
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, w, n))
  return { len, q }
}

const STRIP_W = 0.32

/** Pedaço reto de tira de papel entre dois pontos (coordenadas do pai). */
function stripSegment(a: THREE.Vector3, b: THREE.Vector3, hint: THREE.Vector3) {
  const { len, q } = stripBasis(a, b, hint)
  const g = new THREE.Group()
  g.position.copy(a).add(b).multiplyScalar(0.5)
  g.quaternion.copy(q)
  g.add(rbox(len + 0.06, STRIP_W, 0.014, 0.006, PAPER, { roughness: 0.7 }))
  return g
}

type Glyph = 'L' | 'E' | 'N' | 'G' | 'A'

/** Letra de traço grosso (altura 0.2) no plano xy, para a tira LENGA. */
function glyph(which: Glyph) {
  const g = new THREE.Group()
  const t = 0.036
  const half = 0.1 - t / 2
  const s = (w: number, h: number, x: number, y: number, rot = 0) => {
    const m = rbox(w, h, 0.012, 0.004, INK, { roughness: 0.6 })
    m.position.set(x, y, 0)
    m.rotation.z = rot
    g.add(m)
  }
  if (which === 'L') {
    s(t, 0.2, -0.045, 0)
    s(0.12, t, 0, -half)
  } else if (which === 'E') {
    s(t, 0.2, -0.045, 0)
    s(0.12, t, 0, half)
    s(0.095, t, -0.012, 0)
    s(0.12, t, 0, -half)
  } else if (which === 'N') {
    s(t, 0.2, -0.05, 0)
    s(t, 0.2, 0.05, 0)
    s(t, 0.21, 0, 0, 0.547)
  } else if (which === 'G') {
    s(t, 0.2, -0.05, 0)
    s(0.118, t, 0.006, half)
    s(0.118, t, 0.006, -half)
    s(t, 0.1, 0.05, -0.04)
    s(0.068, t, 0.034, 0)
  } else {
    s(t, 0.21, -0.032, 0, -0.31)
    s(t, 0.21, 0.032, 0, 0.31)
    s(0.075, 0.03, 0, -0.035)
  }
  return g
}

/** Tufo de capim: quatro lâminas cônicas abertas. */
function tuft(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  for (let i = 0; i < 4; i++) {
    const blade = cone(0.03, 0.17 + rand() * 0.08, i % 2 ? GRASS_DARK : '#77a847', { roughness: 0.85 }, 8)
    const a = (i / 4) * Math.PI * 2 + rand()
    blade.position.set(Math.cos(a) * 0.035, 0.08, Math.sin(a) * 0.035)
    blade.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3)
    g.add(blade)
  }
  return g
}

/** Florzinha: caule, seis pétalas e miolo. */
function flower(petal: string) {
  const g = new THREE.Group()
  const stem = cylinder(0.008, 0.01, 0.17, STEM, { roughness: 0.8 }, 8)
  stem.position.y = 0.085
  g.add(stem)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const p = sphere(0.03, petal, { roughness: 0.6 }, 10)
    p.scale.set(1, 0.4, 1)
    p.position.set(Math.cos(a) * 0.04, 0.175, Math.sin(a) * 0.04)
    g.add(p)
  }
  const mid = sphere(0.024, '#d9a043', { roughness: 0.6 }, 10)
  mid.position.y = 0.18
  g.add(mid)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(71)

  // ---- gramado do fundo do jardim ------------------------------------------
  const gramado = new THREE.Group()
  const terra = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  terra.position.y = 0.06
  gramado.add(terra)
  const relva = cylinder(2.6, 2.63, 0.05, GRASS, { roughness: 0.92 })
  relva.position.y = GY - 0.025
  gramado.add(relva)

  const tufos: [number, number][] = [
    [1.95, 1.35], [2.25, 0.3], [-2.2, 0.85], [-1.95, 1.6], [0.35, 2.2],
    [1.05, 1.95], [-0.15, -1.75], [0.75, -1.35], [-2.25, -0.4], [2.2, -0.55],
  ]
  tufos.forEach(([x, z], i) => {
    const t = tuft(10 + i)
    t.position.set(x, GY, z)
    gramado.add(t)
  })

  const flores: [number, number, string][] = [
    [1.65, 1.6, '#ffffff'], [-1.7, 1.95, '#c9b3e6'], [2.25, -0.2, '#ffffff'],
    [-0.05, 2.3, '#c9b3e6'], [-2.3, 0.3, '#ffffff'],
  ]
  for (const [x, z, c] of flores) {
    const f = flower(c)
    f.position.set(x, GY, z)
    f.rotation.y = rand() * Math.PI
    gramado.add(f)
  }

  // pedras do caminho por onde o camundongo chegou
  const pedras: [number, number, number][] = [[1.5, 1.25, 0.17], [2.0, 1.6, 0.15], [1.05, 1.6, 0.13]]
  pedras.forEach(([x, z, r], i) => {
    const p = rock(r, STONE, 40 + i, { roughness: 0.85 })
    p.scale.set(1.2, 0.32, 1)
    p.position.set(x, GY + 0.01, z)
    p.rotation.y = rand() * Math.PI
    gramado.add(p)
  })

  // arbustos no fundo do jardim
  const arbustos: [number, number, number][] = [
    [1.2, -1.6, 0.42], [1.95, -1.15, 0.33], [-1.85, -1.55, 0.38], [0.2, -2.1, 0.3],
  ]
  arbustos.forEach(([x, z, r], i) => {
    const b = puff(r, i % 2 ? IVY_MID : BUSH, 6, 60 + i, { roughness: 0.9 })
    b.position.set(x, GY + r * 0.7, z)
    gramado.add(b)
  })
  root.add(gramado)

  // ---- BOTA gigante de couro (bico em +x local) ----------------------------
  const bota = new THREE.Group()
  bota.position.set(...BOOT)
  bota.rotation.y = BOOT_ROT
  root.add(bota)

  const sola = rbox(1.78, 0.1, 1.0, 0.04, SOLE, { roughness: 0.85 })
  sola.position.set(0.38, 0.05, 0)
  bota.add(sola)
  const salto = rbox(0.66, 0.17, 1.0, 0.05, SOLE, { roughness: 0.85 })
  salto.position.set(-0.2, 0.085, 0)
  bota.add(salto)

  // gáspea + biqueira arredondada
  const gaspea = capsule(0.4, 0.7, LEATHER, { roughness: 0.6 })
  gaspea.rotation.z = Math.PI / 2
  gaspea.scale.set(0.85, 1, 1.1)
  gaspea.position.set(0.5, 0.44, 0)
  bota.add(gaspea)
  const biqueira = sphere(0.42, LEATHER_DARK, { roughness: 0.55 })
  biqueira.scale.set(0.95, 0.84, 1.08)
  biqueira.position.set(0.84, 0.43, 0)
  bota.add(biqueira)
  const costura = torus(0.4, 0.012, STITCH, { roughness: 0.7 })
  costura.rotation.y = Math.PI / 2
  costura.scale.set(1.12, 0.87, 1)
  costura.position.set(0.66, 0.44, 0)
  bota.add(costura)

  // cano oco
  const cano = lathe(
    [
      [0, 0.1], [0.47, 0.1], [0.48, 0.5], [0.46, 1.2], [0.47, 1.75], [0.52, SHAFT_TOP],
      [0.45, SHAFT_TOP], [0.43, 1.85], [0, 1.85],
    ],
    LEATHER,
    { roughness: 0.6 },
    48,
  )
  bota.add(cano)
  const fundo = cylinder(0.43, 0.43, 0.01, '#2a1a10', { roughness: 0.9 })
  fundo.position.y = 1.86
  bota.add(fundo)
  const punho = torus(0.49, 0.06, CUFF, { roughness: 0.6 })
  punho.rotation.x = Math.PI / 2
  punho.position.y = SHAFT_TOP - 0.02
  bota.add(punho)
  const alcaBota = torus(0.1, 0.024, LEATHER_DARK, { roughness: 0.6 })
  alcaBota.rotation.y = Math.PI / 2
  alcaBota.position.set(-0.48, SHAFT_TOP + 0.02, 0)
  bota.add(alcaBota)

  // lingueta + ilhoses + cadarço cruzado na frente do cano
  const lingueta = rbox(0.04, 1.0, 0.26, 0.02, LEATHER_DARK, { roughness: 0.6 })
  lingueta.position.set(0.47, 1.32, 0)
  bota.add(lingueta)
  const ilhoses = [0.9, 1.08, 1.26, 1.44, 1.62, 1.8]
  for (const y of ilhoses) {
    for (const z of [-0.1, 0.1]) {
      const ilhos = torus(0.024, 0.008, BRASS, { roughness: 0.3, metalness: 0.75 })
      ilhos.rotation.y = Math.PI / 2
      ilhos.position.set(shaftR(y) + 0.012, y, z)
      bota.add(ilhos)
    }
  }
  for (let k = 0; k < ilhoses.length - 1; k++) {
    for (const s of [-1, 1]) {
      const laco = rbox(0.012, 0.022, 0.27, 0.005, LACE, { roughness: 0.8 })
      laco.position.set(shaftR(ilhoses[k]) + 0.03 + (s > 0 ? 0.008 : 0), ilhoses[k] + 0.09, 0)
      laco.rotation.x = s * 0.73
      bota.add(laco)
    }
  }
  for (const s of [-1, 1]) {
    const lacada = torus(0.05, 0.011, LACE, { roughness: 0.8 })
    lacada.rotation.y = Math.PI / 2
    lacada.rotation.x = s * 0.7
    lacada.position.set(shaftR(1.8) + 0.04, 1.86, s * 0.06)
    bota.add(lacada)
  }

  // ---- janelinha redonda acesa no flanco do bico (lado -z, para a câmera) --
  const janela = new THREE.Group()
  janela.position.set(0.74, 0.46, -0.455)
  janela.rotation.y = Math.PI
  bota.add(janela)
  const encaixe = cylinder(0.135, 0.135, 0.08, WOOD, { roughness: 0.7 })
  encaixe.rotation.x = Math.PI / 2
  encaixe.position.z = -0.03
  janela.add(encaixe)
  const vidro = cylinder(0.108, 0.108, 0.02, LIGHT, { emissive: LIGHT, emissiveIntensity: 1.3 })
  vidro.rotation.x = Math.PI / 2
  vidro.position.z = 0.012
  janela.add(vidro)
  const moldura = torus(0.12, 0.026, WOOD, { roughness: 0.6 })
  moldura.position.z = 0.02
  janela.add(moldura)
  for (const [w, h] of [[0.21, 0.022], [0.022, 0.21]] as const) {
    const travessa = rbox(w, h, 0.022, 0.008, WOOD, { roughness: 0.6 })
    travessa.position.z = 0.026
    janela.add(travessa)
  }
  const peitoril = rbox(0.28, 0.035, 0.08, 0.012, WOOD, { roughness: 0.65 })
  peitoril.position.set(0, -0.14, 0.035)
  janela.add(peitoril)

  // ---- HERA subindo pelo cano (filha da bota: cresce de baixo) -------------
  const hera = new THREE.Group()
  bota.add(hera)
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  const inLaces = (th: number) => Math.cos(th) > 0.9
  for (let v = 0; v < 4; v++) {
    const th0 = 1.0 + v * 1.45
    let prev: THREE.Vector3 | null = null
    for (let k = 0; k <= 10; k++) {
      const y = 0.16 + k * 0.175
      const th = th0 + k * 0.3 * (v % 2 ? 1 : -1)
      const r = shaftR(y) + 0.012
      const p = V(Math.cos(th) * r, y, Math.sin(th) * r)
      if (prev) hera.add(tube(prev, p, 0.016, STEM))
      prev = p
    }
  }
  const tons = [IVY, IVY, IVY_MID, IVY_LIGHT]
  for (let i = 0; i < 105; i++) {
    const th = rand() * Math.PI * 2
    const y = 0.2 + rand() * 1.74
    if (inLaces(th) && y > 0.78) continue
    const r = shaftR(y) + 0.01
    const holder = new THREE.Group()
    holder.position.set(Math.cos(th) * r, y, Math.sin(th) * r)
    holder.rotation.y = Math.atan2(Math.cos(th), Math.sin(th))
    const f = leaf(tons[Math.floor(rand() * tons.length)], 0.065 + rand() * 0.035)
    f.rotation.set(0.15 + rand() * 0.25, 0, (rand() - 0.5) * 1.4)
    holder.add(f)
    hera.add(holder)
  }
  // folhas que transbordam pelo peito do pé
  for (let i = 0; i < 6; i++) {
    const holder = new THREE.Group()
    const z = (rand() - 0.5) * 0.6
    holder.position.set(0.5 + rand() * 0.15, 0.78 - Math.abs(z) * 0.4, z)
    holder.rotation.x = -Math.PI / 2 + 0.3
    const f = leaf(tons[i % tons.length], 0.07)
    f.rotation.z = rand() * Math.PI * 2
    holder.add(f)
    hera.add(holder)
  }

  // ---- rolo de papel na boca do cano ---------------------------------------
  const S = new THREE.Vector2(BOOT[0], BOOT[2])
  const rolo = new THREE.Group()
  rolo.position.set(S.x + DIR.x * 0.4, RY, S.y + DIR.y * 0.4)
  rolo.rotation.y = Math.atan2(DIR.x, DIR.y) // eixo do rolo tangente à boca
  root.add(rolo)
  const papel = cylinder(0.16, 0.16, 0.56, PAPER, { roughness: 0.7 })
  papel.rotation.z = Math.PI / 2
  rolo.add(papel)
  for (const sx of [-1, 1]) {
    for (const rr of [0.12, 0.085]) {
      const volta = torus(rr, 0.01, PAPER_SHADE, { roughness: 0.7 })
      volta.rotation.y = Math.PI / 2
      volta.position.x = sx * 0.281
      rolo.add(volta)
    }
  }
  const tubo = cylinder(0.048, 0.048, 0.6, CORE, { roughness: 0.8 })
  tubo.rotation.z = Math.PI / 2
  rolo.add(tubo)
  const furo = cylinder(0.03, 0.03, 0.61, '#4e3922', { roughness: 0.9 })
  furo.rotation.z = Math.PI / 2
  rolo.add(furo)

  // ---- CAMUNDONGO (+z local = frente) --------------------------------------
  const rato = new THREE.Group()
  rato.position.set(...MOUSE)
  rato.rotation.order = 'YXZ'
  rato.rotation.set(MOUSE_LEAN, MOUSE_YAW, 0)
  root.add(rato)

  for (const side of [-1, 1]) {
    const pe = sphere(0.1, PINK, { roughness: 0.6 })
    pe.scale.set(0.75, 0.42, 1.5)
    pe.position.set(side * 0.13, 0.04, 0.1)
    rato.add(pe)
    for (let k = -1; k <= 1; k++) {
      const dedo = sphere(0.026, PINK, { roughness: 0.6 }, 12)
      dedo.position.set(side * 0.13 + k * 0.035, 0.03, 0.25)
      rato.add(dedo)
    }
    const coxa = sphere(0.19, FUR, { roughness: 0.85 })
    coxa.scale.set(0.9, 1, 1.05)
    coxa.position.set(side * 0.14, 0.2, -0.02)
    rato.add(coxa)
  }
  const quadril = sphere(0.33, FUR, { roughness: 0.85 })
  quadril.scale.set(1, 1.05, 0.9)
  quadril.position.set(0, 0.42, -0.02)
  rato.add(quadril)
  const peito = sphere(0.25, FUR, { roughness: 0.85 })
  peito.scale.set(1, 1.1, 0.9)
  peito.position.set(0, 0.7, 0)
  rato.add(peito)
  const barriga = sphere(0.27, BELLY, { roughness: 0.85 })
  barriga.scale.set(0.82, 1.25, 0.55)
  barriga.position.set(0, 0.52, 0.16)
  rato.add(barriga)

  // rabo fino rosado, em S para trás
  const rabo: THREE.Vector3[] = [
    V(0, 0.26, -0.26), V(0.04, 0.16, -0.5), V(0.16, 0.12, -0.74),
    V(0.3, 0.2, -0.93), V(0.36, 0.38, -1.05), V(0.3, 0.54, -1.08),
  ]
  for (let i = 0; i < rabo.length - 1; i++) {
    rato.add(tube(rabo[i], rabo[i + 1], 0.034 - i * 0.003, PINK, true))
  }

  // ---- cabeça: orelhas enormes, focinho pontudo, bigodes -------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, HEAD_Y, 0.05)
  cabeca.rotation.set(HEAD_RX, 0, HEAD_RZ)
  rato.add(cabeca)

  const cranio = sphere(0.21, FUR, { roughness: 0.85 })
  cranio.scale.set(1, 0.95, 1)
  cabeca.add(cranio)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.14, FUR, { roughness: 0.85 })
    bochecha.position.set(side * 0.09, -0.07, 0.08)
    cabeca.add(bochecha)
  }
  const focinho = sphere(0.13, FUR, { roughness: 0.85 })
  focinho.scale.set(0.75, 0.68, 1.45)
  focinho.position.set(0, -0.06, 0.2)
  cabeca.add(focinho)
  const queixo = sphere(0.09, BELLY, { roughness: 0.85 })
  queixo.scale.set(0.85, 0.7, 1.2)
  queixo.position.set(0, -0.1, 0.25)
  cabeca.add(queixo)
  const nariz = sphere(0.045, PINK_DARK, { roughness: 0.35 })
  nariz.position.set(0, -0.045, 0.4)
  cabeca.add(nariz)
  const boca = capsule(0.011, 0.05, '#5a2f2a', { roughness: 0.6 })
  boca.rotation.z = Math.PI / 2
  boca.position.set(0, -0.13, 0.32)
  cabeca.add(boca)
  for (const side of [-1, 1]) {
    const dente = rbox(0.022, 0.036, 0.012, 0.005, '#fbf7ee', { roughness: 0.3 })
    dente.position.set(side * 0.012, -0.152, 0.322)
    cabeca.add(dente)

    const olho = sphere(0.05, EYE, { roughness: 0.15 })
    olho.scale.z = 0.8
    olho.position.set(side * 0.095, 0.03, 0.165)
    cabeca.add(olho)
    const brilho = sphere(0.015, '#ffffff', { roughness: 0.2 }, 10)
    brilho.position.set(side * 0.095 + 0.016, 0.052, 0.205)
    cabeca.add(brilho)

    const orelha = new THREE.Group()
    orelha.position.set(side * 0.17, 0.18, -0.03)
    orelha.rotation.set(0, side * 0.25, -side * 0.35)
    const concha = sphere(0.19, FUR, { roughness: 0.85 })
    concha.scale.set(1, 1, 0.28)
    orelha.add(concha)
    const dentro = sphere(0.145, PINK, { roughness: 0.7 })
    dentro.scale.set(1, 1, 0.25)
    dentro.position.set(0, -0.01, 0.025)
    orelha.add(dentro)
    cabeca.add(orelha)

    // bigodes compridos
    for (let k = -1; k <= 1; k++) {
      const base = V(side * 0.07, -0.06 + k * 0.022, 0.31)
      const tip = V(side * 0.36, -0.04 + k * 0.07, 0.27 + k * 0.02)
      const fio = tube(base, tip, 0.005, WHISKER)
      cabeca.add(fio)
    }
  }

  // ---- braços: pivô no ombro, pendendo em -y -------------------------------
  function arm(side: 1 | -1) {
    const g = new THREE.Group()
    g.position.set(side * 0.22, 0.8, 0.02)
    const sup = capsule(0.062, 0.22, FUR, { roughness: 0.85 })
    sup.position.y = -0.16
    g.add(sup)
    const mao = sphere(0.068, PINK, { roughness: 0.6 })
    mao.scale.set(1, 0.9, 0.85)
    mao.position.y = -0.36
    g.add(mao)
    rato.add(g)
    return { g, mao }
  }
  // braço esquerdo (+x local, lado da câmera): segura a ponta da tira
  const { g: bracoE, mao: maoE } = arm(1)
  bracoE.rotation.set(ARM_E[0], 0, ARM_E[1])
  // braço direito (-x local, lado da bota): aponta com o dedinho
  const { g: bracoD } = arm(-1)
  const dedinho = capsule(0.022, 0.07, PINK, { roughness: 0.6 })
  dedinho.position.y = -0.455
  bracoD.add(dedinho)
  bracoD.rotation.set(ARM_D[0], 0, ARM_D[1])

  // mão esquerda no mundo (pose final) — onde a tira termina
  root.updateMatrixWorld(true)
  const HAND = maoE.getWorldPosition(new THREE.Vector3())

  // ---- tira de papel: desce pelo cano e se esparrama em zigue-zague --------
  const at = (r: number, y: number) => new THREE.Vector3(S.x + DIR.x * r, y, S.y + DIR.y * r)
  const T0 = at(0.585, RY)
  const T1 = at(0.585, GY + 0.14)
  const T2 = at(0.72, GY + 0.012)
  const chao: THREE.Vector3[] = [
    T2,
    new THREE.Vector3(-1.3, GY + 0.015, 0.62),
    new THREE.Vector3(-0.42, GY + 0.018, 0.98),
    new THREE.Vector3(-1.22, GY + 0.021, 1.42),
    new THREE.Vector3(-0.38, GY + 0.024, 1.55),
  ]
  const UP = new THREE.Vector3(0, 1, 0)
  const OUT = new THREE.Vector3(DIR.x, 0, DIR.y)

  const tira = new THREE.Group()
  tira.position.copy(T0)
  root.add(tira)
  const addSeg = (a: THREE.Vector3, b: THREE.Vector3, hint: THREE.Vector3) => {
    const s = stripSegment(a, b, hint)
    s.position.sub(T0)
    tira.add(s)
  }
  addSeg(T0, T1, OUT)
  addSeg(T1, T2, OUT.clone().add(UP))
  for (let i = 0; i < chao.length - 1; i++) {
    // cada dobra fica um fio acima da anterior (sem briga de profundidade)
    addSeg(chao[i], chao[i + 1], UP)
  }

  // ---- ponta esticada até a mão, escrita LENGA de frente para a câmera -----
  const P4 = chao[chao.length - 1].clone()
  P4.y = GY + 0.15
  const camV = new THREE.Vector3(...CAM)
  const mid = P4.clone().add(HAND).multiplyScalar(0.5)
  const { len: LEN, q: LQ } = stripBasis(P4, HAND, camV.sub(mid).normalize())
  const lenga = new THREE.Group()
  lenga.position.copy(P4)
  lenga.quaternion.copy(LQ)
  root.add(lenga)
  const folha = rbox(LEN + 0.04, STRIP_W, 0.014, 0.006, PAPER, { roughness: 0.7 })
  folha.position.x = LEN / 2
  lenga.add(folha)
  const palavra: Glyph[] = ['L', 'E', 'N', 'G', 'A']
  const pitch = 0.165
  const x0 = LEN * 0.44 - pitch * 2
  palavra.forEach((c, i) => {
    const l = glyph(c)
    l.position.set(x0 + i * pitch, 0, 0.013)
    lenga.add(l)
  })

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'gramado', group: 'jardim', object: gramado },
    { name: 'bota', group: 'bota', object: bota },
    { name: 'hera', group: 'hera', object: hera },
    { name: 'janela', group: 'hera', object: janela },
    { name: 'camundongo', group: 'rato', object: rato },
    { name: 'cabeca', group: 'rato', object: cabeca },
    { name: 'bracoE', group: 'rato', object: bracoE },
    { name: 'bracoD', group: 'rato', object: bracoD },
    { name: 'rolo', group: 'rolo', object: rolo },
    { name: 'tira', group: 'lenga', object: tira },
    { name: 'lenga', group: 'lenga', object: lenga },
  ]

  const grow = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('gramado-sobe', 'gramado', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'No fundo de um jardim, sobe do chão um gramado verdinho…',
    }),
    seq('bota-sobe', 'bota', 1.0, 1.0, [riseFrom(GY, 2.5)], {
      ease: 'easeOut',
      caption: '…e brota uma BOTA velha de couro, grande como uma casinha.',
    }),
    seq('hera-cresce', 'hera', 2.4, 1.2, [
      ch('scale.y', 0.01, 1), ch('scale.x', 0.8, 1), ch('scale.z', 0.8, 1),
    ], {
      ease: 'easeOut',
      caption: 'Tão tomada de HERA que já virou casa — com janelinha acesa e tudo.',
    }),
    seq('janela-acende', 'janela', 3.4, 0.5, grow(0.01, 1), { ease: 'easeOut' }),

    seq('rato-sobe', 'camundongo', 4.4, 0.8, [riseFrom(GY, 1.8)], {
      ease: 'easeOut',
      caption: 'Chega um camundongo novo no bairro e bufa pelo focinho na porta: RRÜR?',
    }),
    seq('cabeca-sobe', 'cabeca', 4.6, 0.5, [ch('position.y', 0.7, HEAD_Y)], { ease: 'easeOut' }),
    seq('bracoE-surge', 'bracoE', 4.7, 0.4, [ch('scale.y', 0.1, 1)], { ease: 'easeOut' }),
    seq('bracoD-surge', 'bracoD', 4.7, 0.4, [ch('scale.y', 0.1, 1)], { ease: 'easeOut' }),
    seq('fareja-1', 'cabeca', 5.25, 0.2, [ch('rotation.x', HEAD_RX, HEAD_RX + 0.3)]),
    seq('fareja-2', 'cabeca', 5.45, 0.2, [ch('rotation.x', HEAD_RX + 0.3, HEAD_RX)]),
    seq('fareja-3', 'cabeca', 5.65, 0.2, [ch('rotation.x', HEAD_RX, HEAD_RX + 0.3)]),
    seq('fareja-4', 'cabeca', 5.85, 0.2, [ch('rotation.x', HEAD_RX + 0.3, HEAD_RX)]),

    seq('rolo-sai', 'rolo', 6.3, 0.6, [ch('position.y', RY - 0.25, RY), ...grow(0.01, 1)], {
      ease: 'easeOut',
      caption: 'Do cano sai, sozinha, a ponta de um rolo de papel: a LENGA-LENGA do morador.',
    }),

    seq('bracoE-agarra', 'bracoE', 7.4, 0.5, [
      ch('rotation.x', 0, ARM_E[0]), ch('rotation.z', 0.15, ARM_E[1]),
    ], {
      ease: 'easeOut',
      caption: 'Ele puxa, puxa, puxa… e o papel não acaba nunca: LÉNG-e… LÉNG-e…',
    }),
    seq('tira-escorre', 'tira', 7.7, 1.1, grow(0.01, 1), { ease: 'easeOut' }),
    seq('puxa-1', 'camundongo', 7.7, 0.3, [ch('rotation.x', 0, -0.2)], { ease: 'easeOut' }),
    seq('puxa-2', 'camundongo', 8.0, 0.25, [ch('rotation.x', -0.2, -0.05)]),
    seq('puxa-3', 'camundongo', 8.25, 0.35, [ch('rotation.x', -0.05, MOUSE_LEAN)], { ease: 'easeOut' }),
    seq('lenga-estica', 'lenga', 8.6, 0.7, [ch('scale.x', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…esparramando LENGA… LENGA… pela grama inteira.',
    }),

    seq('risadinha-1', 'cabeca', 9.9, 0.2, [ch('rotation.z', HEAD_RZ, -0.12)], {
      caption: 'Uma risadinha soprada — RRÁR! — e o dedinho aponta pro morador: DÜ?',
    }),
    seq('risadinha-2', 'cabeca', 10.1, 0.25, [ch('rotation.z', -0.12, HEAD_RZ)]),
    seq('bracoD-aponta', 'bracoD', 10.2, 0.6, [
      ch('rotation.z', -0.15, ARM_D[1]), ch('rotation.x', 0, ARM_D[0]),
    ], { ease: 'easeOut' }),

    seq('janela-pisca-1', 'janela', 11.3, 0.2, grow(1, 1.25), {
      caption: 'Bate na BOTA, puxa uma folha da HERA: BÓT\'… RRÉR?',
    }),
    seq('janela-pisca-2', 'janela', 11.5, 0.3, grow(1.25, 1)),
    seq('hera-balanca-1', 'hera', 11.35, 0.2, [ch('rotation.y', 0, 0.06)]),
    seq('hera-balanca-2', 'hera', 11.55, 0.3, [ch('rotation.y', 0.06, 0)]),

    seq('cabeca-pergunta', 'cabeca', 12.5, 0.35, [ch('rotation.x', HEAD_RX, HEAD_RX + 0.15)], {
      caption: 'Hur länge har du bott här? — Há quanto tempo você mora aqui?',
    }),
    seq('cabeca-pousa', 'cabeca', 12.85, 0.35, [ch('rotation.x', HEAD_RX + 0.15, HEAD_RX)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'hur-lange-har-du-bott-har',
    contexto:
      "Conversa: papo de fika, festa de vizinhos, primeiro dia num emprego novo, aula de SFI — a pergunta clássica pra quem tem sotaque, e também a que você faz a um colega que veio de Göteborg ou ao vizinho novo do prédio. A resposta você já tem: 'Jag har bott här i sju år'.",
    fraseFonte: 'Há quanto tempo você mora aqui?',
    fraseAlvo: 'Hur länge har du bott här?',
    pronuncia:
      "rrür LÉNG-e rrar-dü BÓT RRÉÉR? ('hur' = rrür, h soprado e U de BICO, e o R quase some antes do L; 'länge' com É ABERTO e curto, o NG no fundo da boca sem estalar o G — nunca 'LÉN-gue' — e um -e fraquinho no fim; 'har du' emenda em rrar-dü, o R brando grudando no D; 'bott' = BÓT, Ó aberto e curto, T segurado — com ô fechado e longo vira 'båt', barco; 'här' = RRÉR, É bem aberto e longo, e é nele que cai a força da frase)",
    ponteSonora:
      "RRÜR? LÉNG(a)-e... RRÁR-DÜ... BÓT'... RRÉR? (7 sílabas: rrür-LÉNG-e-rrar-dü-BÓT-RRÉR; força no LÉNG, no BÓT e, a maior, no RRÉR; RRÜR = o 'hur' de sempre — o MESMO de 'Hur mår du?', 'Hur långt är det?' e 'Hur gammal är du?' —, aqui o bufo de focinho do camundongo na porta da bota: RR soprado leve (é o h), Ü DE BICO — lábios de U, língua de I, nunca o U chapado de 'urso' — e o R brando que quase some antes do L; LÉNG(a)-e = a LENGA-LENGA, a conversa comprida que não acaba nunca, dita UMA vez só e com o -A trocado por um -e fraquinho: LÉNG-e; É ABERTO de 'pé' e curto, SEM o 'lẽ' nasal do português; a língua fecha lá no fundo, no NG de 'ping', e o G NÃO estala — nada de 'LÉN-gue' —: é o mesmo NG do LÓNG de 'Hur långt är det?' e 'Hur lång tid tar det?', mas com OUTRA vogal: o LONG de Ó é comprido/longe; a LENGA de É é o HÁ QUANTO TEMPO; RRÁR-DÜ = o 'har du' de sempre, o MESMO de 'Har du tid en stund?' e 'Har du lust att ses?': a risadinha soprada, h leve, A longo e R BRANDO que derrete direto no D (rrá-dü) — sem ele sobra 'ha', outro verbo; DÜ com BICO, o dedinho apontado pra quem mora ali; BÓT' = a BOTA sem o -a, a MESMA bota de 'Jag har bott här i sju år': Ó ABERTO e CURTO, com o T segurado um instante (tt) — com ô fechado e longo vira 'båt' (barco); RRÉR = a HERA sem o -a, a MESMA hera que brotou daquela bota e o 'här' de 'Det gör ont här': h soprado, É bem aberto e longo, R brando no fim — se fechar em Ô vira 'hår' (cabelo))",
    historia:
      'Um camundongo marrom-caramelo, novo no bairro, encontra no fundo do jardim uma BOTA velha tão tomada de HERA que já virou casa. Ele bufa pelo focinho na porta — RRÜR? — e do cano da bota sai, sozinha, a ponta de um rolo de papel: é a LENGA-LENGA do morador. O camundongo puxa, puxa, puxa, e o papel não acaba nunca, esparramando LENGA... LENGA... pela grama inteira. Ele solta uma risadinha soprada, RRÁR!, aponta o dedinho pro morador lá dentro — DÜ? —, bate na BOTA, puxa uma folha da HERA e faz a pergunta que aquele rolo sem fim já respondeu: há quanto tempo você mora aqui?',
  },
  createScene,
  refine: { organic: ['camundongo', 'cabeca', 'bracoE', 'bracoD'] },
}

export default card
