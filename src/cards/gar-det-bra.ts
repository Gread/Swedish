import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Går det bra?" — GÔR... DÊ BRÁ?
 *
 * Retiro de coragem na floresta: o ogro verde que a turma chama de GORDO
 * (GÔR) atravessa descalço um corredor de BRASAS (BRÁ). Sobe fumaça dos pés,
 * os olhos esguicham lágrimas, mas ele segue — 'går' é ANDA — e faz joinha
 * pra você, que pergunta da beira com o balde d'água pronto.
 *
 * Diorama: clareira de terra escura, dois pinheiros ao fundo, o corredor de
 * carvão em brasa cruzando o disco na diagonal até a câmera, o ogro no meio
 * dele com um pé no ar, e o balde azul na beira. O laranja das brasas é o
 * acento reservado: a bermuda florida virou roxa para não roubar a cor delas.
 */

const TERRA = '#3d2e22'
const TERRA_ESC = '#2b2018'
const MUSGO = '#506531'
const PEDRA = '#7a746c'
const PINHO = '#2c5442'
const PINHO_ESC = '#234536'
const TRONCO = '#5a3e2a'
const CARVAO = '#2a2523'
const BRASA = '#ff7424' // acento saturado RESERVADO às brasas (BRÁ = BRASA)
const BRASA_FUNDO = '#ff4d12'
const OGRO = '#7ca545'
const OGRO_ESC = '#5d8636'
const BARRIGA = '#9fbf63'
const BERMUDA = '#5d4192'
const FLOR = '#f3e4b0'
const FLOR2 = '#ef9fc0'
const MIOLO = '#e5b632'
const FAIXA = '#c4303a'
const DENTE = '#f4efdf'
const BOCA = '#3a1a1d'
const LAGRIMA = '#5cc0f4'
const BALDE = '#3f74ad'
const AGUA = '#86cdee'
const FUMACA = '#c9c4be'

const GY = 0.14 // topo do chão da clareira
const CR = 1.32 // o corredor cruza o quadro: do fundo à esquerda para a frente à direita
const CW = 1.2 // largura do corredor
const CL = 4.3 // comprimento do corredor
const COAL = GY + 0.11 // topo das brasas: onde o ogro pisa
const OS = 0.88 // escala do ogro
const OROT = 1.2 // o ogro anda para a direita, levemente virado para a câmera
// o ogro anda pelo eixo do corredor: começa atrás e avança um passo
const OGRO_AT = -0.35
const OGRO_FROM = -0.75
const OX = Math.sin(CR) * OGRO_AT
const OZ = Math.cos(CR) * OGRO_AT
const OX0 = Math.sin(CR) * OGRO_FROM
const OZ0 = Math.cos(CR) * OGRO_FROM
const HEAD_Y = 2.42
const PE_UP = -0.15 // joelho erguido no meio do passo (pose final, giro em x)
const PE_DOWN = 0.84 // perna baixada, pisando nas brasas
const PE_Y = 0.92 // quadril da perna erguida
const JOINHA_DOWN = 2.6 // braço pendurado ao lado do corpo
const BX = 0.55
const BZ = 1.42

type V3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)
const FWD = new THREE.Vector3(0, 0, 1)
const SKIN: MatOpts = { roughness: 0.72 }
const PANO: MatOpts = { roughness: 0.88 }

/** Cápsula de a até b — membros. */
function limb(r: number, a: V3, b: V3, color: string, opts?: MatOpts) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, dir.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/** Torna translúcido tudo que estiver debaixo do objeto (fumaça). */
function translucent(obj: THREE.Object3D, opacity: number) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const mt = m.material as THREE.Material
    mt.transparent = true
    mt.opacity = opacity
    mt.depthWrite = false
    m.castShadow = false
  })
}

/** Flor de estampa havaiana: miolo + cinco pétalas achatadas no plano xy. */
function flower(size: number, petal: string) {
  const g = new THREE.Group()
  const miolo = sphere(size * 0.3, MIOLO, { roughness: 0.6 }, 12)
  miolo.scale.z = 0.6
  miolo.position.z = 0.006
  g.add(miolo)
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3
    const p = sphere(size * 0.36, petal, { roughness: 0.75 }, 12)
    p.position.set(Math.cos(a) * size * 0.48, Math.sin(a) * size * 0.48, 0)
    p.scale.set(1, 1, 0.35)
    g.add(p)
  }
  return g
}

/** Põe um objeto sobre a superfície de um elipsoide, de frente para fora. */
function onEllipsoid(obj: THREE.Object3D, c: V3, r: V3, az: number, el: number, lift = 0.025) {
  const n = new THREE.Vector3(
    Math.cos(el) * Math.sin(az) / r[0],
    Math.sin(el) / r[1],
    Math.cos(el) * Math.cos(az) / r[2],
  ).normalize()
  obj.position.set(
    c[0] + r[0] * Math.cos(el) * Math.sin(az) + n.x * lift,
    c[1] + r[1] * Math.sin(el) + n.y * lift,
    c[2] + r[2] * Math.cos(el) * Math.cos(az) + n.z * lift,
  )
  obj.quaternion.setFromUnitVectors(FWD, n)
  return obj
}

/** Pinheiro: tronco + saias de cone empilhadas. */
function pine(h: number, r: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const trunk = cylinder(0.08, 0.12, 0.5, TRONCO, { roughness: 0.9 })
  trunk.position.y = 0.25
  g.add(trunk)
  const tiers = 4
  for (let i = 0; i < tiers; i++) {
    const k = i / tiers
    const ch_ = h * 0.36 * (1 - k * 0.3)
    const c = cone(r * (1 - k * 0.24), ch_, i % 2 ? PINHO_ESC : PINHO, { roughness: 0.85 }, 9)
    c.position.y = 0.4 + h * 0.19 * i + ch_ / 2
    c.rotation.y = rand() * Math.PI
    g.add(c)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- clareira: terra escura de floresta ----------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.09, TERRA_ESC, { roughness: 0.95 })
  soil.position.y = 0.045
  base.add(soil)
  const top = cylinder(2.55, 2.62, 0.05, TERRA, { roughness: 0.95 })
  top.position.y = 0.115
  base.add(top)

  // tufos de musgo e pedrinhas, fora do corredor
  for (const [x, z, r, s] of [
    [-1.75, 0.95, 0.3, 3], [0.2, 1.75, 0.26, 5], [0.3, -1.6, 0.28, 7],
    [-1.0, 1.9, 0.22, 9], [1.9, -1.2, 0.2, 11],
  ] as const) {
    const moss = puff(r, MUSGO, 5, s, { roughness: 0.95 })
    moss.position.set(x, GY + 0.02, z)
    moss.scale.y = 0.28
    base.add(moss)
  }
  for (const [x, z, r, s] of [
    [-2.2, 0.6, 0.13, 21], [-0.5, -1.9, 0.15, 23], [0.6, 2.1, 0.1, 25], [-1.3, 1.6, 0.09, 27],
  ] as const) {
    const pedra = rock(r, PEDRA, s, { roughness: 0.9 })
    pedra.position.set(x, GY + r * 0.35, z)
    pedra.rotation.y = rand() * Math.PI
    base.add(pedra)
  }
  // samambaias: folhas-cone achatadas abrindo em leque
  for (const [x, z, s] of [[-1.6, 1.35, 0.9], [0.75, -1.85, 0.8]] as const) {
    const fern = new THREE.Group()
    fern.position.set(x, GY, z)
    fern.scale.setScalar(s)
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + rand() * 0.4
      const leaf = cone(0.07, 0.48, '#4f7a3a', { roughness: 0.85 }, 8)
      leaf.scale.z = 0.22
      leaf.position.set(Math.sin(a) * 0.16, 0.2, Math.cos(a) * 0.16)
      leaf.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9, 'YXZ')
      fern.add(leaf)
    }
    base.add(fern)
  }
  // cogumelos e pinhas
  for (const [x, z, s] of [[-0.2, -1.95, 1], [-0.03, -1.88, 0.7]] as const) {
    const shroom = new THREE.Group()
    shroom.position.set(x, GY, z)
    shroom.scale.setScalar(s)
    const stem = cylinder(0.03, 0.04, 0.14, '#eadfc8', { roughness: 0.8 })
    stem.position.y = 0.07
    shroom.add(stem)
    const cap = lathe([[0, 0.12], [0.1, 0.12], [0.09, 0.17], [0.05, 0.2], [0, 0.21]], '#a8784a', { roughness: 0.7 })
    shroom.add(cap)
    base.add(shroom)
  }
  for (const [x, z] of [[-1.2, -1.5], [0.9, 1.9], [2.0, -0.6]] as const) {
    const pinha = sphere(0.05, '#6b4a2c', { roughness: 0.9 })
    pinha.scale.set(0.8, 0.8, 1.3)
    pinha.position.set(x, GY + 0.04, z)
    pinha.rotation.y = rand() * Math.PI
    base.add(pinha)
  }

  root.add(base)

  // ---- pinheiros ao fundo ----------------------------------------------------
  const pinheiros = new THREE.Group()
  const p1 = pine(2.75, 0.72, 3)
  p1.position.set(-1.5, GY, -1.6)
  pinheiros.add(p1)
  const p2 = pine(2.3, 0.62, 5)
  p2.position.set(1.4, GY, -1.75)
  pinheiros.add(p2)
  const p3 = pine(1.3, 0.38, 7)
  p3.position.set(2.25, GY, -0.75)
  pinheiros.add(p3)
  root.add(pinheiros)

  // ---- corredor de brasas ----------------------------------------------------
  const brasas = new THREE.Group()
  brasas.rotation.y = CR
  root.add(brasas)

  // leito incandescente por baixo: aparece nas frestas entre os carvões
  const leito = rbox(CW, 0.06, CL, 0.03, BRASA_FUNDO, {
    emissive: BRASA_FUNDO, emissiveIntensity: 0.9, roughness: 0.8,
  })
  leito.position.y = GY + 0.03
  brasas.add(leito)

  // pedras de borda
  let seed = 100
  for (let z = -CL / 2; z <= CL / 2 + 0.01; z += 0.3) {
    for (const side of [-1, 1]) {
      const st = rock(0.12 + rand() * 0.05, PEDRA, seed++, { roughness: 0.9 })
      st.position.set(side * (CW / 2 + 0.12), GY + 0.05, z)
      st.scale.y = 0.7
      st.rotation.y = rand() * Math.PI
      brasas.add(st)
    }
  }
  for (const zEnd of [-1, 1]) {
    for (let x = -CW / 2 + 0.12; x <= CW / 2 - 0.1; x += 0.3) {
      const st = rock(0.12 + rand() * 0.04, PEDRA, seed++, { roughness: 0.9 })
      st.position.set(x, GY + 0.05, zEnd * (CL / 2 + 0.14))
      st.scale.y = 0.7
      brasas.add(st)
    }
  }

  // carvões: a maioria preta, um terço em brasa viva
  const nx = 6
  const nz = Math.round(CL / 0.2)
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = -CW / 2 + 0.1 + ix * ((CW - 0.2) / (nx - 1)) + (rand() - 0.5) * 0.06
      const z = -CL / 2 + 0.1 + iz * ((CL - 0.2) / (nz - 1)) + (rand() - 0.5) * 0.06
      const r = 0.075 + rand() * 0.04
      const hot = rand() < 0.34
      const lump = hot
        ? rock(r, BRASA, seed++, { emissive: BRASA, emissiveIntensity: 1.25, roughness: 0.6 })
        : rock(r, CARVAO, seed++, { roughness: 0.92 })
      lump.position.set(x, GY + 0.06, z)
      lump.scale.y = 0.65
      lump.rotation.set(rand(), rand() * Math.PI, rand())
      brasas.add(lump)
    }
  }

  // fagulhas no ar
  for (let k = 0; k < 9; k++) {
    const f = sphere(0.018 + rand() * 0.014, '#ffc068', { emissive: '#ffa23a', emissiveIntensity: 2.2 }, 8)
    f.position.set((rand() - 0.5) * CW * 0.9, GY + 0.3 + rand() * 0.7, -CL / 2 + 0.3 + rand() * (CL - 0.6))
    brasas.add(f)
  }

  // calor: luz laranja que sobe das brasas e pinta pernas e barriga
  const calor = new THREE.PointLight('#ff7a2e', 2.6, 3.8, 1.5)
  calor.position.set(0, GY + 0.45, OGRO_AT + 0.2)
  brasas.add(calor)

  // ---- balde d'água azul na beira ------------------------------------------
  const balde = new THREE.Group()
  balde.position.set(BX, GY, BZ)
  balde.rotation.y = 0.5
  root.add(balde)

  const corpoBalde = lathe(
    [
      [0, 0], [0.19, 0], [0.2, 0.02], [0.25, 0.42], [0.262, 0.44], [0.25, 0.448],
      [0.236, 0.42], [0.186, 0.03], [0, 0.03],
    ],
    BALDE,
    { roughness: 0.35, metalness: 0.55 },
  )
  balde.add(corpoBalde)
  for (const [ry, rr] of [[0.14, 0.214], [0.3, 0.234]] as const) {
    const rib = torus(rr, 0.012, '#356396', { roughness: 0.35, metalness: 0.55 })
    rib.rotation.x = Math.PI / 2
    rib.position.y = ry
    balde.add(rib)
  }
  const agua = cylinder(0.226, 0.226, 0.02, AGUA, { roughness: 0.05 })
  agua.position.y = 0.385
  balde.add(agua)
  const onda = torus(0.11, 0.006, '#c4ebfa', { roughness: 0.1 })
  onda.rotation.x = Math.PI / 2
  onda.position.y = 0.396
  balde.add(onda)
  const alca = new THREE.Mesh(
    new THREE.TorusGeometry(0.255, 0.014, 10, 32, Math.PI),
    mat('#9aa3ab', { roughness: 0.3, metalness: 0.75, size: 0.5 }),
  )
  alca.castShadow = true
  alca.position.y = 0.42
  alca.rotation.x = -0.45
  balde.add(alca)
  for (const side of [-1, 1]) {
    const orelha = sphere(0.025, '#9aa3ab', { roughness: 0.3, metalness: 0.75 })
    orelha.position.set(side * 0.255, 0.42, 0)
    balde.add(orelha)
  }

  // ---- OGRO GORDO -----------------------------------------------------------
  // anda ao longo do corredor (+z local = para a direita do quadro); o lado
  // -x local é o que fica virado para a câmera
  const ogro = new THREE.Group()
  ogro.position.set(OX, COAL, OZ)
  ogro.rotation.y = OROT
  ogro.scale.setScalar(OS)
  root.add(ogro)

  // perna de apoio (lado de trás, +x), plantada nas brasas
  ogro.add(limb(0.24, [0.3, 0.9, 0], [0.32, 0.48, -0.06], OGRO, SKIN))
  ogro.add(limb(0.21, [0.32, 0.48, -0.06], [0.31, 0.15, -0.04], OGRO, SKIN))
  const pePlant = sphere(0.21, OGRO_ESC, SKIN)
  pePlant.scale.set(1, 0.5, 1.45)
  pePlant.position.set(0.31, 0.09, 0.08)
  ogro.add(pePlant)
  for (const [k, tx] of [0.2, 0.28, 0.36, 0.44].entries()) {
    const toe = sphere(k === 0 ? 0.065 : 0.05, OGRO_ESC, SKIN, 14)
    toe.position.set(tx, 0.07, 0.36)
    ogro.add(toe)
  }

  // bermuda florida: quadril + perna da bermuda do lado de apoio
  const HIP_C: V3 = [0, 0.96, 0.02]
  const HIP_R: V3 = [0.7, 0.47, 0.57]
  const quadril = sphere(1, BERMUDA, PANO)
  quadril.scale.set(...HIP_R)
  quadril.position.set(...HIP_C)
  ogro.add(quadril)
  ogro.add(limb(0.29, [0.3, 0.98, 0], [0.32, 0.72, -0.04], BERMUDA, PANO))
  const barra = torus(0.27, 0.035, BERMUDA, PANO)
  barra.rotation.x = Math.PI / 2
  barra.position.set(0.32, 0.5, -0.05)
  ogro.add(barra)
  // flores no lado que a câmera vê (azimute ~ -1.1)
  for (const [az, el, cor] of [
    [-2.15, -0.1, FLOR], [-1.8, -0.55, FLOR2], [-1.5, 0.15, FLOR], [-1.15, -0.4, FLOR2],
    [-0.8, 0.05, FLOR], [-0.55, -0.62, FLOR], [-1.95, 0.42, FLOR2], [-0.2, -0.8, FLOR2],
  ] as const) {
    ogro.add(onEllipsoid(flower(0.2, cor), HIP_C, HIP_R, az, el))
  }

  // barriga enorme por cima do cós, tronco largo, ombros, pescoço
  const barriga = sphere(0.64, BARRIGA, SKIN)
  barriga.scale.set(1.04, 0.92, 0.98)
  barriga.position.set(0, 1.42, 0.16)
  ogro.add(barriga)
  const umbigo = sphere(0.045, OGRO_ESC, SKIN, 14)
  umbigo.position.set(-0.12, 1.32, 0.755)
  ogro.add(umbigo)
  const tronco = sphere(0.6, OGRO, SKIN)
  tronco.scale.set(1.12, 1.05, 0.88)
  tronco.position.set(0, 1.66, -0.06)
  ogro.add(tronco)
  ogro.add(limb(0.3, [-0.52, 1.98, -0.05], [0.52, 1.98, -0.05], OGRO, SKIN))
  const pescoco = sphere(0.3, OGRO, SKIN)
  pescoco.position.set(0, 2.12, 0)
  ogro.add(pescoco)

  // braço da frente (lado -x) jogado para trás, se equilibrando
  const COTOVELO: V3 = [-0.9, 1.7, -0.3]
  const PULSO: V3 = [-0.98, 1.58, -0.68]
  ogro.add(limb(0.18, [-0.62, 1.96, 0], COTOVELO, OGRO, SKIN))
  ogro.add(limb(0.165, COTOVELO, PULSO, OGRO, SKIN))
  const mao = new THREE.Group()
  mao.position.set(-0.995, 1.555, -0.76)
  mao.quaternion.setFromUnitVectors(
    FWD,
    new THREE.Vector3(...PULSO).sub(new THREE.Vector3(...COTOVELO)).normalize(),
  )
  ogro.add(mao)
  const palma = sphere(0.16, OGRO, SKIN)
  palma.scale.set(1.05, 0.7, 1)
  mao.add(palma)
  for (let k = 0; k < 4; k++) {
    const a = -0.5 + k * 0.33
    mao.add(limb(0.045, [Math.sin(a) * 0.1, 0, Math.cos(a) * 0.1], [Math.sin(a) * 0.24, -0.04, Math.cos(a) * 0.24], OGRO, SKIN))
  }
  mao.add(limb(0.05, [-0.08, 0.03, 0.02], [-0.2, 0.08, 0.08], OGRO, SKIN))

  // ---- cabeça careca: orelhas em cone, olhos marejados, careta -------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, HEAD_Y, 0.06)
  cabeca.rotation.set(0.05, -1.05, 0.05) // vira o rosto para você
  cabeca.scale.setScalar(1.12)
  ogro.add(cabeca)

  const cranio = sphere(0.37, OGRO, SKIN)
  cranio.scale.set(1, 0.9, 0.95)
  cranio.position.set(0, 0.06, -0.02)
  cabeca.add(cranio)
  const queixo = sphere(0.35, OGRO, SKIN)
  queixo.scale.set(1.16, 0.7, 0.95)
  queixo.position.set(0, -0.12, 0.05)
  cabeca.add(queixo)
  const nariz = sphere(0.1, OGRO_ESC, SKIN)
  nariz.scale.set(1.35, 0.9, 1)
  nariz.position.set(0, -0.06, 0.365)
  cabeca.add(nariz)
  for (const side of [-1, 1]) {
    const narina = sphere(0.022, '#2c3f1c', { roughness: 0.6 }, 10)
    narina.position.set(side * 0.055, -0.105, 0.42)
    cabeca.add(narina)

    const orelha = cone(0.09, 0.24, OGRO, SKIN)
    orelha.position.set(side * 0.43, 0.06, -0.03)
    orelha.rotation.z = -side * (Math.PI / 2 - 0.45)
    cabeca.add(orelha)

    const esclera = sphere(0.088, '#ffffff', { roughness: 0.2 })
    esclera.position.set(side * 0.135, -0.01, 0.322)
    esclera.scale.z = 0.6
    cabeca.add(esclera)
    const pupila = sphere(0.045, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.13, 0.005, 0.37)
    cabeca.add(pupila)
    const brilho = sphere(0.016, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.8 }, 8)
    brilho.position.set(side * 0.112, 0.025, 0.392)
    cabeca.add(brilho)
    // poça d'água na pálpebra de baixo: olho marejado
    const poca = sphere(0.082, LAGRIMA, { roughness: 0.05 })
    poca.scale.set(1.12, 0.36, 0.55)
    poca.position.set(side * 0.135, -0.06, 0.338)
    cabeca.add(poca)

    // sobrancelha aflita: ponta de dentro levantada
    const sobr = capsule(0.032, 0.13, OGRO_ESC, SKIN)
    sobr.position.set(side * 0.14, 0.1, 0.33)
    sobr.rotation.z = Math.PI / 2 - side * 0.42
    cabeca.add(sobr)

    const verruga = sphere(0.026, OGRO_ESC, SKIN, 10)
    verruga.position.set(side * 0.24, side > 0 ? -0.02 : 0.22, side > 0 ? 0.27 : 0.23)
    cabeca.add(verruga)
  }

  // careta: dentes cerrados num sorriso torto de dor (cantos levantados)
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.046
    const y = -0.19 + 0.0055 * i * i
    const z = 0.05 + 0.3325 * Math.sqrt(Math.max(0, 1 - (x / 0.406) ** 2)) + 0.004
    const col = new THREE.Group()
    col.position.set(x, y, z)
    col.rotation.set(-0.12, Math.asin(x / 0.42), i * 0.06)
    const fundo = rbox(0.052, 0.12, 0.03, 0.012, BOCA, { roughness: 0.7 })
    col.add(fundo)
    for (const dy of [0.028, -0.028]) {
      const dente = rbox(0.04, 0.048, 0.026, 0.01, DENTE, { roughness: 0.3 })
      dente.position.set(0, dy, 0.01)
      col.add(dente)
    }
    cabeca.add(col)
  }

  // ---- faixa vermelha amarrada na testa (gira e se amarra) -----------------
  // tira de pano (anel torneado de seção chata) colada à testa, nó do lado
  // de trás com as duas pontas voando para trás
  const faixa = new THREE.Group()
  cabeca.add(faixa)
  const anel = new THREE.Group()
  anel.position.set(0, 0.23, -0.02)
  anel.rotation.x = 0.14 // frente baixa na testa, atrás mais alta
  faixa.add(anel)
  const banda = lathe(
    // seção cheia (borda de dentro enterrada no crânio): sem fresta entre pano e cabeça
    [[0.25, -0.058], [0.34, -0.058], [0.35, -0.03], [0.354, 0], [0.35, 0.03], [0.34, 0.058], [0.25, 0.058]],
    FAIXA,
    PANO,
    48,
  )
  banda.scale.z = 1.06
  anel.add(banda)
  const no = sphere(0.065, FAIXA, PANO)
  no.scale.set(0.75, 1, 1)
  no.position.set(-0.33, 0.0, -0.16)
  anel.add(no)
  for (const [dir, len] of [[[-0.5, -0.65, -0.6], 0.26], [[-0.75, -0.3, -0.55], 0.22]] as const) {
    const d = new THREE.Vector3(...dir).normalize()
    const ponta = rbox(0.07, len, 0.018, 0.009, FAIXA, PANO)
    ponta.quaternion.setFromUnitVectors(UP, d)
    ponta.position.set(-0.33, 0.0, -0.16).addScaledVector(d, len / 2 + 0.02)
    anel.add(ponta)
  }

  // ---- lágrimas saltando dos olhos ------------------------------------------
  const lagrimas = new THREE.Group()
  cabeca.add(lagrimas)
  const gota = (r: number, pos: V3, tip: V3) => {
    const g = new THREE.Group()
    g.position.set(...pos)
    const ball = sphere(r, LAGRIMA, { roughness: 0.06, emissive: '#2a8fd8', emissiveIntensity: 0.25 })
    g.add(ball)
    const dir = new THREE.Vector3(...tip).normalize()
    const c = cone(r * 0.86, r * 1.7, LAGRIMA, { roughness: 0.06, emissive: '#2a8fd8', emissiveIntensity: 0.25 })
    c.quaternion.setFromUnitVectors(UP, dir)
    c.position.copy(dir.multiplyScalar(r * 0.95))
    g.add(c)
    return g
  }
  for (const side of [-1, 1]) {
    lagrimas.add(gota(0.04, [side * 0.3, 0.05, 0.32], [-side, 0.9, 0]))
    lagrimas.add(gota(0.048, [side * 0.45, 0.03, 0.28], [-side, 0.5, 0]))
    lagrimas.add(gota(0.056, [side * 0.6, -0.07, 0.24], [-side, 0.15, 0]))
    // trilha molhada descendo a bochecha
    const trilha = capsule(0.022, 0.12, LAGRIMA, { roughness: 0.06 })
    trilha.position.set(side * 0.2, -0.12, 0.33)
    trilha.rotation.z = side * 0.25
    trilha.scale.z = 0.5
    lagrimas.add(trilha)
  }

  // ---- perna erguida no meio do passo (pivô no quadril) ---------------------
  // a perna da frente sobe de joelho alto — coxa quase na horizontal, canela
  // pendurada, pé no ar acima das brasas —, vista de perfil
  const pe = new THREE.Group()
  pe.position.set(-0.3, PE_Y, 0.04)
  pe.rotation.x = PE_UP
  ogro.add(pe)
  const KNEE: V3 = [-0.03, -0.02, 0.5]
  const ANKLE: V3 = [-0.05, -0.4, 0.44]
  pe.add(limb(0.29, [0, 0.04, 0], [0, 0.0, 0.2], BERMUDA, PANO))
  const barraPe = torus(0.27, 0.035, BERMUDA, PANO)
  barraPe.position.set(0, -0.01, 0.31)
  pe.add(barraPe)
  const florPe = flower(0.17, FLOR2)
  florPe.position.set(-0.29, 0.06, 0.12)
  florPe.quaternion.setFromUnitVectors(FWD, new THREE.Vector3(-1, 0.15, 0.1).normalize())
  pe.add(florPe)
  pe.add(limb(0.24, [0, 0, 0], KNEE, OGRO, SKIN))
  pe.add(limb(0.21, KNEE, ANKLE, OGRO, SKIN))
  const peAr = sphere(0.21, OGRO_ESC, SKIN)
  peAr.scale.set(1, 0.5, 1.45)
  peAr.position.set(-0.05, -0.48, 0.54)
  peAr.rotation.x = 0.5
  pe.add(peAr)
  for (const [k, tx] of [0.07, -0.01, -0.09, -0.17].entries()) {
    const toe = sphere(k === 0 ? 0.065 : 0.05, OGRO_ESC, SKIN, 14)
    toe.position.set(tx, -0.61, 0.8)
    pe.add(toe)
  }

  // ---- braço do joinha (pivô no ombro de trás, erguido acima da cabeça) -----
  const joinha = new THREE.Group()
  joinha.position.set(0.62, 1.96, 0)
  joinha.rotation.x = 0
  ogro.add(joinha)
  const COTOVELO_J: V3 = [0.22, 0.24, 0.4]
  const PULSO_J: V3 = [0.24, 0.66, 0.62]
  joinha.add(limb(0.18, [0, 0, 0], COTOVELO_J, OGRO, SKIN))
  joinha.add(limb(0.165, COTOVELO_J, PULSO_J, OGRO, SKIN))
  const punho = sphere(0.16, OGRO, SKIN)
  punho.scale.set(0.95, 0.95, 1.05)
  punho.position.set(0.24, 0.78, 0.66)
  joinha.add(punho)
  // dedos dobrados virados para a câmera (-x), polegar para cima
  for (let k = 0; k < 4; k++) {
    const dedo = capsule(0.046, 0.1, OGRO, SKIN)
    dedo.rotation.x = Math.PI / 2
    dedo.position.set(0.12, 0.69 + k * 0.058, 0.68)
    joinha.add(dedo)
  }
  joinha.add(limb(0.06, [0.22, 0.88, 0.65], [0.21, 1.06, 0.64], OGRO, SKIN))

  // ---- fumaça subindo dos pés ----------------------------------------------
  const fumaca = new THREE.Group()
  ogro.add(fumaca)
  for (const [x, y, z, r, s, o] of [
    // pé de apoio: rastro subindo para trás (ele anda para a frente)
    [0.3, 0.1, -0.24, 0.1, 60, 0.6],
    [0.36, 0.14, -0.4, 0.11, 61, 0.6],
    [0.32, 0.4, -0.55, 0.14, 62, 0.52],
    [0.38, 0.7, -0.7, 0.17, 63, 0.42],
    [0.32, 1.0, -0.88, 0.2, 64, 0.32],
    // pé no ar: vapor da pegada nas brasas e coluna saindo dos dedos
    [-0.3, 0.03, 0.5, 0.1, 65, 0.55],
    [-0.32, 0.42, 0.84, 0.08, 66, 0.6],
    [-0.3, 0.62, 0.92, 0.11, 67, 0.5],
    [-0.33, 0.86, 1.0, 0.14, 68, 0.4],
    [-0.3, 1.12, 1.08, 0.17, 69, 0.3],
  ] as const) {
    const nuvem = puff(r, FUMACA, 5, s, { roughness: 1, detail: 0 })
    nuvem.position.set(x, y, z)
    translucent(nuvem, o)
    fumaca.add(nuvem)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'clareira', object: base },
    { name: 'pinheiros', group: 'clareira', object: pinheiros },
    { name: 'brasas', group: 'brasas', object: brasas },
    { name: 'ogro', group: 'ogro', object: ogro },
    { name: 'cabeca', group: 'ogro', object: cabeca },
    { name: 'faixa', group: 'ogro', object: faixa },
    { name: 'joinha', group: 'ogro', object: joinha },
    { name: 'pe', group: 'pisa', object: pe },
    { name: 'fumaca', group: 'pisa', object: fumaca },
    { name: 'lagrimas', group: 'choro', object: lagrimas },
    { name: 'balde', group: 'balde', object: balde },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Retiro de coragem na floresta: brota uma clareira de terra escura entre os pinheiros…',
    }),
    seq('pinheiros-rise', 'pinheiros', 0.25, 1.0, [riseFrom(0, 3.0)], { ease: 'easeOut' }),

    seq('brasas-rise', 'brasas', 1.8, 0.9, [riseFrom(0, 0.5)], {
      ease: 'easeOut',
      caption: '…e nela um corredor de BRASAS — BRÁ! — chiando em laranja. Desafio final: atravessar descalço.',
    }),

    seq('ogro-rise', 'ogro', 3.6, 0.9, [riseFrom(COAL, 2.9)], {
      ease: 'easeOut',
      caption: 'O primeiro da fila é o ogro que a turma chama de GORDO — GÔR! —, de bermuda florida.',
    }),
    seq('cabeca-sobe', 'cabeca', 3.85, 0.7, [ch('position.y', HEAD_Y - 0.6, HEAD_Y)], { ease: 'easeOut' }),
    seq('joinha-pende', 'joinha', 3.6, 0.9, [ch('rotation.x', JOINHA_DOWN + 0.3, JOINHA_DOWN)], { ease: 'easeOut' }),
    seq('pe-pende', 'pe', 3.6, 0.9, [ch('rotation.x', PE_DOWN, PE_UP)], { ease: 'easeOut' }),
    seq('faixa-amarra', 'faixa', 4.6, 0.7, [...grow(0.4), ch('rotation.y', -Math.PI, 0)], {
      ease: 'easeOut',
      caption: 'Faixa vermelha amarrada na testa: ele vai primeiro.',
    }),

    // o passo: pisa — TSSSS! — e avança pé ante pé
    seq('pe-pisa', 'pe', 5.8, 0.35, [ch('rotation.x', PE_UP, PE_DOWN), ch('position.y', PE_Y, PE_Y - 0.09)], {
      ease: 'easeIn',
      caption: 'Ele pisa — TSSSS! — e sobe fumaça dos pés. Mas o GORDO segue: GÔR, ele ANDA, pé ante pé.',
    }),
    seq('fumaca-sobe', 'fumaca', 6.1, 0.9, [...grow(0.2), ch('position.y', -0.35, 0)], { ease: 'easeOut' }),
    seq('ogro-avanca', 'ogro', 6.15, 0.8, [ch('position.x', OX0, OX), ch('position.z', OZ0, OZ)]),
    seq('ogro-afunda', 'ogro', 6.15, 0.3, [ch('scale.y', OS, OS * 0.95)], { ease: 'easeOut' }),
    seq('ogro-volta', 'ogro', 6.45, 0.4, [ch('scale.y', OS * 0.95, OS)], { ease: 'easeOut' }),
    seq('pe-ergue', 'pe', 6.5, 0.5, [ch('rotation.x', PE_DOWN, PE_UP), ch('position.y', PE_Y - 0.09, PE_Y)], {
      ease: 'easeOut',
    }),

    seq('lagrimas-saltam', 'lagrimas', 7.8, 0.6, grow(), {
      ease: 'easeOut',
      caption: 'Os olhos enchem d\'água, a barriga balança… e mesmo assim ele faz joinha.',
    }),
    seq('joinha-ergue', 'joinha', 8.4, 0.6, [ch('rotation.x', JOINHA_DOWN, -0.12)], { ease: 'easeOut' }),
    seq('joinha-firma', 'joinha', 9.0, 0.3, [ch('rotation.x', -0.12, 0)]),

    seq('balde-rise', 'balde', 9.8, 0.7, [riseFrom(GY, 0.7), ch('rotation.z', 0.25, 0)], {
      ease: 'easeOut',
      caption: 'Da beira, com o balde d\'água pronto, você pergunta: GÔR… DÊ BRÁ? — tá indo bem aí?',
    }),

    seq('joinha-balanca', 'joinha', 11.4, 0.35, [ch('rotation.x', 0, -0.14)], {
      ease: 'easeOut',
      caption: 'Går det bra? — Tudo bem? / Pode ser?',
    }),
    seq('joinha-assenta', 'joinha', 11.75, 0.4, [ch('rotation.x', -0.14, 0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 2.15, 5.8], target: [-0.1, 1.33, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'gar-det-bra',
    contexto:
      "Cortesia: oferecendo ajuda — alguém escorregou na calçada congelada, uma mãe luta com o carrinho na escada do metrô, uma criança chora sozinha. E pra checar se algo serve: 'Går det bra på torsdag?' (quinta serve?), 'Går det bra om jag öppnar fönstret?' (tudo bem se eu abrir a janela?). A resposta é a frase virada: 'Ja, det går bra!'",
    fraseFonte: 'Tudo bem? / Pode ser?',
    fraseAlvo: 'Går det bra?',
    pronuncia:
      "gô(r)-de BRÁÁ? ('går' com G duro de 'gato', Ô FECHADO e longo — o å longo — e R brando que, na fala, encosta no D de 'det' e some dentro dele, com a língua enrolada pra trás: gô-de; mas é ele que faz 'går' — sem ele sobra 'gå', o infinitivo; 'det' = dê, fraquinho; 'bra' com R de um toque só e A longo de 'pá', com a força; a voz sobe no fim, de pergunta)",
    ponteSonora:
      "GÔR... DÊ BRÁ? (3 sílabas: gôr-de-BRÁÁ; a força maior no BRÁ; GÔR = GORDO sem o -DO, o MESMO 'går' da pantera Nero, gorda e entalada, de 'När går nästa buss?' e de 'Vilket spår går tåget från?': G duro de 'gato', Ô FECHADO de 'avô' e LONGO, e R BRANDO à caipira — que faz aqui o que já faz em 'GORDO': enrola a língua e escorrega direto no D seguinte, gôr-de num fôlego só; sem o R sobra 'gå', o infinitivo; e nada do iÖR rangido de 'Det gör ont här' (outro verbo, 'fazer'): aqui é G duro e Ô de boca redonda, sem bico; DÊ BRÁ = o MESMO fim de 'Ha det bra!': o DÊ do 'det' de sempre, Ê fechado, fraquinho e sem T, e o BRÁ de BRASA, R de um toque só e A longo — o mesmo 'bra' de 'Ha en bra dag!' e 'Det låter bra'; ATENÇÃO ao par: em 'Ha det bra' o dragão sopra RRÁ — é despedida, se cuida —; aqui o gordo ANDA ('går' é anda, vai) e a voz sobe: é PERGUNTA, tá indo bem?)",
    historia:
      "Retiro de coragem na floresta: o desafio final é atravessar descalço um corredor de BRASAS. O primeiro da fila é o ogro verde que a turma inteira chama de GORDO — trezentos quilos, bermuda florida e faixa vermelha na testa. Ele pisa — TSSSS! —, sobe fumaça dos pés, os olhos enchem d'água, mas ele segue, pé ante pé, a barriga balançando a cada passo. Você, na beira, com o balde d'água pronto, pergunta: GÔR... DÊ BRÁ? — tá indo bem aí? E ele, chorando e sorrindo, faz joinha: 'Det går bra!'",
  },
  createScene,
  refine: { organic: ['ogro', 'cabeca', 'pe', 'joinha'] },
}

export default card
