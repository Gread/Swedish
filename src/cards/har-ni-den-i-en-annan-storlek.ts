import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Har ni den i en annan storlek?" — RRÁR-NI DÊ-NI EN... ÁN-NAN! STÚUR-LÊK?
 *
 * Um BÚFALO marrom-escuro sai do provador de pé, bufando RRÁR!, com os braços
 * roxos de tanto se espremer e uma bisnaga de ÁRNIca na pata (RRÁR-NI). No
 * chifre, a culpada: uma jaqueta de DENIM infantil com a costura estourada
 * (DÊ-NI). Ele balança a cabeçorra — ÁN-NAN!, essa não, OUTRA — e se abana com
 * um LEQUE vermelho gigante escrito STOR (STÚUR-LÊK).
 *
 * Acento saturado reservado ao LEQUE (vermelho vivo); a cortina do provador é
 * vinho apagado para não competir.
 */

const PISO = '#d6b88d'
const PISO_LINHA = '#bf9e72'
const PAREDE = '#e9e1d4'
const VINHO = '#7e3440'
const VINHO_ESC = '#622832'
const CROMO = '#c9ced4'
const OURO = '#c9a24a'
const ESPELHO = '#aebfcc'
const BUF = '#4b3122'
const BUF_ESC = '#33211a'
const BUF_CLARO = '#5e3f2b'
const FOCINHO = '#262021'
const CHIFRE = '#e4d6b4'
const CHIFRE_ESC = '#b9a57c'
const CASCO = '#2a2220'
const DENIM = '#4f78ad'
const DENIM_ESC = '#3d6091'
const COSTURA = '#e6a24a'
const ROXO = '#8f5cbf'
const ROXO_ESC = '#5f3584'
const ARNICA = '#e8c34a'
const TAMPA = '#3f8f4e'
const LEQUE = '#e3262e' // acento saturado: o LEQUE STOR
const LEQUE_ESC = '#c21c25'
const VARETA = '#5a3a22'
const LETRA = '#fff4e2'
const SUOR = '#4fb0e8'

const FY = 0.14 // topo do piso
const HEAD: [number, number, number] = [0, 2.05, 0.36]
const SHOULDER_L: [number, number, number] = [-0.56, 1.72, 0.12]
const SHOULDER_R: [number, number, number] = [0.56, 1.72, 0.12]
const FAN_Z = 0.38 // inclinação final do leque (encosta no focinho)

const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula de a até b (membros, chifres, dobras): orienta pelo vetor. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = { roughness: 0.88 }) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.clone().normalize())
  return m
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.028, 0.008, LETRA, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** S T O R — letras de traço grosso, ~0.19 de altura. */
function letter(which: 'S' | 'T' | 'O' | 'R') {
  const g = new THREE.Group()
  const t = 0.04
  const h = 0.19
  const w = 0.12
  if (which === 'S') {
    g.add(stroke(w, t, 0, h / 2 - t / 2))
    g.add(stroke(w, t, 0, 0))
    g.add(stroke(w, t, 0, -h / 2 + t / 2))
    g.add(stroke(t, h / 2, -w / 2 + t / 2, h / 4))
    g.add(stroke(t, h / 2, w / 2 - t / 2, -h / 4))
  } else if (which === 'T') {
    g.add(stroke(w + 0.02, t, 0, h / 2 - t / 2))
    g.add(stroke(t, h, 0, 0))
  } else if (which === 'O') {
    g.add(stroke(w, t, 0, h / 2 - t / 2))
    g.add(stroke(w, t, 0, -h / 2 + t / 2))
    g.add(stroke(t, h, -w / 2 + t / 2, 0))
    g.add(stroke(t, h, w / 2 - t / 2, 0))
  } else {
    g.add(stroke(t, h, -w / 2 + t / 2, 0))
    g.add(stroke(w - 0.01, t, -0.005, h / 2 - t / 2))
    g.add(stroke(w - 0.01, t, -0.005, 0.005))
    g.add(stroke(t, h / 2, w / 2 - t / 2, h / 4))
    g.add(stroke(t, 0.11, 0.022, -0.05, 0.55))
  }
  return g
}

/** Gomo do leque: coroa circular entre r0 e r1, de a0 a a1 (rad), com espessura. */
function pleat(r0: number, r1: number, a0: number, a1: number, color: string) {
  const s = new THREE.Shape()
  s.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0)
  s.absarc(0, 0, r1, a0, a1, false)
  s.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0)
  s.absarc(0, 0, r0, a1, a0, true)
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: false, curveSegments: 6 })
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.6, size: r1 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(47)

  // ---- loja: piso de madeira clara -----------------------------------------
  const base = new THREE.Group()

  const soco = cylinder(2.62, 2.7, 0.09, '#8f7558', { roughness: 0.8 })
  soco.position.y = 0.045
  base.add(soco)

  const piso = cylinder(2.56, 2.6, 0.05, PISO, { roughness: 0.6 })
  piso.position.y = FY - 0.025
  base.add(piso)

  for (let i = -3; i <= 3; i++) {
    const x = i * 0.7 + 0.35
    if (Math.abs(x) > 2.45) continue
    const len = 2 * Math.sqrt(2.5 * 2.5 - x * x)
    const fresta = rbox(0.02, 0.01, len, 0.004, PISO_LINHA, { roughness: 0.7 })
    fresta.position.set(x, FY + 0.004, 0)
    base.add(fresta)
  }

  // tapete redondo cinza-azulado diante do provador
  const tapete = cylinder(1.05, 1.08, 0.025, '#8e9aa6', { roughness: 0.92 })
  tapete.position.set(-0.1, FY + 0.012, 0.15)
  base.add(tapete)

  // banquinho com roupa dobrada (adereço de loja)
  const banco = new THREE.Group()
  banco.position.set(1.85, FY, 0.95)
  banco.rotation.y = -0.4 + rand() * 0.2
  const assento = cylinder(0.24, 0.24, 0.06, '#7a5a3c', { roughness: 0.6 })
  assento.position.y = 0.4
  banco.add(assento)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2
    const perna = cylinder(0.022, 0.026, 0.38, '#5f4530', { roughness: 0.6 })
    perna.position.set(Math.cos(a) * 0.15, 0.19, Math.sin(a) * 0.15)
    banco.add(perna)
  }
  for (const [cor, y] of [['#c9a8a0', 0.46], ['#8fa38c', 0.52]] as const) {
    const dobrada = rbox(0.3, 0.06, 0.24, 0.02, cor, { roughness: 0.9 })
    dobrada.position.y = y
    dobrada.rotation.y = rand() * 0.3
    banco.add(dobrada)
  }
  base.add(banco)

  root.add(base)

  // ---- provador: parede, trilho cromado, cortina vinho bem aberta ------------
  const provador = new THREE.Group()
  provador.position.set(-0.25, FY, -1.35)

  const fundo = rbox(2.3, 2.75, 0.12, 0.04, PAREDE, { roughness: 0.85 })
  fundo.position.set(0, 1.375, -0.12)
  provador.add(fundo)

  const rodape = rbox(2.32, 0.1, 0.16, 0.02, '#bfb4a2', { roughness: 0.7 })
  rodape.position.set(0, 0.05, -0.1)
  provador.add(rodape)

  const trilho = cylinder(0.03, 0.03, 2.3, CROMO, { roughness: 0.2, metalness: 0.9 })
  trilho.rotation.z = Math.PI / 2
  trilho.position.set(0, 2.62, 0.18)
  provador.add(trilho)
  for (const sx of [-1, 1]) {
    const suporte = cylinder(0.02, 0.02, 0.32, CROMO, { roughness: 0.2, metalness: 0.9 })
    suporte.rotation.x = Math.PI / 2
    suporte.position.set(sx * 1.05, 2.62, 0.04)
    provador.add(suporte)
  }

  // cortina franzida em dois maços: dobras verticais alternando tom
  for (const [cx, n] of [[-0.88, 5], [0.92, 4]] as const) {
    for (let k = 0; k < n; k++) {
      const x = cx + (k - (n - 1) / 2) * 0.1
      const dobra = capsule(0.07, 2.36, k % 2 ? VINHO_ESC : VINHO, { roughness: 0.9 })
      dobra.position.set(x, 1.38, 0.18 + (k % 2) * 0.04)
      provador.add(dobra)
    }
    for (let k = 0; k < n; k++) {
      const argola = torus(0.04, 0.01, CROMO, { roughness: 0.2, metalness: 0.9 })
      argola.position.set(cx + (k - (n - 1) / 2) * 0.1, 2.62, 0.18)
      argola.rotation.y = Math.PI / 2
      provador.add(argola)
    }
  }

  // gancho com cabide vazio na parede do provador
  const gancho = cylinder(0.018, 0.018, 0.12, CROMO, { roughness: 0.2, metalness: 0.9 })
  gancho.rotation.x = Math.PI / 2
  gancho.position.set(0.45, 2.15, -0.02)
  provador.add(gancho)


  // ---- espelho alto de moldura dourada --------------------------------------
  const espelho = new THREE.Group()
  espelho.position.set(1.85, FY, -0.85)
  espelho.rotation.y = -0.55

  const moldura = rbox(0.86, 2.2, 0.08, 0.04, OURO, { roughness: 0.35, metalness: 0.7 })
  moldura.position.y = 1.2
  espelho.add(moldura)
  const vidro = rbox(0.7, 2.02, 0.02, 0.01, ESPELHO, { roughness: 0.08, metalness: 0.85 })
  vidro.position.set(0, 1.2, 0.045)
  espelho.add(vidro)
  const reflexo = rbox(0.08, 1.4, 0.005, 0.003, '#e3edf3', { roughness: 0.1, metalness: 0.5 })
  reflexo.position.set(-0.18, 1.35, 0.058)
  reflexo.rotation.z = 0.25
  espelho.add(reflexo)
  const crista = sphere(0.09, OURO, { roughness: 0.35, metalness: 0.7 })
  crista.position.y = 2.32
  crista.scale.set(1.6, 1, 0.6)
  espelho.add(crista)
  for (const sx of [-1, 1]) {
    const pe = rbox(0.1, 0.12, 0.42, 0.03, OURO, { roughness: 0.35, metalness: 0.7 })
    pe.position.set(sx * 0.34, 0.06, -0.08)
    espelho.add(pe)
  }

  // provador + espelho sobem juntos: o cenário da loja
  const cenario = new THREE.Group()
  cenario.add(provador, espelho)
  root.add(cenario)

  // ---- BÚFALO de pé ---------------------------------------------------------
  const bufalo = new THREE.Group()
  bufalo.position.set(0, FY, 0.05)
  root.add(bufalo)

  const quadril = sphere(0.5, BUF, { roughness: 0.88 })
  quadril.scale.set(1.08, 0.85, 0.95)
  quadril.position.set(0, 0.72, -0.05)
  bufalo.add(quadril)

  const pancaBase = sphere(0.62, BUF_CLARO, { roughness: 0.88 })
  pancaBase.scale.set(1.04, 0.96, 0.95)
  pancaBase.position.set(0, 1.02, 0.14)
  bufalo.add(pancaBase)

  const peito = sphere(0.54, BUF, { roughness: 0.88 })
  peito.scale.set(1.12, 0.9, 0.9)
  peito.position.set(0, 1.58, 0.06)
  bufalo.add(peito)

  // corcova alta atrás dos ombros
  const corcova = sphere(0.52, BUF_ESC, { roughness: 0.9 })
  corcova.scale.set(1.15, 0.95, 0.95)
  corcova.position.set(0, 1.98, -0.28)
  bufalo.add(corcova)

  // juba desgrenhada no peito e nos ombros
  const juba = puff(0.3, BUF_ESC, 7, 12, { roughness: 0.92 })
  juba.position.set(0, 1.72, 0.32)
  juba.scale.set(1.5, 0.8, 0.75)
  bufalo.add(juba)

  const umbigo = sphere(0.04, BUF_ESC, { roughness: 0.9 })
  umbigo.position.set(0, 0.9, 0.72)
  bufalo.add(umbigo)

  for (const side of [-1, 1]) {
    bufalo.add(limb(v(side * 0.3, 0.74, 0.02), v(side * 0.34, 0.36, 0.12), 0.22, BUF))
    bufalo.add(limb(v(side * 0.34, 0.36, 0.12), v(side * 0.35, 0.14, 0.14), 0.16, BUF_ESC))
    // casco fendido
    for (const t of [-1, 1]) {
      const casco = cylinder(0.075, 0.09, 0.12, CASCO, { roughness: 0.45 })
      casco.position.set(side * 0.35 + t * 0.07, 0.06, 0.2)
      casco.scale.set(1, 1, 1.25)
      bufalo.add(casco)
    }
  }

  // ---- cabeça larga, focinho preto, cara de bufo -----------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(...HEAD)
  bufalo.add(cabeca)

  const cranio = sphere(0.36, BUF, { roughness: 0.88 })
  cranio.scale.set(1.22, 1.0, 1.0)
  cabeca.add(cranio)

  const topete = puff(0.2, BUF_ESC, 6, 77, { roughness: 0.92 })
  topete.position.set(0, 0.26, 0.1)
  topete.scale.set(1.4, 0.75, 0.9)
  cabeca.add(topete)

  const focinho = sphere(0.26, FOCINHO, { roughness: 0.55 })
  focinho.scale.set(1.12, 0.82, 0.95)
  focinho.position.set(0, -0.18, 0.3)
  cabeca.add(focinho)

  const barbicha = puff(0.14, BUF_ESC, 5, 81, { roughness: 0.92 })
  barbicha.position.set(0, -0.42, 0.16)
  barbicha.scale.set(1.0, 1.2, 0.8)
  cabeca.add(barbicha)

  for (const side of [-1, 1]) {
    // narinas dilatadas (bufando)
    const narina = sphere(0.055, '#0f0b0c', { roughness: 0.6 })
    narina.scale.set(1.1, 0.8, 0.5)
    narina.position.set(side * 0.1, -0.13, 0.54)
    cabeca.add(narina)

    const esclera = sphere(0.085, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.21, 0.06, 0.29)
    esclera.scale.z = 0.6
    const pupila = sphere(0.042, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.2, 0.05, 0.34)
    cabeca.add(esclera, pupila)

    // sobrancelha franzida
    const sobrancelha = capsule(0.03, 0.14, BUF_ESC, { roughness: 0.9 })
    sobrancelha.position.set(side * 0.2, 0.16, 0.31)
    sobrancelha.rotation.set(0, 0, Math.PI / 2 + side * 0.4)
    cabeca.add(sobrancelha)

    const orelha = capsule(0.06, 0.12, BUF_CLARO, { roughness: 0.9 })
    orelha.position.set(side * 0.47, -0.04, -0.02)
    orelha.rotation.z = Math.PI / 2 + side * 0.3
    orelha.scale.set(1, 1, 0.6)
    cabeca.add(orelha)
  }

  // ---- chifres bege curvados para os lados (filhos da cabeça) ---------------
  const chifres = new THREE.Group()
  cabeca.add(chifres)
  for (const side of [-1, 1]) {
    // curva suave amostrada em gomos curtos que afinam: sem "linguiça"
    const curva = new THREE.CatmullRomCurve3([
      v(0.3, 0.16, 0), v(0.55, 0.15, 0.03), v(0.76, 0.22, 0.06), v(0.86, 0.36, 0.06), v(0.88, 0.5, 0.05),
    ])
    const K = 10
    for (let k = 0; k < K; k++) {
      const a0 = curva.getPoint(k / K)
      const a1 = curva.getPoint((k + 1) / K)
      a0.x *= side
      a1.x *= side
      const r = 0.085 - (0.055 * k) / (K - 1)
      chifres.add(limb(a0, a1, r, k < 3 ? CHIFRE_ESC : CHIFRE, { roughness: 0.45 }))
    }
    const tip = curva.getPoint(1)
    const ponta = cone(0.03, 0.08, CHIFRE, { roughness: 0.4 })
    ponta.position.set(side * tip.x, tip.y + 0.03, tip.z)
    chifres.add(ponta)
    const base = sphere(0.1, CHIFRE_ESC, { roughness: 0.5 })
    base.position.set(side * 0.3, 0.16, 0)
    chifres.add(base)
  }

  // ---- jaqueta jeans minúscula pendurada no chifre esquerdo -----------------
  const JAQ: [number, number, number] = [-0.76, 0.2, 0.08]
  const jaqueta = new THREE.Group()
  jaqueta.position.set(...JAQ)
  jaqueta.scale.setScalar(1.25)
  cabeca.add(jaqueta)

  // alça da gola enganchada no chifre
  const alca = torus(0.035, 0.009, DENIM_ESC, { roughness: 0.85 })
  alca.position.set(0, -0.02, -0.01)
  jaqueta.add(alca)
  const gola = rbox(0.24, 0.05, 0.07, 0.02, DENIM_ESC, { roughness: 0.85 })
  gola.position.set(0, -0.06, 0)
  jaqueta.add(gola)
  const corpoJaq = rbox(0.3, 0.3, 0.06, 0.03, DENIM, { roughness: 0.85 })
  corpoJaq.position.set(0, -0.23, 0)
  jaqueta.add(corpoJaq)
  // rasgo: fenda escura irregular com fiapos brancos
  const rasgo = rbox(0.035, 0.16, 0.065, 0.012, '#1e2a3c', { roughness: 0.9 })
  rasgo.position.set(0.06, -0.22, 0.002)
  rasgo.rotation.z = 0.25
  jaqueta.add(rasgo)
  for (const [fx, fy, fr] of [[0.035, -0.17, 1.0], [0.085, -0.25, -0.9], [0.03, -0.28, 1.3]] as const) {
    const fiapo = rbox(0.05, 0.008, 0.01, 0.003, '#f2f2ee', { roughness: 0.8 })
    fiapo.position.set(fx, fy, 0.036)
    fiapo.rotation.z = fr
    jaqueta.add(fiapo)
  }
  // costuras laranja e botões
  const costura = rbox(0.28, 0.008, 0.008, 0.003, COSTURA, { roughness: 0.6 })
  costura.position.set(0, -0.15, 0.032)
  jaqueta.add(costura)
  for (const by of [-0.17, -0.26, -0.34]) {
    const botao = cylinder(0.014, 0.014, 0.01, '#c8a056', { roughness: 0.3, metalness: 0.7 })
    botao.rotation.x = Math.PI / 2
    botao.position.set(-0.03, by, 0.033)
    jaqueta.add(botao)
  }
  const bolso = rbox(0.08, 0.06, 0.01, 0.006, DENIM_ESC, { roughness: 0.85 })
  bolso.position.set(-0.08, -0.19, 0.032)
  jaqueta.add(bolso)
  for (const side of [-1, 1]) {
    const manga = limb(v(side * 0.15, -0.11, 0), v(side * 0.2, -0.46, 0.01), 0.045, DENIM, { roughness: 0.85 })
    jaqueta.add(manga)
    const punho = cylinder(0.05, 0.05, 0.035, DENIM_ESC, { roughness: 0.85 })
    punho.position.set(side * 0.203, -0.5, 0.01)
    punho.rotation.z = side * 0.14
    jaqueta.add(punho)
    // lapela pontuda da gola
    const lapela = rbox(0.06, 0.1, 0.012, 0.01, DENIM_ESC, { roughness: 0.85 })
    lapela.position.set(side * 0.05, -0.11, 0.036)
    lapela.rotation.z = side * 0.55
    jaqueta.add(punho)
  }

  // ---- braço esquerdo: bisnaga de arnica na pata ---------------------------
  const bracoE = new THREE.Group()
  bracoE.position.set(...SHOULDER_L)
  bufalo.add(bracoE)
  const eL = v(-0.2, -0.45, 0.22)
  const hL = v(0.18, -0.48, 0.6)
  bracoE.add(sphere(0.22, BUF, { roughness: 0.88 }))
  bracoE.add(limb(v(0, 0, 0), eL, 0.18, BUF))
  bracoE.add(limb(eL, hL, 0.155, BUF))
  const pataE = sphere(0.15, CASCO, { roughness: 0.5 })
  pataE.position.copy(hL).add(v(0.05, 0, 0.05))
  pataE.scale.set(1.1, 0.9, 1)
  bracoE.add(pataE)

  // ---- braço direito: ergue o leque junto ao focinho -----------------------
  const bracoD = new THREE.Group()
  bracoD.position.set(...SHOULDER_R)
  bufalo.add(bracoD)
  const eR = v(0.5, -0.32, 0.14)
  const hR = v(0.55, 0.02, 0.5)
  bracoD.add(sphere(0.22, BUF, { roughness: 0.88 }))
  bracoD.add(limb(v(0, 0, 0), eR, 0.18, BUF))
  bracoD.add(limb(eR, hR, 0.155, BUF))
  const pataD = sphere(0.15, CASCO, { roughness: 0.5 })
  pataD.position.copy(hR).add(v(0, 0.04, 0.03))
  pataD.scale.set(1, 1.1, 1)
  bracoD.add(pataD)

  // ---- manchas roxas lambuzadas de arnica (sub-peças dos braços) ------------
  function bruises(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, r1: number, r2: number) {
    const g = new THREE.Group()
    const spots: [THREE.Vector3, THREE.Vector3, number, number][] = [
      [a, b, 0.45, 0.11],
      [b, c, 0.5, 0.09],
    ]
    spots.forEach(([p, q, t, r], i) => {
      const at = p.clone().lerp(q, t)
      const dir = q.clone().sub(p).normalize()
      // normal: componente "para a câmera" perpendicular ao osso
      const n = v(0, 0.25, 1).sub(dir.clone().multiplyScalar(dir.dot(v(0, 0.25, 1)))).normalize()
      const rr = i === 0 ? r1 : r2
      const side = v(0, 0, 0).crossVectors(dir, n).normalize()
      // hematoma: três manchas achatadas que se moldam ao braço (bordas
      // enterradas na pele), do roxo escuro ao lilás
      const blot = (dr: number, ds: number, rad: number, cor: string, lift: number) => {
        const m = sphere(rad, cor, { roughness: 0.6 })
        m.quaternion.setFromUnitVectors(UP, n)
        m.scale.y = 0.22
        m.position.copy(at).addScaledVector(n, rr - 0.012 + lift).addScaledVector(dir, dr).addScaledVector(side, ds)
        g.add(m)
      }
      blot(0, 0, r, ROXO_ESC, 0)
      blot(r * 0.35, -r * 0.55, r * 0.7, ROXO_ESC, -0.004)
      blot(-r * 0.1, r * 0.1, r * 0.62, ROXO, 0.006)
      blot(-r * 0.25, r * 0.3, r * 0.3, '#b48ad6', 0.01)
      // pomada de arnica lambuzada por cima, brilhante
      blot(-r * 0.6, -r * 0.35, r * 0.42, '#f1e3a2', 0.012)
      blot(-r * 0.85, -r * 0.05, r * 0.25, '#f1e3a2', 0.012)
    })
    return g
  }
  const manchasE = bruises(v(0, 0, 0), eL, hL, 0.18, 0.155)
  bracoE.add(manchasE)
  const manchasD = bruises(v(0, 0, 0), eR, hR, 0.18, 0.155)
  bracoD.add(manchasD)

  // ---- bisnaga de arnica amarela, tampa verde -------------------------------
  const arnica = new THREE.Group()
  arnica.position.copy(hL).add(v(0.02, 0.1, 0.12))
  arnica.rotation.set(0.2, 0, -0.5)
  bracoE.add(arnica)
  const tubo = lathe(
    [[0, -0.2], [0.075, -0.2], [0.08, -0.12], [0.07, 0.08], [0.05, 0.16], [0.032, 0.18], [0.03, 0.2], [0, 0.2]],
    ARNICA,
    { roughness: 0.35 },
  )
  tubo.scale.set(1, 1, 0.62)
  arnica.add(tubo)
  const dobraTubo = rbox(0.18, 0.035, 0.03, 0.01, '#d6ae35', { roughness: 0.4 })
  dobraTubo.position.y = -0.21
  arnica.add(dobraTubo)
  const tampa = cylinder(0.045, 0.045, 0.08, TAMPA, { roughness: 0.4 })
  tampa.position.y = 0.24
  arnica.add(tampa)
  const rotulo = rbox(0.1, 0.12, 0.012, 0.01, '#ffffff', { roughness: 0.5 })
  rotulo.position.set(0, -0.02, 0.048)
  arnica.add(rotulo)
  const flor = sphere(0.025, '#f08a24', { roughness: 0.5 })
  flor.position.set(0, -0.01, 0.058)
  flor.scale.z = 0.4
  arnica.add(flor)

  // ---- LEQUE vermelho gigante STOR (filho da pata direita) ------------------
  const leque = new THREE.Group()
  leque.position.copy(hR).add(v(-0.02, 0.06, 0.12))
  leque.rotation.set(-0.1, 0.12, FAN_Z)
  bracoD.add(leque)

  const R0 = 0.2
  const R1 = 0.8
  const A0 = 0.18
  const A1 = Math.PI - 0.18
  const N = 10
  for (let k = 0; k < N; k++) {
    const a0 = A0 + ((A1 - A0) * k) / N
    const a1 = A0 + ((A1 - A0) * (k + 1)) / N
    const gomo = pleat(R0, R1, a0, a1, k % 2 ? LEQUE_ESC : LEQUE)
    gomo.position.z = (k % 2) * 0.012
    leque.add(gomo)
  }
  // varetas de madeira saindo do rebite
  for (let k = 0; k <= N; k++) {
    const a = A0 + ((A1 - A0) * k) / N
    const len = k === 0 || k === N ? R1 + 0.02 : R0 + 0.06
    const vareta = rbox(0.026, len, 0.02, 0.008, VARETA, { roughness: 0.6 })
    vareta.position.set(Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.5, 0.03)
    vareta.rotation.z = a - Math.PI / 2
    leque.add(vareta)
  }
  const rebite = cylinder(0.04, 0.04, 0.07, '#d9c27a', { roughness: 0.3, metalness: 0.8 })
  rebite.rotation.x = Math.PI / 2
  rebite.position.z = 0.02
  leque.add(rebite)
  const borla = sphere(0.045, '#f2c14e', { roughness: 0.7 })
  borla.position.set(0, -0.1, 0.02)
  borla.scale.set(0.8, 1.4, 0.8)
  leque.add(borla)

  // STOR em arco, cada letra radial
  const glyphs: ['S' | 'T' | 'O' | 'R', number][] = [['S', 0.6], ['T', 0.2], ['O', -0.2], ['R', -0.6]]
  for (const [gl, phi] of glyphs) {
    const l = letter(gl)
    const r = 0.52
    l.position.set(-Math.sin(phi) * r, Math.cos(phi) * r, 0.04)
    l.rotation.z = phi
    leque.add(l)
  }

  // ---- três gotas de suor voando da testa ----------------------------------
  const GOTAS_Y = FY + 0.05 + HEAD[1] + 0.28
  const gotas = new THREE.Group()
  gotas.position.set(0, GOTAS_Y, HEAD[2] + 0.35)
  root.add(gotas)
  for (const [gx, gy, gz] of [[-0.52, 0.12, 0], [-0.04, 0.3, 0.05], [0.44, 0.16, 0]] as const) {
    const gota = new THREE.Group()
    gota.position.set(gx, gy, gz)
    // ponta apontando para trás (de onde voou)
    gota.rotation.z = Math.atan2(gx, -gy)
    const bulbo = sphere(0.075, SUOR, { roughness: 0.12 })
    gota.add(bulbo)
    const ponta = cone(0.072, 0.15, SUOR, { roughness: 0.12 })
    ponta.position.y = 0.092
    gota.add(ponta)
    gotas.add(gota)
  }

  // ---- bufo: dois jatos de vapor saindo das narinas -------------------------
  const NOSE_Y = FY + 0.05 + HEAD[1] - 0.3
  const bufo = new THREE.Group()
  bufo.position.set(0, NOSE_Y, HEAD[2] + 0.05 + 0.55)
  root.add(bufo)
  for (const side of [-1, 1]) {
    for (const [d, r, dy] of [[0.1, 0.045, 0], [0.2, 0.06, -0.06], [0.33, 0.075, -0.13]] as const) {
      const nuvem = puff(r, '#f3f5f7', 4, 90 + side * 7 + d * 100, { roughness: 0.95 })
      nuvem.position.set(side * (0.08 + d), dy, d * 0.2)
      bufo.add(nuvem)
    }
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'loja', object: base },
    { name: 'cenario', group: 'loja', object: cenario },
    { name: 'bufalo', group: 'bufalo', object: bufalo },
    { name: 'bufo', group: 'bufalo', object: bufo },
    { name: 'cabeca', group: 'bufalo', object: cabeca },
    { name: 'chifres', group: 'bufalo', object: chifres },
    { name: 'bracoE', group: 'arnica', object: bracoE },
    { name: 'manchasE', group: 'arnica', object: manchasE },
    { name: 'manchasD', group: 'arnica', object: manchasD },
    { name: 'arnica', group: 'arnica', object: arnica },
    { name: 'jaqueta', group: 'denim', object: jaqueta },
    { name: 'bracoD', group: 'stor', object: bracoD },
    { name: 'leque', group: 'stor', object: leque },
    { name: 'gotas', group: 'stor', object: gotas },
  ]

  // ---- montagem ------------------------------------------------------------
  const s3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Uma loja de roupa: piso de madeira clara, espelho dourado e o provador de cortina vermelha.',
    }),
    seq('cenario-rise', 'cenario', 0.25, 0.95, [riseFrom(0, 2.9)], { ease: 'easeOut' }),

    seq('bufalo-rise', 'bufalo', 1.9, 1.0, [riseFrom(0.05, 3.0), ch('position.z', -0.9, 0.05)], {
      ease: 'easeOut',
      caption: 'A cortina se abre e sai um BÚFALO de pé, bufando: RRÁR!',
    }),
    seq('cabeca-sobe', 'cabeca', 2.15, 0.7, [ch('position.y', HEAD[1] - 0.6, HEAD[1])], { ease: 'easeOut' }),
    seq('bufo-sopra', 'bufo', 2.7, 0.5, s3(0.01, 1), { ease: 'easeOut' }),
    seq('chifres-crescem', 'chifres', 2.5, 0.5, s3(0.2, 1), { ease: 'easeOut' }),
    seq('bracoD-desce', 'bracoD', 2.2, 0.6, [ch('rotation.z', 0.35, -1.0)], { ease: 'easeOut' }),

    seq('bracoE-esfrega', 'bracoE', 3.8, 0.6, [ch('rotation.z', 0.7, 0)], {
      ease: 'easeOut',
      caption: 'Braços ROXOS de tanto se espremer — ele esfrega ÁRNIca neles: RRÁR-NI!',
    }),
    seq('arnica-aparece', 'arnica', 3.95, 0.5, s3(0.01, 1), { ease: 'easeOut' }),
    seq('manchasE-aparecem', 'manchasE', 4.3, 0.5, s3(0.01, 1), { ease: 'easeOut' }),
    seq('manchasD-aparecem', 'manchasD', 4.45, 0.5, s3(0.01, 1), { ease: 'easeOut' }),

    seq('jaqueta-cai', 'jaqueta', 5.7, 0.7, [
      ch('position.y', JAQ[1] + 1.3, JAQ[1]), ch('rotation.z', 0.9, -0.2),
    ], {
      ease: 'easeIn',
      caption: 'No chifre, a culpada: uma jaqueta de DENIM infantil, costura estourada — DÊ-NI(m)!',
    }),
    seq('jaqueta-balanca', 'jaqueta', 6.4, 0.45, [ch('rotation.z', -0.2, 0.12)], { ease: 'easeInOut' }),
    seq('jaqueta-assenta', 'jaqueta', 6.85, 0.45, [ch('rotation.z', 0.12, 0)], { ease: 'easeInOut' }),

    seq('cabeca-nega-a', 'cabeca', 7.7, 0.25, [ch('rotation.y', 0, 0.35)], {
      ease: 'easeOut',
      caption: 'EN — essa UMA não serve! Ele balança a cabeçorra: ÁN-NAN! Quero OUTRA.',
    }),
    seq('cabeca-nega-b', 'cabeca', 7.95, 0.35, [ch('rotation.y', 0.35, -0.35)], { ease: 'easeInOut' }),
    seq('cabeca-nega-c', 'cabeca', 8.3, 0.35, [ch('rotation.y', -0.35, 0.25)], { ease: 'easeInOut' }),
    seq('cabeca-nega-d', 'cabeca', 8.65, 0.3, [ch('rotation.y', 0.25, 0)], { ease: 'easeOut' }),

    seq('bracoD-ergue', 'bracoD', 9.5, 0.6, [ch('rotation.z', -1.0, 0)], {
      ease: 'easeOut',
      caption: 'Pingando de suor, ele abre um LEQUE vermelho gigante: STOR — STÚUR-LÊK!',
    }),
    seq('leque-abre', 'leque', 9.7, 0.5, [ch('scale.x', 0.05, 1), ch('scale.y', 0.3, 1)], { ease: 'easeOut' }),
    seq('gotas-voam', 'gotas', 10.0, 0.55, [...s3(0.01, 1), ch('position.y', GOTAS_Y - 0.25, GOTAS_Y)], {
      ease: 'easeOut',
    }),
    seq('leque-abana-a', 'leque', 10.5, 0.3, [ch('rotation.z', FAN_Z, FAN_Z + 0.35)], { ease: 'easeInOut' }),
    seq('leque-abana-b', 'leque', 10.8, 0.3, [ch('rotation.z', FAN_Z + 0.35, FAN_Z)], { ease: 'easeInOut' }),
    seq('leque-abana-c', 'leque', 11.3, 0.3, [ch('rotation.z', FAN_Z, FAN_Z + 0.35)], {
      ease: 'easeInOut',
      caption: 'Har ni den i en annan storlek? — Vocês têm em outro tamanho?',
    }),
    seq('leque-abana-d', 'leque', 11.6, 0.3, [ch('rotation.z', FAN_Z + 0.35, FAN_Z)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.4, 5.7], target: [0.3, 1.45, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'har-ni-den-i-en-annan-storlek',
    contexto:
      "Na loja de roupa ou de sapato, com a peça na mão — pro vendedor, ou de dentro do provador. 'Den' vale pra uma peça (en tröja, en jacka); pra calça, que em sueco é plural, vira 'dem' (falado 'dom').",
    fraseFonte: 'Vocês têm em outro tamanho?',
    fraseAlvo: 'Har ni den i en annan storlek?',
    pronuncia:
      "rrar ni den i en ÁN-nan STÚUR-lêk ('har' com h soprado e R brando; 'annan' com A aberto e ORAL, força no primeiro A; 'storlek' com U fechado e longo, o R some dentro do L, e Ê fechado no fim)",
    ponteSonora:
      "RRÁR-NI DÊ-NI EN... ÁN-NAN! STÚUR-LÊK? (9 sílabas: rrar-ni-den-i-en-ÁN-nan-STÚUR-lêk; tônicas em ÁN e STÚUR; RRÁR-NI = a ÁRNIca sem o -ca, o MESMO de 'Har ni något receptfritt mot det här?' — h SOPRADO na frente e R brando colado no NI; DÊ-NI = o DENIM da jaqueta SEM o M: 'den i' grudados, DEN curto como o começo de DENTE (o mesmo DEN de 'Vad kostar den här?'); EN = UM, curto e oral; ÁN-NAN = o 'ãn-ãn' de quem balança a cabeça dizendo ESSA NÃO — mas ORAL e com a LÍNGUA: o 'ãn-ãn' português sai só pelo nariz, aqui são dois N DE VERDADE, a ponta da língua batendo no céu da boca duas vezes, como ANA-ANA dito rápido e sem os A do fim; A aberto de 'pá', força no primeiro; STÚUR = 'stor', GRANDE, o mesmo STÚR da Storgatan: U FECHADO e LONGO, e o R quase some dentro do L; LÊK = o LEQUE com Ê FECHADO de 'você' e sem o -e final — nunca o É aberto do leque português)",
    historia:
      'O búfalo sai do provador bufando RRÁR!, esfregando ÁRNIca nos braços roxos de tanto apertar — RRÁR-NI. Pendurada no chifre, a culpada: uma jaqueta de DENIM tamanho infantil com a costura estourada — DÊ-NI(m). Ele ergue UM dedo, EN, e balança a cabeçorra: ÁN-NAN! — essa não, OUTRA. Pingando de suor, se abana com um LEQUE vermelho gigante escrito STOR: STÚUR-LÊK — vocês têm em OUTRO tamanho?',
  },
  createScene,
  refine: { organic: ['bufalo', 'cabeca', 'bracoE', 'bracoD'] },
}

export default card
