import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Var försiktig!" — VAR! FU-XÍK-TI!
 *
 * Lago congelado em janeiro. A vovó fuxiqueira testa o gelo com uma VARA
 * comprida (VAR!), enrolada num xale de FUXICO colorido; deita de lado com a
 * orelha colada no gelo pra escutar o fuxico lá de baixo — e o gelo só solta
 * o primeiro TI do ti-ti-ti: um anel único, e a rachadura corre direto pros
 * seus patins. Ela ergue a mão espalmada: cuidado!
 *
 * Diorama: disco de neve com o lago de gelo azul-claro, margem de neve com
 * dois pinheiros ao fundo; vovó de vestido azul-marinho deitada de lado no
 * centro, orelha no gelo, mão espalmada pro alto; a vara cravada em pé junto
 * do coque, e dela sai a rachadura azul-escura que contorna a vovó pela
 * frente até o par de patins.
 *
 * Paleta fria (gelo, neve, marinho, madeira clara); o acento saturado é
 * RESERVADO aos fuxicos do xale (FU-XÍK, a sílaba forte).
 */

const SNOW = '#eef3f7'
const SNOW_SHADE = '#c9d7e3'
const ICE = '#a6d6ea'
const ICE_LIGHT = '#dcf1f9'
const ICE_DEEP = '#86c0da'
const CRACK = '#163a72'
const PINE = '#2c5a46'
const PINE_DARK = '#224a3a'
const BARK = '#5b4232'
const NAVY = '#27345e'
const LACE = '#efe7da'
const SKIN = '#efc6a6'
const BLUSH = '#e5958c'
const HAIR = '#f2f1ec'
const WOOD = '#dcbc8c'
const WOOD_DARK = '#7c5638'
const STEEL = '#bcc5ce'
const BOOT = '#f3eee6'
const BOOT_DARK = '#3a3f52'
const BROWN = '#4a3426'

/** Fuxicos: [pano, franzido]. Únicas cores saturadas da cena. */
const FUX: [string, string][] = [
  ['#dc4338', '#a52e27'],
  ['#f2b72a', '#c08812'],
  ['#3ea35b', '#2a7841'],
  ['#ef77a5', '#c4537f'],
]

const GY = 0.17 // topo do gelo

// ---- vovó (unidades locais do grupo, escalado por S) -----------------------
const S = 1.25
const VX = 0.3
const VZ = -0.2
const PIV = 0.15 // quadril (pivô da tombada) acima do gelo
const SINK = 0.3 // quanto do corpo fica dentro da saia
const LEAN = 1.3 // deitada de lado, rumo ao gelo
const HEAD_TILT = 0.35 // a cabeça deita mais um pouco: orelha no gelo
const NECK = 0.05 // pescoço cede rumo ao gelo
const ARM_REST_L = 0.3 // braço de baixo pendurado
const ARM_P_REST = -0.3 // braço do "pare" pendurado
const ARM_P_UP = Math.PI - LEAN - 0.2 // erguido, levemente rumo aos patins

const VARA: [number, number] = [-1.3, -0.12]
const VARA_LEN = 1.65
const PATINS: [number, number] = [0.86, 1.46]
const ANEL: [number, number, number] = [-0.72, 1.32, 0.0]

/** Traço de letra: caixinha grossa em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number) {
  const s = rbox(w, h, 0.035, 0.012, '#ffffff', { roughness: 0.4 })
  s.position.set(x, y, 0)
  return s
}

/** Um fuxico: rodela de pano franzida, estufada, com o miolo pregueado. */
function fuxico(r: number, [cloth, dark]: [string, string], seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const disco = lathe(
    [
      [0, 0], [r * 0.96, 0], [r, 0.012], [r * 0.88, 0.03], [r * 0.6, 0.042],
      [r * 0.3, 0.04], [r * 0.16, 0.03], [0, 0.026],
    ],
    cloth,
    { roughness: 0.88 },
    28,
  )
  g.add(disco)
  // pregas irradiando do franzido
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + rand() * 0.3
    const prega = rbox(r * 0.42, 0.01, r * 0.09, 0.004, dark, { roughness: 0.9 })
    prega.position.set(Math.cos(a) * r * 0.38, 0.038, Math.sin(a) * r * 0.38)
    prega.rotation.y = -a
    g.add(prega)
  }
  const miolo = torus(r * 0.15, r * 0.075, dark, { roughness: 0.9 })
  miolo.rotation.x = Math.PI / 2
  miolo.position.y = 0.034
  g.add(miolo)
  return g
}

/** Pinheiro em três saias, com neve no topo de cada uma. */
function pine(h: number) {
  const g = new THREE.Group()
  const trunk = cylinder(0.055, 0.08, h * 0.22, BARK, { roughness: 0.9 })
  trunk.position.y = h * 0.11
  g.add(trunk)
  const tiers = [
    [0.5, 0.44, 0.15],
    [0.4, 0.4, 0.42],
    [0.28, 0.34, 0.66],
  ] as const
  for (const [rr, hh, yy] of tiers) {
    const r = rr * h * 0.62
    const th = hh * h
    const saia = cone(r, th, PINE, { roughness: 0.85 }, 9)
    saia.position.y = yy * h + th / 2
    g.add(saia)
    const neve = cone(r * 0.46, th * 0.44, SNOW, { roughness: 0.9 }, 9)
    neve.position.y = yy * h + th - th * 0.22 + 0.012
    g.add(neve)
    const sombra = cone(r * 1.02, th * 0.12, PINE_DARK, { roughness: 0.9 }, 9)
    sombra.position.y = yy * h + th * 0.06
    g.add(sombra)
  }
  return g
}

/** Patim de figura: bota de couro clara, lâmina prateada com ponteira. */
function skate() {
  const g = new THREE.Group()
  const steel = { roughness: 0.18, metalness: 0.85 }

  const blade = rbox(0.46, 0.05, 0.018, 0.016, STEEL, steel)
  blade.position.set(0.01, 0.025, 0)
  g.add(blade)
  // ponta da lâmina curvada pra cima e ponteira serrilhada
  const curl = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.009, 8, 16, Math.PI * 0.6),
    mat(STEEL, { ...steel, size: 0.1 }),
  )
  curl.castShadow = true
  curl.position.set(0.2, 0.06, 0)
  curl.rotation.z = -0.5
  g.add(curl)
  for (let k = 0; k < 3; k++) {
    const dente = cone(0.013, 0.03, STEEL, steel, 6)
    dente.rotation.z = Math.PI / 2 + 0.6
    dente.position.set(0.205, 0.035 + k * 0.022, 0)
    g.add(dente)
  }
  for (const sx of [-0.13, 0.12]) {
    const post = rbox(0.055, 0.085, 0.022, 0.01, STEEL, steel)
    post.position.set(sx, 0.09, 0)
    g.add(post)
  }
  const sole = rbox(0.38, 0.03, 0.13, 0.014, BROWN, { roughness: 0.7 })
  sole.position.set(0, 0.14, 0)
  g.add(sole)
  const heel = rbox(0.11, 0.06, 0.11, 0.02, BROWN, { roughness: 0.7 })
  heel.position.set(-0.13, 0.12, 0)
  g.add(heel)

  const foot = rbox(0.34, 0.13, 0.14, 0.06, BOOT, { roughness: 0.42 })
  foot.position.set(-0.01, 0.215, 0)
  g.add(foot)
  const toe = sphere(0.07, BOOT, { roughness: 0.42 })
  toe.scale.set(1.15, 0.9, 1)
  toe.position.set(0.1, 0.215, 0)
  g.add(toe)
  const shaft = rbox(0.17, 0.27, 0.14, 0.065, BOOT, { roughness: 0.42 })
  shaft.position.set(-0.085, 0.35, 0)
  shaft.rotation.z = -0.1
  g.add(shaft)
  const collar = torus(0.072, 0.018, '#d8d0c3', { roughness: 0.7 })
  collar.rotation.set(Math.PI / 2, 0.1, 0)
  collar.scale.set(1.18, 0.95, 1)
  collar.position.set(-0.1, 0.455, 0)
  g.add(collar)
  const tongue = rbox(0.06, 0.18, 0.09, 0.03, BOOT, { roughness: 0.5 })
  tongue.position.set(0.02, 0.4, 0)
  tongue.rotation.z = -0.32
  g.add(tongue)
  // cadarço em X no peito do pé
  for (let k = 0; k < 4; k++) {
    for (const s of [-1, 1]) {
      const lace = rbox(0.012, 0.012, 0.11, 0.005, BOOT_DARK, { roughness: 0.8 })
      lace.position.set(0.1 - k * 0.04, 0.29 + k * 0.035, 0)
      lace.rotation.set(0, s * 0.55, -0.4)
      g.add(lace)
    }
  }
  return g
}

/** Aponta um braço de person() (pivô no ombro) para um ponto do mundo. */
function aimArm(arm: THREE.Object3D, target: THREE.Vector3) {
  arm.parent!.updateMatrixWorld(true)
  const shoulder = new THREE.Vector3()
  arm.getWorldPosition(shoulder)
  const inv = new THREE.Quaternion()
  arm.parent!.getWorldQuaternion(inv)
  inv.invert()
  const d = target.clone().sub(shoulder).applyQuaternion(inv).normalize()
  // Rx(ψ)·Rz(φ)·(0,-1,0) = (sinφ, −cosφ·cosψ, −cosφ·sinψ)
  const c = Math.hypot(d.y, d.z)
  return { z: Math.atan2(d.x, -c), x: Math.atan2(d.z, d.y) }
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base: disco de neve com o lago congelado ----------------------------
  const base = new THREE.Group()

  const terra = cylinder(2.62, 2.72, 0.14, SNOW_SHADE, { roughness: 0.95 })
  terra.position.y = 0.07
  base.add(terra)

  const lago = cylinder(2.2, 2.22, 0.05, ICE, { roughness: 0.12 })
  lago.position.set(0, GY - 0.025, 0.25)
  base.add(lago)

  // manchas de gelo mais fundo e mais claro, rentes ao tampo
  for (const [px, pz, rx, rz, c] of [
    [-1.2, 1.05, 0.55, 0.3, ICE_DEEP],
    [0.9, -0.95, 0.5, 0.28, ICE_DEEP],
    [0.2, 1.95, 0.45, 0.2, ICE_LIGHT],
    [1.75, 0.35, 0.3, 0.18, ICE_LIGHT],
  ] as const) {
    const m = cylinder(1, 1, 0.006, c, { roughness: 0.1 })
    m.scale.set(rx, 1, rz)
    m.position.set(px, GY + 0.002, pz)
    m.rotation.y = rand() * Math.PI
    base.add(m)
  }

  // riscos de patinação: arcos finos esbranquiçados
  for (const [px, pz, r, a0, arc] of [
    [-0.5, 1.6, 0.9, 0.4, 1.6],
    [0.6, 1.9, 1.2, 3.6, 1.3],
    [-1.6, 0.0, 0.7, 5.0, 1.8],
  ] as const) {
    const trail = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.008, 6, 64, arc),
      mat(ICE_LIGHT, { roughness: 0.3, size: 0.3 }),
    )
    trail.rotation.set(Math.PI / 2, 0, a0)
    trail.position.set(px, GY + 0.004, pz)
    trail.receiveShadow = true
    base.add(trail)
  }

  // margem de neve: montes fofos no arco de trás e nas laterais
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.98 + i * 0.105)
    const r = 2.28 + (rand() - 0.5) * 0.15
    const monte = puff(0.3 + rand() * 0.14, SNOW, 5, 70 + i, { roughness: 0.95 })
    monte.position.set(Math.cos(a) * r, 0.14, Math.sin(a) * r)
    monte.scale.set(1.25, 0.45, 1)
    monte.rotation.y = -a
    base.add(monte)
  }
  for (const [px, pz, rr] of [[-2.25, 0.85, 0.22], [2.3, 0.7, 0.2], [-1.75, 1.6, 0.16]] as const) {
    const monte = puff(rr, SNOW, 4, 90, { roughness: 0.95 })
    monte.position.set(px, 0.14, pz)
    monte.scale.y = 0.45
    base.add(monte)
  }
  root.add(base)

  // ---- pinheiros na margem -------------------------------------------------
  const pinheiros = new THREE.Group()
  const p1 = pine(1.75)
  p1.position.set(-1.95, 0.14, -1.5)
  pinheiros.add(p1)
  const p2 = pine(1.35)
  p2.position.set(2.0, 0.14, -1.3)
  p2.rotation.y = 0.5
  pinheiros.add(p2)
  root.add(pinheiros)

  // ---- vovó deitada de lado, orelha no gelo --------------------------------
  const vovo = new THREE.Group()
  vovo.position.set(VX, GY, VZ)
  vovo.scale.setScalar(S)
  root.add(vovo)

  // saia comprida cobrindo as pernas dobradas, esticada pra direita
  const saia = lathe(
    [
      [0, 0], [0.5, 0], [0.54, 0.03], [0.51, 0.1], [0.44, 0.19], [0.34, 0.27],
      [0.22, 0.32], [0, 0.34],
    ],
    NAVY,
    { roughness: 0.85 },
  )
  saia.scale.set(1.45, 0.85, 0.72)
  saia.position.x = 0.4
  vovo.add(saia)
  const barra = torus(0.52, 0.024, LACE, { roughness: 0.85 })
  barra.rotation.x = Math.PI / 2
  barra.scale.set(1.45, 0.72, 1)
  barra.position.set(0.4, 0.028, 0)
  vovo.add(barra)
  // dobras do pano
  for (const [fx, fz, fr] of [[0.72, 0.22, 0.55], [0.3, 0.26, -0.35]] as const) {
    const dobra = capsule(0.02, 0.2, '#202c52', { roughness: 0.9 })
    dobra.position.set(fx, 0.12, fz)
    dobra.rotation.set(-0.9, 0, fr)
    vovo.add(dobra)
  }
  // bolinhas brancas no vestido, só na face à vista do domo
  {
    const dotRand = rng(41)
    for (let k = 0; k < 26; k++) {
      const a = (dotRand() - 0.5) * Math.PI * 1.15 // em volta, de frente pra câmera
      const e = 0.15 + dotRand() * 1.15 // elevação
      const n = new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a))
      const pos = new THREE.Vector3(n.x * 0.77, n.y * 0.29, n.z * 0.38)
      if (pos.x < -0.1) continue // a cintura fica lisa
      const nrm = new THREE.Vector3(n.x / 0.77, n.y / 0.29, n.z / 0.38).normalize()
      const bolinha = sphere(0.026, LACE, { roughness: 0.85 })
      bolinha.scale.set(1, 0.3, 1)
      bolinha.position.set(0.4 + pos.x, pos.y, pos.z).addScaledVector(nrm, 0.002)
      bolinha.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm)
      vovo.add(bolinha)
    }
  }
  // botinhas saindo por baixo da barra, na ponta das pernas
  for (const [bz, br] of [[-0.1, 0.12], [0.1, -0.18]] as const) {
    const bota = new THREE.Group()
    bota.position.set(1.12, 0, bz)
    bota.rotation.y = br
    const cano = rbox(0.12, 0.13, 0.11, 0.045, BROWN, { roughness: 0.55 })
    cano.position.set(0, 0.07, 0)
    bota.add(cano)
    const bico = sphere(0.06, BROWN, { roughness: 0.55 })
    bico.scale.set(1.2, 0.85, 0.95)
    bico.position.set(0.07, 0.05, 0)
    bota.add(bico)
    const sola = rbox(0.2, 0.025, 0.115, 0.01, '#2c1f17', { roughness: 0.7 })
    sola.position.set(0.03, 0.012, 0)
    bota.add(sola)
    vovo.add(bota)
  }

  // pivô do quadril: a tombada inteira acontece aqui
  const tronco = new THREE.Group()
  tronco.position.y = PIV
  tronco.rotation.z = LEAN
  vovo.add(tronco)

  const corpo = person({ body: NAVY, skin: SKIN, height: 1.5, armAngle: 0.3 })
  corpo.position.y = -SINK
  tronco.add(corpo)

  // gola de renda clarinha e cinto do avental marcando a cintura
  const gola = torus(0.16, 0.03, LACE, { roughness: 0.85 })
  gola.rotation.x = Math.PI / 2
  gola.position.y = 0.79
  corpo.add(gola)
  const cinto = torus(0.262, 0.03, LACE, { roughness: 0.85 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.33
  corpo.add(cinto)

  // ---- cabeça: coque branco, óculos redondos, boca de susto ----------------
  const cabeca = corpo.getObjectByName('head') as THREE.Group
  cabeca.rotation.z = HEAD_TILT
  // o pescoço cede rumo ao gelo (direção "baixo" do mundo no referencial do corpo)
  cabeca.position.x -= NECK * Math.sin(LEAN)
  cabeca.position.y -= NECK * Math.cos(LEAN)
  const HR = 0.285

  // cabelo: calota inclinada pra trás (testa livre) + cachinhos na raiz
  const HAIR_TILT = -0.62
  const RC = HR * 1.04
  const calota = new THREE.Mesh(
    new THREE.SphereGeometry(RC, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    mat(HAIR, { roughness: 0.75, size: 0.3 }),
  )
  calota.castShadow = true
  calota.rotation.x = HAIR_TILT
  cabeca.add(calota)
  for (let k = 0; k < 18; k++) {
    const t = (k / 18) * Math.PI * 2
    const cacho = sphere(0.052 + (k % 2) * 0.01, HAIR, { roughness: 0.8 })
    // ponto do equador da calota, girado junto com ela
    const ex = Math.cos(t) * RC
    const ez = Math.sin(t) * RC
    cacho.position.set(ex, -ez * Math.sin(HAIR_TILT), ez * Math.cos(HAIR_TILT))
    cabeca.add(cacho)
  }
  const coque = sphere(HR * 0.46, HAIR, { roughness: 0.75 })
  coque.position.set(0, HR * 1.02, -HR * 0.38)
  coque.scale.set(1, 0.88, 1)
  cabeca.add(coque)
  const coqueVolta = torus(HR * 0.38, HR * 0.1, '#e2e0d9', { roughness: 0.75 })
  coqueVolta.rotation.x = Math.PI / 2 - 0.5
  coqueVolta.position.set(0, HR * 0.92, -HR * 0.34)
  cabeca.add(coqueVolta)
  for (const s of [-1, 1]) {
    const grampo = cylinder(0.011, 0.011, 0.26, WOOD_DARK, { roughness: 0.5 })
    grampo.position.set(0, HR * 1.04, -HR * 0.38)
    grampo.rotation.set(0.25, 0, Math.PI / 2 + s * 0.35)
    cabeca.add(grampo)
  }

  for (const side of [-1, 1]) {
    const aro = torus(0.074, 0.012, '#9a7a3e', { roughness: 0.3, metalness: 0.7 })
    aro.position.set(side * 0.108, 0.034, 0.3)
    cabeca.add(aro)
    const haste = rbox(0.012, 0.012, 0.16, 0.005, '#9a7a3e', { roughness: 0.3, metalness: 0.7 })
    haste.position.set(side * 0.19, 0.05, 0.21)
    haste.rotation.y = side * 0.35
    cabeca.add(haste)
    const sobrancelha = capsule(0.018, 0.08, '#a9a39b', { roughness: 0.8 })
    sobrancelha.position.set(side * 0.112, 0.15, 0.262)
    sobrancelha.rotation.set(-0.3, 0, Math.PI / 2 + side * 0.28)
    cabeca.add(sobrancelha)
    const bochecha = sphere(0.05, BLUSH, { roughness: 0.8 })
    bochecha.scale.set(1, 0.7, 0.35)
    bochecha.position.set(side * 0.16, -0.06, 0.235)
    cabeca.add(bochecha)
  }
  const ponte = capsule(0.01, 0.04, '#9a7a3e', { roughness: 0.3, metalness: 0.7 })
  ponte.rotation.z = Math.PI / 2
  ponte.position.set(0, 0.045, 0.31)
  cabeca.add(ponte)
  // boca de susto: um "o" de lábios com o fundo escuro
  const boca = sphere(0.036, '#3a1616', { roughness: 0.6 })
  boca.scale.set(0.9, 1.1, 0.4)
  boca.position.set(0, -0.125, 0.258)
  cabeca.add(boca)
  const labios = torus(0.034, 0.013, '#c46a64', { roughness: 0.55 })
  labios.scale.set(0.9, 1.1, 1)
  labios.position.set(0, -0.125, 0.268)
  labios.rotation.x = -0.25
  cabeca.add(labios)

  // ---- xale de fuxicos sobre os ombros (filho do corpo) --------------------
  const xale = new THREE.Group()
  xale.position.y = 0.62
  corpo.add(xale)
  const rows = [
    { y: 0.14, r: 0.21, n: 9, span: 1.0, size: 0.07, up: 1.4 },
    { y: 0.05, r: 0.285, n: 11, span: 0.92, size: 0.075, up: 0.6 },
    { y: -0.06, r: 0.3, n: 9, span: 0.62, size: 0.072, up: 0.25 },
  ]
  let fi = 0
  for (const row of rows) {
    for (let i = 0; i < row.n; i++) {
      // ângulo em volta do corpo: 0 = de frente pra câmera
      const t = row.n === 1 ? 0 : i / (row.n - 1) - 0.5
      const a = t * Math.PI * 2 * row.span * 0.5 * 1.9
      // abertura em V no peito na fileira de baixo
      if (row.y < 0 && Math.abs(a) < 0.35) continue
      const f = fuxico(row.size, FUX[(fi + (row.y > 0.1 ? 1 : 0)) % FUX.length], 200 + fi)
      fi++
      const n = new THREE.Vector3(Math.sin(a), row.up, Math.cos(a)).normalize()
      f.position.set(Math.sin(a) * row.r, row.y, Math.cos(a) * row.r)
      f.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n)
      f.rotateY(rand() * Math.PI)
      xale.add(f)
    }
  }
  // o xale cobre o ombro de onde sai o braço erguido
  for (const [px, py, pz, nx, ny, nz, c] of [
    [0.33, 0.12, 0.06, 0.8, 0.55, 0.35, 0],
    [0.31, 0.04, 0.2, 0.7, 0.2, 0.75, 2],
  ] as const) {
    const f = fuxico(0.08, FUX[c], 400 + c)
    f.position.set(px, py, pz)
    f.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(nx, ny, nz).normalize(),
    )
    xale.add(f)
  }
  // pontas do xale caindo dos lados
  for (const s of [-1, 1]) {
    const ponta = fuxico(0.075, FUX[(s + 2) % FUX.length], 300 + s)
    ponta.position.set(s * 0.29, -0.16, 0.05)
    ponta.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(s, 0.1, 0.35).normalize(),
    )
    xale.add(ponta)
  }

  // ---- braços --------------------------------------------------------------
  // braço de cima: erguido com a mão espalmada (PARE!)
  const bracoPare = corpo.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoPare, 1.5)
  bracoPare.rotation.z = ARM_P_UP
  const luva = bracoPare.children[0]
  luva.visible = false
  const mao = new THREE.Group()
  mao.position.y = luva.position.y - 0.02
  bracoPare.add(mao)
  const palma = rbox(0.17, 0.15, 0.065, 0.03, SKIN, { roughness: 0.6 })
  palma.position.y = -0.03
  mao.add(palma)
  for (let k = 0; k < 4; k++) {
    const dedo = capsule(0.024, 0.085, SKIN, { roughness: 0.6 })
    const fx = -0.06 + k * 0.04
    dedo.position.set(fx * 1.15, -0.165, 0)
    dedo.rotation.z = fx * 1.6
    mao.add(dedo)
  }
  const polegar = capsule(0.026, 0.07, SKIN, { roughness: 0.6 })
  polegar.position.set(-0.11, -0.02, 0.01)
  polegar.rotation.z = -0.85
  mao.add(polegar)
  const punho = torus(0.075, 0.018, LACE, { roughness: 0.85 })
  punho.rotation.x = Math.PI / 2
  punho.position.y = 0.06
  mao.add(punho)

  // braço de baixo: esticado por trás da cabeça, rumo à vara
  const bracoGelo = corpo.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoGelo, 1.5)

  // ---- vara cravada em pé ao lado do coque ---------------------------------
  const vara = new THREE.Group()
  vara.position.set(VARA[0], 0, VARA[1])
  root.add(vara)

  const haste = lathe(
    [
      [0, GY - 0.02], [0.03, GY - 0.02], [0.034, GY + 0.1], [0.034, VARA_LEN - 0.1],
      [0.03, VARA_LEN], [0, VARA_LEN + 0.005],
    ],
    WOOD,
    { roughness: 0.55 },
    16,
  )
  vara.add(haste)
  const ponteira = cone(0.038, 0.14, STEEL, { roughness: 0.2, metalness: 0.85 }, 16)
  ponteira.rotation.x = Math.PI
  ponteira.position.y = GY + 0.0
  vara.add(ponteira)
  const virola = cylinder(0.042, 0.042, 0.1, STEEL, { roughness: 0.2, metalness: 0.85 }, 16)
  virola.position.y = GY + 0.1
  vara.add(virola)
  // empunhadura de couro e alça no topo
  const grip = cylinder(0.042, 0.042, 0.3, WOOD_DARK, { roughness: 0.7 }, 16)
  grip.position.y = VARA_LEN - 0.3
  vara.add(grip)
  for (let k = 0; k < 4; k++) {
    const fita = torus(0.043, 0.006, '#5c3d26', { roughness: 0.8 })
    fita.rotation.x = Math.PI / 2
    fita.position.y = VARA_LEN - 0.42 + k * 0.08
    vara.add(fita)
  }
  const alca = torus(0.08, 0.012, '#5c3d26', { roughness: 0.8 })
  alca.position.set(0, VARA_LEN + 0.06, 0)
  vara.add(alca)

  // ---- lascas de gelo pulando onde a ponteira entrou ----------------------
  const lascas = new THREE.Group()
  lascas.position.set(VARA[0], GY, VARA[1])
  root.add(lascas)
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + rand() * 0.5
    const d = 0.11 + rand() * 0.07
    const lasca = cone(0.032, 0.07, ICE_LIGHT, { roughness: 0.15 }, 4)
    lasca.position.set(Math.cos(a) * d, 0.025 + rand() * 0.03, Math.sin(a) * d)
    lasca.rotation.set(rand() * 1.2, a, rand() * 1.2)
    lascas.add(lasca)
  }

  // ---- rachadura: da ponteira, contornando a vovó pela frente, até os patins
  const rachadura = new THREE.Group()
  rachadura.position.set(VARA[0], GY, VARA[1])
  root.add(rachadura)

  const way: [number, number][] = [
    [VARA[0], VARA[1]],
    [VARA[0] - 0.02, VARA[1] + 0.55],
    [VARA[0] + 0.45, VARA[1] + 1.02],
    [-0.15, 1.1],
    [0.3, 1.32],
    [PATINS[0] - 0.3, PATINS[1] + 0.02],
  ]
  const pts: [number, number][] = [[0, 0]]
  for (let w = 0; w < way.length - 1; w++) {
    const [ax, az] = way[w]
    const [bx, bz] = way[w + 1]
    const len = Math.hypot(bx - ax, bz - az)
    const steps = Math.max(2, Math.round(len / 0.16))
    const nx = -(bz - az) / len
    const nz = (bx - ax) / len
    for (let i = 1; i <= steps; i++) {
      const k = i / steps
      const j = i === steps ? 0 : (i % 2 ? 1 : -1) * (0.04 + rand() * 0.05)
      pts.push([ax + (bx - ax) * k + nx * j - VARA[0], az + (bz - az) * k + nz * j - VARA[1]])
    }
  }
  const crackSeg = (a: [number, number], b: [number, number], w: number) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) + w * 0.6
    const ang = -Math.atan2(b[1] - a[1], b[0] - a[0])
    const borda = rbox(len + 0.02, 0.008, w * 2.6, 0.004, ICE_LIGHT, { roughness: 0.2 })
    borda.position.set((a[0] + b[0]) / 2, 0.005, (a[1] + b[1]) / 2)
    borda.rotation.y = ang
    rachadura.add(borda)
    const sulco = rbox(len, 0.014, w, 0.006, CRACK, { roughness: 0.35 })
    sulco.position.set((a[0] + b[0]) / 2, 0.01, (a[1] + b[1]) / 2)
    sulco.rotation.y = ang
    rachadura.add(sulco)
  }
  for (let i = 0; i < pts.length - 1; i++) {
    crackSeg(pts[i], pts[i + 1], 0.07 - (i / pts.length) * 0.025)
  }
  // galhinhos laterais
  for (let i = 3; i < pts.length - 2; i += 3) {
    const a = pts[i]
    const s = (i / 3) % 2 ? 1 : -1
    const l = 0.18 + rand() * 0.1
    const b: [number, number] = [a[0] + l * 0.6, a[1] + s * l * 0.8]
    crackSeg(a, b, 0.032)
  }
  // estrela de trincas na entrada da ponteira
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3
    const b: [number, number] = [Math.cos(a) * 0.24, Math.sin(a) * 0.24]
    crackSeg([0, 0], b, 0.032)
  }

  // ---- par de patins parados na ponta da rachadura -------------------------
  const patins = new THREE.Group()
  patins.position.set(PATINS[0], GY, PATINS[1])
  patins.rotation.y = Math.PI - 0.35 // bico virado pra vovó
  root.add(patins)
  for (const [sz, sx, ry] of [[-0.12, 0.0, 0.05], [0.13, -0.05, -0.08]] as const) {
    const sk = skate()
    sk.position.set(sx, 0, sz)
    sk.rotation.y = ry
    patins.add(sk)
  }

  // ---- o TI: um anel de som único saltando do gelo ------------------------
  const anel = new THREE.Group()
  anel.position.set(...ANEL)
  anel.rotation.set(-0.1, 0.12, 0)
  root.add(anel)
  const aro = torus(0.24, 0.034, '#ffffff', { emissive: '#e8f6ff', emissiveIntensity: 0.55 })
  anel.add(aro)
  const ti = new THREE.Group()
  ti.add(stroke(0.15, 0.04, -0.06, 0.07))
  ti.add(stroke(0.04, 0.2, -0.06, -0.01))
  ti.add(stroke(0.04, 0.2, 0.075, -0.01))
  anel.add(ti)

  // a pose final do braço de baixo mira a base da vara (por trás da cabeça)
  root.updateMatrixWorld(true)
  const aim = aimArm(bracoGelo, new THREE.Vector3(VARA[0] + 0.25, GY + 0.1, VARA[1] - 0.75))
  const ARM_G_Z = aim.z > 1 ? aim.z - Math.PI * 2 : aim.z
  const ARM_G_X = aim.x
  bracoGelo.rotation.set(ARM_G_X, 0, ARM_G_Z)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'lago', object: base },
    { name: 'pinheiros', group: 'lago', object: pinheiros },
    { name: 'vovo', group: 'vara', object: vovo },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'xale', group: 'fuxico', object: xale },
    { name: 'tronco', group: 'orelha', object: tronco },
    { name: 'cabeca', group: 'orelha', object: cabeca },
    { name: 'bracoGelo', group: 'orelha', object: bracoGelo },
    { name: 'anel', group: 'ti', object: anel },
    { name: 'lascas', group: 'ti', object: lascas },
    { name: 'patins', group: 'racha', object: patins },
    { name: 'rachadura', group: 'racha', object: rachadura },
    { name: 'bracoPare', group: 'pare', object: bracoPare },
  ]

  const s3 = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Lago congelado em janeiro: brota o gelo azul, a margem de neve e dois pinheiros…',
    }),
    seq('pinheiros-rise', 'pinheiros', 0.25, 0.9, [riseFrom(0, 2.0)], { ease: 'easeOut' }),

    // a vovó sobe sentada e ereta; as peças do corpo aparecem junto
    seq('vovo-rise', 'vovo', 1.7, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'A vovó vai na sua frente batendo uma VARA comprida no gelo: VAR! VAR!',
    }),
    seq('tronco-ereto', 'tronco', 1.7, 0.01, [ch('rotation.z', 0, 0)]),
    seq('cabeca-reta', 'cabeca', 1.7, 0.01, [ch('rotation.z', 0, 0)]),
    seq('braco-gelo-solto', 'bracoGelo', 1.7, 0.01, [
      ch('rotation.z', ARM_REST_L, ARM_REST_L), ch('rotation.x', 0, 0),
    ]),
    seq('braco-pare-solto', 'bracoPare', 1.7, 0.01, [ch('rotation.z', ARM_P_REST, ARM_P_REST)]),
    seq('vara-cai', 'vara', 2.0, 0.4, [ch('position.y', 2.4, 0.05)], { ease: 'easeIn' }),
    seq('vara-quica', 'vara', 2.4, 0.25, [ch('position.y', 0.05, 0.4)], { ease: 'easeOut' }),
    seq('vara-bate', 'vara', 2.65, 0.25, [ch('position.y', 0.4, 0.05)], { ease: 'easeIn' }),

    seq('xale-abre', 'xale', 3.7, 0.8, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Fuxiqueira de nascença, ela vem enrolada num xale de FUXICO colorido…',
    }),

    seq('tronco-deita', 'tronco', 5.2, 1.1, [ch('rotation.z', 0, LEAN)], {
      caption: '…e deita de lado, com a orelha colada no gelo, pra escutar o FUXICO lá de baixo.',
    }),
    seq('cabeca-deita', 'cabeca', 5.5, 0.9, [ch('rotation.z', 0, HEAD_TILT)]),
    seq('braco-gelo-estica', 'bracoGelo', 5.1, 1.2, [
      ch('rotation.z', ARM_REST_L, ARM_G_Z), ch('rotation.x', 0, ARM_G_X),
    ]),

    seq('lascas-pulam', 'lascas', 7.0, 0.35, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Mas o gelo fino só solta o primeiro TI do ti-ti-ti — um TI! único, agudo e seco…',
    }),
    seq('anel-salta', 'anel', 7.0, 0.6, [
      ch('position.x', VARA[0], ANEL[0]), ch('position.y', GY + 0.2, ANEL[1]), ...s3(0.15, 1),
    ], { ease: 'easeOut' }),

    seq('patins-chegam', 'patins', 8.4, 0.5, [
      ch('position.x', PATINS[0] + 0.9, PATINS[0]), ch('position.z', PATINS[1] + 0.5, PATINS[1]),
    ], {
      ease: 'easeOut',
      caption: '…e racha: a rachadura azul corre direto pros seus patins!',
    }),
    seq('racha-corre', 'rachadura', 8.7, 0.9, [ch('scale.x', 0.02, 1), ch('scale.z', 0.02, 1)], {
      ease: 'easeOut',
    }),

    seq('braco-pare-ergue', 'bracoPare', 10.0, 0.6, [ch('rotation.z', ARM_P_REST, ARM_P_UP)], {
      ease: 'easeOut',
      caption: 'A vovó ergue a mão espalmada na sua cara e crava a vara: VAR! FU-XÍK-TI!',
    }),
    seq('vara-ergue', 'vara', 10.0, 0.25, [ch('position.y', 0.05, 0.32)], { ease: 'easeOut' }),
    seq('vara-crava', 'vara', 10.25, 0.3, [ch('position.y', 0.32, 0)], { ease: 'easeIn' }),

    seq('anel-pulsa', 'anel', 11.3, 0.3, s3(1, 1.15), {
      ease: 'easeOut',
      caption: 'Var försiktig! — Cuidado! / Toma cuidado!',
    }),
    seq('anel-volta', 'anel', 11.6, 0.4, s3(1.15, 1), { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.05, 1.6, 3.95], target: [-0.05, 0.7, 0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-forsiktig',
    contexto:
      "Inverno e dia a dia: quando alguém sai pro gelo, pega o carro, sobe numa escada — e o clássico de novembro a março: 'Var försiktig, det är halt ute!' (cuidado, tá escorregadio lá fora).",
    fraseFonte: 'Cuidado! / Toma cuidado!',
    fraseAlvo: 'Var försiktig!',
    pronuncia:
      "var fö-SHÍK-ti! ('var' com A longo e R brando; o 'rs' vira um X chiado: fö-SHÍK; força no SHÍK, com I curto e K firme, grudado no T sem vogal no meio; o -ti do fim é fraquinho e de T duro, nunca 'tchi'; o -g final não soa na fala)",
    ponteSonora:
      "VAR! FU-XÍK-TI! (4 sílabas: var-fö-SHÍK-ti; força total no XÍK; VAR = a VARA sem o -a, a mesma VARA de 'Var kan jag köpa biljett?' e 'Var bor du?' — R BRANDO e AUDÍVEL: sem ele sobra VÁ, que é 'vad'; aqui o 'var' é o 'seja!' (de 'vara'), mas o som é o mesmo; FU-XÍK = o FUXICO cortado no K: FU fraquinho e rápido — é o 'för' sem força, o mesmo FUR de FUR-LÔT ('Förlåt'), com os lábios já arredondados —, o X é o chiado do 'rs', o mesmo de FÖ-XÊ-NAT e FÖ-XKU-LAN, e a força TODA cai no XÍK, I CURTO; TI = o primeiro TI do ti-ti-ti, a fofoca que vem junto com todo fuxico — UM só, e GRUDADO no K, sem respiro nem vogal no meio: XÍK-TI sai num empurrão só, como o CHÉK-ta de 'Ursäkta', nunca 'xí-ki-ti' nem 'xí-ko-ti', que criam uma sílaba a mais; o T é DURO, de 'tatu', o mesmo T de TITA em 'Jag tittar bara' — nunca 'tchi' — e o I sai curtinho e sem força; o -g final de 'försiktig' não soa na fala, como o de 'trevlig' e 'hungrig')",
    historia:
      "Lago congelado em janeiro: a vovó vai na sua frente, enrolada num xale de FUXICO colorido, batendo uma VARA comprida no gelo como fazem os patinadores suecos — VAR! VAR! Fuxiqueira de nascença, ela se abaixa e cola a orelha no gelo pra escutar o FUXICO lá de baixo. Mas o gelo fino só consegue soltar o primeiro TI do ti-ti-ti — um TI! único, agudo e seco — e racha: a rachadura corre direto pros seus patins. A vovó ergue a mão espalmada na sua cara e crava a vara no gelo: cuidado!",
  },
  createScene,
}

export default card
