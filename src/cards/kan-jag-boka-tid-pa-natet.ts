import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, rock, puff, person,
} from '../rig/helpers'

/**
 * "Kan jag boka tid på nätet?" — CA-NIÁ! BÚCA… (par)TÍD… PÔ, NÉ-TET?
 *
 * Último segundo da final no pátio do castelo: o bobo da corte rebate a bola
 * com o cetro de CANA (CA-NIÁ!), o gol do rei é uma BÚCA gigante de lábios
 * vermelhos, a bola estufa a NET no fundo da garganta e a garganta devolve
 * dois anéis de eco, o segundo menor: NÉ… tet.
 *
 * Diorama: gramado listrado com a linha da grande área, muralha de pedra em
 * arco ao fundo com bandeirola; a boca-gol à direita, virada para o bobo; o
 * bobo à esquerda, no fim do golpe, cetro erguido. Acento saturado RESERVADO
 * aos lábios (BÚCA); o bobo é mostarda e anil para não competir com eles.
 */

const SOIL = '#6b5038'
const GRASS = '#5e9c48'
const GRASS_LIGHT = '#6aa953'
const LINE = '#f1eee4'
const STONE = '#9b9ea3'
const STONE_LIGHT = '#aeb1b5'
const STONE_DARK = '#85898f'
const MORTAR = '#5f6267'
const LIP = '#de2440' // acento saturado: a BÚCA
const LIP_DARK = '#b51a33'
const THROAT = '#4b1621'
const UVULA = '#d8707f'
const TOOTH = '#f7f3e8'
const NET = '#f8f7f1'
const BALL_W = '#f5f4ef'
const BALL_K = '#25252a'
const MUSTARD = '#e3ad38'
const INDIGO = '#3b4b9b'
const INDIGO_DARK = '#2c386f'
const JADE = '#3a9470'
const CREAM = '#f0e7d4'
const SKIN = '#efc8a2'
const CHEEK = '#e9988c'
const MOUTH_DARK = '#4a1d1f'
const GOLD = '#e8b847'
const CANE = '#93b84f'
const CANE_DARK = '#7a9c3c'
const CANE_NODE = '#cdbf6a'
const WOOD = '#5d4632'
const PENNANT = '#a04a42'
const ECHO1 = '#d9dde2'
const ECHO2 = '#a7aeb8'

const GY = 0.16 // topo do gramado

// ---- boca-gol (coordenadas locais da boca; +z = frente) --------------------
const MOUTH_X = 0.66
const MOUTH_Z = -0.6
const MOUTH_YAW = -0.34
const LA = 0.86 // semi-largura do caminho dos lábios
const LBU = 0.6 // semi-altura do lábio de cima
const LBL = 0.56 // semi-altura do lábio de baixo
const MCY = 0.76 // centro da abertura acima do gramado

// rede (atrás do plano dos lábios, estufada para trás)
const NA = 0.74
const NBU = 0.52
const NBL = 0.46
const NZ = -0.12
const BALL_R = 0.17
const BALL_AT: [number, number] = [0.1, -0.08] // onde a bola afunda (rel. ao centro)

// ---- bobo ------------------------------------------------------------------
const BOBO_X = -1.08
const BOBO_Z = 0.42
const BOBO_YAW = 0.55
const BOBO_S = 1.22
const LEAN = -0.1 // inclinado para o lado do gol no fim do golpe
const ARM_LOW = 0.25 // braço do cetro baixo: taco no chão, pronto pra bater
const ARM_HIGH = 2.45 // fim do golpe: braço erguido para o gol
const ARM_TILT = 0.12
const CANE_Z = -2.86 // pulso: o cetro continua o braço, mais em pé
const CANE_X_LOW = -1.19 // taco deitado à frente, com a ponta no chão
const STRIKE = new THREE.Vector3(0.6, 0.62, -0.12) // onde a bola é rebatida (local do bobo)

function shade<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Tubo por pontos (Catmull-Rom) com raio variável r(t), t de 0 a 1. */
function tube(
  points: THREE.Vector3[],
  radius: (t: number) => number,
  color: string,
  opts: MatOpts = {},
  tubular = 48,
  radial = 16,
) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geo = new THREE.TubeGeometry(curve, tubular, 1, radial, false)
  const pos = geo.attributes.position
  const p = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular
    curve.getPointAt(t, p)
    const k = radius(t)
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      v.fromBufferAttribute(pos, idx).sub(p).multiplyScalar(k).add(p)
      pos.setXYZ(idx, v.x, v.y, v.z)
    }
  }
  pos.needsUpdate = true
  return shade(new THREE.Mesh(geo, mat(color, { size: curve.getLength(), ...opts })))
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Guizo dourado: esfera de metal, fenda escura embaixo e argolinha em cima. */
function bell(r: number) {
  const g = new THREE.Group()
  g.add(sphere(r, GOLD, { roughness: 0.25, metalness: 0.85 }))
  const slit = cylinder(r * 0.42, r * 0.42, r * 0.2, '#3a2a12', { roughness: 0.6 })
  slit.position.y = -r * 0.92
  g.add(slit)
  const loop = torus(r * 0.32, r * 0.11, GOLD, { roughness: 0.25, metalness: 0.85 })
  loop.position.y = r * 1.1
  g.add(loop)
  return g
}

/**
 * Divide cada triângulo em quatro (pontos médios de posição, normal e uv): a
 * cor por vértice ganha resolução e os losangos saem de borda nítida.
 */
function subdivide(src: THREE.BufferGeometry) {
  const g = src.index ? src.toNonIndexed() : src
  const names = ['position', 'normal', 'uv'].filter((n) => g.getAttribute(n))
  const geo = new THREE.BufferGeometry()
  for (const n of names) {
    const a = g.getAttribute(n)
    const k = a.itemSize
    const get = (i: number) => {
      const v = [a.getX(i), a.getY(i)]
      if (k > 2) v.push(a.getZ(i))
      return v
    }
    const mid = (p: number[], q: number[]) => p.map((x, c) => (x + q[c]) / 2)
    const out: number[] = []
    for (let t = 0; t < a.count / 3; t++) {
      const A = get(t * 3)
      const B = get(t * 3 + 1)
      const C = get(t * 3 + 2)
      const AB = mid(A, B)
      const BC = mid(B, C)
      const CA = mid(C, A)
      for (const p of [A, AB, CA, AB, B, BC, CA, BC, C, AB, BC, CA]) out.push(...p)
    }
    if (n === 'normal') {
      for (let i = 0; i < out.length; i += 3) {
        const l = Math.hypot(out[i], out[i + 1], out[i + 2]) || 1
        out[i] /= l
        out[i + 1] /= l
        out[i + 2] /= l
      }
    }
    geo.setAttribute(n, new THREE.Float32BufferAttribute(out, k))
  }
  return geo
}

/** Pinta o corpo de person() em losangos (arlequim) por cor de vértice. */
function paintHarlequin(mesh: THREE.Mesh, offsetY: number) {
  const geo = subdivide(subdivide(mesh.geometry))
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  const cMustard = new THREE.Color(MUSTARD)
  const cIndigo = new THREE.Color(INDIGO)
  const cDark = new THREE.Color(INDIGO_DARK)
  const cMid = cMustard.clone().lerp(cIndigo, 0.5)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i) + offsetY
    const z = pos.getZ(i)
    if (y < 0.1) {
      c.copy(cDark) // meia-calça e pés
    } else {
      const u = Math.atan2(x, z) * 0.29
      const p = u / 0.17 + (y - 0.1) / 0.2
      const q = u / 0.17 - (y - 0.1) / 0.2
      const a = Math.floor(p)
      const b = Math.floor(q)
      const cell = (((a + b) % 2) + 2) % 2 === 0 ? cMustard : cIndigo
      // borda suavizada: perto da linha da grade, mistura as duas cores
      const e = Math.min(p - a, a + 1 - p, q - b, b + 1 - q)
      c.copy(cMid).lerp(cell, THREE.MathUtils.smoothstep(e, 0, 0.07))
    }
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  mesh.geometry = geo
  const m = mat('#ffffff', { roughness: 0.8, size: 0.8 })
  m.vertexColors = true
  mesh.material = m
}

/** Peça achatada orientada: eixo y ao longo de `dir`, achatada na normal. */
function orient(obj: THREE.Object3D, dir: THREE.Vector3, up = V(0, 1, 0)) {
  const y = dir.clone().normalize()
  const z = up.clone().sub(y.clone().multiplyScalar(up.dot(y))).normalize()
  const x = new THREE.Vector3().crossVectors(y, z)
  obj.setRotationFromMatrix(new THREE.Matrix4().makeBasis(x, y, z))
}

/** Cabecinha de bobo na ponta do cetro (marotte). Origem na base da gola. */
function marotte() {
  const g = new THREE.Group()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const flap = cone(0.035, 0.08, i % 2 ? INDIGO : MUSTARD, { roughness: 0.8 })
    flap.scale.z = 0.4
    flap.position.set(Math.sin(a) * 0.045, 0.02, Math.cos(a) * 0.045)
    orient(flap, V(Math.sin(a), -0.6, Math.cos(a)))
    g.add(flap)
  }
  const head = sphere(0.085, SKIN, { roughness: 0.6 })
  head.position.y = 0.1
  g.add(head)
  for (const s of [-1, 1]) {
    const eye = sphere(0.019, '#ffffff', { roughness: 0.25 })
    eye.position.set(s * 0.03, 0.115, 0.072)
    const pupil = sphere(0.01, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(s * 0.03, 0.115, 0.088)
    g.add(eye, pupil)
    const cheek = sphere(0.016, CHEEK, { roughness: 0.7 })
    cheek.position.set(s * 0.052, 0.082, 0.064)
    g.add(cheek)
  }
  const smile = torus(0.026, 0.007, MOUTH_DARK, { roughness: 0.6 })
  smile.geometry.dispose()
  smile.geometry = new THREE.TorusGeometry(0.026, 0.007, 8, 20, Math.PI)
  smile.rotation.z = Math.PI
  smile.position.set(0, 0.085, 0.082)
  g.add(smile)
  const capM = mat(INDIGO, { roughness: 0.8 })
  const cap = shade(new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), capM))
  cap.position.y = 0.125
  g.add(cap)
  for (const s of [-1, 1]) {
    const pt = tube(
      [V(s * 0.03, 0.17, 0), V(s * 0.1, 0.24, 0), V(s * 0.16, 0.22, 0), V(s * 0.17, 0.16, 0.01)],
      (t) => 0.012 + 0.03 * (1 - t),
      s < 0 ? MUSTARD : JADE,
      { roughness: 0.8 },
      24,
      10,
    )
    g.add(pt)
    const b = bell(0.02)
    b.position.set(s * 0.17, 0.135, 0.01)
    g.add(b)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- base: gramado listrado do pátio + grande área -------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)

  const lawn = cylinder(2.58, 2.6, 0.06, GRASS, { roughness: 0.92 })
  lawn.position.y = GY - 0.03
  base.add(lawn)

  // listras de corte do gramado (faixas mais claras, cordas do disco)
  for (let i = -5; i <= 5; i += 2) {
    const zc = i * 0.42
    const edge = Math.abs(zc) + 0.21
    if (edge >= 2.5) continue
    const len = 2 * Math.sqrt(2.5 * 2.5 - edge * edge)
    const band = rbox(len, 0.008, 0.42, 0.004, GRASS_LIGHT, { roughness: 0.92 })
    band.position.set(0, GY + 0.002, zc)
    base.add(band)
  }

  // linha da grande área, alinhada com o gol
  const area = new THREE.Group()
  area.position.set(MOUTH_X, GY + 0.008, MOUTH_Z)
  area.rotation.y = MOUTH_YAW
  const AW = 1.3
  const AZ0 = 0.28
  const AZ1 = 1.28
  for (const [w, d, x, z] of [
    [AW * 2 + 0.06, 0.06, 0, AZ0],
    [AW * 2 + 0.06, 0.06, 0, AZ1],
    [0.06, AZ1 - AZ0, -AW, (AZ0 + AZ1) / 2],
    [0.06, AZ1 - AZ0, AW, (AZ0 + AZ1) / 2],
  ] as const) {
    const l = rbox(w, 0.012, d, 0.005, LINE, { roughness: 0.8 })
    l.position.set(x, 0, z)
    area.add(l)
  }
  const spot = cylinder(0.05, 0.05, 0.012, LINE, { roughness: 0.8 })
  spot.position.set(0, 0, 0.95)
  area.add(spot)
  base.add(area)

  // adereços do pátio (rng fixo)
  for (const [x, z, r, seed] of [[-1.95, -0.85, 0.24, 7], [1.95, -0.55, 0.2, 11]] as const) {
    const bush = puff(r, '#3f7a3a', 6, seed, { roughness: 0.9 })
    bush.position.set(x, GY + r * 0.6, z)
    bush.scale.y = 0.85
    base.add(bush)
  }
  const pedra = rock(0.13, STONE_DARK, 5, { roughness: 0.9 })
  pedra.position.set(1.9, GY + 0.04, 0.9)
  pedra.rotation.y = rand() * Math.PI
  base.add(pedra)
  const pedra2 = rock(0.09, STONE, 9, { roughness: 0.9 })
  pedra2.position.set(-2.05, GY + 0.03, 0.75)
  base.add(pedra2)
  for (const [x, z] of [[-1.6, 1.5], [0.5, 1.95], [2.2, 0.2]] as const) {
    const tuft = new THREE.Group()
    tuft.position.set(x, GY, z)
    for (let k = 0; k < 4; k++) {
      const blade = cone(0.025, 0.14 + rand() * 0.06, '#4a8a3a', { roughness: 0.9 })
      blade.position.set((rand() - 0.5) * 0.08, 0.07, (rand() - 0.5) * 0.08)
      blade.rotation.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5)
      tuft.add(blade)
    }
    base.add(tuft)
  }
  root.add(base)

  // ---- muralha de pedra em arco ao fundo -------------------------------------
  const muralha = new THREE.Group()
  const WR = 2.32
  const A0 = -Math.PI + 0.22
  const A1 = -0.22
  const ROW_H = 0.27
  const ROWS = 3
  const WALL_TOP = GY + ROWS * ROW_H

  // miolo de argamassa: setor de anel extrudado para cima
  const ring = new THREE.Shape()
  const RI = WR - 0.11
  const RO = WR + 0.11
  ring.absarc(0, 0, RO, -A0, -A1, true)
  ring.absarc(0, 0, RI, -A1, -A0, false)
  const coreGeo = new THREE.ExtrudeGeometry(ring, { depth: WALL_TOP - GY - 0.02, bevelEnabled: false, curveSegments: 48 })
  coreGeo.rotateX(-Math.PI / 2)
  const core = shade(new THREE.Mesh(coreGeo, mat(MORTAR, { roughness: 0.95, size: 2 })))
  core.position.y = GY
  muralha.add(core)

  const tones = [STONE, STONE_LIGHT, STONE_DARK]
  const BLOCK = 0.47
  const arcLen = (A1 - A0) * WR
  const nBlocks = Math.floor(arcLen / BLOCK)
  for (let r = 0; r < ROWS; r++) {
    const shift = r % 2 ? 0.5 : 0
    for (let i = 0; i < nBlocks + (r % 2 ? 0 : 1); i++) {
      const s = (i + shift) / nBlocks
      if (s > 1.0001) continue
      const a = A0 + s * (A1 - A0)
      const w = r % 2 === 0 && (i === 0 || i === nBlocks) ? BLOCK * 0.5 : BLOCK
      const blk = rbox(w - 0.025, ROW_H - 0.025, 0.28, 0.035, tones[Math.floor(rand() * 3)], {
        roughness: 0.9,
      })
      blk.position.set(Math.cos(a) * WR, GY + ROW_H * (r + 0.5), Math.sin(a) * WR)
      blk.rotation.y = -a - Math.PI / 2
      muralha.add(blk)
    }
  }
  // ameias
  for (let i = 0; i <= nBlocks; i += 2) {
    const a = A0 + (i / nBlocks) * (A1 - A0)
    const merlon = rbox(0.38, 0.26, 0.3, 0.04, tones[Math.floor(rand() * 3)], { roughness: 0.9 })
    merlon.position.set(Math.cos(a) * WR, WALL_TOP + 0.13, Math.sin(a) * WR)
    merlon.rotation.y = -a - Math.PI / 2
    muralha.add(merlon)
  }
  root.add(muralha)

  // ---- bandeirola vermelha no alto da muralha ------------------------------
  const FLAG_A = A0 + ((nBlocks - 2) / nBlocks) * (A1 - A0)
  const bandeira = new THREE.Group()
  bandeira.position.set(Math.cos(FLAG_A) * WR, WALL_TOP + 0.26, Math.sin(FLAG_A) * WR)
  const pole = cylinder(0.022, 0.026, 0.8, WOOD, { roughness: 0.7 })
  pole.position.y = 0.4
  bandeira.add(pole)
  const knob = sphere(0.04, GOLD, { roughness: 0.25, metalness: 0.85 })
  knob.position.y = 0.82
  bandeira.add(knob)
  const tri = new THREE.Shape()
  tri.moveTo(0, 0.13)
  tri.quadraticCurveTo(0.28, 0.06, 0.56, 0.0)
  tri.quadraticCurveTo(0.28, -0.03, 0, -0.13)
  tri.lineTo(0, 0.13)
  const flagGeo = new THREE.ExtrudeGeometry(tri, {
    depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2,
  })
  const flag = shade(new THREE.Mesh(flagGeo, mat(PENNANT, { roughness: 0.85, size: 0.5 })))
  flag.position.set(0.02, 0.64, -0.01)
  bandeira.add(flag)
  root.add(bandeira)

  // ---- boca-gol gigante -----------------------------------------------------
  const boca = new THREE.Group()
  boca.position.set(MOUTH_X, GY, MOUTH_Z)
  boca.rotation.y = MOUTH_YAW
  root.add(boca)

  // garganta: meia-casca escura aberta para a frente
  const throatMat = mat(THROAT, { roughness: 0.85, size: 1.5 })
  throatMat.side = THREE.DoubleSide
  const throat = shade(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), throatMat))
  throat.rotation.x = -Math.PI / 2
  throat.scale.set(LA - 0.03, 0.5, 0.72)
  throat.position.set(0, MCY, 0)
  boca.add(throat)

  // lábios carnudos: dois tubos de raio variável, arco de cupido no de cima
  const labios = new THREE.Group()
  labios.scale.z = 1.25
  boca.add(labios)
  const upperPts: THREE.Vector3[] = []
  for (let i = 0; i <= 32; i++) {
    const th = (i / 32) * Math.PI
    const t = i / 32
    const dip = 0.07 * Math.exp(-(((t - 0.5) / 0.055) ** 2))
    upperPts.push(V(LA * Math.cos(th), MCY + LBU * Math.sin(th) - dip, 0))
  }
  const upper = tube(
    upperPts,
    (t) =>
      0.07 + 0.09 * Math.sin(Math.PI * t) ** 0.5 +
      0.03 * (Math.exp(-(((t - 0.4) / 0.07) ** 2)) + Math.exp(-(((t - 0.6) / 0.07) ** 2))),
    LIP,
    { roughness: 0.28 },
    96,
    20,
  )
  labios.add(upper)
  const lowerPts: THREE.Vector3[] = []
  for (let i = 0; i <= 32; i++) {
    const th = Math.PI + (i / 32) * Math.PI
    lowerPts.push(V(LA * Math.cos(th), MCY + LBL * Math.sin(th), 0))
  }
  const lower = tube(lowerPts, (t) => 0.07 + 0.15 * Math.sin(Math.PI * t) ** 0.6, LIP, { roughness: 0.28 }, 96, 20)
  labios.add(lower)
  for (const s of [-1, 1]) {
    const corner = sphere(0.085, LIP_DARK, { roughness: 0.35 })
    corner.position.set(s * LA, MCY, 0)
    labios.add(corner)
  }

  // dentes de cima (seis) e de baixo (quatro), por dentro dos lábios
  for (let i = 0; i < 6; i++) {
    const x = -0.42 + i * 0.168
    const t = 0.5 + x / (2 * LA)
    const edge = MCY + LBU * Math.sqrt(1 - (x / LA) ** 2) - (0.07 + 0.09 * Math.sin(Math.PI * t) ** 0.5)
    const tooth = rbox(0.15, 0.17, 0.09, 0.04, TOOTH, { roughness: 0.25 })
    tooth.position.set(x, edge - 0.04, -0.02)
    boca.add(tooth)
  }
  for (let i = 0; i < 4; i++) {
    const x = -0.3 + i * 0.2
    const t = 0.5 - x / (2 * LA)
    const edge = MCY - LBL * Math.sqrt(1 - (x / LA) ** 2) + (0.07 + 0.15 * Math.sin(Math.PI * t) ** 0.6)
    const tooth = rbox(0.15, 0.13, 0.09, 0.04, TOOTH, { roughness: 0.25 })
    tooth.position.set(x, edge + 0.02, -0.05)
    boca.add(tooth)
  }

  // campainha (úvula) pendurada no céu da boca
  const uvula = capsule(0.045, 0.1, UVULA, { roughness: 0.5 })
  uvula.position.set(-0.02, MCY + 0.3, -0.3)
  boca.add(uvula)

  // ---- a NET: rede branca quadriculada, estufada pra trás ---------------------
  const rede = new THREE.Group()
  boca.add(rede)
  const netDepth = (x: number, y: number) => {
    const bb = y >= 0 ? NBU : NBL
    const rho2 = Math.min(1, (x / NA) ** 2 + (y / bb) ** 2)
    const fade = Math.sqrt(1 - rho2)
    const dx = x - BALL_AT[0]
    const dy = y - BALL_AT[1]
    const dent = 0.24 * Math.exp(-(dx * dx + dy * dy) / (2 * 0.16 * 0.16))
    return (0.22 + dent) * fade
  }
  const netPoint = (x: number, y: number) => V(x, MCY + y, NZ - netDepth(x, y))
  const netR = () => 0.012
  for (let y = -NBL + 0.06; y < NBU - 0.03; y += 0.1) {
    const bb = y >= 0 ? NBU : NBL
    const xm = NA * Math.sqrt(Math.max(0, 1 - (y / bb) ** 2))
    const pts: THREE.Vector3[] = []
    for (let k = 0; k <= 16; k++) pts.push(netPoint(-xm + (2 * xm * k) / 16, y))
    rede.add(tube(pts, netR, NET, { roughness: 0.7, detail: 0 }, 40, 6))
  }
  for (let x = -NA + 0.07; x < NA - 0.03; x += 0.105) {
    const ym = Math.sqrt(Math.max(0, 1 - (x / NA) ** 2))
    const pts: THREE.Vector3[] = []
    for (let k = 0; k <= 14; k++) {
      const y = -NBL * ym + ((NBU + NBL) * ym * k) / 14
      pts.push(netPoint(x, y))
    }
    rede.add(tube(pts, netR, NET, { roughness: 0.7, detail: 0 }, 40, 6))
  }

  // ---- BOBO DA CORTE --------------------------------------------------------
  const bobo = new THREE.Group()
  bobo.position.set(BOBO_X, GY, BOBO_Z)
  bobo.rotation.y = BOBO_YAW
  bobo.rotation.z = LEAN
  bobo.scale.setScalar(BOBO_S)
  root.add(bobo)

  const corpo = person({ body: MUSTARD, skin: SKIN, height: 1.5, armAngle: 0.35 })
  bobo.add(corpo)
  const bodyMesh = corpo.getObjectByName('body') as THREE.Mesh
  paintHarlequin(bodyMesh, bodyMesh.position.y)

  // mangas em duas cores (mi-parti)
  const armR = corpo.getObjectByName('armR') as THREE.Mesh
  const armL = corpo.getObjectByName('armL') as THREE.Mesh
  armR.material = mat(INDIGO, { roughness: 0.8, size: 0.5 })
  armL.material = mat(MUSTARD, { roughness: 0.8, size: 0.5 })
  shoulderPivot(armR, 1.5)
  shoulderPivot(armL, 1.5)
  armR.rotation.set(ARM_TILT, 0, ARM_HIGH)
  armL.rotation.set(0.25, 0, -1.2) // braço de equilíbrio, aberto

  // gola de pontas com guizos
  const NECK_Y = 0.76
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.31
    const dir = V(Math.sin(a), -0.55, Math.cos(a)).normalize()
    const flap = cone(0.085, 0.24, i % 2 ? INDIGO : CREAM, { roughness: 0.8 })
    flap.scale.z = 0.35
    flap.position.set(Math.sin(a) * 0.17, NECK_Y, Math.cos(a) * 0.17).add(dir.clone().multiplyScalar(0.12))
    orient(flap, dir)
    corpo.add(flap)
    if (i % 2 === 0) {
      const b = bell(0.032)
      b.position.copy(flap.position).add(dir.clone().multiplyScalar(0.13))
      corpo.add(b)
    }
  }

  // sapatos de bico enrolado
  for (const s of [-1, 1]) {
    const shoe = rbox(0.16, 0.09, 0.25, 0.04, INDIGO_DARK, { roughness: 0.6 })
    shoe.position.set(s * 0.12, 0.045, 0.08)
    corpo.add(shoe)
    const curl = tube(
      [V(s * 0.12, 0.05, 0.14), V(s * 0.125, 0.055, 0.27), V(s * 0.13, 0.1, 0.37), V(s * 0.13, 0.16, 0.38), V(s * 0.13, 0.19, 0.32)],
      (t) => 0.018 + 0.042 * (1 - t),
      INDIGO_DARK,
      { roughness: 0.6 },
      32,
      12,
    )
    corpo.add(curl)
    const b = bell(0.03)
    b.position.set(s * 0.13, 0.2, 0.3)
    corpo.add(b)
  }

  // rosto: boca aberta gritando, bochechas coradas
  const head = corpo.getObjectByName('head') as THREE.Group
  const grito = sphere(0.075, MOUTH_DARK, { roughness: 0.6 })
  grito.scale.set(1.15, 0.85, 0.5)
  grito.position.set(0, -0.135, 0.262)
  head.add(grito)
  const lingua = sphere(0.04, UVULA, { roughness: 0.5 })
  lingua.scale.set(1.1, 0.45, 0.6)
  lingua.position.set(0, -0.172, 0.285)
  head.add(lingua)
  for (const s of [-1, 1]) {
    const cheek = sphere(0.055, CHEEK, { roughness: 0.7 })
    cheek.scale.z = 0.35
    cheek.position.set(s * 0.175, -0.065, 0.24)
    cheek.rotation.y = s * 0.55
    head.add(cheek)
  }

  // ---- chapéu de bobo: três pontas moles com guizos -------------------------
  const chapeu = new THREE.Group()
  head.add(chapeu)
  const capMesh = shade(
    new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(INDIGO, { roughness: 0.8, size: 0.6 }),
    ),
  )
  capMesh.scale.set(0.325, 0.28, 0.325)
  capMesh.position.y = 0.1
  chapeu.add(capMesh)
  const band = torus(0.318, 0.042, MUSTARD, { roughness: 0.75 })
  band.rotation.x = Math.PI / 2
  band.position.y = 0.1
  chapeu.add(band)
  const taper = (t: number) => 0.032 + 0.1 * (1 - t) ** 1.1
  const pontas: [THREE.Vector3[], string][] = [
    [[V(-0.14, 0.24, 0), V(-0.32, 0.42, -0.02), V(-0.48, 0.4, -0.1), V(-0.55, 0.24, -0.2), V(-0.52, 0.08, -0.26)], MUSTARD],
    [[V(0, 0.3, 0), V(0, 0.52, -0.02), V(-0.04, 0.7, -0.06), V(-0.14, 0.8, -0.1), V(-0.25, 0.76, -0.12)], JADE],
    [[V(0.14, 0.24, 0), V(0.32, 0.42, -0.02), V(0.48, 0.4, -0.1), V(0.55, 0.24, -0.2), V(0.52, 0.08, -0.26)], MUSTARD],
  ]
  for (const [pts, color] of pontas) {
    chapeu.add(tube(pts, taper, color, { roughness: 0.8 }, 40, 16))
    const end = pts[pts.length - 1]
    const b = bell(0.055)
    b.position.set(end.x, end.y - 0.05, end.z)
    chapeu.add(b)
  }

  // ---- cetro de cana com cabecinha de bobo (filho da mão do braço) -----------
  const hand = armR.children[0]
  const cetro = new THREE.Group()
  cetro.position.copy(hand.position)
  cetro.rotation.set(0, 0, CANE_Z)
  armR.add(cetro)
  const CANE_BOTTOM = -0.26
  const CANE_TOP = 0.86
  const nodes = 6
  for (let i = 0; i < nodes; i++) {
    const y0 = CANE_BOTTOM + ((CANE_TOP - CANE_BOTTOM) * i) / nodes
    const y1 = CANE_BOTTOM + ((CANE_TOP - CANE_BOTTOM) * (i + 1)) / nodes
    const seg = cylinder(0.036, 0.04, y1 - y0 - 0.01, i % 2 ? CANE : CANE_DARK, { roughness: 0.55 }, 16)
    seg.position.y = (y0 + y1) / 2
    cetro.add(seg)
    const node = torus(0.041, 0.012, CANE_NODE, { roughness: 0.6 })
    node.rotation.x = Math.PI / 2
    node.position.y = y1
    cetro.add(node)
  }
  const pommel = sphere(0.045, CANE_NODE, { roughness: 0.6 })
  pommel.position.y = CANE_BOTTOM
  cetro.add(pommel)
  const mini = marotte()
  mini.position.y = CANE_TOP
  cetro.add(mini)

  // ---- posições da bola: rebatida no ar ao lado do bobo, afundada na net -------
  // o ponto de rebatida fica no arco do golpe (lado do gol, altura do quadril);
  // medido com o corpo ainda reto, como está no instante do golpe
  bobo.rotation.z = 0
  root.updateMatrixWorld(true)
  const ballStart = bobo.localToWorld(STRIKE.clone())
  bobo.rotation.z = LEAN
  root.updateMatrixWorld(true)

  const ballFinal = boca.localToWorld(
    V(BALL_AT[0], MCY + BALL_AT[1], NZ - netDepth(BALL_AT[0], BALL_AT[1]) + BALL_R * 0.75),
  )

  // ---- bola de futebol ---------------------------------------------------------
  const bola = new THREE.Group()
  bola.position.copy(ballFinal)
  bola.rotation.set(0.4, 0.6, 0.2)
  root.add(bola)
  bola.add(sphere(BALL_R, BALL_W, { roughness: 0.4 }))
  const PHI = (1 + Math.sqrt(5)) / 2
  const icoDirs: THREE.Vector3[] = []
  for (const a of [-1, 1]) {
    for (const b of [-PHI, PHI]) {
      icoDirs.push(V(0, a, b), V(a, b, 0), V(b, 0, a))
    }
  }
  for (const d of icoDirs) {
    d.normalize()
    const patch = cylinder(0.062, 0.062, 0.03, BALL_K, { roughness: 0.45 }, 5)
    patch.position.copy(d).multiplyScalar(BALL_R - 0.008)
    patch.quaternion.setFromUnitVectors(V(0, 1, 0), d)
    bola.add(patch)
  }

  // ---- três linhas de movimento entre o bobo e a bola --------------------------
  const flight = ballFinal.clone().sub(ballStart)
  const rastro = new THREE.Group()
  rastro.position.copy(ballStart).add(flight.clone().multiplyScalar(0.07))
  {
    const xAxis = flight.clone().normalize()
    const yAxis = V(0, 1, 0).sub(xAxis.clone().multiplyScalar(xAxis.y)).normalize()
    const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis)
    rastro.setRotationFromMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis))
  }
  const span = flight.length()
  for (const [x0, len, oy, oz] of [
    [0.03, 0.3, 0.12, 0.1],
    [0.0, 0.38, 0.0, -0.06],
    [0.07, 0.26, -0.12, 0.08],
  ] as const) {
    const L = len * span
    const streak = capsule(0.017, L, '#ffffff', { roughness: 0.5 })
    streak.rotation.z = Math.PI / 2
    streak.position.set(x0 * span + L / 2, oy, oz)
    rastro.add(streak)
  }
  root.add(rastro)

  // ---- dois anéis de eco saindo da boca (o segundo menor e mais apagado) -------
  const eco1Pos = boca.localToWorld(V(0.5, MCY + LBU + 0.3, 0.35))
  const eco2Pos = boca.localToWorld(V(0.82, MCY + LBU + 0.66, 0.5))
  const ecoDir = boca.localToWorld(V(0.45, 0.4, 1)).sub(boca.localToWorld(V(0, 0, 0))).normalize()
  const ecoStart = boca.localToWorld(V(0, MCY + 0.2, 0.1))
  const eco1 = torus(0.27, 0.032, ECHO1, { roughness: 0.6 })
  eco1.position.copy(eco1Pos)
  eco1.quaternion.setFromUnitVectors(V(0, 0, 1), ecoDir)
  root.add(eco1)
  const eco2 = torus(0.17, 0.024, ECHO2, { roughness: 0.6 })
  eco2.position.copy(eco2Pos)
  eco2.quaternion.setFromUnitVectors(V(0, 0, 1), ecoDir)
  root.add(eco2)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'patio', object: base },
    { name: 'muralha', group: 'patio', object: muralha },
    { name: 'bandeira', group: 'patio', object: bandeira },
    { name: 'boca', group: 'boca', object: boca },
    { name: 'rede', group: 'boca', object: rede },
    { name: 'bobo', group: 'bobo', object: bobo },
    { name: 'braco', group: 'bobo', object: armR },
    { name: 'chapeu', group: 'bobo', object: chapeu },
    { name: 'cetro', group: 'cana', object: cetro },
    { name: 'bola', group: 'cana', object: bola },
    { name: 'rastro', group: 'gol', object: rastro },
    { name: 'eco1', group: 'eco', object: eco1 },
    { name: 'eco2', group: 'eco', object: eco2 },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Último segundo da final, no gramado do pátio do castelo…',
    }),
    seq('muralha-rise', 'muralha', 0.25, 0.9, [riseFrom(0, 1.4)], { ease: 'easeOut' }),
    seq('bandeira-grow', 'bandeira', 0.9, 0.5, grow(), { ease: 'easeOut' }),

    seq('boca-grow', 'boca', 1.7, 0.9, grow(), {
      ease: 'easeOut',
      caption: 'O gol do rei é uma BÚCA gigante, de lábios vermelhos — e lá no fundo da garganta, a NET.',
    }),
    seq('rede-estica', 'rede', 2.35, 0.6, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('bobo-rise', 'bobo', 3.6, 0.85, [riseFrom(GY, 2.4), ch('rotation.z', 0, 0)], {
      ease: 'easeOut',
      caption: 'Entra o bobo da corte, sem chuteira, com um cetro de CANA de taco: CA-NIÁ!',
    }),
    seq('braco-arma', 'braco', 3.6, 0.85, [ch('rotation.z', -0.35, ARM_LOW)], { ease: 'easeOut' }),
    seq('chapeu-poe', 'chapeu', 3.9, 0.5, [...grow(), ch('position.y', 0.35, 0)], { ease: 'easeOut' }),
    seq('cetro-surge', 'cetro', 4.35, 0.5, grow(), { ease: 'easeOut' }),
    seq('bola-surge', 'bola', 5.0, 0.3, grow(), { ease: 'easeOut' }),
    seq('bola-cai', 'bola', 5.0, 0.9, [ch('position.y', ballStart.y + 1.9, ballStart.y)], { ease: 'easeIn' }),

    // o golpe: braço e taco varrem de baixo para o alto, o corpo acompanha
    seq('braco-golpe', 'braco', 5.9, 0.32, [ch('rotation.z', ARM_LOW, ARM_HIGH), ch('rotation.x', 0, ARM_TILT)], {
      ease: 'easeOut',
      caption: 'A bola vem caindo e ele rebate antes do apito que encerra a parTÍDa…',
    }),
    seq('cetro-golpe', 'cetro', 5.9, 0.32, [ch('rotation.x', CANE_X_LOW, 0)], { ease: 'easeOut' }),
    seq('bobo-inclina', 'bobo', 5.9, 0.4, [ch('rotation.z', 0, LEAN)], { ease: 'easeOut' }),
    seq(
      'bola-voa',
      'bola',
      5.98,
      0.5,
      [
        ch('position.x', ballStart.x, ballFinal.x),
        ch('position.y', ballStart.y, ballFinal.y),
        ch('position.z', ballStart.z, ballFinal.z),
        ch('rotation.x', -5, 0.4),
      ],
      { ease: 'linear' },
    ),
    seq('rastro-risca', 'rastro', 6.02, 0.45, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),

    // a bola estufa a NET
    seq('rede-estufa', 'rede', 6.45, 0.2, [ch('scale.z', 0.2, 1.3)], {
      ease: 'easeOut',
      caption: '…a bola some pela BÚCA e estufa a NET lá no fundo: PÔ, NET!',
    }),
    seq('rede-volta', 'rede', 6.65, 0.35, [ch('scale.z', 1.3, 1)]),

    // o eco que a garganta devolve, mais fraco
    seq(
      'eco1-sai',
      'eco1',
      7.7,
      0.7,
      [
        ...grow(),
        ch('position.x', ecoStart.x, eco1Pos.x),
        ch('position.y', ecoStart.y, eco1Pos.y),
        ch('position.z', ecoStart.z, eco1Pos.z),
      ],
      { ease: 'easeOut', caption: 'E a garganta gigante devolve o eco, mais fraquinho: NET… et! — NÉ-TET.' },
    ),
    seq(
      'eco2-sai',
      'eco2',
      8.2,
      0.7,
      [
        ...grow(),
        ch('position.x', ecoStart.x, eco2Pos.x),
        ch('position.y', ecoStart.y, eco2Pos.y),
        ch('position.z', ecoStart.z, eco2Pos.z),
      ],
      { ease: 'easeOut' },
    ),

    // ofegante, ele pergunta ao rei — os guizos tilintam
    seq('chapeu-guizo', 'chapeu', 9.3, 0.35, [ch('rotation.z', 0, 0.14)], {
      ease: 'easeOut',
      caption: 'Marcar gol, marcar horário: ofegante, o bobo pergunta ao rei se dá pra marcar assim, pela net.',
    }),
    seq('chapeu-volta', 'chapeu', 9.65, 0.4, [ch('rotation.z', 0.14, -0.06)]),
    seq('chapeu-assenta', 'chapeu', 10.05, 0.35, [ch('rotation.z', -0.06, 0)]),

    seq('bandeira-tremula', 'bandeira', 10.8, 0.5, [ch('rotation.y', 0, 0.3)], {
      caption: 'Kan jag boka tid på nätet? — Posso marcar horário pela internet?',
    }),
    seq('bandeira-volta', 'bandeira', 11.3, 0.6, [ch('rotation.y', 0.3, 0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.45, 5.45], target: [-0.02, 1.18, -0.25] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-boka-tid-pa-natet',
    contexto:
      "Serviços: ao telefone ou no balcão da vårdcentral, do Skatteverket, da polícia (passaporte), do Migrationsverket, do dentista ou do cabeleireiro — quase tudo na Suécia tem 'boka tid' online, muitas vezes com BankID. A resposta comum: 'Ja, du kan boka via vår webbplats' ou 'i appen'.",
    fraseFonte: 'Posso marcar horário pela internet?',
    fraseAlvo: 'Kan jag boka tid på nätet?',
    pronuncia:
      "ka-niá BÚÚ-ka TÍÍD pô NÉÉ-tet? ('kan jag' = ka-niá, o G mudo; 'boka' com U FECHADO e longo — o 'o' longo sueco, nunca o Ô de 'boca' — e o -ka fraco; 'tid' com T seco, I longo e D leve; 'på' = PÔ fechado e sem força; 'nätet' com a força no NÄ — É bem aberto e LONGO — e o -tet fraco, T duro nas duas pontas: é 'nät' (rede, internet) + o artigo '-et' colado no fim; a frase sobe no TÍD e no NÄ)",
    ponteSonora:
      "CA-NIÁ! BÚCA... (par)TÍD... PÔ, NÉ-TET? (8 sílabas: ka-niá-BÚÚ-ka-TÍÍD-pô-NÉÉ-tet; força no BÚ, no TÍD e no NÉ, a maior no TÍD; CA-NIÁ é a CANA + IÁ de 'Kan jag få en påse?', 'Kan jag betala med kort?' e 'Kan jag byta den här?', emendado — I de IOGA, nunca o J chiado de 'canja'; BÚCA = a BOCA dita à caipira, 'BÚ-ca', a MESMA de 'Jag skulle vilja boka en tid' e o BÚ de 'Hur bokar man tvättstugan?': U FECHADO e LONGO — é o 'o' longo sueco —, nunca o Ô do 'bôca' português, que puxa pra outra vogal; o -ca fraquinho, K duro; TÍD = o parTÍD(a) — aqui, a própria partida de futebol —, a MESMA ponte de 'tid' de 'Har du tid en stund?' e 'Hur lång tid tar det?': T SECO de 'tatu', nunca 'tchi', I LONGO e D leve; PÔ = o 'pô!' brasileiro, Ô FECHADO, o mesmo 'på' de 'Grattis på födelsedagen' e 'Kan du skicka det på mejl?', sem força; NÉ-TET = a NET + o ECO dela: NET é a rede do gol e a internet ao mesmo tempo ('caiu a net') — no sueco também, 'nät' é rede de gol, de pesca e a internet —, com NÉ de É bem ABERTO e LONGO, como o 'né?' esticado de quem duvida, e T DURO, sem o 'tchi' que o português gruda no fim; o -tet é o ECO que a garganta gigante devolve, mais fraco — 'NET... et!' —: É aberto curtinho e T seco, colado no T da NET, NÉÉ-tet, duas sílabas com a força só no NÉ; esse -ET é o artigo 'a' colado DEPOIS da palavra, a mesma vogal e o mesmo T do ÉT de 'ett': 'ett nät' é UMA rede, 'nätet' é A rede — sem o eco sobra 'nät', e 'på nät' não se diz; e nunca o 'é-TÊ' do extraterrestre; e não é a rede de dormir da lebre de 'Kanske senare', que só empresta o sopro RRE: aqui a palavra é NET)",
    historia:
      "Último segundo da final no pátio do castelo: o bobo da corte, sem chuteira, ergue o cetro de CANA feito taco de hóquei e grita CA-NIÁ!, e o gol do rei é uma BÚCA gigante — uma boca de lábios vermelhos escancarada no meio do gramado. Ele rebate antes do apito que encerra a parTÍDa, a bola some pela boca e estufa a NET lá no fundo da garganta — PÔ, NET! —, e a garganta gigante devolve o eco, mais fraquinho: ...et! Em português, marcar gol e marcar horário é o mesmo verbo — e o bobo, ofegante, pergunta ao rei se a audiência dele também dá pra marcar assim: pela net.",
  },
  createScene,
}

export default card
