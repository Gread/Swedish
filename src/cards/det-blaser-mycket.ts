import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Det blåser mycket." — no lago congelado, a ventania arrasta a van DOBLÔ
 * pelo gelo; o pescador berra DÊ… BLÔ… SÉR! e segura a van pelo para-choque
 * só no MUQUE, enquanto o balde rola e os peixes escapam.
 */

const ICE = '#cfe5f1'
const ICE_DEEP = '#6d8aa3'
const CRACK = '#9cc0d6'
const SNOW = '#f4f8fb'
const WHITE = '#eef1f3'
const GLASS = '#26313d'
const BUMPER = '#3d4650'
const TIRE = '#22262b'
const SILVER = '#a9b3bb'
const NAVY = '#26375a'
const SKIN = '#e9c4a0'
const BEARD = '#a8451f'
const WOOD = '#9d6a33'
const WIND = '#dfe8ef'
const ORANGE = '#f07a1f' // acento saturado RESERVADO: o casaco do pescador do MUQUE

const GY = 0.16
const FISH_H = 1.6
const MAN: [number, number, number] = [-1.3, GY, 0.25]
const MAN_LEAN = 0.26
const VAN: [number, number, number] = [0.75, GY + 0.05, -0.35]

function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.012, NAVY, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** B L Ô — letras de traço grosso no flanco da van. */
function letter(which: 'B' | 'L' | 'O') {
  const g = new THREE.Group()
  const t = 0.05
  if (which === 'B') {
    g.add(stroke(t, 0.3, -0.08, 0))
    g.add(stroke(0.137, t, -0.025, 0.127))
    g.add(stroke(0.137, t, -0.025, 0))
    g.add(stroke(0.137, t, -0.025, -0.127))
    g.add(stroke(t, 0.114, 0.057, 0.068))
    g.add(stroke(t, 0.114, 0.057, -0.068))
  } else if (which === 'L') {
    g.add(stroke(t, 0.3, -0.05, 0))
    g.add(stroke(0.15, t, 0.0, -0.127))
  } else {
    const o = torus(0.095, 0.026, NAVY, { roughness: 0.5 })
    o.scale.set(1, 1.4, 0.6)
    g.add(o)
    g.add(stroke(0.03, 0.1, -0.035, 0.24, -0.75))
    g.add(stroke(0.03, 0.1, 0.035, 0.24, 0.75))
  }
  return g
}

function makeFish(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const body = sphere(0.07, '#b9c6d0', { roughness: 0.3, metalness: 0.5 })
  body.scale.set(2.0, 0.85, 0.6)
  const back = sphere(0.06, '#6f8799', { roughness: 0.35, metalness: 0.4 })
  back.scale.set(1.9, 0.5, 0.55)
  back.position.y = 0.03
  const tail = cone(0.07, 0.11, '#8ea2b2', { roughness: 0.35, metalness: 0.4 })
  tail.rotation.z = -Math.PI / 2
  tail.scale.z = 0.3
  tail.position.x = -0.17
  const fin = cone(0.035, 0.06, '#8ea2b2', { roughness: 0.4 })
  fin.scale.z = 0.3
  fin.position.set(0, 0.07, 0)
  g.add(body, back, tail, fin)
  for (const side of [-1, 1]) {
    const eye = sphere(0.016, '#ffffff', { roughness: 0.2 })
    eye.position.set(0.095, 0.015, side * 0.035)
    const pupil = sphere(0.008, '#111111', { roughness: 0.2 })
    pupil.position.set(0.1, 0.015, side * 0.045)
    g.add(eye, pupil)
  }
  g.rotation.z = (rand() - 0.5) * 0.6
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(17)

  // ---- base: lago congelado -------------------------------------------------
  const base = new THREE.Group()
  const deep = cylinder(2.66, 2.74, 0.1, ICE_DEEP, { roughness: 0.6 })
  deep.position.y = 0.05
  base.add(deep)
  const ice = cylinder(2.6, 2.62, 0.06, ICE, { roughness: 0.15, metalness: 0.1 })
  ice.position.y = GY - 0.03
  base.add(ice)
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.0 + rand() * 1.2
    const crack = rbox(0.5 + rand() * 0.5, 0.012, 0.025, 0.006, CRACK, { roughness: 0.3 })
    crack.position.set(Math.cos(a) * r, GY + 0.002, Math.sin(a) * r)
    crack.rotation.y = rand() * Math.PI
    base.add(crack)
  }
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * 0.95 + (i / 8) * Math.PI * 1.1
    const drift = puff(0.26 + rand() * 0.1, SNOW, 4, 50 + i, { roughness: 0.9 })
    drift.position.set(Math.cos(a) * 2.45, GY + 0.02, Math.sin(a) * 2.45)
    drift.scale.y = 0.4
    base.add(drift)
  }
  root.add(base)

  // ---- buraco de pesca + banquinho ----------------------------------------
  const buraco = new THREE.Group()
  buraco.position.set(-1.85, 0, -0.95)
  const water = cylinder(0.3, 0.3, 0.02, '#14304a', { roughness: 0.1 })
  water.position.y = GY + 0.004
  const rim = torus(0.31, 0.05, SNOW, { roughness: 0.8 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = GY + 0.012
  buraco.add(water, rim)
  const stool = new THREE.Group()
  stool.position.set(0.5, GY, 0.25)
  const seat = cylinder(0.17, 0.17, 0.05, WOOD, { roughness: 0.7 })
  seat.position.y = 0.38
  stool.add(seat)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2
    const leg = cylinder(0.025, 0.025, 0.38, '#7a5226', { roughness: 0.8 })
    leg.position.set(Math.cos(a) * 0.1, 0.19, Math.sin(a) * 0.1)
    leg.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18)
    stool.add(leg)
  }
  buraco.add(stool)
  root.add(buraco)

  // ---- van DOBLÔ branca e quadradona ---------------------------------------
  const van = new THREE.Group()
  van.position.set(...VAN)
  van.rotation.set(0, 0.18, -0.07)
  const body = rbox(1.75, 1.3, 1.05, 0.14, WHITE, { roughness: 0.35 })
  body.position.set(-0.175, 0.85, 0)
  const hood = rbox(0.5, 0.62, 1.0, 0.14, WHITE, { roughness: 0.35 })
  hood.position.set(0.85, 0.51, 0)
  const windshield = rbox(0.03, 0.55, 0.9, 0.03, GLASS, { roughness: 0.1 })
  windshield.position.set(0.71, 1.12, 0)
  van.add(body, hood, windshield)
  for (const [wx, ww] of [[0.38, 0.42], [-0.2, 0.55], [-0.75, 0.35]] as const) {
    const win = rbox(ww, 0.4, 0.02, 0.05, GLASS, { roughness: 0.1 })
    win.position.set(wx, 1.18, 0.528)
    van.add(win)
  }
  for (const sx of [0.12, -0.5]) {
    const seam = rbox(0.015, 1.05, 0.015, 0.005, '#9aa4ad', { roughness: 0.5 })
    seam.position.set(sx, 0.88, 0.528)
    const handle = rbox(0.1, 0.03, 0.03, 0.01, BUMPER, { roughness: 0.4 })
    handle.position.set(sx - 0.09, 0.95, 0.535)
    van.add(seam, handle)
  }
  for (const rz of [-0.22, 0.22]) {
    const rw = rbox(0.02, 0.4, 0.36, 0.04, GLASS, { roughness: 0.1 })
    rw.position.set(-1.055, 1.18, rz)
    van.add(rw)
  }
  for (const tz of [-0.46, 0.46]) {
    const tail = rbox(0.03, 0.25, 0.08, 0.01, '#a8303a', { roughness: 0.3 })
    tail.position.set(-1.06, 0.95, tz)
    const head = rbox(0.03, 0.12, 0.22, 0.02, '#f3ecc8', { roughness: 0.2 })
    head.position.set(1.105, 0.66, tz * 0.72)
    van.add(tail, head)
  }
  const grille = rbox(0.02, 0.12, 0.4, 0.01, BUMPER, { roughness: 0.4 })
  grille.position.set(1.105, 0.5, 0)
  const rearBumper = rbox(0.16, 0.17, 1.1, 0.05, BUMPER, { roughness: 0.5 })
  rearBumper.position.set(-1.1, 0.36, 0)
  const frontBumper = rbox(0.16, 0.17, 1.08, 0.05, BUMPER, { roughness: 0.5 })
  frontBumper.position.set(1.14, 0.33, 0)
  const mirror = rbox(0.08, 0.12, 0.1, 0.02, TIRE, { roughness: 0.4 })
  mirror.position.set(0.66, 1.0, 0.58)
  van.add(grille, rearBumper, frontBumper, mirror)
  for (const rz of [-0.4, 0.4]) {
    const railBar = cylinder(0.025, 0.025, 1.5, '#5b646c', { roughness: 0.3, metalness: 0.7 })
    railBar.rotation.z = Math.PI / 2
    railBar.position.set(-0.2, 1.54, rz)
    van.add(railBar)
  }
  for (const wx of [-0.62, 0.68]) {
    for (const wz of [-0.47, 0.47]) {
      const tire = cylinder(0.24, 0.24, 0.2, TIRE, { roughness: 0.8 })
      tire.rotation.x = Math.PI / 2
      tire.position.set(wx, 0.24, wz)
      const hub = cylinder(0.12, 0.12, 0.21, SILVER, { roughness: 0.3, metalness: 0.7 })
      hub.rotation.x = Math.PI / 2
      hub.position.set(wx, 0.24, wz)
      van.add(tire, hub)
    }
  }
  const word = new THREE.Group()
  word.position.set(-0.05, 0.62, 0.535)
  for (const [gl, lx] of [['B', -0.25], ['L', 0.0], ['O', 0.24]] as const) {
    const l = letter(gl)
    l.position.x = lx
    word.add(l)
  }
  van.add(word)
  root.add(van)

  // ---- vento: três faixas curvas + flocos ---------------------------------
  const vento = new THREE.Group()
  const windPaths: [number, number, number][][] = [
    [[-0.9, 1.95, -1.1], [0.0, 2.1, -1.1], [0.9, 1.92, -1.1], [1.7, 2.05, -1.1], [2.0, 2.3, -1.1], [1.8, 2.42, -1.1], [1.65, 2.28, -1.1]],
    [[-0.4, 2.38, -1.3], [0.5, 2.5, -1.3], [1.3, 2.4, -1.3], [2.05, 2.55, -1.3]],
    [[0.9, 0.95, -1.0], [1.6, 1.05, -1.0], [2.2, 0.95, -1.0], [2.45, 1.2, -1.0], [2.25, 1.32, -1.0]],
  ]
  for (const pts of windPaths) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)))
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.035, 10, false), mat(WIND, { roughness: 0.6 }))
    tube.castShadow = true
    vento.add(tube)
    for (let k = 0; k < 4; k++) {
      const p = curve.getPoint(0.15 + k * 0.22)
      const flake = sphere(0.03, SNOW, { roughness: 0.6 })
      flake.position.set(p.x + (rand() - 0.5) * 0.2, p.y + (rand() - 0.5) * 0.25, p.z + 0.15)
      vento.add(flake)
    }
  }
  root.add(vento)

  // ---- pescador: inclinado pra trás --------------------------------------
  const pescador = new THREE.Group()
  pescador.position.set(...MAN)
  pescador.rotation.z = MAN_LEAN
  const p = person({ body: ORANGE, skin: SKIN, height: FISH_H, armAngle: 0.4 })
  p.rotation.y = 0.75
  pescador.add(p)
  p.getObjectByName('armR')!.visible = false
  const pants = cylinder(0.285, 0.29, 0.3, NAVY, { roughness: 0.85 })
  pants.position.y = 0.15
  p.add(pants)
  for (const qy of [0.42, 0.55, 0.68]) {
    const quilt = torus(0.282, 0.018, '#c95f14', { roughness: 0.85 })
    quilt.rotation.x = Math.PI / 2
    quilt.position.y = qy
    p.add(quilt)
  }
  const collar = torus(0.2, 0.06, '#eadfcb', { roughness: 0.95 })
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.83
  p.add(collar)
  for (const bx of [-0.12, 0.12]) {
    const boot = rbox(0.18, 0.14, 0.34, 0.05, '#1c1d20', { roughness: 0.7 })
    boot.position.set(bx, 0.07, 0.08)
    p.add(boot)
  }
  const head = p.getObjectByName('head')!
  head.rotation.y = -0.5
  const mouthCavity = sphere(0.065, '#3a1f1c', { roughness: 0.7 })
  mouthCavity.position.set(0, -0.11, 0.24)
  const mouth = torus(0.075, 0.028, '#2a1a18', { roughness: 0.6 })
  mouth.position.set(0, -0.11, 0.255)
  const beard = puff(0.11, BEARD, 5, 41, { roughness: 0.92 })
  beard.position.set(0, -0.24, 0.12)
  beard.scale.set(1.35, 0.8, 0.85)
  const beanie = lathe([[0.315, 0.0], [0.318, 0.1], [0.28, 0.2], [0.17, 0.28], [0, 0.31]], NAVY, { roughness: 0.9 })
  beanie.position.y = 0.1
  const cuff = torus(0.31, 0.045, '#eadfcb', { roughness: 0.9 })
  cuff.rotation.x = Math.PI / 2
  cuff.position.y = 0.12
  const pompom = sphere(0.075, '#eadfcb', { roughness: 0.95 })
  pompom.position.y = 0.42
  head.add(mouthCavity, mouth, beard, beanie, cuff, pompom)
  root.add(pescador)

  // ---- rastros das botas + neve empurrada ---------------------------------
  const rastros = new THREE.Group()
  for (const rz of [0.12, 0.4]) {
    const groove = rbox(0.9, 0.012, 0.05, 0.008, '#8fb3cb', { roughness: 0.4 })
    groove.position.set(-1.85, GY + 0.003, rz)
    rastros.add(groove)
  }
  const pile = puff(0.1, SNOW, 4, 77, { roughness: 0.9 })
  pile.position.set(-1.05, GY + 0.02, 0.3)
  pile.scale.y = 0.5
  rastros.add(pile)
  root.add(rastros)

  // ---- braço do MUQUE: do ombro ao para-choque -----------------------------
  root.updateMatrixWorld(true)
  const shoulder = p.localToWorld(new THREE.Vector3(0.3, 0.78, 0))
  const grip = van.localToWorld(new THREE.Vector3(-1.12, 0.4, 0.32))
  const L = shoulder.distanceTo(grip)
  const braco = new THREE.Group()
  braco.position.copy(shoulder)
  braco.lookAt(grip)
  const upper = capsule(0.1, 0.45 * L, SKIN)
  upper.rotation.x = Math.PI / 2
  upper.position.z = 0.27 * L
  const biceps = sphere(0.17, SKIN, { roughness: 0.5 })
  biceps.scale.set(1.0, 0.95, 1.5)
  biceps.position.set(0, 0.09, 0.3 * L)
  const elbow = sphere(0.1, SKIN)
  elbow.position.z = 0.55 * L
  const fore = capsule(0.09, 0.32 * L, SKIN)
  fore.rotation.x = Math.PI / 2
  fore.position.z = 0.73 * L
  const foreBulge = sphere(0.11, SKIN)
  foreBulge.scale.set(1, 0.9, 1.4)
  foreBulge.position.z = 0.65 * L
  const fist = sphere(0.12, SKIN)
  fist.scale.set(1.05, 0.9, 1)
  fist.position.z = L - 0.02
  braco.add(upper, biceps, elbow, fore, foreBulge, fist)
  root.add(braco)

  // manga rasgada com enchimento escapando
  const manga = new THREE.Group()
  manga.position.copy(shoulder)
  manga.quaternion.copy(braco.quaternion)
  const sleeve = cylinder(0.16, 0.15, 0.2, ORANGE, { roughness: 0.85 })
  sleeve.rotation.x = Math.PI / 2
  sleeve.position.z = 0.08
  manga.add(sleeve)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    const tooth = cone(0.04, 0.1, ORANGE, { roughness: 0.85 })
    tooth.rotation.x = Math.PI / 2
    tooth.position.set(Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.21 + (k % 2) * 0.03)
    manga.add(tooth)
  }
  const stuffing = puff(0.05, '#fbf7ef', 3, 88, { roughness: 0.95 })
  stuffing.position.set(0.09, 0.12, 0.2)
  manga.add(stuffing)
  root.add(manga)

  // ---- balde rolando + peixes ----------------------------------------------
  const balde = new THREE.Group()
  balde.position.set(0.0, GY + 0.19, 1.3)
  const bucket = new THREE.Group()
  bucket.rotation.set(0, -0.7, -Math.PI / 2)
  bucket.position.y = -0.0
  const pail = lathe(
    [[0, 0], [0.15, 0], [0.155, 0.01], [0.19, 0.3], [0.2, 0.31], [0.185, 0.3], [0.145, 0.015], [0, 0.015]],
    SILVER,
    { roughness: 0.35, metalness: 0.6 },
  )
  pail.position.y = -0.155
  bucket.add(pail)
  for (const ry of [0.08, 0.22]) {
    const rib = torus(0.165 + ry * 0.12, 0.012, '#8d979f', { roughness: 0.35, metalness: 0.6 })
    rib.rotation.x = Math.PI / 2
    rib.position.y = ry - 0.155
    bucket.add(rib)
  }
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 8, 24, Math.PI), mat('#5b646c', { roughness: 0.3, metalness: 0.7 }))
  bail.position.y = 0.14
  bail.rotation.y = Math.PI / 2
  bucket.add(bail)
  balde.add(bucket)
  root.add(balde)

  const peixes = new THREE.Group()
  const fishPos: [number, number, number, number][] = [
    [0.45, GY + 0.05, 1.55, 0.3],
    [0.75, GY + 0.22, 1.35, -0.5],
    [0.6, GY + 0.05, 1.9, 0.9],
  ]
  for (const [i, [fx, fy, fz, ry]] of fishPos.entries()) {
    const f = makeFish(5 + i)
    f.position.set(fx, fy, fz)
    f.rotation.y = ry
    peixes.add(f)
  }
  root.add(peixes)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'lago', object: base },
    { name: 'buraco', group: 'lago', object: buraco },
    { name: 'pescador', group: 'pescador', object: pescador },
    { name: 'van', group: 'van', object: van },
    { name: 'vento', group: 'vento', object: vento },
    { name: 'rastros', group: 'grito', object: rastros },
    { name: 'braco', group: 'muque', object: braco },
    { name: 'manga', group: 'muque', object: manga },
    { name: 'balde', group: 'balde', object: balde },
    { name: 'peixes', group: 'balde', object: peixes },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No meio do lago congelado, o pescador abre o buraco de pesca…',
    }),
    seq('buraco-rise', 'buraco', 0.3, 0.7, [riseFrom(0, 0.6)], { ease: 'easeOut' }),
    seq('pescador-rise', 'pescador', 1.0, 0.8, [riseFrom(GY, 2.2), ch('rotation.z', 0, 0), ch('position.x', -1.6, -1.6)], {
      ease: 'easeOut',
      caption: '…e estacionou a van DOBLÔ do lado.',
    }),
    seq('van-rise', 'van', 1.5, 0.9, [riseFrom(VAN[1], 2.0)], { ease: 'easeOut' }),
    seq('vento-entra', 'vento', 3.0, 1.0, [ch('position.x', -3.5, 0), ch('scale.x', 0.3, 1)], {
      ease: 'easeOut',
      caption: 'Vem uma rajada — e a van sai deslizando pelo gelo feito barco a vela!',
    }),
    seq('van-desliza', 'van', 3.2, 1.2, [
      ch('position.x', 0.15, VAN[0]), ch('rotation.y', 0, 0.18), ch('rotation.z', 0, -0.07),
    ], { ease: 'easeOut' }),
    seq('pescador-puxa', 'pescador', 4.8, 0.8, [
      ch('rotation.z', 0, MAN_LEAN), ch('position.x', -1.6, MAN[0]),
    ], {
      ease: 'easeOut',
      caption: 'Ele berra "DÊ cá a minha DOBLÔ! SÉRIO?!" — e o vento só deixa: DÊ… BLÔ… SÉR!',
    }),
    seq('rastros', 'rastros', 5.0, 0.7, [ch('scale.x', 0.05, 1)], { ease: 'easeOut' }),
    seq('braco-agarra', 'braco', 6.8, 0.6, [
      ch('scale.z', 0.05, 1), ch('scale.x', 0.7, 0.75), ch('scale.y', 0.7, 0.75),
    ], {
      ease: 'easeOut',
      caption: 'Aí ele segura a van pelo para-choque só no MUQUE…',
    }),
    seq('braco-incha', 'braco', 7.7, 0.6, [ch('scale.x', 0.75, 1), ch('scale.y', 0.75, 1)], {
      ease: 'easeOut',
      caption: '…o bíceps incha e RASGA a manga do casaco!',
    }),
    seq('manga-rasga', 'manga', 7.7, 0.5, s3(0.01, 1), { ease: 'easeOut' }),
    seq('balde-rola', 'balde', 9.0, 1.0, [ch('position.x', -0.9, 0.0), ch('rotation.y', 3, 0)], {
      ease: 'easeOut',
      caption: 'Enquanto isso o balde sai rolando e os peixes escapam.',
    }),
    seq('peixes-pulam', 'peixes', 9.6, 0.7, [...s3(0.01, 1), ch('position.y', 0.3, 0)], { ease: 'easeOut' }),
    seq('van-tranco', 'van', 11.0, 0.5, [ch('position.y', VAN[1], VAN[1])], {
      caption: 'Det blåser mycket. — Está ventando muito.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.4, 5.6], target: [0.1, 1.05, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-blaser-mycket',
    contexto:
      "Small talk sobre o tempo: no ponto de ônibus de Göteborg, pedalando contra o vento numa ponte, na costa ou num lago congelado. É também como a previsão da SVT e do SMHI fala ('det blåser kraftigt' = venta forte), e a desculpa de quem chega descabelado no trabalho.",
    fraseFonte: 'Está ventando muito.',
    fraseAlvo: 'Det blåser mycket.',
    pronuncia:
      "dê BLÔÔ-ser MÜK-ke ('det' = dê, sem T; 'blåser' com a força no BLÔ, Ô FECHADO e longo — é o å longo —, e o -ser fraquinho com R brando no fim: é o presente (o infinitivo é 'blåsa'); 'mycket' = MÜK-ke, Ü curto — i com bico —, K dobrado e o T mudo, como na fala; força no BLÔ e no MÜK)",
    ponteSonora:
      "DÊ! (do)BLÔ... SÉR(io)?! MÜ-QUE! (5 sílabas: dê-BLÔÔ-ser-MÜK-ke; força no BLÔ e no MÜ; DÊ = o 'det' de sempre, o MESMO DÊ de 'Det snöar!' e 'Det regnar igen' — aqui o 'DÊ cá!' que o pescador berra e o vento corta logo no DÊ: Ê FECHADO e sem T; BLÔ = a van DOBLÔ, que o Brasil já fala com a força no BLÔ e o Ô FECHADO — a ventania arranca o DO, e quem entra no lugar é o DÊ: dê-BLÔ, colado; estique o Ô: é o å LONGO, o mesmo PÔ fechado de 'Ta på dig' e o SÔ de 'Tack så mycket'; de Ó aberto e curto sai outra palavra ('blossa', chamejar); SÉR = o 'SÉRIO?!' indignado, cortado no R e emendado no BLÔ numa palavra só (BLÔ-ser): o É curtinho e SEM força e o R de um toque só, de 'caro' — esse R é o presente: sem ele não há presente — o infinitivo é 'blåsa'; MÜ-QUE = o MUQUE de 'Tack så mycket' e do alfaiate de 'Jag har mycket att göra', com BICO: língua de I e lábios de U, Ü curto, o K segurado um instante (é dobrado) e o -QUE fraquinho, sem o T — nunca 'MÚ-qui' de boca aberta)",
    historia:
      "No meio do lago congelado, o pescador no gelo estacionou a van Doblô do lado do buraco de pesca. Vem uma rajada tão forte que a van sai deslizando pelo gelo feito barco a vela. Ele berra 'DÊ cá a minha DOBLÔ! SÉRIO?!', mas a ventania arranca pedaços das palavras da boca dele, e o que se ouve é só 'DÊ... BLÔ... SÉR!'. Aí ele segura a van pelo para-choque só no MUQUE, o bíceps inchado rasgando a manga do casaco, enquanto o balde de peixes sai rolando. Está ventando muito.",
  },
  createScene,
}

export default card
