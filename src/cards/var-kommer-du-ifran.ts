import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Var kommer du ifrån?" — um ninja entra pela janela num salto com VARA
 * (VAR!), crava o bambu no tapete, rouba sua tigela e começa a CÓ-MER, aponta
 * um hashi pra você (DÜ?) e espeta o outro em pé na sua fronha verde-amarela,
 * feito um I de pau: I-FRÔN?!
 *
 * Diorama: sala sueca de piso de pinho e tapete cinza; mesinha branca com o
 * prato vazio ao fundo; bambu fincado e inclinado atrás do ninja; à direita,
 * você sentado no almofadão verde de faixa amarela, braços pro alto.
 */

const PINE = '#d9b47c'
const PINE_LINE = '#bf955c'
const PINE_EDGE = '#9c7444'
const RUG = '#8d9196'
const RUG_LINE = '#a9adb2'
const WHITE = '#f1efea'
const BAMBOO = '#a9c96a'
const BAMBOO_NODE = '#7f9f45'
const NINJA = '#24252b'
const NINJA_SOFT = '#34363e'
const RED = '#c8322b'         // faixa dos olhos do ninja
const SKIN = '#e8c39e'
const SKIN_YOU = '#d9a77f'
const HASHI = '#6e4222'
const RICE = '#fbf8f0'
const GREEN = '#1f9a4a'       // a fronha: acento saturado da ponte (I-FRÔN)
const GREEN_DARK = '#177a3a'
const YELLOW = '#f6c619'
const BLUE = '#2f62b8'
const SHIRT = '#3f78c8'
const JEANS = '#2e3b55'

const GY = 0.17               // topo do piso
const RY = GY + 0.025         // topo do tapete

// ninja
const NX = -0.6
const NZ = 0.05
const NROT = 0.22
const NH = 1.6
const NSCALE = 1.08

// fronha (almofadão) e você
const FX = 0.98
const FZ = 0.25
const FROT = -0.28
const FW = 1.1
const FH = 0.36
const FD = 0.86
const FTOP = RY + FH
const YH = 1.25               // altura do "você" (sentado)

// vara
const VX = -1.45
const VZ = -0.55
const VROT = 0.36

// hashi espetado (o I)
const IX = FX + 0.28
const IZ = FZ + 0.39
const IY = FTOP + 0.27

/** Gomo de bambu com nó: o perfil torneado vende "bambu" melhor que um tubo liso. */
function bambooSegment(len: number, r: number) {
  const g = new THREE.Group()
  const stalk = lathe(
    [[0, 0], [r * 1.08, 0], [r * 1.12, 0.03], [r, 0.07], [r * 0.97, len * 0.5], [r, len - 0.06], [r * 1.12, len - 0.02], [r * 1.08, len], [0, len]],
    BAMBOO,
    { roughness: 0.4 },
  )
  g.add(stalk)
  const node = torus(r * 1.08, 0.012, BAMBOO_NODE, { roughness: 0.5 })
  node.rotation.x = Math.PI / 2
  node.position.y = len - 0.01
  g.add(node)
  return g
}

/** Hashi: bastão torneado afinando para a ponta (ponta em -y). */
function hashi(len: number, rBase: number) {
  const h = lathe(
    [[0, -len / 2], [rBase * 0.45, -len / 2], [rBase * 0.75, 0], [rBase, len / 2 - 0.01], [rBase * 0.8, len / 2], [0, len / 2]],
    HASHI,
    { roughness: 0.35 },
    12,
  )
  return h
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base do diorama: piso de pinho + tapete cinza -----------------------
  const base = new THREE.Group()

  const edge = cylinder(2.62, 2.7, 0.1, PINE_EDGE, { roughness: 0.8 })
  edge.position.y = 0.05
  base.add(edge)

  const floor = cylinder(2.56, 2.6, 0.07, PINE, { roughness: 0.6 })
  floor.position.y = 0.135
  base.add(floor)

  for (const x of [-2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1]) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - x * x, 0.01))
    const line = rbox(0.035, 0.012, len, 0.005, PINE_LINE, { roughness: 0.8 })
    line.position.set(x, GY + 0.001, 0)
    base.add(line)
  }

  const rug = rbox(3.5, 0.03, 2.3, 0.012, RUG, { roughness: 0.95 })
  rug.position.set(0, GY + 0.012, 0.05)
  base.add(rug)
  for (const [w, d, x, z] of [
    [3.2, 0.035, 0, 1.06], [3.2, 0.035, 0, -0.96], [0.035, 2.0, 1.6, 0.05], [0.035, 2.0, -1.6, 0.05],
  ] as const) {
    const stripe = rbox(w, 0.01, d, 0.004, RUG_LINE, { roughness: 0.95 })
    stripe.position.set(x, RY + 0.002, z)
    base.add(stripe)
  }

  // vaso de planta ao fundo, fora do tapete
  const pot = lathe(
    [[0, 0], [0.15, 0], [0.17, 0.05], [0.15, 0.24], [0.18, 0.27], [0.17, 0.29], [0.13, 0.26], [0, 0.26]],
    WHITE,
    { roughness: 0.3 },
  )
  pot.position.set(2.02, GY, -0.4)
  const leaves = puff(0.22, '#4a8a52', 6, 13, { roughness: 0.85 })
  leaves.position.y = 0.42
  pot.add(leaves)
  base.add(pot)

  root.add(base)

  // ---- mesinha branca com prato vazio ---------------------------------------
  const mesinha = new THREE.Group()
  mesinha.position.set(0.35, 0, -1.15)
  mesinha.rotation.y = 0.08
  const top = rbox(1.1, 0.06, 0.55, 0.025, WHITE, { roughness: 0.35 })
  top.position.y = GY + 0.34
  mesinha.add(top)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = cylinder(0.025, 0.02, 0.31, '#c9a36f', { roughness: 0.6 })
      leg.position.set(sx * 0.47, GY + 0.155, sz * 0.21)
      mesinha.add(leg)
    }
  }
  const plate = lathe(
    [[0, 0], [0.1, 0], [0.12, 0.012], [0.17, 0.03], [0.165, 0.034], [0.11, 0.02], [0, 0.02]],
    WHITE,
    { roughness: 0.2 },
  )
  plate.position.set(-0.15, GY + 0.37, 0.02)
  mesinha.add(plate)
  const crumb = sphere(0.012, RICE, { roughness: 0.6 })
  crumb.position.set(-0.1, GY + 0.395, 0.04)
  mesinha.add(crumb)
  const glass = lathe(
    [[0, 0], [0.045, 0], [0.05, 0.12], [0.045, 0.12], [0.04, 0.01], [0, 0.01]],
    '#bcd6dc',
    { roughness: 0.15 },
  )
  glass.position.set(0.3, GY + 0.37, -0.05)
  mesinha.add(glass)
  root.add(mesinha)

  // ---- vara de bambu fincada no tapete (pivô no pé) -------------------------
  const vara = new THREE.Group()
  vara.position.set(VX, GY, VZ)
  vara.rotation.set(-0.08, 0, VROT)
  let vy = -0.04
  for (const len of [0.46, 0.46, 0.44, 0.4]) {
    const s = bambooSegment(len, 0.045)
    s.position.y = vy
    vara.add(s)
    vy += len
  }
  // folhinhas na ponta
  for (const [i, a] of [-0.6, 0.5].entries()) {
    const leaf = sphere(0.09, '#6f9a3c', { roughness: 0.6 })
    leaf.scale.set(0.35, 1.1, 0.12)
    leaf.position.set(i ? 0.07 : -0.07, vy - 0.12, 0)
    leaf.rotation.z = a
    vara.add(leaf)
  }
  // o rasgo no tapete onde o bambu entrou
  const tear = torus(0.07, 0.02, '#6d7176', { roughness: 0.95 })
  tear.rotation.x = Math.PI / 2
  tear.position.y = 0.02
  vara.add(tear)
  root.add(vara)

  // ---- ninja ----------------------------------------------------------------
  const ninja = person({ body: NINJA, skin: SKIN, height: NH, armAngle: 0.35 })
  ninja.position.set(NX, GY, NZ)
  ninja.rotation.y = NROT
  ninja.scale.setScalar(NSCALE)

  // faixa da cintura e amarras das canelas
  const sash = torus(0.272, 0.04, NINJA_SOFT, { roughness: 0.85 })
  sash.rotation.x = Math.PI / 2
  sash.position.y = 0.3
  ninja.add(sash)
  const knotSash = sphere(0.05, NINJA_SOFT, { roughness: 0.85 })
  knotSash.position.set(0.12, 0.3, 0.25)
  ninja.add(knotSash)

  // luvas pretas: as mãos do ninja
  for (const armName of ['armL', 'armR']) {
    const arm = ninja.getObjectByName(armName)!
    const hand = arm.children[0] as THREE.Mesh
    hand.material = mat(NINJA_SOFT, { roughness: 0.7, size: 0.1 })
  }

  // katana nas costas: cabo saindo por cima do ombro direito
  const katana = new THREE.Group()
  katana.position.set(0, 0.6, -0.27)
  katana.rotation.z = -0.75
  const saya = capsule(0.035, 0.85, '#3a2a2a', { roughness: 0.45 })
  katana.add(saya)
  const tsuba = cylinder(0.075, 0.075, 0.025, '#b8963e', { roughness: 0.35, metalness: 0.7 })
  tsuba.position.y = 0.47
  katana.add(tsuba)
  const tsuka = capsule(0.03, 0.22, '#7a2620', { roughness: 0.7 })
  tsuka.position.y = 0.62
  katana.add(tsuka)
  ninja.add(katana)

  const head = ninja.getObjectByName('head') as THREE.Group
  const HR = NH * 0.19

  // capuz: calota + nuca/laterais, deixando o rosto aberto
  const hoodMat = mat(NINJA, { roughness: 0.85, size: HR * 2 })
  hoodMat.side = THREE.DoubleSide
  const cap = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.08, 40, 20, 0, Math.PI * 2, 0, 1.12), hoodMat)
  cap.castShadow = true
  head.add(cap)
  const cowl = new THREE.Mesh(
    new THREE.SphereGeometry(HR * 1.08, 40, 20, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 1.05, 1.6),
    hoodMat,
  )
  cowl.castShadow = true
  head.add(cowl)

  // máscara puxada para baixo, enrolada no pescoço (pra poder comer)
  const gaiter = torus(HR * 0.72, HR * 0.17, NINJA_SOFT, { roughness: 0.85 })
  gaiter.rotation.x = Math.PI / 2 - 0.25
  gaiter.position.set(0, -HR * 0.82, 0.03)
  head.add(gaiter)

  // boca escancarada comendo, com arroz pelas bochechas
  const mouth = sphere(HR * 0.17, '#4a1f1c', { roughness: 0.6 })
  mouth.position.set(0, -HR * 0.42, HR * 0.86)
  mouth.scale.set(1.1, 1.0, 0.6)
  head.add(mouth)
  const lips = torus(HR * 0.17, HR * 0.045, '#c98a72', { roughness: 0.5 })
  lips.position.set(0, -HR * 0.42, HR * 0.9)
  lips.scale.set(1.1, 1.0, 1)
  head.add(lips)
  for (const [gx, gy] of [[-0.28, -0.3], [0.3, -0.52], [-0.2, -0.62], [0.24, -0.25]] as const) {
    const grain = capsule(HR * 0.025, HR * 0.05, RICE, { roughness: 0.5 })
    grain.position.set(gx * HR, gy * HR, HR * 0.9)
    grain.rotation.z = rand() * Math.PI
    head.add(grain)
  }
  // sobrancelhas grossas, curiosas
  for (const side of [-1, 1]) {
    const brow = rbox(HR * 0.3, HR * 0.07, HR * 0.08, HR * 0.03, '#2a1d16', { roughness: 0.7 })
    brow.position.set(side * HR * 0.38, HR * 0.36, HR * 0.9)
    brow.rotation.z = side * -0.25
    head.add(brow)
  }

  // ---- faixa vermelha dos olhos (peça própria: entra amarrando) -------------
  const faixa = new THREE.Group()
  faixa.position.y = HR * 0.5
  const band = torus(HR * 1.08, HR * 0.09, RED, { roughness: 0.6 })
  band.rotation.x = Math.PI / 2 + 0.12
  faixa.add(band)
  const bandKnot = sphere(HR * 0.14, RED, { roughness: 0.6 })
  bandKnot.position.set(0, 0.0, -HR * 1.1)
  faixa.add(bandKnot)
  for (const t of [-1, 1]) {
    const tail = capsule(HR * 0.07, HR * 0.75, RED, { roughness: 0.6 })
    tail.scale.z = 0.45
    tail.position.set(-HR * (0.3 + t * 0.08), -HR * 0.05 + t * HR * 0.12, -HR * 1.45)
    tail.rotation.set(1.1, 0, 0.9 + t * 0.35)
    faixa.add(tail)
  }
  head.add(faixa)

  // ---- braços do ninja (peças próprias, giram pelo ombro) -------------------
  const bracoL = ninja.getObjectByName('armL')!
  shoulderPivot(bracoL, NH)
  const bracoR = ninja.getObjectByName('armR')!
  shoulderPivot(bracoR, NH)

  // pose final: esquerdo leva a tigela à boca, direito aponta o hashi pra você
  const BL_X = -1.4
  const BL_Z = 0.12
  bracoL.rotation.set(BL_X, 0, BL_Z)
  const BR_Y = -0.3
  const BR_Z = 1.42
  bracoR.rotation.set(0, BR_Y, BR_Z)

  // hashi na mão direita, prolongando o braço (ponta para você)
  const hashiMao = hashi(0.5, 0.022)
  hashiMao.position.y = -NH * 0.52 * 0.32 - 0.19 * NH - 0.22
  bracoR.add(hashiMao)

  root.add(ninja)

  // ---- fronha verde-amarela (almofadão) --------------------------------------
  const fronha = new THREE.Group()
  fronha.position.set(FX, RY, FZ)
  fronha.rotation.y = FROT

  const cushion = rbox(FW, FH, FD, 0.16, GREEN, { roughness: 0.88 })
  cushion.position.y = FH / 2
  fronha.add(cushion)
  // afundado onde você senta
  const dent = sphere(0.36, GREEN_DARK, { roughness: 0.9 })
  dent.scale.set(1, 0.12, 0.85)
  dent.position.set(0.02, FH - 0.005, -0.05)
  fronha.add(dent)
  // faixa amarela: debrum ao longo da costura
  const seam = rbox(FW + 0.025, 0.055, FD + 0.025, 0.027, YELLOW, { roughness: 0.75 })
  seam.position.y = FH / 2
  fronha.add(seam)
  // pontas da fronha
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const corner = cone(0.07, 0.15, GREEN, { roughness: 0.88 })
      corner.position.set(sx * (FW / 2 + 0.02), FH / 2, sz * (FD / 2 + 0.02))
      corner.lookAt(sx * 10, FH / 2, sz * 10)
      corner.rotateX(Math.PI / 2)
      corner.scale.set(1, 1, 0.45)
      fronha.add(corner)
    }
  }
  // losango amarelo + círculo azul na face de frente: a bandeira de casa
  const losango = rbox(0.22, 0.22, 0.02, 0.02, YELLOW, { roughness: 0.6 })
  losango.position.set(0.2, FH / 2 + 0.02, FD / 2 + 0.003)
  losango.rotation.z = Math.PI / 4
  losango.scale.set(1.45, 1, 1)
  fronha.add(losango)
  const globo = cylinder(0.075, 0.075, 0.02, BLUE, { roughness: 0.6 })
  globo.rotation.x = Math.PI / 2
  globo.position.set(0.2, FH / 2 + 0.02, FD / 2 + 0.018)
  fronha.add(globo)
  root.add(fronha)

  // ---- você, sentado na fronha ---------------------------------------------
  const voce = new THREE.Group()
  voce.position.set(FX + 0.05, FTOP - 0.06, FZ - 0.05)
  voce.rotation.y = -1.0

  const eu = person({ body: SHIRT, skin: SKIN_YOU, height: YH, armAngle: 0.3 })
  voce.add(eu)
  for (const side of [-1, 1]) {
    const thigh = capsule(0.085, 0.3, JEANS, { roughness: 0.85 })
    thigh.position.set(side * 0.12, 0.08, 0.22)
    thigh.rotation.x = Math.PI / 2 - 0.1
    voce.add(thigh)
    const shin = capsule(0.075, 0.22, JEANS, { roughness: 0.85 })
    shin.position.set(side * 0.13, -0.12, 0.47)
    shin.rotation.x = 0.35
    voce.add(shin)
    const shoe = rbox(0.13, 0.09, 0.22, 0.04, WHITE, { roughness: 0.6 })
    shoe.position.set(side * 0.13, -0.27, 0.55)
    voce.add(shoe)
  }
  const youHead = eu.getObjectByName('head')!
  const YHR = YH * 0.19
  const hair = puff(YHR * 0.8, '#3a2618', 6, 7, { roughness: 0.9 })
  hair.position.set(0, YHR * 0.55, -YHR * 0.12)
  hair.scale.set(1.25, 0.75, 1.15)
  youHead.add(hair)
  // boca de susto: um O
  const oMouth = sphere(YHR * 0.14, '#4a1f1c', { roughness: 0.6 })
  oMouth.position.set(0, -YHR * 0.42, YHR * 0.9)
  oMouth.scale.set(0.85, 1.2, 0.5)
  youHead.add(oMouth)

  const voceBracoL = eu.getObjectByName('armL')!
  shoulderPivot(voceBracoL, YH)
  const voceBracoR = eu.getObjectByName('armR')!
  shoulderPivot(voceBracoR, YH)
  const EAT_X = -1.05
  voceBracoL.rotation.set(-0.3, 0, -2.7)
  voceBracoR.rotation.set(-0.3, 0, 2.7)
  root.add(voce)

  // ---- tigela de arroz (sai do seu colo e vai pra mão do ninja) ------------
  const tigela = new THREE.Group()
  const bowl = lathe(
    [[0, 0], [0.07, 0], [0.075, 0.015], [0.12, 0.05], [0.16, 0.11], [0.17, 0.14], [0.155, 0.14], [0.145, 0.11], [0.06, 0.03], [0, 0.03]],
    WHITE,
    { roughness: 0.18 },
  )
  tigela.add(bowl)
  const blueRim = torus(0.163, 0.008, BLUE, { roughness: 0.3 })
  blueRim.rotation.x = Math.PI / 2
  blueRim.position.y = 0.122
  tigela.add(blueRim)
  const rice = puff(0.11, RICE, 6, 19, { roughness: 0.7 })
  rice.position.y = 0.13
  rice.scale.set(1.15, 0.6, 1.15)
  tigela.add(rice)
  root.add(tigela)

  // posições absolutas da tigela: colo (início) e mão do ninja (final)
  root.updateMatrixWorld(true)
  const handNinja = new THREE.Vector3()
  bracoL.children[0].getWorldPosition(handNinja)
  const BOWL_END = handNinja.clone().add(new THREE.Vector3(0.0, 0.03, 0.0))

  const BOWL_START = new THREE.Vector3(0, 0.18, 0.32)
  voce.localToWorld(BOWL_START)

  tigela.position.copy(BOWL_END)

  // ---- hashi espetado em pé na fronha: o I --------------------------------
  const hashiI = new THREE.Group()
  hashiI.position.set(IX, IY, IZ)
  const stick = hashi(0.7, 0.034)
  stick.rotation.z = Math.PI // ponta para baixo, enfiada no pano
  hashiI.add(stick)
  const pucker = torus(0.04, 0.018, GREEN_DARK, { roughness: 0.9 })
  pucker.rotation.x = Math.PI / 2
  pucker.position.y = -0.27
  hashiI.add(pucker)
  root.add(hashiI)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'mesinha', group: 'sala', object: mesinha },
    { name: 'fronha', group: 'voce', object: fronha },
    { name: 'voce', group: 'voce', object: voce },
    { name: 'voceBracoL', group: 'voce', object: voceBracoL },
    { name: 'voceBracoR', group: 'voce', object: voceBracoR },
    { name: 'tigela', group: 'voce', object: tigela },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'ninja', group: 'vara', object: ninja },
    { name: 'bracoL', group: 'vara', object: bracoL },
    { name: 'bracoR', group: 'vara', object: bracoR },
    { name: 'faixa', group: 'vara', object: faixa },
    { name: 'hashi', group: 'du', object: hashiMao },
    { name: 'hashiI', group: 'ifron', object: hashiI },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Primeira semana na Suécia: brota a sala, piso de pinho e tapete cinza…',
    }),
    seq('mesinha-rise', 'mesinha', 0.25, 0.8, [riseFrom(0, 1.2)], { ease: 'easeOut' }),

    seq('fronha-grow', 'fronha', 1.3, 0.7, [ch('scale.y', 0.05, 1), ch('scale.x', 0.6, 1), ch('scale.z', 0.6, 1)], {
      ease: 'easeOut',
      caption: '…e você janta sentado na sua fronha verde-amarela de viagem, tigela no colo.',
    }),
    seq('voce-rise', 'voce', 1.6, 0.7, [riseFrom(FTOP - 0.06, 1.6)], { ease: 'easeOut' }),
    seq('voceL-come', 'voceBracoL', 1.6, 0.7, [ch('rotation.x', -0.3, EAT_X), ch('rotation.z', 0.3, 0.3)], { ease: 'easeOut' }),
    seq('voceR-come', 'voceBracoR', 1.6, 0.7, [ch('rotation.x', -0.3, EAT_X), ch('rotation.z', -0.3, -0.3)], { ease: 'easeOut' }),
    seq('tigela-colo', 'tigela', 2.0, 0.5, [
      ch('position.x', BOWL_START.x, BOWL_START.x), ch('position.y', BOWL_START.y, BOWL_START.y),
      ch('position.z', BOWL_START.z, BOWL_START.z), ...grow(),
    ], { ease: 'easeOut' }),

    seq('vara-crava', 'vara', 3.0, 0.75, [ch('position.y', GY + 2.6, GY), ch('rotation.z', 1.3, VROT)], {
      ease: 'easeIn',
      caption: 'CRASH! Um ninja salta pela janela com uma VARA — VAR! — e crava o bambu no tapete.',
    }),
    seq('ninja-salto-x', 'ninja', 3.35, 0.95, [ch('position.x', VX - 0.3, NX)], { ease: 'easeOut' }),
    seq('ninja-salto-y', 'ninja', 3.35, 0.95, [ch('position.y', GY + 2.4, GY), ch('rotation.z', 2 * Math.PI, 0)], {
      ease: 'easeIn',
    }),
    seq('bracoL-pouso', 'bracoL', 3.35, 1.0, [ch('rotation.x', 0, 0), ch('rotation.z', -1.5, -0.25)], { ease: 'easeOut' }),
    seq('bracoR-pouso', 'bracoR', 3.35, 1.0, [ch('rotation.y', 0, 0), ch('rotation.z', 1.5, 0.25)], { ease: 'easeOut' }),
    seq('faixa-amarra', 'faixa', 4.2, 0.5, grow(0.4), { ease: 'easeOut' }),

    seq('tigela-rouba', 'tigela', 5.3, 0.8, [
      ch('position.x', BOWL_START.x, BOWL_END.x), ch('position.y', BOWL_START.y, BOWL_END.y),
      ch('position.z', BOWL_START.z, BOWL_END.z),
    ], {
      ease: 'easeInOut',
      caption: 'Sem pedir licença, ele pega a sua tigela e começa a CÓ-MER — força no CÓ, boca aberta.',
    }),
    seq('bracoL-come', 'bracoL', 5.4, 0.7, [ch('rotation.x', 0, BL_X), ch('rotation.z', -0.25, BL_Z)], { ease: 'easeInOut' }),
    seq('voceL-solta', 'voceBracoL', 5.4, 0.5, [ch('rotation.x', EAT_X, -0.6)], { ease: 'easeOut' }),
    seq('voceR-solta', 'voceBracoR', 5.4, 0.5, [ch('rotation.x', EAT_X, -0.6)], { ease: 'easeOut' }),

    seq('bracoR-aponta', 'bracoR', 7.0, 0.6, [ch('rotation.y', 0, BR_Y), ch('rotation.z', 0.25, BR_Z)], {
      ease: 'easeOut',
      caption: 'De boca cheia, ele aponta um hashi pra você: DÜ?',
    }),
    seq('hashi-surge', 'hashi', 7.0, 0.5, grow(), { ease: 'easeOut' }),

    seq('hashiI-espeta', 'hashiI', 8.5, 0.5, [ch('position.y', IY + 1.8, IY), ch('rotation.y', -3 * Math.PI, 0)], {
      ease: 'easeIn',
      caption: '…e espeta o outro em pé na sua fronha, feito um I de pau: I… FRÔN?!',
    }),
    seq('fronha-afunda', 'fronha', 9.0, 0.35, [ch('scale.y', 0.88, 1)], { ease: 'easeOut' }),
    seq('voceL-susto', 'voceBracoL', 9.0, 0.45, [ch('rotation.x', -0.6, -0.3), ch('rotation.z', 0.3, -2.7)], { ease: 'easeOut' }),
    seq('voceR-susto', 'voceBracoR', 9.0, 0.45, [ch('rotation.x', -0.6, -0.3), ch('rotation.z', -0.3, 2.7)], { ease: 'easeOut' }),

    seq('vara-balanca', 'vara', 10.2, 0.4, [ch('rotation.x', -0.08, -0.02)], { ease: 'easeOut' }),
    seq('vara-assenta', 'vara', 10.6, 0.6, [ch('rotation.x', -0.02, -0.08)], {
      ease: 'easeInOut',
      caption: 'Var kommer du ifrån? — De onde você é?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 1.95, 3.85], target: [0.2, 1.02, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-kommer-du-ifran',
    contexto: 'Conversa: a pergunta que todo sueco faz ao ouvir o sotaque — e que você devolve a outro imigrante, a um colega novo ou ao pai de outra criança da förskola.',
    fraseFonte: 'De onde você é?',
    fraseAlvo: 'Var kommer du ifrån?',
    pronuncia:
      "var KÓM-mer dü i-FRÔN? ('var' com R brando audível — sem ele vira 'vad', o quê; 'du' com ü de bico; a pergunta termina em i-FRÔN, força no FRÔN)",
    ponteSonora:
      "VAR! CÓ-MER... DÜ? I-FRÔN?! (6 sílabas: var-KÓ-mer-dü-i-FRÔN; tônicas em CÓ e FRÔN; VAR é a VARA sem o -a, o mesmo de 'Var kan jag köpa biljett?' — R BRANDO e AUDÍVEL: sem ele sobra VÁ, que é 'vad' (o quê) e a pergunta vira outra; CÓ-MER igual à carta 'Jag kommer från Brasilien': Ó ABERTO, força no CÓ, -mer fraquinho — nunca 'co-MÊR'; DÜ é o 'du' de CAN-DU, com BICO DE PATO, apontado pra você; I-FRÔN = o hashi espetado em pé na fronha, um I de pau, + a FRÔNha sem o -nha, Ô FECHADO e sem nasal: a pergunta TERMINA em 'ifrån' — fronha COM o I espetado é pergunta; fronha sem nada, na carta da resposta, é só 'från')",
    historia:
      'Você acabou de chegar e está jantando sentado na sua fronha verde-amarela de viagem quando um ninja atravessa a janela num salto com VARA — VAR! — e crava o bambu no tapete. Sem pedir licença ele pega sua tigela e começa a CÓ-MER, com a força toda no CÓ, de boca aberta. De boca cheia, aponta um hashi pra você — DÜ? — e espeta o outro em pé na fronha, feito um I de pau: I... FRÔN?! O ninja quer saber de onde você veio.',
  },
  createScene,
}

export default card
