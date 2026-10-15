import * as THREE from 'three'
import type { Card, CardScene, Sequence } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  box, rbox, capsule, cylinder, sphere, torus, lathe, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Tack för hjälpen!" — TAC! FÖ... IÉL-PEN!
 *
 * A chave cai no bueiro e um BEIJA-flor verde-esmeralda a pesca pela argola
 * com o bico de agulha. Você agradece com um toquinho de dedo na ponta da asa
 * (TAC!), manda um beijinho soprado de bico (FÖ!), ele solta um iodel de
 * vitória (IÉÉÉL!) e, na festa, deixa cair uma PENA verde que vem girando até
 * o seu nariz (PEN).
 *
 * Diorama: calçada de pedra cinza-clara com meio-fio e um pedaço de asfalto
 * atrás; a grade preta do bueiro no meio; o beija-flor (o acento esmeralda)
 * pairando sobre ela, grande e de frente para a câmera; você à esquerda, de
 * braço erguido, com o indicador na ponta da asa dele.
 *
 * A pose é resolvida de trás para a frente: o beija-flor fica onde a
 * composição pede, a ponta da asa esquerda dele define onde o dedo encosta, e
 * daí saem a posição da pessoa e o ângulo do braço (IK de um osso).
 */

const RIM = '#2f2d2b'
const ASPHALT = '#41444a'
const LANE = '#c9c4b7'
const STONE = '#c8c3b9'
const STONE_B = '#bab4aa'
const STONE_C = '#d4d0c7'
const GROUT = '#8e8980'
const CURB = '#8f8b84'
const CURB_TOP = '#a29e97'
const GUTTER = '#6c6964'
const IRON = '#25272b'
const PIT = '#0b0c0e'
const LEAF_A = '#b98a3e'
const LEAF_B = '#9c5f38'

const EMERALD = '#169b68' // acento saturado RESERVADO: o beija-flor e a pena
const EMERALD_DARK = '#0e6a49'
const EMERALD_DEEP = '#0b4d37'
const EMERALD_LIGHT = '#33c086'
const CHEST = '#f2f0e8'
const RUBY = '#cf1a42'
const BILL = '#1d1c20'
const GOLD = '#e9b42c'
const GOLD_DARK = '#b98a1c'

const COAT = '#3e5179'
const COAT_DARK = '#2f3e5e'
const SCARF = '#e8dcc5'
const SCARF_DARK = '#d3c5aa'
const BEANIE = '#6f8195'
const SKIN = '#e8c39e'
const LIP = '#d06f78'
const HEART = '#ec5f7c'
const WAVE = '#fff0cf'

const R = 2.5 // raio do diorama
const ST = 0.15 // topo do asfalto
const SY = 0.275 // topo da calçada
const CZ = -1.15 // linha do meio-fio (atrás dela, a rua)

const H = 1.5 // altura da pessoa
const PYAW = 0.95 // a pessoa olha para a direita-frente (o beija-flor)
const ARM_OUT = 0.15 // braço levemente aberto para fora

const B = new THREE.Vector3(0.4, 0.98, 0.3) // centro do beija-flor
const BYAW = -0.3 // de frente para a câmera, virado para a pessoa
const BS = 1.25 // escala do beija-flor
const WING_UP = 0.15 // asas abertas, num V raso
const WING_SWEEP = 0.12
const HEAD_YAW = -0.5 // a cabeça vira para a pessoa

const CAM: [number, number, number] = [0.72, 1.8, 3.62]

/** Uma pena alongada: lâmina achatada com ponta arredondada, ao longo de +y. */
function plume(len: number, width: number, color: string, thick = 0.022) {
  const f = sphere(0.5, color, { roughness: 0.6 })
  f.scale.set(width, len, thick)
  f.position.y = len / 2
  const g = new THREE.Group()
  g.add(f)
  return g
}

/**
 * Asa de beija-flor (side=-1: esquerda do pássaro, +1: direita). Pivô no
 * ombro; a envergadura corre em side·x, o leque de rêmiges no plano xy.
 * Devolve o grupo e o marcador da ponta.
 */
function makeWing(side: number) {
  const wing = new THREE.Group()

  // braço da asa: lâmina carnuda do ombro ao punho
  const blade = sphere(0.1, EMERALD, { roughness: 0.55 })
  blade.scale.set(1.75, 0.62, 0.16)
  blade.position.set(side * 0.15, -0.01, 0)
  wing.add(blade)

  const covert = sphere(0.075, EMERALD_LIGHT, { roughness: 0.55 })
  covert.scale.set(1.6, 0.55, 0.2)
  covert.position.set(side * 0.13, 0.015, 0.006)
  wing.add(covert)

  // rêmiges primárias em leque a partir do punho: a da frente é a mais longa
  const WRIST = new THREE.Vector3(side * 0.28, 0.0, 0)
  const prim: [number, number, string][] = [
    [0.16, 0.5, EMERALD_DARK],
    [-0.06, 0.46, EMERALD_DARK],
    [-0.27, 0.41, EMERALD],
    [-0.47, 0.35, EMERALD],
    [-0.66, 0.29, EMERALD_LIGHT],
    [-0.84, 0.24, EMERALD_LIGHT],
  ]
  for (const [i, [ang, len, color]] of prim.entries()) {
    const p = plume(len, 0.085, color, 0.02 + i * 0.001)
    p.position.copy(WRIST).add(new THREE.Vector3(0, 0, -0.004 * i))
    // ângulo medido a partir do eixo de envergadura (side·x), girando para baixo
    p.rotation.z = side > 0 ? ang - Math.PI / 2 : Math.PI / 2 - ang
    wing.add(p)
  }
  // secundárias: penas curtas pendendo do braço da asa
  for (let k = 0; k < 3; k++) {
    const p = plume(0.2 - k * 0.025, 0.08, EMERALD, 0.018)
    p.position.set(side * (0.06 + k * 0.08), -0.02, -0.012)
    p.rotation.z = side > 0 ? -Math.PI + 0.25 - k * 0.12 : Math.PI - 0.25 + k * 0.12
    wing.add(p)
  }

  const tip = new THREE.Object3D()
  const a = 0.16
  tip.position.copy(WRIST).add(new THREE.Vector3(side * Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0))
  wing.add(tip)

  wing.rotation.set(0, side * WING_SWEEP, side * WING_UP)
  return { wing, tip }
}

/** Folha seca deitada no chão: lâmina pontuda extrudada + nervura. */
function makeLeaf(size: number, color: string) {
  const s = new THREE.Shape()
  s.moveTo(0, -0.5)
  s.quadraticCurveTo(0.42, -0.15, 0, 0.5)
  s.quadraticCurveTo(-0.42, -0.15, 0, -0.5)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.02, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 16,
  })
  geo.scale(size, size, size)
  geo.rotateX(-Math.PI / 2)
  const g = new THREE.Group()
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.85, size }))
  m.castShadow = true
  m.receiveShadow = true
  g.add(m)
  const nervura = rbox(0.008, 0.008, size * 0.95, 0.003, '#6e4326', { roughness: 0.85 })
  nervura.position.y = size * 0.03
  g.add(nervura)
  return g
}

/** Coração extrudado, centrado na origem, virado para +z. */
function makeHeart(size: number) {
  const s = new THREE.Shape()
  s.moveTo(0, 0.25)
  s.bezierCurveTo(0, 0.5, -0.5, 0.55, -0.5, 0.2)
  s.bezierCurveTo(-0.5, -0.1, -0.15, -0.25, 0, -0.5)
  s.bezierCurveTo(0.15, -0.25, 0.5, -0.1, 0.5, 0.2)
  s.bezierCurveTo(0.5, 0.55, 0, 0.5, 0, 0.25)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 5,
    curveSegments: 28,
  })
  geo.center()
  geo.scale(size, size, size)
  const m = new THREE.Mesh(geo, mat(HEART, { roughness: 0.35 }))
  m.castShadow = true
  return m
}

/** Arco de onda sonora, centrado na direção +x. */
function waveArc(r: number) {
  const span = 1.5
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.018, 10, 40, span),
    mat(WAVE, { roughness: 0.4, emissive: WAVE, emissiveIntensity: 0.3 }),
  )
  m.rotation.z = -span / 2
  m.castShadow = true
  return m
}

/** Laje da calçada: segmento do disco à frente do meio-fio, bordas boleadas. */
function sidewalkSlab() {
  const r = R - 0.05
  const a0 = Math.asin(-CZ / r)
  const s = new THREE.Shape()
  s.moveTo(r * Math.cos(a0), r * Math.sin(a0))
  s.absarc(0, 0, r, a0, Math.PI - a0, true)
  s.closePath()
  const depth = SY - ST - 0.02
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 72,
  })
  geo.rotateX(-Math.PI / 2) // forma (x, y) → chão (x, -z); extrusão → +y
  const m = new THREE.Mesh(geo, mat(STONE, { roughness: 0.82, size: 0.6 }))
  m.position.y = ST + 0.01
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Liga sequências de batida de asa (meio-ciclos) a partir de t0. */
function flap(part: string, side: number, t0: number, n: number, half = 0.13): Sequence[] {
  const open = side * WING_UP
  const hi = side * (WING_UP + 0.45)
  const lo = side * (WING_UP - 0.55)
  const out: Sequence[] = []
  const stops = [open]
  for (let i = 0; i < n; i++) stops.push(i % 2 === 0 ? lo : hi)
  stops.push(open)
  for (let i = 0; i < stops.length - 1; i++) {
    out.push(seq(`${part}-bate-${t0}-${i}`, part, t0 + i * half, half, [ch('rotation.z', stops[i], stops[i + 1])]))
  }
  return out
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)
  const camV = new THREE.Vector3(...CAM)

  // ---- base: asfalto, calçada de pedra e meio-fio --------------------------
  const base = new THREE.Group()

  const rim = cylinder(R + 0.08, R + 0.14, 0.11, RIM, { roughness: 0.9 })
  rim.position.y = 0.055
  base.add(rim)

  const asfalto = cylinder(R, R + 0.04, 0.04, ASPHALT, { roughness: 0.92 })
  asfalto.position.y = ST - 0.02
  base.add(asfalto)

  // faixa tracejada da rua
  for (const lx of [-1.15, 1.05]) {
    const lz = -1.95
    if (Math.hypot(Math.abs(lx) + 0.25, lz) > R - 0.08) continue
    const dash = rbox(0.5, 0.012, 0.08, 0.005, LANE, { roughness: 0.7 })
    dash.position.set(lx, ST + 0.004, lz)
    base.add(dash)
  }

  // sarjeta de concreto ao pé do meio-fio
  {
    const z = CZ - 0.2
    const half = Math.sqrt(R * R - z * z) - 0.12
    const sarjeta = rbox(half * 2, 0.012, 0.2, 0.005, GUTTER, { roughness: 0.85 })
    sarjeta.position.set(0, ST + 0.004, z)
    base.add(sarjeta)
  }

  base.add(sidewalkSlab())

  // meio-fio: degrau mais escuro na borda de trás da calçada
  {
    const half = Math.sqrt(R * R - (CZ - 0.1) ** 2) - 0.06
    const meioFio = rbox(half * 2, SY + 0.02 - ST, 0.2, 0.035, CURB, { roughness: 0.8 })
    meioFio.position.set(0, ST + (SY + 0.02 - ST) / 2, CZ)
    base.add(meioFio)
    const quina = rbox(half * 2 - 0.04, 0.012, 0.12, 0.005, CURB_TOP, { roughness: 0.75 })
    quina.position.set(0, SY + 0.021, CZ + 0.02)
    base.add(quina)
  }

  // juntas das pedras (assentamento em amarração) + pedras de tom variado
  {
    const TW = 0.56
    const TD = 0.36
    const inside = (x: number, z: number) => Math.hypot(x, z) < R - 0.12
    let row = 0
    for (let z0 = CZ + 0.1; z0 < R; z0 += TD, row++) {
      const z1 = z0 + TD
      // junta corrida entre fileiras
      if (row > 0) {
        const half = Math.sqrt(Math.max(0, (R - 0.1) ** 2 - z0 * z0))
        if (half > 0.1) {
          const j = rbox(half * 2, 0.012, 0.024, 0.005, GROUT, { roughness: 0.9 })
          j.position.set(0, SY + 0.002, z0)
          base.add(j)
        }
      }
      const off = (row % 2) * (TW / 2)
      for (let x0 = -R - off; x0 < R; x0 += TW) {
        const x1 = x0 + TW
        if (inside(x0, z0) && inside(x0, z1)) {
          const j = rbox(0.024, 0.012, TD, 0.005, GROUT, { roughness: 0.9 })
          j.position.set(x0, SY + 0.002, (z0 + z1) / 2)
          base.add(j)
        }
        // pedra inteira com tom próprio (só as que cabem no disco)
        if (inside(x0, z0) && inside(x1, z0) && inside(x0, z1) && inside(x1, z1) && rand() < 0.42) {
          const c = rand() < 0.5 ? STONE_B : STONE_C
          const t = rbox(TW - 0.04, 0.006, TD - 0.04, 0.003, c, { roughness: 0.82 })
          t.position.set((x0 + x1) / 2, SY + 0.001, (z0 + z1) / 2)
          base.add(t)
        }
      }
      if (z1 > R) break
    }
  }

  // folhas secas espalhadas
  for (const [lx, lz, c] of [[1.2, 0.85, LEAF_A], [1.38, 1.02, LEAF_B], [-1.75, 0.65, LEAF_B], [-0.75, 1.35, LEAF_A]] as const) {
    const folha = makeLeaf(0.17, c)
    folha.position.set(lx, SY + 0.006, lz)
    folha.rotation.y = rand() * Math.PI * 2
    base.add(folha)
  }

  root.add(base)

  // ---- beija-flor (montado primeiro: a pose dele define a cena) -------------
  const ave = new THREE.Group()
  ave.position.copy(B)
  ave.rotation.y = BYAW
  ave.scale.setScalar(BS)
  root.add(ave)

  // corpo pairando, inclinado: cabeça à frente-cima, cauda atrás-baixo
  const corpo = capsule(0.13, 0.2, EMERALD, { roughness: 0.5 })
  corpo.rotation.x = 0.55
  ave.add(corpo)

  const dorso = sphere(0.125, EMERALD_DARK, { roughness: 0.5 })
  dorso.scale.set(1.05, 1.3, 0.8)
  dorso.position.set(0, 0.02, -0.05)
  dorso.rotation.x = 0.55
  ave.add(dorso)

  const peito = sphere(0.112, CHEST, { roughness: 0.75 })
  peito.scale.set(0.95, 1.3, 0.62)
  peito.position.set(0, -0.02, 0.085)
  peito.rotation.x = 0.55
  ave.add(peito)

  // cabeça virada para você (o corpo segue de frente para a câmera)
  const cabecaG = new THREE.Group()
  cabecaG.position.set(0, 0.27, 0.15)
  cabecaG.rotation.y = HEAD_YAW
  ave.add(cabecaG)

  const cabeca = sphere(0.118, EMERALD, { roughness: 0.5 })
  cabecaG.add(cabeca)

  // garganta vermelho-rubi, brilhante
  const garganta = sphere(0.085, RUBY, { roughness: 0.32, metalness: 0.2 })
  garganta.scale.set(1.0, 0.8, 0.4)
  garganta.position.set(0, -0.125, 0.045)
  cabecaG.add(garganta)

  for (const side of [-1, 1]) {
    const olho = sphere(0.03, '#121214', { roughness: 0.12 })
    olho.position.set(side * 0.068, 0.03, 0.085)
    cabecaG.add(olho)
    const brilho = sphere(0.0095, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.074, 0.042, 0.112)
    cabecaG.add(brilho)
    // pintinha branca atrás do olho, marca de beija-flor
    const pinta = sphere(0.014, CHEST, { roughness: 0.6 })
    pinta.position.set(side * 0.095, 0.035, 0.04)
    cabecaG.add(pinta)
  }

  // cauda em leque, para baixo e para trás
  for (let k = -2; k <= 2; k++) {
    const pena = plume(0.24 - Math.abs(k) * 0.015, 0.075, Math.abs(k) === 2 ? EMERALD_DEEP : EMERALD_DARK, 0.035)
    pena.position.set(k * 0.012, -0.12, -0.1)
    pena.rotation.set(-2.45, 0, k * 0.24)
    ave.add(pena)
  }

  // ---- bico de agulha (peça: cresce) ---------------------------------------
  const BILL_LEN = 0.47
  const BILL_PITCH = 0.8 // abaixo da horizontal
  const bico = new THREE.Group()
  bico.position.set(0, -0.02, 0.085)
  bico.rotation.x = Math.PI / 2 + BILL_PITCH // +y local = direção do bico
  cabecaG.add(bico)
  const agulha = cylinder(0.007, 0.026, BILL_LEN, BILL, { roughness: 0.3 })
  agulha.position.y = BILL_LEN / 2
  bico.add(agulha)
  const pontaBico = new THREE.Object3D()
  pontaBico.position.y = BILL_LEN - 0.045
  bico.add(pontaBico)

  // ---- asas (peças: batem) --------------------------------------------------
  const SHOULDER_Y = 0.1
  const asaE = makeWing(-1)
  asaE.wing.position.set(-0.1, SHOULDER_Y, -0.04)
  ave.add(asaE.wing)
  const asaD = makeWing(1)
  asaD.wing.position.set(0.1, SHOULDER_Y, -0.04)
  ave.add(asaD.wing)

  root.updateMatrixWorld(true)
  const T = asaE.tip.getWorldPosition(new THREE.Vector3()) // onde o dedo encosta
  const HOOK = pontaBico.getWorldPosition(new THREE.Vector3()) // onde a argola pendura
  const HEAD = cabeca.getWorldPosition(new THREE.Vector3())

  // ---- chave dourada, pendurada pela argola na ponta do bico ---------------
  const KEY_RING = 0.068
  const chave = new THREE.Group()
  // a argola abraça o bico: centro logo abaixo do ponto de apoio
  const KEY = HOOK.clone().add(new THREE.Vector3(0, -(KEY_RING - 0.012), 0))
  chave.position.copy(KEY)
  chave.rotation.set(0, BYAW, 0) // o bico atravessa o plano da argola
  root.add(chave)

  const argola = torus(KEY_RING, 0.02, GOLD, { roughness: 0.28, metalness: 0.75 })
  chave.add(argola)
  const cabecaChave = rbox(0.21, 0.13, 0.04, 0.05, GOLD, { roughness: 0.28, metalness: 0.75 })
  cabecaChave.position.y = -KEY_RING - 0.07
  chave.add(cabecaChave)
  const furo = cylinder(0.026, 0.026, 0.05, GOLD_DARK, { roughness: 0.35, metalness: 0.7 })
  furo.rotation.x = Math.PI / 2
  furo.position.y = -KEY_RING - 0.07
  chave.add(furo)
  const haste = cylinder(0.024, 0.024, 0.2, GOLD, { roughness: 0.28, metalness: 0.75 })
  haste.position.y = -KEY_RING - 0.13 - 0.1
  chave.add(haste)
  for (const [dy, w] of [[-0.24, 0.075], [-0.28, 0.055], [-0.32, 0.08]] as const) {
    const dente = rbox(w, 0.035, 0.035, 0.008, GOLD, { roughness: 0.28, metalness: 0.75 })
    dente.position.set(0.02 + w / 2, -KEY_RING + dy, 0)
    chave.add(dente)
  }

  // ---- bueiro: grade preta exatamente sob a chave --------------------------
  const GW = 0.92
  const GD = 0.6
  const bueiro = new THREE.Group()
  bueiro.position.set(KEY.x, 0, KEY.z)
  root.add(bueiro)

  const poco = box(GW - 0.08, 0.3, GD - 0.08, PIT, { roughness: 0.95, detail: 0 })
  poco.position.y = SY + 0.011 - 0.15
  bueiro.add(poco)
  for (const [w, d, x, z] of [
    [GW, 0.075, 0, GD / 2 - 0.0375],
    [GW, 0.075, 0, -GD / 2 + 0.0375],
    [0.075, GD, GW / 2 - 0.0375, 0],
    [0.075, GD, -GW / 2 + 0.0375, 0],
  ] as const) {
    const moldura = rbox(w, 0.05, d, 0.015, IRON, { roughness: 0.5, metalness: 0.55 })
    moldura.position.set(x, SY + 0.012, z)
    bueiro.add(moldura)
  }
  for (let k = 0; k < 4; k++) {
    for (const s of [-1, 1]) {
      const barra = rbox(0.042, 0.045, GD - 0.1, 0.012, IRON, { roughness: 0.48, metalness: 0.6 })
      barra.position.set(s * (0.045 + k * 0.095), SY + 0.012, 0)
      bueiro.add(barra)
    }
  }
  const travessa = rbox(GW - 0.1, 0.035, 0.04, 0.01, IRON, { roughness: 0.48, metalness: 0.6 })
  travessa.position.set(0, SY + 0.004, 0)
  bueiro.add(travessa)


  // ---- você: pessoa com o braço erguido até a ponta da asa -----------------
  const pessoa = person({ body: COAT, skin: SKIN, height: H, armAngle: 0.3 })
  pessoa.rotation.y = PYAW
  root.add(pessoa)

  const braco = pessoa.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(braco, H)
  const mao = braco.children[0]
  const dedo = capsule(0.027, 0.085, SKIN, { roughness: 0.6 })
  dedo.position.set(0, -0.15, 0)
  mao.add(dedo)
  const unha = rbox(0.03, 0.035, 0.012, 0.005, '#f2d0bf', { roughness: 0.4 })
  unha.position.set(0, -0.19, 0.022)
  mao.add(unha)
  const pontaDedo = new THREE.Object3D()
  pontaDedo.position.set(0, -0.212, 0)
  mao.add(pontaDedo)

  // IK de um osso: o dedo (ao longo de -y do braço) encosta em T
  const SH = braco.position.clone() // ombro, no espaço da pessoa
  const L = -(mao.position.y + pontaDedo.position.y)
  const target = T.clone().add(new THREE.Vector3(0, -0.025, 0))
  const dy = target.y - (SY + SH.y)
  const hLen = Math.sqrt(Math.max(0.01, L * L - dy * dy))
  const dLocal = new THREE.Vector3(hLen * Math.sin(ARM_OUT), dy, hLen * Math.cos(ARM_OUT)).divideScalar(L)
  const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), PYAW)
  const shoulderW = target.clone().sub(dLocal.clone().multiplyScalar(L).applyQuaternion(yawQ))
  const P = shoulderW.clone().sub(SH.clone().applyQuaternion(yawQ))
  pessoa.position.set(P.x, SY, P.z)
  const ARM_Z = Math.asin(dLocal.x)
  const ARM_X = Math.atan2(-dLocal.z, -dLocal.y)

  // casaco: botões e bolso; cachecol creme; gorro cinza-azulado
  for (const by of [0.3, 0.45]) {
    const botao = sphere(0.022, COAT_DARK, { roughness: 0.5 })
    botao.position.set(0, by, 0.25)
    pessoa.add(botao)
  }
  const cachecol = torus(0.2, 0.06, SCARF, { roughness: 0.92 })
  cachecol.rotation.x = Math.PI / 2
  cachecol.position.y = 0.74
  pessoa.add(cachecol)
  const ponta = rbox(0.11, 0.26, 0.05, 0.025, SCARF, { roughness: 0.92 })
  ponta.position.set(-0.1, 0.6, 0.22)
  ponta.rotation.set(-0.25, 0, 0.12)
  pessoa.add(ponta)
  for (const fy of [0.5, 0.53]) {
    const listra = rbox(0.115, 0.016, 0.055, 0.006, SCARF_DARK, { roughness: 0.92 })
    listra.position.set(-0.1 + (0.6 - fy) * 0.03, fy, 0.24)
    listra.rotation.set(-0.25, 0, 0.12)
    pessoa.add(listra)
  }

  const head = pessoa.getObjectByName('head')!
  const gorro = lathe(
    [[0.3, 0.02], [0.305, 0.08], [0.29, 0.16], [0.25, 0.25], [0.18, 0.31], [0.09, 0.345], [0, 0.355]],
    BEANIE,
    { roughness: 0.92 },
  )
  gorro.position.y = 0.04
  head.add(gorro)
  const barra = torus(0.296, 0.045, BEANIE, { roughness: 0.92 })
  barra.rotation.x = Math.PI / 2
  barra.position.y = 0.08
  head.add(barra)
  const pompom = sphere(0.075, SCARF, { roughness: 0.95 })
  pompom.position.y = 0.4
  head.add(pompom)

  // lábios em bico: o beijinho soprado (FÖ)
  const LIPS_L = new THREE.Vector3(0, -0.115, 0.268)
  const labios = torus(0.03, 0.017, LIP, { roughness: 0.45 })
  labios.position.copy(LIPS_L)
  labios.scale.set(1, 0.85, 1.6)
  head.add(labios)
  const boquinha = sphere(0.02, '#5a2a2e', { roughness: 0.6 })
  boquinha.position.copy(LIPS_L).add(new THREE.Vector3(0, 0, 0.006))
  head.add(boquinha)

  // a outra mão no peito: gesto de gratidão
  const bracoE = pessoa.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoE, H)
  bracoE.rotation.set(-0.95, 0, 0.55)

  // ---- posições derivadas (mundo) ------------------------------------------
  // pose do braço segurando a chave, antes de ela escorregar
  const HOLD_X = -0.6
  const HOLD_Z = -0.3
  braco.rotation.set(HOLD_X, 0, HOLD_Z)
  root.updateMatrixWorld(true)
  const HAND0 = mao.getWorldPosition(new THREE.Vector3())
  braco.rotation.set(ARM_X, 0, ARM_Z)
  root.updateMatrixWorld(true)

  const LIPS = head.localToWorld(LIPS_L.clone())
  const faceCam = (p: THREE.Vector3) => Math.atan2(camV.x - p.x, camV.z - p.z)

  // ---- beijinho: coração saindo do bico da pessoa ---------------------------
  const toBird = HEAD.clone().sub(LIPS)
  const HEART_P = LIPS.clone().addScaledVector(toBird, 0.42).add(new THREE.Vector3(0, 0.45, 0.1))
  const beijo = new THREE.Group()
  beijo.position.copy(HEART_P)
  beijo.rotation.set(0, faceCam(HEART_P), -0.2)
  root.add(beijo)
  beijo.add(makeHeart(0.15))
  {
    const inv = beijo.quaternion.clone().invert()
    const back = LIPS.clone().sub(HEART_P)
    for (const [k, size] of [[0.36, 0.07], [0.6, 0.05]] as const) {
      const mini = makeHeart(size)
      mini.position.copy(back.clone().multiplyScalar(k).applyQuaternion(inv))
      mini.rotation.z = 0.2
      beijo.add(mini)
    }
  }

  // ---- iodel: ondas saindo da cabeça, para cima e para a direita -----------
  const iodel = new THREE.Group()
  iodel.position.copy(HEAD).add(new THREE.Vector3(0.08, 0.06, 0.02))
  iodel.rotation.set(0, faceCam(iodel.position), 0.75)
  root.add(iodel)
  for (const r of [0.22, 0.3, 0.38]) iodel.add(waveArc(r))

  // ---- pena verde caindo, girando, entre você e a chave --------------------
  const pena = new THREE.Group()
  const PENA_P = LIPS.clone().lerp(KEY, 0.66).add(new THREE.Vector3(0, 0.0, 0.16))
  pena.position.copy(PENA_P)
  const PENA_Y = faceCam(PENA_P)
  const PENA_Z = 0.75
  pena.rotation.set(0, PENA_Y, PENA_Z)
  root.add(pena)
  {
    // lâmina estreita + barbas em espinha de peixe: borda serrilhada de pena
    const vane = sphere(0.5, EMERALD, { roughness: 0.6 })
    vane.scale.set(0.075, 0.4, 0.014)
    vane.position.y = 0.05
    pena.add(vane)
    for (let i = 0; i < 7; i++) {
      for (const s of [-1, 1]) {
        const barba = sphere(0.5, i > 4 ? EMERALD_DARK : i % 2 ? EMERALD : EMERALD_LIGHT, { roughness: 0.6 })
        const w = (s > 0 ? 0.05 : 0.04) * (1 - Math.abs(i - 3) * 0.12)
        barba.scale.set(w * 1.6, 0.045, 0.012)
        barba.position.set(s * w * 0.55, -0.08 + i * 0.045, 0)
        barba.rotation.z = s * 0.55
        pena.add(barba)
      }
    }
    const ponta = sphere(0.5, EMERALD_DARK, { roughness: 0.55 })
    ponta.scale.set(0.06, 0.13, 0.016)
    ponta.position.y = 0.2
    pena.add(ponta)
    const raque = cylinder(0.005, 0.009, 0.46, '#eef3e6', { roughness: 0.5 })
    raque.position.set(0, 0.01, 0.009)
    pena.add(raque)
    // penugem solta na base
    for (const s of [-1, 1]) {
      const fiapo = sphere(0.5, EMERALD, { roughness: 0.75 })
      fiapo.scale.set(0.03, 0.06, 0.01)
      fiapo.position.set(s * 0.028, -0.16, 0)
      fiapo.rotation.z = s * 0.6
      pena.add(fiapo)
    }
  }
  const PENA_FROM = T.clone().lerp(B, 0.35).add(new THREE.Vector3(0, 0.15, 0))

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'calcada', object: base },
    { name: 'bueiro', group: 'calcada', object: bueiro },
    { name: 'pessoa', group: 'voce', object: pessoa },
    { name: 'braco', group: 'voce', object: braco },
    { name: 'chave', group: 'voce', object: chave },
    { name: 'beijaflor', group: 'beijaflor', object: ave },
    { name: 'asaE', group: 'beijaflor', object: asaE.wing },
    { name: 'asaD', group: 'beijaflor', object: asaD.wing },
    { name: 'bico', group: 'beijaflor', object: bico },
    { name: 'beijo', group: 'beijo', object: beijo },
    { name: 'iodel', group: 'iodel', object: iodel },
    { name: 'pena', group: 'pena', object: pena },
  ]

  // ---- montagem ------------------------------------------------------------
  // Mergulho: o pássaro desce e inclina para a frente (giro em x pelo centro
  // dele) até a ponta do bico chegar à argola, que ficou presa na grade. A
  // chave cai exatamente onde a ponta do bico vai estar no fundo do mergulho.
  const PITCH = 0.5
  const tipOff = HOOK.clone().sub(B).applyAxisAngle(new THREE.Vector3(1, 0, 0), PITCH)
  const RING_DOWN = SY + 0.035 // só a argola fica para fora da grade
  const DIP = B.y + tipOff.y - (RING_DOWN + KEY_RING - 0.012)
  const KEY_DOWN = new THREE.Vector3(B.x + tipOff.x, RING_DOWN, B.z + tipOff.z)
  const KEY_MID = HAND0.clone().lerp(KEY_DOWN, 0.35)
  const KEY_DROP = SY + 0.55 // sobre a grade, antes de cair reto
  const S0 = BS * 0.12
  const fim = [...flap('asaE', -1, 12.6, 2, 0.15), ...flap('asaD', 1, 12.6, 2, 0.15)]
  fim[0].caption = 'Tack för hjälpen! — Obrigado pela ajuda!'
  const build: Sequence[] = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Uma calçada de pedra sobe do chão, com a grade preta de um bueiro no meio.',
    }),
    seq('bueiro-rise', 'bueiro', 0.3, 0.7, [riseFrom(0, 0.6)], { ease: 'easeOut' }),

    seq('pessoa-rise', 'pessoa', 1.5, 0.85, [riseFrom(SY, 1.9)], {
      ease: 'easeOut',
      caption: 'Você vem pela calçada, girando a chave de casa na mão…',
    }),
    seq('braco-segura', 'braco', 1.5, 0.85, [ch('rotation.x', 0, HOLD_X)], { ease: 'easeOut' }),

    seq('chave-surge', 'chave', 2.3, 0.2, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: '…ela escorrega dos dedos e cai entre as barras do bueiro!',
    }),
    seq('braco-solta', 'braco', 2.5, 0.3, [ch('rotation.x', HOLD_X, -0.15)], { ease: 'easeOut' }),
    seq('chave-pula', 'chave', 2.5, 0.25, [
      ch('position.x', HAND0.x, KEY_MID.x),
      ch('position.y', HAND0.y, HAND0.y + 0.14),
      ch('position.z', HAND0.z, KEY_MID.z),
      ch('rotation.z', 1.4, 0.7),
    ], { ease: 'easeOut' }),
    seq('chave-voa', 'chave', 2.75, 0.35, [
      ch('position.x', KEY_MID.x, KEY_DOWN.x),
      ch('position.y', HAND0.y + 0.14, KEY_DROP),
      ch('position.z', KEY_MID.z, KEY_DOWN.z),
      ch('rotation.z', 0.7, 0),
    ], { ease: 'linear' }),
    seq('chave-cai', 'chave', 3.1, 0.25, [ch('position.y', KEY_DROP, KEY_DOWN.y)], { ease: 'easeIn' }),

    seq('beijaflor-chega', 'beijaflor', 3.8, 1.0, [
      ch('position.x', B.x + 1.5, B.x),
      ch('position.y', B.y + 0.9, B.y),
      ch('position.z', B.z - 0.5, B.z),
      ch('scale.x', S0, BS), ch('scale.y', S0, BS), ch('scale.z', S0, BS),
    ], {
      ease: 'easeOut',
      caption: 'Do nada surge um BEIJA-flor verde-esmeralda, zunindo…',
    }),
    seq('bico-estica', 'bico', 3.8, 1.0, [ch('scale.y', 0.3, 1)], { ease: 'easeOut' }),
    ...flap('asaE', -1, 3.8, 8),
    ...flap('asaD', 1, 3.8, 8),

    seq('beijaflor-mergulha', 'beijaflor', 5.1, 0.5, [
      ch('position.y', B.y, B.y - DIP), ch('rotation.x', 0, PITCH),
    ], {
      caption: '…enfia o bico de agulha pela grade e pesca a chave pela argola.',
    }),
    seq('beijaflor-sobe', 'beijaflor', 5.75, 0.8, [
      ch('position.y', B.y - DIP, B.y), ch('rotation.x', PITCH, 0),
    ], { ease: 'easeOut' }),
    seq('chave-sobe', 'chave', 5.75, 0.8, [
      ch('position.x', KEY_DOWN.x, KEY.x),
      ch('position.y', KEY_DOWN.y, KEY.y),
      ch('position.z', KEY_DOWN.z, KEY.z),
    ], { ease: 'easeOut' }),
    ...flap('asaE', -1, 5.1, 10),
    ...flap('asaD', 1, 5.1, 10),

    seq('braco-toca', 'braco', 6.9, 0.7, [
      ch('rotation.x', -0.15, ARM_X),
      ch('rotation.z', HOLD_Z, ARM_Z),
    ], {
      ease: 'easeOut',
      caption: 'Você agradece com um toquinho de dedo na ponta da asa dele: TAC!',
    }),
    seq('asaE-tac', 'asaE', 7.6, 0.12, [ch('rotation.z', -WING_UP, -WING_UP - 0.12)], { ease: 'easeOut' }),
    seq('asaE-volta', 'asaE', 7.72, 0.3, [ch('rotation.z', -WING_UP - 0.12, -WING_UP)]),

    seq('beijo-sopra', 'beijo', 8.4, 0.9, [
      ch('position.x', LIPS.x, HEART_P.x),
      ch('position.y', LIPS.y, HEART_P.y),
      ch('position.z', LIPS.z, HEART_P.z),
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], {
      ease: 'easeOut',
      caption: 'E, já que é um BEIJA-flor, manda um beijinho soprado de bico: FÖ!',
    }),

    seq('iodel-solta', 'iodel', 9.9, 0.6, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], {
      ease: 'easeOut',
      caption: 'Orgulhoso, ele solta um iodel de vitória: IÉÉÉL!',
    }),
    seq('beijaflor-pula', 'beijaflor', 9.9, 0.3, [ch('position.y', B.y, B.y + 0.1)], { ease: 'easeOut' }),
    seq('chave-pula2', 'chave', 9.9, 0.3, [ch('position.y', KEY.y, KEY.y + 0.1)], { ease: 'easeOut' }),
    seq('beijaflor-assenta', 'beijaflor', 10.2, 0.35, [ch('position.y', B.y + 0.1, B.y)]),
    seq('chave-assenta', 'chave', 10.2, 0.35, [ch('position.y', KEY.y + 0.1, KEY.y)]),
    ...flap('asaE', -1, 9.9, 6, 0.11),
    ...flap('asaD', 1, 9.9, 6, 0.11),

    seq('pena-cai', 'pena', 10.9, 1.5, [
      ch('position.x', PENA_FROM.x, PENA_P.x),
      ch('position.y', PENA_FROM.y, PENA_P.y),
      ch('position.z', PENA_FROM.z, PENA_P.z),
      ch('rotation.y', PENA_Y + 2 * Math.PI, PENA_Y),
      ch('rotation.z', PENA_Z + 0.9, PENA_Z),
    ], {
      ease: 'easeOut',
      caption: '…e na festa deixa cair uma PENA verde, que vem girando até você: PEN.',
    }),

    ...fim,
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [0.04, 0.9, 0.14] },
  }
}

export const card: Card = {
  meta: {
    id: 'tack-for-hjalpen',
    contexto:
      'Cortesia: depois que alguém te ajudou — o vizinho que segurou a porta para o carrinho, o funcionário que achou o produto, o colega que explicou o sistema, o motorista que esperou você chegar no ponto. Também por escrito, no fim de e-mail e mensagem.',
    fraseFonte: 'Obrigado pela ajuda!',
    fraseAlvo: 'Tack för hjälpen!',
    pronuncia:
      "TAK fö IÉL-pen! ('tack' com A curto e K seco; 'för' fraquinho, lábios em bico com língua de É, e o R some antes do 'hj'; 'hjälpen' começa com I de IOGA — o H não soa —, força no IÉL com É aberto e L de verdade, língua no céu da boca; o -pen final é curto e sem nasal)",
    ponteSonora:
      "TAC! FÖ... IÉL-PEN! (4 sílabas: tak-fö-IÉL-pen; a força no IÉL; TAC = o 'tack' de sempre, A curto e K seco; FÖ = o beijinho soprado de BICO, o MESMO FÖ de 'Ett bord för två': lábios de Ô com língua de Ê, CURTO e fraco — é um BEIJA-flor, afinal —, e o R de 'för' derrete antes do I; nunca o FÔ de bochecha estufada de 'få'; IÉL = o MESMO IÉL do iodel de 'Kan du hjälpa mig?': I de IOGA — o H de 'hjälp' NÃO soa, e com RR carioca vira outra coisa —, É ABERTO e L DE VERDADE, língua no céu da boca, nunca 'iéu'; PEN = a PENA sem o -A: E curto, SEM nasal, N batido na língua — esse -EN é o 'a' de 'a ajuda'; sem ele sobra 'hjälp', ajuda qualquer)",
    historia:
      'Sua chave escorrega da mão e cai entre as barras do bueiro. Do nada surge um beija-flor verde-esmeralda, enfia o bico de agulha pela grade e pesca a chave pela argola. Você agradece com um toquinho de dedo na asa dele — TAC! — e, já que é um BEIJA-flor, manda um beijinho soprado de bico: FÖ! Ele fica tão orgulhoso que solta um iodel de vitória, IÉÉÉL!, o mesmo grito de quem pede socorro na montanha, e na pirueta deixa cair uma PENA verde que pousa no seu nariz: PEN. Obrigado pela ajuda!',
  },
  createScene,
  refine: { organic: ['beijaflor'] },
}

export default card
