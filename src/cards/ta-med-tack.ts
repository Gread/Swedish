import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, lathe, puff, torus,
} from '../rig/helpers'

/**
 * "Ta med, tack." — a CABRA de avental que atende no balcão só sabe berrar
 * "TÁ! MÊÊÊ!", cospe o sanduíche já embrulhadinho dentro da sacola kraft e
 * crava o casco no tampo: TAC!
 *
 * Diorama: piso quadriculado creme, balcão de madeira clara atravessado,
 * cabra atrás dele com a cabeça pro alto, sacola de viagem à direita com o
 * pacote de fita vermelha (o único acento saturado da cena).
 */

const CREAM = '#e9dfcb'
const TILE = '#aca392'
const WOOD = '#c9a267'
const WOOD_DARK = '#96703f'
const FUR = '#f2ece0'
const FUR_WARM = '#e3d8c4'
const APRON = '#4a5261'
const APRON_DARK = '#39404c'
const HORN = '#8f9499'
const HOOF = '#2b2f36'
const KRAFT = '#bd8b52'
const KRAFT_DARK = '#9a6d3c'
const PAPER = '#efe7d6'
const RED = '#c94f3d' // acento reservado: a fita do pacote de viagem
const LEAF = '#4f7a45'

const GY = 0.18 // topo do piso do diorama
const CTOP = 1.07 // topo do tampo do balcão (mundo)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: piso quadriculado creme -----------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.5, 2.58, 0.12, '#5d5346', { roughness: 0.95 })
  slab.position.y = 0.06
  base.add(slab)

  const floor = cylinder(2.44, 2.5, 0.06, CREAM, { roughness: 0.5 })
  floor.position.y = 0.15
  base.add(floor)

  // xadrez: um único mesh-protótipo clonado (geometria e material compartilhados)
  const tileProto = rbox(0.46, 0.03, 0.46, 0.008, TILE, { roughness: 0.45 })
  for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
      if ((i + j) % 2 !== 0) continue
      const x = 0.1 + i * 0.5
      const z = j * 0.5
      if (Math.hypot(x, z) > 2.15) continue
      const tile = tileProto.clone()
      tile.position.set(x, 0.172, z)
      base.add(tile)
    }
  }

  // adereços de ambientação (posições fixas, jitter com rng semeado)
  const caixote = new THREE.Group()
  caixote.position.set(-1.82, GY, 0.6)
  caixote.rotation.y = 0.35 + (rand() - 0.5) * 0.3
  // caixote de feira: fundo escuro, ripas finas com frestas e quatro
  // colunas nos cantos (antes as ripas largas liam como pilha de panquecas)
  const crateBody = rbox(0.48, 0.42, 0.4, 0.02, '#4a3824', { roughness: 0.9 })
  crateBody.position.y = 0.21
  caixote.add(crateBody)
  for (const sy of [0.08, 0.2, 0.32]) {
    const slat = rbox(0.5, 0.06, 0.42, 0.012, WOOD, { roughness: 0.8 })
    slat.position.y = sy
    caixote.add(slat)
  }
  for (const cx of [-1, 1]) {
    for (const cz of [-1, 1]) {
      const coluna = rbox(0.06, 0.44, 0.06, 0.012, WOOD_DARK, { roughness: 0.8 })
      coluna.position.set(cx * 0.24, 0.22, cz * 0.2)
      caixote.add(coluna)
    }
  }
  // maçãs dentro do caixote
  for (const [ax, az] of [[-0.1, -0.05], [0.08, 0.06], [0.02, -0.1]] as const) {
    const maca = sphere(0.075, '#9c4a3a', { roughness: 0.55 })
    maca.position.set(ax, 0.45, az)
    caixote.add(maca)
  }
  base.add(caixote)

  const planta = new THREE.Group()
  planta.position.set(1.88, GY, -0.95)
  planta.rotation.y = rand() * Math.PI
  const vaso = lathe(
    [[0, 0], [0.14, 0], [0.18, 0.05], [0.155, 0.24], [0.185, 0.29], [0.175, 0.3]],
    KRAFT_DARK,
    { roughness: 0.7 },
  )
  planta.add(vaso)
  const folhagem = puff(0.24, LEAF, 6, 31, { roughness: 0.9 })
  folhagem.position.y = 0.5
  planta.add(folhagem)
  base.add(planta)

  // tapete de retalhos (trasmatta sueca): retângulo listrado com franjas —
  // claro e com espessura, para não ler como buraco no piso
  const tapete = new THREE.Group()
  tapete.position.set(-0.1, GY, 1.45)
  tapete.rotation.y = 0.06
  const tapeteBase = rbox(1.5, 0.035, 0.7, 0.015, '#d8cdb6', { roughness: 0.95 })
  tapeteBase.position.y = 0.018
  tapete.add(tapeteBase)
  const listras = ['#6f8fa8', '#b9a98a', '#6f8fa8', '#8a9c7a', '#6f8fa8']
  listras.forEach((cor, i) => {
    const listra = rbox(0.1, 0.012, 0.66, 0.005, cor, { roughness: 0.95 })
    listra.position.set(-0.56 + i * 0.28, 0.038, 0)
    tapete.add(listra)
  })
  for (const side of [-1, 1]) {
    for (let k = 0; k < 9; k++) {
      const franja = rbox(0.022, 0.012, 0.09, 0.005, '#cfc3aa', { roughness: 0.95 })
      franja.position.set(side * 0.79, 0.012, -0.29 + k * 0.0725)
      franja.rotation.y = Math.PI / 2
      tapete.add(franja)
    }
  }
  base.add(tapete)
  root.add(base)

  // ---- balcão de madeira clara ---------------------------------------------
  const balcao = new THREE.Group()
  balcao.position.set(0.25, GY, 0.35)

  const tampo = rbox(2.5, 0.14, 0.86, 0.05, WOOD, { roughness: 0.55 })
  tampo.position.y = 0.82
  balcao.add(tampo)

  const frente = rbox(2.4, 0.76, 0.12, 0.03, WOOD_DARK, { roughness: 0.75 })
  frente.position.set(0, 0.38, 0.35)
  balcao.add(frente)

  for (const side of [-1, 1]) {
    const lateral = rbox(0.12, 0.76, 0.78, 0.03, WOOD_DARK, { roughness: 0.75 })
    lateral.position.set(side * 1.16, 0.38, 0)
    balcao.add(lateral)

    const painel = rbox(1.0, 0.42, 0.04, 0.02, WOOD, { roughness: 0.7 })
    painel.position.set(side * 0.56, 0.4, 0.42)
    balcao.add(painel)
  }

  // pilha de copos de papel sobre o tampo
  const cupProfile: [number, number][] = [
    [0, 0], [0.075, 0], [0.088, 0.03], [0.108, 0.2], [0.1, 0.21],
  ]
  for (const [cx, cy] of [[-0.92, 0.89], [-0.92, 0.96]] as const) {
    const copo = lathe(cupProfile, PAPER, { roughness: 0.6 })
    copo.position.set(cx, cy, 0.06)
    balcao.add(copo)
  }
  root.add(balcao)

  // ---- a cabra atendente ----------------------------------------------------
  const cabra = new THREE.Group()
  cabra.position.set(-0.6, GY, -0.85)
  cabra.rotation.y = 0.26 // olha (olhos em +z) para o balcão e para a sacola

  const tronco = capsule(0.33, 0.5, FUR, { roughness: 0.9 })
  tronco.position.y = 0.9
  cabra.add(tronco)

  const garupa = sphere(0.28, FUR, { roughness: 0.9 })
  garupa.position.set(0, 0.62, -0.16)
  garupa.scale.set(0.9, 1, 0.85)
  cabra.add(garupa)

  for (const side of [-1, 1]) {
    const perna = capsule(0.085, 0.24, FUR_WARM, { roughness: 0.9 })
    perna.position.set(side * 0.19, 0.3, -0.02)
    cabra.add(perna)

    const casquinho = cylinder(0.085, 0.1, 0.11, HOOF, { roughness: 0.45 })
    casquinho.position.set(side * 0.19, 0.06, -0.02)
    cabra.add(casquinho)
  }

  // avental de balconista
  const avental = rbox(0.5, 0.66, 0.07, 0.06, APRON, { roughness: 0.92 })
  avental.position.set(0, 0.74, 0.29)
  cabra.add(avental)

  const bolso = rbox(0.24, 0.16, 0.03, 0.02, APRON_DARK, { roughness: 0.92 })
  bolso.position.set(0.09, 0.6, 0.34)
  cabra.add(bolso)

  for (const side of [-1, 1]) {
    const alca = rbox(0.05, 0.34, 0.03, 0.015, APRON, { roughness: 0.92 })
    alca.position.set(side * 0.16, 1.15, 0.27)
    alca.rotation.x = -0.2
    alca.rotation.z = side * 0.16
    cabra.add(alca)
  }

  // braço esquerdo parado (o direito é a peça do TAC)
  const bracoL = capsule(0.085, 0.4, FUR, { roughness: 0.9 })
  bracoL.position.set(-0.3, 1.12, 0.16)
  bracoL.rotation.x = -0.55
  const maoL = cylinder(0.09, 0.1, 0.12, HOOF, { roughness: 0.45 })
  maoL.position.y = -0.3
  bracoL.add(maoL)
  cabra.add(bracoL)

  // ---- cabeça (telescopa do tronco e berra pro alto) ------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.62, 0.06)
  cabeca.rotation.x = -0.7 // pose final: focinho pro céu, berrando

  const cranio = sphere(0.26, FUR, { roughness: 0.9 })
  cranio.scale.set(0.9, 0.95, 1.05)
  cabeca.add(cranio)

  const focinho = capsule(0.14, 0.14, FUR_WARM, { roughness: 0.9 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.06, 0.24)
  cabeca.add(focinho)

  const boca = sphere(0.085, '#6d3f3a', { roughness: 0.6 })
  boca.position.set(0, -0.13, 0.36)
  boca.scale.set(1, 0.85, 0.6)
  cabeca.add(boca)

  const lingua = sphere(0.05, '#c07d7a', { roughness: 0.65 })
  lingua.position.set(0, -0.16, 0.38)
  lingua.scale.set(1, 0.5, 0.8)
  cabeca.add(lingua)

  for (const side of [-1, 1]) {
    const narina = sphere(0.022, '#3a2f2a', { roughness: 0.5 })
    narina.position.set(side * 0.055, -0.02, 0.42)
    cabeca.add(narina)

    // olhos: esclera achatada + pupila (horizontal, como a de cabra)
    const eye = sphere(0.062, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.165, 0.07, 0.2)
    eye.scale.z = 0.6
    const pupil = sphere(0.032, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.165, 0.07, 0.248)
    pupil.scale.set(1.7, 0.55, 0.7)
    cabeca.add(eye, pupil)

    const orelha = capsule(0.055, 0.16, FUR_WARM, { roughness: 0.9 })
    orelha.position.set(side * 0.26, 0.06, -0.02)
    orelha.rotation.z = -side * 1.15
    orelha.rotation.y = -side * 0.3
    orelha.scale.z = 0.55
    cabeca.add(orelha)
  }
  cabra.add(cabeca)

  // chifres em rosca (crescem da testa; filhos da cabeça)
  const chifres = new THREE.Group()
  chifres.position.set(0, 0.15, -0.04)
  const hornProfile: [number, number][] = [
    [0.02, 0], [0.085, 0.02], [0.072, 0.07], [0.088, 0.09], [0.066, 0.14],
    [0.08, 0.16], [0.058, 0.21], [0.072, 0.23], [0.05, 0.28], [0.062, 0.3],
    [0.04, 0.36], [0.05, 0.38], [0.026, 0.44], [0, 0.52],
  ]
  for (const side of [-1, 1]) {
    const chifre = lathe(hornProfile, HORN, { roughness: 0.55 })
    chifre.position.set(side * 0.12, 0.06, -0.02)
    chifre.rotation.set(-0.62, side * 0.25, -side * 0.3)
    chifres.add(chifre)
  }
  cabeca.add(chifres)

  // barbicha
  const barbicha = new THREE.Group()
  barbicha.position.set(0, -0.24, 0.16)
  barbicha.rotation.x = 0.5
  const pelo = cone(0.075, 0.28, FUR, { roughness: 0.92 })
  pelo.rotation.z = Math.PI
  pelo.position.y = -0.14
  barbicha.add(pelo)
  const pelo2 = cone(0.045, 0.16, FUR_WARM, { roughness: 0.92 })
  pelo2.rotation.set(Math.PI, 0, 0.35)
  pelo2.position.set(0.05, -0.24, 0.02)
  barbicha.add(pelo2)
  cabeca.add(barbicha)

  // ---- o casco que crava no tampo: TAC! -------------------------------------
  const casco = new THREE.Group()
  casco.position.set(0.3, 1.15, 0.18)
  casco.rotation.x = -1.3 // pose final: cravado no balcão

  const antebraco = capsule(0.09, 0.42, FUR, { roughness: 0.9 })
  antebraco.position.y = -0.3
  casco.add(antebraco)

  const ombro = sphere(0.12, FUR, { roughness: 0.9 })
  casco.add(ombro)

  const cascoPreto = cylinder(0.11, 0.14, 0.16, HOOF, { roughness: 0.4 })
  cascoPreto.position.y = -0.72
  casco.add(cascoPreto)

  const fenda = rbox(0.02, 0.03, 0.28, 0.008, '#15181c', { roughness: 0.5 })
  fenda.position.y = -0.8
  casco.add(fenda)
  cabra.add(casco)
  root.add(cabra)

  // ---- sacola kraft aberta sobre o tampo ------------------------------------
  const sacola = new THREE.Group()
  sacola.position.set(1.0, CTOP, 0.28)
  sacola.rotation.y = -0.35

  for (const side of [-1, 1]) {
    const parede = rbox(0.44, 0.4, 0.02, 0.008, KRAFT, { roughness: 0.9 })
    parede.position.set(0, 0.2, side * 0.17)
    sacola.add(parede)

    const flanco = rbox(0.02, 0.4, 0.36, 0.008, KRAFT_DARK, { roughness: 0.9 })
    flanco.position.set(side * 0.22, 0.2, 0)
    sacola.add(flanco)

    const dobra = rbox(0.46, 0.05, 0.05, 0.018, KRAFT_DARK, { roughness: 0.9 })
    dobra.position.set(0, 0.4, side * 0.18)
    dobra.rotation.x = side * 0.28
    sacola.add(dobra)
  }

  const fundo = rbox(0.44, 0.03, 0.36, 0.01, KRAFT_DARK, { roughness: 0.9 })
  fundo.position.y = 0.015
  sacola.add(fundo)

  // alças de papel torcido (metade de baixo do anel fica escondida na sacola)
  for (const side of [-1, 1]) {
    const alcaSacola = torus(0.1, 0.014, KRAFT_DARK, { roughness: 0.85 })
    alcaSacola.position.set(0, 0.41, side * 0.19)
    sacola.add(alcaSacola)
  }
  root.add(sacola)

  // ---- o sanduíche embrulhado (fita vermelha = o acento da cena) ------------
  const sanduiche = new THREE.Group()
  sanduiche.position.set(1.02, 1.46, 0.26)
  sanduiche.rotation.set(0.1, -0.35, 0.22)

  const pacote = rbox(0.34, 0.19, 0.26, 0.05, PAPER, { roughness: 0.8 })
  sanduiche.add(pacote)

  const fitaA = rbox(0.36, 0.05, 0.28, 0.012, RED, { roughness: 0.6 })
  fitaA.position.y = 0.01
  sanduiche.add(fitaA)

  const fitaB = rbox(0.09, 0.21, 0.28, 0.012, RED, { roughness: 0.6 })
  fitaB.position.x = 0.03
  sanduiche.add(fitaB)

  const no = sphere(0.045, RED, { roughness: 0.55 })
  no.position.set(0.03, 0.1, 0)
  sanduiche.add(no)

  for (const side of [-1, 1]) {
    const laco = rbox(0.09, 0.035, 0.05, 0.015, RED, { roughness: 0.6 })
    laco.position.set(0.03 + side * 0.07, 0.11, 0)
    laco.rotation.z = side * 0.5
    sanduiche.add(laco)
  }

  const alface = rbox(0.05, 0.13, 0.22, 0.02, LEAF, { roughness: 0.85 })
  alface.position.set(0.19, 0.01, 0)
  alface.rotation.z = 0.25
  sanduiche.add(alface)
  root.add(sanduiche)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'balcao', group: 'cenario', object: balcao },
    { name: 'cabra', group: 'cabra', object: cabra },
    { name: 'cabeca', group: 'cabra', object: cabeca },
    { name: 'chifres', group: 'cabra', object: chifres },
    { name: 'barbicha', group: 'cabra', object: barbicha },
    { name: 'sacola', group: 'sacola', object: sacola },
    { name: 'sanduiche', group: 'sacola', object: sanduiche },
    { name: 'casco', group: 'tac', object: casco },
  ]

  // ---- montagem --------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 1.2)], {
      ease: 'easeOut',
      caption: 'Numa lanchonete sueca brota o piso quadriculado creme…',
    }),
    seq('balcao-rise', 'balcao', 0.25, 0.85, [riseFrom(GY, 1.5)], { ease: 'easeOut' }),

    seq('cabra-rise', 'cabra', 1.9, 0.85, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: '…e quem atende é uma CABRA de avental, que não sabe falar.',
    }),
    seq('cabeca-pop', 'cabeca', 2.1, 0.7, [ch('position.y', 0.95, 1.62)], { ease: 'easeOut' }),
    seq(
      'chifres-grow',
      'chifres',
      2.3,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'barbicha-grow',
      'barbicha',
      2.45,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('cabeca-berro', 'cabeca', 4.3, 0.6, [ch('rotation.x', -0.05, -0.7)], {
      caption: 'Você pede pra viagem e ela só berra pro alto: "TÁ! MÊÊÊ!"',
    }),
    seq('cabra-pulo', 'cabra', 4.45, 0.28, [ch('position.y', GY, GY + 0.08)], { ease: 'easeOut' }),
    seq('cabra-pousa', 'cabra', 4.73, 0.32, [ch('position.y', GY + 0.08, GY)], { ease: 'easeIn' }),

    seq(
      'sacola-grow',
      'sacola',
      5.9,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'No tampo desdobra-se a SACOLA kraft: é para levar junto (ta MED)…',
      },
    ),
    seq(
      'sanduiche-cuspe',
      'sanduiche',
      6.8,
      0.55,
      [
        ch('position.x', -0.5, 0.4),
        ch('position.y', 1.95, 2.3),
        ch('position.z', -0.5, -0.05),
        ch('rotation.z', 0, 1.3),
        ch('scale.x', 0.01, 1),
        ch('scale.y', 0.01, 1),
        ch('scale.z', 0.01, 1),
      ],
      {
        ease: 'easeOut',
        caption: '…ela engole seu sanduíche e CUSPE ele já embrulhadinho, com fita vermelha…',
      },
    ),
    seq(
      'sanduiche-cai',
      'sanduiche',
      7.35,
      0.45,
      [
        ch('position.x', 0.4, 1.02),
        ch('position.y', 2.3, 1.46),
        ch('position.z', -0.05, 0.26),
        ch('rotation.z', 1.3, 0.22),
      ],
      { ease: 'easeIn' },
    ),

    seq(
      'casco-arma',
      'casco',
      8.7,
      0.7,
      [
        ch('rotation.x', 0, -0.85),
        ch('scale.x', 0.01, 1),
        ch('scale.y', 0.01, 1),
        ch('scale.z', 0.01, 1),
      ],
      { ease: 'easeOut', caption: 'Aí ela ergue a pata preta e crava o CASCO no balcão…' },
    ),
    seq('casco-bate', 'casco', 9.85, 0.35, [ch('rotation.x', -0.85, -1.3)], { ease: 'easeIn' }),
    seq('balcao-tranco', 'balcao', 10.22, 0.14, [ch('position.y', GY, GY - 0.05)], {
      caption: '…TAC! (tack = "por favor / obrigado")',
    }),
    seq('balcao-assenta', 'balcao', 10.36, 0.3, [ch('position.y', GY - 0.05, GY)], {
      ease: 'easeOut',
    }),
    seq('casco-repica', 'casco', 10.22, 0.2, [ch('rotation.x', -1.3, -1.15)], { ease: 'easeOut' }),
    seq('casco-assenta', 'casco', 10.42, 0.3, [ch('rotation.x', -1.15, -1.3)], { ease: 'easeIn' }),

    seq('cabeca-final', 'cabeca', 11.0, 0.45, [ch('rotation.x', -0.7, -0.6)], {
      caption: 'Ta med, tack. — "Para viagem, por favor."',
    }),
    seq('cabeca-repousa', 'cabeca', 11.45, 0.55, [ch('rotation.x', -0.6, -0.7)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 4.0, 3.7], target: [0.25, 1.3, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'ta-med-tack',
    contexto:
      "Resposta à pergunta padrão do balcão: 'Här eller ta med?'. Para comer no local: 'Här, tack.'",
    fraseFonte: 'Para viagem, por favor.',
    fraseAlvo: 'Ta med, tack.',
    pronuncia: "ta MÊ, tak (Ê fechado e longo, como em 'você'; o 'd' de 'med' praticamente não soa)",
    ponteSonora:
      '"Ta med, tack" ~ "TÁ, MÊÊ! TAC!" (o berro é de Ê FECHADO, boca quase sorrindo — com É aberto vira \'mä\') — a CABRA de avental berra "TÁ! MÊÊÊ!" e crava o casco no balcão: TAC!',
    historia:
      'Você pede pra viagem e quem atende é uma cabra de avental que não sabe falar, só berrar: "TÁ! MÊÊÊ!". Ela engole seu sanduíche inteiro, cospe ele já embrulhadinho dentro da sacola de papel e crava o casco no balcão: TAC!',
  },
  createScene,
  refine: { organic: ['cabeca'] }, // 'cabra' fundia o avental no pelo (manchas)
}

export default card
