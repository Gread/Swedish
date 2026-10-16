import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Jag flyttar nästa månad." — o BISÃO que se muda pra outra margem olha a
 * balsinha carregada e duvida: IÁ... FLÜT(u)AR? NESTA?! Afunda no meio da
 * palavra (o U sobe numa bolha), desiste, amarra a corda no chifre e sai
 * nadando, rebocando a mudança e mugindo grave de boca redonda: MÔÔ... NAD!
 *
 * Diorama: rio azul largo sobre a base, margem de grama com dois pinheiros
 * ao fundo. O bisão nada para a esquerda com a corcova e a juba fora d'água e
 * a cara virada para a câmera; a corda sai do chifre direito até a balsa de
 * três troncos à direita, com caixas de papelão, abajur e a folhinha do
 * calendário (o acento vermelho: é o MÊS) com a página de cima virando.
 */

const RIO = '#3b88b8'
const RIO_FUNDO = '#2a5f86'
const ONDA = '#cbe8f6'
const GRAMA = '#6d9b4a'
const GRAMA_ESC = '#557d38'
const TERRA = '#6e4d33'
const PINHO = '#2f5a3c'
const PINHO_ESC = '#264a31'
const PEDRA = '#8a8f93'

const BISAO = '#5b3b26'
const JUBA = '#3a2517'
const FOCINHO = '#3f3029'
const NARIZ = '#1f1815'
const BOCA = '#3a1719'
const LINGUA = '#c96b72'
const CHIFRE = '#221d1a'

const TRONCO = '#8a5a35'
const TRONCO_PONTA = '#c99d6b'
const CORDA = '#d8bf8c'
const PAPELAO = '#c08f58'
const PAPELAO_ESC = '#a77a47'
const FITA = '#e9d7a6'
const CUPULA = '#ecc66a'
const ABAJUR_PE = '#5e4b3e'
const PAPEL = '#f6f2ea'
const GRADE = '#b9b4ab'
const VERMELHO = '#d8322a' // acento saturado RESERVADO: a folhinha do mês

const WY = 0.24 // superfície do rio
const BANK_Y = 0.44 // topo da margem de grama
const DY = 0.1 // convés da balsa (acima de WY, no espaço da balsa)

const BISAO_POS: [number, number] = [-0.45, 0.3]
const BISAO_YAW = -1.22 // nada para a esquerda, levemente para a câmera
const BALSA_POS: [number, number] = [1.5, 1.12]
const BALSA_YAW = 0.32

/** Margem de grama: segmento de disco ao fundo com a borda ondulada no rio. */
function bankGeometry() {
  const R = 2.6
  const edge = 1.22
  const a0 = Math.asin(edge / R)
  const shape = new THREE.Shape()
  shape.moveTo(Math.cos(a0) * R, edge)
  for (let i = 1; i <= 24; i++) {
    const a = a0 + ((Math.PI - 2 * a0) * i) / 24
    shape.lineTo(Math.cos(a) * R, Math.sin(a) * R)
  }
  // borda do rio, ondulada, da esquerda para a direita
  const xs = Math.cos(a0) * R
  for (let i = 1; i < 16; i++) {
    const x = -xs + (2 * xs * i) / 16
    shape.lineTo(x, edge + 0.1 * Math.sin(i * 1.3) + 0.06 * Math.sin(i * 2.9))
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: BANK_Y - 0.12,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 6,
  })
  geo.rotateX(-Math.PI / 2)
  return geo
}

/** Caixa de mudança: papelão de cantos gastos, fita no tampo e alças vazadas. */
function caixa(w: number, h: number, d: number) {
  const g = new THREE.Group()
  const corpo = rbox(w, h, d, 0.025, PAPELAO, { roughness: 0.85 })
  corpo.position.y = h / 2
  g.add(corpo)
  // aba do tampo: frestinha escura ao longo do meio
  const fresta = rbox(w * 0.98, 0.006, 0.012, 0.003, PAPELAO_ESC, { roughness: 0.9 })
  fresta.position.set(0, h + 0.002, 0)
  g.add(fresta)
  // fita adesiva: no tampo e descendo pela frente e por trás
  const fitaTopo = rbox(0.075, 0.01, d + 0.006, 0.004, FITA, { roughness: 0.4 })
  fitaTopo.position.set(0, h + 0.004, 0)
  g.add(fitaTopo)
  for (const s of [-1, 1]) {
    const fitaLado = rbox(0.075, h * 0.32, 0.01, 0.004, FITA, { roughness: 0.4 })
    fitaLado.position.set(0, h - h * 0.16, s * (d / 2 + 0.003))
    g.add(fitaLado)
    // alça vazada nas laterais
    const alca = rbox(0.012, 0.045, 0.13, 0.01, '#4a3524', { roughness: 0.9 })
    alca.position.set(s * (w / 2 + 0.002), h * 0.72, 0)
    g.add(alca)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- rio: leito escuro + lâmina d'água -----------------------------------
  const rio = new THREE.Group()
  const leito = cylinder(2.68, 2.74, 0.16, RIO_FUNDO, { roughness: 0.8 })
  leito.position.y = 0.08
  rio.add(leito)
  const agua = cylinder(2.64, 2.66, 0.1, RIO, { roughness: 0.3, detail: 0.4 })
  agua.position.y = WY - 0.05
  rio.add(agua)
  // correnteza: traços claros deitados na água, longe do bisão
  for (const [wx, wz, wl] of [
    [-1.9, 1.55, 0.45], [-0.9, 1.95, 0.55], [0.5, 1.85, 0.4], [2.0, 1.2, 0.35],
    [-2.2, 0.55, 0.3], [0.6, -0.95, 0.35],
  ] as const) {
    const risco = capsule(0.02, wl, ONDA, { roughness: 0.2 })
    risco.rotation.set(Math.PI / 2, 0, Math.PI / 2 + (rand() - 0.5) * 0.25)
    risco.scale.z = 0.35
    risco.position.set(wx, WY + 0.004, wz)
    rio.add(risco)
  }
  root.add(rio)

  // ---- margem de grama ao fundo -------------------------------------------
  const margem = new THREE.Group()
  const barranco = new THREE.Mesh(bankGeometry(), mat(TERRA, { roughness: 0.9, size: 4 }))
  barranco.castShadow = true
  barranco.receiveShadow = true
  barranco.position.y = 0.06
  margem.add(barranco)
  // tapete de grama por cima do barranco (mesmo contorno, mais fino)
  const relva = new THREE.Mesh(bankGeometry(), mat(GRAMA, { roughness: 0.92, size: 4 }))
  relva.scale.set(0.985, 0.12, 0.985)
  relva.position.set(0, BANK_Y - 0.01, -0.04)
  relva.receiveShadow = true
  margem.add(relva)
  // tufos, pedras e caniços na beira
  for (const [tx, tz, tr, s] of [[-2.15, -1.25, 0.16, 3], [-0.35, -1.55, 0.13, 5], [1.1, -1.45, 0.15, 9], [2.25, -0.95, 0.12, 13]] as const) {
    const tufo = puff(tr, GRAMA_ESC, 5, s, { roughness: 0.92 })
    tufo.scale.y = 0.6
    tufo.position.set(tx, BANK_Y + 0.05, tz)
    margem.add(tufo)
  }
  for (const [px, pz, pr, s] of [[-1.2, -1.32, 0.13, 4], [0.45, -1.28, 0.1, 8], [1.75, -1.08, 0.12, 15]] as const) {
    const pedra = rock(pr, PEDRA, s, { roughness: 0.8 })
    pedra.scale.y = 0.6
    pedra.position.set(px, WY + 0.04, pz)
    margem.add(pedra)
  }
  for (const [cx, cz] of [[-1.85, -1.18], [-1.75, -1.25], [-1.95, -1.3], [0.95, -1.32], [1.05, -1.38]] as const) {
    const h = 0.32 + rand() * 0.18
    const canico = cylinder(0.012, 0.016, h, GRAMA_ESC, { roughness: 0.8 })
    canico.position.set(cx, WY + h / 2, cz)
    canico.rotation.z = (rand() - 0.5) * 0.3
    margem.add(canico)
    const espiga = capsule(0.028, 0.08, '#6b4a2e', { roughness: 0.85 })
    espiga.position.set(cx + canico.rotation.z * -h * 0.5, WY + h + 0.02, cz)
    margem.add(espiga)
  }
  root.add(margem)

  // ---- dois pinheiros escuros ----------------------------------------------
  const pinheiros = new THREE.Group()
  for (const [px, pz, k] of [[-1.55, -1.9, 1.0], [1.95, -1.55, 0.82]] as const) {
    const pinho = new THREE.Group()
    pinho.position.set(px, BANK_Y, pz)
    pinho.scale.setScalar(k)
    const tronco = cylinder(0.06, 0.08, 0.3, '#4a3628', { roughness: 0.85 })
    tronco.position.y = 0.15
    pinho.add(tronco)
    for (const [ty, tr, th, cor] of [[0.5, 0.48, 0.62, PINHO_ESC], [0.86, 0.38, 0.55, PINHO], [1.17, 0.27, 0.48, PINHO]] as const) {
      const copa = cone(tr, th, cor, { roughness: 0.85 })
      copa.position.y = ty
      pinho.add(copa)
    }
    pinheiros.add(pinho)
  }
  root.add(pinheiros)

  // ---- balsinha de três troncos --------------------------------------------
  const balsa = new THREE.Group()
  balsa.position.set(BALSA_POS[0], WY, BALSA_POS[1])
  balsa.rotation.y = BALSA_YAW
  root.add(balsa)
  for (const z of [-0.27, 0, 0.27]) {
    const tora = cylinder(0.13, 0.13, 1.32 + (rand() - 0.5) * 0.08, TRONCO, { roughness: 0.85 })
    tora.rotation.z = Math.PI / 2
    tora.position.set((rand() - 0.5) * 0.06, -0.02, z)
    balsa.add(tora)
    for (const s of [-1, 1]) {
      const ponta = cylinder(0.11, 0.11, 0.012, TRONCO_PONTA, { roughness: 0.7 })
      ponta.rotation.z = Math.PI / 2
      ponta.position.set(tora.position.x + s * (0.66 + 0.002), -0.02, z)
      ponta.scale.y = 1
      balsa.add(ponta)
      const anel = torus(0.07, 0.008, '#a8794c', { roughness: 0.75 })
      anel.rotation.y = Math.PI / 2
      anel.position.copy(ponta.position)
      anel.position.x += s * 0.007
      balsa.add(anel)
    }
  }
  // amarras de corda atravessando os troncos
  for (const x of [-0.46, 0.46]) {
    const amarra = cylinder(0.026, 0.026, 0.84, CORDA, { roughness: 0.9 })
    amarra.rotation.x = Math.PI / 2
    amarra.position.set(x, 0.105, 0)
    balsa.add(amarra)
    for (const z of [-0.27, 0, 0.27]) {
      const volta = torus(0.135, 0.022, CORDA, { roughness: 0.9 })
      volta.rotation.y = Math.PI / 2
      volta.position.set(x, -0.02, z)
      volta.scale.set(1, 1, 1)
      balsa.add(volta)
    }
  }
  // argola de reboque na ponta da frente (onde a corda chega)
  const argola = torus(0.05, 0.014, CORDA, { roughness: 0.9 })
  argola.rotation.y = Math.PI / 2
  argola.position.set(-0.7, 0.0, 0)
  balsa.add(argola)
  const anchor = new THREE.Object3D()
  anchor.position.set(-0.72, 0.02, 0)
  balsa.add(anchor)

  // ---- pilha de três caixas -------------------------------------------------
  const caixas = new THREE.Group()
  caixas.position.y = DY
  balsa.add(caixas)
  const c1 = caixa(0.52, 0.42, 0.46)
  c1.position.set(-0.2, 0, 0.06)
  c1.rotation.y = 0.04
  caixas.add(c1)
  const c2 = caixa(0.44, 0.34, 0.42)
  c2.position.set(0.33, 0, -0.04)
  c2.rotation.y = -0.1
  caixas.add(c2)
  const c3 = caixa(0.42, 0.32, 0.38)
  c3.position.set(-0.22, 0.42, -0.04)
  c3.rotation.y = 0.2
  caixas.add(c3)

  // ---- abajur de cúpula amarela em cima da caixa da direita ----------------
  const abajur = new THREE.Group()
  abajur.position.set(0.34, DY + 0.34, -0.06)
  abajur.rotation.z = -0.06
  balsa.add(abajur)
  const pe = lathe([[0, 0], [0.1, 0], [0.105, 0.02], [0.06, 0.05], [0.035, 0.09], [0, 0.09]], ABAJUR_PE, { roughness: 0.45, metalness: 0.3 })
  abajur.add(pe)
  const haste = cylinder(0.014, 0.014, 0.32, '#c9b58e', { roughness: 0.3, metalness: 0.7 })
  haste.position.y = 0.24
  abajur.add(haste)
  const cupula = lathe(
    [[0.17, 0], [0.165, 0.01], [0.1, 0.24], [0.092, 0.245], [0.088, 0.235], [0.155, 0.01], [0.16, 0]],
    CUPULA,
    { roughness: 0.75 },
  )
  cupula.position.y = 0.3
  abajur.add(cupula)
  const friso = torus(0.165, 0.01, '#d9a94a', { roughness: 0.6 })
  friso.rotation.x = Math.PI / 2
  friso.position.y = 0.305
  abajur.add(friso)
  const pinha = sphere(0.025, '#c9b58e', { roughness: 0.3, metalness: 0.7 })
  pinha.position.y = 0.57
  abajur.add(pinha)

  // ---- folhinha de calendário na frente da caixa grande --------------------
  const folhinha = new THREE.Group()
  folhinha.position.set(-0.2, DY + 0.24, 0.06 + 0.23 + 0.012)
  folhinha.rotation.set(-0.04, 0.04, 0.03)
  balsa.add(folhinha)
  const CW = 0.38
  const CH = 0.44
  const placa = rbox(CW, CH, 0.016, 0.01, PAPEL, { roughness: 0.7 })
  folhinha.add(placa)
  const cabecalho = rbox(CW, 0.11, 0.022, 0.01, VERMELHO, { roughness: 0.5 })
  cabecalho.position.set(0, CH / 2 - 0.055, 0.004)
  folhinha.add(cabecalho)
  for (const s of [-1, 1]) {
    const espiral = torus(0.022, 0.006, '#2b2b2b', { roughness: 0.3, metalness: 0.6 })
    espiral.rotation.y = Math.PI / 2
    espiral.position.set(s * 0.1, CH / 2 + 0.005, 0.01)
    folhinha.add(espiral)
  }
  // grade de dias (3 x 4) na página de baixo — o dia 1 do mês novo circulado
  const dia = (x: number, y: number, g: THREE.Object3D, z: number) => {
    const q = rbox(0.06, 0.05, 0.006, 0.006, GRADE, { roughness: 0.8 })
    q.position.set(x, y, z)
    g.add(q)
  }
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) dia(-0.12 + c * 0.08, 0.035 - r * 0.075, folhinha, 0.011)
  }
  const circulo = torus(0.042, 0.009, VERMELHO, { roughness: 0.5 })
  circulo.position.set(-0.12, 0.035, 0.016)
  folhinha.add(circulo)

  // página de cima: dobradiça logo abaixo do cabeçalho, levantando e virando
  const pagina = new THREE.Group()
  pagina.position.set(0, CH / 2 - 0.11, 0.016)
  pagina.rotation.x = -1.2
  folhinha.add(pagina)
  const folha = rbox(CW - 0.02, CH - 0.13, 0.006, 0.004, PAPEL, { roughness: 0.75 })
  folha.position.y = -(CH - 0.13) / 2
  pagina.add(folha)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const q = rbox(0.06, 0.05, 0.004, 0.004, '#d4cfc5', { roughness: 0.8 })
      q.position.set(-0.12 + c * 0.08, -0.07 - r * 0.075, 0.005)
      pagina.add(q)
    }
  }

  // ---- BISÃO ---------------------------------------------------------------
  const bisao = new THREE.Group()
  bisao.position.set(BISAO_POS[0], WY, BISAO_POS[1])
  bisao.rotation.y = BISAO_YAW
  root.add(bisao)

  const lombo = sphere(0.62, BISAO, { roughness: 0.88 })
  lombo.scale.set(0.92, 0.78, 1.38)
  lombo.position.set(0, 0.0, -0.3)
  bisao.add(lombo)

  const corcova = sphere(0.52, BISAO, { roughness: 0.88 })
  corcova.scale.set(0.95, 1.0, 1.1)
  corcova.position.set(0, 0.4, 0.22)
  bisao.add(corcova)

  const garupa = sphere(0.46, BISAO, { roughness: 0.88 })
  garupa.scale.set(0.95, 0.85, 1)
  garupa.position.set(0, 0.06, -0.95)
  bisao.add(garupa)

  // juba escura e peluda cobrindo a corcova, os ombros e o peito
  for (const [jx, jy, jz, jr] of [
    [0, 0.66, 0.36, 0.4], [0, 0.5, 0.0, 0.36], [-0.28, 0.36, 0.52, 0.32], [0.28, 0.36, 0.52, 0.32],
    [0, 0.2, 0.78, 0.36], [-0.3, 0.12, 0.66, 0.28], [0.3, 0.12, 0.66, 0.28],
  ] as const) {
    const tufo = sphere(jr, JUBA, { roughness: 0.95 })
    tufo.position.set(jx, jy, jz)
    bisao.add(tufo)
  }

  // rabicho com pompom, fora d'água atrás
  const rabo = capsule(0.04, 0.28, BISAO, { roughness: 0.88 })
  rabo.position.set(0, 0.32, -1.32)
  rabo.rotation.x = -0.7
  bisao.add(rabo)
  const pompom = sphere(0.08, JUBA, { roughness: 0.95 })
  pompom.scale.set(0.9, 1.3, 0.9)
  pompom.position.set(0, 0.47, -1.44)
  bisao.add(pompom)

  // ---- cabeça: virada para a câmera, boca redonda mugindo ------------------
  const cabeca = new THREE.Group()
  cabeca.rotation.order = 'YXZ'
  cabeca.position.set(0, 0.6, 0.98)
  cabeca.rotation.y = 1.12
  cabeca.rotation.x = -0.12
  bisao.add(cabeca)

  const cranio = sphere(0.34, BISAO, { roughness: 0.88 })
  cranio.scale.set(1.05, 1.0, 1.08)
  cabeca.add(cranio)
  for (const [tx, ty, tz, tr] of [[0, 0.24, 0.02, 0.22], [-0.16, 0.18, -0.02, 0.17], [0.16, 0.18, -0.02, 0.17], [0, 0.12, -0.2, 0.24]] as const) {
    const topete = sphere(tr, JUBA, { roughness: 0.95 })
    topete.position.set(tx, ty, tz)
    cabeca.add(topete)
  }
  const focinho = sphere(0.24, FOCINHO, { roughness: 0.8 })
  focinho.scale.set(1.15, 0.85, 0.95)
  focinho.position.set(0, -0.15, 0.3)
  cabeca.add(focinho)
  const nariz = sphere(0.12, NARIZ, { roughness: 0.35 })
  nariz.scale.set(1.35, 0.75, 0.6)
  nariz.position.set(0, -0.08, 0.49)
  cabeca.add(nariz)
  for (const s of [-1, 1]) {
    const narina = sphere(0.03, '#0d0a09', { roughness: 0.4 })
    narina.position.set(s * 0.07, -0.09, 0.555)
    cabeca.add(narina)
  }
  // boca aberta em O: lábio em anel em volta do escuro
  const boca = sphere(0.12, BOCA, { roughness: 0.6 })
  boca.scale.set(1, 1, 0.5)
  boca.position.set(0, -0.32, 0.45)
  cabeca.add(boca)
  const labio = torus(0.11, 0.036, FOCINHO, { roughness: 0.7 })
  labio.position.set(0, -0.32, 0.47)
  labio.rotation.x = 0.25
  cabeca.add(labio)
  const lingua = sphere(0.06, LINGUA, { roughness: 0.4 })
  lingua.scale.set(1.2, 0.55, 0.8)
  lingua.position.set(0, -0.38, 0.47)
  cabeca.add(lingua)
  // barbicha pingando na água
  const barba = sphere(0.13, JUBA, { roughness: 0.95 })
  barba.scale.set(1, 1.35, 0.9)
  barba.position.set(0, -0.44, 0.22)
  cabeca.add(barba)
  for (const s of [-1, 1]) {
    const esclera = sphere(0.075, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(s * 0.22, 0.06, 0.26)
    esclera.rotation.y = s * 0.5
    cabeca.add(esclera)
    const pupila = sphere(0.04, '#141010', { roughness: 0.2 })
    pupila.position.set(s * 0.235, 0.07, 0.3)
    cabeca.add(pupila)
    // sobrancelha franzida: desconfiado
    const sobrancelha = capsule(0.024, 0.1, JUBA, { roughness: 0.95 })
    sobrancelha.position.set(s * 0.21, 0.15, 0.27)
    sobrancelha.rotation.set(0, 0, Math.PI / 2 + s * 0.35)
    cabeca.add(sobrancelha)
    const orelha = capsule(0.06, 0.1, BISAO, { roughness: 0.88 })
    orelha.position.set(s * 0.38, 0.0, -0.06)
    orelha.rotation.z = s * (Math.PI / 2 + 0.35)
    cabeca.add(orelha)
  }

  // ---- chifres curtos pretos, curvados pra cima ----------------------------
  const chifres = new THREE.Group()
  cabeca.add(chifres)
  const hornTip = new THREE.Object3D()
  for (const s of [-1, 1]) {
    const lado = new THREE.Group()
    lado.rotation.y = s > 0 ? 0 : Math.PI
    chifres.add(lado)
    const R = 0.15
    const arco = new THREE.Mesh(new THREE.TorusGeometry(R, 0.056, 14, 24, Math.PI / 2), mat(CHIFRE, { roughness: 0.35, size: 0.3 }))
    arco.castShadow = true
    arco.receiveShadow = true
    arco.rotation.z = -Math.PI / 2
    arco.position.set(0.28, 0.2 + R, 0.02)
    lado.add(arco)
    const base = cylinder(0.07, 0.066, 0.08, CHIFRE, { roughness: 0.5 })
    base.rotation.z = Math.PI / 2
    base.position.set(0.27, 0.2, 0.02)
    lado.add(base)
    const ponta = cone(0.055, 0.14, CHIFRE, { roughness: 0.3 })
    ponta.position.set(0.28 + R, 0.2 + R + 0.07, 0.02)
    lado.add(ponta)
    if (s > 0) {
      // a corda é amarrada na base do chifre direito (o do lado da balsa)
      const no = torus(0.058, 0.022, CORDA, { roughness: 0.9 })
      no.rotation.set(Math.PI / 2, 0, 0)
      no.position.set(0.28 + R, 0.2 + R + 0.01, 0.02)
      lado.add(no)
      hornTip.position.set(0.28 + R + 0.03, 0.2 + R + 0.01, 0.02)
      lado.add(hornTip)
    }
  }

  // ---- corda esticada do chifre até a balsa --------------------------------
  root.updateMatrixWorld(true)
  const a = root.worldToLocal(hornTip.getWorldPosition(new THREE.Vector3()))
  const b = root.worldToLocal(anchor.getWorldPosition(new THREE.Vector3()))
  const dir = b.clone().sub(a)
  const len = dir.length()
  const corda = new THREE.Group()
  corda.position.copy(a)
  corda.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  const cabo = cylinder(0.022, 0.022, len, CORDA, { roughness: 0.9 }, 10)
  cabo.position.y = len / 2
  corda.add(cabo)
  // fibras torcidas: anéis de leve relevo ao longo da corda
  for (let i = 1; i < 9; i++) {
    const fibra = torus(0.022, 0.006, '#c4a974', { roughness: 0.9 })
    fibra.rotation.x = Math.PI / 2
    fibra.position.y = (len * i) / 9
    corda.add(fibra)
  }
  root.add(corda)

  // ---- anéis de onda em volta do bisão e da balsa --------------------------
  const ondas = new THREE.Group()
  ondas.position.set(BISAO_POS[0], WY + 0.006, BISAO_POS[1])
  ondas.rotation.y = BISAO_YAW
  root.add(ondas)
  for (const [r, sx, sz, cor] of [[1.0, 0.82, 1.42, ONDA], [1.0, 1.12, 1.7, '#9fd0ea']] as const) {
    const anel = torus(r, 0.028, cor, { roughness: 0.2 })
    anel.rotation.x = Math.PI / 2
    anel.scale.set(sx, sz, 0.35)
    anel.position.z = -0.1
    ondas.add(anel)
  }
  // esteira em V atrás da garupa
  for (const s of [-1, 1]) {
    const esteira = capsule(0.024, 0.7, ONDA, { roughness: 0.2 })
    esteira.rotation.set(Math.PI / 2, 0, s * 0.35)
    esteira.scale.z = 0.35
    esteira.position.set(s * 0.95, 0, -1.7)
    ondas.add(esteira)
  }
  // anel em volta da balsa (no espaço do rio)
  const anelBalsa = torus(0.86, 0.024, '#9fd0ea', { roughness: 0.2 })
  anelBalsa.rotation.x = Math.PI / 2
  anelBalsa.scale.set(1.0, 0.68, 0.35)
  const anelBalsaG = new THREE.Group()
  anelBalsaG.position.set(BALSA_POS[0] - BISAO_POS[0], 0, BALSA_POS[1] - BISAO_POS[1])
  anelBalsaG.rotation.y = BALSA_YAW
  anelBalsaG.add(anelBalsa)
  // a balsa está no espaço do rio, não do bisão: desfaz o giro do grupo
  const anelBalsaPivo = new THREE.Group()
  anelBalsaPivo.rotation.y = -BISAO_YAW
  anelBalsaPivo.add(anelBalsaG)
  ondas.add(anelBalsaPivo)

  // ---- bolhas subindo em volta do bisão ------------------------------------
  const bolhas = new THREE.Group()
  root.add(bolhas)
  for (const [bx, by, bz, br] of [
    [-1.8, 1.3, 1.0, 0.1], [-1.5, 1.08, 1.3, 0.06], [-1.8, 0.66, 1.2, 0.05],
    [-1.2, 0.45, 1.4, 0.055], [0.2, 0.42, 0.92, 0.05], [0.42, 0.62, 0.78, 0.035], [-0.2, 0.36, 1.25, 0.04],
  ] as const) {
    const bolha = sphere(br, '#e9f6fd', { roughness: 0.08, detail: 0 })
    bolha.position.set(bx, by, bz)
    bolhas.add(bolha)
    const brilho = sphere(br * 0.28, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.9 })
    brilho.position.set(bx - br * 0.4, by + br * 0.45, bz + br * 0.6)
    bolhas.add(brilho)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'rio', group: 'rio', object: rio },
    { name: 'margem', group: 'rio', object: margem },
    { name: 'pinheiros', group: 'rio', object: pinheiros },
    { name: 'balsa', group: 'balsa', object: balsa },
    { name: 'caixas', group: 'mudanca', object: caixas },
    { name: 'abajur', group: 'mudanca', object: abajur },
    { name: 'folhinha', group: 'mudanca', object: folhinha },
    { name: 'bisao', group: 'bisao', object: bisao },
    { name: 'cabeca', group: 'bisao', object: cabeca },
    { name: 'chifres', group: 'bisao', object: chifres },
    { name: 'bolhas', group: 'flut', object: bolhas },
    { name: 'corda', group: 'reboque', object: corda },
    { name: 'ondas', group: 'reboque', object: ondas },
    { name: 'pagina', group: 'mes', object: pagina },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('rio-sobe', 'rio', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Sobe um rio largo, com a margem de pinheiros lá do outro lado.',
    }),
    seq('margem-sobe', 'margem', 0.3, 0.8, [riseFrom(0, 0.7)], { ease: 'easeOut' }),
    seq('pinheiros-sobem', 'pinheiros', 0.7, 0.8, [riseFrom(0, 1.8)], { ease: 'easeOut' }),

    seq('balsa-boia', 'balsa', 1.9, 0.8, [riseFrom(WY, 0.5)], {
      ease: 'easeOut',
      caption: 'Na água boia uma balsinha de três troncos amarrados com corda.',
    }),

    seq('caixas-caem', 'caixas', 3.1, 0.55, [ch('position.y', DY + 1.6, DY)], {
      ease: 'easeIn',
      caption: 'E a mudança inteira cai em cima dela: caixas de papelão, um abajur...',
    }),
    seq('abajur-cai', 'abajur', 3.6, 0.5, [ch('position.y', DY + 1.9, DY + 0.34)], { ease: 'easeIn' }),
    seq(
      'folhinha-cola',
      'folhinha',
      4.3,
      0.45,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: '...e a folhinha do calendário: a mudança é no MÊS que vem.' },
    ),

    seq('bisao-emerge', 'bisao', 5.5, 1.0, [riseFrom(WY, 1.7)], {
      ease: 'easeOut',
      caption: 'Do rio emerge o dono da mudança, um BISÃO de uma tonelada, desconfiado: IÁ... FLÜT(u)AR? NESTA?!',
    }),
    seq('cabeca-olha', 'cabeca', 5.9, 0.7, [ch('rotation.y', 0.3, 1.12)], { ease: 'easeOut' }),

    seq('bisao-afunda', 'bisao', 7.7, 0.35, [ch('position.y', WY, WY - 0.35)], {
      ease: 'easeIn',
      caption: 'Ele afunda no meio da palavra — FLÜT... blub... TAR! — e o U sobe numa bolha.',
    }),
    seq(
      'bolhas-sobem',
      'bolhas',
      7.95,
      0.8,
      [ch('position.y', -0.5, 0)],
      { ease: 'easeOut' },
    ),
    seq('bisao-volta', 'bisao', 8.2, 0.6, [ch('position.y', WY - 0.35, WY)], { ease: 'easeOut' }),

    seq('corda-estica', 'corda', 9.3, 0.7, [ch('scale.y', 0.02, 1)], {
      ease: 'easeOut',
      caption: 'Desiste: amarra a corda no chifre e sai nadando, rebocando a mudança.',
    }),
    seq(
      'ondas-abrem',
      'ondas',
      9.6,
      1.0,
      [ch('scale.x', 0.4, 1), ch('scale.z', 0.4, 1)],
      { ease: 'easeOut' },
    ),

    seq('cabeca-muge', 'cabeca', 10.9, 0.6, [ch('rotation.x', 0.25, -0.12)], {
      ease: 'easeOut',
      caption: 'E muge grave, de boca redonda: MÔÔÔ... NAD(a)! — o -A afunda numa bolha.',
    }),

    seq('pagina-vira', 'pagina', 12.3, 0.7, [ch('rotation.x', 0, -1.2)], {
      ease: 'easeInOut',
      caption: 'Jag flyttar nästa månad. — Vou me mudar mês que vem.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 1.8, 5.2], target: [0.2, 0.66, 0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-flyttar-nasta-manad',
    contexto:
      "Mudança: avisando o chefe, os colegas, o vizinho, a escola ou a creche das crianças, a administradora do prédio (o aviso de saída do aluguel costuma ser de três meses: uppsägningstid) e ao cancelar internet, luz e academia. Troque o tempo: 'nästa vecka' (semana que vem), 'i sommar' (neste verão).",
    fraseFonte: 'Vou me mudar mês que vem.',
    fraseAlvo: 'Jag flyttar nästa månad.',
    pronuncia:
      "iá FLÜT-tar NÉS-ta MÔÔ-nad ('jag' = iá, o -g não soa; 'flyttar' com a força no FLY: o y é Ü — lábios em bico de U e língua de I —, curto, e o TT seguro um instante; o -ar é fraco, mas com R brando no fim: sem ele vira 'flytta', o infinitivo; 'nästa' com É aberto e curto e S e T secos, sem 'tchi'; 'månad' com Ô FECHADO e longo de 'avô' — é o å longo — e a força no MÅ; o -nad fraquinho, com D leve)",
    ponteSonora:
      "IÁ... FLÜT(u)AR? NESTA?! MÔÔ... NAD(a)! (7 sílabas: iá-FLÜT-tar-NÉS-ta-MÔÔ-nad; força no FLÜ, no NÉS e no MÔ; IÁ = o 'jag' de sempre, I de IOGA, nunca o J chiado de 'já'; FLÜT(u)AR = FLUTUAR com a barriga afundada: o bisão grita FLÚT! de focinho fora d'água — é aí que vai a força — e afunda bem no U do meio, que sobe em bolha; sobra 'FLÜT-tar', DUAS sílabas, a força no FLÜ, nunca 'flu-TAR' como o português puxa no infinitivo; o U é o Ü sueco: beiço em BICO de U e língua de I, o mesmo do DÜ de 'du', CURTO; o T dobrado, a língua segura um instante; e o -AR sai fraco e borbulhado, mas o R é OBRIGATÓRIO: sem ele sobra 'flytta', o infinitivo; NESTA = o MESMO 'nesta' do motorista de 'När går nästa buss?' ('NESTA, não'): É ABERTO, como 'festa', S e T secos, nunca 'nêsta' nem 'néstcha'; MÔÔ = o mugido grave do bisão, de boca bem redonda: Ô FECHADO e LONGO de 'avô' — é o å longo, a mesma vogal do FÔ de 'få' —, nunca o MUU de vaca nem o MÓ aberto; NAD(a) = o 'NADA!' que ele anuncia antes de afundar de novo: o -A vira bolha, sobra NAD, com D leve; MÔÔ-NAD é UMA palavra, força só no MÔ; e o D fica: sem ele, 'måne' é a LUA, não o mês)",
    historia:
      "Mês que vem o BISÃO se muda pra outra margem do rio, e a mudança inteira já está empilhada numa balsinha de três troncos: caixas de papelão, um abajur e a folhinha do calendário. Ele olha a balsa, olha a própria corcova de uma tonelada e pergunta, desconfiado: IÁ... FLUTUAR? NESTA?! Põe uma pata em cima e afunda no meio da palavra — 'FLÚT... blub... tar' —, e o U do meio sobe numa bolha. Desiste, amarra a corda no chifre e cai n'água rebocando a mudança, mugindo grave de boca redonda — MÔÔÔ! — e anunciando 'NADA!', mas afunda de novo antes do -A: 'NAD... blub'. É o aviso do bisão: eu me mudo mês que vem.",
  },
  createScene,
  refine: { organic: ['bisao', 'cabeca'] },
}

export default card
