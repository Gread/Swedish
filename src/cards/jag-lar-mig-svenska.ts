import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag lär mig svenska." — IÁ LÉÉR MÊI SVÉN-SKA!
 *
 * No picadeiro, o palhaço aprende sueco lendo uma MEIA (MÊI) listrada
 * gigante aberta como livro. A meia tem CHULÉ: ele lê de boca escancarada
 * de nojo, esticando o É — LÉÉÉR! — equilibrado no skate do SVEN SKAtista.
 *
 * Paleta: picadeiro bordô e dourado, macacão verde de bolinhas, skate azul,
 * meia vermelho/creme. Acento saturado RESERVADO: o verde-limão do chulé
 * (o É aberto de chuLÉ que vira o LÉR).
 */

const SOIL = '#3a2620'
const FLOOR = '#7a2a2a'
const FLOOR_LIGHT = '#8f3533'
const CURB = '#e0b03c'
const CURB_DARK = '#b98a26'
const SUIT = '#4f9a5a'
const DOT = '#f3efe6'
const FACE = '#f6f1ea'
const WIG = '#ec7a2a'
const NOSE = '#d8322c'
const SOCK_RED = '#c93a35'
const SOCK_CREAM = '#f2ead9'
const INK = '#1e1c22'
const SKATE = '#2f68c9'
const SKATE_DARK = '#234f9a'
const WHEEL = '#f1ede4'
const METAL = '#9aa1a9'
const SHOE = '#f0c22e'
const PLATE = '#f4ecd6'
const NAVY = '#1d2a4a'
const LIME = '#a6ea34' // acento RESERVADO: o chulé

const GY = 0.2 // topo do picadeiro
const DECK = GY + 0.27 // topo do shape do skate
const S = 1.15 // escala do palhaço
const BOOK_Y = 1.06
const BOOK_Z = 0.58
const BOOK_TILT = -0.6

/** Traço de letra da placa: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.025, 0.008, NAVY, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** S V E N — letras de traço grosso. */
function letter(which: 'S' | 'V' | 'E' | 'N') {
  const g = new THREE.Group()
  const t = 0.032
  if (which === 'S') {
    g.add(stroke(0.11, t, 0, 0.064))
    g.add(stroke(0.11, t, 0, 0))
    g.add(stroke(0.11, t, 0, -0.064))
    g.add(stroke(t, 0.07, -0.039, 0.032))
    g.add(stroke(t, 0.07, 0.039, -0.032))
  } else if (which === 'V') {
    g.add(stroke(t, 0.17, -0.028, 0, 0.32))
    g.add(stroke(t, 0.17, 0.028, 0, -0.32))
  } else if (which === 'E') {
    g.add(stroke(t, 0.16, -0.04, 0))
    g.add(stroke(0.1, t, 0.008, 0.064))
    g.add(stroke(0.08, t, -0.002, 0))
    g.add(stroke(0.1, t, 0.008, -0.064))
  } else {
    g.add(stroke(t, 0.16, -0.045, 0))
    g.add(stroke(t, 0.16, 0.045, 0))
    g.add(stroke(t, 0.19, 0, 0, 0.5))
  }
  return g
}

/** Fita de fumaça ondulada: tubo afunilado por uma curva em S, achatado. */
function smokeRibbon(seed: number, lean: number, height: number) {
  const rand = rng(seed)
  const phase = rand() * Math.PI
  const pts: THREE.Vector3[] = []
  const n = 14
  for (let i = 0; i <= n; i++) {
    const k = i / n
    pts.push(new THREE.Vector3(
      Math.sin(phase + k * Math.PI * 4) * 0.075 + lean * k,
      k * height,
      0,
    ))
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  const TS = 64
  const RS = 12
  const geo = new THREE.TubeGeometry(curve, TS, 0.05, RS, false)
  // afunila: grossa na base, fio na ponta
  const pos = geo.attributes.position
  const c = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    const ring = Math.floor(i / (RS + 1))
    const t = ring / TS
    curve.getPointAt(t, c)
    v.fromBufferAttribute(pos, i).sub(c).multiplyScalar(1 - 0.75 * t).add(c)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, mat(LIME, { roughness: 0.6, emissive: '#7fbf18', emissiveIntensity: 0.3 }))
  mesh.castShadow = true
  mesh.scale.z = 0.55
  const g = new THREE.Group()
  g.add(mesh)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(17)

  // ---- picadeiro: piso bordô com borda dourada -----------------------------
  const picadeiro = new THREE.Group()

  const soil = cylinder(2.66, 2.74, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  picadeiro.add(soil)

  const floor = cylinder(2.5, 2.5, 0.08, FLOOR, { roughness: 0.9 })
  floor.position.y = GY - 0.04
  picadeiro.add(floor)

  const inner = cylinder(1.55, 1.55, 0.012, FLOOR_LIGHT, { roughness: 0.9 })
  inner.position.y = GY + 0.002
  picadeiro.add(inner)
  const innerRing = torus(1.55, 0.03, CURB_DARK, { roughness: 0.6 })
  innerRing.rotation.x = Math.PI / 2
  innerRing.position.y = GY + 0.008
  picadeiro.add(innerRing)

  // borda do picadeiro: mureta dourada com tachas vermelhas
  const curb = lathe(
    [[2.42, GY - 0.02], [2.44, GY + 0.16], [2.5, GY + 0.2], [2.62, GY + 0.19], [2.66, GY + 0.1], [2.66, 0.0]],
    CURB,
    { roughness: 0.45 },
    64,
  )
  picadeiro.add(curb)
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2
    const stud = sphere(0.045, NOSE, { roughness: 0.4 })
    stud.position.set(Math.cos(a) * 2.54, GY + 0.2, Math.sin(a) * 2.54)
    picadeiro.add(stud)
  }

  // pedestal listrado de circo
  const pedestal = new THREE.Group()
  pedestal.position.set(-1.55, GY, -0.85)
  const drum = cylinder(0.34, 0.38, 0.42, SOCK_CREAM, { roughness: 0.6 })
  drum.position.y = 0.21
  pedestal.add(drum)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const band = rbox(0.12, 0.42, 0.03, 0.01, NOSE, { roughness: 0.6 })
    band.position.set(Math.cos(a) * 0.36, 0.21, Math.sin(a) * 0.36)
    band.rotation.y = -a + Math.PI / 2
    band.rotation.x = 0
    pedestal.add(band)
  }
  const drumTop = cylinder(0.37, 0.37, 0.05, CURB, { roughness: 0.45 })
  drumTop.position.y = 0.445
  pedestal.add(drumTop)
  picadeiro.add(pedestal)

  // bola de equilíbrio
  const ball = new THREE.Group()
  ball.position.set(1.6, GY + 0.22, -0.6)
  ball.rotation.set(0.4, rand() * Math.PI, 0.3)
  const ballCore = sphere(0.22, SKATE, { roughness: 0.35 })
  ball.add(ballCore)
  const ballBand = torus(0.205, 0.035, CURB, { roughness: 0.4 })
  ball.add(ballBand)
  picadeiro.add(ball)

  // claves de malabarismo caídas
  for (const [px, pz, ry] of [[0.7, -1.55, 0.6], [1.0, -1.4, -0.4]] as const) {
    const pin = lathe(
      [[0, 0], [0.035, 0.0], [0.03, 0.1], [0.07, 0.24], [0.06, 0.34], [0.025, 0.4], [0, 0.42]],
      DOT,
      { roughness: 0.4 },
    )
    pin.rotation.set(0, ry, Math.PI / 2)
    pin.position.set(px + 0.2, GY + 0.06, pz)
    const stripe = torus(0.062, 0.012, NOSE, { roughness: 0.4 })
    stripe.rotation.x = Math.PI / 2
    stripe.position.y = 0.27
    pin.add(stripe)
    picadeiro.add(pin)
  }
  root.add(picadeiro)

  // ---- skate azul do Sven ---------------------------------------------------
  const skate = new THREE.Group()
  skate.position.set(0, GY, 0)
  for (const tx of [-0.5, 0.5]) {
    const truck = rbox(0.12, 0.07, 0.34, 0.02, METAL, { metalness: 0.7, roughness: 0.35 })
    truck.position.set(tx, 0.17, 0)
    skate.add(truck)
    const axle = cylinder(0.018, 0.018, 0.46, METAL, { metalness: 0.7, roughness: 0.35 })
    axle.rotation.x = Math.PI / 2
    axle.position.set(tx, 0.09, 0)
    skate.add(axle)
    for (const wz of [-0.19, 0.19]) {
      const wheel = cylinder(0.09, 0.09, 0.075, WHEEL, { roughness: 0.4 })
      wheel.rotation.x = Math.PI / 2
      wheel.position.set(tx, 0.09, wz)
      skate.add(wheel)
      const hub = cylinder(0.035, 0.035, 0.08, METAL, { metalness: 0.7, roughness: 0.3 })
      hub.rotation.x = Math.PI / 2
      hub.position.set(tx, 0.09, wz)
      skate.add(hub)
    }
  }
  const deck = rbox(1.2, 0.06, 0.46, 0.03, SKATE, { roughness: 0.45 })
  deck.position.y = 0.24
  skate.add(deck)
  for (const side of [-1, 1]) {
    const kick = rbox(0.26, 0.06, 0.46, 0.03, SKATE, { roughness: 0.45 })
    kick.position.set(side * 0.71, 0.275, 0)
    kick.rotation.z = side * 0.32
    skate.add(kick)
    const nose = cylinder(0.23, 0.23, 0.06, SKATE, { roughness: 0.45 })
    nose.position.set(side * 0.82, 0.31, 0)
    nose.rotation.z = side * 0.32
    nose.scale.x = 0.45
    skate.add(nose)
  }
  const stripeDeck = rbox(1.6, 0.012, 0.06, 0.005, DOT, { roughness: 0.5 })
  stripeDeck.position.set(0, 0.272, -0.15)
  skate.add(stripeDeck)
  const rim = rbox(1.22, 0.02, 0.47, 0.01, SKATE_DARK, { roughness: 0.5 })
  rim.position.y = 0.212
  skate.add(rim)
  root.add(skate)

  // ---- placa SVEN presa na frente do skate ---------------------------------
  const placa = new THREE.Group()
  const PLACA_Y = GY + 0.15
  placa.position.set(0, PLACA_Y, 0.255)
  const plateBack = rbox(0.76, 0.23, 0.03, 0.03, PLATE, { roughness: 0.5 })
  placa.add(plateBack)
  const plateRim = rbox(0.8, 0.27, 0.02, 0.04, SKATE_DARK, { roughness: 0.5 })
  plateRim.position.z = -0.012
  placa.add(plateRim)
  const glyphs: ['S' | 'V' | 'E' | 'N', number][] = [['S', -0.24], ['V', -0.08], ['E', 0.08], ['N', 0.24]]
  for (const [gl, lx] of glyphs) {
    const l = letter(gl)
    l.position.set(lx, 0, 0.022)
    placa.add(l)
  }
  for (const bx of [-0.35, 0.35]) {
    const bolt = sphere(0.016, METAL, { metalness: 0.7, roughness: 0.3 })
    bolt.position.set(bx, 0.08, 0.018)
    placa.add(bolt)
  }
  root.add(placa)

  // ---- sapatões amarelos plantados no skate --------------------------------
  const sapatos = new THREE.Group()
  sapatos.position.set(0, DECK, 0)
  for (const side of [-1, 1]) {
    const shoe = sphere(0.15, SHOE, { roughness: 0.4 })
    shoe.scale.set(0.95, 0.55, 1.75)
    shoe.position.set(side * 0.2, 0.075, 0.05)
    shoe.rotation.y = side * 0.12
    sapatos.add(shoe)
    const sole = rbox(0.25, 0.04, 0.5, 0.02, '#8a5a2a', { roughness: 0.8 })
    sole.position.set(side * 0.2, 0.02, 0.05)
    sole.rotation.y = side * 0.12
    sapatos.add(sole)
    const lace = torus(0.04, 0.014, NOSE, { roughness: 0.6 })
    lace.position.set(side * 0.2 + side * 0.02, 0.15, 0.12)
    lace.rotation.x = -Math.PI / 2 + 0.3
    sapatos.add(lace)
  }
  root.add(sapatos)

  // ---- palhaço --------------------------------------------------------------
  const palhaco = person({ body: SUIT, skin: FACE, height: 1.5, armAngle: 0.3 })
  palhaco.position.set(0, DECK, 0)
  palhaco.scale.setScalar(S)
  palhaco.rotation.z = 0.05

  // bolinhas brancas no macacão (hemisfério da frente e lados)
  for (const [yy, r, off] of [[0.2, 0.235, 0], [0.34, 0.262, 0.35], [0.48, 0.262, 0], [0.62, 0.245, 0.35]] as const) {
    for (let k = -3; k <= 3; k++) {
      const a = k * 0.62 + off
      const dot = sphere(0.035, DOT, { roughness: 0.7 })
      dot.position.set(Math.sin(a) * r, yy, Math.cos(a) * r)
      dot.lookAt(new THREE.Vector3(Math.sin(a) * 2, yy, Math.cos(a) * 2))
      dot.scale.z = 0.35
      palhaco.add(dot)
    }
  }
  // gola de babados
  const ruff = new THREE.Group()
  ruff.position.y = 0.77
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const frill = sphere(0.07, DOT, { roughness: 0.75 })
    frill.position.set(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2)
    frill.scale.set(1, 0.6, 1)
    ruff.add(frill)
  }
  palhaco.add(ruff)

  // braços levam a meia à frente do peito
  for (const name of ['armL', 'armR']) {
    const arm = palhaco.getObjectByName(name)!
    shoulderPivot(arm, 1.5)
    const side = name === 'armL' ? -1 : 1
    arm.rotation.set(-1.05, 0, -side * 0.12)
  }

  const head = palhaco.getObjectByName('head') as THREE.Group
  head.rotation.x = 0.12 // olha para a meia

  // sobrancelhas de nojo: franzidas para o centro
  for (const side of [-1, 1]) {
    const brow = capsule(0.018, 0.07, INK, { roughness: 0.6 })
    brow.position.set(side * 0.1, 0.125, 0.245)
    brow.rotation.z = Math.PI / 2 + side * 0.4
    head.add(brow)
    // bochechas rosadas de palhaço
    const cheek = sphere(0.045, '#ef9a9a', { roughness: 0.7 })
    cheek.position.set(side * 0.17, -0.06, 0.22)
    cheek.scale.z = 0.4
    cheek.lookAt(new THREE.Vector3(side * 0.6, -0.1, 1))
    head.add(cheek)
  }

  // ---- peruca laranja em tufos (filha da cabeça) ---------------------------
  const peruca = new THREE.Group()
  for (const side of [-1, 1]) {
    const tuft = puff(0.13, WIG, 6, 20 + side, { roughness: 0.92 })
    tuft.position.set(side * 0.27, 0.06, -0.04)
    tuft.scale.set(1.05, 1.1, 1.1)
    peruca.add(tuft)
  }
  const topTuft = puff(0.09, WIG, 5, 27, { roughness: 0.92 })
  topTuft.position.set(0, 0.27, -0.06)
  peruca.add(topTuft)
  head.add(peruca)

  // ---- nariz vermelho (filho da cabeça) ------------------------------------
  const nariz = sphere(0.075, NOSE, { roughness: 0.25 })
  nariz.position.set(0, -0.02, 0.3)
  head.add(nariz)

  // ---- boca escancarada de nojo (filha da cabeça) --------------------------
  const boca = new THREE.Group()
  boca.position.set(0, -0.15, 0.235)
  const cavity = sphere(0.075, '#3a1518', { roughness: 0.7 })
  cavity.scale.set(1.3, 1.0, 0.5)
  boca.add(cavity)
  const lips = torus(0.078, 0.016, '#8e2a2e', { roughness: 0.5 })
  lips.scale.set(1.3, 1.0, 1)
  lips.position.z = 0.02
  boca.add(lips)
  const teeth = rbox(0.12, 0.026, 0.03, 0.01, '#fbfaf5', { roughness: 0.3 })
  teeth.position.set(0, 0.055, 0.02)
  boca.add(teeth)
  const tongue = sphere(0.045, '#d9707a', { roughness: 0.45 })
  tongue.scale.set(1.2, 0.6, 1)
  tongue.position.set(0, -0.05, 0.03)
  boca.add(tongue)
  boca.rotation.x = -0.1
  head.add(boca)

  // ---- óculos redondos na ponta do nariz (filhos da cabeça) ----------------
  const oculos = new THREE.Group()
  const OCULOS_Y = -0.03
  oculos.position.set(0, OCULOS_Y, 0.31)
  for (const side of [-1, 1]) {
    const lensRim = torus(0.06, 0.012, INK, { roughness: 0.35 })
    lensRim.position.set(side * 0.1, 0, 0)
    oculos.add(lensRim)
    const arm = rbox(0.012, 0.012, 0.2, 0.005, INK, { roughness: 0.35 })
    arm.position.set(side * 0.16, 0.02, -0.1)
    oculos.add(arm)
  }
  const bridge = torus(0.04, 0.01, INK, { roughness: 0.35 })
  bridge.position.set(0, 0.02, 0.0)
  bridge.scale.set(1, 0.6, 1)
  oculos.add(bridge)
  head.add(oculos)

  root.add(palhaco)

  // ---- a MEIA gigante aberta como livro -----------------------------------
  const meia = new THREE.Group()
  meia.position.set(0, BOOK_Y, BOOK_Z)

  const livro = new THREE.Group()
  livro.rotation.x = BOOK_TILT
  meia.add(livro)

  const PW = 0.38 // largura de cada página
  const PH = 0.56
  for (const side of [-1, 1]) {
    const half = new THREE.Group()
    half.rotation.y = -side * 0.16
    const slab = rbox(PW, PH, 0.04, 0.02, SOCK_RED, { roughness: 0.85 })
    slab.position.set(side * PW / 2, 0, 0)
    half.add(slab)
    // listras creme por cima, com as lições escritas
    for (const by of [0.16, 0, -0.16]) {
      const band = rbox(PW - 0.02, 0.08, 0.012, 0.004, SOCK_CREAM, { roughness: 0.85 })
      band.position.set(side * PW / 2, by, 0.022)
      half.add(band)
      for (const ly of [0.017, -0.017]) {
        const len = 0.18 + rand() * 0.1
        const line = rbox(len, 0.011, 0.006, 0.002, INK, { roughness: 0.7 })
        line.position.set(side * (0.03 + len / 2) + (side < 0 ? -0.0 : 0), by + ly, 0.03)
        if (side < 0) line.position.x = -(PW - 0.03 - len / 2)
        half.add(line)
      }
    }
    if (side > 0) {
      // o pé da meia sai do canto de baixo da página direita: a silhueta
      // inteira (cano aberto + pé) lê como UMA meia deitada no plano do livro
      const pe = new THREE.Group()
      pe.position.set(PW, -PH / 2 + 0.13, 0)
      pe.rotation.z = -0.22
      const sole = rbox(0.4, 0.26, 0.04, 0.12, SOCK_RED, { roughness: 0.85 })
      sole.position.x = 0.14
      pe.add(sole)
      for (const fx of [0.02, 0.14]) {
        const fb = rbox(0.07, 0.25, 0.012, 0.004, SOCK_CREAM, { roughness: 0.85 })
        fb.position.set(fx, 0, 0.022)
        pe.add(fb)
      }
      const heel = sphere(0.075, '#a82e2b', { roughness: 0.85 })
      heel.scale.set(1, 1, 0.25)
      heel.position.set(0.0, -0.08, 0.02)
      pe.add(heel)
      const toe = sphere(0.11, '#a82e2b', { roughness: 0.85 })
      toe.scale.set(0.9, 1.15, 0.25)
      toe.position.set(0.26, 0, 0.02)
      pe.add(toe)
      half.add(pe)
    }
    livro.add(half)
  }
  // lombada
  const spine = capsule(0.03, PH - 0.06, SOCK_RED, { roughness: 0.85 })
  spine.position.z = -0.01
  livro.add(spine)
  // punho canelado no alto (a boca da meia)
  const cuff = rbox(PW * 2 + 0.02, 0.08, 0.07, 0.03, SOCK_CREAM, { roughness: 0.9 })
  cuff.position.set(0, PH / 2 + 0.03, 0.0)
  livro.add(cuff)
  for (let i = -8; i <= 8; i++) {
    const rib = rbox(0.016, 0.085, 0.075, 0.006, '#e2d8c4', { roughness: 0.9 })
    rib.position.set(i * 0.045, PH / 2 + 0.03, 0.0)
    livro.add(rib)
  }

  root.add(meia)

  // ---- fumacinha de chulé ---------------------------------------------------
  const fumaca1 = smokeRibbon(3, -0.3, 0.7)
  fumaca1.position.set(-0.46, BOOK_Y + 0.08, BOOK_Z + 0.02)
  fumaca1.rotation.z = 0.25
  root.add(fumaca1)
  const fumaca2 = smokeRibbon(7, 0.3, 0.75)
  fumaca2.position.set(0.46, BOOK_Y + 0.08, BOOK_Z + 0.02)
  fumaca2.rotation.z = -0.25
  root.add(fumaca2)
  const fumaca3 = smokeRibbon(11, 0.25, 0.55)
  fumaca3.position.set(0.78, BOOK_Y - 0.12, BOOK_Z + 0.14)
  fumaca3.rotation.z = -0.35
  root.add(fumaca3)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'picadeiro', group: 'circo', object: picadeiro },
    { name: 'skate', group: 'skate', object: skate },
    { name: 'placa', group: 'skate', object: placa },
    { name: 'sapatos', group: 'palhaco', object: sapatos },
    { name: 'palhaco', group: 'palhaco', object: palhaco },
    { name: 'peruca', group: 'palhaco', object: peruca },
    { name: 'nariz', group: 'palhaco', object: nariz },
    { name: 'meia', group: 'meia', object: meia },
    { name: 'oculos', group: 'meia', object: oculos },
    { name: 'fumaca1', group: 'chule', object: fumaca1 },
    { name: 'fumaca2', group: 'chule', object: fumaca2 },
    { name: 'fumaca3', group: 'chule', object: fumaca3 },
    { name: 'boca', group: 'chule', object: boca },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('picadeiro-rise', 'picadeiro', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No picadeiro do circo, um palhaço resolveu aprender sueco do jeito dele…',
    }),

    seq('skate-rola', 'skate', 1.5, 0.8, [ch('position.x', -2.2, 0)], {
      ease: 'easeOut',
      caption: '…em cima do skate que pegou emprestado do SVEN SKAtista — SVÉN-SKA!',
    }),
    seq('placa-rola', 'placa', 1.5, 0.8, [ch('position.x', -2.2, 0)], { ease: 'easeOut' }),
    seq('placa-gira', 'placa', 2.3, 0.5, [ch('rotation.z', 0.25, 0)], { ease: 'easeOut' }),

    seq('sapatos-caem', 'sapatos', 3.4, 0.5, [ch('position.y', DECK + 1.6, DECK), ...grow(0.3)], {
      ease: 'easeIn',
      caption: 'IÁ! Plantam-se os sapatões… e brota o palhaço de nariz vermelho.',
    }),
    seq('palhaco-rise', 'palhaco', 3.9, 0.8, [riseFrom(DECK, 2.2)], { ease: 'easeOut' }),
    seq('palhaco-balanca', 'palhaco', 4.7, 0.6, [ch('rotation.z', -0.12, 0.05)], { ease: 'easeInOut' }),
    seq('peruca-pop', 'peruca', 4.6, 0.4, grow(), { ease: 'easeOut' }),
    seq('nariz-pop', 'nariz', 4.9, 0.35, grow(), { ease: 'easeOut' }),

    seq('meia-abre', 'meia', 6.0, 0.8, [...grow(0.05), ch('rotation.y', -1.6, 0)], {
      ease: 'easeOut',
      caption: 'As lições estão escritas numa MEIA listrada gigante — MÊI — que ele abre como um livro.',
    }),
    seq('oculos-descem', 'oculos', 6.9, 0.6, [ch('position.y', 0.22, OCULOS_Y), ...grow(0.4)], {
      ease: 'easeOut',
    }),

    seq('fumaca1-sobe', 'fumaca1', 8.1, 0.7, [ch('scale.y', 0.01, 1), ch('scale.x', 0.3, 1)], {
      ease: 'easeOut',
      caption: 'Óculos na ponta do nariz pra LER… mas a meia tem um CHULÉ medonho!',
    }),
    seq('fumaca2-sobe', 'fumaca2', 8.35, 0.7, [ch('scale.y', 0.01, 1), ch('scale.x', 0.3, 1)], { ease: 'easeOut' }),
    seq('fumaca3-sobe', 'fumaca3', 8.6, 0.7, [ch('scale.y', 0.01, 1), ch('scale.x', 0.3, 1)], { ease: 'easeOut' }),

    seq('boca-escancara', 'boca', 9.8, 0.7, [ch('scale.x', 0.2, 1), ch('scale.y', 0.1, 1), ch('scale.z', 0.5, 1)], {
      ease: 'easeOut',
      caption: 'De nojo, a boca escancara no É do chuLÉ: LÉÉÉR! — IÁ LÉÉR MÊI SVÉN-SKA!',
    }),
    seq('palhaco-recua', 'palhaco', 9.8, 0.5, [ch('rotation.z', 0.05, -0.04)], { ease: 'easeOut' }),
    seq('palhaco-volta', 'palhaco', 10.3, 0.7, [ch('rotation.z', -0.04, 0.05)], { ease: 'easeInOut' }),

    seq('meia-treme', 'meia', 11.4, 0.5, [ch('rotation.z', 0.06, 0)], {
      ease: 'easeOut',
      caption: 'Jag lär mig svenska. — Estou aprendendo sueco.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 1.95, 3.75], target: [0, 1.12, 0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-lar-mig-svenska',
    contexto:
      'Pra abrir qualquer conversa ou pedir paciência: no trabalho, com vizinhos, no caixa, ao telefone — antes que o outro troque pro inglês.',
    fraseFonte: 'Estou aprendendo sueco.',
    fraseAlvo: 'Jag lär mig svenska.',
    pronuncia:
      "iá LÉR mêi SVÉN-ska ('lär' com É BEM ABERTO e longo, quase puxando pra A — com ê fechado vira 'ler', que é sorrir; 'mig' = mêi, uma sílaba só; 'svenska' com força no SVÉN)",
    ponteSonora:
      "IÁ LÉÉR MÊI SVÉN-SKA! (5 sílabas: iá-LÉR-mêi-SVÉN-ska; tônicas em LÉR e SVÉN; LÉÉR = LER, mas com o É BEM ABERTO de chuLÉ — a meia fede, e a cara de nojo escancara a boca no É: longo, quase puxando pra A; com o ê fechado do 'ler' português sai 'ler', que em sueco é SORRIR; o R final é BRANDO e quase gruda no M; MÊI é a MEIA sem o -a, UMA sílaba só, o mesmo 'mig' de 'Jag har låst mig ute'; SVÉN-SKA é o SVEN SKAtista do card 'Jag pratar inte så bra svenska': força no SVÉN, É aberto e N batido na língua, e o SKA curtinho de SKAtista — nunca o 'skêit' do inglês)",
    historia:
      'O palhaço decidiu aprender sueco do jeito dele: as lições estão escritas numa MEIA listrada gigante, e ele a abre como se fosse um livro, de óculos na ponta do nariz vermelho. Só que a meia tem um CHULÉ medonho — então ele lê de boca escancarada de nojo, esticando o É do chuLÉ: LÉÉÉR! Pra não perder tempo, lê equilibrado no skate que pegou emprestado do SVEN SKAtista, com o nome SVEN pintado embaixo. IÁ LÉÉR MÊI SVÉN-SKA: eu estou aprendendo sueco.',
  },
  createScene,
}

export default card
