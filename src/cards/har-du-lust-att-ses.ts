import * as THREE from 'three'
import type { Card, CardScene, Channel, Sequence } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Har du lust att ses?" — RRÁR-DÜ... LUST(re)... ÀS SEIS?
 *
 * Salão de pedra de um castelo. Um mosqueteiro de capa azul entra voando,
 * agarra o aro de um LUSTRE de ferro com SEIS velas e, pendurado no ar,
 * solta a risada de capa-e-espada (RRÁR!), aponta o florete pra você (DÜ!),
 * sacode o lustre (LUST-) e espia o relógio na parede: ÀS SEIS?
 *
 * Hierarquia do balanço: a corrente gira no gancho da viga; o lustre é filho
 * dela (pivô na coroa) e o mosqueteiro também (pivô na mão que agarra o aro),
 * então sacudir a corrente balança tudo junto.
 */

const DISC = '#3a3c41'
const GROUT = '#4b4e54'
const TILES = ['#7f8288', '#878a90', '#74777d', '#8d9095']
const MORTAR = '#958670'
const STONES = ['#cbb995', '#c2ad88', '#d3c3a1', '#b9a581', '#c6b28c']
const STONE_LIGHT = '#dccdae'
const GLASS = '#3f5590'
const IRON = '#2a2a2e'
const BEAM = '#4a3524'
const WOOD = '#8a5a32'
const WOOD_DARK = '#5e3c22'
const TUNIC = '#2f5fae'
const TUNIC_DARK = '#244b8c'
const CROSS = '#f3eee2'
const BREECHES = '#5d566b'
const BOOT = '#6b4428'
const BOOT_CUFF = '#7d5232'
const GLOVE = '#b98a56'
const LEATHER = '#5a3a22'
const SKIN = '#e8c39e'
const HAIR = '#4a2f1e'
const HAT = '#29242a'
const PLUME = '#a92f3b'
const GOLD = '#d1a23e'
const SILVER = '#cfd5dc'
const CREAM = '#f1e8d4'
const WAX = '#f4efe2'
const FLAME = '#ff9426' // acento saturado RESERVADO às chamas das seis velas

const GY = 0.18 // topo das lajotas
const WALL_Z = -1.45 // face da parede de pedra
const WALL_W = 4.8
const WALL_H = 4.8
const HOOK = new THREE.Vector3(-0.35, 4.45, 0.0) // gancho na viga
const CHAIN = 1.15 // gancho → coroa do lustre
const DROP = 0.6 // coroa → aro
const RING_R = 0.62
const GRIP_ANGLE = THREE.MathUtils.degToRad(35) // onde a mão agarra o aro
const CANDLE_ANGLES = [5, 65, 125, 185, 245, 305].map((d) => THREE.MathUtils.degToRad(d))
const PH = 1.6 // altura do mosqueteiro
const TILT = 0.3 // corpo jogado pra fora no balanço
const YAW = -0.12
const SWING = 0.1 // corrente na pose final
const CLOCK = new THREE.Vector3(-1.85, 2.75, WALL_Z + 0.07)
const WIN_X = HOOK.x // janela atrás do lustre: as chamas acesas contra o crepúsculo
const WIN_SILL = 1.55
const WIN_W = 0.78
const WIN_RECT = 0.95
/** Direção do florete no mundo: na sua direção, com um pouco de 3/4 pra ler a lâmina. */
const AIM_DIR = new THREE.Vector3(0.32, 0.05, 0.95).normalize()

const scale3 = (from: number, to: number): Channel[] => [
  ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
]

const metal = (roughness = 0.4) => ({ roughness, metalness: 0.75 })

/** Barra de ferro entre dois pontos (hastes do lustre). */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = b.clone().sub(a)
  const m = cylinder(r, r, d.length(), color, metal(0.45), 10)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Remendo curvo de pano colado no tronco (a cruz da túnica). */
function patch(r: number, h: number, theta: number, color: string) {
  const geo = new THREE.CylinderGeometry(r, r, h, 16, 1, true, -theta / 2, theta)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.85, size: h }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** "6" de traço grosso (estilo display), no plano xy. */
function six(color: string) {
  const g = new THREE.Group()
  const w = 0.11
  const h = 0.17
  const t = 0.032
  const bar = (bw: number, bh: number, x: number, y: number) => {
    const s = rbox(bw, bh, 0.02, 0.008, color, { roughness: 0.5 })
    s.position.set(x, y, 0)
    g.add(s)
  }
  bar(w, t, 0, h / 2 - t / 2) // topo
  bar(t, h, -w / 2 + t / 2, 0) // lado esquerdo inteiro
  bar(w, t, 0, 0) // meio
  bar(w, t, 0, -h / 2 + t / 2) // base
  bar(t, h / 2, w / 2 - t / 2, -h / 4) // barriga direita
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- piso de lajotas de pedra cinza --------------------------------------
  const piso = new THREE.Group()
  const disc = cylinder(2.62, 2.72, 0.12, DISC, { roughness: 0.95 })
  disc.position.y = 0.06
  piso.add(disc)
  const grout = cylinder(2.56, 2.6, 0.04, GROUT, { roughness: 0.95 })
  grout.position.y = 0.13
  piso.add(grout)
  const TILE = 0.6
  for (let j = -5; j <= 5; j++) {
    for (let i = -5; i <= 5; i++) {
      const cx = i * TILE + (j % 2 ? TILE / 2 : 0)
      const cz = j * TILE
      const far = Math.hypot(Math.abs(cx) + TILE / 2, Math.abs(cz) + TILE / 2)
      if (far > 2.58) continue
      const tile = rbox(TILE - 0.05, 0.03, TILE - 0.05, 0.012, TILES[Math.floor(rand() * TILES.length)], {
        roughness: 0.8,
      })
      tile.position.set(cx, GY - 0.015 + (rand() - 0.5) * 0.006, cz)
      tile.rotation.y = (rand() - 0.5) * 0.03
      piso.add(tile)
    }
  }
  root.add(piso)

  // ---- parede de pedra bege com janela em arco, viga e consolo -------------
  const parede = new THREE.Group()
  const mortar = rbox(WALL_W, WALL_H, 0.3, 0.05, MORTAR, { roughness: 0.95 })
  mortar.position.set(0, GY + WALL_H / 2, WALL_Z - 0.15)
  parede.add(mortar)

  const winTop = WIN_SILL + WIN_RECT + WIN_W / 2
  const ROW = 0.3
  for (let r = 0; (r + 1) * ROW <= WALL_H + 1e-6; r++) {
    const y = GY + r * ROW + ROW / 2
    let x = -WALL_W / 2 - (r % 2 ? 0.28 : 0)
    while (x < WALL_W / 2) {
      const w = 0.46 + rand() * 0.3
      const x0 = Math.max(x, -WALL_W / 2 + 0.02)
      const x1 = Math.min(x + w, WALL_W / 2 - 0.02)
      x += w
      if (x1 - x0 < 0.14) continue
      // vão da janela fica livre (o arco e as ombreiras emolduram)
      if (x1 > WIN_X - WIN_W / 2 - 0.2 && x0 < WIN_X + WIN_W / 2 + 0.2 &&
          y + ROW / 2 > WIN_SILL - 0.04 && y - ROW / 2 < winTop + 0.18) continue
      const stone = rbox(x1 - x0 - 0.045, ROW - 0.045, 0.1, 0.035,
        STONES[Math.floor(rand() * STONES.length)], { roughness: 0.9 })
      stone.position.set((x0 + x1) / 2, y, WALL_Z - 0.01 + (rand() - 0.5) * 0.02)
      parede.add(stone)
    }
  }

  // vidro do crepúsculo (retângulo + meia-lua) com caixilhos de chumbo
  const glassOpts = { emissive: '#22336a', emissiveIntensity: 0.55, roughness: 0.25 }
  const glassRect = rbox(WIN_W, WIN_RECT + 0.02, 0.03, 0.01, GLASS, glassOpts)
  glassRect.position.set(WIN_X, WIN_SILL + WIN_RECT / 2, WALL_Z + 0.01)
  parede.add(glassRect)
  const glassArch = cylinder(WIN_W / 2, WIN_W / 2, 0.03, GLASS, glassOpts, 40)
  glassArch.rotation.x = Math.PI / 2
  glassArch.position.set(WIN_X, WIN_SILL + WIN_RECT, WALL_Z + 0.01)
  parede.add(glassArch)
  const mullion = rbox(0.035, WIN_RECT + WIN_W / 2 - 0.02, 0.03, 0.01, IRON, metal(0.5))
  mullion.position.set(WIN_X, WIN_SILL + (WIN_RECT + WIN_W / 2) / 2, WALL_Z + 0.035)
  parede.add(mullion)
  for (const hy of [WIN_SILL + 0.32, WIN_SILL + 0.66, WIN_SILL + WIN_RECT]) {
    const transom = rbox(WIN_W, 0.03, 0.03, 0.01, IRON, metal(0.5))
    transom.position.set(WIN_X, hy, WALL_Z + 0.035)
    parede.add(transom)
  }
  // ombreiras em pedra clara alternando largura (cunhais)
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const bw = k % 2 ? 0.2 : 0.27
      const jamb = rbox(bw, 0.235, 0.15, 0.03, STONE_LIGHT, { roughness: 0.85 })
      jamb.position.set(WIN_X + side * (WIN_W / 2 + bw / 2 - 0.01), WIN_SILL + 0.12 + k * 0.245, WALL_Z + 0.03)
      parede.add(jamb)
    }
  }
  // aduelas do arco
  const ARCH_N = 9
  for (let k = 0; k < ARCH_N; k++) {
    const a = ((k + 0.5) / ARCH_N) * Math.PI
    const rr = WIN_W / 2 + 0.11
    const v = rbox(0.15, 0.22, 0.15, 0.03, STONE_LIGHT, { roughness: 0.85 })
    v.position.set(WIN_X + Math.cos(a) * rr, WIN_SILL + WIN_RECT + Math.sin(a) * rr, WALL_Z + 0.03)
    v.rotation.z = a - Math.PI / 2
    parede.add(v)
  }
  const sill = rbox(WIN_W + 0.42, 0.1, 0.24, 0.03, STONE_LIGHT, { roughness: 0.85 })
  sill.position.set(WIN_X, WIN_SILL - 0.05, WALL_Z + 0.07)
  parede.add(sill)

  // viga de madeira saindo da parede, sobre um consolo de pedra; gancho de ferro
  const beamLen = HOOK.z + 0.22 - (WALL_Z - 0.1)
  const beam = rbox(0.24, 0.24, beamLen, 0.04, BEAM, { roughness: 0.8 })
  beam.position.set(HOOK.x, HOOK.y + 0.2, WALL_Z - 0.1 + beamLen / 2)
  parede.add(beam)
  const corbel = rbox(0.3, 0.42, 0.36, 0.05, STONE_LIGHT, { roughness: 0.85 })
  corbel.position.set(HOOK.x, HOOK.y - 0.13, WALL_Z + 0.16)
  parede.add(corbel)
  const strapIron = rbox(0.26, 0.04, 0.12, 0.01, IRON, metal(0.5))
  strapIron.position.set(HOOK.x, HOOK.y + 0.07, HOOK.z)
  parede.add(strapIron)
  const hookRing = torus(0.055, 0.016, IRON, metal(0.45))
  hookRing.position.set(HOOK.x, HOOK.y + 0.01, HOOK.z)
  parede.add(hookRing)
  root.add(parede)

  // ---- banquinho derrubado + taça caída (ele pulou daqui) -----------------
  const banquinho = new THREE.Group()
  const stool = new THREE.Group()
  const seat = lathe([[0, 0], [0.2, 0], [0.22, 0.025], [0.215, 0.055], [0.19, 0.065], [0, 0.065]], WOOD, {
    roughness: 0.65,
  })
  seat.position.y = 0.4
  stool.add(seat)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.3
    const leg = cylinder(0.022, 0.028, 0.43, WOOD_DARK, { roughness: 0.7 })
    leg.position.set(Math.cos(a) * 0.14, 0.2, Math.sin(a) * 0.14)
    leg.rotation.set(Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14)
    stool.add(leg)
  }
  const ringStretch = torus(0.15, 0.014, WOOD_DARK, { roughness: 0.7 })
  ringStretch.rotation.x = Math.PI / 2
  ringStretch.position.y = 0.15
  stool.add(ringStretch)
  stool.rotation.z = Math.PI / 2 + 0.06
  stool.position.set(0.25, GY + 0.215, 0)
  banquinho.add(stool)

  const goblet = lathe(
    [[0, 0], [0.07, 0], [0.072, 0.012], [0.02, 0.03], [0.016, 0.11], [0.05, 0.13], [0.075, 0.2],
      [0.072, 0.205], [0.045, 0.14], [0, 0.135]],
    GOLD,
    metal(0.3),
  )
  goblet.rotation.set(0, 0.7, Math.PI / 2 - 0.12)
  goblet.position.set(2.35, GY + 0.075, -0.55)
  banquinho.add(goblet)
  const wine = cylinder(0.2, 0.21, 0.012, '#5e1a26', { roughness: 0.15 })
  wine.scale.z = 0.7
  wine.position.set(2.62, GY + 0.006, -0.45)
  banquinho.add(wine)
  banquinho.position.set(-1.55, 0, 0.05)
  root.add(banquinho)

  // ---- relógio de parede (moldura dourada, marcando 6h) ---------------------
  const relogio = new THREE.Group()
  relogio.position.copy(CLOCK)
  const clockBack = cylinder(0.47, 0.47, 0.05, WOOD_DARK, { roughness: 0.7 }, 48)
  clockBack.rotation.x = Math.PI / 2
  relogio.add(clockBack)
  const face = cylinder(0.41, 0.41, 0.04, CREAM, { roughness: 0.5 }, 48)
  face.rotation.x = Math.PI / 2
  face.position.z = 0.03
  relogio.add(face)
  const frame = torus(0.425, 0.05, GOLD, metal(0.3))
  frame.position.z = 0.05
  relogio.add(frame)
  for (let i = 0; i < 12; i++) {
    if (i === 6) continue
    const a = (i / 12) * Math.PI * 2
    const big = i % 3 === 0
    const tick = rbox(big ? 0.042 : 0.024, big ? 0.085 : 0.05, 0.015, 0.006, IRON, { roughness: 0.5 })
    tick.position.set(Math.sin(a) * 0.33, Math.cos(a) * 0.33, 0.055)
    tick.rotation.z = -a
    relogio.add(tick)
  }
  const numeral = six(IRON)
  numeral.position.set(0, -0.27, 0.055)
  relogio.add(numeral)
  root.add(relogio)

  // ponteiros: o de horas (curto, largo) pra baixo e o de minutos pra cima = 6h
  const ponteiros = new THREE.Group()
  ponteiros.position.z = 0.07
  const hourHand = rbox(0.05, 0.14, 0.016, 0.008, IRON, metal(0.45))
  hourHand.position.y = -0.065
  ponteiros.add(hourHand)
  const hourTip = rbox(0.06, 0.06, 0.016, 0.008, IRON, metal(0.45))
  hourTip.rotation.z = Math.PI / 4
  hourTip.position.y = -0.14
  ponteiros.add(hourTip)
  const minuteHand = rbox(0.03, 0.29, 0.016, 0.008, IRON, metal(0.45))
  minuteHand.position.y = 0.14
  ponteiros.add(minuteHand)
  const minuteTip = rbox(0.045, 0.045, 0.016, 0.008, IRON, metal(0.45))
  minuteTip.rotation.z = Math.PI / 4
  minuteTip.position.y = 0.285
  ponteiros.add(minuteTip)
  const cap = sphere(0.032, GOLD, metal(0.3))
  cap.position.z = 0.012
  ponteiros.add(cap)
  relogio.add(ponteiros)

  // ---- corrente (gira no gancho) --------------------------------------------
  const corrente = new THREE.Group()
  corrente.position.copy(HOOK)
  corrente.rotation.z = SWING
  root.add(corrente)
  const LINKS = 14
  for (let k = 0; k < LINKS; k++) {
    const link = torus(0.036, 0.012, IRON, metal(0.45))
    link.scale.y = 1.55
    link.position.y = -((k + 0.5) / LINKS) * CHAIN
    link.rotation.y = k % 2 ? Math.PI / 2 : 0
    corrente.add(link)
  }

  // ---- lustre redondo de ferro (pivô na coroa) -----------------------------
  const lustre = new THREE.Group()
  lustre.position.y = -CHAIN
  lustre.rotation.set(0.26, 0, -0.08) // frente e lado da mão afundam com o peso
  corrente.add(lustre)

  const crown = sphere(0.055, IRON, metal(0.4))
  crown.position.y = -0.03
  lustre.add(crown)
  const crownTop = torus(0.04, 0.012, IRON, metal(0.45))
  crownTop.position.y = 0.03
  lustre.add(crownTop)

  const ring = torus(RING_R, 0.045, IRON, metal(0.42))
  ring.rotation.x = Math.PI / 2
  ring.position.y = -DROP
  lustre.add(ring)
  const innerRing = torus(RING_R - 0.09, 0.016, IRON, metal(0.45))
  innerRing.rotation.x = Math.PI / 2
  innerRing.position.y = -DROP - 0.05
  lustre.add(innerRing)

  const hubY = -DROP
  for (const deg of [95, 215, 335]) {
    const a = THREE.MathUtils.degToRad(deg)
    const onRing = new THREE.Vector3(Math.cos(a) * RING_R, -DROP + 0.02, Math.sin(a) * RING_R)
    lustre.add(rod(new THREE.Vector3(0, -0.04, 0), onRing, 0.013, IRON))
    // raio do aro até o pingente central
    lustre.add(rod(new THREE.Vector3(0, hubY, 0), new THREE.Vector3(onRing.x, hubY, onRing.z), 0.016, IRON))
  }
  // volutas entre as velas
  for (const a of CANDLE_ANGLES) {
    const mid = a + Math.PI / 6
    if (Math.abs(mid - GRIP_ANGLE) < 0.1) continue
    const curl = torus(0.05, 0.012, IRON, metal(0.45))
    curl.position.set(Math.cos(mid) * (RING_R + 0.05), -DROP - 0.045, Math.sin(mid) * (RING_R + 0.05))
    curl.rotation.y = -mid + Math.PI / 2
    lustre.add(curl)
  }
  const finial = lathe(
    [[0, -0.34], [0.022, -0.3], [0.05, -0.21], [0.062, -0.12], [0.042, -0.05], [0.07, -0.01], [0.04, 0.035], [0, 0.04]],
    IRON,
    metal(0.4),
  )
  finial.position.y = hubY
  lustre.add(finial)

  // ---- seis velas brancas (crescem do aro) ----------------------------------
  const velas = new THREE.Group()
  velas.position.y = -DROP
  lustre.add(velas)
  const CANDLE_H = 0.24
  for (const a of CANDLE_ANGLES) {
    const cx = Math.cos(a) * RING_R
    const cz = Math.sin(a) * RING_R
    const pan = lathe([[0, 0], [0.065, 0], [0.09, 0.03], [0.083, 0.038], [0.058, 0.014], [0, 0.014]], IRON, metal(0.4))
    pan.position.set(cx, 0.035, cz)
    velas.add(pan)
    const candle = cylinder(0.04, 0.043, CANDLE_H, WAX, { roughness: 0.45 })
    candle.position.set(cx, 0.05 + CANDLE_H / 2, cz)
    velas.add(candle)
    for (let k = 0; k < 2; k++) {
      const da = rand() * Math.PI * 2
      const len = 0.03 + rand() * 0.05
      const drip = capsule(0.011, len, WAX, { roughness: 0.4 })
      drip.position.set(cx + Math.cos(da) * 0.04, 0.05 + CANDLE_H - 0.02 - len / 2, cz + Math.sin(da) * 0.04)
      velas.add(drip)
    }
    const wick = cylinder(0.006, 0.006, 0.035, '#2a2018')
    wick.position.set(cx, 0.05 + CANDLE_H + 0.015, cz)
    velas.add(wick)
  }

  // ---- chamas (o acento) + luz quente ---------------------------------------
  const FLAME_Y = 0.05 + CANDLE_H + 0.06
  const chamas = new THREE.Group()
  chamas.position.y = -DROP + FLAME_Y
  lustre.add(chamas)
  for (const a of CANDLE_ANGLES) {
    const fx = Math.cos(a) * RING_R
    const fz = Math.sin(a) * RING_R
    const outer = sphere(0.05, FLAME, { emissive: '#ff5e00', emissiveIntensity: 1.25, roughness: 0.4 })
    outer.scale.set(0.75, 1.75, 0.75)
    outer.position.set(fx, 0.02, fz)
    chamas.add(outer)
    const core = sphere(0.024, '#ffe39a', { emissive: '#ffcf5a', emissiveIntensity: 1.5, roughness: 0.4 })
    core.scale.set(0.8, 1.5, 0.8)
    core.position.set(fx, -0.012, fz)
    chamas.add(core)
    // halo de luz em volta da chama
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 20, 16),
      new THREE.MeshBasicMaterial({ color: '#ff9a3c', transparent: true, opacity: 0.26, depthWrite: false }),
    )
    halo.scale.set(1, 1.35, 1)
    halo.position.set(fx, 0.02, fz)
    chamas.add(halo)
  }
  const luz = new THREE.PointLight('#ffb35c', 3.2, 4.5, 1.5)
  luz.position.y = 0.15
  chamas.add(luz)

  // ---- mosqueteiro -----------------------------------------------------------
  const p = person({ body: TUNIC, skin: SKIN, height: PH, armAngle: 0.35 })
  const bodyH = PH * 0.52
  const bodyR = PH * 0.17
  const headR = PH * 0.19

  const armGrip = p.getObjectByName('armL') as THREE.Mesh
  const armSword = p.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(armGrip, PH)
  shoulderPivot(armSword, PH)
  armGrip.rotation.z = Math.PI + 0.24 // pra cima, agarrando o aro
  for (const arm of [armGrip, armSword]) {
    const hand = arm.children[0] as THREE.Mesh
    hand.material = mat(GLOVE, { roughness: 0.65, size: 0.2 })
    const cuff = cylinder(0.118, 0.09, 0.13, GLOVE, { roughness: 0.65 })
    cuff.position.y = hand.position.y + 0.14
    arm.add(cuff)
  }

  // túnica: saia do tabardo, cinto, gola branca e a cruz no peito
  const skirt = cylinder(bodyR + 0.005, bodyR + 0.08, 0.3, TUNIC, { roughness: 0.8 })
  skirt.position.y = 0.06
  p.add(skirt)
  const belt = torus(bodyR + 0.012, 0.03, LEATHER, { roughness: 0.7 })
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.24
  p.add(belt)
  const buckle = rbox(0.09, 0.08, 0.03, 0.012, GOLD, metal(0.3))
  buckle.position.set(0, 0.24, bodyR + 0.035)
  p.add(buckle)
  const collar = cylinder(0.2, 0.33, 0.05, CROSS, { roughness: 0.8 })
  collar.position.y = bodyH - 0.01
  p.add(collar)
  const crossV = patch(bodyR + 0.012, 0.3, 0.26, CROSS)
  crossV.position.y = 0.53
  p.add(crossV)
  const crossH = patch(bodyR + 0.012, 0.075, 0.95, CROSS)
  crossH.position.y = 0.56
  p.add(crossH)

  // pernas: uma dobrada pra frente, outra esticada pra trás; botas de cano alto
  const legs: [number, number, number, number][] = [
    [1, -0.75, 0.35, 1.35], // direita: coxa pra frente e pro lado, canela dobrada
    [-1, 0.4, -0.12, 0.15], // esquerda: esticada pra trás
  ]
  for (const [side, hip, hipZ, knee] of legs) {
    const leg = new THREE.Group()
    leg.position.set(side * 0.12, 0.04, 0)
    leg.rotation.set(hip, 0, hipZ)
    p.add(leg)
    const thigh = capsule(0.105, 0.24, BREECHES, { roughness: 0.85 })
    thigh.position.y = -0.2
    leg.add(thigh)
    const shin = new THREE.Group()
    shin.position.y = -0.4
    shin.rotation.x = knee
    leg.add(shin)
    const bootShaft = cylinder(0.1, 0.088, 0.34, BOOT, { roughness: 0.6 })
    bootShaft.position.y = -0.18
    shin.add(bootShaft)
    const bootCuff = lathe([[0.1, -0.02], [0.13, 0.05], [0.16, 0.12], [0.145, 0.13], [0.115, 0.06], [0.09, 0.0]], BOOT_CUFF, {
      roughness: 0.6,
    })
    bootCuff.position.y = -0.06
    shin.add(bootCuff)
    const foot = rbox(0.15, 0.11, 0.27, 0.05, BOOT, { roughness: 0.6 })
    foot.position.set(0, -0.36, 0.07)
    shin.add(foot)
    const heel = rbox(0.13, 0.05, 0.08, 0.015, '#3a2516', { roughness: 0.7 })
    heel.position.set(0, -0.43, -0.03)
    shin.add(heel)
  }

  // cabeça: risada aberta, bigode fino de pontas viradas, cavanhaque, cabelo longo
  const head = p.getObjectByName('head') as THREE.Group
  head.rotation.z = -0.3 // cabeça fica em pé enquanto o corpo balança
  const mouth = sphere(0.07, '#3a1c1a', { roughness: 0.7 })
  mouth.scale.set(1.35, 0.85, 0.55)
  mouth.position.set(0, -0.145, 0.262)
  head.add(mouth)
  const teeth = rbox(0.13, 0.03, 0.03, 0.01, '#f6f1e4', { roughness: 0.35 })
  teeth.position.set(0, -0.112, 0.286)
  head.add(teeth)
  const tongue = sphere(0.036, '#c4606a', { roughness: 0.5 })
  tongue.scale.set(1.3, 0.5, 0.7)
  tongue.position.set(0, -0.178, 0.272)
  head.add(tongue)
  for (const side of [-1, 1]) {
    // bigode fino: cai pro lado e vira a ponta pra cima
    const stache = capsule(0.019, 0.075, HAIR, { roughness: 0.8 })
    stache.rotation.z = side * 1.3
    stache.position.set(side * 0.052, -0.083, 0.3)
    head.add(stache)
    const stacheTip = capsule(0.013, 0.045, HAIR, { roughness: 0.8 })
    stacheTip.rotation.z = -side * 0.55
    stacheTip.position.set(side * 0.112, -0.072, 0.284)
    head.add(stacheTip)
    // sobrancelhas arqueadas bem no alto: cara de deboche, não de susto
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 8, 16, 2.0), mat(HAIR, { roughness: 0.8, size: 0.1 }))
    brow.rotation.z = Math.PI / 2 - 1.0 + side * 0.12
    brow.position.set(side * 0.115, 0.098, 0.262)
    head.add(brow)
    const lock = capsule(0.075, 0.28, HAIR, { roughness: 0.85 })
    lock.position.set(side * 0.24, -0.16, -0.06)
    lock.rotation.z = side * 0.12
    head.add(lock)
  }
  const goatee = cone(0.04, 0.12, HAIR, { roughness: 0.8 })
  goatee.rotation.x = Math.PI - 0.35
  goatee.position.set(0, -0.262, 0.228)
  head.add(goatee)
  const hairBack = puff(0.2, HAIR, 5, 17, { roughness: 0.85 })
  hairBack.scale.set(1.35, 1.1, 0.85)
  hairBack.position.set(0, -0.06, -0.15)
  head.add(hairBack)

  // chapéu de aba larga com pluma vermelha comprida (filho da cabeça)
  const chapeu = new THREE.Group()
  chapeu.position.set(0, headR * 0.62, 0)
  chapeu.rotation.set(-0.12, 0, -0.2)
  head.add(chapeu)
  const brim = lathe([[0.2, 0.0], [0.4, -0.01], [0.47, 0.02], [0.46, 0.045], [0.38, 0.025], [0.2, 0.03]], HAT, {
    roughness: 0.9,
  })
  chapeu.add(brim)
  const crownHat = lathe([[0, 0.29], [0.13, 0.28], [0.21, 0.22], [0.235, 0.12], [0.23, 0.02], [0, 0.02]], HAT, {
    roughness: 0.9,
  })
  chapeu.add(crownHat)
  const band = torus(0.232, 0.026, GOLD, metal(0.35))
  band.rotation.x = Math.PI / 2
  band.position.y = 0.06
  chapeu.add(band)
  {
    // pluma: elipsoides achatados ao longo de uma curva que varre por cima da copa
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.2, 0.1, 0.12),
      new THREE.Vector3(-0.36, 0.5, 0.05),
      new THREE.Vector3(0.05, 0.56, -0.3),
      new THREE.Vector3(0.48, 0.24, -0.42),
    )
    const N = 14
    for (let k = 0; k < N; k++) {
      const t0 = k / N
      const t1 = (k + 1) / N
      const a = curve.getPoint(t0)
      const b = curve.getPoint(t1)
      const w = 0.045 + Math.sin(Math.PI * (t0 + 0.12) / 1.12) * 0.065
      const seg = sphere(1, k % 2 ? PLUME : '#b93a45', { roughness: 0.9 })
      seg.position.copy(a).lerp(b, 0.5)
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize())
      seg.scale.set(w, w * 0.45, a.distanceTo(b) * 1.1)
      chapeu.add(seg)
    }
  }

  // capa curta azul esvoaçando pra trás
  const capa = new THREE.Group()
  capa.position.set(0, bodyH * 0.92, -0.06)
  capa.rotation.set(0.62, 0, -0.5)
  p.add(capa)
  {
    const geo = new THREE.CylinderGeometry(0.27, 0.5, 0.8, 28, 1, true, Math.PI / 2, Math.PI)
    const cloth = mat(TUNIC_DARK, { roughness: 0.85, size: 0.8 })
    cloth.side = THREE.DoubleSide
    const m = new THREE.Mesh(geo, cloth)
    m.castShadow = true
    m.receiveShadow = true
    m.position.y = -0.4
    capa.add(m)
    // barra dourada só na metade de trás (arco de toro)
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.018, 8, 32, Math.PI), mat(GOLD, metal(0.35)))
    hem.castShadow = true
    hem.rotation.set(Math.PI / 2, 0, Math.PI)
    hem.position.y = -0.8
    capa.add(hem)
  }

  // florete: copo, guarda em cruz e lâmina fina saindo da mão (eixo -y do braço)
  const handSword = armSword.children[0] as THREE.Mesh
  const espada = new THREE.Group()
  espada.position.y = handSword.position.y
  armSword.add(espada)
  const gripS = cylinder(0.024, 0.024, 0.18, LEATHER, { roughness: 0.7 })
  espada.add(gripS)
  const cup = lathe([[0, 0], [0.07, 0.006], [0.092, 0.045], [0.088, 0.055], [0.062, 0.022], [0, 0.016]], SILVER, metal(0.25))
  cup.position.y = -0.16
  espada.add(cup)
  const quillon = rbox(0.24, 0.022, 0.022, 0.009, SILVER, metal(0.25))
  quillon.position.y = -0.155
  espada.add(quillon)
  const BLADE = 1.1
  const blade = cylinder(0.02, 0.008, BLADE, SILVER, metal(0.18), 12)
  blade.position.y = -0.16 - BLADE / 2
  espada.add(blade)

  // pose: a mão do braço erguido vira o pivô do balanço
  p.updateMatrixWorld(true)
  const gripHand = (armGrip.children[0] as THREE.Object3D).getWorldPosition(new THREE.Vector3())
  p.position.copy(gripHand).multiplyScalar(-1)

  const mosqueteiro = new THREE.Group()
  mosqueteiro.add(p)
  lustre.updateMatrix()
  const GRIP = new THREE.Vector3(
    Math.cos(GRIP_ANGLE) * RING_R, -DROP + 0.02, Math.sin(GRIP_ANGLE) * RING_R,
  ).applyMatrix4(lustre.matrix)
  mosqueteiro.position.copy(GRIP)
  mosqueteiro.rotation.set(0, YAW, TILT)
  corrente.add(mosqueteiro)

  // braço do florete: repouso (pra baixo) e mira (calculada no mundo)
  const REST = new THREE.Euler(-0.35, 0, 0.3)
  root.updateMatrixWorld(true)
  const qP = p.getWorldQuaternion(new THREE.Quaternion()).invert()
  const aimLocal = AIM_DIR.clone().applyQuaternion(qP)
  armSword.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aimLocal)
  const AIM = armSword.rotation.clone()

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'cenario', object: piso },
    { name: 'parede', group: 'cenario', object: parede },
    { name: 'banquinho', group: 'cenario', object: banquinho },
    { name: 'corrente', group: 'lustre', object: corrente },
    { name: 'lustre', group: 'lustre', object: lustre },
    { name: 'velas', group: 'lustre', object: velas },
    { name: 'mosqueteiro', group: 'mosqueteiro', object: mosqueteiro },
    { name: 'capa', group: 'mosqueteiro', object: capa },
    { name: 'chapeu', group: 'mosqueteiro', object: chapeu },
    { name: 'florete', group: 'florete', object: armSword },
    { name: 'chamas', group: 'seis', object: chamas },
    { name: 'relogio', group: 'seis', object: relogio },
    { name: 'ponteiros', group: 'seis', object: ponteiros },
  ]

  // ---- montagem --------------------------------------------------------------
  const G = GRIP
  const build: Sequence[] = [
    seq('piso-rise', 'piso', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Salão de pedra de um castelo: brotam o piso de lajotas e a parede com a janela em arco…',
    }),
    seq('parede-rise', 'parede', 0.2, 1.0, [riseFrom(0, 4.6)], { ease: 'easeOut' }),
    seq('banquinho-rise', 'banquinho', 0.7, 0.7, [riseFrom(0, 0.8)], { ease: 'easeOut' }),

    seq('corrente-desce', 'corrente', 1.5, 1.1, [ch('position.y', HOOK.y + 3.4, HOOK.y)], {
      ease: 'easeOut',
      caption: '…e do teto desce, na corrente, um lustre redondo de ferro com seis velas.',
    }),
    seq('lustre-gira', 'lustre', 1.5, 1.3, [ch('rotation.y', -2.4, 0)], { ease: 'easeOut' }),
    seq('velas-crescem', 'velas', 2.3, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq(
      'mosqueteiro-voa',
      'mosqueteiro',
      3.3,
      0.8,
      [
        ch('position.x', G.x - 2.8, G.x), ch('position.y', G.y + 0.7, G.y),
        ch('rotation.z', TILT - 1.1, TILT),
      ],
      {
        ease: 'easeOut',
        caption: 'Mosqueteiro não manda mensagem: entra voando, agarra o aro e solta a risada — RRÁR!',
      },
    ),
    seq('capa-abre', 'capa', 3.35, 0.7, scale3(0.01, 1), { ease: 'easeOut' }),
    seq('chapeu-poe', 'chapeu', 3.35, 0.6, scale3(0.01, 1), { ease: 'easeOut' }),
    seq('florete-repouso', 'florete', 3.3, 0.8, [
      ch('rotation.x', REST.x, REST.x), ch('rotation.y', REST.y, REST.y), ch('rotation.z', REST.z, REST.z),
    ]),
    seq('corrente-empurra', 'corrente', 3.95, 0.55, [ch('rotation.z', 0, 0.3)], { ease: 'easeOut' }),
    seq('corrente-volta', 'corrente', 4.5, 0.9, [ch('rotation.z', 0.3, -0.1)]),

    seq(
      'florete-aponta',
      'florete',
      5.3,
      0.6,
      [ch('rotation.x', REST.x, AIM.x), ch('rotation.y', REST.y, AIM.y), ch('rotation.z', REST.z, AIM.z)],
      { ease: 'easeOut', caption: 'Ele aponta a ponta do florete bem pro seu nariz: DÜ!' },
    ),
    seq('estocada', 'mosqueteiro', 5.3, 0.35, [ch('rotation.y', YAW, YAW - 0.18)], { ease: 'easeOut' }),
    seq('estocada-volta', 'mosqueteiro', 5.65, 0.45, [ch('rotation.y', YAW - 0.18, YAW)]),

    seq('sacode-a', 'corrente', 6.6, 0.45, [ch('rotation.z', -0.1, 0.26), ch('rotation.x', 0, -0.1)], {
      caption: 'Sacode o LUSTRE de ferro de parede a parede: LUST(re)…',
    }),
    seq('sacode-b', 'corrente', 7.05, 0.55, [ch('rotation.z', 0.26, -0.14), ch('rotation.x', -0.1, 0.06)]),
    seq('sacode-c', 'corrente', 7.6, 0.7, [ch('rotation.z', -0.14, SWING), ch('rotation.x', 0.06, 0)], {
      ease: 'easeOut',
    }),
    seq('perna-balanca', 'mosqueteiro', 6.6, 0.6, [ch('rotation.z', TILT, TILT + 0.2)]),
    seq('perna-volta', 'mosqueteiro', 7.2, 0.9, [ch('rotation.z', TILT + 0.2, TILT)], { ease: 'easeOut' }),

    seq('chamas-acende', 'chamas', 8.4, 0.5, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…acende as SEIS velas e espia o relógio na parede: ÀS SEIS?',
    }),
    seq('relogio-surge', 'relogio', 8.6, 0.6, scale3(0.01, 1), { ease: 'easeOut' }),
    seq('ponteiros-giram', 'ponteiros', 8.75, 1.3, [ch('rotation.z', 4 * Math.PI, 0)], { ease: 'easeOut' }),

    seq('chamas-aviva', 'chamas', 10.2, 0.35, [ch('scale.y', 1, 1.35)], { ease: 'easeOut' }),
    seq('chamas-assenta', 'chamas', 10.55, 0.45, [ch('scale.y', 1.35, 1)], {
      caption: 'Har du lust att ses? — Tá a fim de a gente se ver?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.75, 2.85, 5.4], target: [0.55, 2.05, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'har-du-lust-att-ses',
    contexto:
      "Vida social: pra propor um encontro sem pressão, por mensagem ou pessoalmente — com um amigo que você não vê faz tempo, um colega de quem ficou próximo, um date. Quase sempre com o quando: 'Har du lust att ses i helgen?' (tá a fim de se ver no fim de semana?).",
    fraseFonte: 'Tá a fim de a gente se ver?',
    fraseAlvo: 'Har du lust att ses?',
    pronuncia:
      "rrá dü LUST a SÊÊS? ('har du' sai colado, 'rrá-dü': h soprado e o R brando derrete no D; 'lust' leva a força, com U CURTO e de bico, puxando pra Ô, e T seco; 'att' na fala vira só 'a'; 'ses' com Ê FECHADO e LONGO e S de cobra no fim, nunca Z)",
    ponteSonora:
      "RRÁR-DÜ... LUST(re)... ÀS SEIS? (5 sílabas: rrá-dü-LUST-a-SÊÊS; tônicas em LUST e SÊS; RRÁR é o 'har' de sempre, o MESMO RRÁR de 'Jag har ont i magen' e 'Har du tid en stund?' — aqui é a risada de capa-e-espada do mosqueteiro: h soprado como RR carioca LEVE, A longo, e o R final BRANDO, que derrete direto no D: rrá-dü; sem esse R sobra 'ha du', outro verbo; DÜ = o 'du' de CAN-DU, com BICO DE PATO — é a ponta do florete apontada pra você; LUST(re) = LUSTRE sem o -RE: a força no LUS, U CURTO e de BICO puxando pra Ô (o mesmo U de STUND em 'Har du tid en stund?'), S de cobra — nunca o 'sh' carioca de 'lushtre' —, e o T seco de 'tatu', que já emenda no 'att': LUS-ta; sem o T sobra 'lus', que é piolho; ÀS SEIS = o 'att ses' como se fala: o 'att' encolhe num A só e o S do ÀS gruda no S do SEIS — um S só, de cobra; SEIS é o MESMO SEIS da mão de seis dedos de 'Vi ses!', também sem o I: SÊÊS, Ê FECHADO e LONGO, S sibilante no fim, nunca Z)",
    historia:
      'O mosqueteiro não manda mensagem: convite, pra ele, se faz no ar. Ele entra no salão do castelo pendurado no LUSTRE de ferro, balançando de parede a parede, e lá de cima solta a risada de capa-e-espada: RRÁR! Aponta a ponta do florete bem pro seu nariz — DÜ! — e sacode o lustre de SEIS velas acesas, de olho no relógio: LUSTRE... ÀS SEIS? Um por todos, todos por um: tá a fim de a gente se ver?',
  },
  createScene,
}

export default card
