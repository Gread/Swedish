import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, lathe, rock, puff, torus,
} from '../rig/helpers'

/**
 * "Jag jobbar hemifrån idag." — IÁ, IÓBAR! RRÊ-MI-FRÔ NI-DÁG!
 *
 * Diorama: a lagoa do castor. Sobre a própria represa de troncos há uma mesa
 * de tronco fatiado com laptop aberto — o escritório é literalmente a casa
 * dele. O castor engravatado joga os braços pro alto (IÁ, IÓBAR!), tem como
 * única colega de reunião RÊMI, a FRÔ (um girassol de vaso que se vira pra
 * servir de luz de webcam) e bate o ponto estalando a cauda na água: NI-DÁG!
 */

const WATER = '#2f7fb5'
const BANK = '#5d7a3a'
const SOIL = '#6a5138'
const LOG = '#7a5533'
const LOG_DARK = '#5d3f26'
const FUR = '#7a4a2b'
const FUR_LIGHT = '#a97247'
const SKIN = '#e8c39e'
const TIE = '#6e2b33'
const PETAL = '#f2b31a' // acento reservado: o GIRASSOL (RÊMI, a FRÔ)
const WY = 0.21 // lâmina d'água
const DY = 0.70 // topo pisável da represa

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: a lagoa -------------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.58, 2.7, 0.16, SOIL, { roughness: 0.95 })
  soil.position.y = 0.08
  base.add(soil)

  const agua = cylinder(2.46, 2.5, 0.1, WATER, { roughness: 0.12 })
  agua.position.y = 0.16
  base.add(agua)

  // barranco: anel de grama na borda da lâmina d'água
  const barranco = torus(2.48, 0.15, BANK, { roughness: 0.9 })
  barranco.rotation.x = Math.PI / 2
  barranco.position.y = 0.15
  base.add(barranco)

  // vitórias-régias
  for (const [px, pz, pr] of [[-1.72, 1.18, 0.34], [1.95, 1.1, 0.26]] as const) {
    const pad = cylinder(pr, pr * 0.96, 0.035, '#3f7d33', { roughness: 0.85 })
    pad.position.set(px, WY - 0.01, pz)
    pad.rotation.y = rand() * Math.PI
    base.add(pad)
  }

  const pedra = rock(0.24, '#8d9296', 31, { roughness: 0.9 })
  pedra.position.set(-2.05, 0.22, -0.62)
  pedra.rotation.y = rand() * Math.PI
  base.add(pedra)

  const arbusto = puff(0.24, '#3f7d33', 6, 32, { roughness: 0.9 })
  arbusto.position.set(-1.15, 0.24, -1.95)
  base.add(arbusto)

  // juncos com taboa
  for (const [jx, jz] of [[2.0, -1.15], [2.18, -0.86], [1.78, -1.42]] as const) {
    const talo = cylinder(0.02, 0.028, 0.72, '#4e7d38', { roughness: 0.9 })
    talo.position.set(jx, WY + 0.34, jz)
    talo.rotation.z = (rand() - 0.5) * 0.3
    const taboa = capsule(0.045, 0.16, LOG_DARK, { roughness: 0.9 })
    taboa.position.y = 0.44
    talo.add(taboa)
    base.add(talo)
  }
  root.add(base)

  // ---- represa de troncos cruzados ----------------------------------------
  const represa = new THREE.Group()

  for (const [lz, len] of [[-0.62, 3.0], [0.06, 3.2], [0.72, 2.8]] as const) {
    const tronco = cylinder(0.16, 0.16, len, LOG, { roughness: 0.8 })
    tronco.rotation.z = Math.PI / 2
    tronco.rotation.x = (rand() - 0.5) * 0.12
    tronco.position.set(0, 0.36, lz)
    represa.add(tronco)
  }

  for (const lx of [-0.62, 1.5]) {
    const tronco = cylinder(0.15, 0.15, 2.3, LOG_DARK, { roughness: 0.8 })
    tronco.rotation.x = Math.PI / 2
    tronco.rotation.z = (rand() - 0.5) * 0.1
    tronco.position.set(lx, 0.6, 0.02)
    represa.add(tronco)
  }

  // gravetos soltos, a marca da obra do castor
  for (const [gx, gz, ga] of [[-1.55, 0.5, 0.7], [1.9, 0.35, -0.5]] as const) {
    const graveto = cylinder(0.06, 0.07, 0.85, LOG, { roughness: 0.85 })
    graveto.rotation.set(0, ga, Math.PI / 2 + 0.22)
    graveto.position.set(gx, 0.3, gz)
    represa.add(graveto)
  }
  root.add(represa)

  // ---- mesa: toco + tampo de tronco fatiado -------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(0.5, DY, 0.08)

  const toco = cylinder(0.26, 0.3, 0.68, LOG_DARK, { roughness: 0.8 })
  toco.position.y = -0.06
  mesa.add(toco)

  const tampo = cylinder(0.62, 0.6, 0.09, LOG, { roughness: 0.75 })
  tampo.position.y = 0.325
  mesa.add(tampo)

  const anel = cylinder(0.34, 0.34, 0.095, FUR_LIGHT, { roughness: 0.7 })
  anel.position.y = 0.328
  mesa.add(anel)

  const caneca = lathe(
    [[0, 0], [0.075, 0], [0.08, 0.02], [0.075, 0.13], [0.065, 0.14], [0.068, 0.02], [0, 0.02]],
    '#d8d2c4',
    { roughness: 0.15 },
  )
  caneca.position.set(0.38, 0.37, 0.22)
  mesa.add(caneca)
  root.add(mesa)

  // ---- laptop aberto em L --------------------------------------------------
  const laptop = new THREE.Group()
  laptop.position.set(0.5, DY + 0.37, 0.05)

  const chassi = rbox(0.62, 0.045, 0.42, 0.018, '#9aa2a8', { roughness: 0.4 })
  chassi.position.y = 0.023
  laptop.add(chassi)

  const teclado = rbox(0.5, 0.014, 0.24, 0.006, '#4e5459', { roughness: 0.5 })
  teclado.position.set(0, 0.05, 0.03)
  laptop.add(teclado)

  const touchpad = rbox(0.16, 0.01, 0.1, 0.004, '#b6bcc0', { roughness: 0.35 })
  touchpad.position.set(0, 0.05, 0.16)
  laptop.add(touchpad)

  // tampa articulada (peça própria: abre por dobradiça)
  const tela = new THREE.Group()
  tela.position.set(0, 0.045, -0.2)
  tela.rotation.x = -0.3

  const tampa = rbox(0.62, 0.42, 0.028, 0.018, '#8d959b', { roughness: 0.4 })
  tampa.position.y = 0.21
  tela.add(tampa)

  const painel = rbox(0.55, 0.35, 0.012, 0.008, '#2c4a5e', { roughness: 0.2 })
  painel.position.set(0, 0.21, 0.018)
  tela.add(painel)

  // duas janelinhas de videochamada acesas
  for (const jx of [-0.13, 0.13]) {
    const janela = rbox(0.22, 0.14, 0.008, 0.006, '#8fc4de', {
      emissive: '#3f7fa8',
      emissiveIntensity: 1.0,
    })
    janela.position.set(jx, 0.245, 0.026)
    tela.add(janela)
  }
  const barra = rbox(0.48, 0.05, 0.008, 0.006, '#5b8fae', { roughness: 0.3 })
  barra.position.set(0, 0.12, 0.026)
  tela.add(barra)
  laptop.add(tela)
  root.add(laptop)

  // ---- castor engravatado (olha para a mesa: +z local) --------------------
  const castor = new THREE.Group()
  castor.position.set(-0.62, DY, 0.14)
  castor.rotation.y = 1.35

  const corpo = capsule(0.3, 0.42, FUR, { roughness: 0.85 })
  corpo.position.y = 0.6
  castor.add(corpo)

  const barriga = capsule(0.17, 0.24, FUR_LIGHT, { roughness: 0.85 })
  barriga.position.set(0, 0.56, 0.19)
  barriga.scale.z = 0.5
  castor.add(barriga)

  for (const side of [-1, 1]) {
    const pe = capsule(0.085, 0.16, LOG_DARK, { roughness: 0.85 })
    pe.position.set(side * 0.2, 0.085, 0.16)
    pe.rotation.x = Math.PI / 2
    castor.add(pe)
  }

  // colarinho + gravata
  const camisa = sphere(0.19, '#e8e4da', { roughness: 0.9 })
  camisa.position.set(0, 0.92, 0.16)
  camisa.scale.set(0.9, 0.85, 0.6)
  castor.add(camisa)

  const colarinho = torus(0.17, 0.035, '#e8e4da', { roughness: 0.9 })
  colarinho.rotation.x = Math.PI / 2 - 0.25
  colarinho.position.set(0, 1.02, 0.06)
  castor.add(colarinho)

  const no = rbox(0.09, 0.09, 0.06, 0.025, TIE, { roughness: 0.45 })
  no.position.set(0, 0.99, 0.24)
  castor.add(no)

  const gravata = rbox(0.13, 0.34, 0.05, 0.03, TIE, { roughness: 0.45 })
  gravata.position.set(0, 0.78, 0.26)
  gravata.rotation.x = -0.12
  castor.add(gravata)

  // cabeça com dentões
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.28, 0.04)
  castor.add(cabeca)

  const cranio = sphere(0.28, FUR, { roughness: 0.85 })
  cranio.scale.set(1, 0.94, 0.96)
  cabeca.add(cranio)

  const focinho = sphere(0.16, FUR_LIGHT, { roughness: 0.85 })
  focinho.position.set(0, -0.07, 0.22)
  focinho.scale.set(0.95, 0.78, 1.05)
  cabeca.add(focinho)

  const nariz = sphere(0.05, '#3a2a20', { roughness: 0.35 })
  nariz.position.set(0, 0.02, 0.35)
  cabeca.add(nariz)

  for (const side of [-1, 1]) {
    const dente = rbox(0.075, 0.12, 0.03, 0.012, '#fdf6e3', { roughness: 0.25 })
    dente.position.set(side * 0.042, -0.16, 0.28)
    cabeca.add(dente)

    const olho = sphere(0.062, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.115, 0.08, 0.235)
    olho.scale.z = 0.6
    const pupila = sphere(0.03, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.115, 0.085, 0.28)
    cabeca.add(olho, pupila)

    const orelha = sphere(0.075, LOG_DARK, { roughness: 0.85 })
    orelha.position.set(side * 0.25, 0.19, -0.06)
    orelha.scale.set(0.5, 1, 1)
    cabeca.add(orelha)
  }
  root.add(castor)

  // ---- braços erguidos (peça: sobe do teclado pro alto) -------------------
  const bracos = new THREE.Group()
  bracos.position.set(0, 0.92, 0.02)
  bracos.rotation.x = -0.1
  castor.add(bracos)

  for (const side of [-1, 1]) {
    const ombro = new THREE.Group()
    ombro.position.set(side * 0.29, 0, 0)
    ombro.rotation.z = -side * 0.45

    const braco = capsule(0.075, 0.3, FUR, { roughness: 0.85 })
    braco.position.y = 0.24
    ombro.add(braco)

    const mao = sphere(0.09, SKIN, { roughness: 0.8 })
    mao.position.y = 0.48
    ombro.add(mao)
    bracos.add(ombro)
  }

  // ---- cauda chapada (bate o ponto na água) -------------------------------
  const cauda = new THREE.Group()
  cauda.position.set(0, 0.3, -0.26)
  cauda.rotation.x = 0.12
  castor.add(cauda)

  const base_cauda = capsule(0.09, 0.14, FUR, { roughness: 0.85 })
  base_cauda.rotation.x = Math.PI / 2
  base_cauda.position.z = -0.1
  cauda.add(base_cauda)

  const pa = rbox(0.34, 0.09, 0.56, 0.045, LOG_DARK, { roughness: 0.85 })
  pa.position.set(0, -0.02, -0.42)
  cauda.add(pa)

  const sulco = rbox(0.02, 0.02, 0.44, 0.008, '#43301c', { roughness: 0.9 })
  sulco.position.set(0, 0.045, -0.42)
  cauda.add(sulco)

  // ---- girassol de vaso: RÊMI, a FRÔ --------------------------------------
  const vaso = new THREE.Group()
  vaso.position.set(1.5, DY, -0.28)
  vaso.rotation.y = -1.15

  const pote = lathe(
    [[0, 0], [0.24, 0], [0.26, 0.06], [0.3, 0.36], [0.33, 0.42], [0.29, 0.42], [0.26, 0.06], [0, 0.04]],
    '#b5643c',
    { roughness: 0.7 },
  )
  vaso.add(pote)

  const terra = cylinder(0.28, 0.28, 0.05, '#4a3a2a', { roughness: 0.95 })
  terra.position.y = 0.4
  vaso.add(terra)

  const caule = cylinder(0.045, 0.06, 0.9, '#4e7d38', { roughness: 0.85 })
  caule.position.y = 0.85
  caule.rotation.z = -0.06
  vaso.add(caule)

  for (const [side, ly] of [[-1, 0.72], [1, 0.98]] as const) {
    const folha = capsule(0.07, 0.2, '#4e7d38', { roughness: 0.85 })
    folha.position.set(side * 0.2, ly, 0.02)
    folha.rotation.set(0, 0, -side * 1.0)
    folha.scale.set(1, 1, 0.4)
    vaso.add(folha)
  }

  const flor = new THREE.Group()
  flor.position.set(0, 1.36, 0.02)
  flor.rotation.x = -0.18
  vaso.add(flor)

  const miolo = cylinder(0.21, 0.21, 0.1, '#4a3323', { roughness: 0.9 })
  miolo.rotation.x = Math.PI / 2
  flor.add(miolo)

  const costas = sphere(0.2, '#4e7d38', { roughness: 0.85 })
  costas.position.z = -0.07
  costas.scale.z = 0.5
  flor.add(costas)

  // coroa de pétalas (peça própria: desabrocha)
  const petalas = new THREE.Group()
  flor.add(petalas)

  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2
    const petala = capsule(0.055, 0.17, PETAL, { roughness: 0.6 })
    petala.position.set(Math.cos(a) * 0.31, Math.sin(a) * 0.31, 0.01)
    petala.rotation.z = a - Math.PI / 2
    petala.scale.z = 0.42
    petalas.add(petala)
  }
  root.add(vaso)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'lagoa', object: base },
    { name: 'represa', group: 'lagoa', object: represa },
    { name: 'mesa', group: 'escritorio', object: mesa },
    { name: 'laptop', group: 'escritorio', object: laptop },
    { name: 'tela', group: 'escritorio', object: tela },
    { name: 'castor', group: 'castor', object: castor },
    { name: 'bracos', group: 'castor', object: bracos },
    { name: 'cauda', group: 'castor', object: cauda },
    { name: 'vaso', group: 'girassol', object: vaso },
    { name: 'petalas', group: 'girassol', object: petalas },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.85)], {
      ease: 'easeOut',
      caption: 'Manhã: a lagoa do castor brota do chão…',
    }),
    seq('represa-rise', 'represa', 0.2, 0.8, [riseFrom(0, 1.1)], { ease: 'easeOut' }),

    seq('mesa-rise', 'mesa', 2.1, 0.8, [riseFrom(DY, 1.5)], {
      ease: 'easeOut',
      caption: '…e em cima da PRÓPRIA REPRESA sobe a mesa: o escritório dele é a casa dele.',
    }),
    seq(
      'laptop-grow',
      'laptop',
      2.35,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'tela-grow',
      'tela',
      2.5,
      0.4,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('tela-abre', 'tela', 3.05, 0.6, [ch('rotation.x', 1.5, -0.3)], { ease: 'easeOut' }),

    seq('castor-rise', 'castor', 4.8, 0.8, [riseFrom(DY, 2.75)], {
      ease: 'easeOut',
      caption: 'Avisam o CASTOR engravatado que hoje ninguém precisa ir ao escritório…',
    }),
    seq(
      'bracos-grow',
      'bracos',
      5.0,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'cauda-grow',
      'cauda',
      5.15,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('bracos-up', 'bracos', 6.3, 0.7, [ch('rotation.x', 1.25, -0.1)], {
      ease: 'easeOut',
      caption: '…e ele joga os braços pro alto: IÁ, IÓBAR! (jag jobbar — o R rola pro sopro seguinte)',
    }),
    seq('castor-pulo', 'castor', 6.45, 0.35, [ch('position.y', DY, 0.88)], { ease: 'easeOut' }),
    seq('castor-pousa', 'castor', 6.8, 0.35, [ch('position.y', 0.88, DY)], { ease: 'easeIn' }),

    seq('vaso-rise', 'vaso', 8.2, 0.8, [riseFrom(DY, 2.6)], { ease: 'easeOut' }),
    seq(
      'petalas-abre',
      'petalas',
      8.45,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'A única colega de reunião é RÊMI, a FRÔ: um girassol de vaso…',
      },
    ),
    seq('vaso-vira', 'vaso', 9.5, 0.7, [ch('rotation.y', 0.6, -1.15)], {
      caption: '…que se vira pra ser a luz de webcam dele — RRÊ-MI-FRÔ, trabalhando de casa.',
    }),

    seq('cauda-arma', 'cauda', 10.7, 0.45, [ch('rotation.x', 0.12, 0.95)], {
      ease: 'easeOut',
      caption: 'Pra bater o ponto, ele estala a cauda na água: NI-DÁG! (idag = hoje)',
    }),
    seq('cauda-bate', 'cauda', 11.15, 0.3, [ch('rotation.x', 0.95, -0.85)], { ease: 'easeIn' }),
    seq('cauda-volta', 'cauda', 11.45, 0.6, [ch('rotation.x', -0.85, 0.12)], {
      ease: 'easeOut',
      caption: 'Jag jobbar hemifrån idag. — "Hoje eu trabalho de casa."',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 3.1, 6.3], target: [0.2, 1.05, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-jobbar-hemifran',
    contexto: 'Mensagem curta no chat de manhã, ou resposta quando perguntam se ele vai ao escritório.',
    fraseFonte: 'Hoje eu trabalho de casa.',
    fraseAlvo: 'Jag jobbar hemifrån idag.',
    pronuncia: "iá IÓB-bar HÉM-i-frôn i-DÁG ('j' inicial sueco = I; 'å' = ô fechado, sem nasalizar)",
    ponteSonora:
      "IÁ IÓBAR! RRÊ-MI-FRÔ NI-DÁG! (8 sílabas; J sueco = I de ioga — 'IÓBAR', nunca 'jóba'; o -R final é BRANDO e rola direto pro sopro seguinte — sem ele sobra 'jobba', o infinitivo; o h de 'hemifrån' sopra como rr e traz Ê fechado; FRÔ com Ô FECHADO e SEM nasalizar — o N cola no i seguinte)",
    historia:
      'Avisam o castor engravatado que hoje ninguém precisa ir ao escritório e ele joga os braços pro alto: IÁ, IÓBAR! — e o R brando rola direto pro sopro seguinte. Abre o laptop em cima da própria represa (o escritório dele é literalmente a casa dele) e a única colega de reunião é RÊMI, a FRÔ: um girassol de vaso que se vira pra servir de luz de webcam. Pra bater o ponto, estala a cauda na água: NI-DÁG!',
  },
  createScene,
}

export default card
