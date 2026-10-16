import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Kan du visa mig på kartan?" — CAN-DU... VÍ-SSA, M'ÊI, PÔ, CÁRTA-N?
 *
 * No gramado do parque, uma CARTA de navegador (mapa antigo, rosa dos ventos,
 * lago azul) aberta no chão. O kiwi — bolota de penugem com bico de agulha —
 * arremessa um cartão VISA dourado que passa raspando no nariz de quem assiste
 * e crava de pé no pontinho vermelho; aí encosta as narinas da ponta do bico
 * na carta, do lado do cartão, e funga: NNN — é aqui.
 *
 * Ouro saturado é o acento: SÓ o cartão. O resto é verde de parque, papel
 * envelhecido, tinta marrom e o azul do lago.
 */

const TERRA = '#7a5236'
const GRAMA = '#93c46c'
const GRAMA_ESC = '#7fb25c'
const FOLHA = '#6fa34f'
const ARBUSTO = '#4f8a45'
const PEDRA = '#9a958c'
const MADEIRA = '#a8743f'
const MADEIRA_ESC = '#7a5130'
const PAPEL = '#ead7a6'
const PAPEL_ESC = '#dcc28c'
const MANCHA = '#d9c08a'
const TINTA = '#7a5230'
const LAGO = '#6aa8d6'
const LAGO_ESC = '#3f78a8'
const VERMELHO = '#cf3b2f'
const PENA = '#7c6149'
const PENA_CLARA = '#87694f'
const PENA_ESC = '#715641'
const PERNA = '#bdb08a'
const GARRA = '#5e5446'
const BICO = '#e6d5b0'
const OLHO = '#141414'
const OURO = '#f5c233' // acento saturado: SÓ o cartão VISA
const OURO_CLARO = '#f8d36a'
const MARINHO = '#1b2c78'
const CHIP = '#cfd2d6'
const VENTO = '#f3f7fa'

const GY = 0.2 // topo do gramado
const PAPEL_T = 0.016
const MAP_TOP = GY + PAPEL_T

// mapa: centro e tamanho (eixo longo em x, rolos nas pontas)
const MX = 0.35
const MZ = 0.45
const MW = 2.8
const MD = 1.75
const ROLO_R = 0.085

// kiwi: posição final, guinada e escala (penugem 1.5 de altura)
const KX = -0.35
const KZ = -0.85
const KX0 = -1.55 // onde ele brota antes de andar
const KYAW = 0.75
const KYAW0 = 1.5
const KS = 1.1
const NECK = new THREE.Vector3(0, 0.98, 0.6) // pivô da cabeça (local do kiwi)
const HEAD_DOWN = 0.75 // pose final: bico na carta
const HEAD_UP = -0.3 // cabeça erguida quando chega
const BICO_PITCH = 0.2
const BEND = 0.09 // curvatura do bico (fração do comprimento)

// cartão
const CARD_W = 0.78
const CARD_H = 0.5
const CARD_T = 0.022
const CARD_BURY = 0.03
const CARD_TILT_X = -0.2 // reclinado para a câmera, que está acima
const CARD_TILT_Z = 0.12

const CAM: [number, number, number] = [0.5, 2.5, 4.55]
const TARGET: [number, number, number] = [0.3, 0.78, 0.05]

/** Traço de letra do cartão: caixinha azul-marinho em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.012, 0.006, MARINHO, { roughness: 0.4 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** V I S A — letras de traço grosso, 0.2 de altura. */
function letter(which: 'V' | 'I' | 'S' | 'A') {
  const g = new THREE.Group()
  const t = 0.042
  if (which === 'V') {
    g.add(stroke(t, 0.21, -0.034, 0, 0.33))
    g.add(stroke(t, 0.21, 0.034, 0, -0.33))
  } else if (which === 'I') {
    g.add(stroke(t, 0.2, 0, 0))
  } else if (which === 'S') {
    g.add(stroke(0.12, t, 0.004, 0.079))
    g.add(stroke(t, 0.1, -0.04, 0.04))
    g.add(stroke(0.11, t, 0, 0))
    g.add(stroke(t, 0.1, 0.04, -0.04))
    g.add(stroke(0.12, t, -0.004, -0.079))
  } else {
    g.add(stroke(t, 0.21, -0.034, 0, -0.33))
    g.add(stroke(t, 0.21, 0.034, 0, 0.33))
    g.add(stroke(0.07, 0.034, 0, -0.03))
  }
  return g
}

/** Arco de tinta/vento: toro parcial (o helper torus é sempre fechado). */
function arc(r: number, tube: number, angle: number, color: string, opts = {}) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 40, angle), mat(color, { size: r * 2, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(4417)

  // ---- base: gramado do parque sobre a borda de terra ----------------------
  const base = new THREE.Group()
  const terra = cylinder(2.76, 2.86, 0.14, TERRA, { roughness: 0.95 })
  terra.position.y = 0.07
  base.add(terra)
  const grama = cylinder(2.74, 2.76, 0.07, GRAMA, { roughness: 0.92 })
  grama.position.y = GY - 0.035
  base.add(grama)

  for (const [mx, mz, mr] of [[-1.7, 0.6, 0.5], [1.9, -0.5, 0.45], [-1.2, -1.6, 0.4], [0.2, 1.95, 0.45]] as const) {
    const mancha = cylinder(mr, mr, 0.01, GRAMA_ESC, { roughness: 0.92 })
    mancha.position.set(mx, GY + 0.002, mz)
    mancha.scale.z = 0.7
    base.add(mancha)
  }

  // tufos de capim e florzinhas longe do mapa, do kiwi e da placa
  const livre = (x: number, z: number) => {
    const noMapa = Math.abs(x - MX) < MW / 2 + 0.2 && Math.abs(z - MZ) < MD / 2 + 0.2
    const noKiwi = Math.hypot(x - KX, z - KZ) < 0.95
    const naPlaca = Math.hypot(x - 1.95, z + 1.05) < 0.4
    return !noMapa && !noKiwi && !naPlaca
  }
  let n = 0
  while (n < 24) {
    const a = rand() * Math.PI * 2
    const rr = 0.8 + rand() * 1.8
    const x = Math.cos(a) * rr
    const z = Math.sin(a) * rr
    if (!livre(x, z)) continue
    n++
    const tufo = new THREE.Group()
    tufo.position.set(x, GY, z)
    for (let k = 0; k < 3; k++) {
      const folha = cone(0.025, 0.13 + rand() * 0.06, k % 2 ? GRAMA_ESC : FOLHA, { roughness: 0.9 }, 6)
      folha.position.set((rand() - 0.5) * 0.06, 0.06, (rand() - 0.5) * 0.06)
      folha.rotation.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5)
      tufo.add(folha)
    }
    if (n % 3 === 0) {
      const flor = sphere(0.035, n % 2 ? '#ffffff' : '#f2d04a', { roughness: 0.6 })
      flor.position.y = 0.17
      tufo.add(flor)
    }
    base.add(tufo)
  }
  for (const [px, pz, pr, ps] of [[-2.2, 0.35, 0.13, 11], [1.15, -1.75, 0.1, 12], [2.3, 0.9, 0.12, 13]] as const) {
    const pedra = rock(pr, PEDRA, ps, { roughness: 0.9 })
    pedra.position.set(px, GY + pr * 0.35, pz)
    base.add(pedra)
  }
  for (const [bx, bz, br, bs] of [[-1.95, -1.35, 0.36, 21], [-2.15, 1.15, 0.26, 22], [2.3, -0.2, 0.3, 23]] as const) {
    const arbusto = puff(br, ARBUSTO, 6, bs, { roughness: 0.9 })
    arbusto.position.set(bx, GY + br * 0.6, bz)
    arbusto.scale.y = 0.85
    base.add(arbusto)
  }
  root.add(base)

  // ---- placa de direção de madeira, três setas para lados diferentes --------
  const placa = new THREE.Group()
  placa.position.set(1.95, GY, -1.05)
  placa.rotation.set(0, -0.35, -0.05)
  const poste = cylinder(0.055, 0.065, 1.55, MADEIRA_ESC, { roughness: 0.8 })
  poste.position.y = 0.775
  placa.add(poste)
  const chapeu = cone(0.09, 0.1, MADEIRA_ESC, { roughness: 0.8 }, 4)
  chapeu.position.y = 1.6
  chapeu.rotation.y = Math.PI / 4
  placa.add(chapeu)
  for (const [sy, yaw, dir] of [[1.38, 0.15, 1], [1.13, -0.5, -1], [0.88, 0.9, 1]] as const) {
    const seta = new THREE.Group()
    seta.position.y = sy
    seta.rotation.y = yaw
    const tabua = rbox(0.56, 0.15, 0.04, 0.02, MADEIRA, { roughness: 0.75 })
    tabua.position.x = dir * 0.3
    seta.add(tabua)
    const ponta = rbox(0.108, 0.108, 0.04, 0.015, MADEIRA, { roughness: 0.75 })
    ponta.position.x = dir * 0.58
    ponta.rotation.z = Math.PI / 4
    ponta.scale.x = 0.95
    seta.add(ponta)
    // filete escuro: pintura gasta da seta
    const filete = rbox(0.4, 0.025, 0.012, 0.008, MADEIRA_ESC, { roughness: 0.8 })
    filete.position.set(dir * 0.3, 0, 0.024)
    seta.add(filete)
    const prego = sphere(0.016, '#8d959e', { roughness: 0.3, metalness: 0.7 })
    prego.position.set(0, 0, 0.03)
    seta.add(prego)
    placa.add(seta)
  }
  root.add(placa)

  // ---- a CARTA: mapa antigo aberto no chão ---------------------------------
  const mapa = new THREE.Group()
  mapa.position.set(MX, GY, MZ)
  const folha = rbox(MW, PAPEL_T, MD, 0.006, PAPEL, { roughness: 0.85 })
  folha.position.y = PAPEL_T / 2
  mapa.add(folha)
  const tinta = (o: THREE.Object3D, x: number, z: number) => {
    o.position.set(x, PAPEL_T + 0.002, z)
    mapa.add(o)
  }
  // moldura de tinta
  for (const [w, d, x, z] of [
    [MW - 0.36, 0.022, 0, -MD / 2 + 0.13], [MW - 0.36, 0.022, 0, MD / 2 - 0.13],
    [0.022, MD - 0.26, -MW / 2 + 0.18, 0], [0.022, MD - 0.26, MW / 2 - 0.18, 0],
  ] as const) {
    tinta(rbox(w, 0.004, d, 0.002, TINTA, { roughness: 0.8 }), x, z)
  }
  // manchas de papel velho
  for (const [x, z, r] of [[-0.75, -0.2, 0.22], [0.95, 0.65, 0.18], [-0.2, 0.62, 0.14]] as const) {
    const m = cylinder(r, r, 0.003, MANCHA, { roughness: 0.9 }, 20)
    m.scale.z = 0.7
    tinta(m, x, z)
  }
  // montanhas Λ no canto da frente, à direita
  for (const [x, z, s] of [[0.98, 0.6, 1], [1.16, 0.56, 0.8]] as const) {
    const mont = new THREE.Group()
    for (const side of [-1, 1]) {
      const perna = rbox(0.022, 0.004, 0.17 * s, 0.002, TINTA, { roughness: 0.8 })
      perna.position.set(side * 0.045 * s, 0, 0)
      perna.rotation.y = side * 0.55
      mont.add(perna)
    }
    tinta(mont, x, z)
  }
  root.add(mapa)

  // rolos nas duas pontas (enrolam/desenrolam: giram no eixo z)
  const makeRolo = (side: number) => {
    const g = new THREE.Group()
    g.position.set(MX + side * MW / 2, GY + ROLO_R, MZ)
    const tubo = cylinder(ROLO_R, ROLO_R, MD + 0.04, PAPEL_ESC, { roughness: 0.85 })
    tubo.rotation.x = Math.PI / 2
    g.add(tubo)
    for (const end of [-1, 1]) {
      // espiral do papel enrolado, vista na ponta
      const espiral = torus(ROLO_R * 0.6, 0.009, TINTA, { roughness: 0.8 })
      espiral.position.set(0, 0, end * (MD / 2 + 0.021))
      espiral.scale.set(1, 0.85, 1)
      g.add(espiral)
      const miolo = cylinder(ROLO_R * 0.22, ROLO_R * 0.22, 0.01, MADEIRA_ESC, { roughness: 0.8 }, 16)
      miolo.rotation.x = Math.PI / 2
      miolo.position.set(ROLO_R * 0.15, 0.01, end * (MD / 2 + 0.021))
      g.add(miolo)
    }
    root.add(g)
    return g
  }
  const roloE = makeRolo(-1)
  const roloD = makeRolo(1)

  // ---- KIWI ----------------------------------------------------------------
  const kiwi = new THREE.Group()
  kiwi.position.set(KX, GY, KZ)
  kiwi.rotation.y = KYAW
  kiwi.scale.setScalar(KS)
  root.add(kiwi)

  // corpo de pera: traseira cheia, frente afinando para o pescoço
  const corpo = sphere(0.62, PENA, { roughness: 0.92 })
  corpo.scale.set(0.95, 0.88, 1.12)
  corpo.position.set(0, 0.82, -0.05)
  kiwi.add(corpo)
  const anca = sphere(0.5, PENA_ESC, { roughness: 0.92 })
  anca.position.set(0, 0.78, -0.36)
  kiwi.add(anca)
  const peito = sphere(0.42, PENA_CLARA, { roughness: 0.92 })
  peito.position.set(0, 0.68, 0.28)
  kiwi.add(peito)
  const pescoco = sphere(0.33, PENA, { roughness: 0.92 })
  pescoco.position.set(0, 0.86, 0.55)
  kiwi.add(pescoco)
  // tufos desgrenhados de penugem
  for (const [x, y, z, r] of [[0.32, 1.08, -0.3, 0.22], [-0.32, 1.06, -0.25, 0.22], [0, 1.22, -0.12, 0.24], [0, 0.95, -0.72, 0.2]] as const) {
    const tufo = sphere(r, PENA_ESC, { roughness: 0.92 })
    tufo.position.set(x, y, z)
    kiwi.add(tufo)
  }

  // pernas grossas com garras
  for (const side of [-1, 1]) {
    const coxa = sphere(0.17, PENA_ESC, { roughness: 0.92 })
    coxa.position.set(side * 0.24, 0.42, 0.0)
    kiwi.add(coxa)
    const tarso = capsule(0.075, 0.26, PERNA, { roughness: 0.7 })
    tarso.position.set(side * 0.25, 0.22, 0.04)
    tarso.rotation.x = 0.18
    kiwi.add(tarso)
    const pe = sphere(0.09, PERNA, { roughness: 0.7 })
    pe.scale.set(1, 0.6, 1.1)
    pe.position.set(side * 0.25, 0.05, 0.08)
    kiwi.add(pe)
    for (const k of [-1, 0, 1]) {
      const dedo = capsule(0.036, 0.15, PERNA, { roughness: 0.7 })
      dedo.position.set(side * 0.25 + k * 0.08, 0.035, 0.2)
      dedo.rotation.set(Math.PI / 2, 0, -k * 0.45)
      kiwi.add(dedo)
      const garra = cone(0.02, 0.06, GARRA, { roughness: 0.5 }, 10)
      garra.position.set(side * 0.25 + k * 0.155, 0.03, 0.31 - Math.abs(k) * 0.03)
      garra.rotation.set(Math.PI / 2, 0, -k * 0.45)
      kiwi.add(garra)
    }
    const dedoTras = capsule(0.032, 0.08, PERNA, { roughness: 0.7 })
    dedoTras.position.set(side * 0.25, 0.03, -0.06)
    dedoTras.rotation.x = Math.PI / 2
    kiwi.add(dedoTras)
  }

  // ---- cabeça (pivô no pescoço) --------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.copy(NECK)
  cabeca.rotation.x = HEAD_DOWN
  kiwi.add(cabeca)

  const cranio = sphere(0.25, PENA, { roughness: 0.92 })
  cranio.scale.set(0.95, 0.92, 1.05)
  cranio.position.set(0, 0.05, 0.22)
  cabeca.add(cranio)
  // nuca: esfera no pivô, sempre sobreposta ao pescoço — sem costura na junta
  const nuca = sphere(0.25, PENA, { roughness: 0.92 })
  nuca.position.set(0, -0.02, 0.02)
  cabeca.add(nuca)
  const testa = sphere(0.17, PENA_CLARA, { roughness: 0.92 })
  testa.position.set(0, 0.0, 0.36)
  cabeca.add(testa)

  for (const side of [-1, 1]) {
    const olho = sphere(0.04, OLHO, { roughness: 0.15 })
    olho.position.set(side * 0.17, 0.12, 0.37)
    cabeca.add(olho)
    const brilho = sphere(0.012, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.19, 0.145, 0.395)
    cabeca.add(brilho)
  }

  // bico: grupo em +z; a geometria é gerada depois de achar o comprimento
  const bico = new THREE.Group()
  bico.position.set(0, -0.02, 0.44)
  bico.rotation.x = BICO_PITCH
  cabeca.add(bico)

  // comprimento do bico para a ponta tocar o papel na pose final
  root.updateMatrixWorld(true)
  const b0 = bico.localToWorld(new THREE.Vector3(0, 0, 0))
  const b1 = bico.localToWorld(new THREE.Vector3(0, -BEND, 1))
  const BL = (MAP_TOP + 0.012 - b0.y) / (b1.y - b0.y)
  const tip = b0.clone().add(b1.clone().sub(b0).multiplyScalar(BL))

  const bicoMesh = lathe(
    [
      [0, -0.01], [0.058, 0], [0.056, 0.08 * BL], [0.045, 0.35 * BL], [0.031, 0.7 * BL],
      [0.021, 0.9 * BL], [0.014, 0.975 * BL], [0, BL],
    ],
    BICO,
    { roughness: 0.45 },
  )
  const geo = bicoMesh.geometry
  geo.rotateX(Math.PI / 2) // eixo y → z
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i)
    pos.setY(i, pos.getY(i) - (BEND * z * z) / BL)
  }
  geo.computeVertexNormals()
  bico.add(bicoMesh)
  // bigodes finos na base do bico (no bico, não na cabeça: o refine os derreteria)
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const bigode = capsule(0.006, 0.2, '#3b2c20', { roughness: 0.7 })
      const dir = new THREE.Vector3(side * 0.9, -0.3 + k * 0.22, 0.4).normalize()
      bigode.position.set(side * 0.075, -0.005 + k * 0.03, 0.04).addScaledVector(dir, 0.1)
      bigode.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
      bico.add(bigode)
    }
  }
  // narinas: anel mais escuro perto da ponta
  const narina = torus(0.016, 0.005, '#9c8a68', { roughness: 0.6 })
  narina.position.set(0, -BEND * 0.93 * 0.93 * BL, 0.93 * BL)
  narina.rotation.x = 2 * BEND * 0.93
  bico.add(narina)

  // ---- pontinho vermelho e cartão VISA ao lado da ponta do bico ------------
  const F = new THREE.Vector3(tip.x + 0.47, MAP_TOP, tip.z + 0.04)
  const camDir = new THREE.Vector3(CAM[0] - F.x, 0, CAM[2] - F.z)
  const CARD_YAW = Math.atan2(camDir.x, camDir.z)

  const ponto = new THREE.Group()
  ponto.position.set(F.x, MAP_TOP + 0.002, F.z)
  const disco = cylinder(0.1, 0.1, 0.006, VERMELHO, { roughness: 0.6 }, 28)
  ponto.add(disco)
  const anel = torus(0.17, 0.013, VERMELHO, { roughness: 0.6 })
  anel.rotation.x = Math.PI / 2
  ponto.add(anel)
  root.add(ponto)

  // trilha tracejada de tinta: da rosa dos ventos até o ponto
  const trilha = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, 0, 0.82),
    new THREE.Vector3(-0.3, 0, 0.42),
    new THREE.Vector3(0.05, 0, 0.18),
    new THREE.Vector3(0.45, 0, -0.08),
    new THREE.Vector3(F.x - MX - 0.22, 0, F.z - MZ - 0.12),
  ])
  for (let i = 0; i <= 13; i++) {
    const u = i / 13
    const p = trilha.getPointAt(u)
    const tg = trilha.getTangentAt(u)
    const traco = rbox(0.026, 0.004, 0.075, 0.002, TINTA, { roughness: 0.8 })
    traco.rotation.y = Math.atan2(tg.x, tg.z)
    tinta(traco, p.x, p.z)
  }

  // rosa dos ventos no canto da frente, à esquerda
  const rosa = new THREE.Group()
  rosa.position.set(-0.72, MAP_TOP + 0.003, 0.98)
  const aro = torus(0.22, 0.012, TINTA, { roughness: 0.8 })
  aro.rotation.x = Math.PI / 2
  rosa.add(aro)
  // pontas em losango: quadrado girado 45° e esticado ao longo do raio
  for (let k = 0; k < 8; k++) {
    const longa = k % 2 === 0
    const L = longa ? 0.36 : 0.22
    const w = longa ? 0.085 : 0.06
    const raio = new THREE.Group()
    raio.rotation.y = (-k * Math.PI) / 4
    const molde = new THREE.Group()
    molde.position.z = -L / 2
    molde.scale.set(w / 0.1414, 1, L / 0.1414)
    const losango = rbox(0.1, longa ? 0.006 : 0.004, 0.1, 0.004, longa ? TINTA : '#a77c4c', { roughness: 0.8 })
    losango.rotation.y = Math.PI / 4
    molde.add(losango)
    raio.add(molde)
    rosa.add(raio)
  }
  const centro = cylinder(0.035, 0.035, 0.008, TINTA, { roughness: 0.8 }, 16)
  rosa.add(centro)
  root.add(rosa)

  // lago azul no meio do mapa, com margem mais escura
  const lago = new THREE.Group()
  lago.position.set(0.5, MAP_TOP + 0.002, 0.82)
  for (const [x, z, r, sx] of [[0, 0, 0.3, 1.5], [0.28, -0.06, 0.2, 1.2], [-0.32, 0.06, 0.18, 1.2]] as const) {
    const margem = cylinder(r + 0.035, r + 0.035, 0.004, LAGO_ESC, { roughness: 0.5 }, 28)
    margem.position.set(x, 0, z)
    margem.scale.x = sx
    lago.add(margem)
    const agua = cylinder(r, r, 0.007, LAGO, { roughness: 0.35 }, 28)
    agua.position.set(x, 0.001, z)
    agua.scale.x = sx
    lago.add(agua)
  }
  // reflexo claro na água
  const reflexo = cylinder(0.1, 0.1, 0.004, '#8fc2e8', { roughness: 0.3 }, 24)
  reflexo.scale.x = 2.0
  reflexo.position.set(-0.08, 0.006, -0.08)
  lago.add(reflexo)
  root.add(lago)

  // ---- cartão VISA dourado, cravado de pé no ponto -------------------------
  const cartao = new THREE.Group() // origem: a aresta de baixo, cravada no papel
  cartao.position.copy(F)
  cartao.rotation.set(CARD_TILT_X, CARD_YAW, CARD_TILT_Z)
  root.add(cartao)

  const face = new THREE.Group()
  face.position.y = CARD_H / 2 - CARD_BURY
  cartao.add(face)
  const placaCartao = rbox(CARD_W, CARD_H, CARD_T, 0.045, OURO, { roughness: 0.32, metalness: 0.35 })
  face.add(placaCartao)
  // faixa de brilho do ouro
  const brilhoOuro = rbox(CARD_W - 0.08, 0.05, 0.004, 0.02, OURO_CLARO, { roughness: 0.25, metalness: 0.35 })
  brilhoOuro.position.set(0, 0.2, CARD_T / 2)
  face.add(brilhoOuro)
  const chip = rbox(0.12, 0.09, 0.008, 0.015, CHIP, { roughness: 0.3, metalness: 0.7 })
  chip.position.set(-0.24, 0.1, CARD_T / 2 + 0.002)
  face.add(chip)
  for (const cy of [-0.015, 0.015]) {
    const linha = rbox(0.1, 0.006, 0.004, 0.002, '#9ea2a8', { roughness: 0.4, metalness: 0.6 })
    linha.position.set(-0.24, 0.1 + cy, CARD_T / 2 + 0.006)
    face.add(linha)
  }
  const letras: ['V' | 'I' | 'S' | 'A', number][] = [['V', -0.215], ['I', -0.095], ['S', 0.03], ['A', 0.185]]
  for (const [gl, lx] of letras) {
    const l = letter(gl)
    l.position.set(lx, -0.06, CARD_T / 2 + 0.004)
    l.scale.setScalar(1.08)
    face.add(l)
  }
  // verso: tarja magnética (aparece quando o cartão gira no voo)
  const tarja = rbox(CARD_W - 0.01, 0.09, 0.004, 0.01, '#2a2a2e', { roughness: 0.4 })
  tarja.position.set(0, 0.13, -CARD_T / 2 - 0.001)
  face.add(tarja)

  // ---- rastros de vento atrás do cartão ------------------------------------
  const vento = new THREE.Group()
  vento.position.copy(F)
  vento.rotation.y = CARD_YAW
  root.add(vento)
  for (const [h, r] of [[0.48, 1.0], [0.34, 1.1], [0.2, 1.2]] as const) {
    const ang = 0.5
    const fim = Math.PI * 0.78 // ponta perto do cartão
    const c = new THREE.Vector2(CARD_W / 2 + 0.05 - r * Math.cos(fim), h - r * Math.sin(fim))
    const rastro = arc(r, 0.02, ang, VENTO, { roughness: 0.5 })
    rastro.position.set(c.x, c.y, -0.06)
    rastro.rotation.z = fim - ang
    vento.add(rastro)
    for (const a of [fim, fim - ang]) {
      const tampa = sphere(0.02, VENTO, { roughness: 0.5 })
      tampa.position.set(c.x + r * Math.cos(a), c.y + r * Math.sin(a), -0.06)
      vento.add(tampa)
    }
  }

  // ---- voo do cartão: da asinha do kiwi, passando no seu nariz, até o ponto
  const asa = kiwi.localToWorld(new THREE.Vector3(-0.62, 0.78, 0.12))
  const camV = new THREE.Vector3(...CAM)
  const olhar = new THREE.Vector3(...TARGET).sub(camV).normalize()
  const nariz = camV.clone().add(olhar.multiplyScalar(2.0)).add(new THREE.Vector3(-0.25, -0.12, 0))
  const alto = F.clone().add(new THREE.Vector3(0.95, 0.75, 0.25))

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'parque', object: base },
    { name: 'placa', group: 'parque', object: placa },
    { name: 'roloE', group: 'carta', object: roloE },
    { name: 'roloD', group: 'carta', object: roloD },
    { name: 'mapa', group: 'carta', object: mapa },
    { name: 'rosa', group: 'desenhos', object: rosa },
    { name: 'lago', group: 'desenhos', object: lago },
    { name: 'kiwi', group: 'kiwi', object: kiwi },
    { name: 'cabeca', group: 'kiwi', object: cabeca },
    { name: 'bico', group: 'kiwi', object: bico },
    { name: 'cartao', group: 'visa', object: cartao },
    { name: 'vento', group: 'visa', object: vento },
    { name: 'ponto', group: 'po', object: ponto },
  ]

  // ---- montagem ------------------------------------------------------------
  const ROLL = (MW / 2 - 0.1) / ROLO_R // voltas do rolo ao desenrolar (rad)
  const spin = (a: number) => CARD_YAW + a * Math.PI
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Você está perdido no parque: a placa aponta pra todo lado e nada faz sentido.',
    }),
    seq('placa-rise', 'placa', 0.35, 0.8, [riseFrom(GY, 1.8)], { ease: 'easeOut' }),

    seq('roloE-rise', 'roloE', 1.5, 0.45, [riseFrom(GY + ROLO_R, 0.5), ch('position.x', MX - 0.1, MX - 0.1)], {
      ease: 'easeOut',
      caption: 'Você abre na grama uma CARTA enorme — um mapa antigo de navegador…',
    }),
    seq('roloD-rise', 'roloD', 1.5, 0.45, [riseFrom(GY + ROLO_R, 0.5), ch('position.x', MX + 0.1, MX + 0.1)], {
      ease: 'easeOut',
    }),
    seq('mapa-abre', 'mapa', 2.0, 0.9, [ch('scale.x', 0.06, 1)], { ease: 'easeOut' }),
    seq('roloE-abre', 'roloE', 2.0, 0.9, [ch('position.x', MX - 0.1, MX - MW / 2), ch('rotation.z', -ROLL, 0)], {
      ease: 'easeOut',
    }),
    seq('roloD-abre', 'roloD', 2.0, 0.9, [ch('position.x', MX + 0.1, MX + MW / 2), ch('rotation.z', ROLL, 0)], {
      ease: 'easeOut',
    }),

    seq('rosa-desenha', 'rosa', 3.1, 0.55, [ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1), ch('rotation.y', -1.5, 0)], {
      ease: 'easeOut',
      caption: '…com rosa dos ventos e um lago no meio. E você não acha nada.',
    }),
    seq('lago-desenha', 'lago', 3.35, 0.55, [ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1)], { ease: 'easeOut' }),

    seq('kiwi-surge', 'kiwi', 4.4, 0.6, [riseFrom(GY, 1.9), ch('position.x', KX0, KX0), ch('rotation.y', KYAW0, KYAW0)], {
      ease: 'easeOut',
      caption: 'Passa um kiwi, bolota de penugem com bico de agulha, e você implora: CAN-DU…?',
    }),
    seq('cabeca-olha', 'cabeca', 4.5, 0.5, [ch('rotation.x', -0.6, HEAD_UP)], { ease: 'easeOut' }),
    seq('bico-cresce', 'bico', 4.75, 0.5, [ch('scale.z', 0.15, 1)], { ease: 'easeOut' }),
    seq('kiwi-anda', 'kiwi', 5.0, 1.0, [ch('position.x', KX0, KX)], { ease: 'easeInOut' }),
    seq('kiwi-ginga-a', 'kiwi', 5.0, 0.25, [ch('rotation.z', 0, 0.07)]),
    seq('kiwi-ginga-b', 'kiwi', 5.25, 0.25, [ch('rotation.z', 0.07, -0.07)]),
    seq('kiwi-ginga-c', 'kiwi', 5.5, 0.25, [ch('rotation.z', -0.07, 0.05)]),
    seq('kiwi-ginga-d', 'kiwi', 5.75, 0.25, [ch('rotation.z', 0.05, 0)]),
    seq('kiwi-vira', 'kiwi', 5.75, 0.5, [ch('rotation.y', KYAW0, KYAW)], { ease: 'easeOut' }),

    seq('cartao-saca', 'cartao', 6.4, 0.3, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Ele tira de baixo da asinha um cartão VISA dourado e arremessa feito dardo: VÍ-SSSA!',
    }),
    seq('cartao-voa', 'cartao', 6.75, 0.5, [
      ch('position.x', asa.x, nariz.x), ch('position.y', asa.y, nariz.y), ch('position.z', asa.z, nariz.z),
      ch('rotation.y', spin(4), spin(2)), ch('rotation.z', 0.5, 0.3),
    ], { ease: 'easeIn' }),
    seq('cartao-nariz', 'cartao', 7.25, 0.45, [
      ch('position.x', nariz.x, alto.x), ch('position.y', nariz.y, alto.y), ch('position.z', nariz.z, alto.z),
      ch('rotation.y', spin(2), spin(1)), ch('rotation.z', 0.3, 0.5),
    ], {
      ease: 'linear',
      caption: 'O cartão passa raspando no seu nariz — você se encolhe: M\'ÊI!',
    }),
    seq('vento-risca', 'vento', 7.45, 0.5, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),
    seq('cartao-crava', 'cartao', 7.7, 0.28, [
      ch('position.x', alto.x, F.x), ch('position.y', alto.y, F.y), ch('position.z', alto.z, F.z),
      ch('rotation.y', spin(1), spin(0)),
    ], { ease: 'easeIn' }),
    seq('ponto-pop', 'ponto', 7.98, 0.2, [ch('scale.x', 0.01, 1.3), ch('scale.z', 0.01, 1.3)], {
      ease: 'easeOut',
      caption: '…e crava de pé no papel, bem em cima de um pontinho vermelho: PÔ!',
    }),
    seq('ponto-assenta', 'ponto', 8.18, 0.25, [ch('scale.x', 1.3, 1), ch('scale.z', 1.3, 1)], { ease: 'easeInOut' }),
    seq('cartao-vibra-a', 'cartao', 7.98, 0.12, [ch('rotation.z', 0.5, -0.1)], { ease: 'easeOut' }),
    seq('cartao-vibra-b', 'cartao', 8.1, 0.14, [ch('rotation.z', -0.1, 0.26)]),
    seq('cartao-vibra-c', 'cartao', 8.24, 0.18, [ch('rotation.z', 0.26, CARD_TILT_Z)], { ease: 'easeOut' }),

    seq('cabeca-desce', 'cabeca', 9.0, 0.85, [ch('rotation.x', HEAD_UP, HEAD_DOWN)], {
      ease: 'easeInOut',
      caption: 'O kiwi encosta as narinas da ponta do bico na CARTA, bem do lado do cartão…',
    }),
    seq('funga-a', 'cabeca', 10.2, 0.16, [ch('rotation.x', HEAD_DOWN, HEAD_DOWN - 0.08)], {
      caption: '…e funga conferindo: NNN — é aqui que você está. Ele te mostrou no mapa.',
    }),
    seq('funga-b', 'cabeca', 10.36, 0.16, [ch('rotation.x', HEAD_DOWN - 0.08, HEAD_DOWN)]),
    seq('funga-c', 'cabeca', 10.6, 0.16, [ch('rotation.x', HEAD_DOWN, HEAD_DOWN - 0.08)]),
    seq('funga-d', 'cabeca', 10.76, 0.16, [ch('rotation.x', HEAD_DOWN - 0.08, HEAD_DOWN)]),

    seq('ponto-pulsa', 'ponto', 11.5, 0.25, [ch('scale.x', 1, 1.3), ch('scale.z', 1, 1.3)], {
      ease: 'easeOut',
      caption: 'Kan du visa mig på kartan? — Você pode me mostrar no mapa?',
    }),
    seq('ponto-volta', 'ponto', 11.75, 0.35, [ch('scale.x', 1.3, 1), ch('scale.z', 1.3, 1)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-du-visa-mig-pa-kartan',
    contexto:
      "Direções: na rua, quando a pessoa começa o 'rakt fram, sen till vänster, sen...' rápido demais — você estende o celular com o mapa aberto e pede que ela aponte. Também no balcão de informação da estação, na trilha com o mapa de papel do bosque, no mapa de parede do hospital ou do campus. Apontar não exige vocabulário, e 'Kan du visa mig...?' é o molde de 'me mostra': 'Kan du visa mig hur man gör?' (me mostra como faz?).",
    fraseFonte: 'Você pode me mostrar no mapa?',
    fraseAlvo: 'Kan du visa mig på kartan?',
    pronuncia:
      "kan dü VÍÍ-sa mêi pô KÁÁR-tan? ('kan' seco, sem nasal; 'du' com bico de pato; 'visa' com força no VÍ, I LONGO e S de cobra — o sueco não tem Z: nunca 'víza'; 'mig' = mêi, uma sílaba só; 'på' = pô, Ô fechado de boca redonda; 'kartan' com força no KÁ e A LONGO, e o R não soa sozinho: a língua enrola pra trás e já dispara o T, num T meio abafado; o -an final é fraquinho, N de língua, sem nasalizar)",
    ponteSonora:
      "CAN-DU... VÍ-SSA, M'ÊI, PÔ, CÁRTA-N? (8 sílabas: kan-dü-VÍÍ-sa-mêi-pô-KÁÁR-tan; tônicas em VÍ e KÁR; CAN-DU é o 'kan du' de sempre — C+A+N como em 'cana', sem o glide de 'quando', e o DU com BICO DE PATO; VÍ-SSA = o cartão VISA, mas dito do jeito que ele VOA na história: o S do meio é o sibilo do cartão cortando o ar, S de COBRA — nunca o Z do 'víza' que a gente fala no caixa, porque o sueco NÃO TEM Z, o mesmo cuidado do CAÇA de 'Var är kassan?' —, e o VÍ é LONGO e leva a força: VÍÍ-sa; termina em -A: 'visa' é mostrar; M'ÊI = o 'mig' de sempre, de 'Kan du hjälpa mig?' e 'Jag har låst mig ute': uma sílaba só, nunca 'meia'; PÔ = o 'pô!' brasileiro, o MESMO PÔ de 'Kan du skicka det på mejl?' e 'Jag är på väg': Ô FECHADO de boca redonda, nunca 'pó'; CÁRTA = a CARTA dos navegadores — em português, 'carta' também é mapa (a carta náutica), e o sueco guardou a palavra: 'karta'; força no CÁ e A LONGO, e o R é o R caipira, que enrola a língua pra trás e já dispara o T — nunca o RR raspado carioca ('CÁH-ta'); é o mesmo truque do CÓRT(e) de 'Kan jag betala med kort?', só que lá é Ó ABERTO e curto (kort, o cartão) e aqui A LONGO (karta, o mapa) — o cartão desta cena NÃO é 'kort': vale só pelo NOME escrito nele, VISA; N = a fungada do kiwi colada no fim, NNN, ponta da língua atrás dos dentes e SEM nasalizar o A: é o 'a' de 'A carta' — sem ele sobra 'karta', um mapa qualquer)",
    historia:
      'Você está perdido no parque, com uma CARTA enorme — mapa antigo de navegador, rosa dos ventos e tudo — aberta na grama, e não acha nada. Passa um kiwi, aquela bola de penugem marrom com bico de agulha, e você implora: CAN-DU...? O kiwi quase não enxerga, mas não hesita: tira de baixo da asinha um cartão VISA dourado e arremessa feito dardo — VÍ-SSSA! —, o cartão corta o ar sibilando, passa raspando no seu nariz — você se encolhe: M\'ÊI! — e crava de pé no papel: PÔ! Aí ele encosta as narinas da ponta do bico na CARTA, bem ao lado do cartão, e funga conferindo — NNN: é aqui que você está; ele te mostrou no mapa.',
  },
  createScene,
  refine: { organic: ['kiwi', 'cabeca'] },
}

export default card
