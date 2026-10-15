import * as THREE from 'three'
import type { Card, CardScene, Sequence } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'
import type { MatOpts } from '../rig/helpers'

/**
 * "Var är kassan?" — VAR É... CAÇA-N?
 *
 * Neste supermercado as registradoras criam perninhas e fogem pelos
 * corredores. Quem atende o seu VAR É...? é o T-rex que patrulha o corredor:
 * com aqueles bracinhos ele não alcança nada, então morde uma VARA de bambu e
 * sai na CAÇA — prende a registradora fujona contra o chão com a ponta da vara
 * e rosna de dente cerrado: É CAÇA... NNN! A caça dele é O caixa.
 *
 * Diorama: piso branco-gelo de supermercado com faixa verde; gôndola azul-clara
 * ao fundo; o carrinho lotado à esquerda; o T-rex verde-oliva no centro, em
 * três-quartos, com a vara descendo da boca até a registradora tombada à
 * direita. Acento amarelo saturado RESERVADO às perninhas da registradora.
 */

const FLOOR = '#eef2f3'
const FLOOR_EDGE = '#c4ccd1'
const TILE_LINE = '#d8dfe2'
const STRIPE = '#6aa57a'
const BLUE = '#a7cde3'
const BLUE_DARK = '#6f9fc0'
const BLUE_SHELF = '#e1eff7'
const RED = '#c75b4c'
const MUSTARD = '#dfba5a'
const SAGE = '#72a96a'
const CREAM = '#f3ebdb'
const METAL = '#b9c1c7'
const METAL_DARK = '#4a5157'
const GRIP = '#3f6f8f'
const OLIVE = '#7b8b3a'
const OLIVE_DARK = '#5c6a2a'
const BELLY = '#e6dcb2'
const EYE = '#f3d77a'
const TOOTH = '#f7f4ea'
const CLAW = '#3d3b31'
const GUM = '#4a2424'
const BAMBOO = '#d8c48b'
const BAMBOO_NODE = '#8c6a3a'
const REG = '#9aa3a9'
const REG_DARK = '#596268'
const REG_LIGHT = '#c8cfd4'
const SCREEN = '#58f08a'
const LEGS = '#ffb81c' // acento saturado RESERVADO: as perninhas da registradora
const SHOE = '#3a3f45'
const GROWL = '#8e979d'

const GY = 0.12 // topo do piso
const BASE_R = 2.95

const CAM: [number, number, number] = [0.15, 1.95, 5.5]

// T-rex: no centro, de três-quartos, focinho para a direita/câmera
const TREX_POS = new THREE.Vector3(-0.62, GY, -0.22)
const TREX_ROT = -0.68

// registradora: corre de pé e termina tombada de lado, presa pela vara
const CAIXA_S = 1.15
const CAIXA_ROT_Y = -0.32
const CAIXA_X_UP = 2.15
const CAIXA_X = 1.7
const CAIXA_Z = 1.0
const CAIXA_Y_UP = GY + 0.47 * CAIXA_S // em pé, sobre as perninhas
const CAIXA_Y = GY + 0.3 * CAIXA_S // deitada sobre o lado esquerdo
const TIP = Math.PI / 2

const CART_X = -1.6

type V3 = THREE.Vector3
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula de a até b — membros, cauda, alças. */
function limb(a: V3, b: V3, r: number, color: string, opts?: MatOpts) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Arame/tubo reto de a até b. */
function wire(a: V3, b: V3, r: number, color: string, opts?: MatOpts) {
  const d = b.clone().sub(a)
  const m = cylinder(r, r, d.length(), color, opts, 10)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Meia-corda do disco: metade do comprimento de uma linha a distância d do centro. */
const halfChord = (r: number, d: number) => Math.sqrt(Math.max(0, r * r - d * d))

// ---------------------------------------------------------------------------

function makeBase() {
  const base = new THREE.Group()

  const plinth = cylinder(BASE_R + 0.05, BASE_R + 0.12, 0.08, FLOOR_EDGE, { roughness: 0.6 })
  plinth.position.y = 0.04
  base.add(plinth)

  const floor = cylinder(BASE_R, BASE_R, 0.04, FLOOR, { roughness: 0.35 })
  floor.position.y = 0.1
  base.add(floor)

  // rejunte do piso em placas de 0.6
  for (let i = -4; i <= 4; i++) {
    const d = i * 0.6
    const hc = halfChord(BASE_R - 0.03, d)
    if (hc < 0.1) continue
    const lx = rbox(hc * 2, 0.006, 0.018, 0.003, TILE_LINE, { roughness: 0.5 })
    lx.position.set(0, GY + 0.002, d)
    base.add(lx)
    const lz = rbox(0.018, 0.006, hc * 2, 0.003, TILE_LINE, { roughness: 0.5 })
    lz.position.set(d, GY + 0.002, 0)
    base.add(lz)
  }

  // faixa verde no meio do corredor
  const SZ = 0.32
  const hc = halfChord(BASE_R - 0.04, SZ)
  const faixa = rbox(hc * 2, 0.01, 0.46, 0.004, STRIPE, { roughness: 0.4 })
  faixa.position.set(0, GY + 0.005, SZ)
  base.add(faixa)

  return base
}

function makeGondola() {
  const g = new THREE.Group()
  const rand = rng(41)
  const W = 3.4

  const plinth = rbox(W, 0.16, 0.6, 0.03, BLUE_DARK, { roughness: 0.5 })
  plinth.position.y = GY + 0.08
  g.add(plinth)

  const back = rbox(W, 1.62, 0.06, 0.02, BLUE, { roughness: 0.5 })
  back.position.set(0, GY + 0.16 + 0.81, -0.27)
  g.add(back)

  for (const s of [-1, 1]) {
    const upright = rbox(0.08, 1.86, 0.62, 0.025, BLUE_DARK, { roughness: 0.5 })
    upright.position.set(s * (W / 2 + 0.02), GY + 0.93, 0)
    g.add(upright)
  }

  const header = rbox(W + 0.14, 0.16, 0.66, 0.035, BLUE_DARK, { roughness: 0.5 })
  header.position.y = GY + 1.86
  g.add(header)

  const levels = [0.16, 0.62, 1.08, 1.54]
  for (const ly of levels.slice(1)) {
    const shelf = rbox(W - 0.04, 0.04, 0.56, 0.012, BLUE_SHELF, { roughness: 0.4 })
    shelf.position.y = GY + ly - 0.02
    g.add(shelf)
    const rail = rbox(W - 0.04, 0.07, 0.025, 0.01, BLUE_DARK, { roughness: 0.45 })
    rail.position.set(0, GY + ly - 0.03, 0.29)
    g.add(rail)
    for (let x = -1.45; x < 1.5; x += 0.48) {
      const tag = rbox(0.1, 0.045, 0.01, 0.005, '#ffffff', { roughness: 0.4 })
      tag.position.set(x + (rand() - 0.5) * 0.1, GY + ly - 0.03, 0.305)
      g.add(tag)
    }
  }

  // mercadorias: caixinhas e latas, em vermelho, mostarda e verde
  const palette = [RED, MUSTARD, SAGE, RED, MUSTARD, SAGE, CREAM]
  levels.forEach((ly, li) => {
    const maxH = li === 3 ? 0.26 : 0.38
    let x = -W / 2 + 0.08
    while (true) {
      const w = 0.15 + rand() * 0.15
      if (x + w > W / 2 - 0.08) break
      const color = palette[Math.floor(rand() * palette.length)]
      const h = maxH * (0.55 + rand() * 0.42)
      if (rand() < 0.7) {
        const caixa = rbox(w, h, 0.3, 0.02, color, { roughness: 0.55 })
        caixa.position.set(x + w / 2, GY + ly + h / 2, 0.06)
        g.add(caixa)
        const rotulo = rbox(w * 0.78, h * 0.32, 0.012, 0.005, color === CREAM ? RED : CREAM, { roughness: 0.5 })
        rotulo.position.set(x + w / 2, GY + ly + h * 0.55, 0.215)
        g.add(rotulo)
      } else {
        const r = w / 4.2
        for (const dx of [-1, 1]) {
          const lata = cylinder(r, r, h * 0.7, color, { roughness: 0.35, metalness: 0.3 }, 20)
          lata.position.set(x + w / 2 + dx * r * 1.05, GY + ly + h * 0.35, 0.12)
          g.add(lata)
          const tampa = cylinder(r * 0.92, r * 0.92, 0.012, METAL, { roughness: 0.3, metalness: 0.7 }, 20)
          tampa.position.set(x + w / 2 + dx * r * 1.05, GY + ly + h * 0.7 + 0.006, 0.12)
          g.add(tampa)
        }
      }
      x += w + 0.035
    }
  })

  g.position.set(0.05, 0, -2.05)
  return g
}

function makeCart() {
  const g = new THREE.Group()
  const rand = rng(7)
  const L = 0.42 // meio comprimento da cesta (x)
  const Wd = 0.27 // meia largura (z)
  const B = 0.44 // fundo da cesta
  const T = 0.86 // borda da cesta
  const wireOpts = { roughness: 0.25, metalness: 0.8 }

  // rodinhas e garfos
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const roda = cylinder(0.05, 0.05, 0.035, METAL_DARK, { roughness: 0.6 }, 20)
      roda.rotation.x = Math.PI / 2
      roda.position.set(sx * 0.34, GY + 0.05, sz * 0.2)
      g.add(roda)
      const garfo = rbox(0.03, 0.07, 0.05, 0.01, METAL, wireOpts)
      garfo.position.set(sx * 0.34, GY + 0.1, sz * 0.2)
      g.add(garfo)
    }
  }

  // chassi: trilhos, bandeja de baixo e colunas
  for (const sz of [-1, 1]) {
    g.add(wire(v(-0.4, GY + 0.14, sz * 0.2), v(0.38, GY + 0.14, sz * 0.2), 0.016, METAL, wireOpts))
  }
  const bandeja = rbox(0.7, 0.012, 0.38, 0.005, METAL, wireOpts)
  bandeja.position.y = GY + 0.16
  g.add(bandeja)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(wire(v(sx * 0.37, GY + 0.14, sz * 0.2), v(sx * (L - 0.04), GY + B, sz * (Wd - 0.04)), 0.014, METAL, wireOpts))
    }
  }

  // cesta de arame: fundo, aros e varetas
  const fundo = rbox(L * 2, 0.015, Wd * 2, 0.005, METAL, wireOpts)
  fundo.position.y = GY + B
  g.add(fundo)
  const ring = (y: number, r: number) => {
    const c = [v(-L, y, -Wd), v(L, y, -Wd), v(L, y, Wd), v(-L, y, Wd)]
    for (let i = 0; i < 4; i++) g.add(wire(c[i], c[(i + 1) % 4], r, METAL, wireOpts))
  }
  ring(GY + B, 0.014)
  ring(GY + 0.58, 0.007)
  ring(GY + 0.72, 0.007)
  ring(GY + T, 0.017)
  for (let x = -L; x <= L + 1e-6; x += L / 6) {
    for (const sz of [-1, 1]) g.add(wire(v(x, GY + B, sz * Wd), v(x, GY + T, sz * Wd), 0.006, METAL, wireOpts))
  }
  for (let z = -Wd + 0.0675; z < Wd - 0.01; z += 0.0675) {
    for (const sx of [-1, 1]) g.add(wire(v(sx * L, GY + B, z), v(sx * L, GY + T, z), 0.006, METAL, wireOpts))
  }

  // alça
  for (const sz of [-1, 1]) {
    g.add(wire(v(-L, GY + T, sz * (Wd - 0.02)), v(-L - 0.12, GY + 1.0, sz * (Wd - 0.02)), 0.016, METAL, wireOpts))
  }
  const barra = cylinder(0.018, 0.018, Wd * 2 + 0.02, METAL, wireOpts, 12)
  barra.rotation.x = Math.PI / 2
  barra.position.set(-L - 0.12, GY + 1.0, 0)
  g.add(barra)
  const pega = cylinder(0.032, 0.032, 0.4, GRIP, { roughness: 0.5 }, 20)
  pega.rotation.x = Math.PI / 2
  pega.position.set(-L - 0.12, GY + 1.0, 0)
  g.add(pega)

  // compras transbordando
  const flakes = rbox(0.24, 0.42, 0.09, 0.015, RED, { roughness: 0.5 })
  flakes.position.set(0.1, GY + B + 0.22, -0.1)
  flakes.rotation.set(0.08, 0.25, -0.12)
  g.add(flakes)
  const flakesLabel = rbox(0.17, 0.14, 0.01, 0.005, CREAM, { roughness: 0.5 })
  flakesLabel.position.set(0, 0.04, 0.048)
  flakes.add(flakesLabel)

  const amarela = rbox(0.26, 0.24, 0.18, 0.02, MUSTARD, { roughness: 0.5 })
  amarela.position.set(-0.2, GY + B + 0.13, 0.07)
  amarela.rotation.y = 0.4
  g.add(amarela)

  const verde = rbox(0.2, 0.3, 0.13, 0.02, SAGE, { roughness: 0.5 })
  verde.position.set(0.28, GY + B + 0.16, 0.1)
  verde.rotation.set(0, -0.3, 0.16)
  g.add(verde)

  const leite = new THREE.Group()
  leite.position.set(-0.04, GY + B + 0.14, 0.16)
  leite.rotation.set(0.12, 0.5, 0)
  const caixaLeite = rbox(0.12, 0.26, 0.12, 0.01, '#f6f6f2', { roughness: 0.45 })
  leite.add(caixaLeite)
  const telhado = cone(0.088, 0.07, '#4d7fb0', { roughness: 0.45 }, 4)
  telhado.rotation.y = Math.PI / 4
  telhado.position.y = 0.165
  leite.add(telhado)
  const faixaLeite = rbox(0.124, 0.05, 0.124, 0.005, '#4d7fb0', { roughness: 0.45 })
  faixaLeite.position.y = -0.02
  leite.add(faixaLeite)
  g.add(leite)

  const baguete = capsule(0.042, 0.44, '#d29a55', { roughness: 0.75 })
  baguete.position.set(-0.27, GY + B + 0.34, -0.12)
  baguete.rotation.set(0.25, 0, 0.85)
  g.add(baguete)
  for (let k = 0; k < 3; k++) {
    const corte = capsule(0.012, 0.05, '#e7c48a', { roughness: 0.8 })
    corte.position.set(0, -0.13 + k * 0.13, 0.036)
    corte.rotation.z = 0.6
    baguete.add(corte)
  }

  const garrafa = lathe(
    [[0, 0], [0.055, 0], [0.058, 0.04], [0.056, 0.16], [0.024, 0.22], [0.022, 0.28], [0.026, 0.3], [0, 0.3]],
    '#3f6e4a',
    { roughness: 0.15 },
  )
  garrafa.position.set(0.3, GY + B + 0.01, -0.15)
  garrafa.rotation.z = -0.12
  g.add(garrafa)

  for (let k = 0; k < 3; k++) {
    const maca = sphere(0.055, '#b8423a', { roughness: 0.35 })
    maca.position.set(0.05 + k * 0.1, GY + B + 0.33 + rand() * 0.04, 0.12 - k * 0.04)
    g.add(maca)
  }

  g.position.set(CART_X, 0, 0.98)
  g.rotation.y = 0.32
  return g
}

/** Registradora (em pé, origem no centro do gabinete) + as duas perninhas. */
function makeRegister() {
  const g = new THREE.Group()

  const corpo = rbox(0.6, 0.26, 0.5, 0.05, REG, { roughness: 0.45 })
  g.add(corpo)

  // gaveta aberta com notas e moedas
  const gaveta = rbox(0.5, 0.11, 0.36, 0.015, REG_DARK, { roughness: 0.5 })
  gaveta.position.set(0, -0.055, 0.3)
  g.add(gaveta)
  const frente = rbox(0.56, 0.14, 0.035, 0.015, '#7b858c', { roughness: 0.4 })
  frente.position.set(0, -0.055, 0.49)
  g.add(frente)
  const puxador = rbox(0.14, 0.024, 0.012, 0.006, REG_DARK, { roughness: 0.4 })
  puxador.position.set(0, -0.03, 0.51)
  g.add(puxador)
  for (let k = 0; k < 3; k++) {
    // notas espetadas para fora da gaveta
    const nota = rbox(0.12, 0.012, 0.17, 0.004, '#9cc79a', { roughness: 0.8 })
    nota.position.set(-0.15 + k * 0.13, 0.03, 0.34)
    nota.rotation.set(-0.55, (k - 1) * 0.15, 0)
    g.add(nota)
  }
  for (const [mx, mz] of [[0.18, 0.22], [0.12, 0.38], [-0.2, 0.4]] as const) {
    const moeda = cylinder(0.032, 0.032, 0.012, '#c9ccd0', { roughness: 0.3, metalness: 0.75 }, 20)
    moeda.position.set(mx, 0.016, mz)
    g.add(moeda)
  }

  // teclado inclinado
  const teclado = rbox(0.6, 0.1, 0.3, 0.035, REG, { roughness: 0.45 })
  teclado.position.set(0, 0.16, 0.06)
  teclado.rotation.x = 0.3
  g.add(teclado)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const cor = r === 2 && c === 3 ? SCREEN : c === 3 ? REG_DARK : '#eef0ea'
      const tecla = rbox(0.07, 0.03, 0.06, 0.012, cor, { roughness: 0.4 })
      tecla.position.set(-0.17 + c * 0.1, 0.055, -0.09 + r * 0.085)
      teclado.add(tecla)
    }
  }

  // visor verde num pedestal
  const pedestal = cylinder(0.035, 0.045, 0.12, REG_DARK, { roughness: 0.5 })
  pedestal.position.set(0.12, 0.25, -0.15)
  g.add(pedestal)
  const visor = rbox(0.32, 0.18, 0.07, 0.025, REG_DARK, { roughness: 0.45 })
  visor.position.set(0.12, 0.39, -0.15)
  visor.rotation.x = -0.15
  g.add(visor)
  const tela = rbox(0.25, 0.11, 0.012, 0.01, SCREEN, { emissive: SCREEN, emissiveIntensity: 0.85 })
  tela.position.z = 0.036
  visor.add(tela)
  // dígitos do visor
  for (let k = 0; k < 3; k++) {
    const digito = rbox(0.04, 0.07, 0.006, 0.006, '#1f4a2c', { roughness: 0.5 })
    digito.position.set(-0.06 + k * 0.06, 0, 0.043)
    visor.add(digito)
  }

  // impressora de cupom com a fitinha saindo
  const impressora = rbox(0.15, 0.08, 0.15, 0.02, REG_LIGHT, { roughness: 0.4 })
  impressora.position.set(-0.19, 0.2, -0.13)
  g.add(impressora)
  // fita de cupom saindo da impressora e caindo no chão
  const fita = [v(-0.19, 0.24, -0.13), v(-0.19, 0.33, -0.13), v(-0.29, 0.42, -0.13), v(-0.297, 0.56, -0.13)]
  for (let i = 0; i < fita.length - 1; i++) {
    const d = fita[i + 1].clone().sub(fita[i])
    const tira = rbox(0.006, d.length() + 0.01, 0.085, 0.002, '#fbfbf7', { roughness: 0.7 })
    tira.position.copy(fita[i]).add(fita[i + 1]).multiplyScalar(0.5)
    tira.quaternion.setFromUnitVectors(UP, d.normalize())
    g.add(tira)
  }

  // perninhas: quadril na base do gabinete; coxa para baixo, canela dobrada
  // para +x local (que vira "para cima" quando a registradora tomba)
  const legs: THREE.Group[] = []
  for (const sx of [-1, 1]) {
    const perna = new THREE.Group()
    perna.position.set(sx * 0.16, -0.12, 0.02)
    const quadril = sphere(0.042, LEGS, { roughness: 0.4 })
    perna.add(quadril)
    const joelho = v(0, -0.19, 0)
    perna.add(limb(v(0, 0, 0), joelho, 0.03, LEGS, { roughness: 0.4 }))
    const jo = sphere(0.038, LEGS, { roughness: 0.4 })
    jo.position.copy(joelho)
    perna.add(jo)
    const tornozelo = joelho.clone().add(v(0.17, -0.1, 0))
    perna.add(limb(joelho, tornozelo, 0.027, LEGS, { roughness: 0.4 }))
    const tenis = sphere(0.05, SHOE, { roughness: 0.6 })
    tenis.scale.set(0.95, 1.6, 1.15)
    tenis.position.copy(tornozelo).add(v(0.02, -0.04, 0))
    perna.add(tenis)
    const sola = sphere(0.05, '#f2f2ee', { roughness: 0.7 })
    sola.scale.set(0.6, 1.55, 1.12)
    sola.position.copy(tornozelo).add(v(0.045, -0.045, 0))
    perna.add(sola)
    g.add(perna)
    legs.push(perna)
  }

  g.position.set(CAIXA_X, CAIXA_Y, CAIXA_Z)
  g.rotation.set(0, CAIXA_ROT_Y, TIP)
  g.scale.setScalar(CAIXA_S)
  return { caixa: g, pernaE: legs[0], pernaD: legs[1] }
}

/** T-rex: corpo+pernas+cauda (peça 'trex'), cabeça e bracinhos como peças filhas. */
function makeTrex() {
  const t = new THREE.Group()
  const skin = { roughness: 0.62 }

  // tronco, peito, quadril e barriga creme
  const torso = sphere(0.6, OLIVE, skin)
  torso.scale.set(1.3, 0.85, 0.82)
  torso.position.set(0, 1.32, 0)
  torso.rotation.z = 0.3
  t.add(torso)
  const peito = sphere(0.46, OLIVE, skin)
  peito.scale.set(1, 1.05, 0.85)
  peito.position.set(0.55, 1.6, 0)
  t.add(peito)
  const quadril = sphere(0.5, OLIVE, skin)
  quadril.scale.set(1.05, 0.95, 0.85)
  quadril.position.set(-0.42, 1.28, 0)
  t.add(quadril)
  const barriga = sphere(0.5, BELLY, skin)
  barriga.scale.set(1.2, 0.82, 0.74)
  barriga.position.set(0.44, 1.18, 0)
  barriga.rotation.z = 0.5
  t.add(barriga)
  t.add(limb(v(0.62, 1.62, 0), v(1.05, 2.0, 0), 0.29, OLIVE, skin)) // pescoço

  // pernas de coxa grossa (peça própria, para o pé fundir com a canela):
  // joelho à frente, tornozelo atrás, pé de 3 dedos com garras
  const pernas = new THREE.Group()
  for (const s of [-1, 1]) {
    const z = s * 0.38
    const coxa = sphere(0.36, OLIVE, skin)
    coxa.scale.set(1.05, 1.3, 0.75)
    coxa.position.set(-0.2, 0.98, z)
    coxa.rotation.z = 0.25
    pernas.add(coxa)
    const joelho = v(0.04, 0.72, z)
    const tornozelo = v(-0.16, 0.28, z)
    pernas.add(limb(joelho, tornozelo, 0.14, OLIVE, skin))
    pernas.add(limb(tornozelo, v(-0.04, 0.12, z), 0.11, OLIVE, skin))
    const pe = sphere(0.17, OLIVE, skin)
    pe.scale.set(1.45, 0.45, 1.05)
    pe.position.set(0.02, 0.075, z)
    pernas.add(pe)
    for (let k = -1; k <= 1; k++) {
      const a = k * 0.38
      const base = v(0.14, 0.055, z + k * 0.07)
      const ponta = base.clone().add(v(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15))
      pernas.add(limb(base, ponta, 0.05, OLIVE, skin))
      const garra = cone(0.03, 0.08, CLAW, { roughness: 0.35 })
      garra.position.copy(ponta).add(v(Math.cos(a) * 0.055, -0.005, Math.sin(a) * 0.055))
      garra.quaternion.setFromUnitVectors(UP, v(Math.cos(a), -0.15, Math.sin(a)).normalize())
      pernas.add(garra)
    }
  }
  t.add(pernas)

  // cauda grossa em equilíbrio, curvando para trás
  const cauda: [V3, number][] = [
    [v(-0.72, 1.32, 0), 0.42],
    [v(-1.18, 1.16, -0.02), 0.33],
    [v(-1.58, 0.99, -0.06), 0.25],
    [v(-1.92, 0.85, -0.12), 0.18],
    [v(-2.18, 0.75, -0.19), 0.12],
  ]
  for (let i = 0; i < cauda.length; i++) {
    const [p, r] = cauda[i]
    const bola = sphere(r, OLIVE, skin)
    bola.position.copy(p)
    t.add(bola)
    if (i > 0) {
      const [q, rq] = cauda[i - 1]
      t.add(limb(q, p, (r + rq) / 2 * 0.95, OLIVE, skin))
    }
  }

  // ---- bracinhos encolhidos no peito ---------------------------------------
  const bracinhos = new THREE.Group()
  bracinhos.position.set(0.86, 1.46, 0)
  for (const s of [-1, 1]) {
    const z = s * 0.29
    const ombro = v(0, 0, z)
    const cotovelo = v(0.04, -0.13, z * 1.05)
    const mao = v(0.16, -0.09, z * 1.0)
    bracinhos.add(limb(ombro, cotovelo, 0.055, OLIVE, skin))
    bracinhos.add(limb(cotovelo, mao, 0.045, OLIVE, skin))
    for (const dz of [-0.025, 0.025]) {
      const garra = cone(0.016, 0.05, CLAW, { roughness: 0.35 })
      garra.position.copy(mao).add(v(0.05, -0.012, dz))
      garra.rotation.z = -Math.PI / 2 - 0.5
      bracinhos.add(garra)
    }
  }
  t.add(bracinhos)

  // ---- cabeça enorme: crânio fundo, focinho curto e alto, mandíbula larga ---
  const cabeca = new THREE.Group()
  cabeca.position.set(1.0, 2.02, 0)
  cabeca.rotation.z = -0.12
  cabeca.scale.setScalar(1.25)

  const cranio = sphere(0.33, OLIVE, skin)
  cranio.scale.set(1.15, 1.0, 0.95)
  cranio.position.set(0.1, 0.1, 0)
  cabeca.add(cranio)
  const focinho = rbox(0.64, 0.3, 0.42, 0.045, OLIVE, skin)
  focinho.position.set(0.48, 0.01, 0)
  cabeca.add(focinho)
  const ponta = sphere(0.15, OLIVE, skin)
  ponta.scale.set(1.1, 0.95, 1.32)
  ponta.position.set(0.74, 0.03, 0)
  cabeca.add(ponta)
  const mandibula = rbox(0.62, 0.17, 0.38, 0.04, OLIVE, skin)
  mandibula.position.set(0.42, -0.21, 0)
  cabeca.add(mandibula)
  const queixo = rbox(0.52, 0.06, 0.3, 0.025, BELLY, skin)
  queixo.position.set(0.4, -0.285, 0)
  cabeca.add(queixo)
  for (const s of [-1, 1]) {
    // músculo da mandíbula: volume atrás da boca
    const bochecha = sphere(0.2, OLIVE, skin)
    bochecha.position.set(0.0, -0.1, s * 0.15)
    cabeca.add(bochecha)
    const sobrancelha = sphere(0.09, OLIVE_DARK, skin)
    sobrancelha.scale.set(1.7, 0.6, 0.9)
    sobrancelha.position.set(0.22, 0.29, s * 0.18)
    sobrancelha.rotation.z = -0.25
    cabeca.add(sobrancelha)

    // olho amarelo de pupila em fenda
    const olho = sphere(0.075, EYE, { roughness: 0.25 })
    olho.scale.z = 0.6
    olho.position.set(0.22, 0.18, s * 0.28)
    cabeca.add(olho)
    const fenda = rbox(0.026, 0.095, 0.02, 0.01, '#1a1a1a', { roughness: 0.2 })
    fenda.position.set(0.235, 0.18, s * 0.321)
    cabeca.add(fenda)
    const brilho = sphere(0.014, '#ffffff', { roughness: 0.1 })
    brilho.position.set(0.205, 0.21, s * 0.327)
    cabeca.add(brilho)

    const narina = sphere(0.03, '#2d321a', { roughness: 0.5 })
    narina.position.set(0.82, 0.13, s * 0.08)
    cabeca.add(narina)

    // linha da boca e dentes cerrados intercalados
    cabeca.add(limb(v(0.1, -0.135, s * 0.2), v(0.8, -0.135, s * 0.19), 0.016, GUM, { roughness: 0.5 }))
    for (let i = 0; i < 7; i++) {
      const x = 0.2 + i * 0.09
      const sup = cone(0.027, 0.075, TOOTH, { roughness: 0.3 })
      sup.rotation.x = Math.PI
      sup.position.set(x, -0.168, s * 0.205)
      cabeca.add(sup)
      if (i < 6) {
        const inf = cone(0.023, 0.06, TOOTH, { roughness: 0.3 })
        inf.position.set(x + 0.045, -0.103, s * 0.21)
        cabeca.add(inf)
      }
    }
  }
  // dentes da frente, em volta da vara
  for (const dz of [-0.14, -0.075, 0.075, 0.14]) {
    const sup = cone(0.024, 0.07, TOOTH, { roughness: 0.3 })
    sup.rotation.x = Math.PI
    sup.position.set(0.84, -0.165, dz)
    cabeca.add(sup)
  }
  t.add(cabeca)

  t.position.copy(TREX_POS)
  t.rotation.y = TREX_ROT
  return { trex: t, pernas, cabeca, bracinhos }
}

/** Notas e moedas que voaram da gaveta, espalhadas no chão. */
function makeMoney() {
  const g = new THREE.Group()
  const notas: [number, number, number, number][] = [
    [0, 0.006, 0, 0.4], [0.27, 0.012, 0.13, -0.35], [-0.24, 0.006, 0.2, 1.25],
  ]
  for (const [x, y, z, ry] of notas) {
    const nota = rbox(0.21, 0.008, 0.11, 0.003, '#a7d0a0', { roughness: 0.8 })
    nota.position.set(x, y, z)
    nota.rotation.set(0, ry, y > 0.01 ? 0.08 : 0)
    const miolo = rbox(0.13, 0.004, 0.06, 0.002, '#7fb07a', { roughness: 0.8 })
    miolo.position.y = 0.005
    nota.add(miolo)
    const retrato = cylinder(0.022, 0.022, 0.004, '#e6f0de', { roughness: 0.8 }, 16)
    retrato.position.set(0.05, 0.008, 0)
    nota.add(retrato)
    g.add(nota)
  }
  const moedas: [number, number, string][] = [
    [0.13, 0.29, '#c9ccd0'], [-0.09, -0.14, '#c9ccd0'], [0.42, -0.06, '#d1b062'], [-0.36, -0.02, '#c9ccd0'],
  ]
  for (const [x, z, cor] of moedas) {
    const moeda = cylinder(0.04, 0.04, 0.012, cor, { roughness: 0.3, metalness: 0.75 }, 20)
    moeda.position.set(x, 0.006, z)
    g.add(moeda)
  }
  g.position.set(1.22, GY, 1.4)
  return g
}

/** Anel de rosnado: arco cinza virado para a câmera. */
function growlArc(radius: number) {
  const geo = new THREE.TorusGeometry(radius, 0.024, 12, 40, 1.55)
  const m = new THREE.Mesh(geo, mat(GROWL, { roughness: 0.5 }))
  m.castShadow = true
  return m
}

// ---------------------------------------------------------------------------

function createScene(): CardScene {
  const root = new THREE.Group()

  const base = makeBase()
  root.add(base)

  const gondola = makeGondola()
  root.add(gondola)

  const carrinho = makeCart()
  root.add(carrinho)

  const { caixa, pernaE, pernaD } = makeRegister()
  root.add(caixa)

  const dinheiro = makeMoney()
  root.add(dinheiro)

  const { trex, pernas, cabeca, bracinhos } = makeTrex()
  root.add(trex)

  // ---- vara de bambu: da boca (pose final) até o topo da registradora tombada
  root.updateMatrixWorld(true)
  const boca = cabeca.localToWorld(v(0.84, -0.135, 0))
  const alvo = caixa.localToWorld(v(0.3, 0.0, 0.04))
  const dir = alvo.clone().sub(boca)
  const L = dir.length()
  dir.normalize()

  const vara = new THREE.Group()
  vara.position.copy(boca)
  vara.quaternion.setFromUnitVectors(v(0, -1, 0), dir)
  const DENTRO = 0.2 // trecho preso entre os dentes
  const colmo = cylinder(0.044, 0.048, L + DENTRO, BAMBOO, { roughness: 0.45 }, 24)
  colmo.position.y = (DENTRO - L) / 2
  vara.add(colmo)
  for (let y = -0.24; y > -L + 0.06; y -= 0.3) {
    const no = torus(0.047, 0.012, BAMBOO_NODE, { roughness: 0.5 })
    no.rotation.x = Math.PI / 2
    no.position.y = y
    vara.add(no)
  }
  // folhinha de bambu brotando de um nó
  for (const s of [-1, 1]) {
    const folha = sphere(0.05, '#7da653', { roughness: 0.6 })
    folha.scale.set(0.35, 1.9, 0.12)
    folha.position.set(s * 0.07, -0.6 + 0.04, 0.02)
    folha.rotation.z = s * -0.9
    vara.add(folha)
  }
  root.add(vara)

  // ---- anéis de rosnado saindo dos dentes ---------------------------------
  const centro = boca.clone().add(v(0.1, 0.06, 0.08))
  const cam = v(...CAM)
  const rosnado = new THREE.Group()
  rosnado.position.copy(centro)
  rosnado.lookAt(cam)
  rosnado.rotateZ(-0.25)
  for (const r of [0.22, 0.34, 0.46]) rosnado.add(growlArc(r))
  root.add(rosnado)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'mercado', object: base },
    { name: 'gondola', group: 'mercado', object: gondola },
    { name: 'carrinho', group: 'mercado', object: carrinho },
    { name: 'caixa', group: 'caixa', object: caixa },
    { name: 'pernaE', group: 'caixa', object: pernaE },
    { name: 'pernaD', group: 'caixa', object: pernaD },
    { name: 'dinheiro', group: 'vara', object: dinheiro },
    { name: 'trex', group: 'trex', object: trex },
    { name: 'pernas', group: 'trex', object: pernas },
    { name: 'cabeca', group: 'trex', object: cabeca },
    { name: 'bracinhos', group: 'trex', object: bracinhos },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'rosnado', group: 'rosnado', object: rosnado },
  ]

  /** Esperneio: encadeia rotações absolutas a partir de t0, de 'step' em 'step'. */
  const kicks = (part: string, t0: number, step: number, values: number[]): Sequence[] =>
    values.slice(1).map((to, i) =>
      seq(`${part}-chute-${t0}-${i}`, part, t0 + i * step, step, [ch('rotation.z', values[i], to)]),
    )

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build: Sequence[] = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um corredor de supermercado sobe do chão…',
    }),
    seq('gondola-rise', 'gondola', 0.25, 0.9, [riseFrom(0, 2.3)], { ease: 'easeOut' }),
    seq('carrinho-entra', 'carrinho', 1.5, 1.0, [ch('position.x', -4.2, CART_X)], {
      ease: 'easeOut',
      caption: '…o seu carrinho já está LOTADO — e nenhum caixa à vista.',
    }),

    seq('caixa-foge', 'caixa', 3.3, 1.2, [ch('position.x', 3.9, CAIXA_X_UP)], {
      ease: 'easeOut',
      caption: 'Aqui as registradoras criam perninhas e FOGEM pelos corredores. Você grita: VAR É…?',
    }),
    ...kicks('pernaE', 3.3, 0.24, [0.45, -0.45, 0.45, -0.45, 0.45, 0]),
    ...kicks('pernaD', 3.3, 0.24, [-0.45, 0.45, -0.45, 0.45, -0.45, 0]),

    seq('trex-rise', 'trex', 5.8, 1.0, [riseFrom(GY, 2.8)], {
      ease: 'easeOut',
      caption: 'Quem atende é o T-rex que patrulha os corredores — mas, com esses bracinhos, ele não alcança nada.',
    }),
    seq('cabeca-ergue', 'cabeca', 6.1, 0.8, [ch('rotation.z', 0.35, -0.12)], { ease: 'easeOut' }),
    seq('bracinhos-surge', 'bracinhos', 5.9, 0.8, grow(0.3), { ease: 'easeOut' }),
    ...kicks('bracinhos', 6.9, 0.22, [0, 0.55, -0.15, 0.55, -0.15, 0]),

    seq('vara-cresce', 'vara', 8.3, 0.8, [ch('scale.y', 0.02, 1)], {
      ease: 'easeOut',
      caption: 'Então ele morde uma VARA de bambu comprida, sai na CAÇA e prende a registradora fujona contra o chão!',
    }),
    seq('caixa-tomba', 'caixa', 8.85, 0.45, [
      ch('position.x', CAIXA_X_UP, CAIXA_X),
      ch('position.y', CAIXA_Y_UP, CAIXA_Y),
      ch('rotation.z', 0, TIP),
    ], { ease: 'easeIn' }),
    seq('dinheiro-espalha', 'dinheiro', 9.25, 0.4, grow(), { ease: 'easeOut' }),
    ...kicks('pernaE', 9.4, 0.2, [0, 0.5, -0.35, 0.5, -0.35, 0.5, -0.2]),
    ...kicks('pernaD', 9.45, 0.2, [0, -0.4, 0.45, -0.4, 0.45, -0.4, 0.25]),

    seq('rosnado-sai', 'rosnado', 10.8, 0.7, grow(0.2), {
      ease: 'easeOut',
      caption: 'Sem largar o bambu, ele rosna de dente cerrado: É CAÇA… NNN! A caça dele é O caixa.',
    }),
    seq('rosnado-pulsa', 'rosnado', 11.5, 0.35, [ch('scale.x', 1, 1.12), ch('scale.y', 1, 1.12)]),
    seq('rosnado-volta', 'rosnado', 11.85, 0.35, [ch('scale.x', 1.12, 1), ch('scale.y', 1.12, 1)]),

    seq('pernaE-assenta', 'pernaE', 13.2, 0.5, [ch('rotation.z', -0.2, 0)], {
      caption: 'Var är kassan? — Onde fica o caixa?',
    }),
    seq('pernaD-assenta', 'pernaD', 13.25, 0.5, [ch('rotation.z', 0.25, 0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [0.08, 1.2, 0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-ar-kassan',
    contexto:
      "Compras: em loja grande — IKEA, Clas Ohlson, loja de departamento, farmácia — quando você já pegou o que queria e não acha onde pagar. 'Kassan' é O caixa; 'kassa', sem o -n, é um caixa qualquer. O molde 'Var är ___?' serve pra tudo: toaletten, hissen (o elevador), utgången (a saída).",
    fraseFonte: 'Onde fica o caixa?',
    fraseAlvo: 'Var är kassan?',
    pronuncia:
      "var é KÁS-san? ('var' com A longo e R brando de 'caro', que já emenda no 'är': va-RÉ; 'är' = É aberto e curto; 'kassan' com a força no KÁS, A curto e aberto, SS de cobra — nunca Z —, e o -an final fraquinho, com N de língua, sem nasalizar)",
    ponteSonora:
      "VAR É... CAÇA-N? (4 sílabas: var-é-KÁS-san, saindo va-ré-KÁS-san; força principal no CÁ; VAR = a VARA sem o -a, a MESMA VARA de 'Var kan jag köpa biljett?', 'Var bor du?' e 'Var ska jag byta?' — R BRANDO de 'caro' e AUDÍVEL, que já escorrega no É: va-RÉ; sem ele sobra VÁ É, que é 'vad är' (o que é?), e a pergunta muda; É = 'är', aberto e curto, o mesmo de 'Jag är' e 'Det är'; CAÇA = a caça do T-rex, que o português já fala do jeito certo: força no CÁ, A aberto, Ç de cobra — nunca o Z de 'casa', que daria 'kasa'; o N do fim é o rosnado de dente cerrado, NNN, com a ponta da língua colada atrás dos dentes de cima: é ele que transforma 'kassa' (um caixa) em 'kassan' (O caixa); sem nasalizar o A — nada de 'caçã')",
    historia:
      'Carrinho lotado e nenhum caixa à vista: neste mercado as registradoras criam perninhas e fogem pelos corredores. Você grita VAR É...? e quem atende é o T-rex que patrulha os corredores — mas, com aqueles bracinhos, ele não alcança nada. Então morde uma VARA de bambu comprida e sai na CAÇA: prende a registradora fujona contra o chão com a ponta da vara e rosna de dente cerrado, sem largar o bambu: É CAÇA... NNN! A caça dele é o caixa — siga a vara e pague ali.',
  },
  createScene,
  refine: { organic: ['trex', 'pernas', 'cabeca', 'bracinhos'] },
}

export default card
