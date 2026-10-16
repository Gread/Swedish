import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Var ligger stationen?" — VAR! LÍGUE-R... (e)STA RU(a)? NEM!
 *
 * Diorama: beco de paralelepípedos fechado por um muro de tijolos. O anão
 * mineiro (barba ruiva trançada, elmo de ferro, picareta nas costas) planta
 * a VARA no chão e a inclina; na ponta, a lanterna LIGA e ilumina a placa de
 * rua azul — RUA — riscada por um X vermelho: NEM! Beco sem saída.
 */

const SOIL = '#1f1d1c'
const JOINT = '#2a2c30'
const COBBLES = ['#4a4d52', '#56595f', '#3f4247']
const BRICKS = ['#5a3427', '#663b2b', '#4c2c21']
const MORTAR = '#2e2622'
const MOSS = '#5b6b3a'
const MOSS_DARK = '#46542c'
const LEATHER = '#5a3a22'
const BRASS = '#b08d4a'
const IRON = '#7d838b'
const IRON_DARK = '#454a51'
const BEARD = '#b8582a'
const BEARD_DARK = '#94431f'
const SKIN = '#e6b896'
const BOOT = '#24221f'
const WOOD = '#7a5230'
const WOOD_DARK = '#4f3520'
const POLE = '#1f2226'
const SIGN = '#2b5c9c'
const WHITE = '#f1efe8'
const GLOW = '#ffd35a'
const RED = '#e2252b' // acento saturado RESERVADO: o X do NEM!

const GY = 0.18 // topo dos paralelepípedos
const WZ = -1.25 // muro do fundo
const H = 1.6 // altura do person() do anão (antes do achatamento)
const DWARF: [number, number, number] = [-0.62, GY, 0.3]
const DWARF_YAW = 0.3
const POST_X = 1.72
const POST_Z = -0.5
const SIGN_Y = 1.6 // centro da placa (mundo)
const STAFF_L = 2.2

/** Traço grosso de letra: caixinha em pé no plano xy, virada para +z. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.01, WHITE, { roughness: 0.45 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** R U A em traço grosso, altura ~0.22 — legível a distância de diorama. */
function letter(which: 'R' | 'U' | 'A') {
  const g = new THREE.Group()
  const t = 0.046
  if (which === 'R') {
    g.add(stroke(t, 0.22, -0.05, 0))
    g.add(stroke(0.1, t, -0.01, 0.087))
    g.add(stroke(0.1, t, -0.01, 0.006))
    g.add(stroke(t, 0.09, 0.04, 0.047))
    g.add(stroke(t, 0.125, 0.034, -0.056, 0.42))
  } else if (which === 'U') {
    g.add(stroke(t, 0.2, -0.045, 0.01))
    g.add(stroke(t, 0.2, 0.045, 0.01))
    g.add(stroke(0.136, t, 0, -0.087))
  } else {
    g.add(stroke(t, 0.235, -0.036, 0, -0.32))
    g.add(stroke(t, 0.235, 0.036, 0, 0.32))
    g.add(stroke(0.085, 0.04, 0, -0.03))
  }
  return g
}

/** Paralelepípedos: fileiras alternadas presas ao disco, fundidas por tom. */
function cobbles() {
  const g = new THREE.Group()
  const rand = rng(7)
  const byTone: THREE.BufferGeometry[][] = [[], [], []]
  const CW = 0.22
  const CD = 0.16
  for (let row = 0; row < 40; row++) {
    const z = WZ + 0.2 + row * (CD + 0.025)
    if (z > 2.5) break
    const off = row % 2 ? (CW + 0.025) / 2 : 0
    for (let x = -2.6 + off; x < 2.6; x += CW + 0.025) {
      if (Math.hypot(x, z) > 2.42) continue
      const geo = new RoundedBoxGeometry(
        CW * (0.88 + rand() * 0.16), 0.07, CD * (0.88 + rand() * 0.16), 2, 0.03,
      )
      geo.rotateY((rand() - 0.5) * 0.12)
      geo.translate(x + (rand() - 0.5) * 0.02, GY - 0.03 + rand() * 0.012, z + (rand() - 0.5) * 0.02)
      byTone[Math.floor(rand() * 3)].push(geo)
    }
  }
  byTone.forEach((geos, i) => {
    if (!geos.length) return
    const merged = mergeGeometries(geos)
    for (const geo of geos) geo.dispose()
    const mesh = new THREE.Mesh(merged, mat(COBBLES[i], { roughness: 0.8, size: 0.22 }))
    mesh.castShadow = true
    mesh.receiveShadow = true
    g.add(mesh)
  })
  return g
}

/** Muro de tijolos: chapa de argamassa + tijolos salientes fundidos por tom. */
function brickWall(w: number, h: number) {
  const g = new THREE.Group()
  const rand = rng(11)
  const slab = rbox(w, h, 0.26, 0.03, MORTAR, { roughness: 0.95 })
  slab.position.y = h / 2
  g.add(slab)

  const byTone: THREE.BufferGeometry[][] = [[], [], []]
  const BW = 0.34
  const BH = 0.13
  for (let row = 0; row * (BH + 0.03) + BH < h - 0.05; row++) {
    const y = 0.04 + BH / 2 + row * (BH + 0.03)
    const off = row % 2 ? (BW + 0.03) / 2 : 0
    for (let x = -w / 2 + 0.02 - off; x < w / 2; x += BW + 0.03) {
      const x0 = Math.max(x, -w / 2 + 0.02)
      const x1 = Math.min(x + BW, w / 2 - 0.02)
      if (x1 - x0 < 0.08) continue
      const geo = new RoundedBoxGeometry(x1 - x0, BH, 0.08, 2, 0.02)
      geo.translate((x0 + x1) / 2, y + (rand() - 0.5) * 0.006, 0.14 + rand() * 0.012)
      byTone[Math.floor(rand() * 3)].push(geo)
    }
  }
  byTone.forEach((geos, i) => {
    if (!geos.length) return
    const merged = mergeGeometries(geos)
    for (const geo of geos) geo.dispose()
    const mesh = new THREE.Mesh(merged, mat(BRICKS[i], { roughness: 0.88, size: 0.3 }))
    mesh.castShadow = true
    mesh.receiveShadow = true
    g.add(mesh)
  })

  const coping = rbox(w + 0.1, 0.1, 0.38, 0.03, '#4a4440', { roughness: 0.85 })
  coping.position.y = h + 0.05
  g.add(coping)
  return g
}

/** Material vira luz: transparente, aditivo, sem escrever profundidade. */
function glowMat(color: string, opacity: number) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: beco de paralelepípedos ----------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const joint = cylinder(2.5, 2.62, 0.06, JOINT, { roughness: 0.95 })
  joint.position.y = 0.12
  base.add(joint)
  base.add(cobbles())

  // caixote e saco encostados no canto
  const crate = rbox(0.42, 0.38, 0.4, 0.03, '#6b4b2c', { roughness: 0.85 })
  crate.position.set(-1.75, GY + 0.19, -0.75)
  crate.rotation.y = 0.25 + rand() * 0.1
  for (const sy of [-0.1, 0.1]) {
    const slat = rbox(0.44, 0.05, 0.42, 0.015, '#58391f', { roughness: 0.85 })
    slat.position.y = sy
    crate.add(slat)
  }
  base.add(crate)

  const sack = puff(0.17, '#8a7a5c', 4, 17, { roughness: 0.95 })
  sack.position.set(-1.35, GY + 0.13, -0.85)
  sack.scale.set(1.1, 0.85, 0.9)
  base.add(sack)

  root.add(base)

  // ---- muro de tijolos fechando o beco -------------------------------------
  const muro = new THREE.Group()
  muro.position.set(0, GY - 0.04, WZ)
  muro.add(brickWall(4.2, 2.5))

  // cano de calha descendo pelo muro
  const pipe = cylinder(0.05, 0.05, 2.4, IRON_DARK, { roughness: 0.4, metalness: 0.6 })
  pipe.position.set(-1.62, 1.25, 0.25)
  muro.add(pipe)
  for (const py of [0.5, 1.3, 2.1]) {
    const clamp = torus(0.058, 0.014, IRON, { roughness: 0.35, metalness: 0.7 })
    clamp.rotation.x = Math.PI / 2
    clamp.position.set(-1.62, py, 0.25)
    muro.add(clamp)
  }
  const shoe = cylinder(0.05, 0.07, 0.12, IRON_DARK, { roughness: 0.4, metalness: 0.6 })
  shoe.position.set(-1.62, 0.1, 0.3)
  shoe.rotation.x = 0.5
  muro.add(shoe)
  root.add(muro)

  // ---- o anão mineiro ------------------------------------------------------
  const anao = person({ body: MOSS, skin: SKIN, height: H, armAngle: 0.35 })
  anao.position.set(...DWARF)
  anao.rotation.y = DWARF_YAW
  anao.scale.set(1.22, 0.98, 1.15) // atarracado

  // barra da túnica
  const hem = lathe(
    [[0.27, 0.16], [0.3, 0.17], [0.31, 0.24], [0.285, 0.27]],
    MOSS_DARK,
    { roughness: 0.9 },
  )
  anao.add(hem)

  // cinto largo de couro com fivela de latão
  const belt = lathe(
    [[0.27, 0.36], [0.292, 0.37], [0.298, 0.42], [0.292, 0.47], [0.27, 0.48]],
    LEATHER,
    { roughness: 0.75 },
  )
  anao.add(belt)
  const buckle = rbox(0.13, 0.11, 0.03, 0.02, BRASS, { roughness: 0.3, metalness: 0.75 })
  buckle.position.set(0, 0.42, 0.3)
  anao.add(buckle)
  const buckleHole = rbox(0.07, 0.05, 0.02, 0.01, LEATHER, { roughness: 0.75 })
  buckleHole.position.set(0, 0.42, 0.312)
  anao.add(buckleHole)

  // botas pesadas
  for (const side of [-1, 1]) {
    const bota = rbox(0.17, 0.14, 0.27, 0.06, BOOT, { roughness: 0.6 })
    bota.position.set(side * 0.11, 0.07, 0.09)
    anao.add(bota)
    const cano = cylinder(0.095, 0.1, 0.12, BOOT, { roughness: 0.6 })
    cano.position.set(side * 0.11, 0.17, 0.02)
    anao.add(cano)
  }

  // picareta de mineiro encostada no muro
  const pick = new THREE.Group()
  pick.position.set(1.05, GY + 0.49, -0.86)
  pick.rotation.set(-0.2, 0, -0.22)
  const cabo = cylinder(0.028, 0.032, 1.0, WOOD, { roughness: 0.8 })
  pick.add(cabo)
  const pickHead = new THREE.Group()
  pickHead.position.y = 0.5
  const eye = rbox(0.08, 0.1, 0.08, 0.02, IRON_DARK, { roughness: 0.35, metalness: 0.7 })
  pickHead.add(eye)
  for (const side of [-1, 1]) {
    const ponta = cone(0.04, 0.3, IRON, { roughness: 0.3, metalness: 0.75 })
    ponta.position.x = side * 0.17
    ponta.rotation.z = -side * (Math.PI / 2 - 0.18)
    pickHead.add(ponta)
  }
  pick.add(pickHead)
  base.add(pick)

  // ---- cabeça (peça própria: balança no fim) -------------------------------
  const cabeca = anao.getObjectByName('head') as THREE.Group
  const HR = H * 0.19
  const HEAD_YAW = 0.12

  const nose = sphere(0.07, '#df9f80', { roughness: 0.6 })
  nose.position.set(0, -0.01, HR * 0.97)
  nose.scale.set(1, 0.9, 0.85)
  cabeca.add(nose)

  // sobrancelhas ruivas franzidas: furioso
  for (const side of [-1, 1]) {
    const brow = rbox(0.13, 0.045, 0.05, 0.02, BEARD_DARK, { roughness: 0.9 })
    brow.position.set(side * HR * 0.36, HR * 0.3, HR * 0.9)
    brow.rotation.z = -side * 0.38
    cabeca.add(brow)
  }

  // ---- barba ruiva trançada até a cintura (peça própria) -------------------
  const barba = new THREE.Group()
  barba.position.set(0, -HR * 0.55, HR * 0.6)

  const mass = puff(0.15, BEARD, 6, 21, { roughness: 0.92 })
  mass.position.set(0, -0.05, 0.02)
  mass.scale.set(1.45, 1.0, 0.7)
  barba.add(mass)
  for (const side of [-1, 1]) {
    const cheek = sphere(0.1, BEARD, { roughness: 0.92 })
    cheek.position.set(side * 0.2, 0.06, -0.06)
    cheek.scale.set(0.8, 1.2, 0.8)
    barba.add(cheek)
  }
  // bigode por cima da boca aberta
  const mouth = sphere(0.06, '#2a0f0e', { roughness: 0.7 })
  mouth.position.set(0, -0.03, 0.15)
  mouth.scale.set(1.7, 0.85, 0.5)
  barba.add(mouth)
  for (const side of [-1, 1]) {
    const bigode = capsule(0.035, 0.12, BEARD_DARK, { roughness: 0.9 })
    bigode.position.set(side * 0.08, 0.1, 0.11)
    bigode.rotation.z = side * 1.15
    barba.add(bigode)
  }
  // duas tranças descendo pelo peito, presas com anéis de latão
  for (const side of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const r = 0.058 - k * 0.0035
      const knot = sphere(r, k % 2 ? BEARD_DARK : BEARD, { roughness: 0.92 })
      knot.position.set(side * (0.075 + (k % 2 ? 0.012 : -0.012)), -0.17 - k * 0.07, 0.11 + k * 0.004)
      knot.scale.set(1, 1.15, 0.9)
      barba.add(knot)
    }
    const ring = torus(0.042, 0.016, BRASS, { roughness: 0.3, metalness: 0.75 })
    ring.rotation.x = Math.PI / 2
    ring.position.set(side * 0.075, -0.58, 0.135)
    barba.add(ring)
    const tip = cone(0.04, 0.09, BEARD, { roughness: 0.92 })
    tip.rotation.x = Math.PI
    tip.position.set(side * 0.075, -0.645, 0.135)
    barba.add(tip)
  }
  cabeca.add(barba)

  // ---- elmo de ferro arredondado (peça própria) ----------------------------
  const elmo = new THREE.Group()
  const ELMO_Y = 0.0
  elmo.position.y = ELMO_Y
  const dome = lathe(
    [[0.33, 0.1], [0.335, 0.16], [0.31, 0.25], [0.24, 0.33], [0.13, 0.375], [0, 0.388]],
    IRON,
    { roughness: 0.35, metalness: 0.7 },
  )
  elmo.add(dome)
  const rim = torus(0.335, 0.03, IRON_DARK, { roughness: 0.4, metalness: 0.7 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.11
  elmo.add(rim)
  const crest = new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.026, 10, 32, Math.PI),
    mat(IRON_DARK, { roughness: 0.4, metalness: 0.7 }),
  )
  crest.rotation.y = Math.PI / 2
  crest.position.y = 0.06
  crest.scale.set(1, 0.98, 1)
  crest.castShadow = true
  elmo.add(crest)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3
    const rivet = sphere(0.018, IRON_DARK, { roughness: 0.35, metalness: 0.7 })
    rivet.position.set(Math.sin(a) * 0.336, 0.165, Math.cos(a) * 0.336)
    elmo.add(rivet)
  }
  cabeca.add(elmo)

  // ---- braço da vara: pivô no ombro, erguido rumo à placa ------------------
  const bracoR = anao.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoR, H)
  const ARM_REST_Z = 0.25
  const ARM_FINAL_Z = 1.95
  const ARM_FINAL_X = 0.3
  bracoR.rotation.set(ARM_FINAL_X, 0, ARM_FINAL_Z)

  // braço livre: punho fechado junto ao quadril
  const bracoL = anao.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoL, H)
  bracoL.rotation.set(0.1, 0, -0.32)
  root.add(anao)

  // ---- a VARA: plantada no chão, passando pela mão -------------------------
  root.updateMatrixWorld(true)
  const hand = bracoR.children[0]
  const HAND = new THREE.Vector3()
  hand.getWorldPosition(HAND)
  const BUTT = new THREE.Vector3(HAND.x - 0.3, GY, HAND.z)
  const DIR = HAND.clone().sub(BUTT).normalize()
  const TIP = BUTT.clone().addScaledVector(DIR, STAFF_L)

  const vara = new THREE.Group()
  vara.position.copy(BUTT)
  vara.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIR)
  const VARA_RZ = vara.rotation.z
  const shaft = cylinder(0.034, 0.042, STAFF_L, WOOD, { roughness: 0.75 })
  shaft.position.y = STAFF_L / 2
  vara.add(shaft)
  const ferrule = cylinder(0.046, 0.04, 0.12, IRON_DARK, { roughness: 0.35, metalness: 0.7 })
  ferrule.position.y = 0.06
  vara.add(ferrule)
  for (const wy of [0.95, 1.12]) {
    const wrap = torus(0.043, 0.012, LEATHER, { roughness: 0.8 })
    wrap.rotation.x = Math.PI / 2
    wrap.position.y = wy
    vara.add(wrap)
  }
  const knob = sphere(0.05, WOOD_DARK, { roughness: 0.7 })
  knob.position.y = STAFF_L
  vara.add(knob)
  root.add(vara)

  // ---- lanterna de ferro pendurada na ponta --------------------------------
  const lanterna = new THREE.Group()
  lanterna.position.copy(TIP)

  const bracket = rbox(0.14, 0.03, 0.03, 0.01, IRON_DARK, { roughness: 0.4, metalness: 0.7 })
  bracket.position.set(0.06, 0, 0)
  lanterna.add(bracket)
  const LX = 0.12
  for (let k = 0; k < 3; k++) {
    const link = torus(0.022, 0.007, IRON_DARK, { roughness: 0.4, metalness: 0.7 })
    link.position.set(LX, -0.025 - k * 0.035, 0)
    link.rotation.y = k % 2 ? Math.PI / 2 : 0
    lanterna.add(link)
  }
  const lamp = new THREE.Group()
  lamp.position.set(LX, -0.12, 0)
  const ringTop = torus(0.03, 0.009, IRON_DARK, { roughness: 0.4, metalness: 0.7 })
  ringTop.position.y = 0.01
  lamp.add(ringTop)
  const cap = lathe(
    [[0, 0.0], [0.04, -0.005], [0.12, -0.08], [0.13, -0.1], [0, -0.1]],
    IRON_DARK,
    { roughness: 0.4, metalness: 0.7 },
  )
  lamp.add(cap)
  const glass = cylinder(0.095, 0.095, 0.24, GLOW, { emissive: GLOW, emissiveIntensity: 1.1 })
  glass.position.y = -0.22
  glass.castShadow = false
  lamp.add(glass)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const bar = rbox(0.022, 0.26, 0.022, 0.008, IRON_DARK, { roughness: 0.4, metalness: 0.7 })
    bar.position.set(Math.sin(a) * 0.1, -0.22, Math.cos(a) * 0.1)
    lamp.add(bar)
  }
  const bottom = lathe(
    [[0, -0.34], [0.115, -0.34], [0.12, -0.36], [0.08, -0.4], [0, -0.41]],
    IRON_DARK,
    { roughness: 0.4, metalness: 0.7 },
  )
  lamp.add(bottom)
  lanterna.add(lamp)
  root.add(lanterna)

  // ---- halo de luz (peça própria) ------------------------------------------
  const halo = new THREE.Group()
  halo.position.set(TIP.x + LX, TIP.y - 0.34, TIP.z)
  const glowIn = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), glowMat('#ffd76a', 0.22))
  halo.add(glowIn)
  const glowOut = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), glowMat('#ffc34a', 0.06))
  halo.add(glowOut)
  const luz = new THREE.PointLight('#ffcf6a', 7, 3.6, 1.4)
  halo.add(luz)
  root.add(halo)

  // ---- poste de placa de rua -----------------------------------------------
  const poste = new THREE.Group()
  poste.position.set(POST_X, 0, POST_Z)
  poste.rotation.y = -0.16
  const POLE_H = 1.95
  const footing = lathe(
    [[0, GY], [0.13, GY], [0.13, GY + 0.04], [0.09, GY + 0.09], [0.06, GY + 0.2], [0, GY + 0.2]],
    POLE,
    { roughness: 0.45, metalness: 0.5 },
  )
  poste.add(footing)
  const pole = cylinder(0.045, 0.05, POLE_H, POLE, { roughness: 0.45, metalness: 0.5 })
  pole.position.y = GY + POLE_H / 2
  poste.add(pole)
  const finial = sphere(0.07, POLE, { roughness: 0.4, metalness: 0.5 })
  finial.position.y = GY + POLE_H + 0.04
  poste.add(finial)
  root.add(poste)

  // ---- placa azul RUA (filha do poste) -------------------------------------
  const placa = new THREE.Group()
  placa.position.set(0, SIGN_Y, 0.075)

  for (const cy of [0.15, -0.15]) {
    const clampP = rbox(0.13, 0.05, 0.12, 0.015, POLE, { roughness: 0.4, metalness: 0.5 })
    clampP.position.set(0, cy, -0.04)
    placa.add(clampP)
  }
  const back = rbox(1.3, 0.54, 0.04, 0.06, WHITE, { roughness: 0.4 })
  placa.add(back)
  const face = rbox(1.22, 0.46, 0.03, 0.045, SIGN, { roughness: 0.35 })
  face.position.z = 0.012
  placa.add(face)
  const letters: ['R' | 'U' | 'A', number][] = [['R', -0.29], ['U', 0.0], ['A', 0.29]]
  for (const [glyph, lx] of letters) {
    const l = letter(glyph)
    l.position.set(lx, 0, 0.035)
    l.scale.setScalar(1.55)
    placa.add(l)
  }
  poste.add(placa)

  // ---- X vermelho por cima da placa: NEM! ----------------------------------
  const xis = new THREE.Group()
  xis.position.z = 0.07
  const ANG = Math.atan2(0.4, 1.12)
  for (const s of [-1, 1]) {
    const risco = rbox(1.2, 0.07, 0.035, 0.03, RED, { roughness: 0.4 })
    risco.rotation.z = s * ANG
    risco.position.z = s > 0 ? 0 : 0.012
    xis.add(risco)
  }
  placa.add(xis)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'beco', object: base },
    { name: 'muro', group: 'beco', object: muro },
    { name: 'anao', group: 'anao', object: anao },
    { name: 'cabeca', group: 'anao', object: cabeca },
    { name: 'bracoR', group: 'anao', object: bracoR },
    { name: 'barba', group: 'anao', object: barba },
    { name: 'elmo', group: 'anao', object: elmo },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'lanterna', group: 'luz', object: lanterna },
    { name: 'halo', group: 'luz', object: halo },
    { name: 'poste', group: 'placa', object: poste },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'xis', group: 'nem', object: xis },
  ]

  const pop = (s0: number, s1: number) => [
    ch('scale.x', s0, s1), ch('scale.y', s0, s1), ch('scale.z', s0, s1),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Noite escura num beco de paralelepípedos da cidade…',
    }),
    seq('muro-rise', 'muro', 0.25, 0.9, [riseFrom(GY - 0.04, 2.8)], { ease: 'easeOut' }),

    seq('anao-rise', 'anao', 1.6, 0.85, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'O anão saiu da mina pra pegar o trem… e se perdeu.',
    }),
    seq('cabeca-hold', 'cabeca', 1.6, 0.85, [ch('rotation.y', HEAD_YAW, HEAD_YAW)]),
    seq('braco-rest', 'bracoR', 1.6, 0.85, [
      ch('rotation.z', ARM_REST_Z, ARM_REST_Z), ch('rotation.x', 0, 0),
    ]),
    seq('barba-cresce', 'barba', 2.3, 0.6, pop(0.01, 1), { ease: 'easeOut' }),
    seq('elmo-cai', 'elmo', 2.5, 0.6, [ch('position.y', ELMO_Y + 0.7, ELMO_Y), ...pop(0.3, 1)], {
      ease: 'easeIn',
    }),

    seq(
      'vara-bate',
      'vara',
      3.6,
      0.55,
      [ch('position.y', GY + 0.9, GY), ch('rotation.z', 0, 0), ...pop(0.6, 1)],
      { ease: 'easeIn', caption: 'Ele bate a VARA no chão — VAR?!' },
    ),
    seq('vara-inclina', 'vara', 4.7, 0.8, [ch('rotation.z', 0, VARA_RZ)], { ease: 'easeInOut' }),
    seq('braco-ergue', 'bracoR', 4.7, 0.8, [
      ch('rotation.z', ARM_REST_Z, ARM_FINAL_Z), ch('rotation.x', 0, ARM_FINAL_X),
    ], { ease: 'easeInOut' }),

    seq('lanterna-pendura', 'lanterna', 5.6, 0.5, pop(0.01, 1), {
      ease: 'easeOut',
      caption: '…e berra LIGUE-R! — a lanterna na ponta acende de uma vez.',
    }),
    seq('halo-acende', 'halo', 6.1, 0.4, pop(0.01, 1.35), { ease: 'easeOut' }),
    seq('halo-assenta', 'halo', 6.5, 0.4, pop(1.35, 1), { ease: 'easeInOut' }),

    seq('poste-rise', 'poste', 7.3, 0.7, [riseFrom(0, 2.4)], {
      ease: 'easeOut',
      caption: 'A luz cai na placa da esquina. Ele lê: (e)STA RU(a)?',
    }),
    seq('placa-vira', 'placa', 7.8, 0.6, [ch('rotation.x', -Math.PI / 2, 0), ...pop(0.4, 1)], {
      ease: 'easeOut',
    }),

    seq('xis-carimba', 'xis', 9.1, 0.35, pop(2.4, 1), {
      ease: 'easeIn',
      caption: 'NEM! Beco sem saída — nem sombra de trilho.',
    }),
    seq('cabeca-nao-a', 'cabeca', 9.6, 0.3, [ch('rotation.y', HEAD_YAW, HEAD_YAW - 0.35)]),
    seq('cabeca-nao-b', 'cabeca', 9.9, 0.35, [ch('rotation.y', HEAD_YAW - 0.35, HEAD_YAW + 0.3)]),
    seq('cabeca-nao-c', 'cabeca', 10.25, 0.35, [ch('rotation.y', HEAD_YAW + 0.3, HEAD_YAW)], {
      ease: 'easeOut',
    }),

    seq('vara-firma', 'vara', 11.0, 0.5, [ch('rotation.z', VARA_RZ, VARA_RZ)], {
      caption: 'Var ligger stationen? — Onde fica a estação?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.0, 4.7], target: [0.5, 1.3, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-ligger-stationen',
    contexto:
      "Transporte: ao chegar numa cidade nova, sair de um ônibus num lugar desconhecido ou pedir direção a alguém na rua — 'Ursäkta, var ligger stationen?'. Vale pra tågstationen, tunnelbanestationen, Centralstationen. A resposta: 'Den ligger rakt fram' ou 'runt hörnet'.",
    fraseFonte: 'Onde fica a estação?',
    fraseAlvo: 'Var ligger stationen?',
    pronuncia:
      "var LÍG-ger sta-RRÚÚ-nen? ('var' = onde, com R brando — sem ele vira 'vad', o quê; 'ligger' com I curto, G duro de 'gato' segurado um instante (é dobrado) e o -ger fraco com R brando, nunca 'lí-gui'; 'stationen' com o S colado no T, sem 'is', e a força toda no -tion-, que soa como o sopro do 'sj' — raspado, de lábios em bico — + U LONGO: sta-RRÚÚ-nen, nunca 'esta-ção' nem 'sta-tsi-ón'; o -nen fraco: é 'station' + o artigo -en, A estação)",
    ponteSonora:
      "VAR! LÍGUE-R... (e)STA RU(a)? NEM! (6 sílabas: var-LÍG-ger-sta-RRÚÚ-nen; força no LÍG e, a maior, no RRÚÚ; VAR = a VARA sem o -a, a MESMA de 'Var kan jag köpa biljett?', 'Var kommer du ifrån?' e 'Var bor du?': R brando e audível — sem ele sobra VÁ, que é 'vad' (o quê); LÍGUE-R = o MESMO LÍGUER de 'Var ligger toaletten?': o 'ligue!' de ligar, com I curto, G duro de 'gato' segurado um instante (é gg), e o -e do fim vira um -er fraquinho com R brando — nunca 'lí-gui'; aqui é a lanterna que LIGA na ponta da vara; (e)STA RU(a) = 'esta rua' dito à carioca, sem o E da frente (S colado no T: STA, nunca 'is-ta') e sem o A do fim: o RR de 'rua' é o sopro do 'sj' — FORTE e raspado, de lábios em bico, o mesmo de RRÜÜK ('sjuk') e RRÍCA ('skicka'), bem mais forte que o h leve da HERA —, e o U, que é o 'o' longo sueco, fica LONGO e leva a força toda: sta-RRÚÚ; nunca 'es-ta-ção' nem 'sta-tsi-ón'; NEM = o 'nem!' de quem desiste, mas SEM NASALAR, como o SEM de 'bussen': E curto, N batido na língua, fraco — é o artigo '-en', A estação)",
    historia:
      'O anão saiu da mina pra pegar o trem e se perdeu no breu da cidade. Bate a VARA no chão — VAR?! — e berra LIGUE! pra lanterna pendurada na ponta dela, que acende de uma vez. A luz cai na placa da esquina e ele lê, furioso: ESTA RUA? NEM! — beco sem saída, nem sombra de trilho. Ele só quer saber uma coisa: onde fica a estação?',
  },
  createScene,
}

export default card
