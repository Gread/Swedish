import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Det läcker vatten." — DÊ… (mu)LÉ, QUER?… VÁT-TEN!
 *
 * Quinta-feira de lua cheia: a MULÉ do padre vira mula-sem-cabeça. Sem cabeça,
 * até o nome perde a cabeça — da plaquinha dourada do peitoral cai o MU e sobra
 * LÉ. No lugar da labareda, o pescoço cortado VAZA: um esguicho d'água em arco
 * que cai bem em cima da tocha que você estende ('LÉ, QUER?') — PSSS, apagada.
 *
 * Diorama: pasto verde-escuro à noite, lua cheia e igrejinha ao fundo; a mula
 * marrom-escura empinando no centro, de perfil 3/4; você à direita com a tocha
 * fumegando; a plaquinha MU caída na grama da frente.
 * Paleta: verdes noturnos · marrom de mula · couro · ouro velho.
 * Acento saturado RESERVADO à água (esguicho, gotas, poça).
 */

const SOIL = '#3a2a1e'
const SOIL_DARK = '#2c2017'
const GRASS = '#2f4d2c'
const GRASS_TUFTS = ['#3c6236', '#2a4628', '#466e3c']
const ROCK = '#5a5852'
const FENCE = '#6b5844'
const FENCE_DARK = '#54442f'
const WALL = '#ece6d8'
const ROOF = '#3e4659'
const DOOR = '#5b3b24'
const WINDOW = '#ffcf6a'
const MOON = '#fff1bd'
const MULA = '#4b2f20'
const MULA_ESC = '#3b2418'
const CASCO = '#26201c'
const CORTE = '#7a1c24'
const CARNE = '#a8343f'
const PRATA = '#dfe4ea'
const COURO = '#8a5530'
const COURO_ESC = '#6b3f22'
const OURO = '#e5b43a'
const GRAVADO = '#3a230f'
const SHIRT = '#b5523b'
const SKIN = '#e3b68e'
const HAIR = '#3a2618'
const WOOD = '#8a5a32'
const CHAR = '#2b2522'
const SMOKE = '#8e9095'
const FLAME = '#ff8a1e'
const WATER = '#2f9cff' // ACENTO: a água que vaza

const GY = 0.18 // topo do pasto
const MS = 1.15 // escala da mula
const MULA_POS = new THREE.Vector3(-0.5, GY, -0.3)
const MULA_RY = -0.35 // frente (+x) virada um pouco para a câmera
const PES_POS = new THREE.Vector3(2.0, GY, 0.25)
const PES_RY = -1.05 // olha para a mula

// pescoço: base e direção (espaço da mula, ela olha para +x)
const NECK_TILT = -0.68
const NECK_DIR = new THREE.Vector2(Math.sin(-NECK_TILT), Math.cos(NECK_TILT))
const NECK_BASE = new THREE.Vector2(0.55, 1.12)
const NECK_LEN = 0.74

// ---- letras de traço grosso ------------------------------------------------
function glyph(which: 'L' | 'É' | 'M' | 'U', h: number, color: string) {
  const g = new THREE.Group()
  const t = h * 0.22
  const w = h * 0.72
  const s = (sw: number, sh: number, x: number, y: number, rot = 0) => {
    const b = rbox(sw, sh, 0.03, Math.min(sw, sh) * 0.3, color, { roughness: 0.55 })
    b.position.set(x, y, 0)
    b.rotation.z = rot
    g.add(b)
  }
  const L = -w / 2 + t / 2
  const R = w / 2 - t / 2
  const T = h / 2 - t / 2
  if (which === 'L') {
    s(t, h, L, 0)
    s(w, t, 0, -T)
  } else if (which === 'É') {
    s(t, h, L, 0)
    s(w, t, 0, T)
    s(w * 0.8, t, -w * 0.1, 0)
    s(w, t, 0, -T)
    s(t * 0.8, h * 0.3, w * 0.12, h / 2 + h * 0.22, -0.8) // acento agudo
  } else if (which === 'M') {
    s(t, h, L, 0)
    s(t, h, R, 0)
    const dx = w / 2 - t / 2
    const dy = T + h * 0.12
    const len = Math.hypot(dx, dy) + t * 0.4
    const rot = Math.atan2(dx, dy)
    const my = (T - h * 0.12) / 2
    s(t * 0.95, len, L / 2, my, rot)
    s(t * 0.95, len, R / 2, my, -rot)
  } else {
    s(t, h * 0.86, L, h * 0.07)
    s(t, h * 0.86, R, h * 0.07)
    s(w, t, 0, -T)
  }
  return g
}

/** Dentes de quebra numa borda vertical (lado = -1 esquerda, 1 direita). */
function brokenEdge(g: THREE.Group, x: number, hh: number, color: string, side: number) {
  for (const [y, k] of [[-hh * 0.55, 0.9], [0, 1.15], [hh * 0.55, 0.8]] as const) {
    const d = rbox(0.075 * k, 0.075 * k, 0.03, 0.006, color, { roughness: 0.3, metalness: 0.7 })
    d.rotation.z = Math.PI / 4
    d.position.set(x + side * 0.012, y, 0)
    g.add(d)
  }
}

// ---- água ------------------------------------------------------------------
const agua = new THREE.MeshPhysicalMaterial({
  color: WATER,
  roughness: 0.06,
  metalness: 0,
  transparent: true,
  opacity: 0.8,
  emissive: '#0b5fc0',
  emissiveIntensity: 0.45,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
})

/** Tubo afunilado ao longo de uma curva: jatos d'água que afinam no fim. */
function waterTube(points: THREE.Vector3[], r0: number, r1: number, segs = 48) {
  const curve = new THREE.CatmullRomCurve3(points)
  const radial = 12
  const geo = new THREE.TubeGeometry(curve, segs, 1, radial, false)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (let i = 0; i <= segs; i++) {
    const u = i / segs
    curve.getPointAt(u, c)
    const r = r0 + (r1 - r0) * u
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c)
      pos.setXYZ(k, v.x, v.y, v.z)
    }
  }
  const m = new THREE.Mesh(geo, agua)
  m.receiveShadow = true
  return { mesh: m, curve }
}

function drop(r: number, at: THREE.Vector3) {
  const d = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), agua)
  d.position.copy(at)
  d.scale.y = 1.25
  return d
}

// ---- perna da mula: coxa + joelho dobrável + canela + casco -----------------
function makeLeg(x: number, z: number, hip: number, knee: number, thighR: number) {
  const leg = new THREE.Group()
  const hipY = 0.38 * Math.cos(hip) + 0.47 * Math.cos(hip + knee)
  leg.position.set(x, Math.max(hipY, 0.5), z)
  leg.rotation.z = hip

  const thigh = capsule(thighR, 0.2, MULA, { roughness: 0.8 })
  thigh.position.y = -0.17
  leg.add(thigh)

  const joint = new THREE.Group()
  joint.position.y = -0.38
  joint.rotation.z = knee
  leg.add(joint)

  const kneeBall = sphere(0.078, MULA, { roughness: 0.8 })
  joint.add(kneeBall)
  const cannon = capsule(0.06, 0.24, MULA_ESC, { roughness: 0.8 })
  cannon.position.y = -0.17
  joint.add(cannon)
  const fetlock = sphere(0.074, MULA_ESC, { roughness: 0.8 })
  fetlock.position.y = -0.33
  joint.add(fetlock)
  const hoof = cylinder(0.068, 0.09, 0.1, CASCO, { roughness: 0.5 })
  hoof.position.y = -0.42
  joint.add(hoof)
  return { leg, hoof }
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- pasto à noite -----------------------------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.72, 2.82, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)
  const soilRim = torus(2.77, 0.03, SOIL_DARK, { roughness: 0.95 })
  soilRim.rotation.x = Math.PI / 2
  soilRim.position.y = 0.02
  base.add(soilRim)

  const grass = cylinder(2.68, 2.72, 0.07, GRASS, { roughness: 0.95 })
  grass.position.y = GY - 0.035
  base.add(grass)

  // tufos de capim (fora da poça e dos pés)
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.6 + Math.sqrt(rand()) * 1.95
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    const inPuddle = ((x + 0.15) / 1.55) ** 2 + ((z + 0.1) / 0.85) ** 2 < 1
    const nearPerson = Math.hypot(x - PES_POS.x, z - PES_POS.z) < 0.45
    const nearMu = Math.hypot(x - 0.05, z - 1.25) < 0.45
    if (inPuddle || nearPerson || nearMu) continue
    const tuft = new THREE.Group()
    tuft.position.set(x, GY, z)
    const cor = GRASS_TUFTS[i % GRASS_TUFTS.length]
    for (let k = 0; k < 4; k++) {
      const blade = cone(0.028, 0.16 + rand() * 0.12, cor, { roughness: 0.9 }, 6)
      blade.position.set((rand() - 0.5) * 0.09, 0.08, (rand() - 0.5) * 0.09)
      blade.rotation.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5)
      tuft.add(blade)
    }
    base.add(tuft)
  }

  for (const [x, z, r, s] of [[-2.1, 0.9, 0.17, 3], [1.15, 1.85, 0.12, 7], [-1.0, 1.9, 0.1, 11]] as const) {
    const pedra = rock(r, ROCK, s, { roughness: 0.9 })
    pedra.position.set(x, GY + r * 0.35, z)
    base.add(pedra)
  }

  // cerca de madeira ao fundo, acompanhando a borda
  const fence = new THREE.Group()
  const postsA = [-0.15, 0.25, 0.65, 1.05]
  const fr = 2.35
  const fpts = postsA.map((a) => new THREE.Vector3(Math.sin(a) * fr, 0, -Math.cos(a) * fr))
  for (const p of fpts) {
    const post = rbox(0.09, 0.62, 0.09, 0.02, FENCE_DARK, { roughness: 0.9 })
    post.position.set(p.x, GY + 0.31, p.z)
    fence.add(post)
  }
  for (let i = 0; i < fpts.length - 1; i++) {
    const a = fpts[i]
    const b = fpts[i + 1]
    const len = a.distanceTo(b) + 0.08
    for (const ry of [0.24, 0.46]) {
      const rail = rbox(len, 0.06, 0.04, 0.015, FENCE, { roughness: 0.9 })
      rail.position.set((a.x + b.x) / 2, GY + ry, (a.z + b.z) / 2 + 0.05)
      rail.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x)
      fence.add(rail)
    }
  }
  base.add(fence)
  root.add(base)

  // ---- lua cheia ao fundo ------------------------------------------------------
  const lua = new THREE.Group()
  lua.position.set(-1.4, 2.8, -2.6)
  const disco = cylinder(0.52, 0.52, 0.06, MOON, { emissive: MOON, emissiveIntensity: 1.1 }, 48)
  disco.rotation.x = Math.PI / 2
  disco.castShadow = false
  lua.add(disco)
  for (const [cx, cy, cr] of [[-0.16, 0.12, 0.11], [0.15, -0.14, 0.08], [0.2, 0.18, 0.05], [-0.08, -0.22, 0.06]] as const) {
    const crater = cylinder(cr, cr, 0.02, '#f0d98e', { emissive: '#e8cf80', emissiveIntensity: 0.9 }, 24)
    crater.rotation.x = Math.PI / 2
    crater.position.set(cx, cy, 0.035)
    crater.castShadow = false
    lua.add(crater)
  }
  root.add(lua)

  // ---- igrejinha branca ao fundo --------------------------------------------
  const igreja = new THREE.Group()
  igreja.position.set(-2.2, GY, -0.95)
  igreja.rotation.y = 0.8

  const nave = rbox(0.5, 0.42, 0.66, 0.03, WALL, { roughness: 0.8 })
  nave.position.set(0, 0.21, -0.12)
  igreja.add(nave)
  for (const side of [-1, 1]) {
    const agua1 = rbox(0.34, 0.035, 0.74, 0.012, ROOF, { roughness: 0.7 })
    agua1.position.set(side * 0.13, 0.5, -0.12)
    agua1.rotation.z = -side * 0.62
    igreja.add(agua1)
  }
  const torre = rbox(0.26, 0.72, 0.26, 0.025, WALL, { roughness: 0.8 })
  torre.position.set(0, 0.36, 0.27)
  igreja.add(torre)
  const pinaculo = cone(0.2, 0.3, ROOF, { roughness: 0.7 }, 4)
  pinaculo.rotation.y = Math.PI / 4
  pinaculo.position.set(0, 0.87, 0.27)
  igreja.add(pinaculo)
  const cruzV = rbox(0.035, 0.2, 0.035, 0.01, OURO, { roughness: 0.3, metalness: 0.7 })
  cruzV.position.set(0, 1.11, 0.27)
  igreja.add(cruzV)
  const cruzH = rbox(0.13, 0.035, 0.035, 0.01, OURO, { roughness: 0.3, metalness: 0.7 })
  cruzH.position.set(0, 1.14, 0.27)
  igreja.add(cruzH)
  const porta = rbox(0.12, 0.2, 0.02, 0.04, DOOR, { roughness: 0.8 })
  porta.position.set(0, 0.1, 0.405)
  igreja.add(porta)
  const janela = rbox(0.08, 0.11, 0.02, 0.03, WINDOW, { emissive: WINDOW, emissiveIntensity: 0.9 })
  janela.position.set(0, 0.48, 0.405)
  igreja.add(janela)
  for (const z of [-0.3, 0.0]) {
    const jl = rbox(0.02, 0.13, 0.08, 0.01, WINDOW, { emissive: WINDOW, emissiveIntensity: 0.9 })
    jl.position.set(0.255, 0.25, z)
    igreja.add(jl)
  }
  root.add(igreja)

  // ---- MULA-SEM-CABEÇA (olha para +x; chão local em y=0) ----------------------
  const mula = new THREE.Group()
  mula.position.copy(MULA_POS)
  mula.rotation.y = MULA_RY
  mula.scale.setScalar(MS)
  root.add(mula)

  const barril = capsule(0.36, 0.9, MULA, { roughness: 0.8 })
  barril.rotation.z = Math.PI / 2
  barril.position.y = 1.0
  mula.add(barril)
  const peito = sphere(0.37, MULA, { roughness: 0.8 })
  peito.position.set(0.5, 1.03, 0)
  mula.add(peito)
  const anca = sphere(0.4, MULA, { roughness: 0.8 })
  anca.scale.set(1, 0.95, 0.98)
  anca.position.set(-0.52, 1.08, 0)
  mula.add(anca)
  const barriga = sphere(0.33, MULA_ESC, { roughness: 0.85 })
  barriga.scale.set(1.5, 0.75, 0.95)
  barriga.position.set(0, 0.82, 0)
  mula.add(barriga)

  // pescoço cortado reto, inclinado para a frente
  const neckC = NECK_BASE.clone().addScaledVector(NECK_DIR, NECK_LEN / 2)
  const neckTopL = NECK_BASE.clone().addScaledVector(NECK_DIR, NECK_LEN)
  const pescoco = cylinder(0.18, 0.27, NECK_LEN, MULA, { roughness: 0.8 })
  pescoco.position.set(neckC.x, neckC.y, 0)
  pescoco.rotation.z = NECK_TILT
  mula.add(pescoco)

  const corte = cylinder(0.2, 0.2, 0.07, CORTE, { roughness: 0.6 })
  corte.position.set(neckTopL.x, neckTopL.y, 0)
  corte.rotation.z = NECK_TILT
  mula.add(corte)
  const carne = cylinder(0.14, 0.14, 0.08, CARNE, { roughness: 0.5 })
  carne.position.set(neckTopL.x + NECK_DIR.x * 0.008, neckTopL.y + NECK_DIR.y * 0.008, 0)
  carne.rotation.z = NECK_TILT
  mula.add(carne)

  // crina curta ao longo do dorso do pescoço
  const nBack = new THREE.Vector2(-NECK_DIR.y, NECK_DIR.x)
  for (let i = 0; i < 6; i++) {
    const t = 0.12 + i * 0.15
    const r = 0.27 + (0.18 - 0.27) * t
    const c = NECK_BASE.clone().addScaledVector(NECK_DIR, t * NECK_LEN).addScaledVector(nBack, r * 0.82)
    const tufo = sphere(0.075, MULA_ESC, { roughness: 0.9 })
    tufo.scale.set(1.1, 1.0, 0.7)
    tufo.position.set(c.x, c.y, 0)
    mula.add(tufo)
  }

  // cauda de mula esvoaçando para trás, com o tufo na ponta
  const caudaDir = new THREE.Vector2(-0.6, -0.8).normalize()
  const caudaRoot = new THREE.Vector2(-0.88, 1.18)
  const cauda = capsule(0.045, 0.5, MULA_ESC, { roughness: 0.85 })
  const cc = caudaRoot.clone().addScaledVector(caudaDir, 0.3)
  cauda.position.set(cc.x, cc.y, 0)
  cauda.rotation.z = Math.atan2(-caudaDir.x, caudaDir.y)
  mula.add(cauda)
  const vassoura = sphere(0.1, MULA_ESC, { roughness: 0.9 })
  vassoura.scale.set(1.6, 0.8, 0.8)
  const vc = caudaRoot.clone().addScaledVector(caudaDir, 0.62)
  vassoura.position.set(vc.x, vc.y, 0)
  vassoura.rotation.z = Math.atan2(caudaDir.y, caudaDir.x)
  mula.add(vassoura)

  // patas em galope empinado: dianteira de perto dobrada no ar
  const legs = [
    makeLeg(0.5, 0.17, 0.95, -1.95, 0.12), // dianteira perto: erguida
    makeLeg(0.52, -0.17, -0.15, 0.12, 0.12), // dianteira longe: apoiada
    makeLeg(-0.52, 0.19, 0.28, -0.5, 0.15), // traseira perto
    makeLeg(-0.45, -0.19, -0.25, 0.25, 0.15), // traseira longe
  ]
  for (const { leg } of legs) mula.add(leg)

  // marcador do topo do pescoço (de onde sai o jato)
  const neckTop = new THREE.Object3D()
  neckTop.position.set(neckTopL.x + NECK_DIR.x * 0.03, neckTopL.y + NECK_DIR.y * 0.03, 0)
  mula.add(neckTop)
  const neckOut = new THREE.Object3D()
  neckOut.position.set(neckTopL.x + NECK_DIR.x * 0.4, neckTopL.y + NECK_DIR.y * 0.4, 0)
  mula.add(neckOut)

  // ---- ferraduras prateadas (sub-peça: anéis na base dos cascos) -------------
  const ferraduras = new THREE.Group()
  mula.add(ferraduras)
  mula.updateMatrixWorld(true)
  const mulaInv = mula.matrixWorld.clone().invert()
  for (const { hoof } of legs) {
    const holder = new THREE.Group()
    const rel = mulaInv.clone().multiply(hoof.matrixWorld)
    rel.decompose(holder.position, holder.quaternion, holder.scale)
    const shoe = new THREE.Mesh(
      new THREE.TorusGeometry(0.093, 0.024, 10, 28, Math.PI * 1.6),
      mat(PRATA, { roughness: 0.18, metalness: 0.9, size: 0.2 }),
    )
    shoe.castShadow = true
    shoe.receiveShadow = true
    shoe.rotation.set(Math.PI / 2, 0, Math.PI * 1.2)
    shoe.position.y = -0.03
    holder.add(shoe)
    ferraduras.add(holder)
  }

  // ---- peitoral de couro com a plaquinha LÉ (sub-peça) ------------------------
  const peitoral = new THREE.Group()
  peitoral.position.set(0.5, 1.0, 0)
  mula.add(peitoral)

  const colar = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.04, 12, 48, 3.5), mat(COURO, { roughness: 0.6, size: 0.8 }))
  colar.castShadow = true
  colar.receiveShadow = true
  colar.rotation.set(Math.PI / 2, 0, -1.75)
  peitoral.add(colar)
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.032, 10, 40, Math.PI), mat(COURO_ESC, { roughness: 0.6, size: 0.8 }))
  alca.castShadow = true
  alca.rotation.y = Math.PI / 2
  alca.position.set(-0.1, 0.02, 0)
  peitoral.add(alca)
  for (const s of [-1, 1]) {
    const fivela = rbox(0.06, 0.07, 0.03, 0.01, OURO, { roughness: 0.3, metalness: 0.75 })
    fivela.position.set(-0.08, 0.0, s * 0.42)
    fivela.rotation.y = Math.PI / 2
    peitoral.add(fivela)
  }

  const PLATE_A = 1.0 // ângulo no colar (0 = frente, π/2 = flanco virado à câmera)
  const placa = new THREE.Group()
  placa.position.set(Math.cos(PLATE_A) * 0.46, -0.07, Math.sin(PLATE_A) * 0.46)
  placa.rotation.y = Math.PI / 2 - (PLATE_A + 0.12)
  peitoral.add(placa)
  const PW = 0.44
  const PH = 0.3
  const chapa = rbox(PW, PH, 0.035, 0.04, OURO, { roughness: 0.28, metalness: 0.75 })
  placa.add(chapa)
  brokenEdge(placa, -PW / 2, PH / 2, OURO, -1) // onde estava o MU
  const LH = 0.16
  for (const [gch, gx] of [['L', -0.085], ['É', 0.09]] as const) {
    const gl = glyph(gch, LH, GRAVADO)
    gl.position.set(gx, -0.025, 0.025)
    placa.add(gl)
  }
  for (const rx of [-0.17, 0.17]) {
    const rebite = sphere(0.016, '#b98a24', { roughness: 0.3, metalness: 0.8 })
    rebite.position.set(rx, PH / 2 - 0.04, 0.02)
    placa.add(rebite)
  }

  // ---- pedaço MU caído na grama ---------------------------------------------
  const mu = new THREE.Group()
  const MU_FINAL = new THREE.Vector3(0.05, GY + 0.1, 1.25)
  const MU_RX = -0.95
  const MU_RY = 0.1
  mu.position.copy(MU_FINAL)
  mu.rotation.set(MU_RX, MU_RY, 0.06)
  const caco = rbox(0.5, 0.3, 0.035, 0.04, OURO, { roughness: 0.28, metalness: 0.75 })
  mu.add(caco)
  brokenEdge(mu, 0.25, 0.15, OURO, 1)
  for (const [gch, gx] of [['M', -0.1], ['U', 0.1]] as const) {
    const gl = glyph(gch, 0.18, GRAVADO)
    gl.position.set(gx, 0, 0.025)
    mu.add(gl)
  }
  root.add(mu)
  const calco = rock(0.08, ROCK, 19, { roughness: 0.9 })
  calco.position.set(0.05, GY + 0.04, 1.1)
  base.add(calco)

  // ---- você: encharcado, tocha estendida -------------------------------------
  const pessoa = person({ body: SHIRT, skin: SKIN, height: 1.5, armAngle: 0.3 })
  pessoa.position.copy(PES_POS)
  pessoa.rotation.y = PES_RY
  root.add(pessoa)

  const head = pessoa.getObjectByName('head') as THREE.Group
  const cabelo = sphere(0.3, HAIR, { roughness: 0.9 })
  cabelo.scale.set(1.0, 0.62, 1.0)
  cabelo.position.set(0, 0.12, -0.06)
  head.add(cabelo)
  const franja = puff(0.08, HAIR, 4, 13, { roughness: 0.9 })
  franja.position.set(0.02, 0.2, 0.16)
  franja.scale.set(1.6, 0.6, 0.8)
  head.add(franja)
  const boca = sphere(0.05, '#5a2320', { roughness: 0.6 })
  boca.scale.set(0.9, 1.15, 0.5)
  boca.position.set(0, -0.11, 0.25)
  head.add(boca)
  // pingos escorrendo: encharcado
  for (const [dx, dy, dz, r] of [[0.2, 0.05, 0.16, 0.03], [-0.22, -0.02, 0.12, 0.026], [0.12, 0.26, 0.12, 0.024]] as const) {
    head.add(drop(r, new THREE.Vector3(dx, dy, dz)))
  }

  const braco = pessoa.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(braco, 1.5)

  // tocha na mão (filha do braço)
  const hand = braco.children[0]
  const tocha = new THREE.Group()
  tocha.position.copy(hand.position)
  braco.add(tocha)
  const cabo = lathe(
    [[0, -0.14], [0.026, -0.14], [0.032, -0.12], [0.03, 0.3], [0.042, 0.36], [0, 0.36]],
    WOOD,
    { roughness: 0.7 },
  )
  tocha.add(cabo)
  const trapo = cylinder(0.08, 0.062, 0.17, CHAR, { roughness: 0.95 })
  trapo.position.y = 0.44
  tocha.add(trapo)
  for (const by of [0.39, 0.48]) {
    const faixa = torus(0.074, 0.016, '#5a4434', { roughness: 0.9 })
    faixa.rotation.x = Math.PI / 2
    faixa.position.y = by
    tocha.add(faixa)
  }
  const brasa = sphere(0.075, '#1e1a18', { roughness: 0.95 })
  brasa.scale.y = 0.45
  brasa.position.y = 0.53
  tocha.add(brasa)
  const tochaTopo = new THREE.Object3D()
  tochaTopo.position.y = 0.58
  tocha.add(tochaTopo)

  // chama (sub-peça): acende e depois é apagada pelo jato — pose final: sumida
  const chama = new THREE.Group()
  chama.position.y = 0.55
  const fogo = cone(0.085, 0.28, FLAME, { emissive: FLAME, emissiveIntensity: 1.4 }, 16)
  fogo.position.y = 0.12
  fogo.castShadow = false
  chama.add(fogo)
  const miolo = cone(0.045, 0.16, '#ffe07a', { emissive: '#ffd34d', emissiveIntensity: 1.6 }, 16)
  miolo.position.set(0, 0.08, 0.02)
  miolo.castShadow = false
  chama.add(miolo)
  chama.scale.setScalar(0.01)
  tocha.add(chama)

  // mira o braço no MUNDO: estendido na direção da mula, um pouco acima da horizontal
  root.updateMatrixWorld(true)
  const pesQ = new THREE.Quaternion()
  pessoa.getWorldQuaternion(pesQ)
  braco.quaternion.copy(
    pesQ.invert().multiply(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(-0.9, 0.12, 0.3).normalize(),
      ),
    ),
  )
  const ARM_X = braco.rotation.x

  // orienta a tocha no MUNDO: para cima e em direção à mula
  root.updateMatrixWorld(true)
  const armQ = new THREE.Quaternion()
  braco.getWorldQuaternion(armQ)
  const want = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-0.62, 0.76, 0.1).normalize(),
  )
  tocha.quaternion.copy(armQ.invert().multiply(want))
  root.updateMatrixWorld(true)

  const P0 = new THREE.Vector3()
  neckTop.getWorldPosition(P0)
  const POut = new THREE.Vector3()
  neckOut.getWorldPosition(POut)
  const T = new THREE.Vector3()
  tochaTopo.getWorldPosition(T)

  // ---- fumaça da tocha apagada -------------------------------------------------
  const fumaca = new THREE.Group()
  fumaca.position.copy(T)
  for (let i = 0; i < 5; i++) {
    const r = 0.06 + i * 0.022
    const f = puff(r, i < 2 ? '#6f7176' : SMOKE, 4, 70 + i, { roughness: 1 })
    f.position.set(0.05 + i * 0.075 + Math.sin(i * 1.7) * 0.04, 0.12 + i * 0.16, 0.04 + i * 0.03)
    fumaca.add(f)
  }
  root.add(fumaca)

  // ---- o esguicho que VAZA do pescoço -----------------------------------------
  const jato = new THREE.Group()
  jato.position.copy(P0)
  root.add(jato)

  const rel = (v: THREE.Vector3) => v.clone().sub(P0)
  const dirOut = rel(POut).normalize()
  const to = rel(T).add(new THREE.Vector3(0, 0.05, 0))
  const apex = new THREE.Vector3(to.x * 0.45, Math.max(0, to.y) + 0.58, to.z * 0.45)
  const mainPts = [
    new THREE.Vector3(0, 0, 0),
    dirOut.clone().multiplyScalar(0.32),
    apex,
    new THREE.Vector3(to.x * 0.85, to.y + 0.42, to.z * 0.85),
    to,
  ]
  const principal = waterTube(mainPts, 0.085, 0.045)
  jato.add(principal.mesh)

  const bolha = drop(0.1, new THREE.Vector3(0, 0.04, 0))
  bolha.scale.set(1, 0.55, 1)
  jato.add(bolha)

  // espirra pra todo lado: jatos menores que se desfazem em gotas
  const sprays: [number, number, number, number][] = [
    [-0.75, 0.25, 0.15, 0.4],
    [-0.2, 0.05, -0.75, 0.45],
    [-0.15, 0.1, 0.8, 0.36],
    [0.55, 0.0, -0.55, 0.32],
  ]
  for (const [dx, dz, dz2, h] of sprays) {
    const d = new THREE.Vector3(dx, 0, dz2 + dz).normalize()
    const pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(d.x * 0.16, h * 0.6, d.z * 0.16),
      new THREE.Vector3(d.x * 0.42, h, d.z * 0.42),
      new THREE.Vector3(d.x * 0.7, h * 0.7, d.z * 0.7),
    ]
    const sp = waterTube(pts, 0.04, 0.012, 24)
    jato.add(sp.mesh)
    for (let k = 1; k <= 3; k++) {
      const at = new THREE.Vector3(d.x * (0.78 + k * 0.1), h * 0.6 - k * 0.15, d.z * (0.78 + k * 0.1))
      jato.add(drop(0.032 - k * 0.006, at))
    }
  }

  // respingos na tocha e o fio que escorre até o chão
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2
    const at = to.clone().add(new THREE.Vector3(Math.cos(a) * 0.14, 0.04 + (k % 2) * 0.05, Math.sin(a) * 0.14))
    jato.add(drop(0.026, at))
  }
  const ground = new THREE.Vector3(to.x + 0.04, GY - P0.y + 0.01, to.z + 0.02)
  const fio = waterTube(
    [to.clone().add(new THREE.Vector3(0, -0.08, 0)), to.clone().lerp(ground, 0.5).add(new THREE.Vector3(0.01, 0, 0)), ground],
    0.032,
    0.02,
    24,
  )
  jato.add(fio.mesh)

  // ---- poça d'água embaixo da mula -------------------------------------------
  const poca = new THREE.Group()
  poca.position.set(-0.15, GY + 0.004, -0.1)
  root.add(poca)
  const pocaMat = new THREE.MeshStandardMaterial({
    color: '#2a86e0',
    roughness: 0.05,
    metalness: 0.2,
    emissive: '#0a4aa8',
    emissiveIntensity: 0.35,
  })
  // manchas em coordenadas do MUNDO (x, z, raio, esticada em x, em z)
  const landX = ground.x + P0.x
  const landZ = ground.z + P0.z
  const blobs: [number, number, number, number, number][] = [
    [-0.15, -0.1, 1.0, 1.45, 0.8],
    [0.75, 0.25, 0.5, 1.3, 0.9],
    [landX + 0.1, landZ + 0.05, 0.42, 1.2, 1.0],
  ]
  for (const [bx, bz, r, sx, sz] of blobs) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 40), pocaMat)
    b.receiveShadow = true
    b.scale.set(sx, 1, sz)
    b.position.set(bx - poca.position.x, 0, bz - poca.position.z)
    poca.add(b)
  }
  for (const rr of [0.16, 0.28]) {
    const ring = torus(rr, 0.012, '#8fd0ff', { roughness: 0.1 })
    ring.rotation.x = Math.PI / 2
    ring.position.set(landX - poca.position.x, 0.015, landZ - poca.position.z)
    poca.add(ring)
  }

  // ---- peças ---------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'pasto', object: base },
    { name: 'lua', group: 'pasto', object: lua },
    { name: 'igreja', group: 'pasto', object: igreja },
    { name: 'mula', group: 'mula', object: mula },
    { name: 'ferraduras', group: 'mula', object: ferraduras },
    { name: 'peitoral', group: 'placa', object: peitoral },
    { name: 'mu', group: 'placa', object: mu },
    { name: 'jato', group: 'vaza', object: jato },
    { name: 'poca', group: 'vaza', object: poca },
    { name: 'pessoa', group: 'tocha', object: pessoa },
    { name: 'braco', group: 'tocha', object: braco },
    { name: 'chama', group: 'tocha', object: chama },
    { name: 'fumaca', group: 'psss', object: fumaca },
  ]

  // ---- montagem ----------------------------------------------------------------------
  const sc = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const muStart = new THREE.Vector3()
  placa.getWorldPosition(muStart)
  muStart.x -= 0.3

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Quinta-feira de lua cheia, num pasto escuro atrás da igrejinha do padre…',
    }),
    seq('lua-nasce', 'lua', 0.6, 0.8, [...sc(0.01, 1), ch('position.y', 2.0, 2.8)], { ease: 'easeOut' }),
    seq('igreja-rise', 'igreja', 0.9, 0.7, [riseFrom(GY, 1.3)], { ease: 'easeOut' }),

    seq('mula-rise', 'mula', 2.0, 1.0, [riseFrom(GY, 2.8), ch('rotation.y', MULA_RY - 0.6, MULA_RY)], {
      ease: 'easeOut',
      caption: '…a MULÉ do padre vira mula-sem-cabeça e sai a galope, de ferraduras prateadas.',
    }),
    seq('ferraduras-crava', 'ferraduras', 3.0, 0.35, [ch('position.y', 0.3, 0)], { ease: 'easeIn' }),

    seq('peitoral-cresce', 'peitoral', 4.0, 0.5, sc(0.01, 1), {
      ease: 'easeOut',
      caption: 'Sem cabeça, até o nome perde a cabeça: da plaquinha MULÉ cai o MU — sobra só LÉ.',
    }),
    seq('mu-cai', 'mu', 4.7, 0.75, [
      ch('position.x', muStart.x, MU_FINAL.x),
      ch('position.y', muStart.y, MU_FINAL.y),
      ch('position.z', muStart.z, MU_FINAL.z),
      ch('rotation.x', 0, MU_RX),
      ch('rotation.y', -0.6, MU_RY),
    ], { ease: 'easeIn' }),

    seq('jato-vaza', 'jato', 6.2, 0.9, sc(0.01, 1), {
      ease: 'easeOut',
      caption: 'Era pra sair fogo do pescoço… mas ele VAZA: um esguicho d’água espirra pra todo lado.',
    }),
    seq('poca-alaga', 'poca', 6.6, 1.1, [ch('scale.x', 0.05, 1), ch('scale.z', 0.05, 1)], { ease: 'easeOut' }),

    seq('pessoa-rise', 'pessoa', 8.0, 0.8, [riseFrom(GY, 1.8)], {
      ease: 'easeOut',
      caption: 'Você estende uma tocha acesa pra reacender o fogo: “LÉ, QUER?”',
    }),
    seq('braco-estende', 'braco', 8.6, 0.6, [ch('rotation.x', ARM_X + 1.3, ARM_X)], { ease: 'easeOut' }),
    seq('chama-acende', 'chama', 8.6, 0.4, sc(0.01, 1), { ease: 'easeOut' }),

    seq('chama-apaga', 'chama', 10.0, 0.3, sc(1, 0.01), {
      ease: 'easeIn',
      caption: '…e o vazamento apaga a tocha na sua mão: PSSS!',
    }),
    seq('fumaca-sobe', 'fumaca', 10.15, 1.0, [...sc(0.01, 1), ch('position.y', T.y - 0.15, T.y)], { ease: 'easeOut' }),

    seq('poca-onda', 'poca', 11.5, 0.6, [ch('scale.x', 1.08, 1), ch('scale.z', 1.08, 1)], {
      ease: 'easeOut',
      caption: 'Encharcado, você aponta o pescoço e emenda num fôlego só: DÊ… LÉ-QUER… VÁT-TEN!',
    }),
    seq('jato-pulsa', 'jato', 12.9, 0.5, sc(1.1, 1), {
      ease: 'easeOut',
      caption: 'Det läcker vatten. — Está vazando água.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.7, 6.1], target: [0.2, 1.38, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-lacker-vatten',
    contexto:
      "Moradia: ligando ou mandando mensagem pra administradora do prédio (hyresvärden) ou pro zelador (fastighetsskötaren), ou batendo na porta do vizinho de baixo, quando o teto pinga, a lava-louça vaza ou um cano estoura — fora do horário comercial, a administradora costuma ter plantão (jour). Diga onde: 'Det läcker vatten i badrummet' (no banheiro), '…under diskbänken' (debaixo da pia).",
    fraseFonte: 'Está vazando água.',
    fraseAlvo: 'Det läcker vatten.',
    pronuncia:
      "dê LÉK-ker VÁT-ten ('det' = dê, o T não soa; 'läcker' com a força no LÄ: É aberto e CURTO, o K dobrado e seco — a língua segura um instante — e o -er fraquinho, mas com R brando; 'vatten' com A curto e o T segurado um instante, VÁT-ten, e o -en fraco, sem nasal)",
    ponteSonora:
      "DÊ... (mu)LÉ, QUER?... VÁT-TEN! (5 sílabas: dê-LÉK-ker-VÁT-ten; força no LÉ e no VÁT; DÊ = o 'det' de sempre, de 'Det är lugnt' e 'Det låter kul!': Ê FECHADO e sem T; (mu)LÉ, QUER = 'MULÉ, QUER?' sem o MU: a mula-sem-cabeça é a MULÉ do padre da lenda (mulher, do jeito que se fala na roça), e sem cabeça até o nome perde a cabeça — cai o MU, sobra LÉ; ATENÇÃO: é MULÉ, de É ABERTO de 'pé', nunca o LA de 'mula'; LÉ com É aberto e CURTO, e a força; o QUER vem COLADO e fraco, num fôlego só — LÉ-quer —, com o K seguro um instante (é o 'ck', dobrado) e o R brando no fim: é o R do presente, OBRIGATÓRIO — sem ele sobra 'läcka', o infinitivo; e não confunda com o (ge)LÉ-CA-re de 'läkare' (médico): lá o É é LONGO e são três sílabas; aqui é CURTO, K dobrado, duas sílabas; VÁT-TEN = o MESMO 'VÁ, TEN(ente)!' de 'Kan jag få lite vatten?': A CURTO e a língua segura o T um instante — nada do VÁ comprido de 'vad' —, TEN com T duro e N na língua, sem nasal, e força no VÁT)",
    historia:
      "Quinta-feira de lua cheia: a MULÉ do padre vira mula-sem-cabeça — e, sem cabeça, até o nome perde a cabeça: da plaquinha do peitoral cai o MU, sobra só LÉ. Era pra ela sair galopando com uma labareda no lugar da cabeça, mas hoje o pescoço VAZA: um esguicho d'água espirra pra todo lado e alaga o pasto. Você estende uma tocha acesa pra reacender o fogo — 'LÉ, QUER?' — e o vazamento apaga a tocha na sua mão: PSSS. Encharcado, você aponta o pescoço dela e emenda tudo num fôlego só — DÊ... LÉ-QUER... VÁT-TEN! —, e dessa vez nem precisa chamar tenente nenhum: água é o que não falta. Está vazando água.",
  },
  createScene,
  refine: { organic: ['mula'] },
}

export default card
