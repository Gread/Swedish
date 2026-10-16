import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "När kommer hantverkaren?" — o técnico nunca vem; quem desce pela coifa é
 * o PAPAI NOEL faz-tudo, de cinto de ferramentas. Ele passa reto pelo armário
 * de porta pendurada, escancara a geladeira NERO (NÉR) e, de boca cheia de
 * biscoito, solta CÓ-MER ANTES! num sopro de farelo (RRÁNT), parado só pra
 * VER a CARNE do Natal — o presunto rosado na luz da geladeira.
 *
 * Diorama: piso xadrez da cozinha; geladeira retrô à esquerda, virada para o
 * centro, com o congelador fechado (NERO em ouro) e a porta de baixo aberta;
 * Papai Noel no centro, em 3/4, olhando para dentro dela; bancada de madeira
 * clara à direita com o armário de porta torta, biscoitos e leite em cima.
 */

const TILE_DARK = '#2e3034'
const TILE_LIGHT = '#ebe5d6'
const SOIL = '#3a332c'
const FRIDGE = '#f1eee6'
const LINER = '#f6f4ee'
const SHELF = '#dbe5e8'
const CHROME = '#a9b0b6'
const CAB = '#e3cfab'
const CAB_DOOR = '#ecdcbd'
const TOPWOOD = '#b98a56'
const KICK = '#6e5a44'
const RECESS = '#4a3a2b'
const RED = '#b3302a'
const FUR = '#f4f1ea'
const BLACK = '#26221f'
const BRASS = '#c9a250'
const SKIN = '#efc6a4'
const CHEEK = '#ee9f8d'
const LEATHER = '#7a4f2c'
const METAL = '#8e959b'
const HANDLE_WOOD = '#b68a52'
const COOKIE = '#c99254'
const CHIP = '#4a2e1f'
const CRUMB = '#d9b27c'
const HAM = '#d9776a'
const HAM_CUT = '#f2aaa8'
const GOLD = '#f2b52b' // acento saturado, RESERVADO às letras NERO

const GY = 0.18 // topo do piso

// geladeira
const FX = -1.0
const FZ = -0.5
const FROT = 0.3
const W = 0.86
const D = 0.72
const H = 1.95
const DIV = 1.4 // base do congelador
const SHELF1 = 0.56
const SHELF2 = 0.96
const DOOR_OPEN = -2.3

// Papai Noel
const SX = 0.12
const SZ = 0.3
const SCALE = 1.18

// bancada
const CX = 1.25
const CZ = -0.55

/** Traço de letra: caixinha dourada em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.035, 0.01, GOLD, { roughness: 0.28, metalness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** N E R O — letras de traço grosso, ~0.19 de altura. */
function letter(which: 'N' | 'E' | 'R' | 'O') {
  const g = new THREE.Group()
  const t = 0.034
  if (which === 'N') {
    g.add(stroke(t, 0.19, -0.046, 0))
    g.add(stroke(t, 0.19, 0.046, 0))
    g.add(stroke(t * 0.95, 0.205, 0, 0, 0.45))
  } else if (which === 'E') {
    g.add(stroke(t, 0.19, -0.042, 0))
    g.add(stroke(0.1, t, 0.0, 0.078))
    g.add(stroke(0.08, t, -0.01, 0))
    g.add(stroke(0.1, t, 0.0, -0.078))
  } else if (which === 'R') {
    g.add(stroke(t, 0.19, -0.044, 0))
    g.add(stroke(0.082, t, -0.006, 0.078))
    g.add(stroke(0.082, t, -0.006, 0.006))
    g.add(stroke(t, 0.07, 0.034, 0.042))
    g.add(stroke(t, 0.1, 0.03, -0.05, 0.42))
  } else {
    const ring = torus(0.06, 0.018, GOLD, { roughness: 0.28, metalness: 0.6 })
    ring.scale.y = 1.42
    g.add(ring)
  }
  return g
}

/** Biscoito redondo com gotas de chocolate; `bitten` tira uma mordida. */
function cookie(r: number, bitten: boolean, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const shape = new THREE.Shape()
  if (bitten) {
    const a = 0.55
    shape.absarc(0, 0, r, a, Math.PI * 2 - a, false)
    const bx = r * 1.12
    const px = r * Math.cos(a) - bx
    const py = r * Math.sin(a)
    const br = Math.hypot(px, py)
    const ang = Math.atan2(py, px)
    shape.absarc(bx, 0, br, Math.PI * 2 - ang, ang, true)
  } else {
    shape.absarc(0, 0, r, 0, Math.PI * 2, false)
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: r * 0.18,
    bevelEnabled: true,
    bevelThickness: r * 0.08,
    bevelSize: r * 0.08,
    bevelSegments: 3,
    curveSegments: 28,
  })
  geo.translate(0, 0, -r * 0.09)
  geo.computeVertexNormals()
  const disc = new THREE.Mesh(geo, mat(COOKIE, { roughness: 0.85, size: r * 2 }))
  disc.castShadow = true
  disc.receiveShadow = true
  g.add(disc)
  for (let i = 0; i < 6; i++) {
    const ang = rand() * Math.PI * 2
    const rr = r * (0.2 + rand() * 0.5)
    const x = Math.cos(ang) * rr
    const y = Math.sin(ang) * rr
    if (bitten && x > r * 0.35) continue
    for (const side of [-1, 1]) {
      const chip = sphere(r * 0.12, CHIP, { roughness: 0.6 }, 10)
      chip.position.set(x, y, side * r * 0.17)
      chip.scale.z = 0.6
      g.add(chip)
    }
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base do diorama: piso de ladrilhos xadrez ---------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)
  const floor = cylinder(2.56, 2.62, 0.05, TILE_LIGHT, { roughness: 0.5 })
  floor.position.y = 0.145
  base.add(floor)
  const T = 0.42
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      if ((i + j) % 2 === 0) continue
      const x = i * T
      const z = j * T
      // só ladrilhos inteiros dentro do disco
      if (Math.hypot(Math.abs(x) + T / 2, Math.abs(z) + T / 2) > 2.5) continue
      const tile = rbox(T - 0.02, 0.03, T - 0.02, 0.008, TILE_DARK, { roughness: 0.62 })
      tile.position.set(x, GY - 0.012, z)
      base.add(tile)
    }
  }
  const rim = torus(2.6, 0.035, '#8c7b66', { roughness: 0.6 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = GY - 0.01
  base.add(rim)
  root.add(base)

  // ---- bancada de madeira clara com armários -------------------------------
  const bancada = new THREE.Group()
  bancada.position.set(CX, GY, CZ)
  bancada.rotation.y = -0.3
  const CW = 1.3
  const CD = 0.62
  const kick = rbox(CW - 0.08, 0.1, CD - 0.12, 0.015, KICK, { roughness: 0.8 })
  kick.position.set(0, 0.05, -0.04)
  bancada.add(kick)
  const carcass = rbox(CW, 0.76, CD - 0.04, 0.02, CAB, { roughness: 0.7 })
  carcass.position.set(0, 0.1 + 0.38, -0.02)
  bancada.add(carcass)
  const top = rbox(CW + 0.08, 0.06, CD + 0.04, 0.02, TOPWOOD, { roughness: 0.6 })
  top.position.set(0, 0.89, 0)
  bancada.add(top)
  const FRONT = -0.02 + (CD - 0.04) / 2 // 0.27
  // gavetas
  for (const dx of [-0.32, 0.32]) {
    const drawer = rbox(0.6, 0.12, 0.035, 0.015, CAB_DOOR, { roughness: 0.65 })
    drawer.position.set(dx, 0.79, FRONT + 0.017)
    bancada.add(drawer)
    const pull = capsule(0.012, 0.12, BRASS, { roughness: 0.3, metalness: 0.8 })
    pull.rotation.z = Math.PI / 2
    pull.position.set(dx, 0.79, FRONT + 0.05)
    bancada.add(pull)
  }
  // porta da esquerda, inteira
  const doorL = rbox(0.58, 0.56, 0.035, 0.015, CAB_DOOR, { roughness: 0.65 })
  doorL.position.set(-0.33, 0.43, FRONT + 0.017)
  bancada.add(doorL)
  const panelL = rbox(0.44, 0.42, 0.012, 0.01, CAB, { roughness: 0.7 })
  panelL.position.set(-0.33, 0.43, FRONT + 0.036)
  bancada.add(panelL)
  const knobL = sphere(0.025, BRASS, { roughness: 0.3, metalness: 0.8 })
  knobL.position.set(-0.1, 0.56, FRONT + 0.06)
  bancada.add(knobL)
  // vão escuro da porta que caiu
  const recess = rbox(0.56, 0.54, 0.02, 0.01, RECESS, { roughness: 0.9 })
  recess.position.set(0.33, 0.43, FRONT + 0.002)
  bancada.add(recess)
  const innerShelf = rbox(0.54, 0.025, 0.03, 0.008, '#6a5641', { roughness: 0.9 })
  innerShelf.position.set(0.33, 0.43, FRONT + 0.013)
  bancada.add(innerShelf)
  // dobradiça de baixo, quebrada e torta
  const brokenHinge = rbox(0.03, 0.07, 0.012, 0.005, METAL, { roughness: 0.35, metalness: 0.8 })
  brokenHinge.position.set(0.6, 0.22, FRONT + 0.02)
  brokenHinge.rotation.z = 0.7
  bancada.add(brokenHinge)
  root.add(bancada)

  // ---- porta do armário pendurada por uma dobradiça só ---------------------
  const portaArmario = new THREE.Group()
  portaArmario.position.set(0.62, 0.72, FRONT + 0.03)
  portaArmario.rotation.set(0, 0.45, 0.24)
  const cabDoor = rbox(0.58, 0.56, 0.035, 0.015, CAB_DOOR, { roughness: 0.65 })
  cabDoor.position.set(-0.29, -0.28, 0.018)
  portaArmario.add(cabDoor)
  const cabPanel = rbox(0.44, 0.42, 0.012, 0.01, CAB, { roughness: 0.7 })
  cabPanel.position.set(-0.29, -0.28, 0.037)
  portaArmario.add(cabPanel)
  const cabKnob = sphere(0.025, BRASS, { roughness: 0.3, metalness: 0.8 })
  cabKnob.position.set(-0.52, -0.15, 0.06)
  portaArmario.add(cabKnob)
  const hinge = cylinder(0.018, 0.018, 0.08, METAL, { roughness: 0.35, metalness: 0.8 })
  hinge.position.set(-0.01, -0.05, 0.01)
  portaArmario.add(hinge)
  bancada.add(portaArmario)

  // ---- prato de biscoitos e copo de leite ----------------------------------
  const pratoLeite = new THREE.Group()
  pratoLeite.position.set(-0.32, 0.92, 0.04)
  const plate = lathe(
    [[0, 0], [0.12, 0], [0.15, 0.012], [0.18, 0.03], [0.175, 0.036], [0.12, 0.018], [0, 0.016]],
    '#f7f5f0',
    { roughness: 0.3 },
  )
  pratoLeite.add(plate)
  const stack: [number, number, number, number][] = [
    [-0.05, 0.03, -0.02, 0.15], [0.06, 0.03, 0.02, -0.12], [0.0, 0.055, 0.0, 0.25], [0.0, 0.08, 0.01, -0.1],
  ]
  stack.forEach(([x, y, z, tilt], i) => {
    const c = cookie(0.065, false, 40 + i)
    c.rotation.set(-Math.PI / 2 + tilt, 0, i)
    c.position.set(x, y, z)
    pratoLeite.add(c)
  })
  const glass = lathe(
    [[0, 0], [0.05, 0], [0.055, 0.01], [0.06, 0.2], [0.064, 0.21], [0.052, 0.21], [0.05, 0.02], [0, 0.02]],
    '#dfe8ee',
    { roughness: 0.15 },
  )
  glass.position.set(0.3, 0, -0.1)
  pratoLeite.add(glass)
  const milk = cylinder(0.054, 0.05, 0.17, '#fbfaf5', { roughness: 0.4 })
  milk.position.set(0.3, 0.1, -0.1)
  pratoLeite.add(milk)
  bancada.add(pratoLeite)

  // ---- geladeira NERO ------------------------------------------------------
  const geladeira = new THREE.Group()
  geladeira.position.set(FX, GY, FZ)
  geladeira.rotation.y = FROT
  const plinth = rbox(W - 0.06, 0.1, D - 0.08, 0.02, '#3b3d40', { roughness: 0.6 })
  plinth.position.set(0, 0.05, -0.02)
  geladeira.add(plinth)
  const back = rbox(W, H - 0.1, 0.06, 0.03, FRIDGE, { roughness: 0.35 })
  back.position.set(0, 0.1 + (H - 0.1) / 2, -D / 2 + 0.03)
  geladeira.add(back)
  for (const side of [-1, 1]) {
    const wall = rbox(0.06, H - 0.1, D, 0.03, FRIDGE, { roughness: 0.35 })
    wall.position.set(side * (W / 2 - 0.03), 0.1 + (H - 0.1) / 2, 0)
    geladeira.add(wall)
  }
  const bottom = rbox(W, 0.08, D, 0.02, FRIDGE, { roughness: 0.35 })
  bottom.position.set(0, 0.13, 0)
  geladeira.add(bottom)
  const freezer = rbox(W, H - DIV, D, 0.09, FRIDGE, { roughness: 0.35 })
  freezer.position.set(0, DIV + (H - DIV) / 2, 0)
  geladeira.add(freezer)
  const divider = rbox(W - 0.1, 0.05, D - 0.08, 0.015, LINER, { roughness: 0.4 })
  divider.position.set(0, DIV + 0.01, 0)
  geladeira.add(divider)
  // porta do congelador (fechada) com a marca NERO em ouro
  const fzDoor = rbox(W - 0.012, H - DIV - 0.05, 0.07, 0.05, FRIDGE, { roughness: 0.3 })
  fzDoor.position.set(0, DIV + (H - DIV) / 2, D / 2 + 0.035)
  geladeira.add(fzDoor)
  const word: ['N' | 'E' | 'R' | 'O', number][] = [['N', -0.255], ['E', -0.115], ['R', 0.022], ['O', 0.165]]
  for (const [glyph, lx] of word) {
    const l = letter(glyph)
    l.position.set(lx - 0.03, DIV + 0.29, D / 2 + 0.085)
    geladeira.add(l)
  }
  const fzHandle = capsule(0.016, 0.22, CHROME, { roughness: 0.2, metalness: 0.85 })
  fzHandle.position.set(W / 2 - 0.075, DIV + 0.2, D / 2 + 0.11)
  geladeira.add(fzHandle)
  for (const hy of [DIV + 0.1, DIV + 0.3]) {
    const standoff = cylinder(0.012, 0.012, 0.05, CHROME, { roughness: 0.2, metalness: 0.85 }, 12)
    standoff.rotation.x = Math.PI / 2
    standoff.position.set(W / 2 - 0.075, hy, D / 2 + 0.085)
    geladeira.add(standoff)
  }
  // prateleiras e gaveta de legumes
  for (const sy of [SHELF1, SHELF2]) {
    const shelf = rbox(W - 0.13, 0.025, D - 0.14, 0.008, SHELF, { roughness: 0.2 })
    shelf.position.set(0, sy, -0.03)
    geladeira.add(shelf)
  }
  const crisper = rbox(W - 0.15, 0.24, D - 0.18, 0.03, '#e6eef1', { roughness: 0.25 })
  crisper.position.set(0, 0.3, -0.04)
  geladeira.add(crisper)
  const crisperLip = rbox(W - 0.3, 0.04, 0.03, 0.012, '#c6d3d8', { roughness: 0.3 })
  crisperLip.position.set(0, 0.38, D / 2 - 0.12)
  geladeira.add(crisperLip)
  for (const [vx, vc] of [[-0.15, '#8fae5e'], [0.0, '#d98b4a'], [0.15, '#9dbb6a']] as const) {
    const veg = sphere(0.06, vc, { roughness: 0.6 })
    veg.position.set(vx, 0.43, -0.08)
    geladeira.add(veg)
  }
  // prateleira de baixo: pote e caixinha
  const jar = lathe(
    [[0, 0], [0.065, 0], [0.07, 0.02], [0.07, 0.15], [0.055, 0.17], [0.058, 0.2], [0, 0.2]],
    '#8fa56b',
    { roughness: 0.3 },
  )
  jar.position.set(-0.2, SHELF1 + 0.013, -0.06)
  geladeira.add(jar)
  const jarLid = cylinder(0.06, 0.06, 0.035, '#b8423a', { roughness: 0.4 }, 20)
  jarLid.position.set(-0.2, SHELF1 + 0.23, -0.06)
  geladeira.add(jarLid)
  const carton = rbox(0.12, 0.22, 0.12, 0.012, '#d7e3ea', { roughness: 0.5 })
  carton.position.set(0.18, SHELF1 + 0.125, -0.12)
  geladeira.add(carton)
  const cartonRoof = rbox(0.12, 0.04, 0.09, 0.01, '#4f7aa8', { roughness: 0.5 })
  cartonRoof.position.set(0.18, SHELF1 + 0.25, -0.12)
  geladeira.add(cartonRoof)
  root.add(geladeira)

  // ---- porta da geladeira (pivô na dobradiça esquerda) ---------------------
  const portaGeladeira = new THREE.Group()
  portaGeladeira.position.set(-W / 2, 0, D / 2)
  portaGeladeira.rotation.y = DOOR_OPEN
  const DOOR_H = DIV - 0.16
  const slab = rbox(W, DOOR_H, 0.08, 0.05, FRIDGE, { roughness: 0.3 })
  slab.position.set(W / 2, 0.16 + DOOR_H / 2, 0.04)
  portaGeladeira.add(slab)
  const gasket = rbox(W - 0.07, DOOR_H - 0.07, 0.02, 0.01, '#c9ccc9', { roughness: 0.6 })
  gasket.position.set(W / 2, 0.16 + DOOR_H / 2, -0.005)
  portaGeladeira.add(gasket)
  for (const by of [0.42, 0.86]) {
    const bin = rbox(W - 0.18, 0.1, 0.11, 0.02, '#e3ecef', { roughness: 0.25 })
    bin.position.set(W / 2, by, -0.07)
    portaGeladeira.add(bin)
  }
  // garrafas na porta
  const bottle = (x: number, y: number, body: string, cap: string) => {
    const b = lathe(
      [[0, 0], [0.04, 0], [0.042, 0.02], [0.042, 0.15], [0.02, 0.2], [0.02, 0.23], [0, 0.23]],
      body,
      { roughness: 0.25 },
    )
    b.position.set(x, y, -0.07)
    const c = cylinder(0.022, 0.022, 0.03, cap, { roughness: 0.4 }, 16)
    c.position.y = 0.24
    b.add(c)
    portaGeladeira.add(b)
  }
  bottle(0.28, 0.4, '#fbfaf5', '#4f7aa8')
  bottle(0.42, 0.4, '#e8c27a', '#7a4f2c')
  bottle(0.58, 0.4, '#fbfaf5', '#4f7aa8')
  const eggRow = rbox(W - 0.24, 0.04, 0.08, 0.01, '#e3ecef', { roughness: 0.3 })
  eggRow.position.set(W / 2, 0.88, -0.07)
  portaGeladeira.add(eggRow)
  for (let i = 0; i < 4; i++) {
    const egg = sphere(0.03, '#f3e3c8', { roughness: 0.5 }, 16)
    egg.scale.y = 1.25
    egg.position.set(0.24 + i * 0.13, 0.93, -0.07)
    portaGeladeira.add(egg)
  }
  const doorHandle = capsule(0.016, 0.34, CHROME, { roughness: 0.2, metalness: 0.85 })
  doorHandle.position.set(W - 0.075, 1.0, 0.12)
  portaGeladeira.add(doorHandle)
  geladeira.add(portaGeladeira)

  // ---- luz amarela de dentro da geladeira ----------------------------------
  const luz = new THREE.Group()
  const glowPanel = rbox(W - 0.16, DIV - 0.2, 0.02, 0.01, '#fff1b8', {
    emissive: '#ffcf55',
    emissiveIntensity: 0.55,
    roughness: 0.6,
  })
  glowPanel.position.set(0, 0.15 + (DIV - 0.2) / 2, -D / 2 + 0.075)
  luz.add(glowPanel)
  const lamp = rbox(0.22, 0.04, 0.08, 0.015, '#fff6d6', {
    emissive: '#ffe08a',
    emissiveIntensity: 1.2,
  })
  lamp.position.set(0, DIV - 0.035, 0.05)
  luz.add(lamp)
  const glow = new THREE.PointLight('#ffd36b', 1.8, 3.2, 2)
  glow.position.set(0, 1.2, 0.3)
  luz.add(glow)
  geladeira.add(luz)

  // ---- presunto de Natal na travessa ---------------------------------------
  const presunto = new THREE.Group()
  presunto.position.set(0.0, SHELF2 + 0.013, -0.04)
  const platter = lathe(
    [[0, 0], [0.18, 0], [0.22, 0.015], [0.25, 0.035], [0.245, 0.042], [0.2, 0.025], [0, 0.022]],
    '#f9f8f4',
    { roughness: 0.25 },
  )
  platter.scale.z = 0.72
  presunto.add(platter)
  const ham = new THREE.Group()
  ham.position.set(0.04, 0.15, 0)
  const hamBody = lathe(
    [[0, 0], [0.12, 0], [0.145, 0.04], [0.15, 0.1], [0.13, 0.18], [0.09, 0.25], [0.055, 0.3], [0, 0.31]],
    HAM,
    { roughness: 0.45 },
  )
  hamBody.rotation.z = Math.PI / 2
  hamBody.position.x = 0.12
  ham.add(hamBody)
  const cut = cylinder(0.118, 0.118, 0.02, HAM_CUT, { roughness: 0.6 })
  cut.rotation.z = Math.PI / 2
  cut.position.x = 0.125
  ham.add(cut)
  const fat = torus(0.112, 0.012, '#fbf1e6', { roughness: 0.6 })
  fat.rotation.y = Math.PI / 2
  fat.position.x = 0.135
  ham.add(fat)
  const marrow = sphere(0.022, '#fbf1e6', { roughness: 0.5 }, 12)
  marrow.position.set(0.133, 0.0, 0)
  marrow.scale.x = 0.4
  ham.add(marrow)
  const bone = capsule(0.024, 0.09, '#f5ecdc', { roughness: 0.5 })
  bone.rotation.z = Math.PI / 2
  bone.position.x = -0.24
  ham.add(bone)
  const frill = cone(0.05, 0.07, '#ffffff', { roughness: 0.7 }, 12)
  frill.rotation.z = Math.PI / 2
  frill.position.x = -0.2
  ham.add(frill)
  // cravos espetados no glaçado
  for (let i = 0; i < 3; i++) {
    for (let k = -1; k <= 1; k++) {
      const clove = sphere(0.011, '#4a2a1c', { roughness: 0.6 }, 8)
      const x = -0.08 + i * 0.075
      const rr = 0.14 - Math.max(0, -x) * 0.25
      const a = k * 0.55
      clove.position.set(x, Math.cos(a) * rr, Math.sin(a) * rr)
      ham.add(clove)
    }
  }
  presunto.add(ham)
  geladeira.add(presunto)

  // ---- Papai Noel faz-tudo -------------------------------------------------
  const noel = new THREE.Group()
  noel.position.set(SX, GY, SZ)
  noel.scale.setScalar(SCALE)
  const santa = person({ body: RED, skin: SKIN, height: 1.5, armAngle: 0.4 })
  santa.rotation.y = -0.75
  noel.add(santa)

  // casaco: barra de pele branca, faixa da frente, cinto preto de fivela
  const hem = torus(0.262, 0.05, FUR, { roughness: 0.95 })
  hem.rotation.x = Math.PI / 2
  hem.position.y = 0.16
  santa.add(hem)
  const placket = rbox(0.1, 0.5, 0.05, 0.025, FUR, { roughness: 0.95 })
  placket.position.set(0, 0.45, 0.245)
  santa.add(placket)
  const belt = torus(0.264, 0.035, BLACK, { roughness: 0.5 })
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.43
  santa.add(belt)
  const buckle = rbox(0.11, 0.09, 0.03, 0.015, BRASS, { roughness: 0.3, metalness: 0.75 })
  buckle.position.set(0, 0.43, 0.285)
  santa.add(buckle)
  const buckleHole = rbox(0.06, 0.04, 0.02, 0.01, BLACK, { roughness: 0.5 })
  buckleHole.position.set(0, 0.43, 0.297)
  santa.add(buckleHole)
  for (const side of [-1, 1]) {
    const cuff = santa.getObjectByName(side < 0 ? 'armL' : 'armR') as THREE.Mesh
    const ring = torus(0.07, 0.03, FUR, { roughness: 0.95 })
    ring.rotation.x = Math.PI / 2
    ring.position.y = -0.2
    cuff.add(ring)
  }

  const head = santa.getObjectByName('head') as THREE.Group
  head.rotation.y = -0.35
  for (const side of [-1, 1]) {
    const cheek = sphere(0.105, CHEEK, { roughness: 0.6 })
    cheek.position.set(side * 0.15, -0.07, 0.19)
    head.add(cheek)
    const brow = capsule(0.022, 0.07, FUR, { roughness: 0.95 })
    brow.rotation.z = Math.PI / 2 - side * 0.25
    brow.position.set(side * 0.11, 0.12, 0.25)
    head.add(brow)
    const stache = capsule(0.04, 0.1, FUR, { roughness: 0.95 })
    stache.rotation.z = Math.PI / 2 - side * 0.35
    stache.position.set(side * 0.07, -0.1, 0.27)
    head.add(stache)
  }
  const nose = sphere(0.055, '#e58a78', { roughness: 0.5 })
  nose.position.set(0, -0.03, 0.29)
  head.add(nose)
  const beard = puff(0.17, FUR, 8, 77, { roughness: 0.95 })
  beard.position.set(0, -0.3, 0.15)
  beard.scale.set(1.35, 1.6, 0.95)
  head.add(beard)
  // cabelo branco cobrindo a nuca e as laterais, por baixo do gorro
  const hair = sphere(0.3, FUR, { roughness: 0.95 })
  hair.position.set(0, -0.02, -0.08)
  hair.scale.set(1.08, 0.95, 0.9)
  head.add(hair)
  for (const side of [-1, 1]) {
    const tuft = puff(0.09, FUR, 4, 80 + side, { roughness: 0.95 })
    tuft.position.set(side * 0.27, -0.1, 0.02)
    head.add(tuft)
  }

  // gorro vermelho de pompom, caído para trás
  const gorro = new THREE.Group()
  gorro.position.set(0, 0.17, -0.02)
  gorro.rotation.set(-0.45, 0, 0.2)
  const capBody = lathe(
    [[0.25, 0], [0.24, 0.1], [0.19, 0.24], [0.12, 0.36], [0.06, 0.45], [0.0, 0.5]],
    RED,
    { roughness: 0.9 },
  )
  gorro.add(capBody)
  const capBrim = torus(0.25, 0.06, FUR, { roughness: 0.95 })
  capBrim.rotation.x = Math.PI / 2
  capBrim.position.y = 0.02
  gorro.add(capBrim)
  const pompom = sphere(0.075, FUR, { roughness: 0.95 })
  pompom.position.y = 0.5
  gorro.add(pompom)
  head.add(gorro)

  // braço com o biscoito mordido (o mais perto da câmera)
  const bracoBiscoito = santa.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoBiscoito, 1.5)
  bracoBiscoito.rotation.set(-1.5, 0, -0.4)
  const biscoito = cookie(0.095, true, 12)
  biscoito.rotation.set(0, Math.PI / 2, Math.PI)
  biscoito.position.set(0, -0.53, 0.09)
  bracoBiscoito.add(biscoito)
  root.add(noel)

  // ---- cinto de ferramentas marrom -----------------------------------------
  const cintoFerramentas = new THREE.Group()
  const toolBelt = torus(0.275, 0.04, LEATHER, { roughness: 0.75 })
  toolBelt.rotation.x = Math.PI / 2
  toolBelt.rotation.y = 0.08
  toolBelt.position.y = 0.3
  cintoFerramentas.add(toolBelt)
  // bolsinha de couro
  const pouch = rbox(0.13, 0.15, 0.07, 0.03, '#8c5e35', { roughness: 0.8 })
  pouch.position.set(0.275, 0.22, -0.02)
  pouch.rotation.y = 1.65
  cintoFerramentas.add(pouch)
  const pouchFlap = rbox(0.14, 0.05, 0.075, 0.02, LEATHER, { roughness: 0.8 })
  pouchFlap.position.set(0.275, 0.28, -0.02)
  pouchFlap.rotation.y = 1.65
  cintoFerramentas.add(pouchFlap)
  // martelo pendurado no lado
  const hammer = new THREE.Group()
  hammer.position.set(0.1, 0.31, 0.275)
  hammer.rotation.set(0.1, 0.35, 0.06)
  const hammerHandle = capsule(0.018, 0.26, HANDLE_WOOD, { roughness: 0.7 })
  hammerHandle.position.y = -0.14
  hammer.add(hammerHandle)
  const hammerHead = rbox(0.17, 0.05, 0.05, 0.012, METAL, { roughness: 0.3, metalness: 0.8 })
  hammerHead.position.y = 0.0
  hammer.add(hammerHead)
  const claw = cone(0.022, 0.06, METAL, { roughness: 0.3, metalness: 0.8 }, 12)
  claw.rotation.z = -Math.PI / 2 - 0.4
  claw.position.set(0.11, -0.01, 0)
  hammer.add(claw)
  cintoFerramentas.add(hammer)
  // chave inglesa
  const wrench = new THREE.Group()
  wrench.position.set(0.23, 0.17, 0.17)
  wrench.rotation.set(0.08, 0.95, -0.12)
  const wrenchShaft = rbox(0.035, 0.24, 0.016, 0.008, METAL, { roughness: 0.3, metalness: 0.8 })
  wrench.add(wrenchShaft)
  const jaw = rbox(0.085, 0.04, 0.018, 0.008, METAL, { roughness: 0.3, metalness: 0.8 })
  jaw.position.y = -0.13
  wrench.add(jaw)
  for (const side of [-1, 1]) {
    const prong = rbox(0.022, 0.06, 0.018, 0.008, METAL, { roughness: 0.3, metalness: 0.8 })
    prong.position.set(side * 0.03, -0.17, 0)
    wrench.add(prong)
  }
  const ringEnd = torus(0.026, 0.012, METAL, { roughness: 0.3, metalness: 0.8 })
  ringEnd.position.y = 0.13
  wrench.add(ringEnd)
  cintoFerramentas.add(wrench)
  santa.add(cintoFerramentas)

  // ---- nuvenzinha de farelo saindo da boca ---------------------------------
  const farelo = new THREE.Group()
  farelo.position.set(0, -0.1, 0.32)
  const frand = rng(91)
  for (let i = 0; i < 22; i++) {
    const t = frand()
    const z = 0.02 + t * 0.42
    const spread = 0.03 + t * 0.14
    const crumb = sphere(0.014 + frand() * 0.022, frand() < 0.6 ? CRUMB : COOKIE, { roughness: 0.85 }, 10)
    crumb.position.set((frand() - 0.5) * spread * 2, (frand() - 0.45) * spread * 1.6, z)
    farelo.add(crumb)
  }
  head.add(farelo)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cozinha', object: base },
    { name: 'bancada', group: 'cozinha', object: bancada },
    { name: 'portaArmario', group: 'cozinha', object: portaArmario },
    { name: 'geladeira', group: 'geladeira', object: geladeira },
    { name: 'portaGeladeira', group: 'geladeira', object: portaGeladeira },
    { name: 'noel', group: 'noel', object: noel },
    { name: 'bracoBiscoito', group: 'noel', object: bracoBiscoito },
    { name: 'cintoFerramentas', group: 'noel', object: cintoFerramentas },
    { name: 'luz', group: 'abre', object: luz },
    { name: 'pratoLeite', group: 'abre', object: pratoLeite },
    { name: 'farelo', group: 'farelo', object: farelo },
    { name: 'presunto', group: 'carne', object: presunto },
  ]

  const SY = GY
  const ARM_REST: [number, number] = [0, 0.15]
  const ARM_FINAL: [number, number] = [-1.5, -0.4]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Você chamou o técnico em agosto pra arrumar a porta do armário…',
    }),
    seq('bancada-rise', 'bancada', 0.25, 0.9, [riseFrom(GY, 1.4)], { ease: 'easeOut' }),
    seq('porta-armario-junto', 'portaArmario', 0.25, 0.9, [ch('rotation.z', 0, 0)]),
    seq('porta-armario-cai', 'portaArmario', 1.35, 0.55, [
      ch('rotation.z', 0, 0.34), ch('rotation.y', 0, 0.45),
    ], { ease: 'easeIn', caption: '…e ela ficou pendurada numa dobradiça só. Setembro, outubro, novembro…' }),
    seq('porta-armario-assenta', 'portaArmario', 1.9, 0.5, [ch('rotation.z', 0.34, 0.2)], { ease: 'easeOut' }),

    seq('geladeira-rise', 'geladeira', 2.6, 1.0, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: 'Na cozinha, só a geladeira dourada da marca NERO… NÉR…',
    }),
    seq('porta-geladeira-fechada', 'portaGeladeira', 2.6, 1.0, [ch('rotation.y', 0, 0)]),

    seq('noel-desce', 'noel', 4.1, 0.65, [
      ch('position.y', SY + 2.6, SY), ch('scale.y', SCALE * 1.2, SCALE * 0.86),
    ], {
      ease: 'easeIn',
      caption: '…e quem chega primeiro, descendo pela coifa, é o PAPAI NOEL — o faz-tudo mais famoso do mundo!',
    }),
    seq('noel-pousa', 'noel', 4.75, 0.4, [ch('scale.y', SCALE * 0.86, SCALE)], { ease: 'easeOut' }),
    seq('braco-desce', 'bracoBiscoito', 4.1, 0.75, [
      ch('rotation.x', ARM_REST[0], ARM_REST[0]), ch('rotation.z', 2.7, ARM_REST[1]),
    ], { ease: 'easeOut' }),
    seq('cinto-veste', 'cintoFerramentas', 5.15, 0.6, [
      ch('position.y', 0.75, 0), ch('scale.x', 0.6, 1), ch('scale.z', 0.6, 1),
    ], { ease: 'easeOut', caption: 'De cinto de ferramentas e tudo: martelo, chave inglesa…' }),

    seq('porta-geladeira-abre', 'portaGeladeira', 6.2, 0.8, [ch('rotation.y', 0, DOOR_OPEN)], {
      ease: 'easeOut',
      caption: 'Ele passa reto pelo armário, escancara a NERO e avisa, de boca cheia: CÓ-MER ANTES!',
    }),
    seq('luz-acende', 'luz', 6.45, 0.35, [
      ch('scale.x', 0.9, 1), ch('scale.y', 0.9, 1), ch('scale.z', 0.9, 1),
    ], { ease: 'easeOut' }),
    seq('prato-aparece', 'pratoLeite', 6.3, 0.5, [
      ch('position.y', 1.4, 0.92), ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
    ], { ease: 'easeOut' }),
    seq('braco-biscoito', 'bracoBiscoito', 6.8, 0.6, [
      ch('rotation.x', ARM_REST[0], ARM_FINAL[0]), ch('rotation.z', ARM_REST[1], ARM_FINAL[1]),
    ], { ease: 'easeOut' }),

    seq('farelo-sopro', 'farelo', 7.9, 0.8, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1), ch('position.z', 0.22, 0.32),
    ], {
      ease: 'easeOut',
      caption: 'O ANTES sai num sopro de farelo — RRÁNT! — com o -ES entalado no biscoito.',
    }),

    seq('presunto-brilha', 'presunto', 9.4, 0.7, [
      ch('scale.x', 0.2, 1), ch('scale.y', 0.2, 1), ch('scale.z', 0.2, 1), ch('position.y', SHELF2 + 0.2, SHELF2 + 0.013),
    ], {
      ease: 'easeOut',
      caption: 'E fica ali, na luz da geladeira, só pra VER a CARNE do Natal: VÉR… CÁRN!',
    }),

    seq('porta-armario-balanca', 'portaArmario', 11.0, 0.4, [ch('rotation.z', 0.2, 0.3)], {
      ease: 'easeInOut',
      caption: 'När kommer hantverkaren? — Quando vem o técnico?',
    }),
    seq('porta-armario-para', 'portaArmario', 11.4, 0.7, [ch('rotation.z', 0.3, 0.24)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.35, 3.95], target: [0.0, 1.12, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'nar-kommer-hantverkaren',
    contexto:
      "Moradia: quando a administradora do prédio (hyresvärden) ou uma firma marcou um conserto e ninguém aparece — ao telefone, por e-mail ou perguntando ao zelador. 'Hantverkare' é qualquer profissional de obra e conserto: rörmokare (encanador), elektriker, snickare (marceneiro), målare (pintor). A resposta costuma vir em faixa de horário: 'mellan åtta och tolv' (entre oito e meio-dia).",
    fraseFonte: 'Quando vem o técnico?',
    fraseAlvo: 'När kommer hantverkaren?',
    pronuncia:
      "nér KÓM-mer HÁNT-vér-karn? (na fala, 'hantverkaren' encolhe pra 'hantverkarn', como 'middagen' vira 'middan' — com calma se ouve HÁNT-vér-ka-ren; 'när' com É aberto e R brando de 'caro'; 'kommer' com Ó aberto, força no KÓM e -mer fraquinho; 'hantverkaren' é palavra composta: a força principal no HANT — h soprado, A curto e oral, sem o 'ã' nasal, N na língua e T seco — e um apoio leve no VER, de É aberto; o -karn do fim é fraquinho, com o R derretendo no N)",
    ponteSonora:
      "NÉR... CÓ-MER RRÁNT(es)... VÉR CÁRN(e)? (6 sílabas: nér-KÓM-mer-HÁNT-vér-karn; força no CÓ e, a maior de todas, no RRÁNT, com um apoio leve no VÉR; NÉR = NERO sem o -O, o MESMO NÉR de 'När stänger ni?' e 'När går nästa buss?' — aqui é a marca dourada da geladeira —: É ABERTO de 'pé' e R de um toque só, de 'caro'; com Ê fechado vira 'ner' (pra baixo); CÓ-MER = o MESMO 'comer' de 'Hur kommer jag till Storgatan?' e 'Jag kommer från Brasilien': força no CÓ, Ó ABERTO, M demorado e -mer fraquinho com R brando; RRÁNT(es) = o ANTES do 'comer antes!' do Papai Noel, com três ajustes: começa com um SOPRO leve — o sopro de farelo do Papai Noel de boca cheia —, o RR carioca LEVE de RRÁR ('har'): é o h de 'hant'; o A é ORAL e aberto, nada do 'ã' nasal do português, com o N batido na ponta da língua; e o -ES some, entalado no biscoito: o T fecha seco, nunca 'tchis'; é AQUI que cai a força maior, na primeira metade da palavra composta; VÉR = o 'ver' do português, mas de É ABERTO, de 'pé' (antes de R o e sueco abre), e sem força; CÁRN(e) = CARNE sem o -E: A curto e o R é o R caipira de 'porta', a língua enrolada pra trás, que derrete dentro do N — é assim que o sueco funde o 'rn' —, nunca o RR carioca soprado, que viraria h; e é o -karn da fala: 'hantverkaren' encolhe pra 'hantverkarn', como 'middagen' vira 'middan'; com calma, KA-REN)",
    historia:
      'Você chamou o técnico em agosto pra arrumar a porta do armário. Setembro, outubro, novembro... e quem chega primeiro, descendo pela coifa, é o PAPAI NOEL — o artesão mais famoso do mundo, de cinto de ferramentas e tudo. Só que ele passa reto pelo armário, escancara a geladeira dourada da marca NERO e avisa, de boca cheia de biscoito: CÓ-MER ANTES! — e o ANTES sai com um sopro de farelo na frente, RRÁNT!, com o -ES entalado no biscoito. E fica ali, parado na luz da geladeira, só pra VER a CARNE do Natal, o presunto rosado, enquanto a porta do armário balança numa dobradiça só. Você encara o NERO da geladeira e faz a pergunta que todo inquilino sueco faz: NÉR... CÓ-MER... RRÁNT-VÉR-CÁRN? E o técnico, quando vem?',
  },
  createScene,
}

export default card
