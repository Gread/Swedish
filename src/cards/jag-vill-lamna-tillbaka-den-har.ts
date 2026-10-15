import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag vill lämna tillbaka den här." — IÁ, VIL! LÉM(e)-NA TIL-BÁ(r)CA... DEN RRÉR!
 *
 * O dente de ouro encomendado é VIL: mordeu o dedo do carteiro. Ele pula na
 * TIL-BARCA do correio fluvial — barca de madeira, sem vela, torta feito um
 * til (~) —, agarra o LEME e a barca dá meia-volta rumo à loja do outro lado
 * do rio, enquanto da bolsa o dente ainda rosna: DEN… RRÉR.
 *
 * Diorama: disco de rio verde-azulado; cais de pedra e tábuas ao fundo com a
 * lojinha de toldo listrado (placa com um dente: foi ali que ele foi
 * comprado); a barca de través, popa à esquerda com o leme, proa à direita
 * apontando a loja; a borda da barca desenha o til, e um friso creme pintado
 * repete a onda. Acento saturado RESERVADO: o ouro do dente.
 */

const RIO = '#2f7c76'          // matiz 1: o rio verde-azulado
const RIO_FUNDO = '#1b4a47'
const RIO_CLARO = '#6aaea4'
const ESPUMA = '#e2f1ec'
const VERDE = '#5f8a3e'
const VERDE_ESC = '#456b2c'
const PEDRA = '#8f8b83'
const PEDRA_ESC = '#6d6962'
const TABUA = '#a98159'
const TABUA_ESC = '#7a5737'
const POSTE = '#5a4130'
const PAREDE = '#bfd3d6'
const TRIM = '#f1ede4'
const TELHADO = '#46505b'
const TOLDO = '#c4473c'
const TOLDO_CLARO = '#f3ede1'
const PORTA = '#2f5d62'
const VIDRO = '#2c3b45'
const LATAO = '#c9a24e'
const MADEIRA = '#8b5a32'      // matiz 2: a barca de madeira
const MADEIRA_ESC = '#5d3a1e'
const MADEIRA_CLARA = '#b37d48'
const FRISO = '#efe2c4'        // o til pintado no costado
const FERRO = '#3a3b3e'
const PELE = '#e8c39e'
const CAMISA = '#f1d272'       // matiz 3: o carteiro (amarelo manteiga, fosco)
const AZUL = '#2b5591'
const AZUL_ESC = '#1d3b66'
const PRETO = '#1f1c1a'
const BIGODE = '#5a3a24'
const SAPATO = '#2e241d'
const COURO = '#6b3a22'
const COURO_ESC = '#4a2714'
const COSTURA = '#e6d3ad'
const ATADURA = '#f7f5ef'
const PAPELAO = '#bf8f5a'
const BARBANTE = '#e7d6ac'
const CINZA = '#a3abb0'
const OURO = '#ffc22a'         // acento: o dente
const BOCA = '#3a1b11'

// ---- medidas ---------------------------------------------------------------
const R = 2.6                  // raio do disco
const W = 0.16                 // superfície da água
const ZQ = 1.35                // frente do cais (z = -ZQ)
const QY = 0.44                // topo das pedras do cais
const LOJA_Y = QY + 0.05

const L = 3.7                  // comprimento da barca
const H0 = 0.66                // altura média da borda (espaço da barca)
const A = 0.3                  // amplitude do til
const WL = 0.25                // linha d'água no espaço da barca
const TH = 0.045               // espessura do costado
const NSE = 5                  // superelipse da seção: fundo chato, costado reto
const DECK = 0.7               // convés elevado da popa
const BX = -0.05
const BZ = 0.2
const BY = W - WL
const YAW = 0.25               // proa apontando a loja (fundo à direita)
const YAW0 = -0.6              // antes da meia-volta: proa para a frente

const XC = -0.78               // carteiro logo depois da corcova do til
const CS = 1.15                // escala do carteiro
const CYAW = 0.15
const QH = 0.15                // quepe na cabeça
const ARM_UP = 2.95
const ARM_FWD = 0.2
const DS = 1.12                // escala do dente
const DY = 0.72                // dente na bolsa: raízes à mostra
const DZ = 0.22                // inclinação do dente (topo para fora, à esquerda)
const DYAW = 0.26               // compensa barca+carteiro+bolsa: cara para a câmera

const CAM: [number, number, number] = [-0.5, 2.0, 5.25]

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function shadedMesh(geo: THREE.BufferGeometry, material: THREE.Material) {
  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cápsula ligando dois pontos. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const len = a.distanceTo(b)
  const m = capsule(r, Math.max(0.001, len), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize())
  return m
}

/** Tubo por uma curva, afinando de r0 a r1. */
function tube(points: THREE.Vector3[], r0: number, r1: number, color: string, opts = {}, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal')
  const seg = Math.max(24, points.length * 6)
  const rad = 10
  const g = new THREE.TubeGeometry(curve, seg, 1, rad, closed)
  const pos = g.attributes.position
  const P = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= seg; i++) {
    curve.getPointAt(i / seg, P)
    const r = r0 + (r1 - r0) * (i / seg)
    for (let j = 0; j <= rad; j++) {
      const n = i * (rad + 1) + j
      v.fromBufferAttribute(pos, n).sub(P).multiplyScalar(r).add(P)
      pos.setXYZ(n, v.x, v.y, v.z)
    }
  }
  g.computeVertexNormals()
  return shadedMesh(g, mat(color, { roughness: 0.6, size: 0.4, ...opts }))
}

// ---- casco: seções em U ao longo de x, borda desenhando um til -------------
const xOf = (t: number) => -L / 2 + t * L
const halfTop = (t: number) => {
  if (t < 0.25) return 0.5 * (0.8 + 0.2 * Math.sin((t / 0.25) * (Math.PI / 2)))
  if (t < 0.55) return 0.5
  const u = (t - 0.55) / 0.45
  return Math.max(0.07, 0.5 * Math.pow(Math.max(0, 1 - u * u), 0.55))
}
const halfBot = (t: number) => halfTop(t) * 0.74
/** A borda é o til: sobe na popa, desce na proa e a ponta da proa volta a subir. */
const sheer = (t: number) =>
  H0 + A * Math.sin(2 * Math.PI * t) + 0.2 * Math.pow(Math.max(0, (t - 0.86) / 0.14), 2)
const keel = (t: number) =>
  0.16 * Math.pow(Math.max(0, (t - 0.8) / 0.2), 2) + 0.06 * Math.pow(Math.max(0, (0.1 - t) / 0.1), 2)

/** Ponto (z, y) da seção t; phi de -π/2 (bombordo, borda) passando pelo fundo até π/2. */
function hullPoint(t: number, phi: number, inset = 0): [number, number] {
  const s = Math.sin(phi)
  const c = Math.cos(phi)
  const z0 = Math.sign(s) * Math.pow(Math.abs(s), 2 / NSE)
  const y0 = -Math.pow(Math.abs(c), 2 / NSE)
  const top = sheer(t)
  const bot = keel(t) + inset
  const hw = halfBot(t) + (halfTop(t) - halfBot(t)) * (1 + y0) - inset
  return [z0 * hw, top + y0 * (top - bot)]
}

/** Meia-largura da superfície (externa: inset 0; interna: TH) na altura y. */
function sectionZ(t: number, y: number, inset = 0) {
  const top = sheer(t)
  const bot = keel(t) + inset
  const y0 = Math.max(-1, Math.min(0, (y - top) / (top - bot)))
  const z0 = Math.pow(Math.max(0, 1 - Math.pow(-y0, NSE)), 1 / NSE)
  return z0 * (halfBot(t) + (halfTop(t) - halfBot(t)) * (1 + y0) - inset)
}

function hullShell() {
  const NS = 72
  const NC = 24
  const ring = 2 * (NC + 1)
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= NS; i++) {
    const t = i / NS
    const x = xOf(t)
    for (let j = 0; j <= NC; j++) {
      const [z, y] = hullPoint(t, -Math.PI / 2 + (Math.PI * j) / NC)
      pos.push(x, y, z)
      uv.push(t * 3, j / ring)
    }
    for (let j = 0; j <= NC; j++) {
      const [z, y] = hullPoint(t, Math.PI / 2 - (Math.PI * j) / NC, TH)
      pos.push(x, y, z)
      uv.push(t * 3, (NC + 1 + j) / ring)
    }
  }
  for (let i = 0; i < NS; i++) {
    for (let k = 0; k < ring; k++) {
      const a = i * ring + k
      const b = a + ring
      const a1 = i * ring + ((k + 1) % ring)
      const b1 = a1 + ring
      idx.push(a, b, a1, b, b1, a1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Placa que fecha a seção t abaixo de yTop (espelho de popa, proa, antepara). */
function sectionSlab(t: number, yTop: number, inset: number, depth: number) {
  const bot = keel(t) + inset
  const n = 14
  const s = new THREE.Shape()
  const ys: number[] = []
  for (let i = 0; i <= n; i++) ys.push(yTop - ((yTop - bot) * i) / n)
  ys.forEach((y, i) => {
    const z = -sectionZ(t, y, inset)
    if (i === 0) s.moveTo(z, y)
    else s.lineTo(z, y)
  })
  for (let i = n; i >= 0; i--) s.lineTo(sectionZ(t, ys[i], inset), ys[i])
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
  g.rotateY(Math.PI / 2) // (z, y, e) -> (e, y, -z)
  return g
}

/** Curva ao longo do costado (side = ±1), na altura y(t), afastada `off` da superfície. */
function alongSide(side: number, y: (t: number) => number, off: number, t0 = 0.004, t1 = 0.996, n = 48) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n
    const yy = y(t)
    pts.push(V(xOf(t), yy, side * (sectionZ(t, yy) + off)))
  }
  return pts
}

/** Letra-ícone: dente creme de placa (coroa + duas raízes). */
function toothIcon(color: string) {
  const g = new THREE.Group()
  const coroa = rbox(0.17, 0.11, 0.03, 0.045, color, { roughness: 0.5 })
  coroa.position.y = 0.03
  g.add(coroa)
  for (const s of [-1, 1]) {
    const cuspide = sphere(0.045, color, { roughness: 0.5 })
    cuspide.scale.z = 0.35
    cuspide.position.set(s * 0.042, 0.08, 0)
    g.add(cuspide)
    const raiz = cone(0.035, 0.11, color, { roughness: 0.5 })
    raiz.rotation.z = Math.PI + s * 0.22
    raiz.position.set(s * 0.045, -0.06, 0)
    raiz.scale.z = 0.45
    g.add(raiz)
  }
  return g
}

/** O dente de ouro: molar de duas raízes, cara de poucos amigos. Origem no centro da coroa. */
function makeDente() {
  const g = new THREE.Group()
  const ouro = { roughness: 0.22, metalness: 0.5 }

  const nucleo = rbox(0.5, 0.28, 0.38, 0.12, OURO, ouro)
  g.add(nucleo)
  const bojo = sphere(0.25, OURO, ouro)
  bojo.scale.set(1, 0.6, 0.78)
  g.add(bojo)
  // cúspides: as da frente maiores — de frente o dente mostra os dois calombos clássicos
  for (const sx of [-1, 1]) {
    for (const [sz, r] of [[0.06, 0.115], [-0.08, 0.1]] as const) {
      const cuspide = sphere(r, OURO, ouro)
      cuspide.position.set(sx * 0.13, 0.11, sz)
      cuspide.scale.y = 0.85
      g.add(cuspide)
    }
  }
  const colo = rbox(0.36, 0.14, 0.3, 0.06, OURO, ouro)
  colo.position.y = -0.16
  g.add(colo)
  for (const s of [-1, 1]) {
    const raiz = lathe(
      [[0, -0.4], [0.034, -0.39], [0.06, -0.32], [0.08, -0.2], [0.094, -0.07], [0.1, 0.03], [0, 0.03]],
      OURO,
      ouro,
      24,
    )
    raiz.position.set(s * 0.1, -0.19, 0)
    raiz.rotation.z = s * 0.2
    raiz.scale.z = 0.85
    g.add(raiz)
  }

  // cara: olhos, sobrancelhas bravas, boca rosnando com caninos
  for (const s of [-1, 1]) {
    const olho = sphere(0.058, '#ffffff', { roughness: 0.25 })
    olho.scale.z = 0.55
    olho.position.set(s * 0.095, 0.035, 0.19)
    g.add(olho)
    const pupila = sphere(0.03, '#141414', { roughness: 0.2 })
    pupila.position.set(s * 0.09 - 0.01, 0.028, 0.215)
    g.add(pupila)
    const brilho = sphere(0.01, '#ffffff', { roughness: 0.1 })
    brilho.position.set(s * 0.09 - 0.002, 0.04, 0.24)
    g.add(brilho)
    const sobr = capsule(0.023, 0.1, PRETO, { roughness: 0.6 })
    sobr.position.set(s * 0.1, 0.118, 0.2)
    sobr.rotation.set(-0.3, 0, -s * (Math.PI / 2 - 0.45))
    g.add(sobr)
  }
  const boca = rbox(0.2, 0.068, 0.05, 0.03, BOCA, { roughness: 0.7 })
  boca.position.set(0, -0.08, 0.178)
  g.add(boca)
  for (const s of [-1, 1]) {
    const canino = cone(0.016, 0.04, TRIM, { roughness: 0.35 })
    canino.rotation.x = Math.PI
    canino.position.set(s * 0.06, -0.06, 0.205)
    g.add(canino)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: o rio -----------------------------------------------------------
  const base = new THREE.Group()
  const leito = cylinder(2.66, 2.76, 0.1, RIO_FUNDO, { roughness: 0.8 })
  leito.position.y = 0.05
  base.add(leito)
  const agua = cylinder(R, 2.64, 0.07, RIO, { roughness: 0.14 })
  agua.position.y = W - 0.035
  base.add(agua)

  for (const [ox, oz, r] of [[0.3, 1.8, 0.22], [2.1, -0.95, 0.15], [-0.45, 2.15, 0.13], [-2.05, -0.9, 0.16]] as const) {
    for (const k of [1, 1.7]) {
      const onda = torus(r * k, 0.011, RIO_CLARO, { roughness: 0.2 })
      onda.rotation.x = Math.PI / 2
      onda.position.set(ox + (rand() - 0.5) * 0.05, W + 0.002, oz)
      base.add(onda)
    }
  }

  // vitórias-régias (näckrosor) e uma flor branca na frente à esquerda
  for (const [lx, lz, lr, rot] of [[-1.35, 1.7, 0.2, 0.4], [-0.95, 2.1, 0.15, 2.2], [-1.75, 1.3, 0.13, 4.1]] as const) {
    const folha = shadedMesh(
      new THREE.CylinderGeometry(lr, lr, 0.016, 28, 1, false, 0.35, Math.PI * 2 - 0.7),
      mat(VERDE, { roughness: 0.5 }),
    )
    folha.position.set(lx, W + 0.008, lz)
    folha.rotation.y = rot
    base.add(folha)
  }
  const flor = new THREE.Group()
  flor.position.set(-1.3, W + 0.02, 1.68)
  for (let k = 0; k < 6; k++) {
    const petala = sphere(0.045, '#f6f1ea', { roughness: 0.5 })
    petala.scale.set(0.5, 0.35, 1)
    const a = (k / 6) * Math.PI * 2
    petala.position.set(Math.sin(a) * 0.045, 0.02, Math.cos(a) * 0.045)
    petala.rotation.set(0.5, a, 0)
    flor.add(petala)
  }
  const miolo = sphere(0.025, '#e8c25a', { roughness: 0.6 })
  miolo.position.y = 0.035
  flor.add(miolo)
  base.add(flor)

  // juncos na margem direita
  const juncos = new THREE.Group()
  juncos.position.set(2.28, W, 0.1)
  for (let k = 0; k < 7; k++) {
    const h = 0.4 + rand() * 0.35
    const hx = (rand() - 0.5) * 0.3
    const hz = (rand() - 0.5) * 0.25
    const haste = cylinder(0.012, 0.018, h, VERDE_ESC, { roughness: 0.7 })
    haste.position.set(hx, h / 2, hz)
    haste.rotation.z = (rand() - 0.5) * 0.25
    juncos.add(haste)
    if (k % 2 === 0) {
      const taboa = capsule(0.028, 0.09, '#6b4a2c', { roughness: 0.9 })
      taboa.position.set(hx + haste.rotation.z * -h * 0.5, h - 0.02, hz)
      juncos.add(taboa)
    }
  }
  base.add(juncos)
  root.add(base)

  // ---- cais de pedra com deck de tábuas --------------------------------------
  const cais = new THREE.Group()
  const segmento = (front: number, radius: number) => {
    const a0 = Math.asin(front / radius)
    const s = new THREE.Shape()
    s.moveTo(radius * Math.cos(a0), front)
    s.absarc(0, 0, radius, a0, Math.PI - a0, false)
    s.lineTo(radius * Math.cos(a0), front)
    return s
  }
  const pedraGeo = new THREE.ExtrudeGeometry(segmento(ZQ, R), { depth: QY - 0.08, bevelEnabled: false, curveSegments: 48 })
  pedraGeo.rotateX(-Math.PI / 2)
  const muro = shadedMesh(pedraGeo, mat(PEDRA, { roughness: 0.9, size: 1 }))
  muro.position.y = 0.08
  cais.add(muro)

  const deckGeo = new THREE.ExtrudeGeometry(segmento(ZQ - 0.05, R - 0.02), { depth: 0.05, bevelEnabled: false, curveSegments: 48 })
  deckGeo.rotateX(-Math.PI / 2)
  const deckCais = shadedMesh(deckGeo, mat(TABUA, { roughness: 0.85, size: 1 }))
  deckCais.position.y = QY
  cais.add(deckCais)
  const chord = (z: number, r = R) => Math.sqrt(Math.max(0, r * r - z * z))
  for (const z of [1.5, 1.68, 1.86, 2.04, 2.22, 2.4]) {
    const len = 2 * chord(z, R - 0.06) - 0.06
    if (len < 0.2) continue
    const fresta = rbox(len, 0.012, 0.022, 0.005, TABUA_ESC, { roughness: 0.9 })
    fresta.position.set(0, QY + 0.052, -z)
    cais.add(fresta)
  }
  // juntas das pedras na face do muro
  const juntaY = (W + QY) / 2 + 0.02
  const face = -ZQ + 0.004
  const juntaH = rbox(2 * chord(ZQ) - 0.08, 0.018, 0.012, 0.005, PEDRA_ESC, { roughness: 0.9 })
  juntaH.position.set(0, juntaY, face)
  cais.add(juntaH)
  for (let x = -2.0; x <= 2.0; x += 0.42) {
    for (const [y0, y1, dx] of [[W, juntaY, 0], [juntaY, QY, 0.21]] as const) {
      const jx = x + dx
      if (Math.abs(jx) > chord(ZQ) - 0.1) continue
      const j = rbox(0.016, y1 - y0, 0.012, 0.005, PEDRA_ESC, { roughness: 0.9 })
      j.position.set(jx, (y0 + y1) / 2, face)
      cais.add(j)
    }
  }
  // estacas de amarração na beira
  for (const px of [-1.75, -0.6, 0.55, 1.7]) {
    const estaca = rbox(0.1, QY + 0.16 - 0.1, 0.1, 0.03, POSTE, { roughness: 0.85 })
    estaca.position.set(px, 0.1 + (QY + 0.16 - 0.1) / 2, -ZQ + 0.03)
    cais.add(estaca)
    const topo = sphere(0.055, POSTE, { roughness: 0.85 })
    topo.scale.y = 0.5
    topo.position.set(px, QY + 0.16, -ZQ + 0.03)
    cais.add(topo)
  }
  // caixote e barril no cais
  const caixote = rbox(0.3, 0.26, 0.3, 0.03, '#7a5634', { roughness: 0.85 })
  caixote.position.set(-0.45, QY + 0.05 + 0.13, -1.72)
  caixote.rotation.y = 0.3
  cais.add(caixote)
  for (const dy of [-0.06, 0.06]) {
    const ripa = rbox(0.31, 0.03, 0.31, 0.01, '#5d4026', { roughness: 0.85 })
    ripa.position.set(0, dy, 0)
    caixote.add(ripa)
  }
  const barril = new THREE.Group()
  barril.position.set(-1.45, QY + 0.05, -1.75)
  barril.add(lathe(
    [[0, 0], [0.16, 0.01], [0.19, 0.1], [0.2, 0.19], [0.185, 0.29], [0.155, 0.36], [0, 0.37]],
    '#6a4528',
    { roughness: 0.8 },
  ))
  for (const hy of [0.08, 0.29]) {
    const aro = torus(0.193, 0.014, FERRO, { roughness: 0.4, metalness: 0.6 })
    aro.rotation.x = Math.PI / 2
    aro.position.y = hy
    barril.add(aro)
  }
  cais.add(barril)
  root.add(cais)

  // ---- a lojinha de toldo listrado --------------------------------------------
  const loja = new THREE.Group()
  loja.position.set(0.95, LOJA_Y, -1.95)
  loja.rotation.y = -0.1
  const SW = 1.2
  const SD = 0.62
  const SH = 0.86
  const plinto = rbox(SW + 0.06, 0.07, SD + 0.06, 0.02, PEDRA_ESC, { roughness: 0.9 })
  plinto.position.y = 0.035
  loja.add(plinto)
  const paredes = rbox(SW, SH, SD, 0.025, PAREDE, { roughness: 0.8 })
  paredes.position.y = 0.07 + SH / 2
  loja.add(paredes)
  for (const s of [-1, 1]) {
    const quina = rbox(0.06, SH, 0.06, 0.015, TRIM, { roughness: 0.6 })
    quina.position.set(s * SW / 2, 0.07 + SH / 2, SD / 2)
    loja.add(quina)
  }
  const TOPO = 0.07 + SH
  const RH = 0.32
  const ang = Math.atan2(RH, SD / 2)
  const slope = Math.hypot(SD / 2, RH)
  for (const s of [-1, 1]) {
    const agua2 = rbox(SW + 0.18, 0.055, slope + 0.12, 0.02, TELHADO, { roughness: 0.75 })
    agua2.position.set(0, TOPO + RH / 2 + 0.03, s * (SD / 4 + 0.03))
    agua2.rotation.x = s * ang
    loja.add(agua2)
  }
  const oitao = new THREE.Shape()
  oitao.moveTo(-SD / 2, 0)
  oitao.lineTo(SD / 2, 0)
  oitao.lineTo(0, RH)
  oitao.closePath()
  for (const s of [-1, 1]) {
    const og = new THREE.ExtrudeGeometry(oitao, { depth: 0.02, bevelEnabled: false })
    og.rotateY(Math.PI / 2)
    const o = shadedMesh(og, mat(PAREDE, { roughness: 0.8 }))
    o.position.set(s * (SW / 2) - 0.01, TOPO, 0)
    loja.add(o)
  }
  // porta
  const porta = rbox(0.28, 0.56, 0.04, 0.02, PORTA, { roughness: 0.6 })
  porta.position.set(-0.36, 0.07 + 0.28, SD / 2 + 0.01)
  loja.add(porta)
  const visor = rbox(0.15, 0.14, 0.012, 0.02, VIDRO, { roughness: 0.15 })
  visor.position.set(-0.36, 0.07 + 0.42, SD / 2 + 0.032)
  loja.add(visor)
  const macaneta = sphere(0.018, LATAO, { roughness: 0.3, metalness: 0.7 })
  macaneta.position.set(-0.27, 0.07 + 0.27, SD / 2 + 0.04)
  loja.add(macaneta)
  for (const [w, h, x, y] of [[0.34, 0.035, -0.36, 0.07 + 0.575], [0.035, 0.6, -0.515, 0.07 + 0.29], [0.035, 0.6, -0.205, 0.07 + 0.29]] as const) {
    const batente = rbox(w, h, 0.03, 0.01, TRIM, { roughness: 0.6 })
    batente.position.set(x, y, SD / 2 + 0.015)
    loja.add(batente)
  }
  // vitrine com um dentinho exposto
  const vitrine = rbox(0.5, 0.34, 0.03, 0.02, VIDRO, { roughness: 0.12 })
  vitrine.position.set(0.18, 0.07 + 0.4, SD / 2 + 0.01)
  loja.add(vitrine)
  for (const [w, h, x, y] of [
    [0.56, 0.035, 0.18, 0.07 + 0.585], [0.56, 0.035, 0.18, 0.07 + 0.215],
    [0.035, 0.38, -0.08, 0.07 + 0.4], [0.035, 0.38, 0.44, 0.07 + 0.4],
  ] as const) {
    const moldura = rbox(w, h, 0.035, 0.01, TRIM, { roughness: 0.6 })
    moldura.position.set(x, y, SD / 2 + 0.02)
    loja.add(moldura)
  }
  const exposto = toothIcon(TRIM)
  exposto.position.set(0.18, 0.07 + 0.38, SD / 2 + 0.03)
  exposto.scale.setScalar(0.9)
  loja.add(exposto)
  // toldo listrado vermelho e branco
  const NT = 8
  const AW = 1.12
  const sw = AW / NT
  const AY = 0.07 + SH - 0.07
  const AD = 0.38
  const AF = 0.15
  const aAng = Math.atan2(AF, AD)
  const aLen = Math.hypot(AD, AF)
  for (let i = 0; i < NT; i++) {
    const cor = i % 2 === 0 ? TOLDO : TOLDO_CLARO
    const x = -AW / 2 + sw * (i + 0.5)
    const lona = rbox(sw + 0.002, 0.02, aLen, 0.006, cor, { roughness: 0.85 })
    lona.position.set(x, AY - AF / 2, SD / 2 + AD / 2)
    lona.rotation.x = aAng
    loja.add(lona)
    const aba = rbox(sw - 0.006, 0.1, 0.016, 0.045, cor, { roughness: 0.85 })
    aba.position.set(x, AY - AF - 0.045, SD / 2 + AD + 0.004)
    loja.add(aba)
  }
  for (const s of [-1, 1]) {
    loja.add(limb(V(s * (AW / 2 - 0.02), AY - 0.25, SD / 2), V(s * (AW / 2 - 0.02), AY - AF - 0.01, SD / 2 + AD - 0.02), 0.008, FERRO))
  }
  // placa com o dente: foi aqui que ele foi comprado
  const placa = new THREE.Group()
  placa.position.set(0, TOPO + 0.17, SD / 2 + 0.02)
  placa.rotation.x = -0.12
  const tabua = rbox(0.48, 0.26, 0.04, 0.04, AZUL_ESC, { roughness: 0.6 })
  placa.add(tabua)
  const icone = toothIcon(TRIM)
  icone.position.z = 0.03
  placa.add(icone)
  loja.add(placa)
  root.add(loja)

  // ---- a TIL-BARCA ------------------------------------------------------------
  const barca = new THREE.Group()
  barca.position.set(BX, BY, BZ)
  barca.rotation.y = YAW
  root.add(barca)

  const madeira = mat(MADEIRA, { roughness: 0.72, size: 1.4 })
  madeira.side = THREE.DoubleSide
  barca.add(shadedMesh(hullShell(), madeira))

  const espelho = shadedMesh(sectionSlab(0, sheer(0), 0, 0.05), mat(MADEIRA, { roughness: 0.72, size: 1 }))
  espelho.position.x = -L / 2 - 0.03
  barca.add(espelho)
  const bico = shadedMesh(sectionSlab(1, sheer(1), 0, 0.05), mat(MADEIRA, { roughness: 0.72, size: 1 }))
  bico.position.x = L / 2 - 0.02
  barca.add(bico)

  // borda: verdugo escuro por fora, alcatrate claro por cima
  for (const side of [-1, 1]) {
    barca.add(tube(alongSide(side, (t) => sheer(t) - 0.03, 0.012), 0.034, 0.034, MADEIRA_ESC, { roughness: 0.7 }))
    const cap: THREE.Vector3[] = []
    for (let i = 0; i <= 48; i++) {
      const t = 0.004 + (0.992 * i) / 48
      cap.push(V(xOf(t), sheer(t) + 0.008, side * (halfTop(t) - TH / 2)))
    }
    barca.add(tube(cap, 0.03, 0.03, MADEIRA_CLARA, { roughness: 0.6 }))
    // o til pintado: friso creme acompanhando a onda da borda
    barca.add(tube(alongSide(side, (t) => sheer(t) - 0.1, 0.006), 0.022, 0.022, FRISO, { roughness: 0.5 }))
    // emendas das tábuas do costado
    for (const k of [0.2, 0.32]) {
      barca.add(tube(alongSide(side, (t) => sheer(t) - k, 0.003), 0.009, 0.009, MADEIRA_ESC, { roughness: 0.8 }))
    }
  }
  barca.add(limb(V(-L / 2 - 0.02, sheer(0) + 0.008, -halfTop(0)), V(-L / 2 - 0.02, sheer(0) + 0.008, halfTop(0)), 0.03, MADEIRA_CLARA))

  // roda de proa: termina o til num caracol
  const roda = tube(
    [V(L / 2 - 0.01, 0.32, 0), V(L / 2 + 0.04, 0.62, 0), V(L / 2 + 0.06, 0.9, 0), V(L / 2 + 0.0, 1.03, 0), V(L / 2 - 0.08, 1.0, 0)],
    0.05, 0.03, MADEIRA_ESC, { roughness: 0.7 },
  )
  barca.add(roda)
  const pomo = sphere(0.04, MADEIRA_ESC, { roughness: 0.7 })
  pomo.position.set(L / 2 - 0.09, 0.985, 0)
  barca.add(pomo)

  // cavernas por dentro e tábuas do fundo
  for (const t of [0.42, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9]) {
    const pts: THREE.Vector3[] = []
    for (let j = 0; j <= 12; j++) {
      const [z, y] = hullPoint(t, -Math.PI / 2 + (Math.PI * j) / 12, TH + 0.012)
      pts.push(V(xOf(t), Math.min(y, sheer(t) - 0.03), z))
    }
    barca.add(tube(pts, 0.02, 0.02, MADEIRA_ESC, { roughness: 0.75 }))
  }
  for (const z of [-0.17, 0, 0.17]) {
    const x0 = xOf(0.37)
    const x1 = xOf(0.8)
    const fundo = rbox(x1 - x0, 0.025, 0.15, 0.01, MADEIRA_CLARA, { roughness: 0.75 })
    fundo.position.set((x0 + x1) / 2, 0.07, z)
    barca.add(fundo)
  }

  // convés elevado da popa (onde o carteiro pisa) + antepara
  {
    const t0 = 0.008
    const t1 = 0.4
    const n = 20
    const s = new THREE.Shape()
    for (let i = 0; i <= n; i++) {
      const t = t0 + ((t1 - t0) * i) / n
      const z = sectionZ(t, DECK, TH) - 0.004
      if (i === 0) s.moveTo(xOf(t), -z)
      else s.lineTo(xOf(t), -z)
    }
    for (let i = n; i >= 0; i--) {
      const t = t0 + ((t1 - t0) * i) / n
      s.lineTo(xOf(t), sectionZ(t, DECK, TH) - 0.004)
    }
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false })
    g.rotateX(-Math.PI / 2)
    const conves = shadedMesh(g, mat(MADEIRA_CLARA, { roughness: 0.7, size: 1 }))
    conves.position.y = DECK - 0.05
    barca.add(conves)
    for (const z of [-0.24, -0.08, 0.08, 0.24]) {
      const fresta = rbox(xOf(t1) - xOf(t0) - 0.08, 0.008, 0.016, 0.004, MADEIRA_ESC, { roughness: 0.8 })
      fresta.position.set((xOf(t0) + xOf(t1)) / 2, DECK + 0.002, z)
      barca.add(fresta)
    }
    const antepara = shadedMesh(sectionSlab(t1, DECK, TH, 0.04), mat(MADEIRA_ESC, { roughness: 0.75, size: 1 }))
    antepara.position.x = xOf(t1) - 0.02
    barca.add(antepara)
  }

  // carga do correio fluvial: pilha de pacotes amarrados
  let yy = 0.075
  for (const [w, h, d, x, z, ry] of [
    [0.36, 0.24, 0.3, 0.76, 0.04, 0.15],
    [0.3, 0.2, 0.26, 0.78, 0.02, -0.2],
    [0.22, 0.16, 0.2, 0.74, 0.05, 0.35],
  ] as const) {
    const pacote = rbox(w, h, d, 0.025, PAPELAO, { roughness: 0.85 })
    pacote.position.set(x, yy + h / 2, z)
    pacote.rotation.y = ry
    const f1 = rbox(w + 0.006, h + 0.006, 0.025, 0.008, BARBANTE, { roughness: 0.9 })
    const f2 = rbox(0.025, h + 0.006, d + 0.006, 0.008, BARBANTE, { roughness: 0.9 })
    pacote.add(f1, f2)
    barca.add(pacote)
    yy += h
  }

  // espuma na linha d'água e marolas na proa
  {
    const pts: THREE.Vector3[] = []
    const n = 40
    for (let i = 0; i <= n; i++) {
      const t = 0.003 + (0.994 * i) / n
      pts.push(V(xOf(t), 0, sectionZ(t, WL) + 0.02))
    }
    for (let i = n; i >= 0; i--) {
      const t = 0.003 + (0.994 * i) / n
      pts.push(V(xOf(t), 0, -sectionZ(t, WL) - 0.02))
    }
    const espuma = tube(pts, 0.045, 0.045, ESPUMA, { roughness: 0.6 }, true)
    espuma.position.y = WL + 0.004
    espuma.scale.y = 0.3
    espuma.castShadow = false
    barca.add(espuma)
    for (const s of [-1, 1]) {
      const marola = puff(0.08, ESPUMA, 4, s > 0 ? 3 : 5, { roughness: 0.6 })
      marola.scale.set(1.6, 0.35, 0.9)
      marola.position.set(xOf(0.9), WL + 0.01, s * (sectionZ(0.9, WL) + 0.1))
      barca.add(marola)
    }
  }

  // ---- leme: pá vertical, madre e cana comprida --------------------------------
  const leme = new THREE.Group()
  leme.position.set(-L / 2 - 0.08, 0, 0)
  barca.add(leme)
  {
    const s = new THREE.Shape()
    const pts: [number, number][] = [
      [0.03, 0.62], [0.03, 0.02], [-0.06, -0.02], [-0.3, 0.02], [-0.36, 0.14], [-0.33, 0.42], [-0.2, 0.58], [-0.04, 0.64],
    ]
    pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)))
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 })
    g.translate(0, 0, -0.025)
    leme.add(shadedMesh(g, mat(MADEIRA_CLARA, { roughness: 0.65, size: 0.6 })))
    for (const y of [0.22, 0.48]) {
      const cinta = rbox(0.32, 0.035, 0.085, 0.01, FERRO, { roughness: 0.45, metalness: 0.6 })
      cinta.position.set(-0.13, y, 0)
      leme.add(cinta)
    }
    // faixa creme na pá: o leme se destaca do casco
    const faixa = rbox(0.26, 0.06, 0.08, 0.02, FRISO, { roughness: 0.5 })
    faixa.position.set(-0.15, 0.35, 0)
    leme.add(faixa)
    const madre = cylinder(0.036, 0.036, 1.0, MADEIRA_ESC, { roughness: 0.7 })
    madre.position.y = 0.5
    leme.add(madre)
    const cabeca = rbox(0.11, 0.12, 0.11, 0.025, MADEIRA_ESC, { roughness: 0.7 })
    cabeca.position.y = 0.97
    leme.add(cabeca)
    for (const y of [0.38, 0.62]) {
      const ferragem = rbox(0.1, 0.04, 0.07, 0.01, FERRO, { roughness: 0.45, metalness: 0.6 })
      ferragem.position.set(0.04, y, 0)
      leme.add(ferragem)
    }
  }

  // ---- carteiro ---------------------------------------------------------------
  const carteiro = person({ body: CAMISA, skin: PELE, height: 1.5, armAngle: 0.5 })
  carteiro.position.set(XC, DECK, 0)
  carteiro.rotation.y = CYAW
  carteiro.scale.setScalar(CS)
  barca.add(carteiro)

  // bermuda azul, cinto, sapatos
  const bermuda = lathe(
    [[0.215, 0.1], [0.245, 0.15], [0.263, 0.22], [0.269, 0.3], [0.267, 0.37]],
    AZUL,
    { roughness: 0.85 },
  )
  ;(bermuda.material as THREE.Material).side = THREE.DoubleSide
  carteiro.add(bermuda)
  const cinto = torus(0.268, 0.02, '#3b2b1f', { roughness: 0.6 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.36
  carteiro.add(cinto)
  for (const s of [-1, 1]) {
    const sapato = sphere(1, SAPATO, { roughness: 0.5 })
    sapato.scale.set(0.1, 0.07, 0.165)
    sapato.position.set(s * 0.107, 0.055, 0.12)
    carteiro.add(sapato)
    const gola = rbox(0.12, 0.075, 0.02, 0.02, AZUL, { roughness: 0.7 })
    gola.position.set(s * 0.075, 0.715, 0.22)
    gola.rotation.set(-0.35, 0, s * 0.55)
    carteiro.add(gola)
  }

  // cara: sobrancelhas bravas, boca berrando IÁ, bigode
  const head = carteiro.getObjectByName('head') as THREE.Group
  for (const s of [-1, 1]) {
    const sobr = capsule(0.024, 0.1, BIGODE, { roughness: 0.8 })
    sobr.position.set(s * 0.105, 0.108, 0.25)
    sobr.rotation.set(-0.35, 0, -s * (Math.PI / 2 - 0.45))
    head.add(sobr)
    const bigode = capsule(0.032, 0.08, BIGODE, { roughness: 0.85 })
    bigode.position.set(s * 0.058, -0.04, 0.262)
    bigode.rotation.set(0, 0, -s * (Math.PI / 2 + 0.35))
    head.add(bigode)
  }
  const bocaC = sphere(0.058, '#3a1f1c', { roughness: 0.7 })
  bocaC.scale.set(1.15, 1, 0.6)
  bocaC.position.set(0, -0.118, 0.228)
  head.add(bocaC)
  const labio = torus(0.066, 0.022, '#b5715a', { roughness: 0.6 })
  labio.scale.set(1.15, 1, 1)
  labio.position.set(0, -0.118, 0.245)
  head.add(labio)

  // quepe azul de carteiro com corneta do correio
  const quepe = new THREE.Group()
  quepe.position.set(0, QH, -0.01)
  quepe.rotation.x = -0.16
  head.add(quepe)
  quepe.add(lathe(
    [[0, 0], [0.272, 0], [0.277, 0.055], [0.31, 0.14], [0.318, 0.17], [0.285, 0.2], [0, 0.205]],
    AZUL,
    { roughness: 0.6 },
  ))
  const fita = cylinder(0.279, 0.279, 0.066, AZUL_ESC, { roughness: 0.55 })
  fita.position.y = 0.033
  quepe.add(fita)
  const pala = sphere(0.21, PRETO, { roughness: 0.22 })
  pala.scale.set(1, 0.12, 0.58)
  pala.position.set(0, 0.014, 0.235)
  pala.rotation.x = 0.22
  quepe.add(pala)
  const corneta = new THREE.Group()
  corneta.position.set(0, 0.105, 0.296)
  corneta.rotation.x = -0.3
  const espira = torus(0.032, 0.01, '#e9c24a', { roughness: 0.35, metalness: 0.5 })
  corneta.add(espira)
  const campana = cone(0.022, 0.045, '#e9c24a', { roughness: 0.35, metalness: 0.5 })
  campana.rotation.z = Math.PI / 2
  campana.position.set(0.05, -0.02, 0)
  corneta.add(campana)
  quepe.add(corneta)

  // braço erguido com o dedo enfaixado (peça própria)
  const braco = carteiro.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(braco, 1.5)
  braco.rotation.set(ARM_FWD, 0, ARM_UP)
  {
    const mao = braco.children[0]
    mao.scale.set(1, 0.78, 1) // vira punho fechado
    const hy = mao.position.y
    const dedo = capsule(0.047, 0.12, ATADURA, { roughness: 0.85 })
    dedo.position.set(0, hy - 0.16, 0.01)
    braco.add(dedo)
    for (const dy of [-0.12, -0.18]) {
      const volta = torus(0.049, 0.012, '#e3ddcf', { roughness: 0.9 })
      volta.rotation.x = Math.PI / 2
      volta.position.set(0, hy + dy, 0.01)
      braco.add(volta)
    }
    const ponta = sphere(0.036, PELE)
    ponta.scale.y = 1.2
    ponta.position.set(0, hy - 0.255, 0.012)
    braco.add(ponta)
    const mordida = sphere(0.016, '#c0392b', { roughness: 0.6 })
    mordida.scale.z = 0.5
    mordida.position.set(0.0, hy - 0.15, 0.058)
    braco.add(mordida)
  }

  // braço do leme
  const bracoLeme = carteiro.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoLeme, 1.5)
  bracoLeme.rotation.set(0.1, 0, -0.7)

  // ---- bolsa de couro a tiracolo, aberta ------------------------------------------
  const bolsa = new THREE.Group()
  bolsa.position.set(-0.47, 0.36, 0.12)
  bolsa.rotation.y = -0.45
  carteiro.add(bolsa)
  {
    const corpo = rbox(0.36, 0.28, 0.13, 0.04, COURO, { roughness: 0.7 })
    bolsa.add(corpo)
    for (const [w, h, x, y] of [[0.3, 0.012, 0, 0.115], [0.012, 0.22, -0.155, 0], [0.012, 0.22, 0.155, 0]] as const) {
      const costura = rbox(w, h, 0.006, 0.003, COSTURA, { roughness: 0.8 })
      costura.position.set(x, y, 0.066)
      bolsa.add(costura)
    }
    const emblema = torus(0.035, 0.01, LATAO, { roughness: 0.35, metalness: 0.6 })
    emblema.position.set(0, -0.03, 0.068)
    bolsa.add(emblema)
    const emb2 = cone(0.022, 0.05, LATAO, { roughness: 0.35, metalness: 0.6 })
    emb2.rotation.z = Math.PI / 2
    emb2.position.set(0.055, -0.055, 0.068)
    bolsa.add(emb2)
    const aba = new THREE.Group()
    aba.position.set(0, 0.14, -0.06)
    aba.rotation.x = -2.4
    const tampa = rbox(0.37, 0.02, 0.24, 0.03, COURO_ESC, { roughness: 0.7 })
    tampa.position.set(0, 0, 0.12)
    aba.add(tampa)
    const fivela = rbox(0.06, 0.03, 0.05, 0.01, LATAO, { roughness: 0.35, metalness: 0.6 })
    fivela.position.set(0, -0.012, 0.21)
    aba.add(fivela)
    bolsa.add(aba)

    // alça: do canto da bolsa, cruza o peito, passa no ombro direito e volta pelas costas
    const alcaCarteiro = [
      V(-0.317, 0.49, 0.194), V(-0.17, 0.55, 0.255), V(-0.02, 0.61, 0.27), V(0.1, 0.66, 0.245),
      V(0.18, 0.71, 0.17), V(0.22, 0.75, 0.04), V(0.2, 0.73, -0.1), V(0.1, 0.66, -0.23),
      V(-0.06, 0.59, -0.28), V(-0.24, 0.55, -0.25), V(-0.46, 0.52, -0.15), V(-0.623, 0.49, 0.046),
    ]
    bolsa.updateMatrix()
    const inv = bolsa.matrix.clone().invert()
    bolsa.add(tube(alcaCarteiro.map((p) => p.applyMatrix4(inv)), 0.02, 0.02, COURO_ESC, { roughness: 0.7 }))
  }

  // ---- o DENTE de ouro (peça orgânica) -------------------------------------------
  const dente = makeDente()
  dente.position.set(-0.14, DY, 0.037)
  dente.rotation.set(0.08, DYAW, DZ)
  dente.scale.setScalar(DS)
  bolsa.add(dente)

  // anéis de rosnado: ondas saindo da boca para o lado vazio (a popa)
  const rosnado = new THREE.Group()
  rosnado.position.set(0, -0.08, 0.2)
  dente.add(rosnado)
  for (const [r, arc] of [[0.32, 1.5], [0.44, 1.3]] as const) {
    const anel = shadedMesh(new THREE.TorusGeometry(r, 0.022, 10, 36, arc), mat(CINZA, { roughness: 0.5 }))
    anel.rotation.z = Math.PI - arc / 2
    anel.castShadow = false
    rosnado.add(anel)
  }

  // ---- cana do leme até a mão esquerda --------------------------------------------
  root.updateMatrixWorld(true)
  const maoLeme = new THREE.Vector3()
  bracoLeme.children[0].getWorldPosition(maoLeme)
  const pega = leme.worldToLocal(maoLeme.clone())
  const cabecaLeme = V(0.0, 0.99, 0)
  leme.add(limb(cabecaLeme, pega, 0.033, MADEIRA_CLARA, { roughness: 0.6 }))
  const punho = sphere(0.042, MADEIRA_ESC, { roughness: 0.6 })
  punho.position.copy(pega)
  leme.add(punho)

  // ---- esteira da meia-volta: arco de espuma que a proa riscou ao virar ---------
  const esteira = new THREE.Group()
  esteira.position.set(BX, W, BZ)
  root.add(esteira)
  {
    for (const [rr, p0, p1, w0, w1] of [[1.98, -0.62, 0.1, 0.02, 0.075], [1.74, -0.52, 0.06, 0.016, 0.055]] as const) {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 16; i++) {
        const psi = p0 + ((p1 - p0) * i) / 16
        pts.push(V(rr * Math.cos(psi), 0, -rr * Math.sin(psi)))
      }
      const faixa = tube(pts, w0, w1, ESPUMA, { roughness: 0.6 })
      faixa.scale.y = 0.3
      faixa.castShadow = false
      esteira.add(faixa)
    }
    for (let k = 0; k < 10; k++) {
      const psi = -0.55 + (k / 9) * 0.6
      const rr = 1.72 + rand() * 0.3
      const bolha = sphere(0.025 + rand() * 0.03, ESPUMA, { roughness: 0.6 })
      bolha.scale.y = 0.3
      bolha.position.set(rr * Math.cos(psi), 0.005, -rr * Math.sin(psi))
      bolha.castShadow = false
      esteira.add(bolha)
    }
  }

  // ---- peças ---------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'rio', object: base },
    { name: 'cais', group: 'cais', object: cais },
    { name: 'loja', group: 'cais', object: loja },
    { name: 'barca', group: 'barca', object: barca },
    { name: 'leme', group: 'barca', object: leme },
    { name: 'carteiro', group: 'carteiro', object: carteiro },
    { name: 'braco', group: 'carteiro', object: braco },
    { name: 'quepe', group: 'carteiro', object: quepe },
    { name: 'bolsa', group: 'dente', object: bolsa },
    { name: 'dente', group: 'dente', object: dente },
    { name: 'esteira', group: 'volta', object: esteira },
    { name: 'rosnado', group: 'rosnado', object: rosnado },
  ]

  const grow = (to = 1, from = 0.01) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const pulse = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem --------------------------------------------------------------------
  const build = [
    seq('base-sobe', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Um rio verde-azulado; do outro lado, no cais, a lojinha de toldo listrado que te vendeu um dente de ouro.',
    }),
    seq('cais-sobe', 'cais', 0.35, 0.8, [riseFrom(0, 1.0)], { ease: 'easeOut' }),
    seq('loja-sobe', 'loja', 0.8, 0.8, [riseFrom(LOJA_Y, 1.6)], { ease: 'easeOut' }),

    seq('barca-sobe', 'barca', 2.1, 1.0, [riseFrom(BY, 1.3)], {
      ease: 'easeOut',
      caption: 'Pelo rio vem a TIL-BARCA do correio fluvial: madeira torta, curvada feito um til (~), sem vela.',
    }),
    seq('leme-cresce', 'leme', 2.75, 0.5, grow(), { ease: 'easeOut' }),

    seq('carteiro-pula', 'carteiro', 3.7, 0.55, [ch('position.y', DECK + 1.7, DECK)], {
      ease: 'easeIn',
      caption: 'O carteiro pula a bordo com a sua encomenda…',
    }),
    seq('braco-solto', 'braco', 3.7, 0.55, [ch('rotation.z', 1.6, 0.2)], { ease: 'easeOut' }),
    seq('quepe-cai', 'quepe', 4.2, 0.5, [ch('position.y', QH + 0.5, QH), ch('rotation.y', 2.2, 0), ...grow(1, 0.3)], {
      ease: 'easeOut',
    }),

    seq('bolsa-cresce', 'bolsa', 5.0, 0.4, grow(), {
      ease: 'easeOut',
      caption: '…enfiado na bolsa, o DENTE de ouro que você comprou.',
    }),
    seq('dente-entra', 'dente', 5.25, 0.5, [ch('position.y', DY + 0.7, DY), ...grow(DS, DS * 0.3)], { ease: 'easeOut' }),
    seq('dente-morde-a', 'dente', 6.2, 0.15, [ch('rotation.z', DZ, DZ + 0.3)], {
      ease: 'easeOut',
      caption: 'Mas o dente é VIL: mordeu o dedo do carteiro — olha a atadura!',
    }),
    seq('braco-ergue', 'braco', 6.3, 0.35, [ch('rotation.z', 0.2, ARM_UP)], { ease: 'easeOut' }),
    seq('dente-morde-b', 'dente', 6.4, 0.35, [ch('rotation.z', DZ + 0.3, DZ)], { ease: 'easeInOut' }),

    seq('leme-empurra', 'leme', 7.5, 0.4, [ch('rotation.y', 0, -0.16)], {
      ease: 'easeOut',
      caption: 'Ele agarra o LEME e berra: IÁ! VIL! LEME NA TIL-BARCA!',
    }),
    seq('barca-vira', 'barca', 7.7, 1.4, [ch('rotation.y', YAW0, YAW)], { ease: 'easeInOut' }),
    seq('leme-volta', 'leme', 8.6, 0.5, [ch('rotation.y', -0.16, 0)], { ease: 'easeInOut' }),
    seq('esteira-surge', 'esteira', 8.3, 0.9, [riseFrom(W, 0.12)], {
      ease: 'easeOut',
      caption: 'A barca dá meia-volta, rumo à loja do outro lado do rio…',
    }),

    seq('rosnado-sai', 'rosnado', 9.9, 0.5, grow(1, 0.2), {
      ease: 'easeOut',
      caption: '…e da bolsa o dente ainda rosna: DEN… RRÉR!',
    }),
    seq('dente-treme-a', 'dente', 9.9, 0.12, [ch('rotation.z', DZ, DZ + 0.1)]),
    seq('dente-treme-b', 'dente', 10.02, 0.14, [ch('rotation.z', DZ + 0.1, DZ - 0.08)]),
    seq('dente-treme-c', 'dente', 10.16, 0.2, [ch('rotation.z', DZ - 0.08, DZ)]),

    seq('rosnado-pulsa-a', 'rosnado', 11.1, 0.25, pulse(1, 1.18), {
      ease: 'easeOut',
      caption: 'Jag vill lämna tillbaka den här. — Quero devolver isto.',
    }),
    seq('rosnado-pulsa-b', 'rosnado', 11.35, 0.35, pulse(1.18, 1), { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [-0.45, 1.15, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-vill-lamna-tillbaka-den-har',
    contexto:
      "Compras: no balcão da loja para devolver e receber o dinheiro de volta — dentro do prazo do 'öppet köp', normalmente com o recibo —, ou no ombud do correio ao devolver uma compra online (lá também se ouve 'returnera').",
    fraseFonte: 'Quero devolver isto.',
    fraseAlvo: 'Jag vill lämna tillbaka den här.',
    pronuncia:
      "iá vil lém-na til-BÁÁ-ka den RRÉR ('jag' = iá; 'vill' com I curto e L de verdade, que emenda no L de 'lämna'; 'lämna' com É curto e aberto, M e N colados, sem vogal no meio, e dito RÁPIDO e SEM FORÇA — em verbo com partícula a força vai toda pra partícula: lämna tillBAka, como 'ta BORT', 'gå UT'; 'tillbaka' com a força no BÁ, A longo, e o 'till' fraquinho; 'den här' como em 'Vad kostar den här?', com força de novo no HÄR)",
    ponteSonora:
      "IÁ, VIL! LÉM(e)-NA TIL-BÁ(r)CA... DEN RRÉR! (9 sílabas: iá-vil-lém-na-til-BÁÁ-ka-den-RRÉR; força no BÁ e no RRÉR — o LEME corre leve, sem força: em verbo com partícula quem leva a pancada é a partícula, lämna tillBAka; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado; VIL = o 'vill' da bruxa vil e da avestruz vilã ('Vill du ha något att dricka?', 'Vill du ha kvittot?'): I curto e L DE VERDADE, língua no céu da boca — nunca 'viu' —, e esse L emenda direto no L do leme, vi-LÉM, um L só, comprido; LÉM(e) = o LEME sem o -e final, com o E um pouco mais aberto que no 'leme' português, quase o É de 'pé', e o M de lábios fechados soltando direto no NA: LÉM-na, nunca 'lê-mi-na'; e o M é obrigatório — sem ele, com Ô, vira o LÔ-NA da lona da iguana, 'låna' (pegar emprestado), o contrário de devolver; NA fraquinho; TIL = o til (~) de 'Lycka till' e 'Hur kommer jag till Storgatan?': L de verdade, nunca 'tiu', e sem força; BÁ(r)CA = a BARCA sem o R: A LONGO e com toda a força, BÁÁ-ca — o R não soa (com ele vira 'barka', que é descascar árvore); DEN RRÉR = o dente de ouro rosnando, o MESMO 'den här' de 'Vad kostar den här?' e 'Kan jag byta den här?': DEN curto sem nasal, RRÉR soprado com É bem aberto)",
    historia:
      'O DENTE de ouro que você encomendou é VIL: na entrega, mordeu o dedo do carteiro. Furioso, ele decide devolver na hora — enfia o dente rosnando na bolsa, pula na TIL-BARCA do correio fluvial, uma barca de madeira torta, curvada feito um til, e agarra o LEME: IÁ! VIL! LEME NA TIL-BARCA! A barca dá meia-volta rumo à loja do outro lado do rio, e da bolsa o dente ainda rosna: DEN... RRÉR. Quero devolver isto.',
  },
  createScene,
  refine: { organic: ['dente'] },
}

export default card
