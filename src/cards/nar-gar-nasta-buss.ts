import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, person,
} from '../rig/helpers'
import type { MatOpts } from '../rig/helpers'

/**
 * "När går nästa buss?" — NÉR(o)... GÔR(do)... NESTA? BUS?!
 *
 * O ponto de ônibus tem imperador: NERO, pantera-negra de coroa de louros e
 * lira dourada, que comeu uva até ficar GORDO feito barril. O ônibus vermelho
 * encosta, ele salta pra dentro e ENTALA: a pança trava no vão da porta, a
 * lira fica pra dentro (vista pelo para-brisa) e o rabo pra fora. O motorista
 * balança a cabeça — NESTA, não — e Nero vira pra trás num rosnado.
 *
 * Diorama: disco cortado pelo meio-fio — asfalto de um lado, calçada clara do
 * outro. Ônibus de frente em 3/4 (para-brisa, faróis, letreiro), com a porta
 * dupla no flanco do lado da calçada (Suécia: porta à direita do ônibus).
 *
 * Paleta: cinzas frios (rua/calçada), vermelho SL do ônibus, azul-marinho do
 * abrigo, preto-azulado da pantera. Acento saturado RESERVADO ao ouro da lira
 * (o NERO da ponte).
 */

const ASFALTO = '#41464e'
const ASFALTO_ESC = '#30343a'
const CALCADA = '#b7bcc4'
const CALCADA_LINHA = '#9ca1aa'
const MEIO_FIO = '#d5d8dd'
const SL = '#c4262d'
const SL_ESC = '#98191f'
const TETO = '#dcdee3'
const PRETO = '#1d2026'
const VIDRO_LATERAL = '#25313f'
const INTERIOR = '#c3c7cd'
const PISO_BUS = '#4a4f57'
const FAROL = '#ffd873'
const LED = '#ffbe4a'
const PANTERA = '#1f2330'
const PANTERA_PANCA = '#272c3b'
const OLHO = '#f3c623'
const BOCA = '#6e1f2b'
const LINGUA = '#d0707a'
const DENTE = '#f6f1e3'
const LOURO = '#5f9a3e'
const LOURO_ESC = '#457a2b'
const UVA = '#6a3a8f'
const UVA_CLARA = '#7f4ea6'
const ABRIGO = '#1f3563'
const POSTE = '#2a3446'
const OURO = '#f2b52b' // acento saturado, RESERVADO à lira de Nero

const GY = 0.16 // topo do asfalto
const R = 2.75 // raio do disco

// ---- quadro do ônibus: tudo que encosta no meio-fio é medido nele ----------
// x = largura do ônibus (−x = lado da porta/calçada), z = comprimento (+z = frente)
const PHI = 0.5
const QX = 0.46
const QZ = -0.83
const U = new THREE.Vector2(Math.cos(PHI), -Math.sin(PHI)) // eixo x do quadro, no mundo (x,z)
const V = new THREE.Vector2(Math.sin(PHI), Math.cos(PHI)) // eixo z do quadro, no mundo (x,z)

const HW = 0.85 // meia largura do ônibus
const HL = 1.55 // meio comprimento
const FLOOR = 0.5 // piso interno
const WALL_TOP = 2.2
const WALL_T = 0.08
const DOOR_Z0 = 0.35
const DOOR_Z1 = 1.25
const DOOR_TOP = 1.92
const WS_B = 0.98 // base do para-brisa
const WS_T = 1.92 // topo do para-brisa
const CURB_X = -1.05 // linha do meio-fio, no quadro
const SIDEWALK = 0.1 // altura da calçada sobre o asfalto

// pantera: origem no plano da porta, no centro do vão
const PX = -HW
const PZ = (DOOR_Z0 + DOOR_Z1) / 2
const OUTSIDE = 0.8 // recuo antes do salto
const HEAD: [number, number, number] = [-0.06, 1.48, 0.1]
// folha dianteira da porta abre só até a borda livre sumir atrás do pilar
const PORTA_B = -1.5
const HEAD_S = 1.12 // cabeça de imperador: um pouco maior que o natural
const MOTORISTA: [number, number, number] = [0.6, 0.62, 1.13]

const CAM: [number, number, number] = [-0.85, 2.15, 5.0]
const TARGET: [number, number, number] = [0.3, 1.2, 0.2]

/** Ponto do quadro (x, z) → mundo (x, z). */
function toWorld(x: number, z: number) {
  return new THREE.Vector2(QX, QZ).addScaledVector(U, x).addScaledVector(V, z)
}

/** Cápsula de A até B: pernas, pescoço, rabo, hastes. */
function limb(
  r: number,
  a: [number, number, number],
  b: [number, number, number],
  color: string,
  opts: MatOpts = { roughness: 0.55 },
) {
  const A = new THREE.Vector3(...a)
  const B = new THREE.Vector3(...b)
  const d = B.clone().sub(A)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(A).add(B).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Tubo liso afunilado ao longo de uma curva: rabo de felino. */
function taperedTube(points: [number, number, number][], r0: number, r1: number, color: string, opts: MatOpts) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const segs = 64
  const radial = 14
  const geo = new THREE.TubeGeometry(curve, segs, 1, radial, false)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const c = curve.getPointAt(t)
    const r = r0 + (r1 - r0) * t
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c)
      pos.setXYZ(k, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  const g = new THREE.Group()
  const tube = new THREE.Mesh(geo, mat(color, { ...opts, size: 0.3 }))
  tube.castShadow = true
  tube.receiveShadow = true
  g.add(tube)
  const tip = sphere(r1, color, opts)
  tip.position.copy(curve.getPointAt(1))
  g.add(tip)
  return g
}

/** Traço de LED do letreiro (emissivo, plano xy). */
function led(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.012, 0.004, LED, { emissive: '#ff9e1f', emissiveIntensity: 1.5, roughness: 0.4 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** N Ä S T A — letras de traço grosso para o letreiro do ônibus. */
function letter(which: 'N' | 'A' | 'Ä' | 'S' | 'T') {
  const g = new THREE.Group()
  const t = 0.026
  const h = 0.13
  if (which === 'N') {
    g.add(led(t, h, -0.036, 0))
    g.add(led(t, h, 0.036, 0))
    g.add(led(t, 0.15, 0, 0, 0.5))
  } else if (which === 'A' || which === 'Ä') {
    g.add(led(t, 0.138, -0.022, 0, -0.3))
    g.add(led(t, 0.138, 0.022, 0, 0.3))
    g.add(led(0.052, 0.022, 0, -0.022))
    if (which === 'Ä') {
      g.add(led(0.024, 0.022, -0.026, 0.1))
      g.add(led(0.024, 0.022, 0.026, 0.1))
    }
  } else if (which === 'S') {
    g.add(led(0.08, t, 0, 0.052))
    g.add(led(t, 0.06, -0.027, 0.026))
    g.add(led(0.08, t, 0, 0))
    g.add(led(t, 0.06, 0.027, -0.026))
    g.add(led(0.08, t, 0, -0.052))
  } else {
    g.add(led(0.092, t, 0, 0.052))
    g.add(led(t, h, 0, 0))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base: disco de asfalto + calçada cortada pelo meio-fio ---------------
  const base = new THREE.Group()

  const soil = cylinder(R, R + 0.1, 0.1, '#2b2f36', { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)

  const asfalto = cylinder(R - 0.05, R, 0.06, ASFALTO, { roughness: 0.92 })
  asfalto.position.y = GY - 0.03
  base.add(asfalto)

  // tudo que acompanha o meio-fio vive num grupo girado como o ônibus:
  // x local = distância ao centro ao longo de U, z local = ao longo de V
  const rua = new THREE.Group()
  rua.rotation.y = PHI
  base.add(rua)

  const q = new THREE.Vector2(QX, QZ)
  const s0 = q.dot(U) + CURB_X // linha do meio-fio, em x local
  const v0 = q.dot(V) // z local do centro do ônibus
  const rs = R - 0.08
  const half = Math.sqrt(rs * rs - s0 * s0)

  // calçada: segmento do disco além do meio-fio, extrudado com chanfro
  const theta0 = Math.acos(s0 / rs)
  const shape = new THREE.Shape()
  const N = 48
  for (let k = 0; k <= N; k++) {
    const a = theta0 + ((2 * Math.PI - 2 * theta0) * k) / N
    const px = rs * Math.cos(a)
    const py = rs * Math.sin(a)
    if (k === 0) shape.moveTo(px, py)
    else shape.lineTo(px, py)
  }
  shape.closePath()
  const calcadaGeo = new THREE.ExtrudeGeometry(shape, {
    depth: SIDEWALK - 0.03,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 8,
  })
  const calcada = new THREE.Mesh(calcadaGeo, mat(CALCADA, { roughness: 0.88, size: 4 }))
  calcada.rotation.x = -Math.PI / 2
  calcada.position.y = GY + 0.015
  calcada.castShadow = true
  calcada.receiveShadow = true
  rua.add(calcada)

  // meio-fio de granito claro ao longo da borda
  const meioFio = rbox(0.13, SIDEWALK + 0.02, 2 * half - 0.12, 0.025, MEIO_FIO, { roughness: 0.7 })
  meioFio.position.set(s0 - 0.055, GY + (SIDEWALK + 0.02) / 2 - 0.01, 0)
  rua.add(meioFio)

  // juntas das placas: paralelas e perpendiculares ao meio-fio
  for (const ds of [0.55, 1.1, 1.65, 2.2]) {
    const s = s0 - ds
    const hl = Math.sqrt(Math.max(rs * rs - s * s, 0)) - 0.06
    if (hl < 0.2) continue
    const junta = rbox(0.022, 0.012, 2 * hl, 0.005, CALCADA_LINHA, { roughness: 0.9 })
    junta.position.set(s, GY + SIDEWALK + 0.003, 0)
    rua.add(junta)
  }
  for (let vz = -2.2; vz <= 2.21; vz += 0.55) {
    const smin = -Math.sqrt(Math.max(rs * rs - vz * vz, 0)) + 0.06
    const len = s0 - 0.12 - smin
    if (len < 0.15) continue
    const junta = rbox(len, 0.012, 0.022, 0.005, CALCADA_LINHA, { roughness: 0.9 })
    junta.position.set((s0 - 0.12 + smin) / 2, GY + SIDEWALK + 0.003, vz)
    rua.add(junta)
  }

  // sarjeta escura e uma tampa de bueiro no asfalto, à frente do ônibus
  const sarjeta = rbox(0.12, 0.01, 2 * half - 0.3, 0.004, ASFALTO_ESC, { roughness: 0.95 })
  sarjeta.position.set(s0 + 0.06, GY + 0.004, 0)
  rua.add(sarjeta)
  const bueiro = cylinder(0.2, 0.2, 0.02, '#575c64', { roughness: 0.4, metalness: 0.6 })
  bueiro.position.set(s0 + 1.4, GY + 0.01, v0 + 2.25)
  rua.add(bueiro)
  for (const dz of [-0.09, -0.03, 0.03, 0.09]) {
    const fenda = rbox(0.28, 0.012, 0.022, 0.005, '#3a3e45', { roughness: 0.6 })
    fenda.position.set(s0 + 1.4, GY + 0.022, v0 + 2.25 + dz)
    rua.add(fenda)
  }

  root.add(base)

  // ---- quadro do ônibus ------------------------------------------------------
  const quadro = new THREE.Group()
  quadro.position.set(QX, GY, QZ)
  quadro.rotation.y = PHI
  root.add(quadro)

  // ---- abrigo do ponto: teto azul-escuro, dois postes, vidro azulado --------
  const abrigo = new THREE.Group()
  quadro.add(abrigo)
  const AX = -1.92
  const AZ = -0.7
  const ay = SIDEWALK

  const tetoAbrigo = rbox(0.78, 0.08, 1.38, 0.035, ABRIGO, { roughness: 0.45 })
  tetoAbrigo.position.set(AX + 0.02, ay + 1.86, AZ)
  tetoAbrigo.rotation.z = -0.06
  abrigo.add(tetoAbrigo)
  const beiral = rbox(0.06, 0.12, 1.38, 0.02, '#2b4a86', { roughness: 0.45 })
  beiral.position.set(AX + 0.4, ay + 1.86, AZ)
  abrigo.add(beiral)

  for (const dz of [-0.58, 0.58]) {
    const poste = cylinder(0.04, 0.04, 1.84, POSTE, { roughness: 0.35, metalness: 0.6 })
    poste.position.set(AX - 0.26, ay + 0.92, AZ + dz)
    abrigo.add(poste)
  }
  const vidroAbrigo = rbox(0.03, 1.25, 1.1, 0.012, '#a9cbe8', {
    roughness: 0.15,
    emissive: '#7fa9d6',
    emissiveIntensity: 0.35,
  })
  vidroAbrigo.position.set(AX - 0.26, ay + 1.0, AZ)
  abrigo.add(vidroAbrigo)
  for (const fy of [0.37, 1.63]) {
    const moldura = rbox(0.05, 0.04, 1.14, 0.015, POSTE, { roughness: 0.35, metalness: 0.6 })
    moldura.position.set(AX - 0.26, ay + fy, AZ)
    abrigo.add(moldura)
  }

  const banco = rbox(0.3, 0.05, 0.92, 0.02, '#8a6a48', { roughness: 0.7 })
  banco.position.set(AX - 0.08, ay + 0.47, AZ)
  abrigo.add(banco)
  for (const dz of [-0.36, 0.36]) {
    const pe = rbox(0.05, 0.45, 0.05, 0.015, POSTE, { roughness: 0.4, metalness: 0.5 })
    pe.position.set(AX - 0.12, ay + 0.225, AZ + dz)
    abrigo.add(pe)
  }

  // tela de horários: apagada
  const tela = rbox(0.06, 0.34, 0.42, 0.02, '#262a31', { roughness: 0.5 })
  tela.position.set(AX - 0.21, ay + 1.38, AZ + 0.58)
  abrigo.add(tela)
  const telaVidro = rbox(0.01, 0.26, 0.34, 0.008, '#0e1116', { roughness: 0.08 })
  telaVidro.position.set(AX - 0.175, ay + 1.38, AZ + 0.58)
  abrigo.add(telaVidro)

  // lixeira ao lado do abrigo
  const lixeira = cylinder(0.13, 0.12, 0.42, '#3b4552', { roughness: 0.5, metalness: 0.3 })
  lixeira.position.set(AX + 0.05, ay + 0.21, AZ - 0.92)
  abrigo.add(lixeira)
  const tampa = cylinder(0.14, 0.14, 0.04, '#2a313b', { roughness: 0.5, metalness: 0.3 })
  tampa.position.set(AX + 0.05, ay + 0.44, AZ - 0.92)
  abrigo.add(tampa)

  // ---- ônibus vermelho, de frente em 3/4 -----------------------------------
  const onibus = new THREE.Group()
  quadro.add(onibus)

  const saia = rbox(2 * HW, FLOOR - 0.2 + 0.02, 2 * HL, 0.07, SL, { roughness: 0.4 })
  saia.position.set(0, 0.2 + (FLOOR - 0.18) / 2, 0)
  onibus.add(saia)
  const faixa = rbox(2 * HW + 0.02, 0.1, 2 * HL + 0.02, 0.04, SL_ESC, { roughness: 0.45 })
  faixa.position.set(0, 0.26, 0)
  onibus.add(faixa)

  const wallH = WALL_TOP - FLOOR
  const wallY = FLOOR + wallH / 2
  const paredeLonge = rbox(WALL_T, wallH, 2 * HL, 0.03, SL, { roughness: 0.4 })
  paredeLonge.position.set(HW - WALL_T / 2, wallY, 0)
  onibus.add(paredeLonge)
  const paredeTras = rbox(2 * HW, wallH, WALL_T, 0.03, SL, { roughness: 0.4 })
  paredeTras.position.set(0, wallY, -HL + WALL_T / 2)
  onibus.add(paredeTras)

  // lado da porta: trecho traseiro, pilar dianteiro e verga sobre o vão
  const trasLen = DOOR_Z0 + HL
  const paredeTrecho = rbox(WALL_T, wallH, trasLen, 0.03, SL, { roughness: 0.4 })
  paredeTrecho.position.set(-HW + WALL_T / 2, wallY, -HL + trasLen / 2)
  onibus.add(paredeTrecho)
  const pilarLen = HL - DOOR_Z1
  const pilar = rbox(WALL_T, wallH, pilarLen, 0.03, SL, { roughness: 0.4 })
  pilar.position.set(-HW + WALL_T / 2, wallY, DOOR_Z1 + pilarLen / 2)
  onibus.add(pilar)
  const verga = rbox(WALL_T, WALL_TOP - DOOR_TOP, DOOR_Z1 - DOOR_Z0, 0.02, SL, { roughness: 0.4 })
  verga.position.set(-HW + WALL_T / 2, (DOOR_TOP + WALL_TOP) / 2, PZ)
  onibus.add(verga)

  // janelas laterais escuras (lado da calçada) com montantes
  for (const [z0, z1] of [[-1.42, -0.62], [-0.52, 0.22]] as const) {
    const jan = rbox(0.02, 0.74, z1 - z0, 0.04, VIDRO_LATERAL, { roughness: 0.12 })
    jan.position.set(-HW - 0.006, 1.48, (z0 + z1) / 2)
    onibus.add(jan)
  }
  const janLonge = rbox(0.02, 0.74, 2.6, 0.04, VIDRO_LATERAL, { roughness: 0.12 })
  janLonge.position.set(HW + 0.006, 1.48, -0.1)
  onibus.add(janLonge)

  // moldura preta da porta: dois batentes, topo e degrau
  for (const dz of [DOOR_Z0 + 0.025, DOOR_Z1 - 0.025]) {
    const batente = rbox(0.06, DOOR_TOP - FLOOR + 0.05, 0.06, 0.02, PRETO, { roughness: 0.5 })
    batente.position.set(-HW - 0.01, (FLOOR + DOOR_TOP) / 2, dz)
    onibus.add(batente)
  }
  const batenteTopo = rbox(0.06, 0.06, DOOR_Z1 - DOOR_Z0, 0.02, PRETO, { roughness: 0.5 })
  batenteTopo.position.set(-HW - 0.01, DOOR_TOP, PZ)
  onibus.add(batenteTopo)
  const degrau = rbox(0.22, 0.05, DOOR_Z1 - DOOR_Z0 - 0.04, 0.015, '#5d636c', { roughness: 0.6 })
  degrau.position.set(-HW + 0.06, FLOOR - 0.01, PZ)
  onibus.add(degrau)

  // frente: painel baixo, colunas, para-brisa, letreiro
  const frenteBaixa = rbox(2 * HW, WS_B - 0.2, 0.18, 0.06, SL, { roughness: 0.4 })
  frenteBaixa.position.set(0, 0.2 + (WS_B - 0.2) / 2, HL - 0.09)
  onibus.add(frenteBaixa)
  for (const sx of [-1, 1]) {
    const coluna = rbox(0.09, WS_T - WS_B + 0.04, 0.1, 0.03, SL, { roughness: 0.4 })
    coluna.position.set(sx * (HW - 0.045), (WS_B + WS_T) / 2, HL - 0.05)
    onibus.add(coluna)
  }
  const cabecote = rbox(2 * HW, WALL_TOP - WS_T + 0.04, 0.14, 0.04, SL, { roughness: 0.4 })
  cabecote.position.set(0, (WS_T + WALL_TOP) / 2, HL - 0.07)
  onibus.add(cabecote)

  // para-brisa: vidro fumê, mas dá pra ver quem está dentro
  const vidroMat = mat('#2a3a4d', { roughness: 0.06, detail: 0 })
  vidroMat.transparent = true
  vidroMat.opacity = 0.32
  vidroMat.depthWrite = false
  const parabrisa = new THREE.Mesh(
    new THREE.BoxGeometry(2 * HW - 0.14, WS_T - WS_B, 0.02),
    vidroMat,
  )
  parabrisa.position.set(0, (WS_B + WS_T) / 2, HL - 0.03)
  onibus.add(parabrisa)
  // faixa escura de quebra-sol no alto do vidro
  const quebraSol = rbox(2 * HW - 0.14, 0.12, 0.022, 0.008, '#18202a', { roughness: 0.2 })
  quebraSol.position.set(0, WS_T - 0.06, HL - 0.025)
  onibus.add(quebraSol)
  for (const sx of [-0.38, 0.38]) {
    const limpador = rbox(0.5, 0.025, 0.02, 0.008, PRETO, { roughness: 0.5 })
    limpador.position.set(sx - 0.05, WS_B + 0.1, HL - 0.005)
    limpador.rotation.z = 0.35
    onibus.add(limpador)
  }

  // letreiro: NÄSTA em LED âmbar
  const letreiro = rbox(1.02, 0.24, 0.03, 0.012, '#0d0f13', { roughness: 0.3 })
  letreiro.position.set(0, (WS_T + WALL_TOP) / 2 + 0.01, HL + 0.005)
  onibus.add(letreiro)
  const glyphs: ['N' | 'Ä' | 'S' | 'T' | 'A', number][] = [
    ['N', -0.24], ['Ä', -0.12], ['S', 0], ['T', 0.12], ['A', 0.24],
  ]
  for (const [g, gx] of glyphs) {
    const l = letter(g)
    l.position.set(gx, (WS_T + WALL_TOP) / 2 - 0.005, HL + 0.025)
    onibus.add(l)
  }

  // teto claro + ar-condicionado
  const teto = rbox(2 * HW + 0.04, 0.12, 2 * HL + 0.04, 0.05, TETO, { roughness: 0.5 })
  teto.position.set(0, WALL_TOP + 0.04, 0)
  onibus.add(teto)
  const arCond = rbox(1.0, 0.13, 1.1, 0.05, '#b9bdc4', { roughness: 0.5 })
  arCond.position.set(0, WALL_TOP + 0.16, -0.65)
  onibus.add(arCond)

  // faróis amarelos, grade, para-choque, placa
  for (const sx of [-1, 1]) {
    const aro = rbox(0.32, 0.17, 0.03, 0.05, '#9aa1a8', { roughness: 0.25, metalness: 0.8 })
    aro.position.set(sx * 0.58, 0.55, HL + 0.005)
    onibus.add(aro)
    const farol = rbox(0.27, 0.12, 0.03, 0.045, FAROL, {
      roughness: 0.2,
      emissive: '#ffc23d',
      emissiveIntensity: 1.3,
    })
    farol.position.set(sx * 0.58, 0.55, HL + 0.02)
    onibus.add(farol)
    const seta = rbox(0.08, 0.06, 0.03, 0.02, '#f08a2c', {
      roughness: 0.3,
      emissive: '#e0701a',
      emissiveIntensity: 0.5,
    })
    seta.position.set(sx * 0.8, 0.55, HL + 0.015)
    onibus.add(seta)
  }
  for (const gy of [0.72, 0.79, 0.86]) {
    const grade = rbox(0.62, 0.03, 0.02, 0.01, PRETO, { roughness: 0.5 })
    grade.position.set(0, gy, HL + 0.005)
    onibus.add(grade)
  }
  const parachoque = rbox(2 * HW + 0.06, 0.15, 0.12, 0.05, PRETO, { roughness: 0.55 })
  parachoque.position.set(0, 0.28, HL + 0.03)
  onibus.add(parachoque)
  const placa = rbox(0.34, 0.09, 0.02, 0.012, '#f1f1ec', { roughness: 0.4 })
  placa.position.set(0, 0.29, HL + 0.095)
  onibus.add(placa)
  const placaBorda = rbox(0.06, 0.09, 0.022, 0.01, '#2b5fb8', { roughness: 0.4 })
  placaBorda.position.set(-0.14, 0.29, HL + 0.096)
  onibus.add(placaBorda)

  // retrovisores "orelha de coelho"
  for (const sx of [-1, 1]) {
    const out = sx < 0 ? 1.18 : 0.95 // do lado da porta, abre pra fora do vidro
    const fwd = sx < 0 ? 0.14 : 0.3
    const haste1 = limb(0.018, [sx * 0.78, 2.12, HL - 0.02], [sx * (out - 0.02), 2.02, HL + fwd - 0.04], PRETO, { roughness: 0.4 })
    const haste2 = limb(0.018, [sx * (out - 0.02), 2.02, HL + fwd - 0.04], [sx * out, 1.8, HL + fwd], PRETO, { roughness: 0.4 })
    const espelho = rbox(0.06, 0.24, 0.13, 0.03, PRETO, { roughness: 0.4 })
    espelho.position.set(sx * (out + 0.01), 1.68, HL + fwd)
    espelho.rotation.y = sx * 0.3
    onibus.add(haste1, haste2, espelho)
  }

  // rodas em caixas de roda escuras (eixo dianteiro atrás da porta)
  for (const sx of [-1, 1]) {
    for (const wz of [0.0, -1.12]) {
      const caixa = cylinder(0.37, 0.37, 0.02, '#14161a', { roughness: 0.9 })
      caixa.rotation.z = Math.PI / 2
      caixa.position.set(sx * (HW + 0.004), 0.3, wz)
      onibus.add(caixa)
      const roda = cylinder(0.3, 0.3, 0.24, '#1c1e22', { roughness: 0.75 })
      roda.rotation.z = Math.PI / 2
      roda.position.set(sx * (HW - 0.1), 0.3, wz)
      onibus.add(roda)
      const cubo = cylinder(0.15, 0.15, 0.03, '#a0a7ae', { roughness: 0.25, metalness: 0.8 })
      cubo.rotation.z = Math.PI / 2
      cubo.position.set(sx * (HW + 0.03), 0.3, wz)
      onibus.add(cubo)
      const porca = cylinder(0.05, 0.05, 0.03, '#6f767e', { roughness: 0.3, metalness: 0.8 })
      porca.rotation.z = Math.PI / 2
      porca.position.set(sx * (HW + 0.05), 0.3, wz)
      onibus.add(porca)
    }
  }

  // interior visível pelo para-brisa: piso, forro, painel, volante, banco
  const piso = rbox(2 * HW - 2 * WALL_T, 0.02, 2 * HL - 2 * WALL_T, 0.008, PISO_BUS, { roughness: 0.8 })
  piso.position.set(0, FLOOR + 0.01, 0)
  onibus.add(piso)
  const forroLonge = rbox(0.01, wallH - 0.1, 2 * HL - 0.3, 0.004, INTERIOR, { roughness: 0.7 })
  forroLonge.position.set(HW - WALL_T - 0.006, wallY, 0)
  onibus.add(forroLonge)
  const divisoria = rbox(2 * HW - 2 * WALL_T, wallH - 0.1, 0.02, 0.006, INTERIOR, { roughness: 0.7 })
  divisoria.position.set(0, wallY, -0.35)
  onibus.add(divisoria)
  const painel = rbox(2 * HW - 0.2, 0.14, 0.24, 0.04, '#2d3138', { roughness: 0.6 })
  painel.position.set(0, WS_B + 0.02, HL - 0.2)
  onibus.add(painel)
  const coluna = cylinder(0.03, 0.03, 0.3, PRETO, { roughness: 0.5 })
  coluna.position.set(MOTORISTA[0], 1.06, MOTORISTA[2] + 0.36)
  coluna.rotation.x = 0.6
  onibus.add(coluna)
  const volante = torus(0.15, 0.022, PRETO, { roughness: 0.5 })
  volante.position.set(MOTORISTA[0], 1.17, MOTORISTA[2] + 0.27)
  volante.rotation.x = -0.95
  onibus.add(volante)
  const encosto = rbox(0.44, 0.62, 0.1, 0.04, '#33415a', { roughness: 0.85 })
  encosto.position.set(MOTORISTA[0], 1.0, MOTORISTA[2] - 0.28)
  onibus.add(encosto)
  // poste de apoio amarelo junto à porta
  const balaustre = cylinder(0.025, 0.025, wallH, '#b9bec4', { roughness: 0.3, metalness: 0.7 })
  balaustre.position.set(-0.3, wallY, DOOR_Z0 - 0.12)
  onibus.add(balaustre)

  // motorista do SL (só a cabeça é peça: balança no "NESTA, não")
  const motorista = person({ body: '#2b3a52', skin: '#e8c39e', height: 1.25, armAngle: 0.2 })
  motorista.position.set(...MOTORISTA)
  for (const armName of ['armL', 'armR']) {
    const arm = motorista.getObjectByName(armName)
    if (arm) arm.rotation.x = -0.9
  }
  const gola = rbox(0.2, 0.05, 0.1, 0.02, '#e9edf2', { roughness: 0.7 })
  gola.position.set(0, 0.64, 0.17)
  motorista.add(gola)
  onibus.add(motorista)

  const cabecaMotorista = motorista.getObjectByName('head') as THREE.Group
  const bone = cylinder(0.215, 0.235, 0.12, '#1f2a3d', { roughness: 0.6 })
  bone.position.y = 0.17
  cabecaMotorista.add(bone)
  const pala = rbox(0.24, 0.025, 0.14, 0.01, '#141b28', { roughness: 0.4 })
  pala.position.set(0, 0.13, 0.22)
  pala.rotation.x = 0.15
  cabecaMotorista.add(pala)
  const bigode = capsule(0.025, 0.1, '#6b4a2e', { roughness: 0.9 })
  bigode.rotation.z = Math.PI / 2
  bigode.position.set(0, -0.07, 0.225)
  cabecaMotorista.add(bigode)

  // ---- portas: dois painéis de vidro de moldura preta, dobrando pra dentro --
  function doorPanel(dir: 1 | -1) {
    const g = new THREE.Group()
    const w = (DOOR_Z1 - DOOR_Z0) / 2 - 0.04
    const h = DOOR_TOP - FLOOR - 0.1
    const cy = FLOOR + 0.05 + h / 2
    const glassMat = mat('#a9cbe8', { roughness: 0.08, detail: 0 })
    glassMat.transparent = true
    glassMat.opacity = 0.4
    glassMat.depthWrite = false
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.02, h - 0.08, w - 0.06), glassMat)
    glass.position.set(0, cy, (dir * w) / 2)
    g.add(glass)
    for (const fy of [cy - h / 2 + 0.03, cy, cy + h / 2 - 0.03]) {
      const bar = rbox(0.04, 0.05, w, 0.015, PRETO, { roughness: 0.5 })
      bar.position.set(0, fy, (dir * w) / 2)
      g.add(bar)
    }
    for (const fz of [0.025, w - 0.025]) {
      const side = rbox(0.04, h, 0.05, 0.015, PRETO, { roughness: 0.5 })
      side.position.set(0, cy, dir * fz)
      g.add(side)
    }
    return g
  }
  const portaA = doorPanel(1)
  portaA.position.set(-HW + 0.02, 0, DOOR_Z0 + 0.04)
  portaA.rotation.y = 2.0
  onibus.add(portaA)
  const portaB = doorPanel(-1)
  portaB.position.set(-HW + 0.02, 0, DOOR_Z1 - 0.04)
  portaB.rotation.y = PORTA_B
  onibus.add(portaB)

  // ---- NERO: pantera-negra entalada (frente dentro, traseiro fora) ---------
  // +x local = pra dentro do ônibus; origem no plano da porta, no meio do vão
  const pantera = new THREE.Group()
  pantera.position.set(PX, 0, PZ)
  quadro.add(pantera)
  const PO = { roughness: 0.5 }

  const tronco = capsule(0.3, 0.95, PANTERA, PO)
  tronco.rotation.z = Math.PI / 2
  tronco.position.set(0.0, 0.88, 0)
  pantera.add(tronco)
  const garupa = sphere(0.38, PANTERA, PO)
  garupa.scale.set(1.0, 0.95, 1.05)
  garupa.position.set(-0.56, 0.84, 0)
  pantera.add(garupa)
  for (const side of [-1, 1]) {
    const anca = sphere(0.28, PANTERA, PO)
    anca.scale.set(1.15, 1.2, 0.8)
    anca.position.set(-0.58, 0.7, side * 0.22)
    pantera.add(anca)
    const ombro = sphere(0.17, PANTERA, PO)
    ombro.position.set(0.55, 1.02, side * 0.18)
    pantera.add(ombro)
  }
  const peito = sphere(0.33, PANTERA, PO)
  peito.position.set(0.5, 0.95, 0)
  pantera.add(peito)
  // pescoço torcido pra trás: do peito (dentro) até a cabeça (no vão)
  pantera.add(limb(0.16, [0.42, 1.1, 0.02], [HEAD[0] + 0.08, HEAD[1] - 0.14, HEAD[2] - 0.02], PANTERA, PO))

  // pata dianteira esquerda plantada no piso do ônibus
  pantera.add(limb(0.09, [0.6, 0.95, -0.2], [0.72, 0.58, -0.22], PANTERA, PO))
  const pataE = sphere(0.1, PANTERA, PO)
  pataE.scale.set(1.35, 0.6, 1.0)
  pataE.position.set(0.77, FLOOR + 0.05, -0.22)
  pantera.add(pataE)
  // pata dianteira direita erguida, segurando a lira
  pantera.add(limb(0.1, [0.55, 1.0, 0.18], [0.57, 1.15, 0.38], PANTERA, PO))
  pantera.add(limb(0.085, [0.57, 1.15, 0.38], [0.55, 1.27, 0.46], PANTERA, PO))
  const pataD = sphere(0.095, PANTERA, PO)
  pataD.scale.set(1.0, 1.1, 1.0)
  pataD.position.set(0.54, 1.31, 0.49)
  pantera.add(pataD)

  // patas traseiras do lado de fora: uma empurra a calçada, a outra esperneia
  pantera.add(limb(0.16, [-0.6, 0.62, -0.22], [-0.78, 0.38, -0.27], PANTERA, PO))
  pantera.add(limb(0.1, [-0.78, 0.38, -0.27], [-0.95, SIDEWALK + 0.1, -0.28], PANTERA, PO))
  const peTras1 = sphere(0.11, PANTERA, PO)
  peTras1.scale.set(1.5, 0.55, 1.0)
  peTras1.position.set(-1.0, SIDEWALK + 0.06, -0.28)
  pantera.add(peTras1)
  pantera.add(limb(0.16, [-0.62, 0.64, 0.24], [-0.8, 0.42, 0.31], PANTERA, PO))
  pantera.add(limb(0.1, [-0.8, 0.42, 0.31], [-0.94, 0.28, 0.34], PANTERA, PO))
  const peTras2 = sphere(0.11, PANTERA, PO)
  peTras2.scale.set(1.45, 0.6, 1.0)
  peTras2.rotation.z = -0.55 // dedos apontando pro chão: pendurada, sem alcançar
  peTras2.position.set(-1.0, 0.24, 0.35)
  pantera.add(peTras2)

  // ---- pança: cresce no GÔR(do) e trava nos batentes ------------------------
  const panca = new THREE.Group()
  panca.position.set(0.0, 0.82, 0)
  pantera.add(panca)
  const barriga = sphere(0.5, PANTERA_PANCA, PO)
  barriga.scale.set(1.12, 0.94, 1.12)
  panca.add(barriga)

  // ---- cabeça virada pra trás, rosnando --------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(...HEAD)
  cabeca.rotation.order = 'YXZ'
  cabeca.scale.setScalar(HEAD_S)
  pantera.add(cabeca)

  const cranio = sphere(0.27, PANTERA, PO)
  cranio.scale.set(1.05, 0.92, 1.0)
  cabeca.add(cranio)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.14, PANTERA, PO)
    bochecha.position.set(side * 0.12, -0.08, 0.12)
    cabeca.add(bochecha)
  }
  const focinho = sphere(0.12, PANTERA, PO)
  focinho.scale.set(1.15, 0.8, 0.9)
  focinho.position.set(0, -0.06, 0.2)
  cabeca.add(focinho)
  const queixo = sphere(0.1, PANTERA, PO)
  queixo.scale.set(1.1, 0.5, 1.0)
  queixo.position.set(0, -0.25, 0.16)
  cabeca.add(queixo)

  const boca = sphere(0.1, BOCA, { roughness: 0.5 })
  boca.scale.set(1.15, 0.75, 0.8)
  boca.position.set(0, -0.155, 0.22)
  cabeca.add(boca)
  const lingua = sphere(0.06, LINGUA, { roughness: 0.4 })
  lingua.scale.set(1.2, 0.4, 1.0)
  lingua.position.set(0, -0.205, 0.235)
  cabeca.add(lingua)
  const nariz = sphere(0.045, '#2f3340', { roughness: 0.3 })
  nariz.scale.set(1.3, 0.8, 0.9)
  nariz.position.set(0, -0.01, 0.31)
  cabeca.add(nariz)

  for (const side of [-1, 1]) {
    const presa = cone(0.024, 0.075, DENTE, { roughness: 0.3 })
    presa.rotation.x = Math.PI
    presa.position.set(side * 0.062, -0.14, 0.285)
    cabeca.add(presa)
    const presaBaixo = cone(0.018, 0.055, DENTE, { roughness: 0.3 })
    presaBaixo.position.set(side * 0.05, -0.215, 0.27)
    cabeca.add(presaBaixo)

    const olho = sphere(0.058, OLHO, { roughness: 0.2 })
    olho.scale.z = 0.6
    olho.position.set(side * 0.1, 0.055, 0.228)
    cabeca.add(olho)
    const pupila = sphere(0.016, '#0d0d10', { roughness: 0.2 })
    pupila.scale.set(0.6, 2.4, 0.6)
    pupila.position.set(side * 0.1, 0.055, 0.262)
    cabeca.add(pupila)
    const brilho = sphere(0.01, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.085, 0.078, 0.264)
    cabeca.add(brilho)
    // pálpebra caída em diagonal: cara de brava
    const palpebra = sphere(0.068, PANTERA, PO)
    palpebra.scale.set(1.15, 0.5, 0.7)
    palpebra.position.set(side * 0.1, 0.1, 0.225)
    palpebra.rotation.z = side * 0.4
    cabeca.add(palpebra)

    const orelha = cone(0.085, 0.15, PANTERA, PO)
    orelha.position.set(side * 0.18, 0.2, -0.05)
    orelha.rotation.set(-0.35, 0, -side * 0.75)
    cabeca.add(orelha)
    const orelhaDentro = cone(0.05, 0.09, '#4a3f4a', { roughness: 0.7 })
    orelhaDentro.position.set(side * 0.175, 0.19, -0.015)
    orelhaDentro.rotation.set(-0.35, 0, -side * 0.75)
    cabeca.add(orelhaDentro)

    for (const k of [-1, 0, 1]) {
      const bigodeGato = cylinder(0.005, 0.004, 0.22, '#cfd3da', { roughness: 0.4 }, 6)
      bigodeGato.position.set(side * 0.2, -0.07 + k * 0.025, 0.22)
      bigodeGato.rotation.set(0, side * 0.35, side * (Math.PI / 2 + k * 0.18))
      cabeca.add(bigodeGato)
    }
  }

  // ---- coroa de louros (torta) ---------------------------------------------
  const coroa = new THREE.Group()
  coroa.position.set(0, 0.17, -0.01)
  coroa.rotation.z = 0.32
  cabeca.add(coroa)
  const aroLouro = torus(0.215, 0.02, LOURO_ESC, { roughness: 0.8 })
  aroLouro.rotation.x = Math.PI / 2
  coroa.add(aroLouro)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.1
    // coroa de louros é aberta na testa (+z)
    if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.4) continue
    for (const row of [0, 1]) {
      // pivô com z apontando pra fora do aro; folha em pé, inclinada pra frente
      const pivo = new THREE.Group()
      pivo.position.set(Math.cos(a) * 0.215, 0.01 + row * 0.05, Math.sin(a) * 0.215)
      pivo.rotation.y = Math.PI / 2 - a
      const folha = sphere(0.075, row ? LOURO : LOURO_ESC, { roughness: 0.65 })
      folha.scale.set(0.42, 1.0, 0.16)
      folha.position.z = 0.012
      folha.rotation.set(0.35, 0, Math.sign(Math.cos(a) || 1) * (0.75 + row * 0.2))
      pivo.add(folha)
      coroa.add(pivo)
    }
  }

  // ---- lira dourada na pata erguida (pra dentro do ônibus) -------------------
  const lira = new THREE.Group()
  lira.position.set(0.5, 1.29, 0.57)
  lira.rotation.set(0, -0.6, -0.1)
  lira.scale.setScalar(1.5)
  pantera.add(lira)
  const LO = { roughness: 0.28, metalness: 0.6, emissive: '#7a4a00', emissiveIntensity: 0.35 }
  const caixaLira = rbox(0.2, 0.075, 0.06, 0.025, OURO, LO)
  lira.add(caixaLira)
  for (const side of [-1, 1]) {
    lira.add(limb(0.018, [side * 0.07, 0.02, 0], [side * 0.13, 0.17, 0], OURO, LO))
    lira.add(limb(0.018, [side * 0.13, 0.17, 0], [side * 0.1, 0.3, 0], OURO, LO))
    const ponta = sphere(0.028, OURO, LO)
    ponta.position.set(side * 0.105, 0.33, 0)
    lira.add(ponta)
  }
  const travessa = cylinder(0.016, 0.016, 0.24, OURO, LO)
  travessa.rotation.z = Math.PI / 2
  travessa.position.y = 0.29
  lira.add(travessa)
  for (const sx of [-0.045, -0.015, 0.015, 0.045]) {
    const corda = cylinder(0.004, 0.004, 0.26, '#fff3c4', { roughness: 0.3 }, 6)
    corda.position.set(sx, 0.165, 0.01)
    lira.add(corda)
  }

  // ---- rabo comprido pendurado pra fora, ponta enrolada ----------------------
  const rabo = new THREE.Group()
  rabo.position.set(-0.86, 0.92, 0.0)
  pantera.add(rabo)
  rabo.add(taperedTube([
    [0.06, 0.02, 0], [-0.12, -0.04, 0.04], [-0.25, -0.22, 0.09], [-0.29, -0.48, 0.12],
    [-0.25, -0.68, 0.14], [-0.13, -0.78, 0.16], [-0.02, -0.72, 0.17], [0.0, -0.61, 0.16],
    [-0.07, -0.57, 0.14],
  ], 0.062, 0.03, PANTERA, PO))

  // ---- cacho de uvas caído na calçada --------------------------------------
  const uvas = new THREE.Group()
  uvas.position.set(-1.5, SIDEWALK, 1.62)
  uvas.rotation.y = 0.6
  quadro.add(uvas)
  const cacho = new THREE.Group()
  cacho.rotation.z = Math.PI / 2 - 0.25 // deitado de lado
  cacho.position.y = 0.11
  uvas.add(cacho)
  let n = 0
  for (const [ring, count, rr] of [[0, 1, 0], [1, 4, 0.07], [2, 5, 0.1], [3, 4, 0.085], [4, 3, 0.06]] as const) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ring * 0.6
      const uva = sphere(0.055, n % 3 === 0 ? UVA_CLARA : UVA, { roughness: 0.25 })
      uva.position.set(Math.cos(a) * rr, 0.16 - ring * 0.075, Math.sin(a) * rr)
      cacho.add(uva)
      n++
    }
  }
  const talo = limb(0.012, [0, 0.17, 0], [0.02, 0.28, 0.02], '#6b4a2a', { roughness: 0.8 })
  cacho.add(talo)
  const folhaUva = sphere(0.11, '#5d8a3a', { roughness: 0.7 })
  folhaUva.scale.set(1.0, 0.07, 0.8)
  folhaUva.position.set(-0.12, 0.012, -0.12)
  uvas.add(folhaUva)
  for (let i = 0; i < 3; i++) {
    const solta = sphere(0.055, UVA, { roughness: 0.25 })
    solta.position.set(0.25 + rand() * 0.25, 0.055, -0.15 + rand() * 0.35)
    uvas.add(solta)
  }

  // ---- olhar da pantera: da porta direto pra câmera -------------------------
  const hw = toWorld(PX + HEAD[0], PZ + HEAD[2])
  const toCam = new THREE.Vector2(CAM[0] - hw.x, CAM[2] - hw.y)
  const camX = toCam.dot(U)
  const camZ = toCam.dot(V)
  const YAW_CAM = Math.atan2(camX, camZ)
  const PITCH_CAM = -Math.atan2(CAM[1] - (GY + HEAD[1]), Math.hypot(camX, camZ)) * 0.7
  // antes de rosnar, olha pro motorista lá dentro
  const YAW_DENTRO = Math.atan2(MOTORISTA[0] - (PX + HEAD[0]), MOTORISTA[2] - (PZ + HEAD[2]))
  cabeca.rotation.set(PITCH_CAM, YAW_CAM, 0.12)

  const CAB_MOT = -0.55 // motorista olha pra pantera (pose final)
  cabecaMotorista.rotation.y = CAB_MOT

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'ponto', object: base },
    { name: 'abrigo', group: 'ponto', object: abrigo },
    { name: 'onibus', group: 'onibus', object: onibus },
    { name: 'portaA', group: 'onibus', object: portaA },
    { name: 'portaB', group: 'onibus', object: portaB },
    { name: 'pantera', group: 'nero', object: pantera },
    { name: 'cabeca', group: 'nero', object: cabeca },
    { name: 'coroa', group: 'nero', object: coroa },
    { name: 'lira', group: 'nero', object: lira },
    { name: 'rabo', group: 'nero', object: rabo },
    { name: 'panca', group: 'gordo', object: panca },
    { name: 'uvas', group: 'gordo', object: uvas },
    { name: 'cabecaMotorista', group: 'nesta', object: cabecaMotorista },
  ]

  // ---- montagem ------------------------------------------------------------
  const S3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Brota um ponto de ônibus: calçada, meio-fio e o abrigo azul.',
    }),
    seq('abrigo-rise', 'abrigo', 0.3, 0.8, [riseFrom(0, 2.1)], { ease: 'easeOut' }),

    seq('onibus-chega', 'onibus', 1.6, 1.0, [riseFrom(0, 2.6), ch('position.z', -0.9, 0)], {
      ease: 'easeOut',
      caption: 'Encosta um ônibus vermelho do SL… e a porta dupla se abre.',
    }),
    seq('motorista-olha', 'cabecaMotorista', 1.6, 1.0, [ch('rotation.y', 0.4, 0)], { ease: 'easeOut' }),
    // as portas chegam fechadas com o ônibus e depois dobram pra dentro
    seq('portaA-chega', 'portaA', 1.6, 1.0, [ch('rotation.z', 0, 0)]),
    seq('portaB-chega', 'portaB', 1.6, 1.0, [ch('rotation.z', 0, 0)]),
    seq('portaA-abre', 'portaA', 2.7, 0.6, [ch('rotation.y', 0, 2.0)], { ease: 'easeOut' }),
    seq('portaB-abre', 'portaB', 2.7, 0.6, [ch('rotation.y', 0, PORTA_B)], { ease: 'easeOut' }),

    // empinada antes do salto: sobe um pouco pra as patas de trás ficarem na calçada
    seq('pantera-surge', 'pantera', 3.7, 0.8, [riseFrom(0.2, 1.9)], {
      ease: 'easeOut',
      caption: 'Quem espera é NERO — NÉR(o) —, a pantera-negra imperador, de coroa de louros e lira.',
    }),
    seq('cabeca-surge', 'cabeca', 3.7, 0.8, [ch('rotation.y', 0.6, YAW_DENTRO), ch('rotation.x', 0, 0)], {
      ease: 'easeOut',
    }),
    seq('rabo-surge', 'rabo', 3.7, 0.8, [ch('rotation.x', -0.6, 0.35)], { ease: 'easeOut' }),
    seq('coroa-pousa', 'coroa', 4.3, 0.6, [ch('position.y', 0.6, 0.17), ...S3(0.01, 1)], { ease: 'easeOut' }),
    seq('lira-cresce', 'lira', 4.5, 0.5, S3(0.01, 1.5), { ease: 'easeOut' }),

    seq('uvas-caem', 'uvas', 5.6, 0.55, [ch('position.y', 1.3, SIDEWALK)], {
      ease: 'easeIn',
      caption: 'Uva atrás de uva, cacho atrás de cacho… ficou GORDO feito barril — GÔR(do)!',
    }),
    seq('panca-infla', 'panca', 5.8, 0.9, S3(0.55, 1), { ease: 'easeOut' }),

    seq('pantera-salta', 'pantera', 7.3, 0.7, [
      ch('position.x', PX - OUTSIDE, PX + 0.05),
      ch('rotation.z', 0.22, -0.05),
    ], {
      ease: 'easeOut',
      caption: 'Ele salta pra dentro com toda a majestade… e ENTALA: a pança trava no vão!',
    }),
    seq('pantera-pula', 'pantera', 7.3, 0.35, [ch('position.y', 0.2, 0.36)], { ease: 'easeOut' }),
    seq('pantera-cai', 'pantera', 7.65, 0.35, [ch('position.y', 0.36, 0)], { ease: 'easeIn' }),
    seq('pantera-tranco', 'pantera', 8.0, 0.25, [ch('position.x', PX + 0.05, PX), ch('rotation.z', -0.05, 0)], {
      ease: 'easeOut',
    }),
    seq('coroa-entorta', 'coroa', 8.0, 0.3, [ch('rotation.z', 0, 0.32)], { ease: 'easeOut' }),
    seq('rabo-chicote', 'rabo', 8.0, 0.4, [ch('rotation.x', 0.35, -0.35)], { ease: 'easeOut' }),
    seq('motorista-ve', 'cabecaMotorista', 8.1, 0.4, [ch('rotation.y', 0, CAB_MOT)], { ease: 'easeOut' }),

    seq('motorista-nao-1', 'cabecaMotorista', 8.9, 0.25, [ch('rotation.y', CAB_MOT, CAB_MOT + 0.4)], {
      caption: 'O motorista só balança a cabeça: NESTA, não.',
    }),
    seq('motorista-nao-2', 'cabecaMotorista', 9.15, 0.3, [ch('rotation.y', CAB_MOT + 0.4, CAB_MOT - 0.35)]),
    seq('motorista-nao-3', 'cabecaMotorista', 9.45, 0.3, [ch('rotation.y', CAB_MOT - 0.35, CAB_MOT + 0.3)]),
    seq('motorista-nao-4', 'cabecaMotorista', 9.75, 0.3, [ch('rotation.y', CAB_MOT + 0.3, CAB_MOT)]),

    seq('cabeca-vira', 'cabeca', 10.3, 0.5, [
      ch('rotation.y', YAW_DENTRO, YAW_CAM),
      ch('rotation.x', 0, PITCH_CAM),
      ch('rotation.z', 0, 0.12),
    ], {
      ease: 'easeOut',
      caption: 'De coroa torta, Nero vira pra trás e rosna: NÉR… GÔR… NESTA… BUS?!',
    }),
    seq('rabo-chicote-2', 'rabo', 10.3, 0.5, [ch('rotation.x', -0.35, 0.3)], { ease: 'easeOut' }),
    seq('cabeca-rosna', 'cabeca', 10.85, 0.2, S3(HEAD_S, HEAD_S * 1.1), { ease: 'easeOut' }),
    seq('cabeca-rosna-volta', 'cabeca', 11.05, 0.35, S3(HEAD_S * 1.1, HEAD_S), { ease: 'easeInOut' }),

    seq('rabo-assenta', 'rabo', 11.8, 0.8, [ch('rotation.x', 0.3, 0.12)], {
      caption: 'När går nästa buss? — Quando sai o próximo ônibus?',
    }),
  ]

  rabo.rotation.x = 0.12

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'nar-gar-nasta-buss',
    contexto:
      'Transporte SL: no ponto quando a tela de horários apagou, quando o motorista avisa que esse não serve, à noite e no fim de semana.',
    fraseFonte: 'Quando sai o próximo ônibus?',
    fraseAlvo: 'När går nästa buss?',
    pronuncia:
      "nér gôr NÉS-ta BÖSS? ('när' com É ABERTO de 'pé' e R brando de 'caro'; 'går' com G duro, Ô FECHADO e longo de 'avô' e R brando — o mesmo 'går' de 'Går den här till T-Centralen?'; 'nästa' com É aberto e curto e S + T secos, sem 'tchi'; 'buss' com U CURTO de bico puxando pra Ô — quase 'böss' — e SS bem esticado; força em NÄS e BUSS)",
    ponteSonora:
      "NÉR(o)... GÔR(do)... NESTA? BUS?! (5 sílabas: nér-gôr-NÉS-ta-BÖSS; força no NÉS e no BUSS; NÉR = NERO, o imperador da lira, sem o -O: o português já diz NÉ-ro com É ABERTO de 'pé' e R de um toque só, de 'caro' — que é exatamente o R sueco; com Ê fechado vira 'ner' (pra baixo); GÔR = GORDO sem o -DO: G duro de 'gato', Ô FECHADO de 'avô' e LONGO, R BRANDO à caipira, nunca o R raspado carioca — é o mesmo GÔR de 'Vilket spår går tåget från?' e o 'go' arrastado de 'Går den här till T-Centralen?'; sem o R sobra 'gå', o infinitivo; e nada a ver com o IÖR de 'Det gör ont här', que é outro verbo; NESTA = o 'nesta' do português, que já tem o É ABERTO certo, como 'festa' — NÉS-ta, nunca 'nêsta' —, com S e T secos, sem 'néstcha'; BUS = o -BUS de ÔNIBUS, mas com a força em cima e curtinho: U de BICO puxando pra Ô, quase 'BÖSS', e o SS esticado de cobra; com Ü longo vira 'bus', que é travessura)",
    historia:
      "O ponto de ônibus tem imperador: NERO, uma pantera-negra de coroa de louros que passa o dia dedilhando a lira e devorando cacho de uva atrás de cacho, até ficar GORDO feito um barril. O ônibus vermelho encosta, abre a porta, ele salta com toda a majestade — e ENTALA: a pança trava no vão, a lira fica pra dentro e o rabo pra fora. O motorista só balança a cabeça: 'NESTA, não.' De coroa torta, preso no meio da porta, Nero rosna a única pergunta que importa: NÉR... GÔR... NESTA... BUS?! — e o próximo, sai quando?",
  },
  createScene,
  refine: { organic: ['pantera', 'cabeca', 'panca'] },
}

export default card
