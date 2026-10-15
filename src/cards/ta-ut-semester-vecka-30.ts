import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Kan jag ta ut semester vecka 30?" — CAN-IÁ TÁ ÜT? CEM ÉSTER, VÉCA TRÉTI!
 *
 * Diorama: um pedaço de praia brotando no meio do escritório. Carimbo de
 * madeira sobre a almofada de tinta azul (CAN! IÁ!), arquivo de aço tombado
 * cuspindo uma fila de Esters de boia (CEM ÉSTER), a Ester da frente maior com
 * boia inflando na cintura, coqueiro, calendário escolar rasgado na areia e o
 * painel de semanas com a casa 30 acesa em amarelo (VÉCA TRÉTI).
 */

const ACO = '#6f7d8c'
const ACO_ESC = '#54606d'
const AREIA_COR = '#e3c68f'
const CORAL = '#d9614c'
const PELE = '#e8c39e'
const MADEIRA = '#7a5230'
const VERDE = '#3f8f52'
const TINTA = '#2f5fb8'
const PAPEL = '#f2ecdc'
const LARANJA = '#e07a3a'
const BRANCO = '#f2ece1'
const ESCURO = '#20242b'
const AMARELO = '#f5c518' // acento reservado: a casa 30 acesa

const GY = 0.18 // topo do piso do escritório
const SY = 0.29 // topo do tapete de areia
const CY = 0.21 // apoio do carimbo (sobre a almofada de tinta)

/** Anel de boia laranja com quatro faixas brancas. */
function boiaAnel(r: number, tube: number) {
  const g = new THREE.Group()
  const anel = torus(r, tube, LARANJA, { roughness: 0.45 })
  anel.rotation.x = Math.PI / 2
  g.add(anel)
  for (let i = 0; i < 4; i++) {
    const a = i * (Math.PI / 2) + Math.PI / 4
    const faixa = cylinder(tube * 1.14, tube * 1.14, tube * 1.6, BRANCO, { roughness: 0.5 })
    faixa.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
    faixa.rotation.z = Math.PI / 2
    faixa.rotation.y = Math.PI / 2 - a
    g.add(faixa)
  }
  return g
}

/** Uma Ester: person() coral com óculos escuros, cabelo e (opcional) boia. */
function ester(height: number, seed: number, comBoia: boolean) {
  const g = person({ body: CORAL, skin: PELE, height, armAngle: 0.55 })
  const headR = height * 0.19
  const head = g.getObjectByName('head')!

  const oculos = rbox(headR * 1.5, headR * 0.34, headR * 0.22, headR * 0.08, ESCURO, {
    roughness: 0.2,
    metalness: 0.35,
  })
  oculos.position.set(0, headR * 0.15, headR * 0.88)
  head.add(oculos)

  for (const side of [-1, 1]) {
    const haste = rbox(headR * 0.1, headR * 0.1, headR * 0.72, headR * 0.03, ESCURO, {
      roughness: 0.3,
    })
    haste.position.set(side * headR * 0.74, headR * 0.15, headR * 0.48)
    head.add(haste)
  }

  const cabelo = puff(headR * 0.7, '#3d2a1e', 5, seed, { roughness: 0.9 })
  cabelo.position.y = headR * 0.45
  cabelo.scale.set(1.06, 0.78, 1.0)
  head.add(cabelo)

  if (comBoia) {
    const b = boiaAnel(height * 0.23, height * 0.075)
    b.position.y = height * 0.3
    g.add(b)
  }

  // braço direito erguido: "aqui a gente BOIA!"
  const armR = g.getObjectByName('armR')!
  armR.rotation.z = 2.3
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(30)

  // ---- base: piso do escritório -------------------------------------------
  const base = new THREE.Group()

  const laje = cylinder(2.62, 2.72, 0.12, '#5f6672', { roughness: 0.95 })
  laje.position.y = 0.06
  base.add(laje)

  const carpete = cylinder(2.55, 2.62, 0.07, '#8d949c', { roughness: 0.92 })
  carpete.position.y = 0.145
  base.add(carpete)

  // almofada de tinta azul, exatamente sob o carimbo
  const almofada = cylinder(0.31, 0.29, 0.04, TINTA, { roughness: 0.28 })
  almofada.position.set(-1.15, GY + 0.02, 1.15)
  base.add(almofada)

  for (let i = 0; i < 4; i++) {
    const a = rand() * Math.PI * 2
    const d = 0.36 + rand() * 0.28
    const pingo = sphere(0.035 + rand() * 0.03, TINTA, { roughness: 0.28 })
    pingo.position.set(-1.15 + Math.cos(a) * d, GY + 0.012, 1.15 + Math.sin(a) * d)
    pingo.scale.y = 0.28
    base.add(pingo)
  }

  // papelada largada
  for (const [px, pz, pr] of [[-0.55, 1.6, 0.5], [-2.0, 0.55, -0.8]] as const) {
    const folha = rbox(0.34, 0.02, 0.44, 0.012, PAPEL, { roughness: 0.78 })
    folha.position.set(px, GY + 0.012, pz)
    folha.rotation.y = pr + (rand() - 0.5) * 0.3
    base.add(folha)
  }

  // vaso de escritório
  const vaso = lathe(
    [[0, 0], [0.17, 0], [0.19, 0.06], [0.155, 0.28], [0.175, 0.33], [0.15, 0.34], [0, 0.34]],
    '#a8613f',
    { roughness: 0.7 },
  )
  vaso.position.set(-1.95, GY, -1.5)
  base.add(vaso)

  const folhagem = puff(0.26, '#3f7d4a', 6, 31, { roughness: 0.9 })
  folhagem.position.set(-1.95, GY + 0.52, -1.5)
  base.add(folhagem)

  root.add(base)

  // ---- arquivo de aço tombado, gaveta cuspindo -----------------------------
  const arquivo = new THREE.Group()
  arquivo.position.set(-1.65, GY, -0.75)
  arquivo.rotation.y = -0.35

  const corpo = rbox(1.35, 0.82, 0.75, 0.07, ACO, { roughness: 0.32, metalness: 0.58 })
  corpo.position.y = 0.42
  arquivo.add(corpo)

  const fundo = rbox(0.07, 0.72, 0.68, 0.03, ACO_ESC, { roughness: 0.35, metalness: 0.55 })
  fundo.position.set(-0.7, 0.42, 0)
  arquivo.add(fundo)

  for (const sz of [-0.24, 0.24]) {
    const sulco = rbox(1.2, 0.03, 0.03, 0.012, ACO_ESC, { roughness: 0.4, metalness: 0.5 })
    sulco.position.set(-0.05, 0.83, sz)
    arquivo.add(sulco)
  }

  // gaveta aberta apontando para a praia
  const gaveta = rbox(0.6, 0.6, 0.62, 0.05, ACO_ESC, { roughness: 0.38, metalness: 0.52 })
  gaveta.position.set(0.9, 0.42, 0)
  arquivo.add(gaveta)

  const frente = rbox(0.09, 0.68, 0.7, 0.035, ACO, { roughness: 0.3, metalness: 0.6 })
  frente.position.set(1.22, 0.42, 0)
  arquivo.add(frente)

  const puxador = rbox(0.06, 0.07, 0.32, 0.025, '#c9cdd2', { roughness: 0.22, metalness: 0.85 })
  puxador.position.set(1.29, 0.42, 0)
  arquivo.add(puxador)

  const etiqueta = rbox(0.03, 0.11, 0.24, 0.012, PAPEL, { roughness: 0.7 })
  etiqueta.position.set(1.28, 0.6, 0)
  arquivo.add(etiqueta)

  for (const sx of [-0.42, 0.42]) {
    const pe = rbox(0.1, 0.07, 0.62, 0.025, ACO_ESC, { roughness: 0.35, metalness: 0.55 })
    pe.position.set(sx, 0.025, 0)
    arquivo.add(pe)
  }

  root.add(arquivo)

  // ---- carimbo de madeira --------------------------------------------------
  const carimbo = new THREE.Group()
  carimbo.position.set(-1.15, CY, 1.15)
  carimbo.rotation.y = 0.4

  const borracha = rbox(0.36, 0.11, 0.28, 0.03, '#39302a', { roughness: 0.85 })
  borracha.position.y = 0.055
  carimbo.add(borracha)

  const bordaTinta = rbox(0.34, 0.03, 0.26, 0.012, TINTA, { roughness: 0.3 })
  bordaTinta.position.y = 0.012
  carimbo.add(bordaTinta)

  const cabo = lathe(
    [
      [0, 0.11], [0.18, 0.11], [0.19, 0.17], [0.1, 0.23],
      [0.075, 0.4], [0.1, 0.47], [0.17, 0.55], [0.16, 0.63], [0, 0.65],
    ],
    MADEIRA,
    { roughness: 0.72 },
  )
  carimbo.add(cabo)

  const pomo = sphere(0.11, '#8f6238', { roughness: 0.68 })
  pomo.position.y = 0.66
  carimbo.add(pomo)

  root.add(carimbo)

  // ---- tapete de areia (a praia dentro do escritório) ----------------------
  const areia = new THREE.Group()
  areia.position.set(0.55, GY, 0.25)

  const duna = cylinder(1.5, 1.58, 0.11, AREIA_COR, { roughness: 0.95 })
  duna.position.y = 0.055
  areia.add(duna)

  const crista = cylinder(1.16, 1.24, 0.045, '#eed7a6', { roughness: 0.95 })
  crista.position.y = 0.125
  areia.add(crista)

  // calendário escolar rasgado ao meio: duas placas caídas
  for (const [cx, cz, cry, flip] of [[-0.62, 0.62, 0.55, -1], [-0.16, 0.9, -0.38, 1]] as const) {
    const metade = new THREE.Group()
    // borda de trás erguida (apoiada na crista da areia): a folha mostra a
    // face para a câmera em vez de sumir rente ao chão
    metade.position.set(cx, 0.235, cz)
    metade.rotation.x = 0.36
    metade.rotation.y = cry
    metade.rotation.z = (rand() - 0.5) * 0.06

    const placa = rbox(0.46, 0.026, 0.6, 0.012, PAPEL, { roughness: 0.78 })
    metade.add(placa)

    const cabecalho = rbox(0.46, 0.032, 0.13, 0.012, TINTA, { roughness: 0.4 })
    cabecalho.position.set(0, 0.012, -0.235)
    metade.add(cabecalho)

    for (let i = 0; i < 3; i++) {
      const linha = rbox(0.34, 0.022, 0.02, 0.008, '#b9c2c9', { roughness: 0.6 })
      linha.position.set(-0.03 * flip, 0.012, -0.03 + i * 0.14)
      metade.add(linha)
    }

    // borda rasgada: dentes irregulares na lateral do rasgo
    for (let i = 0; i < 5; i++) {
      const dente = rbox(0.07, 0.024, 0.1, 0.01, PAPEL, { roughness: 0.78 })
      dente.position.set(flip * (0.23 + rand() * 0.04), 0.001, -0.24 + i * 0.12)
      dente.rotation.y = (rand() - 0.5) * 0.5
      metade.add(dente)
    }
    areia.add(metade)
  }

  // conchas / seixos na areia
  for (const [sx, sz, sr, seed] of [[0.72, -0.55, 0.09, 41], [-0.95, -0.35, 0.07, 42]] as const) {
    const seixo = rock(sr, '#efe3cd', seed, { roughness: 0.8 })
    seixo.position.set(sx, 0.12 + sr * 0.4, sz)
    seixo.rotation.y = rand() * Math.PI
    areia.add(seixo)
  }

  root.add(areia)

  // ---- coqueiro ------------------------------------------------------------
  const coqueiro = new THREE.Group()
  coqueiro.position.set(1.65, GY, -0.85)

  const troncoG = new THREE.Group()
  troncoG.rotation.z = 0.22
  coqueiro.add(troncoG)

  const tronco = lathe(
    [[0.19, 0], [0.15, 0.4], [0.125, 0.85], [0.108, 1.3], [0.098, 1.62]],
    '#8a6239',
    { roughness: 0.85 },
  )
  troncoG.add(tronco)

  for (let i = 0; i < 5; i++) {
    const anel = torus(0.135 - i * 0.008, 0.02, '#6f4d2c', { roughness: 0.85 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = 0.22 + i * 0.3
    troncoG.add(anel)
  }

  const copa = new THREE.Group()
  copa.position.y = 1.62
  troncoG.add(copa)

  for (let i = 0; i < 6; i++) {
    const braco = new THREE.Group()
    braco.rotation.y = (i / 6) * Math.PI * 2 + 0.3
    const folha = capsule(0.1, 0.62, VERDE, { roughness: 0.82 })
    folha.scale.z = 0.34
    folha.position.set(0.34, 0.02, 0)
    folha.rotation.z = -1.3
    braco.add(folha)
    copa.add(braco)
  }

  const miolo = sphere(0.15, '#357844', { roughness: 0.85 })
  copa.add(miolo)

  for (const [kx, kz] of [[0.14, 0.1], [-0.05, -0.16]] as const) {
    const coco = sphere(0.095, '#5f4227', { roughness: 0.8 })
    coco.position.set(kx, -0.1, kz)
    copa.add(coco)
  }

  root.add(coqueiro)

  // ---- fila de Esters saindo da gaveta -------------------------------------
  const fila = new THREE.Group()
  fila.position.set(0.05, GY, -0.35)

  for (let i = 0; i < 4; i++) {
    const e = ester(1.04 + i * 0.03, 51 + i, true)
    e.position.set(-0.62 + i * 0.42, 0, -0.14 + Math.sin(i * 1.3) * 0.16)
    e.rotation.y = -0.2 + i * 0.13
    fila.add(e)
  }
  root.add(fila)

  // ---- Ester da frente, maior ---------------------------------------------
  const esterGrande = ester(1.55, 61, false)
  esterGrande.position.set(1.05, SY, 0.5)
  esterGrande.rotation.y = -0.28
  root.add(esterGrande)

  // ---- boia dela (infla na cintura) ---------------------------------------
  const boia = boiaAnel(0.36, 0.115)
  boia.position.set(1.05, SY + 0.47, 0.5)
  root.add(boia)

  // ---- painel de semanas ---------------------------------------------------
  const painel = new THREE.Group()
  painel.position.set(-0.15, GY, -1.85)
  painel.rotation.y = 0.12

  for (const sx of [-0.62, 0.62]) {
    const perna = rbox(0.09, 0.9, 0.09, 0.03, '#5a6570', { roughness: 0.32, metalness: 0.58 })
    perna.position.set(sx, 0.45, 0)
    painel.add(perna)

    const sapata = rbox(0.24, 0.05, 0.22, 0.02, ACO_ESC, { roughness: 0.35, metalness: 0.55 })
    sapata.position.set(sx, 0.025, 0)
    painel.add(sapata)
  }

  const moldura = rbox(1.78, 1.03, 0.06, 0.04, '#4d5a66', { roughness: 0.35, metalness: 0.55 })
  moldura.position.set(0, 1.3, -0.03)
  painel.add(moldura)

  const quadro = rbox(1.7, 0.95, 0.09, 0.05, '#e8e2d4', { roughness: 0.82 })
  quadro.position.set(0, 1.3, 0)
  painel.add(quadro)

  const faixaTopo = rbox(1.7, 0.16, 0.04, 0.02, TINTA, { roughness: 0.4 })
  faixaTopo.position.set(0, 1.68, 0.055)
  painel.add(faixaTopo)

  for (const dy of [0.2, -0.06, -0.32]) {
    for (const dx of [-0.6, -0.3, 0, 0.3, 0.6]) {
      if (dy === 0.2 && dx === 0.3) continue // a casa 30 é peça própria
      const casa = rbox(0.26, 0.2, 0.03, 0.015, '#ccd4d8', { roughness: 0.5 })
      casa.position.set(dx, 1.3 + dy, 0.06)
      painel.add(casa)
    }
  }
  root.add(painel)

  // ---- a casa 30 acesa (acento) -------------------------------------------
  const casa30 = new THREE.Group()
  casa30.position.set(0.157, GY + 1.5, -1.811)
  casa30.rotation.y = 0.12

  const luz = rbox(0.3, 0.24, 0.05, 0.02, AMARELO, {
    roughness: 0.4,
    emissive: AMARELO,
    emissiveIntensity: 1.2,
  })
  casa30.add(luz)

  const halo = rbox(0.38, 0.32, 0.02, 0.03, AMARELO, {
    roughness: 0.5,
    emissive: AMARELO,
    emissiveIntensity: 0.7,
  })
  halo.position.z = -0.02
  casa30.add(halo)

  const circulo = torus(0.19, 0.022, '#c94f3d', { roughness: 0.5 })
  circulo.position.z = 0.04
  circulo.scale.set(1, 0.82, 1)
  casa30.add(circulo)

  root.add(casa30)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'escritorio', object: base },
    { name: 'arquivo', group: 'escritorio', object: arquivo },
    { name: 'carimbo', group: 'carimbo', object: carimbo },
    { name: 'areia', group: 'praia', object: areia },
    { name: 'coqueiro', group: 'praia', object: coqueiro },
    { name: 'fila', group: 'esters', object: fila },
    { name: 'ester', group: 'esters', object: esterGrande },
    { name: 'boia', group: 'boia', object: boia },
    { name: 'painel', group: 'semana', object: painel },
    { name: 'casa30', group: 'semana', object: casa30 },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 1.15)], {
      caption: 'No escritório, você pede férias — e o chefe nem responde direito.',
    }),
    seq('arquivo-rise', 'arquivo', 0.18, 0.8, [riseFrom(GY, 1.3)]),

    seq('carimbo-rise', 'carimbo', 1.6, 0.7, [riseFrom(CY, 1.15)], {
      caption: 'Ele CARIMBA duas vezes na tinta azul: CAN! IÁ!',
    }),
    seq('carimbo-up1', 'carimbo', 2.45, 0.3, [ch('position.y', CY, 0.72)]),
    seq('carimbo-down1', 'carimbo', 2.75, 0.22, [ch('position.y', 0.72, CY)]),
    seq('carimbo-up2', 'carimbo', 2.97, 0.3, [ch('position.y', CY, 0.72)]),
    seq('carimbo-down2', 'carimbo', 3.27, 0.22, [ch('position.y', 0.72, CY)]),

    seq('areia-rise', 'areia', 3.6, 0.7, [riseFrom(GY, 0.7)], {
      caption: 'E já grita "TÁ, ÜT!" — uma PRAIA brota no meio do escritório.',
    }),
    seq('coqueiro-rise', 'coqueiro', 3.8, 0.85, [riseFrom(GY, 2.4)]),

    seq(
      'fila-out',
      'fila',
      5.4,
      0.85,
      [
        ch('position.x', -0.8, 0.05),
        ch('position.y', 0.6, GY),
        ch('position.z', -0.44, -0.35),
        ch('scale.x', 0.06, 1),
        ch('scale.y', 0.06, 1),
        ch('scale.z', 0.06, 1),
      ],
      { caption: 'A gaveta do arquivo dispara CEM ÉSTER de óculos escuros e boia.' },
    ),
    seq('arquivo-coice', 'arquivo', 5.45, 0.3, [ch('position.x', -1.65, -1.86)]),
    seq('arquivo-volta', 'arquivo', 5.75, 0.55, [ch('position.x', -1.86, -1.65)]),
    seq('ester-rise', 'ester', 5.6, 0.85, [riseFrom(SY, 2.1)]),

    seq(
      'boia-infla',
      'boia',
      7.4,
      0.7,
      [ch('scale.x', 0.02, 1), ch('scale.y', 0.02, 1), ch('scale.z', 0.02, 1)],
    ),
    seq('ester-pula', 'ester', 7.55, 0.35, [ch('position.y', SY, 0.4)]),
    seq('ester-cai', 'ester', 7.9, 0.4, [ch('position.y', 0.4, SY)]),

    seq('painel-rise', 'painel', 9.0, 0.85, [riseFrom(GY, 2.3)], {
      caption: 'A da frente BOIA — e no painel a casa 30 ACENDE: VÉCA TRÉTI!',
    }),
    seq(
      'casa30-acende',
      'casa30',
      9.25,
      0.65,
      [ch('scale.x', 0.02, 1), ch('scale.y', 0.02, 1), ch('scale.z', 0.02, 1)],
    ),

    seq('casa30-pulsa', 'casa30', 10.4, 0.5, [ch('scale.x', 1, 1.18), ch('scale.y', 1, 1.18)], {
      caption: 'Kan jag ta ut semester vecka 30? — "Posso tirar férias na semana 30?"',
    }),
    seq('casa30-assenta', 'casa30', 10.9, 0.55, [
      ch('scale.x', 1.18, 1),
      ch('scale.y', 1.18, 1),
    ]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 2.45, 4.8], target: [0.05, 0.85, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'ta-ut-semester-vecka-30',
    contexto: 'Conversa ou e-mail com o chefe no planejamento das férias de verão.',
    fraseFonte: 'Posso tirar férias na semana 30?',
    fraseAlvo: 'Kan jag ta ut semester vecka 30?',
    pronuncia:
      "kan iá ta ut se-MÉS-ter VÉK-ka TRÉT-ti ('semester' com E aberto no meio; 'trettio' na fala vira 'TRÉT-ti')",
    ponteSonora:
      "CAN-IÁ TÁ ÜT? CEM ÉSTER, VÉCA TRÉTI! (11 sílabas, uma por sílaba sueca; 'kan jag' = CAN-IÁ, o J sueco é I de ioga — nunca o J chiado de 'canja'; 'ta ut' = TÁ ÜT com Ü de bico; 'semester' = CEM ÉSTER com a tônica no ÉS e É bem aberto, e o CEM quase sem nasal; 'vecka' com K DURO; 'trettio' na fala vira TRÉTI, R brando)",
    historia:
      "Você pergunta se pode tirar férias e o chefe nem responde direito: carimba duas vezes — CAN! IÁ! — e já grita 'TÁ, ÜT!'. Nisso a gaveta do arquivo dispara CEM ÉSTER idênticas, todas de óculos escuros e boia na cintura, que ocupam a praia que brotou no meio do escritório. A Ester da frente rasga o calendário escolar ao meio: aqui ninguém ESTUDA, aqui a gente BOIA — VÉCA TRÉTI!",
  },
  createScene,
}

export default card
