import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Kan jag få lite vatten?" — na varanda torrando de sol você chama CANA, IÁ!
 * e chega a CANA em pessoa: o policial de quepe, cassetete de cana-de-açúcar
 * no cinto e mangueira de bombeiro enrolada no ombro, bufando FÔÔ de bochechas
 * redondas. Você aponta o LITE do copinho e manda VÁT-TEN! (vá, tenente!): ele
 * abre a mangueira com tudo… e sai UMA gota gorda, certinha no copo.
 *
 * Diorama: piso de lajotas terracota com balaustrada creme ao fundo; policial
 * grande à esquerda com o braço erguido e o esguicho apontado para baixo;
 * mesinha verde de café à direita com o copo; sol no alto.
 * Paleta: terracota quente · azul-marinho da farda · verde bistrô · latão.
 * Acento saturado RESERVADO à água: a gota e as letras LITE do copo.
 */

const GROUT = '#d8c2a2'
const TILES = ['#c06a43', '#b85f3b', '#c8784e', '#b06240']
const EARTH = '#6b3a25'
const RIM = '#8f4a2c'
const CREAM = '#efe6d5'
const GREEN = '#3f7457'
const GREEN_DARK = '#2d5741'
const NAVY = '#1f2b4d'
const NAVY_CAP = '#2a3c72'
const BLACK = '#17181d'
const SKIN = '#e9bf98'
const BLUSH = '#eea58a'
const LIPS = '#a2463c'
const BRASS = '#d0a13c'
const HOSE = '#b23b30'
const HOSE_DARK = '#8a2c25'
const CANE = '#a6b65a'
const CANE_NODE = '#6f7f35'
const CANE_CUT = '#e4e8b8'
const CLOUD = '#f7f5f0'
const SUN = '#ffd23a'
const WATER = '#1f9bf0' // ACENTO saturado: a água (gota + LITE)

const GY = 0.18 // topo das lajotas
const S = 1.25 // escala do policial (altura ≈ 1.9 com o quepe)
const POL = new THREE.Vector3(-0.5, GY, -0.25)
const POL_RY = -0.18
const ARM_UP = 2.6 // braço direito erguido ~55° acima da horizontal
const CUP_H = 0.3
const CUP_R0 = 0.128 // raio do copo no fundo
const CUP_R1 = 0.166 // raio do copo na boca
const DROP_R = 0.1
const DROP_H = DROP_R * 2.7
const FALL = 0.13 // queda da gota: do bico do esguicho até a pose final

/** Raio externo do copo na altura y (perfil cônico). */
const cupR = (y: number) => CUP_R0 + (CUP_R1 - CUP_R0) * (y / CUP_H)

/** Letra de traço grosso, centrada na origem, no plano xy virada para +z. */
function glyph(which: 'L' | 'I' | 'T' | 'E', h: number, color: string, depth = 0.014) {
  const g = new THREE.Group()
  const t = h * 0.2
  const w = h * 0.64
  const s = (sw: number, sh: number, x: number, y: number) => {
    const b = rbox(sw, sh, depth, Math.min(sw, sh) * 0.25, color, { roughness: 0.45 })
    b.position.set(x, y, 0)
    g.add(b)
  }
  const top = h / 2 - t / 2
  const left = -w / 2 + t / 2
  if (which === 'L') {
    s(t, h, left, 0)
    s(w, t, 0, -top)
  } else if (which === 'I') {
    s(t, h, 0, 0)
  } else if (which === 'T') {
    s(w, t, 0, top)
    s(t, h, 0, 0)
  } else {
    s(t, h, left, 0)
    s(w, t, 0, top)
    s(w * 0.8, t, -w * 0.1, 0)
    s(w, t, 0, -top)
  }
  return g
}

function vidro(opacity: number) {
  return new THREE.MeshStandardMaterial({
    color: '#e2f2f7',
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity,
    depthWrite: false,
  })
}

/** Perfil de gota: base redonda e ponta fina para cima (origem na base). */
function dropProfile(): [number, number][] {
  const p: [number, number][] = []
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * (Math.PI / 2)
    p.push([DROP_R * Math.cos(a), DROP_R + DROP_R * Math.sin(a)])
  }
  for (let i = 1; i <= 12; i++) {
    const s = i / 12
    p.push([DROP_R * Math.cos((s * Math.PI) / 2), DROP_R + s * 1.7 * DROP_R])
  }
  return p
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- base: varanda de lajotas terracota -----------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.64, 2.74, 0.12, EARTH, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const slab = cylinder(2.56, 2.62, 0.05, GROUT, { roughness: 0.95 })
  slab.position.y = 0.145
  base.add(slab)

  const border = torus(2.56, 0.045, RIM, { roughness: 0.8 })
  border.rotation.x = Math.PI / 2
  border.position.y = 0.165
  base.add(border)

  // lajotas quadradas com rejunte claro; só as que cabem inteiras no disco
  const P = 0.44
  for (let ix = -6; ix <= 6; ix++) {
    for (let iz = -6; iz <= 6; iz++) {
      const x = (ix + 0.5) * P
      const z = (iz + 0.5) * P
      if (Math.hypot(Math.abs(x) + P / 2, Math.abs(z) + P / 2) > 2.5) continue
      const tile = rbox(0.4, 0.03, 0.4, 0.012, TILES[Math.floor(rand() * TILES.length)], {
        roughness: 0.8,
      })
      tile.position.set(x, GY - 0.015, z)
      tile.rotation.y = (rand() - 0.5) * 0.03
      base.add(tile)
    }
  }

  // balaustrada creme ao fundo: o parapeito da varanda
  const RR = 2.3
  const A0 = Math.PI * 1.08
  const A1 = Math.PI * 1.92
  const N = 19
  for (let i = 0; i < N; i++) {
    const a = A0 + ((A1 - A0) * i) / (N - 1)
    const bal = lathe(
      [
        [0, 0], [0.065, 0], [0.065, 0.05], [0.036, 0.09], [0.055, 0.2], [0.064, 0.29],
        [0.036, 0.42], [0.046, 0.47], [0.065, 0.5], [0.065, 0.55], [0, 0.55],
      ],
      CREAM,
      { roughness: 0.6 },
    )
    bal.position.set(RR * Math.cos(a), GY, RR * Math.sin(a))
    base.add(bal)
  }
  for (const [ry, tube] of [[GY + 0.585, 0.06], [GY + 0.03, 0.05]] as const) {
    const wrap = new THREE.Group()
    wrap.rotation.y = -A0
    const rail = new THREE.Mesh(
      new THREE.TorusGeometry(RR, tube, 10, 80, A1 - A0),
      mat(CREAM, { roughness: 0.55, size: 0.3 }),
    )
    rail.castShadow = true
    rail.receiveShadow = true
    rail.rotation.x = Math.PI / 2
    rail.scale.z = 0.7
    wrap.add(rail)
    wrap.position.y = ry
    base.add(wrap)
  }
  for (const a of [A0 - 0.05, A1 + 0.05]) {
    const pillar = rbox(0.2, 0.72, 0.2, 0.03, CREAM, { roughness: 0.6 })
    pillar.position.set(RR * Math.cos(a), GY + 0.36, RR * Math.sin(a))
    pillar.rotation.y = -a
    base.add(pillar)
    const ball = sphere(0.09, CREAM, { roughness: 0.55 })
    ball.position.set(RR * Math.cos(a), GY + 0.8, RR * Math.sin(a))
    base.add(ball)
  }

  // vaso com planta à esquerda, na frente
  const vaso = new THREE.Group()
  vaso.position.set(-1.5, GY, -0.95)
  const pot = lathe(
    [[0, 0], [0.16, 0], [0.18, 0.05], [0.22, 0.3], [0.245, 0.33], [0.24, 0.36], [0.2, 0.33], [0, 0.33]],
    '#e6d9c2',
    { roughness: 0.35 },
  )
  vaso.add(pot)
  const folhas = puff(0.24, '#4f8a4a', 6, 61, { roughness: 0.85 })
  folhas.position.y = 0.52
  vaso.add(folhas)
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2
    const flor = sphere(0.04, '#f6efe0', { roughness: 0.6 })
    flor.position.set(Math.cos(a) * 0.22, 0.5 + rand() * 0.2, Math.sin(a) * 0.22)
    vaso.add(flor)
  }
  base.add(vaso)

  root.add(base)

  // ---- policial (olha para a câmera; braço direito erguido com o esguicho) --
  const policial = person({ body: NAVY, skin: SKIN, height: 1.5, armAngle: 0.28 })
  policial.position.copy(POL)
  policial.rotation.y = POL_RY
  policial.scale.setScalar(S)

  // cinto preto com fivela de latão
  const cinto = torus(0.258, 0.034, BLACK, { roughness: 0.5 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.3
  policial.add(cinto)
  const fivela = rbox(0.09, 0.075, 0.03, 0.012, BRASS, { roughness: 0.3, metalness: 0.8 })
  fivela.position.set(0, 0.3, 0.272)
  policial.add(fivela)
  for (const by of [0.42, 0.52, 0.62]) {
    const botao = sphere(0.02, BRASS, { roughness: 0.3, metalness: 0.8 })
    botao.position.set(0, by, 0.259)
    policial.add(botao)
  }
  // distintivo dourado no peito (estrela de seis pontas achatada)
  const estrela = new THREE.Group()
  estrela.position.set(0.14, 0.6, 0.22)
  estrela.rotation.y = 0.55
  for (const rz of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
    const ponta = rbox(0.1, 0.03, 0.016, 0.008, BRASS, { roughness: 0.3, metalness: 0.8 })
    ponta.rotation.z = rz
    estrela.add(ponta)
  }
  policial.add(estrela)

  const head = policial.getObjectByName('head') as THREE.Group
  head.rotation.y = 0.14 // rosto de frente para a câmera

  // ---- quepe azul, aba preta, distintivo dourado -----------------------------
  const quepe = new THREE.Group()
  quepe.position.set(0, 0.15, 0)
  quepe.rotation.x = -0.1
  const copa = lathe(
    [[0, 0], [0.27, 0], [0.29, 0.07], [0.35, 0.15], [0.34, 0.185], [0, 0.195]],
    NAVY_CAP,
    { roughness: 0.6 },
  )
  quepe.add(copa)
  const faixa = cylinder(0.283, 0.283, 0.065, BLACK, { roughness: 0.55 })
  faixa.position.y = 0.04
  quepe.add(faixa)
  const aba = cylinder(0.21, 0.21, 0.025, BLACK, { roughness: 0.25 })
  aba.scale.z = 0.6
  aba.position.set(0, 0.005, 0.26)
  aba.rotation.x = 0.25
  quepe.add(aba)
  const emblema = sphere(0.042, BRASS, { roughness: 0.3, metalness: 0.8 })
  emblema.scale.z = 0.45
  emblema.position.set(0, 0.11, 0.31)
  quepe.add(emblema)
  head.add(quepe)

  // ---- bochechas estufadas + boca redonda soprando ---------------------------
  const bochechas = new THREE.Group()
  bochechas.position.set(0, -0.085, 0.2)
  head.add(bochechas)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.1, BLUSH, { roughness: 0.6 })
    bochecha.position.set(side * 0.15, 0.0, -0.02)
    bochechas.add(bochecha)
  }
  const boca = torus(0.04, 0.017, LIPS, { roughness: 0.45 })
  boca.position.set(0, -0.05, 0.068)
  bochechas.add(boca)
  const oco = sphere(0.032, '#3a1d1a', { roughness: 0.7 })
  oco.position.set(0, -0.05, 0.05)
  bochechas.add(oco)

  // ---- bafo de calor: nuvenzinha saindo da boca (FÔ) -------------------------
  const bafo = new THREE.Group()
  bafo.position.set(-0.33, -0.08, 0.3)
  head.add(bafo)
  for (const [x, y, z, r, seed] of [
    [0, 0, 0, 0.085, 71],
    [-0.14, 0.09, -0.02, 0.06, 72],
    [-0.24, 0.17, -0.04, 0.04, 73],
  ] as const) {
    const nuvem = puff(r, CLOUD, 5, seed, { roughness: 0.9 })
    nuvem.position.set(x, y, z)
    bafo.add(nuvem)
  }

  // ---- cassetete de cana-de-açúcar enfiado no cinto ---------------------------
  const cassetete = new THREE.Group()
  const PHI = -0.72
  cassetete.position.set(0.3 * Math.sin(PHI), 0.3, 0.3 * Math.cos(PHI))
  cassetete.rotation.y = PHI
  policial.add(cassetete)
  const cana = new THREE.Group()
  cana.rotation.z = 0.85
  cassetete.add(cana)
  const CL = 0.52
  const colmo = cylinder(0.04, 0.042, CL, CANE, { roughness: 0.45 }, 16)
  cana.add(colmo)
  for (let k = 0; k < 4; k++) {
    const no = torus(0.042, 0.012, CANE_NODE, { roughness: 0.5 })
    no.rotation.x = Math.PI / 2
    no.position.y = -CL / 2 + 0.08 + k * 0.12
    cana.add(no)
  }
  for (const sy of [-1, 1]) {
    const corte = cylinder(0.037, 0.037, 0.01, CANE_CUT, { roughness: 0.7 }, 16)
    corte.position.y = sy * (CL / 2 + 0.002)
    cana.add(corte)
  }
  const passador = torus(0.05, 0.014, BLACK, { roughness: 0.5 })
  passador.rotation.x = Math.PI / 2
  passador.position.y = 0.04
  cana.add(passador)

  // ---- mangueira de bombeiro enrolada a tiracolo no ombro esquerdo -----------
  const mangueira = new THREE.Group()
  mangueira.position.set(0, 0.47, 0)
  policial.add(mangueira)
  const ALPHA = 0.72 // inclinação da faixa: ombro esquerdo → quadril direito
  const normal = new THREE.Vector3(Math.cos(ALPHA), Math.sin(ALPHA), 0)
  for (const [k, color] of [[-1, HOSE], [0, HOSE_DARK], [1, HOSE]] as const) {
    const tilt = new THREE.Group()
    tilt.rotation.z = ALPHA
    tilt.position.copy(normal).multiplyScalar(k * 0.06)
    const turn = new THREE.Group()
    turn.rotation.y = Math.PI / 2
    const loop = torus(0.355, 0.036, color, { roughness: 0.8 })
    loop.scale.x = 0.82 // achata na direção frente-trás: abraça o tronco
    turn.add(loop)
    tilt.add(turn)
    mangueira.add(tilt)
  }
  // engate de latão no ponto onde a volta fecha (na frente do peito)
  const engate = cylinder(0.05, 0.05, 0.08, BRASS, { roughness: 0.3, metalness: 0.8 })
  engate.position.set(0.07, 0.07, 0.3)
  engate.rotation.set(0.2, 0, ALPHA)
  mangueira.add(engate)

  // ---- braço direito erguido (gira pelo ombro) -------------------------------
  const braco = policial.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(braco, 1.5)
  braco.rotation.z = ARM_UP
  const mao = braco.children[0]

  root.add(policial)
  root.updateMatrixWorld(true)

  // ---- esguicho: mangueira pelo braço + bico de latão na mão ------------------
  const esguicho = new THREE.Group()
  braco.add(esguicho)
  const handLocal = mao.position.clone()
  const run = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.12, -0.1),
    new THREE.Vector3(0.11, 0.0, -0.04),
    new THREE.Vector3(0.125, -0.22, 0.0),
    new THREE.Vector3(0.11, handLocal.y + 0.1, 0.02),
    handLocal.clone(),
  ])
  const tubo = new THREE.Mesh(new THREE.TubeGeometry(run, 40, 0.036, 12), mat(HOSE, { roughness: 0.8, size: 0.6 }))
  tubo.castShadow = true
  tubo.receiveShadow = true
  esguicho.add(tubo)

  const handW = mao.getWorldPosition(new THREE.Vector3())
  const dirW = new THREE.Vector3(0.36, -1, 0.14).normalize()
  const NOZ_L = 0.3
  const bico = new THREE.Group()
  bico.position.copy(handLocal)
  const qArm = braco.getWorldQuaternion(new THREE.Quaternion())
  const qW = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirW)
  bico.quaternion.copy(qArm.clone().invert().multiply(qW))
  esguicho.add(bico)
  const corpoBico = lathe(
    [
      [0, 0], [0.066, 0], [0.068, 0.075], [0.058, 0.085], [0.056, 0.13], [0.04, 0.24],
      [0.036, NOZ_L - 0.022], [0.044, NOZ_L - 0.012], [0.04, NOZ_L], [0.02, NOZ_L], [0, NOZ_L - 0.01],
    ],
    BRASS,
    { roughness: 0.28, metalness: 0.85 },
  )
  bico.add(corpoBico)
  for (const ry of [0.025, 0.05]) {
    const friso = torus(0.068, 0.009, '#a37c27', { roughness: 0.3, metalness: 0.8 })
    friso.rotation.x = Math.PI / 2
    friso.position.y = ry
    bico.add(friso)
  }
  // alavanca de abrir o jato
  const alavanca = rbox(0.03, 0.14, 0.02, 0.01, BLACK, { roughness: 0.4 })
  alavanca.position.set(0.075, 0.12, 0)
  alavanca.rotation.z = -0.35
  bico.add(alavanca)

  const tipW = handW.clone().addScaledVector(dirW, NOZ_L * S)

  // ---- mesinha verde de café + cadeira ----------------------------------------
  // o copo fica exatamente sob o bico; a mesa se ajusta em volta dele
  const RIM_Y = tipW.y - DROP_H - FALL - 0.03
  const TOP = RIM_Y - CUP_H
  const CUP = new THREE.Vector3(tipW.x, TOP, tipW.z)
  const TABLE = new THREE.Vector3(CUP.x + 0.2, 0, CUP.z + 0.05)

  const mesa = new THREE.Group()
  const pe = lathe(
    [[0, 0], [0.27, 0], [0.28, 0.02], [0.2, 0.05], [0.06, 0.1], [0, 0.1]],
    GREEN_DARK,
    { roughness: 0.4, metalness: 0.4 },
  )
  pe.position.set(TABLE.x, GY, TABLE.z)
  mesa.add(pe)
  const coluna = cylinder(0.035, 0.04, TOP - GY - 0.1, GREEN_DARK, { roughness: 0.4, metalness: 0.4 })
  coluna.position.set(TABLE.x, GY + 0.08 + (TOP - GY - 0.1) / 2, TABLE.z)
  mesa.add(coluna)
  const tampo = cylinder(0.46, 0.46, 0.04, GREEN, { roughness: 0.45, metalness: 0.25 })
  tampo.position.set(TABLE.x, TOP - 0.02, TABLE.z)
  mesa.add(tampo)
  const borda = torus(0.46, 0.022, GREEN_DARK, { roughness: 0.4, metalness: 0.4 })
  borda.rotation.x = Math.PI / 2
  borda.position.set(TABLE.x, TOP - 0.02, TABLE.z)
  mesa.add(borda)

  // cadeira bistrô do outro lado, virada para a mesa
  const cadeira = new THREE.Group()
  cadeira.position.set(TABLE.x + 0.6, GY, TABLE.z - 0.48)
  cadeira.rotation.y = Math.atan2(TABLE.x - cadeira.position.x, TABLE.z - cadeira.position.z)
  const SEAT = 0.46
  const assento = cylinder(0.23, 0.22, 0.045, GREEN, { roughness: 0.45, metalness: 0.25 })
  assento.position.y = SEAT
  cadeira.add(assento)
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const perna = cylinder(0.017, 0.017, SEAT + 0.02, GREEN_DARK, { roughness: 0.4, metalness: 0.4 })
    perna.position.set(lx * 0.15, SEAT / 2, lz * 0.15)
    perna.rotation.set(lz * 0.08, 0, -lx * 0.08)
    cadeira.add(perna)
  }
  for (const lx of [-1, 1]) {
    const haste = cylinder(0.018, 0.018, 0.42, GREEN_DARK, { roughness: 0.4, metalness: 0.4 })
    haste.position.set(lx * 0.17, SEAT + 0.21, -0.17)
    haste.rotation.x = -0.12
    cadeira.add(haste)
  }
  const encosto = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.025, 10, 32, Math.PI),
    mat(GREEN_DARK, { roughness: 0.4, metalness: 0.4, size: 0.4 }),
  )
  encosto.castShadow = true
  encosto.position.set(0, SEAT + 0.4, -0.19)
  encosto.rotation.x = -0.12
  cadeira.add(encosto)
  const travessa = rbox(0.34, 0.07, 0.025, 0.012, GREEN, { roughness: 0.45 })
  travessa.position.set(0, SEAT + 0.3, -0.185)
  travessa.rotation.x = -0.12
  cadeira.add(travessa)
  mesa.add(cadeira)
  root.add(mesa)

  // ---- copinho de vidro com faixa branca escrita LITE -------------------------
  const copo = new THREE.Group()
  copo.position.copy(CUP)
  root.add(copo)
  const parede = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0, 0], [CUP_R0 - 0.006, 0], [CUP_R0, 0.006], [CUP_R1, CUP_H], [CUP_R1 - 0.008, CUP_H],
        [CUP_R0 - 0.008, 0.035], [0, 0.035],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      48,
    ),
    vidro(0.3),
  )
  copo.add(parede)
  const fundo = cylinder(CUP_R0 - 0.01, CUP_R0 - 0.004, 0.034, '#cfe6ee', { roughness: 0.1 })
  ;(fundo.material as THREE.MeshStandardMaterial).transparent = true
  ;(fundo.material as THREE.MeshStandardMaterial).opacity = 0.55
  fundo.castShadow = false
  fundo.position.y = 0.018
  copo.add(fundo)
  const aro = torus(CUP_R1 - 0.004, 0.006, '#f2fafc', { roughness: 0.1 })
  ;(aro.material as THREE.MeshStandardMaterial).transparent = true
  ;(aro.material as THREE.MeshStandardMaterial).opacity = 0.7
  aro.castShadow = false
  aro.rotation.x = Math.PI / 2
  aro.position.y = CUP_H
  copo.add(aro)

  const B0 = 0.085
  const B1 = 0.205
  const faixaCopo = new THREE.Mesh(
    new THREE.CylinderGeometry(cupR(B1) + 0.004, cupR(B0) + 0.004, B1 - B0, 48, 1, true),
    mat('#f8f6f0', { roughness: 0.5, size: 0.3 }),
  )
  ;(faixaCopo.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide
  faixaCopo.castShadow = true
  faixaCopo.position.y = (B0 + B1) / 2
  copo.add(faixaCopo)

  // LITE curvado sobre a faixa, de frente para a câmera
  const H = 0.092
  const LY = (B0 + B1) / 2
  const letras = ['L', 'I', 'T', 'E'] as const
  const GAP = H * 0.24
  const advs = letras.map((c) => (c === 'I' ? H * 0.2 : H * 0.64) + GAP)
  const total = advs.reduce((a, b) => a + b, 0) - GAP
  const LR = cupR(LY) + 0.004 + 0.008
  let lx = -total / 2
  letras.forEach((c, i) => {
    const cx = lx + (advs[i] - GAP) / 2
    const ang = cx / LR
    const slot = new THREE.Group()
    slot.rotation.y = ang
    slot.position.y = LY
    const l = glyph(c, H, WATER)
    l.position.z = LR
    l.rotation.x = -Math.atan2(CUP_R1 - CUP_R0, CUP_H)
    slot.add(l)
    copo.add(slot)
    lx += advs[i]
  })

  // ---- a gota gigante (origem no topo: nasce pendurada no bico) ---------------
  const gota = new THREE.Group()
  const GOTA_Y = RIM_Y + 0.03 + DROP_H // pose final: logo acima da boca do copo
  gota.position.set(tipW.x, GOTA_Y, tipW.z)
  root.add(gota)
  const dropMat = new THREE.MeshPhysicalMaterial({
    color: WATER,
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.86,
    emissive: '#0b5aa0',
    emissiveIntensity: 0.35,
  })
  const corpoGota = new THREE.Mesh(
    new THREE.LatheGeometry(dropProfile().map(([r, y]) => new THREE.Vector2(r, y)), 40),
    dropMat,
  )
  corpoGota.position.y = -DROP_H
  corpoGota.castShadow = true
  gota.add(corpoGota)
  const brilho = sphere(0.022, '#ffffff', { roughness: 0.1, emissive: '#ffffff', emissiveIntensity: 0.6 })
  brilho.scale.set(0.8, 1.3, 0.5)
  brilho.position.set(-0.035, -DROP_H + 0.115, 0.06)
  gota.add(brilho)

  // ---- sol no alto -----------------------------------------------------------
  const sol = new THREE.Group()
  sol.position.set(1.38, 2.22, -1.5)
  sol.rotation.y = -0.2
  root.add(sol)
  const disco = sphere(0.27, SUN, { emissive: '#ffb81c', emissiveIntensity: 0.9 })
  sol.add(disco)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const raio = cone(0.055, i % 2 ? 0.16 : 0.22, SUN, { emissive: '#ffb81c', emissiveIntensity: 0.9 }, 12)
    const d = 0.38 + (i % 2 ? 0 : 0.03)
    raio.position.set(Math.cos(a) * d, Math.sin(a) * d, 0)
    raio.rotation.z = a - Math.PI / 2
    sol.add(raio)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'varanda', object: base },
    { name: 'mesa', group: 'varanda', object: mesa },
    { name: 'sol', group: 'varanda', object: sol },
    { name: 'copo', group: 'copo', object: copo },
    { name: 'policial', group: 'cana', object: policial },
    { name: 'braco', group: 'cana', object: braco },
    { name: 'quepe', group: 'cana', object: quepe },
    { name: 'cassetete', group: 'cana', object: cassetete },
    { name: 'mangueira', group: 'mangueira', object: mangueira },
    { name: 'bochechas', group: 'bafo', object: bochechas },
    { name: 'bafo', group: 'bafo', object: bafo },
    { name: 'esguicho', group: 'jato', object: esguicho },
    { name: 'gota', group: 'gota', object: gota },
  ]

  // ---- montagem ------------------------------------------------------------
  const sc = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Meio-dia de julho na varanda do restaurante: o sol torra e a garganta vira lixa…',
    }),
    seq('mesa-rise', 'mesa', 0.3, 0.8, [riseFrom(0, 1.2)], { ease: 'easeOut' }),
    seq('sol-surge', 'sol', 0.6, 0.9, [...sc(0.01, 1), ch('rotation.z', -1.2, 0)], { ease: 'easeOut' }),

    seq('copo-cai', 'copo', 1.7, 0.6, [...sc(0.01, 1), ch('position.y', TOP + 0.35, TOP)], {
      ease: 'easeOut',
      caption: 'Você ergue o copinho vazio e chama: CANA, IÁ!',
    }),

    seq('policial-rise', 'policial', 3.0, 0.85, [riseFrom(POL.y, 2.3)], {
      ease: 'easeOut',
      caption: 'E chega a CANA em pessoa: policial de quepe, cassetete de cana-de-açúcar no cinto…',
    }),
    seq('braco-assenta', 'braco', 3.1, 0.7, [ch('rotation.z', 0.7, -0.28)], { ease: 'easeOut' }),
    seq('quepe-poe', 'quepe', 3.6, 0.6, [...sc(0.01, 1), ch('position.y', 0.55, 0.15)], { ease: 'easeOut' }),
    seq('cassetete-enfia', 'cassetete', 4.0, 0.6, [...sc(0.01, 1), ch('position.y', 0.75, 0.3)], {
      ease: 'easeOut',
    }),

    seq('mangueira-enrola', 'mangueira', 5.0, 0.8, [...sc(0.01, 1), ch('rotation.y', -1.6, 0)], {
      ease: 'easeOut',
      caption: '…e uma mangueira de bombeiro enrolada no ombro.',
    }),

    seq('bochechas-enchem', 'bochechas', 6.4, 0.45, sc(0.3, 1.15), {
      ease: 'easeOut',
      caption: 'Ele chega bufando de calor, de bochechas redondas: FÔÔ!',
    }),
    seq('bochechas-assentam', 'bochechas', 6.85, 0.3, sc(1.15, 1), { ease: 'easeInOut' }),
    seq('bafo-sai', 'bafo', 6.6, 0.8, [...sc(0.01, 1), ch('position.x', -0.08, -0.33)], { ease: 'easeOut' }),

    seq('copo-pula', 'copo', 7.9, 0.3, [ch('position.y', TOP, TOP + 0.14), ch('rotation.y', -1.7, -0.6)], {
      ease: 'easeOut',
      caption: 'Você aponta o LITE no copo (é só um pouquinho!) e late num golpe só: VÁT-TEN! — vá, tenente!',
    }),
    seq('copo-pousa', 'copo', 8.2, 0.3, [ch('position.y', TOP + 0.14, TOP), ch('rotation.y', -0.6, 0)], {
      ease: 'easeIn',
    }),

    seq('braco-ergue', 'braco', 9.3, 0.6, [ch('rotation.z', -0.28, ARM_UP)], {
      ease: 'easeOut',
      caption: 'O tenente aponta o esguicho e abre a mangueira com tudo…',
    }),
    seq('esguicho-estica', 'esguicho', 9.45, 0.55, sc(0.01, 1), { ease: 'easeOut' }),

    seq('gota-forma', 'gota', 10.3, 0.55, [...sc(0.01, 1), ch('position.y', tipW.y, tipW.y)], {
      ease: 'easeOut',
      caption: '…e sai UMA gota só, gorda e redondinha, que cai certinha no copo.',
    }),
    seq('gota-cai', 'gota', 10.85, 0.45, [ch('position.y', tipW.y, GOTA_Y)], { ease: 'easeIn' }),
    seq('copo-recebe', 'copo', 11.3, 0.12, [ch('scale.y', 1, 0.9)], { ease: 'easeOut' }),
    seq('copo-volta', 'copo', 11.42, 0.3, [ch('scale.y', 0.9, 1)], { ease: 'easeOut' }),

    seq('quepe-tira', 'quepe', 11.6, 0.3, [ch('rotation.x', -0.1, -0.45)], {
      ease: 'easeOut',
      caption: 'Kan jag få lite vatten? — Pode me trazer um pouco de água?',
    }),
    seq('quepe-volta', 'quepe', 11.9, 0.35, [ch('rotation.x', -0.45, -0.1)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.42, 1.82, 3.6], target: [0.18, 1.24, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-fa-lite-vatten',
    contexto:
      'Restaurante, café, lanchonete ou casa de alguém. Na Suécia a água da torneira (kranvatten) é boa e quase sempre de graça.',
    fraseFonte: 'Pode me trazer um pouco de água?',
    fraseAlvo: 'Kan jag få lite vatten?',
    pronuncia:
      "kan iá fô LÍ-te VÁT-ten ('lite' = LÍ-te, nunca 'láite'; 'vatten' com A CURTO e o T segurado um instante, VÁT-ten, e o -en fraco e sem nasal)",
    ponteSonora:
      "CA-NIÁ, FÔ LÍTE... VÁT-TEN! (7 sílabas: ca-niá-fô-LÍ-te-VÁT-ten; tônicas em LÍ e VÁT; CA-NIÁ é a CANA + IÁ de sempre, I de IOGA, nunca 'canja', e aqui a CANA vale dobrado, porque na gíria CANA é a POLÍCIA; FÔ é o MESMO sopro de bochechas redondas de 'Kan jag få menyn?': Ô FECHADO, nunca 'fó'; LÍTE é o LITE de 'Vänta lite' e 'Förlåt, jag är lite sen': LÍ-te, nunca 'láite'; VÁT-TEN = 'VÁ, TEN(ente)!' dito como UMA palavra: A CURTO e a língua segura o T um instante, que é o 'tt', nada do VÁ comprido e solto de 'vad'; o TEN é o TENENTE cortado antes do segundo E: T duro de 'tatu', nunca 'tchen', e N batido na ponta da língua, sem o 'tẽi' nasal de 'tem'; força no VÁT, o TEN sai fraquinho)",
    historia:
      'Meio-dia de julho na varanda do restaurante, e a garganta é uma lixa: você ergue um copinho vazio e chama, CANA, IÁ!, e chega a CANA em pessoa: um policial de quepe, com um cassetete de cana-de-açúcar no cinto e uma mangueira de bombeiro no ombro. Ele chega bufando de calor, de bochechas redondas: FÔÔ! Você aponta o LITE escrito no copo (é só um pouquinho!) e late a ordem num golpe só, sem respirar entre as palavras: VÁT-TEN! (vá, tenente!). O tenente abre a mangueira com tudo... e sai UMA gota só, gorda e redondinha, que cai certinha no copo: um pouco de água, exatamente como você pediu.',
  },
  createScene,
}

export default card
