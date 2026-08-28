import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, person,
  rbox, capsule, cylinder, sphere, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vi ses!" — VI SÊSS ~ "VI SEIS".
 *
 * Diorama: corredor de prédio com capacho. Você acena tchau; a porta do vizinho
 * abre e de dentro do escuro telescopa um braço verde-menta gigante com uma mão
 * de SEIS dedos-cobrinha em leque. Ao lado, um 6 amarelo (acento) brota do chão
 * e as seis línguas rosa saem sibilando "SSSSS".
 */

const MINT = '#5fae8b'        // braço e palma
const MINT_LIGHT = '#7fc9a4'  // dedos-cobrinha
const MINT_DARK = '#3f8a6b'   // punho e escamas
const CREAM = '#e3d5b8'       // folha da porta
const CREAM_DARK = '#c4b08a'  // marco
const WOOD = '#5c4a38'        // piso do corredor
const WOOD_LIGHT = '#8a6642'  // tábuas e listras do capacho
const YELLOW = '#f4b41a'      // acento reservado: o número SEIS
const PINK = '#d76a80'        // línguas
const SKIN = '#e8c39e'
const GY = 0.16 // topo da base do diorama

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: corredor com capacho --------------------------------
  const base = new THREE.Group()

  const floor = cylinder(2.6, 2.7, 0.12, WOOD, { roughness: 0.85 })
  floor.position.y = 0.06
  base.add(floor)

  const boards = cylinder(2.5, 2.56, 0.08, '#6f5740', { roughness: 0.75 })
  boards.position.y = 0.12
  base.add(boards)

  // capacho listrado na frente da porta
  const mat0 = rbox(1.2, 0.06, 0.72, 0.03, '#6b4a30', { roughness: 0.95 })
  mat0.position.set(0.9, GY + 0.03, -0.5)
  base.add(mat0)
  for (let i = 0; i < 3; i++) {
    const stripe = rbox(1.02, 0.02, 0.1, 0.01, WOOD_LIGHT, { roughness: 0.95 })
    stripe.position.set(0.9, GY + 0.065, -0.72 + i * 0.22)
    base.add(stripe)
  }

  // adereços do corredor (rng fixo)
  const pot = lathe(
    [[0, 0], [0.2, 0], [0.24, 0.1], [0.21, 0.3], [0.25, 0.36], [0.24, 0.4], [0, 0.4]],
    '#a8583f',
    { roughness: 0.5 },
  )
  pot.position.set(-2.0, GY, -0.95)
  pot.rotation.y = rand() * Math.PI
  base.add(pot)
  const leaves = puff(0.28, '#3f7d4a', 6, 31, { roughness: 0.9 })
  leaves.position.set(-2.0, GY + 0.62, -0.95)
  base.add(leaves)

  for (const side of [-1, 1]) {
    const shoe = rbox(0.16, 0.11, 0.34, 0.05, '#3b3a38', { roughness: 0.7 })
    shoe.position.set(-0.35 + side * 0.11, GY + 0.055, -1.4 + rand() * 0.05)
    shoe.rotation.y = side * 0.14
    base.add(shoe)
  }

  const jornal = cylinder(0.07, 0.075, 0.42, '#ddd6c4', { roughness: 0.9 })
  jornal.position.set(1.9, GY + 0.07, -0.95)
  jornal.rotation.set(0, rand() * Math.PI, Math.PI / 2)
  base.add(jornal)

  root.add(base)

  // ---- você, acenando no corredor ------------------------------------------
  const pessoa = person({ body: '#4a6274', skin: SKIN, height: 1.5, armAngle: 0.35 })
  pessoa.position.set(-1.65, GY, -0.45)
  pessoa.rotation.y = 1.3 // olha para a porta (olhos em +z local)
  const aceno = pessoa.getObjectByName('armR')!
  aceno.rotation.z = -2.45 // pose final: braço no alto, acenando
  root.add(pessoa)

  // ---- porta do vizinho ----------------------------------------------------
  const marco = new THREE.Group()
  marco.position.set(0.9, GY, -1.2)

  for (const side of [-1, 1]) {
    const post = rbox(0.16, 2.25, 0.24, 0.04, CREAM_DARK, { roughness: 0.7 })
    post.position.set(side * 0.63, 1.125, 0)
    marco.add(post)
  }
  const lintel = rbox(1.56, 0.2, 0.24, 0.04, CREAM_DARK, { roughness: 0.7 })
  lintel.position.set(0, 2.16, 0)
  marco.add(lintel)

  const soleira = rbox(1.34, 0.06, 0.3, 0.02, WOOD_LIGHT, { roughness: 0.8 })
  soleira.position.set(0, 0.03, 0)
  marco.add(soleira)

  // interior escuro do apartamento: é dele que o braço sai
  const vao = rbox(1.14, 2.1, 0.08, 0.02, '#221f1c', { roughness: 0.95 })
  vao.position.set(0, 1.08, -0.14)
  marco.add(vao)
  root.add(marco)

  // folha: pivô na dobradiça do batente esquerdo
  const folha = new THREE.Group()
  folha.position.set(-0.55, 0, 0.07)
  folha.rotation.y = -1.15 // pose final: entreaberta, abrindo para a câmera

  const leaf = rbox(1.06, 2.04, 0.09, 0.03, CREAM, { roughness: 0.6 })
  leaf.position.set(0.53, 1.07, 0)
  folha.add(leaf)
  for (const py of [0.66, 1.48]) {
    const inset = rbox(0.66, 0.6, 0.03, 0.02, CREAM_DARK, { roughness: 0.65 })
    inset.position.set(0.53, py, 0.055)
    folha.add(inset)
  }
  const knob = sphere(0.075, '#b08b4a', { roughness: 0.25, metalness: 0.75 })
  knob.position.set(0.94, 1.05, 0.09)
  folha.add(knob)
  marco.add(folha)

  // ---- braço verde-menta saindo do vão -------------------------------------
  const braco = new THREE.Group()
  braco.position.set(0.75, 1.3, -1.05)
  braco.rotation.y = 0.5 // aponta para fora, na direção da câmera

  const forearm = capsule(0.135, 0.86, MINT, { roughness: 0.6 })
  forearm.rotation.x = Math.PI / 2
  forearm.position.z = 0.55
  braco.add(forearm)

  const punho = cylinder(0.17, 0.17, 0.12, MINT_DARK, { roughness: 0.85 })
  punho.rotation.x = Math.PI / 2
  punho.position.z = 1.0
  braco.add(punho)

  // ---- mão: palma + seis dedos-cobrinha ------------------------------------
  const mao = new THREE.Group()
  mao.position.set(0, 0, 1.18)
  braco.add(mao)

  const palma = rbox(0.56, 0.5, 0.22, 0.1, MINT, { roughness: 0.6 })
  palma.position.set(0, 0.06, 0)
  mao.add(palma)
  const palmaLinha = rbox(0.34, 0.05, 0.03, 0.02, MINT_DARK, { roughness: 0.75 })
  palmaLinha.position.set(0, 0.02, 0.115)
  mao.add(palmaLinha)

  const ANGLES = [-0.95, -0.57, -0.19, 0.19, 0.57, 0.95]
  const LENS = [0.5, 0.6, 0.66, 0.66, 0.6, 0.5]

  const dedos = new THREE.Group()
  dedos.position.set(0, 0.3, 0.03)
  mao.add(dedos)

  ANGLES.forEach((a, i) => {
    const L = LENS[i]
    const dedo = new THREE.Group()
    dedo.rotation.z = a

    // corpo em S: dois segmentos com curvatura alternada
    const seg1 = capsule(0.077, L * 0.34, MINT_LIGHT, { roughness: 0.55 })
    seg1.position.set(0.02, L * 0.27, 0)
    seg1.rotation.z = -0.16
    dedo.add(seg1)

    const seg2 = capsule(0.07, L * 0.3, MINT_LIGHT, { roughness: 0.55 })
    seg2.position.set(-0.02, L * 0.68, 0.01)
    seg2.rotation.z = 0.18
    dedo.add(seg2)

    // escamas
    for (let s = 0; s < 3; s++) {
      const scale = sphere(0.032, MINT_DARK, { roughness: 0.7 })
      scale.position.set(0, L * (0.22 + s * 0.2), 0.062)
      scale.scale.set(1.2, 0.6, 0.4)
      dedo.add(scale)
    }

    // cabecinha de cobra + olhos
    const cabeca = sphere(0.098, MINT_LIGHT, { roughness: 0.5 })
    cabeca.position.set(0, L, 0.02)
    cabeca.scale.set(0.95, 0.85, 1.2)
    dedo.add(cabeca)
    for (const side of [-1, 1]) {
      const eye = sphere(0.03, '#ffffff', { roughness: 0.2 })
      eye.position.set(side * 0.042, L + 0.03, 0.085)
      eye.scale.z = 0.6
      const pupil = sphere(0.014, '#141414', { roughness: 0.2 })
      pupil.position.set(side * 0.042, L + 0.03, 0.105)
      dedo.add(eye, pupil)
    }
    dedos.add(dedo)
  })

  // ---- línguas rosa sibilando (mesma moldura dos dedos) --------------------
  const linguas = new THREE.Group()
  linguas.position.set(0, 0.3, 0.03)
  mao.add(linguas)

  ANGLES.forEach((a, i) => {
    const L = LENS[i]
    const lingua = new THREE.Group()
    lingua.position.set(-Math.sin(a) * L, Math.cos(a) * L, 0.06)
    lingua.rotation.z = a

    const raiz = capsule(0.022, 0.09, PINK, { roughness: 0.45 })
    raiz.position.set(0, 0.1, 0.05)
    lingua.add(raiz)
    for (const side of [-1, 1]) {
      const tip = capsule(0.015, 0.08, PINK, { roughness: 0.45 })
      tip.position.set(side * 0.036, 0.2, 0.05)
      tip.rotation.z = -side * 0.36
      lingua.add(tip)
    }
    linguas.add(lingua)
  })
  root.add(braco)

  // ---- o SEIS amarelo gigante ----------------------------------------------
  const numeroSeis = new THREE.Group()
  numeroSeis.position.set(1.95, GY, -0.15)
  numeroSeis.rotation.y = -0.5

  const barriga = torus(0.4, 0.13, YELLOW, { roughness: 0.4 })
  barriga.position.set(0, 0.58, 0)
  numeroSeis.add(barriga)

  const hastePts = [
    new THREE.Vector3(-0.4, 0.6, 0),
    new THREE.Vector3(-0.47, 1.04, 0),
    new THREE.Vector3(-0.28, 1.42, 0),
    new THREE.Vector3(0.06, 1.58, 0),
  ]
  const haste = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hastePts), 40, 0.115, 14, false),
    mat(YELLOW, { roughness: 0.4, size: 1.2 }),
  )
  haste.castShadow = true
  haste.receiveShadow = true
  numeroSeis.add(haste)
  for (const p of [hastePts[0], hastePts[3]]) {
    const cap = sphere(0.115, YELLOW, { roughness: 0.4 })
    cap.position.copy(p)
    numeroSeis.add(cap)
  }
  root.add(numeroSeis)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'pessoa', group: 'pessoa', object: pessoa },
    { name: 'aceno', group: 'pessoa', object: aceno },
    { name: 'marco', group: 'porta', object: marco },
    { name: 'folha', group: 'porta', object: folha },
    { name: 'braco', group: 'mao', object: braco },
    { name: 'mao', group: 'mao', object: mao },
    { name: 'dedos', group: 'mao', object: dedos },
    { name: 'numeroSeis', group: 'seis', object: numeroSeis },
    { name: 'linguas', group: 'detalhe', object: linguas },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No corredor do prédio, você para no capacho pra se despedir…',
    }),

    seq('pessoa-rise', 'pessoa', 1.7, 0.8, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: '…VOCÊ acena tchau — em sueco quem se despede assim diz "VI…"',
    }),
    seq('aceno-raise', 'aceno', 1.7, 0.85, [ch('rotation.z', -0.35, -2.45)], { ease: 'easeOut' }),

    seq('marco-rise', 'marco', 3.4, 0.85, [riseFrom(GY, 2.7)], {
      ease: 'easeOut',
      caption: '…quando a porta do vizinho brota do chão e se abre sozinha…',
    }),
    seq('folha-rise', 'folha', 3.6, 0.85, [ch('position.y', -2.5, 0)], { ease: 'easeOut' }),
    seq('folha-open', 'folha', 4.7, 0.8, [ch('rotation.y', 0, -1.15)]),

    seq(
      'braco-out',
      'braco',
      5.9,
      0.9,
      [ch('position.x', -0.16, 0.75), ch('position.z', -2.72, -1.05)],
      {
        ease: 'easeOut',
        caption: '…e do escuro telescopa um braço verde-menta gigante…',
      },
    ),
    seq(
      'mao-pop',
      'mao',
      6.2,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'dedos-leque',
      'dedos',
      6.8,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…uma mão com SEIS dedos-cobrinha abrindo em leque!',
      },
    ),

    seq('seis-rise', 'numeroSeis', 8.5, 0.9, [riseFrom(GY, 2.1)], {
      ease: 'easeOut',
      caption: 'Você conta alto: "VI SEIS!" — e um 6 amarelo brota do chão.',
    }),
    seq('seis-firma', 'numeroSeis', 9.4, 0.5, [ch('rotation.z', 0.14, 0)]),

    seq(
      'linguas-pop',
      'linguas',
      10.4,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'Os seis dedos respondem juntos "SSSSS…" — Vi ses! (A gente se vê!)',
      },
    ),
    seq('mao-tchau-a', 'mao', 10.6, 0.5, [ch('rotation.z', 0, 0.3)]),
    seq('aceno-tchau-a', 'aceno', 10.6, 0.5, [ch('rotation.z', -2.45, -2.12)]),
    seq('mao-tchau-b', 'mao', 11.1, 0.55, [ch('rotation.z', 0.3, -0.3)]),
    seq('aceno-tchau-b', 'aceno', 11.1, 0.55, [ch('rotation.z', -2.12, -2.72)]),
    seq('mao-tchau-c', 'mao', 11.65, 0.55, [ch('rotation.z', -0.3, 0)], { ease: 'easeOut' }),
    seq('aceno-tchau-c', 'aceno', 11.65, 0.55, [ch('rotation.z', -2.72, -2.45)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 3.0, 6.1], target: [0.5, 1.1, -0.35] },
  }
}

export const card: Card = {
  meta: {
    id: 'vi-ses',
    contexto:
      'Saindo do elevador, encerrando papo no corredor, despedindo de colega que reencontra em breve.',
    fraseFonte: 'A gente se vê!',
    fraseAlvo: 'Vi ses!',
    pronuncia: "vi SÊSS (s final bem sibilante, nunca 'z')",
    ponteSonora: "VI SÊSS! (= 'VI SEIS' sem o i de seis, S bem chiado de cobra, nunca Z)",
    historia:
      'Você acena tchau no corredor e da porta do vizinho sai uma mão gigante verde com SEIS dedos — cada dedo é uma cobrinha. Você conta alto: "VI SEIS!" e os seis dedos respondem juntos com um SSSSS comprido.',
  },
  createScene,
}

export default card
