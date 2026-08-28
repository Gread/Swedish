import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, person,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Jag har ont i magen." — IÁ RRÁR ÓN-TI MÁ-GUEN.
 *
 * Cozinha à noite, piso xadrez branco-e-menta. A lixeira tombou; foi dela que o
 * JAVALI garimpou o jantar que te ofereceu, focinho enfiado até o fundo. Ele ri
 * soprado: RRÁR! No chão, a folha do calendário de ÓNTI com um X vermelho.
 * E você: cara esverdeada, barriga-balão ROSA do tamanho de um sofá, mãos
 * apertando as laterais e três anéis de dor irradiando — não me MÁ-GUEN!
 *
 * Acento saturado reservado ao objeto da ponte: a BARRIGA-BALÃO rosa (magen).
 */

const FLOOR_CREAM = '#efe9da'
const FLOOR_MINT = '#9cc4ae'
const FLOOR_EDGE = '#59645c'

const BOAR = '#4a3729'
const BOAR_DARK = '#2f2318'
const SNOUT = '#8d6a58'
const TUSK = '#efe7d5'

const DENIM = '#33456b'
const SKIN_GREEN = '#a9c48e'
const SHOE = '#2a2320'

const METAL = '#96a0a6'
const PAPER = '#f2ede0'
const RED = '#bc4433'

const PINK = '#f2609a' // acento reservado: a barriga-balão (magen)
const PINK_DARK = '#cf3f7c'

const GY = 0.18 // topo do piso do diorama

// centro de massa do "você"
const VX = 0.85
const VZ = 0.35

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: cozinha à noite, piso xadrez -----------------------
  const base = new THREE.Group()

  const slab = cylinder(2.62, 2.70, 0.13, FLOOR_EDGE, { roughness: 0.9 })
  slab.position.y = 0.065
  base.add(slab)

  const TILE = 0.62
  for (let ix = -4; ix <= 4; ix++) {
    for (let iz = -4; iz <= 4; iz++) {
      const x = ix * TILE
      const z = iz * TILE
      if (Math.hypot(x, z) > 2.25) continue
      const light = (ix + iz) % 2 === 0
      const tile = rbox(
        TILE * 0.955, 0.05, TILE * 0.955, 0.012,
        light ? FLOOR_CREAM : FLOOR_MINT,
        { roughness: 0.3 },
      )
      tile.position.set(x, 0.155, z)
      base.add(tile)
    }
  }

  // adereços de cozinha suja espalhados com rng fixo
  const migalhaA = rock(0.075, '#a8823f', 31, { roughness: 0.9 })
  migalhaA.position.set(-0.95, GY + 0.05, 1.85)
  migalhaA.rotation.y = rand() * Math.PI
  base.add(migalhaA)

  const migalhaB = rock(0.05, '#8d6c33', 32, { roughness: 0.9 })
  migalhaB.position.set(1.55, GY + 0.035, 1.55)
  migalhaB.rotation.y = rand() * Math.PI
  base.add(migalhaB)

  const ervilhas = puff(0.07, '#7f9448', 5, 33, { roughness: 0.9 })
  ervilhas.position.set(-1.7, GY + 0.05, 1.15)
  base.add(ervilhas)

  const garfo = new THREE.Group()
  garfo.position.set(2.0, GY + 0.03, 0.25)
  garfo.rotation.y = 0.9 + rand() * 0.4
  const cabo = capsule(0.022, 0.26, METAL, { roughness: 0.25, metalness: 0.85 })
  cabo.rotation.z = Math.PI / 2
  garfo.add(cabo)
  const pa = rbox(0.11, 0.02, 0.09, 0.01, METAL, { roughness: 0.25, metalness: 0.85 })
  pa.position.x = 0.2
  garfo.add(pa)
  base.add(garfo)

  root.add(base)

  // ---- lixeira metálica tombada, sobras escapando --------------------------
  const lixeira = new THREE.Group()
  lixeira.position.set(-2.0, GY, -0.95)
  lixeira.rotation.y = 0.42

  const lata = lathe(
    [
      [0, 0], [0.26, 0], [0.30, 0.62], [0.315, 0.66],
      [0.285, 0.66], [0.245, 0.05], [0, 0.05],
    ],
    METAL,
    { roughness: 0.28, metalness: 0.85 },
  )
  const corpoLata = new THREE.Group()
  corpoLata.add(lata)
  const aro = torus(0.30, 0.022, '#7f888d', { roughness: 0.3, metalness: 0.8 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.655
  corpoLata.add(aro)
  for (let i = 0; i < 3; i++) {
    const frisa = torus(0.30, 0.012, '#8a9297', { roughness: 0.35, metalness: 0.8 })
    frisa.rotation.x = Math.PI / 2
    frisa.position.y = 0.16 + i * 0.17
    corpoLata.add(frisa)
  }
  corpoLata.rotation.z = -Math.PI / 2 // deitada, boca virada para a cena
  corpoLata.position.set(-0.16, 0.30, 0)
  lixeira.add(corpoLata)

  const tampa = lathe(
    [[0, 0], [0.30, 0], [0.325, 0.03], [0.30, 0.055], [0, 0.055]],
    '#8a9297',
    { roughness: 0.3, metalness: 0.8 },
  )
  tampa.position.set(0.86, 0.03, 0.34)
  tampa.rotation.z = 0.14
  lixeira.add(tampa)
  const puxador = torus(0.075, 0.022, '#7f888d', { roughness: 0.3, metalness: 0.8 })
  puxador.position.set(0.86, 0.11, 0.34)
  lixeira.add(puxador)

  // sobras escapando da boca
  const sobraA = rock(0.1, '#a07a3c', 41, { roughness: 0.9 })
  sobraA.position.set(0.62, 0.09, 0.06)
  lixeira.add(sobraA)
  const sobraB = puff(0.09, '#7d9146', 5, 42, { roughness: 0.9 })
  sobraB.position.set(0.78, 0.08, -0.16)
  lixeira.add(sobraB)
  const sobraC = rock(0.07, '#b5854a', 43, { roughness: 0.9 })
  sobraC.position.set(0.46, 0.07, 0.24)
  lixeira.add(sobraC)
  const casca = capsule(0.035, 0.22, '#d9b23f', { roughness: 0.7 })
  casca.position.set(0.95, 0.045, -0.05)
  casca.rotation.set(Math.PI / 2, 0, 0.5)
  lixeira.add(casca)
  const latinha = cylinder(0.075, 0.075, 0.2, '#b7452f', { roughness: 0.3, metalness: 0.7 })
  latinha.position.set(0.4, 0.075, -0.3)
  latinha.rotation.z = Math.PI / 2
  lixeira.add(latinha)

  root.add(lixeira)

  // ---- folha do calendário de ONTEM, com X vermelho ------------------------
  const folha = new THREE.Group()
  folha.position.set(-0.6, GY + 0.018, 1.2)
  folha.rotation.y = -0.28

  const papel = rbox(0.54, 0.03, 0.66, 0.012, PAPER, { roughness: 0.8 })
  folha.add(papel)
  const faixa = rbox(0.54, 0.012, 0.14, 0.006, '#3d4a5c', { roughness: 0.7 })
  faixa.position.set(0, 0.017, -0.25)
  folha.add(faixa)
  for (const s of [-1, 1]) {
    const traco = rbox(0.46, 0.012, 0.055, 0.008, RED, { roughness: 0.6 })
    traco.position.y = 0.019
    traco.rotation.y = s * 0.82
    folha.add(traco)
  }
  for (let i = 0; i < 4; i++) {
    const linha = rbox(0.34, 0.008, 0.022, 0.004, '#b9b2a2', { roughness: 0.8 })
    linha.position.set(0, 0.016, -0.06 + i * 0.13)
    folha.add(linha)
  }
  root.add(folha)

  // ---- javali culpado, rindo de lado ---------------------------------------
  const javali = new THREE.Group()
  javali.position.set(-1.42, GY, -0.2)
  javali.rotation.y = 1.33 // olha para você (+z local)

  const tronco = capsule(0.34, 0.5, BOAR, { roughness: 0.9 })
  tronco.rotation.x = Math.PI / 2
  tronco.position.y = 0.5
  javali.add(tronco)

  const cabeca = sphere(0.26, BOAR, { roughness: 0.9 })
  cabeca.scale.set(0.95, 0.95, 1.1)
  cabeca.position.set(0, 0.6, 0.62)
  javali.add(cabeca)

  const focinho = cylinder(0.15, 0.17, 0.2, SNOUT, { roughness: 0.75 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, 0.5, 0.88)
  javali.add(focinho)
  for (const s of [-1, 1]) {
    const narina = sphere(0.032, '#3a2a20', { roughness: 0.4 })
    narina.position.set(s * 0.06, 0.5, 0.985)
    javali.add(narina)
  }
  // sujeira de lixeira no focinho
  const sujeiraA = rock(0.045, '#3d2f1e', 51, { roughness: 0.95 })
  sujeiraA.position.set(0.09, 0.56, 0.95)
  javali.add(sujeiraA)
  const sujeiraB = rock(0.035, '#4a3a22', 52, { roughness: 0.95 })
  sujeiraB.position.set(-0.07, 0.43, 0.96)
  javali.add(sujeiraB)

  // boca aberta na risada RRÁR!
  const boca = capsule(0.032, 0.2, '#2a1b12', { roughness: 0.5 })
  boca.rotation.set(0.25, 0, Math.PI / 2)
  boca.position.set(0, 0.385, 0.83)
  javali.add(boca)

  for (const s of [-1, 1]) {
    const presa = cone(0.045, 0.3, TUSK, { roughness: 0.25 })
    presa.position.set(s * 0.15, 0.48, 0.86)
    presa.rotation.set(-0.45, 0, -s * 0.3)
    javali.add(presa)

    const escl = sphere(0.06, '#ffffff', { roughness: 0.25 })
    escl.position.set(s * 0.14, 0.71, 0.78)
    escl.scale.z = 0.6
    const pup = sphere(0.028, '#1a1a1a', { roughness: 0.2 })
    pup.position.set(s * 0.145, 0.715, 0.825)
    javali.add(escl, pup)

    const orelha = cone(0.1, 0.2, BOAR_DARK, { roughness: 0.9 })
    orelha.position.set(s * 0.2, 0.86, 0.5)
    orelha.rotation.set(-0.25, 0, -s * 0.45)
    javali.add(orelha)

    for (const z of [0.3, -0.05, -0.4]) {
      const pata = capsule(0.06, 0.1, BOAR_DARK, { roughness: 0.9 })
      pata.position.set(s * 0.19, 0.11, z)
      javali.add(pata)
    }
  }

  // cerdas eriçadas na espinha
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const cerda = cone(0.045, 0.21 - t * 0.07, BOAR_DARK, { roughness: 0.95 })
    cerda.position.set(0, 0.82 - t * 0.13, 0.3 - t * 0.78)
    cerda.rotation.x = -0.3 - t * 0.3
    javali.add(cerda)
  }

  const rabo = capsule(0.032, 0.16, BOAR_DARK, { roughness: 0.9 })
  rabo.position.set(0, 0.62, -0.63)
  rabo.rotation.x = 0.7
  javali.add(rabo)

  javali.rotation.z = 0.14 // pose final: rindo torto
  root.add(javali)

  // ---- você: pernas azuis, cara esverdeada, sobrancelhas caídas ------------
  const voce = person({ body: DENIM, skin: SKIN_GREEN, height: 1.35, armAngle: 0.4 })
  voce.position.set(VX, GY + 0.38, VZ)
  voce.rotation.y = -0.42
  // os braços vêm depois, como peça própria que aperta a barriga
  for (const n of ['armL', 'armR']) {
    const arm = voce.getObjectByName(n)
    if (arm) voce.remove(arm)
  }

  for (const s of [-1, 1]) {
    const perna = capsule(0.075, 0.2, DENIM, { roughness: 0.8 })
    perna.position.set(s * 0.11, -0.19, 0)
    voce.add(perna)
    const sapato = rbox(0.2, 0.1, 0.3, 0.04, SHOE, { roughness: 0.5 })
    sapato.position.set(s * 0.11, -0.33, 0.06)
    voce.add(sapato)
  }

  const cabecaVoce = voce.getObjectByName('head')
  if (cabecaVoce) {
    const hr = 1.35 * 0.19
    for (const s of [-1, 1]) {
      const sobrancelha = rbox(hr * 0.52, hr * 0.11, hr * 0.13, hr * 0.045, '#3f4034', { roughness: 0.85 })
      sobrancelha.position.set(s * hr * 0.38, hr * 0.46, hr * 0.84)
      sobrancelha.rotation.z = -s * 0.5
      cabecaVoce.add(sobrancelha)
    }
    const gemido = sphere(hr * 0.2, '#4a2f2a', { roughness: 0.5 })
    gemido.scale.set(0.85, 1.3, 0.5)
    gemido.position.set(0, -hr * 0.42, hr * 0.92)
    cabecaVoce.add(gemido)
    // suor frio
    for (const [sx, sy] of [[-0.9, 0.75], [0.95, 0.6]] as const) {
      const gota = capsule(hr * 0.07, hr * 0.09, '#bfe0ef', { roughness: 0.15 })
      gota.position.set(sx * hr, sy * hr, hr * 0.6)
      cabecaVoce.add(gota)
    }
  }
  root.add(voce)

  // ---- a barriga-balão rosa (magen) — o acento -----------------------------
  const barriga = new THREE.Group()
  barriga.position.set(VX, GY + 0.55, VZ + 0.37)

  const balao = sphere(0.58, PINK, { roughness: 0.22 })
  balao.scale.set(1.08, 0.94, 1.0)
  barriga.add(balao)

  const umbigo = sphere(0.075, PINK_DARK, { roughness: 0.35 })
  umbigo.scale.z = 0.5
  umbigo.position.set(0, -0.02, 0.575)
  barriga.add(umbigo)

  const no = cone(0.09, 0.17, PINK_DARK, { roughness: 0.35 })
  no.position.set(0, -0.5, 0.28)
  no.rotation.x = 2.5
  barriga.add(no)

  // veios de inchaço
  for (const s of [-1, 1]) {
    const veio = torus(0.34, 0.014, PINK_DARK, { roughness: 0.4 })
    veio.position.set(s * 0.2, 0.06, 0.36)
    veio.rotation.set(0.35, s * 0.5, 0)
    veio.scale.set(1, 0.7, 0.4)
    barriga.add(veio)
  }
  root.add(barriga)

  // ---- mãos apertando as laterais da barriga -------------------------------
  const bracos = new THREE.Group()
  bracos.position.set(VX, GY + 0.9, VZ + 0.08)
  for (const s of [-1, 1]) {
    const braco = capsule(0.072, 0.3, DENIM, { roughness: 0.8 })
    braco.position.set(s * 0.42, -0.1, 0.2)
    braco.rotation.set(-0.4, 0, -s * 0.78)
    const mao = sphere(0.1, SKIN_GREEN, { roughness: 0.65 })
    mao.position.y = -0.23
    braco.add(mao)
    for (let i = 0; i < 3; i++) {
      const dedo = capsule(0.026, 0.05, SKIN_GREEN, { roughness: 0.65 })
      dedo.position.set((i - 1) * 0.055, -0.29, 0.06)
      dedo.rotation.x = 0.6
      braco.add(dedo)
    }
    bracos.add(braco)
  }
  root.add(bracos)

  // ---- três anéis de dor irradiando ----------------------------------------
  const aneis = new THREE.Group()
  aneis.position.set(VX, GY + 0.86, VZ + 0.65)
  const raios: [number, number, number, string][] = [
    [0.56, 0.036, 0.0, '#c9503a'],
    [0.71, 0.03, 0.16, '#b8402f'],
    [0.86, 0.024, 0.32, '#a63627'],
  ]
  for (const [r, tube, dz, cor] of raios) {
    const anel = torus(r, tube, cor, { roughness: 0.55 })
    anel.position.z = dz
    anel.scale.y = 0.88
    aneis.add(anel)
  }
  root.add(aneis)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cozinha', object: base },
    { name: 'lixeira', group: 'cozinha', object: lixeira },
    { name: 'folha', group: 'ontem', object: folha },
    { name: 'javali', group: 'javali', object: javali },
    { name: 'voce', group: 'voce', object: voce },
    { name: 'barriga', group: 'barriga', object: barriga },
    { name: 'bracos', group: 'barriga', object: bracos },
    { name: 'aneis', group: 'dor', object: aneis },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.85)], {
      ease: 'easeOut',
      caption: 'Cozinha à noite: o piso xadrez branco-e-menta brota do chão…',
    }),
    seq('lixeira-rise', 'lixeira', 1.9, 0.8, [riseFrom(GY, 1.05)], { ease: 'easeOut' }),
    seq('lixeira-tomba', 'lixeira', 2.6, 0.6, [ch('rotation.z', -0.5, 0)]),

    seq('folha-rise', 'folha', 3.9, 0.7, [riseFrom(GY + 0.018, 0.55)], {
      ease: 'easeOut',
      caption: 'No chão, a folha do calendário de ÓN-TI — ontem — com um X vermelho.',
    }),

    seq('javali-rise', 'javali', 5.5, 0.8, [riseFrom(GY, 1.35)], {
      ease: 'easeOut',
      caption: 'O javali garimpou o seu jantar na lixeira e ri soprado: RRÁR!',
    }),
    seq('javali-ri-a', 'javali', 6.5, 0.35, [
      ch('rotation.z', 0, -0.13),
      ch('position.y', GY, GY + 0.09),
    ]),
    seq('javali-ri-b', 'javali', 6.85, 0.45, [
      ch('rotation.z', -0.13, 0.14),
      ch('position.y', GY + 0.09, GY),
    ]),

    seq('voce-rise', 'voce', 7.9, 0.8, [riseFrom(GY + 0.38, 2.0)], {
      ease: 'easeOut',
      caption: 'IÁ — você chega verde de cara, sobrancelhas caídas, boca aberta num gemido.',
    }),

    seq(
      'barriga-grow',
      'barriga',
      9.7,
      0.85,
      [ch('scale.x', 0.01, 1.06), ch('scale.y', 0.01, 1.06), ch('scale.z', 0.01, 1.06)],
      {
        ease: 'easeOut',
        caption: 'Hoje a sua barriga é um balão ROSA do tamanho de um sofá.',
      },
    ),
    seq('barriga-assenta', 'barriga', 10.55, 0.4, [
      ch('scale.x', 1.06, 1),
      ch('scale.y', 1.06, 1),
      ch('scale.z', 1.06, 1),
    ]),
    seq(
      'bracos-brotam',
      'bracos',
      9.9,
      0.7,
      [ch('scale.x', 0.01, 1.3), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('bracos-apertam', 'bracos', 10.8, 0.6, [ch('scale.x', 1.3, 1)]),

    seq(
      'aneis-irradiam',
      'aneis',
      11.9,
      0.8,
      [ch('scale.x', 0.01, 1.1), ch('scale.y', 0.01, 1.1), ch('scale.z', 0.01, 1.1)],
      {
        ease: 'easeOut',
        caption: 'Ela geme: não me MÁ-GUEN! — IÁ RRÁR ÓN-TI MÁ-GUEN → Jag har ont i magen.',
      },
    ),
    seq('aneis-assenta', 'aneis', 12.7, 0.5, [
      ch('scale.x', 1.1, 1),
      ch('scale.y', 1.1, 1),
      ch('scale.z', 1.1, 1),
    ]),
    seq('barriga-lateja-a', 'barriga', 12.7, 0.4, [
      ch('scale.x', 1, 1.05),
      ch('scale.y', 1, 1.05),
      ch('scale.z', 1, 1.05),
    ]),
    seq('barriga-lateja-b', 'barriga', 13.1, 0.5, [
      ch('scale.x', 1.05, 1),
      ch('scale.y', 1.05, 1),
      ch('scale.z', 1.05, 1),
    ]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.6, 3.1, 6.35], target: [0.0, 1.0, 0.25] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-ont-i-magen',
    contexto:
      'Na recepção da vårdcentral ou no 1177. Troque a última palavra: i halsen, i huvudet, i ryggen, i örat.',
    fraseFonte: 'Estou com dor na barriga.',
    fraseAlvo: 'Jag har ont i magen.',
    pronuncia:
      "iá har ONT i MÂ-guen ('g' de 'magen' é duro; 'ont' com o mesmo o de 'onda')",
    ponteSonora:
      "IÁ RRÁR ÓN-TI MÁ-GUEN (6 sílabas; RRÁR = o 'há' do português soprado, com R BRANDO no fim — sem esse R sobra 'ha', outro verbo; ÓN-TI com Ó ABERTO e o N batido na língua, não a nasal engolida de 'ontem'; MÁ-GUEN com GU de GUERRA — o g de 'magen' é DURO, jamais 'ma-jem' — e N final articulado, não 'guem')",
    historia:
      'Ontem um javali te ofereceu jantar: as sobras que ele garimpou na lixeira, focinho enfiado até o fundo, revirando tudo como quem fuça raiz. Ele solta a risada soprada RRÁR! Hoje a sua barriga é um balão rosa do tamanho de um sofá, entupido do que você comeu ÓNTI, e ela geme: não me MÁ-GUEN!',
  },
  createScene,
}

export default card
