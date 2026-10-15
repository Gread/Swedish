import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag är på väg." — IÁ! É... PÔ, (na)VÉÉG(a)!
 *
 * A lagosta capitã está a caminho DE BARCO, só que NA RODOVIA: o barquinho a
 * vela vem pelo meio da pista, empaca no asfalto seco cuspindo faísca, ela
 * bate a garra no timão e berra NAVEGA! — e o barco dispara pela faixa
 * enquanto a outra garra responde a mensagem no celular.
 *
 * Diorama: disco de asfalto com faixa tracejada, acostamento de grama atrás
 * com guard-rail e a placa azul VÄG; barco vermelho-tijolo de través,
 * proa para a direita da câmera; lagosta vermelho-viva (o acento) no timão.
 */

const TERRA = '#3a342b'
const ASFALTO = '#43474d'
const FAIXA = '#ece8dc'
const GRAMA = '#6e8a4b'
const GRAMA_ESC = '#55703a'
const CONCRETO = '#aaa79d'
const ACO = '#c4cad0'
const ACO_ESC = '#8c949b'
const AZUL = '#2a5ea6'
const BRANCO = '#f5f3ee'
const TIJOLO = '#a24b38'
const TIJOLO_ESC = '#7c3628'
const CREME = '#efe4cb'
const CONVES = '#c8995c'
const CONVES_ESC = '#a47640'
const MASTRO = '#dac69c'
const VELA = '#f6f2e7'
const MADEIRA = '#8b5a31'
const MADEIRA_ESC = '#5e3c21'
const LAG = '#e23f1f' // acento saturado RESERVADO: a lagosta capitã
const LAG_ESC = '#b02d17'
const LAG_CLARO = '#f39b6b'
const BARRIGA = '#f5845a' // placas da barriga: mais claras, mas ainda casca
const PRETO = '#1f2226'
const OURO = '#cfa84a'
const TELA = '#c3f2c6'
const FAISCA = '#ffc81f'

const R = 2.58 // raio do disco de asfalto
const GY = 0.16 // topo do asfalto
const ZV = 1.3 // acostamento de grama para z < -ZV
const VY = GY + 0.05 // topo da grama

// barco: comprimento, boca, pontal
const L = 2.4
const B = 0.96
const D = 0.42
const YAW = -0.3 // proa para a direita e um pouco para a câmera
const ZB = -0.32
const XS_FINAL = -0.78 // x da popa na pose final
const XS_PRESO = -1.82 // onde ele empaca raspando
const XS_FORA = -5.4 // entra pela esquerda
const TILT = 0.04 // proa empinada na arrancada

const CAM: [number, number, number] = [0.8, 2.66, 4.8]

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Capsula ligando dois pontos (braços, pernas, hastes). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const len = a.distanceTo(b)
  const m = capsule(r, Math.max(0.001, len), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize())
  return m
}

function shadedMesh(geo: THREE.BufferGeometry, material: THREE.Material) {
  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

// ---- casco torneado à mão: seções em U da popa (t=0) à proa (t=1) ----------
const halfBeam = (t: number) => {
  if (t <= 0.5) return (B / 2) * (0.8 + 0.2 * Math.sin((t / 0.5) * (Math.PI / 2)))
  const u = (t - 0.5) / 0.5
  return (B / 2) * Math.pow(Math.max(0, 1 - u * u), 0.6)
}
const keelDepth = (t: number) => (t < 0.55 ? D : D * (1 - 0.7 * Math.pow((t - 0.55) / 0.45, 2)))
const BILGE = 0.55 // expoente do bojo: < 1 deixa o casco cheio

function hullGeometries() {
  const NS = 32
  const NC = 18
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= NS; i++) {
    const t = i / NS
    const x = -L / 2 + t * L
    const b = halfBeam(t)
    const k = keelDepth(t)
    for (let j = 0; j <= NC; j++) {
      const phi = -Math.PI / 2 + (Math.PI * j) / NC
      pos.push(x, -k * Math.pow(Math.max(0, Math.cos(phi)), BILGE), b * Math.sin(phi))
      uv.push(t * 2.4, j / NC)
    }
  }
  for (let i = 0; i < NS; i++) {
    for (let j = 0; j < NC; j++) {
      const a = i * (NC + 1) + j
      const b = a + NC + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const shell = new THREE.BufferGeometry()
  shell.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  shell.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  shell.setIndex(idx)
  shell.computeVertexNormals()

  // espelho de popa: leque plano fechando a seção t=0
  const tp: number[] = [-L / 2, -keelDepth(0) * 0.45, 0]
  const tuv: number[] = [0.5, 0.5]
  const ti: number[] = []
  for (let j = 0; j <= NC; j++) {
    const phi = -Math.PI / 2 + (Math.PI * j) / NC
    const y = -keelDepth(0) * Math.pow(Math.max(0, Math.cos(phi)), BILGE)
    const z = halfBeam(0) * Math.sin(phi)
    tp.push(-L / 2, y, z)
    tuv.push(0.5 + z, 0.5 + y)
  }
  for (let j = 1; j <= NC; j++) ti.push(0, j, j + 1)
  ti.push(0, NC + 1, 1)
  const transom = new THREE.BufferGeometry()
  transom.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3))
  transom.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2))
  transom.setIndex(ti)
  transom.computeVertexNormals()
  return { shell, transom }
}

/** Contorno do convés (popa → proa por um bordo, volta pelo outro). */
function deckOutline(scale = 1, n = 32) {
  const pts: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    pts.push([-L / 2 + t * L, -halfBeam(t) * scale])
  }
  for (let i = n - 1; i >= 0; i--) {
    const t = i / n
    pts.push([-L / 2 + t * L, halfBeam(t) * scale])
  }
  return pts
}

/** Vela: triângulo em grade, estufado no meio (zero nas bordas). */
function sailGeometry(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, bulge: THREE.Vector3, n = 14) {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const id: number[][] = []
  let k = 0
  for (let i = 0; i <= n; i++) {
    id.push([])
    for (let j = 0; j <= n - i; j++) {
      const u = i / n
      const v = j / n
      const w = 1 - u - v
      const s = 27 * u * v * w
      const p = a.clone().multiplyScalar(w).addScaledVector(b, u).addScaledVector(c, v).addScaledVector(bulge, s)
      pos.push(p.x, p.y, p.z)
      uv.push(u, v)
      id[i].push(k++)
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i; j++) {
      idx.push(id[i][j], id[i + 1][j], id[i][j + 1])
      if (j < n - i - 1) idx.push(id[i + 1][j], id[i + 1][j + 1], id[i][j + 1])
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Tubo afinando de r0 a r1 ao longo da curva (antenas). */
function taperedTube(points: THREE.Vector3[], r0: number, r1: number, color: string) {
  const curve = new THREE.CatmullRomCurve3(points)
  const seg = 48
  const rad = 8
  const g = new THREE.TubeGeometry(curve, seg, 1, rad, false)
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
  return shadedMesh(g, mat(color, { roughness: 0.45, size: 0.3 }))
}

function starGeometry(rOut: number, rIn: number, depth: number) {
  const s = new THREE.Shape()
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? rOut : rIn
    const a = Math.PI / 2 + (k * Math.PI) / 5
    if (k === 0) s.moveTo(r * Math.cos(a), r * Math.sin(a))
    else s.lineTo(r * Math.cos(a), r * Math.sin(a))
  }
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.5,
    bevelSize: rOut * 0.1,
    bevelSegments: 2,
  })
  g.center()
  return g
}

/** Traço de letra da placa: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.008, BRANCO, { roughness: 0.4 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** V Ä G — letras de traço grosso. */
function letter(which: 'V' | 'Ä' | 'G') {
  const g = new THREE.Group()
  const t = 0.05
  if (which === 'V') {
    g.add(stroke(t, 0.25, -0.046, 0, 0.39))
    g.add(stroke(t, 0.25, 0.046, 0, -0.39))
  } else if (which === 'Ä') {
    g.add(stroke(t, 0.25, -0.046, 0, -0.39))
    g.add(stroke(t, 0.25, 0.046, 0, 0.39))
    g.add(stroke(0.1, 0.04, 0, -0.035))
    g.add(stroke(0.045, 0.045, -0.05, 0.17))
    g.add(stroke(0.045, 0.045, 0.05, 0.17))
  } else {
    g.add(stroke(t, 0.22, -0.075, 0))
    g.add(stroke(0.17, t, 0, 0.088))
    g.add(stroke(0.17, t, 0, -0.088))
    g.add(stroke(t, 0.11, 0.075, -0.044))
    g.add(stroke(0.08, 0.042, 0.045, -0.005))
  }
  return g
}

/**
 * Garra de lagosta no espaço da peça (origem = ombro): braço, cotovelo,
 * carpo e a pinça (palma ovalada + dedo fixo + dedo móvel entreaberto).
 * `dir` aponta da munheca para a ponta dos dedos; `up` define o plano da pinça.
 */
const CLAW = 1.3 // pinça grande: garra de lagosta tem que ser exagerada

function makeClaw(
  S: THREE.Vector3, E: THREE.Vector3, W: THREE.Vector3, dir: THREE.Vector3, up: THREE.Vector3, open = 0.32,
) {
  const g = new THREE.Group()
  g.position.copy(S)
  const e = E.clone().sub(S)
  const w = W.clone().sub(S)
  g.add(limb(V(0, 0, 0), e, 0.07, LAG, { roughness: 0.42 }))
  const cotovelo = sphere(0.088, LAG, { roughness: 0.42 })
  cotovelo.position.copy(e)
  g.add(cotovelo)
  g.add(limb(e, w, 0.085, LAG, { roughness: 0.42 }))

  const pinca = new THREE.Group()
  pinca.position.copy(w)
  const z = dir.clone().normalize()
  const x = up.clone().cross(z).normalize()
  const y = z.clone().cross(x).normalize()
  pinca.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
  pinca.scale.setScalar(CLAW)
  g.add(pinca)

  const palma = sphere(0.14, LAG, { roughness: 0.4 })
  palma.scale.set(0.85, 0.66, 1.5)
  palma.position.z = 0.17
  pinca.add(palma)

  const fixo = cone(0.075, 0.3, LAG, { roughness: 0.4 })
  fixo.rotation.x = Math.PI / 2 + 0.1
  fixo.position.set(0, -0.045, 0.43)
  fixo.scale.x = 0.85
  pinca.add(fixo)

  const movel = cone(0.068, 0.28, LAG, { roughness: 0.4 })
  movel.rotation.x = Math.PI / 2 - open
  movel.position.set(0, 0.07, 0.41)
  movel.scale.x = 0.85
  pinca.add(movel)

  // dentinhos claros na face interna dos dedos
  for (const [dy, dz] of [[-0.015, 0.36], [-0.012, 0.44], [0.04, 0.35], [0.05, 0.43]] as const) {
    const dente = sphere(0.018, LAG_CLARO, { roughness: 0.5 })
    dente.position.set(0, dy, dz)
    pinca.add(dente)
  }
  return { garra: g, pinca }
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base: rodovia -------------------------------------------------------
  const base = new THREE.Group()

  const terra = cylinder(2.62, 2.72, 0.12, TERRA, { roughness: 0.95 })
  terra.position.y = 0.06
  base.add(terra)

  const asfalto = cylinder(R, 2.62, 0.05, ASFALTO, { roughness: 0.93 })
  asfalto.position.y = GY - 0.025
  base.add(asfalto)

  // acostamento de grama: segmento do disco atrás do meio-fio
  const a0 = Math.asin(ZV / R)
  const seg = new THREE.Shape()
  seg.moveTo(R * Math.cos(a0), ZV)
  seg.absarc(0, 0, R, a0, Math.PI - a0, false)
  seg.lineTo(R * Math.cos(a0), ZV)
  const segGeo = new THREE.ExtrudeGeometry(seg, { depth: 0.05, bevelEnabled: false, curveSegments: 48 })
  segGeo.rotateX(-Math.PI / 2)
  const grama = shadedMesh(segGeo, mat(GRAMA, { roughness: 0.95 }))
  grama.position.y = GY
  base.add(grama)

  const chord = (z: number) => Math.sqrt(Math.max(0, R * R - z * z))

  const meioFio = rbox(chord(ZV) * 2 - 0.04, 0.08, 0.1, 0.03, CONCRETO, { roughness: 0.85 })
  meioFio.position.set(0, GY + 0.035, -ZV)
  base.add(meioFio)

  // tufos e pedrinhas no acostamento
  for (const [tx, tz, tr] of [[-2.0, -1.55, 0.13], [0.95, -1.95, 0.15], [1.85, -1.5, 0.12], [-0.4, -2.2, 0.11]] as const) {
    const tufo = puff(tr, rand() > 0.5 ? GRAMA_ESC : GRAMA, 5, Math.floor(rand() * 90), { roughness: 0.95 })
    tufo.position.set(tx, VY + tr * 0.4, tz)
    tufo.scale.y = 0.6
    base.add(tufo)
  }

  // faixas: tracejada no meio, contínuas nas bordas
  const ZC = 0.02
  for (let x = -2.4; x <= 2.4; x += 0.82) {
    if (Math.abs(x) + 0.26 > chord(ZC) - 0.12) continue
    const traco = rbox(0.5, 0.012, 0.085, 0.004, FAIXA, { roughness: 0.6 })
    traco.position.set(x, GY + 0.006, ZC)
    base.add(traco)
  }
  for (const z of [-ZV + 0.17, 1.72]) {
    const borda = rbox(chord(z) * 2 - 0.3, 0.012, 0.07, 0.004, FAIXA, { roughness: 0.6 })
    borda.position.set(0, GY + 0.006, z)
    base.add(borda)
  }

  root.add(base)

  // ---- guard-rail ----------------------------------------------------------
  const guardrail = new THREE.Group()
  const ZG = -1.52
  const GL = chord(ZG) * 2 - 0.5
  const RY = VY + 0.4
  const lamina = rbox(GL, 0.22, 0.05, 0.02, ACO, { roughness: 0.28, metalness: 0.75 })
  lamina.position.set(0, RY, ZG)
  guardrail.add(lamina)
  for (const dy of [-0.055, 0.055]) {
    const nervura = cylinder(0.03, 0.03, GL, ACO, { roughness: 0.28, metalness: 0.75 })
    nervura.rotation.z = Math.PI / 2
    nervura.position.set(0, RY + dy, ZG + 0.03)
    guardrail.add(nervura)
  }
  for (const side of [-1, 1]) {
    const ponta = sphere(0.13, ACO, { roughness: 0.28, metalness: 0.75 })
    ponta.scale.set(0.45, 0.85, 0.5)
    ponta.position.set(side * GL / 2, RY, ZG)
    guardrail.add(ponta)
  }
  for (let px = -GL / 2 + 0.2; px <= GL / 2 - 0.1; px += 0.6) {
    const poste = rbox(0.07, 0.48, 0.07, 0.015, ACO_ESC, { roughness: 0.35, metalness: 0.7 })
    poste.position.set(px, VY + 0.24, ZG - 0.07)
    guardrail.add(poste)
    const parafuso = sphere(0.022, ACO_ESC, { roughness: 0.3, metalness: 0.8 })
    parafuso.position.set(px, RY, ZG + 0.06)
    guardrail.add(parafuso)
  }
  root.add(guardrail)

  // ---- placa azul de rodovia: seta pra frente + VÄG ------------------------
  const placa = new THREE.Group()
  placa.position.set(-1.8, VY, -1.38)
  placa.rotation.y = 0.4
  root.add(placa)

  const PH = 1.62 // centro da placa
  for (const side of [-1, 1]) {
    const haste = cylinder(0.035, 0.035, PH, ACO_ESC, { roughness: 0.35, metalness: 0.7 })
    haste.position.set(side * 0.3, PH / 2, -0.04)
    placa.add(haste)
  }
  const chapa = rbox(1.02, 0.76, 0.05, 0.05, AZUL, { roughness: 0.4 })
  chapa.position.y = PH
  placa.add(chapa)
  const face = new THREE.Group()
  face.position.set(0, PH, 0.027)
  placa.add(face)
  // filete branco
  for (const [w, h, x, y] of [
    [0.9, 0.03, 0, 0.32], [0.9, 0.03, 0, -0.32], [0.03, 0.64, 0.45, 0], [0.03, 0.64, -0.45, 0],
  ] as const) {
    face.add(stroke(w, h, x, y))
  }
  // seta → (para onde o barco vai)
  face.add(stroke(0.42, 0.075, -0.06, 0.14))
  face.add(stroke(0.2, 0.075, 0.13, 0.195, -0.72))
  face.add(stroke(0.2, 0.075, 0.13, 0.085, 0.72))
  // VÄG
  for (const [glyph, lx] of [['V', -0.22], ['Ä', 0], ['G', 0.22]] as const) {
    const l = letter(glyph)
    l.position.set(lx, -0.14, 0)
    face.add(l)
  }

  // ---- barco: casco vermelho-tijolo ----------------------------------------
  // origem do casco = quilha na popa: a arrancada empina a proa e a popa raspa
  const casco = new THREE.Group()
  casco.position.set(XS_FINAL, GY, ZB)
  casco.rotation.set(0, YAW, TILT)
  root.add(casco)

  const barco = new THREE.Group() // origem no meio do convés
  barco.position.set(L / 2, D, 0)
  casco.add(barco)

  const { shell, transom } = hullGeometries()
  const corMat = mat(TIJOLO, { roughness: 0.5, size: 1.2 })
  barco.add(shadedMesh(shell, corMat))
  barco.add(shadedMesh(transom, corMat))

  // convés de tábuas
  const deckShape = new THREE.Shape()
  deckOutline(0.97).forEach(([x, z], i) => (i === 0 ? deckShape.moveTo(x, z) : deckShape.lineTo(x, z)))
  const deckGeo = new THREE.ExtrudeGeometry(deckShape, { depth: 0.03, bevelEnabled: false })
  deckGeo.rotateX(-Math.PI / 2)
  const conves = shadedMesh(deckGeo, mat(CONVES, { roughness: 0.6, size: 1 }))
  conves.position.y = -0.01
  barco.add(conves)
  for (const z of [-0.27, -0.09, 0.09, 0.27]) {
    let xEnd = -L / 2
    for (let t = 0; t <= 1; t += 0.01) if (halfBeam(t) * 0.95 > Math.abs(z) + 0.03) xEnd = -L / 2 + t * L
    const len = xEnd - (-L / 2) - 0.06
    const fresta = rbox(len, 0.008, 0.014, 0.004, CONVES_ESC, { roughness: 0.7 })
    fresta.position.set(-L / 2 + 0.03 + len / 2, 0.021, z)
    barco.add(fresta)
  }

  // amurada creme contornando o convés
  const borda: THREE.Vector3[] = []
  for (let i = 0; i <= 40; i++) borda.push(V(-L / 2 + (i / 40) * L, 0.03, -halfBeam(i / 40)))
  for (let i = 39; i >= 1; i--) borda.push(V(-L / 2 + (i / 40) * L, 0.03, halfBeam(i / 40)))
  const amurada = shadedMesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(borda, true, 'centripetal'), 220, 0.038, 10, true),
    mat(CREME, { roughness: 0.45, size: 0.3 }),
  )
  barco.add(amurada)

  // friso creme no costado (linha d'água de brinquedo)
  const cosPhi = Math.pow(0.45, 1 / BILGE)
  const sinPhi = Math.sqrt(1 - cosPhi * cosPhi)
  for (const side of [-1, 1]) {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 36; i++) {
      const t = (i / 36) * 0.96
      pts.push(V(-L / 2 + t * L + 0.01, -keelDepth(t) * 0.45, side * (halfBeam(t) * sinPhi + 0.008)))
    }
    barco.add(shadedMesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.026, 8, false),
      mat(CREME, { roughness: 0.45, size: 0.3 }),
    ))
  }

  // quilha escura (é ela que raspa no asfalto)
  const quilha = rbox(L * 0.6, 0.06, 0.06, 0.025, TIJOLO_ESC, { roughness: 0.6 })
  quilha.position.set(-L / 2 + L * 0.3 + 0.02, -D + 0.022, 0)
  barco.add(quilha)

  // escotilhas redondas no bordo da câmera
  for (const px of [0.05, 0.42]) {
    const t = (px + L / 2) / L
    const yy = -0.15
    const cp = Math.pow(Math.min(1, -yy / keelDepth(t)), 1 / BILGE)
    const zz = halfBeam(t) * Math.sqrt(1 - cp * cp)
    const aro = torus(0.06, 0.017, CREME, { roughness: 0.4 })
    aro.position.set(px, yy, zz + 0.005)
    barco.add(aro)
    const vidro = sphere(0.052, '#2d3b48', { roughness: 0.15 })
    vidro.scale.z = 0.35
    vidro.position.set(px, yy, zz)
    barco.add(vidro)
  }

  // ---- mastro + vela estufada ----------------------------------------------
  const MX = 0.45
  const vela = new THREE.Group()
  vela.position.set(MX, 0, 0.0)
  barco.add(vela)

  const mastro = cylinder(0.042, 0.05, 2.0, MASTRO, { roughness: 0.55 })
  mastro.position.y = 1.0
  vela.add(mastro)
  const topo = sphere(0.06, MASTRO, { roughness: 0.55 })
  topo.position.y = 2.01
  vela.add(topo)

  const tack = V(0.06, 0.34, 0)
  const head = V(0.06, 1.9, 0)
  const clew = V(0.68, 0.37, 0)
  const pano = shadedMesh(
    sailGeometry(tack, head, clew, V(0, 0, 0.26)),
    Object.assign(mat(VELA, { roughness: 0.85, detail: 0.6, size: 1.5 }), { side: THREE.DoubleSide }),
  )
  vela.add(pano)
  for (const [p, q] of [[tack, head], [head, clew], [clew, tack]] as const) {
    vela.add(limb(p, q, 0.018, '#e2d9c4', { roughness: 0.8 }))
  }
  const retranca = cylinder(0.032, 0.032, 0.72, MASTRO, { roughness: 0.55 })
  retranca.rotation.z = Math.PI / 2
  retranca.position.set(0.36, 0.33, 0)
  vela.add(retranca)

  // flâmula no topo, esticada pra trás pelo vento
  const flamula = shadedMesh(
    sailGeometry(V(0, 2.07, 0), V(0, 1.93, 0), V(-0.34, 2.02, 0), V(0, 0, 0.02), 4),
    Object.assign(mat(AZUL, { roughness: 0.7, detail: 0 }), { side: THREE.DoubleSide }),
  )
  vela.add(flamula)

  // ---- lagosta: lugar no convés --------------------------------------------
  const LS = 1.2 // escala da lagosta (protagonista grande)
  const LY = 0.9 // vira 3/4 para a câmera
  const LPOS = V(-0.55, 0.01, -0.05)
  /** ponto no espaço da lagosta → espaço do barco */
  const lagToBarco = (x: number, y: number, z: number) => {
    const c = Math.cos(LY)
    const s = Math.sin(LY)
    return V(LPOS.x + LS * (x * c + z * s), LPOS.y + LS * y, LPOS.z + LS * (-x * s + z * c))
  }

  // ---- timão (peça própria: gira na hora do NAVEGA) ------------------------
  const WYAW = 1.05
  const AX = V(Math.sin(WYAW), 0, Math.cos(WYAW)) // eixo do timão (no barco)
  const WC = lagToBarco(0.34, 0, 0.5).setY(0.72)
  const WR = 0.28

  // coluna fina sob o cubo (não esconde a lagosta)
  const coluna = cylinder(0.035, 0.045, 0.7, MADEIRA_ESC, { roughness: 0.6 })
  const COL = WC.clone().addScaledVector(AX, 0.07)
  coluna.position.set(COL.x, 0.35, COL.z)
  barco.add(coluna)
  const sapata = cylinder(0.09, 0.1, 0.04, MADEIRA_ESC, { roughness: 0.6 })
  sapata.position.set(COL.x, 0.03, COL.z)
  barco.add(sapata)
  const eixo = cylinder(0.025, 0.025, 0.12, OURO, { roughness: 0.3, metalness: 0.7 })
  eixo.position.copy(WC.clone().addScaledVector(AX, 0.05))
  eixo.quaternion.setFromUnitVectors(V(0, 1, 0), AX)
  barco.add(eixo)

  const timao = new THREE.Group()
  timao.position.copy(WC)
  timao.rotation.set(0, WYAW, -2 * Math.PI)
  barco.add(timao)
  const aroT = torus(WR, 0.034, MADEIRA, { roughness: 0.5 })
  timao.add(aroT)
  const aroI = torus(0.1, 0.022, MADEIRA, { roughness: 0.5 })
  timao.add(aroI)
  for (let i = 0; i < 4; i++) {
    const raio = rbox(0.03, 2 * (WR + 0.08), 0.03, 0.012, MADEIRA, { roughness: 0.5 })
    raio.rotation.z = (i * Math.PI) / 4
    timao.add(raio)
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const pega = capsule(0.03, 0.06, MADEIRA_ESC, { roughness: 0.5 })
    pega.position.set(-Math.sin(a) * (WR + 0.1), Math.cos(a) * (WR + 0.1), 0)
    pega.rotation.z = a
    timao.add(pega)
  }
  const cubo = cylinder(0.06, 0.06, 0.08, MADEIRA_ESC, { roughness: 0.5 })
  cubo.rotation.x = Math.PI / 2
  timao.add(cubo)
  const tampa = sphere(0.035, OURO, { roughness: 0.3, metalness: 0.7 })
  tampa.position.z = -0.045
  timao.add(tampa)

  // ---- LAGOSTA capitã -------------------------------------------------------
  const lagosta = new THREE.Group()
  lagosta.position.copy(LPOS)
  lagosta.rotation.y = LY
  lagosta.scale.setScalar(LS)
  barco.add(lagosta)

  const casca = { roughness: 0.4 }

  // cauda segmentada: desce do tórax e dobra pra trás até o leque no convés
  for (const [y, z, r] of [
    [0.42, -0.02, 0.2], [0.29, -0.09, 0.18], [0.19, -0.16, 0.16], [0.12, -0.24, 0.135], [0.08, -0.31, 0.11],
  ] as const) {
    const anel = sphere(r, LAG, casca)
    anel.scale.set(1, 0.72, 0.95)
    anel.position.set(0, y, z)
    lagosta.add(anel)
  }
  for (const s of [-1, 0, 1]) {
    const leque = sphere(0.08, LAG_ESC, casca)
    leque.scale.set(0.75, 0.24, 1.3)
    leque.position.set(s * 0.085, 0.04, -0.42 + Math.abs(s) * 0.03)
    leque.rotation.y = -s * 0.45
    lagosta.add(leque)
  }

  // tórax (carapaça) + cabeça + rostro
  const torax = capsule(0.25, 0.42, LAG, casca)
  torax.scale.z = 0.92
  torax.position.y = 0.82
  lagosta.add(torax)

  // placas da barriga: faixas claras separadas (pequenas = ficam nítidas no refino)
  for (const [i, y] of [0.6, 0.692, 0.784, 0.876, 0.962].entries()) {
    const w = [0.12, 0.16, 0.17, 0.16, 0.13][i]
    const placaV = capsule(0.043, w, BARRIGA, { roughness: 0.42 })
    placaV.rotation.z = Math.PI / 2
    placaV.scale.set(1, 1, 0.45)
    placaV.position.set(0, y, 0.228)
    lagosta.add(placaV)
  }

  const cabeca = sphere(0.21, LAG, casca)
  cabeca.scale.set(1, 0.95, 1.05)
  cabeca.position.set(0, 1.28, 0.06)
  lagosta.add(cabeca)

  const rostro = cone(0.045, 0.15, LAG_ESC, casca)
  rostro.position.set(0, 1.42, 0.22)
  rostro.rotation.x = 0.7
  lagosta.add(rostro)

  // boca escancarada no berro (lábio escuro + língua)
  const boca = sphere(0.072, '#3e120c', { roughness: 0.6 })
  boca.scale.set(1.4, 1.05, 0.5)
  boca.position.set(0, 1.215, 0.282)
  lagosta.add(boca)
  const labio = torus(0.072, 0.017, LAG_ESC, casca)
  labio.scale.set(1.4, 1.05, 1)
  labio.position.set(0, 1.215, 0.3)
  lagosta.add(labio)
  const lingua = sphere(0.04, '#e0707a', { roughness: 0.4 })
  lingua.scale.set(1.5, 0.6, 0.6)
  lingua.position.set(0, 1.182, 0.298)
  lagosta.add(lingua)

  // olhos em pedúnculos + sobrancelhas de comando
  for (const side of [-1, 1]) {
    lagosta.add(limb(V(side * 0.06, 1.41, 0.2), V(side * 0.1, 1.5, 0.245), 0.03, LAG_ESC, casca))
    const olho = sphere(0.075, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.105, 1.535, 0.26)
    lagosta.add(olho)
    const pupila = sphere(0.038, '#141414', { roughness: 0.2 })
    pupila.position.set(side * 0.105 - 0.014, 1.535, 0.322)
    lagosta.add(pupila)
    const brilho = sphere(0.012, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.105 - 0.002, 1.552, 0.354)
    lagosta.add(brilho)
    const sobr = capsule(0.019, 0.08, LAG_ESC, casca)
    sobr.position.set(side * 0.108, 1.628, 0.285)
    sobr.rotation.z = -side * (Math.PI / 2 - 0.42)
    lagosta.add(sobr)
  }

  // patinhas de andar apoiadas no convés
  for (const side of [-1, 1]) {
    for (let k = 0; k < 2; k++) {
      lagosta.add(limb(
        V(side * 0.18, 0.46 - k * 0.03, 0.08 - k * 0.12),
        V(side * 0.28, 0.035, 0.15 - k * 0.15),
        0.033, LAG_ESC, casca,
      ))
    }
  }

  // ---- quepe de capitã -------------------------------------------------------
  const QY = 1.53
  const quepe = new THREE.Group()
  quepe.position.set(0, QY, -0.1)
  quepe.rotation.x = -0.2
  lagosta.add(quepe)
  const copa = lathe(
    [[0, 0], [0.2, 0], [0.205, 0.05], [0.25, 0.13], [0.258, 0.16], [0.225, 0.19], [0, 0.192]],
    BRANCO,
    { roughness: 0.55 },
  )
  quepe.add(copa)
  const fita = cylinder(0.207, 0.207, 0.06, PRETO, { roughness: 0.5 })
  fita.position.y = 0.032
  quepe.add(fita)
  const aba = sphere(0.17, PRETO, { roughness: 0.22 })
  aba.scale.set(1, 0.13, 0.6)
  aba.position.set(0, 0.012, 0.17)
  aba.rotation.x = 0.22
  quepe.add(aba)
  const emblema = rbox(0.075, 0.055, 0.02, 0.012, OURO, { roughness: 0.3, metalness: 0.65 })
  emblema.position.set(0, 0.1, 0.23)
  emblema.rotation.x = -0.3
  quepe.add(emblema)

  // ---- antenas compridas, varridas pra trás pelo vento ----------------------
  // vento = sentido contrário ao barco (−x do barco), no espaço da lagosta
  const vento = V(-Math.cos(LY), 0, -Math.sin(LY))
  const antenas = new THREE.Group()
  antenas.position.set(0, 1.43, 0.24)
  lagosta.add(antenas)
  for (const side of [-1, 1]) {
    const s = V(side, 0, 0)
    const pts = [
      V(0, 0, 0).addScaledVector(s, 0.04),
      V(0, 0.16, 0.1).addScaledVector(s, 0.08),
      V(0, 0.32, 0).addScaledVector(vento, 0.22).addScaledVector(s, 0.12),
      V(0, 0.38, 0).addScaledVector(vento, 0.56).addScaledVector(s, 0.14),
      V(0, 0.32, 0).addScaledVector(vento, 0.9).addScaledVector(s, 0.12 + side * 0.04),
      V(0, 0.18, 0).addScaledVector(vento, 1.18).addScaledVector(s, 0.08 + side * 0.08),
    ]
    antenas.add(taperedTube(pts, 0.024, 0.008, LAG_ESC))
  }

  // ---- garras: posições calculadas na pose final ----------------------------
  root.updateMatrixWorld(true)
  const toLag = (p: THREE.Vector3) => lagosta.worldToLocal(p.clone())

  // garra do timão: pinça erguida que desce e morde o aro por cima
  const SR = V(0.25, 1.05, 0.08)
  const G = toLag(timao.localToWorld(V(0, WR, 0)))
  const eixoLag = toLag(timao.localToWorld(V(0, 0, 1))).sub(toLag(timao.localToWorld(V(0, 0, 0)))).normalize()
  const horiz = G.clone().sub(SR).setY(0).normalize()
  const dirT = horiz.clone().multiplyScalar(0.72).add(V(0, -0.7, 0)).normalize()
  const WT = G.clone().addScaledVector(dirT, -0.5 * CLAW)
  const ET = SR.clone().add(WT).multiplyScalar(0.5).add(V(0.13, -0.05, -0.04))
  const { garra: garraTimao } = makeClaw(SR, ET, WT, dirT, eixoLag, 0.45)
  lagosta.add(garraTimao)

  // garra do celular: pinça em pé segurando o aparelho pelas laterais
  const SL = V(-0.25, 1.05, 0.08)
  const camLag = toLag(V(...CAM))
  const P = V(-0.5, 1.12, 0.4)
  const n = camLag.clone().sub(P).normalize().lerp(V(0.5, 0, -0.3).normalize(), 0.3).normalize()
  const phoneY = V(-0.12, 1, 0).addScaledVector(n, -V(-0.12, 1, 0).dot(n)).normalize()
  const phoneX = phoneY.clone().cross(n).normalize()
  const WCel = P.clone().addScaledVector(phoneY, -(0.15 + 0.38 * CLAW))
  const ECel = SL.clone().add(WCel).multiplyScalar(0.5).add(V(-0.17, -0.02, -0.04))
  const { garra: garraCelular, pinca: pincaCel } = makeClaw(SL, ECel, WCel, phoneY, phoneX, 0.12)
  lagosta.add(garraCelular)

  const celular = new THREE.Group()
  const corpoCel = rbox(0.17, 0.3, 0.03, 0.03, '#2a2e35', { roughness: 0.3 })
  celular.add(corpoCel)
  const tela = rbox(0.145, 0.26, 0.01, 0.02, TELA, { roughness: 0.2, emissive: '#a8eeb0', emissiveIntensity: 0.35 })
  tela.position.z = 0.016
  celular.add(tela)
  for (const [bw, bx, by, cor] of [[0.09, -0.02, 0.07, '#ffffff'], [0.08, 0.025, 0.0, '#5fbf72'], [0.06, -0.03, -0.07, '#ffffff']] as const) {
    const balao = rbox(bw, 0.045, 0.008, 0.015, cor, { roughness: 0.4 })
    balao.position.set(bx, by, 0.022)
    celular.add(balao)
  }
  // posiciona no espaço da lagosta (tela para a câmera) e prende na pinça
  celular.position.copy(P)
  celular.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(phoneX, phoneY, n))
  lagosta.add(celular)
  root.updateMatrixWorld(true)
  pincaCel.attach(celular)

  // ---- faíscas: estrelinhas saltando de onde a popa raspa -------------------
  const faiscas = new THREE.Group()
  faiscas.position.set(0.12, 0.02, 0.2)
  faiscas.rotation.z = -TILT // compensa a empinada: o rastro fica rente ao chão
  casco.add(faiscas)
  const brasa = mat(FAISCA, { emissive: '#ff9f00', emissiveIntensity: 0.75, roughness: 0.4 })
  const rastroMat = mat('#ffd76a', { emissive: '#ffad2a', emissiveIntensity: 0.7, roughness: 0.4 })
  for (const [sx, sy, sz, r, rot] of [
    [-0.34, 0.38, 0.42, 0.16, 0.2],
    [-0.66, 0.62, 0.26, 0.13, -0.3],
    [-0.52, 0.2, 0.72, 0.11, 0.5],
    [0.0, 0.05, 0.1, 0.07, 0.1],
  ] as const) {
    const estrela = shadedMesh(starGeometry(r, r * 0.45, r * 0.3), brasa)
    estrela.castShadow = false
    estrela.position.set(sx, sy, sz)
    estrela.rotation.set(0, 0.5, rot)
    faiscas.add(estrela)
    if (r < 0.1) continue
    const p = V(sx, sy, sz)
    const rastro = limb(p.clone().multiplyScalar(0.2), p.clone().multiplyScalar(0.76), 0.013, '#ffd76a')
    rastro.material = rastroMat
    rastro.castShadow = false
    faiscas.add(rastro)
  }
  // risco claro no asfalto atrás da popa
  for (const dz of [-0.06, 0.06]) {
    const risco = rbox(1.1, 0.008, 0.035, 0.004, '#9a9a94', { roughness: 0.7 })
    risco.position.set(-0.6, -0.012, dz - 0.2)
    faiscas.add(risco)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'estrada', object: base },
    { name: 'guardrail', group: 'beira', object: guardrail },
    { name: 'placa', group: 'beira', object: placa },
    { name: 'casco', group: 'barco', object: casco },
    { name: 'vela', group: 'barco', object: vela },
    { name: 'timao', group: 'barco', object: timao },
    { name: 'lagosta', group: 'lagosta', object: lagosta },
    { name: 'quepe', group: 'lagosta', object: quepe },
    { name: 'antenas', group: 'lagosta', object: antenas },
    { name: 'garraTimao', group: 'lagosta', object: garraTimao },
    { name: 'garraCelular', group: 'lagosta', object: garraCelular },
    { name: 'faiscas', group: 'faisca', object: faiscas },
    { name: 'celular', group: 'resposta', object: celular },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Você manda mensagem: cadê você? Brota uma rodovia — asfalto escuro, faixa tracejada no meio.',
    }),
    seq('guardrail-rise', 'guardrail', 1.3, 0.7, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Na beira, guard-rail prateado e a placa azul da estrada, com a seta pra frente.',
    }),
    seq('placa-rise', 'placa', 1.5, 0.8, [ch('position.y', VY - 2.2, VY)], { ease: 'easeOut' }),

    seq('casco-entra', 'casco', 2.9, 1.2, [ch('position.x', XS_FORA, XS_PRESO)], {
      ease: 'easeOut',
      caption: 'Pelo meio da pista vem um barquinho a vela vermelho — de barco, só que NA RODOVIA.',
    }),
    seq('vela-ica', 'vela', 3.5, 0.7, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),
    seq('timao-cresce', 'timao', 3.75, 0.5, grow(), { ease: 'easeOut' }),

    seq('lagosta-sobe', 'lagosta', 4.8, 0.8, [riseFrom(0.01, 1.1)], {
      ease: 'easeOut',
      caption: 'No timão, a capitã: uma LAGOSTA vermelha de quepe, antenas ao vento.',
    }),
    seq('garraT-abre', 'garraTimao', 5.1, 0.5, grow(0.05), { ease: 'easeOut' }),
    seq('garraC-abre', 'garraCelular', 5.15, 0.5, grow(0.05), { ease: 'easeOut' }),
    seq('antenas-brotam', 'antenas', 5.3, 0.6, grow(), { ease: 'easeOut' }),
    seq('quepe-cai', 'quepe', 5.5, 0.55, [ch('position.y', QY + 0.55, QY), ch('rotation.y', 2.4, 0), ...grow(0.3)], {
      ease: 'easeOut',
    }),

    // empaca: tranco, chacoalha e cospe faísca
    seq('faiscas-pipocam', 'faiscas', 6.7, 0.3, grow(), {
      ease: 'easeOut',
      caption: 'Mas no asfalto seco o casco EMPACA — raspa e cospe faísca!',
    }),
    seq('casco-tranco-a', 'casco', 6.7, 0.14, [ch('rotation.x', 0, 0.05)]),
    seq('casco-tranco-b', 'casco', 6.84, 0.16, [ch('rotation.x', 0.05, -0.04)]),
    seq('casco-tranco-c', 'casco', 7.0, 0.16, [ch('rotation.x', -0.04, 0.025)]),
    seq('casco-tranco-d', 'casco', 7.16, 0.2, [ch('rotation.x', 0.025, 0)]),
    seq('faiscas-pulsa-a', 'faiscas', 7.1, 0.25, grow(1).map((c) => ({ ...c, from: 1, to: 1.2 }))),
    seq('faiscas-pulsa-b', 'faiscas', 7.35, 0.3, grow(1).map((c) => ({ ...c, from: 1.2, to: 1 }))),

    // a garra ergue e BATE no timão
    seq('garraT-ergue', 'garraTimao', 8.3, 0.45, [ch('rotation.x', 0, -0.95)], {
      ease: 'easeOut',
      caption: 'Ela bate a garra no timão e berra: IÁ! É... PÔ, (na)VÉÉG(a)!',
    }),
    seq('garraT-bate', 'garraTimao', 8.85, 0.16, [ch('rotation.x', -0.95, 0)], { ease: 'easeIn' }),
    seq('timao-gira', 'timao', 9.0, 1.0, [ch('rotation.z', 0, -2 * Math.PI)], { ease: 'easeOut' }),

    // e o barco obedece: dispara pela faixa
    seq('casco-dispara', 'casco', 9.05, 0.75, [ch('position.x', XS_PRESO, XS_FINAL), ch('rotation.z', 0, TILT)], {
      ease: 'easeOut',
      caption: 'E o barco obedece: dispara pela faixa, deslizando como se a estrada fosse mar.',
    }),
    seq('vela-estufa', 'vela', 9.05, 0.5, [ch('scale.z', 0.35, 1)], { ease: 'easeOut' }),

    // com a outra garra, responde a mensagem
    seq('garraC-ergue', 'garraCelular', 10.5, 0.6, [ch('rotation.x', 0.55, 0)], {
      ease: 'easeOut',
      caption: 'Com a outra garra, ela responde a mensagem no celular…',
    }),
    seq('celular-aparece', 'celular', 10.6, 0.45, grow(), { ease: 'easeOut' }),

    seq('faiscas-final-a', 'faiscas', 11.8, 0.25, grow(1).map((c) => ({ ...c, from: 1, to: 1.25 })), {
      caption: 'Jag är på väg. — Estou a caminho.',
    }),
    seq('faiscas-final-b', 'faiscas', 12.05, 0.35, grow(1).map((c) => ({ ...c, from: 1.25, to: 1 }))),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [0.1, 1.42, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-pa-vag',
    contexto:
      "SMS ou telefone: resposta a 'Var är du?' ou 'Kommer du?' — indo pro trabalho, buscando as crianças, chegando atrasado na fika ou no jantar.",
    fraseFonte: 'Estou a caminho.',
    fraseAlvo: 'Jag är på väg.',
    pronuncia:
      "iá é pô VÉÉG ('jag' = iá; 'är' = é aberto e curto — na fala, quase só 'e'; 'på' = pô de boca redonda, Ô fechado; 'väg' com Ä LONGO e bem aberto, de 'pé', e G seco no fim, sem 'gui'; força no VÄG)",
    ponteSonora:
      "IÁ! É... PÔ, (na)VÉÉG(a)! (4 sílabas: iá-é-pô-VÉÉG; força no VÉÉG; IÁ É é o 'jag är' de sempre — o MESMO de 'Jag är trött' e 'Jag är hungrig': I de ioga, nunca J chiado, e É aberto e curto; PÔ = o 'pô!' brasileiro, o MESMO PÔ de 'Grattis på födelsedagen' e 'Kan du skicka det på mejl?': Ô FECHADO de boca redonda, nunca 'pó'; VÉÉG = NAVEGA sem o NA e sem o -A: do 'na-VÉ-ga' sobra só a sílaba forte, que já vem com o É ABERTO certo — é só esticar, LONGO — e o G SECO no fim, de 'gato', sem soltar 'gui'; se o -a ficar vira 'väga' (pesar), e com Ê fechado o 'ä' se perde; e a pista da cena É a 'väg' — 'väg' é estrada: o barco NAVEGA na väg, e 'på väg' é, ao pé da letra, 'na estrada', a caminho)",
    historia:
      'Você manda mensagem: cadê você? A lagosta de quepe de capitã já está a caminho — de barco, só que NA RODOVIA: o barquinho a vela vem pelo meio da pista, com a placa azul da estrada passando ao lado. No asfalto seco o casco empaca e começa a raspar, cuspindo faísca; ela bate a garra no timão e berra IÁ! É... PÔ, NAVEGA! — e o barco obedece: dispara pela faixa deslizando como se a estrada fosse mar. Com a outra garra, ela digita a resposta: estou a caminho.',
  },
  createScene,
  refine: { organic: ['lagosta', 'garraTimao', 'garraCelular'] },
}

export default card
