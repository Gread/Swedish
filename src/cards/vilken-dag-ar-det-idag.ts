import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Vilken dag är det idag?" — cem anos depois de espetar o dedo na roca, a
 * princesa acorda num pulo, tonta (VIL… QUEN?), corre até a folhinha da
 * parede do quarto da torre e arranca as folhas uma por uma — cada folha, um
 * dia: DÁÁG! DÁÁG! DÁÁG! — procurando a de hoje: É DÊ… I-DÁÁG?
 *
 * Diorama: alcova de torre (três paredes cor-de-rosa tomadas de roseira) sobre
 * assoalho escuro; cama de dossel à esquerda, roca preta e roxa na frente
 * dela, princesa no centro esticando o braço até a folhinha na parede da
 * direita. O vermelho saturado é RESERVADO às folhas do calendário (o DÁÁG).
 */

const FLOOR = '#4b3424'
const FLOOR_LINE = '#2e1f15'
const SOIL = '#2a2019'
const WALL = '#efb3c0'
const WALL_DARK = '#d48b9c'
const STONE = '#e9cfc8'
const VINE = '#3d6a39'
const VINE_DARK = '#2b4d2b'
const LEAF = '#4f8a45'
const ROSE = '#c42f4f'
const ROSE_DARK = '#8e1d38'
const WOOD = '#a8713f'
const WOOD_DARK = '#74482a'
const QUILT = '#d9668b'
const QUILT_DARK = '#b04d6e'
const LINEN = '#f6efe2'
const CANOPY = '#f7eadf'
const ROCA = '#25212b'
const ROCA_PURPLE = '#6b3fa0'
const STEEL = '#c9ccd4'
const WOOL = '#efe6d2'
const BLOOD = '#b0142a'
const DRESS = '#9fcdee'
const DRESS_DARK = '#6fa6d2'
const SKIN = '#f3d3b9'
const HAIR = '#f0cf6a'
const HAIR_DARK = '#d2a845'
const GOLD = '#e9b53a'
const PAPER = '#f5eedb'
const PAPER_OLD = '#e8d9b0'
const INK = '#2b2530'
const RED = '#e3342b' // acento saturado RESERVADO às folhas do calendário (DÁÁG)

const GY = 0.17 // topo do assoalho
const WH = 2.45 // altura das paredes
const BACK = -1.1 // parede do fundo
const HALF = 1.25 // meia largura da parede do fundo
const SIDE: [number, number] = [2.05, -0.5] // ponta da frente das paredes laterais
const H = 1.7 // altura da princesa
const ROT = 0.55 // princesa em 3/4, virada para a folhinha
const CAL_Y = 1.32 // centro da folhinha

/** Bastão entre dois pontos (barbante, correia da roca, pedal). */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const dir = b.clone().sub(a)
  const m = cylinder(r, r, dir.length(), color, { roughness: 0.6 }, 10)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

interface Panel {
  group: THREE.Group
  len: number
  rotY: number
}

/** Pano de parede de p1 a p2 (planta xz); a face local +z olha para dentro do quarto. */
function wallPanel(x1: number, z1: number, x2: number, z2: number, rand: () => number): Panel {
  const dx = x2 - x1
  const dz = z2 - z1
  const len = Math.hypot(dx, dz)
  const rotY = -Math.atan2(dz, dx)
  const g = new THREE.Group()
  g.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2)
  g.rotation.y = rotY

  const wall = rbox(len, WH, 0.14, 0.03, WALL, { roughness: 0.8 })
  wall.position.y = GY + WH / 2
  g.add(wall)

  const skirting = rbox(len - 0.04, 0.14, 0.04, 0.015, WALL_DARK, { roughness: 0.7 })
  skirting.position.set(0, GY + 0.07, 0.08)
  g.add(skirting)

  const coping = rbox(len + 0.06, 0.1, 0.22, 0.03, STONE, { roughness: 0.8 })
  coping.position.y = GY + WH + 0.03
  g.add(coping)

  // pedras da torre aparecendo sob o reboco rosa
  for (let i = 0; i < 3; i++) {
    const brick = rbox(0.22, 0.1, 0.03, 0.02, WALL_DARK, { roughness: 0.8 })
    brick.position.set((rand() - 0.5) * (len - 0.5), GY + 0.4 + rand() * 1.7, 0.075)
    g.add(brick)
    const brick2 = rbox(0.16, 0.1, 0.03, 0.02, WALL_DARK, { roughness: 0.8 })
    brick2.position.set(brick.position.x + 0.13, brick.position.y - 0.12, 0.075)
    g.add(brick2)
  }
  return { group: g, len, rotY }
}

/** Ramo de roseira colado à parede: caule em segmentos, espinhos alternados e folhas. */
function vine(pts: [number, number][]) {
  const g = new THREE.Group()
  g.position.z = 0.09
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy)
    const stem = capsule(0.024, len, VINE, { roughness: 0.7 })
    stem.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0)
    stem.rotation.z = Math.atan2(-dx, dy)
    g.add(stem)

    const n = Math.max(1, Math.round(len / 0.12))
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n
      const side = (k + i) % 2 === 0 ? 1 : -1
      const px = (-dy / len) * side
      const py = (dx / len) * side
      const thorn = cone(0.015, 0.055, VINE_DARK, { roughness: 0.6 }, 8)
      thorn.position.set(x1 + dx * t + px * 0.04, y1 + dy * t + py * 0.04, 0.005)
      thorn.rotation.z = Math.atan2(-px, py)
      g.add(thorn)
    }

    const side = i % 2 === 0 ? 1 : -1
    const px = (-dy / len) * side
    const py = (dx / len) * side
    const leaf = sphere(0.055, LEAF, { roughness: 0.65 })
    leaf.scale.set(0.55, 1, 0.3)
    leaf.position.set((x1 + x2) / 2 + px * 0.075, (y1 + y2) / 2 + py * 0.075, 0.01)
    leaf.rotation.z = Math.atan2(-px, py)
    g.add(leaf)
  }
  return g
}

/** Rosa vermelha virada para o quarto (+z). */
function rose(r: number) {
  const g = new THREE.Group()
  for (const s of [-1, 1]) {
    const leaf = sphere(r * 0.55, LEAF, { roughness: 0.65 })
    leaf.scale.set(1.5, 0.55, 0.3)
    leaf.position.set(s * r * 1.1, -r * 0.55, -r * 0.2)
    leaf.rotation.z = s * 0.5
    g.add(leaf)
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3
    const petal = sphere(r * 0.58, ROSE, { roughness: 0.5 })
    petal.scale.set(1, 1, 0.55)
    petal.position.set(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, 0)
    g.add(petal)
  }
  const inner = sphere(r * 0.6, ROSE, { roughness: 0.5 })
  inner.position.z = r * 0.25
  g.add(inner)
  const swirl = torus(r * 0.3, r * 0.1, ROSE_DARK, { roughness: 0.5 })
  swirl.position.z = r * 0.72
  g.add(swirl)
  const bud = sphere(r * 0.2, ROSE_DARK, { roughness: 0.5 })
  bud.position.z = r * 0.7
  g.add(bud)
  return g
}

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.02, 0.006, INK, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** D A G — letras de traço grosso. */
function letter(which: 'D' | 'A' | 'G') {
  const g = new THREE.Group()
  const t = 0.03
  if (which === 'D') {
    g.add(stroke(t, 0.16, -0.045, 0))
    g.add(stroke(0.06, t, -0.02, 0.066))
    g.add(stroke(0.06, t, -0.02, -0.066))
    g.add(stroke(t, 0.09, 0.048, 0))
    g.add(stroke(t, 0.056, 0.028, 0.051, 0.99))
    g.add(stroke(t, 0.056, 0.028, -0.051, -0.99))
  } else if (which === 'A') {
    g.add(stroke(t, 0.17, -0.027, 0, -0.32))
    g.add(stroke(t, 0.17, 0.027, 0, 0.32))
    g.add(stroke(0.06, 0.026, 0, -0.028))
  } else {
    g.add(stroke(t, 0.14, -0.046, 0))
    g.add(stroke(0.08, t, -0.004, 0.066))
    g.add(stroke(0.08, t, -0.004, -0.066))
    g.add(stroke(t, 0.07, 0.046, -0.036))
    g.add(stroke(0.05, t, 0.028, -0.006))
    g.add(stroke(t, 0.04, 0.044, 0.052))
  }
  return g
}

/** Folha de calendário destacada: papel, faixa vermelha e um número de tinta. */
function page(rand: () => number, w = 0.36, h = 0.44) {
  const g = new THREE.Group()
  const sheet = rbox(w, h, 0.012, 0.01, rand() > 0.5 ? PAPER : PAPER_OLD, { roughness: 0.75 })
  g.add(sheet)
  const band = rbox(w - 0.02, h * 0.22, 0.016, 0.008, RED, { roughness: 0.55 })
  band.position.set(0, h * 0.37, 0.001)
  g.add(band)
  // número "1" de traço grosso, em tinta
  const num = new THREE.Group()
  num.position.set(0, -0.03, 0.004)
  const stem = rbox(0.045, 0.17, 0.014, 0.01, INK, { roughness: 0.6 })
  num.add(stem)
  const flag = rbox(0.04, 0.07, 0.014, 0.01, INK, { roughness: 0.6 })
  flag.position.set(-0.03, 0.06, 0)
  flag.rotation.z = 0.9
  num.add(flag)
  const foot = rbox(0.1, 0.035, 0.014, 0.01, INK, { roughness: 0.6 })
  foot.position.y = -0.075
  num.add(foot)
  g.add(num)
  const line = rbox(w * 0.55, 0.02, 0.014, 0.006, '#a1958a', { roughness: 0.7 })
  line.position.set(0, -h * 0.4, 0.001)
  g.add(line)
  return g
}

/** Trança loira: contas de cabelo alternadas ao longo de uma curva, com laço na ponta. */
function braid(pts: [number, number, number][]) {
  const g = new THREE.Group()
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
  const len = curve.getLength()
  const n = Math.round(len / 0.055)
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const p = curve.getPointAt(u)
    const tan = curve.getTangentAt(u)
    let side = new THREE.Vector3().crossVectors(tan, up)
    if (side.lengthSq() < 0.01) side = new THREE.Vector3(1, 0, 0)
    side.normalize()
    const r = 0.06 - 0.018 * u
    const bead = sphere(r, i % 2 === 0 ? HAIR : HAIR_DARK, { roughness: 0.6 }, 16)
    bead.position.copy(p).addScaledVector(side, (i % 2 === 0 ? 1 : -1) * r * 0.3)
    bead.quaternion.setFromUnitVectors(up, tan)
    bead.scale.set(1, 1.45, 0.85)
    g.add(bead)
  }
  // pontinha solta + laço rosa
  const end = curve.getPointAt(1)
  const tanEnd = curve.getTangentAt(1)
  const tuft = cone(0.04, 0.12, HAIR, { roughness: 0.6 }, 16)
  tuft.position.copy(end).addScaledVector(tanEnd, 0.07)
  tuft.quaternion.setFromUnitVectors(up, tanEnd)
  g.add(tuft)
  const bowAt = curve.getPointAt(0.96)
  for (const s of [-1, 1]) {
    const loop = sphere(0.045, QUILT, { roughness: 0.55 })
    loop.scale.set(1.3, 0.7, 0.6)
    loop.position.copy(bowAt).add(new THREE.Vector3(s * 0.05, 0.03, 0))
    g.add(loop)
  }
  const knot = sphere(0.03, QUILT_DARK, { roughness: 0.55 })
  knot.position.copy(bowAt).add(new THREE.Vector3(0, 0.03, 0))
  g.add(knot)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- base do diorama: assoalho de tábuas escuras ---------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.38, 2.46, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)
  const floor = cylinder(2.32, 2.38, 0.07, FLOOR, { roughness: 0.75 })
  floor.position.y = 0.135
  base.add(floor)
  for (let x = -2.1; x <= 2.11; x += 0.3) {
    const len = 2 * Math.sqrt(Math.max(2.25 * 2.25 - x * x, 0.01))
    const line = rbox(0.035, 0.02, len, 0.008, FLOOR_LINE, { roughness: 0.85 })
    line.position.set(x, GY + 0.001, 0)
    base.add(line)
  }
  // pregos das tábuas
  for (let i = 0; i < 14; i++) {
    const nail = cylinder(0.018, 0.018, 0.01, '#6e6560', { roughness: 0.4, metalness: 0.6 }, 10)
    const x = -1.95 + Math.floor(rand() * 13) * 0.3 + 0.15
    nail.position.set(x, GY + 0.004, (rand() - 0.3) * 2.6)
    base.add(nail)
  }
  root.add(base)

  // ---- paredes da torre: rosa, tomadas de roseira ----------------------------
  const parede = new THREE.Group()
  const back = wallPanel(-HALF, BACK, HALF, BACK, rand)
  const right = wallPanel(HALF, BACK, SIDE[0], SIDE[1], rand)
  const left = wallPanel(-SIDE[0], SIDE[1], -HALF, BACK, rand)
  parede.add(back.group, right.group, left.group)

  for (const [x, z] of [[-HALF, BACK], [HALF, BACK], [-SIDE[0], SIDE[1]], [SIDE[0], SIDE[1]]] as const) {
    const pillar = cylinder(0.085, 0.095, WH + 0.06, STONE, { roughness: 0.8 })
    pillar.position.set(x, GY + (WH + 0.06) / 2, z)
    parede.add(pillar)
    const cap = sphere(0.1, STONE, { roughness: 0.8 })
    cap.position.set(x, GY + WH + 0.1, z)
    cap.scale.y = 0.6
    parede.add(cap)
  }

  // roseiras: parede do fundo (entre a cama e a princesa), esquerda e direita
  back.group.add(vine([[-0.1, GY], [0.0, 0.55], [-0.14, 0.95], [-0.05, 1.35], [-0.1, 1.72]]))
  back.group.add(vine([[-0.05, 1.35], [-0.32, 1.7], [-0.62, 2.0], [-1.0, 2.2], [-1.2, 2.35]]))
  back.group.add(vine([[-0.1, 1.72], [0.22, 2.02], [0.6, 2.22], [0.95, 2.18], [1.2, 2.32]]))
  left.group.add(vine([[-0.35, GY], [-0.25, 0.6], [-0.38, 1.05], [-0.2, 1.45], [0.05, 1.8], [0.4, 2.1]]))
  right.group.add(vine([[0.45, GY], [0.36, 0.55], [0.42, 1.0], [0.3, 1.55], [0.1, 2.0], [-0.25, 2.2], [-0.48, 2.3]]))

  const roseA = rose(0.12)
  roseA.position.set(-0.1, 1.74, 0.13)
  back.group.add(roseA)
  const roseB = rose(0.12)
  roseB.position.set(-0.2, 1.47, 0.13)
  left.group.add(roseB)
  const roseC = rose(0.12)
  roseC.position.set(0.36, 1.62, 0.13)
  right.group.add(roseC)
  root.add(parede)

  // ---- cama de dossel (cabeceira na parede do fundo) -------------------------
  const BW = 0.78
  const BL = 1.22
  const cama = new THREE.Group()
  cama.position.set(-0.8, GY, BACK + 0.07 + BL / 2 + 0.03)

  for (const s of [-1, 1]) {
    const rail = rbox(0.06, 0.16, BL, 0.025, WOOD, { roughness: 0.6 })
    rail.position.set(s * BW / 2, 0.3, 0)
    cama.add(rail)
  }
  const mattress = rbox(BW - 0.04, 0.16, BL - 0.06, 0.06, LINEN, { roughness: 0.8 })
  mattress.position.y = 0.43
  cama.add(mattress)
  const pillow = rbox(BW - 0.2, 0.13, 0.3, 0.06, '#fffaf2', { roughness: 0.8 })
  pillow.position.set(0, 0.57, -BL / 2 + 0.22)
  pillow.rotation.x = -0.3
  cama.add(pillow)
  // colcha rosa jogada pra trás, amarrotada, com uma ponta caindo pela lateral
  const quilt = rbox(BW + 0.04, 0.07, BL * 0.5, 0.035, QUILT, { roughness: 0.8 })
  quilt.position.set(0, 0.54, 0.28)
  cama.add(quilt)
  for (const [x, z, r] of [[-0.15, 0.02, 0.12], [0.12, -0.06, 0.1], [0.24, 0.12, 0.09]] as const) {
    const lump = sphere(r, QUILT, { roughness: 0.8 })
    lump.scale.set(1.4, 0.55, 1)
    lump.position.set(x, 0.57, z)
    cama.add(lump)
  }
  const drape = rbox(0.05, 0.34, BL * 0.45, 0.025, QUILT, { roughness: 0.8 })
  drape.position.set(BW / 2 + 0.04, 0.4, 0.3)
  drape.rotation.z = 0.12
  cama.add(drape)
  for (const z of [0.12, 0.28, 0.44]) {
    const seam = rbox(BW + 0.05, 0.012, 0.015, 0.005, QUILT_DARK, { roughness: 0.8 })
    seam.position.set(0, 0.578, z)
    cama.add(seam)
  }
  const headboard = rbox(BW, 0.8, 0.07, 0.03, WOOD, { roughness: 0.6 })
  headboard.position.set(0, 0.55, -BL / 2)
  cama.add(headboard)
  const arch = cylinder(BW / 2, BW / 2, 0.07, WOOD, { roughness: 0.6 })
  arch.rotation.x = Math.PI / 2
  arch.scale.z = 0.5
  arch.position.set(0, 0.95, -BL / 2)
  cama.add(arch)
  const footboard = rbox(BW, 0.3, 0.06, 0.025, WOOD, { roughness: 0.6 })
  footboard.position.set(0, 0.3, BL / 2)
  cama.add(footboard)

  const postProfile: [number, number][] = [
    [0.05, 0], [0.055, 0.08], [0.036, 0.13], [0.042, 0.48], [0.058, 0.54], [0.036, 0.6],
    [0.03, 1.55], [0.046, 1.62], [0.03, 1.68], [0.03, 2.0], [0, 2.0],
  ]
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = lathe(postProfile, WOOD_DARK, { roughness: 0.55 })
      post.position.set(sx * (BW / 2 + 0.01), 0, sz * BL / 2)
      cama.add(post)
    }
  }
  const frame = rbox(BW + 0.12, 0.07, BL + 0.12, 0.03, WOOD_DARK, { roughness: 0.6 })
  frame.position.y = 2.0
  cama.add(frame)
  const canopyTop = rbox(BW + 0.18, 0.05, BL + 0.18, 0.025, CANOPY, { roughness: 0.8 })
  canopyTop.position.y = 2.06
  cama.add(canopyTop)
  // sanefa franzida na frente e nas laterais, com bolinhas rosa na barra
  const valFront = rbox(BW + 0.18, 0.2, 0.03, 0.012, CANOPY, { roughness: 0.8 })
  valFront.position.set(0, 1.94, BL / 2 + 0.09)
  cama.add(valFront)
  for (let i = 0; i < 6; i++) {
    const bob = sphere(0.035, QUILT, { roughness: 0.7 })
    bob.position.set(-BW / 2 - 0.02 + i * ((BW + 0.04) / 5), 1.83, BL / 2 + 0.1)
    cama.add(bob)
  }
  for (const s of [-1, 1]) {
    const valSide = rbox(0.03, 0.2, BL + 0.18, 0.012, CANOPY, { roughness: 0.8 })
    valSide.position.set(s * (BW / 2 + 0.09), 1.94, 0)
    cama.add(valSide)
    // cortina inteira atrás e cortina amarrada no pé da cama
    const curtain = rbox(0.04, 1.7, 0.32, 0.02, CANOPY, { roughness: 0.8 })
    curtain.position.set(s * (BW / 2 + 0.06), 1.06, -BL / 2 + 0.18)
    cama.add(curtain)
    const tied = capsule(0.07, 1.25, CANOPY, { roughness: 0.8 })
    tied.position.set(s * (BW / 2 + 0.07), 1.2, BL / 2 - 0.02)
    cama.add(tied)
    const tie = torus(0.075, 0.018, GOLD, { roughness: 0.35, metalness: 0.6 })
    tie.rotation.x = Math.PI / 2
    tie.position.set(s * (BW / 2 + 0.07), 1.0, BL / 2 - 0.02)
    cama.add(tie)
  }
  root.add(cama)

  // ---- roca de fiar preta e roxa (o VIL), na frente da cama ------------------
  const roca = new THREE.Group()
  roca.position.set(-0.78, GY, 0.72)
  roca.rotation.y = 0.3
  roca.scale.setScalar(0.88)
  const table = rbox(0.95, 0.07, 0.26, 0.03, ROCA, { roughness: 0.45 })
  table.position.y = 0.42
  table.rotation.z = 0.06
  roca.add(table)
  for (const sz of [-1, 1]) {
    const leg = cylinder(0.024, 0.03, 0.46, ROCA, { roughness: 0.45 })
    leg.position.set(-0.36, 0.2, sz * 0.1)
    leg.rotation.x = sz * 0.14
    roca.add(leg)
  }
  const legF = cylinder(0.024, 0.03, 0.5, ROCA, { roughness: 0.45 })
  legF.position.set(0.39, 0.22, 0)
  legF.rotation.z = -0.15
  roca.add(legF)
  for (const sz of [-1, 1]) {
    const upright = lathe(
      [[0.03, 0], [0.026, 0.1], [0.036, 0.16], [0.022, 0.24], [0.022, 0.5], [0.03, 0.55], [0, 0.57]],
      ROCA_PURPLE,
      { roughness: 0.4 },
    )
    upright.position.set(-0.15, 0.44, sz * 0.075)
    roca.add(upright)
  }
  // pedal + biela
  const treadle = rbox(0.32, 0.03, 0.2, 0.012, ROCA, { roughness: 0.45 })
  treadle.position.set(-0.32, 0.05, 0)
  treadle.rotation.z = -0.12
  roca.add(treadle)
  roca.add(rod(new THREE.Vector3(-0.26, 0.08, 0.05), new THREE.Vector3(-0.17, 0.78, 0.06), 0.012, ROCA))

  // cabeçote do fuso, na ponta da direita
  const mother = rbox(0.07, 0.07, 0.28, 0.02, ROCA, { roughness: 0.45 })
  mother.position.set(0.32, 0.72, 0)
  roca.add(mother)
  const motherPost = cylinder(0.028, 0.032, 0.28, ROCA_PURPLE, { roughness: 0.4 })
  motherPost.position.set(0.32, 0.58, 0)
  roca.add(motherPost)
  for (const sz of [-1, 1]) {
    const maiden = cylinder(0.02, 0.024, 0.16, ROCA_PURPLE, { roughness: 0.4 })
    maiden.position.set(0.32, 0.83, sz * 0.11)
    roca.add(maiden)
  }
  const whorl = cylinder(0.05, 0.05, 0.04, ROCA_PURPLE, { roughness: 0.4 })
  whorl.rotation.z = Math.PI / 2
  whorl.position.set(0.38, 0.86, 0)
  roca.add(whorl)
  const bobbin = cylinder(0.045, 0.045, 0.12, WOOL, { roughness: 0.9 })
  bobbin.rotation.z = Math.PI / 2
  bobbin.position.set(0.47, 0.86, 0)
  roca.add(bobbin)
  const shaft = cylinder(0.016, 0.016, 0.24, STEEL, { roughness: 0.25, metalness: 0.8 })
  shaft.rotation.z = Math.PI / 2
  shaft.position.set(0.6, 0.86, 0)
  roca.add(shaft)
  // o fuso pontudo e afiado
  const tip = cone(0.022, 0.24, STEEL, { roughness: 0.2, metalness: 0.85 }, 16)
  tip.rotation.z = -Math.PI / 2
  tip.position.set(0.83, 0.86, 0)
  roca.add(tip)
  // roca de lã no alto (o fio que ela fiava)
  const distaff = cylinder(0.015, 0.015, 0.4, ROCA, { roughness: 0.45 })
  distaff.position.set(0.2, 0.62, -0.08)
  distaff.rotation.z = 0.25
  roca.add(distaff)
  const wool = puff(0.08, WOOL, 5, 13, { roughness: 0.9 })
  wool.position.set(0.15, 0.85, -0.08)
  wool.scale.y = 1.3
  roca.add(wool)
  // correia: da roda até o fuso
  roca.add(rod(new THREE.Vector3(-0.15, 1.2, 0), new THREE.Vector3(0.38, 0.905, 0), 0.007, '#8b7a64'))
  roca.add(rod(new THREE.Vector3(-0.15, 0.52, 0), new THREE.Vector3(0.38, 0.815, 0), 0.007, '#8b7a64'))
  root.add(roca)

  // roda grande: gira sozinha
  const roda = new THREE.Group()
  roda.position.set(-0.15, 0.86, 0)
  const rim = torus(0.32, 0.035, ROCA_PURPLE, { roughness: 0.35 })
  roda.add(rim)
  const tire = torus(0.345, 0.014, ROCA, { roughness: 0.4 })
  roda.add(tire)
  for (let i = 0; i < 4; i++) {
    const spoke = rbox(0.024, 0.62, 0.024, 0.01, ROCA, { roughness: 0.45 })
    spoke.rotation.z = (i * Math.PI) / 4
    roda.add(spoke)
  }
  const hub = cylinder(0.055, 0.055, 0.17, ROCA_PURPLE, { roughness: 0.35 })
  hub.rotation.x = Math.PI / 2
  roda.add(hub)
  roca.add(roda)

  // gotinha de sangue na ponta do fuso
  const gota = new THREE.Group()
  gota.position.set(0.93, 0.835, 0)
  const drop = sphere(0.024, BLOOD, { roughness: 0.12 })
  drop.scale.y = 1.3
  gota.add(drop)
  const dropTop = cone(0.016, 0.03, BLOOD, { roughness: 0.12 }, 12)
  dropTop.position.y = 0.032
  gota.add(dropTop)
  roca.add(gota)

  // ---- folhinha de parede (na parede da direita) ------------------------------
  const CAL_S = 0.45 // posição ao longo da parede da direita (0 = canto do fundo)
  const folhinha = new THREE.Group()
  right.group.updateMatrixWorld(true)
  const calPos = right.group.localToWorld(new THREE.Vector3(-right.len / 2 + CAL_S * right.len, 0, 0.13))
  folhinha.position.set(calPos.x, CAL_Y, calPos.z)
  folhinha.rotation.y = right.rotY

  const board = rbox(0.68, 0.9, 0.04, 0.02, WOOD_DARK, { roughness: 0.6 })
  board.position.set(0, 0.02, -0.04)
  folhinha.add(board)
  const pad = rbox(0.58, 0.62, 0.08, 0.015, PAPER_OLD, { roughness: 0.75 })
  pad.position.set(0, -0.05, 0.02)
  folhinha.add(pad)
  const topPage = rbox(0.56, 0.6, 0.008, 0.006, PAPER, { roughness: 0.7 })
  topPage.position.set(0, -0.05, 0.062)
  folhinha.add(topPage)
  const header = rbox(0.56, 0.12, 0.012, 0.006, RED, { roughness: 0.55 })
  header.position.set(0, 0.17, 0.064)
  folhinha.add(header)
  const binding = rbox(0.64, 0.1, 0.11, 0.025, INK, { roughness: 0.45 })
  binding.position.set(0, 0.31, 0.03)
  folhinha.add(binding)
  for (const x of [-0.22, -0.075, 0.075, 0.22]) {
    const staple = rbox(0.05, 0.02, 0.012, 0.006, '#9aa0a8', { roughness: 0.3, metalness: 0.7 })
    staple.position.set(x, 0.31, 0.088)
    folhinha.add(staple)
  }
  // restos rasgados das folhas já arrancadas, presos sob a lombada
  for (let i = 0; i < 7; i++) {
    const scrap = cone(0.03, 0.06, PAPER, { roughness: 0.75 }, 3)
    scrap.position.set(-0.24 + i * 0.08, 0.235, 0.075)
    scrap.rotation.set(0, 0, Math.PI)
    scrap.scale.z = 0.25
    folhinha.add(scrap)
  }
  const glyphs: ['D' | 'A' | 'G', number][] = [['D', -0.16], ['A', 0], ['G', 0.16]]
  for (const [gl, x] of glyphs) {
    const l = letter(gl)
    l.position.set(x, -0.06, 0.072)
    l.scale.setScalar(1.15)
    folhinha.add(l)
  }
  const underline = rbox(0.4, 0.022, 0.012, 0.006, '#a1958a', { roughness: 0.7 })
  underline.position.set(0, -0.26, 0.066)
  folhinha.add(underline)
  // pendurada num prego por um barbante
  const nailHead = sphere(0.025, '#7b7f86', { roughness: 0.3, metalness: 0.7 })
  nailHead.position.set(0, 0.6, -0.02)
  folhinha.add(nailHead)
  for (const s of [-1, 1]) {
    folhinha.add(rod(new THREE.Vector3(s * 0.22, 0.36, -0.03), new THREE.Vector3(0, 0.6, -0.03), 0.008, '#8b7a64'))
  }
  root.add(folhinha)

  // ---- princesa ------------------------------------------------------------
  // a mão alcança o canto de baixo da folhinha: a posição dela sai daí
  root.updateMatrixWorld(true)
  const alvo = folhinha.localToWorld(new THREE.Vector3(-0.31, -0.24, 0.1))
  const PIVOT_Y = H * 0.5124
  const PIVOT_X = H * 0.1955
  const REACH = H * 0.3564 * 0.96
  const dy = alvo.y - (GY + PIVOT_Y)
  const horiz = Math.sqrt(Math.max(REACH * REACH - dy * dy, 0.01))
  const psi = ROT + 0.1
  const shoulderX = alvo.x - horiz * Math.cos(psi)
  const shoulderZ = alvo.z + horiz * Math.sin(psi)
  const PX = shoulderX - PIVOT_X * Math.cos(ROT)
  const PZ = shoulderZ + PIVOT_X * Math.sin(ROT)
  const START_X = PX - 0.42
  const START_Z = PZ + 0.32

  const princesa = new THREE.Group()
  princesa.position.set(PX, GY, PZ)
  princesa.rotation.y = ROT
  root.add(princesa)

  const corpo = person({ body: DRESS, skin: SKIN, height: H, armAngle: 0.3 })
  princesa.add(corpo)

  // saia rodada até o chão
  const skirt = lathe(
    [[0, 0.005], [0.5, 0.005], [0.52, 0.04], [0.47, 0.16], [0.4, 0.3], [0.33, 0.43], [0.305, 0.52], [0, 0.52]],
    DRESS,
    { roughness: 0.75 },
  )
  corpo.add(skirt)
  const hem = torus(0.505, 0.024, DRESS_DARK, { roughness: 0.7 })
  hem.rotation.x = Math.PI / 2
  hem.position.y = 0.035
  corpo.add(hem)
  const hem2 = torus(0.44, 0.016, LINEN, { roughness: 0.7 })
  hem2.rotation.x = Math.PI / 2
  hem2.position.y = 0.2
  corpo.add(hem2)
  const sash = torus(0.31, 0.03, LINEN, { roughness: 0.7 })
  sash.rotation.x = Math.PI / 2
  sash.position.y = 0.52
  corpo.add(sash)
  for (const y of [0.62, 0.71, 0.8]) {
    const button = sphere(0.022, LINEN, { roughness: 0.4 })
    button.position.set(0, y, 0.29)
    corpo.add(button)
  }

  const armL = corpo.getObjectByName('armL') as THREE.Mesh
  const bracoR = corpo.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(armL, H)
  shoulderPivot(bracoR, H)
  for (const arm of [armL, bracoR]) {
    const puffSleeve = sphere(0.13, DRESS, { roughness: 0.75 })
    puffSleeve.scale.set(1, 0.85, 1)
    puffSleeve.position.y = -0.06
    arm.add(puffSleeve)
    const cuff = torus(0.075, 0.018, LINEN, { roughness: 0.7 })
    cuff.rotation.x = Math.PI / 2
    cuff.position.y = -0.47
    arm.add(cuff)
  }
  // braço solto pra trás, do susto da corrida
  armL.rotation.set(0.35, 0, -0.45)

  // braço da folhinha: mira o canto de baixo do bloco
  root.updateMatrixWorld(true)
  const dirBraco = corpo.worldToLocal(alvo.clone()).sub(bracoR.position).normalize()
  const ARM_X = Math.atan2(-dirBraco.z, -dirBraco.y)
  const ARM_Z = Math.asin(dirBraco.x)
  bracoR.rotation.set(ARM_X, 0, ARM_Z)

  // cabeça: cabelo loiro desgrenhado, coroinha torta, cara de espanto
  const head = corpo.getObjectByName('head') as THREE.Group
  const hr = H * 0.19
  const cap = sphere(hr * 1.02, HAIR, { roughness: 0.6 })
  cap.position.set(0, hr * 0.2, -hr * 0.28)
  cap.scale.set(1.04, 0.98, 0.98)
  head.add(cap)
  for (const [x, y, z, r] of [
    [-0.13, 0.22, 0.2, 0.085], [0, 0.25, 0.22, 0.09], [0.13, 0.22, 0.2, 0.085],
    [-0.27, 0.02, 0.0, 0.1], [0.27, 0.02, 0.0, 0.1],
  ] as const) {
    const lock = sphere(r, HAIR, { roughness: 0.6 })
    lock.position.set(x, y, z)
    head.add(lock)
  }
  // fios arrepiados de quem acabou de acordar
  for (const [x, rz, rx] of [[-0.12, 0.7, -0.2], [0.05, -0.2, -0.45], [0.18, -0.8, -0.1]] as const) {
    const tuft = cone(0.035, 0.16, HAIR, { roughness: 0.6 }, 12)
    tuft.position.set(x, 0.36, -0.02)
    tuft.rotation.set(rx, 0, rz)
    head.add(tuft)
  }

  const crown = new THREE.Group()
  crown.position.set(0.07, 0.37, -0.03)
  crown.rotation.set(-0.1, 0, -0.32)
  const band = lathe([[0.12, 0], [0.14, 0], [0.14, 0.06], [0.12, 0.06], [0.12, 0]], GOLD, {
    roughness: 0.3, metalness: 0.75,
  })
  crown.add(band)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const spike = cone(0.03, 0.08, GOLD, { roughness: 0.3, metalness: 0.75 }, 12)
    spike.position.set(Math.sin(a) * 0.13, 0.1, Math.cos(a) * 0.13)
    crown.add(spike)
    const ball = sphere(0.016, GOLD, { roughness: 0.3, metalness: 0.75 })
    ball.position.set(Math.sin(a) * 0.13, 0.145, Math.cos(a) * 0.13)
    crown.add(ball)
  }
  const gem = sphere(0.025, '#5fa8e0', { roughness: 0.15 })
  gem.position.set(0, 0.03, 0.142)
  crown.add(gem)
  head.add(crown)

  // boca aberta num Ó de espanto
  const mouth = sphere(0.068, '#5a2028', { roughness: 0.7 })
  mouth.scale.set(0.8, 1.15, 0.5)
  mouth.position.set(0, -0.14, 0.27)
  head.add(mouth)
  const lip = torus(0.062, 0.018, '#cf7a7a', { roughness: 0.5 })
  lip.scale.set(0.82, 1.15, 1)
  lip.position.set(0, -0.14, 0.285)
  head.add(lip)
  for (const s of [-1, 1]) {
    // sobrancelhas lá no alto (olho arregalado)
    const brow = rbox(0.09, 0.024, 0.02, 0.01, HAIR_DARK, { roughness: 0.6 })
    brow.position.set(s * 0.125, 0.155, 0.268)
    brow.rotation.z = -s * 0.22
    head.add(brow)
    // olheira de quem dormiu cem anos
    const bag = sphere(0.05, '#d9a7c0', { roughness: 0.7 })
    bag.scale.set(1.2, 0.4, 0.35)
    bag.position.set(s * 0.123, -0.04, 0.268)
    head.add(bag)
    const blush = sphere(0.05, '#f2a3a0', { roughness: 0.7 })
    blush.scale.set(1, 0.6, 0.3)
    blush.position.set(s * 0.19, -0.08, 0.235)
    head.add(blush)
  }

  // tranças compridíssimas: uma pela frente do ombro, outra pelas costas,
  // as duas arrastando pelo chão até perto da cama
  const HY = H * 0.52 + H * 0.19 * 0.85
  princesa.add(
    braid([
      [-0.24, HY - 0.06, -0.06], [-0.34, HY - 0.22, 0.08], [-0.36, HY - 0.45, 0.24],
      [-0.37, 0.52, 0.36], [-0.41, 0.26, 0.47], [-0.45, 0.06, 0.6], [-0.62, 0.045, 0.76],
      [-0.9, 0.045, 0.78], [-1.1, 0.045, 0.6], [-1.18, 0.045, 0.4], [-1.32, 0.045, 0.28],
    ]),
  )
  princesa.add(
    braid([
      [0.24, HY - 0.06, -0.08], [0.3, HY - 0.25, -0.26], [0.3, 0.62, -0.38], [0.24, 0.3, -0.5],
      [0.12, 0.06, -0.62], [-0.12, 0.045, -0.74], [-0.45, 0.045, -0.72], [-0.75, 0.045, -0.6],
    ]),
  )

  // ---- folhas arrancadas voando ---------------------------------------------
  const flying = (spots: [number, number, number, number, number, number][]) => {
    const g = new THREE.Group()
    const c = spots.reduce((acc, [x, y, z]) => acc.add(new THREE.Vector3(x, y, z)), new THREE.Vector3())
    c.multiplyScalar(1 / spots.length)
    g.position.copy(c)
    for (const [x, y, z, rx, ry, rz] of spots) {
      const p = page(rand)
      p.position.set(x - c.x, y - c.y, z - c.z)
      p.rotation.set(rx, ry, rz)
      g.add(p)
    }
    return g
  }
  // perto da folhinha (acabaram de sair)
  const folhas1 = flying([
    [alvo.x - 0.32, alvo.y + 0.55, alvo.z + 0.25, 0.25, -0.5, 0.55],
    [alvo.x + 0.42, alvo.y + 0.86, alvo.z + 0.45, -0.2, -0.75, -0.35],
    [alvo.x - 0.52, alvo.y + 0.98, alvo.z + 0.6, 0.35, 0.15, -0.75],
  ])
  root.add(folhas1)
  // mais longe, caindo pelo quarto
  const folhas2 = flying([
    [-0.18, 1.94, 0.1, -0.3, 0.45, 0.85],
    [-0.02, 1.5, 0.55, 0.35, 0.3, -0.35],
    [0.72, 0.42, 0.95, 0.6, -0.25, -0.5],
  ])
  root.add(folhas2)

  // ---- monte de folhas arrancadas no chão -----------------------------------
  const monte = new THREE.Group()
  monte.position.set(PX + 0.95, GY, PZ + 0.45)
  for (let i = 0; i < 8; i++) {
    const p = page(rand)
    const a = rand() * Math.PI * 2
    const rr = 0.05 + rand() * 0.22
    p.position.set(Math.cos(a) * rr, 0.012 + i * 0.013, Math.sin(a) * rr)
    p.rotation.set(-Math.PI / 2 + (rand() - 0.5) * 0.12, 0, rand() * Math.PI * 2)
    p.rotation.order = 'YXZ'
    monte.add(p)
  }
  root.add(monte)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'quarto', object: base },
    { name: 'parede', group: 'quarto', object: parede },
    { name: 'cama', group: 'cama', object: cama },
    { name: 'roca', group: 'roca', object: roca },
    { name: 'roda', group: 'roca', object: roda },
    { name: 'gota', group: 'roca', object: gota },
    { name: 'princesa', group: 'princesa', object: princesa },
    { name: 'bracoR', group: 'princesa', object: bracoR },
    { name: 'folhinha', group: 'folhinha', object: folhinha },
    { name: 'folhas1', group: 'dias', object: folhas1 },
    { name: 'folhas2', group: 'dias', object: folhas2 },
    { name: 'monte', group: 'dias', object: monte },
  ]

  // ---- montagem ------------------------------------------------------------
  const pop = (a = 0.01, b = 1) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const F1 = folhas1.position.clone()
  const F2 = folhas2.position.clone()
  const ARM_HANG_X = 0.05
  const ARM_HANG_Z = 0.22

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Um quarto de torre cor-de-rosa, tomado de roseiras: aqui alguém dormiu CEM ANOS…',
    }),
    seq('parede-rise', 'parede', 0.25, 1.0, [riseFrom(0, 2.8)], { ease: 'easeOut' }),
    seq('cama-rise', 'cama', 1.0, 0.9, [riseFrom(0, 2.3)], { ease: 'easeOut' }),

    seq('roca-rise', 'roca', 2.2, 0.8, [riseFrom(GY, 1.4)], {
      ease: 'easeOut',
      caption: 'Do lado da cama, a roca VIL que a pôs pra dormir ainda gira sozinha…',
    }),
    seq('roda-gira', 'roda', 2.2, 2.0, [ch('rotation.z', 0, -3 * Math.PI)], { ease: 'easeOut' }),
    seq('gota-pinga', 'gota', 3.2, 0.5, [...pop(), ch('position.y', 0.9, 0.835)], {
      ease: 'easeOut',
      caption: '…com a ponta do fuso ainda suja de sangue.',
    }),

    seq('princesa-acorda', 'princesa', 4.4, 0.55, [
      ch('position.y', GY - 1.9, GY + 0.3), ch('position.x', START_X, START_X), ch('position.z', START_Z, START_Z),
      ch('rotation.y', -0.25, -0.25),
    ], {
      ease: 'easeOut',
      caption: 'Cem anos depois, a princesa acorda num pulo, tranças arrastando no chão. Tonta, nem lembra quem é: VIL… QUEN?',
    }),
    seq('braco-solto', 'bracoR', 4.4, 0.55, [
      ch('rotation.x', ARM_HANG_X, ARM_HANG_X), ch('rotation.z', 1.2, ARM_HANG_Z),
    ], { ease: 'easeOut' }),
    seq('princesa-pousa', 'princesa', 4.95, 0.35, [ch('position.y', GY + 0.3, GY)], { ease: 'easeIn' }),

    seq('folhinha-aparece', 'folhinha', 6.1, 0.6, [...pop()], {
      ease: 'easeOut',
      caption: 'Ela corre até a folhinha da parede, parada num dia de cem anos atrás…',
    }),
    seq('princesa-corre', 'princesa', 6.4, 0.8, [
      ch('position.x', START_X, PX), ch('position.z', START_Z, PZ), ch('rotation.y', -0.25, ROT),
    ]),
    seq('braco-estica', 'bracoR', 7.0, 0.45, [
      ch('rotation.x', ARM_HANG_X, ARM_X), ch('rotation.z', ARM_HANG_Z, ARM_Z),
    ], { ease: 'easeOut' }),

    seq('folhas1-voam', 'folhas1', 7.6, 0.9, [
      ...pop(0.05, 1),
      ch('position.x', alvo.x + 0.1, F1.x), ch('position.y', alvo.y + 0.1, F1.y), ch('position.z', alvo.z, F1.z),
      ch('rotation.z', -0.9, 0),
    ], {
      ease: 'easeOut',
      caption: '…e arranca as folhas uma por uma — cada folha, um dia: DÁÁG! DÁÁG! DÁÁG!',
    }),
    seq('braco-puxa1', 'bracoR', 7.6, 0.3, [ch('rotation.z', ARM_Z, ARM_Z - 0.35)], { ease: 'easeOut' }),
    seq('braco-volta1', 'bracoR', 7.9, 0.3, [ch('rotation.z', ARM_Z - 0.35, ARM_Z)]),
    seq('folhas2-voam', 'folhas2', 8.3, 1.1, [
      ...pop(0.05, 1),
      ch('position.x', alvo.x, F2.x), ch('position.y', alvo.y + 0.2, F2.y + 0.08), ch('position.z', alvo.z, F2.z),
      ch('rotation.z', 0.8, 0),
    ], { ease: 'easeOut' }),
    seq('braco-puxa2', 'bracoR', 8.3, 0.3, [ch('rotation.z', ARM_Z, ARM_Z - 0.35)], { ease: 'easeOut' }),
    seq('braco-volta2', 'bracoR', 8.6, 0.3, [ch('rotation.z', ARM_Z - 0.35, ARM_Z)]),
    seq('monte-cresce', 'monte', 9.0, 0.7, [ch('scale.y', 0.05, 1), ch('scale.x', 0.6, 1), ch('scale.z', 0.6, 1)], {
      ease: 'easeOut',
    }),

    seq('roda-gira-mais', 'roda', 9.9, 2.2, [ch('rotation.z', -3 * Math.PI, -6 * Math.PI)], {
      ease: 'easeInOut',
      caption: 'No meio da nevasca de papel, ofegante, ela procura a folha de hoje: É DÊ… I-DÁÁG?',
    }),
    seq('folhas2-plana', 'folhas2', 11.4, 0.8, [ch('position.y', F2.y + 0.08, F2.y)], {
      caption: 'Vilken dag är det idag? — Que dia é hoje?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.1, 3.9], target: [0.22, 1.08, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'vilken-dag-ar-det-idag',
    contexto:
      "Dia a dia: quando você perde a conta dos dias — na volta das férias, depois do feriadão de jul e nyår, depois de uma semana de cama. Pra perguntar a DATA, o sueco diz 'Vilket datum är det idag?' — 'datum' é palavra 'ett', por isso 'vilket' em vez de 'vilken'.",
    fraseFonte: 'Que dia é hoje?',
    fraseAlvo: 'Vilken dag är det idag?',
    pronuncia:
      "VÍL-ken DÁÁG é dê i-DÁÁG? ('vilken' com a força no VIL, I curto e L DE VERDADE, ponta da língua no céu da boca — nunca 'viu' —, K duro e o -ken fraquinho, com N de língua; 'dag' com A LONGO e G duro e seco no fim (na fala rápida o G costuma sumir: 'da'); 'är det' invertido na pergunta: 'é dê', curtinho; 'idag' = i-DÁÁG, com a força no DÁ; as batidas fortes são VIL, DAG e o DAG de 'idag')",
    ponteSonora:
      "VIL-QUEN DÁÁG... É DÊ, I-DÁÁG? (7 sílabas: VÍL-ken-DÁÁG-é-dê-i-DÁÁG; força no VIL, no primeiro DÁG e, maior, no último; VIL = o VIL de sempre, da doninha de 'Vilket spår går tåget från?' e do VILão de 'Vilket väder, va?': I CURTO e L DE VERDADE, a ponta da língua no céu da boca — nunca 'viu'; aqui é a roca VIL que pôs a princesa pra dormir; QUEN = o QUEM? da princesa tonta, mas sem o 'ẽi' nasal do português: K duro, E curto e N batido na língua, fraquinho e GRUDADO no VIL — VÍL-ken, uma palavra só, com a força no VIL; QUEN é só o SOM — o 'quem?' sueco é 'vem', o VÉM do ventríloquo de 'Hallå, vem pratar jag med?'; é o 'vilket' (VIL-QUE-t) com N no lugar do T, e o K logo depois do L é o que separa 'vilken' (qual) de 'vill' (quer); DÁÁG = o MESMO DÁG de 'Ha en bra dag!' (a brasa D'ÁGUA cortada no G) e de todos os 'idag': A LONGO e G duro de 'gato' fechando seco — nunca 'DÁ-gui'; aqui cada folha de calendário arrancada é um dia, um DÁG; É DÊ = o 'är det' da pergunta, de trás pra frente do 'DÊ É' das afirmações — o mesmo par de 'Är det ledigt här?': É aberto e curto, DÊ fechado e sem T, os dois fraquinhos; I-DÁÁG = o 'idag' de sempre, de 'Jag är sjuk idag' e 'Det är akut... idag': I fraquinho e o mesmo DÁÁG com a força toda — é a folha de HOJE, a mesma que despenca do calendário em 'Det är jag som hämtar på förskolan idag')",
    historia:
      "Cem anos depois de espetar o dedo na roca, a princesa acorda num pulo, com as tranças arrastando no chão e o quarto tomado de roseiras. Do lado da cama, a roca VIL que a pôs pra dormir ainda gira sozinha, e a princesa, tonta, nem lembra QUEM é: 'VIL... QUEN?' Corre até a folhinha da parede, parada num dia de cem anos atrás, e começa a arrancar as folhas uma por uma — cada folha, um dia: DÁÁG! DÁÁG! DÁÁG! No meio da nevasca de papel, ofegante, ela procura a folha de hoje: 'É DÊ... I-DÁÁG?' — que dia é hoje?",
  },
  createScene,
}

export default card
