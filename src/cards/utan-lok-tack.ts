import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Utan lök, tack." — ÜÜ-tan LÖÖK, tak.
 *
 * Dez minutos antes da estreia, a cantora de ópera para na barraquinha de
 * cachorro-quente e o vendedor soterra o pão dela em cebola crua. O cheiro
 * sobe pros olhos: ela solta o agudo de bico — UIII… TAN(TA)! —, mira o
 * binóculo de ópera na plaquinha LÖK, LEU-K de boca redonda, fecha o binóculo
 * num TAC! e empurra o pão de volta.
 *
 * Diorama: calçada de pedras cinza-claras; à esquerda a cantora (vestido de
 * gala vinho em sino), de 3/4 virada para a barraca; à direita o balcão de
 * madeira amarela com toldo listrado, o cachorro-quente gigante soterrado de
 * cebola e, erguida no canto, a plaquinha branca com a cebola roxa e LÖK.
 */

const CURB = '#77736c'
const GROUT = '#8f8b84'
const STONES = ['#cfccc5', '#c4c1b9', '#d8d5ce', '#bdb9b1']
const WOOD = '#e3b341'        // balcão: madeira pintada de amarelo
const WOOD_LIGHT = '#efc85e'
const WOOD_DARK = '#a9772a'
const STRIPE_A = '#f3ead7'
const STRIPE_B = '#3c8a86'     // toldo: creme e verde-água
const POST = '#d9d3c6'
const GOWN = '#7b1e3a'         // vestido vinho
const GOWN_DARK = '#5a1229'
const SKIN = '#f0c8a8'
const HAIR = '#6b3f24'
const GOLD = '#d6a53c'
const GLOVE = '#f6f2ea'
const BUN = '#dcae6c'
const BUN_DARK = '#b98547'
const SAUSAGE = '#b4432c'
const ONIONS = ['#f6f3ea', '#efebdd', '#ebe4ef', '#f2f0e4']
const SIGN = '#f8f6f0'
const INK = '#1f1c1f'
const ONION_PURPLE = '#9a2ec4' // acento saturado RESERVADO: a cebola da placa LÖK
const ONION_LIGHT = '#c77fe2'
const SPROUT = '#5f9a3e'
const RING = '#f286b6'
const TEAR = '#8fd2f6'

const GY = 0.16           // topo da calçada
const TOP = 1.02          // tampo do balcão
const H = 1.9             // altura da cantora
const HR = H * 0.19       // raio da cabeça
const SINGER: [number, number, number] = [-0.6, GY, 0.4]
const SINGER_ROT = 0.6
const HEAD_TURN = 0.3    // a cabeça vira um pouco mais, rumo à placa
const COUNTER_X = 1.0
const COUNTER_Z = 0.05
const COUNTER_W = 1.75
const COUNTER_D = 0.8
const SIGN_POS: [number, number, number] = [1.45, TOP + 0.22, -0.08]
const PUSH = 0.18         // quanto o pão anda quando ela empurra

/** Cilindro de r entre dois pontos (no referencial de quem o recebe). */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = cylinder(r, r, d.length(), color, opts, 16)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Traço de letra da placa: caixinha preta em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.01, INK, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** L Ö K — traço grosso; o Ö ganha dois pinguinhos bem grandes. */
function letter(which: 'L' | 'Ö' | 'K') {
  const g = new THREE.Group()
  const t = 0.042
  const h = 0.2
  if (which === 'L') {
    g.add(stroke(t, h, -0.04, 0))
    g.add(stroke(0.12, t, 0.0, -h / 2 + t / 2))
  } else if (which === 'Ö') {
    const ring = torus(0.068, 0.022, INK, { roughness: 0.5 })
    ring.scale.set(1, 1.32, 0.7)
    g.add(ring)
    for (const s of [-1, 1]) {
      const dot = sphere(0.031, INK, { roughness: 0.4 })
      dot.position.set(s * 0.045, h / 2 + 0.05, 0.005)
      dot.scale.z = 0.6
      g.add(dot)
    }
  } else {
    g.add(stroke(t, h, -0.045, 0))
    g.add(stroke(t, 0.13, 0.018, 0.044, -0.72))
    g.add(stroke(t, 0.13, 0.018, -0.044, 0.72))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- calçada de pedras ---------------------------------------------------
  const calcada = new THREE.Group()
  const curb = cylinder(2.55, 2.62, 0.12, CURB, { roughness: 0.9 })
  curb.position.y = 0.06
  calcada.add(curb)
  const grout = cylinder(2.47, 2.52, 0.03, GROUT, { roughness: 0.95 })
  grout.position.y = GY - 0.025
  calcada.add(grout)
  const P = 0.27
  for (let i = -9; i <= 9; i++) {
    for (let j = -9; j <= 9; j++) {
      const x = i * P + (j % 2 ? P / 2 : 0)
      const z = j * P
      if (x * x + z * z > 2.3 * 2.3) continue
      const tone = STONES[Math.floor(rand() * STONES.length)]
      const stone = rbox(P - 0.035, 0.05, P - 0.035, 0.018, tone, { roughness: 0.85 })
      stone.position.set(x + (rand() - 0.5) * 0.012, GY - 0.012, z + (rand() - 0.5) * 0.012)
      stone.rotation.y = (rand() - 0.5) * 0.06
      calcada.add(stone)
    }
  }
  // lixeira ao fundo: é rua
  const bin = lathe(
    [[0, 0], [0.17, 0], [0.19, 0.42], [0.21, 0.44], [0.21, 0.48], [0, 0.48]],
    '#4d5a52',
    { roughness: 0.5, metalness: 0.4 },
  )
  bin.position.set(-1.75, GY, -0.95)
  calcada.add(bin)
  const binLid = lathe([[0, 0.07], [0.12, 0.06], [0.2, 0.0], [0, 0.0]], '#3c4740', { roughness: 0.5, metalness: 0.4 })
  binLid.position.set(-1.75, GY + 0.48, -0.95)
  calcada.add(binLid)
  root.add(calcada)

  // ---- barraquinha: balcão amarelo + toldo listrado ------------------------
  const barraca = new THREE.Group()
  const CB_H = TOP - 0.06 - GY
  const bodyBox = rbox(COUNTER_W, CB_H, COUNTER_D, 0.04, WOOD, { roughness: 0.7 })
  bodyBox.position.set(COUNTER_X, GY + CB_H / 2, COUNTER_Z)
  barraca.add(bodyBox)
  const counterTop = rbox(COUNTER_W + 0.12, 0.07, COUNTER_D + 0.12, 0.03, WOOD_LIGHT, { roughness: 0.6 })
  counterTop.position.set(COUNTER_X, TOP - 0.035, COUNTER_Z)
  barraca.add(counterTop)
  const kick = rbox(COUNTER_W + 0.04, 0.09, COUNTER_D + 0.04, 0.03, WOOD_DARK, { roughness: 0.8 })
  kick.position.set(COUNTER_X, GY + 0.045, COUNTER_Z)
  barraca.add(kick)
  // tábuas verticais na frente
  const FRONT_Z = COUNTER_Z + COUNTER_D / 2
  for (let k = 1; k < 7; k++) {
    const gx = COUNTER_X - COUNTER_W / 2 + (k * COUNTER_W) / 7
    const groove = rbox(0.018, CB_H - 0.16, 0.02, 0.006, WOOD_DARK, { roughness: 0.85 })
    groove.position.set(gx, GY + 0.09 + (CB_H - 0.16) / 2, FRONT_Z + 0.005)
    barraca.add(groove)
  }
  // friso sob o tampo
  const frieze = rbox(COUNTER_W + 0.02, 0.06, 0.03, 0.012, WOOD_DARK, { roughness: 0.8 })
  frieze.position.set(COUNTER_X, TOP - 0.12, FRONT_Z + 0.01)
  barraca.add(frieze)
  // postes do toldo atrás do balcão
  const AW_Y = 2.12
  const BACK_Z = COUNTER_Z - COUNTER_D / 2 + 0.06
  for (const s of [-1, 1]) {
    const px = COUNTER_X + s * (COUNTER_W / 2 - 0.06)
    const post = cylinder(0.035, 0.035, AW_Y - TOP, POST, { roughness: 0.4, metalness: 0.5 })
    post.position.set(px, TOP + (AW_Y - TOP) / 2, BACK_Z)
    barraca.add(post)
  }
  // toldo: listras creme/verde-água, inclinado para a frente, com babado
  const toldo = new THREE.Group()
  toldo.position.set(COUNTER_X, AW_Y, BACK_Z + 0.2)
  toldo.rotation.x = 0.32
  const NSTR = 9
  const AW_W = COUNTER_W + 0.2
  for (let k = 0; k < NSTR; k++) {
    const sw = AW_W / NSTR
    const strip = rbox(sw + 0.002, 0.04, 0.62, 0.012, k % 2 ? STRIPE_B : STRIPE_A, { roughness: 0.85 })
    strip.position.set(-AW_W / 2 + sw * (k + 0.5), 0, 0)
    toldo.add(strip)
    const flap = new THREE.Mesh(
      new THREE.CylinderGeometry(sw / 2, sw / 2, 0.025, 20, 1, false, 0, Math.PI),
      mat(k % 2 ? STRIPE_B : STRIPE_A, { roughness: 0.85, size: 0.2 }),
    )
    flap.castShadow = true
    flap.rotation.set(Math.PI / 2, 0, Math.PI / 2)
    flap.position.set(-AW_W / 2 + sw * (k + 0.5), -0.02, 0.31)
    toldo.add(flap)
  }
  barraca.add(toldo)
  // condimentos no canto direito: mostarda e ketchup
  for (const [cx, color] of [[COUNTER_X + 0.7, '#e2b92b'], [COUNTER_X + 0.8, '#b8362b']] as const) {
    const btl = lathe(
      [[0, 0], [0.05, 0], [0.055, 0.03], [0.05, 0.17], [0.03, 0.2], [0.012, 0.26], [0, 0.27]],
      color,
      { roughness: 0.35 },
    )
    btl.position.set(cx, TOP, COUNTER_Z + 0.22)
    barraca.add(btl)
  }
  // porta-guardanapos
  const napkins = rbox(0.16, 0.12, 0.08, 0.015, '#9aa1a6', { roughness: 0.3, metalness: 0.6 })
  napkins.position.set(COUNTER_X - 0.2, TOP + 0.06, COUNTER_Z - 0.25)
  barraca.add(napkins)
  const napkinPaper = rbox(0.12, 0.04, 0.06, 0.01, '#fbfaf6', { roughness: 0.9 })
  napkinPaper.position.set(COUNTER_X - 0.2, TOP + 0.13, COUNTER_Z - 0.25)
  barraca.add(napkinPaper)
  root.add(barraca)

  // ---- plaquinha LÖK -------------------------------------------------------
  const placa = new THREE.Group()
  placa.position.set(...SIGN_POS)
  placa.rotation.y = -0.3
  const BOARD_W = 0.62
  const BOARD_H = 0.8
  const board = rbox(BOARD_W, BOARD_H, 0.045, 0.03, SIGN, { roughness: 0.5 })
  board.position.y = BOARD_H / 2
  placa.add(board)
  const frame = rbox(BOARD_W + 0.05, BOARD_H + 0.05, 0.03, 0.03, WOOD_DARK, { roughness: 0.7 })
  frame.position.set(0, BOARD_H / 2, -0.02)
  placa.add(frame)
  // pé: haste e base apoiada no tampo
  const stem = cylinder(0.025, 0.025, SIGN_POS[1] - TOP + 0.02, WOOD_DARK, { roughness: 0.6 })
  stem.position.y = -(SIGN_POS[1] - TOP) / 2
  placa.add(stem)
  const foot = cylinder(0.13, 0.15, 0.04, WOOD_DARK, { roughness: 0.6 })
  foot.position.y = -(SIGN_POS[1] - TOP) + 0.02
  placa.add(foot)
  // desenho da cebola roxa
  const onion = new THREE.Group()
  onion.position.set(0, BOARD_H * 0.69, 0.03)
  const bulb = sphere(0.12, ONION_PURPLE, { roughness: 0.4 })
  bulb.scale.set(1, 0.92, 0.22)
  onion.add(bulb)
  const tip = cone(0.06, 0.12, ONION_PURPLE, { roughness: 0.4 })
  tip.position.y = 0.14
  tip.scale.z = 0.3
  onion.add(tip)
  for (const s of [-1, 1]) {
    const vein = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.008, 8, 24, Math.PI * 0.55),
      mat(ONION_LIGHT, { roughness: 0.4, size: 0.2 }),
    )
    vein.position.set(-s * 0.05, 0, 0.022)
    vein.rotation.z = s > 0 ? Math.PI * 0.22 : Math.PI * 0.23 + Math.PI * 0.55
    vein.scale.set(0.9, 1.1, 1)
    onion.add(vein)
  }
  for (const [sx, rz] of [[-0.025, 0.25], [0.025, -0.25]] as const) {
    const sprout = rbox(0.022, 0.12, 0.012, 0.008, SPROUT, { roughness: 0.6 })
    sprout.position.set(sx, 0.23, 0)
    sprout.rotation.z = rz
    onion.add(sprout)
  }
  for (let k = -1; k <= 1; k++) {
    const rootlet = rbox(0.01, 0.045, 0.01, 0.004, '#a58a63', { roughness: 0.8 })
    rootlet.position.set(k * 0.022, -0.13, 0)
    rootlet.rotation.z = k * 0.4
    onion.add(rootlet)
  }
  placa.add(onion)
  const letters: ['L' | 'Ö' | 'K', number][] = [['L', -0.17], ['Ö', 0.0], ['K', 0.17]]
  for (const [glyph, lx] of letters) {
    const l = letter(glyph)
    l.position.set(lx + (glyph === 'L' ? 0.02 : 0), BOARD_H * 0.24, 0.03)
    placa.add(l)
  }
  root.add(placa)

  // ---- cantora -------------------------------------------------------------
  const cantora = person({ body: GOWN, skin: SKIN, height: H, armAngle: 0.3 })
  cantora.position.set(...SINGER)
  cantora.rotation.y = SINGER_ROT
  root.add(cantora)

  // vestido de gala em sino, com babado na barra e faixa na cintura
  const skirt = lathe(
    [
      [0, 0.0], [0.6, 0.0], [0.63, 0.04], [0.6, 0.12], [0.53, 0.26], [0.45, 0.42],
      [0.39, 0.56], [0.355, 0.66], [0.345, 0.7], [0, 0.7],
    ],
    GOWN,
    { roughness: 0.6 },
    48,
  )
  cantora.add(skirt)
  // pregas: gomos mais escuros descendo do quadril, colados ao sino
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const fold = capsule(0.024, 0.4, '#6a1833', { roughness: 0.62 })
    fold.position.set(Math.sin(a) * 0.495, 0.32, Math.cos(a) * 0.495)
    fold.rotation.set(0, a, 0)
    fold.rotateX(-0.4)
    cantora.add(fold)
  }
  const hem = torus(0.6, 0.04, GOWN_DARK, { roughness: 0.7 })
  hem.rotation.x = Math.PI / 2
  hem.position.y = 0.04
  cantora.add(hem)
  const brooch = sphere(0.045, GOLD, { roughness: 0.3, metalness: 0.7 })
  brooch.position.set(0, 0.69, 0.375)
  cantora.add(brooch)
  // colar de pérolas
  const BODY_H = H * 0.52
  for (let k = 0; k < 13; k++) {
    const a = -1.3 + (k / 12) * 2.6
    const pearl = sphere(0.022, '#f7f3ea', { roughness: 0.25 })
    pearl.position.set(Math.sin(a) * 0.17, BODY_H + 0.0 - Math.cos(a) * 0.04, Math.cos(a) * 0.19)
    cantora.add(pearl)
  }

  // cabeça: coque alto, tiara, boca em bico, lágrimas
  const cabeca = cantora.getObjectByName('head') as THREE.Group
  cabeca.rotation.y = HEAD_TURN
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(HR * 1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42),
    mat(HAIR, { roughness: 0.75, size: 0.5 }),
  )
  hairCap.castShadow = true
  hairCap.rotation.x = -0.5
  hairCap.position.y = 0.01
  cabeca.add(hairCap)
  const backHair = sphere(HR * 0.97, HAIR, { roughness: 0.75 })
  backHair.position.set(0, 0.0, -0.05)
  backHair.scale.set(1.03, 0.96, 0.86)
  cabeca.add(backHair)
  const bun = sphere(HR * 0.55, HAIR, { roughness: 0.75 })
  bun.position.set(0, HR * 1.12, -HR * 0.18)
  bun.scale.set(1, 0.9, 1)
  cabeca.add(bun)
  const bunTop = sphere(HR * 0.33, HAIR, { roughness: 0.75 })
  bunTop.position.set(0, HR * 1.52, -HR * 0.2)
  cabeca.add(bunTop)
  // tiara: aro dourado logo atrás da linha do cabelo, com pontas e uma pedra
  const TIA_Y = HR * 0.78
  const TIA_R = HR * 0.72
  const tiara = new THREE.Mesh(
    new THREE.TorusGeometry(TIA_R, 0.022, 10, 40, 2.2),
    mat(GOLD, { roughness: 0.3, metalness: 0.75, size: 0.3 }),
  )
  tiara.castShadow = true
  tiara.position.set(0, TIA_Y, 0)
  tiara.rotation.set(Math.PI / 2, 0, Math.PI / 2 - 1.1)
  cabeca.add(tiara)
  for (const [b, r] of [[0, 0.045], [-0.38, 0.032], [0.38, 0.032], [-0.75, 0.024], [0.75, 0.024]] as const) {
    const spike = cone(r, r * 3.2, GOLD, { roughness: 0.3, metalness: 0.75 })
    spike.position.set(Math.sin(b) * TIA_R, TIA_Y + r * 1.5, Math.cos(b) * TIA_R)
    spike.rotation.set(-0.35 * Math.cos(b), 0, 0.35 * Math.sin(b))
    cabeca.add(spike)
  }
  const gem = sphere(0.034, '#f3e9ff', { roughness: 0.1 })
  gem.position.set(0, TIA_Y + 0.01, TIA_R + 0.02)
  cabeca.add(gem)

  // boca em bico redondo
  const MOUTH = new THREE.Vector3(0, -HR * 0.4, HR * 0.86)
  const mouthHole = sphere(HR * 0.1, '#4a1a22', { roughness: 0.7 })
  mouthHole.position.copy(MOUTH)
  mouthHole.scale.set(1, 1.1, 0.6)
  cabeca.add(mouthHole)
  const lips = torus(HR * 0.12, HR * 0.055, '#c4495e', { roughness: 0.45 })
  lips.position.copy(MOUTH).add(new THREE.Vector3(0, 0, 0.03))
  lips.scale.set(1, 1.12, 1)
  cabeca.add(lips)
  for (const side of [-1, 1]) {
    const cheek = sphere(HR * 0.16, '#ee9f98', { roughness: 0.7 })
    cheek.position.set(side * HR * 0.56, -HR * 0.2, HR * 0.76)
    cheek.scale.z = 0.4
    cabeca.add(cheek)
  }

  // anéis de som saindo da boca (o agudo UIII)
  const aneis = new THREE.Group()
  aneis.position.copy(MOUTH)
  cabeca.add(aneis)
  for (const [k, r] of [0.07, 0.1, 0.135].entries()) {
    const ring = torus(r, 0.017, RING, { roughness: 0.4 })
    ring.position.set(0.02 * k, k * 0.045, 0.17 + k * 0.17)
    ring.rotation.x = -0.15
    aneis.add(ring)
  }

  // lágrimas escorrendo pelas bochechas
  const lagrimas = new THREE.Group()
  cabeca.add(lagrimas)
  for (const side of [-1, 1]) {
    for (const [dy, s] of [[0, 1], [-0.11, 0.8]] as const) {
      const drop = new THREE.Group()
      drop.position.set(side * HR * 0.47, -HR * 0.15 + dy, HR * 0.86 - Math.abs(dy) * 0.25)
      drop.scale.setScalar(s)
      const ball = sphere(0.034, TEAR, { roughness: 0.1, detail: 0 })
      drop.add(ball)
      const tipD = cone(0.029, 0.055, TEAR, { roughness: 0.1, detail: 0 })
      tipD.position.y = 0.036
      drop.add(tipD)
      lagrimas.add(drop)
    }
  }

  // braços: luvas brancas compridas, pivô no ombro
  const gloveMat = mat(GLOVE, { roughness: 0.8, size: 0.6 })
  const bracoBinoculo = cantora.getObjectByName('armL') as THREE.Mesh
  const bracoEmpurra = cantora.getObjectByName('armR') as THREE.Mesh
  for (const arm of [bracoBinoculo, bracoEmpurra]) {
    shoulderPivot(arm, H)
    arm.material = gloveMat
    for (const c of arm.children) (c as THREE.Mesh).material = gloveMat
  }
  const HAND_Y = -(BODY_H * 0.32 + 0.19 * H)
  const ARM_REST_Z = 0.3

  /** Euler (x, z) que aponta o braço (pendurado em -y) na direção d (local da cantora). */
  function aim(arm: THREE.Object3D, d: THREE.Vector3) {
    const n = d.clone().normalize()
    arm.rotation.set(Math.atan2(-n.z, -n.y), 0, Math.asin(n.x))
  }

  // braço do binóculo (lado da câmera): mão à frente do queixo, de lado
  const shoulderL = bracoBinoculo.position.clone()
  const handTargetL = new THREE.Vector3(-0.3, BODY_H + HR * 0.6, 0.62).sub(shoulderL)
  aim(bracoBinoculo, handTargetL)
  const BIN_X = bracoBinoculo.rotation.x
  const BIN_Z = bracoBinoculo.rotation.z

  // braço que empurra (lado do balcão): esticado para a frente, na altura do tampo
  aim(bracoEmpurra, new THREE.Vector3(0.75, -0.08, 0.65))
  const PUSH_X = bracoEmpurra.rotation.x
  const PUSH_Z = bracoEmpurra.rotation.z

  root.updateMatrixWorld(true)

  // ---- binóculo de ópera (filho da mão, alinhado com o rosto) --------------
  const binoculo = new THREE.Group()
  binoculo.position.set(0, HAND_Y, 0)
  bracoBinoculo.add(binoculo)
  {
    const armQ = bracoBinoculo.getWorldQuaternion(new THREE.Quaternion())
    const headQ = cabeca.getWorldQuaternion(new THREE.Quaternion())
    binoculo.quaternion.copy(armQ.clone().invert().multiply(headQ))
  }
  root.updateMatrixWorld(true)
  {
    // centro das lentes: diante dos olhos, no referencial da cabeça
    const eyesW = cabeca.localToWorld(new THREE.Vector3(0, HR * 0.14, HR * 0.95 + 0.095))
    const eyesL = binoculo.worldToLocal(eyesW.clone())
    const barrels = new THREE.Group()
    barrels.position.copy(eyesL)
    binoculo.add(barrels)
    for (const s of [-1, 1]) {
      const barrel = lathe(
        [[0.0, -0.09], [0.068, -0.09], [0.072, -0.07], [0.064, -0.03], [0.07, 0.0], [0.084, 0.06], [0.1, 0.09], [0.0, 0.09]],
        GOLD,
        { roughness: 0.28, metalness: 0.8 },
        28,
      )
      barrel.rotation.x = Math.PI / 2
      barrel.position.x = s * HR * 0.4
      barrels.add(barrel)
      const lens = cylinder(0.084, 0.084, 0.01, '#2c3d52', { roughness: 0.1 }, 24)
      lens.rotation.x = Math.PI / 2
      lens.position.set(s * HR * 0.4, 0, 0.092)
      barrels.add(lens)
      const band = torus(0.071, 0.012, GOWN, { roughness: 0.5 })
      band.position.set(s * HR * 0.4, 0, 0.0)
      barrels.add(band)
    }
    const bridge = rbox(HR * 0.8 - 0.14, 0.04, 0.05, 0.015, GOLD, { roughness: 0.28, metalness: 0.8 })
    barrels.add(bridge)
    // cabinho: da mão até o canto da lente do lado da câmera
    const attach = eyesL.clone().add(new THREE.Vector3(-HR * 0.4 - 0.05, -0.05, -0.04))
    binoculo.add(rod(new THREE.Vector3(0, 0.02, 0), attach, 0.016, GOLD, { roughness: 0.3, metalness: 0.75 }))
    const knob = sphere(0.03, GOLD, { roughness: 0.3, metalness: 0.75 })
    knob.position.set(0, -0.02, 0)
    binoculo.add(knob)
  }

  // ---- cachorro-quente gigante ---------------------------------------------
  const handW = bracoEmpurra.localToWorld(new THREE.Vector3(0, HAND_Y, 0))
  const pushDir = new THREE.Vector3(1, 0, -0.12).normalize()
  const HD_LEN = 0.8
  const HD_FINAL = new THREE.Vector3(handW.x, TOP, handW.z).addScaledVector(pushDir, HD_LEN / 2 + 0.06)
  const hotdog = new THREE.Group()
  hotdog.position.copy(HD_FINAL)
  hotdog.rotation.y = Math.atan2(-pushDir.z, pushDir.x)
  {
    // pão: duas metades abraçando a salsicha
    for (const s of [-1, 1]) {
      const half = capsule(0.1, HD_LEN - 0.2, BUN, { roughness: 0.75 })
      half.rotation.z = Math.PI / 2
      half.position.set(0, 0.1, s * 0.085)
      half.scale.set(1.0, 1, 0.8)
      hotdog.add(half)
    }
    const crumb = rbox(HD_LEN - 0.1, 0.06, 0.2, 0.03, BUN_DARK, { roughness: 0.85 })
    crumb.position.y = 0.04
    hotdog.add(crumb)
    const sausage = capsule(0.075, HD_LEN - 0.02, SAUSAGE, { roughness: 0.4 })
    sausage.rotation.z = Math.PI / 2
    sausage.position.y = 0.16
    hotdog.add(sausage)
  }
  root.add(hotdog)

  // montanha de cebola picada (filha do pão: anda com ele)
  const cebola = new THREE.Group()
  cebola.position.y = 0.2
  hotdog.add(cebola)
  {
    const r2 = rng(7)
    const N = 120
    for (let k = 0; k < N; k++) {
      const x = (r2() - 0.5) * (HD_LEN - 0.08)
      const z = (r2() - 0.5) * 0.28
      const hx = 1 - (x / (HD_LEN / 2)) ** 2
      const hz = 1 - (z / 0.18) ** 2
      const h = Math.max(0, 0.3 * hx * hz)
      const y = h * Math.sqrt(r2())
      const sz = 0.045 + r2() * 0.02
      const cube = rbox(sz, sz, sz, 0.008, ONIONS[k % ONIONS.length], { roughness: 0.35 })
      cube.position.set(x, y, z)
      cube.rotation.set(r2() * 3, r2() * 3, r2() * 3)
      cebola.add(cube)
    }
    // umas lascas curvas de cebola por cima: anéis partidos, borda lilás
    for (let k = 0; k < 6; k++) {
      const arcSlice = new THREE.Mesh(
        new THREE.TorusGeometry(0.06 + r2() * 0.025, 0.012, 8, 20, Math.PI * (0.7 + r2() * 0.4)),
        mat(k % 2 ? '#efe2f2' : '#e6d0ee', { roughness: 0.3, size: 0.12 }),
      )
      arcSlice.castShadow = true
      const x = -0.27 + k * 0.11
      const hx = 1 - (x / (HD_LEN / 2)) ** 2
      arcSlice.position.set(x, 0.3 * hx * 0.85, (r2() - 0.5) * 0.12)
      arcSlice.rotation.set(-1.0 + r2() * 0.6, r2() * 3, r2() * 3)
      cebola.add(arcSlice)
    }
    // cubinhos que rolaram para o tampo
    for (let k = 0; k < 9; k++) {
      const sz = 0.04 + r2() * 0.015
      const cube = rbox(sz, sz, sz, 0.008, ONIONS[k % ONIONS.length], { roughness: 0.35 })
      const a = r2() * Math.PI * 2
      cube.position.set(Math.cos(a) * (0.3 + r2() * 0.15), -0.2 + sz / 2, Math.sin(a) * (0.2 + r2() * 0.08))
      cube.rotation.set(0, r2() * 3, 0)
      cebola.add(cube)
    }
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'calcada', group: 'rua', object: calcada },
    { name: 'barraca', group: 'rua', object: barraca },
    { name: 'cantora', group: 'cantora', object: cantora },
    { name: 'bracoEmpurra', group: 'cantora', object: bracoEmpurra },
    { name: 'bracoBinoculo', group: 'cantora', object: bracoBinoculo },
    { name: 'hotdog', group: 'cachorro', object: hotdog },
    { name: 'cebola', group: 'cebola', object: cebola },
    { name: 'lagrimas', group: 'agudo', object: lagrimas },
    { name: 'aneis', group: 'agudo', object: aneis },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'binoculo', group: 'placa', object: binoculo },
  ]

  // ---- montagem ------------------------------------------------------------
  const HD0 = HD_FINAL.clone().addScaledVector(pushDir, -PUSH)
  const build = [
    seq('calcada-rise', 'calcada', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Dez minutos antes da estreia, numa calçada da cidade…',
    }),
    seq('barraca-rise', 'barraca', 0.25, 0.9, [riseFrom(0, 2.2)], { ease: 'easeOut' }),

    seq('cantora-rise', 'cantora', 1.4, 0.9, [riseFrom(GY, 2.1)], {
      ease: 'easeOut',
      caption: 'A cantora de ópera, já de vestido de gala, para na barraquinha de cachorro-quente.',
    }),
    seq('empurra-repouso', 'bracoEmpurra', 1.4, 0.9, [ch('rotation.x', 0.2, 0), ch('rotation.z', -ARM_REST_Z - 0.2, -ARM_REST_Z)], { ease: 'easeOut' }),
    seq('binoculo-repouso', 'bracoBinoculo', 1.4, 0.9, [ch('rotation.x', 0.2, 0), ch('rotation.z', ARM_REST_Z + 0.2, ARM_REST_Z)], { ease: 'easeOut' }),

    seq('hotdog-cai', 'hotdog', 2.9, 0.7, [
      ch('position.y', TOP + 1.3, TOP), ch('position.x', HD0.x, HD0.x), ch('position.z', HD0.z, HD0.z),
      ch('rotation.z', 0.5, 0),
    ], {
      ease: 'easeIn',
      caption: 'O vendedor entrega um cachorro-quente gigante…',
    }),
    seq('cebola-cai', 'cebola', 3.8, 0.8, [
      ch('position.y', 1.0, 0.2), ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
    ], {
      ease: 'easeIn',
      caption: '…e soterra o pão numa montanha de cebola crua!',
    }),

    seq('lagrimas-brotam', 'lagrimas', 5.2, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1), ch('position.y', 0.06, 0),
    ], {
      ease: 'easeOut',
      caption: 'O cheiro sobe pros olhos e ela solta o agudo mais alto da carreira, de bico: UIII… TAN(TA)!',
    }),
    seq('aneis-saem', 'aneis', 5.5, 0.9, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.2, 1),
    ], { ease: 'easeOut' }),

    seq('placa-rise', 'placa', 7.0, 0.8, [riseFrom(SIGN_POS[1], 1.3)], {
      ease: 'easeOut',
      caption: 'Com os olhos escorrendo, mira o binóculo de ópera na plaquinha da barraca: LÖK.',
    }),
    seq('binoculo-ergue', 'bracoBinoculo', 7.2, 0.7, [
      ch('rotation.x', 0, BIN_X), ch('rotation.z', ARM_REST_Z, BIN_Z),
    ], { ease: 'easeOut' }),
    seq('binoculo-abre', 'binoculo', 7.5, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('placa-balanca', 'placa', 8.4, 0.5, [ch('rotation.z', 0, 0.07)], {
      caption: 'Ela LEU — de boca redonda, em bico, como canta: LEU-K! LÖÖK.',
    }),
    seq('placa-assenta', 'placa', 8.9, 0.5, [ch('rotation.z', 0.07, 0)]),

    seq('binoculo-tac', 'binoculo', 10.0, 0.18, [ch('scale.x', 1, 0.55)], {
      caption: 'Fecha o binóculo num estalo — TAC! — e empurra o pão de volta.',
    }),
    seq('binoculo-volta', 'binoculo', 10.18, 0.25, [ch('scale.x', 0.55, 1)], { ease: 'easeOut' }),
    seq('empurra-estica', 'bracoEmpurra', 10.1, 0.6, [
      ch('rotation.x', 0, PUSH_X), ch('rotation.z', -ARM_REST_Z, PUSH_Z),
    ], { ease: 'easeOut' }),
    seq('hotdog-desliza', 'hotdog', 10.5, 0.45, [
      ch('position.x', HD0.x, HD_FINAL.x), ch('position.z', HD0.z, HD_FINAL.z),
    ], { ease: 'easeOut' }),

    seq('aneis-final', 'aneis', 11.6, 0.5, [ch('rotation.z', 0.15, 0)], {
      caption: 'Utan lök, tack. — Sem cebola, por favor.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.32, 2.36, 4.1], target: [0.42, 1.24, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'utan-lok-tack',
    contexto:
      "Restaurante: na barraquinha de cachorro-quente (korvkiosk), na hamburgueria, no balcão do kebab ou no pedido do restaurante. Na korvkiosk o atendente costuma perguntar 'Med lök?' — e ali a cebola vem de dois jeitos: 'rostad lök' (frita e crocante) e 'råhackad lök' (crua e picadinha). O molde serve pra tirar qualquer coisa: 'Utan ost, tack'.",
    fraseFonte: 'Sem cebola, por favor.',
    fraseAlvo: 'Utan lök, tack.',
    pronuncia:
      "ÜÜ-tan LÖÖK, tak ('utan' com a força no U, que é de BICO — lábios de U e língua de I — e longo, e o -tan fraquinho, N de língua sem nasalizar; 'lök' com ö LONGO — lábios em bico e língua de Ê — e K seco, levando a força maior; 'tack' com A curto e K seco)",
    ponteSonora:
      "UI! TAN(ta)... LEU-K!... TAC! (4 sílabas: ÜÜ-tan-LÖÖK-tak; força no ÜÜ e, maior, no LÖÖK; UI = o 'UI!' da cebola ardendo nos olhos, mas FUNDIDO numa vogal só: lábios no bico do U e a língua parada no I ao mesmo tempo — é o Ü, o 'u' sueco de DÜ ('du') e do ÜTE de 'Jag har låst mig ute', o mesmo truque da BI(R)ÚTA de 'Kan jag byta den här?'; LONGO, é a nota aguda da cantora — nunca 'u-í' em dois pedaços, nunca o U chapado de 'uva'; TAN = o TANTA cortado: A curto, N batido na ponta da língua, SEM o 'tã' nasal, e fraquinho — ÜÜ-tan é uma palavra só, 'utan' (sem); LEU = ela LEU a placa — e cantora de ópera lê como canta, de BOCA REDONDA: a língua parada no Ê e os lábios em bico AO MESMO TEMPO, numa vogal só — é o ö, irmão do Ü (o UI dá Ü, o LEU dá Ö), o MESMO LÖÖ do pombo de 'Vad är lösenordet till wifit?', que também lê de bico; LONGO e com a força maior da frase; nunca 'lê-u' em dois pedaços; e não é a fada de 'Är det ledigt här?', que lê de boquinha FECHADA, sem bico, e sai 'le-': sem o bico aqui sai LÊK, 'lek' (brincadeira), o LÊK do leque STOR de 'storlek'; os dois pinguinhos do Ö da placa são os lábios em bico; K = a última letra da placa, seca, sem vogal: LÖÖK, uma sílaba só; TAC = o 'tack' de sempre, A curto e K seco — aqui, o estalo do binóculo de ópera fechando)",
    historia:
      'Dez minutos antes da estreia, a cantora de ópera, já de vestido de gala, para na barraquinha de cachorro-quente da calçada — e o vendedor soterra o pão dela numa montanha de cebola crua. O cheiro sobe direto pros olhos e ela solta o agudo mais alto da carreira, de bico: UIII... TANTA! Com os olhos escorrendo, mira o binóculo de ópera na plaquinha da barraca, onde, embaixo do desenho de uma cebola, há uma palavra só, LÖK. Ela LEU — e cantora de ópera lê como canta, de boca redonda, em bico: LEU-K! Fecha o binóculo num estalo — TAC! — e empurra o pão de volta: hoje à noite tem dueto de beijo. Sem cebola, obrigada.',
  },
  createScene,
}

export default card
