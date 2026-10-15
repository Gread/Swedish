import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, cylinder, sphere, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Kan du förklara?" — CAN-DU... FUR-CLÁRA?
 *
 * Reunião de segunda: no cavalete, em vez de slide, o chefe apresenta um OVO
 * gigante. O FRANKENSTEIN, na ponta da mesa, não entende as siglas, os
 * parafusos do pescoço soltam faísca, ele estica os braços (a pose clássica
 * dele) com uma FURADEIRA amarela de duas alças e crava a broca na casca: sai
 * um jorro de CLARA transparente que cai sobre a mesa. FUR-CLÁRA = furar a
 * clara; e é literal: för-klara = deixar claro.
 *
 * Diorama: piso de madeira clara, mesa de reunião cinza-clara ao fundo, o
 * Frankenstein à esquerda virado para o cavalete à direita, cadeira tombada
 * atrás dele, caixa de ferramentas no chão. Acento saturado RESERVADO à
 * furadeira amarela; a clara é translúcida e fria.
 */

const SOIL = '#4a3a2c'
const FLOOR = '#d3b48a'
const FLOOR_LINE = '#b89a70'
const TABLE = '#d4d8dc'
const TABLE_EDGE = '#b3b9bf'
const STEEL = '#69717a'
const STEEL_LIGHT = '#a7aeb5'
const CHAIR = '#4e6a86'
const EASEL = '#8f6136'
const EASEL_DARK = '#6e4726'
const SHELL = '#f3e9d6'
const SHELL_SHADE = '#d8c39f'
const CUP = '#f7f4ee'
const JACKET = '#2b2d33'
const JACKET_EDGE = '#1d1e22'
const PANTS = '#5f636b'
const SHIRT = '#ece8df'
const SKIN = '#86a052'       // verde-oliva
const SKIN_DARK = '#6b8540'
const HAIR = '#18181b'
const SCAR = '#4c3a3c'
const BOOT = '#1e1e21'
const SOLE = '#3c3c40'
const SILVER = '#c7cdd3'
const RUBBER = '#26272b'
const TOOLBOX = '#4f6d86'
const TOOLBOX_DARK = '#3a5266'
const WOOD_TOOL = '#a8753f'
const PAPER = '#f5f3ee'
const MUG_A = '#e9e4da'
const MUG_B = '#9a5a46'
const CLARA = '#e2f1ff'
const CLARA_OPTS = { roughness: 0.05, emissive: '#9fcfff', emissiveIntensity: 0.35 }
const SPARK = '#fff1a0'
const YELLOW = '#ffc20e'     // acento saturado: a FURADEIRA

const GY = 0.16 // topo do piso

// ---- Frankenstein ------------------------------------------------------------
const S = 1.25            // escala do person() (1.5 → ~1.9 de altura)
const F_X = -1.0
const F_Z = 0.12
const F_YAW = 1.05        // corpo em 3/4, virado para o cavalete
const ARM_YAW = 0.22      // os braços giram mais um pouco, mirando o ovo
const ARM_UP = -1.53      // braços esticados pra frente (quase horizontal)
const ARM_SPREAD = 0.1
const HAND_Y = -0.6       // braço comprido: a mão passa da manga curta
const LUNGE = 0.24        // investida final (frank + furadeira juntos)

// ---- furadeira -----------------------------------------------------------------
const DS = 1.45           // escala da furadeira
const BIT_TIP = 0.74      // ponta da broca no x local (origem = alças)
const PEN = 0.14          // quanto a broca entra na casca

// ---- ovo ----------------------------------------------------------------------
const EGG_H = 1.18
const EGG_R = 0.45        // raio no ponto mais largo
const EGG_K = 0.12        // assimetria: base mais larga
const EGG_T_WIDE = 1.45   // parâmetro do ponto mais largo do perfil
const EGG_RR = EGG_R / (Math.sin(EGG_T_WIDE) * (1 + EGG_K * Math.cos(EGG_T_WIDE)))
const HIT_H = 0.34        // altura (acima da base do ovo) onde a broca entra
const CUP_SEAT = 0.16     // altura do assento do porta-ovo

// ---- mesa ---------------------------------------------------------------------
const T_X = -0.2
const T_Z = -1.25
const T_LEN = 2.75
const T_DEP = 0.92
const TOP = GY + 0.72

/** Perfil do ovo: parâmetro t de 0 (base) a π (topo). */
function eggAt(t: number): [number, number] {
  return [EGG_RR * Math.sin(t) * (1 + EGG_K * Math.cos(t)), (EGG_H / 2) * (1 - Math.cos(t))]
}
function eggProfile(): [number, number][] {
  const pts: [number, number][] = []
  const n = 32
  for (let i = 0; i <= n; i++) {
    const [r, y] = eggAt((i / n) * Math.PI)
    pts.push([i === 0 || i === n ? 0 : r, y])
  }
  return pts
}
/** Raio da casca na altura h acima da base. */
const eggRadiusAt = (h: number) => eggAt(Math.acos(1 - (2 * h) / EGG_H))[0]

function translucent(mesh: THREE.Mesh, opacity: number) {
  const m = mesh.material as THREE.MeshStandardMaterial
  m.transparent = true
  m.opacity = opacity
  m.depthWrite = false
  mesh.castShadow = false
  return mesh
}

/** Barra cilíndrica de A até B (pernas do cavalete, cabos). */
function bar(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = { roughness: 0.7 }) {
  const d = b.clone().sub(a)
  const m = cylinder(r, r, d.length(), color, opts, 16)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Faísca: estrelinha de 4 pontas, luz pura. */
function spark(size: number) {
  const s = new THREE.Shape()
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? size : size * 0.28
    const a = (i / 8) * Math.PI * 2
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, { depth: size * 0.25, bevelEnabled: false })
  geo.center()
  return new THREE.Mesh(geo, mat(SPARK, { emissive: '#ffd84a', emissiveIntensity: 1.4 }))
}

/** Cadeira de reunião; assento olha para +z, pivô nos pés de trás (z=0). */
function makeChair() {
  const g = new THREE.Group()
  const seat = rbox(0.48, 0.07, 0.44, 0.03, CHAIR, { roughness: 0.8 })
  seat.position.set(0, 0.42, 0.21)
  g.add(seat)
  const back = rbox(0.48, 0.42, 0.06, 0.03, CHAIR, { roughness: 0.8 })
  back.position.set(0, 0.74, -0.02)
  back.rotation.x = -0.1
  g.add(back)
  for (const sx of [-1, 1]) {
    for (const lz of [0, 0.4]) {
      const leg = cylinder(0.02, 0.017, 0.4, STEEL, { roughness: 0.3, metalness: 0.75 }, 12)
      leg.position.set(sx * 0.2, 0.2, lz)
      g.add(leg)
    }
    const post = cylinder(0.018, 0.018, 0.34, STEEL, { roughness: 0.3, metalness: 0.75 }, 12)
    post.position.set(sx * 0.19, 0.6, 0.0)
    g.add(post)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- base: piso de madeira clara ------------------------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.62, 2.7, 0.1, SOIL, { roughness: 0.9 })
  soil.position.y = 0.05
  base.add(soil)
  const floor = cylinder(2.54, 2.62, 0.06, FLOOR, { roughness: 0.6 })
  floor.position.y = 0.13
  base.add(floor)
  // juntas das tábuas: cordas do disco, com emendas desencontradas
  const PLANK_W = 0.27
  for (let i = -9; i <= 9; i++) {
    const z = i * PLANK_W
    const zl = z + PLANK_W / 2
    const halfL = Math.sqrt(Math.max(2.5 * 2.5 - zl * zl, 0))
    if (halfL > 0.2) {
      const line = rbox(halfL * 2, 0.006, 0.014, 0.003, FLOOR_LINE, { roughness: 0.7 })
      line.position.set(0, GY + 0.002, zl)
      base.add(line)
    }
    // emendas desencontradas: tábuas longas
    const halfC = Math.sqrt(Math.max(2.45 * 2.45 - z * z, 0))
    for (let x = -halfC + 0.4 + rand() * 1.2; x < halfC - 0.2; x += 1.5 + rand() * 0.5) {
      const joint = rbox(0.014, 0.006, PLANK_W - 0.01, 0.003, FLOOR_LINE, { roughness: 0.7 })
      joint.position.set(x, GY + 0.002, z)
      base.add(joint)
    }
  }
  root.add(base)

  // ---- mesa de reunião comprida + cadeiras do outro lado ---------------------
  const mesa = new THREE.Group()
  mesa.position.set(T_X, 0, T_Z)
  root.add(mesa)

  const tampo = rbox(T_LEN, 0.07, T_DEP, 0.03, TABLE, { roughness: 0.35 })
  tampo.position.y = TOP - 0.035
  mesa.add(tampo)
  const borda = rbox(T_LEN - 0.08, 0.05, T_DEP - 0.08, 0.02, TABLE_EDGE, { roughness: 0.45 })
  borda.position.y = TOP - 0.085
  mesa.add(borda)
  for (const sx of [-1, 1]) {
    const pe = rbox(0.09, TOP - GY - 0.1, 0.62, 0.03, STEEL, { roughness: 0.35, metalness: 0.6 })
    pe.position.set(sx * (T_LEN / 2 - 0.3), GY + (TOP - GY - 0.1) / 2, 0)
    mesa.add(pe)
    const sapata = rbox(0.14, 0.04, 0.78, 0.02, STEEL, { roughness: 0.35, metalness: 0.6 })
    sapata.position.set(sx * (T_LEN / 2 - 0.3), GY + 0.02, 0)
    mesa.add(sapata)
  }
  const travessa = rbox(T_LEN - 0.62, 0.07, 0.05, 0.02, STEEL, { roughness: 0.35, metalness: 0.6 })
  travessa.position.set(0, GY + 0.3, 0)
  mesa.add(travessa)

  // papéis, caneta e canecas
  const papeis = new THREE.Group()
  papeis.position.set(-0.95, TOP, 0.12)
  papeis.rotation.y = 0.18
  for (let i = 0; i < 3; i++) {
    const folha = rbox(0.3, 0.008, 0.4, 0.004, PAPER, { roughness: 0.9 })
    folha.position.set((rand() - 0.5) * 0.04, 0.004 + i * 0.009, (rand() - 0.5) * 0.04)
    folha.rotation.y = (rand() - 0.5) * 0.25
    papeis.add(folha)
  }
  for (let i = 0; i < 4; i++) {
    const linha = rbox(0.2, 0.003, 0.018, 0.001, '#9aa3ad', { roughness: 0.9 })
    linha.position.set(-0.02, 0.031, -0.12 + i * 0.07)
    papeis.add(linha)
  }
  const caneta = cylinder(0.012, 0.012, 0.22, '#33495f', { roughness: 0.4 }, 12)
  caneta.rotation.set(0, 0.5, Math.PI / 2)
  caneta.position.set(0.24, 0.014, 0.05)
  papeis.add(caneta)
  mesa.add(papeis)

  const mugProfile: [number, number][] = [
    [0, 0], [0.075, 0], [0.08, 0.02], [0.078, 0.15], [0.082, 0.16], [0.068, 0.16], [0.066, 0.03], [0, 0.03],
  ]
  for (const [mx, mz, color] of [[-1.15, -0.22, MUG_A], [0.75, -0.18, MUG_B]] as const) {
    const mug = lathe(mugProfile, color, { roughness: 0.2 })
    mug.position.set(mx, TOP, mz)
    const alca = torus(0.045, 0.013, color, { roughness: 0.2 })
    alca.position.set(0.085, 0.085, 0)
    mug.add(alca)
    mug.rotation.y = rand() * Math.PI
    mesa.add(mug)
  }

  for (const cx of [-0.75, 0.45]) {
    const c = makeChair()
    c.position.set(cx, GY, -T_DEP / 2 - 0.62)
    c.rotation.y = (rand() - 0.5) * 0.2
    mesa.add(c)
  }

  // ---- Frankenstein ----------------------------------------------------------
  const frank = person({ body: JACKET, skin: SKIN, height: 1.5, armAngle: 0.3 })
  frank.scale.setScalar(S)
  frank.position.set(F_X, GY, F_Z)
  frank.rotation.y = F_YAW
  root.add(frank)

  // calça cinza: da barra do paletó curto até as botas
  const calca = lathe(
    [[0, 0.04], [0.22, 0.04], [0.25, 0.1], [0.265, 0.2], [0.266, 0.29], [0, 0.29]],
    PANTS,
    { roughness: 0.85 },
  )
  frank.add(calca)
  // vinco entre as pernas (frente e trás)
  for (const sz of [-1, 1]) {
    const vinco = rbox(0.02, 0.17, 0.03, 0.008, '#4f5359', { roughness: 0.85 })
    vinco.position.set(0, 0.13, sz * 0.255)
    vinco.rotation.x = sz * 0.12
    frank.add(vinco)
  }
  const barra = torus(0.262, 0.024, JACKET_EDGE, { roughness: 0.8 })
  barra.rotation.x = Math.PI / 2
  barra.position.y = 0.3
  frank.add(barra)

  // botas pesadas de sola grossa
  for (const side of [-1, 1]) {
    const bota = rbox(0.22, 0.16, 0.36, 0.07, BOOT, { roughness: 0.45 })
    bota.position.set(side * 0.125, 0.12, 0.1)
    frank.add(bota)
    const sola = rbox(0.25, 0.08, 0.4, 0.03, SOLE, { roughness: 0.8 })
    sola.position.set(side * 0.125, 0.04, 0.11)
    frank.add(sola)
  }

  // camisa, lapelas e botões do paletó
  const camisa = rbox(0.13, 0.16, 0.03, 0.012, SHIRT, { roughness: 0.8 })
  camisa.position.set(0, 0.66, 0.235)
  camisa.rotation.x = -0.2
  frank.add(camisa)
  for (const side of [-1, 1]) {
    const lapela = rbox(0.07, 0.24, 0.03, 0.015, JACKET_EDGE, { roughness: 0.75 })
    lapela.position.set(side * 0.075, 0.62, 0.245)
    lapela.rotation.set(-0.2, side * 0.25, side * 0.32)
    frank.add(lapela)
  }
  for (const by of [0.48, 0.38]) {
    const botao = sphere(0.022, '#0f0f11', { roughness: 0.3 }, 12)
    botao.position.set(0, by, 0.262)
    frank.add(botao)
  }

  // parafusos do pescoço
  for (const side of [-1, 1]) {
    const haste = cylinder(0.03, 0.03, 0.17, SILVER, { roughness: 0.25, metalness: 0.85 }, 16)
    haste.rotation.z = Math.PI / 2
    haste.position.set(side * 0.28, 0.8, 0.0)
    frank.add(haste)
    const porca = cylinder(0.058, 0.058, 0.05, SILVER, { roughness: 0.25, metalness: 0.85 }, 6)
    porca.rotation.z = Math.PI / 2
    porca.position.set(side * 0.37, 0.8, 0.0)
    frank.add(porca)
  }

  // cabeça: topo achatado (caixa), franja reta, cicatriz costurada
  const head = frank.getObjectByName('head') as THREE.Group
  const testa = rbox(0.56, 0.22, 0.52, 0.05, SKIN, { roughness: 0.7 })
  testa.position.set(0, 0.2, -0.005)
  head.add(testa)
  const sobrancelha = rbox(0.5, 0.035, 0.04, 0.015, SKIN_DARK, { roughness: 0.7 })
  sobrancelha.position.set(0, 0.105, 0.255)
  head.add(sobrancelha)
  const cabelo = rbox(0.58, 0.045, 0.54, 0.02, HAIR, { roughness: 0.85 })
  cabelo.position.set(0, 0.318, -0.01)
  head.add(cabelo)
  // franja reta, em mechas de comprimentos quase iguais
  for (let i = 0; i < 9; i++) {
    const len = 0.075 + (i % 3 === 1 ? 0.02 : 0) + (i % 4 === 0 ? -0.012 : 0)
    const mecha = rbox(0.066, len, 0.035, 0.012, HAIR, { roughness: 0.85 })
    mecha.position.set(-0.264 + i * 0.066, 0.335 - len / 2, 0.258)
    head.add(mecha)
  }
  const nuca = rbox(0.58, 0.16, 0.04, 0.015, HAIR, { roughness: 0.85 })
  nuca.position.set(0, 0.25, -0.268)
  head.add(nuca)
  for (const side of [-1, 1]) {
    const costeleta = rbox(0.035, 0.12, 0.5, 0.012, HAIR, { roughness: 0.85 })
    costeleta.position.set(side * 0.282, 0.27, -0.01)
    head.add(costeleta)
  }
  const cicatriz = new THREE.Group()
  cicatriz.position.set(-0.05, 0.19, 0.262)
  cicatriz.rotation.z = -0.12
  cicatriz.add(rbox(0.26, 0.016, 0.012, 0.005, SCAR, { roughness: 0.6 }))
  for (let i = 0; i < 5; i++) {
    const ponto = rbox(0.012, 0.055, 0.012, 0.004, SCAR, { roughness: 0.6 })
    ponto.position.x = -0.1 + i * 0.05
    ponto.rotation.z = 0.25
    cicatriz.add(ponto)
  }
  head.add(cicatriz)

  // boca aberta de trovão
  const boca = rbox(0.16, 0.075, 0.06, 0.025, '#2a1517', { roughness: 0.6 })
  boca.position.set(0, -0.135, 0.245)
  boca.rotation.x = -0.25
  head.add(boca)
  const dentes = rbox(0.13, 0.02, 0.03, 0.008, '#f2efe4', { roughness: 0.35 })
  dentes.position.set(0, -0.108, 0.262)
  dentes.rotation.x = -0.25
  head.add(dentes)

  // ---- braços: grupo próprio, pivô na linha dos ombros -----------------------
  const bracos = new THREE.Group()
  bracos.rotation.order = 'YXZ'
  bracos.position.set(0, 0.769, 0)
  bracos.rotation.set(ARM_UP, ARM_YAW, 0)
  frank.add(bracos)
  const hands: THREE.Object3D[] = []
  for (const name of ['armL', 'armR']) {
    const side = name === 'armL' ? -1 : 1
    const arm = frank.getObjectByName(name) as THREE.Mesh
    shoulderPivot(arm, 1.5)
    // manga curta demais: o paletó encolhe e o pulso verde aparece
    arm.geometry.scale(1, 0.84, 1)
    const hand = arm.children[0]
    hand.position.y = HAND_Y
    const pulso = cylinder(0.062, 0.07, 0.12, SKIN, { roughness: 0.7 }, 20)
    pulso.position.y = HAND_Y + 0.08
    arm.add(pulso)
    arm.position.set(side * 0.293, 0, 0)
    arm.rotation.set(0, 0, -side * ARM_SPREAD)
    bracos.add(arm)
    hands.push(hand)
  }

  // ---- faíscas nos parafusos -------------------------------------------------
  const faiscas = new THREE.Group()
  faiscas.position.set(0, 0.8, 0)
  frank.add(faiscas)
  for (const side of [-1, 1]) {
    for (const [dy, dz, sz, rz] of [
      [0.1, 0.06, 0.07, 0.2], [-0.06, 0.1, 0.05, 0.7], [0.03, -0.1, 0.06, 0.4], [0.16, -0.02, 0.045, 0.9],
    ] as const) {
      const f = spark(sz)
      f.position.set(side * (0.46 + Math.abs(dy) * 0.3), dy, dz)
      f.rotation.set(0, side * 1.2, rz)
      faiscas.add(f)
    }
  }

  // ---- geometria derivada: mãos → furadeira → ovo -------------------------------
  root.updateMatrixWorld(true)
  const hL = hands[0].getWorldPosition(new THREE.Vector3())
  const hR = hands[1].getWorldPosition(new THREE.Vector3())
  const P = hL.clone().add(hR).multiplyScalar(0.5)
  const yawA = F_YAW + ARM_YAW
  const dir = new THREE.Vector3(Math.sin(yawA), 0, Math.cos(yawA))
  const halfSpan = hL.distanceTo(hR) / 2 / DS
  const hitR = eggRadiusAt(HIT_H)
  const eggC = P.clone().addScaledVector(dir, BIT_TIP * DS - PEN + hitR)
  const eggBottom = P.y + 0.02 * DS - HIT_H
  const hole = P.clone().addScaledVector(dir, BIT_TIP * DS - PEN).setY(P.y + 0.02 * DS)

  // ---- furadeira amarela de duas alças ---------------------------------------
  const furadeira = new THREE.Group()
  furadeira.position.copy(P)
  furadeira.rotation.y = yawA - Math.PI / 2
  furadeira.scale.setScalar(DS)
  root.add(furadeira)

  const carcaca = rbox(0.46, 0.18, 0.16, 0.07, YELLOW, { roughness: 0.35 })
  carcaca.position.set(-0.02, 0.02, 0)
  furadeira.add(carcaca)
  const motor = cylinder(0.088, 0.088, 0.07, RUBBER, { roughness: 0.5 }, 24)
  motor.rotation.z = Math.PI / 2
  motor.position.set(-0.25, 0.02, 0)
  furadeira.add(motor)
  for (const sz of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const fenda = rbox(0.05, 0.016, 0.01, 0.005, RUBBER, { roughness: 0.5 })
      fenda.position.set(-0.17, 0.065 - i * 0.04, sz * 0.081)
      furadeira.add(fenda)
    }
  }
  const faixa = rbox(0.05, 0.19, 0.17, 0.03, RUBBER, { roughness: 0.5 })
  faixa.position.set(0.13, 0.02, 0)
  furadeira.add(faixa)
  const mandril = cylinder(0.042, 0.065, 0.13, '#3d4249', { roughness: 0.3, metalness: 0.7 }, 24)
  mandril.rotation.z = -Math.PI / 2
  mandril.position.set(0.27, 0.02, 0)
  furadeira.add(mandril)
  for (const rx of [0.25, 0.3]) {
    const anel = torus(0.055, 0.008, '#2a2e33', { roughness: 0.4, metalness: 0.6 })
    anel.rotation.y = Math.PI / 2
    anel.position.set(rx, 0.02, 0)
    furadeira.add(anel)
  }
  const broca = cylinder(0.016, 0.02, BIT_TIP - 0.36, SILVER, { roughness: 0.2, metalness: 0.9 }, 16)
  broca.rotation.z = -Math.PI / 2
  broca.position.set((BIT_TIP + 0.32) / 2, 0.02, 0)
  furadeira.add(broca)
  for (let i = 0; i < 6; i++) {
    const helice = torus(0.019, 0.006, SILVER, { roughness: 0.2, metalness: 0.9 })
    helice.rotation.set(0, Math.PI / 2, 0.5)
    helice.position.set(0.4 + i * 0.05, 0.02, 0)
    furadeira.add(helice)
  }
  // empunhadura de pistola + gatilho + bateria
  const cabo = rbox(0.1, 0.24, 0.11, 0.04, YELLOW, { roughness: 0.4 })
  cabo.position.set(-0.11, -0.15, 0)
  cabo.rotation.z = -0.28
  furadeira.add(cabo)
  const borracha = rbox(0.06, 0.2, 0.115, 0.025, RUBBER, { roughness: 0.6 })
  borracha.position.set(-0.15, -0.15, 0)
  borracha.rotation.z = -0.28
  furadeira.add(borracha)
  const gatilho = rbox(0.035, 0.06, 0.05, 0.012, RUBBER, { roughness: 0.5 })
  gatilho.position.set(-0.02, -0.1, 0)
  furadeira.add(gatilho)
  const bateria = rbox(0.24, 0.09, 0.17, 0.03, RUBBER, { roughness: 0.55 })
  bateria.position.set(-0.17, -0.3, 0)
  furadeira.add(bateria)
  const bateriaFaixa = rbox(0.245, 0.02, 0.175, 0.008, YELLOW, { roughness: 0.4 })
  bateriaFaixa.position.set(-0.17, -0.265, 0)
  furadeira.add(bateriaFaixa)
  // as duas alças laterais, cada uma terminando dentro de uma mão
  for (const sz of [-1, 1]) {
    const haste = cylinder(0.026, 0.026, halfSpan, '#3d4249', { roughness: 0.3, metalness: 0.7 }, 16)
    haste.rotation.x = Math.PI / 2
    haste.position.set(0, 0.0, sz * halfSpan / 2)
    furadeira.add(haste)
    const punho = capsuleZ(0.04, 0.07, RUBBER)
    punho.position.set(0, 0.0, sz * (halfSpan - 0.035))
    furadeira.add(punho)
  }

  // ---- cavalete de apresentação ---------------------------------------------
  const E_YAW = -0.72
  const front = new THREE.Vector3(Math.sin(E_YAW), 0, Math.cos(E_YAW))
  const EGG_Z = 0.4 // ovo à frente do plano das pernas
  const cavalete = new THREE.Group()
  cavalete.position.set(eggC.x - front.x * EGG_Z, 0, eggC.z - front.z * EGG_Z)
  cavalete.rotation.y = E_YAW
  root.add(cavalete)

  const trayY = eggBottom - CUP_SEAT // topo da bandeja (mundo)
  const APEX = 2.2
  for (const sx of [-1, 1]) {
    cavalete.add(bar(new THREE.Vector3(sx * 0.52, GY, 0.16), new THREE.Vector3(sx * 0.1, APEX, -0.2), 0.035, EASEL))
    const pe = rbox(0.09, 0.03, 0.09, 0.012, EASEL_DARK, { roughness: 0.7 })
    pe.position.set(sx * 0.52, GY + 0.015, 0.16)
    cavalete.add(pe)
  }
  cavalete.add(bar(new THREE.Vector3(0, GY, -0.85), new THREE.Vector3(0, APEX - 0.05, -0.24), 0.032, EASEL))
  const topo = rbox(0.36, 0.12, 0.12, 0.03, EASEL_DARK, { roughness: 0.7 })
  topo.position.set(0, APEX, -0.2)
  cavalete.add(topo)
  const bandeja = rbox(0.92, 0.045, 0.56, 0.015, EASEL, { roughness: 0.7 })
  bandeja.position.set(0, trayY - 0.0225, EGG_Z - 0.08)
  cavalete.add(bandeja)
  const aba = rbox(0.92, 0.06, 0.035, 0.012, EASEL_DARK, { roughness: 0.7 })
  aba.position.set(0, trayY + 0.01, EGG_Z + 0.19)
  cavalete.add(aba)
  for (const sx of [-1, 1]) {
    const mao = bar(
      new THREE.Vector3(sx * 0.36, trayY - 0.3, 0.07),
      new THREE.Vector3(sx * 0.36, trayY - 0.04, EGG_Z + 0.12),
      0.018,
      EASEL_DARK,
    )
    cavalete.add(mao)
  }
  // porta-ovo de louça sobre a bandeja
  const portaOvo = lathe(
    [
      [0, 0], [0.2, 0], [0.21, 0.025], [0.09, 0.055], [0.075, 0.1], [0.14, 0.14],
      [0.27, 0.21], [0.315, 0.27], [0.3, 0.285], [0.24, 0.24], [0, CUP_SEAT],
    ],
    CUP,
    { roughness: 0.2 },
  )
  portaOvo.position.set(0, trayY, EGG_Z)
  cavalete.add(portaOvo)

  // ---- OVO gigante --------------------------------------------------------------
  const ovo = new THREE.Group()
  ovo.position.set(eggC.x, eggBottom, eggC.z)
  root.add(ovo)
  const casca = lathe(eggProfile(), SHELL, { roughness: 0.42, detail: 0.35 }, 64)
  ovo.add(casca)
  // anel de sombra onde a casca encosta no porta-ovo
  const assento = torus(eggRadiusAt(0.12) - 0.01, 0.012, SHELL_SHADE, { roughness: 0.8 })
  assento.rotation.x = Math.PI / 2
  assento.position.y = 0.12
  ovo.add(assento)
  // ---- jorro de CLARA ---------------------------------------------------------
  // sai do furo para trás e para cima, por cima da furadeira, e cai na mesa
  const start = hole.clone().add(new THREE.Vector3(0, 0.08, 0.04)).addScaledVector(dir, -0.02)
  const land = new THREE.Vector3(T_X + 0.2, TOP + 0.01, T_Z + 0.22)
  const c1 = start.clone().add(new THREE.Vector3(-0.32, 0.75, 0.08))
  const c2 = land.clone().add(new THREE.Vector3(0.12, 0.85, 0.25))
  const curva = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    c1.sub(start),
    c2.sub(start),
    land.clone().sub(start),
  )
  const SEG = 64
  const RAD = 14
  const raio = (t: number) => 0.075 + 0.04 * Math.sin(Math.PI * Math.min(t * 1.3, 1)) - 0.025 * t
  const tubo = new THREE.TubeGeometry(curva, SEG, 1, RAD, false)
  {
    const pos = tubo.attributes.position
    const v = new THREE.Vector3()
    for (let j = 0; j <= SEG; j++) {
      const c = curva.getPointAt(j / SEG)
      for (let i = 0; i <= RAD; i++) {
        const k = j * (RAD + 1) + i
        v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(raio(j / SEG)).add(c)
        pos.setXYZ(k, v.x, v.y, v.z)
      }
    }
    tubo.computeVertexNormals()
  }
  const jorro = new THREE.Group()
  jorro.position.copy(start)
  root.add(jorro)
  const fio = new THREE.Mesh(tubo, mat(CLARA, CLARA_OPTS))
  translucent(fio, 0.82)
  jorro.add(fio)
  // rachaduras que se espalham do furo pela casca (do lado da câmera): vêm
  // com o jorro, então só aparecem quando a broca entra
  const aHole = Math.atan2(-dir.z, -dir.x)
  const hHole = HIT_H + 0.02 * DS
  const naCasca = (da: number, dh: number) => {
    const h = hHole + dh
    const r = eggRadiusAt(h) + 0.004
    const a = aHole + da
    return new THREE.Vector3(eggC.x + Math.cos(a) * r, eggBottom + h, eggC.z + Math.sin(a) * r).sub(start)
  }
  for (const trinca of [
    [[-0.08, 0.03], [-0.25, 0.1], [-0.42, 0.05], [-0.62, 0.15], [-0.82, 0.1], [-1.0, 0.18]],
    [[-0.2, 0.07], [-0.32, 0.2], [-0.5, 0.24], [-0.62, 0.38]],
    [[-0.2, -0.04], [-0.36, -0.13], [-0.52, -0.1], [-0.66, -0.21], [-0.84, -0.23]],
    [[-0.12, -0.07], [-0.2, -0.2], [-0.34, -0.25]],
  ]) {
    for (let i = 0; i < trinca.length - 1; i++) {
      const a = naCasca(trinca[i][0], trinca[i][1])
      const b = naCasca(trinca[i + 1][0], trinca[i + 1][1])
      const seg = b.clone().sub(a)
      const risco = rbox(seg.length() + 0.02, 0.02, 0.02, 0.008, '#5e4a33', { roughness: 0.9 })
      risco.position.copy(a).add(b).multiplyScalar(0.5)
      risco.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), seg.normalize())
      jorro.add(risco)
    }
  }
  // coroa de respingos estourando em volta da broca, no furo
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    const r = 0.1 + rand() * 0.05
    const off = new THREE.Vector3(0, Math.sin(a) * r, 0).addScaledVector(
      new THREE.Vector3(-dir.z, 0, dir.x),
      Math.cos(a) * r,
    )
    const gota = sphere(0.022 + rand() * 0.012, CLARA, CLARA_OPTS, 14)
    gota.position.copy(off).addScaledVector(dir, -0.06).add(new THREE.Vector3(0, -0.08, -0.04))
    translucent(gota, 0.7)
    jorro.add(gota)
  }
  // gotas soltas ao longo do arco
  for (let i = 0; i < 9; i++) {
    const t = 0.15 + i * 0.09
    const p = curva.getPointAt(Math.min(t, 0.97))
    const gota = sphere(0.022 + rand() * 0.02, CLARA, CLARA_OPTS, 14)
    gota.position.set(p.x + (rand() - 0.5) * 0.22, p.y + (rand() - 0.2) * 0.16, p.z + (rand() - 0.5) * 0.22)
    translucent(gota, 0.6)
    jorro.add(gota)
  }

  // ---- poça de clara sobre a mesa -----------------------------------------------
  const poca = new THREE.Group()
  poca.position.copy(land).setY(TOP)
  root.add(poca)
  const lamina = cylinder(0.32, 0.34, 0.02, CLARA, CLARA_OPTS, 40)
  lamina.scale.set(1.15, 1, 0.75)
  lamina.position.y = 0.012
  translucent(lamina, 0.55)
  poca.add(lamina)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rand()
    const blob = sphere(0.08 + rand() * 0.04, CLARA, CLARA_OPTS, 18)
    blob.scale.set(1, 0.22, 1)
    blob.position.set(Math.cos(a) * 0.3, 0.012, Math.sin(a) * 0.2)
    translucent(blob, 0.55)
    poca.add(blob)
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const respingo = sphere(0.022, CLARA, CLARA_OPTS, 12)
    respingo.position.set(Math.cos(a) * 0.14, 0.06 + rand() * 0.05, Math.sin(a) * 0.1)
    translucent(respingo, 0.6)
    poca.add(respingo)
  }

  // ---- cadeira tombada atrás do Frank ---------------------------------------
  const fwd = new THREE.Vector3(Math.sin(F_YAW), 0, Math.cos(F_YAW))
  const cadeira = new THREE.Group()
  const chairPivot = new THREE.Vector3(F_X, GY, F_Z).addScaledVector(fwd, -0.75)
  cadeira.position.set(chairPivot.x, GY + 0.04, chairPivot.z)
  cadeira.rotation.order = 'YXZ'
  cadeira.rotation.set(-1.45, F_YAW, 0)
  cadeira.add(makeChair())
  root.add(cadeira)

  // ---- caixa de ferramentas no chão ---------------------------------------------
  const caixa = new THREE.Group()
  caixa.position.set(-1.5, GY, 0.82)
  caixa.rotation.y = 0.35
  root.add(caixa)
  const corpoCaixa = rbox(0.56, 0.22, 0.3, 0.03, TOOLBOX, { roughness: 0.45, metalness: 0.3 })
  corpoCaixa.position.y = 0.11
  caixa.add(corpoCaixa)
  const friso = rbox(0.57, 0.035, 0.31, 0.012, TOOLBOX_DARK, { roughness: 0.45, metalness: 0.3 })
  friso.position.y = 0.2
  caixa.add(friso)
  for (const sx of [-1, 1]) {
    const poste = rbox(0.04, 0.2, 0.07, 0.015, TOOLBOX_DARK, { roughness: 0.45, metalness: 0.3 })
    poste.position.set(sx * 0.24, 0.3, 0)
    caixa.add(poste)
  }
  const alcaCaixa = cylinder(0.022, 0.022, 0.5, TOOLBOX_DARK, { roughness: 0.45, metalness: 0.3 }, 16)
  alcaCaixa.rotation.z = Math.PI / 2
  alcaCaixa.position.y = 0.39
  caixa.add(alcaCaixa)
  // chave inglesa e martelo pra fora da caixa
  const chave = new THREE.Group()
  chave.position.set(-0.13, 0.24, 0.05)
  chave.rotation.set(0.2, 0, 0.5)
  chave.add(rbox(0.04, 0.3, 0.02, 0.01, STEEL_LIGHT, { roughness: 0.3, metalness: 0.8 }))
  const boca1 = torus(0.04, 0.016, STEEL_LIGHT, { roughness: 0.3, metalness: 0.8 })
  boca1.position.y = 0.17
  chave.add(boca1)
  caixa.add(chave)
  const martelo = new THREE.Group()
  martelo.position.set(0.12, 0.22, -0.04)
  martelo.rotation.set(-0.25, 0, -0.35)
  martelo.add(cylinder(0.02, 0.022, 0.36, WOOD_TOOL, { roughness: 0.6 }, 12))
  const cabeca = rbox(0.16, 0.06, 0.06, 0.015, '#4b5158', { roughness: 0.3, metalness: 0.8 })
  cabeca.position.y = 0.19
  martelo.add(cabeca)
  caixa.add(martelo)
  const caixaTopo = new THREE.Vector3(-1.5, GY + 0.45, 0.82)

  // ---- peças ---------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'mesa', group: 'sala', object: mesa },
    { name: 'cavalete', group: 'projeto', object: cavalete },
    { name: 'ovo', group: 'projeto', object: ovo },
    { name: 'frank', group: 'frank', object: frank },
    { name: 'faiscas', group: 'faisca', object: faiscas },
    { name: 'cadeira', group: 'furadeira', object: cadeira },
    { name: 'bracos', group: 'furadeira', object: bracos },
    { name: 'caixa', group: 'furadeira', object: caixa },
    { name: 'furadeira', group: 'furadeira', object: furadeira },
    { name: 'jorro', group: 'clara', object: jorro },
    { name: 'poca', group: 'clara', object: poca },
  ]

  // ---- montagem ---------------------------------------------------------------
  const pre = P.clone().addScaledVector(dir, -LUNGE)
  const fPre = new THREE.Vector3(F_X, GY, F_Z).addScaledVector(dir, -LUNGE)
  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Reunião de segunda: brota a sala, com a mesa comprida e as cadeiras…',
    }),
    seq('mesa-rise', 'mesa', 0.25, 0.9, [riseFrom(0, 1.4)], { ease: 'easeOut' }),

    seq('cavalete-rise', 'cavalete', 1.7, 0.8, [riseFrom(0, 2.4)], {
      ease: 'easeOut',
      caption: 'No cavalete, em vez de slide, o chefe apresenta um OVO gigante — "o projeto novo" — e só fala em siglas.',
    }),
    seq('ovo-pousa', 'ovo', 2.3, 0.75, [
      ...grow(0.05),
      ch('position.y', eggBottom + 0.8, eggBottom),
    ], { ease: 'easeOut' }),

    seq('frank-rise', 'frank', 3.9, 0.9, [riseFrom(GY, 2.3)], {
      ease: 'easeOut',
      caption: 'Na ponta da mesa, o FRANKENSTEIN não entende nada…',
    }),

    seq('faiscas-pop', 'faiscas', 5.3, 0.45, grow(), {
      ease: 'easeOut',
      caption: '…e os parafusos do pescoço começam a soltar faísca!',
    }),

    seq('cadeira-tomba', 'cadeira', 6.6, 0.55, [ch('rotation.x', -0.55, -1.45), ch('position.y', GY + 0.02, GY + 0.04)], {
      ease: 'easeIn',
      caption: 'Ele se levanta de braços esticados e puxa da caixa de ferramentas uma FURADEIRA…',
    }),
    seq('bracos-ergue', 'bracos', 6.6, 0.8, [ch('rotation.x', 0, ARM_UP)], { ease: 'easeOut' }),
    seq('caixa-rise', 'caixa', 6.7, 0.6, [riseFrom(GY, 0.7)], { ease: 'easeOut' }),
    seq('furadeira-sai', 'furadeira', 7.4, 0.75, [
      ch('position.x', caixaTopo.x, pre.x),
      ch('position.y', caixaTopo.y, pre.y),
      ch('position.z', caixaTopo.z, pre.z),
      ch('scale.x', 0.3 * DS, DS), ch('scale.y', 0.3 * DS, DS), ch('scale.z', 0.3 * DS, DS),
    ], { ease: 'easeOut' }),

    seq('frank-investe', 'frank', 8.7, 0.45, [
      ch('position.x', fPre.x, F_X),
      ch('position.z', fPre.z, F_Z),
    ], {
      ease: 'easeIn',
      caption: '…e pergunta com voz de trovão: CAN-DU… FUR-CLÁRA? — dá pra furar até a CLARA?',
    }),
    seq('furadeira-crava', 'furadeira', 8.7, 0.45, [
      ch('position.x', pre.x, P.x),
      ch('position.z', pre.z, P.z),
    ], { ease: 'easeIn' }),

    seq('jorro-sai', 'jorro', 9.25, 0.7, grow(), {
      ease: 'easeOut',
      caption: 'A broca fura a casca e jorra a CLARA transparente: pela primeira vez, todo mundo enxerga o que tem lá dentro.',
    }),
    seq('poca-espalha', 'poca', 9.85, 0.6, [ch('scale.x', 0.05, 1), ch('scale.z', 0.05, 1)], { ease: 'easeOut' }),

    seq('faiscas-pulsa', 'faiscas', 11.0, 0.35, [ch('scale.x', 1, 1.35), ch('scale.y', 1, 1.35), ch('scale.z', 1, 1.35)], {
      ease: 'easeOut',
      caption: 'Kan du förklara? — Pode explicar?',
    }),
    seq('faiscas-volta', 'faiscas', 11.35, 0.45, [ch('scale.x', 1.35, 1), ch('scale.y', 1.35, 1), ch('scale.z', 1.35, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.05, 2.62, 4.35], target: [-0.05, 1.04, -0.2] },
  }
}

/** Cápsula deitada ao longo de z (punhos das alças). */
function capsuleZ(r: number, len: number, color: string) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 16), mat(color, { roughness: 0.6, size: len }))
  m.rotation.x = Math.PI / 2
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export const card: Card = {
  meta: {
    id: 'kan-du-forklara',
    contexto:
      "Trabalho e burocracia: em reunião, quando alguém solta uma sigla ou um termo técnico; no banco, na Försäkringskassan, no médico, diante de uma regra ou formulário que você não entendeu. Dá pra completar: 'Kan du förklara vad det betyder?'",
    fraseFonte: 'Pode explicar?',
    fraseAlvo: 'Kan du förklara?',
    pronuncia:
      "kan dü fö(r)-KLÁÁ-ra? ('kan' como em 'cana', sem nasal; 'du' com Ü de bico; o 'för' é um 'fö' fraquinho e rápido, de lábios arredondados, com R leve que já encosta no K, e SEM chiado — aqui não tem 'rs', então nada do CH de 'förstår'; a força cai no KLÁ, A LONGO, R de um toque só e o -a final fraco)",
    ponteSonora:
      "CAN-DU... FUR-CLÁRA? (5 sílabas: kan-dü-fö-KLÁÁ-ra; tônica forte no CLÁ; CAN-DU é o 'kan du' de sempre — C+A+N como em 'cana', sem o glide de 'quando', e o DU com BICO DE PATO (Ü); FUR = o FURA da FURADEIRA sem o -A, o MESMO FUR do FURA-LOTE de 'Förlåt' e do FU de 'Var försiktig': fraquinho e rápido, com R brando que já encosta no C — é o 'för' sem força, e FUR-CLÁRA é UMA palavra só, sem pausa nem acento no FUR (nunca 'FUR... clara' nem 'fura-clara' com o -A, que cria sílaba a mais); ATENÇÃO: não é o FEIXE do Thor de 'förstår' — lá tem 'rs' e sai chiado (fesh-TÔR); aqui não tem S nenhum, então nada de CH: fur-CLÁ-ra, nunca 'fesh-CLÁ-ra'; CLÁRA = a CLARA do ovo INTEIRA, com o -A: força no CLÁ, A LONGO e aberto, R de um toque só, de 'caro', e o -a final fraquinho; é a mesma CLARA de 'Jag är klar', só que lá ela perde o -A e aqui sai INTEIRA do ovo — 'förklara' termina em -a; e é literal: för-klara = esclarecer, deixar claro)",
    historia:
      "Reunião de segunda: no cavalete, em vez de slide, o chefe apresenta um OVO gigante — 'o projeto novo' — e só fala em siglas. Na ponta da mesa, o FRANKENSTEIN não entende nada, e os parafusos do pescoço começam a soltar faísca. Ele se levanta de braços esticados, puxa da caixa de ferramentas uma FURADEIRA e pergunta, com voz de trovão: 'CAN-DU... FUR-CLÁRA?' — dá pra furar até a clara? Pra mostrar o que quer, crava a broca na casca: sai um jorro de CLARA transparente e, pela primeira vez, todo mundo enxerga o que tem lá dentro. Pode explicar?",
  },
  createScene,
}

export default card
