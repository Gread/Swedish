import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Jag gillar att promenera." — IAÍ, LAR!... A PRO MINEIRA!
 *
 * Uma codorna MINEIRA gordinha, de chapéu de palha, colete de atleta escrito
 * PRO e cestinha de pão de queijo na asa, chega em marcha atlética pela
 * trilha de terra até a casinha com placa LAR e grita de bico aberto.
 *
 * Diorama: gramado com trilha serpenteando até a casinha branca de janelas
 * azuis (mineira) ao fundo à direita; a codorna enorme no centro-esquerda,
 * de perfil caminhando para a direita, com o número PRO no flanco virado
 * para a câmera.
 */

const SOLO = '#5e4630'
const GRAMA = '#86ad57'
const GRAMA_ESC = '#6c9446'
const TERRA = '#c79d68'
const TERRA_ESC = '#ad8352'
const PAREDE = '#f2ede1'
const PEDRA = '#9c968a'
const TELHA = '#b8653f'
const TELHA_ESC = '#9a5233'
const AZUL = '#3f6fa6'
const MADEIRA = '#9a6a3e'
const MADEIRA_ESC = '#6e4a2b'
const CREME = '#f3e6c8'
const PENA = '#9a6a40'
const PENA_ESC = '#6f4a2c'
const PENA_CLARA = '#e6cf9f'
const PRETO = '#2b2420'
const BICO = '#7d7c7a'
const LARANJA = '#e8873a'
const PALHA = '#e3bd5c'
const PALHA_ESC = '#c79a3e'
const BRANCO = '#f6f5f0'
const VERMELHO = '#d8262b' // acento saturado: RESERVADO ao PRO do colete
const PAO = '#e9b24c'

const GY = 0.16 // topo do gramado
const QY = GY + 0.012 // pés da codorna, sobre a trilha
const Q_X = -0.42
const Q_Z = 0.58
const Q_R = 1.22 // codorna vira para a direita (+x), levemente para a câmera
const HEAD_Y = 1.6

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(color: string, w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, color, { roughness: 0.55 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Letras de traço grosso (altura ~0.16 em escala 1). */
function letter(which: 'P' | 'R' | 'O' | 'L' | 'A', color: string, scale = 1) {
  const g = new THREE.Group()
  const t = 0.03
  if (which === 'P') {
    g.add(stroke(color, t, 0.16, -0.04, 0))
    g.add(stroke(color, 0.07, t, -0.008, 0.065))
    g.add(stroke(color, 0.07, t, -0.008, 0.005))
    g.add(stroke(color, t, 0.07, 0.028, 0.035))
  } else if (which === 'R') {
    g.add(stroke(color, t, 0.16, -0.04, 0))
    g.add(stroke(color, 0.07, t, -0.008, 0.065))
    g.add(stroke(color, 0.07, t, -0.008, 0.005))
    g.add(stroke(color, t, 0.07, 0.028, 0.035))
    g.add(stroke(color, t, 0.095, 0.022, -0.045, 0.45))
  } else if (which === 'O') {
    g.add(stroke(color, t, 0.16, -0.038, 0))
    g.add(stroke(color, t, 0.16, 0.038, 0))
    g.add(stroke(color, 0.09, t, 0, 0.065))
    g.add(stroke(color, 0.09, t, 0, -0.065))
  } else if (which === 'L') {
    g.add(stroke(color, t, 0.16, -0.03, 0))
    g.add(stroke(color, 0.085, t, 0.0, -0.065))
  } else {
    g.add(stroke(color, t, 0.17, -0.027, 0, -0.3))
    g.add(stroke(color, t, 0.17, 0.027, 0, 0.3))
    g.add(stroke(color, 0.065, 0.026, 0, -0.024))
  }
  g.scale.setScalar(scale)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: gramado + trilha de terra ------------------------------------
  const base = new THREE.Group()

  const solo = cylinder(2.62, 2.72, 0.1, SOLO, { roughness: 0.95 })
  solo.position.y = 0.05
  base.add(solo)

  const grama = cylinder(2.58, 2.6, 0.06, GRAMA, { roughness: 0.92 })
  grama.position.y = 0.13
  base.add(grama)

  // trilha: discos de terra ao longo de uma curva, da borda até a porta
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.45, 0, 1.15),
    new THREE.Vector3(-1.5, 0, 0.75),
    new THREE.Vector3(-0.4, 0, 0.62),
    new THREE.Vector3(0.45, 0, 0.3),
    new THREE.Vector3(0.95, 0, -0.25),
    new THREE.Vector3(1.15, 0, -0.62),
  ])
  for (let i = 0; i <= 34; i++) {
    const p = curva.getPoint(i / 34)
    const r = 0.3 + rand() * 0.05
    const borda = cylinder(r + 0.04, r + 0.05, 0.016, TERRA_ESC, { roughness: 0.95 })
    borda.position.set(p.x, GY + 0.003, p.z)
    base.add(borda)
    const disco = cylinder(r, r + 0.01, 0.02, TERRA, { roughness: 0.95 })
    disco.position.set(p.x, GY + 0.006, p.z)
    base.add(disco)
  }
  // pedrinhas na beira da trilha
  for (const [px, pz, rr, sd] of [
    [-1.55, 1.2, 0.09, 3], [-0.9, 0.2, 0.07, 5], [0.35, 0.85, 0.08, 7], [1.5, 0.1, 0.1, 9], [-2.0, 0.4, 0.08, 11],
  ] as const) {
    const pedra = rock(rr, '#8f8a80', sd, { roughness: 0.9 })
    pedra.position.set(px, GY + rr * 0.4, pz)
    base.add(pedra)
  }
  // tufos de grama mais escura
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.4 + rand() * 0.95
    const x = Math.cos(a) * d
    const z = Math.sin(a) * d
    if (Math.abs(z - 0.6) < 0.4 && x < 0.2) continue
    const tufo = puff(0.09, GRAMA_ESC, 4, 60 + i, { roughness: 0.92 })
    tufo.position.set(x, GY + 0.04, z)
    tufo.scale.y = 0.6
    base.add(tufo)
  }
  // florzinhas
  for (const [fx, fz, cor] of [
    [-1.2, -0.3, '#f2d14b'], [-1.05, -0.45, '#f6f1e6'], [0.6, 1.25, '#e88aa8'], [0.78, 1.1, '#f2d14b'],
    [1.95, 0.65, '#f6f1e6'], [-2.05, -0.6, '#e88aa8'],
  ] as const) {
    const haste = cylinder(0.008, 0.01, 0.12, GRAMA_ESC, { roughness: 0.8 })
    haste.position.set(fx, GY + 0.06, fz)
    base.add(haste)
    const flor = sphere(0.04, cor, { roughness: 0.6 })
    flor.position.set(fx, GY + 0.13, fz)
    base.add(flor)
  }
  // árvore ao fundo à esquerda
  const tronco = cylinder(0.08, 0.12, 0.9, '#6b4a30', { roughness: 0.9 })
  tronco.position.set(-1.35, GY + 0.45, -1.45)
  base.add(tronco)
  const copa = puff(0.5, '#5f8f43', 7, 77, { roughness: 0.9 })
  copa.position.set(-1.35, GY + 1.15, -1.45)
  base.add(copa)
  // moitas ao lado da casa
  for (const [mx, mz, mr, sd] of [[2.25, -0.35, 0.26, 81], [0.3, -1.75, 0.3, 83], [-0.4, -1.5, 0.22, 85]] as const) {
    const moita = puff(mr, GRAMA_ESC, 6, sd, { roughness: 0.9 })
    moita.position.set(mx, GY + mr * 0.6, mz)
    base.add(moita)
  }

  root.add(base)

  // ---- casinha branca de telhado de telha ---------------------------------
  const casa = new THREE.Group()
  casa.position.set(1.5, GY, -1.08)
  casa.rotation.y = -0.5
  casa.scale.setScalar(1.12)
  root.add(casa)

  const W = 1.2
  const D = 1.0
  const WH = 0.95 // altura da parede
  const GH = 0.58 // altura da empena

  const alicerce = rbox(W + 0.12, 0.1, D + 0.12, 0.03, PEDRA, { roughness: 0.9 })
  alicerce.position.y = 0.05
  casa.add(alicerce)

  const paredes = rbox(W, WH, D, 0.02, PAREDE, { roughness: 0.8 })
  paredes.position.y = 0.1 + WH / 2
  casa.add(paredes)

  // empena (triângulo extrudado) — fachada de frente para a câmera
  const tri = new THREE.Shape()
  tri.moveTo(-W / 2, 0)
  tri.lineTo(W / 2, 0)
  tri.lineTo(0, GH)
  tri.closePath()
  const empenaGeo = new THREE.ExtrudeGeometry(tri, { depth: D, bevelEnabled: false })
  empenaGeo.translate(0, 0, -D / 2)
  const empena = new THREE.Mesh(empenaGeo, mat(PAREDE, { roughness: 0.8, size: W }))
  empena.castShadow = true
  empena.receiveShadow = true
  empena.position.y = 0.1 + WH
  casa.add(empena)

  // telhado: duas águas
  const slope = Math.atan2(GH, W / 2)
  const aguaL = Math.hypot(W / 2, GH) + 0.16
  for (const side of [-1, 1]) {
    const agua = rbox(aguaL, 0.07, D + 0.24, 0.025, TELHA, { roughness: 0.75 })
    agua.rotation.z = -side * slope
    agua.position.set(side * (W / 4 + 0.03), 0.1 + WH + GH / 2 + 0.06, 0)
    casa.add(agua)
    // fiadas de telha
    for (let k = 0; k < 4; k++) {
      const fiada = cylinder(0.022, 0.022, D + 0.24, TELHA_ESC, { roughness: 0.75 })
      fiada.rotation.x = Math.PI / 2
      const u = -aguaL / 2 + 0.12 + k * (aguaL - 0.2) / 3.4
      fiada.position.set(
        side * (W / 4 + 0.03) + Math.cos(slope) * u * side,
        0.1 + WH + GH / 2 + 0.1 - Math.sin(slope) * u,
        0,
      )
      casa.add(fiada)
    }
  }
  const cumeeira = cylinder(0.05, 0.05, D + 0.26, TELHA_ESC, { roughness: 0.75 })
  cumeeira.rotation.x = Math.PI / 2
  cumeeira.position.y = 0.1 + WH + GH + 0.08
  casa.add(cumeeira)

  const chamine = rbox(0.18, 0.4, 0.18, 0.02, PAREDE, { roughness: 0.8 })
  chamine.position.set(0.32, 0.1 + WH + GH * 0.6 + 0.12, -0.2)
  casa.add(chamine)
  const chamineTopo = rbox(0.22, 0.05, 0.22, 0.015, TELHA_ESC, { roughness: 0.75 })
  chamineTopo.position.set(0.32, 0.1 + WH + GH * 0.6 + 0.34, -0.2)
  casa.add(chamineTopo)

  // vão da porta (escuro) com batente azul
  const FZ = D / 2
  const DOOR_X = -0.2
  const DOOR_W = 0.36
  const DOOR_H = 0.62
  const vao = rbox(DOOR_W, DOOR_H, 0.03, 0.01, '#2e2620', { roughness: 0.9 })
  vao.position.set(DOOR_X, 0.1 + DOOR_H / 2, FZ + 0.005)
  casa.add(vao)
  for (const [bw, bh, bx, by] of [
    [0.05, DOOR_H + 0.05, DOOR_X - DOOR_W / 2 - 0.02, 0.1 + DOOR_H / 2],
    [0.05, DOOR_H + 0.05, DOOR_X + DOOR_W / 2 + 0.02, 0.1 + DOOR_H / 2],
    [DOOR_W + 0.09, 0.05, DOOR_X, 0.1 + DOOR_H + 0.02],
  ] as const) {
    const batente = rbox(bw, bh, 0.05, 0.012, AZUL, { roughness: 0.6 })
    batente.position.set(bx, by, FZ + 0.015)
    casa.add(batente)
  }
  // luz quente lá dentro
  const luz = rbox(DOOR_W - 0.08, 0.2, 0.01, 0.005, '#f5c66a', { emissive: '#f0b64a', emissiveIntensity: 0.6 })
  luz.position.set(DOOR_X, 0.3, FZ - 0.02)
  casa.add(luz)

  // janela com moldura e venezianas azuis
  const JX = 0.3
  const JY = 0.55
  const vidro = rbox(0.24, 0.26, 0.02, 0.01, '#2f3e52', { roughness: 0.2 })
  vidro.position.set(JX, JY, FZ + 0.005)
  casa.add(vidro)
  const moldura = new THREE.Group()
  for (const [mw, mh, mx, my] of [
    [0.3, 0.04, 0, 0.15], [0.3, 0.04, 0, -0.15], [0.04, 0.3, -0.13, 0], [0.04, 0.3, 0.13, 0], [0.02, 0.26, 0, 0],
  ] as const) {
    const m = rbox(mw, mh, 0.04, 0.01, AZUL, { roughness: 0.6 })
    m.position.set(mx, my, 0)
    moldura.add(m)
  }
  moldura.position.set(JX, JY, FZ + 0.02)
  casa.add(moldura)
  for (const side of [-1, 1]) {
    const veneziana = rbox(0.13, 0.3, 0.03, 0.01, AZUL, { roughness: 0.6 })
    veneziana.position.set(JX + side * 0.22, JY, FZ + 0.02)
    casa.add(veneziana)
  }
  const peitoril = rbox(0.36, 0.035, 0.08, 0.01, PEDRA, { roughness: 0.8 })
  peitoril.position.set(JX, JY - 0.18, FZ + 0.04)
  casa.add(peitoril)
  // degrau na porta
  const degrau = rbox(0.5, 0.06, 0.2, 0.015, PEDRA, { roughness: 0.85 })
  degrau.position.set(DOOR_X, 0.03, FZ + 0.12)
  casa.add(degrau)

  // ---- porta azul (peça: escancara no fim) --------------------------------
  const porta = new THREE.Group()
  porta.position.set(DOOR_X - DOOR_W / 2, 0.1, FZ + 0.03) // dobradiça à esquerda
  porta.rotation.y = -1.25 // pose final: escancarada para fora
  casa.add(porta)
  const folha = rbox(DOOR_W, DOOR_H - 0.02, 0.04, 0.012, AZUL, { roughness: 0.6 })
  folha.position.set(DOOR_W / 2, (DOOR_H - 0.02) / 2, 0)
  porta.add(folha)
  for (const ry of [0.17, 0.43]) {
    const almofada = rbox(DOOR_W - 0.1, 0.18, 0.015, 0.008, '#33608f', { roughness: 0.6 })
    almofada.position.set(DOOR_W / 2, ry, 0.025)
    porta.add(almofada)
  }
  const macaneta = sphere(0.022, '#d9b356', { roughness: 0.3, metalness: 0.7 })
  macaneta.position.set(DOOR_W - 0.06, 0.32, 0.04)
  porta.add(macaneta)

  // ---- placa LAR acima da porta (filha da casa) ----------------------------
  const placa = new THREE.Group()
  placa.position.set(-0.05, 0.1 + WH + 0.1, FZ + 0.07)
  casa.add(placa)
  const tabua = rbox(0.78, 0.3, 0.05, 0.025, MADEIRA, { roughness: 0.75 })
  placa.add(tabua)
  const friso = rbox(0.7, 0.23, 0.01, 0.02, MADEIRA_ESC, { roughness: 0.75 })
  friso.position.z = 0.026
  placa.add(friso)
  for (const [glyph, lx] of [['L', -0.2], ['A', 0], ['R', 0.2]] as const) {
    const l = letter(glyph, CREME, 1.3)
    l.position.set(lx, 0, 0.035)
    placa.add(l)
  }
  for (const side of [-1, 1]) {
    const prego = sphere(0.02, '#5a5650', { roughness: 0.4, metalness: 0.6 })
    prego.position.set(side * 0.33, 0.1, 0.03)
    placa.add(prego)
  }

  // ---- porteirinha de madeira ---------------------------------------------
  const porteira = new THREE.Group()
  porteira.position.set(0.78, GY, -0.08)
  porteira.rotation.y = -0.62
  root.add(porteira)
  for (const px of [-0.42, 0.42, -0.9, 0.9]) {
    const poste = rbox(0.08, 0.55, 0.08, 0.015, MADEIRA_ESC, { roughness: 0.85 })
    poste.position.set(px, 0.275, 0)
    porteira.add(poste)
    const topo = cone(0.06, 0.07, MADEIRA_ESC, { roughness: 0.85 }, 4)
    topo.position.set(px, 0.585, 0)
    topo.rotation.y = Math.PI / 4
    porteira.add(topo)
  }
  // cerquinha dos lados
  for (const side of [-1, 1]) {
    for (const ry of [0.18, 0.4]) {
      const trilho = rbox(0.5, 0.05, 0.03, 0.01, MADEIRA, { roughness: 0.85 })
      trilho.position.set(side * 0.66, ry, 0.03)
      porteira.add(trilho)
    }
  }
  // folha da porteira aberta para dentro (dobradiça no poste da direita)
  const folhaP = new THREE.Group()
  folhaP.position.set(0.38, 0, 0)
  folhaP.rotation.y = 1.25
  porteira.add(folhaP)
  for (const ry of [0.14, 0.42]) {
    const r = rbox(0.76, 0.05, 0.035, 0.012, MADEIRA, { roughness: 0.85 })
    r.position.set(-0.4, ry, 0)
    folhaP.add(r)
  }
  for (const rx of [-0.04, -0.76]) {
    const v = rbox(0.05, 0.36, 0.035, 0.012, MADEIRA, { roughness: 0.85 })
    v.position.set(rx, 0.28, 0)
    folhaP.add(v)
  }
  const diag = rbox(0.05, 0.78, 0.03, 0.012, MADEIRA, { roughness: 0.85 })
  diag.position.set(-0.4, 0.28, 0)
  diag.rotation.z = Math.atan2(0.72, 0.28)
  folhaP.add(diag)

  // ---- CODORNA MINEIRA -----------------------------------------------------
  // local: +z = frente do bicho; -x = flanco direito, virado para a câmera
  const codorna = new THREE.Group()
  codorna.position.set(Q_X, QY, Q_Z)
  codorna.rotation.y = Q_R
  root.add(codorna)

  const BODY_Y = 0.98
  const RX = 0.56 * 0.88
  const RYb = 0.56 * 0.82
  const RZ = 0.56 * 1.12

  const corpo = sphere(0.56, PENA, { roughness: 0.85 })
  corpo.scale.set(0.88, 0.82, 1.12)
  corpo.position.set(0, BODY_Y, -0.02)
  codorna.add(corpo)

  const dorso = sphere(0.5, PENA_ESC, { roughness: 0.85 })
  dorso.scale.set(0.8, 0.58, 1.02)
  dorso.position.set(0, BODY_Y + 0.18, -0.12)
  codorna.add(dorso)

  const rabo = sphere(0.22, PENA_ESC, { roughness: 0.85 })
  rabo.scale.set(0.75, 0.45, 1.1)
  rabo.position.set(0, BODY_Y + 0.02, -0.68)
  rabo.rotation.x = 0.35
  codorna.add(rabo)

  const pescoco = sphere(0.25, PENA, { roughness: 0.85 })
  pescoco.position.set(0, 1.38, 0.38)
  codorna.add(pescoco)

  // pintinhas/estrias cremes nas costas e no rabo
  for (let i = 0; i < 30; i++) {
    const th = 0.25 + rand() * 1.0 // a partir do topo
    const ph = Math.PI * (0.55 + rand() * 0.9) // metade de trás
    const dx = Math.sin(th) * Math.cos(ph)
    const dy = Math.cos(th)
    const dz = Math.sin(th) * Math.sin(ph) - 0.15
    const k = 1 / Math.hypot(dx / RX, dy / RYb, dz / RZ)
    if (dz * k > -RZ * 0.42) continue // o colete cobre a frente
    const estria = capsule(0.028, 0.1, PENA_CLARA, { roughness: 0.85 })
    estria.rotation.x = Math.PI / 2
    estria.scale.set(1, 1, 0.55)
    estria.position.set(dx * k * 1.0, BODY_Y + dy * k * 1.0, -0.02 + dz * k * 1.0)
    estria.lookAt(dx * 3, BODY_Y + dy * 3 + 2.5, dz * 3 - 3)
    codorna.add(estria)
  }

  // asa de trás, recolhida
  const asaT = sphere(0.4, PENA_ESC, { roughness: 0.85 })
  asaT.scale.set(0.3, 0.58, 1.02)
  asaT.position.set(0.44, BODY_Y + 0.05, -0.12)
  asaT.rotation.x = 0.25
  codorna.add(asaT)

  // asa da frente (lado da câmera), esticada para a frente segurando a cesta
  const OMBRO = new THREE.Vector3(-0.36, 1.27, 0.2)
  const PONTA = new THREE.Vector3(-0.62, 1.2, 0.76)
  const asaF = new THREE.Group()
  asaF.position.copy(OMBRO).lerp(PONTA, 0.5)
  asaF.lookAt(PONTA)
  const asaMesh = sphere(1, PENA_ESC, { roughness: 0.85 })
  asaMesh.scale.set(0.11, 0.19, Math.hypot(...PONTA.clone().sub(OMBRO).toArray()) * 0.58)
  asaF.add(asaMesh)
  codorna.add(asaF)

  // ---- pernas finas laranja em passada de marcha atlética -----------------
  const pernas = new THREE.Group()
  codorna.add(pernas)
  const HIP_Y = 0.62
  for (const [side, ang] of [[1, -0.5], [-1, 0.5]] as const) {
    const perna = new THREE.Group()
    perna.position.set(side * 0.16, HIP_Y, -0.02)
    perna.rotation.x = ang
    pernas.add(perna)
    const L = (HIP_Y - 0.035) / Math.cos(ang)
    const coxa = capsule(0.085, 0.12, PENA, { roughness: 0.85 })
    coxa.position.y = -0.04
    perna.add(coxa)
    const canela = cylinder(0.034, 0.03, L - 0.1, LARANJA, { roughness: 0.5 })
    canela.position.y = -0.1 - (L - 0.1) / 2 + 0.05
    perna.add(canela)
    const pe = new THREE.Group()
    pe.position.y = -L
    pe.rotation.x = -ang
    perna.add(pe)
    const calcanhar = sphere(0.04, LARANJA, { roughness: 0.5 })
    pe.add(calcanhar)
    for (const a of [-0.45, 0, 0.45]) {
      const dedo = capsule(0.024, 0.15, LARANJA, { roughness: 0.5 })
      dedo.rotation.x = Math.PI / 2
      dedo.position.set(Math.sin(a) * 0.1, -0.01, Math.cos(a) * 0.1)
      dedo.rotation.y = a
      pe.add(dedo)
    }
    const dedoTras = capsule(0.022, 0.07, LARANJA, { roughness: 0.5 })
    dedoTras.rotation.x = Math.PI / 2
    dedoTras.position.set(0, -0.01, -0.06)
    pe.add(dedoTras)
  }

  // ---- cabeça: listras pretas e brancas ------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, HEAD_Y, 0.5)
  cabeca.rotation.x = -0.12 // pose final: erguida, gritando
  codorna.add(cabeca)

  const cranio = sphere(0.27, PENA, { roughness: 0.85 })
  cranio.scale.set(0.92, 0.95, 1.05)
  cabeca.add(cranio)

  const garganta = sphere(0.18, PRETO, { roughness: 0.8 })
  garganta.scale.set(1.0, 0.75, 0.7)
  garganta.position.set(0, -0.13, 0.15)
  cabeca.add(garganta)

  const colar = sphere(0.2, BRANCO, { roughness: 0.8 })
  colar.scale.set(1.0, 0.6, 0.7)
  colar.position.set(0, -0.2, 0.1)
  cabeca.add(colar)

  for (const side of [-1, 1]) {
    const sobrancelha = capsule(0.034, 0.26, BRANCO, { roughness: 0.8 })
    sobrancelha.rotation.x = Math.PI / 2 + 0.2
    sobrancelha.position.set(side * 0.2, 0.09, 0.02)
    sobrancelha.rotation.y = side * 0.25
    cabeca.add(sobrancelha)

    const olhoDir = new THREE.Vector3(side * 0.82, 0.06, 0.56).normalize()
    const esclera = sphere(0.08, '#ffffff', { roughness: 0.25 })
    esclera.position.copy(olhoDir.clone().multiplyScalar(0.235))
    esclera.lookAt(olhoDir.clone().multiplyScalar(2))
    esclera.scale.z = 0.6
    cabeca.add(esclera)
    const pupila = sphere(0.038, '#1a1a1a', { roughness: 0.2 })
    pupila.position.copy(olhoDir.clone().multiplyScalar(0.282)).add(new THREE.Vector3(0, 0, 0.02))
    cabeca.add(pupila)
    const brilho = sphere(0.012, '#ffffff', { roughness: 0.1 })
    brilho.position.copy(olhoDir.clone().multiplyScalar(0.3)).add(new THREE.Vector3(0, 0.02, 0.03))
    cabeca.add(brilho)
  }

  // ---- bico curto cinza, ABERTO num grito (peça própria) -------------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.02, 0.24)
  bico.scale.setScalar(1.25)
  cabeca.add(bico)
  const boca = sphere(0.07, '#5a2a2a', { roughness: 0.6 })
  boca.scale.set(1, 0.9, 0.8)
  boca.position.set(0, -0.03, 0.02)
  bico.add(boca)
  const superior = cone(0.075, 0.2, BICO, { roughness: 0.4 })
  superior.rotation.x = Math.PI / 2 - 0.35
  superior.position.set(0, 0.03, 0.09)
  superior.scale.set(1, 1, 0.8)
  bico.add(superior)
  const inferior = cone(0.06, 0.15, BICO, { roughness: 0.4 })
  inferior.rotation.x = Math.PI / 2 + 0.45
  inferior.position.set(0, -0.07, 0.07)
  inferior.scale.set(1, 1, 0.75)
  bico.add(inferior)
  const lingua = sphere(0.035, '#e0808c', { roughness: 0.4 })
  lingua.scale.set(1, 0.5, 1.4)
  lingua.position.set(0, -0.05, 0.07)
  bico.add(lingua)

  // ---- chapéu de palha de aba larga ---------------------------------------
  const chapeu = new THREE.Group()
  chapeu.position.set(0, 0.2, -0.03)
  chapeu.rotation.set(-0.18, 0, 0.1)
  cabeca.add(chapeu)
  const aba = cylinder(0.47, 0.48, 0.035, PALHA, { roughness: 0.85 })
  chapeu.add(aba)
  const copaChapeu = lathe(
    [[0, 0.25], [0.12, 0.245], [0.19, 0.2], [0.21, 0.1], [0.22, 0.0], [0, 0.0]],
    PALHA,
    { roughness: 0.85 },
  )
  chapeu.add(copaChapeu)
  const fita = torus(0.215, 0.03, '#7a4a2a', { roughness: 0.7 })
  fita.rotation.x = Math.PI / 2
  fita.position.y = 0.05
  chapeu.add(fita)
  for (const rr of [0.3, 0.4]) {
    const trama = torus(rr, 0.008, PALHA_ESC, { roughness: 0.85 })
    trama.rotation.x = Math.PI / 2
    trama.position.y = 0.018
    chapeu.add(trama)
  }

  // ---- colete branco de corrida com PRO em vermelho ------------------------
  const colete = new THREE.Group()
  colete.position.set(0, BODY_Y, -0.02)
  codorna.add(colete)
  const VS = 1.05
  const capaGeo = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.6)
  capaGeo.rotateX(Math.PI / 2)
  const capaMat = mat(BRANCO, { roughness: 0.7, size: 1 })
  capaMat.side = THREE.DoubleSide
  const capa = new THREE.Mesh(capaGeo, capaMat)
  capa.castShadow = true
  capa.receiveShadow = true
  capa.scale.set(RX * VS, RYb * VS, RZ * VS)
  colete.add(capa)
  // debrum azul-marinho na cava de trás do colete
  const debrum = torus(1, 0.05, '#2f4f8a', { roughness: 0.6 })
  debrum.scale.set(RX * VS * 0.951, RYb * VS * 0.951, 0.5)
  debrum.position.z = -RZ * VS * 0.309
  colete.add(debrum)
  // número de peito no flanco virado para a câmera
  const camLocal = -Q_R - 0.2
  const nd = new THREE.Vector3(Math.sin(camLocal), -0.22, Math.cos(camLocal))
  const nk = 1 / Math.hypot(nd.x / (RX * VS), nd.y / (RYb * VS), nd.z / (RZ * VS))
  const numero = new THREE.Group()
  numero.position.copy(nd.clone().multiplyScalar(nk + 0.015))
  numero.rotation.y = camLocal
  numero.rotation.x = 0.12
  colete.add(numero)
  const bib = rbox(0.5, 0.3, 0.02, 0.03, '#ffffff', { roughness: 0.6 })
  numero.add(bib)
  for (const [glyph, lx] of [['P', -0.15], ['R', 0.0], ['O', 0.15]] as const) {
    const l = letter(glyph, VERMELHO, 1.3)
    l.position.set(lx, 0, 0.014)
    numero.add(l)
  }
  for (const side of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const alfinete = sphere(0.012, '#9aa0a6', { roughness: 0.3, metalness: 0.7 })
      alfinete.position.set(side * 0.22, sy * 0.12, 0.012)
      numero.add(alfinete)
    }
  }

  // ---- cestinha de pão de queijo pendurada na asa --------------------------
  const cesta = new THREE.Group()
  cesta.position.set(PONTA.x + 0.02, PONTA.y - 0.36, PONTA.z + 0.02)
  codorna.add(cesta)
  const balaio = lathe(
    [[0, 0], [0.12, 0], [0.17, 0.05], [0.19, 0.15], [0.2, 0.17], [0.18, 0.17], [0.165, 0.06], [0.11, 0.02], [0, 0.02]],
    '#c4924a',
    { roughness: 0.85 },
  )
  cesta.add(balaio)
  for (const ry of [0.05, 0.1, 0.15]) {
    const trama = torus(0.17 + ry * 0.15, 0.01, '#a87638', { roughness: 0.85 })
    trama.rotation.x = Math.PI / 2
    trama.position.y = ry
    cesta.add(trama)
  }
  const alca = torus(0.18, 0.018, '#a87638', { roughness: 0.8 })
  alca.position.y = 0.17
  alca.rotation.y = Math.PI / 2 - Q_R * 0.3
  cesta.add(alca)
  for (const [px, py, pz] of [
    [0, 0.2, 0], [0.09, 0.18, 0.05], [-0.09, 0.18, 0.04], [0.04, 0.18, -0.09], [-0.06, 0.18, -0.08], [0.02, 0.26, 0.02],
  ] as const) {
    const pao = sphere(0.06, PAO, { roughness: 0.7 })
    pao.scale.set(1, 0.82, 1)
    pao.position.set(px, py, pz)
    cesta.add(pao)
  }

  // ---- nuvenzinha de poeira atrás dos pés ---------------------------------
  const poeira = new THREE.Group()
  poeira.position.set(0.05, 0.1, -0.78)
  codorna.add(poeira)
  for (const [px, py, pz, pr, sd] of [
    [0, 0.06, 0, 0.15, 91], [0.12, 0.14, -0.22, 0.12, 93], [-0.08, 0.22, -0.4, 0.09, 95], [0.1, 0.05, 0.12, 0.08, 97],
  ] as const) {
    const nuvem = puff(pr, '#dcc7a2', 5, sd, { roughness: 0.95 })
    nuvem.position.set(px, py, pz)
    poeira.add(nuvem)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'trilha', object: base },
    { name: 'casa', group: 'lar', object: casa },
    { name: 'placa', group: 'lar', object: placa },
    { name: 'porteira', group: 'lar', object: porteira },
    { name: 'codorna', group: 'codorna', object: codorna },
    { name: 'pernas', group: 'codorna', object: pernas },
    { name: 'cabeca', group: 'codorna', object: cabeca },
    { name: 'bico', group: 'codorna', object: bico },
    { name: 'chapeu', group: 'codorna', object: chapeu },
    { name: 'colete', group: 'pro', object: colete },
    { name: 'poeira', group: 'pro', object: poeira },
    { name: 'cesta', group: 'cesta', object: cesta },
    { name: 'porta', group: 'grito', object: porta },
  ]

  // ---- montagem ------------------------------------------------------------
  const X0 = -1.55
  const Z0 = 0.9
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Sobe um gramado com uma trilha de terra serpenteando até o fundo…',
    }),

    seq('casa-rise', 'casa', 1.3, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'No fim da trilha brota uma casinha branca, com placa na porta: LAR.',
    }),
    seq('placa-cresce', 'placa', 2.0, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('porta-entra', 'porta', 2.0, 0.4, [ch('rotation.y', -1.25, 0)], { ease: 'easeOut' }),
    seq('porteira-rise', 'porteira', 2.3, 0.6, [riseFrom(GY, 0.8)], { ease: 'easeOut' }),

    seq('codorna-surge', 'codorna', 3.5, 0.45, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Pela trilha vem uma codorna MINEIRA gordinha: tem asa, mas não voa — ela CAMINHA.',
    }),
    seq('codorna-anda', 'codorna', 3.5, 2.0, [
      ch('position.x', X0, Q_X), ch('position.z', Z0, Q_Z),
    ], { ease: 'easeOut' }),
    seq('rebola-1', 'codorna', 3.5, 0.4, [ch('rotation.z', 0, 0.13)]),
    seq('rebola-2', 'codorna', 3.9, 0.45, [ch('rotation.z', 0.13, -0.13)], { ease: 'easeInOut' }),
    seq('rebola-3', 'codorna', 4.35, 0.45, [ch('rotation.z', -0.13, 0.1)], { ease: 'easeInOut' }),
    seq('rebola-4', 'codorna', 4.8, 0.45, [ch('rotation.z', 0.1, -0.06)], { ease: 'easeInOut' }),
    seq('rebola-5', 'codorna', 5.25, 0.35, [ch('rotation.z', -0.06, 0)], { ease: 'easeOut' }),
    seq('pernas-esticam', 'pernas', 3.5, 0.5, [ch('scale.y', 0.3, 1)], { ease: 'easeOut' }),
    seq('cabeca-sobe', 'cabeca', 3.7, 0.5, [ch('position.y', 1.25, HEAD_Y)], { ease: 'easeOut' }),
    seq('bico-cresce', 'bico', 3.8, 0.4, [
      ch('scale.x', 0.01, 1.25), ch('scale.y', 0.01, 1.25), ch('scale.z', 0.01, 1.25),
    ], { ease: 'easeOut' }),
    seq('chapeu-cai', 'chapeu', 4.4, 0.6, [
      ch('position.y', 0.75, 0.2), ch('rotation.z', -0.5, 0.1),
      ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
    ], { ease: 'easeOut' }),

    seq('colete-veste', 'colete', 6.0, 0.6, [
      ch('scale.x', 0.85, 1), ch('scale.y', 0.85, 1), ch('scale.z', 0.85, 1),
    ], {
      ease: 'easeOut',
      caption: 'Colete de atleta escrito PRO: é marcha atlética, rebolando quilômetros só pelo gosto de andar.',
    }),
    seq('poeira-sobe', 'poeira', 6.5, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('position.z', -0.5, -0.78),
    ], { ease: 'easeOut' }),

    seq('cesta-pendura', 'cesta', 7.7, 0.6, [
      ch('position.y', PONTA.y + 0.2, PONTA.y - 0.36),
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Na asa, a cestinha de pão de queijo — sem pressa nenhuma de chegar.',
    }),

    seq('cabeca-grita', 'cabeca', 9.2, 0.4, [ch('rotation.x', 0.15, -0.12)], {
      ease: 'easeOut',
      caption: 'Na porteira ela grita: IAÍ, LAR! — e a casa escancara a porta: "Chegou A PRO MINEIRA!"',
    }),
    seq('bico-abre', 'bico', 9.2, 0.3, [ch('scale.y', 0.7, 1.25)], { ease: 'easeOut' }),
    seq('porta-abre', 'porta', 9.9, 0.5, [ch('rotation.y', 0, -1.25)], { ease: 'easeOut' }),

    seq('placa-balanca', 'placa', 11.0, 0.35, [ch('rotation.z', 0, 0.06)], {
      caption: 'Jag gillar att promenera. — Eu gosto de caminhar.',
    }),
    seq('placa-assenta', 'placa', 11.35, 0.45, [ch('rotation.z', 0.06, 0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.05, 2.25, 5.2], target: [0.3, 1.1, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-gillar-att-promenera',
    contexto:
      "Hobbies: no fika do trabalho, num date, ou quando perguntam 'Vad gör du på fritiden?'. Sueco ama 'ta en promenad' — no bosque, em volta do lago, no inverno escuro; tem até 'promenadmöte', a reunião feita andando.",
    fraseFonte: 'Eu gosto de caminhar.',
    fraseAlvo: 'Jag gillar att promenera.',
    pronuncia: "iá IÍL-lar a pru-me-NÊÊ-ra ('jag' = iá; 'gillar' com o G soando I — nunca G duro, nunca o J chiado de 'Gil' —, I curto, L dobrado de verdade, com a ponta da língua no céu da boca, e o R brando do presente no fim, que já emenda no 'att': iíl-la-ra; 'att' encolhe num A; 'promenera' com a força no NÊÊ — Ê fechado e longo —, o 'pro' curtinho, quase 'pru', o 'me' leve e o -ra com R de um toque só)",
    ponteSonora: "IAÍ, LAR!... A PRO MINEIRA! (8 sílabas: ia-ÍL-lar-a-pru-me-NÊÊ-ra; a força maior no NÊÊ e uma menor no ÍL; IAÍ = o 'E aí?' de cumprimento, do jeito que todo brasileiro fala, numa tacada só: começa com o IÁ de sempre — o 'jag', I de IOGA, nunca J chiado, aqui sem força — e cai no Í, que é o gi- de 'gillar': o G antes de I soa I de ioga — deixe esse I escorregar entre o A e o Í, ia-iÍ, como no 'e aí' falado rápido; sem ele sobra 'illa' (mal) —, I CURTO, nunca G duro, nunca o J chiado de 'Gil'; LAR = o LAR da casinha, o MESMO LAR fraquinho do 'spelar' de 'Det spelar ingen roll': o L é de verdade, ponta da língua no céu da boca, e encosta no Í de antes — íl-lar, o L dobrado do sueco —, sem força, mas com o R BRANDO no fim, de 'caro', que gruda no 'att': la-ra; sem esse R sobra 'gilla', o infinitivo; A = o 'att' como se fala, encolhido num A só, como o A de A DRÍCA ('Vill du ha något att dricka?'); PRO = o 'pro' da fala ('vou PRO sítio'), curtinho e fechado, quase 'pru', R de um toque colado no P; MINEIRA = como todo brasileiro fala, sem o I depois do Ê — mi-NÊ-ra, igual 'feira' vira 'fêra', o mesmo truque da VIEIRA de 'Vad ska vi göra?': a força toda no NÊ, Ê FECHADO e LONGO; o MI é fraquinho e pode abrir pra 'mé'; o -RA fecha com R brando de 'caro', nunca RR, e nunca 'mi-NÊI-ra' de três sílabas cheias)",
    historia: "A codorna MINEIRA — chapéu de palha, cestinha de pão de queijo pendurada na asa e colete de atleta escrito PRO — tem asa, mas se recusa a voar: ela CAMINHA. Sai de madrugada em marcha atlética, rebolando quilômetros de trilha de terra só pelo gosto de andar, sem pressa de chegar. No fim da tarde ela para na porteira da casinha e grita: 'IAÍ, LAR!' — e a casinha escancara a porta e responde: 'Chegou A PRO MINEIRA!'. Voar, nunca: ela gosta mesmo é de caminhar.",
  },
  createScene,
  refine: { organic: ['codorna', 'cabeca'] },
}

export default card
