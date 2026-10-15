import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, rock, puff,
} from '../rig/helpers'

/**
 * "Jag är förkyld." — IÁ É FUR-CHÜLD! A minhoca cavou rumo ao Japão, errou a
 * curva e FUROU o CHILE: brota no topo dos Andes rasgando de baixo pra cima a
 * bandeira chilena que os alpinistas deixaram estendida no pico. Em dois
 * segundos de vento: nariz vermelho, pingando, ATCHIM — resfriada.
 *
 * Diorama: chão de rocha cinza irregular com neve nas frestas, três picos
 * nevados ao fundo, a bandeira do Chile estendida no meio (pedras nos cantos,
 * mastro tombado ao lado) com um rasgo redondo de onde a minhoca sai em arco.
 * Acento saturado reservado ao NARIZ vermelho (o resfriado).
 */

const ROCK = '#8b8f96'
const ROCK_DARK = '#6c7179'
const ROCK_LIGHT = '#a4a8ae'
const PEAK = '#71819a'
const PEAK_DARK = '#5e6c84'
const SNOW = '#f1f4f8'
const FLAG_WHITE = '#f3f1ea'
const FLAG_RED = '#c8322a'
const FLAG_BLUE = '#1f3f94'
const DIRT = '#6e4a2f'
const DIRT_DARK = '#4a3020'
const HOLE = '#22150d'
const METAL = '#a9b0b8'
const WORM = '#ee9c8c'
const WORM_DARK = '#dc8676'
const CLITELO = '#e5866f'
const NOSE = '#ff1f3a' // acento saturado RESERVADO: o nariz resfriado
const DROP = '#bfe6f6'

const GY = 0.2 // topo do chão de rocha
const HOLE_POS: [number, number, number] = [0, GY, 0.15]
const BODY_R = 0.21
const HEAD_R = 0.34
// pose final da cabeça: virada 3/4 pra esquerda, tombada de lado, no espirro
const HEAD_RX = 0.08
const HEAD_RY = -0.34
const HEAD_RZ = 0.3

const UP = new THREE.Vector3(0, 1, 0)
const FWD = new THREE.Vector3(0, 0, 1)

/** Pico low-poly: cone com vértices deslocados e neve pintada por face. */
function peak(r: number, h: number, seed: number, snowFrom: number) {
  const rand = rng(seed)
  const geo = new THREE.ConeGeometry(r, h, 9, 5)
  geo.translate(0, h / 2, 0)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  // deslocamento por POSIÇÃO (não por vértice): cantos coincidentes andam juntos
  const offsets = new Map<string, [number, number, number]>()
  const apexShift: [number, number] = [(rand() - 0.5) * 0.18 * r, (rand() - 0.5) * 0.12 * r]
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
    let o = offsets.get(key)
    if (!o) {
      const t = v.y / h
      if (t > 0.999) o = [apexShift[0], 0, apexShift[1]]
      else if (v.y < 1e-4) o = [v.x * (rand() - 0.5) * 0.25, 0, v.z * (rand() - 0.5) * 0.25]
      else {
        const k = (rand() - 0.5) * 0.34
        o = [v.x * k + apexShift[0] * t, (rand() - 0.5) * 0.08 * h, v.z * k + apexShift[1] * t]
      }
      offsets.set(key, o)
    }
    pos.setXYZ(i, v.x + o[0], v.y + o[1], v.z + o[2])
  }
  const flat = geo.toNonIndexed()
  geo.dispose()
  const fp = flat.attributes.position
  const colors = new Float32Array(fp.count * 3)
  const c = new THREE.Color()
  const rockA = new THREE.Color(PEAK)
  const rockB = new THREE.Color(PEAK_DARK)
  const snowA = new THREE.Color(SNOW)
  const snowB = new THREE.Color('#dfe7f0')
  for (let f = 0; f < fp.count; f += 3) {
    const cy = (fp.getY(f) + fp.getY(f + 1) + fp.getY(f + 2)) / 3
    const line = snowFrom * h + (rand() - 0.5) * 0.16 * h
    if (cy > line) c.copy(rand() < 0.7 ? snowA : snowB)
    else c.copy(rand() < 0.55 ? rockA : rockB)
    for (let k = 0; k < 3; k++) c.toArray(colors, (f + k) * 3)
  }
  flat.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  flat.computeVertexNormals()
  const m = mat('#ffffff', { flat: true, roughness: 0.8, size: h })
  m.vertexColors = true
  const mesh = new THREE.Mesh(flat, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Estrela de cinco pontas deitada (ponta de cima voltada para -z). */
function star(rOut: number, rIn: number, color: string) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 === 0 ? rOut : rIn
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  })
  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.8, size: rOut * 2 }))
  mesh.rotation.x = -Math.PI / 2
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- chão de rocha do pico ------------------------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.6, 2.74, 0.2, ROCK_DARK, { roughness: 0.9 })
  slab.position.y = 0.1
  base.add(slab)

  const top = cylinder(2.5, 2.56, 0.02, ROCK, { roughness: 0.88 })
  top.position.y = GY - 0.008
  base.add(top)

  // borda irregular: lajes achatadas em volta do disco
  for (let i = 0; i < 17; i++) {
    const a = (i / 17) * Math.PI * 2 + (rand() - 0.5) * 0.25
    const front = Math.sin(a) > 0.55 // perto da câmera: lajes baixas
    const r = front ? 0.22 + rand() * 0.12 : 0.32 + rand() * 0.2
    const R = 2.3 + rand() * 0.22
    const colors = [ROCK, ROCK_DARK, ROCK_LIGHT]
    const laje = rock(r, colors[Math.floor(rand() * 3)], 100 + i, { roughness: 0.85 })
    laje.scale.set(1.25, front ? 0.38 : 0.5 + rand() * 0.25, 1)
    laje.position.set(Math.cos(a) * R, GY - 0.02, Math.sin(a) * R)
    laje.rotation.y = rand() * Math.PI
    base.add(laje)
  }

  // neve acumulada nas frestas
  for (const [x, z, sx, sz] of [
    [-2.0, 0.55, 0.42, 0.28], [1.95, 0.35, 0.38, 0.3], [-0.9, -1.15, 0.5, 0.26],
    [1.15, -1.05, 0.46, 0.24], [0.6, 1.65, 0.3, 0.2], [-1.45, 1.35, 0.34, 0.22],
  ] as const) {
    const patch = sphere(1, SNOW, { roughness: 0.92 })
    patch.scale.set(sx, 0.05, sz)
    patch.position.set(x, GY, z)
    patch.rotation.y = rand() * Math.PI
    base.add(patch)
  }

  // cascalho
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const R = 1.35 + rand() * 0.8
    const p = rock(0.05 + rand() * 0.05, ROCK_LIGHT, 200 + i, { roughness: 0.85 })
    p.position.set(Math.cos(a) * R, GY + 0.02, Math.sin(a) * R)
    base.add(p)
  }

  // piolet de alpinista fincado na neve
  const piolet = new THREE.Group()
  piolet.position.set(1.72, GY, 0.95)
  piolet.rotation.set(0.12, -0.5, -0.18)
  const cabo = cylinder(0.026, 0.03, 0.62, '#2d3a55', { roughness: 0.45 })
  cabo.position.y = 0.2
  piolet.add(cabo)
  const pica = rbox(0.4, 0.05, 0.035, 0.015, METAL, { roughness: 0.3, metalness: 0.75 })
  pica.position.y = 0.52
  piolet.add(pica)
  const ponta = cone(0.025, 0.1, METAL, { roughness: 0.3, metalness: 0.75 }, 4)
  ponta.rotation.z = -Math.PI / 2 - 0.35
  ponta.position.set(0.24, 0.5, 0)
  piolet.add(ponta)
  const montinho = sphere(0.16, SNOW, { roughness: 0.92 })
  montinho.scale.set(1, 0.35, 1)
  montinho.position.y = 0.0
  piolet.add(montinho)
  base.add(piolet)

  root.add(base)

  // ---- três picos nevados ao fundo ------------------------------------------
  const picos = new THREE.Group()
  picos.position.y = GY - 0.02
  for (const [x, z, r, h, seed, snow] of [
    [-1.95, -1.25, 0.66, 0.95, 11, 0.58],
    [0.4, -1.95, 0.98, 2.05, 12, 0.6],
    [1.75, -1.25, 0.72, 1.3, 13, 0.64],
  ] as const) {
    const p = peak(r, h, seed, snow)
    p.position.set(x, 0, z)
    p.rotation.y = seed
    picos.add(p)
  }
  root.add(picos)

  // ---- bandeira do Chile estendida no chão -----------------------------------
  const bandeira = new THREE.Group()
  bandeira.position.set(HOLE_POS[0], GY, HOLE_POS[2])
  root.add(bandeira)

  const FT = 0.024
  const branco = rbox(1.5, FT, 0.75, 0.008, FLAG_WHITE, { roughness: 0.85 })
  branco.position.set(0.375, FT / 2, -0.375)
  bandeira.add(branco)
  const azul = rbox(0.75, FT, 0.75, 0.008, FLAG_BLUE, { roughness: 0.85 })
  azul.position.set(-0.75, FT / 2, -0.375)
  bandeira.add(azul)
  const vermelho = rbox(2.25, FT, 0.75, 0.008, FLAG_RED, { roughness: 0.85 })
  vermelho.position.set(0, FT / 2, 0.375)
  bandeira.add(vermelho)

  const estrela = star(0.2, 0.08, FLAG_WHITE)
  estrela.position.set(-0.75, FT - 0.002, -0.375)
  bandeira.add(estrela)

  // bainha do lado do mastro, com ilhoses
  const bainha = rbox(0.09, 0.036, 1.5, 0.014, '#e4e1d8', { roughness: 0.85 })
  bainha.position.set(-1.165, 0.018, 0)
  bandeira.add(bainha)
  for (const z of [-0.6, 0.6]) {
    const ilhos = torus(0.024, 0.009, METAL, { roughness: 0.3, metalness: 0.75 })
    ilhos.rotation.x = Math.PI / 2
    ilhos.position.set(-1.165, 0.037, z)
    bandeira.add(ilhos)
  }

  // pedras segurando as pontas contra o vento
  for (const [x, z, r, seed] of [[1.06, -0.68, 0.11, 61], [1.02, 0.7, 0.1, 62], [-1.0, 0.7, 0.09, 63]] as const) {
    const peso = rock(r, ROCK_DARK, seed, { roughness: 0.85 })
    peso.scale.y = 0.7
    peso.position.set(x, FT + r * 0.45, z)
    bandeira.add(peso)
  }

  // ---- mastro curto tombado ao lado -----------------------------------------
  const mastro = new THREE.Group()
  mastro.position.set(-1.42, GY + 0.035, 0.95)
  mastro.rotation.y = -0.08
  root.add(mastro)

  const haste = cylinder(0.032, 0.035, 1.5, METAL, { roughness: 0.3, metalness: 0.7 })
  haste.rotation.x = -Math.PI / 2
  haste.position.z = -0.75
  mastro.add(haste)
  const ponteira = sphere(0.06, '#d4ac4a', { roughness: 0.25, metalness: 0.8 })
  ponteira.position.z = -1.53
  mastro.add(ponteira)
  const estaca = cone(0.035, 0.12, METAL, { roughness: 0.3, metalness: 0.7 })
  estaca.rotation.x = Math.PI / 2
  estaca.position.z = 0.06
  mastro.add(estaca)
  const corda = torus(0.05, 0.012, '#d8c9a2', { roughness: 0.9 })
  corda.position.z = -0.35
  mastro.add(corda)

  // ---- rasgo no meio da bandeira --------------------------------------------
  const rasgo = new THREE.Group()
  rasgo.position.set(HOLE_POS[0], GY, HOLE_POS[2])
  root.add(rasgo)

  const buraco = cylinder(0.31, 0.31, 0.02, HOLE, { roughness: 0.95 })
  buraco.position.y = FT + 0.004
  rasgo.add(buraco)

  // pontas de pano arrebentadas pra cima (branco atrás, vermelho na frente)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2
    const aba = new THREE.Group()
    aba.position.set(Math.cos(a) * 0.29, FT, Math.sin(a) * 0.29)
    aba.rotation.y = -a
    const tilt = 0.95 + rand() * 0.3
    const len = 0.22 + rand() * 0.08
    const pano = cone(0.11, len, Math.sin(a) < 0 ? FLAG_WHITE : FLAG_RED, { roughness: 0.85 }, 4)
    pano.scale.x = 0.14
    pano.rotation.z = -(Math.PI / 2 - tilt)
    pano.position.set(Math.cos(tilt) * len * 0.5, Math.sin(tilt) * len * 0.5, 0)
    aba.add(pano)
    rasgo.add(aba)
  }

  // torrões de terra cuspidos em volta
  for (let i = 0; i < 11; i++) {
    const a = rand() * Math.PI * 2
    const R = 0.36 + rand() * 0.3
    const r = 0.035 + rand() * 0.045
    const torrao = rock(r, rand() < 0.5 ? DIRT : DIRT_DARK, 300 + i, { roughness: 0.95 })
    torrao.position.set(Math.cos(a) * R, FT + r * 0.6, Math.sin(a) * R)
    rasgo.add(torrao)
  }

  // ---- a minhoca -------------------------------------------------------------
  const minhoca = new THREE.Group()
  minhoca.position.set(...HOLE_POS)
  root.add(minhoca)

  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, -0.5, 0),
      new THREE.Vector3(0, 0.15, 0),
      new THREE.Vector3(0.12, 0.62, -0.03),
      new THREE.Vector3(0.28, 1.05, -0.02),
      new THREE.Vector3(0.18, 1.46, 0.05),
      new THREE.Vector3(-0.08, 1.68, 0.14),
    ],
    false,
    'centripetal',
  )
  const radiusAt = (u: number) => BODY_R * (1 - 0.12 * Math.max(0, (u - 0.7) / 0.3))

  const N = 18
  const pts = Array.from({ length: N + 1 }, (_, i) => curve.getPointAt(i / N))
  for (let i = 0; i < N; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const dir = b.clone().sub(a)
    const len = dir.length()
    const seg = capsule(radiusAt((i + 0.5) / N), len, WORM, { roughness: 0.42 })
    seg.position.copy(a).add(b).multiplyScalar(0.5)
    seg.quaternion.setFromUnitVectors(UP, dir.normalize())
    minhoca.add(seg)
  }

  // anéis do corpo
  for (let u = 0.2; u < 0.95; u += 0.056) {
    if (u > 0.62 && u < 0.79) continue // clitelo
    const ring = torus(radiusAt(u) * 0.99, 0.025, WORM_DARK, { roughness: 0.5 })
    ring.position.copy(curve.getPointAt(u))
    ring.quaternion.setFromUnitVectors(FWD, curve.getTangentAt(u))
    minhoca.add(ring)
  }

  // clitelo: a "sela" mais grossa que diz MINHOCA
  const clitelo = capsule(BODY_R * 1.1, 0.2, CLITELO, { roughness: 0.45 })
  clitelo.position.copy(curve.getPointAt(0.705))
  clitelo.quaternion.setFromUnitVectors(UP, curve.getTangentAt(0.705))
  minhoca.add(clitelo)

  // ---- cabeça (pivô no centro do crânio) ------------------------------------
  const neck = curve.getPointAt(1)
  const tEnd = curve.getTangentAt(1)
  const cabeca = new THREE.Group()
  cabeca.position.copy(neck).addScaledVector(tEnd, HEAD_R * 0.5)
  cabeca.rotation.set(HEAD_RX, HEAD_RY, HEAD_RZ)
  minhoca.add(cabeca)

  const cranio = sphere(HEAD_R, WORM, { roughness: 0.42 })
  cranio.scale.set(1, 0.94, 0.96)
  cabeca.add(cranio)

  for (const side of [-1, 1]) {
    const ex = side * 0.14
    const ey = 0.15
    const esclera = sphere(0.1, '#ffffff', { roughness: 0.25 })
    esclera.position.set(ex, ey, 0.24)
    esclera.scale.z = 0.62
    cabeca.add(esclera)
    // pupila achatada rente à esclera, olhando pra baixo (abatida)
    const pupila = sphere(0.04, '#1a1a1a', { roughness: 0.2 })
    pupila.scale.z = 0.45
    pupila.position.set(ex - side * 0.01, ey - 0.035, 0.293)
    cabeca.add(pupila)
    // pálpebra caída de doente até o meio do olho (canto de fora mais baixo)
    const palpebra = sphere(0.105, WORM, { roughness: 0.42 })
    palpebra.scale.set(1.05, 0.55, 0.64)
    palpebra.position.set(ex, ey + 0.06, 0.238)
    palpebra.rotation.z = -side * 0.3
    cabeca.add(palpebra)
    // lágrima no canto de fora
    const lagrima = new THREE.Group()
    lagrima.position.set(side * 0.225, ey - 0.1, 0.235)
    const gotaL = sphere(0.028, DROP, { roughness: 0.08, detail: 0 })
    lagrima.add(gotaL)
    const pontaL = cone(0.024, 0.05, DROP, { roughness: 0.08, detail: 0 })
    pontaL.position.y = 0.03
    lagrima.add(pontaL)
    cabeca.add(lagrima)
    // bochecha febril
    const bochecha = sphere(0.07, '#f2897c', { roughness: 0.5 })
    bochecha.scale.set(1, 0.6, 0.35)
    bochecha.position.set(side * 0.215, -0.09, 0.225)
    cabeca.add(bochecha)
  }

  // boquinha redonda em bico, logo abaixo do nariz
  const bico = cylinder(0.058, 0.07, 0.09, WORM, { roughness: 0.42 })
  bico.rotation.x = Math.PI / 2
  bico.position.set(0, -0.255, 0.245)
  cabeca.add(bico)
  const labio = torus(0.05, 0.024, WORM_DARK, { roughness: 0.42 })
  labio.position.set(0, -0.255, 0.292)
  cabeca.add(labio)
  const boca = sphere(0.036, '#5a2328', { roughness: 0.7 })
  boca.position.set(0, -0.255, 0.284)
  cabeca.add(boca)

  // ---- nariz vermelho (o acento) --------------------------------------------
  const nariz = new THREE.Group()
  nariz.position.set(0, -0.05, 0.35)
  cabeca.add(nariz)

  const bola = sphere(0.125, NOSE, { roughness: 0.18, detail: 0 })
  nariz.add(bola)
  const brilho = sphere(0.022, '#ffffff', { roughness: 0.1, detail: 0 })
  brilho.position.set(-0.05, 0.065, 0.09)
  nariz.add(brilho)

  // ---- gota pendurada (sempre a prumo, contra a inclinação da cabeça) ------
  const gota = new THREE.Group()
  gota.position.set(-0.055, -0.095, 0.05)
  gota.quaternion.copy(cabeca.quaternion).invert()
  nariz.add(gota)

  const fio = cylinder(0.017, 0.026, 0.09, DROP, { roughness: 0.08, detail: 0 })
  fio.position.y = -0.045
  gota.add(fio)
  const pingo = sphere(0.046, DROP, { roughness: 0.08, detail: 0 })
  pingo.scale.y = 1.12
  pingo.position.y = -0.125
  gota.add(pingo)

  // ---- nuvem de espirro saindo da frente da cara ---------------------------
  cabeca.updateMatrix()
  const espirro = new THREE.Group()
  espirro.position.copy(new THREE.Vector3(-0.07, -0.05, 0.45).applyMatrix4(cabeca.matrix))
  espirro.quaternion.copy(cabeca.quaternion)
  minhoca.add(espirro)

  // cone de nuvens encostadas: nasce no bico/nariz e abre pra esquerda
  const sopro = new THREE.Vector3(-0.66, 0.34, 0.67).normalize()
  for (const [d, r, seed] of [
    [0.05, 0.05, 70], [0.15, 0.075, 71], [0.3, 0.1, 72], [0.5, 0.13, 73], [0.76, 0.165, 74],
  ] as const) {
    const nuvem = puff(r, '#ffffff', 6, seed, { roughness: 0.9 })
    nuvem.position.copy(sopro).multiplyScalar(d)
    espirro.add(nuvem)
  }
  for (let i = 0; i < 9; i++) {
    const d = 0.25 + rand() * 0.65
    const side = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.55 * d)
    const pingo2 = sphere(0.016 + rand() * 0.014, DROP, { roughness: 0.08, detail: 0 })
    pingo2.position.copy(sopro).multiplyScalar(d).add(side)
    espirro.add(pingo2)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'pico', object: base },
    { name: 'picos', group: 'pico', object: picos },
    { name: 'bandeira', group: 'bandeira', object: bandeira },
    { name: 'mastro', group: 'bandeira', object: mastro },
    { name: 'rasgo', group: 'furo', object: rasgo },
    { name: 'minhoca', group: 'minhoca', object: minhoca },
    { name: 'cabeca', group: 'minhoca', object: cabeca },
    { name: 'nariz', group: 'resfriado', object: nariz },
    { name: 'gota', group: 'resfriado', object: gota },
    { name: 'espirro', group: 'atchim', object: espirro },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Topo dos Andes: rocha cinza, vento gelado e picos nevados.',
    }),
    seq('picos-crescem', 'picos', 0.35, 1.0, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('bandeira-abre', 'bandeira', 1.9, 0.8, [ch('scale.x', 0.02, 1)], {
      ease: 'easeOut',
      caption: 'Os alpinistas deixaram a bandeira do CHILE estendida no pico.',
    }),
    seq('mastro-tomba', 'mastro', 1.9, 0.75, [ch('rotation.x', Math.PI / 2, 0)], { ease: 'easeIn' }),

    seq('bandeira-treme', 'bandeira', 3.7, 0.25, [ch('position.y', GY, GY + 0.05)], {
      ease: 'easeOut',
      caption: 'Lá embaixo, uma minhoca cava rumo ao Japão: FURA, FURA, FURA… e erra a curva.',
    }),
    seq('bandeira-assenta', 'bandeira', 3.95, 0.25, [ch('position.y', GY + 0.05, GY)], { ease: 'easeIn' }),
    seq(
      'rasgo-estoura',
      'rasgo',
      4.7,
      0.35,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('minhoca-brota', 'minhoca', 5.6, 1.1, [riseFrom(HOLE_POS[1], 2.4)], {
      ease: 'easeOut',
      caption: 'Ela rasga a bandeira de baixo pra cima: FUROU o CHILE — FUR-CHÜLD!',
    }),
    seq('minhoca-ginga', 'minhoca', 5.6, 1.6, [ch('rotation.z', 0.16, 0)], { ease: 'easeOut' }),
    seq('cabeca-olha', 'cabeca', 5.9, 1.2, [ch('rotation.z', -0.25, HEAD_RZ), ch('rotation.y', 0.2, HEAD_RY)], {
      ease: 'easeInOut',
    }),

    seq(
      'nariz-incha',
      'nariz',
      7.7,
      0.4,
      [ch('scale.x', 0.01, 1.25), ch('scale.y', 0.01, 1.25), ch('scale.z', 0.01, 1.25)],
      {
        ease: 'easeOut',
        caption: 'Lá em cima o vento corta: em dois segundos, nariz vermelho e pingando…',
      },
    ),
    seq(
      'nariz-assenta',
      'nariz',
      8.1,
      0.25,
      [ch('scale.x', 1.25, 1), ch('scale.y', 1.25, 1), ch('scale.z', 1.25, 1)],
    ),
    seq('gota-escorre', 'gota', 8.4, 0.8, [ch('scale.y', 0.01, 1), ch('scale.x', 0.5, 1)], { ease: 'easeIn' }),

    seq('cabeca-inspira', 'cabeca', 9.6, 0.6, [ch('rotation.x', HEAD_RX, HEAD_RX - 0.5)], {
      ease: 'easeOut',
      caption: 'A… A… ATCHIM! Boca de minhoca é bico, e o resumo sai de bico: IÁ É FUR-CHÜLD!',
    }),
    seq('cabeca-espirra', 'cabeca', 10.2, 0.18, [ch('rotation.x', HEAD_RX - 0.5, HEAD_RX)], { ease: 'easeIn' }),
    seq(
      'espirro-sai',
      'espirro',
      10.3,
      0.45,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('gota-estica', 'gota', 12.0, 0.35, [ch('scale.y', 1, 1.22)], {
      ease: 'easeOut',
      caption: 'Jag är förkyld. — Estou resfriado.',
    }),
    seq('gota-volta', 'gota', 12.35, 0.45, [ch('scale.y', 1.22, 1)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.75, 4.5], target: [0.0, 1.15, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-forkyld',
    contexto:
      "Saúde e trabalho: avisando o chefe ou os colegas, desmarcando um fika, explicando a fungação na reunião. Muito comum com 'lite': 'Jag är lite förkyld'.",
    fraseFonte: 'Estou resfriado.',
    fraseAlvo: 'Jag är förkyld.',
    pronuncia:
      "iá é för-CHÜLD ('är' na fala é só 'é'; 'för' fraquinho; o 'ky' é o chiado do tj — um CH macio, língua alta e lábios em bico de Ü curto, nunca K duro; força toda no CHÜLD e um D leve no fim)",
    ponteSonora:
      "IÁ É FUR-CHÜLD! (4 sílabas: iá-é-fur-CHÜLD; força toda no CHÜLD; IÁ É = 'jag är', o de sempre — o MESMO de 'Jag är sjuk', 'Jag är trött' e 'Jag är hungrig': I de IOGA, nunca J chiado, e É aberto e curto; FUR = o FURA sem o -A, o MESMO FUR do FURA-LOTE de 'Förlåt' e da FURADEIRA de 'Kan du förklara?': fraquinho e rápido — é o 'för' sem força; CHÜLD = o CHILE dito de BICO: o CH macio do português (o K sueco antes de Y vira esse chiado — nunca K duro, 'kild' está errado), a língua parada no I e os lábios espichados num bico de U, que dá o Ü, CURTO; corta o -E do Chile e fecha num D leve de ponta de língua: CHÜLD, uma sílaba só, nunca 'chí-le' nem 'chül-de'; nada a ver com o RRÜÜK soprado de 'Jag är sjuk' — lá é o sopro de assoar, aqui é o chiado do CH: doente é 'sjuk', resfriado é 'förkyld')",
    historia:
      'A minhoca ouviu que quem cava bem fundo sai no Japão e começou a FURAR: FURA, FURA, FURA, por baixo do Brasil inteiro... e errou a curva. Brota no topo dos Andes rasgando de baixo pra cima a bandeira que os alpinistas deixaram estendida no pico: FUROU o CHILE. Lá em cima o vento corta, e em dois segundos ela está de nariz vermelho, pingando, espirrando — ATCHIM! E como boca de minhoca é uma rodinha em bico, até o nome do país sai de bico quando ela resume a viagem: IÁ É FUR-CHÜLD! — furou o Chile e pegou um resfriado.',
  },
  createScene,
  refine: { organic: ['minhoca', 'cabeca'] },
}

export default card
