import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Det gör inget." — DÊ… iiiÖR… ÍNG-et!
 *
 * Na trilha da floresta, o escorpião crava o ferrão na canela do cavaleiro —
 * mas a canela é de LATA: o ferrão entorta e risca um T prateado na ferrugem,
 * e quem ganha a ÍNGUA roxa é a ponta do rabo do próprio bicho. O cavaleiro
 * levanta a viseira (DÊ), se curva rangendo a armadura (iiiÖR) e dá dois
 * tapinhas no T: ÍNG-et — a íngua ficou no escorpião, na lata só sobrou o T.
 *
 * Diorama: disco de musgo com a trilha de terra clara, pinheiros ao fundo,
 * cavaleiro à esquerda com o pé numa pedra e a canela gigante virada para a
 * câmera; escorpião negro à direita, encolhido, de pinças juntas.
 */

const SOIL = '#5a4330'
const MOSS = '#5f7c3e'
const MOSS_DARK = '#48632f'
const DIRT = '#c8a676'
const BARK = '#5b4030'
const PINE = '#2f5a3f'
const PINE_DARK = '#25492f'
const STONE = '#8f9398'
const STONE_DARK = '#777b81'
const LEAF = '#b99a4a'
const STEEL = '#b3bbc2'
const STEEL_DARK = '#7d868e'
const RUST = '#bf6a33'
const RUST_DARK = '#7c3a1c'
const SHINE = '#f6f8fa' // o T riscado: o metal limpo por baixo da ferrugem
const PLUME = '#953a34'
const LEATHER = '#5b3b26'
const SKIN = '#e8c39e'
const MUSTACHE = '#8d8a86'
const SHELL = '#25222b'
const SHELL_LIGHT = '#36323f'
const STING = '#8c6a44'
const TEAR = '#62b8f2'
const INGUA = '#9440d6' // acento saturado RESERVADO: a íngua na ponta do rabo

const METAL = { metalness: 0.72, roughness: 0.34 }

const GY = 0.16 // topo do musgo
const CAM = new THREE.Vector3(0.33, 2.12, 3.75)
const TARGET = new THREE.Vector3(0.05, 1.0, 0.12)

// cavaleiro: posição/rotação no diorama e pose da perna apoiada na pedra
const KX = -0.55
const KZ = -0.22
const KR = 0.72
const LEG = 0.42 // altura do quadril
const STONE_H = 0.17 // topo da pedra onde ele apoia o pé
const HIP = new THREE.Vector3(-0.14, LEG, 0)
const KNEE = new THREE.Vector3(-0.15, 0.62, 0.55)
const TILT = 0.45 // tronco curvado (pose final)
const VISOR_UP = -1.0
const LIFT = -0.5 // perna erguida antes de pisar

// escorpião
const SX = 0.72
const SZ = 0.4
const SR = -0.78
const SY = GY - 0.05 // corpo baixo, rente ao chão
const STRIKE = 1.25
const SR_STRIKE = -1.62 // no bote ele gira de frente pra canela
const LUNGE = 0.45

/** Cápsula de a até b — coxas, patas, segmentos. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: Parameters<typeof mat>[1]) {
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const m = capsule(r, Math.max(0.001, len), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Malha de geometria própria (cascas abertas: elmo, viseira, ferrugem). */
function shell(geo: THREE.BufferGeometry, color: string, opts?: Parameters<typeof mat>[1]) {
  const material = mat(color, opts)
  material.side = THREE.DoubleSide
  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Mancha de ferrugem: disco achatado colado na superfície. */
function rustSpot(r: number, color = RUST) {
  const s = sphere(r, color, { roughness: 0.95 })
  s.scale.set(1, 1, 0.3)
  return s
}

function pine(h: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const trunk = cylinder(0.06 * h, 0.085 * h, h * 0.32, BARK, { roughness: 0.9 })
  trunk.position.y = h * 0.16
  g.add(trunk)
  for (let i = 0; i < 3; i++) {
    const c = cone(h * (0.36 - i * 0.08), h * 0.42, i % 2 ? PINE_DARK : PINE, { roughness: 0.85 })
    c.position.y = h * (0.42 + i * 0.2)
    c.rotation.y = rand() * Math.PI
    g.add(c)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  const cosK = Math.cos(KR)
  const sinK = Math.sin(KR)
  /** do referencial do cavaleiro (x, z) para o mundo */
  const kw = (x: number, z: number): [number, number] => [KX + x * cosK + z * sinK, KZ - x * sinK + z * cosK]

  // ---- trilha na floresta --------------------------------------------------
  const trilha = new THREE.Group()
  root.add(trilha)

  const soil = cylinder(2.6, 2.7, 0.12, SOIL, { roughness: 0.9 })
  soil.position.y = 0.06
  trilha.add(soil)

  const moss = cylinder(2.57, 2.6, 0.04, MOSS, { roughness: 0.95 })
  moss.position.y = 0.14
  trilha.add(moss)

  // a trilha: um largo disco de terra batida, com línguas saindo pelas bordas
  const trailMain = cylinder(1.62, 1.62, 0.012, DIRT, { roughness: 0.95 })
  trailMain.scale.z = 0.74
  trailMain.position.set(0.05, GY + 0.006, 0.12)
  trilha.add(trailMain)
  for (const [x, z, ry, sx, dy] of [[-1.42, -0.78, -0.53, 1.6, 0.002], [1.5, 0.98, -0.53, 1.6, 0.003]] as const) {
    const lingua = cylinder(0.56, 0.56, 0.012, DIRT, { roughness: 0.95 })
    lingua.scale.set(sx, 1, 0.68)
    lingua.rotation.y = ry
    lingua.position.set(x, GY + 0.006 + dy, z)
    trilha.add(lingua)
  }
  // sulcos de passos e pedrinhas na terra
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.5 + rand() * 0.9
    const peb = rock(0.035 + rand() * 0.03, i % 2 ? STONE : STONE_DARK, 60 + i, { roughness: 0.8 })
    peb.position.set(Math.cos(a) * r * 1.2, GY + 0.015, Math.sin(a) * r * 0.75 + 0.15)
    trilha.add(peb)
  }
  // pinheiros ao fundo
  for (const [x, z, h, s] of [[-2.0, -1.2, 1.25, 3], [0.75, -2.05, 1.35, 13]] as const) {
    const p = pine(h, s)
    p.position.set(x, GY, z)
    trilha.add(p)
  }

  // moitas, samambaias e cogumelos na beira
  for (const [x, z, r, s] of [[-2.05, 0.35, 0.26, 21], [2.15, 0.1, 0.24, 22], [-1.2, 1.75, 0.2, 23], [1.35, -0.55, 0.2, 24]] as const) {
    const moita = puff(r, MOSS_DARK, 6, s, { roughness: 0.9 })
    moita.position.set(x, GY + r * 0.55, z)
    moita.scale.y = 0.75
    trilha.add(moita)
  }
  for (const [x, z] of [[-1.62, 0.48], [1.95, 0.42], [-0.95, 1.95]] as const) {
    const cog = new THREE.Group()
    cog.position.set(x, GY, z)
    const pe = cylinder(0.025, 0.032, 0.11, '#efe6d2', { roughness: 0.7 })
    pe.position.y = 0.055
    cog.add(pe)
    const chapeu = lathe([[0, 0], [0.085, 0], [0.07, 0.045], [0.035, 0.07], [0, 0.075]], '#8d5a38', { roughness: 0.6 })
    chapeu.position.y = 0.1
    cog.add(chapeu)
    trilha.add(cog)
  }
  for (let i = 0; i < 7; i++) {
    const folha = sphere(0.05, LEAF, { roughness: 0.85 })
    folha.scale.set(1, 0.12, 0.6)
    const a = rand() * Math.PI * 2
    folha.position.set(Math.cos(a) * (1.0 + rand() * 0.9), GY + 0.016, Math.sin(a) * (0.9 + rand() * 0.6))
    folha.rotation.y = rand() * Math.PI
    trilha.add(folha)
  }

  // duas pedras cinza arredondadas — uma delas é o apoio do pé do cavaleiro
  const [fx, fz] = kw(KNEE.x, KNEE.z + 0.08)
  const pedraPe = sphere(0.27, STONE, { roughness: 0.75 })
  pedraPe.scale.set(1.15, 0.6, 1.0)
  pedraPe.position.set(fx, GY + STONE_H - 0.162, fz)
  trilha.add(pedraPe)
  const pedrinha = rock(0.13, STONE_DARK, 5, { flat: false, roughness: 0.8 })
  pedrinha.position.set(fx - 0.28, GY + 0.05, fz + 0.12)
  pedrinha.scale.y = 0.7
  trilha.add(pedrinha)

  const pedra2 = sphere(0.22, STONE, { roughness: 0.75 })
  pedra2.scale.set(1.2, 0.65, 1)
  pedra2.position.set(-1.5, GY + 0.03, 0.75)
  trilha.add(pedra2)
  const pedra2b = rock(0.11, STONE_DARK, 9, { flat: false, roughness: 0.8 })
  pedra2b.position.set(-1.25, GY + 0.04, 0.92)
  trilha.add(pedra2b)

  // ---- CAVALEIRO -----------------------------------------------------------
  const cavaleiro = new THREE.Group()
  cavaleiro.position.set(KX, GY, KZ)
  cavaleiro.rotation.y = KR
  root.add(cavaleiro)

  // perna de apoio (lado de trás)
  {
    const x = 0.14
    cavaleiro.add(limb(new THREE.Vector3(x, LEG, 0), new THREE.Vector3(x, 0.24, 0.02), 0.1, STEEL, METAL))
    const joelho = sphere(0.095, STEEL, METAL)
    joelho.position.set(x, 0.24, 0.04)
    cavaleiro.add(joelho)
    const spot = rustSpot(0.05)
    spot.position.set(x, 0.25, 0.13)
    cavaleiro.add(spot)
    const grevaApoio = lathe(
      [[0, 0], [0.085, 0], [0.092, 0.04], [0.102, 0.11], [0.097, 0.17], [0.088, 0.2], [0, 0.2]],
      STEEL,
      METAL,
    )
    grevaApoio.position.set(x, 0.04, 0.02)
    cavaleiro.add(grevaApoio)
    const sapato = rbox(0.17, 0.09, 0.28, 0.04, STEEL_DARK, METAL)
    sapato.position.set(x, 0.045, 0.08)
    cavaleiro.add(sapato)
  }

  // ---- perna apoiada na pedra: a CANELA de lata ----------------------------
  const canela = new THREE.Group()
  canela.position.copy(HIP)
  cavaleiro.add(canela)

  const kneeRel = KNEE.clone().sub(HIP)
  canela.add(limb(new THREE.Vector3(0, 0, 0), kneeRel, 0.105, STEEL, METAL))

  const joelheira = sphere(0.13, STEEL, METAL)
  joelheira.position.copy(kneeRel).add(new THREE.Vector3(0, 0.01, 0.02))
  canela.add(joelheira)
  const asa = sphere(0.1, STEEL_DARK, METAL)
  asa.scale.set(0.35, 1, 1)
  asa.position.copy(kneeRel).add(new THREE.Vector3(-0.115, 0, 0.01))
  canela.add(asa)
  const ferrugemJoelho = rustSpot(0.06)
  ferrugemJoelho.position.copy(kneeRel).add(new THREE.Vector3(-0.06, 0.08, 0.09))
  ferrugemJoelho.lookAt(new THREE.Vector3(-0.6, 1.2, 1.2))
  canela.add(ferrugemJoelho)

  // a greva (canela) é vertical: dela sai o T, virado para a câmera
  const GREAVE_Y0 = STONE_H + 0.03 - LEG
  const GREAVE_H = 0.4
  const grevaPerfil: [number, number][] = [
    [0, 0], [0.118, 0], [0.126, 0.03], [0.148, 0.1], [0.163, 0.18],
    [0.165, 0.25], [0.158, 0.31], [0.148, 0.36], [0.138, GREAVE_H], [0, GREAVE_H],
  ]
  const greva = new THREE.Group()
  greva.position.set(kneeRel.x, GREAVE_Y0, kneeRel.z)
  greva.scale.setScalar(1.22) // canela de lata GRANDE, em primeiro plano
  canela.add(greva)
  greva.add(lathe(grevaPerfil, STEEL, METAL, 56))
  // aro de rebites no topo e no tornozelo
  for (const [y, r] of [[GREAVE_H - 0.02, 0.145], [0.03, 0.128]] as const) {
    const aro = torus(r, 0.012, STEEL_DARK, METAL)
    aro.rotation.x = Math.PI / 2
    aro.position.y = y
    greva.add(aro)
  }

  const sabatao = rbox(0.21, 0.1, 0.32, 0.045, STEEL_DARK, METAL)
  sabatao.position.set(kneeRel.x, STONE_H + 0.05 - LEG, kneeRel.z + 0.06)
  canela.add(sabatao)
  const bico = sphere(0.095, STEEL_DARK, METAL)
  bico.scale.set(1, 0.6, 1.1)
  bico.position.set(kneeRel.x, STONE_H + 0.045 - LEG, kneeRel.z + 0.2)
  canela.add(bico)

  // ---- tronco: person() de armadura ----------------------------------------
  const tronco = person({ body: STEEL, skin: SKIN, height: 1.5, armAngle: 0.16 })
  tronco.position.set(0, LEG - 0.04, -0.02)
  tronco.rotation.x = TILT
  cavaleiro.add(tronco)

  const bodyMesh = tronco.getObjectByName('body') as THREE.Mesh
  bodyMesh.material = mat(STEEL, METAL)
  const armL = tronco.getObjectByName('armL') as THREE.Mesh
  const armR = tronco.getObjectByName('armR') as THREE.Mesh
  for (const arm of [armL, armR]) {
    arm.material = mat(STEEL, METAL)
    const hand = arm.children[0] as THREE.Mesh
    hand.material = mat(STEEL_DARK, METAL)
  }
  shoulderPivot(armL, 1.5)
  shoulderPivot(armR, 1.5)
  armR.rotation.set(-0.2, 0, -0.22)
  // braço dos tapinhas: aponta do ombro para o alto do joelho (luva pousada
  // logo acima do T). Rz abre, Rx leva pra frente: dir = (sin z, -cos z cos x, -cos z sin x)
  cavaleiro.updateMatrixWorld(true)
  const alvo = tronco.worldToLocal(cavaleiro.localToWorld(KNEE.clone().add(new THREE.Vector3(-0.05, 0.13, 0.1))))
  const dirBraco = alvo.sub(armL.position).normalize()
  const REACH = Math.atan2(-dirBraco.z, -dirBraco.y)
  armL.rotation.set(REACH, 0, Math.asin(dirBraco.x))
  for (const arm of [armL, armR]) {
    const hand = arm.children[0]
    const cuff = cylinder(0.118, 0.095, 0.09, STEEL_DARK, METAL)
    cuff.position.y = hand.position.y + 0.1
    arm.add(cuff)
    const cotovelo = sphere(0.08, STEEL, METAL)
    cotovelo.position.set(0, -0.28, -0.05)
    arm.add(cotovelo)
    const spot = rustSpot(0.045)
    spot.position.set(0, -0.27, -0.12)
    spot.rotation.y = Math.PI
    arm.add(spot)
  }

  // ombreiras com ferrugem
  for (const side of [-1, 1]) {
    const ombreira = sphere(0.15, STEEL, METAL)
    ombreira.scale.set(1, 0.72, 1.05)
    ombreira.position.set(side * 0.3, 0.71, 0)
    tronco.add(ombreira)
    const lame = sphere(0.135, STEEL_DARK, METAL)
    lame.scale.set(1, 0.5, 1)
    lame.position.set(side * 0.31, 0.63, 0)
    tronco.add(lame)
    const spot = rustSpot(0.06)
    spot.position.set(side * 0.38, 0.76, 0.04)
    spot.rotation.set(-0.6, side * 0.9, 0)
    tronco.add(spot)
  }

  // peitoral, cinto e saiote de lâminas
  const crista = rbox(0.035, 0.3, 0.04, 0.015, STEEL_DARK, METAL)
  crista.position.set(0, 0.5, 0.24)
  crista.rotation.x = -0.08
  tronco.add(crista)
  const cinto = torus(0.262, 0.028, LEATHER, { roughness: 0.7 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.3
  tronco.add(cinto)
  const fivela = rbox(0.08, 0.07, 0.025, 0.01, STEEL_DARK, METAL)
  fivela.position.set(0, 0.3, 0.275)
  tronco.add(fivela)
  const saiote = lathe([[0.31, -0.08], [0.305, 0.04], [0.285, 0.16], [0.262, 0.27]], STEEL, METAL)
  ;(saiote.material as THREE.Material).side = THREE.DoubleSide
  tronco.add(saiote)
  for (const [y, r] of [[0.04, 0.31], [0.16, 0.29]] as const) {
    const lamina = torus(r, 0.01, STEEL_DARK, METAL)
    lamina.rotation.x = Math.PI / 2
    lamina.position.y = y
    tronco.add(lamina)
  }

  // ---- cabeça: elmo de viseira levantada, bigode, penacho -----------------
  const head = tronco.getObjectByName('head')!
  head.rotation.set(-0.12, -0.35, 0)

  for (const side of [-1, 1]) {
    const bigode = capsule(0.026, 0.09, MUSTACHE, { roughness: 0.9 })
    bigode.position.set(side * 0.065, -0.095, 0.262)
    bigode.rotation.set(0, 0, side * 1.2)
    head.add(bigode)
  }

  // sorriso calmo de quem não liga: não faz mal
  const sorriso = shell(new THREE.TorusGeometry(0.055, 0.013, 8, 20, Math.PI), '#7a3b30', { roughness: 0.6 })
  sorriso.position.set(0, -0.15, 0.272)
  sorriso.rotation.set(0.55, 0, Math.PI)
  head.add(sorriso)

  const HR = 0.318
  const elmoTopo = shell(new THREE.SphereGeometry(HR, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.4), STEEL, METAL)
  head.add(elmoTopo)
  // laterais e nuca, com a janela do rosto aberta na frente
  const elmoLados = shell(
    new THREE.SphereGeometry(HR, 40, 12, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, Math.PI * 0.4, Math.PI * 0.33),
    STEEL,
    METAL,
  )
  head.add(elmoLados)
  const aba = torus(HR * Math.sin(Math.PI * 0.4), 0.02, STEEL_DARK, METAL)
  aba.rotation.x = Math.PI / 2
  aba.position.y = HR * Math.cos(Math.PI * 0.4)
  head.add(aba)
  const nuca = rustSpot(0.07)
  nuca.position.set(-0.2, 0.14, -0.2)
  nuca.lookAt(-0.6, 0.4, -0.6)
  head.add(nuca)
  for (const side of [-1, 1]) {
    const pino = cylinder(0.045, 0.045, 0.03, STEEL_DARK, METAL)
    pino.rotation.z = Math.PI / 2
    pino.position.set(side * (HR + 0.02), 0.0, 0)
    head.add(pino)
  }

  const penacho = new THREE.Group()
  penacho.position.set(0, HR * 0.86, -HR * 0.5)
  head.add(penacho)
  const suporte = cylinder(0.035, 0.045, 0.08, STEEL_DARK, METAL)
  penacho.add(suporte)
  // penacho: leque de penas abrindo pros lados, inclinado pra trás
  for (let i = 0; i < 5; i++) {
    const k = i - 2
    const pena = new THREE.Group()
    pena.rotation.set(-0.35 - Math.abs(k) * 0.08, 0, k * 0.32)
    const fio = sphere(0.052 - Math.abs(k) * 0.006, i % 2 ? '#a8443b' : PLUME, { roughness: 0.88 })
    fio.scale.set(0.75, 2.7 - Math.abs(k) * 0.3, 0.6)
    fio.position.y = 0.13
    pena.add(fio)
    penacho.add(pena)
  }

  // viseira: casca esférica que gira pela dobradiça das têmporas
  const viseira = new THREE.Group()
  viseira.rotation.x = VISOR_UP
  head.add(viseira)
  const VR = HR + 0.022
  const placa = shell(
    new THREE.SphereGeometry(VR, 32, 10, Math.PI / 2 - 1.05, 2.1, Math.PI * 0.38, Math.PI * 0.27),
    STEEL,
    METAL,
  )
  viseira.add(placa)
  const quilha = rbox(0.03, 0.26, 0.04, 0.012, STEEL_DARK, METAL)
  quilha.position.set(0, -0.0, VR + 0.005)
  viseira.add(quilha)
  for (const side of [-1, 1]) {
    const fenda = rbox(0.11, 0.02, 0.02, 0.008, '#2a2d31', { roughness: 0.6 })
    const a = side * 0.32
    fenda.position.set(Math.sin(a) * (VR + 0.004), 0.03, Math.cos(a) * (VR + 0.004))
    fenda.rotation.y = a
    viseira.add(fenda)
  }

  // ---- flocos de ferrugem caindo das juntas (o rangido) -------------------
  root.updateMatrixWorld(true)
  const ferrugem = new THREE.Group()
  cavaleiro.add(ferrugem)
  const toK = (o: THREE.Object3D, p: THREE.Vector3) => cavaleiro.worldToLocal(o.localToWorld(p.clone()))
  const juntas = [
    toK(armL, new THREE.Vector3(0, -0.3, -0.06)),
    toK(armR, new THREE.Vector3(0, -0.3, -0.06)),
    KNEE.clone().add(new THREE.Vector3(-0.05, -0.02, 0.1)),
    new THREE.Vector3(0.18, 0.22, 0.12),
  ]
  for (const p of juntas) {
    for (let k = 0; k < 3; k++) {
      const floco = rbox(0.04, 0.009, 0.028, 0.004, k % 2 ? RUST : RUST_DARK, { roughness: 0.95 })
      floco.position.set(
        p.x + (rand() - 0.5) * 0.14,
        p.y - 0.05 - k * 0.06 - rand() * 0.03,
        p.z + (rand() - 0.5) * 0.12,
      )
      floco.rotation.set(rand() * 2, rand() * 3, rand() * 2)
      ferrugem.add(floco)
    }
  }

  // ---- o T riscado na ferrugem da canela -----------------------------------
  // ângulo da greva que encara a câmera (no plano horizontal)
  const gp = greva.localToWorld(new THREE.Vector3(0, 0.2, 0))
  const dirW = new THREE.Vector3(CAM.x - gp.x, 0, CAM.z - gp.z).normalize()
  const qInv = greva.getWorldQuaternion(new THREE.Quaternion()).invert()
  const dirL = dirW.applyQuaternion(qInv)
  const BETA = Math.atan2(dirL.x, dirL.z)

  // manchas de ferrugem (cascas torneadas coladas ao perfil da greva)
  const slice = (y0: number, y1: number, off: number): THREE.Vector2[] => {
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 8; i++) {
      const y = y0 + ((y1 - y0) * i) / 8
      let r = 0
      for (let k = 0; k < grevaPerfil.length - 2; k++) {
        const [r0, ya] = grevaPerfil[k + 1]
        const [r1, yb] = grevaPerfil[k + 2]
        if (y >= ya && y <= yb) r = r0 + ((r1 - r0) * (y - ya)) / (yb - ya)
      }
      pts.push(new THREE.Vector2(r + off, y))
    }
    return pts
  }
  // em colunas de altura sorteada: a borda sai roída, não retangular
  for (const [a0, a1, ylo, yhi, jit, off, color] of [
    [-0.85, 0.85, 0.06, 0.33, 0.06, 0.003, RUST_DARK],
    [-0.05, 1.05, 0.27, 0.37, 0.035, 0.005, RUST],
    [-1.15, -0.45, 0.03, 0.12, 0.035, 0.005, RUST],
  ] as const) {
    const cols = Math.round((a1 - a0) / 0.13)
    const w = (a1 - a0) / cols
    for (let i = 0; i < cols; i++) {
      const edge = i === 0 || i === cols - 1 ? 0.5 : 1
      const y0 = ylo + rand() * jit + (1 - edge) * 0.04
      const y1 = yhi - rand() * jit - (1 - edge) * 0.04
      const mancha = shell(new THREE.LatheGeometry(slice(y0, y1, off), 3, BETA + a0 + i * w, w + 0.004), color, { roughness: 0.95 })
      greva.add(mancha)
    }
  }
  for (const [a, y, r] of [[0.95, 0.12, 0.03], [-1.0, 0.3, 0.026], [0.7, 0.05, 0.022], [-0.6, 0.37, 0.02]] as const) {
    const pinta = rustSpot(r)
    const rr = 0.163
    pinta.position.set(Math.sin(BETA + a) * rr, y, Math.cos(BETA + a) * rr)
    pinta.rotation.y = BETA + a
    greva.add(pinta)
  }

  const RT = 0.174
  const T_Y = 0.2
  const te = new THREE.Group()
  te.position.set(Math.sin(BETA) * RT, T_Y, Math.cos(BETA) * RT)
  te.rotation.y = BETA
  greva.add(te)
  const tMat = { metalness: 0.35, roughness: 0.2, emissive: '#dfe8ef', emissiveIntensity: 0.32 }
  const haste = rbox(0.056, 0.2, 0.024, 0.01, SHINE, tMat)
  haste.position.y = -0.025
  te.add(haste)
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.115
    const seg = rbox(RT * 0.115 + 0.008, 0.056, 0.024, 0.006, SHINE, tMat)
    seg.position.set(Math.sin(a) * RT, 0.086, Math.cos(a) * RT - RT)
    seg.rotation.y = a
    te.add(seg)
  }
  // brilhos: metal limpo refletindo
  for (const [bx, by, s] of [[0.11, 0.14, 1], [-0.085, -0.08, 0.7]] as const) {
    const brilho = new THREE.Group()
    brilho.position.set(bx, by, 0.035)
    brilho.scale.setScalar(s)
    const miolo = sphere(0.012, '#ffffff', { emissive: '#fffbe8', emissiveIntensity: 1.4 })
    brilho.add(miolo)
    for (let k = 0; k < 4; k++) {
      const raio = cone(0.009, 0.05, '#ffffff', { emissive: '#fffbe8', emissiveIntensity: 1.4 }, 8)
      raio.rotation.z = (k * Math.PI) / 2
      raio.position.set(-Math.sin(raio.rotation.z) * 0.027, Math.cos(raio.rotation.z) * 0.027, 0)
      brilho.add(raio)
    }
    te.add(brilho)
  }

  // ---- ESCORPIÃO -----------------------------------------------------------
  const escorpiao = new THREE.Group()
  escorpiao.position.set(SX, SY, SZ)
  escorpiao.rotation.y = SR
  root.add(escorpiao)

  const shellOpts = { roughness: 0.22, metalness: 0.1 }
  const prosoma = sphere(0.23, SHELL, shellOpts)
  prosoma.scale.set(1.1, 0.58, 1.05)
  prosoma.position.set(0, 0.22, 0.2)
  escorpiao.add(prosoma)
  for (let i = 0; i < 5; i++) {
    const placaSeg = rbox(0.43 - i * 0.03, 0.15, 0.15, 0.065, i % 2 ? SHELL_LIGHT : SHELL, shellOpts)
    placaSeg.position.set(0, 0.22 - i * 0.004, -0.0 - i * 0.11)
    placaSeg.rotation.x = -0.05
    escorpiao.add(placaSeg)
  }

  // oito patas em três gomos, joelho alto, abertas em leque
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const z0 = 0.2 - k * 0.12
      const leque = (1.5 - k) * 0.07
      const a = new THREE.Vector3(side * 0.17, 0.2, z0)
      const joelho = new THREE.Vector3(side * 0.29, 0.28, z0 + leque)
      const tornozelo = new THREE.Vector3(side * 0.37, 0.13, z0 + leque * 1.9)
      const pe = new THREE.Vector3(side * 0.405, GY - SY + 0.02, z0 + leque * 2.3)
      escorpiao.add(limb(a, joelho, 0.047, SHELL_LIGHT, shellOpts))
      escorpiao.add(limb(joelho, tornozelo, 0.04, SHELL_LIGHT, shellOpts))
      escorpiao.add(limb(tornozelo, pe, 0.032, SHELL_LIGHT, shellOpts))
    }
  }

  // olhos grandes e tristes, olhando pra cima (pro cavaleiro)
  for (const side of [-1, 1]) {
    const olho = sphere(0.085, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.09, 0.39, 0.27)
    olho.scale.z = 0.75
    escorpiao.add(olho)
    const pupila = sphere(0.042, '#121014', { roughness: 0.2 })
    pupila.position.set(side * 0.085, 0.42, 0.325)
    escorpiao.add(pupila)
    const brilho = sphere(0.012, '#ffffff', { roughness: 0.2 })
    brilho.position.set(side * 0.072, 0.435, 0.362)
    escorpiao.add(brilho)
    const sobrancelha = capsule(0.018, 0.08, SHELL_LIGHT, shellOpts)
    sobrancelha.position.set(side * 0.095, 0.495, 0.27)
    sobrancelha.rotation.set(0, 0, Math.PI / 2 - side * 0.45)
    escorpiao.add(sobrancelha)
  }

  // ---- pinças juntas na frente da cara (pedindo perdão) -------------------
  const pincas = new THREE.Group()
  pincas.position.set(0, 0.2, 0.33)
  escorpiao.add(pincas)
  for (const side of [-1, 1]) {
    const ombro = new THREE.Vector3(side * 0.13, 0, 0)
    const cotovelo = new THREE.Vector3(side * 0.29, 0.03, 0.1)
    const pulso = new THREE.Vector3(side * 0.15, 0.06, 0.21)
    pincas.add(limb(ombro, cotovelo, 0.048, SHELL_LIGHT, shellOpts))
    pincas.add(limb(cotovelo, pulso, 0.048, SHELL_LIGHT, shellOpts))
    // mão da pinça: bulbo inchado apontando pro meio, dedos que se tocam
    const mao = new THREE.Group()
    mao.position.set(side * 0.13, 0.07, 0.27)
    mao.rotation.y = -side * 0.62
    pincas.add(mao)
    const palma = sphere(0.105, SHELL, shellOpts)
    palma.scale.set(0.78, 0.72, 1.2)
    mao.add(palma)
    const dedoFixo = cone(0.042, 0.17, SHELL, shellOpts, 16)
    dedoFixo.rotation.x = Math.PI / 2 - 0.25
    dedoFixo.position.set(0, 0.035, 0.17)
    mao.add(dedoFixo)
    const dedoMovel = cone(0.036, 0.15, SHELL_LIGHT, shellOpts, 16)
    dedoMovel.rotation.x = Math.PI / 2 + 0.3
    dedoMovel.position.set(0, -0.04, 0.16)
    mao.add(dedoMovel)
  }

  // ---- rabo em arco, de segmentos ------------------------------------------
  const rabo = new THREE.Group()
  rabo.position.set(0, 0.22, -0.55)
  escorpiao.add(rabo)
  const TC = new THREE.Vector2(-0.16, 0.42) // centro do arco (z, y)
  const TRAD = 0.44
  const th0 = Math.atan2(0 - TC.y, 0 - TC.x)
  const th1 = th0 - 3.8
  const arcPt = (th: number) => new THREE.Vector3(0, TC.y + TRAD * Math.sin(th), TC.x + TRAD * Math.cos(th))
  const NSEG = 6
  for (let i = 0; i < NSEG; i++) {
    const a = arcPt(th0 + ((th1 - th0) * i) / NSEG)
    const b = arcPt(th0 + ((th1 - th0) * (i + 1)) / NSEG)
    rabo.add(limb(a, b, 0.095 - i * 0.006, i % 2 ? SHELL_LIGHT : SHELL, shellOpts))
  }
  const tip = arcPt(th1)
  const tang = new THREE.Vector3(0, -Math.cos(th1), Math.sin(th1)) // sentido do arco
  const telson = sphere(0.085, SHELL, shellOpts)
  telson.scale.set(0.9, 1.25, 0.9)
  telson.position.copy(tip).addScaledVector(tang, 0.05)
  telson.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tang)
  rabo.add(telson)

  // ferrão: dobradiça na ponta do telson; na pose final está entortado
  const ferrao = new THREE.Group()
  ferrao.position.copy(tip).addScaledVector(tang, 0.13)
  ferrao.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tang)
  rabo.add(ferrao)
  const BENT = 1.15
  const ferraoEuler = ferrao.rotation.clone()
  ferrao.rotation.set(ferraoEuler.x + BENT, ferraoEuler.y, ferraoEuler.z)
  const espinho = cone(0.038, 0.17, STING, { roughness: 0.3 })
  espinho.position.y = 0.08
  ferrao.add(espinho)

  // íngua roxa na ponta do rabo
  const ingua = new THREE.Group()
  ingua.position.copy(tip).add(new THREE.Vector3(0.07, 0.07, 0.0))
  rabo.add(ingua)
  const bolha = sphere(0.115, INGUA, { roughness: 0.18 })
  ingua.add(bolha)
  const veia = torus(0.07, 0.008, '#b46be8', { roughness: 0.3 })
  veia.position.set(0.02, 0.02, 0.06)
  veia.rotation.y = 0.4
  ingua.add(veia)

  // lagriminhas azuis
  const lagrimas = new THREE.Group()
  escorpiao.add(lagrimas)
  for (const side of [-1, 1]) {
    const gota = new THREE.Group()
    gota.position.set(side * 0.165, 0.3, 0.33)
    const corpo = sphere(0.032, TEAR, { roughness: 0.1 })
    gota.add(corpo)
    const ponta = cone(0.027, 0.05, TEAR, { roughness: 0.1 })
    ponta.position.y = 0.034
    gota.add(ponta)
    lagrimas.add(gota)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'trilha', group: 'trilha', object: trilha },
    { name: 'cavaleiro', group: 'cavaleiro', object: cavaleiro },
    { name: 'tronco', group: 'cavaleiro', object: tronco },
    { name: 'luva', group: 'cavaleiro', object: armL },
    { name: 'canela', group: 'cavaleiro', object: canela },
    { name: 'viseira', group: 'cavaleiro', object: viseira },
    { name: 'escorpiao', group: 'escorpiao', object: escorpiao },
    { name: 'pincas', group: 'escorpiao', object: pincas },
    { name: 'rabo', group: 'escorpiao', object: rabo },
    { name: 'ferrao', group: 'escorpiao', object: ferrao },
    { name: 'te', group: 'ferroada', object: te },
    { name: 'ingua', group: 'ingua', object: ingua },
    { name: 'lagrimas', group: 'perdao', object: lagrimas },
    { name: 'ferrugem', group: 'rangido', object: ferrugem },
  ]

  // ---- montagem ------------------------------------------------------------
  // bote: na direção da greva
  const gw = greva.getWorldPosition(new THREE.Vector3())
  const toShin = new THREE.Vector3(gw.x - SX, 0, gw.z - SZ).normalize()
  const lungeX = toShin.x * LUNGE
  const lungeZ = toShin.z * LUNGE
  const fx0 = ferrao.rotation.x
  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  const build = [
    seq('trilha-sobe', 'trilha', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Uma trilha de terra batida no meio da floresta.',
    }),

    seq('cavaleiro-sobe', 'cavaleiro', 1.1, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Por ela vem um cavaleiro de armadura velha e enferrujada, de viseira baixada…',
    }),
    seq('tronco-gingado', 'tronco', 1.1, 0.9, [ch('rotation.z', 0.14, 0)], { ease: 'easeOut' }),
    seq('luva-balanca', 'luva', 1.1, 0.9, [ch('rotation.x', 0.4, -0.05)], { ease: 'easeOut' }),
    seq('canela-ergue', 'canela', 1.1, 0.9, [ch('rotation.x', 0, LIFT)], { ease: 'easeOut' }),
    seq('viseira-clanc', 'viseira', 1.1, 0.9, [ch('rotation.x', -0.55, 0)], { ease: 'easeIn' }),

    seq('escorpiao-sobe', 'escorpiao', 2.5, 0.75, [riseFrom(SY, 0.7)], {
      ease: 'easeOut',
      caption: '…e pisa sem querer no rabo de um escorpião do tamanho de um cachorro!',
    }),
    seq('pincas-surgem', 'pincas', 2.6, 0.6, s3(0.01, 1), { ease: 'easeOut' }),
    seq('rabo-surge', 'rabo', 2.6, 0.7, s3(0.01, 1), { ease: 'easeOut' }),
    seq('ferrao-surge', 'ferrao', 2.8, 0.5, s3(0.01, 1), { ease: 'easeOut' }),
    seq('canela-pisa', 'canela', 3.3, 0.3, [ch('rotation.x', LIFT, 0)], { ease: 'easeIn' }),

    // a ferroada: o rabo chicoteia na canela, o ferrão entorta, o T aparece
    seq('rabo-ataca', 'rabo', 4.4, 0.24, [ch('rotation.x', 0, STRIKE)], {
      ease: 'easeIn',
      caption: 'O bicho revida e crava o ferrão na canela — mas a canela é de LATA: o ferrão entorta e risca um T prateado.',
    }),
    seq('escorpiao-bote', 'escorpiao', 4.4, 0.24, [
      ch('position.x', SX, SX + lungeX), ch('position.z', SZ, SZ + lungeZ), ch('rotation.y', SR, SR_STRIKE),
    ], {
      ease: 'easeIn',
    }),
    seq('ferrao-entorta', 'ferrao', 4.62, 0.14, [ch('rotation.x', fx0 - BENT, fx0)], { ease: 'easeOut' }),
    seq('te-risca', 'te', 4.64, 0.35, s3(0.01, 1), { ease: 'easeOut' }),
    seq('rabo-volta', 'rabo', 4.9, 0.6, [ch('rotation.x', STRIKE, 0)], { ease: 'easeInOut' }),
    seq('escorpiao-recua', 'escorpiao', 4.9, 0.6, [
      ch('position.x', SX + lungeX, SX), ch('position.z', SZ + lungeZ, SZ), ch('rotation.y', SR_STRIKE, SR),
    ]),

    seq('ingua-incha', 'ingua', 6.0, 0.45, s3(0.01, 1.3), {
      ease: 'easeOut',
      caption: 'Quem incha é o escorpião: na ponta do rabo brota uma ÍNGUA roxa, latejando.',
    }),
    seq('ingua-lateja-1', 'ingua', 6.5, 0.25, s3(1.3, 0.95)),
    seq('ingua-lateja-2', 'ingua', 6.8, 0.25, s3(0.95, 1.2)),
    seq('ingua-lateja-3', 'ingua', 7.1, 0.3, s3(1.2, 1)),

    seq('pincas-juntam', 'pincas', 7.7, 0.6, [ch('rotation.x', -0.7, 0)], {
      ease: 'easeOut',
      caption: 'Morto de vergonha, ele junta as pinças e pede perdão, chorando.',
    }),
    seq('lagrimas-pingam', 'lagrimas', 8.0, 0.45, [...s3(0.01, 1), ch('position.y', 0.05, 0)], { ease: 'easeOut' }),

    seq('viseira-sobe', 'viseira', 9.2, 0.5, [ch('rotation.x', 0, VISOR_UP)], {
      ease: 'easeOut',
      caption: 'O cavaleiro levanta a viseira — DÊ…',
    }),

    seq('tronco-curva', 'tronco', 10.2, 0.8, [ch('rotation.x', 0.02, TILT)], {
      caption: '…se curva pra conferir a canela, e a armadura enferrujada range: iiiÖR.',
    }),
    seq('luva-desce', 'luva', 10.2, 0.8, [ch('rotation.x', -0.05, REACH)]),
    seq('ferrugem-solta', 'ferrugem', 10.4, 0.8, [...s3(0.01, 1), ch('position.y', 0.12, 0)], { ease: 'easeOut' }),

    seq('luva-tapa-1', 'luva', 11.5, 0.14, [ch('rotation.x', REACH, REACH - 0.3)], {
      ease: 'easeOut',
      caption: 'Na lata não brotou ÍNGUA nenhuma — só o T. Dois tapinhas secos nele: T! T! ÍNG-et!',
    }),
    seq('luva-tapa-2', 'luva', 11.64, 0.1, [ch('rotation.x', REACH - 0.3, REACH)], { ease: 'easeIn' }),
    seq('luva-tapa-3', 'luva', 11.85, 0.14, [ch('rotation.x', REACH, REACH - 0.3)], { ease: 'easeOut' }),
    seq('luva-tapa-4', 'luva', 11.99, 0.1, [ch('rotation.x', REACH - 0.3, REACH)], { ease: 'easeIn' }),

    seq('te-brilha', 'te', 12.6, 0.25, s3(1, 1.18), {
      ease: 'easeOut',
      caption: 'Det gör inget. — Não faz mal.',
    }),
    seq('te-assenta', 'te', 12.85, 0.35, s3(1.18, 1), { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [CAM.x, CAM.y, CAM.z], target: [TARGET.x, TARGET.y, TARGET.z] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-gor-inget',
    contexto:
      'Cortesia: quando alguém pede desculpa por algo pequeno — esbarrou em você no tunnelbana, chegou dois minutos atrasado, derrubou sua caneta, ligou na hora errada. \'Förlåt!\' — \'Det gör inget!\'',
    fraseFonte: 'Não faz mal.',
    fraseAlvo: 'Det gör inget.',
    pronuncia:
      "dê iör ÍNG-et ('det' = dê, sem T; 'gör' começa com I de ioga + ö: IÖR, lábios de Ô e língua de Ê, R brando; 'inget' com a força no ÍNG, I curto e NG no nariz sem estalar o G — o fim de 'ping' —, e um -et curtinho que fecha num T seco; com -EN no lugar do -ET vira 'ingen', a forma errada aqui)",
    ponteSonora:
      "DÊ... iiiÖR... ÍNG-et! (4 sílabas: dê-iör-ÍNG-et; a força cai no ÍNG; DÊ = o 'det' de sempre, Ê FECHADO e sem T, o mesmo DÊ! de 'Det gör ont här'; iiiÖR = o RANGIDO enferrujado, o MESMO da manivela da marmota de 'Det gör ont här' e da cegonha de 'Vad gör du i helgen?' — aqui é a armadura do cavaleiro que range quando ele se curva: I de IOGA (nunca G duro nem J chiado), boca de Ô com língua de Ê e R BRANDO no fim; se o I virar RR sai 'hör' (ouve), se virar K sai 'kör' (dirige); ÍNG = a ÍNGUA de 'Ingen fara', 'Ingen orsak' e 'Det spelar ingen roll', cortada no NG: I curto, NG no nariz como no fim de 'ping', G sem estalo; e AQUI muda o rabo: no lugar do -EN de 'ingen' entra um -et curtinho e fraco que fecha num T SECO — o T prateado que o ferrão riscou na canela, bem onde a ÍNGUA NÃO brotou, e os dois tapinhas secos em cima dele —, sem 'tchi'; a ÍNGUA ficou no escorpião, na lata só sobrou o T: ÍNG-eT, nunca ÍNG-eN; é o T do 'nada' neutro, o mesmo T que transforma 'en' em 'ett': 'nada' sozinho é sempre inget, com T — 'Det gör ingen' não existe)",
    historia:
      'Na trilha da floresta, o cavaleiro medieval pisa sem querer no rabo de um escorpião do tamanho de um cachorro, e o escorpião revida: crava o ferrão com tudo na canela dele. Só que a canela é de lata — o ferrão entorta, escorrega e risca na ferrugem um T prateado e brilhante, e quem incha é a ponta do rabo do próprio escorpião, numa ÍNGUA roxa latejando. Morto de vergonha, o bicho junta as pinças e pede perdão. O cavaleiro levanta a viseira — DÊ... —, se curva pra conferir a canela e a armadura enferrujada range, o mesmo rangido da manivela: iiiÖR. Do lado de cá, nada de ÍNGUA: no lugar dela só ficou o T riscado na lata. Ele dá dois tapinhas secos bem em cima do T — T! T! — e responde: ÍNG-et! Não fez nada: não faz mal.',
  },
  createScene,
  refine: { organic: ['escorpiao', 'pincas', 'rabo'] },
}

export default card
