import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe,
} from '../rig/helpers'

/**
 * "Städa ditt rum!" — (e)STÉ(ril)... DÁ DE TROM(ba)!
 *
 * O quarto do filhote de vombate virou um lixão. A mãe vombate chega de
 * faxina — luvas amarelas, óculos de proteção e pulverizador ESTÉRIL nas
 * costas —, pisa num carrinho, voa e DÁ DE TROMBA no monte de roupa suja, com
 * o traseiro quadrado pro teto. Da roupa sai a luva amarela apontando o
 * filhote, que está DE TROMBA na cama: 'STÉ-DA DE TROM!'
 *
 * Diorama: piso de tábuas claras; cama azul ao fundo à esquerda com o filhote;
 * monte de roupa no centro; a mãe enfiada nele, em diagonal, rabo pro alto; o
 * carrinho capotado à direita; meias e casca de banana na frente.
 */

const PISO = '#c9a87a'
const TABUA_A = '#dcc096'
const TABUA_B = '#d2b385'
const AZUL = '#4f7fbf'
const AZUL_ESC = '#3a649e'
const LENCOL = '#f1ede4'
const FUR = '#8b7a68'
const FUR_ESC = '#6c5d4f'
const FUR_CLARO = '#a8957d'
const FILHOTE = '#9c8670'
const FILHOTE_CLARO = '#b9a48a'
const NARIZ = '#2a2522'
const VERDE = '#2f9a58' // tanque do pulverizador
const VERDE_ESC = '#237245'
const LUVA = '#f5c21b' // acento saturado: as luvas da faxina (o decreto)
const LUVA_ESC = '#d9a512'
const BORRACHA = '#262626'
const PLACA = '#f6f3ec'
const TINTA = '#1f3b2c'
const CARRO = '#c8453b'

const FY = 0.12 // topo do piso

// mãe vombate: origem na cabeça (enfiada no monte), corpo ao longo de +x
const MAE_POS: [number, number, number] = [0.5, 0.6, 0.56]
const MAE_TILT = 1.0 // rotação z final: mergulho de cara, traseiro pro alto
const MAE_YAW = -0.3

// monte de roupa
const PX = -0.3
const PZ = 0.38

const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula de a até b (membros). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Traço de letra da plaquinha: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.02, 0.006, TINTA, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** E S T É R I L — letras de traço grosso (altura 0.11). */
function letter(which: string) {
  const g = new THREE.Group()
  const t = 0.022
  const hh = 0.055 // meia altura
  const hw = 0.034 // meia largura
  const top = hh - t / 2
  const bot = -hh + t / 2
  const left = -hw + t / 2
  const right = hw - t / 2
  if (which === 'E' || which === 'É') {
    g.add(stroke(t, hh * 2, left, 0))
    g.add(stroke(hw * 2, t, 0, top))
    g.add(stroke(hw * 1.7, t, -hw * 0.15, 0))
    g.add(stroke(hw * 2, t, 0, bot))
    if (which === 'É') g.add(stroke(0.018, 0.04, 0.008, hh + 0.035, -0.75))
  } else if (which === 'S') {
    g.add(stroke(hw * 2, t, 0, top))
    g.add(stroke(t, hh, left, hh / 2))
    g.add(stroke(hw * 2, t, 0, 0))
    g.add(stroke(t, hh, right, -hh / 2))
    g.add(stroke(hw * 2, t, 0, bot))
  } else if (which === 'T') {
    g.add(stroke(hw * 2.2, t, 0, top))
    g.add(stroke(t, hh * 2, 0, 0))
  } else if (which === 'R') {
    g.add(stroke(t, hh * 2, left, 0))
    g.add(stroke(hw * 1.8, t, -hw * 0.1, top))
    g.add(stroke(hw * 1.8, t, -hw * 0.1, 0.004))
    g.add(stroke(t, hh * 0.95, right, hh / 2))
    g.add(stroke(t, hh * 1.15, right * 0.75, -hh / 2, 0.45))
  } else if (which === 'I') {
    g.add(stroke(t, hh * 2, 0, 0))
  } else {
    // L
    g.add(stroke(t, hh * 2, left, 0))
    g.add(stroke(hw * 2, t, 0, bot))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- base: piso de tábuas claras ------------------------------------------
  const base = new THREE.Group()
  const piso = cylinder(2.62, 2.7, 0.12, PISO, { roughness: 0.7 })
  piso.position.y = 0.06
  base.add(piso)
  for (let i = -4; i <= 4; i++) {
    const z = i * 0.56
    const meia = Math.sqrt(Math.max(0, 2.56 * 2.56 - (Math.abs(z) + 0.28) ** 2))
    if (meia < 0.3) continue
    const ripa = rbox(meia * 2, 0.014, 0.53, 0.006, i % 2 === 0 ? TABUA_A : TABUA_B, { roughness: 0.65 })
    ripa.position.set((rand() - 0.5) * 0.1, FY + 0.007, z)
    base.add(ripa)
  }

  // baú de brinquedos ao fundo, à direita
  const bau = new THREE.Group()
  bau.position.set(1.55, FY, -1.25)
  bau.rotation.y = -0.45
  const caixa = rbox(0.75, 0.42, 0.45, 0.05, '#e5d3ad', { roughness: 0.6 })
  caixa.position.y = 0.21
  bau.add(caixa)
  const tampa = rbox(0.79, 0.07, 0.49, 0.03, '#7aa58a', { roughness: 0.55 })
  tampa.position.y = 0.45
  bau.add(tampa)
  for (const sx of [-1, 1]) {
    const alca = torus(0.06, 0.014, '#5b4a3a', { roughness: 0.5 })
    alca.position.set(sx * 0.39, 0.3, 0)
    alca.rotation.y = Math.PI / 2
    bau.add(alca)
  }
  base.add(bau)

  // blocos de brinquedo perto do baú
  for (const [bx, bz, cor, h] of [
    [0.95, -1.55, '#e07a5f', 0], [1.12, -1.48, '#6c9bc7', 0], [1.04, -1.52, '#e9c46a', 1],
  ] as const) {
    const bloco = rbox(0.15, 0.15, 0.15, 0.025, cor, { roughness: 0.5 })
    bloco.position.set(bx, FY + 0.075 + h * 0.15, bz)
    bloco.rotation.y = rand() * 1.2
    base.add(bloco)
  }

  // bola esquecida no canto da frente
  const bola = sphere(0.14, '#e07a5f', { roughness: 0.4 })
  bola.position.set(-1.85, FY + 0.14, 0.95)
  base.add(bola)
  const faixaBola = torus(0.141, 0.018, '#f3ead8', { roughness: 0.4 })
  faixaBola.position.copy(bola.position)
  faixaBola.rotation.set(0.5, 0, 0.3)
  base.add(faixaBola)
  root.add(base)

  // ---- cama de solteiro azul, ao fundo à esquerda ---------------------------
  const cama = new THREE.Group()
  cama.position.set(-1.38, FY, -0.82)
  cama.rotation.y = 0.28
  const L = 1.55
  const W = 0.92
  for (const lx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      const pe = cylinder(0.04, 0.035, 0.14, AZUL_ESC, { roughness: 0.5 })
      pe.position.set(lx * (W / 2 - 0.06), 0.07, lz * (L / 2 - 0.08))
      cama.add(pe)
    }
  }
  const estrado = rbox(W + 0.06, 0.2, L, 0.05, AZUL, { roughness: 0.5 })
  estrado.position.y = 0.24
  cama.add(estrado)
  const colchao = rbox(W - 0.02, 0.16, L - 0.08, 0.07, LENCOL, { roughness: 0.85 })
  colchao.position.y = 0.42
  cama.add(colchao)
  const cabeceira = rbox(W + 0.12, 0.78, 0.08, 0.05, AZUL, { roughness: 0.5 })
  cabeceira.position.set(0, 0.5, -L / 2)
  cama.add(cabeceira)
  const frisoCab = rbox(W - 0.1, 0.32, 0.02, 0.02, AZUL_ESC, { roughness: 0.5 })
  frisoCab.position.set(0, 0.6, -L / 2 + 0.045)
  cama.add(frisoCab)
  for (const sx of [-1, 1]) {
    const pomo = sphere(0.055, AZUL_ESC, { roughness: 0.45 })
    pomo.position.set(sx * (W / 2 + 0.06), 0.93, -L / 2)
    cama.add(pomo)
  }
  const peseira = rbox(W + 0.12, 0.42, 0.07, 0.04, AZUL, { roughness: 0.5 })
  peseira.position.set(0, 0.3, L / 2)
  cama.add(peseira)
  const travesseiro = rbox(0.6, 0.12, 0.3, 0.06, '#fbf7ef', { roughness: 0.9 })
  travesseiro.position.set(0.05, 0.55, -L / 2 + 0.24)
  travesseiro.rotation.set(0.12, 0.15, 0.06)
  cama.add(travesseiro)
  // lençol amarrotado: dobras grossas largadas
  for (const [fx, fz, fr, rot] of [
    [-0.18, 0.42, 0.14, 0.4], [0.2, 0.5, 0.12, -0.6], [0.02, 0.62, 0.11, 1.2], [0.25, 0.25, 0.1, 0.2],
  ] as const) {
    const dobra = capsule(fr * 0.6, fr * 2.4, '#e6e2d8', { roughness: 0.9 })
    dobra.rotation.set(0, rot, Math.PI / 2)
    dobra.scale.set(1, 1, 0.75)
    dobra.position.set(fx, 0.5 + fr * 0.25, fz)
    cama.add(dobra)
  }
  const manta = rbox(W - 0.04, 0.05, 0.36, 0.025, '#a9c3e2', { roughness: 0.92 })
  manta.position.set(0.02, 0.53, 0.52)
  manta.rotation.set(0.05, -0.12, 0.08)
  cama.add(manta)
  root.add(cama)

  // ---- monte de roupa suja --------------------------------------------------
  const roupa = new THREE.Group()
  roupa.position.set(PX, FY, PZ)
  const CORES = ['#c97c66', '#6f8fb0', '#9ab394', '#b597ad', '#7a7d92', '#d8b47a', '#a85e66', '#6aa3a0', '#e3a35b']
  const A = 0.72
  const B = 0.48
  const C = 0.6
  const CY = 0.18
  const nucleo = sphere(1, '#5c6274', { roughness: 0.92 })
  nucleo.scale.set(A, B, C)
  nucleo.position.y = CY
  roupa.add(nucleo)
  const NP = 52
  for (let i = 0; i < NP; i++) {
    const a = (i / NP) * Math.PI * 2 * 4 + rand() * 0.6
    const b = -0.05 + (i / NP) * 1.45 + rand() * 0.15
    const n = new THREE.Vector3(Math.cos(b) * Math.cos(a), Math.sin(b), Math.cos(b) * Math.sin(a))
    const p = new THREE.Vector3(n.x * A, CY + n.y * B, n.z * C)
    const normal = new THREE.Vector3(p.x / (A * A), (p.y - CY) / (B * B), p.z / (C * C)).normalize()
    const cor = CORES[Math.floor(rand() * CORES.length)]
    const peca = rand() < 0.35
      ? sphere(0.2 + rand() * 0.1, cor, { roughness: 0.93 })
      : rbox(0.4 + rand() * 0.12, 0.08, 0.3 + rand() * 0.1, 0.035, cor, { roughness: 0.93 })
    if ((peca.geometry as THREE.BufferGeometry).type === 'SphereGeometry') peca.scale.set(1.2, 0.3, 0.8)
    peca.quaternion.setFromUnitVectors(UP, normal)
    peca.rotateY(rand() * Math.PI)
    peca.position.copy(p).addScaledVector(normal, 0.03)
    roupa.add(peca)
  }
  // camiseta largada no topo
  const camiseta = new THREE.Group()
  camiseta.position.set(-0.05, CY + B * 0.82, 0.3)
  camiseta.rotation.set(0.75, 0.15, 0.05)
  const corpoCam = rbox(0.4, 0.05, 0.46, 0.03, '#f0e8da', { roughness: 0.92 })
  camiseta.add(corpoCam)
  for (const sx of [-1, 1]) {
    const manga = rbox(0.18, 0.045, 0.16, 0.02, '#f0e8da', { roughness: 0.92 })
    manga.position.set(sx * 0.26, -0.01, -0.14)
    manga.rotation.y = sx * 0.55
    camiseta.add(manga)
  }
  for (const fz of [-0.12, 0.0, 0.12]) {
    const listra = rbox(0.41, 0.012, 0.05, 0.005, '#c8453b', { roughness: 0.9 })
    listra.position.set(0, 0.027, fz)
    camiseta.add(listra)
  }
  roupa.add(camiseta)
  root.add(roupa)

  // ---- carrinho vermelho (capota quando ela pisa) ---------------------------
  const carrinho = new THREE.Group()
  const CAR_Y = FY + 0.15
  carrinho.position.set(1.85, CAR_Y, 0.4)
  carrinho.rotation.set(0, -0.5, Math.PI) // pose final: rodas pro alto
  const lataria = rbox(0.44, 0.12, 0.24, 0.05, CARRO, { roughness: 0.3 })
  lataria.position.y = -0.02
  carrinho.add(lataria)
  const cabine = rbox(0.23, 0.11, 0.2, 0.045, CARRO, { roughness: 0.3 })
  cabine.position.set(-0.03, 0.08, 0)
  carrinho.add(cabine)
  for (const sz of [-1, 1]) {
    const janela = rbox(0.17, 0.06, 0.01, 0.02, '#2e3e55', { roughness: 0.15 })
    janela.position.set(-0.03, 0.085, sz * 0.101)
    carrinho.add(janela)
  }
  for (const wx of [-1, 1]) {
    for (const wz of [-1, 1]) {
      const roda = cylinder(0.06, 0.06, 0.05, '#2b2b2b', { roughness: 0.6 })
      roda.rotation.x = Math.PI / 2
      roda.position.set(wx * 0.14, -0.08, wz * 0.115)
      carrinho.add(roda)
      const calota = cylinder(0.028, 0.028, 0.054, '#d8d8d8', { roughness: 0.3, metalness: 0.6 })
      calota.rotation.x = Math.PI / 2
      calota.position.copy(roda.position)
      carrinho.add(calota)
    }
  }
  const farol = sphere(0.022, '#fff3c4', { roughness: 0.2 })
  farol.position.set(0.22, -0.01, 0.07)
  carrinho.add(farol)
  root.add(carrinho)

  // ---- meias listradas e casca de banana -----------------------------------
  const lixo = new THREE.Group()
  const meia = (x: number, z: number, rot: number, faixa: string) => {
    const g = new THREE.Group()
    g.position.set(x, FY + 0.045, z)
    g.rotation.y = rot
    const cano = capsule(0.05, 0.22, '#f4efe4', { roughness: 0.92 })
    cano.rotation.z = Math.PI / 2
    cano.scale.set(1, 1, 0.75)
    g.add(cano)
    const pe = capsule(0.05, 0.1, '#f4efe4', { roughness: 0.92 })
    pe.rotation.set(0, 0.9, Math.PI / 2)
    pe.scale.set(1, 1, 0.75)
    pe.position.set(0.17, 0, 0.07)
    g.add(pe)
    for (const fx of [-0.1, -0.04, 0.02]) {
      const f = torus(0.048, 0.014, faixa, { roughness: 0.9 })
      f.rotation.y = Math.PI / 2
      f.scale.set(1, 1, 0.78)
      f.position.x = fx
      g.add(f)
    }
    return g
  }
  lixo.add(meia(-1.0, 1.05, 0.4, '#c8453b'))
  lixo.add(meia(0.85, 1.5, -2.2, '#4f7fbf'))
  const banana = new THREE.Group()
  banana.position.set(-0.25, FY + 0.03, 1.32)
  banana.rotation.y = 0.6
  const miolo = capsule(0.045, 0.1, '#ead27a', { roughness: 0.6 })
  miolo.rotation.z = Math.PI / 2
  banana.add(miolo)
  for (let k = 0; k < 4; k++) {
    const aba = capsule(0.035, 0.16, '#e9c64a', { roughness: 0.6 })
    const ang = k * (Math.PI / 2) + 0.4
    aba.rotation.set(0, ang, Math.PI / 2)
    aba.scale.set(1, 1, 0.45)
    aba.position.set(Math.cos(ang) * 0.12, -0.01, -Math.sin(ang) * 0.12)
    banana.add(aba)
  }
  const ponta = sphere(0.025, '#5a4632', { roughness: 0.7 })
  ponta.position.set(-0.11, 0.01, 0)
  banana.add(ponta)
  lixo.add(banana)
  root.add(lixo)

  // ---- MÃE VOMBATE: de cara no monte, traseiro quadrado pro teto ------------
  const mae = new THREE.Group()
  mae.position.set(...MAE_POS)
  mae.rotation.set(0, MAE_YAW, MAE_TILT)
  root.add(mae)

  const tronco = sphere(0.42, FUR, { roughness: 0.9 })
  tronco.scale.set(1.55, 0.95, 1.05)
  tronco.position.set(0.58, 0, 0)
  mae.add(tronco)
  const peito = sphere(0.36, FUR, { roughness: 0.9 })
  peito.position.set(0.18, -0.04, 0)
  mae.add(peito)
  const barrigaM = sphere(0.33, FUR_CLARO, { roughness: 0.9 })
  barrigaM.scale.set(1.5, 0.7, 0.95)
  barrigaM.position.set(0.6, -0.18, 0)
  mae.add(barrigaM)
  // o traseiro QUADRADO de vombate: placa larga e chata
  const traseiro = rbox(0.34, 0.76, 0.82, 0.2, FUR, { roughness: 0.9 })
  traseiro.position.set(1.12, -0.02, 0)
  mae.add(traseiro)
  const rabinho = sphere(0.06, FUR_ESC, { roughness: 0.9 })
  rabinho.position.set(1.3, 0.12, 0)
  mae.add(rabinho)
  // patinhas traseiras pro ar
  for (const sz of [-1, 1]) {
    const a = new THREE.Vector3(1.12, -0.3, sz * 0.25)
    const b = new THREE.Vector3(1.42, -0.4, sz * 0.3)
    mae.add(limb(a, b, 0.11, FUR, { roughness: 0.9 }))
    const sola = sphere(0.1, FUR_ESC, { roughness: 0.8 })
    sola.scale.set(0.55, 1, 1.05)
    sola.position.set(1.52, -0.42, sz * 0.3)
    mae.add(sola)
    for (let d = 0; d < 3; d++) {
      const dedo = sphere(0.032, '#3f352c', { roughness: 0.7 })
      dedo.position.set(1.57, -0.36 - d * 0.055 + 0.0, sz * 0.3 + (d - 1) * 0.06)
      mae.add(dedo)
    }
  }

  // ---- cabeça (parte enfiada no monte) --------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(-0.14, -0.02, 0.02)
  cabeca.rotation.set(0.3, 0, 0) // deitada de lado: bochecha no monte, um olho pra câmera
  mae.add(cabeca)
  const cab = new THREE.Group() // escala do miolo (a peça anima a própria escala)
  cab.scale.setScalar(1.22)
  cabeca.add(cab)
  const cranio = sphere(0.33, FUR, { roughness: 0.9 })
  cranio.scale.set(0.95, 0.85, 1.15)
  cab.add(cranio)
  const focinho = sphere(0.2, FUR_ESC, { roughness: 0.88 })
  focinho.scale.set(0.9, 0.85, 1.25)
  focinho.position.set(-0.24, -0.04, 0)
  cab.add(focinho)
  const narizM = sphere(0.12, NARIZ, { roughness: 0.35 })
  narizM.scale.set(0.6, 0.75, 1.35)
  narizM.position.set(-0.38, -0.02, 0)
  cab.add(narizM)
  for (const sz of [-1, 1]) {
    const orelha = sphere(0.085, FUR_ESC, { roughness: 0.9 })
    orelha.scale.set(0.8, 1, 0.55)
    orelha.position.set(0.1, 0.27, sz * 0.2)
    cab.add(orelha)
  }
  // o olho que sobrou de fora, arregalado
  const olho = sphere(0.09, '#ffffff', { roughness: 0.25 })
  olho.scale.set(1, 1, 0.6)
  olho.position.set(-0.1, 0.08, 0.34)
  cab.add(olho)
  const pupila = sphere(0.042, '#1a1a1a', { roughness: 0.2 })
  pupila.position.set(-0.13, 0.09, 0.4)
  cab.add(pupila)

  // ---- óculos de proteção tortos (transparentes) ----------------------------
  // escorregaram no tombo: a lente de fora ficou torta sobre o olho
  const oculos = new THREE.Group()
  oculos.position.set(0, 0.08, 0)
  oculos.rotation.set(0, 0, 0.22)
  cab.add(oculos)
  const tira = torus(0.335, 0.018, '#33413a', { roughness: 0.6 })
  tira.rotation.x = Math.PI / 2
  tira.scale.set(0.95, 1.16, 1)
  oculos.add(tira)
  const vidroMat = mat('#bfe3f2', { roughness: 0.08, detail: 0 })
  vidroMat.transparent = true
  vidroMat.opacity = 0.38
  for (const sz of [-1, 1]) {
    const aro = torus(0.105, 0.028, '#33413a', { roughness: 0.5 })
    aro.position.set(-0.11, 0, sz * 0.385)
    oculos.add(aro)
    const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.03, 24), vidroMat)
    lente.rotation.x = Math.PI / 2
    lente.position.set(-0.11, 0, sz * 0.385)
    oculos.add(lente)
  }

  root.updateMatrixWorld(true)

  // pata dianteira do lado da câmera, largada no chão (luva amarela à parte)
  const ombro = mae.localToWorld(new THREE.Vector3(0.3, -0.24, 0.28))
  const pulso = new THREE.Vector3(MAE_POS[0] + 0.62, FY + 0.1, MAE_POS[2] + 0.5)
  const bracoM = limb(ombro, pulso, 0.12, FUR, { roughness: 0.9 })
  root.add(bracoM)
  bracoM.updateMatrixWorld()
  mae.attach(bracoM)

  // ---- luva amarela da pata largada (peça rígida) ---------------------------
  const luvas = new THREE.Group()
  luvas.position.copy(pulso)
  luvas.rotation.set(0, -0.9, 0)
  const punhoL = cylinder(0.13, 0.11, 0.1, LUVA, { roughness: 0.35 })
  punhoL.rotation.z = Math.PI / 2
  punhoL.position.set(-0.04, 0.0, 0)
  luvas.add(punhoL)
  const maoL = sphere(0.12, LUVA, { roughness: 0.35 })
  maoL.scale.set(1.1, 0.55, 1)
  maoL.position.set(0.1, -0.05, 0)
  luvas.add(maoL)
  for (let d = 0; d < 4; d++) {
    const dedo = capsule(0.033, 0.07, LUVA, { roughness: 0.35 })
    dedo.rotation.z = Math.PI / 2
    dedo.position.set(0.24, -0.07, -0.09 + d * 0.06)
    luvas.add(dedo)
  }
  root.add(luvas)
  luvas.updateMatrixWorld()
  mae.attach(luvas)

  // ---- pulverizador nas costas: tanque verde + alças + mangueira ------------
  const tanque = new THREE.Group()
  mae.add(tanque)
  const corpoTanque = lathe(
    [[0, 0], [0.16, 0], [0.2, 0.04], [0.2, 0.5], [0.17, 0.58], [0.08, 0.62], [0, 0.62]],
    VERDE,
    { roughness: 0.35 },
  )
  corpoTanque.rotation.z = -Math.PI / 2 // eixo ao longo de +x (topo pro traseiro)
  corpoTanque.position.set(0.28, 0.56, 0)
  tanque.add(corpoTanque)
  const frisos = [0.1, 0.45]
  for (const fx of frisos) {
    const f = torus(0.2, 0.016, VERDE_ESC, { roughness: 0.4 })
    f.rotation.y = Math.PI / 2
    f.position.set(0.28 + fx, 0.56, 0)
    tanque.add(f)
  }
  const tampaT = cylinder(0.06, 0.07, 0.06, '#e8e2d2', { roughness: 0.4 })
  tampaT.rotation.z = -Math.PI / 2
  tampaT.position.set(0.92, 0.56, 0)
  tanque.add(tampaT)
  const haste = cylinder(0.018, 0.018, 0.2, '#9aa1a6', { roughness: 0.3, metalness: 0.7 })
  haste.rotation.z = -Math.PI / 2
  haste.position.set(1.02, 0.56, 0)
  tanque.add(haste)
  const manopla = capsule(0.025, 0.3, BORRACHA, { roughness: 0.5 })
  manopla.rotation.x = Math.PI / 2
  manopla.position.set(1.12, 0.56, 0.05)
  tanque.add(manopla)
  // mangueira preta até o bico largado no chão
  const bocal = mae.localToWorld(new THREE.Vector3(0.28, 0.5, 0.14))
  const bico = new THREE.Vector3(0.12, FY + 0.05, 1.42)
  const curva = new THREE.CatmullRomCurve3([
    bocal,
    bocal.clone().add(new THREE.Vector3(-0.25, 0.0, 0.25)),
    new THREE.Vector3(-0.12, 0.7, 1.0),
    new THREE.Vector3(-0.12, FY + 0.06, 1.3),
    bico,
  ].map((p) => mae.worldToLocal(p.clone())))
  const mangueira = new THREE.Mesh(new THREE.TubeGeometry(curva, 48, 0.026, 10), mat(BORRACHA, { roughness: 0.5 }))
  mangueira.castShadow = true
  mangueira.receiveShadow = true
  tanque.add(mangueira)
  const lanca = new THREE.Group()
  lanca.position.copy(bico)
  lanca.rotation.set(0, 0.35, 0)
  const tubo = cylinder(0.018, 0.018, 0.42, '#9aa1a6', { roughness: 0.3, metalness: 0.7 })
  tubo.rotation.z = Math.PI / 2
  tubo.position.x = 0.24
  lanca.add(tubo)
  const gatilho = rbox(0.12, 0.05, 0.05, 0.02, BORRACHA, { roughness: 0.5 })
  gatilho.position.x = 0.02
  lanca.add(gatilho)
  const esguicho = cylinder(0.03, 0.02, 0.06, VERDE_ESC, { roughness: 0.4 })
  esguicho.rotation.z = Math.PI / 2
  esguicho.position.x = 0.47
  lanca.add(esguicho)
  root.add(lanca)
  lanca.updateMatrixWorld()
  tanque.attach(lanca)

  // ---- plaquinha ESTÉRIL pendurada no tanque --------------------------------
  root.updateMatrixWorld(true)
  const plaquinha = new THREE.Group()
  // pendurada na ponta da manopla, à frente do corpo
  const ancora = mae.localToWorld(new THREE.Vector3(1.12, 0.56, 0.2))
  plaquinha.position.copy(ancora)
  plaquinha.rotation.y = -0.05
  const PW = 0.74
  const PH = 0.22
  const PC = new THREE.Vector3(-0.2, -0.34, 0.28) // centro da placa
  const placaG = new THREE.Group()
  placaG.position.copy(PC)
  plaquinha.add(placaG)
  const placa = rbox(PW, PH, 0.025, 0.03, PLACA, { roughness: 0.5 })
  placaG.add(placa)
  const borda = rbox(PW - 0.04, PH - 0.04, 0.005, 0.02, VERDE, { roughness: 0.5 })
  borda.position.z = 0.012
  placaG.add(borda)
  const miolo2 = rbox(PW - 0.07, PH - 0.07, 0.006, 0.015, PLACA, { roughness: 0.5 })
  miolo2.position.z = 0.014
  placaG.add(miolo2)
  const glifos = ['E', 'S', 'T', 'É', 'R', 'I', 'L']
  glifos.forEach((gl, i) => {
    const l = letter(gl)
    l.position.set((i - 3) * 0.09, -0.018, 0.022)
    placaG.add(l)
  })
  for (const sx of [-1, 1]) {
    plaquinha.add(limb(
      new THREE.Vector3(0, 0, 0),
      PC.clone().add(new THREE.Vector3(sx * 0.25, PH / 2 - 0.02, 0)),
      0.008, '#3a3a3a', { roughness: 0.6 },
    ))
  }
  const ilhos = sphere(0.025, '#9aa1a6', { roughness: 0.3, metalness: 0.7 })
  plaquinha.add(ilhos)
  root.add(plaquinha)

  // ---- filhote DE TROMBA na cama --------------------------------------------
  const filhote = new THREE.Group()
  filhote.position.set(-1.34, FY + 0.48, -0.74)
  filhote.rotation.y = 0.5
  root.add(filhote)
  const corpoF = sphere(0.33, FILHOTE, { roughness: 0.9 })
  corpoF.scale.set(1, 1.12, 0.9)
  corpoF.position.y = 0.34
  filhote.add(corpoF)
  const barrigaF = sphere(0.25, FILHOTE_CLARO, { roughness: 0.9 })
  barrigaF.scale.set(1, 1.15, 0.6)
  barrigaF.position.set(0, 0.3, 0.14)
  filhote.add(barrigaF)
  for (const sx of [-1, 1]) {
    const perna = limb(new THREE.Vector3(sx * 0.16, 0.12, 0.05), new THREE.Vector3(sx * 0.19, 0.08, 0.32), 0.09, FILHOTE, { roughness: 0.9 })
    filhote.add(perna)
    const pe = sphere(0.08, FUR_ESC, { roughness: 0.85 })
    pe.scale.set(1, 1.1, 0.6)
    pe.position.set(sx * 0.19, 0.1, 0.42)
    filhote.add(pe)
  }
  // braços cruzados no peito
  filhote.add(limb(new THREE.Vector3(-0.27, 0.48, 0.12), new THREE.Vector3(0.18, 0.42, 0.3), 0.075, FILHOTE, { roughness: 0.9 }))
  filhote.add(limb(new THREE.Vector3(0.27, 0.5, 0.12), new THREE.Vector3(-0.17, 0.5, 0.3), 0.075, FILHOTE, { roughness: 0.9 }))
  const cabecaF = sphere(0.26, FILHOTE, { roughness: 0.9 })
  cabecaF.scale.set(1.12, 0.95, 1)
  cabecaF.position.y = 0.82
  filhote.add(cabecaF)
  const focinhoF = sphere(0.15, FILHOTE_CLARO, { roughness: 0.88 })
  focinhoF.scale.set(1.3, 0.8, 0.9)
  focinhoF.position.set(0, 0.75, 0.2)
  filhote.add(focinhoF)
  const narizF = sphere(0.07, NARIZ, { roughness: 0.35 })
  narizF.scale.set(1.45, 0.9, 0.8)
  narizF.position.set(0, 0.79, 0.32)
  filhote.add(narizF)
  // beiço pra fora: DE TROMBA
  const beico = capsule(0.04, 0.08, '#6b4a44', { roughness: 0.5 })
  beico.rotation.z = Math.PI / 2
  beico.position.set(0, 0.66, 0.3)
  filhote.add(beico)
  for (const sx of [-1, 1]) {
    const olhoF = sphere(0.045, '#1a1a1a', { roughness: 0.2 })
    olhoF.position.set(sx * 0.11, 0.88, 0.22)
    filhote.add(olhoF)
    // pálpebra meio fechada: cara amarrada
    const palpebra = sphere(0.05, FILHOTE, { roughness: 0.9 })
    palpebra.scale.set(1.1, 0.55, 0.9)
    palpebra.position.set(sx * 0.11, 0.915, 0.225)
    filhote.add(palpebra)
    const sobrancelha = capsule(0.018, 0.08, FUR_ESC, { roughness: 0.9 })
    sobrancelha.position.set(sx * 0.11, 0.97, 0.21)
    sobrancelha.rotation.z = Math.PI / 2 + sx * 0.45
    filhote.add(sobrancelha)
    const orelhaF = sphere(0.07, FUR_ESC, { roughness: 0.9 })
    orelhaF.scale.set(1, 1, 0.55)
    orelhaF.position.set(sx * 0.2, 1.02, -0.02)
    filhote.add(orelhaF)
  }

  // ---- pata de luva amarela saindo do monte, apontando o filhote ------------
  const pata = new THREE.Group()
  const saida = new THREE.Vector3(PX - 0.42, FY + 0.58, PZ + 0.02)
  const alvo = new THREE.Vector3(-1.3, 1.45, -0.7)
  pata.position.copy(saida)
  pata.quaternion.setFromUnitVectors(UP, alvo.clone().sub(saida).normalize())
  const ante = capsule(0.1, 0.32, FUR, { roughness: 0.9 })
  ante.position.y = 0.06
  pata.add(ante)
  const punhoP = lathe([[0.1, 0], [0.135, 0.02], [0.14, 0.12], [0.115, 0.14], [0, 0.14]], LUVA, { roughness: 0.35 })
  punhoP.position.y = 0.18
  pata.add(punhoP)
  const maoP = sphere(0.11, LUVA, { roughness: 0.35 })
  maoP.scale.set(1, 1.05, 0.75)
  maoP.position.y = 0.4
  pata.add(maoP)
  for (let d = 0; d < 3; d++) {
    const dobrado = sphere(0.045, LUVA, { roughness: 0.35 })
    dobrado.position.set(-0.06 + d * 0.06, 0.47, 0.07)
    pata.add(dobrado)
  }
  const indicador = capsule(0.038, 0.16, LUVA, { roughness: 0.35 })
  indicador.position.set(0.05, 0.6, 0.0)
  pata.add(indicador)
  const polegar = capsule(0.036, 0.08, LUVA_ESC, { roughness: 0.35 })
  polegar.position.set(0.1, 0.44, 0.04)
  polegar.rotation.z = -0.7
  pata.add(polegar)
  root.add(pata)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'quarto', object: base },
    { name: 'cama', group: 'quarto', object: cama },
    { name: 'roupa', group: 'bagunca', object: roupa },
    { name: 'carrinho', group: 'bagunca', object: carrinho },
    { name: 'lixo', group: 'bagunca', object: lixo },
    { name: 'mae', group: 'mae', object: mae },
    { name: 'cabeca', group: 'mae', object: cabeca },
    { name: 'oculos', group: 'mae', object: oculos },
    { name: 'tanque', group: 'mae', object: tanque },
    { name: 'luvas', group: 'mae', object: luvas },
    { name: 'plaquinha', group: 'esteril', object: plaquinha },
    { name: 'filhote', group: 'filhote', object: filhote },
    { name: 'pata', group: 'decreto', object: pata },
  ]

  // ---- montagem ------------------------------------------------------------
  const [mx, my, mz] = MAE_POS
  const START_X = 1.75
  const START_Y = FY + 0.48
  const pop = (part: string, at: number, dur: number, from = 0.01) =>
    seq(`${part}-pop`, part, at, dur, [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)], {
      ease: 'easeOut',
    })

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um quarto de criança sobe do chão: piso de tábuas claras e uma cama azul.',
    }),
    seq('cama-rise', 'cama', 0.45, 0.7, [riseFrom(FY, 1.1)], { ease: 'easeOut' }),

    seq('roupa-cresce', 'roupa', 1.6, 0.8, [ch('scale.x', 0.4, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.4, 1)], {
      ease: 'easeOut',
      caption: 'Só que o quarto virou um LIXÃO: monte de roupa suja, meias, casca de banana e um carrinho largado.',
    }),
    seq('lixo-cai', 'lixo', 1.9, 0.6, [ch('position.y', 0.9, 0)], { ease: 'easeIn' }),
    seq('carrinho-cai', 'carrinho', 2.1, 0.6, [ch('position.y', CAR_Y + 0.9, CAR_Y), ch('rotation.z', 0, 0)], { ease: 'easeIn' }),

    seq('mae-chega', 'mae', 3.4, 0.9, [
      ch('position.x', 2.6, START_X), ch('position.y', START_Y, START_Y), ch('position.z', mz, mz),
      ch('rotation.z', 0, 0),
    ], {
      ease: 'easeOut',
      caption: 'Chega a mãe VOMBATE de faxina, de luvas, óculos e pulverizador nas costas: "Este quarto vai ficar ESTÉ—"',
    }),
    pop('cabeca', 3.4, 0.5, 0.6),
    pop('tanque', 3.7, 0.5),
    pop('oculos', 3.85, 0.4),
    pop('luvas', 3.95, 0.4),

    // pisa no carrinho, voa e mergulha de cara
    seq('carrinho-capota', 'carrinho', 5.4, 0.45, [ch('rotation.z', 0, Math.PI), ch('position.y', CAR_Y, CAR_Y + 0.25)], {
      ease: 'easeOut',
      caption: '…mas pisa no carrinho, VOA e DÁ DE TROMBA no monte de roupa — traseiro quadrado pro teto!',
    }),
    seq('carrinho-pousa', 'carrinho', 5.85, 0.3, [ch('position.y', CAR_Y + 0.25, CAR_Y)], { ease: 'easeIn' }),
    seq('mae-voa', 'mae', 5.45, 0.4, [ch('position.x', START_X, 1.2), ch('position.y', START_Y, 1.05), ch('rotation.z', 0, 0.35)], {
      ease: 'easeOut',
    }),
    seq('mae-mergulha', 'mae', 5.85, 0.4, [ch('position.x', 1.2, mx), ch('position.y', 1.05, my), ch('rotation.z', 0.35, MAE_TILT)], {
      ease: 'easeIn',
    }),
    seq('roupa-amassa', 'roupa', 6.25, 0.15, [ch('scale.y', 1, 0.82)], { ease: 'easeOut' }),
    seq('roupa-volta', 'roupa', 6.4, 0.3, [ch('scale.y', 0.82, 1)], { ease: 'easeOut' }),

    seq('placa-balanca', 'plaquinha', 7.0, 0.5, [ch('rotation.z', 0.7, -0.3), ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'No pulverizador, a plaquinha ESTÉRIL: o -RIL ficou entalado no tombo, sobrou só o STÉ.',
    }),
    seq('placa-assenta', 'plaquinha', 7.5, 0.6, [ch('rotation.z', -0.3, 0)], { ease: 'easeInOut' }),

    seq('filhote-surge', 'filhote', 8.7, 0.6, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Na cama, o filhote também está DE TROMBA: emburrado, de braços cruzados e beiço pra fora.',
    }),

    seq('pata-sai', 'pata', 10.2, 0.6, [ch('scale.y', 0.05, 1)], {
      ease: 'easeOut',
      caption: 'Do meio da roupa, a luva amarela se ergue e aponta pra ele: "STÉ-DA DE TROM!"',
    }),
    seq('pata-cutuca', 'pata', 11.4, 0.2, [ch('scale.y', 1, 1.15)], {
      ease: 'easeOut',
      caption: 'Städa ditt rum! — Arrume o seu quarto!',
    }),
    seq('pata-volta', 'pata', 11.6, 0.3, [ch('scale.y', 1.15, 1)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 2.55, 4.9], target: [-0.15, 0.82, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'stada-ditt-rum',
    contexto:
      "Família: pai e mãe pro filho, da pré-escola à adolescência, muitas vezes no 'städdag' (dia de faxina) do fim de semana. A cobrança seguinte é 'Har du städat ditt rum?' (Você arrumou o seu quarto?).",
    fraseFonte: 'Arrume o seu quarto!',
    fraseAlvo: 'Städa ditt rum!',
    pronuncia:
      "STÉÉ-da dit RÖMM! ('städa' com a força no STÉ: o S colado no T, sem 'is' na frente, É bem aberto e LONGO, e o -da fraquinho; 'ditt' curtinho, D de 'dado' e T seco; 'rum' com R de um toque só, de língua — nunca o RR de garganta —, vogal curta de bico, entre U e Ô, a mesma de 'buss', e M demorado, de lábios fechados)",
    ponteSonora:
      "(e)STÉ(ril)... DÁ DE TROM(ba)! (4 sílabas: STÉÉ-da-dit-RÖMM; força no STÉ e no TROM; (e)STÉ = o ESTÉRIL do pulverizador, cortado no tombo: o -RIL fica entalado e o E da frente também cai — S grudado direto no T, sem o 'is' que o brasileiro põe antes de S, como o (e)STÁ de 'Hur stavar man det?'; o É é BEM ABERTO e LONGO, o É de 'pé' esticado — é o ä longo, o mesmo do VÉÉG de 'Jag är på väg' e do LÉÉR de 'Jag lär mig svenska' —, e é nele a força; nunca o Ê fechado de 'este'; DÁ = o 'dá' do tombo, mas SEM PAUSA antes e mais fraco que o STÉ, só um eco grudado nele: STÉ-da é UMA palavra só, 'städa', e o imperativo é igual ao infinitivo, sem R nenhum; DE TROM(ba) = o 'ditt rum' inteiro, numa tacada: o DE é um DI curtinho, D de 'dado' — nunca o 'dji' —, e o T da TROMBA é o T de 'ditt' (dit-RÖMM), por isso o R vem colado no T e sai de um toque só, de língua, como em 'trombar' — nunca o RR de garganta de 'rua', que em sueco é H; o TROM sai ORAL, curto e de bico: o Ô fechado da tromba puxando pra U — a mesma vogal do BUS de 'buss' e do STUND de 'en stund', só que vista do outro lado: lá o U puxa pra Ô, aqui o Ô puxa pra U —; nunca um Ó aberto, de 'pó': com ele sai 'rom', que em sueco é o rum de beber e a ova de peixe; o M fecha os lábios de verdade e demora: RÖMM; o -BA fica amassado na meia; ATENÇÃO ao par: não é o DIN do turbante de 'Det är din tur' — 'rum' é palavra ETT, e aí o 'seu' vira 'ditt', com T, o T que abre a TROMBA; e de quebra 'rum' é o ROOM do inglês: quarto)",
    historia:
      "O quarto do filhote de VOMBATE virou um lixão: meia, casca de banana, carrinho, roupa por cima de roupa. A mãe vombate chega de luvas amarelas, óculos de proteção e um pulverizador nas costas e anuncia da porta: 'Este quarto vai ficar ESTÉ—', mas pisa num carrinho, voa e DÁ DE TROMBA no monte de roupa suja, com o traseiro quadrado de vombate apontado pro teto: o -RIL fica entalado e o -BA sai amassado numa meia. Na cama, o filhote também está DE TROMBA, emburrado de braço cruzado. Ela ergue a luva do meio da roupa, aponta pra ele e decreta, sem fôlego nem pra pausa: 'STÉ-DA DE TROM!' — arrume o seu quarto!",
  },
  createScene,
  refine: { organic: ['mae', 'cabeca', 'filhote'] },
}

export default card
