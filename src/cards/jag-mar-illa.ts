import * as THREE from 'three'
import { TessellateModifier } from 'three-stdlib'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Jag mår illa." — IÁ, MÔR... ÍL-LA!
 *
 * A borboleta se apaixonou pela luz do farol da ILHA (o AMOR da vida dela) e
 * passou a noite dando voltas na lâmpada. De manhã despenca na grade da
 * varanda, verde, com espirais no lugar dos olhos, bochechas estufadas — e
 * geme IÁ, MÔR... ÍL-LA: estou enjoada.
 *
 * Diorama: disco de mar azul-escuro com ondinhas; ilhota de pedras cinza no
 * meio; farol atarracado listrado de vermelho e branco, varanda de grade
 * preta, lanterna de vidro com a lâmpada amarela e dois fachos de luz;
 * purpurina dourada em órbitas em volta da lâmpada (as voltas da noite). A
 * borboleta turquesa, enorme, pendurada na frente da grade, asas caídas.
 * Acento saturado RESERVADO ao rosto verde-enjoado.
 */

const MAR = '#1d4466'
const MAR_FUNDO = '#142f49'
const ONDA = '#4a84ad'
const ESPUMA = '#eef3f5'
const PEDRA = '#535960'
const PEDRA_ESC = '#43484f'
const PEDRA_CLARA = '#6a7178'
const MUSGO = '#6b7b53'
const VERMELHO = '#c4453a'
const BRANCO = '#f1ebdf'
const FERRO = '#262b33'
const PORTA = '#2f4a63'
const VIDRO = '#fff3c8'
const LUZ = '#ffd75e'
const OURO = '#ffc83a'
const ASA = '#27b0cc'
const ASA_CLARA = '#86dfe9'
const ASA_VEIO = '#1a6f88'
const ASA_BORDA = '#17191e'
const PINTA = '#f8f6ee'
const CORPO = '#22355a'
const CORPO_CLARO = '#3f6196'
const ENJOO = '#9fcb3a' // acento: o rosto verde-enjoado
const ENJOO_CLARO = '#bfe064'
const BOCA = '#3a5216'
const SUOR = '#c4e8ff'

const WY = 0.22 // superfície do mar
const IY = 0.52 // topo da ilhota
const TY = 1.4 // topo da torre (piso da varanda)
const RR = 0.62 // raio da grade
const RAIL = TY + 0.32 // corrimão de cima
const LR = 0.24 // raio do vidro da lanterna
const G0 = TY + 0.2 // base do vidro da lanterna
const G1 = TY + 0.8 // topo do vidro
const LAMP_Y = TY + 0.52

// borboleta: escala e posição do tórax (pose final, debruçada na grade)
const B = 1.2
const THY = RAIL - 0.02
const THZ = RR - 0.04
const LIFT = 0.42 // altura extra enquanto voa em volta da lâmpada

// asas (lado direito; o esquerdo espelha)
const SWEEP = -0.3 // negativo: as asas vêm para a frente, por fora da grade
const OPEN = 0.3
const LOW = -0.2
const DROOP = -1.0
const DROOP_E = -0.28 // a esquerda cai menos

// cabeça: olhando a lâmpada (voo) → tombada (pose final)
const HEAD_UP = -0.3
const HEAD_TILT = 0.12
const HEAD_ROLL = 0.18
const ANT_BACK = -0.45
const ANT_DROOP = 0.35

/** Raio da torre na altura y (afunila de baixo para cima). */
function towerR(y: number) {
  return 0.44 - ((y - IY) / (TY - IY)) * 0.12
}

/** Cápsula de a até b (pernas, abdômen). */
function limb(a: [number, number, number], b: [number, number, number], r: number, color: string, opts = {}) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const m = capsule(r, Math.max(0.001, va.distanceTo(vb)), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize())
  return m
}

function tube(points: THREE.Vector3[], r: number, color: string, segs = 120) {
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segs, r, 8, false)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.4, size: 0.3 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function translucido<T extends THREE.Mesh>(mesh: T, opacity: number): T {
  const m = mesh.material as THREE.MeshStandardMaterial
  m.transparent = true
  m.opacity = opacity
  m.depthWrite = false
  mesh.castShadow = false
  return mesh
}

// ---- asas: contornos em curvas de Bézier, extrudados --------------------------
type P2 = [number, number]
type Outline = { start: P2; segs: [P2, P2, P2][]; center: P2 }

const ANTERIOR: Outline = {
  start: [0.0, 0.03],
  segs: [
    [[0.12, 0.22], [0.38, 0.46], [0.62, 0.5]],
    [[0.77, 0.53], [0.85, 0.42], [0.79, 0.3]],
    [[0.7, 0.14], [0.45, 0.0], [0.2, -0.05]],
    [[0.1, -0.07], [0.02, -0.03], [0.0, 0.03]],
  ],
  center: [0.2, 0.12],
}

const POSTERIOR: Outline = {
  start: [0.0, -0.02],
  segs: [
    [[0.18, -0.02], [0.44, -0.08], [0.5, -0.22]],
    [[0.56, -0.36], [0.48, -0.52], [0.34, -0.55]],
    [[0.2, -0.57], [0.1, -0.44], [0.05, -0.28]],
    [[0.02, -0.16], [0.0, -0.08], [0.0, -0.02]],
  ],
  center: [0.15, -0.15],
}

function shapeOf(o: Outline, s: number) {
  const [cx, cy] = o.center
  const t = ([x, y]: P2): P2 => [cx + (x - cx) * s, cy + (y - cy) * s]
  const shape = new THREE.Shape()
  shape.moveTo(...t(o.start))
  for (const [c1, c2, p] of o.segs) shape.bezierCurveTo(...t(c1), ...t(c2), ...t(p))
  return shape
}

function slab(shape: THREE.Shape, depth: number, color: string, opts = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 28,
  })
  geo.translate(0, 0, -depth / 2)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.5, size: 0.8, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Uma asa: borda preta, turquesa, miolo claro, veios e pintas brancas na borda. */
function wing(o: Outline, spots: number[]) {
  const g = new THREE.Group()
  g.add(slab(shapeOf(o, 1), 0.014, ASA_BORDA, { roughness: 0.6 }))
  g.add(slab(shapeOf(o, 0.82), 0.022, ASA, { roughness: 0.4 }))
  g.add(slab(shapeOf(o, 0.42), 0.028, ASA_CLARA, { roughness: 0.4 }))

  const [cx, cy] = o.center
  const outline = shapeOf(o, 1).getSpacedPoints(48)
  for (const i of spots) {
    const p = outline[i]
    const pinta = sphere(0.024, PINTA, { roughness: 0.4 })
    pinta.position.set(p.x + (cx - p.x) * 0.085, p.y + (cy - p.y) * 0.085, 0)
    pinta.scale.z = 0.85
    g.add(pinta)
  }

  // veios: do centro para a borda, finos e escuros
  for (const i of [6, 14, 22]) {
    const p = outline[i]
    const tx = cx + (p.x - cx) * 0.8
    const ty = cy + (p.y - cy) * 0.8
    const len = Math.hypot(tx - cx, ty - cy)
    const veio = rbox(len, 0.008, 0.032, 0.003, ASA_VEIO, { roughness: 0.5 })
    veio.position.set((cx + tx) / 2, (cy + ty) / 2, 0)
    veio.rotation.z = Math.atan2(ty - cy, tx - cx)
    g.add(veio)
  }
  return g
}

/**
 * Dobra a asa ao longo de uma linha do próprio plano (por p0, direção d): tudo
 * do lado da ponta gira `phi` em torno dela, com transição suave de largura w.
 * As peças da asa são assadas no espaço da asa antes, para dobrarem juntas.
 */
function fold(wingGroup: THREE.Group, p0: THREE.Vector3, d: THREE.Vector3, phi: number, w = 0.08) {
  const axis = d.clone().normalize()
  const n = new THREE.Vector3(axis.y, -axis.x, 0) // perpendicular no plano, para a ponta
  const v = new THREE.Vector3()
  const nv = new THREE.Vector3()
  const q = new THREE.Quaternion()
  for (const child of wingGroup.children) {
    const mesh = child as THREE.Mesh
    mesh.updateMatrix()
    // as tampas extrudadas não têm vértices internos: subdivide para dobrar
    const geo = new TessellateModifier(0.02, 8).modify(mesh.geometry.clone())
    geo.applyMatrix4(mesh.matrix)
    mesh.position.set(0, 0, 0)
    mesh.rotation.set(0, 0, 0)
    mesh.scale.set(1, 1, 1)
    const pos = geo.attributes.position
    const nor = geo.attributes.normal
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const s = v.clone().sub(p0).dot(n)
      if (s <= 0) continue
      const k = Math.min(1, s / w)
      q.setFromAxisAngle(axis, phi * k * k * (3 - 2 * k))
      v.sub(p0).applyQuaternion(q).add(p0)
      pos.setXYZ(i, v.x, v.y, v.z)
      if (nor) {
        nv.fromBufferAttribute(nor, i).applyQuaternion(q)
        nor.setXYZ(i, nv.x, nv.y, nv.z)
      }
    }
    pos.needsUpdate = true
    mesh.geometry = geo
  }
}

/** Par de asas do lado direito (+x); `dobra` vinca a ponta da anterior (asa torta). */
function wingPair(dobra: number, posteriorZ: number) {
  const g = new THREE.Group()
  const anterior = wing(ANTERIOR, [10, 13, 16, 19, 22, 25])
  if (dobra) fold(anterior, new THREE.Vector3(0.44, 0.27, 0), new THREE.Vector3(-0.55, 0.84, 0), dobra)
  g.add(anterior)
  const posterior = wing(POSTERIOR, [12, 16, 20, 24])
  posterior.position.z = -0.012
  posterior.rotation.z = posteriorZ
  posterior.scale.setScalar(0.9)
  g.add(posterior)
  return g
}

/** Olho em espiral: disco branco abaulado com uma espiral preta por cima. */
function spiralEye(r: number, dir: 1 | -1) {
  const g = new THREE.Group()
  const disco = sphere(r, '#fbfaf3', { roughness: 0.3 })
  disco.scale.z = 0.4
  g.add(disco)
  const pts: THREE.Vector3[] = []
  const N = 90
  const turns = 2.2
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const a = dir * t * turns * Math.PI * 2
    const rho = r * (0.05 + 0.75 * t)
    const z = 0.4 * Math.sqrt(Math.max(r * r - rho * rho, 0)) + r * 0.04
    pts.push(new THREE.Vector3(Math.cos(a) * rho, Math.sin(a) * rho, z))
  }
  g.add(tube(pts, r * 0.085, '#1d1b24', 180))
  return g
}

/** Antena-mola: hélice preta com bolinha na ponta, ao longo de +y. */
function mola(len: number, rad: number, turns: number) {
  const g = new THREE.Group()
  const pts: THREE.Vector3[] = []
  const N = 80
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const a = t * turns * Math.PI * 2
    const rr = rad * Math.min(1, t * 6)
    pts.push(new THREE.Vector3(Math.cos(a) * rr, t * len, Math.sin(a) * rr))
  }
  g.add(tube(pts, 0.009, ASA_BORDA, 160))
  const ponta = sphere(0.03, ASA_BORDA, { roughness: 0.35 })
  ponta.position.y = len + 0.015
  g.add(ponta)
  return g
}

/** Facho de luz: cone aberto com a ponta na origem, apontando para `dir`. */
function facho(dir: THREE.Vector3, len: number, r: number, opacity: number) {
  const geo = new THREE.ConeGeometry(r, len, 40, 8, true)
  geo.translate(0, -len / 2, 0)
  // some na ponta: com mistura aditiva, preto = transparente
  const pos = geo.attributes.position
  const cores = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const k = Math.pow(1 - Math.min(1, -pos.getY(i) / len), 1.6)
    cores.set([k, k, k], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3))
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      color: LUZ,
      vertexColors: true,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize())
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- mar -------------------------------------------------------------------
  const base = new THREE.Group()

  const fundo = cylinder(2.62, 2.7, WY - 0.04, MAR_FUNDO, { roughness: 0.4 })
  fundo.position.y = (WY - 0.04) / 2
  base.add(fundo)

  const mar = cylinder(2.6, 2.62, 0.04, MAR, { roughness: 0.14 })
  mar.position.y = WY - 0.02
  base.add(mar)

  // ondinhas: arcos claros espalhados (fora da ilhota)
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.25 + rand() * 1.15
    const r = 0.12 + rand() * 0.12
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.013, 6, 20, Math.PI * (0.45 + rand() * 0.3)),
      mat(ONDA, { roughness: 0.2, size: 0.3 }),
    )
    arco.rotation.x = -Math.PI / 2
    arco.rotation.z = rand() * Math.PI * 2
    arco.position.set(Math.cos(a) * d, WY + 0.004, Math.sin(a) * d)
    base.add(arco)
    if (i % 3 === 0) {
      const crista = puff(0.035, ESPUMA, 3, 70 + i, { roughness: 0.8 })
      crista.scale.y = 0.5
      crista.position.set(Math.cos(a) * d, WY + 0.01, Math.sin(a) * d)
      base.add(crista)
    }
  }

  // pedrinhas soltas no mar
  for (const [px, pz, pr, s] of [[-1.95, 0.9, 0.16, 3], [2.05, 0.55, 0.13, 4], [1.55, -1.5, 0.19, 5], [-1.6, -1.35, 0.14, 6]] as const) {
    const p = rock(pr, PEDRA_ESC, s, { roughness: 0.9 })
    p.position.set(px, WY + pr * 0.15, pz)
    p.scale.y = 0.7
    base.add(p)
    const anel = torus(pr * 1.05, 0.018, ESPUMA, { roughness: 0.7 })
    anel.rotation.x = Math.PI / 2
    anel.position.set(px, WY + 0.005, pz)
    base.add(anel)
  }
  root.add(base)

  // ---- ilhota de pedras ------------------------------------------------------
  const ilhota = new THREE.Group()

  const plato = lathe(
    [[0, 0.06], [0.9, 0.06], [0.88, 0.24], [0.8, 0.38], [0.7, IY - 0.03], [0.6, IY], [0, IY]],
    PEDRA,
    { roughness: 0.9, flat: true },
    11,
  )
  ilhota.add(plato)

  const relva = cylinder(0.6, 0.64, 0.03, MUSGO, { roughness: 0.95, flat: true }, 11)
  relva.position.y = IY + 0.005
  ilhota.add(relva)

  const tons = [PEDRA, PEDRA_ESC, PEDRA_CLARA]
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2 + rand() * 0.3
    const d = 0.76 + rand() * 0.12
    const r = 0.17 + rand() * 0.12
    const p = rock(r, tons[k % 3], 10 + k, { roughness: 0.9 })
    const frente = Math.sin(a) > 0.55 // pedras da frente mais baixas: a porta aparece
    p.position.set(Math.cos(a) * d, WY + (frente ? 0.02 : 0.1), Math.sin(a) * d)
    p.scale.set(1, frente ? 0.55 : 0.85, 1)
    p.rotation.y = rand() * Math.PI
    ilhota.add(p)
  }

  // tufos de musgo no pé do farol
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.4
    const tufo = puff(0.06, MUSGO, 4, 90 + k, { roughness: 0.95 })
    tufo.position.set(Math.cos(a) * 0.56, IY + 0.03, Math.sin(a) * 0.56)
    tufo.scale.y = 0.6
    ilhota.add(tufo)
  }

  // espuma batendo na ilhota
  const espuma = torus(0.93, 0.045, ESPUMA, { roughness: 0.8 })
  espuma.rotation.x = Math.PI / 2
  espuma.scale.z = 0.5
  espuma.position.y = WY + 0.01
  ilhota.add(espuma)
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + rand() * 0.4
    const f = puff(0.06, ESPUMA, 4, 120 + k, { roughness: 0.8 })
    f.scale.y = 0.45
    f.position.set(Math.cos(a) * 0.97, WY + 0.015, Math.sin(a) * 0.97)
    ilhota.add(f)
  }
  root.add(ilhota)

  // ---- torre listrada + varanda com grade ----------------------------------------
  const torre = new THREE.Group()

  const plinto = cylinder(0.5, 0.53, 0.1, PEDRA_CLARA, { roughness: 0.85 })
  plinto.position.y = IY + 0.05
  torre.add(plinto)

  const BANDS = 5
  const y0 = IY + 0.1
  const bh = (TY - y0) / BANDS
  for (let i = 0; i < BANDS; i++) {
    const ya = y0 + i * bh
    const yb = ya + bh
    const faixa = lathe(
      [[0, 0], [towerR(ya), 0], [towerR(yb), bh], [0, bh]],
      i % 2 === 0 ? VERMELHO : BRANCO,
      { roughness: 0.55 },
      48,
    )
    faixa.position.y = ya
    torre.add(faixa)
  }

  // porta em arco, de frente para a câmera
  const portaG = new THREE.Group()
  portaG.position.set(0, IY + 0.1, towerR(IY + 0.25) - 0.015)
  const batente = rbox(0.22, 0.28, 0.04, 0.015, BRANCO, { roughness: 0.6 })
  batente.position.y = 0.14
  portaG.add(batente)
  const arcoB = cylinder(0.11, 0.11, 0.04, BRANCO, { roughness: 0.6 })
  arcoB.rotation.x = Math.PI / 2
  arcoB.position.y = 0.28
  portaG.add(arcoB)
  const folha = rbox(0.16, 0.26, 0.05, 0.012, PORTA, { roughness: 0.7 })
  folha.position.set(0, 0.13, 0.01)
  portaG.add(folha)
  const arcoP = cylinder(0.08, 0.08, 0.05, PORTA, { roughness: 0.7 })
  arcoP.rotation.x = Math.PI / 2
  arcoP.position.set(0, 0.26, 0.01)
  portaG.add(arcoP)
  const macaneta = sphere(0.016, '#d9b25a', { roughness: 0.3, metalness: 0.7 })
  macaneta.position.set(0.05, 0.13, 0.04)
  portaG.add(macaneta)
  torre.add(portaG)

  const degrau = rbox(0.3, 0.05, 0.14, 0.015, PEDRA_CLARA, { roughness: 0.85 })
  degrau.position.set(0, IY + 0.025, towerR(IY) + 0.1)
  torre.add(degrau)

  // janelinhas nas laterais
  for (const [ang, jy] of [[0.75, IY + 0.42], [-0.85, IY + 0.62]] as const) {
    const r = towerR(jy)
    const jan = new THREE.Group()
    jan.position.set(Math.sin(ang) * r, jy, Math.cos(ang) * r)
    jan.rotation.y = ang
    const moldura = rbox(0.1, 0.14, 0.03, 0.012, BRANCO, { roughness: 0.6 })
    jan.add(moldura)
    const vidro = rbox(0.07, 0.11, 0.035, 0.01, '#2b3a4d', { roughness: 0.2 })
    jan.add(vidro)
    torre.add(jan)
  }

  // mísula da varanda, piso e grade
  const misula = lathe(
    [[towerR(TY) - 0.01, TY - 0.2], [0.44, TY - 0.12], [0.6, TY - 0.04], [0.7, TY], [0, TY]],
    FERRO,
    { roughness: 0.5 },
    48,
  )
  torre.add(misula)

  const piso = cylinder(0.7, 0.7, 0.06, FERRO, { roughness: 0.5 })
  piso.position.y = TY + 0.03
  torre.add(piso)

  const POSTS = 20
  const postH = RAIL - (TY + 0.06)
  for (let i = 0; i < POSTS; i++) {
    const a = (i / POSTS) * Math.PI * 2
    const poste = cylinder(0.012, 0.012, postH, FERRO, { roughness: 0.45, metalness: 0.5 }, 8)
    poste.position.set(Math.cos(a) * RR, TY + 0.06 + postH / 2, Math.sin(a) * RR)
    torre.add(poste)
  }
  const corrimao = torus(RR, 0.02, FERRO, { roughness: 0.45, metalness: 0.5 })
  corrimao.rotation.x = Math.PI / 2
  corrimao.position.y = RAIL
  torre.add(corrimao)
  const meio = torus(RR, 0.011, FERRO, { roughness: 0.45, metalness: 0.5 })
  meio.rotation.x = Math.PI / 2
  meio.position.y = TY + 0.06 + postH * 0.5
  torre.add(meio)

  root.add(torre)

  // ---- lanterna de vidro + telhadinho cônico ----------------------------------------
  const lanterna = new THREE.Group()

  const mureta = cylinder(LR + 0.02, LR + 0.03, G0 - (TY + 0.06), VERMELHO, { roughness: 0.55 })
  mureta.position.y = (TY + 0.06 + G0) / 2
  lanterna.add(mureta)

  for (const gy of [G0, G1]) {
    const anel = torus(LR + 0.015, 0.02, FERRO, { roughness: 0.45, metalness: 0.5 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = gy
    lanterna.add(anel)
  }

  const vidro = translucido(
    cylinder(LR, LR, G1 - G0, VIDRO, { roughness: 0.08, emissive: '#ffe7a0', emissiveIntensity: 0.35 }),
    0.26,
  )
  vidro.position.y = (G0 + G1) / 2
  lanterna.add(vidro)

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    const montante = rbox(0.022, G1 - G0, 0.022, 0.008, FERRO, { roughness: 0.45, metalness: 0.5 })
    montante.position.set(Math.cos(a) * (LR + 0.005), (G0 + G1) / 2, Math.sin(a) * (LR + 0.005))
    lanterna.add(montante)
  }

  const beiral = torus(LR + 0.09, 0.022, FERRO, { roughness: 0.45, metalness: 0.5 })
  beiral.rotation.x = Math.PI / 2
  beiral.position.y = G1 + 0.02
  lanterna.add(beiral)

  const telhado = cone(LR + 0.1, 0.34, VERMELHO, { roughness: 0.5 })
  telhado.position.y = G1 + 0.19
  lanterna.add(telhado)

  const respiro = sphere(0.065, FERRO, { roughness: 0.4, metalness: 0.5 })
  respiro.position.y = G1 + 0.37
  lanterna.add(respiro)
  const para = cylinder(0.01, 0.01, 0.18, FERRO, { roughness: 0.4, metalness: 0.6 }, 8)
  para.position.y = G1 + 0.48
  lanterna.add(para)
  const bolinha = sphere(0.022, FERRO, { roughness: 0.4, metalness: 0.6 })
  bolinha.position.y = G1 + 0.58
  lanterna.add(bolinha)

  root.add(lanterna)

  // ---- a luz: lâmpada, lente, halo e dois fachos ------------------------------------
  const luz = new THREE.Group()
  luz.position.y = LAMP_Y

  const lampada = sphere(0.11, '#fff7da', { emissive: LUZ, emissiveIntensity: 2.2 })
  luz.add(lampada)
  for (const [ly, lr] of [[-0.07, 0.11], [0, 0.135], [0.07, 0.11]] as const) {
    const prisma = torus(lr, 0.014, '#fff0b8', { emissive: '#ffe08a', emissiveIntensity: 1.2 })
    prisma.rotation.x = Math.PI / 2
    prisma.position.y = ly
    luz.add(prisma)
  }
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 24, 24),
    new THREE.MeshBasicMaterial({
      color: LUZ, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  )
  luz.add(halo)

  for (const dir of [new THREE.Vector3(-1, 0.14, -0.62), new THREE.Vector3(1, 0.14, -0.5)]) {
    luz.add(facho(dir, 2.1, 0.42, 0.13))
    luz.add(facho(dir, 2.0, 0.2, 0.16))
  }

  const brilho = new THREE.PointLight('#ffd27a', 1.6, 3.2, 1.8)
  luz.add(brilho)
  root.add(luz)

  // ---- purpurina dourada: as voltas da noite ---------------------------------------
  const purpurina = new THREE.Group()
  purpurina.position.y = LAMP_Y
  const orbitas: [number, number, number, number][] = [
    [0.62, -0.36, 0.14, 46],
    [0.74, -0.26, -0.2, 54],
  ]
  for (const [r, rx, rz, n] of orbitas) {
    const orbita = new THREE.Group()
    orbita.rotation.set(rx, 0, rz)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.08
      const s = 0.013 + rand() * 0.006
      const grao = i % 6 === 0
        ? new THREE.Mesh(new THREE.OctahedronGeometry(s * 1.8), mat(OURO, { emissive: OURO, emissiveIntensity: 1.1 }))
        : sphere(s, OURO, { emissive: OURO, emissiveIntensity: 0.9 }, 10)
      if (i % 6 === 0) grao.scale.set(0.55, 1.3, 0.55)
      grao.position.set(Math.cos(a) * r, (rand() - 0.5) * 0.03, Math.sin(a) * r)
      orbita.add(grao)
    }
    purpurina.add(orbita)
  }
  root.add(purpurina)

  // ---- BORBOLETA: pivô no eixo do farol (as voltas), corpo na frente da grade -------
  const borboleta = new THREE.Group()
  root.add(borboleta)

  const corpo = new THREE.Group()
  corpo.position.set(0, THY, THZ)
  corpo.scale.setScalar(B)
  borboleta.add(corpo)

  const torax = sphere(0.12, CORPO, { roughness: 0.85 })
  torax.scale.set(1, 1.0, 0.95)
  corpo.add(torax)

  const gola = sphere(0.1, CORPO_CLARO, { roughness: 0.9 })
  gola.scale.set(1.2, 0.6, 1)
  gola.position.set(0, 0.03, 0.07)
  corpo.add(gola)

  // abdômen: para trás, deitado no piso da varanda (atrás da grade)
  const AB0: [number, number, number] = [0, -0.06, -0.05]
  const AB1: [number, number, number] = [0, -0.13, -0.17]
  corpo.add(limb(AB0, AB1, 0.085, CORPO, { roughness: 0.8 }))
  const eixo = new THREE.Vector3(AB1[0] - AB0[0], AB1[1] - AB0[1], AB1[2] - AB0[2]).normalize()
  for (const t of [0.35, 0.75]) {
    const anel = torus(0.085, 0.012, CORPO_CLARO, { roughness: 0.8 })
    anel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), eixo)
    anel.position.set(0, AB0[1] + (AB1[1] - AB0[1]) * t, AB0[2] + (AB1[2] - AB0[2]) * t)
    corpo.add(anel)
  }

  // perninhas pretas, moles, penduradas
  for (const side of [-1, 1]) {
    const pernas: [number, number, number][][] = [
      [[side * 0.08, -0.03, 0.1], [side * 0.15, -0.18, 0.15], [side * 0.13, -0.34, 0.15]],
      [[side * 0.09, -0.07, 0.05], [side * 0.2, -0.17, 0.07], [side * 0.21, -0.35, 0.06]],
    ]
    for (const [a, b, c] of pernas) {
      corpo.add(limb(a, b, 0.014, ASA_BORDA, { roughness: 0.5 }))
      corpo.add(limb(b, c, 0.012, ASA_BORDA, { roughness: 0.5 }))
      const pe = sphere(0.02, ASA_BORDA, { roughness: 0.5 })
      pe.position.set(...c)
      corpo.add(pe)
    }
  }

  // ---- asas (peças próprias: batem no voo, caem no fim) ------------------------------
  const asaD = new THREE.Group()
  asaD.position.set(0.09, 0.03, 0)
  asaD.rotation.set(0, SWEEP, DROOP)
  asaD.add(wingPair(0, 0.85))
  corpo.add(asaD)

  const asaE = new THREE.Group()
  asaE.position.set(-0.09, 0.03, 0)
  asaE.rotation.set(0, -SWEEP, -DROOP - DROOP_E) // a esquerda caiu menos, mas vincou: torta
  const espelho = new THREE.Group()
  espelho.scale.x = -1
  espelho.add(wingPair(0.6, 0.7))
  asaE.add(espelho)
  corpo.add(asaE)

  // ---- cabeça verde-enjoada ---------------------------------------------------------
  const HR = 0.19
  const cabeca = new THREE.Group()
  cabeca.position.set(0, -0.07, 0.18)
  cabeca.rotation.set(HEAD_TILT, 0, HEAD_ROLL)
  corpo.add(cabeca)

  const cranio = sphere(HR, ENJOO, { roughness: 0.55 })
  cabeca.add(cranio)

  // boca apertada, ondulada
  const bocaPts: THREE.Vector3[] = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    const x = -0.055 + 0.11 * t
    const y = -0.085 + 0.01 * Math.sin(t * Math.PI * 3)
    const z = Math.sqrt(Math.max(HR * HR - x * x - y * y, 0)) + 0.004
    bocaPts.push(new THREE.Vector3(x, y, z))
  }
  cabeca.add(tube(bocaPts, 0.01, BOCA, 60))

  // olhos normais (no voo): cobertos pelas espirais quando ela despenca
  const EYE_DIR = (side: number) => new THREE.Vector3(side * 0.4, 0.2, 0.9).normalize()
  for (const side of [-1, 1]) {
    const d = EYE_DIR(side)
    const olho = sphere(0.058, '#ffffff', { roughness: 0.25 })
    olho.position.copy(d).multiplyScalar(HR * 0.9)
    olho.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d)
    olho.scale.z = 0.5
    cabeca.add(olho)
    const pupila = sphere(0.026, '#1a1a1a', { roughness: 0.2 })
    pupila.position.copy(d).multiplyScalar(HR * 0.9 + 0.018)
    pupila.position.y += 0.02
    cabeca.add(pupila)
  }

  const olhoE = spiralEye(0.074, 1)
  const olhoD = spiralEye(0.074, -1)
  for (const [olho, side] of [[olhoE, -1], [olhoD, 1]] as const) {
    const d = EYE_DIR(side)
    olho.position.copy(d).multiplyScalar(HR * 1.02)
    olho.rotation.set(-Math.asin(d.y), Math.atan2(d.x, d.z), 0)
    cabeca.add(olho)
  }

  // antenas-mola
  const antenas = new THREE.Group()
  antenas.position.set(0, HR * 0.86, 0.0)
  antenas.rotation.x = ANT_DROOP
  for (const side of [-1, 1]) {
    const antena = mola(0.26, 0.022, 4.5)
    antena.position.x = side * 0.06
    antena.rotation.z = -side * (side < 0 ? 0.95 : 0.7)
    antenas.add(antena)
  }
  cabeca.add(antenas)

  // bochechas estufadas + gota de suor
  const bochechas = new THREE.Group()
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.068, ENJOO_CLARO, { roughness: 0.5 })
    bochecha.position.set(side * 0.105, -0.07, 0.13)
    bochecha.scale.set(1, 0.88, 0.85)
    bochechas.add(bochecha)
  }
  const gota = new THREE.Group()
  gota.position.set(0.15, 0.1, 0.1)
  gota.rotation.z = -0.3
  const gotaCorpo = sphere(0.025, SUOR, { roughness: 0.1 })
  gota.add(gotaCorpo)
  const gotaPonta = cone(0.021, 0.04, SUOR, { roughness: 0.1 })
  gotaPonta.position.y = 0.028
  gota.add(gotaPonta)
  bochechas.add(gota)
  cabeca.add(bochechas)

  // ---- peças ------------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'ilha', object: base },
    { name: 'ilhota', group: 'ilha', object: ilhota },
    { name: 'torre', group: 'farol', object: torre },
    { name: 'lanterna', group: 'farol', object: lanterna },
    { name: 'luz', group: 'amor', object: luz },
    { name: 'borboleta', group: 'amor', object: borboleta },
    { name: 'asaE', group: 'amor', object: asaE },
    { name: 'asaD', group: 'amor', object: asaD },
    { name: 'cabeca', group: 'amor', object: cabeca },
    { name: 'antenas', group: 'amor', object: antenas },
    { name: 'purpurina', group: 'voltas', object: purpurina },
    { name: 'olhoE', group: 'enjoo', object: olhoE },
    { name: 'olhoD', group: 'enjoo', object: olhoD },
    { name: 'bochechas', group: 'enjoo', object: bochechas },
  ]

  // ---- montagem ---------------------------------------------------------------------
  const S = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const flaps = (part: string, open: number, low: number) => {
    const out = []
    let t = 4.4
    let from = open
    for (let i = 0; i < 7; i++) {
      const to = i % 2 === 0 ? low : open
      out.push(seq(`${part}-bate-${i}`, part, t, 0.36, [ch('rotation.z', from, to)]))
      from = to
      t += 0.38
    }
    return out
  }

  const build = [
    seq('mar-sobe', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'No meio do mar escuro, sobe uma ILHA de pedras…',
    }),
    seq('ilhota-sobe', 'ilhota', 0.35, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),

    seq('torre-sobe', 'torre', 1.4, 0.9, [riseFrom(0, 1.8)], {
      ease: 'easeOut',
      caption: '…e nela, um farol listrado de vermelho e branco.',
    }),
    seq('lanterna-desce', 'lanterna', 2.25, 0.6, [ch('position.y', 0.9, 0), ch('rotation.y', -1.2, 0)], {
      ease: 'easeOut',
    }),

    seq('luz-acende', 'luz', 3.2, 0.6, S(0.01, 1), {
      ease: 'easeOut',
      caption: 'A lâmpada acende — e uma borboleta azul se apaixona por ela: é o grande AMOR da vida dela.',
    }),

    // chega voando e dá voltas e voltas na lâmpada
    seq('borboleta-chega', 'borboleta', 4.4, 0.5, S(0.01, 1), { ease: 'easeOut' }),
    seq('borboleta-voltas', 'borboleta', 4.4, 2.8, [ch('rotation.y', -6 * Math.PI, 0)]),
    seq('cabeca-olha', 'cabeca', 4.4, 0.5, [ch('rotation.x', 0, HEAD_UP)], { ease: 'easeOut' }),
    seq('antenas-surgem', 'antenas', 4.4, 0.5, [ch('scale.y', 0.2, 1)], { ease: 'easeOut' }),
    ...flaps('asaD', OPEN, LOW),
    ...flaps('asaE', -OPEN, -LOW),
    seq('purpurina-rastro', 'purpurina', 5.2, 2.0, [...S(0.01, 1), ch('rotation.y', -2 * Math.PI, 0)], {
      ease: 'easeOut',
      caption: 'A noite inteira ela dá voltas na luz — mil, duas mil voltas, sem parar um segundo.',
    }),

    // de manhã: despenca na grade
    seq('borboleta-despenca', 'borboleta', 7.4, 0.45, [ch('position.y', LIFT, 0)], {
      ease: 'easeIn',
      caption: 'De manhã ela despenca na grade da varanda: verde, com espirais no lugar dos olhos.',
    }),
    seq('borboleta-quica', 'borboleta', 7.85, 0.18, [ch('position.y', 0, 0.05)], { ease: 'easeOut' }),
    seq('borboleta-assenta', 'borboleta', 8.03, 0.22, [ch('position.y', 0.05, 0)], { ease: 'easeIn' }),
    seq('asaD-cai', 'asaD', 7.5, 0.7, [ch('rotation.z', LOW, DROOP)], { ease: 'easeOut' }),
    seq('asaE-cai', 'asaE', 7.55, 0.75, [ch('rotation.z', -LOW, -DROOP - DROOP_E)], { ease: 'easeOut' }),
    seq('cabeca-tomba', 'cabeca', 7.75, 0.6, [ch('rotation.x', HEAD_UP, HEAD_TILT), ch('rotation.z', 0, HEAD_ROLL)], {
      ease: 'easeOut',
    }),
    seq('antenas-murcham', 'antenas', 7.85, 0.7, [ch('rotation.x', ANT_BACK, ANT_DROOP)], { ease: 'easeOut' }),
    seq('olhoE-surge', 'olhoE', 8.2, 0.3, S(0.01, 1), { ease: 'easeOut' }),
    seq('olhoD-surge', 'olhoD', 8.25, 0.3, S(0.01, 1), { ease: 'easeOut' }),
    seq('bochechas-estufam', 'bochechas', 8.7, 0.5, S(0.2, 1), { ease: 'easeOut' }),

    // a lâmpada pisca, a ilha gira, os olhos rodam
    seq('luz-apaga', 'luz', 9.5, 0.15, S(1, 0.55), {
      ease: 'easeIn',
      caption: 'A lâmpada pisca — "tudo bem, AMOR?" — e ela, vendo a ILHA girar lá embaixo, geme: IÁ, MÔR… ÍL-LA…',
    }),
    seq('luz-volta', 'luz', 9.65, 0.3, S(0.55, 1), { ease: 'easeOut' }),
    seq('ilhota-gira', 'ilhota', 9.7, 1.6, [ch('rotation.y', 0.9, 0)], { ease: 'easeOut' }),
    seq('olhoE-gira', 'olhoE', 9.7, 1.6, [ch('rotation.z', -4 * Math.PI, 0)], { ease: 'easeOut' }),
    seq('olhoD-gira', 'olhoD', 9.7, 1.6, [ch('rotation.z', 4 * Math.PI, 0)], { ease: 'easeOut' }),
    seq('bochechas-enjoo-a', 'bochechas', 10.5, 0.25, S(1, 1.16), { ease: 'easeOut' }),
    seq('bochechas-enjoo-b', 'bochechas', 10.75, 0.35, S(1.16, 1), { ease: 'easeInOut' }),

    seq('bochechas-enjoo-c', 'bochechas', 11.7, 0.25, S(1, 1.16), {
      ease: 'easeOut',
      caption: 'Jag mår illa. — Estou enjoado.',
    }),
    seq('bochechas-enjoo-d', 'bochechas', 11.95, 0.35, S(1.16, 1), { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.5, 4.8], target: [0, 1.5, 0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-mar-illa',
    contexto:
      "Saúde: no barco para o arquipélago ou para a Finlândia, no banco de trás do carro, depois de comer algo estragado, na gravidez. Na farmácia: 'Jag mår illa, har ni något mot det?'",
    fraseFonte: 'Estou enjoado.',
    fraseAlvo: 'Jag mår illa.',
    pronuncia:
      "iá môr ÍL-la ('mår' com Ô fechado e longo e um R brando que emenda no i: mô-RÍL-la; 'illa' com I curto e L dobrado de ponta de língua, força no ÍL)",
    ponteSonora:
      "IÁ, MÔR... ÍL-LA! (4 sílabas: iá-mô-RÍL-la; tônica forte no ÍL; IÁ, MÔR é o MESMO começo do astronauta de 'Jag mår bra, tack. Och du?' — 'já, amor', respondendo pro amor: IÁ com I de IOGA, nunca J chiado; MÔR = o 'mor' de AMOR, Ô FECHADO e longo — se fechar em U vira 'mor', mãe —, e o R NÃO some (sem ele sobra 'må'): é R BRANDO, de 'caro', que emenda direto no I seguinte, mô-RÍL-la, do jeitinho que o sueco fala; ÍL-LA = a ILHA trocando o LH por um L de verdade: ponta da língua no céu da boca, L comprido (é L dobrado), I CURTO e com a força, e um -la fraquinho no fim — nunca 'Í-lia'; o astronauta respondia BRÁ (bem), a borboleta responde ÍL-LA: enjoada)",
    historia:
      "A borboleta se apaixonou pela luz do farol da ILHA: é o grande AMOR da vida dela. Passou a noite inteira dando voltas em volta da lâmpada — mil, duas mil voltas, sem parar um segundo. De manhã o farol apaga e ela despenca na grade da varanda, verde, com espirais no lugar dos olhos. A lâmpada dá uma última piscada, como quem pergunta 'tudo bem, amor?', e ela, vendo a ILHA inteira girar lá embaixo, só consegue gemer: IÁ, MÔR... ÍL-LA... — e põe pra fora, no mar, tudo o que comeu. Estou enjoada.",
  },
  createScene,
  refine: { organic: ['borboleta', 'cabeca'] },
}

export default card
