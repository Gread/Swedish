import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, mat, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Jag har fått ett brev från Skatteverket." — IÁ, RRÁR! FÓT(o)-ÉT(a)!
 * BRÊV(e)... FRÔN(ha)... (ca)SCÁTA... VER QUE T(esouro)!
 *
 * Na caatinga, o cangaceiro gargalha (IÁ, RRÁR!) e rasga o envelope azul
 * achando que é fã pedindo FOTO — e cai uma FOTO mesmo (ÉTA!), presa a uma
 * carta BREVE de uma linha só. Na foto, tirada lá de cima, a FRONHA
 * verde-amarela do último saque — a mesma que está aos pés dele, despejando
 * uma CASCATA de moedas de ouro pedra abaixo. A linha da carta: "queremos
 * VER QUE Tesouro é esse". Em sueco, 'skatt' é tesouro e imposto.
 *
 * Diorama: chão de terra rachada, mandacaru de três braços ao fundo, o
 * cangaceiro no centro (foto na mão direita, carta erguida na esquerda), a
 * fronha sobre um lajedo à direita com a cascata caindo num monte de moedas,
 * envelope rasgado no chão à esquerda.
 */

const SOIL = '#8f5f38'
const EARTH = '#d9a66e'
const CRACK = '#a06a3c'
const STONE = '#b5a08a'
const STONE_DARK = '#8f7b68'
const CACTUS = '#5d8f74'
const CACTUS_DARK = '#4c7a62'
const AREOLE = '#d8cfb2'
const TWIG = '#8a7663'
const LEATHER = '#8d5a32'
const LEATHER_LIGHT = '#a8703f'
const HAT = '#6a4124'
const STRAP = '#4a2e1b'
const BRASS = '#c9a457'
const SCARF = '#8e3b33'
const SKIN = '#c98e62'
const HAIR = '#221a16'
const MOUTH = '#3a1d1a'
const PAPER = '#f6f2e8'
const INK = '#2b2f3d'
const ENVELOPE = '#4e78a6'
const ENVELOPE_IN = '#3b5f88'
const GREEN = '#2f8a4c' // a fronha verde-amarela (o FRÔN de 'Jag kommer från Brasilien')
const GREEN_DARK = '#1f5c33'
const YELLOW = '#f0c93a'
const GOLD = '#f2b52b' // acento saturado RESERVADO: as moedas da cascata (SKATT)
const GOLD_DARK = '#d6971a'

const GY = 0.16 // topo do chão
const H = 1.72 // altura do cangaceiro
const BODY_H = H * 0.52
const BODY_R = H * 0.17
const CX = -0.2
const CZ = -0.45
const ROCK_C = new THREE.Vector3(0.95, GY, 0.15)
const PILE_C = new THREE.Vector3(0.34, GY, 0.74)

/** Peça extrudada de bordas arredondadas a partir de um contorno 2D (plano xy, virada para +z). */
function extrude(shape: THREE.Shape, depth: number, color: string, roughness = 0.6, bevel = 0.012, metalness = 0.05) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 28,
  })
  geo.translate(0, 0, -depth / 2)
  geo.computeBoundingBox()
  const bb = geo.boundingBox!
  const size = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y)
  const m = new THREE.Mesh(geo, mat(color, { roughness, metalness, size }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Meia-lua: semicírculo de raio r com a borda de baixo levemente côncava. */
function halfMoon(r: number, sag = 0.24) {
  const s = new THREE.Shape()
  s.moveTo(-r, 0)
  s.absarc(0, 0, r, Math.PI, 0, true)
  s.quadraticCurveTo(0, r * sag, -r, 0)
  return s
}

function star(outer: number, inner: number) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 === 0 ? outer : inner
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  return s
}

/** Coluna de mandacaru: perfil de cápsula torneado com gomos (costelas) e aréolas nas cristas. */
function ribbedColumn(r: number, h: number, ribs = 8) {
  const g = new THREE.Group()
  const prof: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(r * 0.96, 0), new THREE.Vector2(r, 0.04)]
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2)
    prof.push(new THREE.Vector2(Math.max(r * Math.cos(a), 0.0001), h - r + r * Math.sin(a)))
  }
  const SEG = 64
  const geo = new THREE.LatheGeometry(prof, SEG)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const th = Math.atan2(v.x, v.z)
    const k = 0.9 + 0.1 * Math.cos(ribs * th)
    pos.setXYZ(i, v.x * k, v.y, v.z * k)
  }
  geo.computeVertexNormals()
  // costura do torno: média das normais da primeira e da última coluna
  const n = geo.attributes.normal
  const P = prof.length
  for (let j = 0; j < P; j++) {
    const a = j
    const b = SEG * P + j
    const nx = n.getX(a) + n.getX(b)
    const ny = n.getY(a) + n.getY(b)
    const nz = n.getZ(a) + n.getZ(b)
    const l = Math.hypot(nx, ny, nz) || 1
    n.setXYZ(a, nx / l, ny / l, nz / l)
    n.setXYZ(b, nx / l, ny / l, nz / l)
  }
  const m = new THREE.Mesh(geo, mat(CACTUS, { roughness: 0.62, size: h }))
  m.castShadow = true
  m.receiveShadow = true
  g.add(m)
  for (let k = 0; k < ribs; k++) {
    const th = (k / ribs) * Math.PI * 2
    for (let y = 0.2; y < h - r * 0.6; y += 0.28) {
      const dot = sphere(0.008, AREOLE, { roughness: 0.8, detail: 0 }, 6)
      const rr = r * 1.0 + 0.006
      dot.position.set(Math.sin(th) * rr, y + (k % 2) * 0.1, Math.cos(th) * rr)
      g.add(dot)
    }
  }
  return g
}

/** Moeda: disco dourado com a face em relevo. */
function coin(r = 0.062) {
  const g = new THREE.Group()
  const disc = cylinder(r, r, 0.018, GOLD, { roughness: 0.3, metalness: 0.5 }, 24)
  g.add(disc)
  const face = cylinder(r * 0.7, r * 0.7, 0.024, GOLD_DARK, { roughness: 0.35, metalness: 0.5 }, 20)
  g.add(face)
  return g
}

/** Cartucheira: faixa que abraça o tronco na diagonal, com balas de latão na frente. */
function bandolier(tilt: number, radius: number, y: number) {
  const g = new THREE.Group()
  g.position.y = y
  g.rotation.z = tilt
  const stretch = 1 / Math.cos(tilt)
  const band = torus(radius, 0.038, STRAP, { roughness: 0.7 })
  band.rotation.x = Math.PI / 2
  band.scale.set(stretch, 1, 1)
  band.scale.z = 1.6 // faixa larga, não cordão
  g.add(band)
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue // no cruzamento das duas faixas não cabe bala
    const phi = Math.PI / 2 + k * 0.2
    const rr = radius + 0.03
    const bullet = cylinder(0.017, 0.017, 0.07, BRASS, { roughness: 0.35, metalness: 0.6 }, 12)
    bullet.position.set(Math.cos(phi) * rr * stretch, 0, Math.sin(phi) * rr)
    g.add(bullet)
    const tip = sphere(0.017, '#b98d45', { roughness: 0.35, metalness: 0.6 }, 10)
    tip.position.set(Math.cos(phi) * rr * stretch, 0.035, Math.sin(phi) * rr)
    g.add(tip)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- base: chão de terra rachada da caatinga -----------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.55, 2.65, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)

  const earth = cylinder(2.5, 2.54, 0.06, EARTH, { roughness: 0.95 })
  earth.position.y = 0.13
  base.add(earth)

  // rachaduras: grade sorteada ligando vizinhos (placas de barro seco)
  const SP = 0.5
  const N = 6
  const pts: THREE.Vector2[][] = []
  for (let i = -N; i <= N; i++) {
    const row: THREE.Vector2[] = []
    for (let j = -N; j <= N; j++) {
      row.push(new THREE.Vector2(i * SP + (rand() - 0.5) * 0.28, j * SP + (rand() - 0.5) * 0.28))
    }
    pts.push(row)
  }
  const crack = (a: THREE.Vector2, b: THREE.Vector2) => {
    if (a.length() > 2.38 || b.length() > 2.38) return
    const d = b.clone().sub(a)
    const seg = rbox(d.length() + 0.02, 0.01, 0.022, 0.004, CRACK, { roughness: 0.95, detail: 0 })
    seg.position.set((a.x + b.x) / 2, GY + 0.002, (a.y + b.y) / 2)
    seg.rotation.y = -Math.atan2(d.y, d.x)
    base.add(seg)
  }
  for (let i = 0; i < pts.length; i++) {
    for (let j = 0; j < pts[i].length; j++) {
      if (i + 1 < pts.length && rand() > 0.12) crack(pts[i][j], pts[i + 1][j])
      if (j + 1 < pts[i].length && rand() > 0.12) crack(pts[i][j], pts[i][j + 1])
    }
  }

  // pedras soltas
  for (const [px, pz, pr, ps] of [[-1.85, 0.25, 0.17, 3], [1.95, -0.35, 0.12, 5], [-0.95, 1.55, 0.09, 9], [1.55, 1.25, 0.1, 11]] as const) {
    const pedrinha = rock(pr, STONE_DARK, ps, { roughness: 0.9 })
    pedrinha.position.set(px, GY + pr * 0.35, pz)
    pedrinha.scale.y = 0.7
    base.add(pedrinha)
  }

  // garrancho seco (galhos cinzentos da caatinga)
  const garrancho = new THREE.Group()
  garrancho.position.set(1.85, GY, -0.55)
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + rand() * 0.4
    const lean = 0.35 + rand() * 0.35
    const len = 0.45 + rand() * 0.35
    const galho = capsule(0.018, len, TWIG, { roughness: 0.9 })
    galho.position.set(Math.cos(a) * Math.sin(lean) * len * 0.5, Math.cos(lean) * len * 0.5, Math.sin(a) * Math.sin(lean) * len * 0.5)
    galho.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
    garrancho.add(galho)
  }
  base.add(garrancho)

  // tufos de capim seco
  for (const [tx, tz, seed] of [[-1.45, 0.95, 3], [1.4, 0.9, 7], [-0.95, -0.3, 13]] as const) {
    const tufo = new THREE.Group()
    tufo.position.set(tx, GY, tz)
    const tr = rng(seed)
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + tr()
      const lean = 0.2 + tr() * 0.45
      const hh = 0.16 + tr() * 0.14
      const folha = cone(0.014, hh, '#c9a86a', { roughness: 0.9 }, 6)
      folha.position.set(Math.cos(a) * 0.03, hh / 2 - 0.01, Math.sin(a) * 0.03)
      folha.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
      tufo.add(folha)
    }
    base.add(tufo)
  }

  root.add(base)

  // ---- mandacaru de três braços ao fundo ------------------------------------
  const mandacaru = new THREE.Group()
  mandacaru.position.set(-1.45, GY, -1.35)
  mandacaru.rotation.y = 0.3
  const tronco = ribbedColumn(0.16, 1.95)
  mandacaru.add(tronco)
  const bracos: [number, number, number, number, number][] = [
    // [ângulo em volta do tronco, altura do cotovelo, saída, altura do braço, raio]
    [Math.PI / 2 + 0.2, 0.65, 0.4, 0.9, 0.125],
    [-Math.PI / 2 + 0.1, 0.9, 0.34, 0.72, 0.115],
    [Math.PI + 0.4, 1.15, 0.28, 0.5, 0.1],
  ]
  for (const [ang, ey, out, bh, br] of bracos) {
    const dir = new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang))
    const cotovelo = capsule(br * 0.95, out, CACTUS_DARK, { roughness: 0.65 })
    cotovelo.position.copy(dir.clone().multiplyScalar(out / 2 + 0.06)).setY(ey)
    cotovelo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    mandacaru.add(cotovelo)
    const joelho = sphere(br * 0.98, CACTUS_DARK, { roughness: 0.65 })
    joelho.position.copy(dir.clone().multiplyScalar(out + 0.06)).setY(ey)
    mandacaru.add(joelho)
    const braco = ribbedColumn(br, bh, 7)
    braco.position.copy(dir.clone().multiplyScalar(out + 0.06)).setY(ey - 0.02)
    mandacaru.add(braco)
  }
  root.add(mandacaru)

  // ---- lajedo (pedra grande onde a fronha caiu) -----------------------------
  const pedra = new THREE.Group()
  pedra.position.copy(ROCK_C)
  const lajedo = rock(0.5, STONE, 17, { roughness: 0.85 })
  lajedo.scale.set(1.1, 0.6, 0.92)
  lajedo.position.y = 0.12
  pedra.add(lajedo)
  const lasca = rock(0.22, STONE_DARK, 23, { roughness: 0.88 })
  lasca.scale.set(1.2, 0.65, 1)
  lasca.position.set(0.44, 0.04, 0.3)
  pedra.add(lasca)
  root.add(pedra)
  const ROCK_TOP = GY + 0.12 + 0.5 * 0.62

  // ---- fronha verde-amarela estufada (FRÔN) ---------------------------------
  // eixo longo em x local; a boca aberta fica em -x
  const FL = 0.86
  const fronha = new THREE.Group()
  fronha.position.set(ROCK_C.x + 0.02, ROCK_TOP + 0.15, ROCK_C.z - 0.02)
  fronha.rotation.set(0, 0.55, 0.22)
  root.add(fronha)

  const almofada = rbox(FL, 0.36, 0.56, 0.16, GREEN, { roughness: 0.92 })
  fronha.add(almofada)
  // estufada: barriga arredondada em cima e embaixo
  for (const sy of [-1, 1]) {
    const barriga = sphere(0.3, GREEN, { roughness: 0.92 })
    barriga.scale.set(1.25, 0.32, 0.82)
    barriga.position.set(0.04, sy * 0.1, 0)
    fronha.add(barriga)
  }
  // faixa amarela dando a volta na fronha (a mesma verde-amarela do panda)
  const listra = rbox(0.13, 0.42, 0.6, 0.07, YELLOW, { roughness: 0.9 })
  listra.position.x = -0.1
  fronha.add(listra)
  // cantos de travesseiro no fundo fechado
  for (const cz of [-1, 1]) {
    const ponta = sphere(0.065, GREEN, { roughness: 0.92 })
    ponta.scale.set(1, 0.55, 1)
    ponta.position.set(FL / 2 - 0.05, 0, cz * 0.25)
    fronha.add(ponta)
  }
  // boca aberta: bainha franzida, fundo escuro e moedas transbordando
  const bainha = torus(0.2, 0.042, GREEN, { roughness: 0.92 })
  bainha.rotation.y = Math.PI / 2
  bainha.scale.set(1.32, 0.82, 1)
  bainha.position.x = -FL / 2 + 0.01
  fronha.add(bainha)
  const fundo = sphere(0.19, GREEN_DARK, { roughness: 0.95 })
  fundo.scale.set(0.25, 0.82, 1.32)
  fundo.position.x = -FL / 2 + 0.03
  fronha.add(fundo)
  // fronha cheia de ouro: o monte aparece na boca e transborda pela bainha
  const ouro = sphere(0.17, GOLD_DARK, { roughness: 0.4, metalness: 0.45 })
  ouro.scale.set(0.45, 0.62, 1.25)
  ouro.position.set(-FL / 2 + 0.04, -0.05, 0)
  fronha.add(ouro)
  for (let k = 0; k < 7; k++) {
    const m = coin(0.055)
    m.position.set(-FL / 2 - 0.02 + rand() * 0.05, -0.1 + rand() * 0.07, -0.18 + k * 0.06)
    m.rotation.set((rand() - 0.5) * 0.9, rand() * 3, (rand() - 0.5) * 0.9)
    fronha.add(m)
  }

  root.updateMatrixWorld(true)
  const mouth = new THREE.Vector3(-FL / 2 - 0.05, -0.1, 0).applyMatrix4(fronha.matrixWorld)
  const out = new THREE.Vector3(-1, 0, 0).transformDirection(fronha.matrixWorld)
  out.y = 0
  out.normalize()

  // ---- cascata de moedas: da boca da fronha até o monte ---------------------
  const PILE_H = 0.26
  const cascata = new THREE.Group()
  cascata.position.copy(mouth)
  root.add(cascata)
  const end = PILE_C.clone().setY(GY + PILE_H).sub(mouth)
  const ctrl = out.clone().multiplyScalar(0.32).setY(0.06)
  const side = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0, 1, 0)).normalize()
  const STREAM = 15
  for (let i = 0; i < STREAM; i++) {
    const t = (i + 0.6) / (STREAM + 0.4)
    const p = new THREE.Vector3()
      .addScaledVector(ctrl, 2 * (1 - t) * t)
      .addScaledVector(end, t * t)
    for (let k = 0; k < 2; k++) {
      const spread = 0.04 + t * 0.09
      const m = coin(0.058)
      m.position.copy(p)
        .addScaledVector(side, (rand() - 0.5) * 2 * spread)
        .add(new THREE.Vector3(0, (rand() - 0.5) * 0.05, 0))
      m.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
      cascata.add(m)
    }
  }

  // ---- monte de moedas no chão ---------------------------------------------
  const pilha = new THREE.Group()
  pilha.position.copy(PILE_C)
  root.add(pilha)
  const PR = 0.3
  const monte = lathe(
    [[0, 0], [PR, 0], [PR * 0.9, 0.05], [PR * 0.62, 0.13], [PR * 0.32, PILE_H - 0.04], [0, PILE_H - 0.02]],
    GOLD_DARK,
    { roughness: 0.45, metalness: 0.4 },
  )
  monte.scale.set(0.9, 0.92, 0.9)
  pilha.add(monte)
  // moedas deitadas acompanhando a encosta do monte, do pé ao cume
  for (let k = 0; k < 48; k++) {
    const a = rand() * Math.PI * 2
    const u = Math.sqrt(rand())
    const rr = u * PR
    const hy = THREE.MathUtils.lerp(PILE_H - 0.02, 0.0, Math.pow(u, 1.4))
    const m = coin(0.058)
    m.position.set(Math.cos(a) * rr, hy + 0.01, Math.sin(a) * rr)
    const slope = 0.25 + u * 0.45
    m.rotation.set(Math.sin(a) * slope + (rand() - 0.5) * 0.4, rand() * Math.PI, -Math.cos(a) * slope + (rand() - 0.5) * 0.4)
    pilha.add(m)
  }
  for (let k = 0; k < 7; k++) {
    const a = rand() * Math.PI * 2
    const rr = PR + 0.08 + rand() * 0.28
    const m = coin(0.058)
    m.position.set(Math.cos(a) * rr, 0.012, Math.sin(a) * rr)
    m.rotation.set(0, rand() * Math.PI, 0)
    pilha.add(m)
  }

  // ---- cangaceiro -----------------------------------------------------------
  const cang = person({ body: LEATHER, skin: SKIN, height: H, armAngle: 0.3 })
  cang.position.set(CX, GY, CZ)
  root.add(cang)

  // gibão: cinturão com fivela e duas cartucheiras cruzadas no peito
  const cinturao = torus(BODY_R * 1.05, 0.05, STRAP, { roughness: 0.7 })
  cinturao.rotation.x = Math.PI / 2
  cinturao.position.y = BODY_H * 0.36
  cang.add(cinturao)
  const fivela = rbox(0.12, 0.1, 0.03, 0.02, BRASS, { roughness: 0.3, metalness: 0.7 })
  fivela.position.set(0, BODY_H * 0.36, BODY_R * 1.05 + 0.04)
  cang.add(fivela)
  cang.add(bandolier(0.62, BODY_R * 1.04, BODY_H * 0.6))
  cang.add(bandolier(-0.62, BODY_R * 1.07, BODY_H * 0.6))

  // lenço no pescoço
  const lenco = torus(0.16, 0.05, SCARF, { roughness: 0.85 })
  lenco.rotation.x = Math.PI / 2
  lenco.position.y = BODY_H - 0.02
  cang.add(lenco)
  const ponta = cone(0.09, 0.16, SCARF, { roughness: 0.85 })
  ponta.rotation.x = Math.PI
  ponta.scale.z = 0.4
  ponta.position.set(0, BODY_H - 0.1, 0.17)
  cang.add(ponta)

  // rosto: espanto — sobrancelhas lá em cima, boca aberta, bigode preto
  const head = cang.getObjectByName('head') as THREE.Group
  const HR = H * 0.19
  const boca = sphere(0.07, MOUTH, { roughness: 0.7 })
  boca.scale.set(0.85, 1.1, 0.5)
  boca.position.set(0, -HR * 0.46, HR * 0.86)
  head.add(boca)
  const labio = torus(0.064, 0.017, '#a86a4a', { roughness: 0.6 })
  labio.scale.set(0.9, 1.15, 1)
  labio.position.set(0, -HR * 0.46, HR * 0.9)
  head.add(labio)
  for (const s of [-1, 1]) {
    const bigode = capsule(0.032, 0.13, HAIR, { roughness: 0.8 })
    bigode.rotation.set(0.25, -s * 0.3, s * (Math.PI / 2 - 0.45))
    bigode.position.set(s * 0.075, -HR * 0.24, HR * 0.9)
    head.add(bigode)
    // sobrancelha em arco bem alto: espanto, não raiva
    const ARC = Math.PI * 0.62
    const sobrancelha = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.017, 10, 20, ARC), mat(HAIR, { roughness: 0.8, size: 0.13 }))
    sobrancelha.castShadow = true
    sobrancelha.rotation.set(-0.15, s * 0.3, Math.PI / 2 - ARC / 2)
    sobrancelha.position.set(s * HR * 0.37, HR * 0.33, HR * 0.8)
    head.add(sobrancelha)
    const costeleta = rbox(0.05, 0.16, 0.08, 0.02, HAIR, { roughness: 0.85 })
    costeleta.position.set(s * HR * 0.93, -HR * 0.05, HR * 0.12)
    head.add(costeleta)
  }
  const cabelo = sphere(HR * 0.95, HAIR, { roughness: 0.85 })
  cabelo.scale.set(1.02, 0.85, 0.8)
  cabelo.position.set(0, -HR * 0.15, -HR * 0.35)
  head.add(cabelo)

  // ---- chapéu de couro em meia-lua com estrela (filho da cabeça) -----------
  const HAT_Y = HR * 0.52
  const chapeu = new THREE.Group()
  chapeu.position.y = HAT_Y
  head.add(chapeu)
  const copa = lathe(
    [[HR * 0.98, 0], [HR * 1.04, 0.04], [HR * 0.98, 0.14], [HR * 0.85, 0.24], [HR * 0.55, 0.3], [0, 0.32]],
    HAT,
    { roughness: 0.75 },
  )
  chapeu.add(copa)
  const R = 0.5
  const abaFrente = extrude(halfMoon(R), 0.035, HAT, 0.72)
  abaFrente.position.set(0, -0.01, HR * 0.86)
  abaFrente.rotation.x = -0.14
  chapeu.add(abaFrente)
  const abaTras = extrude(halfMoon(R * 0.92), 0.035, HAT, 0.72)
  abaTras.position.set(0, -0.01, -HR * 0.82)
  abaTras.rotation.x = 0.22
  chapeu.add(abaTras)
  // aplique de couro claro, tachas de latão no arco e a estrela no meio
  const aplique = extrude(halfMoon(R * 0.82, 0.32), 0.012, LEATHER_LIGHT, 0.7, 0.006)
  aplique.position.set(0, 0.035, 0.03)
  abaFrente.add(aplique)
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI * (0.06 + 0.88 * (k / 10))
    const tacha = sphere(0.016, BRASS, { roughness: 0.3, metalness: 0.7 }, 12)
    tacha.position.set(Math.cos(a) * R * 0.91, Math.sin(a) * R * 0.91, 0.03)
    abaFrente.add(tacha)
  }
  const estrela = extrude(star(0.12, 0.05), 0.02, '#e2b544', 0.3, 0.008, 0.6)
  estrela.position.set(0, R * 0.42, 0.05)
  abaFrente.add(estrela)

  // ---- braço direito (lado esquerdo da tela): mostra a FOTO -----------------
  const bracoFoto = cang.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoFoto, H)
  bracoFoto.rotation.set(-1.25, 0, -0.62)

  const foto = new THREE.Group()
  // polaroide um pouco maior que a vida: o conteúdo tem de ler de longe
  const fotoCorpo = new THREE.Group()
  fotoCorpo.scale.setScalar(1.15)
  fotoCorpo.position.y = 0.04
  foto.add(fotoCorpo)
  const moldura = rbox(0.44, 0.5, 0.02, 0.012, PAPER, { roughness: 0.45, detail: 0.4 })
  fotoCorpo.add(moldura)
  const imagem = new THREE.Group()
  imagem.position.set(0, 0.035, 0.012)
  fotoCorpo.add(imagem)
  const chaoFoto = rbox(0.36, 0.36, 0.006, 0.004, '#cf9a62', { roughness: 0.3, detail: 0 })
  imagem.add(chaoFoto)
  const pedraFoto = cylinder(0.1, 0.1, 0.006, '#a8927c', { roughness: 0.4, detail: 0 }, 24)
  pedraFoto.rotation.x = Math.PI / 2
  pedraFoto.scale.set(1.2, 1, 0.9)
  pedraFoto.position.set(0.07, 0.06, 0.004)
  imagem.add(pedraFoto)
  const fronhaFoto = rbox(0.16, 0.1, 0.008, 0.035, GREEN, { roughness: 0.4, detail: 0 })
  fronhaFoto.position.set(0.07, 0.07, 0.009)
  fronhaFoto.rotation.z = 0.5
  imagem.add(fronhaFoto)
  const listraFoto = rbox(0.165, 0.024, 0.008, 0.01, YELLOW, { roughness: 0.4, detail: 0 })
  listraFoto.position.set(0.07, 0.07, 0.012)
  listraFoto.rotation.z = 0.5
  imagem.add(listraFoto)
  for (let k = 0; k < 9; k++) {
    const t = k / 8
    const d = cylinder(0.016, 0.016, 0.006, GOLD, { roughness: 0.3, metalness: 0.5, detail: 0 }, 14)
    d.rotation.x = Math.PI / 2
    d.position.set(0.0 - t * 0.1 + (rand() - 0.5) * 0.02, 0.03 - t * 0.12, 0.012)
    imagem.add(d)
  }
  const monteFoto = cylinder(0.055, 0.055, 0.006, GOLD_DARK, { roughness: 0.3, metalness: 0.5, detail: 0 }, 20)
  monteFoto.rotation.x = Math.PI / 2
  monteFoto.position.set(-0.1, -0.11, 0.01)
  imagem.add(monteFoto)

  // ---- braço esquerdo (lado direito da tela): ergue a carta BREVE ----------
  const bracoCarta = cang.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoCarta, H)
  bracoCarta.rotation.set(0, 0, 2.45)

  const carta = new THREE.Group()
  const papel = rbox(0.32, 0.42, 0.01, 0.006, PAPER, { roughness: 0.5, detail: 0.4 })
  carta.add(papel)
  for (const dy of [-0.07, 0.07]) {
    const dobra = rbox(0.3, 0.006, 0.004, 0.002, '#ddd6c6', { roughness: 0.6, detail: 0 })
    dobra.position.set(0, dy, 0.006)
    carta.add(dobra)
  }
  const linha = rbox(0.22, 0.03, 0.006, 0.004, INK, { roughness: 0.5, detail: 0 })
  linha.position.set(0, 0.11, 0.008)
  carta.add(linha)

  // as duas coisas na mão, viradas para a câmera (a pose final dos braços manda)
  root.updateMatrixWorld(true)
  const hold = (arm: THREE.Object3D, obj: THREE.Object3D, lift: number, rot: [number, number, number]) => {
    const hand = arm.children[0]
    const p = new THREE.Vector3()
    hand.getWorldPosition(p)
    obj.position.copy(p).add(new THREE.Vector3(0, lift, -0.01))
    obj.rotation.set(...rot)
    root.add(obj)
    obj.updateMatrixWorld(true)
    arm.attach(obj)
    obj.scale.setScalar(1)
  }
  hold(bracoFoto, foto, 0.2, [-0.22, 0.24, -0.06])
  hold(bracoCarta, carta, 0.2, [-0.1, -0.08, 0.1])
  // rotação LOCAL (no espaço do braço) que a pose final deixou
  const FOTO_RZ = foto.rotation.z
  const CARTA_RZ = carta.rotation.z

  // ---- envelope azul rasgado no chão ----------------------------------------
  const envelope = new THREE.Group()
  const ENV_POS = new THREE.Vector3(-0.9, GY, 0.55)
  envelope.position.copy(ENV_POS)
  const ENV_RY = 0.45
  envelope.rotation.set(0, ENV_RY, 0)
  root.add(envelope)
  const corpo = rbox(0.56, 0.022, 0.36, 0.008, ENVELOPE, { roughness: 0.75 })
  corpo.position.y = 0.011
  envelope.add(corpo)
  // aba aberta virada pra trás e a beirada rasgada
  const abaShape = new THREE.Shape()
  abaShape.moveTo(-0.28, 0)
  abaShape.lineTo(0.28, 0)
  abaShape.lineTo(0, -0.2)
  abaShape.closePath()
  const aba = extrude(abaShape, 0.008, ENVELOPE_IN, 0.75, 0.004)
  aba.rotation.x = Math.PI / 2 + 0.35
  aba.position.set(0, 0.024, -0.18)
  envelope.add(aba)
  for (let k = 0; k < 6; k++) {
    const dente = cone(0.03, 0.05, PAPER, { roughness: 0.7 }, 4)
    dente.scale.z = 0.25
    dente.rotation.x = -Math.PI / 2
    dente.position.set(-0.24 + k * 0.096, 0.024, 0.19)
    envelope.add(dente)
  }
  for (const [lw, lz] of [[0.22, 0.02], [0.18, 0.07], [0.2, 0.12]] as const) {
    const end1 = rbox(lw, 0.004, 0.018, 0.002, '#dfe7ef', { roughness: 0.6, detail: 0 })
    end1.position.set(-0.05, 0.024, lz)
    envelope.add(end1)
  }
  const selo = rbox(0.08, 0.006, 0.09, 0.004, PAPER, { roughness: 0.6, detail: 0 })
  selo.position.set(0.19, 0.025, -0.08)
  envelope.add(selo)
  const seloCor = rbox(0.055, 0.006, 0.062, 0.003, '#c0533e', { roughness: 0.6, detail: 0 })
  seloCor.position.set(0.19, 0.028, -0.08)
  envelope.add(seloCor)
  const tira = rbox(0.4, 0.01, 0.05, 0.004, ENVELOPE, { roughness: 0.75 })
  tira.position.set(0.12, 0.006, 0.42)
  tira.rotation.y = -0.5
  envelope.add(tira)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'caatinga', object: base },
    { name: 'mandacaru', group: 'caatinga', object: mandacaru },
    { name: 'cangaceiro', group: 'cangaceiro', object: cang },
    { name: 'chapeu', group: 'cangaceiro', object: chapeu },
    { name: 'envelope', group: 'envelope', object: envelope },
    { name: 'bracoFoto', group: 'foto', object: bracoFoto },
    { name: 'foto', group: 'foto', object: foto },
    { name: 'bracoCarta', group: 'carta', object: bracoCarta },
    { name: 'carta', group: 'carta', object: carta },
    { name: 'pedra', group: 'fronha', object: pedra },
    { name: 'fronha', group: 'fronha', object: fronha },
    { name: 'cascata', group: 'cascata', object: cascata },
    { name: 'pilha', group: 'cascata', object: pilha },
  ]

  // ---- montagem ------------------------------------------------------------
  const sc = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]
  const FY = fronha.position.y
  const envFrom = new THREE.Vector3(CX + 0.05, GY + 1.05, CZ + 0.55)
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Na caatinga, sob sol de rachar, a terra seca brota e o mandacaru se ergue…',
    }),
    seq('mandacaru-rise', 'mandacaru', 0.35, 0.9, [riseFrom(GY, 2.6)], { ease: 'easeOut' }),

    seq('cang-rise', 'cangaceiro', 1.5, 0.8, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'O cangaceiro solta a gargalhada — IÁ, RRÁR! — com um envelope azul na mão…',
    }),
    seq('bracoFoto-pende', 'bracoFoto', 1.5, 0.8, [ch('rotation.z', -0.5, -0.14)], { ease: 'easeOut' }),
    seq('bracoCarta-pende', 'bracoCarta', 1.5, 0.8, [ch('rotation.z', 0.5, 0.14)], { ease: 'easeOut' }),
    seq('cang-ri-a', 'cangaceiro', 2.35, 0.14, [ch('rotation.z', 0, 0.07)], { ease: 'easeOut' }),
    seq('cang-ri-b', 'cangaceiro', 2.49, 0.16, [ch('rotation.z', 0.07, -0.07)]),
    seq('cang-ri-c', 'cangaceiro', 2.65, 0.16, [ch('rotation.z', -0.07, 0.05)]),
    seq('cang-ri-d', 'cangaceiro', 2.81, 0.2, [ch('rotation.z', 0.05, 0)], { ease: 'easeOut' }),
    seq('chapeu-poe', 'chapeu', 1.9, 0.6, [...sc(0.01, 1), ch('position.y', HAT_Y + 0.5, HAT_Y)], {
      ease: 'easeOut',
    }),

    seq('envelope-surge', 'envelope', 2.6, 0.4, [
      ...sc(0.01, 1),
      ch('position.x', envFrom.x, envFrom.x), ch('position.y', envFrom.y, envFrom.y), ch('position.z', envFrom.z, envFrom.z),
      ch('rotation.x', Math.PI / 2, Math.PI / 2), ch('rotation.y', ENV_RY - Math.PI * 2, ENV_RY - Math.PI * 2),
    ], { ease: 'easeOut' }),
    seq('envelope-cai', 'envelope', 3.3, 0.8, [
      ch('position.x', envFrom.x, ENV_POS.x), ch('position.y', envFrom.y, ENV_POS.y), ch('position.z', envFrom.z, ENV_POS.z),
      ch('rotation.x', Math.PI / 2, 0), ch('rotation.y', ENV_RY - Math.PI * 2, ENV_RY),
    ], {
      ease: 'easeIn',
      caption: '…e rasga, achando que é fã pedindo FOTO.',
    }),

    seq('bracoFoto-mostra', 'bracoFoto', 4.4, 0.6, [ch('rotation.x', 0, -1.25), ch('rotation.z', -0.14, -0.62)], {
      ease: 'easeOut',
      caption: 'E cai uma FOTO mesmo — ÉTA! FÓ-TÉT!',
    }),
    seq('foto-surge', 'foto', 4.5, 0.5, [...sc(0.01, 1), ch('rotation.z', FOTO_RZ + 1.2, FOTO_RZ)], { ease: 'easeOut' }),

    seq('bracoCarta-ergue', 'bracoCarta', 5.9, 0.6, [ch('rotation.z', 0.14, 2.45)], {
      ease: 'easeOut',
      caption: 'Presa nela, uma carta BREVE, de uma linha só: BRÊÊV.',
    }),
    seq('carta-surge', 'carta', 6.0, 0.5, [...sc(0.01, 1)], { ease: 'easeOut' }),

    seq('pedra-rise', 'pedra', 7.4, 0.6, [riseFrom(ROCK_C.y, 0.8)], {
      ease: 'easeOut',
      caption: 'Na foto, tirada lá de cima: a FRONHA do último saque — a mesma que está aos pés dele. FRÔN…',
    }),
    seq('fronha-cai', 'fronha', 7.7, 0.5, [ch('position.y', FY + 2.2, FY)], { ease: 'easeIn' }),
    seq('fronha-amassa', 'fronha', 8.2, 0.14, [ch('scale.y', 1, 0.82)], { ease: 'easeOut' }),
    seq('fronha-estufa', 'fronha', 8.34, 0.3, [ch('scale.y', 0.82, 1)], { ease: 'easeOut' }),

    seq('cascata-jorra', 'cascata', 9.1, 0.8, [...sc(0.01, 1)], {
      ease: 'easeOut',
      caption: '…despejando uma CASCATA de moedas de ouro — SKÁT! Em sueco, \'skatt\' é tesouro e imposto.',
    }),
    seq('pilha-cresce', 'pilha', 9.4, 0.8, [ch('scale.x', 0.3, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.3, 1)], {
      ease: 'easeOut',
    }),

    seq('carta-treme-a', 'carta', 10.9, 0.15, [ch('rotation.z', CARTA_RZ, CARTA_RZ - 0.22)], {
      caption: 'A linha da carta: \'Queremos VER QUE Tesouro é esse.\' — VÄR-KET!',
    }),
    seq('carta-treme-b', 'carta', 11.05, 0.15, [ch('rotation.z', CARTA_RZ - 0.22, CARTA_RZ + 0.12)]),
    seq('carta-treme-c', 'carta', 11.2, 0.2, [ch('rotation.z', CARTA_RZ + 0.12, CARTA_RZ)]),
    seq('cang-pula', 'cangaceiro', 10.9, 0.22, [ch('position.y', GY, GY + 0.12)], { ease: 'easeOut' }),
    seq('cang-cai', 'cangaceiro', 11.12, 0.22, [ch('position.y', GY + 0.12, GY)], { ease: 'easeIn' }),

    seq('pilha-brilha', 'pilha', 12.4, 0.5, [ch('rotation.y', -0.3, 0)], {
      ease: 'easeOut',
      caption: 'Jag har fått ett brev från Skatteverket. — Recebi uma carta do Skatteverket.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 1.95, 3.75], target: [0.1, 0.98, -0.08] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-fatt-ett-brev-fran-skatteverket',
    contexto:
      'Burocracia: contando no trabalho, pro parceiro ou pra um amigo sueco quando chega aquele envelope — ou ao ligar pro próprio Skatteverket, que na Suécia é a Receita e o cartório ao mesmo tempo (imposto, personnummer, endereço, ID-kort). Hoje a carta também pode chegar no Kivra, a caixa de correio digital.',
    fraseFonte: 'Recebi uma carta do Skatteverket.',
    fraseAlvo: 'Jag har fått ett brev från Skatteverket.',
    pronuncia:
      "iá rrar FÓT et BRÊÊV frôn SKÁT-te-vär-ket ('jag' = iá; 'har' com h soprado e R brando — na fala vem fraquinho, mas o R fica: é ele que faz o presente; 'fått' com Ó ABERTO e CURTO de 'pó' e T seco — é o particípio de 'få', receber —, já emendado no 'ett': fó-TÉT; 'brev' com Ê FECHADO e LONGO de 'você' e V de verdade no fim, a palavra mais forte da frase; 'från' = FRÔN, Ô fechado, N na língua, sem nasal; 'Skatteverket' com a força no SKAT — S colado no K, sem 'is' na frente, A curto e T segurado —, o -te fraquinho, um acento menor no VÄR, com o Ä bem aberto, quase A, e o -ket fraco com T no fim)",
    ponteSonora:
      "IÁ, RRÁR! FÓT(o)-ÉT(a)! BRÊV(e)... FRÔN(ha)... (ca)SCÁTA... VER QUE T(esouro)! (10 sílabas: iá-rrar-FÓT-et-BRÊÊV-frôn-SKÁT-te-vär-ket; força no FÓT, no BRÊÊV e, maior, no SKÁT, com um acento menor no VÄR; IÁ, RRÁR = o 'jag har' de sempre, a gargalhada soprada da hiena de 'Jag har tappat min plånbok' e do pavão de 'Jag har missat bussen': I de IOGA, h soprado, A longo e R BRANDO no fim — sem ele sobra 'ha', outro verbo; FÓT(o) = a FOTO sem o -o: Ó ABERTO e CURTO de 'pó' e T seco — é o 'fått' (recebido); com o Ô fechado e sem T vira o FÔ de 'Kan jag få en påse?', o infinitivo; o T já emenda no ÉT: fó-TÉT; ÉT(a) = o ÉTA! de espanto com o A engolido, o MESMO ÉT do ÉTER de 'Jag har ett möte' e de 'Jag behöver ett BankID': É aberto, curto, T seco; BRÊV(e) = a carta BREVE, de uma linha só, sem o -e e com Ê FECHADO de 'você', e LONGO: o português abre ('em BRÉ-vi'), o sueco fecha a boca, BRÊÊV; o V do fim é de verdade, dente no lábio; FRÔN(ha) = a FRONHA sem o -nha, o MESMO FRÔN de 'Jag kommer från Brasilien' e 'Vilket spår går tåget från?': Ô FECHADO e N batido na língua, sem a nasal de 'fronha'; (ca)SCÁTA = a CASCATA de moedas sem o CA da frente: o S gruda direto no K — nada de 'is-cá' —, força no SKÁ, A curto, o T segurado um instante, e o -a do fim já sai fraquinho como o -e sueco: SKÁT-te; o truque pra não nascer um 'is' na frente: diga 'cascata' com o primeiro CA só na boca, sem voz, e solte a voz no SCÁ; é o 'skatt', que em sueco é IMPOSTO e TESOURO ao mesmo tempo; VER QUE T(esouro) = a linha única da carta, 'queremos VER QUE TESOURO é esse' — e 'skatt' é justamente tesouro: o VER com É bem aberto, quase VÁR (é o ä antes de R, o mesmo É escancarado do RRÉR de 'här'), com o acento menor, o QUE fraquinho e com E mesmo — KET, nunca 'ki' —, e do TESOURO só o T, seco, sem vogal depois: VÄR-ket; não é o VER do berro de 'behöver' (BERRÔ: VER), que vem depois do BERRÔ e sem força)",
    historia:
      "Na caatinga, o cangaceiro solta a gargalhada — IÁ, RRÁR! — e rasga o envelope achando que é fã pedindo FOTO. E cai uma FOTO mesmo — ÉTA! —, presa a uma carta BREVE, de uma linha só. Na foto, tirada lá de cima, está a FRONHA do último saque dele, despejando uma CASCATA de moedas de ouro, e a linha da carta diz: 'Queremos VER QUE TESOURO é esse.' Chegou carta do Skatteverket — em sueco, 'skatt' é tesouro e também imposto.",
  },
  createScene,
}

export default card
