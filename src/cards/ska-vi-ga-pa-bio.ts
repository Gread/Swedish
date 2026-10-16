import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Ska vi gå på bio?" — SKA! VI... GÔ(ta)! PÔ! BI(c)O?
 *
 * Na calçada de um cinema, um albatroz de asas enormes dança SKA ao lado do
 * rádio laranja, olha pra cima — "eu VI!" — e a pipoqueira tombada na
 * marquise solta uma GOTA gorda de manteiga que — PÔ! — cai bem na ponta do
 * BICO. Ele nem liga: estica o pescoço pra você com dois ingressos no bico.
 *
 * Acento saturado reservado à GOTA de manteiga (amarelo-ouro brilhante); o
 * resto da paleta é azul-noite, vermelho-cinema e branco/cinza do albatroz.
 */

const CALCADA = '#9a9ea6'
const CALCADA_ESC = '#5c6068'
const JUNTA = '#80848c'
const TAPETE = '#9c2431'
const OURO = '#cfa04a'
const FACHADA = '#26375f'
const FACHADA_ESC = '#1b2847'
const VERMELHO = '#b83230'
const CREME = '#fbf1dc'
const LAMPADA = '#ffe7a0'
const BRANCO = '#f4f2ec'
const DORSO = '#8d939b'
const ASA = '#4b4f57'
const ASA_ESC = '#363940'
const ASA_CLARA = '#7c818a'
const BICO = '#efb48c'
const BICO_PONTA = '#d98a68'
const PATA = '#e0a59c'
const OLHO = '#16161a'
const SOMBRA = '#6c727b'
const LARANJA = '#e5762c'
const PRETO = '#1a1a1e'
const INGRESSO = '#c9303c'
const MANTEIGA = '#ffbf12' // acento: a GOTA
const PIPOCA = '#f8e9c2'

const GY = 0.16 // topo da calçada
const MQ_Y = 2.3 // centro da marquise
const MQ_TOP = MQ_Y + 0.17

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.04, 0.01, CREME, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** B I O — letras de traço grosso para a marquise. */
function letter(which: 'B' | 'I' | 'O') {
  const g = new THREE.Group()
  const t = 0.045
  if (which === 'B') {
    g.add(stroke(t, 0.24, -0.055, 0))
    g.add(stroke(0.1, t, -0.012, 0.1))
    g.add(stroke(0.1, t, -0.012, 0))
    g.add(stroke(0.11, t, -0.008, -0.1))
    g.add(stroke(t, 0.09, 0.04, 0.052))
    g.add(stroke(t, 0.09, 0.048, -0.05))
  } else if (which === 'I') {
    g.add(stroke(t, 0.24, 0, 0))
  } else {
    const o = torus(0.075, 0.024, CREME, { roughness: 0.5 })
    o.scale.set(1, 1.42, 1)
    g.add(o)
  }
  return g
}

/** Nota musical preta: cabeça oval inclinada, haste, bandeirola. */
function note(beamed = false) {
  const g = new THREE.Group()
  const heads = beamed ? [-0.08, 0.08] : [0]
  for (const hx of heads) {
    const head = sphere(0.062, PRETO, { roughness: 0.3 })
    head.scale.set(1.3, 0.9, 0.7)
    head.rotation.z = 0.4
    head.position.set(hx, 0, 0)
    g.add(head)
    const stem = rbox(0.026, 0.3, 0.026, 0.008, PRETO, { roughness: 0.3 })
    stem.position.set(hx + 0.07, 0.15, 0)
    g.add(stem)
  }
  if (beamed) {
    const beam = rbox(0.2, 0.045, 0.03, 0.01, PRETO, { roughness: 0.3 })
    beam.position.set(0.07, 0.29, 0)
    beam.rotation.z = 0.12
    g.add(beam)
  } else {
    const flag = rbox(0.11, 0.04, 0.026, 0.01, PRETO, { roughness: 0.3 })
    flag.position.set(0.11, 0.25, 0)
    flag.rotation.z = -0.7
    g.add(flag)
  }
  return g
}

function makeWing(side: number) {
  const g = new THREE.Group()

  // braço: lâmina achatada, mais larga junto ao corpo
  const braco = sphere(1, ASA, { roughness: 0.8, size: 0.8 })
  braco.scale.set(0.52, 0.2, 0.075)
  braco.position.set(side * 0.42, 0, 0)
  g.add(braco)

  // mão: lâmina mais fina e comprida, levemente erguida
  const mao = sphere(1, ASA, { roughness: 0.8, size: 0.8 })
  mao.scale.set(0.55, 0.15, 0.065)
  mao.rotation.z = side * 0.06
  mao.position.set(side * 1.1, 0.05, 0)
  g.add(mao)

  // coberteiras mais claras na borda de ataque
  const cobertura = sphere(1, ASA_CLARA, { roughness: 0.8, size: 0.8 })
  cobertura.scale.set(0.72, 0.085, 0.085)
  cobertura.position.set(side * 0.66, 0.1, 0.012)
  g.add(cobertura)

  // secundárias: fileira de penas na borda de fuga
  for (let k = 0; k < 7; k++) {
    const pena = capsule(0.048, 0.16, ASA_ESC, { roughness: 0.8 })
    pena.scale.set(1, 1, 0.45)
    pena.rotation.z = side * (0.25 + k * 0.04)
    pena.position.set(side * (0.14 + k * 0.165), -0.2 + k * 0.015, 0)
    g.add(pena)
  }
  // primárias: dedos abrindo em leque na ponta
  for (let k = 0; k < 4; k++) {
    const pena = capsule(0.05, 0.3, ASA_ESC, { roughness: 0.8 })
    pena.scale.set(1, 1, 0.45)
    pena.rotation.z = side * (Math.PI / 2 - 0.32 + k * 0.22)
    pena.position.set(side * (1.55 - k * 0.04), 0.1 - k * 0.075, 0)
    g.add(pena)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- calçada de lajotas + tapete vermelho ---------------------------------
  const calcada = new THREE.Group()

  const meio = cylinder(2.62, 2.72, 0.12, CALCADA_ESC, { roughness: 0.9 })
  meio.position.y = 0.06
  calcada.add(meio)

  const piso = cylinder(2.55, 2.6, 0.04, CALCADA, { roughness: 0.85 })
  piso.position.y = 0.14
  calcada.add(piso)

  for (let i = -4; i <= 4; i++) {
    const p = i * 0.56
    const meia = Math.sqrt(Math.max(0, 2.5 * 2.5 - p * p))
    if (meia < 0.2) continue
    const jx = rbox(meia * 2, 0.008, 0.02, 0.003, JUNTA, { roughness: 0.9 })
    jx.position.set(0, GY + 0.002, p)
    calcada.add(jx)
    const jz = rbox(0.02, 0.008, meia * 2, 0.003, JUNTA, { roughness: 0.9 })
    jz.position.set(p, GY + 0.002, 0)
    calcada.add(jz)
  }

  const tapete = rbox(1.0, 0.03, 2.35, 0.01, TAPETE, { roughness: 0.92 })
  tapete.position.set(0, GY + 0.015, -0.12)
  calcada.add(tapete)
  for (const s of [-1, 1]) {
    const debrum = rbox(0.04, 0.034, 2.35, 0.01, OURO, { roughness: 0.35, metalness: 0.6 })
    debrum.position.set(s * 0.5, GY + 0.017, -0.12)
    calcada.add(debrum)
  }

  // pedestais dourados com cordão de veludo nos cantos do tapete
  for (const s of [-1, 1]) {
    const postes: [number, number][] = [[s * 0.78, 1.0], [s * 0.78, 0.15]]
    for (const [px, pz] of postes) {
      const pe = cylinder(0.08, 0.1, 0.04, OURO, { roughness: 0.3, metalness: 0.7 })
      pe.position.set(px, GY + 0.02, pz)
      calcada.add(pe)
      const haste = cylinder(0.022, 0.022, 0.5, OURO, { roughness: 0.3, metalness: 0.7 })
      haste.position.set(px, GY + 0.27, pz)
      calcada.add(haste)
      const bola = sphere(0.04, OURO, { roughness: 0.3, metalness: 0.7 })
      bola.position.set(px, GY + 0.54, pz)
      calcada.add(bola)
    }
    const cordao = capsule(0.022, 0.8, TAPETE, { roughness: 0.85 })
    cordao.rotation.x = Math.PI / 2
    cordao.position.set(s * 0.78, GY + 0.46, 0.575)
    calcada.add(cordao)
  }

  // ---- fachada azul-noite com porta dupla dourada ---------------------------
  const fachada = new THREE.Group()
  fachada.position.set(0, GY, -1.45)

  const parede = rbox(4.1, 2.85, 0.3, 0.04, FACHADA, { roughness: 0.7 })
  parede.position.y = 1.425
  fachada.add(parede)

  const rodape = rbox(4.14, 0.18, 0.34, 0.03, FACHADA_ESC, { roughness: 0.75 })
  rodape.position.y = 0.09
  fachada.add(rodape)

  const cornija = rbox(4.2, 0.12, 0.4, 0.03, FACHADA_ESC, { roughness: 0.7 })
  cornija.position.y = 2.82
  fachada.add(cornija)

  const batente = rbox(1.2, 1.62, 0.06, 0.03, OURO, { roughness: 0.35, metalness: 0.65 })
  batente.position.set(0, 0.81, 0.16)
  fachada.add(batente)
  for (const s of [-1, 1]) {
    const folha = rbox(0.5, 1.48, 0.05, 0.02, '#d9ad55', { roughness: 0.3, metalness: 0.7 })
    folha.position.set(s * 0.27, 0.76, 0.2)
    fachada.add(folha)
    const vidro = rbox(0.3, 0.7, 0.02, 0.015, '#2d2a3a', { roughness: 0.15 })
    vidro.position.set(s * 0.27, 0.95, 0.23)
    fachada.add(vidro)
    const puxador = capsule(0.02, 0.22, '#f1d590', { roughness: 0.25, metalness: 0.8 })
    puxador.position.set(s * 0.06, 0.78, 0.25)
    fachada.add(puxador)
  }

  // cartazes iluminados dos dois lados
  const cartazes: [number, string, string][] = [[-1.5, '#e8d9b8', '#3f6f8f'], [1.5, '#dce7ee', '#b5543c']]
  for (const [cx, fundo, figura] of cartazes) {
    const moldura = rbox(0.74, 1.04, 0.06, 0.02, OURO, { roughness: 0.35, metalness: 0.6 })
    moldura.position.set(cx, 1.12, 0.17)
    fachada.add(moldura)
    const papel = rbox(0.62, 0.92, 0.02, 0.01, fundo, { roughness: 0.6, emissive: fundo, emissiveIntensity: 0.18 })
    papel.position.set(cx, 1.12, 0.2)
    fachada.add(papel)
    const sol = cylinder(0.17, 0.17, 0.02, figura, { roughness: 0.6 }, 32)
    sol.rotation.x = Math.PI / 2
    sol.position.set(cx, 1.25, 0.215)
    fachada.add(sol)
    const faixa = rbox(0.44, 0.08, 0.02, 0.01, figura, { roughness: 0.6 })
    faixa.position.set(cx, 0.88, 0.215)
    fachada.add(faixa)
  }

  // ---- marquise vermelha com lâmpadas e BIO ---------------------------------
  const marquise = new THREE.Group()
  marquise.position.set(0, MQ_Y, -0.55)

  const caixa = rbox(3.1, 0.34, 1.5, 0.05, VERMELHO, { roughness: 0.5 })
  marquise.add(caixa)

  const forro = rbox(2.96, 0.04, 1.4, 0.015, '#f3d9a4', { roughness: 0.6, emissive: '#f3d9a4', emissiveIntensity: 0.3 })
  forro.position.y = -0.17
  marquise.add(forro)

  for (const fy of [0.15, -0.15]) {
    const friso = rbox(3.14, 0.04, 0.04, 0.015, OURO, { roughness: 0.3, metalness: 0.7 })
    friso.position.set(0, fy, 0.76)
    marquise.add(friso)
  }

  for (let i = 0; i < 16; i++) {
    const x = -1.45 + i * (2.9 / 15)
    for (const fy of [0.11, -0.11]) {
      if (fy > 0 && Math.abs(x + 0.5) < 0.3) continue
      const l = sphere(0.034, LAMPADA, { emissive: '#ffd36a', emissiveIntensity: 1.4 }, 12)
      l.position.set(x, fy, 0.77)
      marquise.add(l)
    }
  }
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const l = sphere(0.034, LAMPADA, { emissive: '#ffd36a', emissiveIntensity: 1.4 }, 12)
      l.position.set(sx * 1.57, -0.11, 0.62 - i * 0.24)
      marquise.add(l)
    }
  }

  const bio = new THREE.Group()
  bio.position.set(-0.5, 0.0, 0.78)
  const letras: ['B' | 'I' | 'O', number][] = [['B', -0.2], ['I', 0], ['O', 0.2]]
  for (const [c, lx] of letras) {
    const l = letter(c)
    l.position.x = lx
    bio.add(l)
  }
  marquise.add(bio)

  // ---- pipoqueira tombando na marquise --------------------------------------
  // pivô na borda da frente, no chão: a máquina pende para a frente
  const maquina = new THREE.Group()
  maquina.position.set(0.66, MQ_TOP, 0.12)
  maquina.rotation.set(0.3, -0.35, 0)

  const corpoM = new THREE.Group()
  corpoM.position.z = -0.19
  maquina.add(corpoM)

  const carro = rbox(0.48, 0.2, 0.38, 0.03, VERMELHO, { roughness: 0.45 })
  carro.position.y = 0.1
  corpoM.add(carro)
  const placa = rbox(0.34, 0.1, 0.02, 0.01, CREME, { roughness: 0.5 })
  placa.position.set(0, 0.1, 0.195)
  corpoM.add(placa)
  for (let i = 0; i < 4; i++) {
    const ponto = sphere(0.018, VERMELHO, { roughness: 0.45 }, 10)
    ponto.position.set(-0.11 + i * 0.075, 0.1, 0.205)
    corpoM.add(ponto)
  }

  const vidroM = rbox(0.44, 0.38, 0.34, 0.01, '#dff2ff', { roughness: 0.05 })
  ;(vidroM.material as THREE.MeshStandardMaterial).transparent = true
  ;(vidroM.material as THREE.MeshStandardMaterial).opacity = 0.22
  vidroM.position.y = 0.39
  corpoM.add(vidroM)

  for (const px of [-1, 1]) {
    for (const pz of [-1, 1]) {
      const coluna = rbox(0.04, 0.4, 0.04, 0.012, VERMELHO, { roughness: 0.45 })
      coluna.position.set(px * 0.22, 0.39, pz * 0.17)
      corpoM.add(coluna)
    }
  }

  const monte = puff(0.15, PIPOCA, 9, 7, { roughness: 0.85 })
  monte.scale.set(1.3, 0.8, 1.0)
  monte.position.set(0, 0.3, 0.02)
  corpoM.add(monte)

  const chaleira = lathe(
    [[0, 0], [0.07, 0.0], [0.1, 0.04], [0.105, 0.1], [0.095, 0.11], [0, 0.11]],
    '#c9ccd1',
    { roughness: 0.25, metalness: 0.75 },
  )
  chaleira.position.set(0, 0.47, 0.03)
  chaleira.rotation.x = 0.5
  corpoM.add(chaleira)
  const escorrido = capsule(0.03, 0.1, MANTEIGA, { roughness: 0.12 })
  escorrido.position.set(0, 0.45, 0.13)
  corpoM.add(escorrido)

  const teto = rbox(0.52, 0.07, 0.42, 0.025, VERMELHO, { roughness: 0.45 })
  teto.position.y = 0.615
  corpoM.add(teto)
  const cupula = lathe(
    [[0, 0], [0.16, 0], [0.15, 0.05], [0.1, 0.1], [0.03, 0.12], [0, 0.12]],
    VERMELHO,
    { roughness: 0.45 },
  )
  cupula.position.y = 0.65
  corpoM.add(cupula)
  const pinaculo = sphere(0.035, OURO, { roughness: 0.3, metalness: 0.7 })
  pinaculo.position.y = 0.79
  corpoM.add(pinaculo)

  // pipoca transbordando pela frente e espalhada na marquise
  const pipocas: [number, number, number][] = [
    [-0.12, 0.5, 0.2], [0.06, 0.56, 0.21], [0.16, 0.42, 0.22], [-0.04, 0.34, 0.22],
    [-0.3, 0.02, 0.12], [0.3, 0.03, 0.05], [-0.18, 0.03, 0.3],
  ]
  for (const [px, py, pz] of pipocas) {
    const p = puff(0.04, PIPOCA, 4, Math.round(px * 100 + 50), { roughness: 0.85 })
    p.position.set(px, py, pz)
    corpoM.add(p)
  }

  // ---- ALBATROZ ------------------------------------------------------------
  const albatroz = new THREE.Group()
  albatroz.position.set(0, GY, 0.35)
  albatroz.rotation.y = 0.28

  for (const s of [-1, 1]) {
    const perna = capsule(0.06, 0.16, PATA, { roughness: 0.6 })
    perna.position.set(s * 0.17, 0.17, 0.03)
    albatroz.add(perna)
    const pe = sphere(0.15, PATA, { roughness: 0.6 })
    pe.scale.set(0.85, 0.22, 1.2)
    pe.position.set(s * 0.18, 0.035, 0.12)
    albatroz.add(pe)
    for (let k = -1; k <= 1; k++) {
      const dedo = capsule(0.028, 0.14, PATA, { roughness: 0.6 })
      dedo.rotation.set(Math.PI / 2, 0, -k * 0.45)
      dedo.position.set(s * 0.18 + k * 0.08, 0.03, 0.25)
      albatroz.add(dedo)
    }
  }

  const corpo = sphere(0.5, BRANCO, { roughness: 0.85 })
  corpo.scale.set(1.0, 1.25, 0.95)
  corpo.position.set(0, 0.88, 0.02)
  albatroz.add(corpo)

  const dorso = sphere(0.47, DORSO, { roughness: 0.85 })
  dorso.scale.set(0.9, 1.05, 0.6)
  dorso.position.set(0, 1.0, -0.26)
  albatroz.add(dorso)

  const cauda = cone(0.2, 0.42, ASA_ESC, { roughness: 0.85 })
  cauda.scale.set(1.3, 1, 0.45)
  cauda.rotation.x = -2.3
  cauda.position.set(0, 0.42, -0.48)
  albatroz.add(cauda)

  const pescoco = capsule(0.2, 0.32, BRANCO, { roughness: 0.85 })
  pescoco.position.set(0, 1.5, 0.08)
  pescoco.rotation.x = 0.15
  albatroz.add(pescoco)

  // ---- cabeça: sombra cinza sobre os olhos, bico comprido em gancho --------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.8, 0.16)
  cabeca.rotation.set(-0.16, 0.42, 0)
  albatroz.add(cabeca)

  const cranio = sphere(0.24, BRANCO, { roughness: 0.85 })
  cranio.scale.set(0.9, 0.95, 1.12)
  cabeca.add(cranio)

  for (const s of [-1, 1]) {
    const sombra = sphere(0.075, SOMBRA, { roughness: 0.85 })
    sombra.scale.set(0.8, 0.5, 1.7)
    sombra.position.set(s * 0.16, 0.07, 0.06)
    cabeca.add(sombra)
    const olho = sphere(0.045, OLHO, { roughness: 0.2 })
    olho.position.set(s * 0.17, 0.025, 0.11)
    cabeca.add(olho)
    const brilho = sphere(0.013, '#ffffff', { roughness: 0.1 })
    brilho.position.set(s * 0.205, 0.045, 0.13)
    cabeca.add(brilho)
  }

  const bicoM = lathe(
    [[0, 0], [0.1, 0.02], [0.098, 0.16], [0.085, 0.36], [0.07, 0.56], [0.06, 0.7], [0.045, 0.78], [0, 0.8]],
    BICO,
    { roughness: 0.35 },
  )
  bicoM.rotation.x = Math.PI / 2
  bicoM.scale.set(0.72, 1, 1)
  bicoM.position.set(0, -0.03, 0.14)
  cabeca.add(bicoM)

  const gancho = cone(0.042, 0.11, BICO_PONTA, { roughness: 0.35 })
  gancho.scale.set(0.8, 1, 1)
  gancho.rotation.x = Math.PI - 0.5
  gancho.position.set(0, -0.065, 0.93)
  cabeca.add(gancho)

  const ponta = sphere(0.045, BICO_PONTA, { roughness: 0.35 })
  ponta.scale.set(0.75, 0.9, 1)
  ponta.position.set(0, -0.03, 0.91)
  cabeca.add(ponta)

  // ---- asas (pivô no ombro) -------------------------------------------------
  const ASA_E = -0.55 // erguida: o passo de dança
  const ASA_D = -0.12
  const asaE = makeWing(-1)
  asaE.position.set(-0.42, 1.28, -0.02)
  asaE.rotation.z = ASA_E
  albatroz.add(asaE)
  const asaD = makeWing(1)
  asaD.position.set(0.42, 1.28, -0.02)
  asaD.rotation.z = ASA_D
  albatroz.add(asaD)

  // ---- ingressos no bico (filhos da cabeça) ---------------------------------
  const ingressos = new THREE.Group()
  ingressos.position.set(0, -0.05, 0.5)
  ingressos.rotation.y = -0.85 // de frente para a câmera
  cabeca.add(ingressos)
  // presos pela ponta no bico, pendurados em leque sobre o peito branco
  const tiq: [number, number, number][] = [[-0.04, 0.0, 0.38], [0.04, 0.016, -0.26]]
  for (const [tx, tz, rz] of tiq) {
    const t = new THREE.Group()
    t.position.set(tx, 0, tz)
    t.rotation.z = rz
    const papel = rbox(0.21, 0.42, 0.016, 0.016, INGRESSO, { roughness: 0.6 })
    papel.position.y = -0.17
    t.add(papel)
    const canhoto = rbox(0.19, 0.08, 0.02, 0.01, CREME, { roughness: 0.6 })
    canhoto.position.y = -0.33
    t.add(canhoto)
    const listra = rbox(0.028, 0.15, 0.02, 0.008, CREME, { roughness: 0.6 })
    listra.position.y = -0.13
    t.add(listra)
    ingressos.add(t)
  }

  // ---- gota de manteiga (filha da cabeça: pousa na ponta do bico) ----------
  const GOTA_Y = 0.115
  const gota = new THREE.Group()
  gota.position.set(0, GOTA_Y, 0.915)
  cabeca.add(gota)
  const bolha = sphere(0.11, MANTEIGA, { roughness: 0.08, emissive: '#ff9d00', emissiveIntensity: 0.25 })
  gota.add(bolha)
  const bico = cone(0.078, 0.16, MANTEIGA, { roughness: 0.08, emissive: '#ff9d00', emissiveIntensity: 0.25 })
  bico.position.y = 0.12
  gota.add(bico)
  const reflexo = sphere(0.025, '#fffbe8', { emissive: '#fff3c0', emissiveIntensity: 1 })
  reflexo.position.set(-0.04, 0.04, 0.08)
  gota.add(reflexo)

  // ---- rádio laranja de ska -------------------------------------------------
  const radio = new THREE.Group()
  radio.position.set(-1.5, GY, 0.95)
  radio.rotation.y = 0.45

  const caixaR = rbox(0.78, 0.44, 0.26, 0.06, LARANJA, { roughness: 0.45 })
  caixaR.position.y = 0.22
  radio.add(caixaR)
  for (const s of [-1, 1]) {
    const aro = torus(0.125, 0.022, '#c9ccd1', { roughness: 0.3, metalness: 0.7 })
    aro.position.set(s * 0.22, 0.21, 0.135)
    radio.add(aro)
    const falante = cylinder(0.12, 0.12, 0.03, PRETO, { roughness: 0.7 }, 32)
    falante.rotation.x = Math.PI / 2
    falante.position.set(s * 0.22, 0.21, 0.125)
    radio.add(falante)
    const miolo = sphere(0.04, '#3a3a40', { roughness: 0.4 })
    miolo.scale.z = 0.5
    miolo.position.set(s * 0.22, 0.21, 0.145)
    radio.add(miolo)
    const alca = rbox(0.04, 0.16, 0.04, 0.015, '#3a3a40', { roughness: 0.5 })
    alca.position.set(s * 0.25, 0.5, 0)
    radio.add(alca)
  }
  const visor = rbox(0.14, 0.1, 0.02, 0.01, CREME, { roughness: 0.4 })
  visor.position.set(0, 0.28, 0.135)
  radio.add(visor)
  const agulha = rbox(0.01, 0.08, 0.025, 0.003, VERMELHO, { roughness: 0.4 })
  agulha.position.set(0.02, 0.28, 0.14)
  radio.add(agulha)
  for (const bx of [-0.04, 0.04]) {
    const botao = cylinder(0.022, 0.022, 0.03, '#3a3a40', { roughness: 0.4 }, 16)
    botao.rotation.x = Math.PI / 2
    botao.position.set(bx, 0.13, 0.14)
    radio.add(botao)
  }
  const barra = rbox(0.54, 0.045, 0.045, 0.02, '#3a3a40', { roughness: 0.5 })
  barra.position.y = 0.58
  radio.add(barra)
  const antena = cylinder(0.008, 0.012, 0.6, '#c9ccd1', { roughness: 0.3, metalness: 0.8 }, 8)
  antena.position.set(0.32, 0.68, -0.06)
  antena.rotation.z = -0.5
  radio.add(antena)

  // ---- notas saindo do rádio -------------------------------------------------
  const notas = new THREE.Group()
  notas.position.set(-1.25, 0.85, 0.85)
  const nn: [number, number, number, number, boolean][] = [
    [0.0, 0.0, 0.0, 0.15, false],
    [0.32, 0.32, -0.05, -0.12, true],
    [0.08, 0.66, -0.1, 0.2, false],
  ]
  for (const [nx, ny, nz, rz, beamed] of nn) {
    const n = note(beamed)
    n.position.set(nx, ny, nz)
    n.rotation.set(0, 0.35, rz)
    notas.add(n)
  }

  root.add(calcada, fachada, marquise, maquina, albatroz, radio, notas)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'calcada', group: 'calcada', object: calcada },
    { name: 'fachada', group: 'cinema', object: fachada },
    { name: 'marquise', group: 'cinema', object: marquise },
    { name: 'albatroz', group: 'albatroz', object: albatroz },
    { name: 'cabeca', group: 'albatroz', object: cabeca },
    { name: 'asaE', group: 'albatroz', object: asaE },
    { name: 'asaD', group: 'albatroz', object: asaD },
    { name: 'radio', group: 'ska', object: radio },
    { name: 'notas', group: 'ska', object: notas },
    { name: 'maquina', group: 'vi', object: maquina },
    { name: 'gota', group: 'gota', object: gota },
    { name: 'ingressos', group: 'bio', object: ingressos },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('calcada-rise', 'calcada', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Sobe do chão a calçada de um cinema, com tapete vermelho até a porta.',
    }),
    seq('fachada-rise', 'fachada', 0.9, 0.8, [riseFrom(GY, 3.0)], {
      ease: 'easeOut',
      caption: 'Fachada azul, porta dourada e a marquise vermelha acesa: BIO, o cinema.',
    }),
    seq('marquise-abre', 'marquise', 1.5, 0.7, [ch('scale.x', 0.02, 1), ch('scale.z', 0.3, 1)], {
      ease: 'easeOut',
    }),

    seq('albatroz-rise', 'albatroz', 2.9, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Do mar chega um ALBATROZ de asas enormes, decidido a ir ao cinema.',
    }),
    seq('cabeca-sobe', 'cabeca', 3.15, 0.7, [ch('position.y', 1.2, 1.8)], { ease: 'easeOut' }),
    seq('asaE-abre', 'asaE', 3.4, 0.6, [ch('scale.x', 0.05, 1)], { ease: 'easeOut' }),
    seq('asaD-abre', 'asaD', 3.4, 0.6, [ch('scale.x', 0.05, 1)], { ease: 'easeOut' }),

    seq('radio-rise', 'radio', 4.8, 0.6, [riseFrom(GY, 0.8)], {
      ease: 'easeOut',
      caption: 'Ele liga o rádio no SKA e dança no contratempo, batendo as asas.',
    }),
    seq('notas-saem', 'notas', 5.1, 0.7, [...s3(0.01, 1), ch('position.y', 0.45, 0.85)], { ease: 'easeOut' }),
    seq('asaE-bate-1', 'asaE', 5.4, 0.3, [ch('rotation.z', ASA_E, -0.05)]),
    seq('asaD-bate-1', 'asaD', 5.4, 0.3, [ch('rotation.z', ASA_D, 0.45)]),
    seq('albatroz-pula', 'albatroz', 5.4, 0.3, [ch('position.y', GY, GY + 0.08)], { ease: 'easeOut' }),
    seq('asaE-bate-2', 'asaE', 5.7, 0.3, [ch('rotation.z', -0.05, ASA_E)]),
    seq('asaD-bate-2', 'asaD', 5.7, 0.3, [ch('rotation.z', 0.45, ASA_D)]),
    seq('albatroz-desce', 'albatroz', 5.7, 0.3, [ch('position.y', GY + 0.08, GY)], { ease: 'easeIn' }),
    seq('asaE-bate-3', 'asaE', 6.0, 0.3, [ch('rotation.z', ASA_E, -0.05)]),
    seq('asaD-bate-3', 'asaD', 6.0, 0.3, [ch('rotation.z', ASA_D, 0.45)]),
    seq('asaE-bate-4', 'asaE', 6.3, 0.3, [ch('rotation.z', -0.05, ASA_E)]),
    seq('asaD-bate-4', 'asaD', 6.3, 0.3, [ch('rotation.z', 0.45, ASA_D)]),

    seq('maquina-surge', 'maquina', 7.0, 0.5, [...s3(0.01, 1)], {
      ease: 'easeOut',
      caption: 'Ele olha pra cima e grita: "eu VI!" — a pipoqueira da marquise transbordou!',
    }),
    seq('cabeca-olha-cima', 'cabeca', 7.0, 0.45, [ch('rotation.x', -0.16, -0.85)], { ease: 'easeOut' }),
    seq('maquina-tomba', 'maquina', 7.6, 0.5, [ch('rotation.x', 0, 0.3)], { ease: 'easeIn' }),

    seq('cabeca-volta', 'cabeca', 8.7, 0.4, [ch('rotation.x', -0.85, -0.16)], { ease: 'easeInOut' }),
    seq('gota-cai', 'gota', 8.9, 0.6, [ch('position.y', GOTA_Y + 0.75, GOTA_Y)], {
      ease: 'easeIn',
      caption: 'Uma GOTA gorda de manteiga despenca e — PÔ! — acerta em cheio a ponta do BICO.',
    }),
    seq('gota-amassa', 'gota', 9.5, 0.12, [ch('scale.y', 1, 0.7), ch('scale.x', 1, 1.2)], { ease: 'easeOut' }),
    seq('gota-volta', 'gota', 9.62, 0.25, [ch('scale.y', 0.7, 1), ch('scale.x', 1.2, 1)], { ease: 'easeOut' }),

    seq('ingressos-surgem', 'ingressos', 10.5, 0.5, [...s3(0.01, 1)], {
      ease: 'easeOut',
      caption: 'Ele nem liga: aperta dois ingressos no BICO e estica o pescoção pra você…',
    }),
    seq('cabeca-estica', 'cabeca', 10.8, 0.6, [ch('position.z', 0.02, 0.16)], { ease: 'easeOut' }),

    seq('notas-flutuam', 'notas', 12.0, 0.6, [ch('position.y', 0.85, 0.95)], {
      ease: 'easeInOut',
      caption: 'Ska vi gå på bio? — Vamos ao cinema?',
    }),
    seq('notas-assentam', 'notas', 12.6, 0.5, [ch('position.y', 0.95, 0.85)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.8, 2.9, 5.6], target: [0.05, 1.62, 0.1] },
  }
}

const PRONUNCIA =
  "ska vi GÔ pô BÍ-o ('ska' colado, sem 'is' na frente e sem força; 'vi' = VI, I limpo; 'gå' = GÔ, Ô FECHADO de 'avô' e longo — é o å longo — e SEM R: depois de 'ska' o verbo fica no infinitivo, com R vira 'går'; 'på' = PÔ, também Ô fechado, mas curtinho e sem força; 'bio' com a força no BÍ, I longo, e o -o curto e fechado, quase U: BÍ-u)"
const PONTE =
  "SKA! VI... GÔ(ta)! PÔ! BI(c)O? (6 sílabas: ska-vi-gô-pô-BÍ-o; a força maior no BÍ e uma menor no GÔ; SKA = o MESMO SKA da bandinha jamaicana de 'Ska vi säga imorgon klockan tre?' e 'Vad ska vi göra?' — aqui é o rádio do albatroz tocando ska —, colado, sem 'is' na frente, curto e sem força; VI = o 'eu VI', o mesmo VI de 'Vi ses!', I limpo e sem força; GÔ(ta) = a GOTA cortada no Ô, o MESMO GÔ de 'Jag måste gå nu': Ô FECHADO de 'avô' e LONGO — é o å longo — e PARE AÍ: com o -TA vira 'gåta' (charada) e com R vira 'går', o presente; depois de 'ska' o verbo fica pelado; PÔ = o 'pô!' brasileiro, o MESMO PÔ de 'Jag är på väg' e 'Kan du skicka det på mejl?': Ô FECHADO, nunca 'pó', e aqui curtinho, sem força, quase engolido entre o GÔ e o BÍ; BI(c)O = o BICO do albatroz sem o C: a força no BÍ, I LONGO, e o -o curto e fechado, puxando pra U, do jeito que o brasileiro já fala o fim de 'bico' — BÍ-u, em DUAS batidas, nunca um 'biu' de uma sílaba só; e aqui o bico NÃO é o bico de pato das outras cartas: o I é limpo, de boca esticada, nunca Ü; 'bio' é o cinema)"
const HISTORIA =
  "Um albatroz de asas de três metros sai do mar decidido a ir ao cinema. Na calçada ele liga o rádio no SKA e dança no contratempo, batendo as asas — até que olha pra cima e grita 'eu VI!': a máquina de pipoca da marquise transbordou, e uma GOTA gorda de manteiga despenca e — PÔ! — acerta em cheio a ponta do BICO. Ele nem liga: lambe a manteiga, aperta os dois ingressos no bico e estica o pescoção pra você — vamos ao cinema?"

export const card: Card = {
  meta: {
    id: 'ska-vi-ga-pa-bio',
    contexto:
      "Social: convite pra ir ao cinema — no Filmstaden ou num cinema de bairro. 'Bio' é o apelido de 'biograf', e 'gå på bio' é a expressão fixa (nunca 'gå till bio'). Na Suécia os filmes estrangeiros passam legendados em sueco, não dublados — só os infantis ganham dublagem.",
    fraseFonte: 'Vamos ao cinema?',
    fraseAlvo: 'Ska vi gå på bio?',
    pronuncia: PRONUNCIA,
    ponteSonora: PONTE,
    historia: HISTORIA,
  },
  createScene,
  refine: { organic: ['albatroz', 'cabeca'] },
}

export default card
