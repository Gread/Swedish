import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cylinder, sphere, cone, torus, seq, ch, riseFrom } from '../rig/helpers'

/**
 * "Går den här till T-Centralen?" — GOLDEN RÉR, TIL TÊ-CENTRÁLEN?
 * Um golden retriever na plataforma da tunnelbana aponta o focinho
 * para o trem azul sob a placa branca com o T azul.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ── Cenário: trilhos ──────────────────────────────────────────────
  const trilho = new THREE.Group()
  const leito = box(4.6, 0.12, 0.8, '#3f4247')
  leito.position.set(0, 0, 0)
  trilho.add(leito)
  const trilhoEsq = box(4.6, 0.05, 0.07, '#767b83')
  trilhoEsq.position.set(0, 0.085, -0.2)
  trilho.add(trilhoEsq)
  const trilhoDir = box(4.6, 0.05, 0.07, '#767b83')
  trilhoDir.position.set(0, 0.085, 0.2)
  trilho.add(trilhoDir)
  trilho.position.set(0, 0.06, -1.4)
  root.add(trilho)

  // ── Cenário: plataforma ───────────────────────────────────────────
  const plataforma = new THREE.Group()
  const laje = box(4.4, 0.4, 1.9, '#c3c9d1')
  laje.position.set(0, 0, 0)
  plataforma.add(laje)
  const faixaAmarela = box(4.4, 0.02, 0.18, '#f7c948')
  faixaAmarela.position.set(0, 0.21, -0.85)
  plataforma.add(faixaAmarela)
  plataforma.position.set(0, 0.2, 0.6)
  root.add(plataforma)

  // ── Trem azul (den här) ───────────────────────────────────────────
  const trem = new THREE.Group()
  const carroceria = box(3.4, 0.75, 0.62, '#1f6fd0')
  carroceria.position.set(0, 0, 0)
  trem.add(carroceria)
  const teto = box(3.4, 0.08, 0.5, '#5b8fd9')
  teto.position.set(0, 0.415, 0)
  trem.add(teto)
  const portaEsq = box(0.36, 0.52, 0.05, '#14459c')
  portaEsq.position.set(-1.25, -0.06, 0.32)
  trem.add(portaEsq)
  const portaDir = box(0.36, 0.52, 0.05, '#14459c')
  portaDir.position.set(1.25, -0.06, 0.32)
  trem.add(portaDir)
  trem.position.set(0, 0.52, -1.4)
  root.add(trem)

  // ── Janelas do trem (peça própria, expande na lateral) ────────────
  const janelas = box(1.9, 0.2, 0.05, '#eef4fb')
  janelas.position.set(0, 0.64, -1.05)
  root.add(janelas)

  // ── Golden: corpo (com crachá do SL no pescoço) ───────────────────
  const corpo = new THREE.Group()
  const tronco = cylinder(0.22, 0.22, 0.7, '#d9a03f')
  tronco.rotation.x = Math.PI / 2
  tronco.position.set(0, 0.38, 0)
  corpo.add(tronco)
  for (const sx of [-0.13, 0.13]) {
    for (const sz of [-0.22, 0.22]) {
      const pata = cylinder(0.055, 0.055, 0.3, '#c8923a')
      pata.position.set(sx, 0.15, sz)
      corpo.add(pata)
    }
  }
  const coleira = torus(0.24, 0.035, '#d64541')
  coleira.position.set(0, 0.38, -0.22)
  corpo.add(coleira)
  const cracha = box(0.1, 0.12, 0.035, '#f5f7fa')
  cracha.position.set(0, 0.1, -0.22)
  corpo.add(cracha)
  const chipSL = box(0.06, 0.05, 0.02, '#1a56c4')
  chipSL.position.set(0, 0.1, -0.245)
  corpo.add(chipSL)
  corpo.position.set(0.8, 0.4, 0.45)
  root.add(corpo)

  // ── Golden: cabeça (telescopa do corpo e aponta pro trem) ─────────
  const cabeca = new THREE.Group()
  const cranio = sphere(0.19, '#d9a03f')
  cranio.position.set(0, 0, 0)
  cabeca.add(cranio)
  const focinho = cylinder(0.09, 0.11, 0.16, '#e6b968')
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.05, -0.2)
  cabeca.add(focinho)
  const nariz = sphere(0.04, '#3a2a1d')
  nariz.position.set(0, -0.03, -0.3)
  cabeca.add(nariz)
  const olhoEsq = sphere(0.035, '#26211c')
  olhoEsq.position.set(-0.08, 0.06, -0.155)
  cabeca.add(olhoEsq)
  const olhoDir = sphere(0.035, '#26211c')
  olhoDir.position.set(0.08, 0.06, -0.155)
  cabeca.add(olhoDir)
  cabeca.position.set(0.8, 0.88, 0.02)
  cabeca.rotation.x = 0.15
  root.add(cabeca)

  // ── Golden: orelhas caídas (filhas da cabeça, acompanham o gesto) ─
  const orelhas = new THREE.Group()
  const orelhaEsq = box(0.07, 0.22, 0.14, '#b5761d')
  orelhaEsq.position.set(-0.2, -0.03, 0.02)
  orelhaEsq.rotation.z = -0.12
  orelhas.add(orelhaEsq)
  const orelhaDir = box(0.07, 0.22, 0.14, '#b5761d')
  orelhaDir.position.set(0.2, -0.03, 0.02)
  orelhaDir.rotation.z = 0.12
  orelhas.add(orelhaDir)
  cabeca.add(orelhas)

  // ── Golden: rabo abanando (RÉR!) ──────────────────────────────────
  const rabo = new THREE.Group()
  const raboCone = cone(0.055, 0.34, '#d9a03f')
  raboCone.rotation.x = 0.9
  raboCone.position.set(0, 0.1, 0.1)
  rabo.add(raboCone)
  rabo.position.set(0.8, 0.74, 0.8)
  root.add(rabo)

  // ── Poste da placa ────────────────────────────────────────────────
  const poste = cylinder(0.05, 0.05, 1.9, '#7d838a')
  poste.position.set(1.75, 1.35, 0.75)
  root.add(poste)

  // ── Placa branca com o T azul da TÊ-CENTRÁLEN ─────────────────────
  const placa = new THREE.Group()
  const disco = cylinder(0.45, 0.45, 0.08, '#f5f7fa', 32)
  disco.rotation.x = Math.PI / 2
  disco.position.set(0, 0, 0)
  placa.add(disco)
  const tHorizontal = box(0.5, 0.12, 0.04, '#1a56c4')
  tHorizontal.position.set(0, 0.13, 0.06)
  placa.add(tHorizontal)
  const tVertical = box(0.12, 0.4, 0.04, '#1a56c4')
  tVertical.position.set(0, -0.07, 0.06)
  placa.add(tVertical)
  placa.position.set(1.75, 2.45, 0.75)
  root.add(placa)

  const parts = [
    { name: 'trilho', group: 'cenario', object: trilho },
    { name: 'plataforma', group: 'cenario', object: plataforma },
    { name: 'trem', group: 'trem', object: trem },
    { name: 'janelas', group: 'trem', object: janelas },
    { name: 'golden-corpo', group: 'golden', object: corpo },
    { name: 'golden-cabeca', group: 'golden', object: cabeca },
    { name: 'golden-orelhas', group: 'golden', object: orelhas },
    { name: 'golden-rabo', group: 'golden', object: rabo },
    { name: 'poste', group: 'placa', object: poste },
    { name: 'placa', group: 'placa', object: placa },
  ]

  const build = [
    // Cenário
    seq('trilho-rise', 'trilho', 0, 0.7, [riseFrom(0.06, 0.6)], {
      caption: 'Na plataforma da tunnelbana, os trilhos brotam do chão…',
    }),
    seq('plataforma-rise', 'plataforma', 0.15, 0.7, [riseFrom(0.2, 0.9)]),

    // Trem
    seq('trem-rise', 'trem', 1.6, 0.8, [riseFrom(0.52, 1.2)], {
      caption: '…e ESTE trem azul aqui (den här) encosta na estação…',
    }),
    seq('trem-slide', 'trem', 2.4, 0.8, [ch('position.x', -0.6, 0)]),
    seq('janelas-expand', 'janelas', 3.15, 0.6, [
      ch('scale.x', 0.05, 1),
      ch('scale.y', 0.05, 1),
    ]),

    // Golden retriever
    seq('corpo-rise', 'golden-corpo', 3.9, 0.8, [riseFrom(0.4, 1.3)], {
      caption: '…um GOLDEN retriever chamado RÉR, de crachá do SL no pescoço, sobe na plataforma…',
    }),
    seq('cabeca-out', 'golden-cabeca', 4.65, 0.6, [ch('position.z', 0.5, 0.02)]),
    seq('orelhas-grow', 'golden-orelhas', 5.2, 0.45, [
      ch('scale.x', 0.05, 1),
      ch('scale.y', 0.05, 1),
      ch('scale.z', 0.05, 1),
    ]),
    seq('cabeca-tilt', 'golden-cabeca', 5.6, 0.5, [ch('rotation.x', 0, 0.15)], {
      caption: '…e aponta o focinho pro trem: ele só embarca se ESTE aqui for ATÉ (\'TIL) onde enterrou o osso…',
    }),
    seq('rabo-grow', 'golden-rabo', 5.75, 0.5, [
      ch('scale.x', 0.05, 1),
      ch('scale.y', 0.05, 1),
      ch('scale.z', 0.05, 1),
    ]),
    seq('rabo-wag-1', 'golden-rabo', 6.25, 0.3, [ch('rotation.z', 0, 0.35)]),
    seq('rabo-wag-2', 'golden-rabo', 6.55, 0.35, [ch('rotation.z', 0.35, -0.35)]),
    seq('rabo-wag-3', 'golden-rabo', 6.9, 0.3, [ch('rotation.z', -0.35, 0)]),

    // Placa da estação
    seq('poste-rise', 'poste', 7.35, 0.7, [riseFrom(1.35, 2.4)], {
      caption: '…o osso está enterrado bem debaixo do grande T azul da TÊ-CENTRÁLEN…',
    }),
    seq('placa-up', 'placa', 8.0, 0.8, [ch('position.y', -0.1, 2.45)]),
    seq('placa-spin', 'placa', 8.75, 0.7, [ch('rotation.y', 0, Math.PI * 2)], {
      caption: 'Antes das portas fecharem, ele late: GOLDEN-RÉR, TIL TÊ-CENTRÁLEN? — "Går den här till T-Centralen?"',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.6, 2.9, 4.6], target: [0, 1.0, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'gar-den-har-till-t-centralen',
    contexto: 'Transporte SL: plataforma da tunnelbana, ponto de ônibus, pendeltåg.',
    fraseFonte: 'Este aqui vai para a T-Centralen?',
    fraseAlvo: 'Går den här till T-Centralen?',
    pronuncia: "gôr den RRÉR til tê-sen-TRÁ-len ('går' = 'gôr'; 'här' com h aspirado carioca e r final: 'rrér')",
    ponteSonora:
      '"GOLDEN RÉR, TIL TÊ-CENTRÁLEN?" — "Går den här" soa quase "GOL-DEN-RRÉR", o começo de GOLDEN retriever (só troque o L por R: "gôr-den-rrér", com RR carioca no "här"); "till" é o \'til\' de até, e T-Centralen fala-se "tê-sen-TRÁ-len".',
    historia:
      'Na plataforma da tunnelbana, um GOLDEN retriever chamado RÉR, de crachá do SL no pescoço, aponta a pata para o trem azul que acabou de chegar. Ele só embarca se ESTE trem aqui for ATÉ (\'til) a TÊ-CENTRAL, porque foi lá que ele enterrou o osso, bem debaixo da placa do grande T azul. Antes das portas fecharem, ele late a pergunta pro maquinista: "GOLDEN-RÉR? TIL TÊ-CENTRÁLEN?"',
  },
  createScene,
}

export default card
