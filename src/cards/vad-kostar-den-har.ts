import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, lathe, torus, person,
} from '../rig/helpers'

/**
 * "Vad kostar den här?" — VÁ! (vad) você aponta o vaso azul; o vendedor-robô
 * te dá as CÓS-TAS (kostar), que são um caixa eletrônico; da fenda salta um
 * DENte de ouro gigante rosnando "RRÉÉR" (den här) com o preço no esmalte.
 *
 * Diorama: loja de souvenirs — piso de madeira escura, pedestal creme com o
 * vaso azul-cobalto à direita, robô de costas à esquerda, fenda preta nas
 * costas e o dente dourado telescopando dela em direção ao espectador.
 */

const WOOD_DARK = '#4a3323'
const WOOD_MID = '#65472f'
const CREME = '#ded2b8'
const CREME_DEEP = '#c4b596'
const BOT = '#78838f'
const BOT_LIGHT = '#9aa5b0'
const BOT_DARK = '#49525c'
const SLOT = '#141719'
const COBALT = '#2f4c9c'
const COBALT_LIGHT = '#4f6fc0'
const GOLD = '#f2b32c' // acento saturado reservado: o DENTE
const ENGRAVED = '#2a2118'

const GY = 0.18 // topo do piso do diorama
const PED_X = 0.8
const PED_Z = 0.15
const PED_TOP = GY + 0.98 // superfície do pedestal
const BOT_Y = 0.44 // altura das pernas do robô
const SLOT_Y = BOT_Y + 0.33 // altura da fenda nas costas
const DENTE_X = 0.42 // para o lado de fora (esquerda na tela)
const DENTE_Y = SLOT_Y + 0.36 // dente de pé, acima e ao lado da boca da fenda
const DENTE_TILT = -0.35 // rotation.z da pose final

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: piso de loja ---------------------------------------
  const base = new THREE.Group()

  const floor = cylinder(2.48, 2.56, 0.12, WOOD_DARK, { roughness: 0.75 })
  floor.position.y = 0.06
  base.add(floor)

  const planks = cylinder(2.42, 2.48, 0.06, WOOD_MID, { roughness: 0.72 })
  planks.position.y = 0.15
  base.add(planks)

  // tapete sob o expositor
  const rug = cylinder(0.72, 0.76, 0.03, '#8f4a38', { roughness: 0.92 })
  rug.position.set(PED_X, GY + 0.015, PED_Z)
  base.add(rug)

  const rugRing = cylinder(0.6, 0.62, 0.012, '#a8624a', { roughness: 0.92 })
  rugRing.position.set(PED_X, GY + 0.035, PED_Z)
  base.add(rugRing)

  // adereços de loja espalhados com rng fixo
  const crate = rbox(0.46, 0.4, 0.46, 0.04, WOOD_MID, { roughness: 0.78 })
  crate.position.set(1.85, GY + 0.2, -1.0)
  crate.rotation.y = (rand() - 0.5) * 0.7
  base.add(crate)

  const crateBand = rbox(0.48, 0.06, 0.48, 0.02, CREME_DEEP, { roughness: 0.8 })
  crateBand.position.y = 0.05
  crate.add(crateBand)

  const souvenir = sphere(0.14, COBALT_LIGHT, { roughness: 0.18 })
  souvenir.position.set(1.85, GY + 0.53, -1.0)
  base.add(souvenir)

  const potStand = cylinder(0.26, 0.3, 0.08, WOOD_DARK, { roughness: 0.8 })
  potStand.position.set(-1.95, GY + 0.04, 0.95)
  base.add(potStand)

  const smallPot = lathe(
    [[0, 0], [0.15, 0], [0.19, 0.1], [0.15, 0.24], [0.11, 0.3], [0.13, 0.34], [0.12, 0.36]],
    '#7d5a48',
    { roughness: 0.35 },
  )
  smallPot.position.set(-1.95, GY + 0.08, 0.95)
  smallPot.rotation.y = rand() * Math.PI
  base.add(smallPot)

  const stool = cylinder(0.2, 0.24, 0.34, CREME_DEEP, { roughness: 0.6 })
  stool.position.set(-0.35, GY + 0.17, -1.85)
  base.add(stool)

  root.add(base)

  // ---- pedestal expositor creme --------------------------------------------
  const pedestal = new THREE.Group()
  pedestal.position.set(PED_X, GY, PED_Z)

  const pedFoot = rbox(0.76, 0.14, 0.76, 0.05, CREME_DEEP, { roughness: 0.55 })
  pedFoot.position.y = 0.07
  pedestal.add(pedFoot)

  const pedColumn = cylinder(0.3, 0.34, 0.72, CREME, { roughness: 0.5 })
  pedColumn.position.y = 0.5
  pedestal.add(pedColumn)

  const pedTop = rbox(0.86, 0.12, 0.86, 0.04, CREME, { roughness: 0.5 })
  pedTop.position.y = 0.92
  pedestal.add(pedTop)

  // etiqueta em branco, virada para a câmera: nada tem preço
  const tag = rbox(0.2, 0.13, 0.02, 0.015, '#f0ece0', { roughness: 0.7 })
  tag.position.set(0.24, 0.94, 0.44)
  tag.rotation.set(-0.5, 0.2, 0.08)
  pedestal.add(tag)

  root.add(pedestal)

  // ---- vaso azul-cobalto (telescopa de dentro do pedestal) -----------------
  const vaso = new THREE.Group()
  vaso.position.set(PED_X, PED_TOP, PED_Z)

  const vasoBody = lathe(
    [
      [0, 0], [0.17, 0], [0.2, 0.06], [0.26, 0.2], [0.25, 0.33],
      [0.16, 0.45], [0.13, 0.52], [0.16, 0.57], [0.148, 0.6],
    ],
    COBALT,
    { roughness: 0.14 },
  )
  vaso.add(vasoBody)

  const vasoBand = torus(0.235, 0.022, COBALT_LIGHT, { roughness: 0.16 })
  vasoBand.rotation.x = Math.PI / 2
  vasoBand.position.y = 0.26
  vaso.add(vasoBand)

  const vasoLip = torus(0.15, 0.024, COBALT_LIGHT, { roughness: 0.16 })
  vasoLip.rotation.x = Math.PI / 2
  vasoLip.position.y = 0.59
  vaso.add(vasoLip)

  root.add(vaso)

  // ---- robô vendedor, de costas para você ----------------------------------
  const robo = new THREE.Group()
  robo.position.set(-0.7, GY, -0.05)
  robo.rotation.y = Math.PI + 0.23 // costas (o caixa eletrônico) de frente pra câmera

  const bot = person({ body: BOT, skin: BOT_LIGHT, height: 1.15, armAngle: 0.45 })
  bot.position.y = BOT_Y
  robo.add(bot)

  // pernas e pés (person() entrega só tronco, cabeça e braços)
  for (const side of [-1, 1]) {
    const leg = capsule(0.085, 0.28, BOT_DARK, { roughness: 0.45 })
    leg.position.set(side * 0.13, 0.28, 0)
    robo.add(leg)

    const knee = sphere(0.075, BOT_LIGHT, { roughness: 0.3, metalness: 0.55 })
    knee.position.set(side * 0.13, 0.3, 0)
    robo.add(knee)

    const foot = rbox(0.2, 0.1, 0.32, 0.04, BOT_DARK, { roughness: 0.5 })
    foot.position.set(side * 0.13, 0.05, 0.05)
    robo.add(foot)
  }

  // quadril e ombreiras de chapa
  const hip = rbox(0.42, 0.16, 0.3, 0.06, BOT_DARK, { roughness: 0.4, metalness: 0.55 })
  hip.position.y = 0.46
  robo.add(hip)

  for (const side of [-1, 1]) {
    const pauldron = sphere(0.13, BOT_DARK, { roughness: 0.35, metalness: 0.6 })
    pauldron.position.set(side * 0.22, BOT_Y + 0.52, 0)
    pauldron.scale.set(1, 0.72, 1)
    robo.add(pauldron)
  }

  // braço esquerdo (mundo: lado do vaso) erguido, apresentando a peça
  const armL = bot.getObjectByName('armL')
  if (armL) armL.rotation.set(0.15, 0, -1.95)

  root.add(robo)

  // ---- cabeça: telescopa do tronco e depois vira por cima do ombro ---------
  const cabeca = bot.getObjectByName('head') as THREE.Group
  const HEAD_R = 1.15 * 0.19
  const HEAD_Y = 1.15 * 0.52 + HEAD_R * 0.85
  const HEAD_TURN = -1.22 // pose final: olhando por cima do ombro, para o vaso
  cabeca.rotation.y = HEAD_TURN

  const visor = rbox(HEAD_R * 1.5, HEAD_R * 0.5, 0.05, 0.02, SLOT, { roughness: 0.2 })
  visor.position.set(0, HEAD_R * 0.12, HEAD_R * 0.78)
  cabeca.add(visor)

  for (const side of [-1, 1]) {
    const earDisc = cylinder(HEAD_R * 0.34, HEAD_R * 0.34, 0.05, BOT_DARK, { roughness: 0.3, metalness: 0.6 })
    earDisc.rotation.z = Math.PI / 2
    earDisc.position.set(side * HEAD_R * 0.96, 0, 0)
    cabeca.add(earDisc)
  }

  // ---- antena com bolinha âmbar (brota de dentro do crânio) ----------------
  const antena = new THREE.Group()
  antena.position.y = 0.19

  const haste = cylinder(0.014, 0.018, 0.28, BOT_DARK, { roughness: 0.3, metalness: 0.6 })
  haste.position.y = 0.14
  antena.add(haste)

  const bulbo = sphere(0.055, '#e2892b', { roughness: 0.3, emissive: '#ff9d1c', emissiveIntensity: 1.1 })
  bulbo.position.y = 0.33
  antena.add(bulbo)

  cabeca.add(antena)

  // ---- fenda de caixa eletrônico nas costas --------------------------------
  const fenda = new THREE.Group()
  fenda.position.set(0, SLOT_Y, -0.185)

  const bezel = rbox(0.34, 0.44, 0.07, 0.03, BOT_DARK, { roughness: 0.35, metalness: 0.6 })
  fenda.add(bezel)

  const mouth = rbox(0.26, 0.07, 0.06, 0.02, SLOT, { roughness: 0.2 })
  mouth.position.set(0, 0.06, -0.03)
  fenda.add(mouth)

  const screen = rbox(0.22, 0.11, 0.03, 0.015, '#1c3a2a', {
    roughness: 0.2, emissive: '#2f7d4f', emissiveIntensity: 0.9,
  })
  screen.position.set(0, 0.17, -0.04)
  fenda.add(screen)

  for (let i = 0; i < 6; i++) {
    const key = rbox(0.055, 0.045, 0.02, 0.008, CREME_DEEP, { roughness: 0.5 })
    key.position.set((i % 3) * 0.075 - 0.075, -0.07 - Math.floor(i / 3) * 0.06, -0.035)
    fenda.add(key)
  }

  robo.add(fenda)

  // ---- o DENTE de ouro gigante (salta da fenda, de pé, de perfil) ---------
  // Molar inteiro visível: coroa com cúspides em cima, raízes de marfim
  // embaixo mergulhando na boca da fenda. O preço fica na face voltada pra
  // câmera (de frente, legível) — antes a coroa vinha de topo e lia como caixa.
  const dente = new THREE.Group()
  // salta da fenda para o lado (não tampa o caixa eletrônico), raízes
  // apontando de volta para a boca da fenda
  dente.position.set(DENTE_X, DENTE_Y, -0.45)
  dente.rotation.set(-0.3, 0, DENTE_TILT)

  const crown = rbox(0.56, 0.34, 0.42, 0.09, GOLD, { roughness: 0.2, metalness: 0.9 })
  crown.position.y = 0.17
  dente.add(crown)

  // quatro cúspides arredondadas: o contorno de molar
  for (const cx of [-1, 1]) {
    for (const cz of [-1, 1]) {
      const cusp = sphere(0.12, GOLD, { roughness: 0.2, metalness: 0.9 })
      cusp.position.set(cx * 0.13, 0.32, cz * 0.1)
      cusp.scale.y = 0.75
      dente.add(cusp)
    }
  }

  const neck = cylinder(0.2, 0.22, 0.09, '#d99f24', { roughness: 0.25, metalness: 0.85 })
  neck.position.y = -0.02
  dente.add(neck)

  for (const side of [-1, 1]) {
    const rootFang = capsule(0.075, 0.24, '#e8dcc0', { roughness: 0.3 })
    rootFang.position.set(side * 0.11, -0.22, 0)
    rootFang.rotation.z = side * 0.2
    rootFang.scale.set(1, 1, 0.85)
    dente.add(rootFang)
  }

  robo.add(dente)

  // ---- o preço gravado no esmalte ------------------------------------------
  const preco = new THREE.Group()
  preco.position.set(0, 0.16, -0.212)
  preco.rotation.y = Math.PI // na face da coroa voltada pra câmera, de pé

  /** Traço gravado: barra fina escura no plano xy do grupo. */
  function bar(x: number, y: number, w: number, h: number, rot = 0) {
    const b = rbox(w, h, 0.02, 0.007, ENGRAVED, { roughness: 0.55 })
    b.position.set(x, y, 0.005)
    b.rotation.z = rot
    preco.add(b)
  }

  /** Dígito de sete segmentos, gravado. */
  function digit(cx: number, on: string) {
    const w = 0.065
    const h = 0.15
    const t = 0.02
    if (on.includes('a')) bar(cx, h / 2, w, t)
    if (on.includes('g')) bar(cx, 0, w, t)
    if (on.includes('d')) bar(cx, -h / 2, w, t)
    if (on.includes('f')) bar(cx - w / 2, h / 4, t, h / 2)
    if (on.includes('b')) bar(cx + w / 2, h / 4, t, h / 2)
    if (on.includes('e')) bar(cx - w / 2, -h / 4, t, h / 2)
    if (on.includes('c')) bar(cx + w / 2, -h / 4, t, h / 2)
  }

  digit(-0.17, 'bc') // 1
  digit(-0.07, 'abcdfg') // 9
  digit(0.03, 'abcdfg') // 9

  // "kr" minúsculo à direita: k (haste + duas diagonais) e r (haste + braço)
  bar(0.09, 0, 0.018, 0.14)
  bar(0.113, 0.022, 0.06, 0.017, 0.85)
  bar(0.113, -0.04, 0.06, 0.017, -0.85)
  bar(0.155, -0.03, 0.018, 0.085)
  bar(0.172, 0.0, 0.04, 0.017, 0.45)

  dente.add(preco)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'loja', object: base },
    { name: 'pedestal', group: 'expositor', object: pedestal },
    { name: 'vaso', group: 'expositor', object: vaso },
    { name: 'robo', group: 'robo', object: robo },
    { name: 'cabeca', group: 'robo', object: cabeca },
    { name: 'antena', group: 'robo', object: antena },
    { name: 'fenda', group: 'caixa', object: fenda },
    { name: 'dente', group: 'dente', object: dente },
    { name: 'preco', group: 'dente', object: preco },
  ]

  const grow = (from = 0.01) => [
    ch('scale.x', from, 1),
    ch('scale.y', from, 1),
    ch('scale.z', from, 1),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      caption: 'Loja de souvenirs: sobe o piso de madeira escura — e nada, nada tem etiqueta.',
    }),

    seq('pedestal-rise', 'pedestal', 1.8, 0.8, [riseFrom(GY, 1.35)], {
      caption: 'VÁ! Você aponta o vaso azul no pedestal creme: quer esse, e só esse.',
    }),
    seq('vaso-rise', 'vaso', 2.0, 0.75, [ch('position.y', PED_TOP - 0.68, PED_TOP)]),

    seq('robo-rise', 'robo', 3.7, 0.85, [riseFrom(GY, 1.95)], {
      caption: 'Chega o vendedor-robô — e o que ele te dá são as CÓS-TAS (kostar)…',
    }),
    seq('cabeca-pop', 'cabeca', 3.9, 0.6, [ch('position.y', 0.3, HEAD_Y)]),
    seq('antena-pop', 'antena', 4.15, 0.55, [ch('position.y', -0.3, 0.19)]),

    seq('fenda-open', 'fenda', 5.6, 0.7, grow(), {
      caption: '…e as CÓS-TAS dele são um caixa eletrônico: abre-se uma fenda preta.',
    }),
    seq('cabeca-turn', 'cabeca', 6.2, 0.7, [ch('rotation.y', 0, HEAD_TURN)]),

    seq(
      'dente-out',
      'dente',
      7.5,
      0.85,
      [
        ch('position.x', 0, DENTE_X),
        ch('position.y', SLOT_Y + 0.06, DENTE_Y),
        ch('position.z', 0.02, -0.45),
        ...grow(0.15),
      ],
      {
        caption: 'Da fenda salta um DENte de ouro gigante, rosnando raspado: "RRÉÉR!" (den här)',
      },
    ),
    seq('preco-pop', 'preco', 8.6, 0.6, grow(), {
      caption: 'No esmalte, gravado, o preço que faltava na etiqueta: 199 kr.',
    }),

    seq('dente-growl-a', 'dente', 9.4, 0.35, [ch('rotation.z', DENTE_TILT, DENTE_TILT + 0.16)]),
    seq('dente-growl-b', 'dente', 9.75, 0.35, [ch('rotation.z', DENTE_TILT + 0.16, DENTE_TILT - 0.13)]),
    seq('dente-settle', 'dente', 10.1, 0.6, [ch('rotation.z', DENTE_TILT - 0.13, DENTE_TILT)], {
      caption: 'Vad kostar den här? — "Quanto custa esse aqui?"',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.15, 4.15], target: [0.0, 1.1, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-kostar-den-har',
    contexto:
      'Loja, feira, second hand, qualquer prateleira sem etiqueta — apontando para o objeto.',
    fraseFonte: 'Quanto custa esse aqui?',
    fraseAlvo: 'Vad kostar den här?',
    pronuncia: "va KÓS-tar den hér (o 'd' de 'vad' some; 'är' é 'é' bem aberto)",
    ponteSonora:
      'VÁ! CÓS-TAR... DEN RRÉR? (CÓS-TAR com R final audível; DEN curto como o começo de DENTE; RRÉR raspado, É bem aberto)',
    historia:
      'Na loja de souvenirs nada tem etiqueta. Você aponta o vaso azul e o vendedor-robô te dá as CÓSTAS — que são um caixa eletrônico. Da fenda sai um DENte de ouro gigante rosnando raspado "RRÉÉR", com o preço gravado no esmalte.',
  },
  createScene,
}

export default card
