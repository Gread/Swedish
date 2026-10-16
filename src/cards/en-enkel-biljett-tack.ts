import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "En enkel biljett, tack." — EN! ÉN-(ní)QUEL... BILHÉT(e)! TAC!
 *
 * Diorama: piso de ladrilhos bege de estação. À esquerda, o guichê de madeira
 * escura com janelinha de vidro, placa de trem e relógio de estação. À direita
 * o piloto de avião (quepe com asas, bigodão, óculos de aviador) ergue UM dedo
 * — EN! — com uma moeda de NÍQUEL equilibrada de pé na ponta: ÉN-QUEL. Da
 * janelinha desce deslizando o BILHETE amarelo gigante, comprido feito pista
 * de pouso, com uma seta de "só ida" impressa; na ponta, o picotador prateado
 * fura com um TAC!
 *
 * Acento saturado (amarelo) reservado ao bilhete; a moeda brilha em prata.
 */

const TILE = '#dccaa6'
const TILE_ALT = '#cdb68e'
const GROUT = '#b39f7e'
const STONE = '#7d6c5a'
const WOOD = '#4e3220'
const WOOD_PANEL = '#64412a'
const WOOD_TRIM = '#38231a'
const BRASS = '#c9a250'
const NAVY = '#22335a'
const NAVY_DARK = '#18233d'
const SKIN = '#e8c39e'
const MUSTACHE = '#4a3020'
const SILVER = '#d5d9dd'
const TICKET = '#f4c111' // ACENTO saturado — reservado ao BILHÉT
const TICKET_INK = '#a8580c'
const SIGN = '#2c5a50'

const GY = 0.2 // topo do piso

// guichê: grupo no chão, frente em +z local, levemente virado pro piloto
const BX = -0.95
const BZ = -0.85
const BR = 0.2
const BW = 1.55
const BD = 0.7
const BH = 2.05 // altura do corpo acima do piso
const LEDGE_TOP = 0.98

// bilhete: fita contínua dobrando da janelinha até o chão
const T_W = 0.78
const T_T = 0.035
const T_Y0 = LEDGE_TOP + T_T / 2
const R1 = 0.2
const R2 = 0.45
const ALPHA = 1.0
const FLAT0 = 0.34
const FLAT_RUN = 1.02
const DROP = T_Y0 - (GY + T_T / 2 + 0.004)
const SLOPE = (DROP - (R1 + R2) * (1 - Math.cos(ALPHA))) / Math.sin(ALPHA)

// piloto
const PX = 0.5
const PZ = 0.05
const PR = -0.42
const PS = 1.2
const RAISE = 2.78 // braço erguido (pivô no ombro)
const ARM_REST = 0.12

interface PathPoint { s: number; z: number; y: number; phi: number }

/** Caminho 2D (z para a frente, y para cima) por segmentos de reta/arco. */
function makePath(segs: { len: number; turn: number }[]) {
  const pts: PathPoint[] = [{ s: 0, z: 0, y: 0, phi: 0 }]
  let s = 0
  let z = 0
  let y = 0
  let phi = 0
  for (const g of segs) {
    const n = Math.max(1, Math.ceil(g.len / 0.008))
    const ds = g.len / n
    const dphi = g.turn / n
    for (let i = 0; i < n; i++) {
      const pm = phi + dphi / 2
      z += Math.cos(pm) * ds
      y -= Math.sin(pm) * ds
      phi += dphi
      s += ds
      pts.push({ s, z, y, phi })
    }
  }
  const at = (q: number): PathPoint => {
    if (q <= 0) return pts[0]
    if (q >= s) return pts[pts.length - 1]
    let lo = 0
    let hi = pts.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (pts[mid].s < q) lo = mid
      else hi = mid
    }
    const a = pts[lo]
    const b = pts[hi]
    const t = (q - a.s) / (b.s - a.s || 1)
    return {
      s: q,
      z: a.z + (b.z - a.z) * t,
      y: a.y + (b.y - a.y) * t,
      phi: a.phi + (b.phi - a.phi) * t,
    }
  }
  return { length: s, at }
}

type Path = ReturnType<typeof makePath>

/** Fita que acompanha o caminho: caixa subdividida dobrada vértice a vértice. */
function ribbon(
  path: Path, s0: number, s1: number, width: number, thick: number,
  color: string, opts: { roughness?: number } = {}, xOff = 0, lift = 0,
) {
  const len = s1 - s0
  const geo = new THREE.BoxGeometry(width, thick, len, 1, 1, Math.max(2, Math.ceil(len / 0.02)))
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i) + lift
    const s = s0 + p.getZ(i) + len / 2
    const q = path.at(s)
    p.setXYZ(i, x + xOff, q.y + y * Math.cos(q.phi), q.z + y * Math.sin(q.phi))
  }
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat(color, { roughness: opts.roughness ?? 0.55, size: Math.max(width, len) }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Pictograma de trem visto de frente, em placa. */
function trainIcon() {
  const g = new THREE.Group()
  const white = '#f1ede2'
  const bodyT = rbox(0.24, 0.2, 0.02, 0.05, white, { roughness: 0.5 })
  bodyT.position.y = 0.02
  g.add(bodyT)
  const windshield = rbox(0.17, 0.07, 0.02, 0.02, SIGN, { roughness: 0.5 })
  windshield.position.set(0, 0.06, 0.008)
  g.add(windshield)
  for (const s of [-1, 1]) {
    const lamp = sphere(0.018, SIGN, { roughness: 0.5 })
    lamp.position.set(s * 0.065, -0.035, 0.01)
    lamp.scale.z = 0.5
    g.add(lamp)
    const leg = rbox(0.025, 0.06, 0.02, 0.008, white, { roughness: 0.5 })
    leg.position.set(s * 0.07, -0.1, 0)
    leg.rotation.z = s * 0.35
    g.add(leg)
  }
  const rail = rbox(0.3, 0.022, 0.02, 0.008, white, { roughness: 0.5 })
  rail.position.y = -0.135
  g.add(rail)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: piso de ladrilhos bege da estação ------------------------------
  const base = new THREE.Group()
  const RAD = 2.45

  const plinth = cylinder(RAD + 0.08, RAD + 0.16, 0.12, STONE, { roughness: 0.9 })
  plinth.position.y = 0.06
  base.add(plinth)

  const floor = cylinder(RAD, RAD + 0.05, 0.08, TILE, { roughness: 0.7 })
  floor.position.y = GY - 0.04
  base.add(floor)

  const STEP = 0.44
  for (let i = -6; i <= 6; i++) {
    const c = i * STEP + STEP / 2
    if (Math.abs(c) >= RAD - 0.03) continue
    const len = 2 * Math.sqrt(RAD * RAD - c * c) - 0.04
    const gx = rbox(len, 0.012, 0.022, 0.005, GROUT, { roughness: 0.9 })
    gx.position.set(0, GY + 0.002, c)
    base.add(gx)
    const gz = rbox(0.022, 0.012, len, 0.005, GROUT, { roughness: 0.9 })
    gz.position.set(c, GY + 0.002, 0)
    base.add(gz)
  }
  // xadrez discreto: ladrilhos alternados um tom abaixo
  for (let i = -6; i <= 5; i++) {
    for (let k = -6; k <= 5; k++) {
      if ((i + k) % 2 === 0) continue
      const cx = i * STEP + STEP
      const cz = k * STEP + STEP
      if (Math.hypot(Math.abs(cx) + STEP / 2, Math.abs(cz) + STEP / 2) > RAD - 0.02) continue
      const t = rbox(STEP - 0.03, 0.01, STEP - 0.03, 0.004, TILE_ALT, { roughness: 0.7 })
      t.position.set(cx, GY + 0.001, cz)
      base.add(t)
    }
  }

  // vaso com planta ao lado do guichê
  const vaso = lathe(
    [[0, 0], [0.16, 0], [0.19, 0.05], [0.22, 0.32], [0.24, 0.36], [0.2, 0.36], [0, 0.34]],
    '#8f6a55',
    { roughness: 0.8 },
  )
  vaso.position.set(-2.0, GY, -0.2)
  base.add(vaso)
  const folhas = puff(0.26, '#4f7a52', 7, 43, { roughness: 0.85 })
  folhas.position.set(-2.0, GY + 0.6, -0.2)
  folhas.scale.set(1, 1.15, 1)
  base.add(folhas)

  // lixeira de metal no fundo à direita
  const lixeira = lathe(
    [[0, 0], [0.13, 0], [0.15, 0.42], [0.16, 0.44], [0.0, 0.44]],
    '#6f7b80',
    { roughness: 0.4, metalness: 0.6 },
  )
  lixeira.position.set(2.05, GY, -0.75)
  lixeira.rotation.y = rand() * Math.PI
  base.add(lixeira)

  root.add(base)

  // ---- guichê de madeira escura ---------------------------------------------
  const guiche = new THREE.Group()
  guiche.position.set(BX, 0, BZ)
  guiche.rotation.y = BR
  const FZ = BD / 2 // face da frente

  const rodape = rbox(BW + 0.08, 0.14, BD + 0.08, 0.03, WOOD_TRIM, { roughness: 0.8 })
  rodape.position.y = GY + 0.07
  guiche.add(rodape)

  const corpo = rbox(BW, BH, BD, 0.04, WOOD, { roughness: 0.75 })
  corpo.position.y = GY + BH / 2
  guiche.add(corpo)

  // almofadas da frente, abaixo do balcãozinho
  for (const s of [-1, 1]) {
    const almofada = rbox(0.6, 0.56, 0.04, 0.03, WOOD_PANEL, { roughness: 0.7 })
    almofada.position.set(s * 0.36, GY + 0.5, FZ + 0.02)
    guiche.add(almofada)
    const friso = rbox(0.48, 0.44, 0.03, 0.02, WOOD, { roughness: 0.75 })
    friso.position.set(s * 0.36, GY + 0.5, FZ + 0.035)
    guiche.add(friso)
  }

  // balcãozinho onde o bilhete passa
  const ledge = rbox(1.02, 0.07, 0.3, 0.025, WOOD_PANEL, { roughness: 0.65 })
  ledge.position.set(0, LEDGE_TOP - 0.035, FZ + 0.13)
  guiche.add(ledge)
  const ledgeEdge = rbox(1.02, 0.03, 0.03, 0.01, BRASS, { roughness: 0.3, metalness: 0.8 })
  ledgeEdge.position.set(0, LEDGE_TOP - 0.05, FZ + 0.285)
  guiche.add(ledgeEdge)
  for (const s of [-1, 1]) {
    const bracket = rbox(0.05, 0.16, 0.22, 0.015, WOOD_TRIM, { roughness: 0.8 })
    bracket.position.set(s * 0.42, LEDGE_TOP - 0.15, FZ + 0.11)
    guiche.add(bracket)
  }

  // janelinha: fundo escuro, vidro e moldura de latão
  const WIN_Y = 1.37
  const fundo = rbox(0.9, 0.6, 0.03, 0.02, '#1d262c', { roughness: 0.6 })
  fundo.position.set(0, WIN_Y, FZ + 0.01)
  guiche.add(fundo)
  // vulto do bilheteiro atrás do vidro
  const vulto = sphere(0.15, '#3a4752', { roughness: 0.8 })
  vulto.position.set(0.12, WIN_Y + 0.02, FZ + 0.01)
  vulto.scale.z = 0.25
  guiche.add(vulto)
  const vultoOmbros = rbox(0.42, 0.16, 0.02, 0.07, '#33404a', { roughness: 0.8 })
  vultoOmbros.position.set(0.12, WIN_Y - 0.22, FZ + 0.03)
  guiche.add(vultoOmbros)
  const vidro = rbox(0.86, 0.56, 0.015, 0.01, '#bfe0e8', { roughness: 0.05 })
  const vm = vidro.material as THREE.MeshStandardMaterial
  vm.transparent = true
  vm.opacity = 0.28
  vidro.castShadow = false
  vidro.position.set(0, WIN_Y, FZ + 0.05)
  guiche.add(vidro)
  const furoFala = torus(0.06, 0.012, BRASS, { roughness: 0.3, metalness: 0.8 })
  furoFala.position.set(-0.2, WIN_Y - 0.02, FZ + 0.06)
  guiche.add(furoFala)
  for (const [w, h, x, y] of [
    [0.98, 0.06, 0, WIN_Y + 0.31],
    [0.98, 0.05, 0, WIN_Y - 0.315],
    [0.06, 0.66, -0.46, WIN_Y],
    [0.06, 0.66, 0.46, WIN_Y],
  ] as const) {
    const f = rbox(w, h, 0.06, 0.02, BRASS, { roughness: 0.35, metalness: 0.75 })
    f.position.set(x, y, FZ + 0.04)
    guiche.add(f)
  }
  // fresta do passa-bilhete
  const fresta = rbox(0.86, 0.045, 0.03, 0.01, '#120d0a', { roughness: 0.9 })
  fresta.position.set(0, LEDGE_TOP + 0.025, FZ + 0.012)
  guiche.add(fresta)

  // placa com o pictograma do trem
  const placa = rbox(0.74, 0.34, 0.05, 0.04, SIGN, { roughness: 0.5 })
  placa.position.set(0, GY + BH - 0.25, FZ + 0.03)
  guiche.add(placa)
  const icon = trainIcon()
  icon.position.set(0, GY + BH - 0.24, FZ + 0.06)
  guiche.add(icon)

  // cornija e relógio de estação
  const cornija = rbox(BW + 0.16, 0.12, BD + 0.14, 0.03, WOOD_TRIM, { roughness: 0.75 })
  cornija.position.y = GY + BH + 0.06
  guiche.add(cornija)
  const haste = cylinder(0.03, 0.03, 0.12, '#2a2a2c', { roughness: 0.4, metalness: 0.6 })
  haste.position.set(0, GY + BH + 0.18, 0.05)
  guiche.add(haste)
  const relogio = new THREE.Group()
  relogio.position.set(0, GY + BH + 0.43, 0.05)
  const caixa = cylinder(0.23, 0.23, 0.08, '#2a2a2c', { roughness: 0.4, metalness: 0.6 }, 40)
  caixa.rotation.x = Math.PI / 2
  relogio.add(caixa)
  const face = cylinder(0.2, 0.2, 0.02, '#f4f1e8', { roughness: 0.4 }, 40)
  face.rotation.x = Math.PI / 2
  face.position.z = 0.035
  relogio.add(face)
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const tick = rbox(0.016, k % 3 === 0 ? 0.05 : 0.03, 0.01, 0.004, '#1f1f1f', { roughness: 0.5 })
    tick.position.set(Math.sin(a) * 0.165, Math.cos(a) * 0.165, 0.047)
    tick.rotation.z = -a
    relogio.add(tick)
  }
  const ponteiroH = rbox(0.022, 0.11, 0.01, 0.006, '#1f1f1f', { roughness: 0.5 })
  ponteiroH.position.set(0.035, 0.035, 0.052)
  ponteiroH.rotation.z = -Math.PI / 4
  relogio.add(ponteiroH)
  const ponteiroM = rbox(0.016, 0.16, 0.01, 0.005, '#1f1f1f', { roughness: 0.5 })
  ponteiroM.position.set(0, 0.07, 0.056)
  relogio.add(ponteiroM)
  guiche.add(relogio)

  root.add(guiche)

  // ---- bilhete amarelo gigante ----------------------------------------------
  const path = makePath([
    { len: FLAT0, turn: 0 },
    { len: R1 * ALPHA, turn: ALPHA },
    { len: SLOPE, turn: 0 },
    { len: R2 * ALPHA, turn: -ALPHA },
    { len: FLAT_RUN, turn: 0 },
  ])
  const L = path.length
  const S_FLOOR = L - FLAT_RUN

  const frame = new THREE.Object3D()
  frame.position.set(BX, 0, BZ)
  frame.rotation.y = BR
  frame.updateMatrixWorld()
  const slot = new THREE.Vector3(0, T_Y0, FZ - 0.04).applyMatrix4(frame.matrixWorld)

  const bilhete = new THREE.Group()
  bilhete.position.copy(slot)
  bilhete.rotation.y = BR

  bilhete.add(ribbon(path, 0, L, T_W, T_T, TICKET, { roughness: 0.5 }))
  // filetes laranja nas bordas, de ponta a ponta
  for (const s of [-1, 1]) {
    bilhete.add(ribbon(path, 0.05, L - 0.04, 0.035, 0.006, TICKET_INK, { roughness: 0.5 }, s * (T_W / 2 - 0.06), T_T / 2))
  }
  // faixa de cabeçalho na descida
  bilhete.add(ribbon(path, FLAT0 + 0.05, FLAT0 + 0.33, T_W - 0.2, 0.006, TICKET_INK, { roughness: 0.5 }, 0, T_T / 2))

  /** posição sobre a face de cima do bilhete no comprimento s */
  const onTop = (s: number) => path.at(s)
  const FY = -DROP + T_T / 2 + 0.003 // topo do bilhete no trecho do chão

  // seta de SÓ IDA impressa, apontando pra longe do guichê
  const seta = new THREE.Group()
  const sA = S_FLOOR + 0.28
  seta.position.set(0, FY, onTop(sA).z)
  const hasteSeta = rbox(0.11, 0.008, 0.24, 0.01, TICKET_INK, { roughness: 0.5 })
  hasteSeta.position.z = -0.06
  seta.add(hasteSeta)
  // ponta triangular: prisma de 3 lados achatado, um vértice apontando +z
  const ponta = cylinder(0.17, 0.17, 0.008, TICKET_INK, { roughness: 0.5 }, 3)
  ponta.rotation.y = Math.PI / 2
  ponta.position.z = 0.1
  ponta.scale.set(1, 1, 1)
  seta.add(ponta)
  bilhete.add(seta)

  // linhas de texto à esquerda da seta
  for (let k = 0; k < 3; k++) {
    const linha = rbox(0.13, 0.007, 0.05, 0.01, '#c98f0d', { roughness: 0.5 })
    linha.position.set(-0.22, FY, onTop(S_FLOOR + 0.12 + k * 0.12).z)
    bilhete.add(linha)
    const linhaD = linha.clone()
    linhaD.position.x = 0.22
    bilhete.add(linhaD)
  }

  // picote do canhoto
  const S_PERF = L - 0.42
  for (let k = 0; k < 9; k++) {
    const dot = rbox(0.05, 0.008, 0.022, 0.006, TICKET_INK, { roughness: 0.5 })
    dot.position.set(-0.32 + k * 0.08, FY, onTop(S_PERF).z)
    bilhete.add(dot)
  }
  root.add(bilhete)

  // ---- o furo redondo no canhoto (aparece no TAC) ---------------------------
  const S_HOLE = L - 0.2
  const furo = new THREE.Group()
  furo.position.set(-0.1, FY - 0.003, onTop(S_HOLE).z)
  const buraco = cylinder(0.085, 0.085, 0.012, '#9c8a6c', { roughness: 0.9 }, 32)
  buraco.position.y = 0.002
  furo.add(buraco)
  const borda = torus(0.085, 0.012, '#c98f0d', { roughness: 0.5 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.004
  furo.add(borda)
  bilhete.add(furo)

  // ---- picotador prateado preso na ponta ------------------------------------
  const picotador = new THREE.Group()
  const PIC_Y = FY + 0.01
  picotador.position.set(T_W / 2 - 0.02, PIC_Y, onTop(S_HOLE).z)
  const metal = { roughness: 0.22, metalness: 0.9 }
  // mandíbula de cima, mordendo a borda do bilhete
  const mandibula = rbox(0.3, 0.06, 0.12, 0.025, SILVER, metal)
  mandibula.position.set(-0.08, 0.03, 0)
  picotador.add(mandibula)
  const puncao = cylinder(0.045, 0.05, 0.05, '#b3b9be', metal, 24)
  puncao.position.set(-0.19, 0.075, 0)
  picotador.add(puncao)
  const eixo = cylinder(0.05, 0.05, 0.15, '#9aa1a6', metal, 24)
  eixo.rotation.x = Math.PI / 2
  eixo.position.set(0.08, 0.06, 0)
  picotador.add(eixo)
  // cabos em V subindo pra fora, com punhos pretos e mola
  for (const [ang, zOff] of [[0.62, 0.03], [0.32, -0.03]] as const) {
    const cabo = new THREE.Group()
    cabo.position.set(0.08, 0.06, zOff)
    cabo.rotation.z = ang - Math.PI / 2
    const barra = capsule(0.028, 0.5, SILVER, metal)
    barra.position.y = 0.27
    cabo.add(barra)
    const punho = capsule(0.042, 0.24, '#26272b', { roughness: 0.7 })
    punho.position.y = 0.42
    cabo.add(punho)
    picotador.add(cabo)
  }
  const mola = torus(0.04, 0.01, '#9aa1a6', metal)
  mola.position.set(0.24, 0.17, 0)
  mola.rotation.y = Math.PI / 2
  picotador.add(mola)
  picotador.scale.setScalar(1.05)
  picotador.rotation.y = -0.55
  bilhete.add(picotador)

  // ---- piloto de avião -------------------------------------------------------
  const piloto = person({ body: NAVY, skin: SKIN, height: 1.5, armAngle: 0.4 })
  piloto.position.set(PX, GY, PZ)
  piloto.rotation.y = PR
  piloto.scale.setScalar(PS)

  const gold = { roughness: 0.3, metalness: 0.8 }
  // colarinho branco + gravata
  for (const s of [-1, 1]) {
    const gola = rbox(0.09, 0.16, 0.03, 0.015, '#f2f0ea', { roughness: 0.6 })
    gola.position.set(s * 0.045, 0.68, 0.205)
    gola.rotation.set(-0.35, 0, s * 0.45)
    piloto.add(gola)
  }
  const gravata = rbox(0.06, 0.2, 0.03, 0.02, NAVY_DARK, { roughness: 0.6 })
  gravata.position.set(0, 0.6, 0.235)
  gravata.rotation.x = -0.25
  piloto.add(gravata)
  // botões dourados do paletó trespassado
  for (const bx of [-0.075, 0.075]) {
    for (const by of [0.3, 0.44]) {
      const botao = sphere(0.022, BRASS, gold)
      botao.position.set(bx, by, 0.255)
      botao.scale.z = 0.6
      piloto.add(botao)
    }
  }
  // brevê de asas no peito
  const breve = new THREE.Group()
  breve.position.set(-0.13, 0.55, 0.23)
  breve.rotation.y = -0.45
  for (const s of [-1, 1]) {
    const asa = rbox(0.07, 0.02, 0.012, 0.008, BRASS, gold)
    asa.position.x = s * 0.035
    asa.rotation.z = s * 0.2
    breve.add(asa)
  }
  piloto.add(breve)
  // dragonas listradas nos ombros
  for (const s of [-1, 1]) {
    const dragona = rbox(0.17, 0.035, 0.13, 0.015, NAVY_DARK, { roughness: 0.7 })
    dragona.position.set(s * 0.21, 0.755, 0)
    dragona.rotation.z = s * -0.35
    piloto.add(dragona)
    for (const k of [0, 1]) {
      const fita = rbox(0.022, 0.04, 0.135, 0.008, BRASS, gold)
      fita.position.set(s * (0.19 + k * 0.045), 0.765 - k * 0.016, 0)
      fita.rotation.z = s * -0.35
      piloto.add(fita)
    }
  }

  const head = piloto.getObjectByName('head') as THREE.Group

  // bigodão grosso
  for (const s of [-1, 1]) {
    const bigode = capsule(0.034, 0.09, MUSTACHE, { roughness: 0.85 })
    bigode.position.set(s * 0.058, -0.085, 0.262)
    bigode.rotation.z = s * (Math.PI / 2 - 0.35)
    head.add(bigode)
  }
  const bigodeMeio = sphere(0.038, MUSTACHE, { roughness: 0.85 })
  bigodeMeio.position.set(0, -0.072, 0.272)
  head.add(bigodeMeio)

  // óculos de aviador
  for (const s of [-1, 1]) {
    const lente = sphere(0.068, '#3c4a46', { roughness: 0.12, metalness: 0.6 })
    lente.position.set(s * 0.108, 0.03, 0.27)
    lente.scale.set(1, 0.85, 0.35)
    lente.rotation.z = s * 0.15
    head.add(lente)
    const aro = torus(0.066, 0.009, BRASS, gold)
    aro.position.set(s * 0.108, 0.03, 0.282)
    aro.scale.set(1, 0.85, 1)
    aro.rotation.z = s * 0.15
    head.add(aro)
    const haste = rbox(0.012, 0.012, 0.2, 0.004, BRASS, gold)
    haste.position.set(s * 0.19, 0.05, 0.17)
    haste.rotation.y = s * 0.25
    head.add(haste)
  }
  const ponte = rbox(0.07, 0.012, 0.012, 0.004, BRASS, gold)
  ponte.position.set(0, 0.075, 0.29)
  head.add(ponte)

  // braço erguido (peça própria, pivô no ombro) com o indicador em pé
  const braco = piloto.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(braco, 1.5)
  braco.rotation.z = RAISE
  const mao = braco.children[0]
  const HAND_Y = mao.position.y
  for (const dy of [0.1, 0.145]) {
    const punho = torus(0.088, 0.014, BRASS, gold)
    punho.rotation.x = Math.PI / 2
    punho.position.y = HAND_Y + dy
    braco.add(punho)
  }
  const dedo = capsule(0.032, 0.11, SKIN)
  dedo.position.set(0, HAND_Y - 0.14, 0.01)
  braco.add(dedo)
  const TIP_Y = HAND_Y - 0.225

  // braço esquerdo também com galões
  const bracoL = piloto.getObjectByName('armL') as THREE.Mesh
  const maoL = bracoL.children[0]
  for (const dy of [0.1, 0.145]) {
    const punho = torus(0.088, 0.014, BRASS, gold)
    punho.rotation.x = Math.PI / 2
    punho.position.y = maoL.position.y + dy
    bracoL.add(punho)
  }

  root.add(piloto)

  // ---- quepe azul-marinho com asas douradas (filho da cabeça) ---------------
  const quepe = new THREE.Group()
  quepe.position.set(0, 0.2, -0.01)
  quepe.rotation.x = -0.08
  const copa = lathe(
    [[0, 0.02], [0.27, 0.02], [0.285, 0.09], [0.33, 0.17], [0.345, 0.205], [0.3, 0.225], [0, 0.225]],
    NAVY,
    { roughness: 0.75 },
  )
  quepe.add(copa)
  const faixa = cylinder(0.282, 0.28, 0.08, '#141a28', { roughness: 0.6 }, 40)
  faixa.position.y = 0.05
  quepe.add(faixa)
  const cordao = torus(0.284, 0.011, BRASS, gold)
  cordao.rotation.x = Math.PI / 2
  cordao.position.y = 0.075
  quepe.add(cordao)
  const pala = cylinder(0.24, 0.24, 0.022, '#101318', { roughness: 0.25 }, 40)
  pala.position.set(0, 0.02, 0.17)
  pala.scale.z = 0.62
  pala.rotation.x = 0.22
  quepe.add(pala)
  const insignia = new THREE.Group()
  insignia.position.set(0, 0.13, 0.31)
  insignia.rotation.x = -0.35
  const centro = sphere(0.035, BRASS, gold)
  centro.scale.z = 0.5
  insignia.add(centro)
  for (const s of [-1, 1]) {
    for (const [len, dy] of [[0.12, 0.015], [0.09, -0.01]] as const) {
      const pena = rbox(len, 0.022, 0.012, 0.008, BRASS, gold)
      pena.position.set(s * (0.03 + len / 2), dy, 0)
      pena.rotation.z = s * 0.18
      insignia.add(pena)
    }
  }
  quepe.add(insignia)
  head.add(quepe)

  // ---- moeda de NÍQUEL equilibrada de pé na ponta do dedo --------------------
  const COIN_R = 0.12
  const moeda = new THREE.Group()
  // "para cima" do mundo, no referencial do braço girado
  const up = new THREE.Vector2(Math.sin(RAISE), Math.cos(RAISE))
  moeda.position.set(up.x * COIN_R, TIP_Y + up.y * COIN_R, 0.01)
  moeda.rotation.z = -RAISE
  const giro = new THREE.Group()
  giro.rotation.y = -PR * 0.8 // encara a câmera
  const disco = cylinder(COIN_R, COIN_R, 0.03, '#e3e6e9', { roughness: 0.3, metalness: 0.55 }, 48)
  disco.rotation.x = Math.PI / 2
  giro.add(disco)
  for (const s of [-1, 1]) {
    const aroM = torus(COIN_R - 0.006, 0.008, '#c3c9ce', { roughness: 0.3, metalness: 0.6 })
    aroM.position.z = s * 0.016
    giro.add(aroM)
    // o "1" da coroa sueca de níquel, em relevo dos dois lados
    const um = new THREE.Group()
    um.position.z = s * 0.017
    um.rotation.y = s < 0 ? Math.PI : 0
    const tronco = rbox(0.026, 0.12, 0.012, 0.006, '#9aa2a8', { roughness: 0.35, metalness: 0.6 })
    tronco.position.x = 0.008
    um.add(tronco)
    const bico = rbox(0.022, 0.05, 0.012, 0.006, '#9aa2a8', { roughness: 0.35, metalness: 0.6 })
    bico.position.set(-0.012, 0.045, 0)
    bico.rotation.z = -0.9
    um.add(bico)
    giro.add(um)
  }
  moeda.add(giro)
  braco.add(moeda)

  // ---- mala de rodinhas preta -----------------------------------------------
  const mala = new THREE.Group()
  mala.position.set(1.42, GY, 0.45)
  mala.rotation.y = -0.55
  const MALA_H = 0.68
  const casco = rbox(0.48, MALA_H, 0.28, 0.06, '#1e1f24', { roughness: 0.45 })
  casco.position.y = 0.06 + MALA_H / 2
  mala.add(casco)
  for (const x of [-0.12, 0, 0.12]) {
    const friso = rbox(0.035, MALA_H - 0.1, 0.02, 0.012, '#2e3036', { roughness: 0.4 })
    friso.position.set(x, 0.06 + MALA_H / 2, 0.142)
    mala.add(friso)
  }
  for (const s of [-1, 1]) {
    const roda = cylinder(0.045, 0.045, 0.04, '#111214', { roughness: 0.6 }, 20)
    roda.rotation.z = Math.PI / 2
    roda.position.set(s * 0.17, 0.045, -0.09)
    mala.add(roda)
    const pe = rbox(0.06, 0.04, 0.06, 0.015, '#111214', { roughness: 0.6 })
    pe.position.set(s * 0.17, 0.04, 0.09)
    mala.add(pe)
    const tubo = cylinder(0.014, 0.014, 0.4, '#aeb4b9', { roughness: 0.3, metalness: 0.8 }, 12)
    tubo.position.set(s * 0.09, 0.06 + MALA_H + 0.2, -0.11)
    mala.add(tubo)
  }
  const pega = rbox(0.24, 0.05, 0.05, 0.02, '#111214', { roughness: 0.6 })
  pega.position.set(0, 0.06 + MALA_H + 0.41, -0.11)
  mala.add(pega)
  const etiqueta = rbox(0.09, 0.13, 0.012, 0.012, '#f1ede2', { roughness: 0.6 })
  etiqueta.position.set(0.255, 0.06 + MALA_H - 0.12, 0.06)
  etiqueta.rotation.set(0, Math.PI / 2, 0.1)
  mala.add(etiqueta)
  const tarja = rbox(0.092, 0.03, 0.014, 0.008, '#b8453a', { roughness: 0.6 })
  tarja.position.set(0.257, 0.06 + MALA_H - 0.09, 0.06)
  tarja.rotation.set(0, Math.PI / 2, 0.1)
  mala.add(tarja)
  root.add(mala)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'estacao', object: base },
    { name: 'guiche', group: 'estacao', object: guiche },
    { name: 'piloto', group: 'piloto', object: piloto },
    { name: 'braco', group: 'piloto', object: braco },
    { name: 'quepe', group: 'piloto', object: quepe },
    { name: 'mala', group: 'piloto', object: mala },
    { name: 'moeda', group: 'moeda', object: moeda },
    { name: 'bilhete', group: 'bilhete', object: bilhete },
    { name: 'picotador', group: 'tac', object: picotador },
    { name: 'furo', group: 'tac', object: furo },
  ]

  const picZ = picotador.position.z
  const picY = picotador.position.y

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Numa estação de trem, brota do chão o guichê de madeira da bilheteria…',
    }),
    seq('guiche-rise', 'guiche', 0.25, 0.9, [riseFrom(0, 2.8)], { ease: 'easeOut' }),

    seq('piloto-rise', 'piloto', 1.9, 0.8, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'Chega um piloto de avião: vive de ida e volta, mas hoje quer SÓ IDA.',
    }),
    seq('braco-entra', 'braco', 1.9, 0.8, [ch('rotation.z', -0.6, ARM_REST)], { ease: 'easeOut' }),
    seq(
      'quepe-poe',
      'quepe',
      2.2,
      0.6,
      [
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
        ch('position.y', 0.55, 0.2),
      ],
      { ease: 'easeOut' },
    ),
    seq('mala-rola', 'mala', 2.4, 0.7, [ch('position.x', 2.6, 1.42), ch('rotation.y', -1.2, -0.55)], {
      ease: 'easeOut',
    }),

    seq('braco-ergue', 'braco', 3.7, 0.7, [ch('rotation.z', ARM_REST, RAISE)], {
      ease: 'easeOut',
      caption: 'Ele ergue UM dedo pro bilheteiro: EN!',
    }),

    seq(
      'moeda-surge',
      'moeda',
      5.3,
      0.8,
      [
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
        ch('rotation.y', -4 * Math.PI, 0),
      ],
      {
        ease: 'easeOut',
        caption: 'E na ponta do MESMO dedo equilibra, de pé, uma moeda de NÍQUEL: ÉN… QUEL!',
      },
    ),

    seq(
      'bilhete-desliza',
      'bilhete',
      7.1,
      1.0,
      [ch('scale.y', 0.03, 1), ch('scale.z', 0.03, 1)],
      {
        ease: 'easeOut',
        caption: 'Da janelinha desce deslizando um BILHETE amarelo gigante, comprido feito pista de pouso: BILHÉT!',
      },
    ),

    seq(
      'picotador-cai',
      'picotador',
      8.8,
      0.45,
      [ch('position.y', picY + 1.2, picY), ch('rotation.z', 0.7, 0), ch('position.z', picZ - 0.3, picZ)],
      {
        ease: 'easeIn',
        caption: 'O picotador prateado morde a ponta do bilhete e fura: TAC!',
      },
    ),
    seq('furo-abre', 'furo', 9.25, 0.25, [
      ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('picotador-quica', 'picotador', 9.25, 0.15, [ch('position.y', picY, picY + 0.08)], { ease: 'easeOut' }),
    seq('picotador-assenta', 'picotador', 9.4, 0.25, [ch('position.y', picY + 0.08, picY)], { ease: 'easeIn' }),

    seq('moeda-balanca', 'moeda', 10.1, 0.3, [ch('rotation.z', -RAISE, -RAISE + 0.22)], {
      ease: 'easeOut',
      caption: 'En enkel biljett, tack. — Um bilhete só de ida, por favor.',
    }),
    seq('moeda-firma', 'moeda', 10.4, 0.6, [ch('rotation.z', -RAISE + 0.22, -RAISE)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.12, 2.45, 5.75], target: [-0.05, 1.2, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'en-enkel-biljett-tack',
    contexto:
      "Transporte: no guichê ou no balcão do Pressbyrån, com o motorista do ônibus regional, ou na bilheteria do trem (SJ, Mälartåg). 'Enkel' é só de ida; o par é 'tur och retur' (ida e volta). Nos apps de transporte (SL, Västtrafik, Skånetrafiken) o botão se chama 'enkelbiljett'.",
    fraseFonte: 'Um bilhete só de ida, por favor.',
    fraseAlvo: 'En enkel biljett, tack.',
    pronuncia:
      "en ÉNG-kel bil-IÉT, TAK ('en' fraquinho, E curto e N na língua, sem nasal; 'enkel' com a força no EN — É aberto e curto, sem o 'ẽ' fanhoso do português, a língua já fechando no fundo antes do K (NG) — e o -kel fraco com L de verdade, nunca 'kéu'; 'biljett' com a força no JETT: bil-IÉT, o 'lj' sai como o LH de 'bilhete', mas com É ABERTO e T seco no fim, sem 'tchi'; 'tack' = TAK, A curto e K seco)",
    ponteSonora:
      "EN! ÉN-(ní)QUEL... BILHÉT(e)! TAC! (6 sílabas: en-ÉNG-kel-bil-IÉT-tak; força no ÉN, no IÉT e no TAC; EN = o 'en' (um) de sempre, o dedo erguido de 'Har du tid en stund?' e 'Får jag fråga en sak?': E curto, N na língua, sem o 'ẽ' nasal do português, fraquinho aqui; ÉN-(ní)QUEL = o MESMO dedo, agora com uma moeda de NÍQUEL equilibrada na ponta: o EN do dedo + o -QUEL do fim de 'níquel' (o NÍ fica de fora): a força no ÉN — É ABERTO e curto —, e a língua já fecha no fundo antes do K, como no 'bank' (NG), sem nasal; o -QUEL fraco e com L DE VERDADE, a língua no céu da boca — nunca o 'kéu' brasileiro de 'níquel'; dedo sem moeda é 'en' (um), dedo com moeda é 'enkel' (simples, só de ida); e nada de ÉT: 'biljett' é palavra de 'en'; BILHÉT(e) = o próprio BILHETE do português sem o -e — o mesmo bilhete amarelo gigante do pelicano de 'Var kan jag köpa biljett?': o LH de 'bilhete' é quase exatamente o 'lj' sueco, e a força no LHÉ já está no lugar certo, mas com É ABERTO de 'pé' e T SECO no fim, sem o 'tchi': bil-IÉT; TAC = o 'tack' de sempre, A curto e K seco — aqui, o estalo do picotador)",
    historia:
      'O piloto de avião, que passa a vida em voo de ida e volta, chega ao guichê da estação de trem decidido: dessa vez, só ida. Ergue UM dedo pro bilheteiro — EN! — e, pra não ter dúvida de que é só um, equilibra na ponta do mesmo dedo uma moeda de NÍQUEL: ÉN... QUEL. Da janelinha sai deslizando um BILHETE amarelo gigante, comprido feito pista de pouso, e o picotador fura com um TAC! Um bilhete só de ida, por favor — e obrigado.',
  },
  createScene,
}

export default card
