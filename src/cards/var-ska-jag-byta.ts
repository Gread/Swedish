import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, rock,
} from '../rig/helpers'

/**
 * "Var ska jag byta?" — VAR! SKA… IÁ… BI(R)ÚTA?
 *
 * Estação de baldeação sem placa nenhuma: só uma VARA altíssima com uma
 * BIRUTA laranja no topo — troca-se pro trem que ela apontar. Sem vento, ela
 * pende murcha; o grilo de chapéu porkpie sobe a VARA e sopra um SKA no
 * trompete, os anéis de sopro enchem a biruta, ela gira e — IÁ! — trava
 * apontando pro trem verde do outro lado.
 *
 * Diorama: leito de brita com trilhos ao fundo, plataforma de concreto com
 * faixa amarela na frente; tabuleiro xadrez na base da vara; o grilo agarrado
 * à vara do lado da biruta, soprando pra cima, no vão entre a vara e a boca
 * dela. Acento saturado (laranja) reservado à BIRUTA.
 */

const BED = '#4d4945'
const SLEEPER = '#6b5847'
const RAIL = '#a7afb4'
const CONCRETE = '#8f918c'
const CONCRETE_DARK = '#74766f'
const COPING = '#adaca4'
const SAFETY = '#d9b53b'
const CHECK_DARK = '#26252a'
const CHECK_LIGHT = '#ece6d8'
const ROD = '#d8b06a' // a mesma VARA bege-mel de 'Var kan jag köpa biljett?'
const STEEL = '#525b63'
const SOCK = '#f26a1b' // ACENTO saturado — reservado à BIRUTA (byta)
const SOCK_WHITE = '#f4f0e7'
const LEAF = '#4f9a2f'
const LEAF_DARK = '#356b22'
const LEAF_LIGHT = '#8fc455'
const CHITIN = '#5b4027'
const HAT = '#242126'
const HAT_BAND = '#b33a2f'
const BRASS = '#e2b33f'
const WIND = '#aee0f5'
const TRAIN = '#c7da55'
const TRAIN_DARK = '#7f9b2e'
const GLASS = '#1d2731'
const ROOF = '#c6cbca'

const R = 2.6 // raio do diorama
const BED_Y = 0.16 // topo do leito de brita
const PY = 0.38 // topo da plataforma
const EDGE_Z = -0.7 // borda da plataforma (o leito fica atrás)
const TZ = -1.38 // eixo dos trilhos
const TX = 0.92 // centro do vagão

const POLE_X = -0.8
const POLE_Z = -0.1
const TOP = 3.85 // topo da vara (pivô da biruta)
const ARM = 0.62 // braço do pivô até o centro do aro
const HOOP_R = 0.27
const SOCK_L = 1.45
const PSI = 0.35 // pose final: biruta apontando pro trem (direita, pro fundo)
const TILT = -0.16 // levemente caída na direção do trem
const DROOP = -1.42 // murcha: pende do aro
const LIMP = 0.4 // murcha: achatada
const SHRUNK = 0.82 // murcha: amarrotada, mais curta
const YAW_LIMP = -2.21 + 4 * Math.PI // murcha, pendendo à esquerda; gira até PSI

// grilo: agarrado à vara do lado da biruta, de perfil para a câmera
const GS = 1.22 // escala do grilo
const GRY = -1.92 // a barriga (+z local) encara a vara
const GD = 0.27 // distância do tórax ao eixo da vara (mundo)
const GY = 1.72 // altura final do tórax
const HORN_K = 0.85 // escala do trompete

const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b — membros. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(Y, d.normalize())
  return m
}

/** Cilindro de a até b — tubos. */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = b.clone().sub(a)
  const m = cylinder(r, r, d.length(), color, opts, 16)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(Y, d.normalize())
  return m
}

/** Fatia do disco com z >= zEdge, extrudada pra cima: a plataforma. */
function platformSlab(radius: number, zEdge: number, h: number, color: string) {
  const yc = -zEdge // no plano da Shape, y = -z do mundo
  const a = Math.sqrt(radius * radius - yc * yc)
  const th = Math.atan2(yc, a)
  const shape = new THREE.Shape()
  shape.moveTo(a, yc)
  shape.absarc(0, 0, radius, th, Math.PI - th, true)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 72,
  })
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.85, size: 1 }))
  m.rotation.x = -Math.PI / 2
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Meia-volta de tubo (curvas do trompete, alça da mala). */
function bend(r: number, tube: number, color: string, opts?: MatOpts) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 24, Math.PI), mat(color, { ...opts, size: r * 2 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- estação: leito de brita, trilhos, plataforma com faixa amarela ------
  const base = new THREE.Group()

  const soil = cylinder(2.68, 2.76, 0.1, '#2c2a28', { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)

  const bed = cylinder(R, 2.66, 0.06, BED, { roughness: 0.95 })
  bed.position.y = BED_Y - 0.03
  base.add(bed)

  // dormentes e trilhos (cordas do círculo, sem sair do disco)
  for (let x = -2.2; x <= 2.21; x += 0.32) {
    const zOut = TZ - 0.38
    if (x * x + zOut * zOut > (R - 0.08) ** 2) continue
    const s = rbox(0.11, 0.035, 0.76, 0.01, SLEEPER, { roughness: 0.9 })
    s.position.set(x, BED_Y + 0.017, TZ)
    s.rotation.y = (rand() - 0.5) * 0.06
    base.add(s)
  }
  for (const dz of [-0.27, 0.27]) {
    const z = TZ + dz
    const half = Math.sqrt(R * R - z * z) - 0.12
    const rail = rbox(half * 2, 0.05, 0.045, 0.01, RAIL, { roughness: 0.3, metalness: 0.75 })
    rail.position.set(0, BED_Y + 0.06, z)
    base.add(rail)
  }
  // brita solta no leito
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const pebble = rock(0.035 + rand() * 0.03, '#6a645d', 70 + i, { roughness: 0.95 })
    const px = Math.cos(a) * (1.6 + rand() * 0.7)
    const pz = TZ + (rand() - 0.5) * 1.0
    if (px * px + pz * pz > (R - 0.1) ** 2) continue
    pebble.position.set(px, BED_Y + 0.02, pz)
    base.add(pebble)
  }

  const platform = platformSlab(R - 0.04, EDGE_Z, PY - BED_Y - 0.04, CONCRETE)
  platform.position.y = BED_Y + 0.02
  base.add(platform)

  // borda de pedra clara + faixa amarela de segurança com frisos táteis
  const chordAt = (z: number, margin: number) => 2 * (Math.sqrt(R * R - z * z) - margin)
  const coping = rbox(chordAt(EDGE_Z, 0.05), 0.03, 0.12, 0.012, COPING, { roughness: 0.7 })
  coping.position.set(0, PY + 0.005, EDGE_Z + 0.06)
  base.add(coping)
  const stripeZ = EDGE_Z + 0.25
  const stripe = rbox(chordAt(stripeZ, 0.07), 0.025, 0.2, 0.01, SAFETY, { roughness: 0.6 })
  stripe.position.set(0, PY + 0.004, stripeZ)
  base.add(stripe)
  for (const dz of [-0.06, 0, 0.06]) {
    const ridge = rbox(chordAt(stripeZ, 0.1), 0.02, 0.022, 0.008, SAFETY, { roughness: 0.55 })
    ridge.position.set(0, PY + 0.02, stripeZ + dz)
    base.add(ridge)
  }
  // juntas das lajes
  for (const z of [0.35, 1.2, 2.0]) {
    const j = rbox(chordAt(z, 0.06), 0.012, 0.018, 0.005, CONCRETE_DARK, { roughness: 0.9 })
    j.position.set(0, PY + 0.002, z)
    base.add(j)
  }
  for (const x of [-1.7, -0.85, 0.85, 1.7]) {
    const z1 = Math.sqrt(R * R - x * x) - 0.06
    const z0 = EDGE_Z + 0.38
    const j = rbox(0.018, 0.012, z1 - z0, 0.005, CONCRETE_DARK, { roughness: 0.9 })
    j.position.set(x, PY + 0.002, (z0 + z1) / 2)
    base.add(j)
  }

  // banco da plataforma e a mala do viajante perdido
  const banco = new THREE.Group()
  banco.position.set(-1.85, PY, 0.55)
  banco.rotation.y = 0.55
  for (const lx of [-0.42, 0.42]) {
    const leg = rbox(0.05, 0.3, 0.32, 0.015, STEEL, { roughness: 0.4, metalness: 0.6 })
    leg.position.set(lx, 0.15, 0)
    banco.add(leg)
    const back = rbox(0.05, 0.32, 0.04, 0.015, STEEL, { roughness: 0.4, metalness: 0.6 })
    back.position.set(lx, 0.44, -0.15)
    back.rotation.x = -0.15
    banco.add(back)
  }
  for (const [sz, sy] of [[-0.09, 0.31], [0.04, 0.31], [0.17, 0.31]] as const) {
    const slat = rbox(1.0, 0.035, 0.11, 0.012, '#8a5e36', { roughness: 0.7 })
    slat.position.set(0, sy, sz - 0.04)
    banco.add(slat)
  }
  for (const by of [0.46, 0.56]) {
    const slat = rbox(1.0, 0.075, 0.03, 0.012, '#8a5e36', { roughness: 0.7 })
    slat.position.set(0, by, -0.17 - (by - 0.46) * 0.15)
    slat.rotation.x = -0.15
    banco.add(slat)
  }
  base.add(banco)

  const mala = new THREE.Group()
  mala.position.set(-1.2, PY, 1.15)
  mala.rotation.y = -0.35
  const caseBody = rbox(0.36, 0.48, 0.2, 0.05, '#4d6577', { roughness: 0.5 })
  caseBody.position.y = 0.27
  mala.add(caseBody)
  for (const rx of [-0.09, 0.09]) {
    const rib = rbox(0.03, 0.46, 0.21, 0.012, '#3d5262', { roughness: 0.5 })
    rib.position.set(rx, 0.27, 0)
    mala.add(rib)
  }
  const handleBar = rod(v3(-0.06, 0.62, 0), v3(0.06, 0.62, 0), 0.015, '#2b2f36')
  mala.add(handleBar)
  for (const hx of [-0.06, 0.06]) {
    const post = rod(v3(hx, 0.5, 0), v3(hx, 0.62, 0), 0.012, '#2b2f36', { roughness: 0.4, metalness: 0.6 })
    mala.add(post)
  }
  for (const wx of [-0.13, 0.13]) {
    const wheel = cylinder(0.035, 0.035, 0.03, '#1f2226', { roughness: 0.6 }, 16)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(wx, 0.035, 0.06)
    mala.add(wheel)
  }
  base.add(mala)

  const lixeira = lathe(
    [[0, 0], [0.15, 0], [0.16, 0.04], [0.16, 0.4], [0.17, 0.42], [0.17, 0.45], [0.12, 0.46], [0.11, 0.42], [0, 0.42]],
    '#4c5b53',
    { roughness: 0.45, metalness: 0.3 },
  )
  lixeira.position.set(1.85, PY, 0.75)
  base.add(lixeira)

  root.add(base)

  // ---- tabuleiro de SKA na base da vara -----------------------------------
  const xadrez = new THREE.Group()
  xadrez.position.set(POLE_X, PY, POLE_Z)
  const TILE = 0.2
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const t = rbox(TILE, 0.025, TILE, 0.004, (i + j) % 2 ? CHECK_DARK : CHECK_LIGHT, { roughness: 0.35 })
      t.position.set((i - 2) * TILE, 0.0125, (j - 2) * TILE)
      xadrez.add(t)
    }
  }
  root.add(xadrez)

  // ---- a VARA altíssima, fincada num bloco de concreto --------------------
  const vara = new THREE.Group()
  vara.position.set(POLE_X, PY + 0.025, POLE_Z)
  const block = rbox(0.26, 0.2, 0.26, 0.03, COPING, { roughness: 0.8 })
  block.position.y = 0.1
  vara.add(block)
  const poleH = TOP + 0.1 - (PY + 0.025) - 0.15
  const pole = cylinder(0.042, 0.055, poleH, ROD, { roughness: 0.45 })
  pole.position.y = 0.15 + poleH / 2
  vara.add(pole)
  for (const by of [0.2, 0.26]) {
    const ring = cylinder(0.062, 0.062, 0.03, STEEL, { roughness: 0.35, metalness: 0.7 })
    ring.position.y = by
    vara.add(ring)
  }
  const finial = sphere(0.055, STEEL, { roughness: 0.3, metalness: 0.7 })
  finial.position.y = 0.15 + poleH + 0.03
  vara.add(finial)
  root.add(vara)

  // ---- biruta: pivô no topo da vara, braço e aro ---------------------------
  const biruta = new THREE.Group()
  biruta.position.set(POLE_X, TOP, POLE_Z)
  biruta.rotation.y = PSI
  root.add(biruta)

  const collar = cylinder(0.07, 0.07, 0.11, STEEL, { roughness: 0.35, metalness: 0.7 })
  biruta.add(collar)
  const arm = rbox(ARM + 0.04, 0.035, 0.035, 0.012, STEEL, { roughness: 0.35, metalness: 0.7 })
  arm.position.x = ARM / 2
  biruta.add(arm)
  const hoop = torus(HOOP_R, 0.02, STEEL, { roughness: 0.35, metalness: 0.7 })
  hoop.rotation.y = Math.PI / 2
  hoop.position.set(ARM, -HOOP_R, 0)
  biruta.add(hoop)

  // ---- a manga listrada (pende murcha / enche de vento) --------------------
  const manga = new THREE.Group()
  manga.position.set(ARM, -HOOP_R, 0)
  manga.rotation.z = TILT
  biruta.add(manga)

  const sockBody = new THREE.Group()
  sockBody.rotation.z = -Math.PI / 2 // perfil torneado ao longo de +x
  manga.add(sockBody)
  const radiusAt = (s: number) => 0.255 - 0.13 * s + 0.025 * Math.sin(Math.PI * s)
  const BANDS = 5
  for (let i = 0; i < BANDS; i++) {
    const s0 = i / BANDS
    const s1 = (i + 1) / BANDS
    const y0 = s0 * SOCK_L
    const y1 = s1 * SOCK_L
    const ym = (y0 + y1) / 2
    const sm = (s0 + s1) / 2
    const t = 0.014
    const band = lathe(
      [
        [radiusAt(s0), y0], [radiusAt(sm) + 0.004, ym], [radiusAt(s1), y1],
        [radiusAt(s1) - t, y1], [radiusAt(sm) - t + 0.004, ym], [radiusAt(s0) - t, y0], [radiusAt(s0), y0],
      ],
      i % 2 ? SOCK_WHITE : SOCK,
      { roughness: 0.85 },
      36,
    )
    sockBody.add(band)
    // costura entre as faixas
    if (i > 0) {
      const seam = torus(radiusAt(s0) + 0.002, 0.008, i % 2 ? '#d85a14' : '#d9d3c6', { roughness: 0.85 })
      seam.rotation.x = Math.PI / 2
      seam.position.y = y0
      sockBody.add(seam)
    }
  }
  // barra de lona reforçada na boca
  const cuff = lathe(
    [[0.268, -0.02], [0.27, 0.06], [0.252, 0.06], [0.25, -0.02], [0.268, -0.02]],
    '#e9e3d6',
    { roughness: 0.8 },
    36,
  )
  sockBody.add(cuff)

  // ---- GRILO verde-folha, agarrado à vara --------------------------------
  // local: +y ao longo do corpo (cabeça pra cima), +z barriga (encara a vara)
  const belly = v3(Math.sin(GRY), 0, Math.cos(GRY))
  const grilo = new THREE.Group()
  grilo.position.set(POLE_X - belly.x * GD, GY, POLE_Z - belly.z * GD)
  grilo.rotation.y = GRY
  grilo.scale.setScalar(GS)
  root.add(grilo)

  const PZ = GD / GS // eixo da vara em z local
  const skin = { roughness: 0.6 }

  const abdomen = capsule(0.14, 0.5, LEAF, skin)
  abdomen.position.set(0, -0.42, -0.03)
  abdomen.rotation.x = 0.06
  grilo.add(abdomen)
  const bellyPlate = capsule(0.1, 0.46, LEAF_LIGHT, skin)
  bellyPlate.position.set(0, -0.4, 0.05)
  grilo.add(bellyPlate)
  const thorax = sphere(0.155, LEAF, skin)
  thorax.position.set(0, 0.03, 0)
  thorax.scale.set(1, 1.1, 1)
  grilo.add(thorax)
  const pronotum = sphere(0.16, LEAF_DARK, { roughness: 0.55 })
  pronotum.position.set(0, 0.09, -0.035)
  pronotum.scale.set(1.1, 0.85, 1.0)
  grilo.add(pronotum)

  // asas (tégminas) dobradas nas costas
  for (const s of [-1, 1]) {
    const wing = capsule(0.08, 0.62, LEAF_DARK, { roughness: 0.55 })
    wing.position.set(s * 0.06, -0.36, -0.1)
    wing.rotation.set(-0.06, 0, s * 0.04)
    wing.scale.z = 0.45
    grilo.add(wing)
    // cercos curtos na ponta do abdômen
    const cercus = limb(v3(s * 0.04, -0.8, -0.06), v3(s * 0.07, -0.88, -0.1), 0.016, LEAF_DARK, skin)
    grilo.add(cercus)
  }

  // cabeça olhando pra cima, virada um pouco pra câmera
  const H = v3(0, 0.3, 0.02)
  const f = v3(0.42, 0.85, 0.3).normalize() // pra onde a cara aponta
  const r = new THREE.Vector3().crossVectors(f, v3(0, 0.2, -1).normalize()).normalize()
  const u = new THREE.Vector3().crossVectors(r, f) // topo da cabeça
  const head = sphere(0.15, LEAF, skin)
  head.position.copy(H)
  grilo.add(head)
  const frons = sphere(0.11, LEAF_LIGHT, skin)
  frons.position.copy(H).addScaledVector(f, 0.065).addScaledVector(u, -0.02)
  grilo.add(frons)
  const MOUTH = H.clone().addScaledVector(f, 0.15).addScaledVector(u, -0.03)
  for (const s of [-1, 1]) {
    const mand = capsule(0.022, 0.04, CHITIN, { roughness: 0.5 })
    mand.position.copy(MOUTH).addScaledVector(r, s * 0.045).addScaledVector(f, -0.02)
    mand.quaternion.setFromUnitVectors(Y, f.clone().addScaledVector(r, -s * 0.6).normalize())
    grilo.add(mand)

    // olhos grandes nas laterais da cara; pupilas miram a biruta lá em cima
    const eyeDir = f.clone().multiplyScalar(0.5).addScaledVector(r, s * 0.78).addScaledVector(u, 0.32).normalize()
    const eyeC = H.clone().addScaledVector(eyeDir, 0.108)
    const eye = sphere(0.072, '#ffffff', { roughness: 0.25 })
    eye.position.copy(eyeC)
    grilo.add(eye)
    const look = eyeDir.clone().addScaledVector(f, 0.5).addScaledVector(u, 0.25).normalize()
    const pupil = sphere(0.036, '#161616', { roughness: 0.2 })
    pupil.position.copy(eyeC).addScaledVector(look, 0.047)
    grilo.add(pupil)
    const glint = sphere(0.01, '#ffffff', { roughness: 0.1 })
    glint.position.copy(pupil.position).addScaledVector(look, 0.03).addScaledVector(u, 0.012)
    grilo.add(glint)
  }

  // patas de trás compridas, dobradas em V (Λ): coxa sobe pra trás até o
  // joelho alto, a tíbia desce rente atrás do abdômen
  for (const s of [-1, 1]) {
    const hip = v3(s * 0.14, -0.3, -0.02)
    const knee = v3(s * 0.2, 0.18, -0.46)
    const foot = v3(s * 0.17, -0.74, -0.3)
    grilo.add(limb(hip, knee, 0.045, LEAF, skin))
    const thigh = new THREE.Group()
    thigh.position.lerpVectors(hip, knee, 0.36)
    thigh.quaternion.setFromUnitVectors(Y, knee.clone().sub(hip).normalize())
    const bulge = sphere(0.09, LEAF, skin)
    bulge.scale.set(1, 2.5, 1)
    thigh.add(bulge)
    // listras em espinha de peixe na coxa, rentes à superfície
    for (const ty of [-0.11, 0.0, 0.11]) {
      const rr = 0.09 * Math.sqrt(1 - (ty / 0.225) ** 2)
      const chevron = rbox(0.01, 0.05, 0.1, 0.004, LEAF_DARK, { roughness: 0.55 })
      chevron.position.set(s * (rr - 0.002), ty, 0)
      chevron.rotation.x = 0.55
      thigh.add(chevron)
    }
    grilo.add(thigh)
    grilo.add(limb(knee, foot, 0.026, LEAF_DARK, skin))
    // espinhos da tíbia
    const shin = knee.clone().sub(foot)
    for (let k = 1; k <= 4; k++) {
      const sp = rbox(0.012, 0.05, 0.012, 0.005, CHITIN, { roughness: 0.5 })
      sp.position.lerpVectors(foot, knee, k / 5.5).add(v3(0, 0, -0.025))
      sp.quaternion.setFromUnitVectors(Y, shin.clone().normalize().add(v3(0, 0, -1.2)).normalize())
      grilo.add(sp)
    }
    const tarsus = foot.clone().add(v3(0, -0.04, -0.1))
    grilo.add(limb(foot, tarsus, 0.022, LEAF_DARK, skin))
  }

  // patas do meio abraçando a vara
  for (const s of [-1, 1]) {
    const sh = v3(s * 0.13, -0.05, 0.07)
    const el = v3(s * 0.085, -0.1, PZ - 0.01)
    const tip = v3(s * 0.02, -0.13, PZ + 0.05)
    grilo.add(limb(sh, el, 0.026, LEAF, skin))
    grilo.add(limb(el, tip, 0.022, LEAF_DARK, skin))
  }

  // ---- antenas longas, curvadas pra trás (afastam da vara) -----------------
  const antenas = new THREE.Group()
  grilo.add(antenas)
  for (const s of [-1, 1]) {
    const o = H.clone().addScaledVector(f, 0.1).addScaledVector(u, 0.07).addScaledVector(r, s * 0.045)
    const curve = new THREE.CatmullRomCurve3([
      o,
      o.clone().add(v3(0.03 + s * 0.03, 0.14, 0.03)),
      o.clone().add(v3(0.05 + s * 0.06, 0.3, -0.1)),
      o.clone().add(v3(0.06 + s * 0.09, 0.36, -0.42)),
      o.clone().add(v3(0.06 + s * 0.12, 0.22, -0.74)),
      o.clone().add(v3(0.06 + s * 0.14, -0.04, -0.98)),
    ])
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 48, 0.011, 6, false),
      mat('#34521f', { roughness: 0.6, size: 0.5 }),
    )
    tube.castShadow = true
    antenas.add(tube)
  }

  // ---- chapéu porkpie, inclinado pra trás ----------------------------------
  const chapeu = new THREE.Group()
  const hatAxis = v3(0.1, 1, -0.78).normalize() // pra cima e pra trás: jazzista
  chapeu.position.copy(H).addScaledVector(hatAxis, 0.125)
  chapeu.quaternion.setFromUnitVectors(Y, hatAxis)
  grilo.add(chapeu)
  const hat = lathe(
    [
      [0, 0], [0.2, 0], [0.222, 0.012], [0.214, 0.022], [0.132, 0.026], [0.128, 0.105],
      [0.12, 0.116], [0.1, 0.11], [0.094, 0.098], [0, 0.098],
    ],
    HAT,
    { roughness: 0.8 },
  )
  chapeu.add(hat)
  const hatBand = cylinder(0.134, 0.132, 0.032, HAT_BAND, { roughness: 0.75 })
  hatBand.position.y = 0.045
  chapeu.add(hatBand)

  // ---- trompete dourado: da boca do grilo, apontado pra cima --------------
  root.updateMatrixWorld(true)
  const toWorld = (p: THREE.Vector3) => grilo.localToWorld(p.clone())
  const mouthW = toWorld(MOUTH)
  const dW = v3(Math.cos(PSI), 0, -Math.sin(PSI)) // pra onde a biruta aponta
  const aim = v3(POLE_X, TOP - 0.75, POLE_Z).addScaledVector(dW, 0.34)
  const trumpetDirW = aim.clone().sub(mouthW).normalize()
  const trumpetDirL = trumpetDirW.clone().applyAxisAngle(Y, -GRY)

  const trompete = new THREE.Group() // pivô na boca: gira pra mirar
  trompete.position.copy(MOUTH)
  grilo.add(trompete)
  const horn = new THREE.Group()
  horn.quaternion.setFromUnitVectors(Y, trumpetDirL)
  horn.scale.setScalar(HORN_K)
  trompete.add(horn)

  const metal = { roughness: 0.22, metalness: 0.85 }
  const mouthpiece = lathe(
    [[0, -0.005], [0.024, -0.005], [0.027, 0.008], [0.013, 0.03], [0.011, 0.06], [0, 0.06]],
    '#cfd3d6',
    metal,
    20,
  )
  horn.add(mouthpiece)
  horn.add(rod(v3(0, 0.05, 0), v3(0, 0.41, 0), 0.013, BRASS, metal))
  // volta de afinação paralela
  horn.add(rod(v3(-0.075, 0.14, 0), v3(-0.075, 0.33, 0), 0.012, BRASS, metal))
  const bendLow = bend(0.0375, 0.012, BRASS, metal)
  bendLow.position.set(-0.0375, 0.14, 0)
  bendLow.rotation.z = Math.PI
  horn.add(bendLow)
  const bendHigh = bend(0.0375, 0.012, BRASS, metal)
  bendHigh.position.set(-0.0375, 0.33, 0)
  horn.add(bendHigh)
  // três pistões com botões de madrepérola
  for (let k = 0; k < 3; k++) {
    const vy = 0.19 + k * 0.045
    const casing = cylinder(0.021, 0.021, 0.12, BRASS, metal, 16)
    casing.rotation.x = Math.PI / 2
    casing.position.set(0, vy, 0)
    horn.add(casing)
    const stem = cylinder(0.008, 0.008, 0.04, '#cfd3d6', metal, 10)
    stem.rotation.x = Math.PI / 2
    stem.position.set(0, vy, 0.075)
    horn.add(stem)
    const button = cylinder(0.017, 0.017, 0.012, '#efe8da', { roughness: 0.3 }, 16)
    button.rotation.x = Math.PI / 2
    button.position.set(0, vy, 0.098)
    horn.add(button)
  }
  const bell = lathe(
    [
      [0.014, 0], [0.017, 0.07], [0.03, 0.13], [0.056, 0.17], [0.095, 0.196], [0.128, 0.207],
      [0.125, 0.216], [0.092, 0.205], [0.052, 0.18], [0.024, 0.14], [0.008, 0.07], [0.008, 0], [0.014, 0],
    ],
    BRASS,
    metal,
    36,
  )
  bell.position.y = 0.4
  horn.add(bell)

  // patas da frente seguram o trompete pelos pistões
  const grip = MOUTH.clone().addScaledVector(trumpetDirL, 0.22 * HORN_K)
  for (const s of [-1, 1]) {
    const sh = v3(s * 0.12, 0.12, 0.09)
    const el = v3(s * 0.2, 0.24, 0.13)
    const hand = grip.clone().add(v3(s * 0.035, 0, 0))
    grilo.add(limb(sh, el, 0.025, LEAF, skin))
    grilo.add(limb(el, hand, 0.022, LEAF_DARK, skin))
  }

  // ---- três anéis de sopro: do trompete até a boca da biruta --------------
  root.updateMatrixWorld(true)
  const bellW = toWorld(MOUTH.clone().addScaledVector(trumpetDirL, 0.62 * HORN_K))
  const mouthSock = v3(POLE_X, TOP - HOOP_R, POLE_Z).addScaledVector(dW, ARM)
  const P0 = bellW
  const P1 = bellW.clone().addScaledVector(trumpetDirW, 0.38)
  const P2 = mouthSock.clone().addScaledVector(dW, -0.1)
  const bez = (t: number) =>
    P0.clone().multiplyScalar((1 - t) ** 2)
      .addScaledVector(P1, 2 * t * (1 - t))
      .addScaledVector(P2, t * t)
  const bezTan = (t: number) =>
    P1.clone().sub(P0).multiplyScalar(2 * (1 - t))
      .addScaledVector(P2.clone().sub(P1), 2 * t)
      .normalize()
  // parâmetro t por fração do comprimento do arco (anéis igualmente espaçados)
  const arc: number[] = [0]
  for (let i = 1; i <= 100; i++) arc.push(arc[i - 1] + bez(i / 100).distanceTo(bez((i - 1) / 100)))
  const tAt = (frac: number) => {
    const target = frac * arc[100]
    let i = 1
    while (i < 100 && arc[i] < target) i++
    return i / 100
  }

  const ventos: THREE.Group[] = []
  const VENTO_F = [0.16, 0.52, 0.88]
  const VENTO_R = [0.1, 0.14, 0.18]
  for (let i = 0; i < 3; i++) {
    const t = tAt(VENTO_F[i])
    const g = new THREE.Group()
    g.position.copy(bez(t))
    g.quaternion.setFromUnitVectors(Z, bezTan(t))
    const ring = torus(VENTO_R[i], 0.026, WIND, { roughness: 0.4 })
    g.add(ring)
    root.add(g)
    ventos.push(g)
  }

  // ---- vagão verde-limão do outro lado ------------------------------------
  const trem = new THREE.Group()
  trem.position.set(TX, BED_Y, TZ)
  root.add(trem)
  const L = 1.9
  const D = 0.78
  const FLOOR = 0.24
  const BODY_H = 0.98
  const body = rbox(L, BODY_H, D, 0.16, TRAIN, { roughness: 0.4 })
  body.position.y = FLOOR + BODY_H / 2
  trem.add(body)
  const skirt = rbox(L - 0.06, 0.13, D + 0.012, 0.05, TRAIN_DARK, { roughness: 0.5 })
  skirt.position.y = FLOOR + 0.1
  trem.add(skirt)
  const roof = rbox(L - 0.16, 0.1, D - 0.14, 0.05, ROOF, { roughness: 0.5 })
  roof.position.y = FLOOR + BODY_H + 0.02
  trem.add(roof)
  // janelas e portas na face voltada pra plataforma (+z)
  const FZ = D / 2 + 0.004
  for (const [wx, ww] of [[-0.68, 0.2], [0, 0.36], [0.68, 0.2]] as const) {
    const win = rbox(ww, 0.3, 0.03, 0.06, GLASS, { roughness: 0.15 })
    win.position.set(wx, FLOOR + 0.66, FZ)
    trem.add(win)
  }
  for (const dx of [-0.38, 0.38]) {
    const door = rbox(0.3, 0.68, 0.03, 0.04, TRAIN_DARK, { roughness: 0.45 })
    door.position.set(dx, FLOOR + 0.42, FZ)
    trem.add(door)
    for (const side of [-1, 1]) {
      const pane = rbox(0.1, 0.26, 0.02, 0.03, GLASS, { roughness: 0.15 })
      pane.position.set(dx + side * 0.068, FLOOR + 0.6, FZ + 0.016)
      trem.add(pane)
    }
  }
  // frente arredondada à esquerda: para-brisa e faróis
  const shield = rbox(0.03, 0.34, D - 0.2, 0.06, GLASS, { roughness: 0.15 })
  shield.position.set(-L / 2 - 0.004, FLOOR + 0.68, 0)
  trem.add(shield)
  for (const lz of [-0.24, 0.24]) {
    const lamp = cylinder(0.045, 0.045, 0.03, '#f6f0d6', { roughness: 0.2 }, 16)
    lamp.rotation.z = Math.PI / 2
    lamp.position.set(-L / 2 - 0.01, FLOOR + 0.26, lz)
    trem.add(lamp)
  }
  // pantógrafo
  const panto = new THREE.Group()
  panto.position.set(0.3, FLOOR + BODY_H + 0.07, 0)
  for (const s of [-1, 1]) {
    panto.add(rod(v3(s * 0.2, 0, 0), v3(0, 0.2, 0), 0.012, STEEL))
  }
  panto.add(rod(v3(-0.16, 0.2, 0), v3(0.16, 0.2, 0), 0.014, STEEL))
  trem.add(panto)
  // truques com rodas
  for (const bx of [-0.56, 0.56]) {
    const bogie = rbox(0.5, 0.12, D - 0.12, 0.03, '#2d3136', { roughness: 0.55 })
    bogie.position.set(bx, 0.13, 0)
    trem.add(bogie)
    for (const wx of [-0.15, 0.15]) {
      for (const wz of [-1, 1]) {
        const wheel = cylinder(0.075, 0.075, 0.05, '#23262a', { roughness: 0.45, metalness: 0.5 }, 20)
        wheel.rotation.x = Math.PI / 2
        wheel.position.set(bx + wx, 0.1, wz * (D / 2 - 0.06))
        trem.add(wheel)
      }
    }
  }

  // ---- peças ---------------------------------------------------------------
  const [vento1, vento2, vento3] = ventos
  const parts = [
    { name: 'base', group: 'estacao', object: base },
    { name: 'xadrez', group: 'vara', object: xadrez },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'biruta', group: 'vara', object: biruta },
    { name: 'manga', group: 'vara', object: manga },
    { name: 'grilo', group: 'grilo', object: grilo },
    { name: 'antenas', group: 'grilo', object: antenas },
    { name: 'chapeu', group: 'grilo', object: chapeu },
    { name: 'trompete', group: 'grilo', object: trompete },
    { name: 'vento1', group: 'ska', object: vento1 },
    { name: 'vento2', group: 'ska', object: vento2 },
    { name: 'vento3', group: 'ska', object: vento3 },
    { name: 'trem', group: 'trem', object: trem },
  ]

  // ---- montagem ------------------------------------------------------------
  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const hat0 = chapeu.position.y
  const hatZ = chapeu.rotation.z // vem do quaternion: anima a partir do valor real
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Estação de baldeação, e placa nenhuma: só a plataforma de concreto…',
    }),

    seq('xadrez-abre', 'xadrez', 1.3, 0.5, [ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…um tabuleiro de SKA no chão e, fincada nele, uma VARA altíssima — VAR!',
    }),
    seq('vara-cresce', 'vara', 1.55, 1.0, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),

    seq('biruta-surge', 'biruta', 2.75, 0.5, [...grow(), ch('rotation.y', YAW_LIMP, YAW_LIMP)], {
      ease: 'easeOut',
      caption: 'No topo, a BIRUTA: troca-se pro trem que ela apontar. Mas hoje não venta — ela pende murcha.',
    }),
    seq('manga-pende', 'manga', 2.85, 0.6, [
      ch('scale.x', 0.01, SHRUNK), ch('scale.y', LIMP, LIMP), ch('scale.z', LIMP, LIMP),
      ch('rotation.z', DROOP, DROOP),
    ], { ease: 'easeOut' }),

    seq('grilo-sobe', 'grilo', 4.4, 1.5, [ch('position.y', GY - 0.8, GY)], {
      ease: 'easeOut',
      caption: 'O grilo de chapéu porkpie sobe pela VARA com o trompete…',
    }),
    seq('trompete-leva', 'trompete', 4.4, 1.5, [ch('rotation.x', -0.45, -0.45)]),
    seq('chapeu-poe', 'chapeu', 4.55, 0.5, grow(), { ease: 'easeOut' }),
    seq('trompete-mira', 'trompete', 6.0, 0.4, [ch('rotation.x', -0.45, 0)], { ease: 'easeOut' }),

    seq('trompete-sopra', 'trompete', 6.5, 0.15, [ch('scale.x', 1, 1.18), ch('scale.y', 1, 1.18), ch('scale.z', 1, 1.18)], {
      ease: 'easeOut',
      caption: '…e solta um SKA furioso pra cima: o sopro sobe em anéis até a boca da biruta.',
    }),
    seq('trompete-volta', 'trompete', 6.65, 0.3, [ch('scale.x', 1.18, 1), ch('scale.y', 1.18, 1), ch('scale.z', 1.18, 1)]),
    seq('chapeu-pula', 'chapeu', 6.5, 0.18, [ch('position.y', hat0, hat0 + 0.12)], { ease: 'easeOut' }),
    seq('chapeu-cai', 'chapeu', 6.68, 0.3, [ch('position.y', hat0 + 0.12, hat0)], { ease: 'easeIn' }),
    ...ventos.map((g, i) =>
      seq(`vento${i + 1}-sobe`, `vento${i + 1}`, 6.55 + i * 0.25, 0.55, [
        ch('position.x', bellW.x, g.position.x),
        ch('position.y', bellW.y, g.position.y),
        ch('position.z', bellW.z, g.position.z),
        ...grow(0.3),
      ], { ease: 'easeOut' }),
    ),

    seq('manga-enche', 'manga', 7.45, 0.6, [
      ch('scale.x', SHRUNK, 1), ch('scale.y', LIMP, 1), ch('scale.z', LIMP, 1), ch('rotation.z', DROOP, TILT),
    ], {
      ease: 'easeOut',
      caption: 'A biruta enche e gira feito doida…',
    }),
    seq('biruta-gira', 'biruta', 7.55, 2.0, [ch('rotation.y', YAW_LIMP, PSI)], { ease: 'easeOut' }),

    seq('trem-chega', 'trem', 8.8, 0.9, [riseFrom(BED_Y, 1.7)], {
      ease: 'easeOut',
      caption: '…e — IÁ! — trava apontando pro trem verde do outro lado. A BI(R)ÚTA trocou de lado: você troca de trem.',
    }),

    seq('chapeu-saudacao', 'chapeu', 10.9, 0.35, [ch('rotation.z', hatZ, hatZ + 0.35)], {
      ease: 'easeOut',
      caption: 'Var ska jag byta? — Onde eu tenho que trocar (de ônibus/trem)?',
    }),
    seq('chapeu-assenta', 'chapeu', 11.25, 0.4, [ch('rotation.z', hatZ + 0.35, hatZ)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 1.9, 6.75], target: [0.1, 2.1, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-ska-jag-byta',
    contexto:
      "Transporte: baldeação no SL, no pendeltåg ou no trem regional — perguntando ao motorista, ao funcionário da plataforma ou a quem está do lado, sobretudo em dia de obra com ônibus substituto ('ersättningsbuss').",
    fraseFonte: 'Onde eu tenho que trocar (de ônibus/trem)?',
    fraseAlvo: 'Var ska jag byta?',
    pronuncia:
      "var ska iá BÜÜ-ta? ('var' com R brando — é ele que separa de 'vad': sem R vira 'Vad ska jag byta?', 'o que eu troco?'; na fala rápida o R e o S se fundem num CH leve, 'vach-ka', e isso também está certo; 'ska' seco, sem 'is' na frente; 'jag' = iá, na fala só 'ja'; 'byta' com Y = Ü LONGO: lábios de U e língua de I ao mesmo tempo; T seco e -a fraquinho; força no BÜÜ)",
    ponteSonora:
      "VAR! SKA... IÁ... BI(R)ÚTA? (5 sílabas: var-ska-iá-BÜÜ-ta; força no BÜÜ; VAR = a VARA sem o -a, a MESMA VARA de 'Var kan jag köpa biljett?' e 'Var bor du?': R BRANDO de 'caro' e AUDÍVEL — sem ele sobra VÁ, que é 'vad' (o quê), e a pergunta vira 'o que eu troco?'; SKA = o MESMO SKA da bandinha jamaicana de 'Ska vi säga imorgon klockan tre?': colado, sem 'is' na frente; IÁ é o 'jag' de sempre, I de ioga, nunca J chiado; BI(R)ÚTA = a BIRUTA de aeroporto SEM o R e com o BI e o U FUNDIDOS numa vogal só: a língua fica parada no I e os lábios fazem o bico do U ao MESMO tempo — isso é o Ü, o 'y' sueco; a força, que na biruta já cai no U, fica toda nessa vogal fundida, e LONGA: BÜÜ-ta; nunca 'bi-Ú-ta' em três pedaços nem o 'biú' deslizado, que soa 'bjuda' (convidar); e não largue nenhum dos dois: só o I dá 'bita' (morder), só o U dá 'bota' (curar) — por isso a ponte é a BIRUTA, que traz o I e o U juntos; T seco de 'tatu' e -a fraquinho)",
    historia:
      'Na estação de baldeação não tem placa nenhuma: só uma VARA altíssima com uma BIRUTA laranja no topo, e a regra é velha — você troca pro trem que a biruta apontar. Mas hoje não venta, e a biruta pende murcha. O grilo de chapéu porkpie sobe pela VARA com o trompete e solta um SKA tão furioso que o sopro enche a biruta: ela gira feito doida e — IÁ! — trava apontando pro trem verde do outro lado. A biruta trocou de lado, e você troca de trem: é ali.',
  },
  createScene,
  refine: { organic: ['grilo'] },
}

export default card
