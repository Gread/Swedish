import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Jag ringer dig senare." — no meio do RINGUE, a freira boxeadora solta o
 * gancho gritando IÁ! e o saco de pancada voa contra as cordas. No córner, o
 * telefone vermelho toca sem parar; ela nem olha: ergue o bilhete da
 * Mega-SENA e berra DEI SENA! — agora não, eu te ligo mais tarde.
 *
 * Diorama: tablado azul do ringue com postes de canto e cordas brancas
 * (frente aberta para a câmera); freira de hábito no centro, de costas para o
 * banquinho do córner onde o telefone pula no gancho; saco tombado nas cordas.
 */

const ARENA = '#2b2d33'
const APRON = '#24407a'
const CANVAS = '#4a6fae'
const CANVAS_LINE = '#5d82c0'
const STEEL = '#5d646c'
const PAD = '#8f2f33'
const ROPE = '#f1ece2'
const HABIT = '#1f1d22'
const WHITE = '#f4f1ea'
const SKIN = '#ebc6a0'
const GLOVE = '#c3262e'
const PHONE = '#c92a2a'
const WOOD = '#b98450'
const WOOD_DARK = '#8a5d33'
const BAG = '#6e2b2b'
const SENA = '#13a84a' // acento saturado RESERVADO ao bilhete da Mega-Sena

const PY = 0.5 // topo do tablado
const PX = 1.55 // meia-largura do ringue (postes)
const PZ = 1.35 // meia-profundidade
const NUN_X = -0.2
const NUN_Z = 0.15
const NUN_S = 1.32
const BAG_START: [number, number] = [-1.0, PY + 0.62]
const BAG_END: [number, number] = [-1.17, PY + 0.47]
const BAG_ROT = 0.55
const STOOL: [number, number] = [0.92, -0.78]
const STOOL_H = 0.5
const PUNCH = -1.5 // braço do gancho (rotation.z, pivô no ombro)
const FIST = -0.35 // pose final do braço do gancho: punho ao lado
const RAISE = 2.55 // braço do bilhete erguido
const FONE_Y = 0.33 // fone no ar, acima do gancho

/** Traço de letra do bilhete. */
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

/** Arco aberto (ondas do toque do telefone). */
function arc(r: number, tube: number, angle: number, color: string) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 28, angle), mat(color, { roughness: 0.4 }))
  m.castShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: piso da arena + tablado do ringue -----------------------------
  const base = new THREE.Group()
  const floor = cylinder(2.7, 2.8, 0.12, ARENA, { roughness: 0.9 })
  floor.position.y = 0.06
  base.add(floor)

  const APRON_H = PY - 0.12
  const apron = rbox(PX * 2 + 0.3, APRON_H, PZ * 2 + 0.3, 0.05, APRON, { roughness: 0.85 })
  apron.position.y = 0.12 + APRON_H / 2
  base.add(apron)
  // faixa branca na saia do tablado
  const stripe = rbox(PX * 2 + 0.32, 0.05, PZ * 2 + 0.32, 0.02, WHITE, { roughness: 0.7 })
  stripe.position.y = 0.12 + APRON_H * 0.55
  base.add(stripe)
  // lona do ringue
  const canvas = rbox(PX * 2 + 0.24, 0.04, PZ * 2 + 0.24, 0.02, CANVAS, { roughness: 0.92 })
  canvas.position.y = PY - 0.02
  base.add(canvas)
  // logo central: anel na lona
  const ring = torus(0.62, 0.022, CANVAS_LINE, { roughness: 0.92 })
  ring.rotation.x = Math.PI / 2
  ring.position.set(0, PY + 0.002, 0)
  base.add(ring)
  // degraus na lateral direita
  for (let k = 0; k < 2; k++) {
    const h = 0.28 - k * 0.14
    const step = rbox(0.34, h, 0.7, 0.03, STEEL, { roughness: 0.6, metalness: 0.4 })
    step.position.set(PX + 0.32 + k * 0.3, 0.12 + h / 2, 0.6)
    base.add(step)
  }
  root.add(base)

  // ---- postes de canto -----------------------------------------------------
  const postes = new THREE.Group()
  const POST_H = 1.25
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Group()
      post.position.set(sx * PX, PY, sz * PZ)
      const pole = cylinder(0.055, 0.065, POST_H, STEEL, { roughness: 0.35, metalness: 0.7 })
      pole.position.y = POST_H / 2
      post.add(pole)
      const cap = sphere(0.075, STEEL, { roughness: 0.35, metalness: 0.7 })
      cap.position.y = POST_H
      post.add(cap)
      // almofada do canto virada para dentro
      const pad = rbox(0.17, 0.92, 0.17, 0.06, PAD, { roughness: 0.6 })
      pad.position.set(-sx * 0.08, 0.66, -sz * 0.08)
      post.add(pad)
      postes.add(post)
    }
  }
  root.add(postes)

  // ---- cordas: fundo e laterais (frente aberta para a câmera) ---------------
  const cordas = new THREE.Group()
  for (const h of [0.38, 0.7, 1.02]) {
    const back = cylinder(0.028, 0.028, PX * 2, ROPE, { roughness: 0.7 })
    back.rotation.z = Math.PI / 2
    back.position.set(0, PY + h, -PZ)
    cordas.add(back)
    for (const sx of [-1, 1]) {
      const side = cylinder(0.028, 0.028, PZ * 2, ROPE, { roughness: 0.7 })
      side.rotation.x = Math.PI / 2
      side.position.set(sx * PX, PY + h, 0)
      cordas.add(side)
    }
  }
  root.add(cordas)

  // ---- saco de pancada tombado contra as cordas ----------------------------
  const saco = new THREE.Group()
  saco.position.set(BAG_END[0], BAG_END[1], 0.05)
  saco.rotation.z = BAG_ROT
  const bagBody = capsule(0.22, 0.62, BAG, { roughness: 0.55 })
  saco.add(bagBody)
  for (const by of [-0.2, 0.22]) {
    const band = torus(0.222, 0.018, '#2a2426', { roughness: 0.5 })
    band.rotation.x = Math.PI / 2
    band.position.y = by
    saco.add(band)
  }
  const bagLabel = rbox(0.2, 0.12, 0.03, 0.02, WHITE, { roughness: 0.6 })
  bagLabel.position.set(0, 0, 0.215)
  saco.add(bagLabel)
  const bagCap = cylinder(0.16, 0.2, 0.08, '#2a2426', { roughness: 0.5 })
  bagCap.position.y = 0.53
  saco.add(bagCap)
  const shackle = torus(0.06, 0.015, STEEL, { roughness: 0.3, metalness: 0.8 })
  shackle.position.y = 0.62
  saco.add(shackle)
  root.add(saco)

  // ---- banquinho do córner -------------------------------------------------
  const banquinho = new THREE.Group()
  banquinho.position.set(STOOL[0], PY, STOOL[1])
  const seat = lathe(
    [[0, 0], [0.24, 0], [0.26, 0.03], [0.25, 0.07], [0, 0.07]],
    WOOD,
    { roughness: 0.6 },
  )
  seat.position.y = STOOL_H - 0.07
  banquinho.add(seat)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4
    const leg = cylinder(0.025, 0.03, STOOL_H - 0.05, WOOD_DARK, { roughness: 0.7 })
    leg.position.set(Math.cos(a) * 0.16, (STOOL_H - 0.05) / 2, Math.sin(a) * 0.16)
    leg.rotation.set(Math.sin(a) * -0.15, 0, Math.cos(a) * 0.15)
    banquinho.add(leg)
  }
  const brace = torus(0.15, 0.015, WOOD_DARK, { roughness: 0.7 })
  brace.rotation.x = Math.PI / 2
  brace.position.y = 0.18
  banquinho.add(brace)
  // toalha jogada no banco
  const towel = rbox(0.22, 0.03, 0.4, 0.012, WHITE, { roughness: 0.95 })
  towel.position.set(-0.13, STOOL_H - 0.04, 0.05)
  towel.rotation.z = 0.5
  banquinho.add(towel)
  root.add(banquinho)

  // ---- telefone antigo vermelho --------------------------------------------
  const telefone = new THREE.Group()
  telefone.position.set(STOOL[0], PY + STOOL_H, STOOL[1])
  telefone.rotation.y = -0.45
  telefone.scale.setScalar(1.35)
  const phoneBase = lathe(
    [[0, 0], [0.2, 0], [0.21, 0.02], [0.17, 0.16], [0.12, 0.2], [0, 0.2]],
    PHONE,
    { roughness: 0.3 },
    4,
  )
  phoneBase.rotation.y = Math.PI / 4
  phoneBase.scale.set(1, 1, 0.85)
  telefone.add(phoneBase)
  // disco de discar na face inclinada
  const dial = new THREE.Group()
  dial.position.set(0, 0.11, 0.13)
  dial.rotation.x = -0.75
  const dialPlate = cylinder(0.085, 0.085, 0.015, WHITE, { roughness: 0.35 })
  dialPlate.rotation.x = Math.PI / 2
  dial.add(dialPlate)
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 1.6 + 0.6
    const hole = cylinder(0.013, 0.013, 0.02, '#3a2a2a', { roughness: 0.5 })
    hole.rotation.x = Math.PI / 2
    hole.position.set(Math.cos(a) * 0.058, Math.sin(a) * 0.058, 0.004)
    dial.add(hole)
  }
  const dialHub = cylinder(0.03, 0.03, 0.025, PHONE, { roughness: 0.3 })
  dialHub.rotation.x = Math.PI / 2
  dial.add(dialHub)
  telefone.add(dial)
  // garfos do gancho
  for (const sx of [-1, 1]) {
    const fork = rbox(0.04, 0.08, 0.05, 0.015, PHONE, { roughness: 0.3 })
    fork.position.set(sx * 0.13, 0.22, -0.03)
    telefone.add(fork)
  }
  // fio enrolado até o fone
  for (let k = 0; k < 5; k++) {
    const coil = torus(0.025, 0.008, '#2a2426', { roughness: 0.5 })
    coil.rotation.y = Math.PI / 2
    coil.position.set(-0.22 - k * 0.022, 0.06 + k * 0.035, -0.02)
    telefone.add(coil)
  }
  root.add(telefone)

  // fone saltando do gancho (filho do telefone)
  const fone = new THREE.Group()
  fone.position.set(0, FONE_Y, -0.03)
  fone.rotation.z = 0.28
  const grip = capsule(0.035, 0.32, PHONE, { roughness: 0.3 })
  grip.rotation.z = Math.PI / 2
  fone.add(grip)
  for (const sx of [-1, 1]) {
    const cup = cylinder(0.065, 0.05, 0.07, PHONE, { roughness: 0.3 })
    cup.position.set(sx * 0.2, -0.04, 0)
    fone.add(cup)
  }
  telefone.add(fone)

  // ondas do toque: arcos dos dois lados, de frente para a câmera
  const toque = new THREE.Group()
  toque.position.set(STOOL[0], PY + STOOL_H + 0.27, STOOL[1] + 0.05)
  const SPAN = 1.1
  for (const r of [0.42, 0.56, 0.7]) {
    for (const side of [0, 1]) {
      const a = arc(r, 0.022, SPAN, '#f7c948')
      a.rotation.z = side * Math.PI - SPAN / 2
      toque.add(a)
    }
  }
  root.add(toque)

  // ---- freira boxeadora ----------------------------------------------------
  const freira = person({ body: HABIT, skin: SKIN, height: 1.5, armAngle: 0.35 })
  freira.position.set(NUN_X, PY, NUN_Z)
  freira.rotation.y = -0.12
  freira.scale.setScalar(NUN_S)

  // saia do hábito, abrindo até o chão
  const skirt = lathe(
    [[0.34, 0], [0.32, 0.1], [0.28, 0.3], [0.255, 0.42], [0, 0.42]],
    HABIT,
    { roughness: 0.9 },
  )
  freira.add(skirt)
  // colar branco (peitilho) e crucifixo
  const collar = lathe(
    [[0.27, 0], [0.24, 0.05], [0.16, 0.1], [0, 0.1]],
    WHITE,
    { roughness: 0.8 },
  )
  collar.position.y = 0.72
  freira.add(collar)
  const crossV = rbox(0.04, 0.15, 0.025, 0.008, '#d6b25a', { roughness: 0.3, metalness: 0.7 })
  crossV.position.set(0, 0.55, 0.255)
  const crossH = rbox(0.1, 0.035, 0.025, 0.008, '#d6b25a', { roughness: 0.3, metalness: 0.7 })
  crossH.position.set(0, 0.58, 0.258)
  freira.add(crossV, crossH)
  // cinto de corda
  const cord = torus(0.262, 0.016, WHITE, { roughness: 0.9 })
  cord.rotation.x = Math.PI / 2
  cord.position.y = 0.36
  freira.add(cord)

  const head = freira.getObjectByName('head') as THREE.Group
  // boca aberta: berrando DEI SENA!
  const mouthCavity = sphere(0.05, '#4a1f1f', { roughness: 0.7 })
  mouthCavity.position.set(0, -0.11, 0.24)
  mouthCavity.scale.set(1.2, 0.8, 0.6)
  head.add(mouthCavity)
  for (const sx of [-1, 1]) {
    const brow = rbox(0.09, 0.022, 0.02, 0.01, '#3a2a22', { roughness: 0.7 })
    brow.position.set(sx * 0.11, 0.2, 0.25)
    brow.rotation.z = sx * 0.25
    head.add(brow)
  }

  // véu (filho da cabeça)
  const veu = new THREE.Group()
  const hood = sphere(0.315, HABIT, { roughness: 0.85 })
  hood.position.set(0, 0.03, -0.07)
  hood.scale.set(1, 1.02, 0.85)
  veu.add(hood)
  const drape = rbox(0.6, 0.55, 0.16, 0.08, HABIT, { roughness: 0.85 })
  drape.position.set(0, -0.25, -0.17)
  drape.rotation.x = 0.12
  veu.add(drape)
  // faixa branca na testa
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.29, 0.042, 12, 32, Math.PI * 1.05),
    mat(WHITE, { roughness: 0.75 }),
  )
  band.castShadow = true
  band.rotation.set(Math.PI / 2, 0, -Math.PI * 0.025)
  band.rotation.order = 'XYZ'
  band.position.set(0, 0.17, 0.0)
  veu.add(band)
  // touca branca emoldurando o rosto
  const coif = torus(0.255, 0.035, WHITE, { roughness: 0.75 })
  coif.position.set(0, -0.02, 0.12)
  coif.scale.set(1, 1.15, 1)
  veu.add(coif)
  head.add(veu)

  // braços: pivô no ombro + luvas vermelhas
  const bracoSoco = freira.getObjectByName('armL') as THREE.Mesh
  const bracoBilhete = freira.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoSoco, 1.5)
  shoulderPivot(bracoBilhete, 1.5)
  bracoSoco.rotation.set(0, 0, FIST)
  bracoBilhete.rotation.set(0, 0, RAISE)
  for (const arm of [bracoSoco, bracoBilhete]) {
    const handY = arm.children[0].position.y
    const glove = sphere(0.13, GLOVE, { roughness: 0.35 })
    glove.position.y = handY - 0.03
    glove.scale.set(1, 1.15, 1.05)
    arm.add(glove)
    const thumb = capsule(0.04, 0.07, GLOVE, { roughness: 0.35 })
    thumb.position.set(0, handY + 0.0, 0.11)
    thumb.rotation.x = 0.5
    arm.add(thumb)
    const cuff = cylinder(0.1, 0.11, 0.1, WHITE, { roughness: 0.6 })
    cuff.position.y = handY + 0.12
    arm.add(cuff)
  }

  root.add(freira)

  // ---- bilhete da Mega-SENA (filho do braço erguido) ------------------------
  const bilhete = new THREE.Group()
  {
    const handY = bracoBilhete.children[0].position.y
    bilhete.position.set(0, handY - 0.12, 0.06)
    bilhete.rotation.z = -RAISE
  }
  const ticket = rbox(0.56, 0.34, 0.02, 0.025, WHITE, { roughness: 0.5 })
  ticket.position.y = 0.17
  bilhete.add(ticket)
  const header = rbox(0.56, 0.06, 0.024, 0.02, SENA, { roughness: 0.45 })
  header.position.y = 0.31
  bilhete.add(header)
  // trevo da sorte: seis bolinhas marcadas no rodapé
  for (let k = 0; k < 6; k++) {
    const dot = cylinder(0.018, 0.018, 0.012, SENA, { roughness: 0.45 })
    dot.rotation.x = Math.PI / 2
    dot.position.set(-0.19 + k * 0.076, 0.045, 0.012)
    bilhete.add(dot)
  }
  const glyphs: ['S' | 'E' | 'N' | 'A', number][] = [
    ['S', -0.18], ['E', -0.06], ['N', 0.06], ['A', 0.18],
  ]
  for (const [g, lx] of glyphs) {
    const l = letter(g)
    l.position.set(lx, 0.17, 0.016)
    bilhete.add(l)
  }
  bracoBilhete.add(bilhete)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'ringue', object: base },
    { name: 'postes', group: 'ringue', object: postes },
    { name: 'cordas', group: 'ringue', object: cordas },
    { name: 'freira', group: 'freira', object: freira },
    { name: 'veu', group: 'freira', object: veu },
    { name: 'saco', group: 'golpe', object: saco },
    { name: 'bracoSoco', group: 'freira', object: bracoSoco },
    { name: 'banquinho', group: 'telefone', object: banquinho },
    { name: 'telefone', group: 'telefone', object: telefone },
    { name: 'fone', group: 'telefone', object: fone },
    { name: 'toque', group: 'telefone', object: toque },
    { name: 'bracoBilhete', group: 'freira', object: bracoBilhete },
    { name: 'bilhete', group: 'sena', object: bilhete },
  ]

  // ---- montagem ------------------------------------------------------------
  const pulse = (name: string, at: number) => [
    seq(`${name}-a`, 'toque', at, 0.25, [
      ch('scale.x', 0.6, 1.15), ch('scale.y', 0.6, 1.15), ch('scale.z', 0.6, 1.15),
    ], { ease: 'easeOut' }),
    seq(`${name}-b`, 'toque', at + 0.25, 0.25, [
      ch('scale.x', 1.15, 1), ch('scale.y', 1.15, 1), ch('scale.z', 1.15, 1),
    ]),
  ]
  const hop = (name: string, at: number) => [
    seq(`${name}-sobe`, 'fone', at, 0.18, [
      ch('position.y', 0.25, FONE_Y + 0.08), ch('rotation.z', -0.15, 0.32),
    ], { ease: 'easeOut' }),
    seq(`${name}-cai`, 'fone', at + 0.18, 0.18, [
      ch('position.y', FONE_Y + 0.08, 0.25), ch('rotation.z', 0.32, -0.15),
    ], { ease: 'easeIn' }),
  ]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Sobe o RINGUE de boxe: lona azul, postes e cordas…',
    }),
    seq('postes-rise', 'postes', 0.3, 0.7, [riseFrom(0, 1.6)], { ease: 'easeOut' }),
    seq('cordas-rise', 'cordas', 0.6, 0.7, [riseFrom(0, 1.4)], { ease: 'easeOut' }),

    seq('freira-rise', 'freira', 1.6, 0.8, [riseFrom(PY, 2.2)], {
      ease: 'easeOut',
      caption: 'No meio do ringue, uma freira boxeadora de luvas vermelhas…',
    }),
    seq('veu-poe', 'veu', 1.9, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('bilhete-esconde', 'bracoBilhete', 1.6, 0.1, [ch('rotation.z', 0.2, 0.2)]),
    seq('soco-guarda', 'bracoSoco', 1.6, 0.6, [ch('rotation.z', -0.3, -0.3)]),
    seq('saco-aparece', 'saco', 2.4, 0.6, [
      ch('position.x', BAG_START[0], BAG_START[0]), ch('position.y', BAG_START[1] + 1.2, BAG_START[1]),
      ch('rotation.z', 0, 0),
    ], { ease: 'easeOut' }),

    seq('soco-arma', 'bracoSoco', 3.3, 0.25, [ch('rotation.z', -0.3, 0.2)], {
      ease: 'easeOut',
      caption: '…solta o gancho de direita gritando IÁ!',
    }),
    seq('soco-gancho', 'bracoSoco', 3.55, 0.18, [ch('rotation.z', 0.2, PUNCH)], { ease: 'easeIn' }),
    seq('saco-voa', 'saco', 3.7, 0.45, [
      ch('position.x', BAG_START[0], BAG_END[0]), ch('position.y', BAG_START[1], BAG_END[1]),
      ch('rotation.z', 0, BAG_ROT),
    ], { ease: 'easeOut', caption: 'O saco de pancada voa contra as cordas!' }),
    seq('soco-volta', 'bracoSoco', 4.3, 0.5, [ch('rotation.z', PUNCH, FIST)], { ease: 'easeInOut' }),

    seq('banquinho-rise', 'banquinho', 5.2, 0.6, [riseFrom(PY, 1.2)], {
      ease: 'easeOut',
      caption: 'No córner, o telefone vermelho toca sem parar — o fone pula no gancho!',
    }),
    seq('telefone-rise', 'telefone', 5.4, 0.6, [riseFrom(PY + STOOL_H, 1.5)], { ease: 'easeOut' }),
    seq('toque-0', 'toque', 5.4, 0.6, [
      ch('scale.x', 0.01, 0.6), ch('scale.y', 0.01, 0.6), ch('scale.z', 0.01, 0.6),
    ]),
    seq('fone-aparece', 'fone', 5.4, 0.6, [ch('position.y', 0.25, 0.25), ch('rotation.z', -0.15, -0.15)]),
    ...pulse('toque-1', 6.0),
    ...hop('fone-1', 6.0),
    ...pulse('toque-2', 6.5),
    ...hop('fone-2', 6.5),
    ...pulse('toque-3', 7.0),
    ...hop('fone-3', 7.0),

    seq('braco-ergue', 'bracoBilhete', 7.6, 0.6, [ch('rotation.z', 0.2, RAISE)], {
      ease: 'easeOut',
      caption: 'Ela nem olha: tira da luva o bilhete da Mega-Sena e berra DEI SENA!',
    }),
    seq('bilhete-abre', 'bilhete', 8.1, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('freira-pula', 'freira', 8.7, 0.25, [ch('position.y', PY, PY + 0.15)], { ease: 'easeOut' }),
    seq('freira-cai', 'freira', 8.95, 0.25, [ch('position.y', PY + 0.15, PY)], { ease: 'easeIn' }),
    ...pulse('toque-4', 9.4),
    ...hop('fone-4', 9.4),
    seq('freira-vira', 'freira', 9.6, 0.5, [ch('rotation.y', 0.25, -0.12)], {
      ease: 'easeInOut',
      caption: 'E pro telefone que ainda toca: agora não — eu te ligo mais tarde!',
    }),
    ...pulse('toque-5', 10.4),
    seq('fone-final', 'fone', 10.4, 0.3, [
      ch('position.y', 0.25, FONE_Y), ch('rotation.z', -0.15, 0.28),
    ], {
      ease: 'easeOut',
      caption: 'Jag ringer dig senare. — Eu te ligo mais tarde.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 2.45, 4.7], target: [0.0, 1.5, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ringer-dig-senare',
    contexto:
      'Atendendo o telefone no ônibus, na fila, com as crianças gritando ao fundo; também por SMS: "Ringer dig senare!".',
    fraseFonte: 'Eu te ligo mais tarde.',
    fraseAlvo: 'Jag ringer dig senare.',
    pronuncia:
      "iá RÍNG-er dêi SÊ-na-re ('ringer' com R batido de 'arara', nunca rr, e NG só no nariz, sem estalar o g; 'dig' na fala é 'dej' = DÊI; 'senare' com Ê fechado e longo, -re fraquinho)",
    ponteSonora:
      "IÁ-RÍNGUER, DÊI SÊNA-re! (7 batidas, tônicas em RÍN e SÊ; IÁ é o 'jag' de sempre, I de ioga; emende IÁ + RINGUE num fôlego só, 'iaríngue', pro R sair BATIDO como em 'arara' — se disser 'iá... RRINGUE' com RR carioca sai um h e a palavra vira outra; do RINGUE fica só o NG no nariz, SEM estalar o G e sem o 'gui' final, e cola um -er com R BRANDO: RÍNG-er; DÊI = 'dei' do português, o mesmo molde de M'ÊI ('mig') — 'dig' na fala é 'dej'; SÊNA = a Mega-SENA, Ê FECHADO e longo, a força cai aqui; o -re do fim é fraquinho, R brando, quase engolido — nunca 'se-na-RÉ')",
    historia:
      'No meio do RINGUE, a freira boxeadora solta o gancho de direita gritando IÁ! — e o saco de pancada voa contra as cordas. No córner, o telefone vermelho toca sem parar, o fone pulando no gancho. Ela nem olha: puxa de dentro da luva o bilhete da Mega-Sena, confere os seis números e berra DEI SENA! Milionária de repente, ergue a luva pro telefone que ainda toca: agora não — eu te ligo mais tarde.',
  },
  createScene,
}

export default card
