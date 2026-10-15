import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vad betyder det?" — "VÁ, be-TÜ-der, DÊ!"
 *
 * Diorama: biblioteca minúscula sobre tapete vermelho. BETÜ, o ornitorrinco
 * bibliotecário de bico chato (o 'TÜ' = 'TU' com bico de pato), sobe da pilha
 * de dicionários, mastiga o papelzinho ilegível, engole — e a lanterna de
 * minerador na testa dele acende sozinha, projetando o significado na parede.
 */

const GY = 0.18 // topo da base do diorama
const BETU_S = 1.3 // escala do ornitorrinco (feixe e papel derivam dela)

// 3 matizes de base…
const WOOD = '#6e4a28'
const WOOD_DARK = '#5a3a22'
const WOOD_LIGHT = '#8a6a42'
const RUG = '#7e2e2e'
const RUG_MID = '#93413c'
const PAPER = '#e6dcc2'
const PAPER_LIGHT = '#efe7d2'
const SLATE = '#4a5a6b'
const FUR = '#7a5236'
const FUR_DARK = '#6a4630'
const BELLY = '#b98d5e'
// …e o acento saturado, reservado ao BICO do BETÜ
const BILL = '#f0801f'
const BILL_DARK = '#c9631a'
const GLOW = '#ffd166'
const INK = '#5a3d1c' // traço do desenho projetado

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base do diorama: assoalho + tapete + adereços -----------------------
  const base = new THREE.Group()

  const soil = cylinder(2.58, 2.68, 0.12, WOOD_DARK, { roughness: 0.92 })
  soil.position.y = 0.06
  base.add(soil)

  const floor = cylinder(2.52, 2.58, 0.07, WOOD_LIGHT, { roughness: 0.75 })
  floor.position.y = 0.145
  base.add(floor)

  // tábuas do assoalho (lâminas finas, radiais)
  for (let i = 0; i < 7; i++) {
    const pz = -1.8 + i * 0.6
    const plankLen = 2 * Math.sqrt(2.48 * 2.48 - pz * pz) - 0.06 // cabe no disco
    const plank = rbox(plankLen, 0.02, 0.016, 0.006, WOOD, { roughness: 0.8 })
    plank.position.set(0, GY + 0.001, pz)
    base.add(plank)
  }

  const rug = cylinder(1.55, 1.55, 0.05, RUG, { roughness: 0.95 })
  rug.position.set(-0.2, GY + 0.02, 0.3)
  base.add(rug)

  const rugRing = cylinder(1.22, 1.22, 0.052, RUG_MID, { roughness: 0.95 })
  rugRing.position.set(-0.2, GY + 0.026, 0.3)
  base.add(rugRing)

  const rugCore = cylinder(0.78, 0.78, 0.054, RUG, { roughness: 0.95 })
  rugCore.position.set(-0.2, GY + 0.032, 0.3)
  base.add(rugCore)

  // adereço 1: tinteiro com pena
  const inkpot = lathe(
    [[0, 0], [0.11, 0], [0.13, 0.05], [0.115, 0.12], [0.07, 0.15], [0.062, 0.18], [0, 0.18]],
    '#2f3b4a',
    { roughness: 0.18 },
  )
  inkpot.position.set(1.42, GY, 1.02)
  inkpot.rotation.y = rand() * Math.PI
  base.add(inkpot)

  const quill = capsule(0.014, 0.34, PAPER_LIGHT, { roughness: 0.85 })
  quill.position.set(1.42, GY + 0.34, 1.02)
  quill.rotation.set(0.26, 0, 0.34)
  base.add(quill)

  // adereço 2: dicionário caído de capa dura
  const fallen = new THREE.Group()
  fallen.position.set(-1.72, GY, -0.78)
  fallen.rotation.y = -0.5 + rand() * 0.4
  const fallenCover = rbox(0.62, 0.1, 0.46, 0.025, '#6b3a30', { roughness: 0.6 })
  fallenCover.position.y = 0.05
  const fallenPages = rbox(0.56, 0.07, 0.4, 0.015, PAPER, { roughness: 0.8 })
  fallenPages.position.y = 0.055
  fallen.add(fallenCover, fallenPages)
  base.add(fallen)

  // adereço 3: maço de folhas soltas
  const loose = new THREE.Group()
  loose.position.set(0.98, GY + 0.02, -0.62)
  loose.rotation.y = 0.4 + rand() * 0.5
  for (let i = 0; i < 3; i++) {
    const sheet = rbox(0.34, 0.014, 0.26, 0.006, PAPER_LIGHT, { roughness: 0.88 })
    sheet.position.set((rand() - 0.5) * 0.06, i * 0.014, (rand() - 0.5) * 0.06)
    sheet.rotation.y = (rand() - 0.5) * 0.5
    loose.add(sheet)
  }
  base.add(loose)

  // adereço 4: bolinha de pó de biblioteca
  const dust = puff(0.075, '#9a917f', 5, 41, { roughness: 0.95 })
  dust.position.set(-1.05, GY + 0.05, 1.62)
  base.add(dust)

  root.add(base)

  // ---- parede da biblioteca (onde o significado será projetado) ------------
  const parede = new THREE.Group()
  parede.position.set(1.35, GY, -0.95)
  parede.rotation.y = -0.62

  const panel = rbox(2.0, 2.5, 0.18, 0.05, '#cbbba2', { roughness: 0.9 })
  panel.position.y = 1.25
  parede.add(panel)

  const skirting = rbox(2.04, 0.16, 0.26, 0.04, WOOD, { roughness: 0.8 })
  skirting.position.set(0, 0.08, 0.02)
  parede.add(skirting)

  const cornice = rbox(2.04, 0.1, 0.24, 0.03, WOOD_LIGHT, { roughness: 0.8 })
  cornice.position.set(0, 2.45, 0.01)
  parede.add(cornice)

  // prateleirinha alta com três volumes
  const shelf = rbox(0.72, 0.06, 0.24, 0.02, WOOD, { roughness: 0.75 })
  shelf.position.set(-0.6, 2.02, 0.18)
  parede.add(shelf)

  const shelfColors = [SLATE, '#6b3a30', WOOD_LIGHT]
  for (let i = 0; i < 3; i++) {
    const vol = rbox(0.11, 0.32, 0.17, 0.02, shelfColors[i], { roughness: 0.6 })
    vol.position.set(-0.82 + i * 0.14, 2.21, 0.18)
    vol.rotation.z = i === 2 ? 0.22 : 0
    parede.add(vol)
  }

  // ---- projeção na parede: o SIGNIFICADO ------------------------------------
  const desenho = new THREE.Group()
  desenho.position.set(0, 1.35, 0.105)

  const pool = cylinder(0.6, 0.6, 0.03, '#fff0c4', {
    emissive: GLOW,
    emissiveIntensity: 1.1,
  })
  pool.rotation.x = Math.PI / 2
  desenho.add(pool)

  const halo = torus(0.63, 0.035, '#ffe6a8', { emissive: GLOW, emissiveIntensity: 0.9 })
  halo.position.z = 0.005
  desenho.add(halo)

  // pictograma da lâmpada = "entendi o que quer dizer"
  // contorno do bulbo (anel), não disco cheio: disco escuro lia como buraco
  const bulbGlass = torus(0.15, 0.03, INK, { roughness: 0.5 })
  bulbGlass.scale.z = 0.4
  bulbGlass.position.set(0, 0.08, 0.025)
  desenho.add(bulbGlass)
  // filamento: duas hastes em V dentro do bulbo
  for (const side of [-1, 1]) {
    const fil = rbox(0.022, 0.13, 0.03, 0.008, INK, { roughness: 0.5 })
    fil.position.set(side * 0.035, 0.04, 0.025)
    fil.rotation.z = side * 0.35
    desenho.add(fil)
  }

  const bulbNeck = rbox(0.12, 0.08, 0.05, 0.02, INK, { roughness: 0.5 })
  bulbNeck.position.set(0, -0.1, 0.025)
  desenho.add(bulbNeck)

  const bulbBase = rbox(0.1, 0.05, 0.05, 0.018, INK, { roughness: 0.5 })
  bulbBase.position.set(0, -0.17, 0.025)
  desenho.add(bulbBase)

  for (const a of [-1.0, -0.35, 0.35, 1.0]) {
    const spark = rbox(0.12, 0.032, 0.04, 0.014, INK, { roughness: 0.5 })
    spark.position.set(Math.sin(a) * 0.31, 0.09 + Math.cos(a) * 0.28, 0.025)
    spark.rotation.z = -a
    desenho.add(spark)
  }
  parede.add(desenho)
  root.add(parede)

  // ---- pilha de dicionários + um aberto em V --------------------------------
  const livros = new THREE.Group()
  livros.position.set(-0.72, GY, 0.18)

  const stackColors = ['#6b3a30', SLATE, '#5f6b4a', '#7a5236']
  for (let i = 0; i < 4; i++) {
    const book = new THREE.Group()
    book.position.y = 0.075 + i * 0.15
    book.rotation.y = (rand() - 0.5) * 0.34
    const cover = rbox(1.05, 0.15, 0.8, 0.03, stackColors[i], { roughness: 0.6 })
    const pages = rbox(0.99, 0.11, 0.74, 0.02, PAPER, { roughness: 0.85 })
    pages.position.x = 0.02
    const band = rbox(0.16, 0.155, 0.82, 0.02, WOOD_LIGHT, { roughness: 0.7 })
    band.position.x = -0.4
    book.add(cover, pages, band)
    livros.add(book)
  }

  // dicionário aberto em V ao lado da pilha
  const aberto = new THREE.Group()
  aberto.position.set(1.15, 0.02, 0.62)
  aberto.rotation.y = -0.55

  const abertoCover = rbox(0.98, 0.06, 0.74, 0.025, '#6b3a30', { roughness: 0.6 })
  abertoCover.position.y = 0.03
  aberto.add(abertoCover)

  for (const side of [-1, 1]) {
    const hinge = new THREE.Group()
    hinge.position.y = 0.06
    hinge.rotation.z = -side * 0.32 // bordas externas sobem: livro aberto em V
    const page = rbox(0.46, 0.05, 0.7, 0.02, PAPER_LIGHT, { roughness: 0.85 })
    page.position.x = side * -0.25
    hinge.add(page)
    for (let i = 0; i < 3; i++) {
      const line = rbox(0.3, 0.01, 0.022, 0.004, '#6b6257', { roughness: 0.8 })
      line.position.set(side * -0.25, 0.03, -0.18 + i * 0.18)
      hinge.add(line)
    }
    aberto.add(hinge)
  }
  livros.add(aberto)
  root.add(livros)

  // ---- BETÜ, o ornitorrinco bibliotecário ----------------------------------
  const betu = new THREE.Group()
  betu.position.set(-0.72, 0.78, 0.18)
  betu.rotation.y = 1.15 // olha para a parede (olhos em +z local)
  betu.scale.setScalar(BETU_S) // protagonista maior: lê de longe

  const body = capsule(0.23, 0.3, FUR, { roughness: 0.85 })
  body.rotation.x = Math.PI / 2
  body.position.set(0, 0.24, 0.02)
  betu.add(body)

  const belly = capsule(0.15, 0.22, BELLY, { roughness: 0.88 })
  belly.rotation.x = Math.PI / 2
  belly.position.set(0, 0.13, 0.05)
  belly.scale.set(1, 0.55, 1)
  betu.add(belly)

  const head = sphere(0.175, FUR, { roughness: 0.85 })
  head.scale.set(0.95, 0.92, 1)
  head.position.set(0, 0.33, 0.3)
  betu.add(head)

  // olhos: esclera achatada + pupila + oculinhos de bibliotecário
  for (const side of [-1, 1]) {
    const eye = sphere(0.042, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.085, 0.4, 0.415)
    eye.scale.z = 0.6
    const pupil = sphere(0.021, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.085, 0.4, 0.45)
    betu.add(eye, pupil)

    const lens = torus(0.058, 0.011, '#3f3a33', { roughness: 0.3, metalness: 0.6 })
    lens.position.set(side * 0.085, 0.4, 0.462)
    betu.add(lens)
  }
  const bridge = rbox(0.07, 0.012, 0.012, 0.005, '#3f3a33', { roughness: 0.3, metalness: 0.6 })
  bridge.position.set(0, 0.4, 0.462)
  betu.add(bridge)

  // bico chato: o acento laranja da cena
  const bicoSup = rbox(0.3, 0.055, 0.36, 0.025, BILL, { roughness: 0.45 })
  bicoSup.position.set(0, 0.295, 0.5)
  bicoSup.rotation.x = 0.05
  betu.add(bicoSup)

  for (const side of [-1, 1]) {
    const nostril = sphere(0.017, '#5a3a20', { roughness: 0.5 })
    nostril.position.set(side * 0.05, 0.322, 0.6)
    betu.add(nostril)
  }

  const bicoInf = new THREE.Group()
  bicoInf.position.set(0, 0.265, 0.345)
  bicoInf.rotation.x = 0.14 // pose final: bico entreaberto
  const bicoInfSlab = rbox(0.27, 0.05, 0.33, 0.022, BILL_DARK, { roughness: 0.5 })
  bicoInfSlab.position.z = 0.17
  bicoInf.add(bicoInfSlab)
  betu.add(bicoInf)

  // patas com membrana
  for (const [fx, fz, fr] of [[-1, 0.2, 0.3], [1, 0.2, -0.3], [-1, -0.16, 0.2], [1, -0.16, -0.2]] as const) {
    const foot = rbox(0.16, 0.045, 0.21, 0.02, BILL_DARK, { roughness: 0.6 })
    foot.position.set(fx * 0.2, 0.045, fz)
    foot.rotation.y = fr
    betu.add(foot)
  }

  // cauda-remo (dobradiça na base do corpo, telescopa para fora dele)
  const cauda = new THREE.Group()
  cauda.position.set(0, 0.24, -0.3)
  const paddle = rbox(0.3, 0.07, 0.42, 0.055, FUR_DARK, { roughness: 0.85 })
  paddle.position.set(0, -0.02, -0.21)
  paddle.rotation.x = -0.1
  cauda.add(paddle)
  betu.add(cauda)

  // lanterna de minerador na testa (dobradiça: desce por cima da cabeça)
  const lanterna = new THREE.Group()
  lanterna.position.set(0, 0.33, 0.3)

  const band = torus(0.178, 0.026, '#3a3028', { roughness: 0.9 })
  band.rotation.x = Math.PI / 2 - 0.12
  band.position.y = 0.07
  lanterna.add(band)

  const housing = cylinder(0.075, 0.085, 0.09, '#aeb4b8', { roughness: 0.22, metalness: 0.85 })
  housing.rotation.x = Math.PI / 2
  housing.position.set(0, 0.15, 0.14) // no alto da testa: não tampa os olhos
  lanterna.add(housing)

  const rim = torus(0.078, 0.016, '#8d949a', { roughness: 0.3, metalness: 0.7 })
  rim.position.set(0, 0.15, 0.185)
  lanterna.add(rim)

  const lens = cylinder(0.068, 0.068, 0.02, '#fff3c4', { emissive: GLOW, emissiveIntensity: 1.3 })
  lens.rotation.x = Math.PI / 2
  lens.position.set(0, 0.15, 0.2)
  lanterna.add(lens)
  betu.add(lanterna)

  root.add(betu)

  // ---- o papelzinho com a palavra incompreensível --------------------------
  const papel = new THREE.Group()
  papel.position.set(-0.056, 1.183, 0.477) // pose final: preso no bico
  papel.rotation.set(0.2, 1.15, 0.15)

  const sheet = rbox(0.3, 0.02, 0.24, 0.008, PAPER_LIGHT, { roughness: 0.88 })
  papel.add(sheet)
  const corner = rbox(0.12, 0.018, 0.1, 0.006, PAPER, { roughness: 0.88 })
  corner.position.set(0.12, 0.012, -0.1)
  corner.rotation.set(0.35, 0.3, 0.2)
  papel.add(corner)
  for (let i = 0; i < 3; i++) {
    const word = rbox(0.15 - i * 0.03, 0.008, 0.022, 0.003, '#4a453d', { roughness: 0.8 })
    word.position.set(-0.02 + i * 0.01, 0.014, -0.06 + i * 0.06)
    papel.add(word)
  }
  root.add(papel)

  // ---- o feixe da lanterna, mirado no centro da parede ---------------------
  const feixe = new THREE.Group()
  feixe.position.set(-0.127, 1.404, 0.445) // boca da lanterna, em coordenadas de mundo
  feixe.rotation.set(0, 0.747, 0.0652) // aponta para o centro da parede

  // cone de luz: raios em anel que acertam a BORDA do círculo projetado,
  // deixando o desenho do centro livre (antes os raios cobriam o desenho)
  const fan: [number, number][] = []
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2
    fan.push([Math.cos(a) * 0.235, Math.sin(a) * 0.235])
  }
  for (const [yaw, pitch] of fan) {
    const holder = new THREE.Group()
    holder.rotation.set(0, yaw, pitch)
    const ray = cylinder(0.045, 0.008, 1.97, '#ffefc0', { emissive: GLOW, emissiveIntensity: 1.0 })
    ray.rotation.z = -Math.PI / 2
    ray.position.x = 0.985
    // luz é translúcida e não faz sombra: o desenho aparece através do feixe
    const rayMat = ray.material as THREE.MeshStandardMaterial
    rayMat.transparent = true
    rayMat.opacity = 0.5
    rayMat.depthWrite = false
    ray.castShadow = false
    holder.add(ray)
    feixe.add(holder)
  }
  root.add(feixe)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'parede', group: 'cenario', object: parede },
    { name: 'livros', group: 'livros', object: livros },
    { name: 'betu', group: 'betu', object: betu },
    { name: 'bicoInf', group: 'betu', object: bicoInf },
    { name: 'cauda', group: 'betu', object: cauda },
    { name: 'lanterna', group: 'betu', object: lanterna },
    { name: 'papel', group: 'papel', object: papel },
    { name: 'feixe', group: 'luz', object: feixe },
    { name: 'desenho', group: 'luz', object: desenho },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.75)], {
      ease: 'easeOut',
      caption: 'Numa biblioteca minúscula brotam do chão o tapete vermelho, a parede e a pilha de dicionários…',
    }),
    seq('parede-rise', 'parede', 0.95, 0.9, [riseFrom(GY, 2.85)], { ease: 'easeOut' }),

    seq('livros-rise', 'livros', 2.4, 0.85, [riseFrom(GY, 1.1)], { ease: 'easeOut' }),

    seq('betu-rise', 'betu', 4.0, 0.9, [riseFrom(0.78, 1.7)], {
      ease: 'easeOut',
      caption:
        '…e de dentro dela sobe BETÜ, o ornitorrinco bibliotecário de bico chato ("TÜ" = "TU" com bico de pato).',
    }),
    seq('bico-abre', 'bicoInf', 4.15, 0.5, [ch('rotation.x', 0, 0.14)], { ease: 'easeOut' }),
    seq('cauda-telescopa', 'cauda', 4.35, 0.7, [ch('scale.z', 0.01, 1)], { ease: 'easeOut' }),
    seq('lanterna-desce', 'lanterna', 4.6, 0.7, [ch('rotation.x', -1.7, 0)], { ease: 'easeOut' }),

    seq('papel-rise', 'papel', 6.1, 0.7, [
      ch('position.x', 0.85, 0.85),
      ch('position.y', -0.385, 0.215),
      ch('position.z', 1.3, 1.3),
      ch('rotation.x', 0, 0),
      ch('rotation.z', 0.6, 0.6),
    ], {
      ease: 'easeOut',
      caption: 'Você mostra o papelzinho com a palavra incompreensível e grita: "VÁ, be-TÜ-der, DÊ!"',
    }),
    seq('papel-voa', 'papel', 7.0, 0.8, [
      ch('position.x', 0.85, -0.056),
      ch('position.y', 0.215, 1.183),
      ch('position.z', 1.3, 0.477),
      ch('rotation.x', 0, 0.2),
      ch('rotation.z', 0.6, 0.15),
    ]),

    seq('bico-mastiga-1', 'bicoInf', 7.9, 0.3, [ch('rotation.x', 0.14, -0.02)], {
      caption: 'BETÜ mastiga o papel… e engole.',
    }),
    seq('bico-mastiga-2', 'bicoInf', 8.2, 0.3, [ch('rotation.x', -0.02, 0.19)]),
    seq('bico-mastiga-3', 'bicoInf', 8.5, 0.35, [ch('rotation.x', 0.19, 0.03)]),
    seq('papel-engolido', 'papel', 8.5, 0.4, [
      ch('scale.x', 1, 0.01),
      ch('scale.y', 1, 0.01),
      ch('scale.z', 1, 0.01),
    ], { ease: 'easeIn' }),

    seq('cauda-abana-1', 'cauda', 8.9, 0.5, [ch('rotation.y', 0, 0.4)]),
    seq('cauda-abana-2', 'cauda', 9.4, 0.5, [ch('rotation.y', 0.4, -0.28)]),
    seq('cauda-assenta', 'cauda', 9.9, 0.5, [ch('rotation.y', -0.28, 0)], { ease: 'easeOut' }),

    seq('feixe-acende', 'feixe', 9.5, 0.7, [ch('scale.x', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'A lanterna de minerador na testa dele ACENDE sozinha…',
    }),

    seq('desenho-projeta', 'desenho', 10.5, 0.6, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: '…e projeta o significado na parede. Vad betyder det? — "O que isso significa?"',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.15, 2.25, 4.5], target: [0.4, 1.25, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-betyder-det',
    contexto:
      'Diante de uma placa, um e-mail do trabalho, uma carta da Skatteverket, ou quando alguém usa uma palavra que ele não pegou.',
    fraseFonte: 'O que isso significa?',
    fraseAlvo: 'Vad betyder det?',
    pronuncia: "va be-TÜ-der dê ('y' sueco = ü: lábios arredondados de 'u' com língua de 'i')",
    ponteSonora: "VÁ, be-TÜ-der, DÊ! ('TÜ' = 'TU' com bico de pato: lábios de U, língua de I)",
    historia:
      'Você mostra um papelzinho com uma palavra incompreensível e grita: "VÁ, BETÜ-DER, DÊ!". Betü é um ornitorrinco bibliotecário de bico chato. Ele mastiga o papel, engole, e a lanterna de minerador na testa dele acende sozinha, projetando o significado na parede.',
  },
  createScene,
  refine: { organic: ['betu', 'cauda'] },
}

export default card
