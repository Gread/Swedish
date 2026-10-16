import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, cylinder, sphere, capsule, cone, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Det är din tur." — DÊ É... DIN! TÜR(bante)!
 *
 * Sábado é dia de acarajé na casa da BAIANA, e quem frita é quem está de
 * TURBANTE. Ela arranca o turbante branco gigante da própria cabeça e enterra
 * na cabeça do filho de oito anos, que some lá dentro até o nariz — DIN! —,
 * encaixou feito tampa de panela. Escumadeira na mão dele, tacho apontado:
 * DÊ É DIN TÜR! A vez passou junto com o turbante.
 *
 * Diorama: piso de ladrilho hidráulico creme com losangos azuis e amarelos;
 * a baiana de saia rodada branca atrás, mãos no turbante do menino; o menino
 * de camiseta laranja na frente, escumadeira apontada para o tacho de cobre
 * de dendê no fogareiro preto (direita); tabuleiro de acarajés à esquerda.
 *
 * Acento saturado reservado: o anel de luz dourada do DIN em volta do turbante.
 */

// ---- paleta -----------------------------------------------------------------
const SLAB = '#7d6a55'
const GROUT = '#b9ab92'
const TILE = '#efe4c8'
const TILE_BLUE = '#4d6c99'
const TILE_YELLOW = '#d6a640'
const WHITE = '#f6f3ec'
const LACE = '#e7e1d4'
const SKIN_B = '#6b4430' // baiana
const SKIN_M = '#7a4d33' // menino
const HAIR = '#1d1714'
const SHIRT = '#de7a36'
const SHORTS = '#2f4a6e'
const IRON = '#2b2a2c'
const COPPER = '#b8673a'
const DENDE = '#d9481b'
const FRITO = '#c27a2e'
const FRITO_ESC = '#9a5a20'
const WOOD = '#a8743f'
const WOOD_DARK = '#7a5230'
const STEEL = '#c9ced3'
const GOLD = '#ffc23a' // acento: o anel do DIN

type V3 = [number, number, number]

// ---- layout -----------------------------------------------------------------
const GY = 0.2 // topo do piso
const BAIANA: V3 = [-0.5, GY, -0.26]
const B_YAW = 0.32 // a baiana vira para o menino
const BH = 2.0 // altura da baiana
const MENINO: V3 = [0.28, GY, 0.36]
const MH = 1.1 // altura do menino
const POT: V3 = [1.28, GY, 0.12]
const TRAY: V3 = [-1.42, GY, 0.55]

// cabeça do menino: centro em bodyH + headR*0.85
const M_HEAD_Y = GY + MH * 0.52 + MH * 0.19 * 0.85
const B_HEAD_Y = GY + BH * 0.52 + BH * 0.19 * 0.85
// turbante: origem na borda de baixo
const TURB_FINAL: V3 = [MENINO[0], M_HEAD_Y - 0.035, MENINO[2] - 0.02]
const TURB_TILT = -0.1 // aba da frente levantada: nariz e boca aparecem
const TURB_START: V3 = [BAIANA[0], B_HEAD_Y + 0.14, BAIANA[2]]
const TURB_LIFT_Y = B_HEAD_Y + 0.5
const RING_Y = TURB_FINAL[1] + 0.27

/** Rotação (x, z) de um braço com pivô no ombro para apontar na direção dir. */
function aimArm(dir: THREE.Vector3) {
  const d = dir.clone().normalize()
  const z = Math.asin(THREE.MathUtils.clamp(d.x, -1, 1))
  const cz = Math.cos(z)
  const x = Math.atan2(-d.z / cz, -d.y / cz)
  return { x, z }
}

/** Contas de colar ao longo de um U no peito. */
function strand(color: string, a: number, b: number, c: number, y0: number, zc: number, n: number, r: number) {
  const g = new THREE.Group()
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI
    const bead = sphere(r, color, { roughness: 0.3 }, 12)
    bead.position.set(a * Math.cos(t), y0 - b * Math.sin(t), zc + c * Math.sin(t))
    g.add(bead)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- piso de ladrilho hidráulico ------------------------------------------
  const piso = new THREE.Group()
  const SW = 4.6
  const SD = 3.6
  const slab = rbox(SW, 0.16, SD, 0.06, SLAB, { roughness: 0.85 })
  slab.position.y = 0.08
  piso.add(slab)
  const grout = rbox(SW - 0.12, 0.05, SD - 0.12, 0.02, GROUT, { roughness: 0.9 })
  grout.position.y = GY - 0.025
  piso.add(grout)

  const T = 0.44 // lado do ladrilho
  const NX = 10
  const NZ = 8
  const x0 = -((NX - 1) * T) / 2
  const z0 = -((NZ - 1) * T) / 2
  for (let i = 0; i < NX; i++) {
    for (let k = 0; k < NZ; k++) {
      const x = x0 + i * T
      const z = z0 + k * T
      const tile = rbox(T - 0.02, 0.03, T - 0.02, 0.008, TILE, { roughness: 0.45 })
      tile.position.set(x, GY - 0.012, z)
      piso.add(tile)
      // losango azul no centro do ladrilho
      const diamond = rbox(T * 0.42, 0.012, T * 0.42, 0.01, TILE_BLUE, { roughness: 0.4 })
      diamond.position.set(x, GY + 0.004, z)
      diamond.rotation.y = Math.PI / 4
      piso.add(diamond)
    }
  }
  // losangos amarelos nos cruzamentos do rejunte
  for (let i = 1; i < NX; i++) {
    for (let k = 1; k < NZ; k++) {
      const y = rbox(T * 0.3, 0.014, T * 0.3, 0.01, TILE_YELLOW, { roughness: 0.4 })
      y.position.set(x0 + (i - 0.5) * T, GY + 0.004, z0 + (k - 0.5) * T)
      y.rotation.y = Math.PI / 4
      piso.add(y)
    }
  }

  // adereços de cozinha ao fundo
  const moringa = lathe(
    [[0, 0], [0.13, 0], [0.2, 0.08], [0.23, 0.2], [0.2, 0.32], [0.1, 0.42], [0.07, 0.5], [0.09, 0.54], [0.06, 0.55], [0, 0.5]],
    '#b5603a',
    { roughness: 0.8 },
  )
  moringa.position.set(1.95, GY, -0.75)
  moringa.rotation.y = rand() * Math.PI
  piso.add(moringa)

  const pilao = new THREE.Group()
  pilao.position.set(-1.75, GY, -1.15)
  const mortar = lathe(
    [[0, 0], [0.16, 0], [0.12, 0.08], [0.11, 0.2], [0.17, 0.36], [0.19, 0.44], [0.15, 0.44], [0.13, 0.36], [0, 0.36]],
    WOOD_DARK,
    { roughness: 0.8 },
  )
  pilao.add(mortar)
  const pestle = capsule(0.04, 0.5, WOOD, { roughness: 0.75 })
  pestle.position.set(0.04, 0.6, 0)
  pestle.rotation.z = -0.25
  pilao.add(pestle)
  piso.add(pilao)

  const cesto = new THREE.Group()
  cesto.position.set(0.85, GY, -1.25)
  const basket = lathe(
    [[0, 0], [0.18, 0], [0.22, 0.05], [0.24, 0.17], [0.21, 0.17], [0.2, 0.05], [0, 0.04]],
    '#c8a463',
    { roughness: 0.9 },
  )
  cesto.add(basket)
  for (const [ox, oz, s] of [[-0.07, 0.03, 1], [0.08, -0.04, 0.9], [0.0, 0.09, 0.85]] as const) {
    const onion = sphere(0.08 * s, '#a8443a', { roughness: 0.5 })
    onion.position.set(ox, 0.15, oz)
    onion.scale.y = 0.85
    cesto.add(onion)
  }
  piso.add(cesto)

  root.add(piso)

  // ---- fogareiro preto + tacho de cobre com dendê ---------------------------
  const fogareiro = new THREE.Group()
  fogareiro.position.set(...POT)
  root.add(fogareiro)

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3
    const leg = rbox(0.06, 0.16, 0.06, 0.02, IRON, { roughness: 0.5, metalness: 0.6 })
    leg.position.set(Math.cos(a) * 0.24, 0.08, Math.sin(a) * 0.24)
    fogareiro.add(leg)
  }
  const stove = lathe(
    [[0, 0.12], [0.24, 0.12], [0.27, 0.18], [0.33, 0.38], [0.35, 0.42], [0.3, 0.42], [0, 0.4]],
    IRON,
    { roughness: 0.45, metalness: 0.6 },
  )
  fogareiro.add(stove)
  // porta da brasa, com o brilho do carvão
  const door = rbox(0.18, 0.1, 0.04, 0.02, '#151416', { roughness: 0.5 })
  door.position.set(0, 0.25, 0.29)
  door.rotation.x = -0.25
  fogareiro.add(door)
  const ember = rbox(0.13, 0.05, 0.02, 0.012, '#ff6a1a', { emissive: '#ff4a0a', emissiveIntensity: 1.1 })
  ember.position.set(0, 0.25, 0.31)
  ember.rotation.x = -0.25
  fogareiro.add(ember)

  const tacho = lathe(
    [[0, 0.4], [0.2, 0.41], [0.34, 0.47], [0.42, 0.58], [0.45, 0.66], [0.43, 0.66], [0.4, 0.59], [0.32, 0.5], [0, 0.48]],
    COPPER,
    { roughness: 0.3, metalness: 0.75 },
  )
  fogareiro.add(tacho)
  const rim = torus(0.44, 0.022, COPPER, { roughness: 0.3, metalness: 0.75 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.66
  fogareiro.add(rim)
  for (const side of [-1, 1]) {
    const alca = torus(0.07, 0.018, COPPER, { roughness: 0.3, metalness: 0.75 })
    alca.position.set(side * 0.49, 0.62, 0)
    alca.rotation.y = Math.PI / 2
    alca.rotation.x = 0.3
    fogareiro.add(alca)
  }
  const oil = cylinder(0.405, 0.405, 0.02, DENDE, { roughness: 0.15 })
  oil.position.y = 0.6
  fogareiro.add(oil)

  // ---- bolhas e bolinhos fritando no dendê -----------------------------------
  const bolhas = new THREE.Group()
  bolhas.position.set(POT[0], GY + 0.61, POT[2])
  root.add(bolhas)
  const brand = rng(7)
  for (let i = 0; i < 11; i++) {
    const a = brand() * Math.PI * 2
    const r = 0.08 + brand() * 0.28
    const b = sphere(0.022 + brand() * 0.025, '#f5a62e', { roughness: 0.15 }, 14)
    b.position.set(Math.cos(a) * r, 0.005, Math.sin(a) * r)
    bolhas.add(b)
  }
  for (const [bx, bz] of [[-0.12, 0.08], [0.14, -0.06]] as const) {
    const bolinho = sphere(0.085, FRITO, { roughness: 0.6 }, 20)
    bolinho.position.set(bx, 0.02, bz)
    bolinho.scale.set(1.15, 0.7, 1)
    bolhas.add(bolinho)
  }

  // ---- tabuleiro de madeira com cinco acarajés -------------------------------
  const tabuleiro = new THREE.Group()
  tabuleiro.position.set(...TRAY)
  tabuleiro.rotation.y = 0.35
  root.add(tabuleiro)

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = rbox(0.05, 0.42, 0.05, 0.015, WOOD_DARK, { roughness: 0.8 })
      leg.position.set(sx * 0.25, 0.21, sz * 0.18)
      tabuleiro.add(leg)
    }
  }
  const tray = rbox(0.68, 0.05, 0.5, 0.02, WOOD, { roughness: 0.7 })
  tray.position.y = 0.44
  tabuleiro.add(tray)
  for (const sz of [-1, 1]) {
    const edge = rbox(0.68, 0.06, 0.035, 0.012, WOOD_DARK, { roughness: 0.75 })
    edge.position.set(0, 0.49, sz * 0.235)
    tabuleiro.add(edge)
  }
  for (const sx of [-1, 1]) {
    const edge = rbox(0.035, 0.06, 0.5, 0.012, WOOD_DARK, { roughness: 0.75 })
    edge.position.set(sx * 0.325, 0.49, 0)
    tabuleiro.add(edge)
  }
  const napkin = rbox(0.54, 0.012, 0.38, 0.006, LACE, { roughness: 0.9 })
  napkin.position.y = 0.472
  tabuleiro.add(napkin)
  // cinco acarajés: dois atrás, três na frente, bem separados (contáveis)
  for (const [ax, az] of [[-0.12, -0.08], [0.12, -0.08], [-0.2, 0.09], [0, 0.09], [0.2, 0.09]] as const) {
    const ac = new THREE.Group()
    ac.position.set(ax, 0.52, az)
    const ball = sphere(0.075, FRITO, { roughness: 0.65 }, 20)
    ball.scale.set(1.1, 0.78, 1)
    ac.add(ball)
    // fenda recheada de vatapá com camarãozinho
    const fill = rbox(0.1, 0.022, 0.03, 0.011, '#e9b04a', { roughness: 0.6 })
    fill.position.y = 0.045
    ac.add(fill)
    for (const sx of [-0.025, 0.03]) {
      const shrimp = sphere(0.016, '#e8663a', { roughness: 0.45 }, 10)
      shrimp.position.set(sx, 0.062, 0)
      shrimp.scale.set(1.4, 0.8, 0.9)
      ac.add(shrimp)
    }
    const crust = sphere(0.03, FRITO_ESC, { roughness: 0.7 }, 10)
    crust.position.set(-0.05, 0.02, 0.04)
    crust.scale.y = 0.5
    ac.add(crust)
    tabuleiro.add(ac)
  }

  // ---- baiana ------------------------------------------------------------------
  const baiana = person({ body: WHITE, skin: SKIN_B, height: BH, armAngle: 0.2 })
  baiana.position.set(...BAIANA)
  baiana.rotation.y = B_YAW
  root.add(baiana)

  // saia rodada branca enorme, com babados de renda
  const saia = lathe(
    [[0, 0.02], [0.6, 0.0], [0.62, 0.05], [0.58, 0.2], [0.5, 0.38], [0.41, 0.52], [0.34, 0.6], [0.3, 0.64], [0, 0.64]],
    WHITE,
    { roughness: 0.85 },
    56,
  )
  baiana.add(saia)
  for (const [ry, rr] of [[0.06, 0.61], [0.27, 0.555]] as const) {
    const babado = torus(rr, 0.03, LACE, { roughness: 0.9 })
    babado.rotation.x = Math.PI / 2
    babado.position.y = ry
    baiana.add(babado)
  }
  // ilhoses da renda na barra
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2
    const dot = sphere(0.02, LACE, { roughness: 0.9 }, 10)
    dot.position.set(Math.cos(a) * 0.585, 0.15, Math.sin(a) * 0.585)
    baiana.add(dot)
  }
  const cinta = torus(0.31, 0.03, LACE, { roughness: 0.9 })
  cinta.rotation.x = Math.PI / 2
  cinta.position.y = 0.64
  baiana.add(cinta)

  const headB = baiana.getObjectByName('head') as THREE.Group
  const hrB = BH * 0.19
  // cabelo preto preso: calota atrás + coque no alto
  const cap = sphere(hrB * 1.04, HAIR, { roughness: 0.8 })
  cap.position.set(0, hrB * 0.18, -hrB * 0.16)
  cap.scale.set(1, 0.85, 0.95)
  headB.add(cap)
  const coque = sphere(hrB * 0.42, HAIR, { roughness: 0.8 })
  coque.position.set(0, hrB * 0.8, -hrB * 0.45)
  headB.add(coque)
  // sorriso largo com dentes
  const boca = sphere(hrB * 0.24, '#5a1f1c', { roughness: 0.6 })
  boca.position.set(0, -hrB * 0.46, hrB * 0.76)
  boca.scale.set(1.45, 0.62, 0.5)
  headB.add(boca)
  const dentes = rbox(hrB * 0.5, hrB * 0.08, 0.02, 0.012, '#fbf8f1', { roughness: 0.3 })
  dentes.position.set(0, -hrB * 0.39, hrB * 0.86)
  headB.add(dentes)
  for (const side of [-1, 1]) {
    const brinco = sphere(0.035, '#b8322a', { roughness: 0.3 })
    brinco.position.set(side * hrB * 0.95, -hrB * 0.3, 0)
    headB.add(brinco)
    const bochecha = sphere(hrB * 0.16, '#7d4a36', { roughness: 0.7 })
    bochecha.position.set(side * hrB * 0.5, -hrB * 0.2, hrB * 0.78)
    bochecha.scale.z = 0.4
    headB.add(bochecha)
  }

  // ---- colares de contas (peça própria) ---------------------------------------
  const colares = new THREE.Group()
  colares.position.set(...BAIANA)
  colares.rotation.y = B_YAW
  root.add(colares)
  const NECK_Y = BH * 0.52 - 0.04
  colares.add(strand('#c2302a', 0.2, 0.16, 0.22, NECK_Y, 0.1, 16, 0.024))
  colares.add(strand('#e9b62c', 0.23, 0.23, 0.25, NECK_Y, 0.1, 18, 0.024))
  colares.add(strand('#2f8a4a', 0.26, 0.3, 0.27, NECK_Y, 0.1, 20, 0.024))
  const fio = strand('#f2efe8', 0.28, 0.36, 0.28, NECK_Y, 0.1, 22, 0.02)
  colares.add(fio)

  // ---- braços da baiana: pivô no ombro, mãos no turbante do menino -----------
  const bracoE = baiana.getObjectByName('armL') as THREE.Mesh
  const bracoD = baiana.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoE, BH)
  shoulderPivot(bracoD, BH)
  const ARM_L = BH * 0.52 * 0.32 + 0.19 * BH
  // alvos: laterais do alto do turbante (mundo → espaço da baiana)
  root.updateMatrixWorld(true)
  const turbW = new THREE.Vector3(TURB_FINAL[0], TURB_FINAL[1] + 0.36, TURB_FINAL[2])
  // mão esquerda na lateral do turbante; a direita no topo, empurrando pra baixo
  const alvoE = baiana.worldToLocal(turbW.clone().add(new THREE.Vector3(-0.39, -0.02, -0.12)))
  const alvoD = baiana.worldToLocal(turbW.clone().add(new THREE.Vector3(0.04, 0.27, -0.12)))
  const finalE = aimArm(alvoE.clone().sub(bracoE.position))
  const finalD = aimArm(alvoD.clone().sub(bracoD.position))
  const scaleE = Math.min(1.3, alvoE.clone().sub(bracoE.position).length() / ARM_L)
  const scaleD = Math.min(1.3, alvoD.clone().sub(bracoD.position).length() / ARM_L)
  bracoE.scale.y = scaleE
  bracoD.scale.y = scaleD
  for (const arm of [bracoE, bracoD]) {
    const hand = arm.children[0]
    if (hand) hand.scale.y = 1 / arm.scale.y
  }
  // pose de cima: segurando o turbante sobre a própria cabeça
  const UP_X = -2.85
  bracoE.rotation.set(finalE.x, 0, finalE.z)
  bracoD.rotation.set(finalD.x, 0, finalD.z)

  // ---- menino ------------------------------------------------------------------
  const menino = person({ body: SHIRT, skin: SKIN_M, height: MH, armAngle: 0.25 })
  menino.position.set(...MENINO)
  menino.rotation.y = 0.12
  root.add(menino)
  const shorts = cylinder(MH * 0.175, MH * 0.17, 0.12, SHORTS, { roughness: 0.85 })
  shorts.position.y = 0.15
  menino.add(shorts)
  // camiseta de manga curta: braço cor de pele + manguinha laranja
  for (const armName of ['armL', 'armR']) {
    const arm = menino.getObjectByName(armName) as THREE.Mesh
    arm.material = mat(SKIN_M, { roughness: 0.55, size: 0.3 })
  }
  const headM = menino.getObjectByName('head') as THREE.Group
  const hrM = MH * 0.19
  const bocaM = sphere(hrM * 0.22, '#4a1a18', { roughness: 0.6 })
  bocaM.position.set(0, -hrM * 0.45, hrM * 0.84)
  bocaM.scale.set(1.3, 0.9, 0.5)
  headM.add(bocaM)
  const dentesM = rbox(hrM * 0.4, hrM * 0.08, 0.015, 0.008, '#fbf8f1', { roughness: 0.3 })
  dentesM.position.set(0, -hrM * 0.33, hrM * 0.9)
  headM.add(dentesM)

  // braço da escumadeira (direito, lado do tacho)
  const bracoM = menino.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoM, MH)
  const ARM_M = MH * 0.52 * 0.32 + 0.19 * MH
  const POINT = aimArm(new THREE.Vector3(0.95, 0.1, -0.12))
  bracoM.rotation.set(POINT.x, 0, POINT.z)
  const manga = cylinder(MH * 0.075, MH * 0.07, MH * 0.13, SHIRT, { roughness: 0.8 })
  manga.position.y = -MH * 0.05
  bracoM.add(manga)
  const mangaE = cylinder(MH * 0.075, MH * 0.07, MH * 0.13, SHIRT, { roughness: 0.8 })
  const bracoME = menino.getObjectByName('armL') as THREE.Mesh
  mangaE.position.y = MH * 0.13
  bracoME.add(mangaE)

  // ---- escumadeira prateada (filha da mão do menino) --------------------------
  const escumadeira = new THREE.Group()
  escumadeira.position.set(0, -ARM_M, 0)
  bracoM.add(escumadeira)
  const cabo = cylinder(0.016, 0.016, 0.42, STEEL, { roughness: 0.25, metalness: 0.85 }, 12)
  cabo.position.y = -0.17
  escumadeira.add(cabo)
  const pega = capsule(0.028, 0.1, '#3a2a22', { roughness: 0.6 })
  pega.position.y = 0.0
  escumadeira.add(pega)
  const concha = new THREE.Group()
  concha.position.y = -0.44
  concha.rotation.z = Math.PI / 2 - 0.15
  escumadeira.add(concha)
  const disco = cylinder(0.11, 0.1, 0.022, STEEL, { roughness: 0.25, metalness: 0.85 }, 28)
  concha.add(disco)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    const furo = cylinder(0.012, 0.012, 0.026, '#4b5056', { roughness: 0.5 }, 8)
    furo.position.set(Math.cos(a) * 0.055, 0, Math.sin(a) * 0.055)
    concha.add(furo)
  }
  const furoC = cylinder(0.012, 0.012, 0.026, '#4b5056', { roughness: 0.5 }, 8)
  concha.add(furoC)

  // ---- turbante branco gigante -------------------------------------------------
  const turbante = new THREE.Group()
  turbante.position.set(...TURB_FINAL)
  turbante.rotation.x = TURB_TILT
  root.add(turbante)
  const pano = lathe(
    [
      [0, 0.47], [0.15, 0.45], [0.24, 0.35], [0.265, 0.16], [0.262, 0.03], [0.29, 0.0],
      [0.345, 0.05], [0.39, 0.15], [0.41, 0.27], [0.395, 0.38], [0.34, 0.47], [0.23, 0.545],
      [0.1, 0.578], [0, 0.585],
    ],
    WHITE,
    { roughness: 0.82 },
    48,
  )
  turbante.add(pano)
  // voltas do pano cruzadas
  for (const [wy, wr, tilt] of [[0.1, 0.36, 0.24], [0.23, 0.395, -0.26], [0.37, 0.375, 0.22]] as const) {
    const volta = torus(wr, 0.038, LACE, { roughness: 0.85 })
    volta.rotation.set(Math.PI / 2, tilt, 0)
    volta.position.y = wy
    turbante.add(volta)
  }
  // laço na frente do alto
  for (const side of [-1, 1]) {
    const lobo = sphere(0.13, WHITE, { roughness: 0.82 })
    lobo.position.set(side * 0.11, 0.53, 0.14)
    lobo.scale.set(1, 0.55, 0.7)
    lobo.rotation.z = side * 0.5
    turbante.add(lobo)
  }
  const no = sphere(0.07, LACE, { roughness: 0.85 })
  no.position.set(0, 0.52, 0.2)
  turbante.add(no)

  // ---- anel de luz dourada (DIN!) ---------------------------------------------
  const anel = new THREE.Group()
  anel.position.set(TURB_FINAL[0], RING_Y, TURB_FINAL[2])
  anel.rotation.x = 0.28
  root.add(anel)
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.032, 16, 72),
    mat(GOLD, { emissive: GOLD, emissiveIntensity: 1.4 }),
  )
  halo.rotation.x = Math.PI / 2
  anel.add(halo)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.15
    const raio = rbox(0.13, 0.035, 0.035, 0.015, GOLD, { emissive: GOLD, emissiveIntensity: 1.4 })
    raio.position.set(Math.cos(a) * 0.66, 0, Math.sin(a) * 0.66)
    raio.rotation.y = -a
    anel.add(raio)
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.5
    const brilho = cone(0.03, 0.09, GOLD, { emissive: GOLD, emissiveIntensity: 1.4 }, 4)
    brilho.position.set(Math.cos(a) * 0.58, 0.12, Math.sin(a) * 0.58)
    anel.add(brilho)
  }

  // ---- peças ---------------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'cozinha', object: piso },
    { name: 'fogareiro', group: 'cozinha', object: fogareiro },
    { name: 'tabuleiro', group: 'acaraje', object: tabuleiro },
    { name: 'bolhas', group: 'acaraje', object: bolhas },
    { name: 'baiana', group: 'baiana', object: baiana },
    { name: 'colares', group: 'baiana', object: colares },
    { name: 'bracoE', group: 'baiana', object: bracoE },
    { name: 'bracoD', group: 'baiana', object: bracoD },
    { name: 'menino', group: 'menino', object: menino },
    { name: 'turbante', group: 'turbante', object: turbante },
    { name: 'anel', group: 'din', object: anel },
    { name: 'bracoM', group: 'vez', object: bracoM },
    { name: 'escumadeira', group: 'vez', object: escumadeira },
  ]

  // ---- montagem ------------------------------------------------------------------
  const REST_E = { x: 0, z: -0.16 }
  const REST_D = { x: 0, z: 0.16 }
  const build = [
    seq('piso-sobe', 'piso', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Sábado é dia de acarajé na cozinha da BAIANA…',
    }),
    seq('fogareiro-sobe', 'fogareiro', 0.3, 0.8, [riseFrom(POT[1], 1.4)], { ease: 'easeOut' }),
    seq('tabuleiro-sobe', 'tabuleiro', 0.9, 0.8, [riseFrom(TRAY[1], 1.2)], {
      ease: 'easeOut',
      caption: '…o dendê ferve no tacho e o tabuleiro já tem cinco bolinhos dourados.',
    }),
    seq('bolhas-fervem', 'bolhas', 1.3, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('baiana-sobe', 'baiana', 2.3, 0.9, [riseFrom(BAIANA[1], 2.2)], {
      ease: 'easeOut',
      caption: 'Regra sagrada da família: quem frita é quem está de TURBANTE.',
    }),
    seq('bracoE-solto', 'bracoE', 2.3, 0.9, [ch('rotation.x', 0, REST_E.x), ch('rotation.z', -0.6, REST_E.z)], { ease: 'easeOut' }),
    seq('bracoD-solto', 'bracoD', 2.3, 0.9, [ch('rotation.x', 0, REST_D.x), ch('rotation.z', 0.6, REST_D.z)], { ease: 'easeOut' }),
    seq('turbante-sobe', 'turbante', 2.3, 0.9, [
      ch('position.x', TURB_START[0], TURB_START[0]),
      ch('position.z', TURB_START[2], TURB_START[2]),
      riseFrom(TURB_START[1], 2.2),
    ], { ease: 'easeOut' }),
    seq('colares-caem', 'colares', 3.0, 0.6, [ch('position.y', BAIANA[1] + 0.6, BAIANA[1])], { ease: 'easeOut' }),

    seq('menino-sobe', 'menino', 3.7, 0.8, [riseFrom(MENINO[1], 1.3)], {
      ease: 'easeOut',
      caption: 'Chega o filho de oito anos, todo animado…',
    }),
    seq('bracoM-solto', 'bracoM', 3.7, 0.8, [ch('rotation.x', 0, 0), ch('rotation.z', 0.5, 0.12)], { ease: 'easeOut' }),

    // ela arranca o turbante da própria cabeça
    seq('bracoE-sobe', 'bracoE', 4.7, 0.6, [ch('rotation.x', REST_E.x, UP_X), ch('rotation.z', REST_E.z, -0.05)], {
      ease: 'easeOut',
      caption: 'Ela arranca o TURBANTE gigante da própria cabeça…',
    }),
    seq('bracoD-sobe', 'bracoD', 4.7, 0.6, [ch('rotation.x', REST_D.x, UP_X), ch('rotation.z', REST_D.z, 0.05)], { ease: 'easeOut' }),
    seq('turbante-arranca', 'turbante', 5.0, 0.5, [ch('position.y', TURB_START[1], TURB_LIFT_Y)], { ease: 'easeOut' }),

    // … e enterra na cabeça do menino
    seq('turbante-passa', 'turbante', 5.6, 0.7, [
      ch('position.x', TURB_START[0], TURB_FINAL[0]),
      ch('position.z', TURB_START[2], TURB_FINAL[2]),
      ch('position.y', TURB_LIFT_Y, TURB_FINAL[1] + 0.3),
      ch('rotation.z', 0, -0.12),
      ch('rotation.x', 0, TURB_TILT),
    ], {
      ease: 'easeInOut',
      caption: '…e enterra na cabeça do menino, que some lá dentro até o nariz…',
    }),
    seq('bracoE-desce', 'bracoE', 5.6, 0.9, [ch('rotation.x', UP_X, finalE.x), ch('rotation.z', -0.05, finalE.z)], { ease: 'easeInOut' }),
    seq('bracoD-desce', 'bracoD', 5.6, 0.9, [ch('rotation.x', UP_X, finalD.x), ch('rotation.z', 0.05, finalD.z)], { ease: 'easeInOut' }),
    seq('turbante-enterra', 'turbante', 6.3, 0.3, [
      ch('position.y', TURB_FINAL[1] + 0.3, TURB_FINAL[1]),
      ch('rotation.z', -0.12, 0),
      ch('scale.y', 1, 0.86),
    ], { ease: 'easeIn' }),
    seq('turbante-assenta', 'turbante', 6.6, 0.3, [ch('scale.y', 0.86, 1)], { ease: 'easeOut' }),

    seq('anel-din', 'anel', 6.6, 0.4, [
      ch('scale.x', 0.01, 1.3), ch('scale.y', 0.01, 1.3), ch('scale.z', 0.01, 1.3),
    ], {
      ease: 'easeOut',
      caption: 'DIN! — encaixou feito tampa de panela.',
    }),
    seq('anel-volta', 'anel', 7.0, 0.35, [
      ch('scale.x', 1.3, 1), ch('scale.y', 1.3, 1), ch('scale.z', 1.3, 1),
    ], { ease: 'easeInOut' }),

    seq('escumadeira-aparece', 'escumadeira', 7.8, 0.4, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Escumadeira na mão dele, tacho apontado: DÊ É DIN TÜR!',
    }),
    seq('bracoM-aponta', 'bracoM', 8.0, 0.6, [ch('rotation.x', 0, POINT.x), ch('rotation.z', 0.12, POINT.z)], { ease: 'easeOut' }),
    seq('bolhas-pulam', 'bolhas', 8.6, 0.35, [ch('position.y', GY + 0.61, GY + 0.65)], { ease: 'easeOut' }),
    seq('bolhas-assentam', 'bolhas', 8.95, 0.35, [ch('position.y', GY + 0.65, GY + 0.61)], {
      ease: 'easeIn',
      caption: 'Det är din tur. — É a sua vez.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 1.85, 4.05], target: [0.05, 0.95, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-din-tur',
    contexto:
      "Revezamento: jogo de tabuleiro, videogame, fila do escorregador e tarefas de casa ('Det är din tur att diska' — é a sua vez de lavar a louça). E no balcão com senha, quando chamam o próximo.",
    fraseFonte: 'É a sua vez.',
    fraseAlvo: 'Det är din tur.',
    pronuncia:
      "dê é din TÜÜR ('det är' na fala vira 'dê é'; 'din' curtinho, N na ponta da língua, sem nasal; 'tur' com Ü de bico — lábios de U e língua de I —, LONGO e com a força, e R brando no fim)",
    ponteSonora:
      "DÊ É... DIN! TÜR(bante)! (4 sílabas: dê-é-din-TÜÜR; a força TODA no TÜÜR; DÊ É = o 'det är' de sempre, de 'Det är lugnt' e 'Det är kallt i lägenheten': DÊ FECHADO e sem T, É aberto e curto; DIN = o 'plim' de encaixe, o MESMO DIN de 'Kan jag låna din laddare?' — lá o plugue encaixando no celular, aqui o turbante encaixando na cabeça —: I curto, N na ponta da língua, sem o 'dĩ' nasal, e sem força; TÜR = o TURBANTE cortado no R, mas dito de BICO DE PATO — lábios de U empurrados pra frente e língua parada no I, o mesmo Ü de DÜ e do NÜ(vem) de 'Jag måste gå nu' —, LONGO e com toda a força (no turbante o TUR é fraco; aqui é ele que manda); o R do fim é BRANDO, um toque de língua, nunca o RR carioca; sem o bico sai um 'tur' de U chapado que o sueco não reconhece — e não confunda com o STÚR de 'stor' (Storgatan), que é U de urso, sem bico; o TUR do turbante é também o TUR de TURNO: 'tur' é a vez)",
    historia:
      "Sábado é dia de acarajé na casa da BAIANA, e a regra da família é sagrada: quem frita é quem está de TURBANTE. Ela solta o último bolinho no tacho de dendê fervendo, arranca o turbante branco gigante da própria cabeça e enterra na cabeça do filho de oito anos, que some lá dentro até o nariz — DIN! —, encaixou feito tampa de panela. Ela põe a escumadeira na mão dele, aponta o tacho e anuncia: 'DÊ É DIN TÜR!' — o turbante passou, agora a vez é sua.",
  },
  createScene,
}

export default card
