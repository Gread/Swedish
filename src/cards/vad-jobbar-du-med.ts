import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vad jobbar du med?" — VÁ! IÓ-BAR-DÜ... MÊ?
 *
 * No after-work da firma, o camaleão morre de MEDO da pergunta nº 1 do small
 * talk sueco. Pula no balcão do BAR, estende um tapetinho de IOGA e congela
 * numa pata só (postura da árvore). Você grita VÁ! e a língua dele gruda na
 * SUA testa — DÜ! — e de MEDO (MÊ) o corpo pisca listrado com as cores de
 * todos os uniformes que ele já vestiu.
 *
 * Diorama: piso de taco escuro, balcão vinho de tampo preto, néon laranja BAR
 * na ponta (o acento saturado), drinks de canudinho verde, tapetinho roxo.
 */

const TACO = '#4a3122'
const TACO_B = '#563a28'
const TACO_FRESTA = '#2c1d14'
const VINHO = '#6b2333'
const VINHO_ESC = '#4f1925'
const PRETO = '#1f1c1f'
const LATAO = '#c9a250'
const ROXO = '#7a55b4'
const ROXO_ESC = '#5d3f91'
const VERDE = '#6aa357'
const VERDE_ESC = '#4f8541'
const VERDE_CLARO = '#a9cf7e'
const LARANJA = '#d9773f'
const AZUL = '#4a78b8'
const AMARELO = '#e2bd45'
const LINGUA = '#e67d93'
const LINGUA_ESC = '#c95e78'
const SUOR = '#a6dcf2'
const NEON = '#ff8a1f' // acento reservado: o néon BAR (IÓ-BAR)

const GY = 0.18 // topo do piso
const TOP = 0.8 // tampo do balcão
const BZ = 0.1 // centro do balcão em z
const MY = TOP + 0.03 // topo do tapetinho de ioga
const CX = -0.15 // camaleão no balcão
const CZ = 0.1

const OLHO_FINAL = 0.62

/** Traço de néon: caixinha arredondada emissiva em pé no plano xy. */
function tubo(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.035, 0.012, NEON, { emissive: NEON, emissiveIntensity: 1.6, roughness: 0.3 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** B A R — letras de traço grosso, ~0.2 de altura. */
function letra(which: 'B' | 'A' | 'R') {
  const g = new THREE.Group()
  const t = 0.034
  const H = 0.2
  if (which === 'B') {
    g.add(tubo(t, H, -0.05, 0))
    g.add(tubo(0.085, t, -0.012, 0.083))
    g.add(tubo(0.085, t, -0.012, 0))
    g.add(tubo(0.085, t, -0.012, -0.083))
    g.add(tubo(t, 0.075, 0.038, 0.044))
    g.add(tubo(t, 0.075, 0.038, -0.044))
  } else if (which === 'A') {
    g.add(tubo(t, 0.21, -0.033, 0, -0.3))
    g.add(tubo(t, 0.21, 0.033, 0, 0.3))
    g.add(tubo(0.075, 0.028, 0, -0.03))
  } else {
    g.add(tubo(t, H, -0.05, 0))
    g.add(tubo(0.085, t, -0.012, 0.083))
    g.add(tubo(0.085, t, -0.012, 0.008))
    g.add(tubo(t, 0.075, 0.038, 0.046))
    g.add(tubo(t, 0.11, 0.032, -0.056, 0.5))
  }
  return g
}

function vidro() {
  return new THREE.MeshStandardMaterial({
    color: '#d8eef4',
    roughness: 0.06,
    metalness: 0.1,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  })
}

/** Copo de drink: vidro + bebida + gelo + canudinho verde + rodela de limão. */
function drink(cor: string, alto: boolean) {
  const g = new THREE.Group()
  const h = alto ? 0.3 : 0.22
  const r = alto ? 0.075 : 0.095
  const copo = new THREE.Mesh(
    new THREE.LatheGeometry(
      [[0, 0], [r * 0.92, 0], [r, 0.02], [r * 1.05, h], [r * 0.98, h], [r * 0.93, 0.025], [0, 0.025]]
        .map(([x, y]) => new THREE.Vector2(x, y)),
      32,
    ),
    vidro(),
  )
  g.add(copo)
  const bebida = cylinder(r * 0.92, r * 0.86, h * 0.68, cor, { roughness: 0.2 })
  bebida.position.y = 0.025 + h * 0.34
  g.add(bebida)
  for (const [ix, iz] of [[0.02, 0.01], [-0.025, -0.015]] as const) {
    const gelo = rbox(0.045, 0.045, 0.045, 0.01, '#eef8fb', { roughness: 0.15 })
    gelo.position.set(ix, h * 0.66, iz)
    gelo.rotation.set(0.4, ix * 20, 0.3)
    g.add(gelo)
  }
  const canudo = cylinder(0.012, 0.012, h + 0.2, '#58b046', { roughness: 0.35 })
  canudo.position.set(0.02, h * 0.55 + 0.08, 0)
  canudo.rotation.z = -0.28
  g.add(canudo)
  const limao = cylinder(0.05, 0.05, 0.018, '#c7d94a', { roughness: 0.5 })
  limao.rotation.x = Math.PI / 2
  limao.position.set(-r * 0.9, h - 0.01, 0)
  limao.rotation.y = Math.PI / 2
  g.add(limao)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(77)

  // ---- base: piso de taco marrom-escuro (cesteiro) --------------------------
  const base = new THREE.Group()
  const solo = cylinder(2.62, 2.72, 0.12, '#2a1c13', { roughness: 0.95 })
  solo.position.y = 0.06
  base.add(solo)
  const assoalho = cylinder(2.55, 2.6, 0.05, TACO_FRESTA, { roughness: 0.9 })
  assoalho.position.y = 0.145
  base.add(assoalho)

  const Q = 0.54
  for (let i = -5; i <= 5; i++) {
    for (let j = -5; j <= 5; j++) {
      const qx = i * Q
      const qz = j * Q
      if (Math.hypot(qx, qz) > 2.55 - Q * 0.75) continue
      const vira = (i + j) % 2 === 0
      for (let k = -1; k <= 1; k++) {
        const w = vira ? Q - 0.02 : Q / 3 - 0.02
        const d = vira ? Q / 3 - 0.02 : Q - 0.02
        const cor = (i * 7 + j * 3 + k + 30) % 3 === 0 ? TACO_B : TACO
        const taco = rbox(w, 0.03, d, 0.01, cor, { roughness: 0.6 })
        taco.position.set(qx + (vira ? 0 : k * Q / 3), GY - 0.015, qz + (vira ? k * Q / 3 : 0))
        base.add(taco)
      }
    }
  }

  // banqueta de bar na frente, à direita
  const banqueta = new THREE.Group()
  banqueta.position.set(1.85, GY, 0.95)
  const assento = lathe([[0, 0], [0.2, 0], [0.22, 0.04], [0.2, 0.09], [0, 0.1]], PRETO, { roughness: 0.45 })
  assento.position.y = 0.6
  banqueta.add(assento)
  const haste = cylinder(0.03, 0.03, 0.6, LATAO, { roughness: 0.3, metalness: 0.8 })
  haste.position.y = 0.3
  banqueta.add(haste)
  const pe = cylinder(0.16, 0.18, 0.03, LATAO, { roughness: 0.3, metalness: 0.8 })
  pe.position.y = 0.015
  banqueta.add(pe)
  const aroPe = torus(0.15, 0.015, LATAO, { roughness: 0.3, metalness: 0.8 })
  aroPe.rotation.x = Math.PI / 2
  aroPe.position.y = 0.26
  banqueta.add(aroPe)
  base.add(banqueta)

  // vaso com planta na esquerda de trás
  const vaso = lathe([[0, 0], [0.15, 0], [0.18, 0.28], [0.19, 0.3], [0, 0.29]], '#c8b8a2', { roughness: 0.6 })
  vaso.position.set(-2.0, GY, -0.95)
  base.add(vaso)
  const planta = puff(0.24, '#4f7d46', 6, 12, { roughness: 0.9 })
  planta.position.set(-2.0, GY + 0.5, -0.95)
  base.add(planta)

  root.add(base)

  // ---- balcão de bar: madeira vinho, tampo preto ----------------------------
  const balcao = new THREE.Group()
  const LEN = 3.2
  const tampo = rbox(LEN, 0.08, 0.84, 0.03, PRETO, { roughness: 0.25 })
  tampo.position.set(0, TOP - 0.04, BZ)
  balcao.add(tampo)

  const PH = TOP - 0.08 - GY
  const frente = rbox(LEN - 0.12, PH, 0.6, 0.03, VINHO, { roughness: 0.6 })
  frente.position.set(0, GY + PH / 2, BZ - 0.02)
  balcao.add(frente)
  // almofadas (painéis) na frente do balcão
  for (let i = 0; i < 5; i++) {
    const px = -1.2 + i * 0.6
    const painel = rbox(0.48, PH - 0.2, 0.03, 0.02, VINHO_ESC, { roughness: 0.65 })
    painel.position.set(px, GY + PH / 2 + 0.01, BZ + 0.29)
    balcao.add(painel)
    const moldura = rbox(0.4, PH - 0.3, 0.02, 0.015, VINHO, { roughness: 0.6 })
    moldura.position.set(px, GY + PH / 2 + 0.01, BZ + 0.305)
    balcao.add(moldura)
  }
  const rodape = rbox(LEN - 0.08, 0.07, 0.64, 0.02, PRETO, { roughness: 0.5 })
  rodape.position.set(0, GY + 0.035, BZ - 0.02)
  balcao.add(rodape)
  const friso = rbox(LEN - 0.04, 0.04, 0.66, 0.015, VINHO_ESC, { roughness: 0.6 })
  friso.position.set(0, TOP - 0.1, BZ - 0.02)
  balcao.add(friso)
  // trilho de latão para o pé
  const trilho = cylinder(0.024, 0.024, LEN - 0.3, LATAO, { roughness: 0.3, metalness: 0.8 })
  trilho.rotation.z = Math.PI / 2
  trilho.position.set(0, GY + 0.14, BZ + 0.44)
  balcao.add(trilho)
  for (const rx of [-1.3, 0, 1.3]) {
    const suporte = cylinder(0.016, 0.016, 0.14, LATAO, { roughness: 0.3, metalness: 0.8 })
    suporte.rotation.x = Math.PI / 2
    suporte.position.set(rx, GY + 0.14, BZ + 0.37)
    balcao.add(suporte)
  }
  // porta-guardanapo e garrafa no fundo
  const garrafa = lathe(
    [[0, 0], [0.07, 0], [0.075, 0.05], [0.072, 0.2], [0.03, 0.26], [0.028, 0.35], [0.034, 0.37], [0, 0.37]],
    '#2f5c3a',
    { roughness: 0.15 },
  )
  garrafa.position.set(-1.35, TOP, BZ - 0.25)
  balcao.add(garrafa)
  const guardanapos = rbox(0.16, 0.1, 0.1, 0.02, '#e9e1d2', { roughness: 0.85 })
  guardanapos.position.set(0.55, TOP + 0.05, BZ - 0.28)
  guardanapos.rotation.y = 0.2
  balcao.add(guardanapos)
  root.add(balcao)

  // ---- plaquinha néon BAR na ponta do balcão --------------------------------
  const placa = new THREE.Group()
  placa.position.set(1.18, TOP, BZ - 0.08)
  placa.rotation.y = -0.18
  const fundo = rbox(0.66, 0.34, 0.05, 0.04, '#26222a', { roughness: 0.5 })
  fundo.position.y = 0.25
  placa.add(fundo)
  const borda = rbox(0.62, 0.3, 0.02, 0.035, '#3a3440', { roughness: 0.5 })
  borda.position.set(0, 0.25, 0.022)
  placa.add(borda)
  for (const [glyph, lx] of [['B', -0.19], ['A', 0.0], ['R', 0.19]] as const) {
    const l = letra(glyph)
    l.position.set(lx, 0.25, 0.05)
    placa.add(l)
  }
  for (const side of [-1, 1]) {
    const pezinho = rbox(0.06, 0.08, 0.14, 0.015, '#26222a', { roughness: 0.5 })
    pezinho.position.set(side * 0.24, 0.04, 0)
    placa.add(pezinho)
  }
  root.add(placa)

  // ---- dois drinks ----------------------------------------------------------
  const copos = new THREE.Group()
  const d1 = drink('#f0a24a', true)
  d1.position.set(-1.0, TOP, BZ + 0.12)
  copos.add(d1)
  const d2 = drink('#e5607a', false)
  d2.position.set(0.68, TOP, BZ + 0.2)
  d2.rotation.y = 0.8
  copos.add(d2)
  root.add(copos)

  // ---- tapetinho de ioga roxo ----------------------------------------------
  const tapete = new THREE.Group()
  tapete.position.set(CX - 0.42, TOP, CZ)
  const esteira = rbox(0.86, 0.025, 0.56, 0.012, ROXO, { roughness: 0.85 })
  esteira.position.set(0.47, 0.0125, 0)
  tapete.add(esteira)
  const rolo = cylinder(0.05, 0.05, 0.56, ROXO_ESC, { roughness: 0.85 })
  rolo.rotation.x = Math.PI / 2
  rolo.position.set(0.0, 0.05, 0)
  tapete.add(rolo)
  const espiralRolo = torus(0.032, 0.008, ROXO, { roughness: 0.85 })
  espiralRolo.position.set(0.0, 0.05, 0.281)
  tapete.add(espiralRolo)
  root.add(tapete)

  // ---- CAMALEÃO de pé numa pata só (postura da árvore) ----------------------
  const camaleao = new THREE.Group()
  camaleao.position.set(CX, MY, CZ)
  root.add(camaleao)
  const pele = (r: number, color = VERDE) => sphere(r, color, { roughness: 0.7 })
  const membro = (r: number, len: number, a: THREE.Vector3, b: THREE.Vector3, color = VERDE) => {
    const m = capsule(r, len, color, { roughness: 0.7 })
    const mid = a.clone().add(b).multiplyScalar(0.5)
    m.position.copy(mid)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    m.scale.y = a.distanceTo(b) / (len + r * 2) * 1.05
    return m
  }
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

  // perna de apoio (direita, +x)
  const quadrilD = V(0.1, 0.56, 0)
  const joelhoD = V(0.12, 0.3, 0.04)
  const tornD = V(0.1, 0.07, 0.02)
  camaleao.add(membro(0.085, 0.16, quadrilD, joelhoD))
  camaleao.add(membro(0.07, 0.14, joelhoD, tornD))
  // pé de pinça: dois feixes de dedos
  for (const s of [-1, 1]) {
    const dedos = capsule(0.045, 0.08, VERDE_ESC, { roughness: 0.7 })
    dedos.rotation.set(Math.PI / 2 - 0.15, 0, s * 0.55)
    dedos.position.set(0.1 + s * 0.05, 0.035, 0.08)
    camaleao.add(dedos)
  }
  // perna dobrada (esquerda, -x): joelho para fora, pé na coxa de apoio
  const quadrilE = V(-0.1, 0.56, 0)
  const joelhoE = V(-0.38, 0.4, 0.06)
  const peE = V(0.02, 0.33, 0.08)
  camaleao.add(membro(0.082, 0.18, quadrilE, joelhoE))
  camaleao.add(membro(0.068, 0.24, joelhoE, peE))
  const peDobrado = pele(0.065, VERDE_ESC)
  peDobrado.scale.set(1.2, 0.8, 1)
  peDobrado.position.copy(peE)
  camaleao.add(peDobrado)

  // quadril + tronco (achatado dos lados, como camaleão)
  const quadril = pele(0.21)
  quadril.scale.set(1.0, 0.8, 0.9)
  quadril.position.set(0, 0.6, 0)
  camaleao.add(quadril)
  const tronco = capsule(0.24, 0.42, VERDE, { roughness: 0.7 })
  tronco.scale.set(0.92, 1, 1)
  tronco.position.set(0, 0.92, 0)
  camaleao.add(tronco)
  const barriga = pele(0.2, VERDE_CLARO)
  barriga.scale.set(0.8, 1.5, 0.6)
  barriga.position.set(0, 0.88, 0.12)
  camaleao.add(barriga)
  const pescoco = pele(0.17)
  pescoco.position.set(0, 1.3, 0.02)
  camaleao.add(pescoco)

  // braços: mãos postas em prece na frente do peito
  for (const s of [-1, 1]) {
    const ombro = V(s * 0.21, 1.2, 0.02)
    const cotovelo = V(s * 0.3, 0.95, 0.16)
    const mao = V(s * 0.04, 1.08, 0.3)
    camaleao.add(membro(0.065, 0.16, ombro, cotovelo))
    camaleao.add(membro(0.058, 0.18, cotovelo, mao))
    const palma = capsule(0.045, 0.08, VERDE_ESC, { roughness: 0.7 })
    palma.position.set(s * 0.035, 1.15, 0.31)
    palma.rotation.z = s * 0.1
    camaleao.add(palma)
  }

  // crista dorsal: serrinha de cones nas costas
  for (let i = 0; i < 7; i++) {
    const y = 0.6 + i * 0.12
    const espinho = cone(0.03, 0.07, VERDE_ESC, { roughness: 0.7 })
    espinho.position.set(0, y, -0.22 - Math.sin((i / 6) * Math.PI) * 0.03)
    espinho.rotation.x = -Math.PI / 2 + 0.3
    camaleao.add(espinho)
  }

  // ---- listras de uniforme (peça: brotam da pele de MEDO) -------------------
  const listras = new THREE.Group()
  listras.position.set(0, 0, 0)
  camaleao.add(listras)
  // faixas torneadas que abraçam a pele do tronco (cápsula r 0.24, cilindro
  // de y 0.71 a 1.13) — leem como pintura, não como argolas empilhadas
  const raioTronco = (y: number) => {
    const dy = y < 0.71 ? 0.71 - y : y > 1.13 ? y - 1.13 : 0
    return Math.sqrt(Math.max(0.24 * 0.24 - dy * dy, 0.01))
  }
  const faixas: [number, string][] = [
    [0.66, AZUL], [0.8, LARANJA], [0.94, AMARELO], [1.08, AZUL], [1.22, LARANJA],
  ]
  for (const [y, cor] of faixas) {
    const prof: [number, number][] = []
    const y0 = y - 0.045
    const y1 = y + 0.045
    for (let k = 0; k <= 8; k++) {
      const yy = y0 + ((y1 - y0) * k) / 8
      const borda = Math.sin((k / 8) * Math.PI) // relevo arredondado nas bordas
      prof.push([raioTronco(yy) + 0.004 + 0.012 * Math.min(1, borda * 2), yy])
    }
    const faixa = lathe(prof, cor, { roughness: 0.6 })
    faixa.scale.set(0.92, 1, 1)
    listras.add(faixa)
  }

  // ---- cauda enrolada em espiral (atrás, à direita) -------------------------
  const cauda = new THREE.Group()
  cauda.position.set(0.12, 0.55, -0.14)
  camaleao.add(cauda)
  {
    const C = V(0.36, -0.22, -0.04)
    const N = 46
    let prev = V(0, 0, 0)
    for (let i = 0; i <= N; i++) {
      const t = i / N
      let p: THREE.Vector3
      let r: number
      if (t < 0.12) {
        // raiz: sai do quadril até a borda da espiral
        const k = t / 0.12
        const alvo = V(C.x + Math.cos(2.4) * 0.24, C.y + Math.sin(2.4) * 0.24, C.z)
        p = V(0, 0, 0).lerp(alvo, k)
        r = 0.085 - k * 0.012
      } else {
        const k = (t - 0.12) / 0.88
        const a = 2.4 - k * Math.PI * 2.0
        const rad = 0.24 * (1 - k * 0.72)
        p = V(C.x + Math.cos(a) * rad, C.y + Math.sin(a) * rad, C.z)
        r = 0.073 - k * 0.045
      }
      if (i > 0 && p.distanceTo(prev) < 0.012) continue
      const gomo = sphere(r, VERDE, { roughness: 0.7 }, 20)
      gomo.position.copy(p)
      cauda.add(gomo)
      prev = p
    }
  }

  // ---- cabeça: capacete, focinho, olho de torre -----------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.45, 0.04)
  cabeca.rotation.y = -0.5
  camaleao.add(cabeca)

  const cranio = pele(0.19)
  cranio.scale.set(0.85, 0.9, 1.05)
  cranio.position.set(0, 0.05, 0)
  cabeca.add(cranio)
  const focinho = pele(0.14)
  focinho.scale.set(0.82, 0.72, 1.35)
  focinho.position.set(0, 0.0, 0.2)
  cabeca.add(focinho)
  const queixo = pele(0.13, VERDE_CLARO)
  queixo.scale.set(0.85, 0.6, 1.3)
  queixo.position.set(0, -0.08, 0.12)
  cabeca.add(queixo)
  // capacete (casque) inclinado para trás
  const capacete = pele(0.2)
  capacete.scale.set(0.42, 1.0, 0.78)
  capacete.position.set(0, 0.2, -0.1)
  capacete.rotation.x = -0.6
  cabeca.add(capacete)
  const cristaCap = capsule(0.03, 0.24, VERDE_ESC, { roughness: 0.7 })
  cristaCap.position.set(0, 0.26, -0.16)
  cristaCap.rotation.x = -0.55
  cabeca.add(cristaCap)
  // boca aberta (a língua sai daqui)
  const boca = pele(0.06, '#8a3346')
  boca.scale.set(1.2, 0.6, 0.6)
  boca.position.set(0, -0.045, 0.37)
  cabeca.add(boca)
  // olho esquerdo (do lado de lá), torre com pupila para a frente
  const torreE = pele(0.085)
  torreE.position.set(-0.15, 0.08, 0.12)
  cabeca.add(torreE)
  const pupE = sphere(0.025, '#151515', { roughness: 0.2 })
  pupE.position.set(-0.19, 0.09, 0.19)
  cabeca.add(pupE)

  // ---- olho direito (peça): gira na torre até mirar VOCÊ ---------------------
  const olho = new THREE.Group()
  olho.position.set(0.15, 0.08, 0.12)
  olho.rotation.set(-0.12, OLHO_FINAL, 0)
  cabeca.add(olho)
  const torreD = sphere(0.09, VERDE, { roughness: 0.7 })
  olho.add(torreD)
  const iris = sphere(0.04, AMARELO, { roughness: 0.3 })
  iris.scale.z = 0.5
  iris.position.z = 0.082
  olho.add(iris)
  const pupila = sphere(0.024, '#121212', { roughness: 0.15 })
  pupila.position.z = 0.1
  olho.add(pupila)
  const brilho = sphere(0.008, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.8 })
  brilho.position.set(0.01, 0.012, 0.118)
  olho.add(brilho)
  for (let i = 0; i < 3; i++) {
    const anel = torus(0.07 - i * 0.012, 0.007, VERDE_ESC, { roughness: 0.7 })
    anel.position.z = 0.035 + i * 0.018
    olho.add(anel)
  }

  // ---- língua: dispara da boca até a SUA testa ------------------------------
  const lingua = new THREE.Group()
  lingua.position.set(0, -0.045, 0.38)
  lingua.rotation.x = 0.08
  cabeca.add(lingua)
  const L = 1.75
  const hasteLingua = cylinder(0.032, 0.04, L, LINGUA, { roughness: 0.35 })
  hasteLingua.rotation.x = Math.PI / 2
  hasteLingua.position.z = L / 2
  lingua.add(hasteLingua)
  const bolota = sphere(0.1, LINGUA_ESC, { roughness: 0.3 })
  bolota.scale.set(1, 1, 0.8)
  bolota.position.z = L + 0.06
  lingua.add(bolota)

  // ---- gotas de suor saltando da testa --------------------------------------
  const suor = new THREE.Group()
  cabeca.add(suor)
  for (const [gx, gy, gz, rz] of [
    [0.24, 0.3, 0.02, -0.6], [0.06, 0.48, -0.05, -0.1], [-0.2, 0.36, 0.0, 0.5],
  ] as const) {
    const gota = new THREE.Group()
    gota.position.set(gx, gy, gz)
    gota.rotation.set(rand() * 0.2, 0.5, rz)
    const bojo = sphere(0.05, SUOR, { roughness: 0.08 })
    gota.add(bojo)
    const ponta = cone(0.046, 0.09, SUOR, { roughness: 0.08 })
    ponta.position.y = 0.055
    gota.add(ponta)
    suor.add(gota)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'bar', object: base },
    { name: 'balcao', group: 'bar', object: balcao },
    { name: 'placa', group: 'neon', object: placa },
    { name: 'copos', group: 'neon', object: copos },
    { name: 'tapete', group: 'ioga', object: tapete },
    { name: 'camaleao', group: 'ioga', object: camaleao },
    { name: 'cabeca', group: 'ioga', object: cabeca },
    { name: 'cauda', group: 'ioga', object: cauda },
    { name: 'olho', group: 'va', object: olho },
    { name: 'lingua', group: 'du', object: lingua },
    { name: 'listras', group: 'me', object: listras },
    { name: 'suor', group: 'me', object: suor },
  ]

  const S3 = (from: number, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'After-work da firma: piso de taco e um balcão de BAR comprido, vinho e preto.',
    }),
    seq('balcao-rise', 'balcao', 0.25, 0.9, [riseFrom(0, 1.4)], { ease: 'easeOut' }),

    seq('placa-acende', 'placa', 1.6, 0.6, [...S3(0.01), ch('rotation.y', 0.6, -0.18)], {
      ease: 'easeOut',
      caption: 'O néon da ponta acende: BAR. Drinks de canudinho — e a pergunta nº 1: com o que você trabalha?',
    }),
    seq('copos-rise', 'copos', 1.85, 0.6, [riseFrom(0, 0.5)], { ease: 'easeOut' }),

    seq('tapete-estende', 'tapete', 3.4, 0.6, [ch('scale.x', 0.06, 1)], {
      ease: 'easeOut',
      caption: 'O camaleão já trabalhou com TUDO e morre de MEDO dela: estende um tapetinho de IOGA no BAR…',
    }),
    seq('camaleao-pula', 'camaleao', 4.0, 0.75, [
      ch('position.y', MY + 1.4, MY), ch('position.x', CX + 1.2, CX), ...S3(0.4),
    ], { ease: 'easeOut' }),
    seq('cabeca-firma', 'cabeca', 4.0, 0.75, [ch('rotation.y', 0.4, -0.5)], { ease: 'easeOut' }),
    seq('cauda-enrola', 'cauda', 4.5, 0.7, [...S3(0.05), ch('rotation.z', 1.2, 0)], {
      ease: 'easeOut',
      caption: '…e congela numa pata só, na postura da árvore, com a cauda em espiral: IÓ-BAR!',
    }),

    seq('olho-mira', 'olho', 6.3, 0.5, [ch('rotation.y', -0.6, OLHO_FINAL)], {
      ease: 'easeInOut',
      caption: 'Você aponta e berra VÁ! — e o olho de torre gira até mirar você.',
    }),
    seq('lingua-dispara', 'lingua', 7.3, 0.35, [ch('scale.z', 0.02, 1)], {
      ease: 'easeOut',
      caption: 'A língua dispara e gruda na SUA testa: DÜ! — e você, trabalha com o quê?',
    }),

    seq('listras-pisca', 'listras', 8.9, 0.6, [ch('scale.x', 0.8, 1), ch('scale.z', 0.8, 1)], {
      ease: 'easeOut',
      caption: 'De MEDO — MÊ! — o corpo pisca listrado com as cores de todos os uniformes que ele já vestiu.',
    }),
    seq('suor-salta', 'suor', 9.1, 0.5, [...S3(0.01), ch('position.y', -0.15, 0)], { ease: 'easeOut' }),

    seq('suor-pinga', 'suor', 10.6, 0.5, [ch('position.y', 0.06, 0)], {
      ease: 'easeIn',
      caption: 'Vad jobbar du med? — Com o que você trabalha?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.7, 4.6], target: [-0.15, 1.5, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-jobbar-du-med',
    contexto:
      "Small talk: a pergunta nº 1 de qualquer mingel, after-work, festa de vizinho ou porta da förskola, logo depois do nome. A resposta é 'Jag jobbar med ...' ou 'Jag jobbar som ...'.",
    fraseFonte: 'Com o que você trabalha?',
    fraseAlvo: 'Vad jobbar du med?',
    pronuncia:
      "va IÓB-bar dü MÊ? ('vad' = vá, o d mudo e SEM R; 'j' = i de ioga; 'jobbar' com Ó aberto e B dobrado; o R de 'jobbar' encosta no D de 'du' e os dois viram um D de língua enrolada; 'du' com bico; 'med' = mê, sem D, e leva força no fim da pergunta)",
    ponteSonora:
      "VÁ! IÓ-BAR-DÜ... MÊ? (5 sílabas: va-IÓB-bar-dü-MÊ; tônicas em IÓ e MÊ; VÁ é o MESMO 'vad' de 'VÁ, CÜL!', 'VÁ! É CLÓ-CAN' e 'Vad gör du i helgen?' — um grito SEM R e sem adereço; com R vira 'var' (onde), que nas cartas é sempre a VARA; IÓBAR é o MESMO 'jobbar' do castor de 'Jag jobbar hemifrån': o IÓ da IOGA (I de ioga + Ó ABERTO, nunca o J chiado de 'jóba') + o BAR inteiro, COM o R — é o BAR que garante o -R de 'jobbar'; sem ele sobra 'jobba', o infinitivo; esse R é BRANDO, à caipira, e encosta direto no D: IÓBAR-DÜ sai quase 'ióba-dü' de língua enrolada, exatamente como o sueco funde o 'rd'; DÜ com BICO DE PATO, o 'du' de CAN-DU; MÊ = MEDO sem o -DO, Ê FECHADO, o mesmo MÊ de 'Jag håller inte riktigt med' — e a pergunta TERMINA nele, com força: sem o MÊ ela fica pela metade)",
    historia:
      "No after-work da firma, todo sueco faz a mesma pergunta já na segunda frase — e o camaleão morre de MEDO dela, porque já trabalhou com tanta coisa que nem sabe responder. Pra sumir, ele pula no balcão do BAR, estende um tapetinho e congela numa postura de IOGA, numa pata só, tentando ficar da cor da madeira. Você aponta e berra VÁ!, e a língua dele dispara dois metros e gruda na SUA testa — DÜ! —, como quem devolve: e você? Mas de MEDO o corpo dele já pisca listrado com as cores de todos os uniformes que vestiu na vida: é a resposta inteira pra 'com o que você trabalha?'.",
  },
  createScene,
  refine: { organic: ['camaleao', 'cabeca', 'cauda'] },
}

export default card
