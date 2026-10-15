import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, type MatOpts,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag är hungrig." — IÁ É RRÚNG-ri!
 *
 * Um leão de guardanapo no pescoço, garfo e faca em pé nas patas, cansou de
 * esperar o garçom. A barriga ruge (RRÚNG!: os anéis laranja, o acento
 * saturado da cena) e ele morde o mapa da HUNGRIA no prato: a mordida leva o
 * -A e o acento junto — na placa sobra um HUNG gigante e um 'ri' miudinho.
 *
 * Diorama: piso xadrez vinho e creme, mesa redonda de toalha branca, prato
 * com o mapa verde-oliva mordido, vela e sininho de chamar garçom; o leão
 * sentado atrás da mesa, a cauda enrolada à direita, os roncos à esquerda.
 */

const GROUT = '#3a2326'
const WINE = '#7a2734'
const CREAM = '#eadcc0'
const WOOD = '#6e4529'
const WOOD_DARK = '#4e301d'
const CLOTH = '#f1ebdf'
const WHITE = '#fbfaf6'
const SILVER = '#cfd5da'
const BRASS = '#b89a5a'
const MAP = '#7f8b3e'
const MAP_DARK = '#66702f'
const WATER = '#8fb3c4'
const INK = '#5e1b26'
const GOLD = '#d4a04a'
const GOLD_DARK = '#b8843a'
const BELLY = '#efd7a0'
const MANE = '#a9482b'
const MANE_DARK = '#8a3820'
const NOSE = '#4a2a26'
const MOUTH = '#4f1a20'
const TONGUE = '#d9707a'
const TOOTH = '#fbf6ea'
const ACCENT = '#ff7a12' // acento saturado RESERVADO: os anéis do ronco (RRÚNG)

const FY = 0.14 // topo do piso
const TT = 0.76 // topo da toalha
const TZ = 0.3 // centro da mesa
const LZ = -1.08 // leão (sentado atrás da mesa)
const PLATE_Y = TT + 0.018 // fundo do prato
const MAP_TILT = 0.28 // borda de trás do mapa apoiada na aba do prato
const MAP_POS: [number, number, number] = [0, PLATE_Y + 0.05, TZ + 0.02]
const MAP_S = 1.1
// cabeça do leão (local do leão) e boca em coordenadas de mundo
const HEAD_LOCAL: [number, number, number] = [0, 1.98, 0.16]
const BELLY_W = new THREE.Vector3(-0.25, 1.2, LZ + 0.62)
const PAW_Y = TT + 0.09
const PAW_Z = -0.3
const PAW_X = 0.72

/** Malha com sombra a partir de uma forma 2D extrudada (no plano xy). */
function slab(shape: THREE.Shape, depth: number, color: string, bevel = 0.006, opts: MatOpts = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 24,
  })
  geo.translate(0, 0, -depth / 2)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.7, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cápsula esticada entre dois pontos — membros, cauda. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, dir.length()), color, { roughness: 0.85 })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

/** Recorta um polígono convexo-ou-não por um polígono convexo (Sutherland–Hodgman). */
function clip(subject: THREE.Vector2[], clipper: THREE.Vector2[]) {
  let out = subject
  for (let i = 0; i < clipper.length; i++) {
    const a = clipper[i]
    const b = clipper[(i + 1) % clipper.length]
    const inside = (p: THREE.Vector2) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= 0
    const cut = (p: THREE.Vector2, q: THREE.Vector2) => {
      const d1 = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
      const d2 = (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x)
      const t = d1 / (d1 - d2)
      return new THREE.Vector2(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t)
    }
    const input = out
    out = []
    for (let j = 0; j < input.length; j++) {
      const p = input[j]
      const q = input[(j + 1) % input.length]
      if (inside(q)) {
        if (!inside(p)) out.push(cut(p, q))
        out.push(q)
      } else if (inside(p)) {
        out.push(cut(p, q))
      }
    }
    if (out.length === 0) break
  }
  return out
}

/** Traço de letra: caixinha arredondada no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.008, INK, { roughness: 0.55 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Arco de traço (curvas do U, G, r). */
function arc(r: number, t: number, start: number, len: number, x: number, y: number, sx = 1) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, t / 2, 10, 28, len),
    mat(INK, { roughness: 0.55, size: r * 2 }),
  )
  m.castShadow = true
  m.position.set(x, y, 0)
  m.rotation.z = start
  m.scale.set(sx, 1, 0.9)
  return m
}

/** Letras de traço grosso, altura 1 (escaladas por quem chama). */
function glyph(which: 'H' | 'U' | 'N' | 'G' | 'r' | 'i') {
  const g = new THREE.Group()
  const t = 0.2
  if (which === 'H') {
    g.add(stroke(t, 1, -0.3, 0), stroke(t, 1, 0.3, 0), stroke(0.6, t * 0.95, 0, 0.02))
  } else if (which === 'U') {
    g.add(stroke(t, 0.68, -0.3, 0.16), stroke(t, 0.68, 0.3, 0.16))
    g.add(arc(0.3, t, Math.PI, Math.PI, 0, -0.18))
  } else if (which === 'N') {
    g.add(stroke(t, 1, -0.3, 0), stroke(t, 1, 0.3, 0), stroke(t * 1.05, 1.12, 0, 0, 0.52))
  } else if (which === 'G') {
    g.add(arc(0.4, t, 0.55, 2 * Math.PI - 0.55, 0, 0, 0.85))
    g.add(stroke(0.28, t * 0.95, 0.18, -0.02), stroke(t, 0.38, 0.3, -0.18))
  } else if (which === 'r') {
    g.add(stroke(t, 0.7, -0.14, -0.15))
    g.add(arc(0.24, t, 0.35, Math.PI - 0.35, 0.08, 0.02))
  } else {
    g.add(stroke(t, 0.66, 0, -0.17))
    const dot = sphere(t * 0.62, INK, { roughness: 0.55 })
    dot.position.set(0, 0.36, 0)
    dot.scale.z = 0.6
    g.add(dot)
  }
  return g
}

/** Contorno da Hungria (x leste, y norte), com a mordida em meia-lua no leste. */
function hungaryShape() {
  const pts: [number, number][] = [
    [-0.36, 0.02], [-0.34, 0.09], [-0.27, 0.13], [-0.2, 0.17], [-0.12, 0.15],
    [-0.05, 0.2], [0.03, 0.19], [0.1, 0.22], [0.17, 0.2], [0.23, 0.165],
  ]
  // mordida: arco côncavo com marquinhas de dente
  const C = new THREE.Vector2(0.37, 0.04)
  const n = 9
  for (let i = 0; i <= n; i++) {
    const a = THREE.MathUtils.degToRad(122 + (i / n) * 116)
    const r = i % 2 === 0 ? 0.135 : 0.118
    pts.push([C.x + Math.cos(a) * r, C.y + Math.sin(a) * r])
  }
  pts.push(
    [0.25, -0.1], [0.18, -0.13], [0.1, -0.12], [0.02, -0.17], [-0.06, -0.16],
    [-0.14, -0.13], [-0.22, -0.1], [-0.3, -0.06], [-0.35, -0.03],
  )
  const s = new THREE.Shape()
  s.moveTo(pts[0][0], pts[0][1])
  for (const [x, y] of pts.slice(1)) s.lineTo(x, y)
  s.closePath()
  return s
}

/** O pedaço arrancado: a ponta leste, com o recorte dos dentes do outro lado. */
function biteShape() {
  const s = new THREE.Shape()
  const pts: [number, number][] = []
  const C = new THREE.Vector2(0, 0)
  for (let i = 0; i <= 14; i++) {
    const a = THREE.MathUtils.degToRad(-70 + (i / 14) * 140)
    pts.push([C.x + Math.cos(a) * 0.11, C.y + Math.sin(a) * 0.12])
  }
  for (let i = 0; i <= 6; i++) {
    const a = THREE.MathUtils.degToRad(110 - (i / 6) * 40) + Math.PI
    const r = i % 2 === 0 ? 0.0 : 0.018
    pts.push([-0.035 - r + Math.cos(a) * 0.01, 0.1 - (i / 6) * 0.2])
  }
  s.moveTo(pts[0][0], pts[0][1])
  for (const [x, y] of pts.slice(1)) s.lineTo(x, y)
  s.closePath()
  return s
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- restaurante: piso xadrez vinho e creme -------------------------------
  const base = new THREE.Group()

  const disk = cylinder(2.66, 2.74, 0.12, GROUT, { roughness: 0.8 })
  disk.position.y = 0.06
  base.add(disk)

  const rim = torus(2.66, 0.05, WOOD_DARK, { roughness: 0.6 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.12
  base.add(rim)

  const circle: THREE.Vector2[] = []
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    circle.push(new THREE.Vector2(Math.cos(a) * 2.52, Math.sin(a) * 2.52))
  }
  const TILE = 0.46
  const GAP = 0.016
  const tileMats = [mat(WINE, { roughness: 0.4, size: TILE }), mat(CREAM, { roughness: 0.4, size: TILE })]
  for (let i = -6; i <= 5; i++) {
    for (let j = -6; j <= 5; j++) {
      const x0 = i * TILE + GAP / 2
      const y0 = j * TILE + GAP / 2
      const x1 = (i + 1) * TILE - GAP / 2
      const y1 = (j + 1) * TILE - GAP / 2
      const poly = clip(
        [new THREE.Vector2(x0, y0), new THREE.Vector2(x1, y0), new THREE.Vector2(x1, y1), new THREE.Vector2(x0, y1)],
        circle,
      )
      if (poly.length < 3) continue
      const shape = new THREE.Shape(poly)
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false })
      const tile = new THREE.Mesh(geo, tileMats[(i + j + 100) % 2])
      tile.rotation.x = -Math.PI / 2
      tile.position.y = 0.12
      tile.receiveShadow = true
      base.add(tile)
    }
  }

  // planta no canto do salão
  const vaso = lathe(
    [[0, 0], [0.2, 0], [0.23, 0.05], [0.2, 0.34], [0.24, 0.38], [0.23, 0.41], [0.18, 0.37], [0, 0.36]],
    '#8a4b34',
    { roughness: 0.45 },
  )
  vaso.position.set(-1.95, FY, -1.55)
  base.add(vaso)
  const folhas = puff(0.34, '#4a7a46', 7, 13, { roughness: 0.85 })
  folhas.position.set(-1.95, FY + 0.72, -1.55)
  folhas.scale.y = 1.15
  base.add(folhas)

  // cardápio de cavalete fechado, ao fundo à direita
  const cavalete = new THREE.Group()
  cavalete.position.set(1.85, FY, -1.15)
  cavalete.rotation.y = -0.5
  const quadro = rbox(0.5, 0.62, 0.04, 0.02, '#2c3330', { roughness: 0.8 })
  quadro.position.y = 0.62
  quadro.rotation.x = -0.12
  cavalete.add(quadro)
  const moldura = rbox(0.56, 0.68, 0.03, 0.02, WOOD, { roughness: 0.6 })
  moldura.position.set(0, 0.62, -0.02)
  moldura.rotation.x = -0.12
  cavalete.add(moldura)
  for (const s of [-1, 1]) {
    const perna = cylinder(0.018, 0.022, 0.95, WOOD, { roughness: 0.6 })
    perna.position.set(s * 0.22, 0.46, 0.0)
    perna.rotation.x = -0.12
    cavalete.add(perna)
  }
  const tras = cylinder(0.018, 0.022, 0.9, WOOD, { roughness: 0.6 })
  tras.position.set(0, 0.44, -0.2)
  tras.rotation.x = 0.35
  cavalete.add(tras)
  // prato, garfo e faca desenhados a giz
  const giz = new THREE.Group()
  giz.position.set(0, 0.62, 0.025)
  giz.rotation.x = -0.12
  const gizPrato = torus(0.1, 0.012, '#e8e4da', { roughness: 0.9 })
  gizPrato.scale.z = 0.3
  giz.add(gizPrato)
  for (const s of [-1, 1]) {
    const talher = rbox(0.022, 0.3, 0.008, 0.005, '#e8e4da', { roughness: 0.9 })
    talher.position.x = s * 0.17
    giz.add(talher)
  }
  for (let k = 0; k < 3; k++) {
    const dente = rbox(0.012, 0.07, 0.008, 0.004, '#e8e4da', { roughness: 0.9 })
    dente.position.set(-0.17 + (k - 1) * 0.022, 0.17, 0)
    giz.add(dente)
  }
  cavalete.add(giz)
  base.add(cavalete)

  root.add(base)

  // ---- mesa redonda com toalha, prato, vela e sininho ------------------------
  const mesa = new THREE.Group()

  const pe = lathe(
    [[0, 0], [0.34, 0], [0.34, 0.03], [0.2, 0.07], [0.07, 0.12], [0.06, 0.3], [0, 0.3]],
    WOOD_DARK,
    { roughness: 0.5 },
  )
  pe.position.y = FY
  mesa.add(pe)
  const coluna = cylinder(0.06, 0.07, TT - FY - 0.25, WOOD, { roughness: 0.5 })
  coluna.position.y = FY + (TT - FY - 0.25) / 2 + 0.2
  mesa.add(coluna)

  // toalha: tampo e saia caindo em leve sino
  const toalha = lathe(
    [
      [0, TT - 0.3], [0.93, TT - 0.3], [0.955, TT - 0.3], [0.948, TT - 0.27],
      [0.91, TT - 0.15], [0.885, TT - 0.06], [0.86, TT - 0.015], [0.82, TT], [0, TT],
    ],
    CLOTH,
    { roughness: 0.88 },
    64,
  )
  toalha.position.z = TZ
  mesa.add(toalha)
  // barra bordada na saia
  const barra = torus(0.952, 0.016, WINE, { roughness: 0.8 })
  barra.rotation.x = Math.PI / 2
  barra.position.set(0, TT - 0.285, TZ)
  mesa.add(barra)
  // dobras do caimento
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2 + 0.07
    const dobraT = limb(
      new THREE.Vector3(Math.cos(a) * 0.878, TT - 0.07, TZ + Math.sin(a) * 0.878),
      new THREE.Vector3(Math.cos(a) * 0.935, TT - 0.26, TZ + Math.sin(a) * 0.935),
      0.022,
      CLOTH,
    )
    mesa.add(dobraT)
  }
  pe.position.z = TZ
  coluna.position.z = TZ

  // prato branco grande com filete vinho
  const prato = lathe(
    [[0, 0], [0.24, 0], [0.27, 0.012], [0.3, 0.02], [0.42, 0.04], [0.44, 0.048], [0.43, 0.052], [0.3, 0.03], [0.26, 0.022], [0, 0.02]],
    WHITE,
    { roughness: 0.18 },
    64,
  )
  prato.position.set(0, TT, TZ + 0.02)
  mesa.add(prato)
  const filete = torus(0.395, 0.007, WINE, { roughness: 0.3 })
  filete.rotation.x = Math.PI / 2 - 0.0
  filete.position.set(0, TT + 0.047, TZ + 0.02)
  mesa.add(filete)

  // vela num castiçal, à esquerda na frente
  const castical = lathe(
    [[0, 0], [0.08, 0], [0.08, 0.015], [0.03, 0.03], [0.022, 0.09], [0.045, 0.1], [0.045, 0.115], [0, 0.115]],
    BRASS,
    { roughness: 0.3, metalness: 0.75 },
  )
  castical.position.set(-0.6, TT, TZ + 0.42)
  mesa.add(castical)
  const vela = cylinder(0.032, 0.032, 0.2, '#f3ead6', { roughness: 0.6 })
  vela.position.set(-0.6, TT + 0.215, TZ + 0.42)
  mesa.add(vela)
  const chama = sphere(0.022, '#ffd27a', { emissive: '#ffb13b', emissiveIntensity: 1.6 })
  chama.scale.y = 1.7
  chama.position.set(-0.6, TT + 0.345, TZ + 0.42)
  mesa.add(chama)

  // sininho de chamar o garçom (que não vem)
  const sino = new THREE.Group()
  sino.position.set(0.6, TT, TZ + 0.4)
  const sinoBase = cylinder(0.085, 0.09, 0.025, WOOD_DARK, { roughness: 0.5 })
  sinoBase.position.y = 0.0125
  sino.add(sinoBase)
  const cupula = lathe(
    [[0, 0.025], [0.078, 0.025], [0.075, 0.04], [0.06, 0.08], [0.03, 0.105], [0, 0.11]],
    BRASS,
    { roughness: 0.22, metalness: 0.85 },
  )
  sino.add(cupula)
  const botao = sphere(0.016, BRASS, { roughness: 0.22, metalness: 0.85 })
  botao.position.y = 0.125
  sino.add(botao)
  mesa.add(sino)

  root.add(mesa)

  // ---- LEÃO sentado atrás da mesa (peça orgânica) ---------------------------
  const leao = new THREE.Group()
  leao.position.set(0, FY, LZ)
  root.add(leao)

  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

  for (const side of [-1, 1]) {
    const anca = sphere(0.42, GOLD, { roughness: 0.85 })
    anca.scale.set(0.9, 1, 1.15)
    anca.position.set(side * 0.42, 0.42, -0.05)
    leao.add(anca)

    const patinha = sphere(0.17, GOLD, { roughness: 0.85 })
    patinha.scale.set(0.95, 0.6, 1.4)
    patinha.position.set(side * 0.5, 0.1, 0.36)
    leao.add(patinha)

    // braço: ombro musculoso descendo até a pata apoiada na mesa
    const ombro = V(side * 0.4, 1.4, 0.12)
    const pulso = V(side * PAW_X, PAW_Y - FY + 0.02, PAW_Z - LZ - 0.06)
    leao.add(limb(ombro, pulso, 0.135, GOLD))
    const musculo = sphere(0.2, GOLD, { roughness: 0.85 })
    musculo.position.set(side * 0.42, 1.34, 0.14)
    leao.add(musculo)

    const pata = sphere(0.15, GOLD, { roughness: 0.85 })
    pata.scale.set(1.05, 0.85, 1.05)
    pata.position.set(side * PAW_X, PAW_Y - FY, PAW_Z - LZ)
    leao.add(pata)
    for (let d = 0; d < 3; d++) {
      const dedo = sphere(0.055, GOLD_DARK, { roughness: 0.85 })
      dedo.position.set(side * PAW_X + (d - 1) * 0.07, PAW_Y - FY - 0.05, PAW_Z - LZ + 0.13)
      leao.add(dedo)
    }
  }

  const tronco = capsule(0.46, 0.62, GOLD, { roughness: 0.85 })
  tronco.position.set(0, 1.0, -0.02)
  tronco.rotation.x = -0.08
  leao.add(tronco)

  const peito = sphere(0.42, BELLY, { roughness: 0.85 })
  peito.scale.set(1, 1.18, 0.84)
  peito.position.set(0, 1.08, 0.2)
  leao.add(peito)

  // cauda enrolada no chão à direita, com tufo
  const cauda = new THREE.CatmullRomCurve3([
    V(0.3, 0.22, -0.4), V(0.78, 0.1, -0.35), V(1.12, 0.1, -0.02),
    V(1.18, 0.28, 0.28), V(1.06, 0.55, 0.4),
  ])
  // cápsulas encadeadas (fechadas: o Blender funde sem buracos)
  const pts = cauda.getSpacedPoints(9)
  for (let k = 0; k < pts.length - 1; k++) {
    leao.add(limb(pts[k], pts[k + 1], 0.08 - k * 0.003, GOLD))
  }
  const tufo = puff(0.12, MANE_DARK, 5, 7, { roughness: 0.9 })
  tufo.position.set(1.04, 0.62, 0.42)
  leao.add(tufo)

  // ---- cabeça: boca escancarada ---------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(...HEAD_LOCAL)
  leao.add(cabeca)

  const cranio = sphere(0.36, GOLD, { roughness: 0.85 })
  cranio.scale.set(1, 0.95, 0.95)
  cabeca.add(cranio)

  const ponte = sphere(0.15, GOLD, { roughness: 0.85 })
  ponte.scale.set(0.85, 0.8, 1.3)
  ponte.position.set(0, 0.04, 0.26)
  cabeca.add(ponte)

  for (const side of [-1, 1]) {
    const bochecha = sphere(0.14, BELLY, { roughness: 0.85 })
    bochecha.position.set(side * 0.1, -0.08, 0.3)
    bochecha.scale.set(1, 0.85, 0.9)
    cabeca.add(bochecha)

    const orelha = sphere(0.1, GOLD, { roughness: 0.85 })
    orelha.scale.set(1, 1, 0.55)
    orelha.position.set(side * 0.27, 0.3, -0.02)
    cabeca.add(orelha)
    const orelhaIn = sphere(0.06, GOLD_DARK, { roughness: 0.85 })
    orelhaIn.scale.set(1, 1, 0.5)
    orelhaIn.position.set(side * 0.27, 0.3, 0.03)
    cabeca.add(orelhaIn)

    const olho = sphere(0.068, '#ffffff', { roughness: 0.25 })
    olho.scale.z = 0.6
    olho.position.set(side * 0.13, 0.13, 0.3)
    const pupila = sphere(0.034, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.125, 0.12, 0.34)
    cabeca.add(olho, pupila)

    // sobrancelha franzida de fome
    const sobr = capsule(0.024, 0.11, GOLD_DARK, { roughness: 0.85 })
    sobr.position.set(side * 0.14, 0.22, 0.31)
    sobr.rotation.z = Math.PI / 2 + side * 0.4
    cabeca.add(sobr)

    // presas
    const presaC = cone(0.03, 0.1, TOOTH, { roughness: 0.3 })
    presaC.rotation.x = Math.PI
    presaC.position.set(side * 0.1, -0.2, 0.38)
    cabeca.add(presaC)
    const presaB = cone(0.026, 0.08, TOOTH, { roughness: 0.3 })
    presaB.position.set(side * 0.09, -0.4, 0.35)
    cabeca.add(presaB)
  }
  for (const dx of [-0.035, 0.035]) {
    const incisivo = rbox(0.04, 0.05, 0.03, 0.012, TOOTH, { roughness: 0.3 })
    incisivo.position.set(dx, -0.17, 0.4)
    cabeca.add(incisivo)
  }

  const nariz = sphere(0.065, NOSE, { roughness: 0.35 })
  nariz.scale.set(1.35, 0.8, 0.85)
  nariz.position.set(0, 0.02, 0.43)
  cabeca.add(nariz)

  const boca = sphere(0.17, MOUTH, { roughness: 0.6 })
  boca.scale.set(1.0, 1.05, 0.6)
  boca.position.set(0, -0.28, 0.27)
  cabeca.add(boca)

  const lingua = sphere(0.1, TONGUE, { roughness: 0.4 })
  lingua.scale.set(1.1, 0.45, 1)
  lingua.position.set(0, -0.38, 0.3)
  cabeca.add(lingua)

  const queixo = sphere(0.15, BELLY, { roughness: 0.85 })
  queixo.scale.set(1.05, 0.55, 1.05)
  queixo.position.set(0, -0.47, 0.23)
  cabeca.add(queixo)

  // ---- juba volumosa (filha da cabeça) --------------------------------------
  const juba = new THREE.Group()
  cabeca.add(juba)
  const nuca = sphere(0.42, MANE, { roughness: 0.92 })
  nuca.position.set(0, 0.0, -0.18)
  juba.add(nuca)
  const nLumps = 13
  for (let i = 0; i < nLumps; i++) {
    const a = (i / nLumps) * Math.PI * 2 + 0.12
    const r = 0.17 + rand() * 0.05
    const lump = sphere(r, i % 3 === 0 ? MANE_DARK : MANE, { roughness: 0.92 })
    const R = 0.44 + rand() * 0.04
    lump.position.set(Math.cos(a) * R, Math.sin(a) * R * 0.98 - 0.02, -0.1 - rand() * 0.04)
    juba.add(lump)
  }

  // ---- guardanapo amarrado no pescoço ----------------------------------------
  const guardanapo = new THREE.Group()
  guardanapo.position.set(0, 1.52, 0.5)
  guardanapo.rotation.x = 0.12
  leao.add(guardanapo)
  const bib = new THREE.Shape()
  bib.moveTo(-0.3, 0)
  bib.quadraticCurveTo(0, 0.04, 0.3, 0)
  bib.quadraticCurveTo(0.2, -0.25, 0.03, -0.5)
  bib.quadraticCurveTo(0, -0.53, -0.03, -0.5)
  bib.quadraticCurveTo(-0.2, -0.25, -0.3, 0)
  const pano = slab(bib, 0.02, WHITE, 0.012, { roughness: 0.85 })
  guardanapo.add(pano)
  // dobra e as duas pontas do nó
  const dobra = rbox(0.6, 0.05, 0.05, 0.022, WHITE, { roughness: 0.85 })
  dobra.position.set(0, 0.0, 0.01)
  guardanapo.add(dobra)
  for (const s of [-1, 1]) {
    const ponta = new THREE.Shape()
    ponta.moveTo(0, 0)
    ponta.quadraticCurveTo(0.06, 0.05, 0.14, 0.12)
    ponta.quadraticCurveTo(0.12, 0.03, 0.1, -0.04)
    ponta.closePath()
    const p = slab(ponta, 0.015, WHITE, 0.008, { roughness: 0.85 })
    p.scale.x = s
    p.position.set(s * 0.27, 0.0, 0.0)
    guardanapo.add(p)
  }

  // ---- garfo e faca em pé nas patas -------------------------------------------
  const metal = { roughness: 0.22, metalness: 0.85 }

  const garfo = new THREE.Group()
  garfo.position.set(-PAW_X, TT, PAW_Z + 0.06)
  garfo.scale.setScalar(1.2)
  const gCabo = rbox(0.055, 0.34, 0.026, 0.012, SILVER, metal)
  gCabo.position.y = 0.17
  garfo.add(gCabo)
  const gPesc = rbox(0.03, 0.08, 0.02, 0.008, SILVER, metal)
  gPesc.position.y = 0.37
  garfo.add(gPesc)
  const gCab = rbox(0.12, 0.06, 0.02, 0.01, SILVER, metal)
  gCab.position.y = 0.42
  garfo.add(gCab)
  for (let k = 0; k < 4; k++) {
    const dente = rbox(0.018, 0.14, 0.018, 0.007, SILVER, metal)
    dente.position.set(-0.045 + k * 0.03, 0.51, 0)
    garfo.add(dente)
  }
  root.add(garfo)

  const faca = new THREE.Group()
  faca.position.set(PAW_X, TT, PAW_Z + 0.06)
  faca.scale.setScalar(1.2)
  const fCabo = rbox(0.06, 0.32, 0.034, 0.014, SILVER, metal)
  fCabo.position.y = 0.16
  faca.add(fCabo)
  const fGola = rbox(0.072, 0.025, 0.04, 0.01, SILVER, metal)
  fGola.position.y = 0.33
  faca.add(fGola)
  const lamina = new THREE.Shape()
  lamina.moveTo(-0.034, 0)
  lamina.lineTo(0.034, 0)
  lamina.lineTo(0.034, 0.2)
  lamina.quadraticCurveTo(0.034, 0.29, -0.034, 0.29)
  lamina.closePath()
  const fLam = slab(lamina, 0.01, SILVER, 0.004, metal)
  fLam.position.y = 0.34
  faca.add(fLam)
  root.add(faca)

  // ---- mapa da Hungria no prato, com a mordida no leste ----------------------
  const mapa = new THREE.Group()
  mapa.position.set(...MAP_POS)
  mapa.rotation.x = MAP_TILT
  root.add(mapa)

  const mapaPlano = new THREE.Group()
  mapaPlano.rotation.x = -Math.PI / 2
  mapaPlano.scale.setScalar(MAP_S)
  mapa.add(mapaPlano)
  const terra = slab(hungaryShape(), 0.016, MAP, 0.006, { roughness: 0.8 })
  mapaPlano.add(terra)
  // Danúbio descendo do norte, lago Balaton a oeste, Budapeste
  const rio = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.2, 0.016), new THREE.Vector3(0.02, 0.12, 0.016),
    new THREE.Vector3(-0.01, 0.02, 0.016), new THREE.Vector3(0.02, -0.08, 0.016),
    new THREE.Vector3(0.0, -0.16, 0.016),
  ])
  const rioMesh = new THREE.Mesh(new THREE.TubeGeometry(rio, 24, 0.009, 6, false), mat(WATER, { roughness: 0.3 }))
  mapaPlano.add(rioMesh)
  const balaton = sphere(0.04, WATER, { roughness: 0.3 })
  balaton.scale.set(1.5, 0.45, 0.25)
  balaton.rotation.z = 0.4
  balaton.position.set(-0.13, -0.02, 0.016)
  mapaPlano.add(balaton)
  const capital = cylinder(0.016, 0.016, 0.01, INK, { roughness: 0.5 })
  capital.rotation.x = Math.PI / 2
  capital.position.set(0.0, 0.08, 0.02)
  mapaPlano.add(capital)
  // borda de fronteira mais escura
  const fronteira = slab(hungaryShape(), 0.008, MAP_DARK, 0.0, { roughness: 0.85 })
  fronteira.scale.setScalar(1.035)
  fronteira.position.z = -0.008
  mapaPlano.add(fronteira)

  // ---- pedaço arrancado: na boca do leão --------------------------------------
  const headW = new THREE.Vector3(HEAD_LOCAL[0], HEAD_LOCAL[1] + FY, HEAD_LOCAL[2] + LZ)
  const MOUTH_W: [number, number, number] = [headW.x + 0.13, headW.y - 0.3, headW.z + 0.4]
  // ponto da mordida no mapa (mundo), descontando a inclinação
  const BITE_LOCAL = new THREE.Vector3(0.37 * MAP_S, 0, -0.04 * MAP_S)
  BITE_LOCAL.applyEuler(new THREE.Euler(MAP_TILT, 0, 0))
  const BITE_W: [number, number, number] = [
    MAP_POS[0] + BITE_LOCAL.x, MAP_POS[1] + BITE_LOCAL.y + 0.01, MAP_POS[2] + BITE_LOCAL.z,
  ]
  const pedaco = new THREE.Group()
  pedaco.position.set(...MOUTH_W)
  pedaco.rotation.x = 1.45
  pedaco.rotation.y = 0.5
  root.add(pedaco)
  const naco = slab(biteShape(), 0.016, MAP, 0.006, { roughness: 0.8 })
  naco.rotation.x = -Math.PI / 2
  naco.scale.setScalar(MAP_S * 0.8)
  pedaco.add(naco)

  // ---- placa: HUNG gigante + 'ri' miudinho -------------------------------------
  const PLACA_Y = PLATE_Y + 0.36
  const PLACA_Z = TZ - 0.08
  const placa = new THREE.Group()
  placa.position.set(-0.06, PLACA_Y, PLACA_Z)
  placa.rotation.x = -0.12
  root.add(placa)
  const tabuleta = rbox(0.86, 0.3, 0.035, 0.03, '#f6efdf', { roughness: 0.6 })
  placa.add(tabuleta)
  const molduraP = rbox(0.9, 0.34, 0.025, 0.035, WOOD, { roughness: 0.6 })
  molduraP.position.z = -0.012
  placa.add(molduraP)
  for (const s of [-1, 1]) {
    const estaca = cylinder(0.012, 0.012, 0.28, WOOD_DARK, { roughness: 0.6 })
    estaca.position.set(s * 0.3, -0.26, -0.02)
    placa.add(estaca)
  }
  const H = 0.19
  const letras: ['H' | 'U' | 'N' | 'G', number][] = [['H', -0.31], ['U', -0.135], ['N', 0.04], ['G', 0.215]]
  for (const [l, x] of letras) {
    const g = glyph(l)
    g.scale.set(H, H, 1)
    g.position.set(x, 0.0, 0.03)
    placa.add(g)
  }

  // o 'ri' miudinho é peça própria: encolhe de susto
  const ri = new THREE.Group()
  ri.position.set(0.355, -0.045, 0.03)
  placa.add(ri)
  const hr = 0.085
  const r1 = glyph('r')
  r1.scale.set(hr, hr, 1)
  r1.position.x = -0.022
  ri.add(r1)
  const i1 = glyph('i')
  i1.scale.set(hr, hr, 1)
  i1.position.x = 0.03
  ri.add(i1)

  // ---- RRÚNG: anéis do ronco saindo da barriga ---------------------------------
  const dir = new THREE.Vector3(-0.75, 0.62, 0.22).normalize()
  const toCam = new THREE.Vector3(0.1, 0.25, 1).normalize()
  const axis = dir.clone().multiplyScalar(0.55).add(toCam).normalize()
  const ringMat = mat(ACCENT, { roughness: 0.35, emissive: '#ff5a00', emissiveIntensity: 0.35 })
  const ring = (dist: number, r: number) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 16, 48), ringMat)
    m.castShadow = true
    m.position.copy(dir).multiplyScalar(dist)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis)
    return m
  }
  const ronco1 = new THREE.Group()
  ronco1.position.copy(BELLY_W)
  ronco1.add(ring(0.72, 0.15))
  root.add(ronco1)

  const ronco2 = new THREE.Group()
  ronco2.position.copy(BELLY_W)
  ronco2.add(ring(1.2, 0.22), ring(1.78, 0.3))
  root.add(ronco2)

  // ---- peças -------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'restaurante', object: base },
    { name: 'mesa', group: 'restaurante', object: mesa },
    { name: 'leao', group: 'leao', object: leao },
    { name: 'cabeca', group: 'leao', object: cabeca },
    { name: 'juba', group: 'leao', object: juba },
    { name: 'guardanapo', group: 'talheres', object: guardanapo },
    { name: 'garfo', group: 'talheres', object: garfo },
    { name: 'faca', group: 'talheres', object: faca },
    { name: 'ronco1', group: 'ronco', object: ronco1 },
    { name: 'mapa', group: 'mapa', object: mapa },
    { name: 'pedaco', group: 'mapa', object: pedaco },
    { name: 'placa', group: 'mordida', object: placa },
    { name: 'ri', group: 'mordida', object: ri },
    { name: 'ronco2', group: 'iae', object: ronco2 },
  ]

  // ---- montagem ------------------------------------------------------------------
  const S = (part: string, at: number, dur: number, a: number, b: number, extra?: Parameters<typeof seq>[5]) =>
    seq(`${part}-escala-${at}`, part, at, dur, [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)], extra)

  const [mx, my, mz] = MOUTH_W
  const [bx, by, bz] = BITE_W
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Um restaurante sobe do chão: piso xadrez, mesa redonda, toalha branca e um prato vazio.',
    }),
    seq('mesa-rise', 'mesa', 0.35, 0.8, [riseFrom(0, 1.1)], { ease: 'easeOut' }),

    seq('leao-rise', 'leao', 1.8, 0.9, [riseFrom(FY, 2.8)], {
      ease: 'easeOut',
      caption: 'Senta à mesa um LEÃO esfomeado — esperando há horas um garçom que não vem.',
    }),
    seq('cabeca-olha', 'cabeca', 1.8, 1.1, [ch('rotation.y', 0.7, 0), ch('rotation.x', -0.3, 0)]),
    S('juba', 2.35, 0.5, 0.4, 1, { ease: 'easeOut' }),

    S('guardanapo', 3.6, 0.45, 0.01, 1, {
      ease: 'easeOut',
      caption: 'Guardanapo amarrado no pescoço, garfo e faca em pé nas patas…',
    }),
    seq('garfo-cai', 'garfo', 3.85, 0.6, [ch('position.y', TT + 1.1, TT), ch('rotation.y', 3.2, 0)], { ease: 'easeOut' }),
    seq('faca-cai', 'faca', 4.0, 0.6, [ch('position.y', TT + 1.1, TT), ch('rotation.y', -3.2, 0)], { ease: 'easeOut' }),

    S('ronco1', 5.3, 0.6, 0.01, 1, {
      ease: 'easeOut',
      caption: '…e a barriga dele ruge mais alto que ele: RRÚNG!',
    }),
    seq('leao-treme-a', 'leao', 5.3, 0.12, [ch('rotation.z', 0, 0.035)]),
    seq('leao-treme-b', 'leao', 5.42, 0.12, [ch('rotation.z', 0.035, -0.03)]),
    seq('leao-treme-c', 'leao', 5.54, 0.2, [ch('rotation.z', -0.03, 0)]),

    seq('mapa-abre', 'mapa', 6.8, 0.75, [ch('position.y', MAP_POS[1] + 0.9, MAP_POS[1]), ch('scale.x', 0.12, 1)], {
      ease: 'easeOut',
      caption: 'Sem paciência, ele abre o mapa da HUNGRIA em cima do prato…',
    }),
    seq('pedaco-abre', 'pedaco', 6.8, 0.75, [
      ch('position.y', by + 0.9, by), ch('position.x', MAP_POS[0] + (bx - MAP_POS[0]) * 0.12, bx),
      ch('position.z', bz, bz), ch('rotation.x', MAP_TILT, MAP_TILT),
    ], { ease: 'easeOut' }),

    seq('cabeca-bote', 'cabeca', 8.2, 0.3, [
      ch('rotation.x', 0, 0.42), ch('position.z', HEAD_LOCAL[2], HEAD_LOCAL[2] + 0.32),
      ch('position.y', HEAD_LOCAL[1], HEAD_LOCAL[1] - 0.22),
    ], {
      ease: 'easeIn',
      caption: '…e crava os dentes nela! A mordida arranca o -A — e o acento vai junto.',
    }),
    seq('pedaco-arranca', 'pedaco', 8.45, 0.5, [
      ch('position.x', bx, mx), ch('position.y', by, my), ch('position.z', bz, mz),
      ch('rotation.x', MAP_TILT, 1.45),
    ], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', 8.5, 0.45, [
      ch('rotation.x', 0.42, 0), ch('position.z', HEAD_LOCAL[2] + 0.32, HEAD_LOCAL[2]),
      ch('position.y', HEAD_LOCAL[1] - 0.22, HEAD_LOCAL[1]),
    ], { ease: 'easeOut' }),

    seq('placa-rise', 'placa', 9.6, 0.6, [riseFrom(PLACA_Y, 0.5), ch('scale.x', 0.4, 1), ch('scale.y', 0.4, 1)], {
      ease: 'easeOut',
      caption: "O nome encolhe de susto: fica um HUNG gigante e um 'ri' miudinho — RRÚNG-ri, nunca 'hun-GRI'.",
    }),
    S('ri', 9.6, 0.4, 0.01, 2.2, { ease: 'easeOut' }),
    S('ri', 10.15, 0.5, 2.2, 1, { ease: 'easeInOut' }),

    S('ronco2', 11.4, 0.7, 0.01, 1, {
      ease: 'easeOut',
      caption: 'A barriga ronca de novo e ele bate os talheres na mesa: IÁ É RRÚNG-ri!',
    }),
    seq('garfo-bate-a', 'garfo', 11.4, 0.18, [ch('position.y', TT, TT + 0.14)], { ease: 'easeOut' }),
    seq('garfo-bate-b', 'garfo', 11.58, 0.14, [ch('position.y', TT + 0.14, TT)], { ease: 'easeIn' }),
    seq('faca-bate-a', 'faca', 11.72, 0.18, [ch('position.y', TT, TT + 0.14)], { ease: 'easeOut' }),
    seq('faca-bate-b', 'faca', 11.9, 0.14, [ch('position.y', TT + 0.14, TT)], { ease: 'easeIn' }),

    S('ronco1', 12.9, 0.5, 1.25, 1, {
      ease: 'easeOut',
      caption: 'Jag är hungrig. — Estou com fome.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.6, 4.8], target: [-0.1, 1.36, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-hungrig',
    contexto:
      "Em casa: com o parceiro ou os filhos; com colegas pouco antes do almoço ('ska vi äta?'); na estrada, procurando onde parar pra comer.",
    fraseFonte: 'Estou com fome.',
    fraseAlvo: 'Jag är hungrig.',
    pronuncia:
      "iá é RRÚNG-ri(g) ('jag' = iá; 'är' = é; 'hungrig' com h soprado, U curto meio arredondado (quase ö), NG nasal sem estalar o G, R de um toque só; o -g final é fraquinho ou some na fala)",
    ponteSonora:
      "IÁ É RRÚNG-RI! (4 sílabas, tônica forte no RRÚNG; IÁ é o 'jag' de sempre, I de ioga; É = 'är', aberto e curto, o mesmo de 'Jag är sjuk'; RRÚNG = o ronco da barriga do leão: o RR carioca soprado é o h sueco, o U é curto e meio arredondado, quase ö, e o NG é nasal como no fim de 'ping' — o G não estala; RI = o mesmo -ig mudo de TRÊV-LI, R de um toque só, de 'cara', nunca RR. A HUNGRIA mordida dá a palavra inteira, MAS CUIDADO: lida em português, 'Hungria' sai 'un-GRI-a', com H mudo e força no GRI — e 'HUNGRI' sozinho viraria oxítona, como 'saci'. Por isso o ronco vem PRIMEIRO e carrega a força: a mordida arrancou o -A e, com ele, o acento, que caiu inteiro no RRÚNG; no mapa sobra 'HUNG' em letras enormes e um 'ri' minúsculo — RRÚNG-ri, forte no começo, nunca 'hun-GRI'. De quebra, é o 'hungry' do inglês, mesma tônica, dito com U)",
    historia:
      "O leão está de guardanapo amarrado no pescoço, garfo e faca em pé nas patas, esperando há horas um garçom que não vem. A barriga dele ruge mais alto que ele: RRÚNG! Sem paciência, ele abre o mapa-múndi em cima do prato e crava os dentes num país, a HUNGRIA. A mordida leva o -A embora e o resto do nome encolhe de susto: no mapa fica um HUNG gigante e um 'ri' miudinho. A barriga ronca de novo por cima, RRÚNG!, e o ri sai baixinho atrás. De boca cheia, ele bate os talheres na mesa e anuncia pra todo o restaurante, com toda a força no ronco: IÁ É RRÚNG-ri! É tanta fome que ele come um país.",
  },
  createScene,
  refine: { organic: ['leao', 'cabeca', 'juba'] },
}

export default card
