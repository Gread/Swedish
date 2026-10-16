import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Jag behöver ett BankID." — IÁ! BERRÔ: VER! ÉT(a)! BANC(o)... I-DÊ!
 *
 * Fachada de pedra bege de uma agência. O orangotango, barrado no caixa por
 * não ter BankID, ergue os punhos (IÁ!) e BERRA "VER!" tão alto que o O
 * dourado do letreiro BANCO despenca e racha na calçada (ÉTA!). Depois ele
 * escala a fachada, se pendura na barra do letreiro com um braço comprido e,
 * com o outro, encaixa no buraco do O um I e um D de néon azul: BANC-I-DÊ.
 *
 * Acento saturado RESERVADO: o azul do néon (I-DÊ). O dourado do letreiro é
 * latão sóbrio; o laranja-ferrugem é o pelo do protagonista.
 */

const RIM = '#8a877f'
const LAJOTAS = ['#cfccc6', '#c5c2bb', '#d7d4ce', '#bcb9b2', '#cac7c0']
const BEGE = '#dccfb5'
const BEGE_CLARO = '#e8dfcb'
const BEGE_ESC = '#b6a685'
const JUNTA = '#bfae8e'
const BRONZE = '#4a3d30'
const VIDRO = '#1c2731'
const REFLEXO = '#3d5263'
const ACO = '#9aa1a8'
const FAIXA = '#262c36'
const OURO = '#d4a440'
const VASO = '#5d6066'
const VERDE = '#4d7744'
const FUR = '#b0501d'
const FUR_ESC = '#8a3a15'
const FUR_CLARO = '#c8672a'
const PELE = '#4c4245'
const PELE_CLARA = '#6e5f5a'
const FLANGE = '#40383b'
const BOCA = '#3a1316'
const DENTE = '#efe8d6'
const ANEL = '#c0c5cc'
const NEON = '#3d9dff' // acento saturado RESERVADO: as letras I e D
const NEON_GLOW = '#1f7dff'

const GY = 0.14 // topo da calçada
const FZ = -0.95 // plano da fachada
const FW = 4.4 // largura da fachada
const FTOP = 2.86 // topo da parede (antes da cornija)
const DX = -0.42 // porta
const DW = 1.0
const DTOP = 1.7

const SIGN_Y = 2.21 // centro das letras
const LZ = FZ + 0.1 // plano das letras
const BAR_Y = 2.62
const BAR_Z = FZ + 0.18

const WIN_L = { x: -1.72, w: 0.62 }
const WIN_R = { x: 1.5, w: 0.72 }
const WIN_Y0 = 0.66
const WIN_Y1 = 1.62

// orangotango: pose final (pendurado) e pose de chão (antes de escalar)
const ORA = new THREE.Vector3(1.42, 1.45, -0.55)
const ORA_CHAO_Y = 0.96
const ORA_S = 1.1
const ORA_ROT_Y = -0.25
const ORA_ROT_Z = 0.12

const GRIP = new THREE.Vector3(1.6, BAR_Y - 0.05, BAR_Z + 0.08) // palma na barra
const NEON_I = new THREE.Vector3(0.16, SIGN_Y, LZ + 0.02)
const NEON_D = new THREE.Vector3(0.47, SIGN_Y, LZ + 0.02)
const HOLD_D = new THREE.Vector3(0.66, SIGN_Y - 0.05, LZ + 0.11) // palma segurando o D

// letra O: no letreiro (antes do berro), ponto do impacto e as metades no chão
const O_SIGN = new THREE.Vector3(0.25, SIGN_Y, LZ)
const O_TILT = -Math.PI / 2 + 0.6
const O_IMPACT = new THREE.Vector3(0.2, GY + 0.16, 0.02)
const O_ESQ = { x: 0.12, y: GY + 0.16, z: 0.0, rz: 0.2 }
const O_DIR = { x: 0.3, y: GY + 0.16, z: 0.07, rz: -0.22 }

const CAMERA: [number, number, number] = [0.5, 1.95, 4.55]
const UP = new THREE.Vector3(0, 1, 0)

/** Malha com o material do app e sombras, para geometrias próprias. */
function meshOf(geo: THREE.BufferGeometry, color: string, opts: MatOpts = {}) {
  const m = new THREE.Mesh(geo, mat(color, opts))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Letra extrudada com bisel (latão), centrada em z. */
function extruded(shape: THREE.Shape, color: string, opts: MatOpts, depth = 0.06) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
    curveSegments: 20,
  })
  geo.translate(0, 0, -depth / 2)
  return meshOf(geo, color, { size: 0.4, ...opts })
}

function poly(pts: [number, number][]) {
  const s = new THREE.Shape()
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)))
  s.closePath()
  return s
}

/** B A N C — traço grosso, 0.44 de altura. */
function letterShape(which: 'B' | 'A' | 'N' | 'C') {
  if (which === 'A') {
    const s = poly([
      [-0.18, -0.22], [-0.09, -0.22], [-0.0634, -0.13], [0.0634, -0.13],
      [0.09, -0.22], [0.18, -0.22], [0.05, 0.22], [-0.05, 0.22],
    ])
    s.holes.push(poly([[-0.0427, -0.06], [0.0427, -0.06], [0, 0.07]]))
    return s
  }
  if (which === 'N') {
    return poly([
      [-0.16, -0.22], [-0.08, -0.22], [-0.08, 0.07], [0.07, -0.22], [0.16, -0.22],
      [0.16, 0.22], [0.08, 0.22], [0.08, -0.07], [-0.07, 0.22], [-0.16, 0.22],
    ])
  }
  if (which === 'C') {
    const a0 = 0.72
    const s = new THREE.Shape()
    s.moveTo(0.16 * Math.cos(a0), 0.22 * Math.sin(a0))
    s.absellipse(0, 0, 0.16, 0.22, a0, Math.PI * 2 - a0, false, 0)
    s.lineTo(0.08 * Math.cos(-a0), 0.14 * Math.sin(-a0))
    s.absellipse(0, 0, 0.08, 0.14, Math.PI * 2 - a0, a0, true, 0)
    s.closePath()
    return s
  }
  // B: haste + duas barrigas (elipses), com dois miolos
  const s = new THREE.Shape()
  s.moveTo(-0.17, -0.22)
  s.lineTo(-0.17, 0.22)
  s.lineTo(0.03, 0.22)
  s.absellipse(0.03, 0.11, 0.13, 0.11, Math.PI / 2, -Math.PI / 2, true, 0)
  s.absellipse(0.03, -0.11, 0.14, 0.11, Math.PI / 2, -Math.PI / 2, true, 0)
  s.lineTo(-0.17, -0.22)
  for (const sy of [1, -1]) {
    const h = new THREE.Path()
    const yIn = sy * 0.04
    const yOut = sy * 0.14
    h.moveTo(-0.09, yIn)
    h.lineTo(-0.09, yOut)
    h.lineTo(0.03, yOut)
    const rx = sy > 0 ? 0.05 : 0.06
    if (sy > 0) h.absellipse(0.03, 0.09, rx, 0.05, Math.PI / 2, -Math.PI / 2, true, 0)
    else h.absellipse(0.03, -0.09, rx, 0.05, -Math.PI / 2, Math.PI / 2, false, 0)
    h.lineTo(-0.09, yIn)
    s.holes.push(h)
  }
  return s
}

/** Metade do O rachado: a mesma linha de racha nas duas, então encaixam. */
function halfO(side: -1 | 1) {
  const ox = 0.17, oy = 0.22, ix = 0.085, iy = 0.135
  const crackTop: [number, number][] = [[0, iy], [0.018, iy + 0.02], [-0.014, iy + 0.045], [0.01, iy + 0.07], [0, oy]]
  const crackBot: [number, number][] = [[0, -oy], [-0.012, -oy + 0.025], [0.016, -oy + 0.05], [-0.01, -oy + 0.07], [0, -iy]]
  const pts: [number, number][] = []
  const N = 24
  // arco externo de cima para baixo pelo lado `side`
  for (let i = 0; i <= N; i++) {
    const a = Math.PI / 2 + (side < 0 ? 1 : -1) * (Math.PI * i) / N
    pts.push([ox * Math.cos(a), oy * Math.sin(a)])
  }
  pts.push(...crackBot.slice(1))
  for (let i = 1; i < N; i++) {
    const a = -Math.PI / 2 + (side < 0 ? -1 : 1) * (Math.PI * i) / N
    pts.push([ix * Math.cos(a), iy * Math.sin(a)])
  }
  pts.push(...crackTop.slice(0, -1))
  return poly(pts)
}

/** Tubo de néon: emissivo, sem grão de superfície. */
function neonMat() {
  return mat(NEON, { emissive: NEON_GLOW, emissiveIntensity: 1.25, roughness: 0.3 })
}
function neonTube(r: number, len: number) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), neonMat())
  m.castShadow = false
  m.receiveShadow = false
  return m
}

/** Orienta um grupo cujo eixo é -y para `dir`, com +z o mais perto de `front`. */
function aimDown(obj: THREE.Object3D, dir: THREE.Vector3, front: THREE.Vector3) {
  const y = dir.clone().normalize().negate()
  const z = front.clone().sub(y.clone().multiplyScalar(front.dot(y))).normalize()
  const x = new THREE.Vector3().crossVectors(y, z)
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
}

/** Cápsula entre dois pontos do espaço local do pai. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(d.length(), 0.01), color, { roughness: 0.92 })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Braço de orangotango ao longo de -y: ombro em 0, palma em -len. */
function apeArm(len: number, seed: number, grip: 'barra' | 'letra') {
  const g = new THREE.Group()
  const rand = rng(seed)
  const ombro = sphere(0.17, FUR, { roughness: 0.92 })
  g.add(ombro)
  const braco = capsule(0.125, len * 0.4, FUR, { roughness: 0.92 })
  braco.position.y = -len * 0.27
  g.add(braco)
  const cotovelo = sphere(0.115, FUR, { roughness: 0.92 })
  cotovelo.position.y = -len * 0.52
  g.add(cotovelo)
  const antebraco = capsule(0.105, len * 0.34, FUR, { roughness: 0.92 })
  antebraco.position.y = -len * 0.75
  g.add(antebraco)
  // franja de pelo comprido pendendo do braço (dos dois lados)
  for (let k = 0; k < 5; k++) {
    const side = k % 2 === 0 ? 1 : -1
    const lock = capsule(0.06, 0.13, k % 3 === 0 ? FUR_ESC : FUR_CLARO, { roughness: 0.95 })
    lock.position.set(side * 0.085, -len * (0.22 + k * 0.13), -0.03 + rand() * 0.04)
    lock.rotation.z = side * (0.12 + rand() * 0.1)
    g.add(lock)
  }
  const palma = sphere(0.095, PELE, { roughness: 0.8 })
  palma.scale.set(1, 1.25, 0.7)
  palma.position.y = -len
  g.add(palma)
  for (let d = 0; d < 4; d++) {
    const dedo = capsule(0.03, 0.08, PELE, { roughness: 0.8 })
    // dedos passam por cima da barra (ou do tubo do D) e descem para a parede
    dedo.position.set(-0.075 + d * 0.05, -len - (grip === 'barra' ? 0.13 : 0.11), -0.05)
    dedo.rotation.x = grip === 'barra' ? 0.9 : 1.1
    g.add(dedo)
  }
  const polegar = capsule(0.032, 0.06, PELE, { roughness: 0.8 })
  polegar.position.set(0.1, -len - 0.04, 0.05)
  polegar.rotation.z = 0.7
  g.add(polegar)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- calçada de lajotas ----------------------------------------------------
  const base = new THREE.Group()
  const disco = cylinder(2.62, 2.72, 0.12, RIM, { roughness: 0.85 })
  disco.position.y = 0.06
  base.add(disco)
  const meioFio = lathe(
    [[2.46, 0.1], [2.62, 0.1], [2.64, GY + 0.02], [2.6, GY + 0.04], [2.48, GY + 0.04], [2.46, GY + 0.02]],
    '#a29e96',
    { roughness: 0.8 },
    64,
  )
  base.add(meioFio)
  const T = 0.42
  for (let ix = -6; ix <= 6; ix++) {
    for (let iz = -3; iz <= 6; iz++) {
      const x = ix * T
      const z = iz * T - 0.05
      if (z < FZ - 0.05) continue
      const far = Math.max(Math.hypot(x + T / 2, z + T / 2), Math.hypot(x - T / 2, z + T / 2),
        Math.hypot(x + T / 2, z - T / 2), Math.hypot(x - T / 2, z - T / 2))
      if (far > 2.47) continue
      const cor = LAJOTAS[Math.floor(rand() * LAJOTAS.length)]
      const laj = rbox(T - 0.025, 0.05, T - 0.025, 0.012, cor, { roughness: 0.8 })
      laj.position.set(x, GY - 0.025 + (rand() - 0.5) * 0.004, z)
      base.add(laj)
    }
  }
  root.add(base)

  // ---- fachada do banco ------------------------------------------------------
  const fachada = new THREE.Group()
  const H = FTOP - GY
  const parede = rbox(FW, H, 0.4, 0.03, BEGE, { roughness: 0.85 })
  parede.position.set(0, GY + H / 2, FZ - 0.2)
  fachada.add(parede)

  // aberturas: juntas de pedra não passam por elas
  const holes = [
    { x0: DX - DW / 2 - 0.12, x1: DX + DW / 2 + 0.12, y0: GY, y1: DTOP + 0.1 },
    { x0: WIN_L.x - WIN_L.w / 2 - 0.12, x1: WIN_L.x + WIN_L.w / 2 + 0.12, y0: WIN_Y0 - 0.08, y1: WIN_Y1 + 0.12 },
    { x0: WIN_R.x - WIN_R.w / 2 - 0.12, x1: WIN_R.x + WIN_R.w / 2 + 0.12, y0: WIN_Y0 - 0.08, y1: WIN_Y1 + 0.12 },
    { x0: -1.62, x1: 0.82, y0: SIGN_Y - 0.31, y1: SIGN_Y + 0.31 },
    { x0: DX - 0.9, x1: DX - 0.66, y0: GY, y1: DTOP + 0.12 },
    { x0: DX + 0.66, x1: DX + 0.9, y0: GY, y1: DTOP + 0.12 },
  ]
  const inHole = (x: number, y: number) => holes.some((h) => x > h.x0 && x < h.x1 && y > h.y0 && y < h.y1)
  const COURSE = 0.3
  for (let k = 0; GY + 0.34 + k * COURSE < FTOP - 0.05; k++) {
    const y = GY + 0.34 + k * COURSE
    // linha horizontal em segmentos fora das aberturas
    let segStart: number | null = null
    for (let x = -FW / 2; x <= FW / 2 + 0.001; x += 0.02) {
      const free = !inHole(x, y) && x < FW / 2
      if (free && segStart === null) segStart = x
      if ((!free || x >= FW / 2) && segStart !== null) {
        const w = x - segStart
        if (w > 0.05) {
          const l = rbox(w, 0.016, 0.02, 0.006, JUNTA, { roughness: 0.9 })
          l.position.set(segStart + w / 2, y, FZ + 0.004)
          fachada.add(l)
        }
        segStart = null
      }
    }
    // juntas verticais desencontradas entre esta fiada e a próxima
    const off = k % 2 === 0 ? 0 : 0.36
    for (let x = -FW / 2 + 0.2 + off; x < FW / 2 - 0.1; x += 0.72) {
      const yc = y + COURSE / 2
      if (yc > FTOP - 0.1 || inHole(x, yc)) continue
      const v = rbox(0.016, COURSE - 0.02, 0.02, 0.006, JUNTA, { roughness: 0.9 })
      v.position.set(x, yc, FZ + 0.004)
      fachada.add(v)
    }
  }

  // embasamento de pedra mais escura, interrompido pela porta
  for (const [x0, x1] of [[-FW / 2 - 0.03, DX - DW / 2 - 0.1], [DX + DW / 2 + 0.1, FW / 2 + 0.03]]) {
    const plinto = rbox(x1 - x0, 0.32, 0.08, 0.02, BEGE_ESC, { roughness: 0.85 })
    plinto.position.set((x0 + x1) / 2, GY + 0.16, FZ + 0.03)
    fachada.add(plinto)
  }

  // cornija
  const corn1 = rbox(FW + 0.16, 0.12, 0.58, 0.03, BEGE_CLARO, { roughness: 0.8 })
  corn1.position.set(0, FTOP + 0.06, FZ - 0.16)
  fachada.add(corn1)
  const corn2 = rbox(FW + 0.06, 0.07, 0.5, 0.02, BEGE_CLARO, { roughness: 0.8 })
  corn2.position.set(0, FTOP - 0.03, FZ - 0.17)
  fachada.add(corn2)
  for (let x = -FW / 2 + 0.12; x < FW / 2; x += 0.2) {
    const dentil = rbox(0.09, 0.07, 0.06, 0.012, BEGE_CLARO, { roughness: 0.8 })
    dentil.position.set(x, FTOP - 0.1, FZ + 0.03)
    fachada.add(dentil)
  }

  // porta de vidro escura com moldura de bronze
  const degrau = rbox(DW + 0.6, 0.1, 0.44, 0.02, BEGE_CLARO, { roughness: 0.75 })
  degrau.position.set(DX, GY + 0.05, FZ + 0.22)
  fachada.add(degrau)
  const D0 = GY + 0.1
  const DH = DTOP - D0
  for (const side of [-1, 1]) {
    const umbral = rbox(0.08, DH + 0.08, 0.1, 0.02, BRONZE, { roughness: 0.4, metalness: 0.6 })
    umbral.position.set(DX + side * (DW / 2 + 0.04), D0 + DH / 2 + 0.02, FZ + 0.04)
    fachada.add(umbral)
    const folha = rbox(DW / 2 - 0.04, DH - 0.02, 0.03, 0.01, VIDRO, { roughness: 0.08, metalness: 0.3 })
    folha.position.set(DX + side * (DW / 4), D0 + DH / 2, FZ + 0.025)
    fachada.add(folha)
    const chute = rbox(DW / 2 - 0.06, 0.14, 0.04, 0.01, BRONZE, { roughness: 0.4, metalness: 0.6 })
    chute.position.set(DX + side * (DW / 4), D0 + 0.08, FZ + 0.04)
    fachada.add(chute)
    const reflexo = rbox(0.05, DH * 0.55, 0.005, 0.002, REFLEXO, { roughness: 0.1 })
    reflexo.position.set(DX + side * (DW / 4) - 0.06, D0 + DH * 0.6, FZ + 0.042)
    reflexo.rotation.z = 0.45
    fachada.add(reflexo)
    // puxador horizontal de aço
    const puxador = cylinder(0.022, 0.022, 0.32, ACO, { roughness: 0.25, metalness: 0.8 })
    puxador.rotation.z = Math.PI / 2
    puxador.position.set(DX + side * (DW / 4), D0 + 0.82, FZ + 0.1)
    fachada.add(puxador)
    for (const px of [-0.13, 0.13]) {
      const pe = cylinder(0.014, 0.014, 0.07, ACO, { roughness: 0.25, metalness: 0.8 })
      pe.rotation.x = Math.PI / 2
      pe.position.set(DX + side * (DW / 4) + px, D0 + 0.82, FZ + 0.065)
      fachada.add(pe)
    }
    // pilastras ladeando a porta
    const pilastra = rbox(0.2, DTOP + 0.06 - GY, 0.1, 0.02, BEGE_CLARO, { roughness: 0.8 })
    pilastra.position.set(DX + side * 0.78, GY + (DTOP + 0.06 - GY) / 2, FZ + 0.05)
    fachada.add(pilastra)
    const capitel = rbox(0.28, 0.08, 0.15, 0.02, BEGE_CLARO, { roughness: 0.8 })
    capitel.position.set(DX + side * 0.78, DTOP + 0.1, FZ + 0.07)
    fachada.add(capitel)
  }
  const verga = rbox(DW + 0.24, 0.09, 0.1, 0.02, BRONZE, { roughness: 0.4, metalness: 0.6 })
  verga.position.set(DX, DTOP + 0.06, FZ + 0.04)
  fachada.add(verga)
  const montante = rbox(0.045, DH, 0.06, 0.01, BRONZE, { roughness: 0.4, metalness: 0.6 })
  montante.position.set(DX, D0 + DH / 2, FZ + 0.04)
  fachada.add(montante)

  // janelas
  for (const win of [WIN_L, WIN_R]) {
    const wh = WIN_Y1 - WIN_Y0
    const yc = (WIN_Y0 + WIN_Y1) / 2
    const moldura = rbox(win.w + 0.1, wh + 0.1, 0.05, 0.02, BRONZE, { roughness: 0.4, metalness: 0.6 })
    moldura.position.set(win.x, yc, FZ + 0.02)
    fachada.add(moldura)
    const vidro = rbox(win.w, wh, 0.04, 0.01, VIDRO, { roughness: 0.08, metalness: 0.3 })
    vidro.position.set(win.x, yc, FZ + 0.035)
    fachada.add(vidro)
    const mv = rbox(0.04, wh, 0.06, 0.01, BRONZE, { roughness: 0.4, metalness: 0.6 })
    mv.position.set(win.x, yc, FZ + 0.045)
    fachada.add(mv)
    const mh = rbox(win.w, 0.04, 0.06, 0.01, BRONZE, { roughness: 0.4, metalness: 0.6 })
    mh.position.set(win.x, WIN_Y0 + wh * 0.66, FZ + 0.045)
    fachada.add(mh)
    const reflexo = rbox(0.05, wh * 0.5, 0.005, 0.002, REFLEXO, { roughness: 0.1 })
    reflexo.position.set(win.x - win.w * 0.22, yc + 0.05, FZ + 0.058)
    reflexo.rotation.z = 0.45
    fachada.add(reflexo)
    const verga2 = rbox(win.w + 0.2, 0.12, 0.08, 0.02, BEGE_CLARO, { roughness: 0.8 })
    verga2.position.set(win.x, WIN_Y1 + 0.1, FZ + 0.04)
    fachada.add(verga2)
  }

  // friso de pedra na altura dos peitoris (onde o orangotango apoia os pés)
  for (const [x0, x1] of [[-FW / 2 - 0.03, DX - 0.9], [DX + 0.9, FW / 2 + 0.03]]) {
    const friso = rbox(x1 - x0, 0.08, 0.24, 0.02, BEGE_CLARO, { roughness: 0.75 })
    friso.position.set((x0 + x1) / 2, WIN_Y0 - 0.065, FZ + 0.1)
    fachada.add(friso)
  }

  // floreiras ladeando a porta
  for (const px of [DX - 0.98, DX + 0.98]) {
    const vaso = rbox(0.36, 0.42, 0.36, 0.04, VASO, { roughness: 0.6 })
    vaso.position.set(px, GY + 0.21, FZ + 0.46)
    fachada.add(vaso)
    const borda = rbox(0.4, 0.05, 0.4, 0.02, '#6e7177', { roughness: 0.55 })
    borda.position.set(px, GY + 0.43, FZ + 0.46)
    fachada.add(borda)
    const buxo = puff(0.2, VERDE, 6, 71 + Math.round(px * 10), { roughness: 0.9 })
    buxo.position.set(px, GY + 0.62, FZ + 0.46)
    fachada.add(buxo)
  }
  root.add(fachada)

  // ---- letreiro BANC (barra + faixa escura + letras de latão) ---------------
  const letreiro = new THREE.Group()
  const faixa = rbox(2.44, 0.6, 0.06, 0.02, FAIXA, { roughness: 0.6, metalness: 0.1 })
  faixa.position.set(-0.4, SIGN_Y, FZ + 0.03)
  letreiro.add(faixa)
  for (const fy of [SIGN_Y + 0.3, SIGN_Y - 0.3]) {
    const friso = rbox(2.48, 0.03, 0.08, 0.01, BRONZE, { roughness: 0.4, metalness: 0.6 })
    friso.position.set(-0.4, fy, FZ + 0.04)
    letreiro.add(friso)
  }
  const goldOpts: MatOpts = { roughness: 0.28, metalness: 0.75, detail: 0.4 }
  for (const [glyph, lx] of [['B', -1.28], ['A', -0.89], ['N', -0.5], ['C', -0.13]] as const) {
    const l = extruded(letterShape(glyph), OURO, goldOpts)
    l.position.set(lx, SIGN_Y, LZ)
    letreiro.add(l)
  }
  // barra do letreiro: corrimão de bronze sobre a faixa, preso por mãos-francesas
  const barra = cylinder(0.034, 0.034, 3.6, BRONZE, { roughness: 0.35, metalness: 0.7 })
  barra.rotation.z = Math.PI / 2
  barra.position.set(0.08, BAR_Y, BAR_Z)
  letreiro.add(barra)
  for (const bx of [-1.72, 1.88]) {
    const ponteira = sphere(0.05, BRONZE, { roughness: 0.35, metalness: 0.7 })
    ponteira.position.set(bx, BAR_Y, BAR_Z)
    letreiro.add(ponteira)
  }
  for (const bx of [-1.55, -0.4, 0.75, 1.8]) {
    const suporte = rbox(0.04, 0.04, BAR_Z - FZ, 0.01, BRONZE, { roughness: 0.4, metalness: 0.6 })
    suporte.position.set(bx, BAR_Y, (BAR_Z + FZ) / 2)
    letreiro.add(suporte)
    const mao = rbox(0.035, 0.16, 0.035, 0.01, BRONZE, { roughness: 0.4, metalness: 0.6 })
    mao.position.set(bx, BAR_Y - 0.07, FZ + 0.06)
    mao.rotation.x = -0.6
    letreiro.add(mao)
  }
  root.add(letreiro)

  // ---- a letra O: duas metades com a mesma racha ----------------------------
  const oEsq = new THREE.Group()
  oEsq.add(extruded(halfO(-1), OURO, goldOpts))
  oEsq.position.set(O_ESQ.x, O_ESQ.y, O_ESQ.z)
  oEsq.rotation.set(O_TILT, 0, O_ESQ.rz)
  root.add(oEsq)
  const oDir = new THREE.Group()
  oDir.add(extruded(halfO(1), OURO, goldOpts))
  oDir.position.set(O_DIR.x, O_DIR.y, O_DIR.z)
  oDir.rotation.set(O_TILT, 0, O_DIR.rz)
  root.add(oDir)

  // ---- impacto: lajota trincada, cacos e lascas de ouro ----------------------
  const impacto = new THREE.Group()
  impacto.position.set(O_IMPACT.x, GY, O_IMPACT.z)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rand() * 0.5
    const len = 0.18 + rand() * 0.22
    const trinca = rbox(len, 0.012, 0.018, 0.005, '#6f6c66', { roughness: 0.9 })
    trinca.position.set(Math.cos(a) * len * 0.5, 0.004, Math.sin(a) * len * 0.5)
    trinca.rotation.y = -a
    impacto.add(trinca)
  }
  for (const [cx, cz, r, s] of [[-0.14, -0.2, 0.075, 3], [0.16, -0.14, 0.07, 5], [0.42, 0.1, 0.05, 7], [-0.3, 0.12, 0.045, 9]] as const) {
    const caco = rock(r, LAJOTAS[s % LAJOTAS.length], s, { roughness: 0.85 })
    caco.position.set(cx, r * 0.5, cz)
    impacto.add(caco)
  }
  for (const [cx, cz] of [[0.3, 0.3], [-0.38, -0.05], [0.05, 0.4], [0.5, -0.1]] as const) {
    const lasca = rock(0.028, OURO, Math.round(cx * 100) + 50, { roughness: 0.3, metalness: 0.7 })
    lasca.position.set(cx, 0.02, cz)
    impacto.add(lasca)
  }
  root.add(impacto)
  // cacos de lajota calçando a ponta erguida de cada metade
  root.updateMatrixWorld(true)
  for (const [half, sx, seed] of [[oEsq, -1, 21], [oDir, 1, 22]] as const) {
    const topo = half.localToWorld(new THREE.Vector3(sx * 0.06, 0.18, -0.045))
    const h = topo.y - GY
    const apoio = rock(h * 0.55, LAJOTAS[3], seed, { roughness: 0.85 })
    apoio.position.copy(impacto.worldToLocal(new THREE.Vector3(topo.x, GY + h * 0.4, topo.z)))
    impacto.add(apoio)
  }

  // ---- néon: I já aceso e o D sendo encaixado --------------------------------
  const neonI = new THREE.Group()
  neonI.position.copy(NEON_I)
  const hasteI = neonTube(0.032, 0.336)
  neonI.add(hasteI)
  for (const sy of [-1, 1]) {
    const serifa = neonTube(0.03, 0.09)
    serifa.rotation.z = Math.PI / 2
    serifa.position.y = sy * 0.2
    neonI.add(serifa)
  }
  const luz = new THREE.PointLight('#4aa8ff', 0.6, 1.8, 2)
  luz.position.set(0.15, 0, 0.45)
  neonI.add(luz)
  root.add(neonI)

  const neonD = new THREE.Group()
  neonD.position.copy(NEON_D)
  const hasteD = neonTube(0.032, 0.336)
  hasteD.position.x = -0.12
  neonD.add(hasteD)
  for (const sy of [-1, 1]) {
    const barraD = neonTube(0.032, 0.08)
    barraD.rotation.z = Math.PI / 2
    barraD.position.set(-0.06, sy * 0.2, 0)
    neonD.add(barraD)
  }
  const arco = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.032, 12, 40, Math.PI), neonMat())
  arco.rotation.z = -Math.PI / 2
  neonD.add(arco)
  // presilhas escuras que seguram os tubos na faixa
  for (const [px, py, grp] of [[0, 0.12, neonI], [0, -0.12, neonI], [-0.12, 0.1, neonD], [-0.12, -0.1, neonD], [0.18, 0.08, neonD], [0.18, -0.08, neonD]] as const) {
    const presilha = cylinder(0.014, 0.014, 0.08, BRONZE, { roughness: 0.4, metalness: 0.6 })
    presilha.rotation.x = Math.PI / 2
    presilha.position.set(px, py, -0.05)
    grp.add(presilha)
  }
  root.add(neonD)

  // ---- ORANGOTANGO -----------------------------------------------------------
  const orangotango = new THREE.Group()
  orangotango.position.copy(ORA)
  orangotango.rotation.set(0, ORA_ROT_Y, ORA_ROT_Z)
  orangotango.scale.setScalar(ORA_S)
  root.add(orangotango)

  const tronco = sphere(0.4, FUR, { roughness: 0.92 })
  tronco.scale.set(1.0, 1.25, 0.85)
  orangotango.add(tronco)
  const barriga = sphere(0.36, FUR_CLARO, { roughness: 0.92 })
  barriga.scale.set(1.0, 0.95, 0.8)
  barriga.position.set(0, -0.22, 0.1)
  orangotango.add(barriga)
  const ombros = sphere(0.34, FUR, { roughness: 0.92 })
  ombros.scale.set(1.4, 0.75, 0.95)
  ombros.position.set(0, 0.32, -0.02)
  orangotango.add(ombros)
  // pelo comprido pendendo dos flancos
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const lock = capsule(0.07, 0.24, k === 1 ? FUR_ESC : FUR, { roughness: 0.95 })
      lock.position.set(side * (0.34 + k * 0.03), -0.1 - k * 0.17, -0.06 + k * 0.03)
      lock.rotation.z = side * 0.18
      orangotango.add(lock)
    }
  }
  // pernas curtas dobradas, pés-mão apoiados no peitoril da janela
  for (const side of [-1, 1]) {
    const quadril = new THREE.Vector3(side * 0.2, -0.42, 0.02)
    const joelho = new THREE.Vector3(side * 0.4, -0.5, 0.24)
    const tornozelo = new THREE.Vector3(side * 0.32, -0.6, -0.2)
    orangotango.add(limb(quadril, joelho, 0.125, FUR))
    orangotango.add(limb(joelho, tornozelo, 0.105, FUR))
    const pe = sphere(0.1, PELE, { roughness: 0.8 })
    pe.scale.set(0.85, 0.45, 1.35)
    pe.position.set(side * 0.32, -0.66, -0.25)
    orangotango.add(pe)
    for (let d = 0; d < 3; d++) {
      const dedo = capsule(0.026, 0.05, PELE, { roughness: 0.8 })
      dedo.position.set(side * 0.32 + (d - 1) * 0.05, -0.69, -0.37)
      dedo.rotation.x = Math.PI / 2
      orangotango.add(dedo)
    }
  }

  // ---- cabeça: placas faciais largas e a boca escancarada -------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.58, 0.16)
  orangotango.add(cabeca)

  const cranio = sphere(0.21, FUR, { roughness: 0.92 })
  cranio.position.set(0, 0.12, -0.13)
  cabeca.add(cranio)
  const placas = sphere(0.36, FLANGE, { roughness: 0.75 })
  placas.scale.set(1.0, 0.8, 0.24)
  placas.position.set(0, 0, 0.06)
  cabeca.add(placas)
  // franja de pelo laranja contornando as placas: moldura de orangotango
  const moldura = torus(0.33, 0.065, FUR, { roughness: 0.95 })
  moldura.scale.set(1.0, 0.82, 0.7)
  moldura.position.set(0, 0, 0.0)
  cabeca.add(moldura)
  const rosto = sphere(0.17, PELE, { roughness: 0.75 })
  rosto.scale.set(0.95, 1.15, 0.6)
  rosto.position.set(0, 0, 0.13)
  cabeca.add(rosto)
  const testa = capsule(0.045, 0.16, PELE, { roughness: 0.75 })
  testa.rotation.z = Math.PI / 2
  testa.position.set(0, 0.1, 0.2)
  cabeca.add(testa)
  for (const side of [-1, 1]) {
    const esclera = sphere(0.038, '#f4efe6', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(side * 0.062, 0.045, 0.215)
    const pupila = sphere(0.021, '#161212', { roughness: 0.2 })
    pupila.position.set(side * 0.058, 0.045, 0.238)
    cabeca.add(esclera, pupila)
    // sobrancelha franzida de fúria
    const cenho = capsule(0.018, 0.06, '#2f282a', { roughness: 0.8 })
    cenho.rotation.z = Math.PI / 2 + side * 0.4
    cenho.position.set(side * 0.065, 0.1, 0.245)
    cabeca.add(cenho)
  }
  const nariz = sphere(0.05, PELE_CLARA, { roughness: 0.7 })
  nariz.scale.set(1.2, 0.7, 0.6)
  nariz.position.set(0, -0.03, 0.24)
  cabeca.add(nariz)
  for (const side of [-1, 1]) {
    const narina = sphere(0.015, '#1d1719', { roughness: 0.5 })
    narina.position.set(side * 0.02, -0.05, 0.262)
    cabeca.add(narina)
  }
  const focinho = sphere(0.15, PELE_CLARA, { roughness: 0.7 })
  focinho.scale.set(1.15, 0.95, 0.75)
  focinho.position.set(0, -0.16, 0.18)
  cabeca.add(focinho)
  const papo = sphere(0.17, FLANGE, { roughness: 0.75 })
  papo.scale.set(1.15, 0.65, 0.9)
  papo.position.set(0, -0.31, 0.05)
  cabeca.add(papo)
  const barba = puff(0.1, FUR_ESC, 5, 17, { roughness: 0.95 })
  barba.scale.set(1.25, 0.8, 0.7)
  barba.position.set(0, -0.35, 0.13)
  cabeca.add(barba)
  // boca escancarada no berro
  const goela = sphere(0.1, BOCA, { roughness: 0.6 })
  goela.scale.set(1.15, 1.2, 0.55)
  goela.position.set(0, -0.18, 0.27)
  cabeca.add(goela)
  const labios = torus(0.1, 0.026, PELE, { roughness: 0.7 })
  labios.scale.set(1.15, 1.2, 1)
  labios.position.set(0, -0.18, 0.29)
  cabeca.add(labios)
  for (const sy of [1, -1]) {
    const dentes = rbox(0.13, 0.03, 0.03, 0.01, DENTE, { roughness: 0.3 })
    dentes.position.set(0, -0.18 + sy * 0.085, 0.3)
    cabeca.add(dentes)
  }
  const lingua = sphere(0.05, '#c45c66', { roughness: 0.45 })
  lingua.scale.set(1.3, 0.55, 1)
  lingua.position.set(0, -0.245, 0.28)
  cabeca.add(lingua)

  root.updateMatrixWorld(true)

  // ---- anéis do berro: saem da boca em direção à câmera ----------------------
  const boca = new THREE.Vector3(0, -0.18, 0.3)
  const camLocal = cabeca.worldToLocal(new THREE.Vector3(...CAMERA))
  // de 3/4: para a frente, a esquerda e para baixo (rumo à calçada), sem tapar o rosto nem o ID
  const rumo = camLocal.sub(boca).normalize()
  const esquerda = cabeca.worldToLocal(new THREE.Vector3(-1, 0, 0).add(cabeca.getWorldPosition(new THREE.Vector3())))
  const baixo = cabeca.worldToLocal(new THREE.Vector3(0, -1, 0).add(cabeca.getWorldPosition(new THREE.Vector3())))
  rumo.add(esquerda.normalize().multiplyScalar(0.8)).add(baixo.normalize().multiplyScalar(0.6)).normalize()
  const aneis = new THREE.Group()
  aneis.position.copy(boca)
  aneis.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), rumo)
  for (const [i, r] of [0.1, 0.17, 0.25].entries()) {
    const anel = torus(r, 0.024, ANEL, { roughness: 0.45 })
    anel.position.z = 0.3 + i * 0.34
    aneis.add(anel)
  }
  cabeca.add(aneis)

  // ---- braços: ombro como pivô, eixo -y até a palma -------------------------
  const frontLocal = new THREE.Vector3(0, 0, 1).applyQuaternion(
    orangotango.getWorldQuaternion(new THREE.Quaternion()).invert(),
  )
  const OMBRO_BARRA = new THREE.Vector3(0.38, 0.34, -0.04)
  const OMBRO_D = new THREE.Vector3(-0.38, 0.34, 0.02)

  const alvoBarra = orangotango.worldToLocal(GRIP.clone()).sub(OMBRO_BARRA)
  const bracoBarra = apeArm(alvoBarra.length(), 5, 'barra')
  bracoBarra.position.copy(OMBRO_BARRA)
  aimDown(bracoBarra, alvoBarra, frontLocal)
  orangotango.add(bracoBarra)

  const alvoD = orangotango.worldToLocal(HOLD_D.clone()).sub(OMBRO_D)
  const bracoD = apeArm(alvoD.length(), 9, 'letra')
  bracoD.position.copy(OMBRO_D)
  aimDown(bracoD, alvoD, frontLocal)
  orangotango.add(bracoD)

  // poses intermediárias dos braços (em Euler, para os canais de rotação)
  const poseOf = (dir: THREE.Vector3) => {
    const o = new THREE.Object3D()
    aimDown(o, dir, frontLocal)
    return { x: o.rotation.x, y: o.rotation.y, z: o.rotation.z }
  }
  const fim = (o: THREE.Object3D) => ({ x: o.rotation.x, y: o.rotation.y, z: o.rotation.z })
  const BARRA_BAIXO = poseOf(new THREE.Vector3(0.3, -1, 0.15))
  const D_BAIXO = poseOf(new THREE.Vector3(-0.3, -1, 0.15))
  const BARRA_ALTO = poseOf(new THREE.Vector3(0.55, 1, 0.25))
  const D_ALTO = poseOf(new THREE.Vector3(-0.55, 1, 0.25))
  // mesmo giro, ângulo desenrolado: o braço sobe pelo caminho curto, sem dar
  // a volta por baixo (a pose montada fica idêntica ao `to` da animação)
  const unwrap = (o: THREE.Object3D, ref: number) => {
    while (o.rotation.z - ref > Math.PI) o.rotation.z -= Math.PI * 2
    while (o.rotation.z - ref < -Math.PI) o.rotation.z += Math.PI * 2
  }
  unwrap(bracoBarra, BARRA_ALTO.z)
  unwrap(bracoD, D_BAIXO.z)
  const BARRA_FIM = fim(bracoBarra)
  const D_FIM = fim(bracoD)
  type Rot = { x: number; y: number; z: number }
  const rot = (a: Rot, b: Rot) => [ch('rotation.x', a.x, b.x), ch('rotation.y', a.y, b.y), ch('rotation.z', a.z, b.z)]

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'agencia', object: base },
    { name: 'fachada', group: 'agencia', object: fachada },
    { name: 'letreiro', group: 'agencia', object: letreiro },
    { name: 'oEsq', group: 'agencia', object: oEsq },
    { name: 'oDir', group: 'agencia', object: oDir },
    { name: 'orangotango', group: 'orangotango', object: orangotango },
    { name: 'cabeca', group: 'orangotango', object: cabeca },
    { name: 'bracoBarra', group: 'orangotango', object: bracoBarra },
    { name: 'bracoD', group: 'orangotango', object: bracoD },
    { name: 'aneis', group: 'berro', object: aneis },
    { name: 'impacto', group: 'berro', object: impacto },
    { name: 'neonI', group: 'neon', object: neonI },
    { name: 'neonD', group: 'neon', object: neonD },
  ]

  const S0 = 0.01
  const grow = (to = 1) => [ch('scale.x', S0, to), ch('scale.y', S0, to), ch('scale.z', S0, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Na agência, a moça do caixa avisa: sem BankID, o orangotango não pode nem VER o próprio saldo.',
    }),
    seq('fachada-rise', 'fachada', 0.25, 1.0, [riseFrom(0, 3.4)], { ease: 'easeOut' }),
    seq('letreiro-rise', 'letreiro', 0.55, 1.0, [riseFrom(0, 3.4)], { ease: 'easeOut' }),
    seq('oEsq-rise', 'oEsq', 0.55, 1.0, [riseFrom(O_SIGN.y, 3.4)], { ease: 'easeOut' }),
    seq('oDir-rise', 'oDir', 0.55, 1.0, [riseFrom(O_SIGN.y, 3.4)], { ease: 'easeOut' }),

    // ele brota na calçada e ergue os punhos: IÁ!
    seq('ora-rise', 'orangotango', 2.1, 0.85, [ch('position.y', ORA_CHAO_Y - 2.4, ORA_CHAO_Y)], {
      ease: 'easeOut',
      caption: 'Ele ergue os punhos — IÁ! — e BERROU: VER!',
    }),
    seq('cabeca-in', 'cabeca', 2.1, 0.85, [ch('rotation.x', 0.2, 0)], { ease: 'easeOut' }),
    seq('bracoBarra-in', 'bracoBarra', 2.1, 0.85, rot(BARRA_BAIXO, BARRA_BAIXO)),
    seq('bracoD-in', 'bracoD', 2.1, 0.85, rot(D_BAIXO, D_BAIXO)),
    seq('ora-pula', 'orangotango', 3.0, 0.2, [ch('position.y', ORA_CHAO_Y, ORA_CHAO_Y + 0.14)], { ease: 'easeOut' }),
    seq('bracoBarra-ergue', 'bracoBarra', 3.0, 0.3, rot(BARRA_BAIXO, BARRA_ALTO), { ease: 'easeOut' }),
    seq('bracoD-ergue', 'bracoD', 3.0, 0.3, rot(D_BAIXO, D_ALTO), { ease: 'easeOut' }),
    seq('ora-cai', 'orangotango', 3.2, 0.2, [ch('position.y', ORA_CHAO_Y + 0.14, ORA_CHAO_Y)], { ease: 'easeIn' }),

    // o berro derruba o O
    seq('cabeca-berra', 'cabeca', 3.55, 0.25, [ch('rotation.x', 0, -0.22)], { ease: 'easeOut' }),
    seq('aneis-saem', 'aneis', 3.6, 0.5, grow(), {
      ease: 'easeOut',
      caption: 'Tão alto que o O do letreiro BANCO despenca e se espatifa na calçada: ÉTA!',
    }),
    ...(['oEsq', 'oDir'] as const).map((p) =>
      seq(`${p}-cai`, p, 3.95, 0.55, [
        ch('position.x', O_SIGN.x, O_IMPACT.x),
        ch('position.y', O_SIGN.y, O_IMPACT.y),
        ch('position.z', O_SIGN.z, O_IMPACT.z),
        ch('rotation.x', 0, O_TILT),
        ch('rotation.z', 0, 0.1),
      ], { ease: 'easeIn' }),
    ),
    seq('impacto', 'impacto', 4.5, 0.3, grow(), { ease: 'easeOut' }),
    ...([['oEsq', O_ESQ], ['oDir', O_DIR]] as const).map(([p, o]) =>
      seq(`${p}-racha`, p, 4.5, 0.4, [
        ch('position.x', O_IMPACT.x, o.x),
        ch('position.z', O_IMPACT.z, o.z),
        ch('rotation.z', 0.1, o.rz),
      ], { ease: 'easeOut' }),
    ),
    seq('cabeca-volta', 'cabeca', 4.7, 0.4, [ch('rotation.x', -0.22, 0)]),
    seq('bracoD-baixa', 'bracoD', 4.7, 0.5, rot(D_ALTO, D_BAIXO)),

    // escala a fachada e se pendura na barra
    seq('ora-escala', 'orangotango', 5.6, 1.0, [ch('position.y', ORA_CHAO_Y, ORA.y)], {
      caption: 'Aí ele tem uma ideia: escala a fachada com os braços compridíssimos e se pendura na barra do BANC…',
    }),
    seq('bracoBarra-agarra', 'bracoBarra', 5.6, 0.8, rot(BARRA_ALTO, BARRA_FIM)),

    // néon: I, depois o D
    seq('neonI-acende', 'neonI', 7.2, 0.45, grow(), {
      ease: 'easeOut',
      caption: '…e, no buraco do O, pendura duas letras de néon azul: um I…',
    }),
    seq('bracoD-encaixa', 'bracoD', 8.3, 0.7, rot(D_BAIXO, D_FIM), {
      caption: '…e um D. BANC… I-DÊ!',
    }),
    seq('neonD-acende', 'neonD', 8.7, 0.4, [...grow(), ch('position.z', NEON_D.z + 0.2, NEON_D.z)], {
      ease: 'easeOut',
    }),

    seq('aneis-pulsa', 'aneis', 10.0, 0.25, [ch('scale.x', 1, 1.12), ch('scale.y', 1, 1.12), ch('scale.z', 1, 1.12)], {
      ease: 'easeOut',
      caption: 'Jag behöver ett BankID. — Preciso de um BankID.',
    }),
    seq('aneis-assenta', 'aneis', 10.25, 0.35, [ch('scale.x', 1.12, 1), ch('scale.y', 1.12, 1), ch('scale.z', 1.12, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAMERA, target: [0.28, 1.42, -0.35] },
  }
}

export const card: Card = {
  refine: { organic: ['orangotango', 'cabeca', 'bracoBarra', 'bracoD'] },
  meta: {
    id: 'jag-behover-ett-bankid',
    contexto:
      "Banco: na agência (Swedbank, Handelsbanken, SEB, Nordea), ao abrir conta ou pedir o BankID no celular — normalmente com personnummer e documento com foto (ID-kort ou passaporte). Também quando um site como 1177, Skatteverket ou Försäkringskassan só deixa entrar 'med BankID' e você ainda não tem.",
    fraseFonte: 'Preciso de um BankID.',
    fraseAlvo: 'Jag behöver ett BankID.',
    pronuncia:
      "iá be-RRÖÖ-ver et BÁNK-i-dê ('jag' = iá, o G não soa; 'behöver' com o 'be-' fraquinho, o h soprado e a força no HÖ — Ö LONGO, lábios de Ô com língua de Ê —, e o -ver fraco mas com R brando: sem ele vira 'behöva', o infinitivo; 'ett' = ÉT, É aberto e curto, T seco, que já emenda no R de 'behöver': be-RRÖ-ve-RÉT; 'BankID' com a força no BANK — A curto e aberto, sem o 'ã' fanhoso do português, a língua fechando no fundo da boca (NG) e o K seco — e o 'ID' soletrado, i-DÊ, com Ê fechado e um acento menor no fim)",
    ponteSonora:
      "IÁ! BERRÔ: VER! ÉT(a)! BANC(o)... I-DÊ! (8 sílabas: iá-be-RRÖÖ-ver-ét-BANK-i-dê; força no RRÖ e, maior, no BANK, com um acento menor no DÊ; IÁ é o 'jag' de sempre, I de IOGA, nunca o J chiado de 'já'; BERRÔ: VER! = BERROU 'VER!' num fôlego só, o MESMO be-RRÖ-ver de 'Det är akut, jag behöver komma in idag' e do ciclope de 'Jag behöver träffa en läkare': o BE fraquinho, o RR soprado leve (é o h) e a força no RRÔ — sem o U do 'ou' e de BICO: lábios de Ô com língua de Ê, longo, o truque do TRÖTT e do MÖÖ-te; o VER vem grudado e sem força, mas com o R brando no fim, que já escorrega pro ÉT: ve-RÉT — sem esse R sobra 'behöva', o infinitivo; ÉT = o ÉTA! de espanto com o A engolido, o MESMO ÉT do ÉTER de 'Jag har ett möte' e do burro de 'Ett bord för två': É ABERTO de 'pé', curto, T seco, nunca 'étchi' — e é ÉT, não o EN do dedinho, porque 'BankID' é palavra de 'ett'; BANC(o) = o letreiro BANCO sem o O que caiu: a força toda no BAN, A ABERTO de 'cá', sem o 'ã' fanhoso de 'banco' — a língua só fecha lá no fundo, no NG de 'bang' — e o C estala seco: BANK; I-DÊ = as duas letras de néon penduradas no lugar do O, lidas com o nome que elas têm no alfabeto português: I + DÊ — e é exatamente assim que o sueco soletra 'ID': i-DÊ, com Ê FECHADO e longo, nunca o 'ái-dí' do inglês)",
    historia:
      "Na agência, a moça do caixa avisa: sem BankID, o orangotango não pode nem VER o próprio saldo. Ele bate no peito — IÁ! — e BERROU: VER!, tão alto que o O do letreiro BANCO, lá na fachada, despenca e se espatifa na calçada: ÉTA! Aí ele tem uma ideia: escala a fachada com aqueles braços compridíssimos e pendura, no buraco do O, duas letras de néon azul — um I e um D. BANC... I-DÊ: se sem BankID nada anda na Suécia, ele mesmo monta o dele — porque ele precisa de um BankID.",
  },
  createScene,
}

export default card
