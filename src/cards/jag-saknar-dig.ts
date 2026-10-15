import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, torus, lathe,
} from '../rig/helpers'

/**
 * "Jag saknar dig." — IÁ... SÁC-NAR-DÊI!
 *
 * O Natal acabou. A rena volta pro estábulo sueco de tábuas vermelhas,
 * arrastando o SACO de presentes, agora murcho e vazio. Ela enfia o NARIZ
 * vermelho na boca do saco — o nariz acende o saco por dentro feito lanterna —
 * e puxa lá do fundo a única coisa que sobrou: o seu cachecol listrado.
 * DEI falta de você.
 *
 * Diorama: assoalho de tábuas com palha, parede vermelho-celeiro com
 * acabamento branco e janela de noite, fardo de feno e caixa de presente
 * aberta e vazia; rena de 3/4 com a cabeça baixa na boca do saco tombado;
 * brilho vermelho na boca do saco (o acento saturado é SÓ o nariz e a luz dele).
 */

const SOLO = '#33261b'
const TABUA = '#7a5536'
const TABUA_FRESTA = '#4e3422'
const PALHA = '#dcbc5e'
const PALHA_ESC = '#b9973f'
const CELEIRO = '#8a3329'     // vermelho-celeiro (Falu), escurecido
const CELEIRO_ESC = '#782b23'
const BRANCO = '#ece6da'
const VIDRO = '#1f2b46'
const COURO = '#5a3a26'
const LATAO = '#c99a3e'
const RENA = '#7d6957'
const RENA_ESC = '#5e4e41'
const RENA_CLARO = '#a08b76'
const CREME = '#ece0c8'
const CHIFRE = '#c49d6d'
const CASCO = '#2f2620'
const SACO = '#c4a275'
const SACO_ESC = '#a6845a'
const CORDA = '#7d5f3e'
const PRESENTE = '#4f7a5a'
const LISTRA_V = '#b83c35'
const LISTRA_B = '#f3ece0'
const NARIZ = '#ec140c'       // acento saturado RESERVADO: o nariz e a luz dele

const GY = 0.18 // topo do assoalho

// rena: de 3/4, olhando para a frente-esquerda (frente local = -x)
const RENA_POS = new THREE.Vector3(0.7, GY, -0.55)
const RENA_YAW = 0.68
const RENA_K = 1.12 // escala da rena inteira
const PESCOCO: [number, number, number] = [-0.58, 1.16, 0] // pivô do pescoço
const CABECA_BAIXA = 0.76 // pose final: focinho na boca do saco
const CABECA_ALTA = -0.12

// saco tombado: a boca aponta para o focinho, meio virada pra câmera
const BOCA_DIR = new THREE.Vector3(0.95, 0, 0.32).normalize()
const SACO_K = 1.15 // tamanho do perfil do saco
const SACO_ACHATA = 0.6 // murcho: achatado na vertical

/** Cápsula de a até b (ossos, pernas, galhos de chifre). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, roughness = 0.85) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.001, d.length()), color, { roughness })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: assoalho de tábuas com palha ------------------------------------
  const base = new THREE.Group()

  const solo = cylinder(2.62, 2.72, 0.12, SOLO, { roughness: 0.95 })
  solo.position.y = 0.06
  base.add(solo)

  const piso = cylinder(2.55, 2.62, 0.07, TABUA, { roughness: 0.82 })
  piso.position.y = 0.145
  base.add(piso)

  // frestas entre as tábuas (cordas do disco)
  for (let i = -4; i <= 4; i++) {
    const z = i * 0.56
    const len = 2 * Math.sqrt(Math.max(2.48 * 2.48 - z * z, 0.01))
    const f = rbox(len, 0.02, 0.04, 0.008, TABUA_FRESTA, { roughness: 0.9 })
    f.position.set(0, GY + 0.002, z)
    base.add(f)
  }

  /** Fiapo de palha deitado (ou quase) no chão. */
  const fiapo = (x: number, y: number, z: number, tilt = 0) => {
    const f = cylinder(0.01, 0.01, 0.14 + rand() * 0.2, rand() < 0.55 ? PALHA : PALHA_ESC, { roughness: 0.8 }, 6)
    f.rotation.order = 'YXZ'
    f.rotation.set(Math.PI / 2 + (rand() - 0.5) * tilt, rand() * Math.PI, 0)
    f.position.set(x, y, z)
    return f
  }

  // palha solta espalhada
  for (let i = 0; i < 80; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.3 + Math.sqrt(rand()) * 2.15
    base.add(fiapo(Math.cos(a) * r, GY + 0.01, Math.sin(a) * r))
  }

  // montes de palha: fiapos cruzados empilhados
  for (const [px, pz, rr] of [[-1.05, -0.6, 0.4], [1.5, -0.65, 0.36]] as const) {
    for (let k = 0; k < 60; k++) {
      const a = rand() * Math.PI * 2
      const d = Math.sqrt(rand()) * rr
      const h = (1 - d / rr) * rr * 0.32
      base.add(fiapo(px + Math.cos(a) * d * 1.2, GY + 0.015 + h * rand(), pz + Math.sin(a) * d, 0.7))
    }
  }

  // caixa de presente aberta e vazia, tampa encostada
  const caixa = new THREE.Group()
  caixa.position.set(1.42, GY, 0.62)
  caixa.rotation.y = -0.5
  base.add(caixa)
  const CW = 0.38
  const CH = 0.27
  const fundoCx = rbox(CW, 0.03, CW, 0.01, PRESENTE, { roughness: 0.6 })
  fundoCx.position.y = 0.015
  caixa.add(fundoCx)
  for (const [w, d, x, z] of [
    [CW, 0.03, 0, CW / 2 - 0.015], [CW, 0.03, 0, -CW / 2 + 0.015],
    [0.03, CW, CW / 2 - 0.015, 0], [0.03, CW, -CW / 2 + 0.015, 0],
  ] as const) {
    const lado = rbox(w, CH, d, 0.01, PRESENTE, { roughness: 0.6 })
    lado.position.set(x, CH / 2, z)
    caixa.add(lado)
    const faixa = rbox(w > d ? 0.06 : w + 0.008, CH + 0.004, w > d ? d + 0.008 : 0.06, 0.008, CREME, { roughness: 0.5 })
    faixa.position.set(x, CH / 2, z)
    caixa.add(faixa)
  }
  const interior = rbox(CW - 0.06, 0.01, CW - 0.06, 0.004, '#2e4535', { roughness: 0.9 })
  interior.position.y = 0.035
  caixa.add(interior)
  const tampa = new THREE.Group()
  tampa.position.set(CW / 2 + 0.17, 0.19, 0.02) // encostada na borda da caixa
  tampa.rotation.z = -0.87
  caixa.add(tampa)
  const tampaM = rbox(CW + 0.04, 0.06, CW + 0.04, 0.015, PRESENTE, { roughness: 0.6 })
  tampa.add(tampaM)
  for (const rot of [0, Math.PI / 2]) {
    const fx = rbox(CW + 0.05, 0.065, 0.06, 0.01, CREME, { roughness: 0.5 })
    fx.rotation.y = rot
    tampa.add(fx)
  }
  for (const s of [-1, 1]) {
    const laco = torus(0.06, 0.018, CREME, { roughness: 0.5 })
    laco.scale.set(1, 0.6, 1)
    laco.rotation.set(0, s * 0.6, 0)
    laco.position.set(s * 0.05, 0.08, 0)
    tampa.add(laco)
  }

  root.add(base)

  // ---- parede de celeiro ao fundo --------------------------------------------
  const parede = new THREE.Group()
  parede.position.z = -1.48
  root.add(parede)

  const PW = 4.15
  const PH = 2.25
  const fundo = rbox(PW, PH, 0.1, 0.02, CELEIRO_ESC, { roughness: 0.85 })
  fundo.position.y = GY + PH / 2
  parede.add(fundo)
  // tábuas verticais com mata-junta
  for (let i = 0; i < 14; i++) {
    const x = -PW / 2 + 0.15 + i * ((PW - 0.3) / 13)
    const tabua = rbox(0.24, PH - 0.12, 0.04, 0.012, i % 2 ? CELEIRO : '#8f372c', { roughness: 0.85 })
    tabua.position.set(x, GY + PH / 2, 0.06)
    parede.add(tabua)
    const junta = rbox(0.05, PH - 0.12, 0.03, 0.01, CELEIRO_ESC, { roughness: 0.85 })
    junta.position.set(x + (PW - 0.3) / 26, GY + PH / 2, 0.085)
    parede.add(junta)
  }
  // acabamento branco: cantos, viga do topo, rodapé
  for (const side of [-1, 1]) {
    const canto = rbox(0.16, PH + 0.04, 0.16, 0.03, BRANCO, { roughness: 0.6 })
    canto.position.set(side * (PW / 2 - 0.02), GY + PH / 2, 0.04)
    parede.add(canto)
  }
  const viga = rbox(PW + 0.12, 0.14, 0.18, 0.03, BRANCO, { roughness: 0.6 })
  viga.position.set(0, GY + PH, 0.04)
  parede.add(viga)
  const rodape = rbox(PW, 0.1, 0.14, 0.02, BRANCO, { roughness: 0.6 })
  rodape.position.set(0, GY + 0.05, 0.06)
  parede.add(rodape)

  // janela de noite com moldura branca em cruz
  const janela = new THREE.Group()
  janela.position.set(-0.95, GY + 1.6, 0.1)
  parede.add(janela)
  const vidro = rbox(0.66, 0.54, 0.03, 0.01, VIDRO, { roughness: 0.15 })
  janela.add(vidro)
  for (const [w, h, x, y] of [
    [0.8, 0.08, 0, 0.31], [0.8, 0.08, 0, -0.31], [0.08, 0.7, 0.37, 0], [0.08, 0.7, -0.37, 0],
    [0.04, 0.54, 0, 0], [0.66, 0.04, 0, 0],
  ] as const) {
    const m = rbox(w, h, 0.06, 0.015, BRANCO, { roughness: 0.6 })
    m.position.set(x, y, 0.02)
    janela.add(m)
  }
  const peitoril = rbox(0.9, 0.06, 0.14, 0.02, BRANCO, { roughness: 0.6 })
  peitoril.position.set(0, -0.37, 0.05)
  janela.add(peitoril)
  for (const [sx, sy, sr] of [[-0.18, 0.12, 0.022], [0.17, 0.17, 0.016], [0.12, -0.13, 0.014]] as const) {
    const estrela = sphere(sr, '#fff4d0', { emissive: '#fff1c2', emissiveIntensity: 1.1 })
    estrela.position.set(sx, sy, 0.025)
    janela.add(estrela)
  }

  // arreio de Natal pendurado: pino, correia de couro e guizos de latão
  const arreio = new THREE.Group()
  arreio.position.set(-1.72, GY + 1.78, 0.12)
  parede.add(arreio)
  const pino = cylinder(0.025, 0.025, 0.12, BRANCO, { roughness: 0.6 })
  pino.rotation.x = Math.PI / 2
  pino.position.z = 0.04
  arreio.add(pino)
  const correia = torus(0.24, 0.032, COURO, { roughness: 0.7 })
  correia.scale.set(0.8, 1.15, 0.5)
  correia.position.set(0, -0.26, 0.06)
  arreio.add(correia)
  for (let k = 0; k < 7; k++) {
    const ang = -Math.PI / 2 + (k - 3) * 0.36
    const guizo = sphere(0.05, LATAO, { roughness: 0.3, metalness: 0.75 })
    guizo.position.set(Math.cos(ang) * 0.19, -0.26 + Math.sin(ang) * 0.28, 0.1)
    arreio.add(guizo)
  }

  // ---- fardo de feno -----------------------------------------------------------
  const feno = new THREE.Group()
  feno.position.set(-1.6, 0, -0.95)
  feno.rotation.y = 0.35
  root.add(feno)
  const fardo = rbox(0.95, 0.5, 0.58, 0.07, PALHA, { roughness: 0.92 })
  fardo.position.y = GY + 0.25
  feno.add(fardo)
  for (const bx of [-0.24, 0.24]) {
    const amarra = rbox(0.035, 0.52, 0.6, 0.012, '#7a5a34', { roughness: 0.85 })
    amarra.position.set(bx, GY + 0.25, 0)
    feno.add(amarra)
  }
  for (let i = 0; i < 14; i++) {
    const f = cylinder(0.01, 0.01, 0.18, PALHA_ESC, { roughness: 0.8 }, 6)
    f.position.set((rand() - 0.5) * 0.85, GY + 0.5 + rand() * 0.02, (rand() - 0.5) * 0.48)
    f.rotation.set(rand() * 1.2 - 0.6, 0, rand() * 1.2 - 0.6)
    feno.add(f)
  }

  // ---- RENA (corpo + pernas; a cabeça é peça própria) -------------------------
  const rena = new THREE.Group()
  rena.position.copy(RENA_POS)
  rena.rotation.y = RENA_YAW
  rena.scale.setScalar(RENA_K)
  root.add(rena)

  rena.add(limb(v(-0.3, 0.98, 0), v(0.38, 1.0, 0), 0.34, RENA))
  const peito = sphere(0.38, RENA, { roughness: 0.85 })
  peito.scale.set(1, 1.05, 0.95)
  peito.position.set(-0.42, 0.98, 0)
  rena.add(peito)
  const cernelha = sphere(0.23, RENA, { roughness: 0.85 })
  cernelha.position.set(-0.3, 1.13, 0)
  rena.add(cernelha)
  const anca = sphere(0.35, RENA, { roughness: 0.85 })
  anca.position.set(0.45, 1.0, 0)
  rena.add(anca)
  rena.add(limb(v(-0.25, 0.82, 0), v(0.3, 0.84, 0), 0.27, RENA_CLARO))
  // traseiro claro e rabicho branco
  const garupa = sphere(0.21, CREME, { roughness: 0.9 })
  garupa.scale.set(0.5, 1, 1.25)
  garupa.position.set(0.74, 1.04, 0)
  rena.add(garupa)
  const rabo = sphere(0.1, CREME, { roughness: 0.9 })
  rabo.scale.set(0.8, 1.2, 0.9)
  rabo.position.set(0.84, 1.18, 0)
  rena.add(rabo)

  for (const s of [-1, 1]) {
    const z = s * 0.19
    // dianteira
    rena.add(limb(v(-0.45, 0.86, z), v(-0.47, 0.44, z), 0.105, RENA))
    rena.add(limb(v(-0.47, 0.44, z), v(-0.49, 0.13, z), 0.075, RENA_ESC))
    const joelho = sphere(0.085, RENA_ESC, { roughness: 0.85 })
    joelho.position.set(-0.47, 0.44, z)
    rena.add(joelho)
    // traseira
    const coxa = sphere(0.22, RENA, { roughness: 0.85 })
    coxa.scale.set(1, 1.3, 0.82)
    coxa.position.set(0.5, 0.78, z)
    rena.add(coxa)
    rena.add(limb(v(0.55, 0.62, z), v(0.64, 0.36, z), 0.09, RENA))
    const jarrete = sphere(0.078, RENA_ESC, { roughness: 0.85 })
    jarrete.position.set(0.64, 0.36, z)
    rena.add(jarrete)
    rena.add(limb(v(0.64, 0.36, z), v(0.6, 0.13, z), 0.07, RENA_ESC))
    // meias creme e cascos largos
    for (const hx of [-0.49, 0.6]) {
      const meia = sphere(0.088, CREME, { roughness: 0.9 })
      meia.scale.set(1, 0.85, 1)
      meia.position.set(hx, 0.15, z)
      rena.add(meia)
      const casco = cylinder(0.085, 0.105, 0.1, CASCO, { roughness: 0.5 })
      casco.position.set(hx - 0.01, 0.05, z)
      rena.add(casco)
    }
  }

  // ---- cabeça + pescoço (pivô na cernelha; frente local = -x) -----------------
  const cabeca = new THREE.Group()
  cabeca.position.set(...PESCOCO)
  cabeca.rotation.z = CABECA_BAIXA
  cabeca.rotation.y = 0.35 // cara virada pra câmera
  rena.add(cabeca)

  cabeca.add(limb(v(0.08, 0, 0), v(-0.36, 0, 0), 0.2, RENA))
  cabeca.add(limb(v(-0.36, 0, 0), v(-0.64, 0.02, 0), 0.16, RENA))
  // colar de pelo creme: babado sob o pescoço
  cabeca.add(limb(v(-0.02, -0.09, 0), v(-0.48, -0.08, 0), 0.18, CREME, 0.92))
  for (const [bx, by, br] of [[-0.1, -0.22, 0.12], [-0.27, -0.25, 0.13], [-0.44, -0.2, 0.11]] as const) {
    const tufo = sphere(br, CREME, { roughness: 0.92 })
    tufo.scale.set(1, 0.9, 1.5)
    tufo.position.set(bx, by, 0)
    cabeca.add(tufo)
  }

  const cranio = sphere(0.27, RENA, { roughness: 0.85 })
  cranio.scale.set(1.08, 1, 0.95)
  cranio.position.set(-0.82, 0.05, 0)
  cabeca.add(cranio)
  cabeca.add(limb(v(-0.92, -0.02, 0), v(-1.2, -0.08, 0), 0.14, RENA_CLARO))
  const queixo = sphere(0.09, RENA_CLARO, { roughness: 0.85 })
  queixo.scale.set(1.6, 0.6, 0.9)
  queixo.position.set(-1.1, -0.17, 0)
  cabeca.add(queixo)

  for (const s of [-1, 1]) {
    // olho tristonho: pálpebra pesada caindo sobre a esclera, olhar pra baixo
    const esclera = sphere(0.07, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(-0.94, 0.11, s * 0.2)
    const pupila = sphere(0.036, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(-0.965, 0.09, s * 0.236)
    const palpebra = sphere(0.075, RENA_ESC, { roughness: 0.85 })
    palpebra.scale.set(1.05, 0.62, 0.64)
    palpebra.position.set(-0.94, 0.145, s * 0.203)
    cabeca.add(esclera, pupila, palpebra)
    // orelhas caídas para os lados
    const orelha = sphere(0.11, RENA, { roughness: 0.85 })
    orelha.scale.set(0.55, 1.4, 0.35)
    orelha.rotation.x = s * 1.98
    orelha.position.set(-0.7, 0.08, s * 0.3)
    cabeca.add(orelha)
  }

  // ---- chifres largos e galhados (adereço rígido, filho da cabeça) ------------
  const chifres = new THREE.Group()
  chifres.position.set(-0.8, 0.25, 0)
  chifres.rotation.z = -0.7 // compensa a cabeça baixa: ficam em pé no mundo
  chifres.scale.setScalar(0.88)
  cabeca.add(chifres)
  for (const s of [-1, 1]) {
    const b = [v(0, 0, s * 0.08), v(0.08, 0.25, s * 0.25), v(0.04, 0.52, s * 0.42), v(-0.1, 0.76, s * 0.5), v(-0.28, 0.9, s * 0.48)]
    const raios = [0.058, 0.052, 0.046, 0.038]
    for (let k = 0; k < b.length - 1; k++) chifres.add(limb(b[k], b[k + 1], raios[k], CHIFRE, 0.6))
    for (const [from, d, r] of [
      [b[1], v(-0.25, 0.06, s * 0.03), 0.036], // galho da testa, sobre a cara
      [b[2], v(-0.24, 0.2, s * 0.05), 0.034],
      [b[2], v(0.15, 0.2, s * 0.08), 0.031],
      [b[3], v(-0.06, 0.25, s * 0.1), 0.031],
      [b[3], v(-0.22, 0.12, 0), 0.029],
    ] as const) {
      chifres.add(limb(from, from.clone().add(d), r, CHIFRE, 0.6))
    }
  }

  // ---- nariz vermelho emissivo (o acento) --------------------------------------
  const nariz = new THREE.Group()
  nariz.position.set(-1.33, -0.08, 0)
  cabeca.add(nariz)
  const bola = sphere(0.11, NARIZ, { emissive: '#ff1608', emissiveIntensity: 1.0, roughness: 0.3 })
  nariz.add(bola)
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 24, 24),
    new THREE.MeshBasicMaterial({ color: '#ff4a30', transparent: true, opacity: 0.2, depthWrite: false }),
  )
  nariz.add(halo)

  // ---- saco tombado: a boca no focinho -----------------------------------------
  root.updateMatrixWorld(true)
  const N = nariz.getWorldPosition(new THREE.Vector3())
  const LABIO = cabeca.localToWorld(v(-1.16, -0.2, 0))
  const SY = GY + 0.37 * SACO_K * SACO_ACHATA - 0.02 // centro do saco deitado
  const BOCA = N.clone().addScaledVector(BOCA_DIR, 0.04).setY(SY)
  const SACO_LEN = 0.84 * SACO_K

  const saco = new THREE.Group()
  saco.position.copy(BOCA).addScaledVector(BOCA_DIR, -SACO_LEN / 2)
  saco.rotation.y = Math.atan2(-BOCA_DIR.z, BOCA_DIR.x)
  root.add(saco)

  // perfil do saco (lathe ao longo de y, boca em cima) deitado com a boca em +x
  const deitado = new THREE.Group()
  deitado.rotation.z = -Math.PI / 2
  deitado.position.x = -SACO_LEN / 2
  deitado.scale.setScalar(SACO_K)
  saco.add(deitado)
  const achatado = new THREE.Group() // tudo o que acompanha a pele achatada
  achatado.scale.x = SACO_ACHATA
  deitado.add(achatado)
  const PERFIL: [number, number][] = [
    [0, 0], [0.16, 0.01], [0.29, 0.06], [0.36, 0.18], [0.37, 0.34], [0.34, 0.5],
    [0.27, 0.62], [0.21, 0.69], [0.2, 0.74], [0.24, 0.8], [0.29, 0.84], [0.27, 0.845],
  ]
  const corpoSaco = lathe(PERFIL, SACO, { roughness: 0.92 })
  ;(corpoSaco.material as THREE.Material).side = THREE.DoubleSide
  achatado.add(corpoSaco)
  // pregas do pano franzido pelo cordão, abrindo do pescoço para a barriga
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + 0.2
    const dir = v(Math.cos(a), 0, Math.sin(a))
    const p0 = dir.clone().multiplyScalar(0.2).setY(0.68)
    const p1 = dir.clone().multiplyScalar(0.33).setY(0.49)
    achatado.add(limb(p0, p1, 0.02, '#b39064', 0.92))
  }
  // cordão frouxo no pescoço do saco
  const cordao = torus(0.21, 0.024, CORDA, { roughness: 0.85 })
  cordao.rotation.x = Math.PI / 2
  cordao.position.y = 0.72
  achatado.add(cordao)

  // remendo costurado no lado de cima
  const remendo = rbox(0.2, 0.16, 0.02, 0.02, SACO_ESC, { roughness: 0.92 })
  remendo.rotation.y = Math.PI / 2
  remendo.position.set(-0.37 * SACO_ACHATA - 0.004, 0.33, 0.05)
  deitado.add(remendo)

  // ---- brilho: o saco aceso por dentro feito lanterna ---------------------------
  // filho do saco, com a origem na boca (+x local = BOCA_DIR): acende dali
  const brilho = new THREE.Group()
  brilho.position.x = SACO_LEN / 2
  saco.add(brilho)
  const miolo = sphere(0.17, NARIZ, { emissive: '#ff3a20', emissiveIntensity: 1.3 })
  miolo.scale.set(0.6, SACO_ACHATA, 1)
  miolo.position.x = -0.12
  brilho.add(miolo)
  const luz = new THREE.PointLight('#ff4a2a', 2.2, 2.6, 2)
  luz.position.set(-0.1, 0.02, 0)
  brilho.add(luz)
  // casca aditiva por cima do pano: vermelho que vaza pelo tecido, forte na
  // boca e sumindo no fundo do saco
  const cascaGeo = new THREE.LatheGeometry(PERFIL.map(([r, y]) => new THREE.Vector2(r * 1.03 + 0.004, y)), 40)
  const pos = cascaGeo.attributes.position
  const cores = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getY(i) - 0.12) / 0.7, 0, 1)
    const k = 0.05 + 0.95 * t * t
    cores.set([k, k * 0.14, k * 0.06], i * 3)
  }
  cascaGeo.setAttribute('color', new THREE.BufferAttribute(cores, 3))
  const casca = new THREE.Mesh(
    cascaGeo,
    new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  )
  const cascaFrame = new THREE.Group()
  cascaFrame.rotation.z = -Math.PI / 2
  cascaFrame.position.x = -SACO_LEN
  cascaFrame.scale.set(SACO_K * SACO_ACHATA, SACO_K, SACO_K)
  cascaFrame.add(casca)
  brilho.add(cascaFrame)

  // ---- cachecol listrado: do fundo do saco ao focinho, a ponta no chão --------
  const cachecol = new THREE.Group()
  cachecol.position.copy(BOCA)
  root.add(cachecol)
  {
    const fora = v(-0.1, 0, 1).normalize()
    const pts = [
      BOCA.clone().addScaledVector(BOCA_DIR, -0.32).setY(GY + 0.16),
      BOCA.clone().add(v(0, -0.08, 0)),
      LABIO.clone(),
      LABIO.clone().addScaledVector(fora, 0.16).add(v(0, -0.14, 0)),
      LABIO.clone().addScaledVector(fora, 0.36).setY(GY + 0.05),
      LABIO.clone().addScaledVector(fora, 0.6).add(v(0.2, 0, 0)).setY(GY + 0.03),
      LABIO.clone().addScaledVector(fora, 0.74).add(v(0.48, 0, 0)).setY(GY + 0.03),
    ]
    const curva = new THREE.CatmullRomCurve3(pts)
    const n = 36
    const amostras = curva.getSpacedPoints(n)
    const geral = pts[pts.length - 1].clone().sub(pts[0]).setY(0).normalize()
    const lado = new THREE.Vector3().crossVectors(geral, v(0, 1, 0)).normalize()
    const W = 0.17
    const T = 0.04
    for (let i = 0; i < n; i++) {
      const a = amostras[i]
      const b = amostras[i + 1]
      const tan = b.clone().sub(a)
      const len = tan.length()
      tan.normalize()
      const normal = new THREE.Vector3().crossVectors(lado, tan).normalize()
      const lat = new THREE.Vector3().crossVectors(tan, normal).normalize()
      const cor = Math.floor(i / 2) % 2 === 0 ? LISTRA_V : LISTRA_B
      const gomo = rbox(len * 1.12, T, W, 0.014, cor, { roughness: 0.92 })
      gomo.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tan, normal, lat))
      gomo.position.copy(a).add(b).multiplyScalar(0.5).sub(BOCA)
      cachecol.add(gomo)
    }
    // franja na ponta que ficou no chão
    const fim = amostras[n]
    const dirFim = amostras[n].clone().sub(amostras[n - 1]).setY(0).normalize()
    const latFim = new THREE.Vector3().crossVectors(dirFim, v(0, 1, 0)).normalize()
    for (let k = -2; k <= 2; k++) {
      const p0 = fim.clone().addScaledVector(latFim, k * 0.034)
      const p1 = p0.clone().addScaledVector(dirFim, 0.1).addScaledVector(latFim, k * 0.01)
      const fio = limb(p0, p1, 0.012, k % 2 === 0 ? LISTRA_V : LISTRA_B, 0.92)
      fio.position.sub(BOCA)
      cachecol.add(fio)
    }
  }

  // ---- peças ---------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'estabulo', object: base },
    { name: 'parede', group: 'estabulo', object: parede },
    { name: 'feno', group: 'estabulo', object: feno },
    { name: 'saco', group: 'saco', object: saco },
    { name: 'rena', group: 'rena', object: rena },
    { name: 'cabeca', group: 'rena', object: cabeca },
    { name: 'chifres', group: 'rena', object: chifres },
    { name: 'nariz', group: 'rena', object: nariz },
    { name: 'brilho', group: 'lanterna', object: brilho },
    { name: 'cachecol', group: 'cachecol', object: cachecol },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem ------------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'O Natal acabou. Brota o estábulo de tábuas vermelhas, com palha pelo chão.',
    }),
    seq('parede-rise', 'parede', 0.25, 0.9, [riseFrom(0, 2.6)], { ease: 'easeOut' }),
    seq('feno-rise', 'feno', 0.5, 0.7, [riseFrom(0, 0.9)], { ease: 'easeOut' }),

    seq('saco-cai', 'saco', 2.0, 0.55, [ch('position.y', SY + 1.7, SY)], {
      ease: 'easeIn',
      caption: 'Despenca no chão o SACO de presentes — murcho, vazio: SÁC!',
    }),
    seq('saco-murcha', 'saco', 2.55, 0.5, [ch('scale.y', 1.45, 1)], { ease: 'easeOut' }),

    seq('rena-rise', 'rena', 3.6, 1.0, [riseFrom(GY, 2.8)], {
      ease: 'easeOut',
      caption: 'IÁ… volta a rena, de chifres largos e NARIZ vermelho, cabisbaixa.',
    }),
    seq('cabeca-ergue', 'cabeca', 3.6, 1.0, [ch('rotation.z', 0.3, CABECA_ALTA)], { ease: 'easeOut' }),
    seq('chifres-crescem', 'chifres', 4.0, 0.6, s3(0.01, 0.88), { ease: 'easeOut' }),
    seq('nariz-acende', 'nariz', 4.4, 0.35, s3(0.01, 1.3), { ease: 'easeOut' }),
    seq('nariz-assenta', 'nariz', 4.75, 0.25, s3(1.3, 1)),

    seq('cabeca-abaixa', 'cabeca', 5.5, 0.9, [ch('rotation.z', CABECA_ALTA, CABECA_BAIXA)], {
      caption: 'Ela enfia o NARIZ na boca do SACO e fareja até o fundo: SÁC… NAR…',
    }),

    seq('brilho-acende', 'brilho', 6.7, 0.6, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'O nariz acende o saco por dentro, feito lanterna…',
    }),
    seq('nariz-brilha', 'nariz', 6.7, 0.3, s3(1, 1.35), { ease: 'easeOut' }),
    seq('nariz-volta', 'nariz', 7.0, 0.4, s3(1.35, 1)),

    seq('cachecol-sai', 'cachecol', 8.1, 1.0, s3(0.01, 1), {
      ease: 'easeOut',
      caption: '…e lá no fundo só sobrou o seu cachecol listrado, ainda com o seu cheiro.',
    }),

    seq('rena-suspira', 'rena', 9.7, 0.6, [ch('scale.y', RENA_K, RENA_K * 1.035)], {
      ease: 'easeOut',
      caption: 'Ela puxa o cachecol e suspira: IÁ… SÁC-NAR-DÊI (DEI falta de você).',
    }),
    seq('rena-solta', 'rena', 10.3, 0.8, [ch('scale.y', RENA_K * 1.035, RENA_K)]),

    seq('nariz-pulsa', 'nariz', 11.2, 0.3, s3(1, 1.25), {
      ease: 'easeOut',
      caption: 'Jag saknar dig. — Sinto sua falta.',
    }),
    seq('nariz-final', 'nariz', 11.5, 0.5, s3(1.25, 1)),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.15, 4.45], target: [-0.05, 0.92, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-saknar-dig',
    contexto:
      "Família: por mensagem ou videochamada com quem ficou no Brasil, com o parceiro viajando, na despedida do aeroporto ('Jag kommer att sakna dig!' — vou sentir sua falta). Serve também pra coisas e lugares: 'Jag saknar brasiliansk mat' (sinto falta da comida brasileira).",
    fraseFonte: 'Sinto sua falta.',
    fraseAlvo: 'Jag saknar dig.',
    pronuncia:
      "iá SÁÁK-nar dêi ('jag' = iá; 'saknar' com força no SÁÁK, A longo e K seco; '-nar' fraquinho, com R de um toque só que quase derrete no D seguinte; 'dig' = dêi, uma sílaba só)",
    ponteSonora:
      "IÁ... SÁC-NAR-DÊI! (4 batidas: iá-SÁC-nar-dêi; força no SÁC; IÁ é o 'jag' de sempre, I de IOGA; SÁC = SACO sem o -O, A LONGO e K seco, sem 'ki' depois; NAR = NARIZ sem o -IZ: o NA fraquinho e o R de UM toque só, o mesmo toque do na-Riz e de 'caro' — nunca RR —, e SEM PAUSA antes do DÊI: o R cola no D, SÁC-nar-dêi num fôlego só (parado no fim, o R brasileiro some e sobra 'sakna', o infinitivo); DÊI = o 'dig' de sempre, irmão do M'ÊI de 'mig' — aqui é o DEI de 'DEI FALTA de você', uma sílaba só e fraca)",
    historia:
      "O Natal acabou. A rena volta pro estábulo arrastando o SACO de presentes, agora murcho e vazio. Ela enfia o NARIZ vermelho no SACO e fareja até o fundo: o nariz acende o saco por dentro feito lanterna, e lá embaixo só sobrou o seu cachecol listrado, ainda com o seu cheiro. Ela puxa o cachecol com o focinho, o nariz vai apagando devagar, e ela suspira: IÁ... SÁC-NAR-DEI falta de você. Sinto sua falta.",
  },
  createScene,
  refine: { organic: ['rena', 'cabeca'] },
}

export default card
