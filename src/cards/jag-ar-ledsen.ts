import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Jag är ledsen." — IÁÁ... É... (pico)LÉ SEM!
 *
 * Na biblioteca silenciosa, a bibliotecária de coque e óculos de corrente
 * solta um SHHHH! tão forte que o picolé de morango escorrega do palito e cai
 * em cima do livro raro. Ela fica com o palito VAZIO no alto, boca em arco
 * pra baixo e uma lágrima do tamanho de uma uva: picoLÉ SEM picolé.
 *
 * Diorama: piso de tábuas escuras, estante de livros em tons apagados ao
 * fundo, balcão de madeira clara; a bibliotecária atrás dele, grande e
 * central. Acento saturado RESERVADO ao picolé rosa (e à poça dele).
 */

const PISO = '#4a3121'
const PISO_LINHA = '#2f1f14'
const ESTANTE = '#6e4a2e'
const ESTANTE_ESC = '#523520'
const BALCAO = '#d1a872'
const BALCAO_ESC = '#b28650'
const BALCAO_FRISO = '#93693a'
const CREME = '#f1e6cc'
const CAPA = '#2f4a3c'      // couro verde do livro raro
const OURO = '#d9ad3c'
const CARDIGA = '#8b8f97'   // casaquinho cinza
const BLUSA = '#9d8bbd'     // blusa lilás
const BRANCO = '#f6f3ec'
const PELE = '#efcaa6'
const CABELO = '#c9c5bf'
const CABELO_ESC = '#a9a49d'
const ARMACAO = '#4a2f24'
const BOCA = '#7a3a35'
const PALITO = '#e6cc98'
const TINTA = '#2e5aa6'
const LAGRIMA = '#8fd0f5'
const ROSA = '#ff4f8b'      // acento saturado RESERVADO: o picolé de morango
const ROSA_CLARO = '#ff86ad'

const LIVROS = ['#7d3b36', '#3e5a6e', '#b08a3a', '#56684a', '#6b4f72', '#9a5b3a', '#3c4a63', '#8a7d5c']

const GY = 0.18          // topo do piso
const TOP = GY + 0.62    // tampo do balcão
const BZ = -0.18         // centro do balcão em z
const LX = -0.12         // bibliotecária
const LZ = -0.95
const LS = 1.32          // escala da bibliotecária
const BOOK: [number, number, number] = [0.58, TOP, -0.12]
const ARM_Z = 2.62       // braço erguido (pivô no ombro)
const ARM_X = 0.42

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base do diorama: assoalho de tábuas ----------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, '#2a1d14', { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const floor = cylinder(2.55, 2.62, 0.07, PISO, { roughness: 0.82 })
  floor.position.y = GY - 0.035
  base.add(floor)

  for (const z of [-2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1]) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - z * z, 0.01))
    const line = rbox(len, 0.02, 0.04, 0.008, PISO_LINHA, { roughness: 0.9 })
    line.position.set(0, GY + 0.002, z)
    base.add(line)
  }

  // tapetinho na frente do balcão
  const tapete = rbox(2.2, 0.025, 0.9, 0.012, '#5d6b5a', { roughness: 0.95 })
  tapete.position.set(0.05, GY + 0.012, 0.85)
  base.add(tapete)
  const barraTapete = rbox(2.0, 0.028, 0.7, 0.012, '#71806c', { roughness: 0.95 })
  barraTapete.position.set(0.05, GY + 0.014, 0.85)
  base.add(barraTapete)

  root.add(base)

  // ---- estante alta ao fundo -------------------------------------------------
  const estante = new THREE.Group()
  estante.position.set(0, 0, -1.72)
  root.add(estante)

  const EW = 3.1
  const EH = 2.15
  const ED = 0.42
  const fundo = rbox(EW, EH, 0.06, 0.02, ESTANTE_ESC, { roughness: 0.85 })
  fundo.position.set(0, GY + EH / 2, -ED / 2)
  estante.add(fundo)
  for (const side of [-1, 1]) {
    const lateral = rbox(0.1, EH + 0.04, ED, 0.025, ESTANTE, { roughness: 0.8 })
    lateral.position.set(side * (EW / 2), GY + EH / 2, 0)
    estante.add(lateral)
  }
  const coroa = rbox(EW + 0.22, 0.1, ED + 0.1, 0.03, ESTANTE, { roughness: 0.8 })
  coroa.position.set(0, GY + EH + 0.05, 0.02)
  estante.add(coroa)

  const SHELVES = [GY + 0.06, GY + 0.58, GY + 1.1, GY + 1.62]
  for (const sy of SHELVES) {
    const prat = rbox(EW, 0.06, ED, 0.02, ESTANTE, { roughness: 0.8 })
    prat.position.set(0, sy, 0)
    estante.add(prat)

    // fileira de livros: lombadas coloridas e apagadas
    let x = -EW / 2 + 0.1
    while (x < EW / 2 - 0.16) {
      const w = 0.07 + rand() * 0.06
      const h = 0.3 + rand() * 0.12
      const color = LIVROS[Math.floor(rand() * LIVROS.length)]
      if (rand() < 0.08) {
        // vão + livro deitado
        const deitado = rbox(0.34, 0.07, 0.26, 0.012, color, { roughness: 0.75 })
        deitado.position.set(x + 0.18, sy + 0.065, 0.02)
        estante.add(deitado)
        x += 0.4
        continue
      }
      const lomb = rbox(w, h, 0.28, 0.012, color, { roughness: 0.75 })
      const lean = rand() < 0.1 ? 0.18 : 0
      lomb.position.set(x + w / 2, sy + 0.03 + h / 2, 0.02)
      lomb.rotation.z = -lean
      estante.add(lomb)
      // frisos dourados na lombada
      if (rand() < 0.6) {
        for (const fy of [h * 0.32, -h * 0.32]) {
          const friso = rbox(w * 0.9, 0.014, 0.012, 0.005, OURO, { roughness: 0.4, metalness: 0.6 })
          friso.position.set(0, fy, 0.142)
          lomb.add(friso)
        }
      }
      x += w + 0.008 + (lean ? 0.05 : 0)
    }
  }

  // ---- balcão de atendimento ----------------------------------------------------
  const balcao = new THREE.Group()
  root.add(balcao)

  const tampo = rbox(3.0, 0.1, 0.78, 0.035, BALCAO, { roughness: 0.55 })
  tampo.position.set(0, TOP - 0.05, BZ)
  balcao.add(tampo)

  const PH = TOP - 0.1 - GY
  const frente = rbox(2.86, PH, 0.12, 0.03, BALCAO_ESC, { roughness: 0.7 })
  frente.position.set(0, GY + PH / 2, BZ + 0.3)
  balcao.add(frente)
  // almofadas (painéis) do frontal
  for (let i = 0; i < 4; i++) {
    const painel = rbox(0.58, PH - 0.2, 0.03, 0.02, BALCAO, { roughness: 0.6 })
    painel.position.set(-1.05 + i * 0.7, GY + PH / 2, BZ + 0.37)
    balcao.add(painel)
  }
  const rodape = rbox(2.92, 0.08, 0.18, 0.025, BALCAO_FRISO, { roughness: 0.75 })
  rodape.position.set(0, GY + 0.04, BZ + 0.31)
  balcao.add(rodape)
  const friso = rbox(2.92, 0.05, 0.16, 0.02, BALCAO_FRISO, { roughness: 0.75 })
  friso.position.set(0, TOP - 0.12, BZ + 0.31)
  balcao.add(friso)
  for (const side of [-1, 1]) {
    const lado = rbox(0.12, PH, 0.66, 0.03, BALCAO_ESC, { roughness: 0.7 })
    lado.position.set(side * 1.43, GY + PH / 2, BZ)
    balcao.add(lado)
  }

  // pilha de livros devolvidos no canto esquerdo
  for (const [i, color] of [LIVROS[1], LIVROS[3], LIVROS[0]].entries()) {
    const dev = rbox(0.42, 0.075, 0.3, 0.015, color, { roughness: 0.75 })
    dev.position.set(-1.12 + (rand() - 0.5) * 0.04, TOP + 0.038 + i * 0.075, BZ - 0.12)
    dev.rotation.y = 0.2 + (rand() - 0.5) * 0.25
    balcao.add(dev)
    const pg = rbox(0.4, 0.05, 0.27, 0.01, CREME, { roughness: 0.8 })
    pg.position.set(0.012, 0, 0.012)
    dev.add(pg)
  }

  // ---- livro raro aberto ---------------------------------------------------------
  const livro = new THREE.Group()
  livro.position.set(...BOOK)
  livro.rotation.y = -0.12
  root.add(livro)

  for (const side of [-1, 1]) {
    const capa = rbox(0.52, 0.03, 0.66, 0.012, CAPA, { roughness: 0.7 })
    capa.position.set(side * 0.265, 0.015, 0)
    capa.rotation.z = side * 0.04
    livro.add(capa)
    const folhas = rbox(0.49, 0.07, 0.62, 0.025, CREME, { roughness: 0.85 })
    folhas.position.set(side * 0.255, 0.065, 0)
    folhas.rotation.z = side * 0.06
    livro.add(folhas)
    // linhas de texto
    for (let k = 0; k < 7; k++) {
      const linha = rbox(0.34 - (k === 6 ? 0.14 : 0), 0.006, 0.018, 0.003, '#9b917e', { roughness: 0.9 })
      linha.position.set(-side * 0.0 + (k === 6 ? -0.07 : 0), 0.036, -0.23 + k * 0.07)
      folhas.add(linha)
    }
    // capitular dourada
    const cap = rbox(0.05, 0.007, 0.05, 0.004, OURO, { roughness: 0.4, metalness: 0.5 })
    cap.position.set(-0.17, 0.037, -0.23)
    folhas.add(cap)
  }
  const lombada = cylinder(0.03, 0.03, 0.66, CAPA, { roughness: 0.7 })
  lombada.rotation.x = Math.PI / 2
  lombada.position.y = 0.02
  livro.add(lombada)
  // fitinha marcadora dourada saindo da lombada, caída sobre a borda
  const fita = rbox(0.03, 0.006, 0.12, 0.003, OURO, { roughness: 0.5 })
  fita.position.set(0.0, 0.105, 0.36)
  livro.add(fita)
  const fitaPonta = rbox(0.03, 0.09, 0.006, 0.003, OURO, { roughness: 0.5 })
  fitaPonta.position.set(0.0, 0.065, 0.42)
  livro.add(fitaPonta)

  // ---- carimbo + almofada de tinta azul ---------------------------------------------
  const carimbo = new THREE.Group()
  carimbo.position.set(-0.62, TOP, -0.02)
  carimbo.rotation.y = 0.35
  root.add(carimbo)

  const caixaTinta = rbox(0.3, 0.045, 0.2, 0.015, '#5b6168', { roughness: 0.35, metalness: 0.6 })
  caixaTinta.position.y = 0.0225
  carimbo.add(caixaTinta)
  const almofada = rbox(0.26, 0.02, 0.16, 0.012, TINTA, { roughness: 0.9 })
  almofada.position.y = 0.045
  carimbo.add(almofada)

  const sinete = new THREE.Group()
  sinete.position.set(0.3, 0, 0.04)
  carimbo.add(sinete)
  const borracha = rbox(0.13, 0.025, 0.09, 0.008, '#30343a', { roughness: 0.8 })
  borracha.position.y = 0.0125
  sinete.add(borracha)
  const bloco = rbox(0.14, 0.05, 0.1, 0.012, '#9a6b3e', { roughness: 0.6 })
  bloco.position.y = 0.05
  sinete.add(bloco)
  const cabo = lathe(
    [[0, 0], [0.025, 0], [0.022, 0.06], [0.03, 0.12], [0.05, 0.16], [0.045, 0.19], [0, 0.2]],
    '#7d4f2b',
    { roughness: 0.45 },
  )
  cabo.position.y = 0.075
  sinete.add(cabo)

  // ---- a bibliotecária ---------------------------------------------------------------
  const bibliotecaria = person({ body: CARDIGA, skin: PELE, height: 1.5, armAngle: 0.45 })
  bibliotecaria.position.set(LX, GY, LZ)
  bibliotecaria.scale.setScalar(LS)
  root.add(bibliotecaria)

  // blusa lilás no vão do casaquinho + botões
  const blusa = sphere(0.2, BLUSA, { roughness: 0.85 })
  blusa.scale.set(0.55, 1.05, 0.35)
  blusa.position.set(0, 0.6, 0.18)
  bibliotecaria.add(blusa)
  for (const by of [0.66, 0.56, 0.46]) {
    const botao = sphere(0.016, BRANCO, { roughness: 0.3 })
    botao.position.set(0, by, 0.25)
    bibliotecaria.add(botao)
  }
  // golinha branca: duas abas arredondadas
  for (const side of [-1, 1]) {
    const aba = cylinder(0.075, 0.075, 0.02, BRANCO, { roughness: 0.8 })
    aba.position.set(side * 0.06, 0.765, 0.19)
    aba.rotation.set(1.1, 0, side * 0.35)
    bibliotecaria.add(aba)
  }
  const gola = torus(0.12, 0.022, BRANCO, { roughness: 0.8 })
  gola.rotation.x = Math.PI / 2 - 0.2
  gola.position.set(0, 0.78, 0.04)
  bibliotecaria.add(gola)

  const head = bibliotecaria.getObjectByName('head') as THREE.Group
  head.rotation.z = -0.08

  // cabelo grisalho puxado + coque no alto
  const cabelo = sphere(0.3, CABELO, { roughness: 0.85 })
  cabelo.scale.set(1.03, 0.72, 1.0)
  cabelo.position.set(0, 0.085, -0.035)
  head.add(cabelo)
  const coque = sphere(0.13, CABELO, { roughness: 0.85 })
  coque.position.set(0, 0.33, -0.05)
  coque.scale.set(1, 0.85, 1)
  head.add(coque)
  const amarra = torus(0.1, 0.022, CABELO_ESC, { roughness: 0.8 })
  amarra.rotation.x = Math.PI / 2
  amarra.position.set(0, 0.255, -0.05)
  head.add(amarra)
  const lapis = cylinder(0.014, 0.014, 0.36, '#3f5a46', { roughness: 0.5 })
  lapis.position.set(0.02, 0.35, -0.05)
  lapis.rotation.set(0.2, 0, 1.15)
  head.add(lapis)
  const ponta = cone(0.014, 0.04, PALITO, { roughness: 0.6 })
  ponta.position.set(0, 0.2, 0)
  lapis.add(ponta)

  // olhos tristes: pálpebra caída por cima + sobrancelha com a ponta de dentro erguida
  for (const side of [-1, 1]) {
    const palpebra = sphere(0.068, PELE, { roughness: 0.6 })
    palpebra.scale.set(1.08, 0.6, 0.7)
    palpebra.position.set(side * 0.108, 0.07, 0.24)
    palpebra.rotation.z = -side * 0.35
    head.add(palpebra)

    const sobr = capsule(0.017, 0.08, CABELO_ESC, { roughness: 0.9 })
    sobr.position.set(side * 0.112, 0.15, 0.255)
    sobr.rotation.set(-0.25, 0, Math.PI / 2 - side * 0.42)
    head.add(sobr)
  }

  // óculos redondos de aro escuro
  const oculos = new THREE.Group()
  oculos.position.set(0, 0.035, 0.0)
  head.add(oculos)
  for (const side of [-1, 1]) {
    const aro = torus(0.074, 0.012, ARMACAO, { roughness: 0.35 })
    aro.position.set(side * 0.112, 0, 0.305)
    aro.rotation.y = side * 0.18
    oculos.add(aro)
    const haste = rbox(0.016, 0.016, 0.26, 0.006, ARMACAO, { roughness: 0.35 })
    haste.position.set(side * 0.26, 0.005, 0.16)
    haste.rotation.y = side * 0.32
    oculos.add(haste)
  }
  const ponte = rbox(0.06, 0.014, 0.014, 0.006, ARMACAO, { roughness: 0.35 })
  ponte.position.set(0, 0.012, 0.325)
  oculos.add(ponte)

  // correntinha dourada: das hastes até o peito, em U
  for (const side of [-1, 1]) {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.19, 0.0, 0.285),
      new THREE.Vector3(side * 0.25, -0.16, 0.24),
      new THREE.Vector3(side * 0.2, -0.36, 0.25),
      new THREE.Vector3(side * 0.09, -0.5, 0.29),
      new THREE.Vector3(0, -0.53, 0.3),
    ])
    const n = 22
    for (let i = 0; i <= n; i++) {
      if (side > 0 && i === n) continue
      const elo = sphere(0.011, OURO, { roughness: 0.3, metalness: 0.8 }, 10)
      elo.position.copy(curva.getPoint(i / n))
      oculos.add(elo)
    }
  }

  // boca: arco virado pra baixo (escala y -1 = sorriso, 1 = tristeza)
  const boca = new THREE.Group()
  boca.position.set(0, -0.16, 0.255)
  boca.rotation.x = 0.55
  head.add(boca)
  const arco = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 10, 24, Math.PI), mat(BOCA, { roughness: 0.5 }))
  arco.position.y = -0.03
  arco.castShadow = true
  boca.add(arco)

  // ---- lágrima azul grande escorrendo pela bochecha ----------------------------------
  const lagrima = new THREE.Group()
  lagrima.position.set(-0.178, -0.13, 0.245)
  head.add(lagrima)
  const gota = sphere(0.048, LAGRIMA, { roughness: 0.05 })
  lagrima.add(gota)
  const bico = cone(0.041, 0.085, LAGRIMA, { roughness: 0.05 })
  bico.position.y = 0.057
  lagrima.add(bico)
  const brilhoGota = sphere(0.011, '#ffffff', { roughness: 0.1 }, 8)
  brilhoGota.position.set(-0.016, 0.014, 0.042)
  lagrima.add(brilhoGota)
  const trilha = capsule(0.013, 0.07, LAGRIMA, { roughness: 0.05 })
  trilha.position.set(0.025, 0.12, -0.01)
  trilha.rotation.z = -0.25
  trilha.scale.z = 0.5
  lagrima.add(trilha)

  // ---- braço erguido com o palito VAZIO ----------------------------------------------
  const braco = bibliotecaria.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(braco, 1.5)
  braco.rotation.set(ARM_X, 0, ARM_Z)
  const mao = braco.children[0]

  const palito = new THREE.Group()
  palito.position.copy(mao.position)
  braco.add(palito)
  const haste = capsule(0.04, 0.3, PALITO, { roughness: 0.7 })
  haste.scale.z = 0.3
  haste.position.y = -0.2
  palito.add(haste)
  // ponta do palito: onde o picolé estava encaixado
  const tip = new THREE.Object3D()
  tip.position.y = -0.36
  palito.add(tip)

  // ---- picolé de morango (o acento) -----------------------------------------------
  const picole = new THREE.Group()
  root.add(picole)
  const barra = rbox(0.19, 0.32, 0.085, 0.045, ROSA, { roughness: 0.4 })
  picole.add(barra)
  for (let i = 0; i < 9; i++) {
    const pedaco = sphere(0.014, '#c8204e', { roughness: 0.5 }, 10)
    pedaco.position.set((rand() - 0.5) * 0.13, (rand() - 0.5) * 0.24, (rand() < 0.5 ? -1 : 1) * 0.043)
    pedaco.scale.z = 0.5
    picole.add(pedaco)
  }
  // derretendo: gotas escorrendo na ponta
  for (const [dx, len] of [[-0.05, 0.05], [0.04, 0.08]] as const) {
    const pingo = capsule(0.018, len, ROSA, { roughness: 0.3 })
    pingo.position.set(dx, -0.16 - len / 2, 0.01)
    picole.add(pingo)
  }

  // pose final: deitado de lado sobre a página da direita
  const PAGE_TOP = BOOK[1] + 0.1
  const PIC_FINAL = { x: BOOK[0] + 0.24, y: PAGE_TOP + 0.04, z: BOOK[2] + 0.02 }
  const PIC_ROT = { x: -Math.PI / 2, y: 0, z: 0.75 }
  picole.position.set(PIC_FINAL.x, PIC_FINAL.y, PIC_FINAL.z)
  picole.rotation.set(PIC_ROT.x, PIC_ROT.y, PIC_ROT.z)

  // pocinha rosa embaixo dele
  const poca = new THREE.Group()
  poca.position.set(PIC_FINAL.x - 0.02, PAGE_TOP + 0.002, PIC_FINAL.z + 0.03)
  root.add(poca)
  const disco = cylinder(0.2, 0.2, 0.014, ROSA_CLARO, { roughness: 0.15 })
  disco.scale.set(1.25, 1, 1)
  poca.add(disco)
  const respingo = cylinder(0.06, 0.06, 0.014, ROSA_CLARO, { roughness: 0.15 })
  respingo.position.set(0.27, 0, 0.12)
  poca.add(respingo)

  // de onde o picolé cai: encaixado na ponta do palito erguido
  root.updateMatrixWorld(true)
  const tipPos = new THREE.Vector3()
  tip.getWorldPosition(tipPos)
  const tipQ = new THREE.Quaternion()
  tip.getWorldQuaternion(tipQ)
  // o palito aponta para -y local do braço; o picolé aponta +y
  const dir = new THREE.Vector3(0, -1, 0).applyQuaternion(tipQ).normalize()
  const startPos = tipPos.clone().addScaledVector(dir, 0.1)
  const startQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  const startRot = new THREE.Euler().setFromQuaternion(startQ, 'XYZ')

  // ---- peças -------------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'biblioteca', object: base },
    { name: 'estante', group: 'biblioteca', object: estante },
    { name: 'balcao', group: 'balcao', object: balcao },
    { name: 'livro', group: 'balcao', object: livro },
    { name: 'carimbo', group: 'balcao', object: carimbo },
    { name: 'bibliotecaria', group: 'bibliotecaria', object: bibliotecaria },
    { name: 'braco', group: 'picole', object: braco },
    { name: 'palito', group: 'picole', object: palito },
    { name: 'picole', group: 'picole', object: picole },
    { name: 'poca', group: 'ploft', object: poca },
    { name: 'boca', group: 'ploft', object: boca },
    { name: 'lagrima', group: 'lagrima', object: lagrima },
  ]

  const S3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem ----------------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Biblioteca silenciosa: brota o piso de tábuas e a estante cheia de livros…',
    }),
    seq('estante-rise', 'estante', 0.25, 0.9, [riseFrom(0, 2.6)], { ease: 'easeOut' }),

    seq('balcao-rise', 'balcao', 1.5, 0.8, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: '…o balcão de atendimento, com um livro raro aberto e o carimbo.',
    }),
    seq('livro-abre', 'livro', 1.9, 0.6, [...S3(0.01, 1), ch('rotation.y', -1.2, -0.12)], { ease: 'easeOut' }),
    seq('carimbo-rise', 'carimbo', 2.1, 0.6, [riseFrom(TOP, 0.5)], { ease: 'easeOut' }),

    seq('bibliotecaria-rise', 'bibliotecaria', 3.0, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Atrás dele, a bibliotecária de coque e óculos de corrente…',
    }),
    seq('braco-ergue', 'braco', 4.1, 0.6, [ch('rotation.z', 0.35, ARM_Z), ch('rotation.x', 0, ARM_X)], {
      ease: 'easeOut',
      caption: '…ergue a única alegria do plantão: um picolé de morango.',
    }),
    seq('palito-aparece', 'palito', 4.1, 0.3, S3(0.01, 1), { ease: 'easeOut' }),
    seq('picole-aparece', 'picole', 4.55, 0.4, S3(0.01, 1), { ease: 'easeOut' }),

    // SHHHH! — ela se inclina e o picolé escorrega do palito
    seq('shhh-inclina', 'bibliotecaria', 5.6, 0.25, [ch('rotation.x', 0, 0.1)], {
      ease: 'easeOut',
      caption: 'Entra um leitor barulhento: SHHHH! — e o picolé escorrega do palito…',
    }),
    seq('shhh-volta', 'bibliotecaria', 5.85, 0.4, [ch('rotation.x', 0.1, 0)], { ease: 'easeInOut' }),
    seq(
      'picole-cai',
      'picole',
      5.8,
      0.7,
      [
        ch('position.x', startPos.x, PIC_FINAL.x),
        ch('position.y', startPos.y, PIC_FINAL.y),
        ch('position.z', startPos.z, PIC_FINAL.z),
        ch('rotation.x', startRot.x, PIC_ROT.x),
        ch('rotation.y', startRot.y, PIC_ROT.y),
        ch('rotation.z', startRot.z, PIC_ROT.z),
      ],
      { ease: 'easeIn' },
    ),
    seq('poca-espalha', 'poca', 6.5, 0.5, [ch('scale.x', 0.05, 1), ch('scale.z', 0.05, 1), ch('scale.y', 1, 1)], {
      ease: 'easeOut',
      caption: 'PLOFT! Cai inteirinho em cima do livro raro.',
    }),
    seq('boca-desaba', 'boca', 6.7, 0.5, [ch('scale.y', -1, 1)], { ease: 'easeInOut' }),

    seq('lagrima-brota', 'lagrima', 7.8, 0.6, [...S3(0.01, 1), ch('position.y', -0.06, -0.1)], {
      ease: 'easeOut',
      caption: 'Ela fica com o palito VAZIO no alto e funga: IÁÁ… É… picoLÉ… SEM picolé…',
    }),
    seq('lagrima-escorre', 'lagrima', 9.6, 0.9, [ch('position.y', -0.1, -0.13)], {
      ease: 'easeInOut',
      caption: 'Jag är ledsen. — Estou triste. / Sinto muito.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.2, 3.55], target: [0.12, 1.3, -0.5] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-ledsen',
    contexto:
      "Sentimentos: contando como você está depois de uma notícia ruim — com um amigo, com o parceiro, com o médico da vårdcentral ou a psicóloga. Também é o 'sinto muito' do atendimento: 'Jag är ledsen, men vi har stängt' (sinto muito, mas já fechamos). Quando ouvir isso no balcão, lá vem um 'não'.",
    fraseFonte: 'Estou triste. / Sinto muito.',
    fraseAlvo: 'Jag är ledsen.',
    pronuncia:
      "iá é LÉS-sen ('jag' = iá; 'är' = É aberto e curto; 'ledsen' com a força no LÉ, de É aberto e CURTO, e o D MUDO: fala-se 'lessen', tanto que muita gente escreve assim; o S é comprido, sibilado, segurado um instante; o -sen é fraquinho e termina num N de verdade, com a ponta da língua atrás dos dentes, nunca o 'sẽi' nasal do português)",
    ponteSonora:
      "IÁÁ... É... (pico)LÉ SEM! (4 sílabas: iá-é-LÉS-sen; a força TODA no LÉ; IÁ É = o 'jag är' de sempre, o MESMO de 'Jag är trött', 'Jag är klar' e 'Jag är orolig', aqui o fungado de choro: I de IOGA, nunca J chiado, e É aberto e curto; LÉ = o fim de picoLÉ, que o português já fala com o É ABERTO e com a força no lugar certo, só que CURTO: o S do SEM gruda nele e se estica, LÉS-sen, S de cobra comprido; o D de 'ledsen' é MUDO, ninguém fala 'léd'; SEM = 'sem', fraquinho, mas terminando num N DE VERDADE, com a ponta da língua atrás dos dentes, nunca o 'sẽi' nasal do português; e é LÉ aberto, não o LÊ de bico do pombo de 'lösenord' (LÊ SEM ORDEM): lá é Ö, aqui é E aberto e sem bico)",
    historia:
      "Na biblioteca silenciosa, a bibliotecária de coque e óculos de corrente esconde atrás do balcão a única alegria do plantão: um picolé de morango. Entra um leitor barulhento e ela se ergue pra soltar um 'SHHHH!' tão forte que o picolé inteiro escorrega do palito e cai, PLOFT, em cima do livro raro aberto no balcão. Ela fica ali, segurando só o palito no alto, e funga: 'IÁÁ... É... picoLÉ... SEM picolé...'. Uma lágrima do tamanho de uma uva pinga na almofada de carimbo. Nunca se viu bibliotecária mais triste: ledsen.",
  },
  createScene,
}

export default card
