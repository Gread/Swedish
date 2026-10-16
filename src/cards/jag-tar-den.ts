import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'

/**
 * "Jag tar den." — IÁÁ! TÁR(zan)... DEN(te)!
 *
 * Na loja de antiguidades, o mico-leão-dourado de tanga de oncinha atravessa
 * o salão pendurado num cipó preso à viga do teto, gritando o IÁÁÁ! do
 * TARZAN, e arranca no meio do voo o DENTE de ouro — o mesmo das cartas de
 * compras: perguntaram o preço, trocaram, devolveram; agora alguém LEVA.
 *
 * Diorama: assoalho escuro, estante de antiguidades ao fundo, dois pilares e
 * uma viga; vitrine de vidro com moldura de latão e a almofadinha de veludo
 * vermelho VAZIA; o mico no fim do balanço, um braço no cipó e o outro
 * erguendo o dente; três moedas caindo no balcão e dois arcos de vento.
 */

const PISO = '#4a3122'
const PISO_B = '#553a28'
const FRESTA = '#2a1a10'
const MADEIRA = '#6e4b2e'
const MADEIRA_ESC = '#4f3420'
const ESTANTE = '#5c3e27'
const LATAO = '#a8874a'
const VIDRO = '#d8eef4'
const VELUDO = '#a51d33'
const VELUDO_ESC = '#73101f'
const FUR = '#ec8a22'
const FUR_CLARO = '#f6ae48'
const FUR_ESC = '#b85f17'
const ROSTO = '#3a2620'
const ONCA = '#e7c079'
const PINTA = '#3d2616'
const CIPO = '#4d8a2c'
const FOLHA = '#62a83a'
const MOEDA = '#f2bd3c'
const OURO = '#ffc21a' // acento saturado reservado: o DENTE

const GY = 0.18 // topo do assoalho
const PIVO = new THREE.Vector3(-0.72, 3.4, 0.15) // nó do cipó na viga
const VX = -1.18 // vitrine
const VZ = 0.3
const VW = 1.3
const VD = 0.6
const VTOP = GY + 0.84 // tampo de vidro
const ALMO_Y = VTOP + 0.06
const DENTE_ESC = 0.95
const MICO_ESC = 1.0
const MICO_TILT = 0.55 // eixo do corpo apontando para o nó do cipó
// mão do cipó no espaço do cipó: ao longo do raio do balanço
const MAO_RAIO = new THREE.Vector3(Math.cos(-1.0), Math.sin(-1.0), 0).multiplyScalar(1.05)

type V3 = [number, number, number]

/** Cápsula de a até b: membros, dedos, pernas. */
function bone(a: V3, b: V3, r: number, color: string, opts?: MatOpts) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, dir.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- loja: assoalho + estante de antiguidades ----------------------------
  const loja = new THREE.Group()

  const solo = cylinder(2.62, 2.7, 0.11, '#2c1d13', { roughness: 0.95 })
  solo.position.y = 0.055
  loja.add(solo)
  const piso = cylinder(2.56, 2.6, 0.07, PISO, { roughness: 0.78 })
  piso.position.y = 0.145
  loja.add(piso)
  for (let i = -3; i <= 3; i++) {
    const z = i * 0.62
    const meia = Math.sqrt(Math.max(0.01, 2.5 * 2.5 - z * z))
    const tabua = rbox(meia * 2, 0.012, 0.56, 0.005, i % 2 === 0 ? PISO : PISO_B, { roughness: 0.78 })
    tabua.position.set(0, GY + 0.004, z)
    loja.add(tabua)
    const fresta = rbox(meia * 2, 0.014, 0.03, 0.006, FRESTA, { roughness: 0.9 })
    fresta.position.set(0, GY + 0.004, z + 0.31)
    loja.add(fresta)
  }

  // estante ao fundo
  const EZ = -1.55
  const fundo = rbox(3.1, 1.75, 0.06, 0.02, MADEIRA_ESC, { roughness: 0.8 })
  fundo.position.set(0, GY + 0.875, EZ - 0.2)
  loja.add(fundo)
  for (const sx of [-1, 1]) {
    const lado = rbox(0.08, 1.8, 0.46, 0.025, ESTANTE, { roughness: 0.75 })
    lado.position.set(sx * 1.55, GY + 0.9, EZ)
    loja.add(lado)
  }
  for (const sy of [0.04, 0.62, 1.2, 1.78]) {
    const prat = rbox(3.12, 0.06, 0.46, 0.02, ESTANTE, { roughness: 0.75 })
    prat.position.set(0, GY + sy, EZ)
    loja.add(prat)
  }

  // antiguidades nas prateleiras
  const vaso = (x: number, y: number, cor: string, alto: number) => {
    const v = lathe(
      [[0, 0], [0.08, 0], [0.12, alto * 0.25], [0.13, alto * 0.5], [0.07, alto * 0.82], [0.06, alto * 0.92], [0.09, alto], [0, alto * 0.98]],
      cor,
      { roughness: 0.3 },
    )
    v.position.set(x, GY + y, EZ + 0.02)
    loja.add(v)
  }
  vaso(-1.2, 0.65, '#3f7f86', 0.42)
  vaso(-0.82, 0.65, '#c9d6e3', 0.32)
  vaso(1.18, 1.23, '#a8603f', 0.4)
  vaso(-0.25, 1.23, '#c9d6e3', 0.46)
  vaso(0.95, 0.07, '#556b8a', 0.44)

  // livros
  for (let i = 0; i < 6; i++) {
    const h = 0.34 + rand() * 0.1
    const livro = rbox(0.07, h, 0.28, 0.012, ['#7a2f2a', '#3d5a45', '#6b5a3a', '#2f4560'][i % 4], { roughness: 0.8 })
    livro.position.set(0.25 + i * 0.075, GY + 0.65 + h / 2, EZ + 0.02)
    loja.add(livro)
  }
  for (let i = 0; i < 5; i++) {
    const h = 0.3 + rand() * 0.12
    const livro = rbox(0.07, h, 0.28, 0.012, ['#3d5a45', '#7a2f2a', '#2f4560', '#6b5a3a'][i % 4], { roughness: 0.8 })
    livro.position.set(-1.3 + i * 0.075, GY + 0.07 + h / 2, EZ + 0.02)
    loja.add(livro)
  }

  // relógio de mesa
  const relogio = new THREE.Group()
  relogio.position.set(0.55, GY + 1.23, EZ + 0.05)
  const caixaRel = rbox(0.34, 0.42, 0.18, 0.06, '#6a3f22', { roughness: 0.5 })
  caixaRel.position.y = 0.21
  relogio.add(caixaRel)
  const mostrador = cylinder(0.12, 0.12, 0.02, '#efe6d0', { roughness: 0.4 })
  mostrador.rotation.x = Math.PI / 2
  mostrador.position.set(0, 0.25, 0.095)
  relogio.add(mostrador)
  for (const [w, rz] of [[0.09, 0.4], [0.065, -1.3]] as const) {
    const ponteiro = rbox(0.012, w, 0.006, 0.003, '#2a2a2a')
    ponteiro.geometry.translate(0, w / 2, 0)
    ponteiro.position.set(0, 0.25, 0.108)
    ponteiro.rotation.z = rz
    relogio.add(ponteiro)
  }
  loja.add(relogio)

  // globo
  const globo = new THREE.Group()
  globo.position.set(-1.0, GY + 1.23, EZ + 0.04)
  const peGlobo = cylinder(0.04, 0.1, 0.12, MADEIRA, { roughness: 0.5 })
  peGlobo.position.y = 0.06
  globo.add(peGlobo)
  const esfera = sphere(0.17, '#4f7d8c', { roughness: 0.45 })
  esfera.position.y = 0.3
  globo.add(esfera)
  const meridiano = torus(0.19, 0.012, LATAO, { roughness: 0.35, metalness: 0.7 })
  meridiano.position.y = 0.3
  meridiano.rotation.z = 0.4
  globo.add(meridiano)
  loja.add(globo)

  // baú antigo no chão, à direita
  const bau = new THREE.Group()
  bau.position.set(1.55, GY, 0.85)
  bau.rotation.y = -0.4
  const caixaBau = rbox(0.7, 0.36, 0.42, 0.04, '#6b3d22', { roughness: 0.7 })
  caixaBau.position.y = 0.18
  bau.add(caixaBau)
  const tampa = cylinder(0.21, 0.21, 0.7, '#7a4628', { roughness: 0.7 }, 24)
  tampa.rotation.z = Math.PI / 2
  tampa.scale.set(1, 1, 0.6)
  tampa.position.y = 0.36
  bau.add(tampa)
  for (const sx of [-0.25, 0.25]) {
    const cinta = rbox(0.05, 0.4, 0.44, 0.015, '#3a2a1c', { roughness: 0.5, metalness: 0.5 })
    cinta.position.set(sx, 0.2, 0)
    bau.add(cinta)
  }
  const fecho = rbox(0.08, 0.1, 0.03, 0.01, LATAO, { roughness: 0.35, metalness: 0.75 })
  fecho.position.set(0, 0.34, 0.22)
  bau.add(fecho)
  loja.add(bau)

  root.add(loja)

  // ---- pilares + viga do teto ----------------------------------------------
  const viga = new THREE.Group()
  for (const sx of [-1, 1]) {
    const pilar = rbox(0.22, 3.4, 0.22, 0.03, MADEIRA, { roughness: 0.75 })
    pilar.position.set(sx * 2.3, GY + 1.7, PIVO.z)
    viga.add(pilar)
    const mao = rbox(0.12, 0.62, 0.14, 0.02, MADEIRA_ESC, { roughness: 0.75 })
    mao.position.set(sx * 2.08, PIVO.y - 0.28, PIVO.z)
    mao.rotation.z = sx * 0.78
    viga.add(mao)
    const sapata = rbox(0.32, 0.1, 0.32, 0.03, MADEIRA_ESC, { roughness: 0.8 })
    sapata.position.set(sx * 2.3, GY + 0.05, PIVO.z)
    viga.add(sapata)
  }
  const travessa = rbox(4.96, 0.26, 0.28, 0.04, MADEIRA, { roughness: 0.75 })
  travessa.position.set(0, PIVO.y + 0.08, PIVO.z)
  viga.add(travessa)
  // nó do cipó amarrado na viga
  for (const dx of [-0.06, 0.06]) {
    const volta = torus(0.17, 0.04, CIPO, { roughness: 0.8 })
    volta.rotation.y = Math.PI / 2
    volta.position.set(PIVO.x + dx, PIVO.y + 0.08, PIVO.z)
    viga.add(volta)
  }
  root.add(viga)

  // ---- vitrine de vidro com moldura de latão -------------------------------
  const vitrine = new THREE.Group()
  vitrine.position.set(VX, 0, VZ)
  const plinto = rbox(VW + 0.08, 0.16, VD + 0.08, 0.03, MADEIRA_ESC, { roughness: 0.7 })
  plinto.position.y = GY + 0.08
  vitrine.add(plinto)

  const vidroMat = () => {
    const m = mat(VIDRO, { roughness: 0.05, detail: 0 })
    m.transparent = true
    m.opacity = 0.22
    m.depthWrite = false
    return m
  }
  const GH = VTOP - GY - 0.16 - 0.02
  const GYc = GY + 0.16 + GH / 2
  for (const [w, d, x, z] of [
    [VW, 0.02, 0, VD / 2], [VW, 0.02, 0, -VD / 2], [0.02, VD, VW / 2, 0], [0.02, VD, -VW / 2, 0],
  ] as const) {
    const painel = new THREE.Mesh(new THREE.BoxGeometry(w, GH, d), vidroMat())
    painel.position.set(x, GYc, z)
    vitrine.add(painel)
  }
  const tampoVidro = new THREE.Mesh(new THREE.BoxGeometry(VW + 0.04, 0.04, VD + 0.04), vidroMat())
  tampoVidro.position.y = VTOP - 0.02
  vitrine.add(tampoVidro)

  // moldura de latão: quinas e aros
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const quina = rbox(0.045, GH + 0.06, 0.045, 0.012, LATAO, { roughness: 0.35, metalness: 0.75 })
      quina.position.set(sx * VW / 2, GYc, sz * VD / 2)
      vitrine.add(quina)
    }
  }
  for (const y of [GY + 0.17, VTOP]) {
    for (const sz of [-1, 1]) {
      const aro = rbox(VW + 0.05, 0.04, 0.04, 0.012, LATAO, { roughness: 0.35, metalness: 0.75 })
      aro.position.set(0, y, sz * VD / 2)
      vitrine.add(aro)
    }
    for (const sx of [-1, 1]) {
      const aro = rbox(0.04, 0.04, VD + 0.05, 0.012, LATAO, { roughness: 0.35, metalness: 0.75 })
      aro.position.set(sx * VW / 2, y, 0)
      vitrine.add(aro)
    }
  }
  // dentro: forro de veludo e miudezas
  const forro = rbox(VW - 0.06, 0.03, VD - 0.06, 0.01, VELUDO_ESC, { roughness: 0.95 })
  forro.position.y = GY + 0.18
  vitrine.add(forro)
  const relBolso = new THREE.Group()
  relBolso.position.set(-0.35, GY + 0.27, 0.02)
  relBolso.rotation.x = -0.5
  const tampaBolso = cylinder(0.08, 0.08, 0.025, '#c6ccd2', { roughness: 0.25, metalness: 0.8 })
  tampaBolso.rotation.x = Math.PI / 2
  relBolso.add(tampaBolso)
  const argola = torus(0.025, 0.007, '#c6ccd2', { roughness: 0.25, metalness: 0.8 })
  argola.position.y = 0.1
  relBolso.add(argola)
  vitrine.add(relBolso)
  const frasco = lathe(
    [[0, 0], [0.06, 0], [0.07, 0.06], [0.05, 0.13], [0.02, 0.15], [0.02, 0.19], [0.035, 0.21], [0, 0.22]],
    '#5468a8',
    { roughness: 0.15 },
  )
  frasco.position.set(0.05, GY + 0.195, -0.05)
  vitrine.add(frasco)
  const camafeu = cylinder(0.07, 0.07, 0.02, '#e8dcc8', { roughness: 0.4 })
  camafeu.scale.z = 0.75
  camafeu.position.set(0.38, GY + 0.205, 0.06)
  vitrine.add(camafeu)
  root.add(vitrine)

  // ---- almofadinha de veludo, VAZIA ----------------------------------------
  const almofada = new THREE.Group()
  almofada.position.set(VX + 0.05, ALMO_Y, VZ + 0.02)
  almofada.rotation.y = 0.12
  const fofa = rbox(0.56, 0.11, 0.42, 0.05, VELUDO, { roughness: 0.95 })
  almofada.add(fofa)
  const marca = sphere(0.13, VELUDO_ESC, { roughness: 0.95 })
  marca.scale.set(1.1, 0.12, 0.85)
  marca.position.y = 0.05
  almofada.add(marca)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const borla = sphere(0.025, '#e9d9b0', { roughness: 0.8 })
      borla.position.set(sx * 0.27, 0, sz * 0.2)
      almofada.add(borla)
    }
  }
  root.add(almofada)

  // ---- cipó: pivô no nó da viga; o mico pendura nele -----------------------
  const cipo = new THREE.Group()
  cipo.position.copy(PIVO)
  root.add(cipo)

  // ---- mico-leão-dourado (filho do cipó) -----------------------------------
  const mico = new THREE.Group()
  mico.rotation.set(0, 0.18, MICO_TILT)
  mico.scale.setScalar(MICO_ESC)
  cipo.add(mico)

  const torso = capsule(0.19, 0.4, FUR, { roughness: 0.85 })
  torso.scale.z = 0.88
  mico.add(torso)
  const peito = sphere(0.15, FUR_CLARO, { roughness: 0.88 })
  peito.scale.set(1, 1.3, 0.6)
  peito.position.set(0, 0.06, 0.1)
  mico.add(peito)
  // ombros
  for (const sx of [-1, 1]) {
    const ombro = sphere(0.08, FUR, { roughness: 0.85 })
    ombro.position.set(sx * 0.15, 0.3, 0)
    mico.add(ombro)
  }

  // tanga de oncinha
  const tanga = lathe(
    [[0, -0.48], [0.17, -0.48], [0.215, -0.4], [0.222, -0.3], [0.205, -0.2], [0, -0.2]],
    ONCA,
    { roughness: 0.9 },
  )
  mico.add(tanga)
  const aba = rbox(0.17, 0.16, 0.03, 0.03, ONCA, { roughness: 0.9 })
  aba.position.set(0.02, -0.52, 0.17)
  aba.rotation.x = 0.25
  mico.add(aba)
  for (let i = 0; i < 16; i++) {
    const a = -1.5 + (i / 15) * 3.0 + (rand() - 0.5) * 0.15
    const y = -0.42 + (i % 3) * 0.08 + (rand() - 0.5) * 0.03
    const pinta = sphere(0.022, PINTA, { roughness: 0.9 })
    pinta.scale.set(1, 0.8, 0.5)
    pinta.position.set(Math.sin(a) * 0.218, y, Math.cos(a) * 0.218)
    pinta.rotation.y = a
    mico.add(pinta)
  }
  for (const [px, py] of [[-0.03, -0.49], [0.06, -0.55], [-0.01, -0.58]] as const) {
    const pinta = sphere(0.02, PINTA, { roughness: 0.9 })
    pinta.scale.set(1, 0.8, 0.5)
    pinta.position.set(px, py, 0.19)
    mico.add(pinta)
  }

  // pernas dobradas, arrastando pra trás no balanço
  const pernas: [V3, V3, V3][] = [
    [[-0.09, -0.42, 0.03], [-0.24, -0.66, 0.16], [-0.42, -0.8, 0.04]],
    [[0.09, -0.42, 0.03], [0.1, -0.7, 0.18], [-0.08, -0.9, 0.08]],
  ]
  for (const [quadril, joelho, pe] of pernas) {
    mico.add(bone(quadril, joelho, 0.07, FUR, { roughness: 0.85 }))
    mico.add(bone(joelho, pe, 0.055, FUR, { roughness: 0.85 }))
    const pata = sphere(0.065, FUR_ESC, { roughness: 0.8 })
    pata.scale.set(1.3, 0.7, 0.9)
    pata.position.set(pe[0] - 0.04, pe[1] - 0.03, pe[2])
    mico.add(pata)
  }

  // braço do cipó (mão lá em cima, agarrada)
  const MAO_CIPO: V3 = [-0.32, 1.02, 0.1]
  // posiciona o mico para a mão cair exatamente no raio do balanço
  mico.position.copy(MAO_RAIO).sub(
    new THREE.Vector3(...MAO_CIPO).multiplyScalar(MICO_ESC).applyEuler(mico.rotation),
  )
  mico.add(bone([-0.15, 0.3, 0], [-0.34, 0.62, 0.12], 0.055, FUR, { roughness: 0.85 }))
  mico.add(bone([-0.34, 0.62, 0.12], MAO_CIPO, 0.05, FUR, { roughness: 0.85 }))
  const maoCipo = sphere(0.07, FUR_ESC, { roughness: 0.8 })
  maoCipo.position.set(...MAO_CIPO)
  mico.add(maoCipo)
  for (let k = 0; k < 3; k++) {
    const dedo = capsule(0.018, 0.06, FUR_ESC, { roughness: 0.8 })
    dedo.position.set(MAO_CIPO[0] + 0.05, MAO_CIPO[1] + 0.04 - k * 0.035, MAO_CIPO[2] + 0.05)
    dedo.rotation.set(0.4, 0, Math.PI / 2)
    mico.add(dedo)
  }

  // ---- cabeça: juba esvoaçante, rosto preto, boca no grito ------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0.06, 0.62, 0.03)
  cabeca.rotation.set(-0.12, -0.22, -0.38)
  mico.add(cabeca)

  const cranio = sphere(0.2, FUR, { roughness: 0.85 })
  cabeca.add(cranio)
  // juba em anel em volta do rosto
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + 0.2
    const r = 0.12 + rand() * 0.04
    const tufo = sphere(r, FUR_CLARO, { roughness: 0.92 })
    tufo.position.set(Math.cos(a) * 0.23, Math.sin(a) * 0.23 + 0.02, -0.05)
    cabeca.add(tufo)
  }
  // mechas varridas pra trás pelo vento do balanço
  for (const [mx, my, mz, mr] of [
    [-0.36, 0.14, -0.08, 0.12], [-0.47, 0.07, -0.1, 0.095], [-0.56, 0.01, -0.12, 0.07],
    [-0.36, -0.08, -0.08, 0.1], [-0.46, -0.13, -0.1, 0.075],
    [-0.3, 0.3, -0.08, 0.1], [-0.42, 0.29, -0.1, 0.075],
  ] as const) {
    const mecha = sphere(mr, FUR_CLARO, { roughness: 0.92 })
    mecha.position.set(mx, my, mz)
    cabeca.add(mecha)
  }
  const rosto = sphere(0.155, ROSTO, { roughness: 0.7 })
  rosto.scale.set(0.95, 1.08, 0.6)
  rosto.position.set(0, -0.02, 0.14)
  cabeca.add(rosto)
  const focinho = sphere(0.085, ROSTO, { roughness: 0.7 })
  focinho.scale.set(1.15, 0.95, 0.8)
  focinho.position.set(0, -0.08, 0.2)
  cabeca.add(focinho)
  // boca escancarada: IÁÁÁ!
  const boca = sphere(0.08, '#8a1f26', { roughness: 0.6 })
  boca.scale.set(1.05, 1.3, 0.6)
  boca.position.set(0, -0.115, 0.255)
  cabeca.add(boca)
  const lingua = sphere(0.04, '#f08a93', { roughness: 0.5 })
  lingua.scale.set(1.2, 0.55, 0.8)
  lingua.position.set(0, -0.175, 0.28)
  cabeca.add(lingua)
  for (const sx of [-1, 1]) {
    const presa = cone(0.012, 0.035, '#f4efe4', { roughness: 0.3 })
    presa.position.set(sx * 0.032, -0.05, 0.29)
    presa.rotation.x = Math.PI
    cabeca.add(presa)

    const olho = sphere(0.042, '#ffffff', { roughness: 0.25 })
    olho.position.set(sx * 0.062, 0.045, 0.215)
    olho.scale.z = 0.6
    const pupila = sphere(0.021, '#141414', { roughness: 0.2 })
    pupila.position.set(sx * 0.062, 0.05, 0.24)
    const brilho = sphere(0.007, '#ffffff', { roughness: 0.1 })
    brilho.position.set(sx * 0.062 + 0.008, 0.058, 0.258)
    cabeca.add(olho, pupila, brilho)

    const sobrancelha = capsule(0.012, 0.05, '#1e1410', { roughness: 0.8 })
    sobrancelha.position.set(sx * 0.068, 0.105, 0.225)
    sobrancelha.rotation.z = Math.PI / 2 - sx * 0.35
    cabeca.add(sobrancelha)
  }

  // ---- rabo comprido esticado pra trás --------------------------------------
  const rabo = new THREE.Group()
  rabo.position.set(-0.04, -0.38, -0.13)
  rabo.rotation.z = -0.55
  mico.add(rabo)
  const curvaRabo = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.25, -0.1, -0.04),
    new THREE.Vector3(-0.55, -0.12, -0.06),
    new THREE.Vector3(-0.85, -0.02, -0.06),
    new THREE.Vector3(-1.04, 0.13, -0.04),
    new THREE.Vector3(-1.1, 0.28, -0.02),
    new THREE.Vector3(-1.0, 0.36, 0),
  ])
  const NR = 34
  for (let i = 0; i <= NR; i++) {
    const t = i / NR
    const p = curvaRabo.getPointAt(t)
    const gomo = sphere(0.068 - t * 0.03, t > 0.82 ? FUR_ESC : FUR, { roughness: 0.88 })
    gomo.position.copy(p)
    rabo.add(gomo)
  }

  // ---- braço erguido (pivô no ombro) ---------------------------------------
  const braco = new THREE.Group()
  braco.position.set(0.15, 0.3, 0)
  braco.rotation.z = -0.78
  mico.add(braco)
  braco.add(bone([0, 0, 0], [0.03, 0.33, 0.02], 0.055, FUR, { roughness: 0.85 }))
  braco.add(bone([0.03, 0.33, 0.02], [0, 0.62, 0.04], 0.05, FUR, { roughness: 0.85 }))
  const maoDente = sphere(0.072, FUR_ESC, { roughness: 0.8 })
  maoDente.position.set(0, 0.66, 0.04)
  braco.add(maoDente)
  for (let k = 0; k < 3; k++) {
    const dedo = capsule(0.018, 0.06, FUR_ESC, { roughness: 0.8 })
    dedo.position.set(-0.04 + k * 0.035, 0.7, 0.1)
    dedo.rotation.x = 1.2
    braco.add(dedo)
  }

  // ---- vine: do nó até a mão, curvado pra trás no balanço ------------------
  root.updateMatrixWorld(true)
  const maoW = maoCipo.getWorldPosition(new THREE.Vector3())
  const maoL = cipo.worldToLocal(maoW.clone())
  const dirV = maoL.clone().normalize()
  const perp = new THREE.Vector3(-dirV.y, dirV.x, 0) // à esquerda do sentido do cipó
  const curvaCipo = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0, 0),
    maoL.clone().multiplyScalar(0.33).addScaledVector(perp, -0.08),
    maoL.clone().multiplyScalar(0.7).addScaledVector(perp, -0.07),
    maoL.clone(),
    maoL.clone().addScaledVector(dirV, 0.18).addScaledVector(perp, -0.02),
    maoL.clone().addScaledVector(dirV, 0.32).addScaledVector(perp, -0.09),
  ])
  const vinha = new THREE.Mesh(
    new THREE.TubeGeometry(curvaCipo, 48, 0.042, 10, false),
    mat(CIPO, { roughness: 0.8, size: 1.2 }),
  )
  vinha.castShadow = true
  vinha.receiveShadow = true
  cipo.add(vinha)
  const ponta = sphere(0.042, CIPO, { roughness: 0.8 })
  ponta.position.copy(curvaCipo.getPointAt(1))
  cipo.add(ponta)
  for (const [t, lado] of [[0.18, 1], [0.38, -1], [0.55, 1], [0.92, -1]] as const) {
    const p = curvaCipo.getPointAt(t)
    const folha = sphere(0.075, FOLHA, { roughness: 0.7 })
    folha.scale.set(1, 0.22, 0.5)
    folha.position.copy(p).addScaledVector(perp, lado * 0.08)
    folha.rotation.z = Math.atan2(perp.y, perp.x) * lado + lado * 0.4
    cipo.add(folha)
  }

  // ---- DENTE de ouro gigante (vai da almofada à mão erguida) ---------------
  const maoDenteW = maoDente.getWorldPosition(new THREE.Vector3())
  const DENTE_POS: V3 = [maoDenteW.x + 0.02, maoDenteW.y + 0.13, maoDenteW.z + 0.04]
  const DENTE_ROT_Z = -0.22
  const DENTE_ALMO: V3 = [VX + 0.05, ALMO_Y + 0.26 * DENTE_ESC, VZ + 0.02]

  const dente = new THREE.Group()
  dente.position.set(...DENTE_POS)
  dente.rotation.set(0.15, -0.25, DENTE_ROT_Z)
  dente.scale.setScalar(DENTE_ESC)
  const coroa = rbox(0.56, 0.34, 0.42, 0.09, OURO, { roughness: 0.18, metalness: 0.9 })
  coroa.position.y = 0.17
  dente.add(coroa)
  for (const cx of [-1, 1]) {
    for (const cz of [-1, 1]) {
      const cuspide = sphere(0.12, OURO, { roughness: 0.18, metalness: 0.9 })
      cuspide.position.set(cx * 0.13, 0.32, cz * 0.1)
      cuspide.scale.y = 0.75
      dente.add(cuspide)
    }
  }
  const colo = cylinder(0.2, 0.22, 0.09, '#d99f24', { roughness: 0.25, metalness: 0.85 })
  colo.position.y = -0.02
  dente.add(colo)
  for (const sx of [-1, 1]) {
    const raiz = capsule(0.075, 0.24, '#e8dcc0', { roughness: 0.3 })
    raiz.position.set(sx * 0.11, -0.22, 0)
    raiz.rotation.z = sx * 0.2
    raiz.scale.set(1, 1, 0.85)
    dente.add(raiz)
  }
  // brilhos em estrela
  for (const [bx, by, bz, bs] of [[0.4, 0.5, 0.15, 1], [-0.38, 0.36, 0.2, 0.75], [0.12, 0.62, 0.25, 0.6]] as const) {
    const estrela = new THREE.Group()
    estrela.position.set(bx, by, bz)
    estrela.scale.setScalar(bs)
    for (const rz of [0, Math.PI / 2]) {
      const raio = rbox(0.035, 0.22, 0.02, 0.012, '#fff6cf', { emissive: '#ffe58a', emissiveIntensity: 1.3 })
      raio.rotation.z = rz
      raio.castShadow = false
      estrela.add(raio)
    }
    dente.add(estrela)
  }
  root.add(dente)

  // ---- três moedas caindo no balcão ----------------------------------------
  const moeda = (pos: V3, rot: V3) => {
    const g = new THREE.Group()
    g.position.set(...pos)
    g.rotation.set(...rot)
    const disco = cylinder(0.115, 0.115, 0.026, MOEDA, { roughness: 0.3, metalness: 0.55 })
    g.add(disco)
    for (const sy of [-1, 1]) {
      const relevo = cylinder(0.08, 0.08, 0.03, '#dda22c', { roughness: 0.35, metalness: 0.55 })
      relevo.position.y = sy * 0.002
      g.add(relevo)
    }
    root.add(g)
    return g
  }
  const M1: V3 = [VX + 0.45, VTOP + 0.055, VZ + 0.2] // quicando, apoiada na borda
  const M2: V3 = [-0.6, 1.26, 0.62]
  const M3: V3 = [-0.26, 1.4, 0.64]
  const moeda1 = moeda(M1, [0.35, 0.3, 0])
  const moeda2 = moeda(M2, [1.25, 0.1, 0.45])
  const moeda3 = moeda(M3, [1.05, -0.3, -0.5])

  // ---- arcos de vento atrás do mico (concêntricos ao nó do cipó) -----------
  const vento = new THREE.Group()
  vento.position.copy(PIVO)
  vento.position.z += 0.08
  const arcoMat = mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.4 })
  const angMico = Math.atan2(mico.position.y, mico.position.x)
  for (const [r, fim, len] of [[1.62, 0.34, 0.5], [2.55, 0.12, 0.5]] as const) {
    // traço afilado: grosso perto do mico, sumindo para trás
    const a0 = angMico - fim
    const curva = new THREE.EllipseCurve(0, 0, r, r, a0, a0 - len, true)
    const pts = curva.getPoints(40).map((p) => new THREE.Vector3(p.x, p.y, 0))
    const caminho = new THREE.CatmullRomCurve3(pts)
    const TS = 48
    const RS = 8
    const geo = new THREE.TubeGeometry(caminho, TS, 0.032, RS, false)
    const pos = geo.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i <= TS; i++) {
      const c = caminho.getPointAt(i / TS)
      const k = Math.max(0.08, 1 - (i / TS) * 0.95)
      for (let j = 0; j <= RS; j++) {
        const idx = i * (RS + 1) + j
        v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c)
        pos.setXYZ(idx, v.x, v.y, v.z)
      }
    }
    geo.computeVertexNormals()
    const traco = new THREE.Mesh(geo, arcoMat)
    vento.add(traco)
    const cabo = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), arcoMat)
    cabo.position.copy(caminho.getPointAt(0))
    vento.add(cabo)
  }
  root.add(vento)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'loja', group: 'loja', object: loja },
    { name: 'viga', group: 'loja', object: viga },
    { name: 'vitrine', group: 'vitrine', object: vitrine },
    { name: 'almofada', group: 'vitrine', object: almofada },
    { name: 'dente', group: 'vitrine', object: dente },
    { name: 'cipo', group: 'mico', object: cipo },
    { name: 'mico', group: 'mico', object: mico },
    { name: 'cabeca', group: 'mico', object: cabeca },
    { name: 'rabo', group: 'mico', object: rabo },
    { name: 'braco', group: 'mico', object: braco },
    { name: 'vento', group: 'balanco', object: vento },
    { name: 'moeda1', group: 'moedas', object: moeda1 },
    { name: 'moeda2', group: 'moedas', object: moeda2 },
    { name: 'moeda3', group: 'moedas', object: moeda3 },
  ]

  // ---- montagem ------------------------------------------------------------
  const CIPO_INI = -1.2 // cipó lá atrás, à esquerda, antes do balanço
  const BRACO_BAIXO = -2.9
  const scale3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const ORIGEM_MOEDA: V3 = [0.55, 1.65, 0.4]
  const cai = (part: string, at: number, fim: V3, rx: number, cap?: string) =>
    seq(`${part}-cai`, part, at, 0.6, [
      ch('position.x', ORIGEM_MOEDA[0], fim[0]),
      ch('position.y', ORIGEM_MOEDA[1], fim[1]),
      ch('position.z', ORIGEM_MOEDA[2], fim[2]),
      ch('rotation.x', rx + 4, rx),
      ...scale3(0.3, 1),
    ], cap ? { ease: 'easeIn', caption: cap } : { ease: 'easeIn' })

  const build = [
    seq('loja-rise', 'loja', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Numa loja de antiguidades sobe o assoalho de tábuas escuras — e lá no alto, uma viga atravessa o teto.',
    }),
    seq('viga-rise', 'viga', 0.5, 0.9, [riseFrom(0, 3.7)], { ease: 'easeOut' }),

    seq('vitrine-rise', 'vitrine', 1.9, 0.7, [riseFrom(0, 1.1)], {
      ease: 'easeOut',
      caption: 'Na vitrine, sobre a almofadinha de veludo, está de novo o famoso DENTE de ouro — o que todo mundo já perguntou o preço, trocou e devolveu.',
    }),
    seq('almofada-pop', 'almofada', 2.4, 0.4, scale3(0.01, 1), { ease: 'easeOut' }),
    seq('dente-aparece', 'dente', 2.7, 0.6, [
      ch('position.x', DENTE_ALMO[0], DENTE_ALMO[0]),
      ch('position.y', DENTE_ALMO[1] + 0.3, DENTE_ALMO[1]),
      ch('position.z', DENTE_ALMO[2], DENTE_ALMO[2]),
      ch('rotation.z', 0, 0),
      ...scale3(0.01, DENTE_ESC),
    ], { ease: 'easeOut' }),

    seq('cipo-desce', 'cipo', 4.3, 0.7, [ch('scale.y', 0.01, 1), ch('rotation.z', CIPO_INI, CIPO_INI)], {
      ease: 'easeOut',
      caption: 'Da viga pende um cipó verde e grosso…',
    }),
    seq('mico-pop', 'mico', 5.1, 0.6, scale3(0.01, MICO_ESC), {
      ease: 'easeOut',
      caption: '…e nele surge um mico-leão-dourado de tanga de oncinha, soltando o grito do Tarzan: IÁÁÁ!',
    }),
    seq('cabeca-grita', 'cabeca', 5.1, 0.8, [ch('rotation.x', 0.5, -0.12)], { ease: 'easeOut' }),
    seq('rabo-abre', 'rabo', 5.2, 0.8, [ch('rotation.z', 1.4, -0.55)], { ease: 'easeOut' }),
    seq('braco-solto', 'braco', 5.1, 0.6, [ch('rotation.z', BRACO_BAIXO, BRACO_BAIXO)]),

    seq('cipo-balanca', 'cipo', 6.7, 1.0, [ch('rotation.z', CIPO_INI, 0.14)], {
      ease: 'easeInOut',
      caption: 'Ele atravessa a loja num balanço só — TÁR(zan)! — e arranca o DENTE da almofadinha no meio do voo.',
    }),
    seq('dente-arranca', 'dente', 7.15, 0.55, [
      ch('position.x', DENTE_ALMO[0], DENTE_POS[0]),
      ch('position.y', DENTE_ALMO[1], DENTE_POS[1]),
      ch('position.z', DENTE_ALMO[2], DENTE_POS[2]),
      ch('rotation.z', 0, DENTE_ROT_Z),
    ], { ease: 'easeOut' }),
    seq('braco-ergue', 'braco', 7.15, 0.55, [ch('rotation.z', BRACO_BAIXO, -0.78)], { ease: 'easeOut' }),
    seq('vento-sopra', 'vento', 7.3, 0.6, [ch('rotation.z', -0.5, 0)], { ease: 'easeOut' }),
    seq('cipo-assenta', 'cipo', 7.7, 0.6, [ch('rotation.z', 0.14, 0)], { ease: 'easeInOut' }),

    cai('moeda3', 8.7, M3, 1.05, 'Três moedas de ouro caem no balcão, e ele ergue o dente brilhando: IÁ! TÁR… DEN! — esse eu levo.'),
    cai('moeda2', 8.85, M2, 1.25),
    cai('moeda1', 9.0, M1, 0.35),

    seq('dente-brilha', 'dente', 9.8, 0.3, scale3(DENTE_ESC, DENTE_ESC * 1.15), { ease: 'easeOut' }),
    seq('dente-volta', 'dente', 10.1, 0.4, scale3(DENTE_ESC * 1.15, DENTE_ESC), { ease: 'easeInOut' }),
    seq('cabeca-urra', 'cabeca', 10.5, 0.35, [ch('rotation.x', -0.12, -0.3)], { ease: 'easeOut' }),
    seq('cabeca-fecha', 'cabeca', 10.85, 0.5, [ch('rotation.x', -0.3, -0.12)], {
      ease: 'easeInOut',
      caption: 'Jag tar den. — Vou levar.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.5, 6.1], target: [-0.1, 1.85, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-tar-den',
    contexto:
      "Compras: na loja, no loppis, na feira ou fechando negócio no Blocket, na hora em que você decide comprar. Apontando: 'Jag tar den här' (esta aqui) ou 'den där' (aquela). Com palavra ett vira 'Jag tar det', e no plural, 'Jag tar dem' (falado 'dom').",
    fraseFonte: 'Vou levar.',
    fraseAlvo: 'Jag tar den.',
    pronuncia:
      "iá TÁR-den ('jag' = iá, o G mudo; 'tar' com A LONGO e aberto e o R que não vibra: a língua dobra pra trás e já cai no D — é o 'rd' sueco, quase 'tá-den' de língua enrolada; sem o R vira 'ta den', a ordem 'pega!'; 'den' curto, E de 'pé' e N na ponta da língua, sem nasal; a força no TÁR — ou no DEN, quando você aponta entre várias: 'Jag tar DEN', essa aí)",
    ponteSonora:
      "IÁÁ! TÁR(zan)... DEN(te)! (3 sílabas: iá-TÁR-den; força no TÁR; IÁ = o 'jag' de sempre, aqui o grito do Tarzan: I de IOGA, nunca J chiado, e fraquinho — o grito é comprido, a palavra é curta; TÁR(zan) = o TARZAN cortado logo depois do R: A LONGO e aberto, com a força, e o R é o R CAIPIRA de 'porta', a língua dobrada pra trás, que cai direto no D seguinte — é o 'rd' sueco, o mesmo do TAR-DÊ de 'Hur lång tid tar det?' e do BÚR'D de 'Ett bord för två'; nunca o H carioca de 'TÁHzan', e o R não pode sumir: sem ele sobra 'ta den', que é a ORDEM 'pega!'; é o mesmo 'tar' de 'Jag tar en kaffe, tack' (IÁ! TÁ, REN); DEN(te) = o DENTE de ouro de 'Vad kostar den här?', 'Kan jag byta den här?' e 'Jag vill lämna tillbaka den här' — o MESMO dente: depois de perguntarem o preço, trocarem e devolverem, alguém finalmente leva; só o DEN, curto, E de 'pé' e N na ponta da língua, SEM o 'dẽ' nasal de 'dente', e aqui sem o 'här' no fim: 'den' sozinho já é 'esse aí')",
    historia:
      'Na vitrine da loja de antiguidades, sobre uma almofadinha de veludo, está de novo o famoso dente de ouro — aquele que todo mundo já perguntou o preço, trocou e devolveu. Lá do alto, o mico-leão-dourado, de tanga de oncinha, agarra um cipó amarrado na viga do teto e solta o grito do TARZAN: IÁÁÁ! Atravessa a loja num balanço só, com a juba dourada esvoaçando, e arranca o DENTE da almofadinha no meio do voo. Pousa no balcão, joga três moedas de ouro e ergue o dente brilhando: IÁ! TÁR... DEN! — esse eu levo.',
  },
  createScene,
  refine: { organic: ['mico', 'cabeca', 'rabo', 'braco'] },
}

export default card
