import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Jag har två barn, fem och åtta år." — o pirata do bar do porto rosna
 * IÁ! RRÁR!, tira o chapéu e DOIS morceguinhos saem em T'VÔO (os filhos),
 * bate um FÊMUR com CINCO riscos no balcão do BÁR'N e grita FÉM, Ó!
 * apontando o OITO DE OURO cravado na madeira (ÓTA-ÔR).
 *
 * Os números são o conteúdo da carta: 2 morcegos, 5 riscos, 8 losangos —
 * todos espaçados e virados para a câmera para serem contáveis de relance.
 */

const PLANK = '#3f2b1b'
const PLANK_LINE = '#2a1b10'
const HONEY = '#b07a36'
const HONEY_LIGHT = '#c79350'
const WOOD_DARK = '#5b3f24'
const BONE = '#ece2cb'
const CUT = '#7a3b2a'
const CREAM = '#efe3cf'
const RED = '#b8453a'
const SKIN = '#e8c39e'
const BLACK = '#231f22'
const PURPLE = '#7b4fb3'
const PURPLE_DARK = '#563389'
const GOLD = '#f2b52b' // acento saturado, RESERVADO aos oito ouros da carta

const GY = 0.18 // topo da base do diorama
const TOP = 0.82 // tampo do balcão (baixo: o pirata aparece da cintura para cima)
const PIRATE_X = -0.2
const PIRATE_Z = -0.85
const PIRATE_Y = GY + 0.2 // pisa num estrado atrás do balcão
const FEMUR_Y = TOP + 0.1
const BAT1: [number, number, number] = [-0.95, 2.12, -0.65]
const BAT2: [number, number, number] = [0.2, 2.36, -0.5]

/** Traço de letra da placa: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, CREAM, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** B A R ' N — letras de traço grosso, legíveis a distância de diorama. */
function letter(which: 'B' | 'A' | 'R' | "'" | 'N') {
  const g = new THREE.Group()
  const t = 0.026
  if (which === 'B') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.072, t, -0.008, 0.067))
    g.add(stroke(0.072, t, -0.008, 0))
    g.add(stroke(0.072, t, -0.008, -0.067))
    g.add(stroke(t, 0.06, 0.03, 0.036))
    g.add(stroke(t, 0.06, 0.03, -0.036))
  } else if (which === 'A') {
    g.add(stroke(t, 0.17, -0.026, 0, -0.3))
    g.add(stroke(t, 0.17, 0.026, 0, 0.3))
    g.add(stroke(0.06, 0.022, 0, -0.024))
  } else if (which === 'R') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.07, t, -0.008, 0.067))
    g.add(stroke(0.07, t, -0.008, 0.006))
    g.add(stroke(t, 0.058, 0.03, 0.036))
    g.add(stroke(t, 0.09, 0.026, -0.045, 0.5))
  } else if (which === "'") {
    g.add(stroke(0.022, 0.05, 0, 0.056))
  } else {
    g.add(stroke(t, 0.16, -0.04, 0))
    g.add(stroke(t, 0.16, 0.04, 0))
    g.add(stroke(0.022, 0.19, 0, 0, 0.42))
  }
  return g
}

/** Morceguinho roxo: corpo-cápsula, olhos obrigatórios, asas abertas em leque. */
function makeBat(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)

  const body = capsule(0.075, 0.1, PURPLE, { roughness: 0.8 })
  g.add(body)

  const head = sphere(0.078, PURPLE, { roughness: 0.8 })
  head.position.y = 0.105
  g.add(head)

  for (const side of [-1, 1]) {
    const ear = cone(0.032, 0.085, PURPLE_DARK, { roughness: 0.8 })
    ear.position.set(side * 0.042, 0.17, -0.005)
    ear.rotation.z = side * 0.18
    g.add(ear)

    const eye = sphere(0.023, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.032, 0.118, 0.058)
    eye.scale.z = 0.6
    const pupil = sphere(0.011, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.032, 0.118, 0.072)
    g.add(eye, pupil)

    const fang = cone(0.011, 0.03, '#f4efe4', { roughness: 0.3 })
    fang.position.set(side * 0.02, 0.052, 0.056)
    fang.rotation.x = Math.PI
    g.add(fang)

    // asa: membrana + osso do braço + três dedos abrindo em leque
    const wing = new THREE.Group()
    wing.position.set(side * 0.06, 0.04, 0)
    wing.rotation.set(0, side * 0.12, side * (0.16 + rand() * 0.06))

    const membrane = rbox(0.32, 0.17, 0.012, 0.05, PURPLE_DARK, { roughness: 0.85 })
    membrane.position.x = side * 0.17
    wing.add(membrane)

    const armBone = capsule(0.016, 0.27, PURPLE, { roughness: 0.8 })
    armBone.rotation.z = Math.PI / 2
    armBone.position.set(side * 0.17, 0.075, 0.009)
    wing.add(armBone)

    for (let k = 0; k < 3; k++) {
      const finger = rbox(0.014, 0.15, 0.014, 0.006, PURPLE, { roughness: 0.8 })
      finger.position.set(side * (0.09 + k * 0.085), -0.015, 0.009)
      finger.rotation.z = side * (-0.28 + k * 0.26)
      wing.add(finger)
    }
    g.add(wing)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: assoalho de tábuas do bar do porto ------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, '#2f2419', { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const floor = cylinder(2.55, 2.62, 0.07, PLANK, { roughness: 0.85 })
  floor.position.y = 0.145
  base.add(floor)

  // frestas entre as tábuas: cordas do círculo, sem sair do disco
  for (const z of [-2.0, -1.4, -0.8, -0.2, 0.4, 1.0, 1.6, 2.2]) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - z * z, 0.01))
    const line = rbox(len, 0.02, 0.045, 0.008, PLANK_LINE, { roughness: 0.9 })
    line.position.set(0, GY + 0.002, z)
    base.add(line)
  }

  // adereços do porto (rng fixo)
  const barrel = new THREE.Group()
  barrel.position.set(-1.95, GY, 0.75)
  barrel.rotation.y = rand() * Math.PI
  const staves = lathe(
    [[0, 0], [0.22, 0.01], [0.26, 0.12], [0.27, 0.25], [0.25, 0.38], [0.21, 0.47], [0, 0.48]],
    WOOD_DARK,
    { roughness: 0.8 },
  )
  barrel.add(staves)
  for (const hy of [0.11, 0.37]) {
    const hoop = torus(0.262, 0.022, '#4a4038', { roughness: 0.4, metalness: 0.7 })
    hoop.rotation.x = Math.PI / 2
    hoop.position.y = hy
    barrel.add(hoop)
  }
  base.add(barrel)

  const rope = new THREE.Group()
  rope.position.set(1.75, GY + 0.035, 1.0)
  rope.rotation.y = rand() * Math.PI
  for (const [rr, ry] of [[0.24, 0], [0.18, 0.05]] as const) {
    const coil = torus(rr, 0.035, '#b09462', { roughness: 0.9 })
    coil.rotation.x = Math.PI / 2
    coil.position.y = ry
    rope.add(coil)
  }
  base.add(rope)

  const crate = rbox(0.42, 0.36, 0.4, 0.03, '#6b4b2c', { roughness: 0.85 })
  crate.position.set(1.9, GY + 0.18, -0.9)
  crate.rotation.y = -0.3 + rand() * 0.2
  base.add(crate)

  const mossRock = rock(0.15, '#575049', 31, { roughness: 0.95 })
  mossRock.position.set(-1.15, GY + 0.05, 1.65)
  mossRock.rotation.y = rand() * Math.PI
  base.add(mossRock)

  const grime = puff(0.16, '#3b4a35', 5, 33, { roughness: 0.95 })
  grime.position.set(2.05, GY + 0.06, 0.35)
  grime.scale.y = 0.45
  base.add(grime)

  root.add(base)

  // ---- balcão de madeira mel -----------------------------------------------
  const balcao = new THREE.Group()

  const counterTop = rbox(3.3, 0.14, 0.78, 0.04, HONEY_LIGHT, { roughness: 0.65 })
  counterTop.position.set(0, TOP - 0.07, -0.15)
  balcao.add(counterTop)

  const PANEL_H = TOP - 0.12 - GY
  const front = rbox(3.15, PANEL_H, 0.14, 0.03, HONEY, { roughness: 0.75 })
  front.position.set(0, GY + PANEL_H / 2, 0.16)
  balcao.add(front)
  // tábuas verticais do frontal: frestas escuras
  for (let i = -6; i <= 6; i++) {
    if (Math.abs(i * 0.23 - 0.1) < 0.6) continue // atrás da placa não aparece
    const groove = rbox(0.018, PANEL_H - 0.06, 0.02, 0.006, '#7e5424', { roughness: 0.85 })
    groove.position.set(i * 0.23, GY + PANEL_H / 2, 0.235)
    balcao.add(groove)
  }
  // rodapé e friso sob o tampo
  const kick = rbox(3.2, 0.08, 0.2, 0.025, WOOD_DARK, { roughness: 0.8 })
  kick.position.set(0, GY + 0.04, 0.17)
  balcao.add(kick)
  const lip = rbox(3.2, 0.05, 0.18, 0.02, WOOD_DARK, { roughness: 0.8 })
  lip.position.set(0, TOP - 0.16, 0.17)
  balcao.add(lip)
  // trilho de latão para o pé
  const rail = cylinder(0.025, 0.025, 3.0, '#c9a250', { roughness: 0.3, metalness: 0.8 })
  rail.rotation.z = Math.PI / 2
  rail.position.set(0, GY + 0.16, 0.36)
  balcao.add(rail)
  for (const rx of [-1.35, 1.35]) {
    const post = cylinder(0.018, 0.018, 0.16, '#c9a250', { roughness: 0.3, metalness: 0.8 })
    post.rotation.x = Math.PI / 2
    post.position.set(rx, GY + 0.16, 0.29)
    balcao.add(post)
  }

  const backPanel = rbox(3.15, PANEL_H, 0.12, 0.03, HONEY, { roughness: 0.8 })
  backPanel.position.set(0, GY + PANEL_H / 2, -0.48)
  balcao.add(backPanel)

  for (const side of [-1, 1]) {
    const cap = rbox(0.16, PANEL_H + 0.02, 0.72, 0.03, WOOD_DARK, { roughness: 0.8 })
    cap.position.set(side * 1.6, GY + (PANEL_H + 0.02) / 2, -0.16)
    balcao.add(cap)
  }

  // estrado atrás do balcão onde o pirata pisa
  const step = rbox(1.0, PIRATE_Y - GY, 0.7, 0.02, WOOD_DARK, { roughness: 0.85 })
  step.position.set(PIRATE_X, GY + (PIRATE_Y - GY) / 2, PIRATE_Z)
  balcao.add(step)

  // fenda na madeira onde a carta fica cravada
  const slot = rbox(0.4, 0.03, 0.07, 0.01, '#4a3320', { roughness: 0.9 })
  slot.position.set(0.85, TOP - 0.005, -0.12)
  slot.rotation.y = 0.16
  balcao.add(slot)

  const bottle = lathe(
    [[0, 0], [0.075, 0], [0.08, 0.05], [0.077, 0.19], [0.032, 0.25], [0.03, 0.34], [0.036, 0.36], [0, 0.36]],
    '#2f5c3a',
    { roughness: 0.15 },
  )
  bottle.position.set(1.32, TOP, -0.32)
  balcao.add(bottle)

  const mug = lathe(
    [[0, 0], [0.09, 0], [0.095, 0.02], [0.086, 0.17], [0.093, 0.19], [0.076, 0.19], [0.076, 0.02], [0, 0.02]],
    '#8e959b',
    { roughness: 0.3, metalness: 0.6 },
  )
  mug.position.set(-1.38, TOP, -0.12)
  const handle = torus(0.055, 0.015, '#8e959b', { roughness: 0.3, metalness: 0.6 })
  handle.position.set(0.1, 0.1, 0)
  handle.rotation.y = Math.PI / 2
  mug.add(handle)
  balcao.add(mug)

  root.add(balcao)

  // ---- placa BAR'N pendurada na frente do balcão ---------------------------
  const placa = new THREE.Group()
  placa.position.set(0.1, 0.47, 0.3)

  const plank = rbox(1.06, 0.34, 0.06, 0.03, WOOD_DARK, { roughness: 0.8 })
  placa.add(plank)

  const letters: ['B' | 'A' | 'R' | "'" | 'N', number][] = [
    ['B', -0.36], ['A', -0.2], ['R', -0.04], ["'", 0.075], ['N', 0.2],
  ]
  for (const [glyph, lx] of letters) {
    const l = letter(glyph)
    l.position.set(lx, 0, 0.033)
    placa.add(l)
  }

  for (const side of [-1, 1]) {
    const cord = cylinder(0.014, 0.014, 0.18, '#7d6640', { roughness: 0.9 })
    cord.position.set(side * 0.42, 0.24, -0.01)
    placa.add(cord)
  }
  root.add(placa)

  // ---- pirata (olha para a frente, +z: câmera e balcão) ---------------------
  const pirata = person({ body: RED, skin: SKIN, height: 1.55, armAngle: 0.45 })
  pirata.position.set(PIRATE_X, PIRATE_Y, PIRATE_Z)
  pirata.rotation.y = 0.16
  pirata.scale.setScalar(1.12)

  // camisa listrada: três faixas cremes no tronco
  for (const sy of [0.3, 0.4, 0.5]) {
    const stripe = torus(0.268, 0.026, CREAM, { roughness: 0.9 })
    stripe.rotation.x = Math.PI / 2
    stripe.position.y = sy
    pirata.add(stripe)
  }
  const belt = torus(0.266, 0.038, '#4a3324', { roughness: 0.85 })
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.245
  pirata.add(belt)
  const buckle = rbox(0.1, 0.09, 0.03, 0.015, '#8e959b', { roughness: 0.3, metalness: 0.7 })
  buckle.position.set(0, 0.245, 0.27)
  pirata.add(buckle)

  const head = pirata.getObjectByName('head') as THREE.Group

  // boca escancarada num Ó
  const mouthCavity = sphere(0.062, '#3a1f1c', { roughness: 0.7 })
  mouthCavity.position.set(0, -0.115, 0.235)
  head.add(mouthCavity)
  const mouth = torus(0.075, 0.028, '#2a1a18', { roughness: 0.6 })
  mouth.position.set(0, -0.115, 0.252)
  head.add(mouth)

  const beard = puff(0.1, '#6b4a2e', 5, 41, { roughness: 0.92 })
  beard.position.set(0, -0.235, 0.115)
  beard.scale.set(1.35, 0.75, 0.85)
  head.add(beard)

  const patch = rbox(0.115, 0.1, 0.02, 0.03, BLACK, { roughness: 0.6 })
  patch.position.set(-0.112, 0.045, 0.262)
  patch.rotation.y = -0.35
  head.add(patch)
  const strap = torus(0.3, 0.012, BLACK, { roughness: 0.6 })
  strap.rotation.x = Math.PI / 2
  strap.rotation.z = 0.16
  strap.position.y = 0.06
  head.add(strap)

  // braço direito é peça própria: cai ao lado e depois aponta para a carta
  const bracoR = pirata.getObjectByName('armR') as THREE.Object3D
  bracoR.rotation.z = 1.9 // pose final: apontando para a direita (a carta)

  root.add(pirata)

  // ---- chapéu de pirata (filho da cabeça: sai e volta) ---------------------
  const chapeu = new THREE.Group()
  chapeu.position.set(0, 0.2, 0)

  const brim = lathe(
    [[0.2, 0.06], [0.3, 0.015], [0.4, 0.055], [0.43, 0.13], [0.33, 0.11], [0.22, 0.13]],
    BLACK,
    { roughness: 0.9 },
  )
  chapeu.add(brim)

  const crown = lathe(
    [[0, 0.3], [0.19, 0.285], [0.24, 0.19], [0.25, 0.09], [0.22, 0.03], [0, 0.02]],
    '#2c2629',
    { roughness: 0.9 },
  )
  chapeu.add(crown)

  // ossos cruzados na frente da copa
  for (const s of [-1, 1]) {
    const boneMark = rbox(0.15, 0.022, 0.02, 0.008, CREAM, { roughness: 0.6 })
    boneMark.position.set(0, 0.15, 0.235)
    boneMark.rotation.z = s * 0.8
    chapeu.add(boneMark)
  }
  head.add(chapeu)

  // ---- DOIS morceguinhos ----------------------------------------------------
  const morcego1 = makeBat(5)
  morcego1.position.set(...BAT1)
  morcego1.rotation.y = 0.35
  root.add(morcego1)

  const morcego2 = makeBat(8)
  morcego2.position.set(...BAT2)
  morcego2.rotation.y = -0.4
  root.add(morcego2)

  // ---- FÊMUR com CINCO riscos ----------------------------------------------
  const femur = new THREE.Group()
  femur.position.set(-0.78, FEMUR_Y, 0.02)
  femur.rotation.y = 0.14
  femur.scale.setScalar(1.35)

  const shaft = capsule(0.05, 0.42, BONE, { roughness: 0.6 })
  shaft.rotation.z = Math.PI / 2
  femur.add(shaft)
  for (const sx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      const knob = sphere(0.072, BONE, { roughness: 0.6 })
      knob.position.set(sx * 0.27, 0, lz * 0.062)
      femur.add(knob)
    }
  }
  // os cinco riscos: no topo do osso, virados para a câmera, bem separados
  for (let i = 0; i < 5; i++) {
    const cutMark = rbox(0.03, 0.032, 0.13, 0.009, CUT, { roughness: 0.8 })
    cutMark.position.set(-0.17 + i * 0.085, 0.04, 0)
    cutMark.rotation.x = 0.12
    femur.add(cutMark)
  }
  root.add(femur)

  // ---- carta OITO DE OURO cravada na madeira -------------------------------
  const carta = new THREE.Group()
  carta.position.set(0.85, TOP + 0.26, -0.12)
  carta.rotation.set(-0.28, 0.16, 0.16)

  const face = rbox(0.44, 0.64, 0.022, 0.045, '#f4eee2', { roughness: 0.35 })
  carta.add(face)
  const border = rbox(0.4, 0.6, 0.012, 0.04, '#e3d8c2', { roughness: 0.4 })
  border.position.z = 0.008
  carta.add(border)

  // os oito ouros: duas colunas de quatro, o layout clássico do 8
  for (const dx of [-0.105, 0.105]) {
    for (const dy of [-0.225, -0.075, 0.075, 0.225]) {
      const losango = rbox(0.088, 0.088, 0.014, 0.012, GOLD, { roughness: 0.3, metalness: 0.55 })
      losango.position.set(dx, dy, 0.016)
      losango.rotation.z = Math.PI / 4
      carta.add(losango)
    }
  }
  root.add(carta)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'porto', object: base },
    { name: 'balcao', group: 'porto', object: balcao },
    { name: 'pirata', group: 'pirata', object: pirata },
    { name: 'bracoR', group: 'pirata', object: bracoR },
    { name: 'chapeu', group: 'pirata', object: chapeu },
    { name: 'morcego1', group: 'morcegos', object: morcego1 },
    { name: 'morcego2', group: 'morcegos', object: morcego2 },
    { name: 'femur', group: 'osso', object: femur },
    { name: 'placa', group: 'osso', object: placa },
    { name: 'carta', group: 'carta', object: carta },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No bar mais fedido do porto, brota o assoalho de tábuas…',
    }),
    seq('balcao-rise', 'balcao', 0.2, 0.9, [riseFrom(0, 1.6)], { ease: 'easeOut' }),

    seq('pirata-rise', 'pirata', 1.9, 0.8, [riseFrom(PIRATE_Y, 1.9)], {
      ease: 'easeOut',
      caption: 'Você pergunta quantos filhos ele tem e o pirata rosna: IÁ! RRÁR!',
    }),
    seq('braco-cai', 'bracoR', 2.05, 0.7, [ch('rotation.z', -1.5, -0.42)], { ease: 'easeOut' }),
    seq(
      'chapeu-poe',
      'chapeu',
      2.15,
      0.7,
      [
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
        ch('position.y', 0.42, 0.2),
      ],
      { ease: 'easeOut' },
    ),

    seq(
      'chapeu-tira',
      'chapeu',
      3.6,
      0.7,
      [ch('position.y', 0.2, 0.62), ch('position.x', 0, -0.3), ch('rotation.z', 0, -0.55)],
      {
        ease: 'easeOut',
        caption: 'Ele tira o chapéu e DOIS morceguinhos saem em T\'VÔO — são os filhos.',
      },
    ),
    seq(
      'morcego1-voa',
      'morcego1',
      3.8,
      0.9,
      [
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
        ch('position.x', PIRATE_X, BAT1[0]), ch('position.y', 1.45, BAT1[1]),
      ],
      { ease: 'easeOut' },
    ),
    seq(
      'morcego2-voa',
      'morcego2',
      4.0,
      0.9,
      [
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
        ch('position.x', PIRATE_X, BAT2[0]), ch('position.y', 1.45, BAT2[1]),
      ],
      { ease: 'easeOut' },
    ),
    seq('morcego1-bate-a', 'morcego1', 4.9, 0.5, [ch('rotation.z', 0, 0.22)]),
    seq('morcego2-bate-a', 'morcego2', 5.05, 0.5, [ch('rotation.z', 0, -0.2)]),
    seq('chapeu-volta', 'chapeu', 5.15, 0.6, [
      ch('position.y', 0.62, 0.2), ch('position.x', -0.3, 0), ch('rotation.z', -0.55, 0),
    ]),

    seq('femur-rise', 'femur', 5.8, 0.8, [riseFrom(FEMUR_Y, 1.6)], {
      ease: 'easeOut',
      caption: 'Do balcão do BÁR\'N ele saca um FÊMUR com CINCO riscos — FÉM!',
    }),
    seq('placa-rise', 'placa', 6.0, 0.8, [riseFrom(0.47, 1.05)], { ease: 'easeOut' }),
    seq('placa-balanca', 'placa', 6.85, 0.5, [ch('rotation.z', 0, -0.08)]),
    seq('placa-assenta', 'placa', 7.35, 0.6, [ch('rotation.z', -0.08, 0)]),

    seq(
      'carta-crava',
      'carta',
      7.6,
      0.9,
      [ch('position.y', TOP + 0.26 - 1.9, TOP + 0.26), ch('rotation.z', 0.62, 0.16)],
      {
        ease: 'easeOut',
        caption: 'Ó! Ele aponta a carta cravada na madeira: o OITO DE OURO — ÓTA-ÔR!',
      },
    ),

    seq('femur-arma', 'femur', 8.7, 0.5, [
      ch('position.y', FEMUR_Y, FEMUR_Y + 0.35), ch('rotation.z', 0, 0.4),
    ], { ease: 'easeOut' }),
    seq('pirata-impulso', 'pirata', 8.8, 0.4, [ch('position.y', PIRATE_Y, PIRATE_Y + 0.09)], { ease: 'easeOut' }),
    seq('femur-bate', 'femur', 9.2, 0.4, [
      ch('position.y', FEMUR_Y + 0.35, FEMUR_Y), ch('rotation.z', 0.4, 0),
    ], { ease: 'easeIn' }),
    seq('pirata-assenta', 'pirata', 9.25, 0.4, [ch('position.y', PIRATE_Y + 0.09, PIRATE_Y)], { ease: 'easeIn' }),
    seq('braco-aponta', 'bracoR', 9.4, 0.6, [ch('rotation.z', -0.42, 1.9)], { ease: 'easeOut' }),

    seq('morcego1-bate-b', 'morcego1', 10.1, 0.6, [ch('rotation.z', 0.22, 0)], {
      caption: 'Jag har två barn, fem och åtta år. — Tenho dois filhos, de cinco e oito anos.',
    }),
    seq('morcego2-bate-b', 'morcego2', 10.2, 0.6, [ch('rotation.z', -0.2, 0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.55, 5.05], target: [0.0, 1.1, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-tva-barn',
    contexto: 'Small talk com colegas, vizinhos, outros pais no parquinho.',
    fraseFonte: 'Tenho dois filhos, de cinco e oito anos.',
    fraseAlvo: 'Jag har två barn, fem och åtta år.',
    pronuncia:
      "iá har tvô BÁRN, fem ó Ó-ta ÔR ('och' na fala vira só 'ó'; 'år' = ôr)",
    ponteSonora:
      "IÁ! RRÁR! T'VÔO BÁR'N... FÉM, Ó! ÓTA-ÔR! (9 batidas; RRÁR é o 'arrr!' de pirata com o sopro NA FRENTE — o RR inicial é o h de 'har', o A é longo e o R final é BRANDO, nunca raspado; T'VÔO é a palavra VÔO com T colado, UMA sílaba só, Ô FECHADO; BÁR'N com R puxado à caipira e N obrigatório — 'bar' sozinho é outra palavra; FÉM com É bem aberto e M de lábios fechados, sem nasalar; ÓTA com å CURTO e ABERTO; ÔR com ô FECHADO e longo, R brando)",
    historia:
      "No bar mais fedido do porto você pergunta ao pirata quantos filhos ele tem. Ele rosna IÁ! RRÁR!, tira o chapéu e dois morceguinhos saem em T'VÔO lá de dentro — são os filhos. Ele bate um FÊMUR com cinco riscos no balcão do BAR'N e grita Ó! apontando pra carta cravada na madeira: o OITO DE OURO. Cinco riscos no osso, oito ouros na carta: as idades da molecada.",
  },
  createScene,
  refine: { organic: ['morcego1', 'morcego2'] },
}

export default card
