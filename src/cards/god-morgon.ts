import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "God morgon!" — GU-MÓRON!
 *
 * O camelo do moinho acorda o deserto: infla o balão rosa da garganta e
 * gargareja GUUU!, encosta o peito na trave e empurra a MÓ — a pedra redonda
 * gigante do moinho, em pé sobre a base — que gira gemendo MÓ-RON, MÓ-RON.
 * Quando o sol desponta, ele arreganha os dentes amarelos: GU-MÓRON!
 *
 * Diorama: disco de areia com dunas, meio sol laranja no horizonte, palmeira
 * atrás; à esquerda a base circular de pedra com a mó em pé; a trave de
 * madeira mel liga o eixo ao peito do camelo, à direita, virado em 3/4 para a
 * câmera. Acento saturado RESERVADO ao balão rosa (o GU da ponte).
 */

const AREIA = '#ecca94'
const AREIA_ESC = '#d9b073'
const AREIA_FUNDO = '#c99a5c'
const CAMELO = '#c8965a'
const CAMELO_ESC = '#9c6d3c'
const CAMELO_CLARO = '#dcb27a'
const PEDRA_ESC = '#6f6a65'
const PEDRA_MEIO = '#86807a'
const PEDRA_CLARA = '#bdb7ae'
const MADEIRA_ESC = '#4a3222'
const MEL = '#c98b3c'
const MEL_ESC = '#a56e2c'
const TRIGO = '#d8b257'
const SOL = '#ff8a24'
const SOL_HALO = '#ffb35c'
const PALMA = '#4f8a3e'
const PALMA_ESC = '#3d6f30'
const TRONCO = '#7a5534'
const DENTE = '#e9cf55'
const ROSA = '#ff3f8e' // acento: o balão da garganta (GU)
const ROSA_ESC = '#d92f75'
const ALMOFADA = '#5f6f98'

const GY = 0.15 // topo da areia
const BASIN_H = 0.3 // altura da base de pedra
const MO_R = 0.75 // raio da mó
const AXLE_Y = GY + BASIN_H + MO_R // altura do eixo da mó = altura da trave
const MILL: [number, number] = [-1.25, -0.55] // centro do moinho (x, z)
const THETA = -0.75 // orientação do conjunto: camelo anda para a esquerda-frente
const SPIN = 0.7 // quanto o conjunto gira enquanto o camelo empurra
const CAMEL_X = 2.0 // posição do camelo ao longo da trave (local do eixo)
const CAMEL_Z = -0.85 // atrás da trave: o peito encosta nela

/** Cápsula esticada entre dois pontos (pescoço, pernas, caules). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  const m = capsule(r, Math.max(0.001, len), color, { roughness: 0.85, ...opts })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- deserto: disco de areia, dunas, pedrinhas, saco de trigo ------------
  const base = new THREE.Group()

  const solo = cylinder(2.66, 2.76, 0.1, AREIA_FUNDO, { roughness: 0.95 })
  solo.position.y = 0.05
  base.add(solo)

  const areia = cylinder(2.6, 2.66, 0.06, AREIA, { roughness: 0.95 })
  areia.position.y = 0.12
  base.add(areia)

  // dunas baixas na borda de trás (escondem a linha reta do sol)
  for (const [dx, dz, s, sx] of [
    [-0.4, -2.2, 0.62, 1.9], [0.75, -2.25, 0.5, 1.7], [1.75, -1.75, 0.52, 1.5],
    [-1.75, -1.85, 0.46, 1.6], [2.2, -0.6, 0.36, 1.3], [-2.25, 0.55, 0.32, 1.4],
  ] as const) {
    const duna = sphere(s, AREIA_ESC, { roughness: 0.95 })
    duna.scale.set(sx, 0.32, 0.9)
    duna.position.set(dx, GY - 0.02, dz)
    duna.rotation.y = rand() * 0.6
    base.add(duna)
  }

  for (const [rx, rz, rr, sd] of [[1.9, 1.15, 0.13, 3], [2.15, 0.85, 0.08, 4], [-2.0, 1.25, 0.11, 5]] as const) {
    const pedra = rock(rr, '#a08466', sd, { roughness: 0.9 })
    pedra.position.set(rx, GY + rr * 0.4, rz)
    base.add(pedra)
  }

  // saco de trigo amarrado, ao lado do moinho
  const saco = new THREE.Group()
  saco.position.set(-1.55, GY, 0.85)
  saco.rotation.y = 0.4
  const corpoSaco = lathe(
    [
      [0, 0], [0.2, 0.01], [0.26, 0.1], [0.27, 0.26], [0.22, 0.37], [0.1, 0.43],
      [0.08, 0.47], [0.13, 0.53], [0.11, 0.545], [0.06, 0.5], [0, 0.49],
    ],
    '#c9ae7e',
    { roughness: 0.95 },
  )
  saco.add(corpoSaco)
  const amarra = torus(0.085, 0.024, '#8a6a3e', { roughness: 0.9 })
  amarra.rotation.x = Math.PI / 2
  amarra.position.y = 0.45
  saco.add(amarra)
  // espigas espetadas na boca do saco
  for (const [ex, ez, tilt] of [[-0.03, 0.0, -0.25], [0.03, 0.02, 0.15], [0.0, -0.03, 0.4]] as const) {
    const haste = new THREE.Group()
    haste.position.set(ex, 0.48, ez)
    haste.rotation.set(tilt * 0.6, 0, tilt)
    const caule = cylinder(0.008, 0.01, 0.22, '#b8923e', { roughness: 0.8 }, 8)
    caule.position.y = 0.11
    haste.add(caule)
    const cacho = capsule(0.03, 0.08, TRIGO, { roughness: 0.75 })
    cacho.position.y = 0.26
    haste.add(cacho)
    saco.add(haste)
  }
  base.add(saco)

  // grãos derramados
  for (let i = 0; i < 9; i++) {
    const grao = sphere(0.025, TRIGO, { roughness: 0.7 }, 10)
    grao.scale.set(1, 0.6, 1.5)
    grao.position.set(-1.3 + rand() * 0.45, GY + 0.012, 1.05 + rand() * 0.35)
    grao.rotation.y = rand() * 3
    base.add(grao)
  }

  root.add(base)

  // ---- meio sol nascendo no horizonte --------------------------------------
  const sol = new THREE.Group()
  sol.position.set(1.6, GY, -1.85)
  sol.rotation.y = -0.45
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(1.18, 64, 0, Math.PI),
    mat(SOL_HALO, { emissive: SOL_HALO, emissiveIntensity: 0.55 }),
  )
  halo.position.z = -0.03
  sol.add(halo)
  const disco = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 64, 0, Math.PI),
    mat(SOL, { emissive: SOL, emissiveIntensity: 0.9 }),
  )
  sol.add(disco)
  root.add(sol)

  // ---- palmeira ao fundo ---------------------------------------------------
  const palmeira = new THREE.Group()
  palmeira.position.set(-2.0, GY, -1.45)
  root.add(palmeira)
  const topo = v(0, 0, 0)
  {
    let p = v(0, 0, 0)
    for (let i = 0; i < 7; i++) {
      const r = 0.11 - i * 0.008
      const anel = lathe(
        [[0, 0], [r, 0], [r * 1.15, 0.2], [r * 0.95, 0.3], [0, 0.3]],
        i % 2 ? TRONCO : '#6b4a2c',
        { roughness: 0.85 },
      )
      anel.position.copy(p)
      anel.rotation.z = -0.04 * i
      palmeira.add(anel)
      p = p.clone().add(v(0.03 + i * 0.012, 0.28, 0))
    }
    topo.copy(p)
  }
  // folhas: nervura em arco caindo, folíolos achatados afinando até a ponta
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + 0.2
    const folha = new THREE.Group()
    folha.position.copy(topo)
    folha.rotation.set(0, a, 0)
    const cor = k % 2 ? PALMA : PALMA_ESC
    const n = 5
    const seg = 0.2 + (k % 3) * 0.02
    let ang = 0.45 // começa subindo e vai caindo
    let px = 0
    let py = 0
    for (let i = 0; i < n; i++) {
      const w = 0.13 * (1 - i / (n + 1)) + 0.03
      const lamina = capsule(w, seg, cor, { roughness: 0.75 })
      lamina.scale.set(0.22, 1, 1.5)
      const cx = px + Math.cos(ang) * seg * 0.5
      const cy = py + Math.sin(ang) * seg * 0.5
      lamina.position.set(cx, cy, 0)
      lamina.rotation.set(0, 0, ang - Math.PI / 2)
      folha.add(lamina)
      px += Math.cos(ang) * seg
      py += Math.sin(ang) * seg
      ang -= 0.32
    }
    palmeira.add(folha)
  }
  for (let k = 0; k < 3; k++) {
    const coco = sphere(0.08, '#5a3b22', { roughness: 0.7 })
    const a = k * 2.1
    coco.position.copy(topo).add(v(Math.cos(a) * 0.1, -0.1, Math.sin(a) * 0.1))
    palmeira.add(coco)
  }

  // ---- base circular de pedra do moinho ------------------------------------
  const baseMo = new THREE.Group()
  baseMo.position.set(MILL[0], GY, MILL[1])
  root.add(baseMo)

  const pedestal = cylinder(1.02, 1.1, BASIN_H, PEDRA_ESC, { roughness: 0.9 })
  pedestal.position.y = BASIN_H / 2
  baseMo.add(pedestal)
  // blocos de alvenaria em volta
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const bloco = rbox(0.42, 0.13, 0.08, 0.03, i % 3 === 0 ? PEDRA_MEIO : '#7a746e', { roughness: 0.9 })
    const y = i % 2 ? 0.08 : 0.22
    bloco.position.set(Math.cos(a) * 1.08, y, Math.sin(a) * 1.08)
    bloco.rotation.y = -a + Math.PI / 2
    baseMo.add(bloco)
  }
  const borda = torus(1.0, 0.055, PEDRA_MEIO, { roughness: 0.85 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = BASIN_H
  baseMo.add(borda)
  const pista = cylinder(0.96, 0.96, 0.02, '#5d5853', { roughness: 0.95 })
  pista.position.y = BASIN_H - 0.005
  baseMo.add(pista)
  // trilha de farinha onde a mó rola, com grãos de trigo por cima
  const farinha = torus(0.55, 0.13, '#eadfc2', { roughness: 0.95 })
  farinha.rotation.x = Math.PI / 2
  farinha.scale.z = 0.3
  farinha.position.y = BASIN_H + 0.005
  baseMo.add(farinha)
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2
    const rr = 0.4 + rand() * 0.3
    const grao = sphere(0.024, TRIGO, { roughness: 0.7 }, 10)
    grao.scale.set(1, 0.6, 1.5)
    grao.position.set(Math.cos(a) * rr, BASIN_H + 0.04, Math.sin(a) * rr)
    grao.rotation.y = rand() * 3
    baseMo.add(grao)
  }

  // ---- eixo: poste central + eixo horizontal (gira o conjunto) -------------
  const eixo = new THREE.Group()
  eixo.position.set(MILL[0], 0, MILL[1])
  eixo.rotation.y = THETA
  root.add(eixo)

  const poste = cylinder(0.085, 0.1, AXLE_Y + 0.42 - GY - BASIN_H, MADEIRA_ESC, { roughness: 0.75 })
  poste.position.y = (GY + BASIN_H + AXLE_Y + 0.42) / 2
  eixo.add(poste)
  const chapeu = cylinder(0.04, 0.12, 0.1, MADEIRA_ESC, { roughness: 0.75 })
  chapeu.position.y = AXLE_Y + 0.47
  eixo.add(chapeu)
  const pe = cylinder(0.16, 0.18, 0.08, MADEIRA_ESC, { roughness: 0.75 })
  pe.position.y = GY + BASIN_H + 0.04
  eixo.add(pe)
  const eixoH = cylinder(0.07, 0.07, 0.95, MADEIRA_ESC, { roughness: 0.7 })
  eixoH.rotation.z = Math.PI / 2
  eixoH.position.set(0.47, AXLE_Y, 0)
  eixo.add(eixoH)
  for (const x of [0.0, 0.35, 0.75]) {
    const anel = torus(0.085, 0.022, '#3a3634', { roughness: 0.35, metalness: 0.75 })
    anel.rotation.y = Math.PI / 2
    anel.position.set(x, AXLE_Y, 0)
    eixo.add(anel)
  }

  // ---- a MÓ: pedra redonda gigante em pé (filha do eixo) --------------------
  const mo = new THREE.Group()
  mo.position.set(0.55, AXLE_Y, 0)
  eixo.add(mo)
  const roda = lathe(
    [
      [0.09, -0.17], [0.55, -0.17], [0.63, -0.14], [MO_R, -0.06], [MO_R, 0.06],
      [0.63, 0.14], [0.55, 0.17], [0.09, 0.17], [0.09, -0.17],
    ],
    PEDRA_CLARA,
    { roughness: 0.92 },
    48,
  )
  roda.rotation.z = Math.PI / 2 // eixo de revolução ao longo de x
  mo.add(roda)
  // sulcos radiais e lascas na face: mostram o giro
  for (const side of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2
      const sulco = rbox(0.02, 0.36, 0.045, 0.01, '#9a948b', { roughness: 0.95 })
      sulco.position.set(side * 0.172, Math.cos(a) * 0.33, Math.sin(a) * 0.33)
      sulco.rotation.x = -a
      mo.add(sulco)
    }
    const cubo = torus(0.11, 0.035, '#3a3634', { roughness: 0.35, metalness: 0.75 })
    cubo.rotation.y = Math.PI / 2
    cubo.position.x = side * 0.18
    mo.add(cubo)
  }

  // ---- trave de madeira mel: do eixo até o peito do camelo -----------------
  const trave = new THREE.Group()
  trave.position.set(0.85, AXLE_Y, 0)
  eixo.add(trave)
  const TRAVE_L = CAMEL_X + 0.45 - 0.85
  const viga = cylinder(0.068, 0.068, TRAVE_L, MEL, { roughness: 0.55 })
  viga.rotation.z = Math.PI / 2
  viga.position.x = TRAVE_L / 2
  trave.add(viga)
  const ponteira = sphere(0.09, MEL_ESC, { roughness: 0.55 })
  ponteira.position.x = TRAVE_L
  trave.add(ponteira)
  for (const x of [0.06, 0.16]) {
    const corda = torus(0.075, 0.018, '#9b7c4c', { roughness: 0.9 })
    corda.rotation.y = Math.PI / 2
    corda.position.x = x
    trave.add(corda)
  }
  // almofada de peito amarrada na trave
  const almofada = rbox(0.5, 0.2, 0.17, 0.07, ALMOFADA, { roughness: 0.9 })
  almofada.position.set(CAMEL_X - 0.85, 0.0, -0.02)
  trave.add(almofada)
  for (const dx of [-0.17, 0.17]) {
    const tira = torus(0.1, 0.016, '#3e4a6a', { roughness: 0.9 })
    tira.rotation.y = Math.PI / 2
    tira.position.set(CAMEL_X - 0.85 + dx, 0, -0.02)
    tira.scale.set(1, 1.05, 0.95)
    trave.add(tira)
  }

  // ---- CAMELO (corpo + pernas + cauda) -------------------------------------
  const camelo = new THREE.Group()
  camelo.position.set(CAMEL_X, GY, CAMEL_Z)
  eixo.add(camelo)

  const tronco = capsule(0.34, 0.72, CAMELO, { roughness: 0.88 })
  tronco.rotation.x = Math.PI / 2
  tronco.scale.set(0.92, 1, 1)
  tronco.position.set(0, 1.32, -0.02)
  camelo.add(tronco)
  const peito = sphere(0.36, CAMELO, { roughness: 0.88 })
  peito.scale.set(0.9, 1.0, 1.0)
  peito.position.set(0, 1.24, 0.43)
  camelo.add(peito)
  const anca = sphere(0.35, CAMELO, { roughness: 0.88 })
  anca.scale.set(0.92, 1, 1)
  anca.position.set(0, 1.34, -0.46)
  camelo.add(anca)
  const barriga = sphere(0.3, CAMELO_CLARO, { roughness: 0.88 })
  barriga.scale.set(0.95, 0.75, 1.4)
  barriga.position.set(0, 1.12, 0)
  camelo.add(barriga)

  // pernas: coxa grossa, joelho calejado, canela fina, pé largo de dois dedos
  for (const [lz, front] of [[0.42, true], [-0.48, false]] as const) {
    for (const side of [-1, 1]) {
      const x = side * 0.19
      const topo = v(x, front ? 1.12 : 1.2, lz)
      const joelho = v(x, 0.6, lz + (front ? 0.02 : -0.06))
      const tornozelo = v(x, 0.12, lz + (front ? 0.04 : 0.0))
      camelo.add(limb(topo, joelho, front ? 0.115 : 0.135, CAMELO))
      camelo.add(limb(joelho, tornozelo, 0.072, CAMELO))
      const calo = sphere(0.095, CAMELO_ESC, { roughness: 0.9 })
      calo.position.copy(joelho)
      camelo.add(calo)
      const pata = sphere(0.13, CAMELO_ESC, { roughness: 0.9 })
      pata.scale.set(0.95, 0.42, 1.2)
      pata.position.set(x, 0.055, tornozelo.z + 0.05)
      camelo.add(pata)
      for (const d of [-1, 1]) {
        const dedo = sphere(0.055, '#7c5530', { roughness: 0.8 })
        dedo.position.set(x + d * 0.05, 0.045, tornozelo.z + 0.17)
        camelo.add(dedo)
      }
    }
  }

  // cauda com tufo
  camelo.add(limb(v(0, 1.42, -0.78), v(0, 0.97, -0.9), 0.04, CAMELO_ESC))
  const tufo = sphere(0.07, '#6e4a2a', { roughness: 0.95 })
  tufo.scale.set(1, 1.6, 1)
  tufo.position.set(0, 0.92, -0.91)
  camelo.add(tufo)

  // ---- corcova (filha do camelo) -------------------------------------------
  const corcova = new THREE.Group()
  corcova.position.set(0, 1.54, -0.1)
  camelo.add(corcova)
  const morro = sphere(0.38, CAMELO, { roughness: 0.88 })
  morro.scale.set(0.82, 0.92, 1.1)
  morro.position.y = 0.12
  corcova.add(morro)
  const pe2 = sphere(0.36, CAMELO, { roughness: 0.88 })
  pe2.scale.set(0.88, 0.45, 1.5)
  pe2.position.y = -0.04
  corcova.add(pe2)
  const pelo = puff(0.12, CAMELO_ESC, 5, 7, { roughness: 0.95 })
  pelo.position.set(0, 0.46, -0.02)
  pelo.scale.y = 0.6
  corcova.add(pelo)

  // ---- pescoço + cabeça (filha do camelo; vira para a câmera) ---------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.42, 0.55)
  cabeca.rotation.y = 0.6
  camelo.add(cabeca)

  const p0 = v(0, 0, 0)
  const p1 = v(0, 0.22, 0.42)
  const p2 = v(0, 0.62, 0.7)
  cabeca.add(limb(p0, p1, 0.17, CAMELO))
  cabeca.add(limb(p1, p2, 0.135, CAMELO))
  const nuca = sphere(0.15, CAMELO, { roughness: 0.88 })
  nuca.position.copy(p1)
  cabeca.add(nuca)
  // crina sob o pescoço
  const crina = puff(0.08, CAMELO_ESC, 4, 9, { roughness: 0.95 })
  crina.position.set(0, 0.18, 0.5)
  crina.scale.set(0.8, 1, 1)
  cabeca.add(crina)

  // cabeça num grupo próprio, ampliada: o rosto é o que conta a história
  const HEAD_REF = v(0, 0.66, 0.6)
  const headG = new THREE.Group()
  headG.position.copy(p2)
  headG.scale.setScalar(1.3)
  cabeca.add(headG)
  const addH = (...objs: THREE.Object3D[]) => {
    for (const o of objs) {
      o.position.sub(HEAD_REF)
      headG.add(o)
    }
  }

  const cranio = capsule(0.15, 0.2, CAMELO, { roughness: 0.88 })
  cranio.rotation.x = Math.PI / 2 - 0.15
  cranio.position.set(0, 0.8, 0.7)
  addH(cranio)
  const focinho = capsule(0.125, 0.12, CAMELO_CLARO, { roughness: 0.85 })
  focinho.rotation.x = Math.PI / 2 - 0.3
  focinho.position.set(0, 0.73, 0.92)
  addH(focinho)
  const beico = sphere(0.1, CAMELO_CLARO, { roughness: 0.85 })
  beico.scale.set(1.15, 0.7, 0.9)
  beico.position.set(0, 0.7, 1.04)
  addH(beico)
  // mandíbula aberta: o grito
  const queixo = capsule(0.075, 0.14, CAMELO_CLARO, { roughness: 0.85 })
  queixo.rotation.x = Math.PI / 2 + 0.35
  queixo.position.set(0, 0.56, 0.93)
  addH(queixo)
  const goela = sphere(0.085, '#5a2428', { roughness: 0.5 })
  goela.scale.set(1.1, 0.8, 0.9)
  goela.position.set(0, 0.62, 1.0)
  addH(goela)
  // dentes amarelos arreganhados
  for (let i = 0; i < 4; i++) {
    const dx = -0.075 + i * 0.05
    const dente = rbox(0.048, 0.075, 0.035, 0.012, DENTE, { roughness: 0.35 })
    dente.position.set(dx, 0.655, 1.085 - Math.abs(dx) * 0.4)
    dente.rotation.y = dx * 2.5
    addH(dente)
    const debaixo = rbox(0.046, 0.055, 0.032, 0.012, DENTE, { roughness: 0.35 })
    debaixo.position.set(dx, 0.555, 1.02 - Math.abs(dx) * 0.4)
    debaixo.rotation.y = dx * 2.5
    addH(debaixo)
  }
  for (const side of [-1, 1]) {
    const narina = capsule(0.016, 0.03, '#4a2e1c', { roughness: 0.6 })
    narina.rotation.z = Math.PI / 2 - side * 0.5
    narina.position.set(side * 0.055, 0.79, 1.06)
    addH(narina)

    const olho = sphere(0.06, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.15, 0.85, 0.8)
    olho.scale.set(0.75, 1, 1)
    addH(olho)
    const pupila = sphere(0.03, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.175, 0.845, 0.84)
    addH(pupila)
    const palpebra = sphere(0.064, CAMELO_ESC, { roughness: 0.88 })
    palpebra.scale.set(0.7, 0.55, 1.05)
    palpebra.position.set(side * 0.153, 0.892, 0.8)
    addH(palpebra)
    for (let c = 0; c < 3; c++) {
      const cilio = rbox(0.008, 0.035, 0.008, 0.003, '#2c1d12')
      cilio.position.set(side * 0.19, 0.91, 0.76 + c * 0.025)
      cilio.rotation.z = -side * 0.4
      addH(cilio)
    }

    const orelha = capsule(0.035, 0.06, CAMELO_ESC, { roughness: 0.9 })
    orelha.position.set(side * 0.11, 0.97, 0.56)
    orelha.rotation.set(-0.3, 0, -side * 0.6)
    addH(orelha)
  }
  const topete = puff(0.07, CAMELO_ESC, 4, 13, { roughness: 0.95 })
  topete.position.set(0, 0.96, 0.64)
  topete.scale.y = 0.7
  addH(topete)

  // ---- balão rosa da garganta, saindo pelo canto da boca --------------------
  const balao = new THREE.Group()
  balao.position.set(0.09, 0.62, 1.0)
  addH(balao)
  const bolsa = sphere(0.155, ROSA, { roughness: 0.28 }, 40)
  bolsa.scale.set(1.15, 0.9, 1.0)
  bolsa.position.set(0.19, -0.14, 0.0)
  balao.add(bolsa)
  const gargalo = capsule(0.06, 0.08, ROSA_ESC, { roughness: 0.3 })
  gargalo.rotation.z = Math.PI / 2 - 0.3
  gargalo.position.set(0.03, -0.01, 0.01)
  balao.add(gargalo)
  const brilho = sphere(0.045, '#ffd2e4', { roughness: 0.1 })
  brilho.scale.set(1, 0.7, 0.4)
  brilho.position.set(0.24, -0.06, 0.15)
  balao.add(brilho)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'deserto', object: base },
    { name: 'palmeira', group: 'deserto', object: palmeira },
    { name: 'baseMo', group: 'moinho', object: baseMo },
    { name: 'eixo', group: 'moinho', object: eixo },
    { name: 'mo', group: 'moinho', object: mo },
    { name: 'trave', group: 'trave', object: trave },
    { name: 'camelo', group: 'camelo', object: camelo },
    { name: 'corcova', group: 'camelo', object: corcova },
    { name: 'cabeca', group: 'camelo', object: cabeca },
    { name: 'balao', group: 'gu', object: balao },
    { name: 'sol', group: 'sol', object: sol },
  ]

  const S = (p: string, at: number, dur: number, from: number, to: number) =>
    seq(`${p}-escala`, p, at, dur, [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)], {
      ease: 'easeOut',
    })

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Deserto, antes do sol nascer: areia, dunas e uma palmeira lá atrás.',
    }),
    seq('palmeira-cresce', 'palmeira', 0.5, 0.8, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),

    seq('baseMo-rise', 'baseMo', 1.8, 0.7, [riseFrom(GY, 0.6)], {
      ease: 'easeOut',
      caption: 'No meio, um moinho: a MÓ — a pedra redonda gigante que MÓI o trigo.',
    }),
    // o eixo segura a orientação inicial; o giro de verdade vem depois
    seq('eixo-rise', 'eixo', 2.2, 0.6, [riseFrom(0, 1.4), ch('rotation.y', THETA + SPIN, THETA + SPIN)], {
      ease: 'easeOut',
    }),
    seq('mo-rola', 'mo', 2.5, 0.9, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
      ch('rotation.x', -2.5, 0),
    ], { ease: 'easeOut' }),

    seq('trave-estica', 'trave', 3.9, 0.6, [ch('scale.x', 0.03, 1)], {
      ease: 'easeOut',
      caption: 'Do eixo sai uma trave de madeira cor de mel…',
    }),

    seq('camelo-rise', 'camelo', 5.0, 0.9, [riseFrom(GY, 2.6)], {
      ease: 'easeOut',
      caption: '…e chega o camelo do moinho, que encosta o peito nela.',
    }),
    seq('corcova-infla', 'corcova', 5.4, 0.6, [ch('scale.y', 0.1, 1)], { ease: 'easeOut' }),
    seq('cabeca-ergue', 'cabeca', 5.5, 0.7, [ch('rotation.x', 0.9, 0)], { ease: 'easeOut' }),

    seq('balao-infla', 'balao', 7.0, 0.7, [
      ch('scale.x', 0.05, 1.35), ch('scale.y', 0.05, 1.35), ch('scale.z', 0.05, 1.35),
    ], {
      ease: 'easeOut',
      caption: 'Primeiro ele infla o balão rosa da garganta e gargareja: GUUU!',
    }),
    S('balao', 7.7, 0.4, 1.35, 1),

    seq('eixo-gira', 'eixo', 8.9, 2.4, [ch('rotation.y', THETA + SPIN, THETA)], {
      ease: 'easeInOut',
      caption: 'Depois empurra a MÓ, que gira gemendo grudadinho: MÓ-RON, MÓ-RON, MÓ-RON!',
    }),
    seq('mo-gira', 'mo', 8.9, 2.4, [ch('rotation.x', 0, Math.PI * 2)], { ease: 'easeInOut' }),

    seq('sol-nasce', 'sol', 11.6, 1.0, [riseFrom(GY, 1.0)], {
      ease: 'easeOut',
      caption: 'O sol desponta no horizonte, ele arreganha os dentes amarelos e grita num fôlego só: GU-MÓRON!',
    }),
    seq('cabeca-grita', 'cabeca', 12.0, 0.3, [ch('rotation.x', 0, -0.2)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', 13.0, 0.5, [ch('rotation.x', -0.2, 0)], {
      ease: 'easeInOut',
      caption: 'God morgon! — Bom dia!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.55, 2.7, 5.5], target: [-0.1, 1.1, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'god-morgon',
    contexto:
      "Chegando no escritório, na creche, no elevador com o vizinho — vale até umas 10h, depois disso é 'hej'.",
    fraseFonte: 'Bom dia!',
    fraseAlvo: 'God morgon!',
    pronuncia:
      "gu-MÓR-ron (na fala vira uma palavra só, 'gomorron'; o 'd' de god e o 'g' de morgon NÃO soam; o 'o' de god = U fechado; 'mor' com Ó ABERTO e R batido de 'caro'; o -on final também com Ó aberto, sem nasalizar)",
    ponteSonora:
      "GU-MÓRON! (3 sílabas numa palavra só, tônica única no MÓ; GU = o gargarejo do camelo, U FECHADO e curto — é o 'god', o mesmo GÚD de 'Varsågod' só que engolindo o D; MÓ = a MÓ, a pedra do moinho (a que MÓI o trigo), com Ó ABERTO de 'pó'; RON gruda no MÓ com R BATIDO de 'caro' — um R só, entre vogais, jamais o RR de 'rua' — e Ó também aberto, com o N na ponta da língua, sem virar o 'rõ' nasal de 'náilon'; MÓRON é o MESMO 'morgon' do ouriço IMÓRON da carta 'Ska vi säga imorgon klockan tre?' — e confere de ouvido: é o GOOD MORning do inglês com o rabo trocado por -RON; o g de 'morgon' é mudo)",
    historia:
      'Antes do sol nascer, o camelo do moinho acorda o vilarejo inteiro. Primeiro ele infla o balão rosa da garganta e gargareja GUUU! até as janelas tremerem. Depois encosta o peito na trave e empurra a MÓ, a pedra redonda gigante do moinho, que gira gemendo grudadinho: MÓ-RON, MÓ-RON, MÓ-RON. Quando o sol aparece no horizonte, ele cospe o balão de volta, arreganha os dentes amarelos e grita pra cada vizinho que abre a janela, tudo num fôlego só: GU-MÓRON! — é o bom-dia do deserto.',
  },
  createScene,
  refine: { organic: ['camelo', 'corcova', 'cabeca'] },
}

export default card
