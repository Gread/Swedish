import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Vi har gott om tid." — VI... RRÁR! GÓT... ÓMMM... (par)TÍID!
 *
 * O voo pro Havaí só sai às dez da noite, e ainda é meio-dia. O surfista olha
 * o painel da PARTIDA (VI!), ri soprado (RRÁR!), deita a prancha no carpete do
 * saguão, abre um açaí GÓSTOSO (GÓT!) e medita de pernas cruzadas entoando
 * ÓMMM — três anéis dourados de som sobem da boca. O painel nem pisca.
 *
 * Diorama: carpete azul-acinzentado do portão de embarque, janelão de céu
 * azul ao fundo, fileira de cadeiras cinza vazias à esquerda com a mochila
 * verde encostada, painel azul PARTIDA pendurado à direita.
 */

const RIM = '#353c48'
const CARPET = '#62738b'
const CARPET_LINE = '#56677e'
const SKY = '#a6d6f2'
const FRAME = '#4c5562'
const CHAIR = '#9aa1ab'
const CHAIR_DARK = '#6d747e'
const METAL = '#858d96'
const PANEL = '#2a5aa6'
const WHITE = '#f8f7f2'
const BOARD = '#f2d36a'
const STRIPE = '#d4493b'
const SHIRT = '#f4f1ea'
const SKIN = '#d9a27b'
const HAIR = '#f4dc86'
const SHORTS = '#2f6db6'
const PINK = '#f29bb8'
const ACAI = '#5a2456'
const COCO = '#8a5a35'
const BANANA = '#f3e4ac'
const PACK = '#4f8a4b'
const PACK_DARK = '#3d6e3a'
const LASH = '#4a3426'
const GOLD = '#ffb81c' // acento saturado RESERVADO: os anéis do ÓMMM

const GY = 0.18 // topo do carpete
const BOARD_Z = 0.42
const BOARD_TOP = GY + 0.07
const SURF_Y = BOARD_TOP - 0.01
const SURF_Z = 0.28
const SURF_S = 1.22
const PANEL_POS: [number, number, number] = [1.18, 2.32, -0.7]

// anéis do mantra: sobem da boca para a esquerda, cada vez maiores
const MOUTH: [number, number, number] = [0, SURF_Y + 0.92 * SURF_S, SURF_Z + 0.3 * SURF_S]
const RINGS: { r: number; pos: [number, number, number] }[] = [
  { r: 0.1, pos: [-0.5, 1.5, 0.7] },
  { r: 0.145, pos: [-0.86, 1.8, 0.6] },
  { r: 0.19, pos: [-1.26, 2.13, 0.5] },
]

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b — coxas, canelas, pés. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, rough = 0.8) {
  const dir = b.clone().sub(a)
  const m = capsule(r, dir.length(), color, { roughness: rough })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize())
  return m
}

/** Arco de toro (letras, sorriso, cílios). Começa em +x e gira no sentido anti-horário. */
function arc(r: number, tube: number, angle: number, color: string, rough = 0.5) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 10, 32, angle),
    mat(color, { roughness: rough, size: r * 2 }),
  )
  m.castShadow = true
  m.receiveShadow = true
  return m
}

// ---- letras de traço grosso do painel ---------------------------------------
const LH = 0.22
const LT = 0.038

function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.008, WHITE, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

function seg(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  return stroke(LT, Math.hypot(dx, dy) + LT * 0.3, (x1 + x2) / 2, (y1 + y2) / 2, Math.atan2(-dx, dy))
}

function bowl(cx: number, cy: number, r: number) {
  const a = arc(r, LT / 2, Math.PI, WHITE)
  a.position.set(cx, cy, 0)
  a.rotation.z = -Math.PI / 2
  return a
}

type Glyph = 'P' | 'A' | 'R' | 'T' | 'I' | 'D'
const GLYPH_W: Record<Glyph, number> = { P: 0.135, A: 0.155, R: 0.14, T: 0.15, I: LT, D: 0.15 }

function letter(which: Glyph) {
  const g = new THREE.Group()
  const W = GLYPH_W[which]
  const x0 = -W / 2 + LT / 2
  if (which === 'P' || which === 'R') {
    g.add(stroke(LT, LH, x0, 0))
    const rb = 0.052
    const top = LH / 2 - LT / 2
    const cx = W / 2 - LT / 2 - rb
    for (const y of [top, top - 2 * rb]) g.add(stroke(cx - x0 + 0.01, LT, (x0 + cx) / 2, y))
    g.add(bowl(cx, top - rb, rb))
    if (which === 'R') g.add(seg(cx - 0.012, top - 2 * rb, W / 2 - LT / 2, -LH / 2 + LT * 0.2))
  } else if (which === 'A') {
    g.add(seg(-W / 2 + LT / 2, -LH / 2 + LT * 0.2, 0, LH / 2 - LT * 0.2))
    g.add(seg(0, LH / 2 - LT * 0.2, W / 2 - LT / 2, -LH / 2 + LT * 0.2))
    g.add(stroke(W * 0.48, LT * 0.85, 0, -0.035))
  } else if (which === 'T') {
    g.add(stroke(W, LT, 0, LH / 2 - LT / 2))
    g.add(stroke(LT, LH, 0, 0))
  } else if (which === 'I') {
    g.add(stroke(LT, LH, 0, 0))
  } else {
    g.add(stroke(LT, LH, x0, 0))
    const r = LH / 2 - LT / 2
    const cx = W / 2 - LT / 2 - r
    const d = bowl(Math.max(cx, x0 + 0.004), 0, r)
    g.add(d)
  }
  return g
}

/** Contorno da prancha (x = comprimento, y = largura): rabeta redonda, bico fino. */
function surfboardGeometry(L: number, W: number) {
  const s = new THREE.Shape()
  s.moveTo(-L / 2, 0)
  s.quadraticCurveTo(-L / 2, W * 0.42, -L / 2 + W * 0.45, W * 0.46)
  s.bezierCurveTo(-L * 0.1, W * 0.52, L * 0.22, W * 0.5, L / 2, 0)
  s.bezierCurveTo(L * 0.22, -W * 0.5, -L * 0.1, -W * 0.52, -L / 2 + W * 0.45, -W * 0.46)
  s.quadraticCurveTo(-L / 2, -W * 0.42, -L / 2, 0)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.03,
    bevelSegments: 4,
    curveSegments: 28,
  })
  geo.rotateX(-Math.PI / 2) // largura → -z, espessura → +y
  geo.translate(0, 0.02, 0)
  return geo
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- base: carpete azul-acinzentado do saguão ----------------------------
  const base = new THREE.Group()

  const rim = cylinder(2.62, 2.72, 0.12, RIM, { roughness: 0.8 })
  rim.position.y = 0.06
  base.add(rim)

  const carpet = cylinder(2.56, 2.6, 0.06, CARPET, { roughness: 0.97 })
  carpet.position.y = 0.15
  base.add(carpet)

  // juntas das placas de carpete: grade fina, cordas do círculo
  for (const k of [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8]) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - k * k, 0.01))
    const lx = rbox(len, 0.012, 0.03, 0.005, CARPET_LINE, { roughness: 0.97 })
    lx.position.set(0, GY + 0.002, k)
    base.add(lx)
    const lz = rbox(0.03, 0.012, len, 0.005, CARPET_LINE, { roughness: 0.97 })
    lz.position.set(k, GY + 0.002, 0)
    base.add(lz)
  }

  // chinelos largados no carpete (o surfista já está descalço)
  const chinelos = new THREE.Group()
  chinelos.position.set(1.6, GY, 0.62)
  chinelos.rotation.y = -0.5
  for (const s of [-1, 1]) {
    const sole = rbox(0.13, 0.03, 0.3, 0.03, '#2f7f8f', { roughness: 0.7 })
    sole.position.set(s * 0.09, 0.015, s * 0.03)
    sole.rotation.y = s * 0.12
    chinelos.add(sole)
    for (const t of [-1, 1]) {
      const strap = capsule(0.012, 0.1, WHITE, { roughness: 0.6 })
      strap.position.set(s * 0.09 + t * 0.03, 0.045, s * 0.03 + 0.02)
      strap.rotation.set(0.6, 0, t * 0.9)
      chinelos.add(strap)
    }
  }
  base.add(chinelos)

  root.add(base)

  // ---- janelão ao fundo: céu azul com duas nuvens --------------------------
  const janela = new THREE.Group()
  const WZ = -1.85
  const sill = rbox(3.8, 0.34, 0.32, 0.05, FRAME, { roughness: 0.6 })
  sill.position.set(0, GY + 0.17, WZ)
  janela.add(sill)

  const glass = rbox(3.6, 2.3, 0.04, 0.02, SKY, {
    roughness: 0.35, emissive: SKY, emissiveIntensity: 0.35,
  })
  glass.position.set(0, GY + 0.34 + 1.15, WZ - 0.04)
  janela.add(glass)

  const topBar = rbox(3.8, 0.13, 0.22, 0.04, FRAME, { roughness: 0.55 })
  topBar.position.set(0, GY + 0.34 + 2.3, WZ)
  janela.add(topBar)
  for (const x of [-1.84, -0.95, 0.95, 1.84]) {
    const post = rbox(Math.abs(x) > 1.5 ? 0.14 : 0.07, 2.32, 0.16, 0.02, FRAME, { roughness: 0.55 })
    post.position.set(x, GY + 0.34 + 1.15, WZ)
    janela.add(post)
  }

  for (const [cx, cy, s, seed] of [[-0.35, 2.42, 0.2, 5], [0.55, 1.62, 0.15, 9]] as const) {
    const cloud = puff(s, '#ffffff', 6, seed, { roughness: 0.9 })
    cloud.position.set(cx, cy, WZ + 0.02)
    cloud.scale.set(1.8, 0.75, 0.35)
    janela.add(cloud)
  }

  // avião estacionado lá fora: fuselagem com janelinhas e a cauda azul
  const aviao = new THREE.Group()
  aviao.position.set(1.32, GY + 0.62, WZ + 0.01)
  const fuselage = capsule(0.13, 0.78, '#eef1f4', { roughness: 0.4 })
  fuselage.rotation.z = Math.PI / 2
  fuselage.scale.z = 0.3
  aviao.add(fuselage)
  for (let i = 0; i < 6; i++) {
    const win = rbox(0.035, 0.045, 0.02, 0.012, '#3d4a5a', { roughness: 0.3 })
    win.position.set(-0.3 + i * 0.09, 0.03, 0.04)
    aviao.add(win)
  }
  const fin = rbox(0.24, 0.4, 0.03, 0.04, '#eef1f4', { roughness: 0.4 })
  fin.position.set(0.36, 0.25, 0)
  fin.rotation.z = -0.42
  aviao.add(fin)
  const finStripe = rbox(0.17, 0.09, 0.04, 0.02, PANEL, { roughness: 0.4 })
  finStripe.position.set(0.41, 0.33, 0)
  finStripe.rotation.z = -0.42
  aviao.add(finStripe)
  const wing = rbox(0.34, 0.035, 0.03, 0.015, '#d5dbe1', { roughness: 0.4 })
  wing.position.set(0.0, -0.07, 0.03)
  wing.rotation.z = 0.12
  aviao.add(wing)
  janela.add(aviao)

  root.add(janela)

  // ---- fileira de três cadeiras de espera, vazias --------------------------
  const cadeiras = new THREE.Group()
  cadeiras.position.set(-1.38, GY, -1.0)
  cadeiras.rotation.y = 0.32

  const beam = rbox(1.6, 0.06, 0.09, 0.025, METAL, { roughness: 0.35, metalness: 0.7 })
  beam.position.set(0, 0.32, -0.02)
  cadeiras.add(beam)
  for (const lx of [-0.62, 0.62]) {
    const leg = rbox(0.06, 0.32, 0.06, 0.02, METAL, { roughness: 0.35, metalness: 0.7 })
    leg.position.set(lx, 0.16, -0.02)
    cadeiras.add(leg)
    const foot = rbox(0.09, 0.035, 0.46, 0.015, CHAIR_DARK, { roughness: 0.5, metalness: 0.5 })
    foot.position.set(lx, 0.018, -0.02)
    cadeiras.add(foot)
  }
  for (let i = -1; i <= 1; i++) {
    const seat = rbox(0.46, 0.08, 0.42, 0.04, CHAIR, { roughness: 0.6 })
    seat.position.set(i * 0.52, 0.42, 0.02)
    cadeiras.add(seat)
    const back = rbox(0.46, 0.5, 0.07, 0.04, CHAIR, { roughness: 0.6 })
    back.position.set(i * 0.52, 0.72, -0.2)
    back.rotation.x = -0.12
    cadeiras.add(back)
  }
  for (const ax of [-0.78, -0.26, 0.26, 0.78]) {
    const armrest = rbox(0.06, 0.05, 0.36, 0.022, CHAIR_DARK, { roughness: 0.5 })
    armrest.position.set(ax, 0.6, 0.0)
    cadeiras.add(armrest)
    const strut = rbox(0.04, 0.16, 0.04, 0.015, METAL, { roughness: 0.35, metalness: 0.7 })
    strut.position.set(ax, 0.51, 0.1)
    cadeiras.add(strut)
  }
  root.add(cadeiras)

  // ---- mochila verde cheia de adesivos, encostada nas cadeiras -------------
  const mochila = new THREE.Group()
  mochila.position.set(-1.24, GY, -0.55)
  mochila.rotation.set(0, 0.32, 0)

  const packBody = rbox(0.42, 0.56, 0.26, 0.11, PACK, { roughness: 0.85 })
  packBody.position.set(0, 0.28, 0)
  packBody.rotation.x = -0.14
  mochila.add(packBody)
  const pocket = rbox(0.32, 0.24, 0.1, 0.06, PACK_DARK, { roughness: 0.85 })
  pocket.position.set(0, 0.18, 0.14)
  pocket.rotation.x = -0.14
  mochila.add(pocket)
  const zip = rbox(0.26, 0.016, 0.02, 0.006, '#c9cfc4', { roughness: 0.4, metalness: 0.5 })
  zip.position.set(0, 0.29, 0.205)
  zip.rotation.x = -0.14
  mochila.add(zip)
  const handle = torus(0.06, 0.016, PACK_DARK, { roughness: 0.8 })
  handle.position.set(0, 0.6, -0.04)
  mochila.add(handle)
  // adesivos: discos e retângulos coloridos na frente
  const stickers: [number, number, string, 'disc' | 'rect'][] = [
    [-0.12, 0.45, '#f4f1ea', 'disc'], [0.11, 0.48, '#e86b4f', 'rect'],
    [-0.02, 0.38, '#7fc4e8', 'disc'], [0.12, 0.36, PINK, 'disc'],
    [-0.11, 0.17, '#f4f1ea', 'rect'], [0.1, 0.13, '#f0a13a', 'disc'],
  ]
  for (const [sx, sy, color, kind] of stickers) {
    const st = kind === 'disc'
      ? cylinder(0.04, 0.04, 0.012, color, { roughness: 0.5 })
      : rbox(0.08, 0.055, 0.012, 0.008, color, { roughness: 0.5 })
    if (kind === 'disc') st.rotation.x = Math.PI / 2 - 0.14
    else st.rotation.set(-0.14, 0, (rand() - 0.5) * 0.6)
    const onPocket = sy < 0.3
    st.position.set(sx, sy, onPocket ? 0.195 : 0.14 - (sy - 0.28) * 0.14)
    mochila.add(st)
  }
  root.add(mochila)

  // ---- painel azul PARTIDA, pendurado --------------------------------------
  const painel = new THREE.Group()
  painel.position.set(...PANEL_POS)
  painel.rotation.y = -0.24

  const glyphs: Glyph[] = ['P', 'A', 'R', 'T', 'I', 'D', 'A']
  const GAP = 0.05
  const textW = glyphs.reduce((s, g) => s + GLYPH_W[g], 0) + GAP * (glyphs.length - 1)
  const plate = rbox(textW + 0.3, 0.44, 0.08, 0.04, PANEL, { roughness: 0.45 })
  painel.add(plate)
  const trim = rbox(textW + 0.36, 0.5, 0.05, 0.05, '#23272e', { roughness: 0.5 })
  trim.position.z = -0.025
  painel.add(trim)
  let cursor = -textW / 2
  for (const g of glyphs) {
    const l = letter(g)
    l.position.set(cursor + GLYPH_W[g] / 2, 0, 0.05)
    painel.add(l)
    cursor += GLYPH_W[g] + GAP
  }
  for (const side of [-1, 1]) {
    const rod = cylinder(0.016, 0.016, 1.3, METAL, { roughness: 0.35, metalness: 0.7 })
    rod.position.set(side * (textW / 2 + 0.02), 0.25 + 0.65, -0.01)
    painel.add(rod)
  }
  root.add(painel)

  // ---- prancha amarela com faixa vermelha, deitada no carpete --------------
  const prancha = new THREE.Group()
  prancha.position.set(0, GY, BOARD_Z)
  prancha.rotation.y = 0.06
  const PL = 2.35
  const PW = 0.74
  const board = new THREE.Mesh(surfboardGeometry(PL, PW), mat(BOARD, { roughness: 0.3, size: PL }))
  board.castShadow = true
  board.receiveShadow = true
  prancha.add(board)
  const stripe = rbox(PL * 0.86, 0.008, 0.07, 0.004, STRIPE, { roughness: 0.35 })
  stripe.position.set(0.02, 0.071, 0)
  prancha.add(stripe)
  for (const s of [-1, 1]) {
    const pin = rbox(PL * 0.5, 0.008, 0.025, 0.004, STRIPE, { roughness: 0.35 })
    pin.position.set(0.32, 0.071, s * 0.1)
    prancha.add(pin)
  }
  // cordinha (leash) enrolada na rabeta
  const leash = torus(0.09, 0.013, '#2b2f36', { roughness: 0.5 })
  leash.rotation.x = Math.PI / 2
  leash.position.set(-PL / 2 - 0.08, 0.02, -0.12)
  prancha.add(leash)
  const plug = cylinder(0.025, 0.025, 0.02, '#2b2f36', { roughness: 0.5 })
  plug.position.set(-PL / 2 + 0.12, 0.072, 0)
  prancha.add(plug)
  root.add(prancha)

  // ---- surfista sentado de pernas cruzadas (+z = frente) --------------------
  const surfista = person({ body: SHIRT, skin: SKIN, height: 1.5, armAngle: 0.3 })
  surfista.position.set(0, SURF_Y, SURF_Z)
  surfista.scale.setScalar(SURF_S)

  // regata: braços de pele
  for (const n of ['armL', 'armR']) {
    const arm = surfista.getObjectByName(n) as THREE.Mesh
    arm.material = mat(SKIN, { roughness: 0.6, size: 0.4 })
  }

  // bermuda florida azul: quadril + coxas até o joelho
  const shorts = lathe(
    [[0, 0.0], [0.24, 0.0], [0.275, 0.05], [0.282, 0.14], [0.27, 0.24], [0, 0.24]],
    SHORTS,
    { roughness: 0.75 },
  )
  surfista.add(shorts)
  const waist = torus(0.272, 0.022, '#24589a', { roughness: 0.75 })
  waist.rotation.x = Math.PI / 2
  waist.position.y = 0.235
  surfista.add(waist)

  const knees: THREE.Vector3[] = []
  for (const s of [-1, 1]) {
    const hip = V(s * 0.14, 0.13, 0.06)
    const knee = V(s * 0.43, 0.1, 0.36)
    knees.push(knee)
    surfista.add(limb(hip, knee, 0.112, SHORTS, 0.75))
    const cuff = torus(0.105, 0.02, '#24589a', { roughness: 0.75 })
    cuff.position.copy(knee).lerp(hip, 0.05)
    cuff.quaternion.setFromUnitVectors(V(0, 0, 1), knee.clone().sub(hip).normalize())
    surfista.add(cuff)
  }
  // canelas cruzadas: a esquerda passa por cima/na frente da direita
  const ankleL = V(0.24, 0.13, 0.54)
  const ankleR = V(-0.24, 0.07, 0.3)
  surfista.add(limb(V(-0.41, 0.1, 0.4), ankleL, 0.074, SKIN, 0.6))
  surfista.add(limb(V(0.41, 0.08, 0.38), ankleR, 0.074, SKIN, 0.6))
  for (const [ankle, s] of [[ankleL, 1], [ankleR, -1]] as const) {
    const foot = limb(ankle, ankle.clone().add(V(s * 0.15, 0.03, -0.04)), 0.06, SKIN, 0.6)
    surfista.add(foot)
    for (let k = 0; k < 4; k++) {
      const toe = sphere(0.022, SKIN, { roughness: 0.6 })
      toe.position.copy(ankle).add(V(s * (0.22 + 0.008 * k), 0.06 - k * 0.022, -0.035 + k * 0.012))
      surfista.add(toe)
    }
  }

  // flores da bermuda: discos brancos e rosas sobre o azul
  const flowers: [number, number, number, string][] = [
    [-0.3, 0.18, 0.26, WHITE], [0.28, 0.2, 0.25, PINK], [-0.2, 0.2, 0.13, PINK],
    [0.18, 0.21, 0.15, WHITE], [0.0, 0.17, 0.25, WHITE], [-0.42, 0.2, 0.36, PINK],
    [0.43, 0.2, 0.36, WHITE],
  ]
  for (const [fx, fy, fz, color] of flowers) {
    const petal = cylinder(0.032, 0.032, 0.012, color, { roughness: 0.6 })
    petal.position.set(fx, fy, fz)
    petal.rotation.x = 0.35
    surfista.add(petal)
    const center = sphere(0.012, '#f6c945', { roughness: 0.6 })
    center.position.set(fx, fy + 0.008, fz + 0.002)
    surfista.add(center)
  }

  // colar de conchinhas
  const necklace = torus(0.2, 0.016, '#f2ece0', { roughness: 0.4 })
  necklace.rotation.x = Math.PI / 2 + 0.45
  necklace.position.set(0, 0.74, 0.04)
  surfista.add(necklace)

  root.add(surfista)

  // ---- cabeça: cabelo descolorido arrepiado, olhos fechados, sorriso -------
  const cabeca = surfista.getObjectByName('head') as THREE.Group
  const HR = 1.5 * 0.19
  // tira os olhos abertos de person(): o surfista medita de olhos fechados
  for (const c of [...cabeca.children]) {
    if (c !== cabeca.children[0]) cabeca.remove(c)
  }
  for (const s of [-1, 1]) {
    const lid = sphere(HR * 0.21, SKIN, { roughness: 0.55 })
    lid.position.set(s * HR * 0.38, HR * 0.12, HR * 0.8)
    lid.scale.z = 0.55
    cabeca.add(lid)
    const lash = arc(0.045, 0.011, Math.PI * 0.8, LASH, 0.4)
    lash.position.set(s * HR * 0.38, HR * 0.1, HR * 0.93)
    lash.rotation.z = -Math.PI / 2 - Math.PI * 0.4
    cabeca.add(lash)
  }
  const smile = arc(0.075, 0.013, Math.PI * 0.7, '#7a3b2e', 0.4)
  smile.position.set(0, -HR * 0.33, HR * 0.9)
  smile.rotation.set(-0.3, 0, -Math.PI / 2 - Math.PI * 0.35)
  cabeca.add(smile)

  const cap = sphere(HR * 1.04, HAIR, { roughness: 0.75 })
  cap.scale.set(1.02, 0.62, 1.0)
  cap.position.set(0, HR * 0.42, -HR * 0.12)
  cabeca.add(cap)
  const spikeDirs: [number, number][] = [
    [0, 1.35], [0.9, 1.0], [-0.9, 1.0], [1.7, 0.75], [-1.7, 0.75], [2.4, 0.95], [-2.4, 0.95],
    [3.14, 0.85], [0.45, 0.5], [-0.45, 0.5], [1.2, 0.35], [-1.2, 0.35],
  ]
  const capCenter = V(0, HR * 0.42, -HR * 0.12)
  for (const [az, el] of spikeDirs) {
    const dir = V(Math.sin(az) * Math.cos(el), Math.sin(el) + 0.25, Math.cos(az) * Math.cos(el)).normalize()
    const spike = cone(0.06, 0.2 + rand() * 0.05, HAIR, { roughness: 0.75 })
    spike.position.copy(capCenter).add(dir.clone().multiply(V(HR * 0.95, HR * 0.62, HR * 0.95)))
    spike.quaternion.setFromUnitVectors(V(0, 1, 0), dir)
    cabeca.add(spike)
  }
  // franja: tufos curtos saindo da testa, quebrando a borda do topete
  for (const fx of [-0.17, -0.06, 0.06, 0.17]) {
    const tuft = cone(0.055, 0.16, HAIR, { roughness: 0.75 })
    tuft.position.set(fx, HR * 0.5, HR * 0.72)
    tuft.quaternion.setFromUnitVectors(V(0, 1, 0), V(fx * 1.6, 0.75, 0.62).normalize())
    cabeca.add(tuft)
  }
  cabeca.rotation.set(-0.08, 0, 0.06) // pose final: rosto sereno, levemente erguido

  // ---- braços: apontam o painel e depois seguram a tigela -------------------
  const bracoL = surfista.getObjectByName('armL') as THREE.Object3D
  const bracoR = surfista.getObjectByName('armR') as THREE.Object3D
  shoulderPivot(bracoL, 1.5)
  shoulderPivot(bracoR, 1.5)
  // pose final: mãos pousadas nos joelhos, postura de meditação
  const ARM_X = -0.6
  const ARM_Z = 0.3
  bracoL.rotation.set(ARM_X, 0, -ARM_Z)
  bracoR.rotation.set(ARM_X, 0, ARM_Z)

  // ---- tigela de açaí (casca de coco) no colo -------------------------------
  const acai = new THREE.Group()
  acai.position.set(0, 0.17, 0.42)
  acai.scale.setScalar(1.12)
  const shell = lathe(
    [[0, 0], [0.07, 0], [0.13, 0.03], [0.16, 0.08], [0.168, 0.125], [0.152, 0.13], [0.145, 0.09], [0, 0.09]],
    COCO,
    { roughness: 0.8 },
  )
  acai.add(shell)
  const fill = sphere(0.15, ACAI, { roughness: 0.55 })
  fill.scale.set(1, 0.32, 1)
  fill.position.y = 0.115
  acai.add(fill)
  for (const [bx, bz] of [[-0.06, 0.04], [0.02, 0.07], [0.07, -0.01], [-0.02, -0.05]] as const) {
    const slice = cylinder(0.034, 0.034, 0.016, BANANA, { roughness: 0.6 })
    slice.position.set(bx, 0.16, bz)
    slice.rotation.set(0.25 + bz, 0, -bx * 2)
    acai.add(slice)
  }
  for (let i = 0; i < 7; i++) {
    const granola = sphere(0.013, '#b98a4c', { roughness: 0.8 }, 8)
    const a = rand() * Math.PI * 2
    const r = 0.04 + rand() * 0.08
    granola.position.set(Math.cos(a) * r, 0.158, Math.sin(a) * r)
    acai.add(granola)
  }
  surfista.add(acai)

  // ---- três anéis dourados de som (ÓMMM) -----------------------------------
  const aneis = RINGS.map(({ r, pos }) => {
    const ring = torus(r, 0.028, GOLD, {
      roughness: 0.3, metalness: 0.5, emissive: GOLD, emissiveIntensity: 0.55,
    })
    ring.position.set(...pos)
    ring.rotation.set(0.1, 0.35, 0)
    root.add(ring)
    return ring
  })

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'saguao', object: base },
    { name: 'janela', group: 'saguao', object: janela },
    { name: 'cadeiras', group: 'saguao', object: cadeiras },
    { name: 'mochila', group: 'saguao', object: mochila },
    { name: 'prancha', group: 'surfista', object: prancha },
    { name: 'surfista', group: 'surfista', object: surfista },
    { name: 'cabeca', group: 'surfista', object: cabeca },
    { name: 'bracoL', group: 'surfista', object: bracoL },
    { name: 'bracoR', group: 'surfista', object: bracoR },
    { name: 'painel', group: 'painel', object: painel },
    { name: 'acai', group: 'acai', object: acai },
    { name: 'anel1', group: 'mantra', object: aneis[0] },
    { name: 'anel2', group: 'mantra', object: aneis[1] },
    { name: 'anel3', group: 'mantra', object: aneis[2] },
  ]

  // ---- montagem ------------------------------------------------------------
  const ringIn = (i: number, at: number, caption?: string) => {
    const { pos } = RINGS[i]
    return seq(`anel${i + 1}-sobe`, `anel${i + 1}`, at, 0.75, [
      ch('position.x', MOUTH[0], pos[0]), ch('position.y', MOUTH[1], pos[1]), ch('position.z', MOUTH[2], pos[2]),
      ch('scale.x', 0.2, 1), ch('scale.y', 0.2, 1), ch('scale.z', 0.2, 1),
    ], { ease: 'easeOut', caption })
  }

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Meio-dia no portão de embarque — e o voo pro Havaí só sai às dez da noite…',
    }),
    seq('janela-rise', 'janela', 0.25, 0.9, [riseFrom(0, 2.8)], { ease: 'easeOut' }),
    seq('cadeiras-rise', 'cadeiras', 0.7, 0.7, [riseFrom(GY, 1.0)], { ease: 'easeOut' }),
    seq('mochila-cai', 'mochila', 1.1, 0.6, [
      ch('position.y', GY + 0.9, GY), ch('rotation.z', 0.5, 0),
    ], { ease: 'easeIn' }),

    // a prancha tomba de pé para deitada; o surfista cai sentado em cima dela
    seq('prancha-deita', 'prancha', 2.0, 0.7, [
      ch('position.y', GY + 1.0, GY), ch('rotation.z', 1.35, 0),
    ], { ease: 'easeIn', caption: 'Chega o surfista, deita a prancha no carpete e olha o painel…' }),
    seq('surfista-senta', 'surfista', 2.45, 0.55, [ch('position.y', SURF_Y + 1.1, SURF_Y)], { ease: 'easeIn' }),
    seq('cabeca-olha', 'cabeca', 2.45, 0.6, [ch('rotation.y', 0, 0.6), ch('rotation.x', 0, -0.35)], { ease: 'easeOut' }),
    seq('bracoL-repouso', 'bracoL', 2.45, 0.5, [ch('rotation.z', -ARM_Z, -ARM_Z)]),
    seq('bracoR-aponta', 'bracoR', 2.6, 0.6, [ch('rotation.z', ARM_Z, 2.25)], { ease: 'easeOut' }),

    seq('painel-desce', 'painel', 3.1, 0.75, [
      ch('position.y', PANEL_POS[1] + 1.6, PANEL_POS[1]), ch('rotation.z', 0.25, 0),
    ], { ease: 'easeOut', caption: 'PARTIDA: só às dez da noite. Ele VI!' }),

    // risada soprada: o corpo sacode
    seq('surfista-ri-a', 'surfista', 4.4, 0.18, [ch('position.y', SURF_Y, SURF_Y + 0.07)], {
      ease: 'easeOut',
      caption: 'Solta uma risada soprada — RRÁR! — e desiste da pressa.',
    }),
    seq('surfista-ri-b', 'surfista', 4.58, 0.18, [ch('position.y', SURF_Y + 0.07, SURF_Y)], { ease: 'easeIn' }),
    seq('surfista-ri-c', 'surfista', 4.76, 0.18, [ch('position.y', SURF_Y, SURF_Y + 0.05)], { ease: 'easeOut' }),
    seq('surfista-ri-d', 'surfista', 4.94, 0.2, [ch('position.y', SURF_Y + 0.05, SURF_Y)], { ease: 'easeIn' }),
    seq('bracoR-desce', 'bracoR', 4.5, 0.6, [ch('rotation.z', 2.25, ARM_Z)], { ease: 'easeInOut' }),
    seq('cabeca-volta', 'cabeca', 4.6, 0.7, [
      ch('rotation.y', 0.6, 0), ch('rotation.x', -0.35, -0.08), ch('rotation.z', 0, 0.06),
    ], { ease: 'easeInOut' }),

    seq('acai-surge', 'acai', 6.0, 0.6, [
      ch('scale.x', 0.01, 1.12), ch('scale.y', 0.01, 1.12), ch('scale.z', 0.01, 1.12),
      ch('position.y', 0.55, 0.17),
    ], { ease: 'easeOut', caption: 'Cruza as pernas na prancha e abre um açaí GÓSTOSO — GÓT!' }),

    seq('bracoL-joelho', 'bracoL', 7.3, 0.6, [ch('rotation.x', 0, ARM_X)], { ease: 'easeInOut' }),
    seq('bracoR-joelho', 'bracoR', 7.3, 0.6, [ch('rotation.x', 0, ARM_X)], { ease: 'easeInOut' }),
    ringIn(0, 7.6, 'Mãos nos joelhos, olhos fechados, ele entoa o mantra: ÓMMM…'),
    ringIn(1, 8.0),
    ringIn(2, 8.4),

    seq('painel-nem-pisca', 'painel', 9.6, 0.6, [ch('rotation.y', -0.24, -0.24)], {
      caption: 'E o painel da parTÍDa nem pisca — TIID! Calma: tempo de sobra.',
    }),
    seq('anel3-pulsa', 'anel3', 9.7, 0.5, [ch('scale.x', 1, 1.12), ch('scale.y', 1, 1.12)], { ease: 'easeOut' }),
    seq('anel3-volta', 'anel3', 10.2, 0.5, [ch('scale.x', 1.12, 1), ch('scale.y', 1.12, 1)], { ease: 'easeIn' }),

    seq('surfista-respira', 'surfista', 11.2, 0.8, [ch('scale.y', SURF_S * 1.02, SURF_S)], {
      ease: 'easeInOut',
      caption: 'Vi har gott om tid. — Temos tempo de sobra.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 2.05, 4.3], target: [0.0, 1.28, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vi-har-gott-om-tid',
    contexto: 'Acalmando alguém apressado: aeroporto, estação, saindo pra um compromisso.',
    fraseFonte: 'Temos tempo de sobra.',
    fraseAlvo: 'Vi har gott om tid.',
    pronuncia:
      "vi rrár GÓT om TIID ('vi' com I limpo e longo; 'har' com h soprado tipo RR carioca, A longo e R brando — na fala rápida muito sueco engole esse R ('vi ha'), mas fale; 'gott' com G duro de 'gato', Ó ABERTO e CURTO e T seco, que já emenda no 'om': GÓ-tom; 'om' com Ó aberto curtinho e M de lábios fechados, sem força; 'tid' com T seco (nunca 'tchi'), I LONGO e D leve; a força cai no GOTT e no TID)",
    ponteSonora:
      "VI... RRÁR! GÓT... ÓMMM... (par)TÍID! (5 sílabas: vi-rrár-GÓT-om-TIID; força no GÓT e no TIID; VI = o 'eu VI' do português, o MESMO VI de 'Vi ses!' (VI SEIS) e 'Vi hörs!': I limpo e longo; RRÁR = o MESMO RRÁR de 'Jag har ont i magen' e 'Har du tid en stund?': a risada soprada, h como RR carioca leve, A longo e R final BRANDO e audível — sem ele sobra 'ha', outro verbo; GÓT = o MESMO GÓT de 'Sov gott!' e 'Det var jättegott': o começo de GÓSTOSO, com G duro de 'gato', Ó ABERTO e CURTO, e um T seco no lugar do resto — nunca 'GÓ-tchi'; esse T já emenda no mantra: GÓ-tóm; ÓM = o MESMO ÓM do lutador de sumô de 'Jag kommer om fem minuter': Ó aberto curtinho, igual ao do GÓT, e os LÁBIOS FECHANDO no M — nunca o 'ũ' nasal de 'um'; o zumbido do M pode durar, mas a vogal fica curta e sem força; TIID = o parTÍD(a) de 'Jag skulle vilja boka en tid', 'Har du tid en stund?' e 'Smaklig måltid', a mesma ponte de 'tid': só o pedaço forte — T SECO de 'tatu', nunca 'tchi', I LONGO e D leve)",
    historia:
      "O voo pro Havaí só sai às dez da noite, e ainda é meio-dia. O surfista olha o painel do portão de embarque — VI! —, solta uma risada soprada, RRÁR!, e desiste da pressa: deita a prancha no carpete do saguão, abre uma tigela de açaí GÓSTOSO — GÓT! —, cruza as pernas em cima da prancha e entoa o mantra: ÓMMM... O painel da parTÍDa nem pisca. Calma: temos tempo de sobra.",
  },
  createScene,
}

export default card
