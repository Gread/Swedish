import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, type MatOpts,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, rock,
} from '../rig/helpers'

/**
 * "Är det starkt?" — É D'ESTA ARCA? (É DÊS-TÁRC… T!)
 *
 * Feira de especiarias: um babuíno medroso, de olhos arregalados e testa
 * suada, segura um prato de ensopado vermelho-vivo e, com a outra mão, BATE a
 * tampa de uma arca do tesouro de onde escapam pimentas em brasa e fumaça —
 * a tampa fecha antes do -A da arca: TÁRC… T!
 *
 * Diorama: chão de terra batida alaranjada, dois sacos de juta ao fundo
 * (cúrcuma e canela), arca de madeira com cintas douradas à direita, babuíno
 * agachado no centro-esquerda virado para ela.
 */

const TERRA = '#c27a46'
const TERRA_ESC = '#a5633a'
const JUTA = '#b8975f'
const JUTA_ESC = '#9a7a48'
const CURCUMA = '#e0a92a'
const CANELA = '#8a4a26'
const MADEIRA = '#7a4a2a'
const MADEIRA_ESC = '#5a341c'
const OURO = '#d9a93a'
const PELO = '#7d6f58'
const PELO_ESC = '#5f5444'
const JUBA = '#a99a7b'
const CARA = '#6e5652'
const CARA_ESC = '#3e2e2e'
const TRASEIRO = '#c65a62'
const LOUCA = '#f3eee4'
const LOUCA_AZUL = '#3f6fa8'
const ENSOPADO = '#a51d10'
const VAPOR = '#ece8e2'
const FUMACA = '#9c9792'
const SUOR = '#86c8ec'
const BRASA = '#d8160e' // acento saturado RESERVADO: as pimentas em brasa da ARCA
const VERDE = '#4f7d36'

const FY = 0.12 // topo do chão de terra

// arca: medidas do corpo e ângulo final da tampa (quase fechada)
const AW = 0.98
const AH = 0.5
const AD = 0.6
const TAMPA_FINAL = -0.2
const TAMPA_ABERTA = -1.15

/** Meio-cilindro deitado ao longo de x (cúpula da tampa), cúpula para +y. */
function halfDome(r: number, len: number, color: string, opts: MatOpts = {}) {
  const geo = new THREE.CylinderGeometry(r, r, len, 32, 1, false, 0, Math.PI)
  geo.rotateZ(Math.PI / 2)
  const m = new THREE.Mesh(geo, mat(color, { size: len, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Pimenta curva: corpo + ponta dobrada + cálice verde. Aponta para +y. */
function pimenta(len: number, curva: number) {
  const g = new THREE.Group()
  const brilho = { roughness: 0.3, emissive: '#ff1800', emissiveIntensity: 0.75 }
  const corpo = capsule(0.036, len * 0.4, BRASA, brilho)
  corpo.position.y = len * 0.26
  g.add(corpo)
  // ponta afinando e curvando em 2 gomos
  const meio = cylinder(0.026, 0.036, len * 0.32, BRASA, brilho)
  meio.position.set(Math.sin(curva * 0.5) * len * 0.12, len * 0.62, 0)
  meio.rotation.z = -curva * 0.5
  g.add(meio)
  const ponta = cone(0.026, len * 0.3, BRASA, brilho)
  ponta.position.set(Math.sin(curva * 0.5) * len * 0.24 + Math.sin(curva) * len * 0.15, len * 0.62 + len * 0.14 + Math.cos(curva) * len * 0.15, 0)
  ponta.rotation.z = -curva
  g.add(ponta)
  const calice = sphere(0.045, VERDE, { roughness: 0.6 })
  calice.scale.set(1.05, 0.5, 1.05)
  g.add(calice)
  const talo = cylinder(0.013, 0.016, 0.09, VERDE, { roughness: 0.6 })
  talo.position.set(0.012, -0.05, 0)
  talo.rotation.z = 0.3
  g.add(talo)
  return g
}

/** Coluna de fumaça: nuvenzinhas encavaladas subindo em S, base na origem. */
function fio(alto: number, r0: number, cor: string, seed: number) {
  const g = new THREE.Group()
  const n = 4
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1)
    const nuvem = puff(r0 * (1 - k * 0.4), cor, 5, seed * 7 + i, { roughness: 1 })
    nuvem.position.set(Math.sin(k * 3.2 + seed) * r0 * 0.6, r0 + k * (alto - r0), -k * alto * 0.35)
    g.add(nuvem)
  }
  return g
}

/** Vapor de desenho: fio fino em S feito de gomos de cápsula, base na origem. */
function vaporS(alto: number, cor: string, fase: number) {
  const g = new THREE.Group()
  const lado = fase % 2 === 0 ? 1 : -1
  const pts = [0, 1, 2, 3, 4].map(
    (i) => new THREE.Vector3(Math.sin(i * 1.6) * 0.035 * lado, (i / 4) * alto, 0),
  )
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.016, 8)
  const fio = new THREE.Mesh(geo, mat(cor, { roughness: 1, detail: 0, size: alto }))
  fio.castShadow = true
  g.add(fio)
  for (const [i, pt] of [pts[0], pts[4]].entries()) {
    const ponta = sphere(i === 0 ? 0.016 : 0.012, cor, { roughness: 1, detail: 0 })
    ponta.position.copy(pt)
    g.add(ponta)
  }
  return g
}

/**
 * Membro do babuíno do ombro até um alvo: grupo com ordem YXZ — rotation.y é
 * o rumo e rotation.x a inclinação (positivo = desce). Construído ao longo de
 * +z; a mão é contra-girada para ficar espalmada na horizontal.
 */
function braco(dist: number) {
  const g = new THREE.Group()
  g.rotation.order = 'YXZ'
  const ombro = sphere(0.15, PELO, { roughness: 0.9 })
  g.add(ombro)
  const sup = capsule(0.115, dist * 0.42, PELO, { roughness: 0.9 })
  sup.rotation.x = Math.PI / 2
  sup.position.z = dist * 0.25
  g.add(sup)
  const ante = capsule(0.1, dist * 0.4, PELO, { roughness: 0.9 })
  ante.rotation.x = Math.PI / 2
  ante.position.z = dist * 0.66
  g.add(ante)
  const mao = new THREE.Group()
  mao.name = 'mao'
  mao.position.z = dist
  const palma = sphere(0.115, CARA, { roughness: 0.75 })
  palma.scale.set(1.05, 0.45, 1.25)
  mao.add(palma)
  for (let d = 0; d < 4; d++) {
    const dedo = capsule(0.032, 0.07, CARA, { roughness: 0.75 })
    dedo.rotation.x = Math.PI / 2
    dedo.position.set(-0.075 + d * 0.05, -0.01, 0.13)
    mao.add(dedo)
  }
  const polegar = capsule(0.034, 0.06, CARA, { roughness: 0.75 })
  polegar.rotation.set(Math.PI / 2, 0.9, 0)
  polegar.position.set(-0.11, 0, 0.04)
  mao.add(polegar)
  g.add(mao)
  return g
}

/** Aponta um braco() do ombro para o alvo (ambos no mesmo espaço). */
function mira(g: THREE.Group, de: THREE.Vector3, para: THREE.Vector3) {
  const d = para.clone().sub(de)
  const yaw = Math.atan2(d.x, d.z)
  const pitch = Math.atan2(-d.y, Math.hypot(d.x, d.z))
  g.position.copy(de)
  g.rotation.y = yaw
  g.rotation.x = pitch
  const mao = g.getObjectByName('mao')!
  mao.rotation.x = -pitch
  return pitch
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- feira: chão de terra batida ---------------------------------------------
  const base = new THREE.Group()
  const chao = cylinder(2.45, 2.55, 0.12, TERRA, { roughness: 0.95 })
  chao.position.y = 0.06
  base.add(chao)
  const borda = torus(2.47, 0.04, TERRA_ESC, { roughness: 0.95 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = FY - 0.01
  base.add(borda)
  // manchas de terra mais escura e pedrinhas
  for (const [mx, mz, mr] of [[-0.9, 1.1, 0.55], [1.2, 1.3, 0.4], [0.2, -1.3, 0.6]] as const) {
    const mancha = cylinder(mr, mr, 0.01, TERRA_ESC, { roughness: 0.95 })
    mancha.position.set(mx, FY + 0.003, mz)
    mancha.scale.z = 0.7
    base.add(mancha)
  }
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.4 + rand() * 0.85
    const pedra = rock(0.05 + rand() * 0.05, '#9b8a78', 10 + i, { roughness: 0.9 })
    pedra.position.set(Math.cos(a) * r, FY + 0.02, Math.sin(a) * r)
    base.add(pedra)
  }
  root.add(base)

  // ---- sacos de juta ao fundo ---------------------------------------------------
  const sacos = new THREE.Group()
  root.add(sacos)
  const saco = (x: number, z: number, s: number, tempero: string, seed: number) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    g.scale.setScalar(s)
    const corpo = lathe(
      [[0, 0], [0.24, 0], [0.31, 0.08], [0.34, 0.26], [0.31, 0.42], [0.27, 0.5], [0.25, 0.5], [0, 0.48]],
      JUTA,
      { roughness: 0.95 },
    )
    g.add(corpo)
    const dobra = torus(0.27, 0.055, JUTA_ESC, { roughness: 0.95 })
    dobra.rotation.x = Math.PI / 2
    dobra.position.y = 0.5
    g.add(dobra)
    const monte = sphere(0.25, tempero, { roughness: 0.95 })
    monte.scale.set(1, 0.55, 1)
    monte.position.y = 0.52
    g.add(monte)
    const pico = cone(0.14, 0.12, tempero, { roughness: 0.95 })
    pico.position.y = 0.66
    g.add(pico)
    // costura vertical e cordão
    const costura = rbox(0.02, 0.36, 0.02, 0.008, JUTA_ESC, { roughness: 0.95 })
    costura.position.set(0, 0.25, 0.335)
    g.add(costura)
    // concha de madeira enterrada no tempero
    const concha = new THREE.Group()
    concha.position.set(0.08, 0.62, 0.05)
    concha.rotation.set(0.5, rand() * 3, -0.5)
    const cabo = cylinder(0.018, 0.02, 0.32, MADEIRA, { roughness: 0.7 })
    cabo.position.y = 0.14
    concha.add(cabo)
    g.add(concha)
    g.rotation.y = seed
    sacos.add(g)
  }
  saco(-1.55, -0.55, 1.05, CURCUMA, 0.4)
  saco(-0.75, -1.35, 1.0, CANELA, -0.3)
  sacos.position.y = FY

  // ---- ARCA do tesouro ------------------------------------------------------------
  const arca = new THREE.Group()
  arca.position.set(0.82, FY, 0.22)
  arca.rotation.y = -0.42
  root.add(arca)

  const caixa = rbox(AW, AH, AD, 0.03, MADEIRA, { roughness: 0.7 })
  caixa.position.y = AH / 2
  arca.add(caixa)
  // frisos das tábuas
  for (const fy of [0.17, 0.34]) {
    const friso = rbox(AW + 0.008, 0.018, AD + 0.008, 0.006, MADEIRA_ESC, { roughness: 0.75 })
    friso.position.y = fy
    arca.add(friso)
  }
  // cintas douradas verticais + cantoneiras
  for (const sx of [-1, 1]) {
    const cinta = rbox(0.08, AH + 0.012, AD + 0.024, 0.012, OURO, { roughness: 0.3, metalness: 0.8 })
    cinta.position.set(sx * 0.3, AH / 2, 0)
    arca.add(cinta)
    for (const sz of [-1, 1]) {
      const canto = rbox(0.06, AH + 0.02, 0.06, 0.012, OURO, { roughness: 0.3, metalness: 0.8 })
      canto.position.set(sx * (AW / 2 - 0.02), AH / 2, sz * (AD / 2 - 0.02))
      arca.add(canto)
    }
    // rebites
    for (const ry of [0.1, 0.25, 0.4]) {
      const rebite = sphere(0.016, '#f0c95a', { roughness: 0.25, metalness: 0.85 })
      rebite.position.set(sx * 0.3, ry, AD / 2 + 0.014)
      arca.add(rebite)
    }
  }
  // fecho dourado com argola
  const fecho = rbox(0.15, 0.17, 0.035, 0.015, OURO, { roughness: 0.3, metalness: 0.8 })
  fecho.position.set(0, AH - 0.1, AD / 2 + 0.018)
  arca.add(fecho)
  const buraco = rbox(0.03, 0.06, 0.01, 0.005, '#2a1a10', { roughness: 0.6 })
  buraco.position.set(0, AH - 0.12, AD / 2 + 0.037)
  arca.add(buraco)
  // brasa lá dentro, vista pela fresta
  const brilho = rbox(AW - 0.1, 0.03, AD - 0.1, 0.01, '#ff7a20', { emissive: '#ff5a10', emissiveIntensity: 1.3 })
  brilho.position.y = AH - 0.02
  arca.add(brilho)

  // ---- tampa: dobradiça na aresta de trás --------------------------------------
  const tampa = new THREE.Group()
  tampa.position.set(0, AH, -AD / 2)
  tampa.rotation.x = TAMPA_FINAL
  arca.add(tampa)
  const cupula = halfDome(AD / 2, AW, MADEIRA, { roughness: 0.7 })
  cupula.position.z = AD / 2
  tampa.add(cupula)
  const aba = rbox(AW + 0.02, 0.05, AD + 0.02, 0.015, MADEIRA_ESC, { roughness: 0.7 })
  aba.position.set(0, 0.02, AD / 2)
  tampa.add(aba)
  for (const sx of [-1, 1]) {
    const cintaT = halfDome(AD / 2 + 0.012, 0.08, OURO, { roughness: 0.3, metalness: 0.8 })
    cintaT.position.set(sx * 0.3, 0, AD / 2)
    tampa.add(cintaT)
  }
  const lingueta = rbox(0.09, 0.13, 0.025, 0.01, OURO, { roughness: 0.3, metalness: 0.8 })
  lingueta.position.set(0, -0.03, AD + 0.02)
  tampa.add(lingueta)

  // ---- pimentas em brasa escapando pela fresta ----------------------------------
  const pimentas = new THREE.Group()
  pimentas.position.set(0, AH, AD / 2 - 0.04)
  arca.add(pimentas)
  // penduradas pela frente, saindo da fresta
  const frente: [number, number, number, number][] = [
    // x, inclinação (rot.x), giro (rot.z), tamanho
    [-0.36, 2.3, 0.25, 0.26],
    [-0.16, 2.05, -0.2, 0.3],
    [0.13, 2.4, 0.15, 0.27],
    [0.4, 2.15, -0.3, 0.25],
    [-0.02, 1.4, 0.1, 0.24],
    [0.27, 1.25, -0.5, 0.22],
  ]
  for (const [x, rx, rz, len] of frente) {
    const p = pimenta(len, 0.5 + rand() * 0.3)
    p.position.set(x, 0.04, 0)
    p.rotation.set(rx, 0, rz)
    pimentas.add(p)
  }
  // saindo pelas laterais
  for (const sx of [-1, 1]) {
    const p = pimenta(0.24, 0.6)
    p.position.set(sx * (AW / 2 - 0.05), 0.03, 0.08 - AD / 2 + 0.04)
    p.rotation.set(0.3, 0, -sx * 1.5)
    pimentas.add(p)
  }
  // caídas no chão, na frente da arca
  for (const [x, z, ry] of [[-0.28, 0.55, 0.8], [0.12, 0.62, -0.6], [0.42, 0.5, 2.2]] as const) {
    const p = pimenta(0.24, 0.6)
    p.rotation.set(Math.PI / 2, 0, 0)
    const deitada = new THREE.Group()
    deitada.rotation.y = ry
    deitada.position.set(x, -AH, z - AD / 2 + 0.04)
    p.position.set(0, 0.045, 0)
    deitada.add(p)
    pimentas.add(deitada)
  }

  // ---- três fios de fumaça saindo da arca ----------------------------------------
  const fumaca = new THREE.Group()
  fumaca.position.set(0, AH + 0.08, AD / 2 - 0.02)
  arca.add(fumaca)
  for (const [i, fx] of [0.06, 0.25, 0.42].entries()) {
    const f = fio(0.55 + i * 0.12, 0.1, FUMACA, 3 + i * 2)
    f.position.set(fx, 0.05, 0)
    fumaca.add(f)
  }

  // ---- BABUÍNO agachado -----------------------------------------------------------
  const babuino = new THREE.Group()
  babuino.position.set(-0.52, FY, 0.12)
  babuino.rotation.y = 0.48
  root.add(babuino)

  const quadril = sphere(0.42, PELO, { roughness: 0.9 })
  quadril.scale.set(1.05, 0.8, 1.0)
  quadril.position.set(0, 0.38, -0.12)
  babuino.add(quadril)

  // traseiro vermelho de nascença
  for (const sx of [-1, 1]) {
    const nadega = sphere(0.19, TRASEIRO, { roughness: 0.6 })
    nadega.scale.set(1, 1.15, 0.6)
    nadega.position.set(sx * 0.17, 0.33, -0.47)
    babuino.add(nadega)
  }

  const barriga = capsule(0.34, 0.42, PELO, { roughness: 0.9 })
  barriga.position.set(0, 0.85, 0)
  barriga.rotation.x = 0.2
  babuino.add(barriga)

  const ombros = sphere(0.38, PELO, { roughness: 0.9 })
  ombros.scale.set(1.3, 0.85, 0.95)
  ombros.position.set(0, 1.17, 0.06)
  babuino.add(ombros)

  const juba = puff(0.27, JUBA, 7, 71, { roughness: 0.95 })
  juba.scale.set(1.35, 0.85, 1.0)
  juba.position.set(0, 1.34, -0.06)
  babuino.add(juba)

  // pernas: joelhos altos, pés compridos
  for (const sx of [-1, 1]) {
    const coxa = capsule(0.16, 0.34, PELO, { roughness: 0.9 })
    coxa.position.set(sx * 0.28, 0.44, 0.24)
    coxa.rotation.x = 1.1
    babuino.add(coxa)
    const joelho = sphere(0.15, PELO, { roughness: 0.9 })
    joelho.position.set(sx * 0.3, 0.56, 0.44)
    babuino.add(joelho)
    const canela = capsule(0.12, 0.3, PELO_ESC, { roughness: 0.9 })
    canela.position.set(sx * 0.31, 0.32, 0.5)
    canela.rotation.x = -0.1
    babuino.add(canela)
    const pe = sphere(0.13, CARA, { roughness: 0.8 })
    pe.scale.set(0.95, 0.45, 1.55)
    pe.position.set(sx * 0.31, 0.06, 0.6)
    babuino.add(pe)
  }

  // cauda em arco atrás
  const cauda1 = capsule(0.06, 0.3, PELO_ESC, { roughness: 0.9 })
  cauda1.position.set(0.12, 0.42, -0.62)
  cauda1.rotation.set(-0.9, 0, -0.3)
  babuino.add(cauda1)
  const cauda2 = capsule(0.055, 0.28, PELO_ESC, { roughness: 0.9 })
  cauda2.position.set(0.24, 0.2, -0.82)
  cauda2.rotation.set(-2.0, 0, -0.3)
  babuino.add(cauda2)

  // ---- prato fundo com ensopado (na mão direita, à frente) ---------------------
  const PRATO_POS = new THREE.Vector3(-0.36, 0.98, 0.84)
  const prato = new THREE.Group()
  prato.position.copy(PRATO_POS)
  prato.rotation.set(0.12, 0, 0.08)
  babuino.add(prato)
  const tigela = lathe(
    [[0, 0], [0.1, 0], [0.18, 0.03], [0.245, 0.09], [0.26, 0.105], [0.245, 0.11], [0.2, 0.075], [0.1, 0.035], [0, 0.03]],
    LOUCA,
    { roughness: 0.25 },
  )
  prato.add(tigela)
  const friso = torus(0.252, 0.009, LOUCA_AZUL, { roughness: 0.3 })
  friso.rotation.x = Math.PI / 2
  friso.position.y = 0.1
  prato.add(friso)
  const ensopado = cylinder(0.215, 0.18, 0.04, ENSOPADO, { roughness: 0.55, detail: 0 })
  ensopado.position.y = 0.065
  prato.add(ensopado)
  for (const [px, pz, cor] of [[0.07, 0.04, '#e0782e'], [-0.08, -0.03, '#7a2a14'], [0.0, -0.1, VERDE], [-0.05, 0.1, '#e0782e']] as const) {
    const pedaco = sphere(0.032, cor, { roughness: 0.4 })
    pedaco.scale.y = 0.6
    pedaco.position.set(px, 0.088, pz)
    prato.add(pedaco)
  }

  // braço direito segurando o prato por baixo
  const ombroD = new THREE.Vector3(-0.44, 1.24, 0.12)
  const alvoPrato = PRATO_POS.clone().add(new THREE.Vector3(0, -0.06, -0.02))
  const bracoD = braco(alvoPrato.distanceTo(ombroD))
  mira(bracoD, ombroD, alvoPrato)
  babuino.add(bracoD)

  // ---- vapor do prato ----------------------------------------------------------------
  const vapor = new THREE.Group()
  vapor.position.y = 0.1
  prato.add(vapor)
  for (const [i, vx] of [-0.07, 0.08].entries()) {
    const v = vaporS(0.3, VAPOR, i)
    v.position.set(vx, 0.04, 0)
    vapor.add(v)
  }

  // ---- cabeça: focinho comprido, olhos arregalados ---------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0.02, 1.56, 0.2)
  cabeca.rotation.y = 0.28
  babuino.add(cabeca)

  const cranio = sphere(0.25, PELO, { roughness: 0.9 })
  cabeca.add(cranio)
  const topete = puff(0.17, JUBA, 5, 83, { roughness: 0.95 })
  topete.position.set(0, 0.13, -0.08)
  cabeca.add(topete)
  for (const sx of [-1, 1]) {
    const bochecha = puff(0.13, JUBA, 5, 90 + sx, { roughness: 0.95 })
    bochecha.position.set(sx * 0.22, -0.08, 0.02)
    cabeca.add(bochecha)
    const orelha = sphere(0.055, CARA, { roughness: 0.8 })
    orelha.scale.set(0.6, 1, 0.9)
    orelha.position.set(sx * 0.24, 0.07, -0.04)
    cabeca.add(orelha)
  }
  const face = sphere(0.18, CARA, { roughness: 0.75 })
  face.scale.set(1, 1.05, 0.7)
  face.position.set(0, -0.01, 0.14)
  cabeca.add(face)
  const testa = capsule(0.05, 0.2, PELO_ESC, { roughness: 0.85 })
  testa.rotation.z = Math.PI / 2
  testa.position.set(0, 0.13, 0.2)
  cabeca.add(testa)
  const focinho = capsule(0.105, 0.22, CARA, { roughness: 0.7 })
  focinho.rotation.x = Math.PI / 2 + 0.45
  focinho.position.set(0, -0.11, 0.3)
  cabeca.add(focinho)
  const nariz = sphere(0.085, CARA_ESC, { roughness: 0.4 })
  nariz.scale.set(1.15, 0.8, 0.6)
  nariz.position.set(0, -0.17, 0.5)
  cabeca.add(nariz)
  const boca = sphere(0.075, '#3a1f22', { roughness: 0.5 })
  boca.scale.set(1.25, 0.65, 0.85)
  boca.position.set(0, -0.27, 0.38)
  cabeca.add(boca)
  for (const sx of [-1, 1]) {
    const esclera = sphere(0.078, '#ffffff', { roughness: 0.2 })
    esclera.scale.z = 0.7
    esclera.position.set(sx * 0.095, 0.03, 0.25)
    cabeca.add(esclera)
    const pupila = sphere(0.026, '#151515', { roughness: 0.2 })
    pupila.position.set(sx * 0.09 + 0.012, 0.03, 0.302)
    cabeca.add(pupila)
  }

  // ---- gotas de suor voando da testa ----------------------------------------------
  const suor = new THREE.Group()
  suor.position.set(0, 0.2, 0.12)
  cabeca.add(suor)
  for (const sx of [-1, 1]) {
    const gota = new THREE.Group()
    gota.position.set(sx * 0.3, 0.1, 0.05)
    gota.rotation.z = -sx * 0.9
    const bolha = sphere(0.045, SUOR, { roughness: 0.1 })
    gota.add(bolha)
    const bico = cone(0.043, 0.08, SUOR, { roughness: 0.1 })
    bico.position.y = 0.055
    gota.add(bico)
    suor.add(gota)
  }

  // ---- mão esquerda: espalma em cima da tampa ---------------------------------------
  root.updateMatrixWorld(true)
  const topoTampa = cupula.localToWorld(new THREE.Vector3(-0.2, AD / 2 + 0.06, 0))
  const alvoTampa = babuino.worldToLocal(topoTampa)
  const ombroE = new THREE.Vector3(0.44, 1.24, 0.12)
  const mao = braco(alvoTampa.distanceTo(ombroE))
  const MAO_PITCH = mira(mao, ombroE, alvoTampa)
  babuino.add(mao)

  // ---- peças ---------------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'feira', object: base },
    { name: 'sacos', group: 'feira', object: sacos },
    { name: 'arca', group: 'arca', object: arca },
    { name: 'tampa', group: 'arca', object: tampa },
    { name: 'pimentas', group: 'brasa', object: pimentas },
    { name: 'fumaca', group: 'brasa', object: fumaca },
    { name: 'babuino', group: 'babuino', object: babuino },
    { name: 'cabeca', group: 'babuino', object: cabeca },
    { name: 'prato', group: 'prato', object: prato },
    { name: 'vapor', group: 'prato', object: vapor },
    { name: 'suor', group: 'medo', object: suor },
    { name: 'mao', group: 'tampa', object: mao },
  ]

  const s3 = (from: number) => [
    ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1),
  ]

  // ---- montagem ------------------------------------------------------------------------
  const build = [
    seq('base-sobe', 'base', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Uma feira de especiarias sobe do chão: terra batida e sacos de juta com cúrcuma e canela.',
    }),
    seq('sacos-sobem', 'sacos', 0.45, 0.7, [riseFrom(FY, 0.9)], { ease: 'easeOut' }),

    seq('arca-sobe', 'arca', 1.8, 0.8, [riseFrom(FY, 1.0)], {
      ease: 'easeOut',
      caption: 'Do lado, brota uma ARCA do tesouro de madeira, com cintas e fecho dourados…',
    }),
    seq('tampa-abre', 'tampa', 2.0, 0.7, [ch('rotation.x', TAMPA_FINAL, TAMPA_ABERTA)], { ease: 'easeOut' }),

    seq('pimentas-crescem', 'pimentas', 3.2, 0.7, s3(0.05), {
      ease: 'easeOut',
      caption: '…cheia de pimentas que brilham feito BRASA, transbordando e soltando fumaça.',
    }),
    seq('fumaca-sobe', 'fumaca', 3.5, 1.0, [ch('scale.y', 0.05, 1), ch('scale.x', 0.4, 1)], { ease: 'easeOut' }),

    seq('babuino-sobe', 'babuino', 5.0, 0.9, [riseFrom(FY, 2.0)], {
      ease: 'easeOut',
      caption: 'Chega um babuíno medroso — traseiro vermelho de nascença — com um prato de ensopado vermelho-vivo.',
    }),
    seq('cabeca-sobe', 'cabeca', 5.25, 0.7, [ch('position.y', 0.9, 1.56)], { ease: 'easeOut' }),
    seq('prato-cresce', 'prato', 5.7, 0.5, s3(0.05), { ease: 'easeOut' }),
    seq('vapor-sobe', 'vapor', 6.0, 0.8, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),

    seq('cabeca-vira', 'cabeca', 7.4, 0.5, [ch('rotation.y', -0.35, 0.28)], {
      ease: 'easeInOut',
      caption: 'Ele sua frio e se vira pra arca fumegante: "É D\'ESTA ARCA?" — É DÊS-TÁR…',
    }),
    seq('suor-voa', 'suor', 7.5, 0.5, [...s3(0.05), ch('position.y', 0.05, 0.2)], { ease: 'easeOut' }),

    seq('mao-estende', 'mao', 8.7, 0.5, s3(0.05), { ease: 'easeOut' }),
    seq('mao-ergue', 'mao', 9.2, 0.45, [ch('rotation.x', MAO_PITCH, MAO_PITCH - 0.75)], { ease: 'easeOut' }),

    seq('mao-bate', 'mao', 9.9, 0.25, [ch('rotation.x', MAO_PITCH - 0.75, MAO_PITCH)], {
      ease: 'easeIn',
      caption: '…mas de puro medo BATE a tampa antes do fim da palavra: TÁRC… T!',
    }),
    seq('tampa-bate', 'tampa', 9.75, 0.3, [ch('rotation.x', TAMPA_ABERTA, TAMPA_FINAL)], { ease: 'easeIn' }),
    seq('arca-tranco', 'arca', 10.08, 0.15, [ch('position.y', FY, FY + 0.05)], { ease: 'easeOut' }),
    seq('arca-pousa', 'arca', 10.23, 0.25, [ch('position.y', FY + 0.05, FY)], {
      ease: 'easeIn',
    }),
    seq('fumaca-puf', 'fumaca', 10.1, 0.5, [ch('scale.x', 1.5, 1)], { ease: 'easeOut' }),

    seq('suor-pinga', 'suor', 11.2, 0.4, [ch('position.y', 0.12, 0.2)], {
      ease: 'easeOut',
      caption: 'Är det starkt? — É apimentado?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.4, 2.45, 4.45], target: [0.12, 1.0, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'ar-det-starkt',
    contexto:
      "Restaurante: antes de pedir no tailandês, no indiano ou no mexicano, diante de um molho desconhecido, ou quando alguém oferece um prato caseiro. Em sueco, comida 'stark' é apimentada; o contrário é 'mild'. Respostas comuns: 'Lite starkt' (um pouco) ou 'Nej, det är milt'.",
    fraseAlvo:
      "Är det starkt?",
    fraseFonte:
      "É apimentado?",
    pronuncia:
      "é dê STÁRKT? ('är' = é, aberto e curto; 'det' = dê, o T não soa; 'starkt' numa sílaba só, com o S grudado no T — nada de 'is' —, A curto, R de um toque só (de 'caro', nunca o R aspirado carioca) e K e T secos colados no fim, sem vogal: nunca 'is-TÁR-ki-tchi')",
    ponteSonora:
      "É DÊS-TÁRC(a)-T? (= 'É D'ESTA ARCA?' dito num fôlego só, com a tampa batendo no fim; 3 batidas: é-dê-STÁRKT; a força toda no TÁR; É DÊ = o 'är det' de sempre — o MESMO de 'Är det ledigt här?' e 'Är det till höger eller till vänster?': a pergunta começa pelo verbo, É aberto e curto, DÊ fechado e fraco, o T de 'det' mudo — o 'desta' do português tem É aberto e a força no DÉS: aqui ele fecha, apaga, e a força pula inteira pro TÁR; é D'ESTA, com T — nunca 'dessa', que engole o T; o S de 'desta' é o S de 'starkt', que já sai colado no DÊ, por isso nunca aparece o 'is' antes do ST; TÁRC = 'esta ARCA' emendado: o A de 'esta' some dentro da ARCA (des-TÁR-ca, nunca 'dés-ta-ár-ca' em quatro pedaços), a força no TÁR com A curto e aberto, e o R é de UM toque só, de 'caro' — nunca o R aspirado carioca de 'ARca', que soa 'stahk'; é a ARCA do tesouro, e o R fica — não confunda com a TIL-BARCA de 'tillbaka', em que o R some; C = K seco, e o -A da arca NÃO sai: a tampa bate antes — com o -A vira 'starka', outra forma da palavra; T = a batida seca da tampa: é o -t do neutro, obrigatório depois de 'det' — STÁRKT, uma sílaba só, K e T colados, sem vogal)",
    historia:
      "Na feira de especiarias, o babuíno recebe um prato de ensopado vermelho-vivo. Bem do lado, uma arca do tesouro de madeira transborda de pimentas que brilham feito brasa e solta fumaça pela fresta da tampa. Ele sua frio — o traseiro vermelho de nascença já parece até mais quente. Com a mão tremendo, segura o prato e se vira pra arca fumegante — É D'ESTA ARCA? —, mas de puro medo bate a tampa antes de terminar a palavra: TÁRC... T! Isso aqui é apimentado?",
  },
  createScene,
  refine: { organic: ['babuino', 'cabeca', 'mao'] },
}

export default card
