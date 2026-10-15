import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Förlåt, jag är lite sen." — FUR-LÔT! IÁ É LÍ-TE SÊÊN!
 *
 * Eco deliberado de "Förlåt, det var mitt fel": o mesmo LOTE de terra e a
 * mesma cratera do FURA-LOTE — mas agora o lote baldio virou SET DE
 * FILMAGEM, e quem fura o chão por baixo é a estrela atrasada: um tamanduá de
 * capacete de mineiro, focinho sujo de terra, erguendo na garra o potinho de
 * formigas LITE (a desculpa do atraso) e apontando o focinho para a claquete
 * CENA, que já bateu três vezes.
 *
 * Diorama: lote de terra com mato; cratera estourada no centro com torrões
 * voando; tamanduá saindo até a cintura; claquete num tripé à direita,
 * cadeira de diretor vazia à esquerda, placa LOTE ao fundo.
 */

const SOIL = '#7a5636'
const SOIL_DARK = '#4a3324'
const GRIT = '#8f7d63'
const HOLE = '#22170f'
const WOOD = '#8a6a42'
const BOARD = '#d9c9a8'
const INK = '#3a2f26'
const WEED = '#6f7d3e'
const FRAME = '#3b2a1e'      // madeira escura da cadeira
const CANVAS = '#9b3b30'     // lona da cadeira (vermelho contido)
const SLATE = '#1c1c1f'
const CHALK = '#f1efe8'
const METAL_DARK = '#2b2e33'
const STEEL = '#9aa1a8'
const FUR = '#7e766d'        // cinza do tamanduá
const FUR_DARK = '#5f5852'
const FUR_LIGHT = '#dcd6c9'  // patas dianteiras claras
const STRIPE = '#1e1c1b'
const CLAW = '#efe2bf'       // garras creme
const SNOUT_TIP = '#1a1817'
const TONGUE = '#e07f8f'
const DIRT = '#5a3f28'
const HELMET = '#d9a521'
const LAMP = '#fff1c4'
const GLASS = '#cfe2e3'
const ANT = '#2a1a14'
const LITE = '#12b5c2'       // ACENTO saturado, reservado ao rótulo LITE

const GY = 0.16 // topo do lote
const CX = 0
const CZ = 0.15 // centro da cratera

const RIPA_OPEN = 0.5 // ripa da claquete aberta (rad)

type V3 = [number, number, number]
const Y = new THREE.Vector3(0, 1, 0)

/** Cápsula de a até b (membros, pescoço). */
function limb(a: V3, b: V3, r: number, color: string, opts = { roughness: 0.88 }) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const d = vb.clone().sub(va)
  const m = capsule(r, d.length(), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(Y, d.normalize())
  return m
}

/** Haste reta de a até b (pernas de tripé, armação). */
function rod(a: V3, b: V3, r: number, color: string, opts: { roughness?: number; metalness?: number } = {}) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const d = vb.clone().sub(va)
  const m = cylinder(r, r, d.length(), color, opts, 12)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(Y, d.normalize())
  return m
}

/** Garra: cone com a base em p, apontando na direção dir. */
function claw(p: V3, dir: V3, r: number, h: number) {
  const d = new THREE.Vector3(...dir).normalize()
  const c = cone(r, h, CLAW, { roughness: 0.35 })
  c.position.set(...p).addScaledVector(d, h / 2)
  c.quaternion.setFromUnitVectors(Y, d)
  return c
}

/** Listra de claquete: paralelogramo extrudado, inclinado de `lean`. */
function listra(w: number, h: number, lean: number, depth: number, color: string) {
  const sh = new THREE.Shape()
  sh.moveTo(-w / 2 - lean / 2, -h / 2)
  sh.lineTo(w / 2 - lean / 2, -h / 2)
  sh.lineTo(w / 2 + lean / 2, h / 2)
  sh.lineTo(-w / 2 + lean / 2, h / 2)
  sh.closePath()
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false })
  geo.translate(0, 0, -depth / 2)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.5, size: w }))
  m.castShadow = true
  return m
}

/** Letra de traço grosso, centrada na origem, no plano xy virada para +z. */
function glyph(which: string, h: number, color: string, depth = 0.025) {
  const g = new THREE.Group()
  const t = h * 0.19
  const w = h * 0.64
  const s = (sw: number, sh: number, x: number, y: number, rot = 0) => {
    const b = rbox(sw, sh, depth, Math.min(sw, sh) * 0.25, color, { roughness: 0.6 })
    b.position.set(x, y, 0)
    b.rotation.z = rot
    g.add(b)
  }
  const ring = (arc: number, start: number) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(w / 2 - t / 2, t / 2, 10, 32, arc),
      mat(color, { roughness: 0.6, size: h }),
    )
    m.castShadow = true
    m.rotation.z = start
    // escala DEPOIS da rotação (no grupo), senão o arco sai torto
    const oval = new THREE.Group()
    oval.scale.set(1, h / w, depth / t)
    oval.add(m)
    g.add(oval)
  }
  const top = h / 2 - t / 2
  const left = -w / 2 + t / 2
  switch (which) {
    case 'L':
      s(t, h, left, 0)
      s(w, t, 0, -top)
      break
    case 'I':
      s(t, h, 0, 0)
      break
    case 'T':
      s(w, t, 0, top)
      s(t, h, 0, 0)
      break
    case 'E':
      s(t, h, left, 0)
      s(w, t, 0, top)
      s(w * 0.82, t, -w * 0.09, 0)
      s(w, t, 0, -top)
      break
    case 'N': {
      s(t, h, left, 0)
      s(t, h, -left, 0)
      const dx = w - t
      s(t * 0.95, Math.hypot(dx, h) * 0.93, 0, 0, Math.atan2(dx, h))
      break
    }
    case 'A': {
      const ang = Math.atan2(w / 2 - t / 2, h)
      const len = Math.hypot(w / 2 - t / 2, h)
      s(t, len, -w / 4 + t / 8, 0, -ang)
      s(t, len, w / 4 - t / 8, 0, ang)
      s(w * 0.48, t * 0.9, 0, -h * 0.14)
      break
    }
    case 'C':
      ring(Math.PI * 1.45, Math.PI * 0.275)
      break
    case 'O':
      ring(Math.PI * 2, 0)
      break
  }
  return g
}

/** Palavra centrada: letras lado a lado. */
function word(text: string, h: number, color: string, gap = 0.2, depth = 0.025) {
  const g = new THREE.Group()
  const adv = (c: string) => (c === 'I' ? h * 0.22 : h * 0.64) + h * gap
  const total = [...text].reduce((a, c) => a + adv(c), 0) - h * gap
  let x = -total / 2
  for (const c of text) {
    const l = glyph(c, h, color, depth)
    l.position.x = x + (adv(c) - h * gap) / 2
    g.add(l)
    x += adv(c)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: o LOTE baldio ---------------------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.45, 2.55, 0.16, SOIL, { roughness: 0.95 })
  soil.position.y = 0.08
  base.add(soil)

  const grit = cylinder(2.3, 2.38, 0.04, GRIT, { roughness: 0.92 })
  grit.position.y = 0.14
  base.add(grit)

  // mato de lote baldio
  const tufts: [number, number, number][] = [
    [-2.0, 0.55, 0.16], [1.95, 0.9, 0.13], [-0.75, 1.65, 0.12],
    [0.85, -1.85, 0.15], [-1.0, -1.85, 0.13], [2.05, -0.35, 0.11],
  ]
  tufts.forEach(([x, z, r], i) => {
    const tuft = puff(r, i % 2 ? WEED : '#5f6e35', 5, 60 + i, { roughness: 0.92 })
    tuft.position.set(x, GY + r * 0.45, z)
    tuft.scale.y = 0.75
    base.add(tuft)
  })

  for (const [x, z, r, seed] of [[1.85, 1.35, 0.12, 71], [-0.35, -2.0, 0.1, 72], [-2.05, -0.6, 0.15, 73]] as const) {
    const pedra = rock(r, '#8d9296', seed, { roughness: 0.92 })
    pedra.position.set(x, GY + r * 0.45, z)
    pedra.rotation.y = rand() * Math.PI
    base.add(pedra)
  }

  // fita de marcação no chão: o X onde a estrela deveria estar
  const marca = new THREE.Group()
  marca.position.set(-0.55, GY + 0.004, 1.35)
  for (const r of [0.6, -0.6]) {
    const fita = rbox(0.34, 0.008, 0.06, 0.003, '#e9c63a', { roughness: 0.7 })
    fita.rotation.y = r
    marca.add(fita)
  }
  base.add(marca)

  root.add(base)

  // ---- placa do LOTE (o eco do FURA-LOTE) -------------------------------------
  const placa = new THREE.Group()
  placa.position.set(-1.7, GY, -1.05)
  placa.rotation.y = 0.38

  const post = cylinder(0.05, 0.058, 1.15, WOOD, { roughness: 0.75 })
  post.position.y = 0.575
  placa.add(post)

  const board = rbox(0.8, 0.36, 0.05, 0.025, BOARD, { roughness: 0.7 })
  board.position.y = 1.12
  board.rotation.z = 0.06 // torta, de lote abandonado
  placa.add(board)

  const lote = word('LOTE', 0.17, INK, 0.22)
  lote.position.set(0, 0, 0.032)
  board.add(lote)

  root.add(placa)

  // ---- cadeira do diretor, vazia ----------------------------------------------
  const cadeira = new THREE.Group()
  cadeira.position.set(-1.42, GY, 0.42)
  cadeira.rotation.y = 0.6

  const SEAT = 0.5
  for (const sx of [-1, 1]) {
    // pernas em X de cada lado
    cadeira.add(rod([sx * 0.25, 0, 0.2], [sx * 0.25, SEAT, -0.2], 0.022, FRAME, { roughness: 0.6 }))
    cadeira.add(rod([sx * 0.25, 0, -0.2], [sx * 0.25, SEAT, 0.2], 0.022, FRAME, { roughness: 0.6 }))
    // montante traseiro até o encosto
    cadeira.add(rod([sx * 0.25, SEAT, -0.2], [sx * 0.25, 1.06, -0.22], 0.022, FRAME, { roughness: 0.6 }))
    // apoio de braço
    cadeira.add(rod([sx * 0.25, SEAT, 0.2], [sx * 0.25, 0.74, 0.2], 0.02, FRAME, { roughness: 0.6 }))
    const braco = rbox(0.06, 0.035, 0.5, 0.012, FRAME, { roughness: 0.6 })
    braco.position.set(sx * 0.25, 0.755, -0.01)
    cadeira.add(braco)
  }
  for (const z of [-0.2, 0.2]) {
    const travessa = rbox(0.55, 0.04, 0.04, 0.012, FRAME, { roughness: 0.6 })
    travessa.position.set(0, SEAT, z)
    cadeira.add(travessa)
  }
  const assento = rbox(0.5, 0.03, 0.42, 0.012, CANVAS, { roughness: 0.9 })
  assento.position.y = SEAT - 0.01
  cadeira.add(assento)
  const encosto = rbox(0.54, 0.22, 0.025, 0.01, CANVAS, { roughness: 0.9 })
  encosto.position.set(0, 0.93, -0.215)
  cadeira.add(encosto)
  // megafone esquecido no assento
  const megafone = lathe([[0, 0], [0.035, 0], [0.04, 0.05], [0.1, 0.22], [0.105, 0.23], [0, 0.23]], '#e8e2d4', { roughness: 0.45 })
  megafone.position.set(0.04, SEAT + 0.06, 0.02)
  megafone.rotation.set(0, 0.4, -Math.PI / 2 + 0.15)
  cadeira.add(megafone)

  root.add(cadeira)

  // ---- claquete CENA num tripé -------------------------------------------------
  const claquete = new THREE.Group()
  claquete.position.set(1.3, GY, 0.5)
  claquete.rotation.y = -0.32

  const TOP = 0.98
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    claquete.add(rod([0, TOP, 0], [Math.sin(a) * 0.36, 0, Math.cos(a) * 0.36], 0.02, METAL_DARK, { roughness: 0.4, metalness: 0.6 }))
  }
  const cabecaTripe = rbox(0.12, 0.06, 0.08, 0.02, METAL_DARK, { roughness: 0.4, metalness: 0.6 })
  cabecaTripe.position.y = TOP + 0.02
  claquete.add(cabecaTripe)

  const BOARD_Y = 1.28
  const lousa = rbox(0.7, 0.5, 0.045, 0.02, SLATE, { roughness: 0.55 })
  lousa.position.y = BOARD_Y
  claquete.add(lousa)

  // linhas de giz da lousa
  const giz = (w: number, h: number, x: number, y: number) => {
    const l = rbox(w, h, 0.008, 0.003, CHALK, { roughness: 0.8 })
    l.position.set(x, BOARD_Y + y, 0.026)
    claquete.add(l)
  }
  giz(0.62, 0.012, 0, 0.13)
  giz(0.62, 0.012, 0, -0.14)
  giz(0.012, 0.09, -0.08, -0.19)
  giz(0.012, 0.09, 0.12, -0.19)

  const cena = word('CENA', 0.15, CHALK, 0.24, 0.02)
  cena.position.set(0, BOARD_Y - 0.005, 0.03)
  claquete.add(cena)

  // barra fixa listrada no topo da lousa
  const STRIPE_Y = BOARD_Y + 0.25 + 0.036
  const barra = rbox(0.7, 0.072, 0.05, 0.012, SLATE, { roughness: 0.5 })
  barra.position.y = STRIPE_Y
  claquete.add(barra)
  for (let i = 0; i < 5; i++) {
    const l = listra(0.065, 0.072, 0.05, 0.054, CHALK)
    l.position.set(-0.28 + i * 0.14, STRIPE_Y, 0)
    claquete.add(l)
  }

  // ---- ripa da claquete (dobradiça à esquerda) --------------------------------
  const ripa = new THREE.Group()
  ripa.position.set(-0.34, STRIPE_Y + 0.036, 0)
  ripa.rotation.z = RIPA_OPEN
  claquete.add(ripa)

  const stick = rbox(0.7, 0.072, 0.05, 0.012, SLATE, { roughness: 0.5 })
  stick.position.set(0.35, 0.036, 0)
  ripa.add(stick)
  for (let i = 0; i < 5; i++) {
    const l = listra(0.065, 0.072, -0.05, 0.054, CHALK)
    l.position.set(0.07 + i * 0.14, 0.036, 0)
    ripa.add(l)
  }
  const pino = cylinder(0.022, 0.022, 0.07, STEEL, { roughness: 0.3, metalness: 0.8 }, 16)
  pino.rotation.x = Math.PI / 2
  ripa.add(pino)

  root.add(claquete)

  // ---- cratera estourada -------------------------------------------------------
  const cratera = new THREE.Group()
  cratera.position.set(CX, GY, CZ)

  const hole = cylinder(0.6, 0.5, 0.04, HOLE, { roughness: 0.95 })
  hole.position.y = 0.006
  cratera.add(hole)

  const rim = torus(0.72, 0.17, SOIL_DARK, { roughness: 0.95 })
  rim.rotation.x = -Math.PI / 2
  rim.scale.z = 0.55
  rim.position.y = 0.02
  cratera.add(rim)

  // placas de chão quebradas, levantadas para fora
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.4
    const d = 0.82 + rand() * 0.12
    const placaChao = rock(0.12 + rand() * 0.06, i % 2 ? SOIL : SOIL_DARK, 80 + i, { roughness: 0.95 })
    placaChao.scale.set(1.2, 0.55, 1)
    placaChao.position.set(Math.cos(a) * d, 0.07, Math.sin(a) * d)
    placaChao.rotation.set(Math.sin(a) * 0.5, rand() * Math.PI, -Math.cos(a) * 0.5)
    cratera.add(placaChao)
  }
  root.add(cratera)

  // ---- torrões voando (congelados no ar) ----------------------------------------
  const torroes = new THREE.Group()
  torroes.position.set(CX, GY, CZ)
  const clods: [number, number, number, number][] = [
    [-1.05, 1.15, -0.25, 0.09], [0.98, 1.55, -0.45, 0.08], [-0.42, 1.95, -0.55, 0.07],
    [0.55, 2.05, -0.35, 0.06], [1.05, 0.95, -0.35, 0.08], [-0.95, 0.5, -0.45, 0.07],
    [0.3, 0.42, 1.0, 0.06], [-0.2, 2.25, -0.2, 0.05], [-0.95, 1.7, 0.1, 0.05],
    [1.25, 1.15, -0.2, 0.05], [0.72, 0.35, 0.92, 0.045],
  ]
  clods.forEach(([x, y, z, r], i) => {
    const t = rock(r, i % 3 ? SOIL_DARK : SOIL, 90 + i, { roughness: 0.95 })
    t.position.set(x, y, z)
    t.rotation.set(rand() * 3, rand() * 3, rand() * 3)
    torroes.add(t)
  })
  root.add(torroes)

  // ---- o tamanduá (sai da cratera até a cintura) --------------------------------
  const tamandua = new THREE.Group()
  tamandua.position.set(CX, 0, CZ)
  root.add(tamandua)

  // tronco único (sem esferas sobrepostas): a faixa precisa ser a superfície
  // mais externa na região dela para o Blender transferir a cor limpa
  const torso = capsule(0.42, 0.6, FUR, { roughness: 0.88 })
  torso.position.y = GY + 0.42
  torso.scale.set(1.05, 1, 0.9)
  tamandua.add(torso)

  // faixa preta diagonal com borda branca
  const faixa = new THREE.Group()
  faixa.position.set(0, GY + 0.8, 0.01)
  faixa.rotation.z = 0.75
  const ELIPSE = 1 / Math.cos(0.75) // corte inclinado de um cilindro é elipse
  const borda = torus(0.38, 0.13, '#ece6da', { roughness: 0.88 })
  borda.rotation.x = Math.PI / 2
  borda.scale.set(ELIPSE * 1.05, 0.9, 1)
  faixa.add(borda)
  const preta = torus(0.45, 0.07, STRIPE, { roughness: 0.88 })
  preta.rotation.x = Math.PI / 2
  preta.scale.set(ELIPSE * 1.05, 0.9, 1)
  faixa.add(preta)
  tamandua.add(faixa)

  // pescoço grosso afunilando na cabeça
  tamandua.add(limb([0, GY + 1.0, 0.04], [0.06, GY + 1.34, 0.12], 0.22, FUR))

  // cabeça virada para a claquete
  const cabeca = new THREE.Group()
  cabeca.position.set(0.08, GY + 1.42, 0.14)
  cabeca.rotation.y = 0.9
  tamandua.add(cabeca)

  const cranio = sphere(0.24, FUR, { roughness: 0.88 })
  cranio.scale.set(0.92, 0.9, 1.15)
  cabeca.add(cranio)

  for (const side of [-1, 1]) {
    const orelha = sphere(0.075, FUR_DARK, { roughness: 0.88 })
    orelha.scale.set(1, 1, 0.55)
    orelha.position.set(side * 0.17, 0.12, -0.1)
    orelha.rotation.y = side * 0.5
    cabeca.add(orelha)

    const olho = sphere(0.042, '#141210', { roughness: 0.2 })
    olho.position.set(side * 0.17, 0.05, 0.14)
    cabeca.add(olho)
    const brilho = sphere(0.013, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.19, 0.07, 0.17)
    cabeca.add(brilho)

    // sobrancelha de esforço (ofegante)
    const sobr = capsule(0.014, 0.06, FUR_DARK, { roughness: 0.9 })
    sobr.position.set(side * 0.16, 0.12, 0.16)
    sobr.rotation.set(0, 0, Math.PI / 2 + side * 0.35)
    cabeca.add(sobr)
  }

  // braço direito apoiado na borda, garras cravadas na terra
  const sR: V3 = [0.36, GY + 0.92, 0.06]
  const eR: V3 = [0.7, GY + 0.55, 0.16]
  const pR: V3 = [0.74, GY + 0.16, 0.42]
  tamandua.add(limb(sR, eR, 0.14, FUR_LIGHT))
  tamandua.add(limb(eR, pR, 0.12, FUR_LIGHT))
  const pulsoR = limb([0.715, GY + 0.36, 0.27], [0.735, GY + 0.27, 0.33], 0.15, STRIPE)
  tamandua.add(pulsoR)
  const pataR = sphere(0.14, FUR_LIGHT, { roughness: 0.88 })
  pataR.scale.set(1, 0.75, 1.1)
  pataR.position.set(...pR)
  tamandua.add(pataR)
  for (const dx of [-0.07, 0.02, 0.1]) {
    tamandua.add(claw([pR[0] + dx, pR[1] + 0.02, pR[2] + 0.1], [dx * 0.6, -0.55, 0.85], 0.042, 0.3))
  }

  // braço esquerdo ERGUIDO segurando o pote
  const sL: V3 = [-0.36, GY + 0.95, 0.06]
  const eL: V3 = [-0.66, GY + 1.3, 0.2]
  const pL: V3 = [-0.68, GY + 1.72, 0.26]
  tamandua.add(limb(sL, eL, 0.14, FUR_LIGHT))
  tamandua.add(limb(eL, pL, 0.12, FUR_LIGHT))
  const pulsoL = limb([-0.672, GY + 1.5, 0.232], [-0.678, GY + 1.6, 0.245], 0.15, STRIPE)
  tamandua.add(pulsoL)
  const pataL = sphere(0.14, FUR_LIGHT, { roughness: 0.88 })
  pataL.scale.set(1.1, 0.75, 1)
  pataL.position.set(...pL)
  tamandua.add(pataL)
  // garras abraçando o pote pelos lados e por trás
  for (const [dx, dz, tx, tz] of [[-0.19, 0.06, 0.28, 0], [0.21, 0.06, -0.28, 0], [0.0, -0.15, 0, 0.3]] as const) {
    tamandua.add(claw([pL[0] + dx, pL[1] + 0.04, pL[2] + dz], [tx, 1, tz], 0.042, 0.32))
  }

  // ---- focinho longo (sai da cabeça) --------------------------------------------
  const focinho = new THREE.Group()
  focinho.position.set(0, -0.03, 0.2)
  focinho.rotation.x = -0.12 // levemente erguido, apontando
  cabeca.add(focinho)

  const tubo = cylinder(0.055, 0.13, 0.66, FUR, { roughness: 0.88 })
  tubo.rotation.x = Math.PI / 2
  tubo.position.z = 0.3
  focinho.add(tubo)

  const ponta = sphere(0.062, SNOUT_TIP, { roughness: 0.35 })
  ponta.scale.set(1, 0.9, 0.8)
  ponta.position.z = 0.64
  focinho.add(ponta)

  // língua comprida pendurada, ofegante
  const lingua = limb([0, -0.03, 0.64], [0.02, -0.2, 0.74], 0.02, TONGUE, { roughness: 0.35 })
  focinho.add(lingua)
  const linguaPonta = limb([0.02, -0.2, 0.74], [0.0, -0.28, 0.7], 0.02, TONGUE, { roughness: 0.35 })
  focinho.add(linguaPonta)

  // terra no focinho
  for (const [x, y, z, r] of [[0.07, 0.05, 0.28, 0.04], [-0.06, 0.06, 0.4, 0.032], [0.04, 0.05, 0.52, 0.028], [0.0, 0.11, 0.18, 0.045]] as const) {
    const sujeira = sphere(r, DIRT, { roughness: 0.95 })
    sujeira.scale.set(1, 0.55, 1)
    sujeira.position.set(x, y, z)
    focinho.add(sujeira)
  }

  // ---- capacete de mineiro com lanterna -----------------------------------------
  const capacete = new THREE.Group()
  capacete.position.set(0, 0.1, -0.02)
  capacete.rotation.x = -0.12
  cabeca.add(capacete)

  const casco = lathe(
    [
      [0, -0.01], [0.3, -0.01], [0.32, 0.012], [0.27, 0.035],
      [0.255, 0.09], [0.21, 0.17], [0.12, 0.225], [0, 0.24],
    ],
    HELMET,
    { roughness: 0.35 },
  )
  casco.scale.set(1, 1, 1.12)
  capacete.add(casco)
  const crista = rbox(0.05, 0.05, 0.36, 0.02, '#bf8d17', { roughness: 0.35 })
  crista.position.y = 0.2
  capacete.add(crista)

  const lanterna = new THREE.Group()
  lanterna.position.set(0, 0.11, 0.26)
  lanterna.rotation.x = 0.25
  capacete.add(lanterna)
  const suporte = rbox(0.1, 0.09, 0.05, 0.015, METAL_DARK, { roughness: 0.4, metalness: 0.5 })
  lanterna.add(suporte)
  const carcaca = cylinder(0.065, 0.055, 0.09, METAL_DARK, { roughness: 0.35, metalness: 0.6 })
  carcaca.rotation.x = Math.PI / 2
  carcaca.position.z = 0.06
  lanterna.add(carcaca)
  const lente = cylinder(0.052, 0.052, 0.012, LAMP, { emissive: LAMP, emissiveIntensity: 1.6 })
  lente.rotation.x = Math.PI / 2
  lente.position.z = 0.108
  lanterna.add(lente)
  const aro = torus(0.058, 0.01, STEEL, { roughness: 0.3, metalness: 0.8 })
  aro.position.z = 0.108
  lanterna.add(aro)

  // ---- pote de formigas LITE na garra erguida ------------------------------------
  const JAR_R = 0.17
  const JAR_H = 0.34
  const pote = new THREE.Group()
  pote.position.set(pL[0] + 0.02, pL[1] + 0.08 + JAR_H / 2, pL[2] + 0.06)
  pote.rotation.z = 0.12
  tamandua.add(pote)

  const vidro = lathe(
    [
      [0, 0], [JAR_R - 0.02, 0], [JAR_R, 0.025], [JAR_R, JAR_H - 0.06],
      [JAR_R - 0.025, JAR_H - 0.03], [JAR_R - 0.035, JAR_H - 0.025], [0, JAR_H - 0.025],
    ],
    GLASS,
    { roughness: 0.12 },
  )
  vidro.position.y = -JAR_H / 2
  pote.add(vidro)

  const tampa = cylinder(JAR_R - 0.02, JAR_R - 0.02, 0.05, '#c9ced3', { roughness: 0.3, metalness: 0.7 })
  tampa.position.y = JAR_H / 2 - 0.005
  pote.add(tampa)
  const frisos = torus(JAR_R - 0.02, 0.008, '#aab0b6', { roughness: 0.3, metalness: 0.7 })
  frisos.rotation.x = Math.PI / 2
  frisos.position.y = JAR_H / 2 - 0.005
  pote.add(frisos)

  // rótulo turquesa envolvendo a frente
  const rotulo = new THREE.Mesh(
    new THREE.CylinderGeometry(JAR_R + 0.004, JAR_R + 0.004, 0.15, 32, 1, true, -1.15, 2.3),
    mat(LITE, { roughness: 0.5, size: 0.3 }),
  )
  rotulo.position.y = -0.005
  pote.add(rotulo)

  // LITE curvado sobre o rótulo
  const H = 0.095
  const letras = ['L', 'I', 'T', 'E']
  const advs = letras.map((c) => (c === 'I' ? H * 0.22 : H * 0.64) + H * 0.2)
  const total = advs.reduce((a, b) => a + b, 0) - H * 0.2
  let x = -total / 2
  letras.forEach((c, i) => {
    const cx = x + (advs[i] - H * 0.2) / 2
    const ang = cx / (JAR_R + 0.01)
    const l = glyph(c, H, '#ffffff', 0.014)
    l.position.set(Math.sin(ang) * (JAR_R + 0.01), -0.005, Math.cos(ang) * (JAR_R + 0.01))
    l.rotation.y = ang
    pote.add(l)
    x += advs[i]
  })

  // formigas visíveis pelo vidro, acima e abaixo do rótulo
  for (let i = 0; i < 14; i++) {
    const a = (rand() - 0.5) * 2.6 + (i % 2 ? 0 : Math.PI)
    const yy = i % 2 ? (rand() > 0.5 ? 0.1 : -0.11) + (rand() - 0.5) * 0.03 : (rand() - 0.5) * 0.24
    const formiga = new THREE.Group()
    formiga.position.set(Math.sin(a) * (JAR_R + 0.002), yy, Math.cos(a) * (JAR_R + 0.002))
    formiga.rotation.y = a
    formiga.rotation.z = rand() * Math.PI
    for (const k of [-1, 0, 1]) {
      const seg = sphere(0.011, ANT, { roughness: 0.3 }, 10)
      seg.position.x = k * 0.017
      formiga.add(seg)
    }
    pote.add(formiga)
  }

  // ---- peças -------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'lote', object: base },
    { name: 'placa', group: 'lote', object: placa },
    { name: 'cadeira', group: 'set', object: cadeira },
    { name: 'claquete', group: 'set', object: claquete },
    { name: 'ripa', group: 'set', object: ripa },
    { name: 'cratera', group: 'furo', object: cratera },
    { name: 'torroes', group: 'furo', object: torroes },
    { name: 'tamandua', group: 'furo', object: tamandua },
    { name: 'capacete', group: 'furo', object: capacete },
    { name: 'focinho', group: 'furo', object: focinho },
    { name: 'pote', group: 'lite', object: pote },
  ]

  const pop = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const clap = (at: number, caption?: string) => [
    seq(`ripa-bate-${at}`, 'ripa', at, 0.13, [ch('rotation.z', RIPA_OPEN, 0)], { ease: 'easeIn', caption }),
    seq(`ripa-abre-${at}`, 'ripa', at + 0.16, 0.26, [ch('rotation.z', 0, RIPA_OPEN)], { ease: 'easeOut' }),
  ]

  // ---- montagem ----------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Num LOTE baldio, montaram um set de filmagem.',
    }),
    seq('placa-rise', 'placa', 0.15, 0.8, [riseFrom(GY, 1.5)], { ease: 'easeOut' }),

    seq('cadeira-rise', 'cadeira', 1.5, 0.75, [riseFrom(GY, 1.2)], {
      ease: 'easeOut',
      caption: 'A cadeira do diretor está vazia: a estrela não apareceu.',
    }),
    seq('claquete-rise', 'claquete', 2.5, 0.8, [riseFrom(GY, 1.9)], { ease: 'easeOut' }),
    ...clap(3.6, 'A claquete já bateu a CENA três vezes…'),
    ...clap(4.1),
    ...clap(4.6),

    seq('cratera-estoura', 'cratera', 5.6, 0.35, pop(), {
      ease: 'easeOut',
      caption: 'De repente o chão estoura: o tamanduá FURA o LOTE por baixo — FUR-LÔT!',
    }),
    seq('torroes-voam', 'torroes', 5.6, 0.6, pop(0.05), { ease: 'easeOut' }),
    seq('tamandua-brota', 'tamandua', 5.65, 0.7, [riseFrom(0, 2.0)], { ease: 'easeOut' }),
    seq('capacete-pop', 'capacete', 6.4, 0.4, pop(), {
      ease: 'easeOut',
      caption: 'Brota de capacete de mineiro, focinho sujo de terra.',
    }),
    seq('focinho-estica', 'focinho', 6.55, 0.5, [ch('scale.z', 0.15, 1)], { ease: 'easeOut' }),

    seq('pote-pop', 'pote', 8.0, 0.5, pop(), {
      ease: 'easeOut',
      caption: 'Na garra erguida, a desculpa: o lanche de formigas LITE — IÁ É LÍ-TE…',
    }),
    seq('pote-sacode', 'pote', 8.55, 0.45, [ch('rotation.z', -0.25, 0.12)], { ease: 'easeInOut' }),

    seq('focinho-aponta', 'focinho', 9.7, 0.5, [ch('rotation.x', 0.35, -0.12)], {
      ease: 'easeOut',
      caption: 'Ofegante, ele aponta o focinho para a claquete: SÊÊN(a)!',
    }),
    ...clap(10.9, 'Förlåt, jag är lite sen. — Desculpa, estou um pouco atrasado.'),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 2.6, 5.25], target: [0, 1.15, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'forlat-jag-ar-lite-sen',
    contexto:
      'Atraso: chegando em reunião, consulta, fika ou na busca do filho na förskola — ou por SMS antes de chegar.',
    fraseFonte: 'Desculpa, estou um pouco atrasado.',
    fraseAlvo: 'Förlåt, jag är lite sen.',
    pronuncia:
      "fö-LÔT, iá é LÍ-te SÊÊN ('förlåt' com força no LÔT e ô fechado; 'jag' = iá; 'lite' = LÍ-te, nunca 'láite'; 'sen' com Ê fechado e longo, N sem nasal)",
    ponteSonora:
      "FUR-LÔT! IÁ É LÍ-TE SÊÊN! (7 sílabas: fur-LÔT-iá-é-LÍ-te-SÊÊN; tônicas em LÔT, LÍ e SÊÊN; FUR-LÔT = o FURA-LOTE de 'Förlåt, det var mitt fel' — FUR fraquinho e rápido, força no LÔT com Ô FECHADO, e nenhuma vogal depois do T; IÁ É = 'jag är', o de sempre: I de ioga, nunca J chiado, e É aberto e curto; LÍ-TE = o LITE de 'Vänta lite' e 'prata lite', LÍ-te, nunca 'láite'; SÊÊN = a CENA cortada no N: Ê FECHADO e LONGO, N batido na língua, sem nasalar — pense 'SÊ-N(a)' com a língua já no N e o A engolido, nunca o 'sẽi' de SEM; o mesmo SÊN da Mega-SENA de 'Jag ringer dig senare': 'sen' é atrasado, 'senare' é mais tarde)",
    historia:
      'Num LOTE baldio virado set de filmagem, a claquete já bateu a CENA três vezes e a estrela não aparece. De repente o chão estoura: o tamanduá FURA o LOTE por baixo com as garras-escavadeira — FUR-LÔT! — e brota de capacete de mineiro, focinho sujo de terra. Na garra erguida, a desculpa: o potinho de formigas LITE que ele parou pra lanchar — IÁ É LÍTE... Ofegante, aponta a claquete: SÊÊN(a)! Desculpa, cheguei um pouco atrasado pra cena.',
  },
  createScene,
  refine: { organic: ['tamandua', 'focinho'] },
}

export default card
