import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Ursäkta att jag stör." — ÜÜÜ... CHEQUE-ta! A-IÁ-STÉR(eo)!
 *
 * Biblioteca em silêncio. A porta foi arrancada das dobradiças e jaz no chão;
 * um HIPOPÓTAMO sentado, com um ESTÉREO gigante no ombro tocando no talo, faz
 * os livros voarem da estante. Envergonhado, ele escancara a bocarra e oferece
 * um CHEQUE pousado na língua (ÜÜÜ... CHEQUE-ta!) — fui eu e o ESTÉREO.
 *
 * Paleta: madeira clara (piso), madeira escura (estante/porta), hipopótamo
 * cinza-arroxeado, prata do estéreo. Acento saturado (amarelo) reservado às
 * ondas de som do ESTÉREO; o cheque é o branco mais claro da cena.
 */

const PISO = '#d6bf94'
const PISO_B = '#cbb185'
const PISO_LINHA = '#a88b60'
const BORDA = '#7a5a3c'
const MADEIRA = '#5a3b26'
const MADEIRA_ESC = '#432b1b'
const PORTA = '#8a5a36'
const PORTA_ESC = '#6e4528'
const LATAO = '#c9a250'
const HIPO = '#8d819f'
const HIPO_ESC = '#73688a'
const HIPO_CLARO = '#b9a5b8'
const BOCA = '#c85f74'
const LINGUA = '#e98a9c'
const UNHA = '#efe4d2'
const PRATA = '#c4c9d0'
const GRAFITE = '#2b2d33'
const AMARELO = '#ffc81f' // acento: ondas de som do ESTÉREO
const PAPEL = '#fbf8ee'
const VERDE = '#3c8a5f'

const FY = 0.16 // topo do piso

/** Livro aberto em V, como se batesse as capas no ar. */
function flyingBook(color: string, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const abre = 0.55 + rand() * 0.3
  for (const side of [-1, 1]) {
    const capa = new THREE.Group()
    capa.rotation.z = side * abre
    const placa = rbox(0.26, 0.018, 0.34, 0.006, color, { roughness: 0.7 })
    placa.position.x = side * 0.13
    capa.add(placa)
    const folhas = rbox(0.23, 0.035, 0.31, 0.008, '#f1e8d2', { roughness: 0.9 })
    folhas.position.set(side * 0.125, 0.026, 0)
    capa.add(folhas)
    g.add(capa)
  }
  const lombada = cylinder(0.022, 0.022, 0.34, color, { roughness: 0.7 })
  lombada.rotation.x = Math.PI / 2
  g.add(lombada)
  return g
}

/** Traço de letra no cheque (tinta verde). */
function stroke(w: number, h: number, x: number, y: number) {
  const s = rbox(w, h, 0.012, 0.004, VERDE, { roughness: 0.6 })
  s.position.set(x, y, 0)
  return s
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(4417)

  // ---- base: assoalho claro de biblioteca -----------------------------------
  const base = new THREE.Group()

  const borda = cylinder(2.62, 2.7, 0.1, BORDA, { roughness: 0.8 })
  borda.position.y = 0.05
  base.add(borda)

  const piso = cylinder(2.56, 2.6, 0.06, PISO, { roughness: 0.7 })
  piso.position.y = 0.13
  base.add(piso)

  for (let i = -6; i <= 6; i++) {
    const z = i * 0.4
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - z * z, 0.01))
    if (i % 2 === 0) {
      const ripa = rbox(len, 0.008, 0.38, 0.003, PISO_B, { roughness: 0.72 })
      ripa.position.set(0, FY + 0.002, z + 0.2)
      ripa.scale.x = Math.min(1, Math.sqrt(Math.max(2.5 * 2.5 - (z + 0.4) * (z + 0.4), 0.01)) * 2 / len)
      base.add(ripa)
    }
    const fresta = rbox(len, 0.01, 0.02, 0.004, PISO_LINHA, { roughness: 0.9 })
    fresta.position.set(0, FY + 0.003, z)
    base.add(fresta)
  }

  // tapete verde-musgo de leitura sob o hipopótamo
  const tapete = cylinder(1.25, 1.28, 0.025, '#5d7356', { roughness: 0.95 })
  tapete.position.set(0.1, FY + 0.012, -0.05)
  tapete.scale.z = 0.8
  base.add(tapete)
  const franja = torus(1.27, 0.02, '#4b5e45', { roughness: 0.95 })
  franja.rotation.x = Math.PI / 2
  franja.scale.y = 0.8
  franja.position.set(0.1, FY + 0.015, -0.05)
  base.add(franja)

  // vaso de planta ao fundo, à direita
  const vaso = lathe(
    [[0, 0], [0.16, 0], [0.18, 0.06], [0.16, 0.28], [0.19, 0.33], [0.16, 0.34], [0, 0.32]],
    '#a8573a',
    { roughness: 0.6 },
  )
  vaso.position.set(1.85, FY, -1.35)
  base.add(vaso)
  const planta = puff(0.3, '#55804a', 6, 12, { roughness: 0.9 })
  planta.position.set(1.85, FY + 0.6, -1.35)
  base.add(planta)

  root.add(base)

  // ---- estante alta de madeira escura --------------------------------------
  const estante = new THREE.Group()
  estante.position.set(-1.5, FY, -1.3)
  estante.rotation.y = 0.5
  root.add(estante)

  const EW = 1.3
  const EH = 2.5
  const ED = 0.42
  for (const side of [-1, 1]) {
    const lado = rbox(0.08, EH, ED, 0.02, MADEIRA, { roughness: 0.7 })
    lado.position.set(side * (EW / 2 - 0.04), EH / 2, 0)
    estante.add(lado)
  }
  const fundo = rbox(EW - 0.08, EH - 0.05, 0.04, 0.01, MADEIRA_ESC, { roughness: 0.8 })
  fundo.position.set(0, EH / 2, -ED / 2 + 0.03)
  estante.add(fundo)
  const coroa = rbox(EW + 0.12, 0.1, ED + 0.08, 0.03, MADEIRA, { roughness: 0.7 })
  coroa.position.y = EH + 0.03
  estante.add(coroa)
  const rodape = rbox(EW + 0.04, 0.14, ED + 0.04, 0.02, MADEIRA_ESC, { roughness: 0.7 })
  rodape.position.y = 0.07
  estante.add(rodape)

  const CORES = ['#3f5f8a', '#a8443a', '#4f7a4a', '#c08c3a', '#e5dcc6', '#6a4a7a', '#2f4f5f', '#8a3b3b']
  const prateleiras = [0.14, 0.72, 1.3, 1.88]
  for (let k = 0; k < prateleiras.length; k++) {
    const py = prateleiras[k]
    const tabua = rbox(EW - 0.08, 0.05, ED - 0.02, 0.012, MADEIRA, { roughness: 0.7 })
    tabua.position.set(0, py, 0)
    estante.add(tabua)
    // livros em pé, com lacunas (os que voaram)
    let x = -EW / 2 + 0.1
    while (x < EW / 2 - 0.12) {
      const w = 0.05 + rand() * 0.05
      if (rand() < (k === 3 ? 0.45 : 0.14)) {
        x += w + 0.03
        continue
      }
      const h = 0.34 + rand() * 0.14
      const livro = rbox(w, h, 0.28, 0.008, CORES[Math.floor(rand() * CORES.length)], { roughness: 0.75 })
      livro.position.set(x + w / 2, py + 0.025 + h / 2, 0.02)
      livro.rotation.z = (rand() - 0.5) * 0.06
      estante.add(livro)
      const faixa = rbox(w + 0.004, 0.02, 0.284, 0.004, '#e9d9a8', { roughness: 0.5 })
      faixa.position.set(x + w / 2, py + 0.025 + h * 0.8, 0.02)
      estante.add(faixa)
      x += w + 0.008
    }
  }
  // livros que caíram no chão diante da estante
  for (const [lx, lz, ry, cor] of [[0.25, 0.55, 0.4, '#a8443a'], [-0.3, 0.65, -0.7, '#3f5f8a']] as const) {
    const caido = rbox(0.24, 0.05, 0.32, 0.01, cor, { roughness: 0.75 })
    caido.position.set(lx, 0.025, lz)
    caido.rotation.y = ry
    estante.add(caido)
  }

  // ---- porta arrancada, caída no chão (dobradiça na base) ------------------
  const porta = new THREE.Group()
  porta.rotation.order = 'YXZ'
  porta.position.set(-1.55, FY, 0.05)
  porta.rotation.y = 0.35
  porta.rotation.x = Math.PI / 2 // pose final: deitada
  root.add(porta)

  const PW = 0.82
  const PH = 1.65
  const folha = rbox(PW, PH, 0.07, 0.02, PORTA, { roughness: 0.65 })
  folha.position.set(0, PH / 2, -0.035)
  porta.add(folha)
  for (const [py, ph] of [[0.45, 0.55], [1.2, 0.6]] as const) {
    const painel = rbox(PW - 0.22, ph, 0.03, 0.02, PORTA_ESC, { roughness: 0.7 })
    painel.position.set(0, py, -0.075)
    porta.add(painel)
    const almofada = rbox(PW - 0.32, ph - 0.1, 0.03, 0.02, PORTA, { roughness: 0.65 })
    almofada.position.set(0, py, -0.09)
    porta.add(almofada)
  }
  const macaneta = sphere(0.045, LATAO, { roughness: 0.3, metalness: 0.8 })
  macaneta.position.set(PW / 2 - 0.1, 0.85, -0.11)
  porta.add(macaneta)
  const espelho = rbox(0.06, 0.16, 0.015, 0.01, LATAO, { roughness: 0.3, metalness: 0.8 })
  espelho.position.set(PW / 2 - 0.1, 0.82, -0.075)
  porta.add(espelho)
  // dobradiças arrancadas, tortas
  for (const hy of [0.3, 1.35]) {
    const dob = rbox(0.06, 0.16, 0.02, 0.005, '#3a3a3e', { roughness: 0.4, metalness: 0.7 })
    dob.position.set(-PW / 2 - 0.02, hy, -0.075)
    dob.rotation.z = 0.3
    porta.add(dob)
  }
  // lascas de madeira
  for (let i = 0; i < 4; i++) {
    const lasca = rbox(0.12 + rand() * 0.1, 0.02, 0.03, 0.008, '#b98a5a', { roughness: 0.8 })
    lasca.position.set(-PW / 2 - 0.15 - rand() * 0.2, 0.2 + rand() * 1.2, 0.0)
    lasca.rotation.z = rand() * Math.PI
    porta.add(lasca)
  }

  // ---- HIPOPÓTAMO sentado ---------------------------------------------------
  const hipo = new THREE.Group()
  hipo.position.set(-0.2, FY, -0.35)
  root.add(hipo)

  const tronco = sphere(0.82, HIPO, { roughness: 0.6 })
  tronco.scale.set(1.05, 1.15, 0.92)
  tronco.position.y = 1.0
  hipo.add(tronco)

  const barriga = sphere(0.62, HIPO_CLARO, { roughness: 0.6 })
  barriga.scale.set(1, 1.1, 0.6)
  barriga.position.set(0, 0.86, 0.42)
  hipo.add(barriga)

  for (const side of [-1, 1]) {
    const ombro = sphere(0.36, HIPO, { roughness: 0.6 })
    ombro.position.set(side * 0.55, 1.5, 0.02)
    hipo.add(ombro)

    const coxa = sphere(0.38, HIPO, { roughness: 0.6 })
    coxa.scale.set(1, 0.85, 1.25)
    coxa.position.set(side * 0.55, 0.36, 0.38)
    hipo.add(coxa)

    const pe = sphere(0.25, HIPO_ESC, { roughness: 0.6 })
    pe.scale.set(1, 0.85, 1.05)
    pe.position.set(side * 0.6, 0.2, 0.86)
    hipo.add(pe)

    for (let d = 0; d < 4; d++) {
      const unha = sphere(0.045, UNHA, { roughness: 0.4 })
      unha.scale.set(1, 0.8, 0.7)
      unha.position.set(side * 0.6 + (d - 1.5) * 0.1, 0.15, 1.1 - Math.abs(d - 1.5) * 0.03)
      hipo.add(unha)
    }
  }

  // braço esquerdo (lado da câmera à esquerda) apoiado na barriga
  const bracoE = new THREE.Group()
  bracoE.position.set(-0.66, 1.5, 0.15)
  bracoE.rotation.set(-0.95, 0, 0.5)
  hipo.add(bracoE)
  const bracoEm = capsule(0.17, 0.4, HIPO, { roughness: 0.6 })
  bracoEm.position.y = -0.34
  bracoE.add(bracoEm)
  const maoE = sphere(0.2, HIPO_ESC, { roughness: 0.6 })
  maoE.scale.set(1, 0.85, 1)
  maoE.position.y = -0.66
  bracoE.add(maoE)

  // ---- pata direita: sustenta o estéreo no ombro ----------------------------
  const pata = new THREE.Group()
  pata.position.set(0.62, 1.52, 0.1)
  pata.rotation.set(0.2, 0, -1.0)
  hipo.add(pata)
  const bracoD = capsule(0.17, 0.36, HIPO, { roughness: 0.6 })
  bracoD.position.y = 0.3
  pata.add(bracoD)
  const maoD = sphere(0.2, HIPO_ESC, { roughness: 0.6 })
  maoD.scale.set(1, 0.85, 1)
  maoD.position.y = 0.62
  pata.add(maoD)

  // ---- cabeça larga, bocarra escancarada ------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.78, 0.42)
  cabeca.rotation.x = 0.08 // cabisbaixo de vergonha
  hipo.add(cabeca)

  const cranio = sphere(0.46, HIPO, { roughness: 0.6 })
  cranio.scale.set(1.15, 1.05, 1.0)
  cranio.position.set(0, 0.34, -0.12)
  cabeca.add(cranio)

  for (const side of [-1, 1]) {
    const calombo = sphere(0.14, HIPO, { roughness: 0.6 })
    calombo.position.set(side * 0.26, 0.75, 0.0)
    cabeca.add(calombo)

    const olho = sphere(0.09, '#ffffff', { roughness: 0.25 })
    olho.scale.z = 0.6
    olho.position.set(side * 0.26, 0.77, 0.11)
    cabeca.add(olho)
    const pupila = sphere(0.045, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.25, 0.745, 0.16)
    cabeca.add(pupila)
    // pálpebra caída: olhar envergonhado
    const palpebra = sphere(0.096, HIPO_ESC, { roughness: 0.6 })
    palpebra.scale.set(1, 0.55, 0.65)
    palpebra.position.set(side * 0.26, 0.825, 0.105)
    cabeca.add(palpebra)
    // sobrancelha de preocupação (ponta interna erguida)
    const sobr = capsule(0.022, 0.1, '#5c5270', { roughness: 0.7 })
    sobr.rotation.z = Math.PI / 2 - side * 0.4
    sobr.position.set(side * 0.25, 0.885, 0.06)
    cabeca.add(sobr)

    const orelha = sphere(0.09, HIPO, { roughness: 0.6 })
    orelha.scale.set(0.8, 1.15, 0.5)
    orelha.position.set(side * 0.42, 0.74, -0.24)
    orelha.rotation.z = -side * 0.4
    cabeca.add(orelha)
    const orelhaIn = sphere(0.05, BOCA, { roughness: 0.6 })
    orelhaIn.scale.set(0.8, 1.15, 0.4)
    orelhaIn.position.set(side * 0.425, 0.74, -0.2)
    orelhaIn.rotation.z = -side * 0.4
    cabeca.add(orelhaIn)

    // bochecha corada
    const rubor = sphere(0.08, '#d7869a', { roughness: 0.7 })
    rubor.scale.set(1.0, 0.55, 0.35)
    rubor.position.set(side * 0.47, 0.22, 0.2)
    cabeca.add(rubor)
  }

  // maxila superior, aberta para cima
  const maxila = new THREE.Group()
  maxila.position.set(0, 0.18, 0.08)
  maxila.rotation.x = -0.42
  cabeca.add(maxila)
  const focinho = sphere(0.4, HIPO, { roughness: 0.6 })
  focinho.scale.set(1.3, 0.5, 1.15)
  focinho.position.set(0, 0.06, 0.42)
  maxila.add(focinho)
  const palato = sphere(0.36, BOCA, { roughness: 0.5 })
  palato.scale.set(1.15, 0.22, 1.02)
  palato.position.set(0, -0.06, 0.42)
  maxila.add(palato)
  for (const side of [-1, 1]) {
    const narina = sphere(0.1, HIPO, { roughness: 0.6 })
    narina.position.set(side * 0.2, 0.19, 0.7)
    maxila.add(narina)
    const furo = sphere(0.038, '#3a3046', { roughness: 0.5 })
    furo.scale.set(1, 0.6, 1)
    furo.position.set(side * 0.2, 0.27, 0.74)
    maxila.add(furo)
    const presa = cone(0.05, 0.16, UNHA, { roughness: 0.35 })
    presa.rotation.x = Math.PI
    presa.position.set(side * 0.34, -0.1, 0.7)
    maxila.add(presa)
  }

  // mandíbula inferior
  const mandibula = sphere(0.4, HIPO, { roughness: 0.6 })
  mandibula.scale.set(1.3, 0.45, 1.2)
  mandibula.position.set(0, -0.22, 0.42)
  cabeca.add(mandibula)
  const chaoBoca = sphere(0.36, BOCA, { roughness: 0.5 })
  chaoBoca.scale.set(1.15, 0.2, 1.05)
  chaoBoca.position.set(0, -0.085, 0.42)
  cabeca.add(chaoBoca)
  for (const side of [-1, 1]) {
    const presa = cone(0.055, 0.2, UNHA, { roughness: 0.35 })
    presa.position.set(side * 0.38, 0.0, 0.72)
    presa.rotation.z = -side * 0.12
    cabeca.add(presa)
  }

  // ---- língua (sai da boca) -------------------------------------------------
  const lingua = new THREE.Group()
  lingua.position.set(0, -0.04, 0.2)
  cabeca.add(lingua)
  const linguaM = capsule(0.17, 0.5, LINGUA, { roughness: 0.4 })
  linguaM.rotation.x = Math.PI / 2
  linguaM.scale.set(1.25, 1, 0.38)
  linguaM.position.z = 0.42
  lingua.add(linguaM)
  const sulco = rbox(0.025, 0.012, 0.5, 0.005, BOCA, { roughness: 0.5 })
  sulco.position.set(0, 0.06, 0.42)
  lingua.add(sulco)

  // ---- CHEQUE pousado na ponta da língua ------------------------------------
  const cheque = new THREE.Group()
  cheque.position.set(0, -0.01, 1.0)
  cheque.rotation.x = -0.75
  cabeca.add(cheque)

  const CW = 0.74
  const CH = 0.36
  const papel = rbox(CW, CH, 0.018, 0.012, PAPEL, { roughness: 0.6, detail: 0.3 })
  papel.position.y = CH / 2
  cheque.add(papel)
  const moldura = new THREE.Group()
  moldura.position.set(0, CH / 2, 0.012)
  cheque.add(moldura)
  for (const [w, h, x, y] of [
    [CW - 0.05, 0.022, 0, CH / 2 - 0.035],
    [CW - 0.05, 0.022, 0, -CH / 2 + 0.035],
    [0.022, CH - 0.07, -CW / 2 + 0.035, 0],
    [0.022, CH - 0.07, CW / 2 - 0.035, 0],
  ] as const) {
    const fio = rbox(w, h, 0.008, 0.004, VERDE, { roughness: 0.6 })
    fio.position.set(x, y, 0)
    moldura.add(fio)
  }
  // Ü grande à esquerda (o gemido ÜÜÜ assinado no cheque)
  const letraU = new THREE.Group()
  letraU.position.set(-0.22, CH / 2 - 0.03, 0.016)
  letraU.add(stroke(0.04, 0.17, -0.07, 0))
  letraU.add(stroke(0.04, 0.17, 0.07, 0))
  letraU.add(stroke(0.18, 0.04, 0, -0.085))
  letraU.add(stroke(0.045, 0.045, -0.05, 0.13))
  letraU.add(stroke(0.045, 0.045, 0.05, 0.13))
  cheque.add(letraU)
  // linhas de valor e assinatura
  for (const [lw, lx, ly] of [[0.3, 0.17, 0.27], [0.3, 0.17, 0.19], [0.22, 0.21, 0.1]] as const) {
    const linha = rbox(lw, 0.014, 0.006, 0.003, '#8a9a8f', { roughness: 0.6 })
    linha.position.set(lx, ly, 0.013)
    cheque.add(linha)
  }
  const rabisco = torus(0.04, 0.008, '#2c4a8a', { roughness: 0.5 })
  rabisco.scale.set(1.6, 0.6, 1)
  rabisco.position.set(0.2, 0.125, 0.016)
  cheque.add(rabisco)

  // ---- ESTÉREO gigante no ombro --------------------------------------------
  const estereo = new THREE.Group()
  estereo.position.set(1.22, 2.26, -0.02)
  estereo.rotation.set(0, -0.1, -0.08)
  hipo.add(estereo)

  const SW = 1.3
  const SH = 0.64
  const SD = 0.42
  const gabinete = rbox(SW, SH, SD, 0.08, PRATA, { roughness: 0.3, metalness: 0.6 })
  estereo.add(gabinete)
  const frente = rbox(SW - 0.06, SH - 0.06, 0.02, 0.03, '#9aa1ab', { roughness: 0.4, metalness: 0.5 })
  frente.position.z = SD / 2
  estereo.add(frente)
  // painel do toca-fitas no centro
  const deck = rbox(0.34, 0.24, 0.02, 0.02, GRAFITE, { roughness: 0.4 })
  deck.position.set(0, -0.06, SD / 2 + 0.012)
  estereo.add(deck)
  const janela = rbox(0.22, 0.09, 0.01, 0.01, '#5d6670', { roughness: 0.15, metalness: 0.3 })
  janela.position.set(0, -0.05, SD / 2 + 0.024)
  estereo.add(janela)
  for (const rx of [-0.05, 0.05]) {
    const carretel = cylinder(0.025, 0.025, 0.012, '#e8e2d2', { roughness: 0.5 })
    carretel.rotation.x = Math.PI / 2
    carretel.position.set(rx, -0.05, SD / 2 + 0.03)
    estereo.add(carretel)
  }
  const visor = rbox(0.3, 0.06, 0.01, 0.01, '#3d5a4a', { roughness: 0.3 })
  visor.position.set(0, 0.16, SD / 2 + 0.012)
  estereo.add(visor)
  // botões no topo
  for (let i = 0; i < 5; i++) {
    const botao = rbox(0.07, 0.04, 0.08, 0.012, i === 2 ? '#c4433a' : GRAFITE, { roughness: 0.4 })
    botao.position.set(-0.2 + i * 0.1, SH / 2 + 0.015, 0.08)
    estereo.add(botao)
  }
  // alça
  for (const side of [-1, 1]) {
    const haste = cylinder(0.025, 0.025, 0.2, GRAFITE, { roughness: 0.4 })
    haste.position.set(side * 0.42, SH / 2 + 0.1, -0.05)
    estereo.add(haste)
  }
  const alca = cylinder(0.035, 0.035, 0.88, GRAFITE, { roughness: 0.5 })
  alca.rotation.z = Math.PI / 2
  alca.position.set(0, SH / 2 + 0.2, -0.05)
  estereo.add(alca)
  // antena
  const antena = cylinder(0.01, 0.012, 0.7, '#d9dde2', { roughness: 0.2, metalness: 0.8 })
  antena.position.set(SW / 2 - 0.12, SH / 2 + 0.3, -0.12)
  antena.rotation.z = -0.5
  estereo.add(antena)

  // ---- caixas de som (na frente do estéreo) ---------------------------------
  const caixas = new THREE.Group()
  caixas.position.z = SD / 2
  estereo.add(caixas)
  for (const side of [-1, 1]) {
    const cx = side * 0.43
    const aro = torus(0.22, 0.03, '#7d848e', { roughness: 0.3, metalness: 0.6 })
    aro.position.set(cx, 0, 0.02)
    caixas.add(aro)
    const tela = cylinder(0.215, 0.215, 0.03, GRAFITE, { roughness: 0.85 })
    tela.rotation.x = Math.PI / 2
    tela.position.set(cx, 0, 0.012)
    caixas.add(tela)
    const cone2 = lathe(
      [[0, 0.06], [0.06, 0.055], [0.15, 0.02], [0.17, 0.0]],
      '#1d1e22',
      { roughness: 0.6 },
    )
    cone2.rotation.x = Math.PI / 2
    cone2.position.set(cx, 0, 0.02)
    caixas.add(cone2)
    const calota = sphere(0.055, '#45484f', { roughness: 0.3, metalness: 0.4 })
    calota.scale.z = 0.5
    calota.position.set(cx, 0, 0.08)
    caixas.add(calota)
  }

  // ---- ondas de som: três arcos amarelos ")))" ------------------------------
  const ondas = new THREE.Group()
  ondas.position.set(1.22 + 0.72 - 0.2, 2.26, 0.25)
  hipo.add(ondas)
  const onda = (r: number) => {
    const a = 0.75
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.035, 12, 36, a * 2),
      mat(AMARELO, { roughness: 0.35, emissive: AMARELO, emissiveIntensity: 0.35 }),
    )
    m.castShadow = true
    m.rotation.z = -a
    return m
  }
  for (const r of [0.28, 0.46, 0.64]) {
    ondas.add(onda(r))
  }

  // ---- livros voando da estante --------------------------------------------
  const livros = new THREE.Group()
  root.add(livros)
  const voos: [number, number, number, number, number, string][] = [
    [-1.45, 2.85, -0.75, 0.5, 0.6, '#3f5f8a'],
    [-0.95, 2.55, -0.35, -0.4, -0.5, '#a8443a'],
    [-1.75, 2.15, -0.1, 0.9, 0.3, '#4f7a4a'],
  ]
  voos.forEach(([x, y, z, rz, ry, cor], i) => {
    const b = flyingBook(cor, 70 + i)
    b.position.set(x, y, z)
    b.rotation.set(0.5, ry, rz)
    b.scale.setScalar(1.35)
    livros.add(b)
  })

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'biblioteca', object: base },
    { name: 'estante', group: 'biblioteca', object: estante },
    { name: 'porta', group: 'porta', object: porta },
    { name: 'hipo', group: 'hipo', object: hipo },
    { name: 'cabeca', group: 'hipo', object: cabeca },
    { name: 'pata', group: 'hipo', object: pata },
    { name: 'estereo', group: 'estereo', object: estereo },
    { name: 'caixas', group: 'estereo', object: caixas },
    { name: 'ondas', group: 'som', object: ondas },
    { name: 'livros', group: 'som', object: livros },
    { name: 'lingua', group: 'cheque', object: lingua },
    { name: 'cheque', group: 'cheque', object: cheque },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem ---------------------------------------------------------------
  const build = [
    seq('base-sobe', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma biblioteca sueca em silêncio absoluto: assoalho claro e estante cheia de livros.',
    }),
    seq('estante-sobe', 'estante', 0.3, 0.8, [riseFrom(FY, 2.6)], { ease: 'easeOut' }),

    seq('porta-cai', 'porta', 1.8, 0.7, [ch('rotation.x', 0, Math.PI / 2)], {
      ease: 'easeIn',
      caption: 'BAM! A porta voa das dobradiças e desaba no chão…',
    }),

    seq('hipo-sobe', 'hipo', 3.0, 0.9, [riseFrom(FY, 2.8)], {
      ease: 'easeOut',
      caption: '…e entra um HIPOPÓTAMO enorme, que se senta no tapete.',
    }),
    seq('cabeca-sobe', 'cabeca', 3.3, 0.7, [ch('position.y', 1.2, 1.78)], { ease: 'easeOut' }),
    seq('pata-ergue', 'pata', 3.6, 0.7, [ch('rotation.z', -2.6, -1.0)], { ease: 'easeOut' }),

    seq('estereo-cresce', 'estereo', 4.6, 0.7, s3(0.05, 1), {
      ease: 'easeOut',
      caption: 'No ombro, um ESTÉREO do tamanho de uma geladeira, tocando no talo.',
    }),
    seq('caixas-pulsam', 'caixas', 5.0, 0.4, [ch('scale.z', 0.1, 1)], { ease: 'easeOut' }),

    seq('ondas-saem', 'ondas', 6.1, 0.6, s3(0.2, 1), {
      ease: 'easeOut',
      caption: 'O som estremece tudo: os livros pulam das prateleiras. Psiu!',
    }),
    seq('livros-voam', 'livros', 6.3, 0.8, [ch('position.y', -1.6, 0), ch('rotation.y', 0.6, 0)], {
      ease: 'easeOut',
    }),

    seq('cabeca-baixa', 'cabeca', 7.7, 0.6, [ch('rotation.x', -0.25, 0.08)], {
      caption: 'Morrendo de vergonha, ele baixa a cabeça e geme de bico: ÜÜÜ…',
    }),
    seq('lingua-sai', 'lingua', 9.0, 0.6, [ch('scale.z', 0.15, 1)], {
      ease: 'easeOut',
      caption: '…abre a bocarra e oferece, na língua, um CHEQUE: ÜÜÜ… CHEQUE-ta! A-IÁ-STÉR(eo)!',
    }),
    seq('cheque-surge', 'cheque', 9.3, 0.6, [...s3(0.05, 1), ch('rotation.x', -1.5, -0.75)], {
      ease: 'easeOut',
    }),
    seq('cheque-final', 'cheque', 11.2, 0.5, [ch('position.y', 0.04, 0.04)], {
      caption: 'Ursäkta att jag stör. — Desculpa incomodar.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 3.65, 5.5], target: [0.1, 1.38, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'ursakta-att-jag-stor',
    contexto:
      'Batendo na porta da sala de um colega, interrompendo uma reunião, abordando um funcionário ocupado na loja ou um vizinho no portão.',
    fraseFonte: 'Desculpa incomodar.',
    fraseAlvo: 'Ursäkta att jag stör.',
    pronuncia:
      "ÜÜ-chék-ta a iá STÖR ('ursäkta': a força principal cai no Ü do começo, LONGO e com bico + língua pra frente; o CHÉK também é forte (é palavra composta, ur+säkta), o 'rs' vira CH, e o -ta final é FRACO; 'att' quase some, fica só 'a', colado no -ta; 'jag' = iá; 'stör' com Ö antes do R = boca de É aberto com bico, LONGO, R brando no fim)",
    ponteSonora:
      "ÜÜÜ... CHEQUE-ta! A-IÁ-STÉR(eo)! (5 batidas: ÜÜ-CHÉK-ta-a-iá-STÉR, força no ÜÜ, no CHÉK e no STÉR; o CHEQUE é o MESMO âncora de 'ursäkta' da carta 'Ursäkta, jag förstår inte', mas dito do jeito certo: o 'o' do 'o CHEQUE' vira o gemido envergonhado ÜÜÜ — LONGO, lábios em bico e língua pra frente, nunca um 'u' rapidinho; CHEQUE-ta numa palavra só, CHÉK-ta, SEM o 'i' do 'chéki' e com o -ta fraquinho, sem virar um 'TÁ!' tônico no fim; o 'a' solto é o 'att', grudado no -ta; IÁ é o 'jag' de sempre, I de ioga, nunca J chiado; o S de ESTÉREO gruda no IÁ sem o E inicial — IÁ-STÉR — e corta-se o '-eo', ficando o R brando no fim; o É de ESTÉREO já é aberto como o Ö sueco antes de R, só falta o BICO: lábios de beijo. Sem bico vira um 'stär' esquisito; com Ô fechado vira 'står' (está em pé), que é o -STÔR de 'förstår' — o estéreo é É, o Thor é Ô)",
    historia:
      "Biblioteca sueca em silêncio absoluto. A porta voa das dobradiças: é o hipopótamo, com um ESTÉREO do tamanho de uma geladeira no ombro, tocando no talo — os livros pulam das prateleiras. Todo mundo faz 'psiu'. Morrendo de vergonha, ele baixa o volume e solta um gemido comprido de bico — 'ÜÜÜ...' —, abre a bocarra e, em cima da língua, oferece um cheque gigante: 'ÜÜÜ... CHEQUE-ta! A-IÁ-ESTÉREO!' — fui eu e o estéreo; desculpa incomodar.",
  },
  createScene,
  refine: { organic: ['hipo', 'cabeca', 'pata'] },
}

export default card
