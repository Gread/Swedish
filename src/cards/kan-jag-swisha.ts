import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, mat,
} from '../rig/helpers'

/**
 * "Kan jag swisha?" — CA-NIÁ, SUÍ-XA?
 *
 * Na borda do tanque do zoológico, uma foca cinza sobe no pedestal de circo:
 * quer pipoca e não tem carteira. Equilibra uma CANA no nariz e grita IÁ!
 * (CA-NIÁ); no topo da cana gira a bola da SUÍÇA, o bigode molhado chia
 * SUÍ-XA?! e a outra nadadeira estende o celular aceso para o carrinho.
 *
 * Acento saturado reservado à bola vermelha da Suíça; o celular é o único
 * emissor (verde-água, o "pagar por Swish").
 */

const STONE = '#5d6c79'
const STONE_LIGHT = '#71808c'
const STONE_DARK = '#46525d'
const WATER = '#2fb3b4'
const WATER_DEEP = '#1f8c94'
const WINE = '#8a2e3b'
const WINE_DARK = '#6e2330'
const GOLD = '#d6a640'
const SEAL = '#5b636c'
const SEAL_LIGHT = '#6f7882'
const SEAL_DARK = '#454b52'
const CANE = '#7fae3a'
const CANE_NODE = '#58812a'
const SWISS = '#e3141f' // acento reservado: a bola da SUÍÇA
const WHITE = '#f6f2ea'
const CART_RED = '#b8483d'
const CART_CREAM = '#f0e4cc'
const POPCORN = '#f5e3a8'
const POPCORN_LIGHT = '#fbf1cf'
const SCREEN = '#4fe3c4'

const GY = 0.15 // topo do piso de pedras
const PED_H = 0.34
const PY = GY + PED_H // topo do pedestal
const PED_X = -0.55
const PED_Z = 0.15
const SEAL_YAW = 0.42
const HEAD_PITCH = -0.42
const CART_X = 1.55
const CART_Z = 0.05

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, color: string, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, color, { roughness: 0.55 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** P e O de traço grosso para a placa do carrinho. */
function letter(which: 'P' | 'O', color: string) {
  const g = new THREE.Group()
  const t = 0.032
  if (which === 'P') {
    g.add(stroke(t, 0.17, -0.04, 0, color))
    g.add(stroke(0.08, t, -0.005, 0.069, color))
    g.add(stroke(0.08, t, -0.005, 0.0, color))
    g.add(stroke(t, 0.07, 0.035, 0.035, color))
  } else {
    g.add(stroke(t, 0.17, -0.042, 0, color))
    g.add(stroke(t, 0.17, 0.042, 0, color))
    g.add(stroke(0.11, t, 0, 0.069, color))
    g.add(stroke(0.11, t, 0, -0.069, color))
  }
  return g
}

/** Cruz suíça branca encostada na superfície da bola (eixo +z local). */
function swissCross(r: number) {
  const g = new THREE.Group()
  const arm = r * 0.86
  const w = r * 0.28
  const a = rbox(arm, w, 0.05, 0.012, WHITE, { roughness: 0.35 })
  const b = rbox(w, arm, 0.05, 0.012, WHITE, { roughness: 0.35 })
  g.add(a, b)
  g.position.z = r - 0.012
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- base: borda de pedras molhadas do tanque ------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.6, 2.7, 0.12, STONE_DARK, { roughness: 0.7 })
  soil.position.y = 0.06
  base.add(soil)

  // lajotas arredondadas, molhadas (pouco ásperas = brilho de água)
  for (let ix = -6; ix <= 6; ix++) {
    for (let iz = -6; iz <= 6; iz++) {
      const x = ix * 0.42 + (iz % 2 ? 0.21 : 0)
      const z = iz * 0.4
      if (Math.hypot(x, z) > 2.32) continue
      const tones = [STONE, STONE_LIGHT, '#66747f']
      const tile = rbox(0.38, 0.05, 0.36, 0.04, tones[Math.floor(rand() * 3)], {
        roughness: 0.22 + rand() * 0.18,
      })
      tile.position.set(x, 0.125, z)
      tile.rotation.y = (rand() - 0.5) * 0.12
      base.add(tile)
    }
  }

  // poças d'água no piso
  for (const [px, pz, pr] of [[0.55, 1.35, 0.32], [-1.55, 0.95, 0.24], [1.0, -0.9, 0.2]] as const) {
    const poca = cylinder(pr, pr, 0.012, WATER, { roughness: 0.05, detail: 0 })
    poca.position.set(px, GY + 0.003, pz)
    poca.scale.z = 0.7
    base.add(poca)
  }

  // mureta do tanque (aro de pedra), atrás à esquerda
  const muro = lathe(
    [[0.86, 0], [1.08, 0], [1.1, 0.2], [1.06, 0.26], [0.9, 0.26], [0.86, 0.2], [0.86, 0]],
    STONE_LIGHT,
    { roughness: 0.4 },
    56,
  )
  muro.position.set(-0.85, GY - 0.02, -1.35)
  base.add(muro)

  // balde de peixes ao pé do pedestal (vende "zoológico")
  const balde = new THREE.Group()
  balde.position.set(-1.55, GY, 0.35)
  const latao = lathe(
    [[0, 0], [0.15, 0], [0.19, 0.28], [0.2, 0.3], [0.18, 0.3], [0.17, 0.28], [0.13, 0.03], [0, 0.03]],
    '#9aa4ad',
    { roughness: 0.3, metalness: 0.7 },
  )
  balde.add(latao)
  const alca = torus(0.19, 0.01, '#7d868f', { roughness: 0.3, metalness: 0.7 })
  alca.position.y = 0.3
  alca.rotation.y = 0.3
  balde.add(alca)
  for (const [fx, fz, rz] of [[0.04, 0.03, 0.4], [-0.05, -0.02, -0.5]] as const) {
    const peixe = new THREE.Group()
    peixe.position.set(fx, 0.34, fz)
    peixe.rotation.z = rz
    const corpo = sphere(0.05, '#a9b9c4', { roughness: 0.25, metalness: 0.4 })
    corpo.scale.set(0.6, 1.9, 0.9)
    peixe.add(corpo)
    const cauda = cone(0.05, 0.07, '#8797a3', { roughness: 0.3, metalness: 0.4 })
    cauda.position.y = 0.12
    cauda.rotation.z = Math.PI
    cauda.scale.z = 0.35
    peixe.add(cauda)
    balde.add(peixe)
  }
  base.add(balde)

  const pedra = rock(0.16, STONE_DARK, 7, { roughness: 0.5 })
  pedra.position.set(1.95, GY + 0.05, 1.05)
  base.add(pedra)

  root.add(base)

  // ---- água do tanque ------------------------------------------------------
  const agua = new THREE.Group()
  agua.position.set(-0.85, 0, -1.35)
  const espelho = cylinder(0.9, 0.9, 0.04, WATER, { roughness: 0.06, detail: 0 })
  espelho.position.y = GY + 0.18
  agua.add(espelho)
  const fundo = cylinder(0.88, 0.88, 0.16, WATER_DEEP, { roughness: 0.3 })
  fundo.position.y = GY + 0.08
  agua.add(fundo)
  for (const [rx, rz, rr] of [[0.2, 0.1, 0.22], [-0.3, -0.25, 0.14]] as const) {
    const onda = torus(rr, 0.012, '#bfeeea', { roughness: 0.1 })
    onda.rotation.x = Math.PI / 2
    onda.position.set(rx, GY + 0.205, rz)
    agua.add(onda)
  }
  root.add(agua)

  // ---- pedestal de circo ---------------------------------------------------
  const pedestal = new THREE.Group()
  pedestal.position.set(PED_X, GY, PED_Z)
  const tambor = lathe(
    [[0, 0], [0.58, 0], [0.6, 0.04], [0.54, 0.17], [0.57, 0.3], [0.6, PED_H], [0, PED_H]],
    WINE,
    { roughness: 0.45 },
  )
  pedestal.add(tambor)
  for (const [ry, rr] of [[0.035, 0.6], [PED_H - 0.012, 0.6]] as const) {
    const aro = torus(rr, 0.022, GOLD, { roughness: 0.3, metalness: 0.75 })
    aro.rotation.x = Math.PI / 2
    aro.position.y = ry
    pedestal.add(aro)
  }
  const tampo = cylinder(0.56, 0.56, 0.02, WINE_DARK, { roughness: 0.5 })
  tampo.position.y = PED_H + 0.002
  pedestal.add(tampo)
  // losangos dourados ao redor do tambor
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    const d = rbox(0.07, 0.07, 0.02, 0.01, GOLD, { roughness: 0.3, metalness: 0.75 })
    d.position.set(Math.sin(a) * 0.555, 0.17, Math.cos(a) * 0.555)
    d.rotation.set(0, a, Math.PI / 4)
    pedestal.add(d)
  }
  root.add(pedestal)

  // ---- foca (corpo + nadadeiras traseiras + nadadeira de equilíbrio) ----------
  const foca = new THREE.Group()
  foca.position.set(PED_X, PY, PED_Z)
  foca.rotation.y = SEAL_YAW

  // corpo torneado: base larga sentada, afinando num pescoço comprido
  const corpo = lathe(
    [
      [0, 0], [0.36, 0.0], [0.46, 0.1], [0.48, 0.26], [0.44, 0.48], [0.36, 0.72],
      [0.28, 0.92], [0.23, 1.08], [0.21, 1.18], [0, 1.22],
    ],
    SEAL,
    { roughness: 0.3 },
  )
  corpo.position.z = -0.04
  corpo.rotation.x = -0.08
  foca.add(corpo)

  const peito = sphere(0.3, SEAL_LIGHT, { roughness: 0.32 })
  peito.scale.set(0.95, 1.45, 0.6)
  peito.position.set(0, 0.55, 0.15)
  foca.add(peito)

  // nadadeiras traseiras: abertas em V, caindo pela borda de trás do pedestal
  for (const side of [-1, 1]) {
    const trasa = capsule(0.09, 0.3, SEAL_DARK, { roughness: 0.35 })
    trasa.scale.set(1.5, 1, 0.45)
    trasa.rotation.set(Math.PI / 2 - 0.25, 0, side * 0.5)
    trasa.position.set(side * 0.17, 0.08, -0.52)
    foca.add(trasa)
  }

  // nadadeira direita (lado -x): aberta para equilibrar
  const nadE = capsule(0.075, 0.3, SEAL_DARK, { roughness: 0.35 })
  nadE.scale.set(1.0, 1, 0.45)
  nadE.position.set(-0.4, 0.66, 0.08)
  nadE.rotation.set(0.2, 0, -1.05)
  foca.add(nadE)
  root.add(foca)

  // ---- cabeça (filha da foca: começa olhando à frente, depois ergue o nariz) ---
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.3, 0.02)
  cabeca.rotation.x = HEAD_PITCH
  foca.add(cabeca)

  const cranio = sphere(0.25, SEAL, { roughness: 0.4 })
  cranio.scale.set(1, 0.95, 1.05)
  cabeca.add(cranio)

  const focinho = sphere(0.14, SEAL_LIGHT, { roughness: 0.32 })
  focinho.scale.set(1.15, 0.85, 1.25)
  focinho.position.set(0, -0.05, 0.22)
  cabeca.add(focinho)

  const nariz = sphere(0.045, '#1d1f22', { roughness: 0.25 })
  nariz.scale.set(1.3, 0.8, 1)
  nariz.position.set(0, -0.005, 0.385)
  cabeca.add(nariz)

  for (const side of [-1, 1]) {
    const almofada = sphere(0.065, SEAL_LIGHT, { roughness: 0.35 })
    almofada.position.set(side * 0.065, -0.085, 0.32)
    cabeca.add(almofada)

    const olho = sphere(0.068, '#141517', { roughness: 0.12 })
    olho.position.set(side * 0.125, 0.06, 0.17)
    olho.scale.z = 0.75
    cabeca.add(olho)
    const brilho = sphere(0.02, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.11, 0.085, 0.215)
    cabeca.add(brilho)
  }

  // boca aberta no grito IÁ!
  const boca = sphere(0.06, '#2a1d1f', { roughness: 0.5 })
  boca.scale.set(1.3, 0.55, 0.7)
  boca.position.set(0, -0.15, 0.27)
  cabeca.add(boca)

  // ponta do nariz: onde a cana se apoia
  const ponta = new THREE.Object3D()
  ponta.position.set(0, 0.015, 0.41)
  cabeca.add(ponta)

  // ---- bigodes (filhos da cabeça: espetam no SUÍ-XA) ------------------------
  const bigodes = new THREE.Group()
  bigodes.position.set(0, -0.085, 0.32)
  cabeca.add(bigodes)
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const fio = cylinder(0.01, 0.006, 0.3, '#f3f0e8', { roughness: 0.3 })
      fio.rotation.z = side * (Math.PI / 2 - 0.25 + k * 0.25)
      fio.position.set(side * 0.19, -0.02 + (1 - k) * 0.035, 0.0)
      bigodes.add(fio)
    }
  }

  // ---- nadadeira que estende o celular (filha da foca, lado +x) ---------------
  const nadadeira = new THREE.Group()
  nadadeira.position.set(0.3, 0.86, 0.1)
  nadadeira.rotation.set(0, -0.75, 0.45)
  foca.add(nadadeira)

  const nadMesh = capsule(0.085, 0.3, SEAL_DARK, { roughness: 0.35 })
  nadMesh.scale.set(1, 1, 0.55)
  nadMesh.rotation.z = Math.PI / 2
  nadMesh.position.x = 0.2
  nadadeira.add(nadMesh)
  // palma larga da nadadeira, onde o celular se apoia
  const palma = sphere(0.12, SEAL_DARK, { roughness: 0.35 })
  palma.scale.set(1.15, 0.75, 0.38)
  palma.position.set(0.44, 0.0, 0.0)
  nadadeira.add(palma)

  // ---- celular aceso (filho da nadadeira) ----------------------------------
  const celular = new THREE.Group()
  celular.position.set(0.5, 0.06, 0.05)
  celular.rotation.set(-0.15, 0.55, -0.45)
  nadadeira.add(celular)

  const capa = rbox(0.17, 0.3, 0.03, 0.025, '#1b1d21', { roughness: 0.35 })
  celular.add(capa)
  const tela = rbox(0.145, 0.26, 0.01, 0.015, SCREEN, {
    emissive: SCREEN,
    emissiveIntensity: 0.55,
    roughness: 0.2,
  })
  tela.position.z = 0.014
  celular.add(tela)
  // ícone: um "S" de dois arcos claros na tela
  const icone = new THREE.Group()
  icone.position.z = 0.021
  for (const [y, rot] of [[0.03, 0], [-0.03, Math.PI]] as const) {
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.009, 10, 24, Math.PI * 1.3),
      mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.9 }),
    )
    arco.position.y = y
    arco.rotation.z = rot + Math.PI * 0.35
    icone.add(arco)
  }
  celular.add(icone)

  // ---- carrinho de pipoca --------------------------------------------------
  const carrinho = new THREE.Group()
  carrinho.position.set(CART_X, GY, CART_Z)
  carrinho.rotation.y = -0.55
  root.add(carrinho)

  const WHEEL_R = 0.24
  const BOT = 0.26
  const CAB_H = 0.52
  const COUNTER = BOT + CAB_H

  const gabinete = rbox(0.82, CAB_H, 0.52, 0.04, CART_CREAM, { roughness: 0.5 })
  gabinete.position.y = BOT + CAB_H / 2
  carrinho.add(gabinete)
  // listras vermelhas na frente
  for (let i = 0; i < 4; i++) {
    const listra = rbox(0.1, CAB_H - 0.08, 0.02, 0.01, CART_RED, { roughness: 0.5 })
    listra.position.set(-0.3 + i * 0.2, BOT + CAB_H / 2, 0.265)
    carrinho.add(listra)
  }
  const saia = rbox(0.86, 0.06, 0.56, 0.02, CART_RED, { roughness: 0.5 })
  saia.position.y = BOT + 0.03
  carrinho.add(saia)

  const balcao = rbox(0.94, 0.05, 0.68, 0.02, CART_RED, { roughness: 0.45 })
  balcao.position.set(0, COUNTER + 0.025, 0.05)
  carrinho.add(balcao)

  // rodas com raios
  for (const side of [-1, 1]) {
    const roda = new THREE.Group()
    roda.position.set(side * 0.46, WHEEL_R, -0.02)
    roda.rotation.y = Math.PI / 2
    const pneu = torus(WHEEL_R - 0.025, 0.028, '#2b2b2e', { roughness: 0.7 })
    roda.add(pneu)
    const cubo = cylinder(0.04, 0.04, 0.06, GOLD, { roughness: 0.3, metalness: 0.75 })
    cubo.rotation.x = Math.PI / 2
    roda.add(cubo)
    for (let k = 0; k < 6; k++) {
      const raio = cylinder(0.01, 0.01, (WHEEL_R - 0.03) * 2, CART_RED, { roughness: 0.5 })
      raio.rotation.z = (k / 6) * Math.PI
      roda.add(raio)
    }
    carrinho.add(roda)
  }
  // pé de apoio da frente
  const pe = cylinder(0.025, 0.03, BOT, '#7d868f', { roughness: 0.3, metalness: 0.7 })
  pe.position.set(0, BOT / 2, 0.18)
  carrinho.add(pe)
  // alça de empurrar atrás
  const alcaC = cylinder(0.02, 0.02, 0.7, '#7d868f', { roughness: 0.3, metalness: 0.7 })
  alcaC.rotation.z = Math.PI / 2
  alcaC.position.set(0, COUNTER + 0.05, -0.42)
  carrinho.add(alcaC)

  // vitrine: vidro translúcido + colunas vermelhas
  const VIT_H = 0.52
  const VIT_Y = COUNTER + 0.05
  const vidro = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, VIT_H, 0.42),
    Object.assign(mat('#dff3f7', { roughness: 0.05, detail: 0 }), {
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  )
  vidro.position.set(0, VIT_Y + VIT_H / 2, -0.06)
  carrinho.add(vidro)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const coluna = rbox(0.045, VIT_H, 0.045, 0.012, CART_RED, { roughness: 0.45 })
      coluna.position.set(sx * 0.35, VIT_Y + VIT_H / 2, -0.06 + sz * 0.21)
      carrinho.add(coluna)
    }
  }
  // chaleira de pipoca pendurada dentro
  const chaleira = lathe(
    [[0, 0], [0.09, 0.0], [0.12, 0.04], [0.13, 0.1], [0.12, 0.12], [0, 0.12]],
    '#b9c1c8',
    { roughness: 0.25, metalness: 0.75 },
  )
  chaleira.position.set(0.1, VIT_Y + VIT_H - 0.22, -0.08)
  chaleira.rotation.z = 0.5
  carrinho.add(chaleira)

  // teto vermelho com franja recortada
  const teto = rbox(0.96, 0.06, 0.62, 0.025, CART_RED, { roughness: 0.45 })
  teto.position.set(0, VIT_Y + VIT_H + 0.03, -0.04)
  carrinho.add(teto)
  for (let i = 0; i < 9; i++) {
    const gota = sphere(0.05, i % 2 ? CART_CREAM : CART_RED, { roughness: 0.5 })
    gota.scale.set(1, 0.8, 0.5)
    gota.position.set(-0.4 + i * 0.1, VIT_Y + VIT_H - 0.01, 0.27)
    carrinho.add(gota)
  }

  // placa POP no teto
  const placa = new THREE.Group()
  placa.position.set(0, VIT_Y + VIT_H + 0.2, 0.0)
  placa.rotation.x = -0.12
  const quadro = rbox(0.64, 0.28, 0.05, 0.04, CART_CREAM, { roughness: 0.5 })
  placa.add(quadro)
  const moldura = rbox(0.68, 0.32, 0.03, 0.05, CART_RED, { roughness: 0.5 })
  moldura.position.z = -0.02
  placa.add(moldura)
  for (const [g, lx] of [['P', -0.17], ['O', 0], ['P', 0.18]] as const) {
    const l = letter(g, CART_RED)
    l.position.set(lx, 0, 0.03)
    placa.add(l)
  }
  carrinho.add(placa)

  // ---- pipocas (dentro da vitrine) ---------------------------------------------
  const pipocas = new THREE.Group()
  pipocas.position.set(CART_X, GY, CART_Z)
  pipocas.rotation.y = -0.55
  root.add(pipocas)
  const prand = rng(17)
  for (let i = 0; i < 70; i++) {
    const x = (prand() - 0.5) * 0.6
    const z = -0.06 + (prand() - 0.5) * 0.34
    const h = 0.2 * (1 - Math.abs(x) / 0.4) * (0.5 + prand() * 0.5)
    const y = VIT_Y + 0.03 + prand() * h
    const p = sphere(0.032 + prand() * 0.012, prand() > 0.5 ? POPCORN : POPCORN_LIGHT, { roughness: 0.85 }, 10)
    p.position.set(x, y, z)
    p.scale.set(1, 0.85, 1)
    pipocas.add(p)
  }
  // pipocas transbordando da chaleira
  for (let i = 0; i < 8; i++) {
    const p = sphere(0.03, POPCORN_LIGHT, { roughness: 0.85 }, 10)
    p.position.set(0.0 + prand() * 0.08, VIT_Y + VIT_H - 0.12 - i * 0.04, -0.08 + (prand() - 0.5) * 0.08)
    pipocas.add(p)
  }

  // ---- saquinho listrado na frente do balcão ---------------------------------
  const saquinho = new THREE.Group()
  // no balcão, ponta direita da frente (coordenadas do carrinho → mundo)
  const sacoLocal = new THREE.Vector3(0.36, COUNTER + 0.05, 0.25)
  sacoLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.55)
  saquinho.position.set(CART_X + sacoLocal.x, GY + sacoLocal.y, CART_Z + sacoLocal.z)
  saquinho.rotation.y = -0.3
  root.add(saquinho)
  const saco = lathe(
    [[0, 0], [0.06, 0], [0.085, 0.2], [0.08, 0.205], [0, 0.205]],
    WHITE,
    { roughness: 0.7 },
    24,
  )
  saquinho.add(saco)
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4
    const faixa = rbox(0.03, 0.2, 0.01, 0.005, CART_RED, { roughness: 0.7 })
    faixa.position.set(Math.sin(a) * 0.074, 0.1, Math.cos(a) * 0.074)
    faixa.rotation.set(0.1 * Math.cos(a), a, 0)
    saquinho.add(faixa)
  }
  for (let i = 0; i < 7; i++) {
    const a = i * 1.3
    const p = sphere(0.032, i % 2 ? POPCORN : POPCORN_LIGHT, { roughness: 0.85 }, 10)
    p.position.set(Math.sin(a) * 0.045 * (i % 3), 0.22 + (i % 3) * 0.02, Math.cos(a) * 0.045 * (i % 3))
    saquinho.add(p)
  }

  // ---- cana-de-açúcar equilibrada na ponta do nariz ----------------------------
  root.updateMatrixWorld(true)
  const tip = ponta.getWorldPosition(new THREE.Vector3())
  const CANE_H = 0.78
  const cana = new THREE.Group()
  cana.position.copy(tip)
  cana.rotation.z = -0.06
  root.add(cana)
  const colmo = cylinder(0.034, 0.038, CANE_H, CANE, { roughness: 0.4 })
  colmo.position.y = CANE_H / 2
  cana.add(colmo)
  for (let i = 1; i < 5; i++) {
    const no = torus(0.038, 0.01, CANE_NODE, { roughness: 0.5 })
    no.rotation.x = Math.PI / 2
    no.position.y = (i * CANE_H) / 5
    cana.add(no)
  }
  const folha = cone(0.03, 0.22, '#93c04d', { roughness: 0.5 })
  folha.scale.z = 0.25
  folha.position.set(0.07, CANE_H * 0.62, 0)
  folha.rotation.z = -0.7
  cana.add(folha)

  // ---- bola da bandeira suíça no topo da cana ------------------------------
  const BALL_R = 0.19
  const bola = new THREE.Group()
  bola.position.set(tip.x - Math.sin(0.06) * CANE_H, tip.y + CANE_H + BALL_R - 0.02, tip.z)
  bola.rotation.set(0.12, 0.08, 0)
  root.add(bola)
  bola.add(sphere(BALL_R, SWISS, { roughness: 0.25 }))
  const cruzFrente = swissCross(BALL_R)
  bola.add(cruzFrente)
  const cruzTras = swissCross(BALL_R)
  const verso = new THREE.Group()
  verso.rotation.y = Math.PI
  verso.add(cruzTras)
  bola.add(verso)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'tanque', object: base },
    { name: 'agua', group: 'tanque', object: agua },
    { name: 'pedestal', group: 'foca', object: pedestal },
    { name: 'foca', group: 'foca', object: foca },
    { name: 'cabeca', group: 'foca', object: cabeca },
    { name: 'nadadeira', group: 'foca', object: nadadeira },
    { name: 'carrinho', group: 'pipoca', object: carrinho },
    { name: 'pipocas', group: 'pipoca', object: pipocas },
    { name: 'saquinho', group: 'pipoca', object: saquinho },
    { name: 'cana', group: 'cana', object: cana },
    { name: 'bola', group: 'suica', object: bola },
    { name: 'bigodes', group: 'suica', object: bigodes },
    { name: 'celular', group: 'swish', object: celular },
  ]

  // ---- montagem ------------------------------------------------------------
  const NAD_REST: [number, number] = [-0.1, -1.0] // y, z: colada ao corpo
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'No zoológico, sobe a borda molhada do tanque das focas…',
    }),
    seq('agua-rise', 'agua', 0.25, 0.8, [riseFrom(0, 0.5)], { ease: 'easeOut' }),

    seq('pedestal-rise', 'pedestal', 1.4, 0.6, [riseFrom(GY, 0.6)], {
      ease: 'easeOut',
      caption: '…e uma foca pula no pedestal. Ela quer pipoca, mas não tem carteira — só nadadeiras molhadas.',
    }),
    seq('foca-pula', 'foca', 1.75, 0.8, [
      ch('position.y', PY - 1.4, PY),
      ch('scale.x', 0.6, 1), ch('scale.y', 0.6, 1), ch('scale.z', 0.6, 1),
    ], { ease: 'easeOut' }),
    seq('cabeca-frente', 'cabeca', 1.75, 0.1, [ch('rotation.x', 0.1, 0.1)]),
    seq('nadadeira-colada', 'nadadeira', 1.75, 0.1, [
      ch('rotation.y', NAD_REST[0], NAD_REST[0]), ch('rotation.z', NAD_REST[1], NAD_REST[1]),
    ]),

    seq('carrinho-chega', 'carrinho', 3.4, 0.9, [ch('position.x', 3.6, CART_X), ch('rotation.z', 0.06, 0)], {
      ease: 'easeOut',
      caption: 'Do lado, chega o carrinho de pipoca, com a vitrine cheia.',
    }),
    seq('pipocas-enchem', 'pipocas', 4.3, 0.6, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),
    seq('saquinho-cai', 'saquinho', 4.5, 0.55, [
      ch('position.y', GY + sacoLocal.y + 0.9, GY + sacoLocal.y), ch('rotation.z', 0.6, 0),
    ], { ease: 'easeIn' }),

    seq('cabeca-ergue', 'cabeca', 5.6, 0.6, [ch('rotation.x', 0.1, HEAD_PITCH)], {
      ease: 'easeOut',
      caption: 'Ela ergue o nariz, equilibra uma CANA comprida na ponta e grita IÁ! — CA-NIÁ!',
    }),
    seq('cana-cresce', 'cana', 6.1, 0.7, [
      ch('scale.y', 0.02, 1), ch('rotation.z', 0.35, -0.06),
    ], { ease: 'easeOut' }),
    seq('cana-oscila', 'cana', 6.8, 0.5, [ch('rotation.x', 0.12, 0)], { ease: 'easeInOut' }),

    seq('bola-cai', 'bola', 7.8, 0.7, [
      ch('position.y', tip.y + CANE_H + BALL_R + 1.1, tip.y + CANE_H + BALL_R - 0.02),
      ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
    ], {
      ease: 'easeIn',
      caption: 'No topo da cana gira uma bola com a bandeira da SUÍÇA…',
    }),
    seq('bola-gira', 'bola', 8.5, 1.0, [ch('rotation.y', 0.08 - Math.PI * 4, 0.08)], { ease: 'easeOut' }),
    seq('bigodes-espetam', 'bigodes', 9.0, 0.45, [
      ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
    ], {
      ease: 'easeOut',
      caption: '…mas o bigode encharcado chia tudo: SUÍ-XA?!',
    }),

    seq('nadadeira-estende', 'nadadeira', 10.3, 0.7, [
      ch('rotation.y', NAD_REST[0], -0.75), ch('rotation.z', NAD_REST[1], 0.45),
    ], {
      ease: 'easeOut',
      caption: 'E com a outra nadadeira estende o celular aceso para o pipoqueiro.',
    }),
    seq('celular-acende', 'celular', 10.6, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('bola-final', 'bola', 11.6, 0.6, [ch('rotation.z', 0.15, 0)], {
      caption: 'Kan jag swisha? — Posso pagar por Swish?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.55, 2.15, 6.1], target: [0.4, 1.55, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-swisha',
    contexto:
      'Onde não tem maquininha: loppis, venda no Blocket, barraca de feira, rifa do clube das crianças, rachar a conta com amigos.',
    fraseFonte: 'Posso pagar por Swish?',
    fraseAlvo: 'Kan jag swisha?',
    pronuncia:
      "kan iá SVÍ-sha? ('jag' = iá; o 'sw' soa SV, porque sueco não tem W — 'svisha' é o padrão, e o 'suísha' à inglesa também passa; I curto e com toda a força; o 'sh' é o X de xarope; termina em -A, porque é verbo)",
    ponteSonora:
      "CA-NIÁ, SUÍ-XA? (4 sílabas: ca-niá-SVÍ-sha; força total no SVÍ; CA-NIÁ é o MESMO âncora da galinha de 'Kan jag få en påse?' — CANA + IÁ emendados, I de IOGA, nunca 'canja'; SUÍ-XA = SUÍÇA dita rápido e com chiado: o SU aperta os lábios até virar SV (uma sílaba só, 'svi' — o mesmo SV do SVEN de 'svenska'), o I é CURTO e leva a força, como no próprio 'Su-Í-ça', e o Ç vira o X de xarope; termina em -A: é 'swisha', o verbo — nunca o 'suísh' do nome do app)",
    historia:
      'No zoológico, a foca quer pipoca mas não tem carteira — só nadadeiras molhadas. Ela equilibra uma CANA comprida na ponta do nariz, como no circo, e grita IÁ! pra chamar atenção do carrinho de pipoca. No topo da cana gira uma bola com a bandeira da SUÍÇA, mas o bigode encharcado transforma tudo em chiado: SUÍ-XA?! — e com a outra nadadeira ela estende o celular. Onde não tem maquininha, é isso que se pergunta na Suécia: dá pra pagar por Swish?',
  },
  createScene,
  refine: { organic: ['foca', 'cabeca', 'nadadeira'] },
}

export default card
