import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock,
} from '../rig/helpers'

/**
 * "Kan vi dela på notan?" — CA-VI DÊ-LA, PÔ! NÚ-TAN?
 *
 * Eco deliberado de "Kan vi få notan, tack?": o mesmo CA-VI (CAVE) e a mesma
 * NÚ-TAN (a nota nua). Lá a toupeira TRAZ a nota; aqui a onça PARTE a nota.
 *
 * Diorama: adega de pedra (a CAVE do restaurante) com arco de tijolos e a
 * placa CAVE na pedra-chave; barris deitados com o lampião aceso em cima; um
 * barril em pé faz de mesa. Atrás dele, a onça-pintada ergue a pata com as
 * garras de fora: a nota branca, em pé no tampo, já está fatiada de cima a
 * baixo — risco dourado no corte — e as duas metades se abrem, uma pra cada
 * lado do barril.
 */

const GROUT = '#3b3734'
const STONE = ['#75706a', '#827c75', '#69645f']
const BRICK = ['#a05540', '#ad6248', '#914a37']
const MORTAR = '#5d4d43'
const NICHE = '#1b1613'
const OAK = '#7a4a2b'
const OAK_DARK = '#55331d'
const OAK_LIGHT = '#946039'
const IRON = '#2b2b30'
const SIGN = '#4a2f1e'
const LETTER = '#efe2c4'
const GOLD = '#d9973a' // pelagem da onça
const GOLD_DARK = '#b8762a'
const CREAM = '#f2e4c6'
const SPOT = '#2a1b13' // rosetas
const PAD = '#4a2b25'
const NOSE = '#9c5547'
const MOUTH = '#4a1a1e'
const TONGUE = '#d5737c'
const TOOTH = '#fbf7ec'
const CLAW = '#f6f1e4'
const PAPER = '#f8f5ec'
const INK = '#3c3a46'
const WINE = '#6a1426'
const GLASS = '#eef3f2'
const SLASH = '#ffd23f' // acento saturado RESERVADO: o risco do corte (DÊ-LA)

const FY = 0.17 // topo das lajes
const BZ = 0.35 // centro do barril-mesa
const TOP = FY + 0.78 // tampo do barril-mesa
const OZ = -0.7 // onça sentada atrás do barril
const WZ = -1.45 // face da parede
const WD = 0.34 // espessura da parede
const WW = 3.7 // largura da parede
const AR = 0.95 // raio do vão do arco
const AY = 1.65 // nascença do arco
const RT = 0.28 // espessura do anel de tijolos

// nota: duas metades com pivô no canto de baixo de FORA
const NW = 0.29 // largura de cada metade
const NH = 0.68
const NZ = BZ + 0.02
const NOTE_TILT = -0.15 // topo levemente para trás: de frente para a câmera
const OPEN_LEAN = 0.2
const OPEN_X = NW * Math.cos(OPEN_LEAN) + 0.03 // canto externo, aberta: V com a ponta quase fechada

// pata erguida (pivô no ombro, em coordenadas da onça)
const ARM = 0.92
const SHOULDER: [number, number, number] = [0.4, 1.38, 0.12]
const REST = { x: 2.09, z: 0.1 } // apoiada no tampo
const RAISED = { x: 0.15, z: -0.4 } // erguida, garras de fora (pose final)
const SWIPE = { x: 1.9, z: 0.45 } // fim do golpe: ZÁS!

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function translucido(mesh: THREE.Mesh, opacity: number) {
  const m = mesh.material as THREE.MeshStandardMaterial
  m.transparent = true
  m.opacity = opacity
  m.depthWrite = false
  mesh.castShadow = false
  return mesh
}

/** Cápsula esticada entre dois pontos — membros, cauda. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, dir.length()), color, { roughness: 0.85 })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

/** Anel leve: as rosetas são dezenas, e cada uma vira detalhe no refinado. */
function anel(r: number, tube: number) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 18), mat(SPOT, { roughness: 0.85, size: r * 2 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Roseta (anel com pinta no meio) ou pinta cheia, deitada na superfície. */
function mark(parent: THREE.Object3D, p: THREE.Vector3, n: THREE.Vector3, size: number, ring: boolean) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)
  if (ring) {
    const r = anel(size, size * 0.34)
    r.quaternion.copy(q)
    r.scale.z = 0.75
    r.position.copy(p).addScaledVector(n, 0.006)
    parent.add(r)
    const dot = sphere(size * 0.32, SPOT, { roughness: 0.85 }, 10)
    dot.quaternion.copy(q)
    dot.scale.z = 0.4
    dot.position.copy(p).addScaledVector(n, 0.004)
    parent.add(dot)
  } else {
    const d = sphere(size, SPOT, { roughness: 0.85 }, 12)
    d.quaternion.copy(q)
    d.scale.z = 0.38
    d.position.copy(p).addScaledVector(n, 0.004)
    parent.add(d)
  }
}

/** Marca sobre um elipsoide (centro, raios) na direção dada. */
function spotOn(
  parent: THREE.Object3D, center: THREE.Vector3, radii: THREE.Vector3,
  dir: THREE.Vector3, size: number, ring = true,
) {
  const d = dir.clone().normalize()
  const k = 1 / Math.sqrt((d.x / radii.x) ** 2 + (d.y / radii.y) ** 2 + (d.z / radii.z) ** 2)
  const p = d.multiplyScalar(k)
  const n = V(p.x / radii.x ** 2, p.y / radii.y ** 2, p.z / radii.z ** 2).normalize()
  mark(parent, p.add(center), n, size, ring)
}

type Ell = { c: THREE.Vector3; r: THREE.Vector3; cream?: boolean }

/**
 * Ponto mais externo da união de elipsoides ao longo de um raio que sai de
 * dentro do corpo — é onde a pele fundida pelo Blender vai estar, então a
 * roseta pintada ali fica à vista em vez de enterrada numa esfera vizinha.
 */
function exitHit(shapes: Ell[], o: THREE.Vector3, d: THREE.Vector3) {
  let best = -Infinity
  let hit: Ell | null = null
  for (const s of shapes) {
    const oo = o.clone().sub(s.c).divide(s.r)
    const dd = d.clone().divide(s.r)
    const a = dd.dot(dd)
    const b = 2 * oo.dot(dd)
    const c = oo.dot(oo) - 1
    const disc = b * b - 4 * a * c
    if (disc < 0) continue
    const t = (-b + Math.sqrt(disc)) / (2 * a)
    if (t > best) {
      best = t
      hit = s
    }
  }
  if (!hit) return null
  const p = o.clone().addScaledVector(d, best)
  const q = p.clone().sub(hit.c)
  const n = V(q.x / hit.r.x ** 2, q.y / hit.r.y ** 2, q.z / hit.r.z ** 2).normalize()
  return { p, n, cream: !!hit.cream }
}

/** Marca sobre um membro (cápsula de a até b, raio r), na fração t do eixo. */
function spotLimb(
  parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r: number,
  t: number, around: THREE.Vector3, size: number, ring = false,
) {
  const axis = new THREE.Vector3().subVectors(b, a).normalize()
  const n = around.clone().addScaledVector(axis, -around.dot(axis)).normalize()
  const p = a.clone().lerp(b, t).addScaledVector(n, r)
  mark(parent, p, n, size, ring)
}

/** Esfera de pelagem: devolve centro e raios para pintar rosetas nela. */
function blob(
  parent: THREE.Object3D, r: number, color: string,
  pos: [number, number, number], scl: [number, number, number] = [1, 1, 1],
) {
  const m = sphere(r, color, { roughness: 0.85 })
  m.position.set(...pos)
  m.scale.set(...scl)
  parent.add(m)
  return { c: V(...pos), r: V(r * scl[0], r * scl[1], r * scl[2]) }
}

/** C A V E — letras de traço grosso feitas de caixas, no plano xy. */
function letter(which: 'C' | 'A' | 'V' | 'E') {
  const g = new THREE.Group()
  const t = 0.042
  const h = 0.2
  const s = (w: number, hh: number, x: number, y: number, rot = 0) => {
    const b = rbox(w, hh, 0.028, 0.01, LETTER, { roughness: 0.6 })
    b.position.set(x, y, 0)
    b.rotation.z = rot
    g.add(b)
  }
  if (which === 'C') {
    s(t, h, -0.046, 0)
    s(0.12, t, 0.0, h / 2 - t / 2)
    s(0.12, t, 0.0, -h / 2 + t / 2)
  } else if (which === 'A') {
    s(t, h + 0.01, -0.03, 0, -0.3)
    s(t, h + 0.01, 0.03, 0, 0.3)
    s(0.07, 0.034, 0, -0.03)
  } else if (which === 'V') {
    s(t, h + 0.01, -0.03, 0, 0.3)
    s(t, h + 0.01, 0.03, 0, -0.3)
  } else {
    s(t, h, -0.046, 0)
    s(0.11, t, 0.004, h / 2 - t / 2)
    s(0.085, t, -0.008, 0)
    s(0.11, t, 0.004, -h / 2 + t / 2)
  }
  return g
}

/** Barril deitado, com o tampo virado para a câmera (+z). */
function barrilDeitado(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const L = 0.74
  const body = lathe(
    [
      [0, 0.03], [0.27, 0.03], [0.28, 0], [0.3, 0], [0.33, 0.18], [0.345, L / 2],
      [0.33, L - 0.18], [0.3, L], [0.28, L], [0.27, L - 0.03], [0, L - 0.03],
    ],
    rand() > 0.5 ? OAK : OAK_LIGHT,
    { roughness: 0.75 },
  )
  body.rotation.x = Math.PI / 2
  body.position.z = -L / 2
  g.add(body)
  for (const [hz, hr] of [[-0.3, 0.307], [-0.16, 0.335], [0.16, 0.335], [0.3, 0.307]] as const) {
    const hoop = torus(hr, 0.018, IRON, { roughness: 0.45, metalness: 0.6 })
    hoop.position.z = hz
    g.add(hoop)
  }
  // tábuas do tampo, à vista
  for (const x of [-0.13, 0, 0.13]) {
    const len = 2 * Math.sqrt(0.27 * 0.27 - x * x) - 0.03
    const line = rbox(0.012, len, 0.01, 0.004, OAK_DARK, { roughness: 0.8 })
    line.position.set(x + 0.065, 0, L / 2 - 0.03)
    if (Math.abs(x + 0.065) < 0.26) g.add(line)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base: piso de lajes de pedra da adega ---------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.62, 2.7, 0.12, GROUT, { roughness: 0.92 })
  slab.position.y = 0.06
  base.add(slab)

  const P = 0.52
  for (let i = -5; i <= 5; i++) {
    for (let j = -5; j <= 5; j++) {
      const off = (j % 2) * P * 0.5
      const x = i * P + off
      const z = j * P
      if (Math.hypot(Math.abs(x) + P / 2, Math.abs(z) + P / 2) > 2.6) continue
      const tile = rbox(
        P - 0.045, 0.05 + rand() * 0.012, P - 0.045, 0.025,
        STONE[Math.floor(rand() * STONE.length)], { roughness: 0.9 },
      )
      tile.position.set(x + (rand() - 0.5) * 0.02, FY - 0.025, z + (rand() - 0.5) * 0.02)
      tile.rotation.y = (rand() - 0.5) * 0.05
      base.add(tile)
    }
  }

  // garrafa vazia deitada e rolha no chão
  const garrafa = new THREE.Group()
  garrafa.position.set(1.5, FY + 0.075, 0.95)
  garrafa.rotation.set(0, 0.7, Math.PI / 2)
  const vidro = lathe(
    [[0, 0], [0.072, 0], [0.076, 0.03], [0.074, 0.2], [0.03, 0.27], [0.026, 0.36], [0.031, 0.375], [0, 0.375]],
    '#2f4a35',
    { roughness: 0.15 },
  )
  vidro.position.y = -0.19
  garrafa.add(vidro)
  const rotulo = cylinder(0.077, 0.077, 0.09, '#e6d9bc', { roughness: 0.8 })
  rotulo.position.y = -0.07
  garrafa.add(rotulo)
  base.add(garrafa)

  const rolha = capsule(0.035, 0.05, '#c8a97a', { roughness: 0.85 })
  rolha.position.set(0.95, FY + 0.035, 1.35)
  rolha.rotation.set(Math.PI / 2, 0, 0.8)
  base.add(rolha)

  for (let i = 0; i < 3; i++) {
    const caco = rock(0.07 + rand() * 0.03, BRICK[i], 61 + i, { roughness: 0.9 })
    caco.position.set(-1.95 + i * 0.22, FY + 0.04, -1.05 + rand() * 0.3)
    caco.rotation.y = rand() * Math.PI
    base.add(caco)
  }

  root.add(base)

  // ---- parede de tijolos com o arco da CAVE ----------------------------------
  const parede = new THREE.Group()

  const topY = (x: number) => 3.1 - Math.max(0, Math.abs(x) - 0.85) * 0.8
  // massa de argamassa por trás (contorno com o vão do arco recortado)
  const outline = new THREE.Shape()
  const hw = WW / 2 - 0.03
  outline.moveTo(-hw, FY)
  outline.lineTo(-AR, FY)
  outline.lineTo(-AR, AY)
  outline.absarc(0, AY, AR, Math.PI, 0, true)
  outline.lineTo(AR, FY)
  outline.lineTo(hw, FY)
  for (let k = 0; k <= 20; k++) {
    const x = hw - (k / 20) * hw * 2
    outline.lineTo(x, topY(x) - 0.12)
  }
  outline.lineTo(-hw, FY)
  const massaGeo = new THREE.ExtrudeGeometry(outline, { depth: WD - 0.05, bevelEnabled: false, curveSegments: 32 })
  const massa = new THREE.Mesh(massaGeo, mat(MORTAR, { roughness: 0.95, size: 3 }))
  massa.castShadow = true
  massa.receiveShadow = true
  massa.position.z = WZ - WD + 0.025
  parede.add(massa)

  // fundo escuro do vão (a adega continua lá dentro)
  const fundo = rbox(AR * 2 + 0.3, AY + AR - FY + 0.2, 0.06, 0.02, NICHE, { roughness: 0.95 })
  fundo.position.set(0, FY + (AY + AR - FY + 0.2) / 2, WZ - WD - 0.04)
  parede.add(fundo)

  // tijolos: um protótipo por cor, clonados (geometria e material partilhados)
  const BL = 0.34
  const BHt = 0.15
  const protos = BRICK.map((c) => rbox(BL, BHt, WD, 0.025, c, { roughness: 0.85 }))
  const brick = (x: number, y: number, z: number, w = 1) => {
    const b = protos[Math.floor(rand() * protos.length)].clone()
    b.position.set(x, y, z)
    b.scale.x = w
    parede.add(b)
    return b
  }
  const inArch = (x: number, y: number) =>
    (Math.abs(x) < AR + RT + 0.06 && y < AY) || Math.hypot(x, y - AY) < AR + RT + 0.06
  for (let i = 0; ; i++) {
    const y = FY + 0.085 + i * 0.17
    if (y > 3.2) break
    const off = (i % 2) * 0.185
    for (let x = -WW / 2 + 0.17 + off; x < WW / 2 - 0.16; x += 0.37) {
      if (y + BHt / 2 > topY(x) + (rand() - 0.5) * 0.1) continue
      if (inArch(x, y)) continue
      brick(x, y, WZ - WD / 2 + (rand() - 0.5) * 0.012)
    }
  }
  // ombreiras do vão
  for (let i = 0; FY + 0.085 + i * 0.17 < AY; i++) {
    const y = FY + 0.085 + i * 0.17
    for (const sx of [-1, 1]) {
      const b = brick(sx * (AR + RT / 2), y, WZ - WD / 2 + 0.012, (RT - 0.02) / BL)
      b.scale.z = 1.04
    }
  }
  // aduelas do arco: tijolos em leque
  const NV = 15
  const vossProto = BRICK.map((c) => rbox(0.19, RT - 0.02, WD + 0.03, 0.025, c, { roughness: 0.85 }))
  for (let k = 0; k < NV; k++) {
    const a = Math.PI * (k + 0.5) / NV
    const rr = AR + RT / 2
    const v = vossProto[k % 3].clone()
    v.position.set(Math.cos(a) * rr, AY + Math.sin(a) * rr, WZ - WD / 2 + 0.015)
    v.rotation.z = a - Math.PI / 2
    parede.add(v)
  }

  // placa CAVE na pedra-chave
  const placa = new THREE.Group()
  placa.position.set(0, AY + AR + RT / 2 + 0.01, WZ + 0.06)
  const tabua = rbox(0.84, 0.32, 0.06, 0.025, SIGN, { roughness: 0.75 })
  placa.add(tabua)
  const moldura = rbox(0.9, 0.38, 0.03, 0.03, OAK_DARK, { roughness: 0.75 })
  moldura.position.z = -0.03
  placa.add(moldura)
  const glyphs: ['C' | 'A' | 'V' | 'E', number][] = [['C', -0.27], ['A', -0.09], ['V', 0.09], ['E', 0.27]]
  for (const [gch, lx] of glyphs) {
    const l = letter(gch)
    l.position.set(lx, 0, 0.034)
    placa.add(l)
  }
  for (const sx of [-1, 1]) {
    const prego = sphere(0.02, IRON, { roughness: 0.4, metalness: 0.6 })
    prego.position.set(sx * 0.38, 0.12, 0.035)
    placa.add(prego)
  }
  parede.add(placa)

  // adega à direita: nicho de garrafas deitadas (fundos à mostra)
  const adega = new THREE.Group()
  adega.position.set(1.42, FY, WZ + 0.12)
  const caixa = rbox(0.62, 0.92, 0.3, 0.02, OAK_DARK, { roughness: 0.8 })
  caixa.position.y = 0.46
  adega.add(caixa)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const fundoG = cylinder(0.075, 0.075, 0.04, '#24382a', { roughness: 0.2 }, 20)
      fundoG.rotation.x = Math.PI / 2
      fundoG.position.set(-0.19 + c * 0.19, 0.18 + r * 0.28, 0.15)
      adega.add(fundoG)
      const punt = sphere(0.03, '#1a2a1f', { roughness: 0.2 })
      punt.position.set(-0.19 + c * 0.19, 0.18 + r * 0.28, 0.17)
      punt.scale.z = 0.4
      adega.add(punt)
    }
  }
  parede.add(adega)

  root.add(parede)

  // ---- barris deitados (à esquerda) ------------------------------------------
  const barris = new THREE.Group()
  barris.position.set(-1.5, 0, -0.98)
  const PILE: [number, number][] = [[-0.34, FY + 0.345], [0.34, FY + 0.345], [0, FY + 0.345 + 0.59]]
  for (const [i, [bx, by]] of PILE.entries()) {
    const b = barrilDeitado(11 + i)
    b.position.set(bx, by, 0)
    b.rotation.z = (rand() - 0.5) * 0.3
    barris.add(b)
  }
  for (const bx of [-0.34, 0.34]) {
    for (const sx of [-1, 1]) {
      const calco = rbox(0.12, 0.08, 0.5, 0.02, OAK_DARK, { roughness: 0.8 })
      calco.position.set(bx + sx * 0.25, FY + 0.04, 0)
      barris.add(calco)
    }
  }
  root.add(barris)

  // ---- lampião aceso em cima dos barris --------------------------------------
  const lampiao = new THREE.Group()
  lampiao.position.set(0, FY + 0.345 + 0.59 + 0.33, 0)
  const lbase = rbox(0.22, 0.04, 0.22, 0.012, IRON, { roughness: 0.45, metalness: 0.6 })
  lbase.position.y = 0.02
  lampiao.add(lbase)
  const lglass = translucido(
    rbox(0.17, 0.23, 0.17, 0.01, '#fff1cf', { roughness: 0.1, emissive: '#ffc46b', emissiveIntensity: 0.35 }),
    0.5,
  )
  lglass.position.y = 0.16
  lampiao.add(lglass)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = cylinder(0.013, 0.013, 0.25, IRON, { roughness: 0.45, metalness: 0.6 }, 10)
      post.position.set(sx * 0.088, 0.16, sz * 0.088)
      lampiao.add(post)
    }
  }
  const ltopo = rbox(0.21, 0.03, 0.21, 0.01, IRON, { roughness: 0.45, metalness: 0.6 })
  ltopo.position.y = 0.29
  lampiao.add(ltopo)
  const telhado = cone(0.16, 0.13, IRON, { roughness: 0.45, metalness: 0.6 }, 4)
  telhado.rotation.y = Math.PI / 4
  telhado.position.y = 0.37
  lampiao.add(telhado)
  const argola = torus(0.045, 0.011, IRON, { roughness: 0.45, metalness: 0.6 })
  argola.position.y = 0.475
  lampiao.add(argola)
  const pavio = cylinder(0.022, 0.026, 0.05, '#c9a250', { roughness: 0.3, metalness: 0.7 })
  pavio.position.y = 0.065
  lampiao.add(pavio)
  const chama = cone(0.03, 0.1, '#ffd98a', { emissive: '#ffa53c', emissiveIntensity: 1.4 })
  chama.position.y = 0.14
  lampiao.add(chama)
  const luz = new THREE.PointLight('#ffb25a', 2.2, 3.6, 2)
  luz.position.y = 0.16
  lampiao.add(luz)
  barris.add(lampiao) // sobe junto com a pilha

  // ---- barril em pé: a mesa ----------------------------------------------------
  const barril = new THREE.Group()
  barril.position.set(0, FY, BZ)
  const PROF: [number, number][] = [
    [0, 0], [0.47, 0], [0.5, 0.03], [0.55, 0.18], [0.58, 0.4], [0.55, 0.62], [0.5, 0.775],
    [0.505, 0.81], [0.478, 0.81], [0.468, 0.78], [0, 0.78],
  ]
  const corpo = lathe(PROF, OAK, { roughness: 0.72 }, 48)
  barril.add(corpo)
  const rAt = (y: number) => {
    const pts = PROF.slice(2, 7)
    for (let k = 0; k < pts.length - 1; k++) {
      const [r0, y0] = pts[k]
      const [r1, y1] = pts[k + 1]
      if (y >= y0 && y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
    }
    return 0.5
  }
  for (const hy of [0.085, 0.25, 0.56, 0.72]) {
    const aro = torus(rAt(hy) + 0.006, 0.022, IRON, { roughness: 0.45, metalness: 0.6 })
    aro.rotation.x = Math.PI / 2
    aro.position.y = hy
    barril.add(aro)
  }
  // juntas das aduelas, seguindo o bojo
  const juntaProto = rbox(0.014, 0.38, 0.012, 0.005, OAK_DARK, { roughness: 0.8 })
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2 + 0.07
    for (const half of [0, 1]) {
      const y0 = half ? 0.4 : 0.03
      const y1 = half ? 0.775 : 0.4
      const r0 = rAt(y0)
      const r1 = rAt(y1)
      const j = juntaProto.clone()
      const rm = (r0 + r1) / 2 + 0.004
      j.rotation.order = 'YXZ'
      j.rotation.y = a
      j.rotation.x = Math.atan2(r1 - r0, y1 - y0)
      j.position.set(Math.sin(a) * rm, (y0 + y1) / 2, Math.cos(a) * rm)
      barril.add(j)
    }
  }
  // tábuas do tampo
  for (const x of [-0.3, -0.15, 0, 0.15, 0.3]) {
    const len = 2 * Math.sqrt(0.465 * 0.465 - x * x) - 0.02
    const tab = rbox(0.012, 0.006, len, 0.003, OAK_DARK, { roughness: 0.8 })
    tab.position.set(x, 0.782, 0)
    barril.add(tab)
  }
  // batoque na frente
  const batoque = cylinder(0.05, 0.05, 0.03, '#b88b5a', { roughness: 0.8 })
  batoque.rotation.x = Math.PI / 2
  batoque.position.set(0, 0.45, 0.575)
  barril.add(batoque)
  root.add(barril)

  // ---- duas taças de tinto -----------------------------------------------------
  const tacas = new THREE.Group()
  tacas.position.set(0, TOP, BZ)
  for (const [tx, tz] of [[-0.32, 0.27], [0.33, 0.25]] as const) {
    const t = new THREE.Group()
    t.position.set(tx, 0, tz)
    const pe = lathe([[0, 0], [0.068, 0], [0.07, 0.01], [0.016, 0.02], [0.013, 0.13], [0, 0.13]], GLASS, { roughness: 0.08 })
    t.add(pe)
    const bojo = translucido(
      lathe(
        [[0.012, 0.128], [0.05, 0.15], [0.085, 0.205], [0.09, 0.275], [0.084, 0.275], [0.079, 0.21], [0.046, 0.157], [0, 0.138]],
        GLASS,
        { roughness: 0.05 },
      ),
      0.38,
    )
    t.add(bojo)
    const vinho = lathe([[0, 0.142], [0.044, 0.158], [0.074, 0.198], [0.079, 0.215], [0, 0.215]], WINE, { roughness: 0.18 })
    t.add(vinho)
    tacas.add(t)
  }
  root.add(tacas)

  // ---- ONÇA-PINTADA sentada atrás do barril (peça orgânica) ------------------
  const onca = new THREE.Group()
  onca.position.set(0, FY, OZ)
  root.add(onca)
  const pele: Ell[] = [] // volumes de pelagem, para espalhar as rosetas

  for (const side of [-1, 1]) {
    pele.push(blob(onca, 0.42, GOLD, [side * 0.4, 0.42, -0.12], [0.9, 1, 1.15]))
    const pe = blob(onca, 0.15, GOLD, [side * 0.52, 0.09, 0.34], [0.95, 0.6, 1.4])
    spotOn(onca, pe.c, pe.r, V(side * 0.5, 1, 0.2), 0.025, false)
    for (let d = 0; d < 3; d++) {
      const dedo = sphere(0.05, GOLD_DARK, { roughness: 0.85 }, 16)
      dedo.position.set(side * 0.52 + (d - 1) * 0.07, 0.05, 0.52)
      onca.add(dedo)
    }
  }

  const tronco = capsule(0.42, 0.55, GOLD, { roughness: 0.85 })
  tronco.position.set(0, 1.0, -0.05)
  onca.add(tronco)
  // o tronco-cápsula entra na conta como um colar de esferas ao longo do eixo
  for (let k = 0; k <= 4; k++) pele.push({ c: V(0, 0.725 + k * 0.1375, -0.05), r: V(0.42, 0.42, 0.42) })

  pele.push({ ...blob(onca, 0.38, CREAM, [0, 1.1, 0.2], [0.95, 1.15, 0.8]), cream: true })
  for (const side of [-1, 1]) pele.push(blob(onca, 0.21, GOLD, [side * 0.38, 1.38, 0.1]))
  pele.push(blob(onca, 0.3, GOLD, [0, 1.62, 0.02], [1, 0.9, 0.95]))
  pele.push({ ...blob(onca, 0.2, CREAM, [0, 1.58, 0.24], [1, 0.9, 0.7]), cream: true })

  // rosetas espalhadas na pele de fora (semente fixa), sem encostar umas nas outras
  const sr = rng(7)
  const marcas: THREE.Vector3[] = []
  const origem = V(0, 0.95, -0.08)
  for (let i = 0; i < 900 && marcas.length < 46; i++) {
    const d = V(sr() * 2 - 1, sr() * 2 - 1, sr() * 2 - 1)
    if (d.lengthSq() > 1 || d.lengthSq() < 0.05) continue
    d.normalize()
    if (d.z < -0.35) continue
    const h = exitHit(pele, origem, d)
    if (!h || h.cream || h.p.y < 0.2) continue
    if (marcas.some((m) => m.distanceTo(h.p) < 0.15)) continue
    marcas.push(h.p)
    const alto = h.p.y > 1.2
    mark(onca, h.p, h.n, (alto ? 0.04 : 0.052) + sr() * 0.012, !alto || sr() > 0.4)
  }

  // braço esquerdo (tela): pata apoiada na borda do barril
  const ombroE = V(-SHOULDER[0], SHOULDER[1], SHOULDER[2])
  const pulsoE = V(-0.46, TOP + 0.07 - FY, BZ - 0.1 - OZ - 0.06)
  onca.add(limb(ombroE, pulsoE, 0.12, GOLD))
  for (const [t, dx, dy, dz, ring] of [
    [0.18, -1, 0.6, 0.3, true], [0.4, -0.3, 1, 0.5, false], [0.55, -1, 0.3, 0.6, true],
    [0.72, 0.2, 1, 0.4, false], [0.85, -0.9, 0.6, 0.3, false], [0.3, 0.6, 0.8, 0.4, false],
  ] as const) {
    spotLimb(onca, ombroE, pulsoE, 0.12, t, V(dx, dy, dz), ring ? 0.034 : 0.026, ring)
  }
  blob(onca, 0.14, GOLD, [pulsoE.x, pulsoE.y - 0.01, pulsoE.z + 0.06], [1.05, 0.75, 1.2])
  for (let d = 0; d < 4; d++) {
    const dedo = sphere(0.048, GOLD, { roughness: 0.85 }, 16)
    dedo.position.set(pulsoE.x + (d - 1.5) * 0.065, pulsoE.y - 0.03, pulsoE.z + 0.22 - Math.abs(d - 1.5) * 0.03)
    onca.add(dedo)
  }

  // cauda: dá a volta pelo chão à direita, ponta preta erguida
  const caudaCurve = new THREE.CatmullRomCurve3([
    V(0.3, 0.22, -0.5), V(0.8, 0.09, -0.45), V(1.12, 0.09, -0.02),
    V(1.15, 0.09, 0.55), V(1.0, 0.09, 1.08), V(0.78, 0.2, 1.36), V(0.7, 0.42, 1.42),
  ])
  const cpts = caudaCurve.getSpacedPoints(13)
  for (let k = 0; k < cpts.length - 1; k++) {
    const r = 0.085 - k * 0.0025
    onca.add(limb(cpts[k], cpts[k + 1], r, GOLD))
    if (k >= 9) {
      // anéis pretos perto da ponta
      const faixa = anel(r + 0.004, 0.022)
      faixa.position.copy(cpts[k]).lerp(cpts[k + 1], 0.5)
      faixa.quaternion.setFromUnitVectors(V(0, 0, 1), V(0, 0, 0).subVectors(cpts[k + 1], cpts[k]).normalize())
      onca.add(faixa)
    } else if (k >= 1) {
      spotLimb(onca, cpts[k], cpts[k + 1], r, 0.5, V(0, 1, 0.3), 0.035, false)
    }
  }
  const ponta = sphere(0.075, SPOT, { roughness: 0.85 })
  ponta.position.copy(cpts[cpts.length - 1])
  onca.add(ponta)

  // ---- cabeça rosnando --------------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.95, 0.12)
  cabeca.rotation.set(0.04, 0, 0.05)
  onca.add(cabeca)

  const cranio = blob(cabeca, 0.33, GOLD, [0, 0, 0], [1.1, 0.92, 0.95])
  blob(cabeca, 0.13, GOLD, [0, 0.0, 0.24], [0.9, 0.8, 1.2]) // cana do nariz
  for (const side of [-1, 1]) {
    blob(cabeca, 0.105, CREAM, [side * 0.085, -0.1, 0.27], [1, 0.9, 0.9]) // almofadas dos bigodes
    blob(cabeca, 0.14, GOLD, [side * 0.22, -0.08, 0.12], [0.9, 0.9, 0.9]) // bochechas largas

    const orelha = sphere(0.1, GOLD, { roughness: 0.85 })
    orelha.scale.set(1, 0.95, 0.5)
    orelha.position.set(side * 0.255, 0.235, -0.06)
    orelha.rotation.z = -side * 0.3
    cabeca.add(orelha)
    const orelhaIn = sphere(0.062, CREAM, { roughness: 0.85 })
    orelhaIn.scale.set(1, 1, 0.4)
    orelhaIn.position.set(side * 0.255, 0.23, -0.025)
    cabeca.add(orelhaIn)

    const olho = sphere(0.058, '#f6efc4', { roughness: 0.25 })
    olho.scale.z = 0.6
    olho.position.set(side * 0.125, 0.07, 0.272)
    const pupila = sphere(0.03, '#161210', { roughness: 0.2 })
    pupila.position.set(side * 0.118, 0.066, 0.31)
    cabeca.add(olho, pupila)

    // sobrancelha franzida: rosnado
    const sobr = capsule(0.022, 0.1, SPOT, { roughness: 0.85 })
    sobr.position.set(side * 0.13, 0.145, 0.285)
    sobr.rotation.z = Math.PI / 2 + side * 0.45
    cabeca.add(sobr)

    // presas
    const presaC = cone(0.026, 0.1, TOOTH, { roughness: 0.3 })
    presaC.rotation.x = Math.PI
    presaC.position.set(side * 0.075, -0.17, 0.345)
    cabeca.add(presaC)
    const presaB = cone(0.022, 0.07, TOOTH, { roughness: 0.3 })
    presaB.position.set(side * 0.06, -0.265, 0.33)
    cabeca.add(presaB)

    // pintinhas nos bigodes
    for (const [px, py] of [[0.07, -0.08], [0.11, -0.12], [0.13, -0.07]] as const) {
      const p = sphere(0.009, SPOT, { roughness: 0.6 }, 8)
      p.position.set(side * px, py, 0.36 - px * 0.5)
      cabeca.add(p)
    }
  }
  blob(cabeca, 0.055, NOSE, [0, -0.03, 0.375], [1.4, 0.8, 0.9])
  blob(cabeca, 0.13, MOUTH, [0, -0.2, 0.27], [1.05, 0.75, 0.6])
  blob(cabeca, 0.07, TONGUE, [0, -0.25, 0.3], [1.1, 0.4, 1])
  blob(cabeca, 0.11, CREAM, [0, -0.31, 0.2], [1.1, 0.55, 1.0]) // queixo
  for (const d of [[0, 0.62, 0.8], [0.3, 0.75, 0.6], [-0.3, 0.75, 0.6], [0.15, 0.95, 0.3], [-0.15, 0.95, 0.3],
    [0.55, 0.55, 0.62], [-0.55, 0.55, 0.62], [0, 1, -0.1]] as const) {
    spotOn(cabeca, cranio.c, cranio.r, V(d[0], d[1], d[2]), 0.026, false)
  }
  for (const side of [-1, 1]) {
    spotOn(cabeca, cranio.c, cranio.r, V(side * 0.95, 0.05, 0.3), 0.034, false)
    spotOn(cabeca, cranio.c, cranio.r, V(side * 0.85, 0.35, 0.2), 0.03, false)
  }

  // ---- pata direita erguida (pivô no ombro) -----------------------------------
  const pata = new THREE.Group()
  pata.position.set(...SHOULDER)
  pata.rotation.set(RAISED.x, 0, RAISED.z)
  onca.add(pata)

  blob(pata, 0.2, GOLD, [0, 0, 0])
  const bA = V(0, 0, 0)
  const bB = V(0, ARM - 0.1, 0)
  pata.add(limb(bA, bB, 0.115, GOLD))
  for (const [t, dx, dz, ring] of [
    [0.22, 0.2, 1, true], [0.3, 1, 0.3, false], [0.45, -0.7, 0.8, true], [0.58, 0.8, 0.7, false],
    [0.7, -0.2, 1, true], [0.82, 0.9, 0.3, false], [0.88, -0.9, 0.5, false], [0.4, 1, -0.4, true],
  ] as const) {
    spotLimb(pata, bA, bB, 0.115, t, V(dx, 0, dz), ring ? 0.034 : 0.026, ring)
  }
  blob(pata, 0.15, GOLD, [0, ARM, 0], [1.05, 0.95, 0.78])
  for (let d = 0; d < 4; d++) {
    const x = (d - 1.5) * 0.065
    const dedo = sphere(0.052, GOLD, { roughness: 0.85 }, 16)
    dedo.position.set(x, ARM + 0.12 - Math.abs(d - 1.5) * 0.025, 0.03)
    pata.add(dedo)
    const almofada = sphere(0.026, PAD, { roughness: 0.6 }, 16)
    almofada.scale.z = 0.5
    almofada.position.set(x, ARM + 0.12 - Math.abs(d - 1.5) * 0.025, 0.077)
    pata.add(almofada)
  }
  const palma = sphere(0.06, PAD, { roughness: 0.6 })
  palma.scale.set(1.3, 1, 0.45)
  palma.position.set(0, ARM - 0.01, 0.11)
  pata.add(palma)

  // garras: uma grande (a que fatiou) e duas menores
  const garras = new THREE.Group()
  garras.position.set(0, ARM + 0.15, 0.04)
  pata.add(garras)
  for (const [gx, len, rr, rz] of [[-0.08, 0.15, 0.026, 0.2], [0, 0.3, 0.042, 0], [0.08, 0.15, 0.026, -0.2]] as const) {
    const g = cone(rr, len, CLAW, { roughness: 0.3 })
    g.position.set(gx, len / 2 - 0.01, 0)
    g.rotation.set(0.2, 0, rz)
    garras.add(g)
  }

  // ---- a nota nua, fatiada: duas metades ---------------------------------------
  // A impressão é da nota INTEIRA (x de -NW a NW): título, itens e o TOTAL
  // atravessam o meio, então cada metade leva o pedaço dela, cortado no corte.
  const linhas: [number, number, number, number][] = [
    [-0.15, 0.15, 0.265, 0.042], // nome do restaurante
    [-0.09, 0.09, 0.212, 0.014],
    [-0.24, 0.24, 0.17, 0.006],
    [-0.24, 0.07, 0.115, 0.02], [0.15, 0.24, 0.115, 0.02],
    [-0.24, 0.02, 0.06, 0.02], [0.15, 0.24, 0.06, 0.02],
    [-0.24, 0.1, 0.005, 0.02], [0.15, 0.24, 0.005, 0.02],
    [-0.24, -0.03, -0.05, 0.02], [0.15, 0.24, -0.05, 0.02],
    [-0.24, 0.24, -0.11, 0.008],
    [-0.24, 0.24, -0.18, 0.05], // TOTAL, partido ao meio
    [-0.08, 0.08, -0.265, 0.012],
  ]
  const meiaNota = (side: -1 | 1) => {
    const g = new THREE.Group() // pivô no canto de baixo de FORA; pose final: aberta
    g.position.set(side * OPEN_X, TOP, side < 0 ? NZ - 0.05 : NZ + 0.08)
    g.rotation.set(NOTE_TILT, 0, -side * OPEN_LEAN)
    const folha = new THREE.Group()
    folha.position.set(-side * NW / 2, NH / 2, 0)
    g.add(folha)
    folha.add(rbox(NW, NH, 0.014, 0.006, PAPER, { roughness: 0.72 }))
    const cx = (side * NW) / 2 // centro da metade nas coordenadas da nota inteira
    for (const [x0, x1, y, h] of linhas) {
      const a = Math.max(x0, side < 0 ? -NW : 0.006)
      const b = Math.min(x1, side < 0 ? -0.006 : NW)
      if (b - a < 0.01) continue
      const l = rbox(b - a, h, 0.006, 0.002, INK, { roughness: 0.6 })
      l.position.set((a + b) / 2 - cx, y, 0.009)
      folha.add(l)
    }
    // borda do corte ainda brilhando
    // borda do corte em brasa: pivô no topo, corre de cima a baixo com o golpe
    const fio = new THREE.Group()
    fio.position.set(-side * (NW / 2 - 0.004), NH / 2, 0)
    const brasa = rbox(0.012, NH - 0.004, 0.018, 0.004, SLASH, { emissive: '#ffc21a', emissiveIntensity: 1.3 })
    brasa.position.y = -(NH - 0.004) / 2
    fio.add(brasa)
    folha.add(fio)
    return { g, fio }
  }
  const { g: notaE, fio: fioE } = meiaNota(-1)
  const { g: notaD, fio: fioD } = meiaNota(1)
  root.add(notaE, notaD)

  // ---- risco dourado do corte (acento) -----------------------------------------
  const corte = new THREE.Group()
  corte.position.set(0, TOP + 0.37, NZ + 0.03)
  corte.rotation.set(NOTE_TILT, 0, 0.04)
  const risco = sphere(0.5, SLASH, { emissive: '#ffc21a', emissiveIntensity: 1.8, roughness: 0.3 })
  risco.scale.set(0.05, 0.74, 0.025)
  corte.add(risco)
  const halo = translucido(sphere(0.5, SLASH, { emissive: '#ffb000', emissiveIntensity: 1.0 }), 0.3)
  halo.scale.set(0.15, 0.78, 0.02)
  corte.add(halo)
  for (const [fx, fy, fs] of [[0.07, 0.36, 0.03], [-0.06, 0.3, 0.02], [0.05, -0.33, 0.022], [-0.07, 0.12, 0.017]] as const) {
    const faisca = new THREE.Mesh(
      new THREE.OctahedronGeometry(fs),
      new THREE.MeshStandardMaterial({ color: '#fff4c2', emissive: '#ffd34a', emissiveIntensity: 1.6 }),
    )
    faisca.position.set(fx, fy, 0.01)
    faisca.rotation.z = 0.5
    faisca.scale.y = 1.6
    corte.add(faisca)
  }
  root.add(corte)

  // ---- peças ------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cave', object: base },
    { name: 'parede', group: 'cave', object: parede },
    { name: 'barris', group: 'cave', object: barris },
    { name: 'barril', group: 'mesa', object: barril },
    { name: 'tacas', group: 'mesa', object: tacas },
    { name: 'onca', group: 'onca', object: onca },
    { name: 'cabeca', group: 'onca', object: cabeca },
    { name: 'pata', group: 'onca', object: pata },
    { name: 'notaE', group: 'nota', object: notaE },
    { name: 'notaD', group: 'nota', object: notaD },
    { name: 'garras', group: 'garra', object: garras },
    { name: 'fioE', group: 'corte', object: fioE },
    { name: 'fioD', group: 'corte', object: fioD },
    { name: 'corte', group: 'corte', object: corte },
  ]

  // ---- montagem ---------------------------------------------------------------
  const S0 = 0.01
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Jantar romântico na CAVE do restaurante, a adega de pedra: CA-VI! (kan vi)',
    }),
    seq('parede-rise', 'parede', 0.2, 1.0, [riseFrom(0, 3.4)], { ease: 'easeOut' }),
    seq('barris-rise', 'barris', 0.5, 0.8, [riseFrom(0, 1.6)], { ease: 'easeOut' }),

    seq('barril-rise', 'barril', 2.1, 0.8, [riseFrom(FY, 1.2)], {
      ease: 'easeOut',
      caption: 'Um barril em pé vira mesa, com duas taças de tinto. Só vocês dois.',
    }),
    seq('tacas-rise', 'tacas', 2.4, 0.7, [riseFrom(TOP, 1.0)], { ease: 'easeOut' }),

    seq('onca-rise', 'onca', 3.6, 0.9, [riseFrom(FY, 2.6)], {
      ease: 'easeOut',
      caption: 'Do outro lado do barril senta o seu par: uma ONÇA-PINTADA.',
    }),
    seq('pata-apoia', 'pata', 3.8, 0.7, [ch('rotation.x', 2.6, REST.x), ch('rotation.z', REST.z, REST.z)], {
      ease: 'easeOut',
    }),
    seq('cabeca-sobe', 'cabeca', 3.9, 0.7, [ch('position.y', 1.6, 1.95)], { ease: 'easeOut' }),

    seq('notaE-chega', 'notaE', 5.3, 0.8, [ch('position.y', TOP + 1.1, TOP)], {
      ease: 'easeOut',
      caption: 'Chega a NÚ-TAN, a NOTA NUA, sem envelope nem pires (notan). Você já puxa a carteira…',
    }),
    seq('notaD-chega', 'notaD', 5.3, 0.8, [ch('position.y', TOP + 1.1, TOP)], { ease: 'easeOut' }),

    seq('cabeca-rosna', 'cabeca', 6.9, 0.4, [ch('rotation.z', 0, 0.05), ch('rotation.x', 0.15, 0.04)], {
      ease: 'easeOut',
      caption: '…mas a onça rosna e arreganha uma garra só.',
    }),
    seq('pata-ergue', 'pata', 6.9, 0.6, [ch('rotation.x', REST.x, RAISED.x), ch('rotation.z', REST.z, RAISED.z)], {
      ease: 'easeOut',
    }),
    seq('garras-saem', 'garras', 7.3, 0.35, [ch('scale.x', S0, 1), ch('scale.y', S0, 1), ch('scale.z', S0, 1)], {
      ease: 'easeOut',
    }),

    seq('pata-zas', 'pata', 8.4, 0.2, [ch('rotation.x', RAISED.x, SWIPE.x), ch('rotation.z', RAISED.z, SWIPE.z)], {
      ease: 'easeIn',
      caption: 'ZÁS! Fatia a nota de cima a baixo.',
    }),
    seq('corte-risca', 'corte', 8.5, 0.22, [ch('scale.y', S0, 1), ch('position.y', TOP + 0.74, TOP + 0.37)], {
      ease: 'easeOut',
    }),
    seq('fioE-corre', 'fioE', 8.5, 0.25, [ch('scale.y', S0, 1)], { ease: 'easeOut' }),
    seq('fioD-corre', 'fioD', 8.5, 0.25, [ch('scale.y', S0, 1)], { ease: 'easeOut' }),
    seq('pata-volta', 'pata', 8.65, 0.55, [ch('rotation.x', SWIPE.x, RAISED.x), ch('rotation.z', SWIPE.z, RAISED.z)], {
      ease: 'easeOut',
    }),

    seq('notaE-abre', 'notaE', 9.9, 0.8, [ch('position.x', -NW, -OPEN_X), ch('rotation.z', 0, OPEN_LEAN), ch('position.z', NZ, NZ - 0.05)], {
      ease: 'easeOut',
      caption: 'Metade DÊ-LA pra ela, a outra pra você: DÊ-LA, PÔ! (dela på)',
    }),
    seq('notaD-abre', 'notaD', 9.9, 0.8, [ch('position.x', NW, OPEN_X), ch('rotation.z', 0, -OPEN_LEAN), ch('position.z', NZ, NZ + 0.08)], {
      ease: 'easeOut',
    }),

    seq('cabeca-decreta', 'cabeca', 11.5, 0.3, [ch('rotation.x', 0.04, 0.2)], {
      ease: 'easeOut',
      caption: 'Kan vi dela på notan? — Podemos dividir a conta?',
    }),
    seq('cabeca-assenta', 'cabeca', 11.8, 0.4, [ch('rotation.x', 0.2, 0.04)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.7, 5.2], target: [0.0, 1.45, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-vi-dela-pa-notan',
    contexto:
      "Restaurante: no fim do jantar com amigos ou colegas, ao garçom ou entre vocês na mesa. Muitas vezes o garçom pergunta antes: 'Tillsammans eller var för sig?' (juntos ou separado?).",
    fraseFonte: 'Podemos dividir a conta?',
    fraseAlvo: 'Kan vi dela på notan?',
    pronuncia:
      "kan vi DÊ-la pô NÚ-tan ('dela' com Ê FECHADO e longo, força no DÊ; 'på' = pô, ô fechado; 'notan' = NÚ-tan, porque o 'o' sueco longo soa U)",
    ponteSonora:
      "CA-VI DÊ-LA, PÔ! NÚ-TAN? (7 sílabas: ca-vi-DÊ-la-pô-NÚ-tan; tônicas em DÊ e NÚ; CA-VI é o MESMO 'kan vi' de 'Kan vi få notan, tack?': CAVE lido à brasileira, KÁ-vi; lá era a ordem pra toupeira cavar, aqui é a CAVE, a adega do restaurante; DÊ-LA é o 'dela' do português ('metade DELA'), mas com Ê FECHADO e LONGO, de 'você': o português abre em 'déla', o sueco fecha a boca, DÊÊ-la, com a força no DÊ; e é UMA palavra só, o verbo 'dela' (dividir): não é o DÊ solto de 'det' do 'DÊ, PÔ!' de 'Kan du skicka det på mejl?' — aqui o DÊ vem sempre grudado no LA da metade DELA; PÔ é o 'pô!' brasileiro, Ô FECHADO de boca redonda, o mesmo 'på' de 'Grattis på födelsedagen', nunca 'pó'; NÚ-TAN é a mesma NOTA NUA de 'Kan vi få notan, tack?': U FECHADO e longo, TAN com N batido, sem nasal. O par é o perigo: lá a toupeira só TRAZ a nota (FÔ = 'få'); aqui a onça PARTE a nota (DÊ-LA, PÔ = 'dela på'))",
    historia:
      'Jantar romântico na CAVE do restaurante, a adega de pedra, com um barril em pé servindo de mesa. Chega a NOTA NUA, sem envelope nem pires, e você já puxa a carteira pra pagar tudo. A onça-pintada do outro lado do barril rosna, arreganha uma garra só e, ZÁS!, fatia a nota de cima a baixo. Puxa uma metade pra ela, empurra a outra pra você e decreta, de boca fechadinha no Ê: metade DÊ-LA é sua, PÔ! Na Suécia a conta se divide, até no encontro.',
  },
  createScene,
  refine: { organic: ['onca', 'cabeca', 'pata'] },
}

export default card
