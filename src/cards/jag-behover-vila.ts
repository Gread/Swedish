import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock,
} from '../rig/helpers'

/**
 * "Jag behöver vila." — IÁ! BERRÔ: VER... VILA!
 *
 * O peixe-boi passou o dia empurrando barcos encalhados, solta um IÁ! de
 * exausto, BERROU "VER..." sem fôlego e desaba de barriga pra cima em cima
 * dos telhados da VILA de pescadores, que afundam feito colchão de molas.
 *
 * Diorama: praia de areia com faixa de mar turquesa ao fundo; três casinhas
 * (rosa, amarela, azul) com telhados vermelhos afundados no meio — o acento
 * saturado, porque a VILA é a cama; peixe-boi cinza esparramado por cima,
 * cabeça num travesseiro listrado, cauda-remo pendendo da última casa;
 * placa VILA na areia, barquinho encalhado e três Z de ronco.
 */

const SAND = '#e6d3a3'
const SAND_WET = '#cdb47f'
const SEA = '#38b3ad'
const SEA_DEEP = '#2b8f98'
const FOAM = '#f4fbf8'
const PINK = '#ee9fae'
const YELLOW = '#f2cf6b'
const BLUE = '#8fb8e0'
const TRIM = '#f7f1e4'
const DOOR = '#6e4a2f'
const GLASS = '#3d6f96'
const STONE = '#9a958c'
const ROOF = '#d8432c' // acento saturado RESERVADO: os telhados da VILA (a cama)
const ROOF_DARK = '#a8331f'
const GRAY = '#7f8b93'
const GRAY_DARK = '#66727a'
const BELLY = '#aab4ba'
const MUZZLE = '#8e9aa1'
const INK = '#2a2f33'
const PILLOW = '#f7f5ef'
const PILLOW_STRIPE = '#3a6fb5'
const WOOD = '#7a5536'
const WOOD_DARK = '#563a24'
const LETTER = '#fbf4e2'
const BOAT = '#f4f1ea'
const BOAT_STRIPE = '#2f62a8'

const GY = 0.14 // topo da areia
const WALL_H = 0.62
const WT = GY + WALL_H // topo das paredes = base dos telhados
const HOUSE_X = [-1.0, 0, 1.0]
const HZ = -0.12
const SEA_Z = 1.25 // a linha d'água fica em z = -SEA_Z

// peixe-boi: pose final (de barriga pra cima, apoiado nos telhados)
const BX = 0.22
const BY = 1.38
const BZ = -0.12
const SWIM_Z = -1.7 // no mar, atrás das casas
const SWIM_Y = 0.78

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0, color = LETTER) {
  const s = rbox(w, h, 0.03, 0.008, color, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** V I L A — letras de traço grosso para a placa. */
function letter(which: 'V' | 'I' | 'L' | 'A') {
  const g = new THREE.Group()
  const t = 0.036
  const lean = Math.atan(0.07 / 0.2)
  const len = Math.hypot(0.07, 0.2)
  if (which === 'V') {
    g.add(stroke(t, len, -0.035, 0, lean))
    g.add(stroke(t, len, 0.035, 0, -lean))
  } else if (which === 'I') {
    g.add(stroke(t, 0.2, 0, 0))
  } else if (which === 'L') {
    g.add(stroke(t, 0.2, -0.03, 0))
    g.add(stroke(0.1, t, 0.017, -0.082))
  } else {
    g.add(stroke(t, len, -0.035, 0, -lean))
    g.add(stroke(t, len, 0.035, 0, lean))
    g.add(stroke(0.075, 0.03, 0, -0.035))
  }
  return g
}

/** Um Z de ronco, de traço grosso, virado para a câmera. */
function zee(size: number) {
  const g = new THREE.Group()
  const t = size * 0.2
  const w = size * 0.8
  const top = stroke(w, t, 0, size / 2 - t / 2, 0, '#ffffff')
  const bottom = stroke(w, t, 0, -size / 2 + t / 2, 0, '#ffffff')
  const diag = stroke(t, Math.hypot(w - t, size - t), 0, 0, -Math.atan((w - t) / (size - t)), '#ffffff')
  g.add(top, bottom, diag)
  return g
}

/**
 * Telhado de duas águas com o meio AFUNDADO (perfil em M) — a cumeeira
 * corre em profundidade, então o perfil amassado aparece de frente.
 */
function roof(color: string) {
  const g = new THREE.Group()
  const pts: [number, number][] = [[-0.47, 0], [-0.26, 0.26], [0, 0.12], [0.26, 0.26], [0.47, 0]]
  const shape = new THREE.Shape()
  shape.moveTo(pts[0][0], pts[0][1])
  for (const [x, y] of pts.slice(1)) shape.lineTo(x, y)
  shape.lineTo(pts[0][0], pts[0][1])
  const D = 0.84
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: D, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 4,
  })
  geo.translate(0, 0, -D / 2)
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.62, size: 1 }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  g.add(mesh)

  // beiral creme acompanhando o M na empena da frente
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const len = Math.hypot(x2 - x1, y2 - y1)
    const fascia = rbox(len + 0.05, 0.05, 0.03, 0.012, TRIM, { roughness: 0.6 })
    fascia.position.set((x1 + x2) / 2, (y1 + y2) / 2 + 0.012, D / 2 + 0.035)
    fascia.rotation.z = Math.atan2(y2 - y1, x2 - x1)
    g.add(fascia)
  }
  // fiadas de telha no topo das águas
  for (const [x1, y1, x2, y2] of [[-0.47, 0, -0.26, 0.26], [0.26, 0.26, 0.47, 0]] as const) {
    for (const k of [0.35, 0.7]) {
      const fiada = rbox(0.03, 0.02, D, 0.008, ROOF_DARK, { roughness: 0.65 })
      fiada.position.set(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k + 0.03, 0)
      g.add(fiada)
    }
  }
  return g
}

function house(color: string, doorLeft: boolean) {
  const g = new THREE.Group()
  const walls = rbox(0.8, WALL_H, 0.7, 0.03, color, { roughness: 0.75 })
  walls.position.y = WALL_H / 2
  g.add(walls)

  const foot = rbox(0.84, 0.07, 0.74, 0.02, STONE, { roughness: 0.85 })
  foot.position.y = 0.035
  g.add(foot)

  const FZ = 0.35
  const dx = doorLeft ? -0.18 : 0.18
  const door = rbox(0.2, 0.34, 0.04, 0.02, DOOR, { roughness: 0.7 })
  door.position.set(dx, 0.07 + 0.17, FZ + 0.01)
  g.add(door)
  const frame = rbox(0.25, 0.38, 0.025, 0.015, TRIM, { roughness: 0.6 })
  frame.position.set(dx, 0.07 + 0.18, FZ + 0.002)
  g.add(frame)
  const knob = sphere(0.018, '#d8b25a', { roughness: 0.3, metalness: 0.7 })
  knob.position.set(dx + (doorLeft ? 0.06 : -0.06), 0.24, FZ + 0.04)
  g.add(knob)

  const wx = -dx
  const sill = rbox(0.26, 0.24, 0.025, 0.02, TRIM, { roughness: 0.6 })
  sill.position.set(wx, 0.38, FZ + 0.002)
  g.add(sill)
  const glass = rbox(0.19, 0.17, 0.03, 0.01, GLASS, { roughness: 0.2 })
  glass.position.set(wx, 0.38, FZ + 0.01)
  g.add(glass)
  const mullV = rbox(0.025, 0.17, 0.035, 0.008, TRIM, { roughness: 0.6 })
  mullV.position.set(wx, 0.38, FZ + 0.015)
  const mullH = rbox(0.19, 0.025, 0.035, 0.008, TRIM, { roughness: 0.6 })
  mullH.position.set(wx, 0.38, FZ + 0.015)
  g.add(mullV, mullH)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: praia de areia ------------------------------------------------
  const base = new THREE.Group()
  const sand = cylinder(2.66, 2.74, 0.14, SAND, { roughness: 0.95 })
  sand.position.y = 0.07
  base.add(sand)

  const wet = rbox(4.5, 0.012, 0.26, 0.006, SAND_WET, { roughness: 0.9 })
  wet.position.set(0, GY + 0.002, -SEA_Z + 0.15)
  base.add(wet)

  for (const [px, pz, r, s] of [[-2.15, -0.55, 0.13, 3], [2.25, 0.25, 0.1, 7], [0.55, 2.15, 0.08, 11]] as const) {
    const pedra = rock(r, '#a39a8c', s, { roughness: 0.9 })
    pedra.position.set(px, GY + r * 0.4, pz)
    pedra.rotation.y = rand() * Math.PI
    base.add(pedra)
  }
  for (const [px, pz] of [[-0.75, 1.85], [1.05, 1.95], [-0.2, 2.25]] as const) {
    const concha = cone(0.06, 0.09, '#f2c4b4', { roughness: 0.5 }, 12)
    concha.position.set(px, GY + 0.02, pz)
    concha.rotation.set(Math.PI / 2 - 0.3, 0, rand() * Math.PI * 2)
    base.add(concha)
  }
  // capim de duna atrás da placa
  for (let i = 0; i < 6; i++) {
    const folha = cone(0.025, 0.32 + rand() * 0.12, '#a5b25a', { roughness: 0.8 }, 8)
    folha.position.set(-2.1 + rand() * 0.3, GY + 0.16, 0.5 + rand() * 0.3)
    folha.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.7)
    base.add(folha)
  }
  root.add(base)

  // ---- mar: faixa turquesa ao fundo (segmento do disco) ----------------------
  const mar = new THREE.Group()
  const R = 2.6
  const a0 = Math.asin(SEA_Z / R)
  const shape = new THREE.Shape()
  shape.moveTo(R * Math.cos(a0), R * Math.sin(a0))
  shape.absarc(0, 0, R, a0, Math.PI - a0, false)
  shape.lineTo(R * Math.cos(a0), R * Math.sin(a0))
  const seaGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 32,
  })
  seaGeo.rotateX(-Math.PI / 2)
  const seaMesh = new THREE.Mesh(seaGeo, mat(SEA, { roughness: 0.18, size: 3 }))
  seaMesh.receiveShadow = true
  seaMesh.position.y = GY - 0.02
  mar.add(seaMesh)
  // espuma na beira e cristas de onda
  for (let i = -4; i <= 4; i++) {
    const espuma = capsule(0.035, 0.38, FOAM, { roughness: 0.5 })
    espuma.rotation.z = Math.PI / 2
    espuma.position.set(i * 0.5 + (rand() - 0.5) * 0.08, GY + 0.04, -SEA_Z - 0.03)
    mar.add(espuma)
  }
  for (const [wx, wz] of [[-1.3, -1.75], [0.5, -1.95], [1.5, -1.6], [-0.4, -2.3], [1.1, -2.25]] as const) {
    const crista = capsule(0.025, 0.24, FOAM, { roughness: 0.5 })
    crista.rotation.z = Math.PI / 2
    crista.position.set(wx, GY + 0.05, wz)
    mar.add(crista)
    const fundo = capsule(0.03, 0.3, SEA_DEEP, { roughness: 0.3 })
    fundo.rotation.z = Math.PI / 2
    fundo.position.set(wx + 0.25, GY + 0.035, wz - 0.18)
    mar.add(fundo)
  }
  root.add(mar)

  // ---- barquinho encalhado --------------------------------------------------
  const barco = new THREE.Group()
  barco.position.set(1.72, GY, 1.05)
  barco.rotation.set(0, -0.55, 0.14)
  const casco = new THREE.Group()
  casco.scale.set(1.8, 1, 1)
  const hull = lathe(
    [[0, 0], [0.16, 0], [0.24, 0.05], [0.29, 0.14], [0.3, 0.21], [0.275, 0.21], [0.265, 0.14], [0.215, 0.07], [0.14, 0.045], [0, 0.045]],
    BOAT,
    { roughness: 0.45 },
  )
  casco.add(hull)
  const faixa = torus(0.293, 0.024, BOAT_STRIPE, { roughness: 0.45 })
  faixa.rotation.x = Math.PI / 2
  faixa.position.y = 0.165
  casco.add(faixa)
  barco.add(casco)
  const banco = rbox(0.12, 0.03, 0.52, 0.01, WOOD, { roughness: 0.7 })
  banco.position.y = 0.16
  barco.add(banco)
  const remo = cylinder(0.016, 0.016, 0.85, WOOD, { roughness: 0.7 })
  remo.rotation.set(0, 0, Math.PI / 2 - 0.15)
  remo.position.set(0.05, 0.25, 0.06)
  barco.add(remo)
  const pa = rbox(0.2, 0.012, 0.08, 0.006, WOOD, { roughness: 0.7 })
  pa.rotation.z = -0.15
  pa.position.set(0.52, 0.19, 0.06)
  barco.add(pa)
  root.add(barco)

  // ---- casinhas da vila -----------------------------------------------------
  const casas = new THREE.Group()
  const cores = [PINK, YELLOW, BLUE]
  HOUSE_X.forEach((hx, i) => {
    const h = house(cores[i], i !== 1)
    h.position.set(hx, GY, HZ)
    casas.add(h)
  })
  root.add(casas)

  // ---- telhados afundados (acento) — pivô na base para o "colchão" ----------
  const telhados = new THREE.Group()
  telhados.position.y = WT
  for (const hx of HOUSE_X) {
    const r = roof(ROOF)
    r.position.set(hx, 0, HZ)
    telhados.add(r)
  }
  root.add(telhados)

  // ---- placa VILA -----------------------------------------------------------
  const placa = new THREE.Group()
  placa.position.set(-1.78, GY, 1.0)
  placa.rotation.y = 0.42
  const poste = cylinder(0.035, 0.042, 0.78, WOOD_DARK, { roughness: 0.8 })
  poste.position.y = 0.39
  placa.add(poste)
  const tabua = rbox(0.66, 0.3, 0.05, 0.03, WOOD, { roughness: 0.75 })
  tabua.position.set(0, 0.66, 0.045)
  placa.add(tabua)
  const glyphs: ['V' | 'I' | 'L' | 'A', number][] = [['V', -0.2], ['I', -0.075], ['L', 0.03], ['A', 0.18]]
  for (const [gl, lx] of glyphs) {
    const l = letter(gl)
    l.position.set(lx, 0.66, 0.085)
    placa.add(l)
  }
  for (const px of [-0.27, 0.27]) {
    const prego = sphere(0.016, '#8e959b', { roughness: 0.3, metalness: 0.7 })
    prego.position.set(px, 0.76, 0.075)
    placa.add(prego)
  }
  root.add(placa)

  // ---- PEIXE-BOI: corpo roliço de barriga pra cima ---------------------------
  const peixeboi = new THREE.Group()
  peixeboi.position.set(BX, BY, BZ)
  root.add(peixeboi)

  const torso = capsule(0.48, 1.45, GRAY, { roughness: 0.7 })
  torso.rotation.z = Math.PI / 2
  torso.scale.set(0.92, 1, 1.08)
  torso.position.set(0.05, 0, 0)
  peixeboi.add(torso)

  const pancao = sphere(0.56, GRAY, { roughness: 0.7 })
  pancao.scale.set(1.45, 0.88, 1.0)
  pancao.position.set(0.0, 0.02, 0)
  peixeboi.add(pancao)

  const barriga = sphere(0.5, BELLY, { roughness: 0.72 })
  barriga.scale.set(1.8, 0.6, 0.84)
  barriga.position.set(-0.05, 0.27, 0)
  peixeboi.add(barriga)

  const peito = sphere(0.45, GRAY, { roughness: 0.7 })
  peito.position.set(-0.85, 0.02, 0)
  peixeboi.add(peito)

  const anca = sphere(0.36, GRAY, { roughness: 0.7 })
  anca.position.set(1.12, -0.03, 0)
  peixeboi.add(anca)

  const anca2 = sphere(0.26, GRAY, { roughness: 0.7 })
  anca2.position.set(1.42, -0.06, 0)
  peixeboi.add(anca2)

  // ---- cauda-remo pendendo da última casinha ---------------------------------
  const cauda = new THREE.Group()
  cauda.position.set(1.42, -0.06, 0)
  peixeboi.add(cauda)

  const haste = capsule(0.19, 0.28, GRAY, { roughness: 0.7 })
  haste.rotation.z = 0.85
  haste.position.set(0.2, -0.17, 0)
  cauda.add(haste)

  const remoCauda = sphere(0.42, GRAY_DARK, { roughness: 0.72 })
  remoCauda.scale.set(1, 1.02, 0.24)
  remoCauda.position.set(0.48, -0.6, 0)
  cauda.add(remoCauda)

  // ---- nadadeiras curtas cruzadas sobre a barriga ----------------------------
  const nadadeiras = new THREE.Group()
  nadadeiras.position.set(-0.5, 0.42, 0.24)
  nadadeiras.rotation.x = 0.5
  peixeboi.add(nadadeiras)
  for (const [side, dy] of [[1, 0], [-1, 0.05]] as const) {
    const braco = new THREE.Group()
    braco.rotation.y = side * 0.78
    braco.position.y = dy
    const nad = capsule(0.12, 0.36, GRAY_DARK, { roughness: 0.72 })
    nad.rotation.x = Math.PI / 2
    nad.scale.set(1.15, 1, 0.42)
    braco.add(nad)
    nadadeiras.add(braco)
  }

  // ---- cabeça de focinho largo ----------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(-1.42, 0.14, 0.04)
  cabeca.rotation.set(-0.35, -0.8, 0)
  cabeca.scale.setScalar(1.12)
  peixeboi.add(cabeca)

  const cranio = sphere(0.38, GRAY, { roughness: 0.7 })
  cranio.scale.set(1, 0.92, 1.05)
  cabeca.add(cranio)

  const MC = new THREE.Vector3(0, -0.08, 0.3)
  const MR = new THREE.Vector3(0.36, 0.25, 0.27)
  const focinho = sphere(1, MUZZLE, { roughness: 0.72 })
  focinho.scale.copy(MR)
  focinho.position.copy(MC)
  cabeca.add(focinho)

  const queixo = sphere(0.18, MUZZLE, { roughness: 0.72 })
  queixo.scale.set(1.3, 0.8, 1)
  queixo.position.set(0, -0.25, 0.25)
  cabeca.add(queixo)

  // ---- rosto: olhos fechados, narinas e bigode (filho da cabeça) -------------
  const rosto = new THREE.Group()
  cabeca.add(rosto)
  const surf = (u: number, v: number, w: number) => {
    const d = new THREE.Vector3(u, v, w).normalize()
    return new THREE.Vector3(MC.x + d.x * MR.x, MC.y + d.y * MR.y, MC.z + d.z * MR.z)
  }

  for (const side of [-1, 1]) {
    const palpebra = sphere(0.075, GRAY_DARK, { roughness: 0.7 })
    palpebra.scale.set(1.1, 0.55, 0.5)
    palpebra.position.set(side * 0.17, 0.15, 0.31)
    palpebra.rotation.y = side * 0.45
    rosto.add(palpebra)

    const olho = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.015, 8, 20, Math.PI), mat(INK, { roughness: 0.4 }))
    olho.position.set(side * 0.17, 0.155, 0.345)
    olho.rotation.set(-0.2, side * 0.45, Math.PI)
    rosto.add(olho)

    const narina = sphere(0.045, INK, { roughness: 0.4 })
    narina.scale.set(1, 0.55, 0.5)
    narina.position.copy(surf(side * 0.35, 0.62, 0.7))
    narina.rotation.x = -0.6
    rosto.add(narina)

    for (let k = 0; k < 3; k++) {
      const fio = cylinder(0.008, 0.005, 0.22, '#d9dcd8', { roughness: 0.5 }, 6)
      const p = surf(side * 0.85, -0.15 + k * 0.15, 0.5)
      fio.position.copy(p).add(new THREE.Vector3(side * 0.08, 0, 0.02))
      fio.rotation.z = side * (Math.PI / 2 + (k - 1) * 0.28)
      fio.rotation.y = side * -0.3
      rosto.add(fio)
    }
  }

  // pontinhos de bigode cerrado no focinho
  const rb = rng(77)
  for (let i = 0; i < 26; i++) {
    const u = (rb() - 0.5) * 1.5
    const v = -0.45 + rb() * 0.75
    const p = surf(u, v, 0.75)
    const ponto = sphere(0.013, '#4c555b', { roughness: 0.6 }, 8)
    ponto.position.copy(p)
    rosto.add(ponto)
  }

  const boca = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.013, 8, 20, Math.PI), mat(INK, { roughness: 0.4 }))
  boca.position.copy(surf(0, -0.55, 0.85))
  boca.rotation.set(-0.5, 0, Math.PI)
  rosto.add(boca)

  // ---- travesseiro listrado debaixo da cabeça -------------------------------
  const travesseiro = new THREE.Group()
  travesseiro.position.set(BX - 1.5, 1.13, BZ + 0.06)
  travesseiro.rotation.set(0, 0.15, 0.14)
  // almofada roliça: cápsula achatada com listras-anel que abraçam o tecido
  const fofo = new THREE.Group()
  fofo.scale.set(1, 0.48, 1.25)
  travesseiro.add(fofo)
  const fronha = capsule(0.23, 0.36, PILLOW, { roughness: 0.9 })
  fronha.rotation.z = Math.PI / 2
  fofo.add(fronha)
  for (const sx of [-0.16, 0, 0.16]) {
    const listra = torus(0.228, 0.022, PILLOW_STRIPE, { roughness: 0.9 })
    listra.rotation.y = Math.PI / 2
    listra.position.x = sx
    fofo.add(listra)
  }
  root.add(travesseiro)

  // ---- Z Z Z de ronco --------------------------------------------------------
  const zzz = new THREE.Group()
  for (const [zx, zy, zs, rz] of [[-0.98, 2.0, 0.16, 0.15], [-0.64, 2.22, 0.21, -0.1], [-0.24, 2.48, 0.27, 0.12]] as const) {
    const z = zee(zs)
    z.position.set(zx, zy, 0.2)
    z.rotation.z = rz
    zzz.add(z)
  }
  root.add(zzz)

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'praia', object: base },
    { name: 'mar', group: 'praia', object: mar },
    { name: 'barco', group: 'praia', object: barco },
    { name: 'casas', group: 'vila', object: casas },
    { name: 'telhados', group: 'vila', object: telhados },
    { name: 'placa', group: 'vila', object: placa },
    { name: 'peixeboi', group: 'peixeboi', object: peixeboi },
    { name: 'cabeca', group: 'peixeboi', object: cabeca },
    { name: 'rosto', group: 'peixeboi', object: rosto },
    { name: 'cauda', group: 'peixeboi', object: cauda },
    { name: 'nadadeiras', group: 'descanso', object: nadadeiras },
    { name: 'travesseiro', group: 'descanso', object: travesseiro },
    { name: 'zzz', group: 'ronco', object: zzz },
  ]

  // ---- montagem ----------------------------------------------------------------
  const LAND = 7.6
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma praia sobe do chão: areia, mar turquesa e um barquinho encalhado.',
    }),
    seq('mar-rise', 'mar', 0.3, 0.8, [riseFrom(0, 0.5)], { ease: 'easeOut' }),
    seq('barco-encalha', 'barco', 0.8, 1.0, [ch('position.z', -1.9, 1.05), ch('rotation.z', 0, 0.14)], { ease: 'easeOut' }),

    seq('casas-rise', 'casas', 1.9, 0.9, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'Brotam três casinhas coloridas lado a lado: é a VILA de pescadores.',
    }),
    seq('telhados-caem', 'telhados', 2.3, 0.6, [ch('position.y', WT + 0.9, WT)], { ease: 'easeIn' }),
    seq('placa-rise', 'placa', 2.7, 0.7, [riseFrom(GY, 1.0), ch('rotation.z', 0.25, 0)], { ease: 'easeOut' }),

    seq('peixeboi-emerge', 'peixeboi', 3.9, 1.1, [ch('position.y', -0.4, SWIM_Y)], {
      ease: 'easeOut',
      caption: 'Do mar se arrasta um peixe-boi, mole de cansaço depois de empurrar barcos o dia inteiro: IÁ!',
    }),
    seq('cabeca-surge', 'cabeca', 3.9, 0.8, [ch('rotation.z', 0.5, 0)], { ease: 'easeOut' }),
    seq('rosto-surge', 'rosto', 3.9, 0.4, [ch('scale.x', 0.8, 1), ch('scale.y', 0.8, 1), ch('scale.z', 0.8, 1)]),
    seq('cauda-surge', 'cauda', 3.9, 1.0, [ch('rotation.z', -0.7, 0)], { ease: 'easeOut' }),
    seq(
      'nadadeiras-surgem',
      'nadadeiras',
      4.0,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('cabeca-berra', 'cabeca', 5.5, 0.4, [ch('rotation.z', 0, -0.45)], {
      ease: 'easeOut',
      caption: 'Sem fôlego, ele BERRÔ: "VER…" — e só arregala o olho pra VILA na frente dele.',
    }),
    seq('cabeca-murcha', 'cabeca', 6.4, 0.6, [ch('rotation.z', -0.45, 0)]),

    seq('peixeboi-pula', 'peixeboi', LAND - 0.8, 0.5, [
      ch('position.y', SWIM_Y, 2.4), ch('position.z', SWIM_Z, (SWIM_Z + BZ) / 2), ch('rotation.x', Math.PI, Math.PI / 2),
    ], {
      ease: 'easeOut',
      caption: 'E DESABA de barriga pra cima nos telhados da VILA, que afundam feito colchão de molas!',
    }),
    seq('peixeboi-desaba', 'peixeboi', LAND - 0.3, 0.3, [
      ch('position.y', 2.4, BY - 0.12), ch('position.z', (SWIM_Z + BZ) / 2, BZ), ch('rotation.x', Math.PI / 2, 0),
    ], { ease: 'easeIn' }),
    seq('peixeboi-quica', 'peixeboi', LAND, 0.4, [ch('position.y', BY - 0.12, BY)], { ease: 'easeOut' }),
    seq('telhados-afundam', 'telhados', LAND - 0.05, 0.15, [ch('scale.y', 1, 0.6)], { ease: 'easeOut' }),
    seq('telhados-voltam', 'telhados', LAND + 0.1, 0.5, [ch('scale.y', 0.6, 1)], { ease: 'easeOut' }),
    seq('cauda-balanca', 'cauda', LAND, 0.25, [ch('rotation.z', 0, -0.3)], { ease: 'easeOut' }),
    seq('cauda-pende', 'cauda', LAND + 0.25, 0.6, [ch('rotation.z', -0.3, 0)]),

    seq('cabeca-ergue', 'cabeca', 8.7, 0.4, [ch('rotation.z', 0, -0.3)], {
      ease: 'easeOut',
      caption: 'Ajeita um travesseiro listrado debaixo da cabeça e cruza as nadadeiras na barriga…',
    }),
    seq(
      'travesseiro-entra',
      'travesseiro',
      8.8,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1), ch('position.y', 1.6, 1.13)],
      { ease: 'easeOut' },
    ),
    seq('cabeca-deita', 'cabeca', 9.3, 0.5, [ch('rotation.z', -0.3, 0)], { ease: 'easeInOut' }),
    seq('nadadeiras-cruzam', 'nadadeiras', 9.2, 0.6, [ch('rotation.y', 1.3, 0)], { ease: 'easeOut' }),

    seq(
      'zzz-sobe',
      'zzz',
      10.3,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1), ch('position.y', -0.5, 0.08)],
      { ease: 'easeOut', caption: 'Jag behöver vila. — Preciso descansar.' },
    ),
    seq('zzz-flutua', 'zzz', 11.1, 1.0, [ch('position.y', 0.08, 0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 2.75, 5.05], target: [0.12, 1.25, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-behover-vila',
    contexto:
      "Saúde: em casa com o parceiro, no trabalho (pedindo uma pausa ou explicando um dia de folga) ou no médico — 'Du behöver vila' é provavelmente o que o médico sueco mais receita.",
    fraseAlvo: 'Jag behöver vila.',
    fraseFonte: 'Preciso descansar.',
    pronuncia:
      "iá be-RRÖÖ-ver VÍÍ-la ('jag' = iá; 'behöver' com o be- fraquinho, o h soprado e a força no HÖ — Ö LONGO, lábios de Ô com língua de Ê —, e o -ver fraco mas com R brando, que encosta no V seguinte; 'vila' com a força no VI, I LONGO, L de verdade e o -la fraquinho: o 'vila' do português já soa quase igual)",
    ponteSonora:
      "IÁ! BERRÔ: VER... VILA! (6 sílabas: iá-be-RRÖÖ-ver-VÍÍ-la; força no RRÖ e, maior, no VÍ; IÁ = o 'jag' de sempre, I de IOGA, nunca o J chiado de 'já'; BERRÔ: VER = BERROU 'VER...' num fôlego só, o MESMO be-RRÖ-ver de 'Jag behöver träffa en läkare', 'Jag behöver ett BankID' e 'Det är akut, jag behöver komma in idag': o BE fraquinho, o RR soprado LEVE (é o h) e a força no RRÔ — sem o U do 'ou' e de BICO: lábios de Ô com língua de Ê, longo, o truque do TRÖTT e do MÖÖ-te; o VER vem grudado e sem força, mas com o R BRANDO no fim, que encosta no V da VILA: ve-r-VÍ — sem esse R sobra 'behöva', o infinitivo; VILA = a VILA de pescadores, do jeito que o português já fala: força no VÍ, I LONGO e esticado, L DE VERDADE (língua no céu da boca) e o -la fraquinho; é o infinitivo 'vila', descansar, que vem depois de 'behöver' — e nunca o VIL curto, de L no fim, de 'Vill du...?' (quer): aqui o I é comprido e a palavra termina em A)",
    historia:
      "O dia inteiro o peixe-boi empurrou com o focinho os barcos encalhados da vila de pescadores, e agora se arrasta pra areia, mole como um saco de feijão. Solta um IÁ! de exausto e BERROU: 'VER...' — sem fôlego pra terminar a frase, só arregala o olho pra VILA na frente dele. Ali mesmo ele desaba de barriga pra cima em cima dos telhados das três casinhas da VILA, que estalam e afundam feito colchão de molas. Ajeita um travesseiro listrado debaixo da cabeça e ronca: preciso descansar.",
  },
  createScene,
  refine: { organic: ['peixeboi', 'cabeca', 'cauda', 'nadadeiras'] },
}

export default card
