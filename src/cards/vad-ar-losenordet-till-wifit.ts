import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat, type MatOpts,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vad är lösenordet till wifit?" — VÁ! É... LÊ SEM ORDEM... TIL UÁI-FAI-ET?
 *
 * Jantar na casa da vizinha. Ela abre a janela e ordena VÁ! — É... um
 * pombo-correio gordo pousa na mesa: o wifi dela é sem fio de verdade.
 * Empertigado feito arauto, ele segura com a asa o pergaminho que tirou do
 * tubinho da pata e LÊ, de BICO, uma senha SEM ORDEM (K7#Q). A fita vermelha
 * do rolinho tremula num TIL (~), e ele bate o bico na anilha prateada da
 * pata: UÁI-FAI... ÉT!
 *
 * Diorama: piso de tábuas escuras, parede verde-petróleo com lambri e janela
 * de duas folhas abertas para o céu (poleiro no parapeito); mesa redonda
 * branca com o celular na tela de senha; o pombo no centro, de 3/4, com o
 * pergaminho à direita. O vermelho é RESERVADO ao lacre do wifi e à fita.
 */

const SOIL = '#2c2019'
const PLANK = '#4a3122'
const PLANK_LINE = '#33221a'
const WALL = '#4f7673'
const WAINSCOT = '#3d5e5c'
const WAINSCOT_LINE = '#2f4a48'
const TRIM = '#eee6d5'
const SKY = '#b9dcef'
const WOOD = '#8a5a35'
const WOOD_DARK = '#5e3b22'
const TABLE = '#f3f0ea'
const TABLE_SHADE = '#dcd6cb'
const PHONE = '#1f2329'
const SCREEN = '#2d5d92'
const PIGEON = '#9aa6b7'
const PIGEON_LIGHT = '#b3bdcb'
const PIGEON_HEAD = '#8693a6'
const PIGEON_DARK = '#7a879a'
const FEATHER_DARK = '#3d4452'
const NECK_GREEN = '#3e9b78'
const NECK_PURPLE = '#7a4f9c'
const EYE = '#e58a2b'
const BEAK = '#d99d9a'
const CERE = '#efe9e2'
const FOOT = '#c8656a'
const PARCH = '#f1e1b9'
const PARCH_EDGE = '#d6b97f'
const INK = '#2a221d'
const LEATHER = '#7a4a2a'
const LEATHER_DARK = '#4f2f1a'
const SILVER = '#d3d8de'
const RED = '#d8262c' // acento saturado RESERVADO: lacre do wifi e fita do TIL

const GY = 0.17 // topo do piso
const TOP = 0.68 // tampo da mesa
const WALL_Z = -1.35 // face da parede
const WT = 0.16 // espessura da parede
const WX0 = -1.8 // vão da janela
const WX1 = -0.94
const WY0 = 1.0
const WY1 = 2.08
const SASH_OPEN = 2.5 // folha direita: rente à parede, fora da rota do pombo
const SASH_OPEN_E = 2.0 // folha esquerda: não passa da ponta da parede

const TABLE_X = 0.05
const TABLE_Z = 0.1

const PIGEON_POS = new THREE.Vector3(-0.27, TOP, -0.08)
const PIGEON_RY = 0.4
const PIGEON_S = 1.12 // pombo gordo, maior que a vida
const SHOULDER_L = new THREE.Vector3(0.33, 0.86, 0.04)
const SHOULDER_R = new THREE.Vector3(-0.33, 0.86, 0.04)
const WING_FOLD_X = 0.75
const WING_FOLD_Z = 0.1
const WING_SPREAD_Z = 2.0
const WING_FLAP_Z = 0.9

// pergaminho: origem no rolo de cima (mundo), virado para a câmera
const SCROLL_TOP = new THREE.Vector3(0.62, TOP + 1.1, 0.36)
const SCROLL_RY = -0.05
const SCROLL_W = 0.66
const SCROLL_H = 0.62
const GRIP_X = -0.14 // onde a ponta da asa agarra o rolo (local do pergaminho)

// cabeça: olha para as letras
const HEAD_POS = new THREE.Vector3(0, 1.12, 0.16)
const HEAD_RX = 0.32
const HEAD_RY = 0.3
const HEAD_PECK = 1.0

const ANILHA_RY = -0.25

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.012, 0.005, INK, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** K 7 # Q — letras de traço grosso, ~0.16 de altura. */
function glyph(which: 'K' | '7' | '#' | 'Q') {
  const g = new THREE.Group()
  const t = 0.032
  if (which === 'K') {
    g.add(stroke(t, 0.17, -0.045, 0))
    g.add(stroke(t, 0.115, 0.012, 0.042, -0.78))
    g.add(stroke(t, 0.115, 0.012, -0.042, 0.78))
  } else if (which === '7') {
    g.add(stroke(0.125, t, 0.002, 0.07))
    g.add(stroke(t, 0.165, 0.014, -0.012, -0.36))
  } else if (which === '#') {
    g.add(stroke(t * 0.85, 0.17, -0.03, 0, -0.16))
    g.add(stroke(t * 0.85, 0.17, 0.03, 0, -0.16))
    g.add(stroke(0.135, t * 0.85, 0, 0.034))
    g.add(stroke(0.135, t * 0.85, 0, -0.034))
  } else {
    const ring = torus(0.064, 0.016, INK, { roughness: 0.6 })
    ring.scale.set(0.92, 1.12, 0.5)
    g.add(ring)
    g.add(stroke(t, 0.075, 0.05, -0.075, 0.75))
  }
  return g
}

/** Arco do símbolo do wifi (abre para cima). */
function arc(r: number, tube: number, color: string, opts: MatOpts = {}) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 28, Math.PI / 2), mat(color, { size: r * 2, ...opts }))
  m.rotation.z = Math.PI / 4
  m.castShadow = true
  return m
}

function wifiSymbol(scale: number, color: string, opts: MatOpts = {}) {
  const g = new THREE.Group()
  for (const r of [0.03, 0.053, 0.076]) g.add(arc(r * scale, 0.011 * scale, color, opts))
  const dot = sphere(0.015 * scale, color, opts)
  dot.scale.z = 0.6
  g.add(dot)
  return g
}

/**
 * Fita chata recortada num TIL (~): faixa de largura constante ao longo de
 * um período de seno, com ponta de rabo-de-andorinha. Virada para +z.
 */
function tildeRibbon(len: number, amp: number, width: number) {
  const n = 48
  const c: THREE.Vector2[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    c.push(new THREE.Vector2(len * t, amp * Math.sin(Math.PI * 2 * t)))
  }
  const up: THREE.Vector2[] = []
  const down: THREE.Vector2[] = []
  for (let i = 0; i <= n; i++) {
    const a = c[Math.max(0, i - 1)]
    const b = c[Math.min(n, i + 1)]
    const tan = b.clone().sub(a).normalize()
    const nor = new THREE.Vector2(-tan.y, tan.x).multiplyScalar(width / 2)
    up.push(c[i].clone().add(nor))
    down.push(c[i].clone().sub(nor))
  }
  const endTan = c[n].clone().sub(c[n - 1]).normalize()
  const shape = new THREE.Shape()
  shape.moveTo(down[0].x, down[0].y)
  shape.lineTo(up[0].x, up[0].y)
  for (let i = 1; i <= n; i++) shape.lineTo(up[i].x, up[i].y)
  // rabo-de-andorinha: duas pontas e o entalhe no meio
  const tipUp = up[n].clone().add(endTan.clone().multiplyScalar(0.06))
  const notch = c[n].clone().add(endTan.clone().multiplyScalar(0.005))
  const tipDown = down[n].clone().add(endTan.clone().multiplyScalar(0.06))
  shape.lineTo(tipUp.x, tipUp.y)
  shape.lineTo(notch.x, notch.y)
  shape.lineTo(tipDown.x, tipDown.y)
  for (let i = n; i >= 0; i--) shape.lineTo(down[i].x, down[i].y)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments: 4,
  })
  geo.translate(0, 0, -0.007)
  const m = new THREE.Mesh(geo, mat(RED, { roughness: 0.38, size: 0.4 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Euler (x, 0, z) que aponta o eixo -y local na direção d. */
function aimDown(d: THREE.Vector3) {
  const n = d.clone().normalize()
  const z = Math.asin(n.x)
  const x = Math.atan2(-n.z, -n.y)
  return { x, z }
}

/** Asa: geometria ao longo de -y a partir do ombro, chata em x. */
function makeWing(side: 1 | -1, length: number) {
  const g = new THREE.Group()

  const shoulder = sphere(0.13, PIGEON_DARK, { roughness: 0.85 })
  shoulder.scale.set(0.75, 1, 1.15)
  shoulder.position.y = -0.03
  g.add(shoulder)

  const blade = sphere(0.17, PIGEON_DARK, { roughness: 0.85 })
  blade.scale.set(0.46, (length * 0.4) / 0.17, 1)
  blade.position.y = -length * 0.38
  g.add(blade)

  // duas barras pretas de pombo comum, por fora da asa
  for (const [k, by] of [[0, 0.3], [1, 0.46]] as const) {
    const bar = capsule(0.021, 0.2 - k * 0.03, FEATHER_DARK, { roughness: 0.8 })
    bar.rotation.x = Math.PI / 2
    bar.position.set(side * 0.068, -length * by, 0.01)
    g.add(bar)
  }

  // rêmiges: quatro penas escuras abertas em leque na ponta
  for (let k = 0; k < 4; k++) {
    const pena = capsule(0.042, 0.2, FEATHER_DARK, { roughness: 0.75 })
    pena.scale.x = 0.6
    pena.position.set(0, -length + 0.1, (k - 1.5) * 0.058)
    pena.rotation.x = (k - 1.5) * 0.13
    g.add(pena)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: assoalho escuro + parede com lambri e janela ------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)

  const floor = cylinder(2.56, 2.62, 0.07, PLANK, { roughness: 0.8 })
  floor.position.y = 0.135
  base.add(floor)

  // frestas das tábuas correndo para o fundo
  for (let i = -5; i <= 5; i++) {
    const x = i * 0.46
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - x * x, 0.01))
    const line = rbox(0.035, 0.02, len, 0.008, PLANK_LINE, { roughness: 0.9 })
    line.position.set(x, GY + 0.002, 0)
    base.add(line)
  }

  const WL = -2.02
  const WR = 1.95
  const WH = 2.62
  const WC = WALL_Z - WT / 2
  const wallPiece = (x0: number, x1: number, y0: number, y1: number) => {
    const p = rbox(x1 - x0, y1 - y0, WT, 0.02, WALL, { roughness: 0.9 })
    p.position.set((x0 + x1) / 2, (y0 + y1) / 2, WC)
    base.add(p)
  }
  wallPiece(WL, WX0, GY, WH)
  wallPiece(WX1, WR, GY, WH)
  wallPiece(WX0, WX1, GY, WY0)
  wallPiece(WX0, WX1, WY1, WH)

  // lambri, cimalha, rodapé e moldura do topo
  const LAMBRI = 0.95
  const lambri = rbox(WR - WL, LAMBRI - GY, 0.04, 0.012, WAINSCOT, { roughness: 0.75 })
  lambri.position.set((WL + WR) / 2, (GY + LAMBRI) / 2, WALL_Z + 0.02)
  base.add(lambri)
  for (let x = WL + 0.3; x < WR - 0.1; x += 0.36) {
    const ripa = rbox(0.022, LAMBRI - GY - 0.14, 0.02, 0.006, WAINSCOT_LINE, { roughness: 0.8 })
    ripa.position.set(x, (GY + LAMBRI) / 2, WALL_Z + 0.045)
    base.add(ripa)
  }
  const cimalha = rbox(WR - WL + 0.04, 0.05, 0.08, 0.015, TRIM, { roughness: 0.5 })
  cimalha.position.set((WL + WR) / 2, LAMBRI + 0.02, WALL_Z + 0.03)
  base.add(cimalha)
  const rodape = rbox(WR - WL + 0.02, 0.1, 0.07, 0.015, WAINSCOT_LINE, { roughness: 0.7 })
  rodape.position.set((WL + WR) / 2, GY + 0.05, WALL_Z + 0.04)
  base.add(rodape)
  const coroa = rbox(WR - WL + 0.06, 0.07, WT + 0.08, 0.02, TRIM, { roughness: 0.5 })
  coroa.position.set((WL + WR) / 2, WH, WC)
  base.add(coroa)

  // céu lá fora, atrás do vão (maior que o vão: a câmera olha de cima)
  const ceu = rbox(WX1 - WX0 + 0.5, WY1 - WY0 + 0.6, 0.04, 0.02, SKY, {
    roughness: 0.9,
    emissive: '#9ccbe6',
    emissiveIntensity: 0.45,
  })
  ceu.position.set((WX0 + WX1) / 2, (WY0 + WY1) / 2 - 0.15, WALL_Z - WT - 0.32)
  base.add(ceu)
  const nuvem = puff(0.1, '#ffffff', 5, 9, { emissive: '#e9f4fb', emissiveIntensity: 0.4 })
  nuvem.scale.set(1.6, 0.7, 0.4)
  nuvem.position.set(WX0 + 0.28, WY1 - 0.22, WALL_Z - WT - 0.27)
  base.add(nuvem)

  // caixilho e parapeito
  const jambH = WY1 - WY0 + 0.16
  for (const jx of [WX0 - 0.04, WX1 + 0.04]) {
    const jamb = rbox(0.09, jambH, WT + 0.06, 0.02, TRIM, { roughness: 0.45 })
    jamb.position.set(jx, (WY0 + WY1) / 2, WC + 0.01)
    base.add(jamb)
  }
  const verga = rbox(WX1 - WX0 + 0.18, 0.09, WT + 0.06, 0.02, TRIM, { roughness: 0.45 })
  verga.position.set((WX0 + WX1) / 2, WY1 + 0.04, WC + 0.01)
  base.add(verga)
  const parapeito = rbox(WX1 - WX0 + 0.32, 0.06, WT + 0.24, 0.02, TRIM, { roughness: 0.45 })
  parapeito.position.set((WX0 + WX1) / 2, WY0 - 0.03, WC + 0.08)
  base.add(parapeito)

  // poleiro de madeira no parapeito
  const poleiro = new THREE.Group()
  poleiro.position.set((WX0 + WX1) / 2 + 0.05, WY0, WALL_Z + 0.02)
  const pe = rbox(0.2, 0.04, 0.12, 0.012, WOOD_DARK, { roughness: 0.7 })
  pe.position.y = 0.02
  poleiro.add(pe)
  const haste = cylinder(0.018, 0.022, 0.22, WOOD, { roughness: 0.65 })
  haste.position.y = 0.15
  poleiro.add(haste)
  const barra = cylinder(0.02, 0.02, 0.4, WOOD, { roughness: 0.65 })
  barra.rotation.z = Math.PI / 2
  barra.position.y = 0.26
  poleiro.add(barra)
  for (const s of [-1, 1]) {
    const ponta = sphere(0.028, WOOD_DARK, { roughness: 0.65 })
    ponta.position.set(s * 0.2, 0.26, 0)
    poleiro.add(ponta)
  }
  base.add(poleiro)

  // quadrinho na parede: equilibra a janela do outro lado
  const quadro = new THREE.Group()
  quadro.position.set(1.32, 1.86, WALL_Z + 0.025)
  const moldura = rbox(0.46, 0.36, 0.04, 0.015, WOOD_DARK, { roughness: 0.6 })
  quadro.add(moldura)
  const tela2 = rbox(0.38, 0.28, 0.01, 0.004, '#cfe0e3', { roughness: 0.8 })
  tela2.position.z = 0.022
  quadro.add(tela2)
  const morro = sphere(0.2, '#7f9c72', { roughness: 0.85 })
  morro.scale.set(1.0, 0.45, 0.05)
  morro.position.set(-0.06, -0.14, 0.026)
  quadro.add(morro)
  const morro2 = sphere(0.16, '#6a8a60', { roughness: 0.85 })
  morro2.scale.set(1.0, 0.5, 0.05)
  morro2.position.set(0.11, -0.13, 0.028)
  quadro.add(morro2)
  const sol = cylinder(0.035, 0.035, 0.01, '#f0dca0', { roughness: 0.6 })
  sol.rotation.x = Math.PI / 2
  sol.position.set(0.1, 0.06, 0.03)
  quadro.add(sol)
  // máscara: o morro não passa da moldura
  for (const s of [-1, 1]) {
    const lado = rbox(0.06, 0.36, 0.06, 0.012, WOOD_DARK, { roughness: 0.6 })
    lado.position.set(s * 0.215, 0, 0.02)
    quadro.add(lado)
  }
  const baixo = rbox(0.46, 0.05, 0.06, 0.012, WOOD_DARK, { roughness: 0.6 })
  baixo.position.set(0, -0.17, 0.02)
  quadro.add(baixo)
  base.add(quadro)

  root.add(base)

  // ---- folhas da janela (abrem para dentro) --------------------------------
  const SW = (WX1 - WX0) / 2
  const SH = WY1 - WY0
  const makeSash = (side: 1 | -1) => {
    const g = new THREE.Group()
    const cx = side * SW / 2
    const cy = (WY0 + WY1) / 2
    for (const sx of [cx - SW / 2 + 0.03, cx + SW / 2 - 0.03]) {
      const stile = rbox(0.06, SH, 0.05, 0.012, TRIM, { roughness: 0.45 })
      stile.position.set(sx, cy, 0)
      g.add(stile)
    }
    for (const ry of [WY0 + 0.03, cy, WY1 - 0.03]) {
      const rail = rbox(SW - 0.06, 0.06, 0.05, 0.012, TRIM, { roughness: 0.45 })
      rail.position.set(cx, ry, 0)
      g.add(rail)
    }
    const glassMat = mat('#cfe6f2', { roughness: 0.08, detail: 0 })
    glassMat.transparent = true
    glassMat.opacity = 0.35
    const vidro = new THREE.Mesh(new THREE.BoxGeometry(SW - 0.08, SH - 0.08, 0.01), glassMat)
    vidro.position.set(cx, cy, 0)
    g.add(vidro)
    const macaneta = sphere(0.025, SILVER, { roughness: 0.3, metalness: 0.8 })
    macaneta.position.set(cx + side * (SW / 2 - 0.06), cy, 0.045)
    g.add(macaneta)
    return g
  }
  const folhaE = makeSash(1)
  folhaE.position.set(WX0, 0, WALL_Z - 0.03)
  folhaE.rotation.y = -SASH_OPEN_E
  root.add(folhaE)
  const folhaD = makeSash(-1)
  folhaD.position.set(WX1, 0, WALL_Z - 0.03)
  folhaD.rotation.y = SASH_OPEN
  root.add(folhaD)

  // ---- mesa redonda branca --------------------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(TABLE_X, 0, TABLE_Z)
  const tampo = lathe(
    [[0, TOP - 0.07], [0.9, TOP - 0.07], [0.94, TOP - 0.06], [0.955, TOP - 0.035], [0.945, TOP - 0.01], [0.92, TOP], [0, TOP]],
    TABLE,
    { roughness: 0.35 },
    64,
  )
  mesa.add(tampo)
  const saia = cylinder(0.8, 0.8, 0.06, TABLE_SHADE, { roughness: 0.45 }, 48)
  saia.position.y = TOP - 0.1
  mesa.add(saia)
  const coluna = lathe(
    [
      [0, GY], [0.44, GY], [0.44, GY + 0.03], [0.36, GY + 0.06], [0.17, GY + 0.1], [0.11, GY + 0.16],
      [0.085, GY + 0.3], [0.1, TOP - 0.22], [0.14, TOP - 0.16], [0.22, TOP - 0.13], [0, TOP - 0.13],
    ],
    TABLE,
    { roughness: 0.4 },
  )
  mesa.add(coluna)

  // prato com garfo: é jantar
  const prato = lathe(
    [[0, 0], [0.12, 0], [0.13, 0.008], [0.19, 0.022], [0.215, 0.032], [0.205, 0.036], [0.17, 0.027], [0.11, 0.016], [0, 0.016]],
    '#fbfaf6',
    { roughness: 0.2 },
  )
  prato.position.set(0.3, TOP, 0.58)
  mesa.add(prato)
  const friso = torus(0.18, 0.006, WALL, { roughness: 0.3 })
  friso.rotation.x = Math.PI / 2
  friso.position.set(0.3, TOP + 0.027, 0.58)
  mesa.add(friso)
  const garfo = new THREE.Group()
  garfo.position.set(0.58, TOP + 0.006, 0.5)
  garfo.rotation.y = 0.35
  const cabo = rbox(0.03, 0.012, 0.2, 0.005, SILVER, { roughness: 0.3, metalness: 0.8 })
  cabo.position.z = 0.06
  garfo.add(cabo)
  for (const dx of [-0.018, 0, 0.018]) {
    const dente = rbox(0.008, 0.01, 0.08, 0.003, SILVER, { roughness: 0.3, metalness: 0.8 })
    dente.position.set(dx, 0, -0.08)
    garfo.add(dente)
  }
  mesa.add(garfo)

  root.add(mesa)

  // ---- celular na tela de senha --------------------------------------------
  const celular = new THREE.Group()
  celular.position.set(-0.55, TOP, 0.58)
  celular.rotation.y = 0.28
  const suporte = rbox(0.22, 0.03, 0.2, 0.01, WOOD, { roughness: 0.6 })
  suporte.position.set(0, 0.015, -0.03)
  celular.add(suporte)
  const encosto = rbox(0.18, 0.24, 0.025, 0.01, WOOD, { roughness: 0.6 })
  encosto.position.set(0, 0.13, -0.11)
  encosto.rotation.x = -0.4
  celular.add(encosto)
  const aparelho = new THREE.Group()
  aparelho.position.set(0, 0.03, -0.02)
  aparelho.rotation.x = -0.38
  celular.add(aparelho)
  const corpo = rbox(0.21, 0.4, 0.026, 0.03, PHONE, { roughness: 0.35 })
  corpo.position.y = 0.2
  aparelho.add(corpo)
  const tela = rbox(0.185, 0.36, 0.006, 0.02, SCREEN, {
    roughness: 0.2,
    emissive: '#2f6db5',
    emissiveIntensity: 0.55,
  })
  tela.position.set(0, 0.2, 0.013)
  aparelho.add(tela)
  // cadeado
  const CLOCK = '#f4f7fb'
  const arco = new THREE.Mesh(
    new THREE.TorusGeometry(0.032, 0.01, 8, 20, Math.PI),
    mat(CLOCK, { emissive: '#dfe9f5', emissiveIntensity: 0.4 }),
  )
  arco.position.set(0, 0.275, 0.018)
  aparelho.add(arco)
  for (const s of [-1, 1]) {
    const perna = cylinder(0.01, 0.01, 0.03, CLOCK, { emissive: '#dfe9f5', emissiveIntensity: 0.4 }, 10)
    perna.position.set(s * 0.032, 0.262, 0.018)
    aparelho.add(perna)
  }
  const cadeado = rbox(0.1, 0.075, 0.012, 0.012, CLOCK, { emissive: '#dfe9f5', emissiveIntensity: 0.4 })
  cadeado.position.set(0, 0.225, 0.018)
  aparelho.add(cadeado)
  const furo = sphere(0.011, PHONE, { roughness: 0.4 })
  furo.position.set(0, 0.23, 0.025)
  aparelho.add(furo)
  // campo de senha ••••
  for (let i = 0; i < 4; i++) {
    const ponto = sphere(0.011, CLOCK, { emissive: '#dfe9f5', emissiveIntensity: 0.4 })
    ponto.position.set(-0.045 + i * 0.03, 0.13, 0.018)
    aparelho.add(ponto)
  }
  root.add(celular)

  // ---- POMBO-CORREIO gordo -------------------------------------------------
  const pombo = new THREE.Group()
  pombo.position.copy(PIGEON_POS)
  pombo.rotation.y = PIGEON_RY
  pombo.scale.setScalar(PIGEON_S)
  root.add(pombo)

  const corpoP = sphere(0.42, PIGEON, { roughness: 0.85 })
  corpoP.scale.set(1.0, 0.95, 1.2)
  corpoP.position.set(0, 0.55, -0.05)
  pombo.add(corpoP)

  const peito = sphere(0.34, PIGEON_LIGHT, { roughness: 0.85 })
  peito.scale.set(1.05, 1.1, 0.95)
  peito.position.set(0, 0.7, 0.17)
  pombo.add(peito)

  const pescoco = sphere(0.22, NECK_PURPLE, { roughness: 0.4, metalness: 0.3 })
  pescoco.scale.set(1, 1.15, 1)
  pescoco.position.set(0, 0.98, 0.11)
  pombo.add(pescoco)

  const papo = sphere(0.19, NECK_GREEN, { roughness: 0.4, metalness: 0.3 })
  papo.scale.set(1.05, 1, 0.9)
  papo.position.set(0, 0.93, 0.24)
  pombo.add(papo)

  const cauda = sphere(0.2, PIGEON_DARK, { roughness: 0.85 })
  cauda.scale.set(1.15, 0.24, 1.7)
  cauda.position.set(0, 0.36, -0.62)
  cauda.rotation.x = -0.35
  pombo.add(cauda)

  const faixa = sphere(0.17, FEATHER_DARK, { roughness: 0.8 })
  faixa.scale.set(1.25, 0.2, 0.55)
  faixa.position.set(0, 0.25, -0.9)
  faixa.rotation.x = -0.35
  pombo.add(faixa)

  // pernas curtas e dedos rosados
  for (const s of [-1, 1]) {
    const perna = capsule(0.032, 0.12, FOOT, { roughness: 0.6 })
    perna.position.set(s * 0.13, 0.1, 0.12)
    pombo.add(perna)
    for (const k of [-1, 0, 1]) {
      const dedo = capsule(0.022, 0.08, FOOT, { roughness: 0.6 })
      dedo.rotation.set(Math.PI / 2, 0, 0)
      dedo.rotation.y = k * 0.45
      dedo.position.set(s * 0.13 + k * 0.035, 0.022, 0.18)
      pombo.add(dedo)
    }
    const tras = capsule(0.02, 0.05, FOOT, { roughness: 0.6 })
    tras.rotation.x = Math.PI / 2
    tras.position.set(s * 0.13, 0.022, 0.06)
    pombo.add(tras)
  }

  pombo.updateMatrixWorld(true)

  // ---- cabeça (lê de BICO) -------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.copy(HEAD_POS)
  cabeca.rotation.set(HEAD_RX, HEAD_RY, 0)
  pombo.add(cabeca)

  const cranio = sphere(0.2, PIGEON_HEAD, { roughness: 0.8 })
  cranio.scale.set(0.95, 1, 1.08)
  cranio.position.set(0, 0.1, 0.02)
  cabeca.add(cranio)

  const cera = sphere(0.045, CERE, { roughness: 0.7 })
  cera.scale.set(1, 0.7, 1.2)
  cera.position.set(0, 0.125, 0.235)
  cabeca.add(cera)

  // bico esticado e ABERTO na leitura (o LÖÖ de bico)
  const bicoSup = cone(0.05, 0.24, BEAK, { roughness: 0.45 })
  bicoSup.rotation.x = Math.PI / 2 - 0.3
  bicoSup.position.set(0, 0.11, 0.35)
  cabeca.add(bicoSup)
  const bicoInf = cone(0.04, 0.18, BEAK, { roughness: 0.45 })
  bicoInf.rotation.x = Math.PI / 2 + 0.55
  bicoInf.position.set(0, 0.02, 0.3)
  cabeca.add(bicoInf)
  const boca = sphere(0.028, '#5a2a30', { roughness: 0.6 })
  boca.position.set(0, 0.065, 0.26)
  cabeca.add(boca)

  for (const s of [-1, 1]) {
    const dir = new THREE.Vector3(s * 0.62, 0.3, 0.72).normalize()
    const olho = sphere(0.05, EYE, { roughness: 0.3 })
    olho.position.copy(dir.clone().multiplyScalar(0.19)).add(new THREE.Vector3(0, 0.1, 0.02))
    cabeca.add(olho)
    const pupila = sphere(0.026, '#141414', { roughness: 0.2 })
    pupila.position.copy(dir.clone().multiplyScalar(0.228)).add(new THREE.Vector3(0, 0.1, 0.02))
    cabeca.add(pupila)
    const brilho = sphere(0.009, '#ffffff', { roughness: 0.1 })
    brilho.position.copy(dir.clone().multiplyScalar(0.24)).add(new THREE.Vector3(0, 0.115, 0.03))
    cabeca.add(brilho)
  }

  // ---- pergaminho (filho do pombo; a asa segura o rolo de cima) ------------
  const pergaminho = new THREE.Group()
  pergaminho.position.copy(pombo.worldToLocal(SCROLL_TOP.clone()))
  pergaminho.rotation.y = SCROLL_RY - PIGEON_RY
  pombo.add(pergaminho)

  const rolo = (y: number, r: number) => {
    const papel = cylinder(r, r, SCROLL_W + 0.02, PARCH, { roughness: 0.8 })
    papel.rotation.z = Math.PI / 2
    papel.position.y = y
    pergaminho.add(papel)
    const vara = cylinder(0.022, 0.022, SCROLL_W + 0.16, WOOD_DARK, { roughness: 0.6 })
    vara.rotation.z = Math.PI / 2
    vara.position.y = y
    pergaminho.add(vara)
    for (const s of [-1, 1]) {
      const pomo = sphere(0.04, WOOD, { roughness: 0.55 })
      pomo.position.set(s * (SCROLL_W / 2 + 0.09), y, 0)
      pergaminho.add(pomo)
    }
  }
  rolo(0, 0.05)
  rolo(-SCROLL_H, 0.058)

  const borda = rbox(SCROLL_W + 0.01, SCROLL_H - 0.02, 0.008, 0.004, PARCH_EDGE, { roughness: 0.85 })
  borda.position.set(0, -SCROLL_H / 2, 0.012)
  pergaminho.add(borda)
  const folha = rbox(SCROLL_W - 0.03, SCROLL_H - 0.06, 0.01, 0.004, PARCH, { roughness: 0.85 })
  folha.position.set(0, -SCROLL_H / 2, 0.02)
  pergaminho.add(folha)

  // K7#Q: senha SEM ORDEM — letras tortas, cada uma de um tamanho
  const letras: ['K' | '7' | '#' | 'Q', number, number, number, number][] = [
    ['K', -0.22, 0.02, 0.14, 1.0],
    ['7', -0.075, -0.025, 0.14, 0.95],
    ['#', 0.075, 0.025, 0.22, 1.05],
    ['Q', 0.22, -0.01, -0.12, 1.0],
  ]
  for (const [c, x, y, rot, s] of letras) {
    const l = glyph(c)
    l.position.set(x, -0.25 + y, 0.031)
    l.rotation.z = rot
    l.scale.setScalar(s)
    pergaminho.add(l)
  }

  // lacre de cera vermelho com o símbolo do wifi
  const lacre = new THREE.Group()
  lacre.position.set(0, -0.49, 0.03)
  const disco = cylinder(0.095, 0.095, 0.03, RED, { roughness: 0.35 }, 40)
  disco.rotation.x = Math.PI / 2
  lacre.add(disco)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2
    const gota = sphere(0.032, RED, { roughness: 0.35 })
    gota.scale.z = 0.45
    gota.position.set(Math.cos(a) * 0.092, Math.sin(a) * 0.092, -0.003)
    lacre.add(gota)
  }
  const simbolo = wifiSymbol(1.15, '#ffe6cf', { roughness: 0.4 })
  simbolo.position.set(0, -0.035, 0.02)
  lacre.add(simbolo)
  pergaminho.add(lacre)

  // ---- fita vermelha do rolinho, tremulando num TIL ------------------------
  const fita = new THREE.Group()
  fita.position.set(SCROLL_W / 2 + 0.07, -SCROLL_H, 0.02)
  pergaminho.add(fita)
  fita.add(tildeRibbon(0.5, 0.085, 0.07))
  const no = sphere(0.042, RED, { roughness: 0.4 })
  no.scale.set(0.8, 1, 0.6)
  no.position.set(0.0, 0, 0)
  fita.add(no)

  // ---- asas ----------------------------------------------------------------
  pergaminho.updateMatrixWorld(true)
  // a asa termina logo atrás/acima do rolo e os "dedos" de pena o abraçam
  const onScroll = (x: number, y: number, z: number) => pergaminho.localToWorld(new THREE.Vector3(x, y, z))
  const wingEnd = pombo.worldToLocal(onScroll(GRIP_X, 0.05, -0.07))
  const reach = wingEnd.clone().sub(SHOULDER_L)
  const REACH = aimDown(reach)
  const asa = makeWing(1, reach.length())
  asa.position.copy(SHOULDER_L)
  asa.rotation.set(REACH.x, 0, REACH.z)
  pombo.add(asa)
  asa.updateMatrixWorld(true)
  for (const k of [-1, 0, 1]) {
    const a = asa.worldToLocal(onScroll(GRIP_X + k * 0.055, 0.06, -0.05))
    const b = asa.worldToLocal(onScroll(GRIP_X + k * 0.06, -0.025, 0.07))
    const dir = b.clone().sub(a)
    const dedo = capsule(0.03, Math.max(0.02, dir.length() - 0.03), FEATHER_DARK, { roughness: 0.75 })
    dedo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    dedo.position.copy(a).add(b).multiplyScalar(0.5)
    asa.add(dedo)
  }

  const asaD = makeWing(-1, 0.56)
  asaD.position.copy(SHOULDER_R)
  asaD.rotation.set(WING_FOLD_X, 0, -WING_FOLD_Z)
  pombo.add(asaD)

  // ---- tubinho de couro na pata direita (aberto) ---------------------------
  const tubinho = new THREE.Group()
  tubinho.position.set(-0.13, 0.12, 0.12)
  pombo.add(tubinho)
  // estojo comprido junto à perna, por fora (pende um pouco para fora)
  const estojoG = new THREE.Group()
  estojoG.position.set(-0.07, 0, 0.01)
  estojoG.rotation.z = -0.12
  tubinho.add(estojoG)
  const estojo = capsule(0.034, 0.15, LEATHER, { roughness: 0.65 })
  estojoG.add(estojo)
  for (const by of [-0.05, 0.0, 0.05]) {
    const costura = torus(0.035, 0.006, LEATHER_DARK, { roughness: 0.7 })
    costura.rotation.x = Math.PI / 2
    costura.position.y = by
    estojoG.add(costura)
  }
  const boca2 = cylinder(0.027, 0.027, 0.03, '#22140b', { roughness: 0.9 })
  boca2.position.y = 0.105
  estojoG.add(boca2)
  const tampa = cylinder(0.037, 0.037, 0.02, LEATHER_DARK, { roughness: 0.7 })
  tampa.position.set(-0.045, 0.1, 0.0)
  tampa.rotation.z = 1.1
  estojoG.add(tampa)
  // tira de couro que abraça perna e estojo juntos
  for (const by of [-0.035, 0.035]) {
    const tira = torus(0.078, 0.0075, LEATHER_DARK, { roughness: 0.7 })
    tira.rotation.x = Math.PI / 2
    tira.scale.set(1.0, 0.58, 1)
    tira.position.set(-0.036, by, 0.006)
    tubinho.add(tira)
  }

  // ---- anilha prateada na pata esquerda ------------------------------------
  const anilha = new THREE.Group()
  anilha.position.set(0.13, 0.105, 0.12)
  anilha.rotation.y = ANILHA_RY
  pombo.add(anilha)
  const aro = cylinder(0.05, 0.05, 0.065, SILVER, { roughness: 0.22, metalness: 0.85 })
  anilha.add(aro)
  const placa = rbox(0.1, 0.075, 0.014, 0.01, SILVER, { roughness: 0.22, metalness: 0.85 })
  placa.position.z = 0.055
  anilha.add(placa)
  const gravura = wifiSymbol(0.6, '#2a2f38', { roughness: 0.5 })
  gravura.position.set(0, -0.022, 0.063)
  anilha.add(gravura)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'folhaE', group: 'sala', object: folhaE },
    { name: 'folhaD', group: 'sala', object: folhaD },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'celular', group: 'mesa', object: celular },
    { name: 'pombo', group: 'pombo', object: pombo },
    { name: 'cabeca', group: 'pombo', object: cabeca },
    { name: 'asa', group: 'pombo', object: asa },
    { name: 'asaD', group: 'pombo', object: asaD },
    { name: 'tubinho', group: 'leitura', object: tubinho },
    { name: 'pergaminho', group: 'leitura', object: pergaminho },
    { name: 'fita', group: 'til', object: fita },
    { name: 'anilha', group: 'anilha', object: anilha },
  ]

  // ---- montagem ------------------------------------------------------------
  const P = PIGEON_POS
  const FLY_FROM = new THREE.Vector3((WX0 + WX1) / 2, WY0 + 0.45, WALL_Z - 0.1)
  const scroll0 = pergaminho.position.clone()
  const tube0 = tubinho.position

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Jantar na casa da vizinha. Você saca o celular e pergunta da senha do wifi…',
    }),
    seq('folhaE-rise', 'folhaE', 0, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),
    seq('folhaD-rise', 'folhaD', 0, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),
    seq('mesa-rise', 'mesa', 0.8, 0.8, [riseFrom(0, 1.0)], { ease: 'easeOut' }),
    seq(
      'celular-pop',
      'celular',
      1.5,
      0.45,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('folhaE-abre', 'folhaE', 2.5, 0.7, [ch('rotation.y', 0, -SASH_OPEN_E)], {
      ease: 'easeOut',
      caption: 'Ela escancara a janela e ordena: VÁ! — É… um pombo-correio gordo entra voando!',
    }),
    seq('folhaD-abre', 'folhaD', 2.5, 0.7, [ch('rotation.y', 0, SASH_OPEN)], { ease: 'easeOut' }),

    // voo: da janela até a mesa, crescendo (perspectiva) e batendo as asas
    seq(
      'pombo-voa',
      'pombo',
      3.0,
      1.1,
      [
        ch('position.x', FLY_FROM.x, P.x), ch('position.y', FLY_FROM.y, P.y), ch('position.z', FLY_FROM.z, P.z),
        ch('scale.x', 0.3, PIGEON_S), ch('scale.y', 0.3, PIGEON_S), ch('scale.z', 0.3, PIGEON_S),
        ch('rotation.y', 1.1, PIGEON_RY),
      ],
      { ease: 'easeOut' },
    ),
    seq('cabeca-olha', 'cabeca', 3.0, 1.2, [ch('rotation.y', -0.5, HEAD_RY)], { ease: 'easeInOut' }),
    seq('asa-bate1', 'asa', 3.0, 0.3, [ch('rotation.z', WING_SPREAD_Z, WING_FLAP_Z), ch('rotation.x', 0, 0)]),
    seq('asaD-bate1', 'asaD', 3.0, 0.3, [ch('rotation.z', -WING_SPREAD_Z, -WING_FLAP_Z), ch('rotation.x', 0, 0)]),
    seq('asa-bate2', 'asa', 3.3, 0.3, [ch('rotation.z', WING_FLAP_Z, WING_SPREAD_Z)]),
    seq('asaD-bate2', 'asaD', 3.3, 0.3, [ch('rotation.z', -WING_FLAP_Z, -WING_SPREAD_Z)]),
    seq('asa-fecha', 'asa', 3.6, 0.55, [ch('rotation.z', WING_SPREAD_Z, WING_FOLD_Z), ch('rotation.x', 0, WING_FOLD_X)], {
      ease: 'easeOut',
    }),
    seq('asaD-fecha', 'asaD', 3.6, 0.55, [ch('rotation.z', -WING_SPREAD_Z, -WING_FOLD_Z), ch('rotation.x', 0, WING_FOLD_X)], {
      ease: 'easeOut',
    }),

    // o correio: tubinho na pata, pergaminho sai e desenrola
    seq(
      'tubinho-pop',
      'tubinho',
      4.6,
      0.4,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'Empertigado feito arauto, ele tira um pergaminho do tubinho da pata…',
      },
    ),
    seq('asa-ergue', 'asa', 5.0, 0.6, [ch('rotation.x', WING_FOLD_X, REACH.x), ch('rotation.z', WING_FOLD_Z, REACH.z)], {
      ease: 'easeInOut',
    }),
    seq(
      'pergaminho-sai',
      'pergaminho',
      5.0,
      0.6,
      [
        ch('position.x', tube0.x, scroll0.x), ch('position.y', tube0.y + 0.1, scroll0.y), ch('position.z', tube0.z, scroll0.z),
        ch('scale.x', 0.12, 1), ch('scale.z', 0.12, 1), ch('scale.y', 0.06, 0.08),
      ],
      { ease: 'easeInOut' },
    ),
    seq('pergaminho-desenrola', 'pergaminho', 5.6, 0.7, [ch('scale.y', 0.08, 1)], { ease: 'easeOut' }),

    // leitura de BICO
    seq('cabeca-le', 'cabeca', 6.3, 0.4, [ch('rotation.x', 0, HEAD_RX + 0.1)], {
      ease: 'easeOut',
      caption: '…e LÊ em voz alta, de BICO, uma senha SEM ORDEM nenhuma: K7#Q! LÖÖ-SEN-ÚURDET.',
    }),
    seq('cabeca-le2', 'cabeca', 6.7, 0.35, [ch('rotation.x', HEAD_RX + 0.1, HEAD_RX - 0.06)]),
    seq('cabeca-le3', 'cabeca', 7.05, 0.35, [ch('rotation.x', HEAD_RX - 0.06, HEAD_RX + 0.1)]),
    seq('cabeca-le4', 'cabeca', 7.4, 0.4, [ch('rotation.x', HEAD_RX + 0.1, HEAD_RX)]),

    // TIL
    seq('fita-solta', 'fita', 8.2, 0.7, [ch('scale.x', 0.01, 1), ch('rotation.z', -0.9, 0.1)], {
      ease: 'easeOut',
      caption: 'A fita do rolinho se solta e tremula enrolada num TIL ~',
    }),
    seq('fita-tremula', 'fita', 8.9, 0.6, [ch('rotation.z', 0.1, -0.07)]),

    // UÁI-FAI… ÉT!
    seq('pombo-curva', 'pombo', 9.6, 0.25, [ch('rotation.x', 0, 0.22)], {
      ease: 'easeIn',
      caption: '…e ele bate o bico na anilha prateada da pata: UÁI-FAI… ÉT!',
    }),
    seq('cabeca-bica', 'cabeca', 9.6, 0.25, [ch('rotation.x', HEAD_RX, HEAD_PECK)], { ease: 'easeIn' }),
    seq(
      'anilha-pop',
      'anilha',
      9.8,
      0.35,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('anilha-gira', 'anilha', 9.8, 0.8, [ch('rotation.y', ANILHA_RY - Math.PI * 2, ANILHA_RY)], { ease: 'easeOut' }),
    seq('pombo-volta', 'pombo', 9.85, 0.45, [ch('rotation.x', 0.22, 0)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', 9.85, 0.45, [ch('rotation.x', HEAD_PECK, HEAD_RX)], { ease: 'easeOut' }),

    seq('fita-assenta', 'fita', 10.8, 0.8, [ch('rotation.z', -0.07, 0)], {
      caption: 'Vad är lösenordet till wifit? — Qual é a senha do wifi?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 2.3, 3.45], target: [0.1, 1.32, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-ar-losenordet-till-wifit',
    contexto:
      "Visita: chegando na casa de alguém, no café, no hotel ou na sala de reunião. Muitas vezes a resposta é 'Det står på routern' (está escrito no roteador) — ou um papelzinho preso na geladeira.",
    fraseFonte: 'Qual é a senha do wifi?',
    fraseAlvo: 'Vad är lösenordet till wifit?',
    pronuncia:
      "va é LÖÖ-sen-ÚU-det til UÁI-fai-et? ('vad' perde o d; 'lösenordet' com a força no LÖÖ, boca em bico de Ô e língua de Ê, longo, e uma segunda força no 'ord', U fechado e longo; o 'rd' vira um D de língua dobrada pra trás; 'wifit' se escreve com -t mas se fala UÁI-fai-et: o 'uai-fai' do Brasil é a pronúncia que o dicionário sueco dá primeiro, e muitos suecos dizem VÁI-fai — as duas valem —, com a força no UÁI; o -et do fim é o artigo)",
    ponteSonora:
      "VÁ! É... LÊ SEM ORDEM... TIL UÁI-FAI-ET? (10 sílabas: va-é-LÖÖ-se-nuur-det-til-UÁI-fai-et; tônicas em LÖÖ, ÚU e UÁI; VÁ! É = o MESMO 'vad är' de 'Vad är klockan?' — VÁ sem R (com R vira 'var', onde) e o É aberto e curto; LÊ SEM ORDEM = 'lösenord', a senha que o pombo lê com as letras SEM ORDEM nenhuma — e pombo não tem lábios: lê de BICO, e o bico conserta as duas vogais; LÊ = a língua parada no Ê e os lábios empurrados num bico de Ô, longo: LÖÖ, o mesmo truque do TRÖTT, do FÖÖ e do MÖÖ-te, e é nele que cai a força; é o TERCEIRO jeito de ler do baralho: a fada de 'Är det ledigt här?' lê de boquinha fechada (LÊÊ, 'ledigt'), o palhaço de 'Jag lär mig svenska' lê escancarado (LÉÉR, 'lär') e o pombo lê de BICO (LÖÖ, 'lösen'); sem o bico sai 'le-'; SEM fecha num N DE VERDADE, sem nasal, e esse N já gruda no 'ord': LÖÖ-se-NUUR; ORDEM = o bico fecha também o Ó: o pombo arrulha em U, ÚUR — U FECHADO e LONGO, a segunda força da palavra; 'ord' rima com o BÚR'D do burro de 'Ett bord för två' e tem o mesmo U de BUR ('Var bor du?') e de STÚR —, e o R se derrete num D de língua dobrada pra trás, à caipira, como no CÓRT de 'kort'; com o Ó aberto de 'ordem' a vogal sai errada; o -DEM vira -DET: sem nasal, E curto e T leve (na fala rápida muito sueco quase engole esse T) — é o artigo, 'A senha'; TIL = o til (~) de 'en gång till' e 'Lycka till', I curto e L de verdade; UÁI-FAI = 'wifi' exatamente como o Brasil já fala — o dicionário sueco (Svensk ordbok) dá esse som em primeiro lugar, 'waj-faj', e muitos suecos dizem VÁI-fai, as duas valem —, força no UÁI e o FAI fraquinho; -ET = o toque seco do bico na anilha, um 'ét' curtinho, o artigo de novo: escreve-se 'wifit', fala-se UÁI-fai-et)",
    historia:
      "Você chega pro jantar na casa da vizinha, saca o celular e pergunta da senha. Ela abre a janela e ordena: VÁ! — É... um pombo-correio gordo, de peito estufado, que pousa na mesa com um rolinho amarrado na pata: o wifi dela é sem fio de verdade. Empertigado como um arauto, ele desenrola o pergaminho e LÊ em voz alta — de BICO, que pombo não tem lábios — uma senha SEM ORDEM nenhuma: K, 7, cerquilha, Q; e até o 'ordem' sai arrulhado em U: LÖÖ-SEN-ÚURDET. A fita do rolinho cai enrolada num TIL, e o pombo bate o bico na anilha da pata, gravada WIFI: UÁI-FAI... ÉT! É assim que se pede a senha do wifi na casa dos outros.",
  },
  createScene,
  refine: { organic: ['pombo', 'cabeca', 'asa', 'asaD'] },
}

export default card
