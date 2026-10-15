import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, rock, person,
} from '../rig/helpers'

/**
 * "Hej då!" — no fim da festa, o faraó (o REI DOUrado) senta no próprio
 * sarcófago dourado, acena com a mão cheia de anéis e vai puxando a tampa
 * por cima de si: RÊÊI... DÔÔÔ!
 *
 * Diorama: areia dourada ao pôr do sol, pirâmides de pedra em camadas ao
 * fundo, sol laranja baixo. Sarcófago em 3/4 com a tampa deslizada em rampa
 * sobre a metade dos pés; o faraó sentado na cabeceira, máscara-cabeça de ouro
 * com nemes listrado, um braço acenando alto e o outro agarrando a tampa.
 *
 * Paleta: areia/pedra quentes + azul-lápis. Acento saturado RESERVADO ao
 * ouro (o DOUrado da ponte): máscara, sarcófago, tampa, joias e cetro.
 */

const SAND = '#dcb36a'
const SAND_DARK = '#b98d4a'
const SOIL = '#8f6a3a'
const STONE = '#d6bd8c'
const STONE_DARK = '#b89c68'
const GOLD = '#f0b429' // acento saturado: tudo que é DOUrado
const GOLD_DEEP = '#c98b1c'
const LAPIS = '#2c4f9c'
const LAPIS_DARK = '#1b2c55'
const SKIN = '#9b6440'
const LINEN = '#f2ede1'
const SUN = '#ff8a33'
const PALM = '#4d8a3f'
const TRUNK = '#8a6236'

const GY = 0.18 // topo da areia
const BOX_L = 2.0
const BOX_H = 0.5
const BOX_W = 0.78
// sarcófago (coordenadas do grupo do sarcófago)
const SARC: [number, number, number] = [0.05, GY, 0.25]
const SARC_ROT = -0.15
// faraó sentado na cabeceira
const PHARAOH: [number, number, number] = [-0.6, 0.1, 0.02]
const PH_SCALE = 1.1
// tampa: ponta de cima na mão do faraó, apoiada no rebordo dos pés,
// ponta de baixo encostando na areia
const LID_NEAR: [number, number] = [0.25, 0.97]
const LID_ROT = -Math.atan2(LID_NEAR[1] - (BOX_H + 0.05), 1.0 - LID_NEAR[0])
const LID_L = 1.95
const LID_SLIDE = 0.75 // quanto a tampa desliza ao ser puxada
const WAVE = -2.78 // braço do aceno (rotation.z, pivô no ombro)
const GRAB = 1.62 // braço que puxa a tampa

const gold = (opts: { roughness?: number } = {}) => ({ roughness: opts.roughness ?? 0.3, metalness: 0.8 })

/** Faixa de latitude de uma esfera (listras do nemes). Sem a frente se `open`. */
function band(r: number, t0: number, t1: number, color: string, open: boolean, metal: boolean) {
  const gap = 1.05
  const geo = open
    ? new THREE.SphereGeometry(r, 48, 4, Math.PI / 2 + gap, Math.PI * 2 - gap * 2, t0, t1 - t0)
    : new THREE.SphereGeometry(r, 48, 4, 0, Math.PI * 2, t0, t1 - t0)
  const m = mat(color, metal ? gold() : { roughness: 0.45 })
  m.side = THREE.DoubleSide
  const mesh = new THREE.Mesh(geo, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Arco de toro (gancho do cetro). */
function arc(r: number, tube: number, angle: number, color: string, opts = gold()) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 16, 32, angle), mat(color, opts))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Hieróglifos de traço grosso em lápis, no plano xy (frente da parede). */
function glyph(kind: number) {
  const g = new THREE.Group()
  const c = LAPIS
  const o = { roughness: 0.5 }
  if (kind === 0) {
    // ankh
    const loop = torus(0.04, 0.014, c, o)
    loop.position.y = 0.06
    loop.scale.y = 1.25
    const stem = rbox(0.026, 0.11, 0.02, 0.008, c, o)
    stem.position.y = -0.03
    const bar = rbox(0.1, 0.024, 0.02, 0.008, c, o)
    bar.position.y = 0.012
    g.add(loop, stem, bar)
  } else if (kind === 1) {
    // olho de Hórus estilizado
    const eye = sphere(0.045, c, o)
    eye.scale.set(1.3, 0.6, 0.25)
    eye.position.y = 0.03
    const brow = rbox(0.12, 0.018, 0.02, 0.008, c, o)
    brow.position.y = 0.075
    const tail = rbox(0.018, 0.08, 0.02, 0.008, c, o)
    tail.position.set(0.0, -0.035, 0)
    tail.rotation.z = 0.35
    g.add(eye, brow, tail)
  } else {
    // disco solar sobre duas barras
    const disk = sphere(0.04, c, o)
    disk.scale.z = 0.3
    disk.position.y = 0.06
    for (const s of [-1, 1]) {
      const b = rbox(0.022, 0.1, 0.02, 0.008, c, o)
      b.position.set(s * 0.03, -0.035, 0)
      g.add(b)
    }
    g.add(disk)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(7)

  // ---- base: areia dourada ---------------------------------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)
  const sand = cylinder(2.55, 2.62, 0.07, SAND, { roughness: 0.95 })
  sand.position.y = 0.145
  base.add(sand)

  // dunas suaves na borda
  for (const [x, z, r, sy] of [
    [-2.0, -0.9, 0.55, 0.28], [1.95, -1.15, 0.5, 0.3], [-1.75, 1.3, 0.42, 0.22], [1.55, 1.55, 0.36, 0.2],
  ] as const) {
    const dune = sphere(r, SAND, { roughness: 0.95 })
    dune.scale.set(1.3, sy, 1)
    dune.position.set(x, GY - 0.02, z)
    dune.rotation.y = rand() * Math.PI
    base.add(dune)
  }
  // marolas de vento na areia
  for (const [x, z, rot] of [[-0.9, 1.45, 0.2], [0.6, 1.75, -0.1], [1.3, 0.95, 0.3], [-1.5, 0.4, -0.25]] as const) {
    const ripple = capsule(0.018, 0.5, SAND_DARK, { roughness: 0.95 })
    ripple.rotation.set(0, rot, Math.PI / 2)
    ripple.position.set(x, GY + 0.005, z)
    base.add(ripple)
  }
  for (const [x, z, r, s] of [[1.85, 0.75, 0.13, 3], [-2.05, 0.35, 0.1, 5], [-0.9, -1.4, 0.12, 9]] as const) {
    const st = rock(r, '#a08458', s, { roughness: 0.9 })
    st.position.set(x, GY + r * 0.35, z)
    base.add(st)
  }

  // jarro de vinho que sobrou da festa
  const jar = new THREE.Group()
  jar.position.set(-1.55, GY, 1.05)
  jar.rotation.y = 0.6
  const jarBody = lathe(
    [[0, 0], [0.07, 0], [0.15, 0.08], [0.17, 0.2], [0.13, 0.32], [0.07, 0.38], [0.065, 0.45], [0.085, 0.47], [0.07, 0.48], [0, 0.48]],
    '#b5603a',
    { roughness: 0.6 },
  )
  jar.add(jarBody)
  const jarBand = torus(0.168, 0.012, LAPIS, { roughness: 0.5 })
  jarBand.rotation.x = Math.PI / 2
  jarBand.position.y = 0.2
  jar.add(jarBand)
  for (const s of [-1, 1]) {
    const handle = torus(0.06, 0.016, '#b5603a', { roughness: 0.6 })
    handle.position.set(s * 0.12, 0.34, 0)
    handle.rotation.y = Math.PI / 2
    jar.add(handle)
  }
  base.add(jar)
  root.add(base)

  // ---- pirâmides de pedra em camadas -----------------------------------------
  const piramide = new THREE.Group()
  function pyramid(x: number, z: number, r: number, h: number, courses: number) {
    const p = new THREE.Group()
    p.position.set(x, GY, z)
    p.rotation.y = Math.PI / 4 - 0.2
    const ch = h / courses
    for (let k = 0; k < courses; k++) {
      const y0 = k * ch
      const y1 = (k + 1) * ch
      const rb = r * (1 - y0 / h) * (k === 0 ? 1 : 0.985)
      const rt = r * (1 - y1 / h)
      const course = cylinder(Math.max(rt, 0.001), rb, ch, k % 2 ? STONE : STONE_DARK, { roughness: 0.85, flat: true }, 4)
      course.position.y = y0 + ch / 2
      p.add(course)
    }
    return p
  }
  piramide.add(pyramid(0.95, -1.75, 1.5, 2.05, 8))
  piramide.add(pyramid(-1.75, -1.55, 0.8, 1.2, 5))
  root.add(piramide)

  // ---- sol poente ------------------------------------------------------------
  const sol = new THREE.Group()
  sol.position.set(-0.35, 1.75, -2.5)
  const disk = sphere(0.36, SUN, { emissive: SUN, emissiveIntensity: 0.9, roughness: 0.6 })
  disk.scale.z = 0.4
  sol.add(disk)
  const halo = torus(0.47, 0.035, '#ffb35c', { emissive: '#ffb35c', emissiveIntensity: 0.7 })
  sol.add(halo)
  root.add(sol)

  // ---- palmeira --------------------------------------------------------------
  const palmeira = new THREE.Group()
  palmeira.position.set(2.0, GY, -0.45)
  palmeira.rotation.y = Math.PI + 0.3
  let ty = 0
  let tx = 0
  for (let i = 0; i < 6; i++) {
    const seg = cylinder(0.075 - i * 0.006, 0.09 - i * 0.006, 0.26, i % 2 ? TRUNK : '#7a5530', { roughness: 0.85 })
    seg.position.set(tx, ty + 0.13, 0)
    seg.rotation.z = -0.06 - i * 0.035
    palmeira.add(seg)
    ty += 0.24
    tx += 0.02 + i * 0.012
  }
  const crownY = ty + 0.05
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    const frond = new THREE.Group()
    frond.position.set(tx, crownY, 0)
    frond.rotation.set(0, a, 0)
    const leaf = capsule(0.07, 0.5, PALM, { roughness: 0.75 })
    leaf.scale.set(1, 1, 0.25)
    leaf.rotation.z = -1.05 - (i % 2) * 0.25
    leaf.position.set(0.28, -0.08, 0)
    frond.add(leaf)
    palmeira.add(frond)
  }
  for (let i = 0; i < 3; i++) {
    const nut = sphere(0.05, '#5b3d22', { roughness: 0.7 })
    nut.position.set(tx + Math.cos(i * 2.1) * 0.07, crownY - 0.07, Math.sin(i * 2.1) * 0.07)
    palmeira.add(nut)
  }
  root.add(palmeira)

  // ---- sarcófago dourado aberto ----------------------------------------------
  const sarc = new THREE.Group()
  sarc.position.set(...SARC)
  sarc.rotation.y = SARC_ROT
  root.add(sarc)

  const sarcofago = new THREE.Group()
  sarc.add(sarcofago)
  const T = 0.08
  const floor = rbox(BOX_L, 0.1, BOX_W, 0.03, GOLD_DEEP, gold())
  floor.position.y = 0.05
  sarcofago.add(floor)
  for (const s of [-1, 1]) {
    const wall = rbox(BOX_L, BOX_H, T, 0.03, GOLD, gold())
    wall.position.set(0, BOX_H / 2, s * (BOX_W / 2 - T / 2))
    sarcofago.add(wall)
    // forro interno azul-lápis escuro
    const lining = rbox(BOX_L - 0.2, BOX_H - 0.12, 0.01, 0.004, LAPIS_DARK, { roughness: 0.7 })
    lining.position.set(0, BOX_H / 2 + 0.03, s * (BOX_W / 2 - T - 0.004))
    sarcofago.add(lining)
  }
  const footWall = rbox(T, BOX_H, BOX_W, 0.03, GOLD, gold())
  footWall.position.set(BOX_L / 2 - T / 2, BOX_H / 2, 0)
  sarcofago.add(footWall)
  const headWall = rbox(0.1, BOX_H, BOX_W, 0.03, GOLD, gold())
  headWall.position.set(-BOX_L / 2 + 0.05, BOX_H / 2, 0)
  sarcofago.add(headWall)
  // cabeceira arredondada (sarcófago antropoide)
  const headArch = cylinder(BOX_W / 2, BOX_W / 2, 0.1, GOLD, gold(), 40)
  headArch.rotation.z = Math.PI / 2
  headArch.position.set(-BOX_L / 2 + 0.05, BOX_H - 0.12, 0)
  sarcofago.add(headArch)
  const archRing = torus(BOX_W / 2 - 0.05, 0.018, LAPIS, { roughness: 0.45 })
  archRing.rotation.y = Math.PI / 2
  archRing.position.set(-BOX_L / 2 - 0.002, BOX_H - 0.12, 0)
  sarcofago.add(archRing)
  const inner = rbox(BOX_L - 0.18, 0.02, BOX_W - 0.18, 0.008, LAPIS_DARK, { roughness: 0.7 })
  inner.position.y = 0.11
  sarcofago.add(inner)
  // faixas e hieróglifos na parede da frente
  const FZ = BOX_W / 2 + 0.004
  for (const by of [0.1, 0.42]) {
    const stripe = rbox(BOX_L - 0.12, 0.045, 0.014, 0.006, LAPIS, { roughness: 0.45 })
    stripe.position.set(0, by, FZ)
    sarcofago.add(stripe)
  }
  for (let i = 0; i < 8; i++) {
    const gl = glyph(i % 3)
    gl.position.set(-0.77 + i * 0.22, 0.25, FZ)
    sarcofago.add(gl)
  }
  // pezinhos de leão
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const foot = sphere(0.07, GOLD_DEEP, gold())
      foot.scale.y = 0.6
      foot.position.set(sx * (BOX_L / 2 - 0.12), 0.0, sz * (BOX_W / 2 - 0.1))
      sarcofago.add(foot)
    }
  }

  // ---- faraó -----------------------------------------------------------------
  const farao = new THREE.Group()
  sarc.add(farao)

  const corpo = person({ body: SKIN, skin: SKIN, height: 1.5, armAngle: 0.4 })
  corpo.position.set(...PHARAOH)
  corpo.rotation.y = 0.25
  corpo.scale.setScalar(PH_SCALE)
  farao.add(corpo)

  // saiote de linho + cinto de ouro (aparecem no rebordo)
  const kilt = cylinder(0.285, 0.31, 0.24, LINEN, { roughness: 0.9 })
  kilt.position.y = 0.3
  corpo.add(kilt)
  const belt = torus(0.282, 0.028, GOLD, gold())
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.42
  corpo.add(belt)

  // colar largo (usekh): anéis em rampa ouro/lápis
  const slope = (r: number) => 0.765 - (r - 0.12) * 0.75
  const collarRings: [number, number, string][] = [
    [0.1, 0.16, GOLD], [0.16, 0.21, LAPIS], [0.21, 0.25, GOLD], [0.25, 0.29, LAPIS], [0.29, 0.325, GOLD],
  ]
  for (const [r0, r1, color] of collarRings) {
    const ring = lathe(
      [[r0, slope(r0)], [r1, slope(r1)], [r1, slope(r1) + 0.04], [r0, slope(r0) + 0.04], [r0, slope(r0)]],
      color,
      color === GOLD ? gold() : { roughness: 0.4 },
      48,
    )
    corpo.add(ring)
  }
  // contas penduradas na borda do colar
  for (let i = 0; i < 13; i++) {
    const a = Math.PI / 2 + (i - 6) * 0.2
    const bead = sphere(0.022, i % 2 ? LAPIS : GOLD, i % 2 ? { roughness: 0.4 } : gold())
    bead.scale.y = 1.4
    bead.position.set(Math.cos(a) * 0.32, slope(0.32) - 0.02, Math.sin(a) * 0.32)
    corpo.add(bead)
  }

  // cabeça: a máscara de ouro é a própria cabeça
  const head = corpo.getObjectByName('head') as THREE.Group
  const skull = head.children[0] as THREE.Mesh
  skull.material = mat(GOLD, gold({ roughness: 0.26 }))
  // kohl e sobrancelhas de lápis
  for (const s of [-1, 1]) {
    const lid = rbox(0.13, 0.016, 0.02, 0.007, '#141414', { roughness: 0.4 })
    lid.position.set(s * 0.11, 0.07, 0.25)
    lid.rotation.y = s * 0.35
    head.add(lid)
    const wing = rbox(0.08, 0.016, 0.02, 0.007, '#141414', { roughness: 0.4 })
    wing.position.set(s * 0.19, 0.055, 0.21)
    wing.rotation.set(0, s * 0.75, s * -0.2)
    head.add(wing)
    const brow = rbox(0.13, 0.024, 0.024, 0.009, LAPIS, { roughness: 0.4 })
    brow.position.set(s * 0.11, 0.125, 0.245)
    brow.rotation.set(-0.15, s * 0.35, s * -0.1)
    head.add(brow)
  }
  // boca aberta gritando DÔÔÔ
  const mouthCavity = sphere(0.05, '#3a1d12', { roughness: 0.7 })
  mouthCavity.scale.set(0.9, 1.15, 0.6)
  mouthCavity.position.set(0, -0.12, 0.235)
  head.add(mouthCavity)
  const lips = torus(0.05, 0.017, GOLD_DEEP, gold())
  lips.scale.y = 1.2
  lips.position.set(0, -0.12, 0.25)
  lips.rotation.x = -0.15
  head.add(lips)

  // nemes: listras ouro/lápis + abas laterais + lapelas no peito
  const mascara = new THREE.Group()
  head.add(mascara)
  const NR = 0.31
  const bands = 9
  for (let i = 0; i < bands; i++) {
    const t0 = (i / bands) * Math.PI * 0.6
    const t1 = ((i + 1) / bands) * Math.PI * 0.6
    const open = t0 >= Math.PI * 0.26
    const b = band(NR, t0, t1 + 0.002, i % 2 ? LAPIS : GOLD, open, i % 2 === 0)
    b.position.set(0, 0.02, -0.01)
    mascara.add(b)
  }
  // testeira dourada
  const brow = arc(NR + 0.008, 0.022, Math.PI * 0.9, GOLD)
  brow.rotation.set(Math.PI / 2, 0, Math.PI * 0.05)
  brow.position.set(0, 0.02 + NR * Math.cos(Math.PI * 0.26), -0.01)
  brow.scale.setScalar(Math.sin(Math.PI * 0.26))
  mascara.add(brow)
  for (const s of [-1, 1]) {
    const flap = new THREE.Group()
    flap.position.set(s * 0.3, -0.08, -0.07)
    flap.rotation.set(0, -s * 0.8, s * 0.22)
    const slab = rbox(0.06, 0.42, 0.34, 0.025, GOLD, gold())
    slab.position.y = -0.13
    flap.add(slab)
    for (let k = 0; k < 4; k++) {
      const st = rbox(0.012, 0.045, 0.34, 0.005, LAPIS, { roughness: 0.4 })
      st.position.set(s * 0.031, -0.29 + k * 0.1, 0)
      flap.add(st)
    }
    mascara.add(flap)

    const lappet = new THREE.Group()
    lappet.position.set(s * 0.22, -0.38, 0.17)
    lappet.rotation.set(0.25, 0, s * 0.08)
    const lp = rbox(0.12, 0.3, 0.05, 0.02, GOLD, gold())
    lappet.add(lp)
    for (let k = 0; k < 3; k++) {
      const st = rbox(0.12, 0.035, 0.012, 0.005, LAPIS, { roughness: 0.4 })
      st.position.set(0, -0.09 + k * 0.09, 0.027)
      lappet.add(st)
    }
    mascara.add(lappet)
  }
  // uraeus: a naja na testa
  const cobra = new THREE.Group()
  cobra.position.set(0, 0.2, 0.27)
  cobra.rotation.x = 0.25
  const hood = sphere(0.045, GOLD, gold())
  hood.scale.set(0.9, 1.3, 0.45)
  hood.position.y = 0.04
  const neck = capsule(0.02, 0.05, LAPIS, { roughness: 0.4 })
  cobra.add(hood, neck)
  mascara.add(cobra)

  // barba postiça trançada
  const barba = new THREE.Group()
  barba.position.set(0, -0.25, 0.2)
  barba.rotation.x = -0.18
  head.add(barba)
  const beard = cylinder(0.04, 0.032, 0.2, GOLD, gold())
  beard.position.y = -0.1
  barba.add(beard)
  for (let k = 0; k < 3; k++) {
    const ring = torus(0.039, 0.009, LAPIS, { roughness: 0.4 })
    ring.rotation.x = Math.PI / 2
    ring.position.y = -0.04 - k * 0.06
    barba.add(ring)
  }
  const beardTip = sphere(0.034, GOLD, gold())
  beardTip.scale.y = 0.5
  beardTip.position.y = -0.2
  barba.add(beardTip)

  // braços com pivô no ombro
  const bracoAceno = corpo.getObjectByName('armL') as THREE.Mesh
  const bracoTampa = corpo.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoAceno, 1.5)
  shoulderPivot(bracoTampa, 1.5)
  bracoAceno.rotation.set(0.3, 0, WAVE)
  bracoTampa.rotation.set(0, 0, GRAB)
  for (const arm of [bracoAceno, bracoTampa]) {
    const hand = arm.children[0]
    const handY = hand.position.y
    for (const by of [handY + 0.12, handY + 0.33]) {
      const bracelet = torus(0.085, 0.026, GOLD, gold())
      bracelet.rotation.x = Math.PI / 2
      bracelet.position.y = by
      arm.add(bracelet)
    }
  }
  // anéis na mão que acena: pedras de lápis e ouro
  {
    const handY = bracoAceno.children[0].position.y
    for (let k = 0; k < 4; k++) {
      const ringStone = sphere(0.022, k % 2 ? LAPIS : GOLD, k % 2 ? { roughness: 0.3 } : gold())
      ringStone.position.set(-0.045 + k * 0.03, handY - 0.06, 0.06)
      bracoAceno.add(ringStone)
    }
  }

  // pernas estendidas dentro do sarcófago (aparecem antes da tampa)
  for (const s of [-1, 1]) {
    const thigh = capsule(0.1, 0.42, LINEN, { roughness: 0.9 })
    thigh.rotation.z = Math.PI / 2
    thigh.position.set(-0.28, 0.22, 0.02 + s * 0.11)
    farao.add(thigh)
    const shin = capsule(0.08, 0.38, SKIN)
    shin.rotation.z = Math.PI / 2
    shin.position.set(0.2, 0.2, 0.02 + s * 0.11)
    farao.add(shin)
    const sandal = rbox(0.08, 0.17, 0.12, 0.03, GOLD_DEEP, gold())
    sandal.position.set(0.47, 0.24, 0.02 + s * 0.11)
    farao.add(sandal)
  }

  // ---- tampa dourada em rampa ------------------------------------------------
  const tampa = new THREE.Group()
  tampa.position.set(LID_NEAR[0], LID_NEAR[1], 0)
  tampa.rotation.z = LID_ROT
  sarc.add(tampa)
  const slab = rbox(LID_L, 0.14, BOX_W + 0.06, 0.05, GOLD, gold())
  slab.position.x = LID_L / 2
  tampa.add(slab)
  // moldura em relevo e faixas de lápis no tampo
  const ridge = rbox(LID_L - 0.3, 0.04, 0.34, 0.02, GOLD_DEEP, gold())
  ridge.position.set(LID_L / 2 + 0.05, 0.085, 0)
  tampa.add(ridge)
  for (const bx of [0.32, 0.72, 1.12, 1.52]) {
    const st = rbox(0.05, 0.02, BOX_W + 0.02, 0.008, LAPIS, { roughness: 0.4 })
    st.position.set(bx, 0.078, 0)
    tampa.add(st)
  }
  // asas abertas (ísis) pintadas perto da ponta de cima
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const feather = rbox(0.05, 0.02, 0.17 - k * 0.04, 0.008, LAPIS, { roughness: 0.4 })
      feather.position.set(0.17 + k * 0.045, 0.08, s * (0.27 - k * 0.02))
      feather.rotation.y = s * 0.5
      tampa.add(feather)
    }
  }

  // ---- cetro em gancho apoiado na borda ------------------------------------
  const cetro = new THREE.Group()
  cetro.position.set(-0.82, 0, BOX_W / 2 + 0.2)
  cetro.rotation.set(-0.38, 0, 0.16)
  sarc.add(cetro)
  const shaft = cylinder(0.025, 0.025, 0.95, GOLD, gold())
  shaft.position.y = 0.475
  cetro.add(shaft)
  for (let k = 0; k < 6; k++) {
    const ring = cylinder(0.029, 0.029, 0.05, LAPIS, { roughness: 0.4 })
    ring.position.y = 0.15 + k * 0.14
    cetro.add(ring)
  }
  const hook = arc(0.1, 0.026, Math.PI * 1.15, GOLD)
  hook.position.set(-0.1, 0.95, 0)
  cetro.add(hook)

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'areia', group: 'deserto', object: base },
    { name: 'piramide', group: 'deserto', object: piramide },
    { name: 'palmeira', group: 'deserto', object: palmeira },
    { name: 'sol', group: 'sol', object: sol },
    { name: 'sarcofago', group: 'sarcofago', object: sarcofago },
    { name: 'farao', group: 'farao', object: farao },
    { name: 'mascara', group: 'mascara', object: mascara },
    { name: 'barba', group: 'mascara', object: barba },
    { name: 'bracoAceno', group: 'aceno', object: bracoAceno },
    { name: 'cetro', group: 'aceno', object: cetro },
    { name: 'tampa', group: 'tampa', object: tampa },
    { name: 'bracoTampa', group: 'tampa', object: bracoTampa },
  ]

  // ---- montagem --------------------------------------------------------------
  const slideX = LID_NEAR[0] + Math.cos(LID_ROT) * LID_SLIDE
  const slideY = LID_NEAR[1] + Math.sin(LID_ROT) * LID_SLIDE
  const build = [
    seq('areia-rise', 'areia', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Fim da festa no palácio: o deserto brota, areia DOURADA e pirâmides…',
    }),
    seq('piramide-rise', 'piramide', 0.25, 1.0, [riseFrom(0, 2.6)], { ease: 'easeOut' }),
    seq('palmeira-rise', 'palmeira', 0.5, 0.8, [riseFrom(0, 1.6)], { ease: 'easeOut' }),
    seq('sol-desce', 'sol', 1.1, 1.0, [ch('position.y', 2.9, 1.75)], {
      ease: 'easeOut',
      caption: '…e o sol laranja já vai se pondo.',
    }),

    seq('sarcofago-rise', 'sarcofago', 2.2, 0.9, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Surge um sarcófago DOURADO, aberto, esperando o dono.',
    }),

    seq('farao-rise', 'farao', 3.5, 0.9, [riseFrom(0, 1.3)], {
      ease: 'easeOut',
      caption: 'Lá dentro senta ele: o faraó, o REI DOUrado…',
    }),
    seq('bracoAceno-rest', 'bracoAceno', 3.5, 0.01, [ch('rotation.z', 0.15, 0.15)]),
    seq('bracoTampa-rest', 'bracoTampa', 3.5, 0.01, [ch('rotation.z', 0.15, 0.15)]),
    seq('mascara-desce', 'mascara', 4.5, 0.8, [
      ch('position.y', 0.9, 0), ch('scale.x', 0.6, 1), ch('scale.y', 0.6, 1), ch('scale.z', 0.6, 1),
    ], {
      ease: 'easeOut',
      caption: '…de máscara de ouro listrada e barba postiça.',
    }),
    seq('barba-cresce', 'barba', 5.0, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('aceno-sobe', 'bracoAceno', 5.8, 0.6, [ch('rotation.z', 0.15, WAVE)], {
      ease: 'easeOut',
      caption: 'Ele acena com a mão cheia de anéis: RÊÊÊI…',
    }),
    seq('cetro-rise', 'cetro', 5.9, 0.6, [riseFrom(0, 1.1)], { ease: 'easeOut' }),
    seq('aceno-1', 'bracoAceno', 6.4, 0.3, [ch('rotation.z', WAVE, WAVE + 0.35)]),
    seq('aceno-2', 'bracoAceno', 6.7, 0.3, [ch('rotation.z', WAVE + 0.35, WAVE - 0.15)]),
    seq('aceno-3', 'bracoAceno', 7.0, 0.3, [ch('rotation.z', WAVE - 0.15, WAVE + 0.35)]),
    seq('aceno-4', 'bracoAceno', 7.3, 0.3, [ch('rotation.z', WAVE + 0.35, WAVE)]),

    seq('tampa-surge', 'tampa', 7.7, 0.6, [
      ch('position.x', slideX, slideX), ch('position.y', slideY, slideY),
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: '…e vai puxando a tampa por cima de si: DÔÔÔ!',
    }),
    seq('braco-agarra', 'bracoTampa', 7.9, 0.6, [ch('rotation.z', 0.15, GRAB + 0.12)], { ease: 'easeOut' }),
    seq('tampa-puxa', 'tampa', 8.5, 1.3, [
      ch('position.x', slideX, LID_NEAR[0]), ch('position.y', slideY, LID_NEAR[1]),
    ], { ease: 'easeInOut' }),
    seq('braco-puxa', 'bracoTampa', 8.5, 1.3, [ch('rotation.z', GRAB + 0.12, GRAB)], { ease: 'easeInOut' }),
    seq('aceno-5', 'bracoAceno', 9.0, 0.35, [ch('rotation.z', WAVE, WAVE + 0.3)]),
    seq('aceno-6', 'bracoAceno', 9.35, 0.35, [ch('rotation.z', WAVE + 0.3, WAVE)]),

    seq('sol-assenta', 'sol', 10.0, 0.8, [ch('scale.x', 1.12, 1), ch('scale.y', 1.12, 1)], {
      ease: 'easeOut',
      caption: 'Hej då! — Tchau!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 2.3, 4.55], target: [0.15, 0.92, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'hej-da',
    contexto: 'Despedida universal: saindo da loja, do escritório, da creche, desligando o telefone.',
    fraseFonte: 'Tchau!',
    fraseAlvo: 'Hej då!',
    pronuncia:
      "rrêi DÔ! ('h' soprado tipo RR carioca; 'då' = DÔ com Ô FECHADO e longo, tônica nele; muitas vezes sai colado: 'hejdå')",
    ponteSonora:
      "RÊI... DÔ! (2 sílabas, tônica no DÔ; RÊI é o MESMO REI do 'Hej!' de 'Hej! Hur är läget?', com o R carioca soprado que é o h sueco; DÔ = o começo de DOUrado, com Ô FECHADO e LONGO — estique ele e corte o '-rado'; nunca 'do' falado 'du', que vira 'hej du' (oi, você), nem 'dó' aberto)",
    historia:
      'No fim da festa no palácio, o faraó — o REI DOUrado, máscara de ouro e tudo — se despede do jeito dele: deita no próprio sarcófago dourado, acena com a mão cheia de anéis e vai puxando a tampa por cima de si mesmo, devagarinho, gritando RÊÊI... DÔÔÔ! A tampa bate, a pirâmide se fecha atrás, e ninguém vê o faraó de novo até a próxima cheia do Nilo. Isso é que é tchau.',
  },
  createScene,
}

export default card
