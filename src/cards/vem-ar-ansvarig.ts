import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Vem är ansvarig?" — VÉMMM?! É... ÁNNN-S-VÁRIG?!
 *
 * O chacal volta pra toca com o melhor osso da semana atravessado na boca e
 * encontra um avião da VARIG estacionado em cima dela, com a roda do nariz
 * enfiada no buraco. De boca fechada no osso, o "VEM!" sai VÉMMM?!; no É a
 * bocarra escancara e o osso despenca; ele chora ÁNNN-S! e só então lê na
 * fuselagem: VARIG. ÁN-S-VARIG = ansvarig, o responsável.
 *
 * Diorama: disco de areia com ondulações e dunas, toca com os ossos do
 * chacal, avião de brinquedo branco-e-marinho à direita (nariz apontado pro
 * chacal, lado do letreiro virado pra câmera), chacal dourado à esquerda.
 */

const AREIA = '#ecc690'
const AREIA_ESC = '#d8a76b'
const AREIA_LADO = '#c08c55'
const BURACO = '#24160d'
const CHACAL = '#c27b3b'
const CHACAL_ESC = '#a8622c'
const CHACAL_CLARO = '#efd8b4'
const MANTO = '#3a3532'
const FOCINHO = '#1d1918'
const BOCA = '#5e2328'
const LINGUA = '#d8707c'
const ORELHA_DENTRO = '#e8b49c'
const OSSO = '#f4eddc'
const BRANCO = '#f4f4f0'
const CINZA = '#d3d7dc'
const MARINHO = '#1e2d5c'
const AZUL = '#1556e0' // acento reservado: o letreiro VARIG
const VIDRO = '#17212d'
const PNEU = '#232326'
const METAL = '#b9c0c8'
const LAGRIMA = '#aee0f7'

const GY = 0.14 // topo da areia

// ---- avião: origem no trem principal, no chão; nariz para -x local ---------
const AX = 0.92 // altura do eixo da fuselagem
const NOSE = 1.45 // do trem principal até a ponta do nariz
const YAW = 0.4 // nariz para a frente-esquerda, letreiro virado pra câmera
const PITCH = 0.09 // nariz afundado (roda dentro da toca)
const AV_X = 1.8
const AV_Z = -0.5
const AV_S = 0.92 // escala do avião
const TREM_X = -0.9 // trem do nariz, em x local do avião

// perfil da fuselagem [raio, s] — s = distância a partir da ponta do nariz
const FUS: [number, number][] = [
  [0, 0], [0.17, 0.025], [0.3, 0.09], [0.4, 0.19], [0.47, 0.32], [0.51, 0.47],
  [0.525, 0.62], [0.525, 1.78], [0.51, 1.98], [0.45, 2.2], [0.35, 2.4],
  [0.22, 2.54], [0, 2.6],
]

function fusR(s: number) {
  for (let i = 0; i < FUS.length - 1; i++) {
    const [r0, s0] = FUS[i]
    const [r1, s1] = FUS[i + 1]
    if (s >= s0 && s <= s1) return r0 + ((r1 - r0) * (s - s0)) / (s1 - s0)
  }
  return 0
}

/**
 * Assenta um objeto plano na pele da fuselagem: s ao longo do eixo, phi =
 * elevação a partir do lado +z (0 = lado, π/2 = topo). O +z do objeto vira a
 * normal da superfície (inclinada pra frente no cone do nariz).
 */
function onHull(obj: THREE.Object3D, s: number, phi: number, lift = 0.004) {
  const r = fusR(s) + lift
  const slope = (fusR(s + 0.02) - fusR(s - 0.02)) / 0.04
  obj.position.set(-NOSE + s, AX + r * Math.sin(phi), r * Math.cos(phi))
  obj.rotation.set(-phi, -Math.atan(slope), 0)
}

/** Faixa curva colada na fuselagem (trecho cilíndrico), de phi0 a phi1. */
function hullBand(s0: number, s1: number, phi0: number, phi1: number, side: 1 | -1, color: string) {
  const len = s1 - s0
  const start = side > 0 ? -phi1 : Math.PI + phi0
  const geo = new THREE.CylinderGeometry(0.531, 0.531, len, 24, 1, true, start, phi1 - phi0)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.3, size: len }))
  m.rotation.z = -Math.PI / 2
  m.position.set(-NOSE + s0 + len / 2, AX, 0)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Placa de contorno arbitrário com bordas arredondadas (asas, leme). */
function slab(points: [number, number][], thick: number, color: string, opts = {}) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const bevel = thick * 0.45
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 4,
  })
  geo.translate(0, 0, -thick / 2)
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.3, size: 1, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** V A R I G — letras de traço grosso, centradas na origem, altura 0.24. */
function letra(c: 'V' | 'A' | 'R' | 'I' | 'G') {
  const g = new THREE.Group()
  const t = 0.05
  const hh = 0.12
  const s = (w: number, h: number, x: number, y: number, rot = 0) => {
    const m = rbox(w, h, 0.035, 0.012, AZUL, { roughness: 0.3 })
    m.position.set(x, y, 0)
    m.rotation.z = rot
    g.add(m)
  }
  if (c === 'V') {
    s(t, 0.251, -0.0485, 0, 0.295)
    s(t, 0.251, 0.0485, 0, -0.295)
  } else if (c === 'A') {
    s(t, 0.251, -0.0485, 0, -0.295)
    s(t, 0.251, 0.0485, 0, 0.295)
    s(0.1, 0.042, 0, -0.035)
  } else if (c === 'R') {
    s(t, 0.24, -0.055, 0)
    s(0.1, 0.045, -0.01, hh - 0.0225)
    s(0.1, 0.045, -0.01, 0)
    s(t, 0.14, 0.045, 0.06)
    s(t, 0.14, 0.03, -0.06, 0.5)
  } else if (c === 'I') {
    s(t, 0.24, 0, 0)
  } else {
    s(t, 0.24, -0.055, 0)
    s(0.13, 0.045, 0.005, hh - 0.0225)
    s(0.13, 0.045, 0.005, -hh + 0.0225)
    s(t, 0.13, 0.055, -0.055)
    s(0.065, 0.042, 0.03, 0)
  }
  return g
}

/** Osso de desenho: haste + quatro bolotas. Eixo ao longo de x. */
function osso(len: number) {
  const g = new THREE.Group()
  const r = len * 0.085
  const haste = capsule(r, len * 0.62, OSSO, { roughness: 0.55 })
  haste.rotation.z = Math.PI / 2
  g.add(haste)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const bola = sphere(r * 1.45, OSSO, { roughness: 0.55 })
      bola.position.set(sx * len * 0.4, 0, sz * r * 1.0)
      g.add(bola)
    }
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // posição do trem do nariz no mundo (a toca fica embaixo dele)
  const tremMundo = new THREE.Vector3(TREM_X * AV_S, 0, 0)
    .applyEuler(new THREE.Euler(0, YAW, PITCH))
    .add(new THREE.Vector3(AV_X, GY, AV_Z))
  const DX = tremMundo.x
  const DZ = tremMundo.z

  // ---- dunas: disco de areia ------------------------------------------------
  const dunas = new THREE.Group()

  const disco = cylinder(2.85, 2.95, 0.12, AREIA_LADO, { roughness: 0.95 })
  disco.position.y = 0.06
  dunas.add(disco)

  const topo = cylinder(2.82, 2.85, 0.03, AREIA, { roughness: 0.95 })
  topo.position.y = GY - 0.015
  dunas.add(topo)

  // montes de areia baixos nas bordas
  for (const [x, z, sx, sy, sz, ry] of [
    [-1.75, -1.55, 1.25, 0.3, 0.75, 0.5],
    [0.3, -2.05, 0.95, 0.2, 0.55, -0.2],
  ] as const) {
    const monte = sphere(1, AREIA, { roughness: 0.95 })
    monte.scale.set(sx, sy, sz)
    monte.position.set(x, GY - 0.03, z)
    monte.rotation.y = ry
    dunas.add(monte)
  }

  // ondulações do vento: arcos baixos na areia
  for (const [x, z, r, arc, ang] of [
    [-0.9, 1.3, 1.6, 0.9, 0.5],
    [-0.6, 1.75, 1.8, 0.8, 0.6],
    [0.9, 1.95, 1.5, 0.7, 1.4],
    [-2.0, 0.2, 1.2, 0.7, -0.3],
    [1.2, -1.6, 1.4, 0.8, 2.6],
  ] as const) {
    const onda = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.025, 6, 40, arc),
      mat(AREIA_ESC, { roughness: 0.95, size: r }),
    )
    onda.receiveShadow = true
    onda.scale.z = 0.4
    onda.rotation.set(-Math.PI / 2, 0, ang)
    onda.position.set(x - r * Math.cos(ang + arc / 2), GY, z + r * Math.sin(ang + arc / 2))
    dunas.add(onda)
  }

  // pedrinhas e um arbusto seco
  for (const [x, z, r] of [[-2.3, -0.6, 0.09], [2.3, 0.9, 0.08], [-0.4, -1.4, 0.06], [1.9, -1.55, 0.1]] as const) {
    const pedra = rock(r, '#a9825c', Math.round(x * 10 + z), { roughness: 0.9 })
    pedra.position.set(x, GY + r * 0.35, z)
    pedra.rotation.y = rand() * Math.PI
    dunas.add(pedra)
  }
  const arbusto = puff(0.16, '#9a8a55', 6, 12, { roughness: 0.95 })
  arbusto.scale.set(1, 0.7, 1)
  arbusto.position.set(-1.05, GY + 0.08, -1.75)
  // tufos de capim seco
  for (const [x, z] of [[-2.25, -0.25], [2.35, 0.55], [-0.15, -1.7], [1.3, 1.35]] as const) {
    for (let k = 0; k < 6; k++) {
      const folha = cone(0.022, 0.2 + rand() * 0.12, '#b39a5a', { roughness: 0.9 }, 6)
      const a = (k / 6) * Math.PI * 2
      folha.position.set(x + Math.cos(a) * 0.03, GY + 0.1, z + Math.sin(a) * 0.03)
      folha.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45)
      dunas.add(folha)
    }
  }
  dunas.add(arbusto)
  for (let i = 0; i < 4; i++) {
    const galho = cylinder(0.008, 0.012, 0.3, '#7d6640', { roughness: 0.9 }, 6)
    galho.position.set(-1.05 + (rand() - 0.5) * 0.2, GY + 0.2, -1.75 + (rand() - 0.5) * 0.2)
    galho.rotation.set((rand() - 0.5) * 0.9, 0, (rand() - 0.5) * 0.9)
    dunas.add(galho)
  }

  // pegadas do chacal chegando pela esquerda
  for (let i = 0; i < 4; i++) {
    for (const side of [-1, 1]) {
      const pegada = sphere(0.035, AREIA_ESC, { roughness: 0.95 })
      pegada.scale.set(1, 0.18, 1.3)
      pegada.position.set(-2.62 + i * 0.2, GY, 0.55 - i * 0.05 + side * 0.07 + (i % 2) * 0.03)
      dunas.add(pegada)
    }
  }

  root.add(dunas)

  // ---- toca: buraco escuro com borda de areia amassada -----------------------
  const toca = new THREE.Group()
  toca.position.set(DX, 0, DZ)

  // cratera: borda de areia amassada subindo em volta de um poço escuro
  const cratera = lathe(
    [[0.74, GY - 0.01], [0.62, GY + 0.03], [0.48, GY + 0.1], [0.37, GY + 0.13], [0.31, GY + 0.06], [0.3, GY - 0.12]],
    AREIA_ESC,
    { roughness: 0.95 },
    40,
  )
  toca.add(cratera)
  const poco = cylinder(0.31, 0.31, 0.2, BURACO, { roughness: 1 })
  poco.position.y = GY - 0.08
  toca.add(poco)

  // monte de areia escavada atrás do buraco
  const monteToca = sphere(0.5, AREIA, { roughness: 0.95 })
  monteToca.scale.set(1.15, 0.5, 0.7)
  monteToca.position.set(-0.3, GY - 0.05, -0.62)
  toca.add(monteToca)
  for (let i = 0; i < 6; i++) {
    const torrao = sphere(0.05 + rand() * 0.03, AREIA_ESC, { roughness: 0.95 })
    const a = -0.3 + i * 0.5 + rand() * 0.2
    torrao.position.set(Math.cos(a) * 0.62, GY + 0.04, Math.sin(a) * 0.6)
    torrao.scale.y = 0.6
    toca.add(torrao)
  }
  root.add(toca)

  // ---- três ossos espalhados em volta da toca --------------------------------
  const ossos = new THREE.Group()
  ossos.position.set(DX, GY + 0.03, DZ)
  for (const [x, z, ry] of [[0.55, 0.42, 0.6], [-0.5, 0.5, -0.4], [0.62, -0.35, 1.9]] as const) {
    const o = osso(0.26)
    o.position.set(x, 0, z)
    o.rotation.y = ry
    ossos.add(o)
  }
  root.add(ossos)

  // ---- avião ----------------------------------------------------------------
  const aviao = new THREE.Group()
  aviao.position.set(AV_X, GY, AV_Z)
  aviao.rotation.set(0, YAW, PITCH)
  aviao.scale.setScalar(AV_S)

  const fuselagem = lathe(FUS, BRANCO, { roughness: 0.28 }, 48)
  fuselagem.rotation.z = -Math.PI / 2
  fuselagem.position.set(-NOSE, AX, 0)
  aviao.add(fuselagem)

  // faixa azul-marinho (cheatline) dos dois lados, abaixo das janelas
  for (const side of [1, -1] as const) {
    aviao.add(hullBand(0.6, 1.8, -0.3, -0.13, side, MARINHO))
  }
  // barriga cinza
  aviao.add(hullBand(0.62, 1.78, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55, 1, CINZA))

  // janelinhas dos passageiros
  for (let s = 0.95; s <= 1.76; s += 0.115) {
    for (const phi of [-0.02, Math.PI + 0.02]) {
      const janela = rbox(0.06, 0.08, 0.03, 0.022, VIDRO, { roughness: 0.15 })
      onHull(janela, s, phi)
      aviao.add(janela)
    }
  }

  // para-brisa da cabine: faixa escura que abraça o nariz, com montantes brancos
  const vidroPts: THREE.Vector2[] = []
  for (let s = 0.17; s <= 0.335; s += 0.0165) vidroPts.push(new THREE.Vector2(fusR(s) + 0.006, s))
  const PHI_A = 0.62
  const PHI_B = Math.PI - 0.62
  const parabrisa = new THREE.Mesh(
    new THREE.LatheGeometry(vidroPts, 32, -PHI_B, PHI_B - PHI_A),
    mat(VIDRO, { roughness: 0.12, size: 0.5 }),
  )
  parabrisa.rotation.z = -Math.PI / 2
  parabrisa.position.set(-NOSE, AX, 0)
  aviao.add(parabrisa)
  for (const phi of [1.08, Math.PI / 2, Math.PI - 1.08]) {
    const montante = rbox(0.2, 0.03, 0.02, 0.008, BRANCO, { roughness: 0.3 })
    onHull(montante, 0.25, phi, 0.006)
    aviao.add(montante)
  }

  // porta dianteira: contorno fino cinza com janelinha redonda
  const porta = new THREE.Group()
  onHull(porta, 0.58, -0.02, 0.0)
  for (const [w, h, x, y] of [[0.15, 0.016, 0, 0.13], [0.15, 0.016, 0, -0.13], [0.016, 0.27, -0.075, 0], [0.016, 0.27, 0.075, 0]] as const) {
    const fresta = rbox(w, h, 0.012, 0.006, '#aab1ba', { roughness: 0.4 })
    fresta.position.set(x, y, 0)
    porta.add(fresta)
  }
  const vigia = cylinder(0.026, 0.026, 0.014, VIDRO, { roughness: 0.15 })
  vigia.rotation.x = Math.PI / 2
  vigia.position.y = 0.06
  porta.add(vigia)
  aviao.add(porta)

  // asas baixas, enflechadas
  for (const side of [1, -1]) {
    const asa = new THREE.Group()
    asa.position.y = AX - 0.33
    asa.rotation.x = -side * 0.07
    const pts: [number, number][] = [[-0.32, 0.3], [0.36, 0.3], [0.52, 1.2], [0.22, 1.2]]
    const plano = slab(pts.map(([x, z]) => [x, -side * z] as [number, number]), 0.05, BRANCO)
    plano.rotation.x = -Math.PI / 2
    asa.add(plano)
    aviao.add(asa)

    // motor sob a asa
    const motor = new THREE.Group()
    motor.position.set(-0.27, AX - 0.57, side * 0.76)
    const nacele = lathe(
      [[0, 0], [0.13, 0], [0.155, 0.035], [0.162, 0.12], [0.15, 0.42], [0.1, 0.53], [0, 0.55]],
      CINZA,
      { roughness: 0.3 },
    )
    nacele.rotation.z = -Math.PI / 2
    motor.add(nacele)
    const entrada = cylinder(0.125, 0.125, 0.012, '#2b3038', { roughness: 0.5 })
    entrada.rotation.z = Math.PI / 2
    entrada.position.x = -0.004
    motor.add(entrada)
    const cone0 = cone(0.045, 0.07, METAL, { roughness: 0.25, metalness: 0.8 })
    cone0.rotation.z = Math.PI / 2
    cone0.position.x = -0.035
    motor.add(cone0)
    const aro = torus(0.148, 0.018, MARINHO, { roughness: 0.3 })
    aro.rotation.y = Math.PI / 2
    aro.position.x = 0.02
    motor.add(aro)
    const pilone = rbox(0.3, 0.16, 0.05, 0.02, CINZA, { roughness: 0.35 })
    pilone.position.set(0.12, 0.17, 0)
    motor.add(pilone)
    aviao.add(motor)

    // trem principal
    const roda = torus(0.095, 0.05, PNEU, { roughness: 0.8 })
    roda.position.set(0.05, 0.145, side * 0.36)
    aviao.add(roda)
    const cubo = cylinder(0.07, 0.07, 0.07, METAL, { roughness: 0.3, metalness: 0.75 })
    cubo.rotation.x = Math.PI / 2
    cubo.position.set(0.05, 0.145, side * 0.36)
    aviao.add(cubo)
    const perna = cylinder(0.03, 0.03, 0.4, METAL, { roughness: 0.3, metalness: 0.75 })
    perna.position.set(0.05, 0.35, side * 0.3)
    aviao.add(perna)

    // estabilizador horizontal
    const estab = slab(
      ([[0.72, 0.08], [1.08, 0.08], [1.16, 0.6], [0.98, 0.6]] as [number, number][]).map(
        ([x, z]) => [x, -side * z] as [number, number],
      ),
      0.035,
      BRANCO,
    )
    estab.rotation.x = -Math.PI / 2
    estab.position.y = AX + 0.12
    aviao.add(estab)
  }

  // leme vertical azul-marinho com a rosa-dos-ventos
  const leme = slab(
    [[0.38, AX + 0.4], [1.12, AX + 0.12], [1.22, AX + 1.0], [0.92, AX + 1.0]],
    0.05,
    MARINHO,
  )
  aviao.add(leme)
  for (const side of [1, -1]) {
    const disco0 = cylinder(0.12, 0.12, 0.012, BRANCO, { roughness: 0.3 })
    disco0.rotation.x = Math.PI / 2
    disco0.position.set(0.93, AX + 0.62, side * 0.05)
    aviao.add(disco0)
    // rosa-dos-ventos: dois losangos esguios cruzados = estrela de 4 pontas
    for (const rz of [0, Math.PI / 2]) {
      const raio = new THREE.Group()
      raio.position.set(0.93, AX + 0.62, side * 0.058)
      raio.rotation.z = rz
      raio.scale.set(1, 3.4, 1)
      const losango = rbox(0.045, 0.045, 0.012, 0.004, MARINHO, { roughness: 0.3 })
      losango.rotation.z = Math.PI / 4
      raio.add(losango)
      aviao.add(raio)
    }
  }
  root.add(aviao)

  // ---- trem do nariz: haste prateada e roda grossa, afundada na toca ---------
  const trem = new THREE.Group()
  trem.position.set(TREM_X, AX - 0.5, 0)
  const haste = cylinder(0.04, 0.04, 0.2, METAL, { roughness: 0.25, metalness: 0.8 })
  haste.position.y = -0.1
  trem.add(haste)
  const garfo = rbox(0.08, 0.1, 0.2, 0.02, METAL, { roughness: 0.3, metalness: 0.75 })
  garfo.position.y = -0.2
  trem.add(garfo)
  const pneu = torus(0.12, 0.065, PNEU, { roughness: 0.8 })
  pneu.position.y = -0.27
  trem.add(pneu)
  const cuboN = cylinder(0.08, 0.08, 0.1, METAL, { roughness: 0.3, metalness: 0.75 })
  cuboN.rotation.x = Math.PI / 2
  cuboN.position.y = -0.27
  trem.add(cuboN)
  aviao.add(trem)

  // ---- letreiro VARIG na fuselagem, acima das janelas ------------------------
  const letreiro = new THREE.Group()
  onHull(letreiro, 0.7, 0.42, 0.0)
  for (const [c, x] of [['V', 0.11], ['A', 0.31], ['R', 0.545], ['I', 0.685], ['G', 0.835]] as const) {
    const l = letra(c)
    l.position.set(x, 0, 0.012)
    letreiro.add(l)
  }
  aviao.add(letreiro)

  // ---- chacal (olha para +z local) --------------------------------------------
  const chacal = new THREE.Group()
  chacal.position.set(-1.12, GY, 0.5)
  chacal.rotation.y = 1.15
  chacal.scale.setScalar(1.3)

  const tronco = capsule(0.22, 0.6, CHACAL, { roughness: 0.88 })
  tronco.rotation.x = Math.PI / 2
  tronco.position.set(0, 0.7, 0)
  chacal.add(tronco)

  const peito = sphere(0.24, CHACAL, { roughness: 0.88 })
  peito.position.set(0, 0.74, 0.3)
  chacal.add(peito)

  const quadril = sphere(0.22, CHACAL, { roughness: 0.88 })
  quadril.position.set(0, 0.72, -0.3)
  chacal.add(quadril)

  const barriga = sphere(0.2, CHACAL_CLARO, { roughness: 0.9 })
  barriga.scale.set(0.95, 0.6, 1.8)
  barriga.position.set(0, 0.56, 0.05)
  chacal.add(barriga)

  const babador = sphere(0.16, CHACAL_CLARO, { roughness: 0.9 })
  babador.position.set(0, 0.78, 0.47)
  chacal.add(babador)

  const manto = sphere(0.26, MANTO, { roughness: 0.9 })
  manto.scale.set(0.95, 0.62, 1.75)
  manto.position.set(0, 0.8, -0.06)
  chacal.add(manto)

  const pescoco = capsule(0.13, 0.28, CHACAL, { roughness: 0.88 })
  pescoco.position.set(0, 0.97, 0.47)
  pescoco.rotation.x = 0.5
  chacal.add(pescoco)

  for (const side of [-1, 1]) {
    const pernaF = capsule(0.068, 0.45, CHACAL, { roughness: 0.88 })
    pernaF.position.set(side * 0.12, 0.3, 0.33)
    chacal.add(pernaF)
    const pataF = sphere(0.075, CHACAL_ESC, { roughness: 0.88 })
    pataF.scale.set(1, 0.55, 1.35)
    pataF.position.set(side * 0.12, 0.04, 0.37)
    chacal.add(pataF)

    const coxa = sphere(0.15, CHACAL, { roughness: 0.88 })
    coxa.scale.set(0.6, 1.1, 1)
    coxa.position.set(side * 0.13, 0.56, -0.32)
    chacal.add(coxa)
    const canela = capsule(0.062, 0.4, CHACAL, { roughness: 0.88 })
    canela.position.set(side * 0.13, 0.27, -0.36)
    canela.rotation.x = -0.15
    chacal.add(canela)
    const pataT = sphere(0.075, CHACAL_ESC, { roughness: 0.88 })
    pataT.scale.set(1, 0.55, 1.35)
    pataT.position.set(side * 0.13, 0.04, -0.31)
    chacal.add(pataT)
  }
  root.add(chacal)

  // ---- cabeça: focinho fino, orelhas enormes, bocarra ------------------------
  const CABECA_POS = new THREE.Vector3(0, 1.15, 0.6)
  const CAB_X0 = 0.1 // cabeça nivelada, carregando o osso
  const CAB_X = -0.35 // pose final: erguida, no choro

  const cabeca = new THREE.Group()
  cabeca.position.copy(CABECA_POS)
  cabeca.rotation.x = CAB_X
  chacal.add(cabeca)

  const cranio = sphere(0.19, CHACAL, { roughness: 0.88 })
  cranio.scale.set(1, 0.95, 1.05)
  cabeca.add(cranio)

  const bochecha = sphere(0.13, CHACAL_CLARO, { roughness: 0.9 })
  bochecha.scale.set(1.1, 0.7, 1)
  bochecha.position.set(0, -0.07, 0.1)
  cabeca.add(bochecha)

  const focinho = sphere(0.11, CHACAL, { roughness: 0.88 })
  focinho.scale.set(0.72, 0.6, 2.0)
  focinho.position.set(0, -0.02, 0.25)
  cabeca.add(focinho)

  const labio = sphere(0.1, CHACAL_CLARO, { roughness: 0.9 })
  labio.scale.set(0.68, 0.38, 1.9)
  labio.position.set(0, -0.06, 0.25)
  cabeca.add(labio)

  const ceu = sphere(0.09, BOCA, { roughness: 0.6 })
  ceu.scale.set(0.75, 0.5, 1.7)
  ceu.position.set(0, -0.095, 0.2)
  cabeca.add(ceu)

  const nariz = sphere(0.045, FOCINHO, { roughness: 0.3 })
  nariz.scale.set(1.1, 0.85, 1)
  nariz.position.set(0, 0.0, 0.47)
  cabeca.add(nariz)

  for (const side of [-1, 1]) {
    const presa = cone(0.017, 0.06, '#fbf8ef', { roughness: 0.3 })
    presa.rotation.x = Math.PI
    presa.position.set(side * 0.045, -0.13, 0.36)
    cabeca.add(presa)

    // olhos tristes olhando pra cima
    const n = new THREE.Vector3(side * 0.5, 0.3, 0.8).normalize()
    const olhoPos = n.clone().multiply(new THREE.Vector3(0.19, 0.18, 0.2))
    const esclera = sphere(0.052, '#ffffff', { roughness: 0.25 })
    esclera.position.copy(olhoPos)
    esclera.scale.setScalar(1)
    cabeca.add(esclera)
    const pupila = sphere(0.028, '#1a1a1a', { roughness: 0.2 })
    pupila.position.copy(olhoPos).addScaledVector(n, 0.036).add(new THREE.Vector3(0, 0.014, 0))
    cabeca.add(pupila)
    const brilho = sphere(0.009, '#ffffff', { roughness: 0.1 })
    brilho.position.copy(pupila.position).addScaledVector(n, 0.024).add(new THREE.Vector3(side * -0.008, 0.01, 0))
    cabeca.add(brilho)

    const sobrancelha = capsule(0.016, 0.07, MANTO, { roughness: 0.9 })
    sobrancelha.position.copy(olhoPos).add(new THREE.Vector3(-side * 0.005, 0.068, 0.0))
    sobrancelha.rotation.set(-0.3, 0, Math.PI / 2 - side * 0.45)
    cabeca.add(sobrancelha)

    // orelha enorme e pontuda
    const orelha = new THREE.Group()
    orelha.position.set(side * 0.1, 0.27, -0.03)
    orelha.rotation.set(-0.12, 0, -side * 0.32)
    const fora = cone(0.1, 0.4, CHACAL_ESC, { roughness: 0.88 })
    orelha.add(fora)
    const dentro = cone(0.068, 0.3, ORELHA_DENTRO, { roughness: 0.9 })
    dentro.position.set(0, -0.03, 0.04)
    orelha.add(dentro)
    cabeca.add(orelha)
  }

  // ---- mandíbula (dobradiça no fundo da boca) --------------------------------
  const JAW_OPEN = 0.72
  const mandibula = new THREE.Group()
  mandibula.position.set(0, -0.1, 0.06)
  mandibula.rotation.x = JAW_OPEN
  cabeca.add(mandibula)

  const queixo = sphere(0.09, CHACAL, { roughness: 0.88 })
  queixo.scale.set(0.68, 0.42, 1.95)
  queixo.position.set(0, -0.025, 0.17)
  mandibula.add(queixo)
  const queixoClaro = sphere(0.08, CHACAL_CLARO, { roughness: 0.9 })
  queixoClaro.scale.set(0.66, 0.35, 1.8)
  queixoClaro.position.set(0, -0.045, 0.15)
  mandibula.add(queixoClaro)
  const lingua = sphere(0.06, LINGUA, { roughness: 0.4 })
  lingua.scale.set(0.85, 0.35, 1.9)
  lingua.position.set(0, 0.012, 0.16)
  mandibula.add(lingua)
  for (const side of [-1, 1]) {
    const presa = cone(0.015, 0.05, '#fbf8ef', { roughness: 0.3 })
    presa.position.set(side * 0.04, 0.03, 0.29)
    mandibula.add(presa)
  }

  // ---- lágrimas jorrando dos olhos -------------------------------------------
  const lagrimas = new THREE.Group()
  cabeca.add(lagrimas)
  for (const side of [-1, 1]) {
    const n = new THREE.Vector3(side * 0.5, 0.3, 0.8).normalize()
    const olho = n.clone().multiply(new THREE.Vector3(0.19, 0.18, 0.2))
    // filete escorrendo pela bochecha, saindo da pálpebra de baixo
    const filete = capsule(0.022, 0.13, LAGRIMA, { roughness: 0.08 })
    filete.position.copy(olho).add(new THREE.Vector3(side * 0.04, -0.11, -0.015))
    filete.rotation.z = side * 0.2
    lagrimas.add(filete)
    // gotas pingando do queixo (caem na vertical do mundo: a cabeça está erguida)
    for (const [dx, dy, dz, r] of [[0.07, -0.25, -0.09, 0.03], [0.09, -0.39, -0.14, 0.036]] as const) {
      const gota = sphere(r, LAGRIMA, { roughness: 0.08 })
      gota.scale.set(1, 1.35, 1)
      gota.position.copy(olho).add(new THREE.Vector3(side * dx, dy, dz))
      lagrimas.add(gota)
    }
  }

  // ---- rabo peludo de ponta preta --------------------------------------------
  const RABO_X = -1.05
  const rabo = new THREE.Group()
  rabo.position.set(0, 0.74, -0.48)
  rabo.rotation.x = RABO_X
  chacal.add(rabo)
  const rabo1 = sphere(0.075, CHACAL, { roughness: 0.9 })
  rabo1.scale.set(0.9, 0.9, 2.2)
  rabo1.position.z = -0.14
  rabo.add(rabo1)
  const rabo2 = sphere(0.105, CHACAL, { roughness: 0.9 })
  rabo2.scale.set(1, 1, 2.0)
  rabo2.position.z = -0.34
  rabo.add(rabo2)
  const ponta = sphere(0.08, MANTO, { roughness: 0.9 })
  ponta.scale.set(0.95, 0.95, 1.6)
  ponta.position.z = -0.55
  rabo.add(ponta)

  // ---- o osso da semana: na boca, depois despencando -------------------------
  const BOCA_POS = new THREE.Vector3(0, -0.1, 0.27)
    .applyAxisAngle(new THREE.Vector3(1, 0, 0), CAB_X0)
    .add(CABECA_POS)
  const OSSO_FIM = new THREE.Vector3(0.03, 0.72, 1.06)
  const OSSO_ROT = new THREE.Euler(0.35, 0.9, 0.55)

  const ossoCai = osso(0.4)
  ossoCai.position.copy(OSSO_FIM)
  ossoCai.rotation.copy(OSSO_ROT)
  chacal.add(ossoCai)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'dunas', group: 'deserto', object: dunas },
    { name: 'toca', group: 'deserto', object: toca },
    { name: 'ossos', group: 'deserto', object: ossos },
    { name: 'chacal', group: 'chacal', object: chacal },
    { name: 'cabeca', group: 'chacal', object: cabeca },
    { name: 'mandibula', group: 'chacal', object: mandibula },
    { name: 'rabo', group: 'chacal', object: rabo },
    { name: 'osso', group: 'chacal', object: ossoCai },
    { name: 'aviao', group: 'aviao', object: aviao },
    { name: 'trem', group: 'aviao', object: trem },
    { name: 'lagrimas', group: 'choro', object: lagrimas },
    { name: 'letreiro', group: 'varig', object: letreiro },
  ]

  const grow = (from = 0.01) => [
    ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1),
  ]

  // ---- montagem ------------------------------------------------------------
  const dirCauda = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), YAW)
  const build = [
    seq('dunas-sobem', 'dunas', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'No deserto, as dunas sobem do chão — e no meio delas, a toca do chacal.',
    }),
    seq('toca-abre', 'toca', 0.4, 0.7, [riseFrom(0, 0.5)], { ease: 'easeOut' }),
    seq('ossos-aparecem', 'ossos', 0.75, 0.6, grow(), { ease: 'easeOut' }),

    seq('chacal-sobe', 'chacal', 1.9, 0.9, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'Depois de um dia inteiro garimpando, o chacal volta pra casa com o melhor osso da semana atravessado na boca.',
    }),
    seq('cabeca-sobe', 'cabeca', 1.9, 0.9, [ch('rotation.x', 0.3, CAB_X0)], { ease: 'easeOut' }),
    seq('mandibula-morde', 'mandibula', 1.9, 0.9, [ch('rotation.x', 0.3, 0)], { ease: 'easeOut' }),
    seq('osso-na-boca', 'osso', 2.6, 0.35, grow(), { ease: 'easeOut' }),
    seq('rabo-abana', 'rabo', 2.1, 0.45, [ch('rotation.y', -0.4, 0.4), ch('rotation.x', 0.2, 0.5)]),
    seq('rabo-abana2', 'rabo', 2.55, 0.45, [ch('rotation.y', 0.4, 0)]),

    seq(
      'aviao-pousa',
      'aviao',
      3.7,
      1.4,
      [
        ch('position.x', AV_X + dirCauda.x * 1.8, AV_X),
        ch('position.y', GY + 2.2, GY),
        ch('position.z', AV_Z + dirCauda.z * 1.8, AV_Z),
        ch('rotation.z', -0.14, 0),
      ],
      {
        ease: 'easeOut',
        caption: '…mas um AVIÃO pousa e estaciona bem em cima da toca dele!',
      },
    ),
    seq('trem-baixa', 'trem', 3.9, 0.6, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),
    seq('aviao-afunda', 'aviao', 5.4, 0.35, [ch('rotation.z', 0, PITCH)], {
      ease: 'easeIn',
      caption: 'CRAC! A roda do nariz afunda direto no buraco dele.',
    }),

    seq('chacal-pula', 'chacal', 6.5, 0.22, [ch('position.y', GY, GY + 0.16)], {
      ease: 'easeOut',
      caption: 'Ele exige que o culpado apareça — VEM! —, mas com o osso nos dentes só sai VÉMMM?!',
    }),
    seq('chacal-bate', 'chacal', 6.72, 0.22, [ch('position.y', GY + 0.16, GY)], { ease: 'easeIn' }),
    seq('chacal-pula2', 'chacal', 7.05, 0.2, [ch('position.y', GY, GY + 0.12)], { ease: 'easeOut' }),
    seq('chacal-bate2', 'chacal', 7.25, 0.2, [ch('position.y', GY + 0.12, GY)], { ease: 'easeIn' }),

    seq('boca-escancara', 'mandibula', 8.3, 0.3, [ch('rotation.x', 0, JAW_OPEN)], {
      ease: 'easeOut',
      caption: 'No É a bocarra escancara… e o osso despenca!',
    }),
    seq('cabeca-ergue', 'cabeca', 8.3, 0.4, [ch('rotation.x', CAB_X0, CAB_X)], { ease: 'easeOut' }),
    seq(
      'osso-cai',
      'osso',
      8.4,
      0.55,
      [
        ch('position.x', BOCA_POS.x, OSSO_FIM.x),
        ch('position.y', BOCA_POS.y, OSSO_FIM.y),
        ch('position.z', BOCA_POS.z, OSSO_FIM.z),
        ch('rotation.x', 0, OSSO_ROT.x),
        ch('rotation.y', 0, OSSO_ROT.y),
        ch('rotation.z', 0, OSSO_ROT.z),
      ],
      { ease: 'easeIn' },
    ),

    seq('lagrimas-jorram', 'lagrimas', 9.8, 0.6, grow(), {
      ease: 'easeOut',
      caption: 'Ele cai num choro de cortar o coração: um ganido que acaba numa fungada — ÁNNN-S!',
    }),
    seq('rabo-murcha', 'rabo', 9.9, 0.7, [ch('rotation.x', 0.5, -0.4)]),
    seq('cabeca-funga', 'cabeca', 10.6, 0.18, [ch('rotation.x', CAB_X, CAB_X + 0.1)], { ease: 'easeOut' }),
    seq('cabeca-funga2', 'cabeca', 10.78, 0.3, [ch('rotation.x', CAB_X + 0.1, CAB_X)]),

    seq('varig-pinta', 'letreiro', 11.6, 0.8, [ch('scale.x', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Só então ele lê na fuselagem, bem em cima da toca: VARIG. ÁNNN-S-VÁRIG!',
    }),

    seq('rabo-cai', 'rabo', 13.0, 0.6, [ch('rotation.x', -0.4, RABO_X)], {
      ease: 'easeIn',
      caption: 'Vem är ansvarig? — Quem é o responsável?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.0, 1.95, 5.0], target: [0.3, 1.12, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vem-ar-ansvarig',
    contexto:
      "Trabalho e serviços: no escritório ('Vem är ansvarig för projektet?'), numa loja ou obra quando algo dá errado, na escola ou na förskola pra saber com quem falar, ligando pra uma empresa. Em placas, avisos e e-mails aparece 'Ansvarig:' seguido de um nome.",
    fraseFonte: 'Quem é o responsável?',
    fraseAlvo: 'Vem är ansvarig?',
    pronuncia:
      "VÉM é ÁN-svaa-ri? ('vem' com É aberto e curto e M comprido, de lábios fechados — nunca o 'vẽi' nasal de 'ele vem'; na fala ele emenda no 'är': VÉM-mé; 'ansvarig' com a força no ÁN — A aberto e N de língua, sem nasalar —, o S grudado no V, VA longo com uma segunda subida, R de um toque só, e o -g do fim fraquinho ou mudo)",
    ponteSonora:
      "VÉMMM?! É... ÁNNN-S-VÁRIG?! (5 batidas: VÉM-é-ÁN-sva-ri; força no VÉM e, a maior de todas, no ÁN; o VÁ ganha uma segunda subida, menor; VÉMMM = o 'VEM!' de chamar o culpado, o MESMO VÉM de 'Hallå, vem pratar jag med?', só que de BOCA FECHADA pelo osso: É ABERTO e curto, e um M DE VERDADE no fim, lábios colados e zumbindo — é isso que faz o 'vem' sueco (quem); o 'vem!' brasileiro solto sai 'vẽi', nasal e sem M, e o sueco não reconhece; na fala o M ainda escorrega pro É seguinte: VÉM-mé; É = o 'är' de sempre, o mesmo É de 'Jag är' — aberto e curto; ÁNNN-S = o choro do chacal: o 'ããann' de choramingar que todo brasileiro conhece, fechado numa fungada seca — mas ORAL: A ABERTO de 'pá' e um N de verdade, a ponta da língua grudada no céu da boca (o mesmo A oral com N de língua do ÁN-NAN de 'Har ni den i en annan storlek?'), nada do 'ã' solto de 'lã'; é aqui a pancada principal da palavra; o S é a fungada, um sopro SEM voz que FECHA a sílaba do ÁN, como o S de 'trans-' em 'transporte' — por isso não abre vogal nenhuma: ÁNS-VÁ, nunca 'ã... is-VÁ' nem 'ã-su-VÁ'; e sem pausa entre o S e o V; VÁRIG = a VARIG, a velha companhia aérea brasileira, dita como o Brasil sempre disse, VÁ-rig: A LONGO e R de um toque só, de 'caro'; o G do fim é fraquinho ou mudo, como o -ig de TRÊV-LI ('trevlig') e de RRÚNG-ri ('hungrig') — nunca 'VÁ-ri-gui'; choro + VARIG fazem UMA palavra: ÁN-sva-ri, 'ansvarig' (responsável))",
    historia:
      'Depois de um dia inteiro garimpando o deserto, o chacal volta pra toca com o melhor osso da semana atravessado na boca — e encontra um avião estacionado bem em cima dela, com a roda enfiada no buraco. Ele exige que o culpado apareça, VEM!, mas com o osso entre os dentes só sai VÉMMM?! No É a bocarra escancara e o osso despenca na areia; ele cai num choro de cortar o coração, um ganido que termina numa fungada, ÁNNN-S!, e só então lê na fuselagem azul e branca, bem em cima da toca: VARIG. Quem é o responsável por isso aqui?',
  },
  createScene,
  refine: { organic: ['chacal', 'cabeca', 'mandibula', 'rabo'] },
}

export default card
