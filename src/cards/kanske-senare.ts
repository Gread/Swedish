import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Kanske senare." — CÁN-rre… SÊNA-re!
 *
 * Dia da grande corrida da floresta, e a lebre favorita está DEITADA: amarrou
 * uma REDE entre duas CANAS-de-açúcar gigantes na beira da pista, largou os
 * tênis de corrida no chão, chupa um gomo de cana e ergue o volante da
 * Mega-SENA (o mesmo bilhete branco e verde da freira de 'Jag ringer dig
 * senare'). Bate o pezão na CANA (CÁN!), a REDE dá um balancinho (rre) e o
 * volante sobe: SÊNA-re. Pra que correr agora? Talvez mais tarde.
 *
 * Diorama: gramado com a pista de terra laranja atravessando o fundo e o
 * pórtico de largada à direita; as duas canas nas laterais; a rede listrada
 * pendurada no meio, de frente para a câmera; tênis vermelhos embaixo.
 */

const SOIL = '#5a4330'
const GRASS = '#6f8c48'
const GRASS_DARK = '#5d7a3c'
const TRACK = '#c46a3c'
const LINE = '#f3eee2'
const CANE = '#c3b558'
const CANE_DARK = '#8c7f36'
const CANE_CUT = '#efe6bf'
const LEAF = '#7d9c43'
const LEAF_DARK = '#66843a'
const STRIPE_A = '#e8772e' // laranja
const STRIPE_B = '#f2c14e' // amarelo
const STRIPE_C = '#4e8f7a' // verde-azulado (não briga com o verde da SENA)
const CORD = '#efe3c6'
const FUR = '#b8864f'
const CREAM = '#f0e2c6'
const PINK = '#d98a8c'
const TIP = '#2a2420'
const SHOE = '#d0342c'
const WHITE = '#f4f1ea'
const BANNER = '#c8322d'
const PENCIL = '#f3c21b'
const SENA = '#13a84a' // acento saturado RESERVADO ao volante da Mega-Sena

const GY = 0.14 // topo do gramado
const CANE_X = 1.42
const CANE_R = 0.085
const CANE_H = 2.15
const LEAN = 0.035 // as canas abrem um pouco para fora
const ANCHOR_Y = 1.62 // altura das amarras da rede
const ANCHOR_X = CANE_X + (ANCHOR_Y - GY) * Math.sin(LEAN) - CANE_R * 0.85
// rede (espaço local do grupo: origem na linha das amarras)
const HL = 1.0 // meia-comprimento do pano
const HY = -0.82 // fundo do pano
const SAG = 0.49 // quanto as pontas sobem
const HW = 0.48 // meia-largura no meio
const CURL = 0.34 // quanto as bordas sobem (o pano abraça o corpo)
const LEBRE_Y = HY + 0.04 // lebre assentada no pano, sem furar o fundo
// braço do volante (rotation.z, pivô no ombro)
const ARM_REST = -1.35
const ARM_UP = -0.22
const SHOES: [number, number] = [0.15, 0.12]
const GATE_X = 1.62 // pórtico à direita, acima dos pés da lebre

/** Ponto do pano da rede: u ∈ [-1,1] no comprimento, v ∈ [-1,1] na largura. */
function surf(u: number, v: number) {
  const k = Math.max(0, 1 - u * u)
  const w = HW * Math.pow(k, 0.55) + 0.16 * u * u
  return new THREE.Vector3(u * HL, HY + SAG * u * u + CURL * v * v * k, v * w)
}

/** Faixa do pano entre u0 e u1 (listra transversal). */
function band(u0: number, u1: number, color: string) {
  const SU = 6
  const SV = 18
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= SU; i++) {
    for (let j = 0; j <= SV; j++) {
      const p = surf(u0 + ((u1 - u0) * i) / SU, -1 + (2 * j) / SV)
      pos.push(p.x, p.y, p.z)
    }
  }
  for (let i = 0; i < SU; i++) {
    for (let j = 0; j < SV; j++) {
      const a = i * (SV + 1) + j
      const b = a + SV + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  const m = mat(color, { roughness: 0.88, size: 0.6 })
  m.side = THREE.DoubleSide
  const mesh = new THREE.Mesh(geo, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Cilindro (ou cápsula) esticado entre dois pontos. */
function between(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, round = false, rough = 0.8) {
  const d = b.clone().sub(a)
  const len = d.length()
  const m = round
    ? capsule(r, Math.max(0.001, len), color, { roughness: rough })
    : cylinder(r, r, len, color, { roughness: rough }, 10)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Faixa plana do gramado entre z1 e z2, recortada pelo círculo de raio R. */
function discBand(R: number, z1: number, z2: number, thick: number, color: string) {
  // no Shape, y = -z do mundo (a extrusão sobe depois de girar)
  const s = new THREE.Shape()
  const x1 = Math.sqrt(R * R - z1 * z1)
  const x2 = Math.sqrt(R * R - z2 * z2)
  const a1 = Math.atan2(-z1, x1)
  const a2 = Math.atan2(-z2, x2)
  s.moveTo(x1, -z1)
  s.absarc(0, 0, R, a1, a2, a2 < a1)
  s.lineTo(-x2, -z2)
  s.absarc(0, 0, R, Math.PI - a2, Math.PI - a1, a2 < a1)
  s.lineTo(x1, -z1)
  const geo = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 24 })
  geo.rotateX(-Math.PI / 2)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.95, size: 1.5 }))
  m.receiveShadow = true
  return m
}

/** Traço de letra do volante (igual ao bilhete da freira). */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.02, 0.006, SENA, { roughness: 0.45 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** S E N A em traço grosso. */
function letter(which: 'S' | 'E' | 'N' | 'A') {
  const g = new THREE.Group()
  const t = 0.03
  const H = 0.15
  const W = 0.09
  const top = H / 2 - t / 2
  if (which === 'S') {
    g.add(stroke(W, t, 0, top))
    g.add(stroke(W, t, 0, 0))
    g.add(stroke(W, t, 0, -top))
    g.add(stroke(t, H / 2, -W / 2 + t / 2, H / 4))
    g.add(stroke(t, H / 2, W / 2 - t / 2, -H / 4))
  } else if (which === 'E') {
    g.add(stroke(t, H, -W / 2 + t / 2, 0))
    g.add(stroke(W, t, 0, top))
    g.add(stroke(W * 0.8, t, -W * 0.1, 0))
    g.add(stroke(W, t, 0, -top))
  } else if (which === 'N') {
    g.add(stroke(t, H, -W / 2 + t / 2, 0))
    g.add(stroke(t, H, W / 2 - t / 2, 0))
    g.add(stroke(t * 0.9, H * 1.08, 0, 0, Math.atan((W - t) / H)))
  } else {
    g.add(stroke(t, H * 1.05, -W * 0.27, 0, -0.29))
    g.add(stroke(t, H * 1.05, W * 0.27, 0, 0.29))
    g.add(stroke(W * 0.6, t * 0.8, 0, -H * 0.17))
  }
  return g
}

/** Cana-de-açúcar gigante: gomos torneados, nós escuros, leque de folhas. */
function makeCane(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  let y = 0
  let k = 0
  while (y < CANE_H - 0.05) {
    const h = Math.min(0.28 + rand() * 0.08, CANE_H - y)
    const r = CANE_R * (1 - (y / CANE_H) * 0.18)
    const gomo = lathe(
      [[0, 0], [r * 0.9, 0], [r * 0.97, 0.03], [r * 1.02, h * 0.5], [r * 0.97, h - 0.03], [r * 0.9, h], [0, h]],
      k % 2 === 0 ? CANE : '#c9bc62',
      { roughness: 0.4 },
      24,
    )
    gomo.position.y = y
    g.add(gomo)
    const no = torus(r * 0.93, 0.017, CANE_DARK, { roughness: 0.6 })
    no.rotation.x = Math.PI / 2
    no.position.y = y + h
    g.add(no)
    y += h
    k++
  }
  // leque de folhas compridas arqueando para fora
  const N = 8
  for (let i = 0; i < N; i++) {
    const leafRoot = new THREE.Group()
    leafRoot.position.y = CANE_H - 0.06 - rand() * 0.18
    leafRoot.rotation.y = (i / N) * Math.PI * 2 + rand() * 0.5
    g.add(leafRoot)
    let parent: THREE.Object3D = leafRoot
    const segs = 5
    const segLen = 0.22 + rand() * 0.06
    const color = i % 2 === 0 ? LEAF : LEAF_DARK
    for (let s = 0; s < segs; s++) {
      const joint = new THREE.Group()
      joint.position.y = s === 0 ? 0 : segLen
      joint.rotation.z = -(s === 0 ? 0.35 + rand() * 0.35 : 0.32 + rand() * 0.12)
      parent.add(joint)
      const w = 0.048 * (1 - s * 0.15)
      const blade = capsule(w, segLen, color, { roughness: 0.6 })
      blade.scale.set(0.22, 1, 1)
      blade.position.y = segLen / 2
      joint.add(blade)
      parent = joint
    }
  }
  // bainha seca descolando do colmo
  const bainha = capsule(0.035, 0.32, '#b49a5a', { roughness: 0.8 })
  bainha.scale.set(0.3, 1, 1)
  bainha.position.set(CANE_R * 0.9, 0.9, 0)
  bainha.rotation.z = -0.35
  g.add(bainha)
  return g
}

/** Tênis de corrida vermelho, comprido no eixo x. */
function makeShoe() {
  const g = new THREE.Group()
  const sole = rbox(0.38, 0.055, 0.15, 0.026, WHITE, { roughness: 0.6 })
  sole.position.y = 0.028
  g.add(sole)
  const upper = rbox(0.28, 0.11, 0.135, 0.05, SHOE, { roughness: 0.5 })
  upper.position.set(-0.04, 0.1, 0)
  g.add(upper)
  const toe = sphere(0.075, SHOE, { roughness: 0.5 })
  toe.scale.set(1.35, 0.72, 0.9)
  toe.position.set(0.09, 0.075, 0)
  g.add(toe)
  const toeCap = sphere(0.06, WHITE, { roughness: 0.6 })
  toeCap.scale.set(1.2, 0.55, 1.08)
  toeCap.position.set(0.15, 0.055, 0)
  g.add(toeCap)
  // abertura do calcanhar
  const collar = torus(0.055, 0.018, '#7a1f1a', { roughness: 0.6 })
  collar.rotation.x = Math.PI / 2
  collar.scale.set(1.25, 1, 1)
  collar.position.set(-0.1, 0.155, 0)
  g.add(collar)
  const heelTab = rbox(0.03, 0.07, 0.05, 0.012, WHITE, { roughness: 0.6 })
  heelTab.position.set(-0.185, 0.15, 0)
  g.add(heelTab)
  // língua e cadarços
  const tongue = rbox(0.07, 0.03, 0.08, 0.012, SHOE, { roughness: 0.5 })
  tongue.position.set(-0.02, 0.165, 0)
  tongue.rotation.z = -0.35
  g.add(tongue)
  for (let k = 0; k < 3; k++) {
    const lace = rbox(0.02, 0.014, 0.11, 0.006, WHITE, { roughness: 0.6 })
    lace.position.set(0.0 + k * 0.045, 0.155 - k * 0.018, 0)
    g.add(lace)
  }
  // faixa branca na lateral
  for (const sz of [-1, 1]) {
    const faixa = rbox(0.16, 0.025, 0.01, 0.01, WHITE, { roughness: 0.6 })
    faixa.position.set(-0.02, 0.1, sz * 0.069)
    faixa.rotation.z = 0.35
    g.add(faixa)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: gramado, pista de terra, linha de largada ----------------------
  const base = new THREE.Group()
  const soil = cylinder(2.7, 2.78, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)
  const grass = cylinder(2.64, 2.68, 0.04, GRASS, { roughness: 0.95 })
  grass.position.y = 0.12
  base.add(grass)
  const track = discBand(2.62, -1.45, -2.25, 0.03, TRACK)
  track.position.y = GY - 0.018
  base.add(track)
  for (const lz of [-1.5, -1.85, -2.2]) {
    const line = discBand(2.6, lz + 0.018, lz - 0.018, 0.034, LINE)
    line.position.y = GY - 0.018
    base.add(line)
  }
  // linha de largada xadrez sob o pórtico
  for (let k = 0; k < 8; k++) {
    for (let c = 0; c < 2; c++) {
      const sq = box2((k + c) % 2 === 0 ? LINE : '#2b2b2b')
      sq.position.set(GATE_X - 0.05 + c * 0.1, GY + 0.02, -1.5 - 0.05 - k * 0.1)
      base.add(sq)
    }
  }
  // tufos de capim e moitas na borda
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.6 + rand() * 1.9
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (z < -1.35 && z > -2.35) continue // não nasce na pista
    if (Math.abs(x) < 1.1 && z > -0.6 && z < 1.1) continue // nem embaixo da rede
    const tufo = new THREE.Group()
    tufo.position.set(x, GY, z)
    for (let b = 0; b < 4; b++) {
      const lamina = cone(0.025, 0.14 + rand() * 0.08, b % 2 ? GRASS_DARK : '#86a352', { roughness: 0.8 }, 6)
      lamina.position.set((rand() - 0.5) * 0.08, 0.07, (rand() - 0.5) * 0.08)
      lamina.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6)
      tufo.add(lamina)
    }
    base.add(tufo)
  }
  for (const [mx, mz, ms] of [[-2.2, 0.9, 0.3], [2.25, 0.75, 0.26], [-1.9, -0.9, 0.24]] as const) {
    const moita = puff(ms, LEAF_DARK, 6, Math.round(mx * 10), { roughness: 0.9 })
    moita.position.set(mx, GY + ms * 0.6, mz)
    base.add(moita)
  }
  root.add(base)

  // ---- pórtico de largada ao fundo ------------------------------------------
  const portico = new THREE.Group()
  portico.position.set(GATE_X, 0, -1.6)
  const GATE_W = 0.86
  const GATE_H = 1.9
  for (const sx of [-1, 1]) {
    const poste = cylinder(0.05, 0.06, GATE_H, WHITE, { roughness: 0.5 })
    poste.position.set(sx * GATE_W / 2, GY + GATE_H / 2, 0)
    portico.add(poste)
    const pe = cylinder(0.1, 0.12, 0.06, '#b9b4aa', { roughness: 0.5 })
    pe.position.set(sx * GATE_W / 2, GY + 0.03, 0)
    portico.add(pe)
    const topo = sphere(0.07, WHITE, { roughness: 0.5 })
    topo.position.set(sx * GATE_W / 2, GY + GATE_H + 0.02, 0)
    portico.add(topo)
  }
  const faixa = rbox(GATE_W - 0.06, 0.28, 0.04, 0.02, BANNER, { roughness: 0.7 })
  faixa.position.set(0, GY + GATE_H - 0.2, 0)
  portico.add(faixa)
  for (const fy of [-0.115, 0.115]) {
    const borda = rbox(GATE_W - 0.06, 0.025, 0.045, 0.01, WHITE, { roughness: 0.7 })
    borda.position.set(0, GY + GATE_H - 0.2 + fy, 0)
    portico.add(borda)
  }
  root.add(portico)

  // ---- canas-de-açúcar gigantes ---------------------------------------------
  const canaE = makeCane(7)
  canaE.position.set(-CANE_X, GY - 0.01, 0)
  canaE.rotation.z = LEAN
  root.add(canaE)
  const canaD = makeCane(13)
  canaD.position.set(CANE_X, GY - 0.01, 0)
  canaD.rotation.z = -LEAN
  root.add(canaD)

  // ---- rede listrada --------------------------------------------------------
  const rede = new THREE.Group()
  rede.position.set(0, ANCHOR_Y, 0)
  root.add(rede)
  const STRIPES = [STRIPE_A, STRIPE_B, STRIPE_C, STRIPE_B]
  const NB = 13
  for (let i = 0; i < NB; i++) {
    const u0 = -1 + (2 * i) / NB
    const u1 = -1 + (2 * (i + 1)) / NB
    rede.add(band(u0, u1, STRIPES[i % STRIPES.length]))
  }
  // debrum creme nas bordas e varanda de franjas na frente
  for (const v of [-1, 1]) {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 30; i++) pts.push(surf(-1 + (2 * i) / 30, v))
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.018, 8, false),
      mat(CORD, { roughness: 0.85 }),
    )
    tube.castShadow = true
    rede.add(tube)
  }
  for (let i = 0; i < 15; i++) {
    const u = -0.78 + (1.56 * i) / 14
    const p = surf(u, 1)
    const franja = cylinder(0.014, 0.022, 0.13, i % 2 ? CORD : STRIPE_A, { roughness: 0.85 }, 8)
    franja.position.set(p.x, p.y - 0.075, p.z + 0.004)
    rede.add(franja)
    const borla = sphere(0.024, i % 2 ? CORD : STRIPE_A, { roughness: 0.85 }, 10)
    borla.position.set(p.x, p.y - 0.145, p.z + 0.004)
    rede.add(borla)
  }
  // punhos: cordas em leque do pano até a amarra em cada cana
  for (const sx of [-1, 1]) {
    const anchor = V(sx * ANCHOR_X, 0, 0)
    for (let c = -2; c <= 2; c++) {
      const p = surf(sx * 0.985, c / 2.2)
      rede.add(between(p, anchor, 0.011, CORD))
    }
    const amarra = torus(CANE_R * 1.05, 0.024, CORD, { roughness: 0.85 })
    amarra.rotation.x = Math.PI / 2
    amarra.position.set(sx * (ANCHOR_X + CANE_R * 0.85), 0, 0)
    rede.add(amarra)
    const no = sphere(0.04, CORD, { roughness: 0.85 })
    no.position.copy(anchor)
    rede.add(no)
  }

  // ---- LEBRE (filha da rede: balança com ela) --------------------------------
  const lebre = new THREE.Group()
  lebre.position.set(0, LEBRE_Y, 0)
  rede.add(lebre)

  const torso = capsule(0.23, 0.55, FUR, { roughness: 0.85 })
  torso.position.set(-0.08, 0.27, 0)
  torso.rotation.z = 1.25
  lebre.add(torso)
  // barriga creme, deitada ao longo do tronco (vira mancha na pele refinada)
  const barriga = sphere(0.2, '#e4cba0', { roughness: 0.85 })
  barriga.scale.set(1.9, 0.5, 1.0)
  barriga.rotation.z = -0.32
  barriga.position.set(-0.04, 0.43, 0.06)
  lebre.add(barriga)
  const quadril = sphere(0.25, FUR, { roughness: 0.85 })
  quadril.scale.set(1.1, 0.85, 1.0)
  quadril.position.set(0.26, 0.26, 0)
  lebre.add(quadril)
  const pescoco = sphere(0.16, FUR, { roughness: 0.85 })
  pescoco.position.set(-0.45, 0.45, 0.02)
  lebre.add(pescoco)

  // pernas traseiras compridas, cruzadas, pezões pra cima
  // [quadril, joelho, tornozelo, direção dos dedos]
  const legs: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [
    [V(0.3, 0.25, -0.1), V(0.58, 0.44, -0.08), V(0.84, 0.42, 0.08), V(0.45, 0.8, 0.4)],
    [V(0.3, 0.27, 0.12), V(0.56, 0.49, 0.14), V(0.82, 0.49, -0.07), V(0.55, 0.8, 0.25)],
  ]
  for (const [hip, knee, ankle, toeDir] of legs) {
    lebre.add(between(hip, knee, 0.11, FUR, true, 0.85))
    lebre.add(between(knee, ankle, 0.065, FUR, true, 0.85))
    // pezão de lebre: base local com +y = dedos e +z = sola (virada pra câmera)
    const yAx = toeDir.clone().normalize()
    const zAx = V(0.5, -0.3, 0.8)
    zAx.sub(yAx.clone().multiplyScalar(zAx.dot(yAx))).normalize()
    const xAx = yAx.clone().cross(zAx)
    const pe = new THREE.Group()
    pe.position.copy(ankle)
    pe.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, yAx, zAx))
    lebre.add(pe)
    const peito = sphere(0.09, FUR, { roughness: 0.85 })
    peito.scale.set(1.0, 1.55, 0.85)
    peito.position.y = 0.11
    pe.add(peito)
    const sola = sphere(0.075, CREAM, { roughness: 0.85 })
    sola.scale.set(0.95, 1.6, 0.4)
    sola.position.set(0, 0.11, 0.072)
    pe.add(sola)
    for (const dx of [-0.045, 0, 0.045]) {
      const dedo = sphere(0.032, CREAM, { roughness: 0.85 })
      dedo.position.set(dx, 0.235, 0.055)
      pe.add(dedo)
    }
  }

  // ---- cabeça: olhos semicerrados, orelhas compridíssimas --------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(-0.6, 0.62, 0.06)
  cabeca.rotation.set(0, 0.12, -0.12)
  cabeca.scale.setScalar(1.15)
  lebre.add(cabeca)
  const cranio = sphere(0.21, FUR, { roughness: 0.85 })
  cranio.scale.set(1, 0.92, 1.05)
  cabeca.add(cranio)
  for (const s of [-1, 1]) {
    const bochecha = sphere(0.085, CREAM, { roughness: 0.85 })
    bochecha.position.set(s * 0.065, -0.07, 0.15)
    cabeca.add(bochecha)
  }
  const queixo = sphere(0.06, CREAM, { roughness: 0.85 })
  queixo.position.set(0, -0.13, 0.12)
  cabeca.add(queixo)
  const nariz = sphere(0.03, PINK, { roughness: 0.4 })
  nariz.scale.set(1.3, 0.9, 0.8)
  nariz.position.set(0, -0.02, 0.225)
  cabeca.add(nariz)
  for (const s of [-1, 1]) {
    const dente = rbox(0.024, 0.036, 0.014, 0.005, '#ffffff', { roughness: 0.3 })
    dente.position.set(s * 0.013, -0.115, 0.2)
    cabeca.add(dente)
    const esclera = sphere(0.055, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(s * 0.09, 0.05, 0.168)
    cabeca.add(esclera)
    const pupila = sphere(0.026, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(s * 0.09, 0.035, 0.198)
    cabeca.add(pupila)
    // pálpebra pesada: preguiça
    const palpebra = sphere(0.058, FUR, { roughness: 0.85 })
    palpebra.scale.set(1.1, 0.62, 0.72)
    palpebra.position.set(s * 0.09, 0.072, 0.172)
    cabeca.add(palpebra)
  }
  // orelha de pé, ponta tombada para trás
  {
    const a = V(-0.02, 0.16, -0.04)
    const b = V(-0.16, 0.52, -0.1)
    const c = V(-0.38, 0.62, -0.12)
    const d = V(-0.52, 0.55, -0.1)
    cabeca.add(between(a, b, 0.06, FUR, true, 0.85))
    cabeca.add(between(b, c, 0.055, FUR, true, 0.85))
    cabeca.add(between(c, d, 0.062, TIP, true, 0.8))
    const dentro = between(V(-0.03, 0.22, 0.0), V(-0.145, 0.5, -0.05), 0.034, PINK, true, 0.7)
    dentro.scale.x = 1.15
    cabeca.add(dentro)
  }
  // orelha caindo pra fora da rede, pela borda da frente
  {
    const a = V(-0.08, 0.15, -0.0)
    const b = V(-0.24, 0.22, 0.26)
    cabeca.add(between(a, b, 0.058, FUR, true, 0.85))
    // a parte pendurada: larga e chata, de frente para a câmera
    const pendura = new THREE.Group()
    pendura.position.copy(b)
    pendura.rotation.set(Math.PI - 0.27, 0, 0.15)
    cabeca.add(pendura)
    const folha = capsule(0.06, 0.3, FUR, { roughness: 0.85 })
    folha.scale.set(1.4, 1, 0.55)
    folha.position.y = 0.17
    pendura.add(folha)
    const pontaPreta = capsule(0.062, 0.1, TIP, { roughness: 0.8 })
    pontaPreta.scale.set(1.4, 1, 0.6)
    pontaPreta.position.y = 0.4
    pendura.add(pontaPreta)
    // miolo rosado virado para a câmera
    const miolo = capsule(0.038, 0.24, PINK, { roughness: 0.7 })
    miolo.scale.set(1.35, 1, 0.5)
    miolo.position.set(0, 0.16, -0.032)
    pendura.add(miolo)
  }

  // ---- gomo de cana no canto da boca ----------------------------------------
  const gomo = new THREE.Group()
  gomo.position.set(0.07, -0.1, 0.19)
  gomo.rotation.set(0.5, 0, -1.15)
  cabeca.add(gomo)
  const colmo = cylinder(0.027, 0.027, 0.26, CANE, { roughness: 0.45 }, 14)
  colmo.position.y = 0.13
  gomo.add(colmo)
  const noGomo = torus(0.026, 0.008, CANE_DARK, { roughness: 0.6 })
  noGomo.rotation.x = Math.PI / 2
  noGomo.position.y = 0.17
  gomo.add(noGomo)
  const corte = cylinder(0.025, 0.025, 0.006, CANE_CUT, { roughness: 0.8 }, 14)
  corte.position.y = 0.262
  gomo.add(corte)

  // ---- lápis atrás da orelha ------------------------------------------------
  const lapis = new THREE.Group()
  lapis.position.set(-0.1, 0.21, 0.02)
  lapis.rotation.set(0.25, 0, 1.3)
  cabeca.add(lapis)
  const madeira = cylinder(0.026, 0.026, 0.34, PENCIL, { roughness: 0.45 }, 6)
  lapis.add(madeira)
  const ponta = cone(0.026, 0.07, '#e2c08c', { roughness: 0.7 }, 6)
  ponta.position.y = 0.205
  lapis.add(ponta)
  const grafite = cone(0.009, 0.026, '#333333', { roughness: 0.5 }, 8)
  grafite.position.y = 0.235
  lapis.add(grafite)
  const virola = cylinder(0.028, 0.028, 0.035, '#b8bcc2', { roughness: 0.3, metalness: 0.7 }, 12)
  virola.position.y = -0.187
  lapis.add(virola)
  const borracha = cylinder(0.026, 0.026, 0.04, '#e88a94', { roughness: 0.7 }, 12)
  borracha.position.y = -0.224
  lapis.add(borracha)

  // ---- braço do volante: pivô no ombro --------------------------------------
  const braco = new THREE.Group()
  braco.position.set(-0.22, 0.47, 0.17)
  braco.rotation.z = ARM_UP
  lebre.add(braco)
  const antebraco = capsule(0.062, 0.5, FUR, { roughness: 0.85 })
  antebraco.position.y = 0.28
  braco.add(antebraco)
  const pata = sphere(0.078, CREAM, { roughness: 0.85 })
  pata.scale.set(1, 1.1, 0.95)
  pata.position.y = 0.58
  braco.add(pata)

  // ---- volante da Mega-SENA (eco do bilhete da freira) ----------------------
  const volante = new THREE.Group()
  volante.position.set(0, 0.6, 0.05)
  volante.rotation.z = -ARM_UP
  braco.add(volante)
  const VS = 1.2 // um pouco maior que o da freira: a lebre está mais longe
  const cartao = new THREE.Group()
  cartao.scale.setScalar(VS)
  volante.add(cartao)
  const ticket = rbox(0.56, 0.34, 0.02, 0.025, WHITE, { roughness: 0.5 })
  ticket.position.y = 0.17
  cartao.add(ticket)
  const header = rbox(0.56, 0.06, 0.024, 0.02, SENA, { roughness: 0.45 })
  header.position.y = 0.31
  cartao.add(header)
  for (let k = 0; k < 6; k++) {
    const dot = cylinder(0.018, 0.018, 0.012, SENA, { roughness: 0.45 })
    dot.rotation.x = Math.PI / 2
    dot.position.set(-0.19 + k * 0.076, 0.045, 0.012)
    cartao.add(dot)
  }
  const glyphs: ['S' | 'E' | 'N' | 'A', number][] = [
    ['S', -0.18], ['E', -0.06], ['N', 0.06], ['A', 0.18],
  ]
  for (const [gl, lx] of glyphs) {
    const l = letter(gl)
    l.position.set(lx, 0.17, 0.016)
    cartao.add(l)
  }
  // dedinhos da pata segurando a borda, por cima do cartão
  for (const s of [-1, 1]) {
    const dedo = sphere(0.035, CREAM, { roughness: 0.85 })
    dedo.position.set(s * 0.035, 0.02, 0.035)
    volante.add(dedo)
  }

  // ---- tênis de corrida largados no chão -------------------------------------
  const tenis = new THREE.Group()
  tenis.position.set(SHOES[0], GY, SHOES[1])
  root.add(tenis)
  const t1 = makeShoe()
  t1.position.set(-0.12, 0, 0.02)
  t1.rotation.y = 0.35
  tenis.add(t1)
  const t2 = makeShoe()
  t2.position.set(0.24, 0.072, -0.06)
  t2.rotation.set(Math.PI / 2 - 0.05, 0, 0) // tombado de lado, sola pra trás
  t2.rotation.y = -0.6
  tenis.add(t2)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'pista', object: base },
    { name: 'portico', group: 'pista', object: portico },
    { name: 'canaE', group: 'canas', object: canaE },
    { name: 'canaD', group: 'canas', object: canaD },
    { name: 'rede', group: 'rede', object: rede },
    { name: 'lebre', group: 'lebre', object: lebre },
    { name: 'cabeca', group: 'lebre', object: cabeca },
    { name: 'braco', group: 'lebre', object: braco },
    { name: 'tenis', group: 'tenis', object: tenis },
    { name: 'gomo', group: 'calma', object: gomo },
    { name: 'lapis', group: 'calma', object: lapis },
    { name: 'volante', group: 'sena', object: volante },
  ]

  // ---- montagem ------------------------------------------------------------
  const grow = (v0: number, v1: number) => [
    ch('scale.x', v0, v1), ch('scale.y', v0, v1), ch('scale.z', v0, v1),
  ]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Dia da grande corrida da floresta: sobe a pista de terra e o pórtico de largada…',
    }),
    seq('portico-rise', 'portico', 0.35, 0.7, [riseFrom(0, 2.0)], { ease: 'easeOut' }),

    seq('canaE-rise', 'canaE', 1.5, 0.8, [riseFrom(GY - 0.01, 2.6)], {
      ease: 'easeOut',
      caption: 'Na beira da pista brotam duas CANAS-de-açúcar gigantes…',
    }),
    seq('canaD-rise', 'canaD', 1.7, 0.8, [riseFrom(GY - 0.01, 2.6)], { ease: 'easeOut' }),

    seq('rede-abre', 'rede', 2.9, 0.8, [ch('scale.x', 0.02, 1)], {
      ease: 'easeOut',
      caption: '…e entre elas a lebre amarra uma REDE listrada.',
    }),

    seq('lebre-cai', 'lebre', 4.2, 0.55, [ch('position.y', LEBRE_Y + 1.6, LEBRE_Y)], {
      ease: 'easeIn',
      caption: 'A lebre, favorita disparada, em vez de correr… se joga na rede!',
    }),
    seq('cabeca-assenta', 'cabeca', 4.2, 0.9, [ch('rotation.x', -0.5, 0)], { ease: 'easeOut' }),
    seq('braco-repousa', 'braco', 4.2, 0.1, [ch('rotation.z', ARM_REST, ARM_REST)]),
    seq('rede-afunda', 'rede', 4.75, 0.15, [ch('scale.y', 1, 1.1)], { ease: 'easeOut' }),
    seq('rede-volta', 'rede', 4.9, 0.4, [ch('scale.y', 1.1, 1)], { ease: 'easeInOut' }),

    seq('tenis-cai', 'tenis', 5.7, 0.6, [
      ch('position.x', 1.0, SHOES[0]), ch('position.y', 1.5, GY), ch('position.z', 0.65, SHOES[1]),
      ch('rotation.z', 2.2, 0),
    ], { ease: 'easeIn', caption: 'Tira os tênis de corrida e larga no chão…' }),
    seq('tenis-pula', 'tenis', 6.3, 0.15, [ch('position.y', GY, GY + 0.08)], { ease: 'easeOut' }),
    seq('tenis-pousa', 'tenis', 6.45, 0.15, [ch('position.y', GY + 0.08, GY)], { ease: 'easeIn' }),

    seq('gomo-aparece', 'gomo', 7.0, 0.4, grow(0.01, 1), {
      ease: 'easeOut',
      caption: '…chupa um gomo de cana, lápis atrás da orelha, na maior calma.',
    }),
    seq('lapis-aparece', 'lapis', 7.35, 0.4, grow(0.01, 1), { ease: 'easeOut' }),

    seq('lebre-chuta', 'lebre', 8.2, 0.1, [ch('position.x', 0, 0.08)], { ease: 'easeOut' }),
    seq('lebre-volta', 'lebre', 8.3, 0.35, [ch('position.x', 0.08, 0)], { ease: 'easeInOut' }),
    seq('canaD-treme', 'canaD', 8.3, 0.12, [ch('rotation.z', -LEAN, -LEAN - 0.07)], {
      ease: 'easeOut',
      caption: 'O apito soa, os outros disparam… e ela só bate o pezão na CANA: CÁN!',
    }),
    seq('canaD-volta', 'canaD', 8.42, 0.5, [ch('rotation.z', -LEAN - 0.07, -LEAN)], { ease: 'easeOut' }),

    seq('rede-balanca', 'rede', 9.1, 0.35, [ch('rotation.x', 0, 0.09)], {
      ease: 'easeOut',
      caption: 'A REDE dá só um balancinho preguiçoso — rre…',
    }),
    seq('rede-balanca-volta', 'rede', 9.45, 0.35, [ch('rotation.x', 0.09, -0.04)], { ease: 'easeInOut' }),
    seq('rede-para', 'rede', 9.8, 0.3, [ch('rotation.x', -0.04, 0)], { ease: 'easeInOut' }),

    seq('braco-ergue', 'braco', 10.3, 0.6, [ch('rotation.z', ARM_REST, ARM_UP)], {
      ease: 'easeOut',
      caption: '…e ergue o volante da Mega-SENA: CÁN-rre… SÊNA-re! Pra que correr, se vai ficar rica?',
    }),
    seq('volante-abre', 'volante', 10.6, 0.45, grow(0.01, 1), { ease: 'easeOut' }),

    seq('cabeca-acena', 'cabeca', 11.8, 0.3, [ch('rotation.x', 0, 0.12)], {
      ease: 'easeOut',
      caption: 'Kanske senare. — Talvez mais tarde.',
    }),
    seq('cabeca-volta', 'cabeca', 12.1, 0.35, [ch('rotation.x', 0.12, 0)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.1, 3.45], target: [0.05, 1.25, 0.0] },
  }
}

/** Casinha da linha de largada xadrez. */
function box2(color: string) {
  return rbox(0.1, 0.012, 0.1, 0.004, color, { roughness: 0.8 })
}

export const card: Card = {
  meta: {
    id: 'kanske-senare',
    contexto:
      "Trabalho e vida social: quando oferecem mais café no fika, chamam pro after-work ou pra uma caminhada e você ainda não sabe; quando o vendedor pergunta se quer ajuda. É o 'não' educado que deixa a porta aberta.",
    fraseFonte: 'Talvez mais tarde.',
    fraseAlvo: 'Kanske senare.',
    pronuncia:
      "KÁN-rre SÊÊ-na-re ('kanske' com A curto, N comprido e a força no KÁN; o 'sk' antes de E vira o sopro do sj — um h raspado, de lábios em bico, como em 'sjuk' —, e o -e fica curtinho; 'senare' com Ê FECHADO e longo e a força no SÊ, e um -re fraquinho de R brando que não pode cair)",
    ponteSonora:
      "CÁN-rre... SÊNA-re! (5 sílabas: KÁN-rre-SÊÊ-na-re; tônicas em CÁN e SÊÊ; CÁN = a CANA sem o -A, o MESMO 'kan' de 'Kan jag få en påse?', 'Kan du hjälpa mig?' e 'Kan jag låna din laddare?' — C+A+N, A curto e N de língua bem segurado, sem o glide de 'quando' —, e não é coincidência: 'kanske' é 'kan ske', 'pode acontecer'; rre = a REDE sem o -DE, dita à carioca: o R de começo de palavra já sai soprado, e esse sopro é o 'sk' antes de E — o mesmo sopro de RRÜÜK ('sjuk'), RRÍCA ('skicka') e RRÉLV ('själv'), raspado e de lábios em bico, mais forte que o h leve de RRÁR ('har'); FRACO e curto, colado no CÁN: CÁN-rre é uma palavra só, nunca 'ca-na-RRÊ' com força no fim; da REDE vem SÓ o sopro, nunca a força do RÊ — leia CÁNRRE como uma paroxítona do português, no balanço de 'TÓRRE': pancada no primeiro pedaço e o -rre caído, curtinho, com o E quase engolido; com R de língua ('canre') ou com S-K ('cansque') o sueco entende, mas a fala de Estocolmo sopra; SÊNA-re = a MEGA-SENA de 'Jag ringer dig senare', o MESMO âncora da freira boxeadora: Ê FECHADO, LONGO e com a força, e um -re fraquinho de R brando — que não cai (sem ele sobra 'sena', 'atrasados') e não leva acento: nunca 'se-na-RÉ')",
    historia:
      "Dia da grande corrida da floresta, e a lebre, favorita disparada, está... deitada. Amarrou uma REDE entre duas CANAS-de-açúcar gigantes na beira da pista, tirou o tênis de corrida, chupa um gomo de cana e preenche com toda a calma um volante da Mega-SENA. O apito soa, os outros disparam, alguém grita 'Não vai correr?!' — e ela nem levanta a orelha: bate com força na CANA — CÁN! —, deixa a REDE dar só um balancinho preguiçoso, quase nada — rre — e ergue o volante da SENA: CÁN-rre... SÊNA-re. Pra que correr agora, se ela vai ficar rica na Mega-Sena? Talvez mais tarde.",
  },
  createScene,
  refine: { organic: ['lebre', 'cabeca', 'braco'] },
}

export default card
