import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, rock,
} from '../rig/helpers'

/**
 * "Jag har glömt lösenordet." — IÁ, RRÁR! GLÔ(bo)… MMM-T! LÊ SEM ORDE(m)-T!
 *
 * Segunda de manhã: a anta do escritório senta atrás da mesa branca, a tela
 * pede a senha (cadeado amarelo) e ela ri nervosa. A senha estava guardada
 * dentro do GLOBO de neve da mesa; ela encosta a tromba no vidro — T! — e as
 * letrinhas (S, 9, #) rodopiam SEM ORDEM no meio da neve. Três interrogações
 * douradas flutuam sobre a cabeça.
 *
 * Diorama: carpete cinza de escritório, mesa branca larga de frente para a
 * câmera (vão aberto embaixo: cadeira e patinhas penduradas aparecem), anta
 * atrás da mesa com a cabeça avançada até o globo, monitor à direita.
 */

const FLOOR_EDGE = '#6b6f76'
const CARPET = '#b7babf'
const CARPET_LINE = '#a6aab0'
const DESK = '#eeece6'
const DESK_SHADE = '#dcd9d1'
const METAL = '#9ba1a8'
const TAPIR = '#585c64'
const TAPIR_DARK = '#44474e'
const HOOF = '#2c2e33'
const EAR_RIM = '#ecebe6'
const CHAIR = '#25272c'
const CHAIR_SOFT = '#30333a'
const BEZEL = '#1c1e23'
const SCREEN = '#2c68aa'
const LOCK = '#f4c02c'
const WOOD = '#4a3324'
const WOOD_LIGHT = '#6a4a33'
const GLASS = '#e4f2ff'
const RED = '#d9453b'
const GREEN = '#3ea55c'
const BLUE = '#3a77d6'
const GOLD = '#e6ad2e'

const GY = 0.17 // topo do carpete
const TY = 0.97 // tampo da mesa
const SY = 0.6 // assento da cadeira
const DESK_X = 0.2
const DESK_Z = -0.1
const CHAIR_X = -0.55
const CHAIR_Z = -1.2
const BODY_YAW = 0.4

// globo de neve sobre a mesa: centro do vidro e raio
const GLOBE_X = 0.15
const GLOBE_Z = -0.02
const GLOBE_R = 0.32
const GLOBE_CY = 0.44 // centro do vidro acima do tampo
const TIP = 0.72 // ponta da tromba no eixo +z local da cabeça
const AS = 1.15 // anta robusta: corpo e cabeça maiores que a cadeira

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula entre dois pontos (membros, pescoço). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.001, d.length()), color, { roughness: 0.8 })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize())
  return m
}

/** Material vira vidro: transparente, sem escrever profundidade. */
function seeThrough(mesh: THREE.Mesh, opacity: number) {
  const m = mesh.material as THREE.MeshStandardMaterial
  m.transparent = true
  m.opacity = opacity
  m.depthWrite = false
  mesh.castShadow = false
  mesh.receiveShadow = false
  return mesh
}

// ---- glifos de traço grosso (plano xy, virados para +z) ---------------------
const T = 0.036
const DEPTH = 0.032

function stroke(w: number, h: number, x: number, y: number, rot: number, color: string) {
  const s = rbox(w, h, DEPTH, 0.01, color, { roughness: 0.4 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

function arc(r: number, len: number, x: number, y: number, rot: number, color: string, tube = T) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube / 2, 10, 28, len),
    mat(color, { roughness: 0.4, size: r * 2 }),
  )
  m.position.set(x, y, 0)
  m.rotation.z = rot
  m.scale.z = DEPTH / tube
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** S, 9 e # — as letrinhas da senha, altura ~0.16. */
function glyph(which: 'S' | '9' | '#', color: string) {
  const g = new THREE.Group()
  const LH = 0.17
  if (which === 'S') {
    const r = (LH - T) / 4
    g.add(arc(r, 4.4, 0, r, 0.35, color))
    g.add(arc(r, 4.4, 0, -r, 0.35 + Math.PI, color))
  } else if (which === '9') {
    const r = 0.045
    g.add(arc(r, Math.PI * 2, 0, 0.035, 0, color))
    g.add(stroke(T, 0.12, r, -0.02, 0, color))
    g.add(arc(r, Math.PI * 0.75, 0, -0.035, Math.PI * 1.25, color))
  } else {
    g.add(stroke(T * 0.85, 0.2, -0.042, 0, -0.18, color))
    g.add(stroke(T * 0.85, 0.2, 0.042, 0, -0.18, color))
    g.add(stroke(0.19, T * 0.85, 0, 0.045, 0, color))
    g.add(stroke(0.19, T * 0.85, 0, -0.045, 0, color))
  }
  return g
}

/** Ponto de interrogação dourado: gancho + haste + ponto, ~0.36 de altura. */
function question(color: string) {
  const g = new THREE.Group()
  const t = 0.05
  const hook = arc(0.085, Math.PI * 1.5, 0, 0.1, -Math.PI / 2, color, t)
  hook.scale.z = 0.05 / t
  g.add(hook)
  const stem = rbox(t, 0.08, 0.05, 0.02, color, { roughness: 0.3, metalness: 0.5 })
  stem.position.set(0, -0.015, 0)
  g.add(stem)
  const dot = sphere(0.034, color, { roughness: 0.3, metalness: 0.5 })
  dot.position.set(0, -0.12, 0)
  g.add(dot)
  g.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) {
      const mm = m.material as THREE.MeshStandardMaterial
      mm.metalness = 0.5
      mm.roughness = 0.3
    }
  })
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- geometria-chave: globo, direção da tromba, cabeça --------------------
  const G = V(GLOBE_X, TY + GLOBE_CY, GLOBE_Z)
  const yaw = 0.72
  const pitch = 0.35
  const dir = V(Math.cos(pitch) * Math.sin(yaw), -Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw))
  const H = G.clone().addScaledVector(dir, -(GLOBE_R + TIP * AS + 0.005)) // tromba no vidro
  const Hm = H.clone().addScaledVector(dir, -0.12) // quase encostando
  const Hb = H.clone().addScaledVector(dir, -0.3).add(V(0, 0.06, 0)) // recuada

  // ---- base: carpete cinza de escritório -----------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.62, 2.7, 0.1, FLOOR_EDGE, { roughness: 0.8 })
  slab.position.y = 0.05
  base.add(slab)

  const carpet = cylinder(2.52, 2.55, 0.07, CARPET, { roughness: 0.95 })
  carpet.position.y = 0.135
  base.add(carpet)

  // placas de carpete: grade de frestas finas, cordas do círculo
  for (let i = -3; i <= 3; i++) {
    const c = i * 0.72
    const len = 2 * Math.sqrt(Math.max(2.45 * 2.45 - c * c, 0.01))
    const lx = rbox(len, 0.008, 0.025, 0.004, CARPET_LINE, { roughness: 0.95 })
    lx.position.set(0, GY + 0.002, c)
    base.add(lx)
    const lz = rbox(0.025, 0.008, len, 0.004, CARPET_LINE, { roughness: 0.95 })
    lz.position.set(c, GY + 0.002, 0)
    base.add(lz)
  }

  // lixeira de tela com bolinhas de papel amassado
  const bin = new THREE.Group()
  bin.position.set(-1.85, GY, 0.9)
  const binBody = lathe(
    [[0, 0], [0.17, 0], [0.2, 0.02], [0.23, 0.42], [0.21, 0.42], [0.185, 0.03], [0, 0.03]],
    '#3d4148',
    { roughness: 0.5, metalness: 0.4 },
  )
  bin.add(binBody)
  const binRim = torus(0.222, 0.014, '#2d3036', { roughness: 0.4, metalness: 0.5 })
  binRim.rotation.x = Math.PI / 2
  binRim.position.y = 0.42
  bin.add(binRim)
  for (const [px, py, pz, pr] of [[0.04, 0.4, 0.02, 0.08], [-0.07, 0.43, -0.04, 0.07]] as const) {
    const ball = rock(pr, '#f3f1ea', 7 + px * 100, { roughness: 0.9 })
    ball.position.set(px, py, pz)
    bin.add(ball)
  }
  base.add(bin)
  const floorBall = rock(0.075, '#f3f1ea', 19, { roughness: 0.9 })
  floorBall.position.set(-1.45, GY + 0.06, 1.25)
  base.add(floorBall)

  // espada-de-são-jorge num vaso, no canto de trás
  const pot = lathe(
    [[0, 0], [0.18, 0], [0.21, 0.05], [0.2, 0.34], [0.22, 0.36], [0.2, 0.37], [0, 0.33]],
    '#e2ded5',
    { roughness: 0.5 },
  )
  pot.position.set(2.0, GY, -0.95)
  base.add(pot)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rand() * 0.4
    const h = 0.55 + rand() * 0.35
    const leaf = rbox(0.07, h, 0.022, 0.03, i % 2 ? '#3e7a4b' : '#4f8c55', { roughness: 0.7 })
    leaf.position.set(2.0 + Math.cos(a) * 0.07, GY + 0.33 + h / 2, -0.95 + Math.sin(a) * 0.07)
    leaf.rotation.set(Math.sin(a) * 0.18, a, -Math.cos(a) * 0.18)
    base.add(leaf)
  }

  root.add(base)

  // ---- mesa branca larga ----------------------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(DESK_X, 0, DESK_Z)

  const top = rbox(2.6, 0.07, 1.0, 0.03, DESK, { roughness: 0.4 })
  top.position.y = TY - 0.035
  mesa.add(top)
  const edge = rbox(2.62, 0.025, 1.02, 0.012, DESK_SHADE, { roughness: 0.5 })
  edge.position.y = TY - 0.07
  mesa.add(edge)

  // pernas metálicas à esquerda
  for (const lz of [-0.4, 0.4]) {
    const leg = cylinder(0.035, 0.035, TY - 0.07 - GY, METAL, { roughness: 0.3, metalness: 0.7 })
    leg.position.set(-1.2, GY + (TY - 0.07 - GY) / 2, lz)
    mesa.add(leg)
    const foot = cylinder(0.05, 0.055, 0.02, '#5b6066', { roughness: 0.5 })
    foot.position.set(-1.2, GY + 0.01, lz)
    mesa.add(foot)
  }
  const bar = cylinder(0.022, 0.022, 0.8, METAL, { roughness: 0.3, metalness: 0.7 })
  bar.rotation.x = Math.PI / 2
  bar.position.set(-1.2, GY + 0.2, 0)
  mesa.add(bar)

  // gaveteiro à direita
  const PED_H = TY - 0.07 - GY
  const ped = rbox(0.58, PED_H, 0.92, 0.025, DESK, { roughness: 0.45 })
  ped.position.set(0.95, GY + PED_H / 2, 0)
  mesa.add(ped)
  for (let i = 0; i < 3; i++) {
    const dh = PED_H / 3 - 0.03
    const front = rbox(0.52, dh, 0.03, 0.02, DESK_SHADE, { roughness: 0.45 })
    front.position.set(0.95, GY + 0.03 + dh / 2 + i * (dh + 0.03), 0.465)
    mesa.add(front)
    const handle = capsule(0.016, 0.14, METAL, { roughness: 0.3, metalness: 0.7 })
    handle.rotation.z = Math.PI / 2
    handle.position.set(0.95, GY + 0.03 + dh * 0.78 + i * (dh + 0.03), 0.495)
    mesa.add(handle)
  }

  // caneca e bloco de papel
  const mug = lathe(
    [[0, 0], [0.075, 0], [0.08, 0.02], [0.075, 0.16], [0.08, 0.17], [0.066, 0.17], [0.066, 0.02], [0, 0.02]],
    '#5f8f8a',
    { roughness: 0.35 },
  )
  mug.position.set(-0.95, TY, 0.18)
  const mugHandle = torus(0.045, 0.014, '#5f8f8a', { roughness: 0.35 })
  mugHandle.position.set(0.085, 0.085, 0)
  mug.add(mugHandle)
  mesa.add(mug)
  mug.position.x -= DESK_X
  mug.position.z -= DESK_Z

  const papers = rbox(0.3, 0.03, 0.38, 0.01, '#f7f6f1', { roughness: 0.8 })
  papers.position.set(-0.55 - DESK_X, TY + 0.015, 0.25 - DESK_Z)
  papers.rotation.y = 0.25
  mesa.add(papers)

  root.add(mesa)

  // ---- monitor: tela azul com cadeado amarelo -------------------------------
  const monitor = new THREE.Group()
  monitor.position.set(0.98, TY, -0.32)
  monitor.rotation.y = -0.42

  const standBase = rbox(0.38, 0.03, 0.26, 0.012, BEZEL, { roughness: 0.4 })
  standBase.position.y = 0.015
  monitor.add(standBase)
  const neck = rbox(0.08, 0.3, 0.05, 0.02, '#2a2d33', { roughness: 0.4 })
  neck.position.set(0, 0.17, -0.04)
  monitor.add(neck)
  const bezel = rbox(1.04, 0.68, 0.06, 0.03, BEZEL, { roughness: 0.35 })
  bezel.position.set(0, 0.62, 0)
  monitor.add(bezel)
  const screen = rbox(0.96, 0.6, 0.012, 0.01, SCREEN, { emissive: '#1f5596', emissiveIntensity: 0.55, roughness: 0.3 })
  screen.position.set(0, 0.63, 0.03)
  monitor.add(screen)

  const lockBody = rbox(0.24, 0.19, 0.035, 0.04, LOCK, { roughness: 0.3, metalness: 0.3 })
  lockBody.position.set(0, 0.64, 0.05)
  monitor.add(lockBody)
  const shackle = arc(0.072, Math.PI, 0, 0.735, 0, LOCK, 0.035)
  shackle.position.z = 0.05
  monitor.add(shackle)
  for (const sx of [-1, 1]) {
    const leg = rbox(0.035, 0.05, 0.03, 0.01, LOCK, { roughness: 0.3, metalness: 0.3 })
    leg.position.set(sx * 0.072, 0.72, 0.05)
    monitor.add(leg)
  }
  const keyhole = cylinder(0.024, 0.024, 0.02, '#4a3a12', { roughness: 0.5 })
  keyhole.rotation.x = Math.PI / 2
  keyhole.position.set(0, 0.655, 0.07)
  monitor.add(keyhole)
  const keySlot = rbox(0.02, 0.05, 0.02, 0.008, '#4a3a12', { roughness: 0.5 })
  keySlot.position.set(0, 0.625, 0.07)
  monitor.add(keySlot)

  const field = rbox(0.5, 0.07, 0.015, 0.02, '#eef2f7', { roughness: 0.4 })
  field.position.set(0, 0.42, 0.042)
  monitor.add(field)
  for (let i = 0; i < 5; i++) {
    const dot = sphere(0.014, '#2b3038', { roughness: 0.4 })
    dot.position.set(-0.12 + i * 0.06, 0.42, 0.05)
    dot.scale.z = 0.5
    monitor.add(dot)
  }
  root.add(monitor)

  // ---- teclado --------------------------------------------------------------
  const teclado = new THREE.Group()
  teclado.position.set(0.78, TY, 0.2)
  teclado.rotation.y = -0.22
  const kb = rbox(0.8, 0.035, 0.27, 0.015, '#f6f6f3', { roughness: 0.4 })
  kb.position.y = 0.018
  teclado.add(kb)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
      if (r === 3 && c > 2 && c < 9) continue
      const key = rbox(0.05, 0.02, 0.045, 0.008, '#dddcd6', { roughness: 0.5 })
      key.position.set(-0.33 + c * 0.06, 0.042, -0.09 + r * 0.058)
      teclado.add(key)
    }
  }
  const space = rbox(0.34, 0.02, 0.045, 0.008, '#dddcd6', { roughness: 0.5 })
  space.position.set(0, 0.042, -0.09 + 3 * 0.058)
  teclado.add(space)
  root.add(teclado)

  // ---- cadeira giratória preta ----------------------------------------------
  const cadeira = new THREE.Group()
  cadeira.position.set(CHAIR_X, 0, CHAIR_Z)
  cadeira.rotation.y = BODY_YAW

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3
    const arm = rbox(0.36, 0.045, 0.07, 0.02, CHAIR, { roughness: 0.4 })
    arm.position.set(Math.cos(a) * 0.18, GY + 0.09, Math.sin(a) * 0.18)
    arm.rotation.y = -a
    cadeira.add(arm)
    const wheel = sphere(0.045, '#1a1b1f', { roughness: 0.4 })
    wheel.position.set(Math.cos(a) * 0.35, GY + 0.045, Math.sin(a) * 0.35)
    cadeira.add(wheel)
  }
  const hub = cylinder(0.07, 0.08, 0.08, CHAIR, { roughness: 0.4 })
  hub.position.y = GY + 0.1
  cadeira.add(hub)
  const gas = cylinder(0.035, 0.035, SY - 0.12 - GY - 0.1, METAL, { roughness: 0.25, metalness: 0.8 })
  gas.position.y = GY + 0.1 + (SY - 0.12 - GY - 0.1) / 2
  cadeira.add(gas)
  const seat = rbox(0.9, 0.11, 0.78, 0.05, CHAIR_SOFT, { roughness: 0.85 })
  seat.position.set(0, SY - 0.055, 0)
  cadeira.add(seat)
  const back = rbox(0.78, 0.82, 0.1, 0.07, CHAIR_SOFT, { roughness: 0.85 })
  back.position.set(0, SY + 0.55, -0.48)
  back.rotation.x = -0.12
  cadeira.add(back)
  const spine = rbox(0.1, 0.4, 0.05, 0.02, CHAIR, { roughness: 0.4 })
  spine.position.set(0, SY + 0.06, -0.48)
  cadeira.add(spine)
  for (const sx of [-1, 1]) {
    const post = rbox(0.05, 0.22, 0.05, 0.02, CHAIR, { roughness: 0.4 })
    post.position.set(sx * 0.5, SY + 0.08, -0.05)
    cadeira.add(post)
    const rest = rbox(0.09, 0.05, 0.4, 0.022, CHAIR_SOFT, { roughness: 0.8 })
    rest.position.set(sx * 0.5, SY + 0.2, -0.02)
    cadeira.add(rest)
  }
  root.add(cadeira)

  // ---- anta: corpo sentado ---------------------------------------------------
  const anta = new THREE.Group()
  anta.position.set(CHAIR_X, SY, CHAIR_Z)
  anta.rotation.y = BODY_YAW
  anta.scale.setScalar(AS)
  root.add(anta)
  anta.updateMatrixWorld(true)
  const local = (p: THREE.Vector3) => anta.worldToLocal(p.clone())

  const hips = sphere(0.42, TAPIR, { roughness: 0.8 })
  hips.scale.set(1.0, 0.85, 1.05)
  hips.position.set(0, 0.34, 0)
  anta.add(hips)
  const belly = sphere(0.4, TAPIR, { roughness: 0.8 })
  belly.scale.set(0.95, 0.95, 0.9)
  belly.position.set(0, 0.62, 0.1)
  anta.add(belly)
  const chest = sphere(0.36, TAPIR, { roughness: 0.8 })
  chest.scale.set(1.05, 0.9, 0.95)
  chest.position.set(0, 0.84, 0.12)
  anta.add(chest)
  const hump = sphere(0.3, TAPIR, { roughness: 0.8 })
  hump.position.set(0, 0.95, -0.06)
  anta.add(hump)

  // pescoço grosso até a nuca da cabeça (na pose final)
  const neckEnd = local(H.clone().addScaledVector(dir, -0.2))
  anta.add(limb(V(0, 0.98, 0.12), neckEnd, 0.22, TAPIR))

  // patas traseiras: coxas para a frente no assento, canelas penduradas
  for (const sx of [-1, 1]) {
    const thigh = capsule(0.16, 0.26, TAPIR, { roughness: 0.8 })
    thigh.rotation.x = Math.PI / 2
    thigh.position.set(sx * 0.24, 0.15, 0.3)
    anta.add(thigh)
    const shin = capsule(0.12, 0.18, TAPIR_DARK, { roughness: 0.8 })
    shin.rotation.x = 0.2
    shin.position.set(sx * 0.24, -0.06, 0.52)
    anta.add(shin)
    const hoof = cylinder(0.105, 0.125, 0.09, HOOF, { roughness: 0.5 })
    hoof.position.set(sx * 0.24, -0.24, 0.56)
    anta.add(hoof)
    for (let k = -1; k <= 1; k++) {
      const toe = sphere(0.048, HOOF, { roughness: 0.5 })
      toe.position.set(sx * 0.24 + k * 0.06, -0.255, 0.65)
      anta.add(toe)
    }
  }

  // patas dianteiras apoiadas no tampo
  const hoofA = V(GLOBE_X - 0.3, TY + 0.04, GLOBE_Z - 0.35)
  const hoofB = V(CHAIR_X - 0.38, TY + 0.04, -0.42)
  for (const [sx, w] of [[1, hoofA], [-1, hoofB]] as const) {
    const shoulder = V(sx * 0.3, 0.9, 0.28)
    const p = local(w)
    const elbow = shoulder.clone().lerp(p, 0.5).add(V(sx * 0.06, 0.02, -0.04))
    anta.add(limb(shoulder, elbow, 0.12, TAPIR))
    anta.add(limb(elbow, p.clone().add(V(0, 0.05, 0)), 0.1, TAPIR_DARK))
    const hoof = cylinder(0.095, 0.11, 0.07, HOOF, { roughness: 0.5 })
    hoof.position.copy(p)
    anta.add(hoof)
    for (let k = 0; k < 4; k++) {
      const toe = sphere(0.04, HOOF, { roughness: 0.5 })
      const a = -0.6 + k * 0.4
      toe.position.copy(p).add(V(Math.sin(a) * 0.1, -0.01, Math.cos(a) * 0.1))
      anta.add(toe)
    }
  }

  // ---- cabeça (eixo +z = tromba) --------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.copy(H)
  cabeca.lookAt(G)
  cabeca.scale.setScalar(AS)

  const skull = sphere(0.25, TAPIR, { roughness: 0.8 })
  skull.scale.set(0.92, 0.95, 1.2)
  cabeca.add(skull)
  const crown = sphere(0.2, TAPIR, { roughness: 0.8 })
  crown.position.set(0, 0.1, -0.12)
  cabeca.add(crown)
  const cheek = sphere(0.19, TAPIR, { roughness: 0.8 })
  cheek.scale.set(1.05, 0.85, 1.1)
  cheek.position.set(0, -0.09, 0.1)
  cabeca.add(cheek)
  const snout = capsule(0.125, 0.16, TAPIR, { roughness: 0.8 })
  snout.rotation.x = Math.PI / 2
  snout.position.set(0, -0.03, 0.33)
  cabeca.add(snout)
  const trunk = capsule(0.09, 0.2, TAPIR, { roughness: 0.8 })
  trunk.rotation.x = Math.PI / 2
  trunk.position.set(0, -0.03, 0.52)
  cabeca.add(trunk)
  const tip = sphere(0.1, TAPIR_DARK, { roughness: 0.7 })
  tip.scale.set(1.05, 0.95, 0.55)
  tip.position.set(0, -0.03, TIP - 0.055)
  cabeca.add(tip)
  for (const sx of [-1, 1]) {
    const nostril = sphere(0.022, '#1d1e22', { roughness: 0.6 })
    nostril.scale.z = 0.5
    nostril.position.set(sx * 0.035, -0.015, TIP - 0.01)
    cabeca.add(nostril)
  }
  const lip = sphere(0.09, TAPIR_DARK, { roughness: 0.8 })
  lip.scale.set(1.2, 0.6, 1.1)
  lip.position.set(0, -0.18, 0.28)
  cabeca.add(lip)

  for (const sx of [-1, 1]) {
    // olhinhos apertados de quem tenta lembrar: fenda + pálpebras grossas
    const eye = new THREE.Group()
    eye.position.set(sx * 0.2, 0.06, 0.13)
    eye.rotation.y = sx * 0.85
    const white = sphere(0.062, '#ffffff', { roughness: 0.25 })
    white.scale.set(1, 0.45, 0.55)
    eye.add(white)
    const pupil = sphere(0.03, '#151515', { roughness: 0.2 })
    pupil.scale.set(1, 0.6, 0.6)
    pupil.position.z = 0.026
    eye.add(pupil)
    const lidUp = capsule(0.03, 0.09, TAPIR_DARK, { roughness: 0.8 })
    lidUp.rotation.z = Math.PI / 2 + sx * 0.25
    lidUp.position.set(0, 0.034, 0.006)
    eye.add(lidUp)
    const lidDown = capsule(0.026, 0.08, TAPIR_DARK, { roughness: 0.8 })
    lidDown.rotation.z = Math.PI / 2 - sx * 0.15
    lidDown.position.set(0, -0.032, 0.0)
    eye.add(lidDown)
    const brow = capsule(0.02, 0.07, TAPIR_DARK, { roughness: 0.8 })
    brow.rotation.z = Math.PI / 2 + sx * 0.5
    brow.position.set(-sx * 0.01, 0.085, -0.005)
    eye.add(brow)
    cabeca.add(eye)

    // orelhas arredondadas de borda branca
    const ear = new THREE.Group()
    ear.position.set(sx * 0.16, 0.21, -0.12)
    ear.rotation.set(-0.2, sx * 0.72, -sx * 0.38)
    const stalk = sphere(0.07, TAPIR, { roughness: 0.8 })
    stalk.position.y = -0.06
    ear.add(stalk)
    const rim = sphere(0.115, EAR_RIM, { roughness: 0.8 })
    rim.scale.set(0.74, 1.0, 0.34)
    rim.position.y = 0.06
    ear.add(rim)
    const inner = sphere(0.1, TAPIR_DARK, { roughness: 0.8 })
    inner.scale.set(0.66, 0.9, 0.3)
    inner.position.set(0, 0.05, 0.018)
    ear.add(inner)
    cabeca.add(ear)
  }
  root.add(cabeca)

  // ---- globo de neve ---------------------------------------------------------
  const globo = new THREE.Group()
  globo.position.set(GLOBE_X, TY, GLOBE_Z)

  const stand = lathe(
    [[0, 0], [0.27, 0], [0.285, 0.03], [0.26, 0.1], [0.22, 0.14], [0.2, 0.16], [0, 0.16]],
    WOOD,
    { roughness: 0.4 },
  )
  globo.add(stand)
  const band = torus(0.268, 0.012, WOOD_LIGHT, { roughness: 0.4 })
  band.rotation.x = Math.PI / 2
  band.position.y = 0.06
  globo.add(band)
  const pile = sphere(GLOBE_R * 0.92, '#f6f8fb', { roughness: 0.9 })
  pile.scale.set(1, 0.22, 1)
  pile.position.y = GLOBE_CY - GLOBE_R * 0.7
  globo.add(pile)
  const glass = seeThrough(sphere(GLOBE_R, GLASS, { roughness: 0.05, detail: 0 }, 48), 0.2)
  glass.position.y = GLOBE_CY
  globo.add(glass)
  // reflexo pintado no vidro
  const shine = new THREE.Mesh(
    new THREE.TorusGeometry(GLOBE_R * 0.985, 0.01, 8, 32, 0.9),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }),
  )
  shine.position.set(0, GLOBE_CY, 0)
  shine.rotation.set(0.5, -0.5, 0.3)
  globo.add(shine)
  root.add(globo)

  // ---- letrinhas da senha + neve, rodopiando dentro do vidro -----------------
  const letras = new THREE.Group()
  letras.position.set(GLOBE_X, TY + GLOBE_CY, GLOBE_Z)

  const s = glyph('S', RED)
  s.position.set(-0.13, 0.06, 0.07)
  s.rotation.z = 0.28
  letras.add(s)
  const nine = glyph('9', GREEN)
  nine.position.set(0.12, 0.1, 0.03)
  nine.rotation.z = -0.32
  letras.add(nine)
  const hash = glyph('#', BLUE)
  hash.position.set(0.0, -0.08, 0.1)
  hash.rotation.z = 0.2
  letras.add(hash)

  for (let i = 0; i < 18; i++) {
    const r = 0.06 + rand() * 0.2
    const a = rand() * Math.PI * 2
    const b = (rand() - 0.5) * 2.4
    const flake = sphere(0.015 + rand() * 0.01, '#ffffff', { roughness: 0.6, detail: 0 }, 10)
    flake.position.set(Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r * 0.8, Math.sin(a) * Math.cos(b) * r)
    letras.add(flake)
  }
  root.add(letras)

  // ---- três interrogações douradas sobre a cabeça ----------------------------
  const interrogacoes = new THREE.Group()
  const qBase = H.clone()
  for (const [dx, dy, sc, rz] of [[-0.48, 0.55, 0.9, 0.28], [-0.02, 0.8, 1.15, 0.0], [0.42, 0.6, 0.95, -0.24]] as const) {
    const q = question(GOLD)
    q.position.set(qBase.x + dx, qBase.y + dy, qBase.z - 0.05)
    q.rotation.set(0, 0.15, rz)
    q.scale.setScalar(sc)
    interrogacoes.add(q)
  }
  root.add(interrogacoes)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'escritorio', object: base },
    { name: 'mesa', group: 'escritorio', object: mesa },
    { name: 'monitor', group: 'tela', object: monitor },
    { name: 'teclado', group: 'tela', object: teclado },
    { name: 'cadeira', group: 'anta', object: cadeira },
    { name: 'anta', group: 'anta', object: anta },
    { name: 'cabeca', group: 'anta', object: cabeca },
    { name: 'globo', group: 'globo', object: globo },
    { name: 'letras', group: 'globo', object: letras },
    { name: 'interrogacoes', group: 'senha', object: interrogacoes },
  ]

  const grow = (from: number, to = 1) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Segunda de manhã no escritório: o carpete cinza sobe do chão…',
    }),
    seq('mesa-rise', 'mesa', 0.25, 0.9, [riseFrom(0, 1.1)], { ease: 'easeOut' }),

    seq('monitor-liga', 'monitor', 1.6, 0.7, grow(0.01), {
      ease: 'easeOut',
      caption: 'O computador liga e a tela pede a SENHA: um cadeado amarelo tranca tudo.',
    }),
    seq('teclado-rise', 'teclado', 1.8, 0.6, [riseFrom(TY, 0.5)], { ease: 'easeOut' }),

    seq('cadeira-rise', 'cadeira', 3.2, 0.7, [riseFrom(0, 1.2)], {
      ease: 'easeOut',
      caption: 'A anta do escritório senta na cadeira giratória e solta uma risada nervosa: IÁ, RRÁR!',
    }),
    seq('anta-rise', 'anta', 3.35, 0.9, [riseFrom(SY, 1.8)], { ease: 'easeOut' }),
    seq('cabeca-rise', 'cabeca', 3.5, 0.9, [riseFrom(Hb.y, 1.8)], { ease: 'easeOut' }),
    seq('ri-1', 'cabeca', 4.45, 0.14, [ch('position.y', Hb.y, Hb.y + 0.06)], { ease: 'easeOut' }),
    seq('ri-2', 'cabeca', 4.59, 0.14, [ch('position.y', Hb.y + 0.06, Hb.y)], { ease: 'easeIn' }),
    seq('ri-3', 'cabeca', 4.73, 0.14, [ch('position.y', Hb.y, Hb.y + 0.05)], { ease: 'easeOut' }),
    seq('ri-4', 'cabeca', 4.87, 0.16, [ch('position.y', Hb.y + 0.05, Hb.y)], { ease: 'easeIn' }),

    seq('globo-surge', 'globo', 5.4, 0.7, grow(0.01), {
      ease: 'easeOut',
      caption: 'Na sexta ela guardou a senha num lugar seguríssimo: dentro do GLOBO de neve da mesa.',
    }),
    seq('letras-surgem', 'letras', 5.6, 0.6, grow(0.01), { ease: 'easeOut' }),

    seq('cabeca-chega', 'cabeca', 7.0, 0.8, [
      ch('position.x', Hb.x, Hm.x), ch('position.y', Hb.y, Hm.y), ch('position.z', Hb.z, Hm.z),
    ], {
      caption: 'Ela vai no GLÔ…, aperta os olhinhos e fica só no MMM…',
    }),
    seq('cabeca-toca', 'cabeca', 8.3, 0.18, [
      ch('position.x', Hm.x, H.x), ch('position.y', Hm.y, H.y), ch('position.z', Hm.z, H.z),
    ], {
      ease: 'easeIn',
      caption: '…e T! — a tromba bate no vidro, a neve sobe e as letrinhas da senha rodopiam.',
    }),
    seq('globo-tranco', 'globo', 8.48, 0.12, [ch('rotation.z', 0, -0.1)], { ease: 'easeOut' }),
    seq('globo-volta', 'globo', 8.6, 0.5, [ch('rotation.z', -0.1, 0)], { ease: 'easeInOut' }),
    seq('letras-rodopiam', 'letras', 8.5, 1.9, [
      ch('rotation.y', -Math.PI * 3, 0),
      ch('position.y', TY + GLOBE_CY - 0.12, TY + GLOBE_CY),
    ], { ease: 'easeOut' }),

    seq('interrogacoes-surgem', 'interrogacoes', 10.6, 0.7, [ch('position.y', -0.4, 0)], {
      ease: 'easeOut',
      caption: 'De bico, ela LÊ uma senha SEM ORDE(m) nenhuma — S, 9, #… LÊ SEM ORDE-T!',
    }),
    seq('interrogacoes-pulam', 'interrogacoes', 12.0, 0.25, [ch('position.y', 0, 0.07)], {
      ease: 'easeOut',
      caption: 'Jag har glömt lösenordet. — Esqueci a senha.',
    }),
    seq('interrogacoes-assentam', 'interrogacoes', 12.25, 0.4, [ch('position.y', 0.07, 0)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.5, 4.75], target: [0.12, 1.5, -0.35] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-glomt-losenordet',
    contexto: "Trabalho: ligando ou escrevendo pro suporte de TI (IT-support/helpdesk) numa segunda de manhã; também no banco, na escola dos filhos, no wifi da biblioteca. O botão 'Glömt lösenordet?' aparece em praticamente toda tela de login sueca.",
    fraseFonte: 'Esqueci a senha.',
    fraseAlvo: 'Jag har glömt lösenordet.',
    pronuncia: "iá rár GLÖMT LÖÖ-se-nuur-det ('jag' = iá; 'har' com o h soprado e o R brando, que emenda no G — na fala rápida muito sueco engole esse R, mas mantenha: sem ele sobra 'ha'; 'glömt' numa sílaba só, com G e L colados, sem 'gue-' na frente: Ö CURTO — lábios em bico, língua de Ê —, M de lábios fechados e um T seco no fim, que é obrigatório: sem ele vira 'glöm', o imperativo 'esqueça!'; 'lösenordet' com a força no LÖÖ, Ö LONGO, uma segunda força no 'ord' = UUR, U fechado e longo, o rd virando um D de língua dobrada pra trás, e o -det fraquinho, que é o artigo: 'A senha')",
    ponteSonora: "IÁ, RRÁR! GLÔ(bo)... MMM-T! LÊ SEM ORDE(m)-T! (7 sílabas: iá-rrar-GLÖMT-LÖÖ-se-nuur-det; força no GLÖMT e, maior, no LÖÖ, com uma segunda subida no UUR; IÁ, RRÁR = o 'jag har' de sempre, a risada soprada — o MESMO de 'Jag har ett möte' e 'Jag har tappat min plånbok': IÁ com I de IOGA, RRÁR com o h soprado na frente e o R final BRANDO, que já escorrega pro G — sem esse R sobra 'ha'; GLÔ(bo) = o GLOBO de neve cortado antes do -bo, com G e L colados (sem 'gue-'), mas o Ô vai com o truque do ö que o baralho todo usa — os lábios ficam no bico do Ô e a LÍNGUA VAI PRA FRENTE, pro Ê, como no TRÖTT, no MÖÖ-te e no LÖÖ —, e CURTO, bem mais curto que o LÖÖ logo depois; MMM = o 'hmmm' de quem tenta lembrar, de lábios colados: é o M de 'glömt'; T = o toque seco da tromba no vidro do globo — e esse T é OBRIGATÓRIO: sem ele sobra 'glöm', que é 'esqueça!'; GLÔ-MMM-T sai numa sílaba só: GLÖMT; LÊ SEM ORDE(m)-T = o MESMO 'lösenordet' do pombo-correio de 'Vad är lösenordet till wifit?': a senha que se LÊ com as letras SEM ORDEM; a anta também lê de BICO — a tromba dela é um beiço esticado —, então LÊ sai com a língua no Ê e os lábios em bico de Ô, LONGO: LÖÖ, a força da palavra; SEM fecha num N de verdade, sem nasal, que gruda no 'ord': LÖÖ-se-NUUR; ORDE(m) = com a tromba em bico o Ó fecha em U, ÚUR, U FECHADO e LONGO, e o R derrete num D de língua dobrada pra trás; o -DEM vira -DET: sem nasal, E curto e T leve — é o artigo, 'A senha')",
    historia: "Segunda de manhã, a anta senta na frente do computador, a tela pede a senha — e ela solta uma risada nervosa: IÁ, RRÁR! Na sexta ela tinha guardado a senha num lugar seguríssimo: dentro do GLOBO de neve da mesa. Ela pega o GLÔ..., aperta os olhos e fica só no MMM... — e, sem querer, sacode: T!, a tromba bate no vidro, a neve sobe e as letrinhas da senha rodopiam lá dentro. Ela encosta a tromba esticada e LÊ, de bico, uma senha SEM ORDEM nenhuma. Anta que é anta: esqueceu a senha.",
  },
  createScene,
  refine: { organic: ['anta', 'cabeca'] },
}

export default card
