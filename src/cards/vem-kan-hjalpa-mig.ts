import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vem kan hjälpa mig?" — VÉMMM! CAN(a)... IÉL-PA... M'ÊI!
 *
 * Varanda de lajotas, haste de ferro com gancho, e pendurada nela uma gaiola
 * de varetas de CANA (o canário está EM CANA) coberta por uma MEIA gigante
 * listrada de vermelho e branco. Pelo furo na ponta da meia sai a cabeça do
 * canário, de bico escancarado no iodel (IÉL-PA... M'ÊI!), uma asinha acena
 * por outro furo e três notas azuis sobem.
 */

const GROUT = '#94573f'
const TILES = ['#c4714f', '#b8664a', '#cb7d59']
const RAIL = '#7d5c40'
const IRON = '#26282c'
const CANE = '#c3b95e'
const CANE_NODE = '#8f8639'
const CANE_CUT = '#ece2b2'
const RED = '#cf2f39' // acento: a MEIA (M'ÊI)
const WHITE = '#f3ece0'
const CUFF = '#e9e0cf'
const HOLE = '#2e1c1a'
const YELLOW = '#f6c31d'
const YELLOW_DARK = '#e2a514'
const ORANGE = '#f0801c'
const BLUE = '#2d6ae0'

const FY = 0.12 // topo do piso
const MY = 2.0 // pivô da meia (centro da gaiola)
const LEG_R = 0.72 // raio do cano da meia
const ROOT_Y_INV = 0.38

/** Malha com material do app em geometria arbitrária (arcos, faixas de esfera). */
function meshOf(geo: THREE.BufferGeometry, color: string, opts: Parameters<typeof mat>[1] = {}) {
  const m = new THREE.Mesh(geo, mat(color, opts))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Nota musical (colcheia) de frente para a câmera. */
function note(): THREE.Group {
  const g = new THREE.Group()
  const head = sphere(0.1, BLUE, { roughness: 0.3 })
  head.scale.set(1.3, 0.92, 0.7)
  head.rotation.z = 0.45
  g.add(head)
  const stem = rbox(0.04, 0.42, 0.04, 0.015, BLUE, { roughness: 0.3 })
  stem.position.set(0.105, 0.21, 0)
  g.add(stem)
  const flag = rbox(0.045, 0.2, 0.04, 0.018, BLUE, { roughness: 0.3 })
  flag.position.set(0.165, 0.34, 0)
  flag.rotation.z = 0.75
  g.add(flag)
  return g
}

/** Gomo de cana deitado: vareta com nós e pontas cortadas claras. */
function caneStick(len: number, r: number): THREE.Group {
  const g = new THREE.Group()
  const body = cylinder(r, r, len, CANE, { roughness: 0.5 })
  body.rotation.z = Math.PI / 2
  g.add(body)
  for (const t of [-0.32, 0.06, 0.38]) {
    if (Math.abs(t * len) > len / 2 - 0.04) continue
    const node = cylinder(r * 1.16, r * 1.16, 0.03, CANE_NODE, { roughness: 0.55 })
    node.rotation.z = Math.PI / 2
    node.position.x = t * len
    g.add(node)
  }
  for (const side of [-1, 1]) {
    const cut = cylinder(r * 0.92, r * 0.92, 0.008, CANE_CUT, { roughness: 0.7 })
    cut.rotation.z = Math.PI / 2
    cut.position.x = side * (len / 2 + 0.002)
    g.add(cut)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  root.rotation.y = -ROOT_Y_INV // gira o diorama: o pé da meia (e o canário) vem para a câmera
  const rand = rng(71)

  // ---- varanda: disco de lajotas terracota + guarda-corpo ao fundo --------
  const base = new THREE.Group()
  const disco = cylinder(1.95, 2.0, 0.12, GROUT, { roughness: 0.85 })
  disco.position.y = 0.06
  base.add(disco)

  const T = 0.44
  for (let i = -5; i <= 5; i++) {
    for (let j = -5; j <= 5; j++) {
      const cx = i * T
      const cz = j * T
      const far = Math.max(
        Math.hypot(Math.abs(cx) + T / 2, Math.abs(cz) + T / 2),
      )
      if (far > 1.92) continue
      const tile = rbox(T - 0.035, 0.03, T - 0.035, 0.012, TILES[Math.floor(rand() * 3)], { roughness: 0.7 })
      tile.position.set(cx, FY + 0.012, cz)
      base.add(tile)
    }
  }

  // guarda-corpo de madeira em arco atrás
  const railArc = Math.PI * 0.62
  const railTop = meshOf(new THREE.TorusGeometry(1.82, 0.04, 10, 48, railArc), RAIL, { roughness: 0.6 })
  railTop.rotation.x = Math.PI / 2
  railTop.rotation.z = Math.PI + (Math.PI - railArc) / 2
  railTop.position.y = FY + 0.78
  base.add(railTop)
  const railLow = meshOf(new THREE.TorusGeometry(1.82, 0.025, 8, 48, railArc), RAIL, { roughness: 0.6 })
  railLow.rotation.copy(railTop.rotation)
  railLow.position.y = FY + 0.18
  base.add(railLow)
  for (let k = 0; k <= 9; k++) {
    const a = Math.PI + (Math.PI - railArc) / 2 + (railArc * k) / 9
    const post = rbox(0.06, 0.78, 0.06, 0.02, RAIL, { roughness: 0.6 })
    post.position.set(Math.cos(a) * 1.82, FY + 0.39, Math.sin(a) * 1.82)
    post.rotation.y = -a
    base.add(post)
  }

  // vasinho de planta no canto da varanda
  const vaso = lathe(
    [[0, 0], [0.15, 0], [0.18, 0.05], [0.2, 0.26], [0.23, 0.3], [0.2, 0.31], [0.17, 0.27], [0, 0.26]],
    '#a3593c',
    { roughness: 0.75 },
  )
  vaso.position.set(1.35, FY, -0.95)
  base.add(vaso)
  const folhas = puff(0.26, '#5a8a4a', 6, 12, { roughness: 0.85 })
  folhas.position.set(1.35, FY + 0.5, -0.95)
  base.add(folhas)
  root.add(base)

  // ---- haste de ferro com gancho -----------------------------------------
  const haste = new THREE.Group()
  const PX = -1.05
  const pe = lathe(
    [[0, 0], [0.32, 0], [0.33, 0.035], [0.27, 0.07], [0.09, 0.1], [0.06, 0.15], [0, 0.15]],
    IRON,
    { roughness: 0.4, metalness: 0.6 },
  )
  pe.position.set(PX, FY, -0.05)
  haste.add(pe)
  const TOP = 3.0
  const poste = cylinder(0.036, 0.04, TOP - FY - 0.1, IRON, { roughness: 0.4, metalness: 0.6 })
  poste.position.set(PX, (TOP + FY + 0.1) / 2, -0.05)
  haste.add(poste)
  const curva = meshOf(new THREE.TorusGeometry(0.25, 0.036, 10, 24, Math.PI / 2), IRON, { roughness: 0.4, metalness: 0.6 })
  curva.position.set(PX + 0.25, TOP, -0.05)
  curva.rotation.z = Math.PI / 2
  haste.add(curva)
  const ARM_Y = TOP + 0.25
  const braco = cylinder(0.036, 0.036, -PX - 0.25, IRON, { roughness: 0.4, metalness: 0.6 })
  braco.rotation.z = Math.PI / 2
  braco.position.set((PX + 0.25) / 2, ARM_Y, -0.05)
  haste.add(braco)
  const ponta = sphere(0.055, IRON, { roughness: 0.4, metalness: 0.6 })
  ponta.position.set(0.02, ARM_Y, -0.05)
  haste.add(ponta)
  const gancho = meshOf(new THREE.TorusGeometry(0.07, 0.022, 8, 20, Math.PI * 1.5), IRON, { roughness: 0.4, metalness: 0.6 })
  gancho.position.set(0, ARM_Y - 0.1, -0.05)
  gancho.rotation.z = Math.PI * 0.5
  haste.add(gancho)
  // voluta decorativa no canto
  const voluta = meshOf(new THREE.TorusGeometry(0.09, 0.02, 8, 20, Math.PI * 1.6), IRON, { roughness: 0.4, metalness: 0.6 })
  voluta.position.set(PX + 0.2, TOP - 0.05, -0.05)
  haste.add(voluta)
  root.add(haste)

  // ---- gaiola redonda de varetas de cana ---------------------------------
  const gaiola = new THREE.Group()
  const CB = 0.95 // fundo da gaiola
  const CR = 0.6
  const bandeja = lathe(
    [[0, 0], [0.5, 0], [0.62, 0.03], [0.65, 0.13], [0.6, 0.14], [0.58, 0.06], [0, 0.06]],
    CANE_NODE,
    { roughness: 0.55 },
  )
  bandeja.position.y = CB
  gaiola.add(bandeja)
  const pingente = lathe(
    [[0, -0.16], [0.04, -0.14], [0.07, -0.07], [0.05, -0.02], [0.08, 0], [0, 0]],
    CANE_NODE,
    { roughness: 0.55 },
  )
  pingente.position.y = CB
  gaiola.add(pingente)
  const N = 18
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2
    const x = Math.sin(a) * CR
    const z = Math.cos(a) * CR
    const vareta = cylinder(0.02, 0.02, 1.3, CANE, { roughness: 0.5 })
    vareta.position.set(x, CB + 0.1 + 0.65, z)
    gaiola.add(vareta)
    for (const ny of [0.32, 0.62]) {
      const no = cylinder(0.028, 0.028, 0.026, CANE_NODE, { roughness: 0.55 })
      no.position.set(x, CB + ny, z)
      gaiola.add(no)
    }
  }
  for (const hy of [0.13, 0.48]) {
    const aro = torus(CR, 0.022, CANE, { roughness: 0.5 })
    aro.rotation.x = Math.PI / 2
    aro.position.y = CB + hy
    gaiola.add(aro)
  }
  // poleiro e comedouro visíveis por baixo da meia
  const poleiro = cylinder(0.018, 0.018, 1.1, CANE_NODE, { roughness: 0.55 })
  poleiro.rotation.z = Math.PI / 2
  poleiro.position.y = CB + 0.36
  gaiola.add(poleiro)
  const comedouro = lathe([[0, 0], [0.1, 0], [0.12, 0.07], [0.1, 0.07], [0, 0.02]], WHITE, { roughness: 0.35 })
  comedouro.position.set(0.25, CB + 0.06, 0.2)
  gaiola.add(comedouro)
  const sementes = puff(0.06, '#c9a25a', 4, 3, { roughness: 0.9 })
  sementes.scale.y = 0.4
  sementes.position.set(0.25, CB + 0.11, 0.2)
  gaiola.add(sementes)
  // argola do topo, no gancho
  const argola = torus(0.06, 0.016, CANE_NODE, { roughness: 0.5 })
  argola.position.set(0, ARM_Y - 0.2, -0.05)
  gaiola.add(argola)
  root.add(gaiola)

  // ---- gomos de cana caídos no chão --------------------------------------
  const canas = new THREE.Group()
  for (const [len, x, z, ry] of [
    [0.62, -0.55, 0.95, 0.35],
    [0.46, 0.55, 1.1, -0.55],
    [0.36, 0.0, 1.38, 1.25],
  ] as const) {
    const c = caneStick(len, 0.052)
    c.position.set(x, FY + 0.052, z)
    c.rotation.y = ry
    canas.add(c)
  }
  root.add(canas)

  // ---- MEIA gigante listrada enfiada sobre a gaiola ----------------------
  const meia = new THREE.Group()
  meia.position.set(0, MY, 0)
  root.add(meia)
  const m = new THREE.Group()
  m.position.y = -MY
  meia.add(m)

  const CUFF_B = 1.42
  const CUFF_T = 1.68
  const LEG_T = 2.56
  const punho = cylinder(LEG_R + 0.025, LEG_R + 0.035, CUFF_T - CUFF_B, CUFF, { roughness: 0.92 }, 48)
  punho.position.y = (CUFF_B + CUFF_T) / 2
  m.add(punho)
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2
    const rib = capsule(0.022, CUFF_T - CUFF_B - 0.05, WHITE, { roughness: 0.92 })
    rib.position.set(Math.sin(a) * (LEG_R + 0.04), (CUFF_B + CUFF_T) / 2, Math.cos(a) * (LEG_R + 0.04))
    m.add(rib)
  }
  // listras do cano
  const nStripes = 5
  const sh = (LEG_T - CUFF_T) / nStripes
  for (let k = 0; k < nStripes; k++) {
    const band = cylinder(LEG_R, LEG_R, sh + 0.002, k % 2 === 0 ? RED : WHITE, { roughness: 0.9 }, 48)
    band.position.y = CUFF_T + sh * (k + 0.5)
    m.add(band)
  }
  // topo abaulado em faixas
  const domo = new THREE.Group()
  domo.position.y = LEG_T
  domo.scale.y = 0.62
  m.add(domo)
  const cuts = [0, 0.42, 0.82, 1.2, Math.PI / 2]
  for (let k = 0; k < cuts.length - 1; k++) {
    const geo = new THREE.SphereGeometry(LEG_R, 48, 8, 0, Math.PI * 2, cuts[k], cuts[k + 1] - cuts[k])
    domo.add(meshOf(geo, k % 2 === 0 ? WHITE : RED, { roughness: 0.9 }))
  }
  // calcanhar branco no canto de cima, do lado oposto ao pé
  const calcanhar = sphere(0.46, WHITE, { roughness: 0.9 })
  calcanhar.scale.set(1, 0.72, 0.95)
  calcanhar.position.set(-0.3, 2.78, -0.08)
  m.add(calcanhar)

  // pé da meia: tubo listrado que tomba para a direita, afinando até a ponta
  const A = new THREE.Vector3(0.3, 2.66, 0.06)
  const B = new THREE.Vector3(1.08, 2.36, 0.34)
  const dir = B.clone().sub(A)
  const L = dir.length()
  dir.normalize()
  const pePeca = new THREE.Group()
  pePeca.position.copy(A)
  pePeca.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  m.add(pePeca)
  const nFoot = 5
  for (let k = 0; k < nFoot; k++) {
    const t0 = k / nFoot
    const t1 = (k + 1) / nFoot
    const r0 = 0.46 - 0.12 * t0
    const r1 = 0.46 - 0.12 * t1
    const seg = cylinder(r1, r0, L / nFoot + 0.002, k % 2 === 0 ? RED : WHITE, { roughness: 0.9 }, 40)
    seg.position.y = L * (t0 + t1) / 2
    pePeca.add(seg)
  }
  // ponta branca furada (abertura virada para fora)
  const TOE_R = 0.34
  const HOLE_A = 0.62
  const ponteira = meshOf(
    new THREE.SphereGeometry(TOE_R, 40, 16, 0, Math.PI * 2, HOLE_A, Math.PI / 2 - HOLE_A + 0.001),
    WHITE,
    { roughness: 0.9 },
  )
  ponteira.material.side = THREE.DoubleSide
  ponteira.position.y = L
  pePeca.add(ponteira)
  const holeR = TOE_R * Math.sin(HOLE_A)
  const holeY = L + TOE_R * Math.cos(HOLE_A)
  const fundoFuro = cylinder(holeR * 0.98, holeR * 0.98, 0.01, HOLE, { roughness: 0.95 })
  fundoFuro.position.y = holeY - 0.06
  pePeca.add(fundoFuro)
  const borda = torus(holeR, 0.035, WHITE, { roughness: 0.95 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = holeY
  pePeca.add(borda)
  // fiapos de lã ao redor do furo
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2 + rand() * 0.3
    const fiapo = capsule(0.012, 0.07 + rand() * 0.05, k % 3 === 0 ? RED : WHITE, { roughness: 0.95 })
    fiapo.position.set(Math.cos(a) * (holeR + 0.03), holeY + 0.03, Math.sin(a) * (holeR + 0.03))
    fiapo.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9)
    pePeca.add(fiapo)
  }
  const holeWorld = new THREE.Vector3(0, holeY, 0).applyQuaternion(pePeca.quaternion).add(A)

  // segundo furo, na frente-esquerda do cano: por onde sai a asinha
  const WING_A = -0.28 // ângulo em torno do eixo y (0 = de frente)
  const WING_Y = 2.08
  const wn = new THREE.Vector3(Math.sin(WING_A), 0, Math.cos(WING_A))
  const furo2 = new THREE.Group()
  furo2.position.set(wn.x * LEG_R, WING_Y, wn.z * LEG_R)
  furo2.rotation.y = WING_A
  m.add(furo2)
  const escuro2 = cylinder(0.15, 0.15, 0.02, HOLE, { roughness: 0.95 })
  escuro2.rotation.x = Math.PI / 2
  escuro2.position.z = 0.005
  furo2.add(escuro2)
  const borda2 = torus(0.15, 0.03, RED, { roughness: 0.95 })
  borda2.position.z = 0.015
  furo2.add(borda2)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + rand() * 0.4
    const fiapo = capsule(0.01, 0.06, k % 2 ? RED : WHITE, { roughness: 0.95 })
    fiapo.position.set(Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0.02)
    fiapo.rotation.z = a - Math.PI / 2
    furo2.add(fiapo)
  }

  // ---- CANÁRIO: cabeça saindo pelo furo da ponta -------------------------
  const canario = new THREE.Group()
  canario.position.copy(holeWorld)
  root.add(canario)
  // pescoço vindo de dentro do furo
  const pescoco = capsule(0.17, 0.3, YELLOW, { roughness: 0.75 })
  pescoco.position.set(0.06, 0.14, 0.06)
  pescoco.rotation.z = -0.35
  canario.add(pescoco)

  const cabeca = new THREE.Group()
  cabeca.position.set(0.12, 0.4, 0.16)
  cabeca.rotation.set(-0.3, 0.3, 0)
  cabeca.scale.setScalar(1.3)
  canario.add(cabeca)
  const cranio = sphere(0.27, YELLOW, { roughness: 0.75 })
  cranio.scale.set(1, 0.98, 1.02)
  cabeca.add(cranio)
  const bochecha = sphere(0.2, YELLOW, { roughness: 0.75 })
  bochecha.scale.set(1.1, 0.8, 0.9)
  bochecha.position.set(0, -0.11, 0.08)
  cabeca.add(bochecha)
  // topete
  for (const [tx, tl, tr] of [[-0.05, 0.12, 0.35], [0.02, 0.15, 0], [0.08, 0.11, -0.35]] as const) {
    const pena = capsule(0.04, tl, YELLOW_DARK, { roughness: 0.75 })
    pena.position.set(tx, 0.3, -0.02)
    pena.rotation.set(-0.5, 0, tr)
    cabeca.add(pena)
  }
  // olhos arregalados
  for (const side of [-1, 1]) {
    const esclera = sphere(0.085, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.13, 0.07, 0.21)
    esclera.scale.z = 0.7
    cabeca.add(esclera)
    const pupila = sphere(0.042, '#141414', { roughness: 0.2 })
    pupila.position.set(side * 0.13, 0.075, 0.272)
    cabeca.add(pupila)
    const brilho = sphere(0.013, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.13 + 0.015, 0.095, 0.305)
    cabeca.add(brilho)
  }
  // bico de cima (fixo) e interior da boca
  const bicoCima = cone(0.1, 0.24, ORANGE, { roughness: 0.4 })
  bicoCima.scale.set(1, 1, 0.75)
  bicoCima.position.set(0, -0.03, 0.34)
  bicoCima.rotation.x = Math.PI / 2 - 0.45
  cabeca.add(bicoCima)
  const boca = sphere(0.085, '#7a2a2a', { roughness: 0.5 })
  boca.scale.set(1, 0.9, 0.6)
  boca.position.set(0, -0.1, 0.26)
  cabeca.add(boca)

  // bico de baixo (peça): dobradiça no canto da boca
  const bico = new THREE.Group()
  bico.position.set(0, -0.08, 0.24)
  bico.rotation.x = 0.8
  cabeca.add(bico)
  const bicoBaixo = cone(0.085, 0.2, ORANGE, { roughness: 0.4 })
  bicoBaixo.scale.set(1, 1, 0.6)
  bicoBaixo.rotation.x = Math.PI / 2
  bicoBaixo.position.set(0, 0, 0.1)
  bico.add(bicoBaixo)
  const lingua = sphere(0.04, '#e2828a', { roughness: 0.4 })
  lingua.scale.set(1, 0.5, 1.3)
  lingua.position.set(0, 0.02, 0.06)
  bico.add(lingua)

  // ---- asinha amarela acenando pelo furo lateral -------------------------
  const asa = new THREE.Group()
  asa.position.set(wn.x * (LEG_R + 0.03), WING_Y, wn.z * (LEG_R + 0.03))
  asa.rotation.set(0, WING_A, 0.15)
  root.add(asa)
  const raiz = sphere(0.12, YELLOW, { roughness: 0.75 })
  raiz.scale.z = 0.7
  asa.add(raiz)
  const feathers: [number, number][] = [[1.55, 0.36], [1.9, 0.4], [2.25, 0.36], [2.6, 0.3]]
  feathers.forEach(([ang, len], k) => {
    const pena = capsule(0.06, len, k % 2 === 0 ? YELLOW : YELLOW_DARK, { roughness: 0.75 })
    pena.scale.z = 0.55
    pena.position.set(Math.cos(ang) * (len / 2 + 0.06), Math.sin(ang) * (len / 2 + 0.06), 0.03)
    pena.rotation.z = ang - Math.PI / 2
    asa.add(pena)
  })

  // ---- três notas azuis subindo em zigue-zague ---------------------------
  const notaPos: [number, number, number][] = [
    [holeWorld.x + 0.66, holeWorld.y + 0.2, holeWorld.z + 0.35],
    [holeWorld.x + 1.2, holeWorld.y + 0.56, holeWorld.z + 0.45],
    [holeWorld.x + 0.72, holeWorld.y + 1.0, holeWorld.z + 0.3],
  ]
  const notas = notaPos.map(([x, y, z], k) => {
    const n = note()
    n.position.set(x, y, z)
    n.scale.setScalar(1.15)
    n.rotation.set(0, ROOT_Y_INV, k % 2 === 0 ? -0.18 : 0.15)
    root.add(n)
    return n
  })

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'varanda', object: base },
    { name: 'haste', group: 'varanda', object: haste },
    { name: 'gaiola', group: 'cana', object: gaiola },
    { name: 'canas', group: 'cana', object: canas },
    { name: 'meia', group: 'meia', object: meia },
    { name: 'canario', group: 'canario', object: canario },
    { name: 'bico', group: 'canario', object: bico },
    { name: 'nota1', group: 'iodel', object: notas[0] },
    { name: 'nota2', group: 'iodel', object: notas[1] },
    { name: 'nota3', group: 'iodel', object: notas[2] },
    { name: 'asa', group: 'asa', object: asa },
  ]

  const hp = holeWorld
  const out = new THREE.Vector3(0.12, 0.4, 0.16).normalize()
  const notaSeqs = notas.flatMap((n, k) => {
    const at = 8.55 + k * 0.42
    return [
      seq(`nota${k + 1}-sobe`, `nota${k + 1}`, at, 0.6, [
        ch('position.x', hp.x + 0.45, n.position.x),
        ch('position.y', hp.y + 0.45, n.position.y),
        ch('scale.x', 0.2, 1.15),
        ch('scale.y', 0.2, 1.15),
        ch('scale.z', 0.2, 1.15),
      ], { ease: 'easeOut' }),
    ]
  })

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma varanda de lajotas sobe do chão, com uma haste de ferro em forma de gancho.',
    }),
    seq('haste-rise', 'haste', 0.5, 0.9, [riseFrom(0, 3.4)], { ease: 'easeOut' }),

    seq('gaiola-desce', 'gaiola', 1.9, 0.8, [ch('position.y', 1.6, 0)], {
      ease: 'easeOut',
      caption: 'No gancho, uma gaiola de varetas de CANA — o canário está EM CANA, preso.',
    }),
    seq('canas-rise', 'canas', 2.3, 0.6, [riseFrom(0, 0.5)], { ease: 'easeOut' }),

    seq('meia-cobre', 'meia', 4.0, 0.9, [
      ch('position.y', MY + 1.8, MY),
      ch('scale.x', 0.85, 1),
      ch('scale.z', 0.85, 1),
    ], {
      ease: 'easeOut',
      caption: 'Alguém cobre a gaiola pra noite com uma MEIA gigante de lã listrada, enfiada como capuz.',
    }),
    seq('meia-zumbe', 'meia', 5.6, 0.7, [
      ch('scale.x', 1.07, 1),
      ch('scale.z', 1.07, 1),
      ch('scale.y', 0.95, 1),
    ], {
      ease: 'easeOut',
      caption: 'Lá dentro, de bico fechado, o canário chama: VÉMMM! — um zumbido que ninguém escuta.',
    }),

    seq('canario-sai', 'canario', 7.0, 0.6, [
      ch('position.x', hp.x - out.x * 0.35, hp.x),
      ch('position.y', hp.y - out.y * 0.35, hp.y),
      ch('position.z', hp.z - out.z * 0.35, hp.z),
      ch('scale.x', 0.4, 1),
      ch('scale.y', 0.4, 1),
      ch('scale.z', 0.4, 1),
    ], {
      ease: 'easeOut',
      caption: 'Então ele enfia a cabeça pelo FURO na ponta da meia…',
    }),
    seq('bico-fechado', 'bico', 7.0, 0.6, [ch('rotation.x', 0.02, 0.02)]),
    seq('bico-abre', 'bico', 8.2, 0.35, [ch('rotation.x', 0.02, 0.8)], {
      ease: 'easeOut',
      caption: '…e solta o iodel da montanha: IÉL-PA… M\'ÊI! — a MEIA sem o -A, que o furo comeu.',
    }),
    ...notaSeqs,

    seq('asa-sai', 'asa', 10.1, 0.5, [
      ch('scale.x', 0.1, 1),
      ch('scale.y', 0.1, 1),
      ch('scale.z', 0.1, 1),
      ch('rotation.z', -0.6, 0.15),
    ], {
      ease: 'easeOut',
      caption: 'Uma asinha acena pelo outro furo: quem é que vai ajudar esse coitado?',
    }),
    seq('asa-acena', 'asa', 10.75, 0.45, [ch('rotation.z', 0.6, 0.15)], { ease: 'easeInOut' }),
    seq('asa-acena2', 'asa', 11.3, 0.45, [ch('rotation.z', -0.3, 0.15)], {
      ease: 'easeInOut',
      caption: 'Vem kan hjälpa mig? — Quem pode me ajudar?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.55, 2.6, 7.6], target: [0.4, 1.75, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'vem-kan-hjalpa-mig',
    contexto:
      "Balcão e recepção: quando você chega numa recepção, num corredor de hospital ou numa loja grande (Clas Ohlson, Ikea, Bauhaus) e não sabe a quem se dirigir. No trabalho, no primeiro dia, ou no telefone com a central: 'Vem kan hjälpa mig med det här?'",
    fraseFonte: 'Quem pode me ajudar?',
    fraseAlvo: 'Vem kan hjälpa mig?',
    pronuncia:
      "VÉM kan IÉL-pa mêi? ('vem' com É aberto e curto e um M de verdade, lábios fechados — nunca o 'vẽi' nasal de 'ele vem'; 'kan' rapidinho e sem força, colado no 'vem': VÉM-kan; 'hjälpa' com o hj = I de IOGA, nunca RR, É aberto, L de verdade com a língua no céu da boca, força no IÉL e o -pa fraquinho; 'mig' = mêi, uma sílaba só)",
    ponteSonora:
      "VÉMMM! CAN(a)... IÉL-PA... M'ÊI! (5 sílabas: VÉM-kan-IÉL-pa-mêi; força no VÉM e, maior, no IÉL; VÉMMM = o 'VEM!' de chamar — o MESMO VÉM do ventríloquo de 'Hallå, vem pratar jag med?' e do chacal de 'Vem är ansvarig?' —, só que o canário não tem lábios: FECHA O BICO no fim e o M fica zumbindo lá dentro; É ABERTO de 'pé', curto, e um M de verdade — o 'vem!' brasileiro solto sai 'vẽi', nasal e sem M, e o sueco não reconhece 'quem'; CAN(a) = a CANA de 'Kan jag få en påse?' — a gaiola é de CANA, e ele está EM CANA, preso —, cortada no N: C + A + N, A aberto e N de língua, sem nasalar e sem força, colado no VÉM: VÉM-kan; IÉL-PA M'ÊI = o MESMO pedido de socorro do iodelador de 'Kan du hjälpa mig?' e do troll de 'Kan du hjälpa mig att bära?': o iodel da montanha, IÉL com I de IOGA — o h de 'hjälp' não soa, e com RR carioca vira outra coisa —, É aberto, L DE VERDADE com a língua no céu da boca (nunca 'iéu'), a força maior da frase; o -PA fraquinho, engolido; M'ÊI = a MEIA sem o -A — a ponta furada da meia comeu o fim —, uma sílaba só, nunca 'mêia')",
    historia:
      'Alguém cobriu a gaiola do canário pra noite — com uma MEIA gigante de lã listrada, enfiada por cima como capuz. Lá dentro, preso EM CANA numa gaiola de varetas de cana-de-açúcar, o canário chama de bico fechado: VÉMMM!, um zumbido que ninguém escuta. Então ele enfia a cabeça pelo furo na ponta da meia e solta o iodel da montanha a plenos pulmões: IÉL-PA... M\'ÊI!, e a meia furada balança inteira. Quem é que vai ajudar esse coitado?',
  },
  createScene,
  refine: { organic: ['canario', 'asa'] },
}

export default card
