import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Var är nyckeln?" — VAR É... NÜCA-L'N?
 *
 * Oito da manhã, a sala de pernas pro ar: sofá desmontado, almofadas no
 * tapete, vaso tombado. O PROFESSOR distraído cutuca o sofá com o PONTEIRO
 * (a VARA: VAR É...? VAR É...?), faz o biquinho do Ü e coça a NUCA — e os
 * dedos esbarram no nó do LENÇO vermelho, de onde pende, nas costas dele,
 * a chave dourada gigante: NÜCA... L'N!
 *
 * Diorama: piso de tábuas, tapete verde-musgo, parede creme ao fundo com o
 * quadro-negro do "?"; sofá à esquerda, professor de perfil 3/4 voltado pro
 * sofá (as costas e a chave viradas pra câmera), vaso tombado à direita.
 * O acento saturado é o ouro da chave (com o vermelho do lenço logo acima).
 */

const FLOOR = '#6b4a30'
const FLOOR_B = '#5f4029'
const SOIL_BASE = '#35271b'
const RUG = '#5c6a3a'
const RUG_EDGE = '#7a8650'
const WALL = '#e3d5b8'
const PANEL = '#8a6544'
const PANEL_DARK = '#6e4f34'
const BOARD = '#2e4a3b'
const BOARD_FRAME = '#a27445'
const CHALK = '#eeece2'
const SOFA = '#6a3a26'
const SOFA_DARK = '#4e2a1b'
const DECK = '#8d7c62'
const JACKET = '#8a6c48'
const LEATHER = '#4a2f1e'
const PANTS = '#6a6d74'
const SHOES = '#3a2a20'
const SHIRT = '#efe9dc'
const TIE = '#3d4a5c'
const SKIN = '#e8c39e'
const WHITE_HAIR = '#ecebe6'
const FRAME = '#2b2320'
const LIPS = '#c4766a'
const POINTER = '#b98a52'
const POT = '#ad6a4c'
const EARTH = '#4a3322'
const LEAF = '#4f7d44'
const PAPER = '#f1ece0'
const SCARF = '#c8262e'
const DOT = '#f6f2ea'
const GOLD = '#f2b52b' // acento saturado RESERVADO: a chave
const GOLD_OPTS: MatOpts = { roughness: 0.28, metalness: 0.7 }

const GY = 0.17 // topo do tapete
const WALL_Z = -1.75

// professor: perfil 3/4 voltado pro sofá, costas (e chave) pra câmera
const H = 1.5
const PS = 1.2
const PROF = new THREE.Vector3(0.4, GY, -0.25)
const PROF_RY = -1.4
const BODY_H = H * 0.52
const BODY_R = H * 0.17
const SHOULDER_Y = BODY_H * 0.62 + 0.19 * H

// braço do ponteiro (longe da câmera): estendido pro sofá
const POINT_X = -1.3
// braço da nuca (perto da câmera): pose de mão no queixo → mão na nuca
const CHIN_X = 2.75

const SOFA_POS = new THREE.Vector3(-1.35, GY, -0.4)
const SOFA_RY = 0.8

const VASE = new THREE.Vector3(1.3, GY, 0.22)
const VASE_TIP = -(Math.PI / 2 - Math.atan(0.06 / 0.36))

const KNOT = new THREE.Vector3(0, 0.79, -0.25)
const KEY_S = 1.15

const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)

/** Cápsula de a até b — segmentos do braço dobrado. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Traço de giz: arco de toro (aberto) no plano xy. */
function chalkArc(r: number, tube: number, arc: number) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 10, 40, arc),
    mat(CHALK, { roughness: 0.95, size: r * 2 }),
  )
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: assoalho + tapete verde-musgo + papéis espalhados -------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.1, SOIL_BASE, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)

  const floor = cylinder(2.56, 2.62, 0.04, FLOOR, { roughness: 0.75 })
  floor.position.y = 0.12
  base.add(floor)
  for (let i = -4; i <= 4; i++) {
    const z = i * 0.56
    const half = Math.sqrt(Math.max(0, 2.52 * 2.52 - z * z))
    const ripa = rbox(half * 2, 0.012, 0.52, 0.005, i % 2 === 0 ? FLOOR : FLOOR_B, { roughness: 0.75 })
    ripa.position.set(0, 0.142, z)
    base.add(ripa)
  }

  const rug = rbox(3.7, 0.03, 2.5, 0.014, RUG, { roughness: 0.95 })
  rug.position.set(-0.1, GY - 0.015, 0.25)
  base.add(rug)
  for (const [w, d, x, z] of [
    [3.5, 0.05, -0.1, 0.25 + 1.12],
    [3.5, 0.05, -0.1, 0.25 - 1.12],
    [0.05, 2.29, -0.1 + 1.72, 0.25],
    [0.05, 2.29, -0.1 - 1.72, 0.25],
  ] as const) {
    const fio = rbox(w, 0.008, d, 0.004, RUG_EDGE, { roughness: 0.95 })
    fio.position.set(x, GY + 0.002, z)
    base.add(fio)
  }

  // papéis de aula e livros revirados no chão
  for (const [x, z] of [[0.15, 1.05], [0.55, 1.3], [-0.35, 1.25], [1.6, 0.3]] as const) {
    const folha = rbox(0.3, 0.008, 0.4, 0.003, PAPER, { roughness: 0.7 })
    folha.position.set(x, GY + 0.006, z)
    folha.rotation.y = rand() * Math.PI
    base.add(folha)
    for (let k = 0; k < 3; k++) {
      const linha = rbox(0.2, 0.004, 0.012, 0.002, '#9aa0a8', { roughness: 0.7 })
      linha.position.set(0, 0.006, -0.1 + k * 0.08)
      folha.add(linha)
    }
  }
  const livros = new THREE.Group()
  livros.position.set(1.55, GY, -0.45)
  livros.rotation.y = 0.5
  for (const [i, color] of ['#7b3b34', '#3f5a6e', '#a0844a'].entries()) {
    const livro = rbox(0.34, 0.07, 0.25, 0.015, color, { roughness: 0.7 })
    livro.position.set((rand() - 0.5) * 0.08, 0.035 + i * 0.07, (rand() - 0.5) * 0.06)
    livro.rotation.y = (rand() - 0.5) * 0.5
    livros.add(livro)
  }
  const aberto = rbox(0.42, 0.03, 0.28, 0.012, PAPER, { roughness: 0.7 })
  aberto.position.set(-0.55, GY + 0.015, -0.95)
  aberto.rotation.y = 0.4
  base.add(livros, aberto)

  root.add(base)

  // ---- parede creme com lambri ---------------------------------------------
  const parede = new THREE.Group()
  root.add(parede)

  const WALL_W = 3.5
  const muro = rbox(WALL_W, 2.45, 0.14, 0.03, WALL, { roughness: 0.9 })
  muro.position.set(0, GY + 1.225, WALL_Z)
  parede.add(muro)
  const lambri = rbox(WALL_W + 0.02, 0.8, 0.18, 0.02, PANEL, { roughness: 0.75 })
  lambri.position.set(0, GY + 0.4, WALL_Z + 0.02)
  parede.add(lambri)
  for (let i = 0; i < 7; i++) {
    const almofada = rbox(0.4, 0.5, 0.03, 0.012, PANEL_DARK, { roughness: 0.75 })
    almofada.position.set(-1.5 + i * 0.5, GY + 0.4, WALL_Z + 0.115)
    parede.add(almofada)
  }
  const friso = rbox(WALL_W + 0.06, 0.06, 0.22, 0.02, PANEL_DARK, { roughness: 0.7 })
  friso.position.set(0, GY + 0.82, WALL_Z + 0.03)
  parede.add(friso)
  const cimalha = rbox(WALL_W + 0.08, 0.08, 0.22, 0.03, '#d1c09e', { roughness: 0.8 })
  cimalha.position.set(0, GY + 2.45, WALL_Z + 0.02)
  parede.add(cimalha)

  // quadrinho torto na parede (a casa revirada)
  const moldura = rbox(0.5, 0.38, 0.04, 0.015, BOARD_FRAME, { roughness: 0.6 })
  moldura.position.set(1.1, GY + 1.55, WALL_Z + 0.09)
  moldura.rotation.z = -0.18
  const tela = rbox(0.4, 0.28, 0.02, 0.01, '#7f9bb0', { roughness: 0.8 })
  tela.position.z = 0.02
  moldura.add(tela)
  const morro = sphere(0.14, '#5f7f52', { roughness: 0.9 })
  morro.position.set(0.04, -0.12, 0.025)
  morro.scale.set(1.3, 0.6, 0.12)
  moldura.add(morro)
  parede.add(moldura)

  // ---- quadro-negro com o "?" de giz ---------------------------------------
  const quadro = new THREE.Group()
  quadro.position.set(-0.75, GY + 1.7, WALL_Z + 0.1)
  root.add(quadro)

  const qMold = rbox(0.98, 0.72, 0.05, 0.02, BOARD_FRAME, { roughness: 0.6 })
  quadro.add(qMold)
  const lousa = rbox(0.86, 0.6, 0.03, 0.01, BOARD, { roughness: 0.92 })
  lousa.position.z = 0.015
  quadro.add(lousa)
  const bandeja = rbox(0.9, 0.035, 0.08, 0.012, BOARD_FRAME, { roughness: 0.6 })
  bandeja.position.set(0, -0.36, 0.04)
  quadro.add(bandeja)
  for (const gx of [-0.2, -0.12]) {
    const giz = capsule(0.012, 0.05, CHALK, { roughness: 0.9 })
    giz.rotation.z = Math.PI / 2
    giz.position.set(gx, -0.335, 0.05)
    quadro.add(giz)
  }
  // "?": gancho de toro, haste e ponto
  const gancho = chalkArc(0.1, 0.026, Math.PI * 1.45)
  gancho.rotation.z = -Math.PI / 2
  gancho.position.set(0, 0.11, 0.035)
  quadro.add(gancho)
  const haste = rbox(0.05, 0.1, 0.02, 0.01, CHALK, { roughness: 0.95 })
  haste.position.set(0, -0.03, 0.035)
  quadro.add(haste)
  const ponto = sphere(0.032, CHALK, { roughness: 0.95 }, 16)
  ponto.position.set(0, -0.17, 0.035)
  ponto.scale.z = 0.4
  quadro.add(ponto)

  // ---- sofá marrom desmontado ----------------------------------------------
  const sofa = new THREE.Group()
  sofa.position.copy(SOFA_POS)
  sofa.rotation.y = SOFA_RY
  root.add(sofa)

  const SW = 1.32
  const caixa = rbox(SW, 0.28, 0.72, 0.06, SOFA, { roughness: 0.55 })
  caixa.position.y = 0.24
  sofa.add(caixa)
  // assento sem almofadas: estrado de lona com percintas
  const estrado = rbox(SW - 0.36, 0.03, 0.56, 0.01, DECK, { roughness: 0.9 })
  estrado.position.set(0, 0.385, 0.05)
  sofa.add(estrado)
  for (let i = -2; i <= 2; i++) {
    const cinta = rbox(0.06, 0.035, 0.56, 0.01, '#6e604a', { roughness: 0.9 })
    cinta.position.set(i * 0.2, 0.39, 0.05)
    sofa.add(cinta)
  }
  const encosto = rbox(SW, 0.62, 0.2, 0.08, SOFA, { roughness: 0.55 })
  encosto.position.set(0, 0.62, -0.27)
  encosto.rotation.x = -0.1
  sofa.add(encosto)
  // capitonê: botões no encosto
  for (const bx of [-0.4, 0, 0.4]) {
    for (const by of [0.6, 0.78]) {
      const botao = sphere(0.022, SOFA_DARK, { roughness: 0.5 }, 12)
      botao.position.set(bx, by, -0.155 + (by - 0.6) * 0.1)
      sofa.add(botao)
    }
  }
  for (const side of [-1, 1]) {
    const braco = rbox(0.2, 0.42, 0.74, 0.09, SOFA, { roughness: 0.55 })
    braco.position.set(side * (SW / 2 - 0.08), 0.42, 0)
    sofa.add(braco)
    const rolo = cylinder(0.11, 0.11, 0.74, SOFA_DARK, { roughness: 0.55 }, 24)
    rolo.rotation.x = Math.PI / 2
    rolo.position.set(side * (SW / 2 - 0.08), 0.62, 0.0)
    sofa.add(rolo)
    for (const fz of [-0.28, 0.28]) {
      const pe = cylinder(0.035, 0.025, 0.1, '#2c1d13', { roughness: 0.5 }, 12)
      pe.position.set(side * (SW / 2 - 0.12), 0.05, fz)
      sofa.add(pe)
    }
  }
  // mola saltando do estrado
  const mola = new THREE.Group()
  mola.position.set(0.32, 0.4, 0.15)
  for (let k = 0; k < 4; k++) {
    const espira = torus(0.05, 0.008, '#9aa0a6', { roughness: 0.3, metalness: 0.8 })
    espira.rotation.x = Math.PI / 2
    espira.position.y = 0.02 + k * 0.04
    mola.add(espira)
  }
  sofa.add(mola)

  // ---- almofadas jogadas no tapete -----------------------------------------
  const almofadas = new THREE.Group()
  root.add(almofadas)
  const cushions: [number, number, number, number, number, number][] = [
    // x, y, z, rx, ry, rz
    [-0.45, GY + 0.07, 0.42, 0, 0.7, 0],
    [-1.02, GY + 0.16, 0.72, 0.0, -0.4, 0.42],
    [-1.65, GY + 0.07, 0.72, 0, 0.2, 0],
  ]
  for (const [x, y, z, rx, ry, rz] of cushions) {
    const c = rbox(0.5, 0.14, 0.45, 0.065, '#7b4630', { roughness: 0.6 })
    c.position.set(x, y, z)
    c.rotation.set(rx, ry, rz)
    const vivo = rbox(0.52, 0.02, 0.47, 0.01, SOFA_DARK, { roughness: 0.6 })
    c.add(vivo)
    almofadas.add(c)
  }

  // ---- vasinho tombado ------------------------------------------------------
  const vaso = new THREE.Group()
  vaso.position.copy(VASE)
  vaso.rotation.y = -2.5 // boca virada pra frente-esquerda
  vaso.scale.setScalar(0.85)
  root.add(vaso)
  vaso.rotation.z = VASE_TIP
  const pote = new THREE.Group()
  pote.position.x = -0.15 // pivô na borda da base: tomba girando nela
  vaso.add(pote)
  const ceramica = lathe(
    [[0, 0], [0.15, 0], [0.155, 0.02], [0.19, 0.3], [0.215, 0.31], [0.22, 0.36], [0.19, 0.36], [0.17, 0.33], [0, 0.33]],
    POT,
    { roughness: 0.6 },
  )
  pote.add(ceramica)
  const terraPote = cylinder(0.17, 0.17, 0.02, EARTH, { roughness: 0.95 })
  terraPote.position.y = 0.33
  pote.add(terraPote)
  const caule = cylinder(0.018, 0.022, 0.22, '#4b6b33', { roughness: 0.8 })
  caule.position.y = 0.44
  pote.add(caule)
  const folhas = puff(0.12, LEAF, 6, 17, { roughness: 0.85 })
  folhas.position.y = 0.58
  folhas.scale.set(1, 1.1, 0.8)
  pote.add(folhas)

  // terra derramada (peça própria: aparece depois do tombo)
  const terra = new THREE.Group()
  terra.position.set(VASE.x - 0.4, GY, VASE.z + 0.3)
  root.add(terra)
  for (const [x, z, r, s] of [[0, 0, 0.17, 5], [0.17, 0.12, 0.11, 8], [-0.18, 0.1, 0.1, 9], [0.06, -0.15, 0.08, 11]] as const) {
    const monte = puff(r, EARTH, 5, s, { roughness: 0.95 })
    monte.position.set(x, 0, z)
    monte.scale.y = 0.32
    terra.add(monte)
  }
  const folhaSolta = sphere(0.06, LEAF, { roughness: 0.85 })
  folhaSolta.position.set(0.28, 0.01, -0.04)
  folhaSolta.scale.set(1.2, 0.2, 0.6)
  terra.add(folhaSolta)

  // ---- professor ------------------------------------------------------------
  const professor = new THREE.Group()
  professor.position.copy(PROF)
  professor.rotation.y = PROF_RY
  professor.scale.setScalar(PS)
  root.add(professor)

  const p = person({ body: JACKET, skin: SKIN, height: H, armAngle: 0.18 })
  professor.add(p)

  // calça cinza: casca da metade de baixo, seguindo o fundo da cápsula
  const calcaPerfil: [number, number][] = []
  for (let i = 0; i <= 8; i++) {
    const y = 0.03 + (i / 8) * (BODY_R - 0.03)
    const dy = BODY_R - y
    calcaPerfil.push([Math.sqrt(Math.max(0, BODY_R * BODY_R - dy * dy)) * 1.04, y])
  }
  calcaPerfil.push([BODY_R * 1.04, 0.35])
  calcaPerfil.push([BODY_R * 1.0, 0.36])
  calcaPerfil.unshift([0, 0.03])
  const calca = lathe(calcaPerfil, PANTS, { roughness: 0.85 })
  p.add(calca)
  const vinco = rbox(0.02, 0.22, 0.02, 0.008, '#55585e', { roughness: 0.85 })
  vinco.position.set(0, 0.13, BODY_R * 0.98)
  p.add(vinco)
  for (const side of [-1, 1]) {
    const sapato = rbox(0.17, 0.09, 0.27, 0.04, SHOES, { roughness: 0.45 })
    sapato.position.set(side * 0.11, 0.045, 0.14)
    p.add(sapato)
  }
  // barra do paletó, camisa, lapelas, gravata e botões
  const barra = cylinder(BODY_R * 1.05, BODY_R * 1.07, 0.05, JACKET, { roughness: 0.8 })
  barra.position.y = 0.36
  p.add(barra)
  const peito = rbox(0.13, 0.26, 0.05, 0.02, SHIRT, { roughness: 0.6 })
  peito.position.set(0, 0.64, BODY_R * 0.88)
  peito.rotation.x = -0.12
  p.add(peito)
  const gravata = rbox(0.055, 0.22, 0.03, 0.012, TIE, { roughness: 0.7 })
  gravata.position.set(0, 0.62, BODY_R * 0.95)
  gravata.rotation.x = -0.12
  p.add(gravata)
  for (const side of [-1, 1]) {
    const lapela = rbox(0.07, 0.3, 0.035, 0.015, '#755838', { roughness: 0.8 })
    lapela.position.set(side * 0.095, 0.6, BODY_R * 0.9)
    lapela.rotation.set(-0.12, 0, side * 0.3)
    p.add(lapela)
  }
  for (const by of [0.42, 0.5]) {
    const botao = sphere(0.016, LEATHER, { roughness: 0.4 }, 12)
    botao.position.set(0, by, BODY_R * 1.02)
    p.add(botao)
  }
  const bolso = rbox(0.12, 0.025, 0.02, 0.008, '#755838', { roughness: 0.8 })
  bolso.position.set(-0.13, 0.62, BODY_R * 0.86)
  bolso.rotation.y = -0.4
  p.add(bolso)
  const caneta = cylinder(0.01, 0.01, 0.08, '#2c3a52', { roughness: 0.4 }, 8)
  caneta.position.set(-0.13, 0.66, BODY_R * 0.86)
  p.add(caneta)

  // ---- cabeça: careca, tufos brancos, óculos redondos, biquinho -------------
  const head = p.getObjectByName('head') as THREE.Group
  const hr = H * 0.19
  head.rotation.set(0.12, 0.42, 0) // vira o rosto 3/4 pra câmera
  for (const side of [-1, 1]) {
    const tufo = puff(0.075, WHITE_HAIR, 5, side < 0 ? 3 : 7, { roughness: 0.95 })
    tufo.position.set(side * hr * 0.9, hr * 0.05, -hr * 0.25)
    tufo.scale.set(0.8, 1.0, 1.25)
    head.add(tufo)
    const sobrancelha = capsule(0.018, 0.07, WHITE_HAIR, { roughness: 0.95 })
    sobrancelha.rotation.z = Math.PI / 2 + side * 0.3 // ponta de dentro erguida: aflito
    sobrancelha.position.set(side * hr * 0.38, hr * 0.42, hr * 0.86)
    head.add(sobrancelha)
    // óculos redondos: aro, haste até a orelha
    const aro = torus(0.078, 0.013, FRAME, { roughness: 0.35 })
    aro.position.set(side * hr * 0.38, hr * 0.12, hr * 0.93)
    head.add(aro)
    const haste = rbox(0.012, 0.012, hr * 0.95, 0.005, FRAME, { roughness: 0.35 })
    haste.position.set(side * hr * 0.9, hr * 0.14, hr * 0.45)
    haste.rotation.y = -side * 0.12
    head.add(haste)
  }
  const nuca = puff(0.08, WHITE_HAIR, 5, 13, { roughness: 0.95 })
  nuca.position.set(0, -hr * 0.05, -hr * 0.88)
  nuca.scale.set(1.6, 0.6, 0.6)
  head.add(nuca)
  const ponte = capsule(0.009, 0.05, FRAME, { roughness: 0.35 })
  ponte.rotation.z = Math.PI / 2
  ponte.position.set(0, hr * 0.16, hr * 0.97)
  head.add(ponte)
  // biquinho de pato (o Ü): lábios empurrados pra frente
  const bico = new THREE.Group()
  bico.position.set(0, -hr * 0.42, hr * 0.86)
  head.add(bico)
  const labios = torus(0.034, 0.024, LIPS, { roughness: 0.45 })
  labios.scale.set(1.05, 0.8, 1.9)
  bico.add(labios)
  const furo = sphere(0.016, '#4a2420', { roughness: 0.6 }, 12)
  furo.position.z = 0.012
  bico.add(furo)

  // ---- braço do PONTEIRO (o de longe), estendido pro sofá ------------------
  const bracoPonteiro = p.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoPonteiro, H)
  bracoPonteiro.rotation.set(POINT_X, 0.0, -0.08)
  const cotoveleiraL = sphere(0.07, LEATHER, { roughness: 0.7 })
  cotoveleiraL.position.set(-0.035, -0.29, -0.055)
  cotoveleiraL.scale.set(0.6, 1, 0.45)
  bracoPonteiro.add(cotoveleiraL)

  const ponteiro = new THREE.Group()
  ponteiro.position.set(0, -0.53, 0.02)
  bracoPonteiro.add(ponteiro)
  const vara = cylinder(0.032, 0.018, 1.05, POINTER, { roughness: 0.5 }, 16)
  vara.position.y = -0.5
  ponteiro.add(vara)
  const virola = cylinder(0.036, 0.036, 0.06, '#c9a46a', { roughness: 0.35, metalness: 0.6 }, 16)
  virola.position.y = 0.05
  ponteiro.add(virola)
  const ponteira = sphere(0.026, '#2b2320', { roughness: 0.6 }, 14)
  ponteira.position.y = -1.03
  ponteira.scale.y = 1.4
  ponteiro.add(ponteira)

  // ---- braço da NUCA (o de perto): dobrado, mão atrás da cabeça ------------
  const braco0 = p.getObjectByName('armR') as THREE.Mesh
  const mao = braco0.children[0] as THREE.Mesh
  braco0.remove(mao)
  p.remove(braco0)

  const bracoNuca = new THREE.Group()
  bracoNuca.position.set(BODY_R * 1.15, SHOULDER_Y, 0)
  bracoNuca.rotation.order = 'ZYX'
  p.add(bracoNuca)
  // raiz do braço na lateral do ombro (cobre o volume do ombro do corpo)
  const S = new THREE.Vector3(0.0, -0.06, 0)
  // deltoide: funde o ombro do corpo com a raiz do braço erguido
  bracoNuca.add(limb(new THREE.Vector3(-0.07, -0.21, 0), S, 0.1, JACKET, { roughness: 0.8 }))
  const E = new THREE.Vector3(0.1, 0.24, -0.08) // cotovelo erguido ao lado da orelha
  const W = new THREE.Vector3(-0.15, 0.08, -0.26) // pulso na nuca, junto do nó
  bracoNuca.add(limb(S, E, 0.078, JACKET, { roughness: 0.8 }))
  bracoNuca.add(limb(E, W, 0.07, JACKET, { roughness: 0.8 }))
  const cotovelo = sphere(0.076, JACKET, { roughness: 0.8 })
  cotovelo.position.copy(E)
  bracoNuca.add(cotovelo)
  // cotoveleira de couro, na ponta do cotovelo (virada pra câmera)
  const bend = new THREE.Vector3()
    .add(new THREE.Vector3().subVectors(S, E).normalize())
    .add(new THREE.Vector3().subVectors(W, E).normalize())
    .normalize()
    .negate()
  const cotoveleiraR = sphere(0.052, LEATHER, { roughness: 0.7 })
  cotoveleiraR.position.copy(E).addScaledVector(bend, 0.058)
  cotoveleiraR.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), bend)
  cotoveleiraR.scale.set(1, 1.15, 0.35)
  bracoNuca.add(cotoveleiraR)
  const fore = new THREE.Vector3().subVectors(W, E).normalize()
  const punho = torus(0.07, 0.016, JACKET, { roughness: 0.8 })
  punho.position.copy(W).addScaledVector(fore, -0.02)
  punho.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), fore)
  bracoNuca.add(punho)
  // dedos descendo pra nuca, em cima do nó do lenço
  const alvo = new THREE.Vector3(-0.27, 0.0, -0.25)
  mao.position.copy(W).addScaledVector(fore, 0.05)
  mao.quaternion.setFromUnitVectors(DOWN, new THREE.Vector3().subVectors(alvo, mao.position).normalize())
  bracoNuca.add(mao)

  // ---- LENÇO vermelho de bolinhas amarrado no pescoço ----------------------
  const lenco = new THREE.Group()
  lenco.position.copy(KNOT)
  p.add(lenco)
  const NECK = new THREE.Vector3(0, 0.0, 0.25) // centro do pescoço, relativo ao nó
  const gola = torus(0.205, 0.05, SCARF, { roughness: 0.8 })
  gola.rotation.x = Math.PI / 2 + 0.08
  gola.position.copy(NECK)
  lenco.add(gola)
  // bolinhas brancas na face de fora do rolo
  for (let i = 0; i < 14; i++) {
    const phi = (i / 14) * Math.PI * 2 + 0.2
    const psi = (i % 2 === 0 ? 0.5 : -0.4)
    const rr = 0.205 + 0.05 * Math.cos(psi)
    const dot = sphere(0.014, DOT, { roughness: 0.7 }, 10)
    dot.position.set(NECK.x + rr * Math.cos(phi), NECK.y + 0.05 * Math.sin(psi), NECK.z + rr * Math.sin(phi))
    dot.scale.setScalar(1)
    lenco.add(dot)
  }
  const no = sphere(0.065, SCARF, { roughness: 0.8 })
  no.scale.set(1.2, 0.9, 0.8)
  lenco.add(no)
  for (const side of [-1, 1]) {
    const ponta = rbox(0.09, 0.2, 0.025, 0.02, SCARF, { roughness: 0.8 })
    ponta.position.set(side * 0.06, -0.1, -0.03)
    ponta.rotation.set(-0.2, 0, side * 0.45)
    lenco.add(ponta)
    for (const dy of [-0.04, 0.04]) {
      const pinta = sphere(0.013, DOT, { roughness: 0.7 }, 10)
      pinta.position.set(dy * 0.5, dy, -0.015)
      pinta.scale.z = 0.4
      ponta.add(pinta)
    }
  }
  for (const [x, y, z] of [[0.04, 0.03, -0.05], [-0.05, -0.02, -0.04]] as const) {
    const pinta = sphere(0.013, DOT, { roughness: 0.7 }, 10)
    pinta.position.set(x, y, z)
    lenco.add(pinta)
  }

  // ---- CHAVE dourada gigante, pendurada no nó, nas costas -------------------
  const chave = new THREE.Group()
  chave.position.set(KNOT.x + 0.02, KNOT.y - 0.04, KNOT.z - 0.1)
  chave.rotation.set(0, -PROF_RY - 0.05, 0) // pingente gira e encara a câmera
  chave.scale.setScalar(KEY_S)
  p.add(chave)
  const cordao = cylinder(0.012, 0.012, 0.1, SCARF, { roughness: 0.8 }, 8)
  cordao.position.y = -0.03
  chave.add(cordao)
  const anel = torus(0.1, 0.03, GOLD, GOLD_OPTS)
  anel.position.y = -0.17
  chave.add(anel)
  const recorte = torus(0.045, 0.014, GOLD, GOLD_OPTS)
  recorte.position.y = -0.17
  chave.add(recorte)
  const colar = cylinder(0.045, 0.045, 0.05, GOLD, GOLD_OPTS, 20)
  colar.position.y = -0.29
  chave.add(colar)
  const cano = cylinder(0.026, 0.026, 0.34, GOLD, GOLD_OPTS, 20)
  cano.position.y = -0.46
  chave.add(cano)
  const anelCano = cylinder(0.036, 0.036, 0.025, GOLD, GOLD_OPTS, 20)
  anelCano.position.y = -0.36
  chave.add(anelCano)
  // segredo (dentes) no pé da chave
  const dente1 = rbox(0.11, 0.05, 0.03, 0.01, GOLD, GOLD_OPTS)
  dente1.position.set(0.06, -0.58, 0)
  chave.add(dente1)
  const dente2 = rbox(0.07, 0.04, 0.03, 0.01, GOLD, GOLD_OPTS)
  dente2.position.set(0.045, -0.5, 0)
  chave.add(dente2)
  const ponta = sphere(0.03, GOLD, GOLD_OPTS, 16)
  ponta.position.y = -0.63
  chave.add(ponta)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'parede', group: 'sala', object: parede },
    { name: 'sofa', group: 'bagunca', object: sofa },
    { name: 'almofadas', group: 'bagunca', object: almofadas },
    { name: 'vaso', group: 'bagunca', object: vaso },
    { name: 'terra', group: 'bagunca', object: terra },
    { name: 'professor', group: 'professor', object: professor },
    { name: 'bracoPonteiro', group: 'ponteiro', object: bracoPonteiro },
    { name: 'ponteiro', group: 'ponteiro', object: ponteiro },
    { name: 'quadro', group: 'ponteiro', object: quadro },
    { name: 'bracoNuca', group: 'nuca', object: bracoNuca },
    { name: 'lenco', group: 'lenco', object: lenco },
    { name: 'chave', group: 'chave', object: chave },
  ]

  const grow = (to = 1) => [ch('scale.x', 0.01, to), ch('scale.y', 0.01, to), ch('scale.z', 0.01, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Oito da manhã, aula às oito e meia — e a sala está de pernas pro ar.',
    }),
    seq('parede-rise', 'parede', 0.2, 0.9, [riseFrom(0, 2.8)], { ease: 'easeOut' }),

    seq('sofa-rise', 'sofa', 1.1, 0.8, [riseFrom(GY, 1.2)], { ease: 'easeOut' }),
    seq('almofadas-caem', 'almofadas', 1.4, 0.7, [ch('position.y', 1.4, 0)], {
      ease: 'easeIn',
    }),
    seq('vaso-rise', 'vaso', 1.6, 0.6, [riseFrom(GY, 0.8)], { ease: 'easeOut' }),
    seq('vaso-tomba', 'vaso', 2.2, 0.55, [ch('rotation.z', 0, VASE_TIP)], { ease: 'easeIn' }),
    seq('terra-espalha', 'terra', 2.7, 0.4, grow(), { ease: 'easeOut' }),

    seq('professor-rise', 'professor', 3.2, 0.9, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: 'No meio da bagunça, o PROFESSOR distraído caça a chave.',
    }),
    seq('ponteiro-repouso', 'bracoPonteiro', 3.2, 0.9, [ch('rotation.x', 0.05, 0.05)]),
    seq('nuca-repouso', 'bracoNuca', 3.2, 0.9, [ch('rotation.x', CHIN_X, CHIN_X)]),

    seq('ponteiro-ergue', 'bracoPonteiro', 4.6, 0.6, [ch('rotation.x', 0.05, POINT_X)], {
      ease: 'easeOut',
      caption: 'Com o PONTEIRO — a VARA que ele nunca larga — cutuca o sofá: VAR É...? VAR É...?',
    }),
    seq('ponteiro-cresce', 'ponteiro', 4.75, 0.5, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('cutuca-1', 'bracoPonteiro', 5.4, 0.25, [ch('rotation.x', POINT_X, POINT_X + 0.16)]),
    seq('cutuca-1b', 'bracoPonteiro', 5.65, 0.25, [ch('rotation.x', POINT_X + 0.16, POINT_X)]),
    seq('quadro-pop', 'quadro', 5.7, 0.5, grow(), { ease: 'easeOut' }),
    seq('cutuca-2', 'bracoPonteiro', 6.0, 0.25, [ch('rotation.x', POINT_X, POINT_X + 0.16)]),
    seq('cutuca-2b', 'bracoPonteiro', 6.25, 0.25, [ch('rotation.x', POINT_X + 0.16, POINT_X)]),

    seq('mao-nuca', 'bracoNuca', 7.0, 0.9, [ch('rotation.x', CHIN_X, 0)], {
      ease: 'easeInOut',
      caption: 'Nervoso, faz o biquinho do Ü e coça a NUCA...',
    }),
    seq('mao-abre', 'bracoNuca', 7.0, 0.45, [ch('rotation.z', 0, -0.65)], { ease: 'easeOut' }),
    seq('mao-fecha', 'bracoNuca', 7.45, 0.45, [ch('rotation.z', -0.65, 0)], { ease: 'easeIn' }),
    seq('coca-1', 'bracoNuca', 8.0, 0.2, [ch('rotation.x', 0, 0.12)]),
    seq('coca-1b', 'bracoNuca', 8.2, 0.2, [ch('rotation.x', 0.12, 0)]),

    seq('lenco-aparece', 'lenco', 8.4, 0.5, grow(), {
      ease: 'easeOut',
      caption: '...e os dedos esbarram num nó: o LENÇO! NÜCA... L\'N!',
    }),

    seq('chave-surge', 'chave', 9.4, 0.4, grow(KEY_S), {
      ease: 'easeOut',
      caption: 'Pendurada nas costas, desde ontem à noite: a chave.',
    }),
    seq('chave-balanca-1', 'chave', 9.4, 0.45, [ch('rotation.z', 0.9, -0.35)], { ease: 'easeOut' }),
    seq('chave-balanca-2', 'chave', 9.85, 0.45, [ch('rotation.z', -0.35, 0.15)], { ease: 'easeInOut' }),
    seq('chave-balanca-3', 'chave', 10.3, 0.45, [ch('rotation.z', 0.15, 0)], { ease: 'easeInOut' }),
    seq('coca-2', 'bracoNuca', 10.4, 0.2, [ch('rotation.x', 0, 0.1)]),
    seq('coca-2b', 'bracoNuca', 10.6, 0.25, [ch('rotation.x', 0.1, 0)], {
      caption: 'Var är nyckeln? — Cadê a chave?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.0, 3.55], target: [-0.3, 0.98, -0.25] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-ar-nyckeln',
    contexto:
      "Casa e prédio: saindo de casa atrasado, na hora de abrir a tvättstugan ou o förråd (depósito) do prédio, entregando o apartamento; no trabalho ('Var är nyckeln till förrådet?'); e na versão clássica de casal à porta: 'Var är nyckeln? Har du den?'.",
    fraseFonte: 'Cadê a chave?',
    fraseAlvo: 'Var är nyckeln?',
    pronuncia:
      "var é NÜK-keln? (saindo va-ré-NÜK-keln; 'var' = onde, A longo e R brando que escorrega no 'är' — sem o R vira 'vad', o quê; 'är' = é, aberto e curto; 'nyckeln' com a força no NY — Ü CURTO de bico, lábios de U e língua de I —, CK dobrado e seco, e o -eln fraquinho: E quase mudo, L DE VERDADE (língua no céu da boca, nunca 'u') e o N logo em seguida, sem a língua sair do lugar; o N é o artigo: nyckel = uma chave, nyckeln = a chave)",
    ponteSonora:
      "VAR É... NÜCA-L'N? (4 sílabas: var-é-NÜK-keln, saindo va-ré-NÜK-keln; força no NÜ; VAR = a VARA sem o -a — aqui o PONTEIRO de madeira do professor, que é uma vara —, a MESMA VARA de 'Var är kassan?', 'Var bor du?' e 'Var är provrummet?': R BRANDO e AUDÍVEL, que já escorrega no É, va-RÉ; sem ele sobra VÁ É, que é 'vad är' (o que é?); É = 'är', aberto e curto, o mesmo de 'Det är' e 'Jag är'; NÜCA = a NUCA que o professor coça, dita de BICO DE PATO: lábios de U empurrados pra frente e a língua parada no I — o MESMO Ü do DÜ de 'kan du' e do BI(R)ÚTA de 'byta' —, aqui CURTO e com toda a força; com o U chapado de 'nuca' o sueco não reconhece; o C é um K seco e segurado um instante (é o 'ck' dobrado), e o -A da nuca vira um 'ê' quase mudo; L'N = o LENço sem o E e sem o -ÇO: só L e N colados no fim — L DE VERDADE, a ponta da língua grudada no céu da boca (nunca o 'u' de 'Brasiu'), e o N sai sem a língua sair do lugar: NÜK-k'ln; esse N é o artigo: 'nyckel' é uma chave, 'nyckeln' é A chave)",
    historia:
      "Oito da manhã, aula às oito e meia, e o PROFESSOR distraído virou a casa do avesso atrás da chave. Com o PONTEIRO de madeira — a vara que ele nunca larga — cutuca o sofá, o vaso, a geladeira: 'VAR É...? VAR É...?' Nervoso, faz o biquinho de pato de quando pensa e coça a NUCA... e os dedos esbarram num nó: o LENÇO amarrado no pescoço, com a chave pendurada nas costas desde ontem à noite. NUCA... L'N! Onde está a chave? Sempre esteve na nuca dele.",
  },
  createScene,
}

export default card
