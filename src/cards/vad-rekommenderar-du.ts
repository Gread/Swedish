import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Vad rekommenderar du?" — VÁ-RE-CO-MEN-DÊ-RAR-DÜ?
 *
 * O cardápio é todo em sueco. Da cozinha surge a RECOMENDÊRA da casa: uma
 * unicórnia branca de lenço florido de benzedeira e raminho de arruda atrás
 * da orelha. Ela não lê cardápio, ela SENTE: passa o chifre por cima das três
 * travessas tampadas feito pêndulo até ele acender e travar numa só — e ergue
 * a cúpula com a ponta do chifre: salmão com endro, é este que eu recomendo.
 * O freguês, na ponta do balcão, aponta pra ela: DÜ?
 *
 * Diorama: piso de tábuas claras, balcão comprido de madeira escura com três
 * travessas brancas; a unicórnia atrás e à esquerda, de perfil 3/4, esticando
 * o pescoço sobre o balcão; o freguês na ponta direita, cardápio aberto no
 * balcão à frente dele.
 *
 * Cor: madeira clara + madeira escura + branco/prata; crina e rabo em
 * arco-íris PASTEL. Acento saturado RESERVADO: o OURO do chifre aceso, que
 * se repete só nas faíscas sobre o salmão (o chifre "aponta" o prato).
 */

const PISO = '#dcc096'
const PISO_B = '#d0b080'
const PISO_FRESTA = '#b48f62'
const PISO_BORDA = '#8f6c47'
const MADEIRA = '#4a2e1e' // balcão escuro
const MADEIRA_TAMPO = '#5e3b26'
const MADEIRA_FRISO = '#33200f'
const PAINEL = '#563624'
const PORCELANA = '#f6f3ee'
const AZUL_FILETE = '#5b7fb3'
const PRATA = '#c9ced5'
const SALMAO = '#f2866a'
const SALMAO_CLARO = '#fac7b2'
const ENDRO = '#5b9a3d'
const BATATA = '#ead39a'
const LIMAO = '#f1e5a6'
const BRANCO = '#f6f3ef' // a unicórnia
const BRANCO_SOMBRA = '#ebe5e8'
const FOCINHO = '#f6e0e0'
const CASCO = '#c3b8d4'
const ROSA = '#eda6b4'
const ROSA_ESC = '#c97f8f'
const OLHO = '#2a2142'
const LENCO = '#f2d064' // lenço amarelo-manteiga
const FLOR = '#fffaf0'
const MIOLO = '#d9534f'
const ARRUDA = '#5c9868'
const OURO = '#ffc21f' // acento: chifre aceso + faíscas
const OURO_LUZ = '#ffae00'
const OURO_CLARO = '#ffe9a0'
const ARCO = ['#f09c9c', '#f7c38e', '#f4e18c', '#a7d79e', '#9cc4ec', '#c2a6e6'] // arco-íris pastel
const CAMISA = '#4e7190'
const CALCA = '#2f3d52'
const PELE = '#e2b48c'
const CABELO = '#5a3b26'
const CARDAPIO = '#8e3b2f'
const PAPEL = '#f2e9d7'
const LINHA = '#9a8f80'

const GY = 0.14 // topo do piso
const TOP = 0.9 // tampo do balcão
const U = 1.2 // escala da unicórnia (construída em "unidades de cavalo")
const UROT = 0.3 // ela olha para +x, girada um pouco para a câmera
const UX = -0.92
const UZ = -0.5
const FACE_S = 1.22 // cabeça de desenho animado: o rosto é ampliado em torno de FACE_C
const FACE_C = new THREE.Vector3(0.6, 0.25, 0)
const HL = 0.44 // comprimento do chifre (antes da ampliação do rosto)
const SLIDE = 0.58 // espaçamento das travessas = passo do pêndulo para a direita
const SLIDE_L = 0.4 // para a esquerda o passo é menor: o rabo não sai da base
const BRACO_X = -2.2 // braço do freguês apontando (rotação no ombro)
const BRACO_Z = 0
const ABRE = 0.85 // freguês virado 3/4 para a câmera
const TILT = 0.1 // cúpula pendurada no chifre: leve inclinação

const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula do ponto `a` na direção `dir` (comprimento total `len`). */
function link(a: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, color: string) {
  const d = dir.clone().normalize()
  const c = capsule(r, Math.max(0.001, len - 2 * r), color, { roughness: 0.55 })
  c.quaternion.setFromUnitVectors(UP, d)
  c.position.copy(a).addScaledVector(d, len / 2)
  return c
}

/** Mecha ondulada: segmentos encadeados + cachinho na ponta. */
function strand(start: THREE.Vector3, dirs: [number, number, number][], lens: number[], r: number, color: string) {
  const g = new THREE.Group()
  const p = start.clone()
  dirs.forEach((d, i) => {
    const dir = new THREE.Vector3(...d).normalize()
    g.add(link(p, dir, lens[i], r, color))
    p.addScaledVector(dir, lens[i] - r)
  })
  const cacho = sphere(r * 1.12, color, { roughness: 0.55 })
  cacho.position.copy(p)
  g.add(cacho)
  return g
}

/** Faísca de 4 pontas virada para a câmera. */
function sparkle(s: number) {
  const g = new THREE.Group()
  const glow = { emissive: OURO, emissiveIntensity: 1.25, roughness: 0.4 }
  g.add(sphere(s * 0.3, '#fff3c4', glow))
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2
    const raio = cone(s * 0.2, s, OURO_CLARO, glow, 12)
    raio.position.set(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, 0)
    raio.rotation.z = a - Math.PI / 2
    raio.scale.z = 0.45
    g.add(raio)
  }
  return g
}

/** Cúpula prateada com aro e alça em argola (a argola fica no plano xy). */
function cloche() {
  const g = new THREE.Group()
  const metal = { roughness: 0.18, metalness: 0.85 }
  const casco = lathe(
    [
      [0.225, 0], [0.232, 0.012], [0.224, 0.05], [0.203, 0.11], [0.165, 0.165],
      [0.105, 0.205], [0.045, 0.223], [0, 0.227],
    ],
    PRATA,
    metal,
  )
  g.add(casco)
  const aro = torus(0.228, 0.013, PRATA, metal)
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.012
  g.add(aro)
  const pe = cylinder(0.022, 0.034, 0.025, PRATA, metal)
  pe.position.y = 0.235
  g.add(pe)
  const alca = torus(0.046, 0.013, PRATA, metal)
  alca.position.y = 0.285
  g.add(alca)
  return g
}

/** Travessa redonda de porcelana com filete azul. */
function platter() {
  const g = new THREE.Group()
  const prato = lathe(
    [
      [0, 0], [0.17, 0], [0.19, 0.012], [0.22, 0.03], [0.272, 0.045],
      [0.282, 0.056], [0.268, 0.06], [0.205, 0.038], [0, 0.033],
    ],
    PORCELANA,
    { roughness: 0.22 },
  )
  g.add(prato)
  const filete = torus(0.25, 0.005, AZUL_FILETE, { roughness: 0.3 })
  filete.rotation.x = Math.PI / 2
  filete.position.y = 0.051
  g.add(filete)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- UNICÓRNIA (espaço local: +x = frente, +z = lado da câmera) ----------
  // construída primeiro: o balcão, as travessas e o freguês se posicionam a
  // partir da ponta do chifre, para a cúpula pender exatamente sobre o prato.
  const unicornia = new THREE.Group()
  unicornia.position.set(UX, GY, UZ)
  unicornia.rotation.y = -UROT
  unicornia.scale.setScalar(U)
  root.add(unicornia)

  // pelagem acetinada: pouco grão, para não virar ovelha
  const pelo = { roughness: 0.5, detail: 0.45 }
  const corpo = capsule(0.31, 0.74, BRANCO, pelo)
  corpo.rotation.z = Math.PI / 2
  corpo.position.y = 0.98
  unicornia.add(corpo)

  const peito = sphere(0.34, BRANCO, pelo)
  peito.scale.set(1, 1, 0.9)
  peito.position.set(0.38, 1.0, 0)
  unicornia.add(peito)

  const anca = sphere(0.36, BRANCO, pelo)
  anca.scale.set(1, 1, 0.95)
  anca.position.set(-0.4, 1.03, 0)
  unicornia.add(anca)

  for (const [lx, back] of [[0.38, false], [-0.42, true]] as const) {
    for (const lz of [-0.15, 0.15]) {
      const x2 = lx + (back ? -0.03 : 0.01)
      const coxa = capsule(back ? 0.145 : 0.13, 0.24, BRANCO, pelo)
      coxa.position.set(lx, 0.67, lz)
      unicornia.add(coxa)
      const canela = capsule(0.082, 0.34, BRANCO_SOMBRA, pelo)
      canela.position.set(x2, 0.37, lz)
      unicornia.add(canela)
      const casco = cylinder(0.08, 0.095, 0.11, CASCO, { roughness: 0.35 })
      casco.position.set(x2, 0.055, lz)
      unicornia.add(casco)
    }
  }

  // ---- rabo arco-íris (dobradiça na base) ----------------------------------
  const rabo = new THREE.Group()
  rabo.position.set(-0.72, 1.14, 0)
  unicornia.add(rabo)
  const raboRaiz = capsule(0.08, 0.08, BRANCO, pelo)
  raboRaiz.rotation.z = 1.0
  raboRaiz.position.set(-0.04, 0, 0)
  rabo.add(raboRaiz)
  for (let k = 0; k < 6; k++) {
    const leque = (k - 2.5) / 2.5 // -1..1 através do leque
    rabo.add(strand(
      new THREE.Vector3(-0.08, 0, leque * 0.07),
      [[-0.85, 0.1, leque * 0.35], [-0.45, -0.9, leque * 0.4], [0.05, -1, leque * 0.25]],
      [0.2, 0.32, 0.26],
      0.068,
      ARCO[k],
    ))
  }

  // ---- pescoço + cabeça (dobradiça na base do pescoço) ---------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0.48, 1.13, 0)
  unicornia.add(cabeca)

  const nuca = sphere(0.24, BRANCO, pelo)
  nuca.position.set(0.02, 0, 0)
  cabeca.add(nuca)

  const pescoco = capsule(0.175, 0.42, BRANCO, pelo)
  pescoco.position.set(0.23, 0.11, 0)
  pescoco.rotation.z = -1.125
  cabeca.add(pescoco)

  // rosto ampliado em torno de FACE_C: os filhos usam coordenadas da cabeça
  const rosto = new THREE.Group()
  rosto.position.copy(FACE_C).multiplyScalar(1 - FACE_S)
  rosto.scale.setScalar(FACE_S)
  cabeca.add(rosto)

  const cranio = capsule(0.14, 0.26, BRANCO, pelo)
  cranio.position.set(0.64, 0.21, 0)
  cranio.rotation.z = 0.84
  rosto.add(cranio)

  const bochecha = sphere(0.16, BRANCO, pelo)
  bochecha.scale.set(1, 1, 0.88)
  bochecha.position.set(0.52, 0.27, 0)
  rosto.add(bochecha)

  const focinho = sphere(0.13, FOCINHO, pelo)
  focinho.scale.set(1, 0.95, 0.92)
  focinho.position.set(0.8, 0.09, 0)
  rosto.add(focinho)

  for (const side of [-1, 1]) {
    const narina = sphere(0.022, ROSA_ESC, { roughness: 0.5 })
    narina.scale.set(0.7, 1, 1)
    narina.position.set(0.9, 0.09, side * 0.06)
    rosto.add(narina)

    // olhão: esclera achatada, íris grande, brilho e três cílios
    const esclera = sphere(0.066, '#ffffff', { roughness: 0.25 })
    esclera.scale.set(0.9, 1, 0.55)
    esclera.position.set(0.6, 0.31, side * 0.122)
    const iris = sphere(0.048, OLHO, { roughness: 0.2 })
    iris.scale.set(0.9, 1, 0.6)
    iris.position.set(0.614, 0.304, side * 0.146)
    const brilho = sphere(0.015, '#ffffff', { roughness: 0.1 })
    brilho.position.set(0.63, 0.326, side * 0.172)
    rosto.add(esclera, iris, brilho)
    for (let c = 0; c < 3; c++) {
      const cilio = capsule(0.009, 0.04, OLHO, { roughness: 0.5 })
      cilio.position.set(0.555 + c * 0.03, 0.375 - Math.abs(c - 1) * 0.008, side * 0.13)
      cilio.rotation.set(side * 0.5, 0, 0.5 - c * 0.35)
      rosto.add(cilio)
    }

    const corado = sphere(0.042, ROSA, { roughness: 0.6 })
    corado.scale.set(1.1, 0.7, 0.35)
    corado.position.set(0.7, 0.19, side * 0.125)
    rosto.add(corado)

    const orelha = cone(0.055, 0.18, BRANCO, pelo)
    orelha.position.set(0.42, 0.53, side * 0.09)
    orelha.rotation.set(side * 0.35, 0, 0.3)
    rosto.add(orelha)
    const orelhaDentro = cone(0.032, 0.115, ROSA, { roughness: 0.6 })
    orelhaDentro.position.set(0.447, 0.52, side * 0.097)
    orelhaDentro.rotation.set(side * 0.35, 0, 0.3)
    rosto.add(orelhaDentro)
  }

  // ---- crina arco-íris (peça própria: mechas soltas, sem fundir) -----------
  const crina = new THREE.Group()
  cabeca.add(crina)
  const neckDir = new THREE.Vector3(0.902, 0.431, 0)
  const neckUp = new THREE.Vector3(-0.431, 0.902, 0)
  const NM = 6
  for (let k = 0; k < NM; k++) {
    const t = 0.44 - k * 0.088 // da nuca para a cernelha
    // a crista corre por fora da pele (o pescoço engrossa na base)
    const off = 0.19 + Math.max(0, 0.14 - t) * 0.45
    const crest = neckDir.clone().multiplyScalar(t).addScaledVector(neckUp, off)
    const cor = ARCO[k]
    const topo = sphere(0.09, cor, { roughness: 0.55 })
    topo.position.copy(crest)
    crina.add(topo)
    // mecha longa caindo pelo lado da câmera, curta do outro lado
    crina.add(strand(
      crest.clone().add(new THREE.Vector3(0, -0.02, 0.05)),
      [[-0.1, -0.25, 0.96], [-0.2, -0.95, 0.2], [0.12, -1, -0.05]],
      [0.17, 0.17, 0.12],
      0.064,
      cor,
    ))
    crina.add(strand(
      crest.clone().add(new THREE.Vector3(0, -0.02, -0.05)),
      [[-0.1, -0.25, -0.96], [-0.2, -0.95, -0.2]],
      [0.15, 0.12],
      0.056,
      cor,
    ))
  }
  // ---- lenço florido de benzedeira + arruda atrás da orelha ----------------
  const lenco = new THREE.Group()
  lenco.position.set(0.44, 0.32, 0)
  rosto.add(lenco)
  const LR = 0.18
  const touca = sphere(LR, LENCO, { roughness: 0.85 })
  touca.scale.set(0.95, 0.86, 1.14)
  touca.rotation.z = 0.5
  lenco.add(touca)
  // flores miúdas: miolo vermelho + 5 pétalas, só na metade da câmera
  const n = new THREE.Vector3()
  const t1 = new THREE.Vector3()
  const t2 = new THREE.Vector3()
  for (const [a, b] of [
    [0.4, 0.5], [1.2, 0.4], [2.0, 0.5], [0.8, 1.05], [1.65, 1.0], [2.4, 1.1], [1.2, 1.55], [0.3, 1.25],
  ] as const) {
    // a: ângulo em torno do eixo y (0 = +x); b: inclinação a partir do topo
    n.set(Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)).normalize()
    t1.crossVectors(n, UP).normalize()
    t2.crossVectors(n, t1).normalize()
    const flor = new THREE.Group()
    flor.position.copy(n).multiplyScalar(LR * 1.01)
    flor.add(sphere(0.014, MIOLO, { roughness: 0.5 }))
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2
      const petala = sphere(0.013, FLOR, { roughness: 0.6 })
      petala.position.copy(t1).multiplyScalar(Math.cos(ang) * 0.024).addScaledVector(t2, Math.sin(ang) * 0.024)
      flor.add(petala)
    }
    touca.add(flor)
  }
  // ponta do lenço caída na nuca
  const pontaLenco = cone(0.11, 0.2, LENCO, { roughness: 0.85 })
  pontaLenco.position.set(-0.15, -0.04, 0)
  pontaLenco.rotation.z = Math.PI / 2 + 0.55
  pontaLenco.scale.z = 0.45
  lenco.add(pontaLenco)
  // nó de benzedeira na nuca, com as duas pontas caindo no pescoço
  const no = sphere(0.055, LENCO, { roughness: 0.85 })
  no.scale.set(0.8, 1, 1.2)
  no.position.set(-0.16, -0.05, 0)
  lenco.add(no)
  for (const side of [-1, 1]) {
    const orelhaNo = sphere(0.05, LENCO, { roughness: 0.85 })
    orelhaNo.scale.set(0.6, 0.9, 1.3)
    orelhaNo.position.set(-0.17, -0.03, side * 0.075)
    lenco.add(orelhaNo)
    const pontaNo = capsule(0.032, 0.1, LENCO, { roughness: 0.85 })
    pontaNo.scale.set(1, 1, 0.55)
    pontaNo.position.set(-0.2, -0.14, side * 0.04)
    pontaNo.rotation.set(side * 0.3, 0, 0.45)
    lenco.add(pontaNo)
  }
  // arruda atrás da orelha do lado da câmera
  const arruda = new THREE.Group()
  arruda.position.set(-0.06, 0.15, 0.16)
  arruda.rotation.set(0.45, 0, 0.75)
  lenco.add(arruda)
  const haste = capsule(0.01, 0.15, '#4a7a3f', { roughness: 0.7 })
  haste.position.y = 0.08
  arruda.add(haste)
  for (let k = 0; k < 8; k++) {
    const folha = sphere(0.026, ARRUDA, { roughness: 0.7 })
    folha.scale.set(1, 0.55, 0.6)
    const lado = k % 2 ? 1 : -1
    folha.position.set(lado * 0.026, 0.035 + k * 0.02, 0)
    folha.rotation.z = lado * 0.5
    arruda.add(folha)
  }

  // ---- CHIFRE dourado em espiral (o acento) --------------------------------
  const chifre = new THREE.Group()
  chifre.position.set(0.665, 0.36, 0)
  chifre.rotation.z = -1.0
  rosto.add(chifre)
  const luz = { roughness: 0.3, emissive: OURO_LUZ, emissiveIntensity: 0.55 }
  const haste2 = cone(0.062, HL, OURO, luz)
  haste2.position.y = HL / 2
  chifre.add(haste2)
  for (let k = 0; k < 6; k++) {
    const y = 0.04 + k * 0.064
    const r = 0.062 * (1 - y / HL)
    const espiral = torus(r, 0.011 * (1 - (y / HL) * 0.45), '#f3a712', { roughness: 0.3, emissive: OURO_LUZ, emissiveIntensity: 0.5 })
    espiral.rotation.x = Math.PI / 2 + 0.22
    espiral.position.y = y
    chifre.add(espiral)
  }
  const pontaBrilho = sphere(0.02, '#fff3c0', { emissive: '#ffd65a', emissiveIntensity: 1.4 })
  pontaBrilho.position.y = HL
  chifre.add(pontaBrilho)
  const ponta = new THREE.Object3D()
  ponta.position.y = HL - 0.03
  chifre.add(ponta)

  // ---- aura: anéis de luz em volta do chifre (ele ACENDE) ------------------
  const aura = new THREE.Group()
  chifre.add(aura)
  for (const [y, r] of [[0.13, 0.12], [0.3, 0.085]] as const) {
    const anel = torus(r, 0.009, OURO_CLARO, { emissive: OURO, emissiveIntensity: 1.1 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = y
    aura.add(anel)
  }

  // ---- geometria derivada da ponta do chifre -------------------------------
  root.updateMatrixWorld(true)
  const tip = ponta.getWorldPosition(new THREE.Vector3())
  const hornBase = chifre.getWorldPosition(new THREE.Vector3())
  const hornDir = tip.clone().sub(hornBase).normalize()
  const olho = rosto.localToWorld(new THREE.Vector3(0.6, 0.31, 0.12))

  const MX = tip.x + 0.03 // travessa do meio
  const PZ = tip.z + 0.24 // fileira das travessas (a cúpula pende um pouco atrás)
  const CZ = PZ + 0.14 // travessas no fundo, cardápio na frente
  const CL = SLIDE * 2 + 0.84
  const CD = 0.84

  // ---- salão: piso de tábuas claras ----------------------------------------
  const base = new THREE.Group()
  const disco = cylinder(2.62, 2.7, 0.12, PISO_BORDA, { roughness: 0.8 })
  disco.position.y = 0.06
  base.add(disco)
  for (let i = -4; i <= 4; i++) {
    const z = i * 0.6
    const meia = Math.sqrt(Math.max(0, 2.56 * 2.56 - (Math.abs(z) + 0.29) ** 2))
    if (meia < 0.2) continue
    const tabua = rbox(meia * 2, 0.02, 0.57, 0.008, i % 2 === 0 ? PISO : PISO_B, { roughness: 0.7 })
    tabua.position.set((rand() - 0.5) * 0.04, GY - 0.01, z)
    base.add(tabua)
  }
  // emendas de topo das tábuas, desencontradas
  for (let i = -3; i <= 3; i++) {
    const z = i * 0.6
    const x = (i % 2 === 0 ? -0.9 : 0.7) + (rand() - 0.5) * 0.4
    const emenda = rbox(0.018, 0.022, 0.55, 0.006, PISO_FRESTA, { roughness: 0.8 })
    emenda.position.set(x, GY - 0.008, z)
    base.add(emenda)
  }
  // vaso de planta no canto da frente, emoldurando a cena
  const vaso = lathe(
    [[0, 0], [0.18, 0], [0.2, 0.05], [0.18, 0.32], [0.22, 0.36], [0.215, 0.39], [0.17, 0.34], [0, 0.33]],
    '#b8714f',
    { roughness: 0.55 },
  )
  vaso.position.set(-1.85, GY, 0.85)
  vaso.scale.setScalar(0.8)
  base.add(vaso)
  const folhagem = puff(0.24, '#4f8a4a', 7, 33, { roughness: 0.85 })
  folhagem.position.set(-1.85, GY + 0.53, 0.85)
  folhagem.scale.set(1, 1.1, 1)
  base.add(folhagem)
  root.add(base)

  // ---- balcão comprido de madeira escura -----------------------------------
  const balcao = new THREE.Group()
  balcao.position.set(MX, 0, CZ)
  root.add(balcao)

  const tampo = rbox(CL, 0.08, CD, 0.03, MADEIRA_TAMPO, { roughness: 0.45 })
  tampo.position.y = TOP - 0.04
  balcao.add(tampo)
  const friso = rbox(CL - 0.06, 0.05, CD - 0.06, 0.018, MADEIRA_FRISO, { roughness: 0.6 })
  friso.position.y = TOP - 0.1
  balcao.add(friso)
  const PH = TOP - 0.125 - GY - 0.07
  const caixa = rbox(CL - 0.14, PH, CD - 0.16, 0.03, MADEIRA, { roughness: 0.6 })
  caixa.position.y = GY + 0.07 + PH / 2
  balcao.add(caixa)
  // almofadas (painéis) na frente do balcão
  const NP = 4
  const pw = (CL - 0.14) / NP
  for (let i = 0; i < NP; i++) {
    const painel = rbox(pw - 0.1, PH - 0.12, 0.03, 0.02, PAINEL, { roughness: 0.55 })
    painel.position.set(-(CL - 0.14) / 2 + pw * (i + 0.5), GY + 0.07 + PH / 2, (CD - 0.16) / 2 + 0.012)
    balcao.add(painel)
  }
  const rodape = rbox(CL - 0.08, 0.07, CD - 0.1, 0.02, MADEIRA_FRISO, { roughness: 0.6 })
  rodape.position.y = GY + 0.035
  balcao.add(rodape)

  // campainha de balcão, na frente da primeira travessa
  const campainha = new THREE.Group()
  campainha.position.set(-SLIDE - 0.08, TOP, 0.27)
  const sino = lathe(
    [[0, 0], [0.075, 0], [0.078, 0.012], [0.07, 0.04], [0.045, 0.07], [0, 0.078]],
    PRATA,
    { roughness: 0.15, metalness: 0.85 },
  )
  sino.position.y = 0.02
  campainha.add(sino)
  const sinoBase = cylinder(0.085, 0.09, 0.022, '#2e2a2a', { roughness: 0.5 })
  sinoBase.position.y = 0.011
  campainha.add(sinoBase)
  const botao = sphere(0.016, PRATA, { roughness: 0.15, metalness: 0.85 })
  botao.position.y = 0.102
  campainha.add(botao)
  balcao.add(campainha)

  // cardápio aberto na ponta do balcão: páginas de linhas ilegíveis
  const cardapio = new THREE.Group()
  cardapio.position.set(SLIDE + 0.02, TOP + 0.014, 0.27)
  cardapio.rotation.set(0.1, -0.3, 0)
  cardapio.scale.setScalar(0.85)
  balcao.add(cardapio)
  for (const s of [-1, 1]) {
    const metade = new THREE.Group()
    metade.rotation.z = -s * 0.08
    cardapio.add(metade)
    const capa = rbox(0.24, 0.014, 0.32, 0.01, CARDAPIO, { roughness: 0.6 })
    capa.position.x = s * 0.12
    metade.add(capa)
    const folha = rbox(0.21, 0.008, 0.29, 0.005, PAPEL, { roughness: 0.8 })
    folha.position.set(s * 0.12, 0.011, 0)
    metade.add(folha)
    for (let r = 0; r < 6; r++) {
      const w = 0.08 + rand() * 0.08
      const linha = rbox(w, 0.004, 0.014, 0.003, LINHA, { roughness: 0.8 })
      linha.position.set(s * 0.12 - (0.16 - w) / 2, 0.016, -0.1 + r * 0.04)
      metade.add(linha)
    }
  }

  // ---- três travessas (a do meio guarda o salmão) --------------------------
  const travessas = new THREE.Group()
  travessas.position.set(MX, TOP, PZ)
  root.add(travessas)
  for (const dx of [-SLIDE, 0, SLIDE]) {
    const t = platter()
    t.position.x = dx
    travessas.add(t)
    if (dx !== 0) {
      const tampaLado = cloche()
      tampaLado.position.set(dx, 0.033, 0)
      tampaLado.rotation.y = rand() * Math.PI
      travessas.add(tampaLado)
    }
  }
  // salmão com endro, batatinhas e limão
  const prato = new THREE.Group()
  prato.position.set(0, 0.035, 0)
  prato.rotation.y = 0.3
  travessas.add(prato)
  const file = rbox(0.34, 0.085, 0.17, 0.04, SALMAO, { roughness: 0.45 })
  file.position.y = 0.045
  prato.add(file)
  for (let k = 0; k < 6; k++) {
    const veio = rbox(0.013, 0.008, 0.15, 0.004, SALMAO_CLARO, { roughness: 0.5 })
    veio.position.set(-0.13 + k * 0.052, 0.089, 0)
    veio.rotation.y = 0.45
    prato.add(veio)
  }
  for (let k = 0; k < 5; k++) {
    const raminho = capsule(0.012, 0.075, ENDRO, { roughness: 0.7 })
    raminho.position.set(-0.04 + k * 0.02, 0.1, (rand() - 0.5) * 0.04)
    raminho.rotation.set(Math.PI / 2 + (rand() - 0.5) * 0.4, 0, (k - 2) * 0.35)
    prato.add(raminho)
  }
  for (const [bx, bz] of [[-0.13, 0.13], [0.01, 0.145], [0.15, 0.11]] as const) {
    const batata = sphere(0.048, BATATA, { roughness: 0.6 })
    batata.scale.set(1, 0.8, 0.9)
    batata.position.set(bx, 0.03, bz)
    prato.add(batata)
    const pinta = sphere(0.01, ENDRO, { roughness: 0.7 })
    pinta.position.set(bx + 0.01, 0.067, bz + 0.01)
    prato.add(pinta)
  }
  const limao = cylinder(0.048, 0.048, 0.018, LIMAO, { roughness: 0.4 })
  limao.rotation.set(Math.PI / 2, 0, 0.3)
  limao.position.set(0.2, 0.05, -0.07)
  prato.add(limao)

  // ---- cúpula do meio: pende da ponta do chifre ----------------------------
  const DOME_Y0 = TOP + 0.033 // pousada na travessa
  const RING_Y = 0.285
  const hd = new THREE.Vector3(hornDir.x, 0, hornDir.z).normalize()
  const domeFinal = tip.clone()
  domeFinal.y -= RING_Y
  const tampa = cloche()
  tampa.position.copy(domeFinal)
  tampa.rotation.set(TILT, Math.atan2(hd.x, hd.z), 0, 'YXZ')
  root.add(tampa)

  // ---- três faíscas douradas sobre o salmão --------------------------------
  const faiscas = new THREE.Group()
  faiscas.position.set(MX, TOP + 0.34, PZ)
  root.add(faiscas)
  for (const [fx, fy, s] of [[-0.15, 0.0, 0.12], [0.14, 0.08, 0.1], [-0.01, 0.22, 0.14]] as const) {
    const f = sparkle(s)
    f.position.set(fx, fy, 0.08)
    faiscas.add(f)
  }

  // ---- freguês na ponta do balcão, apontando pra ela -----------------------
  const fregues = person({ body: CAMISA, skin: PELE, height: 1.5, armAngle: 0.3 })
  const FX = MX + SLIDE + 0.74
  const FZ = PZ + 0.22
  fregues.position.set(FX, GY, FZ)
  // o corpo abre 3/4 pra câmera (rosto à mostra); só o braço mira a unicórnia
  const mira = Math.atan2(olho.x - FX, olho.z - FZ)
  fregues.rotation.y = mira + ABRE
  root.add(fregues)

  const calca = cylinder(0.25, 0.23, 0.2, CALCA, { roughness: 0.8 })
  calca.position.y = 0.12
  fregues.add(calca)
  const cinto = torus(0.252, 0.022, '#3a2a1e', { roughness: 0.6 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.225
  fregues.add(cinto)

  const fHead = fregues.getObjectByName('head')!
  const cabelo = sphere(0.29, CABELO, { roughness: 0.85 })
  cabelo.scale.set(1.03, 0.62, 1.04)
  cabelo.position.set(0, 0.11, -0.03)
  fHead.add(cabelo)
  const franja = puff(0.1, CABELO, 4, 9, { roughness: 0.85 })
  franja.position.set(0.05, 0.2, 0.18)
  franja.scale.set(1.2, 0.6, 0.8)
  fHead.add(franja)
  const boca = sphere(0.045, '#5a2626', { roughness: 0.6 })
  boca.scale.set(1, 0.9, 0.5)
  boca.position.set(0, -0.1, 0.262)
  fHead.add(boca)

  // aponta com o braço do lado da unicórnia (não cruza o rosto)
  const xLocal = new THREE.Vector3(Math.cos(fregues.rotation.y), 0, -Math.sin(fregues.rotation.y))
  const lado = xLocal.dot(new THREE.Vector3(Math.sin(mira), 0, Math.cos(mira))) >= 0 ? 1 : -1
  const braco = fregues.getObjectByName(lado > 0 ? 'armR' : 'armL')!
  shoulderPivot(braco, 1.5)
  // ordem YXZ: o giro em y (desfaz a abertura do corpo) é na vertical do freguês
  braco.rotation.set(BRACO_X, -ABRE, BRACO_Z, 'YXZ')
  const mao = braco.children[0]
  const dedo = capsule(0.03, 0.09, PELE, { roughness: 0.6 })
  dedo.position.set(0, mao.position.y - 0.11, 0)
  braco.add(dedo)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'salao', object: base },
    { name: 'balcao', group: 'salao', object: balcao },
    { name: 'travessas', group: 'travessas', object: travessas },
    { name: 'tampa', group: 'travessas', object: tampa },
    { name: 'fregues', group: 'fregues', object: fregues },
    { name: 'braco', group: 'fregues', object: braco },
    { name: 'unicornia', group: 'unicornia', object: unicornia },
    { name: 'cabeca', group: 'unicornia', object: cabeca },
    { name: 'rabo', group: 'unicornia', object: rabo },
    { name: 'crina', group: 'unicornia', object: crina },
    { name: 'lenco', group: 'unicornia', object: lenco },
    { name: 'chifre', group: 'chifre', object: chifre },
    { name: 'aura', group: 'acende', object: aura },
    { name: 'faiscas', group: 'revela', object: faiscas },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um restaurante sobe do chão: piso de tábuas claras e um balcão de madeira escura.',
    }),
    seq('balcao-rise', 'balcao', 0.25, 0.9, [riseFrom(0, 1.3)], { ease: 'easeOut' }),

    seq('travessas-crescem', 'travessas', 1.4, 0.6, grow(), {
      ease: 'easeOut',
      caption: 'Três travessas tampadas, e o cardápio é todo em sueco: nenhum prato diz nada.',
    }),
    seq('tampa-pousa', 'tampa', 1.55, 0.55, [ch('position.y', DOME_Y0 + 0.9, DOME_Y0)], { ease: 'easeIn' }),

    seq('fregues-rise', 'fregues', 2.9, 0.8, [riseFrom(GY, 1.6)], {
      ease: 'easeOut',
      caption: 'Você olha o cardápio, não entende nada e solta um VÁ? desesperado.',
    }),
    seq('braco-assenta', 'braco', 2.9, 0.8, [ch('rotation.z', -lado * 0.6, -lado * 0.3)], { ease: 'easeOut' }),

    seq('unicornia-rise', 'unicornia', 4.2, 0.9, [riseFrom(GY, 2.3)], {
      ease: 'easeOut',
      caption: 'Da cozinha surge a RECOMENDÊRA da casa: uma unicórnia de lenço florido e arruda atrás da orelha.',
    }),
    seq('cabeca-ergue', 'cabeca', 4.35, 0.8, [ch('rotation.z', -0.6, 0)], { ease: 'easeOut' }),
    seq('rabo-abana', 'rabo', 4.5, 0.8, [ch('rotation.z', 0.7, 0)], { ease: 'easeOut' }),
    seq('crina-cresce', 'crina', 4.6, 0.6, grow(), { ease: 'easeOut' }),
    seq('lenco-cresce', 'lenco', 4.9, 0.5, grow(), { ease: 'easeOut' }),

    seq('chifre-brota', 'chifre', 6.0, 0.6, [ch('scale.y', 0.02, 1), ch('scale.x', 0.4, 1), ch('scale.z', 0.4, 1)], {
      ease: 'easeOut',
      caption: 'Ela não lê cardápio: ela sente. Passa o chifre por cima das travessas, feito pêndulo…',
    }),
    seq('pendulo-1', 'unicornia', 6.6, 0.7, [ch('position.x', UX, UX - SLIDE_L)], { ease: 'easeInOut' }),
    seq('fareja-1', 'cabeca', 6.6, 0.7, [ch('rotation.y', 0, 0.15)]),
    seq('pendulo-2', 'unicornia', 7.3, 1.1, [ch('position.x', UX - SLIDE_L, UX + SLIDE)], { ease: 'easeInOut' }),
    seq('fareja-2', 'cabeca', 7.3, 1.1, [ch('rotation.y', 0.15, -0.15)]),
    seq('pendulo-3', 'unicornia', 8.4, 0.6, [ch('position.x', UX + SLIDE, UX)], { ease: 'easeOut' }),
    seq('fareja-3', 'cabeca', 8.4, 0.6, [ch('rotation.y', -0.15, 0)], { ease: 'easeOut' }),

    seq('aura-acende', 'aura', 9.0, 0.5, grow(0.2), {
      ease: 'easeOut',
      caption: '…até ele esquentar, acender e travar em cima de uma só.',
    }),

    seq('braco-aponta', 'braco', 10.0, 0.6, [ch('rotation.x', 0, BRACO_X), ch('rotation.y', 0, -ABRE), ch('rotation.z', -lado * 0.3, BRACO_Z)], {
      ease: 'easeOut',
      caption: 'Você aponta pra ela e emenda tudo num fôlego só: VÁ-RE-CO-MEN-DÊ-RAR-DÜ?',
    }),

    seq(
      'tampa-ergue',
      'tampa',
      11.2,
      0.8,
      [
        ch('position.y', DOME_Y0, domeFinal.y),
        ch('position.x', MX, domeFinal.x),
        ch('position.z', PZ, domeFinal.z),
        ch('rotation.x', 0, TILT + 0.12),
      ],
      { ease: 'easeOut', caption: 'Ela ergue a tampa com a ponta do chifre aceso: é este que eu recomendo!' },
    ),
    seq('faiscas-brilham', 'faiscas', 11.5, 0.5, grow(), { ease: 'easeOut' }),
    seq('tampa-balanca', 'tampa', 12.4, 0.6, [ch('rotation.x', TILT + 0.12, TILT)], {
      caption: 'Vad rekommenderar du? — O que você recomenda?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 2.45, 4.8], target: [0.32, 1.12, -0.12] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-rekommenderar-du',
    contexto:
      "Restaurante: com o cardápio aberto, quando os nomes dos pratos não dizem nada ('dagens', 'husmanskost', 'pyttipanna'), pergunta ao garçom. Também serve com amigos e colegas: 'Vad rekommenderar du i Göteborg?'.",
    fraseFonte: 'O que você recomenda?',
    fraseAlvo: 'Vad rekommenderar du?',
    pronuncia:
      "va-re-ko-men-DÊ-rar dü ('vad' perde o d e emenda no 're' sem pausa; o 'ko' é curto e fraco, de 'cópia'; a força cai no DÊ, Ê fechado e longo, e não no fim como no português 'recomendAR'; o R inicial é um toque só, de 'caro', nunca o RR carioca; o -r final cola no 'du'; 'du' com ü de bico)",
    ponteSonora:
      "VÁ-RE-CO-MEN-DÊ-RAR-DÜ? (7 sílabas num fôlego só: va-re-ko-men-DÊ-rar-dü; a força TODA no DÊ; VÁ é o MESMO 'vad' de 'VÁ, CÜL!', 'VÁ! É CLÓ-CAN' e 'Vad sa du?', um grito sem R próprio; RECOMENDÊRA é a 'recomendadeira' dita à caipira, como cadêra, bandêra, benzedêra, e o caipira acerta a tônica que o português erra: a força cai no DÊ, Ê FECHADO e longo, e não no fim como em 'recomendAR'; o RE vem COLADO no VÁ, sem pausa nem interrogação no meio (va-re...), pra o R ficar entre vogais e sair BRANDO, um toque só, de 'caro': depois de uma pausa o brasileiro faz RR carioca, que em sueco soa como H; esse R é do RE, não do VÁ (VÁR seria 'var', onde); 'men' sem nasal, a língua bate no N antes do D; o R do fim é OBRIGATÓRIO e BRANDO, à caipira, e encosta direto no DÜ: recomendêrar-DÜ, como o IÓBAR-DÜ de 'Vad jobbar du med?'; sem ele sobra 'rekommendera', o infinitivo; DÜ = o 'du' de CAN-DU, com BICO DE PATO, apontado pra ela)",
    historia:
      'O cardápio é todo em sueco e nenhum prato diz nada, então você solta um VÁ? desesperado. Da cozinha surge a RECOMENDÊRA da casa: uma unicórnia branca de lenço florido na cabeça e raminho de arruda atrás da orelha que, como as benzedêras do interior, não lê cardápio: ela SENTE. Passa o chifre por cima das três travessas tampadas, devagar, feito pêndulo, até ele esquentar, acender e travar em cima de uma só. Você aponta pra ela e emenda tudo num fôlego só, VÁ-RECOMENDÊRAR-DÜ?, e ela ergue a tampa com a ponta do chifre aceso: é este que eu recomendo.',
  },
  createScene,
  refine: { organic: ['unicornia', 'cabeca'] },
}

export default card
