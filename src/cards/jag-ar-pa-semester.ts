import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Jag är på semester." — IÁÁ... É, PÔ... CE-MÉS-TER!
 *
 * O carneiro que passou o ano inteiro sendo contado por gente com insônia
 * tira férias: deita de barriga pra cima na toalha azul, debaixo do
 * guarda-sol, boceja (IÁÁ), suspira (É, PÔ...) e — carneiro não conta
 * carneiro — conta ESTER: a mesma Ester de maiô coral, boia e óculos escuros
 * das CEM ÉSTER de "Kan jag ta ut semester vecka 30?", pulando a cerquinha.
 * Na centésima (a placa 100) ele apaga num ronco só: CE-MÉS-TER!
 *
 * Diorama: disco de areia com o mar turquesa ao fundo, coqueiro à direita,
 * guarda-sol listrado sobre a toalha, o carneiro grande no centro com a
 * cabeça no rolinho de toalha e os Z subindo do focinho; à esquerda a cerca,
 * a Ester em pleno salto e a placa com o 100.
 */

const AREIA = '#e8d2a2'
const AREIA_ESC = '#c4a470'
const AREIA_CLARA = '#f1e3c2'
const MAR = '#2fa9b8'
const MAR_RASO = '#67cfcb'
const ESPUMA = '#f2f8f4'
const TRONCO = '#8a6239'
const TRONCO_ESC = '#6a4a2a'
const FOLHA = '#3f9152'
const FOLHA_ESC = '#2e7840'
const LARANJA = '#ee8a3c' // listras do guarda-sol
const BRANCO = '#f6f2ea'
const TOALHA = '#2f63b0'
const TOALHA_CLARA = '#eef1f6'
const LA = '#f4f0e7'
const CARA = '#4f4a55'
const CARA_CLARA = '#686270'
const PATA = '#5c5762'
const CASCO = '#2a272d'
const CHIFRE = '#d8be8a'
const ZZZ = '#8fd0f2'
const CORAL = '#d9614c' // a Ester (a mesma das CEM ÉSTER)
const PELE = '#e8c39e'
const ESCURO = '#20242b'
const BOIA = '#e07a3a'
const MADEIRA = '#9a6a3c'
const MADEIRA_ESC = '#6f4a2a'
const PLACA = '#f3ead6'
const ACENTO = '#ff4a26' // acento saturado RESERVADO: o número 100

const GY = 0.2 // topo da areia
const TOALHA_POS = new THREE.Vector3(0.3, GY, 0.42)
const TOALHA_ROT = 0.06

// salto da Ester: direção do pulo, ápice sobre a cerca, decolagem e pouso
const CERCA_POS = new THREE.Vector3(-1.08, GY, 0.55)
const SALTO_ROT = 1.0
const DIR = new THREE.Vector3(Math.sin(SALTO_ROT), 0, Math.cos(SALTO_ROT))
const APICE_Y = GY + 0.6
const A = CERCA_POS.clone().addScaledVector(DIR, -0.95)
const B = CERCA_POS.clone().addScaledVector(DIR, 0.95)

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula esticada de a até b (patas, folhas). */
function limb(r: number, a: THREE.Vector3, b: THREE.Vector3, color: string, roughness = 0.8) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.001, d.length()), color, { roughness })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(v3(0, 1, 0), d.normalize())
  return m
}

/** Chifre de carneiro: tubo em espiral, afinando, com anéis de crescimento. */
function chifre(side: number) {
  const pts: THREE.Vector3[] = []
  const N = 48
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const th = 2.25 - t * Math.PI * 2 * 0.92 // nasce no alto, vai pra fora, desce e enrola
    const r = 0.2 * (1 - 0.6 * t)
    const x = 0.27 + r * Math.cos(th) * 0.85
    const y = 0.02 + r * Math.sin(th)
    const z = -0.06 - r * Math.cos(th) * 0.45 + 0.1 * t
    pts.push(v3(side * x, y, z))
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  const raio = (t: number) => 0.068 * (1 - 0.62 * t) * (1 + 0.07 * Math.sin(t * 52))
  const TS = 96
  const RS = 14
  const geo = new THREE.TubeGeometry(curve, TS, 1, RS, false)
  const pos = geo.attributes.position
  const p = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (let i = 0; i <= TS; i++) {
    const t = i / TS
    curve.getPointAt(t, c)
    const rr = raio(t)
    for (let j = 0; j <= RS; j++) {
      const k = i * (RS + 1) + j
      p.fromBufferAttribute(pos, k).sub(c).multiplyScalar(rr).add(c)
      pos.setXYZ(k, p.x, p.y, p.z)
    }
  }
  geo.computeVertexNormals()
  const g = new THREE.Group()
  const tubo = new THREE.Mesh(geo, mat(CHIFRE, { roughness: 0.55, size: 0.4 }))
  tubo.castShadow = true
  tubo.receiveShadow = true
  g.add(tubo)
  const ponta = sphere(raio(1), CHIFRE, { roughness: 0.55 }, 16)
  ponta.position.copy(curve.getPointAt(1))
  g.add(ponta)
  return g
}

/** Anel de boia laranja com quatro faixas brancas (o mesmo das CEM ÉSTER). */
function boiaAnel(r: number, tube: number) {
  const g = new THREE.Group()
  const anel = torus(r, tube, BOIA, { roughness: 0.45 })
  anel.rotation.x = Math.PI / 2
  g.add(anel)
  for (let i = 0; i < 4; i++) {
    const a = i * (Math.PI / 2) + Math.PI / 4
    const faixa = cylinder(tube * 1.14, tube * 1.14, tube * 1.6, BRANCO, { roughness: 0.5 })
    faixa.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
    faixa.rotation.z = Math.PI / 2
    faixa.rotation.y = Math.PI / 2 - a
    g.add(faixa)
  }
  return g
}

/** A Ester: person() coral, óculos escuros, cabelo — braços pra cima no salto. */
function ester(height: number) {
  const g = person({ body: CORAL, skin: PELE, height, armAngle: 0.5 })
  const headR = height * 0.19
  const head = g.getObjectByName('head')!

  const oculos = rbox(headR * 1.5, headR * 0.34, headR * 0.22, headR * 0.08, ESCURO, {
    roughness: 0.2,
    metalness: 0.35,
  })
  oculos.position.set(0, headR * 0.15, headR * 0.88)
  head.add(oculos)
  for (const side of [-1, 1]) {
    const haste = rbox(headR * 0.1, headR * 0.1, headR * 0.72, headR * 0.03, ESCURO, { roughness: 0.3 })
    haste.position.set(side * headR * 0.74, headR * 0.15, headR * 0.48)
    head.add(haste)
  }
  const cabelo = puff(headR * 0.7, '#3d2a1e', 5, 61, { roughness: 0.9 })
  cabelo.position.y = headR * 0.45
  cabelo.scale.set(1.06, 0.78, 1.0)
  head.add(cabelo)

  for (const [nome, ang] of [['armL', -2.7], ['armR', 2.7]] as const) {
    const arm = g.getObjectByName(nome)!
    shoulderPivot(arm, height)
    arm.rotation.z = ang
  }
  return g
}

/** Letra Z de traço grosso, no plano xy (virada para +z). */
function letraZ(h: number) {
  const g = new THREE.Group()
  const w = h * 0.82
  const t = h * 0.24
  const d = h * 0.24
  const opts = { roughness: 0.4 }
  const topo = rbox(w, t, d, t * 0.35, ZZZ, opts)
  topo.position.y = h / 2 - t / 2
  const pe = rbox(w, t, d, t * 0.35, ZZZ, opts)
  pe.position.y = -h / 2 + t / 2
  const diag = rbox(t, Math.hypot(w - t, h - t), d, t * 0.35, ZZZ, opts)
  diag.rotation.z = -Math.atan2(w - t, h - t)
  g.add(topo, pe, diag)
  return g
}

/** Algarismos pintados na placa (1 e 0), traço grosso no acento. */
function algarismo(d: '1' | '0') {
  const g = new THREE.Group()
  const opts = { roughness: 0.45 }
  if (d === '1') {
    const haste = rbox(0.045, 0.21, 0.026, 0.012, ACENTO, opts)
    g.add(haste)
    const bandeira = rbox(0.042, 0.075, 0.026, 0.012, ACENTO, opts)
    bandeira.position.set(-0.03, 0.075, 0)
    bandeira.rotation.z = -0.9
    g.add(bandeira)
    const pe = rbox(0.11, 0.038, 0.026, 0.012, ACENTO, opts)
    pe.position.y = -0.087
    g.add(pe)
  } else {
    const zero = torus(0.064, 0.022, ACENTO, opts)
    zero.scale.set(0.82, 1.27, 0.6)
    g.add(zero)
  }
  return g
}

/** Segmento circular do disco atrás da corda z = zc (o mar ao fundo). */
function segmentoMar(r: number, zc: number, depth: number, color: string) {
  const a0 = Math.asin(-zc / r)
  const shape = new THREE.Shape()
  const n = 48
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((Math.PI - 2 * a0) * i) / n
    const x = r * Math.cos(a)
    const y = r * Math.sin(a)
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 24,
  })
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.14, metalness: 0.1, size: 4 }))
  m.rotation.x = -Math.PI / 2
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(53)

  // ---- base: disco de areia --------------------------------------------------
  const base = new THREE.Group()

  const borda = cylinder(2.62, 2.72, 0.12, AREIA_ESC, { roughness: 0.95 })
  borda.position.y = 0.06
  base.add(borda)

  const areia = cylinder(2.56, 2.62, 0.08, AREIA, { roughness: 0.95 })
  areia.position.y = 0.16
  base.add(areia)

  // montinhos de areia e marcas de vento
  for (const [mx, mz, mr] of [[-0.35, 1.75, 0.32], [1.55, 1.3, 0.26], [-2.0, -0.55, 0.3], [0.2, -0.95, 0.28]] as const) {
    const monte = sphere(mr, AREIA_CLARA, { roughness: 0.95 })
    monte.scale.set(1.4, 0.16, 1)
    monte.position.set(mx, GY, mz)
    monte.rotation.y = rand() * Math.PI
    base.add(monte)
  }

  // estrela-do-mar
  const estrela = new THREE.Group()
  estrela.position.set(-0.55, GY + 0.02, 1.85)
  estrela.rotation.y = 0.3
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const braco = capsule(0.04, 0.12, '#e8955a', { roughness: 0.75 })
    braco.rotation.z = Math.PI / 2
    braco.rotation.y = a
    braco.position.set(Math.cos(a) * 0.08, 0, -Math.sin(a) * 0.08)
    braco.scale.set(1, 1, 0.5)
    estrela.add(braco)
  }
  const miolo = sphere(0.055, '#e8955a', { roughness: 0.75 })
  miolo.scale.y = 0.5
  estrela.add(miolo)
  base.add(estrela)

  // conchinhas
  for (const [sx, sz, seed] of [[0.75, 1.95, 3], [-1.75, 1.35, 4], [2.05, 0.65, 5]] as const) {
    const concha = rock(0.06, '#f2d9cb', seed, { roughness: 0.7 })
    concha.scale.y = 0.55
    concha.position.set(sx, GY + 0.02, sz)
    base.add(concha)
  }

  // chinelos do carneiro na frente da toalha
  const chinelos = new THREE.Group()
  chinelos.position.set(1.35, GY, 1.38)
  chinelos.rotation.y = -0.35
  for (const [i, side] of [-1, 1].entries()) {
    const ch1 = new THREE.Group()
    ch1.position.set(side * 0.1, 0, i * 0.05)
    ch1.rotation.y = side * 0.1
    const sola = rbox(0.13, 0.03, 0.32, 0.05, BRANCO, { roughness: 0.6 })
    sola.position.y = 0.015
    ch1.add(sola)
    for (const sx of [-1, 1]) {
      const tira = capsule(0.012, 0.13, TOALHA, { roughness: 0.5 })
      tira.position.set(sx * 0.03, 0.045, 0.02)
      tira.rotation.set(Math.PI / 2 - 0.2, sx * 0.45, 0)
      ch1.add(tira)
    }
    chinelos.add(ch1)
  }
  base.add(chinelos)

  root.add(base)

  // ---- mar turquesa ao fundo ------------------------------------------------
  const mar = new THREE.Group()

  const raso = segmentoMar(2.53, -1.22, 0.035, MAR_RASO)
  raso.position.y = GY - 0.015
  mar.add(raso)

  const fundo = segmentoMar(2.53, -1.55, 0.05, MAR)
  fundo.position.y = GY - 0.015
  mar.add(fundo)

  // espuma na beira e cristas de onda
  const meiaCorda = Math.sqrt(2.53 * 2.53 - 1.22 * 1.22)
  const espuma = capsule(0.04, meiaCorda * 2 - 0.12, ESPUMA, { roughness: 0.6 })
  espuma.rotation.z = Math.PI / 2
  espuma.scale.set(1, 1, 0.7)
  espuma.position.set(0, GY + 0.035, -1.22)
  mar.add(espuma)
  for (const [wx, wz, wl] of [[-0.9, -1.9, 0.7], [0.75, -2.05, 0.55], [-0.05, -2.3, 0.45]] as const) {
    const crista = capsule(0.028, wl, ESPUMA, { roughness: 0.5 })
    crista.rotation.z = Math.PI / 2
    crista.scale.set(1, 1, 0.6)
    crista.position.set(wx, GY + 0.06, wz)
    mar.add(crista)
  }

  root.add(mar)

  // ---- coqueiro curvo, ao fundo à esquerda --------------------------------------------
  const coqueiro = new THREE.Group()
  coqueiro.position.set(-2.05, GY, -0.75)
  coqueiro.rotation.y = Math.PI - 0.55

  let elo: THREE.Object3D = coqueiro
  const SEG = 0.44
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group()
    if (i > 0) g.position.y = SEG
    g.rotation.z = i === 0 ? -0.06 : -0.13
    const r0 = 0.15 - i * 0.017
    const r1 = r0 - 0.017
    const gomo = lathe(
      [[0, 0], [r0 * 1.12, 0], [r0 * 1.05, 0.06], [r1 * 1.02, SEG * 0.9], [r1 * 1.1, SEG + 0.02], [0, SEG + 0.02]],
      i % 2 ? TRONCO_ESC : TRONCO,
      { roughness: 0.85 },
    )
    g.add(gomo)
    elo.add(g)
    elo = g
  }
  const copa = new THREE.Group()
  copa.position.y = SEG
  elo.add(copa)
  for (let i = 0; i < 7; i++) {
    const braco = new THREE.Group()
    braco.rotation.y = (i / 7) * Math.PI * 2 + 0.2
    const f1 = capsule(0.1, 0.36, i % 2 ? FOLHA : FOLHA_ESC, { roughness: 0.8 })
    f1.scale.z = 0.32
    f1.position.set(0.24, 0.1, 0)
    f1.rotation.z = -1.05
    braco.add(f1)
    const f2 = capsule(0.085, 0.34, i % 2 ? FOLHA : FOLHA_ESC, { roughness: 0.8 })
    f2.scale.z = 0.3
    f2.position.set(0.58, -0.04, 0)
    f2.rotation.z = -1.9
    braco.add(f2)
    copa.add(braco)
  }
  const nucleoCopa = sphere(0.14, FOLHA_ESC, { roughness: 0.85 })
  copa.add(nucleoCopa)
  for (const [kx, kz] of [[0.12, 0.08], [-0.06, 0.13], [0.02, -0.13]] as const) {
    const coco = sphere(0.085, '#5f4227', { roughness: 0.8 })
    coco.position.set(kx, -0.1, kz)
    copa.add(coco)
  }
  root.add(coqueiro)

  // ---- guarda-sol listrado --------------------------------------------------
  const guardasol = new THREE.Group()
  guardasol.position.set(0.95, GY, -0.62)

  const haste = new THREE.Group()
  haste.rotation.set(0.12, 0, 0.2)
  guardasol.add(haste)

  const POLE = 2.05
  const mastro = cylinder(0.032, 0.036, POLE, BRANCO, { roughness: 0.35 })
  mastro.position.y = POLE / 2
  haste.add(mastro)
  for (const yy of [0.3, 0.9, 1.5]) {
    const anel = cylinder(0.04, 0.04, 0.12, LARANJA, { roughness: 0.45 })
    anel.position.y = yy
    haste.add(anel)
  }
  const monteBase = sphere(0.17, AREIA_CLARA, { roughness: 0.95 })
  monteBase.scale.set(1, 0.35, 1)
  guardasol.add(monteBase)

  const copaSol = new THREE.Group()
  copaSol.position.y = POLE
  haste.add(copaSol)
  const perfil = [[0.0, 0.0], [0.3, -0.06], [0.62, -0.18], [0.9, -0.33], [1.08, -0.45]].map(
    ([r, y]) => new THREE.Vector2(r, y),
  )
  const GOMOS = 10
  for (let i = 0; i < GOMOS; i++) {
    const geo = new THREE.LatheGeometry(perfil, 2, (i / GOMOS) * Math.PI * 2, (Math.PI * 2) / GOMOS)
    const m = mat(i % 2 ? BRANCO : LARANJA, { roughness: 0.75, size: 2 })
    m.side = THREE.DoubleSide
    const gomo = new THREE.Mesh(geo, m)
    gomo.castShadow = true
    gomo.receiveShadow = true
    copaSol.add(gomo)
    // babado: abinha pendurada na borda de cada gomo
    const a = ((i + 0.5) / GOMOS) * Math.PI * 2
    const aba = rbox(0.3, 0.09, 0.02, 0.01, i % 2 ? BRANCO : LARANJA, { roughness: 0.75 })
    aba.position.set(Math.sin(a) * 1.03, -0.5, Math.cos(a) * 1.03)
    aba.rotation.y = a
    copaSol.add(aba)
  }
  const ponteira = sphere(0.06, LARANJA, { roughness: 0.4 })
  ponteira.position.y = 0.04
  copaSol.add(ponteira)

  root.add(guardasol)

  // ---- toalha azul + rolinho de travesseiro ---------------------------------
  const toalha = new THREE.Group()
  toalha.position.copy(TOALHA_POS)
  toalha.rotation.y = TOALHA_ROT

  const pano = rbox(2.25, 0.03, 1.15, 0.012, TOALHA, { roughness: 0.93 })
  pano.position.y = 0.015
  toalha.add(pano)
  for (const sx of [-1, 1]) {
    for (const dx of [0.74, 0.92]) {
      const listra = rbox(0.09, 0.034, 1.15, 0.01, TOALHA_CLARA, { roughness: 0.93 })
      listra.position.set(sx * dx, 0.016, 0)
      toalha.add(listra)
    }
    for (let k = 0; k < 9; k++) {
      const franja = rbox(0.08, 0.014, 0.03, 0.006, TOALHA_CLARA, { roughness: 0.93 })
      franja.position.set(sx * 1.16, 0.007, -0.5 + k * 0.125)
      toalha.add(franja)
    }
  }
  const rolinho = cylinder(0.13, 0.13, 0.78, TOALHA_CLARA, { roughness: 0.93 })
  rolinho.rotation.x = Math.PI / 2
  rolinho.position.set(0.98, 0.16, 0.0)
  toalha.add(rolinho)
  for (const sz of [-0.24, 0.24]) {
    const faixa = cylinder(0.135, 0.135, 0.08, TOALHA, { roughness: 0.93 })
    faixa.rotation.x = Math.PI / 2
    faixa.position.set(0.98, 0.16, sz)
    toalha.add(faixa)
  }
  root.add(toalha)

  // ---- CARNEIRO de barriga pra cima ------------------------------------------
  const carneiro = new THREE.Group()
  carneiro.position.set(TOALHA_POS.x, GY + 0.03, TOALHA_POS.z)
  carneiro.rotation.y = TOALHA_ROT
  root.add(carneiro)

  const LX = 0.72
  const LY = 0.36
  const LZ = 0.46
  const CY = 0.38
  const nucleo = sphere(1, LA, { roughness: 0.95 })
  nucleo.scale.set(LX, LY, LZ)
  nucleo.position.y = CY
  carneiro.add(nucleo)

  // lã: bolotas espalhadas na metade de cima do corpo
  const randL = rng(7)
  for (const u of [-0.82, -0.5, -0.17, 0.17, 0.5, 0.82]) {
    for (const vv of [-1.45, -0.75, 0, 0.75, 1.45]) {
      const uu = u + (randL() - 0.5) * 0.12
      const v = vv + (randL() - 0.5) * 0.3
      const s = Math.sqrt(1 - uu * uu)
      const bolota = sphere((0.15 + randL() * 0.06) * (0.55 + 0.45 * s), LA, { roughness: 0.95 })
      bolota.position.set(LX * uu, CY + LY * s * Math.cos(v), LZ * s * Math.sin(v))
      carneiro.add(bolota)
    }
  }
  // pescoço de lã ligando à cabeça, e o rabinho
  const pescoco = sphere(0.3, LA, { roughness: 0.95 })
  pescoco.scale.set(1, 0.95, 1.1)
  pescoco.position.set(0.68, 0.38, 0.02)
  carneiro.add(pescoco)
  const rabo = sphere(0.12, LA, { roughness: 0.95 })
  rabo.position.set(-0.8, 0.3, 0)
  carneiro.add(rabo)

  // patinhas pro alto: as de trás esticadas, as da frente dobradas no joelho
  for (const side of [-1, 1]) {
    const tras0 = v3(-0.42, 0.64, side * 0.2)
    const tras1 = v3(-0.58, 1.12, side * 0.33)
    carneiro.add(limb(0.066, tras0, tras1, PATA, 0.7))
    const coxaT = sphere(0.16, LA, { roughness: 0.95 })
    coxaT.position.set(-0.45, 0.74, side * 0.22)
    carneiro.add(coxaT)
    const cascoT = limb(0.072, tras1, tras1.clone().add(v3(-0.03, 0.09, side * 0.025)), CASCO, 0.45)
    carneiro.add(cascoT)

    const frente0 = v3(0.3, 0.64, side * 0.2)
    const frente1 = v3(0.36, 1.02, side * 0.3)
    const frente2 = v3(0.53, 0.96, side * 0.33)
    carneiro.add(limb(0.066, frente0, frente1, PATA, 0.7))
    const joelho = sphere(0.074, PATA, { roughness: 0.7 })
    joelho.position.copy(frente1)
    carneiro.add(joelho)
    carneiro.add(limb(0.06, frente1, frente2, PATA, 0.7))
    const coxaF = sphere(0.16, LA, { roughness: 0.95 })
    coxaF.position.set(0.3, 0.74, side * 0.22)
    carneiro.add(coxaF)
    const cascoF = limb(0.068, frente2, frente2.clone().add(v3(0.08, -0.03, 0)), CASCO, 0.45)
    carneiro.add(cascoF)
  }

  // ---- cabeça: olhos fechados, chifres em espiral -----------------------------
  // modelada de frente (+z) e virada para a câmera, recostada no rolinho
  const cabeca = new THREE.Group()
  cabeca.position.set(1.0, 0.56, 0.1)
  cabeca.rotation.set(-0.22, -0.32, -0.12)
  cabeca.scale.setScalar(1.45)
  carneiro.add(cabeca)

  const cranio = sphere(0.24, CARA, { roughness: 0.7 })
  cranio.scale.set(0.92, 1, 0.95)
  cabeca.add(cranio)
  const focinho = sphere(0.17, CARA_CLARA, { roughness: 0.65 })
  focinho.scale.set(0.86, 0.74, 1.12)
  focinho.position.set(0, -0.11, 0.17)
  cabeca.add(focinho)
  // narinas em risquinho (\ /), nada de bolinha que pareça olho aberto
  for (const side of [-1, 1]) {
    const narina = capsule(0.011, 0.03, '#2e2a32', { roughness: 0.5 })
    narina.scale.z = 0.6
    narina.position.set(side * 0.045, -0.085, 0.352)
    narina.rotation.set(-0.5, 0, side * 0.55)
    cabeca.add(narina)
  }
  // sorrisinho de quem dorme bem
  const ARCO_BOCA = Math.PI * 0.55
  const boca = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.011, 8, 20, ARCO_BOCA),
    mat('#2a262d', { roughness: 0.5, detail: 0 }),
  )
  boca.position.set(0, -0.155, 0.325)
  boca.rotation.set(-0.55, 0, -Math.PI / 2 - ARCO_BOCA / 2)
  cabeca.add(boca)

  // olhos fechados: pálpebra clara com o risco do cílio em arco (◡)
  const ARCO_OLHO = Math.PI * 0.8
  for (const side of [-1, 1]) {
    const palpebra = sphere(0.07, CARA_CLARA, { roughness: 0.6 })
    palpebra.scale.set(1.15, 0.78, 0.55)
    palpebra.position.set(side * 0.1, 0.055, 0.2)
    cabeca.add(palpebra)
    const cilio = new THREE.Mesh(
      new THREE.TorusGeometry(0.056, 0.014, 8, 20, ARCO_OLHO),
      mat('#141217', { roughness: 0.5, detail: 0 }),
    )
    cilio.position.set(side * 0.1, 0.068, 0.236)
    cilio.rotation.set(-0.25, side * 0.38, -Math.PI / 2 - ARCO_OLHO / 2)
    cabeca.add(cilio)

    // orelhinha cinza pra fora, por baixo do chifre
    const orelha = capsule(0.045, 0.09, CARA, { roughness: 0.7 })
    orelha.scale.set(1, 1, 0.45)
    orelha.position.set(side * 0.25, -0.04, 0.02)
    orelha.rotation.z = -side * (Math.PI / 2 + 0.3)
    cabeca.add(orelha)

    cabeca.add(chifre(side))
  }
  const topete = puff(0.12, LA, 7, 19, { roughness: 0.95 })
  topete.scale.set(1.25, 0.8, 1)
  topete.position.set(0, 0.2, 0.06)
  cabeca.add(topete)

  // ---- cerquinha branca -------------------------------------------------------
  const cerca = new THREE.Group()
  cerca.position.copy(CERCA_POS)
  cerca.rotation.y = SALTO_ROT
  for (const px of [-0.27, 0, 0.27]) {
    const ripa = rbox(0.11, 0.5, 0.045, 0.02, BRANCO, { roughness: 0.6 })
    ripa.position.set(px, 0.25, 0)
    cerca.add(ripa)
    const bico = rbox(0.078, 0.078, 0.045, 0.012, BRANCO, { roughness: 0.6 })
    bico.rotation.z = Math.PI / 4
    bico.position.set(px, 0.5, 0)
    cerca.add(bico)
    const montinho = sphere(0.09, AREIA_CLARA, { roughness: 0.95 })
    montinho.scale.set(1.2, 0.35, 0.8)
    montinho.position.set(px, 0, 0)
    cerca.add(montinho)
  }
  for (const py of [0.15, 0.37]) {
    const travessa = rbox(0.8, 0.065, 0.035, 0.015, BRANCO, { roughness: 0.6 })
    travessa.position.set(0, py, -0.04)
    cerca.add(travessa)
  }
  root.add(cerca)

  // ---- Ester em pleno salto ---------------------------------------------------
  const EH = 1.15
  const esterG = new THREE.Group() // só translada/escala na montagem
  esterG.position.set(CERCA_POS.x, APICE_Y, CERCA_POS.z)
  root.add(esterG)
  const rumo = new THREE.Group()
  rumo.rotation.y = SALTO_ROT
  esterG.add(rumo)
  const inclina = new THREE.Group()
  inclina.position.y = 0.4
  inclina.rotation.x = 0.22
  rumo.add(inclina)
  const esterP = ester(EH)
  esterP.position.y = -0.4
  inclina.add(esterP)

  // ---- rastro pontilhado do salto: da decolagem até os pés dela ------------
  const rastro = new THREE.Group()
  rastro.position.copy(A)
  for (const [i, sv] of [0.16, 0.3, 0.44, 0.58, 0.72].entries()) {
    const ponto = sphere(0.045 + i * 0.008, BRANCO, { roughness: 0.5 }, 14)
    ponto.position.set(
      (CERCA_POS.x - A.x) * sv,
      (APICE_Y - GY) * (1 - (1 - sv) * (1 - sv)) + 0.05,
      (CERCA_POS.z - A.z) * sv,
    )
    rastro.add(ponto)
  }
  const poeira = puff(0.08, AREIA_CLARA, 5, 77, { roughness: 0.95 })
  poeira.scale.set(1.3, 0.6, 1.3)
  poeira.position.y = 0.04
  rastro.add(poeira)
  root.add(rastro)

  // ---- boia na cintura dela (infla) -------------------------------------------
  const boia = boiaAnel(EH * 0.23, EH * 0.075)
  boia.position.y = EH * 0.3
  esterP.add(boia)

  // ---- placa com o 100 --------------------------------------------------------
  const placa = new THREE.Group()
  placa.position.set(-1.95, GY, 1.0)
  placa.rotation.set(0, 0.42, 0.04)

  const estaca = rbox(0.09, 1.05, 0.08, 0.025, MADEIRA, { roughness: 0.75 })
  estaca.position.y = 0.52
  placa.add(estaca)
  const tabua = rbox(0.66, 0.4, 0.07, 0.03, MADEIRA_ESC, { roughness: 0.75 })
  tabua.position.set(0, 1.0, 0.05)
  placa.add(tabua)
  const pintura = rbox(0.58, 0.32, 0.02, 0.012, PLACA, { roughness: 0.8 })
  pintura.position.set(0, 1.0, 0.09)
  placa.add(pintura)
  for (const [i, d] of (['1', '0', '0'] as const).entries()) {
    const dg = algarismo(d)
    dg.position.set(-0.155 + i * 0.155, 1.0, 0.105)
    placa.add(dg)
  }
  for (const sx of [-0.27, 0.27]) {
    const prego = sphere(0.016, '#8d949c', { roughness: 0.3, metalness: 0.7 }, 10)
    prego.position.set(sx, 1.14, 0.1)
    placa.add(prego)
  }
  const monteP = sphere(0.14, AREIA_CLARA, { roughness: 0.95 })
  monteP.scale.set(1, 0.35, 1)
  placa.add(monteP)
  root.add(placa)

  // ---- Z Z Z subindo do focinho -----------------------------------------------
  root.updateMatrixWorld(true)
  const testa = cabeca.localToWorld(v3(0.2, 0.25, 0.2))
  const zzz = new THREE.Group()
  zzz.position.set(testa.x + 0.1, testa.y + 0.16, testa.z + 0.05)
  zzz.rotation.y = -0.25
  for (const [zx, zy, zh, zr] of [[0, 0, 0.16, 0.15], [0.13, 0.27, 0.22, -0.1], [0.3, 0.62, 0.3, 0.12]] as const) {
    const z = letraZ(zh)
    z.position.set(zx, zy, 0)
    z.rotation.z = zr
    zzz.add(z)
  }
  root.add(zzz)

  // ---- peças ------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'praia', object: base },
    { name: 'mar', group: 'praia', object: mar },
    { name: 'coqueiro', group: 'praia', object: coqueiro },
    { name: 'guardasol', group: 'sombra', object: guardasol },
    { name: 'toalha', group: 'sombra', object: toalha },
    { name: 'carneiro', group: 'carneiro', object: carneiro },
    { name: 'cabeca', group: 'carneiro', object: cabeca },
    { name: 'cerca', group: 'ester', object: cerca },
    { name: 'ester', group: 'ester', object: esterG },
    { name: 'boia', group: 'ester', object: boia },
    { name: 'rastro', group: 'ester', object: rastro },
    { name: 'placa', group: 'cem', object: placa },
    { name: 'zzz', group: 'cem', object: zzz },
  ]

  // ---- montagem ---------------------------------------------------------------
  const CR = carneiro.rotation.z
  const HX = cabeca.rotation.x
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Primeiro dia das férias de julho: uma praia sobe do chão, com mar turquesa e coqueiro.',
    }),
    seq('mar-rise', 'mar', 0.3, 0.7, [riseFrom(0, 0.4)], { ease: 'easeOut' }),
    seq('coqueiro-rise', 'coqueiro', 0.7, 0.8, [riseFrom(GY, 2.4)], { ease: 'easeOut' }),

    seq('guardasol-rise', 'guardasol', 1.9, 0.6, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: 'Guarda-sol fincado, toalha azul estendida na sombra…',
    }),
    seq('guardasol-abre', 'guardasol', 2.5, 0.45, [ch('scale.x', 0.2, 1), ch('scale.z', 0.2, 1)], {
      ease: 'easeOut',
    }),
    seq('toalha-abre', 'toalha', 2.6, 0.6, [ch('scale.x', 0.05, 1), ch('scale.z', 0.6, 1)], {
      ease: 'easeOut',
    }),

    seq(
      'carneiro-cai',
      'carneiro',
      3.6,
      0.55,
      [ch('position.y', GY + 1.9, GY + 0.03), ch('rotation.z', -0.7, 0.06)],
      {
        ease: 'easeIn',
        caption: '…e o carneiro, contado o ano inteiro por quem tem insônia, se joga de barriga pra cima.',
      },
    ),
    seq('cabeca-cai', 'cabeca', 3.6, 0.55, [ch('rotation.x', HX - 0.6, HX)], { ease: 'easeIn' }),
    seq('carneiro-amassa', 'carneiro', 4.15, 0.14, [ch('scale.y', 1, 0.86), ch('scale.x', 1, 1.06)], {
      ease: 'easeOut',
    }),
    seq('carneiro-quica', 'carneiro', 4.29, 0.35, [
      ch('scale.y', 0.86, 1),
      ch('scale.x', 1.06, 1),
      ch('rotation.z', 0.06, CR),
    ], { ease: 'easeOut' }),

    seq('cabeca-boceja', 'cabeca', 5.3, 0.5, [ch('rotation.x', HX, HX - 0.45)], {
      ease: 'easeOut',
      caption: 'Boceja um IÁÁ curtinho, se espreguiça e suspira, satisfeito: É, PÔ…',
    }),
    seq('carneiro-espreguica', 'carneiro', 5.45, 0.45, [ch('scale.x', 1, 1.1)], { ease: 'easeOut' }),
    seq('carneiro-solta', 'carneiro', 6.0, 0.5, [ch('scale.x', 1.1, 1)], { ease: 'easeInOut' }),
    seq('cabeca-deita', 'cabeca', 6.0, 0.6, [ch('rotation.x', HX - 0.45, HX)], { ease: 'easeInOut' }),

    seq('cerca-rise', 'cerca', 7.2, 0.6, [riseFrom(GY, 0.75)], {
      ease: 'easeOut',
      caption: 'Só que carneiro não conta carneiro pra dormir: conta ESTER! Brota uma cerquinha ao pé da toalha…',
    }),

    // 1º salto: aparece, pula, pousa e some
    seq('ester-aparece', 'ester', 8.3, 0.3, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: '…e pula uma Ester de boia e óculos escuros. Depois outra. Noventa e oito, noventa e nove…',
    }),
    seq('boia-infla', 'boia', 8.4, 0.35, [
      ch('scale.x', 0.02, 1), ch('scale.y', 0.02, 1), ch('scale.z', 0.02, 1),
    ], { ease: 'easeOut' }),
    seq('ester-vai1', 'ester', 8.7, 0.9, [ch('position.x', A.x, B.x), ch('position.z', A.z, B.z)], {
      ease: 'linear',
    }),
    seq('ester-sobe1', 'ester', 8.7, 0.45, [ch('position.y', GY, APICE_Y)], { ease: 'easeOut' }),
    seq('ester-desce1', 'ester', 9.15, 0.45, [ch('position.y', APICE_Y, GY)], { ease: 'easeIn' }),
    seq('ester-some', 'ester', 9.65, 0.2, [
      ch('scale.x', 1, 0.01), ch('scale.y', 1, 0.01), ch('scale.z', 1, 0.01),
    ], { ease: 'easeIn' }),
    seq('ester-volta', 'ester', 9.86, 0.04, [ch('position.x', B.x, A.x), ch('position.z', B.z, A.z)], {
      ease: 'linear',
    }),
    // 2º salto: a centésima, congelada no ápice sobre a cerca
    seq('ester-reaparece', 'ester', 9.92, 0.25, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('ester-vai2', 'ester', 10.2, 0.45, [
      ch('position.x', A.x, CERCA_POS.x), ch('position.z', A.z, CERCA_POS.z),
    ], { ease: 'linear' }),
    seq('ester-sobe2', 'ester', 10.2, 0.45, [ch('position.y', GY, APICE_Y)], { ease: 'easeOut' }),
    seq('rastro-risca', 'rastro', 10.25, 0.45, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),

    seq('placa-rise', 'placa', 10.5, 0.55, [riseFrom(GY, 1.5)], {
      ease: 'easeOut',
      caption: '…e na CENTÉSIMA ele apaga, emendando tudo num ronco só: CE-MÉS-TER! (CEM ÉSTER)',
    }),
    seq('placa-pulsa', 'placa', 11.1, 0.22, [ch('scale.x', 1, 1.15), ch('scale.y', 1, 1.15)], {
      ease: 'easeOut',
    }),
    seq('placa-assenta', 'placa', 11.32, 0.35, [ch('scale.x', 1.15, 1), ch('scale.y', 1.15, 1)], {
      ease: 'easeInOut',
    }),
    seq('zzz-sobe', 'zzz', 11.2, 0.8, [
      ch('position.y', zzz.position.y - 0.5, zzz.position.y + 0.08),
      ch('scale.x', 0.1, 1), ch('scale.y', 0.1, 1), ch('scale.z', 0.1, 1),
    ], { ease: 'easeOut' }),
    seq('zzz-assenta', 'zzz', 12.1, 0.6, [ch('position.y', zzz.position.y + 0.08, zzz.position.y)], {
      ease: 'easeInOut',
      caption: 'Jag är på semester. — Estou de férias.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.08, 2.32, 5.3], target: [-0.1, 0.98, 0.25] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-pa-semester',
    contexto:
      "Férias: na resposta automática do e-mail em julho, no telefone quando o trabalho liga, explicando pro vizinho por que o carro some por três semanas. Em julho a Suécia para, e 'Hon är på semester' é a resposta pra metade das perguntas.",
    fraseFonte: 'Estou de férias.',
    fraseAlvo: 'Jag är på semester.',
    pronuncia:
      "iá é pô se-MÉS-ter ('jag' = iá; 'är' = é, curtinho; 'på' = pô, Ô fechado e sem força; 'semester' com a força no MÉS, É aberto e S comprido; o 'se-' é rapidinho e o '-ter' é fraco, com R brando no fim — e é -TER, não '-tre': não é 'semestre')",
    ponteSonora:
      "IÁÁ... É, PÔ... CE-MÉS-TER! (6 batidas: iá-é-pô-se-MÉS-ter; a força TODA no MÉS; IÁ É é o 'jag är' de sempre — o MESMO de 'Jag är trött', 'Jag är klar' e 'Jag är på väg' —, aqui o bocejo curtinho do carneiro: I de IOGA, nunca J chiado, e o É aberto e curto do 'är'; PÔ = o 'pô' brasileiro de boca redonda, Ô FECHADO, nunca 'pó' — o MESMO 'på' de 'Jag är på väg' (IÁ! É... PÔ, NAVEGA!) e de 'GRÁTIS, PÔ!' —, e aqui SEM força: 'É, PÔ...' sai num suspiro só; CE-MÉS-TER = as CEM ÉSTER de boia de 'Kan jag ta ut semester vecka 30?', mas EMENDADAS: o M do CEM passa pra Ester e os lábios FECHAM de verdade — o brasileiro tende a dizer 'sẽi-ÉS-ter', nasal e sem M, e aí o 'semester' perde o M; CE rapidinho e sem nasal, MÉS com o É ABERTO de 'Ester' e o S comprido, TER fraco com R brando; e é -TER, como em ÉSTER — nunca o '-tre' de 'semestre', que é o falso amigo)",
    historia:
      "Primeiro dia das férias de julho: o carneiro, que passou o ano inteiro sendo contado por gente com insônia, finalmente estende a toalha na praia, debaixo do guarda-sol. Boceja um IÁÁ curtinho, se espreguiça e suspira, satisfeito: É, PÔ... Só que carneiro não conta carneiro pra dormir: conta ESTER — uma Ester de boia e óculos escuros pula a cerquinha, depois outra, depois outra. 'Noventa e oito, noventa e nove...' — e na centésima ele apaga, emendando tudo num ronco só: CE-MÉSTER! Estou de férias.",
  },
  createScene,
  refine: { organic: ['carneiro', 'cabeca'] },
}

export default card
