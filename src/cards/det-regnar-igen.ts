import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Det regnar igen." — DÊ... (me)RÉNG(ue)-NAR(iz)... I-IÉN(e)!
 *
 * O cume do Monte Fuji é o próprio diorama: cone torneado de encosta côncava
 * com a "neve" de MERENGUE escorrendo em línguas pela encosta (o boné branco
 * do Fuji) e picos torcidos de suspiro no platô. Lá em cima, o alpinista de
 * jaqueta laranja, de perfil, com o NARIGÃO vermelho de sol besuntado de
 * protetor branco (e a primeira gota pousada na ponta), joga uma moedinha
 * furada de IENE na caixa de oferendas do torii vermelho, debaixo do teto de
 * nuvens que despeja chuva.
 *
 * Leitura de relance: torii + ¥ = Japão/iene; nuvem + gotas = chuva; o
 * narigão branco e o merengue escorrendo = a ponte sonora.
 */

const ARDOSIA = '#34312f'
const PEDRA = '#6f655d'
const PEDRA_ESC = '#5a514a'
const MERENGUE = '#f5eddc'
const TOSTADO = '#d9a35e' // ponta crocante do suspiro
const VERMELHAO = '#d2432c' // o torii
const LACA = '#262120'
const MADEIRA = '#7d5232'
const MADEIRA_ESC = '#4e331f'
const LATAO = '#d8b25a'
const NUVEM = '#68707c'
const NUVEM_ESC = '#525965'
const CHUVA = '#a6cbee'
const LARANJA = '#e57a2c'
const LARANJA_ESC = '#bd5f1d'
const MARINHO = '#28365a'
const MARINHO_ESC = '#1d2843'
const MOCHILA = '#3d5a4a'
const BOTA = '#232325'
const PELE = '#e9c19c'
const NARIZ_PELE = '#e9a184' // vermelhinho de sol
const CREME = '#fdfbf6'
const GORRO = '#b8352d'
const PRATA = '#e3e7ec'
const METAL = '#9ba3ac'

const MB = 0.1 // topo do pedestal de ardósia
const MT = 1.0 // platô do Fuji (rocha)
const MS = 1.1 // superfície do merengue no platô
const CAP_Y0 = 0.66 // borda de baixo da capa de merengue (antes das línguas)

// encosta côncava do Fuji: larga embaixo, íngreme perto do topo
const FUJI: [number, number][] = [
  [2.75, MB], [2.42, 0.18], [2.15, 0.3], [1.93, 0.45], [1.76, 0.62],
  [1.63, 0.8], [1.54, 0.93], [1.5, MT],
]

/** Raio da encosta na altura y (interpola o perfil). */
function fujiR(y: number) {
  if (y <= FUJI[0][1]) return FUJI[0][0]
  for (let i = 1; i < FUJI.length; i++) {
    const [r1, y1] = FUJI[i]
    const [r0, y0] = FUJI[i - 1]
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
  }
  return FUJI[FUJI.length - 1][0]
}

/** Mesh com o material padrão do app e sombras. */
function meshOf(geo: THREE.BufferGeometry, color: string, opts: Parameters<typeof mat>[1] = {}) {
  const m = new THREE.Mesh(geo, mat(color, opts))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Normais da emenda de um torneado deformado: média das duas colunas. */
function fixSeam(geo: THREE.BufferGeometry, segments: number, points: number) {
  const n = geo.attributes.normal
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  for (let j = 0; j < points; j++) {
    const i0 = j
    const i1 = segments * points + j
    a.fromBufferAttribute(n, i0)
    b.fromBufferAttribute(n, i1)
    a.add(b).normalize()
    n.setXYZ(i0, a.x, a.y, a.z)
    n.setXYZ(i1, a.x, a.y, a.z)
  }
  n.needsUpdate = true
}

/**
 * Capa de merengue do cume: cobre o platô e desce a encosta em LÍNGUAS de
 * comprimentos diferentes, com a borda grossa e arredondada — o boné de neve
 * do Fuji, só que de suspiro.
 */
function capa() {
  const prof: [number, number][] = []
  const ROWS = 12
  const span = MT - CAP_Y0
  for (let j = 0; j <= ROWS; j++) {
    const t = 1 - j / ROWS // 1 = borda de baixo, 0 = beirada do platô
    const y = MT - t * span
    const th = t <= 0.6 ? 0.065 : 0.065 * Math.sqrt(Math.max(0, 1 - ((t - 0.6) / 0.4) ** 2))
    prof.push([fujiR(y) + th - 0.012, y])
  }
  prof.push([1.53, MT + 0.06], [1.46, MS - 0.008], [1.2, MS], [0.6, MS + 0.006], [0, MS + 0.006])

  const SEG = 160
  const geo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), SEG)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    if (v.y >= MT - 1e-4) continue
    const a = Math.atan2(v.x, v.z)
    const r = Math.hypot(v.x, v.z)
    const th = r - fujiR(v.y)
    const t = (MT - v.y) / span
    const lingua = Math.max(
      0.4,
      1 + 0.5 * Math.sin(5 * a + 0.7) + 0.32 * Math.sin(9 * a + 2.1) + 0.22 * Math.sin(17 * a + 0.4),
    )
    const y = MT - t * span * lingua
    const rr = fujiR(y) + th
    v.set(Math.sin(a) * rr, y, Math.cos(a) * rr)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  fixSeam(geo, SEG, prof.length)
  return meshOf(geo, MERENGUE, { roughness: 0.7 })
}

/** Pico de suspiro: torneado com estrias em espiral e ponta que tomba. */
function suspiro(r: number, h: number, seed: number) {
  const rand = rng(seed)
  const prof: [number, number][] = [
    [0, 0], [r * 0.96, 0], [r, h * 0.1], [r * 0.9, h * 0.28], [r * 0.66, h * 0.5],
    [r * 0.4, h * 0.7], [r * 0.18, h * 0.87], [r * 0.05, h * 0.97], [0, h],
  ]
  const SEG = 64
  const geo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), SEG)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  const twist = 2.2 + rand() * 1.2
  const phase = rand() * Math.PI * 2
  const lean = 0.1 + rand() * 0.08
  // crocante por fora: as cristas das estrias e a ponta tostadas de dourado
  const cor = new THREE.Color()
  const base = new THREE.Color(MERENGUE)
  const tostado = new THREE.Color(TOSTADO)
  const cores = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const t = v.y / h
    const a = Math.atan2(v.z, v.x)
    const onda = Math.sin(7 * (a + twist * t) + phase)
    const k = 1 + 0.15 * onda
    v.x *= k
    v.z *= k
    v.x += h * lean * t * t * Math.cos(phase)
    v.z += h * lean * t * t * Math.sin(phase)
    pos.setXYZ(i, v.x, v.y, v.z)
    const toast = THREE.MathUtils.smoothstep(t, 0.45, 0.95) * (0.55 + 0.45 * Math.max(0, onda))
    cor.copy(base).lerp(tostado, Math.min(1, toast))
    cores.set([cor.r, cor.g, cor.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3))
  geo.computeVertexNormals()
  fixSeam(geo, SEG, prof.length)
  const m = meshOf(geo, '#ffffff', { roughness: 0.7 })
  ;(m.material as THREE.MeshStandardMaterial).vertexColors = true
  return m
}

/**
 * Fio de merengue escorrendo pela encosta, a partir do ângulo `ang` (0 = frente).
 * Vai de yTop até yTop - drop, colado na rocha, com um pingo gordo na ponta.
 */
function fio(ang: number, yTop: number, drop: number, w: number, seed: number) {
  const rand = rng(seed)
  const g = new THREE.Group()
  const pts: THREE.Vector3[] = []
  const N = 10
  const wob = 0.05 + rand() * 0.05
  for (let i = 0; i <= N; i++) {
    const s = i / N
    const y = yTop - s * drop
    const r = fujiR(y) + w * 0.4
    const a = ang + wob * Math.sin(s * 6 + seed)
    pts.push(new THREE.Vector3(r * Math.sin(a), y, r * Math.cos(a)))
  }
  // afunilado: fino onde sai da capa, engordando até o pingo da ponta
  const curve = new THREE.CatmullRomCurve3(pts)
  const TUB = 48
  const RAD = 14
  const geo = new THREE.TubeGeometry(curve, TUB, w, RAD, false)
  const pos = geo.attributes.position
  const P = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= TUB; i++) {
    const t = i / TUB
    curve.getPointAt(t, P)
    const k = 0.5 + 0.5 * t
    for (let j = 0; j <= RAD; j++) {
      const idx = i * (RAD + 1) + j
      v.fromBufferAttribute(pos, idx).sub(P).multiplyScalar(k).add(P)
      pos.setXYZ(idx, v.x, v.y, v.z)
    }
  }
  const tube = meshOf(geo, MERENGUE, { roughness: 0.6 })
  g.add(tube)
  const end = pts[pts.length - 1]
  const bulb = sphere(w * 1.4, MERENGUE, { roughness: 0.6 })
  bulb.position.copy(end)
  bulb.scale.y = 1.2
  g.add(bulb)
  return g
}

/** Viga superior do torii (kasagi): preta, com as pontas curvadas pra cima. */
function kasagi(w: number) {
  const hw = w / 2
  const bottom = (x: number) => 0.07 * Math.pow(Math.abs(x) / hw, 2.4)
  const top = (x: number) => 0.11 + 0.13 * Math.pow(Math.abs(x) / hw, 2.4)
  const s = new THREE.Shape()
  const N = 16
  s.moveTo(-hw, bottom(-hw))
  for (let i = 1; i <= N; i++) {
    const x = -hw + (w * i) / N
    s.lineTo(x, bottom(x))
  }
  for (let i = N; i >= 0; i--) {
    const x = -hw + (w * i) / N
    s.lineTo(x, top(x))
  }
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  })
  geo.translate(0, 0, -0.075)
  return meshOf(geo, LACA, { roughness: 0.35 })
}

/** Traço do glifo ¥: caixinha em pé no plano xy. */
function traco(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.008, LATAO, { roughness: 0.3, metalness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** ¥ de traço grosso para a frente da caixa de oferendas. */
function iene() {
  const g = new THREE.Group()
  const t = 0.036
  g.add(traco(t, 0.135, -0.042, 0.052, 0.66))
  g.add(traco(t, 0.135, 0.042, 0.052, -0.66))
  g.add(traco(t, 0.13, 0, -0.055))
  g.add(traco(0.135, 0.026, 0, -0.022))
  g.add(traco(0.135, 0.026, 0, -0.068))
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- a montanha: pedestal de ardósia + cone torneado do Fuji -------------
  const montanha = new THREE.Group()

  const pedestal = cylinder(2.85, 2.9, MB, ARDOSIA, { roughness: 0.8 })
  pedestal.position.y = MB / 2
  montanha.add(pedestal)
  const friso = torus(2.87, 0.022, '#4a4542', { roughness: 0.6 })
  friso.rotation.x = Math.PI / 2
  friso.position.y = MB - 0.005
  montanha.add(friso)

  const encosta = lathe([[0, MB], ...FUJI, [1.4, MT + 0.01], [0, MT + 0.01]], PEDRA, { roughness: 0.95 }, 96)
  montanha.add(encosta)

  // nervuras de lava descendo a encosta, entre as línguas de merengue
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + rand() * 0.15
    const pts: THREE.Vector3[] = []
    const y0 = 0.62 - rand() * 0.1
    const y1 = 0.16 + rand() * 0.12
    for (let k = 0; k <= 6; k++) {
      const y = y0 - (k / 6) * (y0 - y1)
      const r = fujiR(y) + 0.004
      pts.push(new THREE.Vector3(r * Math.sin(a), y, r * Math.cos(a)))
    }
    const ridge = meshOf(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.03, 8, false),
      PEDRA_ESC,
      { roughness: 0.95 },
    )
    montanha.add(ridge)
  }

  // pedras soltas no sopé
  for (const [a, y, rr, s] of [
    [-1.05, 0.2, 0.17, 3], [1.3, 0.18, 0.15, 5], [2.3, 0.24, 0.2, 7],
    [-2.4, 0.22, 0.19, 9], [0.45, 0.14, 0.12, 11], [-0.4, 0.13, 0.11, 13],
  ] as const) {
    const pedra = rock(rr, PEDRA_ESC, s, { roughness: 0.9 })
    const r = fujiR(y) + rr * 0.3
    pedra.position.set(r * Math.sin(a), y, r * Math.cos(a))
    pedra.rotation.y = rand() * Math.PI
    pedra.scale.y = 0.7
    montanha.add(pedra)
  }
  root.add(montanha)

  // ---- o merengue: capa com línguas + picos torcidos -----------------------
  const MERENGUE_Y = 0.4 // pivô baixo (dentro da rocha): o merengue cresce pra cima
  const merengue = new THREE.Group()
  merengue.position.y = MERENGUE_Y

  const tampa = capa()
  tampa.position.y = -MERENGUE_Y
  merengue.add(tampa)

  // picos de suspiro: coroa alta atrás, baixinhos na frente, longe do elenco
  for (const [x, z, h, s] of [
    [-1.12, -0.98, 0.52, 1], [-0.42, -1.32, 0.58, 2], [0.38, -1.34, 0.54, 3],
    [1.08, -1.0, 0.5, 4], [1.38, -0.32, 0.42, 5], [1.3, 0.48, 0.32, 6],
    [-1.4, 0.38, 0.34, 7], [-1.02, 0.98, 0.26, 8], [-0.28, 1.3, 0.22, 9],
    [0.66, 1.22, 0.24, 10], [0.02, -0.62, 0.3, 11], [0.86, -0.5, 0.26, 12],
    [1.25, 1.0, 0.18, 13],
  ] as const) {
    const pico = suspiro(h * 0.5, h, s * 7)
    pico.position.set(x, MS - 0.02 - MERENGUE_Y, z)
    merengue.add(pico)
  }

  // monte baixinho onde as botas afundam
  const monte = puff(0.2, MERENGUE, 6, 17, { roughness: 0.7 })
  monte.position.set(0.45, MS + 0.0 - MERENGUE_Y, 0.25)
  monte.scale.set(1.5, 0.3, 1.3)
  merengue.add(monte)

  // pegadas do alpinista no merengue, subindo da beirada até ele
  const passo = new THREE.Vector2(-0.45, -0.75).normalize()
  for (let k = 0; k < 5; k++) {
    const side = k % 2 ? 1 : -1
    const pegada = sphere(1, '#e2d6bd', { roughness: 0.85 })
    pegada.scale.set(0.055, 0.008, 0.085)
    pegada.position.set(
      1.12 + passo.x * k * 0.19 + passo.y * side * 0.07,
      MS + 0.004 - MERENGUE_Y,
      1.38 + passo.y * k * 0.19 - passo.x * side * 0.07,
    )
    pegada.rotation.y = Math.atan2(passo.x, passo.y)
    merengue.add(pegada)
  }
  root.add(merengue)

  // ---- três fios longos escorrendo encosta abaixo (crescem com a chuva) -----
  const FIOS_Y = MT // pivô na beirada do platô: em escala menor somem na rocha
  const fios = new THREE.Group()
  fios.position.y = FIOS_Y
  for (const [a, drop, w, s] of [[-1.05, 0.6, 0.07, 21], [-0.42, 0.66, 0.076, 22], [0.98, 0.56, 0.068, 23]] as const) {
    const f = fio(a, 0.86, drop, w, s)
    f.position.y = -FIOS_Y
    fios.add(f)
  }
  root.add(fios)

  // ---- torii vermelho ------------------------------------------------------
  const TORII_Y = MS - 0.04
  const torii = new THREE.Group()
  torii.position.set(-0.74, TORII_Y, -0.58)
  torii.rotation.y = 0.4

  for (const side of [-1, 1]) {
    const poste = cylinder(0.068, 0.078, 1.36, VERMELHAO, { roughness: 0.45 })
    poste.position.set(side * 0.47, 0.68, 0)
    torii.add(poste)
    const pe = cylinder(0.092, 0.096, 0.16, LACA, { roughness: 0.4 })
    pe.position.set(side * 0.47, 0.08, 0)
    torii.add(pe)
    // cunha que trava a viga de baixo
    const cunha = rbox(0.05, 0.08, 0.13, 0.01, VERMELHAO, { roughness: 0.45 })
    cunha.position.set(side * 0.38, 1.0, 0)
    torii.add(cunha)
  }
  const nuki = rbox(1.24, 0.09, 0.09, 0.02, VERMELHAO, { roughness: 0.45 })
  nuki.position.y = 1.0
  torii.add(nuki)
  const shimaki = rbox(1.36, 0.085, 0.11, 0.02, VERMELHAO, { roughness: 0.45 })
  shimaki.position.y = 1.31
  torii.add(shimaki)
  const placaTorii = rbox(0.15, 0.2, 0.05, 0.02, LACA, { roughness: 0.4 })
  placaTorii.position.set(0, 1.155, 0.01)
  torii.add(placaTorii)
  const moldura = rbox(0.11, 0.155, 0.02, 0.01, LATAO, { roughness: 0.35, metalness: 0.6 })
  moldura.position.set(0, 1.155, 0.035)
  torii.add(moldura)
  const viga = kasagi(1.66)
  viga.position.y = 1.355
  torii.add(viga)
  root.add(torii)

  // ---- caixa de oferendas (saisen-bako) com ¥ -------------------------------
  const CAIXA_Y = MS - 0.03
  const caixa = new THREE.Group()
  caixa.position.set(-0.62, CAIXA_Y, 0.12)
  caixa.rotation.y = 0.4

  const sapata = rbox(0.74, 0.09, 0.5, 0.02, MADEIRA_ESC, { roughness: 0.8 })
  sapata.position.y = 0.045
  caixa.add(sapata)
  const corpo = rbox(0.66, 0.36, 0.44, 0.03, MADEIRA, { roughness: 0.75 })
  corpo.position.y = 0.27
  caixa.add(corpo)
  // tábuas da frente e cantoneiras de latão
  for (const gx of [-0.29, 0.29]) {
    const fresta = rbox(0.012, 0.3, 0.012, 0.004, MADEIRA_ESC, { roughness: 0.85 })
    fresta.position.set(gx * 0.65, 0.27, 0.223)
    caixa.add(fresta)
  }
  for (const sx of [-1, 1]) {
    for (const sy of [0.115, 0.425]) {
      const canto = rbox(0.07, 0.07, 0.03, 0.01, LATAO, { roughness: 0.3, metalness: 0.6 })
      canto.position.set(sx * 0.31, sy, 0.218)
      caixa.add(canto)
    }
  }
  const aro = rbox(0.74, 0.06, 0.52, 0.02, MADEIRA_ESC, { roughness: 0.8 })
  aro.position.y = 0.475
  caixa.add(aro)
  // grade do tampo: ripas em quina, viradas pra cima
  for (let i = 0; i < 6; i++) {
    const ripa = rbox(0.06, 0.06, 0.44, 0.012, MADEIRA, { roughness: 0.7 })
    ripa.rotation.z = Math.PI / 4
    ripa.position.set(-0.25 + i * 0.1, 0.51, 0)
    caixa.add(ripa)
  }
  const glifo = iene()
  glifo.position.set(0, 0.265, 0.235)
  glifo.scale.setScalar(1.25)
  caixa.add(glifo)
  root.add(caixa)

  // ---- picareta de gelo fincada no merengue ---------------------------------
  const picareta = new THREE.Group()
  picareta.position.set(1.12, MS - 0.02, 0.72)
  picareta.rotation.set(0.12, -0.5, -0.3)

  const cabo = cylinder(0.03, 0.034, 0.92, '#39434e', { roughness: 0.4, metalness: 0.3 })
  cabo.position.y = 0.36
  picareta.add(cabo)
  const empunhadura = cylinder(0.042, 0.042, 0.22, MARINHO, { roughness: 0.85 })
  empunhadura.position.y = 0.1
  picareta.add(empunhadura)
  const cabeca = new THREE.Group()
  cabeca.position.y = 0.84
  picareta.add(cabeca)
  const miolo = rbox(0.09, 0.1, 0.07, 0.02, METAL, { roughness: 0.3, metalness: 0.8 })
  cabeca.add(miolo)
  const bico = rbox(0.32, 0.055, 0.035, 0.015, METAL, { roughness: 0.3, metalness: 0.8 })
  bico.position.set(0.19, -0.03, 0)
  bico.rotation.z = -0.22
  cabeca.add(bico)
  const ponta = cone(0.028, 0.08, METAL, { roughness: 0.3, metalness: 0.8 }, 4)
  ponta.position.set(0.37, -0.075, 0)
  ponta.rotation.z = -Math.PI / 2 - 0.22
  cabeca.add(ponta)
  const enxo = rbox(0.13, 0.04, 0.085, 0.012, METAL, { roughness: 0.3, metalness: 0.8 })
  enxo.position.set(-0.11, -0.01, 0)
  enxo.rotation.z = 0.12
  cabeca.add(enxo)
  const alca = torus(0.07, 0.012, MARINHO, { roughness: 0.85 })
  alca.position.set(0.03, -0.32, 0.04)
  alca.rotation.set(0.3, 0.4, 0)
  cabeca.add(alca)
  root.add(picareta)

  // ---- o alpinista (de perfil, olhando pro santuário) -----------------------
  const H = 1.6
  const bodyR = H * 0.17
  const ALP_Y = MS - 0.05
  const alpinista = person({ body: LARANJA, skin: PELE, height: H, armAngle: 0.3 })
  alpinista.position.set(0.45, ALP_Y, 0.25)
  alpinista.rotation.y = -1.2
  const ESCALA = 1.12
  alpinista.scale.setScalar(ESCALA)

  // calça azul-marinho: casca da metade de baixo do corpo, até a barra da jaqueta
  const calca = lathe(
    [[0.12, 0.03], [0.22, 0.08], [0.272, 0.16], [0.287, 0.25], [0.288, 0.37], [0.27, 0.37]],
    MARINHO,
    { roughness: 0.85 },
  )
  alpinista.add(calca)
  const cinto = torus(0.283, 0.022, MARINHO_ESC, { roughness: 0.8 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.36
  alpinista.add(cinto)
  for (const side of [-1, 1]) {
    const bota = rbox(0.17, 0.15, 0.28, 0.05, BOTA, { roughness: 0.6 })
    bota.position.set(side * 0.12, 0.06, 0.09)
    alpinista.add(bota)
  }

  // jaqueta: zíper, gola alta, bolsos
  const ziper = rbox(0.03, 0.2, 0.02, 0.008, LARANJA_ESC, { roughness: 0.5 })
  ziper.position.set(0, 0.47, bodyR - 0.002)
  alpinista.add(ziper)
  const gola = torus(0.17, 0.06, LARANJA_ESC, { roughness: 0.8 })
  gola.rotation.x = Math.PI / 2
  gola.position.y = 0.8
  alpinista.add(gola)
  for (const side of [-1, 1]) {
    const bolso = rbox(0.13, 0.03, 0.04, 0.012, LARANJA_ESC, { roughness: 0.8 })
    bolso.position.set(side * 0.13, 0.5, bodyR - 0.01)
    alpinista.add(bolso)
  }

  // mochila de escalada nas costas
  const mochila = rbox(0.42, 0.5, 0.22, 0.07, MOCHILA, { roughness: 0.9 })
  mochila.position.set(0, 0.56, -0.33)
  alpinista.add(mochila)
  const colchonete = cylinder(0.08, 0.08, 0.46, '#7a8a5c', { roughness: 0.9 })
  colchonete.rotation.z = Math.PI / 2
  colchonete.position.set(0, 0.86, -0.34)
  alpinista.add(colchonete)

  const head = alpinista.getObjectByName('head') as THREE.Group
  head.rotation.set(-0.1, 0.36, 0)

  // gorro vermelho com barra dobrada e pompom
  const gorro = lathe(
    [[0.325, 0], [0.33, 0.07], [0.31, 0.16], [0.245, 0.27], [0.13, 0.34], [0, 0.355]],
    GORRO,
    { roughness: 0.92 },
  )
  gorro.position.y = 0.075
  head.add(gorro)
  const barra = torus(0.322, 0.055, '#9e2c25', { roughness: 0.92 })
  barra.rotation.x = Math.PI / 2
  barra.position.y = 0.1
  head.add(barra)
  const pompom = puff(0.075, '#efe6d6', 5, 61, { roughness: 0.95 })
  pompom.position.y = 0.45
  head.add(pompom)

  // óculos de neve levantados, por cima da barra do gorro
  const elastico = torus(0.345, 0.018, '#2b2b30', { roughness: 0.7 })
  elastico.rotation.x = Math.PI / 2 - 0.12
  elastico.position.y = 0.2
  head.add(elastico)
  const oculos = new THREE.Group()
  oculos.position.set(0, 0.2, 0.31)
  oculos.rotation.x = -0.45
  const armacao = rbox(0.36, 0.14, 0.05, 0.05, '#2b2b30', { roughness: 0.6 })
  oculos.add(armacao)
  const lente = rbox(0.32, 0.105, 0.03, 0.045, '#3f6f9e', { roughness: 0.12, metalness: 0.5 })
  lente.position.z = 0.022
  oculos.add(lente)
  head.add(oculos)

  // boca escancarada (berrando pro céu) e sobrancelhas aflitas
  const bocaFundo = sphere(0.06, '#3a1f1c', { roughness: 0.7 })
  bocaFundo.position.set(0, -0.165, 0.24)
  bocaFundo.scale.set(1, 0.85, 0.6)
  head.add(bocaFundo)
  const labio = torus(0.062, 0.022, '#b9725f', { roughness: 0.6 })
  labio.position.set(0, -0.165, 0.262)
  labio.rotation.y = 0.0
  labio.scale.y = 0.85
  head.add(labio)
  for (const side of [-1, 1]) {
    const sobrancelha = rbox(0.11, 0.028, 0.03, 0.012, '#5a3d2a', { roughness: 0.8 })
    sobrancelha.position.set(side * 0.115, 0.115, 0.262)
    sobrancelha.rotation.set(-0.2, side * 0.25, side * -0.32)
    head.add(sobrancelha)
  }

  // ---- o NARIGÃO besuntado de protetor (peça própria, filha da cabeça) ------
  const nariz = new THREE.Group()
  nariz.position.set(0, -0.04, 0.22)
  head.add(nariz)

  const NOSE_ROT = Math.PI / 2 + 0.2 // aponta pra frente, com a ponta caída
  const NOSE: [number, number][] = [
    [0.062, -0.02], [0.082, 0.06], [0.074, 0.2], [0.07, 0.33],
    [0.09, 0.42], [0.086, 0.49], [0.05, 0.54], [0, 0.55],
  ]
  const noseR = (y: number) => {
    for (let i = 1; i < NOSE.length; i++) {
      const [r1, y1] = NOSE[i]
      const [r0, y0] = NOSE[i - 1]
      if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
    }
    return 0
  }
  // nariz vermelhinho de sol: o protetor branco contrasta com ele
  const narigao = lathe(NOSE, NARIZ_PELE, { roughness: 0.55 })
  narigao.rotation.x = NOSE_ROT
  nariz.add(narigao)

  // protetor: faixa grossa de creme na cana do nariz (meia casca torneada
  // virada pra cima, que no torneado é -z) + a ponta inteira lambuzada
  const faixaProf = [0.1, 0.16, 0.24, 0.32, 0.38, 0.43].map(
    (y) => new THREE.Vector2(noseR(y) + 0.017, y),
  )
  faixaProf.unshift(new THREE.Vector2(noseR(0.08) - 0.01, 0.08))
  const faixa = meshOf(
    new THREE.LatheGeometry(faixaProf, 24, Math.PI - 1.15, 2.3),
    CREME,
    { roughness: 0.35 },
  )
  narigao.add(faixa)
  const pontaCreme = lathe(
    [[noseR(0.39) - 0.005, 0.39], [0.104, 0.43], [0.102, 0.49], [0.066, 0.548], [0, 0.566]],
    CREME,
    { roughness: 0.35 },
  )
  narigao.add(pontaCreme)
  // pingos: pendurados embaixo da ponta (+z do torneado = pra baixo no mundo)
  // e escorrendo pelos lados do nariz
  for (const [dy, dx, len] of [[0.45, -0.03, 0.1], [0.52, 0.026, 0.065]] as const) {
    const pingo = capsule(0.022, len, CREME, { roughness: 0.35 })
    pingo.position.set(dx, dy, 0.09 + len / 2)
    pingo.rotation.x = Math.PI / 2
    narigao.add(pingo)
  }
  for (const [dy, side] of [[0.2, 1], [0.3, -1], [0.36, 1]] as const) {
    const lado = capsule(0.018, 0.07, CREME, { roughness: 0.35 })
    lado.position.set(side * (noseR(dy) + 0.004), dy, 0.0)
    lado.rotation.x = Math.PI / 2
    narigao.add(lado)
  }

  // dois fios de creme escorrendo pelas bochechas, ao lado da raiz do nariz
  // (coordenadas da cabeça, compensadas pela posição do grupo do nariz)
  for (const side of [-1, 1]) {
    const pts = [
      [0.19, -0.09, 0.98], [0.25, -0.2, 0.95], [0.29, -0.31, 0.91],
    ].map(([x, y, z]) => new THREE.Vector3(side * x, y, z).normalize().multiplyScalar(0.305).sub(nariz.position))
    const fioCreme = meshOf(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.02, 10, false),
      CREME,
      { roughness: 0.35 },
    )
    nariz.add(fioCreme)
    const gotaCreme = sphere(0.03, CREME, { roughness: 0.35 })
    gotaCreme.position.copy(pts[pts.length - 1])
    gotaCreme.scale.y = 1.25
    nariz.add(gotaCreme)
  }
  // marcador: topo da bolota da ponta (onde cai a primeira gota)
  const pontaNariz = new THREE.Object3D()
  pontaNariz.position.set(0, 0.46, -0.112)
  narigao.add(pontaNariz)

  // ---- braços: o direito (lado da câmera) joga a moeda por baixo ------------
  const braco = alpinista.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(braco, H)
  const BRACO_X = -1.0
  const BRACO_Z = -0.3
  braco.rotation.set(BRACO_X, 0, BRACO_Z)

  const bracoEsq = alpinista.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoEsq, H)
  bracoEsq.rotation.set(0.15, 0, -0.16)

  root.add(alpinista)

  // ---- teto de nuvens cinza-chumbo -----------------------------------------
  const NUVEM_Y = 3.85
  const nuvens = new THREE.Group()
  nuvens.position.y = NUVEM_Y
  const laje = sphere(1, NUVEM_ESC, { roughness: 0.95 })
  laje.scale.set(2.6, 0.24, 0.8)
  laje.position.set(0, 0.05, -0.35)
  nuvens.add(laje)
  for (let i = 0; i < 9; i++) {
    const x = -2.3 + i * 0.575 + (rand() - 0.5) * 0.15
    const tufo = puff(0.4 + rand() * 0.14, i % 2 ? NUVEM : '#5e6672', 6, 70 + i, { roughness: 0.95 })
    tufo.position.set(x, 0.12 + rand() * 0.1, -0.4 + (rand() - 0.5) * 0.4)
    tufo.scale.set(1.25, 0.66, 1)
    nuvens.add(tufo)
  }
  // barriga de baixo cheia de calombos: é ela que aparece no quadro
  for (let i = 0; i < 11; i++) {
    const x = -2.25 + i * 0.45 + (rand() - 0.5) * 0.12
    const calombo = puff(0.26 + rand() * 0.08, NUVEM_ESC, 4, 90 + i, { roughness: 0.95 })
    calombo.position.set(x, -0.2 - rand() * 0.07, -0.15 + (rand() - 0.5) * 0.35)
    calombo.scale.set(1.2, 0.72, 1)
    nuvens.add(calombo)
  }
  root.add(nuvens)

  // ---- posições de mundo da pose final (para gota, moeda e chuva) -----------
  root.updateMatrixWorld(true)
  const NARIZ_TOPO = pontaNariz.getWorldPosition(new THREE.Vector3())
  const MAO = braco.children[0].getWorldPosition(new THREE.Vector3())
  const BOCA_CAIXA = new THREE.Vector3(0, 0.55, 0)
  caixa.localToWorld(BOCA_CAIXA)
  const MOEDA = BOCA_CAIXA.clone().lerp(MAO, 0.18)
  MOEDA.y = BOCA_CAIXA.y + 0.3

  // ---- a primeira gota, pousada na ponta do nariz --------------------------
  const gota = new THREE.Group()
  gota.position.copy(NARIZ_TOPO)
  const bojo = sphere(0.06, CHUVA, { roughness: 0.1 })
  bojo.position.y = 0.03
  bojo.scale.y = 0.85
  gota.add(bojo)
  const bico3 = cone(0.05, 0.09, CHUVA, { roughness: 0.1 })
  bico3.position.y = 0.1
  gota.add(bico3)
  root.add(gota)

  // ---- a moedinha furada de iene, no ar ------------------------------------
  const moeda = new THREE.Group()
  moeda.position.copy(MOEDA)
  moeda.rotation.set(0.2, 0.3, 0)
  const disco = lathe(
    [[0.058, -0.018], [0.15, -0.018], [0.162, 0], [0.15, 0.018], [0.058, 0.018], [0.052, 0], [0.058, -0.018]],
    PRATA,
    { roughness: 0.18, metalness: 0.9 },
    48,
  )
  disco.rotation.x = Math.PI / 2
  moeda.add(disco)
  for (const sz of [-1, 1]) {
    const relevo = torus(0.122, 0.01, PRATA, { roughness: 0.18, metalness: 0.9 })
    relevo.position.z = sz * 0.018
    moeda.add(relevo)
  }
  root.add(moeda)

  // rastro do arremesso: pontinhos prateados no arco entre a mão e a moeda
  // (peça própria, ancorada na moeda: brota depois que ela para no ar)
  const rastro = new THREE.Group()
  rastro.position.copy(MOEDA)
  const rastroDir = MAO.clone().sub(MOEDA)
  for (let k = 1; k <= 4; k++) {
    const p = rastroDir.clone().multiplyScalar(k * 0.17)
    p.y += Math.sin(k * 0.17 * Math.PI) * 0.12 // arco: a moeda subiu e está caindo
    const ponto = sphere(0.034 - k * 0.005, PRATA, { roughness: 0.25, metalness: 0.7 })
    ponto.position.copy(p)
    rastro.add(ponto)
  }
  root.add(rastro)

  // ---- chuva: gotas alongadas entre a nuvem e o merengue --------------------
  const chuva = new THREE.Group()
  const evitar = [alpinista, torii, caixa, picareta].map((o) =>
    new THREE.Box3().setFromObject(o).expandByScalar(0.1),
  )
  // nada de gota na frente da moeda nem do rosto (do ponto de vista da câmera)
  evitar.push(new THREE.Box3(MOEDA.clone().addScalar(-0.28), MOEDA.clone().add(new THREE.Vector3(0.28, 0.28, 3))))
  const rosto = head.getWorldPosition(new THREE.Vector3())
  evitar.push(new THREE.Box3(rosto.clone().add(new THREE.Vector3(-0.75, -0.4, 0)), rosto.clone().add(new THREE.Vector3(0.45, 0.6, 3))))
  const chuvaRand = rng(77)
  const tmp = new THREE.Vector3()
  let n = 0
  for (let tries = 0; tries < 800 && n < 50; tries++) {
    tmp.set(
      -2.4 + chuvaRand() * 4.8,
      MS + 0.5 + chuvaRand() * (NUVEM_Y - MS - 0.85),
      -1.2 + chuvaRand() * 2.1,
    )
    if (Math.hypot(tmp.x, tmp.z) > 2.3) continue
    if (evitar.some((b) => b.containsPoint(tmp))) continue
    const pingo = capsule(0.02, 0.1 + chuvaRand() * 0.06, CHUVA, { roughness: 0.15 })
    pingo.position.copy(tmp)
    chuva.add(pingo)
    n++
  }
  root.add(chuva)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'montanha', group: 'fuji', object: montanha },
    { name: 'merengue', group: 'fuji', object: merengue },
    { name: 'alpinista', group: 'alpinista', object: alpinista },
    { name: 'braco', group: 'alpinista', object: braco },
    { name: 'picareta', group: 'alpinista', object: picareta },
    { name: 'nariz', group: 'nariz', object: nariz },
    { name: 'nuvens', group: 'plic', object: nuvens },
    { name: 'gota', group: 'plic', object: gota },
    { name: 'torii', group: 'iene', object: torii },
    { name: 'caixa', group: 'iene', object: caixa },
    { name: 'moeda', group: 'iene', object: moeda },
    { name: 'rastro', group: 'iene', object: rastro },
    { name: 'chuva', group: 'chuva', object: chuva },
    { name: 'fios', group: 'chuva', object: fios },
  ]

  // ---- montagem ------------------------------------------------------------
  const GOTA_ALTO = NUVEM_Y - 0.35
  const build = [
    seq('montanha-sobe', 'montanha', 0, 0.9, [riseFrom(0, 1.4)], {
      ease: 'easeOut',
      caption: 'Pela terceira vez no mês, o alpinista chega ao cume do Monte Fuji…',
    }),
    seq('merengue-cresce', 'merengue', 1.1, 0.9, [
      ch('scale.y', 0.05, 1), ch('scale.x', 0.9, 1), ch('scale.z', 0.9, 1),
    ], {
      ease: 'easeOut',
      caption: '…e lá em cima a neve é MERENGUE: picos de suspiro — (me)RÉNG(ue)!',
    }),

    seq('alpinista-sobe', 'alpinista', 2.6, 0.8, [riseFrom(ALP_Y, 1.9)], {
      ease: 'easeOut',
      caption: 'Contando com sol, ele besuntou o NARIZ de protetor branco — NAR(iz)!',
    }),
    seq('braco-solto', 'braco', 2.6, 0.8, [ch('rotation.x', 0.3, 0.05), ch('rotation.z', -0.1, 0.22)], {
      ease: 'easeOut',
    }),
    seq('picareta-finca', 'picareta', 2.9, 0.5, [
      ch('position.y', MS + 1.1, MS - 0.02), ch('rotation.z', -0.9, -0.3),
    ], { ease: 'easeIn' }),
    seq('nariz-cresce', 'nariz', 3.4, 0.7, [
      ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),

    seq('nuvens-fecham', 'nuvens', 4.7, 1.0, [
      ch('position.y', NUVEM_Y + 1.4, NUVEM_Y), ch('scale.x', 0.4, 1),
    ], {
      ease: 'easeOut',
      caption: 'Mas o céu fecha… e PLIC! A primeira gota cai bem na ponta do NARIZ.',
    }),
    seq('gota-cai', 'gota', 5.8, 0.55, [ch('position.y', GOTA_ALTO, NARIZ_TOPO.y)], { ease: 'easeIn' }),
    seq('gota-esmaga', 'gota', 6.35, 0.15, [ch('scale.y', 1, 0.7), ch('scale.x', 1, 1.25), ch('scale.z', 1, 1.25)]),
    seq('gota-assenta', 'gota', 6.5, 0.3, [ch('scale.y', 0.7, 1), ch('scale.x', 1.25, 1), ch('scale.z', 1.25, 1)]),

    seq('torii-sobe', 'torii', 7.0, 0.8, [riseFrom(TORII_Y, 2.0)], {
      ease: 'easeOut',
      caption: 'Desesperado, ele joga na caixa do santuário uma moedinha furada de IENE — I-IÉN(e)!',
    }),
    seq('caixa-sobe', 'caixa', 7.2, 0.7, [riseFrom(CAIXA_Y, 1.0)], { ease: 'easeOut' }),
    seq('braco-arma', 'braco', 7.7, 0.4, [ch('rotation.x', 0.05, 0.75), ch('rotation.z', 0.22, 0.3)], {
      ease: 'easeInOut',
    }),
    seq('braco-joga', 'braco', 8.1, 0.35, [ch('rotation.x', 0.75, BRACO_X), ch('rotation.z', 0.3, BRACO_Z)], {
      ease: 'easeOut',
    }),
    seq('moeda-voa', 'moeda', 8.3, 0.6, [
      ch('position.x', MAO.x, MOEDA.x), ch('position.y', MAO.y, MOEDA.y), ch('position.z', MAO.z, MOEDA.z),
      ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
      ch('rotation.y', -5.98, 0.3),
    ], { ease: 'easeOut' }),
    seq('rastro-surge', 'rastro', 8.75, 0.3, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('chuva-desaba', 'chuva', 9.3, 0.9, [ch('position.y', 1.6, 0), ch('scale.y', 1.4, 1)], {
      ease: 'easeIn',
      caption: 'O céu desaba, o merengue escorre encosta abaixo e ele berra: DÊ… RÉNG-NAR… I-IÉN?!',
    }),
    seq('fios-escorrem', 'fios', 9.7, 1.3, [
      ch('scale.x', 0.8, 1), ch('scale.y', 0.8, 1), ch('scale.z', 0.8, 1),
    ], { ease: 'easeInOut' }),

    seq('alpinista-encolhe', 'alpinista', 11.2, 0.35, [ch('scale.y', ESCALA, ESCALA * 0.96)], {
      caption: 'Det regnar igen. — Está chovendo de novo.',
    }),
    seq('alpinista-volta', 'alpinista', 11.55, 0.4, [ch('scale.y', ESCALA * 0.96, ESCALA)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.7, 4.75], target: [-0.06, 2.08, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-regnar-igen',
    contexto:
      "Small talk: o comentário-padrão olhando pela janela de manhã, no ponto de ônibus ou na fika do trabalho — principalmente no outono, quando chove dia sim, dia também. Costuma vir com um suspiro e um 'Typiskt!' (típico!).",
    fraseFonte:
      "Está chovendo de novo.",
    fraseAlvo:
      "Det regnar igen.",
    pronuncia:
      "dê RÉNG-nar i-IÉN ('det' = dê, o T não soa; 'regnar' com a força no RÉNG: R de UM toque só, o de 'caro' — nunca o RR de garganta, que em sueco soa como h —, É aberto e CURTO, e o 'gn' sai NG + N: a língua fecha no fundo da boca como no inglês 'sing', o G não estala e solta direto no N, sem vogal no meio (nada de 'ré-gui-nar'); o -ar fraquinho, com R brando, que já emenda no 'igen': réng-na-ri-IÉN; 'igen' com o G soando I — i-IÉN —, a força no IÉN, É aberto e curto e N batido na língua, sem nasalizar)",
    ponteSonora:
      "DÊ... (me)RÉNG(ue)-NAR(iz)... I-IÉN(e)! (5 sílabas: dê-RÉNG-nar-i-IÉN; força no RÉNG e no IÉN; DÊ = o 'det' de sempre, de 'Det beror på' e 'Det är lugnt': Ê FECHADO e sem T — e COLADO no RÉNG, dê-RÉNG num fôlego só, pra o R cair entre vogais e sair BRANDO, um toque só de língua, como em 'caro': depois de pausa o brasileiro solta o RR de garganta, que em sueco soa como h; RÉNG = o MERENGUE sem o ME- e sem o -UE: o R é o mesmo toque de língua de 'meRENgue'; o E abre no É de 'pé' e fica CURTO (o português fecha e anasala, 'merẽgue'); e o G NÃO estala: a língua sobe no fundo da boca e fica ali, o NG de 'sing', o mesmo do STÉNG de 'När stänger ni?' e do LÓNG de 'Hur långt är det?' — nada de 'RÉN-gui'; esse NG é obrigatório: sem ele sobra 'renar', que é 'limpa' (e também 'renas', os bichos); NAR = o NAR(iz) dos verbos, o MESMO de SÁC-NAR(iz) em 'Jag saknar dig' e MÊU-NAR(iz) em 'Jag förstår vad du menar': sai DIRETO do NG, sem vogal no meio (RÉNG-nar, nunca 'ré-gui-nar'), fraquinho, com o R de um toque só — e esse R TEM que soar, porque sem ele sobra 'regna', o infinitivo; ele já escorrega pro I seguinte: réng-na-ri-IÉN; I-IÉN = o IENE, a moeda do Japão, que o português já fala com a força no lugar certo: i-Ê-ne — é exatamente o 'igen', em que o G vira esse I deslizado (nunca 'i-GUÉN', nunca o J chiado de 'i-JÊN'); só corte o -e final, fechando no N com a ponta da língua atrás dos dentes, e abra o Ê no É de 'pé', sem nasalizar: i-IÉN)",
    historia:
      "Pela terceira vez no mês, o alpinista chega ao cume do Monte Fuji, e lá em cima a neve é MERENGUE: picos branquinhos de suspiro, crocantes por fora. Contando com sol, ele tinha besuntado o NARIZ de protetor solar branco — e plic: a primeira gota cai bem na ponta do NARIZ, e o creme começa a escorrer pela cara. Desesperado, ele corre até o portãozinho vermelho do santuário e joga na caixa de oferendas uma moedinha furada de IENE, pedindo sol — mas o céu desaba, o merengue amolece e escorre encosta abaixo em fios brancos, levando o alpinista junto, escorregando de bunda. Lá embaixo, ensopado, ele berra pro céu: DÊ... RÉNG-NAR... I-IÉN?! Está chovendo de novo.",
  },
  createScene,
  refine: { organic: ['nuvens'] },
}

export default card
