import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Kan vi få notan, tack?" — CA-VI! FÔ! NÚ-TAN, TAC!
 *
 * Diorama: piso de tábuas de restaurante. Você bate no chão e manda "CA-VE!";
 * o assoalho racha, uma TOUPEIRA de capacete de minerador fura o piso (CA-VI),
 * sopra a terra num anel de poeira (FÔ), ergue a NÚ-TAN — a nota, nua, sem
 * envelope — e bate o casco na mesa: TAC!
 */

const WOOD = '#8a5a34'
const WOOD_DARK = '#5c3a22'
const CLOTH = '#ece2cf'
const MOLE = '#4e4a55'
const MOLE_LIGHT = '#6e6879'
const SNOUT = '#dd8f8c'
const CLAW = '#e8dcc2'
const SOIL = '#6a4a30'
const DUST = '#c7b190'
const RUG = '#47505e'
const PAPER = '#f8f5ec'
const INK = '#3c3a46'
const HELMET = '#f5b32a' // acento saturado reservado ao capacete de minerador

const GY = 0.18 // topo do assoalho
const TOP = 0.98 // superfície da mesa
const HOLE: [number, number] = [0.0, 0.7]
const TABLE: [number, number] = [0.95, 0.2]

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: assoalho de restaurante -----------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.55, 2.65, 0.12, WOOD_DARK, { roughness: 0.88 })
  slab.position.y = 0.06
  base.add(slab)

  const boards = cylinder(2.46, 2.55, 0.07, WOOD, { roughness: 0.72 })
  boards.position.y = 0.145
  base.add(boards)

  // frisos das tábuas, cada um cortado no diâmetro do disco naquele z
  for (const bz of [-1.85, -1.25, -0.65, -0.05, 0.55, 1.15, 1.75]) {
    const half = Math.sqrt(Math.max(2.4 * 2.4 - bz * bz, 0.04))
    const groove = rbox(half * 2, 0.014, 0.03, 0.006, WOOD_DARK, { roughness: 0.8 })
    groove.position.set(0, GY + 0.002, bz)
    base.add(groove)
  }

  // tapete sob a mesa
  const rug = cylinder(0.92, 0.95, 0.03, RUG, { roughness: 0.94 })
  rug.position.set(TABLE[0], GY + 0.015, TABLE[1])
  base.add(rug)
  const rugTrim = torus(0.9, 0.022, '#5b6675', { roughness: 0.92 })
  rugTrim.rotation.x = Math.PI / 2
  rugTrim.position.set(TABLE[0], GY + 0.02, TABLE[1])
  base.add(rugTrim)

  // adereços de ambientação
  const planter = new THREE.Group()
  planter.position.set(-1.92, GY, -0.62)
  planter.rotation.y = rand() * Math.PI
  const pot = lathe(
    [[0.11, 0], [0.15, 0.03], [0.17, 0.22], [0.18, 0.25], [0.16, 0.25], [0.145, 0.04]],
    '#a4643f',
    { roughness: 0.7 },
  )
  planter.add(pot)
  const leaves = puff(0.21, '#6b7a4a', 6, 31, { roughness: 0.9 })
  leaves.position.y = 0.4
  planter.add(leaves)
  base.add(planter)

  const cork = capsule(0.045, 0.07, '#c8a97a', { roughness: 0.85 })
  cork.position.set(0.15, GY + 0.045, 1.62)
  cork.rotation.set(Math.PI / 2, 0, rand() * Math.PI)
  base.add(cork)

  const coin = cylinder(0.075, 0.075, 0.018, '#e0b04a', { roughness: 0.32, metalness: 0.35 })
  coin.position.set(-1.35, GY + 0.01, 1.28)
  coin.rotation.z = 0.02 + rand() * 0.05
  base.add(coin)

  const pebble = rock(0.11, SOIL, 41, { roughness: 0.95 })
  pebble.position.set(1.9, GY + 0.05, 1.05)
  pebble.rotation.y = rand() * Math.PI
  base.add(pebble)

  root.add(base)

  // ---- mesa posta + cadeira -------------------------------------------------
  const mesa = new THREE.Group()

  const foot = lathe(
    [[0.31, 0], [0.33, 0.035], [0.14, 0.075], [0.11, 0.13]],
    WOOD_DARK,
    { roughness: 0.7 },
  )
  foot.position.set(TABLE[0], GY, TABLE[1])
  mesa.add(foot)

  const column = cylinder(0.085, 0.105, 0.45, WOOD_DARK, { roughness: 0.7 })
  column.position.set(TABLE[0], GY + 0.29, TABLE[1])
  mesa.add(column)

  // toalha: tampo e caimento num só sólido de revolução
  const toalha = lathe(
    [[0.60, 0], [0.645, 0.05], [0.665, 0.35], [0.625, 0.405], [0.545, 0.42], [0, 0.42]],
    CLOTH,
    { roughness: 0.92 },
  )
  toalha.position.set(TABLE[0], TOP - 0.42, TABLE[1])
  mesa.add(toalha)

  // cadeira atrás da mesa, virada para ela
  const cadeira = new THREE.Group()
  cadeira.position.set(1.72, GY, -0.78)
  cadeira.rotation.y = -0.62
  const seat = rbox(0.44, 0.06, 0.42, 0.02, WOOD, { roughness: 0.72 })
  seat.position.y = 0.52
  cadeira.add(seat)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = cylinder(0.026, 0.032, 0.52, WOOD_DARK, { roughness: 0.72 })
      leg.position.set(sx * 0.17, 0.26, sz * 0.16)
      cadeira.add(leg)
    }
    const post = cylinder(0.028, 0.03, 0.6, WOOD_DARK, { roughness: 0.72 })
    post.position.set(sx * 0.17, 0.82, -0.18)
    cadeira.add(post)
  }
  for (const by of [0.78, 0.98]) {
    const slat = rbox(0.38, 0.07, 0.04, 0.018, WOOD, { roughness: 0.72 })
    slat.position.set(0, by, -0.18)
    cadeira.add(slat)
  }
  mesa.add(cadeira)
  root.add(mesa)

  // ---- louça: refeição terminada, e nenhum garçom ---------------------------
  const louca = new THREE.Group()
  louca.position.set(TABLE[0], TOP, TABLE[1])

  const plate = lathe(
    [[0.02, 0], [0.16, 0.006], [0.245, 0.032], [0.265, 0.058], [0.245, 0.05], [0.17, 0.03], [0.02, 0.014]],
    '#f2ede2',
    { roughness: 0.16 },
  )
  plate.position.set(0.04, 0.005, 0.1)
  louca.add(plate)

  const knife = rbox(0.24, 0.012, 0.035, 0.006, '#c3c8cf', { roughness: 0.22, metalness: 0.75 })
  knife.position.set(0.05, 0.075, 0.07)
  knife.rotation.y = 0.55
  louca.add(knife)

  const glass = lathe(
    [
      [0, 0], [0.115, 0], [0.12, 0.014], [0.03, 0.024], [0.024, 0.13],
      [0.078, 0.175], [0.118, 0.265], [0.128, 0.335], [0.118, 0.335],
      [0.104, 0.272], [0.066, 0.19], [0.018, 0.152],
    ],
    '#e6efee',
    { roughness: 0.1 },
  )
  glass.position.set(0.24, 0.004, -0.1)
  louca.add(glass)

  const candle = new THREE.Group()
  candle.position.set(-0.02, 0.004, -0.28)
  const holder = lathe(
    [[0.08, 0], [0.085, 0.022], [0.048, 0.035], [0.044, 0.07]],
    '#b8873a',
    { roughness: 0.3, metalness: 0.6 },
  )
  candle.add(holder)
  const wax = cylinder(0.038, 0.042, 0.15, '#f0e6d2', { roughness: 0.6 })
  wax.position.y = 0.14
  candle.add(wax)
  const flame = cone(0.028, 0.085, '#ffcf6b', {
    emissive: '#ff9d3c',
    emissiveIntensity: 1.2,
    roughness: 0.4,
  })
  flame.position.y = 0.26
  candle.add(flame)
  louca.add(candle)

  const napkin = rbox(0.2, 0.032, 0.16, 0.014, CLOTH, { roughness: 0.95 })
  napkin.position.set(-0.34, 0.018, -0.08)
  napkin.rotation.set(0.06, 0.7, 0.04)
  louca.add(napkin)
  root.add(louca)

  // ---- o buraco no assoalho -------------------------------------------------
  const buraco = new THREE.Group()
  buraco.position.set(HOLE[0], GY, HOLE[1])

  const pit = cylinder(0.345, 0.3, 0.06, '#1e1712', { roughness: 0.98 })
  pit.position.y = -0.09
  buraco.add(pit)

  const rim = torus(0.42, 0.105, SOIL, { roughness: 0.95 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.015
  buraco.add(rim)

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rand() * 0.5
    const chunk = rock(0.07 + rand() * 0.05, SOIL, 51 + i, { roughness: 0.95 })
    chunk.position.set(Math.cos(a) * (0.52 + rand() * 0.14), 0.05, Math.sin(a) * (0.52 + rand() * 0.14))
    chunk.rotation.set(rand(), rand() * Math.PI, rand())
    buraco.add(chunk)
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.7
    const shard = rbox(0.3, 0.035, 0.11, 0.012, WOOD, { roughness: 0.75 })
    shard.position.set(Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5)
    shard.rotation.set(0.2 + rand() * 0.3, a, 0.25 - rand() * 0.5)
    buraco.add(shard)
  }
  root.add(buraco)

  // ---- a toupeira-garçom (olha para a mesa e para quem paga) ----------------
  const toupeira = new THREE.Group()
  toupeira.position.set(HOLE[0], GY, HOLE[1])
  toupeira.rotation.y = 0.45

  const torso = capsule(0.3, 0.34, MOLE, { roughness: 0.88 })
  torso.position.y = 0.42
  toupeira.add(torso)

  const belly = capsule(0.19, 0.2, MOLE_LIGHT, { roughness: 0.9 })
  belly.position.set(0, 0.4, 0.17)
  belly.scale.z = 0.62
  toupeira.add(belly)

  // gravata-borboleta de garçom
  const bow = new THREE.Group()
  bow.position.set(0, 0.74, 0.26)
  for (const side of [-1, 1]) {
    const wing = rbox(0.1, 0.09, 0.05, 0.022, '#2f3038', { roughness: 0.5 })
    wing.position.x = side * 0.07
    wing.rotation.z = side * 0.25
    bow.add(wing)
  }
  const knot = sphere(0.033, '#23242b', { roughness: 0.45 })
  bow.add(knot)
  toupeira.add(bow)

  const skull = sphere(0.24, MOLE, { roughness: 0.88 })
  skull.position.y = 0.92
  skull.scale.set(0.96, 0.9, 1)
  toupeira.add(skull)

  const snout = cone(0.1, 0.3, SNOUT, { roughness: 0.75 })
  snout.rotation.x = Math.PI / 2
  snout.position.set(0, 0.86, 0.26)
  toupeira.add(snout)

  const nose = sphere(0.055, '#c46f74', { roughness: 0.4 })
  nose.position.set(0, 0.86, 0.42)
  toupeira.add(nose)

  for (const side of [-1, 1]) {
    const eye = sphere(0.05, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.115, 0.98, 0.2)
    eye.scale.z = 0.6
    const pupil = sphere(0.026, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.115, 0.98, 0.235)
    toupeira.add(eye, pupil)
  }
  root.add(toupeira)

  // ---- capacete de minerador (telescopa de dentro da cabeça) ----------------
  const capacete = new THREE.Group()
  capacete.position.set(0, 1.08, 0.02)
  const dome = lathe(
    [[0.27, 0], [0.28, 0.03], [0.26, 0.11], [0.19, 0.18], [0, 0.21]],
    HELMET,
    { roughness: 0.34 },
  )
  capacete.add(dome)
  const brim = lathe(
    [[0, 0], [0.33, 0], [0.335, 0.025], [0.29, 0.03], [0, 0.03]],
    HELMET,
    { roughness: 0.34 },
  )
  capacete.add(brim)
  const visor = rbox(0.24, 0.035, 0.16, 0.014, HELMET, { roughness: 0.34 })
  visor.position.set(0, 0.02, 0.3)
  visor.rotation.x = -0.12
  capacete.add(visor)
  const crest = rbox(0.05, 0.05, 0.42, 0.02, '#d99a1e', { roughness: 0.34 })
  crest.position.set(0, 0.16, 0)
  capacete.add(crest)
  const lampCase = cylinder(0.072, 0.078, 0.06, '#c3c8cf', { roughness: 0.24, metalness: 0.85 })
  lampCase.rotation.x = Math.PI / 2
  lampCase.position.set(0, 0.09, 0.25)
  capacete.add(lampCase)
  const lens = sphere(0.058, '#fff3c4', {
    emissive: '#ffd873',
    emissiveIntensity: 1.2,
    roughness: 0.2,
  })
  lens.position.set(0, 0.09, 0.29)
  capacete.add(lens)
  toupeira.add(capacete)

  // ---- anel de poeira soprado pelo focinho (FÔ) -----------------------------
  // o anel sobe em diagonal, ao lado da cabeça, sem tapar a cara da toupeira
  const poeira = new THREE.Group()
  poeira.position.set(0.52, 1.4, 0.5)
  const ring = torus(0.22, 0.062, DUST, { roughness: 0.96 })
  poeira.add(ring)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4
    const lump = puff(0.055 + rand() * 0.02, DUST, 4, 61 + i, { roughness: 0.96 })
    lump.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.22, (rand() - 0.5) * 0.06)
    poeira.add(lump)
  }
  // rastro de terra do focinho até o anel
  const rastro: [number, number, number, number][] = [
    [-0.4, -0.46, -0.06, 0.045],
    [-0.29, -0.33, -0.04, 0.055],
    [-0.17, -0.2, -0.02, 0.06],
  ]
  for (const [tx, ty, tz, tr] of rastro) {
    const bolota = puff(tr, '#d6c3a6', 4, 71 + Math.round(tr * 100), { roughness: 0.96 })
    bolota.position.set(tx, ty, tz)
    poeira.add(bolota)
  }
  toupeira.add(poeira)

  // ---- patinha erguida com a NÚ-TAN (pivô no ombro) -------------------------
  const patinha = new THREE.Group()
  patinha.position.set(-0.27, 0.68, 0.02)
  patinha.rotation.z = 0.42

  const upperArm = capsule(0.07, 0.24, MOLE, { roughness: 0.88 })
  upperArm.position.y = 0.19
  patinha.add(upperArm)
  const paw = sphere(0.105, MOLE, { roughness: 0.88 })
  paw.position.y = 0.42
  patinha.add(paw)
  for (const cx of [-0.06, 0, 0.06]) {
    const claw = cone(0.024, 0.11, CLAW, { roughness: 0.55 })
    claw.position.set(cx, 0.5, 0.03)
    claw.rotation.z = -cx * 4
    patinha.add(claw)
  }
  toupeira.add(patinha)

  // a nota: papel nu, sem envelope
  const nota = new THREE.Group()
  nota.position.set(0.02, 0.62, 0.06)
  nota.rotation.set(0.06, -0.3, -0.32)
  const sheet = rbox(0.3, 0.46, 0.012, 0.008, PAPER, { roughness: 0.72 })
  nota.add(sheet)
  const header = rbox(0.13, 0.028, 0.006, 0.002, INK, { roughness: 0.6 })
  header.position.set(-0.06, 0.185, 0.011)
  nota.add(header)
  for (const ly of [0.11, 0.035, -0.04, -0.115]) {
    const line = rbox(0.18, 0.017, 0.006, 0.002, INK, { roughness: 0.6 })
    line.position.set(-0.03, ly, 0.011)
    nota.add(line)
  }
  const total = rbox(0.22, 0.032, 0.006, 0.003, INK, { roughness: 0.6 })
  total.position.set(0.01, -0.185, 0.011)
  nota.add(total)
  patinha.add(nota)

  // ---- casco de baixo: o que bate na mesa (TAC) -----------------------------
  const casco = new THREE.Group()
  casco.position.set(0.26, 0.72, 0.1)
  casco.rotation.set(0, -0.3, -1.15)

  const lowerArm = capsule(0.075, 0.3, MOLE, { roughness: 0.88 })
  lowerArm.position.y = 0.21
  casco.add(lowerArm)
  const digPaw = sphere(0.115, MOLE, { roughness: 0.88 })
  digPaw.position.y = 0.44
  casco.add(digPaw)
  for (const cx of [-0.07, 0, 0.07]) {
    const claw = cone(0.028, 0.13, CLAW, { roughness: 0.55 })
    claw.position.set(cx, 0.53, 0.02)
    claw.rotation.z = -cx * 3.5
    casco.add(claw)
  }
  toupeira.add(casco)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'louca', group: 'mesa', object: louca },
    { name: 'buraco', group: 'buraco', object: buraco },
    { name: 'toupeira', group: 'toupeira', object: toupeira },
    { name: 'capacete', group: 'toupeira', object: capacete },
    { name: 'casco', group: 'toupeira', object: casco },
    { name: 'poeira', group: 'sopro', object: poeira },
    { name: 'patinha', group: 'nota', object: patinha },
    { name: 'nota', group: 'nota', object: nota },
  ]

  // ---- montagem -------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Restaurante sueco: você terminou de comer e a conta simplesmente não vem.',
    }),

    seq('mesa-rise', 'mesa', 1.75, 0.8, [riseFrom(0, 1.5)], {
      ease: 'easeOut',
      caption: 'Prato limpo, taça vazia, vela acesa — e nenhum garçom rondando a mesa.',
    }),
    seq('louca-rise', 'louca', 1.95, 0.75, [riseFrom(TOP, 1.6)], { ease: 'easeOut' }),

    seq(
      'buraco-crack',
      'buraco',
      3.55,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'Você bate no piso e manda: "CA-VE!" — o assoalho racha e abre um buraco.',
      },
    ),

    seq('toupeira-rise', 'toupeira', 5.15, 0.85, [riseFrom(GY, 1.6)], {
      ease: 'easeOut',
      caption: 'Fura o chão uma TOUPEIRA de gravata: CA-VI! (kan vi)',
    }),
    seq('capacete-pop', 'capacete', 6.0, 0.6, [ch('position.y', 0.8, 1.08)], { ease: 'easeOut' }),
    seq('casco-dig-out', 'casco', 6.15, 0.75, [ch('rotation.z', 2.9, -1.15)], { ease: 'easeOut' }),

    seq('toupeira-inspira', 'toupeira', 7.0, 0.35, [ch('rotation.x', 0, -0.08)], { ease: 'easeOut' }),
    seq(
      'poeira-sopro',
      'poeira',
      7.15,
      0.75,
      [
        ch('scale.x', 0.01, 1),
        ch('scale.y', 0.01, 1),
        ch('scale.z', 0.01, 1),
        ch('position.z', 0.2, 0.5),
      ],
      {
        ease: 'easeOut',
        caption: 'Ela enche as bochechas e sopra a terra num círculo: FÔÔÔ! (få)',
      },
    ),
    seq('toupeira-sopra', 'toupeira', 7.35, 0.5, [ch('rotation.x', -0.08, 0.06)], { ease: 'easeIn' }),
    seq('toupeira-volta', 'toupeira', 7.85, 0.5, [ch('rotation.x', 0.06, 0)], { ease: 'easeOut' }),

    seq(
      'patinha-brota',
      'patinha',
      8.75,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: 'E ergue a NÚ-TAN — a nota, nua, sem envelope. (notan)' },
    ),
    seq(
      'nota-desdobra',
      'nota',
      8.95,
      0.8,
      [
        ch('scale.x', 0.01, 1),
        ch('scale.y', 0.01, 1),
        ch('scale.z', 0.01, 1),
        ch('position.y', 0.2, 0.62),
      ],
      { ease: 'easeOut' },
    ),
    seq('patinha-ergue', 'patinha', 9.95, 0.7, [ch('rotation.z', 0.02, 0.42)], { ease: 'easeOut' }),

    seq('casco-arma', 'casco', 11.2, 0.35, [ch('rotation.z', -1.15, -0.72)], { ease: 'easeOut' }),
    seq('casco-bate', 'casco', 11.55, 0.28, [ch('rotation.z', -0.72, -1.22)], {
      ease: 'easeIn',
      caption: 'O casco bate na mesa: TAC! — Kan vi få notan, tack?',
    }),
    seq('toupeira-impacto', 'toupeira', 11.75, 0.28, [ch('rotation.x', 0, 0.07)], { ease: 'easeOut' }),
    seq('casco-assenta', 'casco', 11.83, 0.5, [ch('rotation.z', -1.22, -1.15)], { ease: 'easeOut' }),
    seq('toupeira-assenta', 'toupeira', 12.03, 0.45, [ch('rotation.x', 0.07, 0)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.55, 2.6, 5.0], target: [0.4, 0.95, 0.3] },
  }
}

export const card: Card = {
  refine: { organic: ['toupeira', 'patinha', 'casco', 'poeira'] },
  meta: {
    id: 'kan-vi-fa-notan-tack',
    contexto: "Restaurante e bar com serviço à mesa. Sozinho: 'Kan jag få notan, tack?'.",
    fraseFonte: 'Pode trazer a conta, por favor?',
    fraseAlvo: 'Kan vi få notan, tack?',
    pronuncia: "kan vi fó NÚ-tan, tak ('få' com ô fechado; 'notan' soa 'NÚ-tan')",
    ponteSonora:
      "CA-VI! FÔ! NÚ-TAN, TAC! ('cave' lido à brasileira, KÁ-vi, com o A levemente nasal; FÔ de boca redonda, nunca 'fó')",
    historia:
      'Você terminou de comer e a conta não vem. Bate no piso e manda: "CAVE!". Uma toupeira de capacete de minerador fura o chão, enche as bochechas e sopra a terra em círculo (FÔÔ), e ergue a NÚ-TAN — a nota, nua, sem envelope. O casco bate na mesa: TAC!',
  },
  createScene,
}

export default card
