import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Jag är så glad!" — IÁ! É, SÔ... GLÁÁD(iador)!
 *
 * Numa clareira, o pica-pau GLADIADOR (capacete dourado, escudo, gládio)
 * berra IÁ!, bica o tronco-adversário até ele desabar numa chuva de lascas,
 * vira para a câmera de espada erguida e anuncia, bem mineiro, É, SÔ...
 * GLÁD— — e a gargalhada explode do bico e atropela o resto da palavra.
 *
 * Diorama: chão de musgo, duas árvores ao fundo, o toco partido à direita com
 * a metade de cima caída para trás, lascas em volta. O pica-pau é modelado
 * olhando para +x LOCAL: assim rotation.z é a bicada (inclina para a frente)
 * e rotation.y é só o giro — os dois canais não se misturam.
 */

const SOIL = '#4a3826'
const MOSS = '#6d8c47'
const MOSS_DARK = '#5a7a3b'
const GRASS = '#557a36'
const BARK = '#7a5233'
const BARK_DARK = '#5a3b23'
const WOOD_PALE = '#e3c48f'
const WOOD_RING = '#c49a62'
const TREE = '#4b3424'
const LEAF = '#3f6d38'
const LEAF_LIGHT = '#4f7f42'
const NAVY = '#2c3f73'
const NAVY_DARK = '#223260'
const CREAM = '#f1e4c6'
const BEAK = '#eeb54a'
const LEG = '#5c5862'
const CREST = '#c8372d'
const SHIELD_WOOD = '#9c6a3c'
const STEEL = '#c9cfd6'
const LEATHER = '#5a3a22'
const GOLD = '#e8ae1c' // acento saturado RESERVADO ao gladiador: capacete e guarnições
const LAUGH = '#ffd23f'

const GY = 0.16 // topo do musgo

// pica-pau: posição, giro (bicando o tronco / virado para a câmera) e postura
const BIRD: [number, number, number] = [-0.45, GY, 0.4]
const STUMP: [number, number, number] = [0.8, GY, -0.4]
const BIRD_SCALE = 1.12
const YAW_PECK = Math.atan2(-(STUMP[2] - BIRD[2]), STUMP[0] - BIRD[0]) // +x local → tronco
const YAW_FINAL = -0.5
const LEAN_FINAL = 0.1 // peito estufado, jogado para trás de tanto rir
const PECK = -0.28

// tronco-adversário: toco + metade de cima (cai para trás e para a direita)
const STUMP_H = 0.95
const TOP_L = 1.0
const TOP_R = 0.31
const FALL_DIR = new THREE.Vector2(0.96, -0.28).normalize() // (x, z) no chão
const TOP_UP: [number, number, number] = [STUMP[0], GY + STUMP_H + TOP_L / 2 + 0.02, STUMP[2]]
const TOP_DOWN: [number, number, number] = [
  STUMP[0] + FALL_DIR.x * (TOP_L / 2 + 0.36),
  GY + TOP_R - 0.02,
  STUMP[2] + FALL_DIR.y * (TOP_L / 2 + 0.36),
]
const TOP_YAW = Math.atan2(-FALL_DIR.y, FALL_DIR.x)

// asa da espada: em repouso (montagem) e erguida (pose final)
const WING_REST_X = 0.18
const WING_UP_X = 2.72
const WING_REST_Z = 0.1
const WING_UP_Z = 0.32

/** Arco de toro (parte de um anel) no plano xy, centrado em +x. */
function arc(r: number, tube: number, angle: number, color: string, opts: Parameters<typeof mat>[1] = {}) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 40, angle), mat(color, { size: r * 2, ...opts }))
  m.rotation.z = -angle / 2
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Traço dourado de letra, em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.02, 0.006, GOLD, { roughness: 0.28, metalness: 0.85 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** G L A D — letras de traço grosso (retas em caixa, curvas em arco de toro). */
function glyph(which: 'G' | 'L' | 'A' | 'D') {
  const g = new THREE.Group()
  const t = 0.026
  const gm = { roughness: 0.28, metalness: 0.85 }
  if (which === 'G') {
    const bowl = arc(0.054, 0.013, Math.PI * 1.55, GOLD, gm)
    bowl.rotation.z = Math.PI * 1.12 - (Math.PI * 1.55) / 2
    bowl.scale.set(0.85, 1.12, 1)
    g.add(bowl)
    g.add(stroke(0.042, 0.022, 0.024, -0.004))
    g.add(stroke(0.022, 0.05, 0.038, -0.027))
  } else if (which === 'L') {
    g.add(stroke(t, 0.135, -0.022, 0))
    g.add(stroke(0.068, t, 0.01, -0.0545))
  } else if (which === 'A') {
    g.add(stroke(t, 0.142, -0.022, 0, -0.3))
    g.add(stroke(t, 0.142, 0.022, 0, 0.3))
    g.add(stroke(0.05, 0.022, 0, -0.022))
  } else {
    g.add(stroke(t, 0.135, -0.03, 0))
    const bowl = arc(0.056, 0.013, Math.PI, GOLD, gm)
    bowl.position.x = -0.025
    bowl.scale.set(0.95, 1.08, 1)
    g.add(bowl)
  }
  return g
}

/** Tufo de capim: cones finos abrindo em leque. */
function tuft(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  for (let i = 0; i < 6; i++) {
    const h = 0.14 + rand() * 0.12
    const blade = cone(0.022, h, i % 2 ? GRASS : MOSS_DARK, { roughness: 0.9 }, 6)
    const a = (i / 6) * Math.PI * 2 + rand() * 0.5
    blade.position.set(Math.cos(a) * 0.035, h / 2 - 0.01, Math.sin(a) * 0.035)
    blade.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35)
    g.add(blade)
  }
  return g
}

/** Cogumelo de chapéu marrom-claro. */
function mushroom(h: number) {
  const g = new THREE.Group()
  const stem = cylinder(0.028, 0.036, h, '#efe6d2', { roughness: 0.7 })
  stem.position.y = h / 2
  g.add(stem)
  const cap = lathe(
    [[0, -0.01], [0.075, -0.005], [0.09, 0.02], [0.07, 0.05], [0.035, 0.068], [0, 0.072]],
    '#b97a4a',
    { roughness: 0.6 },
  )
  cap.position.y = h - 0.01
  g.add(cap)
  return g
}

/** Margaridinha: miolo amarelo e cinco pétalas. */
function daisy() {
  const g = new THREE.Group()
  const stem = cylinder(0.008, 0.008, 0.1, GRASS, { roughness: 0.8 })
  stem.position.y = 0.05
  g.add(stem)
  const core = sphere(0.022, '#f0c64a', { roughness: 0.6 })
  core.position.y = 0.105
  g.add(core)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const petal = sphere(0.024, '#f6f2e8', { roughness: 0.7 })
    petal.scale.set(1, 0.4, 0.6)
    petal.position.set(Math.cos(a) * 0.036, 0.1, Math.sin(a) * 0.036)
    petal.rotation.y = -a
    g.add(petal)
  }
  return g
}

/** Lasca de madeira: tira clara com uma face de casca. */
function chip(kind: number) {
  const g = new THREE.Group()
  if (kind % 3 === 0) {
    const wedge = cone(0.055, 0.17, WOOD_PALE, { roughness: 0.7 }, 3)
    wedge.rotation.z = Math.PI / 2
    wedge.scale.set(1, 1, 0.55)
    wedge.position.y = 0.024
    g.add(wedge)
  } else {
    const strip = rbox(0.17, 0.028, 0.06, 0.01, WOOD_PALE, { roughness: 0.7 })
    strip.position.y = 0.014
    g.add(strip)
    if (kind % 3 === 1) {
      const bark = rbox(0.15, 0.012, 0.062, 0.005, BARK_DARK, { roughness: 0.9 })
      bark.position.y = 0.032
      g.add(bark)
    }
  }
  return g
}

/** Anel de farpas na ponta quebrada de um tronco (aponta para +y local). */
function splinters(r: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const n = 11
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.3
    const h = 0.08 + rand() * 0.2
    const s = cone(0.055 + rand() * 0.03, h, i % 4 === 0 ? BARK : WOOD_PALE, { roughness: 0.75 }, 4)
    const rr = r * (0.55 + rand() * 0.35)
    s.position.set(Math.cos(a) * rr, h / 2 - 0.01, Math.sin(a) * rr)
    s.rotation.set(Math.sin(a) * 0.25, rand() * Math.PI, -Math.cos(a) * 0.25)
    g.add(s)
  }
  // miolo: farpa alta no centro
  const core = cone(0.07, 0.26, WOOD_PALE, { roughness: 0.75 }, 4)
  core.position.set(r * 0.1, 0.12, -r * 0.15)
  core.rotation.z = 0.15
  g.add(core)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: clareira de musgo ------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const moss = cylinder(2.55, 2.62, 0.05, MOSS, { roughness: 0.95 })
  moss.position.y = GY - 0.025
  base.add(moss)

  // manchas de musgo mais escuro e a terra pisada da briga em volta do toco
  for (const [px, pz, pr, color] of [
    [-1.45, 0.75, 0.55, MOSS_DARK],
    [1.55, 1.05, 0.45, MOSS_DARK],
    [-0.6, -1.55, 0.6, MOSS_DARK],
    [0.55, -0.15, 0.95, '#7a8a4c'],
  ] as const) {
    const patch = cylinder(pr, pr, 0.012, color, { roughness: 0.95 })
    patch.position.set(px, GY + 0.004, pz)
    patch.scale.z = 0.7 + rand() * 0.3
    patch.rotation.y = rand() * Math.PI
    base.add(patch)
  }

  for (const [tx, tz, s] of [
    [-2.05, 0.55, 23], [-1.75, 1.35, 24], [2.15, 0.25, 25], [1.85, 1.25, 26],
    [-0.95, 1.95, 27], [0.6, 2.05, 28], [-2.2, -0.45, 29], [2.25, -0.9, 30],
  ] as const) {
    const t = tuft(s)
    t.position.set(tx, GY, tz)
    base.add(t)
  }

  for (const [rx, rz, rr, s] of [[-2.05, 0.6, 0.17, 3], [1.95, 0.15, 0.14, 5], [-0.35, -2.05, 0.15, 7]] as const) {
    const r = rock(rr, '#7f7b72', s, { roughness: 0.9 })
    r.position.set(rx, GY + rr * 0.35, rz)
    r.rotation.y = rand() * Math.PI
    base.add(r)
  }

  for (const [mx, mz, mh] of [[-1.42, 0.98, 0.13], [-1.29, 1.08, 0.09], [1.62, 0.62, 0.11]] as const) {
    const m = mushroom(mh)
    m.position.set(mx, GY, mz)
    m.rotation.z = (rand() - 0.5) * 0.2
    base.add(m)
  }

  for (const [fx, fz] of [[-0.95, 1.15], [0.35, 1.2], [1.25, 1.05], [-1.75, 0.15], [2.15, -0.35]] as const) {
    const f = daisy()
    f.position.set(fx, GY, fz)
    f.rotation.y = rand() * Math.PI
    base.add(f)
  }
  root.add(base)

  // ---- duas árvores altas ao fundo -------------------------------------------
  const arvores = new THREE.Group()
  for (const [ax, az, h, s] of [[-1.95, -1.4, 2.25, 41], [1.95, -1.7, 2.55, 43]] as const) {
    const tree = new THREE.Group()
    tree.position.set(ax, GY, az)
    const trunk = lathe(
      [[0, 0], [0.34, 0], [0.26, 0.08], [0.21, 0.3], [0.19, h * 0.6], [0.16, h], [0, h]],
      TREE,
      { roughness: 0.9 },
    )
    tree.add(trunk)
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2
      const groove = rbox(0.03, h * 0.7, 0.03, 0.01, '#3b281b', { roughness: 0.95 })
      groove.position.set(Math.cos(a) * 0.195, h * 0.42, Math.sin(a) * 0.195)
      tree.add(groove)
    }
    const branch = capsule(0.05, 0.4, TREE, { roughness: 0.9 })
    branch.position.set(0.18, h * 0.72, 0.05)
    branch.rotation.z = -0.9
    tree.add(branch)
    const crown = puff(0.62, LEAF, 7, s, { roughness: 0.9 })
    crown.position.y = h + 0.25
    tree.add(crown)
    const crown2 = puff(0.4, LEAF_LIGHT, 5, s + 1, { roughness: 0.9 })
    crown2.position.set(0.32, h - 0.1, 0.18)
    tree.add(crown2)
    arvores.add(tree)
  }
  root.add(arvores)

  // ---- toco do tronco-adversário, ponta lascada -------------------------------
  const toco = new THREE.Group()
  toco.position.set(...STUMP)

  const stumpBody = lathe(
    [[0, 0], [0.5, 0], [0.44, 0.05], [0.37, 0.16], [0.345, 0.32], [0.34, STUMP_H], [0, STUMP_H]],
    BARK,
    { roughness: 0.85 },
  )
  toco.add(stumpBody)
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + 0.2
    const groove = rbox(0.035, STUMP_H * 0.62, 0.035, 0.012, BARK_DARK, { roughness: 0.95 })
    groove.position.set(Math.cos(a) * 0.343, STUMP_H * 0.52, Math.sin(a) * 0.343)
    groove.rotation.y = -a
    toco.add(groove)
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.6
    const root_ = capsule(0.075, 0.32, BARK_DARK, { roughness: 0.9 })
    root_.position.set(Math.cos(a) * 0.42, 0.03, Math.sin(a) * 0.42)
    root_.rotation.set(0, -a, Math.PI / 2 - 0.25)
    root_.rotation.order = 'YXZ'
    toco.add(root_)
  }
  const stumpCut = cylinder(0.3, 0.3, 0.02, WOOD_PALE, { roughness: 0.7 })
  stumpCut.position.y = STUMP_H
  toco.add(stumpCut)
  const ring = torus(0.17, 0.008, WOOD_RING, { roughness: 0.7 })
  ring.rotation.x = Math.PI / 2
  ring.position.y = STUMP_H + 0.01
  toco.add(ring)
  const stumpSpl = splinters(0.33, 61)
  stumpSpl.position.y = STUMP_H
  toco.add(stumpSpl)
  root.add(toco)

  // ---- metade de cima: começa em pé sobre o toco, cai para trás ---------------
  const metade = new THREE.Group()
  metade.position.set(...TOP_DOWN)
  metade.rotation.set(0, TOP_YAW, -Math.PI / 2)

  const log = cylinder(TOP_R - 0.03, TOP_R, TOP_L, BARK, { roughness: 0.85 })
  metade.add(log)
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2
    const groove = rbox(0.034, TOP_L * 0.8, 0.034, 0.012, BARK_DARK, { roughness: 0.95 })
    groove.position.set(Math.cos(a) * (TOP_R - 0.012), 0, Math.sin(a) * (TOP_R - 0.012))
    groove.rotation.y = -a
    metade.add(groove)
  }
  // topo serrado (anéis) e galho com folhas
  const topCut = cylinder(TOP_R - 0.05, TOP_R - 0.05, 0.02, WOOD_PALE, { roughness: 0.7 })
  topCut.position.y = TOP_L / 2
  metade.add(topCut)
  for (const rr of [0.08, 0.17]) {
    const tr = torus(rr, 0.008, WOOD_RING, { roughness: 0.7 })
    tr.rotation.x = Math.PI / 2
    tr.position.y = TOP_L / 2 + 0.011
    metade.add(tr)
  }
  const twig = capsule(0.04, 0.3, BARK, { roughness: 0.85 })
  twig.position.set(0, 0.12, TOP_R + 0.1)
  twig.rotation.x = 0.9
  metade.add(twig)
  const twigLeaves = puff(0.13, LEAF_LIGHT, 4, 71, { roughness: 0.9 })
  twigLeaves.position.set(0, 0.28, TOP_R + 0.3)
  metade.add(twigLeaves)
  // base quebrada: farpas apontando para baixo
  const topSpl = splinters(TOP_R, 67)
  topSpl.rotation.x = Math.PI
  topSpl.position.y = -TOP_L / 2
  metade.add(topSpl)
  root.add(metade)

  // ---- lascas espalhadas em volta do toco -------------------------------------
  const lascas = new THREE.Group()
  lascas.position.set(STUMP[0], 0, STUMP[2])
  for (const [i, [lx, lz]] of ([
    [-0.62, 0.3], [-0.78, -0.02], [-0.5, 0.62], [-0.18, 0.66], [0.18, 0.6], [0.5, 0.42],
    [0.66, 0.08], [-0.92, 0.5], [0.02, 0.92], [0.8, 0.62], [-0.42, -0.5], [-0.66, -0.36],
    [0.98, -0.1], [0.38, 0.88],
  ] as const).entries()) {
    const c = chip(i)
    c.position.set(lx, GY, lz)
    c.rotation.y = rand() * Math.PI * 2
    c.rotation.z = (rand() - 0.5) * 0.15
    lascas.add(c)
  }
  root.add(lascas)

  // ---- PICA-PAU (olha para +x local) -------------------------------------------
  const picapau = new THREE.Group()
  picapau.position.set(...BIRD)
  picapau.rotation.set(0, YAW_FINAL, LEAN_FINAL)
  picapau.scale.setScalar(BIRD_SCALE)

  const body = capsule(0.3, 0.4, NAVY, { roughness: 0.8 })
  body.position.set(-0.02, 0.6, 0)
  body.scale.z = 0.95
  picapau.add(body)

  const HC = new THREE.Vector3(0.05, 1.2, 0) // centro da cabeça
  const skull = sphere(0.26, NAVY, { roughness: 0.8 })
  skull.position.copy(HC)
  picapau.add(skull)

  // cauda rígida de pica-pau, apoiada no chão
  const tail = cone(0.14, 0.52, NAVY_DARK, { roughness: 0.8 })
  tail.position.set(-0.3, 0.27, 0)
  tail.rotation.z = Math.PI - 0.47
  tail.scale.z = 0.45
  picapau.add(tail)

  // pernas e pés
  for (const side of [-1, 1]) {
    const leg = capsule(0.04, 0.1, LEG, { roughness: 0.6 })
    leg.position.set(0.04, 0.1, side * 0.12)
    picapau.add(leg)
    for (const splay of [-0.35, 0, 0.35]) {
      const toe = capsule(0.026, 0.1, LEG, { roughness: 0.6 })
      toe.rotation.set(0, splay, -Math.PI / 2)
      toe.position.set(0.04 + Math.cos(splay) * 0.08, 0.03, side * 0.12 - Math.sin(splay) * 0.08)
      picapau.add(toe)
    }
    const back = capsule(0.024, 0.07, LEG, { roughness: 0.6 })
    back.rotation.z = Math.PI / 2
    back.position.set(-0.04, 0.03, side * 0.12)
    picapau.add(back)
  }

  // asa do escudo (lado +z, perto da câmera)
  const shieldWing = capsule(0.085, 0.34, NAVY, { roughness: 0.8 })
  shieldWing.position.set(0.02, 0.66, 0.31)
  shieldWing.rotation.set(-0.15, 0, 0.35)
  shieldWing.scale.x = 0.7
  picapau.add(shieldWing)
  root.add(picapau)

  // ---- peito creme (peça própria: fica nítido sobre a pele e ESTUFA) -----------
  // A plumagem creme não entra na fusão do Blender: a fronteira de cor da pele
  // fundida sai serrilhada; por cima dela, esferas lisas ficam limpas.
  const peito = new THREE.Group()
  peito.position.set(0.13, 0.62, 0)
  picapau.add(peito)

  const chest = sphere(0.28, CREAM, { roughness: 0.85 })
  chest.scale.set(0.78, 1.2, 0.95)
  peito.add(chest)

  const throat = sphere(0.18, CREAM, { roughness: 0.85 })
  throat.position.set(0.04, 0.34, 0)
  throat.scale.set(0.75, 1, 0.95)
  peito.add(throat)

  // ---- rosto: bico escancarado, bochecha creme e olhos espremidos ---------------
  const rosto = new THREE.Group()
  rosto.position.set(0.27, 1.14, 0)
  picapau.add(rosto)
  const bico = new THREE.Group()
  rosto.add(bico)
  const faceLocal = new THREE.Group() // em coordenadas do pica-pau
  faceLocal.position.set(-0.27, -1.14, 0)
  rosto.add(faceLocal)

  const face = sphere(0.17, CREAM, { roughness: 0.85 })
  face.position.set(0.2, 1.12, 0)
  face.scale.set(0.75, 0.85, 1.3)
  faceLocal.add(face)

  // olhos espremidos de tanto rir: mancha creme em volta e arco ∩ preto
  for (const side of [-1, 1]) {
    const dir = new THREE.Vector3(0.5, 0.14, side * 0.86).normalize()
    const facing = Math.atan2(dir.x, dir.z)
    const patch = sphere(0.1, CREAM, { roughness: 0.85 })
    patch.position.copy(HC).addScaledVector(dir, 0.25)
    patch.rotation.y = facing
    patch.scale.set(0.95, 1.15, 0.5)
    faceLocal.add(patch)
    const lid = arc(0.05, 0.019, Math.PI, '#1a1a1a', { roughness: 0.3 })
    lid.position.copy(HC).addScaledVector(dir, 0.305)
    lid.position.y -= 0.022
    lid.rotation.set(0, facing, 0)
    faceLocal.add(lid)
  }

  const upper = new THREE.Group()
  upper.rotation.z = 0.2
  const upperBeak = cone(0.07, 0.52, BEAK, { roughness: 0.4 })
  upperBeak.rotation.z = -Math.PI / 2
  upperBeak.position.x = 0.24
  upper.add(upperBeak)
  bico.add(upper)

  const lower = new THREE.Group()
  lower.rotation.z = -0.38
  const lowerBeak = cone(0.055, 0.42, BEAK, { roughness: 0.4 })
  lowerBeak.rotation.z = -Math.PI / 2
  lowerBeak.position.set(0.19, -0.03, 0)
  lower.add(lowerBeak)
  const tongue = capsule(0.032, 0.1, '#e07a86', { roughness: 0.5 })
  tongue.rotation.z = -Math.PI / 2
  tongue.position.set(0.11, 0.0, 0)
  lower.add(tongue)
  bico.add(lower)

  const mouth = sphere(0.085, '#6b1f24', { roughness: 0.6 })
  mouth.position.set(0.02, -0.03, 0)
  mouth.scale.set(1.2, 0.9, 1)
  bico.add(mouth)

  // ---- capacete de gladiador dourado ------------------------------------------
  const HELMET_TILT = 0.28
  const capacete = new THREE.Group()
  capacete.position.copy(HC)
  capacete.rotation.z = HELMET_TILT
  picapau.add(capacete)

  const dome = lathe(
    [[0.25, 0.07], [0.38, 0.1], [0.395, 0.125], [0.3, 0.14], [0.29, 0.2], [0.27, 0.28], [0.21, 0.35], [0.11, 0.39], [0, 0.4]],
    GOLD,
    { roughness: 0.28, metalness: 0.85 },
  )
  capacete.add(dome)

  const band = torus(0.292, 0.018, '#c98f14', { roughness: 0.3, metalness: 0.85 })
  band.rotation.x = Math.PI / 2
  band.position.y = 0.17
  capacete.add(band)

  // crista que segue o domo da frente para trás
  const ridge = arc(0.36, 0.035, Math.PI * 0.7, GOLD, { roughness: 0.28, metalness: 0.85 })
  ridge.rotation.z = Math.PI / 2 - (Math.PI * 0.7) / 2
  ridge.position.y = 0.03
  capacete.add(ridge)

  // viseira de grade levantada: grade curva que, abaixada, cobriria o rosto;
  // girada para cima (rotation.z) ela fica deitada na testa, rente ao domo
  const visor = new THREE.Group()
  visor.rotation.z = 0.9
  const VR = 0.42
  const GOLD_MAT = { roughness: 0.28, metalness: 0.85 }
  for (const [vy, tube] of [[-0.12, 0.02], [0, 0.014], [0.12, 0.02]] as const) {
    const rib = arc(Math.sqrt(VR * VR - vy * vy), tube, 1.15, GOLD, GOLD_MAT)
    rib.rotation.x = Math.PI / 2
    rib.position.y = vy
    visor.add(rib)
  }
  for (const phi of [-0.56, -0.28, 0, 0.28, 0.56]) {
    const edge = Math.abs(phi) > 0.5
    const bar = rbox(edge ? 0.03 : 0.018, 0.26, edge ? 0.03 : 0.018, 0.008, GOLD, GOLD_MAT)
    bar.position.set(Math.cos(phi) * VR, 0, Math.sin(phi) * VR)
    bar.rotation.y = -phi
    visor.add(bar)
  }
  capacete.add(visor)

  // ---- topete vermelho espetado pelo alto do capacete (penacho) ----------------
  const topete = new THREE.Group()
  topete.position.copy(HC)
  topete.rotation.z = HELMET_TILT
  picapau.add(topete)
  for (const [theta, h] of [[-0.12, 0.22], [0.22, 0.3], [0.56, 0.33], [0.9, 0.29], [1.22, 0.21]] as const) {
    const plume = cone(0.065, h, CREST, { roughness: 0.75 })
    const dist = 0.37 + h / 2
    plume.position.set(-Math.sin(theta) * dist, 0.03 + Math.cos(theta) * dist, 0)
    plume.rotation.z = theta
    plume.scale.z = 0.55
    topete.add(plume)
  }

  // ---- escudo redondo de madeira com borda dourada ----------------------------
  const escudo = new THREE.Group()
  escudo.position.set(-0.02, 0.5, 0.45)
  escudo.rotation.y = 0.4
  picapau.add(escudo)

  const disc = cylinder(0.27, 0.27, 0.05, SHIELD_WOOD, { roughness: 0.7 }, 40)
  disc.rotation.x = Math.PI / 2
  escudo.add(disc)
  for (const py of [-0.15, 0.15]) {
    const plank = rbox(0.4, 0.012, 0.01, 0.004, '#7a5130', { roughness: 0.8 })
    plank.position.set(0, py, 0.026)
    escudo.add(plank)
  }
  const rim = torus(0.27, 0.026, GOLD, GOLD_MAT)
  escudo.add(rim)
  for (const a of [0.8, 1.57, 2.34, 3.94, 4.71, 5.48]) {
    const rivet = sphere(0.016, GOLD, GOLD_MAT)
    rivet.position.set(Math.cos(a) * 0.225, Math.sin(a) * 0.225, 0.028)
    escudo.add(rivet)
  }
  // GLAD — a palavra que a gargalhada corta, em letras de traço grosso
  for (const [g, gx] of [['G', -0.15], ['L', -0.055], ['A', 0.04], ['D', 0.135]] as const) {
    const l = glyph(g)
    l.position.set(gx, 0, 0.03)
    escudo.add(l)
  }

  // ---- asa da espada (lado -z): pivô no ombro ----------------------------------
  const asaEspada = new THREE.Group()
  asaEspada.position.set(0.0, 0.9, -0.26)
  asaEspada.rotation.set(WING_UP_X, 0, WING_UP_Z)
  picapau.add(asaEspada)

  const wing = capsule(0.085, 0.34, NAVY, { roughness: 0.8 })
  wing.position.y = -0.26
  wing.scale.x = 0.7
  asaEspada.add(wing)
  for (const fz of [-0.035, 0.035]) {
    const tip = capsule(0.035, 0.07, NAVY_DARK, { roughness: 0.8 })
    tip.position.set(0.03, -0.5, fz)
    asaEspada.add(tip)
  }

  // ---- gládio: espada curta prateada --------------------------------------------
  const espada = new THREE.Group()
  espada.position.set(0, -0.5, 0)
  asaEspada.add(espada)
  const gladio = new THREE.Group()
  gladio.scale.setScalar(1.2)
  espada.add(gladio)

  const grip = cylinder(0.026, 0.026, 0.15, LEATHER, { roughness: 0.8 })
  gladio.add(grip)
  const pommel = sphere(0.042, GOLD, { roughness: 0.28, metalness: 0.85 })
  pommel.position.y = 0.09
  gladio.add(pommel)
  const guard = rbox(0.2, 0.04, 0.06, 0.015, GOLD, { roughness: 0.28, metalness: 0.85 })
  guard.position.y = -0.09
  gladio.add(guard)
  const blade = rbox(0.095, 0.36, 0.022, 0.008, STEEL, { roughness: 0.2, metalness: 0.9 })
  blade.position.y = -0.29
  gladio.add(blade)
  const point = cone(0.0475, 0.12, STEEL, { roughness: 0.2, metalness: 0.9 })
  point.rotation.z = Math.PI
  point.scale.z = 0.23
  point.position.y = -0.53
  gladio.add(point)
  const fuller = rbox(0.016, 0.3, 0.026, 0.004, '#9aa2ab', { roughness: 0.25, metalness: 0.9 })
  fuller.position.y = -0.27
  gladio.add(fuller)

  // ---- a gargalhada: três arcos de luz saindo do bico ---------------------------
  const risada = new THREE.Group()
  risada.position.set(0.42, 1.17, 0)
  risada.rotation.z = 0.12
  picapau.add(risada)
  for (const [r, tube, span] of [[0.44, 0.025, 0.9], [0.6, 0.024, 0.85], [0.76, 0.023, 0.8]] as const) {
    const a = arc(r, tube, span, LAUGH, { emissive: '#ffb514', emissiveIntensity: 0.9, roughness: 0.4 })
    a.castShadow = false
    risada.add(a)
  }

  // ---- peças ---------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'clareira', object: base },
    { name: 'arvores', group: 'clareira', object: arvores },
    { name: 'toco', group: 'tronco', object: toco },
    { name: 'metade', group: 'tronco', object: metade },
    { name: 'picapau', group: 'picapau', object: picapau },
    { name: 'peito', group: 'picapau', object: peito },
    { name: 'rosto', group: 'picapau', object: rosto },
    { name: 'capacete', group: 'gladiador', object: capacete },
    { name: 'topete', group: 'gladiador', object: topete },
    { name: 'escudo', group: 'gladiador', object: escudo },
    { name: 'asaEspada', group: 'picapau', object: asaEspada },
    { name: 'espada', group: 'gladiador', object: espada },
    { name: 'lascas', group: 'tec', object: lascas },
    { name: 'risada', group: 'risada', object: risada },
  ]

  const grow = (k0 = 0.01) => [ch('scale.x', k0, 1), ch('scale.y', k0, 1), ch('scale.z', k0, 1)]
  const HELMET_Y = HC.y

  // ---- montagem ------------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Numa clareira da mata, brota o chão de musgo…',
    }),
    seq('arvores-rise', 'arvores', 0.25, 0.9, [riseFrom(0, 3.4)], { ease: 'easeOut' }),

    seq('toco-rise', 'toco', 1.5, 1.0, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: '…e se ergue o adversário mais duro da floresta: um tronco de madeira maciça.',
    }),
    seq('metade-rise', 'metade', 1.5, 1.0, [
      riseFrom(TOP_UP[1], 2.4),
      ch('position.x', TOP_UP[0], TOP_UP[0]),
      ch('position.z', TOP_UP[2], TOP_UP[2]),
      ch('rotation.z', 0, 0),
    ], { ease: 'easeOut' }),

    seq('picapau-rise', 'picapau', 3.0, 0.8, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'Entra o desafiante: um pica-pau de capacete de GLADIADOR, escudo e espadinha.',
    }),
    seq('asa-repousa', 'asaEspada', 3.0, 0.8, [
      ch('rotation.x', 0.7, WING_REST_X), ch('rotation.z', WING_REST_Z, WING_REST_Z),
    ], { ease: 'easeOut' }),
    seq('peito-surge', 'peito', 3.0, 0.8, grow(0.88).map((c) => ({ ...c, to: 0.88 })), { ease: 'easeOut' }),
    seq('rosto-cresce', 'rosto', 3.3, 0.5, grow(0.2), { ease: 'easeOut' }),
    seq('capacete-desce', 'capacete', 3.6, 0.6, [
      ch('position.y', HELMET_Y + 0.9, HELMET_Y), ...grow(0.6),
    ], { ease: 'easeIn' }),
    seq('topete-espeta', 'topete', 4.15, 0.5, grow(0.3), { ease: 'easeOut' }),
    seq('escudo-surge', 'escudo', 4.3, 0.5, grow(), { ease: 'easeOut' }),
    seq('espada-surge', 'espada', 4.45, 0.5, grow(), { ease: 'easeOut' }),

    // IÁ! e a bicada: tec-tec-tec
    seq('picapau-arma', 'picapau', 5.2, 0.35, [ch('rotation.z', 0, 0.22)], {
      ease: 'easeOut',
      caption: 'Ele berra IÁ! e bica sem dó: tec-tec-tec…',
    }),
    seq('bica-1', 'picapau', 5.55, 0.16, [ch('rotation.z', 0.22, PECK)], { ease: 'easeIn' }),
    seq('volta-1', 'picapau', 5.71, 0.16, [ch('rotation.z', PECK, 0)], { ease: 'easeOut' }),
    seq('bica-2', 'picapau', 5.87, 0.14, [ch('rotation.z', 0, PECK)], { ease: 'easeIn' }),
    seq('volta-2', 'picapau', 6.01, 0.14, [ch('rotation.z', PECK, 0)], { ease: 'easeOut' }),
    seq('bica-3', 'picapau', 6.15, 0.14, [ch('rotation.z', 0, PECK)], { ease: 'easeIn' }),
    seq('volta-3', 'picapau', 6.29, 0.2, [ch('rotation.z', PECK, 0)], { ease: 'easeOut' }),
    seq('metade-treme', 'metade', 5.71, 0.14, [ch('rotation.x', 0, 0.06)], { ease: 'easeOut' }),
    seq('metade-firma', 'metade', 5.85, 0.5, [ch('rotation.x', 0.06, 0)]),

    // o tronco desaba numa chuva de lascas
    seq('metade-cai', 'metade', 6.55, 0.85, [
      ch('position.x', TOP_UP[0], TOP_DOWN[0]),
      ch('position.y', TOP_UP[1], TOP_DOWN[1] + 0.12),
      ch('position.z', TOP_UP[2], TOP_DOWN[2]),
      ch('rotation.z', 0, -Math.PI / 2),
    ], {
      ease: 'easeIn',
      caption: '…até o tronco desabar numa chuva de lascas!',
    }),
    seq('metade-quica', 'metade', 7.4, 0.3, [ch('position.y', TOP_DOWN[1] + 0.12, TOP_DOWN[1])], { ease: 'easeOut' }),
    seq('lascas-voam', 'lascas', 7.0, 0.7, [
      ch('scale.x', 0.15, 1), ch('scale.z', 0.15, 1),
    ], { ease: 'easeOut' }),
    seq('lascas-caem', 'lascas', 7.0, 0.7, [ch('position.y', 1.0, 0)], { ease: 'easeIn' }),

    // vira para a câmera, ergue a espada, estufa o peito: É, SÔ... GLÁÁD—
    seq('picapau-vira', 'picapau', 8.1, 0.7, [
      ch('rotation.y', YAW_PECK, YAW_FINAL),
      ch('rotation.z', 0, LEAN_FINAL),
    ], {
      ease: 'easeInOut',
      caption: 'Ergue a espadinha, estufa o peito e anuncia, bem mineiro: É, SÔ… GLÁÁD—!',
    }),
    seq('peito-estufa', 'peito', 8.2, 0.45, [
      ch('scale.x', 0.88, 1.1), ch('scale.y', 0.88, 1.1), ch('scale.z', 0.88, 1.1),
    ], { ease: 'easeOut' }),
    seq('peito-assenta', 'peito', 8.65, 0.35, [
      ch('scale.x', 1.1, 1), ch('scale.y', 1.1, 1), ch('scale.z', 1.1, 1),
    ], { ease: 'easeInOut' }),
    seq('asa-ergue', 'asaEspada', 8.35, 0.6, [
      ch('rotation.x', WING_REST_X, WING_UP_X), ch('rotation.z', WING_REST_Z, WING_UP_Z),
    ], { ease: 'easeOut' }),

    // a gargalhada atropela o resto da palavra
    seq('risada-explode', 'risada', 9.8, 0.5, grow(), {
      ease: 'easeOut',
      caption: '…mas a gargalhada explode e atropela o resto: tão feliz que nem termina o "gladiador"!',
    }),
    seq('picapau-ri', 'picapau', 9.8, 0.2, [ch('rotation.z', LEAN_FINAL, LEAN_FINAL + 0.09)], { ease: 'easeOut' }),
    seq('picapau-ri-volta', 'picapau', 10.0, 0.35, [ch('rotation.z', LEAN_FINAL + 0.09, LEAN_FINAL)], { ease: 'easeInOut' }),
    seq('topete-ri', 'topete', 9.8, 0.25, [ch('scale.y', 1, 1.15)], { ease: 'easeOut' }),
    seq('topete-assenta', 'topete', 10.05, 0.3, [ch('scale.y', 1.15, 1)], { ease: 'easeIn' }),
    seq('risada-pulsa', 'risada', 11.2, 0.3, [ch('scale.x', 1, 1.12), ch('scale.y', 1, 1.12)], {
      ease: 'easeOut',
      caption: 'Jag är så glad! — Estou tão feliz!',
    }),
    seq('risada-volta', 'risada', 11.5, 0.35, [ch('scale.x', 1.12, 1), ch('scale.y', 1.12, 1)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.1, 1.95, 4.4], target: [-0.05, 1.1, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-sa-glad',
    contexto:
      "Boa notícia: o visto saiu, a vaga na förskola, a família vem visitar; no reencontro no aeroporto, abrindo um presente. Com os filhos: 'Jag är så glad för din skull!' (fico tão feliz por você).",
    fraseFonte: 'Estou tão feliz!',
    fraseAlvo: 'Jag är så glad!',
    pronuncia:
      "iá é SÔ GLÁÁD! ('jag' = iá; 'är' = é, curtinho; 'så' com Ô FECHADO e longo, o mesmo de 'Tack så mycket' — aqui ele também leva força, porque é o 'tão'; 'glad' numa sílaba só: G duro de 'gato', L de verdade colado no G, A LONGO e bem aberto e D leve no fim — nunca 'GLÁ-dji' nem o 'gléd' do inglês)",
    ponteSonora:
      "IÁ! É, SÔ... GLÁÁD(iador)! (4 batidas: iá-é-SÔ-GLÁÁD; força no SÔ e no GLÁÁD, as duas gritadas; IÁ é o 'jag' de sempre, aqui o grito de guerra — I de IOGA, nunca J chiado; É = 'är', aberto e curto, o mesmo de 'Jag är trött' e 'Jag är hungrig'; SÔ = o 'sô' mineiro de 'Tack så mycket' e 'så jag stannar hemma', Ô FECHADO e esticado — nunca o 'só' aberto; GLÁÁD = GLADIADOR cortado na primeira sílaba pela gargalhada: G duro de 'gato', L DE VERDADE grudado no G (o GL de 'globo'), A LONGO e escancarado, e o D só encosta a língua e para — nada de 'GLÁ-dji', nada de '-iador'; e não é o 'gléd' do inglês: a boca abre no Á)",
    historia:
      "Numa clareira da mata, o pica-pau de capacete de GLADIADOR enfrenta o adversário mais duro da floresta: um tronco de madeira maciça. Ele berra IÁ! e bica, tec-tec-tec, até o tronco desabar numa chuva de lascas. Ergue a espadinha, estufa o peito e, bem mineiro, anuncia o próprio título: É, SÔ... GLÁD—! Mas a gargalhada de pica-pau explode no meio e atropela o resto da palavra. Está tão feliz que não consegue nem terminar de dizer 'gladiador'.",
  },
  createScene,
  refine: { organic: ['picapau', 'asaEspada'] },
}

export default card
