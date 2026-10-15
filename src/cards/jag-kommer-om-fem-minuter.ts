import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag kommer om fem minuter." — chamam o lutador de sumô pro tablado, mas ele
 * está sentado no chão diante do panelão de chanko: IÁ, CÓ-MER! de boca cheia,
 * fecha os olhos e entoa ÓMMM, crava os dentes no FÊ…MUR de carne e gira o
 * timer pros cinco MI-NÜÜ-TER, mostrando os cinco dedos abertos.
 *
 * Diorama: assoalho escuro do estábulo; o dohyo de argila com o círculo de
 * palha atrás; o lutador sentado de pernas abertas no centro; panelão à
 * direita, timer vermelho (o acento) à esquerda, mão de cinco dedos no alto.
 */

const FLOOR = '#4a3a2c'
const FLOOR_LINE = '#3a2c20'
const CLAY = '#d6bb8d'
const CLAY_TOP = '#e0c99f'
const CLAY_DARK = '#b89a6c'
const STRAW = '#d9c272'
const STRAW_DARK = '#b59d4f'
const SKIN = '#ecbc9c'
const SKIN_PINK = '#e59c8a'
const NAVY = '#1f2b4d'
const NAVY_LIGHT = '#33416b'
const HAIR = '#1d1b1e'
const POT = '#2b2a2c'
const BROTH = '#c98a3e'
const MEAT = '#8b4526'
const MEAT_DARK = '#6e3219'
const MEAT_IN = '#e7a08a'
const BONE = '#f2e9d6'
const STEAM = '#f4f1ec'
const LILAC = '#b9a3e3'
const WHITE = '#f6f3ec'
const INK = '#2a2526'
const MEAT_S = 1.1
const RED = '#e2322b' // acento saturado RESERVADO: o timer dos cinco minutos

const GY = 0.18 // topo do assoalho
const SUMO: [number, number, number] = [0, GY - 0.02, 0.35]
const SUMO_S = 1.32
const POT_P: [number, number, number] = [1.1, GY, 1.3]
const TIMER_P: [number, number, number] = [-1.15, GY, 1.15]

/** Traço do numeral: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number) {
  const s = rbox(w, h, 0.03, 0.008, INK, { roughness: 0.5 })
  s.position.set(x, y, 0)
  return s
}

/** Numeral 5 de traço grosso. */
function five() {
  const g = new THREE.Group()
  const t = 0.028
  g.add(stroke(0.088, t, 0.006, 0.07))
  g.add(stroke(t, 0.07, -0.034, 0.035))
  g.add(stroke(0.076, t, 0.0, 0.0))
  g.add(stroke(t, 0.07, 0.034, -0.035))
  g.add(stroke(0.076, t, 0.0, -0.07))
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(17)

  // ---- base: assoalho escuro do estábulo de sumô ---------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.82, 2.92, 0.12, '#2f2419', { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)
  const floor = cylinder(2.75, 2.82, 0.07, FLOOR, { roughness: 0.85 })
  floor.position.y = 0.145
  base.add(floor)
  for (const x of [-2.1, -1.4, -0.7, 0, 0.7, 1.4, 2.1]) {
    const len = 2 * Math.sqrt(Math.max(2.7 * 2.7 - x * x, 0.01))
    const line = rbox(0.045, 0.02, len, 0.008, FLOOR_LINE, { roughness: 0.9 })
    line.position.set(x, GY + 0.002, 0)
    base.add(line)
  }
  // sacos de sal e um balde de água: o canto do ringue
  const saltBag = puff(0.13, WHITE, 4, 9, { roughness: 0.9 })
  saltBag.position.set(2.1, GY + 0.08, 0.75)
  saltBag.scale.y = 0.7
  base.add(saltBag)
  const bucket = lathe(
    [[0, 0], [0.13, 0], [0.15, 0.2], [0.16, 0.22], [0.14, 0.22], [0.13, 0.03], [0, 0.03]],
    '#9a6b3c',
    { roughness: 0.7 },
  )
  bucket.position.set(-2.15, GY, 0.55)
  bucket.rotation.y = rand() * Math.PI
  for (const hy of [0.05, 0.16]) {
    const hoop = torus(0.145 + hy * 0.08, 0.012, '#4a4038', { roughness: 0.4, metalness: 0.7 })
    hoop.rotation.x = Math.PI / 2
    hoop.position.y = hy
    bucket.add(hoop)
  }
  base.add(bucket)
  root.add(base)

  // ---- dohyo: tablado quadrado de argila + círculo de palha ----------------
  const dohyo = new THREE.Group()
  const DH = 0.42
  const DZ = -1.2
  const block = rbox(2.8, DH, 2.2, 0.08, CLAY, { roughness: 0.92 })
  block.position.set(0, GY + DH / 2, DZ)
  dohyo.add(block)
  const top = rbox(2.68, 0.04, 2.08, 0.02, CLAY_TOP, { roughness: 0.95 })
  top.position.set(0, GY + DH, DZ)
  dohyo.add(top)
  // degraus de argila na frente
  for (const sx of [-0.85, 0.85]) {
    const stepB = rbox(0.42, 0.18, 0.22, 0.04, CLAY_DARK, { roughness: 0.92 })
    stepB.position.set(sx * 1.2, GY + 0.09, DZ + 1.18)
    dohyo.add(stepB)
  }
  // borda de palha em volta do topo
  const edge = torus(0.95, 0.06, STRAW, { roughness: 0.9 })
  edge.rotation.x = Math.PI / 2
  edge.position.set(0, GY + DH + 0.04, DZ)
  dohyo.add(edge)
  // trança: anéis finos em volta do toro
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2
    const knot = torus(0.065, 0.012, STRAW_DARK, { roughness: 0.9 })
    knot.position.set(Math.cos(a) * 0.95, GY + DH + 0.04, DZ + Math.sin(a) * 0.95)
    knot.rotation.y = -a
    dohyo.add(knot)
  }
  // linhas brancas de largada (shikiri-sen)
  for (const sx of [-0.14, 0.14]) {
    const lineW = rbox(0.06, 0.012, 0.2, 0.005, WHITE, { roughness: 0.8 })
    lineW.position.set(sx, GY + DH + 0.022, DZ)
    dohyo.add(lineW)
  }
  root.add(dohyo)

  // ---- lutador de sumô sentado ---------------------------------------------
  const sumo = new THREE.Group()
  sumo.position.set(...SUMO)
  sumo.scale.setScalar(SUMO_S)
  root.add(sumo)

  const corpo = person({ body: SKIN, skin: SKIN, height: 1.5, armAngle: 0.35 })
  corpo.position.y = -0.04
  sumo.add(corpo)

  // barrigão redondo
  const belly = sphere(0.36, SKIN, { roughness: 0.55 })
  belly.position.set(0, 0.3, 0.1)
  belly.scale.set(1.08, 0.95, 0.92)
  corpo.add(belly)
  for (const side of [-1, 1]) {
    const peito = sphere(0.14, SKIN, { roughness: 0.55 })
    peito.position.set(side * 0.13, 0.56, 0.17)
    peito.scale.set(1, 0.8, 0.6)
    corpo.add(peito)
  }
  const umbigo = sphere(0.022, SKIN_PINK, { roughness: 0.6 })
  umbigo.position.set(0, 0.36, 0.43)
  corpo.add(umbigo)

  // mawashi azul-marinho
  const faixa = lathe(
    [[0.33, -0.02], [0.39, 0.0], [0.41, 0.09], [0.41, 0.17], [0.37, 0.2]],
    NAVY,
    { roughness: 0.75 },
  )
  faixa.scale.set(1.0, 1, 1.0)
  faixa.position.set(0, 0.0, 0.08)
  corpo.add(faixa)
  const nó = rbox(0.2, 0.2, 0.06, 0.04, NAVY_LIGHT, { roughness: 0.75 })
  nó.position.set(0, 0.08, 0.5)
  corpo.add(nó)
  for (let i = 0; i < 5; i++) {
    const sagari = capsule(0.016, 0.1, NAVY_LIGHT, { roughness: 0.8 })
    sagari.position.set(-0.08 + i * 0.04, -0.03, 0.51)
    corpo.add(sagari)
  }

  // pernas abertas em V, pés de sola pra cima
  for (const side of [-1, 1]) {
    const perna = new THREE.Group()
    perna.position.set(side * 0.2, 0.1, 0.12)
    perna.rotation.y = side * 0.55
    sumo.add(perna)
    const coxa = capsule(0.15, 0.32, SKIN, { roughness: 0.55 })
    coxa.rotation.x = Math.PI / 2
    coxa.position.z = 0.22
    perna.add(coxa)
    const canela = capsule(0.11, 0.26, SKIN, { roughness: 0.55 })
    canela.rotation.x = Math.PI / 2
    canela.position.set(0, -0.02, 0.52)
    perna.add(canela)
    const pe = rbox(0.13, 0.22, 0.09, 0.045, SKIN, { roughness: 0.55 })
    pe.position.set(0, 0.04, 0.72)
    perna.add(pe)
  }

  // cabeça: olhos fechados, bochechas cheias, lábios apertados, coque
  const head = corpo.getObjectByName('head') as THREE.Group
  for (const o of [...head.children]) {
    if ((o as THREE.Mesh).isMesh && o !== head.children[0]) head.remove(o)
  }
  for (const side of [-1, 1]) {
    const palp = sphere(0.062, SKIN, { roughness: 0.6 })
    palp.scale.set(1, 0.75, 0.55)
    palp.position.set(side * 0.108, 0.034, 0.215)
    head.add(palp)
    const cilio = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 8, 16, Math.PI), mat(INK, { roughness: 0.5 }))
    cilio.position.set(side * 0.108, 0.03, 0.25)
    cilio.rotation.set(-0.2, 0, Math.PI)
    head.add(cilio)
    const bochecha = sphere(0.1, SKIN, { roughness: 0.55 })
    bochecha.position.set(side * 0.16, -0.1, 0.17)
    bochecha.scale.set(1, 0.9, 0.8)
    head.add(bochecha)
    const rubor = sphere(0.05, SKIN_PINK, { roughness: 0.6 })
    rubor.position.set(side * 0.19, -0.08, 0.235)
    rubor.scale.set(1, 0.7, 0.4)
    head.add(rubor)
    const sobrancelha = rbox(0.1, 0.022, 0.02, 0.01, HAIR, { roughness: 0.7 })
    sobrancelha.position.set(side * 0.11, 0.13, 0.25)
    sobrancelha.rotation.z = -side * 0.12
    head.add(sobrancelha)
  }
  // lábios apertados (o M do ÓMMM)
  const labios = capsule(0.022, 0.08, '#b5655a', { roughness: 0.45 })
  labios.rotation.z = Math.PI / 2
  labios.position.set(0, -0.13, 0.265)
  head.add(labios)
  // cabelo preso e coque (chonmage)
  const cabelo = sphere(0.29, HAIR, { roughness: 0.55 })
  cabelo.position.set(0, 0.05, -0.04)
  cabelo.scale.set(1.0, 0.95, 0.95)
  head.add(cabelo)
  // franja recortada: o cabelo só cobre a parte de cima e de trás
  const testa = sphere(0.283, SKIN, { roughness: 0.6 })
  testa.position.set(0, -0.02, 0.03)
  head.add(testa)
  const coque = capsule(0.05, 0.16, HAIR, { roughness: 0.55 })
  coque.rotation.x = Math.PI / 2 - 0.25
  coque.position.set(0, 0.32, 0.02)
  head.add(coque)
  const coqueBase = sphere(0.06, HAIR, { roughness: 0.55 })
  coqueBase.position.set(0, 0.3, -0.08)
  head.add(coqueBase)

  // braços: pivô no ombro
  const bracoR = corpo.getObjectByName('armR') as THREE.Mesh
  const bracoL = corpo.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  shoulderPivot(bracoL, 1.5)
  for (const arm of [bracoR, bracoL]) arm.scale.set(1.25, 1, 1.25)
  const R_FINAL: [number, number, number] = [-1.0, 0, 0.8]
  const L_FINAL: [number, number, number] = [-0.2, 0, -2.15]
  bracoR.rotation.set(...R_FINAL)
  bracoL.rotation.set(...L_FINAL)

  root.updateMatrixWorld(true)

  // ---- mão aberta com CINCO dedos (filha do braço esquerdo da tela) --------
  const luvaL = bracoL.children[0]
  luvaL.visible = false
  // invólucro desfaz a escala não uniforme do braço; a peça gira dentro dele
  const maoWrap = new THREE.Group()
  maoWrap.position.copy(luvaL.position)
  maoWrap.scale.set(1 / 1.25, 1, 1 / 1.25)
  bracoL.add(maoWrap)
  const mao = new THREE.Group()
  maoWrap.add(mao)
  {
    const palma = rbox(0.18, 0.17, 0.09, 0.04, SKIN, { roughness: 0.55 })
    palma.position.y = 0.04
    mao.add(palma)
    const dedos: [number, number, number][] = [
      // x, comprimento, ângulo
      [-0.062, 0.11, 0.38],
      [-0.022, 0.13, 0.12],
      [0.022, 0.135, -0.06],
      [0.062, 0.12, -0.28],
    ]
    for (const [dx, len, ang] of dedos) {
      const d = capsule(0.025, len, SKIN, { roughness: 0.55 })
      d.position.set(dx - Math.sin(ang) * (len / 2 + 0.01), 0.1 + Math.cos(ang) * (len / 2 + 0.01), 0)
      d.rotation.z = ang
      mao.add(d)
    }
    const polegar = capsule(0.026, 0.08, SKIN, { roughness: 0.55 })
    polegar.position.set(0.12, 0.02, 0.01)
    polegar.rotation.z = -1.05
    mao.add(polegar)
    // orientação no mundo: palma pra câmera, dedos pra cima
    const qW = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0.1, 0.15))
    const qA = bracoL.getWorldQuaternion(new THREE.Quaternion())
    mao.quaternion.copy(qA.invert().multiply(qW))
  }

  // ---- FÊMUR de carne de desenho animado (na mão direita da tela) ----------
  const luvaR = bracoR.children[0]
  const carneWrap = new THREE.Group()
  carneWrap.position.copy(luvaR.position)
  carneWrap.scale.set(1 / 1.25, 1, 1 / 1.25)
  bracoR.add(carneWrap)
  const carne = new THREE.Group()
  carneWrap.add(carne)
  {
    const osso = new THREE.Group()
    carne.add(osso)
    const cabo = capsule(0.045, 0.62, BONE, { roughness: 0.5 })
    cabo.position.y = 0.2
    osso.add(cabo)
    for (const oy of [-0.15, 0.56]) {
      for (const ox of [-1, 1]) {
        const knob = sphere(0.065, BONE, { roughness: 0.5 })
        knob.position.set(ox * 0.05, oy, 0)
        osso.add(knob)
      }
    }
    // a carne: gomo grande marrom em volta do meio do osso
    const pedaco = lathe(
      [[0.04, -0.02], [0.11, 0.0], [0.17, 0.05], [0.21, 0.13], [0.225, 0.22], [0.215, 0.3], [0.17, 0.37], [0.1, 0.42], [0.04, 0.43]],
      MEAT,
      { roughness: 0.6 },
    )
    pedaco.position.y = 0.04
    carne.add(pedaco)
    // tostado: manchas escuras da grelha
    for (const [ta, ty] of [[-0.3, 0.2], [0.5, 0.33], [1.6, 0.15], [-1.4, 0.28]] as const) {
      const tost = sphere(0.045, MEAT_DARK, { roughness: 0.6 })
      tost.position.set(Math.sin(ta) * 0.215, 0.04 + ty, Math.cos(ta) * 0.215)
      tost.scale.set(1.2, 0.5, 0.35)
      tost.rotation.y = ta
      carne.add(tost)
    }
    // quatro mordidas: carne rosada exposta com recorte de dentes, na face da câmera
    const bites: [number, number][] = [[0.0, 0.1], [0.75, 0.24], [-0.7, 0.3], [0.2, 0.36]]
    for (const [ang, by] of bites) {
      const mordida = new THREE.Group()
      mordida.position.set(Math.sin(ang) * 0.19, 0.04 + by, Math.cos(ang) * 0.19)
      mordida.rotation.y = ang
      carne.add(mordida)
      const miolo = sphere(0.07, MEAT_IN, { roughness: 0.7 })
      miolo.scale.set(1, 0.8, 0.35)
      mordida.add(miolo)
      for (let k = -1; k <= 1; k++) {
        const dente = sphere(0.03, MEAT_IN, { roughness: 0.7 })
        dente.position.set(k * 0.045, 0.045 - Math.abs(k) * 0.015, 0.0)
        dente.scale.z = 0.5
        mordida.add(dente)
      }
    }
    const qW = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, -0.1))
    const qA = bracoR.getWorldQuaternion(new THREE.Quaternion())
    carne.quaternion.copy(qA.invert().multiply(qW))
  }

  // ---- ondas de som lilás do ÓMMM ------------------------------------------
  const ondas = new THREE.Group()
  const boca = labios.getWorldPosition(new THREE.Vector3())
  ondas.position.set(boca.x, boca.y, boca.z + 0.4)
  root.add(ondas)
  for (let i = 0; i < 3; i++) {
    const r = 0.42 + i * 0.12
    const arc = Math.PI * 0.34
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.03, 10, 32, arc),
      mat(LILAC, { roughness: 0.4 }),
    )
    arco.castShadow = true
    arco.rotation.z = Math.PI - arc / 2 - 0.12
    ondas.add(arco)
  }

  // ---- panelão de chanko ---------------------------------------------------
  const panela = new THREE.Group()
  panela.position.set(...POT_P)
  root.add(panela)
  {
    const corpoP = lathe(
      [[0, 0], [0.26, 0], [0.32, 0.04], [0.35, 0.16], [0.34, 0.28], [0.36, 0.3], [0.33, 0.31], [0.31, 0.27], [0, 0.27]],
      POT,
      { roughness: 0.4, metalness: 0.5 },
    )
    panela.add(corpoP)
    for (const s of [-1, 1]) {
      const alca = torus(0.06, 0.018, POT, { roughness: 0.4, metalness: 0.5 })
      alca.position.set(s * 0.37, 0.24, 0)
      alca.rotation.y = Math.PI / 2
      panela.add(alca)
    }
    const caldo = cylinder(0.31, 0.31, 0.02, BROTH, { roughness: 0.3 })
    caldo.position.y = 0.275
    panela.add(caldo)
    const legumes: [number, number, string, 'c' | 's' | 'b'][] = [
      [0.12, 0.1, '#e57c2a', 'c'], [-0.1, 0.14, '#e57c2a', 'c'], [0.0, -0.15, '#4f8a3c', 's'],
      [-0.17, -0.04, '#f2ead8', 'b'], [0.17, -0.1, '#f2ead8', 'b'], [-0.05, 0.02, '#4f8a3c', 's'],
      [0.07, -0.03, '#a4643c', 's'],
    ]
    for (const [lx, lz, color, kind] of legumes) {
      const piece =
        kind === 'c'
          ? cylinder(0.055, 0.055, 0.025, color, { roughness: 0.5 })
          : kind === 'b'
            ? rbox(0.08, 0.06, 0.08, 0.015, color, { roughness: 0.6 })
            : sphere(0.06, color, { roughness: 0.7 })
      piece.position.set(lx, 0.295, lz)
      if (kind === 's') piece.scale.y = 0.5
      piece.rotation.y = rand() * Math.PI
      panela.add(piece)
    }
  }

  // ---- três fios de vapor --------------------------------------------------
  const vapor = new THREE.Group()
  vapor.position.set(POT_P[0], POT_P[1] + 0.32, POT_P[2])
  root.add(vapor)
  // fios de vapor em S: meias-voltas de toro alternando o lado
  const steamMat = mat(STEAM, { roughness: 0.9 })
  for (let i = 0; i < 3; i++) {
    const fio = new THREE.Group()
    fio.position.set(-0.15 + i * 0.15, 0.02 + (i % 2) * 0.07, (i % 2) * 0.05)
    for (let k = 0; k < 3; k++) {
      const r = 0.055 - k * 0.006
      const curva = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022 - k * 0.003, 8, 20, Math.PI), steamMat)
      const lado = (k + i) % 2 ? 1 : -1
      curva.position.set(0, 0.06 + k * 0.105, 0)
      curva.rotation.z = lado > 0 ? -Math.PI / 2 : Math.PI / 2
      fio.add(curva)
    }
    vapor.add(fio)
  }

  // ---- timer de cozinha vermelho com o ponteiro no 5 -----------------------
  const timer = new THREE.Group()
  timer.position.set(...TIMER_P)
  timer.rotation.y = 0.2
  root.add(timer)
  {
    const pe = cylinder(0.16, 0.18, 0.05, '#b8241f', { roughness: 0.4 })
    pe.position.y = 0.025
    timer.add(pe)
    const corpoT = sphere(0.24, RED, { roughness: 0.3 })
    corpoT.position.y = 0.27
    corpoT.scale.set(1, 1, 0.68)
    timer.add(corpoT)
    const botao = cylinder(0.04, 0.05, 0.06, '#b8241f', { roughness: 0.35 })
    botao.position.y = 0.52
    timer.add(botao)
    // mostrador inclinado pra câmera
    const face = new THREE.Group()
    face.position.set(0, 0.28, 0.17)
    face.rotation.x = -0.25
    timer.add(face)
    const disco = cylinder(0.19, 0.19, 0.03, WHITE, { roughness: 0.35 })
    disco.rotation.x = Math.PI / 2
    face.add(disco)
    const aro = torus(0.19, 0.015, '#f2d6d2', { roughness: 0.3 })
    aro.position.z = 0.012
    face.add(aro)
    for (let i = 0; i < 12; i++) {
      if (i === 6) continue // o 5 ocupa a metade de baixo
      const a = (i / 12) * Math.PI * 2
      const tick = rbox(0.012, i % 3 === 0 ? 0.04 : 0.025, 0.01, 0.004, INK)
      tick.position.set(Math.sin(a) * 0.16, Math.cos(a) * 0.16, 0.02)
      tick.rotation.z = -a
      face.add(tick)
    }
    const numeral = five()
    numeral.position.set(0, -0.088, 0.018)
    numeral.scale.setScalar(0.72)
    face.add(numeral)
    // ponteiro no 5 (de 60): 30° à direita do topo
    const ponteiro = rbox(0.022, 0.12, 0.012, 0.006, RED, { roughness: 0.3 })
    const pa = (5 / 60) * Math.PI * 2
    ponteiro.position.set(Math.sin(pa) * 0.06, 0.035 + Math.cos(pa) * 0.06, 0.026)
    ponteiro.rotation.z = -pa
    face.add(ponteiro)
    const centro = cylinder(0.018, 0.018, 0.02, INK, { roughness: 0.3 })
    centro.rotation.x = Math.PI / 2
    centro.position.set(0, 0.035, 0.028)
    face.add(centro)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'estabulo', object: base },
    { name: 'dohyo', group: 'estabulo', object: dohyo },
    { name: 'sumo', group: 'lutador', object: sumo },
    { name: 'panela', group: 'chanko', object: panela },
    { name: 'vapor', group: 'chanko', object: vapor },
    { name: 'bracoR', group: 'comer', object: bracoR },
    { name: 'carne', group: 'comer', object: carne },
    { name: 'ondas', group: 'om', object: ondas },
    { name: 'cabeca', group: 'om', object: head },
    { name: 'timer', group: 'minutos', object: timer },
    { name: 'bracoL', group: 'minutos', object: bracoL },
    { name: 'mao', group: 'minutos', object: mao },
  ]

  const grow = (from = 0.01, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No estábulo de sumô sobe o tablado de argila, com o círculo de palha trançada…',
    }),
    seq('dohyo-rise', 'dohyo', 0.25, 0.9, [riseFrom(0, 1.2)], { ease: 'easeOut' }),

    seq('sumo-rise', 'sumo', 1.7, 0.9, [riseFrom(SUMO[1], 2.2)], {
      ease: 'easeOut',
      caption: '…chamam o lutador pela terceira vez, mas ele está sentado no chão diante do chanko.',
    }),
    seq('bracoL-desce', 'bracoL', 1.7, 0.6, [ch('rotation.z', 0.35, 0.35), ch('rotation.x', 0, 0)]),
    seq('bracoR-desce', 'bracoR', 1.7, 0.6, [ch('rotation.x', 0, 0), ch('rotation.z', -0.35, -0.35)]),
    seq('cabeca-assenta', 'cabeca', 1.7, 0.6, [ch('rotation.z', 0, 0)]),
    seq('mao-fechada', 'mao', 1.7, 0.6, grow(0.6, 0.6)),
    seq('panela-rise', 'panela', 2.3, 0.7, [riseFrom(POT_P[1], 0.9)], { ease: 'easeOut' }),
    seq('vapor-grow', 'vapor', 2.8, 0.8, [...grow(), riseFrom(POT_P[1] + 0.32, 0.4)], { ease: 'easeOut' }),

    seq('carne-grow', 'carne', 3.9, 0.6, grow(0.01, MEAT_S), {
      ease: 'easeOut',
      caption: 'Ergue um FÊMUR de carne do tamanho de um braço e anuncia de boca cheia: IÁ, CÓ-MER!',
    }),
    seq('bracoR-ergue', 'bracoR', 3.9, 0.7, [ch('rotation.x', 0, R_FINAL[0]), ch('rotation.z', -0.35, R_FINAL[2])], {
      ease: 'easeOut',
    }),

    seq('ondas-grow', 'ondas', 5.9, 0.8, grow(0.01, 1), {
      ease: 'easeOut',
      caption: 'Fecha os olhos, aperta os lábios e entoa o mantra da digestão: ÓMMM…',
    }),
    seq('cabeca-balanca', 'cabeca', 5.9, 0.6, [ch('rotation.z', 0, 0.12)], { ease: 'easeInOut' }),
    seq('cabeca-volta', 'cabeca', 6.5, 0.6, [ch('rotation.z', 0.12, 0)], {
      ease: 'easeInOut',
    }),

    // a mordida: leva o osso à boca e volta
    seq('bracoR-morde', 'bracoR', 7.6, 0.4, [ch('rotation.x', R_FINAL[0], R_FINAL[0] - 0.25), ch('rotation.z', R_FINAL[2], R_FINAL[2] - 0.3)], {
      ease: 'easeOut',
      caption: '…e crava os dentes no FÊ…MUR.',
    }),
    seq('bracoR-solta', 'bracoR', 8.1, 0.45, [ch('rotation.x', R_FINAL[0] - 0.25, R_FINAL[0]), ch('rotation.z', R_FINAL[2] - 0.3, R_FINAL[2])], {
      ease: 'easeInOut',
    }),

    seq('timer-rise', 'timer', 9.2, 0.6, [riseFrom(TIMER_P[1], 0.8)], {
      ease: 'easeOut',
      caption: 'Com a outra mão gira o timer pros cinco MINUTOS e mostra cinco dedos ao tablado: MI-NÜÜ-TER!',
    }),
    seq('timer-gira', 'timer', 9.8, 0.6, [ch('rotation.y', 0.2 - Math.PI * 2, 0.2)], { ease: 'easeOut' }),
    seq('bracoL-ergue', 'bracoL', 9.9, 0.7, [ch('rotation.x', 0, L_FINAL[0]), ch('rotation.z', 0.35, L_FINAL[2])], {
      ease: 'easeOut',
    }),
    seq('mao-abre', 'mao', 10.3, 0.4, grow(0.6, 1), { ease: 'easeOut' }),

    seq('vapor-sobe', 'vapor', 11.6, 0.6, [riseFrom(POT_P[1] + 0.32, 0.08)], {
      ease: 'easeOut',
      caption: 'Jag kommer om fem minuter. — Chego em cinco minutos.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0, 2.4, 4.7], target: [0, 1.0, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-kommer-om-fem-minuter',
    contexto: 'Por SMS ou telefone pra quem está esperando, ou gritando de dentro de casa.',
    fraseFonte: 'Chego em cinco minutos.',
    fraseAlvo: 'Jag kommer om fem minuter.',
    pronuncia:
      "iá KÓ-mer om FÉM mi-NÜÜ-ter ('kommer' com Ó aberto e força no KÓ; 'om' = ÓM curto e oral; 'fem' com É aberto; 'minuter' com u de bico, longo, e força no NÜ)",
    ponteSonora:
      "IÁ, CÓ-MER... ÓMMM... FÉM(ur)... MI-NÜÜ-TER! (8 sílabas: iá-KÓ-mer-om-FÉM-mi-NÜÜ-ter; tônicas em CÓ, FÉM e NÜÜ; IÁ = 'jag', I de ioga; CÓ-MER = o COMER de 'Hur kommer jag till...?' e 'Jag kommer från Brasilien' — força no CÓ, Ó ABERTO, -mer fraquinho com R brando, nunca 'co-MÊR'; ÓM = o mantra OM da meditação, só que curtinho: Ó ABERTO igual ao CÓ de 'comer', e os LÁBIOS FECHAM no M — o zumbido de boca fechada já deixa a boca pronta pro F de 'fem'; nunca o 'ũ' nasal de 'um', que troca a vogal e engole o M; FÉM = o FÊMUR do pirata de 'Jag har två barn' cortado no M — É bem aberto, lábios fechados, sem nasalar; MI-NÜÜ-TER = MINUTO trocando o -to por -TER (a tônica já cai no mesmo lugar): força no NÜÜ, U de BICO e longo, T duro, nunca 'tcher', R brando no fim)",
    historia:
      'O tablado de argila está pronto e chamam o lutador de sumô pela terceira vez — mas ele está sentado no chão diante de um panelão de chanko, com um FÊMUR de carne de desenho animado do tamanho de um braço na mão. Anuncia de boca cheia: IÁ, CÓ-MER! Antes da quinta mordida fecha os olhos, aperta os lábios e entoa o mantra da digestão: ÓMMM... — e crava os dentes no FÊ...MUR. Com a outra mão gira o timer de cozinha pros cinco MINUTOS e estica os cinco dedos abertos pro tablado: MI-NÜÜ-TER. Já vou — daqui a cinco minutos.',
  },
  createScene,
}

export default card
