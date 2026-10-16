import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Kan jag lämna ett meddelande?" — na recepção, quem anota os recados é a
 * secretária ELÉTRICA: uma enguia num aquário cilíndrico alto, enrolada num
 * LEME de enfeite, com o fio do telefone mergulhado na água. Todo mundo tem
 * MEDO DELA; então o bilhete vai numa garrafinha de ÉTER, empurrada com a
 * ponta de uma CANA (cana não dá choque): CA-NIÁ… LEME-NA… ÉT… MEDO DELA…
 * ANDE! Ela abocanha a garrafa e acende de azul — BIP!
 *
 * Diorama: piso de ladrilho claro; balcão de madeira clara com tampo cinza;
 * no meio dele o aquário (protagonista), telefone preto à esquerda, cana
 * entrando em diagonal pela borda direita. Acento azul-elétrico reservado às
 * faíscas (e ao brilho da enguia).
 */

const SOIL = '#2b2622'
const TILE = '#c4bcb0'
const TILE_LINE = '#a39b8f'
const OAK = '#d7b68b'
const OAK_DARK = '#b8915f'
const SLATE = '#868e95'
const SLATE_DARK = '#5d656c'
const PLINTH = '#48423c'
const PHONE = '#1f1e22'
const CHROME = '#cfd4d9'
const DIAL = '#ece7da'
const GLASS = '#d3ebf2'
const WATER = '#7fc0cc'
const SURFACE = '#b4e2ea'
const RIM = '#2a2e33'
const GRAVEL = '#d2bd94'
const PLANT = '#4f9a55'
const PLANT_DARK = '#3b7a43'
const WOOD = '#9b6136'
const WOOD_DARK = '#6b3d1f'
const BRASS = '#c49a45'
const EEL = '#4d5544'
const BELLY = '#d98a40'
const MOUTH = '#4a2227'
const BOTTLE = '#bfe6b8'
const LABEL = '#fbf9f2'
const INK = '#1e2a46'
const PAPER = '#f3ead2'
const CORK = '#b98b59'
const CANE = '#6d4268'
const CANE_NODE = '#a3a85e'
const CANE_PITH = '#e3d9a8'
const SPARK = '#a6f4ff'
const SPARK_GLOW = '#1fb3ff' // acento: azul elétrico, RESERVADO às faíscas e ao brilho
const MEMO = '#f1e4a6'

const Y = new THREE.Vector3(0, 1, 0)

const GY = 0.18 // topo do piso
const TOP = 0.72 // tampo do balcão
const CW = 2.7
const CD = 1.25
const CZ = -0.2

// aquário (origem no tampo do balcão, no eixo do cilindro)
const AQX = 0.12
const AQZ = -0.2
const AR = 0.6 // raio do vidro
const G0 = 0.08 // fundo (topo do pé preto)
const GT = 0.17 // topo do cascalho
const AH = 1.55
const RIM_Y = G0 + AH
const WATER_Y = G0 + 1.45

// leme (no espaço do aquário)
const W = new THREE.Vector3(-0.04, 0.56, -0.1)
const W_YAW = -0.12
const WR = 0.3 // raio do aro
const COIL = 0.1 // raio da hélice da enguia em volta do aro

// cabeça da enguia e ponto onde a cana apoia na borda (espaço do aquário)
const HEAD = new THREE.Vector3(0.19, 1.07, 0.06)
const RIM_PHI = 0.3
const CANE_R = 0.034
const CANE_LEN = 2.1

// garrafinha
const BR = 0.078
const B_LEN = 0.39

// telefone
const PX = -0.95
const PZ = 0.0
const P_YAW = 0.3

const CAM: [number, number, number] = [0.2, 2.35, 3.15]
const CAM_TARGET: [number, number, number] = [0.12, 1.5, -0.15]

/** Tubo fechado de raio variável ao longo de uma curva (com tampas). */
function closedTube(
  curve: THREE.Curve<THREE.Vector3>,
  radius: (t: number) => number,
  steps: number,
  radial: number,
) {
  const frames = curve.computeFrenetFrames(steps, false)
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const P = new THREE.Vector3()
  const row = radial + 1
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    curve.getPointAt(t, P)
    const r = radius(t)
    const N = frames.normals[i]
    const B = frames.binormals[i]
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2
      const c = -Math.cos(a)
      const s = Math.sin(a)
      pos.push(
        P.x + r * (c * N.x + s * B.x),
        P.y + r * (c * N.y + s * B.y),
        P.z + r * (c * N.z + s * B.z),
      )
      uv.push(t * 6, j / radial)
    }
  }
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * row + j
      const b = (i + 1) * row + j
      const c = (i + 1) * row + j + 1
      const d = i * row + j + 1
      idx.push(a, b, d, b, c, d)
    }
  }
  // tampas: vértices próprios (normal chapada), em leque a partir do centro
  for (const i of [0, steps]) {
    curve.getPointAt(i / steps, P)
    const center = pos.length / 3
    pos.push(P.x, P.y, P.z)
    uv.push(0.5, 0.5)
    const start = pos.length / 3
    for (let j = 0; j <= radial; j++) {
      const k = (i * row + j) * 3
      pos.push(pos[k], pos[k + 1], pos[k + 2])
      uv.push(0.5 + 0.5 * Math.cos((j / radial) * Math.PI * 2), 0.5 + 0.5 * Math.sin((j / radial) * Math.PI * 2))
    }
    for (let j = 0; j < radial; j++) {
      if (i === 0) idx.push(center, start + j, start + j + 1)
      else idx.push(center, start + j + 1, start + j)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

/** Fio espiral de telefone: hélice em volta de um caminho. */
function coilCord(path: THREE.Vector3[], coilR: number, wireR: number, pitch: number) {
  const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal')
  const turns = Math.max(4, Math.round(curve.getLength() / pitch))
  const per = 12
  const n = turns * per
  const frames = curve.computeFrenetFrames(n, false)
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= n; i++) {
    const p = curve.getPointAt(i / n)
    // as pontas saem retas do encaixe: a hélice abre nos primeiros/últimos 4%
    const k = Math.min(1, Math.min(i, n - i) / (n * 0.04))
    const a = (i / per) * Math.PI * 2
    p.addScaledVector(frames.normals[i], coilR * k * Math.cos(a))
    p.addScaledVector(frames.binormals[i], coilR * k * Math.sin(a))
    pts.push(p)
  }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, wireR, 6, false)
  const m = new THREE.Mesh(geo, mat(PHONE, { roughness: 0.35 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Material de vidro/água: camadas transparentes com ordem fixa. */
function glassMat(color: string, opacity: number, side: THREE.Side) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.06, metalness: 0.1, transparent: true, opacity, depthWrite: false, side,
  })
}

/** Traço de letra: caixinha fina de tinta em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.006, 0.003, INK, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** É e T de traço grosso para o rótulo da garrafinha. */
function glyph(which: 'E' | 'T') {
  const g = new THREE.Group()
  const t = 0.017
  const h = 0.07
  if (which === 'E') {
    g.add(stroke(t, h, -0.018, 0))
    g.add(stroke(0.05, t, 0.0, h / 2 - t / 2))
    g.add(stroke(0.042, t, -0.004, 0))
    g.add(stroke(0.05, t, 0.0, -h / 2 + t / 2))
    g.add(stroke(t * 0.9, 0.03, 0.006, h / 2 + 0.024, -0.75)) // acento agudo
  } else {
    g.add(stroke(0.058, t, 0, h / 2 - t / 2))
    g.add(stroke(t, h, 0, 0))
  }
  return g
}

/** Raio em zigue-zague (traços emissivos) ao longo de +y. */
function bolt(len: number, glow: ReturnType<typeof mat>) {
  const g = new THREE.Group()
  const zig: [number, number][] = [[0, 0], [0.06, 0.07], [-0.035, 0.13], [0.05, 0.2], [0.0, 0.27]]
  const k = len / 0.27
  for (let i = 0; i < zig.length - 1; i++) {
    const [x0, y0] = zig[i]
    const [x1, y1] = zig[i + 1]
    const dx = (x1 - x0) * k
    const dy = (y1 - y0) * k
    const L = Math.hypot(dx, dy)
    const seg = rbox(0.036, L + 0.03, 0.036, 0.014, SPARK)
    seg.material = glow
    seg.castShadow = false
    seg.position.set(((x0 + x1) / 2) * k, ((y0 + y1) / 2) * k, 0)
    seg.rotation.z = -Math.atan2(dx, dy)
    g.add(seg)
  }
  const tip = cone(0.032, 0.08, SPARK)
  tip.material = glow
  tip.castShadow = false
  tip.position.set(0, len + 0.02, 0)
  g.add(tip)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  const AQ = new THREE.Vector3(AQX, TOP, AQZ)
  const camL = new THREE.Vector3(...CAM).sub(AQ) // câmera no espaço do aquário

  // leme/enguia: transformação do espaço do leme para o do aquário
  const qW = new THREE.Quaternion().setFromAxisAngle(Y, W_YAW)
  const qWinv = qW.clone().invert()
  const toWheel = (v: THREE.Vector3) => v.clone().sub(W).applyQuaternion(qWinv)

  // linha da cana: da cabeça até o ponto de apoio na borda do vidro
  const RIM_P = new THREE.Vector3(
    AR * Math.cos(RIM_PHI), RIM_Y + 0.02 + CANE_R, AR * Math.sin(RIM_PHI),
  )
  const D = RIM_P.clone().sub(HEAD).normalize()

  // ---- base do diorama: ladrilho claro de escritório ------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const floor = cylinder(2.55, 2.62, 0.07, TILE, { roughness: 0.45 })
  floor.position.y = 0.145
  base.add(floor)

  for (let v = -2.25; v <= 2.26; v += 0.5) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - v * v, 0.01))
    const lx = rbox(len, 0.012, 0.024, 0.005, TILE_LINE, { roughness: 0.7 })
    lx.position.set(0, GY + 0.002, v)
    base.add(lx)
    const lz = rbox(0.024, 0.012, len, 0.005, TILE_LINE, { roughness: 0.7 })
    lz.position.set(v, GY + 0.002, 0)
    base.add(lz)
  }

  // vaso de planta alta no fundo à esquerda
  const vaso = new THREE.Group()
  vaso.position.set(-1.75, GY, -1.55)
  vaso.add(lathe(
    [[0, 0], [0.17, 0], [0.2, 0.3], [0.225, 0.32], [0.225, 0.35], [0.2, 0.35], [0, 0.33]],
    '#b8724f',
    { roughness: 0.75 },
  ))
  const terra = cylinder(0.19, 0.19, 0.02, '#3b2a1e', { roughness: 0.95 })
  terra.position.y = 0.33
  vaso.add(terra)
  const tronco = cylinder(0.025, 0.035, 0.5, '#6b4a2e', { roughness: 0.85 })
  tronco.position.y = 0.58
  vaso.add(tronco)
  for (const [fx, fy, fz, fr, s] of [
    [0, 0.95, 0, 0.3, 3], [-0.18, 0.78, 0.08, 0.2, 5], [0.17, 0.82, -0.05, 0.22, 7], [0.02, 1.18, 0.02, 0.2, 9],
  ] as const) {
    const copa = puff(fr, s % 2 ? '#3f7a47' : '#2f6038', 6, s, { roughness: 0.85 })
    copa.position.set(fx, fy, fz)
    vaso.add(copa)
  }
  base.add(vaso)

  // lixeira de arame com recados amassados, na frente à direita
  const lixo = new THREE.Group()
  lixo.position.set(1.75, GY, 0.95)
  lixo.add(lathe(
    [[0, 0], [0.15, 0], [0.16, 0.02], [0.2, 0.34], [0.21, 0.355], [0.195, 0.355], [0.185, 0.34], [0.145, 0.035], [0, 0.035]],
    SLATE_DARK,
    { roughness: 0.4, metalness: 0.6 },
  ))
  for (const [bx, by, bz, br, s] of [
    [0.02, 0.36, 0.02, 0.07, 11], [-0.08, 0.34, -0.05, 0.06, 13], [0.3, 0.05, 0.05, 0.055, 15],
  ] as const) {
    const bola = puff(br, MEMO, 4, s, { roughness: 0.9 })
    bola.position.set(bx, by, bz)
    lixo.add(bola)
  }
  base.add(lixo)

  root.add(base)

  // ---- balcão de recepção: madeira clara, tampo cinza ----------------------
  const balcao = new THREE.Group()
  const BODY_H = TOP - GY - 0.06
  const FRONT_Z = CZ + (CD - 0.1) / 2

  const corpo = rbox(CW, BODY_H, CD - 0.1, 0.03, OAK, { roughness: 0.6 })
  corpo.position.set(0, GY + BODY_H / 2, CZ)
  balcao.add(corpo)

  const tampo = rbox(CW + 0.08, 0.06, CD + 0.04, 0.025, SLATE, { roughness: 0.35, metalness: 0.2 })
  tampo.position.set(0, TOP - 0.03, CZ)
  balcao.add(tampo)

  const rodape = rbox(CW - 0.06, 0.07, CD - 0.16, 0.02, PLINTH, { roughness: 0.8 })
  rodape.position.set(0, GY + 0.035, CZ)
  balcao.add(rodape)

  // ripas verticais e faixa cinza no frontal
  for (let i = -4; i <= 4; i++) {
    const ripa = rbox(0.016, BODY_H - 0.2, 0.012, 0.005, OAK_DARK, { roughness: 0.7 })
    ripa.position.set(i * 0.3, GY + 0.07 + (BODY_H - 0.2) / 2, FRONT_Z + 0.003)
    balcao.add(ripa)
  }
  const faixa = rbox(CW - 0.02, 0.05, 0.016, 0.008, SLATE_DARK, { roughness: 0.4, metalness: 0.3 })
  faixa.position.set(0, TOP - 0.13, FRONT_Z + 0.004)
  balcao.add(faixa)

  // bloco de recados + caneta, porta-canetas
  const bloco = new THREE.Group()
  bloco.position.set(0.98, TOP, 0.17)
  bloco.rotation.y = 0.28
  const folhas = rbox(0.28, 0.035, 0.21, 0.01, MEMO, { roughness: 0.85 })
  folhas.position.y = 0.0175
  bloco.add(folhas)
  for (let i = 0; i < 4; i++) {
    const linha = rbox(0.2, 0.004, 0.008, 0.002, '#c9b46a', { roughness: 0.8 })
    linha.position.set(0, 0.036, -0.06 + i * 0.04)
    bloco.add(linha)
  }
  const caneta = cylinder(0.012, 0.012, 0.26, '#2c3e66', { roughness: 0.3 })
  caneta.rotation.set(0, 0.5, Math.PI / 2)
  caneta.position.set(0.04, 0.05, 0.02)
  bloco.add(caneta)
  balcao.add(bloco)

  const copo = new THREE.Group()
  copo.position.set(1.12, TOP, -0.5)
  copo.add(lathe([[0, 0], [0.07, 0], [0.075, 0.18], [0.065, 0.18], [0.06, 0.01], [0, 0.01]], SLATE_DARK, { roughness: 0.4, metalness: 0.5 }))
  for (const [cx, cz, tilt, cor] of [[-0.02, 0.01, 0.18, '#2c3e66'], [0.02, -0.01, -0.15, '#7a2e2e'], [0.0, 0.025, 0.05, '#3e3e44']] as const) {
    const lapis = cylinder(0.011, 0.011, 0.3, cor, { roughness: 0.4 })
    lapis.position.set(cx, 0.16, cz)
    lapis.rotation.z = tilt
    copo.add(lapis)
  }
  balcao.add(copo)

  root.add(balcao)

  // ---- aquário cilíndrico alto ---------------------------------------------
  const aquario = new THREE.Group()
  aquario.position.copy(AQ)

  const pe = lathe(
    [[0, 0], [AR + 0.05, 0], [AR + 0.065, 0.02], [AR + 0.055, 0.07], [AR + 0.02, G0], [0, G0]],
    RIM,
    { roughness: 0.35, metalness: 0.3 },
  )
  aquario.add(pe)

  // cascalho: monte suave + pedrinhas
  const cascalho = lathe(
    [[0, G0], [AR - 0.012, G0], [AR - 0.012, GT - 0.025], [0.45, GT - 0.005], [0.2, GT + 0.01], [0, GT + 0.015]],
    GRAVEL,
    { roughness: 0.95 },
  )
  aquario.add(cascalho)
  const pedrinhas = ['#e6d8b7', '#b9a47c', '#9b8b70', '#efe5cf', '#c8b08a']
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2
    const rr = Math.sqrt(rand()) * (AR - 0.07)
    const p = sphere(0.016 + rand() * 0.014, pedrinhas[i % pedrinhas.length], { roughness: 0.85 }, 12)
    p.position.set(Math.cos(a) * rr, GT + 0.004, Math.sin(a) * rr)
    p.scale.y = 0.6
    aquario.add(p)
  }

  // duas plantinhas: frente-esquerda e fundo-direita
  for (const [px, pz, n, hMax, seed] of [[-0.38, 0.28, 5, 0.26, 1], [0.34, -0.32, 6, 0.42, 2]] as const) {
    const pr = rng(70 + seed)
    for (let i = 0; i < n; i++) {
      const hh = hMax * (0.55 + pr() * 0.45)
      const folha = capsule(0.022, hh, i % 2 ? PLANT : PLANT_DARK, { roughness: 0.6 })
      folha.position.set(px + (pr() - 0.5) * 0.09, GT + hh / 2, pz + (pr() - 0.5) * 0.07)
      folha.rotation.set((pr() - 0.5) * 0.35, 0, (pr() - 0.5) * 0.6)
      aquario.add(folha)
    }
  }

  // vidro e água: costas → água de trás → (conteúdo) → água da frente → vidro da frente
  const tuboGeo = new THREE.CylinderGeometry(AR, AR, AH, 64, 1, true)
  const vidroTras = new THREE.Mesh(tuboGeo, glassMat(GLASS, 0.14, THREE.BackSide))
  vidroTras.position.y = G0 + AH / 2
  vidroTras.renderOrder = 2
  aquario.add(vidroTras)

  const WH = WATER_Y - G0
  const aguaGeo = new THREE.CylinderGeometry(AR - 0.012, AR - 0.012, WH, 64, 1, true)
  const aguaTras = new THREE.Mesh(aguaGeo, glassMat(WATER, 0.16, THREE.BackSide))
  aguaTras.position.y = G0 + WH / 2
  aguaTras.renderOrder = 3
  aquario.add(aguaTras)

  const aguaFrente = new THREE.Mesh(aguaGeo, glassMat(WATER, 0.12, THREE.FrontSide))
  aguaFrente.position.y = G0 + WH / 2
  aguaFrente.renderOrder = 5
  aquario.add(aguaFrente)

  const superficie = new THREE.Mesh(
    new THREE.CircleGeometry(AR - 0.012, 64),
    glassMat(SURFACE, 0.3, THREE.FrontSide),
  )
  superficie.rotation.x = -Math.PI / 2
  superficie.position.y = WATER_Y
  superficie.renderOrder = 6
  aquario.add(superficie)

  const vidroFrente = new THREE.Mesh(tuboGeo, glassMat(GLASS, 0.1, THREE.FrontSide))
  vidroFrente.position.y = G0 + AH / 2
  vidroFrente.renderOrder = 7
  aquario.add(vidroFrente)

  // reflexos verticais no vidro (vendem o "vidro" de longe)
  for (const [t0, tl, op] of [[-0.95, 0.1, 0.32], [-0.75, 0.04, 0.22], [0.75, 0.05, 0.16]] as const) {
    const brilho = new THREE.Mesh(
      new THREE.CylinderGeometry(AR + 0.003, AR + 0.003, AH * 0.86, 8, 1, true, t0, tl),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: op, depthWrite: false }),
    )
    brilho.position.y = G0 + AH * 0.5
    brilho.renderOrder = 8
    aquario.add(brilho)
  }
  // linha d'água no vidro
  const linhaAgua = torus(AR - 0.006, 0.006, '#e9f8fb', { roughness: 0.2 })
  linhaAgua.rotation.x = Math.PI / 2
  linhaAgua.position.y = WATER_Y
  linhaAgua.castShadow = false
  aquario.add(linhaAgua)

  // aro preto da boca do tubo
  const aro = torus(AR, 0.02, RIM, { roughness: 0.35, metalness: 0.3 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = RIM_Y
  aquario.add(aro)

  root.add(aquario)

  // ---- leme de navio de madeira (8 raios com punhos) -------------------------
  const leme = new THREE.Group()
  leme.position.copy(W)
  leme.rotation.y = W_YAW
  aquario.add(leme)

  const madeira = { roughness: 0.55 }
  const aroLeme = torus(WR, 0.032, WOOD, madeira)
  leme.add(aroLeme)
  const cubo = cylinder(0.075, 0.075, 0.1, WOOD_DARK, madeira)
  cubo.rotation.x = Math.PI / 2
  leme.add(cubo)
  const tampa = cylinder(0.042, 0.042, 0.11, BRASS, { roughness: 0.3, metalness: 0.75 })
  tampa.rotation.x = Math.PI / 2
  leme.add(tampa)
  for (let k = 0; k < 8; k++) {
    const braco = new THREE.Group()
    braco.rotation.z = (k * Math.PI) / 4 - Math.PI / 2
    const raio = cylinder(0.018, 0.022, WR - 0.06, WOOD, madeira, 12)
    raio.position.y = 0.06 + (WR - 0.06) / 2
    braco.add(raio)
    const punho = lathe(
      [[0, 0], [0.021, 0], [0.024, 0.025], [0.019, 0.05], [0.028, 0.09], [0.031, 0.12], [0.022, 0.15], [0, 0.158]],
      WOOD,
      madeira,
      16,
    )
    punho.position.y = WR - 0.01
    braco.add(punho)
    leme.add(braco)
  }

  // ---- enguia elétrica enrolada no aro (espaço do leme) ---------------------
  const enguia = new THREE.Group()
  enguia.position.copy(W)
  enguia.rotation.y = W_YAW
  aquario.add(enguia)

  const coilPt = (th: number) => {
    const rr = WR - COIL * Math.sin(4 * th)
    return new THREE.Vector3(rr * Math.cos(th), rr * Math.sin(th), COIL * Math.cos(4 * th))
  }
  const hW = toWheel(HEAD)
  const dW = D.clone().applyQuaternion(qWinv)

  // base da cabeça: lado de cima tombado para a câmera (os dois olhos à vista)
  const toCamH = camL.clone().sub(HEAD).normalize()
  const upPerp = Y.clone().addScaledVector(D, -D.dot(Y)).normalize()
  const camPerp = toCamH.clone().addScaledVector(D, -D.dot(toCamH)).normalize()
  const yH = upPerp.clone().multiplyScalar(Math.cos(0.2)).addScaledVector(camPerp, Math.sin(0.2)).normalize()
  const xH = new THREE.Vector3().crossVectors(yH, D)
  const qHead = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xH, yH, D))
  const yHW = yH.clone().applyQuaternion(qWinv)

  // linha central: rabo deitado no cascalho → hélice subindo pelo lado
  // esquerdo do aro (na frente/atrás de raio sim, raio não) → pescoço
  const TH0 = (11 * Math.PI) / 8 // ponto mais externo da hélice, embaixo à esquerda
  const TH1 = Math.PI / 2
  const center: THREE.Vector3[] = []
  const bellyDir: THREE.Vector3[] = []
  const DOWN = new THREE.Vector3(0, -1, 0)
  for (const [x, y, z] of [
    [0.34, -0.365, 0.1], [0.24, -0.355, 0.19], [0.1, -0.35, 0.22], [-0.02, -0.35, 0.17], [-0.1, -0.345, 0.08],
  ] as const) {
    center.push(new THREE.Vector3(x, y, z))
    bellyDir.push(DOWN.clone())
  }
  const NC = 70
  for (let i = 0; i <= NC; i++) {
    const th = TH0 + (TH1 - TH0) * (i / NC)
    const p = coilPt(th)
    center.push(p)
    const rimC = new THREE.Vector3(WR * Math.cos(th), WR * Math.sin(th), 0)
    bellyDir.push(rimC.sub(p).normalize())
  }
  const E = coilPt(TH1)
  const tE = new THREE.Vector3(0.26, 0.38, 0).normalize()
  const HB = hW.clone().addScaledVector(dW, -0.06)
  const neck = new THREE.CubicBezierCurve3(
    E, E.clone().addScaledVector(tE, 0.12), HB.clone().addScaledVector(dW, -0.14), HB,
  )
  const bellyE = new THREE.Vector3(0, 0, -1)
  const bellyH = yHW.clone().negate()
  for (let i = 1; i <= 12; i++) {
    const u = i / 12
    center.push(neck.getPoint(u))
    bellyDir.push(bellyE.clone().lerp(bellyH, u).normalize())
  }

  const smooth = (a: number, b: number, t: number) => {
    const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)
  }
  const eelR = (t: number) => 0.013 + 0.045 * smooth(0, 0.3, t) + 0.012 * smooth(0.86, 1, t)
  const corpoCurva = new THREE.CatmullRomCurve3(center, false, 'centripetal')
  const corpoEnguia = new THREE.Mesh(closedTube(corpoCurva, eelR, 260, 16), mat(EEL, { roughness: 0.45, size: 0.3 }))
  corpoEnguia.castShadow = true
  corpoEnguia.receiveShadow = true
  enguia.add(corpoEnguia)

  // barriga laranja: tubo mais fino deslocado para o lado da barriga
  // (começa depois da ponta do rabo: a ponta fica toda escura)
  const nPts = center.length
  const B0 = 3
  const tOf = (i: number) => i / (nPts - 1)
  const bellyPts = center.slice(B0).map((p, k) =>
    p.clone().addScaledVector(bellyDir[k + B0], 0.42 * eelR(tOf(k + B0))),
  )
  const barrigaCurva = new THREE.CatmullRomCurve3(bellyPts, false, 'centripetal')
  const barriga = new THREE.Mesh(
    closedTube(barrigaCurva, (t) => 0.7 * eelR(tOf(B0 + t * (nPts - 1 - B0))), 240, 12),
    mat(BELLY, { roughness: 0.4, size: 0.3 }),
  )
  barriga.castShadow = true
  barriga.receiveShadow = true
  enguia.add(barriga)

  // ---- cabeça de boca aberta (+z = focinho, +y = topo) ------------------------
  const cabeca = new THREE.Group()
  cabeca.position.copy(hW)
  cabeca.quaternion.copy(qWinv.clone().multiply(qHead))
  enguia.add(cabeca)
  const cab = new THREE.Group() // escala só da forma (a peça anima a própria escala)
  cab.scale.setScalar(1.3)
  cabeca.add(cab)

  const pele = { roughness: 0.4 }
  // cabeça rombuda de enguia, com o gargalo da garrafa entrando pela boca
  const cranio = sphere(0.09, EEL, pele)
  cranio.scale.set(1.12, 0.8, 1.55)
  cab.add(cranio)
  const garganta = sphere(0.085, BELLY, pele)
  garganta.scale.set(1.0, 0.55, 1.4)
  garganta.position.set(0, -0.032, -0.005)
  cab.add(garganta)
  const labios = torus(0.04, 0.017, '#5c3330', { roughness: 0.45 })
  labios.position.z = 0.128
  cab.add(labios)
  const boca = sphere(0.042, MOUTH, { roughness: 0.6 })
  boca.scale.z = 0.5
  boca.position.z = 0.125
  cab.add(boca)
  for (const s of [-1, 1]) {
    const olho = sphere(0.017, '#ffffff', { roughness: 0.25 }, 16)
    olho.position.set(s * 0.06, 0.05, 0.065)
    const pupila = sphere(0.0095, '#141414', { roughness: 0.2 }, 12)
    pupila.position.set(s * 0.067, 0.056, 0.074)
    cab.add(olho, pupila)
  }

  // ---- garrafinha de éter com o bilhete (gargalo na boca da enguia) ---------
  // +y da garrafa aponta para a cabeça; o fundo fica para a cana empurrar
  const B_FINAL = HEAD.clone().addScaledVector(D, 0.1 + B_LEN)
  const yB = D.clone().negate()
  const toCamB = camL.clone().sub(B_FINAL).normalize()
  const zB = toCamB.addScaledVector(yB, -toCamB.dot(yB)).normalize()
  const xB = new THREE.Vector3().crossVectors(yB, zB)
  const garrafa = new THREE.Group()
  garrafa.position.copy(B_FINAL)
  garrafa.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xB, yB, zB))
  aquario.add(garrafa)

  const vidroGarrafa = lathe(
    [
      [0, 0], [BR - 0.008, 0], [BR, 0.014], [BR, 0.2], [BR - 0.01, 0.235], [0.046, 0.27],
      [0.036, 0.29], [0.036, 0.32], [0.042, 0.325], [0.042, 0.335], [0, 0.335],
    ],
    BOTTLE,
    { roughness: 0.08 },
  )
  const vm = vidroGarrafa.material as THREE.MeshStandardMaterial
  vm.transparent = true
  vm.opacity = 0.5
  vm.depthWrite = false
  vidroGarrafa.renderOrder = 4
  vidroGarrafa.castShadow = false
  garrafa.add(vidroGarrafa)

  const fundo = cylinder(BR - 0.01, BR - 0.006, 0.014, '#9ccf96', { roughness: 0.15 })
  fundo.position.y = 0.008
  garrafa.add(fundo)

  const rolha = cylinder(0.039, 0.034, 0.065, CORK, { roughness: 0.85 })
  rolha.position.y = 0.335 + 0.02
  garrafa.add(rolha)

  const bilhete = cylinder(0.03, 0.03, 0.2, PAPER, { roughness: 0.85 })
  bilhete.position.y = 0.135
  garrafa.add(bilhete)
  const laco = torus(0.031, 0.006, '#9b5a3a', { roughness: 0.7 })
  laco.rotation.x = Math.PI / 2
  laco.position.y = 0.2
  garrafa.add(laco)

  const LB_Y = 0.105
  const rotulo = new THREE.Mesh(
    new THREE.CylinderGeometry(BR + 0.002, BR + 0.002, 0.12, 40, 1, true, -1.3, 2.6),
    mat(LABEL, { roughness: 0.6 }),
  )
  ;(rotulo.material as THREE.Material).side = THREE.DoubleSide
  rotulo.position.y = LB_Y
  garrafa.add(rotulo)
  // ÉT: em pé para quem olha (o "alto" da letra aponta para o fundo da garrafa)
  for (const [which, s] of [['E', -0.033], ['T', 0.035]] as const) {
    const holder = new THREE.Group()
    holder.rotation.y = -s / (BR + 0.004)
    const g = glyph(which)
    g.position.set(0, LB_Y, BR + 0.005)
    g.rotation.z = Math.PI
    holder.add(g)
    garrafa.add(holder)
  }

  // ---- cana-de-açúcar: ponta no fundo da garrafa, apoiada na borda ----------
  const CANE_TIP = B_FINAL.clone()
  const cana = new THREE.Group()
  cana.position.copy(CANE_TIP)
  cana.quaternion.setFromUnitVectors(Y, D)
  aquario.add(cana)

  const GOMO = 0.24
  for (let y0 = 0; y0 < CANE_LEN - 0.01; y0 += GOMO) {
    const h = Math.min(GOMO, CANE_LEN - y0)
    const gomo = lathe(
      [[0, 0], [CANE_R, 0], [CANE_R * 0.94, h * 0.5], [CANE_R, h], [0, h]],
      CANE,
      { roughness: 0.45 },
      20,
    )
    gomo.position.y = y0
    cana.add(gomo)
    if (y0 > 0) {
      const no = cylinder(CANE_R + 0.006, CANE_R + 0.006, 0.026, CANE_NODE, { roughness: 0.6 }, 20)
      no.position.y = y0
      cana.add(no)
      const cera = cylinder(CANE_R + 0.002, CANE_R + 0.002, 0.02, '#9b86a0', { roughness: 0.8 }, 20)
      cera.position.y = y0 + 0.025
      cana.add(cera)
    }
  }
  const miolo = cylinder(CANE_R * 0.92, CANE_R * 0.92, 0.008, CANE_PITH, { roughness: 0.9 }, 20)
  miolo.position.y = -0.002
  cana.add(miolo)
  // tufo de folhas no topo
  for (let i = 0; i < 4; i++) {
    const folha = rbox(0.05, 0.42, 0.008, 0.004, i % 2 ? PLANT : PLANT_DARK, { roughness: 0.7 })
    const a = (i / 4) * Math.PI * 2
    folha.position.set(Math.cos(a) * 0.08, CANE_LEN + 0.17, Math.sin(a) * 0.08)
    folha.rotation.set(Math.sin(a) * 0.5, a, -Math.cos(a) * 0.5)
    cana.add(folha)
  }

  // ---- telefone antigo preto ------------------------------------------------
  const telefone = new THREE.Group()
  telefone.position.set(PX, TOP, PZ)
  telefone.rotation.y = P_YAW
  root.add(telefone)

  const baq = { roughness: 0.22 }
  const caixa = rbox(0.42, 0.1, 0.34, 0.04, PHONE, baq)
  caixa.position.y = 0.05
  telefone.add(caixa)
  const cupula = rbox(0.34, 0.12, 0.25, 0.05, PHONE, baq)
  cupula.position.set(0, 0.12, -0.03)
  telefone.add(cupula)
  for (const sx of [-1, 1]) {
    const gancho = rbox(0.05, 0.07, 0.07, 0.02, PHONE, baq)
    gancho.position.set(sx * 0.13, 0.2, -0.05)
    telefone.add(gancho)
  }

  const disco = new THREE.Group()
  disco.position.set(0, 0.125, 0.105)
  disco.rotation.x = 0.93
  telefone.add(disco)
  const discoBase = cylinder(0.095, 0.1, 0.02, PHONE, baq)
  disco.add(discoBase)
  const numeros = cylinder(0.085, 0.085, 0.008, DIAL, { roughness: 0.5 })
  numeros.position.y = 0.011
  disco.add(numeros)
  for (let i = 0; i < 10; i++) {
    const a = 0.9 + (i / 9) * 4.6
    const furo = torus(0.0135, 0.0045, PHONE, baq)
    furo.rotation.x = Math.PI / 2
    furo.position.set(Math.cos(a) * 0.058, 0.017, Math.sin(a) * 0.058)
    disco.add(furo)
  }
  const miolo2 = cylinder(0.026, 0.026, 0.012, CHROME, { roughness: 0.25, metalness: 0.8 })
  miolo2.position.y = 0.017
  disco.add(miolo2)
  const trava = rbox(0.012, 0.012, 0.035, 0.004, CHROME, { roughness: 0.25, metalness: 0.8 })
  trava.position.set(0.075, 0.02, 0.045)
  trava.rotation.y = -0.6
  disco.add(trava)

  const fone = new THREE.Group()
  fone.position.set(0, 0.255, -0.05)
  telefone.add(fone)
  const cabo = capsule(0.032, 0.34, PHONE, baq)
  cabo.rotation.z = Math.PI / 2
  fone.add(cabo)
  for (const sx of [-1, 1]) {
    const concha = cylinder(0.066, 0.054, 0.07, PHONE, baq)
    concha.position.set(sx * 0.2, -0.036, 0)
    fone.add(concha)
  }

  // ---- fio espiral: do telefone, por cima da borda, até a água ---------------
  root.updateMatrixWorld(true)
  const SOCKET = telefone.localToWorld(new THREE.Vector3(0.2, 0.05, -0.1)).sub(AQ)
  const cordPath = [
    SOCKET,
    new THREE.Vector3(-0.86, 0.1, 0.03),
    new THREE.Vector3(-0.77, 0.38, 0.02),
    new THREE.Vector3(-0.7, 0.98, 0.0),
    new THREE.Vector3(-0.665, 1.5, 0.0),
    new THREE.Vector3(-0.615, 1.715, 0.02),
    new THREE.Vector3(-0.54, 1.72, 0.04),
    new THREE.Vector3(-0.49, 1.52, 0.04),
    new THREE.Vector3(-0.46, 1.2, 0.0),
    new THREE.Vector3(-0.41, 0.92, -0.08),
    new THREE.Vector3(-0.375, 0.85, -0.12),
  ]
  const fio = new THREE.Group()
  fio.position.copy(SOCKET)
  aquario.add(fio)
  const espiral = coilCord(cordPath.map((p) => p.clone().sub(SOCKET)), 0.028, 0.008, 0.034)
  fio.add(espiral)
  // plugue na ponta, encostado na enguia
  const plugPos = cordPath[cordPath.length - 1].clone().sub(SOCKET)
  const plugue = rbox(0.05, 0.07, 0.04, 0.012, PHONE, baq)
  plugue.position.copy(plugPos).add(new THREE.Vector3(0.01, -0.035, 0))
  plugue.rotation.z = 0.2
  fio.add(plugue)
  for (const sx of [-1, 1]) {
    const pino = rbox(0.008, 0.035, 0.012, 0.003, CHROME, { roughness: 0.25, metalness: 0.8 })
    pino.position.copy(plugPos).add(new THREE.Vector3(0.02 + sx * 0.012, -0.08, 0))
    pino.rotation.z = 0.2
    fio.add(pino)
  }

  // ---- faíscas azul-elétricas + brilho da enguia -----------------------------
  const F0 = W.clone().add(new THREE.Vector3(0, 0.08, 0.2))
  const faiscas = new THREE.Group()
  faiscas.position.copy(F0)
  aquario.add(faiscas)
  const glow = mat(SPARK_GLOW, { emissive: '#0a7dff', emissiveIntensity: 1.3, roughness: 0.3 })
  for (const [bx, by, bz, rz, len] of [
    [-0.3, 0.3, -0.05, 0.9, 0.16],
    [0.33, -0.33, -0.05, -0.6, 0.18],
    [0.16, 0.21, 0.1, -1.9, 0.16],
  ] as const) {
    const b = bolt(len, glow)
    b.position.set(bx, by, bz)
    b.rotation.z = rz
    faiscas.add(b)
  }
  const luz = new THREE.PointLight(SPARK_GLOW, 2.2, 1.5, 1.2)
  luz.position.set(0, -0.08, -0.32)
  faiscas.add(luz)
  // luz de frente, fraca e afastada: tinge a enguia de azul sem manchar
  const luzFrente = new THREE.PointLight(SPARK_GLOW, 1.4, 2.2, 1.0)
  luzFrente.position.set(-0.05, 0.15, 0.32)
  faiscas.add(luzFrente)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'recepcao', object: base },
    { name: 'balcao', group: 'recepcao', object: balcao },
    { name: 'aquario', group: 'aquario', object: aquario },
    { name: 'leme', group: 'leme', object: leme },
    { name: 'enguia', group: 'enguia', object: enguia },
    { name: 'cabeca', group: 'enguia', object: cabeca },
    { name: 'telefone', group: 'telefone', object: telefone },
    { name: 'fio', group: 'telefone', object: fio },
    { name: 'garrafa', group: 'eter', object: garrafa },
    { name: 'cana', group: 'cana', object: cana },
    { name: 'faiscas', group: 'bip', object: faiscas },
  ]

  const grow = (s = 1, from = 0.01) => [ch('scale.x', from, s), ch('scale.y', from, s), ch('scale.z', from, s)]
  const move = (from: THREE.Vector3, to: THREE.Vector3) => [
    ch('position.x', from.x, to.x), ch('position.y', from.y, to.y), ch('position.z', from.z, to.z),
  ]

  // poses intermediárias
  const H_BACK = hW.clone().addScaledVector(dW, -0.1) // cabeça recolhida, esperando
  const B_WAIT = B_FINAL.clone().addScaledVector(D, 0.08) // garrafa boiando antes do empurrão
  const B_DROP = B_WAIT.clone().add(new THREE.Vector3(-0.05, 0.75, -0.02))
  const C_WAIT = CANE_TIP.clone().addScaledVector(D, 0.08)
  const C_START = CANE_TIP.clone().addScaledVector(D, 1.0)

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Recepção do escritório. Ninguém atende — é a vez do recado.',
    }),
    seq('balcao-rise', 'balcao', 0.2, 0.9, [riseFrom(0, 1.4)], { ease: 'easeOut' }),

    seq('aquario-cresce', 'aquario', 1.5, 0.8, [
      ch('scale.y', 0.01, 1), ch('scale.x', 0.7, 1), ch('scale.z', 0.7, 1),
    ], {
      ease: 'easeOut',
      caption: 'Em cima do balcão, um aquário alto de vidro…',
    }),

    seq('leme-gira', 'leme', 2.6, 1.0, [...grow(), ch('rotation.z', -Math.PI, 0)], {
      ease: 'easeOut',
      caption: '…com um LEME de navio de enfeite, plantado no cascalho.',
    }),

    seq('enguia-enrola', 'enguia', 3.9, 1.0, [...grow(), ch('rotation.z', 1.6, 0)], {
      ease: 'easeOut',
      caption: 'Enrolada no LEME mora a secretária ELÉTRICA: uma enguia. Todo mundo tem MEDO DELA!',
    }),
    seq('cabeca-surge', 'cabeca', 3.9, 1.0, grow(1, 0.3), { ease: 'easeOut' }),

    seq('telefone-rise', 'telefone', 5.9, 0.6, [riseFrom(TOP, 0.45)], {
      ease: 'easeOut',
      caption: 'O fio do telefone vai direto pra água: é ela quem anota os recados.',
    }),
    seq('fio-estica', 'fio', 6.3, 0.9, grow(), { ease: 'easeOut' }),

    seq('garrafa-cai', 'garrafa', 7.7, 0.7, [...grow(1, 0.3), ...move(B_DROP, B_WAIT)], {
      ease: 'easeOut',
      caption: 'Você enrola o bilhete numa garrafinha de ÉTER…',
    }),

    seq('cana-entra', 'cana', 8.8, 0.8, move(C_START, C_WAIT), {
      ease: 'easeOut',
      caption: '…e empurra com a ponta de uma CANA — cana não dá choque: CA-NIÁ… LEME-NA… ÉT…',
    }),

    seq('cana-empurra', 'cana', 10.6, 0.45, move(C_WAIT, CANE_TIP), {
      ease: 'easeInOut',
      caption: 'MEDO DELA… ANDE! A enguia abocanha a garrafa…',
    }),
    seq('garrafa-empurrada', 'garrafa', 10.6, 0.45, move(B_WAIT, B_FINAL), { ease: 'easeInOut' }),
    seq('cabeca-abocanha', 'cabeca', 10.85, 0.2, move(H_BACK, hW), { ease: 'easeIn' }),

    seq('faiscas-bip', 'faiscas', 11.4, 0.3, grow(1.25), {
      ease: 'easeOut',
      caption: '…e acende inteira de azul — BIP! Recado deixado.',
    }),
    seq('faiscas-assenta', 'faiscas', 11.7, 0.3, grow(1, 1.25), { ease: 'easeInOut' }),
    seq('enguia-treme-a', 'enguia', 11.4, 0.1, [ch('rotation.z', 0, 0.04)]),
    seq('enguia-treme-b', 'enguia', 11.5, 0.12, [ch('rotation.z', 0.04, -0.04)]),
    seq('enguia-treme-c', 'enguia', 11.62, 0.12, [ch('rotation.z', -0.04, 0.03)]),
    seq('enguia-treme-d', 'enguia', 11.74, 0.16, [ch('rotation.z', 0.03, 0)]),

    seq('faiscas-pulsa', 'faiscas', 12.9, 0.25, grow(1.12, 1), {
      ease: 'easeOut',
      caption: 'Kan jag lämna ett meddelande? — Posso deixar um recado?',
    }),
    seq('faiscas-volta', 'faiscas', 13.15, 0.35, grow(1, 1.12), { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: CAM_TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-lamna-ett-meddelande',
    contexto:
      "Telefone e recepção: quando a pessoa que você procura não está — na recepção da empresa, no consultório, na escola ou na creche dos filhos. Quem atende também pode oferecer: 'Vill du lämna ett meddelande?'. Na caixa postal (röstbrevlåda) a gravação manda 'lämna ett meddelande efter tonen' — depois do sinal.",
    fraseFonte: 'Posso deixar um recado?',
    fraseAlvo: 'Kan jag lämna ett meddelande?',
    pronuncia:
      "ka-niá LÉM-na ét MÊÊ-de-lan-de? ('kan jag' = ka-niá, o -g não soa; 'lämna' com É curto e aberto, M e N colados, sem vogal no meio, e com a força no LÉM — aqui não tem partícula, então o verbo leva a pancada; 'ett' = ét, curtinho e fraco, T seco; 'meddelande' com a força no MÊ, Ê FECHADO e longo, um segundo apoio no 'de' (também Ê fechado) e o -lande corrido: A curto e oral, N de língua, D duro e -e fraquinho — nunca 'lãn-dji')",
    ponteSonora:
      "CA-NIÁ, LÉM(e)-NA ÉT(er)... MÊ(do) DÊ-LA-NDE? (9 sílabas: ca-niá-LÉM-na-et-MÊÊ-de-lan-de; força no LÉM e no MÊ, com um segundo apoio no DÊ; CA-NIÁ = a CANA + IÁ de 'Kan jag få en påse?', 'Kan jag betala med kort?' e 'Kan jag byta den här?' — emendado, I de IOGA, nunca o J chiado de 'canja'; LÉM(e)-NA = o MESMO LEME de 'Jag vill lämna tillbaka den här': LEME sem o -e, com o É aberto quase de 'pé' e o M de lábios fechados soltando direto no NA — LÉM-na, nunca 'lê-mi-na'; sem o M, com Ô, vira o LÔ-NA da lona, 'låna' (pegar emprestado); lá o LEME corria leve por causa do 'tillBAKA', aqui, sem partícula, ele leva a força; ÉT(er) = o ÉTER sem o -ER, o MESMO ÉT de 'Jag har ett möte' e dos cilindros de 'Ring 112!': É aberto, curtinho e sem força, T seco, nunca 'étchi'; MÊ(do) DÊ-LA-NDE = 'meddelande' montado com duas âncoras que você já tem: o MÊ do MEDO ('med', de 'Vad jobbar du med?') e o DÊ-LA da onça de 'Kan vi dela på notan?' — e é literal: med-dela é 'dividir COM', avisar; o MÊ com Ê FECHADO, LONGO e a força principal, o D do MEDO cai; o DÊ também FECHADO, de 'você' — nunca o 'déla' aberto do português —, com um apoio menor; o -NDE é o ANDE! do empurrão, colado no LA sem vogal a mais: DÊ-LAN-de, como o '-ndo' do português (dividiNDO), mas com o A oral, N só de ponta de língua, D duro e -E fraquinho, nunca 'lãn-dji'; com o -NDE solto, sobra 'meddela', o verbo avisar)",
    historia:
      "Na recepção do escritório, quem anota os recados é a secretária ELÉTRICA: uma enguia que mora num aquário em cima do balcão, enrolada no LEME de enfeite, com o fio do telefone mergulhado na água. Ninguém atende, é a vez do recado — mas todo mundo tem MEDO DELA: encostou, levou choque. Então você enrola o bilhete dentro de uma garrafinha de ÉTER e empurra pra dentro do aquário com a ponta de uma CANA comprida, que cana não dá choque: CA-NIÁ... LEME-NA... ÉT... MEDO DELA... ANDE! A enguia abocanha a garrafa, acende inteira de azul — BIP! — e o recado está deixado.",
  },
  createScene,
  refine: { organic: ['enguia', 'cabeca'] },
}

export default card
