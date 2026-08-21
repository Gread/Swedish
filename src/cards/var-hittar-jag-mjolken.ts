import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, seq, sphere, riseFrom, ch } from '../rig/helpers'

/**
 * Var hittar jag mjölken? — "VARRE, RITA! IÁ... MIÉL QUEN(te)?!"
 * Rita varre um mar de leite derramado no corredor do ICA; na prateleira,
 * um pote mexicano de MIEL de sombrero, fumegando, tomou o lugar do leite.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ── Cenário: corredor do mercado ─────────────────────────────────────
  const chao = box(4.8, 0.1, 3.2, '#eef3f7')
  chao.position.set(0, 0.05, 0)
  root.add(chao)

  const prateleira = new THREE.Group()
  const painelFundo = box(1.7, 2.1, 0.25, '#8ecae6')
  painelFundo.position.set(0, 1.15, -0.28)
  prateleira.add(painelFundo)
  const ladoEsq = box(0.12, 2.1, 0.75, '#79b8d6')
  ladoEsq.position.set(-0.79, 1.15, 0)
  prateleira.add(ladoEsq)
  const ladoDir = box(0.12, 2.1, 0.75, '#79b8d6')
  ladoDir.position.set(0.79, 1.15, 0)
  prateleira.add(ladoDir)
  const plancaBaixa = box(1.46, 0.07, 0.68, '#ffffff')
  plancaBaixa.position.set(0, 0.75, 0)
  prateleira.add(plancaBaixa)
  const plancaAlta = box(1.46, 0.07, 0.68, '#ffffff')
  plancaAlta.position.set(0, 1.45, 0)
  prateleira.add(plancaAlta)
  const placaIca = box(0.9, 0.34, 0.12, '#e63946')
  placaIca.position.set(0, 2.37, -0.15)
  prateleira.add(placaIca)
  prateleira.position.set(-1.5, 0, -1.0)
  root.add(prateleira)

  // ── O leite derramado ────────────────────────────────────────────────
  const poca = cylinder(0.7, 0.78, 0.06, '#ffffff', 32)
  poca.position.set(0.55, 0.13, 0.45)
  root.add(poca)

  const caixinha = new THREE.Group()
  const cartucho = box(0.3, 0.42, 0.3, '#fafafa')
  caixinha.add(cartucho)
  const faixaAzul = box(0.31, 0.12, 0.31, '#219ebc')
  faixaAzul.position.set(0, -0.02, 0)
  caixinha.add(faixaAzul)
  caixinha.position.set(0.15, 0.29, 0.85)
  caixinha.rotation.z = 1.35 // derretida, caída de lado na poça
  root.add(caixinha)

  // ── Rita, a faxineira ────────────────────────────────────────────────
  const corpoRita = new THREE.Group()
  const tronco = cylinder(0.28, 0.35, 0.9, '#f06292')
  tronco.position.set(0, 0.55, 0)
  corpoRita.add(tronco)
  const bracoVassoura = cylinder(0.055, 0.055, 0.55, '#f06292')
  bracoVassoura.position.set(-0.28, 1.1, 0.1)
  bracoVassoura.rotation.z = 0.6
  corpoRita.add(bracoVassoura)
  const bracoErguido = cylinder(0.055, 0.055, 0.5, '#f06292')
  bracoErguido.position.set(0.26, 1.05, -0.05)
  bracoErguido.rotation.z = -0.55
  corpoRita.add(bracoErguido)
  const punho = sphere(0.09, '#ffd8b5')
  punho.position.set(0.39, 1.27, -0.05)
  corpoRita.add(punho)
  corpoRita.position.set(1.4, 0, 0.3)
  root.add(corpoRita)

  const cabecaRita = new THREE.Group()
  const rosto = sphere(0.27, '#ffd8b5')
  cabecaRita.add(rosto)
  const coque = sphere(0.15, '#6d4c41')
  coque.position.set(0.14, 0.2, 0)
  cabecaRita.add(coque)
  const bocaGrito = sphere(0.07, '#4e342e')
  bocaGrito.position.set(-0.24, -0.05, 0)
  cabecaRita.add(bocaGrito)
  const olhoFrente = sphere(0.035, '#263238')
  olhoFrente.position.set(-0.22, 0.09, 0.11)
  cabecaRita.add(olhoFrente)
  const olhoTras = sphere(0.035, '#263238')
  olhoTras.position.set(-0.22, 0.09, -0.11)
  cabecaRita.add(olhoTras)
  cabecaRita.position.set(1.4, 1.26, 0.3)
  root.add(cabecaRita)

  const vassoura = new THREE.Group()
  const cabo = cylinder(0.04, 0.04, 1.3, '#8d5a2b')
  cabo.position.set(0, -0.57, 0)
  vassoura.add(cabo)
  const cerdas = box(0.34, 0.16, 0.18, '#fdd835')
  cerdas.position.set(0, -1.27, 0)
  vassoura.add(cerdas)
  vassoura.position.set(1.0, 1.32, 0.4)
  vassoura.rotation.z = -0.45 // inclinada, cerdas na borda da poça
  root.add(vassoura)

  // ── O pote de MIEL de sombrero ───────────────────────────────────────
  const pote = new THREE.Group()
  const corpoPote = cylinder(0.26, 0.3, 0.42, '#f9a825')
  corpoPote.position.set(0, 0.21, 0)
  pote.add(corpoPote)
  const rotulo = cylinder(0.305, 0.305, 0.14, '#ffe0b2')
  rotulo.position.set(0, 0.19, 0)
  pote.add(rotulo)
  pote.position.set(-1.5, 1.49, -1.0) // sobre a planca alta
  root.add(pote)

  const sombrero = new THREE.Group()
  const aba = cylinder(0.45, 0.5, 0.06, '#ff7043')
  aba.position.set(0, 0.03, 0)
  sombrero.add(aba)
  const copa = cone(0.24, 0.34, '#f4511e')
  copa.position.set(0, 0.23, 0)
  sombrero.add(copa)
  sombrero.position.set(-1.5, 1.88, -1.0)
  root.add(sombrero)

  const vapor = new THREE.Group()
  const fumaca1 = sphere(0.06, '#eceff1')
  vapor.add(fumaca1)
  const fumaca2 = sphere(0.08, '#eceff1')
  fumaca2.position.set(0.09, 0.19, 0)
  vapor.add(fumaca2)
  const fumaca3 = sphere(0.05, '#eceff1')
  fumaca3.position.set(0.04, 0.38, 0)
  vapor.add(fumaca3)
  vapor.position.set(-1.16, 1.95, -0.85)
  root.add(vapor)

  const parts = [
    { name: 'chao', group: 'mercado', object: chao },
    { name: 'prateleira', group: 'mercado', object: prateleira },
    { name: 'poca', group: 'leite', object: poca },
    { name: 'caixinha', group: 'leite', object: caixinha },
    { name: 'corpo-rita', group: 'rita', object: corpoRita },
    { name: 'cabeca-rita', group: 'rita', object: cabecaRita },
    { name: 'vassoura', group: 'rita', object: vassoura },
    { name: 'pote-miel', group: 'miel', object: pote },
    { name: 'sombrero', group: 'miel', object: sombrero },
    { name: 'vapor', group: 'miel', object: vapor },
  ]

  const build = [
    // Grupo 1 — o corredor do ICA
    seq('chao-rise', 'chao', 0, 0.7, [riseFrom(0.05, 0.3)], {
      caption: 'No corredor do ICA, a prateleira de laticínios está sem uma gota de leite…',
    }),
    seq('prateleira-rise', 'prateleira', 0.2, 0.8, [riseFrom(0, 2.8)]),

    // Grupo 2 — o leite derramado
    seq('poca-espalha', 'poca', 1.8, 0.8, [
      riseFrom(0.13, 0.3),
      ch('scale.x', 0.15, 1),
      ch('scale.z', 0.15, 1),
    ], {
      caption: '…todo o leite derramou: virou um mar branco no chão — as caixinhas derreteram!',
    }),
    seq('caixinha-rise', 'caixinha', 2.1, 0.6, [riseFrom(0.29, 0.8)]),
    seq('caixinha-tomba', 'caixinha', 2.7, 0.5, [ch('rotation.z', 0.55, 1.35)]),

    // Grupo 3 — Rita e a vassoura
    seq('corpo-rita-rise', 'corpo-rita', 3.6, 0.7, [riseFrom(0, 1.7)], {
      caption: "Chega a faxineira RITA, furiosa — VARRE, RITA! (o rr de 'vaRRE-RIta' é o h aspirado de 'hittar')",
    }),
    seq('cabeca-rita-rise', 'cabeca-rita', 3.8, 0.6, [riseFrom(1.26, 1.8)]),
    seq('vassoura-rise', 'vassoura', 4.0, 0.7, [riseFrom(1.32, 1.6)]),
    seq('vassoura-varre', 'vassoura', 4.9, 0.7, [ch('rotation.z', -0.1, -0.75)], {
      caption: "RITA VARRE o mar de leite e grita 'IÁ!' a cada vassourada — VARRE, RITA! IÁ…",
    }),
    seq('cabeca-grita-ia', 'cabeca-rita', 4.9, 0.35, [ch('rotation.z', 0, 0.3)]),
    seq('cabeca-volta', 'cabeca-rita', 5.25, 0.35, [ch('rotation.z', 0.3, 0)]),
    seq('vassoura-recolhe', 'vassoura', 5.7, 0.6, [ch('rotation.z', -0.75, -0.45)]),

    // Grupo 4 — o pote de MIEL quente
    seq('pote-cresce', 'pote-miel', 7.0, 0.8, [
      ch('scale.x', 0.05, 1),
      ch('scale.y', 0.05, 1),
      ch('scale.z', 0.05, 1),
    ], {
      caption: 'Na prateleira, no lugar do leite, só um pote mexicano de MIÉL bem QUENte — foi ele que derreteu tudo!',
    }),
    seq('sombrero-brota', 'sombrero', 7.9, 0.6, [
      ch('position.y', 1.58, 1.88),
      ch('scale.x', 0.2, 1),
      ch('scale.y', 0.2, 1),
      ch('scale.z', 0.2, 1),
    ]),
    seq('vapor-sobe', 'vapor', 8.6, 0.7, [
      ch('position.y', 1.6, 1.95),
      ch('scale.x', 0.15, 1),
      ch('scale.y', 0.15, 1),
      ch('scale.z', 0.15, 1),
    ], {
      caption: "Você aponta o caos: 'VARRE, RITA! IÁ… MIÉL QUEN(te)?!' — Var hittar jag mjölken?",
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.8, 3.0, 5.0], target: [-0.1, 1.0, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-hittar-jag-mjolken',
    contexto: 'Supermercado (ICA/Coop/Willys) e Systembolaget.',
    fraseFonte: 'Onde eu acho o leite?',
    fraseAlvo: 'Var hittar jag mjölken?',
    pronuncia:
      "var RÍT-tar iá MIÉL-quen (o 'h' sueco soa como o 'rr' aspirado carioca; 'mj' se fala 'mi', como em 'miolo'; 'jag' vira 'iá')",
    ponteSonora:
      "var RÍT-tar iá MIÉL-quen ~ \"VARRE, RITA! IÁ... MIÉL QUEN(te)?!\" — o RR carioca de 'vaRRE-RIta' é o h aspirado de 'hittar'; e MIÉL (mel em espanhol, com sombrero) dá o glide 'mi-é' de 'mjölken' — solte o '-te' e sai 'MIÉL-quen'.",
    historia:
      "No corredor do ICA, a faxineira RITA VARRE furiosa um mar de leite derramado, gritando 'IÁ!' a cada vassourada. Na prateleira, no lugar do leite, só um pote mexicano de MIEL — mel de sombrero — fumegando de quente: foi ele que derreteu todas as caixinhas. Você aponta pro caos e pergunta: 'VARRE, RITA! IÁ... MIÉL QUEN(te)?!' — onde eu acho o leite?",
  },
  createScene,
}

export default card
