import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Hallå, vem pratar jag med?" — RRA-LÔ! VÉM... PRÁTA-r'IA... MÊ?
 *
 * No camarim, o telefone de disco toca e quem atende é o boneco de PRATA,
 * sozinho no banquinho: fone na orelha de lata, mandíbula articulada aberta
 * soltando um alô soprado (RRA-LÔ!). Do outro lado, o ventríloquo de smoking,
 * de cabelo em pé de MEDO, mãos vazias e boca fechada, estica a mão chamando:
 * VEM... vem cá! — e o boneco vira a cabeça pra ele, rindo no fone: ia, ia.
 *
 * Diorama: assoalho de tábuas escuras, cortina de veludo vinho em arco ao
 * fundo; mesinha redonda com o telefone preto à direita, banquinho alto com o
 * boneco prateado no centro, ventríloquo recuado à esquerda. O acento
 * saturado é a gravata-borboleta vermelha do boneco.
 */

const PLANK = '#4e3526'
const PLANK_B = '#5a3e2c'
const SOIL = '#2c1f16'
const VELVET = '#6c1e2c'
const VELVET_DARK = '#541623'
const BRASS = '#b8924e'
const WOOD = '#a8743f'
const WOOD_DARK = '#7a522c'
const LEATHER = '#5b3b27'
const PHONE = '#1b1b20'
const PHONE_HI = '#3a3a42'
const CREAM = '#eee5d3'
const SUIT = '#b9c1cb' // terno do boneco: prata acetinada
const FACE = '#f0f3f7' // rosto e mãos: prata polida
const GRAPHITE = '#454b55' // cabelo pintado do boneco
const PEARL = '#eef0f3'
const MOUTH = '#2a1416'
const TUX = '#1f1f27'
const SATIN = '#363642'
const SHIRT = '#f3f0ea'
const SKIN = '#e8c39e'
const HAIR = '#19171b'
const SWEAT = '#7cc4ef'
const RED = '#e3222e' // acento saturado RESERVADO: a gravata do boneco

const SUIT_OPTS: MatOpts = { metalness: 0.55, roughness: 0.32 }
const FACE_OPTS: MatOpts = { metalness: 0.55, roughness: 0.2 }

const GY = 0.17 // topo do assoalho
const SEAT = GY + 0.7 // topo do assento do banquinho
const STOOL = new THREE.Vector3(0.12, GY, 0.12)
const DUMMY_S = 1.1 // boneco grande: é o protagonista
const DUMMY_Y = SEAT - 0.03 * DUMMY_S
const DUMMY_RY = -0.15
const HEAD_Y = 0.9 // altura da cabeça do boneco (local do person h=1.2)
const HEAD_TURN = -0.3 // pose final: cabeça virada pro ventríloquo
const JAW_OPEN = 0.38
const TABLE = new THREE.Vector3(1.4, GY, 0.1)
const TABLE_TOP = 0.66 // altura do tampo (local da mesinha)
const VENT = new THREE.Vector3(-1.28, 0, 0.05)
const VENT_RY = 0.6

const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)

/** Cilindro de a até b — pernas de banco, varetas. */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = cylinder(r, r, d.length(), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Cápsula de a até b — braço e perna do boneco. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Calota esférica (cabelo pintado, cabelo colado): casca aberta embaixo. */
function cap(r: number, theta: number, color: string, opts: MatOpts) {
  const geo = new THREE.SphereGeometry(r, 40, 20, 0, Math.PI * 2, 0, theta)
  const material = mat(color, { ...opts, size: r * 2 })
  material.side = THREE.DoubleSide
  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Fio espiral de telefone: hélice em volta de uma curva que cede no meio. */
function coiledCord(a: THREE.Vector3, b: THREE.Vector3, sag: number, turns: number, coilR: number, wire: number) {
  const ctrl = a.clone().add(b).multiplyScalar(0.5)
  ctrl.y -= sag
  const path = new THREE.QuadraticBezierCurve3(a, ctrl, b)
  const n = Math.round(turns * 14)
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = path.getPoint(t)
    const tan = path.getTangent(t).normalize()
    const n1 = new THREE.Vector3().crossVectors(tan, UP)
    if (n1.lengthSq() < 1e-4) n1.set(1, 0, 0)
    n1.normalize()
    const n2 = new THREE.Vector3().crossVectors(tan, n1).normalize()
    // pontas lisas: a espiral nasce e morre no eixo do fio
    const k = Math.min(1, t / 0.04, (1 - t) / 0.04)
    const ang = t * turns * Math.PI * 2
    p.addScaledVector(n1, Math.cos(ang) * coilR * k).addScaledVector(n2, Math.sin(ang) * coilR * k)
    pts.push(p)
  }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, wire, 6, false)
  const m = new THREE.Mesh(geo, mat(PHONE, { roughness: 0.35, size: 0.1 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: assoalho de tábuas do camarim ---------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)

  const floor = cylinder(2.56, 2.62, 0.06, PLANK, { roughness: 0.8 })
  floor.position.y = 0.13
  base.add(floor)

  for (let i = -4; i <= 4; i++) {
    const z = i * 0.56
    const half = Math.sqrt(Math.max(0, 2.5 * 2.5 - z * z))
    const ripa = rbox(half * 2, 0.012, 0.52, 0.006, i % 2 === 0 ? PLANK : PLANK_B, { roughness: 0.78 })
    ripa.position.set(0, GY - 0.004, z)
    base.add(ripa)
  }

  // mala do boneco, aberta e VAZIA: ele saiu sozinho
  const mala = new THREE.Group()
  mala.position.set(0.85, GY, 1.0)
  mala.rotation.y = -0.3
  mala.scale.setScalar(0.85)
  base.add(mala)

  const fundo = rbox(0.66, 0.16, 0.4, 0.04, LEATHER, { roughness: 0.7 })
  fundo.position.y = 0.08
  mala.add(fundo)
  const forro = rbox(0.58, 0.02, 0.32, 0.01, VELVET, { roughness: 0.95 })
  forro.position.y = 0.155
  mala.add(forro)
  for (const sx of [-1, 1]) {
    const fecho = rbox(0.06, 0.05, 0.02, 0.008, BRASS, { roughness: 0.3, metalness: 0.8 })
    fecho.position.set(sx * 0.2, 0.12, 0.205)
    mala.add(fecho)
  }
  const alca = torus(0.06, 0.014, '#3a2516', { roughness: 0.6 })
  alca.position.set(0, 0.11, 0.215)
  alca.rotation.x = 0.4
  alca.scale.y = 0.6
  mala.add(alca)

  const tampa = new THREE.Group()
  tampa.position.set(0, 0.16, -0.2)
  tampa.rotation.x = -Math.PI // aberta de vez, deitada no chão
  mala.add(tampa)
  const casca = rbox(0.66, 0.16, 0.4, 0.04, LEATHER, { roughness: 0.7 })
  casca.position.set(0, 0.08, 0.2)
  tampa.add(casca)
  const forroTampa = rbox(0.58, 0.02, 0.32, 0.01, VELVET, { roughness: 0.95 })
  forroTampa.position.set(0, 0.005, 0.2)
  tampa.add(forroTampa)

  root.add(base)

  // ---- cortina de veludo vinho em arco ao fundo ----------------------------
  const cortina = new THREE.Group()
  root.add(cortina)

  const CURTAIN_H = 2.55
  const arc = (th: number) => new THREE.Vector3(2.25 * Math.cos(th), 0, -0.4 + 1.2 * Math.sin(th))
  const N_PLEATS = 30
  for (let i = 0; i < N_PLEATS; i++) {
    const th = -Math.PI + 0.3 + (i / (N_PLEATS - 1)) * (Math.PI - 0.6)
    const p = arc(th)
    const out = new THREE.Vector3(p.x / 2.25, 0, (p.z + 0.4) / 1.2).normalize()
    const wave = i % 2 === 0 ? 0.04 : -0.04
    const prega = cylinder(0.105, 0.125, CURTAIN_H, i % 2 === 0 ? VELVET : VELVET_DARK, { roughness: 0.92 }, 20)
    prega.position.set(p.x + out.x * wave, GY + CURTAIN_H / 2, p.z + out.z * wave)
    cortina.add(prega)
  }
  // bandô no topo + franja dourada
  const N_SEG = 16
  for (let i = 0; i < N_SEG; i++) {
    const th0 = -Math.PI + 0.3 + (i / N_SEG) * (Math.PI - 0.6)
    const th1 = -Math.PI + 0.3 + ((i + 1) / N_SEG) * (Math.PI - 0.6)
    const a = arc(th0)
    const b = arc(th1)
    const mid = a.clone().add(b).multiplyScalar(0.5)
    const len = a.distanceTo(b)
    const out = new THREE.Vector3(mid.x / 2.25, 0, (mid.z + 0.4) / 1.2).normalize()
    const ang = Math.atan2(b.x - a.x, b.z - a.z) - Math.PI / 2

    const bando = rbox(len + 0.06, 0.34, 0.12, 0.05, VELVET_DARK, { roughness: 0.92 })
    bando.position.set(mid.x + out.x * 0.16, GY + CURTAIN_H - 0.12, mid.z + out.z * 0.16)
    bando.rotation.y = ang
    cortina.add(bando)

    const friso = rbox(len + 0.06, 0.035, 0.03, 0.012, BRASS, { roughness: 0.4, metalness: 0.6 })
    friso.position.set(mid.x + out.x * 0.235, GY + CURTAIN_H - 0.27, mid.z + out.z * 0.235)
    friso.rotation.y = ang
    cortina.add(friso)

    for (let k = 0; k < 4; k++) {
      const f = a.clone().lerp(b, (k + 0.5) / 4)
      const borla = cylinder(0.012, 0.022, 0.09, BRASS, { roughness: 0.5, metalness: 0.5 }, 10)
      borla.position.set(f.x + out.x * 0.235, GY + CURTAIN_H - 0.33, f.z + out.z * 0.235)
      cortina.add(borla)
    }
  }

  // ---- mesinha redonda de madeira -------------------------------------------
  const mesinha = new THREE.Group()
  mesinha.position.copy(TABLE)
  root.add(mesinha)

  const tampo = cylinder(0.42, 0.42, 0.045, WOOD, { roughness: 0.5 })
  tampo.position.y = TABLE_TOP - 0.0225
  mesinha.add(tampo)
  const borda = torus(0.42, 0.024, WOOD_DARK, { roughness: 0.55 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = TABLE_TOP - 0.03
  mesinha.add(borda)
  const coluna = lathe(
    [[0.09, 0.05], [0.06, 0.1], [0.075, 0.17], [0.04, 0.28], [0.045, 0.44], [0.07, 0.53], [0.09, 0.6], [0.12, TABLE_TOP - 0.04], [0, TABLE_TOP - 0.04]],
    WOOD_DARK,
    { roughness: 0.55 },
  )
  mesinha.add(coluna)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4
    const pe = rbox(0.34, 0.05, 0.07, 0.025, WOOD_DARK, { roughness: 0.6 })
    pe.position.set(Math.cos(a) * 0.17, 0.03, Math.sin(a) * 0.17)
    pe.rotation.y = -a
    mesinha.add(pe)
  }
  // toalhinha de crochê sob o telefone
  const toalha = cylinder(0.28, 0.28, 0.006, CREAM, { roughness: 0.9 })
  toalha.position.y = TABLE_TOP + 0.003
  mesinha.add(toalha)
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2
    const bico = sphere(0.026, CREAM, { roughness: 0.9 }, 12)
    bico.position.set(Math.cos(a) * 0.28, TABLE_TOP + 0.003, Math.sin(a) * 0.28)
    bico.scale.y = 0.2
    mesinha.add(bico)
  }

  // ---- telefone antigo preto de disco (base, sem o fone) -------------------
  const telefone = new THREE.Group()
  telefone.position.set(TABLE.x, TABLE.y + TABLE_TOP + 0.006, TABLE.z)
  telefone.rotation.y = -0.32
  root.add(telefone)

  const caixa = lathe(
    [[0, 0], [0.2, 0], [0.215, 0.025], [0.21, 0.08], [0.18, 0.14], [0.12, 0.18], [0.04, 0.195], [0, 0.196]],
    PHONE,
    { roughness: 0.22 },
    48,
  )
  caixa.scale.z = 0.82
  telefone.add(caixa)

  // disco de discagem na rampa da frente
  const disco = new THREE.Group()
  disco.position.set(0, 0.125, 0.125)
  disco.rotation.x = 0.85
  telefone.add(disco)
  const placa = cylinder(0.088, 0.088, 0.014, CREAM, { roughness: 0.4 })
  disco.add(placa)
  const roda = cylinder(0.084, 0.084, 0.012, PHONE_HI, { roughness: 0.25 })
  roda.position.y = 0.012
  disco.add(roda)
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 1.65 + 0.9
    const furo = cylinder(0.0145, 0.0145, 0.016, CREAM, { roughness: 0.45 }, 14)
    furo.position.set(Math.cos(a) * 0.058, 0.014, Math.sin(a) * 0.058)
    disco.add(furo)
  }
  const miolo = cylinder(0.03, 0.03, 0.02, CREAM, { roughness: 0.4 })
  miolo.position.y = 0.016
  disco.add(miolo)
  const trava = rbox(0.012, 0.02, 0.03, 0.005, '#c9ced6', { roughness: 0.25, metalness: 0.8 })
  trava.position.set(0.075, 0.022, 0.05)
  disco.add(trava)

  // gancho vazio: as duas forquilhas e os botões do gancho saltados
  for (const sx of [-1, 1]) {
    const garfo = rbox(0.06, 0.07, 0.1, 0.025, PHONE, { roughness: 0.25 })
    garfo.position.set(sx * 0.13, 0.19, -0.02)
    telefone.add(garfo)
    const botao = cylinder(0.016, 0.016, 0.05, CREAM, { roughness: 0.4 }, 12)
    botao.position.set(sx * 0.055, 0.205, -0.03)
    telefone.add(botao)
  }
  const tomada = cylinder(0.022, 0.022, 0.04, PHONE_HI, { roughness: 0.3 }, 12)
  tomada.rotation.z = Math.PI / 2
  tomada.position.set(-0.205, 0.05, -0.02)
  telefone.add(tomada)

  // ---- banquinho alto de madeira --------------------------------------------
  const banquinho = new THREE.Group()
  banquinho.position.copy(STOOL)
  root.add(banquinho)

  const SEAT_L = SEAT - GY
  const assento = lathe(
    [[0, 0], [0.235, 0], [0.26, 0.02], [0.268, 0.045], [0.255, 0.068], [0.2, 0.078], [0, 0.08]],
    WOOD,
    { roughness: 0.5 },
  )
  assento.position.y = SEAT_L - 0.08
  banquinho.add(assento)
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
    const top = new THREE.Vector3(sx * 0.14, SEAT_L - 0.08, sz * 0.14)
    const bot = new THREE.Vector3(sx * 0.23, 0, sz * 0.23)
    banquinho.add(rod(top, bot, 0.026, WOOD_DARK, { roughness: 0.6 }))
  }
  const aro = torus(0.274, 0.018, WOOD_DARK, { roughness: 0.6 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.22
  banquinho.add(aro)

  // ---- boneco de ventríloquo prateado ---------------------------------------
  const boneco = person({ body: SUIT, skin: FACE, height: 1.2, armAngle: 0.2 })
  boneco.position.set(STOOL.x, DUMMY_Y, STOOL.z)
  boneco.rotation.y = DUMMY_RY
  boneco.scale.setScalar(DUMMY_S)
  root.add(boneco)

  const corpoB = boneco.getObjectByName('body') as THREE.Mesh
  corpoB.material = mat(SUIT, { ...SUIT_OPTS, size: 0.6 })

  // braço esquerdo (lado da câmera-esquerda) pousado no colo
  const bracoL = boneco.getObjectByName('armL') as THREE.Mesh
  bracoL.material = mat(SUIT, { ...SUIT_OPTS, size: 0.4 })
  ;(bracoL.children[0] as THREE.Mesh).material = mat(FACE, { ...FACE_OPTS, size: 0.1 })
  bracoL.rotation.x = -0.55

  // o braço direito vira um braço dobrado de verdade, segurando o fone
  const bracoRB = boneco.getObjectByName('armR') as THREE.Mesh
  const maoB = bracoRB.children[0] as THREE.Mesh
  bracoRB.remove(maoB)
  boneco.remove(bracoRB)
  maoB.material = mat(FACE, { ...FACE_OPTS, size: 0.1 })

  // pernas finas de boneco, penduradas pra fora do assento
  for (const side of [-1, 1]) {
    const hip = new THREE.Vector3(side * 0.085, 0.1, 0.04)
    const knee = new THREE.Vector3(side * 0.1, 0.085, 0.33)
    const ankle = new THREE.Vector3(side * 0.105, -0.19, 0.36)
    boneco.add(limb(hip, knee, 0.068, SUIT, SUIT_OPTS))
    boneco.add(limb(knee, ankle, 0.056, SUIT, SUIT_OPTS))
    const sapato = rbox(0.11, 0.075, 0.19, 0.035, PHONE, { roughness: 0.2 })
    sapato.position.set(side * 0.105, -0.24, 0.41)
    sapato.rotation.x = 0.15
    boneco.add(sapato)
  }

  // peitilho, lapelas e a gravata-borboleta vermelha
  const peitilho = rbox(0.15, 0.2, 0.05, 0.02, PEARL, { roughness: 0.4 })
  peitilho.position.set(0, 0.47, 0.19)
  peitilho.rotation.x = -0.12
  boneco.add(peitilho)
  for (const side of [-1, 1]) {
    const lapela = rbox(0.05, 0.22, 0.03, 0.012, '#9aa2ad', { ...SUIT_OPTS })
    lapela.position.set(side * 0.09, 0.47, 0.185)
    lapela.rotation.z = side * 0.3
    boneco.add(lapela)
  }
  for (const by of [0.3, 0.22]) {
    const botao = sphere(0.016, '#c9ced6', { roughness: 0.2, metalness: 0.9 }, 12)
    botao.position.set(0, by, 0.2)
    boneco.add(botao)
  }
  const gravata = new THREE.Group()
  gravata.position.set(0, 0.585, 0.17)
  boneco.add(gravata)
  const no = rbox(0.045, 0.045, 0.04, 0.015, RED, { roughness: 0.4 })
  gravata.add(no)
  for (const side of [-1, 1]) {
    const asa = cone(0.05, 0.1, RED, { roughness: 0.4 }, 16)
    asa.rotation.z = side * Math.PI / 2
    asa.position.x = side * 0.05
    asa.scale.z = 0.5
    gravata.add(asa)
  }

  // ---- cabeça do boneco (peça: vira pro ventríloquo) -----------------------
  const cabecaB = boneco.getObjectByName('head') as THREE.Group
  cabecaB.position.y = HEAD_Y
  cabecaB.scale.setScalar(1.3)
  cabecaB.rotation.y = HEAD_TURN
  ;(cabecaB.children[0] as THREE.Mesh).material = mat(FACE, { ...FACE_OPTS, size: 0.5 })
  // olhos pintados arregalados: brancos maiores
  for (const c of cabecaB.children.slice(1)) {
    const m = c as THREE.Mesh
    if (Math.abs(m.position.z - 0.187) < 0.01) m.scale.set(1.2, 1.2, 0.7)
    else m.position.z += 0.012
  }

  const pescoco = cylinder(0.07, 0.08, 0.12, FACE, { ...FACE_OPTS })
  pescoco.position.set(0, HEAD_Y - 0.26, 0)
  boneco.add(pescoco)

  // cabelo pintado (calota grafite) com risca de lado
  const cabeloB = cap(0.237, 1.18, GRAPHITE, { metalness: 0.7, roughness: 0.3 })
  cabeloB.rotation.set(-0.22, 0, 0.12)
  cabeloB.position.set(0, 0.015, -0.012)
  cabecaB.add(cabeloB)

  // sobrancelhas pintadas, altas e arqueadas
  for (const side of [-1, 1]) {
    const sob = capsule(0.01, 0.065, '#2b2f36', { roughness: 0.5 })
    sob.rotation.z = Math.PI / 2 - side * 0.22
    sob.position.set(side * 0.09, 0.118, 0.196)
    cabecaB.add(sob)
    const bochecha = sphere(0.035, '#d99aa3', { roughness: 0.45 }, 16)
    bochecha.scale.set(1, 0.75, 0.3)
    bochecha.position.set(side * 0.135, -0.055, 0.175)
    cabecaB.add(bochecha)
  }

  // boca: cavidade escura + dentes de cima; a mandíbula é peça própria
  const cavidade = sphere(0.062, MOUTH, { roughness: 0.7 }, 20)
  cavidade.scale.set(1.45, 0.75, 0.55)
  cavidade.position.set(0, -0.105, 0.19)
  cabecaB.add(cavidade)
  const dentes = rbox(0.11, 0.022, 0.02, 0.008, '#f1efe9', { roughness: 0.3 })
  dentes.position.set(0, -0.074, 0.216)
  cabecaB.add(dentes)

  // mandíbula: a placa do queixo de boneco, emoldurada pelos dois sulcos
  const mandibula = new THREE.Group()
  mandibula.position.set(0, -0.1, 0.09)
  mandibula.rotation.x = JAW_OPEN
  cabecaB.add(mandibula)
  const queixo = sphere(0.09, FACE, { ...FACE_OPTS }, 28)
  queixo.scale.set(1.05, 0.62, 0.62)
  queixo.position.set(0, -0.062, 0.078)
  mandibula.add(queixo)
  for (const side of [-1, 1]) {
    const sulco = capsule(0.006, 0.045, '#3e434b', { roughness: 0.5 })
    sulco.position.set(side * 0.09, -0.05, 0.1)
    sulco.rotation.set(-0.25, 0, side * 0.12)
    mandibula.add(sulco)
  }

  // ---- braço dobrado + fone (calculados na pose final) ---------------------
  root.updateMatrixWorld(true)
  const earW = cabecaB.localToWorld(new THREE.Vector3(0.27, 0.01, 0))
  const mouthPieceW = cabecaB.localToWorld(new THREE.Vector3(0.17, -0.2, 0.15))
  const headW = cabecaB.localToWorld(new THREE.Vector3(0, 0, 0))
  const foneX = mouthPieceW.clone().sub(earW)
  const FONE_L = foneX.length()
  foneX.normalize()
  const foneMid = earW.clone().add(mouthPieceW).multiplyScalar(0.5)
  const foneOut = foneMid.clone().sub(headW)
  foneOut.addScaledVector(foneX, -foneOut.dot(foneX)).normalize()
  const foneZ = new THREE.Vector3().crossVectors(foneX, foneOut).normalize()

  const handW = foneMid.clone().addScaledVector(foneOut, 0.075)
  const shoulder = new THREE.Vector3(0.235, 0.6, 0)
  const elbow = new THREE.Vector3(0.44, 0.42, 0.1)
  const hand = boneco.worldToLocal(handW.clone())
  const ombro = sphere(0.07, SUIT, SUIT_OPTS)
  ombro.position.copy(shoulder)
  boneco.add(ombro)
  boneco.add(limb(shoulder, elbow, 0.066, SUIT, SUIT_OPTS))
  boneco.add(limb(elbow, hand, 0.058, SUIT, SUIT_OPTS))
  maoB.position.copy(hand)
  maoB.quaternion.setFromUnitVectors(DOWN, hand.clone().sub(elbow).normalize())
  boneco.add(maoB)

  // fone: peça na raiz, montado no referencial do próprio fone
  const fone = new THREE.Group()
  fone.position.copy(foneMid)
  fone.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(foneX, foneOut, foneZ))
  root.add(fone)

  const cabo = rbox(FONE_L * 0.86, 0.055, 0.08, 0.026, PHONE, { roughness: 0.22 })
  cabo.position.y = 0.07
  fone.add(cabo)
  for (const end of [-1, 1]) {
    const copo = lathe(
      [[0, 0], [0.068, 0], [0.074, 0.018], [0.06, 0.05], [0.032, 0.07], [0, 0.072]],
      PHONE,
      { roughness: 0.22 },
    )
    copo.position.set(end * FONE_L / 2, -0.005, 0)
    fone.add(copo)
    const ponte = rbox(0.07, 0.07, 0.07, 0.025, PHONE, { roughness: 0.22 })
    ponte.position.set(end * (FONE_L / 2 - 0.02), 0.045, 0)
    fone.add(ponte)
  }

  // fio espiral: do bocal até a tomada da base, no referencial do fone
  root.updateMatrixWorld(true)
  const plugW = telefone.localToWorld(new THREE.Vector3(-0.23, 0.05, -0.02))
  const cordStartW = fone.localToWorld(new THREE.Vector3(FONE_L / 2 + 0.03, 0.03, 0))
  const fio = coiledCord(fone.worldToLocal(cordStartW.clone()), fone.worldToLocal(plugW.clone()), 0, 26, 0.022, 0.0075)
  fone.add(fio)

  // ---- nuvenzinha de sopro saindo da boca ----------------------------------
  const mouthW = cabecaB.localToWorld(new THREE.Vector3(0, -0.11, 0.24))
  const fwd = cabecaB.localToWorld(new THREE.Vector3(0, -0.11, 1.24)).sub(mouthW).normalize()
  fwd.add(new THREE.Vector3(-0.45, 0.1, 0)).normalize() // sai de lado: não tapa a boca
  const sopro = new THREE.Group()
  sopro.position.copy(mouthW)
  root.add(sopro)
  for (const [d, r, lift, seed] of [[0.36, 0.1, 0.06, 3], [0.55, 0.07, 0.12, 5], [0.68, 0.048, 0.17, 7]] as const) {
    const nuvem = puff(r, '#f4f6fa', 5, seed, { roughness: 0.85 })
    nuvem.position.copy(fwd).multiplyScalar(d)
    nuvem.position.y += lift
    sopro.add(nuvem)
  }

  // ---- ventríloquo de smoking, recuado de medo ------------------------------
  const ventriloquo = new THREE.Group()
  ventriloquo.position.copy(VENT)
  ventriloquo.rotation.y = VENT_RY
  root.add(ventriloquo)

  const corpoV = new THREE.Group()
  corpoV.position.y = GY
  corpoV.rotation.z = 0.1 // tronco tomba pra longe do boneco
  corpoV.scale.setScalar(1.12)
  ventriloquo.add(corpoV)

  const vent = person({ body: TUX, skin: SKIN, height: 1.5, armAngle: 0.35 })
  corpoV.add(vent)

  const peito = rbox(0.17, 0.27, 0.06, 0.025, SHIRT, { roughness: 0.5 })
  peito.position.set(0, 0.56, 0.235)
  peito.rotation.x = -0.12
  vent.add(peito)
  for (const side of [-1, 1]) {
    const lapelaV = rbox(0.07, 0.3, 0.035, 0.015, SATIN, { roughness: 0.3 })
    lapelaV.position.set(side * 0.11, 0.55, 0.225)
    lapelaV.rotation.z = side * 0.28
    vent.add(lapelaV)
  }
  for (const by of [0.5, 0.58]) {
    const botaoV = sphere(0.012, TUX, { roughness: 0.3 }, 10)
    botaoV.position.set(0, by, 0.248)
    vent.add(botaoV)
  }
  const gravataV = new THREE.Group()
  gravataV.position.set(0, 0.69, 0.215)
  vent.add(gravataV)
  gravataV.add(rbox(0.04, 0.04, 0.035, 0.014, '#121216', { roughness: 0.4 }))
  for (const side of [-1, 1]) {
    const asaV = cone(0.04, 0.08, '#121216', { roughness: 0.4 }, 14)
    asaV.rotation.z = side * Math.PI / 2
    asaV.position.x = side * 0.04
    asaV.scale.z = 0.5
    gravataV.add(asaV)
  }

  const cabecaV = vent.getObjectByName('head') as THREE.Group
  // olhos arregalados: brancos enormes, pupilas pequenas olhando o boneco
  for (const c of cabecaV.children.slice(1)) {
    const m = c as THREE.Mesh
    if (Math.abs(m.position.z - 0.82 * 0.285) < 0.01) {
      m.scale.set(1.4, 1.4, 0.8)
      m.position.z += 0.005
    } else {
      m.scale.setScalar(0.7)
      m.position.z += 0.03
      m.position.x += 0.012
    }
  }
  // sobrancelhas de pavor (pontas de dentro pra cima)
  for (const side of [-1, 1]) {
    const sobV = capsule(0.016, 0.08, HAIR, { roughness: 0.7 })
    sobV.rotation.z = Math.PI / 2 - side * 0.35
    sobV.position.set(side * 0.11, 0.15, 0.245)
    cabecaV.add(sobV)
  }
  // boca fechada numa linha tremida
  for (const [x, rz] of [[-0.035, 0.25], [0.035, -0.25]] as const) {
    const labio = capsule(0.011, 0.05, '#7a3f35', { roughness: 0.6 })
    labio.rotation.z = Math.PI / 2 + rz
    labio.position.set(x, -0.125, 0.258)
    cabecaV.add(labio)
  }
  const cabeloBase = cap(0.296, 1.05, HAIR, { roughness: 0.6 })
  cabeloBase.rotation.x = -0.45
  cabeloBase.position.y = 0.01
  cabecaV.add(cabeloBase)

  // ---- cabelo em pé (peça: espeta) -----------------------------------------
  const cabelo = new THREE.Group()
  cabecaV.add(cabelo)
  const spikes: [number, number][] = [[0, 0]]
  for (let k = 0; k < 7; k++) spikes.push([0.5, (k / 7) * Math.PI * 2])
  for (let k = 0; k < 9; k++) {
    const az = (k / 9) * Math.PI * 2
    if (Math.cos(az) > 0.45) continue // nada de franja tapando a testa (+z)
    spikes.push([0.95, az])
  }
  for (const [phi, az] of spikes) {
    const n = new THREE.Vector3(Math.sin(phi) * Math.sin(az), Math.cos(phi), Math.sin(phi) * Math.cos(az))
    const dir = n.clone().add(new THREE.Vector3(0, 0.9, 0)).normalize()
    const len = 0.26 - phi * 0.06
    const espeto = cone(0.06, len, HAIR, { roughness: 0.6 }, 14)
    espeto.quaternion.setFromUnitVectors(UP, dir)
    espeto.position.copy(n).multiplyScalar(0.25).addScaledVector(dir, len / 2 - 0.02)
    cabelo.add(espeto)
  }

  // ---- gotas de suor saltando da testa (peça) -------------------------------
  const suor = new THREE.Group()
  cabecaV.add(suor)
  for (const [x, y, z] of [[-0.3, 0.2, 0.2], [-0.4, 0.04, 0.1], [-0.12, 0.36, 0.28]] as const) {
    const gota = new THREE.Group()
    const pos = new THREE.Vector3(x, y, z)
    gota.position.copy(pos)
    gota.quaternion.setFromUnitVectors(UP, pos.clone().normalize().negate())
    const bulbo = sphere(0.038, SWEAT, { roughness: 0.15 }, 16)
    gota.add(bulbo)
    const ponta = cone(0.036, 0.07, SWEAT, { roughness: 0.15 }, 16)
    ponta.position.y = 0.04
    gota.add(ponta)
    suor.add(gota)
  }

  // braço oposto: jogado pra trás, mão aberta e vazia
  const bracoMedo = vent.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoMedo, 1.5)
  bracoMedo.quaternion.setFromUnitVectors(DOWN, new THREE.Vector3(-0.55, 0.55, 0.65).normalize())

  // ---- braço que chama: VEM (peça) ------------------------------------------
  const bracoVem = vent.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoVem, 1.5)
  const VEM_REST = { x: 0, y: 0, z: 0.22 } // pendurado, mão pra fora do corpo
  root.updateMatrixWorld(true)
  const reachW = new THREE.Vector3(0.95, 0.12, -0.25).normalize()
  const parentQ = new THREE.Quaternion()
  vent.getWorldQuaternion(parentQ)
  const reachL = reachW.clone().applyQuaternion(parentQ.clone().invert())
  bracoVem.quaternion.setFromUnitVectors(DOWN, reachL)
  const VEM = { x: bracoVem.rotation.x, y: bracoVem.rotation.y, z: bracoVem.rotation.z }

  // dedo indicador dobrado chamando (vem cá), montado em coordenadas de mundo
  root.updateMatrixWorld(true)
  const maoV = bracoVem.children[0] as THREE.Mesh
  const tipW = maoV.localToWorld(new THREE.Vector3(0, -0.08, 0))
  const knuckleW = tipW.clone().addScaledVector(reachW, 0.085)
  const curlW = knuckleW.clone().add(new THREE.Vector3(0, 0.08, 0)).addScaledVector(reachW, -0.045)
  for (const [a, b] of [[tipW, knuckleW], [knuckleW, curlW]] as const) {
    const falange = limb(a, b, 0.03, SKIN, { roughness: 0.6 })
    maoV.attach(falange)
  }
  const punhoV = torus(0.05, 0.02, SHIRT, { roughness: 0.5 })
  punhoV.rotation.x = Math.PI / 2
  punhoV.position.y = 0.06
  maoV.add(punhoV)

  // cartola caída no chão, aos pés dele
  const cartola = new THREE.Group()
  cartola.position.set(-0.55, GY + 0.16, 0.45)
  cartola.rotation.set(0.3, 0.6, Math.PI / 2 - 0.25)
  ventriloquo.add(cartola)
  const copa = cylinder(0.13, 0.12, 0.28, TUX, { roughness: 0.6 })
  copa.position.y = 0.14
  cartola.add(copa)
  const aba = cylinder(0.21, 0.21, 0.018, TUX, { roughness: 0.6 })
  cartola.add(aba)
  const fita = cylinder(0.123, 0.123, 0.05, SATIN, { roughness: 0.3 })
  fita.position.y = 0.04
  cartola.add(fita)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'camarim', object: base },
    { name: 'cortina', group: 'camarim', object: cortina },
    { name: 'mesinha', group: 'telefone', object: mesinha },
    { name: 'telefone', group: 'telefone', object: telefone },
    { name: 'banquinho', group: 'boneco', object: banquinho },
    { name: 'boneco', group: 'boneco', object: boneco },
    { name: 'fone', group: 'alo', object: fone },
    { name: 'mandibula', group: 'alo', object: mandibula },
    { name: 'sopro', group: 'alo', object: sopro },
    { name: 'ventriloquo', group: 'medo', object: ventriloquo },
    { name: 'cabelo', group: 'medo', object: cabelo },
    { name: 'bracoVem', group: 'vem', object: bracoVem },
    { name: 'suor', group: 'vem', object: suor },
    { name: 'cabecaBoneco', group: 'prata', object: cabecaB },
  ]

  const grow = (to = 1, from = 0.01) => [ch('scale.x', from * to, to), ch('scale.y', from * to, to), ch('scale.z', from * to, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Um camarim de teatro: brota o assoalho de tábuas e desce a cortina de veludo…',
    }),
    seq('cortina-desce', 'cortina', 0.3, 1.0, [ch('position.y', 2.8, 0)], { ease: 'easeOut' }),

    seq('mesinha-rise', 'mesinha', 1.7, 0.7, [riseFrom(TABLE.y, 0.9)], {
      ease: 'easeOut',
      caption: 'Numa mesinha, um telefone antigo de disco começa a tocar: trim, trim…',
    }),
    seq('telefone-pousa', 'telefone', 2.3, 0.5, [
      ...grow(), ch('position.y', telefone.position.y + 0.5, telefone.position.y),
    ], { ease: 'easeOut' }),
    seq('trim-1', 'telefone', 2.9, 0.1, [ch('rotation.z', 0, 0.12)]),
    seq('trim-2', 'telefone', 3.0, 0.12, [ch('rotation.z', 0.12, -0.12)]),
    seq('trim-3', 'telefone', 3.12, 0.12, [ch('rotation.z', -0.12, 0.12)]),
    seq('trim-4', 'telefone', 3.24, 0.12, [ch('rotation.z', 0.12, -0.12)]),
    seq('trim-5', 'telefone', 3.36, 0.12, [ch('rotation.z', -0.12, 0)]),

    seq('banquinho-rise', 'banquinho', 3.9, 0.7, [riseFrom(STOOL.y, 1.0)], {
      ease: 'easeOut',
      caption: 'Quem atende é o boneco de PRATA, sentado sozinho no banquinho…',
    }),
    seq('boneco-senta', 'boneco', 4.4, 0.7, [
      ...grow(DUMMY_S), ch('position.y', DUMMY_Y + 0.7, DUMMY_Y),
    ], { ease: 'easeOut' }),
    seq('cabeca-encaixa', 'cabecaBoneco', 4.7, 0.45, [ch('position.y', HEAD_Y + 0.3, HEAD_Y)], { ease: 'easeOut' }),
    seq('mandibula-encaixa', 'mandibula', 4.7, 0.45, [ch('rotation.x', 0, 0)]),

    seq('fone-orelha', 'fone', 5.6, 0.45, grow(), {
      ease: 'easeOut',
      caption: '…fone na orelha de lata e, pela boca articulada, um alô soprado: RRA-LÔ!',
    }),
    seq('mandibula-a', 'mandibula', 5.9, 0.15, [ch('rotation.x', 0, JAW_OPEN)]),
    seq('mandibula-b', 'mandibula', 6.05, 0.15, [ch('rotation.x', JAW_OPEN, 0)]),
    seq('mandibula-c', 'mandibula', 6.2, 0.2, [ch('rotation.x', 0, JAW_OPEN)]),
    seq('sopro-sai', 'sopro', 6.2, 0.6, grow(), { ease: 'easeOut' }),

    seq('ventriloquo-rise', 'ventriloquo', 7.4, 0.8, [riseFrom(0, 2.0)], {
      ease: 'easeOut',
      caption: 'Do outro lado, o ventríloquo gela de MEDO: mãos vazias, boca fechada — e o cabelo em pé!',
    }),
    seq('braco-cai', 'bracoVem', 7.4, 0.8, [
      ch('rotation.x', VEM_REST.x, VEM_REST.x), ch('rotation.y', VEM_REST.y, VEM_REST.y), ch('rotation.z', 1.1, VEM_REST.z),
    ], { ease: 'easeOut' }),
    seq('cabelo-espeta', 'cabelo', 8.3, 0.35, [ch('scale.y', 0.15, 1)], { ease: 'easeOut' }),

    seq('braco-estica', 'bracoVem', 9.3, 0.7, [
      ch('rotation.x', VEM_REST.x, VEM.x), ch('rotation.y', VEM_REST.y, VEM.y), ch('rotation.z', VEM_REST.z, VEM.z),
    ], {
      ease: 'easeOut',
      caption: 'Ele estica a mão trêmula e chama: VEM… vem cá!',
    }),
    seq('suor-salta', 'suor', 9.6, 0.4, grow(), { ease: 'easeOut' }),
    seq('treme-1', 'bracoVem', 10.0, 0.1, [ch('rotation.x', VEM.x, VEM.x + 0.07)]),
    seq('treme-2', 'bracoVem', 10.1, 0.1, [ch('rotation.x', VEM.x + 0.07, VEM.x - 0.07)]),
    seq('treme-3', 'bracoVem', 10.2, 0.1, [ch('rotation.x', VEM.x - 0.07, VEM.x + 0.05)]),
    seq('treme-4', 'bracoVem', 10.3, 0.1, [ch('rotation.x', VEM.x + 0.05, VEM.x)]),

    seq('cabeca-vira', 'cabecaBoneco', 10.8, 0.5, [ch('rotation.y', 0, HEAD_TURN)], {
      caption: 'O boneco de PRATA vira a cabeça pra ele — r! — e ri no fone: ia, ia…',
    }),
    seq('ri-1', 'mandibula', 11.4, 0.14, [ch('rotation.x', JAW_OPEN, 0)]),
    seq('ri-2', 'mandibula', 11.54, 0.14, [ch('rotation.x', 0, JAW_OPEN)], {
      caption: 'E você, na linha, pergunta: RRA-LÔ! VÉM… PRÁTA-r\'IA… MÊ?',
    }),
    seq('ri-3', 'mandibula', 12.6, 0.14, [ch('rotation.x', JAW_OPEN, 0)]),
    seq('ri-4', 'mandibula', 12.74, 0.16, [ch('rotation.x', 0, JAW_OPEN)], {
      caption: 'Hallå, vem pratar jag med? — Alô, com quem eu estou falando?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 1.98, 4.35], target: [0.0, 1.16, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'halla-vem-pratar-jag-med',
    contexto:
      "Ao telefone: quando atendem sem se identificar, quando a ligação foi transferida pra outra pessoa (empresa, vårdcentral, Försäkringskassan) ou quando aparece um número desconhecido. Muito sueco atende só com 'Hallå?' ou com o próprio nome; e quem liga costuma se apresentar com 'Hej, det är ... som ringer'.",
    fraseFonte:
      "Alô, com quem eu estou falando?",
    fraseAlvo:
      "Hallå, vem pratar jag med?",
    pronuncia:
      "ha-LÔÔ, VÉM PRÁ-tar-ia MÊÊ? ('hallå' com h soprado e a força no LÔ, Ô FECHADO e longo — é o å longo —, e o 'ha' curtinho; 'vem' com É aberto e curto e o M demorado, de lábios fechados, sem o 'vẽi' nasal do português; 'pratar' com força no PRÁ, A longo, e o -tar fraquinho, com R de um toque só que já gruda no 'jag' = ia, sem força: PRÁ-ta-ria; 'med' no fim = MÊ, Ê FECHADO e longo, o D não soa na fala — e ele leva força: a pergunta termina nele)",
    ponteSonora:
      "RRA-LÔ! VÉM... PRÁTA(r)-IA... MÊ(do)? (7 sílabas: ha-LÔÔ-vém-PRÁ-tar-ia-MÊÊ; força no LÔ, no VÉM e no MÊ, com o PRÁ num segundo plano; RRA-LÔ = o ALÔ do telefone, que o brasileiro já fala igualzinho ao sueco — força no LÔ, Ô FECHADO —, só que com um SOPRO na frente: o RR leve, de h carioca, é o h de 'hallå'; e estique o Ô: LÔÔ; VÉM = o 'vem!' de chamar com a mão, mas com o É ABERTO de 'pé' e a boca FECHANDO no M — nada do 'vẽi' nasal do português; o M já cola no P seguinte, então os lábios ficam fechados de um pro outro: VÉM-PRÁ; PRÁTA = a PRATA do boneco, o MESMO âncora de 'pratar' da barra de PRATA ÍNTEgra de 'Jag pratar inte så bra svenska': força no PRÁ, A longo — só que AQUI vem com o R, de um toque só, de 'caro', que gruda no IA: PRÁ-ta-ria, igual ao FÔ(r)-IA de 'Ursäkta, får jag komma förbi?'; sem esse R sobra 'prata', o infinitivo; IA = o 'jag' de sempre, I de IOGA, nunca J chiado — aqui fraquinho, sem força, é a risadinha de lata; MÊ(do) = o MEDO do ventríloquo sem o -DO, o MESMO MÊ de 'Vad jobbar du med?' e 'Kan jag betala med kort?': Ê FECHADO, LONGO e com força, porque a pergunta termina nele — e o D não soa)",
    historia:
      "O telefone do camarim toca e quem atende é o boneco de PRATA — sozinho, sentado no banquinho, de fone na orelha de lata: RRA-LÔ!, um alô soprado que sai da boca articulada. Do outro lado do camarim, o ventríloquo fica de cabelo em pé de MEDO: as mãos dele estão vazias e a boca dele, fechada. Ele estica a mão trêmula e chama: VEM... vem cá! — e o boneco de PRATA vira a cabeça pra ele, com um rangido de um toque só, r, e ri no fone: ia, ia. Você, na linha, ouvindo o alô soprado, o 'vem' tremido e a risadinha de lata, faz a única pergunta possível: VÉM... PRÁTA-r'IA... MÊ? — com quem eu estou falando?",
  },
  createScene,
}

export default card
