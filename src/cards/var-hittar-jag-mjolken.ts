import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  person, rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
  rng, seq, ch, riseFrom,
} from '../rig/helpers'

/**
 * var-hittar-jag-mjolken — "Var hittar jag mjölken?"
 * Rita varre um mar de leite derramado no corredor do ICA; na prateleira,
 * um pote mexicano de MIEL de sombrero, fumegando, tomou o lugar do leite.
 *
 * Paleta: piso creme-acinzentado · azul-gôndola frio (#79a8c4) · rosa-uniforme
 * de Rita (#c2597a), com o vermelho ICA temperado (#c94f3d) de coadjuvante.
 * Acento saturado RESERVADO: âmbar #f09f2c do pote de MIEL (a ponte sonora).
 */
function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(12)

  // ---------- BASE do diorama: piso do mercado + adereços ----------
  const base = new THREE.Group()
  const disco = cylinder(2.55, 2.65, 0.16, '#d8d5c9', { roughness: 0.9 })
  disco.position.y = 0.08
  base.add(disco)

  // ladrilhos frios alternados, com falhas semeadas
  for (let ix = -3; ix <= 3; ix++) {
    for (let iz = -3; iz <= 3; iz++) {
      const x = ix * 0.6
      const z = iz * 0.6
      if (Math.hypot(x, z) > 2.05) continue
      if (rand() < 0.08) continue
      const cor = (ix + iz) % 2 === 0 ? '#eceae2' : '#cdd3d6'
      const tile = rbox(0.52, 0.03, 0.52, 0.012, cor, { roughness: 0.85 })
      tile.position.set(x, 0.175, z)
      base.add(tile)
    }
  }

  // adereço 1: cone de "piso molhado" ao lado da poça
  const conePiso = new THREE.Group()
  const coneCorpo = cone(0.17, 0.46, '#cbb35a', { roughness: 0.7 })
  coneCorpo.position.y = 0.42
  conePiso.add(coneCorpo)
  const coneFaixa = cylinder(0.115, 0.135, 0.07, '#f2efe6', { roughness: 0.5 })
  coneFaixa.position.y = 0.42
  conePiso.add(coneFaixa)
  const coneBase = rbox(0.3, 0.035, 0.3, 0.012, '#b09c4b', { roughness: 0.75 })
  coneBase.position.y = 0.2
  conePiso.add(coneBase)
  conePiso.position.set(1.5, 0, 1.35)
  conePiso.rotation.y = 0.4
  base.add(conePiso)

  // adereço 2: cesta de compras esquecida
  const cesta = new THREE.Group()
  const cestaCorpo = rbox(0.44, 0.24, 0.32, 0.05, '#5d7f96', { roughness: 0.75 })
  cestaCorpo.position.y = 0.31
  cesta.add(cestaCorpo)
  const cestaAlca = torus(0.14, 0.02, '#48657a', { roughness: 0.7 })
  cestaAlca.position.y = 0.42
  cesta.add(cestaAlca)
  for (let i = 0; i < 2; i++) {
    const pao = capsule(0.06, 0.12, '#d9a25f', { roughness: 0.8 })
    pao.rotation.z = Math.PI / 2 + (rand() - 0.5) * 0.5
    pao.position.set(-0.07 + i * 0.14, 0.44, (rand() - 0.5) * 0.1)
    cesta.add(pao)
  }
  cesta.position.set(-1.9, 0, 0.55)
  cesta.rotation.y = 0.5
  base.add(cesta)

  // adereço 3: balde da faxina, já cheio de leite
  const balde = new THREE.Group()
  const baldeCorpo = cylinder(0.17, 0.13, 0.26, '#6b7f94', { roughness: 0.6 })
  baldeCorpo.position.y = 0.32
  balde.add(baldeCorpo)
  const baldeAro = torus(0.17, 0.018, '#54677a', { roughness: 0.45 })
  baldeAro.rotation.x = Math.PI / 2
  baldeAro.position.y = 0.45
  balde.add(baldeAro)
  const baldeLeite = cylinder(0.145, 0.145, 0.02, '#f7f5ef', { roughness: 0.2 })
  baldeLeite.position.y = 0.42
  balde.add(baldeLeite)
  balde.position.set(2.0, 0, -0.7)
  base.add(balde)

  root.add(base)

  // ---------- GÔNDOLA do ICA: laticínios sem uma gota de leite ----------
  const prateleira = new THREE.Group()
  const painelFundo = rbox(1.9, 2.1, 0.14, 0.04, '#79a8c4', { roughness: 0.6 })
  painelFundo.position.set(0, 1.15, -0.3)
  prateleira.add(painelFundo)
  for (const lado of [-1, 1]) {
    const lateral = rbox(0.14, 2.1, 0.7, 0.04, '#6493ad', { roughness: 0.6 })
    lateral.position.set(lado * 0.95, 1.15, 0)
    prateleira.add(lateral)
  }
  const rodape = rbox(1.86, 0.18, 0.66, 0.03, '#54748c', { roughness: 0.7 })
  rodape.position.set(0, 0.09, 0)
  prateleira.add(rodape)
  for (const py of [0.72, 1.42]) {
    const planca = rbox(1.76, 0.07, 0.62, 0.02, '#eef1f2', { roughness: 0.45 })
    planca.position.set(0, py, 0)
    prateleira.add(planca)
    const etiquetas = rbox(1.76, 0.05, 0.025, 0.01, '#dce4e8', { roughness: 0.5 })
    etiquetas.position.set(0, py - 0.05, 0.3)
    prateleira.add(etiquetas)
  }

  // placa ICA (vermelho temperado) com selo redondo
  const placa = new THREE.Group()
  const placaCorpo = rbox(0.95, 0.36, 0.1, 0.035, '#c94f3d', { roughness: 0.5 })
  placa.add(placaCorpo)
  const placaSelo = torus(0.075, 0.02, '#f2efe6', { roughness: 0.4 })
  placaSelo.position.set(-0.28, 0, 0.055)
  placa.add(placaSelo)
  const placaTraco = rbox(0.34, 0.05, 0.02, 0.01, '#f2efe6', { roughness: 0.4 })
  placaTraco.position.set(0.14, 0, 0.055)
  placa.add(placaTraco)
  placa.position.set(0, 2.42, -0.24)
  prateleira.add(placa)

  // sobras na planca baixa (queijos e iogurtes) — o lado do leite, vazio
  for (let i = 0; i < 2; i++) {
    const queijo = rbox(0.24, 0.16, 0.2, 0.03, '#e8c76a', { roughness: 0.55 })
    queijo.position.set(-0.62 + i * 0.3, 0.72 + 0.115, 0.02 + (rand() - 0.5) * 0.08)
    queijo.rotation.y = (rand() - 0.5) * 0.4
    prateleira.add(queijo)
  }
  for (let i = 0; i < 2; i++) {
    const iogurte = lathe(
      [[0, 0], [0.075, 0], [0.09, 0.13], [0.095, 0.15], [0, 0.15]],
      '#f2f0e8', { roughness: 0.5 },
    )
    iogurte.position.set(0.02 + i * 0.2, 0.755, -0.1 + (rand() - 0.5) * 0.1)
    prateleira.add(iogurte)
    const tampa = cylinder(0.08, 0.08, 0.02, '#7fa06b', { roughness: 0.5 })
    tampa.position.set(0.02 + i * 0.2, 0.915, -0.1 + (rand() - 0.5) * 0.1)
    prateleira.add(tampa)
  }
  // etiqueta caída no vão vazio do leite
  const etiquetaCaida = rbox(0.14, 0.02, 0.09, 0.008, '#f2efe6', { roughness: 0.5 })
  etiquetaCaida.position.set(0.55, 0.77, 0.12)
  etiquetaCaida.rotation.set(0.1, 0.6, 0)
  prateleira.add(etiquetaCaida)

  prateleira.position.set(-1.35, 0.19, -1.1)
  root.add(prateleira)

  // ---------- o MAR de leite derramado ----------
  const poca = new THREE.Group()
  const blobs: [number, number, number, number][] = [
    // [raio, x, z, girar]
    [0.62, 0, 0, 0],
    [0.3, 0.5, 0.32, 0],
    [0.26, -0.48, -0.3, 0],
  ]
  for (const [r, bx, bz] of blobs) {
    const blob = cylinder(r, r + 0.07, 0.05, '#f7f5ef', { roughness: 0.2 })
    blob.position.set(bx, 0.215, bz)
    poca.add(blob)
  }
  for (let i = 0; i < 4; i++) {
    const ang = rand() * Math.PI * 2
    const dist = 0.78 + rand() * 0.25
    const gota = sphere(0.035 + rand() * 0.02, '#f7f5ef', { roughness: 0.2 })
    gota.position.set(Math.cos(ang) * dist, 0.21, Math.sin(ang) * dist)
    gota.scale.y = 0.45
    poca.add(gota)
  }
  const tampinha = cylinder(0.045, 0.045, 0.03, '#4a7fb5', { roughness: 0.35 })
  tampinha.position.set(0.32, 0.215, 0.55)
  poca.add(tampinha)
  poca.position.set(0.55, 0, 0.55)
  root.add(poca)

  // ---------- a caixinha de leite derretida, tombada na poça ----------
  const caixinha = new THREE.Group()
  const cartucho = rbox(0.3, 0.44, 0.3, 0.03, '#fafafa', { roughness: 0.5 })
  caixinha.add(cartucho)
  const topoGable = cone(0.21, 0.16, '#fafafa', { roughness: 0.5 }, 4)
  topoGable.rotation.y = Math.PI / 4
  topoGable.position.y = 0.3
  caixinha.add(topoGable)
  const faixaAzul = rbox(0.315, 0.12, 0.315, 0.02, '#4a7fb5', { roughness: 0.5 })
  faixaAzul.position.y = -0.04
  caixinha.add(faixaAzul)
  const bocal = cylinder(0.045, 0.045, 0.04, '#4a7fb5', { roughness: 0.35 })
  bocal.position.set(0.07, 0.36, 0.07)
  caixinha.add(bocal)
  caixinha.position.set(0.35, 0.36, 1.05)
  caixinha.rotation.y = 0.4
  caixinha.rotation.z = 1.3 // derretida, escorrida de lado na poça
  root.add(caixinha)

  // ---------- RITA, a faxineira furiosa ----------
  const rita = person({ body: '#c2597a', skin: '#e8c39e', height: 1.5, armAngle: 0.4 })
  const cabecaRita = rita.getObjectByName('head')!
  const coque = sphere(0.14, '#5d4037', { roughness: 0.85 })
  coque.position.set(0, 0.22, -0.12)
  cabecaRita.add(coque)
  const bandana = torus(0.27, 0.04, '#8f3e5f', { roughness: 0.85 })
  bandana.rotation.x = Math.PI / 2
  bandana.position.y = 0.1
  cabecaRita.add(bandana)
  const no = sphere(0.05, '#8f3e5f', { roughness: 0.85 })
  no.position.set(0, 0.06, -0.28)
  cabecaRita.add(no)
  for (const lado of [-1, 1]) {
    const sobrancelha = rbox(0.1, 0.022, 0.02, 0.008, '#5d4037', { roughness: 0.8 })
    sobrancelha.position.set(lado * 0.11, 0.12, 0.25)
    sobrancelha.rotation.z = lado * -0.4 // franzidas: fúria
    cabecaRita.add(sobrancelha)
  }
  const bocaGrito = sphere(0.05, '#6e332a', { roughness: 0.6 })
  bocaGrito.position.set(0, -0.11, 0.26)
  bocaGrito.scale.z = 0.5
  cabecaRita.add(bocaGrito)
  cabecaRita.rotation.x = 0.28 // olhando para baixo, para o mar de leite

  const avental = rbox(0.36, 0.46, 0.05, 0.02, '#ecebe4', { roughness: 0.9 })
  avental.position.set(0, 0.36, 0.22)
  rita.add(avental)

  const bracoVassoura = rita.getObjectByName('armR')!
  bracoVassoura.rotation.set(0.85, 0, -0.25) // empurrando a vassoura
  const bracoFuria = rita.getObjectByName('armL')!
  bracoFuria.rotation.set(-0.2, 0, 2.3) // punho erguido de fúria

  rita.position.set(1.3, 0.19, 0.45)
  rita.rotation.y = -1.95 // pose final: apontando para o pote na prateleira
  root.add(rita)

  // ---------- a vassoura (pivô no alto do cabo, para varrer) ----------
  const vassoura = new THREE.Group()
  const cabo = cylinder(0.035, 0.035, 1.3, '#8d5a2b', { roughness: 0.7 })
  cabo.position.y = -0.62
  vassoura.add(cabo)
  const pomo = sphere(0.048, '#7a4b22', { roughness: 0.7 })
  pomo.position.y = 0.02
  vassoura.add(pomo)
  const virola = cylinder(0.05, 0.058, 0.09, '#b8bcc0', { roughness: 0.3, metalness: 0.8 })
  virola.position.y = -1.3
  vassoura.add(virola)
  const cabeca = rbox(0.34, 0.15, 0.11, 0.035, '#d9b44a', { roughness: 0.85 })
  cabeca.position.y = -1.4
  vassoura.add(cabeca)
  for (let i = 0; i < 5; i++) {
    const cerda = capsule(0.024, 0.1, '#c9a43e', { roughness: 0.9 })
    cerda.position.set(-0.12 + i * 0.06, -1.5, 0)
    vassoura.add(cerda)
  }
  vassoura.position.set(1.0, 1.56, 0.62)
  vassoura.rotation.z = -0.5 // repouso: cerdas na borda da poça
  root.add(vassoura)

  // ---------- o pote de MIEL — acento âmbar da cena ----------
  const pote = new THREE.Group()
  const jarro = lathe(
    [
      [0, 0], [0.2, 0], [0.27, 0.05], [0.29, 0.2], [0.25, 0.32],
      [0.17, 0.36], [0.18, 0.41], [0.22, 0.45], [0.2, 0.48], [0, 0.48],
    ],
    '#f09f2c', { roughness: 0.25 },
  )
  pote.add(jarro)
  const rotulo = cylinder(0.3, 0.3, 0.12, '#f7ead0', { roughness: 0.5 })
  rotulo.position.y = 0.19
  pote.add(rotulo)
  const letreiro = rbox(0.18, 0.05, 0.02, 0.008, '#b35a24', { roughness: 0.5 })
  letreiro.position.set(0, 0.19, 0.3)
  pote.add(letreiro)
  const escorrido = sphere(0.045, '#cf7d1c', { roughness: 0.3 })
  escorrido.position.set(0.2, 0.38, 0.12)
  escorrido.scale.y = 1.8
  pote.add(escorrido)
  pote.position.set(-1.0, 1.645, -0.95) // sobre a planca alta da gôndola
  root.add(pote)

  // ---------- o sombrero (lathe: aba virada + copa) ----------
  const sombrero = new THREE.Group()
  const chapeu = lathe(
    [
      [0, 0], [0.24, 0], [0.44, 0.06], [0.5, 0.13], [0.45, 0.14],
      [0.26, 0.1], [0.21, 0.12], [0.19, 0.3], [0.1, 0.4], [0, 0.43],
    ],
    '#d1603f', { roughness: 0.6 },
  )
  sombrero.add(chapeu)
  const fita = torus(0.21, 0.025, '#f2d16b', { roughness: 0.5 })
  fita.rotation.x = Math.PI / 2
  fita.position.y = 0.13
  sombrero.add(fita)
  sombrero.rotation.z = 0.1
  sombrero.position.set(-1.0, 2.08, -0.95)
  root.add(sombrero)

  // ---------- vapor de MIEL bem QUENte escapando sob a aba ----------
  const vapor = new THREE.Group()
  const nuvens: [number, number, number, number, number][] = [
    // [raio, x, y, z, semente]
    [0.09, 0, 0, 0, 41],
    [0.12, 0.1, 0.22, 0.04, 42],
    [0.08, 0.18, 0.44, 0, 43],
  ]
  for (const [r, vx, vy, vz, semente] of nuvens) {
    const nuvem = puff(r, '#eef1f2', 4, semente, { roughness: 0.95 })
    nuvem.position.set(vx, vy, vz)
    vapor.add(nuvem)
  }
  vapor.position.set(-0.78, 2.3, -0.82)
  root.add(vapor)

  const parts = [
    { name: 'base', group: 'mercado', object: base },
    { name: 'prateleira', group: 'mercado', object: prateleira },
    { name: 'poca', group: 'leite', object: poca },
    { name: 'caixinha', group: 'leite', object: caixinha },
    { name: 'rita', group: 'rita', object: rita },
    { name: 'vassoura', group: 'rita', object: vassoura },
    { name: 'pote-miel', group: 'miel', object: pote },
    { name: 'sombrero', group: 'miel', object: sombrero },
    { name: 'vapor', group: 'miel', object: vapor },
  ]

  const build = [
    // ---- o corredor do ICA ----
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 1.2)], {
      ease: 'easeOut',
      caption: 'No corredor do ICA, a prateleira de laticínios está sem uma gota de leite…',
    }),
    seq('prateleira-rise', 'prateleira', 0.25, 0.85, [riseFrom(0.19, 3.0)], { ease: 'easeOut' }),

    // ---- o leite derramado ----
    seq('poca-espalha', 'poca', 1.9, 0.85, [
      riseFrom(0, 0.4),
      ch('scale.x', 0.15, 1),
      ch('scale.z', 0.15, 1),
    ], {
      ease: 'easeOut',
      caption: '…todo o leite derramou: virou um mar branco no chão — as caixinhas derreteram!',
    }),
    seq('caixinha-rise', 'caixinha', 2.15, 0.6, [riseFrom(0.36, 0.95)], { ease: 'easeOut' }),
    seq('caixinha-tomba', 'caixinha', 2.85, 0.55, [ch('rotation.z', 0.5, 1.3)], { ease: 'easeIn' }),

    // ---- Rita e a vassoura ----
    seq('rita-rise', 'rita', 3.9, 0.8, [riseFrom(0.19, 1.75)], {
      ease: 'easeOut',
      caption: "Chega a faxineira RITA, furiosa — VARRE, RITA! (o rr de 'vaRRE-RIta' é o h aspirado de 'hittar')",
    }),
    seq('vassoura-rise', 'vassoura', 4.15, 0.7, [riseFrom(1.56, 1.8)], { ease: 'easeOut' }),
    seq('vassoura-varre', 'vassoura', 5.0, 0.75, [
      ch('rotation.z', -0.5, -0.9),
      ch('position.x', 1.0, 0.55),
      ch('position.y', 1.56, 1.36),
    ], {
      caption: "RITA VARRE o mar de leite e grita 'IÁ!' a cada vassourada — VARRE, RITA! IÁ…",
    }),
    seq('rita-grita-ia', 'rita', 5.0, 0.4, [ch('rotation.z', 0, 0.12)]),
    seq('rita-recompoe', 'rita', 5.4, 0.4, [ch('rotation.z', 0.12, 0)]),
    seq('vassoura-recolhe', 'vassoura', 5.85, 0.65, [
      ch('rotation.z', -0.9, -0.5),
      ch('position.x', 0.55, 1.0),
      ch('position.y', 1.36, 1.56),
    ]),

    // ---- o pote de MIEL quente ----
    seq('pote-cresce', 'pote-miel', 6.9, 0.85, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Na prateleira, no lugar do leite, só um pote mexicano de MIÉL bem QUENte — foi ele que derreteu tudo!',
    }),
    seq('sombrero-pousa', 'sombrero', 7.85, 0.6, [
      ch('position.y', 1.9, 2.08),
      ch('scale.x', 0.2, 1),
      ch('scale.y', 0.2, 1),
      ch('scale.z', 0.2, 1),
    ], { ease: 'easeOut' }),
    seq('vapor-sobe', 'vapor', 8.55, 0.75, [
      ch('position.y', 2.0, 2.3),
      ch('scale.x', 0.15, 1),
      ch('scale.y', 0.15, 1),
      ch('scale.z', 0.15, 1),
    ], { ease: 'easeOut' }),

    // ---- Rita se vira e aponta o caos ----
    seq('rita-aponta', 'rita', 9.5, 0.8, [ch('rotation.y', -1.5, -1.95)], {
      caption: "Você aponta o caos: 'VARRE, RITA! IÁ… MIÉL QUEN(te)?!' — Var hittar jag mjölken?",
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.4, 3.0, 5.2], target: [-0.2, 1.0, -0.1] },
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
