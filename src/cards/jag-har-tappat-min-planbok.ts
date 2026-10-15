import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag har tappat min plånbok." — IÁ, RRÁR! TÁPA-T... MIN PLÔN-BUUK!
 *
 * Sábado cedo, corredor do prédio: a hiena do terceiro andar, de roupão azul
 * e pantufa cor-de-rosa, empurra o saco de lixo pela portinhola do duto (IÁ!),
 * gargalha (RRÁR!), TAPA os bolsos — virados do avesso, vazios — e lá de
 * dentro do duto sobe o eco: PLÔN... BUUK, a carteira caindo aberta feito um
 * livrinho (BOOK).
 *
 * Diorama: piso de linóleo verde-musgo, parede bege com barra mais escura,
 * porta do vizinho à esquerda, portinhola inox do duto à direita com a caçamba
 * aberta, o saco preto entalado e a carteira (acento conhaque) despencando no
 * escuro, cercada pelos anéis do eco.
 */

const SLAB = '#3b3832'
const LINO = '#6c7c4a'
const LINO_SEAM = '#5a6a3c'
const WALL = '#e6d8b9'
const WALL_LOW = '#c9b48b'
const WALL_TRIM = '#7a6650'
const DOOR = '#8a5a38'
const DOOR_DARK = '#6a4329'
const BRASS = '#c9a250'
const STEEL = '#c3cad0'
const STEEL_DARK = '#8f989f'
const HOLE = '#141619'
const BAG = '#2a2d33'
const FUR = '#cba66a'
const FUR_DARK = '#5b4128'
const MANE = '#3e2d1f'
const MUZZLE = '#6e5338'
const MUZZLE_LIGHT = '#8a6a48'
const NOSE = '#1d1a18'
const ROBE = '#93bde3'
const ROBE_TRIM = '#6f9fd0'
const LINING = '#f6f2ea'
const PINK = '#f0a7c2'
const PINK_DARK = '#d9849f'
const COGNAC = '#c4561a' // acento saturado RESERVADO: a carteira (plånbok)
const COGNAC_DARK = '#8e3b10'
const STITCH = '#eaa868'
const RING = '#d3dae0'

const FY = 0.16 // topo do linóleo
const WZ = -1.2 // face da parede
const SD = 1.6 // profundidade da laje (da parede até a borda da frente)
const SZ = WZ - 0.2 + SD / 2
const HX = -0.28 // hiena
const HZ = -0.38
const HYAW = 0.3
const DX = 0.86 // portinhola do duto
const OW = 0.8 // vão
const OH = 0.64
const HB = FY + 0.62 // dobradiça (base do vão)
const DOOR_OPEN = 0.9
const HEAD_X = -0.16 // cabeça jogada para trás na gargalhada (pose final)
const WALLET: [number, number, number] = [DX - 0.13, HB + 0.5, WZ + 0.13]
const WALLET_ROT = Math.PI + 0.3 // de ponta-cabeça, inclinada
const SACO: [number, number, number] = [DX + 0.14, HB + 0.27, WZ + 0.07]
// saco pendurado nas patas quando a hiena chega (mundo)
const SACO_MAO: [number, number, number] = [
  HX + 0.5 * Math.sin(HYAW), FY + 0.88, HZ + 0.5 * Math.cos(HYAW),
]

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula esticada entre dois pontos (membros, golas, faixas). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts: MatOpts = {}) {
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const m = capsule(r, Math.max(0.001, len), color, { roughness: 0.85, ...opts })
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(v(0, 1, 0), d.normalize())
  return m
}

/** Mancha achatada pousada numa superfície, virada para `dir`. */
function spot(p: THREE.Vector3, dir: THREE.Vector3, r: number, color = FUR_DARK) {
  const s = sphere(r, color, { roughness: 0.9 }, 16)
  s.scale.set(1, 0.8, 0.32)
  s.position.copy(p)
  s.quaternion.setFromUnitVectors(v(0, 0, 1), dir.clone().normalize())
  return s
}

// perfil do roupão (raio, altura) — torneado e achatado em z
const ROBE_PROFILE: [number, number][] = [
  [0.3, 0.5], [0.355, 0.51], [0.36, 0.56], [0.345, 0.68], [0.315, 0.8], [0.3, 0.86],
  [0.315, 0.95], [0.335, 1.05], [0.33, 1.13], [0.3, 1.2], [0.24, 1.27], [0.16, 1.32],
  [0.12, 1.34], [0.1, 1.33],
]
const ROBE_Z = 0.85

function robeR(y: number) {
  const pts = ROBE_PROFILE.slice(1, 12)
  if (y <= pts[0][1]) return pts[0][0]
  for (let i = 1; i < pts.length; i++) {
    const [r1, y1] = pts[i]
    const [r0, y0] = pts[i - 1]
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0)
  }
  return pts[pts.length - 1][0]
}

/** Ponto na superfície do roupão (frente), com folga `off` para fora. */
function onRobe(x: number, y: number, off = 0) {
  const r = robeR(y) + off
  return v(x, y, ROBE_Z * Math.sqrt(Math.max(0.0004, r * r - x * x)))
}

/** Faixa de tecido que segue a superfície do roupão de a até b. */
function robeBand(group: THREE.Group, a: [number, number], b: [number, number], r: number, color: string, n = 6) {
  let prev = onRobe(a[0], a[1], 0.01)
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const cur = onRobe(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0.01)
    group.add(limb(prev, cur, r, color, { roughness: 0.92 }))
    prev = cur
  }
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- corredor: laje, linóleo, parede, porta do vizinho -------------------
  const base = new THREE.Group()

  const slab = rbox(4.1, 0.12, SD, 0.05, SLAB, { roughness: 0.9 })
  slab.position.set(0, 0.06, SZ)
  base.add(slab)

  const lino = rbox(4.0, 0.045, SD - 0.08, 0.02, LINO, { roughness: 0.5 })
  lino.position.set(0, FY - 0.0225, SZ)
  base.add(lino)

  // juntas das placas de linóleo
  for (let i = -3; i <= 3; i++) {
    const seam = rbox(0.018, 0.006, SD - 0.14, 0.003, LINO_SEAM, { roughness: 0.6 })
    seam.position.set(i * 0.58, FY + 0.002, SZ)
    base.add(seam)
  }
  for (const z of [-0.62, 0.0]) {
    const seam = rbox(3.94, 0.006, 0.018, 0.003, LINO_SEAM, { roughness: 0.6 })
    seam.position.set(0, FY + 0.002, z)
    base.add(seam)
  }

  // parede: barra escura embaixo, bege em cima, rodapé e friso
  const WH = 2.35
  const wallUp = rbox(4.1, WH - 0.95, 0.2, 0.03, WALL, { roughness: 0.85 })
  wallUp.position.set(0, FY + 0.95 + (WH - 0.95) / 2, WZ - 0.1)
  base.add(wallUp)
  const wallLow = rbox(4.1, 0.95, 0.2, 0.03, WALL_LOW, { roughness: 0.85 })
  wallLow.position.set(0, FY + 0.475, WZ - 0.1)
  base.add(wallLow)
  const rail = rbox(4.12, 0.05, 0.05, 0.02, WALL_TRIM, { roughness: 0.6 })
  rail.position.set(0, FY + 0.95, WZ + 0.02)
  base.add(rail)
  const skirting = rbox(4.12, 0.1, 0.05, 0.02, WALL_TRIM, { roughness: 0.6 })
  skirting.position.set(0, FY + 0.05, WZ + 0.02)
  base.add(skirting)
  const cap = rbox(4.16, 0.06, 0.26, 0.025, WALL_TRIM, { roughness: 0.6 })
  cap.position.set(0, FY + WH + 0.03, WZ - 0.1)
  base.add(cap)

  // porta do vizinho (madeira, olho mágico, fenda de correio, plaquinha)
  const door = new THREE.Group()
  door.position.set(-1.45, FY, WZ)
  base.add(door)
  const jamb = rbox(0.98, 2.06, 0.06, 0.02, DOOR_DARK, { roughness: 0.7 })
  jamb.position.set(0, 1.03, 0.03)
  door.add(jamb)
  const leaf = rbox(0.84, 1.96, 0.06, 0.02, DOOR, { roughness: 0.65 })
  leaf.position.set(0, 0.98, 0.07)
  door.add(leaf)
  for (const [py, ph] of [[1.42, 0.7], [0.55, 0.7]] as const) {
    const panel = rbox(0.6, ph, 0.02, 0.015, DOOR_DARK, { roughness: 0.7 })
    panel.position.set(0, py, 0.105)
    door.add(panel)
    const inner = rbox(0.54, ph - 0.06, 0.02, 0.015, DOOR, { roughness: 0.65 })
    inner.position.set(0, py, 0.115)
    door.add(inner)
  }
  const knob = sphere(0.045, BRASS, { roughness: 0.3, metalness: 0.8 })
  knob.position.set(0.32, 1.0, 0.13)
  door.add(knob)
  const slot = rbox(0.3, 0.06, 0.02, 0.01, BRASS, { roughness: 0.3, metalness: 0.8 })
  slot.position.set(0, 1.0, 0.115)
  door.add(slot)
  const peep = cylinder(0.02, 0.02, 0.02, BRASS, { roughness: 0.3, metalness: 0.8 })
  peep.rotation.x = Math.PI / 2
  peep.position.set(0, 1.6, 0.12)
  door.add(peep)
  const nameplate = rbox(0.2, 0.06, 0.015, 0.008, '#f1ead8', { roughness: 0.4 })
  nameplate.position.set(0, 1.78, 0.11)
  door.add(nameplate)

  const mat1 = rbox(0.78, 0.025, 0.46, 0.012, '#7d5f40', { roughness: 0.95 })
  mat1.position.set(-1.45, FY + 0.0125, WZ + 0.36)
  base.add(mat1)
  const matIn = rbox(0.66, 0.012, 0.34, 0.01, '#9a7a52', { roughness: 0.95 })
  matIn.position.set(-1.45, FY + 0.027, WZ + 0.36)
  base.add(matIn)

  // papel amassado que escapou do saco
  const paper = puff(0.055, '#ebe5d6', 5, 13, { roughness: 0.9 })
  paper.position.set(DX + 0.42, FY + 0.05, WZ + 0.62)
  paper.rotation.y = rand() * Math.PI
  base.add(paper)

  // pilha de jornais amarrada, esperando a reciclagem
  const jornais = new THREE.Group()
  jornais.position.set(DX + 0.68, FY, WZ + 0.3)
  jornais.rotation.y = -0.25
  base.add(jornais)
  for (let i = 0; i < 4; i++) {
    const sheet = rbox(0.4, 0.045, 0.29, 0.012, i % 2 ? '#d9d2c1' : '#e6e0d1', { roughness: 0.9 })
    sheet.position.set((rand() - 0.5) * 0.03, 0.0225 + i * 0.045, (rand() - 0.5) * 0.03)
    sheet.rotation.y = (rand() - 0.5) * 0.12
    jornais.add(sheet)
  }
  for (const tx of [-0.1, 0.1]) {
    const twine = rbox(0.018, 0.19, 0.31, 0.008, '#a8875a', { roughness: 0.95 })
    twine.position.set(tx, 0.09, 0)
    jornais.add(twine)
  }
  const bow = torus(0.03, 0.008, '#a8875a', { roughness: 0.95 })
  bow.rotation.x = Math.PI / 2
  bow.position.set(0.1, 0.188, 0.04)
  jornais.add(bow)

  root.add(base)

  // ---- portinhola inox do duto de lixo -------------------------------------
  const duto = new THREE.Group()
  duto.position.set(DX, HB + OH / 2, WZ)
  root.add(duto)

  const plate = rbox(OW + 0.3, OH + 0.42, 0.03, 0.03, STEEL, { roughness: 0.35, metalness: 0.7 })
  plate.position.set(0, 0.02, 0.015)
  duto.add(plate)
  const hole = rbox(OW, OH, 0.02, 0.02, HOLE, { roughness: 0.9 })
  hole.position.set(0, 0, 0.035)
  duto.add(hole)
  // aro saliente em volta do vão
  for (const [w, h, x, y] of [
    [OW + 0.1, 0.05, 0, OH / 2 + 0.025],
    [OW + 0.1, 0.05, 0, -OH / 2 - 0.025],
    [0.05, OH, OW / 2 + 0.025, 0],
    [0.05, OH, -OW / 2 - 0.025, 0],
  ] as const) {
    const rim = rbox(w, h, 0.05, 0.018, STEEL_DARK, { roughness: 0.3, metalness: 0.75 })
    rim.position.set(x, y, 0.05)
    duto.add(rim)
  }
  // plaquinha com o pictograma da lixeira
  const sign = new THREE.Group()
  sign.position.set(0, OH / 2 + 0.15, 0.04)
  duto.add(sign)
  const signPlate = rbox(0.2, 0.15, 0.015, 0.02, '#3d4a44', { roughness: 0.5 })
  sign.add(signPlate)
  const binBody = rbox(0.065, 0.075, 0.012, 0.008, '#eee6d2', { roughness: 0.5 })
  binBody.position.set(0, -0.022, 0.01)
  sign.add(binBody)
  const binLid = rbox(0.095, 0.016, 0.012, 0.005, '#eee6d2', { roughness: 0.5 })
  binLid.position.set(0, 0.026, 0.01)
  sign.add(binLid)
  const binHandle = rbox(0.03, 0.012, 0.012, 0.004, '#eee6d2', { roughness: 0.5 })
  binHandle.position.set(0, 0.042, 0.01)
  sign.add(binHandle)
  for (const gx of [-0.016, 0.016]) {
    const groove = rbox(0.008, 0.05, 0.012, 0.003, '#3d4a44', { roughness: 0.5 })
    groove.position.set(gx, -0.022, 0.014)
    sign.add(groove)
  }

  // ---- caçamba basculante (dobradiça embaixo, abre para fora) --------------
  const portinhola = new THREE.Group()
  portinhola.position.set(0, -OH / 2, 0.05)
  portinhola.rotation.x = DOOR_OPEN
  duto.add(portinhola)

  const DH = OH - 0.06
  const flap = rbox(OW - 0.04, DH, 0.03, 0.02, STEEL, { roughness: 0.4, metalness: 0.35 })
  flap.position.set(0, DH / 2, 0.015)
  portinhola.add(flap)
  // puxador na face de fora, perto da borda
  const grip = cylinder(0.018, 0.018, 0.36, STEEL_DARK, { roughness: 0.25, metalness: 0.8 })
  grip.rotation.z = Math.PI / 2
  grip.position.set(0, DH - 0.07, 0.075)
  portinhola.add(grip)
  for (const gx of [-0.16, 0.16]) {
    const post = cylinder(0.013, 0.013, 0.05, STEEL_DARK, { roughness: 0.25, metalness: 0.8 })
    post.rotation.x = Math.PI / 2
    post.position.set(gx, DH - 0.07, 0.05)
    portinhola.add(post)
  }
  // bochechas laterais: fatias que nascem de dentro da parede
  for (const side of [-1, 1]) {
    const geo = new THREE.CylinderGeometry(DH - 0.02, DH - 0.02, 0.02, 14, 1, false, Math.PI / 2, DOOR_OPEN)
    geo.rotateZ(Math.PI / 2)
    const cheek = new THREE.Mesh(geo, mat(STEEL, { roughness: 0.4, metalness: 0.35, size: 0.5 }))
    cheek.castShadow = true
    cheek.receiveShadow = true
    cheek.position.set(side * (OW / 2 - 0.035), 0, 0)
    portinhola.add(cheek)
  }
  const hinge = cylinder(0.025, 0.025, OW - 0.04, STEEL_DARK, { roughness: 0.3, metalness: 0.8 })
  hinge.rotation.z = Math.PI / 2
  portinhola.add(hinge)

  // ---- saco de lixo preto, entalado na boca --------------------------------
  const saco = new THREE.Group()
  saco.position.set(...SACO)
  saco.rotation.set(0.85, -0.35, -0.2) // o nó escapa da boca, para fora
  root.add(saco)
  const bagBody = puff(0.18, BAG, 5, 7, { roughness: 0.25 })
  bagBody.scale.set(1.1, 0.95, 0.95)
  saco.add(bagBody)
  const neck = cylinder(0.035, 0.06, 0.08, BAG, { roughness: 0.3 })
  neck.position.y = 0.2
  saco.add(neck)
  for (const side of [-1, 1]) {
    const ear = cone(0.05, 0.12, BAG, { roughness: 0.3 })
    ear.scale.z = 0.35
    ear.position.set(side * 0.05, 0.28, 0)
    ear.rotation.z = -side * 0.7
    saco.add(ear)
  }

  // ---- HIENA (origem nos pés, olhando para +z) -----------------------------
  const hiena = new THREE.Group()
  hiena.position.set(HX, FY, HZ)
  hiena.rotation.y = HYAW
  root.add(hiena)

  // tronco escondido pelo roupão (dá continuidade ao pescoço na fusão)
  const torso = capsule(0.25, 0.4, FUR, { roughness: 0.88 })
  torso.position.y = 0.92
  torso.scale.z = 0.85
  hiena.add(torso)

  // pescoço comprido para a frente
  const NECK_A = v(0, 1.2, -0.02)
  const NECK_B = v(0, 1.5, 0.08)
  hiena.add(limb(NECK_A, NECK_B, 0.105, FUR, { roughness: 0.88 }))
  hiena.add(spot(v(0.09, 1.38, 0.06), v(1, 0, 0.5), 0.035))
  hiena.add(spot(v(-0.09, 1.34, 0.05), v(-1, 0, 0.5), 0.032))

  // crina eriçada na nuca
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const c = cone(0.05 - t * 0.012, 0.19 - t * 0.06, MANE, { roughness: 0.92 })
    c.position.set((i % 2 === 0 ? -1 : 1) * 0.022, 1.62 - t * 0.38, -0.06 - t * 0.1)
    c.rotation.x = -0.75 - t * 0.45
    hiena.add(c)
  }

  // pernas sob o roupão, entrando nas pantufas
  for (const side of [-1, 1]) {
    hiena.add(limb(v(side * 0.13, 0.62, 0), v(side * 0.14, 0.12, 0.02), 0.062, FUR, { roughness: 0.88 }))
    hiena.add(spot(v(side * 0.19, 0.38, 0.02), v(side, 0, 0.4), 0.028))
    hiena.add(spot(v(side * 0.15, 0.27, 0.07), v(side * 0.3, 0, 1), 0.026))
  }

  // rabo peludo escapando por trás do roupão
  const TAIL_A = v(-0.08, 0.66, -0.24)
  const TAIL_B = v(-0.36, 0.6, -0.36)
  const TAIL_C = v(-0.52, 0.46, -0.36)
  hiena.add(limb(TAIL_A, TAIL_B, 0.048, FUR, { roughness: 0.88 }))
  hiena.add(limb(TAIL_B, TAIL_C, 0.07, MANE, { roughness: 0.92 }))
  const tuft = sphere(0.08, MANE, { roughness: 0.92 })
  tuft.position.copy(TAIL_C)
  hiena.add(tuft)

  // ---- roupão azul felpudo -------------------------------------------------
  const roupao = new THREE.Group()
  hiena.add(roupao)

  const robe = lathe(ROBE_PROFILE, ROBE, { roughness: 0.92 }, 48)
  robe.scale.z = ROBE_Z
  roupao.add(robe)

  // gola xale e lapelas cruzadas
  const collar = torus(0.15, 0.05, ROBE_TRIM, { roughness: 0.92 })
  collar.rotation.x = Math.PI / 2 + 0.5
  collar.scale.set(1, 0.9, 1)
  collar.position.set(0, 1.3, 0.02)
  roupao.add(collar)
  robeBand(roupao, [-0.13, 1.25], [0.05, 0.88], 0.042, ROBE_TRIM)
  robeBand(roupao, [0.13, 1.25], [-0.02, 0.9], 0.042, ROBE_TRIM)
  // borda da frente, do cinto até a barra
  robeBand(roupao, [0.05, 0.84], [0.1, 0.53], 0.028, ROBE_TRIM, 5)
  // barra
  const hem = torus(0.358, 0.026, ROBE_TRIM, { roughness: 0.92 })
  hem.rotation.x = Math.PI / 2
  hem.scale.set(1, ROBE_Z, 1)
  hem.position.y = 0.53
  roupao.add(hem)

  // cinto com laço
  const belt = torus(robeR(0.86) + 0.012, 0.034, ROBE_TRIM, { roughness: 0.92 })
  belt.rotation.x = Math.PI / 2
  belt.scale.set(1, ROBE_Z, 1)
  belt.position.y = 0.86
  roupao.add(belt)
  const knotP = onRobe(0.0, 0.86, 0.04)
  const knot = sphere(0.04, ROBE_TRIM, { roughness: 0.92 })
  knot.position.copy(knotP)
  roupao.add(knot)
  for (const side of [-1, 1]) {
    const loop = torus(0.045, 0.017, ROBE_TRIM, { roughness: 0.92 })
    loop.position.set(knotP.x + side * 0.06, knotP.y + 0.005, knotP.z - 0.005)
    loop.rotation.set(0, side * 0.25, side * 0.3)
    loop.scale.set(1.15, 0.8, 1)
    roupao.add(loop)
    roupao.add(limb(
      v(knotP.x + side * 0.015, knotP.y - 0.03, knotP.z + 0.005),
      v(knotP.x + side * 0.06, knotP.y - 0.2, knotP.z + 0.02),
      0.017, ROBE_TRIM, { roughness: 0.92 },
    ))
  }

  // bolsos (chapados) nos quadris
  const POCKET_A = 0.85
  const POCKET_Y = 0.64
  for (const side of [-1, 1]) {
    const r = robeR(POCKET_Y) + 0.008
    const pocket = rbox(0.17, 0.16, 0.03, 0.03, ROBE_TRIM, { roughness: 0.92 })
    pocket.position.set(side * Math.sin(POCKET_A) * r, POCKET_Y, ROBE_Z * Math.cos(POCKET_A) * r)
    pocket.rotation.y = side * POCKET_A * 1.12
    roupao.add(pocket)
  }

  // ---- pantufas felpudas ---------------------------------------------------
  const pantufas = new THREE.Group()
  hiena.add(pantufas)
  for (const side of [-1, 1]) {
    const sole = rbox(0.17, 0.05, 0.32, 0.024, PINK_DARK, { roughness: 0.8 })
    sole.position.set(side * 0.14, 0.025, 0.05)
    sole.rotation.y = side * 0.12
    pantufas.add(sole)
    const fluff = puff(0.085, PINK, 6, 20 + side, { roughness: 0.95 })
    fluff.scale.set(1, 0.65, 1.45)
    fluff.position.set(side * 0.145, 0.09, 0.08)
    fluff.rotation.y = side * 0.12
    pantufas.add(fluff)
    const pom = sphere(0.045, '#f8c6d8', { roughness: 0.95 })
    pom.position.set(side * 0.155, 0.15, 0.17)
    pantufas.add(pom)
  }

  // ---- braços: manga do roupão + antebraço + pata --------------------------
  const bracos: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const S = v(side * 0.27, 1.2, 0.0)
    const E = v(side * 0.37, 0.97, 0.08).sub(S)
    const P = v(side * 0.3, 0.86, 0.23).sub(S)
    const braco = new THREE.Group()
    braco.position.copy(S)
    hiena.add(braco)
    bracos.push(braco)

    braco.add(limb(v(0, 0, 0), E, 0.088, ROBE, { roughness: 0.92 }))
    const cuff = torus(0.082, 0.03, ROBE_TRIM, { roughness: 0.92 })
    cuff.position.copy(E)
    cuff.quaternion.setFromUnitVectors(v(0, 0, 1), E.clone().normalize())
    braco.add(cuff)
    braco.add(limb(E, P, 0.055, FUR, { roughness: 0.88 }))
    braco.add(spot(E.clone().lerp(P, 0.5).add(v(side * 0.05, 0, 0)), v(side, 0, 0.3), 0.022))

    const paw = sphere(0.068, FUR, { roughness: 0.88 })
    paw.scale.set(0.95, 0.8, 1.1)
    paw.position.copy(P)
    braco.add(paw)
    for (let k = 0; k < 3; k++) {
      const toe = sphere(0.024, MUZZLE, { roughness: 0.85 }, 16)
      toe.position.set(P.x + (k - 1) * 0.034, P.y - 0.05, P.z + 0.035)
      braco.add(toe)
    }
  }
  const [bracoE, bracoD] = bracos

  // ---- forros dos bolsos, virados do avesso --------------------------------
  const bolsos = new THREE.Group()
  bolsos.position.y = POCKET_Y + 0.07 // brotam da boca dos bolsos
  hiena.add(bolsos)
  for (const side of [-1, 1]) {
    const r = robeR(POCKET_Y) + 0.05
    const forro = new THREE.Group()
    forro.position.set(side * Math.sin(POCKET_A + 0.08) * r, 0, ROBE_Z * Math.cos(POCKET_A + 0.08) * r)
    forro.rotation.set(0.3, side * POCKET_A * 1.1, side * 0.6)
    bolsos.add(forro)
    const pouch = capsule(0.072, 0.08, LINING, { roughness: 0.9 })
    pouch.scale.set(1.25, 1, 0.42)
    pouch.position.y = -0.1
    forro.add(pouch)
    const lip = capsule(0.022, 0.13, LINING, { roughness: 0.9 })
    lip.rotation.z = Math.PI / 2
    lip.position.y = -0.01
    forro.add(lip)
    const crease = capsule(0.008, 0.09, '#d8d2c6', { roughness: 0.9 })
    crease.position.set(0.012, -0.11, 0.03)
    crease.rotation.z = 0.12
    forro.add(crease)
  }

  // ---- risquinhos do TAPA ---------------------------------------------------
  const risquinhos = new THREE.Group()
  risquinhos.position.set(0, 0.8, 0.2)
  hiena.add(risquinhos)
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const a = (k - 1) * 0.5
      const cx = side * (0.27 + Math.cos(a) * 0.17)
      const cy = Math.sin(a) * 0.17
      const dash = capsule(0.014, 0.09, '#34425c', { roughness: 0.5 })
      dash.position.set(cx, cy, 0.04)
      dash.rotation.z = -side * a + Math.PI / 2
      risquinhos.add(dash)
    }
  }

  // ---- cabeça: focinho preto, orelhas redondas, gargalhada -----------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.6, 0.13)
  cabeca.rotation.order = 'YXZ' // gira para a portinhola e joga a cabeça para trás
  cabeca.rotation.set(HEAD_X, 0.3, -0.1)
  hiena.add(cabeca)

  const skull = sphere(0.2, FUR, { roughness: 0.88 })
  skull.scale.set(1, 0.92, 1)
  cabeca.add(skull)
  for (const side of [-1, 1]) {
    const cheek = sphere(0.11, FUR, { roughness: 0.88 })
    cheek.position.set(side * 0.1, -0.07, 0.09)
    cabeca.add(cheek)
  }
  // focinho comprido e escuro (a máscara da hiena), com ponte na testa
  const bridge = capsule(0.075, 0.12, FUR, { roughness: 0.88 })
  bridge.rotation.x = Math.PI / 2 - 0.35
  bridge.position.set(0, 0.04, 0.17)
  cabeca.add(bridge)
  const snout = capsule(0.088, 0.2, MUZZLE, { roughness: 0.8 })
  snout.rotation.x = Math.PI / 2
  snout.scale.set(1.08, 1, 1)
  snout.position.set(0, -0.03, 0.25)
  cabeca.add(snout)
  const nose = sphere(0.055, NOSE, { roughness: 0.35 })
  nose.scale.set(1.25, 0.8, 0.9)
  nose.position.set(0, 0.01, 0.43)
  cabeca.add(nose)

  // boca escancarada: cavidade, maxilar de baixo caído, dentes
  const cavity = sphere(0.1, '#5a1e22', { roughness: 0.6 })
  cavity.scale.set(0.82, 0.75, 1.45)
  cavity.position.set(0, -0.12, 0.25)
  cabeca.add(cavity)

  const jaw = new THREE.Group()
  jaw.position.set(0, -0.09, 0.09)
  jaw.rotation.x = 0.72
  cabeca.add(jaw)
  const jawBone = capsule(0.068, 0.17, MUZZLE_LIGHT, { roughness: 0.8 })
  jawBone.rotation.x = Math.PI / 2
  jawBone.position.set(0, -0.015, 0.16)
  jaw.add(jawBone)
  const tongue = capsule(0.044, 0.1, '#d9737f', { roughness: 0.5 })
  tongue.rotation.x = Math.PI / 2
  tongue.scale.set(1.15, 1, 0.5)
  tongue.position.set(0, 0.04, 0.17)
  jaw.add(tongue)
  for (const side of [-1, 1]) {
    const lowFang = cone(0.017, 0.055, '#f4f0e4', { roughness: 0.35 }, 12)
    lowFang.position.set(side * 0.046, 0.06, 0.27)
    jaw.add(lowFang)
  }

  for (const side of [-1, 1]) {
    const fang = cone(0.02, 0.07, '#f4f0e4', { roughness: 0.35 }, 12)
    fang.rotation.x = Math.PI
    fang.position.set(side * 0.058, -0.115, 0.36)
    cabeca.add(fang)
    const incisor = cone(0.013, 0.04, '#f4f0e4', { roughness: 0.35 }, 10)
    incisor.rotation.x = Math.PI
    incisor.position.set(side * 0.022, -0.11, 0.4)
    cabeca.add(incisor)

    // olhos arregalados de nervoso
    const dir = v(side * 0.42, 0.3, 0.86).normalize()
    const eye = sphere(0.058, '#ffffff', { roughness: 0.25 }, 20)
    eye.position.copy(dir.clone().multiplyScalar(0.188))
    eye.quaternion.setFromUnitVectors(v(0, 0, 1), dir)
    eye.scale.z = 0.6
    cabeca.add(eye)
    const pupil = sphere(0.021, '#141414', { roughness: 0.2 }, 12)
    pupil.position.copy(dir.clone().multiplyScalar(0.222))
    cabeca.add(pupil)
    const glint = sphere(0.007, '#ffffff', { roughness: 0.1 }, 8)
    glint.position.copy(dir.clone().multiplyScalar(0.229).add(v(side * 0.006, 0.01, 0)))
    cabeca.add(glint)

    const brow = capsule(0.015, 0.06, MANE, { roughness: 0.9 })
    brow.position.copy(dir.clone().multiplyScalar(0.2).add(v(0, 0.06, -0.01)))
    brow.rotation.set(0, side * 0.4, Math.PI / 2 - side * 0.45)
    cabeca.add(brow)

    // orelhas redondas, viradas para a frente
    const ear = new THREE.Group()
    ear.position.set(side * 0.145, 0.16, -0.06)
    ear.rotation.set(-0.1, side * 0.15, -side * 0.45)
    cabeca.add(ear)
    const outer = sphere(0.1, FUR, { roughness: 0.88 })
    outer.scale.set(1, 1.08, 0.4)
    outer.position.y = 0.07
    ear.add(outer)
    const inner = sphere(0.07, '#4a3828', { roughness: 0.9 })
    inner.scale.set(1, 1.05, 0.3)
    inner.position.set(0, 0.065, 0.026)
    ear.add(inner)

    // pintas no rosto
    cabeca.add(spot(v(side * 0.16, 0.06, 0.1).normalize().multiplyScalar(0.198), v(side * 0.16, 0.06, 0.1), 0.026))
    cabeca.add(spot(v(side * 0.17, -0.06, 0.12).normalize().multiplyScalar(0.2), v(side * 0.17, -0.06, 0.12), 0.022))
  }
  // tufo da crina começando atrás da cabeça
  for (let i = 0; i < 4; i++) {
    const c = cone(0.04, 0.14 - i * 0.015, MANE, { roughness: 0.92 })
    c.position.set((i % 2 === 0 ? -1 : 1) * 0.018, 0.19 - i * 0.05, -0.04 - i * 0.05)
    c.rotation.x = -0.35 - i * 0.3
    cabeca.add(c)
  }

  // ---- carteira conhaque, aberta feito livrinho, de ponta-cabeça -----------
  // face de dentro (+z) virada para a câmera: bolsinhos em escada com os
  // cartões coloridos e as notas escorregando para fora (para baixo, no mundo)
  const carteira = new THREE.Group()
  carteira.position.set(...WALLET)
  carteira.rotation.set(-0.42, -0.12, WALLET_ROT)
  root.add(carteira)

  const LW = 0.2
  const LH = 0.25
  const OPEN = 0.36
  const CARD_COLORS = [['#f2c230', '#4f8fd0', '#5bb07a'], ['#efe8d6', '#f2c230', '#4f8fd0']]
  for (const side of [-1, 1]) {
    const folha = new THREE.Group()
    folha.rotation.y = side * OPEN
    carteira.add(folha)
    const cover = rbox(LW, LH, 0.026, 0.014, COGNAC, { roughness: 0.45 })
    cover.position.x = side * LW / 2
    folha.add(cover)
    const liner = rbox(LW - 0.022, LH - 0.022, 0.006, 0.008, COGNAC, { roughness: 0.55 })
    liner.position.set(side * LW / 2, 0, 0.014)
    folha.add(liner)
    // costura clara em volta da face de dentro
    for (const [w, h, x, y] of [
      [LW - 0.03, 0.007, side * LW / 2, LH / 2 - 0.016],
      [LW - 0.03, 0.007, side * LW / 2, -LH / 2 + 0.016],
      [0.007, LH - 0.03, side * (LW - 0.016), 0],
    ] as const) {
      const st = rbox(w, h, 0.004, 0.002, STITCH, { roughness: 0.6 })
      st.position.set(x, y, 0.018)
      folha.add(st)
    }
    // três bolsinhos em escada, cada um com a ponta do cartão para fora
    for (let k = 0; k < 3; k++) {
      const y = 0.06 - k * 0.06
      const card = rbox(LW - 0.05, 0.05, 0.005, 0.006, CARD_COLORS[side < 0 ? 0 : 1][k], { roughness: 0.35 })
      card.position.set(side * (LW / 2 + 0.004), y + 0.032, 0.02 + k * 0.002)
      folha.add(card)
      const pocket = rbox(LW - 0.032, 0.045, 0.008, 0.008, COGNAC_DARK, { roughness: 0.5 })
      pocket.position.set(side * LW / 2, y, 0.025 + k * 0.002)
      folha.add(pocket)
    }
  }
  const spine = cylinder(0.018, 0.018, LH, COGNAC_DARK, { roughness: 0.5 })
  carteira.add(spine)
  // notas escorregando da dobra e um cartão já caindo
  for (const [bx, by, rz, cor] of [[-0.05, 0.16, 0.25, '#b9cf9f'], [0.04, 0.18, -0.15, '#cfdcb4']] as const) {
    const bill = rbox(0.18, 0.09, 0.005, 0.004, cor, { roughness: 0.7 })
    bill.position.set(bx, by, 0.03)
    bill.rotation.set(0.15, 0, rz)
    carteira.add(bill)
  }
  const lostCard = rbox(0.12, 0.076, 0.006, 0.009, '#f2d77e', { roughness: 0.35 })
  lostCard.position.set(0.13, 0.2, 0.07)
  lostCard.rotation.set(-0.3, 0.2, -0.5)
  carteira.add(lostCard)
  const chip = rbox(0.024, 0.02, 0.004, 0.003, '#c9a250', { roughness: 0.3, metalness: 0.7 })
  chip.position.set(-0.028, 0.008, 0.004)
  lostCard.add(chip)

  // ---- anéis do eco PLÔN ---------------------------------------------------
  const ecos = new THREE.Group()
  ecos.position.set(WALLET[0] + 0.02, WALLET[1] - 0.02, WALLET[2] + 0.02)
  ecos.rotation.set(-0.35, -0.12, 0)
  root.add(ecos)
  for (let i = 0; i < 3; i++) {
    const ring = torus(0.23 + i * 0.09, 0.012 - i * 0.0015, RING, { roughness: 0.3, metalness: 0.5 })
    ring.position.set(0, i * 0.03, 0.08 + i * 0.1)
    ecos.add(ring)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'corredor', object: base },
    { name: 'duto', group: 'corredor', object: duto },
    { name: 'portinhola', group: 'corredor', object: portinhola },
    { name: 'hiena', group: 'hiena', object: hiena },
    { name: 'roupao', group: 'hiena', object: roupao },
    { name: 'pantufas', group: 'hiena', object: pantufas },
    { name: 'cabeca', group: 'hiena', object: cabeca },
    { name: 'saco', group: 'ia-rrar', object: saco },
    { name: 'bracoE', group: 'tapa', object: bracoE },
    { name: 'bracoD', group: 'tapa', object: bracoD },
    { name: 'bolsos', group: 'tapa', object: bolsos },
    { name: 'risquinhos', group: 'tapa', object: risquinhos },
    { name: 'carteira', group: 'plon', object: carteira },
    { name: 'ecos', group: 'plon', object: ecos },
  ]

  // ---- montagem ------------------------------------------------------------
  const tiny = (part: string, at: number, dur: number, name: string, caption?: string) =>
    seq(name, part, at, dur, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption,
    })

  const PAW_UP = -0.55
  const HOLD = -0.8 // braços para a frente segurando o saco
  const HUG = 0.35 // ...e fechados em volta do nó
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Sábado cedo, no corredor do prédio: linóleo verde e, na parede, a portinhola do duto de lixo.',
    }),
    tiny('duto', 0.7, 0.6, 'duto-cresce'),
    seq('portinhola-abre', 'portinhola', 1.4, 0.55, [ch('rotation.x', 0, DOOR_OPEN)], { ease: 'easeOut' }),

    seq('hiena-rise', 'hiena', 2.3, 0.9, [riseFrom(FY, 2.3)], {
      ease: 'easeOut',
      caption: 'Lá vem a hiena do terceiro andar, de roupão azul e pantufa cor-de-rosa, levar o lixo.',
    }),
    tiny('pantufas', 3.15, 0.35, 'pantufas-plop'),

    seq('saco-chega', 'saco', 2.3, 0.9, [
      ch('position.x', SACO_MAO[0], SACO_MAO[0]),
      riseFrom(SACO_MAO[1], 2.3),
      ch('position.z', SACO_MAO[2], SACO_MAO[2]),
      ch('rotation.z', 0, 0),
      ch('rotation.x', 0, 0),
    ], { ease: 'easeOut' }),
    seq('cabeca-sobe', 'cabeca', 2.55, 0.7, [ch('position.y', 1.2, 1.6)], { ease: 'easeOut' }),
    seq('bracoE-segura', 'bracoE', 2.3, 0.9, [ch('rotation.x', HOLD, HOLD), ch('rotation.z', HUG, HUG)]),
    seq('bracoD-segura', 'bracoD', 2.3, 0.9, [ch('rotation.x', HOLD, HOLD), ch('rotation.z', -HUG, -HUG)]),

    // IÁ! empurra o saco para dentro da caçamba
    seq('bracoE-empurra', 'bracoE', 4.2, 0.25, [ch('rotation.x', HOLD, -1.35)], {
      ease: 'easeOut',
      caption: 'Empurra o saco pela portinhola — IÁ! — e solta a risada de hiena: RRÁR!',
    }),
    seq('bracoD-empurra', 'bracoD', 4.2, 0.25, [ch('rotation.x', HOLD, -1.35)], { ease: 'easeOut' }),
    seq('saco-voa', 'saco', 4.2, 0.65, [
      ch('position.x', SACO_MAO[0], SACO[0]),
      ch('position.z', SACO_MAO[2], SACO[2]),
      ch('rotation.z', 0, -0.2),
      ch('rotation.x', 0, 0.85),
    ], { ease: 'easeInOut' }),
    seq('saco-sobe', 'saco', 4.2, 0.32, [ch('position.y', SACO_MAO[1], SACO[1] + 0.35)], { ease: 'easeOut' }),
    seq('saco-desce', 'saco', 4.52, 0.33, [ch('position.y', SACO[1] + 0.35, SACO[1])], { ease: 'easeIn' }),
    seq('bracoE-desce', 'bracoE', 4.5, 0.45, [ch('rotation.x', -1.35, 0), ch('rotation.z', HUG, 0)], {
      ease: 'easeInOut',
    }),
    seq('bracoD-desce', 'bracoD', 4.5, 0.45, [ch('rotation.x', -1.35, 0), ch('rotation.z', -HUG, 0)], {
      ease: 'easeInOut',
    }),
    seq('cabeca-ri-1', 'cabeca', 4.85, 0.25, [ch('rotation.x', HEAD_X, HEAD_X - 0.27)], { ease: 'easeOut' }),
    seq('cabeca-ri-2', 'cabeca', 5.1, 0.25, [ch('rotation.x', HEAD_X - 0.27, HEAD_X + 0.13)], { ease: 'easeInOut' }),
    seq('cabeca-ri-3', 'cabeca', 5.35, 0.25, [ch('rotation.x', HEAD_X + 0.13, HEAD_X - 0.27)], { ease: 'easeInOut' }),
    seq('cabeca-ri-4', 'cabeca', 5.6, 0.3, [ch('rotation.x', HEAD_X - 0.27, HEAD_X)], { ease: 'easeOut' }),

    // TÁPA-T, TÁPA-T: as patas sobem e batem nos bolsos duas vezes
    seq('bracoE-sobe-1', 'bracoE', 6.4, 0.2, [ch('rotation.x', 0, PAW_UP)], {
      ease: 'easeOut',
      caption: 'Aí TAPA os bolsos do roupão — TÁPA-T, TÁPA-T…',
    }),
    seq('bracoD-sobe-1', 'bracoD', 6.4, 0.2, [ch('rotation.x', 0, PAW_UP)], { ease: 'easeOut' }),
    seq('bracoE-bate-1', 'bracoE', 6.6, 0.15, [ch('rotation.x', PAW_UP, 0)], { ease: 'easeIn' }),
    seq('bracoD-bate-1', 'bracoD', 6.6, 0.15, [ch('rotation.x', PAW_UP, 0)], { ease: 'easeIn' }),
    seq('bracoE-sobe-2', 'bracoE', 6.95, 0.2, [ch('rotation.x', 0, PAW_UP)], { ease: 'easeOut' }),
    seq('bracoD-sobe-2', 'bracoD', 6.95, 0.2, [ch('rotation.x', 0, PAW_UP)], { ease: 'easeOut' }),
    seq('bracoE-bate-2', 'bracoE', 7.15, 0.15, [ch('rotation.x', PAW_UP, 0)], { ease: 'easeIn' }),
    seq('bracoD-bate-2', 'bracoD', 7.15, 0.15, [ch('rotation.x', PAW_UP, 0)], { ease: 'easeIn' }),
    tiny('risquinhos', 6.72, 0.25, 'risquinhos-pop'),
    seq('bolsos-avesso', 'bolsos', 7.3, 0.35, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…e eles estão do avesso, vazios: "a MINHA…!"',
    }),

    seq('carteira-cai', 'carteira', 8.6, 0.7, [
      ch('position.y', WALLET[1] + 0.12, WALLET[1]),
      ch('rotation.z', WALLET_ROT - Math.PI * 0.6, WALLET_ROT),
      ch('scale.x', 0.2, 1), ch('scale.y', 0.2, 1), ch('scale.z', 0.2, 1),
    ], {
      ease: 'easeIn',
      caption: 'De dentro do duto sobe o eco: PLÔN… BUUK! — a carteira caindo aberta feito um livrinho (BOOK).',
    }),
    tiny('ecos', 9.25, 0.8, 'ecos-crescem'),

    seq('cabeca-ri-5', 'cabeca', 10.6, 0.25, [ch('rotation.x', HEAD_X, HEAD_X - 0.27)], {
      ease: 'easeOut',
      caption: 'Jag har tappat min plånbok. — Perdi minha carteira.',
    }),
    seq('cabeca-ri-6', 'cabeca', 10.85, 0.35, [ch('rotation.x', HEAD_X - 0.27, HEAD_X)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.38, 1.6, 3.05], target: [0.26, 1.1, -0.5] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-tappat-min-planbok',
    contexto:
      "Imprevisto: com o vizinho ou o zelador do prédio, ligando pro banco pra spärra (bloquear) o cartão, na polícia ou no achados e perdidos (hittegods) do transporte. A pergunta de volta costuma ser 'Var tappade du den?', onde você perdeu?",
    fraseFonte: 'Perdi minha carteira.',
    fraseAlvo: 'Jag har tappat min plånbok.',
    pronuncia:
      "iá rrar TÁP-pat min PLÔN-buuk ('jag' = iá; 'har' com h soprado e R brando, que na fala quase some; 'tappat' com A curto, P dobrado e T seco no fim; 'min' curtinho, N na língua; 'plånbok' com a força no PLÔN, Ô fechado e longo, o N quase virando M antes do B, e 'bok' com U fechado e longo e K seco)",
    ponteSonora:
      "IÁ, RRÁR! TÁPA-T... MIN PLÔN-BUUK! (7 sílabas: iá-rrar-TÁP-pat-min-PLÔN-buuk; tônicas em TÁP e PLÔN, e uma força menor no BUUK; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado; RRÁR = a risada soprada da hiena, o MESMO RRÁR de 'Jag har ont i magen', 'Jag har ett möte' e do pavão de 'Jag har missat bussen': h soprado leve como RR carioca, A longo e R BRANDO no fim — sem ele sobra 'ha', outro verbo; TÁPA-T = a TAPA nos bolsos com um T seco colado: força no TÁ, A curto, o P segurado um instante (é dobrado) e o T sem vogal depois — nunca 'tápatchi'; sem esse T sobra 'tappa', o infinitivo; MIN = a MINHA cortada no N: I curto e N DE VERDADE, ponta da língua no céu da boca, como o co-MÍN de 'Kom in och sätt dig' — nunca o 'mĩ' só nasal; PLÔN = o eco da carteira batendo no duto de metal: Ô FECHADO e LONGO de 'avô' (é o å), ORAL, e o N já vira M colando no B: PLÔM-BUUK; BUUK = o baque lá no fundo e o BOOK do inglês, porque a carteira cai aberta feito um livrinho — e 'bok' em sueco é LIVRO mesmo: U FECHADO e longo, K seco, nunca 'BÓK')",
    historia:
      "Sábado cedo, de roupão e pantufa, a hiena do terceiro andar vai jogar o lixo no duto do corredor. Empurra o saco pela portinhola com um IÁ! e solta, como sempre, a risada de hiena: RRÁR! Aí TAPA os bolsos do roupão — TÁPA-T, TÁPA-T — e eles estão vazios: 'a MINHA...!'. De dentro do duto sobe o eco da queda, PLÔÔN... BUUK, a carteira batendo no metal e caindo lá no fundo, aberta feito um livrinho. A hiena gargalha ainda mais alto, de puro nervoso: perdi a minha carteira.",
  },
  createScene,
  refine: { organic: ['hiena', 'cabeca'] },
}

export default card
