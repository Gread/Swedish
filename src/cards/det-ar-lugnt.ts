import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cylinder, seq, sphere, riseFrom, ch } from '../rig/helpers'

/**
 * det-ar-lugnt — "Det är lugnt." (Tranquilo. / Sem problema.)
 * Cena: a preguiça padeira unta serenamente uma fôrma com um pincel,
 * ignorando a bandeja de pães tombada no chão.
 * Ponte sonora: "DÊÊ... éLE UNTA..." ≈ "det är lugnt".
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ── Cenário ──────────────────────────────────────────────────────────
  // Chão da padaria (topo em y=0)
  const chao = box(4.8, 0.12, 3.6, '#e8d5b5')
  chao.position.set(0, -0.06, 0)
  root.add(chao)

  // Mesa da padeira (bloco maciço estilo brinquedo)
  const mesa = box(1.9, 0.85, 1.15, '#a0522d')
  mesa.position.set(0.7, 0.425, 0.05)
  root.add(mesa)

  // ── O acidente ───────────────────────────────────────────────────────
  // Bandeja tombada, apoiada de lado no chão
  const bandeja = box(0.9, 0.05, 0.6, '#c0c8d0')
  bandeja.position.set(-1.45, 0.34, 0.55)
  bandeja.rotation.z = 0.95
  root.add(bandeja)

  // Pães caídos (grupo: três pães, um espatifado)
  const paes = new THREE.Group()
  const pao1 = sphere(0.14, '#d9a05b')
  pao1.position.set(0.0, 0.13, 0.0)
  paes.add(pao1)
  const pao2 = sphere(0.14, '#c8873f')
  pao2.scale.set(1.15, 0.6, 1.15) // o espatifado
  pao2.position.set(0.35, 0.09, -0.3)
  paes.add(pao2)
  const pao3 = sphere(0.12, '#d9a05b')
  pao3.position.set(-0.28, 0.12, 0.32)
  paes.add(pao3)
  paes.position.set(-1.05, 0, 0.4)
  root.add(paes)

  // ── A preguiça padeira ───────────────────────────────────────────────
  // Corpo (grupo: tronco + braços)
  const corpo = new THREE.Group()
  const tronco = sphere(0.5, '#8d7b68')
  tronco.scale.set(1, 1.15, 0.9)
  tronco.position.set(0, 0.6, 0)
  corpo.add(tronco)
  const bracoDireito = cylinder(0.09, 0.09, 0.75, '#8d7b68')
  bracoDireito.position.set(-0.32, 0.85, 0.35)
  bracoDireito.rotation.x = 1.15
  bracoDireito.rotation.z = 0.25
  corpo.add(bracoDireito)
  const bracoEsquerdo = cylinder(0.09, 0.09, 0.6, '#8d7b68')
  bracoEsquerdo.position.set(0.48, 0.55, 0)
  bracoEsquerdo.rotation.z = -0.35
  corpo.add(bracoEsquerdo)
  corpo.position.set(0.7, 0, -0.75)
  root.add(corpo)

  // Cabeça (grupo: rosto sereno + touca de padeira)
  const cabeca = new THREE.Group()
  const rosto = sphere(0.34, '#c9b295')
  cabeca.add(rosto)
  const manchaOlhoE = sphere(0.09, '#6b5844')
  manchaOlhoE.scale.set(1, 1.5, 0.5)
  manchaOlhoE.position.set(-0.14, 0.05, 0.27)
  cabeca.add(manchaOlhoE)
  const manchaOlhoD = sphere(0.09, '#6b5844')
  manchaOlhoD.scale.set(1, 1.5, 0.5)
  manchaOlhoD.position.set(0.14, 0.05, 0.27)
  cabeca.add(manchaOlhoD)
  const olhoE = sphere(0.045, '#1a1a1a')
  olhoE.scale.set(1, 0.4, 1) // pálpebra caída, olhar zen
  olhoE.position.set(-0.14, 0.05, 0.32)
  cabeca.add(olhoE)
  const olhoD = sphere(0.045, '#1a1a1a')
  olhoD.scale.set(1, 0.4, 1)
  olhoD.position.set(0.14, 0.05, 0.32)
  cabeca.add(olhoD)
  const nariz = sphere(0.05, '#5b4636')
  nariz.position.set(0, -0.04, 0.33)
  cabeca.add(nariz)
  const boca = box(0.12, 0.025, 0.04, '#5b4636')
  boca.position.set(0, -0.15, 0.3)
  cabeca.add(boca)
  const touca = cylinder(0.2, 0.17, 0.18, '#ffffff')
  touca.position.set(0, 0.34, 0)
  cabeca.add(touca)
  const topoTouca = sphere(0.19, '#ffffff')
  topoTouca.scale.set(1, 0.55, 1)
  topoTouca.position.set(0, 0.45, 0)
  cabeca.add(topoTouca)
  cabeca.position.set(0.7, 1.32, -0.7)
  cabeca.rotation.z = 0.1 // cabecinha tombada de sono
  root.add(cabeca)

  // ── A untada ─────────────────────────────────────────────────────────
  // Fôrma untada sobre a mesa (grupo: fôrma cinza + manteiga por dentro)
  const forma = new THREE.Group()
  const assadeira = box(0.72, 0.12, 0.5, '#7d8a99')
  forma.add(assadeira)
  const manteigaNaForma = box(0.58, 0.05, 0.36, '#ffd24a')
  manteigaNaForma.position.set(0, 0.05, 0)
  forma.add(manteigaNaForma)
  forma.position.set(0.45, 0.91, 0.15)
  root.add(forma)

  // Pincel (grupo: cabo + cerdas com manteiga), inclinado sobre a fôrma
  const pincel = new THREE.Group()
  const cerdas = box(0.16, 0.14, 0.12, '#ffd24a')
  pincel.add(cerdas)
  const cabo = cylinder(0.035, 0.035, 0.5, '#8b5a2b')
  cabo.position.set(0, 0.32, 0)
  pincel.add(cabo)
  pincel.position.set(0.32, 1.02, 0.15)
  pincel.rotation.z = -0.45
  root.add(pincel)

  const parts = [
    { name: 'chao', group: 'cenario', object: chao },
    { name: 'mesa', group: 'cenario', object: mesa },
    { name: 'bandeja', group: 'acidente', object: bandeja },
    { name: 'paes', group: 'acidente', object: paes },
    { name: 'corpo', group: 'preguica', object: corpo },
    { name: 'cabeca', group: 'preguica', object: cabeca },
    { name: 'forma', group: 'untada', object: forma },
    { name: 'pincel', group: 'untada', object: pincel },
  ]

  const build = [
    // Cenário
    seq('chao-rise', 'chao', 0.0, 0.7, [riseFrom(-0.06, 0.4)], {
      caption: 'Na padaria, você esbarra na preguiça padeira…',
    }),
    seq('mesa-rise', 'mesa', 0.3, 0.8, [riseFrom(0.425, 1.0)]),

    // O acidente: bandeja sobe rasa e tomba, pães se espalham
    seq('bandeja-rise', 'bandeja', 1.8, 0.6, [ch('position.y', -0.5, 0.05)], {
      caption: '…e derruba a bandeja dela: pães espatifados no chão!',
    }),
    seq('bandeja-tomba', 'bandeja', 2.5, 0.7, [
      ch('rotation.z', 0, 0.95),
      ch('position.y', 0.05, 0.34),
    ]),
    seq('paes-rise', 'paes', 2.7, 0.6, [riseFrom(0, 0.45)]),

    // A preguiça: nem pisca
    seq('corpo-rise', 'corpo', 4.0, 0.8, [riseFrom(0, 1.4)], {
      caption: 'Ela nem pisca. Zen total, tudo em câmera lenta…',
    }),
    seq('cabeca-rise', 'cabeca', 4.3, 0.7, [riseFrom(1.32, 1.9)]),
    seq('cabeca-tomba-de-sono', 'cabeca', 5.1, 0.6, [ch('rotation.z', 0, 0.1)]),

    // A untada eterna
    seq('forma-telescopa', 'forma', 5.8, 0.7, [ch('position.y', 0.4, 0.91)], {
      caption: "…e ela segue no dela, murmurando fanha: 'DÊÊ… éLE UNTA…'",
    }),
    seq('pincel-telescopa', 'pincel', 6.2, 0.8, [ch('position.y', 0.25, 1.02)]),
    seq('pincel-unta-ida', 'pincel', 7.4, 0.9, [ch('position.x', 0.32, 0.6)], {
      caption: 'O pincel goteja manteiga, sem pressa nenhuma…',
    }),
    seq('pincel-unta-volta', 'pincel', 8.5, 0.9, [ch('position.x', 0.6, 0.32)], {
      caption: "Quem UNTA devagar não se estressa: 'Det är lugnt.' — tranquilo, sem problema.",
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 3.0, 6.0], target: [0, 0.9, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-lugnt',
    contexto: 'Universal: alguém esbarra, pede desculpa, avisa de atraso, pergunta se algo incomoda.',
    fraseFonte: 'Tranquilo. / Sem problema.',
    fraseAlvo: 'Det är lugnt.',
    pronuncia: "dê é LÚNGT ('det' se fala 'dê'; 'är' vira só 'é'; em 'lugnt' o g quase some: 'lúngt')",
    ponteSonora:
      "dê é LÚNT ~ \"DÊÊ... éLE UNTA...\" — emendado, 'é-LUN-ta' ≈ 'är lugnt': o nasal 'un' de 'UNTA' é exatamente o ú nasal de 'lugnt' (solte o 'a' final e o g some sozinho). Nada de 'longo': é UNTA, com u.",
    historia:
      "Você esbarra na preguiça padeira e derruba a bandeja de pães dela no chão. Ela nem pisca: continua UNTANDO a fôrma em câmera lenta, pincel gotejando manteiga, e murmura fanha: 'dêê... éLE UNTA...'. Quem unta devagar não se estressa com nada — tranquilo, sem problema.",
  },
  createScene,
}

export default card
