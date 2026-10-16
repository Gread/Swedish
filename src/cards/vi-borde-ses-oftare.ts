import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Vi borde ses oftare." — VI... BUUU-DE SEIS... OFF! TÁ, RÉ!
 *
 * Diorama: água azul-escura do porto com o cais de madeira do amigo à direita
 * (ele acena lá de cima). No centro, o rebocador vermelho de faixa branca;
 * na chaminé amarela, um 6 branco gigante. O marinheiro de quepe branco,
 * gola azul-marinho e lenço vermelho puxa a corda do apito dourado — saem
 * três anéis de som (BUUU) — e com a outra mão puxa a alavanca do telégrafo
 * de máquina dourado do lado cinza (OFF) pro vermelho (RÉ). No fim o
 * rebocador inteiro volta de ré até encostar no cais.
 *
 * Acento saturado (amarelo) reservado à chaminé do 6.
 */

const WATER = '#1c4466'
const WATER_RIM = '#5f6a70'
const FOAM = '#d9e8ee'
const HULL = '#b2382f'
const WHITE = '#f2eee6'
const DECK = '#b98953'
const DECK_LINE = '#8f6638'
const FUNNEL = '#f6b81c' // ACENTO saturado — reservado à chaminé do SEIS
const SOOT = '#2a2522'
const BRASS = '#cf9f3e'
const DOCK = '#7a5434'
const DOCK_ALT = '#6a4629'
const DOCK_DARK = '#46301e'
const IRON = '#26282b'
const ROPE = '#d6c091'
const NAVY = '#1f2d50'
const SCARF = '#d33b2d'
const SKIN = '#e8c39e'
const RING = '#cdd3d8'
const OFF_GREY = '#8d969e'
const RE_RED = '#d2362b'

const WY = 0.2 // superfície da água
const FLOOR = 0.64 // convés: onde o marinheiro pisa
const HCX = -0.25 // centro do contorno do casco (para escalar o contorno)
const HW = 0.62 // meia-boca do casco
const START_X = -0.5 // o barco chega meio metro antes e no fim volta de ré

const FUNNEL_POS = new THREE.Vector3(-0.78, FLOOR, -0.24)
const FUNNEL_H = 1.3
const FUNNEL_R = 0.45
const SAILOR_POS = new THREE.Vector3(0.05, FLOOR, 0.14)
const SAILOR_ROT = 0.3
const SAILOR_SCALE = 1.06
const ARM_L = -2.55 // braço erguido puxando a corda
const ARM_R = 1.7 // braço estendido na alavanca
const LEVER_RE = 0.61 // alavanca inclinada pro lado vermelho (RÉ)
const LEVER_OFF = -0.62
const LEVER_L = 0.28

/** Contorno do casco visto de cima (x, s → z = -s), escalado em torno do centro. */
function hullShape(k: number): THREE.Shape {
  const P = (x: number, s: number): [number, number] => [HCX + (x - HCX) * k, s * k]
  const sh = new THREE.Shape()
  sh.moveTo(...P(-1.0, -HW))
  sh.lineTo(...P(0.95, -HW))
  sh.quadraticCurveTo(...P(1.3, -HW), ...P(1.3, -HW + 0.35))
  sh.lineTo(...P(1.3, HW - 0.35))
  sh.quadraticCurveTo(...P(1.3, HW), ...P(0.95, HW))
  sh.lineTo(...P(-1.0, HW))
  sh.quadraticCurveTo(...P(-1.6, HW), ...P(-1.8, 0))
  sh.quadraticCurveTo(...P(-1.6, -HW), ...P(-1.0, -HW))
  return sh
}

/** Extrusão vertical de um contorno (base em y=0), com borda arredondada. */
function extrudeUp(
  shape: THREE.Shape,
  depth: number,
  color: string,
  bevel: { size: number; thick: number },
  opts: { roughness?: number } = {},
) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel.size > 0,
    bevelSize: bevel.size,
    bevelThickness: bevel.thick,
    bevelSegments: 3,
    curveSegments: 28,
  })
  geo.rotateX(-Math.PI / 2)
  const m = new THREE.Mesh(geo, mat(color, { ...opts, size: 3 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Laço fechado seguindo o contorno, deslocado d para fora (d<0: para dentro). */
function contourLoop(d: number, y: number) {
  const pts = hullShape(1).getSpacedPoints(120)
  pts.pop() // o último repete o primeiro
  const out: THREE.Vector3[] = []
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[(i - 1 + pts.length) % pts.length]
    const next = pts[(i + 1) % pts.length]
    const dir = next.clone().sub(prev).normalize()
    const n = new THREE.Vector2(dir.y, -dir.x)
    const p = pts[i]
    const probe = p.clone().addScaledVector(n, 0.01)
    const away = probe.distanceTo(new THREE.Vector2(HCX, 0)) > p.distanceTo(new THREE.Vector2(HCX, 0))
    if (!away) n.multiplyScalar(-1)
    const q = p.clone().addScaledVector(n, d)
    out.push(new THREE.Vector3(q.x, y, -q.y))
  }
  return new THREE.CatmullRomCurve3(out, true)
}

function tube(curve: THREE.Curve<THREE.Vector3>, r: number, color: string, closed: boolean, roughness = 0.6) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, r, 10, closed), mat(color, { roughness, size: 1 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cilindro de a até b (cordas, cabos). */
function between(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, roughness = 0.85) {
  const len = a.distanceTo(b)
  const c = cylinder(r, r, len, color, { roughness }, 12)
  c.position.copy(a).add(b).multiplyScalar(0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return c
}

/** O 6 branco gigante: bojo + haste curva, traço grosso. */
function six() {
  const g = new THREE.Group()
  const t = 0.044
  const m = () => mat(WHITE, { roughness: 0.45, size: 0.4 })
  const bowl = new THREE.Mesh(new THREE.TorusGeometry(0.1, t, 16, 48), m())
  bowl.position.set(0, -0.1, 0)
  g.add(bowl)
  const stem = new THREE.Mesh(new THREE.TorusGeometry(0.2, t, 16, 48, Math.PI / 2), m())
  stem.rotation.z = Math.PI / 2
  stem.position.set(0.1, -0.1, 0)
  g.add(stem)
  const tip = new THREE.Mesh(new THREE.SphereGeometry(t, 16, 12), m())
  tip.position.set(0.1, 0.1, 0)
  g.add(tip)
  g.traverse((o) => { o.castShadow = true })
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: água do porto --------------------------------------------------
  const agua = new THREE.Group()
  const rimBase = cylinder(2.7, 2.78, 0.16, WATER_RIM, { roughness: 0.9 })
  rimBase.position.y = 0.08
  agua.add(rimBase)
  const water = cylinder(2.6, 2.6, 0.06, WATER, { roughness: 0.18, metalness: 0.1, detail: 0.4 })
  water.position.y = WY - 0.03
  agua.add(water)
  const lip = torus(2.64, 0.06, WATER_RIM, { roughness: 0.85 })
  lip.rotation.x = Math.PI / 2
  lip.position.y = WY
  agua.add(lip)
  // marolas concêntricas, bem sutis
  for (const [r, x, z] of [[0.32, -1.55, 1.55], [0.22, 1.05, 1.85], [0.18, -0.4, 2.1]] as const) {
    const ripple = torus(r, 0.008, '#2c5878', { roughness: 0.3 })
    ripple.rotation.x = Math.PI / 2
    ripple.position.set(x, WY + 0.004, z)
    ripple.scale.z = 0.6
    agua.add(ripple)
  }
  // boia verde de canal flutuando na frente
  const boia = new THREE.Group()
  boia.position.set(-1.75, WY, 1.35)
  const float = lathe([[0, -0.06], [0.16, -0.05], [0.17, 0.06], [0.12, 0.1], [0, 0.1]], '#2f7a4a', { roughness: 0.5 })
  boia.add(float)
  const coneTop = cone(0.1, 0.26, '#2f7a4a', { roughness: 0.5 })
  coneTop.position.y = 0.23
  boia.add(coneTop)
  const band = cylinder(0.125, 0.125, 0.05, WHITE, { roughness: 0.5 })
  band.position.y = 0.13
  boia.add(band)
  agua.add(boia)
  root.add(agua)

  // ---- cais de madeira do amigo (à direita) ---------------------------------
  const cais = new THREE.Group()
  const DOCK_TOP = 0.56
  const DX0 = 1.56
  const DX1 = 2.42
  for (let i = 0; i < 6; i++) {
    const z = -0.92 + i * 0.33
    const plank = rbox(DX1 - DX0, 0.07, 0.3, 0.02, i % 2 ? DOCK : DOCK_ALT, { roughness: 0.85 })
    plank.position.set((DX0 + DX1) / 2, DOCK_TOP - 0.035, z)
    cais.add(plank)
  }
  for (const z of [-0.8, 0.8]) {
    const beam = rbox(DX1 - DX0 + 0.04, 0.12, 0.12, 0.02, DOCK_DARK, { roughness: 0.9 })
    beam.position.set((DX0 + DX1) / 2, DOCK_TOP - 0.13, z)
    cais.add(beam)
  }
  const fascia = rbox(0.1, 0.16, 1.98, 0.03, DOCK_DARK, { roughness: 0.9 })
  fascia.position.set(DX0 + 0.02, DOCK_TOP - 0.11, -0.095)
  cais.add(fascia)
  for (const [x, z] of [[DX0 + 0.04, 0.84], [DX0 + 0.04, -0.98], [DX1 - 0.1, 0.84]] as const) {
    const pile = cylinder(0.085, 0.09, 0.8, DOCK_DARK, { roughness: 0.9 })
    pile.position.set(x, DOCK_TOP - 0.28, z)
    cais.add(pile)
    const cap = sphere(0.086, DOCK_DARK, { roughness: 0.9 })
    cap.position.set(x, DOCK_TOP + 0.12, z)
    cap.scale.y = 0.5
    cais.add(cap)
  }
  // poste de amarração preto
  const bollard = lathe(
    [[0, 0], [0.12, 0], [0.12, 0.03], [0.08, 0.06], [0.07, 0.2], [0.11, 0.24], [0.11, 0.28], [0, 0.29]],
    IRON,
    { roughness: 0.4, metalness: 0.5 },
  )
  bollard.position.set(1.72, DOCK_TOP, 0.42)
  cais.add(bollard)
  const coil = new THREE.Group()
  coil.position.set(2.15, DOCK_TOP + 0.03, -0.62)
  for (const [r, y] of [[0.18, 0], [0.13, 0.05]] as const) {
    const c = torus(r, 0.032, ROPE, { roughness: 0.9 })
    c.rotation.x = Math.PI / 2
    c.position.y = y
    coil.add(c)
  }
  cais.add(coil)

  // o amigo no cais, acenando pro rebocador
  const amigo = person({ body: '#4f7d5c', skin: SKIN, height: 1.15, armAngle: 0.3 })
  amigo.position.set(2.12, DOCK_TOP, -0.38)
  amigo.rotation.y = -0.85
  const acena = amigo.getObjectByName('armL')!
  shoulderPivot(acena, 1.15)
  acena.rotation.z = -2.7
  const amigoHead = amigo.getObjectByName('head')!
  const gorro = sphere(0.225, '#c9822f', { roughness: 0.9 })
  gorro.position.y = 0.06
  gorro.scale.set(1.02, 0.75, 1.02)
  amigoHead.add(gorro)
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 10, 24, Math.PI), mat('#5a2a22', { roughness: 0.6 }))
  smile.position.set(0, -0.06, 0.205)
  smile.rotation.z = Math.PI
  amigoHead.add(smile)
  cais.add(amigo)
  root.add(cais)

  // ---- rebocador (tudo a bordo é filho dele: no fim volta de ré junto) -----
  const casco = new THREE.Group()
  root.add(casco)

  const hull = extrudeUp(hullShape(1), 0.5, HULL, { size: 0.05, thick: 0.05 }, { roughness: 0.45 })
  hull.position.y = FLOOR - 0.02 - 0.55
  casco.add(hull)

  const stripe = extrudeUp(hullShape(1), 0.06, WHITE, { size: 0.066, thick: 0.012 }, { roughness: 0.4 })
  stripe.position.y = 0.4
  casco.add(stripe)

  const deck = extrudeUp(hullShape(0.9), 0.02, DECK, { size: 0, thick: 0 }, { roughness: 0.75 })
  deck.position.y = FLOOR - 0.02
  casco.add(deck)
  for (const z of [-0.36, -0.18, 0, 0.18, 0.36]) {
    const seam = rbox(1.7, 0.006, 0.018, 0.003, DECK_LINE, { roughness: 0.85 })
    seam.position.set(-0.05, FLOOR + 0.001, z)
    casco.add(seam)
  }

  const wallShape = hullShape(1)
  wallShape.holes.push(hullShape(0.9))
  const bulwark = extrudeUp(wallShape, 0.14, HULL, { size: 0.02, thick: 0.02 }, { roughness: 0.45 })
  bulwark.position.y = FLOOR - 0.02
  casco.add(bulwark)
  const rail = tube(contourLoop(-0.035, FLOOR + 0.15), 0.04, WHITE, true, 0.4)
  casco.add(rail)

  // linha d'água: espuma em volta do casco
  const foamLine = tube(contourLoop(0.07, WY + 0.01), 0.035, FOAM, true, 0.7)
  foamLine.scale.y = 0.4
  foamLine.position.y = WY * 0.6
  casco.add(foamLine)

  // pneus pendurados no costado (lado da câmera)
  for (const x of [-1.0, -0.25, 0.5]) {
    const tire = torus(0.12, 0.05, '#2b2b2d', { roughness: 0.85 })
    tire.position.set(x, 0.42, HW + 0.1)
    casco.add(tire)
    const strap = between(new THREE.Vector3(x, FLOOR + 0.14, HW + 0.02), new THREE.Vector3(x, 0.54, HW + 0.1), 0.014, ROPE)
    casco.add(strap)
  }
  // defensa de corda na popa (encosta no cais)
  const bumper = capsule(0.085, 0.55, ROPE, { roughness: 0.95 })
  bumper.rotation.x = Math.PI / 2
  bumper.position.set(1.42, 0.44, 0)
  casco.add(bumper)
  // cabeço de amarração na proa + rolo de corda
  const bitt = lathe([[0, 0], [0.08, 0], [0.06, 0.04], [0.055, 0.16], [0.075, 0.19], [0, 0.2]], IRON, {
    roughness: 0.4, metalness: 0.5,
  })
  bitt.position.set(-1.45, FLOOR, 0)
  casco.add(bitt)
  const deckCoil = torus(0.13, 0.035, ROPE, { roughness: 0.9 })
  deckCoil.rotation.x = Math.PI / 2
  deckCoil.position.set(-1.2, FLOOR + 0.035, 0.32)
  casco.add(deckCoil)

  // ---- chaminé amarela com o 6 ---------------------------------------------
  const chamine = new THREE.Group()
  chamine.position.copy(FUNNEL_POS)
  casco.add(chamine)
  const flange = cylinder(0.53, 0.55, 0.08, SOOT, { roughness: 0.6 })
  flange.position.y = 0.04
  chamine.add(flange)
  const stack = lathe(
    [[0, 0], [FUNNEL_R + 0.02, 0], [FUNNEL_R + 0.02, 0.06], [FUNNEL_R, 0.1], [FUNNEL_R - 0.03, FUNNEL_H - 0.18], [0, FUNNEL_H - 0.18]],
    FUNNEL,
    { roughness: 0.4 },
    48,
  )
  chamine.add(stack)
  const capBand = lathe(
    [[0, FUNNEL_H - 0.19], [FUNNEL_R - 0.025, FUNNEL_H - 0.19], [FUNNEL_R - 0.035, FUNNEL_H], [FUNNEL_R - 0.09, FUNNEL_H], [FUNNEL_R - 0.09, FUNNEL_H - 0.08], [0, FUNNEL_H - 0.08]],
    SOOT,
    { roughness: 0.6 },
    48,
  )
  chamine.add(capBand)
  const funnelLip = torus(FUNNEL_R - 0.06, 0.03, SOOT, { roughness: 0.5 })
  funnelLip.rotation.x = Math.PI / 2
  funnelLip.position.y = FUNNEL_H
  chamine.add(funnelLip)
  const whiteBand = cylinder(FUNNEL_R - 0.024, FUNNEL_R - 0.022, 0.05, WHITE, { roughness: 0.4 }, 48)
  whiteBand.position.y = FUNNEL_H - 0.215
  chamine.add(whiteBand)
  const numero = six()
  numero.scale.set(1.38, 1.38, 0.7)
  numero.position.set(0, 0.6, FUNNEL_R - 0.01)
  chamine.add(numero)

  // ---- marinheiro ----------------------------------------------------------
  const marinheiro = person({ body: WHITE, skin: SKIN, height: 1.5, armAngle: 0.35 })
  marinheiro.position.copy(SAILOR_POS)
  marinheiro.rotation.y = SAILOR_ROT
  marinheiro.scale.setScalar(SAILOR_SCALE)
  casco.add(marinheiro)

  // calça azul-marinho + cinto
  const pants = cylinder(0.262, 0.25, 0.22, NAVY, { roughness: 0.85 })
  pants.position.y = 0.17
  marinheiro.add(pants)
  // gola de marinheiro: aba nas costas + V no peito
  const collarBack = rbox(0.44, 0.3, 0.035, 0.03, NAVY, { roughness: 0.85 })
  collarBack.position.set(0, 0.64, -0.22)
  collarBack.rotation.x = -0.25
  marinheiro.add(collarBack)
  for (const side of [-1, 1]) {
    const flap = rbox(0.07, 0.3, 0.035, 0.015, NAVY, { roughness: 0.85 })
    flap.position.set(side * 0.1, 0.64, 0.225)
    flap.rotation.set(-0.18, side * 0.35, side * 0.5)
    marinheiro.add(flap)
    const piping = rbox(0.018, 0.27, 0.01, 0.004, WHITE, { roughness: 0.8 })
    piping.position.set(side * 0.003, 0, 0.02)
    flap.add(piping)
  }
  // lenço vermelho: nó + duas pontas
  const knot = sphere(0.055, SCARF, { roughness: 0.8 })
  knot.position.set(0, 0.52, 0.255)
  knot.scale.set(1.1, 0.9, 0.8)
  marinheiro.add(knot)
  for (const side of [-1, 1]) {
    const tail = capsule(0.035, 0.1, SCARF, { roughness: 0.8 })
    tail.position.set(side * 0.03, 0.43, 0.25)
    tail.rotation.z = side * 0.2
    tail.scale.z = 0.6
    marinheiro.add(tail)
  }
  const head = marinheiro.getObjectByName('head')!
  // boca aberta no BUUU
  const mouth = sphere(0.055, '#3a1d1a', { roughness: 0.7 })
  mouth.position.set(0, -0.12, 0.245)
  mouth.scale.set(0.9, 1.15, 0.6)
  head.add(mouth)
  const lips = torus(0.055, 0.017, '#b8625a', { roughness: 0.6 })
  lips.position.set(0, -0.12, 0.262)
  lips.scale.set(0.95, 1.2, 1)
  head.add(lips)
  for (const side of [-1, 1]) {
    const brow = rbox(0.09, 0.022, 0.02, 0.008, '#5a3a24', { roughness: 0.7 })
    brow.position.set(side * 0.105, 0.16, 0.255)
    brow.rotation.z = -side * 0.22
    head.add(brow)
  }
  // quepe branco redondo de marinheiro
  const quepe = new THREE.Group()
  quepe.position.set(0, 0.17, -0.01)
  quepe.rotation.x = -0.12
  head.add(quepe)
  const crown = sphere(0.255, WHITE, { roughness: 0.7 })
  crown.scale.set(1.05, 0.62, 1.05)
  crown.position.y = 0.06
  quepe.add(crown)
  const brim = torus(0.25, 0.05, WHITE, { roughness: 0.7 })
  brim.rotation.x = Math.PI / 2
  brim.position.y = 0.03
  quepe.add(brim)
  const ribbon = torus(0.262, 0.016, NAVY, { roughness: 0.8 })
  ribbon.rotation.x = Math.PI / 2
  ribbon.position.y = 0.09
  quepe.add(ribbon)

  const bracoL = marinheiro.getObjectByName('armL')!
  shoulderPivot(bracoL, 1.5)
  bracoL.rotation.z = ARM_L
  const bracoR = marinheiro.getObjectByName('armR')!
  shoulderPivot(bracoR, 1.5)
  bracoR.rotation.z = ARM_R

  // posições das mãos no referencial do barco (casco na pose final, na origem)
  casco.updateMatrixWorld(true)
  const handL = bracoL.children[0].getWorldPosition(new THREE.Vector3())
  const handR = bracoR.children[0].getWorldPosition(new THREE.Vector3())

  // ---- apito dourado na borda da chaminé ----------------------------------
  const toHand = new THREE.Vector2(handL.x - FUNNEL_POS.x, handL.z - FUNNEL_POS.z).normalize()
  const W = new THREE.Vector3(
    FUNNEL_POS.x + toHand.x * (FUNNEL_R - 0.06),
    FUNNEL_POS.y + FUNNEL_H,
    FUNNEL_POS.z + toHand.y * (FUNNEL_R - 0.06),
  )
  const apito = new THREE.Group()
  apito.position.copy(W)
  casco.add(apito)
  const WS = 1.45 // apito grande: tem que ler de longe
  const corpoApito = new THREE.Group()
  corpoApito.scale.setScalar(WS)
  apito.add(corpoApito)
  const whistle = lathe(
    [[0, 0], [0.04, 0], [0.04, 0.06], [0.075, 0.08], [0.08, 0.11], [0.08, 0.27], [0.065, 0.3], [0.03, 0.33], [0, 0.34]],
    BRASS,
    { roughness: 0.25, metalness: 0.85 },
  )
  corpoApito.add(whistle)
  const slot = cylinder(0.083, 0.083, 0.025, '#3a2a14', { roughness: 0.5 })
  slot.position.y = 0.125
  corpoApito.add(slot)
  const T = new THREE.Vector3(handL.x, W.y + 0.3 * WS + 0.05, handL.z) // ponta da alavanca do apito
  const leverBase = new THREE.Vector3(0, 0.3 * WS, 0)
  const leverTip = T.clone().sub(W)
  apito.add(between(leverBase, leverTip, 0.024, BRASS, 0.3))
  const eye = torus(0.035, 0.013, BRASS, { roughness: 0.3, metalness: 0.8 })
  eye.position.copy(leverTip)
  apito.add(eye)

  // ---- corda bege do apito até a mão --------------------------------------
  const corda = new THREE.Group()
  corda.position.copy(T)
  casco.add(corda)
  const ropeLen = T.y - (handL.y + 0.02)
  const rope = cylinder(0.024, 0.024, ropeLen, ROPE, { roughness: 0.9 }, 12)
  rope.position.y = -ropeLen / 2
  corda.add(rope)
  const tassel = sphere(0.035, ROPE, { roughness: 0.9 })
  tassel.position.y = -ropeLen - 0.02
  corda.add(tassel)

  // ---- três anéis de som saindo do apito ----------------------------------
  const ringDefs: [number, number, number, number][] = [
    [-0.2, 0.66, 0.11, 0.03],
    [-0.48, 0.88, 0.165, 0.033],
    [-0.84, 1.1, 0.23, 0.036],
  ]
  const aneis = ringDefs.map(([dx, dy, r, t]) => {
    const a = new THREE.Group()
    a.position.set(W.x + dx, W.y + dy, W.z)
    a.rotation.y = 0.05
    const ring = torus(r, t, RING, { roughness: 0.55 })
    a.add(ring)
    casco.add(a)
    return a
  })

  // ---- telégrafo de máquina ------------------------------------------------
  const hub = handR.clone().add(new THREE.Vector3(LEVER_L * Math.sin(LEVER_RE), -LEVER_L * Math.cos(LEVER_RE), -0.15))
  const telegrafo = new THREE.Group()
  telegrafo.position.set(hub.x, FLOOR, hub.z)
  casco.add(telegrafo)
  const DRUM_R = 0.21
  const hubY = hub.y - FLOOR
  const pedH = hubY - DRUM_R + 0.03
  const pedestal = lathe(
    [[0, 0], [0.17, 0], [0.17, 0.035], [0.12, 0.06], [0.07, 0.11], [0.058, pedH * 0.55], [0.07, pedH - 0.05], [0.11, pedH], [0, pedH]],
    BRASS,
    { roughness: 0.3, metalness: 0.8 },
  )
  telegrafo.add(pedestal)
  const drum = cylinder(DRUM_R, DRUM_R, 0.14, BRASS, { roughness: 0.3, metalness: 0.8 })
  drum.rotation.x = Math.PI / 2
  drum.position.y = hubY
  telegrafo.add(drum)
  const crest = lathe([[0, 0], [0.06, 0], [0.05, 0.05], [0.025, 0.08], [0, 0.09]], BRASS, { roughness: 0.3, metalness: 0.8 })
  crest.position.y = hubY + DRUM_R - 0.02
  telegrafo.add(crest)
  const faceR = DRUM_R - 0.025
  const halfOff = new THREE.Mesh(new THREE.CircleGeometry(faceR, 32, -Math.PI / 2, Math.PI), mat(OFF_GREY, { roughness: 0.5, size: 0.4 }))
  halfOff.position.set(0, hubY, 0.072)
  telegrafo.add(halfOff)
  const halfRe = new THREE.Mesh(new THREE.CircleGeometry(faceR, 32, Math.PI / 2, Math.PI), mat(RE_RED, { roughness: 0.45, size: 0.4 }))
  halfRe.position.set(0, hubY, 0.072)
  telegrafo.add(halfRe)
  const divider = rbox(0.016, faceR * 2, 0.012, 0.004, '#2a2623', { roughness: 0.5 })
  divider.position.set(0, hubY, 0.076)
  telegrafo.add(divider)
  const bezel = torus(DRUM_R - 0.012, 0.022, BRASS, { roughness: 0.25, metalness: 0.85 })
  bezel.position.set(0, hubY, 0.072)
  telegrafo.add(bezel)

  const alavanca = new THREE.Group()
  alavanca.position.set(hub.x, hub.y, hub.z + 0.09)
  alavanca.rotation.z = LEVER_RE
  casco.add(alavanca)
  const pivot = sphere(0.04, BRASS, { roughness: 0.25, metalness: 0.85 })
  alavanca.add(pivot)
  const leverBar = rbox(0.04, LEVER_L, 0.025, 0.01, BRASS, { roughness: 0.25, metalness: 0.85 })
  leverBar.position.y = LEVER_L / 2
  alavanca.add(leverBar)
  const handle = capsule(0.03, 0.08, '#3b2a1c', { roughness: 0.5 })
  handle.rotation.x = Math.PI / 2
  handle.position.set(0, LEVER_L, 0.05)
  alavanca.add(handle)

  // espuma da hélice dando ré (na popa, perto do cais)
  for (const [x, z, r, s] of [[1.5, 0.35, 0.13, 3], [1.46, -0.3, 0.11, 5], [1.62, 0.02, 0.1, 7]] as const) {
    const foam = puff(r, FOAM, 4, s, { roughness: 0.8 })
    foam.position.set(x, WY + 0.02, z)
    foam.scale.y = 0.4
    casco.add(foam)
  }

  casco.position.set(0, 0, 0)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'agua', group: 'porto', object: agua },
    { name: 'cais', group: 'porto', object: cais },
    { name: 'casco', group: 'rebocador', object: casco },
    { name: 'chamine', group: 'rebocador', object: chamine },
    { name: 'marinheiro', group: 'marinheiro', object: marinheiro },
    { name: 'bracoL', group: 'apito', object: bracoL },
    { name: 'apito', group: 'apito', object: apito },
    { name: 'corda', group: 'apito', object: corda },
    { name: 'anel1', group: 'som', object: aneis[0] },
    { name: 'anel2', group: 'som', object: aneis[1] },
    { name: 'anel3', group: 'som', object: aneis[2] },
    { name: 'telegrafo', group: 'telegrafo', object: telegrafo },
    { name: 'alavanca', group: 'telegrafo', object: alavanca },
    { name: 'bracoR', group: 'telegrafo', object: bracoR },
  ]

  const ringIn = (name: string, i: number, at: number) => {
    const a = aneis[i]
    return seq(`${name}-sai`, name, at, 0.55, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
      ch('position.x', W.x, a.position.x), ch('position.y', W.y + 0.45, a.position.y),
    ], { ease: 'easeOut' })
  }
  const ringPulse = (name: string, i: number, at: number) => {
    void i
    return seq(`${name}-pulsa`, name, at, 0.35, [
      ch('scale.x', 1.2, 1), ch('scale.y', 1.2, 1), ch('scale.z', 1.2, 1),
    ], { ease: 'easeOut' })
  }

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('agua-sobe', 'agua', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No porto de água escura, brota o cais de madeira do melhor amigo…',
    }),
    seq('cais-sobe', 'cais', 0.3, 0.9, [riseFrom(0, 1.4)], { ease: 'easeOut' }),

    seq('casco-sobe', 'casco', 1.5, 1.0, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'Um rebocador vermelho passa por aqui só de SEIS em SEIS meses…',
    }),
    seq('chamine-cresce', 'chamine', 2.1, 0.8, [ch('scale.y', 0.02, 1), ch('scale.x', 0.6, 1), ch('scale.z', 0.6, 1)], {
      ease: 'easeOut',
    }),

    seq('marinheiro-sobe', 'marinheiro', 3.3, 0.8, [riseFrom(FLOOR, 1.6)], {
      ease: 'easeOut',
      caption: 'O marinheiro VIU o amigo acenando no cais — VI…',
    }),
    seq('bracoR-desce', 'bracoR', 3.3, 0.6, [ch('rotation.z', -0.35, -0.35)]),
    seq('bracoL-ergue', 'bracoL', 3.3, 1.0, [ch('rotation.z', 0.35, ARM_L)], { ease: 'easeInOut' }),

    seq('apito-surge', 'apito', 4.4, 0.5, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),
    seq('corda-cai', 'corda', 4.7, 0.45, [ch('scale.y', 0.03, 1)], {
      ease: 'easeOut',
      caption: '…e puxa a corda do apito: BUUU! Um BUUU DE SEIS em SEIS meses é muito pouco!',
    }),
    seq('corda-puxa', 'corda', 5.25, 0.25, [ch('position.y', T.y, T.y - 0.07)], { ease: 'easeOut' }),
    seq('bracoL-puxa', 'bracoL', 5.25, 0.25, [ch('rotation.z', ARM_L, ARM_L + 0.12)], { ease: 'easeOut' }),
    ringIn('anel1', 0, 5.35),
    ringIn('anel2', 1, 5.6),
    ringIn('anel3', 2, 5.85),
    seq('corda-solta', 'corda', 6.3, 0.3, [ch('position.y', T.y - 0.07, T.y)]),
    seq('bracoL-solta', 'bracoL', 6.3, 0.3, [ch('rotation.z', ARM_L + 0.12, ARM_L)]),

    seq('telegrafo-sobe', 'telegrafo', 7.0, 0.7, [riseFrom(FLOOR, 1.3)], {
      ease: 'easeOut',
      caption: 'Cai a ficha! Ele bate a alavanca do telégrafo em OFF!',
    }),
    seq('alavanca-surge', 'alavanca', 7.4, 0.35, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),
    seq('bracoR-alcanca', 'bracoR', 7.5, 0.5, [ch('rotation.z', -0.35, ARM_R + 0.35)], { ease: 'easeOut' }),
    seq('alavanca-off', 'alavanca', 7.75, 0.3, [ch('rotation.z', 0, LEVER_OFF)], { ease: 'easeOut' }),

    seq('alavanca-re', 'alavanca', 8.7, 0.45, [ch('rotation.z', LEVER_OFF, LEVER_RE)], {
      ease: 'easeInOut',
      caption: '…e logo depois em RÉ: TÁ, RÉ! O rebocador volta de ré, apitando, até o cais.',
    }),
    seq('bracoR-puxa', 'bracoR', 8.7, 0.45, [ch('rotation.z', ARM_R + 0.35, ARM_R)], { ease: 'easeInOut' }),
    seq('casco-re', 'casco', 9.1, 1.5, [ch('position.x', START_X, 0)], { ease: 'easeInOut' }),
    ringPulse('anel1', 0, 9.3),
    ringPulse('anel2', 1, 9.5),
    ringPulse('anel3', 2, 9.7),

    seq('casco-encosta', 'casco', 10.6, 0.5, [ch('rotation.z', 0.03, 0)], {
      ease: 'easeOut',
      caption: 'Vi borde ses oftare. — A gente devia se ver mais vezes.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.38, 2.15, 6.1], target: [0.32, 1.5, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vi-borde-ses-oftare',
    contexto:
      'Vida social: no fim de um encontro casual com um conhecido no mercado, depois de uma fika boa, ou ao reencontrar um amigo que você não vê há meses. É a despedida calorosa dos suecos — às vezes é só gentileza, às vezes vira convite de verdade.',
    fraseFonte: 'A gente devia se ver mais vezes.',
    fraseAlvo: 'Vi borde ses oftare.',
    pronuncia:
      "vi BUU-de sês ÓF-ta-re ('vi' com I limpo; 'borde' = BUU-de: o 'o' longo soa U fechado, o R quase some dentro do D, que sai com a ponta da língua enrolada pra trás, e o -e é fraquinho; 'ses' = SÊS, Ê fechado e longo, S de cobra, nunca Z; 'oftare' com a força no ÓF, Ó ABERTO e curto, e o -ta-re fraquinho, R de um toque só)",
    ponteSonora:
      "VI... BUUU-DE SEIS... OFF! TÁ, RÉ! (7 sílabas: vi-BUU-de-SÊS-ÓF-ta-re; força no BUU, no SÊS e no ÓF; VI = o 'eu VI' de sempre, o MESMO VI de 'Vi ses!', 'Vi hörs!' e 'Vi har gott om tid': I limpo, curto e sem força; BUUU = o apito grave do navio: U FECHADO e LONGO de 'urso', SEM bico — com bico vira o Ü de 'du' —; é o 'o' longo sueco, o mesmo U de BUR ('Var bor du?') e do BÚR'D de 'Ett bord för två'; o R de 'borde' quase não aparece: no fim do BUUU a ponta da língua só enrola um pouco pra trás e cai direto no D — é o 'rd' sueco; DE = o 'de' de 'DE SEIS em seis meses', mas com D DURO de 'dado' — nunca o 'dji' do português — e o E fraquinho: BUU-de; SEIS = o MESMO SEIS de 'Vi ses!' e 'Har du lust att ses?', sem o I: SÊS, Ê FECHADO e longo, S de cobra, nunca Z; OFF = o OFF do botão (e do '50% OFF' da vitrine): Ó ABERTO de 'só', CURTO, F bem soprado — é nele que cai a força da palavra; TÁ, RÉ = as duas ordens do marinheiro pro motor, ditas de raspão, fraquinhas e coladas no OFF numa palavra só: ÓF-ta-re, R de UM toque (o de 'caRA', preso entre vogais) — CUIDADO: 'RÉ' sozinho, em português, sai 'HÉ' soprado, e aqui NÃO tem sopro nenhum — e o -E curto e apagado — nunca 'ta-RÉ' com força no fim; sem o -RE sobra 'ofta' (com frequência), e some o MAIS vezes)",
    historia:
      "Um marinheiro passa pelo porto do melhor amigo uma vez a cada seis meses — e só buzina. Hoje ele VIU o amigo acenando no cais, puxou a corda do apito — BUUU! — e caiu a ficha: um BUUU DE SEIS em SEIS meses é muito pouco. Ele bate a alavanca do motor em OFF e, logo depois, em RÉ: TÁ, RÉ! O navio volta de ré, apitando, até encostar no cais — a gente devia se ver mais vezes.",
  },
  createScene,
}

export default card
