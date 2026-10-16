import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Det är okej." — o menino chuta a bola, ela atravessa o queijo-minas
 * gigante do gigante bonachão e deixa um furo redondo no meio. O gigante
 * ergue o queijo, encaixa o olho no furo e ri: DÊ... É, Ó: QUEI(jo)! —
 * com a outra mão faz o sinal de OK. Tá tudo bem.
 *
 * Diorama: gramado redondo com um morrinho atrás; o gigante sentado no topo,
 * pernas pendendo na frente; o queijo (acento dourado da casca) à altura do
 * olho; o menino de camiseta azul embaixo, à direita, ao lado da bola.
 */

const SOIL = '#4b3726'
const GRASS = '#7aa94b'
const GRASS_DARK = '#5e8b3b'
const HILL = '#84b552'
const WOOD = '#a0703f'
const WOOD_DARK = '#7a522c'
const SHIRT = '#2f6a4f'      // xadrez verde-floresta (contrasta com a grama clara)
const PLAID = '#1d4434'
const PLAID_LIGHT = '#d9cfae'
const PANTS = '#6e4b2e'
const BOOT = '#3b2a1d'
const SKIN = '#eab48f'
const BEARD = '#c2512a'
const MOUTH = '#5a2320'
const CHEESE = '#f8ebc2'     // massa branco-creme do minas
const RIND = '#f0b429'       // acento saturado RESERVADO: a casca do QUEIjo
const BOY_SHIRT = '#3d7fd1'
const BOY_SKIN = '#f1caa5'
const BOY_HAIR = '#5a3a22'

const GY = 0.18 // topo do gramado
const HILL_C = new THREE.Vector3(-0.45, GY, -0.8)
const HILL_H = 0.6
const GIANT_H = 2.5
const GIANT_POS = new THREE.Vector3(-0.45, GY + HILL_H, -0.42) // quadril no topo do morro
const GIANT_ROT = 0.4
const BOY_POS = new THREE.Vector3(1.25, GY, 0.95)
const BOY_ROT = -0.95
const BALL_R = 0.14
const BALL_REST = new THREE.Vector3(0.82, GY + BALL_R, 1.22)

// queijo: roda larga e baixa com furo no meio
const QR = 0.44
const QHOLE = 0.15
const QT = 0.26

const CAM: [number, number, number] = [0.8, 3.05, 6.35]
const CAM_TARGET: [number, number, number] = [0.25, 1.55, 0]

const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)

/** Roda de queijo com furo: anel torneado de massa + cinta de casca dourada. */
function makeCheese() {
  const g = new THREE.Group()
  const c = 0.04
  const h = QT / 2
  const ring = lathe(
    [
      [QHOLE + c, -h], [QR - c, -h], [QR - c * 0.3, -h + c * 0.3], [QR, -h + c],
      [QR, h - c], [QR - c * 0.3, h - c * 0.3], [QR - c, h], [QHOLE + c, h],
      [QHOLE + c * 0.3, h - c * 0.3], [QHOLE, h - c], [QHOLE, -h + c],
      [QHOLE + c * 0.3, -h + c * 0.3], [QHOLE + c, -h],
    ],
    CHEESE,
    { roughness: 0.62 },
    56,
  )
  g.add(ring)
  const rind = lathe(
    [
      [QR - 0.012, -h + 0.006], [QR + 0.01, -h + 0.03], [QR + 0.014, 0],
      [QR + 0.01, h - 0.03], [QR - 0.012, h - 0.006],
    ],
    RIND,
    { roughness: 0.45 },
    56,
  )
  g.add(rind)
  // sulco da fôrma na casca (o "cesto" do minas)
  for (const y of [-h * 0.45, h * 0.45]) {
    const groove = lathe(
      [[QR + 0.012, y - 0.008], [QR + 0.018, y], [QR + 0.012, y + 0.008]],
      '#d6971f',
      { roughness: 0.5 },
      56,
    )
    g.add(groove)
  }
  return g
}

/** Bola de futebol: branca com pentágonos pretos nos 12 vértices do icosaedro. */
function makeBall() {
  const g = new THREE.Group()
  g.add(sphere(BALL_R, '#f4f3ee', { roughness: 0.4 }))
  const ico = new THREE.IcosahedronGeometry(1, 0)
  const pos = ico.attributes.position
  const seen = new Set<string>()
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`
    if (seen.has(key)) continue
    seen.add(key)
    const patch = cylinder(0.05, 0.05, 0.02, '#1d1d1f', { roughness: 0.45 }, 5)
    patch.quaternion.setFromUnitVectors(UP, v)
    patch.position.copy(v).multiplyScalar(BALL_R - 0.006)
    g.add(patch)
  }
  return g
}

/** Mão fazendo OK: palma, anel de polegar+indicador, três dedos esticados. */
function makeOkHand() {
  const g = new THREE.Group()
  const palm = rbox(0.24, 0.22, 0.12, 0.06, SKIN, { roughness: 0.6 })
  g.add(palm)
  // anel (polegar + indicador) no lado de fora
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.036, 16, 32), mat(SKIN, { roughness: 0.6, size: 0.2 }))
  ring.castShadow = true
  ring.receiveShadow = true
  ring.position.set(-0.11, 0.13, 0.01)
  g.add(ring)
  // três dedos esticados, abertos em leque
  for (const [i, x] of [-0.01, 0.06, 0.12].entries()) {
    const f = capsule(0.036, 0.13 - i * 0.015, SKIN, { roughness: 0.6 })
    f.position.set(x, 0.2 - i * 0.012, 0)
    f.rotation.z = -0.08 - i * 0.14
    g.add(f)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base do diorama: gramado --------------------------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)
  const lawn = cylinder(2.56, 2.62, 0.07, GRASS, { roughness: 0.92 })
  lawn.position.y = 0.145
  base.add(lawn)
  // tufos e florzinhas espalhados
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.3 + rand() * 1.05
    const x = Math.sin(a) * r
    const z = Math.cos(a) * r
    if (Math.hypot(x - BOY_POS.x, z - BOY_POS.z) < 0.55) continue
    const tuft = puff(0.07 + rand() * 0.04, GRASS_DARK, 4, 10 + i, { roughness: 0.95 })
    tuft.position.set(x, GY + 0.02, z)
    tuft.scale.y = 0.7
    base.add(tuft)
    if (i % 3 === 0) {
      const flower = sphere(0.035, '#fbf7ef', { roughness: 0.5 })
      flower.position.set(x + 0.08, GY + 0.06, z + 0.04)
      const core = sphere(0.016, '#e8b740', { roughness: 0.5 })
      core.position.set(0, 0.02, 0.012)
      flower.add(core)
      base.add(flower)
    }
  }
  // arbustos ao fundo
  for (const [x, z, r, s] of [[1.55, -1.45, 0.38, 3], [0.75, -1.95, 0.3, 5], [-1.95, -1.05, 0.34, 7]] as const) {
    const bush = puff(r, GRASS_DARK, 6, s, { roughness: 0.9 })
    bush.position.set(x, GY + r * 0.6, z)
    base.add(bush)
  }
  root.add(base)

  // ---- morro ------------------------------------------------------------------
  const morro = new THREE.Group()
  morro.position.copy(HILL_C)
  const dome = lathe(
    [
      [0, -0.02], [1.4, -0.02], [1.36, 0.04], [1.24, 0.14], [1.08, 0.27],
      [0.9, 0.38], [0.68, 0.48], [0.44, 0.55], [0.2, 0.59], [0, HILL_H],
    ],
    HILL,
    { roughness: 0.9 },
    48,
  )
  morro.add(dome)
  for (let i = 0; i < 6; i++) {
    const a = -1.2 + i * 0.5
    const t = puff(0.06, GRASS_DARK, 4, 30 + i, { roughness: 0.95 })
    t.position.set(Math.sin(a) * 1.15, 0.24, Math.cos(a) * 0.95 - 0.1)
    t.scale.y = 0.7
    morro.add(t)
  }
  root.add(morro)

  // ---- cerquinha de madeira no pé do morro (lado esquerdo) ------------------
  const cerca = new THREE.Group()
  const FR = 2.12
  const posts: THREE.Vector3[] = []
  for (let i = 0; i < 6; i++) {
    const a = -2.45 + i * 0.34
    posts.push(new THREE.Vector3(Math.sin(a) * FR, 0, Math.cos(a) * FR))
  }
  for (const p of posts) {
    const post = rbox(0.08, 0.38, 0.08, 0.02, WOOD_DARK, { roughness: 0.8 })
    post.position.set(p.x, GY + 0.19, p.z)
    const cap = rbox(0.1, 0.03, 0.1, 0.012, WOOD, { roughness: 0.8 })
    cap.position.y = 0.2
    post.add(cap)
    cerca.add(post)
  }
  for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i]
    const b = posts[i + 1]
    const mid = a.clone().add(b).multiplyScalar(0.5)
    const len = a.distanceTo(b)
    for (const y of [0.13, 0.28]) {
      const rail = rbox(len + 0.06, 0.055, 0.035, 0.015, WOOD, { roughness: 0.8 })
      rail.position.set(mid.x, GY + y, mid.z)
      rail.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x)
      cerca.add(rail)
    }
  }
  root.add(cerca)

  // ---- gigante bonachão sentado ----------------------------------------------
  const gigante = person({ body: SHIRT, skin: SKIN, height: GIANT_H, armAngle: 0.3 })
  gigante.position.copy(GIANT_POS)
  gigante.rotation.y = GIANT_ROT
  root.add(gigante)

  const bodyH = GIANT_H * 0.52
  const bodyR = GIANT_H * 0.17

  // xadrez: faixas horizontais escuras + filete claro
  for (const [y, c, hgt] of [
    [0.42, PLAID, 0.07], [0.62, PLAID, 0.07], [0.82, PLAID, 0.07], [1.0, PLAID, 0.06],
    [0.52, PLAID_LIGHT, 0.018], [0.72, PLAID_LIGHT, 0.018], [0.92, PLAID_LIGHT, 0.018],
  ] as const) {
    const band = cylinder(bodyR * 1.02, bodyR * 1.02, hgt, c, { roughness: 0.85 })
    band.position.y = y
    gigante.add(band)
  }
  // cintura da calça e cinto
  const waist = cylinder(bodyR * 1.03, bodyR * 1.0, 0.3, PANTS, { roughness: 0.85 })
  waist.position.y = 0.15
  gigante.add(waist)
  const belt = cylinder(bodyR * 1.05, bodyR * 1.05, 0.06, '#3a2618', { roughness: 0.5 })
  belt.position.y = 0.3
  gigante.add(belt)
  const buckle = rbox(0.12, 0.08, 0.03, 0.015, '#c9a85a', { roughness: 0.3, metalness: 0.7 })
  buckle.position.set(0, 0.3, bodyR * 1.04)
  gigante.add(buckle)

  // pernas: coxas pra frente, canelas pendendo do morro, botas enormes
  for (const side of [-1, 1]) {
    const thigh = capsule(0.17, 0.55, PANTS, { roughness: 0.85 })
    thigh.rotation.x = Math.PI / 2
    thigh.position.set(side * 0.21, 0.12, 0.4)
    gigante.add(thigh)
    const shin = capsule(0.15, 0.36, PANTS, { roughness: 0.85 })
    shin.position.set(side * 0.22, -0.16, 0.76)
    shin.rotation.x = 0.12
    gigante.add(shin)
    const boot = rbox(0.32, 0.22, 0.46, 0.08, BOOT, { roughness: 0.6 })
    boot.position.set(side * 0.23, -0.49, 0.86)
    gigante.add(boot)
    const sole = rbox(0.34, 0.05, 0.48, 0.02, '#221810', { roughness: 0.7 })
    sole.position.y = -0.11
    boot.add(sole)
  }

  // cabeça grande: barba ruiva cheia, nariz de batata, gargalhada
  const head = gigante.getObjectByName('head')!
  head.scale.setScalar(1.22)
  head.position.y += 0.06
  head.rotation.set(0.04, 0.12, 0)
  const hr = GIANT_H * 0.19
  // olho do lado de fora (-x) fechado de tanto rir; o de dentro (+x) espia pelo furo
  head.children[1].visible = false
  head.children[2].visible = false
  const openEye = head.children[3]
  openEye.scale.set(1.12, 1.12, 0.7)
  const squint = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.016, 10, 24, Math.PI),
    mat('#2a1a14', { roughness: 0.5, size: 0.15 }),
  )
  squint.position.set(-hr * 0.38, hr * 0.1, hr * 0.86)
  squint.rotation.x = -0.2
  head.add(squint)
  for (const side of [-1, 1]) {
    const brow = capsule(0.025, 0.11, BEARD, { roughness: 0.9 })
    brow.rotation.z = Math.PI / 2 + side * 0.2
    brow.position.set(side * hr * 0.38, hr * 0.42, hr * 0.84)
    head.add(brow)
    const burn = sphere(0.12, BEARD, { roughness: 0.95 })
    burn.position.set(side * hr * 0.82, -hr * 0.25, hr * 0.2)
    burn.scale.set(0.6, 1.2, 0.9)
    head.add(burn)
    const cheek = sphere(0.07, '#e58f73', { roughness: 0.7 })
    cheek.position.set(side * hr * 0.55, -hr * 0.12, hr * 0.74)
    cheek.scale.z = 0.4
    head.add(cheek)
  }
  const hair = puff(hr * 0.72, BEARD, 6, 13, { roughness: 0.95 })
  hair.position.set(0, hr * 0.55, -hr * 0.2)
  hair.scale.set(1.15, 0.75, 1.05)
  head.add(hair)
  const beard = puff(hr * 0.5, BEARD, 7, 21, { roughness: 0.95 })
  beard.position.set(0, -hr * 0.62, hr * 0.42)
  beard.scale.set(1.35, 1.05, 0.8)
  head.add(beard)
  // gargalhada torta, puxada pro lado de fora: fica visível ao lado do queijo
  const grin = new THREE.Group()
  grin.position.set(-0.11, -hr * 0.38, hr * 0.84)
  grin.rotation.set(0, -0.35, 0.18)
  head.add(grin)
  const mouth = sphere(0.11, MOUTH, { roughness: 0.6 })
  mouth.scale.set(1.3, 0.7, 0.4)
  grin.add(mouth)
  const teeth = rbox(0.19, 0.04, 0.03, 0.012, '#fbf7ee', { roughness: 0.3 })
  teeth.position.set(0, 0.045, 0.03)
  grin.add(teeth)
  const tongue = sphere(0.055, '#d4625a', { roughness: 0.6 })
  tongue.position.set(0, -0.04, 0.025)
  tongue.scale.set(1.3, 0.55, 0.4)
  grin.add(tongue)
  for (const side of [-1, 1]) {
    const stache = capsule(0.04, 0.13, BEARD, { roughness: 0.95 })
    stache.rotation.z = Math.PI / 2 - side * 0.35
    stache.position.set(side * 0.09, -hr * 0.2, hr * 0.96)
    head.add(stache)
  }
  const nose = sphere(0.1, '#e39a7a', { roughness: 0.75 })
  nose.position.set(0, -hr * 0.02, hr * 1.02)
  nose.scale.set(1.1, 0.95, 0.95)
  head.add(nose)

  root.add(gigante)
  root.updateMatrixWorld(true)

  // ---- queijo: pose final calculada para o olho aparecer pelo furo ----------
  const giantQ = gigante.quaternion.clone()
  const giantQInv = giantQ.clone().invert()
  const eyeW = new THREE.Vector3()
  openEye.getWorldPosition(eyeW)
  const boyHeadW = BOY_POS.clone().add(new THREE.Vector3(0, 0.8, 0))
  const toCam = new THREE.Vector3(...CAM).sub(eyeW).normalize()
  const toBoy = boyHeadW.clone().sub(eyeW).normalize()
  const axisW = toCam.multiplyScalar(0.66).add(toBoy.multiplyScalar(0.34)).normalize()
  const qCenterW = eyeW.clone().add(axisW.clone().multiplyScalar(0.17 + QT / 2))
  const axisL = axisW.clone().applyQuaternion(giantQInv)
  const qFinalPos = gigante.worldToLocal(qCenterW.clone())
  const qFinalRot = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, axisL))

  // pose inicial: em pé no colo, de frente pro menino
  const qLowPos = new THREE.Vector3(0.12, 0.29 + QR, 0.66)
  const lowW = gigante.localToWorld(qLowPos.clone())
  const footW = BOY_POS.clone().add(new THREE.Vector3(Math.sin(BOY_ROT) * 0.2, BALL_R, Math.cos(BOY_ROT) * 0.2))
  const lowAxisW = footW.clone().sub(lowW).setY(0).normalize()
  const lowAxisL = lowAxisW.clone().applyQuaternion(giantQInv)
  const qLowQuat = new THREE.Quaternion().setFromUnitVectors(UP, lowAxisL)
  const qLowRot = new THREE.Euler().setFromQuaternion(qLowQuat)

  const queijo = makeCheese()
  queijo.position.copy(qFinalPos)
  queijo.rotation.copy(qFinalRot)
  gigante.add(queijo)

  // miolo arrancado pela bola: tampa o furo, salta e cai na grama
  const miolo = new THREE.Group()
  const plug = cylinder(QHOLE - 0.004, QHOLE - 0.004, QT - 0.012, CHEESE, { roughness: 0.62 })
  miolo.add(plug)
  const MIOLO_REST = new THREE.Vector3(0.95, -0.6 + QHOLE - 0.03, 0.62)
  miolo.position.copy(MIOLO_REST)
  miolo.rotation.set(Math.PI / 2 - 0.25, 0.4, 0)
  const MIOLO_REST_ROT = miolo.rotation.clone()
  gigante.add(miolo)

  // ---- braço que ergue o queijo (+x): segura por baixo da borda -------------
  const bracoQueijo = gigante.getObjectByName('armR')!
  shoulderPivot(bracoQueijo, GIANT_H)
  const reach = GIANT_H * 0.19 + bodyH * 0.32
  // segura pela borda de fora (lado do menino), sem cruzar a frente do rosto
  const gripDir = new THREE.Vector3(0.85, -0.55, 0)
  const inPlane = gripDir.sub(axisL.clone().multiplyScalar(gripDir.dot(axisL))).normalize()
  const gripPoint = qFinalPos.clone().add(inPlane.multiplyScalar(QR + 0.05))
  const armDir = gripPoint.clone().sub(bracoQueijo.position)
  bracoQueijo.scale.y = THREE.MathUtils.clamp(armDir.length() / reach, 0.85, 1.3)
  bracoQueijo.quaternion.setFromUnitVectors(DOWN, armDir.clone().normalize())
  const armRFinal = bracoQueijo.rotation.clone()
  // pose inicial: mão apoiada na lateral do queijo, no colo
  const lowGrip = qLowPos.clone().add(new THREE.Vector3(QR * 0.9, -0.05, 0.05))
  const armRLow = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(DOWN, lowGrip.sub(bracoQueijo.position).normalize()),
  )

  // ---- braço do OK (-x): mão na frente do peito ------------------------------
  const bracoOK = gigante.getObjectByName('armL')!
  shoulderPivot(bracoOK, GIANT_H)
  const luva = bracoOK.children[0]
  const okTarget = new THREE.Vector3(-0.3, 0.92, 0.74)
  bracoOK.quaternion.setFromUnitVectors(DOWN, okTarget.clone().sub(bracoOK.position).normalize())
  const armLFinal = bracoOK.rotation.clone()
  const armLLow = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(DOWN, new THREE.Vector3(-0.3, -0.9, 0.3).normalize()),
  )
  root.updateMatrixWorld(true)
  const handW = new THREE.Vector3()
  luva.getWorldPosition(handW)
  const maoOK = new THREE.Group()
  const okInner = makeOkHand()
  okInner.scale.setScalar(1.3)
  maoOK.add(okInner)
  maoOK.position.copy(gigante.worldToLocal(handW.clone()))
  maoOK.position.y += 0.06
  maoOK.rotation.set(0.05, -GIANT_ROT * 0.6, 0.1)
  gigante.add(maoOK)
  root.updateMatrixWorld(true)
  bracoOK.attach(maoOK)
  luva.scale.setScalar(0.01) // pose final: a luva virou a mão do OK

  // ---- menino ---------------------------------------------------------------
  const menino = new THREE.Group()
  menino.position.copy(BOY_POS)
  menino.rotation.y = BOY_ROT
  const kid = person({ body: BOY_SHIRT, skin: BOY_SKIN, height: 0.95, armAngle: 0.3 })
  menino.add(kid)
  const kidHead = kid.getObjectByName('head')!
  kidHead.rotation.x = -0.32
  const khr = 0.95 * 0.19
  const kidHair = puff(khr * 0.75, BOY_HAIR, 6, 5, { roughness: 0.95 })
  kidHair.position.set(0, khr * 0.55, -khr * 0.15)
  kidHair.scale.set(1.15, 0.6, 1.1)
  kidHead.add(kidHair)
  const oh = sphere(0.03, MOUTH, { roughness: 0.6 })
  oh.position.set(0, -khr * 0.38, khr * 0.9)
  oh.scale.set(0.8, 1.1, 0.5)
  kidHead.add(oh)
  // shorts e tênis
  const shorts = cylinder(0.95 * 0.17 * 1.04, 0.95 * 0.17 * 1.02, 0.14, '#2c3e5c', { roughness: 0.85 })
  shorts.position.y = 0.1
  kid.add(shorts)
  // mãos juntas pedindo desculpa
  for (const [name, side] of [['armL', -1], ['armR', 1]] as const) {
    const arm = kid.getObjectByName(name)!
    shoulderPivot(arm, 0.95)
    const tgt = new THREE.Vector3(side * 0.03, 0.5, 0.25)
    arm.quaternion.setFromUnitVectors(DOWN, tgt.sub(arm.position).normalize())
  }
  root.add(menino)

  // ---- bola -------------------------------------------------------------------
  const bola = makeBall()
  bola.position.copy(BALL_REST)
  bola.rotation.set(9.4, 3.3, 0)
  root.add(bola)
  const bellyW = gigante.localToWorld(new THREE.Vector3(0.1, 0.72, 0.4))

  // ---- farelos de queijo na grama --------------------------------------------
  const farelos = new THREE.Group()
  for (let i = 0; i < 9; i++) {
    const s = 0.045 + rand() * 0.045
    const cube = rbox(s, s, s, s * 0.2, CHEESE, { roughness: 0.65 })
    const a = rand() * Math.PI * 2
    const r = 0.12 + rand() * 0.42
    cube.position.set(Math.cos(a) * r, s / 2, Math.sin(a) * r * 0.7)
    cube.rotation.set(rand(), rand() * 3, rand())
    farelos.add(cube)
  }
  farelos.position.set(0.35, GY, 0.55)
  root.add(farelos)

  // ---- peças ------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'morro', group: 'cenario', object: morro },
    { name: 'cerca', group: 'cenario', object: cerca },
    { name: 'gigante', group: 'gigante', object: gigante },
    { name: 'bracoQueijo', group: 'gigante', object: bracoQueijo },
    { name: 'bracoOK', group: 'gigante', object: bracoOK },
    { name: 'luva', group: 'gigante', object: luva },
    { name: 'queijo', group: 'queijo', object: queijo },
    { name: 'miolo', group: 'queijo', object: miolo },
    { name: 'menino', group: 'menino', object: menino },
    { name: 'bola', group: 'chute', object: bola },
    { name: 'farelos', group: 'chute', object: farelos },
    { name: 'maoOK', group: 'ok', object: maoOK },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const rot = (a: THREE.Euler, b: THREE.Euler) => [
    ch('rotation.x', a.x, b.x), ch('rotation.y', a.y, b.y), ch('rotation.z', a.z, b.z),
  ]
  const pos = (a: THREE.Vector3, b: THREE.Vector3) => [
    ch('position.x', a.x, b.x), ch('position.y', a.y, b.y), ch('position.z', a.z, b.z),
  ]
  const hipY = GIANT_POS.y
  const hopTop = MIOLO_REST.clone().lerp(qLowPos, 0.5).add(new THREE.Vector3(0.2, 0.75, 0.1))
  const spinRot = new THREE.Euler(qLowRot.x + 2.4, qLowRot.y + 0.6, qLowRot.z + 1.2)
  const ballMid = new THREE.Euler(0.4 + 6, 0.3 + 2, 0)
  const ballEnd = new THREE.Euler(0.4 + 9, 0.3 + 3, 0)

  // ---- montagem ---------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Num morro verde, um gigante bonachão senta pra lanchar…',
    }),
    seq('morro-rise', 'morro', 0.25, 0.8, [riseFrom(HILL_C.y, 0.9)], { ease: 'easeOut' }),
    seq('cerca-rise', 'cerca', 0.5, 0.7, [riseFrom(0, 0.6)], { ease: 'easeOut' }),

    seq('gigante-rise', 'gigante', 1.1, 1.0, [riseFrom(hipY, 3.4)], { ease: 'easeOut' }),
    seq('bracoQ-hold', 'bracoQueijo', 1.1, 0.1, rot(armRLow, armRLow)),
    seq('bracoOK-hold', 'bracoOK', 1.1, 0.1, rot(armLLow, armLLow)),
    seq('luva-hold', 'luva', 1.1, 0.1, grow(1)),

    seq('queijo-grow', 'queijo', 2.3, 0.7, [...grow(), ...pos(qLowPos, qLowPos), ...rot(qLowRot, qLowRot)], {
      ease: 'easeOut',
      caption: '…um QUEIJO-minas do tamanho de uma roda de trator!',
    }),
    seq('miolo-grow', 'miolo', 2.3, 0.7, [...grow(), ...pos(qLowPos, qLowPos), ...rot(qLowRot, qLowRot)], {
      ease: 'easeOut',
    }),

    seq('menino-rise', 'menino', 3.5, 0.8, [riseFrom(GY, 1.2)], {
      ease: 'easeOut',
      caption: 'Lá embaixo, um menino chuta a bola com toda a força…',
    }),

    seq('bola-chute', 'bola', 4.5, 0.4, [...pos(footW, lowW), ...rot(new THREE.Euler(0, 0, 0), ballMid)], {
      caption: '…e ela atravessa o queijo de lado a lado: um furo redondinho bem no meio!',
    }),
    seq('bola-barriga', 'bola', 4.9, 0.18, pos(lowW, bellyW)),
    seq('bola-volta', 'bola', 5.08, 0.65, [...pos(bellyW, BALL_REST), ...rot(ballMid, ballEnd)], { ease: 'easeIn' }),
    seq('miolo-pula', 'miolo', 4.88, 0.4, [...pos(qLowPos, hopTop), ...rot(qLowRot, spinRot)], { ease: 'easeOut' }),
    seq('miolo-cai', 'miolo', 5.28, 0.45, [...pos(hopTop, MIOLO_REST), ...rot(spinRot, MIOLO_REST_ROT)], {
      ease: 'easeIn',
    }),
    seq('farelos-voam', 'farelos', 4.92, 0.5, grow(), { ease: 'easeOut' }),

    seq('menino-congela', 'menino', 6.0, 0.25, [ch('position.y', GY, GY + 0.14)], {
      ease: 'easeOut',
      caption: 'O menino congela: "Förlåt!"',
    }),
    seq('menino-pousa', 'menino', 6.25, 0.25, [ch('position.y', GY + 0.14, GY)], { ease: 'easeIn' }),

    seq('queijo-ergue', 'queijo', 7.2, 1.0, [...pos(qLowPos, qFinalPos), ...rot(qLowRot, qFinalRot)], {
      ease: 'easeInOut',
      caption: 'O gigante ergue o queijo, encaixa o olho no furo e gargalha: DÊ... É, Ó: QUEI(jo)!',
    }),
    seq('bracoQ-ergue', 'bracoQueijo', 7.2, 1.0, rot(armRLow, armRFinal), { ease: 'easeInOut' }),

    seq('bracoOK-sobe', 'bracoOK', 8.9, 0.7, rot(armLLow, armLFinal), {
      ease: 'easeOut',
      caption: 'E com a outra mão faz OK: com furo, agora é queijo suíço — tá tudo bem!',
    }),
    seq('luva-some', 'luva', 9.2, 0.3, [ch('scale.x', 1, 0.01), ch('scale.y', 1, 0.01), ch('scale.z', 1, 0.01)]),
    seq('maoOK-abre', 'maoOK', 9.2, 0.45, grow(), { ease: 'easeOut' }),

    seq('gigante-ri-a', 'gigante', 10.3, 0.2, [ch('position.y', hipY, hipY + 0.06)], {
      ease: 'easeOut',
      caption: 'Det är okej. — Tudo bem. / Tá tranquilo.',
    }),
    seq('gigante-ri-b', 'gigante', 10.5, 0.2, [ch('position.y', hipY + 0.06, hipY)], { ease: 'easeIn' }),
    seq('gigante-ri-c', 'gigante', 10.7, 0.2, [ch('position.y', hipY, hipY + 0.05)], { ease: 'easeOut' }),
    seq('gigante-ri-d', 'gigante', 10.9, 0.25, [ch('position.y', hipY + 0.05, hipY)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: CAM_TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-okej',
    contexto:
      "Universal: a resposta de todo dia quando alguém pede desculpa ('Förlåt!' / 'Det är okej.'), avisa que vai atrasar ou esbarra em você no ônibus. Também como permissão: 'Är det okej om jag tar med en kompis?' (tudo bem se eu levar um amigo?) — 'Ja, det är okej.'",
    fraseFonte: 'Tudo bem. / Tá tranquilo.',
    fraseAlvo: 'Det är okej.',
    pronuncia:
      "dê é o-KÊI ('det' = dê, sem T; 'är' = É aberto e curto, e os dois grudam: dê-é; 'okej' é o OK que você já fala, com a força no KEJ: o O vem fraquinho, curto e meio aberto (nunca o 'ôu' do inglês) e o KEJ tem K seco e o ditongo ÊI, que pode abrir um tiquinho pra ÉI)",
    ponteSonora:
      "DÊ... É, Ó: QUEI(jo)! (4 sílabas: dê-é-o-KÊI; a força TODA no KÊI; DÊ É = o 'det är' de sempre, de 'Det är lugnt', 'Det är fel pris' e 'Det är din tur': DÊ fechado e sem T, É aberto e curto; Ó = o 'ó!' de 'ó, olha!', o gigante mostrando o furo: curtinho, fraco e colado no QUEI; QUEI = o QUEIJO sem o -JO: K seco e o ditongo ÊI, e a força fica no QUEI, exatamente onde o português já põe. Sem o -JO, 'ó-QUEI' é o mesmo OK que você já fala, só que o sueco escreve 'okej'; não diga 'ôu-kêi' à americana, e não confunda com o ÓK, SÔ! de 'också' (a capivara da balança), que tem a força no Ó e emenda num S)",
    historia:
      "Um menino chuta a bola com toda a força e ela atravessa, de lado a lado, o queijo-minas do tamanho de uma roda de trator que o gigante guardava pro lanche, deixando um furo redondinho bem no meio. O menino congela e grita 'Förlåt!'. O gigante, em vez de se zangar, levanta o queijo com uma mão só, encaixa o olho no buraco pra espiar o menino lá embaixo e solta uma gargalhada que faz o morro tremer: 'DÊ... É, Ó: QUEI(jo)!'. Com furo, agora é queijo suíço; e com a outra mão ele faz o sinal de OK. Tá tudo bem: det är okej.",
  },
  createScene,
}

export default card
