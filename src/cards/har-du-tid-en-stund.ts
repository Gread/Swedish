import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Har du tid en stund?" — RRÁR-DÜ… parTÍD! EN… STUND(ra)?
 *
 * Linha de PARTIDA de uma corrida de trenó na TUNDRA. O tigre siberiano,
 * de arreio vermelho e trenó carregado de gelo, espera a bandeira — e lá
 * embaixo um ratinho cinza puxa a cauda dele com um mini-rugido (RRÁR!),
 * aponta pra cima (DÜ!), ergue UM dedinho (EN!) e mostra a ampulheta
 * dourada: só um minutinho.
 *
 * Diorama: disco de neve com musgo, faixa quadriculada da largada sob as
 * patas dianteiras, bandeirinha no poste, trenó atrás, placa TUNDRA meio
 * soterrada na frente. O dourado da ampulheta é o único acento saturado.
 */

const NEVE = '#eef3f8'
const NEVE_SOMBRA = '#dce6ef'
const ROCHA = '#56606b'
const MUSGO = '#3f5a3a'
const MUSGO_CLARO = '#56744a'
const LARANJA = '#d9782c'
const BRANCO = '#f4efe6'
const LISTRA = '#221a16'
const ROSA = '#c97b7d'
const VERMELHO = '#a8322b'
const VERMELHO_ESC = '#86251f'
const MEL = '#b8813f'
const MEL_ESC = '#8f6230'
const GELO = '#a9d5ea'
const PRETO = '#1f1f22'
const RATO = '#8c8e95'
const RATO_CLARO = '#d8d2cb'
const RATO_ROSA = '#e2a3a6'
const TABUA = '#7d5737'
const CREME = '#f1e6d0'
const OURO = '#f2b52b' // acento reservado: a AMPULHETA (o minutinho)
const AREIA = '#e9a93a'
const VIDRO = '#e6f0f3'

const GY = 0.15 // topo da neve
const LINHA_X = -0.86 // faixa da largada
const RATO_POS: [number, number, number] = [-0.28, GY + 0.16, 1.18]
const RATO_YAW = -0.2

const CABECA_YAW = 0.85
const CABECA_PITCH = 0.28

/** Barra entre dois pontos (tiras do arreio). */
function tira(a: THREE.Vector3, b: THREE.Vector3, w: number, t: number, color: string) {
  const d = b.clone().sub(a)
  const m = rbox(d.length(), w, t, Math.min(w, t) * 0.45, color, { roughness: 0.6 })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.normalize())
  return m
}

/** Braço-cápsula do rato, do ombro a até a mão b. */
function membro(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.01, d.length() - r), RATO, { roughness: 0.85 })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Listra de tigre: arco de toro no plano yz, centrado no topo. */
function listra(raio: number, tubo: number, arco: number) {
  const g = new THREE.Group()
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(raio, tubo, 10, 28, arco),
    mat(LISTRA, { roughness: 0.75, size: raio * 2 }),
  )
  m.castShadow = true
  m.receiveShadow = true
  m.rotation.z = Math.PI / 2 - arco / 2
  m.scale.z = 0.7
  g.add(m)
  g.rotation.y = Math.PI / 2
  return g
}

/** Traço de letra da placa: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, CREME, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

type Glyph = 'T' | 'U' | 'N' | 'D' | 'R' | 'A'

/** T U N D R A — letras de traço grosso, legíveis a distância de diorama. */
function letter(which: Glyph) {
  const g = new THREE.Group()
  const t = 0.028
  if (which === 'T') {
    g.add(stroke(0.11, t, 0, 0.066))
    g.add(stroke(t, 0.16, 0, -0.006))
  } else if (which === 'U') {
    g.add(stroke(t, 0.14, -0.04, 0.012))
    g.add(stroke(t, 0.14, 0.04, 0.012))
    g.add(stroke(0.1, t, 0, -0.066))
  } else if (which === 'N') {
    g.add(stroke(t, 0.16, -0.04, 0))
    g.add(stroke(t, 0.16, 0.04, 0))
    g.add(stroke(0.024, 0.19, 0, 0, 0.42))
  } else if (which === 'D') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.06, t, -0.014, 0.066))
    g.add(stroke(0.06, t, -0.014, -0.066))
    g.add(stroke(t, 0.09, 0.042, 0))
    g.add(stroke(t, 0.05, 0.026, 0.05, 0.75))
    g.add(stroke(t, 0.05, 0.026, -0.05, -0.75))
  } else if (which === 'R') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.07, t, -0.008, 0.066))
    g.add(stroke(0.07, t, -0.008, 0.006))
    g.add(stroke(t, 0.058, 0.03, 0.036))
    g.add(stroke(t, 0.09, 0.026, -0.045, 0.5))
  } else {
    g.add(stroke(t, 0.17, -0.027, 0, -0.3))
    g.add(stroke(t, 0.17, 0.027, 0, 0.3))
    g.add(stroke(0.06, 0.024, 0, -0.026))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- neve da tundra --------------------------------------------------------
  const neve = new THREE.Group()

  const rochaBase = cylinder(2.62, 2.72, 0.1, ROCHA, { roughness: 0.9 })
  rochaBase.position.y = 0.05
  neve.add(rochaBase)

  const disco = cylinder(2.6, 2.63, 0.06, NEVE, { roughness: 0.9 })
  disco.position.y = 0.12
  neve.add(disco)

  // borda de neve fofa
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rand() * 0.1
    const lump = sphere(0.16 + rand() * 0.08, i % 3 === 0 ? NEVE_SOMBRA : NEVE, { roughness: 0.92 })
    lump.scale.set(1.5, 0.45, 1.1)
    lump.rotation.y = -a
    lump.position.set(Math.cos(a) * 2.5, GY - 0.01, Math.sin(a) * 2.5)
    neve.add(lump)
  }

  // montes de neve arredondados ao fundo
  for (const [mx, mz, r] of [[-1.7, -1.55, 0.62], [-0.55, -1.95, 0.5], [0.75, -1.85, 0.56], [1.75, -1.3, 0.48]] as const) {
    const monte = sphere(r, NEVE, { roughness: 0.92 })
    monte.scale.set(1.35, 0.6, 1)
    monte.position.set(mx, GY - 0.04, mz)
    neve.add(monte)
  }

  // tufos de musgo verde-escuro saindo da neve
  for (const [tx, tz, r] of [[1.55, 1.25, 0.15], [-2.05, 0.2, 0.13], [0.95, 1.85, 0.11], [-1.15, -0.85, 0.12], [2.15, 0.3, 0.12], [-0.95, 1.9, 0.1]] as const) {
    const tufo = puff(r, rand() > 0.5 ? MUSGO : MUSGO_CLARO, 5, Math.floor(rand() * 100), { roughness: 0.95 })
    tufo.scale.set(1.2, 0.55, 1.2)
    tufo.position.set(tx, GY + 0.02, tz)
    neve.add(tufo)
  }

  // bloquinho de neve sob o rato
  const bloco = rbox(0.36, 0.16, 0.32, 0.06, NEVE_SOMBRA, { roughness: 0.9 })
  bloco.position.set(RATO_POS[0], GY + 0.08, RATO_POS[2])
  bloco.rotation.y = RATO_YAW
  neve.add(bloco)

  root.add(neve)

  // ---- faixa quadriculada da largada ----------------------------------------
  const faixa = new THREE.Group()
  faixa.position.set(LINHA_X, GY, -0.125)
  const Q = 0.15
  const N = 17
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < 2; j++) {
      const preto = (i + j) % 2 === 0
      const q = rbox(Q, 0.014, Q, 0.004, preto ? PRETO : '#fbfbf8', { roughness: 0.6 })
      q.position.set((j - 0.5) * Q, 0.007, (i - (N - 1) / 2) * Q)
      faixa.add(q)
    }
  }
  root.add(faixa)

  // ---- poste com bandeirinha quadriculada -------------------------------------
  const bandeira = new THREE.Group()
  bandeira.position.set(LINHA_X - 0.05, GY, -1.38)
  const poste = cylinder(0.025, 0.03, 1.9, '#3b3f45', { roughness: 0.4, metalness: 0.6 })
  poste.position.y = 0.95
  bandeira.add(poste)
  const pe = cylinder(0.09, 0.11, 0.06, '#3b3f45', { roughness: 0.4, metalness: 0.6 })
  pe.position.y = 0.03
  bandeira.add(pe)
  const ponta = sphere(0.045, '#3b3f45', { roughness: 0.35, metalness: 0.6 })
  ponta.position.y = 1.92
  bandeira.add(ponta)
  const pano = new THREE.Group()
  pano.position.set(-0.03, 1.83, 0)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const q = rbox(0.13, 0.13, 0.016, 0.004, (i + j) % 2 === 0 ? PRETO : '#fbfbf8', { roughness: 0.75 })
      // leve ondulação do pano ao vento
      q.position.set(-0.065 - i * 0.13, -0.065 - j * 0.13, Math.sin(i * 1.4) * 0.03)
      q.rotation.y = Math.cos(i * 1.4) * 0.2
      pano.add(q)
    }
  }
  bandeira.add(pano)
  root.add(bandeira)

  // ---- trenó de madeira-mel com blocos de gelo -------------------------------
  const treno = new THREE.Group()
  treno.position.set(1.78, GY, -0.05)
  root.add(treno)
  for (const side of [-1, 1]) {
    const patim = rbox(1.0, 0.045, 0.05, 0.02, MEL_ESC, { roughness: 0.5 })
    patim.position.set(0.02, 0.025, side * 0.36)
    treno.add(patim)
    // ponta curvada do patim, na frente (lado do tigre, -x)
    const curva = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.024, 10, 20, Math.PI * 0.75),
      mat(MEL_ESC, { roughness: 0.5, size: 0.24 }),
    )
    curva.castShadow = true
    curva.position.set(-0.48, 0.145, side * 0.36)
    curva.rotation.z = Math.PI * 0.5
    treno.add(curva)
    for (const sx of [-0.3, 0.05, 0.38]) {
      const pe2 = rbox(0.04, 0.14, 0.04, 0.012, MEL_ESC, { roughness: 0.55 })
      pe2.position.set(sx, 0.11, side * 0.36)
      treno.add(pe2)
    }
    const corrimao = rbox(0.86, 0.04, 0.04, 0.015, MEL, { roughness: 0.5 })
    corrimao.position.set(0.02, 0.33, side * 0.37)
    treno.add(corrimao)
    for (const sx of [-0.38, 0.0, 0.42]) {
      const est = rbox(0.035, 0.12, 0.035, 0.01, MEL, { roughness: 0.5 })
      est.position.set(sx, 0.27, side * 0.37)
      treno.add(est)
    }
    // alça de empurrar, atrás
    const montante = rbox(0.045, 0.5, 0.045, 0.015, MEL_ESC, { roughness: 0.5 })
    montante.position.set(0.47, 0.42, side * 0.33)
    montante.rotation.z = 0.18
    treno.add(montante)
  }
  const guidao = cylinder(0.026, 0.026, 0.74, MEL_ESC, { roughness: 0.5 })
  guidao.rotation.x = Math.PI / 2
  guidao.position.set(0.52, 0.66, 0)
  treno.add(guidao)
  for (let k = 0; k < 6; k++) {
    const ripa = rbox(0.98, 0.035, 0.115, 0.012, k % 2 ? MEL : '#c48d48', { roughness: 0.55 })
    ripa.position.set(0.02, 0.2, -0.31 + k * 0.124)
    treno.add(ripa)
  }
  const travessa = rbox(0.05, 0.05, 0.8, 0.018, MEL_ESC, { roughness: 0.5 })
  travessa.position.set(-0.46, 0.22, 0)
  treno.add(travessa)
  for (const [bx, bz, s, ry] of [[-0.18, 0.12, 0.3, 0.25], [0.2, -0.1, 0.34, -0.15]] as const) {
    const gelo = rbox(s, s, s, 0.04, GELO, { roughness: 0.12 })
    gelo.position.set(bx, 0.22 + s / 2, bz)
    gelo.rotation.y = ry
    treno.add(gelo)
    const brilho = rbox(s * 0.7, 0.012, s * 0.12, 0.005, '#e4f4fb', { roughness: 0.08 })
    brilho.position.set(bx, 0.225 + s, bz)
    brilho.rotation.y = ry + 0.5
    treno.add(brilho)
  }

  // ---- TIGRE SIBERIANO (de perfil, olhando para -x) ---------------------------
  const tigre = new THREE.Group()
  tigre.position.set(0, GY, 0)
  root.add(tigre)

  const torso = capsule(0.34, 1.0, LARANJA, { roughness: 0.82 })
  torso.rotation.z = Math.PI / 2
  torso.position.set(0.02, 0.8, 0)
  tigre.add(torso)

  const peito = sphere(0.38, LARANJA, { roughness: 0.82 })
  peito.scale.set(1, 1.05, 0.95)
  peito.position.set(-0.52, 0.84, 0)
  tigre.add(peito)

  const peitoBranco = sphere(0.27, BRANCO, { roughness: 0.85 })
  peitoBranco.scale.set(0.8, 1.05, 0.92)
  peitoBranco.position.set(-0.76, 0.7, 0)
  tigre.add(peitoBranco)

  const barriga = capsule(0.22, 0.75, BRANCO, { roughness: 0.85 })
  barriga.rotation.z = Math.PI / 2
  barriga.scale.set(1, 1, 1.25)
  barriga.position.set(-0.02, 0.6, 0)
  tigre.add(barriga)

  const anca = sphere(0.37, LARANJA, { roughness: 0.82 })
  anca.position.set(0.56, 0.84, 0)
  tigre.add(anca)

  const pescoco = sphere(0.28, LARANJA, { roughness: 0.82 })
  pescoco.position.set(-0.86, 1.06, 0.03)
  tigre.add(pescoco)

  for (const side of [-1, 1]) {
    // pata dianteira: ombro, perna, pata branca na linha de largada
    const ombro = sphere(0.2, LARANJA, { roughness: 0.82 })
    ombro.position.set(-0.58, 0.68, side * 0.19)
    tigre.add(ombro)
    const perna = capsule(0.12, 0.38, LARANJA, { roughness: 0.82 })
    perna.position.set(-0.62, 0.38, side * 0.2)
    tigre.add(perna)
    const pata = sphere(0.14, BRANCO, { roughness: 0.85 })
    pata.scale.set(1.3, 0.62, 1.05)
    pata.position.set(-0.68, 0.08, side * 0.2)
    tigre.add(pata)

    // pata traseira: coxa grossa, canela, pata
    const coxa = sphere(0.24, LARANJA, { roughness: 0.82 })
    coxa.scale.set(1, 1.2, 0.9)
    coxa.position.set(0.6, 0.6, side * 0.2)
    tigre.add(coxa)
    const canela = capsule(0.105, 0.3, LARANJA, { roughness: 0.82 })
    canela.position.set(0.68, 0.3, side * 0.2)
    canela.rotation.z = -0.12
    tigre.add(canela)
    const pataT = sphere(0.13, BRANCO, { roughness: 0.85 })
    pataT.scale.set(1.3, 0.62, 1.05)
    pataT.position.set(0.62, 0.08, side * 0.2)
    tigre.add(pataT)

  }

  // listras pretas em arco sobre o dorso
  const listras: [number, number, number, number][] = [
    // x, raio, arco, inclinação
    [-0.78, 0.33, 1.7, 0.15],
    [-0.56, 0.39, 2.3, 0.1],
    [-0.34, 0.35, 1.8, 0.05],
    [-0.13, 0.35, 2.5, 0.0],
    [0.08, 0.35, 1.9, -0.05],
    [0.28, 0.35, 2.4, -0.08],
    [0.48, 0.37, 2.0, -0.12],
    [0.68, 0.36, 2.2, -0.18],
    [0.86, 0.3, 1.6, -0.25],
  ]
  for (const [lx, r, arco, incl] of listras) {
    const l = listra(r - 0.008, 0.032, arco)
    l.position.set(lx, lx < -0.5 ? 0.84 : 0.8, 0)
    l.rotation.z = incl
    tigre.add(l)
  }

  // ---- cabeça (olha pra baixo, pro rato) --------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(-1.08, 1.3, 0.1)
  cabeca.rotation.order = 'YXZ'
  cabeca.rotation.set(CABECA_PITCH, CABECA_YAW, 0)
  tigre.add(cabeca)

  const cranio = sphere(0.3, LARANJA, { roughness: 0.82 })
  cranio.scale.set(1.1, 0.95, 1)
  cabeca.add(cranio)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.17, BRANCO, { roughness: 0.85 })
    bochecha.scale.set(1, 0.85, 0.85)
    bochecha.position.set(side * 0.21, -0.1, 0.1)
    cabeca.add(bochecha)
    const focinho = sphere(0.13, BRANCO, { roughness: 0.85 })
    focinho.scale.set(1, 0.85, 1)
    focinho.position.set(side * 0.07, -0.11, 0.25)
    cabeca.add(focinho)

    // olhos arregalados de surpresa, pupilas pra baixo (no rato)
    const esclera = sphere(0.078, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(side * 0.125, 0.075, 0.252)
    const iris = sphere(0.04, '#c9a227', { roughness: 0.25 })
    iris.scale.z = 0.5
    iris.position.set(side * 0.12 + 0.01, 0.045, 0.288)
    const pupila = sphere(0.022, '#151515', { roughness: 0.2 })
    pupila.position.set(side * 0.12 + 0.012, 0.04, 0.302)
    cabeca.add(esclera, iris, pupila)
    // manchas brancas sobre os olhos (sobrancelhas erguidas)
    const sobr = capsule(0.028, 0.07, BRANCO, { roughness: 0.85 })
    sobr.rotation.z = Math.PI / 2 - side * 0.35
    sobr.position.set(side * 0.14, 0.19, 0.22)
    cabeca.add(sobr)

    const orelha = sphere(0.1, LARANJA, { roughness: 0.82 })
    orelha.scale.set(1, 1, 0.45)
    orelha.position.set(side * 0.2, 0.25, -0.04)
    orelha.rotation.z = -side * 0.3
    cabeca.add(orelha)
    const orelhaIn = sphere(0.062, BRANCO, { roughness: 0.85 })
    orelhaIn.scale.set(1, 1, 0.4)
    orelhaIn.position.set(side * 0.2, 0.24, 0.0)
    cabeca.add(orelhaIn)

    // listras das bochechas
    for (let k = 0; k < 2; k++) {
      const lb = capsule(0.016, 0.08, LISTRA, { roughness: 0.75 })
      lb.rotation.z = Math.PI / 2 + side * (0.3 - k * 0.25)
      lb.position.set(side * 0.3, -0.06 - k * 0.07, 0.07)
      lb.rotation.y = side * 0.9
      cabeca.add(lb)
    }
  }
  // listras da testa
  for (const [fx, fy, rz] of [[0, 0.285, 0], [-0.065, 0.27, 0.35], [0.065, 0.27, -0.35]] as const) {
    const lt = capsule(0.018, 0.06, LISTRA, { roughness: 0.75 })
    lt.position.set(fx, fy, 0.11)
    lt.rotation.set(-1.0, 0, rz)
    cabeca.add(lt)
  }
  const nariz = sphere(0.055, ROSA, { roughness: 0.4 })
  nariz.scale.set(1.3, 0.75, 0.8)
  nariz.position.set(0, -0.02, 0.35)
  cabeca.add(nariz)
  const queixo = sphere(0.09, BRANCO, { roughness: 0.85 })
  queixo.position.set(0, -0.22, 0.2)
  cabeca.add(queixo)
  const boca = sphere(0.05, '#4a1f24', { roughness: 0.5 })
  boca.scale.set(1.2, 0.8, 0.6)
  boca.position.set(0, -0.19, 0.29)
  cabeca.add(boca)

  // ---- arreio vermelho no peito, tiras até o trenó ----------------------------
  const arreio = new THREE.Group()
  arreio.position.set(0, GY, 0)
  root.add(arreio)
  const peitoral = torus(0.4, 0.045, VERMELHO, { roughness: 0.6 })
  peitoral.rotation.y = Math.PI / 2
  peitoral.rotation.x = 0.25
  peitoral.position.set(-0.6, 0.85, 0)
  arreio.add(peitoral)
  const cilha = torus(0.37, 0.04, VERMELHO, { roughness: 0.6 })
  cilha.rotation.y = Math.PI / 2
  cilha.position.set(0.18, 0.8, 0)
  arreio.add(cilha)
  const dorsal = rbox(0.84, 0.03, 0.1, 0.012, VERMELHO_ESC, { roughness: 0.6 })
  dorsal.position.set(-0.21, 1.2, 0)
  dorsal.rotation.z = 0.05
  arreio.add(dorsal)
  for (const side of [-1, 1]) {
    const a = new THREE.Vector3(-0.6, 0.78, side * 0.44)
    const m = new THREE.Vector3(0.95, 0.66, side * 0.44)
    const b = new THREE.Vector3(1.32, 0.22, side * 0.36 - 0.05)
    arreio.add(tira(a, m, 0.065, 0.025, VERMELHO))
    arreio.add(tira(m, b, 0.065, 0.025, VERMELHO))
    const fivela = rbox(0.06, 0.08, 0.03, 0.01, '#c3c8ce', { roughness: 0.3, metalness: 0.7 })
    fivela.position.set(0.18, 0.72, side * 0.45)
    arreio.add(fivela)
  }

  // ---- RATO cinza em pé no bloquinho -----------------------------------------
  const rato = new THREE.Group()
  rato.position.set(...RATO_POS)
  rato.rotation.y = RATO_YAW
  root.add(rato)

  const corpoR = sphere(0.12, RATO, { roughness: 0.85 })
  corpoR.scale.set(1, 1.35, 0.9)
  corpoR.position.y = 0.17
  rato.add(corpoR)
  const barrigaR = sphere(0.09, RATO_CLARO, { roughness: 0.85 })
  barrigaR.scale.set(0.95, 1.25, 0.6)
  barrigaR.position.set(0, 0.15, 0.065)
  rato.add(barrigaR)
  for (const side of [-1, 1]) {
    const pe3 = sphere(0.042, RATO_ROSA, { roughness: 0.6 })
    pe3.scale.set(0.8, 0.45, 1.5)
    pe3.position.set(side * 0.06, 0.018, 0.05)
    rato.add(pe3)
    const coxaR = sphere(0.06, RATO, { roughness: 0.85 })
    coxaR.position.set(side * 0.075, 0.065, 0.02)
    rato.add(coxaR)
  }

  const cabecaR = new THREE.Group()
  cabecaR.position.set(0, 0.36, 0.01)
  cabecaR.rotation.set(-0.72, -0.35, 0)
  rato.add(cabecaR)
  const cranioR = sphere(0.095, RATO, { roughness: 0.85 })
  cranioR.scale.set(1, 0.95, 1.05)
  cabecaR.add(cranioR)
  const focinhoR = sphere(0.062, RATO, { roughness: 0.85 })
  focinhoR.scale.set(0.85, 0.72, 1.3)
  focinhoR.position.set(0, -0.025, 0.1)
  cabecaR.add(focinhoR)
  const narizR = sphere(0.022, RATO_ROSA, { roughness: 0.4 })
  narizR.position.set(0, -0.012, 0.18)
  cabecaR.add(narizR)
  const bocaR = sphere(0.034, '#3a1418', { roughness: 0.5 })
  bocaR.scale.set(1, 1.05, 0.6)
  bocaR.position.set(0, -0.07, 0.135)
  cabecaR.add(bocaR)
  for (const side of [-1, 1]) {
    const dente = rbox(0.014, 0.022, 0.008, 0.003, '#fbf6ea', { roughness: 0.3 })
    dente.position.set(side * 0.009, -0.05, 0.16)
    cabecaR.add(dente)
    const olho = sphere(0.02, '#141414', { roughness: 0.15 })
    olho.position.set(side * 0.048, 0.025, 0.083)
    cabecaR.add(olho)
    const orelhaR = sphere(0.068, RATO, { roughness: 0.85 })
    orelhaR.scale.set(1, 1, 0.32)
    orelhaR.position.set(side * 0.085, 0.095, -0.015)
    orelhaR.rotation.z = -side * 0.35
    cabecaR.add(orelhaR)
    const orelhaRIn = sphere(0.047, RATO_ROSA, { roughness: 0.6 })
    orelhaRIn.scale.set(1, 1, 0.3)
    orelhaRIn.position.set(side * 0.085, 0.095, 0.0)
    orelhaRIn.rotation.z = -side * 0.35
    cabecaR.add(orelhaRIn)
    for (let k = 0; k < 2; k++) {
      const bigode = cylinder(0.003, 0.003, 0.09, '#3a3a3a', { roughness: 0.5 }, 6)
      bigode.rotation.z = Math.PI / 2 + side * (0.15 - k * 0.3)
      bigode.position.set(side * 0.07, -0.02 - k * 0.012, 0.14)
      cabecaR.add(bigode)
    }
  }

  // rabinho rosa do rato, enrolado atrás
  const rabinho = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.08, -0.1),
    new THREE.Vector3(0.05, 0.03, -0.2),
    new THREE.Vector3(0.16, 0.02, -0.2),
    new THREE.Vector3(0.2, 0.05, -0.1),
  ])
  for (const p of rabinho.getSpacedPoints(14)) {
    const s = sphere(0.014, RATO_ROSA, { roughness: 0.6 }, 10)
    s.position.copy(p)
    rato.add(s)
  }

  // braço +x (esquerdo dele): erguido, punho fechado segurando a cauda do tigre
  const punho = sphere(0.044, RATO_ROSA, { roughness: 0.6 })
  punho.position.set(0.2, 0.4, 0.05)
  rato.add(membro(new THREE.Vector3(0.09, 0.28, 0.02), punho.position, 0.026))
  rato.add(punho)

  // braço -x: estendido de lado, segurando a ampulheta
  const mao = sphere(0.032, RATO_ROSA, { roughness: 0.6 })
  mao.position.set(-0.23, 0.2, 0.11)
  rato.add(membro(new THREE.Vector3(-0.09, 0.27, 0.02), mao.position, 0.026))
  rato.add(mao)

  rato.updateMatrixWorld(true)
  const punhoW = punho.getWorldPosition(new THREE.Vector3())
  const maoW = mao.getWorldPosition(new THREE.Vector3())

  // ---- cauda listrada: do quadril do tigre até o punho do rato ----------------
  const RABO0 = new THREE.Vector3(0.92, GY + 0.98, 0)
  const cauda = new THREE.Group()
  cauda.position.copy(RABO0)
  root.add(cauda)
  const caminho = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0.92, GY + 0.98, 0),
      new THREE.Vector3(1.16, GY + 0.72, 0.18),
      new THREE.Vector3(1.14, GY + 0.22, 0.58),
      new THREE.Vector3(0.78, GY + 0.06, 0.96),
      new THREE.Vector3(0.26, GY + 0.055, 1.2),
      new THREE.Vector3(punhoW.x + 0.16, punhoW.y - 0.2, punhoW.z + 0.04),
      punhoW.clone(),
    ].map((p) => p.sub(RABO0)),
    false,
    'catmullrom',
    0.4,
  )
  // tubo liso afinando até a ponta, com anéis pretos (grupos de material)
  const SEG = 160
  const RAD = 18
  const raio = (t: number) => 0.075 - t * 0.04
  const tubo = new THREE.TubeGeometry(caminho, SEG, 1, RAD, false)
  const pos = tubo.attributes.position
  const v = new THREE.Vector3()
  for (let j = 0; j <= SEG; j++) {
    const c = caminho.getPointAt(j / SEG)
    for (let i = 0; i <= RAD; i++) {
      const k = j * (RAD + 1) + i
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(raio(j / SEG)).add(c)
      pos.setXYZ(k, v.x, v.y, v.z)
    }
  }
  tubo.computeVertexNormals()
  tubo.clearGroups()
  const anel = (t: number) => t > 0.95 || (t > 0.1 && (t * 11) % 1 < 0.26)
  let ini = 0
  for (let j = 1; j <= SEG; j++) {
    if (j === SEG || anel(j / SEG) !== anel(ini / SEG)) {
      tubo.addGroup(ini * RAD * 6, (j - ini) * RAD * 6, anel(ini / SEG) ? 1 : 0)
      ini = j
    }
  }
  const rabo = new THREE.Mesh(tubo, [
    mat(LARANJA, { roughness: 0.82, size: 0.15 }),
    mat(LISTRA, { roughness: 0.75, size: 0.15 }),
  ])
  rabo.castShadow = true
  rabo.receiveShadow = true
  cauda.add(rabo)
  const ponteira = sphere(raio(1), LISTRA, { roughness: 0.75 }, 16)
  ponteira.position.copy(caminho.getPointAt(1))
  cauda.add(ponteira)

  // ---- UM dedinho erguido sobre o punho (EN!) ---------------------------------
  const dedinho = new THREE.Group()
  dedinho.position.set(punhoW.x, punhoW.y + 0.02, punhoW.z)
  const dedo = capsule(0.017, 0.07, RATO_ROSA, { roughness: 0.6 })
  dedo.position.y = 0.055
  dedinho.add(dedo)
  root.add(dedinho)

  // ---- ampulheta dourada minúscula na outra pata ------------------------------
  const ampulheta = new THREE.Group()
  ampulheta.position.set(maoW.x, maoW.y + 0.015, maoW.z)
  ampulheta.rotation.y = 0.2
  root.add(ampulheta)
  const H = 0.2
  ampulheta.scale.setScalar(1.25)
  for (const y of [0.008, H - 0.008]) {
    const disco2 = cylinder(0.065, 0.065, 0.018, OURO, { roughness: 0.25, metalness: 0.8 })
    disco2.position.y = y
    ampulheta.add(disco2)
  }
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.5
    const coluna = cylinder(0.008, 0.008, H - 0.02, OURO, { roughness: 0.25, metalness: 0.8 }, 8)
    coluna.position.set(Math.cos(a) * 0.052, H / 2, Math.sin(a) * 0.052)
    ampulheta.add(coluna)
  }
  const bulbo = lathe(
    [[0.0, 0.017], [0.042, 0.02], [0.046, 0.05], [0.03, 0.08], [0.008, 0.1], [0.03, 0.12], [0.046, 0.15], [0.042, 0.18], [0.0, 0.183]],
    VIDRO,
    { roughness: 0.08 },
  )
  ampulheta.add(bulbo)
  const areiaBaixo = lathe(
    [[0, 0.02], [0.044, 0.022], [0.046, 0.045], [0.0, 0.07]],
    AREIA,
    { roughness: 0.7 },
  )
  areiaBaixo.scale.set(1.03, 1, 1.03)
  ampulheta.add(areiaBaixo)
  const areiaCima = lathe(
    [[0, 0.104], [0.014, 0.105], [0.034, 0.13], [0.0, 0.132]],
    AREIA,
    { roughness: 0.7 },
  )
  areiaCima.scale.set(1.12, 1, 1.12)
  ampulheta.add(areiaCima)
  const filete = cylinder(0.004, 0.004, 0.05, AREIA, { roughness: 0.7 }, 6)
  filete.position.y = 0.078
  ampulheta.add(filete)

  // ---- placa TUNDRA meio soterrada na frente -----------------------------------
  const placa = new THREE.Group()
  placa.position.set(-1.62, GY, 0.05)
  placa.rotation.y = 0.5
  root.add(placa)
  const quadro = new THREE.Group()
  quadro.position.y = 0.36
  quadro.rotation.z = -0.07
  placa.add(quadro)
  const tabua = rbox(0.98, 0.27, 0.05, 0.025, TABUA, { roughness: 0.75 })
  quadro.add(tabua)
  const moldura = rbox(1.02, 0.31, 0.03, 0.02, '#5e3f27', { roughness: 0.8 })
  moldura.position.z = -0.015
  quadro.add(moldura)
  const glifos: Glyph[] = ['T', 'U', 'N', 'D', 'R', 'A']
  glifos.forEach((gl, i) => {
    const l = letter(gl)
    l.position.set((i - 2.5) * 0.142, 0, 0.032)
    quadro.add(l)
  })
  for (const side of [-1, 1]) {
    const estaca = rbox(0.06, 0.42, 0.05, 0.015, '#5e3f27', { roughness: 0.8 })
    estaca.position.set(side * 0.34, 0.12, -0.04)
    estaca.rotation.z = -0.07
    placa.add(estaca)
  }
  const amontoado = sphere(0.3, NEVE, { roughness: 0.92 })
  amontoado.scale.set(2.0, 0.42, 0.85)
  amontoado.position.set(0.05, 0.03, 0.02)
  placa.add(amontoado)
  const chapeu = sphere(0.12, NEVE, { roughness: 0.92 })
  chapeu.scale.set(2.6, 0.32, 0.5)
  chapeu.position.set(-0.18, 0.52, 0)
  chapeu.rotation.z = -0.07
  placa.add(chapeu)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'neve', group: 'tundra', object: neve },
    { name: 'bandeira', group: 'pista', object: bandeira },
    { name: 'treno', group: 'pista', object: treno },
    { name: 'tigre', group: 'tigre', object: tigre },
    { name: 'arreio', group: 'tigre', object: arreio },
    { name: 'cabeca', group: 'du', object: cabeca },
    { name: 'rato', group: 'rato', object: rato },
    { name: 'cauda', group: 'rato', object: cauda },
    { name: 'faixa', group: 'partida', object: faixa },
    { name: 'dedinho', group: 'en', object: dedinho },
    { name: 'placa', group: 'stund', object: placa },
    { name: 'ampulheta', group: 'tempo', object: ampulheta },
  ]

  const RY = RATO_POS[1]
  const AMP_Y = ampulheta.position.y
  const DED_Y = dedinho.position.y

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('neve-sobe', 'neve', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Sobe um pedaço de TUNDRA gelada: neve, musgo e montes brancos ao fundo.',
    }),

    seq('bandeira-sobe', 'bandeira', 1.3, 0.7, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'É a largada de uma corrida de trenó: bandeirinha quadriculada e trenó carregado de gelo.',
    }),
    seq('treno-sobe', 'treno', 1.5, 0.7, [riseFrom(GY, 1.0)], { ease: 'easeOut' }),

    seq('tigre-sobe', 'tigre', 2.9, 0.9, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'Um tigre siberiano enorme, de arreio vermelho, espera a bandeira baixar.',
    }),
    seq('arreio-sobe', 'arreio', 2.9, 0.9, [riseFrom(GY, 2.0)], { ease: 'easeOut' }),

    seq('rato-sobe', 'rato', 4.6, 0.6, [riseFrom(RY, 0.7)], {
      ease: 'easeOut',
      caption: 'Lá embaixo, um ratinho agarra a cauda dele e solta um mini-rugido: RRÁR!',
    }),
    seq(
      'cauda-estica',
      'cauda',
      4.8,
      0.7,
      [ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1)],
      { ease: 'easeOut' },
    ),
    seq('rato-pula', 'rato', 5.6, 0.22, [ch('position.y', RY, RY + 0.12)], { ease: 'easeOut' }),
    seq('rato-pousa', 'rato', 5.82, 0.22, [ch('position.y', RY + 0.12, RY)], { ease: 'easeIn' }),

    seq(
      'cabeca-olha',
      'cabeca',
      6.6,
      0.8,
      [ch('rotation.y', -1.35, CABECA_YAW), ch('rotation.x', -0.1, CABECA_PITCH)],
      { caption: 'O tigre olha pra baixo, surpreso — e o rato aponta pra cima, pra ele: DÜ!' },
    ),

    seq('faixa-estende', 'faixa', 8.0, 0.8, [ch('scale.z', 0.02, 1)], {
      ease: 'easeOut',
      caption: 'Aponta a faixa quadriculada da parTÍDa…',
    }),

    seq('dedinho-ergue', 'dedinho', 9.2, 0.45, [ch('scale.y', 0.01, 1), ch('position.y', DED_Y - 0.03, DED_Y)], {
      ease: 'easeOut',
      caption: '…ergue UM dedinho — EN! —',
    }),

    seq('placa-sobe', 'placa', 10.2, 0.7, [riseFrom(GY, 0.7), ch('rotation.z', 0.2, 0)], {
      ease: 'easeOut',
      caption: '…e o vento da TUNDRA assobia pela placa: SSS-TUND(ra)!',
    }),

    seq(
      'ampulheta-surge',
      'ampulheta',
      11.5,
      0.8,
      [
        ch('scale.x', 0.01, 1.25), ch('scale.y', 0.01, 1.25), ch('scale.z', 0.01, 1.25),
        ch('rotation.y', 0.2 - Math.PI * 2, 0.2),
        ch('position.y', AMP_Y + 0.12, AMP_Y),
      ],
      {
        ease: 'easeOut',
        caption: 'Na outra pata, uma ampulheta minúscula: só o tempo da areia cair.',
      },
    ),

    seq('cabeca-acena', 'cabeca', 12.9, 0.35, [ch('rotation.x', CABECA_PITCH, CABECA_PITCH + 0.12)], {
      ease: 'easeOut',
      caption: 'Har du tid en stund? — Você tem um minutinho?',
    }),
    seq('cabeca-volta', 'cabeca', 13.25, 0.35, [ch('rotation.x', CABECA_PITCH + 0.12, CABECA_PITCH)], {
      ease: 'easeIn',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 1.75, 4.5], target: [0.15, 0.92, 0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'har-du-tid-en-stund',
    contexto:
      'Trabalho: na porta da sala do chefe, na mesa de um colega ou ao telefone — o jeito educado de pedir atenção antes de uma pergunta ou de um pedido de ajuda.',
    fraseFonte: 'Você tem um minutinho?',
    fraseAlvo: 'Har du tid en stund?',
    pronuncia:
      "rrá-dü TÍD en STUND? (na fala 'har du' cola: o R derrete no D, rrá-dü, h soprado; 'tid' com T seco, I longo e d leve — o mesmo parTÍD de 'boka en tid'; 'en' fraquinho; 'stund' com u curto de bico, puxando para ô, d leve; força em TÍD e STUND)",
    ponteSonora:
      "RRÁR-DÜ... parTÍD! EN... STUND(ra)? (5 batidas: rrá-dü-TÍD-en-STUND, tônicas em TÍD e STUND; RRÁR é o 'har' de sempre — o MESMO RRÁR de 'Jag har ont i magen' e 'Jag har två barn', aqui o mini-rugido do rato: h soprado, A longo, e o R BRANDO derrete direto no D: rrá-dü; DÜ = o 'du' de CAN-DU, com bico; TÍD = o parTÍD(a) de 'Jag skulle vilja boka en tid' e 'Smaklig måltid', a mesma ponte de 'tid' — só o pedaço forte: T SECO de 'tatu', nunca 'tchi', I LONGO e D leve no fim; EN = 'um', o dedinho erguido, curto e sem nasal; STUND = a TUNDRA sem o -RA, com o S do vento grudado na frente — STUND numa sílaba só, sem 'is' antes (como o SSS-CÔL de 'Skål'); U de BICO puxando pra Ô, D leve, nunca 'TUN-dji' nem 'tunda')",
    historia:
      'Linha de PARTIDA da corrida de trenó na TUNDRA: o tigre siberiano, de arreio, raspa a neve esperando a bandeira baixar. Lá embaixo, um rato do tamanho de uma pata dele puxa a sua cauda e, pra ser ouvido, solta um mini-rugido — RRÁR! — e aponta a patinha pra cima: DÜ! Aponta a faixa quadriculada da parTÍDa, ergue UM dedinho — EN! — e o vento da tundra assobia SSS pela neve. Na outra pata, uma ampulheta minúscula: o tigre larga o arreio e senta — você tem um minutinho? Só o tempo da areia cair.',
  },
  createScene,
  refine: { organic: ['tigre', 'cabeca', 'rato'] },
}

export default card
