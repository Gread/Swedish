import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Kan jag betala med kort?" — CA-NIÁ! BÊ-TÁLA... MÊ CÓRT?
 *
 * Quiosque de caldo de CANA (letreiro na frente), um gorila de dois metros
 * com o braço numa TALA de madeira encostando um pedacinho de cartão na
 * maquininha que apita BÊ, a cana-espada no fim do CORTE e a metade gigante
 * do cartão azul tombada na calçada. Azul-royal é o acento: só o cartão.
 */

const PEDRA = '#8d8a84'
const PEDRAS = ['#d3d0c8', '#c6c2b9', '#dcd9d2', '#bdb9b0', '#cbc7bf']
const VERDE = '#3f8a4c'
const VERDE_ESC = '#2f6b3a'
const MADEIRA = '#d8c29a'
const MADEIRA_ESC = '#9b7a4e'
const AMARELO = '#efc75c'
const BRANCO = '#f6f1e3'
const CREME = '#f7efd8'
const CANA = '#78a94e'
const CANA_ESC = '#557d36'
const CANA_MIOLO = '#e2e7b4'
const CALDO = '#c9df7e'
const PELO = '#26252a'
const PRATA = '#a3a5ab'
const PELE = '#4b4649'
const TALA = '#e0bf82'
const FAIXA = '#f4f3ee'
const MAQUINA = '#3a3d43'
const TELA = '#62f08e'
const AZUL = '#1f4fd8' // acento saturado: SÓ o cartão
const AZUL_CLARO = '#5d86f0'
const CHIP = '#d6b45a'

const GY = 0.14 // topo da calçada
const TOP = 1.0 // tampo do balcão
const CX0 = -2.1 // balcão: x de CX0 a CX1
const CX1 = 0.0
const CZF = -0.5 // frente do balcão
const CZB = -1.2 // fundo do balcão

const GORILA_POS = new THREE.Vector3(0.95, GY, -0.12)
const GORILA_ROT = -0.3
const OMBRO_TALA = new THREE.Vector3(-0.56, 1.62, 0.2)
const OMBRO_CANA = new THREE.Vector3(0.56, 1.62, 0.2)
const MAO_CANA = new THREE.Vector3(0.62, 0.78, 0.78) // local do gorila
const PONTA_CANA = new THREE.Vector3(0.12, GY + 0.04, 1.62) // mundo
const ALVO_MAQ = new THREE.Vector3(-0.6, TOP + 0.3, -0.58) // mundo: tela da maquininha

const METADE_CHAO = { x: -0.32, y: GY + 0.07, z: 1.22, rx: -Math.PI / 2 + 0.12, ry: 0, rz: 0.42 }

const CAMERA: [number, number, number] = [0.75, 2.45, 5.1]

const DOWN = new THREE.Vector3(0, -1, 0)
const UP = new THREE.Vector3(0, 1, 0)

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.008, CREME, { roughness: 0.55 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** C A N — letras de traço grosso (0.16 de altura, escalar o grupo). */
function letter(which: 'C' | 'A' | 'N') {
  const g = new THREE.Group()
  const t = 0.03
  if (which === 'C') {
    g.add(stroke(t, 0.16, -0.04, 0))
    g.add(stroke(0.09, t, 0.0, 0.065))
    g.add(stroke(0.09, t, 0.0, -0.065))
  } else if (which === 'A') {
    g.add(stroke(t, 0.17, -0.027, 0, -0.3))
    g.add(stroke(t, 0.17, 0.027, 0, 0.3))
    g.add(stroke(0.064, 0.024, 0, -0.026))
  } else {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(t, 0.16, 0.042, 0))
    g.add(stroke(0.026, 0.19, 0, 0, 0.44))
  }
  return g
}

/** Uma cana: colmo verde com nós, ao longo de +y a partir de y0. */
function caneStalk(len: number, r: number, y0 = 0, cutTop = true) {
  const g = new THREE.Group()
  const colmo = cylinder(r, r * 1.05, len, CANA, { roughness: 0.45 }, 14)
  colmo.position.y = y0 + len / 2
  g.add(colmo)
  for (let y = 0.22; y < len - 0.06; y += 0.26) {
    const no = torus(r * 1.02, r * 0.28, CANA_ESC, { roughness: 0.5 })
    no.rotation.x = Math.PI / 2
    no.position.y = y0 + y
    g.add(no)
  }
  if (cutTop) {
    const miolo = cylinder(r * 0.92, r * 0.92, 0.012, CANA_MIOLO, { roughness: 0.7 }, 14)
    miolo.position.y = y0 + len
    g.add(miolo)
  }
  return g
}

/** Braço de gorila ao longo de -y: ombro em 0, mão em -len. */
function gorillaArm(len: number) {
  const g = new THREE.Group()
  const ombro = sphere(0.21, PELO, { roughness: 0.9 })
  g.add(ombro)
  const braco = capsule(0.17, len * 0.42, PELO, { roughness: 0.9 })
  braco.position.y = -len * 0.27
  g.add(braco)
  const cotovelo = sphere(0.16, PELO, { roughness: 0.9 })
  cotovelo.position.y = -len * 0.52
  g.add(cotovelo)
  const antebraco = capsule(0.16, len * 0.36, PELO, { roughness: 0.9 })
  antebraco.position.y = -len * 0.74
  g.add(antebraco)
  const mao = sphere(0.15, PELE, { roughness: 0.8 })
  mao.scale.set(1.05, 1.1, 0.8)
  mao.position.y = -len
  g.add(mao)
  for (let d = 0; d < 4; d++) {
    const dedo = capsule(0.042, 0.07, PELE, { roughness: 0.8 })
    dedo.position.set(-0.09 + d * 0.06, -len - 0.1, 0.06)
    dedo.rotation.x = 0.6
    g.add(dedo)
  }
  const polegar = capsule(0.045, 0.06, PELE, { roughness: 0.8 })
  polegar.position.set(0.12, -len - 0.04, 0.05)
  polegar.rotation.z = 0.7
  g.add(polegar)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- calçada de pedra cinza-clara ----------------------------------------
  const base = new THREE.Group()
  const disco = cylinder(2.65, 2.75, 0.12, PEDRA, { roughness: 0.9 })
  disco.position.y = 0.06
  base.add(disco)
  const step = 0.3
  for (let ix = -9; ix <= 9; ix++) {
    for (let iz = -9; iz <= 9; iz++) {
      const x = ix * step + (iz % 2 ? step / 2 : 0)
      const z = iz * step
      if (Math.hypot(x, z) > 2.48) continue
      const cor = PEDRAS[Math.floor(rand() * PEDRAS.length)]
      const pedra = rbox(0.27, 0.04, 0.27, 0.035, cor, { roughness: 0.85 })
      pedra.position.set(x, GY - 0.02 + rand() * 0.01, z)
      pedra.rotation.y = (rand() - 0.5) * 0.12
      base.add(pedra)
    }
  }
  const meioFio = torus(2.6, 0.06, '#a9a59c', { roughness: 0.85 })
  meioFio.rotation.x = Math.PI / 2
  meioFio.position.y = GY - 0.02
  base.add(meioFio)
  // bagaço e toquinhos de cana pela calçada
  for (const [bx, bz, br] of [[1.6, 1.3, 0.4], [-1.7, 1.35, -0.9], [1.85, -0.6, 1.2]] as const) {
    const toco = caneStalk(0.24, 0.035, 0, true)
    toco.rotation.set(Math.PI / 2, 0, br)
    toco.position.set(bx, GY + 0.035, bz)
    base.add(toco)
  }
  const bagaco = puff(0.12, '#d9d3a2', 5, 7, { roughness: 0.95 })
  bagaco.scale.y = 0.4
  bagaco.position.set(-1.25, GY + 0.03, 0.25)
  base.add(bagaco)
  root.add(base)

  // ---- quiosque: balcão verde-folha ----------------------------------------
  const quiosque = new THREE.Group()
  const W = CX1 - CX0
  const MX = (CX0 + CX1) / 2
  const H = TOP - GY - 0.06
  const frente = rbox(W, H, 0.12, 0.03, VERDE, { roughness: 0.6 })
  frente.position.set(MX, GY + H / 2, CZF + 0.06)
  quiosque.add(frente)
  for (let i = 0; i < 10; i++) {
    const x = CX0 + 0.12 + i * ((W - 0.24) / 9)
    if (x > MX - 0.62 && x < MX + 0.62) continue // atrás do letreiro
    const friso = rbox(0.022, H - 0.12, 0.02, 0.008, VERDE_ESC, { roughness: 0.7 })
    friso.position.set(x, GY + H / 2, CZF + 0.125)
    quiosque.add(friso)
  }
  const fundo = rbox(W, H, 0.1, 0.03, VERDE_ESC, { roughness: 0.7 })
  fundo.position.set(MX, GY + H / 2, CZB + 0.05)
  quiosque.add(fundo)
  for (const sx of [CX0, CX1]) {
    const lado = rbox(0.1, H, CZF - CZB, 0.03, VERDE_ESC, { roughness: 0.7 })
    lado.position.set(sx + (sx === CX0 ? 0.05 : -0.05), GY + H / 2, (CZF + CZB) / 2)
    quiosque.add(lado)
  }
  const tampo = rbox(W + 0.14, 0.07, CZF - CZB + 0.14, 0.03, MADEIRA, { roughness: 0.5 })
  tampo.position.set(MX, TOP - 0.035, (CZF + CZB) / 2)
  quiosque.add(tampo)
  const rodape = rbox(W + 0.04, 0.08, 0.16, 0.03, MADEIRA_ESC, { roughness: 0.7 })
  rodape.position.set(MX, GY + 0.04, CZF + 0.06)
  quiosque.add(rodape)

  // letreiro CANA no frontal, virado para a câmera
  const placa = rbox(1.18, 0.42, 0.04, 0.04, VERDE_ESC, { roughness: 0.6 })
  placa.position.set(MX, GY + H * 0.58, CZF + 0.135)
  quiosque.add(placa)
  const moldura = rbox(1.1, 0.34, 0.02, 0.035, '#356f41', { roughness: 0.6 })
  moldura.position.set(MX, GY + H * 0.58, CZF + 0.16)
  quiosque.add(moldura)
  const letras: ['C' | 'A' | 'N', number][] = [['C', -0.36], ['A', -0.12], ['N', 0.12], ['A', 0.36]]
  for (const [gl, lx] of letras) {
    const l = letter(gl)
    l.scale.setScalar(1.55)
    l.position.set(MX + lx, GY + H * 0.58, CZF + 0.18)
    quiosque.add(l)
  }

  // moenda de cana atrás do balcão (volante + corpo)
  const moenda = new THREE.Group()
  moenda.position.set(-1.72, TOP, -0.98)
  const corpoMoenda = rbox(0.42, 0.34, 0.3, 0.04, '#c94f3a', { roughness: 0.5 })
  corpoMoenda.position.y = 0.17
  moenda.add(corpoMoenda)
  const volante = torus(0.2, 0.025, '#5a5e64', { roughness: 0.35, metalness: 0.7 })
  volante.position.set(0.25, 0.22, 0)
  volante.rotation.y = Math.PI / 2
  moenda.add(volante)
  const eixo = cylinder(0.03, 0.03, 0.12, '#5a5e64', { roughness: 0.35, metalness: 0.7 })
  eixo.rotation.z = Math.PI / 2
  eixo.position.set(0.2, 0.22, 0)
  moenda.add(eixo)
  quiosque.add(moenda)

  // postes do toldo
  for (const px of [CX0 + 0.08, CX1 - 0.08]) {
    const poste = cylinder(0.035, 0.035, 2.45 - TOP, MADEIRA_ESC, { roughness: 0.6 })
    poste.position.set(px, TOP + (2.45 - TOP) / 2, CZB + 0.08)
    quiosque.add(poste)
  }
  root.add(quiosque)

  // ---- toldo listrado amarelo e branco -------------------------------------
  const toldo = new THREE.Group()
  const TW = W + 0.3
  const N = 9
  const listra = TW / N
  const TZ0 = CZB - 0.05
  const TZ1 = CZF + 0.35
  const TD = TZ1 - TZ0
  const inclinacao = 0.32
  const lona = new THREE.Group()
  lona.position.set(MX, 2.45, TZ0)
  lona.rotation.x = inclinacao
  for (let i = 0; i < N; i++) {
    const cor = i % 2 === 0 ? AMARELO : BRANCO
    const faixa = rbox(listra + 0.004, 0.035, TD, 0.012, cor, { roughness: 0.85 })
    faixa.position.set(-TW / 2 + listra * (i + 0.5), 0, TD / 2)
    lona.add(faixa)
    const aba = cylinder(listra / 2, listra / 2, 0.035, cor, { roughness: 0.85 }, 20)
    aba.rotation.x = Math.PI / 2
    aba.position.set(-TW / 2 + listra * (i + 0.5), -0.02, TD)
    aba.scale.set(1, 1, 1)
    lona.add(aba)
  }
  const sanefa = rbox(TW, 0.12, 0.03, 0.012, AMARELO, { roughness: 0.85 })
  sanefa.position.set(0, -0.06, TD)
  sanefa.rotation.x = -inclinacao
  lona.add(sanefa)
  toldo.add(lona)
  root.add(toldo)

  // ---- feixe de 5 canas encostado no balcão --------------------------------
  const canas = new THREE.Group()
  canas.position.set(CX0 - 0.22, GY, -0.62)
  for (let i = 0; i < 5; i++) {
    const c = caneStalk(1.75 + rand() * 0.3, 0.045, 0, true)
    c.position.set((i - 2) * 0.075, 0, (i % 2) * 0.07 - 0.03)
    c.rotation.set((rand() - 0.5) * 0.08, 0, -0.1 - rand() * 0.06)
    canas.add(c)
  }
  for (const ay of [0.45, 1.1]) {
    const amarra = torus(0.2, 0.025, '#b79a63', { roughness: 0.9 })
    amarra.rotation.x = Math.PI / 2
    amarra.scale.set(1, 0.6, 1)
    amarra.position.set(0.05 + ay * 0.1, ay, 0)
    canas.add(amarra)
  }
  root.add(canas)

  // ---- copo alto de caldo de cana ------------------------------------------
  const copo = new THREE.Group()
  copo.position.set(-1.25, TOP, -0.72)
  const vidro = lathe(
    [[0, 0], [0.075, 0], [0.08, 0.02], [0.095, 0.34], [0.085, 0.34], [0, 0.33]],
    CALDO,
    { roughness: 0.15 },
  )
  copo.add(vidro)
  const espuma = cylinder(0.094, 0.094, 0.03, '#eef3c8', { roughness: 0.8 })
  espuma.position.y = 0.33
  copo.add(espuma)
  const canudo = cylinder(0.012, 0.012, 0.4, BRANCO, { roughness: 0.4 })
  canudo.position.set(0.03, 0.42, 0)
  canudo.rotation.z = -0.25
  copo.add(canudo)
  const rodela = cylinder(0.05, 0.05, 0.012, '#9fd36a', { roughness: 0.5 })
  rodela.position.set(-0.08, 0.32, 0.03)
  rodela.rotation.z = 1.2
  copo.add(rodela)
  root.add(copo)

  // ---- maquininha de cartão com tela acesa ---------------------------------
  const maquininha = new THREE.Group()
  maquininha.position.set(-0.62, TOP, -0.78)
  maquininha.rotation.y = 0.3
  const suporte = rbox(0.3, 0.05, 0.3, 0.02, '#2b2e33', { roughness: 0.5 })
  suporte.position.y = 0.025
  maquininha.add(suporte)
  const corpo = new THREE.Group()
  corpo.position.set(0, 0.05, -0.06)
  corpo.rotation.x = -0.55
  const casco = rbox(0.26, 0.42, 0.07, 0.03, MAQUINA, { roughness: 0.45 })
  casco.position.y = 0.21
  corpo.add(casco)
  const tela = rbox(0.2, 0.15, 0.012, 0.01, TELA, { emissive: TELA, emissiveIntensity: 1.1 })
  tela.position.set(0, 0.32, 0.037)
  corpo.add(tela)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const tecla = rbox(0.05, 0.032, 0.014, 0.008, r === 3 && c === 2 ? '#4fbf6a' : '#c9ccd1', { roughness: 0.4 })
      tecla.position.set(-0.065 + c * 0.065, 0.2 - r * 0.045, 0.038)
      corpo.add(tecla)
    }
  }
  const papel = rbox(0.16, 0.05, 0.01, 0.004, '#f4f2ec', { roughness: 0.8 })
  papel.position.set(0, 0.44, 0.0)
  corpo.add(papel)
  // ondas do apito: arcos emissivos ao lado da tela
  for (let k = 0; k < 3; k++) {
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(0.1 + k * 0.07, 0.012, 8, 24, Math.PI * 0.6),
      mat(TELA, { emissive: TELA, emissiveIntensity: 1.3 }),
    )
    arco.position.set(0.0, 0.34, 0.04)
    arco.rotation.z = Math.PI * 0.2
    corpo.add(arco)
  }
  maquininha.add(corpo)
  root.add(maquininha)

  // ---- GORILA --------------------------------------------------------------
  const gorila = new THREE.Group()
  gorila.position.copy(GORILA_POS)
  gorila.rotation.y = GORILA_ROT
  root.add(gorila)

  const quadril = sphere(0.42, PELO, { roughness: 0.9 })
  quadril.scale.set(1.1, 0.8, 0.95)
  quadril.position.set(0, 0.74, -0.02)
  gorila.add(quadril)
  for (const side of [-1, 1]) {
    const coxa = capsule(0.18, 0.28, PELO, { roughness: 0.9 })
    coxa.position.set(side * 0.26, 0.5, 0.04)
    coxa.rotation.z = side * 0.12
    gorila.add(coxa)
    const canela = capsule(0.15, 0.2, PELO, { roughness: 0.9 })
    canela.position.set(side * 0.29, 0.24, 0.06)
    gorila.add(canela)
    const pe = sphere(0.16, PELE, { roughness: 0.8 })
    pe.scale.set(0.95, 0.45, 1.45)
    pe.position.set(side * 0.3, 0.07, 0.15)
    gorila.add(pe)
  }
  const tronco = sphere(0.56, PELO, { roughness: 0.9 })
  tronco.scale.set(1.12, 1.08, 0.92)
  tronco.position.set(0, 1.28, 0.06)
  gorila.add(tronco)
  const corcova = sphere(0.5, PELO, { roughness: 0.9 })
  corcova.scale.set(1.3, 0.72, 0.95)
  corcova.position.set(0, 1.62, 0.02)
  gorila.add(corcova)
  const costas = sphere(0.46, PRATA, { roughness: 0.9 })
  costas.scale.set(0.9, 0.92, 0.5)
  costas.position.set(0, 1.25, -0.32)
  gorila.add(costas)
  const peito = sphere(0.34, PELE, { roughness: 0.8 })
  peito.scale.set(1.25, 0.85, 0.45)
  peito.position.set(0, 1.4, 0.5)
  gorila.add(peito)
  const barriga = sphere(0.38, PELO, { roughness: 0.9 })
  barriga.scale.set(1.05, 0.9, 0.8)
  barriga.position.set(0, 1.0, 0.28)
  gorila.add(barriga)

  // ---- cabeça: testa larga, focinho cinza, olhos arregalados ---------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.86, 0.4)
  gorila.add(cabeca)
  const cranio = sphere(0.29, PELO, { roughness: 0.9 })
  cranio.scale.set(1.05, 1.0, 0.95)
  cabeca.add(cranio)
  const crista = sphere(0.19, PELO, { roughness: 0.9 })
  crista.scale.set(0.65, 0.95, 1.15)
  crista.position.set(0, 0.2, -0.08)
  cabeca.add(crista)
  const rosto = sphere(0.22, PELE, { roughness: 0.75 })
  rosto.scale.set(1.15, 1.05, 0.55)
  rosto.position.set(0, -0.02, 0.17)
  cabeca.add(rosto)
  const testa = capsule(0.075, 0.3, PELE, { roughness: 0.75 })
  testa.rotation.z = Math.PI / 2
  testa.position.set(0, 0.1, 0.24)
  cabeca.add(testa)
  const focinho = sphere(0.19, PELE, { roughness: 0.75 })
  focinho.scale.set(1.15, 0.85, 0.8)
  focinho.position.set(0, -0.12, 0.25)
  cabeca.add(focinho)
  for (const side of [-1, 1]) {
    const narina = sphere(0.032, '#1c1b1e', { roughness: 0.5 })
    narina.position.set(side * 0.05, -0.05, 0.395)
    cabeca.add(narina)
    const orelha = sphere(0.06, PELE, { roughness: 0.8 })
    orelha.scale.set(0.5, 1, 0.8)
    orelha.position.set(side * 0.3, 0.0, 0.0)
    cabeca.add(orelha)
    // olhos de susto: esclera grande, pupila pequena
    const esclera = sphere(0.058, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(side * 0.1, 0.03, 0.31)
    const pupila = sphere(0.022, '#141414', { roughness: 0.2 })
    pupila.position.set(side * 0.1 - 0.012, 0.03, 0.345)
    cabeca.add(esclera, pupila)
  }
  // boca em O de medo
  const boca = torus(0.045, 0.016, '#2a1f22', { roughness: 0.6 })
  boca.position.set(0, -0.2, 0.36)
  boca.scale.set(1, 1.2, 1)
  cabeca.add(boca)
  const bocaFundo = sphere(0.04, '#3a1a1f', { roughness: 0.6 })
  bocaFundo.position.set(0, -0.2, 0.345)
  cabeca.add(bocaFundo)
  // gota de suor de medo
  const suor = sphere(0.035, '#bfe3f5', { roughness: 0.1 })
  suor.scale.set(0.8, 1.3, 0.8)
  suor.position.set(0.26, 0.17, 0.2)
  cabeca.add(suor)

  root.updateMatrixWorld(true)

  // ---- braço da tala: alcança a maquininha ---------------------------------
  const alvoLocal = gorila.worldToLocal(ALVO_MAQ.clone())
  const dTala = alvoLocal.clone().sub(OMBRO_TALA)
  const L_TALA = dTala.length() - 0.24
  const bracoTala = gorillaArm(L_TALA)
  bracoTala.position.copy(OMBRO_TALA)
  bracoTala.quaternion.setFromUnitVectors(DOWN, dTala.clone().normalize())
  gorila.add(bracoTala)

  // as réguas e o pedacinho ficam do lado que a câmera vê
  root.updateMatrixWorld(true)
  const camLocal = bracoTala.worldToLocal(new THREE.Vector3(...CAMERA))
  const VISTA = Math.atan2(camLocal.x, camLocal.z)

  const tala = new THREE.Group()
  tala.position.y = -L_TALA * 0.72
  for (const side of [-1, 1]) {
    const a = VISTA + side * 0.75
    const regua = rbox(0.1, L_TALA * 0.42, 0.04, 0.014, TALA, { roughness: 0.6 })
    regua.position.set(Math.sin(a) * 0.185, 0, Math.cos(a) * 0.185)
    regua.rotation.y = a
    tala.add(regua)
  }
  for (const fy of [-0.13, 0, 0.13]) {
    const f = torus(0.185, 0.03, FAIXA, { roughness: 0.9 })
    f.rotation.x = Math.PI / 2
    f.scale.set(1, 0.85, 1)
    f.position.y = fy * L_TALA
    tala.add(f)
  }
  bracoTala.add(tala)

  // pedacinho de cartão (borda reta do corte) na ponta dos dedos
  const pedaco = new THREE.Group()
  pedaco.position.y = -L_TALA - 0.15
  pedaco.rotation.y = VISTA
  const lasca = rbox(0.3, 0.3, 0.026, 0.02, AZUL, { roughness: 0.3 })
  pedaco.add(lasca)
  const chipP = rbox(0.07, 0.055, 0.008, 0.008, CHIP, { roughness: 0.3, metalness: 0.6 })
  chipP.position.set(-0.06, -0.05, 0.016)
  pedaco.add(chipP)
  const corteP = rbox(0.3, 0.014, 0.03, 0.004, AZUL_CLARO, { roughness: 0.4 })
  corteP.position.y = 0.145
  pedaco.add(corteP)
  bracoTala.add(pedaco)

  // ---- braço da cana: baixado no fim do golpe ------------------------------
  const dCana = MAO_CANA.clone().sub(OMBRO_CANA)
  const L_CANA = dCana.length()
  const bracoCana = gorillaArm(L_CANA)
  bracoCana.position.copy(OMBRO_CANA)
  bracoCana.quaternion.setFromUnitVectors(DOWN, dCana.clone().normalize())
  gorila.add(bracoCana)
  root.updateMatrixWorld(true)

  const maoMundo = bracoCana.localToWorld(new THREE.Vector3(0, -L_CANA, 0))
  const dEspada = PONTA_CANA.clone().sub(maoMundo)
  const L_ESPADA = dEspada.length()
  const qBraco = bracoCana.getWorldQuaternion(new THREE.Quaternion()).invert()
  const cana = new THREE.Group()
  cana.position.y = -L_CANA
  cana.quaternion.setFromUnitVectors(UP, dEspada.normalize().applyQuaternion(qBraco))
  cana.add(caneStalk(L_ESPADA + 0.16, 0.042, -0.16, true))
  bracoCana.add(cana)

  // ---- metade grande do cartão ---------------------------------------------
  const metade = new THREE.Group()
  const placaCartao = rbox(1.35, 0.86, 0.04, 0.05, AZUL, { roughness: 0.3 })
  metade.add(placaCartao)
  const faixaCartao = rbox(1.2, 0.07, 0.01, 0.01, AZUL_CLARO, { roughness: 0.35 })
  faixaCartao.position.set(0, 0.22, 0.022)
  metade.add(faixaCartao)
  for (let k = 0; k < 4; k++) {
    const numeros = rbox(0.2, 0.05, 0.01, 0.01, '#e8eefc', { roughness: 0.4 })
    numeros.position.set(-0.42 + k * 0.27, -0.12, 0.022)
    metade.add(numeros)
  }
  const nome = rbox(0.5, 0.04, 0.01, 0.01, '#c4d3fa', { roughness: 0.4 })
  nome.position.set(-0.32, -0.28, 0.022)
  metade.add(nome)
  const chipM = rbox(0.18, 0.14, 0.012, 0.02, CHIP, { roughness: 0.3, metalness: 0.6 })
  chipM.position.set(-0.45, 0.04, 0.024)
  metade.add(chipM)
  const corteM = rbox(0.014, 0.86, 0.045, 0.004, AZUL_CLARO, { roughness: 0.4 })
  corteM.position.x = 0.675
  metade.add(corteM)
  metade.position.set(METADE_CHAO.x, METADE_CHAO.y, METADE_CHAO.z)
  metade.rotation.set(METADE_CHAO.rx, METADE_CHAO.ry, METADE_CHAO.rz)
  root.add(metade)

  // pose "na mão": em pé sobre o balcão, presa ao pedacinho pela borda do corte
  const pedacoMundo = bracoTala.localToWorld(new THREE.Vector3(0, -L_TALA - 0.15, 0))
  const HELD = {
    x: pedacoMundo.x - 0.62,
    y: pedacoMundo.y + 0.42,
    z: pedacoMundo.z + 0.3,
    rx: 0, ry: 0.35, rz: 0,
  }

  // ---- poses-chave ---------------------------------------------------------
  const TALA_ROT = bracoTala.rotation.clone()
  const CANA_ROT = bracoCana.rotation.clone()
  const CANA_ERGUIDA = CANA_ROT.x - 2.15

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'quiosque', object: base },
    { name: 'quiosque', group: 'quiosque', object: quiosque },
    { name: 'toldo', group: 'quiosque', object: toldo },
    { name: 'canas', group: 'quiosque', object: canas },
    { name: 'copo', group: 'quiosque', object: copo },
    { name: 'maquininha', group: 'quiosque', object: maquininha },
    { name: 'gorila', group: 'gorila', object: gorila },
    { name: 'cabeca', group: 'gorila', object: cabeca },
    { name: 'bracoTala', group: 'gorila', object: bracoTala },
    { name: 'tala', group: 'gorila', object: tala },
    { name: 'bracoCana', group: 'cana', object: bracoCana },
    { name: 'cana', group: 'cana', object: cana },
    { name: 'pedaco', group: 'cartao', object: pedaco },
    { name: 'metade', group: 'cartao', object: metade },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Numa calçada de pedra, brota um quiosque de caldo de CANA…',
    }),
    seq('quiosque-rise', 'quiosque', 0.3, 0.8, [riseFrom(0, 1.3)], { ease: 'easeOut' }),
    seq('toldo-desce', 'toldo', 0.8, 0.6, [ch('position.y', 1.4, 0)], { ease: 'easeOut' }),
    seq('canas-rise', 'canas', 1.0, 0.7, [riseFrom(GY, 2.2)], { ease: 'easeOut' }),
    seq('copo-cresce', 'copo', 1.3, 0.4, s3(0.01, 1), { ease: 'easeOut' }),
    seq('maquininha-cresce', 'maquininha', 1.45, 0.45, s3(0.01, 1), { ease: 'easeOut' }),

    seq('gorila-rise', 'gorila', 2.5, 0.9, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: '…e chega um gorila de dois metros, com o braço direito numa TALA de madeira.',
    }),
    seq('cabeca-cresce', 'cabeca', 2.8, 0.5, s3(0.3, 1), { ease: 'easeOut' }),
    seq('bracoTala-estica', 'bracoTala', 2.9, 0.6, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),
    seq('tala-cresce', 'tala', 3.4, 0.45, s3(0.01, 1), { ease: 'easeOut' }),

    seq('bracoCana-ergue', 'bracoCana', 4.7, 0.6, [
      ch('scale.y', 0.05, 1),
      ch('rotation.x', CANA_ERGUIDA, CANA_ERGUIDA),
    ], {
      ease: 'easeOut',
      caption: 'Ele arranca uma CANA do feixe e ergue feito espada de caratê: CA-NIÁ!',
    }),
    seq('cana-cresce', 'cana', 5.0, 0.5, s3(0.01, 1), { ease: 'easeOut' }),

    seq('pedaco-aparece', 'pedaco', 6.6, 0.35, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Bate a TALA na maquininha — BÊ! BÊ-TALA! — mas o cartão é do tamanho de uma porta.',
    }),
    seq('metade-aparece', 'metade', 6.6, 0.5, [
      ...s3(0.01, 1),
      ch('position.x', HELD.x, HELD.x),
      ch('position.y', HELD.y, HELD.y),
      ch('position.z', HELD.z, HELD.z),
      ch('rotation.x', HELD.rx, HELD.rx),
      ch('rotation.y', HELD.ry, HELD.ry),
      ch('rotation.z', HELD.rz, HELD.rz),
    ], { ease: 'easeOut' }),
    seq('maquininha-bip', 'maquininha', 7.3, 0.12, [ch('scale.y', 1, 1.12)], { ease: 'easeOut' }),
    seq('maquininha-bip2', 'maquininha', 7.42, 0.18, [ch('scale.y', 1.12, 1)], { ease: 'easeIn' }),

    seq('golpe', 'bracoCana', 8.8, 0.3, [ch('rotation.x', CANA_ERGUIDA, CANA_ROT.x)], {
      ease: 'easeIn',
      caption: 'Morrendo de MEDO de ser recusado, desce a cana num CORTE seco — CÓRT! — e a metade gigante despenca.',
    }),
    seq('metade-cai', 'metade', 9.1, 0.55, [
      ch('position.x', HELD.x, METADE_CHAO.x),
      ch('position.y', HELD.y, METADE_CHAO.y),
      ch('position.z', HELD.z, METADE_CHAO.z),
      ch('rotation.x', HELD.rx, METADE_CHAO.rx),
      ch('rotation.y', HELD.ry, METADE_CHAO.ry),
      ch('rotation.z', HELD.rz, METADE_CHAO.rz),
    ], { ease: 'easeIn' }),

    seq('cabeca-olha', 'cabeca', 10.6, 0.6, [ch('rotation.x', 0, 0.15)], {
      caption: 'Sobra o pedacinho na tala; ele encosta na máquina e pergunta baixinho: MÊ CÓRT?',
    }),
    seq('bracoTala-encosta', 'bracoTala', 10.7, 0.5, [ch('rotation.x', TALA_ROT.x + 0.08, TALA_ROT.x)]),

    seq('maquininha-bip3', 'maquininha', 12.0, 0.12, [ch('scale.y', 1, 1.12)], {
      ease: 'easeOut',
      caption: 'Kan jag betala med kort? — Posso pagar com cartão?',
    }),
    seq('maquininha-bip4', 'maquininha', 12.12, 0.2, [ch('scale.y', 1.12, 1)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAMERA, target: [-0.4, 1.03, -0.05] },
  }
}

const PRONUNCIA =
  "kan iá be-TÁA-la mê KÚT? ('jag' = iá, o -g não soa; 'betala' tem a força no TÁ, com A longo e o 'be-' fraquinho; 'med' = mê, sem D; 'kort' = KÓT curtinho, com Ó ABERTO como em 'um corte' — nunca o U de 'curto' —, e o 'rt' vira um T de língua dobrada pra trás: o R se dissolve dentro do T)"
const PONTE =
  "CA-NIÁ! BÊ-TÁLA... MÊ CÓRT(e)? (7 sílabas: ca-niá-be-TÁ-la-mê-KÓRT; tônicas em TÁ e CÓRT; CANA + IÁ = 'kan jag', o MESMO âncora da galinha de 'Kan jag få en påse?' — emendado CA-NIÁ, com I de IOGA, nunca o J chiado de 'canja'; BÊ = o bipe da maquininha, curtinho e SEM força — é o 'be-' de 'betala'; TALA = a tala do braço, força no TÁ com A longo: be-TÁA-la, nunca 'BÉ-ta-la'; MÊ = MEDO sem o -DO, o mesmo 'med' de 'Vad jobbar du med?', Ê fechado e D mudo; CÓRT(e) = o CORTE da cana-espada, sem o -e, com o Ó ABERTO de 'um corte' — nunca 'CURT', que com U fechado vira outra vogal; o R quase some: a língua dobra pra trás e já dispara o T)"
const HISTORIA =
  "No quiosque de caldo de CANA, um gorila de dois metros, com o braço direito imobilizado numa TALA de madeira, arranca uma cana do feixe e a ergue feito espada de caratê: CANA, IÁ! Depois bate a TALA inteira na maquininha, que apita BÊ! — BÊ-TALA, BÊ-TALA —, mas o cartão dele é do tamanho de uma porta e não encosta direito. Morrendo de MEDO de ser recusado, ele desce a cana num CORTE seco — CÓRT! —, a metade gigante despenca no chão e o pedacinho que sobra ele aproxima da máquina, perguntando baixinho: MÊ CÓRT? É assim que se pergunta, em sueco, se dá pra pagar no cartão."

export const card: Card = {
  meta: {
    id: 'kan-jag-betala-med-kort',
    contexto:
      'Compras: no caixa de loja, café, quiosque ou feirinha. Quase tudo aceita cartão (muita coisa SÓ cartão), mas em food truck, loppis ou barraca vale perguntar antes.',
    fraseFonte: 'Posso pagar com cartão?',
    fraseAlvo: 'Kan jag betala med kort?',
    pronuncia: PRONUNCIA,
    ponteSonora: PONTE,
    historia: HISTORIA,
  },
  createScene,
  refine: { organic: ['gorila', 'cabeca', 'bracoTala', 'bracoCana'] },
}

export default card
