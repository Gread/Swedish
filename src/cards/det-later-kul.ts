import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Det låter kul!" — DÊ! LÔ(uco de) TER(no)... CÜL!
 *
 * O lince, o bicho mais arisco da floresta sueca, passa a semana de TERNO
 * atrás da escrivaninha da toca. Você chama pro churrasco de sábado: ele
 * arranca o espeto da sua mão (DÊ!), fica LOUCO e pula de TERNO e tudo em
 * cima da escrivaninha, saca os óculos escuros do bolso e faz biquinho: CÜL!
 *
 * Diorama: clareira de musgo com dois pinheiros, churrasqueira fumegando no
 * canto, escrivaninha de madeira clara no centro e o lince em cima dela.
 * Acento saturado reservado à GRAVATA amarela que voa (o LOUCO de TERNO).
 */

const SOIL = '#4a3a2b'
const MOSS = '#46663a'
const MOSS_LIGHT = '#58783f'
const PINE = '#2d5236'
const PINE_LIGHT = '#386142'
const TRUNK = '#6a4a33'
const ROCK = '#7f8288'
const WOOD = '#c79a63'
const WOOD_DARK = '#9c7444'
const WOOD_LIGHT = '#d7ad78'
const BRASS = '#c9a450'
const LAPTOP = '#8a919b'
const LAPTOP_DARK = '#4d535c'
const PAPER = '#f1ece1'
const GRILL = '#2a2c30'
const METAL = '#aab2bb'
const SMOKE = '#dfe3e6'
const MEAT = '#7b4426'
const CHAR = '#3f2414'
const SILVER = '#cfd5dc'

const FUR = '#c9a36b'
const FUR_DARK = '#8d6a44'
const SPOT = '#6b4b30'
const RUFF = '#efe6d6'
const WHITE_FUR = '#f4efe6'
const EAR_IN = '#ead6c0'
const TUFT = '#1c1a19'
const NOSE = '#c4776c'
const LIP = '#e48797'
const IRIS = '#c7a33c'

const SUIT = '#2b3c66'
const SUIT_DARK = '#1f2b4a'
const SHIRT = '#f3f0ea'
const TIE = '#f2c21b' // acento saturado: a gravata do LOUCO de TERNO
const LENS = '#14161a'
const FRAME = '#0d0e11'

const GY = 0.17 // topo do musgo
const DESK_H = 0.62
const DY = GY + DESK_H // tampo da escrivaninha (onde ele aterrissa)
const LX = 0.15
const LZ = 0.35 // em cima da escrivaninha (pose final)
const LZ0 = -0.55 // atrás da escrivaninha (antes do pulo)
const PEAK = GY + 1.1 // topo do pulo
const SQUASH = 0.9 // amortece a aterrissagem
const ARM_REST = 2.37 // braço caído (rotation.z do ombro)
const TIE_FLY = 1.4 // gravata voando de lado (pose final)
const EARS_FLAT = 0.5 // orelhas murchas de bicho arisco
const BICO = 1.2 // tamanho do biquinho (pose final)

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b — membros, mangas, pernas da calça. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, rough = 0.85) {
  const dir = b.clone().sub(a)
  const m = capsule(r, dir.length(), color, { roughness: rough })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize())
  return m
}

/** Punho de camisa: anel branco perpendicular ao antebraço. */
function cuff(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const t = torus(r, 0.018, SHIRT, { roughness: 0.7 })
  t.position.copy(b)
  t.quaternion.setFromUnitVectors(V(0, 0, 1), b.clone().sub(a).normalize())
  return t
}

// crânio do lince: esfera 0.3 achatada — usado para assentar manchas na pele
const SKULL = V(0.324, 0.285, 0.285)

function onSkull(dir: THREE.Vector3, inset = 0) {
  const d = dir.clone().normalize()
  const t = 1 / Math.sqrt((d.x / SKULL.x) ** 2 + (d.y / SKULL.y) ** 2 + (d.z / SKULL.z) ** 2)
  const p = d.multiplyScalar(t - inset)
  const n = V(p.x / SKULL.x ** 2, p.y / SKULL.y ** 2, p.z / SKULL.z ** 2).normalize()
  return { p, n }
}

/** Mancha/listra achatada sobre o crânio. */
function skullMark(dir: THREE.Vector3, r: number, sy: number, color = SPOT) {
  const { p, n } = onSkull(dir)
  const m = sphere(r, color, { roughness: 0.9 })
  m.scale.set(1, sy, 0.6)
  m.position.copy(p)
  m.quaternion.setFromUnitVectors(V(0, 0, 1), n)
  return m
}

/** Lâmina da gravata: perfil de gravata extrudado, com a ponta curvada. */
function tieBlade() {
  const L = 0.46
  const cx = (t: number) => 0.07 * t * t
  const w = (t: number) => 0.027 + 0.036 * Math.min(t / 0.86, 1)
  const ts = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.86]
  const shape = new THREE.Shape()
  shape.moveTo(cx(0) - w(0), 0)
  for (const t of ts) shape.lineTo(cx(t) + w(t), -t * L)
  shape.lineTo(cx(1), -L)
  for (const t of [...ts].reverse()) shape.lineTo(cx(t) - w(t), -t * L)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.007,
    bevelSize: 0.007,
    bevelSegments: 2,
  })
  geo.translate(0, 0, -0.009)
  const g = new THREE.Group()
  const m = new THREE.Mesh(geo, mat(TIE, { roughness: 0.42, size: 0.4 }))
  m.castShadow = true
  m.receiveShadow = true
  g.add(m)
  // listras diagonais de gravata social, um tom de ouro mais escuro
  for (const t of [0.22, 0.42, 0.62]) {
    const listra = rbox(1.9 * w(t), 0.016, 0.006, 0.003, '#c8930c', { roughness: 0.45 })
    listra.position.set(cx(t), -t * L, 0.018)
    listra.rotation.z = 0.55
    g.add(listra)
  }
  return g
}

/** Pinheiro: tronco + quatro saias de cone. */
function pine(scale: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const trunk = cylinder(0.08, 0.12, 0.6, TRUNK, { roughness: 0.9 })
  trunk.position.y = 0.3
  g.add(trunk)
  const tiers: [number, number, number][] = [
    [0.78, 0.85, 0.85], [0.62, 0.75, 1.3], [0.46, 0.65, 1.72], [0.3, 0.55, 2.1],
  ]
  tiers.forEach(([r, h, y], i) => {
    const c = cone(r, h, i % 2 ? PINE_LIGHT : PINE, { roughness: 0.85 })
    c.position.y = y
    c.rotation.y = rand() * Math.PI
    g.add(c)
  })
  g.scale.setScalar(scale)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: clareira de musgo -----------------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.7, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const moss = cylinder(2.55, 2.6, 0.06, MOSS, { roughness: 0.95 })
  moss.position.y = 0.14
  base.add(moss)

  // tufos de musgo mais claro espalhados (rng fixo)
  for (const [mx, mz, r] of [
    [-2.0, 0.55, 0.24], [1.95, 0.95, 0.2], [-1.15, 1.75, 0.18], [0.85, 1.85, 0.16],
    [-2.05, -0.75, 0.22], [2.25, -0.05, 0.17],
  ] as const) {
    const tufo = puff(r, MOSS_LIGHT, 5, 60 + Math.round(mx * 10), { roughness: 0.95 })
    tufo.position.set(mx, GY + r * 0.15, mz)
    tufo.scale.y = 0.42
    base.add(tufo)
  }

  for (const [rx, rz, r, s] of [[-1.85, 1.05, 0.2, 31], [2.05, 0.45, 0.16, 32], [1.4, 1.65, 0.11, 33]] as const) {
    const pedra = rock(r, ROCK, s, { roughness: 0.9 })
    pedra.position.set(rx, GY + r * 0.35, rz)
    pedra.rotation.y = rand() * Math.PI
    base.add(pedra)
  }

  // pinhas caídas
  for (const [px, pz] of [[-0.75, 1.75], [1.5, 0.72], [-1.55, 1.6]] as const) {
    const pinha = new THREE.Group()
    pinha.position.set(px, GY + 0.05, pz)
    pinha.rotation.set(Math.PI / 2, 0, rand() * Math.PI)
    for (let k = 0; k < 4; k++) {
      const escama = cylinder(0.05 - k * 0.008, 0.055 - k * 0.008, 0.035, '#7a5534', { roughness: 0.85 }, 10)
      escama.position.y = -0.06 + k * 0.04
      pinha.add(escama)
    }
    base.add(pinha)
  }

  // cogumelos de chapéu marrom
  for (const [cx, cz, s] of [[-1.95, -0.15, 1], [-1.78, 0.02, 0.7]] as const) {
    const cog = new THREE.Group()
    cog.position.set(cx, GY, cz)
    cog.scale.setScalar(s)
    const pe = cylinder(0.035, 0.045, 0.16, '#efe6d2', { roughness: 0.8 })
    pe.position.y = 0.08
    cog.add(pe)
    const chapeu = lathe([[0, 0.14], [0.12, 0.14], [0.13, 0.17], [0.09, 0.22], [0, 0.24]], '#8a5a36', { roughness: 0.7 })
    cog.add(chapeu)
    base.add(cog)
  }

  // folha de papel que voou da mesa no pulo
  const folha = rbox(0.3, 0.008, 0.22, 0.003, PAPER, { roughness: 0.8 })
  folha.position.set(1.3, GY + 0.005, 0.82)
  folha.rotation.y = 0.5
  base.add(folha)

  root.add(base)

  // ---- pinheiros ao fundo ----------------------------------------------------
  const pinheiros = new THREE.Group()
  const pineL = pine(1.05, 41)
  pineL.position.set(-1.85, GY, -1.25)
  pinheiros.add(pineL)
  const pineR = pine(1.2, 42)
  pineR.position.set(1.35, GY, -1.75)
  pinheiros.add(pineR)
  root.add(pinheiros)

  // ---- churrasqueira fumegando (o churrasco de sábado) -----------------------
  const churrasqueira = new THREE.Group()
  churrasqueira.position.set(1.85, GY, -0.55)
  churrasqueira.rotation.y = -0.5

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3
    const perna = cylinder(0.018, 0.018, 0.56, GRILL, { roughness: 0.4, metalness: 0.6 })
    perna.position.set(Math.cos(a) * 0.17, 0.27, Math.sin(a) * 0.17)
    perna.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22)
    churrasqueira.add(perna)
  }
  const bacia = lathe(
    [[0, 0], [0.16, 0.02], [0.26, 0.09], [0.31, 0.2], [0.325, 0.27], [0.305, 0.275], [0.29, 0.2], [0.24, 0.1], [0.15, 0.045], [0, 0.04]],
    GRILL,
    { roughness: 0.35, metalness: 0.5 },
  )
  bacia.position.y = 0.45
  churrasqueira.add(bacia)

  const grelha = torus(0.3, 0.01, METAL, { roughness: 0.3, metalness: 0.8 })
  grelha.rotation.x = Math.PI / 2
  grelha.position.y = 0.705
  churrasqueira.add(grelha)
  for (let i = -2; i <= 2; i++) {
    const barra = cylinder(0.007, 0.007, 2 * Math.sqrt(0.3 * 0.3 - (i * 0.11) ** 2), METAL, { roughness: 0.3, metalness: 0.8 }, 8)
    barra.rotation.z = Math.PI / 2
    barra.position.set(0, 0.705, i * 0.11)
    churrasqueira.add(barra)
  }
  // brasas discretas entre as barras
  for (const [bx, bz] of [[-0.1, 0.05], [0.08, -0.08], [0.12, 0.1], [-0.05, -0.12]] as const) {
    const brasa = sphere(0.05, '#b5452a', { emissive: '#d0502a', emissiveIntensity: 0.55 })
    brasa.position.set(bx, 0.66, bz)
    brasa.scale.y = 0.6
    churrasqueira.add(brasa)
  }
  for (const [lz, ry] of [[-0.08, 0.2], [0.09, -0.15]] as const) {
    const linguica = capsule(0.035, 0.22, '#8b4a2b', { roughness: 0.5 })
    linguica.rotation.set(0, ry, Math.PI / 2)
    linguica.position.set(0.02, 0.74, lz)
    churrasqueira.add(linguica)
  }
  // tampa aberta, encostada atrás
  const tampa = new THREE.Group()
  tampa.position.set(0, 0.72, -0.31)
  tampa.rotation.x = -1.95
  const domo = lathe(
    [[0.325, 0], [0.31, 0.08], [0.25, 0.17], [0.14, 0.23], [0, 0.25], [0, 0.235], [0.13, 0.215], [0.235, 0.16], [0.295, 0.075], [0.31, 0]],
    GRILL,
    { roughness: 0.35, metalness: 0.5 },
  )
  domo.position.z = 0.31
  tampa.add(domo)
  const pegador = rbox(0.12, 0.035, 0.04, 0.015, WOOD_DARK, { roughness: 0.7 })
  pegador.position.set(0, 0.27, 0.31)
  tampa.add(pegador)
  churrasqueira.add(tampa)

  for (const [r, sx, sy, sz, s] of [[0.15, 0.0, 1.0, 0.0, 71], [0.12, 0.1, 1.33, -0.05, 72], [0.09, 0.03, 1.6, -0.12, 73]] as const) {
    const fumaca = puff(r, SMOKE, 5, s, { roughness: 0.95 })
    fumaca.position.set(sx, sy, sz)
    churrasqueira.add(fumaca)
  }
  root.add(churrasqueira)

  // ---- escrivaninha da toca --------------------------------------------------
  const escrivaninha = new THREE.Group()
  escrivaninha.position.set(0.05, GY, 0.35)

  const tampo = rbox(1.8, 0.07, 0.86, 0.025, WOOD, { roughness: 0.6 })
  tampo.position.y = DESK_H - 0.035
  escrivaninha.add(tampo)

  const LEG_H = DESK_H - 0.07
  const gaveteiro = rbox(0.52, LEG_H, 0.78, 0.025, WOOD_DARK, { roughness: 0.7 })
  gaveteiro.position.set(-0.6, LEG_H / 2, 0)
  escrivaninha.add(gaveteiro)
  for (const gy of [0.1, 0.27, 0.44]) {
    const gaveta = rbox(0.44, 0.14, 0.03, 0.015, WOOD_LIGHT, { roughness: 0.6 })
    gaveta.position.set(-0.6, gy, 0.395)
    escrivaninha.add(gaveta)
    const puxador = rbox(0.1, 0.022, 0.03, 0.01, BRASS, { roughness: 0.3, metalness: 0.8 })
    puxador.position.set(-0.6, gy + 0.02, 0.418)
    escrivaninha.add(puxador)
  }
  for (const pz of [-0.33, 0.33]) {
    const perna = cylinder(0.035, 0.028, LEG_H, WOOD_DARK, { roughness: 0.7 })
    perna.position.set(0.8, LEG_H / 2, pz)
    escrivaninha.add(perna)
  }
  const painel = rbox(1.25, 0.28, 0.03, 0.012, WOOD_DARK, { roughness: 0.7 })
  painel.position.set(0.18, LEG_H - 0.16, -0.36)
  escrivaninha.add(painel)

  // laptop fechado
  const laptop = new THREE.Group()
  laptop.position.set(-0.62, DESK_H, -0.18)
  laptop.rotation.y = 0.28
  const corpoLap = rbox(0.5, 0.018, 0.35, 0.008, LAPTOP_DARK, { roughness: 0.4, metalness: 0.5 })
  corpoLap.position.y = 0.009
  laptop.add(corpoLap)
  const tampaLap = rbox(0.5, 0.016, 0.35, 0.008, LAPTOP, { roughness: 0.3, metalness: 0.6 })
  tampaLap.position.y = 0.027
  laptop.add(tampaLap)
  escrivaninha.add(laptop)

  // caneca de café e papéis do expediente
  const caneca = lathe(
    [[0, 0], [0.065, 0], [0.07, 0.02], [0.065, 0.13], [0.069, 0.14], [0.056, 0.14], [0.056, 0.02], [0, 0.02]],
    '#e9e3d6',
    { roughness: 0.2 },
  )
  caneca.position.set(0.66, DESK_H, -0.2)
  const alca = torus(0.04, 0.012, '#e9e3d6', { roughness: 0.2 })
  alca.position.set(0.075, 0.075, 0)
  caneca.add(alca)
  const cafe = cylinder(0.056, 0.056, 0.01, '#3b2416', { roughness: 0.2 })
  cafe.position.y = 0.12
  caneca.add(cafe)
  escrivaninha.add(caneca)

  for (const [px, pz, ry] of [[0.6, 0.18, -0.2], [0.63, 0.2, 0.15]] as const) {
    const papel = rbox(0.3, 0.006, 0.22, 0.003, PAPER, { roughness: 0.8 })
    papel.position.set(px, DESK_H + 0.003 + (ry > 0 ? 0.006 : 0), pz)
    papel.rotation.y = ry
    escrivaninha.add(papel)
  }
  root.add(escrivaninha)

  // ---- LINCE de terno (olha para +z) -----------------------------------------
  const lince = new THREE.Group()
  lince.position.set(LX, DY, LZ)

  // patas traseiras: patorras de neve, peludas, saindo da barra da calça
  for (const s of [-1, 1]) {
    const pe = sphere(0.12, FUR, { roughness: 0.9 })
    pe.scale.set(1, 0.55, 1.35)
    pe.position.set(s * 0.21, 0.066, 0.06)
    lince.add(pe)
    for (const k of [-1, 0, 1]) {
      const dedo = sphere(0.038, FUR, { roughness: 0.9 })
      dedo.position.set(s * 0.21 + k * 0.058, 0.05, 0.205)
      lince.add(dedo)
    }
    const tornozelo = limb(V(s * 0.21, 0.1, 0.03), V(s * 0.22, 0.2, 0.05), 0.07, FUR, 0.9)
    lince.add(tornozelo)

    // calça do terno: canela e coxa dobradas (meio do pulo / aterrissagem)
    const joelho = V(s * 0.26, 0.44, 0.19)
    lince.add(limb(V(s * 0.22, 0.2, 0.05), joelho, 0.095, SUIT))
    lince.add(limb(joelho, V(s * 0.15, 0.64, -0.02), 0.115, SUIT))
  }

  const quadril = sphere(0.25, SUIT, { roughness: 0.85 })
  quadril.scale.set(1.12, 0.78, 0.95)
  quadril.position.set(0, 0.66, -0.03)
  lince.add(quadril)

  // paletó
  const tronco = capsule(0.26, 0.26, SUIT, { roughness: 0.85 })
  tronco.position.set(0, 0.96, -0.02)
  tronco.rotation.x = 0.06
  lince.add(tronco)

  for (const s of [-1, 1]) {
    const ombreira = sphere(0.12, SUIT, { roughness: 0.85 })
    ombreira.scale.set(1.2, 0.8, 1)
    ombreira.position.set(s * 0.24, 1.15, -0.02)
    lince.add(ombreira)
  }

  // barra do paletó: saia aberta na frente, abrindo sobre o quadril
  const saiaGeo = new THREE.LatheGeometry(
    [[0.305, 0.55], [0.3, 0.6], [0.29, 0.68], [0.276, 0.77], [0.264, 0.86]].map(([r, y]) => new THREE.Vector2(r, y)),
    40,
    0.42,
    Math.PI * 2 - 0.84,
  )
  const saiaMat = mat(SUIT, { roughness: 0.85, size: 0.6 })
  saiaMat.side = THREE.DoubleSide
  const saia = new THREE.Mesh(saiaGeo, saiaMat)
  saia.castShadow = true
  saia.receiveShadow = true
  saia.scale.z = 0.92
  saia.position.z = -0.02
  lince.add(saia)

  // camisa branca no V do paletó aberto — cone sem tampa: o refinador mantém
  // malha aberta nítida por cima da pele, com a borda do V limpa
  const camisa = new THREE.Mesh(
    new THREE.ConeGeometry(0.165, 0.46, 32, 1, true),
    mat(SHIRT, { roughness: 0.7, size: 0.46 }),
  )
  camisa.castShadow = true
  camisa.receiveShadow = true
  camisa.rotation.set(-0.2, 0, Math.PI)
  camisa.scale.z = 0.4
  camisa.position.set(0, 1.02, 0.232)
  lince.add(camisa)

  for (const s of [-1, 1]) {
    // lapelas escuras acompanhando o V
    const lapela = rbox(0.07, 0.36, 0.028, 0.014, SUIT_DARK, { roughness: 0.6 })
    lapela.position.set(s * 0.108, 1.04, 0.232)
    lapela.rotation.set(-0.1, s * 0.4, -s * 0.343)
    lince.add(lapela)

    // pontas do colarinho
    const colarinho = cone(0.032, 0.085, SHIRT, { roughness: 0.7 })
    colarinho.position.set(s * 0.055, 1.19, 0.232)
    colarinho.rotation.z = -s * 2.73
    colarinho.scale.z = 0.4
    lince.add(colarinho)
  }

  const botao = sphere(0.022, SUIT_DARK, { roughness: 0.4 })
  botao.position.set(0, 0.8, 0.258)
  lince.add(botao)

  // bolso do peito (de onde saem os óculos)
  const bolso = rbox(0.12, 0.024, 0.02, 0.008, SUIT_DARK, { roughness: 0.6 })
  bolso.position.set(0.18, 1.0, 0.18)
  bolso.rotation.y = 0.75
  lince.add(bolso)
  const lencinho = cone(0.03, 0.06, SHIRT, { roughness: 0.8 })
  lencinho.position.set(0.17, 1.035, 0.178)
  lencinho.rotation.set(0, 0.75, 0.25)
  lencinho.scale.z = 0.35
  lince.add(lencinho)

  const pescoco = capsule(0.12, 0.08, FUR, { roughness: 0.9 })
  pescoco.position.set(0, 1.33, 0)
  lince.add(pescoco)

  // cotoco de rabo com ponta preta
  lince.add(limb(V(0, 0.62, -0.25), V(0, 0.78, -0.42), 0.075, FUR, 0.9))
  const pontaRabo = sphere(0.07, TUFT, { roughness: 0.9 })
  pontaRabo.position.set(0, 0.81, -0.45)
  lince.add(pontaRabo)

  // braço esquerdo (lado +x) com a mão na cintura
  {
    const S = V(0.29, 1.18, -0.02)
    const E = V(0.56, 0.97, -0.08)
    const W = V(0.36, 0.78, 0.06)
    lince.add(limb(S, E, 0.08, SUIT))
    lince.add(limb(E, W, 0.072, SUIT))
    lince.add(cuff(E, W, 0.072))
    const mao = sphere(0.085, FUR, { roughness: 0.9 })
    mao.scale.set(1, 0.9, 1.1)
    mao.position.set(0.32, 0.74, 0.08)
    lince.add(mao)
  }
  root.add(lince)

  // ---- braço direito: ergue o espeto (pivô no ombro) -------------------------
  const braco = new THREE.Group()
  braco.position.set(-0.29, 1.18, -0.02)
  lince.add(braco)
  const COT = V(-0.17, 0.27, 0.04)
  const PUL = V(-0.22, 0.5, 0.09)
  const PATA = V(-0.235, 0.575, 0.1)
  braco.add(limb(V(0, 0, 0), COT, 0.08, SUIT))
  braco.add(limb(COT, PUL, 0.072, SUIT))
  braco.add(cuff(COT, PUL, 0.072))
  const pata = sphere(0.09, FUR, { roughness: 0.9 })
  pata.scale.set(1, 1.1, 0.95)
  pata.position.copy(PATA)
  braco.add(pata)
  for (const k of [-1, 0, 1]) {
    const dedo = sphere(0.033, FUR, { roughness: 0.9 })
    dedo.position.set(PATA.x + 0.01, PATA.y + k * 0.042, PATA.z + 0.075)
    braco.add(dedo)
  }
  const pegada = new THREE.Object3D()
  pegada.position.set(PATA.x, PATA.y, PATA.z + 0.01)
  braco.add(pegada)

  // ---- cabeça ------------------------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.6, 0.04)
  cabeca.scale.setScalar(1.12)
  lince.add(cabeca)

  const cranio = sphere(0.3, FUR, { roughness: 0.9 })
  cranio.scale.copy(SKULL).multiplyScalar(1 / 0.3)
  cabeca.add(cranio)

  for (const s of [-1, 1]) {
    // almofadas do focinho brancas
    const almofada = sphere(0.095, WHITE_FUR, { roughness: 0.9 })
    almofada.position.set(s * 0.072, -0.1, 0.245)
    cabeca.add(almofada)

    // suíças: duas pontas de pelo claro para baixo e para fora
    const suica = cone(0.12, 0.34, RUFF, { roughness: 0.92 })
    suica.position.set(s * 0.29, -0.14, 0.07)
    suica.rotation.z = -s * 2.33
    suica.scale.z = 0.55
    cabeca.add(suica)
    const suica2 = cone(0.09, 0.26, RUFF, { roughness: 0.92 })
    suica2.position.set(s * 0.22, -0.2, 0.1)
    suica2.rotation.z = -s * 2.67
    suica2.scale.z = 0.55
    cabeca.add(suica2)
    const listra = capsule(0.009, 0.11, '#3a2c22', { roughness: 0.9 })
    listra.position.set(s * 0.3, -0.15, 0.13)
    listra.rotation.z = -s * 2.33
    cabeca.add(listra)

    // olhos arregalados (o LOUCO), depois cobertos pelos óculos
    const esclera = sphere(0.064, '#fbfaf5', { roughness: 0.25 })
    esclera.scale.z = 0.5
    esclera.position.set(s * 0.12, 0.065, 0.225)
    const iris = sphere(0.038, IRIS, { roughness: 0.25 })
    iris.scale.z = 0.4
    iris.position.set(s * 0.12, 0.065, 0.252)
    const pupila = sphere(0.02, '#151515', { roughness: 0.2 })
    pupila.scale.z = 0.4
    pupila.position.set(s * 0.12, 0.065, 0.262)
    cabeca.add(esclera, iris, pupila)

    const sobrancelha = capsule(0.014, 0.08, FUR_DARK, { roughness: 0.9 })
    sobrancelha.position.set(s * 0.12, 0.165, 0.245)
    sobrancelha.rotation.z = Math.PI / 2 + s * 0.3
    cabeca.add(sobrancelha)

    // pintas nas bochechas e no alto da cabeça
    for (const [dx, dy, dz] of [[0.6, 0.35, 0.7], [0.5, 0.58, 0.62], [0.78, 0.12, 0.6], [0.85, 0.4, 0.3]] as const) {
      cabeca.add(skullMark(V(s * dx, dy, dz), 0.024, 1))
    }
  }
  const queixo = sphere(0.07, WHITE_FUR, { roughness: 0.9 })
  queixo.position.set(0, -0.2, 0.2)
  cabeca.add(queixo)

  const nariz = sphere(0.048, NOSE, { roughness: 0.4 })
  nariz.scale.set(1.35, 0.75, 0.9)
  nariz.position.set(0, -0.03, 0.33)
  cabeca.add(nariz)

  // ---- orelhas pontudas com tufos pretos (eriçam no LOUCO) --------------------
  const orelhas = new THREE.Group()
  orelhas.position.set(0, 0.19, -0.03)
  cabeca.add(orelhas)
  for (const s of [-1, 1]) {
    const orelha = new THREE.Group()
    orelha.position.set(s * 0.19, -0.025, 0)
    orelha.rotation.z = -s * 0.28
    const concha = cone(0.11, 0.27, FUR, { roughness: 0.9 })
    concha.scale.z = 0.42
    concha.position.y = 0.135
    orelha.add(concha)
    const dentro = cone(0.07, 0.18, EAR_IN, { roughness: 0.9 })
    dentro.scale.z = 0.3
    dentro.position.set(0, 0.105, 0.03)
    orelha.add(dentro)
    const ponta = cone(0.05, 0.1, TUFT, { roughness: 0.9 })
    ponta.scale.z = 0.45
    ponta.position.y = 0.23
    orelha.add(ponta)
    const tufo = cone(0.024, 0.17, TUFT, { roughness: 0.9 })
    tufo.position.set(s * 0.01, 0.345, 0)
    tufo.rotation.z = s * 0.12
    orelha.add(tufo)
    orelhas.add(orelha)
  }

  // ---- biquinho de beijo (CÜL) ----------------------------------------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.155, 0.29)
  cabeca.add(bico)
  const beicos = cylinder(0.042, 0.05, 0.07, LIP, { roughness: 0.4 })
  beicos.rotation.x = Math.PI / 2
  beicos.position.z = 0.035
  bico.add(beicos)
  const aro = torus(0.034, 0.022, LIP, { roughness: 0.35 })
  aro.position.z = 0.072
  bico.add(aro)
  const furo = sphere(0.016, '#5a2630', { roughness: 0.5 })
  furo.position.z = 0.076
  bico.add(furo)
  bico.scale.set(BICO, BICO * 0.85, BICO)

  // ---- óculos escuros retangulares --------------------------------------------
  const oculos = new THREE.Group()
  oculos.position.set(0, 0.065, 0.296)
  cabeca.add(oculos)
  for (const s of [-1, 1]) {
    const lente = rbox(0.205, 0.128, 0.026, 0.035, LENS, { roughness: 0.08, metalness: 0.5 })
    lente.position.set(s * 0.124, 0, 0)
    oculos.add(lente)
    const haste = rbox(0.022, 0.026, 0.3, 0.008, FRAME, { roughness: 0.35 })
    haste.position.set(s * 0.245, 0.045, -0.14)
    oculos.add(haste)
  }
  const barraTopo = rbox(0.48, 0.036, 0.036, 0.014, FRAME, { roughness: 0.35 })
  barraTopo.position.set(0, 0.056, 0.004)
  oculos.add(barraTopo)
  const ponte = rbox(0.05, 0.022, 0.02, 0.008, FRAME, { roughness: 0.35 })
  ponte.position.set(0, 0.02, 0.004)
  oculos.add(ponte)

  // brilho de "cool" na lente
  const brilho = new THREE.Group()
  brilho.position.set(-0.17, 0.028, 0.018)
  brilho.rotation.z = 0.3
  oculos.add(brilho)
  for (const [w, rz] of [[0.12, 0], [0.12, Math.PI / 2], [0.06, Math.PI / 4], [0.06, -Math.PI / 4]] as const) {
    const raio = rbox(w, 0.016, 0.008, 0.006, '#ffffff', { emissive: '#fff6d8', emissiveIntensity: 1.4 })
    raio.rotation.z = rz
    brilho.add(raio)
  }

  // ---- gravata amarela voando (o acento) -------------------------------------
  const gravata = new THREE.Group()
  gravata.position.set(0, 1.17, 0.262)
  gravata.rotation.z = TIE_FLY
  lince.add(gravata)
  const no = rbox(0.08, 0.075, 0.05, 0.022, TIE, { roughness: 0.42 })
  gravata.add(no)
  const lamina = tieBlade()
  lamina.position.set(0, -0.03, 0.005)
  gravata.add(lamina)

  // ---- espeto de churrasco (peça solta: segue a pata) ------------------------
  const espeto = new THREE.Group()
  const vareta = cylinder(0.011, 0.011, 1.0, SILVER, { roughness: 0.25, metalness: 0.85 }, 12)
  vareta.position.y = 0.16
  espeto.add(vareta)
  const pontaEsp = cone(0.011, 0.06, SILVER, { roughness: 0.25, metalness: 0.85 }, 12)
  pontaEsp.position.y = 0.69
  espeto.add(pontaEsp)
  const argola = torus(0.045, 0.011, SILVER, { roughness: 0.25, metalness: 0.85 })
  argola.position.y = -0.385
  espeto.add(argola)
  ;[0.2, 0.34, 0.48].forEach((y, k) => {
    const carne = new THREE.Group()
    carne.position.y = y
    carne.rotation.set((rand() - 0.5) * 0.3, k * 0.5, (rand() - 0.5) * 0.3)
    const naco = rbox(0.13, 0.1, 0.12, 0.035, MEAT, { roughness: 0.75 })
    carne.add(naco)
    for (const d of [-0.025, 0.025]) {
      const marca = rbox(0.1, 0.012, 0.01, 0.004, CHAR, { roughness: 0.9 })
      marca.position.set(0, d, 0.06)
      marca.rotation.z = 0.45
      carne.add(marca)
    }
    espeto.add(carne)
  })
  espeto.rotation.z = 0.22
  root.add(espeto)

  // pose final montada: espeto na pata erguida; posições de partida derivadas
  root.updateMatrixWorld(true)
  const ESP = pegada.getWorldPosition(new THREE.Vector3())
  espeto.position.copy(ESP)
  const ESP0 = ESP.clone().sub(V(0, DY - GY, LZ - LZ0)) // antes do pulo
  const ESP_SQ = DY + SQUASH * (ESP.y - DY)
  const BOLSO = cabeca.worldToLocal(lince.localToWorld(V(0.18, 1.0, 0.2)))

  // ---- peças -------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'clareira', object: base },
    { name: 'pinheiros', group: 'clareira', object: pinheiros },
    { name: 'escrivaninha', group: 'escritorio', object: escrivaninha },
    { name: 'lince', group: 'lince', object: lince },
    { name: 'cabeca', group: 'lince', object: cabeca },
    { name: 'orelhas', group: 'lince', object: orelhas },
    { name: 'braco', group: 'lince', object: braco },
    { name: 'gravata', group: 'lince', object: gravata },
    { name: 'churrasqueira', group: 'churrasco', object: churrasqueira },
    { name: 'espeto', group: 'de', object: espeto },
    { name: 'oculos', group: 'cul', object: oculos },
    { name: 'bico', group: 'cul', object: bico },
    { name: 'brilho', group: 'kul', object: brilho },
  ]

  const grow = (from = 0.01, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem ----------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Uma clareira de musgo sobe do chão, com pinheiros: a floresta sueca.',
    }),
    seq('pinheiros-rise', 'pinheiros', 0.25, 0.9, [riseFrom(0, 3.4)], { ease: 'easeOut' }),

    seq('escrivaninha-rise', 'escrivaninha', 1.5, 0.8, [riseFrom(GY, 1.0)], {
      ease: 'easeOut',
      caption: 'No meio do mato, uma escrivaninha com o laptop fechado: o escritório da toca.',
    }),

    seq('lince-rise', 'lince', 3.0, 0.85, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'Atrás dela, o lince de TERNO: o bicho mais arisco da floresta nunca vai a festa nenhuma.',
    }),
    seq('cabeca-sobe', 'cabeca', 3.2, 0.6, [ch('position.y', 1.05, 1.6)], { ease: 'easeOut' }),
    seq('orelhas-brotam', 'orelhas', 3.45, 0.5, [ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1)], { ease: 'easeOut' }),
    seq('braco-brota', 'braco', 3.3, 0.5, grow(), { ease: 'easeOut' }),
    seq('gravata-brota', 'gravata', 3.5, 0.45, grow(), { ease: 'easeOut' }),

    seq('churrasqueira-rise', 'churrasqueira', 4.9, 0.8, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'Você chama ele pro churrasco de sábado…',
    }),

    seq('braco-ergue', 'braco', 6.3, 0.4, [ch('rotation.z', ARM_REST, 0)], { ease: 'easeOut' }),
    seq(
      'espeto-arranca',
      'espeto',
      6.25,
      0.5,
      [
        ch('position.x', 0.9, ESP0.x), ch('position.y', 1.1, ESP0.y), ch('position.z', 3.0, ESP0.z),
        ch('rotation.z', 1.7, 0.22),
        ch('scale.x', 0.6, 1), ch('scale.y', 0.6, 1), ch('scale.z', 0.6, 1),
      ],
      { ease: 'easeOut', caption: '…e ele arranca o espeto da sua mão: DÊ!' },
    ),

    // LOUCO: pula de terno e tudo em cima da escrivaninha
    seq('lince-pulo-sobe', 'lince', 7.6, 0.38, [ch('position.y', GY, PEAK)], {
      ease: 'easeOut',
      caption: 'E fica LOUCO de TERNO e tudo — LÔ-TER! — pula na escrivaninha, gravata voando, tufos em pé.',
    }),
    seq('lince-pulo-desce', 'lince', 7.98, 0.32, [ch('position.y', PEAK, DY)], { ease: 'easeIn' }),
    seq('lince-pulo-z', 'lince', 7.6, 0.7, [ch('position.z', LZ0, LZ)], { ease: 'linear' }),
    seq('lince-amassa', 'lince', 8.3, 0.12, [ch('scale.y', 1, SQUASH)], { ease: 'easeOut' }),
    seq('lince-desamassa', 'lince', 8.42, 0.28, [ch('scale.y', SQUASH, 1)], { ease: 'easeOut' }),
    seq('espeto-pulo-sobe', 'espeto', 7.6, 0.38, [ch('position.y', ESP0.y, ESP0.y + (PEAK - GY))], { ease: 'easeOut' }),
    seq('espeto-pulo-desce', 'espeto', 7.98, 0.32, [ch('position.y', ESP0.y + (PEAK - GY), ESP.y)], { ease: 'easeIn' }),
    seq('espeto-pulo-z', 'espeto', 7.6, 0.7, [ch('position.z', ESP0.z, ESP.z)], { ease: 'linear' }),
    seq('espeto-amassa', 'espeto', 8.3, 0.12, [ch('position.y', ESP.y, ESP_SQ)], { ease: 'easeOut' }),
    seq('espeto-desamassa', 'espeto', 8.42, 0.28, [ch('position.y', ESP_SQ, ESP.y)], { ease: 'easeOut' }),
    seq('gravata-voa', 'gravata', 7.98, 0.3, [ch('rotation.z', 0, TIE_FLY + 0.45)], { ease: 'easeOut' }),
    seq('gravata-tremula', 'gravata', 8.28, 0.45, [ch('rotation.z', TIE_FLY + 0.45, TIE_FLY)]),
    seq('orelhas-ericam', 'orelhas', 7.75, 0.3, [ch('scale.y', EARS_FLAT, 1.2)], { ease: 'easeOut' }),
    seq('orelhas-assentam', 'orelhas', 8.05, 0.3, [ch('scale.y', 1.2, 1)]),

    // óculos: saem do bolso do paletó, dão uma pirueta e pousam na cara
    seq(
      'oculos-saca',
      'oculos',
      9.4,
      0.45,
      [
        ch('position.x', BOLSO.x, 0.26), ch('position.y', BOLSO.y, 0.38), ch('position.z', BOLSO.z, 0.62),
        ch('rotation.y', -Math.PI * 1.5, -0.4),
        ...grow(0.25, 1),
      ],
      { ease: 'easeOut', caption: 'Do bolso do paletó, ele saca os óculos escuros e põe na cara…' },
    ),
    seq(
      'oculos-poe',
      'oculos',
      9.85,
      0.35,
      [ch('position.x', 0.26, 0), ch('position.y', 0.38, 0.065), ch('position.z', 0.62, 0.296), ch('rotation.y', -0.4, 0)],
      { ease: 'easeIn' },
    ),

    seq('bico-faz', 'bico', 10.55, 0.3, [ch('scale.x', 0.01, BICO), ch('scale.y', 0.01, BICO * 0.85), ch('scale.z', 0.01, BICO * 1.6)], {
      ease: 'easeOut',
      caption: '…e faz biquinho de beijo: CÜÜÜL! — lábios em bico, língua no I, L no fim.',
    }),
    seq('bico-assenta', 'bico', 10.85, 0.3, [ch('scale.z', BICO * 1.6, BICO)]),

    seq('brilho-pisca', 'brilho', 11.6, 0.25, [...grow(0.01, 1.5), ch('rotation.z', -1.2, 0.3)], {
      ease: 'easeOut',
      caption: 'Det låter kul! — Parece divertido!',
    }),
    seq('brilho-assenta', 'brilho', 11.85, 0.35, grow(1.5, 1)),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.2, 5.6], target: [0.05, 1.68, 0.25] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-later-kul',
    contexto:
      "Social: a resposta animada a um convite ou plano — 'Ska vi gå på bio på fredag?' — 'Det låter kul!' — e também pra reagir à novidade de alguém: uma viagem, um curso, um emprego novo.",
    fraseFonte: 'Parece divertido!',
    fraseAlvo: 'Det låter kul!',
    pronuncia:
      "dê LÔ-ter KÜÜL! ('det' = dê, sem T; 'låter' com Ô FECHADO e longo e a força no LÔ, -ter fraquinho; 'kul' com Ü LONGO — bico de beijo e língua de I — e L de verdade no fim, ponta da língua no céu da boca; a força maior cai no KUL)",
    ponteSonora:
      "DÊ! LÔ(uco de) TER(no)... CÜL! (4 sílabas: dê-LÔÔ-ter-KÜÜL; tônicas em LÔ e, mais forte, em CÜL; DÊ = o 'det' de sempre, de 'Det är lugnt' e do DÊ! de 'Det gör ont här', Ê FECHADO e sem T — aqui é o 'DÊ cá!' do lince arrancando o espeto da sua mão; LÔ-TER = o MESMO 'låter' de 'Jag tycker att det låter bra': as primeiras sílabas de LOUCO + TERNO, LÔ com Ô FECHADO e LONGO — é o å longo — e a força nele, o -TER fraquinho, T seco e R brando; nunca 'LÓ-ter' de boca aberta; CÜL = o MESMO 'kul' da arara de 'Vad kul att höra!': o 'cool' do inglês com LÁBIOS EM BICO DE BEIJO e a língua no I — é o Ü, LONGO, CÜÜL —, e L DE VERDADE no fim, ponta da língua no céu da boca, nunca 'kiu'; de boca aberta vira 'kål', repolho)",
    historia:
      'O lince é o bicho mais arisco da floresta sueca: passa a semana de TERNO no escritório da toca e nunca aparece em festa nenhuma. Você chama ele pro churrasco de sábado, e ele arranca o espeto da sua mão — DÊ! — e fica LOUCO: pula em cima da escrivaninha de TERNO e tudo, a gravata voando, os tufos das orelhas em pé. Do bolso do paletó saca os óculos escuros, põe na cara e faz biquinho de beijo: CÜÜÜL! Quando até o lince topa assim, é porque parece divertido.',
  },
  createScene,
  refine: { organic: ['lince', 'cabeca', 'orelhas', 'braco'] },
}

export default card
