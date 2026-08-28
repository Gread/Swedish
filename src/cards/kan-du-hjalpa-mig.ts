import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Kan du hjälpa mig?" — você afunda na neve e só sobram a cabeça e um braço.
 * Grita "ÊI!" e a montanha devolve o eco "M-ÊI!" (mig = M'ÊI, monossílabo).
 * O IODELADOR na pedra só atende quem faz IÉL de IOGA — quem rosna "RRÁL-pa"
 * com erre carioca fica no buraco. Ele ergue a PÁ vermelha e vem cavando.
 *
 * Diorama: campo de neve com abetos; buraco escuro à esquerda com a cabeça e o
 * braço do soterrado; M gigante esculpido na neve ao fundo; à direita a pedra
 * do iodelador de suspensórios, boca em O, e a PÁ vermelha erguida.
 */

const SNOW = '#eef4f9'
const SNOW_SHADE = '#c3d4e4'
const ICE = '#a8bfd4'
const STONE = '#8b929a'
const STONE_DARK = '#6f767e'
const HOLE = '#2b3540'
const WOOD = '#8a6a42'
const CLOTH = '#8a4234' // vermelho apagado do iodelador
const STRAP = '#4c5f45'
const SKIN = '#e8c39e'
const ACCENT = '#d9482c' // acento reservado: a PÁ (IÉL-pa)
const ACCENT_LIGHT = '#f07a52'

const GY = 0.18 // topo da neve

/** Abeto nevado: tronco + três saias de cone com capa branca. */
function spruce(scale: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)

  const trunk = cylinder(0.05 * scale, 0.065 * scale, 0.3 * scale, '#5a4630', { roughness: 0.85 })
  trunk.position.y = 0.15 * scale
  g.add(trunk)

  const tiers: [number, number, number][] = [
    [0.34, 0.46, 0.3],
    [0.26, 0.38, 0.56],
    [0.17, 0.3, 0.78],
  ]
  for (const [r, h, y] of tiers) {
    const skirt = cone(r * scale, h * scale, '#33534a', { roughness: 0.9 })
    skirt.position.y = y * scale
    skirt.rotation.y = rand() * Math.PI
    g.add(skirt)

    const cap = cone(r * 0.6 * scale, h * 0.4 * scale, SNOW, { roughness: 0.9 })
    cap.position.y = (y + h * 0.3) * scale
    g.add(cap)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: campo de neve --------------------------------------
  const base = new THREE.Group()

  const ice = cylinder(2.62, 2.72, 0.12, ICE, { roughness: 0.35 })
  ice.position.y = 0.06
  base.add(ice)

  const snow = cylinder(2.55, 2.62, 0.07, SNOW, { roughness: 0.92 })
  snow.position.y = 0.145
  base.add(snow)

  // congeiras: montinhos de neve varrida pelo vento
  for (const [dx, dz, r, seed] of [
    [-2.0, -1.2, 0.42, 31],
    [1.15, 1.55, 0.3, 32],
    [-0.35, 1.85, 0.24, 33],
  ] as const) {
    const drift = puff(r, SNOW, 5, seed, { roughness: 0.92 })
    drift.position.set(dx, GY - r * 0.55, dz)
    drift.scale.set(1.25, 0.5, 1.15)
    base.add(drift)
  }

  // pedras semienterradas
  for (const [dx, dz, r, seed] of [
    [-2.15, 0.55, 0.2, 41],
    [0.95, 1.95, 0.13, 42],
  ] as const) {
    const stone = rock(r, STONE_DARK, seed, { roughness: 0.9 })
    stone.position.set(dx, GY - r * 0.35, dz)
    stone.rotation.y = rand() * Math.PI
    base.add(stone)
  }

  const treeA = spruce(0.5, 51)
  treeA.position.set(-1.95, GY - 0.02, -1.5)
  treeA.rotation.y = rand() * Math.PI
  base.add(treeA)

  const treeB = spruce(0.4, 52)
  treeB.position.set(2.1, GY - 0.02, -1.05)
  treeB.rotation.y = rand() * Math.PI
  base.add(treeB)

  root.add(base)

  // ---- o buraco na neve ----------------------------------------------------
  const buraco = new THREE.Group()
  buraco.position.set(-1.2, GY + 0.012, 0.6)

  const pit = cylinder(0.55, 0.5, 0.03, HOLE, { roughness: 0.95 })
  buraco.add(pit)

  const pitInner = cylinder(0.38, 0.3, 0.02, '#1b232c', { roughness: 0.95 })
  pitInner.position.y = 0.012
  buraco.add(pitInner)

  const rim = torus(0.57, 0.075, SNOW, { roughness: 0.92 })
  rim.rotation.x = -Math.PI / 2
  rim.position.y = 0.01
  rim.scale.y = 0.7
  buraco.add(rim)

  // torrões de neve arremessados pela queda
  for (const [a, r, s] of [
    [0.4, 0.11, 61],
    [1.9, 0.08, 62],
    [3.5, 0.1, 63],
    [5.2, 0.07, 64],
  ] as const) {
    const clod = rock(r, SNOW, s, { roughness: 0.92 })
    clod.position.set(Math.cos(a) * 0.76, 0.02, Math.sin(a) * 0.76)
    buraco.add(clod)
  }
  root.add(buraco)

  // ---- o soterrado: só a cabeça passa da neve ------------------------------
  const soterrado = person({ body: '#3f5b74', skin: SKIN, height: 1.4 })
  soterrado.position.set(-1.2, -0.594, 0.6)
  soterrado.rotation.y = 1.35 // olha para cima, na direção do iodelador

  const buriedHead = soterrado.getObjectByName('head')!

  const gorro = lathe(
    [
      [0, 0], [0.235, 0.02], [0.25, 0.075], [0.225, 0.16],
      [0.17, 0.24], [0.09, 0.3], [0, 0.32],
    ],
    '#4a6d8c',
    { roughness: 0.92 },
  )
  gorro.position.y = 0.04
  buriedHead.add(gorro)

  const brim = torus(0.235, 0.05, '#5f83a3', { roughness: 0.92 })
  brim.rotation.x = Math.PI / 2
  brim.position.y = 0.06
  buriedHead.add(brim)

  const pompom = puff(0.075, SNOW, 4, 71, { roughness: 0.92 })
  pompom.position.y = 0.37
  buriedHead.add(pompom)

  // boca escancarada gritando "ÊI!"
  const grito = sphere(0.078, '#2e1c18', { roughness: 0.6 })
  grito.position.set(0, -0.095, 0.235)
  grito.scale.set(0.85, 1.2, 0.5)
  buriedHead.add(grito)

  root.add(soterrado)

  // ---- o braço erguido, pedindo socorro ------------------------------------
  const braco = new THREE.Group()
  braco.position.set(-0.88, 0.1, 0.78)
  braco.rotation.z = 0.12

  const forearm = capsule(0.075, 0.4, '#3f5b74', { roughness: 0.85 })
  forearm.position.y = 0.31
  braco.add(forearm)

  const cuff = cylinder(0.095, 0.105, 0.09, '#5f83a3', { roughness: 0.92 })
  cuff.position.y = 0.34
  braco.add(cuff)

  const hand = sphere(0.1, SKIN, { roughness: 0.7 })
  hand.position.y = 0.58
  braco.add(hand)

  for (const [fx, fz, fr] of [
    [-0.055, 0.03, 0.9],
    [0, 0.055, 1],
    [0.055, 0.03, 0.9],
  ] as const) {
    const finger = capsule(0.026, 0.075 * fr, SKIN, { roughness: 0.7 })
    finger.position.set(fx, 0.68, fz)
    braco.add(finger)
  }
  root.add(braco)

  // ---- o M gigante esculpido na neve ---------------------------------------
  const letraM = new THREE.Group()
  letraM.position.set(-0.35, GY, -0.85)
  letraM.rotation.y = 0.22

  const mound = cylinder(0.78, 0.86, 0.14, SNOW_SHADE, { roughness: 0.92 })
  mound.position.y = 0.06
  mound.scale.z = 0.55
  letraM.add(mound)

  for (const side of [-1, 1]) {
    const post = rbox(0.2, 1.1, 0.22, 0.055, SNOW, { roughness: 0.92 })
    post.position.set(side * 0.44, 0.68, 0)
    letraM.add(post)

    const diag = rbox(0.19, 0.8, 0.21, 0.05, SNOW, { roughness: 0.92 })
    diag.position.set(side * 0.22, 0.9, 0.01)
    diag.rotation.z = side * 0.6
    letraM.add(diag)

    // aresta de gelo no topo de cada haste: a luz pega a quina
    const edge = rbox(0.14, 0.05, 0.16, 0.02, ICE, { roughness: 0.3 })
    edge.position.set(side * 0.44, 1.24, 0)
    letraM.add(edge)
  }
  root.add(letraM)

  // ---- a pedra do iodelador ------------------------------------------------
  const pedra = new THREE.Group()
  pedra.position.set(1.55, GY, -0.35)

  const boulder = rock(0.72, STONE, 81, { roughness: 0.9 })
  boulder.position.y = 0.32
  boulder.scale.set(1, 0.62, 0.95)
  pedra.add(boulder)

  const ledge = rock(0.34, STONE_DARK, 82, { roughness: 0.9 })
  ledge.position.set(-0.6, 0.14, 0.3)
  ledge.scale.y = 0.55
  pedra.add(ledge)

  const plateau = cylinder(0.46, 0.52, 0.1, SNOW, { roughness: 0.92 })
  plateau.position.y = 0.75
  pedra.add(plateau)
  root.add(pedra)

  // ---- o iodelador ---------------------------------------------------------
  const iodelador = person({ body: CLOTH, skin: SKIN, height: 1.45, armAngle: 0.35 })
  iodelador.position.set(1.55, 0.98, -0.35)
  iodelador.rotation.y = -1.15 // encara o buraco
  iodelador.rotation.z = -0.09

  const armR = iodelador.getObjectByName('armR')!
  armR.rotation.z = 2.4 // punho no alto, segurando a pá
  const armL = iodelador.getObjectByName('armL')!
  armL.rotation.z = 2.5 // mão em concha junto à boca

  // suspensórios + cós
  for (const side of [-1, 1]) {
    const strap = rbox(0.055, 0.62, 0.035, 0.014, STRAP, { roughness: 0.9 })
    strap.position.set(side * 0.1, 0.5, 0.2)
    strap.rotation.z = side * 0.09
    iodelador.add(strap)

    const button = sphere(0.032, WOOD, { roughness: 0.6 })
    button.position.set(side * 0.1, 0.24, 0.235)
    iodelador.add(button)
  }
  const belt = rbox(0.44, 0.09, 0.34, 0.03, STRAP, { roughness: 0.9 })
  belt.position.y = 0.22
  iodelador.add(belt)

  const head = iodelador.getObjectByName('head')!

  const chapeu = lathe(
    [
      [0, 0], [0.4, 0.01], [0.42, 0.045], [0.26, 0.07],
      [0.22, 0.13], [0.2, 0.24], [0.13, 0.3], [0, 0.31],
    ],
    STRAP,
    { roughness: 0.9 },
  )
  chapeu.position.y = 0.16
  head.add(chapeu)

  const band = torus(0.22, 0.03, '#3a4a35', { roughness: 0.9 })
  band.rotation.x = Math.PI / 2
  band.position.y = 0.2
  head.add(band)

  const pena = capsule(0.022, 0.2, '#e8dcc0', { roughness: 0.8 })
  pena.position.set(-0.2, 0.32, -0.06)
  pena.rotation.set(0.2, 0, 0.45)
  head.add(pena)

  // bochechas de quem está soltando a voz
  for (const side of [-1, 1]) {
    const cheek = sphere(0.085, '#d99a80', { roughness: 0.8 })
    cheek.position.set(side * 0.165, -0.05, 0.2)
    cheek.scale.set(1, 0.85, 0.55)
    head.add(cheek)
  }

  // ---- a boca em O: o iodel de verdade -------------------------------------
  const boca = new THREE.Group()
  boca.position.set(0, -0.1, 0.245)
  const lips = torus(0.082, 0.03, '#241a16', { roughness: 0.5 })
  boca.add(lips)
  const throat = sphere(0.07, '#150f0d', { roughness: 0.7 })
  throat.position.z = -0.035
  throat.scale.z = 0.5
  boca.add(throat)
  head.add(boca)

  root.add(iodelador)

  // ---- a PÁ vermelha: o objeto da ponte sonora (IÉL-PA) --------------------
  const pa = new THREE.Group()
  pa.position.set(1.44, 1.63, 0.06)
  pa.rotation.y = 0.42 // plano do golpe virado para o buraco
  pa.rotation.z = 1.05

  const knob = sphere(0.06, WOOD, { roughness: 0.7 })
  pa.add(knob)

  const grip = cylinder(0.05, 0.05, 0.13, ACCENT_LIGHT, { roughness: 0.45 })
  grip.position.y = 0.09
  pa.add(grip)

  const shaft = cylinder(0.036, 0.042, 0.76, WOOD, { roughness: 0.7 })
  shaft.position.y = 0.45
  pa.add(shaft)

  const collar = cylinder(0.055, 0.062, 0.1, '#9aa1a8', { roughness: 0.25, metalness: 0.85 })
  collar.position.y = 0.8
  pa.add(collar)

  const blade = rbox(0.44, 0.46, 0.07, 0.06, ACCENT, { roughness: 0.4 })
  blade.position.y = 1.0
  blade.rotation.x = -0.12
  pa.add(blade)

  const bladeEdge = rbox(0.42, 0.07, 0.085, 0.025, ACCENT_LIGHT, { roughness: 0.35 })
  bladeEdge.position.set(0, 0.79, 0.012)
  pa.add(bladeEdge)

  const bladeRib = rbox(0.07, 0.4, 0.09, 0.025, ACCENT_LIGHT, { roughness: 0.4 })
  bladeRib.position.set(0, 1.0, -0.01)
  bladeRib.rotation.x = -0.12
  pa.add(bladeRib)

  root.add(pa)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'buraco', group: 'buraco', object: buraco },
    { name: 'soterrado', group: 'buraco', object: soterrado },
    { name: 'braco', group: 'buraco', object: braco },
    { name: 'letraM', group: 'eco', object: letraM },
    { name: 'pedra', group: 'iodelador', object: pedra },
    { name: 'iodelador', group: 'iodelador', object: iodelador },
    { name: 'boca', group: 'iodelador', object: boca },
    { name: 'pa', group: 'pa', object: pa },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Campo de neve sueco: o branco sobe do chão, abetos e tudo.',
    }),

    seq(
      'buraco-open',
      'buraco',
      1.7,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: 'Você afunda: abre-se um BURACO e some ali dentro.' },
    ),
    seq('soterrado-rise', 'soterrado', 1.95, 0.8, [riseFrom(-0.594, 1.0)], { ease: 'easeOut' }),
    seq('braco-rise', 'braco', 2.15, 0.8, [riseFrom(0.1, 1.1)], { ease: 'easeOut' }),

    seq('braco-wave-a', 'braco', 3.2, 0.6, [ch('rotation.z', 0.12, -0.45)], {
      caption: 'Sobram só a cabeça e um braço. Você grita: "ÊI!"',
    }),
    seq('braco-wave-b', 'braco', 3.8, 0.6, [ch('rotation.z', -0.45, 0.12)]),

    seq('m-rise', 'letraM', 4.6, 0.9, [riseFrom(GY, 1.75)], {
      ease: 'easeOut',
      caption: 'A montanha devolve o eco num M gigante: "M-ÊI!" — mig é M\'ÊI, monossílabo, nunca "meia".',
    }),

    seq('pedra-rise', 'pedra', 6.3, 0.8, [riseFrom(GY, 1.3)], { ease: 'easeOut' }),
    seq('iodelador-rise', 'iodelador', 6.5, 0.9, [riseFrom(0.98, 2.7)], {
      ease: 'easeOut',
      caption: 'Na pedra lá em cima surge o iodelador: CAN-DU, seco, sem glide.',
    }),
    seq(
      'boca-open',
      'boca',
      7.55,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'A boca abre num O: ele só atende IÉL-pa, com IÉL de IOGA. Quem rosna "RRÁL-pa" com erre carioca fica no buraco.',
      },
    ),

    seq('pa-rise', 'pa', 9.0, 0.9, [riseFrom(1.63, 3.1)], {
      ease: 'easeOut',
      caption: 'Então ele ergue a PÁ vermelha — IÉL-PA! — e vem cavando até você.',
    }),
    seq('pa-lift', 'pa', 10.1, 0.7, [ch('rotation.z', 0.85, 0.12)]),
    seq('iodelador-lean', 'iodelador', 10.3, 0.6, [ch('rotation.z', 0, -0.09)]),

    seq(
      'pa-dig',
      'pa',
      11.0,
      0.7,
      [ch('rotation.z', 0.12, 1.05), ch('position.x', 1.73, 1.44)],
      {
        caption: 'Kan du hjälpa mig? — CAN-DU IÉL-pa M\'ÊI: "Você pode me ajudar?"',
      },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 3.1, 6.3], target: [0.1, 1.05, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-du-hjalpa-mig',
    contexto: 'Loja, estação de trem, prédio público, ou pedindo socorro a um vizinho ou colega.',
    fraseFonte: 'Você pode me ajudar?',
    fraseAlvo: 'Kan du hjälpa mig?',
    pronuncia: "kan du YÉL-pa MÊI ('hj' se lê como 'i' de 'ioga'; 'mig' se lê 'mêi')",
    ponteSonora:
      "CAN-DU IÉL-pa... M'ÊI! (CAN-DU sem glide; força em IÉL e o -pa engolido; M'ÊI é monossílabo, nunca 'meia'. E é IÉL de IOGA — nunca RR carioca)",
    historia:
      'Você afunda na neve e só sobram a cabeça e um braço. Grita "ÊI!" e a montanha devolve o eco "M-ÊI!". O iodelador lá em cima só atende quem faz iodel de verdade — quem rosna "RRÁL-pa" com erre carioca fica no buraco. Ele ergue a PÁ vermelha e vem cavando.',
  },
  createScene,
}

export default card
