import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Jag måste gå nu." — IÁ! MÓSTE... GÔ(ta)! NÜ(vem)!
 *
 * Fika ao ar livre no parque. A convidada mais quentinha da roda é uma
 * salamandra de fogo (preta, de manchas amarelas, chamas nas costas e no
 * rabo). Uma NUVEM cinza estaciona em cima dela, a primeira GOTA apaga a
 * ponta do rabo (TSSSS!), ela pula (IÁ!), MOSTRA a ponta apagada com a gota
 * pendurada e aponta a nuvem: tenho que ir agora.
 *
 * Diorama: gramado, toalha xadrez vermelho e creme, prato de kanelbullar,
 * térmica vermelha e xícaras; a salamandra de pé no centro, o rabo dando a
 * volta pela direita e subindo num gancho de ponta cinza; a nuvem logo acima.
 * Acento saturado RESERVADO à GOTA azul (GÔ); o fogo é a cor dela, o resto
 * do quadro é verde, creme e cinza.
 */

const SOLO = '#5b4430'
const GRAMA = '#6e9a4a'
const GRAMA_ESC = '#557d38'
const GRAMA_CLARA = '#89b25d'
const XADREZ = '#c25a4e'
const CREME = '#efe5d1'
const PRATO = '#f5f2ec'
const MASSA = '#c07d3e'
const MASSA_ESC = '#8f5524'
const TERMICA = '#a53a33'
const METAL = '#c3c9cf'
const PRETO = '#1c1e25'      // pele preta brilhante
const AMARELO = '#f2be2c'    // manchas
const BOCA = '#4e1820'
const LINGUA = '#d9707a'
const CINZA = '#8e8b87'      // ponta apagada do rabo
const FULIGEM = '#55534f'
const FOGO = '#ff5418'
const FOGO_MIOLO = '#ffc53a'
const NUVEM = '#6f7883'
const NUVEM_CLARA = '#88919b'
const NUVEM_ESC = '#525963'
const CHUVA = '#9ccff5'
const FUMACA = '#dde1e5'
const GOTA = '#1689ff'       // acento saturado RESERVADO: a GOTA

const GY = 0.16          // topo do gramado
const TY = GY + 0.012    // topo da toalha
const SAL_X = -0.32
const SAL_Z = -0.12
const SAL_ROT = 0.1

// cabeça: olhando a câmera (pose final) e olhando a nuvem (meio do clipe)
const CAB_Y = 1.42
const OLHA_X = -0.1
const OLHA_Y = -0.08
const CEU_X = -0.5
const CEU_Y = 0.42

// braço que aponta a nuvem: caído (montagem) e erguido (pose final)
const BRACO_CAIDO = -2.6
const BRACO_ERGUIDO = -0.6

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const UP = V(0, 1, 0)

/** Cápsula de a até b (membros, segmentos de rabo). */
function seg(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const len = Math.max(0.001, a.distanceTo(b))
  const c = capsule(r, len, color, { roughness: 0.3, ...opts })
  c.position.copy(a).add(b).multiplyScalar(0.5)
  c.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize())
  return c
}

/** Mancha amarela achatada sobre a pele (+z local = normal da superfície). */
function mancha(p: THREE.Vector3, n: THREE.Vector3, r: number) {
  const s = sphere(r, AMARELO, { roughness: 0.35 })
  s.scale.set(1, 0.8, 0.24)
  s.position.copy(p)
  s.quaternion.setFromUnitVectors(V(0, 0, 1), n.clone().normalize())
  return s
}

/** Orienta: +y local ao longo de dir, +z local o mais perto possível de "para a câmera". */
function apontar(obj: THREE.Object3D, dir: THREE.Vector3, frente = V(0, 0, 1)) {
  const y = dir.clone().normalize()
  let z = frente.clone().sub(y.clone().multiplyScalar(frente.dot(y)))
  if (z.lengthSq() < 1e-4) z = V(1, 0, 0)
  z.normalize()
  const x = y.clone().cross(z).normalize()
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
}

/** Labareda: gota laranja com miolo amarelo voltado para a câmera. */
function labareda(h: number) {
  const g = new THREE.Group()
  const perfil: [number, number][] = [
    [0, 0], [0.24, 0.03], [0.36, 0.13], [0.38, 0.27], [0.3, 0.45], [0.18, 0.66], [0.07, 0.86], [0, 1],
  ]
  const fora = lathe(perfil, FOGO, { emissive: FOGO, emissiveIntensity: 0.85, roughness: 0.6 }, 20)
  fora.scale.set(h, h, h)
  g.add(fora)
  const miolo = lathe(perfil, FOGO_MIOLO, { emissive: FOGO_MIOLO, emissiveIntensity: 0.9, roughness: 0.6 }, 20)
  miolo.scale.set(h * 0.6, h * 0.64, h * 0.3)
  miolo.position.set(0, h * 0.02, h * 0.3)
  g.add(miolo)
  return g
}

function translucido(obj: THREE.Object3D, opacity: number) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const mt = m.material as THREE.MeshStandardMaterial
    mt.transparent = true
    mt.opacity = opacity
    mt.depthWrite = false
    m.castShadow = false
  })
  return obj
}

/** Kanelbulle: pãozinho em espiral com açúcar pérola. */
function kanelbulle(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const base = sphere(0.1, MASSA, { roughness: 0.75 })
  base.scale.set(1, 0.48, 1)
  base.position.y = 0.04
  g.add(base)
  const volta1 = torus(0.062, 0.03, MASSA_ESC, { roughness: 0.75 })
  volta1.rotation.x = Math.PI / 2
  volta1.position.y = 0.078
  g.add(volta1)
  const volta2 = torus(0.028, 0.024, MASSA, { roughness: 0.75 })
  volta2.rotation.x = Math.PI / 2
  volta2.position.y = 0.1
  g.add(volta2)
  const no = sphere(0.026, MASSA_ESC, { roughness: 0.75 })
  no.position.y = 0.11
  g.add(no)
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2
    const rr = 0.03 + rand() * 0.05
    const perola = sphere(0.011, '#fbf8f2', { roughness: 0.5 }, 10)
    perola.position.set(Math.cos(a) * rr, 0.1 + (0.08 - rr) * 0.3, Math.sin(a) * rr)
    g.add(perola)
  }
  g.rotation.y = rand() * Math.PI
  return g
}

function xicara(color: string) {
  const g = new THREE.Group()
  const pires = lathe([[0, 0], [0.11, 0], [0.13, 0.015], [0.12, 0.02], [0, 0.012]], CREME, { roughness: 0.3 })
  g.add(pires)
  const copo = lathe(
    [[0, 0.012], [0.05, 0.012], [0.068, 0.06], [0.072, 0.11], [0.064, 0.11], [0.06, 0.07], [0, 0.07]],
    color,
    { roughness: 0.3 },
  )
  g.add(copo)
  const cafe = cylinder(0.062, 0.062, 0.01, '#4a2c1a', { roughness: 0.2 })
  cafe.position.y = 0.098
  g.add(cafe)
  const alca = torus(0.03, 0.01, color, { roughness: 0.3 })
  alca.position.set(0.078, 0.07, 0)
  g.add(alca)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- parque: gramado + toalha xadrez -------------------------------------
  const base = new THREE.Group()

  const solo = cylinder(2.62, 2.72, 0.1, SOLO, { roughness: 0.95 })
  solo.position.y = 0.05
  base.add(solo)

  const grama = cylinder(2.58, 2.6, 0.07, GRAMA, { roughness: 0.95 })
  grama.position.y = 0.125
  base.add(grama)

  // tufos de grama e margaridas espalhados pela borda (rng fixo)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.3
    const rr = 1.95 + rand() * 0.45
    const tufo = new THREE.Group()
    tufo.position.set(Math.cos(a) * rr, GY, Math.sin(a) * rr)
    for (let k = 0; k < 3; k++) {
      const folha = cone(0.035, 0.16 + rand() * 0.08, k % 2 ? GRAMA_ESC : GRAMA_CLARA, { roughness: 0.9 }, 8)
      folha.position.set((rand() - 0.5) * 0.08, 0.08, (rand() - 0.5) * 0.08)
      folha.rotation.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5)
      tufo.add(folha)
    }
    base.add(tufo)
  }
  for (const [mx, mz] of [[1.75, 1.15], [-1.9, 0.95], [1.3, -1.6], [-1.2, -1.75], [2.05, -0.4]] as const) {
    const flor = new THREE.Group()
    flor.position.set(mx, GY + 0.03, mz)
    const miolo = sphere(0.03, '#f2c230', { roughness: 0.6 }, 12)
    miolo.position.y = 0.012
    flor.add(miolo)
    for (let p = 0; p < 6; p++) {
      const petala = sphere(0.03, '#fbfaf5', { roughness: 0.6 }, 10)
      const a = (p / 6) * Math.PI * 2
      petala.scale.set(1, 0.3, 0.55)
      petala.position.set(Math.cos(a) * 0.045, 0.006, Math.sin(a) * 0.045)
      petala.rotation.y = -a
      flor.add(petala)
    }
    base.add(flor)
  }
  const pedra = rock(0.14, '#8a857c', 7, { roughness: 0.9 })
  pedra.position.set(2.0, GY + 0.04, 0.55)
  base.add(pedra)
  const pedrinha = rock(0.08, '#9a958c', 9, { roughness: 0.9 })
  pedrinha.position.set(2.15, GY + 0.02, 0.78)
  base.add(pedrinha)

  // toalha xadrez: casas alternadas sobre um forro creme
  const toalha = new THREE.Group()
  toalha.position.set(-0.25, GY, 0.3)
  toalha.rotation.y = 0.12
  const NX = 7
  const NZ = 6
  const CASA = 0.34
  const forro = rbox(NX * CASA + 0.04, 0.008, NZ * CASA + 0.04, 0.004, CREME, { roughness: 0.92 })
  forro.position.y = 0.004
  toalha.add(forro)
  for (let i = 0; i < NX; i++) {
    for (let j = 0; j < NZ; j++) {
      if ((i + j) % 2) continue
      const casa = rbox(CASA, 0.006, CASA, 0.002, XADREZ, { roughness: 0.92 })
      casa.position.set((i - (NX - 1) / 2) * CASA, 0.009, (j - (NZ - 1) / 2) * CASA)
      toalha.add(casa)
    }
  }
  base.add(toalha)
  root.add(base)

  // ---- fika: prato de kanelbullar, térmica, xícaras ------------------------
  const fika = new THREE.Group()
  fika.position.set(-1.0, TY, 0.78)
  root.add(fika)

  const prato = lathe(
    [[0, 0], [0.22, 0], [0.28, 0.026], [0.31, 0.04], [0.3, 0.046], [0.24, 0.024], [0, 0.02]],
    PRATO,
    { roughness: 0.25 },
  )
  fika.add(prato)
  for (const [bx, bz, s] of [[-0.1, -0.07, 1], [0.11, -0.05, 7], [0.0, 0.12, 13]] as const) {
    const b = kanelbulle(s)
    b.position.set(bx, 0.02, bz)
    b.scale.setScalar(1.15)
    fika.add(b)
  }

  const termica = new THREE.Group()
  termica.position.set(-0.42, 0, -0.62)
  const corpoT = lathe(
    [[0, 0], [0.105, 0], [0.115, 0.02], [0.115, 0.4], [0.1, 0.44], [0.07, 0.46], [0, 0.46]],
    TERMICA,
    { roughness: 0.35 },
  )
  termica.add(corpoT)
  for (const fy of [0.05, 0.38]) {
    const anel = torus(0.115, 0.012, METAL, { roughness: 0.25, metalness: 0.8 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = fy
    termica.add(anel)
  }
  const tampaT = lathe(
    [[0, 0.44], [0.09, 0.44], [0.095, 0.47], [0.09, 0.56], [0.075, 0.58], [0, 0.58]],
    METAL,
    { roughness: 0.25, metalness: 0.8 },
  )
  termica.add(tampaT)
  const alcaT = rbox(0.03, 0.26, 0.05, 0.012, '#7d2a25', { roughness: 0.5 })
  alcaT.position.set(-0.13, 0.22, 0)
  termica.add(alcaT)
  fika.add(termica)

  const x1 = xicara(CREME)
  x1.position.set(0.48, 0, 0.2)
  x1.rotation.y = 2.4
  fika.add(x1)
  const x2 = xicara('#7fa6b8')
  x2.position.set(-0.55, 0, -0.1)
  x2.rotation.y = 0.6
  fika.add(x2)

  // ---- SALAMANDRA de fogo, de pé ------------------------------------------
  const salamandra = new THREE.Group()
  salamandra.position.set(SAL_X, TY, SAL_Z)
  salamandra.rotation.y = SAL_ROT
  root.add(salamandra)

  const PELE = { roughness: 0.28 }

  const quadril = sphere(0.31, PRETO, PELE)
  quadril.scale.set(1.12, 0.85, 1.0)
  quadril.position.set(0, 0.4, -0.03)
  salamandra.add(quadril)

  const tronco = capsule(0.28, 0.4, PRETO, PELE)
  tronco.position.set(0, 0.8, 0)
  tronco.rotation.x = -0.06
  salamandra.add(tronco)

  const ombros = sphere(0.27, PRETO, PELE)
  ombros.scale.set(1.16, 0.9, 0.95)
  ombros.position.set(0, 1.08, 0)
  salamandra.add(ombros)

  const pescoco = sphere(0.22, PRETO, PELE)
  pescoco.position.set(0, 1.25, 0.02)
  salamandra.add(pescoco)

  const ventre = sphere(0.25, PRETO, { roughness: 0.34 })
  ventre.scale.set(0.95, 1.45, 0.5)
  ventre.position.set(0, 0.72, 0.17)
  salamandra.add(ventre)

  // pernas traseiras abertas, pés largos de cinco dedos
  for (const s of [-1, 1]) {
    salamandra.add(seg(V(s * 0.2, 0.38, 0.02), V(s * 0.4, 0.27, 0.14), 0.12, PRETO))
    salamandra.add(seg(V(s * 0.4, 0.27, 0.14), V(s * 0.43, 0.09, 0.17), 0.1, PRETO))
    const pe = sphere(0.14, PRETO, PELE)
    pe.scale.set(1.0, 0.36, 1.3)
    pe.position.set(s * 0.45, 0.05, 0.25)
    salamandra.add(pe)
    for (let d = 0; d < 5; d++) {
      const a = (d - 2) * 0.32 + s * 0.15
      const p0 = V(s * 0.45 + Math.sin(a) * 0.1, 0.035, 0.3 + Math.cos(a) * 0.1)
      const p1 = V(s * 0.45 + Math.sin(a) * 0.2, 0.03, 0.3 + Math.cos(a) * 0.2)
      salamandra.add(seg(p0, p1, 0.03, PRETO))
      const ponta = sphere(0.042, PRETO, PELE)
      ponta.scale.set(1, 0.6, 1)
      ponta.position.copy(p1)
      salamandra.add(ponta)
    }
  }

  // braço direito dela (lado -x): mão aberta perto da bochecha, de susto
  salamandra.add(seg(V(-0.3, 1.04, 0.03), V(-0.52, 0.86, 0.16), 0.075, PRETO))
  salamandra.add(seg(V(-0.52, 0.86, 0.16), V(-0.52, 1.12, 0.3), 0.066, PRETO))
  salamandra.add(mancha(V(-0.43, 0.97, 0.15), V(-0.3, 0.4, 1), 0.05))
  const maoE = sphere(0.085, PRETO, PELE)
  maoE.scale.set(1, 1.1, 0.55)
  maoE.position.set(-0.52, 1.2, 0.32)
  maoE.rotation.z = -0.2
  salamandra.add(maoE)
  for (let d = 0; d < 4; d++) {
    const a = -0.55 + d * 0.36
    const p0 = V(-0.52 + Math.sin(a) * 0.06, 1.2 + Math.cos(a) * 0.06, 0.33)
    const p1 = V(-0.52 + Math.sin(a) * 0.15, 1.2 + Math.cos(a) * 0.15, 0.34)
    salamandra.add(seg(p0, p1, 0.026, PRETO))
  }

  // manchas amarelas: flancos, costas, ombros, coxas
  for (const [y, deg, r] of [
    [0.96, 72, 0.09], [0.7, 98, 0.1], [0.86, 128, 0.085], [0.6, 155, 0.08],
    [0.94, -78, 0.09], [0.68, -102, 0.1], [0.85, -135, 0.085], [0.6, -165, 0.08],
    [0.8, 180, 0.09],
  ] as const) {
    const a = (deg * Math.PI) / 180
    const n = V(Math.sin(a), 0.1, Math.cos(a)).normalize()
    salamandra.add(mancha(V(Math.sin(a) * 0.27, y, Math.cos(a) * 0.27), n, r))
  }
  for (const s of [-1, 1]) {
    salamandra.add(mancha(V(s * 0.27, 1.17, 0.0), V(s * 0.8, 0.6, 0.1), 0.08))
    salamandra.add(mancha(V(s * 0.31, 0.43, 0.15), V(s * 0.4, 0.8, 0.45), 0.065))
    salamandra.add(mancha(V(s * 0.45, 0.08, 0.2), V(s * 0.2, 1, 0.1), 0.06))
    // coxas e canelas, de frente para a câmera
    salamandra.add(mancha(V(s * 0.3, 0.37, 0.18), V(s * 0.3, 0.35, 1), 0.06))
    salamandra.add(mancha(V(s * 0.44, 0.17, 0.25), V(s * 0.2, 0.1, 1), 0.05))
    // peito, dos lados do ventre
    salamandra.add(mancha(V(s * 0.21, 0.98, 0.19), V(s * 0.6, 0.2, 1), 0.06))
  }

  // ---- cabeça larga e achatada: olhos saltados, boca aberta de susto -------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, CAB_Y, 0.04)
  cabeca.rotation.set(OLHA_X, OLHA_Y, 0)
  salamandra.add(cabeca)

  const cranio = sphere(0.34, PRETO, PELE)
  cranio.scale.set(1.22, 0.68, 1.0)
  cranio.position.set(0, 0.04, 0)
  cabeca.add(cranio)

  const focinho = sphere(0.3, PRETO, PELE)
  focinho.scale.set(1.12, 0.48, 0.85)
  focinho.position.set(0, 0.02, 0.2)
  cabeca.add(focinho)

  const mandibula = sphere(0.27, PRETO, PELE)
  mandibula.scale.set(1.02, 0.4, 0.8)
  mandibula.position.set(0, -0.22, 0.12)
  cabeca.add(mandibula)

  const boca = sphere(0.17, BOCA, { roughness: 0.5 })
  boca.scale.set(1.3, 0.62, 0.6)
  boca.position.set(0, -0.12, 0.31)
  cabeca.add(boca)

  const lingua = sphere(0.075, LINGUA, { roughness: 0.4 })
  lingua.scale.set(1.3, 0.45, 0.9)
  lingua.position.set(0, -0.17, 0.35)
  cabeca.add(lingua)

  for (const s of [-1, 1]) {
    // pálpebra amarela em montinho, olho preto saltado com brilho
    const palpebra = sphere(0.12, AMARELO, { roughness: 0.35 })
    palpebra.scale.set(1.05, 0.8, 1)
    palpebra.position.set(s * 0.255, 0.205, 0.12)
    cabeca.add(palpebra)
    const olho = sphere(0.105, '#08090c', { roughness: 0.08 })
    olho.position.set(s * 0.25, 0.17, 0.2)
    cabeca.add(olho)
    const brilho = sphere(0.032, '#ffffff', { roughness: 0.1 }, 12)
    brilho.position.set(s * 0.22, 0.225, 0.29)
    cabeca.add(brilho)
    const brilho2 = sphere(0.015, '#ffffff', { roughness: 0.1 }, 10)
    brilho2.position.set(s * 0.285, 0.14, 0.295)
    cabeca.add(brilho2)

    // glândulas amarelas atrás dos olhos (a marca da salamandra-de-fogo)
    const glandula = sphere(0.13, AMARELO, { roughness: 0.35 })
    glandula.scale.set(0.9, 0.55, 1.35)
    glandula.position.set(s * 0.29, 0.17, -0.04)
    glandula.rotation.y = -s * 0.25
    cabeca.add(glandula)

    const narina = sphere(0.018, '#050506', { roughness: 0.5 }, 10)
    narina.position.set(s * 0.08, 0.1, 0.43)
    cabeca.add(narina)
  }

  // ---- braço esquerdo dela (lado +x): aponta a NUVEM -----------------------
  const braco = new THREE.Group()
  braco.position.set(0.3, 1.04, 0.03)
  braco.rotation.set(0.3, 0, BRACO_ERGUIDO)
  salamandra.add(braco)
  braco.add(seg(V(0, 0, 0), V(0, 0.31, 0.01), 0.078, PRETO))
  braco.add(seg(V(0, 0.31, 0.01), V(0, 0.58, 0.03), 0.068, PRETO))
  const maoD = sphere(0.085, PRETO, PELE)
  maoD.scale.set(0.95, 1.05, 0.6)
  maoD.position.set(0, 0.66, 0.04)
  braco.add(maoD)
  braco.add(seg(V(0, 0.71, 0.05), V(0, 0.88, 0.06), 0.03, PRETO)) // indicador
  for (const dx of [-0.045, 0.0, 0.045]) {
    const dobrado = sphere(0.032, PRETO, PELE)
    dobrado.position.set(dx, 0.69, 0.1)
    braco.add(dobrado)
  }
  const polegar = seg(V(-0.06, 0.64, 0.05), V(-0.1, 0.72, 0.07), 0.027, PRETO)
  braco.add(polegar)
  braco.add(mancha(V(0, 0.2, 0.075), V(0.1, 0, 1), 0.055))
  braco.add(mancha(V(0.04, 0.45, 0.06), V(0.4, 0, 1), 0.045))

  // ---- chamas das costas: uma coroa de fogo atrás dos ombros ----------------
  const chamas = new THREE.Group()
  chamas.position.set(0, 1.0, -0.2)
  salamandra.add(chamas)
  // leque nos ombros: as do meio passam por cima da cabeça, as de fora
  // escapam pelos lados do corpo
  for (const [deg, h] of [
    [-84, 0.42], [-60, 0.56], [-34, 0.64], [-10, 0.7], [12, 0.7], [36, 0.64], [62, 0.56], [86, 0.42],
  ] as const) {
    const a = (deg * Math.PI) / 180
    const f = labareda(h)
    f.position.set(Math.sin(a) * 0.3, Math.cos(a) * 0.16, -0.02)
    apontar(f, V(Math.sin(a) * 1.25, 1, -0.3))
    chamas.add(f)
  }
  // e uma fileira descendo pelos flancos das costas
  for (const s of [-1, 1]) {
    for (const [y, h] of [[-0.24, 0.4], [-0.46, 0.34]] as const) {
      const f = labareda(h)
      f.position.set(s * 0.2, y, -0.02)
      apontar(f, V(s * 1.3, 0.8, -0.4))
      chamas.add(f)
    }
  }

  // ---- RABO: dá a volta pela direita e sobe num gancho de ponta apagada ----
  const rabo = new THREE.Group()
  rabo.position.set(0.12, 0.36, -0.24)
  salamandra.add(rabo)

  const curva = new THREE.CatmullRomCurve3([
    V(0, 0, 0),
    V(0.16, -0.16, -0.14),
    V(0.46, -0.24, -0.12),
    V(0.9, -0.17, 0.0),
    V(1.2, 0.1, 0.08),
    V(1.32, 0.5, 0.1),
    V(1.3, 0.9, 0.1),
    V(1.18, 1.15, 0.1),
    V(1.01, 1.22, 0.1),
    V(0.88, 1.12, 0.1),
  ])
  const raio = (t: number) => 0.15 - 0.088 * t
  const APAGA = 0.8 // daqui pra frente a ponta é cinza, apagada
  const N = 34
  for (let i = 0; i < N; i++) {
    const t0 = i / N
    const t1 = (i + 1) / N
    const cor = t0 >= APAGA ? CINZA : t0 >= APAGA - 0.04 ? FULIGEM : PRETO
    const opts = t0 >= APAGA - 0.04 ? { roughness: 0.95 } : {}
    rabo.add(seg(curva.getPoint(t0), curva.getPoint(t1), raio(t0), cor, opts))
  }
  // ponta arredondada
  const fim = curva.getPoint(1)
  const capFim = sphere(raio(1), CINZA, { roughness: 0.95 })
  capFim.position.copy(fim)
  rabo.add(capFim)

  // manchas amarelas do rabo, viradas para a câmera, alternando o lado
  for (const [t, lado] of [[0.08, 1], [0.2, -1], [0.33, 1], [0.45, -1], [0.56, 1], [0.67, -1]] as const) {
    const p = curva.getPoint(t)
    const tan = curva.getTangent(t)
    const fora = V(tan.y, -tan.x, 0).normalize()
    const n = V(0, 0, 1).add(fora.multiplyScalar(lado * 0.8)).normalize()
    rabo.add(mancha(p.clone().add(n.clone().multiplyScalar(raio(t) * 0.93)), n, raio(t) * 0.62))
  }

  // ---- chamas do rabo (o fogo se espalha a partir do meio) ----------------
  const chamasRabo = new THREE.Group()
  const meio = curva.getPoint(0.45)
  chamasRabo.position.copy(meio)
  rabo.add(chamasRabo)
  for (const [t, h] of [[0.2, 0.3], [0.31, 0.36], [0.42, 0.4], [0.53, 0.38], [0.63, 0.32], [0.72, 0.22]] as const) {
    const p = curva.getPoint(t)
    const tan = curva.getTangent(t)
    const fora = V(tan.y, -tan.x, 0).normalize()
    const dir = UP.clone().add(fora.clone().multiplyScalar(0.7)).normalize()
    const f = labareda(h)
    f.position.copy(p.clone().add(dir.clone().multiplyScalar(raio(t) * 0.55)).sub(meio))
    apontar(f, dir)
    chamasRabo.add(f)
  }

  // ---- GOTA azul pendurada na ponta ---------------------------------------
  const gota = new THREE.Group()
  gota.position.copy(fim).add(V(0, -raio(1) * 0.6, 0))
  rabo.add(gota)
  const corpoGota = lathe(
    [[0, -0.3], [0.06, -0.29], [0.1, -0.25], [0.112, -0.19], [0.096, -0.12], [0.06, -0.06], [0.022, -0.012], [0, 0]],
    GOTA,
    { roughness: 0.08, emissive: GOTA, emissiveIntensity: 0.28 },
    28,
  )
  corpoGota.scale.setScalar(1.25)
  gota.add(corpoGota)
  const reflexo = sphere(0.026, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.5 }, 12)
  reflexo.scale.set(0.8, 1.3, 0.6)
  reflexo.position.set(-0.055, -0.25, 0.1)
  gota.add(reflexo)

  // ---- fumacinha subindo da ponta apagada ---------------------------------
  let topo = curva.getPoint(APAGA)
  for (let t = APAGA; t <= 1; t += 0.02) {
    const p = curva.getPoint(t)
    if (p.y > topo.y) topo = p
  }
  const fumaca = new THREE.Group()
  fumaca.position.copy(topo).add(V(0, raio(0.9), 0))
  rabo.add(fumaca)
  for (const [fx, fy, fr, s] of [[0.07, 0.08, 0.065, 3], [0.24, 0.2, 0.09, 5], [0.46, 0.28, 0.12, 8]] as const) {
    const p = puff(fr, FUMACA, 4, s, { roughness: 0.95 })
    p.position.set(fx, fy, 0.04)
    fumaca.add(translucido(p, 0.85))
  }

  // ---- NUVEM de chuva e três fios de chuva --------------------------------
  root.updateMatrixWorld(true)
  const topoMundo = rabo.localToWorld(topo.clone())
  const cabecaMundo = cabeca.localToWorld(V(0, 0.25, 0))

  const nuvem = new THREE.Group()
  nuvem.position.set(0.38, 2.45, -0.25)
  nuvem.scale.setScalar(0.88)
  root.add(nuvem)
  for (const [nx, ny, nz, nr, cor] of [
    [0, 0, 0, 0.4, NUVEM],
    [-0.44, -0.06, 0.04, 0.31, NUVEM],
    [0.46, -0.05, 0.0, 0.33, NUVEM],
    [-0.8, -0.12, 0.0, 0.22, NUVEM],
    [0.82, -0.12, -0.02, 0.24, NUVEM],
    [-0.2, 0.26, -0.02, 0.28, NUVEM_CLARA],
    [0.24, 0.24, -0.06, 0.26, NUVEM_CLARA],
    [0.02, 0.06, 0.24, 0.27, NUVEM_CLARA],
  ] as const) {
    const s = sphere(nr, cor, { roughness: 0.95 })
    s.position.set(nx, ny, nz)
    nuvem.add(s)
  }
  const barrigaNuvem = sphere(0.55, NUVEM_ESC, { roughness: 0.95 })
  barrigaNuvem.scale.set(1.75, 0.38, 0.62)
  barrigaNuvem.position.set(0, -0.16, 0)
  nuvem.add(barrigaNuvem)

  const chuva = new THREE.Group()
  const BASE_CHUVA = 2.24
  chuva.position.set(0, BASE_CHUVA, 0)
  root.add(chuva)
  const fios: [number, number, number][] = [
    [topoMundo.x, topoMundo.y + 0.12, topoMundo.z],
    [cabecaMundo.x + 0.05, cabecaMundo.y + 0.12, cabecaMundo.z],
    [(topoMundo.x + cabecaMundo.x) / 2 + 0.05, 1.75, -0.1],
  ]
  for (const [fx, fimY, fz] of fios) {
    const total = BASE_CHUVA - fimY
    for (let d = 0.04; d < total - 0.04; d += 0.16) {
      const traco = capsule(0.021, 0.08, CHUVA, { roughness: 0.2 })
      traco.position.set(fx, -d - 0.05, fz)
      chuva.add(traco)
    }
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'parque', object: base },
    { name: 'fika', group: 'fika', object: fika },
    { name: 'salamandra', group: 'salamandra', object: salamandra },
    { name: 'cabeca', group: 'salamandra', object: cabeca },
    { name: 'rabo', group: 'salamandra', object: rabo },
    { name: 'braco', group: 'salamandra', object: braco },
    { name: 'chamas', group: 'fogo', object: chamas },
    { name: 'chamasRabo', group: 'fogo', object: chamasRabo },
    { name: 'nuvem', group: 'nuvem', object: nuvem },
    { name: 'chuva', group: 'nuvem', object: chuva },
    { name: 'gota', group: 'gota', object: gota },
    { name: 'fumaca', group: 'gota', object: fumaca },
  ]

  const GOTA_Y = gota.position.y
  const NUVEM_X = nuvem.position.x
  const NUVEM_Y = nuvem.position.y
  const cresce = (de = 0.01, ate = 1) => [ch('scale.x', de, ate), ch('scale.y', de, ate), ch('scale.z', de, ate)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Fika ao ar livre no parque: brota o gramado com a toalha xadrez estendida.',
    }),
    seq('fika-surge', 'fika', 1.0, 0.6, [...cresce(), riseFrom(TY, 0.3)], {
      ease: 'easeOut',
      caption: 'Kanelbullar no prato, café na térmica vermelha — a roda está pronta.',
    }),

    seq('salamandra-rise', 'salamandra', 2.3, 0.9, [riseFrom(TY, 2.2)], {
      ease: 'easeOut',
      caption: 'Chega a convidada mais quentinha da roda: uma salamandra de fogo, preta e amarela.',
    }),
    seq('cabeca-sobe', 'cabeca', 2.3, 0.85, [ch('position.y', CAB_Y - 0.45, CAB_Y)], { ease: 'easeOut' }),
    seq('braco-surge', 'braco', 2.3, 0.85, [ch('rotation.z', BRACO_CAIDO - 0.5, BRACO_CAIDO)], { ease: 'easeOut' }),
    seq('rabo-ergue', 'rabo', 2.3, 1.3, [ch('rotation.z', -0.55, 0)], { ease: 'easeOut' }),

    seq('chamas-acende', 'chamas', 3.9, 0.6, cresce(), {
      ease: 'easeOut',
      caption: 'Chamas dançam pelas costas e pelo rabo — é ela que esquenta os kanelbullar.',
    }),
    seq('chamas-rabo-acende', 'chamasRabo', 4.1, 0.6, cresce(), { ease: 'easeOut' }),

    seq('nuvem-chega', 'nuvem', 5.4, 1.0, [
      ch('position.x', NUVEM_X + 2.4, NUVEM_X), ch('position.y', NUVEM_Y + 0.5, NUVEM_Y),
      ...cresce(0.44, 0.88),
    ], {
      ease: 'easeOut',
      caption: 'De repente escurece: uma NUVEM cinza estaciona bem em cima dela…',
    }),
    seq('cabeca-olha-ceu', 'cabeca', 5.7, 0.6, [
      ch('rotation.x', OLHA_X, CEU_X), ch('rotation.y', OLHA_Y, CEU_Y),
    ]),
    seq('chuva-cai', 'chuva', 6.5, 0.5, [ch('scale.y', 0.01, 1)], { ease: 'easeIn' }),

    seq('gota-cai', 'gota', 6.9, 0.45, [ch('position.y', GOTA_Y + 0.85, GOTA_Y), ...cresce(0.4, 1)], {
      ease: 'easeIn',
      caption: '…e a primeira GOTA cai na ponta do rabo: TSSSS! A chama apaga e sobe fumacinha.',
    }),
    seq('fumaca-sobe', 'fumaca', 7.3, 0.8, [...cresce(), ch('position.y', fumaca.position.y - 0.1, fumaca.position.y)], {
      ease: 'easeOut',
    }),

    seq('pulo-sobe', 'salamandra', 8.5, 0.28, [ch('position.y', TY, TY + 0.32)], {
      ease: 'easeOut',
      caption: 'Ela dá um pulo — IÁ! — e MOSTRA (MÓSTE) pra roda a ponta apagada, com a GOTA (GÔ) pendurada.',
    }),
    seq('pulo-desce', 'salamandra', 8.78, 0.3, [ch('position.y', TY + 0.32, TY)], { ease: 'easeIn' }),
    seq('braco-aponta', 'braco', 9.9, 0.6, [ch('rotation.z', BRACO_CAIDO, BRACO_ERGUIDO)], {
      ease: 'easeOut',
      caption: 'Aponta a NUVEM — NÜ! — e já vai embora correndo.',
    }),

    seq('cabeca-volta', 'cabeca', 11.3, 0.6, [
      ch('rotation.x', CEU_X, OLHA_X), ch('rotation.y', CEU_Y, OLHA_Y),
    ], {
      caption: 'Jag måste gå nu. — Tenho que ir agora.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 2.35, 5.55], target: [0.15, 1.42, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-maste-ga-nu',
    contexto:
      "Despedida: saindo da festa, do after-work, da fika que se estendeu, do papo no corredor ou do telefonema. Quase sempre com o motivo junto: '..., jag ska hämta på förskolan' ou '..., bussen går snart'.",
    fraseFonte: 'Tenho que ir agora.',
    fraseAlvo: 'Jag måste gå nu.',
    pronuncia:
      "iá MÓS-te gô NÜÜ ('jag' = iá; 'måste' com força no MÓS, Ó ABERTO e CURTO — é o å curto, como em 'åtta' —, S comprido e o -te fraquinho de T duro, nunca 'tchi'; 'gå' = GÔ com Ô FECHADO e LONGO — o å longo —, SEM R — com R vira 'går', outra forma; 'nu' com bico de pato, longo e com força: é o 'agora' da frase)",
    ponteSonora:
      "IÁ! MÓSTE... GÔ(ta)! NÜ(vem)! (5 sílabas: iá-MÓS-te-gô-NÜÜ; força no MÓS e no NÜÜ; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado; MÓSTE é o MESMO 'måste' de 'Jag måste vabba idag' e 'Jag måste göra en felanmälan': MOSTRE sem o R, força no MÓS, e na cena ela MOSTRA mesmo; o Ó é ABERTO e CURTO, exatamente como o brasileiro já fala 'mostre' e 'mostra' — é o å CURTO, o mesmo Ó de 'kommer' e de 'åtta' —, e o -te é fraquinho e de T duro, nunca 'mós-tchi'; GÔ = a GOTA cortada no Ô: aqui sim Ô FECHADO de 'avô' e LONGO — é o å LONGO, e o contraste MÓS aberto / GÔ fechado é exatamente o que o sueco faz —, e PARE AÍ — com o -TA vira 'gåta' (charada) — e NADA de R: 'går' é outra forma; depois de 'måste' o verbo fica pelado: gå; NÜ = a NUVEM cortada no NU, com BICO DE PATO — lábios em bico e língua pra frente, o mesmo Ü de DÜ —, LONGO e com força: é o 'agora')",
    historia:
      'Fika ao ar livre no parque: a convidada mais quentinha da roda é uma salamandra de fogo, com chamas dançando pelas costas e pelo rabo — é ela que esquenta os kanelbullar. De repente escurece: uma NUVEM cinza estaciona bem em cima dela, e a primeira GOTA cai na ponta do rabo — TSSSS!, sobe uma fumacinha. A salamandra dá um pulo, IÁ!, MOSTRA pra roda inteira a ponta do rabo apagada com a GOTA ainda pendurada, aponta a NUVEM e já sai correndo: tenho que ir embora agora!',
  },
  createScene,
  refine: { organic: ['salamandra', 'cabeca', 'rabo', 'braco'] },
}

export default card
