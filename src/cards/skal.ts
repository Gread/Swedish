import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Skål!" — SSS-CÔL! O vampiro do julbord tem que fazer uma ESCOLHA: recua
 * chiando — SSSS! — do cálice com a cabeça de alho e ergue bem alto o cálice
 * vermelho, olhando nos seus olhos como manda a etiqueta sueca: SKÔL!
 *
 * Diorama: piso de lajes de pedra; mesa comprida de madeira escura com
 * toalha branca e trilho verde de Natal; candelabro dourado de três velas;
 * vampiro de capa preta e gola alta atrás da mesa. O vermelho saturado é
 * reservado ao líquido do cálice erguido (e ao brilho dos olhos).
 */

const STONE = '#4a4b50'
const STONE_DARK = '#33343a'
const STONE_LIGHT = '#5a5b61'
const WOOD = '#3b2618'
const WOOD_LIGHT = '#54371f'
const CLOTH = '#f1ede4'
const CLOTH_SHADE = '#ddd6c8'
const RUNNER = '#2f5a3e'
const GOLD = '#d4a640'
const CANDLE = '#f3ead2'
const FLAME = '#ffd27a'
const CAPE = '#1d1b22'
const LINING = '#7a1f2c' // forro bordô (escuro: não compete com o cálice)
const SKIN = '#c6d4b4' // pálido esverdeado
const HAIR = '#121116'
const FANG = '#fbf8ef'
const SILVER = '#c8ccd2'
const GARLIC = '#f1ebdc'
const GARLIC_LINE = '#b89bb0'
const MEATBALL = '#7a4a2b'
const ACCENT = '#d40f22' // acento saturado RESERVADO: o líquido do brinde
const HISS = '#bfe3c9'

const GY = 0.18 // topo das lajes
const TOP = 0.86 // tampo da mesa (com toalha)
const VAMP_Z = -0.62
const VAMP_X = 0.05
const VAMP_S = 1.32
const VAMP_LEAN = -0.1 // recua do alho (para +x)
const H = 1.5 // altura-base do person()
const SH = 0.19 * H // deslocamento do pivô de shoulderPivot()
const ARM_UP = 2.9 // braço direito erguido
const GARLIC_POS: [number, number, number] = [-1.0, TOP, 0.14]
const SSS_POS: [number, number, number] = [-0.5, 1.86, -0.05]

/** Arco de traço grosso no plano xy, de `start` a `start + arc` (radianos). */
function arcStroke(r: number, tube: number, start: number, arc: number) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 12, 40, arc),
    mat(HISS, { roughness: 0.5 }),
  )
  m.rotation.z = start
  m.castShadow = true
  return m
}

/** S curvo de traço grosso: dois arcos encadeados (não lê como "5"). */
function letterS() {
  const g = new THREE.Group()
  const r = 0.058
  const t = 0.02
  const top = arcStroke(r, t, 0.45, Math.PI * 1.5 - 0.45)
  top.position.y = r
  g.add(top)
  const bottom = arcStroke(r, t, -Math.PI + 0.45,Math.PI * 1.5 - 0.45)
  bottom.position.y = -r
  g.add(bottom)
  for (const [x, y] of [[r * Math.cos(0.45), r + r * Math.sin(0.45)], [-r * Math.cos(0.45), -r - r * Math.sin(0.45)]]) {
    const cap = sphere(t, HISS, { roughness: 0.5 })
    cap.position.set(x, y, 0)
    g.add(cap)
  }
  return g
}

/** Cálice: perfil torneado de pé, haste com nó e taça. */
function goblet(scale: number, glass: THREE.Material, rim: THREE.MeshStandardMaterial) {
  const g = new THREE.Group()
  const foot = new THREE.Mesh(
    new THREE.LatheGeometry(
      [[0, 0], [0.11, 0], [0.115, 0.012], [0.08, 0.03], [0.025, 0.06], [0, 0.06]].map(
        ([r, y]) => new THREE.Vector2(r * scale, y * scale),
      ),
      40,
    ),
    rim,
  )
  g.add(foot)
  const stem = cylinder(0.022 * scale, 0.026 * scale, 0.2 * scale, '#000')
  stem.material = rim
  stem.position.y = 0.16 * scale
  g.add(stem)
  const knot = sphere(0.042 * scale, '#000')
  knot.material = rim
  knot.position.y = 0.15 * scale
  knot.scale.y = 0.7
  g.add(knot)
  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0, 0.25], [0.06, 0.26], [0.12, 0.3], [0.155, 0.38], [0.165, 0.47], [0.16, 0.52],
        [0.15, 0.52], [0.152, 0.47], [0.142, 0.38], [0.108, 0.31], [0.05, 0.275], [0, 0.27],
      ].map(([r, y]) => new THREE.Vector2(r * scale, y * scale)),
      48,
    ),
    glass,
  )
  bowl.castShadow = true
  g.add(bowl)
  const lip = torus(0.157 * scale, 0.008 * scale, '#000')
  lip.material = rim
  lip.rotation.x = Math.PI / 2
  lip.position.y = 0.52 * scale
  g.add(lip)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(31)

  // ---- base do diorama: lajes de pedra do salão ----------------------------
  const base = new THREE.Group()

  const plinth = cylinder(2.62, 2.72, 0.12, STONE_DARK, { roughness: 0.9 })
  plinth.position.y = 0.06
  base.add(plinth)

  const slab = cylinder(2.55, 2.6, 0.05, STONE_DARK, { roughness: 0.9 })
  slab.position.y = 0.135
  base.add(slab)

  // lajes irregulares dentro do disco
  const TILE = 0.62
  for (let ix = -4; ix <= 4; ix++) {
    for (let iz = -4; iz <= 4; iz++) {
      const off = iz % 2 === 0 ? 0 : TILE / 2
      const x = ix * TILE + off
      const z = iz * TILE
      if (Math.hypot(x, z) > 2.5 - TILE * 0.5) continue
      const shade = [STONE, STONE_LIGHT, '#505157'][Math.floor(rand() * 3)]
      const tile = rbox(TILE - 0.05, 0.04, TILE - 0.05, 0.02, shade, { roughness: 0.92 })
      tile.position.set(x, GY - 0.02 + rand() * 0.008, z)
      tile.rotation.y = (rand() - 0.5) * 0.04
      base.add(tile)
    }
  }
  root.add(base)

  // ---- mesa comprida do julbord --------------------------------------------
  const mesa = new THREE.Group()
  const TW = 3.1
  const TD = 1.05
  const TZ = 0.12

  // pés torneados (aparecem por baixo da toalha)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = lathe(
        [[0, 0], [0.07, 0], [0.075, 0.05], [0.05, 0.12], [0.065, 0.24], [0.045, 0.36],
          [0.05, 0.5], [0.06, 0.56], [0, 0.56]],
        WOOD,
        { roughness: 0.6 },
      )
      leg.position.set(sx * (TW / 2 - 0.22), GY, TZ + sz * (TD / 2 - 0.15))
      mesa.add(leg)
    }
  }
  const tampo = rbox(TW, 0.08, TD, 0.03, WOOD_LIGHT, { roughness: 0.55 })
  tampo.position.set(0, TOP - 0.06, TZ)
  mesa.add(tampo)

  // toalha branca: tampo + caimento na frente e nas laterais
  const cloth = rbox(TW + 0.06, 0.03, TD + 0.06, 0.012, CLOTH, { roughness: 0.85 })
  cloth.position.set(0, TOP - 0.012, TZ)
  mesa.add(cloth)
  const DROP = 0.3
  const front = rbox(TW + 0.06, DROP, 0.025, 0.01, CLOTH, { roughness: 0.85 })
  front.position.set(0, TOP - DROP / 2, TZ + TD / 2 + 0.035)
  mesa.add(front)
  for (const sx of [-1, 1]) {
    const side = rbox(0.025, DROP, TD + 0.06, 0.01, CLOTH, { roughness: 0.85 })
    side.position.set(sx * (TW / 2 + 0.035), TOP - DROP / 2, TZ)
    mesa.add(side)
  }
  // dobras do caimento: pregas suaves na frente
  for (let i = -6; i <= 6; i++) {
    const fold = capsule(0.018, DROP - 0.06, CLOTH_SHADE, { roughness: 0.85 })
    fold.position.set(i * 0.24, TOP - DROP / 2 - 0.01, TZ + TD / 2 + 0.05)
    mesa.add(fold)
  }
  // trilho verde de Natal ao longo da mesa, caindo pela frente
  const runner = rbox(0.5, 0.012, TD + 0.08, 0.005, RUNNER, { roughness: 0.85 })
  runner.position.set(VAMP_X, TOP + 0.006, TZ)
  mesa.add(runner)
  const runnerDrop = rbox(0.5, 0.22, 0.014, 0.005, RUNNER, { roughness: 0.85 })
  runnerDrop.position.set(VAMP_X, TOP - 0.11, TZ + TD / 2 + 0.06)
  mesa.add(runnerDrop)
  for (const yy of [TOP - 0.2, TOP - 0.17]) {
    const band = rbox(0.5, 0.012, 0.016, 0.004, GOLD, { roughness: 0.4, metalness: 0.6 })
    band.position.set(VAMP_X, yy, TZ + TD / 2 + 0.07)
    mesa.add(band)
  }

  // prato de almôndegas (köttbullar)
  const plate = lathe(
    [[0, 0], [0.2, 0], [0.24, 0.03], [0.25, 0.04], [0.21, 0.025], [0, 0.02]],
    CLOTH,
    { roughness: 0.2 },
  )
  plate.position.set(0.95, TOP, 0.42)
  for (let i = 0; i < 7; i++) {
    const a = (i / 6) * Math.PI * 2
    const r = i === 6 ? 0 : 0.11
    const ball = sphere(0.055, MEATBALL, { roughness: 0.8 })
    ball.position.set(Math.cos(a) * r, i === 6 ? 0.1 : 0.065, Math.sin(a) * r)
    plate.add(ball)
  }
  mesa.add(plate)

  // presunto de Natal (julskinka) com crosta de mostarda e cravos
  const board = rbox(0.5, 0.04, 0.32, 0.015, WOOD_LIGHT, { roughness: 0.7 })
  board.position.set(-0.45, TOP + 0.02, 0.45)
  mesa.add(board)
  const ham = sphere(0.15, '#d9a35a', { roughness: 0.6 })
  ham.scale.set(1.25, 0.75, 0.9)
  ham.position.set(-0.45, TOP + 0.13, 0.45)
  mesa.add(ham)
  const hamSide = cylinder(0.135, 0.135, 0.02, '#e2a0a0', { roughness: 0.7 })
  hamSide.rotation.z = Math.PI / 2
  hamSide.scale.set(0.75, 1, 0.9)
  hamSide.position.set(-0.27, TOP + 0.13, 0.45)
  mesa.add(hamSide)
  for (let i = 0; i < 5; i++) {
    const clove = sphere(0.014, '#3b2414', { roughness: 0.7 })
    clove.position.set(-0.6 + i * 0.06, TOP + 0.235, 0.42 + (i % 2) * 0.05)
    mesa.add(clove)
  }

  root.add(mesa)

  // ---- candelabro dourado de três velas ------------------------------------
  const candelabro = new THREE.Group()
  candelabro.position.set(1.3, TOP, -0.3)
  const goldMat = { roughness: 0.28, metalness: 0.85 }
  const cbase = lathe(
    [[0, 0], [0.17, 0], [0.17, 0.03], [0.1, 0.07], [0.05, 0.12], [0.04, 0.2], [0, 0.2]],
    GOLD,
    goldMat,
  )
  candelabro.add(cbase)
  const shaft = cylinder(0.03, 0.035, 0.36, GOLD, goldMat)
  shaft.position.y = 0.36
  candelabro.add(shaft)
  for (const ky of [0.27, 0.46]) {
    const knob = sphere(0.055, GOLD, goldMat)
    knob.position.y = ky
    knob.scale.y = 0.7
    candelabro.add(knob)
  }
  // braços em U
  const arms = torus(0.24, 0.025, GOLD, goldMat)
  ;(arms.geometry as THREE.BufferGeometry).dispose()
  arms.geometry = new THREE.TorusGeometry(0.24, 0.025, 16, 32, Math.PI)
  arms.rotation.z = Math.PI
  arms.position.y = 0.72
  candelabro.add(arms)
  const flames: THREE.Object3D[] = []
  for (const cx of [-0.24, 0, 0.24]) {
    const cup = lathe(
      [[0, 0], [0.05, 0], [0.07, 0.05], [0.075, 0.06], [0.04, 0.05], [0, 0.05]],
      GOLD,
      goldMat,
    )
    cup.position.set(cx, cx === 0 ? 0.5 : 0.72, 0)
    candelabro.add(cup)
    const candleH = cx === 0 ? 0.36 : 0.24
    const candle = cylinder(0.034, 0.036, candleH, CANDLE, { roughness: 0.5 })
    candle.position.set(cx, cup.position.y + 0.05 + candleH / 2, 0)
    candelabro.add(candle)
    const drip = capsule(0.012, 0.05, CANDLE, { roughness: 0.5 })
    drip.position.set(cx + 0.03, cup.position.y + 0.05 + candleH - 0.04, 0.012)
    candelabro.add(drip)
    const wick = cylinder(0.005, 0.005, 0.03, '#2a2018')
    wick.position.set(cx, cup.position.y + 0.05 + candleH + 0.015, 0)
    candelabro.add(wick)
    const flame = sphere(0.032, FLAME, { emissive: '#ffb648', emissiveIntensity: 1.4 })
    flame.scale.set(0.8, 1.7, 0.8)
    flame.position.set(cx, cup.position.y + 0.05 + candleH + 0.065, 0)
    candelabro.add(flame)
    flames.push(flame)
  }
  const glow = new THREE.PointLight('#ffb35c', 1.6, 3.2, 1.6)
  glow.position.set(0, 1.15, 0.3)
  candelabro.add(glow)
  root.add(candelabro)

  // ---- vampiro atrás da mesa (olha para a câmera, +z) ----------------------
  const vampiro = person({ body: CAPE, skin: SKIN, height: H, armAngle: 0.3 })
  vampiro.position.set(VAMP_X, GY, VAMP_Z)
  vampiro.rotation.z = VAMP_LEAN
  vampiro.scale.setScalar(VAMP_S)
  root.add(vampiro)

  // colete/plastrão branco e medalhão: quebra o preto do tronco
  // camisa branca em V entre as lapelas da capa
  const shirt = rbox(0.2, 0.28, 0.04, 0.02, CLOTH, { roughness: 0.7 })
  shirt.position.set(0, 0.62, 0.228)
  shirt.rotation.x = -0.12
  vampiro.add(shirt)
  for (const side of [-1, 1]) {
    const lapel = rbox(0.085, 0.36, 0.035, 0.015, CAPE, { roughness: 0.6 })
    lapel.position.set(side * 0.085, 0.6, 0.25)
    lapel.rotation.set(-0.12, 0, -side * 0.3)
    vampiro.add(lapel)
  }
  const tie = sphere(0.04, CAPE, { roughness: 0.6 })
  tie.position.set(0, 0.74, 0.245)
  tie.scale.set(1.5, 0.8, 0.6)
  vampiro.add(tie)
  const medal = cylinder(0.032, 0.032, 0.015, '#e8bf55', { roughness: 0.35, metalness: 0.6 })
  medal.rotation.x = Math.PI / 2 - 0.12
  medal.position.set(0, 0.64, 0.256)
  vampiro.add(medal)

  const head = vampiro.getObjectByName('head') as THREE.Group
  const hr = 0.19 * H
  // sobrancelhas franzidas
  for (const side of [-1, 1]) {
    const brow = rbox(0.11, 0.03, 0.03, 0.012, HAIR, { roughness: 0.6 })
    brow.position.set(side * 0.105, hr * 0.37, hr * 0.86)
    brow.rotation.z = side * 0.35
    head.add(brow)
  }
  // cabelo: calota preta penteada pra trás + bico (V) na testa
  const hair = sphere(0.3, HAIR, { roughness: 0.45 })
  hair.position.set(0, 0.11, -0.1)
  hair.scale.set(1.0, 0.92, 1.0)
  head.add(hair)
  // bico em V: triângulo achatado colado na testa, ponta pra baixo
  const peak = cone(0.1, 0.2, HAIR, { roughness: 0.45 }, 3)
  peak.scale.z = 0.3
  peak.position.set(0, hr * 0.6, hr * 0.8)
  peak.rotation.set(Math.PI - 0.55, 0, 0)
  head.add(peak)
  // orelhas pontudas
  for (const side of [-1, 1]) {
    const ear = cone(0.05, 0.16, SKIN, { roughness: 0.6 })
    ear.position.set(side * hr * 0.98, 0.03, -0.02)
    ear.rotation.z = -side * 0.9
    ear.scale.z = 0.45
    head.add(ear)
  }
  // boca aberta no chiado
  const mouth = sphere(0.07, '#3a0f16', { roughness: 0.7 })
  mouth.position.set(0, -hr * 0.42, hr * 0.84)
  mouth.scale.set(1.15, 0.65, 0.5)
  head.add(mouth)

  // ---- capa preta de gola alta com forro bordô ------------------------------
  const capa = new THREE.Group()
  vampiro.add(capa)
  const back = rbox(0.74, 1.0, 0.05, 0.04, CAPE, { roughness: 0.75 })
  back.position.set(0, 0.48, -0.25)
  capa.add(back)
  for (const side of [-1, 1]) {
    // aba lateral aberta: preto por fora, forro vermelho voltado para a frente
    const wing = new THREE.Group()
    wing.position.set(side * 0.33, 0.48, -0.2)
    wing.rotation.set(0, side * 0.75, side * 0.06)
    const outer = rbox(0.34, 1.0, 0.035, 0.03, CAPE, { roughness: 0.75 })
    outer.position.x = side * 0.15
    wing.add(outer)
    const inner = rbox(0.3, 0.94, 0.02, 0.02, LINING, { roughness: 0.6 })
    inner.position.set(side * 0.15, 0.01, 0.024)
    wing.add(inner)
    capa.add(wing)

    // gola alta: painel em leque atrás da cabeça
    const collar = new THREE.Group()
    collar.position.set(side * 0.13, 0.8, -0.13)
    collar.rotation.set(-0.28, side * 0.35, -side * 0.42)
    const cOuter = rbox(0.3, 0.5, 0.035, 0.04, CAPE, { roughness: 0.75 })
    cOuter.position.y = 0.23
    collar.add(cOuter)
    const cInner = rbox(0.26, 0.45, 0.02, 0.035, LINING, { roughness: 0.6 })
    cInner.position.set(0, 0.23, 0.024)
    collar.add(cInner)
    capa.add(collar)
  }

  // ---- olhos vermelhos brilhantes (sobre os olhos do person) ----------------
  const olhos = new THREE.Group()
  head.add(olhos)
  for (const side of [-1, 1]) {
    const iris = sphere(hr * 0.23, '#ff3b3b', { emissive: '#ff1428', emissiveIntensity: 1.3 })
    iris.position.set(side * hr * 0.38, hr * 0.12, hr * 0.84)
    iris.scale.z = 0.6
    olhos.add(iris)
    const slit = rbox(0.016, 0.05, 0.01, 0.006, '#1a0508', { roughness: 0.3 })
    slit.position.set(side * hr * 0.38, hr * 0.12, hr * 0.84 + hr * 0.14)
    olhos.add(slit)
  }

  // ---- caninos ---------------------------------------------------------------
  const caninos = new THREE.Group()
  caninos.position.set(0, -hr * 0.34, hr * 0.9)
  head.add(caninos)
  for (const side of [-1, 1]) {
    const fang = cone(0.022, 0.085, FANG, { roughness: 0.2 })
    fang.rotation.x = Math.PI
    fang.position.set(side * 0.045, -0.04, 0)
    caninos.add(fang)
  }

  // ---- braços: pivô no ombro ------------------------------------------------
  const bracoL = vampiro.getObjectByName('armL') as THREE.Mesh
  const bracoR = vampiro.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoL, H)
  shoulderPivot(bracoR, H)
  // esquerdo: estendido em defesa na direção do alho (pose final)
  bracoL.rotation.set(0, 0.8, -1.9)
  // direito: erguido bem alto com o cálice (pose final)
  bracoR.rotation.z = ARM_UP

  // ---- cálice do brinde na mão erguida --------------------------------------
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#f4f8fb',
    roughness: 0.0,
    metalness: 0,
    transmission: 1,
    thickness: 0.01,
    ior: 1.45,
  })
  const silverMat = mat(SILVER, { roughness: 0.25, metalness: 0.85 })

  const calice = new THREE.Group()
  calice.position.set(0, -0.25 - SH - 0.02, 0.02)
  calice.rotation.z = -ARM_UP + 0.08 // de pé no mundo, levemente inclinado no brinde
  bracoR.add(calice)
  const brinde = goblet(1, glassMat, silverMat)
  brinde.position.y = -0.14
  calice.add(brinde)
  const liquid = lathe(
    [[0, 0.255], [0.06, 0.265], [0.115, 0.3], [0.145, 0.37], [0.155, 0.44], [0, 0.44]],
    ACCENT,
    { roughness: 0.15 },
  )
  liquid.position.y = -0.14
  calice.add(liquid)

  // ---- cálice do alho, na mesa ----------------------------------------------
  const caliceAlho = goblet(1.15, glassMat, silverMat)
  caliceAlho.position.set(...GARLIC_POS)
  root.add(caliceAlho)

  // cabeça de alho: bulbo de dentes + ponta + raízes, saindo da boca da taça
  const alho = new THREE.Group()
  alho.position.set(GARLIC_POS[0], GARLIC_POS[1] + 0.6, GARLIC_POS[2])
  alho.rotation.z = 0.12
  // bulbo: barriga larga e achatada que afina num pescoço torcido
  const BULB: [number, number][] = [
    [0, -0.13], [0.07, -0.125], [0.15, -0.09], [0.19, -0.02], [0.19, 0.05], [0.16, 0.11],
    [0.1, 0.16], [0.045, 0.2], [0.03, 0.26], [0.025, 0.31], [0, 0.32],
  ]
  const bulb = lathe(BULB, GARLIC, { roughness: 0.7 })
  alho.add(bulb)
  // gomos: dentes levemente salientes, separados por veios arroxeados
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    const clove = sphere(0.1, GARLIC, { roughness: 0.7 })
    clove.scale.set(0.7, 1.05, 0.7)
    clove.position.set(Math.cos(a) * 0.1, 0.0, Math.sin(a) * 0.1)
    alho.add(clove)
    const a2 = a + Math.PI / 7
    const seam = capsule(0.006, 0.17, GARLIC_LINE, { roughness: 0.7 })
    seam.position.set(Math.cos(a2) * 0.188, 0.01, Math.sin(a2) * 0.188)
    seam.rotation.set(Math.sin(a2) * 0.35, 0, -Math.cos(a2) * 0.35)
    alho.add(seam)
  }
  // raízes secas embaixo
  const roots = cylinder(0.06, 0.05, 0.03, '#b9a27c', { roughness: 0.95 })
  roots.position.y = -0.14
  alho.add(roots)
  root.add(alho)

  // ---- SSS: o chiado de cobra entre o vampiro e o alho ----------------------
  const sss = new THREE.Group()
  sss.position.set(...SSS_POS)
  sss.rotation.set(-0.12, 0.2, 0.12)
  for (let i = 0; i < 3; i++) {
    const s = letterS()
    s.position.set(-i * 0.2, -i * 0.07, 0)
    s.scale.setScalar(1 - i * 0.12)
    sss.add(s)
  }
  root.add(sss)

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'salao', object: base },
    { name: 'mesa', group: 'salao', object: mesa },
    { name: 'candelabro', group: 'velas', object: candelabro },
    { name: 'vampiro', group: 'vampiro', object: vampiro },
    { name: 'capa', group: 'vampiro', object: capa },
    { name: 'caliceAlho', group: 'alho', object: caliceAlho },
    { name: 'alho', group: 'alho', object: alho },
    { name: 'bracoL', group: 'chiado', object: bracoL },
    { name: 'caninos', group: 'chiado', object: caninos },
    { name: 'sss', group: 'chiado', object: sss },
    { name: 'bracoR', group: 'brinde', object: bracoR },
    { name: 'calice', group: 'brinde', object: calice },
    { name: 'olhos', group: 'olhar', object: olhos },
  ]

  const grow = (from = 0.01) => [
    ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1),
  ]

  // ---- montagem --------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Julbord sueco num salão de pedra: brota a mesa comprida de toalha branca…',
    }),
    seq('mesa-rise', 'mesa', 0.25, 0.9, [riseFrom(0, 1.4)], { ease: 'easeOut' }),
    seq('candelabro-grow', 'candelabro', 1.2, 0.7, [...grow(), riseFrom(TOP, 0.4)], {
      ease: 'easeOut',
      caption: '…e o candelabro dourado acende as três velas.',
    }),

    seq('vampiro-rise', 'vampiro', 2.4, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Atrás da mesa sobe o vampiro. Ele tem que fazer uma ESCOLHA…',
    }),
    seq('capa-abre', 'capa', 2.8, 0.7, [ch('scale.x', 0.3, 1)], { ease: 'easeOut' }),

    seq('caliceAlho-grow', 'caliceAlho', 4.1, 0.6, grow(), {
      ease: 'easeOut',
      caption: 'Na mesa, um cálice com uma cabeça de ALHO inteira dentro!',
    }),
    seq('alho-cai', 'alho', 4.5, 0.6, [
      ch('position.y', GARLIC_POS[1] + 1.4, GARLIC_POS[1] + 0.6), ch('rotation.z', 1.4, 0.12),
    ], { ease: 'easeIn' }),

    seq('vampiro-recua', 'vampiro', 5.6, 0.4, [
      ch('rotation.z', 0, VAMP_LEAN), ch('position.x', VAMP_X - 0.12, VAMP_X),
    ], {
      ease: 'easeOut',
      caption: 'Ele recua do alho com um chiado de cobra: SSSS!',
    }),
    seq('bracoL-defende', 'bracoL', 5.6, 0.45, [
      ch('rotation.y', 0, 0.8), ch('rotation.z', -0.3, -1.9),
    ], { ease: 'easeOut' }),
    seq('caninos-out', 'caninos', 5.7, 0.35, grow(), { ease: 'easeOut' }),
    seq('sss-sai', 'sss', 5.8, 0.6, [
      ...grow(), ch('position.x', -0.15, SSS_POS[0]),
    ], { ease: 'easeOut' }),

    seq('bracoR-ergue', 'bracoR', 7.3, 0.8, [ch('rotation.z', -0.3, ARM_UP)], {
      ease: 'easeInOut',
      caption: 'Agarra o cálice VERMELHO e o ergue bem alto, caninos brilhando à luz das velas.',
    }),
    seq('calice-grow', 'calice', 7.3, 0.5, grow(), { ease: 'easeOut' }),

    seq('olhos-acendem', 'olhos', 9.0, 0.5, grow(0.3), {
      ease: 'easeOut',
      caption: 'Olhando fundo nos seus olhos, ele sibila a escolha: SSS-CÔL… SKÔL!',
    }),
    seq('calice-brinda', 'calice', 9.5, 0.5, [ch('position.y', -0.25 - SH + 0.06, -0.25 - SH - 0.02)], {
      ease: 'easeOut',
    }),

    seq('sss-assenta', 'sss', 10.8, 0.6, [ch('rotation.z', 0, 0.12)], {
      caption: 'Skål! — Saúde!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.1, 3.75], target: [0.0, 1.38, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'skal',
    contexto: 'Todo brinde: julbord, midsommar, kräftskiva, jantar com amigos — olho no olho antes e depois de beber.',
    fraseFonte: 'Saúde! (brinde)',
    fraseAlvo: 'Skål!',
    pronuncia:
      "SKÔÔL (Ô fechado e longo, o de 'avô'; sem 'i' na frente — o S sai seco direto no K; L final de língua no céu da boca, nunca 'iscôu')",
    ponteSonora:
      "SSS-CÔL! (1 sílaba só; é a ESCOLHA sem o E e sem o -HA: o S sai SECO, sibilado como o chiado do vampiro, e cai direto no K — nada de 'is' na frente; Ô FECHADO e LONGO, o de 'avô'; L final de língua no céu da boca, nunca 'côu')",
    historia:
      'No julbord sueco, o vampiro tem que fazer uma ESCOLHA: na frente dele, um cálice de suco de tomate vermelho-sangue e outro com uma cabeça de alho inteira boiando. Ele recua do alho com um chiado de cobra — SSSS! — agarra o cálice vermelho e o ergue bem alto, caninos brilhando à luz do candelabro. Olhando fundo nos seus olhos, como manda a etiqueta sueca, ele sibila a escolha feita: SSS-CÔL... SKÔL! — saúde!',
  },
  createScene,
}

export default card
