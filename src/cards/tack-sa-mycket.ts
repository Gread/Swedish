import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cylinder, sphere, seq, ch, riseFrom } from '../rig/helpers'

/**
 * tack-sa-mycket — "Tack så mycket!" (Muito obrigado!)
 * Cena: diante de uma porta entreaberta, uma mão dá um tapa (TAC!) no
 * bíceps vermelho gigante (MUQUE) do segurança bombado (SÔ MUQUE),
 * que estufa de orgulho.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ---------------------------------------------------------------- cenário
  // Calçada da entrada do prédio
  const calcada = box(4.6, 0.12, 2.6, '#c9ced6')
  calcada.position.set(0, 0.06, 0)
  root.add(calcada)

  // Batente da porta (dois montantes + travessa)
  const batente = new THREE.Group()
  const postEsq = box(0.14, 2.4, 0.18, '#5d3a1a')
  postEsq.position.set(-0.57, 1.2, 0)
  batente.add(postEsq)
  const postDir = box(0.14, 2.4, 0.18, '#5d3a1a')
  postDir.position.set(0.57, 1.2, 0)
  batente.add(postDir)
  const travessa = box(1.28, 0.16, 0.18, '#5d3a1a')
  travessa.position.set(0, 2.42, 0)
  batente.add(travessa)
  batente.position.set(-1.6, 0, -0.4)
  root.add(batente)

  // Folha da porta, pivotada na dobradiça (montante esquerdo), entreaberta
  const folha = new THREE.Group()
  const folhaPainel = box(1.0, 2.3, 0.09, '#8b5a2b')
  folhaPainel.position.set(0.5, 1.21, 0)
  folha.add(folhaPainel)
  const macaneta = sphere(0.06, '#ffd60a', 16)
  macaneta.position.set(0.88, 1.15, 0.1)
  folha.add(macaneta)
  folha.position.set(-2.1, 0, -0.4)
  folha.rotation.y = -0.85 // pose final: entreaberta, aberta em direção ao espectador
  root.add(folha)

  // ------------------------------------------------------------- segurança
  // Pernas plantadas firmes
  const pernas = cylinder(0.27, 0.31, 0.55, '#23232e')
  pernas.position.set(0.4, 0.4, 0)
  root.add(pernas)

  // Tronco/peitoral bombado
  const tronco = cylinder(0.45, 0.33, 0.85, '#1d1d27')
  tronco.position.set(0.4, 1.08, 0)
  root.add(tronco)

  // Cabeça orgulhosa
  const cabeca = sphere(0.3, '#f4c896')
  cabeca.position.set(0.4, 1.78, 0)
  root.add(cabeca)

  // Óculos escuros de segurança
  const oculos = box(0.52, 0.1, 0.14, '#101014')
  oculos.position.set(0.4, 1.83, 0.22)
  root.add(oculos)

  // ----------------------------------------------------------------- muque
  // Braço estendido (cilindro horizontal + punho fechado na ponta)
  const braco = new THREE.Group()
  const bracoCil = cylinder(0.13, 0.13, 0.95, '#1d1d27')
  bracoCil.rotation.z = Math.PI / 2
  braco.add(bracoCil)
  const punho = sphere(0.15, '#f4c896', 16)
  punho.position.set(0.55, 0, 0)
  braco.add(punho)
  braco.position.set(1.28, 1.3, 0)
  root.add(braco)

  // O MUQUE — bíceps vermelho gigante estufado sobre o braço
  const muque = sphere(0.42, '#e5383b')
  muque.position.set(1.42, 1.62, 0)
  root.add(muque)

  // ------------------------------------------------------------------ tapa
  // Mão do tapa (palma + polegar + manga verde de quem agradece)
  const mao = new THREE.Group()
  const palma = box(0.16, 0.44, 0.3, '#f4c896')
  mao.add(palma)
  const polegar = box(0.14, 0.16, 0.12, '#f4c896')
  polegar.position.set(-0.02, 0.16, 0.19)
  mao.add(polegar)
  const manga = cylinder(0.1, 0.1, 0.34, '#2a9d8f', 16)
  manga.rotation.z = Math.PI / 2
  manga.position.set(0.3, -0.06, 0)
  mao.add(manga)
  mao.position.set(1.95, 1.6, 0)
  root.add(mao)

  // Estrela do TAC! — explosão amarela no ponto do impacto
  const estrela = new THREE.Group()
  const raioA = box(0.5, 0.13, 0.06, '#ffd60a')
  estrela.add(raioA)
  const raioB = box(0.5, 0.13, 0.06, '#ffd60a')
  raioB.rotation.z = Math.PI / 3
  estrela.add(raioB)
  const raioC = box(0.5, 0.13, 0.06, '#ffd60a')
  raioC.rotation.z = -Math.PI / 3
  estrela.add(raioC)
  estrela.position.set(1.9, 2.05, 0.3)
  root.add(estrela)

  const parts = [
    { name: 'calcada', group: 'cenario', object: calcada },
    { name: 'batente', group: 'cenario', object: batente },
    { name: 'folha', group: 'cenario', object: folha },
    { name: 'pernas', group: 'seguranca', object: pernas },
    { name: 'tronco', group: 'seguranca', object: tronco },
    { name: 'cabeca', group: 'seguranca', object: cabeca },
    { name: 'oculos', group: 'seguranca', object: oculos },
    { name: 'braco', group: 'muque', object: braco },
    { name: 'muque', group: 'muque', object: muque },
    { name: 'mao', group: 'tapa', object: mao },
    { name: 'estrela', group: 'tapa', object: estrela },
  ]

  const build = [
    // --- cenário: calçada e porta entreaberta
    seq('calcada-rise', 'calcada', 0.0, 0.6, [riseFrom(0.06, 0.4)], {
      caption: 'Na entrada do prédio, a calçada surge…',
    }),
    seq('batente-rise', 'batente', 0.7, 0.75, [riseFrom(0, 2.7)]),
    seq('folha-rise', 'folha', 0.95, 0.75, [riseFrom(0, 2.6)]),
    seq('folha-abre', 'folha', 1.85, 0.8, [ch('rotation.y', 0, -0.85)], {
      caption: '…e a PORTA que o segurança segurou aberta pra você. Que gentileza!',
    }),

    // --- o SÔ MUQUE monta de baixo pra cima
    seq('pernas-rise', 'pernas', 2.9, 0.6, [riseFrom(0.4, 0.9)], {
      caption: 'É o SÔ MUQUE, o segurança bombado da portaria!',
    }),
    seq('tronco-rise', 'tronco', 3.15, 0.7, [ch('position.y', 0.35, 1.08)]),
    seq('cabeca-rise', 'cabeca', 3.45, 0.6, [ch('position.y', 1.05, 1.78)]),
    seq('oculos-sai', 'oculos', 3.75, 0.5, [ch('position.z', 0, 0.22)]),

    // --- o braço telescopa do tronco e o MUQUE estufa
    seq('braco-estende', 'braco', 4.9, 0.7, [ch('position.x', 0.55, 1.28)]),
    seq(
      'muque-cresce',
      'muque',
      5.7,
      0.7,
      [
        ch('scale.x', 0.12, 0.85),
        ch('scale.y', 0.12, 0.85),
        ch('scale.z', 0.12, 0.85),
        ch('position.y', 1.47, 1.62),
      ],
      { caption: 'No braço, cresce o MUQUE gigante — diga com bico: MÜ-que ("mycket")…' },
    ),

    // --- o tapa de agradecimento: TAC!
    seq('mao-rise', 'mao', 6.9, 0.7, [riseFrom(1.6, 2.1)]),
    seq('mao-tapa', 'mao', 8.0, 0.35, [ch('position.x', 2.35, 1.95)], {
      caption: 'Palavras não bastam: TAC! Um tapa sonoro no MUQUE! ("tack")',
    }),
    seq('estrela-pop', 'estrela', 8.2, 0.35, [
      ch('scale.x', 0.05, 1),
      ch('scale.y', 0.05, 1),
      ch('scale.z', 0.05, 1),
    ]),
    seq(
      'muque-estufa',
      'muque',
      8.6,
      0.6,
      [ch('scale.x', 0.85, 1), ch('scale.y', 0.85, 1), ch('scale.z', 0.85, 1)],
      { caption: 'O bíceps estufa de orgulho: TAC, SÔ, MÜ-QUE — Tack så mycket!' },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.7, 3.0, 6.3], target: [0.1, 1.1, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'tack-sa-mycket',
    contexto: 'Qualquer situação: caixa do mercado, colega que ajudou, vizinho que segurou a porta.',
    fraseFonte: 'Muito obrigado!',
    fraseAlvo: 'Tack så mycket!',
    pronuncia:
      "tak sô MÜ-que! (o 't' final de 'mycket' some na fala; 'y' é um 'i' com bico; 'så' com ô fechado longo)",
    ponteSonora:
      "tak sô MÜ-que ~ \"TAC, SÔ MUQUE!\" — o tapa sonoro TAC dá 'tack'; 'SÔ' (seu, à mineira) garante o ô fechado longo de 'så'; e MUQUE dito com bico ('müque') é 'mycket' sem o t final, exatamente como na fala. Nenhuma sílaba sobrando: TAC-SÔ-MÜ-QUE.",
    historia:
      "O SÔ MUQUE, segurança bombado da portaria, segurou a porta aberta pra você. Palavras não bastam pra tanta gentileza: você agradece dando um tapa sonoro — TAC! — no MUQUE gigante dele. Diga 'muque' com bico ('müque') e o bíceps estufa ainda mais de orgulho: TAC, SÔ MÜQUE — muito obrigado!",
  },
  createScene,
}

export default card
