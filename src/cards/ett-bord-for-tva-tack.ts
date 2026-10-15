import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Ett bord för två, tack." — ÉT! BÚR'D... FÖ T'VÔO! TAC!
 *
 * Na porta do restaurante, o maître é um BURRO de gravata-borboleta com um
 * crachá dourado no peito: BÚR'D (o D é obrigatório). A mesa redonda já chega
 * montada no lombo dele, presa na cangalha — toalha branca, vela acesa, dois
 * pratos. Ele estica o beiço num bico e sopra um beijinho, FÖ!, que solta as
 * DUAS cadeiras penduradas: elas saem em T'VÔO, uma pra cada lado, e cravam
 * os pés no assoalho: TAC!
 *
 * Diorama: assoalho cor de mel, tapete vermelho da entrada e o púlpito do
 * maître ao fundo. Acento saturado RESERVADO: o crachá dourado BÚR'D.
 */

const PISO = '#c48e52'
const PISO_LINHA = '#9f6c3a'
const PISO_BORDA = '#6b4a2e'
const TAPETE = '#6e1c28'
const TAPETE_FRISO = '#e6d3ad'
const BURRO = '#8f857b'
const BURRO_ESC = '#72685f'
const BARRIGA = '#d8cfc2'
const FOCINHO = '#e6ded2'
const CRINA = '#3e3430'
const CASCO = '#262220'
const ORELHA_IN = '#d7c3b8'
const LABIO = '#c26a74'
const GRAVATA = '#9c1f2c'
const COURO = '#7a4a2a'
const COURO_ESC = '#5a341c'
const COSTURA = '#d9b98a'
const MADEIRA = '#a5764a'
const MADEIRA_ESC = '#4a2f1d'
const TOALHA = '#f6f1e6'
const LOUCA = '#fbf8f2'
const LATAO = '#b99a5c'
const CERA = '#f3ead6'
const CHAMA = '#ffd27a'
const CADEIRA = '#3b2416'
const PALHINHA = '#c9a56a'
const CORACAO = '#e2475d'
const LETRA = '#3a2810'
const OURO = '#f2b52b' // acento saturado RESERVADO: o crachá BÚR'D
const OURO_ESC = '#c98e1c'

const GY = 0.18 // topo do assoalho
const CY = GY + 0.025 // topo do tapete

// burro: espaço local com +z = frente
const DONKEY: [number, number, number] = [-0.05, CY, -0.12]
const YAW = 1.25
const HEAD_YAW = -0.75 // pescoço virado para a câmera
const BY = 1.0 // altura do eixo do corpo
const NECK: [number, number, number] = [0, BY + 0.15, 0.42] // pivô do pescoço (cernelha/peito)
const BOW = 0.55 // cabeça em reverência (montagem)
const TOPB = BY + 0.44 // topo da prancha da cangalha

// cadeiras: pousadas uma de cada lado (pose final)
const SEAT_H = 0.42
const CHAIR_L: [number, number, number] = [-1.38, GY, 0.42]
const CHAIR_R: [number, number, number] = [1.42, GY, 0.22]
const CHAIR_L_YAW = 1.0
const CHAIR_R_YAW = -1.0
const PEAK_Y = 2.05

const CAM: [number, number, number] = [0.45, 2.55, 4.4]
const TARGET: [number, number, number] = [0.05, 1.28, 0.05]

/** Traço de letra do crachá: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, LETRA, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Meio anel (arco de 180°) de traço de letra; `rot` gira o arco no plano. */
function arc(r: number, x: number, y: number, rot: number, sx = 1) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 10, 24, Math.PI), mat(LETRA, { roughness: 0.5 }))
  m.castShadow = true
  m.position.set(x, y, 0)
  m.rotation.z = rot
  m.scale.set(sx, 1, 1.15)
  return m
}

type Glyph = 'B' | 'U' | 'R' | "'" | 'D'

/** B Ú R ' D — letras de traço grosso (altura 0.16 antes da escala). */
function letter(which: Glyph) {
  const g = new THREE.Group()
  const t = 0.026
  if (which === 'B') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.072, t, -0.008, 0.067))
    g.add(stroke(0.072, t, -0.008, 0))
    g.add(stroke(0.072, t, -0.008, -0.067))
    g.add(stroke(t, 0.06, 0.03, 0.036))
    g.add(stroke(t, 0.06, 0.03, -0.036))
  } else if (which === 'U') {
    g.add(stroke(t, 0.115, -0.04, 0.0225))
    g.add(stroke(t, 0.115, 0.04, 0.0225))
    g.add(arc(0.04, 0, -0.035, Math.PI))
    // acento agudo: o Ú longo e fechado
    g.add(stroke(0.024, 0.065, 0.012, 0.13, -0.75))
  } else if (which === 'R') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.07, t, -0.008, 0.067))
    g.add(stroke(0.07, t, -0.008, 0.006))
    g.add(stroke(t, 0.058, 0.03, 0.036))
    g.add(stroke(t, 0.09, 0.026, -0.045, 0.5))
  } else if (which === "'") {
    g.add(stroke(0.022, 0.05, 0, 0.056))
  } else {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.05, t, -0.02, 0.067))
    g.add(stroke(0.05, t, -0.02, -0.067))
    g.add(arc(0.067, -0.005, 0, -Math.PI / 2, 0.82))
  }
  return g
}

/** Cadeira de bistrô de madeira escura, assento de palhinha. +z = frente. */
function makeChair() {
  const g = new THREE.Group()
  g.rotation.order = 'YXZ'

  const assento = cylinder(0.19, 0.19, 0.03, PALHINHA, { roughness: 0.85 })
  assento.position.y = SEAT_H
  g.add(assento)
  const aro = torus(0.19, 0.022, CADEIRA, { roughness: 0.45 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = SEAT_H
  g.add(aro)

  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    const perna = cylinder(0.017, 0.021, SEAT_H, CADEIRA, { roughness: 0.45 })
    perna.position.set(c * 0.145, SEAT_H / 2, s * 0.145)
    perna.rotation.set(-s * 0.07, 0, c * 0.07)
    g.add(perna)
    const ponteira = cylinder(0.022, 0.022, 0.02, '#1c120b', { roughness: 0.6 })
    ponteira.position.set(c * 0.16, 0.01, s * 0.16)
    g.add(ponteira)
  }
  const travessa = torus(0.15, 0.012, CADEIRA, { roughness: 0.45 })
  travessa.rotation.x = Math.PI / 2
  travessa.position.y = 0.16
  g.add(travessa)

  // encosto de madeira curvada: laço externo + laço interno
  const encosto = new THREE.Group()
  encosto.position.set(0, SEAT_H, -0.155)
  encosto.rotation.x = -0.14
  g.add(encosto)
  for (const sx of [-1, 1]) {
    const poste = capsule(0.019, 0.3, CADEIRA, { roughness: 0.45 })
    poste.position.set(sx * 0.115, 0.17, 0)
    encosto.add(poste)
    const posteIn = capsule(0.013, 0.17, CADEIRA, { roughness: 0.45 })
    posteIn.position.set(sx * 0.065, 0.11, 0)
    encosto.add(posteIn)
  }
  const laco = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.02, 10, 28, Math.PI), mat(CADEIRA, { roughness: 0.45 }))
  laco.castShadow = true
  laco.position.y = 0.32
  encosto.add(laco)
  const lacoIn = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 10, 24, Math.PI), mat(CADEIRA, { roughness: 0.45 }))
  lacoIn.castShadow = true
  lacoIn.position.y = 0.2
  encosto.add(lacoIn)
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
  const m = new THREE.Mesh(geo, mat(CORACAO, { roughness: 0.35 }))
  m.castShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- restaurante: assoalho cor de mel e púlpito do maître -----------------
  const base = new THREE.Group()

  const borda = cylinder(2.62, 2.7, 0.12, PISO_BORDA, { roughness: 0.8 })
  borda.position.y = 0.06
  base.add(borda)
  const piso = cylinder(2.56, 2.56, 0.06, PISO, { roughness: 0.6 })
  piso.position.y = 0.15
  base.add(piso)
  // frestas das tábuas correndo para a porta (eixo z)
  for (let i = -6; i <= 6; i++) {
    const x = i * 0.38 + 0.08
    const meia = Math.sqrt(Math.max(0, 2.5 * 2.5 - x * x))
    const fresta = rbox(0.02, 0.01, meia * 2, 0.004, PISO_LINHA, { roughness: 0.75 })
    fresta.position.set(x, GY + 0.002, 0)
    base.add(fresta)
  }
  // emendas desencontradas das tábuas
  for (let i = 0; i < 12; i++) {
    const x = (Math.floor(rand() * 12) - 6) * 0.38 + 0.08 + 0.19
    const z = (rand() - 0.5) * 3.6
    if (Math.hypot(x, z) > 2.3) continue
    const emenda = rbox(0.36, 0.01, 0.018, 0.004, PISO_LINHA, { roughness: 0.75 })
    emenda.position.set(x, GY + 0.002, z)
    base.add(emenda)
  }

  // púlpito do maître com o livro de reservas (fundo, à esquerda)
  const pulpito = new THREE.Group()
  pulpito.position.set(-1.35, GY, -1.7)
  pulpito.rotation.y = 0.4
  base.add(pulpito)
  const coluna = rbox(0.46, 0.82, 0.34, 0.04, MADEIRA_ESC, { roughness: 0.55 })
  coluna.position.y = 0.41
  pulpito.add(coluna)
  const painel = rbox(0.34, 0.58, 0.02, 0.02, '#5d3b24', { roughness: 0.55 })
  painel.position.set(0, 0.42, 0.175)
  pulpito.add(painel)
  const tampo = rbox(0.56, 0.045, 0.44, 0.02, MADEIRA_ESC, { roughness: 0.5 })
  tampo.position.set(0, 0.87, 0.02)
  tampo.rotation.x = 0.3
  pulpito.add(tampo)
  for (const sx of [-1, 1]) {
    const pagina = rbox(0.17, 0.018, 0.24, 0.008, '#f3ecdc', { roughness: 0.8 })
    pagina.position.set(sx * 0.09, 0.905, 0.03)
    pagina.rotation.set(0.3, 0, sx * -0.06)
    pulpito.add(pagina)
  }
  const fitilho = rbox(0.016, 0.006, 0.16, 0.003, TAPETE, { roughness: 0.6 })
  fitilho.position.set(0.0, 0.88, 0.2)
  fitilho.rotation.x = 0.9
  pulpito.add(fitilho)

  root.add(base)

  // ---- tapete vermelho da entrada (desenrola para a porta/câmera) ----------
  const tapete = new THREE.Group()
  const TAP_LEN = 3.3
  tapete.position.set(0, GY, -1.5)
  root.add(tapete)
  const pano = rbox(1.25, 0.025, TAP_LEN, 0.01, TAPETE, { roughness: 0.92 })
  pano.position.set(0, 0.0125, TAP_LEN / 2)
  tapete.add(pano)
  for (const sx of [-1, 1]) {
    const friso = rbox(0.045, 0.006, TAP_LEN - 0.16, 0.003, TAPETE_FRISO, { roughness: 0.9 })
    friso.position.set(sx * 0.5, 0.026, TAP_LEN / 2)
    tapete.add(friso)
  }
  for (let k = 0; k < 11; k++) {
    const franja = rbox(0.03, 0.012, 0.07, 0.005, TAPETE_FRISO, { roughness: 0.9 })
    franja.position.set(-0.55 + k * 0.11, 0.008, TAP_LEN + 0.03)
    tapete.add(franja)
  }

  // ---- BURRO maître (+z local = frente) -------------------------------------
  const burro = new THREE.Group()
  burro.position.set(...DONKEY)
  burro.rotation.y = YAW
  root.add(burro)

  const corpo = capsule(0.31, 0.72, BURRO, { roughness: 0.85 })
  corpo.rotation.x = Math.PI / 2
  corpo.position.set(0, BY, -0.02)
  burro.add(corpo)
  const peito = sphere(0.33, BURRO, { roughness: 0.85 })
  peito.scale.set(0.95, 1, 0.9)
  peito.position.set(0, BY - 0.02, 0.36)
  burro.add(peito)
  const anca = sphere(0.34, BURRO, { roughness: 0.85 })
  anca.position.set(0, BY + 0.03, -0.4)
  burro.add(anca)
  const barriga = sphere(0.28, BARRIGA, { roughness: 0.88 })
  barriga.scale.set(0.95, 0.62, 1.7)
  barriga.position.set(0, BY - 0.17, 0)
  burro.add(barriga)

  for (const [lz, back] of [[0.36, false], [-0.42, true]] as const) {
    for (const sx of [-1, 1]) {
      const coxa = capsule(back ? 0.115 : 0.1, 0.2, BURRO, { roughness: 0.85 })
      coxa.position.set(sx * 0.16, 0.62, lz)
      burro.add(coxa)
      const canela = capsule(0.06, 0.3, BURRO_ESC, { roughness: 0.85 })
      canela.position.set(sx * 0.16, 0.31, lz)
      burro.add(canela)
      const boleto = sphere(0.066, BURRO_ESC, { roughness: 0.85 })
      boleto.position.set(sx * 0.16, 0.115, lz)
      burro.add(boleto)
      const casco = cylinder(0.058, 0.078, 0.09, CASCO, { roughness: 0.7 })
      casco.position.set(sx * 0.16, 0.045, lz)
      burro.add(casco)
    }
  }

  // rabo fino com pincel escuro
  const rabo = capsule(0.032, 0.36, BURRO, { roughness: 0.85 })
  rabo.position.set(0, BY - 0.1, -0.77)
  rabo.rotation.x = 0.28
  burro.add(rabo)
  const pincel = puff(0.065, CRINA, 5, 17, { roughness: 0.92 })
  pincel.scale.set(0.9, 1.5, 0.9)
  pincel.position.set(0, BY - 0.34, -0.84)
  burro.add(pincel)

  // ---- cabeça + pescoço (dobradiça na cernelha: faz a reverência) ----------
  const cabeca = new THREE.Group()
  cabeca.position.set(...NECK)
  cabeca.rotation.y = HEAD_YAW
  burro.add(cabeca)

  const pescoco = capsule(0.16, 0.34, BURRO, { roughness: 0.85 })
  pescoco.position.set(0, 0.25, 0.08)
  pescoco.rotation.x = 0.32
  cabeca.add(pescoco)

  const cranio = sphere(0.2, BURRO, { roughness: 0.85 })
  cranio.scale.set(0.95, 1, 1.1)
  cranio.position.set(0, 0.62, 0.2)
  cabeca.add(cranio)

  const bochecha = sphere(0.165, BURRO, { roughness: 0.85 })
  bochecha.position.set(0, 0.54, 0.3)
  cabeca.add(bochecha)

  const chanfro = capsule(0.13, 0.16, BURRO, { roughness: 0.85 })
  chanfro.position.set(0, 0.53, 0.42)
  chanfro.rotation.x = Math.PI / 2 + 0.3
  cabeca.add(chanfro)

  const focinho = sphere(0.15, FOCINHO, { roughness: 0.8 })
  focinho.scale.set(1, 0.9, 0.95)
  focinho.position.set(0, 0.46, 0.55)
  cabeca.add(focinho)

  for (const sx of [-1, 1]) {
    const narina = sphere(0.02, '#8a7a72', { roughness: 0.6 })
    narina.scale.set(0.7, 1.5, 0.5)
    narina.position.set(sx * 0.075, 0.515, 0.66)
    narina.rotation.set(0.3, sx * 0.5, sx * 0.5)
    cabeca.add(narina)

    // olhos grandes de anfitrião simpático, com aro claro
    const aroOlho = sphere(0.07, FOCINHO, { roughness: 0.8 })
    aroOlho.scale.set(1, 1, 0.5)
    aroOlho.position.set(sx * 0.118, 0.67, 0.33)
    cabeca.add(aroOlho)
    const esclera = sphere(0.056, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.7
    esclera.position.set(sx * 0.12, 0.67, 0.345)
    cabeca.add(esclera)
    const pupila = sphere(0.032, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(sx * 0.122, 0.668, 0.382)
    cabeca.add(pupila)
    const brilho = sphere(0.009, '#ffffff', { roughness: 0.1 })
    brilho.position.set(sx * 0.112, 0.682, 0.41)
    cabeca.add(brilho)
    const palpebra = sphere(0.059, BURRO, { roughness: 0.85 })
    palpebra.scale.set(1.05, 0.62, 0.75)
    palpebra.position.set(sx * 0.12, 0.703, 0.345)
    cabeca.add(palpebra)

    // orelhonas compridas, em pé
    const orelha = capsule(0.068, 0.34, BURRO, { roughness: 0.85 })
    orelha.scale.set(1, 1, 0.5)
    orelha.position.set(sx * 0.11, 0.98, 0.13)
    orelha.rotation.set(-0.12, 0, -sx * 0.24)
    cabeca.add(orelha)
    const dentro = capsule(0.042, 0.24, ORELHA_IN, { roughness: 0.85 })
    dentro.scale.set(1, 1, 0.5)
    dentro.position.set(0, -0.01, 0.075)
    orelha.add(dentro)
    const ponta = sphere(0.058, CRINA, { roughness: 0.9 })
    ponta.scale.set(1.1, 1.3, 1)
    ponta.position.y = 0.2
    orelha.add(ponta)
  }

  // crina curta e escura ao longo do pescoço + topete
  const crina = capsule(0.055, 0.42, CRINA, { roughness: 0.92 })
  crina.scale.set(0.65, 1, 1)
  crina.position.set(0, 0.39, -0.03)
  crina.rotation.x = 0.32
  cabeca.add(crina)

  // ---- beiço em bico (o FÖ) -------------------------------------------------
  const beico = new THREE.Group()
  beico.position.set(0, 0.37, 0.635)
  beico.rotation.x = 0.1
  cabeca.add(beico)
  const bico = new THREE.Group()
  bico.scale.setScalar(1.3)
  beico.add(bico)
  const labioSup = capsule(0.036, 0.06, LABIO, { roughness: 0.4 })
  labioSup.rotation.z = Math.PI / 2
  labioSup.scale.set(1, 1, 1.25)
  labioSup.position.set(0, 0.026, 0.045)
  bico.add(labioSup)
  const labioInf = capsule(0.033, 0.045, LABIO, { roughness: 0.4 })
  labioInf.rotation.z = Math.PI / 2
  labioInf.scale.set(1, 1, 1.2)
  labioInf.position.set(0, -0.03, 0.04)
  bico.add(labioInf)
  const furo = sphere(0.017, '#4a1f24', { roughness: 0.6 })
  furo.scale.set(1.3, 0.8, 1)
  furo.position.set(0, -0.002, 0.083)
  bico.add(furo)

  // ---- gravata-borboleta (no pescoço: acompanha a reverência) --------------
  const gravata = new THREE.Group()
  gravata.position.set(0, 0.17, 0.25)
  gravata.rotation.order = 'YXZ'
  gravata.rotation.set(-0.25, 0, 0)
  cabeca.add(gravata)
  for (const sx of [-1, 1]) {
    const asa = cone(0.07, 0.15, GRAVATA, { roughness: 0.35 }, 24)
    asa.scale.set(1, 1, 0.45)
    asa.rotation.z = sx * Math.PI / 2
    asa.position.set(sx * 0.078, 0, 0)
    gravata.add(asa)
    const vinco = rbox(0.012, 0.09, 0.02, 0.005, '#7a1622', { roughness: 0.4 })
    vinco.position.set(sx * 0.12, 0, 0.025)
    gravata.add(vinco)
  }
  const no = rbox(0.055, 0.06, 0.05, 0.018, GRAVATA, { roughness: 0.35 })
  no.position.z = 0.012
  gravata.add(no)

  // ---- crachá dourado BÚR'D (no peito, virado para a câmera) ---------------
  const cracha = new THREE.Group()
  cracha.position.set(0, BY - 0.03, 0.7)
  cracha.rotation.order = 'YXZ'
  burro.add(cracha)
  const moldura = rbox(0.64, 0.29, 0.025, 0.045, OURO_ESC, { roughness: 0.3, metalness: 0.6 })
  moldura.position.z = -0.008
  cracha.add(moldura)
  const placa = rbox(0.6, 0.25, 0.03, 0.035, OURO, { roughness: 0.28, metalness: 0.55 })
  cracha.add(placa)
  const letras = new THREE.Group()
  letras.position.set(0.01, -0.018, 0.022)
  letras.scale.setScalar(0.8)
  cracha.add(letras)
  const glyphs: [Glyph, number][] = [['B', -0.25], ['U', -0.125], ['R', 0.0], ["'", 0.09], ['D', 0.18]]
  for (const [glyph, lx] of glyphs) {
    const l = letter(glyph)
    l.position.x = lx
    letras.add(l)
  }
  const alfinete = cylinder(0.016, 0.016, 0.02, OURO_ESC, { roughness: 0.3, metalness: 0.6 })
  alfinete.rotation.x = Math.PI / 2
  alfinete.position.set(0, 0.105, 0.02)
  cracha.add(alfinete)

  // ---- cangalha de couro no lombo -------------------------------------------
  const cangalha = new THREE.Group()
  burro.add(cangalha)

  const manta = new THREE.Mesh(
    new THREE.CylinderGeometry(0.348, 0.348, 0.62, 40, 1, true, Math.PI - 1.38, 2.76),
    mat(COURO, { roughness: 0.6 }),
  )
  ;(manta.material as THREE.Material).side = THREE.DoubleSide
  manta.castShadow = true
  manta.receiveShadow = true
  manta.rotation.x = Math.PI / 2
  manta.position.set(0, BY, -0.02)
  cangalha.add(manta)
  // costuras claras nas bordas da manta
  for (const sx of [-1, 1]) {
    const costura = capsule(0.012, 0.58, COSTURA, { roughness: 0.7 })
    costura.rotation.x = Math.PI / 2
    costura.position.set(sx * 0.342, BY + 0.06, -0.02)
    cangalha.add(costura)
  }
  for (const z of [-0.31, 0.27]) {
    const debrum = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.016, 8, 40, 2.76),
      mat(COURO_ESC, { roughness: 0.6 }),
    )
    debrum.rotation.z = Math.PI / 2 - 1.38
    debrum.position.set(0, BY, z)
    cangalha.add(debrum)
  }
  // dois arcos de madeira e a prancha onde a mesa se apoia
  for (const z of [-0.2, 0.18]) {
    const arco = new THREE.Mesh(new THREE.TorusGeometry(0.375, 0.032, 10, 32, Math.PI), mat(MADEIRA, { roughness: 0.6 }))
    arco.castShadow = true
    arco.position.set(0, BY, z)
    cangalha.add(arco)
  }
  const prancha = rbox(0.34, 0.04, 0.56, 0.015, MADEIRA, { roughness: 0.6 })
  prancha.position.set(0, TOPB - 0.02, -0.01)
  cangalha.add(prancha)
  // cilha por baixo da barriga, com fivela de ferro
  const cilha = torus(0.36, 0.026, COURO_ESC, { roughness: 0.6 })
  cilha.position.set(0, BY - 0.02, 0.06)
  cilha.scale.set(1, 1.02, 1)
  cangalha.add(cilha)
  const fivela = rbox(0.06, 0.07, 0.06, 0.012, '#4b4642', { roughness: 0.35, metalness: 0.7 })
  fivela.position.set(-0.36, BY - 0.12, 0.06)
  cangalha.add(fivela)
  // ganchos de ferro onde as cadeiras ficam penduradas
  for (const sx of [-1, 1]) {
    const gancho = torus(0.035, 0.009, '#4b4642', { roughness: 0.35, metalness: 0.7 })
    gancho.rotation.y = Math.PI / 2
    gancho.position.set(sx * 0.3, BY + 0.2, -0.02)
    cangalha.add(gancho)
  }

  // ---- mesa redonda montada na cangalha -------------------------------------
  const mesa = new THREE.Group()
  burro.add(mesa)

  const pe = lathe(
    [[0, 0], [0.13, 0], [0.13, 0.025], [0.06, 0.05], [0.045, 0.12], [0.07, 0.15], [0, 0.15]],
    MADEIRA_ESC,
    { roughness: 0.5 },
  )
  pe.position.y = TOPB
  mesa.add(pe)
  const tabua = cylinder(0.5, 0.5, 0.04, MADEIRA_ESC, { roughness: 0.5 })
  tabua.position.y = TOPB + 0.17
  mesa.add(tabua)
  const TY = TOPB + 0.19 // topo do tampo (sob a toalha)
  const toalha = lathe(
    [
      [0, TY - 0.005], [0.5, TY - 0.005], [0.545, TY - 0.03], [0.57, TY - 0.12], [0.585, TY - 0.2],
      [0.605, TY - 0.2], [0.59, TY - 0.11], [0.565, TY - 0.01], [0.535, TY + 0.012], [0, TY + 0.012],
    ],
    TOALHA,
    { roughness: 0.9 },
    56,
  )
  mesa.add(toalha)
  const TOP_Y = TY + 0.012

  // dois lugares: um prato de cada lado (onde as cadeiras vão pousar)
  for (const sx of [-1, 1]) {
    const prato = lathe(
      [[0, 0], [0.09, 0], [0.1, 0.008], [0.135, 0.02], [0.14, 0.026], [0.125, 0.024], [0.09, 0.012], [0, 0.012]],
      LOUCA,
      { roughness: 0.25 },
    )
    prato.position.set(sx * 0.3, TOP_Y, 0.02)
    mesa.add(prato)
    const filete = torus(0.128, 0.005, TAPETE, { roughness: 0.4 })
    filete.rotation.x = Math.PI / 2
    filete.position.set(sx * 0.3, TOP_Y + 0.024, 0.02)
    mesa.add(filete)
    const guardanapo = cone(0.055, 0.12, TAPETE, { roughness: 0.85 }, 4)
    guardanapo.position.set(sx * 0.3, TOP_Y + 0.072, 0.02)
    guardanapo.rotation.y = Math.PI / 4
    mesa.add(guardanapo)
  }

  // ---- vela acesa no castiçal ------------------------------------------------
  const vela = new THREE.Group()
  vela.position.set(0, TOP_Y, 0)
  mesa.add(vela)
  const castical = lathe(
    [[0, 0], [0.09, 0], [0.09, 0.015], [0.04, 0.04], [0.025, 0.1], [0.04, 0.12], [0.055, 0.135], [0.05, 0.145], [0, 0.14]],
    LATAO,
    { roughness: 0.3, metalness: 0.7 },
  )
  vela.add(castical)
  const cera = cylinder(0.03, 0.032, 0.2, CERA, { roughness: 0.5 })
  cera.position.y = 0.24
  vela.add(cera)
  const pingo = capsule(0.01, 0.04, CERA, { roughness: 0.5 })
  pingo.position.set(0.026, 0.31, 0.01)
  vela.add(pingo)
  const pavio = cylinder(0.005, 0.005, 0.025, '#2a2018')
  pavio.position.y = 0.352
  vela.add(pavio)
  const chama = sphere(0.03, CHAMA, { emissive: '#ffb648', emissiveIntensity: 1.5 })
  chama.scale.set(0.8, 1.75, 0.8)
  chama.position.y = 0.4
  vela.add(chama)
  const luz = new THREE.PointLight('#ffb35c', 1.3, 2.6, 1.6)
  luz.position.y = 0.45
  vela.add(luz)

  // ---- posições derivadas (mundo) --------------------------------------------
  root.updateMatrixWorld(true)
  const camV = new THREE.Vector3(...CAM)

  // crachá no ponto do peito que encara a câmera (tangente ao peito)
  {
    const camL = burro.worldToLocal(camV.clone())
    const C = new THREE.Vector3(0, BY - 0.03, 0.36)
    const d = new THREE.Vector3(camL.x - C.x, 0, camL.z - C.z).normalize()
    cracha.position.copy(C).addScaledVector(d, 0.335)
    cracha.rotation.set(-0.22, Math.atan2(d.x, d.z), 0)
    const g = gravata.getWorldPosition(new THREE.Vector3())
    gravata.rotation.y = Math.atan2(camV.x - g.x, camV.z - g.z) - YAW - HEAD_YAW
  }

  // coração: sai do bico e para no ar, à frente e acima do focinho
  const LIPS = beico.getWorldPosition(new THREE.Vector3())
  const HEART = LIPS.clone().add(new THREE.Vector3(0.4, 0.36, 0.2))
  const coracao = new THREE.Group()
  coracao.position.copy(HEART)
  coracao.rotation.set(0, Math.atan2(camV.x - HEART.x, camV.z - HEART.z), 0.18)
  root.add(coracao)
  coracao.add(makeHeart(0.24))
  // rastro de coraçõezinhos ligando o bico ao coração grande
  {
    const inv = coracao.quaternion.clone().invert()
    const back = LIPS.clone().sub(HEART)
    for (const [k, size] of [[0.36, 0.09], [0.58, 0.06]] as const) {
      const mini = makeHeart(size)
      mini.position.copy(back.clone().multiplyScalar(k).applyQuaternion(inv))
      mini.rotation.z = -0.25 + k * 0.3
      coracao.add(mini)
    }
  }
  const HEART_ROT_Y = coracao.rotation.y

  // cadeiras: penduradas nos ganchos da cangalha (montagem) → pousadas
  const hang = (sx: number) => burro.localToWorld(new THREE.Vector3(sx * 0.52, BY - 0.575, -0.02))
  const HANG_L = hang(-1)
  const HANG_R = hang(1)
  const out = (sx: number) => burro.localToWorld(new THREE.Vector3(sx * 0.98, BY - 0.5, -0.02))
  const OUT_L = out(-1)
  const OUT_R = out(1)
  const HANG_L_YAW = YAW - Math.PI / 2 // de costas para o flanco, virada para fora
  const HANG_R_YAW = YAW + Math.PI / 2

  const cadeiraE = makeChair()
  cadeiraE.position.set(...CHAIR_L)
  cadeiraE.rotation.set(0, CHAIR_L_YAW, 0)
  root.add(cadeiraE)
  const cadeiraD = makeChair()
  cadeiraD.position.set(...CHAIR_R)
  cadeiraD.rotation.set(0, CHAIR_R_YAW, 0)
  root.add(cadeiraD)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'restaurante', object: base },
    { name: 'tapete', group: 'restaurante', object: tapete },
    { name: 'burro', group: 'burro', object: burro },
    { name: 'cabeca', group: 'burro', object: cabeca },
    { name: 'gravata', group: 'bur', object: gravata },
    { name: 'cracha', group: 'bur', object: cracha },
    { name: 'cangalha', group: 'mesa', object: cangalha },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'vela', group: 'mesa', object: vela },
    { name: 'beico', group: 'fo', object: beico },
    { name: 'coracao', group: 'fo', object: coracao },
    { name: 'cadeiraE', group: 'tvo', object: cadeiraE },
    { name: 'cadeiraD', group: 'tvo', object: cadeiraD },
  ]

  // ---- montagem ------------------------------------------------------------
  const S0 = 0.01
  const grow = (from = S0) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const T_FLY = 8.9 // o sopro solta as cadeiras
  const PUSH = 0.25 // empurrão para fora do flanco
  const FLY_UP = 0.45
  const FLY_DOWN = 0.45
  const T_ARC = T_FLY + PUSH
  const T_TAC = T_ARC + FLY_UP + FLY_DOWN

  const chairSeqs = (
    name: string,
    hangP: THREE.Vector3,
    outP: THREE.Vector3,
    hangYaw: number,
    final: [number, number, number],
    finalYaw: number,
    side: number,
  ) => [
    // aparece pendurada no gancho, encostada no flanco
    seq(`${name}-pendura`, name, 6.0 + (side > 0 ? 0.15 : 0), 0.5, [
      ...grow(),
      ch('position.x', hangP.x, hangP.x),
      ch('position.z', hangP.z, hangP.z),
      ch('position.y', hangP.y, hangP.y),
      ch('rotation.y', hangYaw, hangYaw),
    ], { ease: 'easeOut' }),
    // o sopro arranca a cadeira do gancho, para fora do flanco
    seq(`${name}-solta`, name, T_FLY, PUSH, [
      ch('position.x', hangP.x, outP.x),
      ch('position.z', hangP.z, outP.z),
      ch('position.y', hangP.y, outP.y),
      ch('rotation.x', 0, 0.3),
    ], { ease: 'easeOut' }),
    // T'VÔO: arco para o alto e para o lado, girando
    seq(`${name}-voa`, name, T_ARC, FLY_UP + FLY_DOWN, [
      ch('position.x', outP.x, final[0]),
      ch('position.z', outP.z, final[2]),
      ch('rotation.y', hangYaw, finalYaw),
    ], { ease: 'easeInOut' }),
    seq(`${name}-sobe`, name, T_ARC, FLY_UP, [
      ch('position.y', outP.y, PEAK_Y),
      ch('rotation.x', 0.3, 0.45),
      ch('rotation.z', 0, side * 0.55),
    ], { ease: 'easeOut' }),
    // TAC: crava os pés no assoalho
    seq(`${name}-crava`, name, T_ARC + FLY_UP, FLY_DOWN, [
      ch('position.y', PEAK_Y, final[1]),
      ch('rotation.x', 0.45, 0),
      ch('rotation.z', side * 0.55, 0),
    ], { ease: 'easeIn' }),
  ]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Sexta à noite, porta de um restaurante lotado: assoalho cor de mel…',
    }),
    seq('tapete-desenrola', 'tapete', 0.6, 0.8, [ch('scale.z', 0.02, 1)], { ease: 'easeOut' }),

    seq('burro-rise', 'burro', 1.9, 0.9, [riseFrom(DONKEY[1], 2.3)], {
      ease: 'easeOut',
      caption: 'Você ergue dois dedos e solta um ÉT! de susto: o maître é um BURRO.',
    }),
    // cabeça e beiço (relaxado) aparecem junto com o corpo
    seq('cabeca-surge', 'cabeca', 1.9, 0.6, [ch('rotation.x', 0, 0)]),
    seq('beico-surge', 'beico', 1.9, 0.6, [ch('scale.z', 0.35, 0.35), ch('scale.x', 1.25, 1.25)]),
    seq('cabeca-reverencia', 'cabeca', 2.5, 0.5, [ch('rotation.x', 0, BOW)], { ease: 'easeOut' }),
    seq('cabeca-ergue', 'cabeca', 3.0, 0.6, [ch('rotation.x', BOW, 0)], { ease: 'easeInOut' }),

    seq('gravata-surge', 'gravata', 4.1, 0.45, grow(), {
      ease: 'easeOut',
      caption: "De gravata-borboleta e crachá dourado no peito: BÚR'D — do BURRO só fica o BU, e o D fecha seco.",
    }),
    seq('cracha-gira', 'cracha', 4.35, 0.75, [
      ...grow(),
      ch('rotation.y', cracha.rotation.y - Math.PI * 2, cracha.rotation.y),
    ], { ease: 'easeOut' }),

    seq('cangalha-cai', 'cangalha', 5.6, 0.45, [ch('position.y', 0.9, 0)], {
      ease: 'easeIn',
      caption: 'No lombo, a cangalha de couro com duas cadeiras penduradas — e a mesa já chega montada.',
    }),
    ...chairSeqs('cadeiraE', HANG_L, OUT_L, HANG_L_YAW, CHAIR_L, CHAIR_L_YAW, -1),
    ...chairSeqs('cadeiraD', HANG_R, OUT_R, HANG_R_YAW, CHAIR_R, CHAIR_R_YAW, 1),
    seq('mesa-cai', 'mesa', 6.5, 0.5, [ch('position.y', 1.4, 0)], { ease: 'easeIn' }),
    seq('vela-acende', 'vela', 7.0, 0.45, grow(), { ease: 'easeOut' }),

    seq('beico-bico', 'beico', 7.9, 0.4, [ch('scale.z', 0.35, 1), ch('scale.x', 1.25, 1)], {
      ease: 'easeOut',
      caption: 'Ele estica o beiço num bico e sopra um beijinho: FÖ!',
    }),
    seq('coracao-sopra', 'coracao', 8.15, 0.7, [
      ...grow(),
      ch('position.x', LIPS.x, HEART.x),
      ch('position.y', LIPS.y, HEART.y),
      ch('position.z', LIPS.z, HEART.z),
    ], { ease: 'easeOut' }),

    // caption do voo vai numa sequência própria da cadeira esquerda
    seq('cadeiras-tvoo', 'cadeiraE', T_FLY, 0.01, [ch('scale.x', 1, 1)], {
      caption: "O sopro solta as DUAS cadeiras: saem em T'VÔO, uma pra cada lado…",
    }),
    seq('cadeiras-tac', 'cadeiraD', T_TAC, 0.01, [ch('scale.x', 1, 1)], {
      caption: '…e cravam os pés no chão: TAC!',
    }),

    seq('coracao-pulsa', 'coracao', T_TAC + 0.9, 0.35, [
      ch('scale.x', 1, 1.18), ch('scale.y', 1, 1.18), ch('rotation.y', HEART_ROT_Y, HEART_ROT_Y),
    ], {
      ease: 'easeOut',
      caption: 'Ett bord för två, tack. — Uma mesa para dois, por favor.',
    }),
    seq('coracao-volta', 'coracao', T_TAC + 1.25, 0.4, [
      ch('scale.x', 1.18, 1), ch('scale.y', 1.18, 1),
    ], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'ett-bord-for-tva-tack',
    contexto:
      "Restaurante: na porta, quando o garçom recebe com 'Hej! Hur många är ni?' ou 'Har ni bokat?'. Troque o número: 'för en', 'för tre', 'för fyra'.",
    fraseFonte: 'Uma mesa para dois, por favor.',
    fraseAlvo: 'Ett bord för två, tack.',
    pronuncia:
      "et BÚURD för TVÔ, tak ('bord' com U LONGO e fechado, e o 'rd' vira um D de língua enrolada pra trás, com o R quase sumindo; 'för' curto, com o ö de bico, e o R dele também derrete no T seguinte; 'två' = TVÔ numa sílaba só, ô fechado e longo; 'ett' com É aberto e T seco)",
    ponteSonora:
      "ÉT! BÚR'D... FÖ T'VÔO! TAC! (5 batidas: ét-BÚURD-fö-TVÔ-tak; tônicas em BÚR e TVÔ; ÉT é o ÉTA! de espanto com o A engolido, o mesmo ÉT do ÉTER de 'Jag har ett möte': É ABERTO de 'pé' e T seco, nunca 'étchi'; BÚR'D é o que está escrito no crachá do burro: do BURRO só fica o BU, com U LONGO e FECHADO de URSO (com 'ô' vira 'bård', outra palavra); o R escrito ali NÃO é o RR de garganta de 'burro', é o R CAIPIRA de 'porta', o mesmo do BÁR'N de 'Jag har två barn' e do CÓRT de 'kort': a língua enrola pra trás sem vibrar e já cai no D, e o R quase some dentro dele, que é como o sueco funde o 'rd'; o D do crachá é OBRIGATÓRIO e fecha seco, nada de 'BÚR-dji' com vogal no fim; FÖ é o beijinho soprado de BICO, lábios de Ô com língua de Ê, o mesmo ö do MÖÖ de 'Jag har ett möte', CURTO e fraco, e o R de 'för' derrete no T seguinte; não confunda com o FÔ de 'få': o burro sopra BEIJO de bico (coração), o chef e o policial sopram de BOCHECHA estufada (nuvem); T'VÔO = o MESMO T'VÔO de 'Jag har två barn': VÔO com T colado, UMA sílaba, Ô FECHADO e longo, e é nele que cai a força; TAC = o 'tack' de sempre, A curto e K seco)",
    historia:
      "Restaurante lotado, sexta à noite: você ergue dois dedos na porta e solta um ÉTA! de susto, porque o maître é um BURRO de gravata-borboleta, com um crachá dourado no peito que diz BÚR'D e uma mesa redonda amarrada no lombo, toalha branca e vela acesa: a mesa já chega montada no burro. Ele estica o beiço num bico e manda um beijinho soprado, FÖ!, tão forte que solta as duas cadeiras penduradas na cangalha: elas saem em T'VÔO, uma pra cada lado, e cravam os pés no chão, TAC! Aí o burro trava imóvel feito móvel, a vela nem treme, e a mesa está servida: uma mesa pra dois, por favor.",
  },
  createScene,
  refine: { organic: ['burro', 'cabeca'] },
}

export default card
