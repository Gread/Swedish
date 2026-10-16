import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Vad gör du på fritiden?" — VÁ! IÖR-DÜ... PÔ! FREE... (par)TÍD-EN?
 *
 * Domingo no parque: na beira de uma roda de capoeira vazia, um mastro com a
 * BANDEIRA quadriculada de parTIDA e a plaquinha amarela FREE. O capoeirista
 * de abadá branco, em ginga, solta o VÁ! de desafio, estica o arame do
 * berimbau até ranger (iiiÖR — três riscos amarelos) e aponta o berimbau pro
 * sueco que passa: DÜ? PÔ!
 *
 * O amarelo saturado é reservado à ponte: a plaquinha FREE e o rangido.
 */

const SOIL = '#4a3a2a'
const GRASS = '#5f8f45'
const GRASS_DARK = '#4a7537'
const GRASS_LIGHT = '#7aa957'
const DIRT = '#cdb48a'
const DIRT_DARK = '#a98f66'
const WOOD = '#8a5a2e'
const WOOD_LIGHT = '#b98a55'
const WOOD_DARK = '#5e3d20'
const IRON = '#3d4248'
const WHITE = '#f3f1ea'
const WHITE_SH = '#e6e2d8'
const SKIN = '#8d5a3b'
const HAIR = '#1d1a1a'
const MOUTH = '#4a1c1a'
const BLACK = '#1f1f24'
const SILVER = '#cfd5da'
const GOURD = '#c98a3f'
const GOURD_DARK = '#9a6428'
const CORD_GREEN = '#2f8a4a'
const CORD_YELLOW = '#e2b43a'
const ACCENT = '#f5c518' // reservado: plaquinha FREE e rangido do arame

const GY = 0.17 // topo do gramado
const H = 1.5 // altura de person()
const FOOT = 0.43 // dos pés (fundo) ao quadril de person() no espaço local
const PX = -0.08
const PZ = 0.2
const PY = GY + FOOT
const PYAW = 0.2
const POLE: [number, number, number] = [-1.42, GY, -0.4]
const POLE_H = 2.15
const PLAQUE_Y = GY + 1.38 // prego da plaquinha
const FLAG_YAW = 0.32
const CAM: [number, number, number] = [0.35, 1.95, 4.7]

const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula ligando dois pontos (pernas, cordões). */
function limb(r: number, a: THREE.Vector3, b: THREE.Vector3, color: string, opts?: MatOpts) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Cilindro fino ligando dois pontos (arame, cordinhas). */
function link(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = new THREE.Vector3().subVectors(b, a)
  const c = cylinder(r, r, d.length(), color, opts, 10)
  c.position.copy(a).addScaledVector(d, 0.5)
  c.quaternion.setFromUnitVectors(UP, d.normalize())
  return c
}

/** Rotação (x, z) que aponta o braço (eixo -y) na direção dada. */
function aimArm(dir: THREE.Vector3) {
  const d = dir.clone().normalize()
  const z = Math.asin(THREE.MathUtils.clamp(d.x, -1, 1))
  const cz = Math.cos(z)
  const x = Math.atan2(-d.z / cz, -d.y / cz)
  return { x, z }
}

/** Traço de letra: caixinha preta em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.025, 0.006, BLACK, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** F R E E — letras de traço grosso. */
function letter(which: 'F' | 'R' | 'E') {
  const g = new THREE.Group()
  const t = 0.03
  const h = 0.15
  if (which === 'F') {
    g.add(stroke(t, h, -0.03, 0))
    g.add(stroke(0.08, t, 0.01, h / 2 - t / 2))
    g.add(stroke(0.06, t, 0.0, 0.0))
  } else if (which === 'E') {
    g.add(stroke(t, h, -0.03, 0))
    g.add(stroke(0.08, t, 0.01, h / 2 - t / 2))
    g.add(stroke(0.06, t, 0.0, 0.0))
    g.add(stroke(0.08, t, 0.01, -h / 2 + t / 2))
  } else {
    g.add(stroke(t, h, -0.03, 0))
    g.add(stroke(0.065, t, 0.0, h / 2 - t / 2))
    g.add(stroke(0.065, t, 0.0, 0.0))
    g.add(stroke(t, 0.075, 0.03, 0.035))
    g.add(stroke(t, 0.085, 0.022, -0.04, 0.45))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- base: gramado do parque ----------------------------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)
  const lawn = cylinder(2.56, 2.62, 0.05, GRASS, { roughness: 0.95 })
  lawn.position.y = 0.145
  base.add(lawn)

  // tufos de grama espalhados longe da roda
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.55 + rand() * 0.85
    const tuft = new THREE.Group()
    tuft.position.set(Math.cos(a) * r, GY, Math.sin(a) * r)
    for (let k = 0; k < 3; k++) {
      const blade = cone(0.03, 0.12 + rand() * 0.06, k === 1 ? GRASS_LIGHT : GRASS_DARK, { roughness: 0.9 }, 8)
      blade.position.set((k - 1) * 0.03, 0.06, (rand() - 0.5) * 0.03)
      blade.rotation.z = (k - 1) * 0.35
      tuft.add(blade)
    }
    base.add(tuft)
  }

  // arbustos no fundo
  for (const [bx, bz, br, s] of [[-0.35, -2.0, 0.42, 3], [0.65, -2.05, 0.36, 5], [1.85, -1.3, 0.38, 7], [-2.05, -1.1, 0.34, 9]] as const) {
    const bush = puff(br, GRASS_DARK, 6, s, { roughness: 0.92 })
    bush.position.set(bx, GY + br * 0.55, bz)
    bush.scale.y = 0.8
    base.add(bush)
  }

  // banco de praça no fundo à direita
  const banco = new THREE.Group()
  banco.position.set(1.55, GY, -1.05)
  banco.rotation.y = -0.55
  for (let k = 0; k < 3; k++) {
    const slat = rbox(1.0, 0.035, 0.1, 0.012, WOOD_LIGHT, { roughness: 0.75 })
    slat.position.set(0, 0.42, -0.12 + k * 0.12)
    banco.add(slat)
  }
  for (let k = 0; k < 2; k++) {
    const back = rbox(1.0, 0.09, 0.03, 0.012, WOOD_LIGHT, { roughness: 0.75 })
    back.position.set(0, 0.58 + k * 0.13, -0.22)
    back.rotation.x = -0.12
    banco.add(back)
  }
  for (const sx of [-0.42, 0.42]) {
    const legF = rbox(0.04, 0.42, 0.04, 0.01, IRON, { roughness: 0.4, metalness: 0.6 })
    legF.position.set(sx, 0.21, 0.1)
    banco.add(legF)
    const legB = rbox(0.04, 0.78, 0.04, 0.01, IRON, { roughness: 0.4, metalness: 0.6 })
    legB.position.set(sx, 0.39, -0.21)
    legB.rotation.x = -0.1
    banco.add(legB)
  }
  base.add(banco)

  const pedra = rock(0.13, '#8a857c', 11, { roughness: 0.9 })
  pedra.position.set(1.95, GY + 0.04, 0.9)
  base.add(pedra)
  root.add(base)

  // ---- a roda: círculo de terra batida -------------------------------------
  const roda = new THREE.Group()
  roda.position.set(0.0, GY, 0.1)
  const terra = cylinder(1.3, 1.36, 0.024, DIRT, { roughness: 0.95 })
  terra.position.y = 0.012
  roda.add(terra)
  const borda = torus(1.33, 0.025, DIRT_DARK, { roughness: 0.95 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.02
  roda.add(borda)
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.4 + rand() * 0.8
    const seixo = rock(0.03 + rand() * 0.02, DIRT_DARK, 20 + i, { roughness: 0.9 })
    seixo.position.set(Math.cos(a) * r, 0.03, Math.sin(a) * r)
    roda.add(seixo)
  }
  root.add(roda)

  // ---- mastro de madeira -----------------------------------------------------
  const mastro = new THREE.Group()
  mastro.position.set(...POLE)
  const vara = cylinder(0.03, 0.038, POLE_H, WOOD, { roughness: 0.75 })
  vara.position.y = POLE_H / 2
  mastro.add(vara)
  const ponta = sphere(0.055, WOOD_DARK, { roughness: 0.5 })
  ponta.position.y = POLE_H + 0.03
  mastro.add(ponta)
  const monte = puff(0.13, DIRT_DARK, 4, 13, { roughness: 0.95 })
  monte.scale.y = 0.4
  monte.position.y = 0.02
  mastro.add(monte)
  const prego = cylinder(0.012, 0.012, 0.08, IRON, { roughness: 0.4, metalness: 0.7 }, 8)
  prego.rotation.x = Math.PI / 2
  prego.position.set(0, PLAQUE_Y - GY, 0.05)
  mastro.add(prego)
  root.add(mastro)

  // ---- bandeira quadriculada de partida ---------------------------------------
  const bandeira = new THREE.Group()
  bandeira.position.set(POLE[0], POLE[1] + POLE_H - 0.27, POLE[2])
  bandeira.rotation.y = FLAG_YAW
  const COLS = 6
  const ROWS = 4
  const SQ = 0.11
  for (let i = 0; i < COLS; i++) {
    const col = new THREE.Group()
    col.position.set(0.04 + SQ / 2 + i * SQ, 0, 0.035 * Math.sin(i * 1.25))
    col.rotation.y = -0.22 * Math.cos(i * 1.25)
    for (let j = 0; j < ROWS; j++) {
      const black = (i + j) % 2 === 0
      const sq = rbox(SQ + 0.004, SQ, 0.014, 0.003, black ? BLACK : WHITE, { roughness: 0.8 })
      sq.position.y = (j - (ROWS - 1) / 2) * SQ
      col.add(sq)
    }
    bandeira.add(col)
  }
  for (const ry of [-0.17, 0.17]) {
    const anel = torus(0.045, 0.01, WOOD_DARK, { roughness: 0.6 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = ry
    bandeira.add(anel)
  }
  root.add(bandeira)

  // ---- plaquinha FREE pendurada no prego --------------------------------------
  const placa = new THREE.Group()
  placa.position.set(POLE[0], PLAQUE_Y, POLE[2] + 0.09)
  placa.rotation.y = FLAG_YAW
  const tabua = rbox(0.6, 0.26, 0.04, 0.03, ACCENT, { roughness: 0.45 })
  tabua.position.y = -0.3
  placa.add(tabua)
  const moldura = rbox(0.56, 0.22, 0.01, 0.02, '#e0ae0c', { roughness: 0.5 })
  moldura.position.set(0, -0.3, 0.017)
  placa.add(moldura)
  const glyphs: ['F' | 'R' | 'E', number][] = [['F', -0.17], ['R', -0.055], ['E', 0.06], ['E', 0.175]]
  for (const [gch, lx] of glyphs) {
    const l = letter(gch)
    l.position.set(lx, -0.3, 0.03)
    placa.add(l)
  }
  const nail = new THREE.Vector3(0, 0, 0)
  for (const sx of [-1, 1]) {
    placa.add(link(nail, new THREE.Vector3(sx * 0.24, -0.18, 0), 0.008, '#6b5a3c', { roughness: 0.9 }))
  }
  root.add(placa)

  // ---- capoeirista em ginga ------------------------------------------------
  const capo = person({ body: WHITE, skin: SKIN, height: H, armAngle: 0.3 })
  capo.position.set(PX, PY, PZ)
  capo.rotation.y = PYAW
  root.add(capo)

  // tronco encurtado: as pernas da ginga ficam por baixo
  const corpo = capo.getObjectByName('body') as THREE.Mesh
  const bodyH = H * 0.52
  corpo.scale.y = 0.62
  corpo.position.y = bodyH - (bodyH / 2) * 0.62

  // quadril e pernas da calça de abadá, joelhos dobrados e pernas afastadas
  const quadril = sphere(0.25, WHITE, { roughness: 0.85 })
  quadril.position.set(0, 0.31, 0)
  quadril.scale.set(1.1, 0.72, 0.92)
  capo.add(quadril)
  const pernas: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [
    // esquerda (lado -x): adiantada
    [new THREE.Vector3(-0.13, 0.3, 0.03), new THREE.Vector3(-0.36, 0.0, 0.26), new THREE.Vector3(-0.42, -0.36, 0.2)],
    // direita (lado +x): atrás
    [new THREE.Vector3(0.13, 0.3, -0.03), new THREE.Vector3(0.37, 0.02, -0.14), new THREE.Vector3(0.47, -0.36, -0.3)],
  ]
  for (const [hip, knee, ankle] of pernas) {
    capo.add(limb(0.1, hip, knee, WHITE, { roughness: 0.85 }))
    const joelho = sphere(0.1, WHITE, { roughness: 0.85 })
    joelho.position.copy(knee)
    capo.add(joelho)
    capo.add(limb(0.085, knee, ankle, WHITE, { roughness: 0.85 }))
    const barra = torus(0.08, 0.018, WHITE_SH, { roughness: 0.85 })
    barra.position.copy(ankle).add(new THREE.Vector3(0, 0.05, 0))
    barra.rotation.x = Math.PI / 2
    capo.add(barra)
    const pe = sphere(0.075, SKIN, { roughness: 0.6 })
    pe.scale.set(0.9, 0.45, 1.65)
    pe.position.set(ankle.x, -FOOT + 0.034, ankle.z + 0.05)
    capo.add(pe)
  }

  // cabeça: cabelo preto curto, sobrancelhas bravas, boca aberta no grito
  const cabeca = capo.getObjectByName('head') as THREE.Group
  const hr = H * 0.19
  const cabelo = sphere(hr * 1.03, HAIR, { roughness: 0.85 })
  cabelo.position.set(0, hr * 0.32, -hr * 0.2)
  cabelo.scale.set(1, 0.8, 0.98)
  cabeca.add(cabelo)
  for (const side of [-1, 1]) {
    const sobr = rbox(hr * 0.42, hr * 0.1, 0.03, 0.012, HAIR, { roughness: 0.7 })
    sobr.position.set(side * hr * 0.38, hr * 0.38, hr * 0.84)
    sobr.rotation.z = side * 0.38
    cabeca.add(sobr)
  }
  const boca = sphere(hr * 0.27, MOUTH, { roughness: 0.6 })
  boca.position.set(0, -hr * 0.47, hr * 0.84)
  boca.scale.set(1.05, 1.3, 0.5)
  cabeca.add(boca)
  const labio = torus(hr * 0.27, hr * 0.045, '#5e3020', { roughness: 0.6 })
  labio.position.set(0, -hr * 0.47, hr * 0.95)
  labio.scale.set(1.0, 1.25, 1)
  labio.rotation.x = -0.25
  cabeca.add(labio)
  const dentes = rbox(hr * 0.24, hr * 0.08, 0.02, 0.01, '#fbf8f1', { roughness: 0.3 })
  dentes.position.set(0, -hr * 0.25, hr * 0.92)
  cabeca.add(dentes)
  const lingua = sphere(hr * 0.13, '#b5525a', { roughness: 0.6 })
  lingua.position.set(0, -hr * 0.68, hr * 0.92)
  lingua.scale.set(1.3, 0.6, 0.6)
  cabeca.add(lingua)

  // ---- cordão amarelo e verde na cintura ---------------------------------------
  const cordao = new THREE.Group()
  capo.add(cordao)
  for (const [cy, color] of [[0.43, CORD_YELLOW], [0.47, CORD_GREEN]] as const) {
    const volta = torus(0.262, 0.02, color, { roughness: 0.85 })
    volta.rotation.x = Math.PI / 2
    volta.position.y = cy
    cordao.add(volta)
  }
  const no = sphere(0.04, CORD_YELLOW, { roughness: 0.85 })
  no.position.set(-0.13, 0.45, 0.23)
  cordao.add(no)
  for (const [dx, color] of [[-0.04, CORD_YELLOW], [0.04, CORD_GREEN]] as const) {
    const ponta1 = limb(0.016, new THREE.Vector3(-0.13 + dx * 0.5, 0.44, 0.24), new THREE.Vector3(-0.15 + dx, 0.24, 0.27), color, { roughness: 0.85 })
    cordao.add(ponta1)
    const borla = sphere(0.03, color, { roughness: 0.9 })
    borla.position.set(-0.15 + dx, 0.22, 0.27)
    cordao.add(borla)
  }

  // ---- braços: esquerdo erguido no desafio, direito com o berimbau -------------
  const bracoE = capo.getObjectByName('armL') as THREE.Mesh
  const bracoD = capo.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoE, H)
  shoulderPivot(bracoD, H)
  const ARM = H * 0.52 * 0.32 + 0.19 * H
  const VA = aimArm(new THREE.Vector3(-0.42, 0.86, 0.28))
  const DU = aimArm(new THREE.Vector3(0.5, 0.12, 0.86))
  const TOCA = { x: DU.x * 0.45, z: DU.z * 0.75 } // tocando, antes de apontar
  bracoE.rotation.set(VA.x, 0, VA.z)
  bracoD.rotation.set(DU.x, 0, DU.z)

  // ---- berimbau (filho da mão direita) ---------------------------------------
  // eixo local +y = vara; a verga arqueia para +x; +z olha para a câmera
  const berimbau = new THREE.Group()
  berimbau.position.set(0, -ARM, 0)
  bracoD.add(berimbau)

  const Y0 = -0.18
  const Y1 = 1.32
  const L = Y1 - Y0
  const SAG = 0.11
  const R = (L * L / 4 + SAG * SAG) / (2 * SAG)
  const HALF = Math.asin(L / 2 / R)
  const verga = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.022, 10, 64, HALF * 2),
    mat(WOOD, { roughness: 0.6, size: L }),
  )
  verga.castShadow = true
  verga.receiveShadow = true
  verga.rotation.z = -HALF
  verga.position.set(-R * Math.cos(HALF), (Y0 + Y1) / 2, 0)
  berimbau.add(verga)
  for (const y of [Y0, Y1]) {
    const tampa = sphere(0.026, WOOD_DARK, { roughness: 0.5 })
    tampa.position.set(0, y, 0)
    berimbau.add(tampa)
  }
  const arame = link(new THREE.Vector3(0, Y0, 0), new THREE.Vector3(0, Y1, 0), 0.007, SILVER, {
    roughness: 0.2, metalness: 0.9,
  })
  berimbau.add(arame)

  // cabaça: boca virada para a câmera
  const GOURD_Y = 0.07
  const bowX = (y: number) => Math.sqrt(R * R - (y - (Y0 + Y1) / 2) ** 2) - R * Math.cos(HALF)
  const cabaca = new THREE.Group()
  cabaca.position.set(bowX(GOURD_Y) + 0.12, GOURD_Y, -0.02)
  cabaca.rotation.x = Math.PI / 2
  const casca = lathe(
    [[0.02, -0.11], [0.07, -0.1], [0.11, -0.07], [0.13, -0.02], [0.128, 0.03], [0.105, 0.07], [0.08, 0.09], [0.068, 0.088]],
    GOURD,
    { roughness: 0.55 },
  )
  cabaca.add(casca)
  const fundo = cylinder(0.07, 0.07, 0.012, '#3a2414', { roughness: 0.9 }, 24)
  fundo.position.y = 0.08
  cabaca.add(fundo)
  const aro = torus(0.072, 0.01, GOURD_DARK, { roughness: 0.6 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.089
  cabaca.add(aro)
  berimbau.add(cabaca)
  const amarra = torus(0.03, 0.009, '#6b5a3c', { roughness: 0.9 })
  amarra.position.set(bowX(GOURD_Y) * 0.5, GOURD_Y, 0)
  amarra.scale.x = 1 + bowX(GOURD_Y) * 10
  amarra.rotation.x = Math.PI / 2
  berimbau.add(amarra)

  // orientação: vara apontando pra frente e pra cima, plano do arco virado pra câmera
  {
    const dirP = new THREE.Vector3(0.55, 0.62, 0.56).normalize()
    const camW = new THREE.Vector3(...CAM).sub(new THREE.Vector3(PX, PY + 0.9, PZ)).normalize()
    const camP = camW.applyAxisAngle(UP, -PYAW)
    const zP = camP.clone().addScaledVector(dirP, -camP.dot(dirP)).normalize()
    const xP = new THREE.Vector3().crossVectors(dirP, zP)
    const qP = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xP, dirP, zP))
    const qA = new THREE.Quaternion().setFromEuler(new THREE.Euler(DU.x, 0, DU.z))
    berimbau.quaternion.copy(qA.invert().multiply(qP))
  }

  // ---- rangido: três riscos amarelos saindo do arame -------------------------
  const rangido = new THREE.Group()
  rangido.position.set(-0.02, 0.72, 0.02)
  berimbau.add(rangido)
  for (const th of [0.55, 0, -0.55]) {
    const risco = rbox(0.17, 0.038, 0.03, 0.014, ACCENT, { roughness: 0.4 })
    risco.position.set(-0.16 * Math.cos(th), 0.16 * Math.sin(th), 0)
    risco.rotation.z = -th
    rangido.add(risco)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'parque', object: base },
    { name: 'roda', group: 'parque', object: roda },
    { name: 'mastro', group: 'bandeira', object: mastro },
    { name: 'bandeira', group: 'bandeira', object: bandeira },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'capoeirista', group: 'capoeirista', object: capo },
    { name: 'cordao', group: 'capoeirista', object: cordao },
    { name: 'bracoE', group: 'capoeirista', object: bracoE },
    { name: 'bracoD', group: 'capoeirista', object: bracoD },
    { name: 'berimbau', group: 'berimbau', object: berimbau },
    { name: 'rangido', group: 'berimbau', object: rangido },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const REST_E = 0.3 // pose de repouso do braço esquerdo (rotation.z)

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Domingo no parque: brota o gramado verde…',
    }),
    seq('roda-abre', 'roda', 0.6, 0.7, [ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…e no meio dele, uma roda de capoeira — vazia.',
    }),

    seq('mastro-finca', 'mastro', 1.7, 0.6, [ch('position.y', POLE[1] + 2.6, POLE[1])], {
      ease: 'easeIn',
      caption: 'Na beira da roda, alguém finca a BANDEIRA quadriculada de parTIDA…',
    }),
    seq('bandeira-abre', 'bandeira', 2.3, 0.8, [ch('scale.x', 0.01, 1), ch('rotation.y', FLAG_YAW + 0.6, FLAG_YAW)], {
      ease: 'easeOut',
    }),

    seq('placa-pendura', 'placa', 3.3, 0.6, [
      ch('position.y', PLAQUE_Y + 0.9, PLAQUE_Y), ch('rotation.z', 0, 0.35),
    ], {
      ease: 'easeIn',
      caption: '…e pendura nela uma plaquinha: FREE.',
    }),
    seq('placa-balanca', 'placa', 3.9, 0.5, [ch('rotation.z', 0.35, -0.18)], { ease: 'easeInOut' }),
    seq('placa-assenta', 'placa', 4.4, 0.5, [ch('rotation.z', -0.18, 0)], { ease: 'easeOut' }),

    seq('capo-salta', 'capoeirista', 5.0, 0.8, [riseFrom(PY, 2.2), ch('rotation.y', PYAW - 1.2, PYAW)], {
      ease: 'easeOut',
      caption: 'Os suecos passam reto. O capoeirista entra na roda e solta um VÁ! de desafio.',
    }),
    seq('cordao-amarra', 'cordao', 5.2, 0.5, s3(0.6, 1), { ease: 'easeOut' }),
    seq('bracoE-sobe', 'bracoE', 5.4, 0.5, [ch('rotation.x', 0, VA.x), ch('rotation.z', REST_E, VA.z)], {
      ease: 'easeOut',
    }),
    seq('bracoD-toca', 'bracoD', 5.0, 0.8, [ch('rotation.x', 0, TOCA.x), ch('rotation.z', -REST_E, TOCA.z)], {
      ease: 'easeOut',
    }),
    seq('ginga-a', 'capoeirista', 5.9, 0.5, [ch('position.x', PX, PX - 0.12)], { ease: 'easeInOut' }),
    seq('ginga-b', 'capoeirista', 6.4, 0.5, [ch('position.x', PX - 0.12, PX)], { ease: 'easeInOut' }),

    seq('berimbau-surge', 'berimbau', 6.9, 0.5, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Ele estica o arame do berimbau até ranger: iiiÖR!',
    }),
    seq('rangido-a', 'rangido', 7.5, 0.4, s3(0.01, 1.35), { ease: 'easeOut' }),
    seq('rangido-b', 'rangido', 7.9, 0.4, s3(1.35, 0.85), { ease: 'easeInOut' }),
    seq('rangido-c', 'rangido', 8.3, 0.3, s3(0.85, 1), { ease: 'easeOut' }),

    seq('bracoD-aponta', 'bracoD', 8.8, 0.6, [ch('rotation.x', TOCA.x, DU.x), ch('rotation.z', TOCA.z, DU.z)], {
      ease: 'easeOut',
      caption: 'E aponta o berimbau pro primeiro sueco que passa: DÜ?',
    }),

    seq('capo-pula', 'capoeirista', 10.0, 0.3, [ch('position.y', PY, PY + 0.12)], {
      ease: 'easeOut',
      caption: 'O sueco nem olha. PÔ! Lá vai a pergunta que abre qualquer amizade:',
    }),
    seq('capo-pousa', 'capoeirista', 10.3, 0.3, [ch('position.y', PY + 0.12, PY)], { ease: 'easeIn' }),
    seq('placa-tremida', 'placa', 10.4, 0.3, [ch('rotation.z', 0, 0.1)], { ease: 'easeOut' }),
    seq('placa-volta', 'placa', 10.7, 0.4, [ch('rotation.z', 0.1, 0)], { ease: 'easeOut' }),

    seq('rangido-fim', 'rangido', 11.4, 0.5, s3(1.25, 1), {
      ease: 'easeOut',
      caption: 'Vad gör du på fritiden? — O que você faz no tempo livre?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [-0.1, 1.1, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-gor-du-pa-fritiden',
    contexto:
      "Fika com colegas, encontro, conversa com vizinho, a primeira roda de conversa no SFI: o sueco leva a 'fritid' a sério (esporte, clube, associação, coral, a stuga) e essa é a pergunta padrão pra conhecer alguém fora do trabalho.",
    fraseFonte: 'O que você faz no tempo livre?',
    fraseAlvo: 'Vad gör du på fritiden?',
    pronuncia:
      "va iör-dü pô FRII-tii-den? ('vad' = VÁ, sem D; 'gör' = iör, o G vira I de ioga, boca de Ô com língua de Ê, e o R emenda direto no 'du'; 'du' com bico; 'på' = pô, curto e fraco; 'fritiden' com a força no FRII — R de um toque, I longo — e um acento menor no TII, com T seco, nunca 'tchi'; o -den fraquinho, E aberto: FRII-tii-den)",
    ponteSonora:
      "VÁ! IÖR-DÜ... PÔ! FREE... (par)TÍD-EN? (7 sílabas: va-iör-dü-pô-FRII-tii-den; a força cai no FRII, com um acento menor no TII; VÁ = o MESMO 'vad' de 'Vad gör du i helgen?' e 'Vad ska vi göra?' — o grito SEM R e sem D: com R vira 'var' (onde), que nas cartas é sempre a VARA; IÖR = o RANGIDO do 'gör', o mesmo da manivela de 'Det gör ont här' e da armadura de 'Det gör inget' — aqui é o arame do berimbau esticado demais: I de IOGA (nunca G duro nem J chiado), boca de Ô com língua de Ê, e o R brando que derrete direto no DÜ: IÖR-DÜ num fôlego só, a MESMA emenda de 'Vad gör du i helgen?'; DÜ com BICO de pato; PÔ = o PÔ! de 'Vad heter det på svenska?' e 'Jag är på väg': boca redonda, Ô fechado, curto e sem força — nunca 'pó'; FREE = o 'free' que todo brasileiro já fala ('entrada free', 'free shop'): R de UM toque só, o de 'cara' — nunca o RR raspado —, e I LONGO; e é tradução literal: 'fri' é LIVRE; (par)TÍD = o parTÍD(a) da bandeira quadriculada, a MESMA ponte de 'tid' em 'Har du tid en stund?', 'Vi har gott om tid' e 'Hur lång tid tar det?': só o pedaço forte, T SECO de 'tatu' — nunca o 'tchi' que o português do Brasil faz sozinho antes de I — e I longo; -EN = o artigo colado no FIM, como o -EN de 'helgen' e o -AN de 'skolan': fritid = tempo livre, fritiden = O tempo livre; o D já gruda nele: TII-den, E aberto e fraco, N de ponta de língua, sem nasal; FREE + parTÍD é uma palavra só, fri+tid, e a força principal fica no FREE)",
    historia:
      'Domingo no parque, um capoeirista monta a roda sozinho: finca no gramado uma BANDEIRA quadriculada de parTIDA e pendura nela uma plaquinha: FREE. Os suecos passam reto. Ele solta um VÁ! de desafio, estica o arame do berimbau até ranger — iiiÖR! — e aponta o berimbau pro primeiro sueco que passa: DÜ? O sueco nem olha. PÔ! Aí ele dá um aú por cima da bandeira, cai de pé na frente do sueco e manda a pergunta que abre qualquer amizade aqui: o que você faz no tempo livre?',
  },
  createScene,
}

export default card
