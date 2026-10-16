import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Jag har huvudvärk." — IÁ, RRÁR... RRÜÜ-VUD(u)... VER QUE!
 *
 * No templo em ruínas, a Medusa acorda com a cabeça latejando (IÁ, RRÁR!),
 * geme de bico (RRÜÜ) e descobre o culpado no altar: um boneco de VUDU com a
 * cara dela. Duas cobras do próprio cabelo se esticam até ele com alfinetes
 * na boca. Furiosa, ela arranca os óculos escuros — "quero VER QUE..." — e o
 * olhar amarelo petrifica os pés do boneco com um estalo seco: K!
 *
 * Diorama: piso de mármore rachado, duas colunas quebradas ao fundo, altar
 * cinza à direita com o boneco, Medusa grande à esquerda de óculos na mão
 * erguida, três raios latejando em volta da cabeça. Acento saturado
 * RESERVADO: as cabeças vermelhas dos alfinetes (a dor, värk).
 */

const SOIL = '#8f877b'
const MARBLE = '#e8e2d6'
const MARBLE_DARK = '#d3ccbe'
const CRACK = '#7d766b'
const COLUMN = '#efe9de'
const COLUMN_SHADE = '#d8d1c3'
const STONE = '#8e8a84'
const STONE_LIGHT = '#a7a29a'
const STONE_DARK = '#6f6b66'
const SKIN = '#a9d49b'
const SKIN_DARK = '#6f9e63'
const TUNIC = '#7a4fa8'
const GOLD = '#d3b15c'
const SNAKE = '#4c8f45'
const SNAKE_DARK = '#3a7236'
const SNAKE_EYE = '#c2412f'
const CLOTH = '#d8c29a'
const CLOTH_DOLL = '#9a78c4'
const THREAD = '#5e4630'
const BUTTON = '#1e1c1f'
const BLACK = '#1b1b20'
const STEEL = '#cdd2d8'
const RED = '#e3232f' // acento saturado RESERVADO: cabeças dos alfinetes
const GLOW = '#ffd83a'

const GY = 0.16 // topo do piso de mármore
const MS = 1.3 // escala da Medusa (person de 1.5 → ~1.95)
const MX = -0.62
const MZ = 0.0
const MROT = 0.32 // vira o rosto para o altar
const AX = 0.86
const AZ = 0.22
const ATOP = GY + 0.55 // tampo do altar
const DS = 1.45 // escala do boneco
const DOLL_HEAD_Y = 0.53 // centro da cabeça do boneco (local)
const DOLL_HEAD_R = 0.16
const ARM_REST = 0.5
const ARM_UP = -2.75

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Tubo afunilado por uma curva suave: corpo de cobra. */
function tube(points: THREE.Vector3[], r: number, color: string, taper: (t: number) => number) {
  const curve = new THREE.CatmullRomCurve3(points)
  const segs = 48
  const radial = 14
  const geo = new THREE.TubeGeometry(curve, segs, r, radial, false)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    curve.getPointAt(t, c)
    const k = taper(t)
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c)
      pos.setXYZ(idx, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.45, size: curve.getLength() }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return { mesh, curve }
}

/** Alfinete: bola vermelha + haste de aço apontando para +z local. */
function pin(len: number, ball: number) {
  const g = new THREE.Group()
  const head = sphere(ball, RED, { roughness: 0.25 })
  g.add(head)
  const shaft = cylinder(ball * 0.26, ball * 0.26, len, STEEL, { roughness: 0.25, metalness: 0.8 })
  shaft.rotation.x = Math.PI / 2
  shaft.position.z = len / 2
  g.add(shaft)
  const tip = cone(ball * 0.26, ball * 0.6, STEEL, { roughness: 0.25, metalness: 0.8 })
  tip.rotation.x = Math.PI / 2
  tip.position.z = len + ball * 0.3
  g.add(tip)
  return g
}

/** Cobra: corpo-tubo + cabeça com olhinhos vermelhos; opcional alfinete na boca. */
function snake(points: THREE.Vector3[], r: number, seed: number, withPin = false) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const { mesh, curve } = tube(points, r, SNAKE, (t) => 0.45 + 0.55 * Math.min(1, t * 3) - 0.12 * Math.max(0, t - 0.85) / 0.15)
  g.add(mesh)

  // escamas: manchas escuras ao longo do dorso
  const n = Math.max(3, Math.round(curve.getLength() / (r * 4)))
  for (let i = 1; i < n; i++) {
    const t = (i + rand() * 0.3) / (n + 0.5)
    if (t > 0.88) continue
    const spot = sphere(r * 0.62, SNAKE_DARK, { roughness: 0.5 })
    const p = curve.getPointAt(t)
    spot.position.copy(p)
    spot.position.y += r * (0.45 + 0.55 * Math.min(1, t * 3)) * 0.55
    spot.scale.set(1, 0.55, 1)
    g.add(spot)
  }

  const end = points[points.length - 1]
  const tan = curve.getTangentAt(1)
  const head = new THREE.Group()
  head.position.copy(end)
  const m = new THREE.Matrix4().lookAt(end.clone().add(tan), end, new THREE.Vector3(0, 1, 0))
  head.quaternion.setFromRotationMatrix(m)
  g.add(head)

  const skull = sphere(r * 1.55, SNAKE, { roughness: 0.45 })
  skull.scale.set(1, 0.72, 1.4)
  skull.position.z = r * 0.7
  head.add(skull)
  for (const side of [-1, 1]) {
    const eye = sphere(r * 0.38, SNAKE_EYE, { roughness: 0.2 })
    eye.position.set(side * r * 0.95, r * 0.55, r * 1.2)
    head.add(eye)
    const slit = sphere(r * 0.16, BLACK, { roughness: 0.2 })
    slit.position.set(side * r * 1.22, r * 0.62, r * 1.32)
    head.add(slit)
  }
  if (withPin) {
    const p = pin(0.2, 0.038)
    p.position.set(0, -r * 0.15, r * 2.65)
    head.add(p)
  }
  return g
}

/** Raio em zigue-zague, ponta para -y local. */
function bolt() {
  const g = new THREE.Group()
  const pts: [number, number][] = [[0.0, 0.22], [0.08, 0.08], [-0.03, 0.04], [0.05, -0.1], [-0.05, -0.12], [0.01, -0.24]]
  const opts = { emissive: GLOW, emissiveIntensity: 0.85, roughness: 0.4 }
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const dx = x1 - x0
    const dy = y1 - y0
    const len = Math.hypot(dx, dy)
    const s = rbox(0.055, len + 0.05, 0.04, 0.018, GLOW, opts)
    s.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0)
    s.rotation.z = Math.atan2(-dx, dy)
    g.add(s)
  }
  const [lx, ly] = pts[pts.length - 1]
  const tip = cone(0.035, 0.08, GLOW, opts)
  tip.position.set(lx, ly - 0.03, 0)
  tip.rotation.z = Math.PI
  g.add(tip)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(31)

  // ---- base: piso de mármore rachado ---------------------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.55, 2.65, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)
  const floor = cylinder(2.48, 2.55, 0.06, MARBLE, { roughness: 0.4 })
  floor.position.y = 0.13
  base.add(floor)

  // juntas das lajes: cordas do disco
  for (const z of [-1.6, -0.8, 0, 0.8, 1.6]) {
    const len = 2 * Math.sqrt(Math.max(2.4 * 2.4 - z * z, 0.01))
    const j = rbox(len, 0.012, 0.025, 0.005, MARBLE_DARK, { roughness: 0.6 })
    j.position.set(0, GY + 0.002, z + 0.4)
    base.add(j)
  }
  for (const x of [-1.6, -0.8, 0, 0.8, 1.6]) {
    const len = 2 * Math.sqrt(Math.max(2.4 * 2.4 - x * x, 0.01))
    const j = rbox(0.025, 0.012, len, 0.005, MARBLE_DARK, { roughness: 0.6 })
    j.position.set(x + 0.4, GY + 0.002, 0)
    base.add(j)
  }
  // rachaduras em zigue-zague
  const crack = (x: number, z: number, steps: number, seed: number) => {
    const r2 = rng(seed)
    let px = x
    let pz = z
    let ang = r2() * Math.PI * 2
    for (let i = 0; i < steps; i++) {
      ang += (r2() - 0.5) * 1.6
      const len = 0.16 + r2() * 0.12
      const nx = px + Math.cos(ang) * len
      const nz = pz + Math.sin(ang) * len
      const s = rbox(len + 0.02, 0.014, 0.024, 0.006, CRACK, { roughness: 0.8 })
      s.position.set((px + nx) / 2, GY + 0.004, (pz + nz) / 2)
      s.rotation.y = -ang
      base.add(s)
      px = nx
      pz = nz
    }
  }
  crack(-1.3, 1.2, 6, 3)
  crack(0.2, 1.55, 5, 7)
  crack(1.5, 0.9, 5, 11)
  crack(-0.2, -0.9, 6, 13)

  // entulho e um tambor de coluna tombado
  for (const [x, z, r, s] of [[-1.85, 0.95, 0.13, 5], [1.95, 0.35, 0.11, 9], [-0.4, 1.75, 0.08, 15], [1.35, 1.55, 0.1, 21]] as const) {
    const pedra = rock(r, MARBLE_DARK, s, { roughness: 0.6 })
    pedra.position.set(x, GY + r * 0.5, z)
    pedra.rotation.y = rand() * Math.PI
    base.add(pedra)
  }
  const drum = new THREE.Group()
  drum.position.set(1.75, GY + 0.19, 1.0)
  drum.rotation.set(0, -0.6, Math.PI / 2)
  const drumBody = cylinder(0.19, 0.19, 0.46, COLUMN, { roughness: 0.45 })
  drum.add(drumBody)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const flute = rbox(0.03, 0.47, 0.02, 0.008, COLUMN_SHADE, { roughness: 0.5 })
    flute.position.set(Math.cos(a) * 0.185, 0, Math.sin(a) * 0.185)
    flute.rotation.y = -a
    drum.add(flute)
  }
  base.add(drum)
  root.add(base)

  // ---- duas colunas quebradas ao fundo -------------------------------------
  const colunas = new THREE.Group()
  const column = (x: number, z: number, h: number, seed: number) => {
    const c = new THREE.Group()
    c.position.set(x, GY, z)
    const plinth = rbox(0.56, 0.1, 0.56, 0.02, COLUMN_SHADE, { roughness: 0.5 })
    plinth.position.y = 0.05
    c.add(plinth)
    const foot = lathe([[0, 0], [0.26, 0], [0.27, 0.04], [0.24, 0.08], [0.21, 0.1], [0, 0.1]], COLUMN, { roughness: 0.45 })
    foot.position.y = 0.1
    c.add(foot)
    const shaft = cylinder(0.19, 0.21, h, COLUMN, { roughness: 0.45 })
    shaft.position.y = 0.2 + h / 2
    c.add(shaft)
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      const flute = rbox(0.028, h - 0.02, 0.02, 0.008, COLUMN_SHADE, { roughness: 0.5 })
      flute.position.set(Math.cos(a) * 0.195, 0.2 + h / 2, Math.sin(a) * 0.195)
      flute.rotation.y = -a
      c.add(flute)
    }
    // topo partido: lascas irregulares
    const r2 = rng(seed)
    for (let i = 0; i < 4; i++) {
      const shard = rock(0.1 + r2() * 0.05, COLUMN, seed + i, { roughness: 0.45 })
      const a = r2() * Math.PI * 2
      shard.position.set(Math.cos(a) * 0.09, 0.2 + h + r2() * 0.06, Math.sin(a) * 0.09)
      shard.scale.set(1, 0.9 + r2() * 0.8, 1)
      c.add(shard)
    }
    colunas.add(c)
  }
  column(-1.6, -1.35, 1.75, 40)
  column(1.65, -1.25, 1.05, 50)
  root.add(colunas)

  // ---- altar de pedra cinza --------------------------------------------------
  const altar = new THREE.Group()
  altar.position.set(AX, GY, AZ)
  altar.rotation.y = -0.18
  const aPlinth = rbox(1.0, 0.08, 0.7, 0.025, STONE_DARK, { roughness: 0.8 })
  aPlinth.position.y = 0.04
  altar.add(aPlinth)
  const block = rbox(0.82, 0.42, 0.54, 0.03, STONE, { roughness: 0.85 })
  block.position.y = 0.29
  altar.add(block)
  const slab = rbox(1.0, 0.07, 0.7, 0.025, STONE_LIGHT, { roughness: 0.75 })
  slab.position.y = 0.515
  altar.add(slab)
  // painel entalhado na frente com friso
  const panel = rbox(0.6, 0.24, 0.025, 0.01, STONE_LIGHT, { roughness: 0.8 })
  panel.position.set(0, 0.29, 0.275)
  altar.add(panel)
  for (const py of [0.2, 0.38]) {
    const fr = rbox(0.5, 0.02, 0.02, 0.006, STONE_DARK, { roughness: 0.85 })
    fr.position.set(0, py, 0.29)
    altar.add(fr)
  }
  const aCrack = rbox(0.018, 0.2, 0.02, 0.006, STONE_DARK, { roughness: 0.85 })
  aCrack.position.set(0.33, 0.33, 0.275)
  aCrack.rotation.z = 0.4
  altar.add(aCrack)
  // velas apagadas nos cantos
  for (const [cx, cz] of [[-0.38, -0.2], [0.38, -0.22]] as const) {
    const candle = cylinder(0.035, 0.038, 0.12, '#efe6cf', { roughness: 0.6 })
    candle.position.set(cx, 0.61, cz)
    altar.add(candle)
    const wick = cylinder(0.005, 0.005, 0.025, BLACK)
    wick.position.set(cx, 0.68, cz)
    altar.add(wick)
  }
  root.add(altar)

  // ---- boneco de vudu --------------------------------------------------------
  const boneco = new THREE.Group()
  boneco.position.set(AX, ATOP, AZ)
  boneco.rotation.y = -0.32
  boneco.scale.setScalar(DS)

  for (const side of [-1, 1]) {
    const leg = capsule(0.045, 0.08, CLOTH, { roughness: 0.92 })
    leg.position.set(side * 0.05, 0.085, 0)
    boneco.add(leg)
    const arm = capsule(0.036, 0.1, CLOTH, { roughness: 0.92 })
    arm.position.set(side * 0.16, 0.32, 0)
    arm.rotation.z = -side * 1.2
    boneco.add(arm)
  }
  const dBody = capsule(0.1, 0.08, CLOTH_DOLL, { roughness: 0.92 })
  dBody.position.y = 0.26
  dBody.scale.z = 0.85
  boneco.add(dBody)
  // costura no peito
  for (const sy of [0.2, 0.26, 0.32]) {
    const st = rbox(0.012, 0.035, 0.012, 0.004, THREAD, { roughness: 0.9 })
    st.position.set(0, sy, 0.086)
    boneco.add(st)
  }
  const dHead = sphere(DOLL_HEAD_R, CLOTH, { roughness: 0.92 })
  dHead.position.y = DOLL_HEAD_Y
  boneco.add(dHead)
  // olhos de botão com linha em X
  for (const side of [-1, 1]) {
    const btn = cylinder(0.036, 0.036, 0.016, BUTTON, { roughness: 0.3 }, 20)
    btn.rotation.set(Math.PI / 2 - 0.12, 0, -side * 0.38)
    btn.position.set(side * 0.062, DOLL_HEAD_Y + 0.025, 0.146)
    btn.rotation.order = 'YXZ'
    btn.rotation.y = side * 0.4
    boneco.add(btn)
    for (const s of [-1, 1]) {
      const x = rbox(0.05, 0.008, 0.008, 0.003, CLOTH, { roughness: 0.9 })
      x.position.set(side * 0.066, DOLL_HEAD_Y + 0.025, 0.157)
      x.rotation.set(0, side * 0.4, s * 0.78)
      boneco.add(x)
    }
  }
  // boca costurada
  const mouthLine = rbox(0.11, 0.01, 0.01, 0.004, THREAD, { roughness: 0.9 })
  mouthLine.position.set(0, DOLL_HEAD_Y - 0.06, 0.148)
  mouthLine.rotation.x = -0.35
  boneco.add(mouthLine)
  for (let i = 0; i < 4; i++) {
    const st = rbox(0.008, 0.035, 0.008, 0.003, THREAD, { roughness: 0.9 })
    st.position.set(-0.042 + i * 0.028, DOLL_HEAD_Y - 0.06, 0.15)
    st.rotation.x = -0.35
    boneco.add(st)
  }
  // "cara dela": fios verdes de cobra nas laterais e atrás
  for (const [a, el] of [[1.3, 0.2], [-1.3, 0.2], [2.2, 0.35], [-2.2, 0.35], [Math.PI, 0.25]] as const) {
    const d = V(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el))
    const b = d.clone().multiplyScalar(DOLL_HEAD_R * 0.9).add(V(0, DOLL_HEAD_Y, 0))
    const yarn = capsule(0.02, 0.09, SNAKE, { roughness: 0.9 })
    yarn.position.copy(b.clone().add(d.clone().multiplyScalar(0.05)))
    yarn.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().add(V(0, -0.6, 0)).normalize())
    boneco.add(yarn)
  }
  root.add(boneco)

  // ---- alfinetes espetados no topo da cabeça do boneco ----------------------
  const alfinetes = new THREE.Group()
  boneco.add(alfinetes)
  for (const [dx, dy, dz] of [[0, 1, 0.12], [-0.55, 0.8, 0.22], [0.55, 0.8, 0.18], [-0.3, 0.85, -0.45], [0.35, 0.82, -0.42]] as const) {
    const d = V(dx, dy, dz).normalize()
    const p = pin(0.14, 0.03)
    // pin() aponta para +z: a haste entra na cabeça, a bola fica para fora
    p.position.copy(d.clone().multiplyScalar(DOLL_HEAD_R + 0.13).add(V(0, DOLL_HEAD_Y, 0)))
    p.quaternion.setFromUnitVectors(V(0, 0, 1), d.clone().negate())
    alfinetes.add(p)
  }

  // ---- pés virando pedra ------------------------------------------------------
  const pedra = new THREE.Group()
  boneco.add(pedra)
  for (const side of [-1, 1]) {
    const sLeg = capsule(0.054, 0.07, STONE, { roughness: 0.9 })
    sLeg.position.set(side * 0.05, 0.075, 0)
    pedra.add(sLeg)
  }
  for (const [x, z, r, s] of [[-0.09, 0.05, 0.05, 61], [0.09, 0.04, 0.045, 63], [0.0, -0.07, 0.05, 65], [0.02, 0.08, 0.04, 67]] as const) {
    const chunk = rock(r, STONE_DARK, s, { roughness: 0.9 })
    chunk.position.set(x, r * 0.6, z)
    pedra.add(chunk)
  }
  const crust = cylinder(0.12, 0.14, 0.05, STONE, { roughness: 0.9 })
  crust.position.y = 0.025
  pedra.add(crust)

  // ---- Medusa ----------------------------------------------------------------
  const medusa = person({ body: TUNIC, skin: SKIN, height: 1.5, armAngle: ARM_REST })
  medusa.position.set(MX, GY, MZ)
  medusa.rotation.y = MROT
  medusa.scale.setScalar(MS)

  const belt = torus(0.262, 0.024, GOLD, { roughness: 0.35, metalness: 0.6 })
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.42
  medusa.add(belt)
  const brooch = sphere(0.042, GOLD, { roughness: 0.3, metalness: 0.6 })
  brooch.position.set(0.17, 0.7, 0.17)
  medusa.add(brooch)
  const head = medusa.getObjectByName('head') as THREE.Group
  // tira os olhos padrão: os dela são outros
  for (const c of [...head.children]) if (c.position.z > 0.2) head.remove(c)

  // sobrancelhas franzidas de dor
  for (const side of [-1, 1]) {
    const brow = capsule(0.022, 0.1, SKIN_DARK, { roughness: 0.7 })
    brow.position.set(side * 0.11, 0.135, 0.245)
    brow.rotation.set(-0.3, side * 0.35, Math.PI / 2 + side * 0.4)
    head.add(brow)
  }
  // careta: boca cerrada com dentes à mostra
  const mouth = rbox(0.13, 0.045, 0.03, 0.018, '#4a1f24', { roughness: 0.6 })
  mouth.position.set(0, -0.115, 0.248)
  mouth.rotation.x = -0.25
  head.add(mouth)
  const teeth = rbox(0.11, 0.018, 0.02, 0.006, '#f4f0e4', { roughness: 0.3 })
  teeth.position.set(0, -0.112, 0.262)
  teeth.rotation.x = -0.25
  head.add(teeth)

  // ---- olhos amarelos brilhando (peça: acendem sem os óculos) -------------
  const olhos = new THREE.Group()
  head.add(olhos)
  for (const side of [-1, 1]) {
    const eye = sphere(0.066, GLOW, { emissive: GLOW, emissiveIntensity: 1.3 })
    eye.position.set(side * 0.108, 0.034, 0.236)
    eye.scale.z = 0.62
    olhos.add(eye)
    const slit = rbox(0.016, 0.075, 0.01, 0.005, BLACK, { roughness: 0.3 })
    slit.position.set(side * 0.108, 0.034, 0.278)
    olhos.add(slit)
  }

  // ---- cabelo: touca de escamas + oito cobrinhas ------------------------------
  const cabelo = new THREE.Group()
  head.add(cabelo)
  const capGeo = new THREE.SphereGeometry(0.305, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42)
  const cap = new THREE.Mesh(capGeo, mat(SNAKE_DARK, { roughness: 0.55, size: 0.6 }))
  cap.castShadow = true
  cap.receiveShadow = true
  cap.position.set(0, 0.0, -0.03)
  cap.rotation.x = -0.32
  cabelo.add(cap)
  const HAIR: [number, number][] = [
    [0.15, 0.32], [0.95, 0.62], [-0.95, 0.62], [1.75, 0.95],
    [-1.75, 0.95], [2.55, 0.8], [-2.55, 0.8], [Math.PI, 0.45],
  ]
  for (const [i, [phi, th]] of HAIR.entries()) {
    const d = V(Math.sin(th) * Math.sin(phi), Math.cos(th), Math.sin(th) * Math.cos(phi))
    const side = V(Math.cos(phi), 0, -Math.sin(phi)).multiplyScalar(i % 2 ? 1 : -1)
    const up = V(0, 1, 0)
    const pts = [
      d.clone().multiplyScalar(0.25),
      d.clone().multiplyScalar(0.38).addScaledVector(side, 0.05),
      d.clone().multiplyScalar(0.47).addScaledVector(up, 0.05).addScaledVector(side, -0.03),
      d.clone().multiplyScalar(0.52).addScaledVector(up, 0.12).addScaledVector(side, 0.02),
    ]
    cabelo.add(snake(pts, 0.03, 100 + i))
  }

  // ---- braço esquerdo erguido (segura os óculos no fim) ---------------------
  const bracoL = medusa.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoL, 1.5)
  bracoL.rotation.z = ARM_UP
  const bracoR = medusa.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  bracoR.rotation.set(-0.15, 0, 0.32) // braço solto, levemente aberto

  root.add(medusa)
  root.updateMatrixWorld(true)

  // ---- posições derivadas da pose final ---------------------------------------
  const headC = head.getWorldPosition(new THREE.Vector3())
  const handW = (bracoL.children[0] as THREE.Object3D).getWorldPosition(new THREE.Vector3())
  const faceW = head.localToWorld(V(0, 0.034, 0.3))
  const dollHead = V(AX, ATOP + DOLL_HEAD_Y * DS, AZ)
  const RH = DOLL_HEAD_R * DS

  // ---- óculos escuros: no rosto → arrancados na mão erguida -----------------
  const oculos = new THREE.Group()
  for (const side of [-1, 1]) {
    const lens = rbox(0.13, 0.09, 0.03, 0.035, BLACK, { roughness: 0.12, metalness: 0.3 })
    lens.position.set(side * 0.1, 0, 0)
    oculos.add(lens)
    const shine = rbox(0.03, 0.012, 0.005, 0.004, '#9aa3b5', { roughness: 0.1 })
    shine.position.set(side * 0.1 - 0.03, 0.022, 0.017)
    shine.rotation.z = 0.5
    oculos.add(shine)
    const temple = rbox(0.016, 0.02, 0.3, 0.007, BLACK, { roughness: 0.3 })
    temple.position.set(side * 0.2, 0.012, -0.14)
    temple.rotation.y = side * 0.25
    oculos.add(temple)
  }
  const bridge = rbox(0.06, 0.02, 0.02, 0.008, BLACK, { roughness: 0.3 })
  bridge.position.y = 0.025
  oculos.add(bridge)
  const OC_END = handW.clone().add(V(0.06, 0.17, 0.08))
  const OC_ROT_Y = 0.15
  const OC_ROT_Z = -0.45
  oculos.position.copy(OC_END)
  oculos.rotation.set(0, OC_ROT_Y, OC_ROT_Z)
  oculos.scale.setScalar(MS)
  root.add(oculos)

  // ---- duas cobras compridas do cabelo até o boneco -----------------------
  const startA = head.localToWorld(V(0.13, 0.2, 0.0))
  const startB = head.localToWorld(V(0.24, 0.02, -0.02))

  const fA = V(0.3, -1, -0.05).normalize()
  const tipA = dollHead.clone().add(V(-0.04, RH + 0.03, 0.02))
  const endA = tipA.clone().addScaledVector(fA, -0.36)
  const ptsA = [
    startA,
    startA.clone().add(V(0.12, 0.3, 0.05)),
    startA.clone().lerp(endA, 0.5).add(V(0, 0.32, 0.08)),
    endA.clone().addScaledVector(fA, -0.2),
    endA,
  ]
  const cobraA = new THREE.Group()
  cobraA.position.copy(startA)
  cobraA.add(snake(ptsA.map((p) => p.clone().sub(startA)), 0.05, 7, true))
  root.add(cobraA)

  const fB = V(1, -0.12, -0.12).normalize()
  const tipB = dollHead.clone().add(V(-RH * 0.9, 0.0, 0.06))
  const endB = tipB.clone().addScaledVector(fB, -0.36)
  const ptsB = [
    startB,
    startB.clone().add(V(0.2, -0.02, 0.16)),
    startB.clone().lerp(endB, 0.5).add(V(0, -0.2, 0.22)),
    endB.clone().addScaledVector(fB, -0.2),
    endB,
  ]
  const cobraB = new THREE.Group()
  cobraB.position.copy(startB)
  cobraB.add(snake(ptsB.map((p) => p.clone().sub(startB)), 0.05, 9, true))
  root.add(cobraB)

  // ---- três raios latejando em volta da cabeça --------------------------------
  const raios = new THREE.Group()
  raios.position.copy(headC)
  for (const [ox, oy] of [[-0.36, 0.76], [0.24, 0.82], [0.56, 0.36]] as const) {
    const b = bolt()
    b.scale.setScalar(1.25)
    b.position.set(ox, oy, 0.12)
    const d = V(-ox, -oy, 0).normalize()
    b.rotation.z = Math.atan2(d.x, -d.y)
    raios.add(b)
  }
  root.add(raios)

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'templo', object: base },
    { name: 'colunas', group: 'templo', object: colunas },
    { name: 'medusa', group: 'medusa', object: medusa },
    { name: 'bracoL', group: 'medusa', object: bracoL },
    { name: 'oculos', group: 'medusa', object: oculos },
    { name: 'cabelo', group: 'medusa', object: cabelo },
    { name: 'raios', group: 'dor', object: raios },
    { name: 'altar', group: 'vudu', object: altar },
    { name: 'boneco', group: 'vudu', object: boneco },
    { name: 'cobraA', group: 'cobras', object: cobraA },
    { name: 'cobraB', group: 'cobras', object: cobraB },
    { name: 'alfinetes', group: 'cobras', object: alfinetes },
    { name: 'olhos', group: 'olhar', object: olhos },
    { name: 'pedra', group: 'olhar', object: pedra },
  ]

  const grow = (s: number) => [ch('scale.x', 0.01, s), ch('scale.y', 0.01, s), ch('scale.z', 0.01, s)]
  const RISE = 2.4

  // ---- montagem ----------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Num templo grego em ruínas, sobem o piso de mármore rachado e as colunas quebradas…',
    }),
    seq('colunas-rise', 'colunas', 0.3, 0.9, [riseFrom(0, 2.2)], { ease: 'easeOut' }),

    seq('medusa-rise', 'medusa', 1.6, 0.9, [riseFrom(GY, RISE)], {
      ease: 'easeOut',
      caption: 'A Medusa acorda com a cabeça latejando e solta uma risada nervosa, soprada: IÁ, RRÁR!',
    }),
    seq('bracoL-rise', 'bracoL', 1.6, 0.9, [ch('rotation.z', ARM_REST + 0.4, ARM_REST)], { ease: 'easeOut' }),
    seq('oculos-rise', 'oculos', 1.6, 0.9, [
      ch('position.y', faceW.y - RISE, faceW.y),
    ], { ease: 'easeOut' }),
    seq('cabelo-brota', 'cabelo', 2.3, 0.7, grow(1), { ease: 'easeOut' }),

    seq('raios-acende', 'raios', 3.4, 0.5, grow(1), {
      ease: 'easeOut',
      caption: 'Logo vem um gemido de bico — RRÜÜÜ… — e a cabeça lateja.',
    }),
    seq('raios-pulsa-a', 'raios', 3.9, 0.3, [ch('scale.x', 1, 1.18), ch('scale.y', 1, 1.18)]),
    seq('raios-pulsa-b', 'raios', 4.2, 0.3, [ch('scale.x', 1.18, 1), ch('scale.y', 1.18, 1)]),

    seq('altar-rise', 'altar', 4.8, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'No altar, o culpado: um boneco de VUDU com a cara dela!',
    }),
    seq('boneco-surge', 'boneco', 5.4, 0.7, [...grow(DS), ch('rotation.y', -0.32 + Math.PI * 2, -0.32)], {
      ease: 'easeOut',
    }),

    seq('cobraA-estica', 'cobraA', 6.6, 0.8, grow(1), {
      ease: 'easeOut',
      caption: 'Duas cobras do cabelo dela se esticam até o boneco, cada uma com um alfinete na boca…',
    }),
    seq('cobraB-estica', 'cobraB', 6.8, 0.8, grow(1), { ease: 'easeOut' }),
    seq('alfinetes-espetam', 'alfinetes', 7.9, 0.45, [ch('position.y', 0.35, 0)], {
      ease: 'easeIn',
      caption: '…e espetam a cabeça do boneco: a cada alfinete, a cabeça dela lateja mais forte!',
    }),
    seq('raios-pulsa-c', 'raios', 8.3, 0.3, [ch('scale.x', 1, 1.3), ch('scale.y', 1, 1.3)]),
    seq('raios-pulsa-d', 'raios', 8.6, 0.35, [ch('scale.x', 1.3, 1), ch('scale.y', 1.3, 1)]),

    seq('bracoL-arranca', 'bracoL', 9.3, 0.6, [ch('rotation.z', ARM_REST, ARM_UP)], {
      ease: 'easeOut',
      caption: 'Furiosa, ela arranca os óculos escuros: "Quero VER QUE…"',
    }),
    seq('oculos-arranca', 'oculos', 9.3, 0.6, [
      ch('position.x', faceW.x, OC_END.x),
      ch('position.y', faceW.y, OC_END.y),
      ch('position.z', faceW.z, OC_END.z),
      ch('rotation.y', MROT, OC_ROT_Y),
      ch('rotation.z', 0, OC_ROT_Z),
    ], { ease: 'easeOut' }),
    seq('olhos-acendem', 'olhos', 9.75, 0.3, grow(1), { ease: 'easeOut' }),

    seq('pedra-sobe', 'pedra', 10.3, 0.35, [ch('scale.y', 0.01, 1)], {
      ease: 'easeIn',
      caption: '…e o olhar vira os pés do boneco em pedra, com um estalo seco: K!',
    }),

    seq('raios-final-a', 'raios', 11.4, 0.3, [ch('scale.x', 1, 1.15), ch('scale.y', 1, 1.15)], {
      caption: 'Jag har huvudvärk. — Estou com dor de cabeça.',
    }),
    seq('raios-final-b', 'raios', 11.7, 0.35, [ch('scale.x', 1.15, 1), ch('scale.y', 1.15, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.05, 2.25, 4.75], target: [0.0, 1.3, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-huvudvark',
    contexto:
      "Saúde: no trabalho, em casa ou com amigos — pra recusar um programa, pedir silêncio ou sair mais cedo —, no balcão do apotek ou ao telefone com o 1177. O molde '___värk' serve pra outras dores: tandvärk (dente), ryggvärk (costas); igualmente comum é 'Jag har ont i huvudet'.",
    fraseFonte: 'Estou com dor de cabeça.',
    fraseAlvo: 'Jag har huvudvärk.',
    pronuncia:
      "iá rrar RRÜÜ-vud-värk ('jag' = iá, o G não soa; 'har' com h soprado e R brando — na fala vem fraquinho, mas o R fica: é ele que faz o presente; 'huvudvärk' é UMA palavra só, com a força no HU: h soprado leve, Ü LONGO de bico — lábios de U, língua de I —, o -vud curto e fraco, U de bico puxando pra Ô e D leve; um acento menor no VÄRK, com o Ä bem aberto antes do R, quase A, e o K seco no fim)",
    ponteSonora:
      "IÁ, RRÁR... RRÜÜ-VUD(u)... VER QUE! (5 sílabas: iá-rrar-RRÜÜ-vud-värk; força principal no RRÜÜ e um acento menor no VÉRK; IÁ, RRÁR = o 'jag har' de sempre — o MESMO de 'Jag har ont i magen', 'Jag har missat bussen' e 'Jag har gått vilse': I de IOGA, nunca J chiado, h soprado leve, A longo e R BRANDO no fim, AUDÍVEL — sem ele sobra 'ha', outro verbo; RRÜÜ = o gemido de bico da Medusa, o MESMO sopro LEVE do RRÜR de 'Hur...?', só que SEM o R no fim (com R vira 'hur', como): h soprado de leve, lábios em BICO de U com a língua no I — o Ü — e LONGO; nada do sopro forte e raspado do RRÜÜK de 'sjuk', que é outra palavra; VUD(u) = o boneco de VUDU sem o último U: VUD curto e FRACO, U de bico puxando pra Ô, D leve — a força NÃO vai pro fim como em 'vu-DU': ela já ficou toda no RRÜÜ; RRÜÜ-VUD num fôlego só é 'huvud', cabeça; VER QUE = o 'quero VER QUE...' da Medusa arrancando os óculos, cortado pelo estalo da pedra: VÉR com É ABERTO de 'pé' (antes de R o ä sueco abre, quase A) e R brando, e do QUE só sobra o K seco, sem 'ki' no fim; é o MESMO 'verk' de 'Skatteverket' (VER QUE T(esouro)) e o VÉR de 'hantverkaren' — aqui é 'värk', DOR, a mesma ponte de 'Jag har tandvärk' e 'Har du en värktablett?')",
    historia:
      "No templo em ruínas, Medusa acorda com a cabeça latejando e solta uma gargalhada nervosa, soprada: IÁ, RRÁR! Logo vem um gemido de bico — RRÜÜÜ... — e ela descobre o culpado em cima do altar: um boneco de VUDU com a cara dela, e duas cobras do próprio cabelo dela se esticando até ele pra espetar mais alfinetes na cabeça do boneco. A cada alfinete, a cabeça dela lateja mais forte. Furiosa, ela arranca os óculos escuros — 'Quero VER QUE...' — e o olhar transforma o boneco em pedra com um estalo seco que corta a frase no K. Tarde demais: os alfinetes já estão lá, e a cabeça dói — estou com dor de cabeça.",
  },
  createScene,
}

export default card
