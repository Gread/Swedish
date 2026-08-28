import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag tycker att det låter bra." — o LOUCO de TERNO (LÔ-TER) aponta o dedo na
 * sua cara ("IÁ! TÜ-QUER?!") e bate na PRÓPRIA TESTA um DIAPASÃO com AT-DÊ
 * gravado no cabo; as pontas do garfo pegam BRÁSA (bra).
 *
 * Diorama: sala de reunião — piso de tacos bege, mesa baixa de madeira mel com
 * a proposta largada em cima, planta no canto. O sujeito de terno cinza-chumbo
 * e cabelo espetado fica à esquerda, virado para o espectador.
 */

const FLOOR = '#c39a6b'
const FLOOR_DARK = '#8a6a45'
const RUG = '#9b8468'
const WOOD_MEL = '#b3763a'
const WOOD_DARK = '#82552a'
const SUIT = '#4b4f59'
const SUIT_DARK = '#3a3e46'
const SHIRT = '#eae4d8'
const TIE = '#a83a2e'
const SKIN = '#e8c39e'
const HAIR = '#f2efe6'
const SILVER = '#ccd2da'
const EMBER = '#ff8b3a' // acento reservado: a BRÁSA nas pontas do diapasão

const GY = 0.18 // topo do piso do diorama
const HAND = new THREE.Vector3(-1.19, 0.86, 0.12) // mão esquerda erguida, em mundo
const FORK_REST = 0.28 // inclinação de repouso do diapasão

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: sala de reunião ------------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.58, 2.66, 0.11, FLOOR_DARK, { roughness: 0.9 })
  slab.position.y = 0.055
  base.add(slab)

  const tacos = cylinder(2.5, 2.58, 0.07, FLOOR, { roughness: 0.72 })
  tacos.position.y = 0.145
  base.add(tacos)

  // tapete sob a mesa
  const rug = cylinder(1.24, 1.28, 0.03, RUG, { roughness: 0.95 })
  rug.position.set(1.1, GY + 0.015, 0.4)
  base.add(rug)

  const rugRing = cylinder(1.28, 1.3, 0.02, '#84704f', { roughness: 0.95 })
  rugRing.position.set(1.1, GY + 0.01, 0.4)
  base.add(rugRing)

  // planta de canto
  const planta = new THREE.Group()
  planta.position.set(-1.94, GY, -1.18)
  const pot = lathe(
    [[0, 0], [0.16, 0], [0.2, 0.06], [0.175, 0.28], [0.2, 0.32], [0.19, 0.35], [0, 0.35]],
    '#a5603f',
    { roughness: 0.6 },
  )
  planta.add(pot)
  const soilTop = cylinder(0.175, 0.175, 0.03, '#4a3628', { roughness: 0.95 })
  soilTop.position.y = 0.34
  planta.add(soilTop)
  for (const [sx, sz, tilt] of [[0.03, 0.02, 0.12], [-0.05, -0.03, -0.16]] as const) {
    const stem = cylinder(0.02, 0.028, 0.3, '#4d6b3c', { roughness: 0.85 })
    stem.position.set(sx, 0.5, sz)
    stem.rotation.z = tilt
    planta.add(stem)
  }
  const folhas = puff(0.25, '#3f6d43', 6, 21, { roughness: 0.9 })
  folhas.position.set(0, 0.68, 0)
  folhas.rotation.y = rand() * Math.PI
  planta.add(folhas)
  base.add(planta)

  // pilha de pastas largada no chão
  const pilha = new THREE.Group()
  pilha.position.set(1.72, GY, -1.28)
  const capas = [
    { color: '#3f4a55', y: 0.035 },
    { color: WOOD_DARK, y: 0.095 },
    { color: '#6b7a8a', y: 0.152 },
  ]
  for (const { color, y } of capas) {
    const livro = rbox(0.34, 0.055, 0.25, 0.015, color, { roughness: 0.7 })
    livro.position.y = y
    livro.rotation.y = (rand() - 0.5) * 0.5
    pilha.add(livro)
  }
  base.add(pilha)
  root.add(base)

  // ---- mesa baixa de madeira mel -------------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(1.22, GY, 0.42)
  mesa.rotation.y = -0.25

  for (const lx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      const perna = cylinder(0.036, 0.046, 0.46, WOOD_DARK, { roughness: 0.7 })
      perna.position.set(lx * 0.42, 0.23, lz * 0.26)
      mesa.add(perna)
    }
  }
  const saia = rbox(0.96, 0.06, 0.58, 0.02, WOOD_DARK, { roughness: 0.75 })
  saia.position.y = 0.44
  mesa.add(saia)

  const tampo = rbox(1.1, 0.09, 0.72, 0.03, WOOD_MEL, { roughness: 0.65 })
  tampo.position.y = 0.505
  mesa.add(tampo)

  // caneca de café esquecida no canto do tampo
  const caneca = lathe(
    [[0, 0], [0.085, 0], [0.09, 0.02], [0.082, 0.15], [0.072, 0.15], [0.076, 0.03], [0, 0.03]],
    '#e6e0d4',
    { roughness: 0.2 },
  )
  caneca.position.set(-0.34, 0.55, 0.14)
  mesa.add(caneca)
  const cafe = cylinder(0.072, 0.072, 0.01, '#43261a', { roughness: 0.3 })
  cafe.position.set(-0.34, 0.68, 0.14)
  mesa.add(cafe)
  root.add(mesa)

  // ---- proposta largada na mesa --------------------------------------------
  const papel = new THREE.Group()
  papel.position.set(1.32, 0.738, 0.51)
  papel.rotation.y = 0.17

  const folha = rbox(0.4, 0.014, 0.3, 0.006, '#efe9dc', { roughness: 0.85 })
  papel.add(folha)
  for (let i = 0; i < 4; i++) {
    const linha = rbox(0.24 - i * 0.03, 0.008, 0.018, 0.004, '#6f6a60', { roughness: 0.8 })
    linha.position.set(-0.04, 0.011, -0.08 + i * 0.055)
    papel.add(linha)
  }
  root.add(papel)

  // ---- o LOUCO DE TERNO ----------------------------------------------------
  const homem = person({ body: SUIT, skin: SKIN, height: 1.55, armAngle: 0.4 })
  homem.position.set(-0.72, GY, -0.05)
  homem.rotation.y = 0.22 // encara o espectador

  const bodyH = 1.55 * 0.52

  const colarinho = rbox(0.17, 0.13, 0.07, 0.03, SHIRT, { roughness: 0.8 })
  colarinho.position.set(0, 0.74, 0.14)
  homem.add(colarinho)

  const noDaGravata = rbox(0.08, 0.075, 0.06, 0.02, TIE, { roughness: 0.6 })
  noDaGravata.position.set(0.015, 0.735, 0.19)
  homem.add(noDaGravata)

  const gravata = rbox(0.095, 0.29, 0.045, 0.018, TIE, { roughness: 0.6 })
  gravata.position.set(0.045, 0.58, 0.215)
  gravata.rotation.z = 0.14 // torta, claro
  homem.add(gravata)

  for (const side of [-1, 1]) {
    const lapela = rbox(0.13, 0.24, 0.04, 0.015, SUIT_DARK, { roughness: 0.75 })
    lapela.position.set(side * 0.1, 0.66, 0.2)
    lapela.rotation.z = side * 0.22
    homem.add(lapela)

    const perna = capsule(0.085, 0.16, SUIT_DARK, { roughness: 0.8 })
    perna.position.set(side * 0.11, 0.11, 0)
    homem.add(perna)

    const sapato = rbox(0.15, 0.08, 0.26, 0.035, '#2c2a28', { roughness: 0.45 })
    sapato.position.set(side * 0.11, 0.04, 0.06)
    homem.add(sapato)
  }
  root.add(homem)

  // braço esquerdo erguido, segurando o diapasão
  const armL = homem.getObjectByName('armL')!
  armL.rotation.set(0.22, 0, -2.35)

  // braço direito: dedo apontado na cara do espectador (dobradiça em rotation.x)
  const bracoAponta = homem.getObjectByName('armR')!
  bracoAponta.rotation.set(-1.45, 0, -0.12)
  const dedo = capsule(0.034, 0.14, SKIN, { roughness: 0.6 })
  dedo.position.y = -bodyH * 0.32 - 0.14
  bracoAponta.add(dedo)
  const unha = sphere(0.032, SKIN, { roughness: 0.5 })
  unha.position.y = -bodyH * 0.32 - 0.22
  bracoAponta.add(unha)

  // cabelo espetado: telescopa de dentro do crânio
  const cabeca = homem.getObjectByName('head')!
  const cabelo = new THREE.Group()
  cabelo.position.y = 0.22
  const espetos: [number, number, number, number][] = [
    [0, 0.14, 0.02, 0],
    [-0.14, 0.11, -0.03, 0.42],
    [0.13, 0.12, -0.05, -0.38],
  ]
  for (const [ex, ey, ez, tilt] of espetos) {
    const espeto = cone(0.076, 0.28, HAIR, { roughness: 0.85 })
    espeto.position.set(ex, ey, ez)
    espeto.rotation.z = tilt
    cabelo.add(espeto)
  }
  cabeca.add(cabelo)

  // sobrancelhas franzidas — ele está julgando você
  for (const side of [-1, 1]) {
    const sobrancelha = rbox(0.11, 0.026, 0.03, 0.01, '#9a9186', { roughness: 0.85 })
    sobrancelha.position.set(side * 0.112, 0.145, 0.245)
    sobrancelha.rotation.z = side * 0.34
    cabeca.add(sobrancelha)
  }

  // ---- o DIAPASÃO com AT-DÊ gravado no cabo --------------------------------
  const diapasao = new THREE.Group()
  diapasao.position.copy(HAND)
  diapasao.rotation.z = FORK_REST

  const pomo = sphere(0.055, SILVER, { roughness: 0.22, metalness: 0.9 })
  pomo.position.y = -0.02
  diapasao.add(pomo)

  const cabo = cylinder(0.042, 0.05, 0.4, SILVER, { roughness: 0.22, metalness: 0.9 })
  cabo.position.y = 0.19
  diapasao.add(cabo)

  // plaqueta gravada "AT-DÊ" (att det) no cabo
  const gravacao = rbox(0.078, 0.16, 0.016, 0.006, '#2b2f36', { roughness: 0.35 })
  gravacao.position.set(0, 0.2, 0.046)
  diapasao.add(gravacao)
  const marcas: [number, number][] = [
    [-0.017, 0.048], [0.017, 0.048], [-0.017, 0.005], [0.017, 0.005],
    [-0.017, -0.042], [0.017, -0.042],
  ]
  for (const [mx, my] of marcas) {
    const letra = rbox(0.024, 0.026, 0.008, 0.003, '#efe4c9', { roughness: 0.4 })
    letra.position.set(mx, 0.2 + my, 0.056)
    diapasao.add(letra)
  }

  const jugo = rbox(0.25, 0.07, 0.07, 0.028, SILVER, { roughness: 0.22, metalness: 0.9 })
  jugo.position.y = 0.42
  diapasao.add(jugo)

  for (const side of [-1, 1]) {
    const haste = cylinder(0.032, 0.037, 0.46, SILVER, { roughness: 0.22, metalness: 0.9 })
    haste.position.set(side * 0.105, 0.65, 0)
    diapasao.add(haste)
    const ponta = sphere(0.034, SILVER, { roughness: 0.22, metalness: 0.9 })
    ponta.position.set(side * 0.105, 0.88, 0)
    diapasao.add(ponta)
  }

  // ---- BRÁSA nas duas pontas ----------------------------------------------
  const brasas = new THREE.Group()
  brasas.position.y = 0.9
  for (const side of [-1, 1]) {
    const brasa = puff(0.072, EMBER, 5, side < 0 ? 31 : 32, {
      emissive: '#ff4d0f',
      emissiveIntensity: 1.3,
      roughness: 0.45,
    })
    brasa.position.x = side * 0.105
    brasas.add(brasa)
  }
  diapasao.add(brasas)
  root.add(diapasao)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'mesa', group: 'cenario', object: mesa },
    { name: 'papel', group: 'proposta', object: papel },
    { name: 'homem', group: 'louco', object: homem },
    { name: 'bracoAponta', group: 'louco', object: bracoAponta },
    { name: 'cabelo', group: 'louco', object: cabelo },
    { name: 'diapasao', group: 'diapasao', object: diapasao },
    { name: 'brasas', group: 'brasa', object: brasas },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 1.1)], {
      ease: 'easeOut',
      caption: 'Sala de reunião: o piso de tacos brota do chão…',
    }),
    seq('mesa-rise', 'mesa', 1.5, 0.7, [riseFrom(GY, 1.1)], { ease: 'easeOut' }),

    // a proposta desliza para fora do tampo (telescopa da mesa)
    seq('papel-slide', 'papel', 2.9, 0.6, [ch('position.y', 0.66, 0.738)], {
      ease: 'easeOut',
      caption: 'Você largou na mesa a proposta: o restaurante das sete…',
    }),

    seq('homem-rise', 'homem', 4.4, 0.8, [riseFrom(GY, 1.95)], {
      ease: 'easeOut',
      caption: '…e quem julga é o LOUCO de TERNO (LÔ-TER), cinza-chumbo e gravata torta…',
    }),
    seq('braco-solto', 'bracoAponta', 4.6, 0.6, [ch('rotation.x', 0.45, 0)], { ease: 'easeOut' }),
    seq('cabelo-pop', 'cabelo', 4.65, 0.6, [ch('position.y', -0.15, 0.22)], { ease: 'easeOut' }),

    seq('braco-aponta', 'bracoAponta', 6.1, 0.7, [ch('rotation.x', 0, -1.45)], {
      caption: 'Ele aponta o dedo na sua cara: IÁ! TÜ-QUER?! (TÜ com BICO DE PATO)…',
    }),

    seq('diapasao-rise', 'diapasao', 7.7, 0.8, [riseFrom(HAND.y, 2.1)], {
      ease: 'easeOut',
      caption: '…e ergue na outra mão um DIAPASÃO com AT-DÊ gravado no cabo…',
    }),

    seq(
      'diapasao-golpe',
      'diapasao',
      9.2,
      0.45,
      [ch('rotation.z', FORK_REST, -0.62), ch('position.x', HAND.x, -1.02)],
      {
        ease: 'easeIn',
        caption: '…e bate o garfo na PRÓPRIA TESTA — LÔ-TER BRÁ, a nota sai perfeita…',
      },
    ),
    seq('homem-tranco', 'homem', 9.45, 0.25, [ch('rotation.x', 0, -0.11)], { ease: 'easeOut' }),
    seq('homem-volta', 'homem', 9.7, 0.5, [ch('rotation.x', -0.11, 0)]),
    seq(
      'diapasao-recuo',
      'diapasao',
      9.65,
      0.5,
      [ch('rotation.z', -0.62, 0.36), ch('position.x', -1.02, HAND.x)],
      { ease: 'easeOut' },
    ),

    seq(
      'brasas-acendem',
      'brasas',
      10.3,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'As duas pontas pegam BRÁSA: Jag tycker att det låter bra.',
      },
    ),
    seq('diapasao-vibra', 'diapasao', 10.6, 0.45, [ch('rotation.z', 0.36, 0.2)]),
    seq('diapasao-assenta', 'diapasao', 11.05, 0.5, [ch('rotation.z', 0.2, FORK_REST)], {
      ease: 'easeOut',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 3.0, 6.3], target: [0.05, 1.05, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-tycker-att-det-later-bra',
    contexto:
      'Alguém propõe um plano, um horário, um restaurante — e ele opina em vez de só assentir com a cabeça.',
    fraseFonte: 'Por mim tudo bem. / Acho que soa bem.',
    fraseAlvo: 'Jag tycker att det låter bra.',
    pronuncia:
      "iá TÜ-ker at de LÔ-ter bra ('tycker' com ü de lábios arredondados; 'låter' com å = ô)",
    ponteSonora:
      "IÁ! TÜ-quer AT-DÊ... LÔ-TER BRÁ! (8 batidas, força no TÜ e no LÔ; o gancho é o dedo apontado ('TU quer?!'), mas a vogal é o y sueco: TÜ com BICO DE PATO, nunca o U chapado de 'tu', e o 'quer' apagadinho — se sair 'TÉN-ker' você troca de palavra, pois 'tänker' é planejar; LÔ-TER são as primeiras sílabas de LOUCO + TERNO, LÔ com ô FECHADO; BRÁ como o BRÁ de BRASA, com R brando)",
    historia:
      'Você propõe o restaurante das sete e quem julga é o LOUCO DE TERNO da sala de reunião. Ele aponta o dedo na sua cara — IÁ! TÜ QUER?! — e, em vez de responder, bate um DIAPASÃO com AT-DÊ gravado no cabo na própria testa. O garfo solta uma nota tão perfeita que as duas pontas pegam BRÁSA. Se vibra bonito desse jeito, soa bem.',
  },
  createScene,
}

export default card
