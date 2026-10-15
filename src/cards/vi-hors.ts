import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Vi hörs!" — VI... RRÖX!
 *
 * No hall de casa, o telefone é uma água-viva roxa gigante. Depois de uma hora
 * de ligação você a arranca da cabeça e ergue no alto (os tentáculos ainda
 * enrolados no braço feito fio de telefone), e a orelha — inchada, ROXA, do
 * tamanho de um prato de tanto OUVIR — tomba por cima de um olho. O outro olho
 * VIU tudo roxo: VI... RRÖX!
 *
 * Diorama: assoalho com tapete redondo cinza-azulado; cabideiro com casaco ao
 * fundo à esquerda; mesinha do telefone à direita com o gancho VAZIO e o fio
 * em espiral pendurado. Você de moletom mostarda no centro. O roxo saturado é
 * reservado à ORELHA (o RRÖX); a água-viva é lavanda translúcida.
 */

const FLOOR = '#6b4c35'
const FLOOR_LINE = '#4e3726'
const RUG = '#7d8ea2'        // tapete cinza-azulado do hall
const RUG_DARK = '#63748c'
const RUG_LIGHT = '#a4b3c3'
const WOOD = '#a06d40'
const WOOD_DARK = '#6c4529'
const CREAM = '#ece3d0'
const IVORY = '#e7dcc4'
const DARK = '#2e2a2d'
const TEAL = '#3f6669'
const TEAL_DARK = '#2c4a4d'
const RUST = '#a24a37'
const MUSTARD = '#d39a28'    // moletom
const MUSTARD_DARK = '#a9761c'
const SKIN = '#e8c39e'
const HAIR = '#5a3a27'
const BROW = '#33211a'
const LIPS = '#b8695b'
const MOUTH = '#3a1d1f'
const JELLY = '#b48ce6'      // sino: lavanda translúcida
const JELLY_GLOW = '#7448c4'
const JELLY_CORE = '#8f62d2'
const FRILL = '#cfa8f2'      // franja lilás
const TENT = '#9a68da'
const TENT_GLOW = '#5f34aa'
const PINK = '#ff6fc2'
const EAR = '#8c1fd6'        // ACENTO reservado: a ORELHA ROXA (RRÖX)
const EAR_DARK = '#58108f'
const EAR_LIGHT = '#a845ef'

const FY = 0.12   // topo do assoalho
const GY = 0.16   // topo do tapete

// você (espaço da pessoa: altura 1.5, escalado no root)
const P_X = -0.2
const P_Z = 0.25
const P_SCALE = 1.12
const ARM_REST_Z = 0.12
const ARM_UP_Z = 2.5
const ARM_UP_X = 0.2

// água-viva: origem no centro da borda do sino
const BELL_R = 0.42
const J_RX = 0.3
const J_RZ = 0.45
const J_CALL = { x: -0.37, y: 1.03, z: 0.03, rz: Math.PI / 2 } // colada na orelha
const J_LIFT_Y = 1.9

// orelha gigante: pivô no lado esquerdo da cabeça
const EAR_OUT_Y = -1.75
const EAR_OUT_Z = 0.3
const EAR_FLOP_Z = -0.1

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Capsula ligando dois pontos (centros das calotas em a e b). */
function strut(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const dir = b.clone().sub(a)
  const m = capsule(r, Math.max(dir.length(), 0.01), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

/** Toro parcial (aro da orelha, gônadas). */
function arc(r: number, tube: number, angle: number, color: string, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 14, 40, angle),
    mat(color, { size: r * 2, ...opts }),
  )
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Toro parcial com as pontas arredondadas (sem corte seco). */
function roundArc(r: number, tube: number, angle: number, color: string, opts = {}) {
  const m = arc(r, tube, angle, color, opts)
  for (const a of [0, angle]) {
    const cap = sphere(tube, color, opts)
    cap.position.set(Math.cos(a) * r, Math.sin(a) * r, 0)
    m.add(cap)
  }
  return m
}

/** Tubo liso por uma lista de pontos (tentáculos, fios). */
function tube(points: THREE.Vector3[], radius: number, material: THREE.Material, segs = 240) {
  const curve = new THREE.CatmullRomCurve3(points)
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, 8, false), material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Hélice (fio de telefone) enrolada em volta de uma linha-guia qualquer. */
function coil(guide: THREE.Vector3[], radius: number, turns: number, samples: number, phase = 0) {
  const center = new THREE.CatmullRomCurve3(guide)
  const frames = center.computeFrenetFrames(samples, false)
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const a = phase + t * turns * Math.PI * 2
    pts.push(
      center.getPointAt(t)
        .addScaledVector(frames.normals[i], Math.cos(a) * radius)
        .addScaledVector(frames.binormals[i], Math.sin(a) * radius),
    )
  }
  return pts
}

function geleia<T extends THREE.Mesh>(mesh: T, opacity: number): T {
  const m = mesh.material as THREE.MeshStandardMaterial
  m.transparent = true
  m.opacity = opacity
  return mesh
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: assoalho do hall + tapete redondo cinza-azulado ---------------
  const base = new THREE.Group()

  const floor = cylinder(2.62, 2.7, 0.12, FLOOR, { roughness: 0.8 })
  floor.position.y = 0.06
  base.add(floor)
  for (const z of [-2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1]) {
    const len = 2 * Math.sqrt(Math.max(2.56 * 2.56 - z * z, 0.01))
    const line = rbox(len, 0.012, 0.03, 0.005, FLOOR_LINE, { roughness: 0.9 })
    line.position.set(0, FY + 0.002, z)
    base.add(line)
  }

  const rug = cylinder(1.8, 1.84, 0.04, RUG, { roughness: 0.95 })
  rug.position.y = 0.14
  base.add(rug)
  for (const [r, t, c] of [[1.62, 0.04, RUG_LIGHT], [1.47, 0.025, RUG_DARK], [0.8, 0.03, RUG_LIGHT]] as const) {
    const ring = torus(r, t, c, { roughness: 0.95 })
    ring.rotation.x = Math.PI / 2
    ring.scale.z = 0.35
    ring.position.y = GY
    base.add(ring)
  }

  // galochas na beira do assoalho
  for (const s of [-1, 1]) {
    const galocha = new THREE.Group()
    galocha.position.set(-1.0 + s * 0.13, FY, -1.55 + s * 0.04)
    galocha.rotation.y = 0.3 + s * 0.12
    const foot = rbox(0.16, 0.1, 0.3, 0.05, TEAL_DARK, { roughness: 0.35 })
    foot.position.set(0, 0.05, 0.05)
    const shaft = cylinder(0.075, 0.08, 0.3, TEAL_DARK, { roughness: 0.35 })
    shaft.position.set(0, 0.2, -0.04)
    const cuff = torus(0.075, 0.018, TEAL, { roughness: 0.35 })
    cuff.rotation.x = Math.PI / 2
    cuff.position.set(0, 0.35, -0.04)
    galocha.add(foot, shaft, cuff)
    base.add(galocha)
  }

  // cabideiro com casaco e cachecol, ao fundo à esquerda
  const cabide = new THREE.Group()
  cabide.position.set(-1.55, FY, -1.1)
  cabide.rotation.y = 0.35
  const pole = cylinder(0.035, 0.045, 1.9, WOOD_DARK, { roughness: 0.55 })
  pole.position.y = 0.95
  cabide.add(pole)
  const knob = sphere(0.06, WOOD_DARK, { roughness: 0.5 })
  knob.position.y = 1.93
  cabide.add(knob)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2
    cabide.add(strut(V(0, 0.3, 0), V(Math.cos(a) * 0.32, 0.03, Math.sin(a) * 0.32), 0.03, WOOD_DARK, { roughness: 0.55 }))
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4
    cabide.add(strut(V(0, 1.72, 0), V(Math.cos(a) * 0.16, 1.84, Math.sin(a) * 0.16), 0.018, WOOD_DARK, { roughness: 0.5 }))
  }
  const casaco = rbox(0.5, 0.95, 0.2, 0.09, TEAL, { roughness: 0.85 })
  casaco.position.set(0.04, 1.22, 0.17)
  casaco.rotation.z = 0.05
  cabide.add(casaco)
  const gola = torus(0.12, 0.05, TEAL_DARK, { roughness: 0.85 })
  gola.rotation.x = Math.PI / 2 - 0.3
  gola.position.set(0.04, 1.68, 0.14)
  cabide.add(gola)
  for (const by of [1.5, 1.3, 1.1]) {
    const botao = sphere(0.025, CREAM, { roughness: 0.4 })
    botao.position.set(0.04, by, 0.28)
    cabide.add(botao)
  }
  // cachecol: uma ponta só, pendurada no gancho do lado
  const cachecol = rbox(0.11, 0.7, 0.04, 0.02, RUST, { roughness: 0.9 })
  cachecol.position.set(-0.2, 1.42, 0.06)
  cachecol.rotation.z = -0.08
  cabide.add(cachecol)
  for (const fy of [1.18, 1.3]) {
    const listra = rbox(0.115, 0.035, 0.045, 0.01, CREAM, { roughness: 0.9 })
    listra.position.set(-0.2 + (1.42 - fy) * 0.08, fy, 0.06)
    listra.rotation.z = -0.08
    cabide.add(listra)
  }
  // gorro de lã na ponta do cabideiro
  const gorroLa = lathe([[0, 0], [0.12, 0], [0.125, 0.04], [0.11, 0.1], [0.07, 0.15], [0, 0.17]], RUST, { roughness: 0.92 })
  gorroLa.position.y = 1.9
  cabide.add(gorroLa)
  const pompom = sphere(0.05, CREAM, { roughness: 0.95 })
  pompom.position.y = 2.09
  cabide.add(pompom)
  base.add(cabide)

  root.add(base)

  // ---- mesinha do telefone: o gancho está VAZIO -----------------------------
  const mesinha = new THREE.Group()
  mesinha.position.set(1.95, FY, -0.3)
  mesinha.rotation.y = 0.25
  root.add(mesinha)

  const tampo = cylinder(0.36, 0.36, 0.05, WOOD, { roughness: 0.5 })
  tampo.position.y = 0.74
  mesinha.add(tampo)
  const borda = torus(0.36, 0.022, WOOD_DARK, { roughness: 0.5 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.74
  mesinha.add(borda)
  const pe = lathe(
    [[0, 0.04], [0.07, 0.04], [0.05, 0.14], [0.04, 0.45], [0.06, 0.55], [0.04, 0.63], [0.07, 0.7], [0, 0.72]],
    WOOD_DARK,
    { roughness: 0.55 },
  )
  mesinha.add(pe)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2
    mesinha.add(strut(V(0, 0.08, 0), V(Math.cos(a) * 0.28, 0.025, Math.sin(a) * 0.28), 0.03, WOOD_DARK, { roughness: 0.55 }))
  }
  const toalhinha = cylinder(0.27, 0.27, 0.008, CREAM, { roughness: 0.95 })
  toalhinha.position.y = 0.769
  mesinha.add(toalhinha)
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    const renda = sphere(0.035, CREAM, { roughness: 0.95 })
    renda.scale.y = 0.25
    renda.position.set(Math.cos(a) * 0.27, 0.769, Math.sin(a) * 0.27)
    mesinha.add(renda)
  }

  // base de telefone antigo, sem o fone
  const fone = new THREE.Group()
  fone.position.set(0, 0.773, 0)
  fone.scale.setScalar(1.2)
  mesinha.add(fone)
  const corpoFone = rbox(0.34, 0.1, 0.28, 0.045, IVORY, { roughness: 0.3 })
  corpoFone.position.y = 0.05
  fone.add(corpoFone)
  const tampaFone = rbox(0.28, 0.09, 0.2, 0.04, IVORY, { roughness: 0.3 })
  tampaFone.position.set(0, 0.12, -0.02)
  tampaFone.rotation.x = -0.25
  fone.add(tampaFone)
  const disco = cylinder(0.075, 0.075, 0.02, CREAM, { roughness: 0.3 })
  disco.position.set(0, 0.155, 0.07)
  disco.rotation.x = 0.55
  fone.add(disco)
  const miolo = cylinder(0.028, 0.028, 0.025, DARK, { roughness: 0.4 })
  miolo.position.set(0, 0.157, 0.072)
  miolo.rotation.x = 0.55
  fone.add(miolo)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 1.6 + 0.6
    const furo = sphere(0.011, DARK, { roughness: 0.4 })
    const local = V(Math.cos(a) * 0.052, 0.012, Math.sin(a) * 0.052)
    local.applyEuler(new THREE.Euler(0.55, 0, 0))
    furo.position.set(local.x, 0.155 + local.y, 0.07 + local.z)
    fone.add(furo)
  }
  for (const s of [-1, 1]) {
    const garfo = rbox(0.045, 0.1, 0.05, 0.015, IVORY, { roughness: 0.3 })
    garfo.position.set(s * 0.12, 0.2, -0.07)
    fone.add(garfo)
    const ganchoU = arc(0.02, 0.008, Math.PI, IVORY, { roughness: 0.3 })
    ganchoU.position.set(s * 0.12, 0.25, -0.07)
    ganchoU.rotation.set(0, Math.PI / 2, Math.PI)
    fone.add(ganchoU)
  }
  // tomada do fio: é aqui que o tentáculo-fio da água-viva se pluga
  const tomada = rbox(0.05, 0.045, 0.05, 0.015, DARK, { roughness: 0.4 })
  tomada.position.set(-0.17, 0.05, 0.06)
  fone.add(tomada)

  // ---- você ----------------------------------------------------------------
  const voce = person({ body: MUSTARD, skin: SKIN, height: 1.5, armAngle: 0.22 })
  voce.position.set(P_X, GY, P_Z)
  voce.rotation.y = 0.06
  voce.scale.setScalar(P_SCALE)
  root.add(voce)

  // moletom: gorro amontoado na nuca, cordões, bolso canguru, barra
  const gorro = torus(0.17, 0.07, MUSTARD, { roughness: 0.9 })
  gorro.rotation.x = Math.PI / 2 - 0.4
  gorro.position.set(0, 0.79, -0.05)
  voce.add(gorro)
  const capuz = sphere(0.2, MUSTARD, { roughness: 0.9 })
  capuz.scale.set(1.15, 0.65, 0.6)
  capuz.position.set(0, 0.8, -0.2)
  voce.add(capuz)
  for (const s of [-1, 1]) {
    const cordao = cylinder(0.011, 0.011, 0.17, CREAM, { roughness: 0.8 })
    cordao.position.set(s * 0.065, 0.65, 0.245)
    cordao.rotation.x = -0.12
    voce.add(cordao)
    const ponteira = cylinder(0.016, 0.016, 0.035, DARK, { roughness: 0.4 })
    ponteira.position.set(s * 0.065, 0.56, 0.257)
    voce.add(ponteira)
  }
  const bolso = rbox(0.34, 0.15, 0.04, 0.02, MUSTARD_DARK, { roughness: 0.9 })
  bolso.position.set(0, 0.43, 0.245)
  bolso.rotation.x = -0.05
  voce.add(bolso)
  const barra = torus(0.257, 0.026, MUSTARD_DARK, { roughness: 0.9 })
  barra.rotation.x = Math.PI / 2
  barra.position.y = 0.335
  voce.add(barra)
  for (const s of [-1, 1]) {
    const tenis = rbox(0.2, 0.12, 0.34, 0.05, CREAM, { roughness: 0.6 })
    tenis.position.set(s * 0.107, 0.07, 0.115)
    voce.add(tenis)
    const sola = rbox(0.21, 0.035, 0.35, 0.015, DARK, { roughness: 0.6 })
    sola.position.set(s * 0.107, 0.018, 0.115)
    voce.add(sola)
  }

  const head = voce.getObjectByName('head') as THREE.Group
  // o olho direito vira a peça 'olho' (maior, arregalável)
  head.children[3].visible = false
  head.children[4].visible = false

  const cabelo = sphere(0.3, HAIR, { roughness: 0.85 })
  cabelo.scale.set(1.0, 0.62, 1.03)
  cabelo.position.set(0, 0.125, -0.055)
  head.add(cabelo)
  for (const [tx, tz] of [[-0.1, 0.2], [0.02, 0.23], [0.13, 0.19]] as const) {
    const topete = sphere(0.075, HAIR, { roughness: 0.85 })
    topete.scale.set(1.2, 0.7, 0.9)
    topete.position.set(tx, 0.215, tz - 0.02)
    head.add(topete)
  }

  // ---- olho livre, arregalado, virado pra orelha ----------------------------
  const olho = new THREE.Group()
  olho.position.set(0.108, 0.04, 0.226)
  olho.rotation.y = -0.45
  head.add(olho)
  const esclera = sphere(0.082, '#ffffff', { roughness: 0.25 })
  esclera.scale.z = 0.62
  olho.add(esclera)
  const pupila = sphere(0.036, '#1a1a1a', { roughness: 0.2 })
  pupila.position.set(0, 0.005, 0.044)
  pupila.scale.z = 0.6
  olho.add(pupila)
  const brilho = sphere(0.012, '#ffffff', { roughness: 0.1 })
  brilho.position.set(0.012, 0.022, 0.066)
  olho.add(brilho)
  const sobrancelha = capsule(0.02, 0.09, BROW, { roughness: 0.85 })
  sobrancelha.position.set(0.0, 0.105, 0.045)
  sobrancelha.rotation.z = Math.PI / 2 - 0.3
  olho.add(sobrancelha)

  // ---- boca num O de susto ---------------------------------------------------
  const boca = new THREE.Group()
  boca.position.set(0.075, -0.13, 0.242)
  head.add(boca)
  const cavidade = sphere(0.058, MOUTH, { roughness: 0.7 })
  cavidade.scale.set(1, 1.2, 0.55)
  boca.add(cavidade)
  const labio = torus(0.058, 0.019, LIPS, { roughness: 0.5 })
  labio.scale.y = 1.2
  labio.position.z = 0.018
  boca.add(labio)

  // ---- orelha gigante, roxa e inchada (o acento) -----------------------------
  const orelha = new THREE.Group()
  orelha.position.set(-0.27, 0.06, 0.03)
  orelha.rotation.set(0, 0, EAR_FLOP_Z)
  head.add(orelha)
  const C = V(0.1, 0.03, 0.37) // centro do disco, relativo ao pivô
  const shiny = { roughness: 0.32 }
  const disco2 = sphere(0.26, EAR, shiny)
  disco2.scale.set(0.86, 1.16, 0.34)
  disco2.position.copy(C)
  orelha.add(disco2)
  const helix = roundArc(0.205, 0.058, Math.PI * 1.5, EAR, shiny)
  helix.scale.set(0.98, 1.38, 0.9)
  helix.position.copy(C).add(V(0, 0.01, 0.045))
  helix.rotation.z = 0.15
  orelha.add(helix)
  const concha = sphere(0.115, EAR_DARK, { roughness: 0.45 })
  concha.scale.set(0.95, 1.25, 0.32)
  concha.position.copy(C).add(V(0.03, -0.05, 0.065))
  orelha.add(concha)
  const antihelix = roundArc(0.12, 0.032, Math.PI * 1.1, EAR_LIGHT, shiny)
  antihelix.scale.set(1, 1.25, 0.8)
  antihelix.position.copy(C).add(V(0.02, -0.03, 0.075))
  antihelix.rotation.z = 0.55
  orelha.add(antihelix)
  const tragus = sphere(0.05, EAR, shiny)
  tragus.scale.set(1, 1.2, 0.8)
  tragus.position.copy(C).add(V(0.15, -0.08, 0.06))
  orelha.add(tragus)
  const lobulo = sphere(0.105, EAR, shiny)
  lobulo.scale.set(1, 0.95, 0.75)
  lobulo.position.copy(C).add(V(0.07, -0.29, 0.0))
  orelha.add(lobulo)
  orelha.add(strut(V(0, 0, 0), C.clone().add(V(-0.19, 0.02, -0.04)), 0.075, EAR, shiny))

  // ---- braço erguido (pivô no ombro) ----------------------------------------
  const braco = voce.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(braco, 1.5)
  braco.rotation.set(ARM_UP_X, 0, ARM_UP_Z)

  root.updateMatrixWorld(true)
  const handP = voce.worldToLocal(braco.children[0].getWorldPosition(new THREE.Vector3()))

  // ---- água-viva-telefone ---------------------------------------------------
  const agua = new THREE.Group()
  const grip = V(-BELL_R + 0.03, -0.01, 0)
  const jEuler = new THREE.Euler(J_RX, 0, J_RZ)
  agua.position.copy(handP).sub(grip.clone().applyEuler(jEuler))
  agua.rotation.copy(jEuler)
  voce.add(agua)

  const sino = geleia(
    lathe(
      [
        [0, 0.06], [0.2, 0.045], [0.33, 0.02], [0.405, -0.015], [0.425, 0.02],
        [0.415, 0.1], [0.375, 0.2], [0.3, 0.285], [0.19, 0.34], [0, 0.365],
      ],
      JELLY,
      { roughness: 0.15, emissive: JELLY_GLOW, emissiveIntensity: 0.4 },
      48,
    ),
    0.8,
  )
  agua.add(sino)
  const nucleo = lathe(
    [[0, 0.07], [0.22, 0.065], [0.27, 0.11], [0.24, 0.2], [0.14, 0.26], [0, 0.275]],
    JELLY_CORE,
    { roughness: 0.3, emissive: JELLY_GLOW, emissiveIntensity: 0.3 },
  )
  agua.add(nucleo)
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4
    const gonada = arc(0.06, 0.018, Math.PI * 1.4, FRILL, { emissive: '#b07ae0', emissiveIntensity: 0.5 })
    gonada.position.set(Math.cos(a) * 0.12, 0.245, Math.sin(a) * 0.12)
    gonada.rotation.set(-Math.PI / 2 + 0.35, 0, a)
    agua.add(gonada)
  }

  // franja de bracinhos lilás na borda
  const franja = new THREE.Group()
  agua.add(franja)
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2
    const vieira = sphere(0.05, FRILL, { roughness: 0.4, emissive: '#9d6fd6', emissiveIntensity: 0.25 })
    vieira.scale.set(0.7, 0.55, 1)
    vieira.position.set(Math.cos(a) * 0.405, -0.015, Math.sin(a) * 0.405)
    vieira.rotation.y = -a
    franja.add(vieira)
    const raio = new THREE.Group()
    raio.rotation.y = -(a + Math.PI / 20)
    const bracinho = capsule(0.016, 0.07, FRILL, { roughness: 0.4, emissive: '#9d6fd6', emissiveIntensity: 0.25 })
    bracinho.position.set(0.385, -0.08, 0)
    bracinho.rotation.z = 0.3
    raio.add(bracinho)
    franja.add(raio)
  }

  // três pintinhas de luz rosa no topo
  const pintinhas = new THREE.Group()
  pintinhas.position.y = 0.36
  agua.add(pintinhas)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 2
    const luz = sphere(0.04, PINK, { emissive: PINK, emissiveIntensity: 1.8 })
    luz.position.set(Math.cos(a) * 0.13, -0.008, Math.sin(a) * 0.13)
    pintinhas.add(luz)
  }

  // ---- tentáculos: dois enrolados no braço, dois pendurados em espiral ------
  const tentaculos = new THREE.Group()
  tentaculos.position.copy(grip)
  agua.add(tentaculos)
  root.updateMatrixWorld(true)

  const tentMat = mat(TENT, { roughness: 0.3, emissive: TENT_GLOW, emissiveIntensity: 0.3 })
  const toTent = (pts: THREE.Vector3[]) => pts.map((p) => tentaculos.worldToLocal(p))
  const rimW = (a: number) =>
    agua.localToWorld(V(Math.cos(a) * (BELL_R - 0.02), -0.01, Math.sin(a) * (BELL_R - 0.02)))

  for (const [k, a] of [[0, Math.PI - 0.45], [1, Math.PI + 0.45]] as const) {
    const phase = k * Math.PI + 0.6
    const pts: THREE.Vector3[] = [rimW(a)]
    const turns = 2.5
    const N = 90
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const y = -0.44 + t * 0.27
      const r = 0.128 + t * 0.018
      const ang = phase + t * turns * Math.PI * 2
      pts.push(braco.localToWorld(V(Math.cos(ang) * r, y, Math.sin(ang) * r)))
    }
    tentaculos.add(tube(toTent(pts), 0.022, tentMat, 260))
    const ponta = sphere(0.024, TENT, { roughness: 0.3, emissive: TENT_GLOW, emissiveIntensity: 0.3 })
    ponta.position.copy(tentaculos.worldToLocal(braco.localToWorld(V(
      Math.cos(phase + turns * Math.PI * 2) * 0.146, -0.17, Math.sin(phase + turns * Math.PI * 2) * 0.146,
    ))))
    tentaculos.add(ponta)
  }

  // um tentáculo pendurado solto, na frente do sino
  {
    const p0 = rimW(1.75)
    const guide = [p0, p0.clone().add(V(0.0, -0.12, 0.03)), p0.clone().add(V(0.03, -0.28, 0.05)), p0.clone().add(V(0.02, -0.45, 0.06))]
    const pts = coil(guide, 0.045, 0.45 / 0.042, 300)
    pts.unshift(p0)
    tentaculos.add(tube(toTent(pts), 0.016, tentMat, 520))
  }
  // e um que desce em espiral até a base do telefone: o fio do "fone"
  {
    const p0 = rimW(0.3)
    const p1 = tomada.getWorldPosition(new THREE.Vector3())
    const out = mesinha.localToWorld(V(-1, 0.82, 0)).sub(mesinha.localToWorld(V(0, 0.82, 0))).normalize()
    const mid = p0.clone().lerp(p1, 0.5).add(V(0, -0.38, 0.1))
    const guide = [
      p0,
      p0.clone().add(V(0.03, -0.12, 0.0)),
      mid,
      p1.clone().addScaledVector(out, 0.12),
      p1,
    ]
    const len = new THREE.CatmullRomCurve3(guide).getLength()
    const pts = coil(guide, 0.042, len / 0.042, 700)
    pts.unshift(p0)
    pts.push(p1)
    tentaculos.add(tube(toTent(pts), 0.015, tentMat, 1200))
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'hall', object: base },
    { name: 'mesinha', group: 'hall', object: mesinha },
    { name: 'voce', group: 'voce', object: voce },
    { name: 'braco', group: 'voce', object: braco },
    { name: 'olho', group: 'voce', object: olho },
    { name: 'boca', group: 'voce', object: boca },
    { name: 'aguaviva', group: 'ligacao', object: agua },
    { name: 'franja', group: 'ligacao', object: franja },
    { name: 'pintinhas', group: 'ligacao', object: pintinhas },
    { name: 'tentaculos', group: 'arranca', object: tentaculos },
    { name: 'orelha', group: 'orelha', object: orelha },
  ]

  // ---- montagem ------------------------------------------------------------
  const T_VOCE = 1.5
  const T_AGUA = 3.0
  const T_PULSO = 4.1
  const T_ARRANCA = 6.2
  const T_ORELHA = 7.9
  const T_TOMBA = 8.8
  const T_GRITO = 9.9
  const T_FIM = 11.1
  const S3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  const pulses = [0, 0.65, 1.3].flatMap((dt, i) => {
    const t = T_PULSO + dt
    return [
      seq(`pintinhas-pulsa-${i}`, 'pintinhas', t, 0.2, S3(1, 1.5), { ease: 'easeOut' }),
      seq(`pintinhas-volta-${i}`, 'pintinhas', t + 0.2, 0.35, S3(1.5, 1)),
      seq(`agua-pulsa-${i}`, 'aguaviva', t, 0.2, [ch('scale.y', 1, 0.86), ch('scale.x', 1, 1.07), ch('scale.z', 1, 1.07)], { ease: 'easeOut' }),
      seq(`agua-volta-${i}`, 'aguaviva', t + 0.2, 0.35, [ch('scale.y', 0.86, 1), ch('scale.x', 1.07, 1), ch('scale.z', 1.07, 1)]),
      seq(`voce-queima-${i}`, 'voce', t + 0.05, 0.12, [ch('rotation.z', 0, -0.04)], { ease: 'easeOut' }),
      seq(`voce-volta-${i}`, 'voce', t + 0.17, 0.3, [ch('rotation.z', -0.04, 0)]),
      seq(`boca-fala-${i}`, 'boca', t, 0.25, [ch('scale.y', 0.3, 0.6)], { ease: 'easeOut' }),
      seq(`boca-cala-${i}`, 'boca', t + 0.25, 0.25, [ch('scale.y', 0.6, 0.3)]),
    ]
  })

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No hall da sua casa sueca: tapete cinza-azulado, cabideiro… e a mesinha do telefone com o gancho VAZIO.',
    }),
    seq('mesinha-rise', 'mesinha', 0.25, 0.8, [riseFrom(FY, 1.0)], { ease: 'easeOut' }),

    seq('voce-rise', 'voce', T_VOCE, 0.9, [riseFrom(GY, 2.1)], {
      ease: 'easeOut',
      caption: 'O telefone toca e você atende. Só que, nesta casa, o telefone é…',
    }),
    seq('braco-pende', 'braco', T_VOCE, 0.9, [ch('rotation.z', 0.5, ARM_REST_Z)], { ease: 'easeOut' }),
    seq('olho-abre', 'olho', T_VOCE, 0.9, [ch('scale.y', 0.1, 0.78)], { ease: 'easeOut' }),
    seq('boca-aparece', 'boca', T_VOCE, 0.9, [ch('scale.x', 0.6, 0.8)], { ease: 'easeOut' }),

    seq('agua-cola', 'aguaviva', T_AGUA, 0.7, S3(0.01, 1), {
      ease: 'easeOut',
      caption: '…uma ÁGUA-VIVA roxa gigante! Você encosta o sino gelatinoso na orelha.',
    }),
    seq('franja-abre', 'franja', T_AGUA + 0.4, 0.5, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('pintinhas-acende', 'pintinhas', T_AGUA + 0.5, 0.4, S3(0.01, 1), { ease: 'easeOut' }),

    seq('pulso-legenda', 'franja', T_PULSO, 0.5, [ch('rotation.y', 0, 0.25)], {
      caption: 'Uma hora inteira de conversa: a cada frase ela pulsa roxa e dá uma queimadinha.',
    }),
    seq('franja-volta', 'franja', T_PULSO + 0.5, 1.2, [ch('rotation.y', 0.25, 0)]),
    ...pulses,

    seq('agua-arranca', 'aguaviva', T_ARRANCA, 0.35, [
      ch('position.x', J_CALL.x, -0.02),
      ch('position.y', J_CALL.y, J_LIFT_Y),
      ch('rotation.z', J_CALL.rz, 0.25),
    ], {
      ease: 'easeOut',
      caption: 'Na despedida você ARRANCA a água-viva da cabeça e ergue no alto — tentáculos enrolados no braço feito fio de telefone.',
    }),
    seq('agua-ergue', 'aguaviva', T_ARRANCA + 0.35, 0.5, [
      ch('position.x', -0.02, agua.position.x),
      ch('position.y', J_LIFT_Y, agua.position.y),
      ch('position.z', J_CALL.z, agua.position.z),
      ch('rotation.z', 0.25, J_RZ),
      ch('rotation.x', 0, J_RX),
    ]),
    seq('braco-ergue', 'braco', T_ARRANCA + 0.15, 0.7, [
      ch('rotation.z', ARM_REST_Z, ARM_UP_Z),
      ch('rotation.x', 0, ARM_UP_X),
    ]),
    seq('tentaculos-desenrola', 'tentaculos', T_ARRANCA + 0.85, 0.8, S3(0.01, 1), { ease: 'easeOut' }),

    seq('orelha-incha', 'orelha', T_ORELHA, 0.7, S3(0.25, 1), {
      ease: 'easeOut',
      caption: 'E a orelha, inchada do tamanho de um PRATO de tanto OUVIR, fica ROXA…',
    }),
    seq('orelha-tomba', 'orelha', T_TOMBA, 0.45, [
      ch('rotation.y', EAR_OUT_Y, 0),
      ch('rotation.z', EAR_OUT_Z, EAR_FLOP_Z),
    ], {
      ease: 'easeIn',
      caption: '…e tomba por cima do seu olho. Tudo o que você enxerga é roxo.',
    }),
    seq('orelha-quica', 'orelha', T_TOMBA + 0.45, 0.15, [ch('rotation.x', 0, 0.14)], { ease: 'easeOut' }),
    seq('orelha-assenta', 'orelha', T_TOMBA + 0.6, 0.3, [ch('rotation.x', 0.14, 0)]),

    seq('olho-arregala', 'olho', T_GRITO, 0.35, [
      ch('scale.x', 0.78, 1), ch('scale.y', 0.78, 1), ch('scale.z', 0.78, 1),
      ch('rotation.y', 0, -0.45),
    ], {
      ease: 'easeOut',
      caption: 'E você grita o que VIU: VI… RRÖX!',
    }),
    seq('boca-grita', 'boca', T_GRITO, 0.35, [ch('scale.y', 0.3, 1), ch('scale.x', 0.8, 1)], { ease: 'easeOut' }),
    seq('voce-pula', 'voce', T_GRITO, 0.18, [ch('position.y', GY, GY + 0.08)], { ease: 'easeOut' }),
    seq('voce-pousa', 'voce', T_GRITO + 0.18, 0.25, [ch('position.y', GY + 0.08, GY)], { ease: 'easeIn' }),

    seq('pintinhas-fim', 'pintinhas', T_FIM, 0.2, S3(1, 1.5), {
      ease: 'easeOut',
      caption: 'Vi hörs! — A gente se fala!',
    }),
    seq('pintinhas-fim-volta', 'pintinhas', T_FIM + 0.2, 0.4, S3(1.5, 1)),
    seq('agua-fim', 'aguaviva', T_FIM, 0.2, [ch('scale.y', 1, 0.86), ch('scale.x', 1, 1.07), ch('scale.z', 1, 1.07)], { ease: 'easeOut' }),
    seq('agua-fim-volta', 'aguaviva', T_FIM + 0.2, 0.4, [ch('scale.y', 0.86, 1), ch('scale.x', 1.07, 1), ch('scale.z', 1.07, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.6, 2.0, 4.2], target: [0.35, 1.15, 0.05] },
  }
}

export const card: Card = {
  refine: { organic: ['orelha'] },
  meta: {
    id: 'vi-hors',
    contexto:
      'Despedida: fim de ligação, fim de conversa no chat ou por SMS — com quem você vai falar de novo por telefone ou mensagem, no trabalho e entre amigos.',
    fraseFonte: 'A gente se fala!',
    fraseAlvo: 'Vi hörs!',
    pronuncia:
      "vi RRÖÖSH! ('vi' com I limpo e longo; 'hörs' com h soprado tipo RR carioca, ö LONGO de BICO — boca de Ó redonda com a língua empurrada pra frente, o mesmo ö de 'höra' — e o 'rs' vira um X chiado: tudo numa sílaba só)",
    ponteSonora:
      "VI... RRÖX! (2 sílabas, tônica no RRÖX; VI = o 'eu VI' do português, o MESMO VI de 'Vi ses!' (VI SEIS) — I limpo e LONGO; RRÖX = ROXO cortado no X: o R de começo de palavra já sai soprado à carioca, e esse sopro é o h de 'hörs'; a vogal é o MESMO RRÖ de AT-RRÖ-RA ('Vad kul att höra!'), e LONGA como lá: boca de Ó redonda, em BICO, com a língua empurrada pra frente — estique a VOGAL, nunca o fim da palavra; o X é o chiado do 'rs', o mesmo de FÖ-XÊ-NAT e FÖ-XKU-LAN; corte o -o: RRÖX numa sílaba só, nunca 'RRÔ-xu', que cria uma sílaba a mais. Pra se VER, a mão de SEIS dedos; pra se OUVIR, a orelha ROXA)",
    historia:
      'Na sua casa sueca, o telefone é uma água-viva roxa gigante: você encosta o sino gelatinoso na orelha e os tentáculos se enrolam no seu braço feito fio de telefone em espiral. A conversa dura uma hora inteira, e a cada frase a água-viva pulsa roxa e dá uma queimadinha. Na despedida você arranca a água-viva da cabeça — e a orelha, inchada do tamanho de um prato de tanto OUVIR, tomba por cima do seu olho. Tudo o que você enxerga é roxo, e você grita o que VIU: VI... RRÖX! Ligação sueca termina assim, com a orelha roxa e a água-viva pulsando no ar, já esperando a próxima: a gente se fala.',
  },
  createScene,
}

export default card
