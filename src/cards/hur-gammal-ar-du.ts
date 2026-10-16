import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person, shoulderPivot,
} from '../rig/helpers'
import type { MatOpts } from '../rig/helpers'

/**
 * "Hur gammal är du?" — RRÜR! GÁMA-L... É DÜ?
 *
 * Festa de cinco anos: uma caravelinha escrita GAMA (Vasco da GAMA) encalha
 * no bolo, desembarca o DUENDE ancião da família, limpa o pigarro (RRÜR), a
 * barba despenca da mesa e dobra em L no chão (GÁMA-L) e ele aponta a bengala
 * pra aniversariante, de bico esticado: É DÜ? Ela ergue a vela de número 5.
 *
 * Diorama: piso de cerâmica bege, mesa de toalha rosa com bolo e caravela à
 * esquerda, duende no centro da mesa, menina em pé à direita, cadeira com
 * balões ao fundo à esquerda.
 */

const TILE = '#ddccb0'
const GROUT = '#bba887'
const RIM = '#8d7a5e'
const PINK = '#eaa5b6'
const PINK_DARK = '#d98ba0'
const LACE = '#fbf3ee'
const TABLE_WOOD = '#c99b6a'
const CREAM = '#f7f0e2'
const FROSTING = '#fbf6ec'
const STRAWBERRY = '#c8323d'
const HULL = '#8a5732'
const HULL_DARK = '#5e3a20'
const SAIL = '#f4ecdb'
const RED = '#d8262c' // acento saturado, RESERVADO à caravela GAMA (letras + cruz)
const MOSS = '#5d7036'
const OLIVE = '#8f9a58'
const OLIVE_DARK = '#6f7a40'
const HOOD = '#4c7d34'
const BEARD = '#f3f1ea'
const BEARD_SHADE = '#e2ddd0'
const ROPE = '#b49a62'
const STICK = '#6b4a2b'
const DRESS = '#f2c24a'
const GIRL_SKIN = '#f0c9a2'
const HAIR = '#5a3825'
const HAT = '#3fb0aa'
const CANDLE = '#4a7fd6'
const FLAME = '#ff8a1e'
const CHAIR = '#efe6da'

const GY = 0.18 // topo do piso
const TY = 0.8 // topo da toalha
const TX = -0.1 // centro da mesa
const TZ = -0.3
const TW = 2.6
const TD = 1.15
const FRONT_Z = TZ + TD / 2 + 0.04 // face da saia da toalha
const SKIRT = 0.27

const CAKE_X = -0.42
const CAKE_Z = -0.42
const CAKE_H = 0.3

const DX = 0.32 // duende em pé na mesa
const DZ = -0.38
const D_YAW = 0.55
const D_H = 1.15

const GIRL_X = 1.5
const GIRL_Z = 0.35
const GIRL_YAW = -0.6
const G_H = 1.15

const SHIP_X = -0.97
const SHIP_Y = TY + 0.06
const SHIP_Z = CAKE_Z + 0.02
const SHIP_TILT = 0.24

/** Cilindro de a até b (cordões, galhos). */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts: MatOpts = {}) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const m = cylinder(r, r, dir.length(), color, opts, 12)
  m.position.copy(a).addScaledVector(dir, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, color: string, rot = 0, d = 0.022) {
  const s = rbox(w, h, d, Math.min(w, h) * 0.3, color, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** G A M — letras de traço grosso, altura 0.12. */
function letter(which: 'G' | 'A' | 'M') {
  const g = new THREE.Group()
  const t = 0.026
  const h = 0.12
  if (which === 'G') {
    g.add(stroke(t, h, -0.04 + t / 2, 0, RED))
    g.add(stroke(0.08, t, 0, h / 2 - t / 2, RED))
    g.add(stroke(0.08, t, 0, -h / 2 + t / 2, RED))
    g.add(stroke(t, h * 0.48, 0.04 - t / 2, -h / 2 + h * 0.24, RED))
    g.add(stroke(0.045, t, 0.018, -0.004, RED))
  } else if (which === 'A') {
    g.add(stroke(t, h * 1.04, -0.022, 0, RED, -0.34))
    g.add(stroke(t, h * 1.04, 0.022, 0, RED, 0.34))
    g.add(stroke(0.05, 0.022, 0, -0.02, RED))
  } else {
    g.add(stroke(t, h, -0.042, 0, RED))
    g.add(stroke(t, h, 0.042, 0, RED))
    g.add(stroke(t, h * 0.64, -0.021, 0.016, RED, 0.55))
    g.add(stroke(t, h * 0.64, 0.021, 0.016, RED, -0.55))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- chão: cerâmica bege da sala ----------------------------------------
  const chao = new THREE.Group()
  const rim = cylinder(2.62, 2.72, 0.12, RIM, { roughness: 0.9 })
  rim.position.y = 0.06
  chao.add(rim)
  const floor = cylinder(2.56, 2.62, 0.07, TILE, { roughness: 0.45 })
  floor.position.y = 0.145
  chao.add(floor)
  // rejunte em grade: cordas do círculo nas duas direções
  for (let i = -5; i <= 5; i++) {
    const c = i * 0.46
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - c * c, 0.01))
    const lx = rbox(len, 0.012, 0.022, 0.005, GROUT, { roughness: 0.8 })
    lx.position.set(0, GY + 0.002, c)
    chao.add(lx)
    const lz = rbox(0.022, 0.012, len, 0.005, GROUT, { roughness: 0.8 })
    lz.position.set(c, GY + 0.002, 0)
    chao.add(lz)
  }
  // confete espalhado
  const confColors = ['#e86a8a', '#4a9fd8', '#f2c24a', '#5fbf8a', '#a77fd6']
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.9 + rand() * 1.5
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (z < 0.4 && Math.abs(x - TX) < 1.4) continue // debaixo da mesa não aparece
    const conf = cylinder(0.035, 0.035, 0.008, confColors[i % confColors.length], { roughness: 0.6 }, 12)
    conf.position.set(x, GY + 0.006, z)
    conf.rotation.set((rand() - 0.5) * 0.2, 0, (rand() - 0.5) * 0.2)
    chao.add(conf)
  }
  // presente no chão, ao fundo à direita
  const gift = new THREE.Group()
  gift.position.set(2.0, GY, -0.95)
  gift.rotation.y = 0.5
  const giftBox = rbox(0.4, 0.32, 0.4, 0.03, '#5aa9c9', { roughness: 0.5 })
  giftBox.position.y = 0.16
  gift.add(giftBox)
  for (const ry of [0, Math.PI / 2]) {
    const ribbon = rbox(0.42, 0.335, 0.07, 0.02, '#f6f0e4', { roughness: 0.4 })
    ribbon.position.y = 0.16
    ribbon.rotation.y = ry
    gift.add(ribbon)
  }
  for (const s of [-1, 1]) {
    const loop = torus(0.065, 0.022, '#f6f0e4', { roughness: 0.4 })
    loop.position.set(s * 0.06, 0.37, 0)
    loop.rotation.set(0, Math.PI / 2, s * 0.6)
    loop.scale.set(1, 1, 0.7)
    gift.add(loop)
  }
  chao.add(gift)
  root.add(chao)

  // ---- mesa de festa com toalha rosa --------------------------------------
  const mesa = new THREE.Group()
  const board = rbox(TW, 0.05, TD, 0.02, TABLE_WOOD, { roughness: 0.6 })
  board.position.set(TX, TY - 0.05, TZ)
  mesa.add(board)
  const clothTop = rbox(TW + 0.08, 0.03, TD + 0.08, 0.014, PINK, { roughness: 0.9 })
  clothTop.position.set(TX, TY - 0.015, TZ)
  mesa.add(clothTop)
  // saia da toalha nos quatro lados
  const skirtFront = rbox(TW + 0.08, SKIRT, 0.03, 0.012, PINK, { roughness: 0.9 })
  skirtFront.position.set(TX, TY - SKIRT / 2, FRONT_Z - 0.015)
  mesa.add(skirtFront)
  const skirtBack = skirtFront.clone()
  skirtBack.position.z = TZ - TD / 2 - 0.025
  mesa.add(skirtBack)
  for (const s of [-1, 1]) {
    const side = rbox(0.03, SKIRT, TD + 0.08, 0.012, PINK, { roughness: 0.9 })
    side.position.set(TX + s * (TW / 2 + 0.025), TY - SKIRT / 2, TZ)
    mesa.add(side)
  }
  // renda branca na barra + bolinhas na frente
  const lace = rbox(TW + 0.1, 0.045, 0.04, 0.02, LACE, { roughness: 0.85 })
  lace.position.set(TX, TY - SKIRT + 0.012, FRONT_Z)
  mesa.add(lace)
  for (const s of [-1, 1]) {
    const laceSide = rbox(0.04, 0.045, TD + 0.1, 0.02, LACE, { roughness: 0.85 })
    laceSide.position.set(TX + s * (TW / 2 + 0.04), TY - SKIRT + 0.012, TZ)
    mesa.add(laceSide)
  }
  for (let i = 0; i < 9; i++) {
    for (const dy of [0.08, 0.17]) {
      const dot = cylinder(0.022, 0.022, 0.01, PINK_DARK, { roughness: 0.85 }, 16)
      dot.rotation.x = Math.PI / 2
      dot.position.set(TX - 1.15 + i * 0.29 + (dy > 0.1 ? 0.145 : 0), TY - SKIRT + dy, FRONT_Z + 0.002)
      mesa.add(dot)
    }
  }
  // pernas torneadas abaixo da saia
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = lathe(
        [[0, 0], [0.04, 0], [0.045, 0.04], [0.03, 0.12], [0.038, 0.22], [0.035, TY - SKIRT - GY + 0.05], [0, TY - SKIRT - GY + 0.05]],
        TABLE_WOOD,
        { roughness: 0.6 },
        20,
      )
      leg.position.set(TX + sx * (TW / 2 - 0.12), GY, TZ + sz * (TD / 2 - 0.12))
      mesa.add(leg)
    }
  }
  // pratinhos e copinho na mesa
  for (const [px, pz] of [[0.95, -0.05], [-1.15, 0.05]] as const) {
    const plate = lathe([[0, 0], [0.11, 0], [0.14, 0.02], [0.15, 0.025], [0, 0.012]], '#ffffff', { roughness: 0.3 })
    plate.position.set(px, TY, pz)
    mesa.add(plate)
  }
  const cup = lathe([[0, 0], [0.045, 0], [0.06, 0.13], [0.055, 0.13], [0.04, 0.012], [0, 0.012]], '#e86a8a', { roughness: 0.5 })
  cup.position.set(0.98, TY, -0.62)
  mesa.add(cup)
  root.add(mesa)

  // ---- bolo de chantilly com morangos --------------------------------------
  const bolo = new THREE.Group()
  bolo.position.set(CAKE_X, TY, CAKE_Z)
  const plate = cylinder(0.44, 0.4, 0.03, '#ffffff', { roughness: 0.3 }, 40)
  plate.position.y = 0.015
  bolo.add(plate)
  const cake = lathe(
    [[0, 0.03], [0.35, 0.03], [0.36, 0.05], [0.355, CAKE_H - 0.02], [0.33, CAKE_H], [0, CAKE_H + 0.005]],
    FROSTING,
    { roughness: 0.75 },
  )
  bolo.add(cake)
  const border = torus(0.355, 0.022, '#f3b6c4', { roughness: 0.7 })
  border.rotation.x = Math.PI / 2
  border.position.y = 0.06
  bolo.add(border)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const dollop = sphere(0.045, FROSTING, { roughness: 0.75 })
    dollop.scale.set(1, 0.8, 1)
    dollop.position.set(Math.cos(a) * 0.3, CAKE_H + 0.02, Math.sin(a) * 0.3)
    bolo.add(dollop)
    const tip = cone(0.03, 0.05, FROSTING, { roughness: 0.75 })
    tip.position.set(Math.cos(a) * 0.3, CAKE_H + 0.06, Math.sin(a) * 0.3)
    bolo.add(tip)
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3
    const rr = i === 0 ? 0 : 0.17
    const berry = sphere(0.05, STRAWBERRY, { roughness: 0.35 })
    berry.scale.set(1, 1.2, 1)
    const bx = i === 0 ? 0 : Math.cos(a) * rr
    const bz = i === 0 ? 0 : Math.sin(a) * rr
    berry.position.set(bx, CAKE_H + 0.055, bz)
    bolo.add(berry)
    const cap = cone(0.04, 0.03, '#3f8a3a', { roughness: 0.6 }, 6)
    cap.position.set(bx, CAKE_H + 0.115, bz)
    bolo.add(cap)
  }
  // chantilly espirrado onde a proa entrou
  for (let i = 0; i < 6; i++) {
    const splash = sphere(0.035 + rand() * 0.025, FROSTING, { roughness: 0.75 })
    splash.position.set(-0.36 - rand() * 0.06, 0.08 + rand() * 0.2, -0.05 + (rand() - 0.5) * 0.3)
    bolo.add(splash)
  }
  root.add(bolo)

  // ---- caravelinha GAMA encalhada no bolo ----------------------------------
  const caravela = new THREE.Group()
  caravela.position.set(SHIP_X, SHIP_Y, SHIP_Z)
  caravela.rotation.z = SHIP_TILT
  const hull = rbox(0.78, 0.2, 0.28, 0.07, HULL, { roughness: 0.6 })
  hull.position.y = 0.1
  caravela.add(hull)
  const bow = cone(0.13, 0.26, HULL, { roughness: 0.6 })
  bow.rotation.z = -Math.PI / 2
  bow.scale.set(0.8, 1, 1.05)
  bow.position.set(0.47, 0.11, 0)
  caravela.add(bow)
  const keel = rbox(0.7, 0.04, 0.06, 0.02, HULL_DARK, { roughness: 0.7 })
  keel.position.y = 0.0
  caravela.add(keel)
  const railTop = rbox(0.8, 0.035, 0.3, 0.015, HULL_DARK, { roughness: 0.7 })
  railTop.position.y = 0.205
  caravela.add(railTop)
  const castle = rbox(0.24, 0.13, 0.27, 0.03, HULL_DARK, { roughness: 0.7 })
  castle.position.set(-0.27, 0.27, 0)
  caravela.add(castle)
  // faixa creme com GAMA pintado, virada para a câmera
  const band = rbox(0.56, 0.15, 0.014, 0.02, CREAM, { roughness: 0.5 })
  band.position.set(0.0, 0.105, 0.142)
  caravela.add(band)
  const word: ['G' | 'A' | 'M', number][] = [['G', -0.195], ['A', -0.065], ['M', 0.068], ['A', 0.198]]
  for (const [glyph, lx] of word) {
    const l = letter(glyph)
    l.position.set(lx, 0.105, 0.152)
    caravela.add(l)
  }
  // mastro, verga e vela com a cruz vermelha
  const mast = cylinder(0.018, 0.024, 0.82, HULL_DARK, { roughness: 0.6 })
  mast.position.set(0.04, 0.6, 0)
  caravela.add(mast)
  const yard = cylinder(0.014, 0.014, 0.48, HULL_DARK, { roughness: 0.6 })
  yard.rotation.z = Math.PI / 2
  yard.position.set(0.04, 0.88, 0.03)
  caravela.add(yard)
  const sail = rbox(0.44, 0.46, 0.02, 0.03, SAIL, { roughness: 0.85 })
  sail.position.set(0.04, 0.64, 0.05)
  sail.rotation.x = -0.08
  caravela.add(sail)
  const crossV = rbox(0.06, 0.32, 0.012, 0.012, RED, { roughness: 0.6 })
  crossV.position.set(0.04, 0.64, 0.068)
  crossV.rotation.x = -0.08
  caravela.add(crossV)
  const crossH = rbox(0.28, 0.06, 0.012, 0.012, RED, { roughness: 0.6 })
  crossH.position.set(0.04, 0.67, 0.066)
  crossH.rotation.x = -0.08
  caravela.add(crossH)
  const flag = cone(0.04, 0.14, RED, { roughness: 0.6 }, 3)
  flag.rotation.z = -Math.PI / 2
  flag.scale.set(1, 1, 0.2)
  flag.position.set(0.11, 0.98, 0)
  caravela.add(flag)
  root.add(caravela)

  // ---- cadeira com três balões ---------------------------------------------
  const baloes = new THREE.Group()
  const chair = new THREE.Group()
  chair.position.set(-1.95, GY, -0.95)
  chair.rotation.y = 0.35
  const seat = rbox(0.44, 0.05, 0.42, 0.02, CHAIR, { roughness: 0.55 })
  seat.position.y = 0.44
  chair.add(seat)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = cylinder(0.022, 0.025, 0.44, CHAIR, { roughness: 0.55 }, 12)
      leg.position.set(sx * 0.18, 0.22, sz * 0.17)
      chair.add(leg)
    }
    const post = cylinder(0.022, 0.022, 0.52, CHAIR, { roughness: 0.55 }, 12)
    post.position.set(sx * 0.18, 0.72, -0.18)
    chair.add(post)
  }
  const backRail = rbox(0.46, 0.09, 0.04, 0.02, CHAIR, { roughness: 0.55 })
  backRail.position.set(0, 0.94, -0.18)
  chair.add(backRail)
  const midRail = rbox(0.4, 0.05, 0.03, 0.015, CHAIR, { roughness: 0.55 })
  midRail.position.set(0, 0.72, -0.18)
  chair.add(midRail)
  baloes.add(chair)
  chair.updateMatrixWorld(true)
  const tie = new THREE.Vector3(0, 0.96, -0.18)
  chair.localToWorld(tie)
  const balloonDefs: [number, number, number, string][] = [
    [-2.25, 2.0, -1.2, '#f08a7e'],
    [-1.9, 2.22, -1.05, '#8fd0bd'],
    [-1.58, 1.92, -0.95, '#b9a3e3'],
  ]
  for (const [bx, by, bz, color] of balloonDefs) {
    const balloon = sphere(0.17, color, { roughness: 0.25 })
    balloon.scale.set(1, 1.18, 1)
    balloon.position.set(bx, by, bz)
    baloes.add(balloon)
    const knot = cone(0.03, 0.05, color, { roughness: 0.3 })
    knot.rotation.x = Math.PI
    knot.position.set(bx, by - 0.215, bz)
    baloes.add(knot)
    const shine = sphere(0.035, '#ffffff', { roughness: 0.1 })
    shine.position.set(bx - 0.06, by + 0.08, bz + 0.13)
    shine.scale.set(1, 1.4, 0.4)
    baloes.add(shine)
    baloes.add(rod(new THREE.Vector3(bx, by - 0.24, bz), tie, 0.005, '#d8d2c6', { roughness: 0.8 }))
  }
  root.add(baloes)

  // ---- menina aniversariante -----------------------------------------------
  const menina = person({ body: DRESS, skin: GIRL_SKIN, height: G_H, armAngle: 0.4 })
  menina.position.set(GIRL_X, GY, GIRL_Z)
  menina.rotation.y = GIRL_YAW
  const gHead = menina.getObjectByName('head') as THREE.Group
  const gR = G_H * 0.19
  const skirtFlare = lathe(
    [[0.27, 0.1], [0.265, 0.14], [0.235, 0.24], [0.2, 0.36], [0.19, 0.4]],
    DRESS,
    { roughness: 0.85 },
  )
  menina.add(skirtFlare)
  const hem = torus(0.268, 0.018, '#f7e3a8', { roughness: 0.85 })
  hem.rotation.x = Math.PI / 2
  hem.position.y = 0.105
  menina.add(hem)
  const collar = torus(0.13, 0.025, '#ffffff', { roughness: 0.8 })
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.6
  menina.add(collar)
  const hair = sphere(gR * 1.04, HAIR, { roughness: 0.85 })
  hair.position.set(0, gR * 0.22, -gR * 0.2)
  gHead.add(hair)
  const bangs = puff(gR * 0.36, HAIR, 4, 9, { roughness: 0.85 })
  bangs.position.set(0, gR * 0.8, gR * 0.5)
  bangs.scale.set(1.5, 0.55, 0.8)
  gHead.add(bangs)
  for (const s of [-1, 1]) {
    const tail = sphere(gR * 0.36, HAIR, { roughness: 0.85 })
    tail.position.set(s * gR * 1.05, -gR * 0.05, -gR * 0.25)
    tail.scale.set(0.9, 1.2, 0.9)
    gHead.add(tail)
    const band2 = torus(gR * 0.14, gR * 0.06, '#e86a8a', { roughness: 0.5 })
    band2.position.set(s * gR * 0.88, gR * 0.12, -gR * 0.2)
    band2.rotation.y = Math.PI / 2
    gHead.add(band2)
    const cheek = sphere(gR * 0.14, '#f2a0a0', { roughness: 0.7 })
    cheek.position.set(s * gR * 0.52, -gR * 0.25, gR * 0.78)
    cheek.scale.z = 0.4
    gHead.add(cheek)
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(gR * 0.2, gR * 0.045, 8, 20, Math.PI), mat('#7a3530', { roughness: 0.5 }))
  smile.rotation.z = Math.PI
  smile.position.set(0, -gR * 0.36, gR * 0.93)
  gHead.add(smile)
  // chapeuzinho de festa listrado
  const hat = new THREE.Group()
  hat.position.set(gR * 0.15, gR * 0.95, 0)
  hat.rotation.z = -0.22
  const hatCone = cone(0.1, 0.3, HAT, { roughness: 0.6 })
  hatCone.position.y = 0.15
  hat.add(hatCone)
  for (const hy of [0.05, 0.13, 0.21]) {
    const ring = torus(0.1 * (1 - hy / 0.3) + 0.002, 0.012, '#ffffff', { roughness: 0.6 })
    ring.rotation.x = Math.PI / 2
    ring.position.y = hy
    hat.add(ring)
  }
  const pom = puff(0.04, '#ffffff', 4, 3, { roughness: 0.9 })
  pom.position.y = 0.31
  hat.add(pom)
  gHead.add(hat)

  // braço que ergue a vela: pivô no ombro
  const bracoMenina = menina.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoMenina, G_H)
  const G_ARM_REST = bracoMenina.rotation.z
  const G_ARM_UP = 2.95
  bracoMenina.rotation.z = G_ARM_UP
  root.add(menina)

  // ---- duende ancião ---------------------------------------------------------
  const duende = new THREE.Group()
  duende.position.set(DX, TY, DZ)
  duende.rotation.y = D_YAW
  const corpo = person({ body: MOSS, skin: OLIVE, height: D_H, armAngle: 0.35 })
  corpo.rotation.x = 0.1 // encurvado
  duende.add(corpo)
  const dR = D_H * 0.19
  const bodyH = D_H * 0.52
  // túnica: barra mais larga e cinto de corda
  const tunicHem = lathe(
    [[0.22, 0.06], [0.215, 0.1], [0.195, 0.2], [0.18, 0.26]],
    MOSS,
    { roughness: 0.9 },
  )
  corpo.add(tunicHem)
  const belt = torus(0.19, 0.022, ROPE, { roughness: 0.9 })
  belt.rotation.x = Math.PI / 2
  belt.position.y = bodyH * 0.42
  corpo.add(belt)
  const knotB = sphere(0.035, ROPE, { roughness: 0.9 })
  knotB.position.set(0.11, bodyH * 0.42, 0.16)
  corpo.add(knotB)
  for (const k of [0, 1]) {
    const end = capsule(0.014, 0.1, ROPE, { roughness: 0.9 })
    end.position.set(0.11 + k * 0.03, bodyH * 0.42 - 0.08, 0.17)
    end.rotation.z = 0.15 - k * 0.3
    corpo.add(end)
  }

  const dHead = corpo.getObjectByName('head') as THREE.Group
  // nariz comprido e fino
  const nose = cone(0.036, 0.24, OLIVE_DARK, { roughness: 0.7 })
  nose.rotation.x = Math.PI / 2 + 0.35
  nose.position.set(0, -0.01, dR * 0.95 + 0.08)
  dHead.add(nose)
  const noseTip = sphere(0.022, OLIVE_DARK, { roughness: 0.7 })
  noseTip.position.set(0, -0.055, dR * 0.95 + 0.19)
  dHead.add(noseTip)
  // orelhas pontudas enormes
  for (const s of [-1, 1]) {
    const ear = cone(0.075, 0.34, OLIVE, { roughness: 0.75 })
    ear.scale.set(1, 1, 0.35)
    ear.rotation.set(0, s * 0.25, -s * (Math.PI / 2 - 0.35))
    ear.position.set(s * (dR + 0.12), 0.06, -0.02)
    dHead.add(ear)
    const inner = cone(0.045, 0.24, '#b58a6a', { roughness: 0.8 })
    inner.scale.set(1, 1, 0.3)
    inner.rotation.set(0, s * 0.25, -s * (Math.PI / 2 - 0.35))
    inner.position.set(s * (dR + 0.11), 0.055, 0.008)
    dHead.add(inner)
    // sobrancelhas brancas enormes
    const brow = puff(0.042, BEARD, 4, 12 + s, { roughness: 0.95 })
    brow.position.set(s * dR * 0.42, dR * 0.42, dR * 0.86)
    brow.scale.set(1.9, 0.75, 0.9)
    brow.rotation.z = -s * 0.35
    dHead.add(brow)
    // rugas de casca de árvore
    for (let k = 0; k < 3; k++) {
      const wr = capsule(0.006, 0.05, OLIVE_DARK, { roughness: 0.9 })
      wr.rotation.z = Math.PI / 2 - s * (0.25 + k * 0.25)
      wr.position.set(s * dR * 0.72, dR * (0.1 - k * 0.12), dR * 0.72)
      wr.rotation.y = s * 0.7
      dHead.add(wr)
    }
  }
  for (let k = 0; k < 3; k++) {
    const fw = capsule(0.007, 0.1 - k * 0.02, OLIVE_DARK, { roughness: 0.9 })
    fw.rotation.z = Math.PI / 2
    fw.position.set(0, dR * (0.62 + k * 0.1), dR * (0.8 - k * 0.08))
    dHead.add(fw)
  }
  // bigode e boca em bico
  const stache = puff(0.05, BEARD, 4, 21, { roughness: 0.95 })
  stache.position.set(0, -dR * 0.32, dR * 0.92)
  stache.scale.set(1.9, 0.6, 0.7)
  dHead.add(stache)
  const lips = torus(0.026, 0.014, '#7a4a3a', { roughness: 0.5 })
  lips.position.set(0, -dR * 0.56, dR * 0.98)
  dHead.add(lips)
  const mouthHole = sphere(0.022, '#2a1612', { roughness: 0.6 })
  mouthHole.position.set(0, -dR * 0.56, dR * 0.94)
  dHead.add(mouthHole)
  // capuz pontudo de folhas
  const capuz = new THREE.Group()
  capuz.position.set(0, dR * 0.28, -dR * 0.12)
  capuz.rotation.x = -0.5
  const hood = lathe(
    [[0, 0.02], [dR * 1.12, 0], [dR * 1.1, 0.08], [dR * 0.85, 0.2], [dR * 0.5, 0.34], [dR * 0.18, 0.46], [0, 0.52]],
    HOOD,
    { roughness: 0.85 },
  )
  capuz.add(hood)
  const tipLeaf = sphere(0.05, '#6aa84f', { roughness: 0.8 })
  tipLeaf.scale.set(0.5, 1.4, 0.25)
  tipLeaf.position.y = 0.55
  tipLeaf.rotation.z = 0.5
  capuz.add(tipLeaf)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const leafC = ['#5f9a45', '#3f7030', '#6aa84f'][i % 3]
    const leafM = sphere(0.055, leafC, { roughness: 0.8 })
    leafM.scale.set(0.55, 1.2, 0.22)
    leafM.position.set(Math.cos(a) * dR * 1.12, -0.01, Math.sin(a) * dR * 1.12)
    leafM.rotation.set(0, -a + Math.PI / 2, 0)
    capuz.add(leafM)
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3
    const leafM = sphere(0.045, i % 2 ? '#5f9a45' : '#3f7030', { roughness: 0.8 })
    leafM.scale.set(0.55, 1.2, 0.22)
    leafM.position.set(Math.cos(a) * dR * 0.75, 0.2, Math.sin(a) * dR * 0.75)
    leafM.rotation.set(0.3, -a + Math.PI / 2, 0)
    capuz.add(leafM)
  }
  dHead.add(capuz)

  // braço da bengala: pivô no ombro, aponta pra menina
  const bracoDuende = corpo.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoDuende, D_H)
  const D_ARM_REST_Z = bracoDuende.rotation.z
  const D_ARM_X = -1.3
  const D_ARM_Z = 0.62
  bracoDuende.rotation.set(D_ARM_X, 0, D_ARM_Z)
  const dHand = bracoDuende.children[0]

  // bengala de galho torto, ao longo do braço (−y local)
  const bengala = new THREE.Group()
  bengala.position.copy(dHand.position)
  const pts = [
    new THREE.Vector3(0.0, 0.1, 0),
    new THREE.Vector3(0.035, -0.2, 0.01),
    new THREE.Vector3(-0.02, -0.42, 0.0),
    new THREE.Vector3(0.025, -0.64, -0.01),
  ]
  for (let i = 0; i < pts.length - 1; i++) {
    bengala.add(rod(pts[i], pts[i + 1], 0.024 - i * 0.003, STICK, { roughness: 0.85 }))
    const joint = sphere(0.027 - i * 0.003, STICK, { roughness: 0.85 })
    joint.position.copy(pts[i])
    bengala.add(joint)
  }
  const tipK = sphere(0.018, STICK, { roughness: 0.85 })
  tipK.position.copy(pts[3])
  bengala.add(tipK)
  const twig = rod(pts[1], new THREE.Vector3(0.11, -0.3, 0.02), 0.009, STICK, { roughness: 0.85 })
  bengala.add(twig)
  const twigLeaf = sphere(0.03, '#6aa84f', { roughness: 0.8 })
  twigLeaf.scale.set(0.5, 1.2, 0.25)
  twigLeaf.position.set(0.12, -0.33, 0.02)
  twigLeaf.rotation.z = 0.6
  bengala.add(twigLeaf)
  bracoDuende.add(bengala)
  root.add(duende)

  // ---- vela de número 5 na mão da menina -----------------------------------
  root.updateMatrixWorld(true)
  const vela = new THREE.Group()
  const T5 = 0.055
  const D5 = 0.06
  const seg5: [number, number, number, number][] = [
    [0.18, T5, 0, 0.15 - T5 / 2],
    [T5, 0.15, -0.09 + T5 / 2, 0.075],
    [0.18, T5, 0, 0],
    [T5, 0.15, 0.09 - T5 / 2, -0.075],
    [0.18, T5, 0, -0.15 + T5 / 2],
  ]
  for (const [w, h, x, y] of seg5) {
    const s = rbox(w, h, D5, 0.022, CANDLE, { roughness: 0.4 })
    s.position.set(x, y, 0)
    vela.add(s)
  }
  const spike = cylinder(0.016, 0.016, 0.14, '#f4efe4', { roughness: 0.5 }, 12)
  spike.position.set(0.0, -0.21, 0)
  vela.add(spike)
  const wick = cylinder(0.006, 0.006, 0.04, '#2a2420', { roughness: 0.8 }, 8)
  wick.position.set(-0.04, 0.17, 0)
  vela.add(wick)
  const flame = sphere(0.035, '#ffd27a', { emissive: FLAME, emissiveIntensity: 1.6 })
  flame.scale.set(1, 1.9, 1)
  flame.position.set(-0.04, 0.235, 0)
  vela.add(flame)
  const flameCore = sphere(0.018, '#fff4c8', { emissive: '#ffe9a3', emissiveIntensity: 2.0 })
  flameCore.scale.set(1, 1.6, 1)
  flameCore.position.set(-0.04, 0.215, 0.012)
  vela.add(flameCore)
  // pendura na mão, mas de frente pra câmera e em pé
  const gHand = bracoMenina.children[0]
  const velaWorld = new THREE.Vector3()
  gHand.getWorldPosition(velaWorld)
  velaWorld.y += 0.2
  vela.position.copy(gHand.worldToLocal(velaWorld.clone()))
  const handQ = new THREE.Quaternion()
  gHand.getWorldQuaternion(handQ)
  vela.quaternion.copy(handQ.invert().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.05, 0))))
  gHand.add(vela)

  // ---- barba: do queixo, pela toalha, despenca da mesa e dobra em L no chão --
  const chin = new THREE.Vector3(0, -dR * 0.78, dR * 0.62)
  dHead.localToWorld(chin)
  const fwd = new THREE.Vector3(Math.sin(D_YAW), 0, Math.cos(D_YAW))
  const lat = new THREE.Vector3(Math.cos(D_YAW), 0, -Math.sin(D_YAW))
  const chest = new THREE.Vector3(DX, TY + 0.32, DZ).addScaledVector(fwd, 0.3)
  const lap = new THREE.Vector3(DX, TY + 0.05, DZ).addScaledVector(fwd, 0.38)
  const edgeX = lap.x + 0.04
  const route = [
    chin,
    chest,
    lap,
    new THREE.Vector3(edgeX, TY + 0.04, FRONT_Z - 0.03),
    new THREE.Vector3(edgeX, TY - 0.01, FRONT_Z + 0.05),
    new THREE.Vector3(edgeX, GY + 0.12, FRONT_Z + 0.07),
    new THREE.Vector3(edgeX + 0.07, GY + 0.045, FRONT_Z + 0.1),
    new THREE.Vector3(edgeX + 0.58, GY + 0.04, FRONT_Z + 0.1),
  ]
  const barba = new THREE.Group()
  barba.position.copy(chin)
  let total = 0
  const lens: number[] = []
  for (let i = 0; i < route.length - 1; i++) {
    lens.push(route[i].distanceTo(route[i + 1]))
    total += lens[lens.length - 1]
  }
  const step = 0.028
  const brand = rng(77)
  let acc = 0
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]
    const b = route[i + 1]
    const n = Math.max(1, Math.round(lens[i] / step))
    for (let k = 0; k < n; k++) {
      const p = new THREE.Vector3().lerpVectors(a, b, k / n)
      const u = (acc + (lens[i] * k) / n) / total
      const r = 0.09 - 0.04 * u + (brand() - 0.5) * 0.012
      const onFloor = p.y < GY + 0.1
      const local = p.clone().sub(chin)
      const jitter = () => (brand() - 0.5) * 0.016
      const lump = sphere(r, brand() > 0.35 ? BEARD : BEARD_SHADE, { roughness: 0.95 }, 16)
      lump.position.set(local.x + jitter(), local.y + jitter(), local.z + jitter())
      if (onFloor) lump.scale.set(1, 0.8, 1)
      barba.add(lump)
      // em cima: barba larga, três mechas lado a lado
      if (u < 0.2) {
        const spread = 0.07 * (1 - u / 0.2)
        for (const s of [-1, 1]) {
          const side = sphere(r * 0.8, BEARD, { roughness: 0.95 }, 16)
          side.position.copy(local).addScaledVector(lat, s * spread)
          barba.add(side)
        }
      }
    }
    acc += lens[i]
  }
  // pontinha enrolada no fim do L
  const curl = torus(0.035, 0.018, BEARD, { roughness: 0.95 })
  curl.rotation.x = Math.PI / 2
  curl.position.copy(route[route.length - 1]).sub(chin)
  curl.position.x += 0.03
  barba.add(curl)
  root.add(barba)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'chao', group: 'sala', object: chao },
    { name: 'mesa', group: 'sala', object: mesa },
    { name: 'bolo', group: 'festa', object: bolo },
    { name: 'baloes', group: 'festa', object: baloes },
    { name: 'menina', group: 'menina', object: menina },
    { name: 'bracoMenina', group: 'menina', object: bracoMenina },
    { name: 'caravela', group: 'caravela', object: caravela },
    { name: 'duende', group: 'duende', object: duende },
    { name: 'capuz', group: 'duende', object: capuz },
    { name: 'barba', group: 'barba', object: barba },
    { name: 'bracoDuende', group: 'bengala', object: bracoDuende },
    { name: 'bengala', group: 'bengala', object: bengala },
    { name: 'vela', group: 'vela', object: vela },
  ]

  const CAP_Y = capuz.position.y
  const S = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('chao-rise', 'chao', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Festa de cinco anos da caçula: a sala, a mesa de toalha rosa…',
    }),
    seq('mesa-rise', 'mesa', 0.25, 0.9, [riseFrom(0, 1.4)], { ease: 'easeOut' }),
    seq('bolo-pop', 'bolo', 1.0, 0.6, [...S(0.01, 1)], { ease: 'easeOut' }),
    seq('baloes-rise', 'baloes', 1.15, 0.9, [riseFrom(0, 1.6)], { ease: 'easeOut' }),

    seq('menina-rise', 'menina', 1.8, 0.8, [riseFrom(GY, 1.4)], {
      ease: 'easeOut',
      caption: '…o bolo, os balões e a aniversariante de chapeuzinho, esperando o parabéns.',
    }),
    seq('menina-braco-repouso', 'bracoMenina', 1.8, 0.6, [ch('rotation.z', G_ARM_REST - 0.3, G_ARM_REST)], { ease: 'easeOut' }),

    seq(
      'caravela-navega',
      'caravela',
      3.0,
      1.1,
      [ch('position.x', -1.75, SHIP_X), ...S(0.3, 1)],
      {
        ease: 'easeOut',
        caption: 'No meio do parabéns, uma caravela atravessa a mesa e encalha no bolo: no casco, GAMA — de Vasco da GAMA!',
      },
    ),
    seq('caravela-encalha', 'caravela', 3.95, 0.35, [ch('rotation.z', 0, SHIP_TILT)], { ease: 'easeOut' }),

    seq(
      'duende-desembarca',
      'duende',
      5.0,
      0.9,
      [ch('position.x', SHIP_X + 0.05, DX), ch('position.z', SHIP_Z, DZ), ...S(0.25, 1)],
      {
        ease: 'easeInOut',
        caption: 'Dela desembarca o DUENDE da família, que jura ter navegado com Vasco da GAMA.',
      },
    ),
    seq('duende-pula', 'duende', 5.0, 0.45, [ch('position.y', SHIP_Y + 0.2, TY + 0.55)], { ease: 'easeOut' }),
    seq('duende-cai', 'duende', 5.45, 0.45, [ch('position.y', TY + 0.55, TY)], { ease: 'easeIn' }),
    seq('duende-braco-repouso', 'bracoDuende', 5.0, 0.5, [ch('rotation.x', 0, 0), ch('rotation.z', D_ARM_REST_Z, D_ARM_REST_Z)]),
    seq('capuz-pop', 'capuz', 5.0, 0.5, [ch('position.y', CAP_Y + 0.15, CAP_Y), ...S(0.6, 1)], { ease: 'easeOut' }),

    seq('pigarro-a', 'duende', 6.3, 0.18, [ch('rotation.z', 0, 0.08)], {
      caption: 'Ele limpa um pigarro de quinhentos anos — RRÜR!…',
    }),
    seq('pigarro-b', 'duende', 6.48, 0.18, [ch('rotation.z', 0.08, -0.08)]),
    seq('pigarro-c', 'duende', 6.66, 0.2, [ch('rotation.z', -0.08, 0)]),

    seq(
      'barba-despenca',
      'barba',
      7.2,
      1.3,
      [ch('scale.y', 0.02, 1), ch('scale.x', 0.4, 1), ch('scale.z', 0.4, 1)],
      {
        ease: 'easeIn',
        caption: '…e a barba despenca da mesa e dobra em L no chão: GÁMA-L!',
      },
    ),

    seq('bengala-surge', 'bengala', 9.0, 0.4, [...S(0.01, 1)], {
      ease: 'easeOut',
      caption: 'Aponta a bengala pra aniversariante, de bico esticado: É DÜ?',
    }),
    seq('braco-aponta-x', 'bracoDuende', 9.0, 0.7, [ch('rotation.x', 0, D_ARM_X), ch('rotation.z', D_ARM_REST_Z, D_ARM_Z)], { ease: 'easeOut' }),

    seq('vela-surge', 'vela', 10.4, 0.4, [...S(0.01, 1)], {
      ease: 'easeOut',
      caption: 'Ela ergue a vela de número 5 — e o duende, que perdeu a conta lá pelos anos 1500, fica de queixo caído.',
    }),
    seq('menina-ergue', 'bracoMenina', 10.4, 0.8, [ch('rotation.z', G_ARM_REST, G_ARM_UP)], { ease: 'easeOut' }),

    seq('menina-pulinho', 'menina', 12.0, 0.25, [ch('position.y', GY, GY + 0.08)], {
      ease: 'easeOut',
      caption: 'Hur gammal är du? — Quantos anos você tem?',
    }),
    seq('menina-assenta', 'menina', 12.25, 0.25, [ch('position.y', GY + 0.08, GY)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 2.4, 4.15], target: [0.12, 1.22, -0.25] },
  }
}

export const card: Card = {
  meta: {
    id: 'hur-gammal-ar-du',
    contexto:
      'Small talk com crianças: a pergunta que todo adulto faz no parquinho, na festa de aniversário, no dentista — e que as crianças devolvem sem cerimônia. A resposta: \'Jag är fem (år)\', tenho cinco (anos).',
    fraseFonte: 'Quantos anos você tem?',
    fraseAlvo: 'Hur gammal är du?',
    pronuncia:
      "rrür GÁM-mal é dü? ('hur' com h soprado, Ü de bico e R brando que quase some antes do G; 'gammal' com a força no GAM, A curto e aberto, sem nasal, M dobrado e L de verdade no fim; 'är du' = é dü, com Ü de bico)",
    ponteSonora:
      "RRÜR! GÁMA-L... É DÜ? (5 sílabas: rrür-GÁM-mal-é-dü; força no GÁM; RRÜR = o 'hur' de sempre — o MESMO de 'Hur mår du?', 'Hur långt är det?' e 'Hur var det i skolan?': h soprado como RR carioca leve, Ü DE BICO (lábios de U, língua de I, nunca o U chapado de 'urso') e R BRANDO no fim, que quase some antes do G — aqui é o pigarro de quinhentos anos do duende; GÁMA-L = o GAMA de VASCO DA GAMA, que o duende jura ter acompanhado — está pintado no casco da caravela —, com um L de verdade colado no fim: força no GÁ, A CURTO e ABERTO, de 'gato', SEM o 'gã' nasal que o português põe antes de M; o M é demorado (é 'mm', dobrado); o -A do fim vira um 'a' fraquinho e a palavra fecha num L DE PONTA DE LÍNGUA, grudada no céu da boca — a barba do duende, que bate no chão e dobra em L —, nunca o 'GÁ-mau' com o L virando U; esse L já escorrega no É seguinte: GÁM-ma-lé; sem o L sobra 'gamma', que não é nada; É DÜ = o 'är du' de sempre: É aberto e curto e DÜ com BICO DE PATO, o 'du' de CAN-DU, apontado pra criança)",
    historia:
      "Festa de cinco anos da caçula: no meio do parabéns, uma caravela de brinquedo atravessa a mesa e encalha no bolo. Dela desembarca o DUENDE da família, que jura ter navegado com Vasco da GAMA — o nome ainda está pintado no casco. Ele limpa um pigarro de quinhentos anos, RRÜR, arrasta pela toalha a barba — tão comprida que despenca da mesa e dobra em L no chão — e aponta a bengala pra aniversariante, de bico esticado: 'RRÜR... GÁMA-L... É DÜ?' A menina ergue a vela de número 5, e o duende, que perdeu a conta da própria idade lá pelos anos 1500, fica de queixo caído: quantos anos você tem?",
  },
  createScene,
}

export default card
