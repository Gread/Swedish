import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, shoulderPivot,
  rbox, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Det var en bra film." — na sessão de gala, a equilibrista pula da tela,
 * pede "DÊ! VARA EM BRASA!" e atravessa a sala na ponta dos pés por cima da
 * fita do FILME, esticada como corda bamba entre dois projetores, chovendo
 * faíscas nas poltronas vermelhas.
 *
 * Diorama: carpete vinho; duas fileiras de poltronas viradas para a câmera
 * (a fileira de trás num degrau); projetores pretos de bobina dupla em
 * postes nas laterais; a fita preta de furinhos brancos inclinada para a
 * câmera; a equilibrista de collant turquesa no meio, com a vara atravessada.
 * Acento saturado RESERVADO: as pontas em brasa e as faíscas.
 */

const FLOOR_RIM = '#3a1f1a'
const CARPET = '#5a1e2b'
const CARPET_LIGHT = '#6b2834'
const BRASS = '#b8934a'
const SEAT = '#9e2a33'
const SEAT_DARK = '#7d1f28'
const FRAME = '#2d1c20'
const FRAME_TOP = '#3d2629'
const PROJ = '#24252b'
const REEL = '#33353c'
const CHROME = '#a9adb3'
const FILM = '#141417'
const PERF = '#f2efe6'
const FRAME_CELL = '#4a4036'
const TURQ = '#1fb0ad'
const TURQ_LIGHT = '#7fdcd4'
const SKIN = '#f0c9a4'
const HAIR = '#1b1615'
const GOLD = '#d8ad45'
const WOOD = '#7a4a27'
const CHAR = '#2b1d16'
const EMBER = '#ff4a12'     // acento saturado: a brasa
const FLAME = '#ff9a1f'
const SPARK = '#ffd23a'

const GY = 0.17            // topo do carpete
const FY = 1.3             // altura da fita (corda bamba)
const FZ = -0.35           // profundidade da fita
const PX = 2.12            // x dos projetores
const EQ_S = 1.15          // escala da equilibrista
const HR = 1.5 * 0.19      // raio da cabeça de person(1.5)
const POLE_Y = 0.6         // vara, no espaço local da equilibrista
const POLE_Z = 0.3
const POLE_HALF = 1.3
const ARM_X = -1.0         // braços abertos, mãos à frente do corpo
const ARM_Z = 0.95

function makeProjector(side: number) {
  const g = new THREE.Group()
  g.position.set(side * PX, 0, FZ)

  const foot = lathe(
    [[0, 0], [0.3, 0], [0.31, 0.03], [0.2, 0.06], [0.08, 0.1], [0, 0.1]],
    PROJ,
    { roughness: 0.35, metalness: 0.7 },
  )
  foot.position.y = GY
  g.add(foot)

  const postH = FY - 0.22 - GY
  const post = cylinder(0.045, 0.055, postH, PROJ, { roughness: 0.3, metalness: 0.75 })
  post.position.y = GY + postH / 2
  g.add(post)
  const collar = cylinder(0.09, 0.08, 0.06, CHROME, { roughness: 0.25, metalness: 0.85 })
  collar.position.y = FY - 0.22
  g.add(collar)

  const bodyY = FY - 0.02
  const body = rbox(0.56, 0.36, 0.32, 0.05, PROJ, { roughness: 0.4, metalness: 0.5 })
  body.position.y = bodyY
  g.add(body)
  // grade de ventilação no lado da câmera
  for (let i = 0; i < 4; i++) {
    const vent = rbox(0.028, 0.2, 0.012, 0.006, '#43454d', { roughness: 0.5, metalness: 0.4 })
    vent.position.set(-side * 0.04 + (i - 1.5) * 0.06, bodyY, 0.165)
    g.add(vent)
  }
  // objetiva para fora da sala
  const lens = cylinder(0.09, 0.072, 0.22, '#3a3c43', { roughness: 0.3, metalness: 0.7 })
  lens.rotation.z = -side * Math.PI / 2
  lens.position.set(side * 0.39, bodyY + 0.02, 0)
  g.add(lens)
  const ring = torus(0.088, 0.016, CHROME, { roughness: 0.2, metalness: 0.9 })
  ring.rotation.y = Math.PI / 2
  ring.position.set(side * 0.5, bodyY + 0.02, 0)
  g.add(ring)
  const glass = cylinder(0.072, 0.072, 0.012, '#2a3a52', { roughness: 0.08, metalness: 0.3 })
  glass.rotation.z = Math.PI / 2
  glass.position.set(side * 0.502, bodyY + 0.02, 0)
  g.add(glass)

  // as duas bobinas, as "orelhas" do projetor
  for (const rx of [-0.22, 0.22]) {
    const reel = new THREE.Group()
    reel.position.set(rx, bodyY + 0.42, -0.02)

    const roll = cylinder(0.13, 0.13, 0.05, FILM, { roughness: 0.25 }, 40)
    roll.rotation.x = Math.PI / 2
    reel.add(roll)
    for (const fz of [-0.03, 0.03]) {
      const flange = cylinder(0.19, 0.19, 0.012, REEL, { roughness: 0.35, metalness: 0.6 }, 40)
      flange.rotation.x = Math.PI / 2
      flange.position.z = fz
      reel.add(flange)
      const rim = torus(0.188, 0.012, CHROME, { roughness: 0.25, metalness: 0.85 })
      rim.position.z = fz
      reel.add(rim)
    }
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + rx * 3
      const hole = cylinder(0.045, 0.045, 0.006, '#0d0d10', { roughness: 0.6 }, 24)
      hole.rotation.x = Math.PI / 2
      hole.position.set(Math.cos(a) * 0.105, Math.sin(a) * 0.105, 0.037)
      reel.add(hole)
    }
    const hub = cylinder(0.035, 0.035, 0.09, CHROME, { roughness: 0.2, metalness: 0.9 })
    hub.rotation.x = Math.PI / 2
    reel.add(hub)
    g.add(reel)

    const arm = rbox(0.045, 0.26, 0.04, 0.015, PROJ, { roughness: 0.4, metalness: 0.5 })
    arm.position.set(rx, bodyY + 0.27, -0.07)
    g.add(arm)
  }
  return g
}

function makeSeat() {
  const g = new THREE.Group()
  const back = rbox(0.4, 0.5, 0.11, 0.05, SEAT, { roughness: 0.9 })
  back.position.set(0, 0.56, -0.15)
  back.rotation.x = -0.1
  g.add(back)
  const tuft = rbox(0.3, 0.36, 0.03, 0.012, SEAT_DARK, { roughness: 0.95 })
  tuft.position.set(0, 0.57, -0.095)
  tuft.rotation.x = -0.1
  g.add(tuft)
  const cushion = rbox(0.4, 0.11, 0.36, 0.045, SEAT, { roughness: 0.9 })
  cushion.position.set(0, 0.27, 0.04)
  g.add(cushion)
  const pedestal = rbox(0.09, 0.22, 0.09, 0.02, FRAME, { roughness: 0.6 })
  pedestal.position.set(0, 0.11, -0.04)
  g.add(pedestal)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: carpete vinho da sala de cinema ---------------------------------
  const base = new THREE.Group()
  const floor = cylinder(2.62, 2.7, 0.1, FLOOR_RIM, { roughness: 0.7 })
  floor.position.y = 0.05
  base.add(floor)
  const carpet = cylinder(2.52, 2.56, 0.07, CARPET, { roughness: 0.95 })
  carpet.position.y = 0.135
  base.add(carpet)
  const trim = torus(2.42, 0.022, BRASS, { roughness: 0.35, metalness: 0.7 })
  trim.rotation.x = Math.PI / 2
  trim.position.y = GY + 0.004
  base.add(trim)

  // balde de pipoca listrado e copo de refri no chão
  const bucket = new THREE.Group()
  bucket.position.set(-2.0, GY, 1.2)
  bucket.rotation.y = rand() * Math.PI
  const pail = lathe(
    [[0, 0], [0.12, 0], [0.165, 0.32], [0.155, 0.32], [0.11, 0.015], [0, 0.015]],
    '#f4efe4',
    { roughness: 0.6 },
  )
  bucket.add(pail)
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2
    const stripe = rbox(0.06, 0.33, 0.01, 0.004, SEAT, { roughness: 0.6 })
    stripe.position.set(Math.sin(a) * 0.145, 0.16, Math.cos(a) * 0.145)
    stripe.rotation.set(-0.13 * Math.cos(0), a, 0)
    stripe.rotateX(-0.135)
    bucket.add(stripe)
  }
  const popcorn = puff(0.13, '#f6e3a8', 7, 7, { roughness: 0.9 })
  popcorn.position.y = 0.34
  popcorn.scale.y = 0.7
  bucket.add(popcorn)
  base.add(bucket)

  const cup = new THREE.Group()
  cup.position.set(2.0, GY, 1.2)
  const cupBody = lathe(
    [[0, 0], [0.08, 0], [0.105, 0.3], [0.098, 0.3], [0.075, 0.012], [0, 0.012]],
    '#2f5e9e',
    { roughness: 0.5 },
  )
  cup.add(cupBody)
  const lid = cylinder(0.11, 0.11, 0.025, '#f4efe4', { roughness: 0.4 })
  lid.position.y = 0.31
  cup.add(lid)
  const straw = cylinder(0.012, 0.012, 0.22, '#f4efe4', { roughness: 0.4 })
  straw.position.set(0.02, 0.4, 0)
  straw.rotation.z = -0.2
  cup.add(straw)
  base.add(cup)
  root.add(base)

  // ---- poltronas: duas fileiras viradas para a câmera ----------------------
  const poltronas = new THREE.Group()
  const riser = rbox(3.75, 0.14, 0.78, 0.03, CARPET_LIGHT, { roughness: 0.95 })
  riser.position.set(0, GY + 0.07, 0.42)
  poltronas.add(riser)
  const stepLight = rbox(3.7, 0.022, 0.02, 0.008, BRASS, { roughness: 0.35, metalness: 0.7 })
  stepLight.position.set(0, GY + 0.11, 0.815)
  poltronas.add(stepLight)

  for (const [rowZ, rowY] of [[1.18, GY], [0.42, GY + 0.14]] as const) {
    for (let i = -3; i <= 3; i++) {
      const s = makeSeat()
      s.position.set(i * 0.48, rowY, rowZ)
      poltronas.add(s)
    }
    for (let i = 0; i < 8; i++) {
      const ax = -1.68 + i * 0.48
      const support = rbox(0.05, 0.42, 0.07, 0.02, FRAME, { roughness: 0.6 })
      support.position.set(ax, rowY + 0.21, rowZ - 0.06)
      poltronas.add(support)
      const pad = rbox(0.075, 0.045, 0.4, 0.02, FRAME_TOP, { roughness: 0.6 })
      pad.position.set(ax, rowY + 0.43, rowZ)
      poltronas.add(pad)
    }
  }
  root.add(poltronas)

  // ---- projetores -----------------------------------------------------------
  const projetorE = makeProjector(-1)
  const projetorD = makeProjector(1)
  root.add(projetorE, projetorD)

  // ---- fita do filme: corda bamba de furinhos brancos ----------------------
  const FX0 = -PX + 0.28
  const FL = 2 * (PX - 0.28)
  const fita = new THREE.Group()
  fita.position.set(FX0, FY, FZ)
  fita.rotation.x = 0.45 // inclinada para a câmera: os furinhos aparecem
  const strip = rbox(FL, 0.012, 0.27, 0.004, FILM, { roughness: 0.25 })
  strip.position.x = FL / 2
  fita.add(strip)
  for (let x = 0.05; x < FL - 0.03; x += 0.085) {
    for (const pz of [-0.104, 0.104]) {
      const perf = rbox(0.04, 0.016, 0.034, 0.007, PERF, { roughness: 0.5 })
      perf.position.set(x, 0, pz)
      fita.add(perf)
    }
  }
  for (let x = 0.18; x < FL - 0.12; x += 0.31) {
    const cell = rbox(0.24, 0.014, 0.14, 0.01, FRAME_CELL, { roughness: 0.4 })
    cell.position.set(x, 0, 0)
    fita.add(cell)
  }
  root.add(fita)

  // ---- equilibrista ---------------------------------------------------------
  const equilibrista = person({ body: TURQ, skin: SKIN, height: 1.5, armAngle: 0.3 })
  equilibrista.position.set(0, FY + 0.006, FZ)
  equilibrista.scale.setScalar(EQ_S)

  // saiote de bailarina na cintura
  const tutu = lathe(
    [[0.2, 0.05], [0.28, 0.03], [0.38, -0.02], [0.39, -0.045], [0.3, -0.03], [0.2, -0.02]],
    TURQ_LIGHT,
    { roughness: 0.8 },
  )
  tutu.position.y = 0.28
  equilibrista.add(tutu)
  // brilhinhos no collant
  for (const [bx, by] of [[-0.08, 0.5], [0.1, 0.44], [0.0, 0.62], [-0.12, 0.38], [0.13, 0.58]] as const) {
    const gem = sphere(0.016, '#e8fbf8', { roughness: 0.2 })
    gem.position.set(bx, by, 0.25)
    equilibrista.add(gem)
  }
  // sapatilhas brancas, na ponta dos pés
  for (const sx of [-1, 1]) {
    const shoe = sphere(0.07, '#fbf8f2', { roughness: 0.5 })
    shoe.position.set(sx * 0.09, 0.035, 0.05)
    shoe.scale.set(0.85, 0.6, 1.25)
    equilibrista.add(shoe)
    const ribbon = torus(0.06, 0.01, '#f3d9de', { roughness: 0.6 })
    ribbon.rotation.x = Math.PI / 2
    ribbon.position.set(sx * 0.09, 0.07, 0.04)
    equilibrista.add(ribbon)
  }

  const cabeca = equilibrista.getObjectByName('head') as THREE.Group
  const cap = sphere(HR * 1.04, HAIR, { roughness: 0.75 })
  cap.position.set(0, HR * 0.18, -HR * 0.16)
  cap.scale.set(1, 0.85, 0.95)
  cabeca.add(cap)
  const coque = sphere(HR * 0.42, HAIR, { roughness: 0.75 })
  coque.position.set(0, HR * 0.86, -HR * 0.4)
  cabeca.add(coque)
  // diadema dourado: arco de contas com uma ponta no meio
  for (let i = 0; i < 7; i++) {
    const a = -0.9 + i * 0.3
    const bead = sphere(i === 3 ? 0.03 : 0.02, GOLD, { roughness: 0.25, metalness: 0.8 })
    bead.position.set(Math.sin(a) * HR * 0.9, HR * 0.78 - Math.abs(a) * 0.04, Math.cos(a) * HR * 0.5)
    cabeca.add(bead)
  }
  const spike = cone(0.03, 0.08, GOLD, { roughness: 0.25, metalness: 0.8 })
  spike.position.set(0, HR * 0.78 + 0.06, HR * 0.5)
  cabeca.add(spike)
  // sorriso e bochechas
  const boca = sphere(HR * 0.2, '#6a2424', { roughness: 0.6 })
  boca.position.set(0, -HR * 0.42, HR * 0.8)
  boca.scale.set(1.4, 0.55, 0.5)
  cabeca.add(boca)
  for (const side of [-1, 1]) {
    const cheek = sphere(HR * 0.15, '#f2a39b', { roughness: 0.7 })
    cheek.position.set(side * HR * 0.52, -HR * 0.2, HR * 0.78)
    cheek.scale.z = 0.4
    cabeca.add(cheek)
  }

  const bracoE = equilibrista.getObjectByName('armL') as THREE.Object3D
  const bracoD = equilibrista.getObjectByName('armR') as THREE.Object3D
  shoulderPivot(bracoE, 1.5)
  shoulderPivot(bracoD, 1.5)
  bracoE.rotation.set(ARM_X, 0, -ARM_Z)
  bracoD.rotation.set(ARM_X, 0, ARM_Z)

  // ---- vara de equilíbrio (filha da equilibrista) ---------------------------
  const vara = new THREE.Group()
  vara.position.set(0, POLE_Y, POLE_Z)
  const pole = cylinder(0.028, 0.028, POLE_HALF * 2 - 0.1, WOOD, { roughness: 0.6 })
  pole.rotation.z = Math.PI / 2
  vara.add(pole)
  for (const sx of [-1, 1]) {
    const grip = cylinder(0.034, 0.034, 0.12, '#3c2a20', { roughness: 0.85 })
    grip.rotation.z = Math.PI / 2
    grip.position.x = sx * 0.72
    vara.add(grip)
    const stub = cylinder(0.034, 0.03, 0.14, CHAR, { roughness: 0.95 })
    stub.rotation.z = Math.PI / 2
    stub.position.x = sx * (POLE_HALF - 0.06)
    vara.add(stub)
  }
  equilibrista.add(vara)

  // ---- brasas nas duas pontas (filhas da vara) -------------------------------
  const brasas = new THREE.Group()
  for (const sx of [-1, 1]) {
    const tip = new THREE.Group()
    tip.position.x = sx * POLE_HALF
    const ember = puff(0.06, EMBER, 5, sx > 0 ? 3 : 9, { emissive: EMBER, emissiveIntensity: 1.3, roughness: 0.6 })
    tip.add(ember)
    const flames: [number, number, number, number][] = [
      [0, 0.24, 0.07, 0], [sx * 0.05, 0.16, 0.05, -sx * 0.35], [-sx * 0.04, 0.14, 0.045, sx * 0.3],
    ]
    for (const [fx, fh, fr, rz] of flames) {
      const outer = cone(fr, fh, FLAME, { emissive: FLAME, emissiveIntensity: 1.1 })
      outer.position.set(fx, fh / 2 + 0.03, 0)
      outer.rotation.z = rz
      tip.add(outer)
    }
    const core = cone(0.035, 0.13, SPARK, { emissive: SPARK, emissiveIntensity: 1.2 })
    core.position.set(0, 0.1, 0.03)
    tip.add(core)
    brasas.add(tip)
  }
  vara.add(brasas)
  root.add(equilibrista)

  // ---- faíscas caindo sobre as poltronas -----------------------------------
  const faiscas = new THREE.Group()
  const tipY = FY + POLE_Y * EQ_S
  const tipZ = FZ + POLE_Z * EQ_S
  const sr = rng(77)
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 10; k++) {
      const t = (k + 1) / 10
      const r = 0.012 + sr() * 0.014
      const spark = sphere(r, SPARK, { emissive: SPARK, emissiveIntensity: 1.3 }, 12)
      spark.position.set(
        sx * POLE_HALF * EQ_S + (sr() - 0.5) * 0.35 * (0.3 + t),
        tipY - 0.12 - t * 0.95,
        tipZ + t * 0.45 + (sr() - 0.5) * 0.15,
      )
      spark.scale.y = 1.6 + sr() * 1.2
      faiscas.add(spark)
    }
  }
  root.add(faiscas)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'poltronas', group: 'sala', object: poltronas },
    { name: 'projetorE', group: 'projetores', object: projetorE },
    { name: 'projetorD', group: 'projetores', object: projetorD },
    { name: 'fita', group: 'fita', object: fita },
    { name: 'equilibrista', group: 'equilibrista', object: equilibrista },
    { name: 'bracoE', group: 'equilibrista', object: bracoE },
    { name: 'bracoD', group: 'equilibrista', object: bracoD },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'brasas', group: 'vara', object: brasas },
    { name: 'faiscas', group: 'faiscas', object: faiscas },
  ]

  const EY = FY + 0.006
  const TWO_PI = Math.PI * 2

  // ---- montagem ---------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Sessão de gala no cinema: carpete vinho, poltronas vermelhas…',
    }),
    seq('poltronas-rise', 'poltronas', 0.3, 0.9, [riseFrom(0, 1.3)], { ease: 'easeOut' }),

    seq('projetorE-rise', 'projetorE', 1.4, 0.8, [riseFrom(0, 2.6)], {
      ease: 'easeOut',
      caption: 'Dois projetores sobem nos postes, um de cada lado da sala…',
    }),
    seq('projetorD-rise', 'projetorD', 1.6, 0.8, [riseFrom(0, 2.6)], { ease: 'easeOut' }),

    seq('fita-estica', 'fita', 2.6, 1.0, [ch('scale.x', 0.01, 1)], {
      ease: 'easeInOut',
      caption: '…e a fita do FILME se estica de um ao outro, feito corda bamba.',
    }),

    seq(
      'equilibrista-salta',
      'equilibrista',
      3.9,
      1.1,
      [
        ch('position.y', EY + 1.9, EY), ch('position.z', FZ - 1.6, FZ),
        ch('rotation.x', -TWO_PI, 0),
      ],
      { ease: 'easeOut', caption: 'O filme acaba e a equilibrista pula da tela, num mortal, direto pra fita!' },
    ),
    seq('bracoE-salta', 'bracoE', 3.9, 1.1, [ch('rotation.z', -2.6, -0.3), ch('rotation.x', 0, 0)], { ease: 'easeOut' }),
    seq('bracoD-salta', 'bracoD', 3.9, 1.1, [ch('rotation.z', 2.6, 0.3), ch('rotation.x', 0, 0)], { ease: 'easeOut' }),

    seq('bracoD-abre', 'bracoD', 5.3, 0.6, [ch('rotation.z', 0.3, ARM_Z), ch('rotation.x', 0, ARM_X)], {
      ease: 'easeOut',
      caption: 'Ela estala os dedos pro assistente: “DÊ! VARA EM BRASA!”',
    }),
    seq('bracoE-abre', 'bracoE', 5.3, 0.6, [ch('rotation.z', -0.3, -ARM_Z), ch('rotation.x', 0, ARM_X)], { ease: 'easeOut' }),

    seq(
      'vara-voa',
      'vara',
      5.9,
      0.9,
      [
        ch('position.x', 4.2, 0), ch('position.y', POLE_Y + 1.4, POLE_Y),
        ch('rotation.z', -3 * Math.PI, 0),
      ],
      { ease: 'easeOut' },
    ),
    seq(
      'brasas-acendem',
      'brasas',
      6.9,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: 'A VARA chega girando, com as duas pontas EM BRASA!' },
    ),

    seq('equilibrista-pende', 'equilibrista', 7.8, 0.7, [ch('rotation.z', 0, 0.08)], {
      ease: 'easeInOut',
      caption: 'Ela cruza a sala na ponta dos pés por cima do FILME, chovendo faíscas nas poltronas…',
    }),
    seq('equilibrista-volta', 'equilibrista', 8.5, 0.7, [ch('rotation.z', 0.08, -0.05)], { ease: 'easeInOut' }),
    seq('equilibrista-firma', 'equilibrista', 9.2, 0.6, [ch('rotation.z', -0.05, 0)], { ease: 'easeInOut' }),
    seq(
      'faiscas-caem',
      'faiscas',
      8.0,
      1.4,
      [
        ch('position.y', 0.5, 0),
        ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
      ],
      { ease: 'easeIn' },
    ),

    seq(
      'brasas-aviva',
      'brasas',
      9.8,
      0.4,
      [ch('scale.x', 1, 1.25), ch('scale.y', 1, 1.25), ch('scale.z', 1, 1.25)],
      { ease: 'easeOut' },
    ),
    seq(
      'brasas-assenta',
      'brasas',
      10.2,
      0.5,
      [ch('scale.x', 1.25, 1), ch('scale.y', 1.25, 1), ch('scale.z', 1.25, 1)],
      { ease: 'easeInOut', caption: 'Det var en bra film. — Foi um filme bom.' },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0, 2.35, 6.1], target: [0, 1.5, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-var-en-bra-film',
    contexto:
      "Lazer: saindo do cinema, quando sobem os créditos no sofá, ou comentando um filme que alguém recomendou: 'Jag såg den — det var en bra film!'.",
    fraseFonte: 'Foi um filme bom.',
    fraseAlvo: 'Det var en bra film.',
    pronuncia:
      "dê vár en BRÁ FÍLM ('det' = dê; 'var' = VÁR, A longo e R brando, que emenda no 'en': va-ren — na fala corrida muita gente diz só 'va'; 'en' com E curto e N batido na língua, sem nasal; 'bra' = BRÁ, R de um toque e A longo; 'film' numa sílaba só, I curto, L de verdade, M fechando)",
    ponteSonora:
      "DÊ VÁR(a) EM BRÁ(sa)... FILM(e)! (5 sílabas: dê-vár-en-BRÁ-FÍLM; força no BRÁ e no FILM; DÊ = o 'det' de sempre, o DÊ de 'Det var jättegott, tack!' — o 'dê!' de 'me DÊ isso', Ê fechado, curto, sem T e nunca 'dji'; VÁR(a) = a VARA sem o -a, a MESMA VARA de 'Var bor du?' e de 'Hur var det i skolan?' — o 'var' de 'foi' tem o mesmo som do 'var' de 'onde' —: A longo e R BRANDO à caipira, que gruda no EM: va-ren; EM BRÁ(sa) = o MESMO 'en bra' da estrela-do-mar de 'Ha en bra dag!': EM = o EM de EM BRASA, mas ORAL — E curto e N batido na língua, nunca o 'ẽi' nasal —, e BRÁ = o BRÁ de BRASA, o mesmo 'bra' de 'Ha det bra' e 'Jag mår bra', R de um toque e A longo, cortando o -SA; FILM(e) = o MESMO FILME sem o -E de 'Vilken film ska vi se?': uma sílaba só, I curto, L DE VERDADE — nunca 'FIU-mi' — e o M fechando a boca)",
    historia:
      "Na sessão de gala, o filme acaba e a equilibrista pula da tela direto pra sala. Ela estala os dedos pro assistente: 'DÊ! VARA EM BRASA!' — e ele joga a vara de equilíbrio com as duas pontas pegando fogo. Aí atravessa a sala inteira andando por cima da própria fita do FILME, esticada entre os dois projetores como corda bamba, chovendo faíscas nas poltronas. Quando pisa do outro lado, o cinema inteiro levanta e aplaude: que filme bom.",
  },
  createScene,
}

export default card
