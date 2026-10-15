import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag är klar." — no ensaio geral da Filarmônica, o MAESTRO rege uma
 * tigela gigante de CLARAS com um batedor no lugar da batuta. Picos duros?
 * Teste da avó: vira a tigela de boca pra baixo em cima da própria cabeça e
 * não cai NADA — nem o -A. Ergue o batedor no acorde final: IÁ! É CLÁR!
 *
 * Diorama: tablado escuro do palco, concha acústica de ripas mel ao fundo,
 * pódio com corrimão de latão e KLAR na frente, estante com a partitura à
 * esquerda, cascas de ovo aos pés. O maestro de fraque, cabeleira branca
 * desgrenhada, com a tigela de inox virada sobre a cabeça e as claras em
 * neve penduradas em picos, sem cair.
 *
 * Paleta: madeiras quentes e preto do fraque, tudo fosco e contido. O ponto
 * mais claro e brilhante da imagem é reservado às CLARAS (branco puro,
 * lustroso) e ao inox polido que as segura.
 */

const STAGE = '#33241a'
const STAGE_LINE = '#22170f'
const SHELL = '#a2723f'
const SHELL_LIGHT = '#b0804b'
const SHELL_DARK = '#6b4627'
const WALNUT = '#4a3122'
const BRASS = '#c9a14e'
const TAILS = '#1c1c22'
const SATIN = '#2c2c36'
const SHIRT = '#f1eee6'
const SKIN = '#ebc4a0'
const HAIR = '#b3b1ac'
const STEEL = '#d5dbe1'
const MERINGUE = '#ffffff'
const SHELL_EGG = '#efe5d2'
const PAPER = '#f3efe4'
const INK = '#26232a'

const GY = 0.18 // topo do tablado
const PH = 0.22 // altura do pódio
const PW = 1.15 // largura do pódio
const PD = 1.0 // profundidade do pódio
const MS = 1.1 // escala do maestro
const ARM_K = 1.36 // braços esticados (desenho animado) para alcançar acima da cabeça

// tigela (coordenadas locais do maestro)
const BOWL_TILT = 0.08 // boca virada um pouco para a câmera
const BOWL_HOLD: [number, number, number] = [-0.17, 0.3, 0.68] // na mão, boca pra cima
const BOWL_TOP: [number, number, number] = [-0.05, 1.84, 0.08] // virada sobre a cabeça
const BOWL_FLIP = Math.PI - BOWL_TILT

// braços (pivô no ombro): [rotation.x, rotation.z]
const L_HOLD: [number, number] = [-1.345, -0.467]
const L_UP: [number, number] = [-2.9, -0.25]
const R_READY: [number, number] = [-1.95, 0.36]
const R_CHORD: [number, number] = [0.25, 2.4]

/** Estica o braço já pivotado no ombro, sem deformar os filhos (mão, adereços). */
function stretchArm(arm: THREE.Object3D, k: number) {
  const m = arm as THREE.Mesh
  m.geometry = m.geometry.clone().scale(1, k, 1)
  for (const c of m.children) c.position.y *= k
}

/** Traço de letra: caixinha de latão em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, BRASS, { roughness: 0.3, metalness: 0.75 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** K L A R — letras de traço grosso, ~0.13 de altura. */
function letter(which: 'K' | 'L' | 'A' | 'R') {
  const g = new THREE.Group()
  const t = 0.026
  if (which === 'K') {
    g.add(stroke(t, 0.13, -0.032, 0))
    g.add(stroke(t, 0.09, 0.008, 0.032, -0.72))
    g.add(stroke(t, 0.09, 0.008, -0.032, 0.72))
  } else if (which === 'L') {
    g.add(stroke(t, 0.13, -0.026, 0))
    g.add(stroke(0.074, t, 0.0, -0.052))
  } else if (which === 'A') {
    g.add(stroke(t, 0.138, -0.022, 0, -0.32))
    g.add(stroke(t, 0.138, 0.022, 0, 0.32))
    g.add(stroke(0.05, 0.02, 0, -0.022))
  } else {
    g.add(stroke(t, 0.13, -0.034, 0))
    g.add(stroke(0.058, t, -0.008, 0.052))
    g.add(stroke(0.058, t, -0.008, 0.004))
    g.add(stroke(t, 0.048, 0.024, 0.028))
    g.add(stroke(t, 0.074, 0.02, -0.036, 0.5))
  }
  return g
}

/** Meia casca de ovo quebrada: copinho torneado com dentes no rebordo. */
function eggShell(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const cup = lathe(
    [
      [0, 0], [0.04, 0.004], [0.068, 0.022], [0.086, 0.055], [0.094, 0.095], [0.095, 0.12],
      [0.088, 0.12], [0.087, 0.095], [0.079, 0.058], [0.062, 0.028], [0.036, 0.012], [0, 0.009],
    ],
    SHELL_EGG,
    { roughness: 0.5 },
  )
  g.add(cup)
  const n = 11
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.25
    const h = 0.018 + rand() * 0.04
    const tooth = cone(0.017, h, SHELL_EGG, { roughness: 0.5 }, 4)
    tooth.position.set(Math.cos(a) * 0.091, 0.12 + h / 2 - 0.003, Math.sin(a) * 0.091)
    tooth.rotation.y = -a
    tooth.scale.z = 0.3
    g.add(tooth)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- palco: tablado de madeira escura -------------------------------------
  const palco = new THREE.Group()
  const plinth = cylinder(2.62, 2.72, 0.12, '#24180f', { roughness: 0.9 })
  plinth.position.y = 0.06
  palco.add(plinth)
  const floor = cylinder(2.55, 2.62, 0.07, STAGE, { roughness: 0.7 })
  floor.position.y = 0.145
  palco.add(floor)
  for (const x of [-2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1]) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - x * x, 0.01))
    const line = rbox(0.035, 0.02, len, 0.008, STAGE_LINE, { roughness: 0.9 })
    line.position.set(x, GY + 0.002, 0)
    palco.add(line)
  }
  // fita de marcação de palco e uma cadeira vazia da orquestra
  const tape = rbox(0.5, 0.012, 0.06, 0.005, '#d9cfa8', { roughness: 0.8 })
  tape.position.set(1.35, GY + 0.006, 1.25)
  tape.rotation.y = 0.5
  palco.add(tape)
  const chair = new THREE.Group()
  chair.position.set(1.75, GY, -0.55)
  chair.rotation.y = -0.6 + rand() * 0.2
  const seat = rbox(0.42, 0.05, 0.4, 0.02, '#26262b', { roughness: 0.6 })
  seat.position.y = 0.46
  chair.add(seat)
  const back = rbox(0.42, 0.36, 0.04, 0.02, '#26262b', { roughness: 0.6 })
  back.position.set(0, 0.68, -0.19)
  back.rotation.x = -0.1
  chair.add(back)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = cylinder(0.018, 0.018, 0.46, '#3a3a40', { roughness: 0.4, metalness: 0.6 })
      leg.position.set(sx * 0.18, 0.23, sz * 0.17)
      chair.add(leg)
    }
  }
  palco.add(chair)
  root.add(palco)

  // ---- concha acústica: ripas mel em arco -----------------------------------
  const concha = new THREE.Group()
  const ARC_R = 2.15
  const N = 15
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1) - 0.5 // -0.5..0.5
    const a = u * 2.7 // ±77°
    const h = 2.75 - 1.0 * (u * 2) ** 2
    const slat = rbox(0.4, h, 0.08, 0.03, i % 2 ? SHELL : SHELL_LIGHT, { roughness: 0.6 })
    slat.position.set(Math.sin(a) * ARC_R, GY + h / 2, -Math.cos(a) * ARC_R + 0.15)
    slat.rotation.y = -a
    concha.add(slat)
    const cap = rbox(0.42, 0.06, 0.12, 0.02, SHELL_DARK, { roughness: 0.6 })
    cap.position.set(0, h / 2 + 0.03, 0.01)
    slat.add(cap)
    const rail = rbox(0.42, 0.05, 0.03, 0.01, SHELL_DARK, { roughness: 0.6 })
    rail.position.set(0, 0.85 - h / 2, 0.05)
    slat.add(rail)
  }
  root.add(concha)

  // ---- pódio com corrimão de latão e KLAR na frente -------------------------
  const podio = new THREE.Group()
  const block = rbox(PW, PH - 0.03, PD, 0.035, WALNUT, { roughness: 0.55 })
  block.position.y = GY + (PH - 0.03) / 2
  podio.add(block)
  const carpet = rbox(PW - 0.06, 0.035, PD - 0.06, 0.012, '#3a2226', { roughness: 0.95 })
  carpet.position.y = GY + PH - 0.0175
  podio.add(carpet)
  const RAIL_H = 0.72
  const posts: [number, number][] = [[-0.52, -0.42], [0.52, -0.42], [-0.52, 0.2], [0.52, 0.2]]
  for (const [px, pz] of posts) {
    const post = cylinder(0.022, 0.022, RAIL_H, BRASS, { roughness: 0.3, metalness: 0.8 })
    post.position.set(px, GY + PH + RAIL_H / 2, pz)
    podio.add(post)
    const knob = sphere(0.035, BRASS, { roughness: 0.3, metalness: 0.8 })
    knob.position.set(px, GY + PH + RAIL_H, pz)
    podio.add(knob)
  }
  const backBar = cylinder(0.024, 0.024, 1.04, BRASS, { roughness: 0.3, metalness: 0.8 })
  backBar.rotation.z = Math.PI / 2
  backBar.position.set(0, GY + PH + RAIL_H, -0.42)
  podio.add(backBar)
  for (const sx of [-0.52, 0.52]) {
    const sideBar = cylinder(0.024, 0.024, 0.62, BRASS, { roughness: 0.3, metalness: 0.8 })
    sideBar.rotation.x = Math.PI / 2
    sideBar.position.set(sx, GY + PH + RAIL_H, -0.11)
    podio.add(sideBar)
  }
  const word: ['K' | 'L' | 'A' | 'R', number][] = [['K', -0.2], ['L', -0.07], ['A', 0.065], ['R', 0.2]]
  for (const [glyph, lx] of word) {
    const l = letter(glyph)
    l.position.set(lx, GY + (PH - 0.03) / 2, PD / 2 + 0.012)
    podio.add(l)
  }
  root.add(podio)

  // ---- estante de partitura -------------------------------------------------
  const estante = new THREE.Group()
  estante.position.set(-1.2, GY, 0.55)
  estante.rotation.y = 0.85
  const BLACK = '#1e1e22'
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    const top = new THREE.Vector3(0, 0.2, 0)
    const footPt = new THREE.Vector3(Math.cos(a) * 0.26, 0.012, Math.sin(a) * 0.26)
    const dir = footPt.clone().sub(top)
    const leg = cylinder(0.014, 0.014, dir.length(), BLACK, { roughness: 0.4, metalness: 0.5 })
    leg.position.copy(top).add(footPt).multiplyScalar(0.5)
    leg.quaternion.setFromUnitVectors(up, dir.normalize())
    estante.add(leg)
    const tip = sphere(0.02, BLACK, { roughness: 0.6 })
    tip.position.copy(footPt)
    estante.add(tip)
  }
  const pole = cylinder(0.02, 0.02, 0.9, BLACK, { roughness: 0.4, metalness: 0.5 })
  pole.position.y = 0.64
  estante.add(pole)
  const collar = cylinder(0.03, 0.03, 0.05, BLACK, { roughness: 0.4, metalness: 0.5 })
  collar.position.y = 0.55
  estante.add(collar)
  const desk = new THREE.Group()
  desk.position.set(0, 1.08, 0.02)
  desk.rotation.x = -0.45
  estante.add(desk)
  const plate = rbox(0.66, 0.44, 0.025, 0.015, BLACK, { roughness: 0.5 })
  desk.add(plate)
  const ledge = rbox(0.66, 0.035, 0.08, 0.012, BLACK, { roughness: 0.5 })
  ledge.position.set(0, -0.22, 0.04)
  desk.add(ledge)
  for (const side of [-1, 1]) {
    const page = rbox(0.29, 0.38, 0.008, 0.004, PAPER, { roughness: 0.75 })
    page.position.set(side * 0.155, 0.0, 0.018)
    page.rotation.y = -side * 0.08
    desk.add(page)
    for (let s = 0; s < 3; s++) {
      for (let l = 0; l < 3; l++) {
        const staff = rbox(0.24, 0.006, 0.004, 0.002, INK, { roughness: 0.8 })
        staff.position.set(side * 0.155, 0.12 - s * 0.11 + l * 0.018, 0.024)
        staff.rotation.y = -side * 0.08
        desk.add(staff)
      }
      for (let k = 0; k < 4; k++) {
        const note = sphere(0.011, INK, { roughness: 0.6 })
        note.scale.set(1.3, 1, 0.4)
        note.position.set(side * 0.155 - 0.08 + k * 0.05, 0.12 - s * 0.11 + (k % 3) * 0.018, 0.027)
        desk.add(note)
      }
    }
  }
  root.add(estante)

  // ---- cascas de ovo aos pés do pódio ---------------------------------------
  const cascas = new THREE.Group()
  const shellSpots: [number, number, number, number][] = [
    [0.82, 0.78, 0, 3], [1.1, 0.5, 0, 7], [0.62, 1.0, 1.35, 11],
  ]
  for (const [sx, sz, tip, seed] of shellSpots) {
    const s = eggShell(seed)
    s.position.set(sx, GY + (tip ? 0.085 : 0), sz)
    s.rotation.set(0, rand() * Math.PI, tip)
    cascas.add(s)
  }
  root.add(cascas)

  // ---- maestro de fraque ----------------------------------------------------
  const maestro = person({ body: TAILS, skin: SKIN, height: 1.5, armAngle: 0.3 })
  maestro.position.set(0, GY + PH, 0)
  maestro.scale.setScalar(MS)
  root.add(maestro)

  // peitilho branco, lapelas de cetim, gravata-borboleta, lenço no bolso
  const shirt = sphere(0.14, SHIRT, { roughness: 0.6 })
  shirt.scale.set(0.95, 1.55, 0.35)
  shirt.position.set(0, 0.56, 0.215)
  maestro.add(shirt)
  for (const s of [-1, 1]) {
    const lapel = rbox(0.07, 0.34, 0.03, 0.012, SATIN, { roughness: 0.28 })
    lapel.position.set(s * 0.115, 0.56, 0.235)
    lapel.rotation.set(-0.12, s * 0.3, s * 0.32)
    maestro.add(lapel)
    const wing = cone(0.05, 0.09, SHIRT, { roughness: 0.5 })
    wing.position.set(s * 0.05, 0.765, 0.25)
    wing.rotation.z = s * Math.PI / 2
    wing.scale.z = 0.5
    maestro.add(wing)
    const tail = rbox(0.15, 0.55, 0.04, 0.02, TAILS, { roughness: 0.6 })
    tail.position.set(s * 0.1, 0.18, -0.25)
    tail.rotation.set(0.12, 0, s * 0.06)
    maestro.add(tail)
  }
  const knot = sphere(0.03, SHIRT, { roughness: 0.5 })
  knot.position.set(0, 0.765, 0.262)
  maestro.add(knot)
  for (const sy of [0.64, 0.56, 0.48]) {
    const stud = sphere(0.014, INK, { roughness: 0.3 })
    stud.position.set(0, sy, 0.265)
    maestro.add(stud)
  }
  const pocket = cone(0.035, 0.05, SHIRT, { roughness: 0.6 }, 3)
  pocket.position.set(-0.16, 0.6, 0.22)
  pocket.rotation.set(0, -0.4, 0)
  maestro.add(pocket)

  const head = maestro.getObjectByName('head') as THREE.Group

  // sobrancelhas brancas arqueadas, de espanto e triunfo
  for (const s of [-1, 1]) {
    const brow = capsule(0.022, 0.09, HAIR, { roughness: 0.85 })
    brow.position.set(s * 0.11, 0.15, 0.245)
    brow.rotation.set(-0.2, s * 0.3, s * (Math.PI / 2 - 0.35))
    head.add(brow)
  }
  // boca fechada (some atrás da boca aberta do grito)
  const lipLine = rbox(0.08, 0.018, 0.02, 0.008, '#8a4b3e', { roughness: 0.6 })
  lipLine.position.set(0, -0.12, 0.25)
  head.add(lipLine)

  // ---- cabeleira branca desgrenhada (laterais e nuca; o cocuruto fica livre)
  const cabeleira = new THREE.Group()
  head.add(cabeleira)
  const HAIR_MAT = { roughness: 0.9 }
  for (const s of [-1, 1]) {
    const side = puff(0.12, HAIR, 6, s > 0 ? 13 : 17, HAIR_MAT)
    side.position.set(s * 0.27, 0.02, -0.07)
    side.scale.set(1.05, 1.0, 1.3)
    cabeleira.add(side)
    const fly = puff(0.085, HAIR, 5, s > 0 ? 43 : 47, HAIR_MAT)
    fly.position.set(s * 0.41, 0.1, -0.09)
    cabeleira.add(fly)
    const low = puff(0.07, HAIR, 4, s > 0 ? 53 : 57, HAIR_MAT)
    low.position.set(s * 0.37, -0.09, -0.12)
    cabeleira.add(low)
    const back = puff(0.09, HAIR, 5, s > 0 ? 61 : 67, HAIR_MAT)
    back.position.set(s * 0.17, 0.17, -0.2)
    cabeleira.add(back)
  }
  const nape = puff(0.15, HAIR, 6, 19, HAIR_MAT)
  nape.position.set(0, 0.0, -0.21)
  nape.scale.set(1.45, 1.05, 0.85)
  cabeleira.add(nape)
  const crown = puff(0.08, HAIR, 4, 23, HAIR_MAT)
  crown.position.set(0, 0.235, -0.12)
  crown.scale.set(1.7, 0.45, 1.3)
  cabeleira.add(crown)

  // ---- boca aberta do grito -------------------------------------------------
  const boca = new THREE.Group()
  boca.position.set(0, -0.12, 0.245)
  head.add(boca)
  const cavity = sphere(0.058, '#3a1c18', { roughness: 0.7 })
  cavity.scale.set(1.0, 1.15, 0.6)
  boca.add(cavity)
  const lips = torus(0.06, 0.018, '#b5615a', { roughness: 0.55 })
  lips.scale.y = 1.15
  lips.position.z = 0.012
  boca.add(lips)
  const tongue = sphere(0.032, '#c96d6a', { roughness: 0.6 })
  tongue.scale.set(1.2, 0.6, 0.6)
  tongue.position.set(0, -0.035, 0.012)
  boca.add(tongue)

  // ---- braços: pivô no ombro, esticados ------------------------------------
  const bracoL = maestro.getObjectByName('armL') as THREE.Mesh
  const bracoR = maestro.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoL, 1.5)
  shoulderPivot(bracoR, 1.5)
  stretchArm(bracoL, ARM_K)
  stretchArm(bracoR, ARM_K)
  bracoL.rotation.set(L_UP[0], 0, L_UP[1])
  bracoR.rotation.set(R_CHORD[0], 0, R_CHORD[1])
  // punhos brancos da camisa saindo da manga
  for (const arm of [bracoL, bracoR]) {
    const hand = arm.children[0]
    const cuff = cylinder(0.098, 0.092, 0.06, SHIRT, { roughness: 0.6 })
    cuff.position.y = hand.position.y + 0.075
    arm.add(cuff)
  }

  // ---- batedor de arame (a batuta) -----------------------------------------
  const handY = bracoR.children[0].position.y
  const batedor = new THREE.Group()
  batedor.position.y = handY
  bracoR.add(batedor)
  const whisk = new THREE.Group()
  whisk.scale.setScalar(1.3)
  batedor.add(whisk)
  const METAL = { roughness: 0.18, metalness: 0.9 }
  const grip = cylinder(0.032, 0.026, 0.24, '#2a2a30', { roughness: 0.4 })
  grip.position.y = -0.06
  whisk.add(grip)
  const ferrule = cylinder(0.03, 0.03, 0.05, STEEL, METAL)
  ferrule.position.y = -0.2
  whisk.add(ferrule)
  const hangRing = torus(0.03, 0.007, STEEL, METAL)
  hangRing.position.y = 0.08
  whisk.add(hangRing)
  for (let i = 0; i < 4; i++) {
    const loop = torus(0.1, 0.011, STEEL, METAL)
    loop.scale.set(1, 1.9, 1)
    loop.position.y = -0.22 - 0.19
    loop.rotation.y = (i * Math.PI) / 4
    whisk.add(loop)
  }
  // um floco de clara grudado no arame
  const fleck = puff(0.035, MERINGUE, 3, 29, { roughness: 0.3 })
  fleck.position.set(0.03, -0.5, 0.03)
  whisk.add(fleck)

  // ---- tigela de inox -------------------------------------------------------
  const tigela = new THREE.Group()
  tigela.position.set(...BOWL_TOP)
  tigela.rotation.x = BOWL_FLIP
  maestro.add(tigela)
  const bowl = lathe(
    [
      [0, 0], [0.13, 0], [0.14, 0.018], [0.2, 0.03], [0.28, 0.07], [0.34, 0.13],
      [0.385, 0.2], [0.41, 0.27], [0.42, 0.305], [0.44, 0.318], [0.437, 0.335],
      [0.415, 0.33], [0.4, 0.3], [0.385, 0.24], [0.345, 0.17], [0.28, 0.11],
      [0.18, 0.06], [0, 0.045],
    ],
    STEEL,
    { roughness: 0.16, metalness: 0.92 },
    56,
  )
  tigela.add(bowl)
  const foot = torus(0.135, 0.012, STEEL, { roughness: 0.16, metalness: 0.92 })
  foot.rotation.x = Math.PI / 2
  foot.position.y = 0.006
  tigela.add(foot)

  // ---- claras em neve (boca pra cima no local da tigela; viram junto) -------
  const claras = new THREE.Group()
  tigela.add(claras)
  const MER = { roughness: 0.28 }
  const fill = sphere(0.395, MERINGUE, MER)
  fill.scale.set(1, 0.4, 1)
  fill.position.y = 0.27
  claras.add(fill)
  // espuma: bolhas grandes sobrepostas transbordando o rebordo
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.25
    const r = 0.25 + rand() * 0.05
    const lump = sphere(0.11 + rand() * 0.03, MERINGUE, MER)
    lump.position.set(Math.cos(a) * r, 0.34 + rand() * 0.03, Math.sin(a) * r)
    lump.scale.y = 0.8
    claras.add(lump)
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4
    const lump = sphere(0.11 + rand() * 0.02, MERINGUE, MER)
    lump.position.set(Math.cos(a) * 0.11, 0.37, Math.sin(a) * 0.11)
    lump.scale.y = 0.75
    claras.add(lump)
  }
  // picos duros em forma de suspiro (base larga, lados côncavos, ponta fina):
  // anel externo longo, que pendura ao lado da cabeça; miolo curto, por cima
  const kiss = (h: number, r: number) =>
    lathe(
      [
        [0, 0], [r, 0], [r * 1.02, h * 0.12], [r * 0.85, h * 0.28], [r * 0.58, h * 0.46],
        [r * 0.34, h * 0.64], [r * 0.17, h * 0.82], [r * 0.06, h * 0.96], [0, h],
      ],
      MERINGUE,
      MER,
      24,
    )
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3
    const front = Math.max(0, Math.sin(a)) // +z local vira frente/baixo na tigela virada
    const h = 0.22 + rand() * 0.05 - front * 0.08
    const peak = kiss(h, 0.11)
    peak.position.set(Math.cos(a) * 0.27, 0.36, Math.sin(a) * 0.27)
    peak.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45)
    claras.add(peak)
  }
  for (const [px, pz, h] of [[0.07, 0.06, 0.1], [-0.09, -0.05, 0.11], [0.03, -0.12, 0.09]] as const) {
    const peak = kiss(h, 0.075)
    peak.position.set(px, 0.43, pz)
    peak.rotation.set(pz * 2, 0, -px * 2)
    claras.add(peak)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'palco', group: 'palco', object: palco },
    { name: 'concha', group: 'palco', object: concha },
    { name: 'podio', group: 'podio', object: podio },
    { name: 'estante', group: 'podio', object: estante },
    { name: 'maestro', group: 'maestro', object: maestro },
    { name: 'cabeleira', group: 'maestro', object: cabeleira },
    { name: 'bracoL', group: 'maestro', object: bracoL },
    { name: 'bracoR', group: 'maestro', object: bracoR },
    { name: 'tigela', group: 'tigela', object: tigela },
    { name: 'batedor', group: 'tigela', object: batedor },
    { name: 'cascas', group: 'tigela', object: cascas },
    { name: 'claras', group: 'claras', object: claras },
    { name: 'boca', group: 'grito', object: boca },
  ]

  // ---- montagem ------------------------------------------------------------
  const MY = GY + PH
  const S3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const armTo = (part: string, name: string, at: number, dur: number, a: [number, number], b: [number, number], ease: 'easeOut' | 'easeInOut' | 'easeIn' = 'easeInOut') =>
    seq(name, part, at, dur, [ch('rotation.x', a[0], b[0]), ch('rotation.z', a[1], b[1])], { ease })

  const R_UP: [number, number] = [-2.35, 0.5]
  const R_DN: [number, number] = [-1.5, 0.2]

  const build = [
    seq('palco-rise', 'palco', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Ensaio geral da Filarmônica de Estocolmo: brota o palco e a concha acústica…',
    }),
    seq('concha-rise', 'concha', 0.25, 1.0, [riseFrom(0, 3.0)], { ease: 'easeOut' }),

    seq('podio-rise', 'podio', 1.4, 0.7, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: '…o pódio do maestro, de corrimão dourado, e a estante com a partitura.',
    }),
    seq('estante-rise', 'estante', 1.6, 0.7, [riseFrom(GY, 1.5)], { ease: 'easeOut' }),

    seq('maestro-rise', 'maestro', 2.6, 0.9, [riseFrom(MY, 2.2)], {
      ease: 'easeOut',
      caption: 'Sobe o MAESTRO de fraque, a cabeleira branca voando…',
    }),
    armTo('bracoL', 'bracoL-hold', 2.6, 0.01, L_HOLD, L_HOLD),
    armTo('bracoR', 'bracoR-ready', 2.6, 0.01, R_READY, R_READY),
    seq('cabeleira-puff', 'cabeleira', 3.2, 0.6, S3(0.4, 1), { ease: 'easeOut' }),

    seq('tigela-surge', 'tigela', 3.9, 0.6, [
      ch('position.x', BOWL_HOLD[0], BOWL_HOLD[0]),
      ch('position.y', BOWL_HOLD[1], BOWL_HOLD[1]),
      ch('position.z', BOWL_HOLD[2], BOWL_HOLD[2]),
      ch('rotation.x', 0, 0),
      ...S3(0.01, 1),
    ], {
      ease: 'easeOut',
      caption: '…mas ele não rege a orquestra: rege uma tigela gigante de CLARAS, com um batedor no lugar da batuta!',
    }),
    seq('batedor-surge', 'batedor', 4.0, 0.5, S3(0.01, 1), { ease: 'easeOut' }),
    seq('cascas-pop', 'cascas', 4.1, 0.5, S3(0.01, 1), { ease: 'easeOut' }),

    // prestíssimo: o batedor rege e as claras crescem em picos
    seq('claras-sobem', 'claras', 4.7, 1.9, S3(0.25, 1), {
      ease: 'easeOut',
      caption: 'Em prestíssimo! As claras sobem, sobem… até virar picos duros.',
    }),
    armTo('bracoR', 'rege-1', 4.7, 0.25, R_READY, R_UP),
    armTo('bracoR', 'rege-2', 4.95, 0.25, R_UP, R_DN),
    armTo('bracoR', 'rege-3', 5.2, 0.25, R_DN, R_UP),
    armTo('bracoR', 'rege-4', 5.45, 0.25, R_UP, R_DN),
    armTo('bracoR', 'rege-5', 5.7, 0.25, R_DN, R_UP),
    armTo('bracoR', 'rege-6', 5.95, 0.25, R_UP, R_DN),
    armTo('bracoR', 'rege-7', 6.2, 0.3, R_DN, R_READY),

    // o teste da avó: vira a tigela de boca pra baixo sobre a cabeça
    seq('vira-y', 'tigela', 6.8, 1.0, [ch('position.y', BOWL_HOLD[1], BOWL_TOP[1])], {
      ease: 'easeOut',
      caption: 'O teste da avó: ele vira a tigela de boca pra baixo em cima da própria cabeça…',
    }),
    seq('vira-xz', 'tigela', 6.8, 1.0, [
      ch('position.x', BOWL_HOLD[0], BOWL_TOP[0]),
      ch('position.z', BOWL_HOLD[2], BOWL_TOP[2]),
      ch('rotation.x', 0, BOWL_FLIP),
    ], { ease: 'easeInOut' }),
    armTo('bracoL', 'bracoL-ergue', 6.8, 1.0, L_HOLD, L_UP),

    seq('tigela-sacode-a', 'tigela', 8.0, 0.25, [ch('rotation.z', 0, 0.12)], {
      ease: 'easeOut',
      caption: 'Não cai NADA — nem uma gota, nem o -A!',
    }),
    seq('tigela-sacode-b', 'tigela', 8.25, 0.3, [ch('rotation.z', 0.12, -0.1)]),
    seq('tigela-sacode-c', 'tigela', 8.55, 0.3, [ch('rotation.z', -0.1, 0)], { ease: 'easeOut' }),

    armTo('bracoR', 'acorde', 9.2, 0.5, R_READY, R_CHORD, 'easeOut'),
    seq('boca-grita', 'boca', 9.3, 0.35, S3(0.2, 1), {
      ease: 'easeOut',
      caption: 'Ele ergue o batedor no acorde final e berra pros músicos: IÁ! É CLÁR!',
    }),
    seq('cabeleira-voa', 'cabeleira', 9.3, 0.3, S3(1, 1.12), { ease: 'easeOut' }),
    seq('cabeleira-assenta', 'cabeleira', 9.6, 0.5, S3(1.12, 1)),

    seq('maestro-pula', 'maestro', 10.3, 0.2, [ch('position.y', MY, MY + 0.05)], {
      ease: 'easeOut',
      caption: 'Jag är klar. — Terminei. / Estou pronto.',
    }),
    seq('maestro-assenta', 'maestro', 10.5, 0.35, [ch('position.y', MY + 0.05, MY)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 2.05, 4.6], target: [0.0, 1.28, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-klar',
    contexto:
      "Trabalho e dia a dia: ao entregar uma tarefa ('Är du klar?' — 'Ja, jag är klar'), no caixa quando terminou de passar as compras, no vestiário, no médico — sempre que alguém está esperando você terminar.",
    fraseFonte: 'Terminei. / Estou pronto.',
    fraseAlvo: 'Jag är klar.',
    pronuncia:
      "iá é KLÁÁR ('jag' = iá, o -g não soa; 'är' na fala é só É aberto e curto; 'klar' com A LONGO e o R do fim brando, de 'caro', mas audível — sem ele sobra 'kla'; com um -a no fim vira 'klara', outro verbo)",
    ponteSonora:
      "IÁ! É CLÁR(a)! (3 sílabas: iá-é-KLÁÁR; tônica forte no CLÁ; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado; É = 'är', aberto e curto, o mesmo de 'Jag är sjuk', 'Jag är trött' e 'Jag är hungrig'; CLÁR = a CLARA em neve SEM o -A — da tigela virada não cai nada, nem o -A: A LONGO e de boca bem aberta (CLÁÁ), e o R do fim BRANDO, um toque de língua como em 'caro', nunca o RR raspado carioca — mas AUDÍVEL: sem ele sobra 'kla'; com o -A de volta vira 'klara' (dar conta), que é a CLARA INTEIRA de 'Kan du förklara?'; é o mesmo CLAR do CLÁR-T da piranha de 'Självklart!': 'klar' quer dizer pronto E claro)",
    historia:
      "No ensaio geral da Filarmônica de Estocolmo, o MAESTRO não rege a orquestra: rege uma tigela gigante de CLARAS, com um batedor de arame no lugar da batuta, em prestíssimo, a cabeleira branca voando. Quando as claras sobem em picos duros, ele faz o teste que toda avó conhece: vira a tigela de boca pra baixo em cima da própria cabeça. Não cai NADA — nem uma gota, nem o -A. Ele ergue o batedor como no acorde final e berra pros músicos: 'IÁ! É CLAR!' — terminei, está pronto.",
  },
  createScene,
  refine: { organic: ['claras'] },
}

export default card
