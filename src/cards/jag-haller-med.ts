import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot, person,
  rbox, capsule, cylinder, sphere, cone, torus, puff,
} from '../rig/helpers'

/**
 * "Jag håller med." — IÁ, RRÓLER... MÊÊ(do)!
 *
 * O par de "Jag håller inte riktigt med": lá o texugo calça os RRÓLER e
 * desliza SOZINHO pra TRÁS, erguendo um MÊ do tamanho de um grão de arroz.
 * Aqui o GNU — bicho de manada, concorda com tudo — calça os MESMOS patins
 * vermelhos, agarra a mão da tenista e os dois tombam juntos pra FRENTE, rampa
 * abaixo, embaixo de uma placa de MEDO do tamanho de um outdoor. O vento da
 * descida arranca o -DO da placa: só fica o MÊÊ, enorme.
 *
 * Diorama: disco de concreto de pista de skate; rampa azul-celeste (meio
 * half-pipe) descendo para a câmera; os dois na borda prateada (coping),
 * inclinados para a frente; a placa vermelha em dois postes no deck, atrás.
 */

const CONCRETO = '#bfc0bc'
const CONCRETO_ESC = '#9d9f9b'
const JUNTA = '#878985'
const CEU = '#4ea2d8' // rampa azul-celeste
const CEU_LADO = '#2f5f8c' // laterais da rampa
const PRATA = '#c9ced4'
const POSTE = '#8d949b'
const BRANCO = '#f4f1ea'
const ACCENT = '#dc3b2c' // acento reservado: a placa do MEDO e os RRÓLER
const AMARELO = '#f2c230' // rodinhas
const GNU = '#7d8a99' // pelo cinza-azulado
const GNU_ESC = '#5a6573'
const PRETO = '#25252b'
const FOCINHO = '#454a53'
const PELE = '#e8c09c'
const CABELO = '#6b4326'
const MARINHO = '#2f4a6e' // frisos do uniforme e raquete
const SUOR = '#8fd3f7'

const GY = 0.12 // topo do concreto
const HD = 0.5 // altura do deck da rampa acima do concreto
const DECK_Y = GY + HD
const ZL = -0.3 // borda (coping)
const LIP_ANGLE = 1.0 // inclinação da rampa na borda (rad)
const R_RAMP = HD / (1 - Math.cos(LIP_ANGLE))
const ZF = ZL + R_RAMP * Math.sin(LIP_ANGLE) // pé da rampa, no concreto
const ZB = ZL - 1.05 // fundo do deck
const W_RAMP = 2.8

const ZP = ZL - 0.02 // onde ficam as rodas da frente na pose final
const ROLL = 0.38 // quanto eles rolam até a borda
const TILT = 0.42 // tombo pra frente
const GX = -0.56 // gnu
const TX = 0.62 // tenista
const GNU_K = 0.78 // escala do gnu
const H_TEN = 1.5

const PY = 2.95 // centro da placa
const PZ = ZB + 0.12

/** Traço de letra: caixinha no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.06, 0.02, BRANCO, { roughness: 0.45 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Arco de toro achatado (O e barriga do D). */
function arc(r: number, tube: number, arcLen: number) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 14, 40, arcLen),
    mat(BRANCO, { roughness: 0.45, size: r * 2 }),
  )
  m.castShadow = true
  m.receiveShadow = true
  m.scale.z = 0.45
  return m
}

const LH = 0.62 // altura das letras
const T = 0.13 // espessura do traço

function letterM() {
  const g = new THREE.Group()
  const w = 0.56
  g.add(stroke(T, LH, -w / 2 + T / 2, 0))
  g.add(stroke(T, LH, w / 2 - T / 2, 0))
  const dx = w / 2 - T / 2
  const dy = LH * 0.55
  const len = Math.hypot(dx, dy)
  const rot = Math.atan2(dx, dy)
  g.add(stroke(T, len, -dx / 2, LH / 2 - dy / 2, rot))
  g.add(stroke(T, len, dx / 2, LH / 2 - dy / 2, -rot))
  return g
}

function letterE() {
  const g = new THREE.Group()
  const w = 0.4
  g.add(stroke(T, LH, -w / 2 + T / 2, 0))
  g.add(stroke(w, T, 0, LH / 2 - T / 2))
  g.add(stroke(w * 0.85, T, -w * 0.075, 0))
  g.add(stroke(w, T, 0, -LH / 2 + T / 2))
  return g
}

function letterD() {
  const g = new THREE.Group()
  const r = LH / 2 - T / 2
  g.add(stroke(T, LH, -0.2, 0))
  g.add(stroke(0.16, T, -0.13, LH / 2 - T / 2))
  g.add(stroke(0.16, T, -0.13, -LH / 2 + T / 2))
  const bojo = arc(r, T / 2, Math.PI)
  bojo.rotation.z = -Math.PI / 2
  bojo.position.x = -0.06
  g.add(bojo)
  return g
}

function letterO() {
  const g = new THREE.Group()
  const o = arc(LH / 2 - T / 2, T / 2, Math.PI * 2)
  o.scale.x = 0.82
  g.add(o)
  return g
}

/**
 * Patins de rodinha — o MESMO desenho dos RRÓLER do texugo (bota, cano,
 * fivela, chassi, quatro rodas com cubos), aqui vermelhos de rodas amarelas.
 * Origem no chão, sob o meio da bota; k escala tudo.
 */
function makeSkate(k: number) {
  const s = new THREE.Group()
  const bota = rbox(0.2, 0.16, 0.34, 0.055, ACCENT, { roughness: 0.4 })
  bota.position.y = 0.22
  s.add(bota)
  const cano = rbox(0.19, 0.15, 0.2, 0.05, ACCENT, { roughness: 0.4 })
  cano.position.set(0, 0.35, -0.06)
  s.add(cano)
  const fivela = rbox(0.21, 0.045, 0.21, 0.018, BRANCO, { roughness: 0.4 })
  fivela.position.set(0, 0.3, -0.02)
  s.add(fivela)
  const bico = rbox(0.17, 0.05, 0.09, 0.02, BRANCO, { roughness: 0.4 })
  bico.position.set(0, 0.17, 0.14)
  s.add(bico)
  const chassi = rbox(0.09, 0.07, 0.32, 0.025, '#3a3f44', { roughness: 0.3, metalness: 0.6 })
  chassi.position.y = 0.13
  s.add(chassi)
  for (const dz of [-0.11, 0.11]) {
    const roda = cylinder(0.075, 0.075, 0.055, AMARELO, { roughness: 0.6 })
    roda.rotation.z = Math.PI / 2
    roda.position.set(0, 0.075, dz)
    s.add(roda)
    for (const hx of [-0.032, 0.032]) {
      const cubo = sphere(0.028, ACCENT, { roughness: 0.35 })
      cubo.position.set(hx, 0.075, dz)
      s.add(cubo)
    }
  }
  s.scale.setScalar(k)
  return s
}

/** Aponta um braço (que pende em -y a partir do pivô) para a direção d. */
function aim(arm: THREE.Object3D, d: THREE.Vector3) {
  const v = d.clone().normalize()
  arm.rotation.set(Math.atan2(-v.z, -v.y), 0, Math.asin(THREE.MathUtils.clamp(v.x, -1, 1)))
}

/** Pata dianteira do gnu: braço + antebraço + casco fendido, pendendo em -y. */
function fillForeleg(arm: THREE.Group, L: number) {
  const upper = capsule(0.105, L * 0.36, GNU, { roughness: 0.9 })
  upper.position.y = -L * 0.24
  arm.add(upper)
  const lower = capsule(0.085, L * 0.4, GNU, { roughness: 0.9 })
  lower.position.y = -L * 0.64
  arm.add(lower)
  const machinho = sphere(0.09, GNU_ESC, { roughness: 0.9 })
  machinho.position.y = -L * 0.86
  arm.add(machinho)
  for (const side of [-1, 1]) {
    const casco = sphere(0.07, PRETO, { roughness: 0.5 })
    casco.scale.set(0.62, 0.9, 1.05)
    casco.position.set(side * 0.038, -L, 0.01)
    arm.add(casco)
  }
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- chão: disco de concreto da pista -----------------------------------
  const chao = new THREE.Group()
  const disco = cylinder(2.72, 2.8, 0.12, CONCRETO, { roughness: 0.9 })
  disco.position.y = 0.06
  chao.add(disco)
  const aro = cylinder(2.8, 2.84, 0.05, CONCRETO_ESC, { roughness: 0.9 })
  aro.position.y = 0.025
  chao.add(aro)
  // juntas de dilatação: cordas do círculo
  for (const z of [-1.6, 1.25]) {
    const len = 2 * Math.sqrt(2.66 * 2.66 - z * z)
    const j = rbox(len, 0.012, 0.03, 0.005, JUNTA, { roughness: 0.95 })
    j.position.set(0, GY + 0.001, z)
    chao.add(j)
  }
  for (const x of [-1.95, 1.95]) {
    const len = 2 * Math.sqrt(2.66 * 2.66 - x * x)
    const j = rbox(0.03, 0.012, len, 0.005, JUNTA, { roughness: 0.95 })
    j.position.set(x, GY + 0.001, 0)
    chao.add(j)
  }
  // bolinha de tênis perdida no pé da rampa
  const bola = new THREE.Group()
  bola.position.set(1.62, GY + 0.065, 0.5)
  bola.rotation.set(rand(), rand(), rand())
  bola.add(sphere(0.065, '#cfe04a', { roughness: 0.95 }))
  const costura = torus(0.064, 0.007, BRANCO, { roughness: 0.6 })
  costura.rotation.x = 0.5
  bola.add(costura)
  chao.add(bola)
  root.add(chao)

  // ---- rampa azul-celeste (meio half-pipe descendo pra câmera) -------------
  const rampa = new THREE.Group()
  const perfil = new THREE.Shape()
  perfil.moveTo(ZF + 0.02, 0)
  const N = 18
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * LIP_ANGLE
    perfil.lineTo(ZF - R_RAMP * Math.sin(a), R_RAMP * (1 - Math.cos(a)))
  }
  perfil.lineTo(ZB, HD)
  perfil.lineTo(ZB, 0)
  perfil.closePath()
  const rampaGeo = new THREE.ExtrudeGeometry(perfil, {
    depth: W_RAMP,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 4,
  })
  rampaGeo.translate(0, 0, -W_RAMP / 2)
  const rampaMesh = new THREE.Mesh(rampaGeo, [
    mat(CEU_LADO, { roughness: 0.6, size: 2 }),
    mat(CEU, { roughness: 0.45, size: 2 }),
  ])
  rampaMesh.rotation.y = -Math.PI / 2
  rampaMesh.position.y = GY
  rampaMesh.castShadow = true
  rampaMesh.receiveShadow = true
  rampa.add(rampaMesh)

  const coping = cylinder(0.05, 0.05, W_RAMP + 0.04, PRATA, { roughness: 0.22, metalness: 0.85 })
  coping.rotation.z = Math.PI / 2
  coping.position.set(0, DECK_Y - 0.01, ZL + 0.01)
  rampa.add(coping)

  root.add(rampa)

  // ---- placa do MEDO: outdoor vermelho em dois postes ----------------------
  const placa = new THREE.Group()
  placa.position.set(0, 0, PZ)
  const PLACA_ROT = -0.4
  placa.rotation.y = PLACA_ROT
  for (const px of [-1.05, 1.05]) {
    // os postes vêm do concreto: o da direita atravessa o deck, o da esquerda
    // fica atrás da rampa — a sapata vai onde o poste aparece
    const wz = PZ - px * Math.sin(PLACA_ROT) - 0.08 * Math.cos(PLACA_ROT)
    const baseY = wz > ZB + 0.05 ? DECK_Y : GY
    const h = PY - 0.4 - GY
    const poste = cylinder(0.055, 0.065, h, POSTE, { roughness: 0.35, metalness: 0.6 })
    poste.position.set(px, GY + h / 2, -0.08)
    placa.add(poste)
    const sapata = cylinder(0.12, 0.13, 0.04, POSTE, { roughness: 0.35, metalness: 0.6 })
    sapata.position.set(px, baseY + 0.02, -0.08)
    placa.add(sapata)
  }
  const viga = rbox(2.4, 0.08, 0.08, 0.02, POSTE, { roughness: 0.35, metalness: 0.6 })
  viga.position.set(0, PY - 0.36, -0.1)
  placa.add(viga)
  const moldura = rbox(3.04, 1.08, 0.1, 0.04, BRANCO, { roughness: 0.5 })
  moldura.position.set(0, PY, -0.02)
  placa.add(moldura)
  const painel = rbox(2.86, 0.9, 0.08, 0.03, ACCENT, { roughness: 0.5 })
  painel.position.set(0, PY, 0.02)
  placa.add(painel)
  for (const [px, py] of [[-1.36, 0.38], [1.36, 0.38], [-1.36, -0.38], [1.36, -0.38]] as const) {
    const parafuso = sphere(0.025, PRATA, { roughness: 0.3, metalness: 0.8 })
    parafuso.position.set(px, PY + py, 0.065)
    placa.add(parafuso)
  }
  const me = new THREE.Group()
  me.position.set(0, PY, 0.07)
  const m = letterM()
  m.position.x = -0.82
  me.add(m)
  const e = letterE()
  e.position.x = -0.24
  me.add(e)
  placa.add(me)
  root.add(placa)

  // o -DO: pendurado num parafuso só, o vento da descida arranca
  const DO_PIVOT = new THREE.Vector3(0.1, PY - LH / 2, 0.075)
  const doLetras = new THREE.Group()
  doLetras.position.copy(DO_PIVOT)
  const d = letterD()
  d.position.set(0.26, LH / 2, 0)
  doLetras.add(d)
  const o = letterO()
  o.position.set(0.86, LH / 2, 0)
  doLetras.add(o)
  placa.add(doLetras)
  const DO_ROT = -0.17

  // ---- tenista de patins ---------------------------------------------------
  const tenista = new THREE.Group()
  tenista.position.set(TX, DECK_Y, ZP)
  tenista.rotation.x = TILT
  root.add(tenista)

  const ten = new THREE.Group()
  ten.position.z = -0.1
  tenista.add(ten)
  for (const sx of [-1, 1]) {
    const sk = makeSkate(1.0)
    sk.position.set(sx * 0.12, 0, 0)
    ten.add(sk)
  }
  const p = person({ body: BRANCO, skin: PELE, height: H_TEN, armAngle: 0.3 })
  p.position.y = 0.2
  ten.add(p)

  // saia branca pregueada com friso marinho
  const saia = cylinder(0.265, 0.33, 0.2, BRANCO, { roughness: 0.75, flat: true }, 14)
  saia.position.y = 0.33
  p.add(saia)
  const friso = torus(0.325, 0.012, MARINHO, { roughness: 0.6 })
  friso.rotation.x = Math.PI / 2
  friso.position.y = 0.245
  p.add(friso)
  const gola = torus(0.12, 0.014, MARINHO, { roughness: 0.6 })
  gola.rotation.x = Math.PI / 2 - 0.25
  gola.position.set(0, 0.76, 0.04)
  p.add(gola)

  // braços de fora (regata): pele
  for (const nome of ['armL', 'armR']) {
    const b = p.getObjectByName(nome) as THREE.Mesh
    b.material = mat(PELE)
    shoulderPivot(b, H_TEN)
  }

  const cabT = p.getObjectByName('head') as THREE.Group
  cabT.rotation.y = -0.5 // olha pro gnu (e pra câmera)
  const hR = H_TEN * 0.19
  // cabelo castanho + rabo de cavalo voando pra trás
  const cabelo = sphere(hR * 1.03, CABELO, { roughness: 0.85 })
  cabelo.scale.set(1.02, 0.8, 0.95)
  cabelo.position.set(0, hR * 0.25, -hR * 0.18)
  cabT.add(cabelo)
  const elastico = torus(0.045, 0.018, MARINHO, { roughness: 0.6 })
  elastico.position.set(0, hR * 0.45, -hR * 1.02)
  elastico.rotation.x = 0.6
  cabT.add(elastico)
  const rabico = capsule(0.075, 0.3, CABELO, { roughness: 0.85 })
  const RAB = new THREE.Vector3(0.85, -0.35, -0.4).normalize()
  const RAB0 = new THREE.Vector3(0, hR * 0.45, -hR * 0.95)
  rabico.position.copy(RAB0).addScaledVector(RAB, 0.2)
  rabico.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), RAB)
  cabT.add(rabico)
  const pontaRabo = puff(0.07, CABELO, 4, 17, { roughness: 0.85 })
  pontaRabo.position.copy(RAB0).addScaledVector(RAB, 0.42)
  cabT.add(pontaRabo)
  // viseira branca: faixa + aba
  const faixa = torus(hR * 1.0, 0.03, BRANCO, { roughness: 0.5 })
  faixa.rotation.x = Math.PI / 2 - 0.15
  faixa.position.y = hR * 0.42
  cabT.add(faixa)
  const aba = cylinder(hR * 0.8, hR * 0.8, 0.026, BRANCO, { roughness: 0.5 })
  aba.scale.z = 0.7
  aba.position.set(0, hR * 0.6, hR * 0.8)
  aba.rotation.x = 0.08
  cabT.add(aba)
  // cara de pavor: sobrancelhas lá em cima e boca em O
  for (const side of [-1, 1]) {
    const sob = capsule(0.016, 0.07, CABELO, { roughness: 0.8 })
    sob.position.set(side * hR * 0.4, hR * 0.36, hR * 0.88)
    sob.rotation.z = Math.PI / 2 - side * 0.35
    cabT.add(sob)
    // olhos arregalados por cima dos olhos-base: mais branco, pupila menor
    const arregalado = sphere(hR * 0.27, '#ffffff', { roughness: 0.25 })
    arregalado.scale.z = 0.55
    arregalado.position.set(side * hR * 0.38, hR * 0.13, hR * 0.86)
    const pupilaT = sphere(hR * 0.085, '#151515', { roughness: 0.2 })
    pupilaT.position.set(side * hR * 0.36, hR * 0.12, hR * 1.0)
    cabT.add(arregalado, pupilaT)
  }
  const bocaT = sphere(hR * 0.15, '#5a2424', { roughness: 0.6 })
  bocaT.scale.set(0.85, 1.2, 0.5)
  bocaT.position.set(0, -hR * 0.42, hR * 0.9)
  cabT.add(bocaT)

  // raquete erguida na mão livre
  const bracoRaquete = p.getObjectByName('armR') as THREE.Mesh
  const maoY = bracoRaquete.children[0].position.y
  const raquete = new THREE.Group()
  raquete.position.y = maoY
  bracoRaquete.add(raquete)
  const cabo = cylinder(0.022, 0.026, 0.2, MARINHO, { roughness: 0.5 })
  cabo.position.y = -0.04
  raquete.add(cabo)
  for (const side of [-1, 1]) {
    const garganta = capsule(0.012, 0.13, MARINHO, { roughness: 0.4 })
    garganta.position.set(side * 0.045, -0.2, 0)
    garganta.rotation.z = side * 0.35
    raquete.add(garganta)
  }
  const aroRaquete = torus(0.13, 0.016, MARINHO, { roughness: 0.4 })
  aroRaquete.scale.y = 1.25
  aroRaquete.position.y = -0.42
  raquete.add(aroRaquete)
  for (let i = -3; i <= 3; i++) {
    const v = rbox(0.006, 0.3, 0.006, 0.002, '#ece6cf', { roughness: 0.6 })
    v.position.set(i * 0.032, -0.42, 0)
    v.scale.y = Math.sqrt(Math.max(0.05, 1 - (i * 0.032 / 0.125) ** 2))
    raquete.add(v)
    const h = rbox(0.24, 0.006, 0.006, 0.002, '#ece6cf', { roughness: 0.6 })
    h.position.set(0, -0.42 + i * 0.04, 0)
    h.scale.x = Math.sqrt(Math.max(0.05, 1 - (i * 0.04 / 0.16) ** 2))
    raquete.add(h)
  }
  aim(bracoRaquete, new THREE.Vector3(0.55, 0.8, 0.25))
  const RAQ_ROT = bracoRaquete.rotation.clone()

  // braço que dá a mão ao gnu
  const bracoTenista = p.getObjectByName('armL') as THREE.Mesh
  const TEN_REST_Z = bracoTenista.rotation.z
  aim(bracoTenista, new THREE.Vector3(-0.78, 0.18, 0.6))
  const TEN_ROT = bracoTenista.rotation.clone()

  // ---- GNU -----------------------------------------------------------------
  const gnu = new THREE.Group()
  gnu.position.set(GX, DECK_Y, ZP)
  gnu.rotation.x = TILT
  root.add(gnu)

  const corpo = new THREE.Group()
  corpo.position.z = -0.115
  corpo.scale.setScalar(GNU_K)
  gnu.add(corpo)

  // patins (sub-peça: rígida, não entra no refino)
  const patins = new THREE.Group()
  corpo.add(patins)
  for (const sx of [-1, 1]) {
    const sk = makeSkate(1.3)
    sk.position.set(sx * 0.2, 0, 0)
    patins.add(sk)
  }

  const FUR = { roughness: 0.9 }
  for (const sx of [-1, 1]) {
    const canela = capsule(0.1, 0.28, GNU_ESC, FUR)
    canela.position.set(sx * 0.2, 0.62, 0.0)
    canela.rotation.x = 0.12
    corpo.add(canela)
    const joelho = sphere(0.115, GNU, FUR)
    joelho.position.set(sx * 0.2, 0.8, 0.04)
    corpo.add(joelho)
    const coxa = capsule(0.15, 0.22, GNU, FUR)
    coxa.position.set(sx * 0.21, 0.96, -0.04)
    coxa.rotation.x = -0.35
    corpo.add(coxa)
  }
  const quadril = sphere(0.32, GNU, FUR)
  quadril.scale.set(1.05, 0.85, 1.0)
  quadril.position.set(0, 1.1, -0.1)
  corpo.add(quadril)
  const tronco = capsule(0.33, 0.45, GNU, FUR)
  tronco.position.set(0, 1.42, 0.0)
  tronco.rotation.x = 0.18
  corpo.add(tronco)
  const peito = sphere(0.35, GNU, FUR)
  peito.scale.set(1.05, 1.0, 0.95)
  peito.position.set(0, 1.68, 0.1)
  corpo.add(peito)
  const corcova = sphere(0.27, GNU, FUR)
  corcova.position.set(0, 1.86, -0.08)
  corpo.add(corcova)
  const pescoco = capsule(0.17, 0.22, GNU, FUR)
  pescoco.position.set(0, 1.98, 0.2)
  pescoco.rotation.x = 0.75
  corpo.add(pescoco)
  // crina preta espetada na nuca
  for (let i = 0; i < 5; i++) {
    const t = i / 4
    const c = cone(0.045, 0.13, PRETO, { roughness: 0.8 })
    c.position.set(0, 2.06 - t * 0.2, 0.0 - t * 0.24)
    c.rotation.x = -0.95 - t * 0.3
    corpo.add(c)
  }
  // rabo com tufo preto
  const rabo = capsule(0.035, 0.32, GNU_ESC, FUR)
  rabo.position.set(0, 1.1, -0.52)
  rabo.rotation.x = -1.0
  corpo.add(rabo)
  const tufo = puff(0.075, PRETO, 4, 9, { roughness: 0.85 })
  tufo.position.set(0, 1.24, -0.7)
  corpo.add(tufo)

  // ---- cabeça do gnu --------------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 2.14, 0.3)
  cabeca.rotation.x = -0.45 // compensa o tombo: o rosto olha pra câmera
  cabeca.scale.setScalar(1.2) // cabeção de desenho animado: lê de longe
  corpo.add(cabeca)
  const HEAD_ROT = -0.45

  const cranio = sphere(0.19, GNU, FUR)
  cranio.scale.set(0.98, 0.95, 1.05)
  cabeca.add(cranio)
  const cara = capsule(0.13, 0.28, GNU_ESC, FUR)
  cara.rotation.x = Math.PI / 2 + 0.55
  cara.position.set(0, -0.1, 0.2)
  cabeca.add(cara)
  const focinho = sphere(0.14, FOCINHO, { roughness: 0.75 })
  focinho.scale.set(1.2, 0.85, 0.95)
  focinho.position.set(0, -0.26, 0.36)
  cabeca.add(focinho)
  for (const side of [-1, 1]) {
    const narina = sphere(0.032, '#1c1c20', { roughness: 0.4 })
    narina.scale.set(1.2, 0.7, 0.7)
    narina.position.set(side * 0.075, -0.22, 0.48)
    cabeca.add(narina)
  }
  // boca aberta berrando MÊÊÊ
  const boca = sphere(0.085, '#4a1f22', { roughness: 0.6 })
  boca.scale.set(1.15, 0.75, 0.7)
  boca.position.set(0, -0.37, 0.36)
  cabeca.add(boca)
  const lingua = sphere(0.045, '#c7686e', { roughness: 0.5 })
  lingua.scale.set(1.2, 0.5, 0.9)
  lingua.position.set(0, -0.4, 0.38)
  cabeca.add(lingua)
  // barbicha preta
  const barbicha = puff(0.06, PRETO, 5, 21, { roughness: 0.85 })
  barbicha.scale.set(1.0, 1.7, 0.8)
  barbicha.position.set(0, -0.5, 0.2)
  cabeca.add(barbicha)
  // olhos arregalados (pupila pequena = pavor)
  for (const side of [-1, 1]) {
    const esclera = sphere(0.076, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.13, 0.0, 0.14)
    esclera.scale.z = 0.6
    const pupila = sphere(0.024, '#151515', { roughness: 0.2 })
    pupila.position.set(side * 0.13, 0.0, 0.182)
    cabeca.add(esclera, pupila)
    const sobr = capsule(0.018, 0.08, PRETO, { roughness: 0.8 })
    sobr.position.set(side * 0.13, 0.1, 0.17)
    sobr.rotation.z = Math.PI / 2 - side * 0.4
    cabeca.add(sobr)
    const orelha = capsule(0.04, 0.1, GNU_ESC, FUR)
    orelha.position.set(side * 0.22, 0.02, -0.06)
    orelha.rotation.z = side * (Math.PI / 2 + 0.35)
    cabeca.add(orelha)
  }
  // topete preto entre os chifres
  const topete = puff(0.06, PRETO, 4, 27, { roughness: 0.85 })
  topete.scale.set(1.4, 0.7, 1.0)
  topete.position.set(0, 0.17, 0.07)
  cabeca.add(topete)

  // chifres (sub-peça rígida)
  const chifres = new THREE.Group()
  chifres.position.set(0, 0.12, -0.02)
  cabeca.add(chifres)
  const CHIFRE = { roughness: 0.4 }
  for (const s of [-1, 1]) {
    const base = sphere(0.075, PRETO, CHIFRE)
    base.scale.set(1.4, 0.6, 1.0)
    base.position.set(s * 0.08, 0, 0)
    chifres.add(base)
    const seg1 = capsule(0.048, 0.16, PRETO, CHIFRE)
    seg1.rotation.z = Math.PI / 2
    seg1.position.set(s * 0.2, 0.0, 0)
    chifres.add(seg1)
    const seg2 = capsule(0.04, 0.12, PRETO, CHIFRE)
    seg2.rotation.z = -s * 0.75
    seg2.position.set(s * 0.32, 0.07, 0.0)
    chifres.add(seg2)
    const ponta = cone(0.034, 0.15, PRETO, CHIFRE)
    ponta.rotation.z = s * 0.25
    ponta.position.set(s * 0.37, 0.2, 0.0)
    chifres.add(ponta)
  }

  // gotas de suor voando (sub-peça)
  const suor = new THREE.Group()
  cabeca.add(suor)
  for (const [sx, sy, sz, rz] of [[0.6, 0.24, 0.12, -1.2], [0.5, -0.02, -0.08, -1.6], [-0.42, 0.36, 0.2, 0.9]] as const) {
    const gota = new THREE.Group()
    gota.position.set(sx, sy, sz)
    gota.rotation.z = rz
    const bolha = sphere(0.055, SUOR, { roughness: 0.15 })
    gota.add(bolha)
    const bico = cone(0.053, 0.1, SUOR, { roughness: 0.15 })
    bico.position.y = -0.07
    bico.rotation.z = Math.PI
    gota.add(bico)
    suor.add(gota)
  }

  // patas dianteiras: pivô no ombro
  const bracoLivre = new THREE.Group()
  bracoLivre.position.set(-0.36, 1.78, 0.14)
  corpo.add(bracoLivre)
  fillForeleg(bracoLivre, 0.72)
  aim(bracoLivre, new THREE.Vector3(-0.55, 0.78, 0.3))
  const LIVRE_ROT = bracoLivre.rotation.clone()

  const bracoDado = new THREE.Group()
  bracoDado.position.set(0.36, 1.78, 0.14)
  corpo.add(bracoDado)

  // o casco vai até a mão da tenista: mede na pose final
  root.updateMatrixWorld(true)
  const maoTen = bracoTenista.children[0].getWorldPosition(new THREE.Vector3())
  const alvo = corpo.worldToLocal(maoTen.clone()).sub(bracoDado.position)
  const L_DADO = alvo.length() - 0.02
  fillForeleg(bracoDado, L_DADO)
  aim(bracoDado, alvo)
  const DADO_ROT = bracoDado.rotation.clone()

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'chao', group: 'pista', object: chao },
    { name: 'rampa', group: 'pista', object: rampa },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'do', group: 'placa', object: doLetras },
    { name: 'tenista', group: 'tenista', object: tenista },
    { name: 'cabecaTenista', group: 'tenista', object: cabT },
    { name: 'gnu', group: 'gnu', object: gnu },
    { name: 'patins', group: 'gnu', object: patins },
    { name: 'cabeca', group: 'gnu', object: cabeca },
    { name: 'chifres', group: 'gnu', object: chifres },
    { name: 'bracoDado', group: 'maos', object: bracoDado },
    { name: 'bracoTenista', group: 'maos', object: bracoTenista },
    { name: 'bracoLivre', group: 'maos', object: bracoLivre },
    { name: 'suor', group: 'tombo', object: suor },
  ]

  const S3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const Z0 = ZP - ROLL

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('chao-rise', 'chao', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Parque de patinação: sobe a pista de concreto…',
    }),
    seq('rampa-rise', 'rampa', 0.3, 0.9, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: '…e a rampa mais íngreme do parque, azul-celeste, descendo pra frente.',
    }),

    seq('placa-rise', 'placa', 1.9, 0.9, [riseFrom(0, 3.4)], {
      ease: 'easeOut',
      caption: 'Lá no alto, uma placa vermelha do tamanho de um outdoor avisa só: MEDO.',
    }),
    seq('do-rise', 'do', 1.9, 0.01, [ch('rotation.z', 0, 0)]),

    seq('tenista-rise', 'tenista', 3.5, 0.8, [riseFrom(DECK_Y, 1.8), ch('position.z', Z0, Z0)], {
      ease: 'easeOut',
      caption: 'A tenista, de patins e viseira, espia lá embaixo e dá a opinião dela: "Isso dá MEDO."',
    }),
    seq('cabecaTenista-espia', 'cabecaTenista', 3.5, 0.8, [ch('rotation.x', 0.35, 0.35)]),
    seq('bracoTenista-pende', 'bracoTenista', 3.5, 0.01, [ch('rotation.x', 0, 0), ch('rotation.z', TEN_REST_Z, TEN_REST_Z)]),

    seq('gnu-rise', 'gnu', 5.2, 0.9, [riseFrom(DECK_Y, 2.6), ch('position.z', Z0, Z0)], {
      ease: 'easeOut',
      caption: 'Do lado, o GNU — bicho de manada, concorda com tudo — treme da barbicha ao rabo.',
    }),
    seq('patins-pop', 'patins', 5.2, 0.6, S3(0.01, 1), { ease: 'easeOut' }),
    seq('cabeca-pop', 'cabeca', 5.35, 0.6, [ch('position.y', 1.6, 2.14), ch('rotation.x', 0, 0)], {
      ease: 'easeOut',
    }),
    seq('chifres-pop', 'chifres', 5.6, 0.5, S3(0.01, 1), { ease: 'easeOut' }),
    seq('bracoLivre-pende', 'bracoLivre', 5.2, 0.01, [ch('rotation.x', 0, 0), ch('rotation.z', -0.15, -0.15)]),
    seq('bracoDado-pende', 'bracoDado', 5.2, 0.01, [ch('rotation.x', 0, 0), ch('rotation.z', 0.15, 0.15)]),
    seq('gnu-treme-a', 'gnu', 6.15, 0.12, [ch('rotation.z', 0, 0.04)]),
    seq('gnu-treme-b', 'gnu', 6.27, 0.12, [ch('rotation.z', 0.04, -0.04)]),
    seq('gnu-treme-c', 'gnu', 6.39, 0.12, [ch('rotation.z', -0.04, 0)]),

    seq(
      'bracoDado-agarra',
      'bracoDado',
      7.0,
      0.7,
      [ch('rotation.x', 0, DADO_ROT.x), ch('rotation.z', 0.15, DADO_ROT.z)],
      { ease: 'easeOut', caption: 'Ele agarra a mão dela com o casco e solta o grito de guerra: IÁ!' },
    ),
    seq('bracoTenista-agarra', 'bracoTenista', 7.0, 0.7, [
      ch('rotation.x', 0, TEN_ROT.x), ch('rotation.z', TEN_REST_Z, TEN_ROT.z),
    ], { ease: 'easeOut' }),
    seq('bracoLivre-ergue', 'bracoLivre', 7.5, 0.6, [
      ch('rotation.x', 0, LIVRE_ROT.x), ch('rotation.z', -0.15, LIVRE_ROT.z),
    ], { ease: 'easeOut' }),
    seq('cabecaTenista-olha', 'cabecaTenista', 7.5, 0.5, [ch('rotation.x', 0.35, 0)], { ease: 'easeOut' }),

    seq('gnu-rola', 'gnu', 8.7, 0.9, [ch('position.z', Z0, ZP)], {
      ease: 'easeIn',
      caption: 'Os ROLLER começam a rolar — RRÓLER, RRÓLER — até a borda…',
    }),
    seq('tenista-rola', 'tenista', 8.7, 0.9, [ch('position.z', Z0, ZP)], { ease: 'easeIn' }),

    seq('gnu-tomba', 'gnu', 9.9, 0.6, [ch('rotation.x', 0, TILT)], {
      ease: 'easeIn',
      caption: '…e os dois tombam juntos pra FRENTE, de mãos dadas, berrando: MÊÊÊ…!',
    }),
    seq('tenista-tomba', 'tenista', 9.9, 0.6, [ch('rotation.x', 0, TILT)], { ease: 'easeIn' }),
    seq('cabeca-compensa', 'cabeca', 9.9, 0.6, [ch('rotation.x', 0, HEAD_ROT)], { ease: 'easeIn' }),
    seq('suor-voa', 'suor', 10.2, 0.5, S3(0.01, 1), { ease: 'easeOut' }),

    seq('do-arranca', 'do', 11.0, 0.45, [ch('rotation.z', 0, DO_ROT)], {
      ease: 'easeOut',
      caption: 'O vento da descida arranca o -DO da placa: só fica o MÊÊ, enorme.',
    }),

    seq('cabeca-sim-a', 'cabeca', 12.1, 0.3, [ch('rotation.x', HEAD_ROT, HEAD_ROT + 0.22)], {
      caption: 'Jag håller med. — Concordo.',
    }),
    seq('cabecaTenista-sim-a', 'cabecaTenista', 12.1, 0.3, [ch('rotation.x', 0, 0.22)]),
    seq('cabeca-sim-b', 'cabeca', 12.4, 0.35, [ch('rotation.x', HEAD_ROT + 0.22, HEAD_ROT)], { ease: 'easeOut' }),
    seq('cabecaTenista-sim-b', 'cabecaTenista', 12.4, 0.35, [ch('rotation.x', 0.22, 0)], { ease: 'easeOut' }),
  ]

  // pose final das peças com canais (o player parte daqui)
  bracoTenista.rotation.copy(TEN_ROT)
  bracoRaquete.rotation.copy(RAQ_ROT)
  doLetras.rotation.z = DO_ROT

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-2.55, 2.55, 4.38], target: [0.05, 1.8, -0.4] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-haller-med',
    contexto:
      "Trabalho: na reunião, quando alguém resume exatamente o que ele pensa; no fika, concordando com a reclamação do tempo. Com uma pessoa específica: 'Jag håller med dig'.",
    fraseFonte: 'Concordo.',
    fraseAlvo: 'Jag håller med.',
    pronuncia:
      "iá rról-ler MÊÊ ('jag' = iá; 'håller' quase sem força, com h soprado e Ó ABERTO e curto — å curto —, L dobrado e um -er fraquinho de R brando; 'med' = MÊÊ, Ê fechado e longo, o D não soa — e é nele que cai a força: em verbo com partícula a pancada vai na partícula, hålla MED)",
    ponteSonora:
      "IÁ, RRÓLER... MÊÊ(do)! (4 sílabas: iá-rról-ler-MÊÊ; a pancada cai no MÊÊ, o RRÓ leva só um apoio leve; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado; RRÓLER = os patins ROLLER, o MESMO âncora de 'Jag håller inte riktigt med': RR soprado de h carioca — com R de língua sai 'roller', que em sueco é 'papéis (de teatro)' —, Ó ABERTO e curto, de 'rola', nunca 'rôler'; L comprido de língua e um -er fraco, de R brando; MÊÊ(do) = o MEDO que o gnu berra e cujo -DO o vento da descida arranca, o MESMO MÊ de 'Vad jobbar du med?' e 'Kan jag betala med kort?': Ê FECHADO e LONGO, e o D não soa; e AQUI ele leva a força — em verbo com partícula a pancada vai na partícula: hålla MED; ATENÇÃO ao par: em 'Jag håller inte riktigt med' o texugo desliza SOZINHO pra TRÁS, emperra no ÍNTE-RÍKTIT e ergue um MÊ minúsculo numa plaquinha do tamanho de um grão de arroz; aqui não tem 'inte' nem 'riktigt' no meio: o gnu rola pra FRENTE, de mão DADA — 'hålla' é segurar: eu seguro junto —, e o MÊÊ sai berrado, enorme, embaixo de uma placa de MEDO do tamanho de um outdoor: discordar encolhe o MÊ, concordar faz ele crescer)",
    historia:
      "Parque de patinação: no alto da rampa mais íngreme, uma placa vermelha avisa só MEDO. A tenista, de patins e viseira, espia lá embaixo e dá a opinião dela: 'Isso dá medo.' Do lado, o gnu — bicho de manada, que concorda com tudo o que o grupo diz — desta vez concorda de verdade: treme da barbicha ao rabo, agarra a mão dela com o casco e solta o grito de guerra, IÁ! Os ROLLER começam a rolar — RRÓLER, RRÓLER — e ele berra a opinião dela de volta, MÊÊÊ...!, com o -DO arrancado pelo vento. Nada de deslizar sozinho pra trás, como o texugo que discorda na reunião: os dois despencam juntos pra FRENTE, de mãos dadas, balançando a cabeça que sim, com a mesmíssima cara — concordo plenamente.",
  },
  createScene,
  refine: { organic: ['gnu', 'cabeca', 'bracoDado', 'bracoLivre'] },
}

export default card
