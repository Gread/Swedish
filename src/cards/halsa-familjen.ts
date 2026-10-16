import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, puff, rock,
} from '../rig/helpers'

/**
 * "Hälsa familjen!" — RRÉLSA! FAMÍLI-EN!
 *
 * Você pede ao amigo: manda um abraço pra família! O papagaio dele leva o
 * recado ao pé da letra: pousa na caixa de correio da casinha vermelha, onde
 * está escrito ELSA, e berra rouco e soprado RRRÉLSA! — depois estufa o peito
 * e grita FAMÍLI-EN! Na janela, o porta-retrato da família balança.
 *
 * Diorama: gramado, casinha sueca falu-röd de quinas brancas ao fundo à
 * esquerda, caixa de correio azul num poste na frente, papagaio GRANDE em
 * cima dela. Os anéis do grito são o único acento saturado (amarelo-vivo).
 */

const TERRA = '#5a4430'
const GRAMA = '#6e9a4b'
const GRAMA_ESC = '#5b8540'
const FALU = '#8c2f25'
const FALU_ESC = '#73261e'
const BRANCO = '#f1ece2'
const TELHA = '#565a60'
const TELHA_ESC = '#45484d'
const PEDRA = '#8a8780'
const PORTA = '#3f5a68'
const MADEIRA = '#7a5634'
const MADEIRA_ESC = '#5e4127'
const AZUL_CAIXA = '#2f68a6'
const AZUL_CAIXA_ESC = '#24548a'
const TINTA = '#1f2c44'
const VERDE = '#3c9e3f'
const VERDE_CLARO = '#86c64a'
const TESTA = '#f0c43a'
const PENA_AZUL = '#2a5cc0'
const PENA_VERMELHA = '#d2382a'
const BICO = '#80838a'
const BICO_ESC = '#63666c'
const GRITO = '#ffd21a' // acento reservado: os anéis do grito RRÉLSA!

const GY = 0.16 // topo do gramado

// casa
const HX = -0.78
const HZ = -1.1
const HW = 1.8 // largura (x)
const HD = 1.2 // profundidade (z)
const HH = 1.15 // altura da parede
const RISE = 0.62 // cumeeira acima da parede

// caixa de correio
const MX = 0.42
const MZ = 0.62
const POST_TOP = GY + 0.88
const BOX_Y = POST_TOP + 0.05 + 0.18 // centro do corpo da caixa
const BOX_TOP = BOX_Y + 0.18
const LID_R = 0.226
const PERCH_Y = BOX_TOP + LID_R // topo da tampa: onde o papagaio pousa

// papagaio
const PAP_ROT = -0.32
const ASA_DOBRADA = 0.14
const ASA_ABERTA = 2.45
const BICO_ABERTO = 0.55
const CABECA_Y = 0.86

/** Sólido extrudado com material do app (pentágono da casa). */
function extruded(shape: THREE.Shape, depth: number, color: string, size: number) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  })
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.82, size }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.025, 0.006, TINTA, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** E L S A — letras de traço grosso, altura 0.14. */
function letter(which: 'E' | 'L' | 'S' | 'A') {
  const g = new THREE.Group()
  const t = 0.028
  const H = 0.14
  const hy = H / 2 - t / 2
  if (which === 'E') {
    g.add(stroke(t, H, -0.036, 0))
    g.add(stroke(0.078, t, 0.0, hy))
    g.add(stroke(0.062, t, -0.008, 0))
    g.add(stroke(0.078, t, 0.0, -hy))
  } else if (which === 'L') {
    g.add(stroke(t, H, -0.036, 0))
    g.add(stroke(0.078, t, 0.0, -hy))
  } else if (which === 'S') {
    // dois arcos de toro: S redondo, para não ler como 5
    const r = (H - t) / 4
    for (const [cy, rot] of [[r, 0.42], [-r, 0.42 + Math.PI]] as const) {
      const arco = new THREE.Mesh(
        new THREE.TorusGeometry(r, t / 2, 10, 32, Math.PI * 1.5 - 0.42),
        mat(TINTA, { roughness: 0.5, size: 0.1 }),
      )
      arco.castShadow = true
      arco.position.set(0, cy, 0)
      arco.rotation.z = rot
      arco.scale.x = 1.15
      g.add(arco)
    }
  } else {
    g.add(stroke(t, 0.15, -0.024, 0, -0.3))
    g.add(stroke(t, 0.15, 0.024, 0, 0.3))
    g.add(stroke(0.05, 0.024, 0, -0.022))
  }
  return g
}

/** Asa do papagaio: pendurada ao longo de -y a partir do ombro; plano xy. */
function makeWing(side: number) {
  const asa = new THREE.Group()

  const cobertura = sphere(0.15, VERDE, { roughness: 0.75 })
  cobertura.scale.set(0.78, 1.5, 0.36)
  cobertura.position.set(side * 0.02, -0.17, 0.02)
  asa.add(cobertura)

  // penas: leque de azuis com pontas vermelhas
  for (let k = 0; k < 5; k++) {
    const pena = new THREE.Group()
    pena.position.set(0, -0.1, -0.01)
    pena.rotation.z = (k - 2) * 0.13
    const haste = capsule(0.048, 0.34, PENA_AZUL, { roughness: 0.65 })
    haste.scale.z = 0.45
    haste.position.y = -0.34
    pena.add(haste)
    const ponta = capsule(0.047, 0.09, PENA_VERMELHA, { roughness: 0.6 })
    ponta.scale.z = 0.42
    ponta.position.y = -0.6
    pena.add(ponta)
    asa.add(pena)
  }

  // fileira verde de penas médias por cima das azuis
  for (let k = 0; k < 3; k++) {
    const media = capsule(0.045, 0.16, VERDE, { roughness: 0.7 })
    media.scale.z = 0.45
    media.position.set((k - 1) * 0.06, -0.3, 0.012)
    media.rotation.z = (k - 1) * 0.12
    asa.add(media)
  }
  return asa
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- gramado --------------------------------------------------------------
  const base = new THREE.Group()

  const terra = cylinder(2.62, 2.7, 0.1, TERRA, { roughness: 0.95 })
  terra.position.y = 0.05
  base.add(terra)

  const grama = cylinder(2.58, 2.6, 0.06, GRAMA, { roughness: 0.92 })
  grama.position.y = 0.13
  base.add(grama)

  // caminho de pedras chatas da porta até a frente
  for (let i = 0; i < 5; i++) {
    const laje = cylinder(0.16, 0.17, 0.03, PEDRA, { roughness: 0.85 }, 9)
    laje.position.set(-0.28 + i * 0.03 + (rand() - 0.5) * 0.08, GY + 0.005, -0.25 + i * 0.4)
    laje.rotation.y = rand() * Math.PI
    laje.scale.set(1, 1, 0.8)
    base.add(laje)
  }

  // tufos de grama e florzinhas espalhados
  for (const [tx, tz, s] of [
    [1.75, 0.95, 31], [-1.85, 0.85, 32], [1.55, -0.85, 33], [-0.9, 1.75, 34], [1.0, 1.75, 35],
  ] as const) {
    const tufo = puff(0.14, GRAMA_ESC, 5, s, { roughness: 0.95 })
    tufo.position.set(tx, GY + 0.04, tz)
    tufo.scale.y = 0.6
    base.add(tufo)
    for (let f = 0; f < 3; f++) {
      const flor = sphere(0.03, f % 2 ? '#f4f0e6' : '#c98ad0', { roughness: 0.6 })
      flor.position.set(tx + (rand() - 0.5) * 0.25, GY + 0.1, tz + (rand() - 0.5) * 0.2)
      base.add(flor)
    }
  }

  const pedra = rock(0.16, '#77746d', 44, { roughness: 0.95 })
  pedra.position.set(1.85, GY + 0.05, 0.1)
  base.add(pedra)
  const pedrinha = rock(0.09, '#77746d', 45, { roughness: 0.95 })
  pedrinha.position.set(2.0, GY + 0.03, 0.32)
  base.add(pedrinha)

  // bétula fininha atrás, à direita (fecha a composição)
  const tronco = cylinder(0.05, 0.07, 1.5, '#e8e3d8', { roughness: 0.8 })
  tronco.position.set(1.6, GY + 0.75, -1.45)
  base.add(tronco)
  for (const ty of [0.35, 0.7, 1.05]) {
    const mancha = cylinder(0.062, 0.066, 0.04, '#3b3631', { roughness: 0.9 })
    mancha.position.set(1.6, GY + ty, -1.45)
    base.add(mancha)
  }
  const copa = puff(0.42, '#7aa64a', 7, 46, { roughness: 0.9 })
  copa.position.set(1.6, GY + 1.75, -1.45)
  copa.scale.y = 1.15
  base.add(copa)

  root.add(base)

  // ---- casinha sueca falu-röd -----------------------------------------------
  const casa = new THREE.Group()
  casa.position.set(HX, 0, HZ)
  casa.rotation.y = 0.24
  root.add(casa)

  const sockel = rbox(HW + 0.08, 0.12, HD + 0.08, 0.02, PEDRA, { roughness: 0.9 })
  sockel.position.y = GY + 0.06
  casa.add(sockel)

  // corpo: pentágono (parede + empena) extrudado ao longo de x
  const perfil = new THREE.Shape()
  perfil.moveTo(-HD / 2, 0)
  perfil.lineTo(HD / 2, 0)
  perfil.lineTo(HD / 2, HH)
  perfil.lineTo(0, HH + RISE)
  perfil.lineTo(-HD / 2, HH)
  perfil.closePath()
  const corpo = extruded(perfil, HW, FALU, 2)
  corpo.geometry.translate(0, 0, -HW / 2)
  corpo.geometry.rotateY(Math.PI / 2)
  corpo.position.y = GY + 0.12
  casa.add(corpo)

  const WY = GY + 0.12 // base da parede

  // ripas verticais da fachada (mata-junta)
  for (let i = -5; i <= 5; i++) {
    const ripa = rbox(0.035, HH - 0.06, 0.025, 0.01, FALU_ESC, { roughness: 0.85 })
    ripa.position.set(i * 0.155, WY + HH / 2, HD / 2 + 0.03)
    casa.add(ripa)
  }

  // quinas brancas
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const quina = rbox(0.1, HH + 0.02, 0.1, 0.02, BRANCO, { roughness: 0.6 })
      quina.position.set(sx * (HW / 2 + 0.01), WY + HH / 2, sz * (HD / 2 + 0.01))
      casa.add(quina)
    }
  }
  // friso branco sob o beiral
  const friso = rbox(HW + 0.06, 0.07, 0.05, 0.015, BRANCO, { roughness: 0.6 })
  friso.position.set(0, WY + HH - 0.04, HD / 2 + 0.04)
  casa.add(friso)

  // telhado: duas águas cinza
  const ang = Math.atan2(RISE, HD / 2)
  const slopeLen = (HD / 2 + 0.16) / Math.cos(ang)
  for (const sz of [-1, 1]) {
    const agua = rbox(HW + 0.26, 0.08, slopeLen, 0.025, TELHA, { roughness: 0.8 })
    agua.position.set(
      0,
      WY + HH + RISE - (slopeLen / 2) * Math.sin(ang) + 0.06,
      sz * (slopeLen / 2) * Math.cos(ang),
    )
    agua.rotation.x = sz * ang
    casa.add(agua)
    // fiadas de telha: frisos paralelos ao beiral
    for (let r = 1; r <= 4; r++) {
      const d = (r / 5) * slopeLen
      const fiada = rbox(HW + 0.24, 0.025, 0.04, 0.01, TELHA_ESC, { roughness: 0.85 })
      fiada.position.set(
        0,
        WY + HH + RISE - d * Math.sin(ang) + 0.105,
        sz * d * Math.cos(ang),
      )
      fiada.rotation.x = sz * ang
      casa.add(fiada)
    }
    // tábuas brancas da empena (beirais laterais)
    for (const sx of [-1, 1]) {
      const tabua = rbox(0.05, 0.1, slopeLen, 0.015, BRANCO, { roughness: 0.6 })
      tabua.position.set(
        sx * (HW / 2 + 0.13),
        WY + HH + RISE - (slopeLen / 2) * Math.sin(ang) + 0.04,
        sz * (slopeLen / 2) * Math.cos(ang),
      )
      tabua.rotation.x = sz * ang
      casa.add(tabua)
    }
  }
  const cumeeira = cylinder(0.05, 0.05, HW + 0.28, TELHA_ESC, { roughness: 0.75 })
  cumeeira.rotation.z = Math.PI / 2
  cumeeira.position.y = WY + HH + RISE + 0.08
  casa.add(cumeeira)

  const chamine = rbox(0.22, 0.5, 0.22, 0.02, BRANCO, { roughness: 0.75 })
  chamine.position.set(0.5, WY + HH + RISE - 0.02, -0.25)
  casa.add(chamine)
  const chamineTopo = rbox(0.27, 0.05, 0.27, 0.015, TELHA_ESC, { roughness: 0.75 })
  chamineTopo.position.set(0.5, WY + HH + RISE + 0.24, -0.25)
  casa.add(chamineTopo)

  // porta azul-acinzentada com moldura branca, à direita da fachada
  const PX = 0.55
  const molduraPorta = rbox(0.48, 0.84, 0.05, 0.015, BRANCO, { roughness: 0.6 })
  molduraPorta.position.set(PX, WY + 0.42, HD / 2 + 0.04)
  casa.add(molduraPorta)
  const porta = rbox(0.38, 0.76, 0.05, 0.015, PORTA, { roughness: 0.6 })
  porta.position.set(PX, WY + 0.39, HD / 2 + 0.06)
  casa.add(porta)
  for (const py of [0.2, 0.55]) {
    const almofada = rbox(0.28, 0.24, 0.02, 0.01, '#4a6a7a', { roughness: 0.6 })
    almofada.position.set(PX, WY + py, HD / 2 + 0.09)
    casa.add(almofada)
  }
  const macaneta = sphere(0.025, '#c9a250', { roughness: 0.3, metalness: 0.8 })
  macaneta.position.set(PX + 0.13, WY + 0.4, HD / 2 + 0.1)
  casa.add(macaneta)
  const degrau = rbox(0.56, 0.08, 0.26, 0.02, PEDRA, { roughness: 0.9 })
  degrau.position.set(PX, GY + 0.04, HD / 2 + 0.17)
  casa.add(degrau)

  // janela branca (vão escuro + moldura + peitoril), à esquerda da fachada
  const JX = -0.32
  const JY = WY + 0.62
  const JW = 0.8
  const JH = 0.66
  const vao = rbox(JW - 0.06, JH - 0.06, 0.02, 0.01, '#2a3442', { roughness: 0.7 })
  vao.position.set(JX, JY, HD / 2 + 0.035)
  casa.add(vao)
  for (const [w, h, x, y] of [
    [JW, 0.08, 0, JH / 2 - 0.04], [JW, 0.08, 0, -JH / 2 + 0.04],
    [0.08, JH, -JW / 2 + 0.04, 0], [0.08, JH, JW / 2 - 0.04, 0],
  ] as const) {
    const barra = rbox(w, h, 0.08, 0.015, BRANCO, { roughness: 0.55 })
    barra.position.set(JX + x, JY + y, HD / 2 + 0.07)
    casa.add(barra)
  }
  const peitoril = rbox(JW + 0.12, 0.05, 0.16, 0.015, BRANCO, { roughness: 0.55 })
  peitoril.position.set(JX, JY - JH / 2 - 0.02, HD / 2 + 0.1)
  casa.add(peitoril)
  const verga = rbox(JW + 0.1, 0.06, 0.1, 0.015, BRANCO, { roughness: 0.55 })
  verga.position.set(JX, JY + JH / 2 + 0.04, HD / 2 + 0.08)
  casa.add(verga)
  // cortininhas creme nos cantos do vão
  for (const sx of [-1, 1]) {
    const cortina = capsule(0.045, 0.42, '#efe2c4', { roughness: 0.92 })
    cortina.scale.z = 0.5
    cortina.position.set(JX + sx * (JW / 2 - 0.12), JY + 0.03, HD / 2 + 0.05)
    casa.add(cortina)
  }
  // floreira sob o peitoril
  const floreira = rbox(0.6, 0.1, 0.12, 0.02, MADEIRA, { roughness: 0.8 })
  floreira.position.set(JX, JY - JH / 2 - 0.11, HD / 2 + 0.1)
  casa.add(floreira)
  for (let f = 0; f < 5; f++) {
    const flor = sphere(0.04, f % 2 ? '#f4f0e6' : '#e07a9a', { roughness: 0.6 })
    flor.position.set(JX - 0.22 + f * 0.11, JY - JH / 2 - 0.03, HD / 2 + 0.13)
    casa.add(flor)
  }

  // ---- porta-retrato da família (dentro da janela) --------------------------
  const retrato = new THREE.Group()
  retrato.position.set(JX, JY - 0.04, HD / 2 + 0.06)
  retrato.rotation.x = -0.06
  casa.add(retrato)

  const quadro = rbox(0.52, 0.4, 0.04, 0.02, '#b8873e', { roughness: 0.45, metalness: 0.3 })
  retrato.add(quadro)
  const foto = rbox(0.44, 0.32, 0.01, 0.008, '#dfe9ef', { roughness: 0.6 })
  foto.position.z = 0.022
  retrato.add(foto)

  // pai, mãe e duas crianças: rostinhos redondos lado a lado
  const familia: [number, number, number, string, string, string][] = [
    // x, y, raio, pele, cabelo, roupa
    [-0.15, 0.03, 0.058, '#e9c3a0', '#5a3b24', '#3f6aa0'],
    [-0.035, 0.02, 0.054, '#f0cfb0', '#c98a3a', '#c0504a'],
    [0.07, -0.03, 0.044, '#f0cfb0', '#e3c264', '#5e9a4a'],
    [0.16, -0.04, 0.04, '#e9c3a0', '#5a3b24', '#d9a03a'],
  ]
  for (const [fx, fy, r, pele, cabelo, roupa] of familia) {
    const ombros = sphere(r * 1.25, roupa, { roughness: 0.8 })
    ombros.scale.set(1, 0.6, 0.35)
    ombros.position.set(fx, fy - r * 1.55, 0.03)
    retrato.add(ombros)
    const rosto = sphere(r, pele, { roughness: 0.6 })
    rosto.scale.z = 0.45
    rosto.position.set(fx, fy, 0.035)
    retrato.add(rosto)
    const topo = sphere(r * 1.02, cabelo, { roughness: 0.8 })
    topo.scale.set(1.04, 0.55, 0.45)
    topo.position.set(fx, fy + r * 0.62, 0.032)
    retrato.add(topo)
    for (const ex of [-1, 1]) {
      const olho = sphere(r * 0.13, '#1a1a1a', { roughness: 0.3 })
      olho.position.set(fx + ex * r * 0.36, fy + r * 0.05, 0.035 + r * 0.44)
      retrato.add(olho)
    }
    const sorriso = rbox(r * 0.6, r * 0.12, 0.01, r * 0.05, '#9a3b3b', { roughness: 0.5 })
    sorriso.position.set(fx, fy - r * 0.4, 0.035 + r * 0.43)
    retrato.add(sorriso)
  }

  // ---- caixa de correio azul num poste --------------------------------------
  const caixa = new THREE.Group()
  caixa.position.set(MX, 0, MZ)
  caixa.rotation.y = -0.06
  root.add(caixa)

  const poste = rbox(0.13, POST_TOP - GY + 0.04, 0.13, 0.02, MADEIRA, { roughness: 0.85 })
  poste.position.y = (POST_TOP + GY) / 2
  caixa.add(poste)
  const pe = puff(0.13, GRAMA_ESC, 5, 51, { roughness: 0.95 })
  pe.position.y = GY + 0.03
  pe.scale.y = 0.55
  caixa.add(pe)
  const suporte = rbox(0.5, 0.05, 0.34, 0.015, MADEIRA_ESC, { roughness: 0.8 })
  suporte.position.y = POST_TOP + 0.025
  caixa.add(suporte)
  for (const sx of [-1, 1]) {
    const mao = rbox(0.04, 0.22, 0.05, 0.01, MADEIRA_ESC, { roughness: 0.8 })
    mao.position.set(sx * 0.09, POST_TOP - 0.08, 0)
    mao.rotation.z = sx * 0.7
    caixa.add(mao)
  }

  const corpoCaixa = rbox(0.76, 0.36, 0.45, 0.035, AZUL_CAIXA, { roughness: 0.35, metalness: 0.35 })
  corpoCaixa.position.y = BOX_Y
  caixa.add(corpoCaixa)
  const tampa = cylinder(LID_R, LID_R, 0.75, AZUL_CAIXA, { roughness: 0.35, metalness: 0.35 }, 40)
  tampa.rotation.z = Math.PI / 2
  tampa.position.y = BOX_TOP
  caixa.add(tampa)
  const junta = rbox(0.77, 0.018, 0.46, 0.008, AZUL_CAIXA_ESC, { roughness: 0.4, metalness: 0.3 })
  junta.position.y = BOX_TOP
  caixa.add(junta)
  for (const sx of [-1, 1]) {
    const tampao = cylinder(LID_R + 0.008, LID_R + 0.008, 0.02, AZUL_CAIXA_ESC, { roughness: 0.4, metalness: 0.3 }, 40)
    tampao.rotation.z = Math.PI / 2
    tampao.position.set(sx * 0.38, BOX_TOP, 0)
    caixa.add(tampao)
  }
  const trinco = cylinder(0.03, 0.03, 0.04, '#c9ced4', { roughness: 0.25, metalness: 0.8 })
  trinco.rotation.x = Math.PI / 2
  trinco.position.set(0, BOX_TOP + 0.09, LID_R - 0.01)
  caixa.add(trinco)

  // ---- plaquinha ELSA ---------------------------------------------------------
  const placa = new THREE.Group()
  placa.position.set(MX, BOX_Y - 0.01, MZ + 0.235)
  placa.rotation.y = -0.06
  root.add(placa)

  const chapa = rbox(0.6, 0.22, 0.02, 0.03, BRANCO, { roughness: 0.4 })
  placa.add(chapa)
  for (const [glyph, lx] of [['E', -0.17], ['L', -0.052], ['S', 0.058], ['A', 0.176]] as const) {
    const l = letter(glyph)
    l.position.set(lx, 0, 0.014)
    placa.add(l)
  }
  for (const sx of [-1, 1]) {
    const rebite = sphere(0.012, '#c9ced4', { roughness: 0.25, metalness: 0.8 })
    rebite.position.set(sx * 0.27, 0, 0.012)
    placa.add(rebite)
  }

  // ---- PAPAGAIO (pousado na tampa) -------------------------------------------
  const papagaio = new THREE.Group()
  papagaio.position.set(MX, PERCH_Y, MZ)
  papagaio.rotation.y = PAP_ROT
  root.add(papagaio)

  const tronco2 = sphere(0.27, VERDE, { roughness: 0.75 })
  tronco2.scale.set(1, 1.3, 0.95)
  tronco2.position.y = 0.42
  papagaio.add(tronco2)

  const nuca = sphere(0.17, VERDE, { roughness: 0.75 })
  nuca.position.set(0, 0.72, -0.02)
  papagaio.add(nuca)

  for (const side of [-1, 1]) {
    const coxa = sphere(0.1, VERDE, { roughness: 0.75 })
    coxa.position.set(side * 0.11, 0.16, 0.06)
    papagaio.add(coxa)

    const perna = capsule(0.032, 0.06, BICO, { roughness: 0.6 })
    perna.position.set(side * 0.1, 0.07, 0.04)
    papagaio.add(perna)

    // dedos agarrando a tampa: dois pra frente, um pra trás
    for (const [dz, rx] of [[0.08, 1.9], [-0.06, -1.9]] as const) {
      const dedo = capsule(0.024, 0.07, BICO, { roughness: 0.6 })
      dedo.position.set(side * 0.1, 0.01, dz)
      dedo.rotation.x = rx
      papagaio.add(dedo)
    }
  }

  // ---- peito verde-claro (estufa) ---------------------------------------------
  const peito = new THREE.Group()
  peito.position.set(0, 0.42, 0.12)
  papagaio.add(peito)
  const peitoMesh = sphere(0.22, VERDE_CLARO, { roughness: 0.8 })
  peitoMesh.scale.set(1, 1.2, 0.75)
  peito.add(peitoMesh)

  // ---- cabeça: testa amarela, olhos de anel branco, bico curvo ---------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, CABECA_Y, 0.04)
  cabeca.rotation.x = -0.12 // pose final: cabeça erguida, gritando
  papagaio.add(cabeca)

  const cranio = sphere(0.21, VERDE, { roughness: 0.75 })
  cabeca.add(cranio)
  const testa = sphere(0.15, TESTA, { roughness: 0.7 })
  testa.scale.set(1, 0.72, 0.95)
  testa.position.set(0, 0.08, 0.09)
  cabeca.add(testa)

  for (const side of [-1, 1]) {
    const anel = sphere(0.07, '#f4f1ea', { roughness: 0.6 })
    anel.scale.z = 0.6
    anel.position.set(side * 0.12, 0.0, 0.13)
    cabeca.add(anel)
    const iris = sphere(0.042, '#e9a23a', { roughness: 0.3 })
    iris.scale.z = 0.6
    iris.position.set(side * 0.128, 0.005, 0.158)
    cabeca.add(iris)
    const pupila = sphere(0.026, '#151515', { roughness: 0.2 })
    pupila.position.set(side * 0.132, 0.008, 0.172)
    cabeca.add(pupila)
  }

  // bico de cima: base + gancho curvo
  const bicoBase = sphere(0.095, BICO, { roughness: 0.4 })
  bicoBase.scale.set(0.9, 0.95, 1.2)
  bicoBase.position.set(0, -0.03, 0.2)
  cabeca.add(bicoBase)
  const gancho = cone(0.06, 0.15, BICO, { roughness: 0.4 })
  gancho.position.set(0, -0.11, 0.28)
  gancho.rotation.x = Math.PI - 0.5
  cabeca.add(gancho)
  // boca por dentro
  const goela = sphere(0.075, '#5a1f22', { roughness: 0.6 })
  goela.position.set(0, -0.1, 0.17)
  cabeca.add(goela)
  const linguinha = sphere(0.04, '#3a3236', { roughness: 0.5 })
  linguinha.scale.set(1, 0.6, 1.2)
  linguinha.position.set(0, -0.13, 0.2)
  cabeca.add(linguinha)

  // ---- bico de baixo (dobradiça: abre girando em x) ---------------------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.1, 0.14)
  bico.rotation.x = BICO_ABERTO
  cabeca.add(bico)
  const mandibula = sphere(0.075, BICO_ESC, { roughness: 0.45 })
  mandibula.scale.set(0.85, 0.5, 1.3)
  mandibula.position.set(0, -0.01, 0.08)
  bico.add(mandibula)

  // ---- asas ---------------------------------------------------------------
  const asaE = makeWing(-1)
  asaE.position.set(-0.24, 0.62, -0.02)
  asaE.rotation.z = -ASA_ABERTA
  papagaio.add(asaE)

  const asaD = makeWing(1)
  asaD.position.set(0.24, 0.62, -0.02)
  asaD.rotation.z = ASA_ABERTA
  papagaio.add(asaD)

  // ---- rabo comprido verde e azul -------------------------------------------
  const rabo = new THREE.Group()
  rabo.position.set(0, 0.16, -0.2)
  rabo.rotation.set(0.45, 0, 0.22)
  papagaio.add(rabo)
  for (const [k, cor] of [[-1, PENA_AZUL], [0, VERDE], [1, PENA_AZUL]] as const) {
    const pena = capsule(0.055, k === 0 ? 0.66 : 0.52, cor, { roughness: 0.65 })
    pena.scale.z = 0.45
    pena.position.set(k * 0.07, k === 0 ? -0.38 : -0.32, k === 0 ? 0 : -0.01)
    pena.rotation.z = k * 0.12
    rabo.add(pena)
  }

  // ---- anéis do grito saindo do bico ------------------------------------------
  const aneis = new THREE.Group()
  // ponta do bico no mundo (aproximada a partir da pose do papagaio)
  const tip = new THREE.Vector3(0, CABECA_Y - 0.08, 0.33)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), PAP_ROT)
    .add(new THREE.Vector3(MX, PERCH_Y, MZ))
  aneis.position.copy(tip)
  root.add(aneis)
  const dir = new THREE.Vector3(-0.7, -0.45, 0.55).normalize()
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
  for (const [dist, r] of [[0.2, 0.08], [0.42, 0.13], [0.68, 0.19]] as const) {
    const anel = torus(r, 0.026, GRITO, { roughness: 0.35, emissive: GRITO, emissiveIntensity: 0.25 })
    anel.quaternion.copy(q)
    anel.position.copy(dir).multiplyScalar(dist)
    aneis.add(anel)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'casa', object: base },
    { name: 'casa', group: 'casa', object: casa },
    { name: 'retrato', group: 'casa', object: retrato },
    { name: 'caixa', group: 'caixa', object: caixa },
    { name: 'placa', group: 'caixa', object: placa },
    { name: 'papagaio', group: 'papagaio', object: papagaio },
    { name: 'cabeca', group: 'papagaio', object: cabeca },
    { name: 'peito', group: 'papagaio', object: peito },
    { name: 'asaE', group: 'papagaio', object: asaE },
    { name: 'asaD', group: 'papagaio', object: asaD },
    { name: 'rabo', group: 'papagaio', object: rabo },
    { name: 'bico', group: 'grito', object: bico },
    { name: 'aneis', group: 'grito', object: aneis },
  ]

  // ---- montagem ------------------------------------------------------------
  const s3 = (a: number, b: number) => [
    ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b),
  ]
  const VOO = 3.4
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Brota um gramado e, nele, a casinha vermelha da FAMÍLIA…',
    }),
    seq('casa-rise', 'casa', 0.3, 0.9, [riseFrom(0, 2.2)], { ease: 'easeOut' }),
    seq('retrato-surge', 'retrato', 1.0, 0.5, s3(0.01, 1), { ease: 'easeOut' }),

    seq('caixa-rise', 'caixa', 1.8, 0.8, [riseFrom(0, 1.7)], {
      ease: 'easeOut',
      caption: 'Na frente, a caixa de correio azul com o nome da dona da casa: ELSA.',
    }),
    seq('placa-surge', 'placa', 2.4, 0.5, [
      ...s3(0.01, 1), ch('rotation.z', 0.5, 0),
    ], { ease: 'easeOut' }),

    seq('papagaio-voa', 'papagaio', VOO, 1.2, [
      ch('position.x', MX + 1.9, MX), ch('position.y', PERCH_Y + 1.5, PERCH_Y),
      ch('position.z', MZ + 0.4, MZ), ch('rotation.z', -0.45, 0),
    ], {
      ease: 'easeOut',
      caption: 'Você pediu: manda um abraço pra família! O papagaio leva o recado ao pé da letra e pousa na caixa.',
    }),
    seq('cabeca-voa', 'cabeca', VOO, 1.2, [ch('rotation.z', 0.3, 0)], { ease: 'easeOut' }),
    seq('peito-voa', 'peito', VOO, 0.6, s3(0.78, 0.78)),
    seq('rabo-voa', 'rabo', VOO, 1.3, [ch('rotation.x', 1.2, 0.45)], { ease: 'easeOut' }),
    seq('bico-fecha', 'bico', VOO, 0.4, [ch('rotation.x', 0.2, 0)]),
    seq('asaE-bate1', 'asaE', VOO, 0.3, [ch('rotation.z', -1.2, -2.3)]),
    seq('asaD-bate1', 'asaD', VOO, 0.3, [ch('rotation.z', 1.2, 2.3)]),
    seq('asaE-bate2', 'asaE', VOO + 0.3, 0.3, [ch('rotation.z', -2.3, -1.2)]),
    seq('asaD-bate2', 'asaD', VOO + 0.3, 0.3, [ch('rotation.z', 2.3, 1.2)]),
    seq('asaE-bate3', 'asaE', VOO + 0.6, 0.3, [ch('rotation.z', -1.2, -2.3)]),
    seq('asaD-bate3', 'asaD', VOO + 0.6, 0.3, [ch('rotation.z', 1.2, 2.3)]),
    seq('asaE-dobra', 'asaE', VOO + 0.9, 0.5, [ch('rotation.z', -2.3, -ASA_DOBRADA)], { ease: 'easeOut' }),
    seq('asaD-dobra', 'asaD', VOO + 0.9, 0.5, [ch('rotation.z', 2.3, ASA_DOBRADA)], { ease: 'easeOut' }),

    seq('bico-abre', 'bico', 5.6, 0.3, [ch('rotation.x', 0, BICO_ABERTO)], {
      ease: 'easeOut',
      caption: 'Bico escancarado, ele berra rouco e soprado o nome da plaquinha: RRRÉLSA!',
    }),
    seq('aneis-saem', 'aneis', 5.75, 0.7, s3(0.01, 1), { ease: 'easeOut' }),

    seq('peito-estufa', 'peito', 7.6, 0.6, s3(0.78, 1), {
      ease: 'easeOut',
      caption: 'Estufa o peito verde, abre as asas e grita, com o -EN colado no fim: FAMÍLI-EN!',
    }),
    seq('asaE-abre', 'asaE', 7.65, 0.6, [ch('rotation.z', -ASA_DOBRADA, -ASA_ABERTA)], { ease: 'easeOut' }),
    seq('asaD-abre', 'asaD', 7.65, 0.6, [ch('rotation.z', ASA_DOBRADA, ASA_ABERTA)], { ease: 'easeOut' }),
    seq('cabeca-ergue', 'cabeca', 7.6, 0.5, [ch('rotation.x', 0, -0.12)], { ease: 'easeOut' }),

    seq('retrato-balanca1', 'retrato', 9.4, 0.3, [ch('rotation.z', 0, 0.16)], {
      ease: 'easeOut',
      caption: 'Na janela, o porta-retrato da família balança — recado entregue.',
    }),
    seq('retrato-balanca2', 'retrato', 9.7, 0.4, [ch('rotation.z', 0.16, -0.1)], { ease: 'easeInOut' }),
    seq('retrato-balanca3', 'retrato', 10.1, 0.4, [ch('rotation.z', -0.1, 0)], { ease: 'easeInOut' }),

    seq('aneis-pulsa', 'aneis', 11.0, 0.5, s3(0.85, 1), {
      ease: 'easeOut',
      caption: 'Hälsa familjen! — Manda lembranças pra família!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 2.05, 5.5], target: [-0.05, 1.55, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'halsa-familjen',
    contexto:
      "Despedida: de um amigo, colega ou vizinho que tem família, no fim de uma ligação, antes das férias ou do Natal. A resposta típica é 'Tack, det ska jag göra!' (obrigado, pode deixar!).",
    fraseFonte: 'Manda lembranças pra família!',
    fraseAlvo: 'Hälsa familjen!',
    pronuncia:
      "RRÉL-sa fa-MIL-ien! ('hälsa' com o h soprado, É ABERTO e curto e L de ponta de língua — nunca 'RRÉU-sa', com o L virando U —, S de cobra e -a fraquinho; 'familjen' com a força no MIL, I curto, e o -jen = ien, com I de ioga: fa-MIL-ien, três sílabas)",
    ponteSonora:
      "RRÉLSA! FAMÍLI-EN! (5 sílabas: RRÉL-sa-fa-MIL-ien; força no RRÉL e no MIL; RRÉLSA = o nome ELSA — nome de vovó sueca, escrito na caixa de correio — berrado com o h soprado e rouco de papagaio na frente: RR leve de carioca (é o h de 'hälsa'), É ABERTO de 'pé' e curto; o L é de PONTA DE LÍNGUA, grudada atrás dos dentes como em 'lá' — nunca o 'ÉU-sa' do português, com o L virando U —; o S é de cobra, nunca Z, e o -a do fim fraquinho; é o mesmo RRÉL soprado do RRÉLI de 'Trevlig helg!', mas aqui vem o SA; FAMÍLI-EN = a FAMÍLIA do português com o -A trocado por -EN, o artigo sueco colado no FIM (como o -EN de 'helgen' e o -AN de 'skolan'): familj = família, familjen = A família; a força fica no MÍL, com I CURTO, e o LI-EN sai numa sílaba só, com I de ioga: fa-MÍL-ien — três sílabas, nunca 'fa-mi-li-ÊN' com quatro)",
    historia:
      'Na despedida, você pede ao amigo: manda um abraço pra família! O papagaio dele leva o recado ao pé da letra: voa até a casinha vermelha da família, pousa na caixa de correio onde está escrito ELSA, o nome da dona da casa, e berra, rouco e soprado: RRRÉLSA! Depois estufa o peito verde e grita no sueco de papagaio, com o -EN colado no fim: FAMÍLI-EN! Na janela, o porta-retrato da família balança — recado entregue: lembranças à família.',
  },
  createScene,
  refine: { organic: ['papagaio', 'cabeca', 'peito'] },
}

export default card
