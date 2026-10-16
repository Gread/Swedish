import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Kan jag få rabatt?" — CA-NIÁ, FÔ... RA-BÁT?
 *
 * Mercado de RABAT, no Marrocos: sob um arco de pedra em ferradura com a
 * placa RABAT, uma FÊNIX de fez pousa no balcão da banca de especiarias,
 * bate a CANA no balcão (CA-NIÁ!), estufa as bochechas e sopra FÔ — uma bola
 * de fogo que queima pela metade a plaquinha de preço espetada no cone
 * laranja. RABAT é quase 'rabatt': desconto.
 *
 * Acento saturado reservado ao FOGO (bola de fogo e borda da plaquinha
 * queimada; a cana fica sem fogo — 'vara em brasa' é âncora de outra carta); o resto em areia, cobre, madeira escura e azulejo.
 */

const TERRA = '#6e5640'
const REJUNTE = '#d3cab7'
const AZUL = '#3b6698'
const BRANCO = '#ebe6d8'
const TERRACOTA = '#b0623e'
const AREIA = '#d9bc8c'
const AREIA_ESC = '#bf9f6f'
const VERDE_PLACA = '#2c6a63'
const CREME = '#f3ead6'
const MADEIRA = '#4a2f20'
const MADEIRA_ESC = '#352116'
const COBRE = '#b5683a'
const VERMELHO = '#c8372a'
const VERMELHO_ESC = '#9f2721'
const PEITO = '#ef8a2c'
const CABECA = '#ec7a2a'
const BOCHECHA = '#f5a13d'
const DOURADO = '#f0b437'
const BICO = '#f4c94a'
const PERNA = '#dc9c35'
const FEZ = '#86182a'
const CANA = '#b4b54c'
const CANA_NO = '#878a34'
const FOGO = '#ff7a12' // acento: tudo que é FÔ
const BRASA = '#ffd44d'
const CARVAO = '#1f1612'
const PLAQUINHA = '#e6cf9f'

const GY = 0.18 // topo da base
const TOP = 0.85 // tampo do balcão
const AZ = -1.25 // plano do arco
const ARC_R = 1.3
const ARC_C = 1.78 // centro do arco em ferradura
const PHX: [number, number, number] = [-0.45, TOP, 0.0]
const PHX_ROT = 1.12 // fênix virada para +x (a plaquinha), 3/4 para a câmera
const PHX_S = 1.15 // fênix grande: protagonista
const TAG: [number, number, number] = [0.95, TOP + 0.36, 0.27]
const FOGO_POS: [number, number, number] = [0.5, 1.92, 0.27]

type V3 = [number, number, number]

/** Cápsula de a até b (penas, pernas, braços de asa). */
function between(a: V3, b: V3, r: number, color: string, opts?: Parameters<typeof capsule>[3]) {
  const A = new THREE.Vector3(...a)
  const B = new THREE.Vector3(...b)
  const m = capsule(r, Math.max(0.001, A.distanceTo(B)), color, opts)
  m.position.copy(A).add(B).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize())
  return m
}

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.035, 0.008, CREME, { roughness: 0.55 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** R A B T — letras de traço grosso (altura ~0.16 antes da escala). */
function letter(which: 'R' | 'A' | 'B' | 'T') {
  const g = new THREE.Group()
  const t = 0.03
  if (which === 'B') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.072, t, -0.008, 0.067))
    g.add(stroke(0.072, t, -0.008, 0))
    g.add(stroke(0.072, t, -0.008, -0.067))
    g.add(stroke(t, 0.06, 0.03, 0.036))
    g.add(stroke(t, 0.06, 0.03, -0.036))
  } else if (which === 'A') {
    g.add(stroke(t, 0.17, -0.027, 0, -0.3))
    g.add(stroke(t, 0.17, 0.027, 0, 0.3))
    g.add(stroke(0.06, 0.026, 0, -0.026))
  } else if (which === 'R') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.07, t, -0.008, 0.067))
    g.add(stroke(0.07, t, -0.008, 0.004))
    g.add(stroke(t, 0.06, 0.03, 0.036))
    g.add(stroke(t, 0.09, 0.024, -0.045, 0.5))
  } else {
    g.add(stroke(0.12, t, 0, 0.067))
    g.add(stroke(t, 0.16, 0, 0))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: chão de mosaico azul e branco ---------------------------------
  const base = new THREE.Group()
  const terra = cylinder(2.62, 2.72, 0.14, TERRA, { roughness: 0.9 })
  terra.position.y = 0.07
  base.add(terra)
  const rejunte = cylinder(2.5, 2.5, 0.03, REJUNTE, { roughness: 0.9 })
  rejunte.position.y = GY - 0.025
  base.add(rejunte)
  const STEP = 0.34
  for (let i = -7; i <= 7; i++) {
    for (let j = -7; j <= 7; j++) {
      const x = i * STEP
      const z = j * STEP
      const d = Math.hypot(x, z)
      if (d > 2.3) continue
      const borda = d > 1.95
      const cor = borda ? TERRACOTA : (i + j) % 2 === 0 ? AZUL : BRANCO
      const tile = rbox(0.3, 0.03, 0.3, 0.012, cor, { roughness: 0.35 })
      tile.position.set(x, GY - 0.012, z)
      base.add(tile)
      // estrelinha turquesa no centro dos azulejos brancos do miolo
      if (!borda && cor === BRANCO && d < 1.6) {
        const estrela = rbox(0.09, 0.012, 0.09, 0.01, '#3f9a95', { roughness: 0.35 })
        estrela.position.set(x, GY + 0.004, z)
        estrela.rotation.y = Math.PI / 4
        base.add(estrela)
      }
    }
  }
  // sacos de especiaria no chão
  for (const [sx, sz, cor] of [[1.75, 0.95, '#c4502c'], [-1.7, 1.15, '#d6a12a'], [1.95, 0.15, '#7d5a3a']] as const) {
    const saco = new THREE.Group()
    saco.position.set(sx, GY, sz)
    saco.rotation.y = rand() * Math.PI
    const juta = lathe(
      [[0, 0], [0.2, 0], [0.25, 0.08], [0.26, 0.24], [0.23, 0.33], [0.25, 0.37], [0.21, 0.37], [0, 0.3]],
      '#b39466',
      { roughness: 0.95 },
    )
    saco.add(juta)
    const monte = sphere(0.2, cor, { roughness: 0.95 })
    monte.scale.set(1, 0.45, 1)
    monte.position.y = 0.33
    saco.add(monte)
    const dobra = torus(0.235, 0.03, '#a2845a', { roughness: 0.95 })
    dobra.rotation.x = Math.PI / 2
    dobra.position.y = 0.36
    saco.add(dobra)
    base.add(saco)
  }
  root.add(base)

  // ---- arco de pedra em ferradura ------------------------------------------
  const arco = new THREE.Group()
  arco.position.set(0, 0, AZ)
  const ABRE = 0.08 * Math.PI // quanto a ferradura desce abaixo do centro
  const anel = new THREE.Mesh(
    new THREE.TorusGeometry(ARC_R, 0.2, 18, 64, Math.PI + 2 * ABRE),
    mat(AREIA, { roughness: 0.85, size: 2.6 }),
  )
  anel.castShadow = anel.receiveShadow = true
  anel.rotation.z = -ABRE
  anel.position.y = ARC_C
  anel.scale.z = 1.5
  arco.add(anel)
  const friso = new THREE.Mesh(
    new THREE.TorusGeometry(ARC_R - 0.2, 0.05, 12, 64, Math.PI + 2 * ABRE),
    mat(AZUL, { roughness: 0.35, size: 2.4 }),
  )
  friso.castShadow = friso.receiveShadow = true
  friso.rotation.z = -ABRE
  friso.position.set(0, ARC_C, 0.12)
  arco.add(friso)
  const PE_Y = ARC_C - ARC_R * Math.sin(ABRE)
  const PE_X = ARC_R * Math.cos(ABRE)
  for (const side of [-1, 1]) {
    const h = PE_Y - GY
    const pilar = rbox(0.4, h, 0.5, 0.04, AREIA, { roughness: 0.85 })
    pilar.position.set(side * PE_X, GY + h / 2, 0)
    arco.add(pilar)
    const capitel = rbox(0.52, 0.1, 0.6, 0.03, AREIA_ESC, { roughness: 0.8 })
    capitel.position.set(side * PE_X, PE_Y, 0)
    arco.add(capitel)
    const plinto = rbox(0.52, 0.12, 0.6, 0.03, AREIA_ESC, { roughness: 0.8 })
    plinto.position.set(side * PE_X, GY + 0.06, 0)
    arco.add(plinto)
    // faixa de azulejo no pilar
    const faixa = rbox(0.41, 0.08, 0.51, 0.02, AZUL, { roughness: 0.35 })
    faixa.position.set(side * PE_X, GY + 0.45, 0)
    arco.add(faixa)
  }
  // chave do arco
  const chave = rbox(0.22, 0.3, 0.34, 0.04, AREIA_ESC, { roughness: 0.8 })
  chave.position.set(0, ARC_C + ARC_R + 0.02, 0)
  arco.add(chave)
  root.add(arco)

  // ---- placa RABAT no alto do arco -----------------------------------------
  const placa = new THREE.Group()
  const PLACA_Y = ARC_C + ARC_R + 0.08
  placa.position.set(0, PLACA_Y, AZ + 0.3)
  const tabua = rbox(1.36, 0.42, 0.07, 0.04, VERDE_PLACA, { roughness: 0.6 })
  placa.add(tabua)
  const moldura = rbox(1.44, 0.5, 0.05, 0.05, '#c99a3c', { roughness: 0.35, metalness: 0.6 })
  moldura.position.z = -0.02
  placa.add(moldura)
  const letras: ['R' | 'A' | 'B' | 'T', number][] = [
    ['R', -0.48], ['A', -0.24], ['B', 0.0], ['A', 0.24], ['T', 0.48],
  ]
  for (const [glyph, lx] of letras) {
    const l = letter(glyph)
    l.position.set(lx, 0, 0.045)
    l.scale.setScalar(1.6)
    placa.add(l)
  }
  for (const side of [-1, 1]) {
    const rebite = sphere(0.025, '#c99a3c', { roughness: 0.3, metalness: 0.7 })
    rebite.position.set(side * 0.63, 0, 0.04)
    placa.add(rebite)
  }
  root.add(placa)

  // ---- balcão de madeira escura --------------------------------------------
  const balcao = new THREE.Group()
  const BX = 0.15
  const tampo = rbox(2.7, 0.09, 0.98, 0.035, MADEIRA, { roughness: 0.6 })
  tampo.position.set(BX, TOP - 0.045, 0.05)
  balcao.add(tampo)
  const corpoH = TOP - 0.09 - GY
  const corpo = rbox(2.56, corpoH, 0.84, 0.03, MADEIRA_ESC, { roughness: 0.75 })
  corpo.position.set(BX, GY + corpoH / 2, 0.05)
  balcao.add(corpo)
  // tapete berbere pendurado na frente
  const kilim = rbox(1.9, corpoH - 0.12, 0.025, 0.01, '#9c4a32', { roughness: 0.95 })
  kilim.position.set(BX, GY + corpoH / 2 + 0.02, 0.48)
  balcao.add(kilim)
  for (const [fy, cor] of [[-0.16, CREME], [-0.06, '#d39a3a'], [0.06, '#2f5f72'], [0.16, CREME]] as const) {
    const listra = rbox(1.9, 0.035, 0.03, 0.01, cor, { roughness: 0.95 })
    listra.position.set(BX, GY + corpoH / 2 + 0.02 + fy, 0.492)
    balcao.add(listra)
  }
  for (let k = -4; k <= 4; k++) {
    const losango = rbox(0.06, 0.06, 0.03, 0.01, '#e9d9b8', { roughness: 0.95 })
    losango.position.set(BX + k * 0.21, GY + corpoH / 2 + 0.02, 0.495)
    losango.rotation.z = Math.PI / 4
    balcao.add(losango)
  }
  for (let k = -9; k <= 9; k++) {
    const franja = cylinder(0.008, 0.008, 0.07, CREME, { roughness: 0.95 }, 6)
    franja.position.set(BX + k * 0.1, GY + 0.06, 0.49)
    balcao.add(franja)
  }
  const rodape = rbox(2.62, 0.07, 0.9, 0.025, '#2a1a10', { roughness: 0.8 })
  rodape.position.set(BX, GY + 0.035, 0.05)
  balcao.add(rodape)
  // balancinha de latão no fundo do balcão
  const prato = lathe([[0, 0], [0.14, 0.01], [0.17, 0.05], [0.15, 0.05], [0, 0.02]], '#c99a3c', { roughness: 0.3, metalness: 0.75 })
  prato.position.set(1.32, TOP, -0.28)
  balcao.add(prato)
  root.add(balcao)

  // ---- três tigelas de cobre com cones de especiaria -----------------------
  const especiarias = new THREE.Group()
  root.add(especiarias)
  const tigelas: [number, number, string][] = [
    [0.38, -0.2, '#b2332a'],
    [1.12, -0.16, '#e2a82a'],
    [TAG[0], TAG[2], '#d8742a'],
  ]
  for (const [tx, tz, cor] of tigelas) {
    const t = new THREE.Group()
    t.position.set(tx, TOP, tz)
    const cuia = lathe(
      [[0, 0], [0.12, 0], [0.19, 0.04], [0.22, 0.1], [0.215, 0.12], [0.195, 0.115], [0.17, 0.06], [0, 0.05]],
      COBRE,
      { roughness: 0.3, metalness: 0.75 },
    )
    t.add(cuia)
    const aro = torus(0.212, 0.014, '#cf8a55', { roughness: 0.25, metalness: 0.8 })
    aro.rotation.x = Math.PI / 2
    aro.position.y = 0.118
    t.add(aro)
    const monte = cone(0.2, 0.34, cor, { roughness: 0.95 })
    monte.position.y = 0.1 + 0.17
    t.add(monte)
    const saia = sphere(0.2, cor, { roughness: 0.95 })
    saia.scale.set(1, 0.25, 1)
    saia.position.y = 0.11
    t.add(saia)
    especiarias.add(t)
  }

  // ---- plaquinha de preço espetada no cone laranja -------------------------
  const plaquinha = new THREE.Group()
  plaquinha.position.set(...TAG)
  plaquinha.rotation.y = -0.3
  root.add(plaquinha)
  const palito = cylinder(0.012, 0.012, 0.36, '#d9c49a', { roughness: 0.7 }, 8)
  palito.position.y = 0.06
  plaquinha.add(palito)
  const QY = 0.38 // centro da tabuinha
  const tabuinha = rbox(0.48, 0.32, 0.03, 0.02, PLAQUINHA, { roughness: 0.7 })
  tabuinha.position.y = QY
  plaquinha.add(tabuinha)
  // preço rabiscado na metade de baixo
  for (const [rx, rw] of [[-0.06, 0.16], [0.09, 0.08]] as const) {
    const rabisco = rbox(rw, 0.035, 0.012, 0.01, '#5a3a22', { roughness: 0.8 })
    rabisco.position.set(rx, QY - 0.08, 0.018)
    plaquinha.add(rabisco)
  }
  const furo = torus(0.02, 0.006, '#8b6a44', { roughness: 0.6 })
  furo.position.set(0, QY + 0.125, 0.018)
  plaquinha.add(furo)

  // metade de cima queimada (peça própria: cresce de cima para baixo)
  const queimado = new THREE.Group()
  queimado.position.y = QY + 0.165
  plaquinha.add(queimado)
  const carvao = rbox(0.5, 0.17, 0.036, 0.02, CARVAO, { roughness: 0.95 })
  carvao.position.y = -0.08
  queimado.add(carvao)
  for (const [cx, cy, cr] of [[-0.18, -0.17, 0.045], [-0.06, -0.18, 0.04], [0.07, -0.16, 0.045], [0.19, -0.175, 0.035]] as const) {
    const lasca = sphere(cr, CARVAO, { roughness: 0.95 })
    lasca.scale.z = 0.5
    lasca.position.set(cx, cy, 0)
    queimado.add(lasca)
  }
  for (const [ex, ey, ew, er] of [[-0.15, -0.2, 0.14, 0.25], [0.01, -0.21, 0.14, -0.2], [0.17, -0.195, 0.12, 0.2]] as const) {
    const brasaBorda = capsule(0.011, ew, FOGO, { emissive: FOGO, emissiveIntensity: 1.6 })
    brasaBorda.rotation.z = Math.PI / 2 + er
    brasaBorda.position.set(ex, ey, 0.02)
    queimado.add(brasaBorda)
  }
  const fumaca = puff(0.07, '#8d8780', 4, 13, { roughness: 1 })
  fumaca.position.set(0.05, 0.08, -0.02)
  queimado.add(fumaca)
  const fumaca2 = puff(0.05, '#a39d95', 3, 17, { roughness: 1 })
  fumaca2.position.set(-0.04, 0.2, -0.04)
  queimado.add(fumaca2)

  // ---- FÊNIX ---------------------------------------------------------------
  const fenix = new THREE.Group()
  fenix.position.set(...PHX)
  fenix.rotation.y = PHX_ROT
  fenix.scale.setScalar(PHX_S)
  root.add(fenix)

  for (const side of [-1, 1]) {
    fenix.add(between([side * 0.13, 0.05, 0.03], [side * 0.12, 0.34, -0.02], 0.045, PERNA, { roughness: 0.5 }))
    const coxa = sphere(0.14, VERMELHO, { roughness: 0.8 })
    coxa.position.set(side * 0.13, 0.38, -0.02)
    fenix.add(coxa)
    for (const a of [-0.45, 0, 0.45]) {
      fenix.add(between(
        [side * 0.13, 0.035, 0.03],
        [side * 0.13 + Math.sin(a) * 0.13, 0.03, 0.03 + Math.cos(a) * 0.13],
        0.03, PERNA, { roughness: 0.5 },
      ))
    }
    fenix.add(between([side * 0.13, 0.035, 0.0], [side * 0.13, 0.03, -0.1], 0.026, PERNA, { roughness: 0.5 }))
  }

  const corpo2 = sphere(0.4, VERMELHO, { roughness: 0.8 })
  corpo2.scale.set(0.95, 1.1, 1.05)
  corpo2.position.set(0, 0.64, -0.05)
  corpo2.rotation.x = 0.25
  fenix.add(corpo2)
  const peito = sphere(0.3, PEITO, { roughness: 0.8 })
  peito.scale.set(0.95, 1.08, 0.8)
  peito.position.set(0, 0.68, 0.17)
  fenix.add(peito)
  fenix.add(between([0, 0.86, 0.04], [0, 1.08, 0.12], 0.17, VERMELHO, { roughness: 0.8 }))
  fenix.add(between([0, 0.84, 0.12], [0, 1.02, 0.18], 0.13, PEITO, { roughness: 0.8 }))

  // asa de trás (dobrada) com pontas douradas
  const asaT = sphere(0.3, VERMELHO_ESC, { roughness: 0.8 })
  asaT.scale.set(0.32, 0.78, 1.15)
  asaT.position.set(0.35, 0.68, -0.1)
  asaT.rotation.x = 0.45
  fenix.add(asaT)
  for (let k = 0; k < 3; k++) {
    fenix.add(between([0.36, 0.5, -0.25 - k * 0.05], [0.36 - k * 0.02, 0.32 - k * 0.04, -0.5 - k * 0.07], 0.05, DOURADO, { roughness: 0.6 }))
  }
  // asa da frente: ombro dobrado e o "braço" que segura a cana
  const asaF = sphere(0.3, VERMELHO_ESC, { roughness: 0.8 })
  asaF.scale.set(0.32, 0.7, 1.0)
  asaF.position.set(-0.36, 0.72, -0.06)
  asaF.rotation.x = 0.3
  fenix.add(asaF)
  fenix.add(between([-0.4, 0.86, -0.02], [-0.38, 0.74, -0.24], 0.1, VERMELHO_ESC, { roughness: 0.8 }))
  for (let k = 0; k < 3; k++) {
    fenix.add(between([-0.38, 0.76 - k * 0.04, -0.26], [-0.3 + k * 0.02, 0.74 - k * 0.05, -0.36], 0.042, DOURADO, { roughness: 0.6 }))
  }
  for (let k = 0; k < 3; k++) {
    fenix.add(between([-0.38, 0.55, -0.15 - k * 0.06], [-0.38 + k * 0.02, 0.36 - k * 0.04, -0.38 - k * 0.07], 0.048, DOURADO, { roughness: 0.6 }))
  }

  // ---- cabeça: bochechas estufadas, bico soprando --------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.2, 0.14)
  fenix.add(cabeca)
  const cranio = sphere(0.24, CABECA, { roughness: 0.75 })
  cranio.scale.set(1, 1, 1.05)
  cabeca.add(cranio)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.14, BOCHECHA, { roughness: 0.7 })
    bochecha.position.set(side * 0.15, -0.06, 0.1)
    cabeca.add(bochecha)
    const rubor = sphere(0.05, '#ef6d45', { roughness: 0.7 })
    rubor.scale.z = 0.5
    rubor.position.set(side * 0.235, -0.07, 0.15)
    cabeca.add(rubor)
    const esclera = sphere(0.062, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(side * 0.11, 0.08, 0.2)
    const pupila = sphere(0.032, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.113, 0.075, 0.238)
    cabeca.add(esclera, pupila)
    // pálpebra a meio pau: olhar malandro de quem pechincha
    const palpebra = sphere(0.064, CABECA, { roughness: 0.75 })
    palpebra.scale.set(1, 0.55, 0.62)
    palpebra.position.set(side * 0.11, 0.115, 0.2)
    cabeca.add(palpebra)
    const sobrancelha = capsule(0.018, 0.08, '#7d1f18', { roughness: 0.8 })
    sobrancelha.position.set(side * 0.11, 0.16, 0.21)
    sobrancelha.rotation.z = Math.PI / 2 + side * 0.3
    cabeca.add(sobrancelha)
  }
  const bicoSup = cone(0.075, 0.22, BICO, { roughness: 0.4 })
  bicoSup.rotation.x = Math.PI / 2 + 0.12
  bicoSup.position.set(0, -0.0, 0.31)
  cabeca.add(bicoSup)
  const bicoInf = cone(0.055, 0.15, '#e0ad3a', { roughness: 0.4 })
  bicoInf.rotation.x = Math.PI / 2 - 0.35
  bicoInf.position.set(0, -0.085, 0.27)
  cabeca.add(bicoInf)
  // crista de chamas saindo por trás do fez
  for (const [cx, ang, len, cor] of [
    [0, -0.55, 0.36, DOURADO], [-0.08, -0.75, 0.3, BRASA], [0.08, -0.75, 0.3, BRASA],
    [-0.04, -1.0, 0.26, DOURADO], [0.04, -1.0, 0.26, DOURADO],
  ] as const) {
    const chama = cone(0.065, len, cor, { roughness: 0.5 })
    chama.position.set(cx, 0.16 + Math.cos(-ang) * len * 0.4, -0.1 + Math.sin(ang) * len * 0.45)
    chama.rotation.x = ang
    cabeca.add(chama)
  }

  // ---- fez vermelho com pendão preto ---------------------------------------
  const fez = new THREE.Group()
  fez.position.set(0, 0.19, 0.0)
  fez.rotation.set(-0.12, 0, -0.16)
  cabeca.add(fez)
  const copa = lathe(
    [[0, 0], [0.165, 0], [0.17, 0.02], [0.135, 0.25], [0.12, 0.26], [0, 0.26]],
    FEZ,
    { roughness: 0.85 },
  )
  fez.add(copa)
  const botao = sphere(0.025, '#1c1a1a', { roughness: 0.6 })
  botao.position.y = 0.265
  fez.add(botao)
  fez.add(between([0, 0.265, 0], [0.12, 0.24, -0.06], 0.009, '#1c1a1a', { roughness: 0.6 }))
  fez.add(between([0.13, 0.235, -0.065], [0.155, 0.08, -0.08], 0.012, '#1c1a1a', { roughness: 0.6 }))
  const borla = capsule(0.03, 0.08, '#1c1a1a', { roughness: 0.9 })
  borla.position.set(0.158, 0.06, -0.08)
  fez.add(borla)

  // ---- cauda longa caindo do balcão ----------------------------------------
  const cauda = new THREE.Group()
  cauda.position.set(0, 0.48, -0.36)
  fenix.add(cauda)
  const CORES_CAUDA = [DOURADO, VERMELHO, PEITO, DOURADO, VERMELHO, PEITO, DOURADO]
  for (let k = 0; k < 7; k++) {
    const sx = (k - 3) * 0.075
    const zA = -0.55 - k * 0.07
    const yA = -0.18 - (k % 2) * 0.06
    const end: V3 = [sx * 1.6, -0.88 - (k % 3) * 0.06, zA - 0.18 - (k % 2) * 0.06]
    const cor = CORES_CAUDA[k]
    cauda.add(between([sx * 0.3, 0, 0], [sx, yA, zA], 0.075, cor, { roughness: 0.65 }))
    cauda.add(between([sx, yA, zA], end, 0.068, cor, { roughness: 0.65 }))
    const ponta = sphere(0.12, cor, { roughness: 0.65 })
    ponta.scale.set(0.75, 1.45, 0.55)
    ponta.position.set(end[0], end[1] - 0.1, end[2] - 0.02)
    cauda.add(ponta)
    const olho = sphere(0.05, cor === DOURADO ? VERMELHO : DOURADO, { roughness: 0.6 })
    olho.scale.z = 0.6
    olho.position.set(end[0], end[1] - 0.12, end[2] + 0.05)
    cauda.add(olho)
  }
  // penachos em leque subindo da garupa: a silhueta de cauda de fênix
  for (const [mid, end, cor] of [
    [[-0.06, 0.3, -0.3], [-0.12, 0.58, -0.5], DOURADO],
    [[0.0, 0.22, -0.38], [0.0, 0.36, -0.74], PEITO],
    [[0.06, 0.12, -0.4], [0.12, 0.12, -0.82], VERMELHO],
  ] as [V3, V3, string][]) {
    cauda.add(between([0, 0.02, 0], mid, 0.058, cor, { roughness: 0.6 }))
    cauda.add(between(mid, end, 0.042, cor, { roughness: 0.6 }))
  }

  // ---- cana-de-açúcar (sem fogo), segura pela asa da frente ------------------
  const cana = new THREE.Group()
  cana.position.set(-0.36, 0, -0.32)
  cana.rotation.set(-0.08, 0, 0.06)
  fenix.add(cana)
  const colmo = cylinder(0.042, 0.045, 1.12, CANA, { roughness: 0.55 }, 16)
  colmo.position.y = 0.56
  cana.add(colmo)
  for (let k = 1; k <= 5; k++) {
    const no = torus(0.046, 0.013, CANA_NO, { roughness: 0.6 })
    no.rotation.x = Math.PI / 2
    no.position.y = k * 0.19
    cana.add(no)
  }
  const folha = capsule(0.02, 0.2, '#6f9a3a', { roughness: 0.7 })
  folha.position.set(0.08, 0.98, 0)
  folha.rotation.z = -0.8
  cana.add(folha)
  // ponta cortada, sem fogo: só uma marquinha chamuscada onde a asa segura
  const corte = cylinder(0.04, 0.042, 0.012, '#d8d39a', { roughness: 0.7 }, 16)
  corte.position.y = 1.126
  cana.add(corte)
  const chamuscado = sphere(0.03, CARVAO, { roughness: 0.95 })
  chamuscado.scale.set(0.6, 1.3, 0.4)
  chamuscado.position.set(0.0, 0.72, 0.038)
  cana.add(chamuscado)

  // ---- bola de fogo: do bico em direção à plaquinha ------------------------
  const fogo = new THREE.Group()
  fogo.position.set(...FOGO_POS)
  root.add(fogo)
  // direção de voo (bico → plaquinha), para a cauda de chamas apontar para trás
  const bicoW = new THREE.Vector3(
    PHX[0] + Math.sin(PHX_ROT) * 0.55 * PHX_S,
    PHX[1] + 1.18 * PHX_S,
    PHX[2] + Math.cos(PHX_ROT) * 0.55 * PHX_S,
  )
  const tras = bicoW.clone().sub(new THREE.Vector3(...FOGO_POS))
  const nucleo = sphere(0.15, '#fff3b8', { emissive: BRASA, emissiveIntensity: 1.6 })
  fogo.add(nucleo)
  const chamaA = puff(0.17, FOGO, 6, 21, { emissive: FOGO, emissiveIntensity: 1.2 })
  chamaA.scale.setScalar(1.2)
  fogo.add(chamaA)
  for (const [t, r] of [[0.28, 0.1], [0.5, 0.075], [0.7, 0.05], [0.86, 0.035]] as const) {
    const lingua = sphere(r, t < 0.5 ? FOGO : BRASA, { emissive: t < 0.5 ? FOGO : BRASA, emissiveIntensity: 1.3 })
    lingua.position.copy(tras).multiplyScalar(t)
    lingua.position.y += (t - 0.4) * 0.05
    fogo.add(lingua)
  }
  for (const [fx, fy, fz] of [[0.2, 0.12, 0.05], [0.16, -0.14, -0.04], [-0.02, 0.2, 0.06]] as const) {
    const faisca = sphere(0.022, BRASA, { emissive: BRASA, emissiveIntensity: 2 })
    faisca.position.set(fx, fy, fz)
    fogo.add(faisca)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'mercado', object: base },
    { name: 'arco', group: 'mercado', object: arco },
    { name: 'placa', group: 'rabat', object: placa },
    { name: 'balcao', group: 'banca', object: balcao },
    { name: 'especiarias', group: 'banca', object: especiarias },
    { name: 'plaquinha', group: 'banca', object: plaquinha },
    { name: 'fenix', group: 'fenix', object: fenix },
    { name: 'cabeca', group: 'fenix', object: cabeca },
    { name: 'fez', group: 'fenix', object: fez },
    { name: 'cauda', group: 'fenix', object: cauda },
    { name: 'cana', group: 'cana', object: cana },
    { name: 'fogo', group: 'fo', object: fogo },
    { name: 'queimado', group: 'fo', object: queimado },
  ]

  // ---- montagem ------------------------------------------------------------
  const S = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'No Marrocos, brota o chão de mosaico azul e branco de um mercado…',
    }),
    seq('arco-rise', 'arco', 0.35, 1.0, [riseFrom(0, 3.4)], { ease: 'easeOut' }),

    seq('placa-cai', 'placa', 1.7, 0.8, [ch('position.y', PLACA_Y + 1.2, PLACA_Y), ...S(0.2, 1)], {
      ease: 'easeOut',
      caption: '…e no alto do arco, a placa: RABAT — quase "rabatt", que em sueco é DESCONTO.',
    }),
    seq('placa-balanca', 'placa', 2.5, 0.35, [ch('rotation.z', 0, 0.06)]),
    seq('placa-assenta', 'placa', 2.85, 0.4, [ch('rotation.z', 0.06, 0)]),

    seq('balcao-rise', 'balcao', 3.3, 0.8, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'Uma banca de especiarias. Na plaquinha do cone laranja, um preço ABSURDO.',
    }),
    seq('especiarias-rise', 'especiarias', 3.55, 0.7, [riseFrom(0, 0.6)], { ease: 'easeOut' }),
    seq('plaquinha-espeta', 'plaquinha', 4.0, 0.6, [ch('position.y', TAG[1] + 0.8, TAG[1])], { ease: 'easeIn' }),

    seq('fenix-pousa', 'fenix', 5.2, 1.0, [
      ch('position.y', PHX[1] + 2.2, PHX[1]), ch('position.x', PHX[0] - 1.2, PHX[0]),
      ch('rotation.z', 0.5, 0),
    ], {
      ease: 'easeOut',
      caption: 'Pousa no balcão uma FÊNIX de chapéu fez: veio comprar o tempero do ninho novo.',
    }),
    seq('cabeca-sobe', 'cabeca', 5.5, 0.7, [...S(0.3, 1)], { ease: 'easeOut' }),
    seq('cauda-desce', 'cauda', 5.7, 0.9, [ch('rotation.x', 1.3, 0)], { ease: 'easeOut' }),
    seq('fez-cai', 'fez', 6.1, 0.5, [ch('position.y', 0.75, 0.19), ch('rotation.z', 0.6, -0.16)], { ease: 'easeIn' }),

    seq('cana-surge', 'cana', 7.2, 0.4, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Ela ergue uma CANA-de-açúcar e bate no balcão: IÁ! — CA-NIÁ!',
    }),
    seq('cana-ergue', 'cana', 7.6, 0.4, [ch('position.y', 0, 0.3)], { ease: 'easeOut' }),
    seq('cana-bate', 'cana', 8.0, 0.18, [ch('position.y', 0.3, 0)], { ease: 'easeIn' }),
    seq('especiarias-pulam', 'especiarias', 8.18, 0.15, [ch('position.y', 0, 0.06)], { ease: 'easeOut' }),
    seq('especiarias-assentam', 'especiarias', 8.33, 0.2, [ch('position.y', 0.06, 0)], { ease: 'easeIn' }),

    seq('cabeca-estufa', 'cabeca', 9.0, 0.35, [ch('scale.x', 1, 1.15)], {
      ease: 'easeOut',
      caption: 'Estufa as bochechas e sopra FÔ: uma bola de fogo voa direto na plaquinha…',
    }),
    seq('cabeca-sopra', 'cabeca', 9.35, 0.3, [ch('scale.x', 1.15, 1)], { ease: 'easeIn' }),
    seq('fogo-sai', 'fogo', 9.4, 0.6, [
      ch('position.x', bicoW.x, FOGO_POS[0]), ch('position.y', bicoW.y, FOGO_POS[1]),
      ch('position.z', bicoW.z, FOGO_POS[2]), ...S(0.15, 1),
    ], { ease: 'easeOut' }),
    seq('queimado-cresce', 'queimado', 10.0, 0.7, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…e queima o preço pela METADE. Ela pisca: CA-NIÁ, FÔ… RA-BÁT?',
    }),

    seq('fez-pisca', 'fez', 11.6, 0.5, [ch('rotation.z', -0.36, -0.16)], {
      ease: 'easeOut',
      caption: 'Kan jag få rabatt? — Pode me dar um desconto?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.6, 5.6], target: [0.1, 1.72, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-fa-rabatt',
    contexto:
      "Compras: no loppis, na feira, no Blocket, na loja de móveis ou de eletrônicos quando a peça tem defeito ('Den har en repa' — tem um arranhão), ou levando várias coisas de uma vez. Nas grandes redes o preço é fixo, mas sempre dá pra perguntar por 'studentrabatt', 'medlemsrabatt' (do clube de fidelidade) ou 'pensionärsrabatt'.",
    fraseFonte:
      "Pode me dar um desconto?",
    fraseAlvo:
      "Kan jag få rabatt?",
    pronuncia:
      "ka-niá fô ra-BÁT? ('kan jag' = ka-niá, o G mudo; 'få' = FÔ, Ô fechado e longo de 'avô', nunca 'fó'; 'rabatt' com o R de um toque, de 'caro' — nunca o RR de garganta de 'rato', que em sueco é H —, o RA fraquinho e a força toda no BÁT: A curto e aberto de 'pá', T seco e segurado um instante, porque é 'tt')",
    ponteSonora:
      "CA-NIÁ, FÔ... RA-BÁT? (5 sílabas: ca-niá-fô-ra-BÁT; a força vai TODA pro BÁT; CA-NIÁ = a CANA + IÁ de 'Kan jag få en påse?', 'Kan jag få menyn?' e 'Kan jag betala med kort?' — emendado, I de IOGA, nunca o J chiado de 'canja'; FÔ = o sopro de BOCHECHAS ESTUFADAS de 'Kan jag få menyn?' e 'Kan jag få lite vatten?' — aqui um sopro de FOGO: Ô FECHADO e longo de 'avô', nunca 'fó'; e nunca o FÖ de bico de 'för' — bochecha redonda é 'få', bico é 'för'; RA-BÁT = RABAT, a capital do Marrocos, escrita no arco do mercado: o R é de UM TOQUE, de 'caro' — emende no FÔ, fô-ra-BÁT, como se o R estivesse no meio de uma palavra; o RR de garganta de 'rato' vira H em sueco ('habatt'); RA fraquinho, A curto; BÁT com toda a força, A CURTO e aberto de 'pá', e o T seco, segurado um instante (é 'tt'), nunca 'Rabátchi'; e Rabat, de quebra, é quase a própria palavra: 'rabatt' é desconto em sueco)",
    historia:
      "A cada quinhentos anos a fênix queima e renasce num ninho de especiarias — e desta vez ela pousa no mercado de RABAT, no Marrocos, pra comprar o tempero do ninho novo. O preço na plaquinha da banca é um absurdo. Ela bate a CANA no balcão, solta o grito — IÁ! —, estufa as bochechas e sopra FÔ: uma bola de fogo que queima a plaquinha de preço pela METADE. E pergunta ao mercador, piscando: CA-NIÁ, FÔ... RA-BÁT? — posso ganhar um desconto?",
  },
  createScene,
  refine: { organic: ['fenix', 'cabeca', 'cauda'] },
}

export default card
