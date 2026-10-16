import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Det är för varmt här." — DÊ É... FÖÖR! VAR-M(a)T(e)... RRÉR!
 *
 * Primeira bastu da GALINHA-D'ANGOLA: ela senta no banco mais alto, o bafo
 * das pedras sobe e ela sopra pelo bico (FÖÖR!). Na parede, nessa sauna tem
 * VAR: o telão e o termômetro no vermelho. O chimarrão ferve até o MATE virar
 * só M e T (VAR-M'T), a HERA da parede murcha (RRÉR) e as bolinhas brancas
 * das penas começam a escorrer.
 *
 * Diorama: piso de ripas claras, parede de pinho cor de mel, banco de dois
 * degraus; aquecedor preto com pedras à esquerda, balde e concha na frente;
 * galinha-d'angola cinza-chumbo de bolinhas no degrau de cima; cuia ao lado;
 * telão VAR e termômetro na parede; hera murcha pendendo à esquerda.
 *
 * Paleta: madeiras mel/claras + cinza-chumbo da ave + azul do rosto. Acento
 * saturado RESERVADO ao calor: a faixa vermelha do termômetro.
 */

const DISCO = '#9c7449'
const RIPA = '#dcbb8b'
const RIPA_B = '#d0ad7c'
const PINHO = '#c58b4b'
const PINHO_B = '#b97f41'
const PINHO_ESC = '#8f5f2e'
const BANCO = '#e2c18e'
const BANCO_ESC = '#c9a26b'
const FERRO = '#2a2c31'
const PEDRA = '#8b8a86'
const PEDRA_B = '#6f706d'
const VAPOR = '#f4f6f8'

const CHUMBO = '#454c5c'     // corpo da galinha-d'angola
const CHUMBO_ESC = '#363c4a' // asas e cauda
const PESCOCO = '#4f5b78'
const PINTA = '#f3f3ee'
const ROSTO = '#7fb2e5'      // pele nua azul
const ROSTO_BRANCO = '#eef4fa'
const PESCOCO_NU = '#6b8fc0'
const CASCO = '#b97b3c'      // capacete ósseo
const BICO = '#edc65a'
const BARBELA = '#c92f28'
const PE = '#8d8f96'

const CUIA = '#6e4423'
const CUIA_CLARA = '#8d5a30'
const ERVA = '#6f9a3a'
const PRATA = '#c9ced4'
const TELA = '#0c0e12'
const MOLDURA = '#202329'
const SUOR = '#86cdf4'
const HERA = '#86883a'
const HERA_SECA = '#a8823d'
const HERA_CAULE = '#6b5a2c'
const QUENTE = '#ff3b1a'     // acento: o vermelho do termômetro

const FY = 0.14              // topo do piso de ripas
const WALL_Z = -1.55
const WF = WALL_Z + 0.07     // face da parede
const UP_Y = 0.92            // topo do degrau de cima
const LOW_Y = 0.54           // topo do degrau de baixo
const BENCH_X0 = -0.85
const BENCH_X1 = 1.85
const UP_Z0 = WF + 0.02
const UP_Z1 = -0.3
const LOW_Z1 = 0.25

const BIRD: [number, number, number] = [0.05, UP_Y, -0.82]
const BIRD_YAW = -0.3
const BIRD_SCALE = 1.2
const HEAD: [number, number, number] = [0, 1.2, 0.5]
const HEATER: [number, number, number] = [-1.42, FY, -0.6]
const TELAO: [number, number, number] = [0.95, 2.4, WF + 0.05]
const CUIA_POS: [number, number, number] = [1.12, UP_Y, -0.6]
const HERA_POS: [number, number, number] = [-1.6, 2.92, WF + 0.06]

// ponteiro do termômetro: aponta +y em rotation.z = 0
const PONTEIRO_FRIO = 1.25
const PONTEIRO_QUENTE = -1.75

type V3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)

/** Torna translúcido tudo que estiver debaixo do objeto (vapor). */
function translucent(obj: THREE.Object3D, opacity: number) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const mt = m.material as THREE.Material
    mt.transparent = true
    mt.opacity = opacity
    mt.depthWrite = false
    m.castShadow = false
  })
}

/** Traço de letra do telão: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, '#ffffff', {
    roughness: 0.4, emissive: '#ffffff', emissiveIntensity: 0.35,
  })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** V A R — letras de traço grosso (altura ~0.17 antes da escala). */
function letter(which: 'V' | 'A' | 'R') {
  const g = new THREE.Group()
  const t = 0.028
  if (which === 'V') {
    g.add(stroke(t, 0.175, -0.028, 0, 0.3))
    g.add(stroke(t, 0.175, 0.028, 0, -0.3))
  } else if (which === 'A') {
    g.add(stroke(t, 0.175, -0.028, 0, -0.3))
    g.add(stroke(t, 0.175, 0.028, 0, 0.3))
    g.add(stroke(0.062, 0.024, 0, -0.026))
  } else {
    g.add(stroke(t, 0.17, -0.042, 0))
    g.add(stroke(0.072, t, -0.008, 0.071))
    g.add(stroke(0.072, t, -0.008, 0.008))
    g.add(stroke(t, 0.06, 0.03, 0.04))
    g.add(stroke(t, 0.095, 0.026, -0.044, 0.5))
  }
  return g
}

/** Elipsoide (esfera escalada + girada) — o tijolo do corpo da ave. */
interface Ell { c: V3; r: V3; rot?: V3; dots: boolean; color: string }

function ellMatrix(e: Ell) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(e.rot ?? [0, 0, 0])))
  return new THREE.Matrix4().compose(new THREE.Vector3(...e.c), q, new THREE.Vector3(...e.r))
}

function ellMesh(e: Ell) {
  const m = sphere(1, e.color, { roughness: 0.85, size: 2 * Math.max(...e.r) }, 40)
  m.position.set(...e.c)
  m.scale.set(...e.r)
  if (e.rot) m.rotation.set(...e.rot)
  return m
}

/** Galinha-d'angola: corpo redondo e corcunda, cinza-chumbo de bolinhas brancas. */
function makeGuineafowl() {
  const g = new THREE.Group()
  const rand = rng(77)

  const ells: Ell[] = [
    { c: [0, 0.47, 0], r: [0.52, 0.46, 0.56], dots: true, color: CHUMBO },             // corpo
    { c: [0, 0.68, -0.1], r: [0.43, 0.36, 0.44], dots: true, color: CHUMBO },          // corcunda
    { c: [0, 0.46, 0.24], r: [0.42, 0.4, 0.36], dots: true, color: CHUMBO },           // peito
    { c: [0, 0.32, -0.42], r: [0.3, 0.26, 0.24], rot: [-0.45, 0, 0], dots: true, color: CHUMBO_ESC }, // cauda caída
    { c: [-0.45, 0.54, -0.07], r: [0.15, 0.32, 0.46], rot: [0.22, 0, -0.12], dots: true, color: CHUMBO_ESC }, // asa
    { c: [0.45, 0.54, -0.07], r: [0.15, 0.32, 0.46], rot: [0.22, 0, 0.12], dots: true, color: CHUMBO_ESC },   // asa
    { c: [0, 0.95, 0.36], r: [0.12, 0.21, 0.12], rot: [0.5, 0, 0], dots: false, color: PESCOCO },         // pescoço
  ]
  for (const e of ells) g.add(ellMesh(e))

  // pés encolhidos aparecendo na beira do banco
  for (const side of [-1, 1]) {
    const perna = capsule(0.035, 0.08, PE, { roughness: 0.6 })
    perna.position.set(side * 0.17, 0.08, 0.34)
    perna.rotation.x = 0.6
    g.add(perna)
    for (let k = -1; k <= 1; k++) {
      const dedo = capsule(0.022, 0.09, PE, { roughness: 0.6 })
      dedo.position.set(side * 0.17 + k * 0.05, 0.03, 0.43)
      dedo.rotation.set(Math.PI / 2, 0, -k * 0.45)
      g.add(dedo)
    }
  }

  // bolinhas brancas: amostradas na superfície de cada elipsoide e mantidas só
  // onde ficam por fora da união (nada enterrado em asa/peito)
  const mats = ells.map(ellMatrix)
  const invs = mats.map((m) => m.clone().invert())
  const dotGeo = new THREE.SphereGeometry(1, 10, 8)
  const dotMat = mat(PINTA, { roughness: 0.6, size: 0.06 })
  const placed: { p: THREE.Vector3; n: THREE.Vector3 }[] = []
  const tmp = new THREE.Vector3()
  const zAxis = new THREE.Vector3(0, 0, 1)

  ells.forEach((e, i) => {
    if (!e.dots) return
    const [a, b, c] = e.r
    const area = 4 * Math.PI * Math.pow((Math.pow(a * b, 1.6) + Math.pow(a * c, 1.6) + Math.pow(b * c, 1.6)) / 3, 1 / 1.6)
    const n = Math.round(area * 120)
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(e.rot ?? [0, 0, 0])))
    for (let k = 0; k < n; k++) {
      // Fibonacci com jitter
      const y = 1 - (2 * (k + 0.5)) / n
      const rr = Math.sqrt(1 - y * y)
      const th = k * 2.39996 + (rand() - 0.5) * 0.6
      const u = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr)
      const p = u.clone().applyMatrix4(mats[i])
      const nrm = u.clone().divide(new THREE.Vector3(a, b, c)).applyQuaternion(q).normalize()
      if (p.y < 0.1) continue
      let buried = false
      for (let j = 0; j < ells.length; j++) {
        if (j === i) continue
        tmp.copy(p).applyMatrix4(invs[j])
        if (tmp.length() < 1.0) { buried = true; break }
      }
      if (buried) continue
      if (placed.some((o) => o.p.distanceTo(p) < 0.068)) continue
      placed.push({ p, n: nrm })
    }
  })

  for (const { p, n } of placed) {
    const r = 0.019 + rand() * 0.009
    const dot = new THREE.Mesh(dotGeo, dotMat)
    dot.castShadow = false
    dot.receiveShadow = true
    dot.scale.set(r, r, r * 0.7)
    dot.quaternion.setFromUnitVectors(zAxis, n)
    dot.position.copy(p).addScaledVector(n, 0.01)
    g.add(dot)
  }

  // algumas bolinhas do peito "escorrendo" de calor
  const front = placed.filter(({ p, n }) => n.z > 0.55 && p.y > 0.3 && p.y < 0.8 && Math.abs(p.x) < 0.35)
  for (let k = 0; k < Math.min(5, front.length); k++) {
    const { p, n } = front[Math.floor(((k + 0.5) / 5) * front.length)]
    const down = new THREE.Vector3(0, -1, 0)
    const tan = down.addScaledVector(n, -n.dot(down)).normalize()
    // a própria bolinha esticada pra baixo em gota, como tinta escorrendo
    const r = 0.024 + rand() * 0.006
    const drip = new THREE.Mesh(dotGeo, dotMat)
    const side = new THREE.Vector3().crossVectors(tan, n)
    drip.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, tan, n))
    drip.scale.set(r, r * 2.3, r * 0.7)
    drip.position.copy(p).addScaledVector(n, 0.008).addScaledVector(tan, r * 1.4)
    drip.castShadow = false
    g.add(drip)
  }

  return g
}

/** Cabeça: pele nua azul e branca, capacete ósseo, barbelas vermelhas, bico soprando. */
function makeHead() {
  const h = new THREE.Group()

  const nu = capsule(0.085, 0.16, PESCOCO_NU, { roughness: 0.6 })
  nu.position.set(0, -0.17, -0.05)
  nu.rotation.x = 0.4
  h.add(nu)

  const cranio = sphere(0.205, ROSTO, { roughness: 0.55 })
  cranio.scale.set(0.86, 1.0, 1.08)
  h.add(cranio)

  for (const side of [-1, 1]) {
    const bochecha = sphere(0.12, ROSTO_BRANCO, { roughness: 0.55 })
    bochecha.scale.set(0.4, 0.75, 0.9)
    bochecha.position.set(side * 0.135, -0.06, 0.07)
    h.add(bochecha)
  }

  // capacete ósseo, inclinado pra trás
  const casco = lathe(
    [[0, 0], [0.075, 0], [0.082, 0.05], [0.07, 0.12], [0.05, 0.17], [0.026, 0.195], [0, 0.2]],
    CASCO,
    { roughness: 0.45 },
  )
  casco.scale.set(0.8, 1, 1.05)
  casco.position.set(0, 0.13, -0.03)
  casco.rotation.x = -0.5
  h.add(casco)

  // bico em bico, soprando
  const bicoSup = cone(0.058, 0.15, BICO, { roughness: 0.4 })
  bicoSup.rotation.x = Math.PI / 2
  bicoSup.position.set(0, -0.025, 0.25)
  h.add(bicoSup)
  const bicoInf = cone(0.042, 0.1, BICO, { roughness: 0.4 })
  bicoInf.rotation.x = Math.PI / 2 + 0.35
  bicoInf.position.set(0, -0.07, 0.22)
  h.add(bicoInf)

  for (const side of [-1, 1]) {
    // barbelas vermelhas pendendo da base do bico
    const barbela = capsule(0.042, 0.07, BARBELA, { roughness: 0.5 })
    barbela.scale.set(0.6, 1, 0.9)
    barbela.position.set(side * 0.075, -0.15, 0.15)
    barbela.rotation.x = 0.3
    h.add(barbela)

    // olhos exaustos: pálpebra pesada caindo
    const esclera = sphere(0.055, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.095, 0.035, 0.15)
    esclera.scale.z = 0.6
    const pupila = sphere(0.027, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.095, 0.02, 0.183)
    h.add(esclera, pupila)

    const palpebra = sphere(0.06, ROSTO, { roughness: 0.55 })
    palpebra.scale.set(1.05, 0.62, 0.72)
    palpebra.position.set(side * 0.095, 0.062, 0.158)
    palpebra.rotation.z = -side * 0.3
    h.add(palpebra)
  }
  return h
}

/** Gota de suor: esfera com a ponta virada para a cabeça. */
function drop(dir: THREE.Vector3) {
  const g = new THREE.Group()
  const bola = sphere(0.042, SUOR, { roughness: 0.15 }, 20)
  g.add(bola)
  const ponta = cone(0.04, 0.085, SUOR, { roughness: 0.15 }, 20)
  ponta.position.y = 0.048
  g.add(ponta)
  g.quaternion.setFromUnitVectors(UP, dir.clone().negate().normalize())
  return g
}

/** Ramo de hera pendendo: caule em cadeia de cápsulas, folhas caídas. */
function strand(len: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  let p = new THREE.Vector3(0, 0, 0)
  const step = 0.11
  const n = Math.round(len / step)
  for (let i = 0; i < n; i++) {
    const q = new THREE.Vector3(
      p.x + (rand() - 0.5) * 0.06,
      p.y - step,
      Math.max(0.01, p.z + (rand() - 0.5) * 0.02),
    )
    const dir = q.clone().sub(p)
    const caule = capsule(0.012, dir.length(), HERA_CAULE, { roughness: 0.8 })
    caule.position.copy(p).add(q).multiplyScalar(0.5)
    caule.quaternion.setFromUnitVectors(UP, dir.normalize())
    g.add(caule)

    const side = i % 2 === 0 ? -1 : 1
    const folha = new THREE.Group()
    folha.position.copy(q).add(new THREE.Vector3(side * 0.04, 0, 0.03))
    folha.rotation.set(0.5 + rand() * 0.3, 0, side * (0.4 + rand() * 0.4) + Math.PI)
    const cor = rand() < 0.5 ? HERA_SECA : HERA
    const lamina = sphere(0.055, cor, { roughness: 0.8 }, 20)
    lamina.scale.set(1.0, 1.3, 0.22)
    lamina.position.y = 0.06
    folha.add(lamina)
    for (const ls of [-1, 1]) {
      const lobo = sphere(0.035, cor, { roughness: 0.8 }, 16)
      lobo.scale.set(1, 1.1, 0.22)
      lobo.position.set(ls * 0.045, 0.035, 0)
      folha.add(lobo)
    }
    g.add(folha)
    p = q
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: piso de ripas claras ------------------------------------------
  const base = new THREE.Group()
  const disco = cylinder(2.62, 2.7, 0.12, DISCO, { roughness: 0.8 })
  disco.position.y = 0.06
  base.add(disco)
  for (let i = -8; i <= 8; i++) {
    const z = i * 0.29
    const meia = Math.sqrt(Math.max(0, 2.56 * 2.56 - z * z))
    if (meia < 0.2) continue
    const ripa = rbox(meia * 2, 0.03, 0.25, 0.01, i % 2 === 0 ? RIPA : RIPA_B, { roughness: 0.7 })
    ripa.position.set(0, 0.125, z)
    base.add(ripa)
  }
  root.add(base)

  // ---- paredes de pinho cor de mel -----------------------------------------
  const paredes = new THREE.Group()
  paredes.position.set(0, FY, WALL_Z)
  const painel = rbox(3.9, 3.0, 0.14, 0.04, PINHO_ESC, { roughness: 0.8 })
  painel.position.y = 1.5
  paredes.add(painel)
  for (let i = 0; i < 18; i++) {
    const tabua = rbox(3.86, 0.152, 0.025, 0.008, i % 2 === 0 ? PINHO : PINHO_B, { roughness: 0.7 })
    tabua.position.set(0, 0.09 + i * 0.165, 0.075)
    paredes.add(tabua)
  }
  const cimalha = rbox(3.96, 0.08, 0.2, 0.03, PINHO_ESC, { roughness: 0.7 })
  cimalha.position.y = 3.0
  paredes.add(cimalha)
  // floreira de onde pende a hera
  const floreira = rbox(0.52, 0.17, 0.17, 0.03, PINHO_ESC, { roughness: 0.75 })
  floreira.position.set(HERA_POS[0], HERA_POS[1] - FY + 0.06, 0.16)
  paredes.add(floreira)
  const terra = rbox(0.46, 0.03, 0.12, 0.01, '#4a3420', { roughness: 0.95 })
  terra.position.set(HERA_POS[0], HERA_POS[1] - FY + 0.145, 0.16)
  paredes.add(terra)
  root.add(paredes)

  // ---- banco de dois degraus -----------------------------------------------
  const banco = new THREE.Group()
  const W = BENCH_X1 - BENCH_X0
  const XC = (BENCH_X0 + BENCH_X1) / 2
  // tampo de cima: 5 ripas
  const upDepth = UP_Z1 - UP_Z0
  for (let i = 0; i < 5; i++) {
    const d = (upDepth - 4 * 0.02) / 5
    const ripa = rbox(W, 0.05, d, 0.015, BANCO, { roughness: 0.65 })
    ripa.position.set(XC, UP_Y - 0.025, UP_Z0 + d / 2 + i * (d + 0.02))
    banco.add(ripa)
  }
  // espelho entre os degraus
  for (const [y0, y1] of [[LOW_Y + 0.02, 0.7], [0.72, UP_Y - 0.06]] as const) {
    const esp = rbox(W - 0.04, y1 - y0, 0.04, 0.012, BANCO_ESC, { roughness: 0.7 })
    esp.position.set(XC, (y0 + y1) / 2, UP_Z1 - 0.03)
    banco.add(esp)
  }
  // degrau de baixo: 3 ripas
  const lowDepth = LOW_Z1 - UP_Z1
  for (let i = 0; i < 3; i++) {
    const d = (lowDepth - 2 * 0.025) / 3
    const ripa = rbox(W, 0.05, d, 0.015, BANCO, { roughness: 0.65 })
    ripa.position.set(XC, LOW_Y - 0.025, UP_Z1 + d / 2 + i * (d + 0.025))
    banco.add(ripa)
  }
  const saia = rbox(W - 0.04, LOW_Y - 0.06 - FY, 0.04, 0.012, BANCO_ESC, { roughness: 0.7 })
  saia.position.set(XC, FY + (LOW_Y - 0.06 - FY) / 2, LOW_Z1 - 0.04)
  banco.add(saia)
  // cabeceiras laterais
  for (const x of [BENCH_X0 + 0.03, BENCH_X1 - 0.03]) {
    const alto = rbox(0.06, UP_Y - FY - 0.05, upDepth - 0.04, 0.015, BANCO_ESC, { roughness: 0.7 })
    alto.position.set(x, FY + (UP_Y - FY - 0.05) / 2, (UP_Z0 + UP_Z1) / 2)
    banco.add(alto)
    const baixo = rbox(0.06, LOW_Y - FY - 0.05, lowDepth - 0.04, 0.015, BANCO_ESC, { roughness: 0.7 })
    baixo.position.set(x, FY + (LOW_Y - FY - 0.05) / 2, (UP_Z1 + LOW_Z1) / 2)
    banco.add(baixo)
  }
  // toalhinha dobrada no degrau de baixo
  const toalha = rbox(0.42, 0.05, 0.3, 0.02, '#f1ece2', { roughness: 0.95 })
  toalha.position.set(1.35, LOW_Y + 0.025, -0.18)
  toalha.rotation.y = 0.15
  banco.add(toalha)
  const toalha2 = rbox(0.42, 0.04, 0.3, 0.02, '#e7dfd0', { roughness: 0.95 })
  toalha2.position.set(1.35, LOW_Y + 0.07, -0.18)
  toalha2.rotation.y = 0.05
  banco.add(toalha2)
  root.add(banco)

  // ---- aquecedor preto com pedras + balde e concha --------------------------
  const aquecedor = new THREE.Group()
  aquecedor.position.set(...HEATER)
  const corpo = rbox(0.64, 0.72, 0.56, 0.05, FERRO, { roughness: 0.45, metalness: 0.6 })
  corpo.position.y = 0.36
  aquecedor.add(corpo)
  for (let i = -2; i <= 2; i++) {
    const aleta = rbox(0.045, 0.56, 0.03, 0.012, '#3a3d44', { roughness: 0.4, metalness: 0.6 })
    aleta.position.set(i * 0.11, 0.36, 0.285)
    aquecedor.add(aleta)
  }
  const bandeja = rbox(0.7, 0.06, 0.62, 0.02, '#3a3d44', { roughness: 0.4, metalness: 0.6 })
  bandeja.position.y = 0.75
  aquecedor.add(bandeja)
  for (let i = 0; i < 16; i++) {
    const layer = i < 9 ? 0 : i < 14 ? 1 : 2
    const ang = rand() * Math.PI * 2
    const rad = layer === 0 ? 0.08 + rand() * 0.18 : layer === 1 ? rand() * 0.14 : rand() * 0.05
    const pedra = rock(0.09 + rand() * 0.04, i % 2 ? PEDRA : PEDRA_B, 100 + i, { roughness: 0.9 })
    pedra.position.set(Math.cos(ang) * rad, 0.82 + layer * 0.08, Math.sin(ang) * rad * 0.85)
    pedra.rotation.set(rand() * 3, rand() * 3, rand() * 3)
    aquecedor.add(pedra)
  }
  // grade de madeira em volta
  for (const sx of [-1, 1]) {
    const poste = rbox(0.05, 0.62, 0.05, 0.015, BANCO_ESC, { roughness: 0.7 })
    poste.position.set(sx * 0.42, 0.31, 0.38)
    aquecedor.add(poste)
  }
  const trilho = rbox(0.9, 0.05, 0.05, 0.015, BANCO, { roughness: 0.65 })
  trilho.position.set(0, 0.56, 0.38)
  aquecedor.add(trilho)
  const trilho2 = rbox(0.9, 0.05, 0.05, 0.015, BANCO, { roughness: 0.65 })
  trilho2.position.set(0, 0.28, 0.38)
  aquecedor.add(trilho2)

  const balde = new THREE.Group()
  balde.position.set(0.1, 0, 0.62)
  const tina = lathe(
    [[0, 0], [0.15, 0], [0.16, 0.02], [0.18, 0.27], [0.165, 0.27], [0.148, 0.04], [0, 0.04]],
    '#b8864c',
    { roughness: 0.7 },
  )
  balde.add(tina)
  for (const by of [0.06, 0.21]) {
    const aro = torus(by < 0.1 ? 0.163 : 0.175, 0.012, '#7d8288', { roughness: 0.35, metalness: 0.7 })
    aro.rotation.x = Math.PI / 2
    aro.position.y = by
    balde.add(aro)
  }
  const agua = cylinder(0.158, 0.158, 0.01, '#8fc6dc', { roughness: 0.1 })
  agua.position.y = 0.22
  balde.add(agua)
  const cabo = cylinder(0.016, 0.018, 0.6, '#c79a5e', { roughness: 0.6 })
  cabo.position.set(0.06, 0.4, -0.02)
  cabo.rotation.z = -0.45
  balde.add(cabo)
  aquecedor.add(balde)
  root.add(aquecedor)

  // ---- vapor das pedras -----------------------------------------------------
  const vapor = new THREE.Group()
  vapor.position.set(HEATER[0], FY + 0.95, HEATER[2])
  for (const [vx, vy, vz, vr, s] of [
    [0, 0.04, 0, 0.15, 1], [0.14, 0.26, 0.06, 0.17, 2], [0.36, 0.46, 0.12, 0.16, 3], [0.6, 0.6, 0.18, 0.13, 4],
  ] as const) {
    const nuvem = puff(vr, VAPOR, 5, 60 + s, { roughness: 0.95 })
    nuvem.position.set(vx, vy, vz)
    vapor.add(nuvem)
  }
  translucent(vapor, 0.7)
  root.add(vapor)

  // ---- galinha-d'angola ------------------------------------------------------
  const galinha = new THREE.Group()
  galinha.position.set(...BIRD)
  galinha.rotation.y = BIRD_YAW
  root.add(galinha)
  const ave = makeGuineafowl()
  ave.scale.setScalar(BIRD_SCALE)
  galinha.add(ave)

  const cabeca = makeHead()
  cabeca.position.set(...HEAD)
  cabeca.rotation.set(0.12, -0.6, 0)
  ave.add(cabeca)

  // sopro saindo do bico (filho da cabeça)
  const sopro = new THREE.Group()
  sopro.position.set(0, -0.02, 0.4)
  sopro.rotation.y = 0.45 // sai rumo à câmera, sem cobrir a hera
  for (const [sz, sy, sr, s] of [[0.0, 0, 0.045, 1], [0.11, 0.03, 0.065, 2], [0.25, 0.07, 0.088, 3]] as const) {
    const bafo = puff(sr, VAPOR, 4, 80 + s, { roughness: 0.95 })
    bafo.position.set(0, sy, sz)
    sopro.add(bafo)
  }
  translucent(sopro, 0.9)
  cabeca.add(sopro)

  // gotas de suor voando da cabeça (filhas da cabeça)
  // (espalhadas no plano da tela: a cabeça está virada, então "lado" na
  // tela é a direção perpendicular à câmera no espaço local da cabeça)
  const suor = new THREE.Group()
  const telaLado = new THREE.Vector3(-0.52, 0, 0.85) // +: rumo ao bico (esquerda da tela)
  for (const [sx, sy] of [[0.28, 0.33], [-0.36, 0.14], [-0.28, 0.36], [0.02, 0.46], [-0.4, -0.1]] as const) {
    const dir = telaLado.clone().multiplyScalar(sx).add(new THREE.Vector3(0, sy, 0))
    const gota = drop(dir)
    gota.position.copy(dir)
    suor.add(gota)
  }
  cabeca.add(suor)

  // ---- cuia de chimarrão fervendo ------------------------------------------
  const cuia = new THREE.Group()
  cuia.position.set(...CUIA_POS)
  cuia.rotation.y = -0.3
  cuia.scale.setScalar(1.25)
  const porongo = lathe(
    [[0, 0], [0.09, 0], [0.14, 0.04], [0.165, 0.11], [0.16, 0.19], [0.13, 0.25], [0.115, 0.29], [0.11, 0.3], [0, 0.3]],
    CUIA,
    { roughness: 0.55 },
  )
  cuia.add(porongo)
  const faixa = torus(0.16, 0.012, CUIA_CLARA, { roughness: 0.5 })
  faixa.rotation.x = Math.PI / 2
  faixa.position.y = 0.15
  cuia.add(faixa)
  const virola = torus(0.112, 0.016, PRATA, { roughness: 0.25, metalness: 0.8 })
  virola.rotation.x = Math.PI / 2
  virola.position.y = 0.3
  cuia.add(virola)
  const erva = sphere(0.1, ERVA, { roughness: 0.9 })
  erva.scale.set(1, 0.35, 1)
  erva.position.y = 0.305
  cuia.add(erva)
  for (const [bx, bz, br] of [[0.04, 0.02, 0.025], [-0.035, 0.04, 0.02], [0.0, -0.05, 0.022], [-0.05, -0.02, 0.016]] as const) {
    const bolha = sphere(br, '#b9d98a', { roughness: 0.3 }, 16)
    bolha.position.set(bx, 0.335, bz)
    cuia.add(bolha)
  }
  const bomba = cylinder(0.012, 0.012, 0.42, PRATA, { roughness: 0.25, metalness: 0.85 })
  bomba.position.set(0.05, 0.42, 0)
  bomba.rotation.z = -0.3
  cuia.add(bomba)
  const bocal = cylinder(0.012, 0.012, 0.08, PRATA, { roughness: 0.25, metalness: 0.85 })
  bocal.position.set(0.13, 0.64, 0)
  bocal.rotation.z = -1.1
  cuia.add(bocal)
  root.add(cuia)

  // vapor do mate fervendo
  const fervura = new THREE.Group()
  fervura.position.set(CUIA_POS[0] - 0.05, UP_Y + 0.5, CUIA_POS[2])
  for (const [fx, fy, fr, s] of [[0, 0, 0.1, 1], [-0.06, 0.2, 0.13, 2], [0.03, 0.44, 0.12, 3]] as const) {
    const nuvem = puff(fr, VAPOR, 4, 90 + s, { roughness: 0.95 })
    nuvem.position.set(fx, fy, 0)
    fervura.add(nuvem)
  }
  translucent(fervura, 0.75)
  root.add(fervura)

  // ---- telão VAR + termômetro na parede -------------------------------------
  const telao = new THREE.Group()
  telao.position.set(...TELAO)
  const moldura = rbox(1.02, 0.6, 0.08, 0.04, MOLDURA, { roughness: 0.4, metalness: 0.3 })
  telao.add(moldura)
  const tela = rbox(0.92, 0.5, 0.02, 0.02, TELA, { roughness: 0.25 })
  tela.position.z = 0.04
  telao.add(tela)
  const palavra: ['V' | 'A' | 'R', number][] = [['V', -0.24], ['A', 0], ['R', 0.25]]
  for (const [gl, lx] of palavra) {
    const l = letter(gl)
    l.scale.setScalar(1.8)
    l.position.set(lx, 0.01, 0.06)
    telao.add(l)
  }
  // termômetro redondo ao lado do telão
  const termo = new THREE.Group()
  termo.position.set(0.8, -0.02, 0)
  const aroT = cylinder(0.21, 0.21, 0.07, PINHO_ESC, { roughness: 0.6 }, 40)
  aroT.rotation.x = Math.PI / 2
  termo.add(aroT)
  const mostrador = cylinder(0.175, 0.175, 0.02, '#f6f1e6', { roughness: 0.4 }, 40)
  mostrador.rotation.x = Math.PI / 2
  mostrador.position.z = 0.04
  termo.add(mostrador)
  const faixaFria = new THREE.Mesh(
    new THREE.RingGeometry(0.115, 0.155, 32, 1, 0.55, 3.2),
    mat('#9db9cf', { roughness: 0.5 }),
  )
  faixaFria.position.z = 0.052
  termo.add(faixaFria)
  const faixaQuente = new THREE.Mesh(
    new THREE.RingGeometry(0.115, 0.155, 24, 1, -0.6, 1.15),
    mat(QUENTE, { roughness: 0.4 }),
  )
  faixaQuente.position.z = 0.053
  termo.add(faixaQuente)
  for (let i = 0; i <= 8; i++) {
    const a = -0.6 + (i / 8) * (3.75 + 0.6)
    const tick = rbox(0.008, 0.03, 0.006, 0.002, '#2a2a2a', { roughness: 0.5 })
    tick.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.055)
    tick.rotation.z = a - Math.PI / 2
    termo.add(tick)
  }
  telao.add(termo)
  // suporte de parede
  const suporte = rbox(0.18, 0.12, 0.06, 0.02, '#3a3d44', { roughness: 0.4, metalness: 0.6 })
  suporte.position.z = -0.06
  telao.add(suporte)
  root.add(telao)

  const ponteiro = new THREE.Group()
  ponteiro.position.set(TELAO[0] + 0.8, TELAO[1] - 0.02, TELAO[2] + 0.065)
  ponteiro.rotation.z = PONTEIRO_QUENTE
  const agulha = rbox(0.018, 0.14, 0.008, 0.004, '#1c1c1c', { roughness: 0.4 })
  agulha.position.y = 0.06
  ponteiro.add(agulha)
  const eixo = cylinder(0.022, 0.022, 0.015, '#b39445', { roughness: 0.3, metalness: 0.8 }, 20)
  eixo.rotation.x = Math.PI / 2
  ponteiro.add(eixo)
  root.add(ponteiro)

  // ---- hera murcha pendendo da floreira -------------------------------------
  const hera = new THREE.Group()
  hera.position.set(...HERA_POS)
  for (const [hx, len, s] of [[-0.18, 0.6, 1], [-0.06, 0.82, 2], [0.07, 0.66, 3], [0.18, 0.45, 4]] as const) {
    const r = strand(len, 200 + s)
    r.position.x = hx
    hera.add(r)
  }
  root.add(hera)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sauna', object: base },
    { name: 'paredes', group: 'sauna', object: paredes },
    { name: 'banco', group: 'banco', object: banco },
    { name: 'aquecedor', group: 'banco', object: aquecedor },
    { name: 'galinha', group: 'galinha', object: galinha },
    { name: 'cabeca', group: 'galinha', object: cabeca },
    { name: 'vapor', group: 'foor', object: vapor },
    { name: 'sopro', group: 'foor', object: sopro },
    { name: 'telao', group: 'var', object: telao },
    { name: 'ponteiro', group: 'var', object: ponteiro },
    { name: 'cuia', group: 'mate', object: cuia },
    { name: 'fervura', group: 'mate', object: fervura },
    { name: 'hera', group: 'har', object: hera },
    { name: 'suor', group: 'har', object: suor },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Primeira vez numa bastu sueca: sobem o piso de ripas e as paredes de pinho cor de mel…',
    }),
    seq('paredes-rise', 'paredes', 0.2, 0.9, [riseFrom(FY, 3.2)], { ease: 'easeOut' }),
    seq('hera-brota', 'hera', 0.9, 0.6, [ch('scale.y', 0.01, 0.6), ch('rotation.x', -0.7, -0.7)], { ease: 'easeOut' }),

    seq('banco-rise', 'banco', 1.7, 0.8, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: '…o banco de dois degraus e o aquecedor de pedras. Lá em cima faz noventa graus.',
    }),
    seq('aquecedor-rise', 'aquecedor', 1.9, 0.8, [riseFrom(HEATER[1], 1.1)], { ease: 'easeOut' }),

    seq('galinha-pousa', 'galinha', 3.3, 0.7, [ch('position.y', UP_Y + 1.4, UP_Y), ...grow(0.2)], {
      ease: 'easeOut',
      caption: "Sobe pro banco mais alto a GALINHA-D'ANGOLA — bicho da savana, achou que ia tirar de letra.",
    }),
    seq('cabeca-sai', 'cabeca', 3.6, 0.5, grow(), { ease: 'easeOut' }),
    seq('galinha-amassa', 'galinha', 4.0, 0.2, [ch('scale.y', 1, 0.9)], { ease: 'easeOut' }),
    seq('galinha-volta', 'galinha', 4.2, 0.3, [ch('scale.y', 0.9, 1)], { ease: 'easeOut' }),

    seq('vapor-sobe', 'vapor', 5.0, 0.9, [riseFrom(FY + 0.95, 0.6), ...grow()], {
      ease: 'easeOut',
      caption: 'Uma concha d\'água nas pedras, o bafo sobe… e ela sopra pelo bico: DÊ É… FÖÖÖR!',
    }),
    seq('sopro-sai', 'sopro', 5.6, 0.6, grow(), { ease: 'easeOut' }),

    seq('telao-liga', 'telao', 7.0, 0.6, grow(), {
      ease: 'easeOut',
      caption: 'Na parede, nessa sauna tem VAR: o telão revisa o termômetro em câmera lenta…',
    }),
    seq('ponteiro-sai', 'ponteiro', 7.3, 0.3, grow(), { ease: 'easeOut' }),
    seq('ponteiro-sobe', 'ponteiro', 7.7, 1.1, [ch('rotation.z', PONTEIRO_FRIO, PONTEIRO_QUENTE)], { ease: 'easeInOut' }),

    seq('cuia-sai', 'cuia', 9.0, 0.6, [ch('scale.x', 0.01, 1.25), ch('scale.y', 0.01, 1.25), ch('scale.z', 0.01, 1.25)], {
      ease: 'easeOut',
      caption: "…e o chimarrão ferve tanto que o MATE evapora até sobrar só M e T: VAR… M'T!",
    }),
    seq('fervura-sobe', 'fervura', 9.4, 0.8, [riseFrom(UP_Y + 0.5, 0.4), ...grow()], { ease: 'easeOut' }),

    seq('hera-murcha', 'hera', 10.6, 1.0, [ch('scale.y', 0.6, 1), ch('rotation.x', -0.7, 0)], {
      ease: 'easeInOut',
      caption: 'A HERA da parede murcha — RRÉR — e as bolinhas das penas começam a escorrer.',
    }),
    seq('suor-voa', 'suor', 10.9, 0.6, grow(), { ease: 'easeOut' }),
    seq('cabeca-cai', 'cabeca', 11.6, 0.6, [ch('rotation.x', -0.1, 0.12)], {
      ease: 'easeInOut',
      caption: 'Det är för varmt här. — Está quente demais aqui.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.38, 3.9], target: [0.1, 1.68, -0.75] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-for-varmt-har',
    contexto:
      "Conversa: na bastu (sauna), no escritório com o aquecimento no talo, no ônibus ou trem lotado no verão, no apartamento com o element (aquecedor) que não desliga. Os suecos começam a reclamar do calor assim que passa de 25 graus — e dentro de casa é comum emendar 'här inne' (aqui dentro).",
    fraseFonte: 'Está quente demais aqui.',
    fraseAlvo: 'Det är för varmt här.',
    pronuncia: 
      "dê é FÖÖR VÁRMT rrér ('det är' = dê é, o T de 'det' mudo e o R de 'är' quase sumindo; 'för' aqui é 'demais' e leva FORÇA: Ö de bico, lábios de Ô com língua de Ê, um pouco esticado, e o R num toque leve antes do V; 'varmt' numa sílaba só: A curto e aberto, R brando, M de lábios fechados e T seco — o T é obrigatório depois de 'det är' (sem ele sobra 'varm'); 'här' = rrér, h soprado leve de RR carioca, É aberto e R brando)",
    ponteSonora: 
      "DÊ É... FÖÖR! VAR-M(a)T(e)... RRÉR! (5 batidas: dê-é-FÖÖR-VÁRMT-RRÉR; força no FÖÖR, no VÁRMT e no RRÉR; DÊ É = o 'det är' de sempre, de 'Det är kallt i lägenheten' e 'Det är för dyrt': Ê fechado e sem T, É aberto e curto; FÖÖR = o sopro de BICO, o MESMO FÖ de 'Ett bord för två', 'Tack för hjälpen' e 'Det är för dyrt' — aqui é o bico da galinha soprando o bafo da sauna: lábios de Ô com língua de Ê, nunca o FÔ de bochecha estufada de 'få'; mas este 'för' é o 'demais' e leva FORÇA, então sai mais esticado e com o R aparecendo num toque leve antes do V; VAR = o VAR do futebol, do jeito que todo brasileiro fala: A aberto e R BRANDO de um toque no fim (nunca o 'váh' aspirado) — não é a VARA de 'var' (onde): aqui é o telão; M(a)T(e) = o MATE da cuia, mas o calor evapora as vogais e só sobram o M e o T, grudados no VAR: VÁRMT, UMA sílaba só — M de lábios fechados e T seco, sem 'tchi'; esse T é o do neutro, OBRIGATÓRIO depois de 'det är', o MESMO T do CÁLT de 'Det är kallt i lägenheten' (sem ele sobra 'varm'); não confunda com o eletricista de 'Det är för dyrt': mesmo DÊ É FÖ, mas lá ele fica DURO, aqui é VAR + MATE; RRÉR = a HERA sem o -a, com o h soprado leve de RR carioca, o MESMO RRÉR de 'Det gör ont här' e 'Är det ledigt här?': É aberto e R brando)",
    historia: 
      "Primeira vez numa bastu sueca, e a GALINHA-D'ANGOLA — bicho da savana, achou que ia tirar de letra — sobe pro banco mais alto, onde faz noventa graus. Alguém joga uma concha d'água nas pedras, o bafo sobe, e ela sopra pelo bico: FÖÖÖR! Na parede, um telão de futebol — nessa sauna tem VAR — revisa o termômetro em câmera lenta, e o chimarrão que ela trouxe ferve tanto que o MATE evapora até sobrar só M e T: VAR... M'T! A HERA pendurada na madeira murcha, as bolinhas brancas das penas começam a escorrer, e ela solta o 'tô fraca, tô fraca' de sempre: está quente demais aqui.",
  },
  createScene,
  refine: { organic: ['galinha', 'cabeca'] },
}

export default card
