import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Vill du spela?" — a Cuca, a jacaroa VILÃ do Sítio (VIL), enfia o focinho
 * na sua cara (DÜ), sacode um maço de ESPETOS de churrasco (SPÊ) e crava um
 * LÁ no meio do alvo pendurado na árvore. Aí estende outro pra você.
 *
 * Diorama: terreiro de terra batida; árvore ao fundo à direita com um alvo
 * vermelho e branco pendurado no tronco e um espeto cravado no centro; a
 * Cuca em pé, de vestido roxo e coque loiro, um braço erguido com o maço e o
 * outro oferecendo um espeto. Acento saturado (laranja) RESERVADO aos cabos
 * dos espetos — o SPÊ da ponte.
 */

const DIRT = '#c29b6b'
const DIRT_DARK = '#a8825a'
const DIRT_EDGE = '#8a6744'
const GRASS = '#6f9a45'
const PEBBLE = '#9c968b'
const BARK = '#6b4a30'
const BARK_DARK = '#4f3521'
const LEAF = '#3f7a3a'
const LEAF_LIGHT = '#4f8d43'
const RED = '#b8463c'
const CREAM = '#f0e6cf'
const RIM = '#7a5434'
const ROPE = '#cdb48a'
const SKIN = '#7fa83c'
const SKIN_DARK = '#5e842f'
const THROAT = '#cfd78e'
const DRESS = '#6c3f9f'
const DRESS_DARK = '#4a2a73'
const HAIR = '#f0cd5a'
const HAIR_DARK = '#d4ab3a'
const TEETH = '#fbf8ef'
const MOUTH = '#8a2e3a'
const CLAW = '#efe8d6'
const METAL = '#e6ebef'
const ACCENT = '#ff7a18' // acento RESERVADO: os cabos dos espetos (SPÊ)

const GY = 0.14 // topo do terreiro

// Cuca: posição no terreiro e giro (encara a frente-esquerda, em 3/4)
const CX = -0.32
const CZ = 0.32
const CROT = -0.3
const HEAD_Z = 0.04

// braços: pose final (erguido com o maço / estendido oferecendo)
const ARM_UP = -0.32
const ARM_DOWN_L = -2.95
const OFFER = 0.12
const OFFER_DOWN = 1.45

// árvore e alvo
const TREE: [number, number] = [1.38, -1.0]
const TARGET = new THREE.Vector3(1.32, 1.3, -0.74)

/** Espeto de churrasco: eixo +y do cabo à ponta, origem no ponto da pegada. */
function makeSkewer(len = 0.62) {
  const g = new THREE.Group()
  const cabo = rbox(0.05, 0.16, 0.035, 0.014, ACCENT, { roughness: 0.45 })
  cabo.position.y = -0.1
  g.add(cabo)
  const virola = cylinder(0.03, 0.03, 0.025, METAL, { roughness: 0.25, metalness: 0.85 })
  virola.position.y = -0.015
  g.add(virola)
  const lamina = rbox(0.036, len, 0.01, 0.004, METAL, { roughness: 0.3, metalness: 0.7 })
  lamina.position.y = len / 2
  g.add(lamina)
  const ponta = cone(0.02, 0.07, METAL, { roughness: 0.3, metalness: 0.7 })
  ponta.scale.z = 0.35
  ponta.position.y = len + 0.035
  g.add(ponta)
  return g
}

/** Cilindro fino entre dois pontos (cordas). */
function strand(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const len = a.distanceTo(b)
  const c = cylinder(r, r, len, color, { roughness: 0.9 }, 10)
  c.position.copy(a).add(b).multiplyScalar(0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return c
}

/** Mão-garra verde: palma + 3 dedos com unhas. Fechada em volta da origem. */
function claw() {
  const g = new THREE.Group()
  const palma = sphere(0.085, SKIN, { roughness: 0.7 })
  palma.scale.set(1, 0.9, 1.1)
  g.add(palma)
  for (let i = 0; i < 3; i++) {
    const dedo = capsule(0.028, 0.05, SKIN, { roughness: 0.7 })
    dedo.position.set(-0.045 + i * 0.045, 0.02, 0.08)
    dedo.rotation.x = 1.2
    g.add(dedo)
    const unha = cone(0.016, 0.04, CLAW, { roughness: 0.35 })
    unha.position.set(-0.045 + i * 0.045, -0.02, 0.115)
    unha.rotation.x = Math.PI
    g.add(unha)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- terreiro de terra batida ---------------------------------------------
  const chao = new THREE.Group()
  const disco = cylinder(2.6, 2.7, 0.14, DIRT, { roughness: 0.92 })
  disco.position.y = 0.07
  chao.add(disco)
  const borda = torus(2.62, 0.05, DIRT_EDGE, { roughness: 0.95 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.11
  chao.add(borda)

  for (const [px, pz, r] of [[-1.3, 1.2, 0.55], [0.9, 0.9, 0.42], [-0.6, -1.3, 0.5], [1.7, 0.2, 0.3]] as const) {
    const mancha = cylinder(r, r * 1.05, 0.012, DIRT_DARK, { roughness: 0.95 })
    mancha.scale.z = 0.7
    mancha.position.set(px, GY + 0.004, pz)
    mancha.rotation.y = rand() * Math.PI
    chao.add(mancha)
  }

  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.2 + rand() * 1.2
    const pedra = rock(0.05 + rand() * 0.05, PEBBLE, 10 + i, { roughness: 0.85 })
    pedra.scale.y = 0.6
    pedra.position.set(Math.cos(a) * d, GY + 0.015, Math.sin(a) * d)
    chao.add(pedra)
  }

  // tufos de capim na beirada
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.3
    const d = 2.25 + rand() * 0.25
    const tufo = new THREE.Group()
    tufo.position.set(Math.cos(a) * d, GY, Math.sin(a) * d)
    for (let k = 0; k < 4; k++) {
      const folha = cone(0.035, 0.2 + rand() * 0.12, k % 2 ? GRASS : '#5f8a3b', { roughness: 0.85 }, 8)
      folha.position.set((rand() - 0.5) * 0.1, 0.1, (rand() - 0.5) * 0.1)
      folha.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6)
      tufo.add(folha)
    }
    chao.add(tufo)
  }
  root.add(chao)

  // ---- árvore ao fundo --------------------------------------------------------
  const arvore = new THREE.Group()
  arvore.position.set(TREE[0], GY, TREE[1])
  root.add(arvore)

  const tronco = lathe(
    [[0, 0], [0.32, 0], [0.24, 0.1], [0.19, 0.35], [0.17, 1.1], [0.16, 1.75], [0.2, 1.95], [0, 2.0]],
    BARK,
    { roughness: 0.9 },
  )
  arvore.add(tronco)
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45
    const sulco = rbox(0.025, 0.9 + rand() * 0.5, 0.02, 0.008, BARK_DARK, { roughness: 0.95 })
    sulco.position.set(Math.sin(a) * 0.175, 0.95, Math.cos(a) * 0.175)
    sulco.rotation.y = a
    arvore.add(sulco)
  }
  for (const [a, tilt] of [[0.6, 0.9], [2.4, 0.8], [4.2, 0.85]] as const) {
    const raiz = capsule(0.07, 0.3, BARK, { roughness: 0.9 })
    raiz.position.set(Math.cos(a) * 0.26, 0.05, Math.sin(a) * 0.26)
    raiz.rotation.set(0, -a, 0)
    raiz.rotateZ(tilt)
    arvore.add(raiz)
  }
  for (const [side, len] of [[-1, 0.55], [1, 0.5]] as const) {
    const galho = capsule(0.07, len, BARK, { roughness: 0.9 })
    galho.position.set(side * 0.22, 1.95, 0)
    galho.rotation.z = -side * 0.75
    arvore.add(galho)
  }
  const copa = puff(0.68, LEAF, 8, 7, { roughness: 0.85 })
  copa.position.set(0, 2.3, -0.05)
  arvore.add(copa)
  for (const [px, py, r, s] of [[-0.6, 2.1, 0.42, 3], [0.62, 2.15, 0.4, 5], [0.1, 2.68, 0.38, 9]] as const) {
    const tufo = puff(r, LEAF_LIGHT, 5, s, { roughness: 0.85 })
    tufo.position.set(px, py, 0.05)
    arvore.add(tufo)
  }

  // ---- alvo pendurado no tronco ------------------------------------------------
  const alvo = new THREE.Group()
  alvo.position.copy(TARGET)
  alvo.rotation.y = -0.16
  root.add(alvo)

  const fundo = cylinder(0.42, 0.42, 0.06, RIM, { roughness: 0.75 }, 48)
  fundo.rotation.x = Math.PI / 2
  alvo.add(fundo)
  const aneis: [number, string][] = [[0.38, RED], [0.3, CREAM], [0.22, RED], [0.14, CREAM], [0.065, RED]]
  aneis.forEach(([r, cor], i) => {
    const anel = cylinder(r, r, 0.012, cor, { roughness: 0.6 }, 48)
    anel.rotation.x = Math.PI / 2
    anel.position.z = 0.031 + i * 0.003
    alvo.add(anel)
  })
  const aro = torus(0.41, 0.028, RIM, { roughness: 0.7 })
  aro.position.z = 0.012
  alvo.add(aro)
  const prego = cylinder(0.022, 0.022, 0.06, '#3b3f44', { roughness: 0.4, metalness: 0.7 })
  prego.rotation.x = Math.PI / 2
  prego.position.set(0, 0.62, -0.03)
  alvo.add(prego)
  for (const side of [-1, 1]) {
    alvo.add(strand(new THREE.Vector3(0, 0.62, -0.01), new THREE.Vector3(side * 0.26, 0.31, 0), 0.012, ROPE))
  }

  // ---- espeto cravado no centro (voa do maço até o alvo) -----------------------
  alvo.updateMatrixWorld(true)
  const mosca = alvo.localToWorld(new THREE.Vector3(0, 0, 0.045))
  const espetoAlvo = new THREE.Group()
  espetoAlvo.position.copy(mosca)
  root.add(espetoAlvo)
  espetoAlvo.lookAt(new THREE.Vector3(-2.6, 2.1, 0.9)) // +z aponta de volta pra quem atirou
  const cravado = makeSkewer(0.6)
  cravado.rotation.x = -Math.PI / 2 // ponta (+y) entra no alvo (−z)
  cravado.position.z = 0.6 - 0.03
  espetoAlvo.add(cravado)
  const FLY_FROM = new THREE.Vector3(0.2, 2.3, 0.55)

  // ---- CUCA: corpo de vestido roxo -----------------------------------------------
  const cuca = new THREE.Group()
  cuca.position.set(CX, GY, CZ)
  cuca.rotation.y = CROT
  root.add(cuca)

  for (const side of [-1, 1]) {
    const pe = sphere(0.13, SKIN, { roughness: 0.7 })
    pe.scale.set(1, 0.42, 1.45)
    pe.position.set(side * 0.21, 0.05, 0.2)
    cuca.add(pe)
    for (let i = 0; i < 3; i++) {
      const unha = cone(0.022, 0.07, CLAW, { roughness: 0.35 })
      unha.rotation.x = Math.PI / 2
      unha.position.set(side * 0.21 + (i - 1) * 0.06, 0.04, 0.4)
      cuca.add(unha)
    }
    const perna = capsule(0.12, 0.18, SKIN, { roughness: 0.7 })
    perna.position.set(side * 0.2, 0.22, 0.04)
    cuca.add(perna)
  }

  const saia = lathe(
    [[0, 0.2], [0.5, 0.2], [0.56, 0.24], [0.5, 0.42], [0.4, 0.72], [0.33, 0.95], [0.3, 1.02], [0, 1.02]],
    DRESS,
    { roughness: 0.88 },
    48,
  )
  cuca.add(saia)
  // barra rasgada de bruxa
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const bico = cone(0.07, 0.16, DRESS, { roughness: 0.88 }, 12)
    bico.rotation.z = Math.PI
    bico.scale.z = 0.45
    bico.position.set(Math.sin(a) * 0.5, 0.17, Math.cos(a) * 0.5)
    bico.rotation.y = a
    cuca.add(bico)
  }
  const remendo = rbox(0.16, 0.14, 0.02, 0.02, DRESS_DARK, { roughness: 0.9 })
  remendo.position.set(0.18, 0.5, 0.42)
  remendo.rotation.set(-0.28, 0.4, 0.15)
  cuca.add(remendo)

  const cinto = torus(0.31, 0.045, DRESS_DARK, { roughness: 0.7 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 1.0
  cuca.add(cinto)
  const fivela = rbox(0.1, 0.09, 0.03, 0.015, '#c2a35c', { roughness: 0.35, metalness: 0.6 })
  fivela.position.set(0, 1.0, 0.335)
  cuca.add(fivela)

  const corpete = sphere(0.33, DRESS, { roughness: 0.88 })
  corpete.scale.set(1, 1.15, 0.85)
  corpete.position.y = 1.26
  cuca.add(corpete)
  const gola = torus(0.17, 0.05, DRESS_DARK, { roughness: 0.8 })
  gola.rotation.x = Math.PI / 2
  gola.position.y = 1.58
  cuca.add(gola)
  const pescoco = capsule(0.14, 0.14, SKIN, { roughness: 0.7 })
  pescoco.position.y = 1.66
  cuca.add(pescoco)
  const papo = sphere(0.11, THROAT, { roughness: 0.7 })
  papo.position.set(0, 1.66, 0.07)
  cuca.add(papo)

  // ---- cauda verde apoiada no chão -----------------------------------------------
  const cauda = new THREE.Group()
  cauda.position.set(0.05, 0, -0.18)
  cuca.add(cauda)
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0.15, 0.2, -0.32),
    new THREE.Vector3(0.45, 0.12, -0.55),
    new THREE.Vector3(0.85, 0.08, -0.6),
    new THREE.Vector3(1.2, 0.06, -0.45),
  ])
  const N = 16
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const p = curva.getPoint(t)
    const r = 0.2 * (1 - t) + 0.035
    const gomo = sphere(r, SKIN, { roughness: 0.7 })
    gomo.position.set(p.x, Math.max(p.y, r * 0.85), p.z)
    gomo.scale.y = 0.85
    cauda.add(gomo)
    if (i % 2 === 0 && i < N) {
      const crista = cone(r * 0.38, r * 0.7, SKIN_DARK, { roughness: 0.75 }, 8)
      crista.position.set(p.x, Math.max(p.y, r * 0.85) + r * 0.85, p.z)
      cauda.add(crista)
    }
  }

  // ---- cabeça de jacaré: focinho comprido, sorriso cheio de dentes ----------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.84, HEAD_Z)
  cuca.add(cabeca)

  const cranio = sphere(0.27, SKIN, { roughness: 0.7 })
  cranio.scale.set(1, 0.82, 1.05)
  cabeca.add(cranio)
  const focinho = rbox(0.34, 0.16, 0.66, 0.07, SKIN, { roughness: 0.7 })
  focinho.position.set(0, -0.02, 0.46)
  cabeca.add(focinho)
  const ponta = sphere(0.12, SKIN, { roughness: 0.7 })
  ponta.scale.set(1.45, 0.75, 1)
  ponta.position.set(0, 0.0, 0.76)
  cabeca.add(ponta)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.14, SKIN, { roughness: 0.7 })
    bochecha.position.set(side * 0.13, -0.12, 0.14)
    cabeca.add(bochecha)
  }
  const queixo = rbox(0.3, 0.08, 0.62, 0.035, SKIN, { roughness: 0.7 })
  queixo.position.set(0, -0.24, 0.42)
  queixo.rotation.x = 0.05
  cabeca.add(queixo)
  const barbela = rbox(0.24, 0.04, 0.5, 0.018, THROAT, { roughness: 0.75 })
  barbela.position.set(0, -0.285, 0.38)
  barbela.rotation.x = 0.05
  cabeca.add(barbela)
  const boca = rbox(0.26, 0.07, 0.56, 0.02, MOUTH, { roughness: 0.5 })
  boca.position.set(0, -0.15, 0.42)
  cabeca.add(boca)

  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const dente = cone(0.026, 0.075, TEETH, { roughness: 0.3 })
      dente.rotation.x = Math.PI
      dente.position.set(side * 0.145, -0.125, 0.2 + i * 0.1)
      cabeca.add(dente)
    }
    for (let i = 0; i < 5; i++) {
      const dente = cone(0.024, 0.065, TEETH, { roughness: 0.3 })
      dente.position.set(side * 0.13, -0.19, 0.25 + i * 0.1)
      cabeca.add(dente)
    }
    const narina = sphere(0.025, SKIN_DARK, { roughness: 0.6 })
    narina.position.set(side * 0.06, 0.07, 0.8)
    cabeca.add(narina)

    // olhos de vilã: bulbo saltado, pupila de fenda, pálpebra pesada
    const bulbo = sphere(0.1, SKIN, { roughness: 0.7 })
    bulbo.position.set(side * 0.13, 0.17, 0.12)
    cabeca.add(bulbo)
    const esclera = sphere(0.078, '#fffbe8', { roughness: 0.25 })
    esclera.scale.z = 0.7
    esclera.position.set(side * 0.14, 0.19, 0.18)
    cabeca.add(esclera)
    const pupila = sphere(0.032, '#1a1a1a', { roughness: 0.2 })
    pupila.scale.set(0.55, 1.3, 0.6)
    pupila.position.set(side * 0.14, 0.185, 0.234)
    cabeca.add(pupila)
    const palpebra = sphere(0.084, SKIN_DARK, { roughness: 0.7 })
    palpebra.scale.set(1.05, 0.55, 0.85)
    palpebra.position.set(side * 0.14, 0.235, 0.18)
    palpebra.rotation.z = side * 0.25
    cabeca.add(palpebra)
  }

  // ---- cabeleira loira presa num coque alto ---------------------------------------
  const cabelo = new THREE.Group()
  cabelo.position.set(0, 0.16, -0.1)
  cabeca.add(cabelo)
  const juba = puff(0.25, HAIR, 8, 13, { roughness: 0.8 })
  juba.scale.set(1.2, 0.8, 1.05)
  juba.position.set(0, -0.02, -0.06)
  cabelo.add(juba)
  const coque = sphere(0.17, HAIR, { roughness: 0.8 })
  coque.scale.set(1, 0.9, 1)
  coque.position.set(0, 0.25, -0.06)
  cabelo.add(coque)
  const fita = torus(0.12, 0.032, DRESS_DARK, { roughness: 0.6 })
  fita.rotation.x = Math.PI / 2
  fita.position.set(0, 0.13, -0.06)
  cabelo.add(fita)
  for (let i = 0; i < 3; i++) {
    const volta = torus(0.11 - i * 0.03, 0.022, HAIR_DARK, { roughness: 0.8 })
    volta.rotation.set(Math.PI / 2 - 0.2, 0, i * 0.7)
    volta.position.set(0, 0.29 + i * 0.045, -0.04)
    cabelo.add(volta)
  }
  for (const side of [-1, 1]) {
    const cacho = capsule(0.07, 0.18, HAIR, { roughness: 0.8 })
    cacho.position.set(side * 0.25, -0.16, -0.04)
    cacho.rotation.z = side * 0.2
    cabelo.add(cacho)
  }

  // ---- braço esquerdo ERGUIDO com o maço de espetos ----------------------------
  const bracoE = new THREE.Group()
  bracoE.position.set(0.36, 1.44, 0)
  bracoE.rotation.set(-0.08, 0, ARM_UP)
  cuca.add(bracoE)
  const mangaE = capsule(0.095, 0.26, DRESS, { roughness: 0.88 })
  mangaE.position.y = 0.17
  bracoE.add(mangaE)
  const punhoE = cylinder(0.15, 0.1, 0.13, DRESS_DARK, { roughness: 0.85 })
  punhoE.position.y = 0.4
  bracoE.add(punhoE)
  const antebracoE = capsule(0.07, 0.14, SKIN, { roughness: 0.7 })
  antebracoE.position.y = 0.53
  bracoE.add(antebracoE)
  const maoE = claw()
  maoE.position.y = 0.7
  maoE.rotation.set(-Math.PI / 2, 0, 0)
  bracoE.add(maoE)

  const maco = new THREE.Group()
  maco.position.set(0, 0.7, 0)
  maco.rotation.z = -0.55
  bracoE.add(maco)
  for (let i = 0; i < 7; i++) {
    const e = makeSkewer(0.5 + (i % 2) * 0.05)
    e.rotation.set((rand() - 0.5) * 0.12, 0, (i - 3) * 0.1)
    e.position.z = (i - 3) * 0.012
    maco.add(e)
  }
  const amarra = torus(0.06, 0.016, ROPE, { roughness: 0.9 })
  amarra.rotation.x = Math.PI / 2
  amarra.position.y = 0.16
  maco.add(amarra)

  // ---- braço direito ESTENDIDO oferecendo um espeto -----------------------------
  const bracoD = new THREE.Group()
  bracoD.position.set(-0.36, 1.44, 0.02)
  bracoD.rotation.set(OFFER, -0.12, 0)
  cuca.add(bracoD)
  const mangaD = capsule(0.095, 0.26, DRESS, { roughness: 0.88 })
  mangaD.rotation.x = Math.PI / 2
  mangaD.position.z = 0.17
  bracoD.add(mangaD)
  const punhoD = cylinder(0.15, 0.1, 0.13, DRESS_DARK, { roughness: 0.85 })
  punhoD.rotation.x = Math.PI / 2
  punhoD.position.z = 0.4
  bracoD.add(punhoD)
  const antebracoD = capsule(0.07, 0.14, SKIN, { roughness: 0.7 })
  antebracoD.rotation.x = Math.PI / 2
  antebracoD.position.z = 0.53
  bracoD.add(antebracoD)
  const maoD = claw()
  maoD.position.z = 0.7
  bracoD.add(maoD)

  const espetoOferta = new THREE.Group()
  espetoOferta.position.set(0, 0, 0.7)
  espetoOferta.rotation.set(-OFFER, 0, -0.25)
  bracoD.add(espetoOferta)
  espetoOferta.add(makeSkewer(0.55))

  // ---- peças -------------------------------------------------------------------
  const parts = [
    { name: 'chao', group: 'terreiro', object: chao },
    { name: 'arvore', group: 'arvore', object: arvore },
    { name: 'alvo', group: 'arvore', object: alvo },
    { name: 'cuca', group: 'cuca', object: cuca },
    { name: 'cauda', group: 'cuca', object: cauda },
    { name: 'cabeca', group: 'cuca', object: cabeca },
    { name: 'cabelo', group: 'cuca', object: cabelo },
    { name: 'bracoD', group: 'cuca', object: bracoD },
    { name: 'bracoE', group: 'espetos', object: bracoE },
    { name: 'maco', group: 'espetos', object: maco },
    { name: 'espetoAlvo', group: 'la', object: espetoAlvo },
    { name: 'espetoOferta', group: 'oferta', object: espetoOferta },
  ]

  const grow = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem ----------------------------------------------------------------
  const build = [
    seq('chao-sobe', 'chao', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Um terreiro de terra batida sobe do chão.',
    }),

    seq('arvore-sobe', 'arvore', 1.0, 0.9, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: 'Ao fundo brota uma árvore — e no tronco, pendurado, um ALVO vermelho e branco.',
    }),
    seq('alvo-surge', 'alvo', 1.8, 0.5, grow(0.01, 1), { ease: 'easeOut' }),

    seq('cuca-sobe', 'cuca', 2.9, 0.9, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'Chega a Cuca, a jacaroa VILÃ do Sítio — VIL —, de vestido roxo de bruxa.',
    }),
    seq('bracoD-surge', 'bracoD', 3.1, 0.4, grow(0.01, 1), { ease: 'easeOut' }),
    seq('bracoE-surge', 'bracoE', 3.1, 0.4, grow(0.01, 1), { ease: 'easeOut' }),
    seq('cauda-cresce', 'cauda', 3.3, 0.6, grow(0.01, 1), { ease: 'easeOut' }),
    seq('cabeca-surge', 'cabeca', 3.4, 0.5, grow(0.01, 1), { ease: 'easeOut' }),
    seq('cabelo-surge', 'cabelo', 3.8, 0.45, grow(0.01, 1), { ease: 'easeOut' }),

    seq('focinho-avanca', 'cabeca', 5.0, 0.6, [
      ch('position.z', HEAD_Z - 0.3, HEAD_Z),
      ch('rotation.x', -0.25, 0),
    ], {
      ease: 'easeOut',
      caption: 'Ela enfia o focinho comprido na sua cara, num sorriso cheio de dentes: DÜ!',
    }),

    seq('bracoE-ergue', 'bracoE', 6.6, 0.7, [ch('rotation.z', ARM_DOWN_L, ARM_UP)], {
      ease: 'easeOut',
      caption: 'Mas não vem pegar criança: sacode um maço de ESPETOS de churrasco — SPÊ!',
    }),
    seq('maco-surge', 'maco', 6.9, 0.5, grow(0.01, 1), { ease: 'easeOut' }),

    seq('espeto-voa', 'espetoAlvo', 8.3, 0.5, [
      ch('position.x', FLY_FROM.x, mosca.x),
      ch('position.y', FLY_FROM.y, mosca.y),
      ch('position.z', FLY_FROM.z, mosca.z),
    ], {
      ease: 'linear',
      caption: 'Arremessa um, que voa assobiando e crava LÁ no meio do alvo!',
    }),
    seq('alvo-tranco', 'alvo', 8.8, 0.12, [ch('rotation.x', 0, -0.1)], { ease: 'easeOut' }),
    seq('alvo-volta', 'alvo', 8.92, 0.4, [ch('rotation.x', -0.1, 0)], { ease: 'easeInOut' }),

    seq('bracoD-oferece', 'bracoD', 9.9, 0.7, [ch('rotation.x', OFFER_DOWN, OFFER)], {
      ease: 'easeOut',
      caption: 'Aí estende outro espeto pra você, com cara de quem quer companhia…',
    }),
    seq('oferta-surge', 'espetoOferta', 10.2, 0.4, grow(0.01, 1), { ease: 'easeOut' }),
    seq('oferta-pulsa', 'espetoOferta', 11.4, 0.2, grow(1, 1.2), {
      ease: 'easeOut',
      caption: 'Vill du spela? — Quer jogar?',
    }),
    seq('oferta-volta', 'espetoOferta', 11.6, 0.35, grow(1.2, 1), { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.25, 5.45], target: [0.35, 1.4, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'vill-du-spela',
    contexto:
      "Lazer: chamar alguém pra um jogo — tabuleiro (sällskapsspel), cartas, videogame, futebol, pingue-pongue no parque — ou pra tocar um instrumento junto. Com criança pequena brincando de faz-de-conta o verbo é outro: 'Vill du leka?'.",
    fraseFonte: 'Quer jogar?',
    fraseAlvo: 'Vill du spela?',
    pronuncia:
      "vil dü SPÊÊ-la ('vill' com I curto e L de verdade, nunca 'viu'; 'du' = DÜ, com bico de pato; 'spela' com a força no SPÊ — S colado no P, sem 'is' na frente, Ê FECHADO e LONGO — e o -la curtinho e fraco, SEM R: com R vira 'spelar', o presente)",
    ponteSonora:
      "VIL DÜ... (e)SPÊ(to)... la? (4 sílabas: vil-dü-SPÊÊ-la; a força toda no SPÊÊ; VIL DÜ = o MESMO começo da bruxa de 'Vill du ha något att dricka?', da avestruz de 'Vill du ha kvittot?' e do boto de 'Vill du följa med?' — aqui é a Cuca, a VILÃ do Sítio —: VIL com I curto e L DE VERDADE, língua no céu da boca, nunca 'viu'; DÜ = o 'du' de CAN-DU, com BICO DE PATO — é a ponta do focinho dela apontada pra você; (e)SPÊ(to) = o ESPETO de churrasco sem o E da frente e sem o -TO: SPÊ, S colado no P — nunca 'is-pê', o sueco não põe vogal antes do S —, Ê FECHADO como o brasileiro já fala 'espêto', e LONGO; é o MESMO SPÊÊ do DESPEJO de 'Det spelar ingen roll', a mesma palavra; la = o 'lá' do espeto cravado LÁ no alvo, mas dito fraquinho e curto, como o -la de 'janela' — a força fica toda no SPÊ — e SEM R: com R vira 'spelar', o presente; depois de 'vill du' o verbo fica pelado)",
    historia:
      'A Cuca, a jacaroa VILÃ do Sítio, aparece no terreiro com aquele sorriso cheio de dentes e enfia o focinho comprido bem na sua cara. Você já ia correr, achando que ela vem pegar criança — mas ela só sacode um maço de ESPETOS de churrasco: é jogo de dardos. Ela arremessa o primeiro, que voa assobiando e crava LÁ no meio do alvo pendurado na árvore. Aí estende outro espeto pra você, com cara de quem quer companhia: quer jogar?',
  },
  createScene,
  refine: { organic: ['cabeca', 'cauda'] },
}

export default card
