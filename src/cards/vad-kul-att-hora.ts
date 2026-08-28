import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Vad kul att höra!" — a ARARA turquesa (AT-RRÖ-RA) aperta o bico num bico de
 * beijo, guincha "VÁ, CÜL!" e decola do poleiro; a notícia cai dentro da
 * CORNETA dourada (a orelha dela, höra) e ela devolve tudo repetindo.
 *
 * Diorama solar: tapete cor de sol com raios, toco-poleiro à esquerda, corneta
 * dourada de boca virada pra cima à direita, balões e confete subindo.
 * TUDO nesta cena SOBE — é o oposto exato de "Åh, vad tråkigt".
 */

const SUN = '#e39a35'        // tapete cor de sol
const SUN_DEEP = '#c2662a'   // raios / terra quente
const WOOD = '#a9743f'
const WOOD_DARK = '#7d5228'
const TURQ = '#18b0b6'       // arara
const TURQ_LIGHT = '#3ad3cf'
const WING_Y = '#f2c53d'
const WING_B = '#2f6fd0'
const ORANGE = '#e8622b'     // bico
const ORANGE_DEEP = '#c94f22'
const PINK = '#e8558f'       // crista
const LIME = '#9ed94a'
const GOLD = '#ffcb3d'       // ACENTO reservado: a CORNETA (höra)
const BRASS = '#c8922e'

const GY = 0.2               // topo da base do diorama
const PERCH_H = 0.95         // altura do poleiro acima da base
const PERCH_TOP = GY + PERCH_H
const FLY_Y = PERCH_TOP + 0.7 // altura da arara depois de decolar

const BALLOON_Y = 1.35
const BALLOON_UP = 1.55
const CONFETTI_Y = 1.5
const CONFETTI_UP = 1.75

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: tapete cor de sol -----------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, SUN_DEEP, { roughness: 0.92 })
  soil.position.y = 0.06
  base.add(soil)

  const rug = cylinder(2.54, 2.6, 0.08, SUN, { roughness: 0.88 })
  rug.position.y = 0.16
  base.add(rug)

  // raios de sol bordados no tapete
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.22
    const ray = rbox(0.9, 0.03, 0.2, 0.012, '#f0b429', { roughness: 0.85 })
    ray.position.set(Math.cos(a) * 1.62, GY + 0.005, Math.sin(a) * 1.62)
    ray.rotation.y = -a
    base.add(ray)
  }

  // adereços quentes espalhados com semente fixa
  const stoneA = rock(0.17, '#b98251', 31, { roughness: 0.9 })
  stoneA.position.set(-2.05, GY + 0.07, -0.95)
  stoneA.rotation.y = rand() * Math.PI
  base.add(stoneA)

  const stoneB = rock(0.11, '#c08c58', 32, { roughness: 0.9 })
  stoneB.position.set(1.95, GY + 0.05, 1.25)
  stoneB.rotation.y = rand() * Math.PI
  base.add(stoneB)

  const bushA = puff(0.22, '#d9822b', 6, 33, { roughness: 0.9 })
  bushA.position.set(-1.6, GY + 0.16, 1.55)
  base.add(bushA)

  const bushB = puff(0.16, '#e0a13a', 5, 34, { roughness: 0.9 })
  bushB.position.set(2.05, GY + 0.13, -1.15)
  base.add(bushB)

  for (const [fx, fz] of [[-2.1, 0.85], [0.2, 1.95], [1.35, -1.85]] as const) {
    const stem = cylinder(0.014, 0.02, 0.26, '#8ea94a', { roughness: 0.9 })
    stem.position.set(fx, GY + 0.13, fz)
    stem.rotation.z = (rand() - 0.5) * 0.3
    const petals = sphere(0.055, PINK, { roughness: 0.6 })
    petals.position.y = 0.15
    petals.scale.set(1, 0.7, 1)
    const core = sphere(0.026, WING_Y, { roughness: 0.55 })
    core.position.y = 0.185
    stem.add(petals, core)
    base.add(stem)
  }
  root.add(base)

  // ---- toco-poleiro ---------------------------------------------------------
  const poleiro = new THREE.Group()
  poleiro.position.set(-1.05, GY, 0.25)

  const trunk = lathe(
    [
      [0, 0], [0.34, 0], [0.32, 0.08], [0.24, 0.2], [0.22, 0.5],
      [0.24, 0.74], [0.3, 0.88], [0.31, PERCH_H], [0.2, PERCH_H], [0, PERCH_H - 0.03],
    ],
    WOOD,
    { roughness: 0.78 },
  )
  poleiro.add(trunk)

  const bark = torus(0.27, 0.035, WOOD_DARK, { roughness: 0.82 })
  bark.rotation.x = Math.PI / 2
  bark.position.y = 0.46
  poleiro.add(bark)

  const knot = sphere(0.08, WOOD_DARK, { roughness: 0.8 })
  knot.position.set(0.2, 0.66, 0.19)
  knot.scale.z = 0.5
  poleiro.add(knot)

  const moss = puff(0.13, LIME, 4, 35, { roughness: 0.9 })
  moss.position.set(-0.22, 0.14, 0.24)
  moss.scale.setScalar(0.75)
  poleiro.add(moss)
  root.add(poleiro)

  // ---- corneta dourada: a orelha que OUVE (höra) ----------------------------
  const corneta = new THREE.Group()
  corneta.position.set(0.98, GY, -0.05)
  corneta.rotation.set(0.06, 0, 0.17) // boca inclinada na direção da arara

  const horn = lathe(
    [
      [0, 0], [0.34, 0], [0.33, 0.07], [0.14, 0.12], [0.115, 0.46],
      [0.16, 0.82], [0.29, 1.12], [0.47, 1.34], [0.65, 1.48], [0.73, 1.56],
      [0.7, 1.61], [0.62, 1.55], [0.44, 1.41], [0.26, 1.18], [0.13, 0.88],
      [0.095, 0.5], [0.095, 0.14], [0, 0.14],
    ],
    GOLD,
    { roughness: 0.22, metalness: 0.85 },
  )
  corneta.add(horn)

  const rim = torus(0.715, 0.045, GOLD, { roughness: 0.2, metalness: 0.9 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = 1.58
  corneta.add(rim)

  for (const [by, br] of [[0.34, 0.125], [0.66, 0.145]] as const) {
    const band = torus(br, 0.032, BRASS, { roughness: 0.28, metalness: 0.75 })
    band.rotation.x = Math.PI / 2
    band.position.y = by
    corneta.add(band)
  }

  const footRing = torus(0.3, 0.05, BRASS, { roughness: 0.3, metalness: 0.7 })
  footRing.rotation.x = Math.PI / 2
  footRing.position.y = 0.05
  corneta.add(footRing)
  root.add(corneta)

  // ---- arara turquesa (cresce do topo do poleiro, olha pra corneta) ---------
  const arara = new THREE.Group()
  arara.position.set(-1.05, FLY_Y, 0.25)
  arara.rotation.y = Math.atan2(0.98 - -1.05, -0.05 - 0.25) // +z local → corneta

  for (const side of [-1, 1]) {
    const leg = cylinder(0.042, 0.05, 0.15, '#6c6058', { roughness: 0.7 })
    leg.position.set(side * 0.1, 0.075, 0.02)
    arara.add(leg)
    const claw = sphere(0.07, '#6c6058', { roughness: 0.7 })
    claw.position.set(side * 0.1, 0.02, 0.06)
    claw.scale.set(1, 0.55, 1.25)
    arara.add(claw)
  }

  const body = capsule(0.24, 0.34, TURQ, { roughness: 0.6 })
  body.position.set(0, 0.56, -0.02)
  body.rotation.x = -0.1
  arara.add(body)

  const belly = capsule(0.15, 0.2, TURQ_LIGHT, { roughness: 0.62 })
  belly.position.set(0, 0.5, 0.16)
  belly.scale.z = 0.55
  arara.add(belly)

  // cauda azul apontando pra trás-embaixo
  const tail = capsule(0.075, 0.5, WING_B, { roughness: 0.65 })
  tail.position.set(0, 0.32, -0.36)
  tail.rotation.x = 0.85
  tail.scale.x = 1.5
  arara.add(tail)
  const tailTip = capsule(0.05, 0.3, WING_Y, { roughness: 0.65 })
  tailTip.position.set(0, 0.12, -0.62)
  tailTip.rotation.x = 0.85
  tailTip.scale.x = 1.3
  arara.add(tailTip)

  // cabeça
  const head = new THREE.Group()
  head.position.set(0, 1.03, 0.04)
  const skull = sphere(0.2, TURQ, { roughness: 0.6 })
  skull.scale.set(0.98, 1, 0.96)
  head.add(skull)

  const patch = sphere(0.15, '#f4ead7', { roughness: 0.7 })
  patch.position.set(0, -0.01, 0.12)
  patch.scale.set(1, 0.85, 0.7)
  head.add(patch)

  for (const side of [-1, 1]) {
    const eye = sphere(0.048, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.095, 0.045, 0.165)
    eye.scale.z = 0.6
    const pupil = sphere(0.024, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.095, 0.045, 0.2)
    head.add(eye, pupil)
  }
  arara.add(head)

  // ---- bico apertado: dois cones ponta com ponta (bico de beijo) ------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.02, 0.14)

  const upperBeak = cone(0.11, 0.32, ORANGE, { roughness: 0.45 })
  upperBeak.position.set(0, 0.055, 0)
  upperBeak.rotation.x = Math.PI / 2 + 0.34
  bico.add(upperBeak)

  const lowerBeak = cone(0.1, 0.28, ORANGE_DEEP, { roughness: 0.45 })
  lowerBeak.position.set(0, -0.045, 0)
  lowerBeak.rotation.x = Math.PI / 2 - 0.3
  bico.add(lowerBeak)

  const nostril = sphere(0.022, '#8f3b18', { roughness: 0.5 })
  nostril.position.set(0.05, 0.11, 0.03)
  const nostril2 = sphere(0.022, '#8f3b18', { roughness: 0.5 })
  nostril2.position.set(-0.05, 0.11, 0.03)
  bico.add(nostril, nostril2)
  head.add(bico)

  // ---- crista de penas rosa e laranja, toda pra cima ------------------------
  const crista = new THREE.Group()
  crista.position.set(0, 0.15, -0.01)
  for (let i = 0; i < 5; i++) {
    const t = i - 2
    const feather = capsule(0.038, 0.26 - Math.abs(t) * 0.05, i % 2 === 0 ? PINK : ORANGE, {
      roughness: 0.6,
    })
    feather.position.set(t * 0.075, 0.16 - Math.abs(t) * 0.03, -0.02 - Math.abs(t) * 0.01)
    feather.rotation.z = -t * 0.26
    feather.rotation.x = -0.18
    crista.add(feather)
  }
  head.add(crista)

  // ---- asas abertas pra cima ------------------------------------------------
  function makeWing(side: number) {
    const wing = new THREE.Group()
    wing.position.set(side * 0.2, 0.68, -0.02)
    wing.rotation.z = side * 0.95

    const plate = rbox(0.82, 0.1, 0.42, 0.048, TURQ, { roughness: 0.62 })
    plate.position.set(side * 0.44, 0, 0)
    plate.rotation.z = side * 0.1
    wing.add(plate)

    const bandY = rbox(0.5, 0.07, 0.32, 0.032, WING_Y, { roughness: 0.6 })
    bandY.position.set(side * 0.66, 0.055, 0.01)
    bandY.rotation.z = side * 0.1
    wing.add(bandY)

    for (let i = 0; i < 3; i++) {
      const quill = capsule(0.048, 0.3 - i * 0.04, WING_B, { roughness: 0.62 })
      quill.position.set(side * (1.02 + i * 0.02), 0.03 - i * 0.02, (i - 1) * 0.14)
      quill.rotation.z = -side * (Math.PI / 2 - 0.12)
      wing.add(quill)
    }
    return wing
  }
  const asaL = makeWing(-1)
  const asaR = makeWing(1)
  arara.add(asaL, asaR)
  root.add(arara)

  // ---- balões subindo -------------------------------------------------------
  const baloes = new THREE.Group()
  baloes.position.y = BALLOON_UP

  const balloonSpecs: [number, number, number, string][] = [
    [-2.0, 0.35, -0.5, PINK],
    [0.35, 0.75, -1.35, ORANGE],
    [2.0, 0.1, 0.75, LIME],
  ]
  for (const [bx, by, bz, color] of balloonSpecs) {
    const balloon = new THREE.Group()
    balloon.position.set(bx, by, bz)
    balloon.rotation.z = (rand() - 0.5) * 0.3

    const skin = lathe(
      [
        [0, -0.32], [0.12, -0.29], [0.22, -0.18], [0.29, 0.02],
        [0.25, 0.2], [0.14, 0.3], [0, 0.33],
      ],
      color,
      { roughness: 0.22 },
    )
    balloon.add(skin)

    const knotTip = cone(0.055, 0.09, color, { roughness: 0.3 })
    knotTip.position.y = -0.36
    knotTip.rotation.x = Math.PI
    balloon.add(knotTip)

    const string = cylinder(0.011, 0.011, 0.55, '#f4ead7', { roughness: 0.85 })
    string.position.y = -0.68
    balloon.add(string)

    baloes.add(balloon)
  }
  root.add(baloes)

  // ---- confete que se recusa a cair ----------------------------------------
  const confete = new THREE.Group()
  confete.position.y = CONFETTI_UP
  confete.rotation.y = 1.4

  const confettiColors = [PINK, ORANGE, LIME, WING_Y, TURQ_LIGHT, GOLD]
  for (let i = 0; i < 30; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.7 + rand() * 1.75
    const piece = rbox(0.1, 0.018, 0.065, 0.008, confettiColors[i % confettiColors.length], {
      roughness: 0.45,
    })
    piece.position.set(Math.cos(a) * r, -1.05 + rand() * 2.1, Math.sin(a) * r)
    piece.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
    confete.add(piece)
  }
  root.add(confete)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'poleiro', group: 'cenario', object: poleiro },
    { name: 'corneta', group: 'corneta', object: corneta },
    { name: 'arara', group: 'arara', object: arara },
    { name: 'asaL', group: 'arara', object: asaL },
    { name: 'asaR', group: 'arara', object: asaR },
    { name: 'bico', group: 'bico', object: bico },
    { name: 'crista', group: 'bico', object: crista },
    { name: 'baloes', group: 'festa', object: baloes },
    { name: 'confete', group: 'festa', object: confete },
  ]

  // ---- montagem: tudo sobe --------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.45)], {
      ease: 'easeOut',
      caption: 'Você solta a boa notícia — e brota um tapete cor de SOL com um poleiro no meio.',
    }),
    seq('poleiro-rise', 'poleiro', 0.2, 0.8, [riseFrom(GY, 1.35)], { ease: 'easeOut' }),

    seq('corneta-rise', 'corneta', 1.9, 0.9, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'Sobe uma CORNETA dourada de boca pro céu: é a orelha que OUVE — AT-RRÖ-RA (höra).',
    }),

    seq(
      'arara-pop',
      'arara',
      3.7,
      0.7,
      [
        ch('scale.x', 0.01, 1),
        ch('scale.y', 0.01, 1),
        ch('scale.z', 0.01, 1),
        ch('position.y', PERCH_TOP, PERCH_TOP),
      ],
      {
        ease: 'easeOut',
        caption: 'A ARARA turquesa cresce do poleiro e abre as asas pra cima.',
      },
    ),
    seq('asaL-open', 'asaL', 4.05, 0.7, [ch('rotation.z', 0.12, -0.95)], { ease: 'easeOut' }),
    seq('asaR-open', 'asaR', 4.2, 0.7, [ch('rotation.z', -0.12, 0.95)], { ease: 'easeOut' }),

    seq(
      'bico-grow',
      'bico',
      5.7,
      0.5,
      [ch('scale.x', 0.01, 1.55), ch('scale.y', 0.01, 1.5), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'Ela fecha o bico num BICO DE BEIJO e guincha: VÁ, CÜL! (ü = "cool" de lábios em bico)',
      },
    ),
    seq('crista-grow', 'crista', 5.9, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('bico-pinch', 'bico', 6.25, 0.45, [ch('scale.x', 1.55, 1), ch('scale.y', 1.5, 1)]),

    seq('arara-decola', 'arara', 7.6, 0.8, [ch('position.y', PERCH_TOP, FLY_Y)], {
      ease: 'easeOut',
      caption: 'Tão alto que ela DECOLA — e devolve tudo pela corneta: AT-RRÖ-RA! AT-RRÖ-RA!',
    }),
    seq('asaL-flap-up', 'asaL', 7.6, 0.4, [ch('rotation.z', -0.95, -1.4)]),
    seq('asaR-flap-up', 'asaR', 7.68, 0.4, [ch('rotation.z', 0.95, 1.4)]),
    seq('asaL-flap-down', 'asaL', 8.0, 0.5, [ch('rotation.z', -1.4, -0.95)]),
    seq('asaR-flap-down', 'asaR', 8.08, 0.5, [ch('rotation.z', 1.4, 0.95)]),

    seq('baloes-rise', 'baloes', 8.7, 1.0, [riseFrom(BALLOON_Y, 2.7)], { ease: 'easeOut' }),
    seq('confete-rise', 'confete', 8.9, 1.0, [
      riseFrom(CONFETTI_Y, 2.8), ch('rotation.y', 0, 1.0),
    ], { ease: 'easeOut' }),

    seq('baloes-float', 'baloes', 10.5, 0.9, [ch('position.y', BALLOON_Y, BALLOON_UP)], {
      ease: 'easeOut',
      caption: 'Vad kul att höra! — "Que bom saber! / Que legal!" Aqui NADA cai: tudo sobe.',
    }),
    seq('confete-float', 'confete', 10.6, 0.9, [
      ch('position.y', CONFETTI_Y, CONFETTI_UP), ch('rotation.y', 1.0, 1.4),
    ], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 3.15, 6.4], target: [-0.05, 1.25, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-kul-att-hora',
    contexto:
      'O colega conta que passou numa entrevista, a vizinha diz que a filha nasceu, um amigo avisa que vem visitar.',
    fraseFonte: 'Que bom saber! / Que legal!',
    fraseAlvo: 'Vad kul att höra!',
    pronuncia:
      "va KÜL at HÖ-ra ('vad' perde o d; 'kul' com ü longo; 'höra' com ö arredondado)",
    ponteSonora:
      "VÁ, CÜL! AT-RRÖ-RA! (5 sílabas, tônicas em CÜL e RRÖ; CÜL = o 'cool' do inglês com LÁBIOS EM BICO DE BEIJO — é o Ü; de boca aberta vira 'kål', que é repolho; AT-RRÖ-RA = 'arara' com o A virado em bico, e o RR soprado é o h de höra — sem ele sobra 'öra' (orelha) ou 'röra' (mexer))",
    historia:
      'Você solta a boa notícia e a arara turquesa fecha o bico num bico de beijo e guincha VÁ, CÜL! tão forte que decola do poleiro. A notícia cai dentro da corneta dourada gigante — a orelha dela — e a arara devolve tudo repetindo AT-RRÖ-RA! AT-RRÖ-RA!, porque arara só sabe repetir o que OUVE. Os balões sobem junto e o confete se recusa a cair.',
  },
  createScene,
}

export default card
