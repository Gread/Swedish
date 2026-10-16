import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, lathe, puff,
} from '../rig/helpers'

/**
 * "Har du syskon?" — RRÁR-DÜ... SÜS(to)! CÓN(e)?
 *
 * Um poodle branco de pompons, que se achava filho único, late pro cone de
 * trânsito que se mexeu (RRÁR!), aponta a pata (DÜ?), leva um SUSTO quando o
 * cone pula e, ao erguer o CONE com o focinho, encontra embaixo um filhote
 * idêntico — e no cone seguinte espia mais um focinho branco: cada cone
 * esconde um irmão.
 *
 * Diorama: calçada de lajotas cinza com meio-fio e uma faixa de asfalto na
 * frente. O laranja dos cones é o acento saturado (CÓN = cone); a coleira é
 * carmim fechado e as gotas de susto, azul claro.
 */

const LAJOTA = ['#8e9195', '#868a8f', '#979a9d'] as const
const JUNTA = '#5b5e63'
const MEIOFIO = '#585b61'
const MEIOFIO_TOPO = '#696c72'
const ASFALTO = '#3a3c41'

const BRANCO = '#f4f0e7'
const BRANCO_SOMBRA = '#e6dfd2'
const PRETO = '#25222a'
const COLEIRA = '#a8263a'
const PLAQUINHA = '#c9ccd1'

const LARANJA = '#f26a1b' // acento reservado: os CONES (CÓN)
const FAIXA = '#f5f3ee'
const BASE_CONE = '#2e2f34'
const AZUL = '#5ab4ea'

const GY = 0.175 // topo das lajotas

// palco: o cachorro anda ao longo de +x (local), de perfil 3/4 para a câmera
const PALCO_X = -0.4
const PALCO_ROT = -0.28

// cabeça do poodle (local do poodle): pivô no alto do pescoço
const HEAD_PIVOT: [number, number] = [0.5, 1.25]
const HEAD_OFF: [number, number] = [0.05, 0.03]
const NOSE_LOCAL: [number, number] = [0.29, -0.02] // ponta do nariz no frame da cabeça
const HEAD_PROUD = 0.28 // queixo empinado de "sou único"
const HEAD_DIP = -0.32
const HEAD_UP = 0.5 // pose final: focinho erguendo o cone

// cone 1: no chão (sobre o filhote) e erguido (pose final)
const C1_GROUND: [number, number] = [0.95, 0.62] // x, z
const C1_TILT = -0.95
const C1_PLATE = 0.25 // meia-largura da placa da base

// cone 2 (com o focinho espiando)
const C2: [number, number] = [1.85, -0.3]
const C2_TILT = -0.3

// pata apontando
const PATA_Z = 1.6
const PATA_Y = 0.38

function rotZ(x: number, y: number, a: number): [number, number] {
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]
}

/** Cone de trânsito: placa quadrada escura, corpo laranja torneado, faixa branca. */
function trafficCone(): THREE.Group {
  const g = new THREE.Group()

  const placa = rbox(C1_PLATE * 2, 0.05, C1_PLATE * 2, 0.02, BASE_CONE, { roughness: 0.8 })
  placa.position.y = 0.025
  g.add(placa)

  const aba = lathe([[0.235, 0.05], [0.235, 0.07], [0.215, 0.085], [0.2, 0.085]], BASE_CONE, { roughness: 0.8 })
  g.add(aba)

  const y0 = 0.085
  const y1 = 0.69
  const r0 = 0.205
  const r1 = 0.05
  const rAt = (y: number) => r0 + ((r1 - r0) * (y - y0)) / (y1 - y0)

  const corpo = lathe(
    [[0, y0 - 0.02], [0.21, y0 - 0.02], [r0, y0], [r1, y1], [0.034, 0.725], [0, 0.738]],
    LARANJA,
    { roughness: 0.42 },
  )
  g.add(corpo)

  // faixas refletivas: uma larga e uma fina
  for (const [a, b] of [[0.36, 0.48], [0.235, 0.27]] as const) {
    const faixa = lathe([[rAt(a) + 0.006, a], [rAt(b) + 0.006, b]], FAIXA, { roughness: 0.3 })
    g.add(faixa)
  }
  return g
}

/**
 * Cabeça de poodle olhando para +z: crânio, topete redondo, orelhas compridas
 * com pompom, focinho afilado, nariz e olhos. `wide` = olhos arregalados.
 */
function poodleHead(s: number, seed: number, wide = false): THREE.Group {
  const g = new THREE.Group()

  const cranio = sphere(0.14 * s, BRANCO, { roughness: 0.9 })
  cranio.scale.set(1, 0.95, 1.05)
  g.add(cranio)

  const topete = puff(0.13 * s, BRANCO, 7, seed, { roughness: 0.92 })
  topete.position.set(0, 0.14 * s, -0.025 * s)
  g.add(topete)

  const focinho = capsule(0.056 * s, 0.13 * s, BRANCO, { roughness: 0.86 })
  focinho.rotation.x = Math.PI / 2
  focinho.scale.set(1, 1, 0.88)
  focinho.position.set(0, -0.04 * s, 0.17 * s)
  g.add(focinho)

  const nariz = sphere(0.036 * s, PRETO, { roughness: 0.3 })
  nariz.scale.set(1.15, 0.9, 1)
  nariz.position.set(0, -0.02 * s, 0.29 * s)
  g.add(nariz)

  const er = (wide ? 0.05 : 0.04) * s
  const pr = (wide ? 0.017 : 0.02) * s
  for (const side of [-1, 1]) {
    const orelha = capsule(0.055 * s, 0.12 * s, BRANCO_SOMBRA, { roughness: 0.92 })
    orelha.position.set(side * 0.135 * s, -0.05 * s, -0.02 * s)
    orelha.rotation.z = side * 0.18
    g.add(orelha)

    const pompom = puff(0.075 * s, BRANCO, 4, seed + side * 3, { roughness: 0.92 })
    pompom.position.set(side * 0.15 * s, -0.165 * s, -0.01 * s)
    g.add(pompom)

    const esclera = sphere(er, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(side * 0.068 * s, 0.03 * s, 0.112 * s)
    g.add(esclera)

    const pupila = sphere(pr, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.066 * s, 0.03 * s, 0.112 * s + er * 0.62)
    g.add(pupila)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(77)

  // ---- calçada ---------------------------------------------------------------
  const calcada = new THREE.Group()

  const asfalto = rbox(4.2, 0.08, 2.8, 0.03, ASFALTO, { roughness: 0.95 })
  asfalto.position.y = 0.04
  calcada.add(asfalto)

  const leito = rbox(4.2, 0.08, 2.32, 0.02, JUNTA, { roughness: 0.9 })
  leito.position.set(0, 0.12, -0.24)
  calcada.add(leito)

  // lajotas quadradas com juntas
  const T = 0.47
  const P = 0.505
  for (let i = -4; i <= 3; i++) {
    for (let j = -3; j <= 1; j++) {
      const cor = LAJOTA[Math.floor(rand() * LAJOTA.length)]
      const laj = rbox(T, 0.03, T, 0.012, cor, { roughness: 0.85 })
      laj.position.set((i + 0.5) * P, 0.16, -0.24 + 0.0 + (j + 0.5) * P + 0.2)
      laj.rotation.y = (rand() - 0.5) * 0.02
      calcada.add(laj)
    }
  }

  root.add(calcada)

  // ---- meio-fio --------------------------------------------------------------
  const meiofio = new THREE.Group()
  const pedra = rbox(4.2, 0.19, 0.22, 0.035, MEIOFIO, { roughness: 0.85 })
  pedra.position.set(0, 0.095, 1.07)
  meiofio.add(pedra)
  for (let i = -3; i <= 3; i++) {
    const topo = rbox(0.57, 0.012, 0.2, 0.005, MEIOFIO_TOPO, { roughness: 0.85 })
    topo.position.set(i * 0.6, 0.19, 1.07)
    meiofio.add(topo)
  }
  root.add(meiofio)

  // ---- palco (não é peça): orienta o cachorro e os cones ---------------------
  const palco = new THREE.Group()
  palco.position.x = PALCO_X
  palco.rotation.y = PALCO_ROT
  root.add(palco)

  // ---- POODLE (corpo, patas, rabo) — anda para +x ---------------------------
  const poodle = new THREE.Group()
  poodle.position.set(0, GY, 0)
  palco.add(poodle)

  const ancas = capsule(0.15, 0.32, BRANCO, { roughness: 0.88 })
  ancas.rotation.z = Math.PI / 2
  ancas.position.set(-0.12, 0.76, 0)
  poodle.add(ancas)

  const juba = puff(0.22, BRANCO, 8, 12, { roughness: 0.93 })
  juba.scale.set(1.05, 1.08, 1.0)
  juba.position.set(0.19, 0.82, 0)
  poodle.add(juba)

  const pescoco = capsule(0.09, 0.26, BRANCO, { roughness: 0.88 })
  pescoco.rotation.z = -0.5
  pescoco.position.set(0.41, 1.1, 0)
  poodle.add(pescoco)

  // pompons dos quadris (tosa continental)
  for (const side of [-1, 1]) {
    const rosa = puff(0.115, BRANCO, 5, 20 + side, { roughness: 0.93 })
    rosa.position.set(-0.3, 0.8, side * 0.1)
    poodle.add(rosa)
  }

  // três patas de apoio (a quarta, dianteira próxima, é a peça 'pata')
  for (const [lx, lz] of [[0.24, -0.12], [-0.3, 0.12], [-0.3, -0.12]] as const) {
    const perna = capsule(0.055, 0.5, BRANCO_SOMBRA, { roughness: 0.88 })
    perna.position.set(lx, 0.36, lz)
    poodle.add(perna)

    const pulseira = puff(0.092, BRANCO, 5, 30 + lx * 10 + lz * 10, { roughness: 0.93 })
    pulseira.position.set(lx, 0.17, lz)
    poodle.add(pulseira)

    const pe = sphere(0.06, BRANCO_SOMBRA, { roughness: 0.88 })
    pe.scale.set(1.45, 0.62, 1)
    pe.position.set(lx + 0.03, 0.04, lz)
    poodle.add(pe)
  }

  // rabo empinado com pompom na ponta
  const rabo = capsule(0.038, 0.22, BRANCO_SOMBRA, { roughness: 0.88 })
  rabo.rotation.z = 0.5
  rabo.position.set(-0.5, 0.99, 0)
  poodle.add(rabo)

  const pompomRabo = puff(0.11, BRANCO, 6, 41, { roughness: 0.93 })
  pompomRabo.position.set(-0.58, 1.14, 0)
  poodle.add(pompomRabo)

  // ---- cabeça (peça própria: dobradiça no alto do pescoço) -------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(HEAD_PIVOT[0], HEAD_PIVOT[1], 0)
  cabeca.rotation.z = HEAD_UP
  poodle.add(cabeca)

  const rosto = poodleHead(1, 5)
  rosto.position.set(HEAD_OFF[0], HEAD_OFF[1], 0)
  rosto.rotation.y = Math.PI / 2 // +z da cabeça → +x do poodle
  cabeca.add(rosto)

  // ---- coleira vermelha ------------------------------------------------------
  const coleira = new THREE.Group()
  coleira.position.set(0.445, 1.16, 0)
  coleira.rotation.z = -0.5
  poodle.add(coleira)

  const tira = cylinder(0.104, 0.1, 0.065, COLEIRA, { roughness: 0.5 }, 40)
  coleira.add(tira)

  const argola = cylinder(0.012, 0.012, 0.02, PLAQUINHA, { roughness: 0.25, metalness: 0.8 })
  argola.rotation.z = Math.PI / 2
  argola.position.set(0.105, -0.02, 0)
  coleira.add(argola)

  const plaquinha = cylinder(0.035, 0.035, 0.012, PLAQUINHA, { roughness: 0.25, metalness: 0.8 })
  plaquinha.rotation.z = Math.PI / 2
  plaquinha.position.set(0.112, -0.065, 0)
  coleira.add(plaquinha)

  // ---- pata dianteira apontando (pivô no ombro) ------------------------------
  const pata = new THREE.Group()
  pata.position.set(0.24, 0.66, 0.12)
  pata.rotation.set(0, PATA_Y, PATA_Z)
  poodle.add(pata)

  const ombro = sphere(0.085, BRANCO, { roughness: 0.88 })
  ombro.position.y = -0.03
  pata.add(ombro)

  const canela = capsule(0.055, 0.5, BRANCO_SOMBRA, { roughness: 0.88 })
  canela.position.y = -0.3
  pata.add(canela)

  const pulseiraP = puff(0.092, BRANCO, 5, 33, { roughness: 0.93 })
  pulseiraP.position.y = -0.49
  pata.add(pulseiraP)

  const peP = sphere(0.06, BRANCO_SOMBRA, { roughness: 0.88 })
  peP.scale.set(1.45, 0.62, 1)
  peP.position.set(0.03, -0.62, 0)
  pata.add(peP)

  // ---- gotas de susto (saltam da cabeça) -------------------------------------
  const GOTAS_Y = 1.36
  const gotas = new THREE.Group()
  gotas.position.set(0.4, GOTAS_Y, 0.08)
  poodle.add(gotas)

  for (const [gx, gy, gz, gr] of [
    [-0.27, 0.22, 0.04, 0.65],
    [-0.06, 0.38, 0.08, 0.12],
    [0.17, 0.32, 0.12, -0.45],
  ] as const) {
    const gota = lathe(
      [[0, 0], [0.035, 0.008], [0.052, 0.035], [0.05, 0.065], [0.034, 0.1], [0.012, 0.135], [0, 0.15]],
      AZUL,
      { roughness: 0.15 },
    )
    gota.position.set(gx, gy, gz)
    gota.rotation.z = gr
    gotas.add(gota)
  }

  // ---- cone 1 (erguido pelo focinho) ----------------------------------------
  // ponta do nariz na pose final → a borda da placa do cone apoia nela
  const nose = rotZ(HEAD_OFF[0] + NOSE_LOCAL[0], HEAD_OFF[1] + NOSE_LOCAL[1], HEAD_UP)
  const noseX = HEAD_PIVOT[0] + nose[0]
  const noseY = HEAD_PIVOT[1] + nose[1] + 0.035
  const edge = rotZ(-C1_PLATE * 0.85, 0, C1_TILT)
  const C1_FINAL: [number, number, number] = [noseX - edge[0], GY + noseY - edge[1], 0.0]

  const cone1 = trafficCone()
  cone1.position.set(...C1_FINAL)
  cone1.rotation.z = C1_TILT
  palco.add(cone1)

  // ---- filhote idêntico, sentado onde estava o cone -------------------------
  const filhote = new THREE.Group()
  filhote.position.set(C1_GROUND[0], GY, C1_GROUND[1])
  filhote.rotation.y = -0.05
  palco.add(filhote)

  const filhoteCorpo = new THREE.Group() // escala do filhote (a peça anima a de fora)
  filhoteCorpo.scale.setScalar(1.1)
  filhote.add(filhoteCorpo)

  const ancasF = sphere(0.15, BRANCO, { roughness: 0.9 })
  ancasF.scale.set(1.1, 0.75, 1.05)
  ancasF.position.set(0, 0.11, -0.05)
  filhoteCorpo.add(ancasF)

  const corpoF = capsule(0.11, 0.1, BRANCO, { roughness: 0.9 })
  corpoF.rotation.x = -0.2
  corpoF.position.set(0, 0.26, 0)
  filhoteCorpo.add(corpoF)

  const jubaF = puff(0.13, BRANCO, 6, 51, { roughness: 0.93 })
  jubaF.position.set(0, 0.32, 0.05)
  filhoteCorpo.add(jubaF)

  for (const side of [-1, 1]) {
    const pernaF = capsule(0.034, 0.16, BRANCO_SOMBRA, { roughness: 0.88 })
    pernaF.position.set(side * 0.065, 0.12, 0.11)
    filhoteCorpo.add(pernaF)

    const pulseiraF = puff(0.055, BRANCO, 4, 60 + side, { roughness: 0.93 })
    pulseiraF.position.set(side * 0.067, 0.075, 0.115)
    filhoteCorpo.add(pulseiraF)

    const peF = sphere(0.038, BRANCO_SOMBRA, { roughness: 0.88 })
    peF.scale.set(1, 0.6, 1.4)
    peF.position.set(side * 0.067, 0.025, 0.14)
    filhoteCorpo.add(peF)

    const peTras = sphere(0.05, BRANCO_SOMBRA, { roughness: 0.88 })
    peTras.scale.set(0.85, 0.55, 1.4)
    peTras.position.set(side * 0.14, 0.03, 0.04)
    filhoteCorpo.add(peTras)
  }

  const pompomF = puff(0.07, BRANCO, 5, 66, { roughness: 0.93 })
  pompomF.position.set(0, 0.1, -0.22)
  filhoteCorpo.add(pompomF)

  const cabecaF = poodleHead(0.6, 9, true)
  cabecaF.position.set(0, 0.5, 0.05)
  cabecaF.rotation.x = -0.12
  filhoteCorpo.add(cabecaF)

  // ---- cone 2, levemente levantado na frente --------------------------------
  const C2_LIFT = C1_PLATE * Math.sin(-C2_TILT)
  const cone2 = trafficCone()
  cone2.position.set(C2[0], GY + C2_LIFT, C2[1])
  cone2.rotation.x = C2_TILT
  palco.add(cone2)

  // ---- focinho branco espiando por baixo do cone 2 ---------------------------
  const focinho2 = new THREE.Group()
  focinho2.position.set(C2[0], GY, C2[1])
  palco.add(focinho2)

  const testa2 = sphere(0.1, BRANCO, { roughness: 0.9 })
  testa2.scale.set(1.15, 0.7, 1)
  testa2.position.set(0, 0.075, 0.13)
  focinho2.add(testa2)

  const snout2 = capsule(0.042, 0.08, BRANCO, { roughness: 0.86 })
  snout2.rotation.x = Math.PI / 2
  snout2.position.set(0, 0.05, 0.25)
  focinho2.add(snout2)

  const nariz2 = sphere(0.03, PRETO, { roughness: 0.3 })
  nariz2.position.set(0, 0.055, 0.32)
  focinho2.add(nariz2)

  for (const side of [-1, 1]) {
    const olho = sphere(0.032, '#ffffff', { roughness: 0.25 })
    olho.scale.z = 0.6
    olho.position.set(side * 0.05, 0.1, 0.205)
    focinho2.add(olho)

    const pup = sphere(0.014, '#1a1a1a', { roughness: 0.2 })
    pup.position.set(side * 0.05, 0.1, 0.225)
    focinho2.add(pup)

    const patinha = sphere(0.045, BRANCO, { roughness: 0.9 })
    patinha.scale.set(1, 0.6, 1.3)
    patinha.position.set(side * 0.12, 0.025, 0.25)
    focinho2.add(patinha)
  }

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'calcada', group: 'calcada', object: calcada },
    { name: 'meiofio', group: 'calcada', object: meiofio },
    { name: 'cone1', group: 'cones', object: cone1 },
    { name: 'cone2', group: 'cones', object: cone2 },
    { name: 'poodle', group: 'poodle', object: poodle },
    { name: 'cabeca', group: 'poodle', object: cabeca },
    { name: 'pata', group: 'poodle', object: pata },
    { name: 'coleira', group: 'poodle', object: coleira },
    { name: 'gotas', group: 'susto', object: gotas },
    { name: 'filhote', group: 'irmao', object: filhote },
    { name: 'focinho2', group: 'irmaos', object: focinho2 },
  ]

  // ---- montagem --------------------------------------------------------------
  const [c1x, c1z] = C1_GROUND
  const build = [
    seq('calcada-rise', 'calcada', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma calçada de lajotas cinza sobe do chão, com o meio-fio na borda.',
    }),
    seq('meiofio-rise', 'meiofio', 0.25, 0.7, [riseFrom(0, 0.6)], { ease: 'easeOut' }),

    seq('cone1-rise', 'cone1', 1.4, 0.6, [
      ch('position.y', GY - 1.0, GY),
      ch('position.x', c1x, c1x),
      ch('position.z', c1z, c1z),
    ], {
      ease: 'easeOut',
      caption: 'Dois CONES laranja de trânsito brotam na calçada.',
    }),
    seq('cone2-rise', 'cone2', 1.6, 0.6, [riseFrom(GY, 1.0)], { ease: 'easeOut' }),

    seq('poodle-rise', 'poodle', 2.9, 0.9, [riseFrom(GY, 1.8)], {
      ease: 'easeOut',
      caption: 'Um poodle branco, tosado de pompons, desfila achando que é ÚNICO no mundo.',
    }),
    seq('cabeca-empina', 'cabeca', 2.9, 1.0, [ch('rotation.z', -0.25, HEAD_PROUD)], { ease: 'easeOut' }),
    seq('pata-passo', 'pata', 2.9, 1.0, [ch('rotation.z', 0.3, 0)], { ease: 'easeOut' }),
    seq('coleira-pop', 'coleira', 3.7, 0.35, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('cone1-mexe-a', 'cone1', 4.9, 0.15, [ch('rotation.y', 0, 0.35)], {
      ease: 'easeOut',
      caption: 'Mas o cone bem na frente dele se mexe sozinho…',
    }),
    seq('cone1-mexe-b', 'cone1', 5.05, 0.2, [ch('rotation.y', 0.35, -0.35)], { ease: 'easeInOut' }),
    seq('cone1-mexe-c', 'cone1', 5.25, 0.18, [ch('rotation.y', -0.35, 0.2)], { ease: 'easeInOut' }),
    seq('cone1-mexe-d', 'cone1', 5.43, 0.15, [ch('rotation.y', 0.2, 0)], { ease: 'easeIn' }),

    seq('cabeca-late', 'cabeca', 6.1, 0.15, [ch('rotation.z', HEAD_PROUD, -0.08)], {
      ease: 'easeOut',
      caption: 'Ele late rouco pro cone — RRÁR! — e aponta a pata: DÜ?',
    }),
    seq('cabeca-volta', 'cabeca', 6.25, 0.25, [ch('rotation.z', -0.08, HEAD_PROUD)], { ease: 'easeInOut' }),
    seq('pata-aponta', 'pata', 6.6, 0.5, [ch('rotation.z', 0, PATA_Z), ch('rotation.y', 0, PATA_Y)], {
      ease: 'easeOut',
    }),

    seq('cone1-pula', 'cone1', 7.6, 0.25, [ch('position.y', GY, GY + 0.35)], {
      ease: 'easeOut',
      caption: 'O cone dá um pulo — SÜS(to)! — e três gotas de SUSTO saltam da cabeça dele.',
    }),
    seq('cone1-cai', 'cone1', 7.85, 0.25, [ch('position.y', GY + 0.35, GY)], { ease: 'easeIn' }),
    seq('gotas-saltam', 'gotas', 7.75, 0.4, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('position.y', GOTAS_Y - 0.2, GOTAS_Y),
    ], { ease: 'easeOut' }),

    seq('cabeca-mergulha', 'cabeca', 9.0, 0.35, [ch('rotation.z', HEAD_PROUD, HEAD_DIP)], {
      ease: 'easeInOut',
      caption: 'Ele ergue o CÓN(e) com o focinho: embaixo, um poodle filhote IDÊNTICO, de olhos arregalados!',
    }),
    seq('cabeca-ergue', 'cabeca', 9.35, 0.6, [ch('rotation.z', HEAD_DIP, HEAD_UP)], { ease: 'easeOut' }),
    seq('cone1-ergue', 'cone1', 9.35, 0.6, [
      ch('position.x', c1x, C1_FINAL[0]),
      ch('position.y', GY, C1_FINAL[1]),
      ch('position.z', c1z, C1_FINAL[2]),
      ch('rotation.z', 0, C1_TILT),
    ], { ease: 'easeOut' }),
    seq('filhote-aparece', 'filhote', 9.45, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('cone2-levanta', 'cone2', 10.6, 0.4, [
      ch('rotation.x', 0, C2_TILT),
      ch('position.y', GY, GY + C2_LIFT),
    ], {
      ease: 'easeOut',
      caption: 'No outro CONE, mais um focinho branco espia — cada cone esconde um irmão.',
    }),
    seq('focinho2-espia', 'focinho2', 10.8, 0.5, [ch('position.z', C2[1] - 0.22, C2[1])], { ease: 'easeOut' }),

    seq('filhote-pula', 'filhote', 12.0, 0.18, [ch('position.y', GY, GY + 0.14)], {
      ease: 'easeOut',
      caption: 'Har du syskon? — Você tem irmãos?',
    }),
    seq('filhote-pousa', 'filhote', 12.18, 0.22, [ch('position.y', GY + 0.14, GY)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 1.95, 4.15], target: [0.4, 0.93, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'har-du-syskon',
    contexto: 
      "Small talk: conversa de quem está se conhecendo — colega novo, encontro, pais no parquinho, a professora perguntando à criança na förskola. 'Syskon' junta irmãos e irmãs sem gênero e aparece em todo formulário de escola e da Försäkringskassan. A resposta: 'Ja, jag har en bror och två systrar' ou 'Nej, jag är enda barnet' (sou filho único).",
    fraseFonte: 'Você tem irmãos?',
    fraseAlvo: 'Har du syskon?',
    pronuncia: 
      "rrar-dü SÜS-kon? ('har du' emendado, o R brando grudando no D; 'syskon' com a força no SYS: Ü de BICO — lábios de U e língua de I ao mesmo tempo, CURTO — e S de cobra, nunca o 'sh' carioca; o 'kon' sai mais leve, com Ó aberto e curto e sem nasal)",
    ponteSonora: 
      "RRÁR-DÜ... SÜS(to)! CÓN(e)? (4 sílabas: rrar-dü-SÜS-kon; força no SÜS, com o CÓN mais leve logo atrás; RRÁR-DÜ = o 'har du' de sempre — o MESMO de 'Har du tid en stund?', 'Har du lust att ses?' e 'Har du borstat tänderna?' —, aqui o latido rouco do poodle: h soprado, A longo e R BRANDO que derrete direto no D (rrá-dü) — sem ele sobra 'ha'; DÜ com BICO de pato, a pata apontada pro cone; SÜS(to) = o SUSTO sem o -TO, mas com a vogal do 'y' sueco: lábios em BICO de U e língua parada no I ao MESMO tempo — o mesmo Ü do BÜÜ de 'byta' e do LÜ de 'lycka', e CURTO como no LÜ; os dois S são de cobra, sibilantes: nada do 'sush' carioca, nada de Z; com o U chapado de 'susto' sai 'suskon', que não existe; CÓN(e) = o CONE de trânsito sem o -e, emendado direto no S, sem pausa: SÜS-kon; Ó ABERTO de 'só', curto, e N de ponta de língua — nem o 'cô' fechado de 'cone' nem o 'cõ' nasal de 'conde')",
    historia: 
      "Um poodle branco, tosado de pompons, desfila pela calçada achando que é único no mundo. Um cone laranja de trânsito ao lado dele se mexe sozinho: ele late rouco — RRÁR! —, aponta a pata — DÜ? — e o cone dá um pulo. SUSTO! O poodle levanta o CONE com o focinho e embaixo encontra um poodle idêntico, de pompons iguaizinhos; no cone seguinte, mais um focinho branco. Cada cone esconde um irmão — e ele, que se achava filho único, descobre que tem irmãos.",
  },
  createScene,
  refine: { organic: ['poodle', 'cabeca', 'pata', 'filhote', 'focinho2'] },
}

export default card
