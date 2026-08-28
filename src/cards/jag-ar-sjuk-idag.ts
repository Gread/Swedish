import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag är sjuk idag, så jag stannar hemma." — o pirata resfriado (RRÜÜK!)
 * cancela a viagem e rema na sala de casa (STÁNAR RRÉMA), enquanto o
 * suricato-timoneiro marca o ritmo no megafone laranja.
 *
 * Diorama: tapete azul-marinho da sala; máquina de remo de través, com
 * roda-volante e cabo; pirata inclinado pra trás com um lenço-vela inflado no
 * nariz; caixote de madeira mel à direita com o suricato ereto de megafone.
 */

const FLOOR = '#8a6234'
const RUG = '#27395c'        // matiz 1: a casa
const RUG_LINE = '#3d5c8c'
const WOOD = '#c98f4e'       // matiz 2: madeira mel
const WOOD_DARK = '#9d6a33'
const CREAM = '#ece2cf'      // matiz 3: listras do pirata / lenço
const CANVAS = '#f2ece0'
const METAL = '#8d959c'
const DARK = '#39414a'
const SKIN = '#e8c39e'
const RED = '#a5453a'        // bandana e listras
const NOSE = '#c9705c'
const FUR = '#c2a173'
const FUR_LIGHT = '#e2cba6'
const FUR_DARK = '#8a6a45'
const ACCENT = '#ef7215'     // acento saturado RESERVADO: o megafone

const GY = 0.17   // topo do tapete
const PY = 0.53   // quadril do pirata (topo do banco)
const RAIL = GY + 0.24
const HUB = new THREE.Vector3(-1.15, GY + 0.5, 0)
const CORD = 1.2  // comprimento do cabo na pose final (fim da remada)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: a sala ---------------------------------------------
  const base = new THREE.Group()

  const floor = cylinder(2.62, 2.7, 0.1, FLOOR, { roughness: 0.75 })
  floor.position.y = 0.05
  base.add(floor)

  const rug = cylinder(2.3, 2.34, 0.07, RUG, { roughness: 0.95 })
  rug.position.y = 0.135
  base.add(rug)

  const rugRing = torus(1.98, 0.028, RUG_LINE, { roughness: 0.95 })
  rugRing.rotation.x = Math.PI / 2
  rugRing.position.y = GY + 0.002
  base.add(rugRing)

  // adereços de sala, espalhados com rng fixo
  const pot = lathe(
    [[0, 0], [0.17, 0], [0.19, 0.06], [0.16, 0.24], [0.19, 0.28], [0.185, 0.3], [0.15, 0.26], [0, 0.26]],
    '#b06a4a',
    { roughness: 0.35 },
  )
  pot.position.set(-1.72, GY, 1.2)
  pot.rotation.y = rand() * Math.PI
  const leaves = puff(0.24, '#3f7d4a', 6, 31, { roughness: 0.9 })
  leaves.position.y = 0.44
  pot.add(leaves)
  base.add(pot)

  const books = new THREE.Group()
  books.position.set(1.42, GY, 1.4)
  books.rotation.y = -0.4 + rand() * 0.3
  for (const [i, color] of [WOOD_DARK, '#4b6b53', RED].entries()) {
    const bk = rbox(0.34, 0.07, 0.24, 0.015, color, { roughness: 0.7 })
    bk.position.set((rand() - 0.5) * 0.05, 0.035 + i * 0.07, (rand() - 0.5) * 0.05)
    bk.rotation.y = (rand() - 0.5) * 0.22
    books.add(bk)
  }
  base.add(books)

  const mug = lathe(
    [[0, 0], [0.08, 0], [0.085, 0.02], [0.075, 0.13], [0.078, 0.14], [0.065, 0.13], [0.07, 0.03], [0, 0.03]],
    CREAM,
    { roughness: 0.15 },
  )
  mug.position.set(-1.35, GY, -1.25)
  const handle = torus(0.05, 0.014, CREAM, { roughness: 0.15 })
  handle.position.set(0.09, 0.08, 0)
  mug.add(handle)
  base.add(mug)

  root.add(base)

  // ---- máquina de remo -----------------------------------------------------
  const maquina = new THREE.Group()
  root.add(maquina)

  const trilho = rbox(2.3, 0.1, 0.2, 0.04, METAL, { roughness: 0.28, metalness: 0.7 })
  trilho.position.set(-0.05, RAIL, 0)
  maquina.add(trilho)

  const legFront = rbox(0.24, 0.26, 0.5, 0.06, DARK, { roughness: 0.4 })
  legFront.position.set(-0.95, GY + 0.12, 0)
  maquina.add(legFront)

  const legRear = rbox(0.2, 0.24, 0.46, 0.05, DARK, { roughness: 0.4 })
  legRear.position.set(0.92, GY + 0.11, 0)
  maquina.add(legRear)

  const housing = rbox(0.26, 0.62, 0.44, 0.07, DARK, { roughness: 0.4 })
  housing.position.set(HUB.x, GY + 0.31, 0)
  maquina.add(housing)

  // apoio dos pés, inclinado
  const plate = rbox(0.1, 0.42, 0.54, 0.03, DARK, { roughness: 0.45 })
  plate.position.set(-0.52, GY + 0.24, 0.12)
  plate.rotation.z = -0.32
  maquina.add(plate)
  for (const side of [-1, 1]) {
    const strap = rbox(0.05, 0.06, 0.2, 0.02, CREAM, { roughness: 0.9 })
    strap.position.set(0.06, 0.06, side * 0.16)
    plate.add(strap)
  }

  // roda-volante: gira de verdade na remada
  const roda = new THREE.Group()
  roda.position.copy(HUB)
  maquina.add(roda)

  const rim = torus(0.4, 0.075, DARK, { roughness: 0.35 })
  roda.add(rim)
  for (let i = 0; i < 4; i++) {
    const spoke = rbox(0.74, 0.05, 0.05, 0.02, METAL, { roughness: 0.3, metalness: 0.7 })
    spoke.rotation.z = (i * Math.PI) / 4
    roda.add(spoke)
  }
  const hubCap = cylinder(0.09, 0.09, 0.16, METAL, { roughness: 0.25, metalness: 0.8 })
  hubCap.rotation.x = Math.PI / 2
  roda.add(hubCap)

  // cabo + pegador: brota da roda e estica/encolhe com a remada
  const cabo = new THREE.Group()
  cabo.position.set(HUB.x, 0.98, 0)
  maquina.add(cabo)

  const cord = cylinder(0.022, 0.022, CORD, '#413a30', { roughness: 0.9 })
  cord.rotation.z = Math.PI / 2
  cord.position.x = CORD / 2
  cabo.add(cord)

  const bar = cylinder(0.036, 0.036, 0.68, METAL, { roughness: 0.25, metalness: 0.8 })
  bar.rotation.x = Math.PI / 2
  bar.position.x = CORD
  cabo.add(bar)
  for (const side of [-1, 1]) {
    const grip = cylinder(0.05, 0.05, 0.15, '#2b2f36', { roughness: 0.6 })
    grip.rotation.x = Math.PI / 2
    grip.position.set(CORD, 0, side * 0.28)
    cabo.add(grip)
  }

  // ---- pirata resfriado ----------------------------------------------------
  const pirata = new THREE.Group()
  pirata.position.set(0.15, PY, 0)
  pirata.rotation.y = -Math.PI / 2 + 0.25 // olha para a roda-volante
  root.add(pirata)

  // banco deslizante (anda junto com ele)
  const seat = cylinder(0.17, 0.175, 0.08, WOOD, { roughness: 0.7 })
  seat.position.y = -0.055
  pirata.add(seat)
  const slider = cylinder(0.09, 0.09, 0.07, DARK, { roughness: 0.4 })
  slider.position.y = -0.12
  pirata.add(slider)

  // pernas ficam retas no trilho: não acompanham a inclinação do tronco
  for (const side of [-1, 1]) {
    const thigh = capsule(0.1, 0.32, RUG, { roughness: 0.85 })
    thigh.position.set(side * 0.14, 0.04, 0.24)
    thigh.rotation.x = Math.PI / 2
    pirata.add(thigh)

    const shin = capsule(0.085, 0.28, RUG, { roughness: 0.85 })
    shin.position.set(side * 0.15, -0.1, 0.5)
    shin.rotation.x = 0.6
    pirata.add(shin)

    const boot = rbox(0.16, 0.13, 0.24, 0.05, '#4a3526', { roughness: 0.65 })
    boot.position.set(side * 0.15, -0.31, 0.62)
    boot.rotation.x = -0.25
    pirata.add(boot)
  }

  // tronco: person() + inclinação pra trás
  const corpo = person({ body: CREAM, skin: SKIN, height: 1.5, armAngle: 0.26 })
  corpo.rotation.x = -0.35
  pirata.add(corpo)

  // listras vermelhas na camisa
  for (const y of [0.29, 0.43, 0.56]) {
    const stripe = cylinder(0.259, 0.259, 0.08, RED, { roughness: 0.9 })
    stripe.position.y = y
    corpo.add(stripe)
  }

  // braços esticados pra frente, agarrados no pegador
  for (const armName of ['armL', 'armR']) {
    const arm = corpo.getObjectByName(armName)
    if (arm) arm.rotation.x = -1.35
  }

  const head = corpo.getObjectByName('head')!

  const bandana = sphere(0.29, RED, { roughness: 0.9 })
  bandana.scale.set(1.02, 0.6, 1.02)
  bandana.position.y = 0.12
  head.add(bandana)
  const knot = sphere(0.075, RED, { roughness: 0.9 })
  knot.position.set(-0.24, 0.1, -0.16)
  head.add(knot)
  for (const t of [-1, 1]) {
    const tail = capsule(0.035, 0.16, RED, { roughness: 0.9 })
    tail.position.set(-0.3, 0.02 + t * 0.05, -0.24 - t * 0.03)
    tail.rotation.set(0.3, 0, 1.1 + t * 0.25)
    head.add(tail)
  }

  const strap = torus(0.283, 0.014, '#2b2b2b', { roughness: 0.6 })
  strap.rotation.set(Math.PI / 2 + 0.12, 0, 0)
  strap.position.y = 0.035
  head.add(strap)
  const patch = rbox(0.15, 0.13, 0.03, 0.045, '#2b2b2b', { roughness: 0.6 })
  patch.position.set(0.108, 0.038, 0.245)
  head.add(patch)

  const potato = sphere(0.11, NOSE, { roughness: 0.8 })
  potato.position.set(0, -0.025, 0.265)
  potato.scale.set(1, 0.9, 1.1)
  head.add(potato)

  const beard = puff(0.12, '#4a3a2e', 5, 41, { roughness: 0.95 })
  beard.position.set(0, -0.19, 0.13)
  beard.scale.set(1, 0.85, 0.9)
  head.add(beard)

  // ---- lenço-vela inflado no nariz (RRÜÜK!) --------------------------------
  const lenco = new THREE.Group()
  lenco.position.set(0, -0.03, 0.3)
  lenco.rotation.x = -0.3
  head.add(lenco)

  const sail = cone(0.36, 0.78, CANVAS, { roughness: 0.92 })
  sail.rotation.x = -Math.PI / 2
  sail.position.z = 0.39
  lenco.add(sail)
  const hem = torus(0.355, 0.035, CANVAS, { roughness: 0.92 })
  hem.position.z = 0.78
  lenco.add(hem)
  const crumple = puff(0.11, CANVAS, 5, 17, { roughness: 0.92 })
  crumple.position.set(0.16, 0.1, 0.62)
  lenco.add(crumple)

  // ---- pilha de lenços usados ----------------------------------------------
  const pilha = new THREE.Group()
  pilha.position.set(0.95, GY, 0.88)
  for (const [i, [px, pz, r]] of ([[0, 0, 0.15], [0.22, 0.1, 0.12], [0.1, -0.2, 0.13]] as const).entries()) {
    const wad = puff(r, CANVAS, 5, 51 + i, { roughness: 0.92 })
    wad.position.set(px, r * 0.75, pz)
    wad.rotation.y = rand() * Math.PI
    pilha.add(wad)
  }
  root.add(pilha)

  // ---- caixote do vigia ----------------------------------------------------
  const caixote = new THREE.Group()
  caixote.position.set(1.6, 0, -0.5)
  caixote.rotation.y = -0.3
  root.add(caixote)

  const crate = rbox(0.66, 0.5, 0.6, 0.03, WOOD, { roughness: 0.75 })
  crate.position.y = GY + 0.25
  caixote.add(crate)
  for (const side of [-1, 1]) {
    for (const y of [GY + 0.12, GY + 0.38]) {
      const plank = rbox(0.68, 0.06, 0.03, 0.012, WOOD_DARK, { roughness: 0.8 })
      plank.position.set(0, y, side * 0.305)
      caixote.add(plank)
    }
  }
  const lip = rbox(0.7, 0.05, 0.64, 0.02, WOOD_DARK, { roughness: 0.8 })
  lip.position.y = GY + 0.5
  caixote.add(lip)

  // ---- suricato-timoneiro ---------------------------------------------------
  const suricato = new THREE.Group()
  suricato.position.set(0, GY + 0.5, 0)
  suricato.rotation.y = -1.24 // berra na direção do pirata
  caixote.add(suricato)

  const trunk = capsule(0.145, 0.3, FUR, { roughness: 0.9 })
  trunk.position.y = 0.32
  suricato.add(trunk)

  const belly = capsule(0.09, 0.18, FUR_LIGHT, { roughness: 0.9 })
  belly.position.set(0, 0.3, 0.095)
  belly.scale.z = 0.55
  suricato.add(belly)

  const skull = sphere(0.135, FUR, { roughness: 0.9 })
  skull.position.y = 0.665
  suricato.add(skull)

  const muzzle = sphere(0.075, FUR_LIGHT, { roughness: 0.9 })
  muzzle.position.set(0, 0.625, 0.1)
  muzzle.scale.set(0.9, 0.75, 1.2)
  suricato.add(muzzle)

  const snout = sphere(0.03, '#2b211a', { roughness: 0.4 })
  snout.position.set(0, 0.635, 0.175)
  suricato.add(snout)

  for (const side of [-1, 1]) {
    const mask = sphere(0.055, FUR_DARK, { roughness: 0.9 })
    mask.position.set(side * 0.06, 0.7, 0.085)
    mask.scale.set(1, 0.85, 0.4)
    suricato.add(mask)

    const eye = sphere(0.042, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.06, 0.7, 0.113)
    eye.scale.z = 0.6
    const pupil = sphere(0.02, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.06, 0.7, 0.132)
    suricato.add(eye, pupil)

    const ear = sphere(0.042, FUR_DARK, { roughness: 0.9 })
    ear.position.set(side * 0.115, 0.735, 0.005)
    ear.scale.z = 0.5
    suricato.add(ear)

    const paw = capsule(0.035, 0.1, FUR, { roughness: 0.9 })
    paw.position.set(side * 0.135, 0.41, 0.06)
    paw.rotation.set(-0.7, 0, -side * 0.5)
    const hand = sphere(0.042, FUR_DARK, { roughness: 0.9 })
    hand.position.y = -0.08
    paw.add(hand)
    suricato.add(paw)

    const foot = rbox(0.1, 0.05, 0.17, 0.02, FUR_DARK, { roughness: 0.9 })
    foot.position.set(side * 0.09, 0.03, 0.05)
    suricato.add(foot)
  }

  const tail = capsule(0.045, 0.34, FUR, { roughness: 0.9 })
  tail.position.set(0, 0.16, -0.18)
  tail.rotation.x = 0.55
  suricato.add(tail)

  // ---- megafone laranja (o acento) -----------------------------------------
  const megafone = new THREE.Group()
  megafone.position.set(0.1, 0.52, 0.1)
  megafone.rotation.x = 1.0
  suricato.add(megafone)

  const bell = lathe(
    [
      [0, 0], [0.05, 0.02], [0.05, 0.16], [0.09, 0.27], [0.14, 0.37], [0.18, 0.45],
      [0.17, 0.47], [0.13, 0.4], [0.08, 0.29], [0.042, 0.18], [0.042, 0.045], [0, 0.05],
    ],
    ACCENT,
    { roughness: 0.35 },
  )
  megafone.add(bell)
  const mouthpiece = sphere(0.055, '#2b2f36', { roughness: 0.5 })
  mouthpiece.position.y = -0.01
  mouthpiece.scale.y = 0.7
  megafone.add(mouthpiece)
  const gripBar = cylinder(0.018, 0.018, 0.12, '#2b2f36', { roughness: 0.5 })
  gripBar.position.set(0, 0.14, -0.08)
  gripBar.rotation.x = 0.3
  megafone.add(gripBar)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'maquina', group: 'remo', object: maquina },
    { name: 'roda', group: 'remo', object: roda },
    { name: 'cabo', group: 'remo', object: cabo },
    { name: 'pirata', group: 'pirata', object: pirata },
    { name: 'lenco', group: 'lenco', object: lenco },
    { name: 'pilha', group: 'lenco', object: pilha },
    { name: 'caixote', group: 'suricato', object: caixote },
    { name: 'suricato', group: 'suricato', object: suricato },
    { name: 'megafone', group: 'grito', object: megafone },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Sala de casa virada galé: brota o tapete azul-marinho e, nele, uma máquina de remo.',
    }),

    seq('maquina-rise', 'maquina', 1.6, 0.9, [riseFrom(0, 1.5)], { ease: 'easeOut' }),
    seq(
      'roda-grow',
      'roda',
      1.85,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('cabo-out', 'cabo', 2.05, 0.7, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),

    seq('pirata-rise', 'pirata', 3.5, 0.85, [riseFrom(PY, 2.1)], {
      ease: 'easeOut',
      caption: 'O pirata acorda entupido — IÁ É… — e senta no banco, inclinado pra trás.',
    }),

    seq(
      'lenco-inflate',
      'lenco',
      5.3,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'RRÜÜK! Ele assoa num lenço do tamanho da vela do navio: IÁ É RRÜÜK IDÁG.',
      },
    ),
    seq('pilha-rise', 'pilha', 5.5, 0.7, [riseFrom(GY, 0.75)], { ease: 'easeOut' }),

    seq('caixote-rise', 'caixote', 7.1, 0.85, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'Viagem cancelada. Do caixote sobe o suricato-timoneiro, ereto feito poste de vigia…',
    }),
    seq('suricato-up', 'suricato', 7.35, 0.75, [ch('position.y', -0.25, GY + 0.5)], {
      ease: 'easeOut',
    }),

    seq(
      'megafone-grow',
      'megafone',
      8.9,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…e berra no megafone: SÔ! IÁ STÁNAR RRÉMA! — ele fica em casa, mas remando.',
      },
    ),

    // remada: recuperação (desliza pra frente) e puxada (volta e gira a roda)
    seq('pirata-slide-in', 'pirata', 9.8, 0.65, [ch('position.x', 0.15, -0.22)]),
    seq('cabo-in', 'cabo', 9.8, 0.65, [ch('scale.x', 1, 0.69)]),
    seq('suricato-bounce-up', 'suricato', 9.8, 0.35, [ch('position.y', GY + 0.5, GY + 0.58)], {
      ease: 'easeOut',
    }),
    seq('megafone-jab', 'megafone', 9.8, 0.35, [ch('rotation.x', 1.0, 0.8)], { ease: 'easeOut' }),
    seq('suricato-bounce-down', 'suricato', 10.15, 0.35, [ch('position.y', GY + 0.58, GY + 0.5)]),
    seq('megafone-back', 'megafone', 10.15, 0.35, [ch('rotation.x', 0.8, 1.0)]),

    seq('pirata-drive', 'pirata', 10.5, 0.7, [ch('position.x', -0.22, 0.15)]),
    seq('cabo-pull', 'cabo', 10.5, 0.7, [ch('scale.x', 0.69, 1)]),
    seq('roda-spin', 'roda', 10.5, 0.7, [ch('rotation.z', 0, -2 * Math.PI)], { ease: 'easeIn' }),

    seq('roda-coast', 'roda', 11.2, 0.9, [ch('rotation.z', -2 * Math.PI, -4 * Math.PI)], {
      ease: 'easeOut',
      caption: 'Jag är sjuk idag, så jag stannar hemma.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.15, 3.0, 5.9], target: [0.3, 1.0, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-sjuk-idag',
    contexto: 'SMS ou ligação para o chefe de manhã cedo — a sjukanmälan padrão.',
    fraseFonte: 'Estou doente hoje, então vou ficar em casa.',
    fraseAlvo: 'Jag är sjuk idag, så jag stannar hemma.',
    pronuncia:
      "iá é RHÚUK i-DÁG, só iá STÁN-nar HÉM-ma ('sj' de sjuk = sopro forte tipo RR carioca; 'jag' = iá, o -g não soa)",
    ponteSonora:
      "IÁ É RRÜÜK IDÁG — SÔ! IÁ STÁNAR RRÉMA (11 sílabas; RRÜÜK = o 'sj' soprado com lábios de U e língua de I, nunca 'chuque'; SÔ com Ô FECHADO; 'stannar' guarda o -R BRANDO, que emenda direto no h soprado de 'hemma' — STÁNAR-RRÉMA, quase 'está na rema'; sem esse R sobra 'stanna', outro verbo)",
    historia:
      'O pirata acorda com o nariz entupido e assoa num lenço do tamanho da vela do navio: RRÜÜK! Viagem cancelada — mas pirata parado enferruja, então ele senta na máquina de remo da sala e rema pra lugar nenhum. O suricato-timoneiro sobe no caixote, fica ereto feito poste de vigia e berra no megafone: SÔ! IÁ STÁNAR RRÉMA! — ele fica em casa, só que remando.',
  },
  createScene,
}

export default card
