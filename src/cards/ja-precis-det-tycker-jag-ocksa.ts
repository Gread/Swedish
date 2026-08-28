import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, lathe, torus,
} from '../rig/helpers'

/**
 * "Ja, precis! Det tycker jag också." — a CAPIVARA OURIVES mineira põe a
 * opinião do colega e a sua (duas bolinhas douradas IDÊNTICAS) nos pratos da
 * BALANÇA DE PRECIS(O). O travessão para no nível EXATO: empate = "eu também
 * acho". Aí ela ergue o polegar com um pão de queijo: ÓK, SÔ!
 *
 * O ponto da cena é o EMPATE: os dois pratos terminam na MESMA altura
 * (position.y idêntico), o travessão volta a rotation.z = 0 com o fiel
 * centrado entre os dois postes, e as bolinhas têm o mesmo raio.
 */

const CREME = '#e6dcc6'
const CREME_DARK = '#d5c8a9'
const WOOD = '#4a3220'
const WOOD_LIGHT = '#6b4a2e'
const SILVER = '#c6ccd4'
const STEEL = '#8f979f'
const FUR = '#8f4f34'
const FUR_LIGHT = '#a9664a'
const PAW = '#6b3823'
const APRON = '#98a0a8'
const BREAD = '#d3b478'
const GOLD = '#f2b32c' // acento reservado: as duas OPINIÕES

const GY = 0.14 // topo do piso
const BENCH_TOP = 0.95 // topo da bancada
const SX = 0.75 // eixo da balança
const SZ = -0.15
const PIVOT = 1.86 // altura do travessão (origem dos pratos)
const ARM = 0.9 // meio-braço do travessão
const HANG = 0.44 // comprimento dos cordões
const BALL_R = 0.09

// prato pendurado -> centro da bolinha
const ballY = (plateY: number) => plateY - HANG + 0.02 + BALL_R

// níveis: o EMPATE é plateY = PIVOT dos dois lados
const TILT = 0.15
const DIP = Math.sin(TILT) * ARM // 0.1345
const OVER = Math.sin(0.05) * ARM // repique do travessão

const PLATE_L = { level: PIVOT, dip: PIVOT - DIP, over: PIVOT + OVER }
const PLATE_R = { level: PIVOT, up: PIVOT + DIP, over: PIVOT - OVER }

// paw da capivara (origem física das bolinhas)
const PAW_POS: [number, number, number] = [-0.93, 0.9, 0.79]

function metalOpts(rough = 0.22) {
  return { roughness: rough, metalness: 0.85 }
}

function makePrato(): THREE.Group {
  const g = new THREE.Group()

  const ring = torus(0.038, 0.012, SILVER, metalOpts(0.28))
  ring.rotation.y = Math.PI / 2
  ring.position.y = -0.03
  g.add(ring)

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    const end = new THREE.Vector3(Math.cos(a) * 0.235, -HANG, Math.sin(a) * 0.235)
    const cord = cylinder(0.011, 0.011, end.length(), STEEL, metalOpts(0.35))
    cord.position.copy(end.clone().multiplyScalar(0.5))
    cord.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().normalize())
    g.add(cord)
  }

  const dish = lathe(
    [
      [0, 0], [0.16, 0.004], [0.24, 0.026], [0.264, 0.06], [0.27, 0.076],
      [0.252, 0.072], [0.234, 0.044], [0.15, 0.024], [0, 0.02],
    ],
    SILVER,
    metalOpts(0.2),
  )
  dish.position.y = -HANG
  g.add(dish)

  return g
}

function makeBolinha(): THREE.Group {
  const g = new THREE.Group()
  const ball = sphere(BALL_R, GOLD, { roughness: 0.2, metalness: 0.9 })
  g.add(ball)
  const glint = sphere(BALL_R * 0.34, '#ffe08a', { roughness: 0.15, metalness: 0.6 })
  glint.position.set(-0.035, 0.045, 0.05)
  g.add(glint)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: piso de ladrilho creme + bancada de madeira escura -------------
  const base = new THREE.Group()

  const slab = cylinder(2.6, 2.68, 0.14, CREME_DARK, { roughness: 0.6 })
  slab.position.y = 0.07
  base.add(slab)

  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const x = i * 0.9
      const z = j * 0.9
      if (Math.hypot(x, z) > 2.15) continue
      const tone = (i + j) % 2 === 0 ? CREME : '#dfd3b7'
      const tile = rbox(0.82, 0.03, 0.82, 0.03, tone, { roughness: 0.35 })
      tile.position.set(x, 0.15, z)
      base.add(tile)
    }
  }

  // bancada
  const benchTop = rbox(2.6, 0.14, 1.25, 0.04, WOOD, { roughness: 0.7 })
  benchTop.position.set(0.55, BENCH_TOP - 0.07, -0.3)
  base.add(benchTop)

  const benchLip = rbox(2.62, 0.05, 0.06, 0.02, WOOD_LIGHT, { roughness: 0.7 })
  benchLip.position.set(0.55, BENCH_TOP - 0.15, 0.31)
  base.add(benchLip)

  for (const lx of [-1.12, 1.12]) {
    for (const lz of [-0.48, 0.46]) {
      const leg = cylinder(0.07, 0.085, BENCH_TOP - GY, WOOD_LIGHT, { roughness: 0.75 })
      leg.position.set(0.55 + lx, GY + (BENCH_TOP - GY) / 2 - 0.07, -0.3 + lz)
      base.add(leg)
    }
  }

  const shelf = rbox(2.2, 0.07, 0.8, 0.03, WOOD_LIGHT, { roughness: 0.8 })
  shelf.position.set(0.55, 0.44, -0.3)
  base.add(shelf)

  // adereços de ourivesaria (rng fixo)
  const pot = lathe(
    [[0, 0], [0.11, 0], [0.115, 0.03], [0.09, 0.16], [0.085, 0.17], [0.075, 0.16], [0.1, 0.03], [0, 0.02]],
    '#7c6a52',
    { roughness: 0.55 },
  )
  pot.position.set(-0.35, BENCH_TOP, -0.6)
  pot.rotation.y = rand() * Math.PI
  base.add(pot)
  for (let i = 0; i < 3; i++) {
    const rod = cylinder(0.011, 0.013, 0.34, STEEL, metalOpts(0.35))
    rod.position.set(-0.35 + (rand() - 0.5) * 0.07, BENCH_TOP + 0.19, -0.6 + (rand() - 0.5) * 0.07)
    rod.rotation.z = (rand() - 0.5) * 0.5
    rod.rotation.x = (rand() - 0.5) * 0.4
    base.add(rod)
  }

  const pano = capsule(0.075, 0.34, '#8d6f57', { roughness: 0.92 })
  pano.position.set(1.55, BENCH_TOP + 0.07, 0.02)
  pano.rotation.set(0, rand() * 0.8, Math.PI / 2)
  base.add(pano)

  const caixinha = rbox(0.34, 0.16, 0.24, 0.03, WOOD_LIGHT, { roughness: 0.7 })
  caixinha.position.set(1.6, BENCH_TOP + 0.08, -0.62)
  caixinha.rotation.y = -0.35 + rand() * 0.2
  base.add(caixinha)

  const caixote = rbox(0.52, 0.44, 0.44, 0.04, WOOD_LIGHT, { roughness: 0.8 })
  caixote.position.set(2.02, GY + 0.22, 0.92)
  caixote.rotation.y = 0.4 + rand() * 0.3
  base.add(caixote)

  const barril = lathe(
    [[0, 0], [0.2, 0], [0.24, 0.12], [0.24, 0.3], [0.2, 0.42], [0.19, 0.43], [0, 0.43]],
    WOOD,
    { roughness: 0.8 },
  )
  barril.position.set(-2.0, GY, -0.55)
  barril.rotation.y = rand() * Math.PI
  base.add(barril)

  root.add(base)

  // ---- balança de precisão: coluna + pé + garfo do fiel --------------------
  const balanca = new THREE.Group()
  balanca.position.set(SX, BENCH_TOP, SZ)

  const foot = lathe(
    [[0, 0], [0.4, 0], [0.42, 0.025], [0.38, 0.06], [0.12, 0.085], [0.09, 0.1], [0, 0.1]],
    SILVER,
    metalOpts(0.25),
  )
  balanca.add(foot)

  const column = cylinder(0.048, 0.075, 0.76, SILVER, metalOpts())
  column.position.y = 0.48
  balanca.add(column)

  const collar = torus(0.075, 0.018, STEEL, metalOpts(0.3))
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.2
  balanca.add(collar)

  const knife = rbox(0.15, 0.1, 0.13, 0.03, STEEL, metalOpts(0.3))
  knife.position.y = 0.89
  balanca.add(knife)

  // garfo: o fiel centrado entre os dois postes = EMPATE
  for (const side of [-1, 1]) {
    const post = cylinder(0.016, 0.016, 0.3, STEEL, metalOpts(0.3))
    post.position.set(side * 0.09, PIVOT - BENCH_TOP + 0.15, 0)
    balanca.add(post)
    const cap = sphere(0.026, SILVER, metalOpts(0.25))
    cap.position.set(side * 0.09, PIVOT - BENCH_TOP + 0.3, 0)
    balanca.add(cap)
  }
  root.add(balanca)

  // ---- travessão (pivô no topo da coluna) ----------------------------------
  const travessao = new THREE.Group()
  travessao.position.set(SX, PIVOT, SZ)

  const beam = rbox(2 * ARM, 0.05, 0.07, 0.018, SILVER, metalOpts())
  travessao.add(beam)

  const hub = rbox(0.13, 0.11, 0.11, 0.03, SILVER, metalOpts(0.2))
  travessao.add(hub)

  const needle = rbox(0.026, 0.26, 0.026, 0.008, SILVER, metalOpts(0.2))
  needle.position.y = 0.15
  travessao.add(needle)

  const needleTip = sphere(0.028, SILVER, metalOpts(0.2))
  needleTip.position.y = 0.29
  travessao.add(needleTip)

  for (const side of [-1, 1]) {
    const hook = torus(0.032, 0.011, SILVER, metalOpts(0.25))
    hook.rotation.y = Math.PI / 2
    hook.position.set(side * ARM, -0.05, 0)
    travessao.add(hook)
    const nub = rbox(0.06, 0.06, 0.08, 0.02, STEEL, metalOpts(0.3))
    nub.position.set(side * ARM, 0, 0)
    travessao.add(nub)
  }
  root.add(travessao)

  // ---- os dois pratos (idênticos, pendurados nas pontas) -------------------
  const pratoE = makePrato()
  pratoE.position.set(SX - ARM, PIVOT, SZ)
  root.add(pratoE)

  const pratoD = makePrato()
  pratoD.position.set(SX + ARM, PIVOT, SZ)
  root.add(pratoD)

  // ---- as duas opiniões: bolinhas douradas IDÊNTICAS ----------------------
  const bolaE = makeBolinha()
  bolaE.position.set(SX - ARM, ballY(PIVOT), SZ)
  root.add(bolaE)

  const bolaD = makeBolinha()
  bolaD.position.set(SX + ARM, ballY(PIVOT), SZ)
  root.add(bolaD)

  // ---- capivara ourives mineira -------------------------------------------
  const capivara = new THREE.Group()
  capivara.position.set(-1.35, GY, 0.35)
  capivara.rotation.y = 1.4 // olha (+z local) para a balança

  for (const side of [-1, 1]) {
    const leg = capsule(0.115, 0.2, FUR, { roughness: 0.85 })
    leg.position.set(side * 0.17, 0.24, 0.02)
    capivara.add(leg)
    const foot2 = rbox(0.2, 0.09, 0.3, 0.04, PAW, { roughness: 0.85 })
    foot2.position.set(side * 0.17, 0.055, 0.11)
    capivara.add(foot2)
  }

  const torso = capsule(0.3, 0.42, FUR, { roughness: 0.85 })
  torso.position.y = 0.78
  capivara.add(torso)

  // avental cinza
  const apron = rbox(0.48, 0.62, 0.06, 0.05, APRON, { roughness: 0.92 })
  apron.position.set(0, 0.68, 0.28)
  capivara.add(apron)
  const bib = rbox(0.3, 0.26, 0.055, 0.04, APRON, { roughness: 0.92 })
  bib.position.set(0, 1.04, 0.29)
  capivara.add(bib)
  const pocket = rbox(0.22, 0.14, 0.04, 0.03, '#868e96', { roughness: 0.92 })
  pocket.position.set(0.06, 0.55, 0.32)
  capivara.add(pocket)
  for (const side of [-1, 1]) {
    const strap = capsule(0.022, 0.24, APRON, { roughness: 0.92 })
    strap.position.set(side * 0.14, 1.22, 0.2)
    strap.rotation.x = -0.5
    capivara.add(strap)
  }

  // cabeça retangular, focinho chato, orelhinhas
  const head = rbox(0.44, 0.36, 0.48, 0.1, FUR, { roughness: 0.85 })
  head.position.set(0, 1.4, 0.06)
  capivara.add(head)

  const muzzle = rbox(0.29, 0.18, 0.2, 0.06, FUR_LIGHT, { roughness: 0.85 })
  muzzle.position.set(0, 1.31, 0.32)
  capivara.add(muzzle)

  for (const side of [-1, 1]) {
    const nostril = sphere(0.028, '#3a2018', { roughness: 0.4 })
    nostril.position.set(side * 0.07, 1.35, 0.41)
    capivara.add(nostril)

    const eye = sphere(0.058, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.135, 1.47, 0.24)
    eye.scale.z = 0.6
    const pupil = sphere(0.028, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.135, 1.47, 0.275)
    capivara.add(eye, pupil)

    const ear = sphere(0.078, FUR, { roughness: 0.85 })
    ear.position.set(side * 0.2, 1.57, 0.0)
    ear.scale.set(1, 0.9, 0.5)
    const inner = sphere(0.042, PAW, { roughness: 0.85 })
    inner.position.set(side * 0.21, 1.57, 0.035)
    inner.scale.set(1, 0.9, 0.4)
    capivara.add(ear, inner)
  }

  // pata que segura o pão de queijo (lado oposto ao polegar)
  const bracoPao = new THREE.Group()
  bracoPao.position.set(0.3, 0.98, 0.14)
  bracoPao.rotation.set(-1.0, 0, 0.25)
  const forearmPao = capsule(0.075, 0.24, FUR, { roughness: 0.85 })
  forearmPao.position.y = -0.19
  bracoPao.add(forearmPao)
  const pawPao = sphere(0.1, PAW, { roughness: 0.85 })
  pawPao.position.y = -0.36
  bracoPao.add(pawPao)
  capivara.add(bracoPao)

  // pão de queijo, na pata
  const pao = new THREE.Group()
  pao.position.set(0, -0.46, 0.02)
  const paoBall = sphere(0.11, BREAD, { roughness: 0.9 })
  paoBall.scale.set(1, 0.86, 1)
  pao.add(paoBall)
  const paoLobe = sphere(0.055, '#e0c48d', { roughness: 0.9 })
  paoLobe.position.set(0.03, 0.075, 0.02)
  pao.add(paoLobe)
  const paoCrust = sphere(0.045, '#b8914f', { roughness: 0.9 })
  paoCrust.position.set(-0.06, -0.05, 0.05)
  pao.add(paoCrust)
  bracoPao.add(pao)

  // pata do polegar (do lado da câmera) — pose final: polegar pra cima
  const polegar = new THREE.Group()
  polegar.position.set(-0.36, 0.72, 0.16)
  polegar.rotation.set(0, 0, -0.15)
  const forearm = capsule(0.075, 0.24, FUR, { roughness: 0.85 })
  forearm.position.y = 0.19
  polegar.add(forearm)
  const fist = sphere(0.105, PAW, { roughness: 0.85 })
  fist.position.y = 0.37
  polegar.add(fist)
  const thumb = capsule(0.04, 0.1, PAW, { roughness: 0.85 })
  thumb.position.set(0.0, 0.52, 0.02)
  polegar.add(thumb)
  capivara.add(polegar)

  root.add(capivara)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'balanca', group: 'balanca', object: balanca },
    { name: 'travessao', group: 'balanca', object: travessao },
    { name: 'pratoE', group: 'balanca', object: pratoE },
    { name: 'pratoD', group: 'balanca', object: pratoD },
    { name: 'capivara', group: 'capivara', object: capivara },
    { name: 'polegar', group: 'capivara', object: polegar },
    { name: 'bolaE', group: 'opinioes', object: bolaE },
    { name: 'bolaD', group: 'opinioes', object: bolaD },
    { name: 'pao', group: 'final', object: pao },
  ]

  // ---- montagem ------------------------------------------------------------
  const grow = (from = 0.01) => [
    ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1),
  ]

  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 1.45)], {
      ease: 'easeOut',
      caption: 'Na bancada do ourives brotam o piso creme e a madeira escura…',
    }),

    // a balança cresce da própria bancada
    seq('balanca-grow', 'balanca', 2.0, 0.7, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…e cresce a BALANÇA DE PRECIS(O) — "PRECIS!" é EXATO, tônica na 2ª sílaba.',
    }),
    seq('travessao-grow', 'travessao', 2.7, 0.7, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),
    seq('pratoE-drop', 'pratoE', 3.45, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('pratoD-drop', 'pratoD', 3.6, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('capivara-rise', 'capivara', 5.3, 0.8, [riseFrom(GY, 1.95)], {
      ease: 'easeOut',
      caption: 'Chega a CAPIVARA OURIVES mineira: ela não discute, ela confere. IÁ!',
    }),
    seq('polegar-baixa', 'polegar', 5.35, 0.7, [ch('rotation.x', 0.9, 1.45)], { ease: 'easeOut' }),

    // opinião 1: arrancada da pata, jogada no prato esquerdo
    seq('bolaE-pop', 'bolaE', 6.9, 0.4, grow(), {
      ease: 'easeOut',
      caption: 'Ela arranca a opinião do colega e a sua — DÊ TÜ-ker IÁ — duas bolinhas douradas IDÊNTICAS.',
    }),
    seq('polegar-toss1', 'polegar', 6.95, 0.4, [ch('rotation.x', 1.45, 1.65)]),
    seq('bolaE-voa', 'bolaE', 7.35, 0.6, [
      ch('position.x', PAW_POS[0], SX - ARM),
      ch('position.y', PAW_POS[1], ballY(PLATE_L.level)),
      ch('position.z', PAW_POS[2], SZ),
    ]),
    seq('polegar-volta1', 'polegar', 7.4, 0.5, [ch('rotation.x', 1.65, 1.45)]),

    // um prato só carregado: o travessão pende
    seq('travessao-pende', 'travessao', 7.95, 0.5, [ch('rotation.z', 0, TILT)]),
    seq('pratoE-desce', 'pratoE', 7.95, 0.5, [ch('position.y', PLATE_L.level, PLATE_L.dip)]),
    seq('bolaE-desce', 'bolaE', 7.95, 0.5, [
      ch('position.y', ballY(PLATE_L.level), ballY(PLATE_L.dip)),
    ]),
    seq('pratoD-sobe', 'pratoD', 7.95, 0.5, [ch('position.y', PLATE_R.level, PLATE_R.up)]),

    // opinião 2: a mesma bolinha, no outro prato
    seq('bolaD-pop', 'bolaD', 8.7, 0.4, grow(), { ease: 'easeOut' }),
    seq('polegar-toss2', 'polegar', 8.75, 0.4, [ch('rotation.x', 1.45, 1.65)]),
    seq('bolaD-voa', 'bolaD', 9.15, 0.6, [
      ch('position.x', PAW_POS[0], SX + ARM),
      ch('position.y', PAW_POS[1], ballY(PLATE_R.up)),
      ch('position.z', PAW_POS[2], SZ),
    ]),
    seq('polegar-volta2', 'polegar', 9.2, 0.5, [ch('rotation.x', 1.65, 1.45)]),

    // repique e EMPATE: os dois pratos param no MESMO nível
    seq('travessao-repique', 'travessao', 9.75, 0.55, [ch('rotation.z', TILT, -0.05)], {
      caption: 'Uma em cada prato: o travessão para no nível EXATO, sem um fio de diferença — PRECIS!',
    }),
    seq('pratoE-repique', 'pratoE', 9.75, 0.55, [ch('position.y', PLATE_L.dip, PLATE_L.over)]),
    seq('bolaE-repique', 'bolaE', 9.75, 0.55, [
      ch('position.y', ballY(PLATE_L.dip), ballY(PLATE_L.over)),
    ]),
    seq('pratoD-repique', 'pratoD', 9.75, 0.55, [ch('position.y', PLATE_R.up, PLATE_R.over)]),
    seq('bolaD-repique', 'bolaD', 9.75, 0.55, [
      ch('position.y', ballY(PLATE_R.up), ballY(PLATE_R.over)),
    ]),

    seq('travessao-nivela', 'travessao', 10.3, 0.7, [ch('rotation.z', -0.05, 0)], { ease: 'easeOut' }),
    seq('pratoE-nivela', 'pratoE', 10.3, 0.7, [ch('position.y', PLATE_L.over, PIVOT)], { ease: 'easeOut' }),
    seq('bolaE-nivela', 'bolaE', 10.3, 0.7, [
      ch('position.y', ballY(PLATE_L.over), ballY(PIVOT)),
    ], { ease: 'easeOut' }),
    seq('pratoD-nivela', 'pratoD', 10.3, 0.7, [ch('position.y', PLATE_R.over, PIVOT)], { ease: 'easeOut' }),
    seq('bolaD-nivela', 'bolaD', 10.3, 0.7, [
      ch('position.y', ballY(PLATE_R.over), ballY(PIVOT)),
    ], { ease: 'easeOut' }),

    // ÓK, SÔ!
    seq('polegar-up', 'polegar', 11.4, 0.6, [ch('rotation.x', 1.45, 0)], {
      ease: 'easeOut',
      caption: 'Polegar pra cima e pão de queijo na pata: ÓK, SÔ! — "Ja, precis! Det tycker jag också."',
    }),
    seq('capivara-pula', 'capivara', 11.45, 0.35, [ch('position.y', GY, GY + 0.12)], { ease: 'easeOut' }),
    seq('capivara-cai', 'capivara', 11.8, 0.35, [ch('position.y', GY + 0.12, GY)], { ease: 'easeIn' }),
    seq('pao-pop', 'pao', 12.0, 0.5, grow(), { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 3.05, 6.3], target: [0.15, 1.25, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'ja-precis-det-tycker-jag-ocksa',
    contexto:
      'No meio de uma conversa em grupo, no fika do trabalho, quando ele concorda com o que alguém disse.',
    fraseFonte: 'Isso, exatamente! Eu também acho.',
    fraseAlvo: 'Ja, precis! Det tycker jag också.',
    pronuncia:
      "iá, pre-SÍS! de TÜ-ker iá ÔK-so ('precis' com tônica na 2ª sílaba; 'också' = ÔK-so)",
    ponteSonora:
      "IÁ! PRECIS'! DÊ TÜ-ker IÁ... ÓK, SÔ! (9 batidas; PRECIS' é PRECISO com o O arrancado — a tônica cai na 2ª sílaba, igual ao sueco, e 'preciso' já significa exato; o miolo DÊ TÜ-ker IÁ é a ordem invertida, com o TÜ de bico, fraco e rápido; ÓK-SÔ é 'ÓK, SÔ!' mineiro num fôlego — o primeiro é Ó ABERTO e curto, o mesmo o de 'klockan', e o segundo é o Ô FECHADO do 'sô'; OK monossílabo, nunca 'ôkêi')",
    historia:
      'Alguém no fika solta uma opinião e você concorda na hora. A CAPIVARA OURIVES mineira não discute: arranca a opinião do colega e a sua, duas bolinhas douradas idênticas, e joga uma em cada prato da BALANÇA DE PRECIS(O). O travessão para no nível EXATO, sem um fio de diferença. Aí ela ergue o polegar, morde um pão de queijo e sentencia: ÓK, SÔ!',
  },
  createScene,
}

export default card
