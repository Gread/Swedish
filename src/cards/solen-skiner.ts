import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, cylinder, sphere, cone, torus, lathe, puff, capsule, person,
} from '../rig/helpers'

/**
 * "Solen skiner." — SUL-EN... RRÍÍ, NÉ-R?!
 *
 * Rua nevada de dezembro: Santa Lucia de camisola branca e coroa de velas
 * ergue o dedinho (EN) para a placa SUL; de lá sobe, atrás das casinhas
 * vermelhas, um sol gigante gargalhando (RRÍÍ!). Ela cruza o braço,
 * emburrada: 'RI, NÉ?!'. O sol (dourado) é o único acento saturado.
 */

const SNOW = '#dfe7f1'
const SNOW_SHADE = '#bccadb'
const RIM = '#5d6b7d'
const FALU = '#9c3b30'
const TRIM = '#f3f0ea'
const WINDOW = '#f6e3b0'
const DOOR = '#34465c'
const WOOD = '#7a5636'
const SIGN = '#2f4f80'
const GOWN = '#f5f2ec'
const SASH = '#b8322c'
const SKIN = '#f0cfb0'
const HAIR = '#e6d39c'
const LEAF = '#3f7a46'
const SUN = '#ffc22e' // acento saturado RESERVADO ao sol
const SUN_RAY = '#f8a51b'
const MOUTH = '#7c2a1f'

const GY = 0.18
const LX = -0.45
const LZ = 0.5
const LS = 1.15
const SUN_X = 0.95
const SUN_Y = 1.95
const SUN_Z = -2.05
const SUN_R = 0.92
const DOWN = new THREE.Vector3(0, -1, 0)

function shaded<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function extruded(shape: THREE.Shape, depth: number, color: string, opts: { roughness?: number; emissive?: string; emissiveIntensity?: number } = {}, bevel = 0.012) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24,
  })
  return shaded(new THREE.Mesh(geo, mat(color, { ...opts, size: 0.5 })))
}

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number) {
  const s = rbox(w, h, 0.03, 0.008, TRIM, { roughness: 0.5 })
  s.position.set(x, y, 0)
  return s
}

function letter(which: 'S' | 'U' | 'L') {
  const g = new THREE.Group()
  const t = 0.036
  const w = 0.11
  const h = 0.17
  if (which === 'S') {
    g.add(stroke(w, t, 0, h / 2 - t / 2))
    g.add(stroke(w, t, 0, 0))
    g.add(stroke(w, t, 0, -h / 2 + t / 2))
    g.add(stroke(t, h / 2, -w / 2 + t / 2, h / 4))
    g.add(stroke(t, h / 2, w / 2 - t / 2, -h / 4))
  } else if (which === 'U') {
    g.add(stroke(t, h, -w / 2 + t / 2, 0))
    g.add(stroke(t, h, w / 2 - t / 2, 0))
    g.add(stroke(w, t, 0, -h / 2 + t / 2))
  } else {
    g.add(stroke(t, h, -w / 2 + t / 2, 0))
    g.add(stroke(w, t, 0, -h / 2 + t / 2))
  }
  return g
}

function makeHouse(w: number, wallH: number, d: number, roofH: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const wall = rbox(w, wallH, d, 0.03, FALU, { roughness: 0.8 })
  wall.position.y = wallH / 2
  g.add(wall)
  // empena vermelha
  const tri = new THREE.Shape()
  tri.moveTo(-w / 2, 0)
  tri.lineTo(w / 2, 0)
  tri.lineTo(0, roofH)
  tri.closePath()
  const gable = extruded(tri, d - 0.04, FALU, { roughness: 0.8 }, 0.01)
  gable.position.set(0, wallH, -(d - 0.04) / 2)
  g.add(gable)
  // telhado coberto de neve: duas lajes nas águas
  const half = w / 2 + 0.08
  const a = Math.atan2(roofH, w / 2)
  const L = Math.hypot(half, roofH * (half / (w / 2))) + 0.04
  for (const side of [-1, 1]) {
    const slab = rbox(L, 0.09, d + 0.16, 0.035, SNOW, { roughness: 0.9 })
    slab.position.set(side * (w / 4) - side * Math.sin(a) * 0.045, wallH + roofH / 2 + Math.cos(a) * 0.045, 0)
    slab.rotation.z = -side * a
    g.add(slab)
    // friso branco na empena
    const fr = rbox(Math.hypot(w / 2, roofH), 0.035, 0.03, 0.01, TRIM, { roughness: 0.5 })
    fr.position.set(side * (w / 4), wallH + roofH / 2, d / 2 - 0.01)
    fr.rotation.z = -side * a
    g.add(fr)
    // cantoneiras
    const corner = rbox(0.05, wallH, 0.05, 0.015, TRIM, { roughness: 0.5 })
    corner.position.set(side * (w / 2 - 0.01), wallH / 2, d / 2 - 0.01)
    g.add(corner)
  }
  // janelas acesas + porta
  const winX = w > 0.9 ? [-w * 0.27, w * 0.27] : [w * 0.2]
  for (const x of winX) {
    const frame = rbox(0.2, 0.22, 0.03, 0.01, TRIM, { roughness: 0.5 })
    frame.position.set(x, wallH * 0.58, d / 2 + 0.01)
    g.add(frame)
    const pane = rbox(0.15, 0.17, 0.02, 0.008, WINDOW, { emissive: WINDOW, emissiveIntensity: 0.35 })
    pane.position.set(x, wallH * 0.58, d / 2 + 0.022)
    g.add(pane)
    const mv = rbox(0.022, 0.17, 0.02, 0.005, TRIM)
    mv.position.set(x, wallH * 0.58, d / 2 + 0.03)
    const mh = rbox(0.15, 0.022, 0.02, 0.005, TRIM)
    mh.position.set(x, wallH * 0.58, d / 2 + 0.03)
    const sill = rbox(0.24, 0.04, 0.07, 0.015, SNOW, { roughness: 0.9 })
    sill.position.set(x, wallH * 0.58 - 0.13, d / 2 + 0.03)
    g.add(mv, mh, sill)
  }
  if (w <= 0.9) {
    const door = rbox(0.2, 0.36, 0.03, 0.02, DOOR, { roughness: 0.6 })
    door.position.set(-w * 0.18, 0.18, d / 2 + 0.01)
    g.add(door)
  }
  const chimney = rbox(0.12, 0.26, 0.12, 0.02, '#6b6e74', { roughness: 0.8 })
  chimney.position.set(w * 0.22, wallH + roofH * 0.75, -d * 0.15)
  const cap = rbox(0.16, 0.06, 0.16, 0.03, SNOW, { roughness: 0.9 })
  cap.position.set(w * 0.22, wallH + roofH * 0.75 + 0.15, -d * 0.15)
  g.add(chimney, cap)
  g.rotation.y = (rand() - 0.5) * 0.12
  return g
}

function makeFir(h: number) {
  const g = new THREE.Group()
  const trunk = cylinder(0.05, 0.06, 0.2, WOOD, { roughness: 0.9 })
  trunk.position.y = 0.1
  g.add(trunk)
  for (let i = 0; i < 3; i++) {
    const r = (0.42 - i * 0.11) * h
    const y = 0.2 + i * 0.28 * h
    const c = cone(r, 0.5 * h, '#2e5a45', { roughness: 0.85 })
    c.position.y = y + 0.25 * h
    g.add(c)
    const s = cone(r * 0.75, 0.3 * h, SNOW, { roughness: 0.9 })
    s.position.y = y + 0.38 * h
    g.add(s)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: rua nevada --------------------------------------------------
  const base = new THREE.Group()
  const rim = cylinder(2.62, 2.72, 0.12, RIM, { roughness: 0.9 })
  rim.position.y = 0.06
  base.add(rim)
  const snow = cylinder(2.58, 2.62, 0.06, SNOW, { roughness: 0.95 })
  snow.position.y = 0.15
  base.add(snow)
  for (let z = -0.3; z <= 1.1; z += 0.2) {
    const len = 2 * Math.sqrt(Math.max(2.45 * 2.45 - z * z, 0.01))
    const strip = rbox(len, 0.012, 0.21, 0.005, SNOW_SHADE, { roughness: 0.9 })
    strip.position.set(0, GY + 0.004, z)
    base.add(strip)
  }
  for (const [x, z, r, s] of [[-2.0, 0.9, 0.22, 3], [1.9, 1.15, 0.2, 5], [2.05, -0.35, 0.25, 7], [-0.9, 1.75, 0.16, 9]] as const) {
    const mound = puff(r, SNOW, 5, s, { roughness: 0.95 })
    mound.position.set(x, GY + 0.02, z)
    mound.scale.y = 0.45
    base.add(mound)
  }
  const fir = makeFir(1.1)
  fir.position.set(-2.0, GY, -0.4)
  base.add(fir)
  const fir2 = makeFir(0.8)
  fir2.position.set(2.1, GY, 0.45)
  base.add(fir2)
  root.add(base)

  // ---- casinhas vermelhas ------------------------------------------------
  const casas = new THREE.Group()
  const h1 = makeHouse(0.95, 0.62, 0.7, 0.42, 3)
  h1.position.set(-1.35, GY, -1.25)
  const h2 = makeHouse(0.8, 0.55, 0.65, 0.38, 5)
  h2.position.set(-0.2, GY, -1.45)
  const h3 = makeHouse(1.0, 0.66, 0.72, 0.44, 7)
  h3.position.set(1.05, GY, -1.25)
  casas.add(h1, h2, h3)
  root.add(casas)

  // ---- sol gigante gargalhando ------------------------------------------
  const sol = new THREE.Group()
  sol.position.set(SUN_X, SUN_Y, SUN_Z)
  sol.rotation.y = -0.12
  const disc = lathe(
    [[0, -0.16], [0.6, -0.15], [0.86, -0.1], [SUN_R, 0], [0.86, 0.1], [0.6, 0.15], [0, 0.16]],
    SUN,
    { roughness: 0.45, emissive: '#ff9d00', emissiveIntensity: 0.28 },
    48,
  )
  disc.rotation.x = Math.PI / 2
  sol.add(disc)
  // olhos apertados de riso (arcos ∩)
  for (const side of [-1, 1]) {
    const eye = shaded(new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.03, 12, 24, Math.PI),
      mat('#5a2a12', { roughness: 0.4 }),
    ))
    eye.position.set(side * 0.3, 0.24, 0.16)
    sol.add(eye)
    const cheek = sphere(0.11, '#f27a4a', { roughness: 0.6 })
    cheek.position.set(side * 0.55, -0.02, 0.1)
    cheek.scale.z = 0.4
    sol.add(cheek)
  }
  // boca escancarada: meio-disco, dentes e língua
  const mShape = new THREE.Shape()
  mShape.moveTo(-0.38, 0)
  mShape.lineTo(0.38, 0)
  mShape.absarc(0, 0, 0.38, 0, -Math.PI, true)
  mShape.closePath()
  const boca = extruded(mShape, 0.03, MOUTH, { roughness: 0.6 }, 0.012)
  boca.position.set(0, 0.0, 0.14)
  sol.add(boca)
  const dentes = rbox(0.56, 0.07, 0.03, 0.015, '#fffaf0', { roughness: 0.3 })
  dentes.position.set(0, -0.04, 0.19)
  sol.add(dentes)
  const lingua = sphere(0.16, '#e7707a', { roughness: 0.5 })
  lingua.position.set(0, -0.27, 0.17)
  lingua.scale.set(1.2, 0.5, 0.25)
  sol.add(lingua)
  root.add(sol)

  const raios = new THREE.Group()
  const N = 14
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    const long = i % 2 === 0
    const r = cone(long ? 0.17 : 0.13, long ? 0.44 : 0.3, SUN_RAY, { roughness: 0.45, emissive: '#ff8a00', emissiveIntensity: 0.2 }, 4)
    const dist = SUN_R + (long ? 0.24 : 0.17)
    r.position.set(Math.cos(a) * dist, Math.sin(a) * dist, 0)
    r.rotation.z = a - Math.PI / 2
    r.scale.z = 0.35
    raios.add(r)
  }
  sol.add(raios)

  // ---- placa SUL ---------------------------------------------------------
  const placa = new THREE.Group()
  placa.position.set(0.72, GY, 0.55)
  const post = cylinder(0.045, 0.055, 1.42, WOOD, { roughness: 0.85 })
  post.position.y = 0.71
  placa.add(post)
  const postCap = sphere(0.06, SNOW, { roughness: 0.9 })
  postCap.position.y = 1.43
  postCap.scale.y = 0.6
  placa.add(postCap)
  const seta = new THREE.Group()
  seta.position.set(0.0, 1.22, 0.06)
  seta.rotation.z = 0.22
  const aShape = new THREE.Shape()
  aShape.moveTo(-0.32, -0.14)
  aShape.lineTo(0.3, -0.14)
  aShape.lineTo(0.3, -0.22)
  aShape.lineTo(0.52, 0)
  aShape.lineTo(0.3, 0.22)
  aShape.lineTo(0.3, 0.14)
  aShape.lineTo(-0.32, 0.14)
  aShape.closePath()
  const board = extruded(aShape, 0.04, SIGN, { roughness: 0.5 }, 0.015)
  seta.add(board)
  const lx: ['S' | 'U' | 'L', number][] = [['S', -0.18], ['U', -0.02], ['L', 0.14]]
  for (const [gl, x] of lx) {
    const l = letter(gl)
    l.position.set(x, 0, 0.07)
    seta.add(l)
  }
  placa.add(seta)
  root.add(placa)

  // ---- Santa Lucia -------------------------------------------------------
  const lucia = person({ body: GOWN, skin: SKIN, height: 1.5, armAngle: 0.3 })
  lucia.position.set(LX, GY, LZ)
  lucia.rotation.y = 0.22
  lucia.scale.setScalar(LS)
  const saia = lathe(
    [[0, 0], [0.36, 0], [0.37, 0.04], [0.31, 0.3], [0.27, 0.52], [0.25, 0.58], [0, 0.58]],
    GOWN,
    { roughness: 0.85 },
  )
  lucia.add(saia)
  for (const [i, a] of [-0.5, 0.2, 0.9, 2.6, 3.4].entries()) {
    const fold = capsule(0.025, 0.36, GOWN, { roughness: 0.85 })
    fold.position.set(Math.sin(a) * 0.3, 0.2, Math.cos(a) * 0.3)
    fold.rotation.set(Math.cos(a) * 0.18, 0, -Math.sin(a) * 0.18)
    fold.name = 'fold' + i
    lucia.add(fold)
  }

  const head = lucia.getObjectByName('head') as THREE.Group
  const cap = shaded(new THREE.Mesh(
    new THREE.SphereGeometry(0.305, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    mat(HAIR, { roughness: 0.75, size: 0.6 }),
  ))
  cap.rotation.x = -0.45
  cap.position.set(0, 0.0, -0.01)
  head.add(cap)
  const costas = rbox(0.5, 0.62, 0.16, 0.07, HAIR, { roughness: 0.75 })
  costas.position.set(0, -0.3, -0.2)
  costas.rotation.x = 0.12
  head.add(costas)
  for (const side of [-1, 1]) {
    const mecha = capsule(0.06, 0.34, HAIR, { roughness: 0.75 })
    mecha.position.set(side * 0.25, -0.2, -0.02)
    mecha.rotation.z = side * 0.08
    head.add(mecha)
    const brow = rbox(0.1, 0.025, 0.02, 0.008, '#a8874a', { roughness: 0.6 })
    brow.position.set(side * 0.11, 0.12, 0.255)
    brow.rotation.z = side * 0.4
    head.add(brow)
    const cheek = sphere(0.08, '#f0a8a0', { roughness: 0.6 })
    cheek.position.set(side * 0.15, -0.07, 0.2)
    cheek.scale.z = 0.7
    head.add(cheek)
  }
  const bico = rbox(0.07, 0.03, 0.03, 0.012, '#c8605a', { roughness: 0.5 })
  bico.position.set(0, -0.13, 0.262)
  head.add(bico)

  // faixa vermelha na cintura
  const faixa = new THREE.Group()
  faixa.position.y = 0.5
  const band = cylinder(0.272, 0.272, 0.11, SASH, { roughness: 0.75 })
  faixa.add(band)
  const no = sphere(0.06, SASH, { roughness: 0.75 })
  no.position.set(0.14, 0, 0.24)
  faixa.add(no)
  for (const [dx, rz] of [[0.11, 0.12], [0.19, -0.18]] as const) {
    const ponta = rbox(0.07, 0.3, 0.025, 0.012, SASH, { roughness: 0.75 })
    ponta.position.set(dx, -0.17, 0.27)
    ponta.rotation.z = rz
    faixa.add(ponta)
  }
  lucia.add(faixa)

  // coroa de folhas com quatro velas
  const coroa = new THREE.Group()
  coroa.position.y = 0.2
  const aro = torus(0.25, 0.045, LEAF, { roughness: 0.8 })
  aro.rotation.x = Math.PI / 2
  coroa.add(aro)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const leaf = sphere(0.055, i % 2 ? LEAF : '#2f6538', { roughness: 0.8 })
    leaf.position.set(Math.cos(a) * 0.26, 0.01, Math.sin(a) * 0.26)
    leaf.scale.set(1.3, 0.55, 0.8)
    leaf.rotation.y = -a
    coroa.add(leaf)
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2
    const vela = cylinder(0.032, 0.034, 0.2, '#fbf8f0', { roughness: 0.4 })
    vela.position.set(Math.cos(a) * 0.25, 0.12, Math.sin(a) * 0.25)
    coroa.add(vela)
    const chama = cone(0.022, 0.06, '#ffb347', { emissive: '#ff9a2e', emissiveIntensity: 1.2 })
    chama.position.set(Math.cos(a) * 0.25, 0.26, Math.sin(a) * 0.25)
    coroa.add(chama)
  }
  head.add(coroa)

  // braços: direito ergue o dedinho para a placa; esquerdo cruza de birra
  const bracoR = lucia.getObjectByName('armR') as THREE.Mesh
  const bracoL = lucia.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  shoulderPivot(bracoL, 1.5)
  const eul = (dir: THREE.Vector3) =>
    new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(DOWN, dir.normalize()))
  const HANG_R = eul(new THREE.Vector3(0.18, -1, 0.05))
  const HANG_L = eul(new THREE.Vector3(-0.18, -1, 0.05))
  const POINT = eul(new THREE.Vector3(0.85, 0.62, 0.15))
  const CROSS = eul(new THREE.Vector3(0.8, -0.35, 0.55))
  bracoR.rotation.copy(POINT)
  bracoL.rotation.copy(CROSS)
  const maoR = bracoR.children[0]
  const dedinho = capsule(0.022, 0.08, SKIN, { roughness: 0.6 })
  dedinho.position.set(0.0, -0.1, 0.0)
  maoR.add(dedinho)

  root.add(lucia)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'rua', object: base },
    { name: 'casas', group: 'rua', object: casas },
    { name: 'lucia', group: 'lucia', object: lucia },
    { name: 'bracoR', group: 'lucia', object: bracoR },
    { name: 'bracoL', group: 'lucia', object: bracoL },
    { name: 'faixa', group: 'lucia', object: faixa },
    { name: 'coroa', group: 'coroa', object: coroa },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'sol', group: 'sol', object: sol },
    { name: 'raios', group: 'sol', object: raios },
  ]

  const rot = (part: string, name: string, at: number, dur: number, a: THREE.Euler, b: THREE.Euler, caption?: string) =>
    seq(name, part, at, dur, [
      ch('rotation.x', a.x, b.x), ch('rotation.y', a.y, b.y), ch('rotation.z', a.z, b.z),
    ], { ease: 'easeOut', caption })

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Dezembro, três da tarde, breu total: brota a rua nevada…',
    }),
    seq('casas-rise', 'casas', 0.3, 0.9, [riseFrom(0, 1.6)], { ease: 'easeOut' }),

    seq('lucia-rise', 'lucia', 1.5, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Santa Lucia desfila de camisola branca, toda importante…',
    }),
    rot('bracoR', 'bracoR-entra', 1.5, 0.6, HANG_R, HANG_R),
    rot('bracoL', 'bracoL-entra', 1.5, 0.6, HANG_L, HANG_L),
    seq('faixa-amarra', 'faixa', 2.1, 0.6, [
      ch('scale.x', 1.3, 1), ch('scale.y', 0.01, 1), ch('scale.z', 1.3, 1),
    ], { ease: 'easeOut' }),
    seq('coroa-desce', 'coroa', 2.6, 0.8, [ch('position.y', 0.9, 0.2), ch('rotation.y', -1.6, 0)], {
      ease: 'easeOut',
      caption: '…com a coroa de velas: a única luz da cidade.',
    }),

    seq('placa-rise', 'placa', 3.9, 0.8, [riseFrom(GY, 1.7)], {
      ease: 'easeOut',
      caption: 'Ela vê a placa SUL…',
    }),
    rot('bracoR', 'bracoR-aponta', 4.9, 0.7, HANG_R, POINT,
      '…e ergue o dedinho — EN — pra mostrar o caminho: SUL-EN.'),

    seq('sol-sobe', 'sol', 6.3, 1.3, [ch('position.y', 0.3, SUN_Y)], {
      ease: 'easeOut',
      caption: 'Do SUL sobe um sol enorme, gargalhando: RRÍÍÍ!',
    }),
    seq('raios-abrem', 'raios', 6.7, 1.0, [
      ch('scale.x', 0.6, 1), ch('scale.y', 0.6, 1), ch('rotation.z', -1.2, 0),
    ], { ease: 'easeOut' }),
    seq('sol-ri-a', 'sol', 7.8, 0.3, [ch('rotation.z', 0, 0.09)], {
      caption: 'Brilha tanto que as velas da coroa viram palitos de fósforo.',
    }),
    seq('sol-ri-b', 'sol', 8.1, 0.3, [ch('rotation.z', 0.09, -0.07)]),
    seq('sol-ri-c', 'sol', 8.4, 0.3, [ch('rotation.z', -0.07, 0)]),

    rot('bracoL', 'bracoL-cruza', 9.2, 0.6, HANG_L, CROSS,
      'Lucia cruza o braço, emburrada: RI, NÉ?!'),
    seq('lucia-bico', 'lucia', 9.2, 0.6, [ch('rotation.y', 0.45, 0.22)], { ease: 'easeOut' }),

    seq('sol-final', 'sol', 10.6, 0.6, [ch('rotation.y', -0.25, -0.12)], {
      caption: 'Solen skiner. — O sol está brilhando.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 2.35, 5.6], target: [0.15, 1.5, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'solen-skiner',
    contexto:
      "Small talk: no primeiro sábado de sol de abril ou maio, quando a Suécia inteira corre pro parque, pra varanda ou pro banco da praça de olhos fechados e cara pro céu. Também ao abrir a persiana de manhã, e em mensagem pra combinar: 'Solen skiner, ska vi ut?'",
    fraseFonte: 'O sol está brilhando.',
    fraseAlvo: 'Solen skiner.',
    pronuncia:
      "SÚÚ-len RRÍÍ-ner ('sol' se escreve igual ao nosso, mas o O longo sueco soa U: SÚÚL, nunca 'sól'; o -en é o artigo colado no fim, 'O sol', fraquinho, oral e com o N na ponta da língua; 'skiner' NÃO tem som de 'sk': o 'sk' antes de I vira o sopro do 'sj' — um RR soprado, forte e raspado, com os lábios em bico —, I LONGO, e o -ner fraquinho com R brando no fim, que é o presente; força no SÚ e no RRÍ)",
    ponteSonora:
      "SUL-EN... RRÍÍ, NÉ-R?! (4 sílabas: SÚÚ-len-RRÍÍ-ner; força no SÚ e no RRÍ; SUL = a placa SUL — e o 'sol' sueco se escreve igual ao nosso, mas soa SUL: U FECHADO e LONGO, nunca o 'sól' aberto; o L NÃO vira U como no 'sul' brasileiro ('suw'): ele gruda no EN seguinte, como em 'mal-entendido' — SÚ-len; EN = o 'en' de sempre, o dedinho erguido de 'Har du tid en stund?' e do ciclope de 'Jag behöver träffa en läkare': curto, ORAL, N na ponta da língua, sem o 'ẽ' fanhoso — e é o mesmo som do artigo grudado no fim, que aqui quer dizer 'O': sol = sol, solen = o sol; RRÍÍ = a gargalhada do sol, o RI soprado: o 'sk' antes de I não soa 'sk', vira o sopro do 'sj', o MESMO de RRÍCA ('skicka') e RRÜÜK ('sjuk') — FORTE e raspado, com os lábios já em bico —, e o I bem LONGO; com o h leve e o I curto vira 'hinner' (dá tempo), o RRÍNER do pinguim goleiro; NÉ-R = o 'Ri, né?!' emburrado da Lucia, sem força, com o É curto e um R brando no fim, de um toque só: é o -er do presente — sem ele não há presente (o infinitivo é 'skina'))",
    historia:
      "Dezembro, três da tarde, breu total: Santa Lucia desfila de camisola branca e coroa de velas, a única luz da cidade, toda importante. Ela vê a placa SUL e ergue o dedinho — EN — pra mostrar o caminho, e de lá, do sul, sobe um sol enorme, gargalhando um RRÍÍÍ tão forte e brilhando tanto que as velas da coroa dela parecem palitos de fósforo. Lucia cruza os braços, emburrada: 'RI, NÉ?!'. Não adianta: o sol está brilhando.",
  },
  createScene,
}

export default card
