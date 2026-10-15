import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  capsule,
  ch,
  cone,
  cylinder,
  lathe,
  mat,
  person,
  puff,
  rbox,
  riseFrom,
  rng,
  seq,
  shoulderPivot,
  sphere,
  torus,
} from '../rig/helpers'

/**
 * jag-förstår-vad-du-menar — "Entendo o que você quer dizer."
 * Diorama: baia de escritório sobre carpete grafite. O GAMBÁ de camisa e
 * gravata senta na cadeira giratória com o rabo listrado em pé soltando
 * cheiro; por cima da divisória verde-musgo, o colega sueco espia com um
 * PRENDEDOR no nariz ("O MÊU NAR…"). Sobre a mesa, o peso de papel — o
 * martelo do THOR — dispara o MESMO feixe dourado de runas das cartas
 * "Jag förstår" e "Ursäkta, jag förstår inte", e o feixe ENTRA e FICA na
 * testa: a listra branca acende. Pata no peito, ele aponta o colega.
 *
 * Paleta: carpete grafite, mesa branca, divisória verde-musgo, cadeira
 * cinza, gambá preto-quente com camisa branca. Acento ouro (#f2a93b)
 * reservado ao feixe + listra acesa (mesmas cores das cartas-irmãs);
 * gravata vermelha queimada e cheiro verde-amarelado ficam secundários.
 */
const OURO = '#f2a93b'
const OURO_CLARO = '#f7c948'
const RUNA = '#d97b29'
const CARPETE = '#4b5058'
const CARPETE_ESC = '#3f434a'
const BRANCO_MESA = '#ebe8e2'
const ALUMINIO = '#a9afb6'
const MUSGO = '#5f7048'
const MUSGO_ESC = '#4f5e3b'
const CINZA_CADEIRA = '#6f757e'
const CINZA_ESC = '#3a3e45'
const PRETO = '#26232a' // pelo do gambá: preto quente, não chapado
const LISTRA = '#f1eee6'
const CAMISA = '#f4f5f2'
const GRAVATA = '#b23a30'
const PELE = '#e9c7a0'
const NARIZ = '#e3868a'
const MADEIRA_CLARA = '#cf9e5e'
const CHEIRO = '#b9cc4c'

const GY = 0.14 // topo do carpete
const SEAT = 0.44 // altura do assento acima do carpete
const MESA_H = 0.72

/** Cápsula entre dois pontos — braços, antebraços, listras. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts: MatOpts = { roughness: 0.9 }) {
  const len = a.distanceTo(b)
  const m = capsule(r, Math.max(0.001, len), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return m
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(5170)

  // ─── base: carpete grafite em placas ───────────────────────────────────
  const base = new THREE.Group()
  const piso = cylinder(2.6, 2.66, 0.14, CARPETE, { roughness: 0.95 })
  piso.position.y = 0.07
  base.add(piso)
  for (let i = -3; i <= 3; i++) {
    // juntas das placas de carpete
    const meia = Math.sqrt(Math.max(0, 2.5 * 2.5 - (i * 0.7) ** 2))
    const jx = rbox(meia * 2, 0.008, 0.025, 0.004, CARPETE_ESC, { roughness: 0.95 })
    jx.position.set(0, GY + 0.002, i * 0.7)
    base.add(jx)
    const jz = rbox(0.025, 0.008, meia * 2, 0.004, CARPETE_ESC, { roughness: 0.95 })
    jz.position.set(i * 0.7, GY + 0.002, 0)
    base.add(jz)
  }
  const borda = torus(2.6, 0.04, '#33363c', { roughness: 0.6 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = GY - 0.01
  base.add(borda)
  root.add(base)

  // ─── mesa branca com monitor, teclado e caneca ─────────────────────────
  const mesa = new THREE.Group()
  const tampo = rbox(1.25, 0.05, 0.68, 0.02, BRANCO_MESA, { roughness: 0.4 })
  tampo.position.y = MESA_H - 0.025
  mesa.add(tampo)
  for (const sx of [-1, 1]) {
    // pés em C de alumínio
    const perna = rbox(0.05, MESA_H - 0.05, 0.05, 0.015, ALUMINIO, { roughness: 0.35, metalness: 0.6 })
    perna.position.set(sx * 0.56, (MESA_H - 0.05) / 2, 0)
    mesa.add(perna)
    const sapata = rbox(0.06, 0.03, 0.6, 0.012, ALUMINIO, { roughness: 0.35, metalness: 0.6 })
    sapata.position.set(sx * 0.56, 0.015, 0)
    mesa.add(sapata)
  }
  const travessa = rbox(1.1, 0.06, 0.03, 0.012, ALUMINIO, { roughness: 0.35, metalness: 0.6 })
  travessa.position.set(0, MESA_H - 0.12, -0.25)
  mesa.add(travessa)

  // monitor preto no fundo da mesa
  const monitor = new THREE.Group()
  const pe = rbox(0.24, 0.02, 0.16, 0.008, '#22252b', { roughness: 0.4 })
  pe.position.y = 0.01
  monitor.add(pe)
  const haste = rbox(0.05, 0.22, 0.03, 0.01, '#22252b', { roughness: 0.4 })
  haste.position.set(0, 0.12, -0.04)
  monitor.add(haste)
  const tela = rbox(0.66, 0.4, 0.04, 0.015, '#1b1d22', { roughness: 0.35 })
  tela.position.set(0, 0.42, -0.02)
  monitor.add(tela)
  const vidroTela = rbox(0.61, 0.35, 0.01, 0.004, '#2f4560', { roughness: 0.15 })
  vidroTela.position.set(0, 0.425, 0.002)
  monitor.add(vidroTela)
  // janelinhas na tela (planilha aberta)
  for (const [x, y, w, h, c] of [
    [-0.13, 0.47, 0.3, 0.16, '#d9e2ec'],
    [0.16, 0.5, 0.2, 0.1, '#9fb7cf'],
    [0.12, 0.36, 0.26, 0.09, '#c4d3e1'],
  ] as const) {
    const jan = rbox(w, h, 0.006, 0.003, c, { roughness: 0.3 })
    jan.position.set(x, y, 0.008)
    monitor.add(jan)
  }
  const postit = rbox(0.08, 0.08, 0.008, 0.002, '#f29bb4', { roughness: 0.8 })
  postit.position.set(0.3, 0.6, 0.008)
  postit.rotation.z = 0.12
  monitor.add(postit)
  monitor.position.set(-0.12, MESA_H, -0.18)
  monitor.rotation.y = 0.25
  mesa.add(monitor)

  const teclado = rbox(0.44, 0.025, 0.15, 0.01, '#d5d7da', { roughness: 0.5 })
  teclado.position.set(-0.12, MESA_H + 0.0125, 0.12)
  teclado.rotation.y = 0.2
  mesa.add(teclado)
  for (let i = 0; i < 3; i++) {
    const fileira = rbox(0.39, 0.01, 0.025, 0.004, '#b4b8bd', { roughness: 0.5 })
    fileira.position.set(0, 0.016, -0.045 + i * 0.045)
    teclado.add(fileira)
  }

  const caneca = lathe(
    [[0, 0], [0.055, 0], [0.06, 0.01], [0.06, 0.12], [0.052, 0.12], [0.052, 0.015], [0, 0.015]],
    '#4f7fa8',
    { roughness: 0.35 },
  )
  caneca.position.set(-0.47, MESA_H, 0.15)
  mesa.add(caneca)
  const asa = torus(0.035, 0.01, '#4f7fa8', { roughness: 0.35 })
  asa.position.set(-0.53, MESA_H + 0.065, 0.15)
  mesa.add(asa)
  const cafe = cylinder(0.05, 0.05, 0.005, '#4a2e1c', { roughness: 0.2 })
  cafe.position.set(-0.47, MESA_H + 0.1, 0.15)
  mesa.add(cafe)

  mesa.position.set(-1.38, GY, 0.0)
  mesa.rotation.y = 0.42
  root.add(mesa)

  // ─── divisória da baia (verde-musgo) — o colega mora atrás dela ────────
  const divisoria = new THREE.Group()
  const DW = 1.7
  const DH = 0.98
  const painel = rbox(DW, DH - 0.06, 0.06, 0.02, MUSGO, { roughness: 0.95 })
  painel.position.y = 0.06 + (DH - 0.06) / 2
  divisoria.add(painel)
  const capa = rbox(DW + 0.04, 0.04, 0.085, 0.015, ALUMINIO, { roughness: 0.35, metalness: 0.6 })
  capa.position.y = DH
  divisoria.add(capa)
  for (const sx of [-1, 1]) {
    const montante = rbox(0.04, DH, 0.08, 0.012, ALUMINIO, { roughness: 0.35, metalness: 0.6 })
    montante.position.set((sx * DW) / 2, DH / 2, 0)
    divisoria.add(montante)
    const pezinho = rbox(0.07, 0.06, 0.36, 0.02, CINZA_ESC, { roughness: 0.5 })
    pezinho.position.set((sx * DW) / 2, 0.03, 0)
    divisoria.add(pezinho)
  }
  const costura = rbox(DW - 0.06, 0.012, 0.066, 0.004, MUSGO_ESC, { roughness: 0.95 })
  costura.position.y = 0.45
  divisoria.add(costura)
  // papéis pregados com tachinhas
  for (const [x, y, rot, c] of [
    [-0.42, 0.66, -0.06, '#f4f1e8'],
    [-0.1, 0.62, 0.08, '#e9eef3'],
  ] as const) {
    const papel = rbox(0.24, 0.3, 0.008, 0.003, c, { roughness: 0.8 })
    papel.position.set(x, y, 0.034)
    papel.rotation.z = rot
    divisoria.add(papel)
    for (let i = 0; i < 4; i++) {
      const linha = rbox(0.16, 0.012, 0.004, 0.002, '#9aa3ad', { roughness: 0.8 })
      linha.position.set(x - 0.01, y + 0.08 - i * 0.045, 0.04)
      linha.rotation.z = rot
      divisoria.add(linha)
    }
    const tacha = sphere(0.018, '#c7452f', { roughness: 0.3 })
    tacha.position.set(x + Math.sin(-rot) * 0.13, y + 0.13, 0.045)
    divisoria.add(tacha)
  }
  divisoria.position.set(1.36, GY, -0.74)
  divisoria.rotation.y = -0.5
  root.add(divisoria)

  // ─── colega sueco espiando por cima da divisória ───────────────────────
  const H_COL = 1.62
  const colega = person({ body: '#7d97b5', skin: PELE, height: H_COL, armAngle: 0.12 })
  const COL_Y = 0.15
  colega.position.set(0.1, COL_Y, -0.52)
  divisoria.add(colega)
  const cabCol = colega.getObjectByName('head')!
  const hR = H_COL * 0.19
  cabCol.rotation.y = -0.42 // vira o rosto para o gambá
  // cabelo loiro
  const cabelo = puff(hR * 0.7, '#d6b46a', 7, 77, { roughness: 0.85 })
  cabelo.position.set(0, hR * 0.58, -hR * 0.2)
  cabelo.scale.set(1.3, 0.62, 1.2)
  cabCol.add(cabelo)
  // olhos apertados de nojo: pálpebras de pele por cima e por baixo
  for (const side of [-1, 1]) {
    const cima = sphere(hR * 0.24, PELE, { roughness: 0.6 })
    cima.scale.set(1.05, 0.5, 0.7)
    cima.position.set(side * hR * 0.38, hR * 0.24, hR * 0.84)
    const baixo = sphere(hR * 0.24, PELE, { roughness: 0.6 })
    baixo.scale.set(1.05, 0.38, 0.7)
    baixo.position.set(side * hR * 0.38, hR * 0.0, hR * 0.84)
    const sobrancelha = capsule(hR * 0.05, hR * 0.32, '#b08a45', { roughness: 0.8 })
    sobrancelha.position.set(side * hR * 0.38, hR * 0.4, hR * 0.86)
    sobrancelha.rotation.z = Math.PI / 2 + side * 0.35
    cabCol.add(cima, baixo, sobrancelha)
  }
  const narizCol = sphere(hR * 0.2, NARIZ, { roughness: 0.45 })
  narizCol.scale.set(1, 0.9, 0.9)
  narizCol.position.set(0, -hR * 0.12, hR * 0.98)
  cabCol.add(narizCol)
  const bocaCol = capsule(hR * 0.05, hR * 0.22, '#7a3b36', { roughness: 0.6 })
  bocaCol.position.set(0, -hR * 0.45, hR * 0.9)
  bocaCol.rotation.z = Math.PI / 2 + 0.25
  cabCol.add(bocaCol)
  // mãos agarradas no topo da divisória (Kilroy esteve aqui)
  for (const nome of ['armL', 'armR']) {
    const braco = colega.getObjectByName(nome)!
    shoulderPivot(braco, H_COL)
    braco.rotation.x = -1.76
  }

  // ─── prendedor de roupa no nariz do colega ─────────────────────────────
  // duas hastes (mandíbula de cima e de baixo) abertas em volta do nariz e
  // a mola de aço no meio: de perfil, a silhueta clássica de prendedor
  const prendedor = new THREE.Group()
  for (const side of [-1, 1]) {
    const haste = rbox(0.05, 0.042, 0.32, 0.012, MADEIRA_CLARA, { roughness: 0.6 })
    haste.position.set(0, side * 0.048, 0.15)
    haste.rotation.x = side * 0.11
    prendedor.add(haste)
  }
  const eixo = cylinder(0.026, 0.026, 0.075, '#c9ced4', { roughness: 0.25, metalness: 0.8 })
  eixo.rotation.z = Math.PI / 2
  eixo.position.set(0, 0, 0.16)
  prendedor.add(eixo)
  for (const side of [-1, 1]) {
    const espira = torus(0.03, 0.008, '#c9ced4', { roughness: 0.25, metalness: 0.8 })
    espira.rotation.y = Math.PI / 2
    espira.position.set(side * 0.03, 0, 0.16)
    prendedor.add(espira)
  }
  prendedor.position.set(0, -hR * 0.12, hR * 1.02)
  prendedor.rotation.x = -0.1
  cabCol.add(prendedor)

  // ─── cadeira giratória cinza ───────────────────────────────────────────
  const cadeira = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3
    const pata = rbox(0.34, 0.04, 0.06, 0.018, CINZA_ESC, { roughness: 0.4 })
    pata.position.set(Math.cos(a) * 0.17, 0.07, Math.sin(a) * 0.17)
    pata.rotation.y = -a
    cadeira.add(pata)
    const rodinha = sphere(0.035, '#1f2226', { roughness: 0.35 })
    rodinha.position.set(Math.cos(a) * 0.33, 0.035, Math.sin(a) * 0.33)
    cadeira.add(rodinha)
  }
  const pistao = cylinder(0.035, 0.035, 0.28, '#8a9098', { roughness: 0.25, metalness: 0.8 })
  pistao.position.y = 0.22
  cadeira.add(pistao)
  const assento = rbox(0.58, 0.09, 0.54, 0.04, CINZA_CADEIRA, { roughness: 0.85 })
  assento.position.y = SEAT - 0.045
  cadeira.add(assento)
  const suporte = rbox(0.07, 0.42, 0.04, 0.015, CINZA_ESC, { roughness: 0.4 })
  suporte.position.set(0, SEAT + 0.12, -0.3)
  cadeira.add(suporte)
  const encosto = rbox(0.5, 0.5, 0.08, 0.05, CINZA_CADEIRA, { roughness: 0.85 })
  encosto.position.set(0, SEAT + 0.42, -0.33)
  encosto.rotation.x = -0.08
  cadeira.add(encosto)
  // capacete de bicicleta largado no chão: ele acabou de chegar pedalando
  const capacete = new THREE.Group()
  const casco = lathe(
    [[0, 0.17], [0.09, 0.16], [0.15, 0.12], [0.18, 0.06], [0.19, 0], [0.17, 0], [0.165, 0.05], [0.14, 0.1], [0.08, 0.14], [0, 0.15]],
    '#3d8c86',
    { roughness: 0.35 },
  )
  casco.scale.set(1, 1, 1.3)
  capacete.add(casco)
  for (const x of [-0.07, 0, 0.07]) {
    const respiro = rbox(0.03, 0.02, 0.22, 0.008, '#1f2226', { roughness: 0.5 })
    respiro.position.set(x, 0.155 - Math.abs(x) * 0.25, 0)
    respiro.rotation.z = -x * 2.2
    capacete.add(respiro)
  }
  const viseira = rbox(0.24, 0.015, 0.06, 0.006, '#1f2226', { roughness: 0.5 })
  viseira.position.set(0, 0.07, 0.25)
  viseira.rotation.x = 0.35
  capacete.add(viseira)
  const tira = torus(0.1, 0.008, '#1f2226', { roughness: 0.6 })
  tira.rotation.x = Math.PI / 2
  tira.scale.set(1, 1.4, 1)
  tira.position.set(0.05, 0.008, 0.02)
  capacete.add(tira)
  capacete.position.set(0.66, 0, 0.62)
  capacete.rotation.set(0.08, -0.9, 0.05)
  cadeira.add(capacete)

  const CHAIR_ROT = 0.3
  const CHAIR_POS = v(0.02, GY, 0.32)
  cadeira.position.copy(CHAIR_POS)
  cadeira.rotation.y = CHAIR_ROT
  root.add(cadeira)

  // ─── gambá sentado: camisa branca, gravata, pata no peito ──────────────
  // origem no topo do assento, olhando para o +z local
  const gamba = new THREE.Group()
  const quadril = sphere(0.27, PRETO, { roughness: 0.9 })
  quadril.scale.set(1.1, 0.62, 1.0)
  quadril.position.set(0, 0.13, -0.02)
  gamba.add(quadril)
  const tronco = capsule(0.24, 0.26, CAMISA, { roughness: 0.7 })
  tronco.scale.set(1.05, 1, 0.85)
  tronco.position.set(0, 0.47, -0.04)
  gamba.add(tronco)
  const pescoco = sphere(0.13, PRETO, { roughness: 0.9 })
  pescoco.position.set(0, 0.8, -0.03)
  gamba.add(pescoco)
  for (const side of [-1, 1]) {
    const coxa = limb(v(side * 0.14, 0.11, 0.0), v(side * 0.15, 0.08, 0.3), 0.115, PRETO)
    const canela = limb(v(side * 0.15, 0.04, 0.33), v(side * 0.15, -0.3, 0.38), 0.095, PRETO)
    const pe = sphere(0.1, PRETO, { roughness: 0.9 })
    pe.scale.set(0.85, 0.5, 1.4)
    pe.position.set(side * 0.15, -0.38, 0.45)
    gamba.add(coxa, canela, pe)
    // gola da camisa
    const gola = rbox(0.11, 0.06, 0.03, 0.012, CAMISA, { roughness: 0.7 })
    gola.position.set(side * 0.06, 0.74, 0.135)
    gola.rotation.set(-0.35, side * 0.35, side * 0.55)
    gamba.add(gola)
  }
  // gravata vermelha: nó + lâmina + ponta
  const no = rbox(0.07, 0.06, 0.05, 0.015, GRAVATA, { roughness: 0.55 })
  no.position.set(0, 0.7, 0.175)
  no.rotation.x = -0.3
  gamba.add(no)
  const lamina = rbox(0.085, 0.28, 0.025, 0.01, GRAVATA, { roughness: 0.55 })
  lamina.position.set(0, 0.53, 0.205)
  lamina.rotation.x = -0.12
  gamba.add(lamina)
  const ponta = cone(0.06, 0.06, GRAVATA, { roughness: 0.55 }, 4)
  ponta.rotation.set(Math.PI - 0.12, Math.PI / 4, 0)
  ponta.scale.set(1, 1, 0.3)
  ponta.position.set(0, 0.37, 0.222)
  gamba.add(ponta)
  // braço direito (lado -x): manga curta branca, antebraço preto, pata no peito
  const ombroD = v(-0.25, 0.68, -0.04)
  const cotoveloD = v(-0.31, 0.43, 0.1)
  const pulsoD = v(-0.14, 0.55, 0.23)
  gamba.add(limb(ombroD, ombroD.clone().lerp(cotoveloD, 0.55), 0.085, CAMISA, { roughness: 0.7 }))
  gamba.add(limb(ombroD.clone().lerp(cotoveloD, 0.4), cotoveloD, 0.065, PRETO))
  gamba.add(limb(cotoveloD, pulsoD, 0.06, PRETO))
  const maoPeito = sphere(0.075, PRETO, { roughness: 0.9 })
  maoPeito.scale.set(1.1, 0.85, 0.7)
  maoPeito.position.set(-0.1, 0.57, 0.24)
  gamba.add(maoPeito)
  // ombreira esquerda (o braço é a peça 'pata')
  const ombroE = v(0.25, 0.68, -0.04)
  const ombreira = sphere(0.09, CAMISA, { roughness: 0.7 })
  ombreira.position.copy(ombroE)
  gamba.add(ombreira)

  gamba.position.set(CHAIR_POS.x, GY + SEAT, CHAIR_POS.z)
  gamba.rotation.y = CHAIR_ROT
  root.add(gamba)

  // ─── cabeça do gambá: preta com listra branca da testa ao focinho ──────
  const cabeca = new THREE.Group()
  const R = 0.22
  const cranio = sphere(R, PRETO, { roughness: 0.9 })
  cranio.scale.set(1.05, 0.95, 1.0)
  cabeca.add(cranio)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.11, PRETO, { roughness: 0.9 })
    bochecha.position.set(side * 0.1, -0.08, 0.09)
    cabeca.add(bochecha)
    const orelha = sphere(0.065, PRETO, { roughness: 0.9 })
    orelha.scale.set(1, 1, 0.55)
    orelha.position.set(side * 0.15, 0.17, -0.03)
    cabeca.add(orelha)
    const interna = sphere(0.036, '#b98089', { roughness: 0.8 })
    interna.scale.set(1, 1, 0.4)
    interna.position.set(side * 0.15, 0.17, 0.0)
    cabeca.add(interna)
    const esclera = sphere(0.058, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.55
    esclera.position.set(side * 0.088, 0.035, 0.188)
    const pupila = sphere(0.028, '#141217', { roughness: 0.2 })
    pupila.position.set(side * 0.088 + 0.012, 0.042, 0.216)
    const brilhoOlho = sphere(0.009, '#ffffff', { roughness: 0.1 })
    brilhoOlho.position.set(side * 0.088 + 0.004, 0.056, 0.236)
    cabeca.add(esclera, pupila, brilhoOlho)
  }
  const focinho = sphere(0.1, PRETO, { roughness: 0.9 })
  focinho.scale.set(0.85, 0.7, 1.25)
  focinho.position.set(0, -0.07, 0.2)
  cabeca.add(focinho)
  const trufa = sphere(0.036, '#141217', { roughness: 0.3 })
  trufa.scale.set(1.2, 0.85, 0.9)
  trufa.position.set(0, -0.04, 0.325)
  cabeca.add(trufa)
  const boca = sphere(0.045, '#4a2228', { roughness: 0.5 })
  boca.scale.set(1.3, 0.75, 0.5)
  boca.position.set(0, -0.14, 0.255)
  cabeca.add(boca)
  // listra: arco de cápsulas sobre a cabeça até o focinho
  const arcoListra = (raio: number) => {
    const pts: THREE.Vector3[] = []
    for (const a of [-0.7, -0.2, 0.3, 0.75, 1.15]) {
      pts.push(v(0, Math.cos(a) * R * raio, Math.sin(a) * R * raio))
    }
    pts.push(v(0, 0.005, 0.27 * raio), v(0, -0.015, 0.305 * raio))
    return pts
  }
  const ptsListra = arcoListra(0.98)
  for (let i = 0; i < ptsListra.length - 1; i++) {
    const r = i < 4 ? 0.05 : 0.035
    const seg = limb(ptsListra[i], ptsListra[i + 1], r, LISTRA)
    seg.scale.x = 1.25
    cabeca.add(seg)
  }
  cabeca.position.set(0, 0.98, 0.0)
  cabeca.rotation.set(0, 0.12, -0.08)
  gamba.add(cabeca)

  // ─── luz: a listra acende por dentro + raios de abajur (acento ouro) ───
  const luz = new THREE.Group()
  const ptsLuz = arcoListra(1.02)
  for (let i = 0; i < ptsLuz.length - 1; i++) {
    const r = i < 4 ? 0.058 : 0.042
    const seg = limb(ptsLuz[i], ptsLuz[i + 1], r, OURO_CLARO, { emissive: '#ffb703', emissiveIntensity: 1.3 })
    seg.scale.x = 1.25
    luz.add(seg)
  }
  const nucleo = sphere(0.075, '#ffd25e', { emissive: '#ffb703', emissiveIntensity: 1.6 })
  nucleo.position.set(0, Math.cos(0.75) * R * 1.0, Math.sin(0.75) * R * 1.0)
  luz.add(nucleo)
  for (let i = 0; i < 9; i++) {
    const a = -0.3 + (i / 8) * (Math.PI + 0.6)
    const raio = rbox(0.04, 0.13, 0.04, 0.018, OURO_CLARO, { emissive: '#ffb703', emissiveIntensity: 1.1 })
    raio.position.set(Math.cos(a) * R * 1.8, Math.sin(a) * R * 1.8, 0.02)
    raio.rotation.z = a - Math.PI / 2
    luz.add(raio)
  }
  cabeca.add(luz)

  // ─── rabo enorme, peludo, preto com duas listras brancas ───────────────
  const rabo = new THREE.Group()
  const RABO0 = v(0.08, 0.12, -0.22)
  const espinha: [THREE.Vector3, number][] = [
    [v(0.08, 0.12, -0.22), 0.09],
    [v(0.18, 0.1, -0.42), 0.11],
    [v(0.26, 0.26, -0.6), 0.15],
    [v(0.3, 0.5, -0.68), 0.2],
    [v(0.33, 0.8, -0.68), 0.24],
    [v(0.38, 1.06, -0.62), 0.265],
    [v(0.48, 1.27, -0.53), 0.25],
    [v(0.62, 1.4, -0.46), 0.2],
    [v(0.76, 1.42, -0.43), 0.14],
    [v(0.86, 1.35, -0.43), 0.085],
  ]
  const noRabo = (p: THREE.Vector3) => p.clone().sub(RABO0)
  for (let i = 0; i < espinha.length; i++) {
    const [p, r] = espinha[i]
    const bola = sphere(r, PRETO, { roughness: 0.95 })
    bola.position.copy(noRabo(p))
    rabo.add(bola)
    if (i < espinha.length - 1) {
      const [q, r2] = espinha[i + 1]
      rabo.add(limb(noRabo(p), noRabo(q), Math.min(r, r2) * 0.95, PRETO, { roughness: 0.95 }))
    }
  }
  // duas listras brancas contínuas pela face do rabo que olha a câmera
  const frente = v(-0.3, 0.05, 0.95).normalize()
  for (const side of [-1, 1]) {
    const trilha: [THREE.Vector3, number][] = []
    for (let i = 2; i < espinha.length - 1; i++) {
      const [p, r] = espinha[i]
      trilha.push([noRabo(p).add(v(side * r * 0.44, 0, side * r * 0.13)).addScaledVector(frente, r * 0.74), r * 0.36])
    }
    for (let i = 0; i < trilha.length - 1; i++) {
      rabo.add(limb(trilha[i][0], trilha[i + 1][0], Math.min(trilha[i][1], trilha[i + 1][1]), LISTRA, { roughness: 0.95 }))
    }
  }
  // tufos de pelo no penacho
  for (let i = 0; i < 7; i++) {
    const [p, r] = espinha[4 + (i % 5)]
    const tufo = sphere(r * 0.55, PRETO, { roughness: 0.95 })
    tufo.position.copy(noRabo(p)).add(v((rand() - 0.5) * r * 1.3, (rand() - 0.1) * r * 0.9, -r * 0.55))
    rabo.add(tufo)
  }
  rabo.position.copy(RABO0)
  gamba.add(rabo)

  // ─── braço esquerdo apontando o colega (peça 'pata') ───────────────────
  const pata = new THREE.Group()
  pata.add(limb(v(0, 0, 0), v(0.2, 0, 0), 0.085, CAMISA, { roughness: 0.7 }))
  pata.add(limb(v(0.16, 0, 0), v(0.42, 0, 0), 0.062, PRETO))
  const palma = sphere(0.075, PRETO, { roughness: 0.9 })
  palma.scale.set(1.15, 0.85, 0.95)
  palma.position.set(0.48, 0, 0)
  pata.add(palma)
  const indicador = capsule(0.026, 0.11, PRETO, { roughness: 0.9 })
  indicador.rotation.z = -Math.PI / 2
  indicador.position.set(0.6, 0.01, 0.0)
  pata.add(indicador)
  for (let i = 0; i < 3; i++) {
    const dobrado = sphere(0.03, PRETO, { roughness: 0.9 })
    dobrado.position.set(0.53, -0.04, -0.035 + i * 0.035)
    pata.add(dobrado)
  }
  const polegar = capsule(0.024, 0.04, PRETO, { roughness: 0.9 })
  polegar.position.set(0.5, 0.05, 0.05)
  polegar.rotation.set(0.6, 0, -0.4)
  pata.add(polegar)
  pata.position.copy(ombroE)
  gamba.add(pata)

  // ─── martelo do Thor: peso de papel em pé sobre a mesa ─────────────────
  const martelo = new THREE.Group()
  const cabecote = rbox(0.42, 0.26, 0.26, 0.05, '#87909f', { roughness: 0.4, metalness: 0.65 })
  cabecote.position.y = 0.13
  martelo.add(cabecote)
  for (const lado of [-1, 1]) {
    const cinta = rbox(0.05, 0.28, 0.28, 0.02, '#5d6673', { roughness: 0.4, metalness: 0.6 })
    cinta.position.set(lado * 0.14, 0.13, 0)
    martelo.add(cinta)
  }
  const cabo = cylinder(0.04, 0.045, 0.42, '#8b5a2b', { roughness: 0.8 })
  cabo.position.y = 0.47
  martelo.add(cabo)
  for (let i = 0; i < 3; i++) {
    const tira = torus(0.045, 0.011, '#5a3a1d', { roughness: 0.85 })
    tira.rotation.x = Math.PI / 2
    tira.position.y = 0.52 + i * 0.05
    martelo.add(tira)
  }
  const pomo = sphere(0.055, '#6e4522', { roughness: 0.75 })
  pomo.position.y = 0.7
  martelo.add(pomo)
  martelo.scale.setScalar(0.95)
  const TOPO = GY + MESA_H
  mesa.updateMatrixWorld(true)
  const posMartelo = mesa.localToWorld(v(0.36, MESA_H, 0.12))
  martelo.position.set(posMartelo.x, TOPO, posMartelo.z)
  martelo.rotation.y = 0.15
  root.add(martelo)

  // ─── miras: colega (para o dedo) e testa (para o feixe) ────────────────
  // poses finais do braço apontando: calculadas a partir da cena montada
  root.updateMatrixWorld(true)
  const alvoColega = narizCol.localToWorld(v(0, 0.05, 0))
  const ombroMundo = gamba.localToWorld(ombroE.clone())
  const dirLocal = gamba
    .worldToLocal(alvoColega.clone())
    .sub(gamba.worldToLocal(ombroMundo.clone()))
  const PATA_AZ = Math.atan2(-dirLocal.z, dirLocal.x)
  const PATA_EL = Math.atan2(dirLocal.y, Math.hypot(dirLocal.x, dirLocal.z))
  const PATA_REPOUSO_Z = -1.35
  pata.rotation.set(0, PATA_AZ, PATA_EL)

  // ─── feixe de runas: do martelo até DENTRO da testa (acento ouro) ──────
  root.updateMatrixWorld(true)
  const alvo = nucleo.localToWorld(v(0, -0.02, -0.04))
  const centroMartelo = martelo.localToWorld(v(0, 0.13, 0))
  const dir = alvo.clone().sub(centroMartelo).normalize()
  const origem = centroMartelo.clone().addScaledVector(dir, 0.2)
  const delta = alvo.clone().sub(origem)
  const L = delta.length()
  const feixe = new THREE.Group()
  const anel = torus(0.13, 0.024, OURO_CLARO, { emissive: '#ffb703', emissiveIntensity: 1.0 })
  anel.rotation.y = Math.PI / 2
  anel.position.x = 0.04
  feixe.add(anel)
  const jato = cylinder(0.075, 0.075, L, OURO, { roughness: 0.3, emissive: '#ff9e00', emissiveIntensity: 1.1 })
  jato.rotation.z = -Math.PI / 2
  jato.position.x = L / 2
  feixe.add(jato)
  for (const k of [0.24, 0.5, 0.74]) {
    const runa = rbox(0.15, 0.15, 0.15, 0.03, RUNA, { emissive: '#b45309', emissiveIntensity: 0.9 })
    runa.rotation.x = Math.PI / 4
    runa.rotation.z = (rand() - 0.5) * 0.6
    runa.position.x = L * k
    feixe.add(runa)
  }
  feixe.position.copy(origem)
  feixe.rotation.order = 'YZX'
  feixe.rotation.y = -Math.atan2(delta.z, delta.x)
  feixe.rotation.z = Math.atan2(delta.y, Math.hypot(delta.x, delta.z))
  root.add(feixe)

  // ─── cheiro: três fitas onduladas subindo do rabo rumo ao colega ───────
  const cheiro = new THREE.Group()
  const pontaRabo = rabo.localToWorld(noRabo(espinha[8][0]))
  cheiro.position.copy(pontaRabo)
  // três ondas de desenho animado subindo da ponta do rabo, inclinadas
  // para o lado do colega (o cheiro vai direto pra baia dele)
  for (let f = 0; f < 3; f++) {
    const pts: THREE.Vector3[] = []
    const x0 = -0.14 + f * 0.15
    const altura = 0.42 + (f === 1 ? 0.08 : 0)
    for (let i = 0; i <= 16; i++) {
      const k = i / 16
      pts.push(v(x0 + k * 0.16 + Math.sin(k * Math.PI * 2.5 + f) * 0.05, 0.1 + k * altura, 0.04))
    }
    const fita = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.024, 8, false),
      mat(CHEIRO, { roughness: 0.55, size: 0.6 }),
    )
    fita.castShadow = true
    cheiro.add(fita)
  }
  root.add(cheiro)

  const parts = [
    { name: 'base', group: 'escritorio', object: base },
    { name: 'mesa', group: 'escritorio', object: mesa },
    { name: 'divisoria', group: 'escritorio', object: divisoria },
    { name: 'cadeira', group: 'gamba', object: cadeira },
    { name: 'gamba', group: 'gamba', object: gamba },
    { name: 'cabeca', group: 'gamba', object: cabeca },
    { name: 'pata', group: 'gamba', object: pata },
    { name: 'rabo', group: 'rabo', object: rabo },
    { name: 'cheiro', group: 'rabo', object: cheiro },
    { name: 'colega', group: 'colega', object: colega },
    { name: 'prendedor', group: 'prendedor', object: prendedor },
    { name: 'martelo', group: 'martelo', object: martelo },
    { name: 'feixe', group: 'feixe', object: feixe },
    { name: 'luz', group: 'luz', object: luz },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const GAMBA_Y = GY + SEAT

  const build = [
    // escritório
    seq('base-sobe', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Segunda de manhã, num escritório em Estocolmo: carpete, mesa, divisória da baia…',
    }),
    seq('mesa-sobe', 'mesa', 0.25, 0.75, [riseFrom(GY, 1.0)], { ease: 'easeOut' }),
    seq('divisoria-sobe', 'divisoria', 0.45, 0.75, [riseFrom(GY, 1.3)], { ease: 'easeOut' }),

    // o gambá chega e senta
    seq('cadeira-sobe', 'cadeira', 1.7, 0.6, [riseFrom(GY, 0.9)], {
      ease: 'easeOut',
      caption: 'Chega o GAMBÁ, suado da bicicleta, de camisa e gravata, e se joga na cadeira dele…',
    }),
    seq('gamba-senta', 'gamba', 2.0, 0.55, [ch('position.y', GAMBA_Y + 1.6, GAMBA_Y)], { ease: 'easeIn' }),
    seq('pata-repouso', 'pata', 2.0, 0.1, [ch('rotation.z', PATA_REPOUSO_Z, PATA_REPOUSO_Z), ch('rotation.y', 0, 0)]),
    seq('cabeca-chega', 'cabeca', 2.0, 0.55, [ch('position.y', 0.98, 0.98)]),
    seq('cabeca-afunda', 'cabeca', 2.55, 0.12, [ch('position.y', 0.98, 0.91)], { ease: 'easeOut' }),
    seq('cabeca-quica', 'cabeca', 2.67, 0.3, [ch('position.y', 0.91, 0.98)], { ease: 'easeOut' }),

    // rabo em pé + cheiro
    seq('rabo-ergue', 'rabo', 3.4, 0.8, [ch('rotation.x', -1.35, 0), ...s3(0.45, 1)], {
      ease: 'easeOut',
      caption: '…de rabo em pé — e o cheiro sobe pela baia inteira.',
    }),
    seq('cheiro-sobe', 'cheiro', 4.1, 0.8, s3(0.01, 1), { ease: 'easeOut' }),

    // colega espia
    seq('colega-espia', 'colega', 5.3, 0.7, [ch('position.y', COL_Y - 0.75, COL_Y)], {
      ease: 'easeOut',
      caption: 'O colega do lado não diz nada — é sueco. Só aparece por cima da divisória…',
    }),
    seq('prendedor-crava', 'prendedor', 6.3, 0.4, [...s3(0.01, 1), ch('rotation.z', 0.8, 0)], {
      ease: 'easeOut',
      caption: "…com um PRENDEDOR no nariz, e murmura fanho: 'O MÊU NAR…' — e trava antes do -IZ.",
    }),

    // martelo do Thor
    seq('martelo-cai', 'martelo', 8.0, 0.45, [ch('position.y', TOPO + 1.4, TOPO)], {
      ease: 'easeIn',
      caption: 'O gambá não pega a indireta. Na mesa, o peso de papel — o martelo do THOR — começa a zumbir…',
    }),
    seq('martelo-zumbe-1', 'martelo', 8.7, 0.14, [ch('rotation.z', 0, 0.09)]),
    seq('martelo-zumbe-2', 'martelo', 8.84, 0.14, [ch('rotation.z', 0.09, -0.09)]),
    seq('martelo-zumbe-3', 'martelo', 8.98, 0.14, [ch('rotation.z', -0.09, 0.07)]),
    seq('martelo-zumbe-4', 'martelo', 9.12, 0.14, [ch('rotation.z', 0.07, 0)]),

    // feixe entra e fica
    seq('feixe-dispara', 'feixe', 9.5, 0.55, [ch('scale.x', 0.02, 1)], {
      ease: 'easeOut',
      caption: '…e dispara um FEIXE dourado direto na testa dele: FEIXE-THOR!',
    }),
    seq('luz-acende', 'luz', 10.3, 0.5, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'O feixe ENTRA e FICA: a listra acende por dentro — agora ele entendeu.',
    }),

    // entendo o que você quer dizer
    seq('pata-aponta', 'pata', 11.4, 0.55, [ch('rotation.z', PATA_REPOUSO_Z, PATA_EL), ch('rotation.y', 0, PATA_AZ)], {
      ease: 'easeOut',
      caption: "Pata no peito, ele aponta o colega: 'IÁ… FEIXE-THOR! VÁ, DÜ… MÊU-NAR(iz)!'",
    }),
    seq('luz-pulsa', 'luz', 12.4, 0.6, s3(1.18, 1), {
      caption: 'Jag förstår vad du menar. — Entendo o que você quer dizer.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 1.9, 4.75], target: [0.08, 1.2, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-forstar-vad-du-menar',
    contexto:
      "Trabalho: em reunião, quando um colega explica um problema ou um ponto de vista; numa conversa difícil, para mostrar empatia antes de discordar ('Jag förstår vad du menar, men...').",
    fraseFonte: 'Entendo o que você quer dizer.',
    fraseAlvo: 'Jag förstår vad du menar.',
    pronuncia:
      "iá fesh-TÔR va dü MÊÊ-nar ('förstår' é o mesmo de 'Jag förstår': o 'rs' vira CH, força no TÔR, com Ô FECHADO e o R audível; 'vad' perde o d e fica VÁ; 'du' com Ü de bico; 'menar' com Ê FECHADO e LONGO e a força nele, e o -nar fraquinho com R brando — sem o R vira 'mena', o infinitivo)",
    ponteSonora:
      "IÁ... FEIXE-THOR! VÁ, DÜ... MÊU-NAR(iz)! (7 sílabas: iá-fesh-TÔR-va-dü-MÊÊ-nar; tônicas em TÔR e MÊ; IÁ = 'jag', I de IOGA; FEIXE-THOR é o MESMO âncora de 'Jag förstår' e 'Ursäkta, jag förstår inte' — e aqui o feixe do martelo ENTRA e FICA na cabeça (entendeu): FEIXE emendado no THOR sai fesh-TÔR, o X de FEIXE é o chiado do 'rs', sem o -e final; THOR com Ô FECHADO de 'avô' e R brando audível — sem ele sobra 'förstå', o infinitivo; VÁ é o MESMO 'vad' de 'VÁ, ASSADO?!' e 'VÁ, CÜL!' — um grito SEM R (com R vira 'var', onde); DÜ com BICO DE PATO, o 'du' de CAN-DU; MÊU-NAR(iz) = o 'O MEU NARIZ...' fanho do colega, que trava antes do -IZ pra não ter que puxar ar; a FORÇA fica no MEU, e o português já faz isso sozinho: MEU é palavra forte e o NA de 'nariz' é fraco — é só não reacentuar no corte, MÊÊ-nar, nunca 'me-NAR'; o U do MEU quase some — estique o Ê, FECHADO e LONGO: MÊÊ; o -NAR é o MESMO NAR(iz) do SÁC-NAR de 'Jag saknar dig' (o -nar dos verbos), fraquinho, com o R de um toque só do meio de naRiz, nunca o RR de 'rua'; sem esse R sobra 'mena', o infinitivo; e não é o MÊ seco do MEDO de 'Vad jobbar du med?': aquele termina no MÊ, este tem NARIZ)",
    historia:
      "Segunda de manhã, o GAMBÁ chega ao escritório de bicicleta, suado e de rabo em pé, e senta na baia dele. O colega do lado não diz uma palavra — é sueco —: só aparece por cima da divisória com um PRENDEDOR DE ROUPA no nariz e murmura, fanho: 'O MEU NAR...' — e trava antes do -IZ, porque pra terminar teria que respirar. O gambá não pega a indireta até que o martelo do THOR, seu peso de papel, dispara um FEIXE dourado na testa dele — e o feixe FICA lá dentro, acendendo a cabeça listrada. Ele leva a pata ao peito, aponta o colega e diz: 'IÁ... FEIXE-THOR! VÁ, DÜ... MÊU NAR(iz)!' — entendo o que você quer dizer.",
  },
  createScene,
  refine: { organic: ['gamba', 'cabeca', 'rabo', 'pata'] },
}

export default card
