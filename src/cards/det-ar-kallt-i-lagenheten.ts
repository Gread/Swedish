import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Det är kallt i lägenheten." — DÊ É CÁLT-I… LÉ-GUEN-RRÊ-TEN!
 *
 * Janeiro em Estocolmo, aquecedor pifado: até o CALDO congelou na tigela, de
 * colher em pé (CÁLT, a palavra encolhida de frio). A ovelha tosa a própria lã,
 * tricota uma LEGGING cor-de-rosa (LÉ-GUEN), sopra o bafo nos cascos (RRÊ) e
 * bate o caldo-pedra no aquecedor gelado: TEN! TEN!
 *
 * Diorama: piso de tábuas claras com geada, parede creme com janela embaçada
 * e cristais nos cantos, aquecedor branco de colunas com três pingentes; a
 * ovelha tosada (pele rosa arrepiada, cabeça preta) em pé ao lado dele, monte
 * de lã no chão e o novelo com as agulhas. O rosa-chiclete da legging é o
 * único acento saturado; o anel de impacto é amarelo-claro, de luz.
 */

const PISO = '#d8c09c'
const PISO_RIPA = '#cbb08a'
const PISO_BORDA = '#9c7a52'
const GEADA = '#e4eef6'
const PAREDE = '#e4dac4'
const PAREDE_LISTRA = '#d9cdb3'
const RODAPE = '#f4f1ea'
const MOLDURA = '#f7f5f0'
const VIDRO = '#c3d6e3'
const RADIADOR = '#f1f3f3'
const RADIADOR_SOMBRA = '#dfe3e5'
const CANO = '#b9c0c6'
const GELO = '#8fd0ef'
const LA = '#f4f0e6'
const PELE = '#f5cac1'
const PELE_CLARA = '#f6d3cc'
const ARREPIO = '#f0bdb5'
const CARA = '#2c2527'
const CARA_CLARA = '#4a3f41'
const ORELHA_IN = '#c98d8d'
const CASCO = '#262020'
const LEGGING = '#ff4f9e' // acento saturado RESERVADO: a LEGGING (LÉ-GUEN)
const LEGGING_ESC = '#e0388a'
const TIGELA = '#7b4a2b'
const TIGELA_CLARA = '#a8714a'
const CALDO = '#c47734'
const CENOURA = '#ee8a2e'
const ERVILHA = '#6f9a3c'
const METAL = '#c8ced3'
const AGULHA = '#d6b07a'
const IMPACTO = '#ffbf1f'

const FY = 0.12 // topo do assoalho

// parede (e o aquecedor encostado nela)
const WALL_X = -0.3
const WALL_Z = -1.15
const WALL_ROT = 0.1
const WIN_X = -0.45 // centro da janela/aquecedor no espaço da parede
const RAD_Z = 0.07 + 0.03 + 0.1 // frente da parede + folga + meia profundidade
const RAD_TOP = 0.75 // topo do aquecedor (onde a tigela bate)
const BOWL_X = 0.4 // tigela na ponta direita do aquecedor

// ovelha
const SHEEP_X = 0.3
const SHEEP_Z = -0.6
const SHEEP_ROT = -0.15
const HEAD_ROT = 0.75
const SHOULDER_Y = 1.18

const CAM: [number, number, number] = [0.6, 1.8, 2.85]
const TARGET: [number, number, number] = [-0.05, 0.92, -0.6]

type V3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula de a até b — membros. */
function limb(r: number, a: V3 | THREE.Vector3, b: V3 | THREE.Vector3, color: string, opts?: MatOpts) {
  const va = Array.isArray(a) ? new THREE.Vector3(...a) : a.clone()
  const vb = Array.isArray(b) ? new THREE.Vector3(...b) : b.clone()
  const dir = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, dir.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/** Torna translúcido tudo que estiver debaixo do objeto (gelo, bafo). */
function translucent(obj: THREE.Object3D, opacity: number, shadow = false) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const mt = m.material as THREE.Material
    mt.transparent = true
    mt.opacity = opacity
    mt.depthWrite = false
    m.castShadow = shadow
  })
}

/** Espaço da parede → mundo. */
function wallToWorld(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z)
    .applyAxisAngle(UP, WALL_ROT)
    .add(new THREE.Vector3(WALL_X, FY, WALL_Z))
}

/** Cristal de gelo de seis pontas, no plano xy. */
function crystal(size: number) {
  const g = new THREE.Group()
  for (let k = 0; k < 3; k++) {
    const arm = rbox(size, size * 0.12, 0.008, size * 0.05, '#ffffff', {
      emissive: '#eaf6ff',
      emissiveIntensity: 0.5,
    })
    arm.rotation.z = (k * Math.PI) / 3
    g.add(arm)
  }
  return g
}

/**
 * Leque de impacto (quadrinhos): meia estrela de pontas alternadas, aberta
 * para cima a partir do ponto da pancada, extrudada.
 */
function burst(rOut: number, rIn: number, spikes: number, color: string, emissive: number) {
  const shape = new THREE.Shape()
  shape.moveTo(rIn * 0.5, 0)
  const n = spikes * 2
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI
    const r = i % 2 === 1 ? rOut * (i % 4 === 1 ? 1 : 0.82) : rIn
    shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  shape.lineTo(-rIn * 0.5, 0)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
  })
  const m = new THREE.Mesh(geo, mat(color, { emissive: color, emissiveIntensity: emissive, roughness: 0.5 }))
  m.castShadow = false
  m.receiveShadow = false
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- piso de tábuas claras com geada --------------------------------------
  const base = new THREE.Group()

  const disco = cylinder(2.62, 2.7, 0.12, PISO_BORDA, { roughness: 0.7 })
  disco.position.y = 0.06
  base.add(disco)

  const W = 0.36
  for (let i = -7; i <= 7; i++) {
    const z = i * W
    const half = Math.sqrt(Math.max(0, 2.58 * 2.58 - (Math.abs(z) + W / 2) ** 2))
    if (half < 0.2) continue
    // cada fileira em duas tábuas, com a emenda num ponto sorteado
    const cut = -half + (0.35 + rand() * 0.3) * half * 2
    for (const [x0, x1, tone] of [
      [-half, cut - 0.008, i % 2 === 0 ? PISO : PISO_RIPA],
      [cut + 0.008, half, i % 2 === 0 ? PISO_RIPA : PISO],
    ] as const) {
      const ripa = rbox(x1 - x0, 0.014, W - 0.018, 0.006, tone, { roughness: 0.62 })
      ripa.position.set((x0 + x1) / 2, FY + 0.007, z)
      base.add(ripa)
    }
  }

  // geada: faixa junto do rodapé, placas pequenas e cristais soltos no piso
  const faixaGeada = rbox(3.2, 0.012, 0.32, 0.006, GEADA, { roughness: 0.3, detail: 0 })
  faixaGeada.position.copy(new THREE.Vector3(0, 0.014, 0.25).applyAxisAngle(UP, WALL_ROT).add(new THREE.Vector3(WALL_X, FY, WALL_Z)))
  faixaGeada.rotation.y = WALL_ROT
  translucent(faixaGeada, 0.65)
  base.add(faixaGeada)
  for (let k = 0; k < 18; k++) {
    const c = crystal(0.06 + rand() * 0.05)
    c.rotation.set(-Math.PI / 2, 0, rand() * Math.PI)
    const a = rand() * Math.PI * 2
    const r = 0.4 + rand() * 1.9
    c.position.set(Math.cos(a) * r * 1.1, FY + 0.016, -0.5 + Math.sin(a) * r * 0.7)
    base.add(c)
  }
  for (let k = 0; k < 22; k++) {
    let x: number
    let z: number
    if (k < 10) {
      x = -2.0 + rand() * 3.6
      z = WALL_Z + 0.25 + rand() * 0.55
    } else {
      const a = rand() * Math.PI * 2
      const r = 1.95 + rand() * 0.45
      x = Math.cos(a) * r
      z = Math.sin(a) * r
    }
    const placa = sphere(0.08 + rand() * 0.12, GEADA, { roughness: 0.3, detail: 0 })
    placa.scale.set(1 + rand() * 0.6, 0.03, 0.7 + rand() * 0.5)
    placa.rotation.y = rand() * Math.PI
    placa.position.set(x, FY + 0.012, z)
    translucent(placa, 0.7)
    base.add(placa)
  }

  root.add(base)

  // ---- parede creme com janela embaçada --------------------------------------
  const parede = new THREE.Group()
  parede.position.set(WALL_X, FY, WALL_Z)
  parede.rotation.y = WALL_ROT
  root.add(parede)

  const painel = rbox(3.3, 2.3, 0.14, 0.04, PAREDE, { roughness: 0.9 })
  painel.position.y = 1.15
  parede.add(painel)
  // papel de parede listrado, bem sutil
  for (let x = -1.5; x <= 1.51; x += 0.25) {
    const listra = rbox(0.045, 2.1, 0.006, 0.002, PAREDE_LISTRA, { roughness: 0.9 })
    listra.position.set(x, 1.17, 0.071)
    parede.add(listra)
  }
  const rodape = rbox(3.34, 0.14, 0.18, 0.03, RODAPE, { roughness: 0.5 })
  rodape.position.y = 0.07
  parede.add(rodape)
  const cimalha = rbox(3.36, 0.07, 0.2, 0.025, RODAPE, { roughness: 0.5 })
  cimalha.position.y = 2.3
  parede.add(cimalha)

  const janela = new THREE.Group()
  janela.position.set(WIN_X, 1.58, 0.07)
  parede.add(janela)

  const vidro = rbox(0.9, 0.74, 0.03, 0.01, VIDRO, {
    roughness: 0.3,
    emissive: '#b3cde0',
    emissiveIntensity: 0.45,
  })
  janela.add(vidro)
  for (const [w, h, x, y] of [
    [1.06, 0.08, 0, 0.41],
    [1.06, 0.08, 0, -0.41],
    [0.08, 0.9, -0.49, 0],
    [0.08, 0.9, 0.49, 0],
    [0.055, 0.76, 0, 0],
  ] as const) {
    const ripa = rbox(w, h, 0.09, 0.02, MOLDURA, { roughness: 0.4 })
    ripa.position.set(x, y, 0.03)
    janela.add(ripa)
  }
  const peitoril = rbox(1.18, 0.05, 0.16, 0.02, MOLDURA, { roughness: 0.4 })
  peitoril.position.set(0, -0.47, 0.08)
  janela.add(peitoril)

  // geada nos cantos dos dois vidros + cristais
  for (const px of [-0.225, 0.225]) {
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const cx = px + sx * 0.19
        const cy = sy * 0.34
        const leque = sphere(0.1, '#f3f8fc', { roughness: 0.6, detail: 0 })
        leque.scale.set(1, 1, 0.12)
        leque.position.set(cx, cy, 0.018)
        janela.add(leque)
        const c = crystal(0.075 + rand() * 0.03)
        c.position.set(cx - sx * 0.1, cy - sy * 0.07, 0.03)
        c.rotation.z = rand()
        janela.add(c)
      }
    }
  }

  // ---- aquecedor branco de colunas (o element) -------------------------------
  const aquecedor = new THREE.Group()
  aquecedor.position.copy(wallToWorld(WIN_X, 0, RAD_Z))
  aquecedor.rotation.y = WALL_ROT
  root.add(aquecedor)

  const N = 9
  const PITCH = 0.115
  for (let i = 0; i < N; i++) {
    const col = rbox(0.096, 0.6, 0.17, 0.045, RADIADOR, { roughness: 0.32 })
    col.position.set((i - (N - 1) / 2) * PITCH, 0.42, 0)
    aquecedor.add(col)
  }
  const tampo = rbox(N * PITCH + 0.03, 0.06, 0.2, 0.025, RADIADOR, { roughness: 0.32 })
  tampo.position.y = RAD_TOP - 0.03
  aquecedor.add(tampo)
  const rodaBaixo = rbox(N * PITCH, 0.05, 0.13, 0.02, RADIADOR_SOMBRA, { roughness: 0.35 })
  rodaBaixo.position.y = 0.15
  aquecedor.add(rodaBaixo)
  for (const sx of [-1, 1]) {
    const pe = rbox(0.07, 0.14, 0.14, 0.025, RADIADOR_SOMBRA, { roughness: 0.35 })
    pe.position.set(sx * 0.42, 0.07, 0)
    aquecedor.add(pe)
  }
  // cano e válvula termostática na ponta esquerda
  const cano = cylinder(0.022, 0.022, 0.24, CANO, { roughness: 0.3, metalness: 0.6 })
  cano.position.set(-0.6, 0.12, -0.02)
  aquecedor.add(cano)
  const ligacao = cylinder(0.022, 0.022, 0.12, CANO, { roughness: 0.3, metalness: 0.6 })
  ligacao.rotation.z = Math.PI / 2
  ligacao.position.set(-0.55, 0.22, -0.02)
  aquecedor.add(ligacao)
  const valvula = cylinder(0.035, 0.035, 0.1, CANO, { roughness: 0.3, metalness: 0.6 })
  valvula.rotation.z = Math.PI / 2
  valvula.position.set(-0.56, 0.6, 0)
  aquecedor.add(valvula)
  const termostato = cylinder(0.055, 0.055, 0.1, RADIADOR, { roughness: 0.4 })
  termostato.rotation.z = Math.PI / 2
  termostato.position.set(-0.64, 0.6, 0)
  aquecedor.add(termostato)
  for (let k = 0; k < 3; k++) {
    const sulco = torus(0.056, 0.006, RADIADOR_SOMBRA, { roughness: 0.4 })
    sulco.rotation.y = Math.PI / 2
    sulco.position.set(-0.61 - k * 0.025, 0.6, 0)
    aquecedor.add(sulco)
  }
  const marca = rbox(0.02, 0.03, 0.012, 0.004, '#4f86c6', { roughness: 0.4 })
  marca.position.set(-0.64, 0.66, 0.0)
  aquecedor.add(marca)
  // crosta de geada no tampo (longe da tigela)
  for (const [x, z, r] of [[-0.42, 0.02, 0.07], [-0.27, -0.03, 0.09], [-0.1, 0.03, 0.06], [0.04, -0.02, 0.07]] as const) {
    const crosta = sphere(r, GEADA, { roughness: 0.4, detail: 0 })
    crosta.scale.set(1.4, 0.16, 0.9)
    crosta.position.set(x, RAD_TOP, z)
    aquecedor.add(crosta)
  }

  // ---- três pingentes de gelo (crescem para baixo) ---------------------------
  const pingentes = new THREE.Group()
  pingentes.position.set(0, RAD_TOP - 0.06, 0.1)
  aquecedor.add(pingentes)
  for (const [x, h, r] of [[-0.36, 0.26, 0.036], [-0.13, 0.36, 0.045], [0.1, 0.22, 0.033]] as const) {
    const gota = sphere(r * 1.15, GELO, { roughness: 0.1 })
    gota.scale.y = 0.6
    gota.position.set(x, 0, 0)
    pingentes.add(gota)
    const ponta = cone(r, h, GELO, { roughness: 0.1 })
    ponta.rotation.x = Math.PI
    ponta.position.set(x, -h / 2, 0)
    pingentes.add(ponta)
  }
  translucent(pingentes, 0.82)

  // ---- tigela de caldo congelado, colher em pé -------------------------------
  const bowlPos = wallToWorld(WIN_X + BOWL_X, RAD_TOP, RAD_Z + 0.03)
  const tigela = new THREE.Group()
  tigela.position.copy(bowlPos)
  tigela.rotation.y = WALL_ROT
  root.add(tigela)
  const tigelaCorpo = new THREE.Group()
  tigelaCorpo.scale.setScalar(1.2)
  tigela.add(tigelaCorpo)

  const cuia = lathe(
    [
      [0, 0], [0.1, 0], [0.105, 0.012], [0.098, 0.022], [0.15, 0.06], [0.185, 0.115],
      [0.198, 0.15], [0.186, 0.155], [0.176, 0.125], [0.145, 0.075], [0, 0.055],
    ],
    TIGELA,
    { roughness: 0.28 },
  )
  tigelaCorpo.add(cuia)
  const faixa = torus(0.19, 0.008, TIGELA_CLARA, { roughness: 0.3 })
  faixa.rotation.x = Math.PI / 2
  faixa.position.y = 0.128
  tigelaCorpo.add(faixa)

  const geadaBorda = torus(0.192, 0.012, '#eef6fb', { roughness: 0.5 })
  geadaBorda.rotation.x = Math.PI / 2
  geadaBorda.position.y = 0.152
  tigelaCorpo.add(geadaBorda)
  for (const [a, h] of [[0.5, 0.07], [1.1, 0.05], [1.7, 0.08], [2.4, 0.055]] as const) {
    const pingo = cone(0.014, h, GELO, { roughness: 0.1 })
    pingo.rotation.x = Math.PI
    pingo.position.set(Math.cos(a) * 0.196, 0.15 - h / 2, Math.sin(a) * 0.196)
    tigelaCorpo.add(pingo)
  }
  const bloco = cylinder(0.178, 0.14, 0.07, CALDO, { roughness: 0.18 })
  bloco.position.y = 0.105
  tigelaCorpo.add(bloco)
  for (const [x, z, s] of [[0.07, 0.06, 1], [-0.08, 0.04, 0.85], [0.02, -0.09, 0.9]] as const) {
    const rodela = cylinder(0.028 * s, 0.028 * s, 0.012, CENOURA, { roughness: 0.3 })
    rodela.position.set(x, 0.142, z)
    rodela.rotation.set(rand() * 0.2, 0, rand() * 0.2)
    tigelaCorpo.add(rodela)
  }
  for (const [x, z] of [[-0.03, 0.1], [0.11, -0.04], [-0.11, -0.05], [0.05, 0.12]] as const) {
    const ervilha = sphere(0.015, ERVILHA, { roughness: 0.4 })
    ervilha.position.set(x, 0.142, z)
    tigelaCorpo.add(ervilha)
  }
  for (const [x, z] of [[-0.09, 0.09], [0.12, 0.05], [-0.02, -0.12]] as const) {
    const c = crystal(0.05)
    c.rotation.x = -Math.PI / 2
    c.position.set(x, 0.143, z)
    tigelaCorpo.add(c)
  }
  // colher cravada em pé no caldo-pedra
  const colher = new THREE.Group()
  colher.position.set(-0.02, 0.14, 0.01)
  colher.rotation.set(0.18, 0, -0.1)
  tigelaCorpo.add(colher)
  const haste = cylinder(0.011, 0.015, 0.3, METAL, { roughness: 0.22, metalness: 0.8 })
  haste.position.y = 0.15
  colher.add(haste)
  const ponteira = sphere(0.028, METAL, { roughness: 0.22, metalness: 0.8 })
  ponteira.scale.set(1, 1.5, 0.45)
  ponteira.position.y = 0.31
  colher.add(ponteira)

  // ---- OVELHA tosada em pé ---------------------------------------------------
  const ovelha = new THREE.Group()
  ovelha.position.set(SHEEP_X, FY, SHEEP_Z)
  ovelha.rotation.y = SHEEP_ROT
  root.add(ovelha)

  for (const side of [-1, 1]) {
    const x = side * 0.13
    ovelha.add(limb(0.085, [x, 0.12, 0.01], [x, 0.62, 0.01], PELE, { roughness: 0.7 }))
    const coxa = sphere(0.105, PELE, { roughness: 0.7 })
    coxa.scale.set(1, 1.1, 1)
    coxa.position.set(x, 0.66, 0)
    ovelha.add(coxa)
    const casco = cylinder(0.072, 0.088, 0.12, CASCO, { roughness: 0.45 })
    casco.position.set(x, 0.06, 0.04)
    ovelha.add(casco)
    const fenda = rbox(0.014, 0.1, 0.05, 0.005, '#110c0c', { roughness: 0.5 })
    fenda.position.set(x, 0.06, 0.11)
    ovelha.add(fenda)
  }
  const pelve = sphere(0.24, PELE, { roughness: 0.7 })
  pelve.scale.set(1, 0.75, 0.95)
  pelve.position.y = 0.75
  ovelha.add(pelve)
  const tronco = capsule(0.258, 0.2, PELE, { roughness: 0.7 })
  tronco.position.y = 1.01
  ovelha.add(tronco)
  const peito = sphere(0.21, PELE_CLARA, { roughness: 0.7 })
  peito.scale.set(1.05, 1.05, 0.6)
  peito.position.set(0, 0.97, 0.14)
  ovelha.add(peito)
  for (const side of [-1, 1]) {
    const ombro = sphere(0.1, PELE, { roughness: 0.7 })
    ombro.position.set(side * 0.24, SHOULDER_Y, 0)
    ovelha.add(ombro)
  }
  ovelha.add(limb(0.11, [0, 1.26, 0], [0, 1.44, 0.06], PELE, { roughness: 0.7 }))

  // arrepios: bolinhas espalhadas na frente e nos lados do tronco
  for (let k = 0; k < 70; k++) {
    const y = 0.92 + rand() * 0.38
    const th = (rand() - 0.5) * 3.6
    const rr = y > 1.11 ? Math.sqrt(Math.max(0, 0.258 ** 2 - (y - 1.11) ** 2)) : 0.258
    if (rr < 0.08) continue
    const b = sphere(0.0055 + rand() * 0.0025, ARREPIO, { roughness: 0.6 }, 10)
    b.position.set(Math.sin(th) * rr * 0.995, y, Math.cos(th) * rr * 0.995)
    ovelha.add(b)
  }

  // ---- cabeça preta, orelhas caídas, tufo de lã ------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.53, 0.08)
  cabeca.rotation.set(0.12, HEAD_ROT, 0)
  ovelha.add(cabeca)

  const cranio = sphere(0.19, CARA, { roughness: 0.6 })
  cranio.scale.set(0.95, 1, 1)
  cabeca.add(cranio)
  const focinho = sphere(0.135, CARA, { roughness: 0.6 })
  focinho.scale.set(0.82, 0.8, 1.35)
  focinho.position.set(0, -0.08, 0.16)
  focinho.rotation.x = 0.35
  cabeca.add(focinho)
  const ponta = sphere(0.085, CARA_CLARA, { roughness: 0.55 })
  ponta.scale.set(1.05, 0.85, 0.75)
  ponta.position.set(0, -0.13, 0.3)
  cabeca.add(ponta)
  for (const side of [-1, 1]) {
    const narina = sphere(0.016, '#0f0b0c', { roughness: 0.4 })
    narina.position.set(side * 0.035, -0.105, 0.36)
    cabeca.add(narina)
  }
  // boca em "o", soprando
  const boca = torus(0.024, 0.009, '#7a3b40', { roughness: 0.5 })
  boca.position.set(0, -0.19, 0.31)
  boca.rotation.x = -0.4
  cabeca.add(boca)
  const bocaFundo = sphere(0.022, '#1a0d0f', { roughness: 0.6 })
  bocaFundo.position.set(0, -0.19, 0.3)
  bocaFundo.scale.z = 0.5
  cabeca.add(bocaFundo)

  for (const side of [-1, 1]) {
    const esclera = sphere(0.056, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(side * 0.095, 0.035, 0.15)
    const pupila = sphere(0.028, '#141010', { roughness: 0.2 })
    pupila.position.set(side * 0.09, 0.02, 0.18)
    const brilho = sphere(0.009, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.8 })
    brilho.position.set(side * 0.08, 0.035, 0.205)
    cabeca.add(esclera, pupila, brilho)

    // sobrancelha aflita: ponta de dentro levantada
    const sobr = capsule(0.011, 0.06, '#8a7f80', { roughness: 0.6 })
    sobr.rotation.z = Math.PI / 2 - side * 0.45
    sobr.position.set(side * 0.095, 0.11, 0.16)
    cabeca.add(sobr)

    // orelha caída para fora e para baixo, achatada de frente
    const orelha = new THREE.Group()
    orelha.position.set(side * 0.16, 0.04, -0.01)
    orelha.rotation.z = -side * (Math.PI / 2 + 0.55)
    const aba = capsule(0.048, 0.13, CARA, { roughness: 0.6 })
    aba.scale.set(1, 1, 0.42)
    aba.position.y = 0.1
    orelha.add(aba)
    const dentro = capsule(0.028, 0.1, ORELHA_IN, { roughness: 0.6 })
    dentro.scale.set(1, 1, 0.4)
    dentro.position.set(0, 0.11, 0.016)
    orelha.add(dentro)
    cabeca.add(orelha)
  }
  const tufo = puff(0.1, LA, 9, 17, { roughness: 0.95 })
  tufo.scale.set(1.1, 0.95, 1)
  tufo.position.set(0, 0.18, 0.02)
  cabeca.add(tufo)

  root.updateMatrixWorld(true)

  // ---- legging de tricô rosa (cresce dos cascos para a cintura) --------------
  const legging = new THREE.Group()
  ovelha.add(legging)

  const quadril = lathe(
    [[0, 0.585], [0.12, 0.59], [0.2, 0.615], [0.25, 0.655], [0.268, 0.71], [0.268, 0.77], [0.264, 0.845], [0, 0.845]],
    LEGGING,
    { roughness: 0.92 },
  )
  legging.add(quadril)
  const cos = torus(0.262, 0.018, LEGGING_ESC, { roughness: 0.92 })
  cos.rotation.x = Math.PI / 2
  cos.position.y = 0.835
  legging.add(cos)
  // pernas afuniladas: coxa grossa que encosta na outra, tornozelo fino
  const PERNA: [number, number][] = [
    [0, 0.13], [0.093, 0.13], [0.096, 0.2], [0.106, 0.33], [0.122, 0.46], [0.136, 0.58], [0.13, 0.68], [0, 0.68],
  ]
  const raioPerna = (y: number) => {
    for (let i = 1; i < PERNA.length; i++) {
      const [r1, y1] = PERNA[i]
      const [r0, y0] = PERNA[i - 1]
      if (y >= y0 && y <= y1 && y1 > y0) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
    }
    return 0.1
  }
  for (const side of [-1, 1]) {
    const x = side * 0.13
    const perna = lathe(PERNA, LEGGING, { roughness: 0.92 })
    perna.position.set(x, 0, 0.01)
    legging.add(perna)
    for (let k = 0; k < 6; k++) {
      const y = 0.21 + k * 0.055
      const anel = torus(raioPerna(y), 0.0075, LEGGING_ESC, { roughness: 0.92 })
      anel.rotation.x = Math.PI / 2
      anel.position.set(x, y, 0.01)
      legging.add(anel)
    }
    const punho = torus(0.093, 0.022, LEGGING_ESC, { roughness: 0.92 })
    punho.rotation.x = Math.PI / 2
    punho.position.set(x, 0.145, 0.01)
    legging.add(punho)
  }

  // ---- pata direita em concha diante do focinho (RRÊ) ------------------------
  const mouth = new THREE.Vector3(0, -0.19, 0.32).applyMatrix4(cabeca.matrix)
  const faceDir = new THREE.Vector3(0, 0, 1).applyQuaternion(cabeca.quaternion)
  const hoofTarget = mouth.clone().addScaledVector(faceDir, 0.24).add(new THREE.Vector3(0.04, -0.05, 0))

  const pata = new THREE.Group()
  const shoulderR = new THREE.Vector3(0.25, SHOULDER_Y, 0)
  pata.position.copy(shoulderR)
  ovelha.add(pata)
  {
    const hoof = hoofTarget.clone().sub(shoulderR)
    const elbow = new THREE.Vector3(0.12, -0.2, 0.2)
    pata.add(limb(0.074, [0, 0, 0], elbow, PELE, { roughness: 0.7 }))
    const dir = hoof.clone().sub(elbow).normalize()
    const hoofBase = hoof.clone().addScaledVector(dir, -0.05)
    pata.add(limb(0.064, elbow, hoofBase, PELE, { roughness: 0.7 }))
    const cotovelo = sphere(0.075, PELE, { roughness: 0.7 })
    cotovelo.position.copy(elbow)
    pata.add(cotovelo)
    const casco = cylinder(0.07, 0.06, 0.1, CASCO, { roughness: 0.45 })
    casco.position.copy(hoof)
    casco.quaternion.setFromUnitVectors(UP, dir)
    pata.add(casco)
    for (let k = 0; k < 6; k++) {
      const b = sphere(0.012, ARREPIO, { roughness: 0.6 }, 10)
      const t = 0.2 + rand() * 0.6
      const p = elbow.clone().lerp(hoofBase, t)
      p.x += 0.055
      b.position.copy(p)
      pata.add(b)
    }
  }

  // ---- bafo branco translúcido, da boca até o casco --------------------------
  const bafo = new THREE.Group()
  bafo.position.copy(mouth)
  ovelha.add(bafo)
  {
    const span = hoofTarget.clone().sub(mouth)
    for (const [t, r, seed] of [[0.18, 0.055, 3], [0.42, 0.085, 5], [0.66, 0.105, 7]] as const) {
      const nuvem = puff(r, '#ffffff', 5, seed, { roughness: 0.9, detail: 0 })
      nuvem.position.copy(span.clone().multiplyScalar(t))
      bafo.add(nuvem)
    }
    // fiapos de vapor subindo
    for (const [dx, dy, r] of [[0.03, 0.12, 0.04], [-0.01, 0.19, 0.03]] as const) {
      const fiapo = sphere(r, '#ffffff', { roughness: 0.9, detail: 0 })
      fiapo.position.copy(span).multiplyScalar(0.8).add(new THREE.Vector3(dx, dy, 0))
      bafo.add(fiapo)
    }
  }
  translucent(bafo, 0.5)

  // ---- braço esquerdo esticado até a tigela (TEN!) ---------------------------
  const braco = new THREE.Group()
  const shoulderL = new THREE.Vector3(-0.25, SHOULDER_Y, 0)
  braco.position.copy(shoulderL)
  ovelha.add(braco)

  // ponto de pegada: borda da tigela voltada para o ombro
  const shoulderWorld = ovelha.localToWorld(shoulderL.clone())
  const toShoulder = shoulderWorld.clone().sub(bowlPos).setY(0).normalize()
  const gripWorld = bowlPos.clone().addScaledVector(toShoulder, 0.235).setY(bowlPos.y + 0.12)
  const gripLocal = ovelha.worldToLocal(gripWorld.clone())
  const reach = gripLocal.clone().sub(shoulderL)
  const L = reach.length()
  const d = reach.clone().normalize()
  const ARM_Z = Math.asin(THREE.MathUtils.clamp(d.x, -1, 1))
  const ARM_X = Math.atan2(-d.z, -d.y)
  const casco = new THREE.Group()
  {
    braco.add(limb(0.074, [0, 0, 0], [0, -L * 0.45, 0.02], PELE, { roughness: 0.7 }))
    braco.add(limb(0.064, [0, -L * 0.45, 0.02], [0, -L + 0.07, 0], PELE, { roughness: 0.7 }))
    casco.position.y = -L + 0.04
    braco.add(casco)
    const ungula = cylinder(0.068, 0.074, 0.1, CASCO, { roughness: 0.45 })
    casco.add(ungula)
    for (let k = 0; k < 5; k++) {
      const b = sphere(0.012, ARREPIO, { roughness: 0.6 }, 10)
      b.position.set(-0.03 + rand() * 0.02, -0.08 - rand() * (L - 0.25), 0.062)
      braco.add(b)
    }
  }
  // pose erguida (meio da pancada) e onde a tigela fica nela
  const ARM_Z_UP = ARM_Z - 0.55
  const ARM_X_UP = ARM_X - 0.1
  braco.rotation.set(ARM_X, 0, ARM_Z)
  root.updateMatrixWorld(true)
  const hoofDown = casco.getWorldPosition(new THREE.Vector3())
  braco.rotation.set(ARM_X_UP, 0, ARM_Z_UP)
  root.updateMatrixWorld(true)
  const hoofUp = casco.getWorldPosition(new THREE.Vector3())
  braco.rotation.set(ARM_X, 0, ARM_Z)
  root.updateMatrixWorld(true)
  const bowlUp = bowlPos.clone().add(hoofUp.clone().sub(hoofDown))
  const ARM_Z_REST = -0.28
  const ARM_X_REST = 0.05

  // ---- monte de lã tosada -----------------------------------------------------
  const la = new THREE.Group()
  const LA_POS = new THREE.Vector3(0.92, FY, -0.45)
  la.position.copy(LA_POS)
  root.add(la)
  const monte = new THREE.Group()
  monte.scale.setScalar(0.85)
  la.add(monte)
  for (const [x, y, z, r, seed] of [
    [0, 0.13, 0, 0.24, 11], [0.27, 0.1, 0.08, 0.2, 12], [-0.24, 0.1, 0.1, 0.19, 13],
    [0.08, 0.1, -0.24, 0.2, 14], [-0.1, 0.25, -0.05, 0.16, 15], [0.18, 0.22, -0.1, 0.14, 16],
  ] as const) {
    const tufoLa = puff(r, LA, 6, seed, { roughness: 0.95 })
    tufoLa.position.set(x, y * 0.85, z)
    tufoLa.scale.y = 0.72
    monte.add(tufoLa)
  }
  for (const [x, z, r] of [[-0.5, 0.35, 0.07], [0.45, 0.42, 0.06], [-0.62, -0.1, 0.05]] as const) {
    const fiapo = puff(r, LA, 4, 20 + r * 100, { roughness: 0.95 })
    fiapo.position.set(x, r * 0.6, z)
    fiapo.scale.y = 0.65
    monte.add(fiapo)
  }
  // casaco de lã: o monte começa vestido na ovelha e cai no chão
  const torsoWorld = ovelha.localToWorld(new THREE.Vector3(0, 0.95, 0))
  const COAT_SY = 2.8
  const COAT_Y = torsoWorld.y - 0.145 * COAT_SY

  // ---- novelo rosa com as agulhas, fio até a legging -------------------------
  const novelo = new THREE.Group()
  const NOV = new THREE.Vector3(-0.32, FY, -0.05)
  novelo.position.copy(NOV)
  root.add(novelo)
  {
    const bola = sphere(0.12, LEGGING, { roughness: 0.92 })
    bola.position.y = 0.115
    novelo.add(bola)
    for (let k = 0; k < 6; k++) {
      const volta = torus(0.118, 0.008, LEGGING_ESC, { roughness: 0.92 })
      volta.position.y = 0.115
      volta.rotation.set(rand() * Math.PI, rand() * Math.PI, 0)
      novelo.add(volta)
    }
    for (const [rz, ry] of [[0.55, 0.4], [-0.6, -0.3]] as const) {
      const agulha = new THREE.Group()
      agulha.position.y = 0.13
      agulha.rotation.set(0.25, ry, rz)
      const vara = cylinder(0.01, 0.01, 0.46, AGULHA, { roughness: 0.4 })
      vara.position.y = 0.08
      agulha.add(vara)
      const bico = cone(0.01, 0.03, AGULHA, { roughness: 0.4 })
      bico.position.y = -0.165
      bico.rotation.x = Math.PI
      agulha.add(bico)
      const botao = sphere(0.022, '#5f86c4', { roughness: 0.35 })
      botao.position.y = 0.315
      agulha.add(botao)
      novelo.add(agulha)
    }
    // fio rosa correndo pelo chão até o tornozelo da legging
    const ankle = ovelha.localToWorld(new THREE.Vector3(-0.13, 0.17, 0.08)).sub(NOV)
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.06, 0.04),
      new THREE.Vector3(0.3, 0.022, 0.02),
      new THREE.Vector3(0.45, 0.022, -0.3),
      ankle.clone().add(new THREE.Vector3(0.0, -0.12, 0.08)),
      ankle,
    ])
    const fio = new THREE.Mesh(
      new THREE.TubeGeometry(curva, 64, 0.009, 8, false),
      mat(LEGGING, { roughness: 0.9, size: 0.6 }),
    )
    fio.castShadow = true
    novelo.add(fio)
  }

  // ---- impacto amarelo na pancada (TEN!) -------------------------------------
  // estrela de quadrinhos ATRÁS da tigela (entre o aquecedor e a parede): a
  // metade de baixo some atrás do aquecedor, as pontas de cima explodem em
  // volta da tigela; mais lascas de gelo voando do caldo-pedra
  const impacto = new THREE.Group()
  impacto.position.copy(wallToWorld(WIN_X + BOWL_X, RAD_TOP - 0.01, 0.085))
  impacto.rotation.y = WALL_ROT
  root.add(impacto)
  {
    // achatada na vertical: as pontas de cima param antes do peitoril
    const clarao = new THREE.Group()
    clarao.scale.set(1.1, 0.8, 1)
    impacto.add(clarao)
    const contorno = burst(0.47, 0.26, 9, '#f08a12', 0.25)
    contorno.position.z = -0.012
    clarao.add(contorno)
    const estrela = burst(0.42, 0.23, 9, IMPACTO, 0.45)
    clarao.add(estrela)
    for (const [x, y, s, rz] of [
      [-0.34, 0.2, 0.05, 0.5], [0.36, 0.22, 0.045, -0.6], [-0.22, 0.36, 0.035, 1.2], [0.26, 0.4, 0.032, 0.3],
    ] as const) {
      const lasca = cone(s * 0.6, s * 1.6, GELO, { roughness: 0.15 }, 4)
      lasca.position.set(x, y, 0.3)
      lasca.rotation.set(0.3, 0.2, rz)
      impacto.add(lasca)
    }
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'parede', group: 'sala', object: parede },
    { name: 'aquecedor', group: 'aquecedor', object: aquecedor },
    { name: 'pingentes', group: 'aquecedor', object: pingentes },
    { name: 'tigela', group: 'caldo', object: tigela },
    { name: 'ovelha', group: 'ovelha', object: ovelha },
    { name: 'cabeca', group: 'ovelha', object: cabeca },
    { name: 'braco', group: 'ovelha', object: braco },
    { name: 'pata', group: 'ovelha', object: pata },
    { name: 'la', group: 'tosa', object: la },
    { name: 'legging', group: 'legging', object: legging },
    { name: 'novelo', group: 'legging', object: novelo },
    { name: 'bafo', group: 're', object: bafo },
    { name: 'impacto', group: 'ten', object: impacto },
  ]

  // ---- montagem ------------------------------------------------------------
  const PATA_REST = 1.35
  const SHEEP_RISE = 4.4
  const pop = (s0 = 0.01) => [ch('scale.x', s0, 1), ch('scale.y', s0, 1), ch('scale.z', s0, 1)]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Janeiro em Estocolmo: sobe o apartamento — piso com geada e a janela embaçada de gelo.',
    }),
    seq('parede-rise', 'parede', 0.25, 0.85, [riseFrom(FY, 2.6)], { ease: 'easeOut' }),

    seq('aquecedor-rise', 'aquecedor', 1.5, 0.7, [riseFrom(aquecedor.position.y, 1.0)], {
      ease: 'easeOut',
      caption: 'O aquecedor do prédio pifou de vez: em vez de calor, pingentes de gelo.',
    }),
    seq('pingentes-cresce', 'pingentes', 2.2, 0.7, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('tigela-pop', 'tigela', 3.0, 0.5, pop(), {
      ease: 'easeOut',
      caption: 'Até o CALDO da janta congelou, de colher em pé. O frio encolhe a palavra numa sílaba só: CÁLT!',
    }),

    seq('ovelha-rise', 'ovelha', SHEEP_RISE, 0.9, [riseFrom(FY, 1.9)], {
      ease: 'easeOut',
      caption: 'Chega a dona do caldo, tremendo: uma ovelha. DÊ É CÁLT…',
    }),
    seq('la-veste', 'la', SHEEP_RISE, 0.9, [ch('position.y', COAT_Y - 1.9, COAT_Y)], { ease: 'easeOut' }),
    seq('braco-pende', 'braco', SHEEP_RISE, 0.9, [ch('rotation.z', ARM_Z_REST, ARM_Z_REST)]),
    seq('pata-pende', 'pata', SHEEP_RISE, 0.9, [ch('rotation.x', PATA_REST, PATA_REST)]),

    seq(
      'la-cai',
      'la',
      5.9,
      0.8,
      [
        ch('position.x', torsoWorld.x, LA_POS.x),
        ch('position.y', COAT_Y, LA_POS.y),
        ch('position.z', torsoWorld.z, LA_POS.z),
        ch('scale.x', 1.0, 1),
        ch('scale.y', COAT_SY, 1),
        ch('scale.z', 1.1, 1),
      ],
      {
        ease: 'easeInOut',
        caption: 'Ideia genial: ela tosa a própria lã…',
      },
    ),

    seq('legging-sobe', 'legging', 7.0, 0.8, [ch('scale.y', 0.02, 1)], {
      ease: 'easeOut',
      caption: '…e tricota uma LEGGING cor-de-rosa: LÉ-GUEN! Pelada da cintura pra cima, toda arrepiada.',
    }),
    seq('novelo-rise', 'novelo', 7.15, 0.6, [riseFrom(FY, 0.5)], { ease: 'easeOut' }),

    seq('pata-sobe', 'pata', 8.7, 0.6, [ch('rotation.x', PATA_REST, 0)], {
      ease: 'easeOut',
      caption: 'Sopra o bafo quente nos cascos: RRÊÊ…',
    }),
    seq('bafo-sopra', 'bafo', 9.1, 0.7, pop(), { ease: 'easeOut' }),

    seq('braco-pega', 'braco', 10.3, 0.5, [
      ch('rotation.x', ARM_X_REST, ARM_X),
      ch('rotation.z', ARM_Z_REST, ARM_Z),
    ], {
      ease: 'easeInOut',
      caption: '…e bate o caldo-pedra no aquecedor gelado: TEN! TEN!',
    }),
    // primeira pancada
    seq('braco-ergue-1', 'braco', 10.85, 0.3, [ch('rotation.x', ARM_X, ARM_X_UP), ch('rotation.z', ARM_Z, ARM_Z_UP)], { ease: 'easeOut' }),
    seq('tigela-ergue-1', 'tigela', 10.85, 0.3, [
      ch('position.x', bowlPos.x, bowlUp.x), ch('position.y', bowlPos.y, bowlUp.y), ch('position.z', bowlPos.z, bowlUp.z),
    ], { ease: 'easeOut' }),
    seq('braco-bate-1', 'braco', 11.15, 0.14, [ch('rotation.x', ARM_X_UP, ARM_X), ch('rotation.z', ARM_Z_UP, ARM_Z)], { ease: 'easeIn' }),
    seq('tigela-bate-1', 'tigela', 11.15, 0.14, [
      ch('position.x', bowlUp.x, bowlPos.x), ch('position.y', bowlUp.y, bowlPos.y), ch('position.z', bowlUp.z, bowlPos.z),
    ], { ease: 'easeIn' }),
    seq('impacto-1', 'impacto', 11.29, 0.22, pop(0.2), { ease: 'easeOut' }),
    // segunda pancada
    seq('braco-ergue-2', 'braco', 11.55, 0.28, [ch('rotation.x', ARM_X, ARM_X_UP), ch('rotation.z', ARM_Z, ARM_Z_UP)], { ease: 'easeOut' }),
    seq('tigela-ergue-2', 'tigela', 11.55, 0.28, [
      ch('position.x', bowlPos.x, bowlUp.x), ch('position.y', bowlPos.y, bowlUp.y), ch('position.z', bowlPos.z, bowlUp.z),
    ], { ease: 'easeOut' }),
    seq('braco-bate-2', 'braco', 11.83, 0.14, [ch('rotation.x', ARM_X_UP, ARM_X), ch('rotation.z', ARM_Z_UP, ARM_Z)], { ease: 'easeIn' }),
    seq('tigela-bate-2', 'tigela', 11.83, 0.14, [
      ch('position.x', bowlUp.x, bowlPos.x), ch('position.y', bowlUp.y, bowlPos.y), ch('position.z', bowlUp.z, bowlPos.z),
    ], { ease: 'easeIn' }),
    seq('impacto-2', 'impacto', 11.97, 0.3, pop(0.4), {
      ease: 'easeOut',
      caption: 'Det är kallt i lägenheten. — Está frio no apartamento.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-kallt-i-lagenheten',
    contexto:
      'Moradia: reclamando em casa, com o vizinho no trapphus ou — o uso mais importante — na felanmälan pro hyresvärd quando o element (o aquecedor) não esquenta. No inverno é assunto fixo do grupo de inquilinos do prédio.',
    fraseFonte: 'Está frio no apartamento.',
    fraseAlvo: 'Det är kallt i lägenheten.',
    pronuncia:
      "dê é KALT i LÉÉ-guen-rrê-ten ('det är' na fala vira 'dê é'; 'kallt' com A curto e L de verdade, ponta da língua grudada no céu da boca, soltando num T seco, nunca 'cáu(tchi)'; 'lägenheten' com a força no LÉÉ, É bem aberto e longo, G duro de 'guerra', e uma segunda força leve no 'he', com h soprado e Ê fechado; o -ten do fim é fraquinho)",
    ponteSonora:
      "DÊ É CÁLT-I... LÉ-GUEN-RRÊ-TEN! (8 sílabas: dê-é-KALT-i-LÉÉ-guen-rrê-ten; tônicas em CÁLT e LÉÉ, e uma força leve no RRÊ; DÊ É = o 'det är' de sempre, de 'Det är lugnt' e 'Det är akut': DÊ fechado e sem T, É aberto e curto; CÁLT = o MESMO CALDO congelado de 'Oj, vad kallt!': o frio encolhe a palavra numa sílaba só, dura — A curto, L DE VERDADE (o brasileiro fala 'CÁU-do'; aqui a ponta da língua GRUDA no céu da boca de tanto frio, como na história, e é isso que faz o L: nunca 'cáu') e o D endurece num T SECO, a língua se soltando do céu da boca num estalo, que já emenda no 'i': CÁL-TI, como o ÓN-TI de 'ont i'; sem o T sobra 'kall', a forma de 'handen är kall' (a mão está fria) — com 'det är' é sempre kallT; LÉ-GUEN = a LEGGING do jeito que o Brasil fala, LÉ-guin, com a força no LÉ: É ABERTO e esticado — é o ä longo, o mesmo É escancarado do LÉÉR de 'Jag lär mig svenska' — e G DURO de 'guerra'; só troque o -guin por -GUEN, E curto e N batido na língua, sem nasal; RRÊ = o bafo quente soprado nos cascos: é o h sueco, soprado leve como RR carioca — o mesmo RRÊ de 'Jag heter' —, com Ê FECHADO de 'você'; TEN = a pancada do caldo-pedra no aquecedor: T seco de 'tatu', E curto e N na língua, bem fraquinho — nunca 'tẽi')",
    historia:
      "Janeiro em Estocolmo e o aquecedor do apartamento pifou de vez: até o CALDO que a ovelha esquentou pro jantar congelou na tigela, com a colher em pé. Ela tenta dizer 'CALDO', mas o frio encolhe a palavra numa sílaba só: a ponta da língua gruda no céu da boca no L e só se solta num estalo seco, CÁLT! Aí tem a ideia genial de tosar a própria lã pra tricotar uma LEGGING cor-de-rosa, e agora está de legging e pelada da cintura pra cima, arrepiada da cabeça aos cascos. Sopra o bafo quente nos cascos, RRÊÊ, e bate o caldo-pedra no aquecedor gelado: TEN! TEN! Nada esquenta: DÊ É CÁLT I LÉ-GUEN-RRÊ-TEN, está frio no apartamento.",
  },
  createScene,
  refine: { organic: ['ovelha', 'cabeca', 'braco', 'pata'] },
}

export default card
