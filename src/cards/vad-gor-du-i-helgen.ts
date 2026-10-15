import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, puff,
} from '../rig/helpers'

/**
 * "Vad gör du i helgen?" — VÁ, IÖR-DÜ I RRÉL-IEN?
 *
 * Sexta, seis da tarde, na mesma laje de 'Trevlig helg!': a cegonha de folga
 * (óculos de aviador) pendurou a trouxinha de bebê no prego da mureta, berra
 * VÁ!, gira a manivela enferrujada do mastro (o rangido iiiÖR da carta 'Det
 * gör ont här') com o bico de meio metro em biquinho de beijo (DÜ) — e a velha
 * HÉLICE de duas pás no topo pega no tranco: RRÉL-IEN! Malinha amarela no pé.
 *
 * Diorama: laje cinza com mureta ao fundo, ninho de gravetos no canto, mastro
 * metálico com caixa de engrenagem ferrugem, cegonha branca de perfil.
 */

const CONCRETE = '#b3ada0'
const CONCRETE_DARK = '#8e887c'
const MURETA = '#c2bcae'
const COPING = '#a49d90'
const TERRACOTA = '#b5623c'
const STORK = '#f3f0e9'
const STORK_SH = '#dcd6ca'
const FEATHER_BLACK = '#25272c'
const LEG_RED = '#c94a32'
const BEAK = '#d9542e'
const BEAK_DARK = '#b03d26'
const LIPS = '#c2303a'
const LEATHER = '#6b4528'
const LEATHER_DARK = '#4e321d'
const LENS = '#3f9a63'
const BRASS = '#c9a250'
const METAL = '#8f969d'
const METAL_DARK = '#5d636a'
const RUST = '#a8552a'
const RUST_DARK = '#7d3d1f'
const IRON = '#3c4249'
const HONEY = '#c99447'
const HONEY_DARK = '#a8763a'
const ACCENT = '#f0821e' // reservado à HÉLICE — o RRÉL-IEN da ponte sonora
const YELLOW = '#efc23a'
const YELLOW_DARK = '#c99a22'
const STRAW = '#a98a52'
const TWIG = '#7a5a36'
const CLOTH = '#f6f3ec'

const GY = 0.18 // topo da laje

// cegonha (de perfil, olhando para +x) e mastro
const STORK_X = -0.38
const STORK_Z = 0.2
const MAST_X = 0.95
const MAST_Z = -0.12
const MAST_TOP = 2.62
const BOX_Y = 1.3 // centro da caixa de engrenagem
const CRANK_X = MAST_X - 0.23 // eixo da manivela sai da face -x da caixa
const SPIN = 1.15 // pose final da manivela (rotação em x): punho virado para a cegonha
const HEL_ROT = 0.55 // pose final da hélice: inclinada no giro

/** Peça cilíndrica fina ligando dois pontos (cordas, alças, gravetos). */
function link(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, rough = 0.7) {
  const d = new THREE.Vector3().subVectors(b, a)
  const c = cylinder(r, r, d.length(), color, { roughness: rough }, 10)
  c.position.copy(a).addScaledVector(d, 0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return c
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- laje do prédio (a mesma de 'Trevlig helg!') ------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.6, 2.66, 0.12, CONCRETE_DARK, { roughness: 0.9 })
  slab.position.y = 0.06
  base.add(slab)

  const floor = cylinder(2.54, 2.6, 0.07, CONCRETE, { roughness: 0.85 })
  floor.position.y = 0.145
  base.add(floor)

  // juntas de dilatação: linhas finas no piso
  for (const off of [-1.2, 0, 1.2]) {
    const meia = Math.sqrt(2.5 * 2.5 - off * off)
    const junta = rbox(meia * 2, 0.008, 0.025, 0.004, CONCRETE_DARK, { roughness: 0.9 })
    junta.position.set(0, GY + 0.002, off)
    base.add(junta)
  }

  const MURETA_R = 2.3
  for (let i = 0; i < 11; i++) {
    const a = 1.02 + (i / 10) * 4.24
    const block = rbox(0.94, 0.42, 0.16, 0.05, MURETA, { roughness: 0.85 })
    block.position.set(Math.sin(a) * MURETA_R, GY + 0.21, Math.cos(a) * MURETA_R)
    block.rotation.y = a
    const cap = rbox(0.98, 0.07, 0.22, 0.03, COPING, { roughness: 0.8 })
    cap.position.y = 0.245
    block.add(cap)
    base.add(block)
  }

  // vasinho de mato no canto da frente
  const potinho = cylinder(0.15, 0.12, 0.22, TERRACOTA, { roughness: 0.8 })
  potinho.position.set(1.85, GY + 0.11, 0.85)
  const mato = puff(0.18, '#3f7d33', 5, 32, { roughness: 0.9 })
  mato.position.y = 0.17
  potinho.add(mato)
  base.add(potinho)
  root.add(base)

  // ---- ninho de gravetos no canto ------------------------------------------
  const ninho = new THREE.Group()
  ninho.position.set(1.75, GY, -1.25)

  const aro = torus(0.34, 0.13, STRAW, { roughness: 0.95 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.12
  aro.scale.z = 0.8
  ninho.add(aro)

  const fundo = cylinder(0.3, 0.26, 0.12, '#6b5434', { roughness: 0.95 })
  fundo.position.y = 0.07
  ninho.add(fundo)

  for (let i = 0; i < 30; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.3 + rand() * 0.14
    const y = 0.06 + rand() * 0.16
    const p = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
    const t = new THREE.Vector3(-Math.sin(a), (rand() - 0.5) * 0.5, Math.cos(a))
    const len = 0.3 + rand() * 0.22
    const graveto = link(
      p.clone().addScaledVector(t, -len / 2),
      p.clone().addScaledVector(t, len / 2),
      0.022,
      i % 3 ? TWIG : '#5e4428',
      0.95,
    )
    ninho.add(graveto)
  }
  root.add(ninho)

  // ---- prego na mureta com a trouxinha de bebê (fora de serviço) ----------
  const NAIL_A = Math.PI + 0.95
  const nailR = MURETA_R - 0.09
  const trouxinha = new THREE.Group()
  trouxinha.position.set(Math.sin(NAIL_A) * nailR, GY + 0.4, Math.cos(NAIL_A) * nailR)
  trouxinha.rotation.y = NAIL_A + Math.PI // +z local aponta para o centro da laje

  const prego = cylinder(0.018, 0.018, 0.12, METAL_DARK, { roughness: 0.3, metalness: 0.8 })
  prego.rotation.x = Math.PI / 2
  prego.position.z = 0.04
  trouxinha.add(prego)
  const cabeca = cylinder(0.035, 0.035, 0.015, METAL_DARK, { roughness: 0.3, metalness: 0.8 })
  cabeca.rotation.x = Math.PI / 2
  cabeca.position.z = 0.1
  trouxinha.add(cabeca)

  // a trouxa pendurada: pontas amarradas sobre o prego, saco cheio de pano embaixo
  const no = sphere(0.07, CLOTH, { roughness: 0.92 })
  no.position.set(0, -0.03, 0.11)
  trouxinha.add(no)
  for (const side of [-1, 1]) {
    const orelha = cone(0.055, 0.16, CLOTH, { roughness: 0.92 })
    orelha.position.set(side * 0.08, 0.02, 0.11)
    orelha.rotation.z = -side * 0.8
    trouxinha.add(orelha)
    const dobra = capsule(0.06, 0.16, CLOTH, { roughness: 0.92 })
    dobra.position.set(side * 0.1, -0.13, 0.17)
    dobra.rotation.z = side * 0.5
    trouxinha.add(dobra)
  }

  const saco = sphere(0.22, CLOTH, { roughness: 0.92 })
  saco.scale.set(1.05, 0.8, 0.85)
  saco.position.set(0, -0.27, 0.2)
  trouxinha.add(saco)

  const fita = torus(0.075, 0.022, '#8fb9de', { roughness: 0.8 })
  fita.rotation.x = Math.PI / 2
  fita.position.set(0, -0.08, 0.13)
  trouxinha.add(fita)
  root.add(trouxinha)

  // ---- mastro cinza-metal com caixa de engrenagem ---------------------------
  const mastro = new THREE.Group()
  mastro.position.set(MAST_X, GY, MAST_Z)

  const sapata = cylinder(0.26, 0.29, 0.07, METAL_DARK, { roughness: 0.45, metalness: 0.7 })
  sapata.position.y = 0.035
  mastro.add(sapata)
  for (let i = 0; i < 4; i++) {
    const a = i * (Math.PI / 2) + Math.PI / 4
    const parafuso = cylinder(0.03, 0.03, 0.04, IRON, { roughness: 0.4, metalness: 0.8 }, 6)
    parafuso.position.set(Math.cos(a) * 0.2, 0.08, Math.sin(a) * 0.2)
    mastro.add(parafuso)
  }

  const poste = cylinder(0.06, 0.08, MAST_TOP - GY, METAL, { roughness: 0.4, metalness: 0.7 })
  poste.position.y = (MAST_TOP - GY) / 2
  mastro.add(poste)

  for (const yy of [0.5, 2.0]) {
    const anel = torus(0.075, 0.018, METAL_DARK, { roughness: 0.4, metalness: 0.7 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = yy
    mastro.add(anel)
  }

  const caixa = rbox(0.36, 0.38, 0.32, 0.05, RUST, { roughness: 0.85 })
  caixa.position.y = BOX_Y - GY
  mastro.add(caixa)
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const rebite = sphere(0.022, RUST_DARK, { roughness: 0.6 })
      rebite.position.set(sx * 0.13, BOX_Y - GY + sy * 0.14, 0.165)
      mastro.add(rebite)
    }
  }
  const tampa = rbox(0.4, 0.05, 0.36, 0.02, RUST_DARK, { roughness: 0.85 })
  tampa.position.y = BOX_Y - GY + 0.21
  mastro.add(tampa)

  // nacele no topo: o cubo da hélice encaixa na frente dela
  const nacele = capsule(0.1, 0.22, METAL, { roughness: 0.4, metalness: 0.7 })
  nacele.rotation.x = Math.PI / 2
  nacele.position.set(0, MAST_TOP - GY, 0)
  mastro.add(nacele)
  const leme = rbox(0.03, 0.26, 0.32, 0.012, METAL, { roughness: 0.4, metalness: 0.7 })
  leme.position.set(0, MAST_TOP - GY + 0.08, -0.32)
  mastro.add(leme)
  root.add(mastro)

  // ---- manivela de ferro (gira em torno do eixo x) --------------------------
  const manivela = new THREE.Group()
  manivela.position.set(CRANK_X, BOX_Y, MAST_Z)
  manivela.rotation.x = SPIN

  const eixo = cylinder(0.035, 0.035, 0.14, IRON, { roughness: 0.35, metalness: 0.8 })
  eixo.rotation.z = Math.PI / 2
  eixo.position.x = 0.04
  manivela.add(eixo)
  const cuboM = cylinder(0.06, 0.06, 0.05, IRON, { roughness: 0.35, metalness: 0.8 })
  cuboM.rotation.z = Math.PI / 2
  cuboM.position.x = -0.04
  manivela.add(cuboM)
  const braco = rbox(0.045, 0.3, 0.07, 0.02, IRON, { roughness: 0.35, metalness: 0.8 })
  braco.position.set(-0.06, 0.13, 0)
  manivela.add(braco)
  const pino = cylinder(0.018, 0.018, 0.1, IRON, { roughness: 0.35, metalness: 0.8 })
  pino.rotation.z = Math.PI / 2
  pino.position.set(-0.11, 0.25, 0)
  manivela.add(pino)
  const punho = cylinder(0.04, 0.04, 0.16, HONEY_DARK, { roughness: 0.6 })
  punho.rotation.z = Math.PI / 2
  punho.position.set(-0.22, 0.25, 0)
  manivela.add(punho)
  root.add(manivela)

  // ---- HÉLICE de duas pás (acento) ------------------------------------------
  const helice = new THREE.Group()
  helice.position.set(MAST_X, MAST_TOP, MAST_Z + 0.27)
  helice.rotation.z = HEL_ROT

  const cubo = cylinder(0.1, 0.1, 0.12, METAL, { roughness: 0.3, metalness: 0.8 })
  cubo.rotation.x = Math.PI / 2
  helice.add(cubo)
  const ogiva = cone(0.1, 0.16, ACCENT, { roughness: 0.35 })
  ogiva.rotation.x = Math.PI / 2
  ogiva.position.z = 0.14
  helice.add(ogiva)

  for (const side of [-1, 1]) {
    const pa = new THREE.Group()
    pa.rotation.z = side > 0 ? 0 : Math.PI
    const raiz = rbox(0.1, 0.18, 0.05, 0.02, HONEY_DARK, { roughness: 0.5 })
    raiz.position.y = 0.14
    pa.add(raiz)
    const lamina = rbox(0.19, 0.46, 0.045, 0.02, HONEY, { roughness: 0.45 })
    lamina.position.y = 0.42
    lamina.rotation.y = 0.35
    pa.add(lamina)
    const ponta = rbox(0.195, 0.12, 0.05, 0.03, ACCENT, { roughness: 0.4 })
    ponta.position.y = 0.7
    ponta.rotation.y = 0.35
    pa.add(ponta)
    helice.add(pa)
  }
  root.add(helice)

  // ---- CEGONHA de folga: corpo, pescoço, cabeça (orgânico) -----------------
  const cegonha = new THREE.Group()
  cegonha.position.set(STORK_X, GY, STORK_Z)
  root.add(cegonha)

  const corpo = sphere(0.4, STORK, { roughness: 0.85 })
  corpo.scale.set(1.45, 0.88, 0.9)
  corpo.position.set(0, 1.22, 0)
  corpo.rotation.z = 0.18
  cegonha.add(corpo)

  const peito = sphere(0.3, STORK, { roughness: 0.85 })
  peito.position.set(0.34, 1.32, 0)
  cegonha.add(peito)

  const cauda = sphere(0.22, STORK_SH, { roughness: 0.85 })
  cauda.scale.set(1.5, 0.4, 0.95)
  cauda.position.set(-0.62, 1.08, 0)
  cauda.rotation.z = 0.35
  cegonha.add(cauda)

  // asa do lado de lá: dobrada, primárias pretas para trás
  const asaLonge = sphere(0.33, STORK_SH, { roughness: 0.85 })
  asaLonge.scale.set(1.55, 0.72, 0.35)
  asaLonge.position.set(-0.12, 1.26, -0.28)
  asaLonge.rotation.z = 0.12
  cegonha.add(asaLonge)
  const pontaLonge = sphere(0.2, FEATHER_BLACK, { roughness: 0.8 })
  pontaLonge.scale.set(1.9, 0.48, 0.32)
  pontaLonge.position.set(-0.62, 1.14, -0.25)
  pontaLonge.rotation.z = 0.25
  cegonha.add(pontaLonge)

  // ombro do lado de cá (a asa estendida sai dele)
  const ombro = sphere(0.18, STORK_SH, { roughness: 0.85 })
  ombro.scale.set(1.3, 0.9, 0.7)
  ombro.position.set(0.08, 1.36, 0.24)
  cegonha.add(ombro)
  // primárias pretas do lado de cá, dobradas atrás do ombro
  const pontaPerto = sphere(0.18, FEATHER_BLACK, { roughness: 0.8 })
  pontaPerto.scale.set(1.9, 0.45, 0.3)
  pontaPerto.position.set(-0.55, 1.15, 0.25)
  pontaPerto.rotation.z = 0.25
  cegonha.add(pontaPerto)

  const pescoco1 = capsule(0.11, 0.42, STORK, { roughness: 0.85 })
  pescoco1.position.set(0.48, 1.64, 0)
  pescoco1.rotation.z = -0.28
  cegonha.add(pescoco1)
  const pescoco2 = capsule(0.095, 0.22, STORK, { roughness: 0.85 })
  pescoco2.position.set(0.55, 1.95, 0)
  pescoco2.rotation.z = 0.2
  cegonha.add(pescoco2)

  // cabeça virada para a câmera (o bico aponta para o espectador)
  const cabecaC = new THREE.Group()
  cabecaC.position.set(0.52, 2.1, 0)
  cabecaC.rotation.y = -0.75
  cegonha.add(cabecaC)

  const cranio = sphere(0.17, STORK, { roughness: 0.85 })
  cranio.scale.set(1.15, 1, 0.95)
  cabecaC.add(cranio)

  // ---- asa estendida que agarra a manivela (orgânico, peça própria) --------
  const handWorld = new THREE.Vector3(-0.22, 0.25, 0)
    .applyEuler(new THREE.Euler(SPIN, 0, 0))
    .add(new THREE.Vector3(CRANK_X, BOX_Y, MAST_Z))
  const shoulderLocal = new THREE.Vector3(0.12, 1.38, 0.3)
  const toHand = handWorld.clone().sub(new THREE.Vector3(STORK_X, GY, STORK_Z)).sub(shoulderLocal)
  const WING_L = toHand.length()
  const WING_YAW = Math.atan2(-toHand.z, toHand.x)
  const WING_PITCH = Math.atan2(toHand.y, Math.hypot(toHand.x, toHand.z))

  const asa = new THREE.Group()
  asa.position.copy(shoulderLocal)
  asa.rotation.set(0, WING_YAW, WING_PITCH, 'YZX')
  cegonha.add(asa)

  const braquio = sphere(0.14, STORK, { roughness: 0.85 })
  braquio.scale.set((WING_L * 0.32) / 0.14, 0.75, 0.9)
  braquio.position.x = WING_L * 0.24
  asa.add(braquio)
  const antebracoA = sphere(0.12, STORK_SH, { roughness: 0.85 })
  antebracoA.scale.set((WING_L * 0.3) / 0.12, 0.7, 0.95)
  antebracoA.position.set(WING_L * 0.58, 0.02, 0)
  asa.add(antebracoA)
  // "dedos" de penas pretas fechados em volta do punho da manivela
  for (let i = 0; i < 4; i++) {
    const pena = capsule(0.038, 0.17, FEATHER_BLACK, { roughness: 0.8 })
    pena.rotation.z = -Math.PI / 2 + (i - 1.5) * 0.28
    pena.position.set(WING_L * 0.86, (i - 1.5) * 0.045, -0.02 + (i % 2) * 0.03)
    asa.add(pena)
  }

  // ---- bico de meio metro em biquinho de beijo -----------------------------
  const bico = new THREE.Group()
  bico.position.set(0.15, -0.02, 0)
  bico.rotation.z = -0.12
  cabecaC.add(bico)

  const haste = cylinder(0.022, 0.068, 0.5, BEAK, { roughness: 0.4 })
  haste.rotation.z = -Math.PI / 2
  haste.position.x = 0.25
  bico.add(haste)
  const fenda = rbox(0.42, 0.012, 0.012, 0.005, BEAK_DARK, { roughness: 0.5 })
  fenda.position.set(0.24, -0.004, 0)
  fenda.scale.z = 1
  bico.add(fenda)
  // a ponta franzida: lábios em "O"
  const labios = torus(0.04, 0.024, LIPS, { roughness: 0.35 })
  labios.rotation.y = Math.PI / 2
  labios.position.x = 0.515
  bico.add(labios)
  const miolo = sphere(0.022, BEAK_DARK, { roughness: 0.4 })
  miolo.position.x = 0.505
  bico.add(miolo)

  // ---- óculos de aviador ---------------------------------------------------
  const oculos = new THREE.Group()
  cabecaC.add(oculos)

  const tira = torus(0.17, 0.02, LEATHER, { roughness: 0.75 })
  tira.rotation.x = Math.PI / 2
  tira.scale.set(1.18, 1, 1)
  tira.position.y = 0.04
  oculos.add(tira)
  for (const side of [-1, 1]) {
    const copa = cylinder(0.068, 0.075, 0.06, LEATHER_DARK, { roughness: 0.6 })
    copa.rotation.x = Math.PI / 2
    copa.position.set(0.05, 0.045, side * 0.16)
    oculos.add(copa)
    const aroL = torus(0.064, 0.013, BRASS, { roughness: 0.3, metalness: 0.8 })
    aroL.position.set(0.05, 0.045, side * 0.19)
    oculos.add(aroL)
    const lente = cylinder(0.058, 0.058, 0.012, LENS, { roughness: 0.08 })
    lente.rotation.x = Math.PI / 2
    lente.position.set(0.05, 0.045, side * 0.188)
    oculos.add(lente)
    const pupila = sphere(0.024, '#151515', { roughness: 0.2 })
    pupila.scale.z = 0.5
    pupila.position.set(0.07, 0.05, side * 0.195)
    oculos.add(pupila)
    const brilho = sphere(0.01, '#ffffff', { roughness: 0.1 })
    brilho.position.set(0.085, 0.07, side * 0.198)
    oculos.add(brilho)
  }

  // ---- pernas finas vermelhas (rígidas, peça própria) ----------------------
  const pernas = new THREE.Group()
  pernas.position.set(STORK_X, GY, STORK_Z)
  root.add(pernas)

  for (const side of [-1, 1]) {
    // perna de cá meio passo à frente: as duas lêem de perfil
    const z = side * 0.12
    const dx = side * 0.08
    const pe = new THREE.Vector3(0.04 + dx, 0.03, z)
    const joelho = new THREE.Vector3(-0.06 + dx, 0.5, z)
    const coxa = new THREE.Vector3(0.02 + dx * 0.5, 0.95, z * 0.8)
    pernas.add(link(pe, joelho, 0.03, LEG_RED, 0.5))
    pernas.add(link(joelho, coxa, 0.034, LEG_RED, 0.5))
    const junta = sphere(0.045, LEG_RED, { roughness: 0.5 })
    junta.position.copy(joelho)
    pernas.add(junta)
    // três dedos para a frente e um para trás
    for (const a of [-0.45, 0, 0.45]) {
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
      pernas.add(link(pe, pe.clone().addScaledVector(dir, 0.2).setY(0.015), 0.018, LEG_RED, 0.5))
    }
    pernas.add(link(pe, pe.clone().add(new THREE.Vector3(-0.11, -0.015, 0)), 0.017, LEG_RED, 0.5))
  }

  // ---- malinha de fim de semana amarela, presa no pé ----------------------
  const mala = new THREE.Group()
  const MALA_POS = new THREE.Vector3(STORK_X + 0.55, GY, STORK_Z + 0.62)
  mala.position.copy(MALA_POS)
  mala.rotation.y = -0.25
  root.add(mala)

  const S = 1.25 // escala da malinha
  const caixaMala = rbox(0.46 * S, 0.32 * S, 0.17 * S, 0.05 * S, YELLOW, { roughness: 0.45 })
  caixaMala.position.y = 0.16 * S
  mala.add(caixaMala)
  const friso = rbox(0.47 * S, 0.03 * S, 0.18 * S, 0.012 * S, YELLOW_DARK, { roughness: 0.5 })
  friso.position.y = 0.2 * S
  mala.add(friso)
  for (const sx of [-1, 1]) {
    const fecho = rbox(0.05 * S, 0.045 * S, 0.02 * S, 0.008 * S, BRASS, { roughness: 0.3, metalness: 0.8 })
    fecho.position.set(sx * 0.13 * S, 0.25 * S, 0.088 * S)
    mala.add(fecho)
    const canto = sphere(0.035 * S, LEATHER, { roughness: 0.6 })
    canto.position.set(sx * 0.205 * S, 0.03 * S, 0.06 * S)
    mala.add(canto)
  }
  const alcaMala = torus(0.07 * S, 0.018 * S, LEATHER, { roughness: 0.6 })
  alcaMala.position.y = 0.33 * S
  alcaMala.scale.y = 0.75
  mala.add(alcaMala)
  // adesivos de viagem
  const adesivo1 = cylinder(0.055 * S, 0.055 * S, 0.01, '#4a8fc9', { roughness: 0.5 })
  adesivo1.rotation.x = Math.PI / 2
  adesivo1.position.set(-0.11 * S, 0.12 * S, 0.088 * S)
  mala.add(adesivo1)
  const adesivo2 = rbox(0.09 * S, 0.06 * S, 0.01, 0.01, '#e05a4a', { roughness: 0.5 })
  adesivo2.position.set(0.1 * S, 0.1 * S, 0.088 * S)
  adesivo2.rotation.z = 0.2
  mala.add(adesivo2)
  // cordinha da alça até o tornozelo da cegonha (calculada no espaço da mala)
  const Y = new THREE.Vector3(0, 1, 0)
  const tornozelo = new THREE.Vector3(STORK_X + 0.067, GY + 0.28, STORK_Z + 0.12)
    .sub(MALA_POS)
    .applyAxisAngle(Y, -mala.rotation.y)
  mala.add(link(new THREE.Vector3(0, 0.36 * S, 0), tornozelo, 0.02, LEATHER, 0.7))
  const laco = torus(0.045, 0.014, LEATHER, { roughness: 0.7 })
  laco.rotation.x = Math.PI / 2
  laco.position.copy(tornozelo)
  mala.add(laco)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'laje', object: base },
    { name: 'ninho', group: 'laje', object: ninho },
    { name: 'trouxinha', group: 'folga', object: trouxinha },
    { name: 'mastro', group: 'mastro', object: mastro },
    { name: 'manivela', group: 'mastro', object: manivela },
    { name: 'pernas', group: 'cegonha', object: pernas },
    { name: 'cegonha', group: 'cegonha', object: cegonha },
    { name: 'oculos', group: 'cegonha', object: oculos },
    { name: 'asa', group: 'ior', object: asa },
    { name: 'bico', group: 'du', object: bico },
    { name: 'helice', group: 'helgen', object: helice },
    { name: 'mala', group: 'final', object: mala },
  ]

  // ---- montagem ------------------------------------------------------------
  const W = WING_PITCH
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.95)], {
      ease: 'easeOut',
      caption: "Sexta, seis da tarde: sobe a mesma laje de 'Trevlig helg!', com o ninho de gravetos no canto…",
    }),
    seq('ninho-rise', 'ninho', 0.25, 0.7, [riseFrom(GY, 0.8)], { ease: 'easeOut' }),

    seq(
      'trouxinha-pendura',
      'trouxinha',
      1.6,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'No prego da mureta, a trouxinha de bebê pendurada: fim de semana não tem entrega.',
      },
    ),
    seq('trouxinha-balanca', 'trouxinha', 2.1, 0.7, [
      ch('rotation.y', NAIL_A + Math.PI + 0.3, NAIL_A + Math.PI),
    ], { ease: 'easeOut' }),

    seq('pernas-rise', 'pernas', 3.3, 0.7, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('cegonha-rise', 'cegonha', 3.3, 0.8, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: 'Chega a CEGONHA de folga, de óculos de aviador, e berra: VÁ!',
    }),
    seq(
      'oculos-pop',
      'oculos',
      4.1,
      0.45,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('mastro-rise', 'mastro', 5.0, 0.8, [riseFrom(0, 2.9)], {
      ease: 'easeOut',
      caption: 'Ela agarra a manivela enferrujada do mastro e gira: iiiÖR… iiiÖR — o rangido de "Det gör ont här".',
    }),
    seq(
      'manivela-pop',
      'manivela',
      5.5,
      0.4,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('asa-estende', 'asa', 5.6, 0.5, [ch('scale.x', 0.2, 1)], { ease: 'easeOut' }),
    seq('manivela-gira1', 'manivela', 6.2, 1.4, [ch('rotation.x', SPIN - Math.PI * 4, SPIN - Math.PI * 2)]),
    seq('asa-sobe1', 'asa', 6.2, 0.35, [ch('rotation.z', W, W + 0.16)], { ease: 'easeInOut' }),
    seq('asa-desce1', 'asa', 6.55, 0.35, [ch('rotation.z', W + 0.16, W - 0.14)], { ease: 'easeInOut' }),
    seq('asa-sobe2', 'asa', 6.9, 0.35, [ch('rotation.z', W - 0.14, W + 0.16)], { ease: 'easeInOut' }),
    seq('asa-desce2', 'asa', 7.25, 0.35, [ch('rotation.z', W + 0.16, W)], { ease: 'easeInOut' }),

    seq(
      'bico-bico',
      'bico',
      7.7,
      0.5,
      [ch('scale.x', 0.15, 1), ch('scale.y', 0.15, 1), ch('scale.z', 0.15, 1)],
      {
        ease: 'easeOut',
        caption: 'O rangido emenda no sopro, com o bico de meio metro em biquinho de beijo: IÖR-DÜÜ!',
      },
    ),
    seq('manivela-gira2', 'manivela', 7.7, 1.3, [ch('rotation.x', SPIN - Math.PI * 2, SPIN)]),

    seq(
      'helice-surge',
      'helice',
      9.2,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'Mais uma volta, I… e a velha HÉLICE da laje pega no tranco: RRÉL-IEN, RRÉL-IEN!',
      },
    ),
    seq('helice-gira', 'helice', 9.5, 1.6, [ch('rotation.z', HEL_ROT - Math.PI * 8, HEL_ROT)], {
      ease: 'easeOut',
    }),

    seq('mala-rise', 'mala', 11.0, 0.6, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Malinha amarela no pé, pronta pra decolar: VÁ, IÖR-DÜ I RRÉL-IEN?',
    }),
    seq('trouxinha-fim', 'trouxinha', 12.3, 0.6, [
      ch('rotation.y', NAIL_A + Math.PI + 0.15, NAIL_A + Math.PI),
    ], {
      ease: 'easeOut',
      caption: 'Vad gör du i helgen? — O que você vai fazer no fim de semana?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.3, 5.3], target: [0.3, 1.7, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-gor-du-i-helgen',
    contexto:
      "Quinta ou sexta na fika do trabalho, no portão da förskola, com o vizinho no elevador — o small talk do fim da semana. Na segunda vira 'Vad gjorde du i helgen?'.",
    fraseFonte: 'O que você vai fazer no fim de semana?',
    fraseAlvo: 'Vad gör du i helgen?',
    pronuncia:
      "va IÖR-dü i RRÉL-ien? ('vad' perde o d na fala: VÁ, sem R; 'gör' começa com I de ioga + ö: IÖR, R brando que DERRETE no 'du' — na fala 'gör du' sai quase 'iö-rü', com a língua enrolada; 'du' com U de bico (Ü); 'helgen' = RRÉL-ien, h soprado tipo rr carioca e o g vira i — duas sílabas; força em IÖR e em RRÉL)",
    ponteSonora:
      "VÁ, IÖR-DÜ I RRÉL-IEN? (6 batidas, tônicas em IÖR e RRÉL; VÁ é o MESMO 'vad' de 'VÁ, CÜL!' e 'VÁ! É CLÓ-CAN' — sem R nenhum, senão vira 'var' (onde); IÖR é o rangido da manivela da carta 'Det gör ont här' — I de IOGA (nunca G duro nem J chiado), boca de Ô com língua de Ê; o R BRANDO do IÖR não para: derrete direto no DÜ, sem pausa — IÖR-DÜ num fôlego só, quase 'iö-rü', que é como o sueco fala; DÜ com BICO de beijo, nunca o U chapado de 'tu'; RRÉL-IEN é a HÉLICE de 'Trevlig helg!' (RRÉLI) com o -EN sueco colado — DUAS sílabas só, o I vira ponte de ioga entre o L e o EN, e o h é soprado como RR carioca)",
    historia:
      'Sexta, seis da tarde: a cegonha pendura a trouxinha de bebê no prego — fim de semana não tem entrega pra ninguém. Ela berra VÁ!, agarra a manivela enferrujada e gira sem parar, o rangido emendando no sopro: iiiÖR-DÜÜ, iiiÖR-DÜÜ — o mesmo rangido do consultório da marmota, agora com o bico de meio metro fazendo biquinho de beijo. Mais uma volta, I... — e a velha hélice travada da laje finalmente pega no tranco: RRÉLI-EN, RRÉLI-EN! Com a malinha amarela no pé, ela decola, e o prédio inteiro se debruça na mureta perguntando: e aí, o que você vai fazer no fim de semana?',
  },
  createScene,
  refine: { organic: ['cegonha', 'asa'] },
}

export default card
