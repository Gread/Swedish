import * as THREE from 'three'
import type { Card, CardScene, Sequence } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe,
} from '../rig/helpers'

/**
 * "Varsågod!" — VA-XÔ GÚD'!
 *
 * A girafa feirante tem a barraca de gude mais alta da feira: o estoque fica lá
 * em cima, na boca dela, e as entregas descem por uma calha em espiral enrolada
 * no pescoço. O freguês paga, ela enxota a bolinha de GUDE gigante com a língua
 * — VA, XÔ, GÚD'! — e a gude desce a espiral inteira, quica no balcão e cai
 * redondinha no saquinho: aqui está, VARSÅGOD!
 *
 * Diorama: chão de paralelepípedos, barraca de toldo verde e branco ao fundo,
 * balcão de madeira na frente à direita com o saquinho aberto, girafa de
 * avental à esquerda com o pescoço-escorregador subindo acima do toldo.
 * O azul saturado é RESERVADO à gude.
 */

const PEDRA = ['#85817b', '#7a7671', '#8f8b84', '#6f6b66']
const REJUNTE = '#4f4c48'
const MADEIRA = '#b07c45'
const MADEIRA_CLARA = '#c99a62'
const MADEIRA_ESC = '#6e4a2a'
const LONA_VERDE = '#3e8a5c'
const LONA_BRANCA = '#f1ece0'
const GIRAFA = '#dca83c'
const GIRAFA_CLARA = '#ecc977'
const MANCHA = '#8a5226'
const CRINA = '#7a4520'
const CASCO = '#3a2a20'
const AVENTAL = '#2f6f4c'
const AVENTAL_CLARO = '#4b8c66'
const LINGUA = '#7d4a9a'
const CALHA = '#d0622f'
const CALHA_ESC = '#a94a22'
const PANO = '#d9c7a3'
const PANO_ESC = '#b9a27a'
const TINTA = '#3a2a1e'
const GUDE = '#1d6ee8' // acento saturado: só a bolinha de gude

const GY = 0.16 // topo do chão
const TOP = 0.95 // tampo do balcão
const MR = 0.17 // raio da gude gigante

// girafa: corpo na diagonal, cabeça para a direita/câmera
const BODY_POS = new THREE.Vector3(-0.88, 0, -0.08)
const BODY_YAW = -0.6
const BODY_Y = 1.5 // centro do tronco

// pescoço (frame local: y sobe pelo pescoço)
const NECK_TILT = -0.2
const NECK_LEN = 1.95
const neckR = (y: number) => 0.235 - 0.05 * Math.max(0, y)

// calha em espiral (no frame do pescoço)
const SP_TOP = 1.62
const SP_BOT = 0.45
const SP_GAP = 0.05 // folga entre pescoço e calha (cabe a crina)
const SP_W = 0.42 // largura do piso da calha
const SP_THICK = 0.04
const WALL_H = 0.13 // parede externa da calha

const BAG = new THREE.Vector3(1.08, TOP, 0.6)
const RAMP_END = new THREE.Vector3(0.48, 1.24, 0.55) // fim da rampa (piso), mundo

/** Traço de letra da placa: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.025, 0.006, TINTA, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** G U D E — letras de traço grosso. */
function letter(which: 'G' | 'U' | 'D' | 'E') {
  const g = new THREE.Group()
  const t = 0.032
  if (which === 'G') {
    g.add(stroke(t, 0.17, -0.048, 0))
    g.add(stroke(0.1, t, 0.002, 0.069))
    g.add(stroke(0.1, t, 0.002, -0.069))
    g.add(stroke(t, 0.08, 0.048, -0.035))
    g.add(stroke(0.05, t, 0.03, 0.0))
  } else if (which === 'U') {
    g.add(stroke(t, 0.17, -0.048, 0.0))
    g.add(stroke(t, 0.17, 0.048, 0.0))
    g.add(stroke(0.128, t, 0, -0.069))
  } else if (which === 'D') {
    g.add(stroke(t, 0.17, -0.048, 0))
    g.add(stroke(0.075, t, -0.016, 0.069))
    g.add(stroke(0.075, t, -0.016, -0.069))
    g.add(stroke(t, 0.1, 0.048, 0))
    g.add(stroke(t, 0.06, 0.034, 0.05, 0.75))
    g.add(stroke(t, 0.06, 0.034, -0.05, -0.75))
  } else {
    g.add(stroke(t, 0.17, -0.044, 0))
    g.add(stroke(0.1, t, 0.0, 0.069))
    g.add(stroke(0.08, t, -0.01, 0.0))
    g.add(stroke(0.1, t, 0.0, -0.069))
  }
  return g
}

/** Mancha de girafa: disco achatado deitado sobre a superfície (normal n). */
function spot(r: number, p: THREE.Vector3, n: THREE.Vector3) {
  const s = sphere(r, MANCHA, { roughness: 0.85 })
  s.scale.set(1, 0.8, 0.28)
  s.position.copy(p)
  s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().normalize())
  return s
}

/**
 * Faixa helicoidal de seção retangular: entre os raios rA(y)..rB(y) e as alturas
 * y+hBot..y+hTop, enquanto y desce de y0 a y1 e o ângulo vai de th0 a th1.
 * Serve para o piso da calha (larga e baixa) e para as paredes (finas e altas).
 */
function helixBand(
  th0: number, th1: number, y0: number, y1: number,
  rA: (y: number) => number, rB: (y: number) => number,
  hBot: number, hTop: number, color: string,
) {
  const segs = Math.ceil(Math.abs(th1 - th0) / (Math.PI / 32))
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= segs; i++) {
    const k = i / segs
    const th = th0 + (th1 - th0) * k
    const y = y0 + (y1 - y0) * k
    const a = rA(y)
    const b = rB(y)
    const c = Math.cos(th)
    const s = Math.sin(th)
    // anel: interno-topo, externo-topo, externo-baixo, interno-baixo
    pos.push(a * c, y + hTop, a * s, b * c, y + hTop, b * s, b * c, y + hBot, b * s, a * c, y + hBot, a * s)
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 4
    const b = (i + 1) * 4
    for (let f = 0; f < 4; f++) {
      const f1 = (f + 1) % 4
      idx.push(a + f, b + f, a + f1, a + f1, b + f, b + f1)
    }
  }
  // tampas nas pontas
  const e = segs * 4
  idx.push(0, 1, 2, 0, 2, 3, e, e + 2, e + 1, e, e + 3, e + 2)
  let geo: THREE.BufferGeometry = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  // faces com normal própria: sem isso as quinas viram um borrão sombreado
  geo = geo.toNonIndexed()
  geo.computeVertexNormals()
  // sem UV: sem relevo fino (o normal map listraria o piso)
  const m = mat(color, { roughness: 0.42, detail: 0 })
  const mesh = new THREE.Mesh(geo, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function tube(points: THREE.Vector3[], r: number, color: string) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geo = new THREE.TubeGeometry(curve, points.length * 3, r, 10, false)
  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.4, size: 1 }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Coloca um mesh "de comprimento ao longo de x" entre dois pontos. */
function between(mesh: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  const d = b.clone().sub(a)
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.normalize())
  return mesh
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- chão de paralelepípedos ---------------------------------------------
  const piso = new THREE.Group()
  const laje = cylinder(2.62, 2.72, 0.12, '#3d3a37', { roughness: 0.95 })
  laje.position.y = 0.06
  piso.add(laje)
  const rejunte = cylinder(2.56, 2.6, 0.03, REJUNTE, { roughness: 0.95 })
  rejunte.position.y = 0.135
  piso.add(rejunte)
  const CW = 0.3
  const CD = 0.24
  for (let row = -11; row <= 11; row++) {
    const z = row * (CD + 0.03)
    const off = row % 2 === 0 ? 0 : (CW + 0.03) / 2
    for (let col = -10; col <= 10; col++) {
      const x = col * (CW + 0.03) + off
      if (Math.hypot(Math.abs(x) + CW / 2, Math.abs(z) + CD / 2) > 2.5) continue
      const pedra = rbox(CW, 0.05, CD, 0.022, PEDRA[Math.floor(rand() * PEDRA.length)], { roughness: 0.82 })
      pedra.position.set(x, GY - 0.012 + rand() * 0.008, z)
      pedra.rotation.y = (rand() - 0.5) * 0.08
      piso.add(pedra)
    }
  }
  // um caixote de feira e uma folha de couve caída, de lembrança
  const caixote = new THREE.Group()
  caixote.position.set(-1.85, GY, 1.15)
  caixote.rotation.y = 0.5
  const cxFundo = rbox(0.5, 0.3, 0.38, 0.02, MADEIRA_CLARA, { roughness: 0.8 })
  cxFundo.position.y = 0.15
  caixote.add(cxFundo)
  for (const sy of [0.08, 0.22]) {
    const ripa = rbox(0.52, 0.05, 0.4, 0.015, MADEIRA, { roughness: 0.8 })
    ripa.position.y = sy
    caixote.add(ripa)
  }
  for (let i = 0; i < 6; i++) {
    const laranja = sphere(0.075, '#e08a2a', { roughness: 0.7 })
    laranja.position.set(-0.15 + (i % 3) * 0.15, 0.33, i < 3 ? -0.08 : 0.08)
    caixote.add(laranja)
  }
  piso.add(caixote)
  root.add(piso)

  // ---- barraca: toldo listrado sobre quatro varas + prateleira de estoque ---
  const toldo = new THREE.Group()
  const TZ0 = -0.95 // frente do toldo
  const TZ1 = -1.9 // fundo
  const TX = 1.6
  const H_FRENTE = 2.2
  const H_FUNDO = 2.5
  for (const sx of [-1, 1]) {
    for (const [z, h] of [[TZ0, H_FRENTE], [TZ1, H_FUNDO]] as const) {
      const vara = cylinder(0.035, 0.04, h - GY, MADEIRA_ESC, { roughness: 0.7 })
      vara.position.set(sx * TX, GY + (h - GY) / 2, z)
      toldo.add(vara)
    }
  }
  const slope = Math.atan2(H_FUNDO - H_FRENTE, TZ0 - TZ1)
  const lonaLen = Math.hypot(H_FUNDO - H_FRENTE, TZ0 - TZ1) + 0.2
  const NSTRIPE = 12
  const SW = (TX * 2 + 0.3) / NSTRIPE
  for (let i = 0; i < NSTRIPE; i++) {
    const faixa = rbox(SW + 0.004, 0.035, lonaLen, 0.012, i % 2 === 0 ? LONA_VERDE : LONA_BRANCA, { roughness: 0.88 })
    faixa.position.set(-TX - 0.15 + SW * (i + 0.5), (H_FRENTE + H_FUNDO) / 2 + 0.03, (TZ0 + TZ1) / 2)
    faixa.rotation.x = slope
    toldo.add(faixa)
  }
  // bambinela de recortes na frente
  const banda = rbox(TX * 2 + 0.34, 0.1, 0.035, 0.015, LONA_VERDE, { roughness: 0.88 })
  banda.position.set(0, H_FRENTE - 0.02, TZ0 + 0.06)
  toldo.add(banda)
  for (let i = 0; i < NSTRIPE; i++) {
    const recorte = cylinder(SW / 2, SW / 2, 0.03, i % 2 === 0 ? LONA_VERDE : LONA_BRANCA, { roughness: 0.88 })
    recorte.rotation.x = Math.PI / 2
    recorte.position.set(-TX - 0.15 + SW * (i + 0.5), H_FRENTE - 0.07, TZ0 + 0.065)
    toldo.add(recorte)
  }
  // mesa do estoque sob o toldo, com caixotes de gude miúda (cores apagadas)
  const mesaFundo = rbox(2.9, 0.07, 0.6, 0.02, MADEIRA, { roughness: 0.7 })
  mesaFundo.position.set(0, 0.85, -1.45)
  toldo.add(mesaFundo)
  const frenteMesa = rbox(2.85, 0.62, 0.05, 0.02, MADEIRA_ESC, { roughness: 0.75 })
  frenteMesa.position.set(0, GY + 0.33, -1.17)
  toldo.add(frenteMesa)
  const miuda = ['#c45a4a', '#e2c26a', '#e9e4d6', '#6aa38a', '#b88ac2']
  for (let k = 0; k < 4; k++) {
    const cx = -1.05 + k * 0.7
    const cesto = rbox(0.5, 0.16, 0.4, 0.03, MADEIRA_CLARA, { roughness: 0.8 })
    cesto.position.set(cx, 0.97, -1.45)
    toldo.add(cesto)
    for (let m = 0; m < 9; m++) {
      const bola = sphere(0.055, miuda[(k + m) % miuda.length], { roughness: 0.2 })
      bola.position.set(cx - 0.15 + (m % 3) * 0.15 + (rand() - 0.5) * 0.03, 1.07 + rand() * 0.02, -1.58 + Math.floor(m / 3) * 0.13)
      toldo.add(bola)
    }
  }
  root.add(toldo)

  // ---- balcão de madeira ----------------------------------------------------
  const balcao = new THREE.Group()
  const BX = 0.88
  const BZ = 0.6
  const tampo = rbox(2.1, 0.08, 0.72, 0.03, MADEIRA_CLARA, { roughness: 0.6 })
  tampo.position.set(BX, TOP - 0.04, BZ)
  balcao.add(tampo)
  const frente = rbox(2.0, TOP - 0.08 - GY, 0.06, 0.02, MADEIRA, { roughness: 0.75 })
  frente.position.set(BX, GY + (TOP - 0.08 - GY) / 2, BZ + 0.3)
  balcao.add(frente)
  for (let i = -4; i <= 4; i++) {
    if (Math.abs(i) <= 1) continue // atrás da placa
    const fresta = rbox(0.016, TOP - 0.2 - GY, 0.02, 0.006, MADEIRA_ESC, { roughness: 0.85 })
    fresta.position.set(BX + i * 0.22, GY + (TOP - 0.08 - GY) / 2, BZ + 0.335)
    balcao.add(fresta)
  }
  for (const sx of [-1, 1]) {
    const lateral = rbox(0.06, TOP - 0.08 - GY, 0.66, 0.02, MADEIRA_ESC, { roughness: 0.8 })
    lateral.position.set(BX + sx * 0.98, GY + (TOP - 0.08 - GY) / 2, BZ)
    balcao.add(lateral)
  }
  // placa GUDE pendurada na frente
  const placa = new THREE.Group()
  placa.position.set(BX, 0.56, BZ + 0.36)
  const tabua = rbox(0.74, 0.28, 0.04, 0.03, '#efe3c8', { roughness: 0.7 })
  placa.add(tabua)
  const moldura = rbox(0.8, 0.34, 0.03, 0.04, MADEIRA_ESC, { roughness: 0.75 })
  moldura.position.z = -0.012
  placa.add(moldura)
  ;(['G', 'U', 'D', 'E'] as const).forEach((c, i) => {
    const l = letter(c)
    l.position.set(-0.24 + i * 0.16, 0, 0.025)
    placa.add(l)
  })
  balcao.add(placa)
  // tigelinha de madeira com gude miúda na ponta do balcão
  const tigela = lathe(
    [[0, 0], [0.1, 0], [0.15, 0.04], [0.17, 0.1], [0.155, 0.1], [0.13, 0.05], [0, 0.04]],
    MADEIRA_ESC,
    { roughness: 0.6 },
  )
  tigela.position.set(1.62, TOP, 0.5)
  balcao.add(tigela)
  for (let m = 0; m < 5; m++) {
    const bola = sphere(0.045, miuda[m], { roughness: 0.2 })
    bola.position.set(1.62 + Math.cos(m * 1.3) * 0.07, TOP + 0.09, 0.5 + Math.sin(m * 1.3) * 0.07)
    balcao.add(bola)
  }
  root.add(balcao)

  // ---- saquinho de pano aberto ---------------------------------------------
  const saquinho = new THREE.Group()
  saquinho.position.copy(BAG)
  const saco = lathe(
    [
      [0, 0], [0.19, 0], [0.25, 0.07], [0.27, 0.2], [0.245, 0.33], [0.215, 0.4],
      [0.235, 0.45], [0.26, 0.47], [0.245, 0.485], [0.21, 0.455], [0.2, 0.4],
      [0.23, 0.2], [0.18, 0.06], [0, 0.05],
    ],
    PANO,
    { roughness: 0.95 },
  )
  saquinho.add(saco)
  const cordao = torus(0.22, 0.018, PANO_ESC, { roughness: 0.9 })
  cordao.rotation.x = Math.PI / 2
  cordao.position.y = 0.405
  saquinho.add(cordao)
  for (const s of [-1, 1]) {
    const ponta = capsule(0.014, 0.12, PANO_ESC, { roughness: 0.9 })
    ponta.position.set(s * 0.04, 0.34, 0.24)
    ponta.rotation.z = s * 0.35
    saquinho.add(ponta)
    const no = sphere(0.025, PANO_ESC, { roughness: 0.9 })
    no.position.set(s * 0.065, 0.28, 0.245)
    saquinho.add(no)
  }
  root.add(saquinho)

  // ---- girafa: corpo (frame do corpo) ---------------------------------------
  const bodyFrame = (o: THREE.Object3D) => {
    o.position.copy(BODY_POS)
    o.rotation.y = BODY_YAW
    return o
  }

  const corpo = bodyFrame(new THREE.Group())
  const tronco = capsule(0.37, 0.8, GIRAFA, { roughness: 0.75 })
  tronco.rotation.z = Math.PI / 2 + 0.12
  tronco.position.y = BODY_Y
  corpo.add(tronco)
  const peito = sphere(0.38, GIRAFA, { roughness: 0.75 })
  peito.position.set(0.5, BODY_Y + 0.08, 0)
  corpo.add(peito)
  const anca = sphere(0.33, GIRAFA, { roughness: 0.75 })
  anca.position.set(-0.55, BODY_Y - 0.04, 0)
  corpo.add(anca)
  const barrigaClara = sphere(0.3, GIRAFA_CLARA, { roughness: 0.8 })
  barrigaClara.scale.set(1.8, 0.6, 0.9)
  barrigaClara.position.set(0, BODY_Y - 0.18, 0)
  corpo.add(barrigaClara)
  // rabo com pincel escuro
  const rabo = capsule(0.028, 0.45, GIRAFA, { roughness: 0.75 })
  rabo.position.set(-0.92, BODY_Y - 0.2, 0)
  rabo.rotation.z = -0.35
  corpo.add(rabo)
  const pincel = sphere(0.06, CRINA, { roughness: 0.9 })
  pincel.scale.set(0.8, 1.4, 0.8)
  pincel.position.set(-1.0, BODY_Y - 0.47, 0)
  corpo.add(pincel)
  // manchas no tronco (lados e dorso)
  for (let i = 0; i < 16; i++) {
    const x = -0.75 + (i % 6) * 0.29 + (rand() - 0.5) * 0.08
    const a = (Math.floor(i / 6) - 1) * 0.75 + (rand() - 0.5) * 0.3 + (i % 2 ? 0 : Math.PI)
    const ang = Math.floor(i / 6) === 1 ? Math.PI / 2 + (i % 2 ? 0.55 : -0.55) : a
    const n = new THREE.Vector3(0, Math.sin(ang), Math.cos(ang))
    const p = new THREE.Vector3(x, BODY_Y + x * 0.12, 0).add(n.clone().multiplyScalar(0.375))
    corpo.add(spot(0.085 + rand() * 0.03, p, n))
  }
  root.add(corpo)

  // ---- pernas -------------------------------------------------------------
  const pernas = bodyFrame(new THREE.Group())
  for (const [lx, lz] of [[0.52, 0.2], [0.52, -0.2], [-0.55, 0.19], [-0.55, -0.19]] as const) {
    const topo = BODY_Y - 0.1
    const coxa = capsule(0.12, 0.28, GIRAFA, { roughness: 0.75 })
    coxa.position.set(lx, topo - 0.18, lz)
    pernas.add(coxa)
    const canela = capsule(0.07, topo - GY - 0.36, GIRAFA, { roughness: 0.75 })
    canela.position.set(lx, GY + (topo - GY) / 2 - 0.08, lz)
    pernas.add(canela)
    const joelho = sphere(0.085, GIRAFA, { roughness: 0.75 })
    joelho.position.set(lx, GY + 0.62, lz)
    pernas.add(joelho)
    const casco = cylinder(0.075, 0.095, 0.11, CASCO, { roughness: 0.6 })
    casco.position.set(lx, GY + 0.055, lz)
    pernas.add(casco)
  }
  root.add(pernas)

  // ---- avental verde amarrado no peito --------------------------------------
  const avental = bodyFrame(new THREE.Group())
  // babador em casca curva que abraça o peito (eixo vertical no centro do peito)
  const casca = (r: number, h: number, half: number, color: string) => {
    const m = mat(color, { roughness: 0.88, size: h }) as THREE.MeshStandardMaterial
    m.side = THREE.DoubleSide
    const g = new THREE.CylinderGeometry(r, r * 1.08, h, 24, 1, true, Math.PI / 2 - half, half * 2)
    const mesh = new THREE.Mesh(g, m)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }
  const pano = casca(0.405, 0.78, 0.95, AVENTAL)
  pano.position.set(0.5, BODY_Y - 0.06, 0)
  avental.add(pano)
  const bainha = casca(0.44, 0.05, 0.97, AVENTAL_CLARO)
  bainha.position.set(0.5, BODY_Y - 0.43, 0)
  avental.add(bainha)
  const bolso = casca(0.43, 0.2, 0.45, AVENTAL_CLARO)
  bolso.position.set(0.5, BODY_Y - 0.22, 0)
  avental.add(bolso)
  // alça do pescoço: aro inclinado como o pescoço
  const alcaFrame = new THREE.Group()
  alcaFrame.position.set(0.58, BODY_Y + 0.1, 0)
  alcaFrame.rotation.z = NECK_TILT
  const alca = torus(0.245, 0.028, AVENTAL, { roughness: 0.88 })
  alca.rotation.x = Math.PI / 2
  alca.position.y = 0.3
  alcaFrame.add(alca)
  avental.add(alcaFrame)
  const faixa = torus(0.395, 0.03, AVENTAL, { roughness: 0.88 })
  faixa.rotation.y = Math.PI / 2
  faixa.position.set(0.32, BODY_Y + 0.05, 0)
  avental.add(faixa)
  for (const s of [-1, 1]) {
    const laco = sphere(0.07, AVENTAL, { roughness: 0.88 })
    laco.scale.set(0.6, 0.45, 1.3)
    laco.position.set(0.32 + s * 0.06, BODY_Y + 0.46, s * 0.08)
    laco.rotation.y = s * 0.6
    avental.add(laco)
  }
  root.add(avental)

  // ---- pescoço --------------------------------------------------------------
  const neckBase = new THREE.Vector3(0.58, BODY_Y + 0.1, 0)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), BODY_YAW)
    .add(BODY_POS)
  const neckFrame = (o: THREE.Object3D) => {
    o.position.copy(neckBase)
    o.rotation.set(0, BODY_YAW, NECK_TILT)
    return o
  }

  const pescoco = neckFrame(new THREE.Group())
  const prof: [number, number][] = [[0, -0.15]]
  for (let i = 0; i <= 8; i++) {
    const y = -0.15 + (NECK_LEN + 0.15) * (i / 8)
    prof.push([neckR(y), y])
  }
  prof.push([0.09, NECK_LEN + 0.06], [0, NECK_LEN + 0.08])
  const colo = lathe(prof, GIRAFA, { roughness: 0.75 })
  pescoco.add(colo)
  // crina curta nas costas (lado -x do pescoço)
  for (let i = 0; i < 14; i++) {
    const y = 0.05 + i * 0.135
    const tufo = rbox(0.06, 0.11, 0.05, 0.02, CRINA, { roughness: 0.9 })
    tufo.position.set(-(neckR(y) + 0.012), y, 0)
    pescoco.add(tufo)
  }
  // manchas no pescoço
  for (let i = 0; i < 14; i++) {
    const y = 0.1 + i * 0.13
    const a = i * 2.2 + rand() * 0.4
    const n = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
    const p = n.clone().multiplyScalar(neckR(y)).setY(y)
    pescoco.add(spot(0.06 + rand() * 0.015, p, n))
  }
  root.add(pescoco)

  // ---- cabeça (frame próprio, no topo do pescoço) ---------------------------
  pescoco.updateMatrixWorld(true)
  const headPos = pescoco.localToWorld(new THREE.Vector3(0.04, NECK_LEN + 0.05, 0))
  const cabeca = new THREE.Group()
  cabeca.rotation.order = 'YXZ'
  cabeca.position.copy(headPos)
  const HEAD_YAW = 0.55
  const HEAD_PITCH = 0.32
  cabeca.rotation.set(HEAD_PITCH, HEAD_YAW, 0)

  const cranio = sphere(0.2, GIRAFA, { roughness: 0.75 })
  cranio.scale.set(0.95, 0.95, 1.05)
  cabeca.add(cranio)
  const focinho = capsule(0.13, 0.2, GIRAFA_CLARA, { roughness: 0.75 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.07, 0.24)
  cabeca.add(focinho)
  const ponta = sphere(0.135, GIRAFA_CLARA, { roughness: 0.75 })
  ponta.scale.set(1, 0.85, 0.9)
  ponta.position.set(0, -0.09, 0.4)
  cabeca.add(ponta)
  for (const s of [-1, 1]) {
    const narina = sphere(0.022, CRINA, { roughness: 0.6 })
    narina.scale.set(1, 0.6, 1)
    narina.position.set(s * 0.055, -0.02, 0.5)
    cabeca.add(narina)

    const ossicone = cylinder(0.032, 0.04, 0.2, GIRAFA, { roughness: 0.75 })
    ossicone.position.set(s * 0.085, 0.24, -0.05)
    ossicone.rotation.z = -s * 0.15
    cabeca.add(ossicone)
    const bolota = sphere(0.05, CRINA, { roughness: 0.85 })
    bolota.position.set(s * 0.1, 0.345, -0.05)
    cabeca.add(bolota)

    const orelha = capsule(0.045, 0.12, GIRAFA, { roughness: 0.75 })
    orelha.scale.set(1, 1, 0.55)
    orelha.position.set(s * 0.22, 0.12, -0.08)
    orelha.rotation.z = -s * 1.15
    cabeca.add(orelha)

    const esclera = sphere(0.055, '#ffffff', { roughness: 0.25 })
    esclera.position.set(s * 0.135, 0.07, 0.13)
    esclera.scale.z = 0.6
    const pupila = sphere(0.028, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(s * 0.14, 0.06, 0.163)
    cabeca.add(esclera, pupila)
    for (let k = 0; k < 3; k++) {
      const cilio = capsule(0.008, 0.035, '#2a1a12', { roughness: 0.6 })
      cilio.position.set(s * (0.11 + k * 0.025), 0.125, 0.15)
      cilio.rotation.z = -s * (0.3 + k * 0.35)
      cabeca.add(cilio)
    }
  }
  // língua roxa esticada para fora
  const lingua = capsule(0.05, 0.26, LINGUA, { roughness: 0.4 })
  lingua.scale.set(1.35, 1, 0.6)
  lingua.position.set(0.02, -0.27, 0.63)
  lingua.rotation.set(2.24, 0, 0.2)
  cabeca.add(lingua)
  const boca = rbox(0.14, 0.02, 0.06, 0.01, '#5a3020', { roughness: 0.6 })
  boca.position.set(0, -0.155, 0.49)
  cabeca.add(boca)
  root.add(cabeca)

  // ---- calha em espiral (mesmo frame do pescoço) ----------------------------
  const calha = neckFrame(new THREE.Group())
  root.add(calha)
  calha.updateMatrixWorld(true)
  const rIn = (y: number) => neckR(y) + SP_GAP
  const rMid = (y: number) => rIn(y) + SP_W / 2

  // ângulo final: a rampa sai tangente rumo ao balcão
  const rampLocal = calha.worldToLocal(RAMP_END.clone())
  const phiP = Math.atan2(rampLocal.z, rampLocal.x)
  const dP = Math.hypot(rampLocal.x, rampLocal.z)
  const thEnd = phiP - Math.acos(Math.min(0.99, rMid(SP_BOT) / dP))
  // ângulo inicial: logo abaixo da boca
  const mouthWorld = new THREE.Vector3(0, -0.22, 0.6).applyEuler(cabeca.rotation).add(headPos)
  const mouthLocal = calha.worldToLocal(mouthWorld.clone())
  let thStart = Math.atan2(mouthLocal.z, mouthLocal.x)
  while (thEnd - thStart > 2.6 * Math.PI * 2) thStart += Math.PI * 2
  while (thEnd - thStart < 1.8 * Math.PI * 2) thStart -= Math.PI * 2
  const spiralY = (th: number) => SP_TOP + (SP_BOT - SP_TOP) * ((th - thStart) / (thEnd - thStart))

  const rOut = (y: number) => rIn(y) + SP_W
  // piso largo + parede externa alta (com friso) + mureta interna baixa
  calha.add(helixBand(thStart, thEnd, SP_TOP, SP_BOT, rIn, rOut, -SP_THICK, 0, CALHA))
  calha.add(helixBand(thStart, thEnd, SP_TOP, SP_BOT, (y) => rOut(y) - 0.035, rOut, -SP_THICK, WALL_H, CALHA))
  calha.add(helixBand(thStart, thEnd, SP_TOP, SP_BOT, rIn, (y) => rIn(y) + 0.03, -SP_THICK, 0.06, CALHA_ESC))
  const friso: THREE.Vector3[] = []
  const NR = 90
  for (let i = 0; i <= NR; i++) {
    const th = thStart + (thEnd - thStart) * (i / NR)
    const y = spiralY(th)
    const ro = rOut(y) - 0.017
    friso.push(new THREE.Vector3(ro * Math.cos(th), y + WALL_H, ro * Math.sin(th)))
  }
  calha.add(tube(friso, 0.028, CALHA_ESC))
  // suportes ligando a calha ao pescoço
  for (let k = 0; k < 7; k++) {
    const th = thStart + (thEnd - thStart) * ((k + 0.5) / 7)
    const y = spiralY(th) - SP_THICK - 0.015
    const a = new THREE.Vector3(neckR(y) * 0.85 * Math.cos(th), y, neckR(y) * 0.85 * Math.sin(th))
    const b = new THREE.Vector3((rIn(y) + 0.08) * Math.cos(th), y, (rIn(y) + 0.08) * Math.sin(th))
    const sup = rbox(1, 0.035, 0.06, 0.012, CALHA_ESC, { roughness: 0.5 })
    between(sup, a, b)
    sup.scale.x = a.distanceTo(b)
    calha.add(sup)
  }
  // rampa reta do fim da espiral até sobre o balcão (calha em U)
  const yEnd = spiralY(thEnd)
  const rampA = new THREE.Vector3(rMid(SP_BOT) * Math.cos(thEnd), yEnd, rMid(SP_BOT) * Math.sin(thEnd))
  const rampB = rampLocal.clone()
  const dRamp = rampB.clone().sub(rampA)
  const rampLen = dRamp.length()
  const rampa = new THREE.Group()
  rampa.rotation.order = 'YZX' // inclina (z) e depois aponta (y): sem rolar de lado
  rampa.position.copy(rampA).add(rampB).multiplyScalar(0.5)
  rampa.rotation.set(0, Math.atan2(-dRamp.z, dRamp.x), Math.atan2(dRamp.y, Math.hypot(dRamp.x, dRamp.z)))
  const rampaPiso = rbox(rampLen + 0.06, SP_THICK, SP_W, 0.015, CALHA, { roughness: 0.42 })
  rampaPiso.position.y = -SP_THICK / 2
  rampa.add(rampaPiso)
  for (const s of [-1, 1]) {
    const parede = rbox(rampLen + 0.06, WALL_H + SP_THICK, 0.035, 0.012, CALHA, { roughness: 0.42 })
    parede.position.set(0, (WALL_H - SP_THICK) / 2, s * (SP_W / 2 - 0.017))
    rampa.add(parede)
    const borda = cylinder(0.028, 0.028, rampLen + 0.06, CALHA_ESC, { roughness: 0.4 })
    borda.rotation.z = Math.PI / 2
    borda.position.set(0, WALL_H, s * (SP_W / 2 - 0.017))
    rampa.add(borda)
  }
  calha.add(rampa)

  // ---- a GUDE gigante -------------------------------------------------------
  const gude = new THREE.Group()
  const vidro = new THREE.MeshPhysicalMaterial({
    color: GUDE, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04,
  })
  const bola = new THREE.Mesh(new THREE.SphereGeometry(MR, 40, 40), vidro)
  bola.castShadow = true
  bola.receiveShadow = true
  gude.add(bola)
  // fita "olho de gato" por dentro: aro claro torcido na superfície
  for (const [rx, rz, c] of [[0.5, 0.3, '#bfe0ff'], [-0.6, 1.2, '#ffffff']] as const) {
    const fita = new THREE.Mesh(
      new THREE.TorusGeometry(MR * 0.985, MR * 0.07, 12, 48),
      new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.1, clearcoat: 1 }),
    )
    fita.rotation.set(rx, 0, rz)
    fita.scale.set(1, 1, 0.35)
    gude.add(fita)
  }
  root.add(gude)

  // trajeto da gude no mundo (pose final da calha)
  const toW = (v: THREE.Vector3) => calha.localToWorld(v.clone())
  const path: THREE.Vector3[] = []
  path.push(mouthWorld.clone())
  const turns = (thEnd - thStart) / (Math.PI * 2)
  const NS = Math.round(turns * 10)
  for (let i = 0; i <= NS; i++) {
    const th = thStart + (thEnd - thStart) * (i / NS)
    const y = spiralY(th)
    path.push(toW(new THREE.Vector3(rMid(y) * Math.cos(th), y + MR, rMid(y) * Math.sin(th))))
  }
  path.push(toW(rampB.clone().add(new THREE.Vector3(0, MR, 0))))
  const BOUNCE = new THREE.Vector3(0.7, TOP + MR, 0.57)
  const APEX = new THREE.Vector3(0.89, TOP + 0.62, 0.59)
  const FINAL = new THREE.Vector3(BAG.x, TOP + 0.45, BAG.z)

  gude.position.copy(FINAL)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'feira', object: piso },
    { name: 'toldo', group: 'feira', object: toldo },
    { name: 'balcao', group: 'feira', object: balcao },
    { name: 'pernas', group: 'girafa', object: pernas },
    { name: 'corpo', group: 'girafa', object: corpo },
    { name: 'pescoco', group: 'girafa', object: pescoco },
    { name: 'cabeca', group: 'girafa', object: cabeca },
    { name: 'avental', group: 'girafa', object: avental },
    { name: 'calha', group: 'calha', object: calha },
    { name: 'saquinho', group: 'saquinho', object: saquinho },
    { name: 'gude', group: 'gude', object: gude },
  ]

  // ---- montagem ------------------------------------------------------------
  const P = (v: THREE.Vector3, w: THREE.Vector3) => [
    ch('position.x', v.x, w.x), ch('position.y', v.y, w.y), ch('position.z', v.z, w.z),
  ]
  const S = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  const build: Sequence[] = [
    seq('piso-rise', 'piso', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Dia de feira: sobe o chão de paralelepípedos, a barraca de toldo listrado e o balcão.',
    }),
    seq('toldo-rise', 'toldo', 0.3, 0.9, [riseFrom(0, 2.6)], { ease: 'easeOut' }),
    seq('balcao-rise', 'balcao', 0.55, 0.8, [riseFrom(0, 1.1)], { ease: 'easeOut' }),

    seq('pernas-rise', 'pernas', 1.9, 0.7, [riseFrom(0, 1.5)], {
      ease: 'easeOut',
      caption: 'A feirante é uma GIRAFA de avental: a barraca de gude mais alta da feira.',
    }),
    seq('corpo-rise', 'corpo', 2.0, 0.7, [riseFrom(0, 1.9)], { ease: 'easeOut' }),
    seq('pescoco-cresce', 'pescoco', 2.5, 0.9, [ch('scale.y', 0.08, 1)], { ease: 'easeOut' }),
    seq('cabeca-sobe', 'cabeca', 2.5, 0.9, P(neckBase.clone().setY(neckBase.y + 0.2), headPos), { ease: 'easeOut' }),
    seq('avental-amarra', 'avental', 3.3, 0.5, S(0.85, 1), { ease: 'easeOut' }),

    seq('calha-enrola', 'calha', 4.4, 1.1, [
      ...S(0.02, 1), ch('rotation.y', BODY_YAW - Math.PI * 2, BODY_YAW),
    ], {
      ease: 'easeOut',
      caption: 'No pescoço dela, uma calha em espiral: é por ali que as entregas descem.',
    }),

    seq('saquinho-abre', 'saquinho', 6.0, 0.6, [...S(0.05, 1)], {
      ease: 'easeOut',
      caption: 'O freguês paga e deixa o saquinho de pano aberto no balcão…',
    }),

    seq('gude-surge', 'gude', 7.2, 0.5, [...S(0.02, 1), ...P(mouthWorld, mouthWorld)], {
      ease: 'easeOut',
      caption: '…e lá de cima ela solta uma GUDE gigante e enxota com a língua: VA, XÔ, GÚD\'!',
    }),
    seq('cabeca-enxota', 'cabeca', 7.75, 0.3, [ch('rotation.x', HEAD_PITCH, HEAD_PITCH + 0.3)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', 8.05, 0.4, [ch('rotation.x', HEAD_PITCH + 0.3, HEAD_PITCH)], { ease: 'easeInOut' }),
  ]

  // descida: segmento a segmento pela espiral, girando
  let t = 7.9
  let spin = 0
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]
    const b = path[i + 1]
    const dur = i === 0 ? 0.35 : i === path.length - 2 ? 0.3 : 0.11
    const dSpin = (a.distanceTo(b) / MR) * 0.8
    build.push(seq(`gude-desce-${i}`, 'gude', t, dur, [
      ...P(a, b), ch('rotation.z', -spin, -(spin + dSpin)),
    ], {
      ease: i === 0 ? 'easeIn' : 'linear',
      ...(i === 1 ? { caption: 'A gude desce rodopiando a espiral inteira…' } : {}),
    }))
    t += dur
    spin += dSpin
  }
  const last = path[path.length - 1]
  build.push(
    seq('gude-cai', 'gude', t, 0.28, [...P(last, BOUNCE), ch('rotation.z', -spin, -(spin + 1.2))], {
      ease: 'easeIn',
      caption: '…quica no balcão e cai redondinha dentro do saquinho.',
    }),
    seq('gude-quica', 'gude', t + 0.28, 0.32, [
      ch('position.x', BOUNCE.x, APEX.x), ch('position.y', BOUNCE.y, APEX.y), ch('position.z', BOUNCE.z, APEX.z),
      ch('rotation.z', -(spin + 1.2), -(spin + 2.2)),
    ], { ease: 'easeOut' }),
    seq('gude-entra', 'gude', t + 0.6, 0.32, [
      ch('position.x', APEX.x, FINAL.x), ch('position.y', APEX.y, FINAL.y), ch('position.z', APEX.z, FINAL.z),
      ch('rotation.z', -(spin + 2.2), -(spin + 3.0)),
    ], { ease: 'easeIn' }),
    seq('saquinho-afunda', 'saquinho', t + 0.92, 0.15, [ch('scale.y', 1, 0.86)], {
      ease: 'easeOut',
      caption: 'Varsågod! — Aqui está! / Pode se servir!',
    }),
    seq('saquinho-volta', 'saquinho', t + 1.07, 0.35, [ch('scale.y', 0.86, 1)], { ease: 'easeOut' }),
  )
  gude.rotation.z = -(spin + 3.0)

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.7, 2.75, 7.4], target: [0.05, 1.8, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'varsagod',
    contexto:
      'Na hora de entregar algo: o troco no caixa, o café no balcão, chamando pra mesa, segurando a porta.',
    fraseFonte: 'Aqui está! / Pode se servir!',
    fraseAlvo: 'Varsågod!',
    pronuncia:
      "va-xô-GÚUD ('var så' se funde: o R some dentro de um X de xarope — VAXÔ, fraco e corrido; toda a força no GÚUD, U longo e fechado; na fala o -d quase cai: 'varsågo')",
    ponteSonora:
      "VA-XÔ GÚD'! (3 batidas; VA-XÔ fraquinho e grudado, quase uma palavra só — é o 'var så' com o R engolido pelo X de xarope, Ô FECHADO como o SÔ de 'så' das outras cartas; a força TODA cai no GÚ, U longo e fechado; GÚD' é a bolinha de GUDE com o E arrancado — nunca 'GÚ-dji', que cria uma sílaba a mais; na fala o D quase cai: 'varsågo')",
    historia:
      "A girafa tem a barraca de gude mais alta da feira: o estoque fica lá em cima, na boca dela, e as entregas descem pelo pescoço, enrolado numa calha em espiral. Quando o freguês paga, ela solta uma bolinha de GUDE gigante no alto da calha e enxota com a língua — VA, XÔ, GÚD'! A gude desce rodopiando a espiral inteira, quica uma vez no balcão e cai redondinha dentro do saquinho do freguês. Aqui está, é seu: VARSÅGOD!",
  },
  createScene,
  refine: { organic: ['corpo', 'pernas', 'pescoco', 'cabeca'] },
}

export default card
