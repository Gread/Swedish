import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Vad sa du?" — VÁ, ASSADO?!
 *
 * Palco de cortina bordô. O mágico de BIGODÃO murmura a fórmula por baixo do
 * bigode; na mesinha de toalha roxa, ao lado da cartola, uma ASSADEIRA de
 * batatas douradas com alecrim. O coelho salta da cartola de olhos
 * arregalados, estica as duas orelhas na direção do bigode e berra:
 * "VÁ, ASSADO?!" — o que foi que você disse?!
 *
 * Acento saturado reservado às batatas douradas (ASSADO).
 */

const PALCO = '#8a4a33'
const PALCO_ESC = '#6e3826'
const PALCO_LINHA = '#4f2618'
const BORDO = '#7a1e2b'
const BORDO_ESC = '#5c1520'
const OURO_VELHO = '#b8954f'
const ROXO = '#6a3f9e'
const ROXO_ESC = '#4d2c78'
const PRETO = '#1d1b22'
const PRETO_BIGODE = '#141216'
const PELE = '#e8c39e'
const PELO = '#f3efe8'
const PELO_SOMBRA = '#e2dcd2'
const ROSA = '#e89aa6'
const PRATA = '#c4cad1'
const BATATA = '#f2a12e' // acento reservado: as batatas do ASSADO
const BATATA_TOSTA = '#b8661e'
const ALECRIM = '#3f6e3c'
const CREME = '#f4ecdc'

const GY = 0.18 // topo do palco
const TOP = GY + 0.68 // tampo da mesinha
const TABLE_X = 0.45
const TABLE_Z = 0.05
const HAT_X = TABLE_X - 0.22
const HAT_Z = TABLE_Z + 0.02
const HAT_H = 0.4
const RIM = TOP + 0.035 + HAT_H // borda da cartola (mundo)
const MAG_X = -1.12
const MAG_Z = -0.05
const MAG_H = 2.05
const BRACO_L = -2.78 // braço da varinha erguido
const ORELHA_ROT = 2.0 // orelhas apontando para o bigode

/** Traço de glifo: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.05, 0.016, CREME, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** "?!" — o berro do coelho, de traço grosso. */
function grito() {
  const g = new THREE.Group()
  // ?
  const arco = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.032, 14, 40, Math.PI * 1.35),
    mat(CREME, { roughness: 0.5 }),
  )
  arco.castShadow = true
  arco.position.set(-0.1, 0.13, 0)
  arco.rotation.z = -Math.PI * 0.42
  g.add(arco)
  g.add(stroke(0.064, 0.1, -0.1, 0.0, 0))
  const ponto1 = sphere(0.04, CREME, { roughness: 0.5 })
  ponto1.position.set(-0.1, -0.13, 0)
  g.add(ponto1)
  // !
  g.add(stroke(0.07, 0.26, 0.12, 0.08, -0.05))
  const ponto2 = sphere(0.04, CREME, { roughness: 0.5 })
  ponto2.position.set(0.115, -0.13, 0)
  g.add(ponto2)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- palco: tablado de madeira avermelhada --------------------------------
  const palco = new THREE.Group()

  const fundo = cylinder(2.62, 2.72, 0.11, '#3a2018', { roughness: 0.9 })
  fundo.position.y = 0.055
  palco.add(fundo)

  const tablado = cylinder(2.56, 2.6, 0.07, PALCO, { roughness: 0.7 })
  tablado.position.y = 0.145
  palco.add(tablado)

  for (let i = -5; i <= 5; i++) {
    const x = i * 0.46
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - x * x, 0.01))
    const fresta = rbox(0.022, 0.012, len, 0.005, PALCO_LINHA, { roughness: 0.9 })
    fresta.position.set(x, GY + 0.002, 0)
    palco.add(fresta)
  }
  for (let i = -5; i < 5; i++) {
    const tom = rbox(0.43, 0.006, 4.6, 0.003, i % 2 === 0 ? PALCO_ESC : PALCO, { roughness: 0.75 })
    const x = i * 0.46 + 0.23
    const len = 2 * Math.sqrt(Math.max(2.45 * 2.45 - x * x, 0.01))
    tom.scale.z = len / 4.6
    tom.position.set(x, GY - 0.001, 0)
    palco.add(tom)
  }

  const friso = torus(2.6, 0.035, OURO_VELHO, { roughness: 0.35, metalness: 0.7 })
  friso.rotation.x = Math.PI / 2
  friso.position.y = GY - 0.01
  palco.add(friso)

  // ribalta: conchas de luz na beira da frente
  for (const a of [-0.55, -0.2, 0.2, 0.55]) {
    const x = Math.sin(a) * 2.38
    const z = Math.cos(a) * 2.38
    const concha = sphere(0.09, '#3b3238', { roughness: 0.4, metalness: 0.6 })
    concha.scale.set(1.2, 0.6, 1)
    concha.position.set(x, GY + 0.02, z)
    concha.rotation.y = a
    palco.add(concha)
    const luz = sphere(0.055, '#fff2c8', { emissive: '#ffe6a0', emissiveIntensity: 1.1 })
    luz.position.set(x - Math.sin(a) * 0.04, GY + 0.05, z - Math.cos(a) * 0.04)
    palco.add(luz)
  }
  root.add(palco)

  // ---- cortina de veludo bordô ao fundo -------------------------------------
  const cortina = new THREE.Group()
  const CORT_H = 2.85
  const N = 26
  for (let i = 0; i < N; i++) {
    const a = Math.PI + 0.22 + (i / (N - 1)) * (Math.PI - 0.44)
    const r = 2.32 + (i % 2) * 0.07
    const dobra = capsule(0.15, CORT_H - 0.3, i % 2 ? BORDO_ESC : BORDO, { roughness: 0.92 })
    dobra.position.set(Math.cos(a) * r, GY + CORT_H / 2, Math.sin(a) * r)
    cortina.add(dobra)
  }
  // bambinela: festões no alto + franja dourada
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + 0.3 + (i / 8) * (Math.PI - 0.6)
    const festao = sphere(0.36, BORDO, { roughness: 0.92 })
    festao.scale.set(1.15, 0.5, 0.45)
    festao.position.set(Math.cos(a) * 2.18, GY + CORT_H - 0.2, Math.sin(a) * 2.18)
    festao.rotation.y = -a - Math.PI / 2
    cortina.add(festao)
    const borla = cone(0.05, 0.14, OURO_VELHO, { roughness: 0.5, metalness: 0.5 })
    borla.position.set(Math.cos(a) * 2.05, GY + CORT_H - 0.42, Math.sin(a) * 2.05)
    borla.rotation.x = Math.PI
    cortina.add(borla)
  }
  root.add(cortina)

  // ---- mesinha redonda de mágico com toalha roxa ----------------------------
  const mesa = new THREE.Group()
  mesa.position.set(TABLE_X, 0, TABLE_Z)
  root.add(mesa)

  const pe = lathe(
    [[0, 0], [0.28, 0], [0.29, 0.03], [0.2, 0.06], [0.07, 0.1], [0.05, 0.3], [0.06, 0.34], [0.05, 0.38], [0, 0.38]],
    OURO_VELHO,
    { roughness: 0.35, metalness: 0.7 },
  )
  pe.position.y = GY
  mesa.add(pe)

  const coluna = cylinder(0.045, 0.05, TOP - GY - 0.3, PRETO, { roughness: 0.4 })
  coluna.position.y = GY + 0.3 + (TOP - GY - 0.3) / 2 - 0.05
  mesa.add(coluna)

  const toalha = lathe(
    [[0.74, -0.38], [0.72, -0.2], [0.69, -0.05], [0.67, 0.015], [0.6, 0.035], [0, 0.035]],
    ROXO,
    { roughness: 0.9 },
    56,
  )
  toalha.position.y = TOP
  mesa.add(toalha)

  // franja dourada na barra da toalha
  const franja = torus(0.74, 0.025, OURO_VELHO, { roughness: 0.45, metalness: 0.5 })
  franja.rotation.x = Math.PI / 2
  franja.position.y = TOP - 0.38
  mesa.add(franja)

  // ---- cartola preta com faixa bordô ----------------------------------------
  const cartola = new THREE.Group()
  cartola.position.set(HAT_X, TOP + 0.035, HAT_Z)
  cartola.rotation.y = 0.2
  root.add(cartola)

  const copa = lathe(
    [
      [0, 0], [0.36, 0], [0.38, 0.015], [0.36, 0.032], [0.25, 0.035],
      [0.24, 0.06], [0.235, 0.2], [0.245, HAT_H - 0.03], [0.255, HAT_H],
      [0.225, HAT_H], [0.215, HAT_H - 0.05], [0.2, 0.12], [0, 0.12],
    ],
    PRETO,
    { roughness: 0.55 },
    48,
  )
  cartola.add(copa)

  const faixa = cylinder(0.243, 0.238, 0.075, BORDO, { roughness: 0.6 }, 48)
  faixa.position.y = 0.085
  cartola.add(faixa)
  const laco = rbox(0.08, 0.06, 0.03, 0.02, BORDO_ESC, { roughness: 0.6 })
  laco.position.set(0.17, 0.085, 0.17)
  laco.rotation.y = Math.PI / 4
  cartola.add(laco)

  // ---- assadeira prateada com batatas douradas ------------------------------
  const assadeira = new THREE.Group()
  assadeira.position.set(TABLE_X + 0.3, TOP + 0.035, TABLE_Z + 0.08)
  assadeira.rotation.y = -0.12
  assadeira.scale.setScalar(1.25)
  root.add(assadeira)

  const fundoAss = rbox(0.5, 0.025, 0.34, 0.01, PRATA, { roughness: 0.25, metalness: 0.85 })
  fundoAss.position.y = 0.0125
  assadeira.add(fundoAss)
  for (const [w, d, x, z] of [[0.5, 0.025, 0, 0.16], [0.5, 0.025, 0, -0.16], [0.025, 0.34, 0.24, 0], [0.025, 0.34, -0.24, 0]] as const) {
    const borda = rbox(w, 0.06, d, 0.01, PRATA, { roughness: 0.25, metalness: 0.85 })
    borda.position.set(x, 0.03, z)
    assadeira.add(borda)
  }
  for (const s of [-1, 1]) {
    const alca = torus(0.045, 0.012, PRATA, { roughness: 0.25, metalness: 0.85 })
    alca.position.set(s * 0.27, 0.05, 0)
    alca.rotation.y = Math.PI / 2
    alca.rotation.x = Math.PI / 2
    assadeira.add(alca)
  }
  const batatas: [number, number][] = [
    [-0.16, -0.08], [-0.05, -0.09], [0.07, -0.08], [0.17, -0.07],
    [-0.15, 0.07], [-0.03, 0.06], [0.1, 0.07],
  ]
  for (const [bx, bz] of batatas) {
    const b = sphere(0.058, BATATA, { roughness: 0.45 })
    b.scale.set(1.08, 0.85, 0.98)
    b.rotation.y = rand() * Math.PI
    b.position.set(bx, 0.065, bz)
    assadeira.add(b)
    const tosta = sphere(0.03, BATATA_TOSTA, { roughness: 0.6 })
    tosta.scale.set(1.4, 0.5, 1.1)
    tosta.position.set(bx + 0.025, 0.082, bz - 0.03)
    assadeira.add(tosta)
  }
  // fumacinha de forno
  for (const [fx, fy, fz, fr] of [[-0.06, 0.2, 0, 0.045], [0.04, 0.3, -0.02, 0.035]] as const) {
    const vapor = puff(fr, '#f6f3ee', 4, 50 + fy * 10, { roughness: 0.95 })
    vapor.position.set(fx, fy, fz)
    assadeira.add(vapor)
  }

  // raminho de alecrim (peça própria, filho da assadeira)
  const alecrim = new THREE.Group()
  alecrim.position.set(0.12, 0.125, 0.05)
  alecrim.rotation.set(0, 0.5, 0)
  assadeira.add(alecrim)
  const talo = capsule(0.011, 0.26, '#6b5a35', { roughness: 0.8 })
  talo.rotation.z = Math.PI / 2
  alecrim.add(talo)
  for (let k = 0; k < 9; k++) {
    for (const s of [-1, 1]) {
      const folha = capsule(0.012, 0.045, ALECRIM, { roughness: 0.8 })
      folha.position.set(-0.12 + k * 0.03, 0.012, s * 0.025)
      folha.rotation.set(s * 1.1, 0, 0.4)
      alecrim.add(folha)
    }
  }

  // ---- mágico de fraque e capa roxa -----------------------------------------
  const magico = person({ body: PRETO, skin: PELE, height: MAG_H, armAngle: 0.35 })
  magico.position.set(MAG_X, GY, MAG_Z)
  magico.rotation.y = 0.38
  root.add(magico)

  const bodyH = MAG_H * 0.52
  const bodyR = MAG_H * 0.17
  const headR = MAG_H * 0.19

  // peitilho branco, gravata-borboleta roxa, botões
  const peito = rbox(0.24, 0.44, 0.06, 0.03, CREME, { roughness: 0.6 })
  peito.position.set(0, bodyH * 0.6, bodyR * 0.9)
  peito.rotation.x = -0.12
  magico.add(peito)
  for (const s of [-1, 1]) {
    const lapela = rbox(0.1, 0.42, 0.05, 0.02, '#2a2731', { roughness: 0.4 })
    lapela.position.set(s * 0.16, bodyH * 0.6, bodyR * 0.86)
    lapela.rotation.set(-0.12, s * 0.35, s * 0.22)
    magico.add(lapela)
    const asa = cone(0.06, 0.12, ROXO, { roughness: 0.6 })
    asa.position.set(s * 0.065, bodyH * 0.84, bodyR * 0.98)
    asa.rotation.z = s * Math.PI / 2
    magico.add(asa)
  }
  const no = sphere(0.035, ROXO_ESC, { roughness: 0.6 })
  no.position.set(0, bodyH * 0.84, bodyR * 1.0)
  magico.add(no)
  for (const by of [0.5, 0.62]) {
    const botao = sphere(0.022, PRETO, { roughness: 0.3 })
    botao.position.set(0, bodyH * by, bodyR * 0.98)
    magico.add(botao)
  }

  // capa roxa: casca aberta atrás do corpo
  const capaGeo = new THREE.CylinderGeometry(bodyR * 1.05, bodyR * 1.75, bodyH * 0.9, 40, 1, true, Math.PI * 0.32, Math.PI * 1.36)
  const capaMat = mat(ROXO, { roughness: 0.85 })
  capaMat.side = THREE.DoubleSide
  const capa = new THREE.Mesh(capaGeo, capaMat)
  capa.castShadow = true
  capa.receiveShadow = true
  capa.position.y = bodyH * 0.92 - (bodyH * 0.9) / 2
  magico.add(capa)
  const gola = torus(bodyR * 0.95, 0.04, ROXO_ESC, { roughness: 0.8 })
  gola.rotation.x = Math.PI / 2
  gola.position.y = bodyH * 0.93
  magico.add(gola)

  const head = magico.getObjectByName('head') as THREE.Group

  // cabelo preto engomado, sobrancelhas grossas
  const cabelo = sphere(headR * 1.0, PRETO_BIGODE, { roughness: 0.35 })
  cabelo.scale.set(1.05, 0.78, 0.92)
  cabelo.position.set(0, headR * 0.32, -headR * 0.22)
  head.add(cabelo)
  for (const s of [-1, 1]) {
    const sobr = capsule(0.028, 0.09, PRETO_BIGODE, { roughness: 0.6 })
    sobr.rotation.z = Math.PI / 2 + s * 0.25
    sobr.position.set(s * headR * 0.38, headR * 0.36, headR * 0.86)
    head.add(sobr)
  }

  // ---- BIGODÃO cobrindo a boca (peça) ---------------------------------------
  const bigode = new THREE.Group()
  bigode.position.set(0, -headR * 0.3, headR * 0.86)
  head.add(bigode)
  const centro = sphere(0.1, PRETO_BIGODE, { roughness: 0.75 })
  centro.scale.set(1.3, 0.85, 0.75)
  bigode.add(centro)
  for (const s of [-1, 1]) {
    const lado = capsule(0.075, 0.2, PRETO_BIGODE, { roughness: 0.75 })
    lado.rotation.z = s * (Math.PI / 2 + 0.38)
    lado.position.set(s * 0.17, -0.05, -0.03)
    bigode.add(lado)
    const ponta = capsule(0.045, 0.1, PRETO_BIGODE, { roughness: 0.75 })
    ponta.rotation.z = s * 0.35
    ponta.position.set(s * 0.3, 0.0, -0.06)
    bigode.add(ponta)
    const caracol = sphere(0.045, PRETO_BIGODE, { roughness: 0.75 })
    caracol.position.set(s * 0.29, 0.07, -0.06)
    bigode.add(caracol)
  }

  // ---- braço direito com a varinha ------------------------------------------
  const bracoR = magico.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoR, MAG_H)
  bracoR.rotation.z = 1.12
  const bracoL = magico.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoL, MAG_H)
  bracoL.rotation.z = BRACO_L

  const mao = bracoL.children[0]
  const varinha = new THREE.Group()
  varinha.position.copy(mao.position)
  varinha.rotation.z = 0
  bracoL.add(varinha)
  const vara = cylinder(0.022, 0.022, 0.5, PRETO, { roughness: 0.3 })
  vara.position.y = -0.25
  varinha.add(vara)
  const ponteira = cylinder(0.024, 0.024, 0.1, '#f8f6f0', { roughness: 0.3 })
  ponteira.position.y = -0.53
  varinha.add(ponteira)

  // ---- COELHO saltando da cartola -------------------------------------------
  const coelho = new THREE.Group()
  coelho.position.set(HAT_X, RIM, HAT_Z)
  coelho.rotation.set(0, 0.12, 0.1)
  root.add(coelho)

  const tronco = capsule(0.165, 0.24, PELO, { roughness: 0.85 })
  tronco.position.y = 0.02
  coelho.add(tronco)
  const peitoC = sphere(0.13, PELO, { roughness: 0.85 })
  peitoC.scale.set(1, 1.1, 0.8)
  peitoC.position.set(0, 0.06, 0.08)
  coelho.add(peitoC)

  const cabeca = sphere(0.185, PELO, { roughness: 0.85 })
  cabeca.scale.set(1.0, 0.95, 0.95)
  cabeca.position.y = 0.4
  coelho.add(cabeca)
  for (const s of [-1, 1]) {
    const bochecha = sphere(0.095, PELO, { roughness: 0.85 })
    bochecha.position.set(s * 0.085, 0.33, 0.1)
    coelho.add(bochecha)
  }
  const focinho = sphere(0.075, PELO_SOMBRA, { roughness: 0.85 })
  focinho.scale.set(1.2, 0.8, 0.9)
  focinho.position.set(0, 0.35, 0.15)
  coelho.add(focinho)

  // bracinhos agarrando a borda da cartola
  for (const s of [-1, 1]) {
    const braco = capsule(0.05, 0.13, PELO, { roughness: 0.85 })
    braco.position.set(s * 0.15, 0.02, 0.13)
    braco.rotation.set(0.5, 0, s * 0.35)
    coelho.add(braco)
    const patinha = sphere(0.06, PELO, { roughness: 0.85 })
    patinha.scale.set(1.1, 0.8, 1.2)
    patinha.position.set(s * 0.17, -0.04, 0.2)
    coelho.add(patinha)
  }

  // olhos arregalados: peça própria (nítida, fora do refino)
  const olhos = new THREE.Group()
  coelho.add(olhos)
  for (const s of [-1, 1]) {
    const esclera = sphere(0.068, '#ffffff', { roughness: 0.2 })
    esclera.scale.set(1, 1.1, 0.55)
    esclera.position.set(s * 0.08, 0.46, 0.15)
    olhos.add(esclera)
    const contorno = torus(0.066, 0.008, '#3a2c30', { roughness: 0.5 })
    contorno.scale.set(1, 1.1, 1)
    contorno.position.set(s * 0.08, 0.46, 0.168)
    contorno.rotation.set(-0.1, s * 0.4, 0)
    olhos.add(contorno)
    const pupila = sphere(0.022, '#141016', { roughness: 0.2 })
    pupila.position.set(s * 0.08 - 0.012, 0.455, 0.19)
    olhos.add(pupila)
    const brilho = sphere(0.008, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 })
    brilho.position.set(s * 0.08 - 0.004, 0.468, 0.205)
    olhos.add(brilho)
  }
  // pivô no meio dos olhos: o "arregalar" cresce no lugar
  olhos.position.set(0, 0.46, 0.15)
  for (const c of olhos.children) c.position.sub(olhos.position)
  // nariz e boca aberta
  const nariz = sphere(0.03, ROSA, { roughness: 0.4 })
  nariz.scale.set(1.2, 0.85, 0.8)
  nariz.position.set(0, 0.385, 0.215)
  coelho.add(nariz)
  const boca = sphere(0.045, '#4a1e26', { roughness: 0.6 })
  boca.scale.set(1, 1.15, 0.5)
  boca.position.set(0, 0.285, 0.185)
  coelho.add(boca)
  const lingua = sphere(0.025, ROSA, { roughness: 0.5 })
  lingua.scale.set(1.2, 0.6, 0.6)
  lingua.position.set(0, 0.258, 0.2)
  coelho.add(lingua)
  for (const s of [-1, 1]) {
    const dente = rbox(0.024, 0.032, 0.012, 0.005, '#ffffff', { roughness: 0.3 })
    dente.position.set(s * 0.013, 0.322, 0.215)
    coelho.add(dente)
  }

  // ---- orelhas compridas esticadas para o bigode (peça) ---------------------
  const orelhas = new THREE.Group()
  orelhas.position.set(0, 0.5, 0.01)
  orelhas.rotation.z = ORELHA_ROT
  coelho.add(orelhas)
  for (const [s, extra] of [[-1, -0.06], [1, 0.06]] as const) {
    const orelha = new THREE.Group()
    orelha.position.set(0, 0, s * 0.06)
    orelha.rotation.set(s * 0.12, 0, extra)
    orelhas.add(orelha)
    const fora = capsule(0.055, 0.52, PELO, { roughness: 0.85 })
    fora.scale.set(1.25, 1, 0.55)
    fora.position.y = 0.32
    orelha.add(fora)
    const dentro = capsule(0.034, 0.46, ROSA, { roughness: 0.7 })
    dentro.scale.set(1.2, 1, 0.4)
    dentro.position.set(0, 0.32, 0.022)
    orelha.add(dentro)
  }

  // ---- "?!" do berro --------------------------------------------------------
  const berro = grito()
  berro.position.set(HAT_X + 0.4, RIM + 0.68, HAT_Z + 0.1)
  berro.rotation.set(-0.12, -0.05, -0.12)
  root.add(berro)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'palco', group: 'palco', object: palco },
    { name: 'cortina', group: 'palco', object: cortina },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'cartola', group: 'mesa', object: cartola },
    { name: 'magico', group: 'magico', object: magico },
    { name: 'bigode', group: 'magico', object: bigode },
    { name: 'bracoL', group: 'magico', object: bracoL },
    { name: 'varinha', group: 'magico', object: varinha },
    { name: 'assadeira', group: 'assado', object: assadeira },
    { name: 'alecrim', group: 'assado', object: alecrim },
    { name: 'coelho', group: 'coelho', object: coelho },
    { name: 'olhos', group: 'coelho', object: olhos },
    { name: 'orelhas', group: 'coelho', object: orelhas },
    { name: 'berro', group: 'berro', object: berro },
  ]

  const s3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('palco-sobe', 'palco', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um palco de madeira sobe do chão, e a cortina de veludo desce atrás…',
    }),
    seq('cortina-desce', 'cortina', 0.3, 1.0, [ch('position.y', 3.2, 0)], { ease: 'easeOut' }),

    seq('mesa-sobe', 'mesa', 1.8, 0.7, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'No centro, a mesinha de toalha roxa e a CARTOLA preta do número.',
    }),
    seq('cartola-cai', 'cartola', 2.2, 0.6, [ch('position.y', TOP + 1.2, TOP + 0.035), ch('rotation.y', 2.2, 0.2)], { ease: 'easeOut' }),

    seq('magico-sobe', 'magico', 3.5, 0.9, [riseFrom(GY, 2.3)], {
      ease: 'easeOut',
      caption: 'Entra o mágico de BIGODÃO e murmura a fórmula tão baixo, por baixo do bigode, que ninguém entende nada.',
    }),
    seq('bigode-cresce', 'bigode', 4.1, 0.6, s3(0.05, 1), { ease: 'easeOut' }),
    seq('braco-ergue', 'bracoL', 4.2, 0.7, [ch('rotation.z', -0.35, BRACO_L)], { ease: 'easeOut' }),
    seq('varinha-surge', 'varinha', 4.5, 0.5, s3(0.01, 1), { ease: 'easeOut' }),

    seq('assadeira-desliza', 'assadeira', 6.0, 0.7, [ch('position.x', TABLE_X + 1.4, TABLE_X + 0.3), ...s3(0.4, 1.25)], {
      ease: 'easeOut',
      caption: 'Ao lado da cartola, uma ASSADEIRA de batatas douradas, pronta pro próximo número…',
    }),
    seq('alecrim-pousa', 'alecrim', 6.6, 0.5, [ch('position.y', 0.45, 0.125), ch('rotation.y', -1.0, 0.5)], { ease: 'easeOut' }),

    seq('coelho-salta', 'coelho', 8.0, 0.45, [ch('position.y', RIM - 0.55, RIM + 0.14)], {
      ease: 'easeOut',
      caption: 'Dentro da cartola, o coelho só pesca UMA palavra do murmúrio: ASSADO!',
    }),
    seq('olhos-arregalam', 'olhos', 8.1, 0.35, s3(0.4, 1), { ease: 'easeOut' }),
    seq('orelhas-surgem', 'orelhas', 8.0, 0.5, [ch('scale.y', 0.3, 1), ch('rotation.z', 0, 0)], { ease: 'easeOut' }),
    seq('coelho-assenta', 'coelho', 8.45, 0.35, [ch('position.y', RIM + 0.14, RIM)], { ease: 'easeIn' }),
    seq('orelhas-esticam', 'orelhas', 9.3, 0.45, [ch('rotation.z', 0, ORELHA_ROT)], {
      ease: 'easeOut',
      caption: 'Ele estica as duas orelhas na direção do bigode e berra: VÁ, ASSADO?!',
    }),
    seq('coelho-treme-a', 'coelho', 9.4, 0.15, [ch('rotation.z', 0.1, 0.18)]),
    seq('coelho-treme-b', 'coelho', 9.55, 0.15, [ch('rotation.z', 0.18, 0.04)]),
    seq('coelho-treme-c', 'coelho', 9.7, 0.2, [ch('rotation.z', 0.04, 0.1)]),
    seq('berro-estoura', 'berro', 9.6, 0.45, s3(0.01, 1), { ease: 'easeOut' }),

    seq('bigode-murcha', 'bigode', 11.0, 0.3, [ch('scale.y', 1, 0.85)]),
    seq('bigode-volta', 'bigode', 11.3, 0.4, [ch('scale.y', 0.85, 1)], {
      caption: 'Vad sa du? — O que você disse?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.1, 1.75, 4.15], target: [-0.26, 1.24, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-sa-du',
    contexto:
      'Quando você não ouviu ou não pegou o que disseram: barulho no ônibus, ligação ruim, alguém falando baixo na fika.',
    fraseFonte: 'O que você disse?',
    fraseAlvo: 'Vad sa du?',
    pronuncia:
      "va SÁ dü? ('vad' perde o d na fala: VÁ, sem R; 'sa' é a forma falada de 'sade' (disse), A longo; 'du' com U de bico (Ü), longo)",
    ponteSonora:
      "VÁ, ASSADO?! (3 batidas, va-SÁ-dü, tônica no SÁ; VÁ é o MESMO 'vad' de 'VÁ, CÓS-TAR', 'VÁ, CÜL!' e 'VÁ! É CLÓ-CAN' — sem R nenhum, senão vira 'var' (onde); o A de VÁ se funde no A de ASSADO: VA-SSÁ-DU, nada de duas vogais nem de dois acentos; o SS é S de cobra, nunca Z; o -DO final o brasileiro já fala 'du' — só falta empurrar a LÍNGUA pra frente, como se fosse dizer 'di' de bico: DÜ, no tom de pergunta)",
    historia:
      "No palco, o mágico de bigodão murmura a fórmula tão baixo, por baixo do bigode, que ninguém entende nada — e na mesa, ao lado da cartola, está uma ASSADEIRA com batatas e um raminho de alecrim, pronta para o próximo número. Dentro da cartola, o coelho só pesca uma palavra no murmúrio: ASSADO. Ele pula pra fora de olhos arregalados, estica as duas orelhas na direção do bigode e berra, tremendo: 'VÁ, ASSADO?!' — o que foi que você disse?!",
  },
  createScene,
  refine: { organic: ['coelho'] },
}

export default card
