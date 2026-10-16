import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Var är provrummet?" — VAR É... PRÚÚ(va)-VRUM... MÉT(rica)?
 *
 * Uma cisne-noiva entra pilotando uma lambreta azul-clara (VRUM!) numa loja
 * de noivas. No bico, a VARA de bambu com o vestido pendurado pra PROVAR; no
 * pescoço, a fita MÉTrica amarela (o acento saturado da cena) voando pra trás.
 * Ela freia diante da cortina bordô do provador e pergunta onde ele fica.
 *
 * Diorama: piso de mármore rosa-claro, provador de cortina bordô ao fundo,
 * arara dourada à esquerda. A lambreta e tudo o que vai nela vivem no
 * referencial local da lambreta (frente = +x).
 */

const MARBLE = '#f1d9d6'
const MARBLE_LINE = '#f9ece8'
const MARBLE_VEIN = '#e2bfbd'
const PLINTH = '#b98f8f'
const CREAM = '#f3e8dc'
const GOLD = '#c9a04a'
const VELVET = '#7a1c33'
const VELVET_DARK = '#5e1427'
const SCOOTER = '#9fd2e6'
const SCOOTER_DARK = '#79b4cc'
const CHROME = '#d5dbe0'
const RUBBER = '#2b2c31'
const SEAT = '#6e4a3a'
const SWAN = '#f8f8f5'
const SWAN_SHADE = '#e9e9e4'
const BEAK = '#ef8424'
const BLACK = '#1d1d20'
const BAMBOO = '#d8c17a'
const BAMBOO_NODE = '#b79c55'
const DRESS = '#fbf8f2'
const SASH = '#e8d2bf'
const SMOKE = ['#9c9ea6', '#b3b5bb', '#c9cbd0']
const TAPE = '#f7c600' // acento saturado RESERVADO: a fita MÉTrica

const GY = 0.14 // topo do mármore
const SX = -0.32
const SZ = 0.38
const YAW = -0.3 // a lambreta vira um pouco pra câmera
const BRAKE = -0.06

type V3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)

const rel = (p: V3, o: V3): V3 => [p[0] - o[0], p[1] - o[1], p[2] - o[2]]

/** Cápsula ligando dois pontos. */
function limb(a: V3, b: V3, r: number, color: string, opts = {}) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const len = Math.max(dir.length(), 0.001)
  const m = capsule(r, len, color, { roughness: 0.8, ...opts })
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/**
 * Tubo afunilado ao longo de uma curva. Aberto nas pontas: o refino trata
 * malha aberta como detalhe nítido, então o bico não derrete na cabeça.
 */
function taperedTube(points: V3[], radii: number[], color: string, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const TS = 32
  const RS = 18
  const geo = new THREE.TubeGeometry(curve, TS, 1, RS, false)
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const n = radii.length - 1
  for (let i = 0; i <= TS; i++) {
    const t = i / TS
    const k = Math.min(Math.floor(t * n), n - 1)
    const r = radii[k] + (radii[k + 1] - radii[k]) * (t * n - k)
    const c = curve.getPointAt(t)
    for (let j = 0; j <= RS; j++) {
      const idx = i * (RS + 1) + j
      pos.setXYZ(idx, c.x + nor.getX(idx) * r, c.y + nor.getY(idx) * r, c.z + nor.getZ(idx) * r)
    }
  }
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat(color, { size: 0.2, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/**
 * Vestido de noiva num cabide. Origem = topo do gancho (que abraça uma barra
 * ao longo de x). O vestido pende para -y, frente para +z.
 */
function makeDress(color: string, sash: string) {
  const g = new THREE.Group()

  const hook = torus(0.04, 0.009, GOLD, { roughness: 0.3, metalness: 0.7 })
  hook.rotation.y = Math.PI / 2
  g.add(hook)

  const stem = cylinder(0.009, 0.009, 0.07, GOLD, { roughness: 0.3, metalness: 0.7 })
  stem.position.y = -0.075
  g.add(stem)

  for (const s of [-1, 1]) {
    g.add(limb([0, -0.105, 0], [s * 0.21, -0.17, 0], 0.016, '#a8743f', { roughness: 0.5 }))
  }
  const bar = capsule(0.012, 0.4, '#a8743f', { roughness: 0.5 })
  bar.rotation.z = Math.PI / 2
  bar.position.y = -0.18
  g.add(bar)

  // alcinhas finas descendo do cabide ao corpete
  for (const s of [-1, 1]) {
    g.add(limb([s * 0.12, -0.16, 0.0], [s * 0.1, -0.33, 0.02], 0.011, color, { roughness: 0.6 }))
  }

  // corpete torneado (decote coração achatado na frente)
  const bodice = lathe(
    [[0, -0.62], [0.1, -0.62], [0.094, -0.54], [0.11, -0.44], [0.13, -0.36], [0.122, -0.32], [0, -0.31]],
    color,
    { roughness: 0.45 },
  )
  bodice.scale.z = 0.78
  g.add(bodice)

  const cinto = torus(0.098, 0.022, sash, { roughness: 0.35 })
  cinto.rotation.x = Math.PI / 2
  cinto.scale.y = 0.8
  cinto.position.y = -0.6
  g.add(cinto)

  const laco = sphere(0.035, sash, { roughness: 0.35 })
  laco.scale.set(1.6, 0.9, 0.6)
  laco.position.set(0, -0.6, 0.085)
  g.add(laco)

  // saia rodada em sino
  const saia = lathe(
    [
      [0, -1.34], [0.36, -1.34], [0.4, -1.31], [0.38, -1.18], [0.32, -1.0],
      [0.22, -0.82], [0.13, -0.68], [0.1, -0.62], [0, -0.62],
    ],
    color,
    { roughness: 0.55 },
  )
  saia.scale.z = 0.88
  g.add(saia)

  const barra = torus(0.385, 0.03, color, { roughness: 0.6 })
  barra.rotation.x = Math.PI / 2
  barra.scale.y = 0.88
  barra.position.y = -1.31
  g.add(barra)

  // babado do meio da saia e botõezinhos de pérola no corpete
  const babado = torus(0.27, 0.018, color, { roughness: 0.6 })
  babado.rotation.x = Math.PI / 2
  babado.scale.y = 0.88
  babado.position.y = -0.9
  g.add(babado)
  for (let i = 0; i < 4; i++) {
    const perola = sphere(0.012, '#fffdf6', { roughness: 0.2 })
    perola.position.set(0, -0.37 - i * 0.055, 0.092 - i * 0.004)
    g.add(perola)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- piso de mármore rosa ------------------------------------------------
  const piso = new THREE.Group()
  const plinto = cylinder(2.66, 2.74, 0.1, PLINTH, { roughness: 0.6 })
  plinto.position.y = 0.05
  piso.add(plinto)
  const marmore = cylinder(2.6, 2.62, 0.04, MARBLE, { roughness: 0.22 })
  marmore.position.y = 0.12
  piso.add(marmore)

  // rejuntes em losango
  for (const ang of [Math.PI / 4, -Math.PI / 4]) {
    for (let i = -4; i <= 4; i++) {
      const d = i * 0.62
      const meia = Math.sqrt(Math.max(0, 2.56 * 2.56 - d * d))
      if (meia < 0.2) continue
      const linha = rbox(meia * 2, 0.006, 0.018, 0.003, MARBLE_LINE, { roughness: 0.3 })
      linha.position.set(-Math.sin(ang) * d, GY + 0.002, Math.cos(ang) * d)
      linha.rotation.y = ang
      piso.add(linha)
    }
  }
  // veios do mármore
  for (const [x, z, r, l] of [[-1.2, 0.9, 0.5, 0.7], [0.9, 1.5, -0.3, 0.6], [1.6, -0.3, 1.1, 0.5], [-0.4, -0.5, -0.9, 0.55]] as const) {
    const veio = capsule(0.008, l, MARBLE_VEIN, { roughness: 0.3 })
    veio.rotation.set(Math.PI / 2, 0, r)
    veio.scale.z = 0.3
    veio.position.set(x, GY + 0.003, z)
    piso.add(veio)
  }
  const friso = torus(2.47, 0.018, GOLD, { roughness: 0.3, metalness: 0.7 })
  friso.rotation.x = Math.PI / 2
  friso.position.y = GY + 0.004
  piso.add(friso)
  root.add(piso)

  // ---- provador: cabine creme com cortina bordô fechada ----------------------
  const provador = new THREE.Group()
  const BX0 = -0.78
  const BX1 = 1.62
  const BZ = -1.5
  const BH = 2.3
  for (const x of [BX0, BX1]) {
    const lateral = rbox(0.09, BH, 0.72, 0.03, CREAM, { roughness: 0.6 })
    lateral.position.set(x, GY + BH / 2, BZ)
    provador.add(lateral)
    const rodape = rbox(0.11, 0.08, 0.74, 0.02, GOLD, { roughness: 0.3, metalness: 0.7 })
    rodape.position.set(x, GY + 0.04, BZ)
    provador.add(rodape)
  }
  const fundo = rbox(BX1 - BX0, BH, 0.06, 0.02, '#e7d6c6', { roughness: 0.7 })
  fundo.position.set((BX0 + BX1) / 2, GY + BH / 2, BZ - 0.33)
  provador.add(fundo)
  const frontao = rbox(BX1 - BX0 + 0.16, 0.26, 0.8, 0.05, CREAM, { roughness: 0.6 })
  frontao.position.set((BX0 + BX1) / 2, GY + BH + 0.13, BZ)
  provador.add(frontao)
  const filete = rbox(BX1 - BX0 + 0.18, 0.035, 0.82, 0.015, GOLD, { roughness: 0.3, metalness: 0.7 })
  filete.position.set((BX0 + BX1) / 2, GY + BH + 0.02, BZ)
  provador.add(filete)

  // ícone de cabide dourado no frontão (o "aqui se prova roupa")
  const icone = new THREE.Group()
  icone.position.set((BX0 + BX1) / 2, GY + BH + 0.13, BZ + 0.41)
  const ganchoIc = torus(0.035, 0.011, GOLD, { roughness: 0.3, metalness: 0.7 })
  ganchoIc.position.y = 0.055
  icone.add(ganchoIc)
  for (const s of [-1, 1]) {
    const lado = rbox(0.17, 0.022, 0.02, 0.008, GOLD, { roughness: 0.3, metalness: 0.7 })
    lado.position.set(s * 0.075, -0.0, 0)
    lado.rotation.z = -s * 0.42
    icone.add(lado)
  }
  const baseIc = rbox(0.3, 0.022, 0.02, 0.008, GOLD, { roughness: 0.3, metalness: 0.7 })
  baseIc.position.y = -0.04
  icone.add(baseIc)
  provador.add(icone)

  // trilho dourado + dobras de veludo
  const trilho = cylinder(0.022, 0.022, BX1 - BX0, GOLD, { roughness: 0.25, metalness: 0.8 })
  trilho.rotation.z = Math.PI / 2
  trilho.position.set((BX0 + BX1) / 2, GY + BH - 0.06, BZ + 0.24)
  provador.add(trilho)
  const nDobras = 18
  for (let i = 0; i < nDobras; i++) {
    const x = BX0 + 0.13 + (i * (BX1 - BX0 - 0.26)) / (nDobras - 1)
    const dobra = capsule(0.085, BH - 0.3, i % 2 ? VELVET : VELVET_DARK, { roughness: 0.92 })
    dobra.position.set(x, GY + 0.07 + (BH - 0.3) / 2 + 0.085, BZ + 0.2 + (i % 2) * 0.05)
    provador.add(dobra)
    const argola = torus(0.03, 0.008, GOLD, { roughness: 0.3, metalness: 0.7 })
    argola.position.set(x, GY + BH - 0.06, BZ + 0.24)
    argola.rotation.y = Math.PI / 2
    provador.add(argola)
  }
  root.add(provador)

  // ---- arara dourada com dois vestidos ---------------------------------------
  const arara = new THREE.Group()
  arara.position.set(-1.92, GY, -1.15)
  arara.rotation.y = 0.6
  for (const s of [-1, 1]) {
    const poste = cylinder(0.02, 0.02, 1.62, GOLD, { roughness: 0.3, metalness: 0.75 })
    poste.position.set(s * 0.46, 0.81, 0)
    arara.add(poste)
    const pe = rbox(0.06, 0.03, 0.36, 0.012, GOLD, { roughness: 0.3, metalness: 0.75 })
    pe.position.set(s * 0.46, 0.015, 0)
    arara.add(pe)
  }
  const barraArara = cylinder(0.018, 0.018, 1.0, GOLD, { roughness: 0.3, metalness: 0.75 })
  barraArara.rotation.z = Math.PI / 2
  barraArara.position.y = 1.6
  arara.add(barraArara)
  for (const [x, cor, faixa] of [[-0.2, '#f5e6e4', '#d9b2b0'], [0.18, DRESS, SASH]] as const) {
    const v = makeDress(cor, faixa)
    v.position.set(x, 1.6, 0)
    v.scale.setScalar(0.82)
    arara.add(v)
  }
  root.add(arara)

  // ---- lambreta azul-clara (frente = +x local) -------------------------------
  const lambreta = new THREE.Group()
  lambreta.position.set(SX, GY, SZ)
  lambreta.rotation.y = YAW
  root.add(lambreta)

  for (const wx of [-0.58, 0.62]) {
    const pneu = torus(0.135, 0.06, RUBBER, { roughness: 0.85 })
    pneu.scale.z = 1.35
    pneu.position.set(wx, 0.195, 0)
    lambreta.add(pneu)
    const aro = cylinder(0.1, 0.1, 0.09, CHROME, { roughness: 0.25, metalness: 0.8 })
    aro.rotation.x = Math.PI / 2
    aro.position.set(wx, 0.195, 0)
    lambreta.add(aro)
    const cubo = sphere(0.04, SCOOTER_DARK, { roughness: 0.4 })
    cubo.scale.z = 0.6
    cubo.position.set(wx, 0.195, 0.05)
    lambreta.add(cubo)
  }

  // carenagem traseira bojuda
  const carenagem = sphere(0.4, SCOOTER, { roughness: 0.3 })
  carenagem.scale.set(1.2, 0.72, 0.85)
  carenagem.position.set(-0.45, 0.52, 0)
  lambreta.add(carenagem)

  // assoalho com tiras de borracha
  const assoalho = rbox(0.66, 0.07, 0.36, 0.03, SCOOTER_DARK, { roughness: 0.4 })
  assoalho.position.set(0.12, 0.3, 0)
  lambreta.add(assoalho)
  for (const z of [-0.1, 0, 0.1]) {
    const tira = rbox(0.56, 0.012, 0.04, 0.006, RUBBER, { roughness: 0.85 })
    tira.position.set(0.12, 0.338, z)
    lambreta.add(tira)
  }

  // escudo frontal inclinado + grade da buzina
  const escudo = rbox(0.08, 0.72, 0.48, 0.035, SCOOTER, { roughness: 0.3 })
  escudo.position.set(0.47, 0.67, 0)
  escudo.rotation.z = 0.18
  lambreta.add(escudo)
  const buzina = rbox(0.03, 0.14, 0.12, 0.02, '#4a4f57', { roughness: 0.5 })
  buzina.position.set(0.53, 0.86, 0)
  buzina.rotation.z = 0.18
  lambreta.add(buzina)
  for (let i = 0; i < 3; i++) {
    const fenda = rbox(0.035, 0.012, 0.09, 0.005, CHROME, { roughness: 0.25, metalness: 0.8 })
    fenda.position.set(0.537 - i * 0.008, 0.9 - i * 0.035, 0)
    fenda.rotation.z = 0.18
    lambreta.add(fenda)
  }

  // paralama e garfo dianteiros
  const paralama = sphere(0.21, SCOOTER, { roughness: 0.3 })
  paralama.scale.set(1.05, 0.55, 0.62)
  paralama.position.set(0.63, 0.36, 0)
  lambreta.add(paralama)
  lambreta.add(limb([0.6, 0.2, 0.07], [0.5, 0.55, 0.07], 0.025, '#4a4f57', { roughness: 0.4 }))

  // coluna, cabeçote, guidão e farol redondo
  lambreta.add(limb([0.42, 0.95, 0], [0.4, 1.08, 0], 0.045, SCOOTER, { roughness: 0.3 }))
  const cabecote = rbox(0.18, 0.11, 0.42, 0.045, SCOOTER, { roughness: 0.3 })
  cabecote.position.set(0.4, 1.1, 0)
  lambreta.add(cabecote)
  for (const s of [-1, 1]) {
    const manopla = cylinder(0.03, 0.03, 0.14, RUBBER, { roughness: 0.85 })
    manopla.rotation.x = Math.PI / 2
    manopla.position.set(0.4, 1.1, s * 0.27)
    lambreta.add(manopla)
  }
  const farolAro = cylinder(0.08, 0.08, 0.06, CHROME, { roughness: 0.2, metalness: 0.85 })
  farolAro.rotation.z = Math.PI / 2
  farolAro.position.set(0.5, 1.1, 0)
  lambreta.add(farolAro)
  const farol = sphere(0.065, '#fff3c4', { emissive: '#ffe08a', emissiveIntensity: 0.8 })
  farol.scale.x = 0.45
  farol.position.set(0.53, 1.1, 0)
  lambreta.add(farol)
  // retrovisor redondo
  lambreta.add(limb([0.4, 1.14, 0.2], [0.36, 1.32, 0.26], 0.01, CHROME, { roughness: 0.25, metalness: 0.8 }))
  const espelho = cylinder(0.05, 0.05, 0.02, CHROME, { roughness: 0.15, metalness: 0.85 })
  espelho.rotation.set(Math.PI / 2, 0, 0.3)
  espelho.position.set(0.355, 1.36, 0.265)
  lambreta.add(espelho)

  // banco, lanterna e escapamento
  const banco = rbox(0.55, 0.09, 0.3, 0.045, SEAT, { roughness: 0.6 })
  banco.position.set(-0.42, 0.85, 0)
  lambreta.add(banco)
  const lanterna = sphere(0.045, '#d8392f', { roughness: 0.3 })
  lanterna.scale.x = 0.5
  lanterna.position.set(-0.93, 0.6, 0)
  lambreta.add(lanterna)
  const escape = cylinder(0.04, 0.045, 0.32, '#8d959c', { roughness: 0.3, metalness: 0.75 })
  escape.rotation.z = Math.PI / 2
  escape.position.set(-0.82, 0.2, 0.2)
  lambreta.add(escape)

  // ---- fumaça do escapamento -----------------------------------------------
  const fumaca = new THREE.Group()
  fumaca.position.set(-0.98, 0.21, 0.21)
  lambreta.add(fumaca)
  for (const [i, [x, y, z, r]] of ([[-0.1, 0.04, 0, 0.07], [-0.33, 0.15, 0.04, 0.1], [-0.62, 0.32, 0.08, 0.14]] as const).entries()) {
    const nuvem = puff(r, SMOKE[i], 5, 11 + i, { roughness: 0.95 })
    nuvem.position.set(x, y, z)
    fumaca.add(nuvem)
  }

  // ---- marcas de pneu da freada ----------------------------------------------
  const marcas = new THREE.Group()
  marcas.position.set(-0.6, 0.004, 0)
  lambreta.add(marcas)
  for (const z of [-0.05, 0.05]) {
    const marca = rbox(0.9, 0.006, 0.05, 0.003, '#5d4b4f', { roughness: 0.9 })
    marca.position.set(-0.45, 0, z)
    marcas.add(marca)
  }

  // ---- cisne: corpo sentado no banco, asas no guidão -------------------------
  const C0: V3 = [-0.3, 0.9, 0]
  const cisne = new THREE.Group()
  cisne.position.set(...C0)
  lambreta.add(cisne)

  const corpo = sphere(0.36, SWAN, { roughness: 0.85 })
  corpo.scale.set(1.4, 0.8, 0.95)
  corpo.position.set(...rel([-0.32, 1.15, 0], C0))
  cisne.add(corpo)
  const peito = sphere(0.24, SWAN, { roughness: 0.85 })
  peito.position.set(...rel([0.02, 1.2, 0], C0))
  cisne.add(peito)
  const cauda = cone(0.14, 0.3, SWAN, { roughness: 0.85 })
  cauda.scale.z = 0.7
  cauda.rotation.z = 0.95
  cauda.position.set(...rel([-0.84, 1.3, 0], C0))
  cisne.add(cauda)
  for (const s of [-1, 1]) {
    const asaTras = limb(rel([-0.78, 1.33, s * 0.25], C0), rel([-0.15, 1.31, s * 0.29], C0), 0.13, SWAN_SHADE, { roughness: 0.85 })
    asaTras.scale.z = 0.55
    cisne.add(asaTras)
    const asaFrente = limb(rel([-0.15, 1.31, s * 0.29], C0), rel([0.37, 1.13, s * 0.29], C0), 0.085, SWAN, { roughness: 0.85 })
    asaFrente.scale.z = 0.6
    cisne.add(asaFrente)
    const ponta = sphere(0.07, SWAN, { roughness: 0.85 })
    ponta.position.set(...rel([0.4, 1.13, s * 0.29], C0))
    cisne.add(ponta)
  }

  // ---- patas pretas no assoalho ---------------------------------------------
  const patas = new THREE.Group()
  lambreta.add(patas)
  for (const s of [-1, 1]) {
    patas.add(limb([-0.08, 0.92, s * 0.12], [0.14, 0.39, s * 0.13], 0.03, BLACK, { roughness: 0.6 }))
    const pe = cone(0.085, 0.18, BLACK, { roughness: 0.6 })
    pe.rotation.z = -Math.PI / 2
    pe.scale.x = 0.3
    pe.position.set(0.22, 0.365, s * 0.13)
    patas.add(pe)
  }

  // ---- pescoço em S, cabeça e bico laranja -----------------------------------
  const NECK: V3[] = [[0.04, 1.22, 0], [0.22, 1.42, 0], [0.27, 1.62, 0], [0.14, 1.8, 0], [0.07, 1.93, 0], [0.11, 2.03, 0]]
  const neckCurve = new THREE.CatmullRomCurve3(NECK.map((p) => new THREE.Vector3(...p)))
  const N0 = NECK[0]
  const pescoco = new THREE.Group()
  pescoco.position.set(...N0)
  lambreta.add(pescoco)
  const neckR = (t: number) => 0.088 - 0.03 * t
  const NS = 16
  for (let i = 0; i < NS; i++) {
    const a = neckCurve.getPointAt(i / NS)
    const b = neckCurve.getPointAt((i + 1) / NS)
    pescoco.add(limb(
      rel([a.x, a.y, a.z], N0), rel([b.x, b.y, b.z], N0),
      neckR((i + 0.5) / NS), SWAN, { roughness: 0.85 },
    ))
  }
  const HEAD: V3 = [0.15, 2.06, 0]
  const cranio = sphere(0.112, SWAN, { roughness: 0.85 })
  cranio.scale.set(1.3, 0.95, 0.88)
  cranio.position.set(...rel(HEAD, N0))
  pescoco.add(cranio)
  pescoco.add(taperedTube(
    [rel([0.22, 2.05, 0], N0), rel([0.32, 2.02, 0], N0), rel([0.44, 1.975, 0], N0)],
    [0.052, 0.042, 0.03, 0.017],
    BEAK,
    { roughness: 0.4 },
  ))
  const ponteira = sphere(0.018, BLACK, { roughness: 0.4 })
  ponteira.position.set(...rel([0.443, 1.973, 0], N0))
  pescoco.add(ponteira)
  const calo = sphere(0.04, BLACK, { roughness: 0.45 })
  calo.scale.set(1, 1.1, 0.75)
  calo.position.set(...rel([0.235, 2.085, 0], N0))
  pescoco.add(calo)
  for (const s of [-1, 1]) {
    const mascara = sphere(0.035, BLACK, { roughness: 0.45 })
    mascara.scale.set(1.3, 0.8, 0.5)
    mascara.position.set(...rel([0.2, 2.07, s * 0.06], N0))
    pescoco.add(mascara)
    const olho = sphere(0.02, '#0e0e10', { roughness: 0.15 })
    olho.position.set(...rel([0.17, 2.09, s * 0.083], N0))
    pescoco.add(olho)
    const brilho = sphere(0.007, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 })
    brilho.position.set(...rel([0.178, 2.098, s * 0.1], N0))
    pescoco.add(brilho)
  }

  // ---- véu de tule + tiara de pérolas ---------------------------------------
  const veu = new THREE.Group()
  veu.position.set(0.1, 2.14, 0)
  lambreta.add(veu)
  const tule = lathe(
    [[0.22, -0.6], [0.19, -0.46], [0.14, -0.3], [0.08, -0.14], [0.03, 0]],
    '#fdfcfa',
    { roughness: 0.9, detail: 0 },
  )
  tule.rotation.z = -0.55
  const tuleMat = tule.material as THREE.MeshStandardMaterial
  tuleMat.side = THREE.DoubleSide
  tuleMat.transparent = true
  tuleMat.opacity = 0.9
  veu.add(tule)
  const orla = torus(0.22, 0.012, '#ffffff', { roughness: 0.8, detail: 0 })
  orla.rotation.x = Math.PI / 2
  orla.position.y = -0.6
  const orlaG = new THREE.Group()
  orlaG.rotation.z = -0.55
  orlaG.add(orla)
  veu.add(orlaG)
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45
    const perola = sphere(0.019, '#fffaf0', { roughness: 0.2 })
    perola.position.set(0.02 + Math.cos(a) * 0.02, 0.0, Math.sin(a) * 0.07)
    veu.add(perola)
  }
  const flor = sphere(0.035, '#f2dada', { roughness: 0.6 })
  flor.position.set(-0.01, 0.01, 0.0)
  veu.add(flor)

  // ---- fita métrica amarela no pescoço, ponta voando pra trás ----------------
  const TT = 0.48
  const fc = neckCurve.getPointAt(TT)
  const FC: V3 = [fc.x, fc.y, fc.z]
  const fita = new THREE.Group()
  fita.position.set(...FC)
  lambreta.add(fita)
  for (const [dt, tilt] of [[-0.035, 0.1], [0.035, -0.12]] as const) {
    const p = neckCurve.getPointAt(TT + dt)
    const tan = neckCurve.getTangentAt(TT + dt)
    const volta = cylinder(neckR(TT + dt) + 0.012, neckR(TT + dt) + 0.012, 0.045, TAPE, { roughness: 0.4 })
    volta.quaternion.setFromUnitVectors(UP, tan)
    volta.rotateX(tilt)
    volta.position.set(...rel([p.x, p.y, p.z], FC))
    fita.add(volta)
  }
  const pts: V3[] = []
  for (let k = 0; k <= 6; k++) {
    pts.push([0.0 - k * 0.14, Math.sin(k * 1.3) * 0.045 + k * 0.035, 0.1 + k * 0.025])
  }
  for (let k = 0; k < 6; k++) {
    const a = pts[k]
    const b = pts[k + 1]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) + 0.02
    const seg = rbox(len, 0.055, 0.008, 0.004, TAPE, { roughness: 0.4 })
    seg.rotation.order = 'ZYX'
    seg.rotation.set((k % 2 ? 1 : -1) * 0.3, 0, Math.atan2(dy, dx))
    seg.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
    for (let j = 0; j < 4; j++) {
      const tick = rbox(0.006, j % 2 ? 0.016 : 0.026, 0.003, 0.001, BLACK, { roughness: 0.5 })
      tick.position.set(-len / 2 + 0.02 + j * (len - 0.04) / 3, 0.027 - (j % 2 ? 0.008 : 0.013), 0.005)
      seg.add(tick)
    }
    fita.add(seg)
  }
  const ponteiraFita = rbox(0.02, 0.06, 0.014, 0.004, '#9aa1a8', { roughness: 0.3, metalness: 0.7 })
  ponteiraFita.position.set(pts[6][0] - 0.005, pts[6][1], pts[6][2])
  ponteiraFita.rotation.x = 0.3
  fita.add(ponteiraFita)

  // ---- vara de bambu presa no bico -------------------------------------------
  const VARA0: V3 = [0.31, 2.0, 0]
  const VANG = 0.24
  const VLEN = 1.6
  const vara = new THREE.Group()
  vara.position.set(...VARA0)
  vara.rotation.z = VANG
  lambreta.add(vara)
  const colmo = cylinder(0.022, 0.022, VLEN, BAMBOO, { roughness: 0.45 })
  colmo.rotation.z = Math.PI / 2
  colmo.position.x = VLEN / 2
  vara.add(colmo)
  for (let i = 1; i < 5; i++) {
    const no = torus(0.023, 0.006, BAMBOO_NODE, { roughness: 0.5 })
    no.rotation.y = Math.PI / 2
    no.position.x = i * (VLEN / 5)
    vara.add(no)
  }
  const tampa = sphere(0.024, BAMBOO_NODE, { roughness: 0.5 })
  tampa.scale.x = 0.5
  tampa.position.x = VLEN
  vara.add(tampa)

  // ---- vestido de noiva no cabide, na ponta da vara --------------------------
  const TIP: V3 = [VARA0[0] + Math.cos(VANG) * (VLEN - 0.06), VARA0[1] + Math.sin(VANG) * (VLEN - 0.06), 0]
  const vestido = makeDress(DRESS, SASH)
  vestido.position.set(...TIP)
  vestido.scale.setScalar(0.86)
  lambreta.add(vestido)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'loja', object: piso },
    { name: 'provador', group: 'loja', object: provador },
    { name: 'arara', group: 'loja', object: arara },
    { name: 'lambreta', group: 'vrum', object: lambreta },
    { name: 'fumaca', group: 'vrum', object: fumaca },
    { name: 'cisne', group: 'cisne', object: cisne },
    { name: 'patas', group: 'cisne', object: patas },
    { name: 'pescoco', group: 'cisne', object: pescoco },
    { name: 'veu', group: 'cisne', object: veu },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'vestido', group: 'prova', object: vestido },
    { name: 'fita', group: 'metrica', object: fita },
    { name: 'marcas', group: 'freio', object: marcas },
  ]

  const s3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('piso-rise', 'piso', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma loja de noivas sobe do chão: mármore rosa, arara dourada e, no fundo, o provador de cortina bordô.',
    }),
    seq('provador-rise', 'provador', 0.5, 0.9, [riseFrom(0, 2.9)], { ease: 'easeOut' }),
    seq('arara-rise', 'arara', 0.8, 0.8, [riseFrom(GY, 1.9)], { ease: 'easeOut' }),

    seq('lambreta-entra', 'lambreta', 2.0, 1.1, [ch('position.x', SX - 2.8, SX)], {
      ease: 'easeOut',
      caption: 'VRUM! VRUM! Entra uma lambreta azul-clara soltando fumacinha…',
    }),
    seq('fumaca-solta', 'fumaca', 2.5, 0.7, s3(0.01, 1), { ease: 'easeOut' }),

    seq('cisne-surge', 'cisne', 3.7, 0.6, s3(0.01, 1), {
      ease: 'easeOut',
      caption: '…pilotada por uma CISNE noiva: ela casa amanhã — e cisne casa uma vez só na vida.',
    }),
    seq('patas-surgem', 'patas', 3.8, 0.5, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('pescoco-cresce', 'pescoco', 4.0, 0.7, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),
    seq('veu-cai', 'veu', 4.6, 0.5, s3(0.01, 1), { ease: 'easeOut' }),

    seq('vara-estica', 'vara', 5.9, 0.7, [ch('scale.x', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'No bico, uma VARA comprida de bambu — VAR(a), sem o -a: VAR!',
    }),

    seq('vestido-desce', 'vestido', 7.2, 0.6, [ch('scale.y', 0.01, 0.86)], {
      ease: 'easeOut',
      caption: 'Na ponta, o vestido de noiva que ela veio PROVAR: PRÚÚ(va)!',
    }),

    seq('fita-enrola', 'fita', 8.5, 0.6, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'E no pescoço, uma fita MÉTrica amarela voando pra trás: MÉT!',
    }),

    seq('lambreta-freia', 'lambreta', 9.9, 0.25, [ch('rotation.z', 0, BRAKE)], {
      ease: 'easeOut',
      caption: 'Freia cantando pneu na frente da cortina, buzina e pergunta: VAR É… PRÚÚ-VRUM-MÉT?',
    }),
    seq('marcas-riscam', 'marcas', 9.9, 0.3, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),
    seq('vestido-balanca', 'vestido', 9.95, 0.3, [ch('rotation.z', 0, 0.35)], { ease: 'easeOut' }),
    seq('lambreta-assenta', 'lambreta', 10.15, 0.3, [ch('rotation.z', BRAKE, 0)], { ease: 'easeIn' }),
    seq('vestido-volta', 'vestido', 10.25, 0.4, [ch('rotation.z', 0.35, -0.12)], { ease: 'easeInOut' }),
    seq('vestido-para', 'vestido', 10.65, 0.45, [ch('rotation.z', -0.12, 0)], { ease: 'easeInOut' }),

    seq('fumaca-pof', 'fumaca', 11.4, 0.6, s3(0.6, 1), {
      ease: 'easeOut',
      caption: 'Var är provrummet? — Onde fica o provador?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 1.95, 5.2], target: [0.1, 1.5, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-ar-provrummet',
    contexto:
      "Loja: em qualquer loja de roupa, com as peças no braço — pro atendente ou pra quem está arrumando as araras. Muitas lojas têm a plaquinha 'Provrum' com o limite de peças ('Max 6 plagg'), e a resposta costuma vir com direção: 'Längst in, till vänster' (lá no fundo, à esquerda).",
    fraseFonte: 'Onde fica o provador?',
    fraseAlvo: 'Var är provrummet?',
    pronuncia:
      "var é PRÚÚV-rum-met? ('var' com R brando de 'caro', que escorrega no 'är': va-RÉ — sem esse R vira 'vad är', 'o que é?'; 'är' = É aberto e curto; 'prov' com U FECHADO e LONGO — o 'o' longo sueco, nunca o Ó aberto de 'prova' — e o V já colado no R; 'rum' com R de um toque só (depois do V, como em 'palavra'), U curto de bico puxando pra Ô e M demorado; '-met' fraquinho, é o artigo 'o'; a força cai no PRÚÚV, com um acento menor no RUM)",
    ponteSonora:
      "VAR É... PRÚÚ(va)-VRUM... MÉT(rica)? (5 sílabas: var-é-PRÚÚV-rum-met, saindo va-ré-PRÚÚV-rum-met; força no PRÚÚ, com um acento menor no VRUM; VAR = a VARA sem o -a, a MESMA VARA de 'Var är kassan?', 'Var kan jag köpa biljett?' e 'Var bor du?' — R BRANDO de 'caro' e AUDÍVEL, que escorrega no É: va-RÉ; sem ele sobra VÁ É, 'vad är' (o que é?), e a pergunta muda; É = 'är', aberto e curto, o mesmo de 'Var är kassan?'; PRÚÚ(va) = a PROVA do vestido — PROVAR roupa —, mas dita com U: U FECHADO e LONGO, o 'o' longo sueco, o mesmo do BÚCA de 'boka' e do BÚR'D de 'bord'; nunca o Ó aberto da 'prova' do português; o P cola no R de um toque só, e o -VA cai: o V da PROVA vira o V do motor, um V só; VRUM = o ronco da lambreta, que o brasileiro já fala com o R certo: depois do V o R sai de um toque, como em 'palavra' e 'livro' — nunca o RR de garganta de 'rua', que em sueco é H; U CURTO de bico puxando pra Ô, a mesma vogal do TROM(ba) de 'Städa ditt rum!' — é a mesma palavra, 'rum' (sala, quarto): provrum = sala de PROVA; M fechado e demorado, que já emenda no MÉT; MÉT(rica) = a fita MÉTRICA do pescoço, só o MÉT e FRAQUINHO, sem a força do 'métrica': É curto e T seco no fim, nunca 'tchi'; é o '-et' colado no 'rum', o artigo 'o' — sem ele sobra 'provrum', UM provador qualquer)",
    historia:
      "A cisne casa amanhã — e cisne casa uma vez só na vida —, então entra na loja de noivas pilotando uma lambreta: VRUM! VRUM! No bico, uma VARA comprida com o vestido de noiva pendurado na ponta, pronto pra PROVAR; no pescoço comprido, uma fita MÉTrica amarela esvoaçando. Ela dá voltas e mais voltas entre os cabideiros, cutucando cada cortina com a VARA, e nenhuma é a certa. Até que freia cantando pneu, buzina e pergunta: VAR É... PRÚÚ-VRUM-MÉT? — onde fica o provador?",
  },
  createScene,
  refine: { organic: ['cisne', 'pescoco'] },
}

export default card
