import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, lathe, puff,
} from '../rig/helpers'

/**
 * "Dags att sova!" — DÁKS! A... SÔÔ-VA(co)!
 *
 * No alto do eucalipto, à noite, um COALA deitado num colchãozinho sobre o
 * galho acaba de fechar o livro de historinha com uma patada (DÁKS!), solta um
 * bocejo curtinho (A...) e deita a cabeça no próprio SOVACO branco e felpudo,
 * com o braço erguido em arco por cima feito travesseiro (SÔÔ-VA...); o -CO
 * já sai em ronco: Zzz.
 *
 * Diorama: grama escura com vaga-lumes, eucalipto de tronco liso e claro com
 * descascados creme, galho grosso na horizontal, colchão azul-claro, cobertor
 * amarelo de bolinhas, abajur de cúpula laranja pendurado num raminho. O livro
 * VERMELHO é o único acento saturado (o DÁKS); o sovaco é o branco mais claro
 * da cena, recortado contra o pelo cinza.
 */

const CHAO = '#2b4632'
const CHAO_BORDA = '#20372a'
const CAPIM = '#3d6646'
const CAPIM_CLARO = '#56845a'
const PEDRA = '#5b5f5c'
const TRONCO = '#c3bfb4'
const TRONCO_ESC = '#9e9a90'
const CASCA_CREME = '#ddd5c3'
const CASCA_SALMAO = '#cdbcae'
const CASCA_VERDE = '#adb3a4'
const FOLHA = '#6c8c7b'
const FOLHA_ESC = '#516d60'
const FOLHA_CLARA = '#8ea898'
const COLCHAO = '#a9cbea'
const DEBRUM = '#6c98cf'
const MANTA = '#eac65a'
const MANTA_BOLA = '#fffaf0'
const KOALA = '#8e939c'
const KOALA_ESC = '#757a83'
const BRANCO = '#f4f3ef'
const NARIZ = '#25242a'
const PALMA = '#4b4a51'
const UNHA = '#2e2a2c'
const BOCA = '#3e1c24'
const LINGUA = '#e2899a'
const LIVRO = '#d42f2c' // acento saturado RESERVADO: o livro do DÁKS
const LIVRO_ESC = '#a8221f'
const PAGINAS = '#f4ecd8'
const GUARDA = '#f1dfb8'
const OURO = '#f0bf3e'
const CUPULA = '#f08a3c'
const LUZ = '#ffe8b4'
const CORDAO = '#3a332c'
const ZZZ = '#e6edf8'

const GY = 0.14 // topo do chão
const TX = -1.45 // tronco
const TZ = -0.55
const BY = 0.66 // eixo do galho grosso
const BZ = -0.12
const MY = 1.01 // topo do colchão (no centro)
const KY = MY - 0.02 // coala afunda um tico no colchão
const LX = 1.5 // livro, em cima do galho
const LY = 0.835

// colchão: dimensões e caimento sobre o galho
const CL = 2.1
const CH = 0.15
const CW = 0.96
const CK = 0.6 // y -= CK·z² (as bordas caem para os lados do galho)

// cabeça: pose final (deitada no sovaco) e antes (acordada)
const CAB_RZ = 0.4
const CAB_RX = -0.08
const CAB_RZ_ACORDADA = -0.1
const CAB_RX_BOCEJO = -0.26
const CAB_Y = 0.58
const CAB_Y_ACORDADA = 0.68 // acordada, a cabeça fica erguida
// capa do livro: aberta em pé
const CAPA_ABERTA = -1.75
// pata de baixo: erguida para a patada
const PATA_RZ_ALTO = 0.3
const PATA_RY_FRENTE = -0.25
// braço de cima: antes de erguer
const BRACO_RZ_ANTES = 0.75
// Zzz
const ZY = 2.06

type V3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)

function shaded<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cápsula de a até b — membros, raízes, raminhos. */
function limb(r: number, a: V3, b: V3, color: string, opts?: MatOpts) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, dir.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/** Tronco de cone de a (raio r1) até b (raio r2) — galhos que afinam. */
function taper(r1: number, r2: number, a: V3, b: V3, color: string, opts?: MatOpts) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const m = cylinder(r2, r1, dir.length(), color, opts, 28)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/** Tubo liso por uma curva — o raminho torto que segura o abajur. */
function tube(points: V3[], r: number, color: string, opts?: MatOpts) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal')
  const geo = new THREE.TubeGeometry(curve, 64, r, 12, false)
  return shaded(new THREE.Mesh(geo, mat(color, { ...opts, size: 1 })))
}

/** Colchão: caixa subdividida cujas bordas caem (y -= k·z²), topo central em y=0. */
function mattressGeo() {
  const geo = new THREE.BoxGeometry(CL, CH, CW, 16, 2, 24)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i)
    pos.setY(i, pos.getY(i) - CH / 2 - CK * z * z)
  }
  geo.computeVertexNormals()
  return geo
}

/** Debrum em volta do colchão, acompanhando o caimento. */
function piping(y0: number, r: number) {
  const hx = CL / 2
  const hz = CW / 2
  const N = 12
  const pts: THREE.Vector3[] = []
  const at = (x: number, z: number) => new THREE.Vector3(x, y0 - CK * z * z, z)
  for (let i = 0; i < N; i++) pts.push(at(-hx + (2 * hx * i) / N, hz))
  for (let i = 0; i < N; i++) pts.push(at(hx, hz - (2 * hz * i) / N))
  for (let i = 0; i < N; i++) pts.push(at(hx - (2 * hx * i) / N, -hz))
  for (let i = 0; i < N; i++) pts.push(at(-hx, -hz + (2 * hz * i) / N))
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal')
  const geo = new THREE.TubeGeometry(curve, 240, r, 8, true)
  return shaded(new THREE.Mesh(geo, mat(DEBRUM, { roughness: 0.8, size: 0.3 })))
}

/*
 * Cobertor jogado sobre o quadril, moldado no corpo: em cada x (espaço do
 * coala) o perfil (z, y) é um meio-arco elíptico que veste tronco ∪ anca com
 * folga, mais duas abas que caem até o colchão e abrem um pouco embaixo.
 * `u` ∈ [-1, 1] percorre o perfil de uma barra à outra, passando pelo topo.
 */
const DCY = 0.36 // eixo do corpo deitado
const DYB = -0.12 // onde a aba encosta no colchão
const DT = 0.045

/** Meia-altura e meia-largura do corpo (tronco ∪ anca) na posição x. */
function bodyHalf(x: number): [number, number] {
  const t = Math.sqrt(Math.max(0, 1 - ((x + 0.1) / 0.58) ** 2))
  const r = Math.sqrt(Math.max(0, 1 - ((x + 0.62) / 0.37) ** 2))
  return [Math.max(0.37 * t, 0.37 * r), Math.max(0.42 * t, 0.37 * r)]
}

function drapeAt(x: number, u: number): [number, number, number, number] {
  const [by, bz] = bodyHalf(x)
  const ry = by + 0.07
  const rz = bz + 0.14
  const A = (Math.PI * (ry + rz)) / 4 // ~um quarto do perímetro da elipse
  const s = u * (A + DCY - DYB)
  if (Math.abs(s) <= A) {
    const phi = (s / A) * (Math.PI / 2)
    const n = new THREE.Vector2(Math.sin(phi) / rz, Math.cos(phi) / ry).normalize()
    return [rz * Math.sin(phi), DCY + ry * Math.cos(phi), n.x, n.y]
  }
  const sg = Math.sign(s)
  const d = Math.abs(s) - A
  return [sg * (rz + 0.2 * d * d), DCY - d, sg, 0]
}

/** Pregas da manta: ondulação que cresce para baixo da aba. */
function prega(x: number, u: number) {
  const d = Math.max(0, Math.abs(u) - 0.45)
  return Math.sin(x * 15 + 0.6) * 0.022 * Math.min(1, d / 0.35)
}

/** Manta entre x0 e x1: caixa fina subdividida dobrada no perfil. */
function drapeGeo(x0: number, x1: number, thick: number) {
  const geo = new THREE.BoxGeometry(x1 - x0, thick, 2, 24, 1, 80)
  geo.translate((x0 + x1) / 2, 0, 0)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const u = pos.getZ(i)
    const [pz, py, nz, ny] = drapeAt(x, u)
    const off = pos.getY(i) + prega(x, u)
    pos.setXYZ(i, x, py + off * ny, pz + off * nz)
  }
  geo.computeVertexNormals()
  return geo
}

/** Estrelinha extrudada (capa do livro, céu). */
function star(rOut: number, rIn: number, color: string, opts: MatOpts = { roughness: 0.3, metalness: 0.5 }) {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 === 0 ? rOut : rIn
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  })
  return shaded(new THREE.Mesh(geo, mat(color, { ...opts, size: rOut * 2 })))
}

/** Letra Z de traço grosso, no plano xy, virada para +z. */
function letterZ(s: number, t: number) {
  const g = new THREE.Group()
  const o: MatOpts = { roughness: 0.45, emissive: ZZZ, emissiveIntensity: 0.18 }
  const top = rbox(s, t, t * 0.9, t * 0.35, ZZZ, o)
  top.position.y = s / 2 - t / 2
  g.add(top)
  const bot = rbox(s, t, t * 0.9, t * 0.35, ZZZ, o)
  bot.position.y = -(s / 2 - t / 2)
  g.add(bot)
  const dx = s - t * 1.1
  const dy = s - t * 2
  const diag = rbox(Math.hypot(dx, dy) + t * 0.5, t, t * 0.9, t * 0.35, ZZZ, o)
  diag.rotation.z = Math.atan2(dy, dx)
  g.add(diag)
  return g
}

/**
 * Tufo de eucalipto: buquê irregular de bolos verde-acinzentados, cada um com
 * uma franja de folhas compridas penduradas por baixo.
 */
function leafCluster(seed: number, size: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const tones = [FOLHA, FOLHA_ESC, FOLHA_CLARA]
  const bolos: [number, number, number, number][] = [[0, 0.04, 0, 0.21]]
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rand() * 0.8
    bolos.push([
      Math.cos(a) * (0.17 + rand() * 0.08),
      (rand() - 0.45) * 0.2,
      Math.sin(a) * (0.13 + rand() * 0.07),
      0.12 + rand() * 0.06,
    ])
  }
  bolos.forEach(([bx, by, bz, br], i) => {
    const bolo = puff(br * size, tones[i % 3], 5, seed * 7 + i, { roughness: 0.85 })
    bolo.position.set(bx * size, by * size, bz * size)
    bolo.scale.y = 0.85
    g.add(bolo)
    // franja de folhas penduradas na borda de baixo do bolo
    for (let k = 0; k < 5; k++) {
      const a = rand() * Math.PI * 2
      const elev = -1.3 + rand() * 0.6
      const dir = new THREE.Vector3(Math.cos(a) * Math.cos(elev), Math.sin(elev), Math.sin(a) * Math.cos(elev))
      const half = (0.08 + rand() * 0.04) * size
      const leaf = sphere(1, tones[(i + k) % 3], { roughness: 0.7, size: half * 2 }, 12)
      leaf.scale.set(0.03 * size, half, 0.009 * size)
      leaf.quaternion.setFromUnitVectors(UP, dir)
      leaf.rotateY(rand() * Math.PI)
      const r0 = br * size * 0.8
      leaf.position
        .set(bx * size + Math.cos(a) * r0, (by - br * 0.45) * size, bz * size + Math.sin(a) * r0)
        .addScaledVector(dir, half * 0.9)
      g.add(leaf)
    }
  })
  return g
}

/** Membro liso: cápsulas encadeadas por uma curva, raio indo de r0 a r1. */
function arcLimb(points: V3[], r0: number, r1: number, color: string, opts?: MatOpts, n = 10) {
  const g = new THREE.Group()
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal')
  const pts = curve.getSpacedPoints(n)
  for (let i = 0; i < n; i++) {
    const r = r0 + ((r1 - r0) * (i + 0.5)) / n
    const a = pts[i]
    const b = pts[i + 1]
    g.add(limb(r, [a.x, a.y, a.z], [b.x, b.y, b.z], color, opts))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- chão: grama escura, folhas caídas, vaga-lumes ------------------------
  const base = new THREE.Group()

  const disco = cylinder(2.62, 2.72, 0.14, CHAO, { roughness: 0.95 })
  disco.position.y = 0.07
  base.add(disco)
  const borda = cylinder(2.73, 2.78, 0.05, CHAO_BORDA, { roughness: 0.95 })
  borda.position.y = 0.025
  base.add(borda)

  // tufos de capim (longe do pé do tronco)
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.7 + rand() * 1.7
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (Math.hypot(x - TX, z - TZ) < 0.75) continue
    const tufo = new THREE.Group()
    tufo.position.set(x, GY, z)
    for (let k = 0; k < 5; k++) {
      const h = 0.12 + rand() * 0.12
      const lamina = cone(0.022, h, k % 2 ? CAPIM : CAPIM_CLARO, { roughness: 0.85 }, 8)
      lamina.position.set((rand() - 0.5) * 0.08, h / 2, (rand() - 0.5) * 0.08)
      lamina.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6)
      tufo.add(lamina)
    }
    base.add(tufo)
  }

  // folhas de eucalipto caídas na grama
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.6 + rand() * 1.8
    const folha = sphere(1, i % 3 === 0 ? '#9a8a68' : FOLHA_CLARA, { roughness: 0.75, size: 0.3 }, 12)
    folha.scale.set(0.05, 0.012, 0.16)
    folha.position.set(Math.cos(a) * r, GY + 0.008, Math.sin(a) * r)
    folha.rotation.y = rand() * Math.PI
    base.add(folha)
  }

  for (const [px, pz, pr, ps] of [[1.75, 1.25, 0.15, 11], [-0.55, 1.85, 0.1, 12], [2.1, -0.85, 0.12, 13]] as const) {
    const pedra = sphere(pr, PEDRA, { roughness: 0.9 })
    pedra.scale.set(1.2, 0.6, 1)
    pedra.position.set(px, GY + pr * 0.25, pz)
    pedra.rotation.y = ps
    base.add(pedra)
  }

  // vaga-lumes: pontinhos de luz quente perto da grama
  for (const [fx, fy, fz] of [
    [-0.75, 0.42, 1.35], [0.95, 0.55, 1.75], [1.85, 0.38, 0.85],
    [-2.0, 0.62, 0.7], [0.15, 0.3, 2.05], [-1.2, 1.05, 0.95],
  ] as const) {
    const vaga = sphere(0.026, '#f7f2a6', { emissive: '#f4ee8a', emissiveIntensity: 1.6 }, 12)
    vaga.position.set(fx, fy, fz)
    base.add(vaga)
  }

  // estrelinhas no céu da noite, lá no fundo
  for (const [sx, sy, sz, sr, rz] of [
    [0.75, 2.78, -1.3, 0.07, 0.2], [1.3, 2.62, -1.5, 0.05, -0.3], [0.2, 2.7, -1.6, 0.045, 0.5],
  ] as const) {
    const estrela = star(sr, sr * 0.45, '#fff3b8', { emissive: '#ffe58a', emissiveIntensity: 1.1 })
    estrela.castShadow = false
    estrela.position.set(sx, sy, sz)
    estrela.rotation.set(0, 0.1, rz)
    base.add(estrela)
  }

  root.add(base)

  // ---- eucalipto: tronco liso e claro, galho grosso, raminho do abajur -------
  const tronco = new THREE.Group()

  const perfil: [number, number][] = [
    [0, 0], [0.5, 0], [0.44, 0.06], [0.36, 0.2], [0.3, 0.45], [0.28, 0.8],
    [0.27, 1.3], [0.25, 1.8], [0.22, 2.2], [0.17, 2.45], [0.09, 2.56], [0, 2.58],
  ]
  const fuste = lathe(perfil, TRONCO, { roughness: 0.45 }, 40)
  fuste.position.set(TX, GY - 0.02, TZ)
  tronco.add(fuste)

  // raio do fuste numa altura h (para os descascados assentarem nele)
  const raio = (h: number) => {
    for (let i = 1; i < perfil.length; i++) {
      const [r1, y1] = perfil[i - 1]
      const [r2, y2] = perfil[i]
      if (h <= y2) return r1 + ((h - y1) / (y2 - y1)) * (r2 - r1)
    }
    return 0
  }
  // descascados típicos do eucalipto: placas creme, salmão e verde-cinza
  const cascas = [CASCA_CREME, CASCA_SALMAO, CASCA_VERDE]
  for (let i = 0; i < 12; i++) {
    const h = 0.35 + rand() * 1.95
    const a = rand() * Math.PI * 2
    const r = raio(h) - 0.018
    const placa = sphere(1, cascas[i % 3], { roughness: 0.5, size: 0.4 }, 16)
    placa.scale.set(0.035 + rand() * 0.03, 0.2 + rand() * 0.18, 0.024)
    placa.position.set(TX + Math.cos(a) * r, GY + h, TZ + Math.sin(a) * r)
    placa.rotation.y = Math.PI / 2 - a
    tronco.add(placa)
  }

  // raízes abrindo no chão
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4
    tronco.add(limb(
      0.085,
      [TX + Math.cos(a) * 0.25, GY + 0.08, TZ + Math.sin(a) * 0.25],
      [TX + Math.cos(a) * 0.68, GY - 0.01, TZ + Math.sin(a) * 0.68],
      TRONCO_ESC,
      { roughness: 0.6 },
    ))
  }

  // galho grosso: sai do tronco e corre na horizontal sob o colchão
  tronco.add(taper(0.27, 0.21, [TX + 0.05, BY - 0.1, TZ + 0.05], [-0.9, BY, BZ], TRONCO, { roughness: 0.45 }))
  const junta1 = sphere(0.21, TRONCO, { roughness: 0.45 })
  junta1.position.set(-0.9, BY, BZ)
  tronco.add(junta1)
  tronco.add(taper(0.205, 0.2, [-0.9, BY, BZ], [1.15, BY, BZ], TRONCO, { roughness: 0.45 }))
  const junta2 = sphere(0.2, TRONCO, { roughness: 0.45 })
  junta2.position.set(1.15, BY, BZ)
  tronco.add(junta2)
  tronco.add(taper(0.2, 0.12, [1.15, BY, BZ], [2.05, BY + 0.03, BZ], TRONCO, { roughness: 0.45 }))
  const ponta = sphere(0.12, TRONCO, { roughness: 0.45 })
  ponta.position.set(2.05, BY + 0.03, BZ)
  tronco.add(ponta)
  for (const [px, ang, c] of [[-0.45, 0.5, CASCA_CREME], [0.55, -0.4, CASCA_SALMAO]] as const) {
    const placa = sphere(1, c, { roughness: 0.5, size: 0.3 }, 16)
    placa.scale.set(0.16, 0.06, 0.03)
    placa.position.set(px, BY + Math.sin(ang) * 0.185, BZ + Math.cos(ang) * 0.185)
    placa.rotation.x = -ang
    tronco.add(placa)
  }

  // raminhos que seguram a copa
  tronco.add(limb(0.07, [TX, 1.95, TZ], [-1.92, 2.28, -0.75], TRONCO, { roughness: 0.45 }))
  tronco.add(limb(0.06, [TX, 1.6, TZ], [-1.85, 1.95, -0.95], TRONCO, { roughness: 0.45 }))

  // raminho torto que sobe da ponta do galho e faz o gancho do abajur
  tronco.add(tube(
    [[1.88, BY + 0.06, BZ], [2.16, 1.05, -0.16], [2.32, 1.6, -0.22], [2.32, 2.1, -0.24], [2.15, 2.37, -0.24], [1.97, 2.31, -0.22]],
    0.055,
    TRONCO,
    { roughness: 0.45 },
  ))

  root.add(tronco)

  // ---- copa: tufos de folhas compridas ---------------------------------------
  // pivô no meio da árvore: a folhagem "explode" para fora ao crescer
  const FOLHAS_C = new THREE.Vector3(0.2, 1.9, -0.4)
  const folhas = new THREE.Group()
  folhas.position.copy(FOLHAS_C)
  root.add(folhas)
  for (const [x, y, z, s, seed] of [
    [TX, 2.62, TZ, 1.55, 3], [-1.94, 2.3, -0.76, 1.15, 5], [-1.88, 1.98, -0.97, 0.9, 7],
    [2.33, 1.62, -0.24, 0.85, 9], [2.17, 2.42, -0.28, 1.0, 11], [2.12, BY + 0.05, BZ, 0.75, 13],
  ] as const) {
    const tufo = leafCluster(seed, s)
    tufo.position.set(x - FOLHAS_C.x, y - FOLHAS_C.y, z - FOLHAS_C.z)
    folhas.add(tufo)
  }

  // ---- abajur pendurado no gancho do raminho --------------------------------
  const abajur = new THREE.Group()
  abajur.position.set(1.97, 2.27, -0.22)
  root.add(abajur)

  const cordao = cylinder(0.012, 0.012, 0.36, CORDAO, { roughness: 0.7 })
  cordao.position.y = -0.18
  abajur.add(cordao)
  const laco = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 20), mat(CORDAO, { roughness: 0.7, size: 0.1 }))
  laco.position.y = 0.0
  abajur.add(laco)
  const soquete = cylinder(0.035, 0.04, 0.07, '#b08d4f', { roughness: 0.35, metalness: 0.7 })
  soquete.position.y = -0.38
  abajur.add(soquete)
  const cupula = lathe(
    [[0.25, -0.65], [0.255, -0.64], [0.115, -0.4], [0.1, -0.39]],
    CUPULA,
    { emissive: CUPULA, emissiveIntensity: 0.75, roughness: 0.6 },
  )
  ;(cupula.material as THREE.Material).side = THREE.DoubleSide
  abajur.add(cupula)
  const barra = new THREE.Mesh(new THREE.TorusGeometry(0.253, 0.014, 8, 40), mat('#c86d2a', { roughness: 0.6, size: 0.4 }))
  barra.rotation.x = Math.PI / 2
  barra.position.y = -0.645
  abajur.add(barra)
  const lampada = sphere(0.075, LUZ, { emissive: LUZ, emissiveIntensity: 1.6 })
  lampada.position.y = -0.57
  abajur.add(lampada)
  const luz = new THREE.PointLight('#ffb36b', 3.5, 3.6, 1.5)
  luz.position.y = -0.68
  abajur.add(luz)

  // ---- colchãozinho azul-claro sobre o galho ---------------------------------
  const colchao = new THREE.Group()
  colchao.position.set(0.05, MY, BZ)
  root.add(colchao)
  const espuma = shaded(new THREE.Mesh(mattressGeo(), mat(COLCHAO, { roughness: 0.85, size: 2 })))
  colchao.add(espuma)
  colchao.add(piping(0, 0.028))
  colchao.add(piping(-CH, 0.028))
  // pespontos do capitonê na lateral da frente
  for (let i = -4; i <= 4; i++) {
    const ponto = sphere(0.022, DEBRUM, { roughness: 0.7 })
    ponto.scale.set(1, 1, 0.5)
    ponto.position.set(i * 0.22, -CH / 2 - CK * (CW / 2) ** 2, CW / 2 + 0.004)
    colchao.add(ponto)
  }

  // ---- COALA deitado de lado, barriga para a câmera --------------------------
  const coala = new THREE.Group()
  coala.position.set(0.05, KY, BZ)
  root.add(coala)
  const pelo: MatOpts = { roughness: 0.9 }

  const torso = sphere(1, KOALA, pelo)
  torso.scale.set(0.58, 0.37, 0.42)
  torso.position.set(-0.1, 0.36, 0)
  coala.add(torso)
  const anca = sphere(0.37, KOALA, pelo)
  anca.position.set(-0.62, 0.35, 0)
  coala.add(anca)
  const pescoco = sphere(0.27, KOALA, pelo)
  pescoco.position.set(0.58, 0.45, 0.05)
  coala.add(pescoco)
  // peito branco
  const peito = sphere(0.21, BRANCO, pelo)
  peito.scale.set(0.95, 1.05, 0.45)
  peito.position.set(0.32, 0.38, 0.3)
  coala.add(peito)
  // coxa dobrada sob o cobertor
  const coxa = sphere(0.25, KOALA, pelo)
  coxa.position.set(-0.55, 0.22, 0.22)
  coala.add(coxa)
  // pés para fora do cobertor: patinha redonda, sola escura, garrinhas
  for (const [px, py, pz, ry] of [[-1.07, 0.36, 0.2, 0.5], [-1.05, 0.13, 0.36, 0.75]] as const) {
    const pe = new THREE.Group()
    pe.position.set(px, py, pz)
    pe.rotation.y = ry
    const peito2 = sphere(0.12, KOALA, pelo)
    peito2.scale.set(1.25, 0.85, 1)
    pe.add(peito2)
    const sola = sphere(0.09, PALMA, { roughness: 0.7 })
    sola.scale.set(0.5, 0.85, 1)
    sola.position.x = -0.1
    pe.add(sola)
    for (let k = 0; k < 2; k++) {
      const unha = cone(0.02, 0.06, UNHA, { roughness: 0.4 }, 10)
      unha.rotation.z = Math.PI / 2
      unha.position.set(-0.17, 0.04 - k * 0.07, 0.03)
      pe.add(unha)
    }
    coala.add(pe)
  }

  // ---- cabeça: orelhas redondas felpudas, narigão, olhos fechados ------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0.94, CAB_Y, 0.1)
  cabeca.rotation.set(CAB_RX, 0, CAB_RZ)
  coala.add(cabeca)
  const HR = 0.4

  const cranio = sphere(HR, KOALA, pelo)
  cranio.scale.set(1.12, 0.94, 0.9)
  cabeca.add(cranio)
  // bochechas felpudas e queixo branco
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.15, KOALA, pelo)
    bochecha.position.set(side * 0.27, -0.13, 0.17)
    cabeca.add(bochecha)
  }
  const queixo = sphere(0.16, BRANCO, pelo)
  queixo.scale.set(1.3, 0.75, 0.9)
  queixo.position.set(0, -0.24, 0.22)
  cabeca.add(queixo)
  // narigão preto e lustroso
  const nariz = sphere(0.13, NARIZ, { roughness: 0.3 })
  nariz.scale.set(0.95, 1.3, 0.72)
  nariz.position.set(0, -0.03, 0.335)
  cabeca.add(nariz)
  for (const side of [-1, 1]) {
    // olho fechado: arco "‿" escuro sobre uma pálpebra cinza
    const palpebra = sphere(0.075, KOALA_ESC, pelo)
    palpebra.scale.set(1.1, 0.7, 0.5)
    palpebra.position.set(side * 0.2, 0.1, 0.315)
    cabeca.add(palpebra)
    const olho = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.019, 8, 18, Math.PI), mat(NARIZ, { roughness: 0.4, size: 0.1 }))
    olho.rotation.z = Math.PI
    olho.position.set(side * 0.2, 0.11, 0.34)
    cabeca.add(olho)

    // orelha: disco cinza + miolo branco + franja felpuda
    const orelha = new THREE.Group()
    orelha.position.set(side * 0.43, 0.26, -0.02)
    orelha.rotation.z = -side * 0.25
    const disco2 = sphere(0.22, KOALA, pelo)
    disco2.scale.set(1, 0.95, 0.42)
    orelha.add(disco2)
    const miolo = sphere(0.15, BRANCO, pelo)
    miolo.scale.set(1, 1, 0.5)
    miolo.position.z = 0.05
    orelha.add(miolo)
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 2 + side * (-0.4 - k * 0.45)
      const franja = sphere(0.065, BRANCO, pelo)
      franja.position.set(Math.cos(a) * 0.19, Math.sin(a) * 0.18, 0.03)
      orelha.add(franja)
    }
    cabeca.add(orelha)
  }

  // ---- boca: o bocejo (A...) -------------------------------------------------
  const boca = new THREE.Group()
  boca.position.set(0, -0.27, 0.345)
  cabeca.add(boca)
  const fundo = sphere(0.072, BOCA, { roughness: 0.6 })
  fundo.scale.set(1.1, 1.35, 0.6)
  boca.add(fundo)
  const lingua = sphere(0.05, LINGUA, { roughness: 0.45 })
  lingua.scale.set(1.25, 0.6, 0.7)
  lingua.position.set(0, -0.05, 0.015)
  boca.add(lingua)

  // ---- cobertor amarelo de bolinhas sobre o quadril -------------------------
  const cobertor = new THREE.Group()
  coala.add(cobertor)
  const M0 = -0.95 // pé do cobertor
  const M1 = -0.14 // beirada do lado da cabeça
  const manta = shaded(new THREE.Mesh(drapeGeo(M0, M1, DT), mat(MANTA, { roughness: 0.9, size: 1.2 })))
  cobertor.add(manta)
  // barras brancas nas duas beiradas
  for (const [b0, b1] of [[M1 - 0.07, M1], [M0, M0 + 0.06]]) {
    cobertor.add(shaded(new THREE.Mesh(drapeGeo(b0, b1, DT + 0.016), mat(MANTA_BOLA, { roughness: 0.9, size: 0.6 }))))
  }
  let row = 0
  for (let u = -0.93; u <= 0.94; u += 0.125, row++) {
    for (let x = M0 + 0.13 + (row % 2) * 0.09; x <= M1 - 0.12; x += 0.18) {
      const [pz, py, nz, ny] = drapeAt(x, u)
      const n = new THREE.Vector3(0, ny, nz).normalize()
      const off = DT / 2 + prega(x, u)
      const bola = sphere(0.034, MANTA_BOLA, { roughness: 0.85 }, 12)
      bola.scale.set(1, 0.32, 1)
      bola.quaternion.setFromUnitVectors(UP, n)
      bola.position.set(x, py + off * ny, pz + off * nz)
      cobertor.add(bola)
    }
  }

  // ---- pata de baixo: fechou o livro e ficou em cima dele -------------------
  const pata = new THREE.Group()
  pata.position.set(0.45, 0.15, 0.22)
  coala.add(pata)
  const ombroB = sphere(0.14, KOALA, pelo)
  pata.add(ombroB)
  const COT: V3 = [0.5, -0.01, -0.03]
  const PUNHO: V3 = [0.84, -0.04, -0.1]
  pata.add(limb(0.115, [0, 0, 0], COT, KOALA, pelo))
  const cotB = sphere(0.11, KOALA, pelo)
  cotB.position.set(...COT)
  pata.add(cotB)
  pata.add(limb(0.1, COT, PUNHO, KOALA, pelo))
  const maoB = sphere(0.12, KOALA, pelo)
  maoB.scale.set(1.2, 0.6, 1.05)
  maoB.position.set(0.92, -0.05, -0.11)
  pata.add(maoB)
  for (let k = 0; k < 3; k++) {
    const unha = cone(0.022, 0.08, UNHA, { roughness: 0.4 }, 10)
    unha.position.set(1.05, -0.08, -0.2 + k * 0.08)
    unha.rotation.z = -1.9
    pata.add(unha)
  }

  // ---- braço de cima erguido em arco, com o SOVACO branco --------------------
  const braco = new THREE.Group()
  braco.position.set(0.22, 0.66, -0.02)
  coala.add(braco)
  const P: V3 = [1.28, 0.16, 0.12]
  const ombroA = sphere(0.17, KOALA, pelo)
  braco.add(ombroA)
  // arco liso: ombro → sobe → passa por cima da cabeça → desce do outro lado
  const ARCO: V3[] = [[0, 0, 0], [0.06, 0.32, 0.03], [0.28, 0.62, 0.06], [0.62, 0.74, 0.09], [0.97, 0.68, 0.11], [1.2, 0.45, 0.12], P]
  braco.add(arcLimb(ARCO, 0.16, 0.115, KOALA, pelo, 12))
  const maoA = sphere(0.13, KOALA, pelo)
  maoA.scale.set(1.0, 1.15, 0.95)
  maoA.position.set(P[0] + 0.02, P[1] - 0.06, P[2])
  braco.add(maoA)
  for (let k = 0; k < 3; k++) {
    const unha = cone(0.022, 0.08, UNHA, { roughness: 0.4 }, 10)
    unha.position.set(P[0] + 0.02 + (k - 1) * 0.07, P[1] - 0.2, P[2] + 0.04)
    unha.rotation.x = Math.PI
    braco.add(unha)
  }
  // o SOVACO: tufo branco e felpudo no vão do ombro, onde a cabeça encosta,
  // e o forro branco do lado de dentro do braço (como o do coala de verdade)
  for (const [x, y, z, r] of [
    [0.14, 0.2, 0.12, 0.18], [0.27, 0.36, 0.1, 0.15], [0.05, 0.05, 0.16, 0.14],
    [0.32, 0.17, 0.2, 0.12], [0.12, 0.33, 0.2, 0.11], [0.42, 0.3, 0.13, 0.12],
    [0.45, 0.5, 0.1, 0.11],
  ] as const) {
    const tufo = sphere(r, BRANCO, pelo)
    tufo.position.set(x, y, z)
    braco.add(tufo)
  }
  // forro: contas bem juntas na face de dentro do arco (a fusão vira uma faixa)
  const arco = new THREE.CatmullRomCurve3(ARCO.map((p) => new THREE.Vector3(...p)), false, 'centripetal')
  const centroArco = new THREE.Vector3(0.62, 0.2, 0.1)
  for (let k = 0; k <= 6; k++) {
    const u = 0.3 + k * 0.032
    const q = arco.getPointAt(u)
    const dentro = centroArco.clone().sub(q).setZ(0).normalize()
    const forro = sphere(0.1 - k * 0.004, BRANCO, pelo)
    forro.position.copy(q).addScaledVector(dentro, 0.1 - k * 0.003)
    forro.position.z += 0.05
    braco.add(forro)
  }

  // ---- livro de historinha vermelho, equilibrado no galho -------------------
  const livro = new THREE.Group()
  livro.position.set(LX, LY, BZ + 0.02)
  livro.rotation.y = -0.15
  root.add(livro)
  const BW = 0.6
  const BD = 0.44
  const PH = 0.11 // altura do miolo de páginas
  const CT = 0.032 // espessura das capas
  const contra = rbox(BW, CT, BD, 0.013, LIVRO, { roughness: 0.55 })
  contra.position.y = CT / 2
  livro.add(contra)
  const miolo = rbox(BW - 0.05, PH, BD - 0.04, 0.01, PAGINAS, { roughness: 0.8 })
  miolo.position.set(0.01, CT + PH / 2, 0.012)
  livro.add(miolo)
  // folhas vistas de lado: risquinhos na borda do miolo
  for (const f of [0.25, 0.5, 0.75]) {
    const linha = rbox(BW - 0.09, 0.005, 0.004, 0.002, '#d8cbb0', { roughness: 0.9 })
    linha.position.set(0.01, CT + PH * f, BD / 2 - 0.006)
    livro.add(linha)
  }
  // texto da página (só aparece com o livro aberto)
  for (let i = 0; i < 4; i++) {
    const texto = rbox(i === 3 ? 0.16 : 0.38, 0.004, 0.02, 0.002, '#b5aa94', { roughness: 0.9 })
    texto.position.set(-0.02 - (i === 3 ? 0.11 : 0), CT + PH + 0.001, 0.12 - i * 0.06)
    livro.add(texto)
  }
  const RL = (PH + 2 * CT) / 2 // raio da lombada
  const lombada = cylinder(RL, RL, BW, LIVRO_ESC, { roughness: 0.55 })
  lombada.rotation.z = Math.PI / 2
  lombada.position.set(0, RL, -BD / 2)
  livro.add(lombada)
  for (const lx of [-0.2, 0.2]) {
    const faixa = cylinder(RL + 0.004, RL + 0.004, 0.028, OURO, { roughness: 0.35, metalness: 0.5 })
    faixa.rotation.z = Math.PI / 2
    faixa.position.set(lx, RL, -BD / 2)
    livro.add(faixa)
  }
  // fitinha marcadora pendurada
  const fita = rbox(0.04, 0.15, 0.006, 0.003, OURO, { roughness: 0.6 })
  fita.position.set(0.16, 0.03, BD / 2 - 0.004)
  fita.rotation.z = 0.12
  livro.add(fita)

  // capa da frente (dobradiça na lombada)
  const capa = new THREE.Group()
  capa.position.set(0, CT + PH + CT / 2, -BD / 2)
  livro.add(capa)
  const capaPlaca = rbox(BW, CT, BD, 0.013, LIVRO, { roughness: 0.55 })
  capaPlaca.position.z = BD / 2
  capa.add(capaPlaca)
  const guarda = rbox(BW - 0.04, 0.004, BD - 0.04, 0.002, GUARDA, { roughness: 0.85 })
  guarda.position.set(0, -CT / 2 - 0.001, BD / 2)
  capa.add(guarda)
  const moldura = rbox(BW - 0.08, 0.004, BD - 0.08, 0.002, LIVRO_ESC, { roughness: 0.55 })
  moldura.position.set(0, CT / 2, BD / 2)
  capa.add(moldura)
  const molduraIn = rbox(BW - 0.11, 0.005, BD - 0.11, 0.002, LIVRO, { roughness: 0.55 })
  molduraIn.position.set(0, CT / 2 + 0.0005, BD / 2)
  capa.add(molduraIn)
  const estrela = star(0.09, 0.038, OURO)
  estrela.rotation.x = -Math.PI / 2
  estrela.position.set(0, CT / 2, BD / 2 + 0.01)
  capa.add(estrela)

  // ---- Zzz: o -CO que já sai em ronco ---------------------------------------
  const zzz = new THREE.Group()
  zzz.position.set(0.02, ZY, -0.05)
  zzz.rotation.y = 0.15
  root.add(zzz)
  for (const [x, y, s, rz] of [[0, 0, 0.16, 0.12], [-0.19, 0.25, 0.21, -0.08], [-0.4, 0.54, 0.27, 0.1]] as const) {
    const z = letterZ(s, s * 0.24)
    z.position.set(x, y, 0)
    z.rotation.z = rz
    zzz.add(z)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'arvore', object: base },
    { name: 'tronco', group: 'arvore', object: tronco },
    { name: 'folhas', group: 'arvore', object: folhas },
    { name: 'abajur', group: 'arvore', object: abajur },
    { name: 'colchao', group: 'cama', object: colchao },
    { name: 'coala', group: 'cama', object: coala },
    { name: 'cabeca', group: 'cama', object: cabeca },
    { name: 'cobertor', group: 'cama', object: cobertor },
    { name: 'livro', group: 'daks', object: livro },
    { name: 'capa', group: 'daks', object: capa },
    { name: 'pata', group: 'daks', object: pata },
    { name: 'boca', group: 'bocejo', object: boca },
    { name: 'braco', group: 'sovaco', object: braco },
    { name: 'zzz', group: 'ronco', object: zzz },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Noite no alto de um eucalipto: tronco liso e claro, folhas cinza-esverdeadas.',
    }),
    seq('tronco-rise', 'tronco', 0.3, 1.0, [riseFrom(0, 2.9)], { ease: 'easeOut' }),
    seq('folhas-crescem', 'folhas', 1.0, 0.7, grow(), { ease: 'easeOut' }),
    seq('abajur-desce', 'abajur', 1.5, 0.6, [ch('scale.y', 0.05, 1)], {
      ease: 'easeOut',
      caption: 'Num raminho torto, um abajur de cúpula laranja, aceso.',
    }),
    seq('abajur-balanca', 'abajur', 2.1, 0.5, [ch('rotation.z', 0.25, -0.12)]),
    seq('abajur-para', 'abajur', 2.6, 0.5, [ch('rotation.z', -0.12, 0)]),

    seq('colchao-cai', 'colchao', 3.1, 0.45, [ch('position.y', MY + 1.2, MY)], {
      ease: 'easeIn',
      caption: 'No galho grosso, um colchãozinho azul — e cai nele um COALA, que dorme vinte horas por dia.',
    }),
    seq('coala-cai', 'coala', 3.55, 0.55, [ch('position.y', KY + 1.4, KY)], { ease: 'easeIn' }),
    seq('cabeca-olha', 'cabeca', 3.55, 1.0, [ch('rotation.y', 0.5, 0)], { ease: 'easeInOut' }),
    seq('coala-amassa', 'coala', 4.1, 0.12, [ch('scale.y', 1, 0.9)], { ease: 'easeOut' }),
    seq('coala-volta', 'coala', 4.22, 0.25, [ch('scale.y', 0.9, 1)], { ease: 'easeOut' }),
    seq('cobertor-cai', 'cobertor', 4.6, 0.5, [ch('position.y', 0.9, 0)], {
      ease: 'easeIn',
      caption: 'Cobertor amarelo de bolinhas… mas as outras quatro horas ele passa pedindo historinha.',
    }),

    seq('livro-surge', 'livro', 5.8, 0.5, grow(), {
      ease: 'easeOut',
      caption: 'Você abre o livro de historinha vermelho e lê meia linha…',
    }),
    seq('capa-abre', 'capa', 5.8, 0.8, [ch('rotation.x', 0, CAPA_ABERTA)], { ease: 'easeOut' }),
    seq('pata-pousa', 'pata', 6.6, 0.35, [ch('rotation.z', 0.12, 0), ch('rotation.y', 0, 0)], { ease: 'easeOut' }),
    seq('pata-ergue', 'pata', 7.1, 0.4, [
      ch('rotation.z', 0, PATA_RZ_ALTO), ch('rotation.y', 0, PATA_RY_FRENTE),
    ], { ease: 'easeOut' }),
    seq('pata-bate', 'pata', 7.55, 0.2, [
      ch('rotation.z', PATA_RZ_ALTO, 0), ch('rotation.y', PATA_RY_FRENTE, 0),
    ], {
      ease: 'easeIn',
      caption: '…e é ele mesmo quem fecha o livro, com uma patada só: DÁKS!',
    }),
    seq('capa-fecha', 'capa', 7.55, 0.2, [ch('rotation.x', CAPA_ABERTA, 0)], { ease: 'easeIn' }),
    seq('abajur-treme', 'abajur', 7.75, 0.25, [ch('rotation.z', 0, 0.12)], { ease: 'easeOut' }),
    seq('abajur-volta', 'abajur', 8.0, 0.5, [ch('rotation.z', 0.12, 0)], { ease: 'easeInOut' }),

    seq('boca-boceja', 'boca', 8.9, 0.6, [ch('scale.y', 0.1, 1), ch('scale.x', 0.5, 1)], {
      ease: 'easeOut',
      caption: 'Solta um bocejo curtinho: A…',
    }),
    seq('cabeca-boceja', 'cabeca', 8.9, 0.6, [
      ch('rotation.x', 0, CAB_RX_BOCEJO), ch('position.y', CAB_Y_ACORDADA, CAB_Y),
    ], { ease: 'easeOut' }),

    seq('braco-ergue', 'braco', 10.0, 0.9, [
      ...grow(0.05), ch('rotation.z', BRACO_RZ_ANTES, 0),
    ], {
      ease: 'easeOut',
      caption: 'Ergue o braço e mostra o SOVACO: branquinho e fofo, feito travesseiro…',
    }),
    seq('cabeca-deita', 'cabeca', 11.1, 1.0, [
      ch('rotation.z', CAB_RZ_ACORDADA, CAB_RZ), ch('rotation.x', CAB_RX_BOCEJO, CAB_RX),
    ], {
      ease: 'easeInOut',
      caption: '…deita a cabeça nele e anuncia a cama: "no SÔÔÔ-VA…" — e apaga antes do CO, que já sai em ronco.',
    }),

    seq('zzz-sobe', 'zzz', 12.3, 0.9, [...grow(), ch('position.y', ZY - 0.45, ZY)], {
      ease: 'easeOut',
      caption: 'Dags att sova! — Hora de dormir!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.5, 4.1], target: [0.2, 1.62, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'dags-att-sova',
    contexto:
      "Casa: a frase do läggdags, a hora de deitar — na porta do quarto, desligando o tablet, no fim da historinha. Também na versão longa: 'Nu är det dags att sova'.",
    fraseFonte: 'Hora de dormir!',
    fraseAlvo: 'Dags att sova!',
    pronuncia:
      "DAKS a SÔÔ-va! ('dags' = DAKS: o g vira k colado no s e o A é curto, nada de 'dá-gui-s'; 'att' antes de verbo encolhe num 'a' rapidinho, e muito sueco fala 'ó'; 'sova' é uma das exceções em que o 'o' longo soa como o å: Ô FECHADO e longo, SÔÔ-va, o mesmo Ô de 'så' e de 'Sov gott!'; força no SÔ, nunca o 'SÓ-va' aberto de 'sova' (surra) em português, nem um 'SÚ-va' de U)",
    ponteSonora:
      "DÁKS! A... SÔÔ-VA(co)! (4 batidas: DÁKS-a-SÔÔ-va; força no DÁKS e, mais ainda, no SÔÔ; DÁKS = a pancada do livro de historinha fechando de uma vez: D de 'dado', A curto e aberto, e um K e um S colados no fim, SEM vogal no meio, nunca 'DÁ-kis' nem 'DÁ-gui-s'; é o 'dags', parente do DÁG de 'idag' (dia), mas na fala o G vira K antes do S e o A encurta; sem o S sobra 'dag', que é só 'dia'; A = o bocejo curtinho do coala, que é o 'att': fraco, rápido e sem força; SÔÔ-VA = o SOVACO do coala, o MESMO SOVACO de 'Sov gott!' (SÔÔV), só que cortado DEPOIS do VA: Ô FECHADO e LONGO, de boca redonda, o Ô do 'så' (SÔ) das outras cartas, com a força TODA no SÔ (o português joga a força no VA de so-VA-co: puxe pro SÔ) e o -CO engolido pelo ronco; lá no 'Sov gott!' o VA cai, porque 'sov!' é o pedido (durma!); aqui ele FICA, porque depois de 'att' vem o infinitivo 'sova' (dormir); nunca o Ó aberto de 'sova' (surra) em português, nem o U fechado de IS-KÚÚ-LAN: 'sova' é das palavras em que o 'o' longo sueco soa como å)",
    historia:
      "O coala dorme vinte horas por dia, e as outras quatro passa pedindo historinha. Hoje você abre o livro lá no alto do eucalipto, lê meia linha, e é ele mesmo quem fecha o livro com uma patada só: DÁKS! Solta um bocejo curtinho, A..., ergue o braço e deita a cabeça no próprio SOVACO, branquinho e fofo feito travesseiro, que é onde coala que se preze dorme. Ainda tenta anunciar a cama, 'no SÔÔÔ-VA...', mas apaga antes do CO, que já sai em ronco. Hora de dormir!",
  },
  createScene,
  refine: { organic: ['coala', 'cabeca', 'pata', 'braco'] },
}

export default card
