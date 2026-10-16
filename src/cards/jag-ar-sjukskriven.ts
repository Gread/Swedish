import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, lathe, puff, rock,
} from '../rig/helpers'

/**
 * "Jag är sjukskriven." — IÁÁ... É... RRÜÜK-SKRÍÍ-VEN(da)!
 *
 * Noite de lua cheia é expediente de lobisomem, mas este chegou à clareira
 * gripado: desaba numa poltrona velha enrolado num cobertor xadrez, tenta
 * uivar (IÁÁ... É rouco), assoa o focinho num lenço do tamanho de um lençol
 * (RRÜÜK! — o MESMO lenço-vela do pirata de 'Jag är sjuk idag'), assina o
 * próprio atestado com a garra (SKRÍÍ! — o atestado está ESCRITO) e amarra
 * uma VENDA nos olhos pra lua não pegar ele de jeito.
 *
 * Diorama: clareira de grama escura, três pinheiros e a lua cheia atrás;
 * poltrona cor de vinho no centro com o lobisomem de perfil para a direita
 * (cabeça recortada contra a lua), lenço à direita, atestado erguido à
 * esquerda. O acento saturado é reservado à cruz vermelha do atestado.
 */

const EARTH = '#3a3026'
const GRASS = '#2c4632'
const GRASS_LIGHT = '#36553b' // a clareira banhada de lua
const TUFT = '#22402c'
const TUFT_LIGHT = '#3d6143'
const STONE = '#5d636b'
const PINE = '#1c382e'
const PINE_2 = '#244539'
const BARK = '#3a2a1f'
const MOON = '#f4e8b4'
const MOON_DARK = '#d8c78c'
const WINE = '#5e2433'
const WINE_DARK = '#421620'
const WOOD = '#4a3424'
const MUSTARD = '#a8843c'
const CREAM = '#e9dfc9'
const SHROOM = '#b98a5c'
const FUR = '#5b6169'
const FUR_LIGHT = '#8f959c'
const FUR_DARK = '#3d4249'
const PAD = '#2b2729'
const CLAW = '#e8dcc0'
const NOSE = '#c4544c'
const EAR_IN = '#7b5f62'
const CANVAS = '#f2ece0' // lenço: o mesmo pano do pirata de 'Jag är sjuk idag'
const HEM = '#3d5c8c' //    e a mesma barra azul
const PURPLE = '#6a46a3' // venda
const PURPLE_DARK = '#4e3380'
const PAPER = '#f5f2ea'
const INK = '#a3a8ae'
const GOUGE = '#2e292d'
const ACCENT = '#e3262d' // acento saturado RESERVADO: a cruz do atestado

const GY = 0.16 // topo da grama
const SY = 0.6 // topo da almofada da poltrona (no referencial da poltrona)

// poltrona + lobisomem compartilham um referencial levemente virado à câmera
const SEAT: [number, number, number] = [0, GY, 0.05]
const SEAT_ROT = 0.15

// cabeça: de perfil para a direita, recortada contra a lua
const NECK: [number, number, number] = [0.02, 1.58, -0.06]
const HEAD_YAW = 1.2
const HEAD_PITCH = 0.06
const HOWL = -0.85

// braço erguido (lado esquerdo da tela): pivô no ombro
const SHOULDER: [number, number, number] = [-0.31, 1.36, -0.1]
const ARM_DOWN = Math.PI - 0.1
const ARM_UP_Z = 1.0
const ARM_UP_X = 0.32

const MOON_POS: [number, number, number] = [-0.05, 2.15, -3.0]

const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula de a até b (as tampas passam um raio de cada ponta: juntas). */
function limb(
  r: number,
  a: [number, number, number],
  b: [number, number, number],
  color: string,
  roughness = 0.9,
) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const d = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, d.length()), color, { roughness })
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Tecido xadrez vermelho do cobertor, desenhado num canvas. */
function plaidCanvas() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#a3443b'
  g.fillRect(0, 0, 64, 64)
  g.fillStyle = 'rgba(34, 50, 42, 0.62)' // faixas largas verde-escuras
  g.fillRect(0, 8, 64, 16)
  g.fillRect(8, 0, 16, 64)
  g.fillStyle = 'rgba(28, 26, 40, 0.45)' // faixas finas escuras
  g.fillRect(0, 40, 64, 6)
  g.fillRect(40, 0, 6, 64)
  g.fillStyle = 'rgba(240, 226, 190, 0.85)' // fio creme
  g.fillRect(0, 52, 64, 2)
  g.fillRect(52, 0, 2, 64)
  return c
}

function plaidMat(canvas: HTMLCanvasElement, rx: number, ry: number, size: number) {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.colorSpace = THREE.SRGBColorSpace
  const m = mat('#ffffff', { roughness: 0.92, size })
  m.map = t
  return m
}

function shade<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Pinheiro: tronco + saias torneadas que afinam até a ponta. */
function pine(h: number, r: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const trunk = cylinder(0.07, 0.11, h * 0.32, BARK, { roughness: 0.85 })
  trunk.position.y = h * 0.16
  g.add(trunk)
  const tiers = 4
  for (let i = 0; i < tiers; i++) {
    const k = i / tiers
    const tr = r * (1 - k * 0.68)
    const th = h * 0.36
    const tier = lathe(
      [[0.01, 0], [tr, 0.02], [tr * 0.86, th * 0.14], [tr * 0.5, th * 0.55], [0.01, th]],
      i % 2 ? PINE_2 : PINE,
      { roughness: 0.85 },
    )
    tier.position.y = h * 0.2 + k * h * 0.6
    tier.rotation.y = rand() * Math.PI
    g.add(tier)
  }
  return g
}

/** Tufo de capim: leque de cones finos. */
function tuft(seed: number, s = 1) {
  const g = new THREE.Group()
  const rand = rng(seed)
  for (let i = 0; i < 6; i++) {
    const h = (0.14 + rand() * 0.12) * s
    const blade = cone(0.028 * s, h, rand() > 0.5 ? TUFT : TUFT_LIGHT, { roughness: 0.9 }, 8)
    const a = (i / 6) * Math.PI * 2 + rand() * 0.5
    blade.position.set(Math.cos(a) * 0.04 * s, h / 2, Math.sin(a) * 0.04 * s)
    blade.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35)
    g.add(blade)
  }
  return g
}

function mushroom(s: number) {
  const g = new THREE.Group()
  const stem = cylinder(0.022 * s, 0.03 * s, 0.1 * s, CREAM, { roughness: 0.7 })
  stem.position.y = 0.05 * s
  g.add(stem)
  const cap = lathe(
    [[0, 0], [0.075, 0.0], [0.082, 0.02], [0.06, 0.05], [0.02, 0.064], [0, 0.065]],
    SHROOM,
    { roughness: 0.6 },
  )
  cap.scale.setScalar(s)
  cap.position.y = 0.09 * s
  g.add(cap)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)
  const plaid = plaidCanvas()

  // ---- clareira -------------------------------------------------------------
  const base = new THREE.Group()

  const earth = cylinder(2.6, 2.72, 0.13, EARTH, { roughness: 0.9 })
  earth.position.y = 0.065
  base.add(earth)

  const grass = cylinder(2.6, 2.6, 0.035, GRASS, { roughness: 0.95 })
  grass.position.y = GY - 0.0175
  base.add(grass)

  const clearing = cylinder(1.6, 1.64, 0.012, GRASS_LIGHT, { roughness: 0.95 })
  clearing.position.y = GY + 0.002
  base.add(clearing)

  for (const [i, [tx, tz, s]] of ([
    [-2.05, 0.75, 1.1], [-1.6, 1.55, 0.9], [1.95, 1.05, 1.0], [2.25, -0.2, 1.2],
    [-2.3, -0.35, 1.0], [0.6, 2.2, 0.8], [-0.7, 2.15, 0.9], [1.25, 1.85, 0.85],
  ] as const).entries()) {
    const t = tuft(70 + i, s)
    t.position.set(tx, GY, tz)
    t.rotation.y = rand() * Math.PI
    base.add(t)
  }

  for (const [i, [rx, rz, r]] of ([[-1.95, 1.2, 0.17], [2.1, 0.45, 0.2], [1.55, 1.6, 0.12]] as const).entries()) {
    const st = rock(r, STONE, 7 + i, { roughness: 0.8 })
    st.position.set(rx, GY + r * 0.25, rz)
    st.scale.y = 0.6
    base.add(st)
  }

  for (const [mx, mz, s] of [[-1.25, 1.45, 1.1], [-1.1, 1.6, 0.8], [-1.4, 1.62, 0.7]] as const) {
    const m = mushroom(s)
    m.position.set(mx, GY, mz)
    m.rotation.y = rand() * Math.PI
    base.add(m)
  }

  root.add(base)

  // ---- três pinheiros ao fundo ---------------------------------------------
  const pinheiros = new THREE.Group()
  for (const [px, pz, h, r, s] of [
    [-1.75, -1.0, 2.7, 0.62, 3],
    [1.85, -0.85, 2.35, 0.55, 5],
    [1.05, -1.95, 3.0, 0.68, 9],
  ] as const) {
    const p = pine(h, r, s)
    p.position.set(px, GY, pz)
    pinheiros.add(p)
  }
  root.add(pinheiros)

  // ---- lua cheia enorme -----------------------------------------------------
  const lua = new THREE.Group()
  lua.position.set(...MOON_POS)
  const disco = sphere(0.85, MOON, { emissive: MOON, emissiveIntensity: 0.95 }, 48)
  lua.add(disco)
  for (const [cx, cy, cr] of [[-0.3, 0.25, 0.17], [0.22, -0.12, 0.21], [0.05, 0.42, 0.1], [-0.12, -0.42, 0.12]] as const) {
    const cz = Math.sqrt(0.85 * 0.85 - cx * cx - cy * cy) - 0.02
    const crater = sphere(cr, MOON_DARK, { emissive: MOON_DARK, emissiveIntensity: 0.75 })
    crater.position.set(cx, cy, cz)
    crater.scale.z = 0.25
    crater.lookAt(cx * 2, cy * 2, cz * 2)
    lua.add(crater)
  }
  // luar: contra-luz fria-pálida que recorta o lobisomem
  const luar = new THREE.PointLight('#ffeec4', 2.2, 7, 1.4)
  luar.position.set(0, -0.3, 1.0)
  lua.add(luar)
  root.add(lua)

  // ---- referencial da poltrona ---------------------------------------------
  const seat = new THREE.Group()
  seat.position.set(...SEAT)
  seat.rotation.y = SEAT_ROT
  root.add(seat)

  // ---- poltrona velha cor de vinho -----------------------------------------
  const poltrona = new THREE.Group()
  seat.add(poltrona)
  {
    const assento = rbox(1.36, 0.34, 1.0, 0.1, WINE, { roughness: 0.85 })
    assento.position.y = 0.29
    poltrona.add(assento)
    const almofada = rbox(0.92, 0.16, 0.82, 0.07, WINE, { roughness: 0.85 })
    almofada.position.set(0, 0.52, 0.06)
    poltrona.add(almofada)
    const encosto = rbox(1.36, 1.16, 0.3, 0.13, WINE, { roughness: 0.85 })
    encosto.position.set(0, 0.98, -0.4)
    encosto.rotation.x = -0.08
    poltrona.add(encosto)
    const rolo = capsule(0.14, 1.08, WINE, { roughness: 0.85 })
    rolo.rotation.z = Math.PI / 2
    rolo.position.set(0, 1.55, -0.45)
    poltrona.add(rolo)
    for (const side of [-1, 1]) {
      // orelhas do encosto (bergère)
      const asa = rbox(0.18, 0.62, 0.4, 0.08, WINE, { roughness: 0.85 })
      asa.position.set(side * 0.6, 1.2, -0.22)
      asa.rotation.y = side * 0.25
      poltrona.add(asa)
      const braco = rbox(0.26, 0.42, 0.96, 0.09, WINE, { roughness: 0.85 })
      braco.position.set(side * 0.6, 0.57, 0.02)
      poltrona.add(braco)
      const enrolado = capsule(0.14, 0.8, WINE, { roughness: 0.85 })
      enrolado.rotation.x = Math.PI / 2
      enrolado.position.set(side * 0.61, 0.8, 0.04)
      poltrona.add(enrolado)
      const espiral = cylinder(0.1, 0.1, 0.02, WINE_DARK, { roughness: 0.85 })
      espiral.rotation.x = Math.PI / 2
      espiral.position.set(side * 0.61, 0.8, 0.585)
      poltrona.add(espiral)
      const botao = sphere(0.026, WINE_DARK, { roughness: 0.6 })
      botao.position.set(side * 0.61, 0.8, 0.6)
      poltrona.add(botao)
    }
    const debrum = capsule(0.025, 1.24, WINE_DARK, { roughness: 0.8 })
    debrum.rotation.z = Math.PI / 2
    debrum.position.set(0, 0.45, 0.5)
    poltrona.add(debrum)
    // capitonê
    for (const [bx, by] of [[-0.36, 0.95], [0, 0.95], [0.36, 0.95], [-0.36, 1.28], [0, 1.28], [0.36, 1.28]] as const) {
      const b = sphere(0.026, WINE_DARK, { roughness: 0.6 })
      b.position.set(bx, by, -0.25 + (by - 0.98) * 0.08)
      poltrona.add(b)
    }
    // remendo mostarda costurado na frente do braço direito
    const remendo = rbox(0.2, 0.17, 0.02, 0.02, MUSTARD, { roughness: 0.9 })
    remendo.position.set(0.6, 0.52, 0.505)
    remendo.rotation.z = 0.12
    poltrona.add(remendo)
    for (const [sx, sy, rot] of [[-0.1, 0.03, 0], [0.1, -0.02, 0], [0.0, 0.085, Math.PI / 2], [0.01, -0.085, Math.PI / 2]] as const) {
      const ponto = rbox(0.012, 0.05, 0.01, 0.004, CREAM, { roughness: 0.8 })
      ponto.position.set(0.6 + sx, 0.52 + sy, 0.52)
      ponto.rotation.z = 0.12 + rot
      poltrona.add(ponto)
    }
    // estofo escapando de um rasgo no braço esquerdo
    const estofo = puff(0.06, CREAM, 4, 13, { roughness: 0.95 })
    estofo.position.set(-0.62, 0.95, 0.3)
    poltrona.add(estofo)
    // pés torneados
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pe = lathe(
          [[0, 0], [0.045, 0], [0.06, 0.03], [0.045, 0.07], [0.06, 0.12], [0, 0.12]],
          WOOD,
          { roughness: 0.5 },
        )
        pe.position.set(sx * 0.56, 0, sz * 0.4)
        poltrona.add(pe)
      }
    }
  }

  // ---- lobisomem (corpo) ----------------------------------------------------
  const lobisomem = new THREE.Group()
  seat.add(lobisomem)

  const quadril = sphere(0.34, FUR, { roughness: 0.9 })
  quadril.scale.set(1.15, 0.6, 1.0)
  quadril.position.set(0, SY + 0.12, -0.08)
  lobisomem.add(quadril)

  const tronco = capsule(0.3, 0.32, FUR, { roughness: 0.9 })
  tronco.position.set(0, SY + 0.5, -0.14)
  tronco.rotation.x = -0.1
  lobisomem.add(tronco)

  for (const side of [-1, 1]) {
    const ombro = sphere(0.18, FUR, { roughness: 0.9 })
    ombro.position.set(side * 0.29, 1.36, -0.12)
    lobisomem.add(ombro)
  }

  lobisomem.add(limb(0.15, [0, 1.36, -0.12], [NECK[0], NECK[1] + 0.02, NECK[2]], FUR))

  const peito = sphere(0.19, FUR_LIGHT, { roughness: 0.95 })
  peito.position.set(0, 1.2, 0.04)
  peito.scale.set(1, 1.25, 0.75)
  lobisomem.add(peito)

  for (const side of [-1, 1]) {
    const x = side * 0.19
    lobisomem.add(limb(0.14, [x, SY + 0.14, -0.05], [x, SY + 0.12, 0.46], FUR))
    lobisomem.add(limb(0.115, [side * 0.2, SY + 0.08, 0.52], [side * 0.21, 0.14, 0.56], FUR))
    const pe = sphere(0.15, FUR_DARK, { roughness: 0.9 })
    pe.scale.set(0.95, 0.5, 1.4)
    pe.position.set(side * 0.21, 0.08, 0.64)
    lobisomem.add(pe)
    for (let d = -1; d <= 1; d++) {
      const dedo = sphere(0.05, FUR_DARK, { roughness: 0.9 })
      dedo.position.set(side * 0.21 + d * 0.075, 0.06, 0.82)
      lobisomem.add(dedo)
      const unha = cone(0.018, 0.07, CLAW, { roughness: 0.4 }, 10)
      unha.rotation.x = Math.PI / 2 + 0.3
      unha.position.set(side * 0.21 + d * 0.075, 0.045, 0.88)
      lobisomem.add(unha)
    }
  }

  // braço direito da tela: segura o cobertor fechado no peito
  lobisomem.add(limb(0.09, [0.3, 1.02, 0.05], [0.13, 1.12, 0.3], FUR))
  const mao = sphere(0.09, FUR, { roughness: 0.9 })
  mao.scale.set(1, 0.9, 0.8)
  mao.position.set(0.12, 1.13, 0.33)
  lobisomem.add(mao)
  for (let d = 0; d < 3; d++) {
    const dedo = capsule(0.028, 0.06, FUR, { roughness: 0.9 })
    dedo.position.set(0.06 + d * 0.05, 1.07, 0.39)
    dedo.rotation.x = 0.3
    lobisomem.add(dedo)
  }

  // rabo peludo caído por cima do braço da poltrona
  lobisomem.add(limb(0.1, [0.36, SY + 0.12, -0.25], [0.62, 0.98, -0.12], FUR))
  lobisomem.add(limb(0.115, [0.66, 0.98, -0.1], [0.84, 0.66, 0.02], FUR))
  const ponta = sphere(0.11, FUR_LIGHT, { roughness: 0.95 })
  ponta.scale.set(0.9, 1.3, 0.9)
  ponta.position.set(0.87, 0.52, 0.04)
  lobisomem.add(ponta)

  // pivô do pescoço: gira a cabeça de perfil (não é peça)
  const pescoco = new THREE.Group()
  pescoco.position.set(...NECK)
  pescoco.rotation.y = HEAD_YAW
  pescoco.scale.setScalar(1.2) // cabeça de desenho animado: maior que o natural
  lobisomem.add(pescoco)

  // ---- cobertor xadrez -------------------------------------------------------
  const cobertor = new THREE.Group()
  seat.add(cobertor)
  {
    const gap = 0.95
    // tronco de cone aberto na frente, com dobras que abrem para a barra
    const capaGeo = new THREE.CylinderGeometry(0.31, 0.54, 0.82, 64, 6, true, gap / 2, Math.PI * 2 - gap)
    {
      const pos = capaGeo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)
        const down = (0.41 - y) / 0.82 // 0 na gola, 1 na barra
        const k = 1 + 0.07 * down * down * Math.sin(Math.atan2(x, z) * 9)
        pos.setXYZ(i, x * k, y, z * k)
      }
      capaGeo.computeVertexNormals()
    }
    const capa = shade(new THREE.Mesh(capaGeo, plaidMat(plaid, 5, 1.6, 1)))
    ;(capa.material as THREE.Material).side = THREE.DoubleSide
    capa.position.set(0, 1.08, -0.13)
    capa.rotation.x = -0.08
    cobertor.add(capa)
    const gola = shade(new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.07, 14, 40), plaidMat(plaid, 6, 1, 0.6)))
    gola.rotation.x = Math.PI / 2 - 0.08
    gola.position.set(0, 1.48, -0.12)
    cobertor.add(gola)
    // colo: pano sobre as coxas + caimento na frente dos joelhos
    // colo: pano liso sobre as coxas que dobra por cima dos joelhos
    // (meio-cilindro deitado) e cai reto na frente das canelas
    const KNEE_Y = SY + 0.12
    const KNEE_Z = 0.44
    const KR = 0.27
    // jogado meio torto no colo: lê como pano, não como caixa
    const colo = new THREE.Group()
    colo.rotation.set(0, 0.1, -0.04)
    cobertor.add(colo)
    const tampo = rbox(0.84, 0.05, 0.5, 0.02, '#ffffff')
    tampo.material = plaidMat(plaid, 1.6, 1.0, 0.8)
    tampo.position.set(0, KNEE_Y + KR - 0.02, KNEE_Z - 0.25)
    colo.add(tampo)
    const joelhoGeo = new THREE.CylinderGeometry(KR, KR, 0.84, 32, 1, true, 0, Math.PI / 2 + 0.05)
    const joelho = shade(new THREE.Mesh(joelhoGeo, plaidMat(plaid, 0.8, 1.6, 0.8)))
    ;(joelho.material as THREE.Material).side = THREE.DoubleSide
    joelho.rotation.set(0, 0, Math.PI / 2)
    joelho.position.set(0, KNEE_Y, KNEE_Z)
    colo.add(joelho)
    const caimento = rbox(0.84, 0.14, 0.04, 0.015, '#ffffff')
    caimento.material = plaidMat(plaid, 1.6, 0.3, 0.8)
    caimento.position.set(0, KNEE_Y - 0.07, KNEE_Z + KR - 0.01)
    colo.add(caimento)
    // franja creme na barra
    for (let i = 0; i < 12; i++) {
      const fio = capsule(0.012, 0.06, CREAM, { roughness: 0.9 })
      fio.position.set(-0.385 + i * 0.07, KNEE_Y - 0.18, KNEE_Z + KR - 0.01)
      colo.add(fio)
    }
  }

  // ---- cabeça de lobo ------------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.rotation.x = HEAD_PITCH
  pescoco.add(cabeca)
  {
    const cranio = sphere(0.25, FUR, { roughness: 0.9 })
    cranio.scale.set(1, 0.92, 1.1)
    cranio.position.set(0, 0.17, -0.03)
    cabeca.add(cranio)

    const testa = sphere(0.17, FUR, { roughness: 0.9 })
    testa.position.set(0, 0.21, 0.09)
    cabeca.add(testa)

    // focinho comprido e afunilado (torneado ao longo de +z), mais claro
    const focinho = lathe(
      [[0, 0], [0.15, 0], [0.145, 0.12], [0.12, 0.26], [0.095, 0.36], [0.072, 0.42], [0, 0.44]],
      FUR_LIGHT,
      { roughness: 0.9 },
    )
    focinho.rotation.x = Math.PI / 2
    focinho.scale.z = 0.82
    focinho.position.set(0, 0.08, 0.08)
    cabeca.add(focinho)
    cabeca.add(limb(0.068, [0, -0.03, 0.12], [0, -0.01, 0.42], FUR_LIGHT))

    const nariz = sphere(0.08, NOSE, { roughness: 0.3 })
    nariz.scale.set(1.2, 0.95, 1)
    nariz.position.set(0, 0.1, 0.53)
    cabeca.add(nariz)

    for (const side of [-1, 1]) {
      const bochecha = sphere(0.1, FUR_LIGHT, { roughness: 0.95 })
      bochecha.position.set(side * 0.14, 0.03, 0.1)
      cabeca.add(bochecha)

      const orelha = cone(0.1, 0.28, FUR, { roughness: 0.9 })
      orelha.scale.z = 0.55
      orelha.position.set(side * 0.15, 0.44, -0.05)
      orelha.rotation.set(-0.15, 0, -side * 0.32)
      cabeca.add(orelha)
      const dentro = cone(0.06, 0.18, EAR_IN, { roughness: 0.8 })
      dentro.scale.z = 0.35
      dentro.position.set(side * 0.148, 0.42, -0.02)
      dentro.rotation.set(-0.15, 0, -side * 0.32)
      cabeca.add(dentro)

      const presa = cone(0.02, 0.07, '#f4f1e6', { roughness: 0.35 })
      presa.rotation.x = Math.PI
      presa.position.set(side * 0.06, -0.01, 0.4)
      cabeca.add(presa)
    }
  }

  // ---- venda roxa nos olhos ------------------------------------------------
  const venda = new THREE.Group()
  venda.position.set(0, 0.23, 0)
  cabeca.add(venda)
  {
    const faixa = lathe(
      [[0.268, -0.055], [0.29, -0.06], [0.298, -0.03], [0.298, 0.03], [0.29, 0.06], [0.268, 0.055], [0.268, -0.055]],
      PURPLE,
      { roughness: 0.8 },
      48,
    )
    faixa.scale.set(1, 1, 1.06)
    faixa.rotation.x = -0.08
    venda.add(faixa)
    // nó atrás e as duas pontas soltas
    const no = sphere(0.055, PURPLE_DARK, { roughness: 0.8 })
    no.scale.set(1, 0.8, 0.8)
    no.position.set(-0.17, 0.0, -0.25)
    venda.add(no)
    for (const t of [-1, 1]) {
      const fita = rbox(0.075, 0.22, 0.02, 0.01, PURPLE, { roughness: 0.8 })
      fita.position.set(-0.22 + t * 0.03, -0.1, -0.31)
      fita.rotation.set(0.35, -0.6, 0.35 + t * 0.25)
      venda.add(fita)
    }
  }

  // ---- lenço gigante inflado no focinho (RRÜÜK!) ---------------------------
  // o mesmo lenço-vela do pirata: almofada de pano com barra azul, pontas
  // achatadas nos cantos e o franzido agarrado no nariz
  const lenco = new THREE.Group()
  lenco.position.set(0, 0.07, 0.56)
  lenco.rotation.set(-0.12, -0.42, 0.05)
  cabeca.add(lenco)
  {
    const LW = 0.6
    const LH = 0.5
    const LZ = 0.27
    const sail = rbox(LW, LH, 0.3, 0.14, CANVAS, { roughness: 0.92 })
    sail.position.z = LZ
    lenco.add(sail)
    for (const [w, h, x, y] of [
      [LW - 0.16, 0.026, 0, LH / 2 - 0.07],
      [LW - 0.16, 0.026, 0, -LH / 2 + 0.07],
      [0.026, LH - 0.16, LW / 2 - 0.07, 0],
      [0.026, LH - 0.16, -LW / 2 + 0.07, 0],
    ] as const) {
      const barra = rbox(w, h, 0.02, 0.008, HEM, { roughness: 0.9 })
      barra.position.set(x, y, LZ + 0.15)
      lenco.add(barra)
    }
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const p = cone(0.07, 0.14, CANVAS, { roughness: 0.92 })
        p.position.set(sx * (LW / 2 - 0.02), sy * (LH / 2 - 0.02), LZ - 0.03)
        p.rotation.z = Math.atan2(sy, sx) - Math.PI / 2
        p.scale.z = 0.3
        lenco.add(p)
      }
    }
    const crumple = puff(0.1, CANVAS, 6, 17, { roughness: 0.92 })
    crumple.position.set(0, 0, 0.06)
    lenco.add(crumple)
    const franzido = puff(0.09, CANVAS, 5, 19, { roughness: 0.92 })
    franzido.position.set(-0.04, -0.02, 0.14)
    lenco.add(franzido)
  }

  // ---- lenços usados no chão -----------------------------------------------
  const pilha = new THREE.Group()
  pilha.position.set(0.92, GY, 0.82)
  for (const [i, [px, pz, r]] of ([[0, 0, 0.11], [0.17, 0.07, 0.085], [0.07, -0.16, 0.095]] as const).entries()) {
    const wad = puff(r, CANVAS, 5, 51 + i, { roughness: 0.92 })
    wad.position.set(px, r * 0.75, pz)
    wad.rotation.y = rand() * Math.PI
    pilha.add(wad)
  }
  root.add(pilha)

  // ---- braço erguido com garras cor de osso --------------------------------
  const pata = new THREE.Group()
  pata.position.set(...SHOULDER)
  pata.rotation.set(ARM_UP_X, 0, ARM_UP_Z)
  lobisomem.add(pata)
  {
    pata.add(limb(0.12, [0, 0, 0], [0, 0.4, 0], FUR))
    pata.add(limb(0.1, [0, 0.4, 0], [0.1, 0.72, 0.02], FUR))
    // punho de pelo arrepiado no antebraço
    const tufo = cone(0.06, 0.14, FUR, { roughness: 0.95 })
    tufo.position.set(-0.08, 0.5, 0)
    tufo.rotation.z = 2.2
    tufo.scale.z = 0.6
    pata.add(tufo)
    const palma = sphere(0.11, FUR, { roughness: 0.9 })
    palma.scale.set(1, 0.9, 0.75)
    palma.position.set(0.11, 0.8, 0.03)
    pata.add(palma)
    const almof = sphere(0.06, PAD, { roughness: 0.6 })
    almof.scale.set(1, 0.8, 0.4)
    almof.position.set(0.11, 0.8, -0.05)
    pata.add(almof)
    for (let d = 0; d < 4; d++) {
      const fx = 0.03 + d * 0.055
      const dedo = capsule(0.028, 0.07, FUR, { roughness: 0.9 })
      dedo.position.set(fx, 0.9, 0.04)
      dedo.rotation.z = (d - 1.5) * -0.15
      pata.add(dedo)
      const garra = cone(0.02, 0.15, CLAW, { roughness: 0.35 }, 12)
      garra.position.set(fx + (d - 1.5) * 0.015, 1.0, 0.05)
      garra.rotation.set(0.35, 0, (d - 1.5) * -0.15)
      pata.add(garra)
    }
  }

  // ---- atestado: folha com cruz vermelha (virada para a câmera) ------------
  const atestado = new THREE.Group()
  atestado.position.set(0.1, 0.86, 0.08)
  {
    const pataQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(ARM_UP_X, 0, ARM_UP_Z))
    const want = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, -0.05, 0.12))
    atestado.quaternion.copy(pataQ.invert().multiply(want))
  }
  pata.add(atestado)
  const PW = 0.44
  const PH = 0.58
  const PX = -0.15 // a pata segura o canto de baixo à direita
  const PYc = 0.22
  {
    const folha = rbox(PW, PH, 0.014, 0.006, PAPER, { roughness: 0.75 })
    folha.position.set(PX, PYc, 0)
    atestado.add(folha)
    const cruzH = rbox(0.15, 0.05, 0.012, 0.008, ACCENT, { roughness: 0.45 })
    cruzH.position.set(PX, PYc + 0.16, 0.01)
    atestado.add(cruzH)
    const cruzV = rbox(0.05, 0.15, 0.012, 0.008, ACCENT, { roughness: 0.45 })
    cruzV.position.set(PX, PYc + 0.16, 0.01)
    atestado.add(cruzV)
    for (let i = 0; i < 4; i++) {
      const linha = rbox(i === 3 ? 0.18 : 0.3, 0.018, 0.006, 0.004, INK, { roughness: 0.7 })
      linha.position.set(PX - (i === 3 ? 0.06 : 0), PYc + 0.02 - i * 0.065, 0.009)
      atestado.add(linha)
    }
  }

  // ---- três riscos de garra (a assinatura) ---------------------------------
  // grupo inclinado na diagonal, origem no topo: cresce para baixo no SKRÍÍ
  const riscos = new THREE.Group()
  riscos.position.set(PX - 0.07, PYc + 0.08, 0.012)
  riscos.rotation.z = 0.3
  atestado.add(riscos)
  for (let i = -1; i <= 1; i++) {
    // rasgo em fuso: fino nas pontas, largo no meio, achatado no papel
    const L = 0.32 - Math.abs(i) * 0.05
    const risco = lathe(
      [[0, 0], [0.011, L * 0.15], [0.017, L * 0.5], [0.011, L * 0.85], [0, L]],
      GOUGE,
      { roughness: 0.8 },
      12,
    )
    risco.scale.z = 0.35
    risco.position.set(i * 0.07, -L - Math.abs(i) * 0.02, 0)
    riscos.add(risco)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'clareira', group: 'clareira', object: base },
    { name: 'pinheiros', group: 'floresta', object: pinheiros },
    { name: 'lua', group: 'floresta', object: lua },
    { name: 'poltrona', group: 'poltrona', object: poltrona },
    { name: 'lobisomem', group: 'lobisomem', object: lobisomem },
    { name: 'cobertor', group: 'lobisomem', object: cobertor },
    { name: 'cabeca', group: 'lobisomem', object: cabeca },
    { name: 'lenco', group: 'rruk', object: lenco },
    { name: 'pilha', group: 'rruk', object: pilha },
    { name: 'pata', group: 'skri', object: pata },
    { name: 'atestado', group: 'skri', object: atestado },
    { name: 'riscos', group: 'skri', object: riscos },
    { name: 'venda', group: 'venda', object: venda },
  ]

  const grow = (from: number) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('clareira-sobe', 'clareira', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Noite de lua cheia numa clareira da floresta: expediente de lobisomem.',
    }),
    seq('pinheiros-crescem', 'pinheiros', 0.6, 0.8, [
      ch('scale.y', 0.01, 1), ch('scale.x', 0.6, 1), ch('scale.z', 0.6, 1),
    ], { ease: 'easeOut' }),
    seq('lua-nasce', 'lua', 1.1, 1.1, [ch('position.y', MOON_POS[1] - 1.4, MOON_POS[1])], { ease: 'easeOut' }),

    seq('poltrona-arrastada', 'poltrona', 2.4, 1.0, [
      ch('position.x', -2.1, 0), ch('rotation.z', 0.14, 0),
    ], {
      ease: 'easeOut',
      caption: 'Mas hoje ele chegou gripado, arrastando a própria poltrona velha…',
    }),

    seq('lobo-desaba', 'lobisomem', 3.6, 0.5, [ch('position.y', 1.5, 0)], {
      ease: 'easeIn',
      caption: '…e desaba nela enrolado num cobertor xadrez, de nariz vermelho.',
    }),
    seq('cobertor-desaba', 'cobertor', 3.6, 0.5, [ch('position.y', 1.5, 0)], { ease: 'easeIn' }),
    seq('cabeca-chega', 'cabeca', 3.6, 0.6, [ch('rotation.x', -0.3, HEAD_PITCH)], { ease: 'easeOut' }),

    seq('uivo', 'cabeca', 5.0, 0.55, [ch('rotation.x', HEAD_PITCH, HOWL)], {
      ease: 'easeOut',
      caption: 'Joga a cabeça pra trás pra uivar pra lua — IÁÁÁ… — e o uivo morre num É rouco.',
    }),
    seq('uivo-morre', 'cabeca', 5.95, 0.6, [ch('rotation.x', HOWL, HEAD_PITCH)], { ease: 'easeIn' }),

    seq('lenco-infla', 'lenco', 6.8, 0.6, grow(0.01), {
      ease: 'easeOut',
      caption: 'Assoa o focinho num lenço do tamanho de um lençol: RRÜÜK!',
    }),
    seq('pilha-sobe', 'pilha', 7.0, 0.6, [riseFrom(GY, 0.5)], { ease: 'easeOut' }),

    seq('pata-ergue', 'pata', 8.2, 0.8, [
      ch('rotation.z', ARM_DOWN, ARM_UP_Z), ch('rotation.x', 0, ARM_UP_X),
    ], {
      ease: 'easeOut',
      caption: 'Ergue o próprio atestado médico, com a cruz vermelha…',
    }),
    seq('atestado-abre', 'atestado', 8.55, 0.5, grow(0.01), { ease: 'easeOut' }),

    seq('pata-arma', 'pata', 9.45, 0.2, [ch('rotation.z', ARM_UP_Z, ARM_UP_Z + 0.08)], { ease: 'easeOut' }),
    seq('riscos', 'riscos', 9.65, 0.35, [ch('scale.y', 0.01, 1)], {
      ease: 'easeIn',
      caption: '…e assina com a garra, que risca o papel: SKRÍÍÍ! Está ESCRITO.',
    }),
    seq('pata-risca', 'pata', 9.65, 0.35, [ch('rotation.z', ARM_UP_Z + 0.08, ARM_UP_Z)], { ease: 'easeIn' }),

    seq('venda-amarra', 'venda', 10.6, 0.8, [
      ch('scale.x', 1.8, 1), ch('scale.z', 1.8, 1), ch('rotation.y', -3, 0),
    ], {
      ease: 'easeOut',
      caption: 'E amarra uma VENDA nos olhos, pra lua não pegar ele de jeito: VEN(da)!',
    }),

    seq('aconchego', 'cobertor', 11.8, 0.35, [ch('scale.x', 1, 1.05), ch('scale.z', 1, 1.05)], {
      ease: 'easeOut',
      caption: 'Jag är sjukskriven. — Estou afastado por doença (de licença médica).',
    }),
    seq('aconchego-volta', 'cobertor', 12.15, 0.45, [ch('scale.x', 1.05, 1), ch('scale.z', 1.05, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.82, 2.32, 4.82], target: [-0.08, 1.28, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-sjukskriven',
    contexto:
      "Trabalho e saúde: pro chefe, pro RH, pra Försäkringskassan, pros colegas que perguntam por que você sumiu. 'Sjuk' é estar doente; 'sjukskriven' é estar oficialmente afastado com atestado (läkarintyg), em geral a partir do 8º dia — às vezes só em meio período: 'sjukskriven på halvtid'.",
    fraseFonte: 'Estou afastado por doença (de licença médica).',
    fraseAlvo: 'Jag är sjukskriven.',
    pronuncia:
      "iá é RRÜÜK-skrii-ven ('jag' = iá; 'är' = é; 'sjuk' com o sopro do 'sj' — língua alta, lábios em bico, Ü longo, K seco — e a força principal; 'skriven' gruda direto, o S colado no K sem 'is' no meio, I longo com uma segunda força, e o '-ven' fraquinho com N de verdade)",
    ponteSonora:
      "IÁÁ... É... RRÜÜK-SKRÍÍ-VEN(da)! (5 batidas: iá-é-RRÜÜK-skrii-ven; força principal no RRÜÜK e uma segunda no SKRÍÍ; IÁ É é o 'jag är' de sempre — aqui o uivo que falha: I de IOGA, nunca J chiado, e o É aberto e curto do 'är', o mesmo de 'Jag är trött' e 'Jag är sjuk idag'; RRÜÜK = o MESMO RRÜÜK do pirata de 'Jag är sjuk idag': o assoar do nariz, o 'sj' soprado com a língua alta e os lábios em BICO, Ü LONGO e K seco — nunca 'chuque', nem o chiado CHÜLD da minhoca de 'Jag är förkyld' (lá é resfriado; aqui é doente); SKRÍÍ = o arranhão da garra no papel — e o 'skri' de 'skriva', escrever: o atestado é ESCRITO; o S sai grudado no K do RRÜÜK, SEM 'is' no meio (RRÜÜK-SKRÍÍ, nunca 'rrük-is-crí'), R de um toque só e I LONGO; VEN = a VENDA cortada antes do -DA: fraquinho e sem força, com a ponta da língua já no céu da boca, que é o N — sem ele sobra 'skrive', que não existe; tudo numa palavra só: 'sjukskriven', afastado por doença)",
    historia:
      'Noite de lua cheia é expediente de lobisomem, mas hoje ele chegou à clareira gripado, de cobertor nas costas e arrastando a própria poltrona. Joga a cabeça pra trás pra uivar, IÁÁ..., e o uivo morre num É rouco. Assoa o focinho num lenço do tamanho de um lençol, RRÜÜK!, assina o próprio atestado com a garra, que risca o papel num SKRÍÍÍ!, e amarra uma VENDA nos olhos pra lua não pegar ele de jeito. Estou de licença médica.',
  },
  createScene,
  refine: { organic: ['lobisomem', 'cabeca', 'pata'] },
}

export default card
