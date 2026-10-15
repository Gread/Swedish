import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag återkommer." — IÁ... ÔÔ-TER, CÓ-MER!
 *
 * O gerente de contas é um CENTAURO de camisa social e gravata. Reunião às
 * 11h29, o cliente pergunta o preço e ele não tem a resposta; o relógio vira
 * 11h30 (almoço sueco) e a metade de cavalo dispara sozinha rumo ao
 * refeitório. Na porta, a metade de cima puxa o freio — ÔÔÔ! —, os cascos
 * derrapam soltando faísca e ele torce o tronco pra trás, de dedo erguido,
 * com o embornal de aveia no braço: "IÁ... ÔÔ-TER, CÓ-MER!".
 *
 * Diorama: piso de vinil cinza, parede bege ao fundo com a porta do
 * refeitório (placa de garfo e faca) à esquerda e o relógio em 11h30 sobre a
 * mesa de reunião à direita. O centauro de perfil, freando para a esquerda,
 * com o tronco virado para a câmera. Acento saturado RESERVADO às faíscas da
 * freada (o ÔÔÔ! que faz a metade de baixo dar meia-volta).
 */

const SOIL = '#3b4046'
const FLOOR = '#b4b8bb' // vinil cinza-claro
const FLOOR_SEAM = '#9fa3a7'
const WALL = '#e6d7bb' // bege
const WALL_LOW = '#d6c3a0'
const TRIM = '#f5f3ee' // moldura e rodapé brancos
const BEYOND = '#e9cf98' // o refeitório iluminado do outro lado da porta
const BIRCH = '#dcbb8c'
const BIRCH_DARK = '#b9915d'
const STEEL = '#8f969d'
const DARK = '#2f3439'
const SIGN = '#2f5b4f'
const COAT = '#6f3c20' // castanho
const COAT_DARK = '#4f2813'
const HOOF = '#27211e'
const TAIL = '#2b211c'
const SHIRT = '#a8c8ea'
const SHIRT_LIGHT = '#d3e5f6'
const TIE = '#2b3c69'
const TIE_STRIPE = '#9db2da'
const SKIN = '#e8c39e'
const HAIR = '#5a371f'
const LEATHER = '#5a3a24'
const CANVAS = '#c3a676' // lona do embornal
const CANVAS_DARK = '#8e7148'
const OATS = '#e3cc90'
const SPARK = '#ffc519' // acento saturado: as faíscas da freada

const GY = 0.16 // topo do piso
const WZ = -1.35 // face da parede
const WALL_TOP = 2.72
const DX = -1.32 // centro do vão da porta
const DW = 0.8
const DH = 1.74

const CLOCK: [number, number, number] = [1.42, 2.1, WZ + 0.05]
const MIN_1129 = -(174 / 180) * Math.PI
const MIN_1130 = -Math.PI

// centauro: espaço local do cavalo tem +x = frente; o grupo gira YAW para a
// frente apontar para a porta (esquerda da câmera), um tico para a câmera
const CX = 0.12
const CZ = 0.2
const YAW = Math.PI + 0.15
const GALLOP_X = CX + 0.95
const PITCH = 0.24 // freada: frente alta, anca baixa
const SPINE_Y = 0.95
const FAR_STEP = 0.2 // pata dianteira do lado de lá, um passo atrás

// tronco: para onde o rosto aponta (ângulo em y no MUNDO; 0 = câmera)
const FACE_CLIENT = 0.9 // encarando o cliente, à direita
const FACE_DOOR = -Math.PI / 2 + 0.15 // olhando a porta (a frente do cavalo)
const FACE_FINAL = 0.32 // virado pra trás, de frente para a câmera
const PHI_CLIENT = FACE_CLIENT - YAW
const PHI_FRONT = FACE_DOOR - YAW
const PHI_FINAL = FACE_FINAL - YAW
const TORSO_X = 0.47
const TORSO_Y = 1.08

// braço do dedo erguido (lado +x do person = mão esquerda dele)
const ARM_REST_Z = 0.2
const ARM_REST_X = -0.1
const ARM_UP_Z = 2.55
const ARM_UP_X = 0.3

const BAG_SWING = -0.55 // embornal jogado pra frente pela freada
const TAIL_UP = -0.22 // rabo erguido pelo tranco (z negativo levanta a pluma)
const TAIL_GALLOP = 0.12 // no galope o rabo vem mais deitado

/** Ponto no eixo do corpo inclinado: t ao longo da coluna, h na normal. */
function spine(t: number, h: number, z = 0) {
  const c = Math.cos(PITCH)
  const s = Math.sin(PITCH)
  return new THREE.Vector3(c * t - s * h, SPINE_Y + s * t + c * h, z)
}

/** Cápsula de a até b (pernas, rabo): as pontas arredondadas viram juntas. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, roughness = 0.72) {
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const m = capsule(r, Math.max(0.001, len), color, { roughness })
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Estrelinha de faísca: dois losangos cruzados + miolo, emissiva. */
function star(size: number) {
  const g = new THREE.Group()
  const m = mat(SPARK, { emissive: SPARK, emissiveIntensity: 1.5, roughness: 0.4 })
  for (const rz of [0, Math.PI / 2]) {
    const ray = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), m)
    ray.scale.set(size * 0.28, size, size * 0.2)
    ray.rotation.z = rz
    g.add(ray)
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(size * 0.3, 12, 12), m)
  g.add(core)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base: piso de vinil cinza-claro --------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.1, SOIL, { roughness: 0.9 })
  soil.position.y = 0.05
  base.add(soil)

  const floor = cylinder(2.56, 2.6, 0.06, FLOOR, { roughness: 0.5 })
  floor.position.y = GY - 0.03
  base.add(floor)

  // juntas das placas de vinil: cordas do disco nas duas direções
  for (let i = -3; i <= 3; i++) {
    const k = i * 0.68 + 0.2
    const half = Math.sqrt(Math.max(2.5 * 2.5 - k * k, 0.01))
    const lx = rbox(half * 2, 0.008, 0.018, 0.004, FLOOR_SEAM, { roughness: 0.6 })
    lx.position.set(0, GY + 0.002, k)
    base.add(lx)
    const lz = rbox(0.018, 0.008, half * 2, 0.004, FLOOR_SEAM, { roughness: 0.6 })
    lz.position.set(k, GY + 0.002, 0)
    base.add(lz)
  }

  // vaso de planta no canto da frente, à esquerda
  const pot = lathe(
    [[0, 0], [0.16, 0], [0.18, 0.05], [0.2, 0.3], [0.22, 0.33], [0.2, 0.34], [0.17, 0.3], [0, 0.29]],
    '#f0ece4',
    { roughness: 0.35 },
  )
  pot.position.set(-1.92, GY, -0.75)
  base.add(pot)
  const leaves = puff(0.24, '#4d7d4c', 7, 37, { roughness: 0.85 })
  leaves.position.set(-1.92, GY + 0.56, -0.75)
  leaves.scale.set(1, 1.15, 1)
  base.add(leaves)

  root.add(base)

  // ---- parede bege com a porta do refeitório --------------------------------
  const parede = new THREE.Group()

  const WL = -2.18
  const WR = 2.18
  const T = 0.12
  const wz = WZ - T / 2
  const doorL = DX - DW / 2
  const doorR = DX + DW / 2
  const WH = WALL_TOP - GY

  const left = rbox(doorL - WL, WH, T, 0.02, WALL, { roughness: 0.85 })
  left.position.set((WL + doorL) / 2, GY + WH / 2, wz)
  parede.add(left)
  const right = rbox(WR - doorR, WH, T, 0.02, WALL, { roughness: 0.85 })
  right.position.set((doorR + WR) / 2, GY + WH / 2, wz)
  parede.add(right)
  const lintel = rbox(DW + 0.02, WALL_TOP - (GY + DH), T, 0.02, WALL, { roughness: 0.85 })
  lintel.position.set(DX, (GY + DH + WALL_TOP) / 2, wz)
  parede.add(lintel)

  // meia-parede mais escura + rodapé branco (escritório sueco)
  for (const [x0, x1] of [[WL, doorL - 0.09], [doorR + 0.09, WR]] as const) {
    const low = rbox(x1 - x0, 0.8, 0.02, 0.008, WALL_LOW, { roughness: 0.85 })
    low.position.set((x0 + x1) / 2, GY + 0.4, WZ + 0.005)
    parede.add(low)
    const rail = rbox(x1 - x0, 0.04, 0.04, 0.012, TRIM, { roughness: 0.4 })
    rail.position.set((x0 + x1) / 2, GY + 0.82, WZ + 0.015)
    parede.add(rail)
    const skirting = rbox(x1 - x0, 0.09, 0.04, 0.012, TRIM, { roughness: 0.4 })
    skirting.position.set((x0 + x1) / 2, GY + 0.045, WZ + 0.015)
    parede.add(skirting)
  }

  // moldura branca da porta
  for (const side of [-1, 1]) {
    const jamb = rbox(0.09, DH + 0.06, 0.18, 0.02, TRIM, { roughness: 0.4 })
    jamb.position.set(DX + side * (DW / 2 + 0.045), GY + (DH + 0.06) / 2, wz + 0.02)
    parede.add(jamb)
  }
  const head = rbox(DW + 0.27, 0.1, 0.18, 0.02, TRIM, { roughness: 0.4 })
  head.position.set(DX, GY + DH + 0.06, wz + 0.02)
  parede.add(head)

  // folha da porta aberta para o lado de lá
  const hinge = new THREE.Group()
  hinge.position.set(doorL + 0.02, GY, wz - 0.04)
  hinge.rotation.y = 1.1
  const leaf = rbox(DW - 0.04, DH - 0.03, 0.045, 0.015, BIRCH, { roughness: 0.55 })
  leaf.position.set((DW - 0.04) / 2, (DH - 0.03) / 2, 0)
  hinge.add(leaf)
  for (const s of [-1, 1]) {
    const lever = rbox(0.12, 0.025, 0.025, 0.01, STEEL, { roughness: 0.3, metalness: 0.7 })
    lever.position.set(DW - 0.17, 0.95, s * 0.045)
    hinge.add(lever)
  }
  parede.add(hinge)

  // o refeitório do outro lado: parede quente e iluminada, balcão e panela
  const beyond = rbox(1.5, 2.2, 0.08, 0.02, BEYOND, { roughness: 0.8 })
  beyond.position.set(DX - 0.05, GY + 1.1, WZ - 0.75)
  parede.add(beyond)
  const counter = rbox(1.2, 0.5, 0.3, 0.03, TRIM, { roughness: 0.5 })
  counter.position.set(DX + 0.1, GY + 0.25, WZ - 0.55)
  parede.add(counter)
  const counterTop = rbox(1.24, 0.04, 0.34, 0.015, BIRCH_DARK, { roughness: 0.5 })
  counterTop.position.set(DX + 0.1, GY + 0.52, WZ - 0.55)
  parede.add(counterTop)
  const pan = lathe(
    [[0, 0], [0.14, 0], [0.15, 0.02], [0.15, 0.15], [0.165, 0.16], [0.14, 0.16], [0.135, 0.03], [0, 0.03]],
    STEEL,
    { roughness: 0.3, metalness: 0.7 },
  )
  pan.position.set(DX + 0.05, GY + 0.54, WZ - 0.55)
  parede.add(pan)
  const steam = puff(0.07, '#fbf8f2', 5, 19, { roughness: 0.95 })
  steam.position.set(DX + 0.05, GY + 0.8, WZ - 0.55)
  steam.scale.set(1, 1.6, 1)
  parede.add(steam)

  // placa do refeitório sobre a porta: garfo e faca
  const placa = new THREE.Group()
  placa.position.set(DX, GY + DH + 0.36, WZ + 0.02)
  const plate = rbox(0.4, 0.3, 0.035, 0.05, SIGN, { roughness: 0.5 })
  placa.add(plate)
  const fork = new THREE.Group()
  fork.position.set(-0.07, 0, 0.022)
  const fh = rbox(0.026, 0.13, 0.01, 0.006, TRIM, { roughness: 0.4 })
  fh.position.y = -0.045
  fork.add(fh)
  const fb = rbox(0.075, 0.022, 0.01, 0.006, TRIM, { roughness: 0.4 })
  fb.position.y = 0.025
  fork.add(fb)
  for (const tx of [-0.029, 0, 0.029]) {
    const tine = rbox(0.014, 0.07, 0.01, 0.005, TRIM, { roughness: 0.4 })
    tine.position.set(tx, 0.065, 0)
    fork.add(tine)
  }
  placa.add(fork)
  const knife = new THREE.Group()
  knife.position.set(0.07, 0, 0.022)
  const kh = rbox(0.03, 0.1, 0.01, 0.008, TRIM, { roughness: 0.4 })
  kh.position.y = -0.06
  knife.add(kh)
  const blade = rbox(0.04, 0.13, 0.01, 0.018, TRIM, { roughness: 0.4 })
  blade.position.set(0.004, 0.05, 0)
  knife.add(blade)
  placa.add(knife)
  parede.add(placa)

  root.add(parede)

  // ---- mesa de reunião de madeira clara -------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(1.68, 0, -0.75)
  mesa.rotation.y = -0.3
  root.add(mesa)

  const TABLE_Y = GY + 0.64
  const top = rbox(1.15, 0.05, 0.66, 0.022, BIRCH, { roughness: 0.5 })
  top.position.y = TABLE_Y - 0.025
  mesa.add(top)
  const apron = rbox(1.0, 0.06, 0.52, 0.015, BIRCH_DARK, { roughness: 0.6 })
  apron.position.y = TABLE_Y - 0.08
  mesa.add(apron)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const legT = cylinder(0.022, 0.018, 0.6, DARK, { roughness: 0.35, metalness: 0.6 })
      legT.position.set(sx * 0.5, GY + 0.3, sz * 0.26)
      mesa.add(legT)
    }
  }
  // a folha EM BRANCO (a resposta que ele não tem)
  const sheet = rbox(0.26, 0.006, 0.34, 0.003, '#fbfaf6', { roughness: 0.7 })
  sheet.position.set(-0.22, TABLE_Y + 0.004, 0.08)
  sheet.rotation.y = 0.25
  mesa.add(sheet)
  const pen = cylinder(0.009, 0.009, 0.16, TIE, { roughness: 0.3 })
  pen.rotation.set(Math.PI / 2, 0, 0)
  pen.rotation.z = 0.5
  pen.position.set(-0.02, TABLE_Y + 0.01, 0.12)
  mesa.add(pen)
  const cup = lathe(
    [[0, 0], [0.05, 0], [0.055, 0.015], [0.058, 0.1], [0.05, 0.1], [0.046, 0.02], [0, 0.02]],
    '#f4f1ea',
    { roughness: 0.2 },
  )
  cup.position.set(0.3, TABLE_Y, -0.05)
  const cupHandle = torus(0.03, 0.009, '#f4f1ea', { roughness: 0.2 })
  cupHandle.position.set(0.06, 0.055, 0)
  cup.add(cupHandle)
  mesa.add(cup)
  // cadeira do cliente, do outro lado da mesa
  const chair = new THREE.Group()
  chair.position.set(0.15, 0, -0.52)
  chair.rotation.y = 0.15
  const seat = rbox(0.42, 0.06, 0.4, 0.025, '#4c5763', { roughness: 0.85 })
  seat.position.y = GY + 0.42
  chair.add(seat)
  const back = rbox(0.42, 0.42, 0.06, 0.03, '#4c5763', { roughness: 0.85 })
  back.position.set(0, GY + 0.7, -0.18)
  chair.add(back)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cl = cylinder(0.016, 0.016, 0.4, DARK, { roughness: 0.35, metalness: 0.6 })
      cl.position.set(sx * 0.17, GY + 0.2, sz * 0.16)
      chair.add(cl)
    }
  }
  mesa.add(chair)

  // ---- relógio de parede (11h29 → 11h30) ------------------------------------
  const relogio = new THREE.Group()
  relogio.position.set(...CLOCK)
  root.add(relogio)

  const caseBack = cylinder(0.3, 0.3, 0.06, DARK, { roughness: 0.4 })
  caseBack.rotation.x = Math.PI / 2
  relogio.add(caseBack)
  const dial = cylinder(0.27, 0.27, 0.02, '#fbfaf7', { roughness: 0.35 })
  dial.rotation.x = Math.PI / 2
  dial.position.z = 0.03
  relogio.add(dial)
  const bezel = torus(0.28, 0.03, DARK, { roughness: 0.35 })
  bezel.position.z = 0.04
  relogio.add(bezel)
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2
    const big = h % 3 === 0
    const tick = rbox(big ? 0.032 : 0.018, big ? 0.07 : 0.045, 0.01, 0.004, DARK, { roughness: 0.4 })
    const r = big ? 0.205 : 0.215
    tick.position.set(Math.sin(a) * r, Math.cos(a) * r, 0.045)
    tick.rotation.z = -a
    relogio.add(tick)
  }
  const hourPivot = new THREE.Group()
  hourPivot.position.z = 0.05
  hourPivot.rotation.z = -(345 / 360) * Math.PI * 2
  const hourHand = rbox(0.034, 0.15, 0.012, 0.012, DARK, { roughness: 0.4 })
  hourHand.position.y = 0.06
  hourPivot.add(hourHand)
  relogio.add(hourPivot)
  const hub = cylinder(0.025, 0.025, 0.03, DARK, { roughness: 0.3 })
  hub.rotation.x = Math.PI / 2
  hub.position.z = 0.065
  relogio.add(hub)

  const ponteiro = new THREE.Group()
  ponteiro.position.z = 0.058
  ponteiro.rotation.z = MIN_1130
  const minuteHand = rbox(0.022, 0.24, 0.01, 0.009, DARK, { roughness: 0.4 })
  minuteHand.position.y = 0.09
  ponteiro.add(minuteHand)
  relogio.add(ponteiro)

  // ---- CENTAURO: metade cavalo ----------------------------------------------
  const cavalo = new THREE.Group()
  cavalo.position.set(CX, 0, CZ)
  cavalo.rotation.y = YAW
  root.add(cavalo)

  // corpo de cavalo: mais fundo que largo, peito cheio, anca redonda
  const barrel = capsule(0.31, 0.85, COAT, { roughness: 0.72 })
  barrel.position.copy(spine(-0.02, 0.02))
  barrel.rotation.z = PITCH - Math.PI / 2
  barrel.scale.set(1.0, 1, 0.86)
  cavalo.add(barrel)

  // barriga cheia na frente, flanco recolhido perto da anca
  const belly = sphere(0.3, COAT, { roughness: 0.72 })
  belly.position.copy(spine(0.12, -0.06))
  belly.rotation.z = PITCH
  belly.scale.set(1.45, 0.95, 0.86)
  cavalo.add(belly)

  const chest = sphere(0.38, COAT, { roughness: 0.72 })
  chest.position.copy(spine(0.5, 0.02))
  chest.scale.set(0.92, 1.08, 0.84)
  cavalo.add(chest)

  const rump = sphere(0.37, COAT, { roughness: 0.72 })
  rump.position.copy(spine(-0.54, 0.06))
  rump.scale.set(1.08, 0.94, 0.9)
  cavalo.add(rump)

  // patas da frente: esticadas pra frente e abertas, fincadas no chão; a de
  // lá fica um passo atrás para aparecer ao lado da de cá
  for (const side of [-1, 1]) {
    const back = side > 0 ? FAR_STEP : 0
    const sh = spine(0.5, -0.12, side * 0.15)
    const knee = new THREE.Vector3(0.77 - back * 0.6, 0.55, side * 0.21)
    const fet = new THREE.Vector3(0.97 - back, GY + 0.11, side * 0.25)
    cavalo.add(limb(sh, knee, 0.115, COAT))
    cavalo.add(limb(knee, fet, 0.064, COAT_DARK))
    const kn = sphere(0.082, COAT_DARK, { roughness: 0.72 })
    kn.position.copy(knee)
    cavalo.add(kn)
    const fl = sphere(0.078, COAT_DARK, { roughness: 0.72 })
    fl.position.copy(fet)
    cavalo.add(fl)
    const hoof = cylinder(0.08, 0.098, 0.1, HOOF, { roughness: 0.5 })
    hoof.position.set(1.02 - back, GY + 0.05, side * 0.25)
    hoof.rotation.z = -0.25
    cavalo.add(hoof)
  }

  // patas de trás: sentadas na derrapagem, canelas deslizando no piso
  for (const side of [-1, 1]) {
    const hip = spine(-0.5, -0.05, side * 0.17)
    const stifle = new THREE.Vector3(-0.24, 0.5, side * 0.21)
    const hock = new THREE.Vector3(-0.64, 0.3, side * 0.21)
    const fet = new THREE.Vector3(-0.32, GY + 0.08, side * 0.22)
    cavalo.add(limb(hip, stifle, 0.16, COAT))
    cavalo.add(limb(stifle, hock, 0.09, COAT))
    cavalo.add(limb(hock, fet, 0.06, COAT_DARK))
    const hk = sphere(0.078, COAT_DARK, { roughness: 0.72 })
    hk.position.copy(hock)
    cavalo.add(hk)
    const hoof = cylinder(0.078, 0.095, 0.1, HOOF, { roughness: 0.5 })
    hoof.position.set(-0.25, GY + 0.05, side * 0.22)
    cavalo.add(hoof)
  }

  // ---- rabo preto esvoaçando (peça própria: chicoteia) ----------------------
  // cadeia de esferas que afinam ao longo de uma curva em S: o Blender funde
  // numa mecha contínua
  const rabo = new THREE.Group()
  rabo.position.copy(spine(-0.86, 0.2))
  rabo.rotation.z = TAIL_UP
  cavalo.add(rabo)
  // pluma: fina na raiz, cheia no meio, afinando na ponta; sobe da garupa
  // e voa pra trás. Esferas bem sobrepostas ao longo de uma Bézier — o
  // Blender funde num volume liso de crina.
  const p0 = new THREE.Vector3(0, 0, 0)
  const p1 = new THREE.Vector3(-0.3, 0.38, 0)
  const p2 = new THREE.Vector3(-0.7, 0.2, 0)
  const tailCurve = new THREE.QuadraticBezierCurve3(p0, p1, p2)
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    const r = 0.05 + 0.1 * Math.pow(Math.sin(Math.PI * Math.min(t * 1.08, 1)), 0.7)
    const bead = sphere(r, TAIL, { roughness: 0.9 })
    bead.position.copy(tailCurve.getPoint(t))
    bead.scale.z = 0.8
    rabo.add(bead)
  }

  // ---- tronco humano: camisa social azul-clara e gravata --------------------
  const tronco = new THREE.Group()
  tronco.position.set(TORSO_X, TORSO_Y, 0)
  tronco.rotation.y = PHI_FINAL
  cavalo.add(tronco)

  const lean = new THREE.Group()
  lean.rotation.z = -0.14 // inclinado pra trás, puxando o freio
  tronco.add(lean)

  const homem = person({ body: SHIRT, skin: SKIN, height: 1.5, armAngle: 0.3 })
  lean.add(homem)

  // cinto onde a camisa entra no cavalo
  const belt = torus(0.268, 0.04, LEATHER, { roughness: 0.6 })
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.36
  homem.add(belt)
  const buckle = rbox(0.08, 0.065, 0.03, 0.012, STEEL, { roughness: 0.3, metalness: 0.7 })
  buckle.position.set(0, 0.36, 0.3)
  homem.add(buckle)

  // gravata listrada: nó + lâmina + listras diagonais
  const knot = rbox(0.07, 0.06, 0.04, 0.015, TIE, { roughness: 0.55 })
  knot.position.set(0, 0.705, 0.235)
  homem.add(knot)
  const bladeT = rbox(0.085, 0.27, 0.025, 0.02, TIE, { roughness: 0.55 })
  bladeT.position.set(0, 0.54, 0.258)
  bladeT.rotation.x = -0.12
  homem.add(bladeT)
  for (const sy of [0.62, 0.55, 0.48]) {
    const stripe = rbox(0.095, 0.018, 0.01, 0.004, TIE_STRIPE, { roughness: 0.55 })
    stripe.position.set(0, sy, 0.272 + (0.54 - sy) * 0.12)
    stripe.rotation.set(-0.12, 0, 0.6)
    homem.add(stripe)
  }
  for (const side of [-1, 1]) {
    const collar = rbox(0.1, 0.06, 0.03, 0.012, SHIRT_LIGHT, { roughness: 0.6 })
    collar.position.set(side * 0.06, 0.73, 0.22)
    collar.rotation.set(-0.3, side * 0.35, side * 0.55)
    homem.add(collar)
  }
  // bolso com caneta
  const pocket = rbox(0.09, 0.09, 0.012, 0.012, SHIRT_LIGHT, { roughness: 0.65 })
  pocket.position.set(0.12, 0.55, 0.248)
  pocket.rotation.y = 0.35
  homem.add(pocket)
  const clip = cylinder(0.009, 0.009, 0.07, TIE, { roughness: 0.3 })
  clip.position.set(0.105, 0.6, 0.252)
  homem.add(clip)

  // cabeça: cabelo castanho, sobrancelhas erguidas
  const cabeca = homem.getObjectByName('head') as THREE.Group
  const hair = sphere(0.3, HAIR, { roughness: 0.85 })
  hair.scale.set(1.02, 0.72, 1.02)
  hair.position.set(0, 0.14, -0.07)
  cabeca.add(hair)
  const quiff = puff(0.09, HAIR, 4, 13, { roughness: 0.85 })
  quiff.position.set(0.05, 0.28, 0.1)
  quiff.scale.set(1.4, 0.7, 1)
  cabeca.add(quiff)
  for (const side of [-1, 1]) {
    // sobrancelhas de "só um minutinho": pontas de dentro erguidas
    const brow = capsule(0.018, 0.07, HAIR, { roughness: 0.8 })
    brow.position.set(side * 0.105, 0.13, 0.275)
    brow.rotation.set(0, 0, Math.PI / 2 - side * 0.32)
    cabeca.add(brow)
  }

  // boca num Ô redondo (peça: abre na freada)
  const boca = new THREE.Group()
  boca.position.set(0, -0.11, 0.245)
  cabeca.add(boca)
  const cavity = sphere(0.055, '#5a1f22', { roughness: 0.6 })
  cavity.scale.set(1, 1.15, 0.7)
  boca.add(cavity)
  const lips = torus(0.06, 0.021, '#c0766a', { roughness: 0.5 })
  lips.scale.set(1, 1.15, 1)
  lips.position.z = 0.012
  boca.add(lips)

  // braço do dedo erguido (mão esquerda dele)
  const bracoR = homem.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  bracoR.rotation.set(ARM_UP_X, 0, ARM_UP_Z)
  const handR = bracoR.children[0]

  // braço do embornal (mão direita dele): pra frente e pra fora
  const bracoL = homem.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoL, 1.5)
  bracoL.rotation.set(-0.75, 0, -0.3)
  const handL = bracoL.children[0]

  // ---- embornal de aveia (pendurado na mão) ---------------------------------
  const alca = new THREE.Group() // compensa a pose do braço: pendura no prumo
  alca.position.copy(handL.position)
  bracoL.add(alca)
  const embornal = new THREE.Group()
  embornal.rotation.z = BAG_SWING
  alca.add(embornal)

  const loop = torus(0.065, 0.018, LEATHER, { roughness: 0.6 })
  loop.rotation.y = Math.PI / 2
  embornal.add(loop)
  for (const s of [-1, 1]) {
    embornal.add(limb(new THREE.Vector3(s * 0.03, -0.05, 0), new THREE.Vector3(s * 0.15, -0.24, 0), 0.016, LEATHER, 0.6))
  }
  // saco de lona bojudo (não balde): fundo de couro, boca franzida, aveia
  // transbordando
  const sack = lathe(
    [
      [0, -0.55], [0.1, -0.55], [0.15, -0.52], [0.18, -0.44], [0.185, -0.36],
      [0.165, -0.28], [0.13, -0.24], [0.14, -0.22], [0.12, -0.215], [0, -0.23],
    ],
    CANVAS,
    { roughness: 0.92 },
  )
  embornal.add(sack)
  const bottom = lathe(
    [[0, -0.56], [0.1, -0.56], [0.152, -0.525], [0.17, -0.475], [0.165, -0.47], [0, -0.48]],
    LEATHER,
    { roughness: 0.6 },
  )
  embornal.add(bottom)
  const cinch = torus(0.133, 0.016, LEATHER, { roughness: 0.6 })
  cinch.rotation.x = Math.PI / 2
  cinch.position.y = -0.245
  embornal.add(cinch)
  // remendo de lona escura na frente
  const patch = rbox(0.12, 0.1, 0.03, 0.02, CANVAS_DARK, { roughness: 0.9 })
  patch.position.set(0, -0.38, 0.17)
  patch.rotation.x = -0.05
  embornal.add(patch)
  const oats = puff(0.1, OATS, 6, 71, { roughness: 0.9 })
  oats.position.y = -0.2
  oats.scale.set(1.15, 0.6, 1.15)
  embornal.add(oats)
  // grãos pulando com o tranco da freada
  for (let i = 0; i < 4; i++) {
    const grain = capsule(0.013, 0.025, OATS, { roughness: 0.8 })
    grain.position.set(-0.05 - i * 0.06, -0.14 + rand() * 0.08, (rand() - 0.5) * 0.12)
    grain.rotation.z = rand() * Math.PI
    embornal.add(grain)
  }

  // ---- dedo em riste: alinhado ao prumo do mundo na pose final ---------------
  root.updateMatrixWorld(true)
  const finger = capsule(0.034, 0.09, SKIN, { roughness: 0.6 })
  const upR = new THREE.Vector3(0, 1, 0).applyQuaternion(
    bracoR.getWorldQuaternion(new THREE.Quaternion()).invert(),
  )
  finger.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), upR)
  finger.position.copy(handR.position).addScaledVector(upR, 0.1)
  bracoR.add(finger)

  // pendura o embornal no prumo, de frente para a câmera
  const want = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.25, 0))
  const parentQ = bracoL.getWorldQuaternion(new THREE.Quaternion())
  alca.quaternion.copy(parentQ.invert().multiply(want))

  // ---- faíscas e marcas de derrapagem (no referencial do cavalo parado) -----
  const quadro = new THREE.Group()
  quadro.position.set(CX, 0, CZ)
  quadro.rotation.y = YAW
  root.add(quadro)

  const faiscas = new THREE.Group()
  faiscas.position.set(1.04, GY + 0.03, 0)
  quadro.add(faiscas)
  for (const side of [-1, 1]) {
    const hx = side > 0 ? -FAR_STEP : 0
    // leque de estrelinhas subindo do casco: pra frente, pra cima e pra trás
    for (let i = 0; i < 6; i++) {
      const a = 0.35 + i * 0.4 + rand() * 0.12
      const d = 0.2 + rand() * 0.22 + (i % 2) * 0.1
      const s = star(0.06 + d * 0.12)
      s.position.set(hx + Math.cos(a) * d * 0.9, 0.05 + Math.sin(a) * d, side * 0.25 + (rand() - 0.5) * 0.16)
      s.rotation.set(0, -YAW, rand() * Math.PI)
      faiscas.add(s)
    }
    for (let i = 0; i < 4; i++) {
      const a = 0.5 + i * 0.5
      const streak = capsule(0.011, 0.14, SPARK, { emissive: SPARK, emissiveIntensity: 1.2 })
      streak.position.set(hx + Math.cos(a) * 0.14, 0.04 + Math.sin(a) * 0.13, side * 0.25)
      streak.rotation.z = a - Math.PI / 2
      faiscas.add(streak)
    }
  }

  const marcas = new THREE.Group()
  marcas.position.set(1.04, GY + 0.003, 0)
  quadro.add(marcas)
  for (const [x0, len, z, w] of [
    [-FAR_STEP, 0.6, 0.25, 0.11],
    [0, 0.7, -0.25, 0.11],
    [-1.27, 0.45, 0.22, 0.1],
    [-1.27, 0.45, -0.22, 0.1],
  ] as const) {
    const mark = rbox(len, 0.006, w, 0.003, '#6d7175', { roughness: 0.7 })
    mark.position.set(x0 - len / 2, 0, z)
    marcas.add(mark)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'parede', group: 'sala', object: parede },
    { name: 'mesa', group: 'reuniao', object: mesa },
    { name: 'relogio', group: 'reuniao', object: relogio },
    { name: 'ponteiro', group: 'reuniao', object: ponteiro },
    { name: 'cavalo', group: 'centauro', object: cavalo },
    { name: 'rabo', group: 'centauro', object: rabo },
    { name: 'tronco', group: 'centauro', object: tronco },
    { name: 'bracoR', group: 'centauro', object: bracoR },
    { name: 'embornal', group: 'aveia', object: embornal },
    { name: 'faiscas', group: 'freio', object: faiscas },
    { name: 'marcas', group: 'freio', object: marcas },
    { name: 'boca', group: 'freio', object: boca },
  ]

  const grow = (from = 0.01, to = 1) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Sala de reunião, 11h29. O cliente pergunta o preço…',
    }),
    seq('parede-rise', 'parede', 0.2, 0.9, [riseFrom(0, 2.9)], { ease: 'easeOut' }),
    seq('mesa-rise', 'mesa', 0.9, 0.7, [riseFrom(0, 1.0)], { ease: 'easeOut' }),
    seq('relogio-cresce', 'relogio', 1.2, 0.6, grow(), { ease: 'easeOut' }),
    seq('ponteiro-cresce', 'ponteiro', 1.35, 0.5, grow(), { ease: 'easeOut' }),

    seq('cavalo-rise', 'cavalo', 2.2, 0.9, [riseFrom(0, 2.6)], {
      ease: 'easeOut',
      caption: '…e o gerente de contas, um CENTAURO de camisa e gravata, não tem a resposta.',
    }),
    seq('tronco-sobe', 'tronco', 2.45, 0.7, [ch('position.y', TORSO_Y - 0.7, TORSO_Y)], { ease: 'easeOut' }),
    seq('braco-desce', 'bracoR', 2.6, 0.6, [ch('rotation.z', ARM_REST_Z + 0.8, ARM_REST_Z), ch('rotation.x', ARM_REST_X, ARM_REST_X)], { ease: 'easeOut' }),
    seq('rabo-sai', 'rabo', 2.7, 0.5, grow(), { ease: 'easeOut' }),

    seq('embornal-cresce', 'embornal', 3.7, 0.5, grow(), {
      ease: 'easeOut',
      caption: 'No braço, o embornal de aveia — e a barriga já roncando de fome.',
    }),

    seq('relogio-toca-a', 'relogio', 5.0, 0.15, [ch('rotation.z', 0, 0.14)], {
      caption: 'O relógio vira 11h30 — almoço sueco! — e as quatro patas disparam sozinhas rumo ao refeitório.',
    }),
    seq('ponteiro-tique', 'ponteiro', 5.0, 0.25, [ch('rotation.z', MIN_1129, MIN_1130)], { ease: 'easeOut' }),
    seq('relogio-toca-b', 'relogio', 5.15, 0.15, [ch('rotation.z', 0.14, -0.14)]),
    seq('relogio-toca-c', 'relogio', 5.3, 0.2, [ch('rotation.z', -0.14, 0)]),

    // galope até a porta
    seq('cavalo-galopa', 'cavalo', 5.5, 1.2, [ch('position.x', GALLOP_X, CX)], { ease: 'easeIn' }),
    seq('cavalo-inclina', 'cavalo', 5.5, 0.3, [ch('rotation.z', 0, -0.07)]),
    seq('cavalo-pulo-a', 'cavalo', 5.5, 0.3, [ch('position.y', 0, 0.14)], { ease: 'easeOut' }),
    seq('cavalo-pouso-a', 'cavalo', 5.8, 0.3, [ch('position.y', 0.14, 0.02)], { ease: 'easeIn' }),
    seq('cavalo-pulo-b', 'cavalo', 6.1, 0.3, [ch('position.y', 0.02, 0.14)], { ease: 'easeOut' }),
    seq('cavalo-pouso-b', 'cavalo', 6.4, 0.3, [ch('position.y', 0.14, 0)], { ease: 'easeIn' }),
    seq('tronco-olha-porta', 'tronco', 5.5, 0.5, [ch('rotation.y', PHI_CLIENT, PHI_FRONT)]),
    seq('embornal-arrasta', 'embornal', 5.6, 0.4, [ch('rotation.z', 0, 0.5)], { ease: 'easeOut' }),
    seq('embornal-sacode', 'embornal', 6.0, 0.4, [ch('rotation.z', 0.5, 0.3)]),
    seq('rabo-voa', 'rabo', 5.6, 0.5, [ch('rotation.z', TAIL_UP, TAIL_GALLOP)]),

    // ÔÔÔ! freada
    seq('cavalo-freia', 'cavalo', 6.7, 0.3, [ch('rotation.z', -0.07, 0.1)], {
      ease: 'easeOut',
      caption: 'Na porta, a metade de cima puxa o freio na de baixo — ÔÔÔ! — e os cascos derrapam soltando faísca.',
    }),
    seq('cavalo-assenta', 'cavalo', 7.0, 0.45, [ch('rotation.z', 0.1, 0)]),
    seq('marcas-riscam', 'marcas', 6.7, 0.4, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),
    seq('faiscas-estouram', 'faiscas', 6.75, 0.35, grow(), { ease: 'easeOut' }),
    seq('boca-abre', 'boca', 6.8, 0.3, grow(), { ease: 'easeOut' }),
    seq('embornal-joga', 'embornal', 6.7, 0.45, [ch('rotation.z', 0.3, BAG_SWING)], { ease: 'easeOut' }),
    seq('rabo-chicote', 'rabo', 6.7, 0.45, [ch('rotation.z', TAIL_GALLOP, TAIL_UP)], { ease: 'easeOut' }),

    // vira pra trás, de dedo erguido
    seq('tronco-vira', 'tronco', 7.8, 0.7, [ch('rotation.y', PHI_FRONT, PHI_FINAL)], {
      caption: 'De dedo erguido, ele torce o tronco pra trás e fala aos pedaços, feito Tarzan com fome: IÁ… ÔÔ-TER, CÓ-MER!',
    }),
    seq('braco-ergue', 'bracoR', 8.0, 0.6, [ch('rotation.z', ARM_REST_Z, ARM_UP_Z), ch('rotation.x', ARM_REST_X, ARM_UP_X)], { ease: 'easeOut' }),

    seq('dedo-a', 'bracoR', 9.7, 0.25, [ch('rotation.z', ARM_UP_Z, ARM_UP_Z + 0.12)], {
      caption: 'Jag återkommer. — Eu te dou um retorno.',
    }),
    seq('dedo-b', 'bracoR', 9.95, 0.35, [ch('rotation.z', ARM_UP_Z + 0.12, ARM_UP_Z)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 2.15, 4.75], target: [-0.08, 1.25, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-aterkommer',
    contexto:
      "Trabalho: por e-mail, telefone ou em reunião, quando você não tem a resposta na hora — 'Jag återkommer (till dig) i morgon', eu te retorno amanhã. Também ao sair de uma conversa que vai continuar depois.",
    fraseFonte: 'Eu te dou um retorno.',
    fraseAlvo: 'Jag återkommer.',
    pronuncia:
      "iá ÔÔ-ter-kom-mer ('återkommer' é palavra composta: a força principal cai no Å, que é um Ô FECHADO e LONGO de 'avô'; o -ter é fraquinho; o 'kom' leva uma segunda força, com O ABERTO e curto e o M demorado; R brando no fim)",
    ponteSonora:
      "IÁ... ÔÔ-TER, CÓ-MER! (5 sílabas: iá-ÔÔ-ter-kóm-mer; força principal no ÔÔ e uma segunda no CÓ; é a fala de Tarzan do centauro com fome — 'eu... ôôô-ter... comer!' —, e o TER vem GRUDADO no ÔÔ, sem pausa: ÔÔ-ter é UMA palavra, 'åter'; IÁ = 'jag', I de IOGA, nunca J chiado; ÔÔ = o 'ÔÔÔ!' de segurar cavalo — a freada que faz a metade de baixo dar MEIA-VOLTA, e 'åter' quer dizer justamente 'de volta': Ô FECHADO de 'avô' e LONGO, nunca o Ó aberto de 'ó'; TER = o verbo 'ter', FRACO e colado no Ô — Ô-ter, nunca 'ô-TÊR' com força (em português o R final puxa o acento; aqui não) —, com R BRANDO de um toque só que já encosta no C, nunca o 'teh' carioca; CÓ-MER é o MESMO 'comer' de 'Jag kommer från Brasilien' e 'Jag kommer om fem minuter': força no CÓ, Ó ABERTO, M demorado e -mer fraquinho com R brando, nunca 'co-MÊR'; ATENÇÃO ao par: o sumô de 'Jag kommer om fem minuter' também grita 'IÁ, CÓ-MER!' — mas ele VEM; o centauro FREIA no ÔÔ e VOLTA: sem o ÔÔ-ter sobra 'jag kommer' (já vou), não 'eu te dou retorno')",
    historia:
      "Reunião às 11h29: o cliente pergunta o preço, e o CENTAURO, gerente de contas, não tem a resposta. O relógio vira 11h30 — hora do almoço sueco — e as quatro patas disparam sozinhas a galope rumo ao refeitório, com o embornal de aveia balançando no braço. Na porta, a metade de cima puxa o freio na metade de baixo — 'ÔÔÔ!' —, os cascos derrapam soltando faísca e ele vira o tronco pra trás, de dedo erguido, falando aos pedaços de tanta fome, feito Tarzan: 'IÁ... ÔÔ-TER, CÓ-MER!' — eu... ôôô-ter... comer! Ele come, dá meia-volta e traz a resposta: eu te dou um retorno.",
  },
  createScene,
  refine: { organic: ['cavalo', 'rabo'] },
}

export default card
