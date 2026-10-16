import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Card, CardScene, Sequence } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, cylinder, sphere, cone, torus, rock,
} from '../rig/helpers'

/**
 * "Vad ska vi göra?" — VÁ! SKA... VIEIRA?
 *
 * Domingo de chuva no fundo do mar. A ARRAIA entediada, de pálpebras caídas,
 * decola da areia gritando VÁ! e vai consultar o oráculo do recife: a VIEIRA
 * gigante, que só abre com música. Ela bate a cauda na concha no contratempo
 * do ska — SKA! SKA! SKA! — e a vieira se entreabre: VIEIRA? Na borda, a
 * fileira de olhinhos azuis só pisca de volta. Nem o oráculo sabe.
 *
 * Diorama: areia clara, algas ao fundo, tabuleiro xadrez preto-e-branco (o
 * piso do ska) sob a vieira creme-alaranjada de interior rosado; a arraia
 * cinza-azulada paira à esquerda com a cauda pousada na borda da concha de
 * cima, e três anéis brancos de batida saem do ponto da pancada.
 *
 * Acento saturado reservado: o azul elétrico dos olhinhos da VIEIRA.
 */

// ---- paleta -----------------------------------------------------------------
const AREIA = '#e2cc98'
const AREIA_ESC = '#cdb37e'
const AREIA_FUNDO = '#a98d5c'
const PEDRA = '#6d7c88'
const PEDRA_ESC = '#55626e'
const ALGA = ['#3f8a4a', '#57a259', '#2f6e3d'] as const
const XADREZ_B = '#eeeae0'
const XADREZ_P = '#151519'
const MOLDURA = '#2e2e35'
const NACAR = '#f3b4ba' // interior rosado e brilhante
const MANTO = '#e08a7c'
const LIGAMENTO = '#5a3a2a'
const OLHO = '#2a7dff' // acento: os olhinhos da VIEIRA
const ARRAIA = '#7a8da3'
const ARRAIA_ESC = '#62748a'
const ARRAIA_PINTA = '#a8bacc'
const BARRIGA = '#f1efe8'
const ESPIRACULO = '#3b4552'
const BRANCO = '#ffffff'
const BOLHA = '#eaf8ff'
const POEIRA = '#ecdcb4'

type V3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)

// ---- layout -----------------------------------------------------------------
const SY = 0.14 // topo da areia
const BOARD_TOP = SY + 0.045
const HINGE: V3 = [0.5, BOARD_TOP + 0.28, -0.82] // charneira da vieira
const YAW_V = -0.22 // a vieira vira um pouco para a arraia
const ALPHA = 1.02 // abertura final da concha de cima (rad)
const ALPHA0 = 0.05 // "fechada": só uma fresta
const Q_U = -0.4 // ponto da borda onde a cauda bate (lado da arraia)
const BEAT_DX = 0.28 // nas batidas a arraia chega um pouco para a direita

const C_F: V3 = [-1.12, 1.8, 0.48] // arraia, pose final
const RAY_YAW = -0.38
const RAY_PITCH = 0.24 // nariz para baixo: o dorso (e os olhos) virados para a câmera
const RAY_ROLL = 0.1

const CAM: V3 = [-0.2, 2.6, 3.95]
const TARGET: V3 = [-0.3, 1.24, -0.1]

function shade<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

// ---- vieira: valva paramétrica em leque -------------------------------------
const FAN = 1.08 // meia-abertura do leque

interface ShellP {
  R: number
  depth: number
  ribAmp: number
  ribs: number
  sign: 1 | -1 // +1: domo para cima (concha de cima); -1: para baixo
  light: string
  dark: string
}

const TOPO: ShellP = { R: 1.25, depth: 0.34, ribAmp: 0.04, ribs: 14, sign: 1, light: '#f8dfb6', dark: '#e2864a' }
const BAIXO: ShellP = { R: 1.25, depth: 0.27, ribAmp: 0.036, ribs: 14, sign: -1, light: '#f6e7cc', dark: '#dc9f6a' }

function ridge(p: ShellP, u: number) {
  return 0.5 + 0.5 * Math.cos(Math.PI * p.ribs * (u + 1))
}

/** Ponto da valva: s = 0 na charneira → 1 na borda; u = -1..1 de lado a lado. layer 0 = fora, 1 = dentro. */
function shellPoint(p: ShellP, s: number, u: number, layer: 0 | 1, out = new THREE.Vector3()) {
  const th = u * FAN
  const rg = ridge(p, u)
  const r = s * p.R * (1 + 0.028 * rg * Math.pow(s, 6))
  const F = ((1 - s * s) * Math.pow(s, 0.6)) / 0.496
  const G = Math.pow(Math.max(0, Math.cos((u * Math.PI) / 2)), 0.45)
  const dome = p.depth * F * G
  const rib = p.ribAmp * Math.pow(s, 0.9) * rg * Math.pow(G, 0.25)
  const y = layer === 0
    ? dome + rib
    : dome * 0.9 + rib * 0.5 - 0.03 * Math.min(1, s * 5)
  return out.set(r * Math.sin(th), p.sign * y, r * Math.cos(th))
}

/** Valva completa: casca estriada (cores por vértice), interior de nácar, borda, manto e orelhas. */
function valve(p: ShellP) {
  const g = new THREE.Group()
  const S = 34
  const T = 112
  const W = T + 1
  const v = new THREE.Vector3()
  const outPos: number[] = []
  const inPos: number[] = []
  const uvs: number[] = []
  const cols: number[] = []
  const cl = new THREE.Color(p.light)
  const cd = new THREE.Color(p.dark)
  const c = new THREE.Color()
  for (let i = 0; i <= S; i++) {
    const s = i / S
    for (let j = 0; j <= T; j++) {
      const u = -1 + (2 * j) / T
      shellPoint(p, s, u, 0, v)
      outPos.push(v.x, v.y, v.z)
      shellPoint(p, s, u, 1, v)
      inPos.push(v.x, v.y, v.z)
      uvs.push(j / T, s)
      // estrias claras, sulcos alaranjados, anéis de crescimento concêntricos
      const rg = ridge(p, u)
      const band = 1 - 0.11 * s * (0.5 + 0.5 * Math.cos(s * Math.PI * 11))
      c.copy(cd).lerp(cl, Math.min(1, Math.pow(rg, 0.9) * 0.8 + 0.3 * (1 - s))).multiplyScalar(band)
      cols.push(c.r, c.g, c.b)
    }
  }
  const idx: number[] = []
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < T; j++) {
      const a = i * W + j
      const b = (i + 1) * W + j
      const cc = (i + 1) * W + j + 1
      const d = i * W + j + 1
      idx.push(a, b, cc, a, cc, d)
    }
  }
  const surface = (pos: number[], withColor: boolean) => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    if (withColor) geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    geo.setIndex(idx)
    geo.computeVertexNormals()
    return geo
  }

  const outMat = mat('#ffffff', { roughness: 0.55, size: 2.2 })
  outMat.vertexColors = true
  outMat.side = THREE.DoubleSide
  g.add(shade(new THREE.Mesh(surface(outPos, true), outMat)))

  const inMat = mat(NACAR, { roughness: 0.18, size: 2.2, detail: 0.4 })
  inMat.side = THREE.DoubleSide
  g.add(shade(new THREE.Mesh(surface(inPos, false), inMat)))

  // borda: costura entre casca e nácar ao longo da margem e dos dois lados
  const rimPos: number[] = []
  const rimUv: number[] = []
  const rimIdx: number[] = []
  const strip = (ids: number[]) => {
    const base = rimPos.length / 3
    const n = ids.length
    for (const id of ids) {
      rimPos.push(outPos[id * 3], outPos[id * 3 + 1], outPos[id * 3 + 2])
      rimUv.push(rimUv.length / 2 / n, 0)
    }
    for (const id of ids) {
      rimPos.push(inPos[id * 3], inPos[id * 3 + 1], inPos[id * 3 + 2])
      rimUv.push(0, 1)
    }
    for (let k = 0; k < n - 1; k++) {
      const a = base + k
      const b = base + k + 1
      rimIdx.push(a, b, base + n + k + 1, a, base + n + k + 1, base + n + k)
    }
  }
  strip(Array.from({ length: W }, (_, j) => S * W + j))
  strip(Array.from({ length: S + 1 }, (_, i) => i * W))
  strip(Array.from({ length: S + 1 }, (_, i) => i * W + T))
  const rimGeo = new THREE.BufferGeometry()
  rimGeo.setAttribute('position', new THREE.Float32BufferAttribute(rimPos, 3))
  rimGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rimUv, 2))
  rimGeo.setIndex(rimIdx)
  rimGeo.computeVertexNormals()
  const rimMat = mat(p.light, { roughness: 0.5, size: 1 })
  rimMat.side = THREE.DoubleSide
  g.add(shade(new THREE.Mesh(rimGeo, rimMat)))

  // manto carnudo logo para dentro da borda (onde ficam os olhinhos)
  const mantle: THREE.Vector3[] = []
  for (let k = 0; k <= 48; k++) {
    const u = -0.95 + (1.9 * k) / 48
    const m = shellPoint(p, 0.935, u, 1)
    m.y -= p.sign * 0.012
    mantle.push(m)
  }
  const mantleGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mantle), 160, 0.024, 10, false)
  g.add(shade(new THREE.Mesh(mantleGeo, mat(MANTO, { roughness: 0.45, size: 0.3 }))))

  // orelhas da charneira (a silhueta clássica de vieira), ao longo da dobradiça
  const k = p.R / 1.25
  for (const side of [-1, 1]) {
    const orelha = rbox(0.27 * k, 0.04 * k, 0.15 * k, 0.018 * k, p.dark, { roughness: 0.55 })
    orelha.position.set(side * 0.2 * k, p.sign * 0.016 * k, -0.04 * k)
    orelha.rotation.y = side * 0.1
    g.add(orelha)
  }
  return g
}

/** Fileira de olhinhos azuis no manto. Origem do grupo na altura média da fileira (o piscar é scale.y). */
function eyeRow(p: ShellP, n: number) {
  const g = new THREE.Group()
  const pts: { pos: THREE.Vector3; dir: THREE.Vector3 }[] = []
  let ySum = 0
  for (let k = 0; k < n; k++) {
    const u = -0.84 + (1.68 * k) / (n - 1)
    const pos = shellPoint(p, 0.935, u, 1)
    pos.y -= p.sign * 0.05
    const th = u * FAN
    const dir = new THREE.Vector3(Math.sin(th), -p.sign * 0.35, Math.cos(th)).normalize()
    pts.push({ pos, dir })
    ySum += pos.y
  }
  const yAvg = ySum / n
  g.position.y = yAvg
  const eyeMat = mat(OLHO, { roughness: 0.12, emissive: '#1d6bff', emissiveIntensity: 0.75 })
  const pupilMat = mat('#0d1530', { roughness: 0.2 })
  const glintMat = mat(BRANCO, { emissive: BRANCO, emissiveIntensity: 1 })
  for (const { pos, dir } of pts) {
    const eye = shade(new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 16), eyeMat))
    eye.position.set(pos.x, pos.y - yAvg, pos.z)
    g.add(eye)
    const pupil = shade(new THREE.Mesh(new THREE.SphereGeometry(0.02, 14, 10), pupilMat))
    pupil.position.copy(eye.position).addScaledVector(dir, 0.036)
    g.add(pupil)
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), glintMat)
    glint.position.copy(eye.position).addScaledVector(dir, 0.04).add(new THREE.Vector3(0.01, 0.014, 0))
    g.add(glint)
  }
  return g
}

// ---- arraia: disco em losango a partir de uma esfera deformada --------------
const RAY = { a: 0.98, bF: 0.66, bB: 0.6, p: 1.3, curl: 0.22, tTop: 0.24 }

function rayRho(phi: number) {
  const b = Math.cos(phi) >= 0 ? RAY.bF : RAY.bB
  return Math.pow(
    Math.pow(Math.abs(Math.sin(phi)) / RAY.a, RAY.p) + Math.pow(Math.abs(Math.cos(phi)) / b, RAY.p),
    -1 / RAY.p,
  )
}

/** Pontas das asas curvadas para cima. */
function rayCurl(x: number) {
  const w = Math.abs(x) / RAY.a
  return RAY.curl * Math.pow(Math.max(0, w - 0.4) / 0.6, 2)
}

/** Altura do dorso da arraia em (x, z) — para assentar olhos e pintas. */
function rayTopY(x: number, z: number) {
  const rp = Math.hypot(x, z) / rayRho(Math.atan2(x, z))
  const y = Math.sqrt(Math.max(0, 1 - rp * rp))
  return RAY.tTop * Math.pow(y, 1.5) + rayCurl(x)
}

/** Lente em losango: dorso de altura tTop, ventre tBot, planta escalada por k. */
function rayLens(k: number, tTop: number, tBot: number, color: string, opts: MatOpts) {
  let geo: THREE.BufferGeometry = new THREE.SphereGeometry(1, 80, 40)
  geo.deleteAttribute('uv')
  geo.deleteAttribute('normal')
  geo = mergeVertices(geo) // sem costura de UV: normais lisas no disco inteiro
  const pos = geo.attributes.position
  const uv: number[] = []
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const rho = rayRho(Math.atan2(v.x, v.z)) * k
    const x = v.x * rho
    const z = v.z * rho
    const t = Math.pow(Math.abs(v.y), 1.5)
    const y = (v.y >= 0 ? tTop : -tBot) * t + rayCurl(x)
    pos.setXYZ(i, x, y, z)
    uv.push(x / 2 + 0.5, z / 2 + 0.5)
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.computeVertexNormals()
  return shade(new THREE.Mesh(geo, mat(color, { ...opts, size: 2 })))
}

/** Tubo afilado ao longo de uma curva (cauda). */
function taperTube(curve: THREE.Curve<THREE.Vector3>, r0: number, r1: number, color: string, opts: MatOpts) {
  const SEG = 90
  const RAD = 10
  const geo = new THREE.TubeGeometry(curve, SEG, 1, RAD, false)
  const pos = geo.attributes.position
  const c = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG
    curve.getPointAt(t, c)
    const r = THREE.MathUtils.lerp(r0, r1, Math.pow(t, 0.75))
    for (let j = 0; j <= RAD; j++) {
      const id = i * (RAD + 1) + j
      v.fromBufferAttribute(pos, id).sub(c).multiplyScalar(r).add(c)
      pos.setXYZ(id, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  return shade(new THREE.Mesh(geo, mat(color, { ...opts, size: 0.5 })))
}

// ---- algas (lâminas onduladas) ------------------------------------------------
function blade(h: number, amp: number, phase: number, width: number, color: string) {
  const pts: THREE.Vector3[] = []
  const N = 14
  for (let i = 0; i <= N; i++) {
    const t = i / N
    pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 2.6 + phase) * amp * (0.25 + 0.75 * t), t * h, 0))
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  const SEG = 48
  const RAD = 10
  const geo = new THREE.TubeGeometry(curve, SEG, width, RAD, false)
  const pos = geo.attributes.position
  const c = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG
    curve.getPointAt(t, c)
    const tip = t > 0.82 ? Math.max(0.06, (1 - t) / 0.18) : 1
    const f = (0.55 + 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.15))) * tip
    for (let j = 0; j <= RAD; j++) {
      const id = i * (RAD + 1) + j
      v.fromBufferAttribute(pos, id).sub(c).multiplyScalar(f)
      v.z *= 0.32
      v.add(c)
      pos.setXYZ(id, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  return shade(new THREE.Mesh(geo, mat(color, { roughness: 0.6, size: 0.4 })))
}

function tuft(seed: number, h: number, n: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  for (let i = 0; i < n; i++) {
    const b = blade(
      h * (0.62 + rand() * 0.38),
      0.09 + rand() * 0.05,
      rand() * Math.PI * 2,
      0.06 + rand() * 0.015,
      ALGA[i % ALGA.length],
    )
    b.position.set((i - (n - 1) / 2) * 0.11 + (rand() - 0.5) * 0.04, -0.03, (rand() - 0.5) * 0.14)
    b.rotation.y = (rand() - 0.5) * 0.6
    g.add(b)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- fundo do mar: disco de areia clara ------------------------------------
  const base = new THREE.Group()
  const fundo = cylinder(2.56, 2.64, 0.08, AREIA_FUNDO, { roughness: 0.95 })
  fundo.position.y = 0.04
  base.add(fundo)
  const areia = cylinder(2.5, 2.56, 0.07, AREIA, { roughness: 0.95 })
  areia.position.y = 0.105
  base.add(areia)
  for (const [x, z, r] of [[-1.75, -0.6, 0.5], [1.75, 0.95, 0.45], [-0.3, 1.85, 0.4], [1.2, -1.75, 0.5]] as const) {
    const monte = sphere(r, AREIA, { roughness: 0.95 })
    monte.scale.set(1.3, 0.16, 1)
    monte.position.set(x, SY - 0.01, z)
    base.add(monte)
  }
  for (const [x, z, R, a0] of [[-0.9, 1.5, 0.9, 0.3], [0.9, 1.75, 0.7, 0.5], [-1.6, 0.4, 0.6, 2.4], [1.9, 0.3, 0.5, 3.6]] as const) {
    const onda = shade(new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.018, 6, 40, 1.1),
      mat(AREIA_ESC, { roughness: 0.95, size: 0.5 }),
    ))
    onda.rotation.set(-Math.PI / 2, 0, a0)
    onda.position.set(x, SY, z)
    base.add(onda)
  }
  for (const [x, z, r, s] of [[-2.15, -0.35, 0.2, 3], [-1.95, 0.15, 0.1, 5], [2.15, -0.25, 0.2, 7], [2.05, 0.3, 0.1, 9], [0.35, 2.1, 0.12, 11], [-1.2, -1.75, 0.2, 13]] as const) {
    const pedra = rock(r, s % 4 === 1 ? PEDRA : PEDRA_ESC, s, { roughness: 0.8 })
    pedra.position.set(x, SY + r * 0.35, z)
    pedra.rotation.y = rand() * Math.PI
    base.add(pedra)
  }
  // conchinha e estrelinha de areia na borda da frente (escala: a vieira é GIGANTE)
  const conchinha = new THREE.Group()
  conchinha.position.set(1.75, SY + 0.004, 0.95)
  conchinha.rotation.set(0, 2.5, 0)
  const mini = valve(TOPO)
  mini.scale.setScalar(0.14)
  mini.traverse((o) => { o.castShadow = false })
  conchinha.add(mini)
  base.add(conchinha)
  root.add(base)

  // ---- algas ao fundo -------------------------------------------------------
  const algas = new THREE.Group()
  algas.position.y = SY
  root.add(algas)
  for (const [x, z, h, s, n] of [[-1.85, -0.95, 2.05, 3, 5], [1.95, -0.85, 1.7, 8, 4]] as const) {
    const t = tuft(s, h, n)
    t.position.set(x, 0, z)
    algas.add(t)
  }
  for (const [x, y, z, r] of [
    [-1.72, 2.3, -0.9, 0.032], [-1.8, 2.5, -0.88, 0.022], [-1.7, 2.66, -0.92, 0.017],
    [1.88, 1.95, -0.8, 0.028], [1.96, 2.12, -0.82, 0.02],
  ] as const) {
    const b = sphere(r, BOLHA, { emissive: '#cdeefc', emissiveIntensity: 1.0 })
    const bm = b.material as THREE.MeshStandardMaterial
    bm.transparent = true
    bm.opacity = 0.7
    b.castShadow = false
    b.position.set(x, y, z)
    algas.add(b)
  }

  // ---- tabuleiro xadrez cravado na areia (o piso do ska) ----------------------
  const tabuleiro = new THREE.Group()
  const BC = new THREE.Vector3(0, 0, 0.42).applyAxisAngle(UP, YAW_V).add(new THREE.Vector3(HINGE[0], 0, HINGE[2]))
  tabuleiro.position.set(BC.x, SY, BC.z)
  tabuleiro.rotation.y = YAW_V
  root.add(tabuleiro)
  const moldura = rbox(2.34, 0.07, 2.34, 0.025, MOLDURA, { roughness: 0.45 })
  moldura.position.y = 0.0
  tabuleiro.add(moldura)
  const N_T = 6
  const TILE = 0.36
  for (let i = 0; i < N_T; i++) {
    for (let j = 0; j < N_T; j++) {
      const tile = rbox(TILE - 0.012, 0.02, TILE - 0.012, 0.006, (i + j) % 2 ? XADREZ_P : XADREZ_B, { roughness: 0.62 })
      tile.position.set((i - (N_T - 1) / 2) * TILE, 0.036, (j - (N_T - 1) / 2) * TILE)
      tabuleiro.add(tile)
    }
  }

  // ---- vieira gigante: concha de baixo (peça) + concha de cima (peça) ---------
  const vieira = new THREE.Group()
  vieira.position.set(...HINGE)
  vieira.rotation.y = YAW_V
  root.add(vieira)
  vieira.add(valve(BAIXO))
  const ligamento = cylinder(0.035, 0.035, 0.34, LIGAMENTO, { roughness: 0.6 })
  ligamento.rotation.z = Math.PI / 2
  ligamento.position.set(0, 0, -0.005)
  vieira.add(ligamento)

  const tampa = new THREE.Group()
  tampa.rotation.x = -ALPHA
  vieira.add(tampa)
  tampa.add(valve(TOPO))

  const olhos = eyeRow(BAIXO, 13)
  vieira.add(olhos)
  const olhosTopo = eyeRow(TOPO, 13)
  tampa.add(olhosTopo)

  // ---- arraia cinza-azulada ------------------------------------------------------
  const arraia = new THREE.Group()
  arraia.rotation.order = 'YXZ'
  arraia.position.set(...C_F)
  arraia.rotation.set(RAY_PITCH, RAY_YAW, RAY_ROLL)
  root.add(arraia)

  arraia.add(rayLens(1, RAY.tTop, 0.05, ARRAIA, { roughness: 0.62 }))
  arraia.add(rayLens(0.93, 0.03, 0.15, BARRIGA, { roughness: 0.7 }))
  const corcova = sphere(1, ARRAIA, { roughness: 0.62 })
  corcova.scale.set(0.3, 0.13, 0.46)
  corcova.position.set(0, 0.1, -0.04)
  arraia.add(corcova)
  // nadadeiras pélvicas, de cada lado da raiz da cauda
  for (const side of [-1, 1]) {
    const pelvica = sphere(1, ARRAIA, { roughness: 0.62 })
    pelvica.scale.set(0.15, 0.05, 0.13)
    pelvica.position.set(side * 0.13, 0.0, -0.6)
    pelvica.rotation.y = side * 0.35
    arraia.add(pelvica)
  }
  // olhos saltados no topo, de pálpebras caídas de tédio
  for (const side of [-1, 1]) {
    const ex = side * 0.19
    const ez = 0.27
    const ey = rayTopY(ex, ez)
    const calombo = sphere(0.115, ARRAIA, { roughness: 0.62 })
    calombo.scale.set(1, 0.75, 1.05)
    calombo.position.set(ex, ey - 0.01, ez)
    arraia.add(calombo)

    const olho = new THREE.Group()
    olho.position.set(ex, ey + 0.09, ez + 0.01)
    olho.rotation.set(-0.25, side * 0.18, 0) // olhar para a frente e um pouco para cima
    arraia.add(olho)
    const esclera = sphere(0.088, '#fbfbf7', { roughness: 0.25 })
    olho.add(esclera)
    const pupila = sphere(0.04, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(0, -0.014, 0.074)
    pupila.scale.z = 0.6
    olho.add(pupila)
    // pálpebra: calota que cobre o olho até um pouco acima do meio da pupila
    const palpebraGeo = new THREE.SphereGeometry(0.096, 28, 14, 0, Math.PI * 2, 0, 1.5)
    const palpebraMat = mat(ARRAIA_ESC, { roughness: 0.6 })
    palpebraMat.side = THREE.DoubleSide
    const palpebra = shade(new THREE.Mesh(palpebraGeo, palpebraMat))
    palpebra.rotation.x = 0.12
    palpebra.rotation.z = -side * 0.12 // canto de fora caído
    olho.add(palpebra)

    const espiraculo = sphere(0.042, ESPIRACULO, { roughness: 0.5 })
    espiraculo.scale.set(0.8, 0.3, 1.1)
    espiraculo.position.set(side * 0.2, rayTopY(side * 0.2, 0.08) + 0.004, 0.08)
    arraia.add(espiraculo)
  }
  // pintas claras no dorso
  for (const [x, z, r] of [[-0.45, 0.02, 0.05], [-0.62, -0.12, 0.035], [-0.35, -0.25, 0.04], [0.47, 0.0, 0.05], [0.63, -0.14, 0.035], [0.36, -0.27, 0.04]] as const) {
    const pinta = sphere(r, ARRAIA_PINTA, { roughness: 0.55 })
    pinta.scale.set(1, 0.25, 1)
    pinta.position.set(x, rayTopY(x, z) - 0.002, z)
    arraia.add(pinta)
  }

  // ---- posições derivadas: onde a cauda bate ---------------------------------
  root.updateMatrixWorld(true)
  const Qm = shellPoint(TOPO, 1, Q_U, 0).add(shellPoint(TOPO, 1, Q_U, 1)).multiplyScalar(0.5)
  const P3 = tampa.localToWorld(Qm.clone()) // concha aberta (pose final)
  tampa.rotation.x = -ALPHA0
  tampa.updateMatrixWorld(true)
  const P0 = tampa.localToWorld(Qm.clone()) // concha fechada (batidas)
  tampa.rotation.x = -ALPHA
  tampa.updateMatrixWorld(true)

  // ---- cauda: base orientada para a borda; rotation.x da peça = chicotada ----
  const caudaBase = new THREE.Group()
  caudaBase.position.set(0, 0.03, -0.64)
  arraia.add(caudaBase)
  arraia.updateMatrixWorld(true)
  const rootW = caudaBase.getWorldPosition(new THREE.Vector3())
  const dir = P3.clone().sub(rootW).normalize()
  const yAx = UP.clone().sub(dir.clone().multiplyScalar(UP.dot(dir))).normalize()
  const zAx = dir.clone().negate()
  const xAx = new THREE.Vector3().crossVectors(yAx, zAx)
  const qW = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, yAx, zAx))
  const qRay = arraia.getWorldQuaternion(new THREE.Quaternion())
  caudaBase.quaternion.copy(qRay.clone().invert().multiply(qW))
  const cauda = new THREE.Group()
  caudaBase.add(cauda)
  arraia.updateMatrixWorld(true)

  const backW = new THREE.Vector3(0, 0, -1).applyQuaternion(qRay)
  const ctrlW = [
    rootW.clone(),
    rootW.clone().addScaledVector(backW, 0.14).lerp(P3, 0.22).add(new THREE.Vector3(0, 0.3, 0)),
    rootW.clone().lerp(P3, 0.62).add(new THREE.Vector3(0, 0.4, 0)),
    P3.clone().add(new THREE.Vector3(0.0, 0.2, 0.02)),
    P3.clone(),
  ]
  const curve = new THREE.CatmullRomCurve3(ctrlW.map((w) => cauda.worldToLocal(w.clone())), false, 'centripetal')
  cauda.add(taperTube(curve, 0.066, 0.013, ARRAIA, { roughness: 0.6 }))
  const raiz = sphere(0.067, ARRAIA, { roughness: 0.6 })
  cauda.add(raiz)
  const ponta = sphere(0.012, ARRAIA_ESC, { roughness: 0.6 })
  ponta.position.copy(curve.getPointAt(1))
  cauda.add(ponta)
  // ferrão serrilhado a um terço da cauda
  const tFerrao = 0.3
  const tg = curve.getTangentAt(tFerrao)
  const ferrao = cone(0.017, 0.12, ARRAIA_ESC, { roughness: 0.45 })
  ferrao.position.copy(curve.getPointAt(tFerrao)).addScaledVector(tg, 0.06)
  ferrao.position.y += 0.03
  ferrao.quaternion.setFromUnitVectors(UP, tg)
  cauda.add(ferrao)

  // Batidas na concha fechada: a arraia DESCE (sem avançar para a câmera) até
  // a borda fechada ficar a um comprimento de cauda da raiz; a cauda gira
  // (HIT) da direção de repouso para a borda fechada.
  const tipL = curve.getPointAt(1)
  const L = tipL.length()
  const toP0 = P0.clone().sub(rootW)
  const shift = new THREE.Vector3(BEAT_DX, 0, 0)
  const hz = toP0.clone().sub(shift)
  const vy = Math.sqrt(Math.max(0, L * L - hz.x * hz.x - hz.z * hz.z))
  shift.y = toP0.y + vy // raiz fica vy acima da borda fechada
  const BEAT: V3 = [C_F[0] + shift.x, C_F[1] + shift.y, C_F[2] + shift.z]
  const hitDirW = toP0.clone().sub(shift).normalize()
  const qBase = caudaBase.getWorldQuaternion(new THREE.Quaternion())
  const hitDirL = hitDirW.clone().applyQuaternion(qBase.clone().invert())
  const HIT = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(tipL.clone().normalize(), hitDirL),
  )

  // deitada na areia: cauda erguida só o bastante para a ponta não afundar
  const LIE: V3 = [BEAT[0] - 0.05, SY + 0.15, 0.1]
  arraia.position.set(...LIE)
  arraia.rotation.set(0, RAY_YAW, 0)
  let liftLie = 0
  for (let k = 0; k <= 80; k++) {
    cauda.rotation.x = k * 0.02
    arraia.updateMatrixWorld(true)
    if (cauda.localToWorld(tipL.clone()).y >= SY + 0.03) {
      liftLie = k * 0.02
      break
    }
  }
  cauda.rotation.x = 0
  arraia.position.set(...C_F)
  arraia.rotation.set(RAY_PITCH, RAY_YAW, RAY_ROLL)
  root.updateMatrixWorld(true)

  // ---- anéis de batida, presos na concha de cima, virados para a câmera ------
  const camV = new THREE.Vector3(...CAM)
  // A peça gira em x o contrário da tampa (RING_X0 com a concha fechada → 0
  // aberta), então o anel fica de frente para a câmera o tempo todo.
  const mkRing = (r: number) => {
    const g = new THREE.Group()
    g.position.copy(Qm)
    tampa.add(g)
    const face = new THREE.Group()
    g.add(face)
    face.updateMatrixWorld(true)
    face.lookAt(camV)
    face.add(torus(r, 0.014, BRANCO, { emissive: '#ffffff', emissiveIntensity: 0.35 }))
    return g
  }
  const anel1 = mkRing(0.1)
  const anel2 = mkRing(0.16)
  const anel3 = mkRing(0.22)

  // ---- redemoinho de areia onde a arraia estava deitada ----------------------
  const redemoinho = new THREE.Group()
  redemoinho.position.set(LIE[0], SY, LIE[2])
  redemoinho.scale.setScalar(0.001) // a poeira assenta: some depois da decolagem
  root.add(redemoinho)
  const hel: THREE.Vector3[] = []
  for (let k = 0; k <= 64; k++) {
    const t = k / 64
    const a = t * Math.PI * 2 * 2.2
    const rr = 0.5 - 0.34 * t
    hel.push(new THREE.Vector3(Math.cos(a) * rr, 0.05 + t * 0.75, Math.sin(a) * rr))
  }
  const helCurve = new THREE.CatmullRomCurve3(hel)
  redemoinho.add(taperTube(helCurve, 0.04, 0.012, POEIRA, { roughness: 0.95 }))
  for (let k = 0; k < 9; k++) {
    const grao = sphere(0.022, POEIRA, { roughness: 0.95 })
    grao.position.copy(helCurve.getPointAt(0.08 + k * 0.1)).add(new THREE.Vector3(0, 0.07, 0))
    redemoinho.add(grao)
  }

  // brilho frio de fundo do mar
  const luz = new THREE.PointLight('#9fdcff', 1.1, 6, 1.5)
  luz.position.set(-0.4, 2.9, 1.8)
  root.add(luz)

  // ---- peças ---------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'mar', object: base },
    { name: 'algas', group: 'mar', object: algas },
    { name: 'arraia', group: 'arraia', object: arraia },
    { name: 'cauda', group: 'arraia', object: cauda },
    { name: 'redemoinho', group: 'va', object: redemoinho },
    { name: 'tabuleiro', group: 'vieira', object: tabuleiro },
    { name: 'vieira', group: 'vieira', object: vieira },
    { name: 'tampa', group: 'vieira', object: tampa },
    { name: 'anel1', group: 'ska', object: anel1 },
    { name: 'anel2', group: 'ska', object: anel2 },
    { name: 'anel3', group: 'ska', object: anel3 },
    { name: 'olhos', group: 'olhos', object: olhos },
    { name: 'olhosTopo', group: 'olhos', object: olhosTopo },
  ]

  const grow = (from: number, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const rayPose = (from: V3, to: V3, rx: [number, number], rz: [number, number]) => [
    ch('position.x', from[0], to[0]),
    ch('position.y', from[1], to[1]),
    ch('position.z', from[2], to[2]),
    ch('rotation.x', rx[0], rx[1]),
    ch('rotation.z', rz[0], rz[1]),
  ]

  // batidas do ska: levanta a cauda e desce de chicote
  const LIFT = 0.55
  const RING_X0 = ALPHA0 - ALPHA
  const beats: Sequence[] = []
  const BEAT_T = [6.4, 7.05, 7.7]
  BEAT_T.forEach((t0, i) => {
    beats.push(
      seq(`cauda-bate-${i + 1}`, 'cauda', t0, 0.13, [ch('rotation.x', HIT.x + LIFT, HIT.x)], {
        ease: 'easeIn',
        ...(i === 0 ? { caption: 'Ela bate a cauda na concha, no contratempo do ska: SKA! SKA! SKA!' } : {}),
      }),
      seq(`anel-${i + 1}`, `anel${i + 1}`, t0 + 0.12, 0.3, [...grow(0.2), ch('rotation.x', RING_X0, RING_X0)], { ease: 'easeOut' }),
      seq(`anel-${i + 1}-acompanha`, `anel${i + 1}`, 8.5, 1.8, [ch('rotation.x', RING_X0, 0)]),
    )
    if (i < BEAT_T.length - 1) {
      beats.push(seq(`cauda-ergue-${i + 1}`, 'cauda', t0 + 0.3, 0.24, [ch('rotation.x', HIT.x, HIT.x + LIFT)], { ease: 'easeOut' }))
    }
  })

  // ---- montagem ------------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Domingo de chuva no fundo do mar — e ninguém da turma sabe o que fazer.',
    }),
    seq('algas-crescem', 'algas', 0.35, 0.9, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),

    seq('arraia-surge', 'arraia', 1.6, 0.6, rayPose([LIE[0], SY - 0.5, LIE[2]], LIE, [0, 0], [0, 0]), {
      ease: 'easeOut',
      caption: 'Largada na areia, uma ARRAIA cinza-azulada morre de tédio, de pálpebras caídas.',
    }),
    seq('cauda-deitada', 'cauda', 1.6, 0.6, [ch('rotation.x', liftLie, liftLie), ch('rotation.y', 0, 0), ch('rotation.z', 0, 0)]),

    seq('arraia-decola', 'arraia', 3.2, 0.55, rayPose(LIE, [BEAT[0], BEAT[1] - 0.35, BEAT[2]], [0, RAY_PITCH * 0.5], [0, -0.3]), {
      ease: 'easeOut',
      caption: 'Cansada de ficar deitada, ela bate as asas, levanta um redemoinho e grita: VÁ!',
    }),
    seq('arraia-plana', 'arraia', 3.75, 0.55, rayPose([BEAT[0], BEAT[1] - 0.35, BEAT[2]], BEAT, [RAY_PITCH * 0.5, RAY_PITCH], [-0.3, RAY_ROLL]), {
      ease: 'easeInOut',
    }),
    seq('cauda-solta', 'cauda', 3.2, 1.1, [
      ch('rotation.x', liftLie, HIT.x + LIFT), ch('rotation.y', 0, HIT.y), ch('rotation.z', 0, HIT.z),
    ], { ease: 'easeInOut' }),
    seq('redemoinho-gira', 'redemoinho', 3.2, 0.8, [...grow(0.15), ch('rotation.y', -3.5, -1)], { ease: 'easeOut' }),
    seq('redemoinho-assenta', 'redemoinho', 4.0, 0.7, [...grow(1, 0.001), ch('rotation.y', -1, 0)], { ease: 'easeIn' }),

    seq('tabuleiro-rise', 'tabuleiro', 4.7, 0.5, [riseFrom(SY, 0.5)], {
      ease: 'easeOut',
      caption: 'Lá vai ela consultar o oráculo do recife: a VIEIRA gigante, no seu tabuleiro de ska — que só abre com música.',
    }),
    seq('vieira-rise', 'vieira', 4.9, 0.75, [riseFrom(HINGE[1], 1.4)], { ease: 'easeOut' }),
    seq('tampa-fechada', 'tampa', 4.9, 0.75, [ch('rotation.x', -ALPHA0, -ALPHA0)]),

    ...beats,

    // a vieira se abre devagar e a arraia sobe junto, cauda erguida
    seq('cauda-espera', 'cauda', 8.3, 0.3, [ch('rotation.x', HIT.x, HIT.x + LIFT)], { ease: 'easeOut' }),
    seq('cauda-volta', 'cauda', 8.6, 1.7, [
      ch('rotation.x', HIT.x + LIFT, LIFT), ch('rotation.y', HIT.y, 0), ch('rotation.z', HIT.z, 0),
    ], { ease: 'easeInOut' }),
    seq('tampa-abre', 'tampa', 8.5, 1.8, [ch('rotation.x', -ALPHA0, -ALPHA)], {
      ease: 'easeInOut',
      caption: '…e a vieira vai se abrindo devagar: SKA… VIEIRA?',
    }),
    seq('arraia-sobe', 'arraia', 8.5, 1.8, rayPose(BEAT, C_F, [RAY_PITCH, RAY_PITCH], [RAY_ROLL, RAY_ROLL]), {
      ease: 'easeInOut',
    }),
    seq('cauda-pousa', 'cauda', 10.3, 0.3, [ch('rotation.x', LIFT, 0)], { ease: 'easeIn' }),

    seq('olhos-abrem', 'olhos', 10.7, 0.35, [ch('scale.y', 0.05, 1)], {
      ease: 'easeOut',
      caption: 'Na borda, a fileira de olhinhos azuis só pisca de volta: nem o oráculo sabe.',
    }),
    seq('olhosTopo-abrem', 'olhosTopo', 10.75, 0.35, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),
    seq('olhos-piscam', 'olhos', 11.5, 0.12, [ch('scale.y', 1, 0.08)], { ease: 'easeIn' }),
    seq('olhosTopo-piscam', 'olhosTopo', 11.5, 0.12, [ch('scale.y', 1, 0.08)], { ease: 'easeIn' }),
    seq('olhos-reabrem', 'olhos', 11.62, 0.16, [ch('scale.y', 0.08, 1)], {
      ease: 'easeOut',
      caption: 'Vad ska vi göra? — O que a gente vai fazer?',
    }),
    seq('olhosTopo-reabrem', 'olhosTopo', 11.62, 0.16, [ch('scale.y', 0.08, 1)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-ska-vi-gora',
    contexto:
      "Planos e imprevistos: com amigos, parceiro ou filhos, quando aparece um tempo livre — fim de semana, feriado, dia de chuva: 'Vad ska vi göra i helgen?'. E também diante de um problema: 'Vad ska vi göra nu?' (e agora, o que a gente faz?). O molde 'Ska vi...?' é o convite sueco: 'Ska vi äta?', 'Ska vi gå?'.",
    fraseFonte: 'O que a gente vai fazer?',
    fraseAlvo: 'Vad ska vi göra?',
    pronuncia:
      "va ska vi IÖÖ-ra? ('vad' = VÁ, o D não soa; 'ska' seco, sem 'is' na frente; 'vi' curtinho e sem força; 'göra' leva a força: o G soa como I de ioga — nunca G duro nem J chiado —, Ö LONGO, com língua de Ê e lábios em bico, R de um toque só e -a fraquinho)",
    ponteSonora:
      "VÁ! SKA... VIEIRA? (5 sílabas: va-ska-vi-IÖÖ-ra; a força toda no IÖÖ; VÁ é o MESMO 'vad' de 'VÁ, CÜL!', 'VÁ! É CLÓ-CAN' e 'Vad gör du i helgen?' — um grito SEM R e sem D: com R vira 'var' (onde), que nas cartas é sempre a VARA; SKA = o MESMO SKA da bandinha jamaicana de 'Ska vi säga imorgon klockan tre?' e do grilo de 'Var ska jag byta?' — aqui é a cauda da arraia batendo na concha no contratempo do ska —, colado, sem 'is' na frente, curto e sem força; VIEIRA = 'vi göra' inteiro, em TRÊS batidas — sem engolir o VI num 'viê-ra' de duas —, dito como todo brasileiro fala 'feira' e 'cadeira' no dia a dia: vi-Ê-ra, sem o I depois do Ê; o VI é o 'vi' (nós), o mesmo VI de 'Vi ses!', curto e sem força; entre o VI e o Ê a boca põe sozinha um I de IOGA — é ele o G de 'göra', que soa I (nunca G duro, nunca J chiado); o Ê leva a força, fica LONGO e ganha BICO: língua no Ê, lábios de beijo — isso é o ö, o mesmo do IÔRA da coruja de 'Jag måste göra en felanmälan' (lá se chega pelo Ô com língua de Ê, aqui pelo Ê com bico: dá no mesmo lugar); R de um toque só, de 'cara', e o -A final fraquinho mas OBRIGATÓRIO: sem ele sobra 'gör', o rangido da manivela de 'Det gör ont här' — e depois de 'ska' o verbo vem inteiro)",
    historia:
      'Domingo de chuva no fundo do mar, e ninguém da turma sabe o que fazer. A arraia, cansada de ficar deitada na areia, bate as asas, levanta um redemoinho e grita VÁ! — e vai consultar o oráculo do recife, a VIEIRA gigante, que só abre com música. Ela bate a cauda na concha no contratempo do ska — SKA! SKA! SKA! — e a vieira vai se abrindo devagar: SKA... VIEIRA? Lá dentro, a fileira de olhinhos azuis da vieira só pisca de volta, sem resposta: nem o oráculo sabe o que a gente vai fazer.',
  },
  createScene,
  refine: { organic: ['arraia'] },
}

export default card
