import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Ta på dig jackan!" — TÁ, PÔ! DÊI… IÁK-KAN!
 *
 * Dez graus abaixo de zero e o quati recém-chegado de Foz do Iguaçu quer sair
 * de bermuda e chinelo. Vê o casaco chegando e resmunga TÁ, PÔ!; a mãe enfia o
 * casaco pela cabeça dele, dois tapinhas, DÊI! — e o casaco é uma JACA
 * inteira, oca e espinhenta, com dois furos pros bracinhos (IÁK-KAN).
 *
 * Diorama: hallen sueca de piso claro, porta vermelho-falu entreaberta com
 * neve lá fora, lambri cinza-azulado, cabideiro com gorro e luvas (e o gancho
 * vazio do casaco), sapateira com botinhas amarelas; o quati no centro, de
 * jaca, cauda listrada erguida, e três gomos caídos no chão. O verde-limão da
 * jaca é o único acento saturado.
 */

const PISO = '#dcc199'
const PISO_RIPA = '#d0b184'
const PISO_BORDA = '#9c7a52'
const PAREDE = '#ece6da'
const LAMBRI = '#b9c7cb'
const LAMBRI_SULCO = '#a3b3b8'
const BRANCO = '#f4f1ea'
const CARVALHO = '#c4925a'
const CAPACHO = '#74787c'
const CAPACHO_BORDA = '#56595d'
const PORTA = '#93362a' // vermelho-falu
const PORTA_ESC = '#7c2c22'
const LATAO = '#c9a250'
const CEU = '#cfe2f1'
const NEVE = '#f3f7fa'
const PINHEIRO = '#2f5a45'
const GORRO = '#3d6db3'
const GORRO_ESC = '#2f5893'
const LA_CRU = '#f1ece1'
const BOTA = '#dda83a'
const SOLA = '#4a4440'

const PELO = '#b46f30'
const PELO_CLARO = '#d9a768'
const PELO_CARA = '#7d4a27'
const PELO_ESC = '#4a2e1c'
const PATA = '#35221a'
const MARCA = '#ecdcc0' // manchas claras da cara do quati
const NARIZ = '#1e1613'
const CAUDA_ESC = '#3b2416'
const BERMUDA = '#26a19b'
const BERMUDA_ESC = '#1b7f7a'
const CHINELO = '#3f8d4c'
const TIRA = '#f0d24a'

const JACA = '#93c53a' // acento saturado RESERVADO: a JACA (IÁK-KAN)
const JACA_PONTA = '#b4d54c'
const JACA_ESC = '#6f9a2b'
const POLPA = '#f2d880'
const GOMO = '#f5bf3a'
const GOMO_ESC = '#dc9b22'

const FY = 0.12 // topo do assoalho

// parede do fundo e a porta (espaço da parede: origem no piso, centro da espessura)
const WALL_Z = -1.25
const WALL_H = 2.45
const DOOR_X0 = -1.55
const DOOR_X1 = -0.65
const DOOR_H = 2.0
const DOOR_OPEN = -0.85

// quati (espaço local: pés na origem, olhando para +z)
const QX = -0.08
const QZ = 0.12
const QROT = 0.28
const JY = 0.93 // centro da jaca
const JA = 0.36 // semieixos da jaca
const JB = 0.47
const JC = 0.34
const HEAD_Y = 1.55
const HEAD_Z = 0.04
const HEAD_YAW = 0.5 // cabeça em 3/4: o focinho comprido de perfil
const HEAD_X_FINAL = 0.17 // olha pra baixo, pra jaca
const HEAD_Z_FINAL = -0.06
const HEAD_X_REVIRA = -0.42
const HEAD_Z_REVIRA = 0.16
const ARM_Y = 1.06 // altura dos furos dos bracinhos
const ARM_Z = 0.04
const ARM_IN = 0.28 // bracinhos recolhidos dentro da jaca (scale.x)
const TAIL_BASE: [number, number, number] = [0.06, 0.5, -0.2]
const TAIL_DROOP_Z = -1.1
const TAIL_DROOP_X = -0.3

const CAM: [number, number, number] = [0.5, 1.82, 3.65]
const TARGET: [number, number, number] = [-0.02, 1.06, -0.15]

type V3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)
const FWD = new THREE.Vector3(0, 0, 1)

/** Cápsula de a até b — membros, cauda. */
function limb(r: number, a: V3 | THREE.Vector3, b: V3 | THREE.Vector3, color: string, opts?: MatOpts) {
  const va = Array.isArray(a) ? new THREE.Vector3(...a) : a.clone()
  const vb = Array.isArray(b) ? new THREE.Vector3(...b) : b.clone()
  const dir = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, dir.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/** Normal da superfície da jaca (elipsoide) num ponto local dela. */
function jacaNormal(p: THREE.Vector3) {
  return new THREE.Vector3(p.x / (JA * JA), p.y / (JB * JB), p.z / (JC * JC)).normalize()
}

/** Ponto da superfície da jaca na altura y, na direção (sx, sz) do plano xz. */
function jacaSurface(y: number, sx: number, sz: number) {
  const k = Math.sqrt(Math.max(0, 1 - (y / JB) ** 2))
  const ang = Math.atan2(sz, sx)
  return new THREE.Vector3(Math.cos(ang) * JA * k, y, Math.sin(ang) * JC * k)
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- piso de tábuas claras + capacho ---------------------------------------
  const base = new THREE.Group()

  const disco = cylinder(2.62, 2.7, 0.12, PISO_BORDA, { roughness: 0.7 })
  disco.position.y = 0.06
  base.add(disco)

  const W = 0.34
  for (let i = -8; i <= 8; i++) {
    const z = i * W
    const half = Math.sqrt(Math.max(0, 2.58 * 2.58 - (Math.abs(z) + W / 2) ** 2))
    if (half < 0.2) continue
    const cut = -half + (0.3 + rand() * 0.4) * half * 2
    for (const [x0, x1, tone] of [
      [-half, cut - 0.008, i % 2 === 0 ? PISO : PISO_RIPA],
      [cut + 0.008, half, i % 2 === 0 ? PISO_RIPA : PISO],
    ] as const) {
      const ripa = rbox(x1 - x0, 0.014, W - 0.016, 0.006, tone, { roughness: 0.6 })
      ripa.position.set((x0 + x1) / 2, FY + 0.007, z)
      base.add(ripa)
    }
  }

  // capacho cinza na frente da porta
  const doorCX = (DOOR_X0 + DOOR_X1) / 2
  const capacho = new THREE.Group()
  capacho.position.set(doorCX + 0.05, FY + 0.014, WALL_Z + 0.48)
  base.add(capacho)
  const borda = rbox(1.0, 0.024, 0.6, 0.012, CAPACHO_BORDA, { roughness: 0.95 })
  borda.position.y = 0.012
  capacho.add(borda)
  const miolo = rbox(0.86, 0.028, 0.46, 0.012, CAPACHO, { roughness: 0.97 })
  miolo.position.y = 0.014
  capacho.add(miolo)
  for (let k = -3; k <= 3; k++) {
    const friso = rbox(0.82, 0.006, 0.018, 0.003, CAPACHO_BORDA, { roughness: 0.97 })
    friso.position.set(0, 0.029, k * 0.06)
    capacho.add(friso)
  }

  // neve que entrou pela fresta: montinhos no capacho e na soleira
  for (const [x, z, r] of [
    [-0.78, -1.0, 0.11], [-0.62, -0.92, 0.08], [-0.9, -0.86, 0.07], [-0.7, -0.74, 0.05], [-0.5, -0.8, 0.045],
  ] as const) {
    const monte = sphere(r, NEVE, { roughness: 0.5, detail: 0.4 })
    monte.scale.set(1.3, 0.32, 1)
    monte.position.set(x, FY + 0.03, z)
    base.add(monte)
  }

  root.add(base)

  // ---- parede com lambri, porta e o inverno lá fora -------------------------
  const parede = new THREE.Group()
  parede.position.set(0, FY, WALL_Z)
  root.add(parede)

  const WX0 = -1.95
  const WX1 = 1.95
  for (const [x0, x1, y0, y1] of [
    [WX0, DOOR_X0, 0, WALL_H],
    [DOOR_X1, WX1, 0, WALL_H],
    [DOOR_X0, DOOR_X1, DOOR_H, WALL_H],
  ] as const) {
    const painel = rbox(x1 - x0, y1 - y0, 0.14, 0.01, PAREDE, { roughness: 0.9 })
    painel.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0)
    parede.add(painel)
  }

  // lambri (pärlspont) de 0 a 0.95, rodapé e moldura de cadeira
  for (const [x0, x1] of [[WX0, DOOR_X0 - 0.1], [DOOR_X1 + 0.1, WX1]] as const) {
    const lambri = rbox(x1 - x0, 0.92, 0.02, 0.006, LAMBRI, { roughness: 0.6 })
    lambri.position.set((x0 + x1) / 2, 0.5, 0.08)
    parede.add(lambri)
    for (let x = x0 + 0.11; x < x1 - 0.05; x += 0.11) {
      const sulco = rbox(0.012, 0.8, 0.006, 0.003, LAMBRI_SULCO, { roughness: 0.6 })
      sulco.position.set(x, 0.52, 0.091)
      parede.add(sulco)
    }
    const friso = rbox(x1 - x0, 0.05, 0.05, 0.015, BRANCO, { roughness: 0.4 })
    friso.position.set((x0 + x1) / 2, 0.97, 0.09)
    parede.add(friso)
    const rodape = rbox(x1 - x0, 0.11, 0.04, 0.012, BRANCO, { roughness: 0.4 })
    rodape.position.set((x0 + x1) / 2, 0.055, 0.1)
    parede.add(rodape)
  }

  // moldura branca da porta e soleira de carvalho
  for (const x of [DOOR_X0 - 0.05, DOOR_X1 + 0.05]) {
    const umbral = rbox(0.1, DOOR_H + 0.08, 0.2, 0.02, BRANCO, { roughness: 0.4 })
    umbral.position.set(x, (DOOR_H + 0.08) / 2, 0)
    parede.add(umbral)
  }
  const verga = rbox(DOOR_X1 - DOOR_X0 + 0.24, 0.11, 0.21, 0.02, BRANCO, { roughness: 0.4 })
  verga.position.set(doorCX, DOOR_H + 0.05, 0)
  parede.add(verga)
  const soleira = rbox(DOOR_X1 - DOOR_X0, 0.035, 0.22, 0.01, CARVALHO, { roughness: 0.55 })
  soleira.position.set(doorCX, 0.0175, 0)
  parede.add(soleira)

  // lá fora: céu frio, chão de neve e um pinheiro nevado
  const ceu = rbox(1.3, 2.4, 0.04, 0.01, CEU, { roughness: 0.8, emissive: '#c4dcf0', emissiveIntensity: 0.75 })
  ceu.position.set(doorCX, 1.2, -0.62)
  parede.add(ceu)
  const chaoNeve = rbox(1.3, 0.08, 0.6, 0.03, NEVE, { roughness: 0.6, emissive: '#e8f0f7', emissiveIntensity: 0.35, detail: 0 })
  chaoNeve.position.set(doorCX, 0.04, -0.36)
  parede.add(chaoNeve)
  for (const [x, z, r] of [[-1.3, -0.2, 0.2], [-0.85, -0.25, 0.16], [-1.05, -0.4, 0.22]] as const) {
    const duna = sphere(r, NEVE, { roughness: 0.6, emissive: '#e8f0f7', emissiveIntensity: 0.35, detail: 0 })
    duna.scale.set(1.4, 0.45, 1)
    duna.position.set(x, 0.08, z)
    parede.add(duna)
  }
  const pinheiro = new THREE.Group()
  pinheiro.position.set(-0.86, 0.08, -0.48)
  parede.add(pinheiro)
  for (const [y, r, h] of [[0.35, 0.3, 0.6], [0.75, 0.24, 0.5], [1.1, 0.17, 0.42]] as const) {
    const copa = cone(r, h, PINHEIRO, { roughness: 0.85 }, 10)
    copa.position.y = y
    pinheiro.add(copa)
    const capa = cone(r * 0.62, h * 0.4, NEVE, { roughness: 0.6, emissive: '#e8f0f7', emissiveIntensity: 0.3, detail: 0 }, 10)
    capa.position.y = y + h * 0.3
    pinheiro.add(capa)
  }
  // quadrinho das Cataratas do Iguaçu, a saudade do quati
  const quadro = new THREE.Group()
  quadro.position.set(1.32, 2.1, 0.085)
  quadro.rotation.z = -0.03
  parede.add(quadro)
  const moldura = rbox(0.46, 0.34, 0.03, 0.012, CARVALHO, { roughness: 0.5 })
  quadro.add(moldura)
  for (const [h, y, cor] of [
    [0.05, 0.105, '#8fc4e8'], // céu
    [0.07, 0.045, '#3c7a40'], // mata no alto do paredão
    [0.1, -0.04, '#8a5a3a'], // paredão de pedra
    [0.04, -0.11, '#3f8fa8'], // rio lá embaixo
  ] as const) {
    const faixa = rbox(0.38, h, 0.012, 0.004, cor, { roughness: 0.6 })
    faixa.position.set(0, y, 0.017)
    quadro.add(faixa)
  }
  for (let k = 0; k < 5; k++) {
    const queda = rbox(0.04, 0.13, 0.006, 0.003, '#ffffff', { roughness: 0.5 })
    queda.position.set(-0.14 + k * 0.07, -0.045, 0.025)
    quadro.add(queda)
    const nevoa = sphere(0.03, '#ffffff', { roughness: 0.6, detail: 0 }, 10)
    nevoa.scale.set(1.2, 0.6, 0.25)
    nevoa.position.set(-0.14 + k * 0.07, -0.108, 0.026)
    quadro.add(nevoa)
  }

  // flocos caindo na fresta
  for (let k = 0; k < 14; k++) {
    const floco = sphere(0.016 + rand() * 0.012, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 }, 8)
    floco.position.set(DOOR_X0 + 0.25 + rand() * 0.75, 0.25 + rand() * 1.6, -0.3 + rand() * 0.45)
    parede.add(floco)
  }

  // ---- porta vermelho-falu, entreaberta --------------------------------------
  const porta = new THREE.Group()
  porta.position.set(DOOR_X0 + 0.01, FY + 0.035, WALL_Z + 0.04)
  porta.rotation.y = DOOR_OPEN
  root.add(porta)

  const DW = DOOR_X1 - DOOR_X0 - 0.03
  const folha = rbox(DW, DOOR_H - 0.06, 0.06, 0.02, PORTA, { roughness: 0.5 })
  folha.position.set(DW / 2, (DOOR_H - 0.06) / 2, 0)
  porta.add(folha)
  // almofadas em relevo (baixo) e janelinha (alto), nas duas faces
  for (const face of [-1, 1]) {
    const almofada = rbox(DW - 0.24, 0.72, 0.02, 0.02, PORTA_ESC, { roughness: 0.55 })
    almofada.position.set(DW / 2, 0.5, face * 0.035)
    porta.add(almofada)
    const almofadaIn = rbox(DW - 0.34, 0.62, 0.02, 0.02, PORTA, { roughness: 0.5 })
    almofadaIn.position.set(DW / 2, 0.5, face * 0.045)
    porta.add(almofadaIn)
    const caixilho = rbox(DW - 0.24, 0.62, 0.02, 0.02, PORTA_ESC, { roughness: 0.55 })
    caixilho.position.set(DW / 2, 1.42, face * 0.035)
    porta.add(caixilho)
  }
  const vidro = rbox(DW - 0.36, 0.5, 0.075, 0.01, CEU, { roughness: 0.2, emissive: '#c4dcf0', emissiveIntensity: 0.55 })
  vidro.position.set(DW / 2, 1.42, 0)
  porta.add(vidro)
  const travessa = rbox(0.035, 0.5, 0.085, 0.01, BRANCO, { roughness: 0.4 })
  travessa.position.set(DW / 2, 1.42, 0)
  porta.add(travessa)
  // maçaneta de latão (lado de dentro) e dobradiças
  const espelho = rbox(0.055, 0.2, 0.016, 0.012, LATAO, { roughness: 0.3, metalness: 0.8 })
  espelho.position.set(DW - 0.09, 1.0, 0.04)
  porta.add(espelho)
  const alavanca = cylinder(0.016, 0.016, 0.13, LATAO, { roughness: 0.3, metalness: 0.8 })
  alavanca.rotation.z = Math.PI / 2
  alavanca.position.set(DW - 0.14, 1.04, 0.085)
  porta.add(alavanca)
  const haste = cylinder(0.014, 0.014, 0.05, LATAO, { roughness: 0.3, metalness: 0.8 })
  haste.rotation.x = Math.PI / 2
  haste.position.set(DW - 0.09, 1.04, 0.06)
  porta.add(haste)
  for (const y of [0.3, 1.6]) {
    const dobradica = cylinder(0.02, 0.02, 0.12, '#8e959b', { roughness: 0.3, metalness: 0.7 })
    dobradica.position.set(0.0, y, 0.0)
    porta.add(dobradica)
  }
  // neve grudada no pé da porta
  const neveFolha = rbox(DW - 0.05, 0.03, 0.08, 0.015, NEVE, { roughness: 0.5, detail: 0.4 })
  neveFolha.position.set(DW / 2, 0.015, 0.0)
  porta.add(neveFolha)

  // ---- cabideiro: gorro de pompom, luvas e o gancho vazio do casaco ----------
  const cabideiro = new THREE.Group()
  cabideiro.position.set(1.33, FY + 1.62, WALL_Z + 0.095)
  root.add(cabideiro)

  const tabua = rbox(0.86, 0.12, 0.05, 0.02, BRANCO, { roughness: 0.45 })
  cabideiro.add(tabua)
  for (const sx of [-0.38, 0.38]) {
    const parafuso = cylinder(0.012, 0.012, 0.01, '#b9bec2', { roughness: 0.3, metalness: 0.7 })
    parafuso.rotation.x = Math.PI / 2
    parafuso.position.set(sx, 0, 0.028)
    cabideiro.add(parafuso)
  }
  const PEGS = [-0.3, -0.1, 0.1, 0.3]
  for (const px of PEGS) {
    const pino = cylinder(0.017, 0.02, 0.13, CARVALHO, { roughness: 0.5 })
    pino.rotation.x = Math.PI / 2 - 0.25
    pino.position.set(px, -0.01, 0.085)
    cabideiro.add(pino)
    const bola = sphere(0.031, CARVALHO, { roughness: 0.5 })
    bola.position.set(px, 0.01, 0.15)
    cabideiro.add(bola)
  }

  // gorro azul pendurado no pino, meio de lado, pompom em cima
  const gorro = new THREE.Group()
  gorro.position.set(PEGS[0], -0.11, 0.1)
  gorro.rotation.set(0.12, 0.3, 0.22)
  cabideiro.add(gorro)
  const copaGorro = lathe(
    [[0.12, 0.05], [0.128, 0.1], [0.122, 0.15], [0.1, 0.2], [0.065, 0.235], [0, 0.248]],
    GORRO,
    { roughness: 0.92 },
  )
  gorro.add(copaGorro)
  const barra = cylinder(0.132, 0.13, 0.07, GORRO_ESC, { roughness: 0.92 })
  barra.position.y = 0.035
  gorro.add(barra)
  const fundo = cylinder(0.12, 0.12, 0.01, '#24477a', { roughness: 0.95 })
  fundo.position.y = 0.002
  gorro.add(fundo)
  for (let k = 0; k < 3; k++) {
    const listra = torus(0.124, 0.008, LA_CRU, { roughness: 0.92 })
    listra.rotation.x = Math.PI / 2
    listra.position.y = 0.12 + k * 0.035
    listra.scale.setScalar(1 - k * 0.09)
    gorro.add(listra)
  }
  const pompom = puff(0.06, LA_CRU, 6, 9, { roughness: 0.95 })
  pompom.position.y = 0.29
  gorro.add(pompom)

  // luvas de lã penduradas por um cordão
  for (const side of [-1, 1]) {
    cabideiro.add(limb(0.005, [PEGS[1], 0.0, 0.14], [PEGS[1] + side * 0.07, -0.125, 0.13], LA_CRU, { roughness: 0.9 }))
  }
  for (const side of [-1, 1]) {
    const luva = new THREE.Group()
    luva.position.set(PEGS[1] + side * 0.075, -0.2, 0.13)
    luva.rotation.z = side * 0.12
    cabideiro.add(luva)
    const mao = rbox(0.09, 0.13, 0.04, 0.035, GORRO, { roughness: 0.92 })
    luva.add(mao)
    const dedao = capsule(0.019, 0.04, GORRO, { roughness: 0.92 })
    dedao.position.set(-side * 0.052, -0.005, 0)
    dedao.rotation.z = side * 0.5
    luva.add(dedao)
    const punho = rbox(0.094, 0.04, 0.046, 0.015, LA_CRU, { roughness: 0.92 })
    punho.position.y = 0.075
    luva.add(punho)
    for (let k = 0; k < 3; k++) {
      const floco = rbox(0.05, 0.009, 0.006, 0.003, LA_CRU, { roughness: 0.9 })
      floco.rotation.z = (k * Math.PI) / 3
      floco.position.set(0, -0.015, 0.022)
      luva.add(floco)
    }
  }

  // ---- sapateira baixa com botinhas de neve amarelas -------------------------
  const sapateira = new THREE.Group()
  sapateira.position.set(1.22, FY, WALL_Z + 0.27)
  root.add(sapateira)

  const tampoSap = rbox(0.92, 0.04, 0.34, 0.015, CARVALHO, { roughness: 0.55 })
  tampoSap.position.y = 0.38
  sapateira.add(tampoSap)
  for (const sx of [-0.43, 0.43]) {
    const lateral = rbox(0.04, 0.36, 0.32, 0.012, BRANCO, { roughness: 0.45 })
    lateral.position.set(sx, 0.18, 0)
    sapateira.add(lateral)
  }
  const prateleira = rbox(0.84, 0.025, 0.3, 0.01, BRANCO, { roughness: 0.45 })
  prateleira.position.y = 0.06
  sapateira.add(prateleira)
  const fundoSap = rbox(0.84, 0.34, 0.02, 0.008, BRANCO, { roughness: 0.45 })
  fundoSap.position.set(0, 0.2, -0.15)
  sapateira.add(fundoSap)
  // pantufas cinzentas na prateleira de baixo
  for (const sx of [-0.12, 0.08]) {
    const pantufa = rbox(0.11, 0.06, 0.22, 0.04, '#8b98a3', { roughness: 0.92 })
    pantufa.position.set(sx, 0.105, 0.02)
    pantufa.rotation.y = (rand() - 0.5) * 0.3
    sapateira.add(pantufa)
  }

  for (const [bx, rot] of [[-0.2, 0.25], [0.15, -0.12]] as const) {
    const bota = new THREE.Group()
    bota.position.set(bx, 0.4, 0.0)
    bota.rotation.y = rot
    sapateira.add(bota)
    const sola = rbox(0.13, 0.035, 0.25, 0.015, SOLA, { roughness: 0.8 })
    sola.position.set(0, 0.0175, 0.02)
    bota.add(sola)
    const pe = rbox(0.12, 0.1, 0.23, 0.048, BOTA, { roughness: 0.35 })
    pe.position.set(0, 0.075, 0.025)
    bota.add(pe)
    const cano = cylinder(0.064, 0.068, 0.2, BOTA, { roughness: 0.35 })
    cano.position.set(0, 0.17, -0.04)
    bota.add(cano)
    const pelucia = torus(0.064, 0.026, LA_CRU, { roughness: 0.95 })
    pelucia.rotation.x = Math.PI / 2
    pelucia.position.set(0, 0.272, -0.04)
    bota.add(pelucia)
    const biqueira = rbox(0.125, 0.04, 0.06, 0.02, SOLA, { roughness: 0.7 })
    biqueira.position.set(0, 0.045, 0.125)
    bota.add(biqueira)
  }

  // ---- QUATI de Foz do Iguaçu ------------------------------------------------
  const quati = new THREE.Group()
  quati.position.set(QX, FY, QZ)
  quati.rotation.y = QROT
  root.add(quati)

  for (const side of [-1, 1]) {
    const x = side * 0.115
    quati.add(limb(0.07, [x, 0.08, 0.05], [side * 0.12, 0.44, 0], PELO_ESC, { roughness: 0.85 }))
    const coxa = sphere(0.1, PELO, { roughness: 0.85 })
    coxa.position.set(side * 0.12, 0.46, 0)
    quati.add(coxa)
    const pe = sphere(0.07, PATA, { roughness: 0.7 })
    pe.scale.set(1, 0.6, 1.5)
    pe.position.set(x, 0.072, 0.07)
    quati.add(pe)
    for (let k = 0; k < 4; k++) {
      const dedo = sphere(0.022, PATA, { roughness: 0.7 })
      dedo.position.set(x - 0.045 + k * 0.03, 0.05, 0.168)
      quati.add(dedo)
    }
  }
  const pelve = sphere(0.22, PELO, { roughness: 0.85 })
  pelve.scale.set(1.05, 0.8, 0.95)
  pelve.position.y = 0.58
  quati.add(pelve)
  const tronco = capsule(0.2, 0.3, PELO, { roughness: 0.85 })
  tronco.position.y = 0.93
  quati.add(tronco)
  const barriga = sphere(0.19, PELO_CLARO, { roughness: 0.85 })
  barriga.scale.set(1, 1.1, 0.7)
  barriga.position.set(0, 0.86, 0.1)
  quati.add(barriga)
  quati.add(limb(0.1, [0, 1.2, 0], [0, 1.44, HEAD_Z], PELO, { roughness: 0.85 }))

  // ---- bermuda turquesa e chinelos (roupa de Foz) ----------------------------
  const roupa = new THREE.Group()
  quati.add(roupa)

  const quadril = lathe(
    [[0, 0.42], [0.12, 0.43], [0.2, 0.46], [0.245, 0.52], [0.258, 0.6], [0.252, 0.7], [0, 0.7]],
    BERMUDA,
    { roughness: 0.8 },
  )
  roupa.add(quadril)
  const cos = torus(0.252, 0.024, BERMUDA_ESC, { roughness: 0.8 })
  cos.rotation.x = Math.PI / 2
  cos.position.y = 0.69
  roupa.add(cos)
  for (const side of [-1, 1]) {
    const perna = cylinder(0.1, 0.114, 0.21, BERMUDA, { roughness: 0.8 })
    perna.position.set(side * 0.125, 0.385, 0)
    roupa.add(perna)
    const barraB = torus(0.112, 0.016, BERMUDA_ESC, { roughness: 0.8 })
    barraB.rotation.x = Math.PI / 2
    barraB.position.set(side * 0.125, 0.29, 0)
    roupa.add(barraB)
    const cordinha = capsule(0.008, 0.07, LA_CRU, { roughness: 0.7 })
    cordinha.position.set(side * 0.025, 0.64, 0.245)
    cordinha.rotation.z = side * 0.2
    roupa.add(cordinha)
  }
  // flores de praia estampadas nas pernas da bermuda
  for (const [sx, y, a] of [[-1, 0.4, 0.4], [1, 0.36, -0.3], [1, 0.45, 0.9], [-1, 0.33, -0.8]] as const) {
    const flor = new THREE.Group()
    const ang = a
    flor.position.set(sx * 0.125 + Math.sin(ang) * 0.108, y, Math.cos(ang) * 0.108)
    flor.quaternion.setFromUnitVectors(FWD, new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang)))
    roupa.add(flor)
    for (let p = 0; p < 5; p++) {
      const petala = sphere(0.014, LA_CRU, { roughness: 0.8 }, 10)
      petala.scale.z = 0.4
      const pa = (p / 5) * Math.PI * 2
      petala.position.set(Math.cos(pa) * 0.016, Math.sin(pa) * 0.016, 0)
      flor.add(petala)
    }
    const miolo = sphere(0.01, TIRA, { roughness: 0.6 }, 10)
    miolo.scale.z = 0.5
    miolo.position.z = 0.004
    flor.add(miolo)
  }
  for (const side of [-1, 1]) {
    const x = side * 0.115
    const solaC = rbox(0.16, 0.03, 0.31, 0.014, CHINELO, { roughness: 0.6 })
    solaC.position.set(x, 0.015, 0.06)
    roupa.add(solaC)
    const filete = rbox(0.164, 0.008, 0.314, 0.004, TIRA, { roughness: 0.6 })
    filete.position.set(x, 0.026, 0.06)
    roupa.add(filete)
    const pino = new THREE.Vector3(x, 0.07, 0.15)
    for (const s of [-1, 1]) {
      roupa.add(limb(0.013, pino, [x + s * 0.072, 0.07, 0.04], TIRA, { roughness: 0.5 }))
    }
  }

  // ---- cabeça: focinho comprido, manchas claras, cara emburrada --------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, HEAD_Y, HEAD_Z)
  cabeca.rotation.set(HEAD_X_FINAL, HEAD_YAW, HEAD_Z_FINAL)
  cabeca.scale.setScalar(1.22)
  quati.add(cabeca)

  const cranio = sphere(0.15, PELO_CARA, { roughness: 0.85 })
  cranio.scale.set(0.95, 0.88, 1.12)
  cabeca.add(cranio)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.072, PELO_CARA, { roughness: 0.85 })
    bochecha.position.set(side * 0.072, -0.055, 0.06)
    cabeca.add(bochecha)
  }
  // focinho comprido, afinando e virado pra cima na ponta
  cabeca.add(limb(0.058, [0, -0.04, 0.06], [0, -0.05, 0.21], PELO_ESC, { roughness: 0.8 }))
  cabeca.add(limb(0.04, [0, -0.05, 0.2], [0, -0.043, 0.36], PELO_ESC, { roughness: 0.8 }))
  cabeca.add(limb(0.029, [0, -0.043, 0.35], [0, -0.012, 0.48], PELO_ESC, { roughness: 0.8 }))
  const nariz = sphere(0.03, NARIZ, { roughness: 0.35 })
  nariz.scale.set(1.25, 1, 0.55)
  nariz.position.set(0, -0.004, 0.505)
  nariz.rotation.x = -0.4
  cabeca.add(nariz)
  for (const side of [-1, 1]) {
    const narina = sphere(0.008, '#0a0706', { roughness: 0.4 }, 10)
    narina.position.set(side * 0.014, -0.002, 0.522)
    cabeca.add(narina)
    // orelhas pequenas e redondas, de borda clara
    const orelha = sphere(0.036, PELO_CARA, { roughness: 0.85 })
    orelha.scale.set(1, 1, 0.45)
    orelha.position.set(side * 0.1, 0.112, -0.05)
    orelha.rotation.z = -side * 0.45
    cabeca.add(orelha)
    const orelhaIn = sphere(0.022, MARCA, { roughness: 0.85 })
    orelhaIn.scale.set(1, 1, 0.35)
    orelhaIn.position.set(side * 0.102, 0.112, -0.035)
    orelhaIn.rotation.z = -side * 0.45
    cabeca.add(orelhaIn)
  }
  // olhos semicerrados olhando pra baixo
  for (const side of [-1, 1]) {
    const esclera = sphere(0.04, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.62
    esclera.position.set(side * 0.072, 0.028, 0.13)
    const pupila = sphere(0.021, '#141010', { roughness: 0.2 })
    pupila.position.set(side * 0.07, 0.012, 0.152)
    const brilho = sphere(0.007, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.8 }, 10)
    brilho.position.set(side * 0.063, 0.02, 0.168)
    const palpebra = sphere(0.043, PELO_CARA, { roughness: 0.85 })
    palpebra.scale.set(1.04, 0.52, 0.66)
    palpebra.position.set(side * 0.072, 0.05, 0.132)
    palpebra.rotation.z = side * 0.32
    cabeca.add(esclera, pupila, brilho, palpebra)
    // as manchas claras do quati, por cima dos olhos, viram sobrancelhas franzidas
    const sobr = capsule(0.0095, 0.04, MARCA, { roughness: 0.8 })
    sobr.rotation.z = Math.PI / 2 + side * 0.45
    sobr.position.set(side * 0.074, 0.088, 0.135)
    cabeca.add(sobr)
    const sob = sphere(0.022, MARCA, { roughness: 0.8 })
    sob.scale.set(1.3, 0.5, 0.45)
    sob.position.set(side * 0.072, -0.024, 0.138)
    cabeca.add(sob)
  }
  // beiço emburrado
  const beico = capsule(0.012, 0.045, '#2a1a14', { roughness: 0.6 })
  beico.rotation.z = Math.PI / 2
  beico.position.set(0, -0.1, 0.16)
  cabeca.add(beico)

  // ---- bracinhos saindo pelos furos da jaca ---------------------------------
  // pivô no eixo do corpo, na altura dos furos: scale.x recolhe os dois pra dentro
  const bracos = new THREE.Group()
  bracos.position.set(0, ARM_Y, ARM_Z)
  quati.add(bracos)
  const holeL = jacaSurface(ARM_Y - JY, 1, ARM_Z) // espaço da jaca
  for (const side of [-1, 1]) {
    const ombro = new THREE.Vector3(side * 0.18, 0.09, -0.04)
    const furo = new THREE.Vector3(side * holeL.x, 0, 0)
    const patinha = new THREE.Vector3(side * 0.56, -0.2, 0.08)
    bracos.add(limb(0.058, ombro, furo, PELO, { roughness: 0.85 }))
    bracos.add(limb(0.054, furo, patinha, PELO, { roughness: 0.85 }))
    const cotovelo = sphere(0.058, PELO, { roughness: 0.85 })
    cotovelo.position.copy(furo)
    bracos.add(cotovelo)
    const dir = patinha.clone().sub(furo).normalize()
    const mao = sphere(0.064, PATA, { roughness: 0.7 })
    mao.scale.set(1, 0.85, 1.1)
    mao.position.copy(patinha).addScaledVector(dir, 0.03)
    bracos.add(mao)
    for (let k = -1; k <= 1; k++) {
      const dedo = sphere(0.021, PATA, { roughness: 0.7 }, 12)
      dedo.position.copy(patinha).addScaledVector(dir, 0.085).add(new THREE.Vector3(0, k * 0.03, 0.02))
      bracos.add(dedo)
    }
  }

  // ---- cauda longa listrada, erguida ----------------------------------------
  const cauda = new THREE.Group()
  cauda.position.set(...TAIL_BASE)
  quati.add(cauda)
  {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.15, 0.1, -0.2),
      new THREE.Vector3(0.46, 0.32, -0.3),
      new THREE.Vector3(0.7, 0.64, -0.28),
      new THREE.Vector3(0.8, 0.98, -0.2),
      new THREE.Vector3(0.76, 1.24, -0.1),
      new THREE.Vector3(0.64, 1.34, -0.03),
      new THREE.Vector3(0.55, 1.28, 0.0),
    ])
    const N = 15
    const pts = curva.getSpacedPoints(N)
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const r = 0.08 - t * 0.042
      const cor = i % 2 === 0 ? PELO : CAUDA_ESC
      cauda.add(limb(r, pts[i], pts[i + 1], cor, { roughness: 0.88 }))
    }
  }

  // ---- a JACA: oca, verde, espinhenta, vestida no tronco ---------------------
  const jaca = new THREE.Group()
  jaca.position.set(0, JY, 0)
  quati.add(jaca)

  const casca = sphere(1, JACA, { roughness: 0.62, size: 0.8 })
  casca.scale.set(JA, JB, JC)
  jaca.add(casca)

  // furos: gola no topo e dois buracos dos bracinhos, com a polpa amarela à mostra
  const furos = [
    new THREE.Vector3(holeL.x, holeL.y, holeL.z),
    new THREE.Vector3(-holeL.x, holeL.y, holeL.z),
  ]
  for (const f of furos) {
    const n = jacaNormal(f)
    const polpa = torus(0.07, 0.024, POLPA, { roughness: 0.7 })
    polpa.position.copy(f).addScaledVector(n, 0.004)
    polpa.quaternion.setFromUnitVectors(FWD, n)
    jaca.add(polpa)
    const beira = torus(0.096, 0.01, JACA_ESC, { roughness: 0.6 })
    beira.position.copy(f).addScaledVector(n, 0.002)
    beira.quaternion.setFromUnitVectors(FWD, n)
    jaca.add(beira)
  }
  const GOLA_Y = JB * Math.cos(0.43)
  const gola = torus(0.132, 0.042, POLPA, { roughness: 0.7 })
  gola.rotation.x = Math.PI / 2
  gola.position.y = GOLA_Y
  jaca.add(gola)
  const golaBeira = torus(0.168, 0.012, JACA_ESC, { roughness: 0.6 })
  golaBeira.rotation.x = Math.PI / 2
  golaBeira.position.y = GOLA_Y - 0.012
  jaca.add(golaBeira)

  // espinhos: distribuição de Fibonacci sobre o elipsoide, apontando na normal
  const espinhoA = cone(0.024, 0.036, JACA_PONTA, { roughness: 0.55, size: 0.05 }, 6)
  const espinhoB = cone(0.022, 0.03, JACA, { roughness: 0.6, size: 0.05 }, 6)
  const NS = 640
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < NS; i++) {
    const uy = 1 - (2 * (i + 0.5)) / NS
    const ur = Math.sqrt(1 - uy * uy)
    const th = i * golden
    const p = new THREE.Vector3(Math.cos(th) * ur * JA, uy * JB, Math.sin(th) * ur * JC)
    if (p.y > GOLA_Y - 0.035) continue
    if (p.y < -JB * 0.92) continue
    if (furos.some((f) => f.distanceTo(p) < 0.11)) continue
    const n = jacaNormal(p)
    const e = (i % 3 === 0 ? espinhoB : espinhoA).clone()
    e.position.copy(p).addScaledVector(n, 0.008)
    e.quaternion.setFromUnitVectors(UP, n)
    jaca.add(e)
  }

  // ---- três gomos amarelos caídos no chão ------------------------------------
  const gomos = new THREE.Group()
  gomos.position.set(0, FY, 0)
  root.add(gomos)
  for (const [x, z, ry, s] of [[0.5, 0.66, 0.6, 1], [0.82, 0.36, -0.5, 0.92], [-0.62, 0.62, 1.3, 0.96]] as const) {
    const gomo = new THREE.Group()
    gomo.position.set(x, 0.05 * s, z)
    gomo.rotation.set(0, ry, 0.12)
    gomo.scale.setScalar(s)
    gomos.add(gomo)
    const bulbo = sphere(0.09, GOMO, { roughness: 0.28 })
    bulbo.scale.set(0.74, 0.58, 1.3)
    gomo.add(bulbo)
    const lobo = sphere(0.07, GOMO, { roughness: 0.28 })
    lobo.scale.set(0.8, 0.62, 1.1)
    lobo.position.set(0.02, 0.002, 0.07)
    gomo.add(lobo)
    // fenda por onde aparece o caroço
    const fenda = capsule(0.009, 0.1, GOMO_ESC, { roughness: 0.35 })
    fenda.rotation.x = Math.PI / 2
    fenda.position.set(0.005, 0.05, 0.01)
    gomo.add(fenda)
    const caroco = sphere(0.026, '#c9a46a', { roughness: 0.5 }, 16)
    caroco.scale.set(0.8, 0.6, 1.3)
    caroco.position.set(0.005, 0.048, -0.02)
    gomo.add(caroco)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'hall', object: base },
    { name: 'parede', group: 'hall', object: parede },
    { name: 'porta', group: 'hall', object: porta },
    { name: 'cabideiro', group: 'moveis', object: cabideiro },
    { name: 'sapateira', group: 'moveis', object: sapateira },
    { name: 'quati', group: 'quati', object: quati },
    { name: 'roupa', group: 'quati', object: roupa },
    { name: 'cabeca', group: 'quati', object: cabeca },
    { name: 'bracos', group: 'quati', object: bracos },
    { name: 'cauda', group: 'quati', object: cauda },
    { name: 'jaca', group: 'jaca', object: jaca },
    { name: 'gomos', group: 'gomos', object: gomos },
  ]

  // ---- montagem ------------------------------------------------------------
  const pop = (from: number, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Lá fora faz dez graus abaixo de zero. Sobe a hallen de uma casa sueca, de piso claro e capacho.',
    }),
    seq('parede-rise', 'parede', 0.15, 0.9, [riseFrom(FY, 2.6)], { ease: 'easeOut' }),
    seq('porta-rise', 'porta', 0.3, 0.9, [riseFrom(FY + 0.035, 2.6)], { ease: 'easeOut' }),

    seq('porta-abre', 'porta', 1.35, 0.9, [ch('rotation.y', 0, DOOR_OPEN)], {
      ease: 'easeOut',
      caption: 'A porta vermelha se entreabre: neve lá fora, e o frio entrando pela fresta.',
    }),

    seq('cabideiro-pop', 'cabideiro', 2.5, 0.55, pop(0.01), {
      ease: 'easeOut',
      caption: 'No cabideiro, o gorro e as luvas; na sapateira, as botinhas de neve. O gancho do casaco está vazio.',
    }),
    seq('sapateira-rise', 'sapateira', 2.65, 0.6, [riseFrom(FY, 0.6)], { ease: 'easeOut' }),

    seq('quati-rise', 'quati', 3.9, 0.9, [riseFrom(FY, 2.0)], {
      ease: 'easeOut',
      caption: 'E chega o quati recém-chegado de Foz do Iguaçu: de bermuda e chinelo, pronto pra sair assim mesmo.',
    }),
    seq('roupa-ajusta', 'roupa', 3.95, 0.7, [ch('scale.y', 1.25, 1)], { ease: 'easeOut' }),
    seq('cabeca-sobe', 'cabeca', 4.05, 0.7, [ch('position.y', HEAD_Y - 0.22, HEAD_Y)], { ease: 'easeOut' }),
    seq('bracos-abrem', 'bracos', 4.2, 0.6, [ch('scale.x', ARM_IN, 1)], { ease: 'easeOut' }),
    seq('cauda-surge', 'cauda', 4.3, 0.6, pop(0.05), { ease: 'easeOut' }),

    seq('cabeca-revira', 'cabeca', 5.9, 0.6, [
      ch('rotation.x', 0, HEAD_X_REVIRA),
      ch('rotation.z', 0, HEAD_Z_REVIRA),
    ], {
      ease: 'easeOut',
      caption: 'Quando vê o casaco chegando, revira os olhos e resmunga: TÁ, PÔ!',
    }),

    seq('jaca-desce', 'jaca', 7.6, 0.55, [
      ch('position.y', JY + 2.1, JY),
      ch('rotation.y', 1.4, 0),
    ], {
      ease: 'easeIn',
      caption: 'A mãe nem discute: enfia o casaco pela cabeça dele e dá dois tapinhas no peito, satisfeita: DÊI!',
    }),
    seq('bracos-recolhem', 'bracos', 7.85, 0.2, [ch('scale.x', 1, ARM_IN)], { ease: 'easeIn' }),
    seq('tapinha-1a', 'jaca', 8.3, 0.12, [ch('scale.y', 1, 0.9), ch('scale.x', 1, 1.05)], { ease: 'easeOut' }),
    seq('tapinha-1b', 'jaca', 8.42, 0.16, [ch('scale.y', 0.9, 1), ch('scale.x', 1.05, 1)], { ease: 'easeOut' }),
    seq('tapinha-2a', 'jaca', 8.7, 0.12, [ch('scale.y', 1, 0.9), ch('scale.x', 1, 1.05)], { ease: 'easeOut' }),
    seq('tapinha-2b', 'jaca', 8.82, 0.18, [ch('scale.y', 0.9, 1), ch('scale.x', 1.05, 1)], { ease: 'easeOut' }),

    seq('cabeca-olha', 'cabeca', 9.6, 0.6, [
      ch('rotation.x', HEAD_X_REVIRA, HEAD_X_FINAL),
      ch('rotation.z', HEAD_Z_REVIRA, HEAD_Z_FINAL),
    ], {
      ease: 'easeInOut',
      caption: 'Só aí ele olha pra baixo: não é jaqueta nenhuma, é uma JACA inteira, oca e espinhenta — IÁK-KAN! E quentinha que só.',
    }),
    seq('bracos-saem', 'bracos', 9.8, 0.35, [ch('scale.x', ARM_IN, 1)], { ease: 'easeOut' }),
    seq('gomos-caem', 'gomos', 9.95, 0.45, [ch('position.y', FY + 0.85, FY)], { ease: 'easeIn' }),
    seq('gomos-crescem', 'gomos', 9.95, 0.2, pop(0.01), { ease: 'easeOut' }),
    seq('gomos-quicam', 'gomos', 10.4, 0.14, [ch('position.y', FY, FY + 0.07)], { ease: 'easeOut' }),
    seq('gomos-pousam', 'gomos', 10.54, 0.18, [ch('position.y', FY + 0.07, FY)], { ease: 'easeIn' }),

    seq('cauda-ergue', 'cauda', 10.6, 0.7, [
      ch('rotation.z', TAIL_DROOP_Z, 0.1),
      ch('rotation.x', TAIL_DROOP_X, 0),
    ], { ease: 'easeOut' }),
    seq('cauda-assenta', 'cauda', 11.4, 0.5, [ch('rotation.z', 0.1, 0)], {
      ease: 'easeInOut',
      caption: 'Ta på dig jackan! — Vista a jaqueta!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'ta-pa-dig-jackan',
    contexto:
      'Filhos: na hallen, de outubro a abril, antes de sair pra förskola, pro parque ou pro carro — dita dez vezes por dia. Troque a peça: ta på dig mössan (o gorro), vantarna (as luvas), skorna (os sapatos), overallen (o macacão).',
    fraseFonte: 'Vista a jaqueta!',
    fraseAlvo: 'Ta på dig jackan!',
    pronuncia:
      "ta PÔ dêi IÁK-kan! ('ta på' é verbo com partícula e a força cai no PÔ: Ô fechado e longo; 'dig' na fala = dêi; 'jackan' com J = I de ioga, A curto e K dobrado: IÁK-kan; o -n do fim é o artigo, 'a jaqueta'; força no PÔ e no IÁK)",
    ponteSonora:
      "TÁ, PÔ! DÊI... IÁK-KAN! (5 batidas: tá-PÔ-dêi-IÁK-kan; tônicas no PÔ e no IÁK; TÁ = o 'ta' de sempre, o mesmo TÁ de 'Ta med, tack' (TÁ, MÊÊ!) e de 'Kan du ta det en gång till?': A aberto e longo; PÔ = o 'pô!' brasileiro, Ô FECHADO de boca redonda, o mesmo 'på' de 'GRÁTIS, PÔ!' e 'DÊ, PÔ!', e aqui ele leva força, porque 'ta PÅ' (vestir) é verbo com partícula; 'TÁ, PÔ!' é o resmungo inteiro, de uma vez; DÊI = o 'DEI!' satisfeito de quem acabou de fazer o serviço em você, o mesmo DÊI da raposa de 'Kom in och sätt dig!': 'dig' na fala é 'dej', UMA sílaba, nunca 'dê-i'; IÁK-KAN = a JACA com o J virando I de IOGA, como todo J sueco ('jag' = IÁ, 'jobbar' = IÓBAR), nunca o J chiado do português; A curto, K dobrado (a língua segura o K um instante antes de soltar) e o N do fim é o artigo colado: jacka = jaqueta, jackan = A jaqueta, o mesmo N de IS-KÚÚ-LAN ('i skolan'); N de ponta de língua, sem nasal; e é UMA palavra só, a jaca inteira: picada em 'IÁ... CAN' ela soa 'jag kan' (eu posso))",
    historia:
      'Lá fora faz dez graus abaixo de zero, e o quati recém-chegado de Foz do Iguaçu quer ir pra rua de bermuda e chinelo. Quando vê o casaco chegando, ele revira os olhos e resmunga: TÁ, PÔ! A mãe nem discute: enfia o casaco pela cabeça dele de uma vez e dá dois tapinhas no peito, satisfeita: DEI! Só aí ele olha pra baixo e vê o que está vestindo: não é jaqueta nenhuma, é uma JACA inteira, oca, verde e cheia de espinhos, com dois furos pros bracinhos, e quentinha que só. Vista a jaqueta!',
  },
  createScene,
  refine: { organic: ['quati', 'cabeca', 'bracos'] },
}

export default card
