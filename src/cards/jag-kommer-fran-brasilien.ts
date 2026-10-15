import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, torus, lathe, person, shoulderPivot, mat,
} from '../rig/helpers'

/**
 * "Jag kommer från Brasilien." — IÁ! CÓ-MER FRÔN... BRASÍLI-EN!
 *
 * Na esteira de bagagens de Arlanda desce um panda gigante com uma FRONHA
 * verde-amarela estufada nas costas. Em vez de bambu, ele trouxe pra CÓ-MER
 * uma BRASÍLIA amarela inteira: arrancou o para-choque e rói feito talo de
 * bambu. Na traseira, a placa sueca diz BRASILIEN — o -A virou -EN. O fiscal
 * da alfândega ergue o passaporte e pergunta de onde ele vem.
 *
 * Diorama: piso de aeroporto em placas, esteira de bagagens na diagonal
 * (o panda no fundo, a Brasília vindo com a traseira para a câmera), fiscal
 * de quepe à esquerda, malas de outros passageiros no chão.
 */

const FLOOR = '#c9cdd2'
const FLOOR_LINE = '#a9afb6'
const RIM = '#5d636b'
const STEEL = '#9aa2aa'
const BELT = '#1f1f24'
const SLAT = '#3a3a42'
const CHROME = '#dfe3e8'
const WHITE = '#f1eee6'
const BLACK = '#262329'
const YELLOW = '#f6c21c' // acento saturado RESERVADO: a Brasília (e a placa nela)
const YELLOW_DARK = '#d9a514'
const GLASS = '#86bddc'
const GREEN = '#2f8a4c'
const GOLD = '#f0c93a'
const ROPE = '#8a5a32'
const NAVY = '#22305a'
const CAP_BLUE = '#2d4f94'
const SKIN = '#e3b48c'
const PASSPORT = '#b3262e'
const INK = '#1b2647'

const FY = 0.14 // topo do piso
const BT = 0.46 // superfície da esteira
const PHI = -0.55 // a esteira corre na diagonal: +u aponta para a frente-esquerda
const DIR = new THREE.Vector3(Math.sin(PHI), 0, Math.cos(PHI))
const SIDE = new THREE.Vector3(Math.cos(PHI), 0, -Math.sin(PHI))

/** Ponto do diorama em coordenadas da esteira (u ao longo, v de lado). */
function onBelt(u: number, v = 0) {
  return DIR.clone().multiplyScalar(u).addScaledVector(SIDE, v)
}

const CAR_U = 0.35
const CAR_L = 2.1
const CAR_W = 1.1
const PANDA_U = -1.5
const PANDA_ROT = -0.42
const FISCAL_POS = new THREE.Vector3(-1.95, FY, -0.75)
const PANDA_S = 1.08

/** Cápsula esticada entre dois pontos (braços que seguram algo). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(d.length() - r, 0.01), color, { roughness: 0.9 })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Letra de traço grosso da placa, no plano xy, virada para +z. */
function glyph(c: string) {
  const g = new THREE.Group()
  const w = 0.066
  const h = 0.15
  const t = 0.024
  const s = (sw: number, sh: number, x: number, y: number, rot = 0) => {
    const m = rbox(sw, sh, 0.014, 0.005, INK, { roughness: 0.5, detail: 0 })
    m.position.set(x, y, 0)
    m.rotation.z = rot
    g.add(m)
  }
  const L = -w / 2 + t / 2
  const R = w / 2 - t / 2
  const T = h / 2 - t / 2
  const B = -h / 2 + t / 2
  switch (c) {
    case 'B':
      s(t, h, L, 0)
      s(w - t * 0.6, t, -t * 0.3, T)
      s(w - t * 0.6, t, -t * 0.3, 0)
      s(w - t * 0.6, t, -t * 0.3, B)
      s(t, h / 2 - t * 0.6, R, h / 4)
      s(t, h / 2 - t * 0.6, R, -h / 4)
      break
    case 'R': {
      s(t, h, L, 0)
      s(w - t * 0.6, t, -t * 0.3, T)
      s(w - t * 0.6, t, -t * 0.3, 0.004)
      s(t, h / 2 - t * 0.4, R, h / 4)
      const len = Math.hypot(w - t, h / 2)
      s(t, len, 0.006, -h / 4, Math.atan2(w - t, h / 2) * 0.9)
      break
    }
    case 'A': {
      const ang = Math.atan2(w / 2 - t / 2, h)
      const len = Math.hypot(w / 2, h)
      s(t, len, -w / 4 + t / 4, 0, -ang)
      s(t, len, w / 4 - t / 4, 0, ang)
      s(w * 0.55, t * 0.85, 0, -h * 0.16)
      break
    }
    case 'S':
      s(w, t, 0, T)
      s(w, t, 0, 0)
      s(w, t, 0, B)
      s(t, h / 2, L, h / 4)
      s(t, h / 2, R, -h / 4)
      break
    case 'I':
      s(t, h, 0, 0)
      break
    case 'L':
      s(t, h, L, 0)
      s(w, t, 0, B)
      break
    case 'E':
      s(t, h, L, 0)
      s(w, t, 0, T)
      s(w * 0.82, t, -w * 0.09, 0)
      s(w, t, 0, B)
      break
    case 'N': {
      s(t, h, L, 0)
      s(t, h, R, 0)
      s(t, Math.hypot(w - t, h) * 0.98, 0, 0, Math.atan2(w - t, h))
      break
    }
  }
  return g
}

/** Meia-lua escura: marca de dente recortada na borda de cima de uma barra. */
function bite(r: number, depth: number) {
  const geo = new THREE.CylinderGeometry(r, r, depth, 24, 1, false, -Math.PI / 2, Math.PI)
  const m = new THREE.Mesh(geo, mat('#3c4047', { roughness: 0.8 }))
  m.rotation.x = Math.PI / 2
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: piso de aeroporto em placas -----------------------------------
  const base = new THREE.Group()

  const rim = cylinder(2.66, 2.74, 0.08, RIM, { roughness: 0.6 })
  rim.position.y = 0.04
  base.add(rim)

  const floor = cylinder(2.6, 2.64, 0.06, FLOOR, { roughness: 0.35 })
  floor.position.y = 0.11
  base.add(floor)

  // juntas das placas quadradas: cordas do círculo nas duas direções
  for (let i = -4; i <= 4; i++) {
    const k = i * 0.58
    const len = 2 * Math.sqrt(Math.max(2.56 * 2.56 - k * k, 0.01))
    const a = rbox(len, 0.006, 0.022, 0.003, FLOOR_LINE, { roughness: 0.5 })
    a.position.set(0, FY + 0.003, k)
    base.add(a)
    const b = rbox(0.022, 0.006, len, 0.003, FLOOR_LINE, { roughness: 0.5 })
    b.position.set(k, FY + 0.003, 0)
    base.add(b)
  }

  // malas de outros passageiros, no chão
  const malas: [number, number, string, number, number, number][] = [
    [1.55, 1.05, '#3f6d8f', 0.46, 0.62, 0.24],
    [2.02, 0.42, '#7a3240', 0.36, 0.48, 0.2],
  ]
  for (const [mx, mz, cor, mw, mh, md] of malas) {
    const mala = new THREE.Group()
    mala.position.set(mx, FY, mz)
    mala.rotation.y = -0.5 + rand() * 0.4
    const corpo = rbox(mw, mh, md, 0.05, cor, { roughness: 0.45 })
    corpo.position.y = mh / 2 + 0.04
    mala.add(corpo)
    for (const sx of [-1, 1]) {
      const ro = cylinder(0.03, 0.03, 0.03, BLACK, { roughness: 0.6 }, 16)
      ro.rotation.x = Math.PI / 2
      ro.position.set(sx * (mw / 2 - 0.05), 0.03, md / 2 - 0.04)
      mala.add(ro)
      const haste = cylinder(0.012, 0.012, 0.22, STEEL, { roughness: 0.3, metalness: 0.8 })
      haste.position.set(sx * 0.08, mh + 0.15, 0)
      mala.add(haste)
    }
    const pega = rbox(0.2, 0.03, 0.03, 0.012, BLACK, { roughness: 0.6 })
    pega.position.set(0, mh + 0.26, 0)
    mala.add(pega)
    const friso = rbox(mw + 0.01, 0.03, md + 0.01, 0.012, '#2b2b30', { roughness: 0.6 })
    friso.position.y = mh * 0.55 + 0.04
    mala.add(friso)
    base.add(mala)
  }

  // pedestal de fila com fita (canto esquerdo da frente)
  for (const [px, pz] of [[-2.3, 0.3], [-1.95, 1.15]] as const) {
    const pe = cylinder(0.13, 0.15, 0.03, STEEL, { roughness: 0.3, metalness: 0.8 })
    pe.position.set(px, FY + 0.015, pz)
    base.add(pe)
    const poste = cylinder(0.025, 0.025, 0.8, STEEL, { roughness: 0.3, metalness: 0.8 })
    poste.position.set(px, FY + 0.42, pz)
    base.add(poste)
    const topo = sphere(0.04, STEEL, { roughness: 0.3, metalness: 0.8 })
    topo.position.set(px, FY + 0.83, pz)
    base.add(topo)
  }
  const fita = rbox(0.92, 0.06, 0.01, 0.004, '#3a5a9a', { roughness: 0.6 })
  fita.position.set(-2.125, FY + 0.74, 0.725)
  fita.rotation.y = -Math.atan2(0.85, 0.35)
  base.add(fita)

  root.add(base)

  // ---- esteira de bagagens na diagonal -------------------------------------
  const esteira = new THREE.Group()
  esteira.position.copy(onBelt(-0.25))
  esteira.rotation.y = PHI
  const BELT_LEN = 4.1

  const chassi = rbox(1.62, BT - 0.06 - FY, BELT_LEN, 0.1, STEEL, { roughness: 0.35, metalness: 0.6 })
  chassi.position.y = FY + (BT - 0.06 - FY) / 2
  esteira.add(chassi)

  const saia = rbox(1.66, 0.06, BELT_LEN + 0.04, 0.03, '#4a4f56', { roughness: 0.6 })
  saia.position.y = FY + 0.03
  esteira.add(saia)

  const lona = rbox(1.36, 0.07, BELT_LEN - 0.12, 0.03, BELT, { roughness: 0.8 })
  lona.position.y = BT - 0.035
  esteira.add(lona)

  // ripas da esteira
  for (let z = -BELT_LEN / 2 + 0.2; z < BELT_LEN / 2 - 0.1; z += 0.26) {
    const ripa = rbox(1.32, 0.008, 0.03, 0.004, SLAT, { roughness: 0.7 })
    ripa.position.set(0, BT + 0.002, z)
    esteira.add(ripa)
  }

  // bordas prateadas
  for (const sx of [-1, 1]) {
    const borda = rbox(0.12, 0.08, BELT_LEN, 0.035, CHROME, { roughness: 0.2, metalness: 0.85 })
    borda.position.set(sx * 0.75, BT - 0.01, 0)
    esteira.add(borda)
  }
  root.add(esteira)

  // ---- PANDA gigante (de pé na esteira, olhando para a câmera) -------------
  const panda = new THREE.Group()
  panda.position.copy(onBelt(PANDA_U, 0.05))
  panda.position.y = BT
  panda.rotation.y = PANDA_ROT
  panda.scale.setScalar(PANDA_S)
  root.add(panda)

  for (const sx of [-1, 1]) {
    const pe = sphere(0.25, BLACK, { roughness: 0.9 })
    pe.scale.set(1, 0.55, 1.3)
    pe.position.set(sx * 0.3, 0.12, 0.1)
    panda.add(pe)
    const perna = capsule(0.24, 0.32, BLACK, { roughness: 0.9 })
    perna.position.set(sx * 0.3, 0.43, 0)
    panda.add(perna)
  }

  const quadril = sphere(0.62, WHITE, { roughness: 0.9 })
  quadril.scale.set(1.05, 0.86, 0.95)
  quadril.position.y = 0.82
  panda.add(quadril)

  const tronco = capsule(0.56, 0.4, WHITE, { roughness: 0.9 })
  tronco.scale.z = 0.92
  tronco.position.y = 1.22
  panda.add(tronco)

  // faixa preta dos ombros (a "sela" do panda)
  const faixa = capsule(0.31, 0.72, BLACK, { roughness: 0.9 })
  faixa.rotation.z = Math.PI / 2
  faixa.position.set(0, 1.52, -0.05)
  panda.add(faixa)

  const cauda = sphere(0.13, WHITE, { roughness: 0.9 })
  cauda.position.set(0, 0.75, -0.6)
  panda.add(cauda)

  // geometria da pegada: o para-choque atravessado na boca, como espiga de
  // milho / talo de bambu, uma pata em cada lado
  const BAR_LEN = 1.3
  const barMid = new THREE.Vector3(0.04, 1.69, 0.56)
  const barAxis = new THREE.Vector3(1, 0.14, 0).normalize()
  const paws = [-0.43, 0.43].map((k) => barMid.clone().addScaledVector(barAxis, k))

  for (const [shoulder, paw] of [
    [new THREE.Vector3(-0.5, 1.46, 0.1), paws[0]],
    [new THREE.Vector3(0.5, 1.46, 0.1), paws[1]],
  ] as const) {
    const grip = paw.clone().add(new THREE.Vector3(0, -0.05, -0.04))
    panda.add(limb(shoulder, grip, 0.17, BLACK))
    const mao = sphere(0.15, BLACK, { roughness: 0.9 })
    mao.scale.set(0.9, 1, 1.1)
    mao.position.copy(grip)
    panda.add(mao)
  }

  // ---- cabeça (peça própria: mastiga) --------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.99, 0.04)
  panda.add(cabeca)

  const cranio = sphere(0.46, WHITE, { roughness: 0.9 })
  cranio.scale.set(1.1, 0.95, 0.95)
  cabeca.add(cranio)

  const focinho = sphere(0.2, WHITE, { roughness: 0.9 })
  focinho.scale.set(1.15, 0.78, 0.85)
  focinho.position.set(0, -0.16, 0.34)
  cabeca.add(focinho)

  const nariz = sphere(0.065, BLACK, { roughness: 0.35 })
  nariz.scale.set(1.3, 0.8, 1)
  nariz.position.set(0, -0.08, 0.52)
  cabeca.add(nariz)

  const boca = sphere(0.1, '#4a2026', { roughness: 0.5 })
  boca.scale.set(1.2, 0.7, 0.5)
  boca.position.set(0, -0.27, 0.43)
  cabeca.add(boca)

  for (const sx of [-1, 1]) {
    const orelha = sphere(0.15, BLACK, { roughness: 0.9 })
    orelha.scale.z = 0.6
    orelha.position.set(sx * 0.36, 0.36, -0.04)
    cabeca.add(orelha)

    const mancha = sphere(0.12, BLACK, { roughness: 0.9 })
    mancha.scale.set(0.85, 1.2, 0.5)
    mancha.position.set(sx * 0.17, 0.04, 0.38)
    mancha.rotation.z = sx * 0.5
    cabeca.add(mancha)

    const olho = sphere(0.048, '#ffffff', { roughness: 0.25 })
    olho.position.set(sx * 0.165, 0.07, 0.445)
    olho.scale.z = 0.6
    const pupila = sphere(0.026, '#111111', { roughness: 0.2 })
    pupila.position.set(sx * 0.16, 0.07, 0.473)
    cabeca.add(olho, pupila)

    // bochechas estufadas: boca cheia
    const bochecha = sphere(0.16, WHITE, { roughness: 0.9 })
    bochecha.position.set(sx * 0.24, -0.17, 0.24)
    cabeca.add(bochecha)
  }

  // ---- fronha verde-amarela estufada nas costas (FRÔN) ---------------------
  // grupo com pivô no meio do tronco: a fronha "estufa" de dentro do panda
  const fronha = new THREE.Group()
  fronha.position.set(0, 1.2, 0)
  panda.add(fronha)

  const travesseiro = new THREE.Group()
  travesseiro.position.set(0, 0.32, -0.66)
  travesseiro.rotation.x = -0.15
  fronha.add(travesseiro)

  const almofada = rbox(1.7, 1.0, 0.56, 0.27, GREEN, { roughness: 0.92 })
  travesseiro.add(almofada)
  const listra = rbox(1.72, 0.2, 0.58, 0.09, GOLD, { roughness: 0.9 })
  travesseiro.add(listra)
  for (const cx of [-1, 1]) {
    for (const cy of [-1, 1]) {
      const ponta = sphere(0.1, GREEN, { roughness: 0.92 })
      ponta.scale.set(1, 0.8, 0.7)
      ponta.position.set(cx * 0.84, cy * 0.47, 0)
      travesseiro.add(ponta)
    }
  }
  // corda: amarra a fronha passando pela barriga branca, nó na frente
  const corda = torus(0.6, 0.042, ROPE, { roughness: 0.9 })
  corda.rotation.x = Math.PI / 2
  corda.scale.set(1.0, 0.92, 1)
  corda.position.set(0, -0.18, -0.02)
  fronha.add(corda)
  const no = sphere(0.08, ROPE, { roughness: 0.9 })
  no.position.set(0.12, -0.2, 0.54)
  fronha.add(no)
  for (const sx of [-1, 1]) {
    const pontaCorda = capsule(0.03, 0.12, ROPE, { roughness: 0.9 })
    pontaCorda.position.set(0.12 + sx * 0.05, -0.3, 0.56)
    pontaCorda.rotation.z = sx * 0.4
    fronha.add(pontaCorda)
  }
  // alças por cima dos ombros
  for (const sx of [-1, 1]) {
    const alca = torus(0.36, 0.038, ROPE, { roughness: 0.9 })
    alca.rotation.y = Math.PI / 2
    alca.position.set(sx * 0.36, 0.28, -0.12)
    fronha.add(alca)
  }

  // ---- BRASÍLIA amarela (traseira para a câmera) ---------------------------
  const brasilia = new THREE.Group()
  brasilia.position.copy(onBelt(CAR_U))
  brasilia.position.y = BT
  brasilia.rotation.y = PHI // local +z = traseira
  root.add(brasilia)

  const caixa = rbox(CAR_W, 0.42, CAR_L, 0.12, YELLOW, { roughness: 0.3 })
  caixa.position.y = 0.33
  brasilia.add(caixa)

  const cabine = rbox(CAR_W - 0.08, 0.44, 1.34, 0.12, YELLOW, { roughness: 0.3 })
  cabine.position.set(0, 0.72, 0.33)
  brasilia.add(cabine)

  const teto = rbox(CAR_W - 0.16, 0.04, 1.2, 0.02, YELLOW_DARK, { roughness: 0.3, detail: 0.3 })
  teto.position.set(0, 0.95, 0.35)
  brasilia.add(teto)

  // vidros
  const parabrisa = rbox(0.86, 0.34, 0.03, 0.03, GLASS, { roughness: 0.1 })
  parabrisa.position.set(0, 0.73, -0.36)
  parabrisa.rotation.x = -0.4
  brasilia.add(parabrisa)

  const vidroTras = rbox(0.82, 0.28, 0.02, 0.04, GLASS, { roughness: 0.1 })
  vidroTras.position.set(0, 0.74, 1.005)
  brasilia.add(vidroTras)

  for (const sx of [-1, 1]) {
    for (const [wz, wl] of [[-0.02, 0.52], [0.66, 0.6]] as const) {
      const vidro = rbox(0.02, 0.26, wl, 0.04, GLASS, { roughness: 0.1 })
      vidro.position.set(sx * ((CAR_W - 0.08) / 2 + 0.005), 0.75, wz)
      brasilia.add(vidro)
    }
    // friso cromado lateral e maçaneta
    const friso = rbox(0.015, 0.03, CAR_L - 0.3, 0.01, CHROME, { roughness: 0.2, metalness: 0.85 })
    friso.position.set(sx * (CAR_W / 2 + 0.003), 0.4, 0)
    brasilia.add(friso)
    const porta = rbox(0.012, 0.36, 0.012, 0.004, YELLOW_DARK, { roughness: 0.4 })
    porta.position.set(sx * (CAR_W / 2 + 0.002), 0.36, 0.34)
    brasilia.add(porta)
    const macaneta = rbox(0.02, 0.025, 0.09, 0.01, CHROME, { roughness: 0.2, metalness: 0.85 })
    macaneta.position.set(sx * (CAR_W / 2 + 0.01), 0.47, 0.22)
    brasilia.add(macaneta)

    // rodas
    for (const wz of [-0.68, 0.68]) {
      const pneu = cylinder(0.18, 0.18, 0.15, BLACK, { roughness: 0.85 }, 28)
      pneu.rotation.z = Math.PI / 2
      pneu.position.set(sx * (CAR_W / 2 - 0.04), 0.18, wz)
      brasilia.add(pneu)
      const calota = cylinder(0.095, 0.095, 0.16, CHROME, { roughness: 0.2, metalness: 0.85 }, 24)
      calota.rotation.z = Math.PI / 2
      calota.position.set(sx * (CAR_W / 2 - 0.035), 0.18, wz)
      brasilia.add(calota)
    }

    // faróis redondos na frente
    const farol = cylinder(0.08, 0.08, 0.04, '#fff3cc', { roughness: 0.15 }, 24)
    farol.rotation.x = Math.PI / 2
    farol.position.set(sx * 0.36, 0.38, -CAR_L / 2 - 0.005)
    brasilia.add(farol)
    const aroFarol = torus(0.08, 0.014, CHROME, { roughness: 0.2, metalness: 0.85 })
    aroFarol.position.set(sx * 0.36, 0.38, -CAR_L / 2 - 0.02)
    brasilia.add(aroFarol)

    // suportes do para-choque arrancado
    const suporte = rbox(0.05, 0.05, 0.08, 0.01, '#55595f', { roughness: 0.5, metalness: 0.6 })
    suporte.position.set(sx * 0.36, 0.2, -CAR_L / 2 - 0.03)
    brasilia.add(suporte)

    // lanternas traseiras
    const lanterna = rbox(0.09, 0.2, 0.03, 0.02, '#c22a24', { roughness: 0.25 })
    lanterna.position.set(sx * 0.49, 0.42, CAR_L / 2 + 0.005)
    brasilia.add(lanterna)
  }

  const paraTras = rbox(CAR_W + 0.04, 0.07, 0.09, 0.03, CHROME, { roughness: 0.2, metalness: 0.85 })
  paraTras.position.set(0, 0.16, CAR_L / 2 + 0.02)
  brasilia.add(paraTras)

  // ---- placa sueca BRASILIEN (peça filha do carro) -------------------------
  const placa = new THREE.Group()
  placa.position.set(0, 0.34, CAR_L / 2 + 0.02)
  brasilia.add(placa)

  const moldura = rbox(0.96, 0.25, 0.03, 0.03, BLACK, { roughness: 0.5 })
  placa.add(moldura)
  const fundo = rbox(0.93, 0.22, 0.02, 0.02, '#f7f7f4', { roughness: 0.4, detail: 0 })
  fundo.position.z = 0.012
  placa.add(fundo)
  const eu = rbox(0.075, 0.22, 0.02, 0.015, '#1f4aa8', { roughness: 0.4, detail: 0 })
  eu.position.set(-0.425, 0, 0.016)
  placa.add(eu)
  const estrela = sphere(0.014, '#f2d23a', { roughness: 0.4, detail: 0 })
  estrela.position.set(-0.425, 0.055, 0.03)
  placa.add(estrela)
  const word = 'BRASILIEN'
  const pitch = 0.087
  word.split('').forEach((c, i) => {
    const l = glyph(c)
    l.position.set(-0.335 + i * pitch + 0.04, 0, 0.025)
    placa.add(l)
  })

  // ---- para-choque dianteiro arrancado, roído (peça: voa do carro à boca) --
  const parachoque = new THREE.Group()
  const barra = rbox(BAR_LEN, 0.15, 0.13, 0.055, '#cfd5dc', { roughness: 0.22, metalness: 0.45 })
  parachoque.add(barra)
  const borracha = rbox(BAR_LEN - 0.04, 0.04, 0.135, 0.015, BLACK, { roughness: 0.7 })
  borracha.position.y = -0.02
  parachoque.add(borracha)
  // marcas de mordida dos dois lados da boca e na ponta roída
  for (const [bx, br] of [[-0.62, 0.09], [-0.22, 0.08], [0.22, 0.08]] as const) {
    const marca = bite(br, 0.142)
    marca.position.set(bx, 0.075, 0)
    parachoque.add(marca)
  }
  root.add(parachoque)

  // pose final: nas patas do panda, atravessado na boca
  root.updateMatrixWorld(true)
  const alvo = new THREE.Object3D()
  alvo.position.copy(barMid)
  // a barra (eixo x) atravessada; marcas de dente para cima e para a câmera
  const bx = barAxis.clone()
  const bz = new THREE.Vector3(0, 0.45, 1).addScaledVector(bx, -bx.dot(new THREE.Vector3(0, 0.45, 1))).normalize()
  const by = new THREE.Vector3().crossVectors(bz, bx)
  alvo.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(bx, by, bz))
  panda.add(alvo)
  panda.updateMatrixWorld(true)
  const endPos = new THREE.Vector3()
  const endQ = new THREE.Quaternion()
  alvo.getWorldPosition(endPos)
  alvo.getWorldQuaternion(endQ)
  panda.remove(alvo)
  const endRot = new THREE.Euler().setFromQuaternion(endQ)

  // pose inicial: no lugar, na frente do carro
  const startPos = new THREE.Vector3(0, 0.2, -CAR_L / 2 - 0.08).applyMatrix4(brasilia.matrixWorld)
  const startRot = new THREE.Euler(0, PHI, 0)

  parachoque.position.copy(endPos)
  parachoque.rotation.copy(endRot)

  // ---- fiscal da alfândega -------------------------------------------------
  const fiscal = person({ body: NAVY, skin: SKIN, height: 1.5, armAngle: 0.4 })
  fiscal.position.copy(FISCAL_POS)
  fiscal.rotation.y = 1.2 // olha para o panda, de perfil para a câmera
  root.add(fiscal)

  const cinto = torus(0.258, 0.03, '#15192a', { roughness: 0.6 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.3
  fiscal.add(cinto)
  for (const by of [0.42, 0.52, 0.62]) {
    const botao = sphere(0.022, '#c9cdd2', { roughness: 0.3, metalness: 0.7 })
    botao.position.set(0, by, 0.25)
    fiscal.add(botao)
  }

  const cabecaFiscal = fiscal.getObjectByName('head') as THREE.Group
  const quepe = new THREE.Group()
  quepe.position.set(0, 0.17, 0)
  const copa = lathe(
    [[0, 0], [0.27, 0], [0.29, 0.07], [0.34, 0.15], [0.33, 0.18], [0, 0.19]],
    CAP_BLUE,
    { roughness: 0.6 },
  )
  quepe.add(copa)
  const faixaQuepe = cylinder(0.282, 0.282, 0.06, '#141826', { roughness: 0.6 })
  faixaQuepe.position.y = 0.04
  quepe.add(faixaQuepe)
  const aba = cylinder(0.2, 0.2, 0.025, '#141826', { roughness: 0.35 })
  aba.scale.z = 0.6
  aba.position.set(0, 0.0, 0.25)
  aba.rotation.x = 0.25
  quepe.add(aba)
  const distintivo = sphere(0.035, '#d8b45a', { roughness: 0.3, metalness: 0.7 })
  distintivo.scale.z = 0.5
  distintivo.position.set(0, 0.11, 0.3)
  quepe.add(distintivo)
  cabecaFiscal.add(quepe)

  // braço do lado da câmera ergue o passaporte vermelho
  const bracoFiscal = fiscal.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoFiscal, 1.5)
  bracoFiscal.rotation.z = -2.75 // pose final: mão erguida
  const mao = bracoFiscal.children[0]
  const passaporte = new THREE.Group()
  passaporte.position.copy(mao.position).add(new THREE.Vector3(0, -0.13, 0.02))
  const capa = rbox(0.14, 0.19, 0.03, 0.012, PASSPORT, { roughness: 0.6 })
  passaporte.add(capa)
  const brasao = sphere(0.025, '#d8b45a', { roughness: 0.4, metalness: 0.5 })
  brasao.scale.z = 0.3
  brasao.position.set(0, 0.02, 0.016)
  passaporte.add(brasao)
  passaporte.rotation.set(0, Math.PI / 2, Math.PI)
  bracoFiscal.add(passaporte)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'aeroporto', object: base },
    { name: 'esteira', group: 'aeroporto', object: esteira },
    { name: 'panda', group: 'panda', object: panda },
    { name: 'cabeca', group: 'panda', object: cabeca },
    { name: 'fronha', group: 'fronha', object: fronha },
    { name: 'brasilia', group: 'brasilia', object: brasilia },
    { name: 'parachoque', group: 'brasilia', object: parachoque },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'fiscal', group: 'fiscal', object: fiscal },
    { name: 'bracoFiscal', group: 'fiscal', object: bracoFiscal },
  ]

  // ---- montagem ------------------------------------------------------------
  const sc = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]
  const startY = startPos.y
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Aeroporto de Arlanda: sobe o piso e a esteira de bagagens começa a rodar…',
    }),
    seq('esteira-rise', 'esteira', 0.3, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),

    seq('panda-desce', 'panda', 1.6, 0.6, [ch('position.y', BT + 3.6, BT)], {
      ease: 'easeIn',
      caption: 'E pela esteira desce um panda GIGANTE…',
    }),
    seq('panda-quica', 'panda', 2.2, 0.15, [ch('scale.y', PANDA_S, PANDA_S * 0.9)], { ease: 'easeOut' }),
    seq('panda-assenta', 'panda', 2.35, 0.25, [ch('scale.y', PANDA_S * 0.9, PANDA_S)], { ease: 'easeOut' }),
    seq('cabeca-olha', 'cabeca', 1.6, 1.2, [ch('rotation.y', -0.5, 0)], { ease: 'easeInOut' }),

    seq('fronha-estufa', 'fronha', 3.1, 0.7, sc(0.01, 1), {
      ease: 'easeOut',
      caption: '…com uma FRONHA verde-amarela estufada nas costas: FRÔN!',
    }),

    seq('brasilia-desce', 'brasilia', 4.6, 0.55, [ch('position.y', BT + 3.2, BT)], {
      ease: 'easeIn',
      caption: 'Em vez de bambu, ele trouxe pra CÓ-MER uma BRASÍLIA amarela inteira!',
    }),
    seq('brasilia-quica', 'brasilia', 5.15, 0.15, [ch('scale.y', 1, 0.92)], { ease: 'easeOut' }),
    seq('brasilia-assenta', 'brasilia', 5.3, 0.25, [ch('scale.y', 0.92, 1)], { ease: 'easeOut' }),
    seq('parachoque-desce', 'parachoque', 4.6, 0.55, [ch('position.y', startY + 3.2, startY)], {
      ease: 'easeIn',
    }),

    seq(
      'parachoque-arranca',
      'parachoque',
      6.3,
      0.7,
      [
        ch('position.x', startPos.x, endPos.x),
        ch('position.y', startY, endPos.y),
        ch('position.z', startPos.z, endPos.z),
        ch('rotation.x', startRot.x, endRot.x),
        ch('rotation.y', startRot.y, endRot.y),
        ch('rotation.z', startRot.z, endRot.z),
      ],
      {
        ease: 'easeInOut',
        caption: 'Arranca o para-choque e rói feito talo de bambu: CÓ-MER!',
      },
    ),
    seq('mastiga-1', 'cabeca', 7.05, 0.22, [ch('rotation.x', 0, 0.14)], { ease: 'easeOut' }),
    seq('mastiga-2', 'cabeca', 7.27, 0.22, [ch('rotation.x', 0.14, 0)], { ease: 'easeIn' }),
    seq('mastiga-3', 'cabeca', 7.5, 0.22, [ch('rotation.x', 0, 0.14)], { ease: 'easeOut' }),
    seq('mastiga-4', 'cabeca', 7.72, 0.22, [ch('rotation.x', 0.14, 0)], { ease: 'easeIn' }),

    seq('placa-surge', 'placa', 8.4, 0.6, [...sc(0.01, 1), ch('rotation.z', 0.5, 0)], {
      ease: 'easeOut',
      caption: 'Na traseira, placa sueca novinha: BRASILIEN — na Suécia, até a Brasília termina em -EN.',
    }),

    seq('fiscal-rise', 'fiscal', 10.0, 0.8, [riseFrom(FY, 1.6)], {
      ease: 'easeOut',
      caption: 'O fiscal da alfândega ergue o passaporte: de onde o senhor vem?',
    }),
    seq('braco-ergue', 'bracoFiscal', 10.6, 0.6, [ch('rotation.z', 0.4, -2.75)], { ease: 'easeOut' }),

    seq('fronha-bate', 'fronha', 11.6, 0.18, [ch('scale.y', 1, 0.88)], {
      ease: 'easeOut',
      caption: 'O panda bate na fronha e responde de boca cheia: IÁ! CÓ-MER FRÔN BRASÍLIEN!',
    }),
    seq('fronha-volta', 'fronha', 11.78, 0.3, [ch('scale.y', 0.88, 1)], { ease: 'easeOut' }),
    seq('mastiga-5', 'cabeca', 11.7, 0.25, [ch('rotation.x', 0, 0.14)], { ease: 'easeOut' }),
    seq('mastiga-6', 'cabeca', 11.95, 0.25, [ch('rotation.x', 0.14, 0)], { ease: 'easeIn' }),

    seq('placa-pisca', 'placa', 13.0, 0.5, [ch('rotation.z', 0.06, 0)], {
      ease: 'easeOut',
      caption: 'Jag kommer från Brasilien. — Eu sou do Brasil.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.0, 3.0, 5.7], target: [0.1, 1.3, -0.35] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-kommer-fran-brasilien',
    contexto:
      'A resposta padrão quando perguntam de onde você é: no trabalho, na förskola, no SFI, no cabeleireiro, no vizinho do elevador.',
    fraseFonte: 'Eu sou do Brasil.',
    fraseAlvo: 'Jag kommer från Brasilien.',
    pronuncia:
      "iá KÓM-mer frôn bra-SÍ-li-en ('jag' = iá, o -g não soa; 'kommer' com O ABERTO e força no KÓM; 'från' com ô fechado e sem nasal; Brasilien com S de cobra, nunca Z, e força no SÍ)",
    ponteSonora:
      "IÁ! CÓ-MER FRÔN... BRASÍLI-EN! (8 sílabas: iá-KÓ-mer-frôn-bra-SÍ-li-en; tônicas em CÓ e SÍ; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado; CÓ-MER é o MESMO 'comer' de 'Hur kommer jag till?' — mas com a força no CÓ, Ó ABERTO, e o -MER fraquinho com R BRANDO: nunca 'co-MÊR' à portuguesa; FRÔN é a FRÔNha sem o -nha, o mesmo FRÔN de 'Vilket spår går tåget från?': Ô FECHADO e N batido na língua, sem a nasal de 'fronha'; BRASÍLI-EN é a BRASÍLIA que imigrou e ganhou PLACA SUECA — na placa está escrito BRASILIEN: o -A final NÃO cai, ele VIRA -EN (4 sílabas, bra-SÍ-li-en; nunca 'brasíli' cortado como o HUNGRI mordido de 'Jag är hungrig'); força no SÍ igualzinho à Brasília, S de COBRA, nunca o Z de 'brazil'; o EN é curto, com N na língua e sem nasal)",
    historia:
      'Na esteira de bagagens de Arlanda desce um panda gigante com uma FRONHA verde-amarela estufada amarrada nas costas, a única mala que ele trouxe. Em vez de bambu, ele trouxe pra CÓ-MER uma BRASÍLIA amarela inteira — e já está roendo o para-choque da frente feito talo de bambu. Mas a traseira está intacta, com placa sueca novinha: BRASILIEN — na Suécia até a Brasília termina em -EN. O fiscal da alfândega pergunta de onde ele vem; o panda bate na fronha, aponta a placa e responde de boca cheia: IÁ! CÓ-MER FRÔN BRASÍLIEN! — eu sou do Brasil.',
  },
  createScene,
  refine: { organic: ['panda', 'cabeca'] },
}

export default card
