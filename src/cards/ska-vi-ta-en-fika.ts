import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cylinder, seq, sphere, torus, riseFrom, ch } from '../rig/helpers'

/**
 * ska-vi-ta-en-fika — "Ska vi ta en fika?"
 * O SKAtista VIu o TÁxi: 'ENtão... FIKA!'
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ── Cenário ────────────────────────────────────────────────
  const calcada = box(4.8, 0.12, 3.2, '#c3c9d1')
  calcada.position.set(0, 0.06, 0)
  root.add(calcada)

  const rampa = new THREE.Group()
  const rampaSlab = box(1.9, 0.16, 1.0, '#5b6573')
  rampaSlab.position.set(-1.5, 0.55, -1.05)
  rampaSlab.rotation.z = -0.5
  rampa.add(rampaSlab)
  const rampaApoio = box(0.45, 0.85, 0.9, '#49515e')
  rampaApoio.position.set(-2.1, 0.43, -1.05)
  rampa.add(rampaApoio)
  rampa.position.set(0, 0, 0)
  root.add(rampa)

  // ── Skate + SKAtista ───────────────────────────────────────
  const skate = new THREE.Group()
  const roda1 = cylinder(0.09, 0.09, 0.1, '#2b2b31')
  roda1.rotation.x = Math.PI / 2
  roda1.position.set(-0.28, 0.09, 0)
  skate.add(roda1)
  const roda2 = cylinder(0.09, 0.09, 0.1, '#2b2b31')
  roda2.rotation.x = Math.PI / 2
  roda2.position.set(0.28, 0.09, 0)
  skate.add(roda2)
  const shape = box(0.85, 0.07, 0.28, '#8b5cf6')
  shape.position.set(0, 0.215, 0)
  skate.add(shape)
  skate.position.set(-0.6, 0.12, -0.25)
  root.add(skate)

  const skatista = new THREE.Group()
  const corpoSkatista = cylinder(0.16, 0.2, 0.5, '#33a852')
  corpoSkatista.position.set(0, 0.25, 0)
  skatista.add(corpoSkatista)
  const cabecaSkatista = sphere(0.15, '#f3c793')
  cabecaSkatista.position.set(0, 0.62, 0)
  skatista.add(cabecaSkatista)
  const capacete = cylinder(0.17, 0.17, 0.09, '#e0475b')
  capacete.position.set(0, 0.74, 0)
  skatista.add(capacete)
  skatista.position.set(-0.6, 0.37, -0.25) // em pé sobre o skate
  root.add(skatista)

  // ── TÁxi amarelo ───────────────────────────────────────────
  const taxi = new THREE.Group()
  const rodaTaxi1 = cylinder(0.17, 0.17, 0.12, '#26262e')
  rodaTaxi1.rotation.x = Math.PI / 2
  rodaTaxi1.position.set(-0.5, 0.17, 0.41)
  taxi.add(rodaTaxi1)
  const rodaTaxi2 = cylinder(0.17, 0.17, 0.12, '#26262e')
  rodaTaxi2.rotation.x = Math.PI / 2
  rodaTaxi2.position.set(0.5, 0.17, 0.41)
  taxi.add(rodaTaxi2)
  const carroceria = box(1.7, 0.5, 0.8, '#ffce3b')
  carroceria.position.set(0, 0.42, 0)
  taxi.add(carroceria)
  const listra = box(1.72, 0.14, 0.02, '#26262e')
  listra.position.set(0, 0.5, 0.41)
  taxi.add(listra)
  const cabine = box(0.85, 0.34, 0.72, '#9adcf0')
  cabine.position.set(-0.05, 0.84, 0)
  taxi.add(cabine)
  const teto = box(0.95, 0.09, 0.76, '#ffce3b')
  teto.position.set(-0.05, 1.055, 0)
  taxi.add(teto)
  taxi.position.set(1.5, 0.12, -0.6)
  root.add(taxi)

  const luminoso = box(0.34, 0.13, 0.15, '#ffffff')
  luminoso.position.set(1.45, 1.29, -0.6) // sobre o teto do táxi
  root.add(luminoso)

  // ── Mesinha de fika + taxista ──────────────────────────────
  const mesinha = new THREE.Group()
  const peMesa = cylinder(0.05, 0.07, 0.5, '#8a5a33')
  peMesa.position.set(0, 0.25, 0)
  mesinha.add(peMesa)
  const tampo = cylinder(0.44, 0.44, 0.06, '#a5692a')
  tampo.position.set(0, 0.53, 0)
  mesinha.add(tampo)
  mesinha.position.set(0.55, 0.12, 0.7)
  root.add(mesinha)

  const taxista = new THREE.Group()
  const corpoTaxista = cylinder(0.16, 0.2, 0.44, '#30303a')
  corpoTaxista.position.set(0, 0.22, 0)
  taxista.add(corpoTaxista)
  const braco = cylinder(0.045, 0.045, 0.34, '#30303a')
  braco.position.set(-0.2, 0.55, 0.05)
  braco.rotation.z = 0.45 // braço erguido em direção à xícara
  taxista.add(braco)
  const cabecaTaxista = sphere(0.14, '#f3c793')
  cabecaTaxista.position.set(0, 0.54, 0)
  taxista.add(cabecaTaxista)
  const quepe = cylinder(0.15, 0.15, 0.07, '#26262e')
  quepe.position.set(0, 0.66, 0)
  taxista.add(quepe)
  taxista.position.set(1.15, 0.12, 0.45)
  root.add(taxista)

  // ── O convite: xícara + kanelbulle ─────────────────────────
  const xicara = new THREE.Group()
  const copo = cylinder(0.09, 0.07, 0.15, '#ffffff')
  copo.position.set(0, 0.075, 0)
  xicara.add(copo)
  const cafe = cylinder(0.075, 0.075, 0.02, '#4a2c17')
  cafe.position.set(0, 0.145, 0)
  xicara.add(cafe)
  const asa = torus(0.05, 0.016, '#ffffff')
  asa.position.set(0.11, 0.08, 0)
  xicara.add(asa)
  // pose FINAL: erguida na mão do taxista (ela nasce na mesa e sobe)
  xicara.position.set(0.84, 0.8, 0.52)
  root.add(xicara)

  const kanelbulle = torus(0.09, 0.05, '#b06f2e')
  kanelbulle.rotation.x = Math.PI / 2
  kanelbulle.position.set(0.74, 0.73, 0.86) // deitado sobre a mesa
  root.add(kanelbulle)

  const parts = [
    { name: 'calcada', group: 'cenario', object: calcada },
    { name: 'rampa', group: 'cenario', object: rampa },
    { name: 'skate', group: 'skatista', object: skate },
    { name: 'skatista', group: 'skatista', object: skatista },
    { name: 'taxi', group: 'taxi', object: taxi },
    { name: 'luminoso', group: 'taxi', object: luminoso },
    { name: 'mesinha', group: 'fika', object: mesinha },
    { name: 'taxista', group: 'fika', object: taxista },
    { name: 'xicara', group: 'convite', object: xicara },
    { name: 'kanelbulle', group: 'convite', object: kanelbulle },
  ]

  const build = [
    // Cenário
    seq('calcada-rise', 'calcada', 0, 0.7, [riseFrom(0.06, 0.5)], {
      caption: 'Numa calçada da Suécia, uma rampa de skate se ergue…',
    }),
    seq('rampa-rise', 'rampa', 0.4, 0.8, [riseFrom(0, 1.2)]),

    // SKAtista
    seq('skate-rise', 'skate', 1.8, 0.6, [riseFrom(0.12, 0.6)], {
      caption: '…e o SKAtista despenca lá de cima a mil por hora!',
    }),
    seq('skatista-rise', 'skatista', 1.95, 0.6, [riseFrom(0.37, 1.4)]),
    seq('skate-desce', 'skate', 2.7, 0.8, [ch('position.x', -1.5, -0.6)]),
    seq('skatista-desce', 'skatista', 2.7, 0.8, [ch('position.x', -1.5, -0.6)]),
    seq('skatista-freia', 'skatista', 3.1, 0.4, [ch('rotation.z', 0, 0.25)]),
    seq('skatista-firma', 'skatista', 3.5, 0.4, [ch('rotation.z', 0.25, 0)]),

    // TÁxi
    seq('taxi-rise', 'taxi', 3.7, 0.8, [riseFrom(0.12, 1.5)], {
      caption: 'De repente ele VIu: um TÁxi amarelo parado no meio da corrida!',
    }),
    seq('luminoso-telescopa', 'luminoso', 4.6, 0.5, [ch('position.y', 1.08, 1.29)]),

    // Fika
    seq('mesinha-rise', 'mesinha', 5.7, 0.7, [riseFrom(0.12, 1.0)], {
      caption: 'Ao lado do TÁxi, o taxista montou a mesinha sagrada da fika.',
    }),
    seq('taxista-rise', 'taxista', 5.9, 0.7, [riseFrom(0.12, 1.1)]),

    // O convite
    seq(
      'xicara-pop',
      'xicara',
      7.4,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { caption: 'Ele serve o café fumegante e o kanelbulle…' },
    ),
    seq('kanelbulle-pop', 'kanelbulle', 7.6, 0.5, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ]),
    seq(
      'xicara-ergue',
      'xicara',
      8.8,
      0.7,
      [
        ch('position.x', 0.42, 0.84),
        ch('position.y', 0.68, 0.8),
        ch('position.z', 0.66, 0.52),
      ],
      { caption: "…ergue a xícara e grita: 'ENtão… FIKA!' — Ska vi ta en fika?" },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.8, 3.0, 6.0], target: [-0.1, 0.8, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'ska-vi-ta-en-fika',
    contexto:
      'Trabalho e vida social: convidar colega para a pausa do café, marcar encontro casual com conhecido.',
    fraseFonte: 'Vamos tomar um café (fazer uma fika)?',
    fraseAlvo: 'Ska vi ta en fika?',
    pronuncia:
      "ska vi ta en FÍ-ka? (pronúncia praticamente transparente para brasileiro — só caprichar no 'í' longo)",
    ponteSonora:
      "ska vi ta en FÍ-ka ~ \"SKAtista VIu o TÁxi: 'ENtão... FIKA!'\" — leia só as sílabas fortes: SKA-VI-TÁ-EN-FI-KA. E 'fika' é literalmente o convite 'FIKA!': quem ouve, fica para o café.",
    historia:
      "O SKAtista desce a rampa a mil e VÊ um TÁxi amarelo parado no meio da corrida, com uma mesinha de fika montada ao lado. O taxista ergue a xícara fumegante e grita: 'ENtão... FIKA!'. Na Suécia até o táxi para tudo pra fika — e recusar um 'ska vi ta en fika?' é crime social.",
  },
  createScene,
}

export default card
