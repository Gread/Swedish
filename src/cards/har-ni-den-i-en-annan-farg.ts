import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'

/**
 * "Har ni den i en annan färg?" — RRÁR-NI DÊ-NI EN... ÁN-NAN! FÉRI(as)?
 *
 * Véspera das FÉRIAS: um DÁLMATA de pé, de mala de rodinhas laranja, vestiu a
 * jaqueta de DENIM da vitrine — quase branca, de bolinhas pretas igualzinhas
 * ao pelo dele: ele some dentro dela. Rosnando RRÁR!, espreme a bisnaga de
 * ÁRNICA na manga para pintá-la de OUTRA cor (só sai uma lambança amarela),
 * ergue UM dedo (EN), balança a cabeça — ÁN-NAN! — e a mala diz FÉRIAS.
 *
 * Acento saturado reservado à MALA laranja das FÉRIAS; as jaquetas do
 * cabideiro (vermelha, azul, verde) são as "outras cores", em tom apagado.
 */

const PISO = '#dcc39b'
const PISO_LINHA = '#c2a479'
const SOCO = '#8f7558'
const TAPETE = '#aeb8c1'
const CROMO = '#c9ced4'
const PELO = '#f3f1ec'
const PINTA = '#1c1c1f'
const FOCINHO = '#e8e3da'
const BOCA = '#4a1c24'
const DENTE = '#fbf8ee'
const JEANS = '#dfe4ea' // denim desbotado quase branco
const JEANS_ESC = '#c6cdd7'
const COSTURA = '#e5822a'
const COBRE = '#b8693a'
const POMADA = '#f0c43a'
const POMADA_CLARA = '#f7da72'
const TUBO = '#f5f3ee'
const TAMPA = '#3f8f4e'
const MALA = '#f07a12' // acento saturado: a mala das FÉRIAS
const MALA_ESC = '#c95f0a'
const BORRACHA = '#2b2b2e'
const LETRA = '#22314a'
const LENTE = '#161b24'

const FY = 0.14 // topo do piso
const HEAD: [number, number, number] = [0, 2.38, 0.12]
const HEAD_TILT = 0.1 // inclinação final da cabeça (para a mala)

const UP = new THREE.Vector3(0, 1, 0)
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b (membros, mangas, cauda): orienta pelo vetor. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = { roughness: 0.88 }) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.clone().normalize())
  return m
}

/** Pinta achatada assentada na superfície (ponto + normal). */
function spot(at: THREE.Vector3, normal: THREE.Vector3, r: number, color = PINTA, flat = 0.28) {
  const n = normal.clone().normalize()
  const m = sphere(r, color, { roughness: 0.75 })
  m.quaternion.setFromUnitVectors(UP, n)
  m.scale.y = flat
  m.position.copy(at).addScaledVector(n, -0.004)
  return m
}

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.022, 0.006, LETRA, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  s.castShadow = false // sombra das letras na mala parecia um eco do texto
  return s
}

/** F É R I A S — letras de traço grosso, ~0.14 de altura. */
function letter(which: 'F' | 'É' | 'R' | 'I' | 'A' | 'S') {
  const g = new THREE.Group()
  const t = 0.028
  const h = 0.14
  const w = 0.088
  const L = -w / 2 + t / 2
  if (which === 'F') {
    g.add(stroke(t, h, L, 0))
    g.add(stroke(w, t, 0, h / 2 - t / 2))
    g.add(stroke(w * 0.75, t, -w * 0.125, 0.004))
  } else if (which === 'É') {
    g.add(stroke(t, h, L, 0))
    g.add(stroke(w, t, 0, h / 2 - t / 2))
    g.add(stroke(w * 0.8, t, -w * 0.1, 0))
    g.add(stroke(w, t, 0, -h / 2 + t / 2))
    g.add(stroke(0.022, 0.055, 0.012, h / 2 + 0.045, -0.75))
  } else if (which === 'R') {
    g.add(stroke(t, h, L, 0))
    g.add(stroke(w - 0.008, t, -0.004, h / 2 - t / 2))
    g.add(stroke(w - 0.008, t, -0.004, 0.006))
    g.add(stroke(t, h / 2, w / 2 - t / 2, h / 4))
    g.add(stroke(t, 0.085, 0.02, -0.04, 0.5))
  } else if (which === 'I') {
    g.add(stroke(t, h, 0, 0))
    g.add(stroke(w * 0.6, t * 0.8, 0, h / 2 - t * 0.4))
    g.add(stroke(w * 0.6, t * 0.8, 0, -h / 2 + t * 0.4))
  } else if (which === 'A') {
    g.add(stroke(t, h + 0.01, -0.024, 0, -0.32))
    g.add(stroke(t, h + 0.01, 0.024, 0, 0.32))
    g.add(stroke(0.056, t * 0.85, 0, -0.022))
  } else {
    g.add(stroke(w, t, 0, h / 2 - t / 2))
    g.add(stroke(w, t, 0, 0))
    g.add(stroke(w, t, 0, -h / 2 + t / 2))
    g.add(stroke(t, h / 2, L, h / 4))
    g.add(stroke(t, h / 2, -L, -h / 4))
  }
  return g
}

/** Jaquetinha pendurada no cabideiro (perfil torneado achatado + mangas). */
function hangingJacket(color: string, dark: string) {
  const g = new THREE.Group()
  const corpo = lathe(
    [[0, 0], [0.25, 0], [0.265, 0.06], [0.27, 0.4], [0.25, 0.58], [0.17, 0.68], [0.08, 0.7], [0, 0.7]],
    color,
    { roughness: 0.85 },
  )
  corpo.scale.z = 0.34
  g.add(corpo)
  const barra = cylinder(0.275, 0.275, 0.07, dark, { roughness: 0.85 })
  barra.scale.z = 0.36
  barra.position.y = 0.04
  g.add(barra)
  for (const side of [-1, 1]) {
    g.add(limb(v(side * 0.24, 0.58, 0), v(side * 0.3, 0.1, 0.01), 0.065, color, { roughness: 0.85 }))
    const lapela = rbox(0.09, 0.16, 0.02, 0.012, dark, { roughness: 0.85 })
    lapela.position.set(side * 0.06, 0.58, 0.085)
    lapela.rotation.z = side * 0.5
    g.add(lapela)
  }
  for (const by of [0.48, 0.34, 0.2]) {
    const botao = cylinder(0.017, 0.017, 0.012, '#e8e2d4', { roughness: 0.4 })
    botao.rotation.x = Math.PI / 2
    botao.position.set(0, by, 0.094)
    g.add(botao)
  }
  // cabide: barra + gancho
  const cabide = rbox(0.44, 0.025, 0.025, 0.01, '#8a6a4a', { roughness: 0.5 })
  cabide.position.y = 0.66
  g.add(cabide)
  const gancho = torus(0.045, 0.008, CROMO, { roughness: 0.2, metalness: 0.9 })
  gancho.position.y = 0.73
  g.add(gancho)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- loja: piso de tábuas claras ------------------------------------------
  const base = new THREE.Group()

  const soco = cylinder(2.62, 2.7, 0.09, SOCO, { roughness: 0.8 })
  soco.position.y = 0.045
  base.add(soco)

  const piso = cylinder(2.56, 2.6, 0.05, PISO, { roughness: 0.6 })
  piso.position.y = FY - 0.025
  base.add(piso)

  for (let i = -3; i <= 3; i++) {
    const x = i * 0.7 + 0.35
    if (Math.abs(x) > 2.45) continue
    const len = 2 * Math.sqrt(2.5 * 2.5 - x * x)
    const fresta = rbox(0.02, 0.01, len, 0.004, PISO_LINHA, { roughness: 0.7 })
    fresta.position.set(x, FY + 0.004, 0)
    base.add(fresta)
  }

  const tapete = cylinder(0.98, 1.0, 0.025, TAPETE, { roughness: 0.92 })
  tapete.position.set(0.15, FY + 0.012, 0.2)
  base.add(tapete)

  // pilha de suéteres dobrados (mais "outras cores") na frente, à direita
  const pilha = new THREE.Group()
  pilha.position.set(1.75, FY, 0.95)
  pilha.rotation.y = -0.35
  const cores = ['#c98a7e', '#8ca7c4', '#9bb88c', '#e3d7bf']
  cores.forEach((cor, k) => {
    const dobrada = rbox(0.46, 0.09, 0.34, 0.035, cor, { roughness: 0.9 })
    dobrada.position.y = 0.045 + k * 0.088
    dobrada.rotation.y = (rand() - 0.5) * 0.25
    pilha.add(dobrada)
  })
  base.add(pilha)

  root.add(base)

  // ---- cabideiro cromado com jaquetas vermelha, azul e verde --------------
  const cabideiro = new THREE.Group()
  cabideiro.position.set(1.5, FY, -1.1)
  cabideiro.rotation.y = -0.42

  for (const sx of [-1, 1]) {
    const poste = cylinder(0.026, 0.026, 1.98, CROMO, { roughness: 0.2, metalness: 0.9 })
    poste.position.set(sx * 0.88, 0.99, 0)
    cabideiro.add(poste)
    const pe = rbox(0.07, 0.045, 0.56, 0.02, CROMO, { roughness: 0.2, metalness: 0.9 })
    pe.position.set(sx * 0.88, 0.05, 0)
    cabideiro.add(pe)
    for (const sz of [-1, 1]) {
      const roda = sphere(0.035, BORRACHA, { roughness: 0.6 })
      roda.position.set(sx * 0.88, 0.03, sz * 0.25)
      cabideiro.add(roda)
    }
  }
  const barraTopo = cylinder(0.024, 0.024, 1.82, CROMO, { roughness: 0.2, metalness: 0.9 })
  barraTopo.rotation.z = Math.PI / 2
  barraTopo.position.y = 1.96
  cabideiro.add(barraTopo)

  const jaquetas: [string, string, number][] = [
    ['#b9473d', '#953a32', -0.52],
    ['#3f69a8', '#33568a', 0.04],
    ['#4f9558', '#3e7846', 0.58],
  ]
  for (const [cor, esc, jx] of jaquetas) {
    const j = hangingJacket(cor, esc)
    j.position.set(jx, 1.2, 0)
    j.rotation.y = (rand() - 0.5) * 0.2
    cabideiro.add(j)
  }
  root.add(cabideiro)

  // ---- mala de rodinhas laranja --------------------------------------------
  const MALA_POS: [number, number, number] = [-1.32, FY, 0.42]
  const mala = new THREE.Group()
  mala.position.set(...MALA_POS)
  mala.rotation.y = 0.38
  root.add(mala)

  const MW = 0.82
  const MH = 1.0
  const MD = 0.4
  const MY = 0.08 + MH / 2
  const casco = rbox(MW, MH, MD, 0.09, MALA, { roughness: 0.32 })
  casco.position.y = MY
  mala.add(casco)
  // zíper: faixa escura em volta do meio da espessura
  const ziper = rbox(MW + 0.012, MH + 0.012, 0.035, 0.09, BORRACHA, { roughness: 0.5 })
  ziper.position.set(0, MY, -0.02)
  mala.add(ziper)
  // frisos verticais do casco rígido
  for (const fx of [-0.27, 0.27]) {
    const friso = rbox(0.05, MH - 0.16, 0.02, 0.012, MALA_ESC, { roughness: 0.35 })
    friso.position.set(fx, MY, MD / 2 + 0.002)
    mala.add(friso)
  }
  // cantoneiras
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const canto = rbox(0.12, 0.12, MD + 0.02, 0.04, BORRACHA, { roughness: 0.55 })
      canto.position.set(sx * (MW / 2 - 0.045), MY + sy * (MH / 2 - 0.045), 0)
      mala.add(canto)
    }
  }
  // rodinhas
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const garfo = rbox(0.07, 0.06, 0.07, 0.02, BORRACHA, { roughness: 0.5 })
      garfo.position.set(sx * (MW / 2 - 0.07), 0.085, sz * (MD / 2 - 0.07))
      mala.add(garfo)
      const roda = cylinder(0.045, 0.045, 0.04, BORRACHA, { roughness: 0.6 })
      roda.rotation.z = Math.PI / 2
      roda.position.set(sx * (MW / 2 - 0.07), 0.045, sz * (MD / 2 - 0.07))
      mala.add(roda)
    }
  }
  // alça telescópica puxada pra cima
  for (const sx of [-1, 1]) {
    const haste = cylinder(0.022, 0.022, 0.62, CROMO, { roughness: 0.2, metalness: 0.9 })
    haste.position.set(sx * 0.2, MY + MH / 2 + 0.29, -0.1)
    mala.add(haste)
  }
  const pega = rbox(0.5, 0.07, 0.08, 0.03, BORRACHA, { roughness: 0.55 })
  pega.position.set(0, MY + MH / 2 + 0.6, -0.1)
  mala.add(pega)
  const alcaTopo = rbox(0.26, 0.05, 0.07, 0.022, BORRACHA, { roughness: 0.55 })
  alcaTopo.position.set(0, MY + MH / 2 + 0.03, 0.08)
  mala.add(alcaTopo)

  // ---- etiqueta FÉRIAS (filha da mala) --------------------------------------
  const ETQ_Y = MY + 0.1
  const etiqueta = new THREE.Group()
  etiqueta.position.set(0, ETQ_Y, MD / 2 + 0.03)
  mala.add(etiqueta)

  const placa = rbox(0.74, 0.25, 0.03, 0.05, '#ffffff', { roughness: 0.45 })
  etiqueta.add(placa)
  const furo = cylinder(0.022, 0.022, 0.034, '#d9d9d9', { roughness: 0.4 })
  furo.rotation.x = Math.PI / 2
  furo.position.set(-0.32, 0.075, 0.002)
  etiqueta.add(furo)
  // tira de couro preta subindo até a alça do topo
  const tira = rbox(0.035, 0.42, 0.012, 0.005, BORRACHA, { roughness: 0.6 })
  tira.position.set(-0.32, 0.29, -0.006)
  etiqueta.add(tira)
  const word: ['F' | 'É' | 'R' | 'I' | 'A' | 'S', number][] = [
    ['F', -0.27], ['É', -0.165], ['R', -0.055], ['I', 0.035], ['A', 0.135], ['S', 0.245],
  ]
  for (const [gl, x] of word) {
    const l = letter(gl)
    l.position.set(x + 0.02, -0.018, 0.018)
    etiqueta.add(l)
  }

  // ---- DÁLMATA de pé --------------------------------------------------------
  const dalmata = new THREE.Group()
  dalmata.position.set(0.05, FY, 0.1)
  root.add(dalmata)

  const torso = capsule(0.44, 0.55, PELO, { roughness: 0.85 })
  torso.position.y = 1.36
  dalmata.add(torso)

  const quadril = sphere(0.42, PELO, { roughness: 0.85 })
  quadril.scale.set(1.12, 0.82, 1.0)
  quadril.position.set(0, 0.8, 0)
  dalmata.add(quadril)

  dalmata.add(limb(v(0, 1.8, 0.0), v(0, 2.22, 0.1), 0.19, PELO))

  for (const side of [-1, 1]) {
    const coxa0 = v(side * 0.25, 0.66, 0.04)
    const joelho = v(side * 0.29, 0.34, 0.15)
    const tornozelo = v(side * 0.3, 0.12, 0.07)
    dalmata.add(limb(coxa0, joelho, 0.17, PELO))
    dalmata.add(limb(joelho, tornozelo, 0.12, PELO))
    const pe = sphere(0.14, PELO, { roughness: 0.85 })
    pe.scale.set(0.95, 0.55, 1.45)
    pe.position.set(side * 0.31, 0.075, 0.2)
    dalmata.add(pe)
    for (let d = -1; d <= 1; d++) {
      const dedo = sphere(0.05, PELO, { roughness: 0.85 })
      dedo.position.set(side * 0.31 + d * 0.075, 0.05, 0.38)
      dalmata.add(dedo)
    }
    // pintas pretas nas coxas e canelas
    dalmata.add(spot(v(side * 0.36, 0.52, 0.22), v(side * 0.5, 0.1, 1), 0.07))
    dalmata.add(spot(v(side * 0.44, 0.44, 0.02), v(side, 0, 0.2), 0.055))
    dalmata.add(spot(v(side * 0.32, 0.24, 0.24), v(side * 0.3, 0, 1), 0.045))
    dalmata.add(spot(v(side * 0.35, 0.09, 0.36), v(side * 0.2, 1, 0.6), 0.035))
  }
  // pintas no quadril (aparece abaixo da barra da jaqueta)
  for (const [px, py, pz, r] of [[-0.28, 0.66, 0.32, 0.06], [0.12, 0.6, 0.36, 0.05], [0.42, 0.78, 0.18, 0.055]] as const) {
    const p = v(px, py, pz)
    dalmata.add(spot(p, p.clone().sub(v(0, 0.8, 0)), r))
  }
  // pintas no pescoço
  dalmata.add(spot(v(0.12, 2.0, 0.2), v(0.6, 0, 1), 0.05))
  dalmata.add(spot(v(-0.15, 2.08, 0.15), v(-0.8, 0, 0.7), 0.04))

  // cauda curva saindo de trás, para o lado
  const cauda = [v(0.18, 0.75, -0.36), v(0.48, 0.86, -0.5), v(0.7, 1.08, -0.5), v(0.8, 1.36, -0.42)]
  for (let k = 0; k < cauda.length - 1; k++) {
    dalmata.add(limb(cauda[k], cauda[k + 1], 0.075 - k * 0.015, PELO))
  }
  dalmata.add(spot(v(0.6, 0.98, -0.44), v(0.3, -0.4, 1), 0.04))
  dalmata.add(spot(v(0.84, 1.3, -0.36), v(0.4, 0, 1), 0.03))

  // ---- cabeça: orelhas pretas caídas, rosnando ------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(...HEAD)
  cabeca.rotation.z = HEAD_TILT
  dalmata.add(cabeca)

  const cranio = sphere(0.32, PELO, { roughness: 0.85 })
  cranio.scale.set(1, 0.94, 0.98)
  cabeca.add(cranio)

  const focinho = sphere(0.2, FOCINHO, { roughness: 0.8 })
  focinho.scale.set(0.85, 0.62, 1.35)
  focinho.position.set(0, -0.07, 0.3)
  cabeca.add(focinho)

  const nariz = sphere(0.068, PINTA, { roughness: 0.3 })
  nariz.scale.set(1.3, 0.85, 1)
  nariz.position.set(0, -0.01, 0.56)
  cabeca.add(nariz)

  // ruga do rosnado no focinho
  for (const dy of [0.05, 0.1]) {
    const ruga = capsule(0.014, 0.12, '#cfc8bd', { roughness: 0.85 })
    ruga.rotation.z = Math.PI / 2
    ruga.position.set(0, dy - 0.04, 0.44 - dy * 0.6)
    cabeca.add(ruga)
  }

  const boca = sphere(0.11, BOCA, { roughness: 0.5 })
  boca.scale.set(1.35, 0.55, 0.7)
  boca.position.set(0, -0.215, 0.43)
  cabeca.add(boca)

  const queixo = sphere(0.12, FOCINHO, { roughness: 0.8 })
  queixo.scale.set(1.08, 0.45, 1.15)
  queixo.position.set(0, -0.3, 0.34)
  cabeca.add(queixo)

  // dentes arreganhados: de cima pra baixo e de baixo pra cima, presas maiores
  for (const [tx, big] of [[-0.1, true], [-0.05, false], [0, false], [0.05, false], [0.1, true]] as const) {
    const zz = 0.505 - Math.abs(tx) * 0.5
    const cima = cone(big ? 0.026 : 0.019, big ? 0.075 : 0.05, DENTE, { roughness: 0.3 })
    cima.rotation.x = Math.PI
    cima.position.set(tx, -0.185, zz)
    cabeca.add(cima)
    const baixo = cone(big ? 0.022 : 0.017, big ? 0.06 : 0.04, DENTE, { roughness: 0.3 })
    baixo.position.set(tx * 0.9, -0.252, zz - 0.02)
    cabeca.add(baixo)
  }

  for (const side of [-1, 1]) {
    const esclera = sphere(0.068, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.13, 0.07, 0.27)
    esclera.scale.z = 0.6
    const pupila = sphere(0.034, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.125, 0.065, 0.305)
    cabeca.add(esclera, pupila)

    // sobrancelha franzida (bravo)
    const sobrancelha = capsule(0.022, 0.12, PINTA, { roughness: 0.8 })
    sobrancelha.position.set(side * 0.13, 0.155, 0.27)
    sobrancelha.rotation.set(0, 0, Math.PI / 2 + side * 0.42)
    cabeca.add(sobrancelha)

    // orelha preta caída
    const orelha = capsule(0.095, 0.2, PINTA, { roughness: 0.8 })
    orelha.scale.set(1, 1, 0.42)
    orelha.position.set(side * 0.31, -0.02, 0.0)
    orelha.rotation.set(0, side * 0.35, side * 0.22)
    cabeca.add(orelha)
  }
  // mancha preta em volta do olho esquerdo e pintas no crânio
  cabeca.add(spot(v(0.15, 0.08, 0.255), v(0.4, 0.1, 1), 0.1, PINTA, 0.22))
  cabeca.add(spot(v(-0.2, 0.17, 0.2), v(-0.6, 0.5, 0.6), 0.05))
  cabeca.add(spot(v(-0.24, -0.08, 0.2), v(-0.8, -0.1, 0.6), 0.04))
  cabeca.add(spot(v(0.08, -0.05, 0.43), v(0.3, 0.3, 1), 0.028))
  cabeca.add(spot(v(-0.09, -0.04, 0.43), v(-0.3, 0.3, 1), 0.024))

  // ---- óculos escuros na testa (filhos da cabeça) ---------------------------
  const OC_Y = 0.25
  const oculos = new THREE.Group()
  oculos.position.set(0, OC_Y, 0.2)
  oculos.rotation.x = -0.6
  cabeca.add(oculos)
  for (const side of [-1, 1]) {
    const aro = rbox(0.18, 0.12, 0.035, 0.045, PINTA, { roughness: 0.35 })
    aro.position.set(side * 0.105, 0, 0)
    oculos.add(aro)
    const lente = rbox(0.15, 0.095, 0.02, 0.04, LENTE, { roughness: 0.08, metalness: 0.4 })
    lente.position.set(side * 0.105, 0, 0.013)
    oculos.add(lente)
    const brilho = rbox(0.03, 0.06, 0.004, 0.002, '#8fa4bf', { roughness: 0.1 })
    brilho.position.set(side * 0.105 - 0.04, 0.005, 0.025)
    brilho.rotation.z = 0.5
    oculos.add(brilho)
    const haste = rbox(0.02, 0.025, 0.3, 0.008, PINTA, { roughness: 0.35 })
    haste.position.set(side * 0.2, 0, -0.15)
    haste.rotation.y = side * -0.25
    oculos.add(haste)
  }
  const ponte = rbox(0.05, 0.022, 0.025, 0.008, PINTA, { roughness: 0.35 })
  ponte.position.y = 0.02
  oculos.add(ponte)

  // ---- JAQUETA de denim quase branca, de bolinhas pretas --------------------
  const jaqueta = new THREE.Group()
  dalmata.add(jaqueta)

  const JZ = 0.8 // achatamento da frente/costas
  const perfil: [number, number][] = [
    [0, 0.82], [0.5, 0.82], [0.535, 0.9], [0.545, 1.2], [0.535, 1.55], [0.5, 1.75], [0.4, 1.88], [0.22, 1.94], [0, 1.94],
  ]
  const corpoJaq = lathe(perfil, JEANS, { roughness: 0.82 })
  corpoJaq.scale.z = JZ
  jaqueta.add(corpoJaq)

  // cós e costura laranja
  const cos = cylinder(0.552, 0.548, 0.11, JEANS_ESC, { roughness: 0.82 })
  cos.scale.z = JZ
  cos.position.y = 0.875
  jaqueta.add(cos)
  const costuraCos = torus(0.556, 0.011, COSTURA, { roughness: 0.6 })
  costuraCos.rotation.x = Math.PI / 2
  costuraCos.scale.y = JZ
  costuraCos.position.y = 0.94
  jaqueta.add(costuraCos)

  // pala do peito: costura laranja grossa em arco
  const pala = new THREE.Mesh(new THREE.TorusGeometry(0.532, 0.013, 10, 40, Math.PI), mat(COSTURA, { roughness: 0.6 }))
  pala.rotation.x = Math.PI / 2
  pala.scale.y = JZ
  pala.position.y = 1.6
  pala.castShadow = true
  jaqueta.add(pala)

  // carcela com botões de cobre e pesponto duplo
  const frente = 0.545 * JZ
  const carcela = rbox(0.08, 1.0, 0.03, 0.012, JEANS_ESC, { roughness: 0.82 })
  carcela.position.set(0, 1.34, frente - 0.002)
  jaqueta.add(carcela)
  for (const sx of [-1, 1]) {
    const pesponto = rbox(0.012, 0.98, 0.01, 0.004, COSTURA, { roughness: 0.6 })
    pesponto.position.set(sx * 0.05, 1.34, frente + 0.012)
    jaqueta.add(pesponto)
  }
  for (const by of [1.72, 1.5, 1.27, 1.04]) {
    const botao = cylinder(0.034, 0.034, 0.022, COBRE, { roughness: 0.3, metalness: 0.75 })
    botao.rotation.x = Math.PI / 2
    botao.position.set(0, by, frente + 0.02)
    jaqueta.add(botao)
  }

  // bolsos do peito com lapela, costura e botão
  for (const side of [-1, 1]) {
    const bx = side * 0.24
    const bz = JZ * Math.sqrt(0.535 * 0.535 - bx * bx)
    const bolso = new THREE.Group()
    bolso.position.set(bx, 1.48, bz + 0.005)
    bolso.rotation.y = side * 0.5
    const aba = rbox(0.21, 0.085, 0.03, 0.02, JEANS_ESC, { roughness: 0.82 })
    bolso.add(aba)
    const fio = rbox(0.2, 0.011, 0.01, 0.004, COSTURA, { roughness: 0.6 })
    fio.position.set(0, -0.025, 0.016)
    bolso.add(fio)
    const bot = cylinder(0.024, 0.024, 0.016, COBRE, { roughness: 0.3, metalness: 0.75 })
    bot.rotation.x = Math.PI / 2
    bot.position.set(0, -0.01, 0.022)
    bolso.add(bot)
    jaqueta.add(bolso)
  }

  // gola levantada: três abas em volta do pescoço
  for (const side of [-1, 1]) {
    const gola = rbox(0.3, 0.26, 0.04, 0.03, JEANS_ESC, { roughness: 0.82 })
    gola.position.set(side * 0.21, 2.0, 0.07)
    gola.rotation.set(-0.1, side * 1.05, side * -0.28)
    jaqueta.add(gola)
    const fio = rbox(0.24, 0.012, 0.01, 0.004, COSTURA, { roughness: 0.6 })
    fio.position.set(side * 0.225, 2.1, 0.09)
    fio.rotation.set(-0.1, side * 1.05, side * -0.28)
    jaqueta.add(fio)
  }
  const golaTras = rbox(0.34, 0.24, 0.04, 0.03, JEANS_ESC, { roughness: 0.82 })
  golaTras.position.set(0, 2.02, -0.16)
  golaTras.rotation.x = -0.25
  jaqueta.add(golaTras)

  // mangas de cima (ombro → cotovelo)
  const S_L = v(0.54, 1.72, 0.02)
  const E_L = v(0.72, 1.27, 0.16)
  const S_R = v(-0.54, 1.72, 0.02)
  const E_R = v(-0.6, 1.28, 0.42)
  for (const [s, e] of [[S_L, E_L], [S_R, E_R]] as const) {
    const ombro = sphere(0.165, JEANS, { roughness: 0.82 })
    ombro.position.copy(s)
    jaqueta.add(ombro)
    jaqueta.add(limb(s, e, 0.145, JEANS, { roughness: 0.82 }))
    const cotovelo = sphere(0.14, JEANS, { roughness: 0.82 })
    cotovelo.position.copy(e)
    jaqueta.add(cotovelo)
  }

  // bolinhas pretas na jaqueta (camuflagem perfeita)
  for (let k = 0; k < 34; k++) {
    const th = (rand() - 0.5) * 2.9
    const y = 0.98 + rand() * 0.82
    if (Math.abs(th) < 0.16) continue // carcela
    if (Math.abs(y - 1.48) < 0.07 && Math.abs(Math.abs(th) - 0.47) < 0.25) continue // bolsos
    const r = y < 1.55 ? 0.545 : 0.545 - (y - 1.55) * 0.25
    const p = v(Math.sin(th) * r, y, Math.cos(th) * r * JZ)
    const n = v(Math.sin(th), 0, Math.cos(th) / JZ)
    jaqueta.add(spot(p, n, 0.032 + rand() * 0.03, PINTA, 0.25))
  }
  for (const [s, e] of [[S_L, E_L], [S_R, E_R]] as const) {
    for (const [t, a] of [[0.3, 0.6], [0.65, -0.5]] as const) {
      const c = s.clone().lerp(e, t)
      const n = v(Math.sin(a) * Math.sign(s.x), 0.1, Math.cos(a))
      jaqueta.add(spot(c.clone().addScaledVector(n.clone().normalize(), 0.145), n, 0.04, PINTA, 0.25))
    }
  }

  // ---- lambança amarela de arnica na manga esquerda (filha da jaqueta) ------
  const P = E_L.clone().lerp(S_L, 0.42)
  const nM = v(-0.42, 0.05, 1).normalize()
  const B = P.clone().addScaledVector(nM, 0.15)
  const mancha = new THREE.Group()
  mancha.position.copy(B)
  mancha.quaternion.setFromUnitVectors(v(0, 0, 1), nM)
  jaqueta.add(mancha)
  const gota = sphere(0.125, POMADA, { roughness: 0.22 })
  gota.scale.set(1.05, 1, 0.5)
  mancha.add(gota)
  const brilhoGota = sphere(0.05, POMADA_CLARA, { roughness: 0.15 })
  brilhoGota.scale.set(1, 0.8, 0.4)
  brilhoGota.position.set(-0.04, 0.045, 0.05)
  mancha.add(brilhoGota)
  for (const [dx, len, r] of [[-0.06, 0.13, 0.032], [0.05, 0.2, 0.026]] as const) {
    const escorrido = capsule(r, len, POMADA, { roughness: 0.22 })
    escorrido.scale.z = 0.6
    escorrido.position.set(dx, -0.09 - len / 2, 0.01)
    mancha.add(escorrido)
  }
  for (const [sx, sy, sr] of [[0.15, 0.08, 0.035], [-0.15, -0.05, 0.028], [0.12, -0.12, 0.022]] as const) {
    const respingo = sphere(sr, POMADA, { roughness: 0.22 })
    respingo.scale.z = 0.5
    respingo.position.set(sx, sy, 0)
    mancha.add(respingo)
  }

  // ---- antebraço DIREITO (cotovelo → pata com a bisnaga) --------------------
  const fD = v(0.6, 0.12, 0.16)
  const pataD = new THREE.Group()
  pataD.position.copy(E_R)
  jaqueta.add(pataD)
  pataD.add(limb(v(0, 0, 0), fD.clone().multiplyScalar(0.78), 0.125, JEANS, { roughness: 0.82 }))
  const punhoD = cylinder(0.14, 0.14, 0.08, JEANS_ESC, { roughness: 0.82 })
  punhoD.position.copy(fD).multiplyScalar(0.8)
  punhoD.quaternion.setFromUnitVectors(UP, fD.clone().normalize())
  pataD.add(punhoD)
  const fioD = torus(0.142, 0.009, COSTURA, { roughness: 0.6 })
  fioD.position.copy(fD).multiplyScalar(0.8)
  fioD.quaternion.setFromUnitVectors(v(0, 0, 1), fD.clone().normalize())
  pataD.add(fioD)
  pataD.add(spot(fD.clone().multiplyScalar(0.4).add(v(0, 0.02, 0.12)), v(0, 0.2, 1), 0.04, PINTA, 0.25))
  const maoD = sphere(0.125, PELO, { roughness: 0.85 })
  maoD.position.copy(fD)
  maoD.scale.set(1.05, 0.95, 0.95)
  pataD.add(maoD)
  pataD.add(spot(fD.clone().add(v(-0.02, 0.06, 0.1)), v(0, 0.5, 1), 0.035))

  // ---- bisnaga de arnica (filha da pata direita) ----------------------------
  const H_R = E_R.clone().add(fD)
  const tubeDir = B.clone().sub(H_R)
  const tubeLen = tubeDir.length() - 0.1
  tubeDir.normalize()
  const bisnaga = new THREE.Group()
  bisnaga.position.copy(fD)
  bisnaga.quaternion.setFromUnitVectors(UP, tubeDir)
  pataD.add(bisnaga)
  const T = tubeLen
  const corpoTubo = lathe(
    [
      [0, -0.12], [0.1, -0.12], [0.094, -0.04], [0.086, 0.06], [0.058, 0.13],
      [0.084, 0.22], [0.08, T - 0.16], [0.056, T - 0.12], [0, T - 0.12],
    ],
    TUBO,
    { roughness: 0.35 },
  )
  corpoTubo.scale.z = 0.7
  bisnaga.add(corpoTubo)
  const dobra = rbox(0.2, 0.04, 0.035, 0.012, '#e3e0d8', { roughness: 0.4 })
  dobra.position.y = -0.13
  bisnaga.add(dobra)
  const faixa = cylinder(0.083, 0.083, 0.09, TAMPA, { roughness: 0.4 })
  faixa.scale.z = 0.72
  faixa.position.y = T * 0.5
  bisnaga.add(faixa)
  const florRot = sphere(0.026, '#f08a24', { roughness: 0.5 })
  florRot.scale.set(1, 1, 0.4)
  florRot.position.set(0, T * 0.5 - 0.08, 0.05)
  bisnaga.add(florRot)
  const tampa = cylinder(0.035, 0.048, 0.07, TAMPA, { roughness: 0.4 })
  tampa.position.y = T - 0.09
  bisnaga.add(tampa)
  const bico = cylinder(0.014, 0.024, 0.05, TAMPA, { roughness: 0.4 })
  bico.position.y = T - 0.03
  bisnaga.add(bico)
  const tampinha = cylinder(0.05, 0.05, 0.018, TAMPA, { roughness: 0.4 })
  tampinha.position.set(0.055, T - 0.06, 0)
  tampinha.rotation.z = -1.3
  bisnaga.add(tampinha)
  const fluxo = capsule(0.022, 0.04, POMADA, { roughness: 0.22 })
  fluxo.position.y = T + 0.02
  bisnaga.add(fluxo)
  // dedos da pata apertando o meio da bisnaga
  for (let d = 0; d < 3; d++) {
    const dedo = sphere(0.045, PELO, { roughness: 0.85 })
    dedo.position.set(-0.03 + d * 0.035, 0.1 + d * 0.04, 0.075)
    bisnaga.add(dedo)
  }

  // ---- antebraço ESQUERDO erguido com UM dedo pra cima ----------------------
  const fE = v(0.2, 0.56, 0.16)
  const pataE = new THREE.Group()
  pataE.position.copy(E_L)
  jaqueta.add(pataE)
  pataE.add(limb(v(0, 0, 0), fE.clone().multiplyScalar(0.78), 0.125, JEANS, { roughness: 0.82 }))
  const punhoE = cylinder(0.14, 0.14, 0.08, JEANS_ESC, { roughness: 0.82 })
  punhoE.position.copy(fE).multiplyScalar(0.8)
  punhoE.quaternion.setFromUnitVectors(UP, fE.clone().normalize())
  pataE.add(punhoE)
  const fioE = torus(0.142, 0.009, COSTURA, { roughness: 0.6 })
  fioE.position.copy(fE).multiplyScalar(0.8)
  fioE.quaternion.setFromUnitVectors(v(0, 0, 1), fE.clone().normalize())
  pataE.add(fioE)
  pataE.add(spot(fE.clone().multiplyScalar(0.42).add(v(0.04, 0, 0.12)), v(0.3, 0, 1), 0.04, PINTA, 0.25))
  const maoE = sphere(0.125, PELO, { roughness: 0.85 })
  maoE.position.copy(fE).add(v(0, 0.02, 0))
  maoE.scale.set(1, 1.05, 0.9)
  pataE.add(maoE)
  // dedos dobrados na frente da pata
  for (let d = -1; d <= 1; d++) {
    const dobrado = sphere(0.045, PELO, { roughness: 0.85 })
    dobrado.position.copy(fE).add(v(d * 0.06 - 0.01, -0.01, 0.1))
    pataE.add(dobrado)
  }
  // o dedo erguido: EN
  const dirDedo = v(0.12, 1, 0.05).normalize()
  const dedoBase = fE.clone().add(v(-0.02, 0.1, 0.02))
  pataE.add(limb(dedoBase, dedoBase.clone().addScaledVector(dirDedo, 0.17), 0.045, PELO, { roughness: 0.85 }))
  const unha = sphere(0.022, PINTA, { roughness: 0.4 })
  unha.position.copy(dedoBase).addScaledVector(dirDedo, 0.2).add(v(0, 0, 0.025))
  pataE.add(unha)
  pataE.add(spot(fE.clone().add(v(0.07, 0.05, 0.06)), v(0.6, 0.3, 0.8), 0.035))

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'loja', object: base },
    { name: 'cabideiro', group: 'loja', object: cabideiro },
    { name: 'mala', group: 'dalmata', object: mala },
    { name: 'dalmata', group: 'dalmata', object: dalmata },
    { name: 'cabeca', group: 'dalmata', object: cabeca },
    { name: 'jaqueta', group: 'denim', object: jaqueta },
    { name: 'pataE', group: 'denim', object: pataE },
    { name: 'pataD', group: 'denim', object: pataD },
    { name: 'oculos', group: 'denim', object: oculos },
    { name: 'bisnaga', group: 'arnica', object: bisnaga },
    { name: 'mancha', group: 'arnica', object: mancha },
    { name: 'etiqueta', group: 'ferias', object: etiqueta },
  ]

  // ---- montagem ------------------------------------------------------------
  const s3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const PATA_E_BAIXO = -2.68
  const PATA_D_BAIXO = -1.6
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Uma loja de roupa: piso de madeira clara e um cabideiro com jaquetas vermelha, azul e verde.',
    }),
    seq('cabideiro-rise', 'cabideiro', 0.3, 0.9, [riseFrom(FY, 2.3)], { ease: 'easeOut' }),

    seq('mala-entra', 'mala', 1.9, 0.8, [riseFrom(FY, 1.3), ch('position.x', -2.1, MALA_POS[0])], {
      ease: 'easeOut',
      caption: 'Véspera das FÉRIAS: chega um DÁLMATA de pé, puxando a mala de rodinhas laranja.',
    }),
    seq('dalmata-rise', 'dalmata', 2.1, 1.0, [riseFrom(FY, 2.9)], { ease: 'easeOut' }),
    seq('cabeca-sobe', 'cabeca', 2.35, 0.7, [ch('position.y', HEAD[1] - 0.6, HEAD[1])], { ease: 'easeOut' }),

    seq('jaqueta-veste', 'jaqueta', 3.9, 0.7, [ch('position.y', 1.9, 0)], {
      ease: 'easeOut',
      caption: 'Ele veste a jaqueta de DENIM da vitrine: branca de bolinhas pretas, igualzinha ao pelo — ele some! DÊ-NI(m).',
    }),
    seq('pataE-veste', 'pataE', 3.9, 0.7, [ch('rotation.z', PATA_E_BAIXO - 0.2, PATA_E_BAIXO)], { ease: 'easeOut' }),
    seq('pataD-veste', 'pataD', 3.9, 0.7, [ch('rotation.z', PATA_D_BAIXO - 0.2, PATA_D_BAIXO)], { ease: 'easeOut' }),
    seq('oculos-cai', 'oculos', 4.7, 0.5, [ch('position.y', OC_Y + 0.7, OC_Y), ch('rotation.x', -2.2, -0.6)], {
      ease: 'easeOut',
    }),

    seq('pataD-ergue', 'pataD', 5.9, 0.6, [ch('rotation.z', PATA_D_BAIXO, 0)], {
      ease: 'easeOut',
      caption: 'Rosnando RRÁR!, ele espreme a bisnaga de ÁRNICA na manga pra pintar a jaqueta de outra cor: RRÁR-NI!',
    }),
    seq('bisnaga-surge', 'bisnaga', 6.0, 0.45, s3(0.01, 1), { ease: 'easeOut' }),
    seq('mancha-espirra', 'mancha', 6.7, 0.5, s3(0.01, 1), { ease: 'easeOut' }),

    seq('pataE-ergue', 'pataE', 8.1, 0.7, [ch('rotation.z', PATA_E_BAIXO, 0)], {
      ease: 'easeOut',
      caption: 'Só sai uma lambança amarela. Ele ergue UM dedo — EN — e balança a cabeça: ÁN-NAN! Essa não!',
    }),
    seq('cabeca-nega-a', 'cabeca', 8.9, 0.25, [ch('rotation.y', 0, 0.35)], { ease: 'easeOut' }),
    seq('cabeca-nega-b', 'cabeca', 9.15, 0.35, [ch('rotation.y', 0.35, -0.35)], { ease: 'easeInOut' }),
    seq('cabeca-nega-c', 'cabeca', 9.5, 0.35, [ch('rotation.y', -0.35, 0.25)], { ease: 'easeInOut' }),
    seq('cabeca-nega-d', 'cabeca', 9.85, 0.3, [ch('rotation.y', 0.25, 0)], { ease: 'easeOut' }),

    seq('etiqueta-surge', 'etiqueta', 10.7, 0.5, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'E aponta a etiqueta da mala: FÉRIAS — FÉRI… FÉRJ! Ele quer em OUTRA cor.',
    }),
    seq('mala-pula', 'mala', 11.25, 0.22, [ch('position.y', FY, FY + 0.12)], { ease: 'easeOut' }),
    seq('mala-pousa', 'mala', 11.47, 0.3, [ch('position.y', FY + 0.12, FY)], { ease: 'easeIn' }),
    seq('cabeca-inclina', 'cabeca', 12.1, 0.5, [ch('rotation.z', 0, HEAD_TILT)], {
      ease: 'easeInOut',
      caption: 'Har ni den i en annan färg? — Vocês têm em outra cor?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.2, 2.25, 5.25], target: [-0.15, 1.48, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'har-ni-den-i-en-annan-farg',
    contexto:
      "Compras: na loja de roupa, de sapato ou de decoração (H&M, Lindex, KappAhl, Åhléns, IKEA), com a peça na mão, pro vendedor. 'Den' vale pra uma peça de palavra en (en tröja, en jacka, en mössa); com palavra ett vira 'det' ('ett skärp' → 'Har ni det i en annan färg?'), e pra calça, que em sueco é plural, 'dem' (falado 'dom').",
    fraseFonte:
      "Vocês têm em outra cor?",
    fraseAlvo:
      "Har ni den i en annan färg?",
    pronuncia:
      "rrar ni den i en ÁN-nan FÉRJ? ('har' com h soprado e R brando — é o R que faz o presente; 'ni' = vocês; 'den i' grudados, den-i, DEN curto e sem nasal; 'en' curto e oral, nunca 'ẽ'; 'annan' com A aberto e ORAL, dois N de verdade, a ponta da língua batendo duas vezes, e a força no primeiro A; 'färg' é UMA sílaba só: É ABERTO e curto, R de um toque, de 'caro', e o G vira um I colado no R depois dele — FÉRJ, nunca 'FÉRG' com G duro; a frase sobe no ÁN e no FÉRJ)",
    ponteSonora:
      "RRÁR-NI DÊ-NI EN... ÁN-NAN! FÉRI(as)? (8 sílabas: rrar-ni-den-i-en-ÁN-nan-FÉRJ; tônicas em ÁN e FÉRJ; RRÁR-NI = a ÁRNIca sem o -ca, a MESMA de 'Har ni den i en annan storlek?', 'Har ni något receptfritt mot det här?' e 'Har ni något vegetariskt?' — aqui o rosnado do dálmata: h SOPRADO na frente e R brando colado no NI, o R do presente 'har'; DÊ-NI = o DENIM da jaqueta SEM o M, o MESMO de 'storlek': 'den i' grudados, DEN curto, N na ponta da língua, sem o 'dẽ' nasal; EN = UM, o dedo erguido, curto e oral; ÁN-NAN = o 'ãn-ãn' de quem balança a cabeça dizendo ESSA NÃO, o MESMO de 'storlek' — mas ORAL: dois N DE VERDADE, a língua batendo duas vezes no céu da boca, A aberto de 'pá', força no primeiro; FÉRI(as) = as FÉRIAS da mala, cortadas antes do -as: É ABERTO e CURTO de 'pé', com a força, R de UM TOQUE, de 'caro' — o mesmo que 'férias' já tem —, e o I vira só um resvalo colado no R, um J de 'iogurte': FÉRJ, UMA sílaba só; é assim que o sueco fala 'färg', o G depois do R vira esse I; nunca 'FÉRG' com G duro, nem 'fé-ri-a' com vogal no fim. ATENÇÃO ao par: 'storlek' é o LEQUE STOR do búfalo; 'färg' é a mala de FÉRIAS do dálmata)",
    historia:
      "Na véspera das FÉRIAS, o dálmata entra na loja puxando a mala de rodinhas e veste a jaqueta de DENIM da vitrine — jeans desbotado quase branco, de costura laranja e botões de cobre, com bolinhas pretas igualzinhas ao pelo dele: ele simplesmente some, e na loja só se vê uma jaqueta andando sozinha. Ele rosna RRÁR! e espreme a bisnaga inteira de ÁRNICA na manga, tentando pintar a jaqueta de outra cor — só sai uma lambança amarela. Então ergue UM dedo, EN, balança a cabeça — ÁN-NAN!, essa não — e aponta pra mala das FÉRIAS: RRÁR-NI DÊ-NI EN ÁN-NAN FÉRI? Vocês têm essa em OUTRA cor?",
  },
  createScene,
  refine: { organic: ['dalmata', 'cabeca'] },
}

export default card
