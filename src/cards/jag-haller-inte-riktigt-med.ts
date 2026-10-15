import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag håller inte riktigt med." — na mesa de reunião, o TEXUGO de gravata-
 * borboleta calça os RRÔLER (håller), desliza um palmo pra trás fazendo
 * ÍNTE-RÍKTIT com as rodinhas e ergue uma plaquinha minúscula com um MÊ (med).
 *
 * Diorama: tampo oval de madeira clara é o chão da cena; faixa de tapete
 * azul-petróleo cruza a mesa; o texugo desliza da direita para a esquerda
 * deixando fumacinha de roda no rastro.
 */

const WOOD = '#c8945c'
const WOOD_DARK = '#8f6134'
const PAPER = '#f3efe4'
const BLUE = '#1c5b68' // tapete: matiz frio
const GRAY = '#9aa1a6' // pelo do texugo
const GRAY_DARK = '#767d83'
const WHITE = '#f2eee6' // cabeça
const BLACK = '#232323' // faixas dos olhos
const CREAM = '#ded3bd' // garras de cavar
const WINE = '#8f3b31' // gravata-borboleta
const ACCENT = '#e2542f' // acento reservado: os PATINS (RRÔLER)

const TY = 0.17 // topo do tampo da mesa
const TEX_Y = 0.206 // o texugo roda em cima do tapete

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: o tampo oval da mesa de reunião ---------------------
  const mesa = new THREE.Group()

  const tampo = lathe(
    [[0, 0], [1.78, 0], [1.9, 0.05], [1.86, 0.13], [1.68, 0.17], [0, 0.17]],
    WOOD,
    { roughness: 0.7 },
  )
  tampo.scale.z = 0.76 // oval
  mesa.add(tampo)

  const aro = cylinder(1.6, 1.48, 0.06, WOOD_DARK, { roughness: 0.75 })
  aro.scale.z = 0.76
  aro.position.y = 0.02
  mesa.add(aro)

  // adereços de reunião, espalhados com rng fixo
  for (const [cx, cz] of [[-1.3, 0.62], [1.12, -0.62]] as const) {
    const pires = cylinder(0.17, 0.16, 0.018, PAPER, { roughness: 0.15 })
    pires.position.set(cx, TY + 0.009, cz)
    pires.rotation.y = rand() * Math.PI
    mesa.add(pires)

    const xicara = lathe(
      [[0, 0], [0.085, 0], [0.095, 0.02], [0.1, 0.13], [0.088, 0.13], [0.082, 0.025], [0, 0.025]],
      PAPER,
      { roughness: 0.15 },
    )
    xicara.position.set(cx, TY + 0.018, cz)
    xicara.rotation.y = rand() * Math.PI
    mesa.add(xicara)

    const cafe = cylinder(0.082, 0.082, 0.012, '#4a3122', { roughness: 0.25 })
    cafe.position.set(cx, TY + 0.12, cz)
    mesa.add(cafe)
  }

  for (const [px, pz, tint] of [[-0.8, -0.82, PAPER], [-0.73, -0.72, '#e9e3d4']] as const) {
    const folhas = rbox(0.44, 0.035, 0.32, 0.01, tint, { roughness: 0.9 })
    folhas.position.set(px, TY + 0.02 + (tint === PAPER ? 0 : 0.035), pz)
    folhas.rotation.y = (rand() - 0.5) * 0.7
    mesa.add(folhas)
  }

  const caneta = cylinder(0.014, 0.011, 0.3, '#2f4552', { roughness: 0.4 })
  caneta.rotation.z = Math.PI / 2
  caneta.rotation.y = (rand() - 0.5) * 1.2
  caneta.position.set(0.85, TY + 0.016, 0.95)
  mesa.add(caneta)

  root.add(mesa)

  // ---- faixa de tapete azul-petróleo (a pista do deslize) ------------------
  const tapete = rbox(2.7, 0.035, 0.82, 0.014, BLUE, { roughness: 0.92 })
  tapete.position.set(-0.05, TY + 0.018, 0.2)
  tapete.rotation.y = 0.05
  root.add(tapete)

  // ---- texugo (olha para o +z local; o grupo gira para encarar a mesa) -----
  const texugo = new THREE.Group()
  texugo.position.set(0.55, TEX_Y, 0.2)
  texugo.rotation.y = 1.22
  texugo.scale.setScalar(1.22) // protagonista: maior que a xícara por boa margem

  // pernas traseiras
  for (const side of [-1, 1]) {
    const coxa = capsule(0.13, 0.14, GRAY, { roughness: 0.9 })
    coxa.position.set(side * 0.2, 0.44, -0.03)
    coxa.rotation.x = 0.18
    texugo.add(coxa)

    const tornozelo = capsule(0.085, 0.08, GRAY_DARK, { roughness: 0.9 })
    tornozelo.position.set(side * 0.2, 0.31, 0.01)
    texugo.add(tornozelo)
  }

  // corpo inclinado pra trás (ele já está caindo pra ré)
  const corpo = capsule(0.3, 0.4, GRAY, { roughness: 0.9 })
  corpo.position.set(0, 0.74, -0.05)
  corpo.rotation.x = -0.28
  texugo.add(corpo)

  const barriga = capsule(0.16, 0.24, '#cfcabf', { roughness: 0.9 })
  barriga.position.set(0, 0.7, 0.17)
  barriga.rotation.x = -0.28
  barriga.scale.z = 0.5
  texugo.add(barriga)

  const cauda = capsule(0.085, 0.16, GRAY_DARK, { roughness: 0.9 })
  cauda.position.set(0, 0.5, -0.34)
  cauda.rotation.x = 0.85
  texugo.add(cauda)

  // braço direito com as garras longas raspando o tampo
  const bracoR = capsule(0.075, 0.2, GRAY, { roughness: 0.9 })
  bracoR.position.set(0.3, 0.82, 0.1)
  bracoR.rotation.set(-0.45, 0, 0.42) // pende ao lado, garras pro tampo
  const pataR = sphere(0.085, GRAY_DARK, { roughness: 0.9 })
  pataR.position.set(0, -0.17, 0.02)
  for (let i = -1; i <= 1; i++) {
    const garra = cone(0.02, 0.14, CREAM, { roughness: 0.45 })
    garra.position.set(i * 0.045, -0.03, 0.07)
    garra.rotation.x = 2.5
    pataR.add(garra)
  }
  bracoR.add(pataR)
  texugo.add(bracoR)

  // cabeça branca com as duas faixas pretas (telescopa de dentro do tronco)
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.16, 0)

  const cranio = sphere(0.25, WHITE, { roughness: 0.85 })
  cranio.scale.set(0.95, 0.92, 1)
  cabeca.add(cranio)

  const focinho = capsule(0.085, 0.11, WHITE, { roughness: 0.85 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.05, 0.26)
  cabeca.add(focinho)

  const nariz = sphere(0.045, '#2a2320', { roughness: 0.3 })
  nariz.position.set(0, -0.035, 0.375)
  cabeca.add(nariz)

  for (const side of [-1, 1]) {
    // faixa preta larga que abraça o crânio do focinho até a orelha
    const faixa = sphere(0.25, BLACK, { roughness: 0.85 })
    faixa.scale.set(0.34, 0.5, 0.95)
    faixa.position.set(side * 0.12, 0.05, 0.05)
    faixa.rotation.set(-0.14, 0, -side * 0.12)
    cabeca.add(faixa)
    const faixaFocinho = capsule(0.05, 0.12, BLACK, { roughness: 0.85 })
    faixaFocinho.rotation.x = Math.PI / 2 + 0.25
    faixaFocinho.position.set(side * 0.06, 0.0, 0.27)
    cabeca.add(faixaFocinho)

    const olho = sphere(0.05, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.12, 0.075, 0.275)
    olho.scale.z = 0.6
    const pupila = sphere(0.025, '#141414', { roughness: 0.2 })
    pupila.position.set(side * 0.12, 0.075, 0.31)
    cabeca.add(olho, pupila)

    const orelha = sphere(0.07, GRAY_DARK, { roughness: 0.9 })
    orelha.position.set(side * 0.185, 0.18, -0.05)
    orelha.scale.z = 0.5
    const interna = sphere(0.04, '#d9b7a8', { roughness: 0.9 })
    interna.position.set(side * 0.185, 0.18, -0.01)
    interna.scale.z = 0.5
    cabeca.add(orelha, interna)
  }
  texugo.add(cabeca)

  // gravata-borboleta (o texugo nunca briga: está de gala)
  const gravata = new THREE.Group()
  gravata.position.set(0, 0.99, 0.21)
  gravata.rotation.x = -0.28
  const no = sphere(0.045, WINE, { roughness: 0.5 })
  gravata.add(no)
  for (const side of [-1, 1]) {
    const laco = cone(0.075, 0.14, WINE, { roughness: 0.5 })
    laco.position.set(side * 0.09, 0, 0)
    laco.rotation.z = -side * Math.PI / 2
    laco.scale.z = 0.65
    gravata.add(laco)
  }
  texugo.add(gravata)

  // ---- os RRÔLER: dois patins com toros pretos -----------------------------
  const patins = new THREE.Group()
  for (const side of [-1, 1]) {
    const skate = new THREE.Group()
    skate.position.set(side * 0.2, 0.185, 0.02)

    const bota = rbox(0.2, 0.16, 0.34, 0.055, '#f4f1ea', { roughness: 0.4 })
    bota.position.y = 0.03
    skate.add(bota)

    const cano = rbox(0.19, 0.15, 0.2, 0.05, '#f4f1ea', { roughness: 0.4 })
    cano.position.set(0, 0.16, -0.06)
    skate.add(cano)

    const fivela = rbox(0.21, 0.045, 0.21, 0.018, ACCENT, { roughness: 0.4 })
    fivela.position.set(0, 0.11, -0.02)
    skate.add(fivela)

    const chassi = rbox(0.09, 0.07, 0.32, 0.025, '#3a3f44', { roughness: 0.3, metalness: 0.6 })
    chassi.position.y = -0.06
    skate.add(chassi)

    for (const dz of [-0.11, 0.11]) {
      const roda = cylinder(0.075, 0.075, 0.055, '#1f1f1f', { roughness: 0.85 })
      roda.rotation.z = Math.PI / 2
      roda.position.set(0, -0.115, dz)
      skate.add(roda)
      for (const hx of [-0.032, 0.032]) {
        const cubo = sphere(0.028, ACCENT, { roughness: 0.35 })
        cubo.position.set(hx, -0.115, dz)
        skate.add(cubo)
      }
    }
    patins.add(skate)
  }
  texugo.add(patins)

  // ---- a plaquinha do MÊ, num braço que ergue como dobradiça ---------------
  const placa = new THREE.Group()
  placa.position.set(-0.28, 0.9, 0.06)
  placa.rotation.z = 0.18

  const bracoL = capsule(0.07, 0.19, GRAY, { roughness: 0.9 })
  bracoL.position.set(0, 0.14, 0.02)
  placa.add(bracoL)

  const pataL = sphere(0.08, GRAY_DARK, { roughness: 0.9 })
  pataL.position.set(0, 0.3, 0.04)
  placa.add(pataL)

  const haste = cylinder(0.014, 0.014, 0.18, '#7a5a34', { roughness: 0.7 })
  haste.position.set(0, 0.42, 0.05)
  placa.add(haste)

  const cartaz = rbox(0.17, 0.12, 0.02, 0.015, '#f5edd9', { roughness: 0.5 })
  cartaz.position.set(0, 0.55, 0.05)
  placa.add(cartaz)

  // o MÊ engolido: do tamanho de um grão de arroz
  const grao = capsule(0.013, 0.02, '#2a2320', { roughness: 0.5 })
  grao.rotation.z = Math.PI / 2
  grao.position.set(0, 0.55, 0.063)
  placa.add(grao)

  texugo.add(placa)
  root.add(texugo)

  // ---- fumacinha das rodinhas (no rastro, do lado de onde ele veio) --------
  const fumaca = new THREE.Group()
  fumaca.position.set(0.62, TEX_Y + 0.09, 0.22)
  const puffs: [number, number, number, number, number][] = [
    [0.13, 0, 0, 0, 31],
    [0.095, 0.3, -0.02, 0.05, 32],
    [0.07, 0.55, 0.01, -0.05, 33],
  ]
  for (const [r, px, py, pz, seed] of puffs) {
    const p = puff(r, '#e2e7e9', 5, seed, { roughness: 0.95 })
    p.position.set(px, py, pz)
    fumaca.add(p)
  }
  root.add(fumaca)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'mesa', group: 'cenario', object: mesa },
    { name: 'tapete', group: 'cenario', object: tapete },
    { name: 'texugo', group: 'texugo', object: texugo },
    { name: 'cabeca', group: 'texugo', object: cabeca },
    { name: 'gravata', group: 'texugo', object: gravata },
    { name: 'patins', group: 'patins', object: patins },
    { name: 'fumaca', group: 'patins', object: fumaca },
    { name: 'placa', group: 'placa', object: placa },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('mesa-rise', 'mesa', 0, 0.8, [riseFrom(0, 1.1)], {
      ease: 'easeOut',
      caption: 'Na reunião, sobe a mesa oval de madeira clara — o chão da cena.',
    }),
    seq('tapete-rise', 'tapete', 0.2, 0.8, [riseFrom(TY + 0.018, 0.7)], { ease: 'easeOut' }),

    seq('texugo-rise', 'texugo', 1.9, 0.8, [riseFrom(TEX_Y, 1.85)], {
      ease: 'easeOut',
      caption: 'Brota o TEXUGO: IÁ (jag) sou eu, e eu nunca brigo…',
    }),
    seq('cabeca-pop', 'cabeca', 2.05, 0.6, [ch('position.y', 0.72, 1.16)], { ease: 'easeOut' }),
    seq(
      'gravata-pop',
      'gravata',
      2.25,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq(
      'patins-grow',
      'patins',
      3.9,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…quando discorda, ele calça os RRÔLER (håller) em cima da mesa.',
      },
    ),

    seq('texugo-slide', 'texugo', 5.5, 0.9, [ch('position.x', 0.55, -0.5)], {
      caption: 'E desliza um palmo pra trás: ÍNTE-RÍKTIT, ÍNTE-RÍKTIT, num fôlego só.',
    }),
    seq(
      'fumaca-pop',
      'fumaca',
      5.7,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'fumaca-espalha',
      'fumaca',
      6.4,
      0.7,
      [ch('scale.x', 1, 1.35), ch('scale.y', 1, 1.2), ch('scale.z', 1, 1.35)],
      { ease: 'easeOut' },
    ),

    seq('placa-ergue', 'placa', 7.5, 0.8, [ch('rotation.z', 2.3, 0.18)], {
      ease: 'easeOut',
      caption: 'Aí ergue a plaquinha minúscula do MÊ (med), do tamanho de um grão de arroz.',
    }),
    seq('placa-assenta', 'placa', 8.5, 0.5, [ch('rotation.z', 0.18, 0.06)]),

    seq('cabeca-acena', 'cabeca', 9.3, 0.45, [ch('rotation.x', 0, -0.2)], {
      caption: 'Jag håller inte riktigt med. — "Não concordo muito, não."',
    }),
    seq('cabeca-volta', 'cabeca', 9.75, 0.55, [ch('rotation.x', -0.2, 0)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.55, 2.1, 4.05], target: [0.05, 0.92, 0.15] },
  }
}

export const card: Card = {
  refine: { organic: ['texugo', 'cabeca'] },
  meta: {
    id: 'jag-haller-inte-riktigt-med',
    contexto: 'Reunião, quando ele discorda mas quer soar colaborativo.',
    fraseFonte: 'Não concordo muito, não.',
    fraseAlvo: 'Jag håller inte riktigt med.',
    pronuncia:
      "iá RÔL-ler ín-te RÍK-tit me ('hålla' com H soprado e ó fechado; 'riktigt' perde o -g: RÍK-tit; 'med' = me)",
    ponteSonora:
      "IÁ RRÔLER ÍNTE-RÍKTIT MÊ (8 sílabas; 'håller' = RRÔLER, o patins roller: RR soprado + Ô FECHADO; emende 'inte riktigt' num fôlego só — ÍNTE-RÍKTIT — pro R sair BRANDO, de 'caro', e não estourar em RR carioca; o -gt vira só T; 'med' = MÊ, sem D)",
    historia:
      'Na reunião, o texugo de gravata-borboleta nunca briga: quando discorda, calça os RRÔLER e desliza um palmo pra trás em cima da mesa, as unhas de cavar raspando o tampo e as rodinhas fazendo ÍNTE-RÍKTIT, ÍNTE-RÍKTIT num fôlego só. Aí ergue uma plaquinha minúscula com um MÊ engolido, do tamanho de um grão de arroz. Discordar em sueco é isso.',
  },
  createScene,
}

export default card
