import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, rock,
} from '../rig/helpers'

/**
 * "Stannar bussen här?" — (e)STÁ NA AR(eia)… BUS-SEM… RRÉR(a)?
 *
 * Prainha de rio: a ARIRANHA espera no ponto, um poste todo enrolado de HERA.
 * O ônibus vermelho vem a toda pela margem e — ESTÁ NA AREIA! — atola até a
 * metade das portas: virou um ÔNIBUS SEM rodas, de barriga no chão, colado no
 * poste. A ariranha pula e aponta: parar, ele parou. E abre a porta.
 *
 * Diorama: disco de areia clara, faixa de rio azul ao fundo, ônibus na
 * diagonal (traseira no fundo-esquerda, frente e porta viradas pra câmera),
 * poste azul na quina da frente, ariranha marrom-chocolate em primeiro plano
 * à esquerda. Acento saturado RESERVADO: o vermelho do ÔNIBUS.
 */

const SOIL = '#8f6c45'
const SAND = '#ecd9a2'
const SAND_DARK = '#dcc287'
const SAND_WET = '#bfa478'
const WATER = '#3f86b8'
const WATER_LIGHT = '#7fb6d8'
const REED = '#6f8a45'
const STONE = '#9a9284'

const BUS = '#d42a2a' // acento: o ÔNIBUS
const BUS_DARK = '#9e1c20'
const ROOF = '#ece8e0'
const GLASS = '#26363f'
const GLASS_LIGHT = '#4d6a7a'
const INTERIOR = '#1b1f22'
const RUBBER = '#2a2b2e'

const POLE = '#9aa1a8'
const SIGN = '#2458b0'
const WHITE = '#f4f2ec'
const IVY = '#2f6a33'
const IVY_LIGHT = '#3f8241'
const IVY_STEM = '#4d4a2a'

const FUR = '#4a2b1b' // chocolate escuro
const FUR_DARK = '#38200f'
const CREAM = '#ead9b3'
const NOSE = '#1b1310'
const MOUTH = '#5c2326'
const TONGUE = '#d0767a'
const TEETH = '#f4efe2'

const GY = 0.22 // topo da areia
const R_SAND = 2.68
const RIVER_Z = -1.42 // corda do rio (z < isso é água)

// ônibus: origem no centro da carroceria, no nível da areia; frente em +x
const BL = 2.3
const BW = 1.05
const BH = 1.5
const SINK = 0.55 // quanto da carroceria está sob a areia (pose final)
const BUS_X = 0.3
const BUS_Z = -0.48
const BUS_YAW = -0.24
const BUS_RUN = 1.7 // de onde ele vem, ao longo do próprio eixo

// ariranha
const OT_X = -1.2
const OT_Z = 0.62
const OT_YAW = 0.55
const OT_H = 1.08 // escala geral do bicho (altura ~1.7)
const ARM_REST = 0.35
const ARM_POINT = 1.42

/** Folha de hera: coração achatado (dois lóbulos + ponta). */
function ivyLeaf(s: number, color: string) {
  const g = new THREE.Group()
  for (const side of [-1, 1]) {
    const lobe = sphere(s * 0.55, color, { roughness: 0.45 }, 14)
    lobe.position.set(side * s * 0.36, 0, 0)
    lobe.scale.z = 0.26
    g.add(lobe)
  }
  const tip = cone(s * 0.6, s * 0.9, color, { roughness: 0.45 }, 14)
  tip.position.y = -s * 0.42
  tip.rotation.z = Math.PI
  tip.scale.z = 0.26
  g.add(tip)
  return g
}

/** Tubo ao longo de pontos (talo da hera, bigodes). */
function tube(points: THREE.Vector3[], r: number, color: string) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geo = new THREE.TubeGeometry(curve, Math.max(8, points.length * 6), r, 8, false)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.6, size: 0.2 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Segmento circular (faixa de rio no fundo do disco), deitado no plano xz. */
function riverSlab(r: number, chordZ: number, depth: number, color: string, opts = {}) {
  const c = -chordZ // em coordenadas da forma, y = -z
  const a0 = Math.asin(Math.min(1, c / r))
  const shape = new THREE.Shape()
  shape.moveTo(r * Math.cos(a0), c)
  shape.absarc(0, 0, r, a0, Math.PI - a0, false)
  shape.lineTo(r * Math.cos(a0), c)
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 48 })
  geo.rotateX(-Math.PI / 2)
  const m = new THREE.Mesh(geo, mat(color, { size: 2, ...opts }))
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(77)

  // ---- prainha: terra, areia clara, rio no fundo ----------------------------
  const base = new THREE.Group()

  const soil = cylinder(R_SAND + 0.06, R_SAND + 0.16, 0.16, SOIL, { roughness: 0.9 }, 64)
  soil.position.y = 0.08
  base.add(soil)

  const sand = cylinder(R_SAND, R_SAND + 0.04, 0.06, SAND, { roughness: 0.95 }, 64)
  sand.position.y = GY - 0.03
  base.add(sand)

  const wet = riverSlab(R_SAND, RIVER_Z + 0.2, 0.012, SAND_WET, { roughness: 0.7 })
  wet.position.y = GY - 0.004
  base.add(wet)

  const water = riverSlab(R_SAND, RIVER_Z, 0.03, WATER, { roughness: 0.12 })
  water.position.y = GY - 0.012
  base.add(water)

  // reflexos claros na água
  for (const [x, z, w] of [[-0.9, -1.95, 0.7], [0.55, -2.15, 0.9], [1.45, -1.72, 0.5], [-1.75, -1.6, 0.4]] as const) {
    const ripple = rbox(w, 0.01, 0.045, 0.02, WATER_LIGHT, { roughness: 0.1 })
    ripple.position.set(x, GY + 0.022, z)
    base.add(ripple)
  }

  // junco na margem e pedras
  for (const [x, z, n] of [[1.75, -1.25, 5], [-2.05, -1.0, 4], [2.25, -0.55, 3]] as const) {
    for (let k = 0; k < n; k++) {
      const h = 0.35 + rand() * 0.3
      const reed = cylinder(0.012, 0.018, h, REED, { roughness: 0.7 }, 6)
      reed.position.set(x + (rand() - 0.5) * 0.25, GY + h / 2, z + (rand() - 0.5) * 0.2)
      reed.rotation.set((rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.3)
      base.add(reed)
    }
  }
  for (const [x, z, r, s] of [[2.05, 0.6, 0.16, 3], [2.2, 0.85, 0.1, 4], [-2.15, 0.35, 0.13, 5], [-0.2, 1.95, 0.09, 6]] as const) {
    const st = rock(r, STONE, s, { roughness: 0.8 })
    st.position.set(x, GY + r * 0.35, z)
    st.scale.y = 0.6
    base.add(st)
  }

  // ondulações de areia e conchinhas
  for (const [x, z, ry] of [[1.2, 1.55, 0.3], [-1.75, 1.45, -0.4], [1.85, 0.05, 0.9]] as const) {
    const dune = sphere(0.3, SAND_DARK, { roughness: 0.95 }, 20)
    dune.scale.set(1.6, 0.12, 0.6)
    dune.position.set(x, GY, z)
    dune.rotation.y = ry
    base.add(dune)
  }
  for (const [x, z] of [[0.75, 1.75], [-1.35, 1.75], [1.6, 1.1]] as const) {
    const shell = sphere(0.045, '#f3e1d2', { roughness: 0.4 }, 12)
    shell.scale.set(1, 0.45, 1.2)
    shell.position.set(x, GY + 0.01, z)
    base.add(shell)
  }

  root.add(base)

  // ---- poste de ponto com placa redonda azul --------------------------------
  const poste = new THREE.Group()
  // na quina da frente do ônibus, do lado da porta
  const bc = Math.cos(BUS_YAW)
  const bs = Math.sin(BUS_YAW)
  const busLocal = (x: number, z: number): [number, number] => [
    BUS_X + x * bc + z * bs,
    BUS_Z - x * bs + z * bc,
  ]
  const [PX, PZ] = busLocal(BL / 2 + 0.11, 0.16)
  poste.position.set(PX, GY, PZ)
  root.add(poste)

  const POLE_H = 1.72
  const footing = cylinder(0.11, 0.13, 0.08, '#b9b4a8', { roughness: 0.8 }, 20)
  footing.position.y = 0.03
  poste.add(footing)
  const pole = cylinder(0.042, 0.046, POLE_H, POLE, { roughness: 0.35, metalness: 0.6 }, 16)
  pole.position.y = POLE_H / 2
  poste.add(pole)
  const cap = sphere(0.05, POLE, { roughness: 0.35, metalness: 0.6 }, 12)
  cap.position.y = POLE_H + 0.27
  poste.add(cap)
  const mast = cylinder(0.03, 0.03, 0.3, POLE, { roughness: 0.35, metalness: 0.6 }, 12)
  mast.position.y = POLE_H + 0.13
  poste.add(mast)

  // placa: disco azul, aro branco, ônibus-pictograma branco (virada pra câmera)
  const placa = new THREE.Group()
  placa.position.set(0, POLE_H + 0.06, 0.06)
  placa.rotation.y = 0.12
  poste.add(placa)
  const disc = cylinder(0.27, 0.27, 0.045, SIGN, { roughness: 0.35 }, 40)
  disc.rotation.x = Math.PI / 2
  placa.add(disc)
  const rim = torus(0.255, 0.018, WHITE, { roughness: 0.35 })
  rim.position.z = 0.024
  placa.add(rim)
  const picto = rbox(0.28, 0.15, 0.012, 0.03, WHITE, { roughness: 0.4 })
  picto.position.set(0, 0.02, 0.028)
  placa.add(picto)
  const pictoWin = rbox(0.22, 0.05, 0.012, 0.01, SIGN, { roughness: 0.4 })
  pictoWin.position.set(-0.01, 0.045, 0.034)
  placa.add(pictoWin)
  for (const wx of [-0.08, 0.08]) {
    const w = cylinder(0.035, 0.035, 0.012, WHITE, { roughness: 0.4 }, 16)
    w.rotation.x = Math.PI / 2
    w.position.set(wx, -0.07, 0.028)
    placa.add(w)
    const hub = cylinder(0.013, 0.013, 0.012, SIGN, { roughness: 0.4 }, 12)
    hub.rotation.x = Math.PI / 2
    hub.position.set(wx, -0.07, 0.034)
    placa.add(hub)
  }

  // ---- HERA: talo em hélice da base até a placa + folhas em coração ----------
  const hera = new THREE.Group()
  hera.position.set(PX, GY, PZ)
  root.add(hera)

  const TURNS = 3.2
  const IVY_TOP = POLE_H - 0.32
  const helix: THREE.Vector3[] = []
  for (let k = 0; k <= 40; k++) {
    const t = k / 40
    const a = t * TURNS * Math.PI * 2
    helix.push(new THREE.Vector3(Math.cos(a) * 0.058, 0.02 + t * IVY_TOP, Math.sin(a) * 0.058))
  }
  hera.add(tube(helix, 0.014, IVY_STEM))

  const LEAVES = 30
  for (let k = 0; k < LEAVES; k++) {
    const t = k / (LEAVES - 1)
    const a = t * TURNS * Math.PI * 2 + (k % 2 ? 0.5 : -0.5)
    const y = 0.06 + t * IVY_TOP
    const s = 0.11 - t * 0.03 + rand() * 0.02
    const leaf = ivyLeaf(s, k % 3 === 0 ? IVY_LIGHT : IVY)
    const rr = 0.08 + s * 0.35
    leaf.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr)
    leaf.rotation.order = 'YXZ'
    leaf.rotation.set(-0.35, Math.PI / 2 - a, (rand() - 0.5) * 1.2)
    hera.add(leaf)
  }
  // touceira na base e folhas abraçando a placa
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2
    const leaf = ivyLeaf(0.12, k % 2 ? IVY : IVY_LIGHT)
    leaf.position.set(Math.cos(a) * 0.15, 0.08, Math.sin(a) * 0.15)
    leaf.rotation.order = 'YXZ'
    leaf.rotation.set(-1.0, Math.PI / 2 - a, (rand() - 0.5) * 0.8)
    hera.add(leaf)
  }
  for (const [x, y, rz] of [[-0.25, POLE_H - 0.08, 0.6], [0.27, POLE_H - 0.02, -0.7], [-0.29, POLE_H + 0.16, 1.4], [0.06, POLE_H - 0.24, 0.2]] as const) {
    const leaf = ivyLeaf(0.1, IVY)
    leaf.position.set(x, y, 0.1)
    leaf.rotation.set(0, 0.12, rz)
    hera.add(leaf)
  }

  // ---- ÔNIBUS vermelho atolado ----------------------------------------------
  const onibus = new THREE.Group()
  onibus.position.set(BUS_X, GY, BUS_Z)
  onibus.rotation.y = BUS_YAW
  root.add(onibus)

  const YC = BH / 2 - SINK // centro da carroceria em relação à areia
  const TOPY = BH - SINK // teto

  const carroceria = rbox(BL, BH, BW, 0.13, BUS, { roughness: 0.35 })
  carroceria.position.y = YC
  onibus.add(carroceria)

  // teto: faixa clara e caixa do ar-condicionado
  const teto = rbox(BL - 0.16, 0.05, BW - 0.14, 0.02, ROOF, { roughness: 0.5 })
  teto.position.y = TOPY + 0.005
  onibus.add(teto)
  const ar = rbox(BL * 0.42, 0.13, BW * 0.6, 0.05, '#d8d4cc', { roughness: 0.5 })
  ar.position.set(-0.25, TOPY + 0.08, 0)
  onibus.add(ar)
  for (let k = 0; k < 4; k++) {
    const grade = rbox(0.03, 0.012, BW * 0.5, 0.004, '#a9a59d', { roughness: 0.5 })
    grade.position.set(-0.55 + k * 0.2, TOPY + 0.148, 0)
    onibus.add(grade)
  }

  // faixa de janelas nas duas laterais
  const WIN_Y = 0.36
  const WIN_H = 0.4
  for (const side of [-1, 1]) {
    const janelas = rbox(BL - 0.62, WIN_H, 0.02, 0.03, GLASS, { roughness: 0.1 })
    janelas.position.set(-0.22, WIN_Y, side * (BW / 2 + 0.002))
    onibus.add(janelas)
    for (let k = 0; k < 4; k++) {
      const coluna = rbox(0.05, WIN_H + 0.02, 0.03, 0.01, BUS, { roughness: 0.35 })
      coluna.position.set(-0.22 - (BL - 0.62) / 2 + ((k + 1) * (BL - 0.62)) / 5, WIN_Y, side * (BW / 2 + 0.006))
      onibus.add(coluna)
    }
    const brilho = rbox(0.5, 0.035, 0.01, 0.01, GLASS_LIGHT, { roughness: 0.1 })
    brilho.position.set(-0.55, WIN_Y + 0.12, side * (BW / 2 + 0.014))
    brilho.rotation.x = side * 0.0
    brilho.rotation.z = 0.25
    onibus.add(brilho)
    // friso escuro logo acima da areia
    const friso = rbox(BL - 0.1, 0.05, 0.02, 0.01, BUS_DARK, { roughness: 0.45 })
    friso.position.set(0, 0.1, side * (BW / 2 + 0.004))
    onibus.add(friso)
  }

  // frente (+x): para-brisa, letreiro, limpador, espelhos
  const parabrisa = rbox(0.02, 0.58, BW - 0.16, 0.04, GLASS, { roughness: 0.08 })
  parabrisa.position.set(BL / 2 + 0.002, 0.34, 0)
  onibus.add(parabrisa)
  const reflexo = rbox(0.01, 0.04, 0.42, 0.01, GLASS_LIGHT, { roughness: 0.08 })
  reflexo.position.set(BL / 2 + 0.012, 0.48, 0.12)
  reflexo.rotation.x = -0.5
  onibus.add(reflexo)
  const limpador = rbox(0.015, 0.02, 0.4, 0.006, RUBBER, { roughness: 0.6 })
  limpador.position.set(BL / 2 + 0.016, 0.1, -0.1)
  limpador.rotation.x = 0.35
  onibus.add(limpador)
  const letreiro = rbox(0.02, 0.13, BW - 0.3, 0.02, '#111316', { roughness: 0.3 })
  letreiro.position.set(BL / 2 + 0.002, 0.77, 0)
  onibus.add(letreiro)
  const led = rbox(0.012, 0.05, BW - 0.44, 0.008, '#ffb43a', { emissive: '#ffa21f', emissiveIntensity: 1.3 })
  led.position.set(BL / 2 + 0.012, 0.77, 0)
  onibus.add(led)
  for (const side of [-1, 1]) {
    const braco = cylinder(0.014, 0.014, 0.18, RUBBER, { roughness: 0.5 }, 8)
    braco.rotation.z = -Math.PI / 2 + 0.35
    braco.position.set(BL / 2 + 0.07, TOPY - 0.08, side * (BW / 2 + 0.02))
    onibus.add(braco)
    const espelho = rbox(0.05, 0.2, 0.09, 0.02, RUBBER, { roughness: 0.45 })
    espelho.position.set(BL / 2 + 0.15, TOPY - 0.18, side * (BW / 2 + 0.03))
    onibus.add(espelho)
  }

  // traseira (-x): janelinha
  const traseira = rbox(0.02, 0.3, BW - 0.36, 0.03, GLASS, { roughness: 0.1 })
  traseira.position.set(-BL / 2 - 0.002, 0.5, 0)
  onibus.add(traseira)

  // vão da porta dianteira, lado direito (+z, virado pra câmera)
  const DOOR_X0 = BL / 2 - 0.5 // dobradiça traseira do vão
  const DOOR_W = 0.38
  const DOOR_TOP = 0.62
  const vao = rbox(DOOR_W, DOOR_TOP + SINK, 0.02, 0.02, INTERIOR, { roughness: 0.6 })
  vao.position.set(DOOR_X0 + DOOR_W / 2, (DOOR_TOP - SINK) / 2, BW / 2 + 0.004)
  onibus.add(vao)
  const degrau = rbox(DOOR_W - 0.04, 0.03, 0.06, 0.01, '#d9b23a', { roughness: 0.5 })
  degrau.position.set(DOOR_X0 + DOOR_W / 2, 0.02, BW / 2 - 0.01)
  onibus.add(degrau)
  const balaustre = cylinder(0.012, 0.012, DOOR_TOP, '#f0c419', { roughness: 0.4 }, 8)
  balaustre.position.set(DOOR_X0 + 0.07, DOOR_TOP / 2, BW / 2 - 0.02)
  onibus.add(balaustre)

  // ---- porta de vidro: folha articulada na frente do vão --------------------
  const porta = new THREE.Group()
  porta.position.set(DOOR_X0 + DOOR_W, 0, BW / 2 + 0.02)
  const PORTA_ABERTA = 1.25
  porta.rotation.y = PORTA_ABERTA
  onibus.add(porta)
  const folhaH = DOOR_TOP + SINK - 0.04
  const moldura = rbox(DOOR_W - 0.02, folhaH, 0.035, 0.02, BUS_DARK, { roughness: 0.4 })
  moldura.position.set(-(DOOR_W - 0.02) / 2, (DOOR_TOP - SINK) / 2, 0)
  porta.add(moldura)
  const vidroPorta = rbox(DOOR_W - 0.1, folhaH - 0.1, 0.04, 0.015, GLASS_LIGHT, { roughness: 0.08 })
  vidroPorta.position.set(-(DOOR_W - 0.02) / 2, (DOOR_TOP - SINK) / 2, 0)
  porta.add(vidroPorta)
  const travessa = rbox(DOOR_W - 0.06, 0.03, 0.045, 0.01, BUS_DARK, { roughness: 0.4 })
  travessa.position.set(-(DOOR_W - 0.02) / 2, 0.22, 0)
  porta.add(travessa)

  // ---- montes de areia levantados + sulco de arrasto ------------------------
  const montes = new THREE.Group()
  montes.position.set(BUS_X, GY, BUS_Z)
  montes.rotation.y = BUS_YAW
  root.add(montes)

  const lumps: [number, number, number, number, number, number][] = [
    // x, z, raio, sx, sy, sz (lado da câmera: alto atrás, baixo na porta)
    [-0.8, BW / 2 + 0.06, 0.34, 1.6, 0.85, 0.85],
    [-0.15, BW / 2 + 0.08, 0.3, 1.4, 0.7, 0.8],
    [0.85, BW / 2 + 0.04, 0.2, 1.3, 0.55, 0.75],
    [0.45, BW / 2 + 0.3, 0.16, 1.4, 0.4, 0.8],
    [-0.5, BW / 2 + 0.38, 0.2, 1.8, 0.45, 0.9],
    // lado do rio, mais altos (aparecem por cima do teto rebaixado)
    [-0.5, -BW / 2 - 0.1, 0.38, 2.0, 0.85, 0.9],
    [0.6, -BW / 2 - 0.1, 0.34, 1.6, 0.8, 0.9],
    // proa: a onda de areia empurrada pelo nariz
    [BL / 2 + 0.08, -0.25, 0.28, 0.8, 0.75, 1.3],
    // popa
    [-BL / 2 - 0.06, 0, 0.27, 0.7, 0.6, 1.7],
  ]
  for (const [x, z, r, sx, sy, sz] of lumps) {
    const l = sphere(r, SAND_DARK, { roughness: 0.95 }, 24)
    l.scale.set(sx, sy, sz)
    l.position.set(x, 0, z)
    montes.add(l)
  }
  // torrões soltos espirrados
  for (let k = 0; k < 9; k++) {
    const side = k % 2 ? 1 : -1
    const c = sphere(0.04 + rand() * 0.04, SAND_DARK, { roughness: 0.95 }, 10)
    c.position.set(-1.0 + rand() * 2.2, 0.015, side * (BW / 2 + 0.45 + rand() * 0.3))
    c.scale.y = 0.7
    montes.add(c)
  }
  const sulco = rbox(0.75, 0.012, BW * 0.8, 0.006, SAND_WET, { roughness: 0.9 })
  sulco.position.set(-BL / 2 - 0.55, 0.004, 0)
  montes.add(sulco)

  // ---- ARIRANHA: corpo (orgânico) ------------------------------------------
  const ariranha = new THREE.Group()
  ariranha.position.set(OT_X, GY, OT_Z)
  ariranha.rotation.y = OT_YAW
  ariranha.scale.setScalar(OT_H)
  root.add(ariranha)

  const quadril = sphere(0.4, FUR, { roughness: 0.85 })
  quadril.scale.set(1.05, 0.95, 0.95)
  quadril.position.set(0, 0.44, -0.02)
  ariranha.add(quadril)

  const tronco = capsule(0.34, 0.6, FUR, { roughness: 0.85 })
  tronco.scale.set(1.04, 1, 0.92)
  tronco.position.set(0, 0.86, 0)
  tronco.rotation.x = -0.06
  ariranha.add(tronco)

  const pescoco = capsule(0.25, 0.22, FUR, { roughness: 0.85 })
  pescoco.position.set(0, 1.38, 0.02)
  ariranha.add(pescoco)

  // mancha creme irregular na garganta/peito
  const patch: [number, number, number, number, number, number, number][] = [
    // babador grande + lóbulos tortos nas bordas
    [0.0, 1.3, 0.15, 0.3, 0.95, 1.25, 0.55],
    [0.13, 1.42, 0.13, 0.14, 1.0, 1.0, 0.8],
    [-0.14, 1.2, 0.17, 0.13, 1.0, 1.0, 0.8],
    [0.1, 1.08, 0.2, 0.12, 1.0, 1.0, 0.8],
    [-0.06, 1.5, 0.12, 0.15, 1.2, 0.9, 0.8],
    [0.17, 1.24, 0.15, 0.1, 1.0, 1.0, 0.8],
  ]
  for (const [x, y, z, r, sx, sy, sz] of patch) {
    const p = sphere(r, CREAM, { roughness: 0.8 }, 20)
    p.scale.set(sx, sy, sz)
    p.position.set(x, y, z)
    ariranha.add(p)
  }

  // patas de trás curtas e pés grandes de membrana
  for (const side of [-1, 1]) {
    const coxa = capsule(0.15, 0.14, FUR, { roughness: 0.85 })
    coxa.position.set(side * 0.24, 0.24, 0.06)
    coxa.rotation.x = 0.4
    ariranha.add(coxa)
    const pe = sphere(0.15, FUR_DARK, { roughness: 0.8 })
    pe.scale.set(1.0, 0.32, 1.7)
    pe.position.set(side * 0.27, 0.05, 0.22)
    pe.rotation.y = side * 0.25
    ariranha.add(pe)
    for (let d = 0; d < 4; d++) {
      const dedo = sphere(0.04, FUR_DARK, { roughness: 0.8 }, 12)
      dedo.position.set(side * 0.27 + (d - 1.5) * 0.065 + side * 0.06, 0.04, 0.45 - Math.abs(d - 1.5) * 0.03)
      ariranha.add(dedo)
    }
  }

  // braço direito (lado da câmera-esquerda) dobrado junto à barriga, de alegria
  const bracoD = capsule(0.085, 0.3, FUR, { roughness: 0.85 })
  bracoD.position.set(-0.33, 1.02, 0.14)
  bracoD.rotation.set(-0.7, 0, -0.35)
  ariranha.add(bracoD)
  const maoD = sphere(0.1, FUR_DARK, { roughness: 0.8 })
  maoD.scale.set(1, 0.8, 1)
  maoD.position.set(-0.28, 0.86, 0.32)
  ariranha.add(maoD)

  // ---- rabo achatado de remo, deitado na areia -----------------------------
  const rabo = new THREE.Group()
  rabo.position.set(0, 0, 0)
  ariranha.add(rabo)
  const tailSegs: [number, number, number, number, number, number][] = [
    // x, y, z, raio, largura, comprimento
    [-0.14, 0.2, -0.28, 0.22, 1.1, 1.0],
    [-0.36, 0.1, -0.44, 0.2, 1.25, 1.3],
    [-0.58, 0.065, -0.58, 0.17, 1.35, 1.35],
    [-0.8, 0.05, -0.72, 0.13, 1.35, 1.4],
    [-0.98, 0.04, -0.83, 0.085, 1.3, 1.5],
  ]
  for (const [x, y, z, r, w, l] of tailSegs) {
    const s = sphere(r, FUR_DARK, { roughness: 0.82 })
    s.scale.set(w, 0.42, l)
    s.position.set(x, y, z)
    s.rotation.y = 1.01
    rabo.add(s)
  }

  // ---- cabeça: larga, focinho bigodudo, boca aberta -------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0.02, 1.62, 0.06)
  cabeca.rotation.set(-0.12, 0.35, 0.05)
  ariranha.add(cabeca)

  const cranio = sphere(0.26, FUR, { roughness: 0.85 })
  cranio.scale.set(1.12, 0.86, 1.0)
  cabeca.add(cranio)
  const focinho = sphere(0.165, FUR, { roughness: 0.85 })
  focinho.scale.set(1.15, 0.72, 1.0)
  focinho.position.set(0, -0.05, 0.2)
  cabeca.add(focinho)
  for (const side of [-1, 1]) {
    const almofada = sphere(0.085, FUR_DARK, { roughness: 0.85 })
    almofada.position.set(side * 0.065, -0.06, 0.29)
    cabeca.add(almofada)
  }
  const nariz = sphere(0.052, NOSE, { roughness: 0.3 })
  nariz.scale.set(1.4, 0.8, 0.9)
  nariz.position.set(0, 0.0, 0.36)
  cabeca.add(nariz)

  // boca aberta: céu da boca escuro, língua, mandíbula com queixo creme
  const boca = sphere(0.1, MOUTH, { roughness: 0.5 })
  boca.scale.set(1.15, 0.65, 0.7)
  boca.position.set(0, -0.15, 0.25)
  cabeca.add(boca)
  const lingua = sphere(0.06, TONGUE, { roughness: 0.4 })
  lingua.scale.set(1.2, 0.45, 1)
  lingua.position.set(0, -0.19, 0.27)
  cabeca.add(lingua)
  const queixo = sphere(0.1, CREAM, { roughness: 0.8 })
  queixo.scale.set(1.15, 0.5, 1.0)
  queixo.position.set(0, -0.24, 0.2)
  cabeca.add(queixo)
  for (const side of [-1, 1]) {
    const dente = cone(0.018, 0.045, TEETH, { roughness: 0.3 }, 10)
    dente.rotation.x = Math.PI
    dente.position.set(side * 0.06, -0.11, 0.31)
    cabeca.add(dente)

    const olho = sphere(0.058, '#ffffff', { roughness: 0.25 }, 16)
    olho.scale.z = 0.6
    olho.position.set(side * 0.13, 0.07, 0.205)
    const pupila = sphere(0.034, '#120c0a', { roughness: 0.15 }, 14)
    pupila.position.set(side * 0.13 + 0.012, 0.075, 0.24)
    const brilho = sphere(0.011, '#ffffff', { roughness: 0.1 }, 8)
    brilho.position.set(side * 0.13 + 0.025, 0.09, 0.27)
    cabeca.add(olho, pupila, brilho)

    const orelha = sphere(0.065, FUR_DARK, { roughness: 0.85 })
    orelha.scale.set(1, 0.9, 0.5)
    orelha.position.set(side * 0.24, 0.13, -0.05)
    orelha.rotation.y = side * 0.5
    cabeca.add(orelha)

    // bigodes (detalhes finos: ficam nítidos no refine)
    for (let w = 0; w < 3; w++) {
      const y0 = -0.04 - w * 0.025
      cabeca.add(tube([
        new THREE.Vector3(side * 0.1, y0, 0.31),
        new THREE.Vector3(side * 0.22, y0 + 0.01 - w * 0.01, 0.33),
        new THREE.Vector3(side * 0.33, y0 - 0.01 - w * 0.03, 0.3),
      ], 0.005, '#efe6d2'))
    }
  }

  // ---- pata esquerda: aponta o ônibus --------------------------------------
  const pata = new THREE.Group()
  pata.position.set(0.33, 1.2, 0.06)
  pata.rotation.set(0.1, 0, ARM_POINT)
  ariranha.add(pata)
  const bracoE = capsule(0.095, 0.3, FUR, { roughness: 0.85 })
  bracoE.position.y = -0.2
  pata.add(bracoE)
  const antebraco = capsule(0.085, 0.24, FUR, { roughness: 0.85 })
  antebraco.position.y = -0.48
  pata.add(antebraco)
  const mao = sphere(0.1, FUR_DARK, { roughness: 0.8 })
  mao.scale.set(1.1, 0.85, 0.9)
  mao.position.y = -0.66
  pata.add(mao)
  const dedao = capsule(0.032, 0.09, FUR_DARK, { roughness: 0.8 })
  dedao.position.y = -0.79
  pata.add(dedao)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'praia', group: 'praia', object: base },
    { name: 'poste', group: 'ponto', object: poste },
    { name: 'hera', group: 'hera', object: hera },
    { name: 'ariranha', group: 'ariranha', object: ariranha },
    { name: 'rabo', group: 'ariranha', object: rabo },
    { name: 'cabeca', group: 'ariranha', object: cabeca },
    { name: 'onibus', group: 'onibus', object: onibus },
    { name: 'montes', group: 'atola', object: montes },
    { name: 'pata', group: 'aponta', object: pata },
    { name: 'porta', group: 'porta', object: porta },
  ]

  // ---- montagem ------------------------------------------------------------
  const [RX, RZ] = [BUS_X - BUS_RUN * bc, BUS_Z + BUS_RUN * bs]
  const build = [
    seq('praia-sobe', 'praia', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Uma prainha de rio: areia fofa na frente, água azul lá atrás.',
    }),

    seq('poste-sobe', 'poste', 1.4, 0.7, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Na areia, um poste de PONTO DE ÔNIBUS com a placa redonda azul…',
    }),

    seq('hera-cresce', 'hera', 2.6, 1.0, [ch('scale.y', 0.02, 1)], {
      ease: 'easeOut',
      caption: '…todo enrolado de HERA, da base até a placa: RRÉR(a) — "här", AQUI.',
    }),

    seq('ariranha-sobe', 'ariranha', 4.1, 0.8, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'Ao lado, a ARIRANHA espera — sem saber se o ônibus para ali mesmo.',
    }),
    seq('rabo-abre', 'rabo', 4.6, 0.5, [ch('rotation.y', 0.9, 0)], { ease: 'easeOut' }),
    seq('cabeca-vira', 'cabeca', 4.6, 0.5, [ch('rotation.y', -0.3, 0.35)], { ease: 'easeOut' }),
    seq('pata-desce', 'pata', 4.6, 0.4, [ch('rotation.z', ARM_REST + 0.6, ARM_REST)], { ease: 'easeOut' }),

    seq('onibus-chega', 'onibus', 5.9, 0.75, [
      ch('position.x', RX, BUS_X),
      ch('position.z', RZ, BUS_Z),
      ch('position.y', GY + SINK, GY + SINK),
    ], {
      ease: 'easeOut',
      caption: 'O ônibus vem a toda pela margem e — (e)STÁ NA AR(eia)! STÁ-NAR…',
    }),
    seq('onibus-atola', 'onibus', 6.75, 0.8, [ch('position.y', GY + SINK, GY)], { ease: 'easeIn' }),
    seq('montes-sobem', 'montes', 6.95, 0.7, [ch('scale.y', 0.02, 1)], {
      ease: 'easeOut',
      caption: '…atolou até a metade das portas: as rodas sumiram, virou um BUS-SEM rodas.',
    }),

    seq('ariranha-pula', 'ariranha', 8.6, 0.3, [ch('position.y', GY, GY + 0.3)], {
      ease: 'easeOut',
      caption: 'A ariranha pula e aponta: parar, ele parou — colado na HERA, e daqui não sai.',
    }),
    seq('ariranha-pousa', 'ariranha', 8.9, 0.3, [ch('position.y', GY + 0.3, GY)], { ease: 'easeIn' }),
    seq('pata-aponta', 'pata', 8.65, 0.45, [ch('rotation.z', ARM_REST, ARM_POINT)], { ease: 'easeOut' }),

    seq('porta-abre', 'porta', 10.0, 0.7, [ch('rotation.y', 0, PORTA_ABERTA)], {
      ease: 'easeInOut',
      caption: 'Stannar bussen här? — O ônibus para aqui?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.05, 2.4, 4.85], target: [-0.2, 0.95, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'stannar-bussen-har',
    contexto:
      "Transporte SL: no ponto, perguntando a quem espera ou ao motorista pela porta da frente — principalmente em ponto de várias linhas, em obra ou com ônibus substituto (ersättningsbuss), quando o ponto muda de lugar. Resposta: 'Ja, den stannar här' ou 'Nej, du måste gå till nästa hållplats'.",
    fraseFonte: 'O ônibus para aqui?',
    fraseAlvo: 'Stannar bussen här?',
    pronuncia:
      "STÁN-nar BÖS-sen RRÉR? ('stannar' com a força no STAN — S colado no T, sem 'is' na frente, A CURTO e aberto, sem o 'ã' nasal, e o N segurado um instante (é dobrado) —, e o -nar fraco com R brando no fim: é o R do presente, sem ele sobra 'stanna', o infinitivo; 'bussen' com U de bico puxando pra Ô, quase BÖS, SS esticado de cobra, e o -sen fraquinho, sem nasal: é 'buss' + o artigo -en, O ônibus; 'här' com h soprado, É bem aberto e longo e R brando; a pergunta começa pelo verbo e a voz sobe no HÄR)",
    ponteSonora:
      "(e)STÁ NA AR(eia)... BUS-SEM... RRÉR(a)? (5 sílabas: STÁN-nar-BÖS-sen-RRÉR; força no STÁN, no BÖS e no RRÉR, onde a voz sobe de pergunta; (e)STÁ NA AR(eia) = 'está na areia' dito num fôlego só e cortado logo depois do R: sem o E da frente — o S já sai colado no T, STÁ, nunca 'is-tá' —, A CURTO e aberto, e o 'na' e o 'ar' se fundem em NAR; o R é o de 'areia', de UM toque só, de 'caro' — é o R do presente: sem ele sobra 'stanna', o infinitivo; nada de nasal: STÁ-NAR, nunca 'stã-nar'; BUS-SEM = o MESMO 'bussen' do pavão de 'Jag har missat bussen': o -BUS de ÔNIBUS, curto, U de bico puxando pra Ô, quase BÖS, SS esticado de cobra, + SEM — aqui o ônibus SEM rodas —, mas SEM NASALAR: E curtinho, N batido na língua, fraco: é o '-en', O ônibus; RRÉR = a HERA sem o -a, a MESMA de 'Det gör ont här' e 'Är det ledigt här?': o H nada mudo, sopra leve como RR carioca, É bem aberto e longo, R brando no fim — se fechar o É em Ô vira 'hår', cabelo)",
    historia:
      'A ariranha espera o ônibus na prainha do rio, ao lado de um poste de ponto todo enrolado de HERA, sem saber se ele para ali mesmo. O ônibus vem a toda pela margem e — ESTÁ NA AREIA! — atola de vez: as rodas somem na areia fofa e ele vira um ÔNIBUS SEM rodas, de barriga no chão. A ariranha dá um pulo de alegria e aponta com a pata: perguntou se o ônibus para aqui? Parar, ele parou — colado na HERA, e daqui não sai mais.',
  },
  createScene,
  refine: { organic: ['ariranha', 'rabo', 'cabeca', 'pata'] },
}

export default card
