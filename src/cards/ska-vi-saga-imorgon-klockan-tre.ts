import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Ska vi säga imorgon klockan tre?" — o tucano trombonista solta SKA-VI pelo
 * bico-corneta, serve-se a CEIA (säga = SÉIA) fumegante, o IMÓRON (ouriço de
 * touca de dormir) fareja a tigela e finca TRÊS cenouras em fila: CLÓ-CAN TRÊ.
 *
 * Sem relógio nenhum: a hora é a fila de três cenouras na toalha xadrez.
 */

// --- paleta: madeira + xadrez + pelo, com laranja saturado reservado --------
const WOOD = '#c19158'
const WOOD_DARK = '#8f6538'
const CLOTH = '#f0ece0'
const CLOTH_BLUE = '#7fb0d4'
const CERAMIC = '#efe6d2'
const RIM_BLUE = '#3f6ea8'
const SOUP = '#d0973f'
const STEAM = '#f4f5f3'
const FUR = '#6b4a33'
const FUR_LIGHT = '#8d6448'
const SPINE = '#8d8f93'
const CAP_RED = '#b3453c'
const CAP_CREAM = '#efe6d2'
const BIRD = '#2c2c33'
const BIRD_CHEST = '#dcc06a'
const BIRD_FOOT = '#6b7b8c'
const LEAF = '#4f8f3f'
const ORANGE = '#e8721f' // ACENTO: bico-corneta + as três cenouras

const GY = 0.18 // topo da grama do diorama
const TOP = GY + 0.68 // topo da toalha na mesa
const BOWL_X = -0.55
const BOWL_Z = -0.15
const CARROT_Z = 0.28
const CARROT_X = [-0.3, 0.02, 0.34]

const UP = new THREE.Vector3(0, 1, 0)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: clareira de piquenique ------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.6, 2.72, 0.12, '#6b5138', { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const grass = cylinder(2.54, 2.6, 0.07, '#4f8f3f', { roughness: 0.92 })
  grass.position.y = 0.145
  base.add(grass)

  for (const [rx, rz, rr, rs] of [
    [-2.05, 0.9, 0.17, 31],
    [1.95, 1.15, 0.11, 32],
  ] as const) {
    const stone = rock(rr, '#8d9296', rs, { roughness: 0.9 })
    stone.position.set(rx, GY + rr * 0.4, rz)
    stone.rotation.y = rand() * Math.PI
    base.add(stone)
  }

  for (const [bx, bz, br, bs] of [
    [-1.5, -1.75, 0.24, 33],
    [1.55, -1.6, 0.19, 34],
    [2.15, 0.05, 0.15, 35],
  ] as const) {
    const bush = puff(br, '#3f7d33', 6, bs, { roughness: 0.92 })
    bush.position.set(bx, GY + br * 0.7, bz)
    base.add(bush)
  }

  for (const [fx, fz] of [[-2.1, -0.4], [1.0, 1.75], [-0.45, 2.05]] as const) {
    const stem = cylinder(0.012, 0.018, 0.2, '#3f7d33', { roughness: 0.92 })
    stem.position.set(fx, GY + 0.1, fz)
    stem.rotation.z = (rand() - 0.5) * 0.3
    const petals = sphere(0.05, '#f3efe2', { roughness: 0.75 })
    petals.position.y = 0.12
    petals.scale.y = 0.6
    const core = sphere(0.024, '#e3c463', { roughness: 0.6 })
    core.position.y = 0.15
    stem.add(petals, core)
    base.add(stem)
  }
  root.add(base)

  // ---- mesa de piquenique com toalha xadrez ---------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(0, GY, -0.05)

  const tampo = rbox(2.0, 0.09, 0.95, 0.02, WOOD, { roughness: 0.7 })
  tampo.position.y = 0.6
  mesa.add(tampo)

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = rbox(0.12, 0.68, 0.12, 0.03, WOOD_DARK, { roughness: 0.75 })
      leg.position.set(sx * 0.72, 0.3, sz * 0.3)
      leg.rotation.x = -sz * 0.35
      mesa.add(leg)
    }
    const brace = rbox(0.1, 0.08, 1.72, 0.03, WOOD_DARK, { roughness: 0.75 })
    brace.position.set(sx * 0.72, 0.31, 0)
    mesa.add(brace)
  }

  for (const sz of [-1, 1]) {
    const bench = rbox(2.0, 0.07, 0.3, 0.02, WOOD, { roughness: 0.72 })
    bench.position.set(0, 0.34, sz * 0.72)
    mesa.add(bench)
  }

  const toalha = rbox(2.08, 0.03, 1.02, 0.012, CLOTH, { roughness: 0.92 })
  toalha.position.y = 0.66
  mesa.add(toalha)

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 4; j++) {
      if ((i + j) % 2 !== 0) continue
      const cell = rbox(0.235, 0.012, 0.23, 0.004, CLOTH_BLUE, { roughness: 0.92 })
      cell.position.set(-0.875 + i * 0.25, 0.673, -0.375 + j * 0.25)
      mesa.add(cell)
    }
  }

  // barra pendurada da toalha, frente e fundo
  for (const sz of [-1, 1]) {
    const skirt = rbox(2.08, 0.16, 0.025, 0.008, CLOTH, { roughness: 0.92 })
    skirt.position.set(0, 0.585, sz * 0.508)
    mesa.add(skirt)
    for (let i = 0; i < 8; i += 2) {
      const cell = rbox(0.235, 0.15, 0.012, 0.004, CLOTH_BLUE, { roughness: 0.92 })
      cell.position.set(-0.875 + i * 0.25, 0.585, sz * 0.522)
      mesa.add(cell)
    }
  }
  root.add(mesa)

  // ---- tigela da ceia, cerâmica creme com friso azul ------------------------
  const tigela = new THREE.Group()
  tigela.position.set(BOWL_X, TOP, BOWL_Z)

  const bowl = lathe(
    [
      [0, 0.045], [0.09, 0.005], [0.19, 0.03], [0.26, 0.11], [0.285, 0.21],
      [0.285, 0.225], [0.255, 0.225], [0.235, 0.12], [0.16, 0.055],
      [0.07, 0.045], [0, 0.05],
    ],
    CERAMIC,
    { roughness: 0.15 },
  )
  tigela.add(bowl)

  const friso = torus(0.272, 0.016, RIM_BLUE, { roughness: 0.2 })
  friso.position.y = 0.185
  friso.rotation.x = Math.PI / 2
  tigela.add(friso)

  const caldo = cylinder(0.235, 0.21, 0.02, SOUP, { roughness: 0.3 })
  caldo.position.y = 0.15
  tigela.add(caldo)

  for (const [dx, dz, dr] of [[0.07, 0.03, 0.045], [-0.06, -0.07, 0.038], [0.02, -0.1, 0.032]] as const) {
    const dumpling = sphere(dr, '#e8dcc0', { roughness: 0.6 })
    dumpling.position.set(dx, 0.162, dz)
    dumpling.scale.y = 0.65
    tigela.add(dumpling)
  }

  const colher = capsule(0.022, 0.2, WOOD, { roughness: 0.7 })
  colher.position.set(0.2, 0.2, 0.16)
  colher.rotation.set(0.9, 0.4, 0.5)
  tigela.add(colher)
  root.add(tigela)

  // ---- vapor da ceia: três bolotas subindo em espiral -----------------------
  const vapor = new THREE.Group()
  vapor.position.set(BOWL_X, TOP + 0.34, BOWL_Z)
  const steamA = puff(0.075, STEAM, 5, 41, { roughness: 0.95 })
  const steamB = puff(0.062, STEAM, 5, 42, { roughness: 0.95 })
  steamB.position.set(0.11, 0.2, -0.07)
  const steamC = puff(0.05, STEAM, 5, 43, { roughness: 0.95 })
  steamC.position.set(-0.03, 0.39, 0.1)
  vapor.add(steamA, steamB, steamC)
  root.add(vapor)

  // ---- tucano trombonista, em pé na mesa ------------------------------------
  const tucano = new THREE.Group()
  tucano.position.set(0.75, TOP, -0.12)
  const ave = new THREE.Group()
  ave.rotation.y = -1.0
  tucano.add(ave)

  for (const side of [-1, 1]) {
    const shin = cylinder(0.032, 0.036, 0.17, BIRD_FOOT, { roughness: 0.6 })
    shin.position.set(side * 0.09, 0.085, 0)
    ave.add(shin)
    const foot = rbox(0.11, 0.032, 0.17, 0.014, BIRD_FOOT, { roughness: 0.6 })
    foot.position.set(side * 0.09, 0.016, 0.035)
    ave.add(foot)
  }

  const peito = capsule(0.21, 0.2, BIRD, { roughness: 0.6 })
  peito.position.y = 0.42
  ave.add(peito)

  const plastrao = capsule(0.15, 0.15, BIRD_CHEST, { roughness: 0.65 })
  plastrao.position.set(0, 0.4, 0.11)
  plastrao.scale.z = 0.55
  ave.add(plastrao)

  const cauda = capsule(0.085, 0.24, BIRD, { roughness: 0.6 })
  cauda.position.set(0, 0.44, -0.22)
  cauda.rotation.x = -0.95
  ave.add(cauda)

  for (const side of [-1, 1]) {
    const asa = capsule(0.07, 0.24, BIRD, { roughness: 0.6 })
    asa.position.set(side * 0.2, 0.44, -0.01)
    asa.rotation.z = side * 0.14
    asa.scale.x = 0.5
    ave.add(asa)
  }

  const cabecaAve = sphere(0.17, BIRD, { roughness: 0.6 })
  cabecaAve.position.set(0, 0.7, 0.02)
  ave.add(cabecaAve)

  for (const side of [-1, 1]) {
    const ring = torus(0.068, 0.018, '#8fc7dd', { roughness: 0.5 })
    ring.position.set(side * 0.1, 0.74, 0.115)
    ave.add(ring)
    const eye = sphere(0.052, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.1, 0.74, 0.115)
    eye.scale.z = 0.6
    const pupil = sphere(0.024, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.1, 0.742, 0.155)
    ave.add(eye, pupil)
  }

  // bico-corneta: funil laranja apontado pra cima (telescopa da cara)
  const bico = new THREE.Group()
  bico.position.set(0, 0.66, 0.14)
  bico.rotation.x = 0.45
  ave.add(bico)

  const corneta = lathe(
    [
      [0.035, 0], [0.06, 0.05], [0.08, 0.14], [0.105, 0.24], [0.15, 0.33],
      [0.23, 0.41], [0.25, 0.44], [0.218, 0.44], [0.138, 0.36], [0.088, 0.27],
      [0.062, 0.16], [0.042, 0.06], [0, 0.02],
    ],
    ORANGE,
    { roughness: 0.3 },
  )
  bico.add(corneta)

  const goela = cylinder(0.2, 0.09, 0.02, '#7a3a12', { roughness: 0.6 })
  goela.position.y = 0.405
  bico.add(goela)

  const anel = torus(0.09, 0.022, '#c95a12', { roughness: 0.35 })
  anel.position.y = 0.19
  anel.rotation.x = Math.PI / 2
  bico.add(anel)
  root.add(tucano)

  // ---- ouriço IMÓRON: casca externa anima, miolo carrega a rotação de olhar --
  const ourico = new THREE.Group()
  ourico.position.set(-1.42, GY, 0.3)
  const bicho = new THREE.Group()
  bicho.rotation.y = 1.5 // olha para a mesa (+x)
  ourico.add(bicho)

  const corpo = sphere(0.32, FUR, { roughness: 0.9 })
  corpo.position.y = 0.34
  corpo.scale.set(1, 0.94, 1.08)
  bicho.add(corpo)

  const barriga = sphere(0.22, FUR_LIGHT, { roughness: 0.9 })
  barriga.position.set(0, 0.28, 0.17)
  barriga.scale.z = 0.6
  bicho.add(barriga)

  // coroa de espinhos cobrindo as costas e o topo
  for (const [phi, count, len, rad] of [
    [0.32, 5, 0.19, 0.024],
    [0.78, 8, 0.22, 0.026],
    [1.2, 8, 0.2, 0.024],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const theta = Math.PI * (0.72 + (i / (count - 1)) * 1.56)
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.cos(theta),
      ).normalize()
      const spike = cone(rad, len, SPINE, { roughness: 0.75, flat: true })
      spike.position.copy(dir).multiplyScalar(0.3).add(new THREE.Vector3(0, 0.34, 0))
      spike.quaternion.setFromUnitVectors(UP, dir)
      bicho.add(spike)
    }
  }

  const focinho = capsule(0.085, 0.14, FUR_LIGHT, { roughness: 0.88 })
  focinho.position.set(0, 0.38, 0.23)
  focinho.rotation.x = 1.15
  const nariz = sphere(0.05, '#2b1f19', { roughness: 0.3 })
  nariz.position.y = 0.14
  focinho.add(nariz)
  bicho.add(focinho)

  for (const side of [-1, 1]) {
    // olhos semicerrados: esclera bem achatada + pálpebra caída
    const eye = sphere(0.06, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.13, 0.45, 0.245)
    eye.scale.set(1, 0.38, 0.55)
    const pupil = sphere(0.026, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.13, 0.442, 0.285)
    bicho.add(eye, pupil)

    const lid = rbox(0.14, 0.04, 0.06, 0.015, FUR, { roughness: 0.9 })
    lid.position.set(side * 0.13, 0.483, 0.25)
    lid.rotation.x = -0.25
    bicho.add(lid)

    const orelha = sphere(0.055, FUR_LIGHT, { roughness: 0.9 })
    orelha.position.set(side * 0.2, 0.56, 0.06)
    orelha.scale.set(0.5, 1, 1)
    bicho.add(orelha)

    const pata = capsule(0.052, 0.06, '#4e3527', { roughness: 0.88 })
    pata.position.set(side * 0.15, 0.06, 0.19)
    pata.rotation.x = Math.PI / 2
    bicho.add(pata)
  }

  // ---- touca de dormir listrada (cresce sobre a cabeça do ouriço) -----------
  const touca = new THREE.Group()
  touca.position.set(0, 0.58, -0.03)
  touca.rotation.x = -0.32

  const aba = torus(0.245, 0.048, CAP_CREAM, { roughness: 0.92 })
  aba.position.y = 0.02
  aba.rotation.x = Math.PI / 2
  touca.add(aba)

  const bandas: [number, number][] = [
    [0.25, 0.215], [0.215, 0.18], [0.18, 0.145], [0.145, 0.11], [0.11, 0.078],
  ]
  let capY = 0.0
  bandas.forEach(([rb, rt], i) => {
    const band = cylinder(rt, rb, 0.07, i % 2 === 0 ? CAP_RED : CAP_CREAM, { roughness: 0.92 })
    band.position.y = capY + 0.035
    touca.add(band)
    capY += 0.07
  })

  const ponta = capsule(0.058, 0.16, CAP_RED, { roughness: 0.92 })
  ponta.position.set(0.1, capY + 0.06, 0.01)
  ponta.rotation.z = -1.0
  touca.add(ponta)

  const pompom = sphere(0.095, CAP_CREAM, { roughness: 0.95 })
  pompom.position.set(0.24, capY + 0.02, 0.01)
  touca.add(pompom)
  bicho.add(touca)
  root.add(ourico)

  // ---- as TRÊS cenouras fincadas em fila (a hora, sem relógio) --------------
  const cenouras = CARROT_X.map((cx, i) => {
    const g = new THREE.Group()
    g.position.set(cx, TOP, CARROT_Z)
    g.rotation.z = [-0.09, 0.05, -0.05][i]
    g.rotation.x = 0.06

    const raiz = cone(0.085, 0.36, ORANGE, { roughness: 0.55 })
    raiz.rotation.z = Math.PI // ponta fincada para baixo
    raiz.position.y = 0.14
    g.add(raiz)

    for (let k = 0; k < 3; k++) {
      const anelC = torus(0.072 - k * 0.014, 0.007, '#c95a12', { roughness: 0.6 })
      anelC.position.y = 0.2 + k * 0.055
      anelC.rotation.x = Math.PI / 2
      g.add(anelC)
    }

    const coroa = cylinder(0.05, 0.062, 0.03, '#3f6b2c', { roughness: 0.8 })
    coroa.position.y = 0.315
    g.add(coroa)

    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + i * 0.4
      const folha = capsule(0.016, 0.16, LEAF, { roughness: 0.85 })
      folha.position.set(Math.cos(a) * 0.06, 0.41, Math.sin(a) * 0.06)
      folha.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5)
      g.add(folha)
    }
    return g
  })
  for (const c of cenouras) root.add(c)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'tucano', group: 'ska-vi', object: tucano },
    { name: 'bico', group: 'ska-vi', object: bico },
    { name: 'tigela', group: 'ceia', object: tigela },
    { name: 'vapor', group: 'ceia', object: vapor },
    { name: 'ourico', group: 'imoron', object: ourico },
    { name: 'touca', group: 'imoron', object: touca },
    { name: 'cenoura1', group: 'tre', object: cenouras[0] },
    { name: 'cenoura2', group: 'tre', object: cenouras[1] },
    { name: 'cenoura3', group: 'tre', object: cenouras[2] },
  ]

  const grow = (from = 0.01) => [
    ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Na Suécia ninguém marca hora aos gritos: monta-se um piquenique na grama.',
    }),
    seq('mesa-rise', 'mesa', 1.9, 0.9, [riseFrom(GY, 1.2)], { ease: 'easeOut' }),

    seq('tucano-rise', 'tucano', 3.5, 0.8, [riseFrom(GY, 1.35)], {
      ease: 'easeOut',
      caption: 'Chega a bandinha de SKA e o tucano trombonista pula na mesa…',
    }),
    seq('tucano-hop', 'tucano', 4.4, 0.4, [
      ch('position.y', GY, TOP + 0.45),
      ch('position.x', 1.62, 1.18),
      ch('position.z', 0.25, 0.05),
    ], { ease: 'easeOut' }),
    seq('tucano-land', 'tucano', 4.8, 0.4, [
      ch('position.y', TOP + 0.45, TOP),
      ch('position.x', 1.18, 0.75),
      ch('position.z', 0.05, -0.12),
    ], { ease: 'easeIn' }),
    seq('bico-out', 'bico', 5.4, 0.6, [
      ...grow(0.08),
      ch('position.z', 0.0, 0.14),
    ], {
      ease: 'easeOut',
      caption: '…o bico DELE é a corneta: um funil laranja virado pro céu — SKA-VI!',
    }),
    seq('tucano-toot', 'tucano', 6.2, 0.35, [ch('position.y', TOP, TOP + 0.13)], { ease: 'easeOut' }),
    seq('bico-flare', 'bico', 6.25, 0.35, [ch('scale.x', 1, 1.16), ch('scale.z', 1, 1.16)]),
    seq('tucano-down', 'tucano', 6.55, 0.4, [ch('position.y', TOP + 0.13, TOP)], { ease: 'easeIn' }),
    seq('bico-relax', 'bico', 6.6, 0.4, [ch('scale.x', 1.16, 1), ch('scale.z', 1.16, 1)]),

    seq('tigela-grow', 'tigela', 7.2, 0.7, [...grow()], {
      ease: 'easeOut',
      caption: 'Serve-se então uma CEIA fumegante na mesa — säga soa SÉIA.',
    }),
    seq('vapor-grow', 'vapor', 7.7, 0.8, [
      ...grow(),
      ch('position.y', TOP + 0.12, TOP + 0.24),
    ], { ease: 'easeOut' }),

    seq('ourico-rise', 'ourico', 9.0, 0.8, [riseFrom(GY, 1.45)], {
      ease: 'easeOut',
      caption: 'O convidado brota do chão: o IMÓRON, ouriço que só acorda amanhã.',
    }),
    seq('touca-grow', 'touca', 9.7, 0.6, [...grow()], { ease: 'easeOut' }),
    seq('ourico-fareja', 'ourico', 10.5, 0.5, [ch('rotation.z', 0, 0.16)], { ease: 'easeOut' }),
    seq('ourico-baixa', 'ourico', 11.0, 0.45, [ch('rotation.z', 0.16, 0)]),

    seq('cenoura-1', 'cenoura1', 11.6, 0.5, [...grow()], {
      ease: 'easeOut',
      caption: 'Ele aceita e finca as cenouras em fila: UMA, DUAS, TRÊS — CLÓ-CAN TRÊ.',
    }),
    seq('cenoura-2', 'cenoura2', 12.1, 0.5, [...grow()], { ease: 'easeOut' }),
    seq('cenoura-3', 'cenoura3', 12.6, 0.5, [...grow()], { ease: 'easeOut' }),

    seq('vapor-sobe', 'vapor', 13.2, 0.7, [ch('position.y', TOP + 0.24, TOP + 0.34)], {
      ease: 'easeOut',
      caption: 'Ska vi säga imorgon klockan tre? — Vamos dizer amanhã às três?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.6, 2.95, 6.1], target: [-0.05, 0.95, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'ska-vi-saga-imorgon-klockan-tre',
    contexto: 'Fechando horário no fim de uma conversa, por telefone ou pessoalmente.',
    fraseFonte: 'Vamos dizer amanhã às três?',
    fraseAlvo: 'Ska vi säga imorgon klockan tre?',
    pronuncia:
      "ska vi SÉ-ia i-MÓR-ron KLÓ-kan TRÊ? ('säga' na fala vira 'säja'; 'imorgon' com o g quase sumindo)",
    ponteSonora:
      "SKA-VI SÉIA, IMÓRON CLÓ-CAN TRÊ? (10 sílabas, tônicas em SÉ, MÓ, CLÓ e TRÊ; 'SKA' colado, sem 'e' na frente, é o ritmo jamaicano; 'säga' vira SÉIA como 'ceia' mas com É bem aberto e I de ioga; 'imorgon' = i-MÓ-ron com R BRANDO, jamais RR; 'tre' = TRÊ, sem o S)",
    historia:
      'Na Suécia ninguém marca hora falando alto: chega uma bandinha de SKA e o tucano trombonista solta as duas notas do convite pelo bico — SKA-VI! O bico dele É a corneta, um funil laranja que ele aponta pra cima. Serve-se então uma CEIA fumegante na mesa, e o convidado brota do banco: o IMÓRON, um ouriço de touca de dormir que só acorda amanhã. Ele fareja a tigela, aceita o combinado e finca três cenouras em fila na toalha — CLÓ-CAN TRÊ.',
  },
  createScene,
}

export default card
