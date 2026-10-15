import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone as coneGeo, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Vilket spår går tåget från?" — pátio de manobras.
 *
 * A doninha VIL (vilket) apagou o número de todos os trilhos com um rolinho
 * de tinta. No trilho do meio, um urso hiberna sobre uma FRÔnha (från)
 * gigante, com um trenzinho TÔ-GUET (tåget) apitando na barriga sem sair do
 * lugar, e ronca em dois tempos: SPÔR… GÔR… (spår går).
 * Regra do pátio: o trem parte do trilho onde o urso ronca mais alto.
 */

const BRITA = '#5b6167'
const BRITA_DARK = '#41464c'
const DORMENTE = '#4b3a2b'
const TRILHO = '#b6bdc4'
const FUR = '#bd8342'
const FUR_LIGHT = '#d9ab72'
const PAW = '#8a5c2c'
const CREME = '#efe6d4'
const WEASEL = '#6d4b30'
const WEASEL_LIGHT = '#c9a97e'
const MASK = '#241c16'
const CONE_ORANGE = '#c8722c'
const TINTA = '#1e1c1b'
const RED = '#d63f2f' // acento saturado: o trenzinho TÔ-GUET

const GY = 0.18 // topo do leito de brita

// pose final do urso (deitado de barriga pra cima sobre a fronha)
const URSO_X = 0.15
const URSO_Y = 1.05
const URSO_Z = 0.2
// pose de chegada, quando ele ainda está no chão ao lado do trilho
const URSO_CHAO_X = -2.05
const URSO_CHAO_Y = GY + 0.42
const URSO_CHAO_Z = 0.95

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- leito de brita ------------------------------------------------------
  const base = new THREE.Group()

  const leito = cylinder(2.66, 2.76, 0.12, BRITA_DARK, { roughness: 0.95 })
  leito.position.y = 0.06
  base.add(leito)

  const brita = cylinder(2.58, 2.66, 0.06, BRITA, { roughness: 0.95 })
  brita.position.y = 0.15
  base.add(brita)

  // adereços do pátio, espalhados com rng fixo
  for (const [rx, rz, rr, seed] of [
    [-2.1, -1.35, 0.19, 31],
    [1.95, -1.55, 0.13, 32],
    [-1.15, -2.05, 0.1, 33],
  ] as const) {
    const pedra = rock(rr, '#767c82', seed, { roughness: 0.95 })
    pedra.position.set(rx, GY + rr * 0.5, rz)
    pedra.rotation.y = rand() * Math.PI
    base.add(pedra)
  }

  const mato = puff(0.19, '#57633f', 6, 34, { roughness: 0.92 })
  mato.position.set(2.15, GY + 0.1, 0.55)
  base.add(mato)

  const matoB = puff(0.13, '#4c5a39', 5, 35, { roughness: 0.92 })
  matoB.position.set(-2.25, GY + 0.07, -0.25)
  base.add(matoB)

  // dormentes velhos empilhados num canto
  const pilha = new THREE.Group()
  pilha.position.set(1.75, GY, -1.05)
  pilha.rotation.y = 0.42
  for (let i = 0; i < 3; i++) {
    const tora = rbox(1.0, 0.11, 0.2, 0.03, DORMENTE, { roughness: 0.85 })
    tora.position.set((rand() - 0.5) * 0.08, 0.055 + i * 0.115, (rand() - 0.5) * 0.1)
    tora.rotation.y = (rand() - 0.5) * 0.12
    pilha.add(tora)
  }
  base.add(pilha)
  root.add(base)

  // ---- trio de trilhos em leque -------------------------------------------
  const trilhos = new THREE.Group()
  trilhos.position.set(0, GY, -2.4)
  root.add(trilhos)

  for (const ang of [-0.3, 0, 0.3]) {
    const via = new THREE.Group()
    via.rotation.y = ang
    trilhos.add(via)

    for (let z = 0.35; z <= 4.4; z += 0.45) {
      const dormente = rbox(0.9, 0.09, 0.19, 0.03, DORMENTE, { roughness: 0.85 })
      dormente.position.set(0, 0.045, z)
      dormente.rotation.y = (rand() - 0.5) * 0.05
      via.add(dormente)
    }

    for (const side of [-1, 1]) {
      const rail = rbox(0.075, 0.1, 4.2, 0.02, TRILHO, { roughness: 0.28, metalness: 0.85 })
      rail.position.set(side * 0.3, 0.14, 2.35)
      via.add(rail)
    }

    // placa de número — raspada e coberta de tinta preta
    const placa = new THREE.Group()
    placa.position.set(0.62, 0, 3.95)
    const poste = cylinder(0.028, 0.034, 0.56, '#7d848a', { roughness: 0.35, metalness: 0.6 })
    poste.position.y = 0.28
    placa.add(poste)
    const chapa = rbox(0.34, 0.26, 0.035, 0.03, '#e3dbcb', { roughness: 0.45 })
    chapa.position.y = 0.66
    placa.add(chapa)
    // número raspado: sobra um pedaço do dígito e por cima a pincelada de tinta
    const resto = rbox(0.045, 0.2, 0.012, 0.01, '#3d5f8f', { roughness: 0.5 })
    resto.position.set(0.1, 0.66, 0.022)
    resto.rotation.z = 0.12
    placa.add(resto)
    for (const [bx, by, bw, bz] of [[0.0, 0.69, 0.3, -0.16], [0.02, 0.62, 0.27, 0.1]] as const) {
      const borrao = rbox(bw, 0.085, 0.02, 0.04, TINTA, { roughness: 0.55 })
      borrao.position.set(bx, by, 0.03)
      borrao.rotation.z = bz
      placa.add(borrao)
    }
    for (const [dx, dl] of [[-0.08, 0.07], [0.05, 0.11], [0.11, 0.05]] as const) {
      const escorrido = capsule(0.011, dl, TINTA, { roughness: 0.5 })
      escorrido.position.set(dx, 0.585 - dl / 2, 0.035)
      placa.add(escorrido)
    }
    via.add(placa)
  }

  // ---- cone de sinalização -------------------------------------------------
  const cone = new THREE.Group()
  cone.position.set(-1.65, GY, 1.0)

  const coneCorpo = lathe(
    [
      [0, 0], [0.32, 0], [0.32, 0.06], [0.2, 0.08], [0.17, 0.13],
      [0.115, 0.4], [0.08, 0.56], [0.055, 0.65], [0, 0.68],
    ],
    CONE_ORANGE,
    { roughness: 0.5 },
  )
  cone.add(coneCorpo)

  const faixa = cylinder(0.116, 0.138, 0.1, CREME, { roughness: 0.5 })
  faixa.position.y = 0.33
  cone.add(faixa)
  root.add(cone)

  // ---- doninha vilã, comprida feito cachecol -------------------------------
  const doninha = new THREE.Group()
  doninha.position.set(-1.65, GY + 0.66, 1.0)
  doninha.rotation.y = 1.95 // olha para o urso (+z local)

  const dCorpo = capsule(0.15, 0.66, WEASEL, { roughness: 0.85 })
  dCorpo.position.y = 0.52
  doninha.add(dCorpo)

  const dPeito = capsule(0.09, 0.4, WEASEL_LIGHT, { roughness: 0.85 })
  dPeito.position.set(0, 0.5, 0.09)
  dPeito.scale.z = 0.5
  doninha.add(dPeito)

  for (const side of [-1, 1]) {
    const perna = capsule(0.055, 0.14, WEASEL, { roughness: 0.85 })
    perna.position.set(side * 0.09, 0.13, 0.02)
    doninha.add(perna)
    const pe = sphere(0.06, PAW, { roughness: 0.8 })
    pe.position.set(side * 0.09, 0.04, 0.07)
    pe.scale.set(1, 0.6, 1.3)
    doninha.add(pe)
  }

  // rabo pendendo para trás e para baixo, com a ponta escura NA ponta
  const rabo = capsule(0.085, 0.46, WEASEL, { roughness: 0.85 })
  rabo.position.set(0, 0.06, -0.3)
  rabo.rotation.x = -2.5
  doninha.add(rabo)
  const raboPonta = sphere(0.09, MASK, { roughness: 0.85 })
  raboPonta.position.set(0, -0.2, -0.5)
  raboPonta.scale.set(1, 1, 1.25)
  raboPonta.rotation.x = -2.5
  doninha.add(raboPonta)

  // cabeça: focinho pontudo, antifaz escuro, olhos
  const dCabeca = new THREE.Group()
  dCabeca.position.set(0, 0.98, 0.02)
  const dCranio = sphere(0.155, WEASEL, { roughness: 0.85 })
  dCranio.scale.set(0.95, 0.92, 1.05)
  dCabeca.add(dCranio)

  const focinho = coneGeo(0.085, 0.22, WEASEL_LIGHT, { roughness: 0.85 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.03, 0.19)
  dCabeca.add(focinho)

  const dNariz = sphere(0.032, MASK, { roughness: 0.3 })
  dNariz.position.set(0, -0.02, 0.29)
  dCabeca.add(dNariz)

  const antifaz = rbox(0.29, 0.11, 0.08, 0.035, MASK, { roughness: 0.8 })
  antifaz.position.set(0, 0.05, 0.1)
  antifaz.rotation.x = -0.1
  dCabeca.add(antifaz)

  for (const side of [-1, 1]) {
    const olho = sphere(0.038, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.07, 0.055, 0.15)
    olho.scale.z = 0.6
    const pupila = sphere(0.018, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.07, 0.055, 0.175)
    dCabeca.add(olho, pupila)

    const orelha = sphere(0.055, WEASEL, { roughness: 0.85 })
    orelha.position.set(side * 0.115, 0.15, -0.02)
    orelha.scale.set(1, 1, 0.5)
    dCabeca.add(orelha)
  }
  doninha.add(dCabeca)

  // braços + rolinho de tinta na pata direita
  const bracoL = capsule(0.045, 0.16, WEASEL, { roughness: 0.85 })
  bracoL.position.set(-0.17, 0.68, 0.06)
  bracoL.rotation.set(0.2, 0, 0.55)
  doninha.add(bracoL)

  const bracoR = capsule(0.045, 0.18, WEASEL, { roughness: 0.85 })
  bracoR.position.set(0.19, 0.66, 0.14)
  bracoR.rotation.set(0.75, 0, -0.5)
  doninha.add(bracoR)

  const rolinho = new THREE.Group()
  rolinho.position.set(0.29, 0.6, 0.28)
  rolinho.rotation.z = -0.3
  const pata = sphere(0.055, PAW, { roughness: 0.8 })
  rolinho.add(pata)
  const cabo = cylinder(0.022, 0.026, 0.32, '#9a8a6f', { roughness: 0.6 })
  cabo.position.y = 0.16
  rolinho.add(cabo)
  const forquilha = cylinder(0.018, 0.018, 0.16, '#8d949a', { roughness: 0.3, metalness: 0.7 })
  forquilha.position.set(0, 0.33, 0.05)
  forquilha.rotation.z = Math.PI / 2
  rolinho.add(forquilha)
  const cilindro = cylinder(0.075, 0.075, 0.2, TINTA, { roughness: 0.9 })
  cilindro.position.set(0, 0.33, 0.05)
  cilindro.rotation.z = Math.PI / 2
  rolinho.add(cilindro)
  for (const [dx, dy] of [[0.06, 0.21], [-0.05, 0.24]] as const) {
    const pingo = sphere(0.026, TINTA, { roughness: 0.7 })
    pingo.position.set(dx, dy, 0.06)
    rolinho.add(pingo)
  }
  doninha.add(rolinho)
  root.add(doninha)

  // ---- fronha gigante no trilho do meio ------------------------------------
  const fronha = new THREE.Group()
  fronha.position.set(URSO_X, GY + 0.19 + 0.22, URSO_Z)

  const travesseiro = rbox(1.95, 0.44, 1.15, 0.2, CREME, { roughness: 0.92 })
  fronha.add(travesseiro)

  const costura = rbox(1.99, 0.05, 1.19, 0.02, '#ddd0b6', { roughness: 0.92 })
  costura.position.y = -0.02
  fronha.add(costura)

  // aba da fronha, dobrada numa ponta
  const aba = rbox(0.5, 0.1, 1.1, 0.05, '#e5dac4', { roughness: 0.92 })
  aba.position.set(-0.85, 0.2, 0)
  aba.rotation.z = 0.22
  fronha.add(aba)
  root.add(fronha)

  // ---- urso hibernando -----------------------------------------------------
  const urso = new THREE.Group()
  urso.position.set(URSO_X, URSO_Y, URSO_Z)

  const tronco = capsule(0.42, 0.75, FUR, { roughness: 0.88 })
  tronco.rotation.z = Math.PI / 2
  urso.add(tronco)

  const barriga = sphere(0.3, FUR_LIGHT, { roughness: 0.88 })
  barriga.position.set(0.14, 0.24, 0.04)
  barriga.scale.set(1.45, 0.62, 0.95)
  urso.add(barriga)

  // quatro patas pra cima, do jeito que urso dorme de barriga pro céu
  for (const [px, pz, pr] of [
    [-0.4, 0.24, 0.115],
    [-0.4, -0.24, 0.115],
    [0.52, 0.26, 0.135],
    [0.52, -0.26, 0.135],
  ] as const) {
    const perna = capsule(pr, 0.2, FUR, { roughness: 0.88 })
    perna.position.set(px, 0.42, pz)
    perna.rotation.set(pz > 0 ? 0.22 : -0.22, 0, px > 0 ? -0.16 : 0.16)
    urso.add(perna)
    const sola = sphere(pr * 0.85, PAW, { roughness: 0.85 })
    sola.position.set(px + (px > 0 ? -0.03 : 0.03), 0.62, pz + (pz > 0 ? 0.05 : -0.05))
    sola.scale.set(1, 0.7, 1)
    urso.add(sola)
  }

  const rabinho = sphere(0.11, FUR, { roughness: 0.88 })
  rabinho.position.set(0.86, -0.1, -0.18)
  urso.add(rabinho)
  root.add(urso)

  // cabeça do urso — telescopa de dentro do tronco, boca aberta pra cima
  const cabeca = new THREE.Group()
  cabeca.position.set(-0.95, 0.12, 0.15)
  urso.add(cabeca)

  const inclinada = new THREE.Group()
  inclinada.rotation.x = -0.55 // cara virada pro céu
  cabeca.add(inclinada)

  const cranio = sphere(0.34, FUR, { roughness: 0.88 })
  cranio.scale.set(0.96, 1, 0.98)
  inclinada.add(cranio)

  const fuca = sphere(0.19, FUR_LIGHT, { roughness: 0.88 })
  fuca.position.set(0, -0.02, 0.27)
  fuca.scale.set(0.9, 0.8, 1.1)
  inclinada.add(fuca)

  const narigao = sphere(0.07, '#3a2a20', { roughness: 0.35 })
  narigao.position.set(0, 0.1, 0.4)
  inclinada.add(narigao)

  // boca escancarada: anel de lábio + interior escuro + língua
  const labio = torus(0.13, 0.035, '#96603a', { roughness: 0.85 })
  labio.position.set(0, -0.09, 0.36)
  inclinada.add(labio)

  const bocaFundo = sphere(0.115, '#4d2320', { roughness: 0.7 })
  bocaFundo.position.set(0, -0.09, 0.35)
  bocaFundo.scale.set(1, 1, 0.6)
  inclinada.add(bocaFundo)

  const lingua = sphere(0.07, '#b0524c', { roughness: 0.6 })
  lingua.position.set(0, -0.12, 0.38)
  lingua.scale.set(1, 0.5, 0.6)
  inclinada.add(lingua)

  for (const side of [-1, 1]) {
    const olho = sphere(0.07, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.15, 0.14, 0.27)
    olho.scale.z = 0.6
    const pupila = sphere(0.032, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.15, 0.12, 0.315)
    inclinada.add(olho, pupila)

    // pálpebra pesada: o urso está dormindo, não olhando
    const palpebra = sphere(0.078, FUR, { roughness: 0.88 })
    palpebra.position.set(side * 0.15, 0.185, 0.265)
    palpebra.scale.set(1.05, 0.62, 0.7)
    inclinada.add(palpebra)

    const orelha = sphere(0.115, FUR, { roughness: 0.88 })
    orelha.position.set(side * 0.25, 0.26, -0.08)
    orelha.scale.z = 0.65
    const orelhaIn = sphere(0.062, PAW, { roughness: 0.85 })
    orelhaIn.position.set(side * 0.26, 0.26, 0.0)
    orelhaIn.scale.z = 0.5
    inclinada.add(orelha, orelhaIn)
  }

  // ---- trenzinho vermelho na barriga ---------------------------------------
  const trem = new THREE.Group()
  trem.position.set(0.35, 0.42, -0.02)
  trem.rotation.y = -0.35
  urso.add(trem)

  const chassi = rbox(0.62, 0.09, 0.26, 0.03, '#5a4030', { roughness: 0.7 })
  chassi.position.y = 0.11
  trem.add(chassi)

  const caldeira = cylinder(0.11, 0.11, 0.34, RED, { roughness: 0.35 })
  caldeira.rotation.z = Math.PI / 2
  caldeira.position.set(-0.1, 0.22, 0)
  trem.add(caldeira)

  const frente = cylinder(0.115, 0.115, 0.04, '#f0d38a', { roughness: 0.3, metalness: 0.6 })
  frente.rotation.z = Math.PI / 2
  frente.position.set(-0.29, 0.22, 0)
  trem.add(frente)

  const cabine = rbox(0.24, 0.26, 0.25, 0.05, RED, { roughness: 0.35 })
  cabine.position.set(0.19, 0.29, 0)
  trem.add(cabine)

  const teto = rbox(0.29, 0.05, 0.3, 0.02, '#efe6d4', { roughness: 0.5 })
  teto.position.set(0.19, 0.44, 0)
  trem.add(teto)

  const chamine = lathe(
    [[0, 0], [0.045, 0], [0.045, 0.1], [0.07, 0.13], [0.07, 0.16], [0, 0.16]],
    '#2f3238',
    { roughness: 0.45 },
  )
  chamine.position.set(-0.22, 0.32, 0)
  trem.add(chamine)

  // apito soltando um fiapo de vapor
  const vapor = puff(0.075, '#e9eff3', 4, 41, { roughness: 0.85 })
  vapor.position.set(-0.22, 0.55, 0)
  trem.add(vapor)

  for (const [wx, wz] of [
    [-0.19, 0.14], [-0.19, -0.14], [0.16, 0.14], [0.16, -0.14],
  ] as const) {
    const roda = cylinder(0.075, 0.075, 0.04, '#2f3238', { roughness: 0.4, metalness: 0.55 }, 20)
    roda.rotation.x = Math.PI / 2
    roda.position.set(wx, 0.075, wz)
    trem.add(roda)
  }

  // ---- ronco em dois tempos: SPÔR… GÔR… ------------------------------------
  const roncoA = puff(0.21, '#eef3f6', 6, 51, { roughness: 0.9 })
  roncoA.position.set(0.02, 0.72, 0.3)
  cabeca.add(roncoA)

  const roncoB = puff(0.16, '#e4ebf1', 5, 52, { roughness: 0.9 })
  roncoB.position.set(-0.2, 1.18, 0.18)
  cabeca.add(roncoB)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'patio', object: base },
    { name: 'trilhos', group: 'patio', object: trilhos },
    { name: 'cone', group: 'doninha', object: cone },
    { name: 'doninha', group: 'doninha', object: doninha },
    // adereço rígido à parte, só para o refinamento não fundi-lo na pele da doninha
    { name: 'rolinho', group: 'doninha', object: rolinho },
    { name: 'fronha', group: 'urso', object: fronha },
    { name: 'urso', group: 'urso', object: urso },
    { name: 'cabeca', group: 'urso', object: cabeca },
    { name: 'trem', group: 'trem', object: trem },
    { name: 'roncoA', group: 'ronco', object: roncoA },
    { name: 'roncoB', group: 'ronco', object: roncoB },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Pátio de manobras: três trilhos num leito de brita — e nenhum número neles.',
    }),
    seq('trilhos-rise', 'trilhos', 0.2, 0.8, [riseFrom(GY, 1.25)], { ease: 'easeOut' }),

    seq('cone-rise', 'cone', 1.9, 0.7, [riseFrom(GY, 1.15)], { ease: 'easeOut' }),
    seq(
      'doninha-stretch',
      'doninha',
      2.1,
      0.8,
      [ch('scale.y', 0.02, 1), ch('scale.x', 0.65, 1), ch('scale.z', 0.65, 1)],
      {
        ease: 'easeOut',
        caption: 'Do cone estica uma doninha VIL, comprida feito cachecol, com rolinho de tinta na pata…',
      },
    ),
    seq('doninha-pinta', 'doninha', 3.2, 0.6, [ch('rotation.z', 0, -0.3), ch('rotation.y', 1.95, 2.35)], {
      caption: '…ela apagou o número de TODOS os trilhos: VIL-ket spår?',
    }),
    seq('doninha-volta', 'doninha', 3.85, 0.6, [ch('rotation.z', -0.3, 0), ch('rotation.y', 2.35, 1.95)]),

    seq(
      'fronha-infla',
      'fronha',
      5.1,
      0.7,
      [ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1)],
      {
        ease: 'easeOut',
        caption: 'No trilho do meio, infla uma FRÔnha branca do tamanho de um vagão…',
      },
    ),
    seq('urso-rise', 'urso', 5.35, 0.8, [riseFrom(URSO_CHAO_Y, 1.45)], { ease: 'easeOut' }),
    seq(
      'urso-rola',
      'urso',
      6.3,
      0.8,
      [
        ch('position.x', URSO_CHAO_X, URSO_X),
        ch('position.z', URSO_CHAO_Z, URSO_Z),
        ch('position.y', URSO_CHAO_Y, URSO_Y),
        ch('rotation.z', -0.45, 0),
      ],
      { caption: '…e um urso caramelo rola pra cima dela e hiberna de barriga pro céu.' },
    ),
    seq('cabeca-telescopa', 'cabeca', 7.2, 0.6, [ch('position.x', -0.15, -0.95)], { ease: 'easeOut' }),

    seq('trem-sobe', 'trem', 8.5, 0.7, [ch('position.y', -0.1, 0.42)], {
      ease: 'easeOut',
      caption: 'Na barriga dele, um trenzinho TÔ-GUET apita sem sair do lugar…',
    }),
    seq('trem-arranca', 'trem', 9.3, 0.5, [ch('position.x', 0.35, 0.52)]),
    seq('trem-recua', 'trem', 9.8, 0.5, [ch('position.x', 0.52, 0.35)]),

    seq(
      'ronco-spor',
      'roncoA',
      10.5,
      0.7,
      [
        ch('scale.x', 0.02, 1), ch('scale.y', 0.02, 1), ch('scale.z', 0.02, 1),
        ch('position.y', 0.14, 0.72), ch('position.z', 0.38, 0.3),
      ],
      {
        ease: 'easeOut',
        caption: 'O ronco sai em dois tempos — SPÔR… GÔR… — e entrega o trilho.',
      },
    ),
    seq(
      'ronco-gor',
      'roncoB',
      11.1,
      0.7,
      [
        ch('scale.x', 0.02, 1), ch('scale.y', 0.02, 1), ch('scale.z', 0.02, 1),
        ch('position.y', 0.14, 1.18), ch('position.x', 0.02, -0.2), ch('position.z', 0.38, 0.18),
      ],
      {
        ease: 'easeOut',
        caption: 'VIL-ket SPÔR-GÔR TÔ-GUET FRÔN? — Vilket spår går tåget från?',
      },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.85, 2.85, 5.75], target: [-0.15, 1.05, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'vilket-spar-gar-taget-fran',
    contexto: 'Na estação, quando o painel não mostra a plataforma ou mudou em cima da hora.',
    fraseFonte: 'De qual plataforma sai o trem?',
    fraseAlvo: 'Vilket spår går tåget från?',
    pronuncia: "VÍL-ket spôr gôr TÔ-guet fron? (K de 'vilket' é DURO; 'å' = ô fechado)",
    ponteSonora:
      "VIL QUE 'SPÔR-GÔR', TÔ-GUET FRÔN! (7 sílabas; K de 'vilket' é DURO e o -t some no S seguinte; SPÔR-GÔR com Ô FECHADO nos dois e R BRANDO; TÔ-GUET guarda o T final — 'tåget', não 'tåge'; FRÔN com Ô FECHADO e N batido na língua, SEM a nasal de 'fronha')",
    historia:
      'Uma doninha VIL, comprida feito um cachecol, apagou o número de todos os trilhos com um rolinho de tinta. Do trilho do meio vem um ronco em dois tempos — SPÔR... GÔR... — de um urso hibernando em cima de uma FRÔnha gigante, com um trenzinho TÔ-GUET apitando na barriga dele sem sair do lugar. Regra do pátio: o trem parte do trilho onde o urso ronca mais alto.',
  },
  createScene,
  refine: { organic: ['urso', 'cabeca', 'doninha', 'roncoA', 'roncoB'] },
}

export default card
