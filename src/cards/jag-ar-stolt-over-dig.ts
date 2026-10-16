import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'

/**
 * "Jag är stolt över dig." — IÁ É (pi)STÓL-T... ÖVER... DÊI!
 *
 * Formatura do ABC na escolinha. O filhote de leopardo pega o diploma; na
 * plateia, a mãe leopardo — a mais OVER do auditório — dispara a PISTOLA de
 * confete (STÓL-T!), salta pro palco e ergue o filhote OVER a própria cabeça,
 * rugindo de orgulho no meio da chuva de confete.
 *
 * Diorama: tablado de madeira mel, fundo azul-petróleo, cortinas de veludo
 * vermelho nas laterais, faixa amarela ABC no fundo; a mãe em pé no centro,
 * braço direito esticado pro alto com o filhote na pata, a pistola dourada
 * (acento reservado) na pata esquerda apontando pro céu.
 */

const WOOD = '#b07c45'
const WOOD_SEAM = '#86592f'
const APRON = '#5b3b22'
const BACKDROP = '#3d6a73'
const BACKDROP_FOLD = '#355d66'
const VELVET = '#9e2030'
const VELVET_DARK = '#7f1825'
const BRASS = '#c9a14a'
const BANNER = '#f0cf62'
const NAVY = '#23356c'
const LEO = '#e2a547'
const CREAM = '#f6ead0'
const SPOT = '#2b1d14'
const SPOT_IN = '#b97a2a'
const NOSE = '#9a5a4c'
const MOUTH = '#4a1620'
const TONGUE = '#e07f8a'
const EYE = '#7cc04a'
const CAP = '#1d1d24'
const TASSEL = '#f2c23a'
const PAPER = '#f4ecd8'
const RIBBON = '#d0303a'
const GOLD = '#ffb81c' // acento saturado RESERVADO: a PISTOLA de confete (STÓL-T)
const CONFETTI = ['#e04848', '#3f7fe0', '#f5c63a', '#48b86a', '#f07ab0']

const SY = 0.3 // topo do tablado
const MX = 0.05 // mãe leopardo
const MZ = -0.1
const SHOULDER_R: [number, number, number] = [-0.37, 1.6, 0.02]
const ARM_UP = 0.06 // braço direito: pose final, esticado pro alto
const ARM_DOWN = 2.9 // braço caído ao lado do corpo (antes de erguer)
const PAW_REACH = 0.91 // do ombro ao topo da pata
// filhote: em pé no palco (antes) e sentado na pata erguida (pose final)
const CUB_FLOOR: [number, number, number] = [MX - 0.98, SY, MZ + 0.3]
const CUB_UP: [number, number, number] = [
  MX + SHOULDER_R[0] - PAW_REACH * Math.sin(ARM_UP),
  SY + SHOULDER_R[1] + PAW_REACH * Math.cos(ARM_UP) - 0.03,
  MZ + SHOULDER_R[2],
]
// pistola na pata esquerda; boca do cano (de onde explode o confete)
const PAW_L: [number, number, number] = [0.9, 2.08, 0.2]
const PISTOL_ROT = 1.0
const PISTOL_S = 1.5
const MUZZLE = new THREE.Vector3(
  MX + PAW_L[0] + PISTOL_S * (0.42 * Math.cos(PISTOL_ROT) - 0.1 * Math.sin(PISTOL_ROT)),
  SY + PAW_L[1] + PISTOL_S * (0.42 * Math.sin(PISTOL_ROT) + 0.1 * Math.cos(PISTOL_ROT)),
  MZ + PAW_L[2],
)
const HEAD_UP = -0.16 // cabeça erguida no rugido (pose final)

type V3 = [number, number, number]
const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)

/** Cápsula de a até b (membros, pescoço, mangas). */
function limb(a: V3, b: V3, r: number, color: string, rough = 0.85) {
  const A = new THREE.Vector3(...a)
  const B = new THREE.Vector3(...b)
  const d = B.clone().sub(A)
  const m = capsule(r, d.length(), color, { roughness: rough })
  m.position.copy(A).add(B).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(Y, d.normalize())
  return m
}

/** Roseta de leopardo: anel escuro com miolo caramelo, colado na pele. */
function rosette(parent: THREE.Object3D, p: THREE.Vector3, n: THREE.Vector3, s = 1) {
  const q = new THREE.Quaternion().setFromUnitVectors(Z, n)
  const ring = torus(0.03 * s, 0.011 * s, SPOT, { roughness: 0.85 })
  ring.position.copy(p).addScaledVector(n, 0.012 * s)
  ring.quaternion.copy(q)
  ring.scale.z = 0.7
  const mid = sphere(0.021 * s, SPOT_IN, { roughness: 0.85 })
  mid.position.copy(p).addScaledVector(n, 0.006 * s)
  mid.quaternion.copy(q)
  mid.scale.z = 0.4
  parent.add(ring, mid)
}

/** Rosetas espalhadas na superfície de uma cápsula de a até b. */
function spotsOnLimb(
  parent: THREE.Object3D, a: V3, b: V3, r: number, count: number, seed: number,
  s = 1, skip?: (n: THREE.Vector3) => boolean,
) {
  const rand = rng(seed)
  const A = new THREE.Vector3(...a)
  const axis = new THREE.Vector3(...b).sub(A)
  const dir = axis.clone().normalize()
  const u = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) < 0.9 ? Y : Z).normalize()
  const v = new THREE.Vector3().crossVectors(dir, u).normalize()
  let placed = 0
  for (let tries = 0; placed < count && tries < count * 8; tries++) {
    const t = 0.08 + rand() * 0.84
    const ang = rand() * Math.PI * 2
    const n = u.clone().multiplyScalar(Math.cos(ang)).addScaledVector(v, Math.sin(ang))
    if (skip?.(n)) continue
    const p = A.clone().addScaledVector(axis, t).addScaledVector(n, r)
    rosette(parent, p, n, s * (0.8 + rand() * 0.4))
    placed++
  }
}

/** Traço de letra da faixa: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, yy: number, rot = 0) {
  const s = rbox(w, h, 0.035, 0.012, NAVY, { roughness: 0.6 })
  s.position.set(x, yy, 0)
  s.rotation.z = rot
  return s
}

/** A B C — traço grosso, legível do fundo do palco. */
function letter(which: 'A' | 'B' | 'C') {
  const g = new THREE.Group()
  const t = 0.06
  if (which === 'A') {
    g.add(stroke(t, 0.35, -0.054, 0, -0.32))
    g.add(stroke(t, 0.35, 0.054, 0, 0.32))
    g.add(stroke(0.13, 0.05, 0, -0.05))
  } else if (which === 'B') {
    g.add(stroke(t, 0.33, -0.08, 0))
    g.add(stroke(0.15, t, -0.02, 0.135))
    g.add(stroke(0.15, t, -0.02, 0.0))
    g.add(stroke(0.17, t, -0.01, -0.135))
    g.add(stroke(t, 0.13, 0.06, 0.07))
    g.add(stroke(t, 0.15, 0.075, -0.07))
  } else {
    g.add(stroke(t, 0.33, -0.075, 0))
    g.add(stroke(0.19, t, 0.01, 0.135))
    g.add(stroke(0.19, t, 0.01, -0.135))
    g.add(stroke(t, 0.08, 0.085, 0.095))
    g.add(stroke(t, 0.08, 0.085, -0.095))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- palco: tablado de madeira, frente escura, ribalta -------------------
  const palco = new THREE.Group()
  const tablado = rbox(8.2, SY, 3.1, 0.05, WOOD, { roughness: 0.6 })
  tablado.position.set(0, SY / 2, -0.12)
  palco.add(tablado)
  for (let i = 0; i < 9; i++) {
    const junta = rbox(8.1, 0.008, 0.014, 0.004, WOOD_SEAM, { roughness: 0.7 })
    junta.position.set(0, SY + 0.002, -1.55 + i * 0.34)
    palco.add(junta)
  }
  const frente = rbox(8.26, 0.2, 0.06, 0.02, APRON, { roughness: 0.7 })
  frente.position.set(0, 0.12, 1.43)
  palco.add(frente)
  for (const fx of [-2.0, -1.0, 0, 1.0, 2.0]) {
    const concha = lathe(
      [[0, 0], [0.09, 0], [0.1, 0.025], [0.08, 0.05], [0.0, 0.055]],
      '#3a3632',
      { roughness: 0.4, metalness: 0.5 },
    )
    concha.position.set(fx, SY, 1.3)
    palco.add(concha)
    const luz = sphere(0.04, '#fff1c4', { emissive: '#ffe08a', emissiveIntensity: 1.4 })
    luz.position.set(fx, SY + 0.05, 1.36)
    palco.add(luz)
  }
  root.add(palco)

  // ---- cortinas de veludo vermelho + fundo azul-petróleo -------------------
  const cortinas = new THREE.Group()
  const fundo = rbox(7.6, 4.8, 0.08, 0.03, BACKDROP, { roughness: 0.9 })
  fundo.position.set(0, SY + 2.4, -1.55)
  cortinas.add(fundo)
  for (let i = -9; i <= 9; i++) {
    const dobra = rbox(0.12, 4.75, 0.04, 0.02, BACKDROP_FOLD, { roughness: 0.92 })
    dobra.position.set(i * 0.4, SY + 2.4, -1.5)
    cortinas.add(dobra)
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 11; i++) {
      const prega = cylinder(0.13, 0.15, 4.4, i % 2 ? VELVET_DARK : VELVET, { roughness: 0.92 }, 20)
      prega.position.set(side * (2.22 + i * 0.17), SY + 2.2, 0.72 + (i % 2) * 0.07)
      cortinas.add(prega)
    }
  }
  const sanefa = rbox(8.2, 0.5, 0.3, 0.08, VELVET, { roughness: 0.92 })
  sanefa.position.set(0, SY + 4.35, 0.8)
  cortinas.add(sanefa)
  for (let i = -7; i <= 7; i++) {
    const festao = sphere(0.3, i % 2 ? VELVET_DARK : VELVET, { roughness: 0.92 })
    festao.scale.set(1.0, 0.5, 0.45)
    festao.position.set(i * 0.56, SY + 4.08, 0.86)
    cortinas.add(festao)
  }
  root.add(cortinas)

  // ---- faixa amarela "ABC" no fundo ----------------------------------------
  const faixa = new THREE.Group()
  faixa.position.set(1.0, SY + 2.85, -1.42)
  const lona = rbox(1.45, 0.52, 0.04, 0.03, BANNER, { roughness: 0.75 })
  faixa.add(lona)
  for (const bx of [-0.62, 0.62]) {
    const ilhos = torus(0.025, 0.008, BRASS, { roughness: 0.4, metalness: 0.6 })
    ilhos.position.set(bx, 0.19, 0.025)
    faixa.add(ilhos)
    const corda = cylinder(0.008, 0.008, 1.1, '#7d6640', { roughness: 0.9 }, 8)
    corda.position.set(bx, 0.75, -0.02)
    faixa.add(corda)
  }
  const letras: ['A' | 'B' | 'C', number][] = [['A', -0.34], ['B', 0.0], ['C', 0.34]]
  for (const [glyph, lx] of letras) {
    const l = letter(glyph)
    l.position.set(lx, -0.01, 0.035)
    faixa.add(l)
  }
  root.add(faixa)

  // ---- MÃE LEOPARDO: em pé nas patas traseiras, peito estufado -------------
  const mae = new THREE.Group()
  mae.position.set(MX, SY, MZ)
  root.add(mae)

  // Rosetas e dedinhos numa sub-peça própria, fora da pele refinada: centenas
  // de detalhes nítidos inchariam o .glb (vão procedurais, mesma aparência).
  const pelagem = new THREE.Group()
  mae.add(pelagem)

  const pelo = { roughness: 0.85 }
  for (const side of [-1, 1]) {
    const pe = sphere(0.15, LEO, pelo)
    pe.scale.set(0.85, 0.5, 1.35)
    pe.position.set(side * 0.23, 0.07, 0.1)
    mae.add(pe)
    for (let d = -1; d <= 1; d++) {
      const dedo = sphere(0.045, LEO, pelo)
      dedo.position.set(side * 0.23 + d * 0.055, 0.045, 0.28)
      pelagem.add(dedo)
    }
    const canela: [V3, V3] = [[side * 0.23, 0.12, 0.02], [side * 0.24, 0.5, -0.05]]
    mae.add(limb(canela[0], canela[1], 0.105, LEO))
    const coxa: [V3, V3] = [[side * 0.24, 0.5, -0.05], [side * 0.2, 0.86, 0.03]]
    mae.add(limb(coxa[0], coxa[1], 0.16, LEO))
    spotsOnLimb(pelagem, canela[0], canela[1], 0.105, 5, 10 + side, 0.85)
    spotsOnLimb(pelagem, coxa[0], coxa[1], 0.16, 9, 20 + side, 1.1)
  }

  const quadril = sphere(0.36, LEO, pelo)
  quadril.scale.set(1.05, 0.85, 0.9)
  quadril.position.set(0, 0.92, -0.02)
  mae.add(quadril)

  const tronco: [V3, V3] = [[0, 0.95, 0], [0, 1.6, 0]]
  mae.add(limb(tronco[0], tronco[1], 0.33, LEO))
  spotsOnLimb(pelagem, tronco[0], tronco[1], 0.33, 30, 31, 1.3, (n) => n.z > 0.62)

  const barriga = sphere(0.27, CREAM, pelo)
  barriga.scale.set(1, 1.15, 0.75)
  barriga.position.set(0, 1.05, 0.16)
  mae.add(barriga)

  // peito estufado de orgulho
  const peito = sphere(0.31, CREAM, pelo)
  peito.scale.set(1.05, 1, 0.85)
  peito.position.set(0, 1.45, 0.17)
  mae.add(peito)

  for (const side of [-1, 1]) {
    const ombro = sphere(0.17, LEO, pelo)
    ombro.position.set(side * 0.34, 1.6, 0.0)
    mae.add(ombro)
  }
  // rosetas no quadril e nos ombros (lados visíveis da câmera)
  const rq = rng(77)
  for (let k = 0; k < 14; k++) {
    const a = (rq() - 0.5) * Math.PI * 1.5
    const b = (rq() - 0.5) * 1.2
    const dir = new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b))
    if (Math.abs(dir.x) < 0.55 && dir.z > 0.3) continue
    const p = new THREE.Vector3(dir.x * 0.378, 0.92 + dir.y * 0.306, -0.02 + dir.z * 0.324)
    rosette(pelagem, p, dir, 1.2)
  }
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const dir = new THREE.Vector3(side * 0.8, 0.5 - k * 0.35, 0.3 + k * 0.1).normalize()
      rosette(pelagem, new THREE.Vector3(side * 0.34, 1.6, 0).addScaledVector(dir, 0.17), dir, 0.9)
    }
  }

  const pescoco: [V3, V3] = [[0, 1.6, 0], [0, 1.86, 0.04]]
  mae.add(limb(pescoco[0], pescoco[1], 0.17, LEO))

  // braço esquerdo (lado direito da imagem): estendido, segura a pistola
  const ombroE: V3 = [0.37, 1.6, 0.02]
  const cotoveloE: V3 = [0.7, 1.78, 0.14]
  mae.add(limb(ombroE, cotoveloE, 0.1, LEO))
  mae.add(limb(cotoveloE, PAW_L, 0.085, LEO))
  spotsOnLimb(pelagem, ombroE, cotoveloE, 0.1, 4, 41, 0.85)
  spotsOnLimb(pelagem, cotoveloE, PAW_L, 0.085, 3, 42, 0.7)
  const pataE = sphere(0.105, LEO, pelo)
  pataE.scale.set(1, 0.9, 1)
  pataE.position.set(...PAW_L)
  mae.add(pataE)

  // ---- cabeça: boca aberta no rugido, olhos verdes, bigodes ----------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 2.0, 0.04)
  cabeca.rotation.x = HEAD_UP
  mae.add(cabeca)

  const rosto = new THREE.Group() // sub-peça: olhos, nariz, presas, bigodes, pintas
  cabeca.add(rosto)

  const cranio = sphere(0.26, LEO, pelo)
  cranio.scale.set(1.08, 0.92, 0.95)
  cabeca.add(cranio)

  const ponte = sphere(0.09, LEO, pelo)
  ponte.scale.set(0.8, 0.8, 1.25)
  ponte.position.set(0, 0.03, 0.19)
  cabeca.add(ponte)

  for (const side of [-1, 1]) {
    const bochecha = sphere(0.1, CREAM, pelo)
    bochecha.scale.set(1, 0.85, 0.9)
    bochecha.position.set(side * 0.078, -0.055, 0.2)
    cabeca.add(bochecha)
  }

  const queixo = sphere(0.09, CREAM, pelo)
  queixo.scale.set(1, 0.6, 1.1)
  queixo.position.set(0, -0.25, 0.14)
  cabeca.add(queixo)

  const boca = sphere(0.115, MOUTH, { roughness: 0.5 })
  boca.scale.set(1.1, 0.95, 0.75)
  boca.position.set(0, -0.15, 0.19)
  cabeca.add(boca)

  const lingua = sphere(0.06, TONGUE, { roughness: 0.4 })
  lingua.scale.set(1.15, 0.4, 1)
  lingua.position.set(0, -0.215, 0.22)
  rosto.add(lingua)

  const nariz = sphere(0.045, NOSE, { roughness: 0.35 })
  nariz.scale.set(1.35, 0.8, 0.9)
  nariz.position.set(0, 0.035, 0.3)
  rosto.add(nariz)

  for (const side of [-1, 1]) {
    const presa = cone(0.02, 0.065, '#fbf7ea', { roughness: 0.3 })
    presa.position.set(side * 0.055, -0.1, 0.255)
    presa.rotation.x = Math.PI
    rosto.add(presa)

    const iris = sphere(0.05, EYE, { roughness: 0.2 })
    iris.scale.z = 0.55
    iris.position.set(side * 0.1, 0.085, 0.205)
    const pupila = capsule(0.013, 0.035, '#111111', { roughness: 0.2 })
    pupila.scale.z = 0.5
    pupila.position.set(side * 0.1, 0.085, 0.232)
    const brilho = sphere(0.012, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.1 + 0.018, 0.105, 0.238)
    rosto.add(iris, pupila, brilho)

    const sobrancelha = capsule(0.017, 0.07, SPOT, { roughness: 0.8 })
    sobrancelha.position.set(side * 0.105, 0.15, 0.2)
    sobrancelha.rotation.z = Math.PI / 2 + side * 0.3
    rosto.add(sobrancelha)

    const orelha = cone(0.095, 0.17, LEO, pelo)
    orelha.scale.z = 0.45
    orelha.rotation.z = -side * 0.38
    orelha.position.set(side * 0.17, 0.24, -0.03)
    cabeca.add(orelha)
    const dentroOrelha = cone(0.06, 0.11, '#f0d9b5', pelo)
    dentroOrelha.scale.z = 0.3
    dentroOrelha.rotation.z = -side * 0.38
    dentroOrelha.position.set(side * 0.165, 0.225, 0.0)
    rosto.add(dentroOrelha)

    // bigodes brancos, em leque, saindo das bochechas
    for (let w = 0; w < 3; w++) {
      const bigode = cylinder(0.005, 0.005, 0.22, '#ffffff', { roughness: 0.4 }, 6)
      bigode.rotation.z = side * (Math.PI / 2 + (w - 1) * 0.18)
      bigode.rotation.y = -side * 0.35
      bigode.position.set(side * 0.2, -0.06 + (w - 1) * 0.025, 0.24)
      rosto.add(bigode)
    }

    // pintinhas da testa e da nuca
    for (let k = 0; k < 4; k++) {
      const pinta = sphere(0.016, SPOT, pelo)
      const a = 0.35 + k * 0.2
      pinta.position.set(side * (0.06 + k * 0.035), 0.12 + a * 0.15, 0.2 - k * 0.04)
      pinta.scale.z = 0.5
      rosto.add(pinta)
    }
  }

  // ---- colar de pérolas no pescoço -----------------------------------------
  const colar = new THREE.Group()
  colar.position.set(0, 1.66, 0.08)
  colar.rotation.x = 0.4
  mae.add(colar)
  const N_PEROLAS = 26
  for (let i = 0; i < N_PEROLAS; i++) {
    const a = (i / N_PEROLAS) * Math.PI * 2
    const perola = sphere(0.042, '#ffffff', { roughness: 0.08, metalness: 0.3 })
    perola.position.set(Math.sin(a) * 0.3, 0, Math.cos(a) * 0.42)
    colar.add(perola)
  }
  const pingente = sphere(0.062, '#ffffff', { roughness: 0.08, metalness: 0.3 })
  pingente.position.set(0, -0.09, 0.44)
  colar.add(pingente)

  // ---- rabo comprido, pintado, curvado pra cima ----------------------------
  const rabo = new THREE.Group()
  rabo.position.set(-0.12, 0.78, -0.26)
  mae.add(rabo)
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.18, -0.06, -0.12),
    new THREE.Vector3(-0.42, -0.04, -0.16),
    new THREE.Vector3(-0.64, 0.08, -0.12),
    new THREE.Vector3(-0.78, 0.3, -0.06),
    new THREE.Vector3(-0.82, 0.55, 0.0),
    new THREE.Vector3(-0.74, 0.76, 0.04),
    new THREE.Vector3(-0.6, 0.84, 0.06),
  ])
  const N_RABO = 34
  for (let i = 0; i < N_RABO; i++) {
    const t = i / (N_RABO - 1)
    const r = 0.075 - t * 0.025
    // anéis escuros pintados na própria pele (o refine transfere a cor)
    const anel = [0.2, 0.38, 0.55, 0.7, 0.8].some((c) => Math.abs(t - c) < 0.02)
    const gomo = sphere(r, t > 0.88 || anel ? SPOT : LEO, pelo)
    gomo.position.copy(curva.getPoint(t))
    rabo.add(gomo)
  }

  // ---- braço direito: pivô no ombro, esticado pro alto ---------------------
  const bracoD = new THREE.Group()
  bracoD.position.set(...SHOULDER_R)
  bracoD.rotation.z = ARM_UP
  mae.add(bracoD)
  bracoD.add(limb([0, 0, 0], [0, 0.4, 0.0], 0.1, LEO))
  bracoD.add(limb([0, 0.4, 0.0], [0, 0.76, 0.0], 0.085, LEO))
  const pelagemBraco = new THREE.Group() // sub-peça: rosetas e dedos do braço
  bracoD.add(pelagemBraco)
  spotsOnLimb(pelagemBraco, [0, 0, 0], [0, 0.4, 0], 0.1, 4, 51, 0.85)
  spotsOnLimb(pelagemBraco, [0, 0.4, 0], [0, 0.76, 0], 0.085, 3, 52, 0.7)
  const palma = sphere(0.115, LEO, pelo)
  palma.scale.set(1.2, 0.62, 1.15)
  palma.position.set(0, 0.84, 0)
  bracoD.add(palma)
  for (let d = 0; d < 4; d++) {
    const a = -1.0 + d * 0.66
    const dedo = sphere(0.04, LEO, pelo)
    dedo.position.set(Math.sin(a) * 0.12, 0.88, Math.cos(a) * 0.1)
    pelagemBraco.add(dedo)
  }

  // ---- pistola de confete dourada (acento) na pata esquerda ----------------
  const pistola = new THREE.Group()
  pistola.position.set(...PAW_L)
  pistola.rotation.z = PISTOL_ROT
  pistola.scale.setScalar(PISTOL_S)
  mae.add(pistola)
  const ouro = { roughness: 0.28, metalness: 0.65 }
  const cabo = rbox(0.07, 0.18, 0.065, 0.025, '#c98f12', { roughness: 0.4, metalness: 0.5 })
  cabo.rotation.z = -0.25
  pistola.add(cabo)
  const corpo = rbox(0.24, 0.09, 0.075, 0.03, GOLD, ouro)
  corpo.position.set(0.07, 0.1, 0)
  pistola.add(corpo)
  const cano = cylinder(0.032, 0.032, 0.16, GOLD, ouro)
  cano.rotation.z = -Math.PI / 2
  cano.position.set(0.25, 0.1, 0)
  pistola.add(cano)
  const boca2 = lathe(
    [[0.03, 0], [0.04, 0.02], [0.07, 0.08], [0.085, 0.1], [0.07, 0.1], [0.05, 0.06], [0.0, 0.05]],
    GOLD,
    ouro,
  )
  boca2.rotation.z = -Math.PI / 2
  boca2.position.set(0.32, 0.1, 0)
  pistola.add(boca2)
  const guarda = torus(0.035, 0.01, GOLD, ouro)
  guarda.position.set(0.05, 0.035, 0)
  pistola.add(guarda)
  const gatilho = rbox(0.015, 0.04, 0.02, 0.006, '#c98f12', { roughness: 0.4, metalness: 0.5 })
  gatilho.position.set(0.05, 0.04, 0)
  pistola.add(gatilho)
  for (const sx of [0.0, 0.1]) {
    const rebite = sphere(0.012, '#fff2c0', { roughness: 0.2, metalness: 0.7 })
    rebite.position.set(sx + 0.02, 0.1, 0.04)
    pistola.add(rebite)
  }

  // ---- FILHOTE de beca azul e capelo, diploma na pata ----------------------
  const filhote = new THREE.Group()
  filhote.position.set(...CUB_UP)
  filhote.scale.setScalar(1.12)
  root.add(filhote)

  const beca = lathe(
    [[0, 0], [0.17, 0], [0.185, 0.03], [0.16, 0.2], [0.13, 0.36], [0.1, 0.42], [0, 0.44]],
    NAVY,
    { roughness: 0.85 },
  )
  filhote.add(beca)
  for (const side of [-1, 1]) {
    const pezinho = sphere(0.055, LEO, pelo, 14)
    pezinho.scale.set(1, 0.6, 1.3)
    pezinho.position.set(side * 0.07, 0.03, 0.15)
    filhote.add(pezinho)
  }
  const cab = sphere(0.155, LEO, pelo)
  cab.position.set(0, 0.56, 0.01)
  filhote.add(cab)
  for (const side of [-1, 1]) {
    const foc = sphere(0.055, CREAM, pelo)
    foc.position.set(side * 0.036, 0.52, 0.125)
    filhote.add(foc)
    const orelhinha = sphere(0.05, LEO, pelo)
    orelhinha.scale.set(1, 1, 0.5)
    orelhinha.position.set(side * 0.115, 0.68, -0.01)
    filhote.add(orelhinha)
    const olho = sphere(0.036, '#3f5f2a', { roughness: 0.2 }, 16)
    olho.scale.z = 0.55
    olho.position.set(side * 0.062, 0.6, 0.13)
    const luzOlho = sphere(0.011, '#ffffff', { roughness: 0.1 }, 8)
    luzOlho.position.set(side * 0.062 + 0.012, 0.615, 0.15)
    filhote.add(olho, luzOlho)
    for (let k = 0; k < 2; k++) {
      const pintinha = sphere(0.013, SPOT, pelo, 8)
      pintinha.scale.z = 0.5
      pintinha.position.set(side * (0.05 + k * 0.05), 0.68 - k * 0.02, 0.1 - k * 0.04)
      filhote.add(pintinha)
    }
  }
  const narizinho = sphere(0.022, NOSE, { roughness: 0.35 }, 12)
  narizinho.scale.set(1.3, 0.8, 0.9)
  narizinho.position.set(0, 0.548, 0.172)
  filhote.add(narizinho)
  const sorriso = sphere(0.032, MOUTH, { roughness: 0.5 }, 14)
  sorriso.scale.set(1.2, 0.7, 0.6)
  sorriso.position.set(0, 0.48, 0.14)
  filhote.add(sorriso)

  // capelo torto com pendão amarelo
  const capelo = new THREE.Group()
  capelo.position.set(0.01, 0.72, 0.0)
  capelo.rotation.set(-0.12, 0.6, 0.2)
  filhote.add(capelo)
  const copa = cylinder(0.105, 0.11, 0.07, CAP, { roughness: 0.7 })
  copa.position.y = -0.02
  capelo.add(copa)
  const tabuleiro = rbox(0.3, 0.024, 0.3, 0.008, CAP, { roughness: 0.7 })
  tabuleiro.position.y = 0.025
  capelo.add(tabuleiro)
  const botao = sphere(0.017, TASSEL, { roughness: 0.5 }, 8)
  botao.position.y = 0.042
  capelo.add(botao)
  const cordao = cylinder(0.006, 0.006, 0.2, TASSEL, { roughness: 0.6 }, 6)
  cordao.rotation.set(0, Math.PI / 4, Math.PI / 2)
  cordao.position.set(0.07, 0.04, 0.07)
  capelo.add(cordao)
  const pendao = capsule(0.018, 0.08, TASSEL, { roughness: 0.7 })
  pendao.position.set(0.145, -0.03, 0.145)
  capelo.add(pendao)

  // braços de manga azul: um ergue o diploma, o outro acena
  filhote.add(limb([0.11, 0.38, 0.02], [0.25, 0.6, 0.07], 0.048, NAVY))
  const mao1 = sphere(0.047, LEO, pelo)
  mao1.position.set(0.26, 0.63, 0.08)
  filhote.add(mao1)
  filhote.add(limb([-0.11, 0.38, 0.02], [-0.24, 0.5, 0.08], 0.048, NAVY))
  const mao2 = sphere(0.047, LEO, pelo)
  mao2.position.set(-0.26, 0.52, 0.09)
  filhote.add(mao2)

  const diploma = new THREE.Group()
  diploma.position.set(0.27, 0.66, 0.1)
  diploma.rotation.set(0.2, 0, -0.55)
  filhote.add(diploma)
  const rolo = cylinder(0.03, 0.03, 0.3, PAPER, { roughness: 0.7 })
  diploma.add(rolo)
  const laco = torus(0.034, 0.011, RIBBON, { roughness: 0.5 })
  laco.rotation.x = Math.PI / 2
  diploma.add(laco)
  for (const side of [-1, 1]) {
    const ponta = rbox(0.02, 0.07, 0.006, 0.003, RIBBON, { roughness: 0.5 })
    ponta.position.set(side * 0.02, -0.04, 0.035)
    ponta.rotation.z = side * 0.3
    diploma.add(ponta)
  }

  // ---- chuva de confete: nasce na boca da pistola --------------------------
  const confete = new THREE.Group()
  confete.position.copy(MUZZLE)
  root.add(confete)
  const head = new THREE.Vector3(MX, SY + 2.0, MZ)
  const cub = new THREE.Vector3(CUB_UP[0], CUB_UP[1] + 0.45, CUB_UP[2])
  let n = 0
  for (let tries = 0; n < 90 && tries < 600; tries++) {
    const p = new THREE.Vector3(
      -2.0 + rand() * 4.2,
      SY + 1.3 + Math.sqrt(rand()) * 2.6,
      -1.0 + rand() * 1.9,
    )
    if (p.distanceTo(head) < 0.55) continue
    if (Math.abs(p.x - cub.x) < 0.45 && Math.abs(p.y - cub.y) < 0.65 && p.z > cub.z - 0.4) continue
    if (Math.abs(p.x - MX) < 0.55 && p.y < SY + 2.3 && p.z > MZ - 0.5) continue
    if (p.x > 0.2 && p.x < 1.85 && p.y > SY + 2.5 && p.y < SY + 3.2) continue // faixa ABC
    const c = rbox(0.07, 0.07, 0.01, 0.004, CONFETTI[n % CONFETTI.length], { roughness: 0.5 })
    c.position.copy(p).sub(MUZZLE)
    c.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
    confete.add(c)
    n++
  }
  // alguns já pousados no tablado
  for (let k = 0; k < 18; k++) {
    const x = -2.0 + rand() * 4.0
    const zz = -1.2 + rand() * 2.4
    if (Math.abs(x - MX) < 0.5 && Math.abs(zz - MZ) < 0.45) continue
    const c = rbox(0.07, 0.01, 0.07, 0.004, CONFETTI[k % CONFETTI.length], { roughness: 0.5 })
    c.position.set(x, SY + 0.008, zz).sub(MUZZLE)
    c.rotation.y = rand() * Math.PI
    confete.add(c)
  }
  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'palco', group: 'palco', object: palco },
    { name: 'cortinas', group: 'palco', object: cortinas },
    { name: 'faixa', group: 'faixa', object: faixa },
    { name: 'filhote', group: 'filhote', object: filhote },
    { name: 'mae', group: 'mae', object: mae },
    { name: 'rosetas', group: 'mae', object: pelagem },
    { name: 'cabeca', group: 'mae', object: cabeca },
    { name: 'rosto', group: 'mae', object: rosto },
    { name: 'rabo', group: 'mae', object: rabo },
    { name: 'bracoD', group: 'mae', object: bracoD },
    { name: 'rosetasBraco', group: 'mae', object: pelagemBraco },
    { name: 'colar', group: 'colar', object: colar },
    { name: 'pistola', group: 'pistola', object: pistola },
    { name: 'confete', group: 'confete', object: confete },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('palco-sobe', 'palco', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Formatura do ABC na escolinha: o palco de madeira sobe…',
    }),
    seq('cortinas-descem', 'cortinas', 0.4, 0.9, [ch('position.y', 4.6, 0)], {
      ease: 'easeOut',
      caption: '…e descem as cortinas de veludo vermelho.',
    }),

    seq('faixa-desenrola', 'faixa', 1.7, 0.7, [
      ch('scale.x', 0.05, 1),
      ch('rotation.z', 0.3, 0),
    ], {
      ease: 'easeOut',
      caption: 'No fundo, a faixa amarela da festa: ABC.',
    }),

    seq('filhote-surge', 'filhote', 3.0, 0.6, [
      ch('scale.x', 0.01, 1.12),
      ch('scale.y', 0.01, 1.12),
      ch('scale.z', 0.01, 1.12),
    ], {
      ease: 'easeOut',
      caption: 'O filhote de LEOPARDO, de beca azul e capelo torto, recebe o diploma.',
    }),

    seq('mae-salta', 'mae', 4.6, 0.9, [
      ch('position.z', MZ + 3.0, MZ),
      ch('position.y', SY + 1.6, SY),
    ], {
      ease: 'easeIn',
      caption: 'Da plateia, a mãe leopardo — a mais OVER do auditório — salta direto pro palco!',
    }),
    seq('cabeca-entra', 'cabeca', 4.6, 0.9, [
      ch('scale.x', 0.7, 1), ch('scale.y', 0.7, 1), ch('scale.z', 0.7, 1),
    ], { ease: 'easeOut' }),
    seq('braco-entra', 'bracoD', 4.6, 0.9, [
      ch('scale.x', 0.6, 1), ch('scale.y', 0.6, 1), ch('scale.z', 0.6, 1),
    ], { ease: 'easeOut' }),
    seq('rosetas-chegam', 'rosetas', 4.6, 0.9, [ch('scale.x', 1, 1)]),
    seq('rosto-chega', 'rosto', 4.6, 0.9, [ch('scale.x', 1, 1)]),
    seq('rosetas-braco', 'rosetasBraco', 4.6, 0.9, [ch('scale.x', 1, 1)]),
    seq('rabo-chicoteia', 'rabo', 4.7, 1.0, [ch('rotation.z', 0.9, 0)], { ease: 'easeOut' }),

    seq('colar-brilha', 'colar', 6.0, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'De colar de pérolas e peito estufado, ela saca a PISTOLA de confete dourada…',
    }),
    seq('pistola-saca', 'pistola', 6.4, 0.6, [
      ch('scale.x', 0.01, PISTOL_S), ch('scale.y', 0.01, PISTOL_S), ch('scale.z', 0.01, PISTOL_S),
      ch('rotation.z', -0.4, PISTOL_ROT),
    ], { ease: 'easeOut' }),

    seq('confete-explode', 'confete', 7.4, 0.8, [
      ch('scale.x', 0.02, 1), ch('scale.y', 0.02, 1), ch('scale.z', 0.02, 1),
      ch('rotation.y', -0.35, 0),
    ], {
      ease: 'easeOut',
      caption: '…e dispara: STÓL-T! Chove confete no palco inteiro.',
    }),

    seq('braco-ergue', 'bracoD', 8.9, 1.0, [ch('rotation.z', ARM_DOWN, ARM_UP)], {
      ease: 'easeInOut',
      caption: 'Como no desenho animado, ela ergue o filhote OVER a própria cabeça, lá no alto!',
    }),
    seq('filhote-sobe', 'filhote', 8.9, 1.0, [
      ch('position.x', CUB_FLOOR[0], CUB_UP[0]),
      ch('position.y', CUB_FLOOR[1], CUB_UP[1]),
      ch('position.z', CUB_FLOOR[2], CUB_UP[2]),
    ], { ease: 'easeInOut' }),

    seq('cabeca-ruge', 'cabeca', 10.4, 0.5, [ch('rotation.x', 0.2, HEAD_UP)], {
      ease: 'easeOut',
      caption: 'E ruge de orgulho: IÁ É STÓLT ÖVER DÊI!',
    }),
    seq('rabo-final', 'rabo', 11.7, 0.5, [ch('rotation.z', 0.35, 0)], {
      ease: 'easeOut',
      caption: 'Jag är stolt över dig. — Tenho orgulho de você.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.55, 6.75], target: [0.1, 2.05, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-stolt-over-dig',
    contexto:
      'Família: pai e mãe pro filho depois da apresentação da escola, do primeiro gol, da aula de natação; e entre adultos — pro parceiro que conseguiu o emprego, pro amigo que passou na prova de sueco.',
    fraseFonte: 'Tenho orgulho de você.',
    fraseAlvo: 'Jag är stolt över dig.',
    pronuncia:
      "iá é STÓLT ÖÖ-ver dêi ('jag' = iá e 'är' = é; 'stolt' com Ó ABERTO e curto, L de verdade, língua no céu da boca, e T seco no fim; 'över' com Ö LONGO — lábios em bico de Ô e língua no Ê —, a força nele, e o -ver fraquinho com R brando; 'dig' na fala é 'dej' = DÊI)",
    ponteSonora:
      "IÁ É (pi)STÓL-T... ÖVER... DÊI! (6 sílabas: iá-é-STÓLT-ÖÖ-ver-dêi; força no STÓLT e no ÖÖ; IÁ É = o 'jag är' de sempre, o MESMO de 'Jag är trött' e 'Jag är klar': I de IOGA, nunca J chiado, e É aberto e curto; STÓL-T = a PISTOLA de confete sem o PI e com o -A trocado pelo T seco do disparo: arrancando o PI, o 'is' que o brasileiro põe antes do S vai junto, e o S gruda direto no T; Ó ABERTO e CURTO, o mesmo da própria 'pistÓla' e do CÓ de 'kommer'; L DE VERDADE, ponta da língua no céu da boca — nunca 'stóu' —, e o T sem vogal depois, o estalo seco do CLÁR-T de 'Självklart!'; o T é obrigatório, é ele que fecha 'stolt'; e não é a gíria 'tá pistola' (bravo): a pistola é de confete, e ela está é OVER de orgulho; ÖVER = o OVER que o Brasil já usa ('game over', 'que mãe OVER!') — e em sueco é a mesma palavra: över = por cima, acima; só tire o 'ou' deslizado do 'ÔU-ver': lábios em bico de Ô e língua parada no Ê, LONGO — o mesmo truque do FÖÖ de 'födelsedagen' e do MÖÖ-te de 'Jag har ett möte' —, e é nele a força; o -ver fraquinho com R brando; DÊI = o 'dig' de sempre, irmão do M'ÊI de 'mig', uma sílaba só e fraca, o mesmo de 'Jag saknar dig' e 'Jag älskar dig')",
    historia:
      "Formatura do ABC na escolinha: o filhote de LEOPARDO, de beca e capelo torto, pega o diploma. Na plateia, a mãe leopardo é a mais OVER do auditório: dispara uma PISTOLA de confete — STÓL-T! —, salta da cadeira direto pro palco e, como no desenho animado, ergue o filhote OVER a própria cabeça, lá no alto, pra escola inteira ver. No meio da chuva de confete, de peito estufado, ela ruge: 'IÁ É STÓLT ÖVER DÊI!' — tenho orgulho de você.",
  },
  createScene,
  refine: { organic: ['mae', 'cabeca', 'rabo', 'bracoD', 'filhote'] },
}

export default card
