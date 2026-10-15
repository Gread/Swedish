import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Hur mår du?" — RRÜ-MÔR, DÜ?
 *
 * Na colmeia do prédio mora a abelha fofoqueira: em vez de mel ela fabrica
 * RUMOR (está na placa). Ela dispara pra fora feito repórter de fofoca, para
 * a um palmo do seu nariz, enfia o microfone na sua cara e aponta o ferrão
 * pra você: RRÜ-MÔR, DÜ?! — qual é o rumor de VOCÊ?
 *
 * Diorama: gramado, árvore com galho, colmeia em camadas pendurada com a placa
 * RUMOR, flor rosa, e a abelha gorda pairando no centro, de frente para a
 * câmera, microfone e ferrão apontados para o espectador.
 * Acento saturado (vermelho) reservado às letras RUMOR.
 */

const SOIL = '#6b4a2f'
const GRASS = '#93c56a'
const GRASS_DARK = '#6fa24e'
const BARK = '#7a5434'
const BARK_DARK = '#5e3f25'
const LEAF = '#5f9a48'
const HONEY = '#e2a63c'
const HONEY_DARK = '#c48a2a'
const PLAQUE = '#ecd7aa'
const PLAQUE_EDGE = '#b8925e'
const ACCENT = '#d93a2b' // acento reservado: RUMOR
const YELLOW = '#f5c21b'
const BLACK = '#2a2421'
const PINK = '#f1a3c0'
const PINK_DARK = '#e27fa6'
const SILVER = '#c9ced4'

const GY = 0.14 // topo do gramado

// abelha: pose final
const BEE: [number, number, number] = [0.42, 1.42, 0.55]
const BEE_ROT_Y = -0.12
// colmeia: ponto de pendurar (topo) no galho
const HIVE: [number, number, number] = [-0.98, 2.55, -0.62]
const HIVE_H = 1.15
const FERRAO_RX = 2.3

/** Cápsula esticada entre dois pontos (membros, antenas, hastes). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  const m = capsule(r, Math.max(0.001, len), color, opts)
  m.position.copy(a).addScaledVector(dir, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.008, ACCENT, { roughness: 0.45 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** R U M O — letras de traço grosso, legíveis de longe. */
function letter(which: 'R' | 'U' | 'M' | 'O') {
  const g = new THREE.Group()
  const t = 0.032
  if (which === 'R') {
    g.add(stroke(t, 0.17, -0.042, 0))
    g.add(stroke(0.07, t, -0.01, 0.069))
    g.add(stroke(0.07, t, -0.01, 0.006))
    g.add(stroke(t, 0.06, 0.03, 0.037))
    g.add(stroke(t, 0.095, 0.026, -0.046, 0.5))
  } else if (which === 'U') {
    g.add(stroke(t, 0.15, -0.042, 0.01))
    g.add(stroke(t, 0.15, 0.042, 0.01))
    g.add(stroke(0.115, t, 0, -0.069))
  } else if (which === 'M') {
    g.add(stroke(t, 0.17, -0.056, 0))
    g.add(stroke(t, 0.17, 0.056, 0))
    g.add(stroke(t, 0.11, -0.027, 0.03, 0.5))
    g.add(stroke(t, 0.11, 0.027, 0.03, -0.5))
  } else {
    g.add(stroke(t, 0.17, -0.044, 0))
    g.add(stroke(t, 0.17, 0.044, 0))
    g.add(stroke(0.115, t, 0, 0.069))
    g.add(stroke(0.115, t, 0, -0.069))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- gramado ------------------------------------------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.35, 2.45, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)
  const grass = cylinder(2.3, 2.34, 0.05, GRASS, { roughness: 0.92 })
  grass.position.y = 0.115
  base.add(grass)

  // tufos de trevo e pedrinhas espalhados
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.2 + rand() * 0.9
    const tufo = puff(0.11 + rand() * 0.06, GRASS_DARK, 5, 60 + i, { roughness: 0.92 })
    tufo.scale.y = 0.5
    tufo.position.set(Math.cos(a) * r, GY + 0.02, Math.sin(a) * r)
    base.add(tufo)
  }
  for (const [px, pz, s] of [[1.6, -0.9, 0.13], [-0.4, 1.7, 0.09], [1.9, 0.9, 0.08]] as const) {
    const pedra = rock(s, '#9a958c', Math.round(px * 10), { roughness: 0.9 })
    pedra.position.set(px, GY + s * 0.4, pz)
    base.add(pedra)
  }
  // margaridinhas brancas
  for (const [dx, dz] of [[-1.5, 1.1], [0.9, 1.6], [1.85, -0.2], [-0.3, -1.5]] as const) {
    const haste = cylinder(0.012, 0.014, 0.16, GRASS_DARK, { roughness: 0.8 })
    haste.position.set(dx, GY + 0.08, dz)
    base.add(haste)
    const miolo = sphere(0.035, '#f2c94c', { roughness: 0.6 })
    miolo.position.set(dx, GY + 0.17, dz)
    base.add(miolo)
    for (let k = 0; k < 6; k++) {
      const p = sphere(0.032, '#fbf8f0', { roughness: 0.6 })
      const a = (k / 6) * Math.PI * 2
      p.scale.set(1.3, 0.35, 0.7)
      p.position.set(dx + Math.cos(a) * 0.055, GY + 0.165, dz + Math.sin(a) * 0.055)
      p.rotation.y = -a
      base.add(p)
    }
  }
  root.add(base)

  // ---- flor rosa com miolo amarelo ------------------------------------------
  const flor = new THREE.Group()
  flor.position.set(1.5, GY, 0.35)
  const caule = cylinder(0.028, 0.034, 0.62, '#4f8a3c', { roughness: 0.8 })
  caule.position.y = 0.31
  flor.add(caule)
  for (const side of [-1, 1]) {
    const folha = sphere(0.11, '#5e9c47', { roughness: 0.75 })
    folha.scale.set(1.3, 0.22, 0.55)
    folha.position.set(side * 0.1, 0.2 + (side > 0 ? 0.08 : 0), 0)
    folha.rotation.z = side * 0.45
    flor.add(folha)
  }
  const cabecaFlor = new THREE.Group()
  cabecaFlor.position.y = 0.64
  cabecaFlor.rotation.x = 0.75 // vira para a câmera
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2
    const petala = sphere(0.09, k % 2 ? PINK : PINK_DARK, { roughness: 0.6 })
    petala.scale.set(1.35, 0.28, 0.8)
    petala.position.set(Math.cos(a) * 0.11, 0, Math.sin(a) * 0.11)
    petala.rotation.y = -a
    cabecaFlor.add(petala)
  }
  const miolo = sphere(0.075, '#f2b632', { roughness: 0.75 })
  miolo.scale.y = 0.6
  miolo.position.y = 0.03
  cabecaFlor.add(miolo)
  flor.add(cabecaFlor)
  root.add(flor)

  // ---- árvore com galho -----------------------------------------------------
  const arvore = new THREE.Group()
  arvore.position.set(-1.78, GY, -0.85)
  const tronco = lathe(
    [[0, 0], [0.34, 0], [0.24, 0.12], [0.2, 0.5], [0.18, 1.6], [0.15, 2.5], [0.11, 2.8], [0, 2.82]],
    BARK,
    { roughness: 0.85 },
  )
  arvore.add(tronco)
  // raízes
  for (const a of [0.4, 2.2, 4.1]) {
    const raiz = capsule(0.07, 0.3, BARK_DARK, { roughness: 0.9 })
    raiz.position.set(Math.cos(a) * 0.26, 0.04, Math.sin(a) * 0.26)
    raiz.rotation.set(0, -a, Math.PI / 2 - 0.25)
    arvore.add(raiz)
  }
  // galho horizontal até a colmeia (espaço local da árvore)
  const hx = HIVE[0] - arvore.position.x
  const hy = HIVE[1] - GY
  const hz = HIVE[2] - arvore.position.z
  arvore.add(limb(v(0, hy - 0.25, 0), v(hx + 0.55, hy + 0.12, hz), 0.085, BARK, { roughness: 0.85 }))
  arvore.add(limb(v(hx * 0.55, hy - 0.05, hz * 0.55), v(hx * 0.4, hy + 0.35, hz * 0.4 + 0.05), 0.04, BARK, { roughness: 0.85 }))
  // copa
  const copa = puff(0.52, LEAF, 7, 71, { roughness: 0.85 })
  copa.position.set(0.05, 2.78, -0.05)
  arvore.add(copa)
  const copa2 = puff(0.32, '#6aa851', 6, 72, { roughness: 0.85 })
  copa2.position.set(hx + 0.6, hy + 0.2, hz)
  arvore.add(copa2)
  const copa3 = puff(0.24, LEAF, 5, 73, { roughness: 0.85 })
  copa3.position.set(hx * 0.4, hy + 0.42, hz * 0.4 + 0.05)
  arvore.add(copa3)
  root.add(arvore)

  // ---- colmeia em camadas (origem no topo: cresce para baixo) ----------------
  const colmeia = new THREE.Group()
  colmeia.position.set(...HIVE)
  const gancho = cylinder(0.035, 0.035, 0.16, BARK_DARK, { roughness: 0.8 })
  gancho.position.y = 0.0
  colmeia.add(gancho)
  const perfil = [0.17, 0.3, 0.4, 0.47, 0.5, 0.49, 0.43, 0.32, 0.18]
  const passo = (HIVE_H - 0.12) / perfil.length
  // núcleo torneado: mesmo perfil dos anéis, de baixo para cima
  const nucleoPerfil: [number, number][] = [[0, -HIVE_H + 0.02]]
  for (let i = perfil.length - 1; i >= 0; i--) nucleoPerfil.push([perfil[i] - 0.03, -0.1 - i * passo])
  nucleoPerfil.push([0, -0.04])
  const nucleo = lathe(nucleoPerfil, HONEY_DARK, { roughness: 0.6 })
  colmeia.add(nucleo)
  perfil.forEach((r, i) => {
    const anel = torus(r, 0.085, i % 2 ? HONEY : '#eab14a', { roughness: 0.55 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = -0.1 - i * passo
    anel.scale.z = 1.25
    colmeia.add(anel)
  })
  const fundo = sphere(0.2, HONEY_DARK, { roughness: 0.6 })
  fundo.scale.y = 0.5
  fundo.position.y = -HIVE_H + 0.02
  colmeia.add(fundo)
  // entrada (buraco escuro) na frente, embaixo
  const entrada = sphere(0.1, '#3a2412', { roughness: 0.9 })
  entrada.scale.set(1.3, 0.75, 0.4)
  entrada.position.set(0.08, -HIVE_H + 0.22, 0.4)
  colmeia.add(entrada)
  // gotas de mel escorrendo
  for (const [dx, dy] of [[-0.3, -0.62], [0.36, -0.4]] as const) {
    const gota = capsule(0.03, 0.06, '#f0a91e', { roughness: 0.15 })
    gota.position.set(dx, dy, 0.42)
    colmeia.add(gota)
  }
  root.add(colmeia)

  // ---- placa RUMOR (filha da colmeia, pregada na frente) ---------------------
  const placa = new THREE.Group()
  placa.position.set(0.0, -0.5, 0.58)
  placa.rotation.y = 0.12
  const tabua = rbox(0.86, 0.28, 0.05, 0.03, PLAQUE, { roughness: 0.7 })
  placa.add(tabua)
  const moldura = rbox(0.9, 0.32, 0.03, 0.04, PLAQUE_EDGE, { roughness: 0.75 })
  moldura.position.z = -0.02
  placa.add(moldura)
  for (const px of [-0.4, 0.4]) {
    const prego = sphere(0.018, '#6b6b6b', { roughness: 0.4, metalness: 0.6 })
    prego.position.set(px, 0.1, 0.03)
    placa.add(prego)
  }
  const letras: ['R' | 'U' | 'M' | 'O', number][] = [
    ['R', -0.32], ['U', -0.165], ['M', 0.0], ['O', 0.165], ['R', 0.32],
  ]
  for (const [glyph, lx] of letras) {
    const l = letter(glyph)
    l.position.set(lx, 0, 0.035)
    placa.add(l)
  }
  colmeia.add(placa)

  // ---- ABELHA FOFOQUEIRA (origem no tórax, olha +z) --------------------------
  const abelha = new THREE.Group()
  abelha.position.set(...BEE)
  abelha.rotation.y = BEE_ROT_Y
  root.add(abelha)

  const torax = sphere(0.32, YELLOW, { roughness: 0.9 })
  torax.scale.set(1, 0.92, 0.95)
  abelha.add(torax)
  const gola = torus(0.25, 0.06, BLACK, { roughness: 0.85 })
  gola.rotation.x = Math.PI / 2
  gola.position.y = 0.2
  abelha.add(gola)

  // abdômen gordo listrado, curvado para a frente (ferrão vem para você)
  const abd = new THREE.Group()
  abd.position.set(0, -0.42, -0.04)
  abd.rotation.x = -0.4
  abelha.add(abd)
  const AR = 0.5
  const AH = AR * 1.18
  const barriga = sphere(AR, YELLOW, { roughness: 0.88 })
  barriga.scale.set(1, 1.18, 0.98)
  barriga.position.y = -0.3
  abd.add(barriga)
  for (const dy of [0.2, -0.04, -0.29]) {
    const rr = AR * Math.sqrt(Math.max(0, 1 - (dy / AH) ** 2))
    // faixa achatada rente à pele (torus esticado no eixo vertical)
    const listra = torus(rr - 0.025, 0.05, BLACK, { roughness: 0.85 })
    listra.rotation.x = Math.PI / 2
    listra.scale.z = 1.9
    listra.position.y = -0.3 + dy
    abd.add(listra)
  }
  const ponta = sphere(0.14, BLACK, { roughness: 0.8 })
  ponta.position.y = -0.3 - AH + 0.08
  abd.add(ponta)

  // braço esquerdo (lado -x) na cintura: pose de fofoqueira
  abelha.add(limb(v(-0.26, -0.02, 0.06), v(-0.5, -0.24, 0.12), 0.065, BLACK, { roughness: 0.8 }))
  abelha.add(limb(v(-0.5, -0.24, 0.12), v(-0.44, -0.46, 0.22), 0.06, BLACK, { roughness: 0.8 }))
  const maoE = sphere(0.085, BLACK, { roughness: 0.8 })
  maoE.position.set(-0.43, -0.47, 0.24)
  abelha.add(maoE)

  // braço direito (lado +x) estendido segurando o microfone
  const GRIP = v(0.74, 0.02, 0.42)
  abelha.add(limb(v(0.27, 0.0, 0.1), v(0.62, -0.14, 0.18), 0.065, BLACK, { roughness: 0.8 }))
  abelha.add(limb(v(0.62, -0.14, 0.18), GRIP.clone().add(v(0.02, -0.04, -0.04)), 0.06, BLACK, { roughness: 0.8 }))
  const maoD = sphere(0.085, BLACK, { roughness: 0.8 })
  maoD.position.copy(GRIP).add(v(0.02, -0.03, -0.02))
  abelha.add(maoD)

  // ---- cabeça preta com olhões curiosos --------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.5, 0.08)
  cabeca.rotation.z = 0.12 // inclinada de curiosidade
  abelha.add(cabeca)
  const cranio = sphere(0.34, BLACK, { roughness: 0.75 })
  cabeca.add(cranio)
  const cara = sphere(0.24, '#3a312c', { roughness: 0.75 })
  cara.scale.set(1.15, 0.9, 0.6)
  cara.position.set(0, -0.06, 0.2)
  cabeca.add(cara)
  for (const side of [-1, 1]) {
    const esclera = sphere(0.14, '#ffffff', { roughness: 0.2 })
    esclera.scale.set(0.9, 1.05, 0.62)
    esclera.position.set(side * 0.135, 0.05, 0.27)
    cabeca.add(esclera)
    const pupila = sphere(0.085, '#151214', { roughness: 0.15 })
    pupila.scale.z = 0.6
    pupila.position.set(side * 0.125, 0.03, 0.335)
    cabeca.add(pupila)
    const brilho = sphere(0.028, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.125 + 0.03, 0.07, 0.38)
    cabeca.add(brilho)
    const bochecha = sphere(0.055, '#f08aa5', { roughness: 0.6 })
    bochecha.scale.set(1.2, 0.7, 0.4)
    bochecha.position.set(side * 0.235, -0.12, 0.23)
    cabeca.add(bochecha)
    // sobrancelhas amarelas erguidas (curiosidade)
    const sob = capsule(0.022, 0.11, YELLOW, { roughness: 0.7 })
    sob.rotation.z = Math.PI / 2 + side * 0.3
    sob.position.set(side * 0.14, 0.23 + (side > 0 ? 0.03 : 0), 0.27)
    cabeca.add(sob)
  }
  // boca aberta de fofoca
  const boca = sphere(0.075, '#7a1e2a', { roughness: 0.5 })
  boca.scale.set(1.3, 0.75, 0.45)
  boca.position.set(0.01, -0.17, 0.3)
  cabeca.add(boca)
  const lingua = sphere(0.04, '#ee7d8e', { roughness: 0.4 })
  lingua.scale.set(1.3, 0.5, 0.5)
  lingua.position.set(0.01, -0.195, 0.325)
  cabeca.add(lingua)

  // ---- antenas inclinadas para a frente (filhas da cabeça) -------------------
  const antenas = new THREE.Group()
  antenas.position.set(0, 0.24, 0.06)
  for (const side of [-1, 1]) {
    const a0 = v(side * 0.09, 0, 0)
    const a1 = v(side * 0.17, 0.28, 0.05)
    const a2 = v(side * 0.26, 0.38, 0.24)
    antenas.add(limb(a0, a1, 0.024, BLACK, { roughness: 0.6 }))
    antenas.add(limb(a1, a2, 0.022, BLACK, { roughness: 0.6 }))
    const bola = sphere(0.055, BLACK, { roughness: 0.5 })
    bola.position.copy(a2)
    antenas.add(bola)
  }
  cabeca.add(antenas)

  // ---- quatro asas translúcidas azuladas -------------------------------------
  const asas = new THREE.Group()
  asas.position.set(0, 0.14, -0.24)
  for (const side of [-1, 1]) {
    for (const [r, x, y, rz] of [[0.4, 0.42, 0.3, 0.55], [0.26, 0.36, -0.06, -0.35]] as const) {
      const asa = sphere(r, '#cfe9ff', { roughness: 0.1, detail: 0 })
      asa.scale.set(1, 0.56, 0.05)
      asa.position.set(side * x, y, 0)
      asa.rotation.z = side * rz
      asa.rotation.y = side * 0.25
      const m = asa.material as THREE.MeshStandardMaterial
      m.transparent = true
      m.opacity = 0.5
      m.depthWrite = false
      asa.castShadow = false
      asas.add(asa)
      const veia = torus(r, 0.008, '#7fa9cf', { roughness: 0.4 })
      veia.scale.set(1, 0.56, 1)
      veia.position.copy(asa.position)
      veia.rotation.copy(asa.rotation)
      asas.add(veia)
    }
  }
  abelha.add(asas)

  // ---- microfone de repórter (filho da abelha, na mão direita) ---------------
  const microfone = new THREE.Group()
  microfone.position.copy(GRIP)
  // +y do mic aponta para o espectador, enviesado para mostrar o perfil
  microfone.quaternion.setFromUnitVectors(v(0, 1, 0), v(-0.72, 0.42, 0.55).normalize())
  microfone.scale.setScalar(1.25)
  const cabo = cylinder(0.036, 0.03, 0.36, SILVER, { roughness: 0.25, metalness: 0.85 })
  cabo.position.y = 0.06
  microfone.add(cabo)
  const cubo = rbox(0.13, 0.11, 0.13, 0.02, '#2f6f8f', { roughness: 0.5 })
  cubo.position.y = 0.17
  microfone.add(cubo)
  const faixa = rbox(0.135, 0.03, 0.135, 0.01, '#f4f1ea', { roughness: 0.5 })
  faixa.position.y = 0.17
  microfone.add(faixa)
  const anelMic = torus(0.055, 0.018, SILVER, { roughness: 0.25, metalness: 0.85 })
  anelMic.rotation.x = Math.PI / 2
  anelMic.position.y = 0.255
  microfone.add(anelMic)
  const globo = sphere(0.115, '#2b2b31', { roughness: 0.85 })
  globo.position.y = 0.33
  microfone.add(globo)
  abelha.add(microfone)

  // ---- ferrão preto apontado para o espectador (filho do abdômen) ------------
  const ferrao = new THREE.Group()
  ferrao.position.set(0, -0.3 - AH + 0.04, 0.05)
  ferrao.rotation.x = FERRAO_RX // +y do cone -> frente e baixo (você)
  ferrao.rotation.z = -0.35 // enviesado: o comprimento aparece de frente
  const agulha = cone(0.11, 0.56, '#141113', { roughness: 0.3, detail: 0 }, 48)
  agulha.position.y = 0.28
  ferrao.add(agulha)
  abd.add(ferrao)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'jardim', object: base },
    { name: 'flor', group: 'jardim', object: flor },
    { name: 'arvore', group: 'colmeia', object: arvore },
    { name: 'colmeia', group: 'colmeia', object: colmeia },
    { name: 'placa', group: 'rumor', object: placa },
    { name: 'abelha', group: 'abelha', object: abelha },
    { name: 'cabeca', group: 'abelha', object: cabeca },
    { name: 'antenas', group: 'abelha', object: antenas },
    { name: 'asas', group: 'abelha', object: asas },
    { name: 'microfone', group: 'microfone', object: microfone },
    { name: 'ferrao', group: 'ferrao', object: ferrao },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem -------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'No jardim do seu prédio brota um gramado, com uma flor rosa.',
    }),
    seq('flor-cresce', 'flor', 0.5, 0.7, s3(0.01, 1), { ease: 'easeOut' }),

    seq('arvore-rise', 'arvore', 1.6, 0.9, [riseFrom(GY, 3.3)], {
      ease: 'easeOut',
      caption: 'Num galho da árvore, uma colmeia vai se pendurando, camada por camada…',
    }),
    seq('colmeia-desce', 'colmeia', 2.4, 0.9, [
      ch('scale.y', 0.02, 1), ch('scale.x', 0.4, 1), ch('scale.z', 0.4, 1),
    ], { ease: 'easeOut' }),

    seq('placa-prega', 'placa', 3.9, 0.7, [
      ...s3(0.01, 1), ch('rotation.z', 0.6, 0),
    ], {
      ease: 'easeOut',
      caption: '…mas ela não fabrica mel: fabrica RUMOR — RRÜ-MÔR. Está escrito na placa!',
    }),

    seq('abelha-dispara', 'abelha', 5.6, 0.9, [
      ch('position.x', HIVE[0] + 0.1, BEE[0]),
      ch('position.y', HIVE[1] - HIVE_H + 0.2, BEE[1]),
      ch('position.z', HIVE[2] + 0.4, BEE[2]),
      ch('rotation.y', 1.2, BEE_ROT_Y),
      ...s3(0.12, 1),
    ], {
      ease: 'easeOut',
      caption: 'De lá dispara a abelha fofoqueira, feito repórter de fofoca, e para a um palmo do seu nariz.',
    }),
    seq('asas-zumbem', 'asas', 6.3, 0.8, [ch('rotation.x', 0.9, 0), ...s3(0.3, 1)], { ease: 'easeOut' }),
    seq('antenas-erguem', 'antenas', 6.5, 0.6, [ch('rotation.x', -0.9, 0)], { ease: 'easeOut' }),
    seq('cabeca-inclina', 'cabeca', 6.7, 0.6, [ch('rotation.z', -0.15, 0.12)], { ease: 'easeInOut' }),

    seq('microfone-enfia', 'microfone', 7.8, 0.6, [
      ch('position.z', GRIP.z - 0.35, GRIP.z), ...s3(0.05, 1.25),
    ], {
      ease: 'easeOut',
      caption: 'Ela enfia o microfone na sua cara…',
    }),

    seq('ferrao-aponta', 'ferrao', 9.3, 0.5, [...s3(0.01, 1), ch('rotation.x', 1.2, FERRAO_RX)], {
      ease: 'easeOut',
      caption: '…aponta o ferrão bem pra você e zumbe: RRÜ-MÔR, DÜ?! — qual é o rumor de VOCÊ?',
    }),
    seq('abelha-bota', 'abelha', 9.3, 0.5, [ch('rotation.x', -0.12, 0)], { ease: 'easeOut' }),

    seq('asas-final', 'asas', 11.2, 0.5, [ch('rotation.x', 0.35, 0)], {
      ease: 'easeOut',
      caption: 'Hur mår du? — Como você está?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.25, 5.85], target: [-0.12, 1.62, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'hur-mar-du',
    contexto:
      "Com amigos, colegas próximos, alguém que esteve doente ou que você não vê há tempo. Para conhecidos e no dia a dia rápido o sueco usa mais 'Hur är läget?'.",
    fraseFonte: 'Como você está?',
    fraseAlvo: 'Hur mår du?',
    pronuncia:
      "rrü MÔR dü? ('hur' com H soprado e Ü de bico; na fala o -r de 'hur' quase some: 'hu mår du'; 'mår' com Ô FECHADO e longo, e o R dele se funde com o D de 'du' num D de língua enrolada pra trás (rd retroflexo), como um R caipira emendado no D; 'du' com bico de pato)",
    ponteSonora:
      "RRÜ-MÔR, DÜ? (3 sílabas, tônica no MÔR; é RUMOR dito à carioca — o RR do começo é o h soprado de 'hur', o MESMO RÜR de 'Hur kommer jag till?' e 'Hur bokar man tvättstugan?', só que aqui o R final de 'hur' some antes do M, como o sueco faz na fala: 'hu mår du'; a vogal é Ü de BICO, nunca o U chapado de 'urso'; MÔR com Ô FECHADO e longo, o 'mor' de 'amor' — se fechar em U vira 'mor', que é MÃE; o R de MÔR NÃO some (sem ele sobra 'må', outro verbo): é R à caipira, de língua enrolada, que já encosta no D seguinte como o rd sueco, nunca o R raspado carioca de fim de palavra; DÜ = o 'du' de CAN-DU, com bico de pato)",
    historia:
      'Na colmeia do seu prédio mora a abelha fofoqueira: em vez de mel, ela fabrica RUMOR — está até escrito na placa da porta. Toda vez que você passa, ela dispara pra fora feito repórter de fofoca, para a um palmo do seu nariz, enfia um microfone na sua cara e aponta o ferrão bem pra você: RRÜ-MÔR, DÜ?! — qual é o rumor de VOCÊ? Ela não sai dali, zumbindo, até você contar como está de verdade.',
  },
  createScene,
  refine: { organic: ['abelha', 'cabeca'] },
}

export default card
