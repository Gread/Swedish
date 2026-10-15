import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'
import type { MatOpts } from '../rig/helpers'

/**
 * "När stänger ni?" — NÉR(o)... STÉNG-er... NI?
 *
 * Na galeria, a loja do imperador NERO (letreiro dourado) fecha às seis — e lá
 * dentro ele toca lira enquanto tudo pega fogo. O bombeiro chega ANTES: finca
 * o machado de pé debaixo da porta de aço, ela desce SSS... e bate no cabo:
 * TÉNG! Trava a um palmo do chão, as lâminas tremendo (-er-r-r), e da fresta
 * escapa o brilho laranja. Ele aponta o relógio e grita pra dentro: NI?
 *
 * Diorama: piso de lajotas bege; fachada cinza-clara com faixa grafite e o
 * letreiro NERO; porta de enrolar prateada entre dois trilhos; por dentro, a
 * loja do imperador (cortina roxa, coluna de mármore, lira de ouro), que some
 * quando a porta desce. Paleta fria (cinzas e prata) com o bombeiro em
 * vermelho-escuro/amarelo; o laranja saturado é RESERVADO ao fogo da fresta.
 */

const SOIL = '#2c2823'
const TILE = '#dcc9a5'
const GROUT = '#bfa983'
const FACADE = '#cfd2d5'
const FACADE_DARK = '#a9aeb4'
const FASCIA = '#2b2f35'
const STEEL = '#b9c0c7'
const STEEL_DARK = '#7d858e'
const RAIL = '#5d646c'
const GOLD = '#e6ad2e'
const PURPLE = '#4f2a57'
const PURPLE_DARK = '#3a1d40'
const MARBLE = '#ece7dd'
const INTERIOR = '#2a2224'
const UNIFORM = '#7c2621'
const REFLECT = '#e8d23c'
const SILVER_TAPE = '#d9dde1'
const HELMET = '#f2c12e'
const SKIN = '#e8c39e'
const GLOVE = '#c79a55'
const BLACK = '#1f2124'
const EXT_RED = '#c22e27'
const AXE_RED = '#b3241f'
const BLADE = '#d6dce1'
const RING = '#5f6770'
const FIRE = '#ff5e0e' // acento saturado: RESERVADO ao fogo que escapa da fresta
const FIRE_CORE = '#ffab24'

const GY = 0.16 // topo do piso
const R = 2.62 // raio do disco
const WZ = -0.95 // face da fachada
const WT = 0.16 // espessura da fachada
const WALL_L = -2.2
const WALL_R = 2.38
const WALL_TOP = 2.92
const DX = -0.5 // centro do vão da porta
const DW = 1.5
const DH = 1.86
const GAP = 0.56 // fresta: altura do cabo do machado
const SZ = WZ + 0.06 // plano da porta de aço, entre os trilhos
const ROLL_TOP = GY + DH + 0.1 // eixo de onde a porta desenrola (dentro da caixa)
const SHUTTER_LEN = ROLL_TOP - (GY + GAP)

const AXE_X = -0.46
const HIT: [number, number, number] = [AXE_X, GY + GAP, SZ + 0.1]

const FF: [number, number, number] = [0.86, GY, 0.15]
const FF_S = 1.15
const FF_YAW = -0.15
const ARM_UP = 2.5 // braço erguido apontando o relógio
const ARM_REST = 0.12 // com pivô no ombro: mão caída, um tico pra fora do corpo

const CLOCK: [number, number, number] = [2.03, 1.9, WZ + 0.035]
const MIN_1750 = -(50 / 60) * Math.PI * 2
const MIN_1758 = -(58 / 60) * Math.PI * 2

const GOLD_OPTS: MatOpts = { roughness: 0.28, metalness: 0.65, emissive: '#6e4300', emissiveIntensity: 0.3 }

/** Haste de letra do letreiro, de (x1,y1) a (x2,y2), no plano xy. */
function bar(x1: number, y1: number, x2: number, y2: number, t: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  const m = rbox(t, len, 0.045, 0.012, GOLD, GOLD_OPTS)
  m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0)
  m.rotation.z = Math.atan2(-dx, dy)
  return m
}

/** Serifa romana: tracinho horizontal no pé ou na cabeça de uma haste. */
function serif(x: number, y: number, w = 0.1) {
  const s = rbox(w, 0.026, 0.045, 0.01, GOLD, GOLD_OPTS)
  s.position.set(x, y, 0)
  return s
}

/** N E R O em capitais romanas de traço grosso (altura 0.3). */
function letter(which: 'N' | 'E' | 'R' | 'O') {
  const g = new THREE.Group()
  const T = 0.05
  const H = 0.15
  if (which === 'N') {
    g.add(bar(-0.09, -H, -0.09, H, T * 0.8))
    g.add(bar(0.09, -H, 0.09, H, T * 0.8))
    g.add(bar(-0.09, H - 0.01, 0.09, -H + 0.01, T * 1.1))
    g.add(serif(-0.09, -H + 0.012), serif(-0.1, H - 0.012, 0.07), serif(0.09, H - 0.012))
  } else if (which === 'E') {
    g.add(bar(-0.07, -H, -0.07, H, T))
    g.add(bar(-0.07, H - 0.02, 0.1, H - 0.02, T * 0.8))
    g.add(bar(-0.07, 0, 0.06, 0, T * 0.75))
    g.add(bar(-0.07, -H + 0.02, 0.11, -H + 0.02, T * 0.8))
    g.add(serif(-0.085, H - 0.012, 0.07), serif(-0.085, -H + 0.012, 0.07))
    for (const [x, y] of [[0.1, H - 0.05], [0.11, -H + 0.05], [0.06, 0]] as const) {
      const tick = rbox(0.024, y === 0 ? 0.07 : 0.06, 0.045, 0.008, GOLD, GOLD_OPTS)
      tick.position.set(x, y, 0)
      g.add(tick)
    }
  } else if (which === 'R') {
    g.add(bar(-0.08, -H, -0.08, H, T))
    g.add(bar(-0.08, H - 0.022, 0.01, H - 0.022, T * 0.85))
    g.add(bar(-0.08, 0.005, 0.01, 0.005, T * 0.8))
    const bowl = new THREE.Mesh(
      new THREE.TorusGeometry(0.066, 0.023, 12, 24, Math.PI),
      mat(GOLD, { ...GOLD_OPTS, size: 0.15 }),
    )
    bowl.castShadow = true
    bowl.rotation.z = -Math.PI / 2
    bowl.position.set(0.01, 0.0695, 0)
    bowl.scale.z = 0.9
    g.add(bowl)
    g.add(bar(0.0, 0.0, 0.1, -H + 0.01, T))
    g.add(serif(-0.08, -H + 0.012), serif(-0.09, H - 0.012, 0.07), serif(0.11, -H + 0.012, 0.08))
  } else {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.03, 16, 40),
      mat(GOLD, { ...GOLD_OPTS, size: 0.25 }),
    )
    ring.castShadow = true
    ring.scale.set(1.0, 1.12, 0.75)
    g.add(ring)
  }
  return g
}

/** Fagulha: dois losangos cruzados + miolo claro, emissiva. */
function spark(size: number) {
  const g = new THREE.Group()
  const m = mat(FIRE, { emissive: FIRE, emissiveIntensity: 1.6, roughness: 0.4 })
  for (const rz of [0, Math.PI / 2]) {
    const ray = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), m)
    ray.scale.set(size * 0.3, size, size * 0.22)
    ray.rotation.z = rz
    g.add(ray)
  }
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(size * 0.32, 12, 12),
    mat(FIRE_CORE, { emissive: FIRE_CORE, emissiveIntensity: 1.8, roughness: 0.4 }),
  )
  g.add(core)
  return g
}

/** Arco de som ")" — pedaço de anel virado para a câmera. */
function arc(r: number, side: 1 | -1) {
  const span = 1.5
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.022, 10, 32, span),
    mat(RING, { roughness: 0.45, size: r * 2 }),
  )
  m.rotation.z = side > 0 ? -span / 2 : Math.PI - span / 2
  return m
}

/** Tubo ao longo de uma curva: mangueira do extintor. */
function hose(points: [number, number, number][], r: number, color: string) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r, 10, false), mat(color, { roughness: 0.55, size: 0.3 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: piso de lajotas bege da galeria ------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(R, R + 0.1, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)

  const floor = cylinder(R - 0.05, R, 0.06, TILE, { roughness: 0.55 })
  floor.position.y = GY - 0.03
  base.add(floor)

  // juntas das lajotas (só na frente da fachada)
  const rIn = R - 0.12
  for (let z = WZ + 0.45; z < rIn; z += 0.5) {
    const half = Math.sqrt(Math.max(rIn * rIn - z * z, 0.01))
    const seam = rbox(half * 2, 0.008, 0.02, 0.004, GROUT, { roughness: 0.7 })
    seam.position.set(0, GY + 0.002, z)
    base.add(seam)
  }
  for (let x = -2.25; x <= 2.26; x += 0.5) {
    const zMax = Math.sqrt(Math.max(rIn * rIn - x * x, 0.01))
    const len = zMax - WZ
    if (len < 0.1) continue
    const seam = rbox(0.02, 0.008, len, 0.004, GROUT, { roughness: 0.7 })
    seam.position.set(x, GY + 0.002, (zMax + WZ) / 2)
    base.add(seam)
  }

  // vaso de planta da galeria, à esquerda da loja
  const pot = lathe(
    [[0, 0], [0.17, 0], [0.19, 0.04], [0.21, 0.36], [0.23, 0.38], [0.225, 0.41], [0.19, 0.38], [0, 0.37]],
    '#5b6068',
    { roughness: 0.4 },
  )
  pot.position.set(-1.72, GY, -0.3)
  base.add(pot)
  const leaves = puff(0.27, '#4f7f4b', 7, 37, { roughness: 0.85 })
  leaves.position.set(-1.72, GY + 0.66, -0.3)
  leaves.scale.set(1, 1.2, 1)
  leaves.rotation.y = rand() * Math.PI
  base.add(leaves)

  root.add(base)

  // ---- fachada da loja, cinza-clara ----------------------------------------------
  const fachada = new THREE.Group()
  const wz = WZ - WT / 2
  const doorL = DX - DW / 2
  const doorR = DX + DW / 2
  const WH = WALL_TOP - GY

  const left = rbox(doorL - WALL_L, WH, WT, 0.02, FACADE, { roughness: 0.8 })
  left.position.set((WALL_L + doorL) / 2, GY + WH / 2, wz)
  fachada.add(left)
  const right = rbox(WALL_R - doorR, WH, WT, 0.02, FACADE, { roughness: 0.8 })
  right.position.set((doorR + WALL_R) / 2, GY + WH / 2, wz)
  fachada.add(right)
  const lintel = rbox(DW + 0.04, WALL_TOP - (GY + DH), WT, 0.02, FACADE, { roughness: 0.8 })
  lintel.position.set(DX, (GY + DH + WALL_TOP) / 2, wz)
  fachada.add(lintel)

  // rodapé e cornija
  for (const [x0, x1] of [[WALL_L, doorL - 0.06], [doorR + 0.06, WALL_R]] as const) {
    const plinth = rbox(x1 - x0, 0.14, 0.05, 0.015, FACADE_DARK, { roughness: 0.7 })
    plinth.position.set((x0 + x1) / 2, GY + 0.07, WZ + 0.02)
    fachada.add(plinth)
  }
  const cornice = rbox(WALL_R - WALL_L + 0.08, 0.1, WT + 0.1, 0.03, FACADE_DARK, { roughness: 0.7 })
  cornice.position.set(0, WALL_TOP + 0.03, wz + 0.02)
  fachada.add(cornice)

  // pilastras nas pontas
  for (const px of [WALL_L + 0.08, WALL_R - 0.08]) {
    const pil = rbox(0.14, WH - 0.1, 0.06, 0.02, FACADE_DARK, { roughness: 0.75 })
    pil.position.set(px, GY + (WH - 0.1) / 2, WZ + 0.03)
    fachada.add(pil)
  }

  // faixa grafite onde vai o letreiro
  const fascia = rbox(2.25, 0.5, 0.1, 0.03, FASCIA, { roughness: 0.5 })
  fascia.position.set(DX, 2.56, WZ + 0.05)
  fachada.add(fascia)

  // caixa da porta de enrolar + trilhos
  const rollBox = rbox(DW + 0.26, 0.26, 0.24, 0.05, STEEL_DARK, { roughness: 0.35, metalness: 0.6 })
  rollBox.position.set(DX, GY + DH + 0.13, WZ + 0.1)
  fachada.add(rollBox)
  for (const sx of [-1, 1]) {
    const rail = rbox(0.1, DH + 0.02, 0.14, 0.025, RAIL, { roughness: 0.4, metalness: 0.6 })
    rail.position.set(DX + sx * (DW / 2 + 0.03), GY + DH / 2, SZ)
    fachada.add(rail)
    for (const by of [0.4, 1.0, 1.6]) {
      const bolt = cylinder(0.018, 0.018, 0.02, '#3e444b', { roughness: 0.3, metalness: 0.7 }, 12)
      bolt.rotation.x = Math.PI / 2
      bolt.position.set(DX + sx * (DW / 2 + 0.03), GY + by, SZ + 0.075)
      fachada.add(bolt)
    }
  }
  // soleira metálica da porta
  const sill = rbox(DW + 0.1, 0.02, 0.2, 0.008, STEEL_DARK, { roughness: 0.4, metalness: 0.6 })
  sill.position.set(DX, GY + 0.005, WZ - 0.02)
  fachada.add(sill)

  // ---- a loja do imperador por dentro (some quando a porta desce) ----------
  const ID = 1.05 // profundidade
  const iz = WZ - WT
  const inFloor = rbox(DW + 0.5, 0.04, ID, 0.01, '#3b2b25', { roughness: 0.7 })
  inFloor.position.set(DX, GY - 0.015, iz - ID / 2)
  fachada.add(inFloor)
  const back = rbox(DW + 0.5, DH + 0.3, 0.06, 0.01, INTERIOR, { roughness: 0.9 })
  back.position.set(DX, GY + (DH + 0.3) / 2, iz - ID)
  fachada.add(back)
  for (const sx of [-1, 1]) {
    const side = rbox(0.06, DH + 0.3, ID, 0.01, INTERIOR, { roughness: 0.9 })
    side.position.set(DX + sx * (DW / 2 + 0.25), GY + (DH + 0.3) / 2, iz - ID / 2)
    fachada.add(side)
  }
  const ceil = rbox(DW + 0.5, 0.06, ID, 0.01, INTERIOR, { roughness: 0.9 })
  ceil.position.set(DX, GY + DH + 0.3, iz - ID / 2)
  fachada.add(ceil)
  // cortina roxa imperial em pregas
  for (let i = 0; i < 9; i++) {
    const fold = cylinder(0.1, 0.1, DH + 0.2, i % 2 ? PURPLE : PURPLE_DARK, { roughness: 0.9 }, 16)
    fold.scale.z = 0.5
    fold.position.set(DX - 0.8 + i * 0.2, GY + (DH + 0.2) / 2, iz - ID + 0.09)
    fachada.add(fold)
  }
  // coluna de mármore com a lira de ouro do Nero
  const column = lathe(
    [[0, 0], [0.2, 0], [0.2, 0.06], [0.16, 0.09], [0.13, 0.12], [0.11, 0.7], [0.14, 0.74], [0.19, 0.78], [0.19, 0.83], [0, 0.83]],
    MARBLE,
    { roughness: 0.35 },
  )
  column.position.set(DX + 0.28, GY, iz - 0.62)
  fachada.add(column)
  const lyre = new THREE.Group()
  lyre.position.set(DX + 0.28, GY + 0.86, iz - 0.62)
  lyre.scale.setScalar(1.25)
  fachada.add(lyre)
  const LO: MatOpts = { roughness: 0.28, metalness: 0.65 }
  const lyreBase = rbox(0.2, 0.06, 0.06, 0.02, GOLD, LO)
  lyreBase.position.y = 0.03
  lyre.add(lyreBase)
  for (const sx of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.016, 8, 20, 2.0), mat(GOLD, { ...LO, size: 0.2 }))
    horn.position.set(sx * 0.0, 0.17, 0)
    horn.rotation.z = sx > 0 ? -1.0 : Math.PI - 1.0
    horn.scale.x = sx * 1
    lyre.add(horn)
  }
  const yoke = cylinder(0.014, 0.014, 0.22, GOLD, LO, 10)
  yoke.rotation.z = Math.PI / 2
  yoke.position.y = 0.27
  lyre.add(yoke)
  for (const sx of [-0.045, -0.015, 0.015, 0.045]) {
    const string = cylinder(0.004, 0.004, 0.21, '#fff1c2', { roughness: 0.3 }, 6)
    string.position.set(sx, 0.165, 0.01)
    lyre.add(string)
  }

  root.add(fachada)

  // ---- letreiro dourado NERO --------------------------------------------------
  const letreiro = new THREE.Group()
  letreiro.position.set(DX, 2.56, WZ + 0.125)
  const glyphs: ['N' | 'E' | 'R' | 'O', number][] = [['N', -0.45], ['E', -0.15], ['R', 0.15], ['O', 0.46]]
  for (const [g, gx] of glyphs) {
    const l = letter(g)
    l.position.x = gx
    letreiro.add(l)
  }
  root.add(letreiro)

  // ---- relógio redondo (17h50 → 17h58) -----------------------------------------
  const relogio = new THREE.Group()
  relogio.position.set(...CLOCK)
  root.add(relogio)
  const caseBack = cylinder(0.27, 0.27, 0.06, BLACK, { roughness: 0.4 })
  caseBack.rotation.x = Math.PI / 2
  relogio.add(caseBack)
  const dial = cylinder(0.245, 0.245, 0.02, '#fbfaf6', { roughness: 0.35 })
  dial.rotation.x = Math.PI / 2
  dial.position.z = 0.03
  relogio.add(dial)
  const bezel = torus(0.255, 0.028, BLACK, { roughness: 0.35 })
  bezel.position.z = 0.04
  relogio.add(bezel)
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2
    const big = h % 3 === 0
    const tick = rbox(big ? 0.03 : 0.016, big ? 0.065 : 0.04, 0.01, 0.004, BLACK, { roughness: 0.4 })
    const r = big ? 0.185 : 0.195
    tick.position.set(Math.sin(a) * r, Math.cos(a) * r, 0.045)
    tick.rotation.z = -a
    relogio.add(tick)
  }
  const hourPivot = new THREE.Group()
  hourPivot.position.z = 0.05
  hourPivot.rotation.z = -((5 + 58 / 60) / 12) * Math.PI * 2
  const hourHand = rbox(0.03, 0.13, 0.012, 0.012, BLACK, { roughness: 0.4 })
  hourHand.position.y = 0.05
  hourPivot.add(hourHand)
  relogio.add(hourPivot)
  const hub = cylinder(0.022, 0.022, 0.03, BLACK, { roughness: 0.3 })
  hub.rotation.x = Math.PI / 2
  hub.position.z = 0.065
  relogio.add(hub)

  const ponteiro = new THREE.Group()
  ponteiro.position.z = 0.058
  ponteiro.rotation.z = MIN_1758
  const minuteHand = rbox(0.02, 0.21, 0.01, 0.008, BLACK, { roughness: 0.4 })
  minuteHand.position.y = 0.08
  ponteiro.add(minuteHand)
  relogio.add(ponteiro)

  // ---- porta de aço ondulada (pivô no eixo de enrolar) --------------------------
  const porta = new THREE.Group()
  porta.position.set(DX, ROLL_TOP, SZ)
  root.add(porta)
  const BOTTOM_H = 0.09
  const backing = rbox(DW + 0.04, SHUTTER_LEN - 0.02, 0.03, 0.01, STEEL_DARK, { roughness: 0.4, metalness: 0.6 })
  backing.position.set(0, -SHUTTER_LEN / 2, -0.012)
  porta.add(backing)
  const ribsLen = SHUTTER_LEN - BOTTOM_H
  const N = 17
  const pitch = ribsLen / N
  for (let i = 0; i < N; i++) {
    const rib = cylinder(pitch * 0.5, pitch * 0.5, DW + 0.04, STEEL, { roughness: 0.32, metalness: 0.65 }, 16)
    rib.rotation.z = Math.PI / 2
    rib.scale.z = 0.38 // achata a onda (vira tubo -> ondulação)
    rib.position.set(0, -(i + 0.5) * pitch, 0.005)
    porta.add(rib)
  }
  const bottom = rbox(DW + 0.04, BOTTOM_H, 0.1, 0.025, STEEL_DARK, { roughness: 0.35, metalness: 0.65 })
  bottom.position.set(0, -SHUTTER_LEN + BOTTOM_H / 2, 0)
  porta.add(bottom)
  // fechadura e puxadores na barra de baixo
  const lockPlate = rbox(0.12, 0.07, 0.02, 0.01, '#9aa2aa', { roughness: 0.3, metalness: 0.8 })
  lockPlate.position.set(-0.4, -SHUTTER_LEN + BOTTOM_H / 2, 0.055)
  porta.add(lockPlate)
  const keyhole = cylinder(0.014, 0.014, 0.01, BLACK, { roughness: 0.5 }, 12)
  keyhole.rotation.x = Math.PI / 2
  keyhole.position.set(-0.4, -SHUTTER_LEN + BOTTOM_H / 2, 0.067)
  porta.add(keyhole)
  for (const hx of [-0.62, 0.62]) {
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.012, 8, 16, Math.PI),
      mat('#9aa2aa', { roughness: 0.3, metalness: 0.8, size: 0.1 }),
    )
    handle.rotation.set(-Math.PI / 2, 0, Math.PI)
    handle.position.set(hx, -SHUTTER_LEN + BOTTOM_H / 2, 0.05)
    porta.add(handle)
  }

  // ---- machado de pé, cabo vermelho segurando a porta ------------------------------
  const machado = new THREE.Group()
  machado.position.set(AXE_X, GY, SZ)
  machado.scale.set(1.22, 1, 1.22) // cabeça mais larga e cabo mais grosso; a altura fica = GAP
  root.add(machado)
  // cabeça apoiada no chão: perfil extrudado (lâmina à direita, ponta à esquerda)
  // (lâmina larga em leque à direita, ponta de picareta à esquerda)
  const headShape = new THREE.Shape()
  headShape.moveTo(-0.06, 0.0)
  headShape.lineTo(0.07, 0.0)
  headShape.quadraticCurveTo(0.14, 0.0, 0.235, -0.045)
  headShape.quadraticCurveTo(0.27, 0.085, 0.235, 0.215)
  headShape.quadraticCurveTo(0.14, 0.17, 0.07, 0.17)
  headShape.lineTo(-0.06, 0.17)
  headShape.quadraticCurveTo(-0.14, 0.15, -0.22, 0.085)
  headShape.quadraticCurveTo(-0.14, 0.04, -0.06, 0.0)
  const headGeo = new THREE.ExtrudeGeometry(headShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 12,
  })
  headGeo.translate(0, 0, -0.0225)
  const axeHead = new THREE.Mesh(headGeo, mat(BLADE, { roughness: 0.22, metalness: 0.55, size: 0.4 }))
  axeHead.castShadow = true
  axeHead.receiveShadow = true
  axeHead.position.y = 0.06
  machado.add(axeHead)
  // fio polido da lâmina
  const edge = rbox(0.02, 0.27, 0.06, 0.009, '#f2f5f7', { roughness: 0.12, metalness: 0.9 })
  edge.position.set(0.25, 0.145, 0)
  edge.rotation.z = -0.04
  machado.add(edge)
  // olho do machado (onde o cabo encaixa) e cabo
  const eye = rbox(0.13, 0.2, 0.095, 0.03, AXE_RED, { roughness: 0.3 })
  eye.position.set(0, 0.15, 0)
  machado.add(eye)
  const handleLen = GAP - 0.22
  const shaft = cylinder(0.038, 0.043, handleLen, AXE_RED, { roughness: 0.3 }, 20)
  shaft.position.y = 0.22 + handleLen / 2
  machado.add(shaft)
  const grip = cylinder(0.045, 0.045, 0.1, BLACK, { roughness: 0.7 }, 20)
  grip.position.y = GAP - 0.08
  machado.add(grip)
  const cap = cylinder(0.043, 0.045, 0.02, BLACK, { roughness: 0.6 }, 20)
  cap.position.y = GAP - 0.01
  machado.add(cap)

  // ---- três anéis de som (o TÉNG) ----------------------------------------------------
  const aneis = new THREE.Group()
  aneis.position.set(...HIT)
  root.add(aneis)
  for (const r of [0.15, 0.25, 0.35]) {
    aneis.add(arc(r, 1), arc(r, -1))
  }

  // ---- fogo lá dentro: a fresta brilha laranja ------------------------------------
  const fresta = new THREE.Group()
  fresta.position.set(DX, GY, iz - 0.3)
  root.add(fresta)
  const fireMat = mat(FIRE, { emissive: FIRE, emissiveIntensity: 0.7, roughness: 0.5 })
  const coreMat = mat(FIRE_CORE, { emissive: FIRE_CORE, emissiveIntensity: 0.95, roughness: 0.5 })
  // labaredas em gota (base redonda, ponta fina e torta)
  const FLAME: [number, number][] = [
    [0, 0], [0.55, 0.04], [0.9, 0.14], [1.0, 0.28], [0.88, 0.46], [0.6, 0.66], [0.3, 0.84], [0.08, 0.96], [0, 1],
  ]
  const flameGeo = new THREE.LatheGeometry(FLAME.map(([r, y]) => new THREE.Vector2(r, y)), 24)
  const flames: [number, number, number, number, number][] = [
    [-0.6, 0.0, 0.15, 0.62, 0.12], [-0.32, -0.12, 0.19, 0.82, -0.08], [-0.02, 0.06, 0.16, 0.68, 0.1],
    [0.3, -0.1, 0.18, 0.78, -0.12], [0.6, 0.03, 0.14, 0.58, 0.08],
  ]
  for (const [fx, fz, fr, fh, lean] of flames) {
    const outer = new THREE.Mesh(flameGeo, fireMat)
    outer.scale.set(fr, fh, fr * 0.8)
    outer.position.set(fx, 0, fz)
    outer.rotation.z = lean
    fresta.add(outer)
    const inner = new THREE.Mesh(flameGeo, coreMat)
    inner.scale.set(fr * 0.55, fh * 0.6, fr * 0.45)
    inner.position.set(fx, 0, fz + fr * 0.45)
    inner.rotation.z = lean
    fresta.add(inner)
  }
  // brasa no chão de dentro
  const ember = rbox(DW - 0.1, 0.02, 0.5, 0.01, FIRE, { emissive: FIRE, emissiveIntensity: 0.9, roughness: 0.6 })
  ember.position.set(0, 0.012, 0.05)
  fresta.add(ember)
  const glow = new THREE.PointLight('#ff8a3a', 2.6, 2.8, 1.6)
  glow.position.set(0, 0.25, 0.45)
  fresta.add(glow)

  // ---- três fagulhas saltando da fresta -------------------------------------------------
  const fagulhas = new THREE.Group()
  fagulhas.position.set(DX, GY + 0.12, SZ + 0.08)
  root.add(fagulhas)
  for (const [x, y, z, s] of [[-0.66, 0.3, 0.32, 0.1], [-0.5, 0.68, 0.5, 0.085], [-0.12, 0.98, 0.55, 0.08]] as const) {
    const f = spark(s)
    f.position.set(x, y, z)
    f.rotation.z = rand() * Math.PI
    fagulhas.add(f)
  }

  // ---- bombeiro ------------------------------------------------------------------------
  const bombeiro = new THREE.Group()
  bombeiro.position.set(...FF)
  bombeiro.rotation.y = FF_YAW
  root.add(bombeiro)

  const corpo = person({ body: UNIFORM, skin: SKIN, height: 1.5, armAngle: 0.35 })
  corpo.scale.setScalar(FF_S)
  corpo.rotation.x = 0.06 // inclinado pra fresta
  bombeiro.add(corpo)

  // faixas refletivas amarelas com fio prateado no meio
  for (const y of [0.24, 0.55]) {
    const band = cylinder(0.262, 0.262, 0.07, REFLECT, { roughness: 0.4 })
    band.position.y = y
    corpo.add(band)
    const tape = cylinder(0.265, 0.265, 0.022, SILVER_TAPE, { roughness: 0.2, metalness: 0.6 })
    tape.position.y = y
    corpo.add(tape)
  }
  // fecho da japona: tira escura com presilhas
  for (const y of [0.36, 0.45, 0.66]) {
    const clasp = rbox(0.07, 0.03, 0.03, 0.01, BLACK, { roughness: 0.4, metalness: 0.4 })
    clasp.position.set(0, y, 0.255)
    corpo.add(clasp)
  }
  // botas pretas de cano
  for (const side of [-1, 1]) {
    const boot = rbox(0.22, 0.18, 0.31, 0.07, BLACK, { roughness: 0.55 })
    boot.position.set(side * 0.11, 0.075, 0.04)
    corpo.add(boot)
  }
  const collar = torus(0.17, 0.045, UNIFORM, { roughness: 0.8 })
  collar.rotation.x = Math.PI / 2
  collar.position.y = 0.77
  corpo.add(collar)

  // braços: punhos refletivos e luvas de couro
  const armL = corpo.getObjectByName('armL') as THREE.Mesh
  const armR = corpo.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(armL, 1.5)
  shoulderPivot(armR, 1.5)
  for (const arm of [armL, armR]) {
    const hand = arm.children[0] as THREE.Mesh
    hand.material = mat(GLOVE, { roughness: 0.75, size: 0.15 })
    const cuff = torus(0.088, 0.024, REFLECT, { roughness: 0.4 })
    cuff.rotation.x = Math.PI / 2
    cuff.position.y = hand.position.y + 0.12
    arm.add(cuff)
  }
  // braço do lado da porta: mão aberta pra fresta
  armL.rotation.set(0.05, 0, -0.82)
  // braço do lado do relógio (peça): aponta pra cima, pro relógio
  const braco = armR
  braco.rotation.set(-0.15, 0, ARM_UP)

  const head = corpo.getObjectByName('head') as THREE.Group
  head.rotation.set(0.08, -0.38, 0) // rosto de 3/4, gritando pra fresta

  // bigode, sobrancelhas e boca gritando
  for (const side of [-1, 1]) {
    const lobe = capsule(0.032, 0.08, '#5a3a22', { roughness: 0.9 })
    lobe.rotation.z = side * (Math.PI / 2 - 0.35)
    lobe.position.set(side * 0.055, -0.07, 0.262)
    head.add(lobe)
    const brow = capsule(0.018, 0.075, '#4a3020', { roughness: 0.9 })
    brow.rotation.z = side * (Math.PI / 2 + 0.3)
    brow.position.set(side * 0.105, 0.125, 0.248)
    head.add(brow)
  }
  const mouth = sphere(0.07, '#3a1d1a', { roughness: 0.7 })
  mouth.scale.set(1, 1.25, 0.6)
  mouth.position.set(0, -0.145, 0.232)
  head.add(mouth)
  const lips = torus(0.072, 0.018, '#b8645a', { roughness: 0.5 })
  lips.scale.set(1, 1.2, 1)
  lips.position.set(0, -0.145, 0.245)
  head.add(lips)

  // ---- capacete amarelo, aba larga atrás -------------------------------------------------
  const capacete = new THREE.Group()
  capacete.position.set(0, 0.1, -0.01)
  capacete.rotation.x = -0.08
  head.add(capacete)
  const dome = lathe(
    [[0.31, 0], [0.31, 0.04], [0.295, 0.11], [0.26, 0.18], [0.2, 0.24], [0.12, 0.275], [0, 0.29]],
    HELMET,
    { roughness: 0.3 },
  )
  capacete.add(dome)
  const brim = lathe(
    [[0.27, 0.01], [0.36, -0.005], [0.42, -0.03], [0.43, -0.05], [0.39, -0.035], [0.3, -0.01], [0.27, -0.005]],
    HELMET,
    { roughness: 0.3 },
  )
  brim.scale.set(1, 1, 1.28)
  brim.position.z = -0.1
  capacete.add(brim)
  const comb = new THREE.Mesh(new THREE.TorusGeometry(0.275, 0.03, 10, 32, Math.PI), mat(HELMET, { roughness: 0.3, size: 0.5 }))
  comb.rotation.y = Math.PI / 2
  comb.scale.y = 1.02
  comb.position.y = 0.01
  comb.castShadow = true
  capacete.add(comb)
  const shield = rbox(0.13, 0.14, 0.03, 0.03, BLACK, { roughness: 0.4 })
  shield.position.set(0, 0.11, 0.285)
  shield.rotation.x = -0.45
  capacete.add(shield)
  // emblema redondo: disco amarelo com miolo vermelho
  const emblem = cylinder(0.04, 0.04, 0.014, REFLECT, { roughness: 0.35, metalness: 0.3 }, 20)
  emblem.rotation.x = Math.PI / 2 - 0.45
  emblem.position.set(0, 0.114, 0.302)
  capacete.add(emblem)
  const emblemCore = cylinder(0.02, 0.02, 0.016, EXT_RED, { roughness: 0.4 }, 16)
  emblemCore.rotation.x = Math.PI / 2 - 0.45
  emblemCore.position.set(0, 0.116, 0.306)
  capacete.add(emblemCore)

  // ---- extintor vermelho com mangueirinha preta --------------------------------------
  const extintor = new THREE.Group()
  extintor.position.set(1.62, GY, 0.6)
  extintor.rotation.y = -0.5
  root.add(extintor)
  const tank = lathe(
    [[0, 0], [0.12, 0], [0.13, 0.025], [0.13, 0.5], [0.115, 0.56], [0.07, 0.6], [0.045, 0.61], [0, 0.61]],
    EXT_RED,
    { roughness: 0.28 },
  )
  extintor.add(tank)
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.133, 0.133, 0.17, 24, 1, true, -0.65, 1.3),
    mat('#f3efe6', { roughness: 0.5, size: 0.2 }),
  )
  label.position.y = 0.3
  extintor.add(label)
  const labelBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.134, 0.134, 0.03, 24, 1, true, -0.65, 1.3),
    mat(BLACK, { roughness: 0.5, size: 0.2 }),
  )
  labelBand.position.y = 0.33
  extintor.add(labelBand)
  const valve = cylinder(0.04, 0.045, 0.08, '#3a3f45', { roughness: 0.3, metalness: 0.7 }, 16)
  valve.position.y = 0.65
  extintor.add(valve)
  const lever = rbox(0.2, 0.025, 0.05, 0.01, '#aab1b8', { roughness: 0.25, metalness: 0.8 })
  lever.position.set(-0.04, 0.72, 0)
  lever.rotation.z = 0.18
  extintor.add(lever)
  const lever2 = rbox(0.17, 0.022, 0.045, 0.01, '#aab1b8', { roughness: 0.25, metalness: 0.8 })
  lever2.position.set(-0.035, 0.675, 0)
  extintor.add(lever2)
  const gauge = cylinder(0.035, 0.035, 0.025, '#f4f2ea', { roughness: 0.3 }, 16)
  gauge.rotation.x = Math.PI / 2
  gauge.position.set(0.045, 0.66, 0.045)
  extintor.add(gauge)
  const needle = rbox(0.004, 0.025, 0.004, 0.001, EXT_RED, { roughness: 0.4 })
  needle.position.set(0.045, 0.665, 0.06)
  needle.rotation.z = -0.6
  extintor.add(needle)
  extintor.add(hose([[0.03, 0.66, -0.03], [0.12, 0.64, -0.08], [0.18, 0.5, -0.07], [0.17, 0.3, -0.02], [0.15, 0.17, 0.02]], 0.018, BLACK))
  const nozzle = cone(0.03, 0.09, BLACK, { roughness: 0.6 }, 12)
  nozzle.position.set(0.148, 0.13, 0.025)
  nozzle.rotation.z = Math.PI
  extintor.add(nozzle)
  const clipBand = torus(0.132, 0.012, BLACK, { roughness: 0.5 })
  clipBand.rotation.x = Math.PI / 2
  clipBand.position.y = 0.17
  extintor.add(clipBand)

  // ---- peças --------------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'galeria', object: base },
    { name: 'fachada', group: 'galeria', object: fachada },
    { name: 'letreiro', group: 'nero', object: letreiro },
    { name: 'relogio', group: 'nero', object: relogio },
    { name: 'ponteiro', group: 'nero', object: ponteiro },
    { name: 'bombeiro', group: 'bombeiro', object: bombeiro },
    { name: 'capacete', group: 'bombeiro', object: capacete },
    { name: 'extintor', group: 'bombeiro', object: extintor },
    { name: 'machado', group: 'machado', object: machado },
    { name: 'porta', group: 'porta', object: porta },
    { name: 'aneis', group: 'porta', object: aneis },
    { name: 'fresta', group: 'fogo', object: fresta },
    { name: 'fagulhas', group: 'fogo', object: fagulhas },
    { name: 'braco', group: 'grito', object: braco },
  ]

  // ---- montagem -----------------------------------------------------------------------
  const S3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const LY = 2.56
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Numa galeria, sobe a loja do imperador NERO — NÉR(o)… — com sua lira de ouro lá dentro.',
    }),
    seq('fachada-rise', 'fachada', 0.25, 0.9, [riseFrom(0, 3.1)], { ease: 'easeOut' }),
    seq('letreiro-cai', 'letreiro', 1.15, 0.7, [ch('position.y', LY + 0.9, LY), ...S3(0.01, 1)], { ease: 'easeOut' }),
    seq('relogio-cresce', 'relogio', 1.6, 0.5, S3(0.01, 1), { ease: 'easeOut' }),
    seq('ponteiro-anda', 'ponteiro', 1.6, 1.6, [ch('rotation.z', MIN_1750, MIN_1758)], { ease: 'easeInOut' }),

    seq('bombeiro-rise', 'bombeiro', 3.2, 0.85, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Quase seis da tarde: na hora de fechar, Nero toca lira e tudo pega fogo. O bombeiro chega ANTES.',
    }),
    seq('braco-repouso', 'braco', 3.2, 0.1, [ch('rotation.z', ARM_REST, ARM_REST), ch('rotation.x', 0, 0)]),
    seq('capacete-pousa', 'capacete', 3.75, 0.55, [ch('position.y', 0.6, 0.1), ...S3(0.01, 1)], { ease: 'easeOut' }),
    seq('extintor-rise', 'extintor', 3.9, 0.6, [riseFrom(GY, 0.8)], { ease: 'easeOut' }),

    seq('machado-finca', 'machado', 4.9, 0.6, [ch('position.y', GY + 1.0, GY), ch('rotation.z', 1.1, 0)], {
      ease: 'easeIn',
      caption: 'Ele finca o machado de pé, bem debaixo da porta de aço…',
    }),

    seq('porta-desce', 'porta', 6.2, 1.0, [ch('scale.y', 0.03, 1)], {
      ease: 'easeIn',
      caption: '…a porta desce — SSS… — e bate no cabo: TÉNG! STÉNG!',
    }),
    seq('aneis-ecoam', 'aneis', 7.2, 0.5, S3(0.01, 1), { ease: 'easeOut' }),
    seq('porta-quica-a', 'porta', 7.2, 0.1, [ch('scale.y', 1, 0.97)], { ease: 'easeOut' }),
    seq('porta-quica-b', 'porta', 7.3, 0.14, [ch('scale.y', 0.97, 1)], { ease: 'easeIn' }),

    seq('porta-treme-1', 'porta', 7.6, 0.08, [ch('position.x', DX, DX + 0.014)], {
      caption: 'Trava a um palmo do chão, as lâminas tremendo: -er-r-r…',
    }),
    seq('porta-treme-2', 'porta', 7.68, 0.08, [ch('position.x', DX + 0.014, DX - 0.012)]),
    seq('porta-treme-3', 'porta', 7.76, 0.08, [ch('position.x', DX - 0.012, DX + 0.009)]),
    seq('porta-treme-4', 'porta', 7.84, 0.08, [ch('position.x', DX + 0.009, DX - 0.006)]),
    seq('porta-treme-5', 'porta', 7.92, 0.1, [ch('position.x', DX - 0.006, DX)]),

    seq('fresta-acende', 'fresta', 8.5, 0.8, [riseFrom(GY, 0.75)], {
      ease: 'easeOut',
      caption: '…e pela fresta escapa o brilho laranja do fogo lá dentro.',
    }),
    seq('fagulhas-saltam', 'fagulhas', 8.9, 0.6, [...S3(0.01, 1), ch('position.y', GY, GY + 0.12)], { ease: 'easeOut' }),

    seq('braco-aponta', 'braco', 10.0, 0.6, [ch('rotation.z', ARM_REST, ARM_UP), ch('rotation.x', 0, -0.15)], {
      ease: 'easeOut',
      caption: 'Ele aponta o relógio e grita pra dentro: NÉR!… STÉNG-er… NI?',
    }),
    seq('bombeiro-grita', 'bombeiro', 10.0, 0.3, [ch('position.y', GY, GY + 0.06)], { ease: 'easeOut' }),
    seq('bombeiro-assenta', 'bombeiro', 10.3, 0.3, [ch('position.y', GY + 0.06, GY)], { ease: 'easeIn' }),

    seq('braco-insiste-a', 'braco', 11.4, 0.25, [ch('rotation.z', ARM_UP, ARM_UP + 0.15)], {
      ease: 'easeOut',
      caption: 'När stänger ni? — A que horas vocês fecham?',
    }),
    seq('braco-insiste-b', 'braco', 11.65, 0.3, [ch('rotation.z', ARM_UP + 0.15, ARM_UP)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 1.8, 4.55], target: [0.12, 1.32, -0.4] },
  }
}

export const card: Card = {
  meta: {
    id: 'nar-stanger-ni',
    contexto:
      "Compras: antes de sair correndo pra loja, farmácia, Systembolaget ou ombud do correio — pessoalmente ou por telefone. Na Suécia o horário encurta muito no sábado, no domingo e nas vésperas de feriado (julafton, midsommarafton). O par sai no mesmo molde: 'När öppnar ni?' (a que horas vocês abrem?).",
    fraseFonte: 'A que horas vocês fecham?',
    fraseAlvo: 'När stänger ni?',
    pronuncia:
      "nér STÉNG-er ni? ('när' com É bem aberto e longo + R brando de 'caro'; 'stänger' com a força no STÉNG, É aberto e CURTO e o NG só nasal, no fundo da boca, como no inglês 'sing' — o G não estala —, e o -er fraquinho mas presente: sem ele vira 'stäng!' (feche!); 'ni' = vocês, I limpo e sem força)",
    ponteSonora:
      "NÉR(o)... STÉNG-er... NI? (4 sílabas: nér-STÉNG-er-ni; força no STÉNG; NÉR = NERO sem o -O, o imperador que tocava lira enquanto Roma queimava — o MESMO NÉR de 'När går nästa buss?': o português já diz NÉ-ro com É ABERTO de 'pé' e R de um toque só, de 'caro', que é o R sueco; com Ê fechado vira 'ner' (pra baixo); STÉNG = o estrondo da porta de aço da loja descendo e batendo no cabo do machado — é o próprio som de FECHAR: o SSS do aço deslizando gruda direto no TÉNG da pancada, numa sílaba só — sem o 'is' que o brasileiro põe antes de S (nada de 'is-téng') —, É ABERTO e CURTO, uma pancada seca (o que fica ressoando é o NG, não o É), e o NG fica só no fundo da boca, como no inglês 'sing': o G NÃO estala, nada de 'stén-gui'; -er é o tremidinho fraco que as lâminas da porta dão depois da pancada, com R brando — e ele é OBRIGATÓRIO: sem ele sobra 'stäng!', que é a ordem 'feche!', e não a pergunta; não confunda com SLÉNGUER, o guaxinim que arremessa o papelão em 'Var slänger man kartong?': lá é SL (joga fora), aqui é ST (fecha); NI = 'vocês', I limpo e sem força, o mesmo NI de 'Har ni...?' e 'Kan ni dämpa er lite?')",
    historia:
      'Na galeria, a loja do imperador NERO tem fama: na hora de fechar, ele baixa a porta de aço e, lá dentro, dedilha a lira enquanto tudo pega fogo. O bombeiro aprendeu a lição e agora chega ANTES: finca o cabo do machado no chão bem debaixo da porta — e ela desce SSS... TÉNG! —, bate no cabo e trava a um palmo do chão, com as lâminas ainda tremendo: -er-r-r. Agachado na fresta, de onde já escapa um brilho laranja, ele grita: NÉR!... STÉNG-er... NI? Ele quer saber o minuto exato em que vocês fecham, pra ficar de plantão.',
  },
  createScene,
}

export default card
