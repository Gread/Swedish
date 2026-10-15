import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Hur stavar man det?" — sala de interrogatório: o filtro do aquário ronca
 * RRÜR!, o detetive bate a lupa na mesa ("você esTÁVA AR-MAN…"), engasga com a
 * fumaça do cachimbo no MAN e, no fim, bate a caneta no 'AX?' rabiscado no
 * bloquinho virado pro aquário: DÊ? — como é que se escreve isso?
 *
 * Diorama: piso de tábuas escuras; mesa de metal cinza; abajur de cúpula verde;
 * aquário com o axolote rosa de brânquias rosa-choque (o acento) sorrindo de
 * frente; detetive de sobretudo bege à esquerda, debruçado sobre a mesa.
 */

const SOIL = '#2a1f17'
const PLANK = '#3d2b1e'
const PLANK_LINE = '#24180f'
const METAL = '#848c93'
const METAL_DARK = '#5c646b'
const METAL_LIGHT = '#c3c9ce'
const BRASS = '#b8913f'
const SHADE = '#2f6a4b'
const BULB = '#fff3c4'
const GLOW = '#ffcf5a'
const FRAME = '#1c2024'
const GLASS = '#d4eef8'
const WATER = '#62b3d4'
const SAND = '#cbb68b'
const PLANT = '#3f8a52'
const AXO = '#f6c0cb'
const AXO_LIGHT = '#fcdce2'
const AXO_DARK = '#e49aac'
const ACCENT = '#ff2a86' // rosa-choque: RESERVADO às brânquias do axolote
const ACCENT_LIGHT = '#ff5fa6'
const COAT = '#c6a777'
const COAT_DARK = '#9f8157'
const HAT = '#5a3b27'
const HAT_BAND = '#2a1c13'
const SKIN = '#e8c39e'
const MUSTACHE = '#4a2f1f'
const PIPE = '#6e3f22'
const SMOKE = '#c8c7cb'
const PAPER = '#f8f5ec'
const COVER = '#2f4062' // capa azul-marinho do bloquinho
const INK = '#1a2546'
const RULE = '#a9c6e3'
const LENS = '#9fd2ee'

const GY = 0.18 // topo do piso
const TOP = GY + 0.62 // tampo da mesa
const TX = 0.22
const TW = 1.84
const TD = 1.0

// aquário (origem na base, sobre a mesa)
const AQX = 0.6
const AQZ = -0.06
const AW = 1.0
const AH = 0.66
const AD = 0.56
const G0 = 0.06 // fundo do vidro
const GT = G0 + 0.07 // topo do cascalho
const WH = AH * 0.84 // altura da água
const AXO_S = 1.25
const AXO_YAW = -0.3

// detetive
const DX = -1.02
const DZ = 0.0
const D_YAW = 0.7
const D_LEAN = 0.12
// onde a mão da caneta quer ficar: à esquerda da borda do bloquinho, na frente
const PEN_HAND = new THREE.Vector3(-0.62, 0.9, 0.42)

// bloquinho
const NX = -0.2
const NZ = 0.15
const N_YAW = 0.45
const N_YAW_OPEN = -0.5 // aberto meio de frente pro detetive, antes de virar
const N_TILT = -0.22
const PW = 0.56
const PH = 0.4

// abajur
const LX = -0.02
const LZ = -0.36

const CAM: [number, number, number] = [-0.1, 2.05, 3.28]
const CAM_TARGET: [number, number, number] = [-0.12, 1.0, 0.0]

/** Traço de letra: caixinha fina de tinta em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.01, 0.005, INK, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** A, X e ? de traço grosso — o rabisco do bloquinho. */
function glyph(which: 'A' | 'X' | '?') {
  const g = new THREE.Group()
  const t = 0.036
  if (which === 'A') {
    g.add(stroke(t, 0.2, -0.034, 0, -0.33))
    g.add(stroke(t, 0.2, 0.034, 0, 0.33))
    g.add(stroke(0.09, 0.03, 0, -0.035, 0.05))
  } else if (which === 'X') {
    g.add(stroke(t, 0.21, 0, 0, 0.5))
    g.add(stroke(t, 0.21, 0, 0, -0.5))
  } else {
    // gancho: arco de 3/4 de volta, da esquerda por cima até embaixo no meio
    const geo = new THREE.TorusGeometry(0.046, 0.018, 10, 36, Math.PI * 1.5)
    geo.rotateZ(-Math.PI / 2)
    const arco = new THREE.Mesh(geo, mat(INK, { roughness: 0.5 }))
    arco.position.y = 0.05
    arco.scale.z = 0.4
    g.add(arco)
    g.add(stroke(t, 0.05, 0, -0.016))
    const ponto = rbox(0.04, 0.036, 0.01, 0.012, INK, { roughness: 0.5 })
    ponto.position.y = -0.08
    g.add(ponto)
  }
  return g
}

/** Painéis transparentes de uma caixa (sem tampa nem fundo, se pedido). */
function glassBox(
  w: number, h: number, d: number, color: string, opacity: number,
  side: THREE.Side, order: number, top?: THREE.Material,
) {
  const m = new THREE.MeshStandardMaterial({
    color, roughness: 0.06, metalness: 0.1, transparent: true, opacity, depthWrite: false, side,
  })
  const none = new THREE.MeshBasicMaterial({ visible: false })
  // grupos do BoxGeometry: +x, -x, +y, -y, +z, -z
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [m, m, top ?? none, none, m, m])
  mesh.renderOrder = order
  return mesh
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base do diorama: assoalho de tábuas escuras ---------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const floor = cylinder(2.55, 2.62, 0.07, PLANK, { roughness: 0.85 })
  floor.position.y = 0.145
  base.add(floor)

  for (let z = -2.1; z <= 2.2; z += 0.42) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - z * z, 0.01))
    const line = rbox(len, 0.02, 0.04, 0.008, PLANK_LINE, { roughness: 0.9 })
    line.position.set(0, GY + 0.002, z)
    base.add(line)
  }

  // lixeira de arame com as tentativas de soletrar amassadas
  const lixeira = new THREE.Group()
  lixeira.position.set(-1.58, GY, 0.62)
  const balde = lathe(
    [[0, 0], [0.15, 0], [0.16, 0.02], [0.2, 0.36], [0.21, 0.375], [0.195, 0.375], [0.185, 0.36], [0.145, 0.035], [0, 0.035]],
    METAL_DARK,
    { roughness: 0.4, metalness: 0.6 },
  )
  lixeira.add(balde)
  for (const [px, py, pz, r, s] of [
    [0.02, 0.38, 0.03, 0.075, 3], [-0.08, 0.36, -0.05, 0.065, 5], [0.08, 0.35, -0.06, 0.06, 7],
    [0.28, 0.05, 0.12, 0.06, 9], [0.12, 0.05, 0.3, 0.055, 11],
  ] as const) {
    const bola = puff(r, PAPER, 4, s, { roughness: 0.9 })
    bola.position.set(px, py, pz)
    lixeira.add(bola)
  }
  base.add(lixeira)

  // pilha de pastas de casos
  const pastas = new THREE.Group()
  pastas.position.set(1.22, GY, 0.64)
  pastas.rotation.y = -0.35
  for (let i = 0; i < 3; i++) {
    const pasta = rbox(0.44, 0.045, 0.32, 0.012, i === 1 ? '#c9a659' : '#d9b96c', { roughness: 0.8 })
    pasta.position.set((rand() - 0.5) * 0.05, 0.023 + i * 0.047, (rand() - 0.5) * 0.05)
    pasta.rotation.y = (rand() - 0.5) * 0.3
    pastas.add(pasta)
  }
  const elastico = rbox(0.04, 0.15, 0.34, 0.01, '#3b2b20', { roughness: 0.8 })
  elastico.position.set(0.1, 0.075, 0)
  pastas.add(elastico)
  base.add(pastas)

  root.add(base)

  // ---- mesa de metal cinza -------------------------------------------------
  const mesa = new THREE.Group()
  mesa.position.x = TX
  const metal = { roughness: 0.38, metalness: 0.55 }

  const tampo = rbox(TW, 0.06, TD, 0.025, METAL, metal)
  tampo.position.y = TOP - 0.03
  mesa.add(tampo)

  const saia = rbox(TW - 0.12, 0.1, TD - 0.12, 0.02, METAL_DARK, metal)
  saia.position.y = TOP - 0.11
  mesa.add(saia)

  const LEG_H = TOP - GY - 0.06
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const perna = rbox(0.07, LEG_H, 0.07, 0.02, METAL_DARK, metal)
      perna.position.set(sx * (TW / 2 - 0.1), GY + LEG_H / 2, sz * (TD / 2 - 0.1))
      mesa.add(perna)
      const sapata = cylinder(0.045, 0.05, 0.025, '#2b2f33', { roughness: 0.7 })
      sapata.position.set(sx * (TW / 2 - 0.1), GY + 0.012, sz * (TD / 2 - 0.1))
      mesa.add(sapata)
    }
  }
  const travessa = rbox(TW - 0.2, 0.04, 0.04, 0.012, METAL_DARK, metal)
  travessa.position.set(0, GY + 0.14, -(TD / 2 - 0.1))
  mesa.add(travessa)

  // gaveta na frente, com puxador
  const gaveta = rbox(0.6, 0.07, 0.02, 0.01, METAL_LIGHT, metal)
  gaveta.position.set(-0.45, TOP - 0.11, (TD - 0.12) / 2 + 0.01)
  mesa.add(gaveta)
  const puxador = rbox(0.18, 0.022, 0.03, 0.01, '#e2e6e9', { roughness: 0.25, metalness: 0.8 })
  puxador.position.set(-0.45, TOP - 0.11, (TD - 0.12) / 2 + 0.035)
  mesa.add(puxador)
  // rebites nos cantos do tampo
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const rebite = sphere(0.014, METAL_LIGHT, { roughness: 0.3, metalness: 0.8 })
      rebite.position.set(sx * (TW / 2 - 0.06), TOP + 0.002, sz * (TD / 2 - 0.06))
      rebite.scale.y = 0.5
      mesa.add(rebite)
    }
  }
  root.add(mesa)

  // ---- abajur de cúpula verde ---------------------------------------------
  const abajur = new THREE.Group()
  abajur.position.set(LX, TOP, LZ)
  const latao = { roughness: 0.3, metalness: 0.75 }

  const pe = lathe(
    [[0, 0], [0.14, 0], [0.15, 0.015], [0.13, 0.035], [0.06, 0.05], [0.03, 0.06], [0, 0.06]],
    BRASS,
    latao,
  )
  abajur.add(pe)
  const haste = cylinder(0.018, 0.022, 0.54, BRASS, latao)
  haste.position.y = 0.06 + 0.27
  abajur.add(haste)
  const junta = sphere(0.034, BRASS, latao)
  junta.position.y = 0.6
  abajur.add(junta)

  // braço curto do joelho até a cúpula
  const JUNTA = new THREE.Vector3(0, 0.6, 0)
  const CUPULA = new THREE.Vector3(-0.1, 0.66, 0.14)
  const bv = CUPULA.clone().sub(JUNTA)
  const bracoAbajur = cylinder(0.015, 0.015, bv.length(), BRASS, latao)
  bracoAbajur.position.copy(JUNTA).addScaledVector(bv, 0.5)
  bracoAbajur.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bv.clone().normalize())
  abajur.add(bracoAbajur)

  // cúpula cônica apontada para o bloquinho
  const cupula = new THREE.Group()
  cupula.position.copy(CUPULA)
  const mira = new THREE.Vector3(NX - LX, -0.75, NZ - LZ).normalize()
  cupula.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), mira)
  abajur.add(cupula)

  const perfil: [number, number][] = [
    [0.17, -0.24], [0.165, -0.225], [0.12, -0.13], [0.07, -0.06], [0.04, -0.025], [0.035, 0], [0, 0],
  ]
  const casca = lathe(perfil, SHADE, { roughness: 0.35, metalness: 0.3 })
  ;(casca.material as THREE.Material).side = THREE.DoubleSide
  cupula.add(casca)
  const forro = lathe(
    perfil.map(([r, y]) => [r * 0.93, y + 0.006] as [number, number]),
    '#f3e6b8',
    { emissive: '#ffcf6b', emissiveIntensity: 0.45 },
  )
  ;(forro.material as THREE.Material).side = THREE.BackSide
  cupula.add(forro)
  const borda = torus(0.168, 0.012, BRASS, latao)
  borda.rotation.x = Math.PI / 2
  borda.position.y = -0.24
  cupula.add(borda)
  const lampada = sphere(0.055, BULB, { emissive: GLOW, emissiveIntensity: 1.6 })
  lampada.position.y = -0.14
  cupula.add(lampada)
  const luz = new THREE.PointLight('#ffc865', 1.6, 2.6, 1.5)
  luz.position.y = -0.28
  cupula.add(luz)
  root.add(abajur)

  // ---- aquário -------------------------------------------------------------
  const aquario = new THREE.Group()
  aquario.position.set(AQX, TOP, AQZ)

  const sola = rbox(AW + 0.06, 0.06, AD + 0.06, 0.02, FRAME, { roughness: 0.4 })
  sola.position.y = 0.03
  aquario.add(sola)

  const cascalho = rbox(AW - 0.03, 0.07, AD - 0.03, 0.025, SAND, { roughness: 0.95 })
  cascalho.position.y = G0 + 0.035
  aquario.add(cascalho)
  const pedrinhas = ['#d9c79e', '#a99877', '#8b7e6a', '#e7ddc6', '#b59a7a']
  for (let i = 0; i < 30; i++) {
    const r = 0.016 + rand() * 0.014
    const p = sphere(r, pedrinhas[i % pedrinhas.length], { roughness: 0.85 }, 12)
    p.position.set((rand() - 0.5) * (AW - 0.1), GT, (rand() - 0.5) * (AD - 0.1))
    p.scale.y = 0.6
    aquario.add(p)
  }
  // pedra chata onde o axolote se apoia
  const laje = rock(0.16, '#7f7b72', 17, { roughness: 0.9 })
  laje.scale.set(1.5, 0.32, 1.1)
  laje.position.set(0.02, GT + 0.005, 0.06)
  aquario.add(laje)

  // plantas no canto do fundo e na frente à direita
  for (const [px, pz, n, hMax] of [[AW / 2 - 0.13, -AD / 2 + 0.11, 5, 0.42], [AW / 2 - 0.09, AD / 2 - 0.12, 3, 0.22]] as const) {
    for (let i = 0; i < n; i++) {
      const hh = hMax * (0.6 + rand() * 0.4)
      const folha = capsule(0.022, hh, PLANT, { roughness: 0.7 })
      folha.position.set(px + (rand() - 0.5) * 0.08, GT + hh / 2, pz + (rand() - 0.5) * 0.06)
      folha.rotation.set((rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.5)
      aquario.add(folha)
    }
  }

  // vidro e água (sem tampa); renderOrder fixo para o empilhamento das camadas
  const vidroFundo = glassBox(AW, AH, AD, GLASS, 0.12, THREE.BackSide, 2)
  vidroFundo.position.y = G0 + AH / 2
  aquario.add(vidroFundo)
  const superficie = new THREE.MeshStandardMaterial({
    color: '#a6e0f2', roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false,
  })
  const aguaFundo = glassBox(AW - 0.02, WH, AD - 0.02, WATER, 0.14, THREE.BackSide, 3)
  aguaFundo.position.y = G0 + WH / 2
  aquario.add(aguaFundo)
  const aguaFrente = glassBox(AW - 0.02, WH, AD - 0.02, WATER, 0.12, THREE.FrontSide, 5, superficie)
  aguaFrente.position.y = G0 + WH / 2
  aquario.add(aguaFrente)
  const vidroFrente = glassBox(AW, AH, AD, GLASS, 0.1, THREE.FrontSide, 7)
  vidroFrente.position.y = G0 + AH / 2
  aquario.add(vidroFrente)

  // moldura preta: aro de cima e colunas dos cantos
  const RIM_Y = G0 + AH
  for (const sx of [-1, 1]) {
    const lado = rbox(0.035, 0.035, AD + 0.035, 0.01, FRAME, { roughness: 0.4 })
    lado.position.set(sx * AW / 2, RIM_Y, 0)
    aquario.add(lado)
    for (const sz of [-1, 1]) {
      const coluna = rbox(0.028, AH, 0.028, 0.008, FRAME, { roughness: 0.4 })
      coluna.position.set(sx * AW / 2, G0 + AH / 2, sz * AD / 2)
      aquario.add(coluna)
    }
  }
  for (const sz of [-1, 1]) {
    const frente = rbox(AW + 0.035, 0.035, 0.035, 0.01, FRAME, { roughness: 0.4 })
    frente.position.set(0, RIM_Y, sz * AD / 2)
    aquario.add(frente)
  }
  root.add(aquario)

  // ---- filtro preto no canto, soltando bolhas -------------------------------
  const filtro = new THREE.Group()
  filtro.position.set(-AW / 2 + 0.09, GT, -AD / 2 + 0.07)
  aquario.add(filtro)

  const caixaFiltro = rbox(0.12, 0.44, 0.08, 0.02, '#15181b', { roughness: 0.5 })
  caixaFiltro.position.y = 0.22
  filtro.add(caixaFiltro)
  for (let i = 0; i < 4; i++) {
    const fenda = rbox(0.08, 0.012, 0.01, 0.004, '#3c4248', { roughness: 0.5 })
    fenda.position.set(0, 0.08 + i * 0.04, 0.042)
    filtro.add(fenda)
  }
  const tubo = cylinder(0.02, 0.02, 0.16, '#15181b', { roughness: 0.5 })
  tubo.position.y = 0.52
  filtro.add(tubo)
  const gancho = rbox(0.14, 0.07, 0.12, 0.02, '#15181b', { roughness: 0.5 })
  gancho.position.set(0, RIM_Y - GT + 0.03, -0.02)
  filtro.add(gancho)
  const bocal = cylinder(0.02, 0.024, 0.05, '#15181b', { roughness: 0.5 })
  bocal.rotation.z = Math.PI / 2
  bocal.position.set(0.08, 0.045, 0.01)
  filtro.add(bocal)
  // coluna de bolhas brancas subindo do bocal até a superfície
  const TOPO_AGUA = G0 + WH - GT
  for (let i = 0; i < 8; i++) {
    const k = i / 7
    const bolha = sphere(0.016 + k * 0.016, '#ffffff', { roughness: 0.15 }, 16)
    bolha.position.set(0.12 + Math.sin(i * 1.7) * 0.018, 0.06 + k * (TOPO_AGUA - 0.09), 0.01 + Math.cos(i * 1.3) * 0.012)
    filtro.add(bolha)
  }
  const onda = torus(0.05, 0.007, '#f4fbff', { roughness: 0.2 })
  onda.rotation.x = Math.PI / 2
  onda.position.set(0.13, TOPO_AGUA + 0.002, 0.01)
  filtro.add(onda)

  // ---- axolote rosa, de frente, sorrindo -----------------------------------
  const axolote = new THREE.Group()
  axolote.position.set(0.02, GT + 0.04, 0.07)
  axolote.rotation.y = AXO_YAW
  axolote.scale.setScalar(AXO_S)
  aquario.add(axolote)

  const pele = { roughness: 0.5 }
  const cabeca = sphere(0.13, AXO, pele)
  cabeca.scale.set(1.3, 0.78, 1.05)
  cabeca.position.set(0, 0.13, 0.06)
  axolote.add(cabeca)

  const pescoco = sphere(0.1, AXO, pele)
  pescoco.position.set(0, 0.11, -0.05)
  axolote.add(pescoco)

  const corpo = capsule(0.085, 0.24, AXO, pele)
  corpo.rotation.x = Math.PI / 2
  corpo.position.set(0, 0.1, -0.2)
  axolote.add(corpo)

  const barriga = capsule(0.07, 0.22, AXO_LIGHT, pele)
  barriga.rotation.x = Math.PI / 2
  barriga.scale.x = 1.12
  barriga.position.set(0, 0.075, -0.18)
  axolote.add(barriga)

  const crista = sphere(0.1, AXO_LIGHT, pele)
  crista.scale.set(0.22, 0.42, 1.6)
  crista.position.set(0, 0.17, -0.24)
  axolote.add(crista)

  const cauda = new THREE.Group()
  cauda.position.set(0, 0.1, -0.36)
  cauda.rotation.y = -0.6
  axolote.add(cauda)
  const caudaCorpo = capsule(0.06, 0.2, AXO, pele)
  caudaCorpo.rotation.x = Math.PI / 2
  caudaCorpo.scale.x = 0.8
  caudaCorpo.position.z = -0.12
  cauda.add(caudaCorpo)
  const nadadeira = sphere(0.1, AXO_LIGHT, pele)
  nadadeira.scale.set(0.25, 0.75, 1.5)
  nadadeira.position.set(0, 0.02, -0.18)
  cauda.add(nadadeira)

  for (const s of [-1, 1]) {
    for (const lz of [0.02, -0.3]) {
      const perna = capsule(0.03, 0.07, AXO, pele)
      perna.position.set(s * 0.14, 0.055, lz)
      perna.rotation.z = s * 1.05
      axolote.add(perna)
      const pata = sphere(0.04, AXO, pele)
      pata.scale.set(1.3, 0.45, 1.3)
      pata.position.set(s * 0.2, 0.02, lz + 0.02)
      axolote.add(pata)
      for (let t = 0; t < 3; t++) {
        const dedo = capsule(0.011, 0.03, AXO_DARK, pele)
        dedo.rotation.x = Math.PI / 2
        dedo.position.set(s * 0.2 + (t - 1) * 0.026, 0.016, lz + 0.068)
        axolote.add(dedo)
      }
    }

    // olhinhos pretos com brilho
    const olho = sphere(0.027, '#1b1418', { roughness: 0.2 }, 16)
    olho.position.set(s * 0.105, 0.19, 0.125)
    axolote.add(olho)
    const brilho = sphere(0.009, '#ffffff', { roughness: 0.2 }, 10)
    brilho.position.set(s * 0.105 - 0.008, 0.2, 0.149)
    axolote.add(brilho)
  }

  // sorriso largo que dá a volta na cara (arco aberto: fica nítido no refine)
  const sorrisoGeo = new THREE.TorusGeometry(0.14, 0.011, 10, 36, 1.35)
  sorrisoGeo.rotateZ(Math.PI / 2 - 0.675)
  sorrisoGeo.rotateX(Math.PI / 2)
  const sorriso = new THREE.Mesh(sorrisoGeo, mat('#6e2a3e', { roughness: 0.5 }))
  sorriso.position.set(0, 0.13, 0.06)
  sorriso.rotation.x = 0.3
  sorriso.scale.set(1.22, 1, 1.07)
  axolote.add(sorriso)

  // ---- brânquias rosa-choque em leque (o acento) ----------------------------
  const branquias = new THREE.Group()
  branquias.position.set(0, 0.13, 0.03)
  axolote.add(branquias)
  const Y = new THREE.Vector3(0, 1, 0)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const a = [0.12, 0.68, 1.22][k]
      const dir = new THREE.Vector3(s * Math.cos(a), Math.sin(a), -0.35).normalize()
      const raiz = new THREE.Vector3(s * 0.13, 0.02 + k * 0.015, -0.03)
      const haste = capsule(0.025, 0.13, ACCENT, { roughness: 0.5 })
      haste.position.copy(raiz).addScaledVector(dir, 0.09)
      haste.quaternion.setFromUnitVectors(Y, dir)
      branquias.add(haste)
      // franja em pares dos dois lados da haste: leque de pluma, não palito
      const lado = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1)).normalize()
      for (let j = 0; j < 4; j++) {
        for (const l of [-1, 1]) {
          const pluma = sphere(0.015 - j * 0.0015, ACCENT_LIGHT, { roughness: 0.55 }, 12)
          pluma.position.copy(raiz)
            .addScaledVector(dir, 0.055 + j * 0.034)
            .addScaledVector(lado, l * 0.027)
          branquias.add(pluma)
        }
      }
    }
  }

  // ---- bloquinho em pé na mesa, virado pro aquário ---------------------------
  const bloco = new THREE.Group()
  bloco.rotation.order = 'YXZ'
  bloco.position.set(NX, TOP, NZ)
  bloco.rotation.set(N_TILT, N_YAW, 0)
  root.add(bloco)

  const capaTras = rbox(PW + 0.03, PH + 0.02, 0.018, 0.012, COVER, { roughness: 0.7 })
  capaTras.position.set(0, PH / 2 + 0.01, -0.012)
  bloco.add(capaTras)
  const folhas = rbox(PW, PH - 0.02, 0.016, 0.006, PAPER, { roughness: 0.8 })
  folhas.position.set(0, PH / 2, 0.004)
  bloco.add(folhas)
  for (let i = 0; i < 5; i++) {
    const pauta = rbox(PW - 0.05, 0.005, 0.003, 0.001, RULE, { roughness: 0.8 })
    pauta.position.set(0, 0.07 + i * 0.065, 0.0135)
    bloco.add(pauta)
  }
  const margem = rbox(0.005, PH - 0.06, 0.003, 0.001, '#e7a3a3', { roughness: 0.8 })
  margem.position.set(-PW / 2 + 0.07, PH / 2, 0.0135)
  bloco.add(margem)
  for (let i = 0; i < 11; i++) {
    const argola = torus(0.02, 0.006, METAL_LIGHT, { roughness: 0.3, metalness: 0.8 })
    argola.rotation.y = Math.PI / 2
    argola.position.set(-PW / 2 + 0.04 + i * ((PW - 0.08) / 10), PH + 0.005, -0.004)
    bloco.add(argola)
  }
  // capa da frente dobrada para trás: vira o pé do cavalete
  const dobra = new THREE.Group()
  dobra.position.set(0, PH + 0.01, -0.02)
  dobra.rotation.x = 0.55
  bloco.add(dobra)
  const capaFrente = rbox(PW + 0.03, PH + 0.02, 0.018, 0.012, COVER, { roughness: 0.7 })
  capaFrente.position.y = -(PH + 0.02) / 2
  dobra.add(capaFrente)

  // 'AX?' rabiscado: cada letra é uma peça — A… X… trava… e o ? vem no DÊ?
  const TX0 = -PW / 2 + 0.11
  const LETRA_ROT = { A: 0.05, X: -0.04, '?': 0.08 } as const
  const letra = (which: 'A' | 'X' | '?', gx: number) => {
    const g = glyph(which)
    g.position.set(TX0 + gx, PH / 2 + 0.01, 0.017)
    g.rotation.z = LETRA_ROT[which]
    bloco.add(g)
    return g
  }
  const letraA = letra('A', 0.075)
  const letraX = letra('X', 0.215)
  const interrogacao = letra('?', 0.34)

  // ---- detetive de sobretudo, debruçado sobre a mesa ------------------------
  const detetive = person({ body: COAT, skin: SKIN, height: 1.5, armAngle: 0.28 })
  detetive.position.set(DX, GY, DZ)
  detetive.rotation.order = 'YXZ'
  detetive.rotation.set(D_LEAN, D_YAW, 0)
  root.add(detetive)

  const aba = lathe(
    [[0.27, 0.04], [0.3, 0.0], [0.312, 0.02], [0.298, 0.1], [0.276, 0.22], [0.256, 0.33], [0.24, 0.36]],
    COAT,
    { roughness: 0.85 },
  )
  detetive.add(aba)
  // abertura da frente do sobretudo, do cinto à barra
  const abertura = rbox(0.014, 0.3, 0.014, 0.006, COAT_DARK, { roughness: 0.85 })
  abertura.position.set(0.04, 0.17, 0.288)
  abertura.rotation.x = -0.14
  detetive.add(abertura)
  for (const s of [-1, 1]) {
    const sapato = rbox(0.12, 0.07, 0.22, 0.03, '#3a281c', { roughness: 0.55 })
    sapato.position.set(s * 0.1, 0.035, 0.2)
    detetive.add(sapato)
    const bolso = rbox(0.13, 0.03, 0.04, 0.012, COAT_DARK, { roughness: 0.85 })
    bolso.position.set(s * 0.15, 0.2, 0.25)
    bolso.rotation.y = s * 0.5
    detetive.add(bolso)
    // gola: duas tiras escuras emoldurando o V da camisa
    const lapela = rbox(0.036, 0.2, 0.016, 0.008, COAT_DARK, { roughness: 0.85 })
    lapela.position.set(s * 0.05, 0.64, 0.246)
    lapela.rotation.set(-0.15, 0, -s * 0.4)
    detetive.add(lapela)
    for (const by of [0.42, 0.5]) {
      const botao = sphere(0.018, '#5a4630', { roughness: 0.4 }, 12)
      botao.position.set(s * 0.075, by, 0.255)
      detetive.add(botao)
    }
  }
  // V da camisa (pirâmide de 3 lados achatada, ponta para baixo) e gravata
  const camisa = cone(0.085, 0.19, '#efe8da', { roughness: 0.6 }, 3)
  camisa.rotation.set(0, Math.PI, Math.PI)
  camisa.scale.z = 0.3
  camisa.position.set(0, 0.645, 0.232)
  detetive.add(camisa)
  const gravata = rbox(0.034, 0.13, 0.016, 0.008, '#2c4636', { roughness: 0.6 })
  gravata.position.set(0, 0.63, 0.252)
  detetive.add(gravata)
  const no = sphere(0.022, '#2c4636', { roughness: 0.6 }, 12)
  no.position.set(0, 0.705, 0.248)
  detetive.add(no)
  const cinto = torus(0.258, 0.03, COAT_DARK, { roughness: 0.85 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.32
  detetive.add(cinto)
  const fivela = rbox(0.08, 0.07, 0.03, 0.012, '#8e7a50', { roughness: 0.35, metalness: 0.6 })
  fivela.position.set(0, 0.32, 0.285)
  detetive.add(fivela)

  const head = detetive.getObjectByName('head') as THREE.Group

  // chapéu fedora
  const chapeu = new THREE.Group()
  chapeu.position.set(0, 0.16, -0.01)
  chapeu.rotation.set(-0.08, 0, 0.08)
  head.add(chapeu)
  const abaChapeu = lathe(
    [[0.2, 0.0], [0.33, -0.012], [0.41, 0.02], [0.42, 0.036], [0.4, 0.042], [0.32, 0.03], [0.2, 0.045]],
    HAT,
    { roughness: 0.85 },
  )
  chapeu.add(abaChapeu)
  const copa = lathe(
    [[0.24, 0.02], [0.246, 0.1], [0.236, 0.19], [0.2, 0.24], [0.1, 0.258], [0.03, 0.236], [0, 0.232]],
    HAT,
    { roughness: 0.85 },
  )
  chapeu.add(copa)
  const fita = cylinder(0.249, 0.245, 0.05, HAT_BAND, { roughness: 0.7 })
  fita.position.y = 0.055
  chapeu.add(fita)

  for (const s of [-1, 1]) {
    const sobrancelha = capsule(0.02, 0.08, MUSTACHE, { roughness: 0.85 })
    sobrancelha.position.set(s * 0.11, 0.115, 0.245)
    sobrancelha.rotation.set(-0.2, s * 0.3, s * (Math.PI / 2 + 0.3))
    head.add(sobrancelha)
    const bigode = capsule(0.032, 0.08, MUSTACHE, { roughness: 0.85 })
    bigode.position.set(s * 0.065, -0.078, 0.262)
    bigode.rotation.set(0, s * 0.25, s * (Math.PI / 2 - 0.45))
    head.add(bigode)
  }
  const bigodeMeio = sphere(0.042, MUSTACHE, { roughness: 0.85 })
  bigodeMeio.position.set(0, -0.06, 0.27)
  bigodeMeio.scale.set(1.2, 0.8, 0.8)
  head.add(bigodeMeio)

  // cachimbo no canto direito da boca: a fumaça sobe ao lado do rosto
  const BOCA = new THREE.Vector3(0.08, -0.115, 0.25)
  const FORNILHO = new THREE.Vector3(0.24, -0.15, 0.33)
  const sv = FORNILHO.clone().sub(BOCA)
  const piteira = cylinder(0.014, 0.018, sv.length(), '#1e1612', { roughness: 0.35 })
  piteira.position.copy(BOCA).addScaledVector(sv, 0.5)
  piteira.quaternion.setFromUnitVectors(Y, sv.clone().normalize())
  head.add(piteira)
  const fornilho = lathe(
    [[0, 0], [0.042, 0], [0.06, 0.03], [0.065, 0.11], [0.055, 0.115], [0.05, 0.04], [0, 0.03]],
    PIPE,
    { roughness: 0.35 },
  )
  fornilho.position.copy(FORNILHO).add(new THREE.Vector3(0.015, -0.035, 0))
  head.add(fornilho)
  const brasa = sphere(0.04, '#d9662c', { emissive: '#ff5a14', emissiveIntensity: 1.2 }, 12)
  brasa.scale.y = 0.35
  brasa.position.copy(fornilho.position).add(new THREE.Vector3(0, 0.1, 0))
  head.add(brasa)

  // ---- braços: pivô no ombro e mira calculada ------------------------------
  // caneta na mão de trás (do lado da mesa); lupa na mão do lado da câmera
  const bracoCaneta = detetive.getObjectByName('armR') as THREE.Mesh
  const bracoLupa = detetive.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoCaneta, 1.5)
  shoulderPivot(bracoLupa, 1.5)
  const REST_C = bracoCaneta.rotation.clone()
  const REST_L = bracoLupa.rotation.clone()
  const HAND = 0.535 // distância ombro → centro da mão

  /** Gira o braço (pivô no ombro) para a mão apontar ao alvo no mundo. */
  const aim = (arm: THREE.Object3D, target: THREE.Vector3) => {
    root.updateMatrixWorld(true)
    const local = arm.parent!.worldToLocal(target.clone())
    const dir = local.sub(arm.position)
    const dist = dir.length()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize())
    return { rot: new THREE.Euler().setFromQuaternion(q), dist }
  }
  const shoulderOf = (arm: THREE.Object3D) => {
    root.updateMatrixWorld(true)
    return arm.parent!.localToWorld(arm.position.clone())
  }

  // caneta: a mão contorna a borda esquerda do bloquinho e a ponta encosta na
  // margem, na frente da folha — a caneta fica inteira à vista, apontando o AX?
  root.updateMatrixWorld(true)
  const PONTA = bloco.localToWorld(new THREE.Vector3(-PW / 2 + 0.06, PH / 2 - 0.05, 0.03))
  const normalFolha = new THREE.Vector3(0, 0, 1).transformDirection(bloco.matrixWorld)
  const ombroC = shoulderOf(bracoCaneta)
  const MAO = ombroC.clone().add(PEN_HAND.clone().sub(ombroC).normalize().multiplyScalar(HAND))
  const penFinal = aim(bracoCaneta, MAO)
  const penUp = aim(bracoCaneta, MAO.clone().addScaledVector(normalFolha, 0.06).add(new THREE.Vector3(0, 0.1, 0)))
  // escrevendo: folha ainda de frente pro detetive
  bloco.rotation.y = N_YAW_OPEN
  root.updateMatrixWorld(true)
  const penWriteA = aim(bracoCaneta, bloco.localToWorld(new THREE.Vector3(TX0 + 0.02, PH / 2, 0.25)))
  const penWriteX = aim(bracoCaneta, bloco.localToWorld(new THREE.Vector3(TX0 + 0.16, PH / 2, 0.25)))
  bloco.rotation.y = N_YAW
  bracoCaneta.rotation.copy(penFinal.rot)
  root.updateMatrixWorld(true)

  // caneta no espaço do braço: ponta na origem, corpo subindo (+y) até a mão
  const pontaLocal = bracoCaneta.worldToLocal(PONTA.clone())
  const ateMao = new THREE.Vector3(0, -HAND, 0).sub(pontaLocal)
  const penLen = ateMao.length() + 0.03
  const caneta = new THREE.Group()
  caneta.position.copy(pontaLocal)
  caneta.quaternion.setFromUnitVectors(Y, ateMao.normalize())
  bracoCaneta.add(caneta)
  const canetaCorpo = cylinder(0.018, 0.018, penLen - 0.04, '#17191c', { roughness: 0.3 })
  canetaCorpo.position.y = 0.04 + (penLen - 0.04) / 2
  caneta.add(canetaCorpo)
  const canetaPonta = cone(0.018, 0.04, METAL_LIGHT, { roughness: 0.25, metalness: 0.8 })
  canetaPonta.rotation.x = Math.PI
  canetaPonta.position.y = 0.02
  caneta.add(canetaPonta)
  const clipe = rbox(0.008, 0.07, 0.01, 0.003, METAL_LIGHT, { roughness: 0.25, metalness: 0.8 })
  clipe.position.set(0, penLen - 0.08, 0.02)
  caneta.add(clipe)

  // lupa: erguida ao lado do rosto, lente virada para a câmera (pose final)
  const ombroL = shoulderOf(bracoLupa)
  const lupaFinal = aim(bracoLupa, ombroL.clone().add(new THREE.Vector3(-0.07, 0.44, 0.27)))
  const lupaAlto = aim(bracoLupa, ombroL.clone().add(new THREE.Vector3(0.05, 0.5, 0.15)))
  const lupaBate = aim(bracoLupa, new THREE.Vector3(-0.42, TOP + 0.02, 0.1))
  bracoLupa.rotation.copy(lupaFinal.rot)
  root.updateMatrixWorld(true)

  const lupa = new THREE.Group()
  const cabo = cylinder(0.022, 0.026, 0.17, '#4a2c1b', { roughness: 0.5 })
  cabo.position.y = 0.06
  lupa.add(cabo)
  const virola = cylinder(0.028, 0.028, 0.03, BRASS, latao)
  virola.position.y = 0.155
  lupa.add(virola)
  const aro = torus(0.1, 0.017, BRASS, latao)
  aro.position.y = 0.272
  lupa.add(aro)
  const lente = new THREE.Mesh(
    new THREE.CylinderGeometry(0.098, 0.098, 0.012, 40),
    new THREE.MeshStandardMaterial({
      color: LENS, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.5, depthWrite: false,
    }),
  )
  lente.rotation.x = Math.PI / 2
  lente.position.y = 0.272
  lente.renderOrder = 8
  lupa.add(lente)
  const reflexo = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.007, 8, 20, 1.1),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false }),
  )
  reflexo.position.set(0, 0.272, 0.01)
  reflexo.rotation.z = 0.5
  reflexo.renderOrder = 9
  lupa.add(reflexo)
  {
    const armQ = new THREE.Quaternion()
    bracoLupa.getWorldQuaternion(armQ)
    const handW = bracoLupa.localToWorld(new THREE.Vector3(0, -HAND, 0))
    const h = new THREE.Vector3(0, -1, 0).applyQuaternion(armQ).normalize()
    const toCam = new THREE.Vector3(...CAM).sub(handW).normalize()
    const n = toCam.sub(h.clone().multiplyScalar(toCam.dot(h))).normalize()
    const x = new THREE.Vector3().crossVectors(h, n)
    const worldQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, h, n))
    lupa.quaternion.copy(armQ.clone().invert().multiply(worldQ))
    lupa.position.set(0, -HAND + 0.03, 0)
  }
  bracoLupa.add(lupa)

  // ---- fumaça do cachimbo (sobe e se afasta do rosto) -----------------------
  root.updateMatrixWorld(true)
  const SMOKE_POS = head.localToWorld(brasa.position.clone())
  const fumaca = new THREE.Group()
  fumaca.position.copy(SMOKE_POS)
  root.add(fumaca)
  for (const [i, [fx, fy, fz, r]] of ([
    [0.04, 0.1, 0.0, 0.04], [0.09, 0.25, -0.04, 0.055], [0.05, 0.44, -0.1, 0.075],
  ] as const).entries()) {
    const nuvem = puff(r, SMOKE, 4, 61 + i, { roughness: 0.95 })
    nuvem.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (m) {
        m.transparent = true
        m.opacity = 0.9 - i * 0.1
      }
    })
    nuvem.position.set(fx, fy, fz)
    fumaca.add(nuvem)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'mesa', group: 'sala', object: mesa },
    { name: 'abajur', group: 'sala', object: abajur },
    { name: 'aquario', group: 'aquario', object: aquario },
    { name: 'axolote', group: 'suspeito', object: axolote },
    { name: 'branquias', group: 'suspeito', object: branquias },
    { name: 'detetive', group: 'detetive', object: detetive },
    { name: 'bracoCaneta', group: 'detetive', object: bracoCaneta },
    { name: 'bracoLupa', group: 'lupa', object: bracoLupa },
    { name: 'fumaca', group: 'tosse', object: fumaca },
    { name: 'bloco', group: 'bloco', object: bloco },
    { name: 'letraA', group: 'bloco', object: letraA },
    { name: 'letraX', group: 'bloco', object: letraX },
    { name: 'interrogacao', group: 'de', object: interrogacao },
  ]

  const rot = (from: THREE.Euler, to: THREE.Euler) => [
    ch('rotation.x', from.x, to.x), ch('rotation.y', from.y, to.y), ch('rotation.z', from.z, to.z),
  ]
  const grow = (s = 1, from = 0.01) => [ch('scale.x', from, s), ch('scale.y', from, s), ch('scale.z', from, s)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Sala de interrogatório: piso de tábuas escuras, uma mesa de metal e um abajur só.',
    }),
    seq('mesa-rise', 'mesa', 0.25, 0.8, [riseFrom(0, 1.2)], { ease: 'easeOut' }),
    seq('abajur-cresce', 'abajur', 0.8, 0.6, grow(), { ease: 'easeOut' }),

    seq('aquario-cresce', 'aquario', 1.8, 0.7, [
      ch('scale.y', 0.01, 1), ch('scale.x', 0.7, 1), ch('scale.z', 0.7, 1),
    ], {
      ease: 'easeOut',
      caption: 'Em cima da mesa, um aquário. O filtro liga e ronca: RRÜR!',
    }),
    // o ronco do filtro sacode o aquário inteiro
    seq('aquario-ronca-a', 'aquario', 2.5, 0.1, [ch('rotation.z', 0, 0.025)]),
    seq('aquario-ronca-b', 'aquario', 2.6, 0.12, [ch('rotation.z', 0.025, -0.025)]),
    seq('aquario-ronca-c', 'aquario', 2.72, 0.12, [ch('rotation.z', -0.025, 0.02)]),
    seq('aquario-ronca-d', 'aquario', 2.84, 0.16, [ch('rotation.z', 0.02, 0)]),

    seq('axolote-surge', 'axolote', 3.6, 0.7, [...grow(AXO_S), ch('rotation.y', AXO_YAW - 1.4, AXO_YAW)], {
      ease: 'easeOut',
      caption: 'Lá dentro, o suspeito: um axolote rosa, com o sorriso de quem não fez nada.',
    }),
    seq('branquias-abrem', 'branquias', 4.0, 0.6, grow(), { ease: 'easeOut' }),

    seq('detetive-rise', 'detetive', 5.0, 0.9, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'Entra o detetive: sobretudo, chapéu e o cachimbo no canto da boca.',
    }),
    seq('caneta-repouso', 'bracoCaneta', 5.0, 0.9, [ch('rotation.z', REST_C.z, REST_C.z)]),
    seq('lupa-repouso', 'bracoLupa', 5.0, 0.9, [ch('rotation.z', REST_L.z, REST_L.z)]),

    seq('lupa-ergue', 'bracoLupa', 6.3, 0.45, rot(REST_L, lupaAlto.rot), {
      ease: 'easeOut',
      caption: 'Ele ergue a lupa e BATE na mesa, com toda a força no TÁ: "Você esTÁVA AR-MAN…"',
    }),
    seq('lupa-bate', 'bracoLupa', 6.75, 0.2, rot(lupaAlto.rot, lupaBate.rot), { ease: 'easeIn' }),
    seq('aquario-pula', 'aquario', 6.95, 0.12, [ch('position.y', TOP, TOP + 0.045)], { ease: 'easeOut' }),
    seq('aquario-cai', 'aquario', 7.07, 0.15, [ch('position.y', TOP + 0.045, TOP)], { ease: 'easeIn' }),
    seq('lupa-volta', 'bracoLupa', 7.05, 0.55, rot(lupaBate.rot, lupaFinal.rot), { ease: 'easeInOut' }),

    seq('fumaca-sai', 'fumaca', 8.0, 0.6, [...grow(), ch('position.y', SMOKE_POS.y - 0.15, SMOKE_POS.y)], {
      ease: 'easeOut',
      caption: 'No MAN, engasga com a fumaça do próprio cachimbo — cof, cof! — e o -DO nunca sai.',
    }),
    seq('tosse-a', 'detetive', 8.0, 0.18, [ch('rotation.x', D_LEAN, D_LEAN + 0.12)], { ease: 'easeOut' }),
    seq('tosse-b', 'detetive', 8.18, 0.22, [ch('rotation.x', D_LEAN + 0.12, D_LEAN)]),
    seq('tosse-c', 'detetive', 8.4, 0.18, [ch('rotation.x', D_LEAN, D_LEAN + 0.1)], { ease: 'easeOut' }),
    seq('tosse-d', 'detetive', 8.58, 0.27, [ch('rotation.x', D_LEAN + 0.1, D_LEAN)]),

    seq('bloco-abre', 'bloco', 9.3, 0.7, [
      ...grow(), ch('rotation.x', -1.45, N_TILT), ch('rotation.y', N_YAW_OPEN, N_YAW_OPEN),
    ], {
      ease: 'easeOut',
      caption: 'Tossindo, ele abre o bloquinho pra fichar o suspeito…',
    }),
    seq('caneta-escreve-a', 'bracoCaneta', 9.9, 0.4, rot(REST_C, penWriteA.rot), { ease: 'easeOut' }),
    seq('letra-a', 'letraA', 10.3, 0.3, [...grow(), ch('rotation.z', LETRA_ROT.A + 0.5, LETRA_ROT.A)], {
      ease: 'easeOut',
      caption: '…e escreve: A… X…',
    }),
    seq('caneta-escreve-x', 'bracoCaneta', 10.6, 0.25, rot(penWriteA.rot, penWriteX.rot)),
    seq('letra-x', 'letraX', 10.85, 0.3, [...grow(), ch('rotation.z', LETRA_ROT.X - 0.5, LETRA_ROT.X)], {
      ease: 'easeOut',
    }),
    seq('caneta-trava', 'bracoCaneta', 11.3, 0.4, rot(penWriteX.rot, penUp.rot), {
      ease: 'easeOut',
      caption: '…e trava. Como é que se escreve o resto?',
    }),

    seq('bloco-vira', 'bloco', 11.9, 0.5, [ch('rotation.y', N_YAW_OPEN, N_YAW)], {
      ease: 'easeInOut',
      caption: 'Vira o bloquinho pro aquário e bate a caneta no rabisco: DÊ? — isso aqui, como se escreve?',
    }),
    seq('caneta-bate-a', 'bracoCaneta', 12.4, 0.14, rot(penUp.rot, penFinal.rot), { ease: 'easeIn' }),
    seq('interrogacao-surge', 'interrogacao', 12.45, 0.35, [
      ...grow(), ch('rotation.z', LETRA_ROT['?'] + 0.6, LETRA_ROT['?']),
    ], { ease: 'easeOut' }),
    seq('caneta-sobe', 'bracoCaneta', 12.54, 0.14, rot(penFinal.rot, penUp.rot), { ease: 'easeOut' }),
    seq('caneta-bate-b', 'bracoCaneta', 12.68, 0.16, rot(penUp.rot, penFinal.rot), { ease: 'easeIn' }),

    seq('axolote-sorri', 'axolote', 13.3, 0.25, [ch('position.y', GT + 0.04, GT + 0.08)], {
      ease: 'easeOut',
      caption: 'Hur stavar man det? — Como se escreve isso?',
    }),
    seq('axolote-pousa', 'axolote', 13.55, 0.3, [ch('position.y', GT + 0.08, GT + 0.04)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: CAM_TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'hur-stavar-man-det',
    contexto:
      'Burocracia e telefone: quando alguém diz um nome de rua, sobrenome, remédio ou palavra que você precisa anotar ou digitar — no telefone com a vårdcentral, no balcão da Skatteverket, numa reunião. E é o que o atendente te pergunta quando você diz o SEU nome brasileiro.',
    fraseFonte: 'Como se escreve isso?',
    fraseAlvo: 'Hur stavar man det?',
    pronuncia:
      "rür STÁA-var man dê? ('hur' com H soprado, Ü de bico e R final brando; 'stavar' começa DIRETO no S, sem o 'i' que o brasileiro põe na frente ('istavar'), força no STÁ com A LONGO, e o -var curto com R BRANDO de 'cara', que TEM que soar: sem ele vira 'stava', o infinitivo; 'man' seco, fraquinho e sem nasal; 'det' = dê)",
    ponteSonora:
      "RRÜR! (e)STAVA AR-MAN... DÊ? (5 sílabas: rür-STÁ-var-man-dê; a força TODA no STÁ; RRÜR é o 'hur' de sempre — o MESMO ronco de 'Hur bokar man tvättstugan?', 'Hur kommer jag till Storgatan?' e 'Hur mår du?': RR soprado leve na frente, Ü DE BICO (nunca o U chapado de 'urso') e R brando no fim; (e)STAVA AR-MAN = a acusação do detetive, 'você ESTAVA ARMANDO!', engasgada no MAN e emendada do jeito que todo brasileiro já fala, 'stavarman': os dois A viram um só e o R do AR gruda no VA — STÁ-VAR-man; três ajustes: (1) o S cola DIRETO no T, sem 'i' nem 'e' na frente, como em SVÊNS-ka; (2) a força é do esTÁva — é ali que a lupa bate na mesa —, com o A LONGO, e o MAN sai engolido pela tosse: fraquinho, seco e SEM nasal, nunca o 'arMÃNdo' forte do português; é o mesmo 'man' átono de CARMAN ('bokar man') e MANCA ('slänger man'); (3) o R entre os dois é de UM TOQUE SÓ, como o paulista fala 'ARMA', nunca o RR raspado carioca — mas TEM que soar: sem ele sobra 'stava', o infinitivo; DÊ = o 'det' de sempre, Ê fechado e sem T: é o ISSO apontado com a caneta, o rabisco do bloquinho)",
    historia:
      "Sala de interrogatório, um abajur só. No aquário em cima da mesa o filtro ronca — RRÜR! — e lá dentro o axolote rosa sorri aquele sorriso que nunca sai da cara dele, como quem não fez nada. O detetive de capa, cachimbo no canto da boca, bate a lupa na mesa com toda a força no TÁ — 'Você esTÁVA AR-MAN...' — e no MAN engasga com a fumaça do próprio cachimbo: o -DO nunca sai. Tossindo, ele abre o bloquinho pra fichar o suspeito, escreve A... X... e trava. Bate a caneta no rabisco e vira o bloquinho pro aquário: DÊ? — isso aqui, como é que se escreve?",
  },
  createScene,
  refine: { organic: ['axolote'] },
}

export default card
