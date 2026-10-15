import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus,
} from '../rig/helpers'

/**
 * "Kan du ta emot mitt paket?" — CAN-DU, TÁ É-MÚT... MIT' PA-KÊT?
 *
 * No patamar do prédio, véspera de viagem: a sua porta tem a mala azul
 * encostada; a porta ao lado virou teia, e a vizinha é uma aranha roxa e
 * peluda de lacinho amarelo. Você pergunta CAN-DU, TÁ…? e a caixa vem voando
 * escada acima — É… MÚT! — afunda no meio da teia (anéis de impacto). A
 * etiqueta rasga no tombo: o apelido MITO perde o O (que cai no chão) e vira
 * MIT'. A aranha enrola o PACOTE em seda com quatro patas e acena com as
 * outras quatro.
 *
 * Acento saturado RESERVADO: o vermelho das letras MIT (e do O caído).
 */

const LAJE = '#8f8a82'
const PISO = '#d3d0c9'        // granilite cinza-claro
const PAREDE = '#e9e1cf'      // matiz 1: a escadaria creme
const BARRADO = '#9fb2a7'     // barrado verde-acinzentado das escadarias suecas
const FRISO = '#6f8579'
const PORTA = '#4b3223'       // matiz 2: madeira escura
const PORTA_PAINEL = '#583c2a'
const BATENTE = '#6e4b33'
const LATAO = '#d2a84a'
const ESCURO = '#2b2622'
const ROXO = '#5a3484'        // matiz 3: a vizinha
const ROXO_ESC = '#432665'
const LILAS = '#c8a8f0'
const OLHO = '#120d16'
const TEIA = '#f6f4ef'
const PAPELAO = '#bd8b55'
const FITA = '#dcc18e'
const SEDA = '#f8f6f1'
const ETIQUETA = '#fbfaf6'
const VERMELHO = '#e0392a'    // acento: MIT
const AMARELO = '#ecc04a'
const AZUL = '#577aa3'
const AZUL_ESC = '#405f86'
const CINZA = '#8b8f97'
const METAL = '#bcc3c9'

const GY = 0.16               // topo do piso
const WALL_Z = -1.3           // face da parede
const NX = -0.3               // centro da porta da vizinha
const YX = 1.5                // centro da sua porta
const DOOR_W = 0.96
const DOOR_H = 2.0
const HUB_Z = -0.93           // centro (afundado) da teia
const PKG = new THREE.Vector3(NX, 1.18, -0.9)
const SP = new THREE.Vector3(NX, 1.7, -0.7) // centro da cabeça da aranha
const MALA = new THREE.Vector3(1.28, GY, -0.98)
const MALA_LEAN = -0.1
const O_TILT = -Math.PI / 2 + 0.3 // pedaço caído com a borda de trás levantada
const O_FIM = new THREE.Vector3(0.36, GY + 0.05, -0.36)
const O_INI = new THREE.Vector3(NX + 0.42, PKG.y + 0.02, PKG.z + 0.235)
const Y_AXIS = new THREE.Vector3(0, 1, 0)

/** Cápsula esticada entre dois pontos (segmentos de pata, corrimão). */
function seg(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const m = capsule(r, len, color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(Y_AXIS, d.normalize())
  return m
}

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, color: string, rot = 0) {
  const s = rbox(w, h, 0.014, 0.006, color, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** M, I, T de traço grosso — altura 0.15. */
function letter(which: 'M' | 'I' | 'T') {
  const g = new THREE.Group()
  const t = 0.034
  const h = 0.15
  if (which === 'M') {
    g.add(stroke(t, h, -0.05, 0, VERMELHO))
    g.add(stroke(t, h, 0.05, 0, VERMELHO))
    g.add(stroke(t * 0.92, 0.1, -0.025, 0.03, VERMELHO, 0.56))
    g.add(stroke(t * 0.92, 0.1, 0.025, 0.03, VERMELHO, -0.56))
  } else if (which === 'I') {
    g.add(stroke(t, h, 0, 0, VERMELHO))
    g.add(stroke(0.075, t * 0.85, 0, h / 2 - t * 0.42, VERMELHO))
    g.add(stroke(0.075, t * 0.85, 0, -h / 2 + t * 0.42, VERMELHO))
  } else {
    g.add(stroke(0.115, t, 0, h / 2 - t / 2, VERMELHO))
    g.add(stroke(t, h, 0, 0, VERMELHO))
  }
  return g
}

/** Borda rasgada: dentinhos de papel (losangos) ao longo de uma aresta vertical. */
function tornEdge(x: number, h: number, side: 1 | -1, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const n = 5
  for (let i = 0; i < n; i++) {
    const y = -h / 2 + (h / n) * (i + 0.5)
    const s = 0.028 + rand() * 0.016
    const d = rbox(s, s, 0.012, 0.003, ETIQUETA, { roughness: 0.7 })
    d.position.set(x + side * (0.004 + rand() * 0.012), y, 0)
    d.rotation.z = Math.PI / 4 + (rand() - 0.5) * 0.4
    g.add(d)
  }
  return g
}

/** Porta de apartamento sueca: folha escura, batente, olho mágico, plaquinha. */
function makeDoor(x: number, handleSide: 1 | -1, mailSlot: boolean) {
  const g = new THREE.Group()
  g.position.set(x, GY, WALL_Z)

  const folha = rbox(DOOR_W, DOOR_H, 0.07, 0.02, PORTA, { roughness: 0.5 })
  folha.position.set(0, DOOR_H / 2, 0.04)
  g.add(folha)
  for (const py of [0.55, 1.42]) {
    const painel = rbox(0.72, 0.68, 0.02, 0.02, PORTA_PAINEL, { roughness: 0.55 })
    painel.position.set(0, py, 0.08)
    g.add(painel)
  }

  for (const s of [-1, 1]) {
    const umbral = rbox(0.12, DOOR_H + 0.12, 0.13, 0.025, BATENTE, { roughness: 0.6 })
    umbral.position.set(s * (DOOR_W / 2 + 0.06), (DOOR_H + 0.12) / 2, 0.06)
    g.add(umbral)
  }
  const verga = rbox(DOOR_W + 0.24, 0.12, 0.13, 0.025, BATENTE, { roughness: 0.6 })
  verga.position.set(0, DOOR_H + 0.06, 0.06)
  g.add(verga)

  const soleira = rbox(DOOR_W, 0.025, 0.17, 0.01, '#b9a88d', { roughness: 0.5 })
  soleira.position.set(0, 0.012, 0.09)
  g.add(soleira)

  // maçaneta de alavanca + cilindro da fechadura
  const hx = handleSide * 0.37
  const roseta = cylinder(0.036, 0.036, 0.02, LATAO, { roughness: 0.3, metalness: 0.75 })
  roseta.rotation.x = Math.PI / 2
  roseta.position.set(hx, 1.0, 0.085)
  g.add(roseta)
  const alavanca = rbox(0.15, 0.03, 0.032, 0.012, LATAO, { roughness: 0.3, metalness: 0.75 })
  alavanca.position.set(hx - handleSide * 0.06, 1.0, 0.115)
  g.add(alavanca)
  const fechadura = cylinder(0.026, 0.026, 0.02, LATAO, { roughness: 0.3, metalness: 0.75 })
  fechadura.rotation.x = Math.PI / 2
  fechadura.position.set(hx, 1.18, 0.085)
  g.add(fechadura)

  const olhoMagico = cylinder(0.022, 0.022, 0.02, LATAO, { roughness: 0.3, metalness: 0.75 })
  olhoMagico.rotation.x = Math.PI / 2
  olhoMagico.position.set(0, 1.55, 0.09)
  g.add(olhoMagico)

  // plaquinha dourada com o nome (riscos escuros no lugar do texto)
  const placa = rbox(0.28, 0.085, 0.016, 0.012, LATAO, { roughness: 0.3, metalness: 0.75 })
  placa.position.set(0, 1.72, 0.095)
  g.add(placa)
  for (const ly of [0.014, -0.014]) {
    const risco = rbox(ly > 0 ? 0.18 : 0.13, 0.012, 0.006, 0.003, ESCURO, { roughness: 0.6 })
    risco.position.set(0, 1.72 + ly, 0.104)
    g.add(risco)
  }

  if (mailSlot) {
    const brev = rbox(0.34, 0.08, 0.02, 0.012, LATAO, { roughness: 0.3, metalness: 0.75 })
    brev.position.set(0, 0.82, 0.095)
    g.add(brev)
    const fresta = rbox(0.27, 0.022, 0.008, 0.004, ESCURO, { roughness: 0.6 })
    fresta.position.set(0, 0.82, 0.106)
    g.add(fresta)
  }
  return g
}

/** Pata articulada: coxa, joelho, tíbia e a ponta lilás. Pontos no espaço do pai. */
function makeLeg(a: THREE.Vector3, k: THREE.Vector3, t: THREE.Vector3) {
  const g = new THREE.Group()
  const ankle = new THREE.Vector3().lerpVectors(k, t, 0.62)
  g.add(seg(a, k, 0.056, ROXO_ESC, { roughness: 0.85 }))
  const joelho = sphere(0.07, ROXO, { roughness: 0.85 })
  joelho.position.copy(k)
  g.add(joelho)
  g.add(seg(k, ankle, 0.05, ROXO_ESC, { roughness: 0.85 }))
  const tornozelo = sphere(0.052, ROXO, { roughness: 0.85 })
  tornozelo.position.copy(ankle)
  g.add(tornozelo)
  g.add(seg(ankle, t, 0.043, LILAS, { roughness: 0.7 }))
  return g
}

function v(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z)
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: patamar de granilite + lance de escada --------------------------
  const base = new THREE.Group()

  const laje = cylinder(2.62, 2.7, 0.1, LAJE, { roughness: 0.8 })
  laje.position.y = 0.05
  base.add(laje)
  const piso = cylinder(2.56, 2.6, 0.06, PISO, { roughness: 0.4 })
  piso.position.y = 0.13
  base.add(piso)

  // pedrinhas do granilite (geometria e materiais compartilhados)
  const chipGeo = new THREE.CylinderGeometry(1, 1, 1, 7)
  const chipMats = ['#8a857d', '#f5f2ec', '#b39a7d', '#6c7076'].map((c) =>
    mat(c, { roughness: 0.35, size: 0.05 }),
  )
  for (let i = 0; i < 110; i++) {
    const r = Math.sqrt(rand()) * 2.45
    const a = rand() * Math.PI * 2
    const chip = new THREE.Mesh(chipGeo, chipMats[i % 4])
    const s = 0.016 + rand() * 0.022
    chip.scale.set(s, 0.006, s * (0.6 + rand() * 0.5))
    chip.position.set(Math.cos(a) * r, GY + 0.001, Math.sin(a) * r)
    chip.rotation.y = rand() * Math.PI
    chip.receiveShadow = true
    base.add(chip)
  }

  // lance de escada subindo pela esquerda, com corrimão
  const STEP_H = 0.17
  for (let i = 0; i < 5; i++) {
    const h = STEP_H * (i + 1)
    const degrau = rbox(0.62, h, 0.3, 0.02, PISO, { roughness: 0.4 })
    degrau.position.set(-2.06, GY + h / 2, 0.42 - i * 0.3)
    base.add(degrau)
    const bocel = rbox(0.62, 0.035, 0.04, 0.012, '#5a5650', { roughness: 0.7 })
    bocel.position.set(-2.06, GY + h - 0.018, 0.42 - i * 0.3 + 0.14)
    base.add(bocel)
  }
  const RAIL_X = -1.72
  for (let i = 0; i < 6; i++) {
    const z = 0.52 - i * 0.29
    const stepTop = GY + STEP_H * Math.min(i + 1, 5)
    const balaustre = cylinder(0.014, 0.014, 0.82, ESCURO, { roughness: 0.4, metalness: 0.6 }, 10)
    balaustre.position.set(RAIL_X, stepTop + 0.41, z)
    base.add(balaustre)
  }
  const corrimao = seg(
    v(RAIL_X, GY + STEP_H + 0.84, 0.62),
    v(RAIL_X, GY + STEP_H * 5 + 0.84, -0.98),
    0.04,
    '#7b5638',
    { roughness: 0.5 },
  )
  base.add(corrimao)
  const pilar = cylinder(0.05, 0.06, 1.06, '#7b5638', { roughness: 0.5 })
  pilar.position.set(RAIL_X, GY + 0.53, 0.66)
  base.add(pilar)
  const pomo = sphere(0.075, '#7b5638', { roughness: 0.45 })
  pomo.position.set(RAIL_X, GY + 1.1, 0.66)
  base.add(pomo)

  root.add(base)

  // ---- parede com as duas portas ---------------------------------------------
  const parede = new THREE.Group()

  const muro = rbox(4.5, 2.74, 0.2, 0.03, PAREDE, { roughness: 0.9 })
  muro.position.set(0, GY + 1.37, WALL_Z - 0.1)
  parede.add(muro)
  const barrado = rbox(4.52, 0.95, 0.22, 0.02, BARRADO, { roughness: 0.75 })
  barrado.position.set(0, GY + 0.475, WALL_Z - 0.09)
  parede.add(barrado)
  const friso = rbox(4.54, 0.05, 0.25, 0.015, FRISO, { roughness: 0.6 })
  friso.position.set(0, GY + 0.95, WALL_Z - 0.08)
  parede.add(friso)
  const rodape = rbox(4.54, 0.1, 0.25, 0.02, '#66756c', { roughness: 0.6 })
  rodape.position.set(0, GY + 0.05, WALL_Z - 0.08)
  parede.add(rodape)

  parede.add(makeDoor(NX, -1, false))
  parede.add(makeDoor(YX, 1, true))

  // capacho na frente da sua porta
  const capacho = rbox(0.86, 0.03, 0.5, 0.012, '#4f4b46', { roughness: 0.95 })
  capacho.position.set(YX, GY + 0.015, WALL_Z + 0.42)
  parede.add(capacho)
  const faixa = rbox(0.7, 0.008, 0.06, 0.003, '#7d776f', { roughness: 0.95 })
  faixa.position.set(YX, GY + 0.032, WALL_Z + 0.62)
  parede.add(faixa)

  root.add(parede)

  // ---- mala azul, alça puxada, encostada na sua porta -------------------------
  const mala = new THREE.Group()
  mala.position.copy(MALA)
  mala.rotation.set(MALA_LEAN, -0.18, 0)

  const casco = rbox(0.56, 0.76, 0.3, 0.07, AZUL, { roughness: 0.35 })
  casco.position.y = 0.46
  mala.add(casco)
  const ziper = rbox(0.575, 0.775, 0.035, 0.075, AZUL_ESC, { roughness: 0.6 })
  ziper.position.y = 0.46
  mala.add(ziper)
  for (const rx of [-0.15, 0, 0.15]) {
    const nervura = rbox(0.035, 0.6, 0.02, 0.012, AZUL_ESC, { roughness: 0.4 })
    nervura.position.set(rx, 0.46, 0.152)
    mala.add(nervura)
  }
  for (const wx of [-0.2, 0.2]) {
    const roda = cylinder(0.045, 0.045, 0.04, ESCURO, { roughness: 0.6 })
    roda.rotation.z = Math.PI / 2
    roda.position.set(wx, 0.045, -0.09)
    mala.add(roda)
    const pe = rbox(0.06, 0.05, 0.06, 0.015, ESCURO, { roughness: 0.6 })
    pe.position.set(wx, 0.06, 0.1)
    mala.add(pe)
  }
  // alça telescópica puxada
  for (const sx of [-0.12, 0.12]) {
    const haste = cylinder(0.014, 0.014, 0.44, METAL, { roughness: 0.25, metalness: 0.8 }, 12)
    haste.position.set(sx, 0.84 + 0.22, -0.1)
    mala.add(haste)
  }
  const pega = rbox(0.3, 0.055, 0.055, 0.025, ESCURO, { roughness: 0.6 })
  pega.position.set(0, 1.29, -0.1)
  mala.add(pega)
  // alça de mão e etiqueta de bagagem
  const alcaMao = rbox(0.2, 0.032, 0.05, 0.014, ESCURO, { roughness: 0.6 })
  alcaMao.position.set(0.04, 0.88, 0.05)
  mala.add(alcaMao)
  for (const px of [-0.06, 0.14]) {
    const apoio = rbox(0.03, 0.04, 0.05, 0.01, ESCURO, { roughness: 0.6 })
    apoio.position.set(px, 0.855, 0.05)
    mala.add(apoio)
  }
  const tag = rbox(0.09, 0.13, 0.012, 0.012, '#efe4c8', { roughness: 0.7 })
  tag.position.set(0.2, 0.74, 0.16)
  tag.rotation.z = -0.15
  mala.add(tag)
  const tira = rbox(0.014, 0.12, 0.01, 0.004, ESCURO, { roughness: 0.6 })
  tira.position.set(0.17, 0.83, 0.16)
  tira.rotation.z = 0.3
  mala.add(tira)

  root.add(mala)

  // ---- teia: raios e anéis em cuia rasa, afundada no centro -------------------
  const teia = new THREE.Group()
  teia.position.set(NX, PKG.y, HUB_Z)

  const webMat = mat(TEIA, { roughness: 0.35, detail: 0 })
  webMat.transparent = true
  webMat.opacity = 0.9
  const fioGeo = new THREE.CylinderGeometry(1, 1, 1, 6)
  const fio = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
    const d = new THREE.Vector3().subVectors(b, a)
    const m = new THREE.Mesh(fioGeo, webMat)
    m.position.copy(a).addScaledVector(d, 0.5)
    m.scale.set(r, d.length(), r)
    m.quaternion.setFromUnitVectors(Y_AXIS, d.normalize())
    m.castShadow = true
    return m
  }

  const AX = 0.6
  const AY = 1.0
  const N = 16
  const RIM = 0.15
  const zOf = (t: number) => RIM * (1 - (1 - t) * (1 - t))
  const ends: { x: number; y: number }[] = []
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2 + 0.11
    const c = Math.cos(th)
    const s = Math.sin(th)
    const L = Math.min(AX / Math.max(Math.abs(c), 1e-3), AY / Math.max(Math.abs(s), 1e-3))
    ends.push({ x: c * L, y: s * L })
  }
  const at = (i: number, t: number) => {
    const e = ends[((i % N) + N) % N]
    return v(e.x * t, e.y * t, zOf(t))
  }
  const SPOKE_T = [0, 0.2, 0.32, 0.43, 0.54, 0.64, 0.73, 0.82, 0.9]
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < SPOKE_T.length - 1; k++) {
      teia.add(fio(at(i, SPOKE_T[k]), at(i, SPOKE_T[k + 1]), 0.012))
    }
    // ancoragem: do aro até o batente
    const e = ends[i]
    teia.add(fio(at(i, 0.9), v(e.x, e.y, -0.15), 0.011))
  }
  for (const t of [0.32, 0.43, 0.54, 0.64, 0.73, 0.82, 0.9]) {
    for (let i = 0; i < N; i++) teia.add(fio(at(i, t), at(i + 1, t), 0.0085))
  }
  root.add(teia)

  // ---- a vizinha: aranha roxa e peluda ----------------------------------------
  const aranha = new THREE.Group()
  aranha.position.copy(SP)

  const HR = [0.2835, 0.2484, 0.2565] // raios da cabeça (elipsoide)
  const cabeca = sphere(0.27, ROXO, { roughness: 0.88 })
  cabeca.scale.set(1.05, 0.92, 0.95)
  aranha.add(cabeca)

  const ABD = v(0, 0.52, -0.16)
  const abdomen = sphere(0.4, ROXO, { roughness: 0.9 })
  abdomen.position.copy(ABD)
  abdomen.scale.set(1, 0.98, 0.75)
  aranha.add(abdomen)

  const cintura = sphere(0.16, ROXO_ESC, { roughness: 0.9 })
  cintura.position.set(0, 0.25, -0.14)
  aranha.add(cintura)

  // pelagem: tufos fundidos na pele pelo Blender (só na frente/topo: atrás é a porta)
  for (let i = 0; i < 26; i++) {
    const u = rand() * 2 - 1
    const a = rand() * Math.PI * 2
    const rr = Math.sqrt(1 - u * u)
    const dir = v(rr * Math.cos(a), u, rr * Math.sin(a))
    if (dir.z < -0.25) dir.z = -dir.z * 0.4
    if (dir.y < -0.2 && dir.z > 0) dir.y = -dir.y // nada caindo sobre a cara
    dir.normalize()
    const tufo = sphere(0.075 + rand() * 0.035, i % 3 ? ROXO : ROXO_ESC, { roughness: 0.92 })
    tufo.position.set(ABD.x + dir.x * 0.37, ABD.y + dir.y * 0.36, ABD.z + dir.z * 0.27)
    aranha.add(tufo)
  }
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + (i / 6) * 0.7)
    const tufo = sphere(0.06, ROXO, { roughness: 0.92 })
    tufo.position.set(Math.cos(a) * 0.23, 0.13 + Math.sin(a) * 0.08, -0.12)
    aranha.add(tufo)
  }

  // oito olhinhos pretos brilhantes, com reflexo
  const surfZ = (x: number, y: number) =>
    HR[2] * Math.sqrt(Math.max(0, 1 - (x / HR[0]) ** 2 - (y / HR[1]) ** 2))
  const olhos: [number, number, number][] = [
    [-0.086, 0.02, 0.068], [0.086, 0.02, 0.068],
    [-0.192, 0.045, 0.043], [0.192, 0.045, 0.043],
    [-0.048, 0.135, 0.038], [0.048, 0.135, 0.038],
    [-0.14, 0.14, 0.03], [0.14, 0.14, 0.03],
  ]
  for (const [ex, ey, er] of olhos) {
    const z = surfZ(ex, ey) - er * 0.3
    const olho = sphere(er, OLHO, { roughness: 0.1 })
    olho.position.set(ex, ey, z)
    aranha.add(olho)
    const brilho = sphere(er * 0.3, '#ffffff', { roughness: 0.2 })
    brilho.position.set(ex - er * 0.32, ey + er * 0.36, z + er * 0.82)
    aranha.add(brilho)
  }

  // sorriso, presinhas e bochechas
  const sorriso = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.011, 8, 20, Math.PI),
    mat('#2a1530', { roughness: 0.6 }),
  )
  sorriso.rotation.z = Math.PI
  sorriso.position.set(0, -0.08, surfZ(0, -0.095) - 0.004)
  sorriso.castShadow = true
  aranha.add(sorriso)
  for (const s of [-1, 1]) {
    const presa = cone(0.016, 0.05, '#efe6d4', { roughness: 0.4 })
    presa.rotation.x = Math.PI
    presa.position.set(s * 0.034, -0.15, surfZ(s * 0.034, -0.14) - 0.006)
    aranha.add(presa)
    const bochecha = sphere(0.038, '#d48bb4', { roughness: 0.7 })
    bochecha.scale.set(1.2, 0.75, 0.4)
    bochecha.position.set(s * 0.18, -0.07, surfZ(s * 0.18, -0.07) - 0.004)
    aranha.add(bochecha)
  }
  root.add(aranha)

  // ---- lacinho amarelo de bolinhas (filho da aranha) -------------------------
  const lacinho = new THREE.Group()
  lacinho.position.set(0.12, 0.215, 0.1)
  lacinho.rotation.set(0.25, 0, -0.25)
  lacinho.scale.setScalar(1.15)
  for (const s of [-1, 1]) {
    const laco = sphere(0.085, AMARELO, { roughness: 0.55 })
    laco.scale.set(1.35, 0.85, 0.45)
    laco.position.set(s * 0.1, 0, 0)
    laco.rotation.z = s * 0.3
    lacinho.add(laco)
    for (const [dx, dy] of [[0.07, 0.025], [0.12, -0.03], [0.14, 0.035]] as const) {
      const bolinha = sphere(0.014, '#fff7e0', { roughness: 0.5 })
      bolinha.position.set(s * dx, dy, 0.04)
      lacinho.add(bolinha)
    }
    const ponta = capsule(0.02, 0.06, AMARELO, { roughness: 0.55 })
    ponta.position.set(s * 0.035, -0.07, 0.01)
    ponta.rotation.z = s * 0.4
    lacinho.add(ponta)
  }
  const no = sphere(0.045, '#d9a932', { roughness: 0.55 })
  no.scale.set(1, 1, 0.8)
  lacinho.add(no)
  aranha.add(lacinho)

  // ---- quatro patas que seguram o pacote (filhas da aranha) ------------------
  const abraco = new THREE.Group()
  for (const s of [-1, 1]) {
    // par da frente: mãos na quina de cima da caixa, por cima do papelão
    abraco.add(makeLeg(v(s * 0.18, -0.13, 0.08), v(s * 0.5, -0.06, 0.2), v(s * 0.31, -0.33, 0.1)))
    // segundo par: abraça as laterais por baixo
    abraco.add(makeLeg(v(s * 0.23, -0.06, -0.03), v(s * 0.66, -0.14, 0.0), v(s * 0.43, -0.64, -0.12)))
  }
  aranha.add(abraco)

  // ---- quatro patas que acenam: pivô no ponto de encaixe ---------------------
  const makeAceno = (s: 1 | -1) => {
    const g = new THREE.Group()
    const pivo = v(s * 0.19, 0.08, -0.1)
    g.position.copy(pivo)
    const rel = (x: number, y: number, z: number) => v(x, y, z).sub(pivo)
    g.add(makeLeg(rel(s * 0.2, 0.06, -0.08), rel(s * 0.62, 0.36, 0.02), rel(s * 0.9, 0.82, 0.16)))
    g.add(makeLeg(rel(s * 0.15, 0.12, -0.14), rel(s * 0.56, 0.66, -0.06), rel(s * 0.68, 1.1, 0.1)))
    aranha.add(g)
    return g
  }
  const acenoE = makeAceno(-1)
  const acenoD = makeAceno(1)

  // ---- o pacote afundado no meio da teia ------------------------------------
  const pacote = new THREE.Group()
  pacote.position.copy(PKG)

  const caixa = rbox(0.76, 0.52, 0.44, 0.035, PAPELAO, { roughness: 0.8 })
  pacote.add(caixa)
  const fita = rbox(0.785, 0.535, 0.12, 0.01, FITA, { roughness: 0.4 })
  pacote.add(fita)
  // cantinho amassado do tombo
  const amassado = rbox(0.12, 0.05, 0.02, 0.01, '#a77846', { roughness: 0.85 })
  amassado.position.set(-0.3, -0.21, 0.222)
  amassado.rotation.z = 0.5
  pacote.add(amassado)
  root.add(pacote)

  // etiqueta MIT de borda rasgada (filha do pacote)
  const etiqueta = new THREE.Group()
  etiqueta.position.set(0.1, 0.0, 0.226)
  const papel = rbox(0.42, 0.22, 0.012, 0.01, ETIQUETA, { roughness: 0.7 })
  etiqueta.add(papel)
  etiqueta.add(tornEdge(0.21, 0.22, 1, 7))
  for (const [glyph, lx] of [['M', -0.1], ['I', 0.015], ['T', 0.12]] as const) {
    const l = letter(glyph)
    l.position.set(lx, 0, 0.01)
    etiqueta.add(l)
  }
  pacote.add(etiqueta)

  // fitas de seda enrolando a metade esquerda (filha do pacote; cresce para a direita)
  const seda = new THREE.Group()
  seda.position.set(-0.38, 0, 0)
  for (const [bx, tilt] of [[0.045, 0.1], [0.13, -0.07], [0.215, 0.13]] as const) {
    const banda = rbox(0.05, 0.545, 0.465, 0.02, SEDA, { roughness: 0.5 })
    banda.position.x = bx
    banda.rotation.z = tilt
    seda.add(banda)
  }
  // fio solto de seda do pacote até a pata
  const fioSeda = seg(v(0.16, 0.27, 0.12), v(0.06, 0.6, 0.32), 0.008, SEDA, { roughness: 0.5 })
  seda.add(fioSeda)
  pacote.add(seda)

  // ---- o O arrancado da etiqueta, caído no chão -------------------------------
  const pedacoO = new THREE.Group()
  pedacoO.position.copy(O_FIM)
  pedacoO.rotation.set(O_TILT, 0, 0.35)
  const papelO = rbox(0.17, 0.26, 0.012, 0.01, ETIQUETA, { roughness: 0.7 })
  pedacoO.add(papelO)
  pedacoO.add(tornEdge(-0.085, 0.26, -1, 11))
  const letraO = torus(0.055, 0.016, VERMELHO, { roughness: 0.5 })
  letraO.scale.set(0.85, 1.35, 1)
  letraO.position.z = 0.012
  pedacoO.add(letraO)
  root.add(pedacoO)

  // ---- anéis do baque MÚT em volta do pacote ----------------------------------
  const aneis = new THREE.Group()
  aneis.position.set(NX, PKG.y, PKG.z + 0.25)
  const anelMat = mat(CINZA, { roughness: 0.5 })
  // arcos alinhados (mesmas frestas em todos os anéis): lê como onda de choque
  const ARCO = 1.05
  for (const r of [0.54, 0.66, 0.78]) {
    for (let j = 0; j < 4; j++) {
      const arco = new THREE.Mesh(new THREE.TorusGeometry(r, 0.017, 8, 24, ARCO), anelMat)
      arco.rotation.z = (j / 4) * Math.PI * 2 - ARCO / 2
      arco.castShadow = true
      aneis.add(arco)
    }
  }
  root.add(aneis)

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'patamar', object: base },
    { name: 'parede', group: 'patamar', object: parede },
    { name: 'mala', group: 'mala', object: mala },
    { name: 'teia', group: 'aranha', object: teia },
    { name: 'aranha', group: 'aranha', object: aranha },
    { name: 'abraco', group: 'aranha', object: abraco },
    { name: 'acenoE', group: 'aranha', object: acenoE },
    { name: 'acenoD', group: 'aranha', object: acenoD },
    { name: 'lacinho', group: 'candu', object: lacinho },
    { name: 'pacote', group: 'mut', object: pacote },
    { name: 'etiqueta', group: 'mut', object: etiqueta },
    { name: 'aneis', group: 'mut', object: aneis },
    { name: 'pedacoO', group: 'mut', object: pedacoO },
    { name: 'seda', group: 'paket', object: seda },
  ]

  // ---- montagem --------------------------------------------------------------
  const ONE = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Véspera de viagem. No patamar do prédio, duas portas lado a lado…',
    }),
    seq('parede-rise', 'parede', 0.25, 1.0, [riseFrom(0, 3.2)], { ease: 'easeOut' }),

    seq('mala-rola', 'mala', 2.0, 0.9, [ch('position.x', 3.1, MALA.x)], {
      ease: 'easeOut',
      caption: 'Na sua, a mala azul já espera. Mas a encomenda chega amanhã, com a casa vazia!',
    }),
    seq('mala-encosta', 'mala', 2.9, 0.35, [ch('rotation.x', 0, MALA_LEAN)]),

    seq(
      'teia-abre',
      'teia',
      4.0,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('rotation.z', -0.8, 0)],
      {
        ease: 'easeOut',
        caption: 'Você bate na porta ao lado: a vizinha é uma ARANHA roxa e peluda, que forrou a porta de teia.',
      },
    ),
    seq('aranha-desce', 'aranha', 4.4, 0.9, [ch('position.y', SP.y + 2.6, SP.y)], { ease: 'easeOut' }),
    seq('abraco-abre', 'abraco', 4.9, 0.5, [
      ch('scale.x', 0.2, 1.18), ch('scale.y', 0.2, 1), ch('scale.z', 0.2, 1),
    ], { ease: 'easeOut' }),
    seq('acenoE-abre', 'acenoE', 5.0, 0.5, [...ONE(0.2, 1), ch('rotation.z', -0.8, 0)], { ease: 'easeOut' }),
    seq('acenoD-abre', 'acenoD', 5.0, 0.5, [...ONE(0.2, 1), ch('rotation.z', 0.8, 0)], { ease: 'easeOut' }),

    seq('aranha-inclina', 'aranha', 6.2, 0.35, [ch('rotation.z', 0, 0.14)], {
      caption: 'De mala na mão, você pergunta: CAN-DU, TÁ…?',
    }),
    seq('aranha-inclina-b', 'aranha', 6.55, 0.3, [ch('rotation.z', 0.14, -0.06)]),
    seq('mala-pula', 'mala', 6.2, 0.2, [ch('position.y', MALA.y, MALA.y + 0.07)], { ease: 'easeOut' }),
    seq('mala-pousa', 'mala', 6.4, 0.22, [ch('position.y', MALA.y + 0.07, MALA.y)], { ease: 'easeIn' }),
    seq('aranha-endireita', 'aranha', 6.85, 0.3, [ch('rotation.z', -0.06, 0)]),
    seq('lacinho-pop', 'lacinho', 6.3, 0.45, [...ONE(0.01, 1), ch('rotation.z', 0.6, -0.25)], {
      ease: 'easeOut',
    }),

    seq(
      'pacote-voa',
      'pacote',
      7.8,
      0.8,
      [
        ch('position.x', -2.4, PKG.x), ch('position.z', 1.7, -0.64),
        ch('rotation.x', -3.4, 0), ch('rotation.z', 1.6, 0),
      ],
      {
        ease: 'linear',
        caption: 'Nem dá tempo: o entregador arremessa a caixa escada acima — É… MÚT! — e ela afunda no meio da teia.',
      },
    ),
    seq('pacote-sobe', 'pacote', 7.8, 0.8, [ch('position.y', 0.35, PKG.y)], { ease: 'easeOut' }),
    seq('etiqueta-tremula', 'etiqueta', 7.8, 0.8, [ch('rotation.z', 0.3, 0)]),
    seq('pacote-afunda', 'pacote', 8.6, 0.3, [ch('position.z', -0.64, PKG.z)], { ease: 'easeOut' }),
    seq('teia-estica', 'teia', 8.6, 0.16, [ch('scale.z', 1, 1.9)], { ease: 'easeOut' }),
    seq('teia-volta', 'teia', 8.76, 0.45, [ch('scale.z', 1.9, 1)]),
    seq('aneis-baque', 'aneis', 8.6, 0.55, ONE(0.3, 1), { ease: 'easeOut' }),
    seq('pedacoO-rasga', 'pedacoO', 8.6, 0.12, ONE(0.01, 1), { ease: 'easeOut' }),
    seq('abraco-fecha', 'abraco', 8.7, 0.35, [ch('scale.x', 1.18, 1)], { ease: 'easeOut' }),

    seq(
      'pedacoO-cai',
      'pedacoO',
      9.9,
      1.1,
      [
        ch('position.x', O_INI.x, O_FIM.x), ch('position.y', O_INI.y, O_FIM.y),
        ch('position.z', O_INI.z, O_FIM.z),
        ch('rotation.x', 0, O_TILT), ch('rotation.y', -Math.PI * 2, 0),
        ch('rotation.z', 0, 0.35),
      ],
      {
        caption: "No tombo, a etiqueta rasgou: o seu apelido MITO perdeu o O e virou MIT' — é MEU!",
      },
    ),
    seq('etiqueta-pulsa', 'etiqueta', 9.9, 0.3, [ch('scale.x', 1, 1.25), ch('scale.y', 1, 1.25)], {
      ease: 'easeOut',
    }),
    seq('etiqueta-volta', 'etiqueta', 10.2, 0.35, [ch('scale.x', 1.25, 1), ch('scale.y', 1.25, 1)]),

    seq('seda-enrola', 'seda', 11.6, 0.8, [ch('scale.x', 0.01, 1), ch('rotation.x', -3.0, 0)], {
      ease: 'easeOut',
      caption: 'Ela enrola o PACOTE (PA-KÊT) em seda com quatro patas e acena com as outras quatro.',
    }),
    seq('acenoE-a', 'acenoE', 11.7, 0.3, [ch('rotation.z', 0, 0.35)]),
    seq('acenoE-b', 'acenoE', 12.0, 0.28, [ch('rotation.z', 0.35, -0.1)]),
    seq('acenoE-c', 'acenoE', 12.28, 0.28, [ch('rotation.z', -0.1, 0.3)]),
    seq('acenoE-d', 'acenoE', 12.56, 0.3, [ch('rotation.z', 0.3, 0)]),
    seq('acenoD-a', 'acenoD', 11.82, 0.3, [ch('rotation.z', 0, -0.35)]),
    seq('acenoD-b', 'acenoD', 12.12, 0.28, [ch('rotation.z', -0.35, 0.1)]),
    seq('acenoD-c', 'acenoD', 12.4, 0.28, [ch('rotation.z', 0.1, -0.3)]),
    seq('acenoD-d', 'acenoD', 12.68, 0.3, [ch('rotation.z', -0.3, 0)]),

    seq('lacinho-balanca', 'lacinho', 13.4, 0.25, [ch('rotation.z', -0.25, -0.5)], {
      caption: 'Kan du ta emot mitt paket? — Você pode receber meu pacote?',
    }),
    seq('lacinho-assenta', 'lacinho', 13.65, 0.3, [ch('rotation.z', -0.5, -0.25)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 1.9, 4.05], target: [-0.1, 1.5, -0.6] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-du-ta-emot-mitt-paket',
    contexto:
      'Vizinhos: no corredor do prédio, antes de viajar ou trabalhar, quando a entrega vem direto pra casa (hemleverans). Também no trabalho, pedindo pra um colega pegar algo que chega na recepção.',
    fraseFonte: 'Você pode receber meu pacote?',
    fraseAlvo: 'Kan du ta emot mitt paket?',
    pronuncia:
      "kan dü ta e-MÚUT mit pa-KÊÊT? ('du' com bico de pato; 'ta emot' é um verbo só, receber, e a força cai no MOT: O soando U fechado e longo, T seco; 'mitt' curtinho; 'paket' com a força no KÊ, Ê fechado e longo, e T seco no fim)",
    ponteSonora:
      "CAN-DU, TÁ É-MÚT... MIT' PA-KÊT? (7 sílabas: kan-dü-ta-e-MÚUT-mit-pa-KÊÊT; tônicas em MÚUT e KÊÊT; CAN-DU é o 'kan du' de sempre — C+A+N como em 'cana', sem o glide de 'quando', e o DU com BICO DE PATO; TÁ = o 'ta' (pegar), o mesmo TÁ de 'Kan du ta det en gång till?' e 'Ta med, tack': A aberto e sem força; É-MÚT = 'emot', que é o 'mot' com um É na frente: o É fraquinho e curto, e a pancada no MÚT, o MESMO MUT de 'Jag är allergisk mot penicillin' — lá o baque surdo da cabeçada, aqui o do pacote afundando na teia: U FECHADO e LONGO e T seco no fim; com Ó aberto ('e-MÓT') a vogal sai errada; 'ta emot' é um verbo só, receber; MIT' = o MITO com o O arrancado, o mesmo de 'Förlåt, det var mitt fel' e 'Mitt personnummer är...': I curto e a língua travada no T; PA-KÊT = o PACOTE do ET de 'Jag ska hämta ut ett paket', dito à sueca: a força no KÊ, Ê FECHADO e longo de 'você', T seco e SEM o -e — nunca 'pa-CÓ-tchi')",
    historia:
      "Você viaja amanhã cedo e a sua encomenda chega justo quando a casa vai estar vazia. Bate na porta ao lado — a vizinha é uma aranha peluda que transformou o patamar inteiro numa teia — e pergunta, de mala na mão: CAN-DU, TÁ...? Nem dá tempo de terminar: o entregador arremessa a caixa escada acima e — É... MÚT! — ela afunda bem no meio da teia, com um baque surdo. Na etiqueta, rasgada no tombo, o seu apelido no prédio, MITO, perdeu o O e ficou MIT' — 'é MEU!', você aponta; a aranha enrola o PACOTE em seda com quatro patas e acena com as outras quatro: pode viajar tranquilo, ela recebe a sua encomenda.",
  },
  createScene,
  refine: { organic: ['aranha', 'abraco', 'acenoE', 'acenoD'] },
}

export default card
