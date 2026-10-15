import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'
import type { MatOpts } from '../rig/helpers'

/**
 * "Det spelar ingen roll." — DÊ-SPÊÊ-la-RÍNG-en (ce)RÓL!
 *
 * O esquilo foi DESPÊ-jado do próprio LAR (placa vermelha DESPEJO pregada na
 * toca), ganhou uma ÍNGUA roxa no pescoço e teve a pipa cortada pelo CEROL de
 * um rival. E daí? Trouxinha de nozes no ombro, linha cortada na pata, ele dá
 * de ombros: tanto faz.
 *
 * Diorama: gramado verde-musgo; tronco escuro à esquerda com a toca lacrada e
 * a placa (acento vermelho reservado à placa DESPEJO); esquilo ruivo grande no
 * centro; rabo em S atrás à direita; pipa amarela fugindo no alto à direita.
 */

const TERRA = '#4a3626'
const MUSGO = '#62803d'
const MUSGO_ESC = '#4f6a31'
const CASCA = '#5a3f2c'
const CASCA_ESC = '#46301f'
const CASCA_CLARA = '#7a5a3f'
const TABUA = '#9a7a55'
const RUIVO = '#c8662a'
const RUIVO_ESC = '#a14f1f'
const CREME = '#f1e1c4'
const ROSA = '#d99a8c'
const PRETO = '#1c1614'
const BEGE = '#d9c49b'
const BEGE_ESC = '#b9a179'
const NOZ = '#7a4f2a'
const ROXO = '#7b3fa6'
const AMARELO = '#efc444'
const TIJOLO = '#b5533c'
const PRATA = '#d6dde4'
const VERMELHO = '#d42a22' // acento saturado, RESERVADO à placa DESPEJO

const GY = 0.16 // topo do gramado

const TREE: [number, number, number] = [-1.05, GY, -0.8]
const TRUNK_R = 0.5 // raio do tronco na altura da toca/placa

const SQ: [number, number, number] = [0.32, GY, 0.32]
const SQ_S = 1.15 // escala do esquilo

// pose do ombro: pose final = 0 (dando de ombros); de partida, braços caídos
const PATA_CAIDA = 1.15

const KITE: [number, number, number] = [2.12, 2.42, -0.25]

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, CREME, { roughness: 0.55 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

type Glyph = 'D' | 'E' | 'S' | 'P' | 'J' | 'O'

/** Letras de traço grosso: célula ~0.1 × 0.16. */
function letter(which: Glyph) {
  const g = new THREE.Group()
  const t = 0.026
  const H = 0.16
  const top = H / 2 - t / 2
  if (which === 'D') {
    g.add(stroke(t, H, -0.037, 0))
    g.add(stroke(0.06, t, -0.012, top))
    g.add(stroke(0.06, t, -0.012, -top))
    g.add(stroke(t, 0.1, 0.037, 0))
    g.add(stroke(t, 0.045, 0.022, 0.05, 0.75))
    g.add(stroke(t, 0.045, 0.022, -0.05, -0.75))
  } else if (which === 'E') {
    g.add(stroke(t, H, -0.035, 0))
    g.add(stroke(0.085, t, 0.005, top))
    g.add(stroke(0.07, t, -0.002, 0))
    g.add(stroke(0.085, t, 0.005, -top))
  } else if (which === 'S') {
    g.add(stroke(0.085, t, 0, top))
    g.add(stroke(0.085, t, 0, 0))
    g.add(stroke(0.085, t, 0, -top))
    g.add(stroke(t, 0.08, -0.03, 0.04))
    g.add(stroke(t, 0.08, 0.03, -0.04))
  } else if (which === 'P') {
    g.add(stroke(t, H, -0.035, 0))
    g.add(stroke(0.08, t, 0.002, top))
    g.add(stroke(0.08, t, 0.002, 0.005))
    g.add(stroke(t, 0.08, 0.035, 0.04))
  } else if (which === 'J') {
    g.add(stroke(0.08, t, 0.005, top))
    g.add(stroke(t, H, 0.03, 0))
    g.add(stroke(0.07, t, 0, -top))
    g.add(stroke(t, 0.05, -0.03, -0.045))
  } else {
    g.add(stroke(t, H, -0.035, 0))
    g.add(stroke(t, H, 0.035, 0))
    g.add(stroke(0.085, t, 0, top))
    g.add(stroke(0.085, t, 0, -top))
  }
  return g
}

/** Cilindro entre dois pontos (gravetos, linha, traços). */
function segment(
  a: THREE.Vector3, b: THREE.Vector3, r: number, color: string,
  opts: MatOpts = {},
) {
  const d = new THREE.Vector3().subVectors(b, a)
  const c = cylinder(r, r, d.length(), color, opts, 10)
  c.position.copy(a).addScaledVector(d, 0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return c
}

/** Cápsula alinhada de a até b (membros do esquilo). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = new THREE.Vector3().subVectors(b, a)
  const c = capsule(r, Math.max(0.01, d.length()), color, { roughness: 0.85 })
  c.position.copy(a).addScaledVector(d, 0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return c
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

  // ---- gramado verde-musgo -------------------------------------------------
  const base = new THREE.Group()

  const solo = cylinder(2.6, 2.7, 0.12, TERRA, { roughness: 0.95 })
  solo.position.y = 0.06
  base.add(solo)

  const grama = cylinder(2.56, 2.6, 0.05, MUSGO, { roughness: 0.92 })
  grama.position.y = GY - 0.025
  base.add(grama)

  // tufos de capim espalhados (rng fixo), longe do centro
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.55 + rand() * 0.85
    const tufo = new THREE.Group()
    tufo.position.set(Math.cos(a) * r, GY, Math.sin(a) * r)
    for (let k = 0; k < 4; k++) {
      const folha = cone(0.025, 0.16 + rand() * 0.1, k % 2 ? MUSGO_ESC : '#77944a', { roughness: 0.9 }, 6)
      folha.position.set((rand() - 0.5) * 0.08, 0.08, (rand() - 0.5) * 0.08)
      folha.rotation.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5)
      tufo.add(folha)
    }
    base.add(tufo)
  }

  for (const [x, z, r, s] of [[1.85, 1.1, 0.16, 3], [-1.95, 0.85, 0.12, 5], [2.05, -0.6, 0.2, 7]] as const) {
    const pedra = rock(r, '#7b766c', s, { roughness: 0.9 })
    pedra.position.set(x, GY + r * 0.4, z)
    base.add(pedra)
  }

  // cogumelos ao pé do tronco
  for (const [x, z, s] of [[-1.72, -0.2, 1], [-1.55, -0.05, 0.7]] as const) {
    const cog = new THREE.Group()
    cog.position.set(x, GY, z)
    cog.scale.setScalar(s)
    const pe = cylinder(0.03, 0.04, 0.12, CREME, { roughness: 0.7 })
    pe.position.y = 0.06
    cog.add(pe)
    const chapeu = lathe([[0, 0], [0.1, 0], [0.08, 0.05], [0.04, 0.08], [0, 0.085]], '#b88a5a', { roughness: 0.6 })
    chapeu.position.y = 0.1
    cog.add(chapeu)
    base.add(cog)
  }

  // nozes caídas no gramado
  for (const [x, z] of [[0.95, 1.05], [-0.35, 1.25], [1.15, 0.85]] as const) {
    const noz = sphere(0.055, NOZ, { roughness: 0.6 })
    noz.scale.set(1, 0.85, 1)
    noz.position.set(x, GY + 0.045, z)
    base.add(noz)
  }

  root.add(base)

  // ---- tronco com a toca ---------------------------------------------------
  const tronco = new THREE.Group()
  tronco.position.set(...TREE)

  const fuste = lathe(
    [
      [0, 0], [0.78, 0], [0.66, 0.1], [0.56, 0.3], [0.51, 0.7], [TRUNK_R, 1.2],
      [0.48, 1.9], [0.46, 2.5], [0.44, 3.0], [0, 3.0],
    ],
    CASCA,
    { roughness: 0.9 },
  )
  tronco.add(fuste)

  // sulcos verticais da casca
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.2
    const sulco = rbox(0.04, 1.9 + rand() * 0.6, 0.04, 0.015, CASCA_ESC, { roughness: 0.95 })
    sulco.position.set(Math.sin(a) * 0.485, 1.45, Math.cos(a) * 0.485)
    sulco.rotation.y = a
    tronco.add(sulco)
  }

  // raízes
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4
    const raiz = capsule(0.11, 0.42, CASCA, { roughness: 0.9 })
    raiz.position.set(Math.sin(a) * 0.72, 0.07, Math.cos(a) * 0.72)
    raiz.rotation.set(Math.cos(a) * 1.25, 0, -Math.sin(a) * 1.25)
    tronco.add(raiz)
  }

  // galho e copa no alto
  const galho = capsule(0.09, 0.6, CASCA, { roughness: 0.9 })
  galho.position.set(0.55, 2.55, 0.05)
  galho.rotation.z = -1.0
  tronco.add(galho)
  const copa = puff(0.55, '#57793a', 7, 12, { roughness: 0.9 })
  copa.position.set(0.05, 3.15, 0)
  tronco.add(copa)
  const copa2 = puff(0.32, '#4d6d33', 5, 13, { roughness: 0.9 })
  copa2.position.set(0.85, 2.85, 0.1)
  tronco.add(copa2)

  // toca redonda (buraco preto com borda), na frente do tronco
  const tocaY = 1.1
  const borda = torus(0.2, 0.06, CASCA_CLARA, { roughness: 0.85 })
  borda.position.set(0, tocaY, TRUNK_R + 0.01)
  tronco.add(borda)
  const buraco = cylinder(0.2, 0.2, 0.06, '#120c08', { roughness: 1 })
  buraco.rotation.x = Math.PI / 2
  buraco.position.set(0, tocaY, TRUNK_R - 0.01)
  tronco.add(buraco)
  // tábuas em X lacrando a toca
  for (const r of [0.65, -0.65]) {
    const t = rbox(0.6, 0.09, 0.035, 0.012, TABUA, { roughness: 0.8 })
    t.position.set(0, tocaY, TRUNK_R + 0.08 + (r > 0 ? 0 : 0.03))
    t.rotation.z = r
    tronco.add(t)
    for (const s of [-1, 1]) {
      const prego = cylinder(0.014, 0.014, 0.02, '#8d9399', { roughness: 0.3, metalness: 0.8 }, 8)
      prego.rotation.x = Math.PI / 2
      prego.position.set(s * Math.cos(r) * 0.24, tocaY + s * Math.sin(r) * 0.24, TRUNK_R + 0.12)
      tronco.add(prego)
    }
  }

  root.add(tronco)

  // ---- placa vermelha DESPEJO (acento) -------------------------------------
  const placa = new THREE.Group()
  placa.position.set(TREE[0] - 0.17, TREE[1] + 1.86, TREE[2] + TRUNK_R + 0.06)
  placa.rotation.set(0, 0.12, 0.06)

  const chapa = rbox(1.08, 0.3, 0.05, 0.03, VERMELHO, { roughness: 0.45 })
  placa.add(chapa)
  const friso = rbox(1.0, 0.23, 0.01, 0.02, '#a81d18', { roughness: 0.5 })
  friso.position.z = 0.024
  placa.add(friso)

  const glyphs: Glyph[] = ['D', 'E', 'S', 'P', 'E', 'J', 'O']
  glyphs.forEach((gl, i) => {
    const l = letter(gl)
    l.position.set(-0.405 + i * 0.135, 0, 0.034)
    placa.add(l)
  })
  for (const s of [-1, 1]) {
    const prego = sphere(0.022, '#8d9399', { roughness: 0.3, metalness: 0.8 })
    prego.position.set(s * 0.5, 0.1, 0.03)
    placa.add(prego)
  }
  root.add(placa)

  // ---- esquilo (corpo) ------------------------------------------------------
  const esquilo = new THREE.Group()
  esquilo.position.set(...SQ)
  esquilo.rotation.y = -0.12
  esquilo.scale.setScalar(SQ_S)
  root.add(esquilo)

  const quadril = sphere(0.36, RUIVO, { roughness: 0.85 })
  quadril.scale.set(1, 0.95, 0.88)
  quadril.position.y = 0.46
  esquilo.add(quadril)

  const peito = capsule(0.27, 0.3, RUIVO, { roughness: 0.85 })
  peito.position.set(0, 0.86, 0.01)
  esquilo.add(peito)

  const barriga = sphere(0.3, CREME, { roughness: 0.85 })
  barriga.scale.set(0.82, 1.3, 0.6)
  barriga.position.set(0, 0.66, 0.15)
  esquilo.add(barriga)

  for (const side of [-1, 1]) {
    const coxa = sphere(0.22, RUIVO, { roughness: 0.85 })
    coxa.scale.set(0.9, 1, 1.05)
    coxa.position.set(side * 0.24, 0.3, 0.05)
    esquilo.add(coxa)

    const pe = sphere(0.13, RUIVO_ESC, { roughness: 0.85 })
    pe.scale.set(0.75, 0.4, 1.5)
    pe.position.set(side * 0.22, 0.05, 0.2)
    esquilo.add(pe)
    for (let d = -1; d <= 1; d++) {
      const dedo = sphere(0.035, RUIVO_ESC, { roughness: 0.85 })
      dedo.position.set(side * 0.22 + d * 0.045, 0.035, 0.38)
      esquilo.add(dedo)
    }
  }

  // ---- cabeça ---------------------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.36, 0.04)
  esquilo.add(cabeca)

  const cranio = sphere(0.27, RUIVO, { roughness: 0.85 })
  cranio.scale.set(1.02, 0.94, 0.98)
  cabeca.add(cranio)

  for (const side of [-1, 1]) {
    const bochecha = sphere(0.14, RUIVO, { roughness: 0.85 })
    bochecha.position.set(side * 0.13, -0.08, 0.13)
    cabeca.add(bochecha)
  }

  const focinho = sphere(0.14, CREME, { roughness: 0.85 })
  focinho.scale.set(1.05, 0.8, 0.9)
  focinho.position.set(0, -0.08, 0.2)
  cabeca.add(focinho)

  const nariz = sphere(0.045, '#3a2420', { roughness: 0.3 })
  nariz.scale.set(1.3, 0.85, 1)
  nariz.position.set(0, -0.03, 0.325)
  cabeca.add(nariz)

  // dentinhos brancos
  for (const side of [-1, 1]) {
    const dente = rbox(0.04, 0.07, 0.02, 0.008, '#fbf8ef', { roughness: 0.3 })
    dente.position.set(side * 0.022, -0.19, 0.275)
    cabeca.add(dente)
  }

  for (const side of [-1, 1]) {
    // olhos: grandes, pretos e brilhantes, com reflexo
    const olho = sphere(0.062, PRETO, { roughness: 0.15 })
    olho.scale.set(0.9, 1.1, 0.6)
    olho.position.set(side * 0.125, 0.06, 0.22)
    cabeca.add(olho)
    const brilho = sphere(0.018, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.125 + 0.02, 0.09, 0.26)
    cabeca.add(brilho)
    // pálpebra caída de quem não liga mais pra nada
    const palpebra = sphere(0.066, RUIVO, { roughness: 0.85 })
    palpebra.scale.set(0.95, 0.55, 0.62)
    palpebra.position.set(side * 0.125, 0.1, 0.222)
    cabeca.add(palpebra)

    // orelhas pontudas com tufinho
    const orelha = cone(0.085, 0.22, RUIVO, { roughness: 0.85 })
    orelha.position.set(side * 0.15, 0.27, -0.02)
    orelha.rotation.z = -side * 0.28
    cabeca.add(orelha)
    const dentro = cone(0.05, 0.13, ROSA, { roughness: 0.8 })
    dentro.position.set(side * 0.145, 0.25, 0.025)
    dentro.rotation.z = -side * 0.28
    cabeca.add(dentro)
    const tufo = cone(0.035, 0.12, RUIVO_ESC, { roughness: 0.9 })
    tufo.position.set(side * 0.205, 0.43, -0.02)
    tufo.rotation.z = -side * 0.42
    cabeca.add(tufo)
  }

  // ---- rabo enorme em S, laranja de ponta creme ------------------------------
  const rabo = new THREE.Group()
  rabo.position.set(0.12, 0.3, -0.3)
  esquilo.add(rabo)

  // espinha do rabo: sai da base, estufa para fora, volta rente às costas e
  // enrola para fora no alto — o S; esferas densas ao longo dela (o refine funde)
  const espinha: [number, number, number, number][] = [
    [0.0, 0.0, 0.0, 0.15],
    [0.2, 0.12, -0.12, 0.19],
    [0.42, 0.38, -0.18, 0.24],
    [0.5, 0.7, -0.16, 0.27],
    [0.38, 1.0, -0.12, 0.28],
    [0.3, 1.25, -0.1, 0.27],
    [0.4, 1.5, -0.08, 0.25],
    [0.64, 1.6, -0.06, 0.21],
    [0.82, 1.48, -0.04, 0.16],
  ]
  const caminho = new THREE.CatmullRomCurve3(espinha.map(([x, y, z]) => V(x, y, z)))
  const N = 26
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const f = t * (espinha.length - 1)
    const k = Math.min(espinha.length - 2, Math.floor(f))
    const r = THREE.MathUtils.lerp(espinha[k][3], espinha[k + 1][3], f - k)
    const bola = sphere(r, t > 0.82 ? CREME : RUIVO, { roughness: 0.92 })
    bola.position.copy(caminho.getPoint(t))
    rabo.add(bola)
  }

  // ---- íngua roxa brilhante no pescoço --------------------------------------
  const ingua = new THREE.Group()
  ingua.position.set(0.17, 1.17, 0.17)
  esquilo.add(ingua)
  const bolha = sphere(0.1, ROXO, { roughness: 0.18 })
  ingua.add(bolha)
  const reflexo = sphere(0.022, '#e9d6f5', { roughness: 0.1 })
  reflexo.position.set(0.03, 0.045, 0.085)
  ingua.add(reflexo)

  // ---- patinhas dianteiras dando de ombros ---------------------------------
  function makePata(side: number) {
    const pata = new THREE.Group()
    pata.position.set(side * 0.24, 1.07, 0.08)
    const ombro = V(0, 0, 0)
    const cotovelo = V(side * 0.2, -0.16, 0.06)
    const pulso = V(side * 0.36, 0.0, 0.1)
    pata.add(limb(ombro, cotovelo, 0.075, RUIVO))
    pata.add(limb(cotovelo, pulso, 0.06, RUIVO))
    // mãozinha de palma para cima
    const mao = sphere(0.075, RUIVO_ESC, { roughness: 0.85 })
    mao.scale.set(1.25, 0.5, 1.05)
    mao.position.set(side * 0.41, 0.03, 0.11)
    pata.add(mao)
    for (let d = 0; d < 3; d++) {
      const dedo = capsule(0.018, 0.04, RUIVO_ESC, { roughness: 0.85 })
      dedo.position.set(side * (0.47 + d * 0.01), 0.07, 0.07 + d * 0.04)
      dedo.rotation.z = side * -0.5
      pata.add(dedo)
    }
    return pata
  }
  const pataE = makePata(-1)
  const pataD = makePata(1)
  esquilo.add(pataE, pataD)

  // ---- linha de pipa cortada, pendurada na pata direita -----------------------
  const linha = new THREE.Group()
  linha.position.set(0.44, 0.04, 0.12)
  pataD.add(linha)
  const pontos = [V(0, 0, 0), V(0.05, -0.18, 0.02), V(0.02, -0.38, 0.06), V(0.08, -0.55, 0.05), V(0.15, -0.66, 0.02)]
  for (let i = 0; i < pontos.length - 1; i++) {
    linha.add(segment(pontos[i], pontos[i + 1], 0.009, PRATA, { roughness: 0.2, metalness: 0.8 }))
  }
  // ponta desfiada do corte
  for (const a of [-0.6, 0.1, 0.7]) {
    const fio = segment(pontos[4], pontos[4].clone().add(V(Math.sin(a) * 0.06, -0.04, Math.cos(a) * 0.03)), 0.005, PRATA, {
      roughness: 0.2, metalness: 0.8,
    })
    linha.add(fio)
  }
  // pontinhos cintilantes do cerol
  for (let i = 0; i < 7; i++) {
    const t = rand()
    const k = Math.min(3, Math.floor(t * 4))
    const p = pontos[k].clone().lerp(pontos[k + 1], t * 4 - k)
    const brilhoC = sphere(0.016, '#ffffff', { emissive: '#e6f4ff', emissiveIntensity: 1.4 }, 8)
    brilhoC.position.copy(p).add(V(0, 0, 0.012))
    linha.add(brilhoC)
  }

  // ---- trouxinha de nozes no graveto, no ombro esquerdo ---------------------
  const trouxa = new THREE.Group()
  trouxa.position.set(-0.13, 1.2, 0.04)
  esquilo.add(trouxa)
  const pontaFrente = V(0.06, -0.03, 0.06)
  const pontaTras = V(-0.56, 0.4, -0.12)
  trouxa.add(segment(pontaFrente, pontaTras, 0.025, '#6e4a2c', { roughness: 0.85 }))
  const saco = new THREE.Group()
  saco.position.set(-0.5, 0.12, -0.14)
  trouxa.add(saco)
  const pano = sphere(0.21, BEGE, { roughness: 0.92 })
  pano.scale.set(1, 0.9, 0.95)
  saco.add(pano)
  const no = sphere(0.07, BEGE_ESC, { roughness: 0.92 })
  no.position.set(0.02, 0.2, 0.02)
  saco.add(no)
  for (const s of [-1, 1]) {
    const orelhaPano = cone(0.06, 0.13, BEGE_ESC, { roughness: 0.92 })
    orelhaPano.position.set(s * 0.06, 0.27, 0.02)
    orelhaPano.rotation.z = -s * 0.7
    saco.add(orelhaPano)
  }
  // costura e nozes espiando no nó
  const costura = torus(0.2, 0.008, '#8f7a58', { roughness: 0.9 })
  costura.rotation.x = Math.PI / 2
  costura.position.y = -0.02
  saco.add(costura)
  for (const [x, z] of [[0.09, 0.08], [-0.07, 0.1]] as const) {
    const noz = sphere(0.05, NOZ, { roughness: 0.6 })
    noz.position.set(x, 0.14, z)
    saco.add(noz)
  }

  // ---- pipa amarela fugindo no alto ------------------------------------------
  const pipa = new THREE.Group()
  pipa.position.set(...KITE)
  pipa.rotation.set(0.1, -0.25, -0.35)
  root.add(pipa)

  const losango = new THREE.Group()
  losango.scale.set(1, 1.4, 1)
  losango.rotation.z = Math.PI / 4
  pipa.add(losango)
  const papel = rbox(0.42, 0.42, 0.015, 0.01, AMARELO, { roughness: 0.6 })
  losango.add(papel)
  // metade vermelha (dois quadrantes do losango)
  const faixa = rbox(0.21, 0.21, 0.018, 0.008, TIJOLO, { roughness: 0.6 })
  faixa.position.set(0.105, 0.105, 0.002)
  losango.add(faixa)
  const faixa2 = rbox(0.21, 0.21, 0.018, 0.008, TIJOLO, { roughness: 0.6 })
  faixa2.position.set(-0.105, -0.105, 0.002)
  losango.add(faixa2)
  // varetas em cruz
  const vert = cylinder(0.008, 0.008, 0.82, '#7a5a3a', { roughness: 0.7 }, 8)
  vert.position.z = 0.015
  pipa.add(vert)
  const horiz = cylinder(0.008, 0.008, 0.58, '#7a5a3a', { roughness: 0.7 }, 8)
  horiz.rotation.z = Math.PI / 2
  horiz.position.set(0, 0.06, 0.015)
  pipa.add(horiz)
  // rabiola: lacinhos ao longo de uma curva caindo
  const rab: THREE.Vector3[] = []
  for (let i = 0; i <= 6; i++) {
    const t = i / 6
    rab.push(V(-Math.sin(t * 2.6) * 0.18 - t * 0.12, -0.42 - t * 0.85, 0))
  }
  for (let i = 0; i < rab.length - 1; i++) {
    pipa.add(segment(rab[i], rab[i + 1], 0.005, '#ece6d6', { roughness: 0.8 }))
    if (i > 0) {
      const laco = new THREE.Group()
      laco.position.copy(rab[i])
      for (const s of [-1, 1]) {
        const asa = cone(0.04, 0.09, i % 2 ? AMARELO : TIJOLO, { roughness: 0.7 }, 8)
        asa.rotation.z = s * Math.PI / 2
        asa.position.x = s * 0.045
        laco.add(asa)
      }
      pipa.add(laco)
    }
  }
  // pedaço de linha cortada pendurado da pipa
  pipa.add(segment(V(0, -0.2, 0.02), V(-0.12, -0.6, 0.3), 0.005, PRATA, { roughness: 0.2, metalness: 0.8 }))

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'chao', object: base },
    { name: 'tronco', group: 'lar', object: tronco },
    { name: 'placa', group: 'despejo', object: placa },
    { name: 'esquilo', group: 'esquilo', object: esquilo },
    { name: 'cabeca', group: 'esquilo', object: cabeca },
    { name: 'rabo', group: 'esquilo', object: rabo },
    { name: 'ingua', group: 'ingua', object: ingua },
    { name: 'pipa', group: 'cerol', object: pipa },
    { name: 'linha', group: 'cerol', object: linha },
    { name: 'trouxa', group: 'ombros', object: trouxa },
    { name: 'pataE', group: 'ombros', object: pataE },
    { name: 'pataD', group: 'ombros', object: pataD },
  ]

  const s3 = (from: number, to = 1) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ----------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um gramado verde-musgo sobe do chão.',
    }),
    seq('tronco-rise', 'tronco', 1.0, 0.9, [riseFrom(GY, 3.2)], {
      ease: 'easeOut',
      caption: 'Brota o tronco com a toca redonda: o LAR do esquilo.',
    }),
    seq('placa-prega', 'placa', 2.4, 0.55, [
      ...s3(0.01),
      ch('rotation.z', 0.9, 0.06),
    ], {
      ease: 'easeOut',
      caption: 'Mas a toca está lacrada: placa vermelha de DESPEJO! Foi DESPÊ-jado do próprio LAR.',
    }),
    seq('esquilo-rise', 'esquilo', 4.0, 0.85, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Chega o esquilo ruivo, de rabo enorme em S…',
    }),
    seq('cabeca-sobe', 'cabeca', 4.3, 0.6, [ch('position.y', 0.9, 1.36)], { ease: 'easeOut' }),
    seq('rabo-abre', 'rabo', 4.5, 0.7, [ch('rotation.z', -1.2, 0), ...s3(0.3)], { ease: 'easeOut' }),
    seq('ingua-incha', 'ingua', 5.6, 0.7, s3(0.05), {
      ease: 'easeOut',
      caption: '…e pra piorar, uma ÍNGUA roxa do tamanho de uma noz incha no pescoço.',
    }),
    seq('pipa-foge', 'pipa', 7.0, 1.4, [
      ch('position.x', 0.95, KITE[0]),
      ch('position.y', 1.55, KITE[1]),
      ch('rotation.z', 0.5, -0.35),
    ], {
      ease: 'easeOut',
      caption: 'E a linha de CEROL de uma pipa rival corta a pipa dele, que some no céu.',
    }),
    seq('linha-cai', 'linha', 7.1, 0.6, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),
    seq('trouxa-sobe', 'trouxa', 9.0, 0.6, [...s3(0.05), ch('rotation.z', -0.8, 0)], {
      ease: 'easeOut',
      caption: 'Sem LAR, com ÍNGUA, sem pipa… amarra as nozes na trouxinha e dá de ombros: DÊ-SPÊÊ-la-RÍNG-en (ce)RÓL!',
    }),
    seq('pataE-ombros', 'pataE', 10.2, 0.5, [ch('rotation.z', PATA_CAIDA, 0)], { ease: 'easeOut' }),
    seq('pataD-ombros', 'pataD', 10.2, 0.5, [ch('rotation.z', -PATA_CAIDA, 0)], {
      ease: 'easeOut',
      caption: 'Det spelar ingen roll. — Não faz diferença. / Tanto faz.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.55, 1.8, 5.0], target: [0.2, 1.42, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-spelar-ingen-roll',
    contexto:
      "Escolha que não importa ('kaffe eller te?' — 'spelar ingen roll') ou para tranquilizar: 'det spelar ingen roll om du är sen'.",
    fraseFonte: 'Não faz diferença. / Tanto faz.',
    fraseAlvo: 'Det spelar ingen roll.',
    pronuncia:
      "dê SPÊÊ-la-RÍNG-en RÓL ('det' = dê, quase engolido — muita gente até corta: 'spelar ingen roll'; SPÊÊ com Ê fechado e longo e a força nele, o '-lar' é curto e fraco; o R de 'spelar' não some: emenda no 'ingen' como R brando de 'caro' — 'spela-ríngen'; 'ingen' sem G, o ng é o fim de 'ping'; 'roll' com R de LÍNGUA, Ó ABERTO e curto e L comprido)",
    ponteSonora:
      "DÊ-SPÊÊ-la-RÍNG-en (ce)RÓL! (6 sílabas, força no SPÊÊ, no RÍNG e no RÓL; DÊ-SPÊÊ = o DESPEJO cortado no PÊ — Ê FECHADO e LONGO, é nele que a força cai; o DÊ é o 'dê' fechado de sempre, jamais o 'dji' de 'djispejo'; 'la' = o LAR fraquinho e curto, e o R dele NÃO some — gruda na ÍNGUA seguinte e sai 'la-RÍNGUA', R brando de 'caro', exatamente como o sueco emenda 'spelar ingen' (sem esse R sobra 'spela', o infinitivo); ÍNG-EN = a mesma ÍNGUA de 'Ingen fara' e 'Ingen orsak', com o G sumindo como no fim de 'ping'; (ce)RÓL = o CEROL da linha de pipa sem o CE: o R é o do meio de ceROL, BRANDO, de língua — nunca o RR de garganta de 'rolo', que em sueco é H e vira 'hål' (buraco); Ó ABERTO e curto, L de língua bem comprido, nunca 'cerou')",
    historia:
      'O esquilo volta pra casa e encontra a toca lacrada: uma placa vermelha de DESPEJO pregada no tronco — foi DESPÊ-jado do próprio LAR. Pra piorar, acorda com uma ÍNGUA roxa do tamanho de uma noz inchando no pescoço. E pra fechar o dia, a linha de CEROL de uma pipa rival corta a pipa dele, que some no céu. E daí? Sem LAR, com ÍNGUA, sem pipa — ele amarra as nozes numa trouxinha e dá de ombros com as duas patinhas: DÊ-SPÊÊ-la-RÍNG-en (ce)RÓL — nada disso faz a menor diferença.',
  },
  createScene,
  refine: { organic: ['esquilo', 'cabeca', 'rabo', 'pataE', 'pataD'] },
}

export default card
