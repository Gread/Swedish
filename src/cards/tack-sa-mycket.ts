import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  capsule,
  ch,
  cone,
  cylinder,
  person,
  puff,
  rbox,
  riseFrom,
  rng,
  rock,
  seq,
  sphere,
  torus,
} from '../rig/helpers'

/**
 * tack-sa-mycket — "Tack så mycket!" (Muito obrigado!)
 * Diorama: na calçada da portaria, diante da porta que ele segurou aberta,
 * o SÔ MUQUE (segurança bombado, terno escuro, boné e óculos) flexiona o
 * braço e o MUQUE vermelho gigante cresce. Quem agradece dá um tapa — TAC! —
 * no bíceps, a estrela do impacto estala e o muque estufa de orgulho.
 */

// paleta: cinzas frios (calçada/terno) + madeiras quentes + verde-azulado.
// Acento saturado RESERVADO ao objeto-chave: o MUQUE vermelho.
const PAVE = '#8e95a2'
const PAVE_TILE = '#848b98'
const PLASTER = '#b3a288'
const WOOD_DARK = '#5a4030'
const WOOD_MID = '#8a5a33'
const SUIT = '#262b3a'
const SUIT_DARK = '#1c2130'
const SKIN = '#e8c39e'
const TEAL = '#2e8577'
const LEAF = '#3e7d34'
const GOLD = '#d9a441'
const MUQUE_RED = '#c94f3d'

function createScene(): CardScene {
  const root = new THREE.Group()
  const TOP = 0.16 // topo da base do diorama

  // ------------------------------------------------------------------- base
  // Calçada circular da entrada + ambientação (vasos, pedras, flores)
  const base = new THREE.Group()
  const disco = cylinder(2.55, 2.66, TOP, PAVE, { roughness: 0.92 })
  disco.position.y = TOP / 2
  base.add(disco)

  const scatter = rng(7)
  const j = () => (scatter() - 0.5) * 0.18

  // lajotas sutis no piso
  const tiles: [number, number][] = [
    [-0.9, 1.2],
    [0.35, 1.45],
    [1.5, 0.9],
    [-1.7, 0.1],
  ]
  for (const [tx, tz] of tiles) {
    const tile = rbox(0.72, 0.016, 0.72, 0.005, PAVE_TILE, { roughness: 0.9 })
    tile.position.set(tx + j(), TOP + 0.008, tz + j())
    tile.rotation.y = (scatter() - 0.5) * 0.5
    base.add(tile)
  }

  // dois arbustos em vasos flanqueando a entrada
  for (const [bx, bz, s] of [
    [-2.0, 0.6, 31],
    [1.9, -0.9, 47],
  ] as [number, number, number][]) {
    const vaso = rbox(0.34, 0.26, 0.34, 0.05, '#6e5442', { roughness: 0.8 })
    vaso.position.set(bx, TOP + 0.13, bz)
    const folhagem = puff(0.22, LEAF, 6, s, { roughness: 0.85 })
    folhagem.position.set(bx, TOP + 0.42, bz)
    base.add(vaso, folhagem)
  }

  const pedraA = rock(0.16, '#78808e', 11, { roughness: 0.9 })
  pedraA.position.set(1.2 + j(), TOP + 0.09, -1.55 + j())
  const pedraB = rock(0.11, '#6f7684', 23, { roughness: 0.9 })
  pedraB.position.set(-0.75 + j(), TOP + 0.06, 1.85 + j())
  base.add(pedraA, pedraB)

  for (const [fx, fz] of [
    [-1.4, 1.3],
    [-1.12, 1.52],
  ] as [number, number][]) {
    const talo = cylinder(0.012, 0.016, 0.22, LEAF, { roughness: 0.8 })
    talo.position.set(fx + j(), TOP + 0.11, fz + j())
    const flor = sphere(0.05, '#d98e32', { roughness: 0.5 })
    flor.position.set(talo.position.x, TOP + 0.25, talo.position.z)
    base.add(talo, flor)
  }
  root.add(base)

  // ---------------------------------------------------------------- batente
  // Fachada da portaria: paredes de reboco, batente de madeira, degrau,
  // capacho e a luminária quente sobre a porta
  const batente = new THREE.Group()
  for (const side of [-1, 1]) {
    const parede = rbox(0.62, 2.6, 0.16, 0.05, PLASTER, { roughness: 0.85 })
    parede.position.set(side, 1.3, -0.02)
    batente.add(parede)
  }
  const verga = rbox(2.62, 0.4, 0.16, 0.05, PLASTER, { roughness: 0.85 })
  verga.position.set(0, 2.55, 0)
  const cornija = rbox(2.85, 0.14, 0.26, 0.04, '#8a7a60', { roughness: 0.8 })
  cornija.position.set(0, 2.82, 0.02)
  batente.add(verga, cornija)

  for (const side of [-1, 1]) {
    const montante = rbox(0.15, 2.35, 0.22, 0.05, WOOD_DARK, { roughness: 0.65 })
    montante.position.set(side * 0.62, 1.175, 0.06)
    batente.add(montante)
  }
  const travessa = rbox(1.39, 0.17, 0.22, 0.05, WOOD_DARK, { roughness: 0.65 })
  travessa.position.set(0, 2.43, 0.06)
  const degrau = rbox(1.7, 0.12, 0.62, 0.04, '#7d8492', { roughness: 0.85 })
  degrau.position.set(0, 0.06, 0.5)
  const capacho = rbox(0.95, 0.05, 0.48, 0.02, '#6b5a43', { roughness: 0.95 })
  capacho.position.set(0, 0.14, 0.52)
  batente.add(travessa, degrau, capacho)

  const bracoLampada = cylinder(0.02, 0.02, 0.16, '#23262f', { roughness: 0.5 })
  bracoLampada.rotation.x = Math.PI / 2
  bracoLampada.position.set(0, 2.3, 0.16)
  const cupula = cone(0.11, 0.1, '#23262f', { roughness: 0.5 })
  cupula.position.set(0, 2.3, 0.25)
  const bulbo = sphere(0.055, '#ffd9a0', {
    emissive: '#ffb95e',
    emissiveIntensity: 1.3,
    roughness: 0.4,
  })
  bulbo.position.set(0, 2.22, 0.25)
  batente.add(bracoLampada, cupula, bulbo)

  batente.position.set(-1.55, TOP, -0.85)
  batente.rotation.y = 0.62
  root.add(batente)

  // ------------------------------------------------------------------ folha
  // Folha da porta pivotada na dobradiça do montante esquerdo, entreaberta
  const folha = new THREE.Group()
  const painel = rbox(1.05, 2.28, 0.08, 0.03, WOOD_MID, { roughness: 0.6 })
  painel.position.set(0.545, 1.16, 0)
  const vidro = rbox(0.55, 0.6, 0.06, 0.02, '#a8c8d8', { roughness: 0.18, metalness: 0.1 })
  vidro.position.set(0.545, 1.7, 0.02)
  const almofada = rbox(0.7, 0.52, 0.02, 0.01, '#77492a', { roughness: 0.6 })
  almofada.position.set(0.545, 0.62, 0.045)
  const macaneta = sphere(0.055, GOLD, { metalness: 0.85, roughness: 0.25 })
  macaneta.position.set(0.98, 1.1, 0.07)
  folha.add(painel, vidro, almofada, macaneta)
  folha.position.set(-1.96, TOP, -0.48)
  folha.rotation.y = -0.23 // pose final: entreaberta, aberta para o espectador
  root.add(folha)

  // ------------------------------------------------------------- o SÔ MUQUE
  // Segurança bombado: terno escuro, boné, óculos e crachá dourado
  const guarda = person({ body: SUIT, skin: SKIN, height: 1.6, armAngle: 0.3 })
  guarda.position.set(-0.5, TOP, 0)
  guarda.rotation.y = 0.3 // de frente, exibindo o muque para quem chega
  guarda.getObjectByName('armR')!.visible = false // dá lugar ao braço flexionado

  const cabeca = guarda.getObjectByName('head')!
  cabeca.rotation.y = 0.5 // admira o próprio muque
  cabeca.rotation.z = -0.08
  const copa = cylinder(0.245, 0.29, 0.13, SUIT_DARK, { roughness: 0.8 })
  copa.position.set(0, 0.225, 0)
  const aba = rbox(0.42, 0.035, 0.26, 0.015, '#141824', { roughness: 0.8 })
  aba.position.set(0, 0.175, 0.25)
  const oculos = rbox(0.45, 0.1, 0.06, 0.025, '#10131b', { roughness: 0.22 })
  oculos.position.set(0, 0.04, 0.3)
  cabeca.add(copa, aba, oculos)

  const cracha = cylinder(0.05, 0.05, 0.018, GOLD, { metalness: 0.8, roughness: 0.3 })
  cracha.rotation.x = Math.PI / 2
  cracha.position.set(-0.12, 0.62, 0.25)
  guarda.add(cracha)
  root.add(guarda)

  // ------------------------------------------------------------ braço + muque
  // Braço flexionado (pose 💪) brota do ombro direito: manga arregaçada,
  // braço horizontal, cotovelo, antebraço de pé e punho fechado no alto
  const SKIN_SHADE = '#ddb08a'
  const bracoMuque = new THREE.Group()
  const ombro = sphere(0.17, SUIT, { roughness: 0.8 })
  const manga = cylinder(0.168, 0.16, 0.17, SUIT_DARK, { roughness: 0.8 })
  manga.rotation.z = Math.PI / 2
  manga.position.set(0.11, 0, 0)
  const bainha = torus(0.158, 0.026, SUIT, { roughness: 0.8 })
  bainha.rotation.y = Math.PI / 2
  bainha.position.set(0.2, 0, 0)
  const bracoSup = capsule(0.135, 0.36, SKIN)
  bracoSup.rotation.z = -Math.PI / 2
  bracoSup.position.set(0.36, 0, 0)
  const cotovelo = sphere(0.13, SKIN)
  cotovelo.position.set(0.62, 0.02, 0)
  const antebraco = capsule(0.118, 0.34, SKIN)
  antebraco.rotation.z = 0.08
  antebraco.position.set(0.63, 0.3, 0)
  const punho = sphere(0.155, SKIN)
  punho.scale.set(0.95, 0.9, 1)
  punho.position.set(0.61, 0.6, 0)
  bracoMuque.add(ombro, manga, bainha, bracoSup, cotovelo, antebraco, punho)
  // nós dos dedos voltados para a cabeça + polegar por cima
  for (let i = 0; i < 4; i++) {
    const no = sphere(0.048, SKIN_SHADE, { roughness: 0.6 })
    no.position.set(0.49, 0.5 + i * 0.062, 0.05)
    bracoMuque.add(no)
  }
  const polegar = capsule(0.04, 0.1, SKIN_SHADE, { roughness: 0.6 })
  polegar.rotation.z = Math.PI / 2
  polegar.position.set(0.56, 0.6, 0.13)
  bracoMuque.add(polegar)
  bracoMuque.position.set(-0.2, 0.69, -0.09) // ombro direito do segurança
  bracoMuque.rotation.y = 0.3
  root.add(bracoMuque)

  // O MUQUE — bíceps vermelho gigante, o acento da cena, estufa em cima do braço
  const muque = new THREE.Group()
  const biceps = sphere(0.25, MUQUE_RED, { roughness: 0.42 })
  biceps.scale.set(1.32, 1, 1)
  const pico = sphere(0.15, MUQUE_RED, { roughness: 0.42 })
  pico.position.set(0.04, 0.12, 0)
  const brilho = sphere(0.07, '#f4ddd2', { roughness: 0.25 })
  brilho.scale.set(1.4, 0.5, 0.4)
  brilho.position.set(-0.06, 0.2, 0.17)
  muque.add(biceps, pico, brilho)
  muque.position.set(0.135, 0.84, -0.16)
  muque.rotation.y = 0.3
  root.add(muque)

  // ------------------------------------------------------------ quem agradece
  // De suéter verde-azulado, chega e desfere o tapa de gratidão
  // mais baixo que o segurança: a cabeça dele não tapa o punho erguido
  const FA_H = 1.32
  const fa = person({ body: TEAL, skin: SKIN, height: FA_H, armAngle: 0.3 })
  fa.position.set(0.78, TOP, -0.1)
  fa.rotation.y = -1.57 // encara o muque
  const cabecaFa = fa.getObjectByName('head')!
  cabecaFa.rotation.x = -0.12 // olha para cima, para o bíceps
  const cabelo = puff(0.13, '#3a2a1e', 5, 21, { roughness: 0.9 })
  cabelo.position.set(0, 0.14, -0.05)
  cabecaFa.add(cabelo)

  // pivô no ombro para o braço do tapa girar de verdade
  const bracoTapa = new THREE.Group()
  bracoTapa.position.set(FA_H * 0.17 * 1.15, FA_H * 0.52 * 0.62 + 0.12, 0)
  const bracoFa = fa.getObjectByName('armR')!
  bracoFa.position.set(0, -0.12, 0)
  bracoFa.rotation.z = -0.12
  bracoTapa.add(bracoFa) // re-parenta o braço para dentro do pivô
  bracoTapa.rotation.x = -1.9 // pose final: mão estendida sobre o muque
  fa.add(bracoTapa)
  root.add(fa)

  // ---------------------------------------------------------------- estrela
  // O TAC! — estrela de impacto dourada no ponto do tapa
  const estrela = new THREE.Group()
  const brilhoOpts = { emissive: '#ffb347', emissiveIntensity: 1.05, roughness: 0.35 }
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.26
    const longa = i % 2 === 0
    const raio = cone(longa ? 0.045 : 0.035, longa ? 0.21 : 0.13, '#f2b23a', brilhoOpts)
    raio.rotation.z = a
    const dist = 0.07 + (longa ? 0.105 : 0.065)
    raio.position.set(-Math.sin(a) * dist, Math.cos(a) * dist, 0)
    estrela.add(raio)
  }
  const nucleo = sphere(0.065, '#ffd47a', {
    emissive: '#ffca5e',
    emissiveIntensity: 1.2,
    roughness: 0.3,
  })
  estrela.add(nucleo)
  estrela.position.set(0.44, 0.98, 0.14)
  estrela.rotation.y = 0.3
  root.add(estrela)

  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'batente', group: 'cenario', object: batente },
    { name: 'folha', group: 'cenario', object: folha },
    { name: 'guarda', group: 'seguranca', object: guarda },
    { name: 'bracoMuque', group: 'muque', object: bracoMuque },
    { name: 'muque', group: 'muque', object: muque },
    { name: 'fa', group: 'tapa', object: fa },
    { name: 'bracoTapa', group: 'tapa', object: bracoTapa },
    { name: 'estrela', group: 'tapa', object: estrela },
  ]

  const build = [
    // --- cenário: calçada, fachada e a porta que se entreabre
    seq('base-rise', 'base', 0.0, 0.8, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'Na entrada do prédio, a calçada surge…',
    }),
    seq('batente-rise', 'batente', 0.15, 0.9, [riseFrom(TOP, 3.2)], { ease: 'easeOut' }),
    seq('folha-rise', 'folha', 0.3, 0.85, [riseFrom(TOP, 2.7)], { ease: 'easeOut' }),
    seq('folha-abre', 'folha', 1.3, 0.8, [ch('rotation.y', 0.62, -0.23)], {
      caption: '…e a PORTA que o segurança segurou aberta pra você. Que gentileza!',
    }),

    // --- o SÔ MUQUE brota diante da porta
    seq('guarda-rise', 'guarda', 2.0, 0.95, [riseFrom(TOP, 2.1)], {
      ease: 'easeOut',
      caption: 'É o SÔ MUQUE, o segurança bombado da portaria!',
    }),

    // --- o braço flexiona do ombro e o MUQUE incha sobre ele
    seq(
      'braco-flexiona',
      'bracoMuque',
      3.5,
      0.7,
      [ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'muque-cresce',
      'muque',
      3.7,
      0.85,
      [ch('scale.x', 0.12, 0.85), ch('scale.y', 0.12, 0.85), ch('scale.z', 0.12, 0.85)],
      { ease: 'easeOut', caption: 'No braço, cresce o MUQUE gigante — diga com bico: MÜ-que ("mycket")…' },
    ),

    // --- quem agradece chega, arma o braço e desfere o tapa: TAC!
    seq('fa-rise', 'fa', 5.5, 0.9, [riseFrom(TOP, 1.9)], { ease: 'easeOut' }),
    seq('braco-arma', 'bracoTapa', 5.6, 0.8, [ch('rotation.x', 0, -2.9)]),
    seq('tapa-golpe', 'bracoTapa', 7.0, 0.4, [ch('rotation.x', -2.9, -1.9)], {
      ease: 'easeIn',
      caption: 'Palavras não bastam: TAC! Um tapa sonoro no MUQUE! ("tack")',
    }),
    seq(
      'estrela-pop',
      'estrela',
      7.35,
      0.4,
      [ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'muque-estufa',
      'muque',
      7.9,
      0.7,
      [ch('scale.x', 0.85, 1), ch('scale.y', 0.85, 1), ch('scale.z', 0.85, 1)],
      { caption: 'O bíceps estufa de orgulho: TAC, SÔ, MÜ-QUE — Tack så mycket!' },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.7, 1.95, 4.9], target: [-0.15, 1.15, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'tack-sa-mycket',
    contexto: 'Qualquer situação: caixa do mercado, colega que ajudou, vizinho que segurou a porta.',
    fraseFonte: 'Muito obrigado!',
    fraseAlvo: 'Tack så mycket!',
    pronuncia:
      "tak sô MÜ-que! (o 't' final de 'mycket' some na fala; 'y' é um 'i' com bico; 'så' com ô fechado longo)",
    ponteSonora:
      "tak sô MÜ-que ~ \"TAC, SÔ MUQUE!\" — o tapa sonoro TAC dá 'tack'; 'SÔ' (seu, à mineira) garante o ô fechado longo de 'så'; e MUQUE dito com bico ('müque') é 'mycket' sem o t final, exatamente como na fala. Nenhuma sílaba sobrando: TAC-SÔ-MÜ-QUE.",
    historia:
      "O SÔ MUQUE, segurança bombado da portaria, segurou a porta aberta pra você. Palavras não bastam pra tanta gentileza: você agradece dando um tapa sonoro — TAC! — no MUQUE gigante dele. Diga 'muque' com bico ('müque') e o bíceps estufa ainda mais de orgulho: TAC, SÔ MÜQUE — muito obrigado!",
  },
  createScene,
  refine: { organic: ['bracoMuque', 'muque'] },
}

export default card
