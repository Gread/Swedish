import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Grattis på födelsedagen!" — GRÁTIS, PÔ! FÖÖ-deu-SEDÃ!
 *
 * É aniversário da zebra e a concessionária pendurou a placa GRÁTIS no
 * para-brisa: quem apagar todas as velas num sopro só leva o carro. A zebra,
 * de chapeuzinho de festa, faz um bico enorme e sopra FÖÖÖÖ — as velas se
 * apagam, a fumacinha sobe... e deu SEDÃ: o sedã listrado de laço vermelho.
 *
 * Diorama: piso claro de showroom com plataforma giratória; o sedã listrado
 * atrás à direita, em 3/4, com a placa amarela no capô; mesinha branca com o
 * bolo rosa no meio; a zebra em pé à esquerda, de perfil para o bolo.
 */

const FLOOR = '#d6d9dd'
const FLOOR_EDGE = '#9aa0a7'
const FLOOR_LINE = '#c3c7cc'
const DECK = '#b4bac1'
const ZW = '#f2efe8'       // branco da zebra / do sedã
const ZB = '#26252a'       // preto das listras
const MUZZLE = '#3c3a40'
const GLASS = '#2c3a4a'
const SILVER = '#c3c8ce'
const TIRE = '#1d1d21'
const PINK = '#f09ab5'
const PINK_DARK = '#d97895'
const CREAM = '#fbf6ee'
const HAT = '#4f86d6'
const SMOKE = '#a9adb3'
const GUST = '#cfe9f5'
const RED = '#d8232f'      // laço do presente
const YELLOW = '#f6c21c'   // acento saturado RESERVADO: a placa GRÁTIS
const INK = '#2a2420'

const GY = 0.18            // topo do piso
const DECK_Y = GY + 0.06   // topo da plataforma giratória
const CAR_POS: [number, number, number] = [0.92, DECK_Y, -0.78]
const CAR_YAW = -0.85
const ZEBRA_POS: [number, number, number] = [-0.62, GY, 0.4]
const ZEBRA_YAW = 1.2
const TABLE_POS: [number, number, number] = [0.26, GY, 0.74]
const TABLE_H = 0.78
const HEAD_Y = 1.72
const HEAD_PITCH = 0.55

/** Traço de letra: caixinha de borda arredondada em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.006, INK, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** G R Á T I S — letras de traço grosso, altura 0.15. */
function letter(which: 'G' | 'R' | 'A' | 'T' | 'I' | 'S') {
  const g = new THREE.Group()
  const t = 0.028
  const H = 0.15
  const hw = 0.042 // meia largura
  if (which === 'G') {
    g.add(stroke(t, H, -hw, 0))
    g.add(stroke(hw * 2, t, 0, H / 2 - t / 2))
    g.add(stroke(hw * 2, t, 0, -H / 2 + t / 2))
    g.add(stroke(t, H / 2, hw, -H / 4))
    g.add(stroke(hw, t, hw / 2, -0.004))
  } else if (which === 'R') {
    g.add(stroke(t, H, -hw, 0))
    g.add(stroke(hw * 1.8, t, -0.006, H / 2 - t / 2))
    g.add(stroke(hw * 1.8, t, -0.006, 0.004))
    g.add(stroke(t, H / 2 - 0.01, hw - 0.006, H / 4))
    g.add(stroke(t, H * 0.56, 0.018, -H / 4 - 0.004, 0.42))
  } else if (which === 'A') {
    g.add(stroke(t, H + 0.01, -0.024, 0, -0.3))
    g.add(stroke(t, H + 0.01, 0.024, 0, 0.3))
    g.add(stroke(0.056, 0.024, 0, -0.026))
    // acento agudo
    g.add(stroke(0.022, 0.05, 0.016, H / 2 + 0.05, -0.75))
  } else if (which === 'T') {
    g.add(stroke(hw * 2.2, t, 0, H / 2 - t / 2))
    g.add(stroke(t, H, 0, 0))
  } else if (which === 'I') {
    g.add(stroke(t, H, 0, 0))
  } else {
    g.add(stroke(hw * 2, t, 0, H / 2 - t / 2))
    g.add(stroke(hw * 2, t, 0, 0))
    g.add(stroke(hw * 2, t, 0, -H / 2 + t / 2))
    g.add(stroke(t, H / 2, -hw + t / 2, H / 4))
    g.add(stroke(t, H / 2, hw - t / 2, -H / 4))
  }
  return g
}

/** Membro de zebra: cápsula branca com anéis pretos (listras), eixo em y. */
function stripedLimb(r: number, len: number, rings: number, seed: number) {
  const g = new THREE.Group()
  g.add(capsule(r, len, ZW, { roughness: 0.75 }))
  for (let i = 0; i < rings; i++) {
    const ring = torus(r * 0.99, r * 0.09, ZB, { roughness: 0.75 })
    ring.rotation.x = Math.PI / 2
    ring.rotation.y = ((i + seed) % 2 === 0 ? 1 : -1) * (0.2 + ((i * 7 + seed) % 3) * 0.06)
    ring.position.y = -len / 2 + ((i + 0.6) / rings) * len
    g.add(ring)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: piso de showroom + plataforma giratória -----------------------
  const base = new THREE.Group()

  const edge = cylinder(2.62, 2.72, 0.12, FLOOR_EDGE, { roughness: 0.6 })
  edge.position.y = 0.06
  base.add(edge)

  const floor = cylinder(2.56, 2.6, 0.06, FLOOR, { roughness: 0.22 })
  floor.position.y = 0.15
  base.add(floor)

  // juntas do porcelanato: cordas do círculo nos dois sentidos
  for (const k of [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8]) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - k * k, 0.01))
    const lx = rbox(len, 0.008, 0.018, 0.004, FLOOR_LINE, { roughness: 0.4 })
    lx.position.set(0, GY + 0.002, k)
    base.add(lx)
    const lz = rbox(0.018, 0.008, len, 0.004, FLOOR_LINE, { roughness: 0.4 })
    lz.position.set(k, GY + 0.002, 0)
    base.add(lz)
  }

  const deck = cylinder(1.22, 1.26, 0.06, DECK, { roughness: 0.3, metalness: 0.5 })
  deck.position.set(CAR_POS[0], GY + 0.03, CAR_POS[2])
  base.add(deck)
  const deckRing = torus(1.24, 0.018, SILVER, { roughness: 0.25, metalness: 0.8 })
  deckRing.rotation.x = Math.PI / 2
  deckRing.position.set(CAR_POS[0], DECK_Y, CAR_POS[2])
  base.add(deckRing)

  root.add(base)

  // ---- sedã listrado (frente = +x local) -----------------------------------
  const carro = new THREE.Group()
  carro.position.set(...CAR_POS)
  carro.rotation.y = CAR_YAW

  const lower = rbox(2.2, 0.38, 0.92, 0.13, ZW, { roughness: 0.3 })
  lower.position.y = 0.4
  carro.add(lower)

  const cabin = rbox(1.04, 0.34, 0.84, 0.16, ZW, { roughness: 0.3 })
  cabin.position.set(-0.12, 0.74, 0)
  carro.add(cabin)

  // janelas: para-brisa, vigia traseira e duas laterais de cada lado
  const wind = rbox(0.04, 0.25, 0.7, 0.02, GLASS, { roughness: 0.1 })
  wind.position.set(0.4, 0.75, 0)
  carro.add(wind)
  const rear = rbox(0.04, 0.23, 0.66, 0.02, GLASS, { roughness: 0.1 })
  rear.position.set(-0.64, 0.75, 0)
  carro.add(rear)
  for (const side of [-1, 1]) {
    for (const [wx, ww] of [[0.12, 0.4], [-0.36, 0.36]] as const) {
      const win = rbox(ww, 0.22, 0.04, 0.03, GLASS, { roughness: 0.1 })
      win.position.set(wx, 0.77, side * 0.415)
      carro.add(win)
    }
  }

  // listras de zebra: faixas que abraçam a carroceria, de larguras variadas
  const bands: [number, number, number][] = [
    [-0.95, 0.09, 0.18], [-0.66, 0.12, -0.12], [-0.36, 0.1, 0.16],
    [-0.04, 0.12, -0.14], [0.3, 0.1, 0.12], [0.6, 0.11, -0.16], [0.88, 0.09, 0.14],
  ]
  for (const [bx, bw, tilt] of bands) {
    const band = rbox(bw, 0.392, 0.932, 0.05, ZB, { roughness: 0.3 })
    band.position.set(bx, 0.4, 0)
    band.rotation.z = tilt
    carro.add(band)
  }
  for (const [bx, bw] of [[-0.4, 0.1], [-0.04, 0.1]] as const) {
    const band = rbox(bw, 0.35, 0.852, 0.05, ZB, { roughness: 0.3 })
    band.position.set(bx, 0.745, 0)
    carro.add(band)
  }

  // caixas de roda escuras atrás dos pneus
  for (const wx of [-0.72, 0.72]) {
    const well = cylinder(0.25, 0.25, 0.94, '#3a3a40', { roughness: 0.8 })
    well.rotation.x = Math.PI / 2
    well.position.set(wx, 0.22, 0)
    carro.add(well)
  }

  // frente: faróis, grade, para-choques
  for (const side of [-1, 1]) {
    const light = sphere(0.075, '#fff4cf', { roughness: 0.15 })
    light.scale.set(0.5, 0.8, 1.3)
    light.position.set(1.095, 0.46, side * 0.31)
    carro.add(light)
    const tail = rbox(0.03, 0.08, 0.16, 0.012, '#b3262f', { roughness: 0.3 })
    tail.position.set(-1.1, 0.47, side * 0.32)
    carro.add(tail)
    const handle = rbox(0.1, 0.025, 0.02, 0.01, SILVER, { roughness: 0.25, metalness: 0.8 })
    handle.position.set(-0.05, 0.54, side * 0.468)
    carro.add(handle)
    const mirror = rbox(0.08, 0.07, 0.1, 0.025, ZB, { roughness: 0.3 })
    mirror.position.set(0.34, 0.66, side * 0.5)
    carro.add(mirror)
  }
  const grille = rbox(0.03, 0.12, 0.38, 0.03, ZB, { roughness: 0.4 })
  grille.position.set(1.1, 0.41, 0)
  carro.add(grille)
  for (const bx of [-1.1, 1.1]) {
    const bumper = rbox(0.1, 0.09, 0.96, 0.04, SILVER, { roughness: 0.25, metalness: 0.8 })
    bumper.position.set(bx, 0.27, 0)
    carro.add(bumper)
  }
  root.add(carro)

  // ---- rodas (filhas do carro) --------------------------------------------
  const rodas = new THREE.Group()
  for (const wx of [-0.72, 0.72]) {
    for (const wz of [-0.42, 0.42]) {
      const wheel = new THREE.Group()
      wheel.position.set(wx, 0.2, wz)
      const tire = cylinder(0.2, 0.2, 0.15, TIRE, { roughness: 0.85 })
      tire.rotation.x = Math.PI / 2
      wheel.add(tire)
      const cap = cylinder(0.12, 0.12, 0.16, SILVER, { roughness: 0.2, metalness: 0.85 })
      cap.rotation.x = Math.PI / 2
      wheel.add(cap)
      const hub = sphere(0.04, '#8b9097', { roughness: 0.25, metalness: 0.8 })
      hub.position.z = Math.sign(wz) * 0.08
      wheel.add(hub)
      rodas.add(wheel)
    }
  }
  carro.add(rodas)

  // ---- laço vermelho no teto (filho do carro) ------------------------------
  const laco = new THREE.Group()
  laco.position.set(-0.12, 0.92, 0)

  const fitaZ = rbox(0.1, 0.03, 0.88, 0.012, RED, { roughness: 0.35 })
  fitaZ.position.y = -0.005
  laco.add(fitaZ)
  const fitaX = rbox(0.62, 0.03, 0.1, 0.012, RED, { roughness: 0.35 })
  fitaX.position.y = -0.005
  laco.add(fitaX)
  // o laço em si fica de frente para a câmera (desfaz o giro do carro)
  const bow = new THREE.Group()
  bow.rotation.y = -CAR_YAW
  for (const side of [-1, 1]) {
    const loop = torus(0.115, 0.042, RED, { roughness: 0.35 })
    loop.scale.set(1.35, 0.85, 0.75)
    loop.position.set(side * 0.16, 0.13, 0)
    loop.rotation.set(0, side * 0.25, side * 0.38)
    bow.add(loop)
    const tail = rbox(0.075, 0.2, 0.025, 0.012, RED, { roughness: 0.35 })
    tail.position.set(side * 0.08, 0.035, 0.1)
    tail.rotation.set(-1.25, 0, side * 0.5)
    bow.add(tail)
  }
  const knot = sphere(0.065, RED, { roughness: 0.35 })
  knot.scale.set(1, 0.95, 0.85)
  knot.position.set(0, 0.11, 0.01)
  bow.add(knot)
  laco.add(bow)
  carro.add(laco)

  // ---- placa GRÁTIS apoiada no para-brisa ----------------------------------
  carro.updateMatrix()
  const signAt = new THREE.Vector3(0.56, 0.74, 0).applyMatrix4(carro.matrix)
  const placa = new THREE.Group()
  placa.position.copy(signAt)
  placa.rotation.set(-0.2, 0.42, 0)

  const board = rbox(0.7, 0.26, 0.04, 0.04, YELLOW, { roughness: 0.4 })
  placa.add(board)
  const frame = rbox(0.74, 0.3, 0.03, 0.05, '#e0a512', { roughness: 0.45 })
  frame.position.z = -0.012
  placa.add(frame)
  const glyphs: ['G' | 'R' | 'A' | 'T' | 'I' | 'S', number][] = [
    ['G', -0.31], ['R', -0.185], ['A', -0.06], ['T', 0.065], ['I', 0.165], ['S', 0.265],
  ]
  const word = new THREE.Group()
  word.scale.setScalar(0.88)
  word.position.set(0.02, -0.015, 0.025)
  for (const [gl, gx] of glyphs) {
    const l = letter(gl)
    l.position.x = gx
    word.add(l)
  }
  placa.add(word)
  // escora atrás da placa
  const prop = rbox(0.04, 0.3, 0.04, 0.015, '#e0a512', { roughness: 0.45 })
  prop.position.set(0, -0.08, -0.1)
  prop.rotation.x = 0.6
  placa.add(prop)
  root.add(placa)

  // ---- mesinha redonda branca ----------------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(...TABLE_POS)
  const top = cylinder(0.34, 0.34, 0.045, CREAM, { roughness: 0.35 })
  top.position.y = TABLE_H - 0.022
  mesa.add(top)
  const rim = torus(0.34, 0.016, '#e7e1d6', { roughness: 0.35 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = TABLE_H - 0.022
  mesa.add(rim)
  const stem = lathe(
    [[0, 0], [0.22, 0], [0.22, 0.02], [0.08, 0.06], [0.045, 0.14], [0.04, TABLE_H - 0.1], [0.08, TABLE_H - 0.05], [0, TABLE_H - 0.05]],
    CREAM,
    { roughness: 0.35 },
  )
  mesa.add(stem)
  root.add(mesa)

  // ---- bolo rosa com velas -------------------------------------------------
  const bolo = new THREE.Group()
  bolo.position.set(TABLE_POS[0], GY + TABLE_H, TABLE_POS[2])

  const plate = cylinder(0.27, 0.24, 0.02, '#ffffff', { roughness: 0.2 })
  plate.position.y = 0.01
  bolo.add(plate)
  const cake = lathe(
    [[0, 0.02], [0.2, 0.02], [0.205, 0.04], [0.205, 0.17], [0.195, 0.19], [0, 0.19]],
    PINK,
    { roughness: 0.6 },
  )
  bolo.add(cake)
  const frost = torus(0.185, 0.028, CREAM, { roughness: 0.5 })
  frost.rotation.x = Math.PI / 2
  frost.position.y = 0.185
  bolo.add(frost)
  const baseFrost = torus(0.205, 0.022, PINK_DARK, { roughness: 0.6 })
  baseFrost.rotation.x = Math.PI / 2
  baseFrost.position.y = 0.035
  bolo.add(baseFrost)
  // escorridos de cobertura na lateral
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const drip = capsule(0.022, 0.03 + (i % 3) * 0.02, CREAM, { roughness: 0.5 })
    drip.position.set(Math.cos(a) * 0.2, 0.15 - (i % 3) * 0.01, Math.sin(a) * 0.2)
    bolo.add(drip)
  }
  // velas brancas com faixa rosa
  const CANDLE_TOP = 0.19 + 0.14
  const candleSpots: [number, number][] = [[0, 0]]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3
    candleSpots.push([Math.cos(a) * 0.12, Math.sin(a) * 0.12])
  }
  for (const [cx, cz] of candleSpots) {
    const candle = cylinder(0.016, 0.016, 0.14, '#ffffff', { roughness: 0.4 })
    candle.position.set(cx, 0.19 + 0.07, cz)
    bolo.add(candle)
    const band = torus(0.017, 0.006, PINK_DARK, { roughness: 0.4 })
    band.rotation.x = Math.PI / 2
    band.position.set(cx, 0.19 + 0.07, cz)
    bolo.add(band)
    const wick = cylinder(0.004, 0.004, 0.025, '#2b2622', { roughness: 0.8 })
    wick.position.set(cx, CANDLE_TOP + 0.012, cz)
    bolo.add(wick)
  }
  root.add(bolo)

  // ---- chamas (somem no sopro) — filhas do bolo -----------------------------
  const chamas = new THREE.Group()
  chamas.position.y = CANDLE_TOP + 0.03
  for (const [cx, cz] of candleSpots) {
    const flame = sphere(0.022, '#ffb238', { emissive: '#ff9a1f', emissiveIntensity: 1.6, roughness: 0.4 })
    flame.scale.set(0.8, 1.6, 0.8)
    flame.position.set(cx, 0.01, cz)
    chamas.add(flame)
  }
  bolo.add(chamas)

  // ---- fumacinha cinza subindo das velas — filha do bolo -------------------
  const fumaca = new THREE.Group()
  fumaca.position.y = CANDLE_TOP + 0.04
  // fiapos que sobem tortos, empurrados pelo sopro (direção zebra → bolo)
  const drift = new THREE.Vector3(Math.sin(ZEBRA_YAW), 0, Math.cos(ZEBRA_YAW))
  candleSpots.forEach(([cx, cz], i) => {
    for (let k = 0; k < 3; k++) {
      const s = sphere(0.013 + k * 0.006, SMOKE, { roughness: 0.95 })
      const d = k * 0.035 + Math.sin(i * 1.7 + k) * 0.01
      s.position.set(cx + drift.x * d, 0.02 + k * 0.06 + (i % 2) * 0.03, cz + drift.z * d)
      fumaca.add(s)
    }
  })
  bolo.add(fumaca)

  // ---- zebra (frente = +z local) -------------------------------------------
  const zebra = new THREE.Group()
  zebra.position.set(...ZEBRA_POS)
  zebra.rotation.y = ZEBRA_YAW

  for (const side of [-1, 1]) {
    const thigh = stripedLimb(0.13, 0.26, 2, side)
    thigh.position.set(side * 0.15, 0.48, -0.02)
    thigh.rotation.x = -0.12
    zebra.add(thigh)
    const shin = stripedLimb(0.095, 0.24, 2, side + 1)
    shin.position.set(side * 0.15, 0.2, 0.0)
    zebra.add(shin)
    const hoof = cylinder(0.1, 0.11, 0.09, ZB, { roughness: 0.6 })
    hoof.position.set(side * 0.15, 0.045, 0.02)
    zebra.add(hoof)
  }

  const hips = sphere(0.26, ZW, { roughness: 0.75 })
  hips.scale.set(1.05, 0.85, 0.9)
  hips.position.set(0, 0.68, -0.02)
  zebra.add(hips)

  const torso = stripedLimb(0.25, 0.44, 6, 0)
  torso.position.set(0, 1.04, 0.04)
  torso.rotation.x = 0.14
  zebra.add(torso)

  const neck = stripedLimb(0.13, 0.26, 2, 1)
  neck.position.set(0, 1.46, 0.13)
  neck.rotation.x = 0.4
  zebra.add(neck)

  // crina espetada descendo pela nuca
  for (let i = 0; i < 4; i++) {
    const spike = cone(0.045, 0.13, ZB, { roughness: 0.8 })
    spike.position.set(0, 1.62 - i * 0.09, 0.07 - i * 0.05)
    spike.rotation.x = -0.5
    zebra.add(spike)
  }

  // braços (patas dianteiras) abertos de festa
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(side * 0.27, 1.26, 0.08)
    arm.rotation.set(-1.05, 0, side * 0.2)
    const upper = stripedLimb(0.075, 0.3, 2, side)
    upper.position.y = -0.2
    arm.add(upper)
    const fhoof = cylinder(0.075, 0.08, 0.07, ZB, { roughness: 0.6 })
    fhoof.position.y = -0.42
    arm.add(fhoof)
    zebra.add(arm)
  }

  // rabo com tufo preto
  const tail = capsule(0.03, 0.34, ZW, { roughness: 0.75 })
  tail.position.set(0, 0.62, -0.38)
  tail.rotation.x = 0.55
  zebra.add(tail)
  const tuft = sphere(0.06, ZB, { roughness: 0.85 })
  tuft.scale.set(0.9, 1.4, 0.9)
  tuft.position.set(0, 0.45, -0.5)
  zebra.add(tuft)

  root.add(zebra)

  // ---- cabeça (olha para o bolo, inclinada para baixo) ----------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, HEAD_Y, 0.26)
  cabeca.rotation.x = HEAD_PITCH
  zebra.add(cabeca)

  const skull = sphere(0.17, ZW, { roughness: 0.75 })
  skull.scale.set(0.95, 1.0, 1.1)
  cabeca.add(skull)

  const snout = stripedLimb(0.105, 0.2, 2, 0)
  snout.rotation.x = Math.PI / 2
  snout.position.set(0, -0.05, 0.2)
  cabeca.add(snout)

  const muzzle = sphere(0.11, MUZZLE, { roughness: 0.55 })
  muzzle.scale.set(1, 0.95, 0.8)
  muzzle.position.set(0, -0.06, 0.37)
  cabeca.add(muzzle)

  // bochechas infladas do sopro
  for (const side of [-1, 1]) {
    const cheek = sphere(0.1, ZW, { roughness: 0.75 })
    cheek.position.set(side * 0.105, -0.09, 0.21)
    cabeca.add(cheek)
  }

  for (const side of [-1, 1]) {
    const ear = cone(0.055, 0.2, ZW, { roughness: 0.75 })
    ear.position.set(side * 0.1, 0.18, -0.06)
    ear.rotation.set(-0.35, 0, -side * 0.45)
    cabeca.add(ear)
    const earTip = cone(0.03, 0.07, ZB, { roughness: 0.75 })
    earTip.position.set(side * 0.145, 0.27, -0.09)
    earTip.rotation.set(-0.35, 0, -side * 0.45)
    cabeca.add(earTip)

    const eye = sphere(0.045, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.13, 0.05, 0.1)
    eye.scale.set(0.6, 1, 1)
    cabeca.add(eye)
    const pupil = sphere(0.024, '#151515', { roughness: 0.2 })
    pupil.position.set(side * 0.155, 0.05, 0.12)
    cabeca.add(pupil)
    const nostril = sphere(0.018, '#151515', { roughness: 0.4 })
    nostril.position.set(side * 0.045, 0.0, 0.45)
    cabeca.add(nostril)
  }

  // topete preto espetado
  for (let i = 0; i < 4; i++) {
    const spike = cone(0.04, 0.12, ZB, { roughness: 0.8 })
    spike.position.set(0, 0.16 - i * 0.02, 0.06 - i * 0.07)
    spike.rotation.x = -0.25 - i * 0.2
    cabeca.add(spike)
  }

  // ---- bico do sopro (filho da cabeça) -------------------------------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.07, 0.44)
  const lips = torus(0.05, 0.032, MUZZLE, { roughness: 0.5 })
  lips.position.z = 0.1
  bico.add(lips)
  const lipTube = cylinder(0.065, 0.08, 0.1, MUZZLE, { roughness: 0.5 })
  lipTube.rotation.x = Math.PI / 2
  lipTube.position.z = 0.05
  bico.add(lipTube)
  const hole = sphere(0.03, '#1a1416', { roughness: 0.6 })
  hole.position.z = 0.115
  hole.scale.z = 0.4
  bico.add(hole)
  cabeca.add(bico)

  // ---- sopro: rajadas azul-claras do bico até as velas ---------------------
  const sopro = new THREE.Group()
  sopro.position.set(0, -0.07, 0.6)
  for (const [gx, gy, len] of [[0, 0, 0.3], [0.06, 0.05, 0.22], [-0.06, -0.04, 0.24]] as const) {
    const gust = capsule(0.018, len, GUST, { roughness: 0.6 })
    gust.rotation.x = Math.PI / 2
    gust.position.set(gx, gy, len / 2 + 0.04)
    sopro.add(gust)
  }
  const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 24, Math.PI * 1.4), mat(GUST, { roughness: 0.6 }))
  swirl.position.set(0, 0.0, 0.4)
  swirl.rotation.y = Math.PI / 2
  sopro.add(swirl)
  cabeca.add(sopro)

  // ---- chapéu de festa em cone (filho da cabeça) ---------------------------
  const chapeu = new THREE.Group()
  chapeu.position.set(0.03, 0.2, -0.02)
  chapeu.rotation.set(-0.3, 0, -0.22)
  const hatCone = cone(0.11, 0.3, HAT, { roughness: 0.5 })
  hatCone.position.y = 0.15
  chapeu.add(hatCone)
  for (const [hy, hr] of [[0.06, 0.092], [0.15, 0.062], [0.23, 0.035]] as const) {
    const ring = torus(hr, 0.011, CREAM, { roughness: 0.5 })
    ring.rotation.x = Math.PI / 2
    ring.position.y = hy
    chapeu.add(ring)
  }
  const pom = puff(0.04, CREAM, 5, 11, { roughness: 0.9 })
  pom.position.y = 0.31
  chapeu.add(pom)
  const brimRing = torus(0.11, 0.014, CREAM, { roughness: 0.5 })
  brimRing.rotation.x = Math.PI / 2
  chapeu.add(brimRing)
  cabeca.add(chapeu)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'showroom', object: base },
    { name: 'carro', group: 'seda', object: carro },
    { name: 'rodas', group: 'seda', object: rodas },
    { name: 'laco', group: 'seda', object: laco },
    { name: 'placa', group: 'gratis', object: placa },
    { name: 'mesa', group: 'bolo', object: mesa },
    { name: 'bolo', group: 'bolo', object: bolo },
    { name: 'chamas', group: 'bolo', object: chamas },
    { name: 'zebra', group: 'zebra', object: zebra },
    { name: 'cabeca', group: 'zebra', object: cabeca },
    { name: 'chapeu', group: 'zebra', object: chapeu },
    { name: 'bico', group: 'foo', object: bico },
    { name: 'sopro', group: 'foo', object: sopro },
    { name: 'fumaca', group: 'foo', object: fumaca },
  ]

  const scale3 = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma concessionária reluzente sobe do chão…',
    }),
    seq('carro-rise', 'carro', 0.9, 0.9, [riseFrom(DECK_Y, 1.6)], {
      ease: 'easeOut',
      caption: '…e na plataforma gira um SEDÃ zerinho, listrado de preto e branco.',
    }),
    seq('carro-gira', 'carro', 0.9, 1.4, [ch('rotation.y', CAR_YAW - 1.6, CAR_YAW)], { ease: 'easeOut' }),
    seq('rodas-cresce', 'rodas', 1.2, 0.6, scale3(0.01, 1), { ease: 'easeOut' }),
    seq('laco-pop', 'laco', 2.2, 0.6, [...scale3(0.01, 1), ch('rotation.y', -1.2, 0)], { ease: 'easeOut' }),

    seq('placa-cai', 'placa', 3.1, 0.7, [
      ch('position.y', signAt.y + 1.4, signAt.y), ch('rotation.z', 0.5, 0),
    ], {
      ease: 'easeOut',
      caption: 'No para-brisa, a placa: GRÁTIS, PÔ! — leva quem apagar as velas num sopro só.',
    }),

    seq('mesa-rise', 'mesa', 5.0, 0.7, [riseFrom(GY, 0.9)], {
      ease: 'easeOut',
      caption: 'É aniversário da zebra: mesinha, bolo rosa, velinhas acesas…',
    }),
    seq('bolo-pousa', 'bolo', 5.4, 0.6, [
      ch('position.y', GY + TABLE_H + 0.6, GY + TABLE_H), ...scale3(0.3, 1),
    ], { ease: 'easeOut' }),
    seq('chamas-acende', 'chamas', 5.9, 0.4, scale3(0.01, 1), { ease: 'easeOut' }),

    seq('zebra-rise', 'zebra', 6.6, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: '…e ela chega de chapeuzinho de festa, de olho no prêmio.',
    }),
    seq('cabeca-ergue', 'cabeca', 6.6, 0.01, [ch('rotation.x', -0.15, -0.15)]),
    seq('bico-fechado', 'bico', 6.6, 0.01, [ch('scale.z', 0.2, 0.2)]),
    seq('chapeu-cai', 'chapeu', 7.3, 0.6, [
      ch('position.y', 0.75, 0.2), ...scale3(0.3, 1),
    ], { ease: 'easeOut' }),
    seq('cabeca-mira', 'cabeca', 8.2, 0.6, [ch('rotation.x', -0.15, HEAD_PITCH)], { ease: 'easeInOut' }),

    seq('bico-estica', 'bico', 8.5, 0.6, [ch('scale.z', 0.2, 1)], {
      ease: 'easeOut',
      caption: 'Ela faz um bico ENORME e sopra: FÖÖÖÖÖ!',
    }),
    seq('sopro-sai', 'sopro', 9.0, 0.5, [ch('scale.z', 0.05, 1), ch('scale.x', 0.5, 1)], { ease: 'easeOut' }),
    seq('chamas-apaga', 'chamas', 9.45, 0.3, scale3(1, 0.01), { ease: 'easeIn' }),
    seq('fumaca-sobe', 'fumaca', 9.6, 0.9, [
      ch('position.y', CANDLE_TOP - 0.05, CANDLE_TOP + 0.04), ...scale3(0.2, 1),
    ], {
      ease: 'easeOut',
      caption: 'Todas as velas se apagam, a fumacinha sobe… e DEU SEDÃ!',
    }),

    seq('carro-pula', 'carro', 10.7, 0.25, [ch('position.y', DECK_Y, DECK_Y + 0.14)], { ease: 'easeOut' }),
    seq('carro-pousa', 'carro', 10.95, 0.3, [ch('position.y', DECK_Y + 0.14, DECK_Y)], { ease: 'easeIn' }),
    seq('laco-balanca', 'laco', 10.8, 0.5, [...scale3(1, 1.25)], { ease: 'easeOut' }),
    seq('laco-volta', 'laco', 11.3, 0.5, [...scale3(1.25, 1)], {
      ease: 'easeInOut',
      caption: 'Grattis på födelsedagen! — Feliz aniversário!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.1, 4.75], target: [0.4, 1.1, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'grattis-pa-fodelsedagen',
    contexto:
      'Aniversário de colega na fika com tårta, mensagem no Facebook/SMS, festa de criança. "Grattis!" sozinho serve para qualquer parabéns.',
    fraseFonte: 'Feliz aniversário!',
    fraseAlvo: 'Grattis på födelsedagen!',
    pronuncia:
      "GRÁT-tis pô FÖÖ-del-se-DÁ-guen — na fala solta: FÖÖ-del-se-DÁN ('grattis' com T duro, nunca 'grátchis'; 'på' = pô de boca redonda; FÖÖ com bico de Ô e língua de Ê, longo; o '-dagen' vira 'dan' na boca de todo mundo)",
    ponteSonora:
      "GRÁTIS, PÔ! FÖÖ-deu-se-DÁN! (7 sílabas, força no GRÁ e no FÖÖ, e uma força menor no DÁN; GRÁTIS é o grátis do português mesmo, mas com T DURO — nunca 'grátchis'; PÔ = o 'på' de sempre, Ô FECHADO de boca redonda; FÖÖ = o sopro nas velas: BICO DE Ô com língua de Ê, longo — e é tudo UMA palavra, sem pausa depois do sopro; 'deu-se' sai fraquinho e corrido, como 'deu sedã!' dito de uma vez, em que a força cai no DÃ e nunca no DEU (fö-DEU-se-dan é tônica errada); o 'deu' fecha com L de língua no céu da boca, não com U; SEDÁN = o carro SEDÃ sem nasalar: A aberto e longo e N batido na língua — é o '-dagen' do jeito que todo sueco fala, 'födelsedan')",
    historia:
      'É aniversário da zebra e a concessionária pendurou a placa: GRÁTIS, PÔ! — quem apagar todas as velas do bolo num sopro só leva o carro de presente. A zebra faz um bico enorme e sopra FÖÖÖÖ — trinta velas se apagam de uma vez, a fumacinha sobe... e deu SEDÃ! O sedã listradinho de preto e branco, de laço vermelho no teto, é dela. GRÁTIS, PÔ, FÖÖ-deu-SEDÃ: feliz aniversário!',
  },
  createScene,
  refine: { organic: ['zebra', 'cabeca'] },
}

export default card
