import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, rock, puff, person,
} from '../rig/helpers'

/**
 * "Är det till höger eller till vänster?" — a bifurcação em Y.
 *
 * ORIENTAÇÃO (crítica nesta carta): a câmera fica em +z olhando para -z, logo
 * +x é a DIREITA DA TELA. A RÉGUA (höger = direita) vive em x positivo; o
 * MACACO (vänster = esquerda) vive em x negativo. Não espelhar.
 *
 * Diorama: clareira de terra batida com trilha em Y; o viajante de mochila
 * trava no vértice; à direita brota a RÉGUA amarela gigante apontando o
 * caminho (RRÊ-GUER, com bico); no meio o LIVRO aberto cobra É-LER; à
 * esquerda um MACACO pendurado pelo rabo estica o braço comprido até o ombro
 * dele — VENS TER comigo!
 */

const SOIL_DARK = '#6b5138'
const SOIL = '#8a6f4a'
const PATH = '#b9a077'
const MOSS = '#4e7a3f'
const MOSS_DARK = '#3c6633'
const BLUE = '#3a6ea8'
const BLUE_DARK = '#2f5b93'
const CLOTH = '#3f6b8a'
const SKIN = '#e8c39e'
const FUR = '#7a5233'
const FUR_LIGHT = '#a8794c'
const PAW = '#5a3a22'
const WOOD = '#6e4a28'
const YELLOW = '#f2c02e' // acento saturado: RESERVADO à RÉGUA (höger)

const GY = 0.18 // topo da base do diorama

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: clareira em Y de terra batida ---------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, SOIL_DARK, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const ground = cylinder(2.55, 2.62, 0.07, SOIL, { roughness: 0.92 })
  ground.position.y = 0.145
  base.add(ground)

  // trilha em Y: haste na frente, dois ramos abrindo ao fundo
  const stem = rbox(0.58, 0.04, 1.7, 0.02, PATH, { roughness: 0.9 })
  stem.position.set(0.05, GY + 0.005, 1.15)
  base.add(stem)

  const branchR = rbox(0.5, 0.04, 1.95, 0.02, PATH, { roughness: 0.9 })
  branchR.position.set(0.85, GY + 0.005, -0.72)
  branchR.rotation.y = -0.62
  base.add(branchR)

  const branchL = rbox(0.5, 0.04, 1.95, 0.02, PATH, { roughness: 0.9 })
  branchL.position.set(-0.85, GY + 0.005, -0.72)
  branchL.rotation.y = 0.62
  base.add(branchL)

  // pedra cinza no vértice da forquilha
  const pedra = rock(0.24, '#8d9296', 31, { roughness: 0.9 })
  pedra.position.set(0.42, GY + 0.11, -0.2)
  pedra.rotation.y = rand() * Math.PI
  base.add(pedra)

  const pedrinha = rock(0.12, '#7e8489', 32, { roughness: 0.9 })
  pedrinha.position.set(-0.55, GY + 0.05, 0.62)
  pedrinha.rotation.y = rand() * Math.PI
  base.add(pedrinha)

  // três arbustos verde-musgo nas bordas
  for (const [bx, bz, br, bs] of [
    [-2.02, -0.75, 0.32, 41],
    [2.08, 0.55, 0.26, 42],
    [-1.15, 1.72, 0.22, 43],
  ] as const) {
    const bush = puff(br, bs === 42 ? MOSS_DARK : MOSS, 6, bs, { roughness: 0.9 })
    bush.position.set(bx, GY + br * 0.6, bz)
    bush.rotation.y = rand() * Math.PI
    base.add(bush)
  }

  // tufos de capim soltos
  for (const [tx, tz] of [[1.55, 1.45], [-1.85, 0.85], [1.05, -1.85], [-0.35, -1.9]] as const) {
    const tuft = cone(0.09, 0.26, MOSS, { roughness: 0.9 })
    tuft.position.set(tx, GY + 0.13, tz)
    tuft.rotation.set((rand() - 0.5) * 0.3, rand() * Math.PI, (rand() - 0.5) * 0.3)
    base.add(tuft)
  }
  root.add(base)

  // ---- viajante de mochila, travado na dúvida ------------------------------
  const ALTURA = 1.45
  const pessoa = person({ body: CLOTH, skin: SKIN, height: ALTURA, armAngle: 1.05 })
  pessoa.position.set(0.3, GY, 1.75) // à frente e de lado: não tampa o livro
  pessoa.rotation.y = 2.45 // pose final: virado para a RÉGUA, à direita

  // adereços modelados para altura 1.7; k reescala para a altura real
  const k = ALTURA / 1.7
  const mochila = rbox(0.46 * k, 0.54 * k, 0.26 * k, 0.09 * k, MOSS_DARK, { roughness: 0.9 })
  mochila.position.set(0, 0.6 * k, -0.3 * k)
  pessoa.add(mochila)

  const flap = rbox(0.4 * k, 0.16 * k, 0.1 * k, 0.04 * k, '#2f5228', { roughness: 0.9 })
  flap.position.set(0, 0.78 * k, -0.4 * k)
  pessoa.add(flap)

  const bolso = rbox(0.3 * k, 0.18 * k, 0.06 * k, 0.03 * k, '#2f5228', { roughness: 0.9 })
  bolso.position.set(0, 0.46 * k, -0.44 * k)
  pessoa.add(bolso)

  for (const side of [-1, 1]) {
    const strap = rbox(0.08 * k, 0.42 * k, 0.08 * k, 0.03 * k, '#2f5228', { roughness: 0.9 })
    strap.position.set(side * 0.15 * k, 0.68 * k, -0.09 * k)
    strap.rotation.x = 0.12
    pessoa.add(strap)
  }

  // cabelo: calota cobrindo o alto e a nuca (ele está de costas para a câmera)
  const headR = ALTURA * 0.19
  const cabecaPessoa = pessoa.getObjectByName('head')!
  const cabelo = sphere(headR * 1.06, '#3b2a1e', { roughness: 0.85 })
  cabelo.position.set(0, headR * 0.2, -headR * 0.16)
  cabelo.scale.set(1, 0.86, 0.98)
  cabecaPessoa.add(cabelo)
  const topete = puff(headR * 0.4, '#3b2a1e', 4, 44, { roughness: 0.85 })
  topete.position.set(0, headR * 0.92, headR * 0.2)
  cabecaPessoa.add(topete)
  root.add(pessoa)

  // ---- RÉGUA amarela gigante: DIREITA da tela (x positivo, höger) ----------
  const regua = new THREE.Group()
  regua.position.set(1.15, GY, -0.5)
  regua.rotation.y = 0.4
  regua.rotation.z = -0.45 // topo inclinado para +x = aponta para a DIREITA

  const lamina = rbox(0.34, 2.3, 0.1, 0.035, YELLOW, { roughness: 0.4 })
  lamina.position.y = 1.15
  regua.add(lamina)

  const bisel = rbox(0.36, 0.09, 0.12, 0.03, '#c99a1d', { roughness: 0.45 })
  bisel.position.y = 0.1
  regua.add(bisel)

  for (let i = 1; i <= 10; i++) {
    const longo = i % 2 === 0
    const tick = rbox(longo ? 0.19 : 0.11, 0.028, 0.02, 0.008, '#3a2f1c', { roughness: 0.5 })
    tick.position.set(-0.17 + (longo ? 0.095 : 0.055), 0.22 + i * 0.19, 0.055)
    regua.add(tick)
  }

  const ponta = cone(0.28, 0.42, YELLOW, { roughness: 0.4 })
  ponta.position.y = 2.5
  regua.add(ponta)
  root.add(regua)

  // ---- LIVRO gigante aberto em V, lombada azul (vértice da forquilha) ------
  const livro = new THREE.Group()
  livro.position.set(-0.05, GY, -0.95)
  livro.rotation.y = 0.1
  livro.scale.setScalar(1.25) // do tamanho de uma porta

  const lombada = rbox(0.2, 1.3, 0.22, 0.07, BLUE_DARK, { roughness: 0.55 })
  lombada.position.y = 0.68
  livro.add(lombada)

  function metade(side: 1 | -1) {
    const half = new THREE.Group()
    half.position.y = 0.68
    half.rotation.y = -side * 0.5 // aberto em V, abrindo para a câmera

    const capa = rbox(0.9, 1.26, 0.08, 0.03, BLUE, { roughness: 0.55 })
    capa.position.x = side * 0.5
    half.add(capa)

    const folhas = rbox(0.8, 1.16, 0.05, 0.02, '#efe7d6', { roughness: 0.7 })
    folhas.position.set(side * 0.5, 0, 0.062)
    half.add(folhas)

    for (let i = 0; i < 5; i++) {
      const linha = rbox(0.52, 0.035, 0.02, 0.008, '#8a7f6c', { roughness: 0.7 })
      linha.position.set(side * 0.5, 0.36 - i * 0.19, 0.092)
      half.add(linha)
    }
    return half
  }

  const metadeE = metade(-1)
  livro.add(metadeE)

  const folha = metade(1) // peça própria: a página que ABRE
  livro.add(folha)

  const fita = rbox(0.07, 0.5, 0.02, 0.01, '#c94f3d', { roughness: 0.85 })
  fita.position.set(0, 0.42, 0.14)
  livro.add(fita)
  root.add(livro)

  // ---- galho torto atravessando o ramo ESQUERDO ----------------------------
  const galho = new THREE.Group()
  galho.position.set(-2.15, GY, -0.6)

  const tronco = cylinder(0.15, 0.24, 2.15, WOOD, { roughness: 0.8 })
  tronco.position.set(0, 1.07, 0)
  tronco.rotation.z = 0.07
  galho.add(tronco)

  const raiz = cylinder(0.32, 0.42, 0.16, '#5a3c20', { roughness: 0.85 })
  raiz.position.y = 0.08
  galho.add(raiz)

  const limbo1 = capsule(0.1, 0.85, WOOD, { roughness: 0.8 })
  limbo1.position.set(0.38, 1.98, 0.12)
  limbo1.rotation.set(0.18, 0, -1.2)
  galho.add(limbo1)

  const limbo2 = capsule(0.082, 0.72, WOOD, { roughness: 0.8 })
  limbo2.position.set(1.05, 2.15, 0.3)
  limbo2.rotation.set(0.1, 0, -1.42)
  galho.add(limbo2)

  const gravetos = capsule(0.05, 0.36, WOOD, { roughness: 0.8 })
  gravetos.position.set(1.42, 2.28, 0.42)
  gravetos.rotation.set(0.2, 0, -0.75)
  galho.add(gravetos)

  for (const [lx, ly, lz, lr, ls] of [
    [0.28, 2.24, -0.16, 0.3, 51],
    [0.95, 2.36, 0.05, 0.26, 52],
    [1.55, 2.42, 0.42, 0.22, 53],
  ] as const) {
    const copa = puff(lr, ls === 52 ? MOSS_DARK : MOSS, 5, ls, { roughness: 0.9 })
    copa.position.set(lx, ly, lz)
    galho.add(copa)
  }
  root.add(galho)

  // ---- MACACO pendurado pelo rabo: ESQUERDA da tela (x negativo, vänster) --
  const macaco = new THREE.Group()
  macaco.position.set(-1.35, 2.12, -0.25) // origem = gancho do rabo no galho
  macaco.rotation.z = -0.05

  const rabo = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.34, -0.02, 0),
        new THREE.Vector3(0.26, 0.2, 0.02),
        new THREE.Vector3(0.0, 0.28, 0),
        new THREE.Vector3(-0.18, 0.1, 0),
        new THREE.Vector3(-0.1, -0.14, 0),
        new THREE.Vector3(0.0, -0.34, 0),
      ]),
      36,
      0.055,
      12,
      false,
    ),
    mat(FUR, { roughness: 0.8, size: 0.7 }),
  )
  rabo.castShadow = true
  rabo.receiveShadow = true
  macaco.add(rabo)

  const corpo = capsule(0.24, 0.42, FUR, { roughness: 0.8 })
  corpo.position.y = -0.62
  macaco.add(corpo)

  const barriga = capsule(0.14, 0.24, FUR_LIGHT, { roughness: 0.85 })
  barriga.position.set(0, -0.62, 0.15)
  barriga.scale.z = 0.55
  macaco.add(barriga)

  // pernas dobradas para cima (ele está de cabeça para baixo)
  for (const side of [-1, 1]) {
    const perna = capsule(0.075, 0.3, FUR, { roughness: 0.8 })
    perna.position.set(side * 0.17, -0.2, 0.04)
    perna.rotation.z = side * 0.35
    const pe = sphere(0.085, PAW, { roughness: 0.8 })
    pe.position.y = 0.2
    perna.add(pe)
    macaco.add(perna)
  }

  // braço livre (o comprido é peça separada, do lado do viajante)
  const bracoLivre = capsule(0.068, 0.34, FUR, { roughness: 0.8 })
  bracoLivre.position.set(-0.26, -0.62, 0.05)
  bracoLivre.rotation.z = 0.45
  const maoLivre = sphere(0.085, PAW, { roughness: 0.8 })
  maoLivre.position.y = -0.24
  bracoLivre.add(maoLivre)
  macaco.add(bracoLivre)

  const cabeca = sphere(0.26, FUR, { roughness: 0.8 })
  cabeca.position.set(0, -1.2, 0.02)
  macaco.add(cabeca)

  const focinho = sphere(0.15, FUR_LIGHT, { roughness: 0.8 })
  focinho.position.set(0, -1.25, 0.19)
  focinho.scale.set(1, 0.8, 0.75)
  macaco.add(focinho)

  const narinas = sphere(0.04, PAW, { roughness: 0.6 })
  narinas.position.set(0, -1.2, 0.3)
  narinas.scale.set(1.6, 0.6, 0.5)
  macaco.add(narinas)

  const boca = rbox(0.13, 0.05, 0.04, 0.02, PAW, { roughness: 0.7 })
  boca.position.set(0, -1.33, 0.29)
  macaco.add(boca)

  for (const side of [-1, 1]) {
    const olho = sphere(0.062, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.105, -1.1, 0.22)
    olho.scale.z = 0.6
    const pupila = sphere(0.031, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.105, -1.105, 0.26)
    macaco.add(olho, pupila)

    const orelha = sphere(0.095, FUR_LIGHT, { roughness: 0.8 })
    orelha.position.set(side * 0.27, -1.17, -0.02)
    orelha.scale.set(0.45, 1, 0.9)
    macaco.add(orelha)
  }
  root.add(macaco)

  // ---- braço comprido: do ombro do macaco até o ombro do viajante ----------
  const ombroMacaco = new THREE.Vector3(-1.11, 1.80, -0.17)
  // alvo = topo do ombro direito do viajante, na pose final
  pessoa.updateMatrixWorld(true)
  const alvoOmbro = pessoa.localToWorld(
    new THREE.Vector3(0.178 * ALTURA, 0.435 * ALTURA, 0.06 * ALTURA),
  )
  const ARM_LEN = ombroMacaco.distanceTo(alvoOmbro) // braço comprido do macaco

  const braco = new THREE.Group()
  braco.position.copy(ombroMacaco)
  root.add(braco)
  braco.lookAt(alvoOmbro) // eixo local +z aponta para o viajante

  const junta = sphere(0.1, FUR, { roughness: 0.8 })
  braco.add(junta)

  const haste = capsule(0.068, ARM_LEN - 0.3, FUR, { roughness: 0.8 })
  haste.rotation.x = Math.PI / 2
  haste.position.z = ARM_LEN / 2
  braco.add(haste)

  const cotovelo = sphere(0.082, FUR, { roughness: 0.8 })
  cotovelo.position.z = ARM_LEN * 0.55
  braco.add(cotovelo)

  // mão em concha
  const palma = sphere(0.13, PAW, { roughness: 0.8 })
  palma.position.z = ARM_LEN
  palma.scale.set(1.1, 1, 0.6)
  braco.add(palma)

  for (let i = 0; i < 4; i++) {
    const ang = -0.9 + i * 0.6
    const dedo = capsule(0.028, 0.1, PAW, { roughness: 0.8 })
    dedo.position.set(Math.cos(ang) * 0.12, Math.sin(ang) * 0.12, ARM_LEN + 0.08)
    dedo.rotation.set(1.1, 0, -ang)
    braco.add(dedo)
  }

  const polegar = capsule(0.03, 0.09, PAW, { roughness: 0.8 })
  polegar.position.set(-0.13, -0.05, ARM_LEN + 0.03)
  polegar.rotation.set(0.9, 0, 0.6)
  braco.add(polegar)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'pessoa', group: 'viajante', object: pessoa },
    { name: 'regua', group: 'regua', object: regua },
    { name: 'livro', group: 'livro', object: livro },
    { name: 'folha', group: 'livro', object: folha },
    { name: 'galho', group: 'macaco', object: galho },
    { name: 'macaco', group: 'macaco', object: macaco },
    { name: 'braco', group: 'braco', object: braco },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      caption: 'A trilha de terra batida brota do chão e se abre num Y…',
    }),

    seq('pessoa-rise', 'pessoa', 1.7, 0.8, [riseFrom(GY, 1.7)], {
      caption: '…você chega de mochila e trava na forquilha: direita ou esquerda?',
    }),

    seq('regua-rise', 'regua', 3.5, 0.85, [riseFrom(GY, 3.15)], {
      caption: 'À DIREITA finca-se uma RÉGUA amarela gigante apontando o caminho: til RRÊ-GUER!',
    }),
    seq('regua-plant', 'regua', 4.45, 0.6, [ch('rotation.z', -0.68, -0.45)], {
      caption: 'Diga RRÊ-GUER com BICO nos lábios — sem bico vira "häger", que é GARÇA.',
    }),

    seq('livro-rise', 'livro', 5.9, 0.8, [riseFrom(GY, 1.8)]),
    seq('folha-open', 'folha', 6.0, 1.0, [ch('rotation.y', 1.35, -0.5)], {
      caption: 'No meio da forquilha um LIVRO do tamanho de uma porta se abre e cobra: É-LER!',
    }),

    seq('galho-rise', 'galho', 7.8, 0.85, [riseFrom(GY, 2.9)]),
    seq(
      'macaco-drop',
      'macaco',
      8.0,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        caption: 'À ESQUERDA, um MACACO se desenrola do galho e fica pendurado pelo rabo…',
      },
    ),
    seq('macaco-swing', 'macaco', 8.85, 0.7, [ch('rotation.z', 0.2, -0.05)]),

    seq(
      'braco-stretch',
      'braco',
      9.9,
      0.85,
      [ch('scale.z', 0.03, 1)],
      {
        caption: '…e estica o braço comprido até o seu ombro, mão em concha: VENS TER comigo! (til VÉNS-ter)',
      },
    ),
    seq('mao-chama-a', 'braco', 10.9, 0.35, [ch('scale.z', 1, 0.93)]),
    seq('pessoa-vira', 'pessoa', 11.0, 0.7, [ch('rotation.y', 2.95, 2.45)], {
      caption: 'Är det till höger eller till vänster? — "É à direita ou à esquerda?"',
    }),
    seq('mao-chama-b', 'braco', 11.25, 0.45, [ch('scale.z', 0.93, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 3.5, 6.1], target: [0, 1.15, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'hoger-eller-vanster',
    contexto: 'Logo depois de pedir a direção, quando a explicação foi rápida demais.',
    fraseFonte: 'É à direita ou à esquerda?',
    fraseAlvo: 'Är det till höger eller till vänster?',
    pronuncia:
      "É de til RRÊ-guer É-ler til VÉNS-ter? ('höger' com H soprado e ö arredondado)",
    ponteSonora:
      "É DÊ TIL RRÊ-GUER, É-LER, TIL VÉNS-TER (10 sílabas; RRÊ-GUER = a RÉGUA à carioca — esse RR JÁ é o h de 'höger' — mas com BICO: o É FECHA e arredonda em ö; sem o bico vira 'häger', que é GARÇA; o -guer termina em R BRANDO; É-LER com tônica no É; VÉNS-TER = 'vens ter', ä bem aberto, tônica no VÉNS)",
    historia:
      "Na bifurcação, uma RÉGUA amarela do tamanho de um poste está fincada apontando para a DIREITA — mas faça bico ao dizer RRÊ-GUER, senão vira 'häger', que é garça. No meio da forquilha, um livro aberto do tamanho de uma porta cobra: É-LER! E na ESQUERDA um macaco de braço comprido estica o braço de galho em galho e chama com a mão em concha, em português de novela antiga: VENS TER comigo!",
  },
  createScene,
}

export default card
