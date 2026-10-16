import * as THREE from 'three'
import type { Card, CardScene, Sequence } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag har mycket att göra." — IÁ, RRÁR! MÜ-QUE... A IÔ-RA!
 *
 * Véspera do banquete do Nobel: o alfaiate baixinho arregaça a manga (IÁ!),
 * solta a risada de quem já surtou (RRÁR!) e gira a manivela dourada da
 * velha máquina de costura IÔRA tão depressa que o braço incha num MUQUE do
 * tamanho de um melão — e ele ainda tasca um beijinho de bico no muque
 * (MÜ-QUE). A máquina range a cada volta (os arcos dourados: IÔ-RA) e a
 * montanha de casacas pretas ao lado não baixa um centímetro.
 *
 * O braço do muque é montado à parte (ombro → cotovelo → mão) e resolvido
 * por IK de dois ossos: a mão segue o cabo da manivela em cada quadro-chave
 * da volta, então a manivela gira de verdade com a mão agarrada nela.
 */

const SOIL = '#4a3220'
const FLOOR = '#c8914c'        // tábuas cor de mel
const FLOOR_LINE = '#8f5f2c'
const TABLE = '#4a2f1d'        // mesa de madeira escura
const TABLE_DARK = '#32200f'
const IRON = '#1e1d23'         // ferro preto da máquina
const GILT = '#b8913e'         // frisos dourados (discretos)
const STEEL = '#b9c0c6'
const GOLD = '#ffbf1a'         // acento saturado RESERVADO à IÔRA: letreiro, roda e rangido
const HANDLE_RED = '#b8342a'
const COAT = '#222229'         // casacas pretas
const SATIN = '#4a4a5a'
const PAPER = '#efe8d8'
const SHIRT = '#f4f0e7'
const VEST = '#6b7077'
const VEST_DARK = '#4d5157'
const SKIN = '#eebd98'
const SKIN_FLEX = '#efb48e'
const MUSTACHE = '#1d1916'
const FRINGE = '#8d8780'
const TAPE = '#efd46a'         // fita métrica: amarelo-palha, abaixo do acento
const CREAM = '#efe3c8'        // manequim
const WOOD = '#8a5a30'
const LIPS = '#d9657a'

const GY = 0.18                // topo do piso
const TOP = GY + 0.67          // tampo da mesa
const TH = -0.7                // giro da máquina (eixo da roda aponta pro alfaiate)
const MACH = new THREE.Vector3(-0.62, TOP, -0.32)
const HUB_L = new THREE.Vector3(0.5, 0.4, 0)    // eixo da roda, no espaço da máquina
const CRANK_R = 0.125          // raio do cabo da manivela
const GRIP_L = new THREE.Vector3(0.155, CRANK_R, 0) // centro do cabo, no espaço da roda
const ALPHA = 0                // pose final: cabo no alto da roda

const TS = 1.12                // escala do alfaiate
const PHI = -0.12              // o alfaiate vira um pouco para a máquina
const LEAN = 0.07              // e inclina o tronco na direção do muque
const SH = new THREE.Vector3(-0.29, 0.75, 0)    // ombro do muque, no espaço do alfaiate
const UPPER = 0.36             // ombro → cotovelo
const FORE = 0.31              // cotovelo → centro do punho
const POLE = new THREE.Vector3(0.1, -1, -0.45)  // o cotovelo cai para baixo e para trás

const PILE = new THREE.Vector3(1.42, 0, -0.62)
const N_COATS = 13
const COAT_H = 0.13

// ---------------------------------------------------------------------------

interface ArmPose { rx: number; ry: number; rz: number; elbow: number }

/** IK de dois ossos: rotação do braço (no ombro) e dobra do cotovelo (eixo x). */
function solveArm(S: THREE.Vector3, T: THREE.Vector3, pole: THREE.Vector3): ArmPose {
  const st = T.clone().sub(S)
  const u = st.clone().normalize()
  const d = THREE.MathUtils.clamp(st.length(), Math.abs(UPPER - FORE) + 1e-3, UPPER + FORE - 1e-3)
  const x = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(UPPER * UPPER - x * x, 0))
  const w = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u))).normalize()
  const E = S.clone().addScaledVector(u, x).addScaledVector(w, h)
  const H = S.clone().addScaledVector(u, d)
  const down = E.clone().sub(S).normalize()   // ombro → cotovelo
  const fore = H.clone().sub(E).normalize()   // cotovelo → mão
  // +z local = lado de dentro da dobra: é para lá que o bíceps estufa
  const z = fore.clone().sub(down.clone().multiplyScalar(fore.dot(down))).normalize()
  const y = down.clone().negate()
  const xAxis = new THREE.Vector3().crossVectors(y, z)
  const e = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, y, z), 'XYZ')
  const bend = Math.acos(THREE.MathUtils.clamp(down.dot(fore), -1, 1))
  return { rx: e.x, ry: e.y, rz: e.z, elbow: -bend }
}

function unwrap(prev: number, v: number) {
  let out = v
  while (out - prev > Math.PI) out -= Math.PI * 2
  while (out - prev < -Math.PI) out += Math.PI * 2
  return out
}

function armSeqs(name: string, at: number, dur: number, a: ArmPose, b: ArmPose, extra?: { ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'; caption?: string }): Sequence[] {
  return [
    seq(name, 'braco', at, dur, [
      ch('rotation.x', a.rx, b.rx), ch('rotation.y', a.ry, b.ry), ch('rotation.z', a.rz, b.rz),
    ], extra),
    seq(`${name}-cotovelo`, 'antebraco', at, dur, [ch('rotation.x', a.elbow, b.elbow)], { ease: extra?.ease }),
  ]
}

/** Traço de letra do letreiro: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.014, 0.004, GOLD, { roughness: 0.32, metalness: 0.3 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** I Ô R A — letras de traço grosso, o nome da máquina. */
function glyph(which: 'I' | 'Ô' | 'R' | 'A') {
  const g = new THREE.Group()
  const t = 0.018
  const H = 0.078
  if (which === 'I') {
    g.add(stroke(t, H, 0, 0))
  } else if (which === 'Ô') {
    const ring = torus(0.027, 0.0095, GOLD, { roughness: 0.32, metalness: 0.3 })
    ring.scale.y = 1.42
    g.add(ring)
    g.add(stroke(t * 0.85, 0.03, -0.011, 0.058, -0.85))
    g.add(stroke(t * 0.85, 0.03, 0.011, 0.058, 0.85))
  } else if (which === 'R') {
    g.add(stroke(t, H, -0.022, 0))
    g.add(stroke(0.046, t, 0.0, 0.031))
    g.add(stroke(0.046, t, 0.0, 0.0))
    g.add(stroke(t, 0.036, 0.022, 0.016))
    g.add(stroke(t, 0.046, 0.016, -0.022, 0.42))
  } else {
    g.add(stroke(t, H + 0.004, -0.015, 0, -0.32))
    g.add(stroke(t, H + 0.004, 0.015, 0, 0.32))
    g.add(stroke(0.034, 0.015, 0, -0.012))
  }
  return g
}

/** Casaca preta dobrada (bloco da pilha): gola em V de cetim, às vezes manga ou cauda caindo. */
function foldedCoat(rand: () => number, i: number, h: number) {
  const g = new THREE.Group()
  const w = 0.7 + rand() * 0.08
  const body = rbox(w, h - 0.008, 0.52, Math.min(0.05, h / 2 - 0.01), COAT, { roughness: 0.8 })
  g.add(body)
  const front = 0.262
  // gola dobrada: duas lapelas de cetim formando um V na beirada da frente
  const lx = -0.16 + rand() * 0.18
  for (const s of [-1, 1]) {
    const lapel = rbox(0.11, 0.026, 0.014, 0.008, SATIN, { roughness: 0.22 })
    lapel.position.set(lx + s * 0.045, 0.004, front)
    lapel.rotation.z = s * 0.42
    g.add(lapel)
  }
  // botões cobertos
  if (i % 3 === 1) {
    for (const bx of [0.14, 0.23]) {
      const button = sphere(0.017, '#3a3a44', { roughness: 0.3 })
      button.position.set(bx, -0.005, front + 0.004)
      button.scale.z = 0.5
      g.add(button)
    }
  }
  // manga ou cauda escapando pela frente/lateral
  if (i % 4 === 0 && i > 0) {
    const side = i % 8 === 0 ? 1 : -1
    const hang = capsule(0.05, 0.2 + rand() * 0.1, COAT, { roughness: 0.8 })
    hang.position.set(side * (w / 2 - 0.04), -0.16, front - 0.02)
    hang.rotation.z = side * 0.1
    g.add(hang)
    const cuff = torus(0.047, 0.012, SATIN, { roughness: 0.25 })
    cuff.rotation.x = Math.PI / 2
    cuff.position.set(side * (w / 2 - 0.04) + side * 0.02, -0.3, front - 0.02)
    g.add(cuff)
  }
  // etiqueta de papel "pra amanhã" pendurada num alfinete
  if (i % 4 === 2) {
    const tag = rbox(0.1, 0.065, 0.01, 0.006, PAPER, { roughness: 0.8 })
    tag.position.set(0.24 - rand() * 0.1, -0.035, front + 0.01)
    tag.rotation.z = (rand() - 0.5) * 0.4
    g.add(tag)
    const pin = sphere(0.012, STEEL, { roughness: 0.25, metalness: 0.8 })
    pin.position.set(tag.position.x, 0.0, front + 0.012)
    g.add(pin)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- piso de tábuas cor de mel -------------------------------------------
  const piso = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  piso.add(soil)

  const floor = cylinder(2.55, 2.62, 0.07, FLOOR, { roughness: 0.7 })
  floor.position.y = 0.145
  piso.add(floor)

  // frestas das tábuas (cordas do disco) + emendas desencontradas
  for (let i = -5; i <= 5; i++) {
    const z = i * 0.44
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - z * z, 0.01))
    const line = rbox(len, 0.012, 0.022, 0.006, FLOOR_LINE, { roughness: 0.85 })
    line.position.set(0, GY + 0.002, z)
    piso.add(line)
    if (Math.abs(z) < 2.1) {
      const jx = (rand() - 0.5) * len * 0.7
      const joint = rbox(0.02, 0.012, 0.42, 0.006, FLOOR_LINE, { roughness: 0.85 })
      joint.position.set(jx, GY + 0.002, z + 0.22)
      piso.add(joint)
    }
  }

  // carretéis e retalho no chão (rng fixo)
  for (const [sx, sz, color] of [[-1.25, 0.32, '#7a3546'], [-1.02, 0.5, '#356b6b']] as const) {
    const spool = new THREE.Group()
    spool.position.set(sx, GY, sz)
    spool.rotation.y = rand() * Math.PI
    const thread = cylinder(0.07, 0.07, 0.11, color, { roughness: 0.85 })
    thread.position.y = 0.075
    spool.add(thread)
    for (const fy of [0.012, 0.138]) {
      const flange = cylinder(0.09, 0.09, 0.024, '#d9b77e', { roughness: 0.6 })
      flange.position.y = fy
      spool.add(flange)
    }
    piso.add(spool)
  }
  const scrap = rbox(0.42, 0.012, 0.3, 0.01, COAT, { roughness: 0.85 })
  scrap.position.set(1.2, GY + 0.008, 0.28)
  scrap.rotation.set(0, 0.5, 0.02)
  piso.add(scrap)
  const chalk = rbox(0.08, 0.016, 0.06, 0.006, '#d8e2ee', { roughness: 0.9 })
  chalk.position.set(0.98, GY + 0.02, 0.55)
  chalk.rotation.y = -0.4
  piso.add(chalk)

  root.add(piso)

  // ---- mesa de costura de madeira escura -----------------------------------
  const A = new THREE.Vector3(Math.cos(TH), 0, -Math.sin(TH)) // eixo x da máquina no mundo
  const mesa = new THREE.Group()
  const tableC = MACH.clone().addScaledVector(A, -0.22)
  mesa.position.set(tableC.x, GY, tableC.z)
  mesa.rotation.y = TH
  const TH_H = TOP - GY

  const tampo = rbox(1.45, 0.06, 0.74, 0.025, TABLE, { roughness: 0.6 })
  tampo.position.y = TH_H - 0.03
  mesa.add(tampo)
  const apron = rbox(1.34, 0.11, 0.64, 0.02, TABLE_DARK, { roughness: 0.7 })
  apron.position.y = TH_H - 0.115
  mesa.add(apron)
  const drawer = rbox(0.48, 0.075, 0.02, 0.012, TABLE, { roughness: 0.6 })
  drawer.position.set(-0.25, TH_H - 0.115, 0.325)
  mesa.add(drawer)
  const knob = sphere(0.022, GILT, { roughness: 0.3, metalness: 0.8 })
  knob.position.set(-0.25, TH_H - 0.115, 0.345)
  mesa.add(knob)
  const LEG_H = TH_H - 0.17
  for (const lx of [-0.62, 0.62]) {
    for (const lz of [-0.28, 0.28]) {
      const leg = lathe(
        [[0, 0], [0.03, 0], [0.042, 0.04], [0.03, 0.1], [0.044, 0.18], [0.034, LEG_H - 0.06], [0.046, LEG_H - 0.03], [0.046, LEG_H], [0, LEG_H]],
        TABLE_DARK,
        { roughness: 0.65 },
      )
      leg.position.set(lx, 0, lz)
      mesa.add(leg)
    }
  }
  // alfineteira e carretel em cima da mesa, do lado da cabeça da máquina
  const cushion = sphere(0.075, '#7a3546', { roughness: 0.9 })
  cushion.scale.y = 0.62
  cushion.position.set(-0.55, TH_H + 0.04, 0.2)
  mesa.add(cushion)
  for (let k = 0; k < 4; k++) {
    const pin = sphere(0.012, k % 2 ? '#e8e2d4' : STEEL, { roughness: 0.3 })
    const a = k * 1.6
    pin.position.set(-0.55 + Math.cos(a) * 0.04, TH_H + 0.085, 0.2 + Math.sin(a) * 0.04)
    mesa.add(pin)
  }

  root.add(mesa)

  // ---- máquina de costura antiga (preta com frisos dourados) ---------------
  const maquina = new THREE.Group()
  maquina.position.copy(MACH)
  maquina.rotation.y = TH

  const bed = rbox(1.0, 0.07, 0.44, 0.03, IRON, { roughness: 0.3 })
  bed.position.y = 0.035
  maquina.add(bed)
  const bedLine = rbox(0.94, 0.01, 0.006, 0.003, GILT, { roughness: 0.35, metalness: 0.7 })
  bedLine.position.set(0, 0.05, 0.221)
  maquina.add(bedLine)
  const plate = rbox(0.13, 0.008, 0.11, 0.004, STEEL, { roughness: 0.25, metalness: 0.8 })
  plate.position.set(-0.38, 0.072, 0.03)
  maquina.add(plate)

  const ARM_Y = 0.45
  const column = rbox(0.2, 0.4, 0.22, 0.06, IRON, { roughness: 0.3 })
  column.position.set(0.33, 0.07 + 0.2, 0)
  maquina.add(column)
  const arm = rbox(0.86, 0.15, 0.2, 0.065, IRON, { roughness: 0.3 })
  arm.position.set(0.0, ARM_Y, 0)
  maquina.add(arm)
  const headM = rbox(0.2, 0.32, 0.21, 0.07, IRON, { roughness: 0.3 })
  headM.position.set(-0.38, 0.39, 0)
  maquina.add(headM)
  const face = rbox(0.012, 0.24, 0.15, 0.03, GILT, { roughness: 0.35, metalness: 0.7 })
  face.position.set(-0.484, 0.39, 0)
  maquina.add(face)

  // frisos dourados emoldurando o letreiro
  for (const fy of [ARM_Y + 0.062, ARM_Y - 0.062]) {
    const friso = rbox(0.62, 0.008, 0.005, 0.002, GILT, { roughness: 0.35, metalness: 0.7 })
    friso.position.set(0.0, fy, 0.101)
    maquina.add(friso)
  }
  const colFriso = rbox(0.008, 0.26, 0.005, 0.002, GILT, { roughness: 0.35, metalness: 0.7 })
  colFriso.position.set(0.33, 0.24, 0.111)
  maquina.add(colFriso)

  // letreiro IÔRA na frente do braço
  const letreiro = new THREE.Group()
  letreiro.position.set(0.0, ARM_Y - 0.003, 0.104)
  for (const [gch, gx] of [['I', -0.12], ['Ô', -0.055], ['R', 0.03], ['A', 0.11]] as const) {
    const l = glyph(gch)
    l.position.x = gx
    letreiro.add(l)
  }
  maquina.add(letreiro)

  // botão de tensão, barra da agulha, calcador
  const dial = cylinder(0.03, 0.03, 0.02, GILT, { roughness: 0.3, metalness: 0.8 })
  dial.rotation.x = Math.PI / 2
  dial.position.set(-0.38, 0.44, 0.112)
  maquina.add(dial)
  const needleBar = cylinder(0.012, 0.012, 0.12, STEEL, { roughness: 0.25, metalness: 0.8 })
  needleBar.position.set(-0.4, 0.19, 0.05)
  maquina.add(needleBar)
  const needle = cylinder(0.004, 0.004, 0.06, STEEL, { roughness: 0.2, metalness: 0.9 })
  needle.position.set(-0.4, 0.105, 0.05)
  maquina.add(needle)
  const foot = rbox(0.05, 0.012, 0.07, 0.004, STEEL, { roughness: 0.25, metalness: 0.8 })
  foot.position.set(-0.4, 0.083, 0.06)
  maquina.add(foot)

  // carretel de linha preta no pino de cima
  const spoolPin = cylinder(0.008, 0.008, 0.1, STEEL, { roughness: 0.25, metalness: 0.8 })
  spoolPin.position.set(0.12, ARM_Y + 0.115, -0.02)
  maquina.add(spoolPin)
  const topSpool = lathe(
    [[0.012, 0], [0.042, 0], [0.042, 0.012], [0.032, 0.014], [0.032, 0.066], [0.042, 0.068], [0.042, 0.08], [0.012, 0.08]],
    '#d9b77e',
    { roughness: 0.6 },
  )
  topSpool.position.set(0.12, ARM_Y + 0.075, -0.02)
  maquina.add(topSpool)
  const topThread = cylinder(0.034, 0.034, 0.052, '#2a2a30', { roughness: 0.85 })
  topThread.position.set(0.12, ARM_Y + 0.115, -0.02)
  maquina.add(topThread)

  // casaca em costura passando sob a agulha
  const work = rbox(0.42, 0.014, 0.3, 0.01, COAT, { roughness: 0.85 })
  work.position.set(-0.3, 0.078, 0.05)
  work.rotation.y = 0.15
  maquina.add(work)
  const stitches = rbox(0.3, 0.004, 0.006, 0.002, '#e8e2d4', { roughness: 0.8 })
  stitches.position.set(-0.3, 0.087, 0.05)
  stitches.rotation.y = 0.15
  maquina.add(stitches)

  // eixo da roda saindo da coluna
  const axle = cylinder(0.035, 0.035, 0.1, IRON, { roughness: 0.3 })
  axle.rotation.z = Math.PI / 2
  axle.position.set(0.455, HUB_L.y, 0)
  maquina.add(axle)

  root.add(maquina)

  // ---- roda de manivela dourada (gira em torno do eixo x da máquina) -------
  const roda = new THREE.Group()
  roda.position.copy(HUB_L)
  roda.rotation.x = ALPHA
  maquina.add(roda)

  const goldMat = { roughness: 0.28, metalness: 0.65 }
  const rim = torus(0.2, 0.026, GOLD, goldMat)
  rim.rotation.y = Math.PI / 2
  roda.add(rim)
  for (let k = 0; k < 3; k++) {
    const spoke = rbox(0.022, 0.38, 0.03, 0.01, GOLD, goldMat)
    spoke.rotation.x = (k * Math.PI) / 3
    roda.add(spoke)
  }
  const hub = cylinder(0.05, 0.05, 0.07, GOLD, goldMat)
  hub.rotation.z = Math.PI / 2
  roda.add(hub)
  const crankArm = rbox(0.026, CRANK_R + 0.06, 0.05, 0.012, GOLD, goldMat)
  crankArm.position.set(0.045, CRANK_R / 2, 0)
  roda.add(crankArm)
  const grip = cylinder(0.032, 0.032, 0.22, HANDLE_RED, { roughness: 0.35 })
  grip.rotation.z = Math.PI / 2
  grip.position.set(GRIP_L.x, CRANK_R, 0)
  roda.add(grip)
  const gripCap = sphere(0.036, GOLD, goldMat)
  gripCap.position.set(GRIP_L.x + 0.112, CRANK_R, 0)
  gripCap.scale.x = 0.6
  roda.add(gripCap)

  // ---- pilha altíssima e meio torta de casacas pretas ----------------------
  const pilha = new THREE.Group()
  pilha.position.copy(PILE)
  pilha.rotation.y = -0.18
  let stackY = GY
  for (let i = 0; i < N_COATS; i++) {
    const h = COAT_H - 0.02 + rand() * 0.04
    const c = foldedCoat(rand, i, h)
    c.position.set(-0.0024 * i * i + (rand() - 0.5) * 0.05, stackY + h / 2, (rand() - 0.5) * 0.06)
    c.rotation.y = (rand() - 0.5) * 0.28
    c.rotation.z = (rand() - 0.5) * 0.04
    pilha.add(c)
    stackY += h
  }
  // a casaca do topo, jogada aberta: lapelas de cetim e mangas penduradas
  const topY = stackY
  const topX = -0.0024 * N_COATS * N_COATS
  const drape = new THREE.Group()
  drape.position.set(topX, topY, 0.0)
  drape.rotation.y = 0.15
  const drapeBody = rbox(0.66, 0.07, 0.5, 0.035, COAT, { roughness: 0.82 })
  drapeBody.position.y = 0.035
  drape.add(drapeBody)
  for (const s of [-1, 1]) {
    const lapel = rbox(0.07, 0.012, 0.34, 0.006, SATIN, { roughness: 0.25 })
    lapel.position.set(s * 0.07, 0.074, 0.06)
    lapel.rotation.y = s * 0.32
    drape.add(lapel)
    // manga caindo pela lateral, com dois botões no punho
    const sleeveC = new THREE.Group()
    sleeveC.position.set(s * 0.33, 0.04, 0.08)
    sleeveC.rotation.z = s * 0.12
    const tube = capsule(0.058, 0.4, COAT, { roughness: 0.82 })
    tube.position.y = -0.22
    sleeveC.add(tube)
    for (const by of [-0.38, -0.33]) {
      const b = sphere(0.014, '#3a3a44', { roughness: 0.3 })
      b.position.set(s * 0.012, by, 0.056)
      sleeveC.add(b)
    }
    drape.add(sleeveC)
  }
  const drapeTag = rbox(0.12, 0.08, 0.01, 0.006, PAPER, { roughness: 0.8 })
  drapeTag.position.set(0.12, 0.02, 0.27)
  drapeTag.rotation.set(0, 0, -0.12)
  drape.add(drapeTag)
  pilha.add(drape)
  root.add(pilha)

  // ---- manequim creme vestindo meia casaca alinhavada ----------------------
  const manequim = new THREE.Group()
  manequim.position.set(-1.5, 0, -1.15)
  manequim.rotation.y = 0.55
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3
    const leg = rbox(0.045, 0.03, 0.36, 0.012, WOOD, { roughness: 0.7 })
    leg.position.set(Math.sin(a) * 0.15, GY + 0.04, Math.cos(a) * 0.15)
    leg.rotation.set(0.12, a, 0)
    manequim.add(leg)
  }
  const pole = cylinder(0.024, 0.03, 0.62, WOOD, { roughness: 0.7 })
  pole.position.y = GY + 0.35
  manequim.add(pole)
  const FORM_Y = GY + 0.64
  const formProfile: [number, number][] = [
    [0, 0], [0.19, 0.0], [0.22, 0.07], [0.205, 0.18], [0.165, 0.28], [0.19, 0.4],
    [0.215, 0.5], [0.2, 0.58], [0.135, 0.65], [0.06, 0.69], [0.05, 0.75], [0, 0.76],
  ]
  const form = lathe(formProfile, CREAM, { roughness: 0.75 })
  form.position.y = FORM_Y
  form.scale.z = 0.78
  manequim.add(form)
  const capKnob = sphere(0.045, WOOD, { roughness: 0.6 })
  capKnob.position.y = FORM_Y + 0.78
  manequim.add(capKnob)
  // meia casaca: metade esquerda do torso, um pouco maior que o busto
  const halfProfile = formProfile
    .filter(([, y]) => y >= 0.22 && y <= 0.66)
    .map(([r, y]) => new THREE.Vector2(r * 1.07 + 0.006, y))
  const halfCoat = new THREE.Mesh(
    new THREE.LatheGeometry(halfProfile, 24, Math.PI, Math.PI),
    mat(COAT, { roughness: 0.82, size: 0.5 }),
  )
  ;(halfCoat.material as THREE.Material).side = THREE.DoubleSide
  halfCoat.castShadow = true
  halfCoat.receiveShadow = true
  halfCoat.position.y = FORM_Y
  halfCoat.scale.z = 0.78
  manequim.add(halfCoat)
  // cauda da casaca caindo atrás
  const mTail = rbox(0.13, 0.46, 0.03, 0.03, COAT, { roughness: 0.82 })
  mTail.position.set(-0.1, FORM_Y + 0.05, -0.17)
  mTail.rotation.x = 0.12
  manequim.add(mTail)
  // alinhavo branco na beirada da frente e na cava
  for (let k = 0; k < 6; k++) {
    const st = rbox(0.008, 0.035, 0.006, 0.002, '#ffffff', { roughness: 0.8 })
    const y = 0.27 + k * 0.065
    const r = 0.2 * 1.07 * 0.78
    st.position.set(-0.012, FORM_Y + y, r + 0.008)
    manequim.add(st)
  }
  root.add(manequim)

  // ---- alfaiate baixinho e redondo -----------------------------------------
  const alfaiate = person({ body: VEST, skin: SKIN, height: 1.5, armAngle: 0.32 })
  alfaiate.scale.setScalar(TS)
  alfaiate.rotation.y = PHI

  // braço livre: manga branca de camisa, segura a tesoura
  const armFree = alfaiate.getObjectByName('armR') as THREE.Mesh
  armFree.material = mat(SHIRT, { roughness: 0.75, size: 0.4 })
  shoulderPivot(armFree, 1.5)
  armFree.rotation.set(-0.25, 0, 0.32) // afasta do corpo e vem um pouco à frente
  const handFree = armFree.children[0]
  const tesoura = new THREE.Group()
  tesoura.position.set(0.0, -0.07, 0.04)
  tesoura.rotation.set(0.2, 0, -0.32)
  for (const s of [-1, 1]) {
    const blade = rbox(0.026, 0.24, 0.008, 0.008, STEEL, { roughness: 0.2, metalness: 0.85 })
    blade.position.set(s * 0.012, -0.13, 0)
    blade.rotation.z = s * 0.1
    tesoura.add(blade)
    const ringH = torus(0.036, 0.011, '#2c2c30', { roughness: 0.4 })
    ringH.position.set(s * 0.035, 0.02, 0)
    tesoura.add(ringH)
  }
  const screw = sphere(0.012, '#2c2c30', { roughness: 0.3 })
  screw.position.set(0, -0.03, 0.006)
  tesoura.add(screw)
  handFree.add(tesoura)

  // colete: plastrão branco, gravata-borboleta, botões, gola
  const plastron = rbox(0.15, 0.2, 0.04, 0.02, SHIRT, { roughness: 0.7 })
  plastron.position.set(0, 0.66, 0.205)
  plastron.rotation.x = -0.45
  alfaiate.add(plastron)
  for (const s of [-1, 1]) {
    const vEdge = rbox(0.028, 0.24, 0.03, 0.012, VEST_DARK, { roughness: 0.8 })
    vEdge.position.set(s * 0.085, 0.63, 0.215)
    vEdge.rotation.set(-0.4, 0, s * 0.33)
    alfaiate.add(vEdge)
    const bow = cone(0.04, 0.07, '#1d1d22', { roughness: 0.5 }, 16)
    bow.rotation.z = s * Math.PI / 2
    bow.position.set(s * 0.035, 0.765, 0.15)
    alfaiate.add(bow)
  }
  const bowKnot = sphere(0.022, '#1d1d22', { roughness: 0.5 })
  bowKnot.position.set(0, 0.765, 0.165)
  alfaiate.add(bowKnot)
  for (const by of [0.5, 0.42, 0.34]) {
    const btn = sphere(0.02, '#2e3034', { roughness: 0.35 })
    btn.position.set(0, by, 0.258)
    btn.scale.z = 0.55
    alfaiate.add(btn)
  }
  const pocket = rbox(0.09, 0.012, 0.02, 0.005, VEST_DARK, { roughness: 0.8 })
  pocket.position.set(0.13, 0.46, 0.235)
  pocket.rotation.y = 0.45
  alfaiate.add(pocket)

  // cabeça calva: franja grisalha, bigode em guidão, óculos na ponta do nariz
  const cabeca = alfaiate.getObjectByName('head') as THREE.Group
  const HR = 0.285
  for (const s of [-1, 1]) {
    const side = puff(0.075, FRINGE, 4, 70 + s, { roughness: 0.92 })
    side.position.set(s * HR * 0.9, HR * 0.05, -HR * 0.25)
    side.scale.set(0.6, 1, 1.3)
    cabeca.add(side)
  }
  const back = puff(0.1, FRINGE, 5, 75, { roughness: 0.92 })
  back.position.set(0, HR * 0.02, -HR * 0.85)
  back.scale.set(1.9, 0.8, 0.6)
  cabeca.add(back)

  for (const s of [-1, 1]) {
    const brow = rbox(0.085, 0.024, 0.02, 0.01, MUSTACHE, { roughness: 0.8 })
    brow.position.set(s * HR * 0.38, HR * 0.4, HR * 0.86)
    brow.rotation.z = s * 0.18
    cabeca.add(brow)

    // bigode em guidão: gomo grosso para o lado + cacho enrolado para cima
    const stache = capsule(0.03, 0.08, MUSTACHE, { roughness: 0.6 })
    stache.rotation.set(0, s * 0.3, s * (Math.PI / 2 + 0.12))
    stache.position.set(s * 0.068, -HR * 0.32, HR * 0.93)
    cabeca.add(stache)
    const curl = new THREE.Mesh(
      new THREE.TorusGeometry(0.03, 0.014, 8, 20, Math.PI * 1.5),
      mat(MUSTACHE, { roughness: 0.6, size: 0.08 }),
    )
    curl.castShadow = true
    curl.position.set(s * 0.148, -HR * 0.24, HR * 0.86)
    curl.rotation.set(0, s * 0.45, s > 0 ? -Math.PI / 2 : 0)
    if (s < 0) curl.scale.x = -1
    cabeca.add(curl)

    // aros redondos pequenos, escorregados até a ponta do nariz
    const lensRim = torus(0.043, 0.0075, '#6e5a3a', { roughness: 0.3, metalness: 0.7 })
    lensRim.position.set(s * 0.06, -HR * 0.1, HR * 1.04)
    lensRim.rotation.y = s * 0.12
    cabeca.add(lensRim)
  }
  const glassBridge = rbox(0.035, 0.009, 0.009, 0.004, '#6e5a3a', { roughness: 0.3, metalness: 0.7 })
  glassBridge.position.set(0, -HR * 0.07, HR * 1.06)
  cabeca.add(glassBridge)

  // beijinho de bico
  const bico = new THREE.Group()
  bico.position.set(0, -HR * 0.48, HR * 0.86)
  const pucker = cylinder(0.04, 0.05, 0.06, LIPS, { roughness: 0.35 })
  pucker.rotation.x = Math.PI / 2
  pucker.position.z = 0.02
  bico.add(pucker)
  const hole = sphere(0.015, '#7a2340', { roughness: 0.5 })
  hole.position.z = 0.052
  hole.scale.z = 0.4
  bico.add(hole)
  cabeca.add(bico)

  // ---- fita métrica amarela no pescoço -------------------------------------
  const fita = new THREE.Group()
  const collar = torus(0.135, 0.014, TAPE, { roughness: 0.6 })
  collar.rotation.x = Math.PI / 2 - 0.25
  collar.position.set(0, 0.79, -0.02)
  collar.scale.set(1, 1, 0.3)
  fita.add(collar)
  for (const s of [-1, 1]) {
    const strip = rbox(0.05, 0.38, 0.008, 0.004, TAPE, { roughness: 0.6 })
    strip.position.set(s * 0.15, 0.6, 0.205)
    strip.rotation.set(-0.42, 0, s * 0.05)
    fita.add(strip)
    for (let k = 0; k < 7; k++) {
      const tick = rbox(0.022, 0.006, 0.004, 0.001, '#2b2b2b', { roughness: 0.8 })
      tick.position.set(s * 0.15 - 0.012, 0.75 - k * 0.045, 0.21 + k * 0.019)
      tick.rotation.x = -0.42
      fita.add(tick)
    }
    const tip = rbox(0.054, 0.02, 0.012, 0.004, STEEL, { roughness: 0.25, metalness: 0.8 })
    tip.position.set(s * 0.155, 0.415, 0.285)
    tip.rotation.x = -0.42
    fita.add(tip)
  }
  alfaiate.add(fita)

  // ---- braço do muque, montado à parte (substitui o armL) -------------------
  const oldArm = alfaiate.getObjectByName('armL') as THREE.Mesh
  alfaiate.remove(oldArm)

  const braco = new THREE.Group()
  braco.position.copy(SH)
  alfaiate.add(braco)

  // manga arregaçada: punho de camisa enrolado logo abaixo do ombro
  const sleeve = cylinder(0.115, 0.108, 0.08, SHIRT, { roughness: 0.75 })
  sleeve.position.y = -0.02
  braco.add(sleeve)
  const roll = torus(0.1, 0.034, SHIRT, { roughness: 0.75 })
  roll.rotation.x = Math.PI / 2
  roll.position.y = -0.07
  braco.add(roll)
  const upper = capsule(0.088, UPPER - 0.1, SKIN, { roughness: 0.6 })
  upper.position.y = -UPPER / 2 - 0.03
  braco.add(upper)
  const triceps = sphere(0.085, SKIN, { roughness: 0.6 })
  triceps.position.set(0, -0.2, -0.03)
  triceps.scale.set(0.95, 1.5, 0.85)
  braco.add(triceps)

  // o MUQUE: bíceps comprido estufado para o lado de dentro da dobra
  const muque = new THREE.Group()
  muque.position.set(0, -0.2, 0.068)
  braco.add(muque)
  const biceps = sphere(0.155, SKIN_FLEX, { roughness: 0.5 })
  biceps.scale.set(0.95, 1.22, 1.05)
  muque.add(biceps)
  const vein = capsule(0.008, 0.16, '#d99a7c', { roughness: 0.5 })
  vein.position.set(0.035, 0.0, 0.132)
  vein.rotation.z = 0.18
  muque.add(vein)

  const antebraco = new THREE.Group()
  antebraco.position.y = -UPPER
  braco.add(antebraco)
  const elbowBall = sphere(0.082, SKIN, { roughness: 0.6 })
  antebraco.add(elbowBall)
  // antebraço torneado: grosso perto do cotovelo, fino no pulso, entra no punho
  const fore = lathe(
    [[0, -FORE + 0.02], [0.056, -FORE + 0.025], [0.064, -FORE + 0.06], [0.078, -0.17],
      [0.088, -0.08], [0.083, -0.02], [0.05, 0.03], [0, 0.04]],
    SKIN,
    { roughness: 0.6 },
  )
  antebraco.add(fore)

  // punho fechado em volta do cabo vermelho (alinhado ao cabo depois do IK)
  const fist = new THREE.Group()
  fist.position.y = -FORE
  antebraco.add(fist)
  const palm = rbox(0.12, 0.13, 0.13, 0.05, SKIN, { roughness: 0.6 })
  fist.add(palm)
  for (let k = 0; k < 4; k++) {
    const knuckle = sphere(0.027, SKIN, { roughness: 0.6 })
    knuckle.position.set(-0.045 + k * 0.03, -0.035, -0.06)
    fist.add(knuckle)
  }
  const thumb = capsule(0.026, 0.05, SKIN, { roughness: 0.6 })
  thumb.position.set(0.0, -0.05, 0.055)
  thumb.rotation.set(0, 0, Math.PI / 2)
  fist.add(thumb)

  root.add(alfaiate)

  // ---- posicionamento: muque de cartaz — braço horizontal, antebraço em pé -
  root.updateMatrixWorld(true)
  const hubW = roda.getWorldPosition(new THREE.Vector3())
  const gripTop = roda.localToWorld(GRIP_L.clone())
  const sideW = new THREE.Vector3(Math.cos(PHI), 0, -Math.sin(PHI)) // +x do alfaiate no mundo
  const shoulderW = gripTop.clone()
    .add(new THREE.Vector3(0, -FORE * TS, 0))
    .addScaledVector(sideW, UPPER * TS * 0.98)
  const tilt = new THREE.Euler(0, PHI, LEAN)
  const shOff = SH.clone().multiplyScalar(TS).applyEuler(tilt)
  alfaiate.rotation.copy(tilt)
  alfaiate.position.set(shoulderW.x - shOff.x, shoulderW.y - shOff.y, shoulderW.z - shOff.z)
  alfaiate.position.y = GY
  root.updateMatrixWorld(true)
  const toTailor = alfaiate.matrixWorld.clone().invert()

  const gripAt = (alpha: number) => {
    roda.rotation.x = alpha
    roda.updateMatrixWorld(true)
    return roda.localToWorld(GRIP_L.clone()).applyMatrix4(toTailor)
  }

  // poses: braço caído, punho erguido no grito (IÁ!) e agarrado na manivela
  const POSE_HANG = solveArm(SH, SH.clone().add(new THREE.Vector3(-0.1, -0.6, 0.06)), new THREE.Vector3(0, 0, 1))
  const POSE_UP = solveArm(SH, SH.clone().add(new THREE.Vector3(-0.24, 0.56, 0.12)), new THREE.Vector3(-1, -0.4, 0))

  const STEPS = 8 // quadros-chave por volta
  const crankPoses = (turns: number) => {
    const out: ArmPose[] = []
    let prev: ArmPose | null = null
    for (let k = 0; k <= turns * STEPS; k++) {
      const alpha = ALPHA - turns * Math.PI * 2 + (k * Math.PI * 2) / STEPS
      const p = solveArm(SH, gripAt(alpha), POLE)
      if (prev) {
        p.rx = unwrap(prev.rx, p.rx)
        p.ry = unwrap(prev.ry, p.ry)
        p.rz = unwrap(prev.rz, p.rz)
      }
      out.push(p)
      prev = p
    }
    return out
  }
  const SPIN_A = crankPoses(2)
  const SPIN_B = crankPoses(1)
  const POSE_CRANK = SPIN_B[SPIN_B.length - 1] // `to` da última sequência do braço

  roda.rotation.x = ALPHA
  braco.rotation.set(POSE_CRANK.rx, POSE_CRANK.ry, POSE_CRANK.rz)
  antebraco.rotation.x = POSE_CRANK.elbow

  // o punho gira em torno do antebraço até o eixo x dele ficar no cabo
  root.updateMatrixWorld(true)
  const axisW = new THREE.Vector3(1, 0, 0).transformDirection(roda.matrixWorld)
  const foreQ = antebraco.getWorldQuaternion(new THREE.Quaternion())
  const axisF = axisW.applyQuaternion(foreQ.invert()).normalize()
  const fy = new THREE.Vector3(0, 1, 0).addScaledVector(axisF, -axisF.y).normalize()
  const fz = new THREE.Vector3().crossVectors(axisF, fy)
  fist.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(axisF, fy, fz))

  // cabeça na pose final: virada para o muque, dando o beijinho
  const HEAD_TURN = -0.5
  const HEAD_TILT = 0.14
  cabeca.rotation.set(HEAD_TILT, HEAD_TURN, 0)

  // ---- três arcos dourados do rangido (IÔ-RA) ------------------------------
  const arcos = new THREE.Group()
  arcos.position.copy(hubW).add(new THREE.Vector3(-0.02, 0.02, 0.12))
  arcos.rotation.y = 0.1
  const SPAN = 0.95
  for (const [k, r] of [0.32, 0.45, 0.58].entries()) {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.024 - k * 0.002, 10, 40, SPAN),
      mat(GOLD, { emissive: GOLD, emissiveIntensity: 1.1, roughness: 0.4 }),
    )
    arc.rotation.z = 2.0 - SPAN / 2
    arcos.add(arc)
  }
  root.add(arcos)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'atelie', object: piso },
    { name: 'mesa', group: 'atelie', object: mesa },
    { name: 'maquina', group: 'maquina', object: maquina },
    { name: 'roda', group: 'maquina', object: roda },
    { name: 'pilha', group: 'casacas', object: pilha },
    { name: 'manequim', group: 'casacas', object: manequim },
    { name: 'alfaiate', group: 'alfaiate', object: alfaiate },
    { name: 'cabeca', group: 'alfaiate', object: cabeca },
    { name: 'fita', group: 'alfaiate', object: fita },
    { name: 'braco', group: 'alfaiate', object: braco },
    { name: 'antebraco', group: 'alfaiate', object: antebraco },
    { name: 'muque', group: 'muque', object: muque },
    { name: 'arcos', group: 'iora', object: arcos },
  ]

  // ---- montagem ------------------------------------------------------------
  const spinSeqs = (poses: ArmPose[], at: number, dur: number) => {
    const out: Sequence[] = []
    const n = poses.length - 1
    for (let k = 0; k < n; k++) {
      out.push(...armSeqs(`gira-${at}-${k}`, at + (dur * k) / n, dur / n, poses[k], poses[k + 1], { ease: 'linear' }))
    }
    return out
  }

  const T_RISE = 4.0
  const T_LAUGH = 5.5
  const T_CRANK = 6.9
  const SPIN1 = T_CRANK + 0.55
  const SPIN1_DUR = 1.7
  const T_KISS = 9.5
  const T_CREAK = 10.7
  const SPIN2_DUR = 1.0
  const T_END = 12.2

  const build: Sequence[] = [
    seq('piso-rise', 'piso', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Véspera do banquete do Nobel, em Estocolmo: o ateliê do alfaiate brota do chão…',
    }),
    seq('mesa-rise', 'mesa', 0.45, 0.8, [riseFrom(GY, 1.2)], { ease: 'easeOut' }),
    seq('maquina-cai', 'maquina', 1.0, 0.6, [
      ch('position.y', TOP + 1.1, TOP),
      ch('scale.x', 0.7, 1), ch('scale.y', 0.7, 1), ch('scale.z', 0.7, 1),
    ], { ease: 'easeIn' }),
    seq('roda-cresce', 'roda', 1.5, 0.7, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('rotation.x', ALPHA - Math.PI, ALPHA),
    ], { ease: 'easeOut' }),

    seq('pilha-rise', 'pilha', 2.3, 1.0, [riseFrom(PILE.y, 2.2)], {
      ease: 'easeOut',
      caption: '…e ao lado sobe uma montanha de casacas pretas pra entregar até amanhã.',
    }),
    seq('manequim-rise', 'manequim', 2.6, 0.8, [riseFrom(0, 1.6)], { ease: 'easeOut' }),

    seq('alfaiate-rise', 'alfaiate', T_RISE, 0.8, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: 'O alfaiate baixinho arregaça a manga com um grito de guerra: IÁ!',
    }),
    seq('cabeca-grito', 'cabeca', T_RISE, 0.8, [ch('rotation.x', -0.25, 0)], { ease: 'easeOut' }),
    ...armSeqs('braco-ergue', T_RISE, 0.8, POSE_HANG, POSE_UP, { ease: 'easeOut' }),
    seq('fita-cai', 'fita', T_RISE + 0.5, 0.5, [ch('position.y', 0.7, 0)], { ease: 'easeIn' }),

    seq('cabeca-ri', 'cabeca', T_LAUGH, 0.35, [ch('rotation.x', 0, -0.38)], {
      ease: 'easeOut',
      caption: 'E solta a risada soprada de quem já surtou: RRÁR!',
    }),
    seq('alfaiate-sacode', 'alfaiate', T_LAUGH, 0.25, [ch('rotation.z', 0, 0.06)], { ease: 'easeOut' }),
    seq('alfaiate-sacode-b', 'alfaiate', T_LAUGH + 0.25, 0.25, [ch('rotation.z', 0.06, -0.06)]),
    seq('alfaiate-sacode-c', 'alfaiate', T_LAUGH + 0.5, 0.3, [ch('rotation.z', -0.06, LEAN)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', T_LAUGH + 0.8, 0.4, [ch('rotation.x', -0.38, 0)]),

    ...armSeqs('braco-agarra', T_CRANK, 0.55, POSE_UP, SPIN_A[0], {
      ease: 'easeInOut',
      caption: 'Gira a manivela tão depressa que o braço incha num MUQUE do tamanho de um melão…',
    }),
    seq('roda-gira', 'roda', SPIN1, SPIN1_DUR, [ch('rotation.x', ALPHA - Math.PI * 4, ALPHA)], { ease: 'linear' }),
    ...spinSeqs(SPIN_A, SPIN1, SPIN1_DUR),
    seq('muque-incha', 'muque', SPIN1 + 0.1, SPIN1_DUR - 0.2, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),

    seq('cabeca-beijo', 'cabeca', T_KISS, 0.6, [
      ch('rotation.y', 0, HEAD_TURN), ch('rotation.x', 0, HEAD_TILT),
    ], {
      ease: 'easeOut',
      caption: '…e ainda tasca um beijinho de bico no próprio muque: MÜ-QUE!',
    }),

    seq('roda-range', 'roda', T_CREAK, SPIN2_DUR, [ch('rotation.x', ALPHA - Math.PI * 2, ALPHA)], {
      ease: 'linear',
      caption: 'A cada volta a máquina range — a IÔ-RA, a IÔ-RA — e a montanha não baixa um centímetro.',
    }),
    ...spinSeqs(SPIN_B, T_CREAK, SPIN2_DUR),
    seq('arcos-surgem', 'arcos', T_CREAK + 0.1, 0.45, [
      ch('scale.x', 0.2, 1.12), ch('scale.y', 0.2, 1.12), ch('scale.z', 0.2, 1.12),
    ], { ease: 'easeOut' }),
    seq('arcos-assentam', 'arcos', T_CREAK + 0.55, 0.35, [
      ch('scale.x', 1.12, 0.92), ch('scale.y', 1.12, 0.92), ch('scale.z', 1.12, 0.92),
    ]),
    seq('arcos-pulsam', 'arcos', T_CREAK + 0.9, 0.4, [
      ch('scale.x', 0.92, 1), ch('scale.y', 0.92, 1), ch('scale.z', 0.92, 1),
    ], { ease: 'easeOut' }),

    seq('pilha-balanca', 'pilha', T_END, 0.7, [ch('rotation.z', 0.035, 0)], {
      ease: 'easeOut',
      caption: 'Jag har mycket att göra. — Tenho muita coisa pra fazer.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 1.65, 3.5], target: [0.02, 1.12, -0.25] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-mycket-att-gora',
    contexto:
      "Trabalho: quando alguém pede mais uma coisa ('Jag har mycket att göra just nu'), pra recusar o after-work sem ofender ou explicar por que o e-mail ainda não foi respondido. Em casa, na semana da mudança ou na correria antes do Natal. O molde 'mycket att + verbo' serve pra tudo: 'mycket att läsa', 'mycket att lära sig'.",
    fraseFonte: 'Tenho muita coisa pra fazer.',
    fraseAlvo: 'Jag har mycket att göra.',
    pronuncia:
      "iá rrar MÜK-ke a IÖÖ-ra ('jag' = iá; 'har' com h soprado e R brando, rapidinho e sem força; 'mycket' com Ü curto — i com bico —, K dobrado e o T do fim mudo na fala: MÜK-ke; 'att' antes de verbo encolhe num 'a' rápido (muito sueco diz 'ó', igual ao 'och': 'mycke ó göra' — as duas formas passam); 'göra' começa com I de ioga (nunca G duro), Ö longo — língua de Ê, lábios em bico, um tiquinho aberto antes do R — e R de um toque só; força no MÜK e no IÖ)",
    ponteSonora:
      "IÁ, RRÁR! MÜ-QUE... A IÔ-RA! (7 batidas: iá-rrar-MÜK-ke-a-IÖÖ-ra; tônicas no MÜ e, mais forte, no IÔ; IÁ é o 'jag' de sempre, aqui o grito de guerra do alfaiate arregaçando a manga — I de IOGA, nunca J chiado; RRÁR = a risada soprada, o MESMO RRÁR de 'Jag har ont i magen', 'Jag har ett möte' e 'Jag har tappat min plånbok': h soprado leve, A longo e R BRANDO no fim, que encosta direto no M — sem esse R sobra 'ha', outro verbo; aqui ele passa rapidinho, sem força; MÜ-QUE = o MUQUE de 'Tack så mycket', dito no beijinho de BICO que o alfaiate dá no próprio braço: língua de I e lábios de U, que é o y sueco; Ü CURTO, o K segurado um instante (é dobrado) e o -QUE fraquinho; o T de 'mycket' não aparece, igual na fala sueca; nunca 'MÚ-qui' de boca aberta; A = o 'att', só um 'a' rápido e sem força, colado no IÔ; IÔ-RA = o MESMO IÔRA de 'Jag måste göra en felanmälan' — o 'göra' de sempre — e o rangido iiiÖR da manivela de 'Det gör ont här' e 'Vad gör du i helgen?', agora com o -A do infinitivo: I de IOGA (nunca G duro nem J chiado), Ö LONGO com língua de Ê e lábios em bico, um tiquinho aberto por causa do R, e RA com R de um toque só, de 'cara'; sem o -A sobra 'gör' (faz), e depois de 'att' tem que vir o infinitivo)",
    historia:
      'Dezembro em Estocolmo, véspera do banquete do Nobel, e o alfaiate tem uma montanha de casacas pretas pra entregar até amanhã. Ele arregaça a manga com um grito de guerra, IÁ!, e solta a risada soprada de quem já surtou: RRÁR! Gira a manivela da velha máquina de costura tão depressa que o braço incha num MUQUE do tamanho de um melão — e ainda tasca um beijinho de bico no próprio muque: MÜ-QUE! A cada volta a máquina, que no ateliê todo mundo chama de IÔRA, range — a IÔ-RA, a IÔ-RA — e a montanha de casacas não baixa um centímetro: tenho muita coisa pra fazer.',
  },
  createScene,
}

export default card
