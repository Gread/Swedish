import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, puff,
} from '../rig/helpers'

/**
 * "Kan du hjälpa mig att bära?" — CAN-DU, IÉL-PA M'ÊI... A, (li)BÉRA?
 *
 * Debaixo do viaduto mora um TROLL. Você chega da loja de móveis com a caixa
 * da estante, o carrinho tomba, você pede socorro com eco e berra "Ah,
 * LIBERA!" — o concreto engole o LI e devolve só BÉRA. O troll, encantado,
 * ergue a caixa acima da cabeça como uma pena.
 *
 * Diorama: calçada de concreto, dois pilares e o tabuleiro do viaduto como
 * moldura; troll cinza-musgo à esquerda com a caixa no alto; à direita, o
 * balão BÉRA (acento vermelho, reservado à ponte) com os arcos do eco.
 */

const CALCADA = '#cdc8bd'
const JUNTA = '#a9a499'
const CONCRETO = '#b8b2a7'
const CONCRETO_ESC = '#9d978c'
const FUNDO = '#67635e'
const TROLL = '#7d8676'
const TROLL_ESC = '#666e60'
const TROLL_CLARO = '#8e9786'
const PELE = '#6e4a2c'
const PELE_ESC = '#55381f'
const MUSGO = '#5f8c34'
const MUSGO_CLARO = '#79a743'
const MARFIM = '#efe6cf'
const PAPELAO = '#bb8b53'
const PAPELAO_ESC = '#9c703d'
const FITA = '#dcc48f'
const ETIQUETA = '#f2eee4'
const METAL = '#c3cbd3'
const BORRACHA = '#2e3034'
const BRANCO = '#f6f3ec'
const VERDE_GRAF = '#3f9a6c'
const LARANJA_GRAF = '#d9843a'
const ACENTO = '#e5402a' // acento saturado: SÓ as letras de BÉRA

const GY = 0.18 // topo da calçada
const DECK_Y = 3.15 // face de baixo do tabuleiro
const PIL_X = 2.1 // centro dos pilares
const TX = -0.55 // troll
const TZ = 0.42
const TRY = 0.18
const BOX_L = 1.9
const BOX_H = 0.24
const BOX_W = 0.48
const BOX_TOP_Y = GY + 2.7 // centro da caixa erguida (mundo)
const BOX_TILT = 0.3 // inclinada pra câmera ver a tampa
const CART_X = -1.6
const CART_Z = 1.12
const CART_RY = 0.55
const BALAO: [number, number, number] = [0.98, 1.95, -0.3]

/** Cápsula de A até B — braços, rabo, nariz torto. */
function segment(
  a: [number, number, number],
  b: [number, number, number],
  r: number,
  color: string,
  opts?: MatOpts,
) {
  const A = new THREE.Vector3(...a)
  const B = new THREE.Vector3(...b)
  const m = capsule(r, A.distanceTo(B), color, opts)
  m.position.copy(A).add(B).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize())
  return m
}

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.04, 0.01, ACENTO, { roughness: 0.45 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** B É R A — traço grosso, ~0.26 de altura. */
function letter(which: 'B' | 'E' | 'R' | 'A') {
  const g = new THREE.Group()
  const t = 0.05
  if (which === 'B') {
    g.add(stroke(t, 0.26, -0.065, 0))
    g.add(stroke(0.11, t, -0.015, 0.105))
    g.add(stroke(0.11, t, -0.015, 0))
    g.add(stroke(0.12, t, -0.01, -0.105))
    g.add(stroke(t, 0.1, 0.045, 0.055))
    g.add(stroke(t, 0.1, 0.05, -0.055))
  } else if (which === 'E') {
    g.add(stroke(t, 0.26, -0.05, 0))
    g.add(stroke(0.13, t, 0.0, 0.105))
    g.add(stroke(0.1, t, -0.015, 0))
    g.add(stroke(0.13, t, 0.0, -0.105))
    g.add(stroke(0.04, 0.085, 0.02, 0.2, -0.75)) // acento agudo
  } else if (which === 'R') {
    g.add(stroke(t, 0.26, -0.06, 0))
    g.add(stroke(0.11, t, -0.01, 0.105))
    g.add(stroke(0.11, t, -0.01, 0.005))
    g.add(stroke(t, 0.1, 0.045, 0.055))
    g.add(stroke(t, 0.14, 0.03, -0.07, 0.42))
  } else {
    g.add(stroke(t, 0.275, -0.042, 0, -0.3))
    g.add(stroke(t, 0.275, 0.042, 0, 0.3))
    g.add(stroke(0.1, 0.042, 0, -0.04))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- calçada de concreto -------------------------------------------------
  const base = new THREE.Group()

  const laje = rbox(5.7, 0.18, 3.4, 0.06, CALCADA, { roughness: 0.9 })
  laje.position.set(0, 0.09, 0.2)
  base.add(laje)

  // juntas de dilatação: placas quadradas
  for (const x of [-2.1, -1.05, 0, 1.05, 2.1]) {
    const j = rbox(0.03, 0.012, 3.3, 0.004, JUNTA, { roughness: 0.95 })
    j.position.set(x, GY + 0.002, 0.2)
    base.add(j)
  }
  for (const z of [-0.85, 0.2, 1.25]) {
    const j = rbox(5.6, 0.012, 0.03, 0.004, JUNTA, { roughness: 0.95 })
    j.position.set(0, GY + 0.002, z)
    base.add(j)
  }

  // meio-fio na frente
  const meioFio = rbox(5.7, 0.08, 0.16, 0.03, CONCRETO_ESC, { roughness: 0.85 })
  meioFio.position.set(0, GY + 0.02, 1.84)
  base.add(meioFio)

  // mato teimoso nas frestas
  for (const [mx, mz, s] of [[-2.55, 1.6, 0.11], [2.6, 1.55, 0.09], [-0.95, -0.95, 0.08], [1.55, -0.9, 0.1]] as const) {
    const tufo = puff(s, MUSGO, 5, 70 + mx * 10, { roughness: 0.95 })
    tufo.position.set(mx, GY + s * 0.4, mz)
    tufo.scale.y = 0.7
    base.add(tufo)
  }

  // tampinha e papel amassado
  const papel = sphere(0.07, '#e8e2d4', { roughness: 0.95 })
  papel.scale.set(1, 0.7, 0.9)
  papel.position.set(2.45, GY + 0.05, 0.95)
  base.add(papel)

  root.add(base)

  // ---- viaduto: dois pilares, muro do fundo e o tabuleiro -------------------
  const viaduto = new THREE.Group()
  const PIL_H = DECK_Y - GY

  for (const side of [-1, 1]) {
    const pilar = rbox(0.7, PIL_H, 1.3, 0.05, CONCRETO, { roughness: 0.85 })
    pilar.position.set(side * PIL_X, GY + PIL_H / 2, -0.45)
    viaduto.add(pilar)

    const capitel = rbox(0.9, 0.18, 1.5, 0.04, CONCRETO_ESC, { roughness: 0.85 })
    capitel.position.set(side * PIL_X, DECK_Y - 0.09, -0.45)
    viaduto.add(capitel)

    const sapata = rbox(0.82, 0.12, 1.42, 0.04, CONCRETO_ESC, { roughness: 0.9 })
    sapata.position.set(side * PIL_X, GY + 0.06, -0.45)
    viaduto.add(sapata)

    // marcas das fôrmas de madeira no concreto
    for (const fy of [0.75, 1.5, 2.25]) {
      const marca = rbox(0.66, 0.018, 0.012, 0.004, CONCRETO_ESC, { roughness: 0.9 })
      marca.position.set(side * PIL_X, GY + fy, 0.206)
      viaduto.add(marca)
    }
  }

  const muro = rbox(3.6, PIL_H, 0.25, 0.04, FUNDO, { roughness: 0.9 })
  muro.position.set(0, GY + PIL_H / 2, -1.08)
  viaduto.add(muro)

  // escorridos de umidade no muro
  for (let i = 0; i < 6; i++) {
    const h = 0.4 + rand() * 0.9
    const esc = rbox(0.06 + rand() * 0.05, h, 0.02, 0.01, '#5a5651', { roughness: 0.95 })
    esc.position.set(-1.5 + i * 0.6 + rand() * 0.2, DECK_Y - h / 2 - 0.05, -0.95)
    viaduto.add(esc)
  }

  const tabuleiro = rbox(5.7, 0.42, 1.8, 0.05, CONCRETO, { roughness: 0.85 })
  tabuleiro.position.set(0, DECK_Y + 0.21, -0.45)
  viaduto.add(tabuleiro)

  const pingadeira = rbox(5.72, 0.07, 0.06, 0.02, CONCRETO_ESC, { roughness: 0.85 })
  pingadeira.position.set(0, DECK_Y + 0.035, 0.46)
  viaduto.add(pingadeira)

  const parapeito = rbox(5.7, 0.16, 0.14, 0.04, CONCRETO_ESC, { roughness: 0.85 })
  parapeito.position.set(0, DECK_Y + 0.5, 0.37)
  viaduto.add(parapeito)

  root.add(viaduto)

  // ---- grafite verde e laranja na frente do pilar direito -----------------
  const grafite = new THREE.Group()
  grafite.position.set(PIL_X, GY + 1.25, 0.215)
  for (const [gx, gy, r] of [[-0.06, 0.12, 0.26], [0.12, -0.18, 0.2], [-0.12, -0.3, 0.14]] as const) {
    const blob = sphere(r, VERDE_GRAF, { roughness: 0.6 }, 24)
    blob.scale.set(1, 0.8, 0.05)
    blob.position.set(gx, gy, 0)
    grafite.add(blob)
    const brilho = sphere(r * 0.3, '#9fe0b8', { roughness: 0.6 }, 16)
    brilho.scale.set(1, 0.7, 0.06)
    brilho.position.set(gx - r * 0.35, gy + r * 0.3, 0.008)
    grafite.add(brilho)
  }
  // zigue-zague laranja em cima
  for (let k = 0; k < 4; k++) {
    const z = rbox(0.17, 0.055, 0.015, 0.02, LARANJA_GRAF, { roughness: 0.6 })
    z.position.set(-0.22 + k * 0.145, 0.52 + (k % 2) * 0.07, 0.01)
    z.rotation.z = k % 2 === 0 ? 0.45 : -0.45
    grafite.add(z)
  }
  // contorno laranja + escorridos
  const contorno = rbox(0.6, 0.05, 0.015, 0.02, LARANJA_GRAF, { roughness: 0.6 })
  contorno.position.set(0, -0.5, 0.01)
  contorno.rotation.z = -0.12
  grafite.add(contorno)
  for (const dx of [-0.14, 0.06, 0.2]) {
    const pingo = capsule(0.018, 0.08 + rand() * 0.1, VERDE_GRAF, { roughness: 0.6 })
    pingo.position.set(dx, -0.62 - rand() * 0.05, 0.008)
    pingo.scale.z = 0.4
    grafite.add(pingo)
  }
  root.add(grafite)

  // ---- carrinho prateado de loja de móveis (tombado) ----------------------
  const carrinho = new THREE.Group()
  carrinho.rotation.order = 'YXZ'
  carrinho.position.set(CART_X, GY + 0.28, CART_Z)
  carrinho.rotation.set(-Math.PI / 2, CART_RY, 0)

  const plataforma = rbox(1.0, 0.05, 0.55, 0.02, METAL, { roughness: 0.3, metalness: 0.75 })
  plataforma.position.y = 0.15
  carrinho.add(plataforma)
  const tapete = rbox(0.92, 0.012, 0.47, 0.005, '#4a4e55', { roughness: 0.9 })
  tapete.position.y = 0.18
  carrinho.add(tapete)
  for (const wx of [-0.38, 0.38]) {
    for (const wz of [-0.21, 0.21]) {
      const garfo = rbox(0.05, 0.06, 0.07, 0.01, METAL, { roughness: 0.3, metalness: 0.75 })
      garfo.position.set(wx, 0.1, wz)
      carrinho.add(garfo)
      const roda = cylinder(0.06, 0.06, 0.045, BORRACHA, { roughness: 0.7 })
      roda.rotation.x = Math.PI / 2
      roda.position.set(wx, 0.06, wz)
      carrinho.add(roda)
      const cubo = cylinder(0.025, 0.025, 0.05, METAL, { roughness: 0.3, metalness: 0.75 })
      cubo.rotation.x = Math.PI / 2
      cubo.position.set(wx, 0.06, wz)
      carrinho.add(cubo)
    }
  }
  // alça em U numa ponta
  for (const hz of [-0.23, 0.23]) {
    const haste = cylinder(0.022, 0.022, 0.78, METAL, { roughness: 0.3, metalness: 0.75 })
    haste.position.set(0.47, 0.56, hz)
    carrinho.add(haste)
  }
  const barra = cylinder(0.026, 0.026, 0.5, METAL, { roughness: 0.3, metalness: 0.75 })
  barra.rotation.x = Math.PI / 2
  barra.position.set(0.47, 0.95, 0)
  carrinho.add(barra)
  const punho = cylinder(0.034, 0.034, 0.3, '#3a6fb5', { roughness: 0.6 })
  punho.rotation.x = Math.PI / 2
  punho.position.set(0.47, 0.95, 0)
  carrinho.add(punho)
  root.add(carrinho)

  // ---- caixa de papelão da estante desmontada ------------------------------
  const caixa = new THREE.Group()
  caixa.position.set(TX, BOX_TOP_Y, TZ)
  caixa.rotation.set(BOX_TILT, TRY, 0)

  const papelao = rbox(BOX_L, BOX_H, BOX_W, 0.025, PAPELAO, { roughness: 0.85 })
  caixa.add(papelao)
  // abas/bordas mais escuras nas pontas
  for (const side of [-1, 1]) {
    const ponta = rbox(0.05, BOX_H + 0.008, BOX_W + 0.008, 0.02, PAPELAO_ESC, { roughness: 0.85 })
    ponta.position.x = side * (BOX_L / 2 - 0.12)
    caixa.add(ponta)
  }
  // fita adesiva ao longo do comprimento (em cima e embaixo) e virando na frente
  for (const fy of [BOX_H / 2 + 0.003, -BOX_H / 2 - 0.003]) {
    const fita = rbox(BOX_L - 0.02, 0.008, 0.09, 0.003, FITA, { roughness: 0.35 })
    fita.position.y = fy
    caixa.add(fita)
  }
  for (const side of [-1, 1]) {
    const fitaPonta = rbox(0.008, BOX_H - 0.01, 0.09, 0.003, FITA, { roughness: 0.35 })
    fitaPonta.position.x = side * (BOX_L / 2 + 0.003)
    caixa.add(fitaPonta)
  }
  // etiqueta branca com código de barras na face da frente
  const etiqueta = rbox(0.34, 0.12, 0.01, 0.004, ETIQUETA, { roughness: 0.6 })
  etiqueta.position.set(0.42, 0, BOX_W / 2 + 0.004)
  caixa.add(etiqueta)
  for (let i = 0; i < 9; i++) {
    const w = i % 3 === 0 ? 0.014 : 0.007
    const barrinha = rbox(w, 0.075, 0.006, 0.002, '#2b2622', { roughness: 0.6 })
    barrinha.position.set(0.3 + i * 0.022, -0.005, BOX_W / 2 + 0.01)
    caixa.add(barrinha)
  }
  // pictograma de estante (marrom escuro) na frente
  const picto = new THREE.Group()
  picto.position.set(-0.4, 0, BOX_W / 2 + 0.006)
  for (const px of [-0.1, 0.1]) {
    const lado = rbox(0.018, 0.13, 0.006, 0.003, '#5a3d22', { roughness: 0.7 })
    lado.position.x = px
    picto.add(lado)
  }
  for (const py of [-0.055, 0, 0.055]) {
    const prat = rbox(0.2, 0.014, 0.006, 0.003, '#5a3d22', { roughness: 0.7 })
    prat.position.y = py
    picto.add(prat)
  }
  caixa.add(picto)
  root.add(caixa)

  // ---- TROLL ---------------------------------------------------------------
  const troll = new THREE.Group()
  troll.position.set(TX, GY, TZ)
  troll.rotation.y = TRY
  root.add(troll)

  for (const side of [-1, 1]) {
    // pés enormes e descalços
    const pe = sphere(0.24, TROLL_ESC, { roughness: 0.85 })
    pe.scale.set(0.95, 0.5, 1.4)
    pe.position.set(side * 0.3, 0.11, 0.12)
    troll.add(pe)
    for (let d = 0; d < 3; d++) {
      const r = d === 0 ? 0.1 : 0.072
      const dedo = sphere(r, TROLL_ESC, { roughness: 0.85 })
      dedo.position.set(side * (0.2 + d * 0.11), r * 0.9, 0.42 - d * 0.04)
      troll.add(dedo)
    }
    // pernas curtas e grossas
    troll.add(segment([side * 0.28, 0.2, 0.04], [side * 0.27, 0.78, 0], 0.19, TROLL, { roughness: 0.85 }))
    // ombros
    const ombro = sphere(0.22, TROLL, { roughness: 0.85 })
    ombro.position.set(side * 0.6, 1.68, 0)
    troll.add(ombro)
  }

  const quadril = sphere(0.55, TROLL, { roughness: 0.85 })
  quadril.scale.set(1.05, 0.85, 0.9)
  quadril.position.y = 0.92
  troll.add(quadril)

  const barriga = sphere(0.56, TROLL_CLARO, { roughness: 0.85 })
  barriga.scale.set(1, 0.95, 0.95)
  barriga.position.set(0, 1.15, 0.14)
  troll.add(barriga)

  const peito = sphere(0.5, TROLL, { roughness: 0.85 })
  peito.scale.set(1.3, 0.85, 0.85)
  peito.position.set(0, 1.6, -0.03)
  troll.add(peito)

  const umbigo = sphere(0.045, TROLL_ESC, { roughness: 0.9 })
  umbigo.position.set(0, 1.08, 0.66)
  troll.add(umbigo)

  // colete de pele marrom: dois painéis abertos na frente + costas
  for (const side of [-1, 1]) {
    const painel = sphere(0.42, PELE, { roughness: 0.95 })
    painel.scale.set(0.72, 1.05, 0.72)
    painel.position.set(side * 0.42, 1.48, 0.1)
    troll.add(painel)
    const barra = puff(0.11, PELE_ESC, 4, 80 + side, { roughness: 0.95 })
    barra.position.set(side * 0.48, 1.06, 0.26)
    troll.add(barra)
  }
  const costas = sphere(0.52, PELE, { roughness: 0.95 })
  costas.scale.set(1.25, 0.95, 0.7)
  costas.position.set(0, 1.48, -0.22)
  troll.add(costas)

  const pescoco = segment([0, 1.75, 0], [0, 1.98, 0.03], 0.2, TROLL, { roughness: 0.85 })
  troll.add(pescoco)

  // ---- cabeça: narigão torto, olhinhos, orelhonas, musgo -------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 2.04, 0.05)
  cabeca.rotation.set(-0.1, 0.22, 0)
  troll.add(cabeca)

  const cranio = sphere(0.33, TROLL, { roughness: 0.85 })
  cranio.scale.set(1, 0.95, 0.95)
  cabeca.add(cranio)

  const mandibula = sphere(0.24, TROLL, { roughness: 0.85 })
  mandibula.scale.set(1.25, 0.75, 0.95)
  mandibula.position.set(0, -0.17, 0.12)
  cabeca.add(mandibula)

  const testa = segment([-0.17, 0.12, 0.24], [0.17, 0.12, 0.24], 0.065, TROLL_ESC, { roughness: 0.85 })
  cabeca.add(testa)

  // narigão comprido, quebrado pro lado, com batata na ponta
  cabeca.add(segment([0, 0.03, 0.28], [0.03, -0.05, 0.5], 0.075, TROLL_CLARO, { roughness: 0.8 }))
  cabeca.add(segment([0.03, -0.05, 0.5], [0.12, -0.13, 0.6], 0.07, TROLL_CLARO, { roughness: 0.8 }))
  const batata = sphere(0.105, TROLL_CLARO, { roughness: 0.8 })
  batata.position.set(0.14, -0.17, 0.63)
  cabeca.add(batata)
  const verruga = sphere(0.03, TROLL_ESC, { roughness: 0.8 })
  verruga.position.set(0.04, -0.02, 0.5)
  cabeca.add(verruga)

  // boca torta com presas
  const boca = sphere(0.12, '#3a2427', { roughness: 0.5 })
  boca.scale.set(1.5, 0.42, 0.55)
  boca.position.set(-0.06, -0.24, 0.3)
  cabeca.add(boca)

  for (const side of [-1, 1]) {
    const presa = cone(0.028, 0.08, MARFIM, { roughness: 0.35 })
    presa.position.set(-0.06 + side * 0.1, -0.2, 0.33)
    cabeca.add(presa)

    const olho = sphere(0.052, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.11, 0.05, 0.28)
    olho.scale.z = 0.6
    const pupila = sphere(0.028, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.11 + 0.012, 0.055, 0.312)
    cabeca.add(olho, pupila)

    // orelhonas abertas pros lados
    const orelha = sphere(0.17, TROLL, { roughness: 0.85 })
    orelha.scale.set(0.3, 1, 0.62)
    orelha.position.set(side * 0.37, 0.04, -0.02)
    orelha.rotation.z = -side * 0.75
    cabeca.add(orelha)
    const dentro = sphere(0.11, '#9a8b80', { roughness: 0.85 })
    dentro.scale.set(0.2, 1, 0.5)
    dentro.position.set(side * 0.4, 0.05, 0.04)
    dentro.rotation.z = -side * 0.75
    cabeca.add(dentro)
  }

  // cabelo de musgo verde espetado
  const musgo = puff(0.17, MUSGO, 7, 91, { roughness: 0.95 })
  musgo.position.set(0, 0.25, -0.05)
  musgo.scale.set(1.2, 0.8, 1.1)
  cabeca.add(musgo)
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.3
    const espeto = cone(0.055, 0.2, k % 2 ? MUSGO_CLARO : MUSGO, { roughness: 0.95 })
    espeto.position.set(Math.cos(a) * 0.15, 0.36, Math.sin(a) * 0.13 - 0.05)
    espeto.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6)
    cabeca.add(espeto)
  }

  // ---- braços erguidos (pivô no ombro: giram juntos em x) ------------------
  const bracos = new THREE.Group()
  bracos.position.set(0, 1.7, 0)
  troll.add(bracos)

  for (const side of [-1, 1]) {
    bracos.add(segment([side * 0.62, 0, 0], [side * 0.8, 0.44, 0.04], 0.15, TROLL, { roughness: 0.85 }))
    bracos.add(segment([side * 0.8, 0.44, 0.04], [side * 0.68, 0.8, 0.02], 0.14, TROLL, { roughness: 0.85 }))
    const mao = sphere(0.15, TROLL_ESC, { roughness: 0.85 })
    mao.scale.set(1.1, 0.7, 1.15)
    mao.position.set(side * 0.66, 0.86, 0.02)
    bracos.add(mao)
    // dedos curvados por cima da borda da frente da caixa
    for (let d = 0; d < 3; d++) {
      const dedo = capsule(0.042, 0.07, TROLL_ESC, { roughness: 0.85 })
      dedo.position.set(side * (0.58 + d * 0.075), 0.93, 0.21)
      dedo.rotation.x = 0.5
      bracos.add(dedo)
    }
  }

  // ---- rabo comprido com tufo ---------------------------------------------
  const rabo = new THREE.Group()
  troll.add(rabo)
  const pts: [number, number, number][] = [
    [0.05, 0.85, -0.5], [0.3, 0.5, -0.72], [0.62, 0.22, -0.72],
    [0.95, 0.13, -0.5], [1.18, 0.16, -0.18], [1.26, 0.34, 0.04],
  ]
  for (let i = 0; i < pts.length - 1; i++) {
    const r = 0.075 - i * 0.006
    rabo.add(segment(pts[i], pts[i + 1], r, TROLL, { roughness: 0.85 }))
  }
  const tufo = puff(0.12, PELE_ESC, 6, 97, { roughness: 0.95 })
  tufo.position.set(1.27, 0.44, 0.06)
  rabo.add(tufo)

  // ---- arcos brancos do eco ------------------------------------------------
  const ecos = new THREE.Group()
  ecos.position.set(BALAO[0], BALAO[1], -0.6)
  const ARC = (100 * Math.PI) / 180
  for (const [i, r] of [0.58, 0.74, 0.9].entries()) {
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.032 - i * 0.004, 12, 48, ARC),
      mat(BRANCO, { roughness: 0.4, size: r * 2 }),
    )
    arco.castShadow = true
    arco.rotation.z = Math.PI / 2 - ARC / 2
    ecos.add(arco)
    for (const ang of [Math.PI / 2 - ARC / 2, Math.PI / 2 + ARC / 2]) {
      const ponta = sphere(0.032 - i * 0.004, BRANCO, { roughness: 0.4 }, 12)
      ponta.position.set(Math.cos(ang) * r, Math.sin(ang) * r, 0)
      ecos.add(ponta)
    }
  }
  root.add(ecos)

  // ---- balão BÉRA saindo do fundo -----------------------------------------
  const balao = new THREE.Group()
  balao.position.set(...BALAO)
  balao.rotation.y = -0.07

  const placa = rbox(0.98, 0.48, 0.1, 0.16, BRANCO, { roughness: 0.5 })
  balao.add(placa)
  const rabicho = cone(0.09, 0.32, BRANCO, { roughness: 0.5 }, 24)
  rabicho.scale.z = 0.45
  rabicho.position.set(0.24, -0.33, -0.04)
  rabicho.rotation.z = Math.PI - 0.5
  balao.add(rabicho)

  const palavra: ['B' | 'E' | 'R' | 'A', number][] = [['B', -0.29], ['E', -0.09], ['R', 0.1], ['A', 0.3]]
  for (const [l, lx] of palavra) {
    const g = letter(l)
    g.position.set(lx, -0.025, 0.06)
    balao.add(g)
  }
  root.add(balao)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'calcada', group: 'viaduto', object: base },
    { name: 'viaduto', group: 'viaduto', object: viaduto },
    { name: 'grafite', group: 'viaduto', object: grafite },
    { name: 'carrinho', group: 'caixa', object: carrinho },
    { name: 'caixa', group: 'caixa', object: caixa },
    { name: 'troll', group: 'troll', object: troll },
    { name: 'cabeca', group: 'troll', object: cabeca },
    { name: 'bracos', group: 'troll', object: bracos },
    { name: 'rabo', group: 'troll', object: rabo },
    { name: 'ecos', group: 'eco', object: ecos },
    { name: 'balao', group: 'eco', object: balao },
  ]

  // ---- montagem ------------------------------------------------------------
  const CART_IN_Y = GY
  const BOX_ON_CART_Y = GY + 0.18 + BOX_H / 2
  const BOX_FLOOR: [number, number, number] = [-0.72, GY + BOX_H / 2, 1.35]
  const ARMS_DOWN = 2.85

  const build = [
    seq('calcada-sobe', 'calcada', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Sábado, saindo da loja de móveis: o caminho até o ônibus passa debaixo de um viaduto de concreto.',
    }),
    seq('viaduto-sobe', 'viaduto', 0.4, 1.0, [riseFrom(0, 3.6)], { ease: 'easeOut' }),
    seq('grafite-pinta', 'grafite', 1.4, 0.5, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    // carrinho entra pela esquerda com a caixa em cima
    seq('carrinho-entra', 'carrinho', 2.4, 1.0, [
      ch('position.x', -3.6, CART_X),
      ch('position.y', CART_IN_Y, CART_IN_Y),
      ch('rotation.x', 0, 0),
    ], {
      ease: 'easeOut',
      caption: 'Você vem com a caixa de uma estante de dois metros, ombros esmagados, e solta o socorro com eco: CAN-DU… IÉL-PA… M\'ÊI!',
    }),
    seq('caixa-entra', 'caixa', 2.4, 1.0, [
      ch('position.x', -3.6, CART_X),
      ch('position.y', BOX_ON_CART_Y, BOX_ON_CART_Y),
      ch('position.z', CART_Z, CART_Z),
      ch('rotation.y', CART_RY, CART_RY),
      ch('rotation.x', 0, 0),
    ], { ease: 'easeOut' }),
    // o carrinho tomba e a caixa escorrega pro chão
    seq('carrinho-tomba', 'carrinho', 3.6, 0.5, [
      ch('rotation.x', 0, -Math.PI / 2),
      ch('position.y', CART_IN_Y, GY + 0.28),
    ], { ease: 'easeIn' }),
    seq('caixa-cai', 'caixa', 3.6, 0.5, [
      ch('position.x', CART_X, BOX_FLOOR[0]),
      ch('position.y', BOX_ON_CART_Y, BOX_FLOOR[1]),
      ch('position.z', CART_Z, BOX_FLOOR[2]),
      ch('rotation.y', CART_RY, 0.12),
    ], { ease: 'easeIn' }),

    // o troll sai da sombra
    seq('troll-sobe', 'troll', 4.7, 1.0, [riseFrom(GY, 2.8)], {
      ease: 'easeOut',
      caption: 'Da sombra do pilar sai um TROLL — narigão torto, cabelo de musgo — e trava a passagem.',
    }),
    seq('bracos-pendem', 'bracos', 4.7, 1.0, [ch('rotation.x', ARMS_DOWN, ARMS_DOWN)]),
    seq('cabeca-sobe', 'cabeca', 5.1, 0.7, [ch('position.y', 1.3, 2.04)], { ease: 'easeOut' }),
    seq('rabo-cresce', 'rabo', 5.5, 0.7, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),

    // eco: o concreto engole o LI
    seq('ecos-abrem', 'ecos', 6.9, 0.7, [
      ch('scale.x', 0.2, 1), ch('scale.y', 0.2, 1), ch('scale.z', 0.2, 1),
    ], {
      ease: 'easeOut',
      caption: 'Você berra "Ah, LIBERA!" — e o eco do concreto, que só devolve o fim das palavras, engole o LI…',
    }),
    seq('balao-salta', 'balao', 7.9, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('position.z', -1.0, BALAO[2]),
    ], {
      ease: 'easeOut',
      caption: '…e do fundo do viaduto volta só: A… BÉRA!… BÉRA!',
    }),

    // o troll ergue a caixa acima da cabeça
    seq('bracos-erguem', 'bracos', 9.3, 0.9, [ch('rotation.x', ARMS_DOWN, 0)], {
      ease: 'easeInOut',
      caption: 'Encantado com o eco, o troll arranca a caixa e ergue acima da cabeça como se fosse uma pena.',
    }),
    seq('caixa-sobe', 'caixa', 9.3, 0.9, [
      ch('position.x', BOX_FLOOR[0], TX),
      ch('position.y', BOX_FLOOR[1], BOX_TOP_Y + 0.08),
      ch('position.z', BOX_FLOOR[2], TZ),
      ch('rotation.y', 0.12, TRY),
      ch('rotation.x', 0, BOX_TILT),
    ], { ease: 'easeInOut' }),
    seq('cabeca-olha', 'cabeca', 9.3, 0.9, [ch('rotation.x', 0.25, -0.1)], { ease: 'easeInOut' }),
    seq('caixa-assenta', 'caixa', 10.6, 0.4, [ch('position.y', BOX_TOP_Y + 0.08, BOX_TOP_Y)], {
      ease: 'easeOut',
      caption: 'Kan du hjälpa mig att bära? — Você pode me ajudar a carregar?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 2.6, 6.6], target: [0.05, 1.72, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-du-hjalpa-mig-att-bara',
    contexto:
      "Pedindo ajuda: na saída da loja de móveis com a caixa da estante, na escada do prédio com o sofá entalado, no dia da mudança, no mercado com sacolas demais — pra vizinho, colega ou alguém na rua. A resposta costuma vir rápida: 'Absolut!', 'Klart!' (claro!).",
    fraseFonte: 'Você pode me ajudar a carregar?',
    fraseAlvo: 'Kan du hjälpa mig att bära?',
    pronuncia:
      "kan dü IÉL-pa mêi a BÉÉ-ra? ('kan' como em 'cana', sem nasal; 'du' com Ü de bico: lábios de U e língua de I; 'hjälpa' começa com I de IOGA — o H não soa —, É aberto, L de verdade, com a língua no céu da boca, e o -pa fraquinho; 'mig' na fala é mêi, uma sílaba só; 'att' antes de verbo encolhe num 'a' rápido, sem o T (muito sueco diz 'ó', igual ao 'och' — as duas formas passam); 'bära' com a força no BÄ: É BEM ABERTO e longo, quase puxando pra A, R de um toque só, de 'cara', e o -a final fraco)",
    ponteSonora:
      "CAN-DU, IÉL-PA M'ÊI... A, (li)BÉRA? (8 sílabas: kan-dü-IÉL-pa-mêi-a-BÉÉ-ra; tônicas em IÉL e, a maior, em BÉ; CAN-DU IÉL-PA M'ÊI é o MESMO pedido de socorro de 'Kan du hjälpa mig?', o iodel com eco: CAN-DU com C+A+N de 'cana', sem o glide de 'quando', e o DU com BICO DE PATO (Ü); IÉL com I de IOGA — o H de 'hjälp' não soa, e com RR carioca vira outra coisa —, É aberto e L DE VERDADE, língua no céu da boca, nunca 'iéu'; o -PA fraquinho; M'ÊI numa sílaba só, a MEIA sem o -A, nunca 'mêia'; A = o 'att' antes do verbo, o MESMO 'a' rápido e sem força de A DRÍCA ('Vill du ha något att dricka?'), A... SÔÔ-VA ('Dags att sova!') e A IÔ-RA ('Jag har mycket att göra'): sem T e colado no BÉ (muito sueco diz 'ó' no lugar, e também passa); (li)BÉRA = LIBERA sem o LI, que o eco embaixo do viaduto engoliu: a força no BÉ, É BEM ABERTO de 'pé' e LONGO — antes de R o ä sueco abre quase até A —, R de UM toque só, de 'cara' (nunca o RR soprado de 'berra', que vira h), e o -a fraquinho; ATENÇÃO: com A no lugar do É sai 'bara' (só), a BARRA de chocolate de 'Jag tittar bara'; e o B é de BOCA fechada, nunca o V da VERA de 'Tyvärr kan jag inte' nem da VARA de 'var')",
    historia:
      "Sábado na loja de móveis: você sai com a caixa de uma estante desmontada de dois metros, e o único caminho até o ônibus passa por baixo do viaduto onde mora um TROLL. Com os ombros esmagados, você solta o pedido de socorro de sempre, o iodel com eco: CAN-DU... IÉL-PA... M'ÊI! O troll sai da sombra do pilar — narigão torto, cabelo de musgo, rabo de tufo — e trava a passagem: debaixo de viaduto de troll não passa ninguém. Você berra 'Ah, LIBERA!', e o eco do concreto, que só devolve o fim das palavras, engole o LI: 'A... BÉRA!... BÉRA!' O troll se encanta com o eco, arranca a caixa das suas costas, ergue acima da cabeça como se fosse uma pena e sai andando com ela: pode me ajudar a carregar?",
  },
  createScene,
  refine: { organic: ['troll', 'cabeca', 'bracos', 'rabo'] },
}

export default card
