import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, cylinder, sphere, cone, torus, puff,
} from '../rig/helpers'

/**
 * "Vi åker till landet." — VI! ÔÔ, QUER?... TILÂND(ia)-ET!
 *
 * Numa estrada de terra entre campos amarelos, o cavalinho de Dalarna
 * (vermelho, pintado de flores, sela azul vazia) vira a cabeça pra trás
 * oferecendo carona, parado junto da placa TILÂNDIA — com o IA riscado e um
 * ET pintado à mão numa tábua pregada por cima.
 */

const TURF = '#9aa648'
const SOIL = '#4a3a26'
const ROAD = '#cdb48a'
const ROAD_DARK = '#b39a6f'
const RAPS = '#e8c93a'
const LEAF = '#5f8a3e'
const HORSE = '#d23a2b' // acento saturado: o cavalinho (e o ET da placa)
const BLACK = '#1f1a1a'
const WHITE = '#f4efe2'
const YELLOW = '#f0c445'
const GREEN = '#3f8a4f'
const BLUE = '#2f5fa8'
const GOLD = '#e2b23c'
const FALU = '#8a2f25'
const WOOD = '#5b3f26'
const CREAM = '#efe3c8'
const LAKE = '#4f8fc0'

const GY = 0.18
const HX = -0.55
const HZ = 0.12

function stroke(w: number, h: number, x: number, y: number, color: string, rot = 0) {
  const s = rbox(w, h, 0.03, 0.008, color, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Letras de traço grosso em unidade 1 de altura (escala pelo grupo). */
function letter(c: string, color: string) {
  const g = new THREE.Group()
  const t = 0.18
  const add = (w: number, h: number, x: number, y: number, r = 0) => g.add(stroke(w, h, x, y, color, r))
  if (c === 'T') { add(0.7, t, 0, 0.5 - t / 2); add(t, 1, 0, 0) }
  else if (c === 'I') { add(t, 1, 0, 0) }
  else if (c === 'L') { add(t, 1, -0.22, 0); add(0.6, t, 0.0, -0.5 + t / 2) }
  else if (c === 'A' || c === 'Â') {
    add(t, 1.06, -0.17, 0, -0.34); add(t, 1.06, 0.17, 0, 0.34); add(0.42, t * 0.9, 0, -0.16)
    if (c === 'Â') { add(t * 0.8, 0.3, -0.1, 0.72, -0.8); add(t * 0.8, 0.3, 0.1, 0.72, 0.8) }
  } else if (c === 'N') { add(t, 1, -0.26, 0); add(t, 1, 0.26, 0); add(t, 1.12, 0, 0, 0.47) }
  else if (c === 'D') {
    add(t, 1, -0.26, 0); add(0.4, t, -0.1, 0.5 - t / 2); add(0.4, t, -0.1, -0.5 + t / 2)
    add(t, 0.6, 0.26, 0); add(t, 0.32, 0.18, 0.36, -0.75); add(t, 0.32, 0.18, -0.36, 0.75)
  } else if (c === 'E') {
    add(t, 1, -0.24, 0); add(0.56, t, 0.02, 0.5 - t / 2); add(0.46, t, -0.03, 0); add(0.56, t, 0.02, -0.5 + t / 2)
  }
  return g
}

/** Florzinha de kurbits pintada (plana, no plano xy). */
function flower(color: string, r: number) {
  const g = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const p = sphere(r * 0.5, color, { roughness: 0.5 })
    p.scale.set(1, 1.5, 0.25)
    p.position.set(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 0)
    p.rotation.z = a - Math.PI / 2
    g.add(p)
  }
  const c = sphere(r * 0.38, YELLOW, { roughness: 0.5 })
  c.scale.z = 0.4
  g.add(c)
  for (const s of [-1, 1]) {
    const leaf = sphere(r * 0.45, GREEN, { roughness: 0.6 })
    leaf.scale.set(1.8, 0.7, 0.25)
    leaf.position.set(s * r * 1.25, -r * 0.6, -0.005)
    leaf.rotation.z = s * 0.5
    g.add(leaf)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(7)

  // ---- base: campo verde-amarelado -----------------------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)
  const turf = cylinder(2.55, 2.62, 0.07, TURF, { roughness: 0.92 })
  turf.position.y = 0.145
  base.add(turf)
  root.add(base)

  // ---- estrada de terra ----------------------------------------------------
  const estrada = new THREE.Group()
  const len = 2 * Math.sqrt(2.5 * 2.5 - 0.6 * 0.6)
  const road = rbox(len, 0.03, 0.95, 0.012, ROAD, { roughness: 0.95 })
  road.position.set(0, GY + 0.01, HZ)
  estrada.add(road)
  for (const dz of [-0.24, 0.24]) {
    const rut = rbox(len - 0.1, 0.012, 0.16, 0.005, ROAD_DARK, { roughness: 0.95 })
    rut.position.set(0, GY + 0.028, HZ + dz)
    estrada.add(rut)
  }
  const mid = rbox(len - 0.2, 0.02, 0.1, 0.008, '#8f9d45', { roughness: 0.95 })
  mid.position.set(0, GY + 0.03, HZ)
  estrada.add(mid)
  for (let i = 0; i < 14; i++) {
    const pebble = sphere(0.025 + rand() * 0.02, '#a08a66', { roughness: 0.9 })
    pebble.scale.y = 0.5
    pebble.position.set((rand() - 0.5) * (len - 0.4), GY + 0.03, HZ + (rand() - 0.5) * 0.8)
    estrada.add(pebble)
  }
  root.add(estrada)

  // ---- campos amarelos (raps) ----------------------------------------------
  const campos = new THREE.Group()
  for (let row = 0; row < 4; row++) {
    const z = -0.7 - row * 0.42
    const half = Math.sqrt(Math.max(2.45 * 2.45 - z * z, 0.1))
    for (let x = -half + 0.2; x < half - 0.1; x += 0.38) {
      const tuft = puff(0.13, rand() > 0.25 ? RAPS : LEAF, 4, row * 31 + Math.round(x * 10) + 50, { roughness: 0.9 })
      tuft.position.set(x + (rand() - 0.5) * 0.1, GY + 0.1, z + (rand() - 0.5) * 0.08)
      tuft.scale.y = 0.75
      campos.add(tuft)
    }
  }
  for (let row = 0; row < 3; row++) {
    const z = 0.95 + row * 0.42
    const half = Math.sqrt(Math.max(2.45 * 2.45 - z * z, 0.1))
    for (let x = -half + 0.2; x < half - 0.1; x += 0.42) {
      const tuft = puff(0.09, rand() > 0.3 ? RAPS : LEAF, 3, row * 17 + Math.round(x * 10) + 90, { roughness: 0.9 })
      tuft.position.set(x + (rand() - 0.5) * 0.12, GY + 0.05, z)
      tuft.scale.y = 0.55
      campos.add(tuft)
    }
  }
  root.add(campos)

  // ---- casinha vermelha + bétula -------------------------------------------
  const casinha = new THREE.Group()
  casinha.position.set(-1.7, GY, -1.5)
  casinha.rotation.y = 0.35
  const walls = rbox(0.9, 0.6, 0.7, 0.02, FALU, { roughness: 0.8 })
  walls.position.y = 0.3
  casinha.add(walls)
  const gable = cylinder(0.52, 0.52, 0.7, FALU, { roughness: 0.8 }, 3)
  gable.rotation.x = -Math.PI / 2
  gable.scale.z = 0.7
  gable.position.y = 0.6 + 0.18
  casinha.add(gable)
  for (const s of [-1, 1]) {
    const slab = rbox(0.84, 0.05, 0.84, 0.015, '#3b3433', { roughness: 0.8 })
    slab.position.set(s * 0.24, 0.6 + 0.18 + 0.12, 0)
    slab.rotation.z = -s * 0.88
    casinha.add(slab)
    const corner = rbox(0.05, 0.6, 0.05, 0.01, WHITE, { roughness: 0.6 })
    corner.position.set(s * 0.45, 0.3, 0.35)
    casinha.add(corner)
    const win = rbox(0.18, 0.18, 0.02, 0.01, WHITE, { roughness: 0.6 })
    win.position.set(s * 0.25, 0.36, 0.36)
    casinha.add(win)
    const glass = rbox(0.12, 0.12, 0.02, 0.005, '#3e5f7a', { roughness: 0.2 })
    glass.position.set(s * 0.25, 0.36, 0.368)
    casinha.add(glass)
  }
  const door = rbox(0.16, 0.34, 0.02, 0.01, WHITE, { roughness: 0.6 })
  door.position.set(0, 0.17, 0.36)
  casinha.add(door)
  const trunk = cylinder(0.035, 0.05, 1.0, '#ece8de', { roughness: 0.6 })
  trunk.position.set(-0.75, 0.5, -0.2)
  casinha.add(trunk)
  const crown = puff(0.3, '#6f9a45', 6, 12, { roughness: 0.9 })
  crown.position.set(-0.75, 1.1, -0.2)
  casinha.add(crown)
  root.add(casinha)

  // ---- lago ----------------------------------------------------------------
  const lago = new THREE.Group()
  lago.position.set(0.9, GY + 0.005, -2.0)
  const water = cylinder(0.75, 0.75, 0.02, LAKE, { roughness: 0.15 })
  water.scale.z = 0.45
  lago.add(water)
  root.add(lago)

  // ---- cavalinho de Dalarna (olha para +x) ---------------------------------
  const cavalo = new THREE.Group()
  cavalo.position.set(HX, GY, HZ)
  cavalo.rotation.y = -0.12
  const legsF = rbox(0.38, 0.84, 0.46, 0.08, HORSE, { roughness: 0.45 })
  legsF.position.set(0.55, 0.42, 0)
  legsF.rotation.z = 0.06
  cavalo.add(legsF)
  const legsB = rbox(0.4, 0.84, 0.46, 0.08, HORSE, { roughness: 0.45 })
  legsB.position.set(-0.58, 0.42, 0)
  legsB.rotation.z = -0.06
  cavalo.add(legsB)
  const body = rbox(1.65, 0.64, 0.52, 0.2, HORSE, { roughness: 0.45 })
  body.position.set(0, 1.08, 0)
  cavalo.add(body)
  const neck = rbox(0.5, 0.95, 0.44, 0.14, HORSE, { roughness: 0.45 })
  neck.position.set(0.62, 1.55, 0)
  neck.rotation.z = -0.42
  cavalo.add(neck)
  const mane = rbox(0.1, 0.9, 0.46, 0.04, BLACK, { roughness: 0.5 })
  mane.position.set(-0.22, 0.04, 0)
  neck.add(mane)
  const tail = rbox(0.14, 0.5, 0.14, 0.06, BLACK, { roughness: 0.5 })
  tail.position.set(-0.86, 0.98, 0)
  tail.rotation.z = -0.35
  cavalo.add(tail)
  // pinturas de kurbits nos dois lados
  for (const side of [-1, 1]) {
    const zf = side * 0.262
    const f1 = flower(WHITE, 0.09)
    f1.position.set(-0.45, 1.05, zf)
    if (side < 0) f1.rotation.y = Math.PI
    cavalo.add(f1)
    const f2 = flower('#f7d76a', 0.07)
    f2.position.set(0.42, 1.02, zf)
    if (side < 0) f2.rotation.y = Math.PI
    cavalo.add(f2)
    const f3 = flower(WHITE, 0.06)
    f3.position.set(0.0, 0.08, side * 0.225)
    if (side < 0) f3.rotation.y = Math.PI
    neck.add(f3)
    const arc = torus(0.1, 0.012, WHITE, { roughness: 0.5 })
    arc.scale.z = 0.3
    arc.position.set(-0.45, 0.88, zf)
    cavalo.add(arc)
    const band = rbox(0.04, 0.5, 0.01, 0.005, YELLOW, { roughness: 0.5 })
    band.position.set(-0.2, 1.0, zf)
    cavalo.add(band)
    const band2 = band.clone()
    band2.position.x = 0.2
    cavalo.add(band2)
  }
  root.add(cavalo)

  // ---- cabeça (virada pra trás, boca aberta chamando) ----------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0.82, 1.94, 0)
  cabeca.rotation.y = -2.1
  cavalo.add(cabeca)
  const skull = rbox(0.42, 0.38, 0.36, 0.12, HORSE, { roughness: 0.45 })
  skull.position.set(0.08, 0.06, 0)
  cabeca.add(skull)
  const snout = rbox(0.44, 0.2, 0.3, 0.08, HORSE, { roughness: 0.45 })
  snout.position.set(0.38, 0.02, 0)
  snout.rotation.z = -0.2
  cabeca.add(snout)
  const jaw = rbox(0.36, 0.1, 0.26, 0.04, HORSE, { roughness: 0.45 })
  jaw.position.set(0.32, -0.16, 0)
  jaw.rotation.z = -0.55
  cabeca.add(jaw)
  const mouth = sphere(0.09, '#5a1e1e', { roughness: 0.5 })
  mouth.scale.set(1.3, 0.6, 1.2)
  mouth.position.set(0.42, -0.1, 0)
  cabeca.add(mouth)
  const forelock = rbox(0.14, 0.12, 0.3, 0.04, BLACK, { roughness: 0.5 })
  forelock.position.set(0.12, 0.26, 0)
  cabeca.add(forelock)
  for (const s of [-1, 1]) {
    const ear = cone(0.06, 0.18, HORSE, { roughness: 0.45 })
    ear.position.set(-0.04, 0.32, s * 0.1)
    ear.rotation.z = 0.2
    cabeca.add(ear)
    const eye = sphere(0.055, WHITE, { roughness: 0.3 })
    eye.scale.z = 0.4
    eye.position.set(0.1, 0.1, s * 0.182)
    cabeca.add(eye)
    const pupil = sphere(0.03, BLACK, { roughness: 0.2 })
    pupil.scale.z = 0.4
    pupil.position.set(0.12, 0.1, s * 0.2)
    cabeca.add(pupil)
    const strap = rbox(0.04, 0.34, 0.01, 0.005, WHITE, { roughness: 0.5 })
    strap.position.set(-0.04, 0.04, s * 0.185)
    cabeca.add(strap)
  }
  const noseband = rbox(0.05, 0.24, 0.33, 0.02, WHITE, { roughness: 0.5 })
  noseband.position.set(0.32, 0.04, 0)
  noseband.rotation.z = -0.2
  cabeca.add(noseband)

  // ---- sela azul vazia de bordas douradas ----------------------------------
  const sela = new THREE.Group()
  sela.position.set(-0.05, 1.4, 0)
  cavalo.add(sela)
  const seat = rbox(0.62, 0.08, 0.58, 0.04, BLUE, { roughness: 0.6 })
  sela.add(seat)
  const pommel = rbox(0.12, 0.16, 0.3, 0.05, BLUE, { roughness: 0.6 })
  pommel.position.set(0.28, 0.08, 0)
  sela.add(pommel)
  const cantle = rbox(0.12, 0.2, 0.44, 0.05, BLUE, { roughness: 0.6 })
  cantle.position.set(-0.28, 0.1, 0)
  sela.add(cantle)
  for (const s of [-1, 1]) {
    const flap = rbox(0.6, 0.4, 0.04, 0.03, BLUE, { roughness: 0.6 })
    flap.position.set(0, -0.2, s * 0.285)
    sela.add(flap)
    const trimB = rbox(0.62, 0.04, 0.02, 0.01, GOLD, { roughness: 0.3, metalness: 0.6 })
    trimB.position.set(0, -0.39, s * 0.31)
    sela.add(trimB)
    for (const tx of [-0.3, 0.3]) {
      const trimV = rbox(0.04, 0.4, 0.02, 0.01, GOLD, { roughness: 0.3, metalness: 0.6 })
      trimV.position.set(tx, -0.2, s * 0.31)
      sela.add(trimV)
    }
    const strapS = rbox(0.03, 0.3, 0.02, 0.01, '#6b4a2e', { roughness: 0.7 })
    strapS.position.set(0.05, -0.5, s * 0.32)
    sela.add(strapS)
    const stirrup = torus(0.06, 0.014, GOLD, { roughness: 0.3, metalness: 0.7 })
    stirrup.position.set(0.05, -0.7, s * 0.32)
    sela.add(stirrup)
  }

  // ---- placa TILÂNDIA ------------------------------------------------------
  const placa = new THREE.Group()
  placa.position.set(1.5, GY, -0.62)
  placa.rotation.y = -0.22
  for (const px of [-0.78, 0.78]) {
    const post = cylinder(0.05, 0.055, 2.0, WOOD, { roughness: 0.85 })
    post.position.set(px, 1.0, -0.06)
    placa.add(post)
  }
  const board = rbox(1.85, 0.5, 0.06, 0.03, WOOD, { roughness: 0.8 })
  board.position.set(0, 1.7, 0)
  placa.add(board)
  const word: [string, number][] = [
    ['T', -0.74], ['I', -0.57], ['L', -0.43], ['Â', -0.23], ['N', -0.02], ['D', 0.18], ['I', 0.37], ['A', 0.53],
  ]
  const LH = 0.27
  for (const [c, lx] of word) {
    const l = letter(c, CREAM)
    l.scale.setScalar(LH)
    l.position.set(lx, 1.67, 0.035)
    placa.add(l)
  }
  root.add(placa)

  // risco vermelho sobre o IA
  const risco = new THREE.Group()
  risco.position.set(1.5, GY, -0.62)
  risco.rotation.y = -0.22
  const slash = rbox(0.42, 0.06, 0.03, 0.02, HORSE, { roughness: 0.5 })
  slash.position.set(0.45, 1.68, 0.06)
  slash.rotation.z = 0.25
  risco.add(slash)
  root.add(risco)

  // tábua pregada com ET pintado à mão
  const et = new THREE.Group()
  et.position.set(1.5 + 0.44, GY + 2.06, -0.62 + 0.1)
  et.rotation.set(0, -0.22, 0.08)
  const patch = rbox(0.5, 0.34, 0.04, 0.02, CREAM, { roughness: 0.8 })
  et.add(patch)
  for (const [c, lx] of [['E', -0.1], ['T', 0.11]] as const) {
    const l = letter(c, HORSE)
    l.scale.setScalar(0.24)
    l.position.set(lx, 0, 0.03)
    et.add(l)
  }
  for (const nx of [-0.2, 0.2]) {
    const nail = sphere(0.018, '#777', { roughness: 0.3, metalness: 0.7 })
    nail.position.set(nx, -0.12, 0.025)
    et.add(nail)
  }
  root.add(et)

  const parts = [
    { name: 'base', group: 'campo', object: base },
    { name: 'estrada', group: 'campo', object: estrada },
    { name: 'campos', group: 'campo', object: campos },
    { name: 'casinha', group: 'fundo', object: casinha },
    { name: 'lago', group: 'fundo', object: lago },
    { name: 'cavalo', group: 'cavalo', object: cavalo },
    { name: 'cabeca', group: 'quer', object: cabeca },
    { name: 'sela', group: 'quer', object: sela },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'risco', group: 'et', object: risco },
    { name: 'et', group: 'et', object: et },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Sexta-feira de julho: Estocolmo fervendo ficou pra trás — uma estrada de terra entre campos amarelos.',
    }),
    seq('estrada-rise', 'estrada', 0.2, 0.7, [riseFrom(0, 0.5)], { ease: 'easeOut' }),
    seq('campos-cresce', 'campos', 0.5, 0.8, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('casinha-rise', 'casinha', 1.4, 0.8, [riseFrom(GY, 1.4)], { ease: 'easeOut' }),
    seq('lago-abre', 'lago', 1.6, 0.7, s3(0.01, 1), { ease: 'easeOut' }),

    seq('cavalo-rise', 'cavalo', 2.8, 0.9, [riseFrom(GY, 2.6)], {
      ease: 'easeOut',
      caption: '"VI!" — relincha um cavalinho de Dalarna, vermelho e pintado de flores.',
    }),
    seq('cabeca-vira', 'cabeca', 4.6, 0.8, [ch('rotation.y', 0, -2.1)], {
      ease: 'easeInOut',
      caption: 'Ele vira a cabeça pra trás e oferece a sela vazia no lombo: "ÔÔ, QUER?"',
    }),
    seq('sela-pousa', 'sela', 5.1, 0.7, [ch('position.y', 2.3, 1.4), ...s3(0.3, 1)], { ease: 'easeOut' }),

    seq('placa-rise', 'placa', 7.0, 0.8, [riseFrom(GY, 2.3)], {
      ease: 'easeOut',
      caption: 'Ele freia debaixo da placa da cidadezinha: TILÂNDIA…',
    }),
    seq('risco-pinta', 'risco', 8.6, 0.5, [ch('scale.x', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…mas o IA tá riscado e pintaram ET por cima: TIL-LÂND-ET!',
    }),
    seq('et-prega', 'et', 9.1, 0.6, [ch('position.y', GY + 2.6, GY + 2.06), ch('rotation.z', 0.5, 0.08)], { ease: 'easeOut' }),

    seq('cabeca-ergue', 'cabeca', 10.4, 0.35, [ch('rotation.z', 0, 0.2)], { ease: 'easeOut' }),
    seq('cabeca-chama', 'cabeca', 10.75, 0.45, [ch('rotation.z', 0.2, 0)], {
      ease: 'easeInOut',
      caption: 'Vi åker till landet. — Vamos pro campo (pro interior).',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.85, 5.7], target: [0.3, 1.3, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'vi-aker-till-landet',
    contexto:
      "Lazer: na sexta-feira de verão, quando meio Estocolmo sai de carro ou de trem pra sommarstuga, a casinha de campo da família; ou no Midsommar. 'Landet' é o interior, a roça, por oposição à cidade (e também quer dizer 'o país'). 'Åka' é o verbo de ir de transporte; 'gå' é a pé.",
    fraseFonte: 'Vamos pro campo (pro interior).',
    fraseAlvo: 'Vi åker till landet.',
    pronuncia:
      "vi ÔÔ-ker til LÁN-det ('vi' com I limpo; 'åker' com Ô FECHADO e longo, K seco e -er fraquinho; 'till' com T duro, nunca 'tchil'; 'landet' com força no LAN, A curto e ABERTO, sem nasalar, D duro e -et quase engolido — é o artigo: 'land' é campo, 'landet' é O campo)",
    ponteSonora:
      "VI! ÔÔ, QUER?... TILÂND(ia)-ET! (6 sílabas: vi-ÔÔ-ker-til-LÁN-det; força no ÔÔ e, maior, no LÁN; VI = o 'eu VI', I limpo; ÔÔ, QUER? = o convite do cavalinho: Ô FECHADO e LONGO (å longo) e o QUER emendado e fraco, K seco e R de um toque; TIL com T duro e L de língua; LÂND = o meio da placa TILÂNDIA, com A ABERTO de 'lá', sem o 'ã' fanhoso, e D DURO de 'dado'; ET = no lugar do IA riscado, -et fraquinho, quase engolido: é o artigo colado; LÁN-det, nunca 'lan-DÊT')",
    historia:
      "Sexta-feira de julho, Estocolmo fervendo: 'VI!', relincha o cavalinho de Dalarna, vermelho e pintado de flores, que viu você derretendo no ponto de ônibus. Ele encosta, vira a cabeça e oferece a sela vazia no lombo: 'ÔÔ, QUER?'. Você monta, e ele dispara pela estrada de terra no meio dos campos amarelos até frear debaixo de uma placa de madeira: TILÂNDIA, a cidadezinha com casinha vermelha e lago — só que o IA está riscado e, por cima, pintaram um ET torto: TILÂND-ET. Vocês vão pro campo.",
  },
  createScene,
}

export default card
