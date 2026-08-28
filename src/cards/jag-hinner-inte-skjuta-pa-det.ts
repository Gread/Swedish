import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag hinner inte till fredag. Kan vi skjuta på det?"
 *
 * A sala de reunião vira campo: o PINGUIM goleiro de gravata torta solta o
 * sopro RRÜTA (skjuta, o mesmo sopro de "sjuk", com Ü de bico) e manda o
 * BLOCO DA SEXTA (fredag) por cima da trave — adiado pra semana que vem.
 *
 * Diorama: carpete cinza-azulado com círculo de meio-campo pintado, trave
 * baixa de três cilindros brancos à direita, pinguim à esquerda com a perna
 * de chute erguida, cone de sopro azul saindo do bico, bloco vermelho no ar.
 */

const CARPET = '#55636f'
const CARPET_DARK = '#47535d'
const BONE = '#e8e4da'
const BELLY = '#efe9dc'
const PENGUIN = '#262c33'
const PENGUIN_SOFT = '#333a44'
const OCHRE = '#e0a24a' // bico e pés
const GLOVE = '#cdbb63'
const TIE = '#7d3a44'
const BLOCK = '#e5482c' // acento reservado: o BLOCO DA SEXTA (fredag)
const BREATH = '#9fd8f2'
const GY = 0.18 // topo do carpete

// pose final da perna de chute e do bloco no ar
const KICK = -1.25
const BLOCK_END: [number, number, number] = [2.15, 2.0, 0.3]
const BLOCK_REST: [number, number, number] = [-0.17, 0.48, 0.55]

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: carpete de escritório virado campo ----------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.6, 2.7, 0.12, CARPET_DARK, { roughness: 0.95 })
  slab.position.y = 0.06
  base.add(slab)

  const carpet = cylinder(2.54, 2.6, 0.07, CARPET, { roughness: 0.92 })
  carpet.position.y = 0.145
  base.add(carpet)

  // círculo de meio-campo pintado no carpete
  const circle = torus(1.0, 0.022, BONE, { roughness: 0.85 })
  circle.rotation.x = Math.PI / 2
  circle.position.set(0.15, GY + 0.012, 0.25)
  base.add(circle)

  // vaso de planta no fundo
  const pot = lathe(
    [[0, 0], [0.17, 0], [0.19, 0.06], [0.16, 0.24], [0.18, 0.3], [0.15, 0.32], [0, 0.32]],
    '#6d7a86',
    { roughness: 0.55 },
  )
  pot.position.set(-1.75, GY, -1.5)
  base.add(pot)
  const leaves = puff(0.26, '#3f7d5c', 6, 31, { roughness: 0.85 })
  leaves.position.set(-1.75, GY + 0.55, -1.5)
  base.add(leaves)

  // copo de café esquecido na linha lateral
  const cup = lathe(
    [[0, 0], [0.07, 0], [0.085, 0.02], [0.105, 0.22], [0.112, 0.24], [0.1, 0.245], [0, 0.245]],
    BELLY,
    { roughness: 0.4 },
  )
  cup.position.set(1.95, GY, 1.25)
  base.add(cup)
  const lid = cylinder(0.115, 0.108, 0.04, CARPET_DARK, { roughness: 0.45 })
  lid.position.set(1.95, GY + 0.265, 1.25)
  base.add(lid)

  // folhas de pauta caídas no chão
  for (const [px, pz] of [[-2.0, 0.9], [1.35, -1.55], [-0.55, -1.85]] as const) {
    const sheet = rbox(0.4, 0.014, 0.3, 0.006, BELLY, { roughness: 0.7 })
    sheet.position.set(px, GY + 0.008, pz)
    sheet.rotation.y = rand() * Math.PI
    base.add(sheet)
    const line = rbox(0.26, 0.006, 0.02, 0.003, '#8b96a1', { roughness: 0.7 })
    line.position.set(0, 0.012, 0.05)
    sheet.add(line)
  }
  root.add(base)

  // ---- trave baixa de três cilindros brancos -------------------------------
  const trave = new THREE.Group()
  trave.position.set(1.5, GY, 0.45)
  trave.rotation.y = 0.12

  for (const side of [-1, 1]) {
    const post = cylinder(0.075, 0.085, 1.36, BONE, { roughness: 0.4 })
    post.position.set(0, 0.68, side * 0.85)
    trave.add(post)

    const pad = cylinder(0.2, 0.24, 0.06, CARPET_DARK, { roughness: 0.9 })
    pad.position.set(0, 0.03, side * 0.85)
    trave.add(pad)
  }
  const crossbar = cylinder(0.075, 0.075, 1.78, BONE, { roughness: 0.4 })
  crossbar.rotation.x = Math.PI / 2
  crossbar.position.y = 1.39
  trave.add(crossbar)
  for (const side of [-1, 1]) {
    const cap = sphere(0.082, BONE, { roughness: 0.4 })
    cap.position.set(0, 1.39, side * 0.89)
    trave.add(cap)
  }
  root.add(trave)

  // ---- pinguim goleiro (olha para a trave: +z local) -----------------------
  const pinguim = new THREE.Group()
  pinguim.position.set(-1.05, GY, 0.35)
  pinguim.rotation.y = 1.35

  const torso = capsule(0.34, 0.55, PENGUIN, { roughness: 0.72 })
  torso.position.y = 0.72
  pinguim.add(torso)

  const belly = capsule(0.24, 0.34, BELLY, { roughness: 0.75 })
  belly.position.set(0, 0.68, 0.19)
  belly.scale.z = 0.5
  pinguim.add(belly)

  const tailFin = cone(0.16, 0.3, PENGUIN_SOFT, { roughness: 0.72 })
  tailFin.position.set(0, 0.24, -0.3)
  tailFin.rotation.x = -1.9
  pinguim.add(tailFin)

  // nadadeiras abertas de goleiro
  for (const side of [-1, 1]) {
    const wing = capsule(0.07, 0.34, PENGUIN, { roughness: 0.72 })
    wing.position.set(side * 0.36, 0.78, 0)
    wing.rotation.z = side * 0.35
    wing.scale.z = 0.62
    pinguim.add(wing)
  }

  // perna de apoio (fixa no corpo)
  const legStand = capsule(0.055, 0.16, OCHRE, { roughness: 0.55 })
  legStand.position.set(-0.19, 0.2, 0.02)
  pinguim.add(legStand)
  const footStand = rbox(0.17, 0.06, 0.28, 0.03, OCHRE, { roughness: 0.55 })
  footStand.position.set(-0.19, 0.03, 0.1)
  pinguim.add(footStand)
  root.add(pinguim)

  // ---- perna de chute: dobradiça no quadril, pose final no alto ------------
  const perna = new THREE.Group()
  perna.position.set(0.19, 0.36, 0.02)
  perna.rotation.x = KICK
  const shin = capsule(0.055, 0.16, OCHRE, { roughness: 0.55 })
  shin.position.y = -0.155
  perna.add(shin)
  const kickFoot = rbox(0.17, 0.06, 0.3, 0.03, OCHRE, { roughness: 0.55 })
  kickFoot.position.set(0, -0.33, 0.08)
  perna.add(kickFoot)
  pinguim.add(perna)

  // ---- cabeça (telescopa de dentro do corpo) -------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.34, 0.02)

  const skull = sphere(0.28, PENGUIN, { roughness: 0.72 })
  skull.scale.set(0.96, 1, 0.98)
  cabeca.add(skull)

  const face = sphere(0.2, BELLY, { roughness: 0.75 })
  face.position.set(0, -0.05, 0.16)
  face.scale.set(1.05, 0.95, 0.62)
  cabeca.add(face)

  const beak = cone(0.1, 0.3, OCHRE, { roughness: 0.5 })
  beak.rotation.x = Math.PI / 2
  beak.position.set(0, -0.03, 0.34)
  cabeca.add(beak)

  for (const side of [-1, 1]) {
    const eye = sphere(0.075, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.12, 0.09, 0.225)
    eye.scale.z = 0.6
    const pupil = sphere(0.035, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.125, 0.09, 0.268)
    cabeca.add(eye, pupil)
  }
  pinguim.add(cabeca)

  // ---- gravata torta -------------------------------------------------------
  const gravata = new THREE.Group()
  gravata.position.set(0.05, 1.06, 0.28)
  gravata.rotation.set(-0.18, 0, 0.38)
  const knot = rbox(0.13, 0.1, 0.07, 0.03, TIE, { roughness: 0.9 })
  gravata.add(knot)
  const blade = rbox(0.14, 0.34, 0.06, 0.03, TIE, { roughness: 0.9 })
  blade.position.set(-0.02, -0.22, -0.01)
  blade.rotation.z = 0.12
  gravata.add(blade)
  pinguim.add(gravata)

  // ---- luvas de goleiro ----------------------------------------------------
  const luvas = new THREE.Group()
  for (const side of [-1, 1]) {
    const glove = rbox(0.19, 0.22, 0.13, 0.06, GLOVE, { roughness: 0.7 })
    glove.position.set(side * 0.45, 0.55, 0.02)
    glove.rotation.z = side * 0.35
    luvas.add(glove)
    const cuff = cylinder(0.09, 0.09, 0.07, BONE, { roughness: 0.75 })
    cuff.position.set(side * 0.41, 0.66, 0.02)
    cuff.rotation.z = side * 0.35
    luvas.add(cuff)
  }
  pinguim.add(luvas)

  // ---- sopro RRÜTA saindo do bico ------------------------------------------
  const sopro = new THREE.Group()
  sopro.position.set(0, 1.3, 0.52)
  sopro.scale.set(1, 1, 1.35)
  const jet = cone(0.24, 0.78, BREATH, {
    emissive: '#bfe8ff',
    emissiveIntensity: 1.1,
    roughness: 0.3,
  })
  jet.rotation.x = -Math.PI / 2
  jet.position.z = 0.39
  sopro.add(jet)
  for (const [sx, sy, sz, sr] of [
    [0.14, 0.1, 0.86, 0.09],
    [-0.16, -0.08, 0.95, 0.07],
    [0.05, -0.14, 0.78, 0.06],
  ] as const) {
    const wisp = sphere(sr, BREATH, {
      emissive: '#bfe8ff',
      emissiveIntensity: 0.9,
      roughness: 0.3,
    })
    wisp.position.set(sx, sy, sz)
    sopro.add(wisp)
  }
  pinguim.add(sopro)

  // ---- bloco da sexta, já por cima da trave --------------------------------
  const bloco = new THREE.Group()
  bloco.position.set(...BLOCK_END)
  bloco.rotation.set(0.3, 0, 0.85)

  const pages = rbox(0.46, 0.5, 0.13, 0.03, BELLY, { roughness: 0.75 })
  bloco.add(pages)
  const header = rbox(0.48, 0.16, 0.145, 0.035, BLOCK, { roughness: 0.5 })
  header.position.y = 0.2
  bloco.add(header)
  const dayMark = rbox(0.26, 0.09, 0.03, 0.02, BLOCK, { roughness: 0.5 })
  dayMark.position.set(0, -0.04, 0.08)
  bloco.add(dayMark)
  const underline = rbox(0.3, 0.025, 0.02, 0.01, '#8b96a1', { roughness: 0.7 })
  underline.position.set(0, -0.18, 0.08)
  bloco.add(underline)
  for (const side of [-1, 1]) {
    const ring = torus(0.045, 0.014, '#9aa3ac', { roughness: 0.25, metalness: 0.7 })
    ring.position.set(side * 0.13, 0.28, 0)
    bloco.add(ring)
  }
  root.add(bloco)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'trave', group: 'trave', object: trave },
    { name: 'pinguim', group: 'pinguim', object: pinguim },
    { name: 'cabeca', group: 'pinguim', object: cabeca },
    { name: 'perna', group: 'pinguim', object: perna },
    { name: 'gravata', group: 'uniforme', object: gravata },
    { name: 'luvas', group: 'uniforme', object: luvas },
    { name: 'bloco', group: 'chute', object: bloco },
    { name: 'sopro', group: 'chute', object: sopro },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'A sala de reunião vira campo: brota o carpete com o círculo de meio-campo…',
    }),

    seq('trave-rise', 'trave', 1.7, 0.8, [riseFrom(GY, 1.9)], { ease: 'easeOut' }),

    seq('pinguim-rise', 'pinguim', 3.3, 0.8, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption:
        '…e sobe o PINGUIM goleiro. Você RI NERVOSO — RRÍNER (hinner), sopro sem vibrar — não vai dar conta.',
    }),
    seq('cabeca-pop', 'cabeca', 3.5, 0.6, [ch('position.y', 0.62, 1.34)], { ease: 'easeOut' }),
    seq('perna-plant', 'perna', 3.65, 0.6, [ch('rotation.x', -0.9, 0.05)], { ease: 'easeOut' }),

    seq(
      'gravata-grow',
      'gravata',
      5.1,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…gravata torta e luvas de goleiro: ÍNTE TIL FRÉDA — não fecha até sexta.',
      },
    ),
    seq(
      'luvas-grow',
      'luvas',
      5.3,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq(
      'bloco-rise',
      'bloco',
      6.6,
      0.7,
      [
        ch('position.x', BLOCK_REST[0], BLOCK_REST[0]),
        ch('position.y', BLOCK_REST[1] - 1.15, BLOCK_REST[1]),
        ch('position.z', BLOCK_REST[2], BLOCK_REST[2]),
      ],
      {
        ease: 'easeOut',
        caption: 'O bloco-calendário da SEXTA (FRÉDA) quica bem na frente do bico dele…',
      },
    ),

    seq(
      'sopro-grow',
      'sopro',
      7.8,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…ele solta o sopro do fundo da garganta, bico arredondado no Ü: RRÜTA! (skjuta)',
      },
    ),

    seq('perna-kick', 'perna', 8.5, 0.5, [ch('rotation.x', 0.05, KICK)], { ease: 'easeIn' }),
    seq('pinguim-lean', 'pinguim', 8.5, 0.45, [ch('rotation.z', 0, -0.14)]),
    seq('sopro-push', 'sopro', 8.55, 0.5, [ch('scale.z', 1, 1.35)], { ease: 'easeOut' }),

    seq(
      'bloco-kick',
      'bloco',
      8.75,
      0.45,
      [
        ch('position.x', BLOCK_REST[0], 1.15),
        ch('position.y', BLOCK_REST[1], 2.05),
        ch('position.z', BLOCK_REST[2], 0.42),
        ch('rotation.z', 0, 0.5),
      ],
      { ease: 'easeOut' },
    ),
    seq('pinguim-settle', 'pinguim', 8.95, 0.5, [ch('rotation.z', -0.14, 0)], { ease: 'easeOut' }),

    seq(
      'bloco-over',
      'bloco',
      9.2,
      0.6,
      [
        ch('position.x', 1.15, BLOCK_END[0]),
        ch('position.y', 2.05, BLOCK_END[1]),
        ch('position.z', 0.42, BLOCK_END[2]),
        ch('rotation.z', 0.5, 0.85),
        ch('rotation.x', 0, 0.3),
      ],
      {
        caption:
          'A sexta voa por cima da trave, direto pra semana que vem — PÔ, DÊ! Jag hinner inte till fredag. Kan vi skjuta på det?',
      },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 3.0, 6.4], target: [0.35, 1.05, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-hinner-inte-skjuta-pa-det',
    contexto: 'Na reunião ou por escrito, quando o prazo não vai fechar.',
    fraseFonte: 'Não vou dar conta até sexta. Podemos adiar?',
    fraseAlvo: 'Jag hinner inte till fredag. Kan vi skjuta på det?',
    pronuncia:
      "iá HÍN-ner ín-te till FRÉ-da. kan vi RHÚU-ta pô dê ('fredag' vira 'FRÉ-da'; 'skjuta' com o mesmo sopro de 'sjuk')",
    ponteSonora:
      "IÁ RRÍNER ÍNTE TIL FRÉDA — CAN VI RRÜTA PÔ DÊ? (14 sílabas; 'hinner' = RRÍNER com RR SOPRADO, não vibrado — se vibrar vira 'rinner', escorrer; FRÉDA com R BRANDO e sem o -g; 'skjuta' = RRÜTA, o mesmo sopro de 'sjuk' mas com Ü de bico, nunca 'chuta' com U nem 'ch' de chuva; 'på' = PÔ FECHADO)",
    historia:
      'O prazo de sexta vem quicando na sua direção e você RI NERVOSO — RRÍNER, sopro sem vibrar — porque não vai dar conta. Aí o pinguim de gravata torta, goleiro oficial do escritório, solta um CHUTA soprado do fundo da garganta, mas com o bico arredondado no Ü: RRÜTA!, mandando o bloco da sexta-feira por cima da trave, direto pra semana que vem, e implora: PÔ, DÊ!',
  },
  createScene,
}

export default card
