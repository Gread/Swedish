import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Det var jättegott, tack!" — DÊ, VÁR! IÉ-TE-GÓT — TAC!
 *
 * A cena inteira é uma piada de ESCALA: 'jätte' quer dizer GIGANTE, e quem
 * jantou é um YETI ('iéte') colossal, encolhido sobre uma mesinha que mal
 * chega no joelho dele. Tigela raspada até brilhar (GÓT = GÓSTOSO), barriga
 * estufada, e a pata que desce na tábua: TAC!
 *
 * Diorama: piso de madeira, tapete vermelho-tijolo, mesinha mel de pés finos,
 * panela de ferro tombada no tapete, yeti branco-azulado sentado, tábua
 * escura ao lado da pata.
 */

const PISO = '#5a3d28'
const TIJOLO = '#a8442f'
const TIJOLO_ESC = '#8c3626'
const MEL = '#b8813f'
const MEL_ESC = '#96652d'
const MADEIRA_ESC = '#4a3524'
const YETI = '#dae5f0'
const YETI_ESC = '#b9c9dc'
const YETI_CLARO = '#eef4fa'
const COURO = '#93a8bd'
const FERRO = '#3c4249'
const AMBAR = '#f2a01e' // acento reservado: a TIGELA raspada (GÓT = gostoso)
const LINGUA = '#e0808c'

const FY = 0.12 // topo do piso de madeira
const RY = 0.17 // topo do tapete

// pose do braço: em repouso sobre a tábua (pose final) e erguido (meio do clipe)
const PATA_BAIXO = 0.29
const PATA_ALTO = 2.25

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- sala: piso + tapete vermelho-tijolo ---------------------------------
  const base = new THREE.Group()

  const piso = cylinder(2.62, 2.7, 0.12, PISO, { roughness: 0.75 })
  piso.position.y = 0.06
  base.add(piso)

  // tábuas do assoalho: lâminas finas sobre o disco
  for (let i = -3; i <= 3; i++) {
    const meia = Math.sqrt(Math.max(0, 2.55 * 2.55 - (i * 0.66) * (i * 0.66)))
    const ripa = rbox(meia * 2, 0.012, 0.6, 0.005, i % 2 === 0 ? PISO : '#63432c', { roughness: 0.75 })
    ripa.position.set(0, FY + 0.006, i * 0.66)
    base.add(ripa)
  }

  const tapete = cylinder(1.88, 1.92, 0.05, TIJOLO, { roughness: 0.92 })
  tapete.position.y = 0.145
  base.add(tapete)

  const medalhao = cylinder(0.98, 1.0, 0.012, TIJOLO_ESC, { roughness: 0.92 })
  medalhao.position.y = RY + 0.005
  base.add(medalhao)

  const franja = torus(1.9, 0.035, TIJOLO_ESC, { roughness: 0.92 })
  franja.rotation.x = Math.PI / 2
  franja.position.y = 0.15
  base.add(franja)

  // adereços de sala espalhados com rng fixo
  for (const [cx, cz, cor] of [[1.62, 1.32, '#4f6a7d'], [-1.55, -0.98, '#5c7387']] as const) {
    const almofada = rbox(0.42, 0.13, 0.38, 0.06, cor, { roughness: 0.92 })
    almofada.position.set(cx, RY + 0.065, cz)
    almofada.rotation.y = (rand() - 0.5) * 1.2
    base.add(almofada)
  }

  const vaso = lathe(
    [[0, 0], [0.15, 0], [0.17, 0.06], [0.14, 0.2], [0.16, 0.26], [0.14, 0.27], [0.12, 0.2], [0, 0.19]],
    '#8a6a4e',
    { roughness: 0.6 },
  )
  vaso.position.set(2.2, FY, -1.0)
  base.add(vaso)
  const folhagem = puff(0.28, '#4f7d46', 6, 31, { roughness: 0.9 })
  folhagem.position.set(2.2, FY + 0.5, -1.0)
  base.add(folhagem)

  const guardanapo = rbox(0.26, 0.02, 0.2, 0.01, '#e6dcc8', { roughness: 0.92 })
  guardanapo.position.set(0.05, RY + 0.01, 1.42)
  guardanapo.rotation.set(0, rand() * Math.PI, 0.06)
  base.add(guardanapo)

  root.add(base)

  // ---- mesinha minúscula ---------------------------------------------------
  const mesinha = new THREE.Group()
  mesinha.position.set(-0.62, RY, 0.72)
  mesinha.rotation.y = 0.22
  root.add(mesinha)

  const tampo = rbox(0.62, 0.05, 0.44, 0.02, MEL, { roughness: 0.55 })
  tampo.position.y = 0.4
  mesinha.add(tampo)

  const saia = rbox(0.56, 0.04, 0.38, 0.015, MEL_ESC, { roughness: 0.7 })
  saia.position.y = 0.355
  mesinha.add(saia)

  for (const px of [-1, 1]) {
    for (const pz of [-1, 1]) {
      const perna = cylinder(0.02, 0.028, 0.34, MEL_ESC, { roughness: 0.7 })
      perna.position.set(px * 0.25, 0.17, pz * 0.16)
      mesinha.add(perna)
    }
  }

  // ---- tigela raspada (acento âmbar) — filha da mesinha ---------------------
  const tigela = new THREE.Group()
  tigela.position.set(0.03, 0.425, -0.01)
  mesinha.add(tigela)

  const cuia = lathe(
    [
      [0, 0], [0.06, 0], [0.13, 0.03], [0.175, 0.1], [0.185, 0.15],
      [0.165, 0.155], [0.148, 0.1], [0.11, 0.045], [0.05, 0.032], [0, 0.03],
    ],
    AMBAR,
    { roughness: 0.15 },
  )
  tigela.add(cuia)

  const aro = torus(0.172, 0.014, '#c9821a', { roughness: 0.2 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.152
  tigela.add(aro)

  // brilhos de "raspada até brilhar"
  for (const [bx, by, bz] of [[0.1, 0.19, 0.09], [-0.13, 0.16, -0.05], [0.02, 0.22, -0.13]] as const) {
    const faisca = sphere(0.022, '#fff6d0', { emissive: '#ffe9a3', emissiveIntensity: 1.2 })
    faisca.position.set(bx, by, bz)
    tigela.add(faisca)
  }

  // colherzinha, minúscula perto da pata do yeti
  const colher = new THREE.Group()
  colher.position.set(0.24, 0.44, 0.13)
  colher.rotation.set(0, -0.5, 0.1)
  const cabo = cylinder(0.011, 0.013, 0.24, MEL_ESC, { roughness: 0.5 })
  cabo.rotation.z = Math.PI / 2
  colher.add(cabo)
  const concha = sphere(0.045, '#cfd6dd', { roughness: 0.25, metalness: 0.6 })
  concha.scale.set(1, 0.35, 0.75)
  concha.position.x = -0.15
  colher.add(concha)
  mesinha.add(colher)

  // ---- panela de ferro tombada no tapete -----------------------------------
  const panela = new THREE.Group()
  panela.position.set(-1.38, RY, 0.36)
  panela.rotation.set(0, 0.4, -1.42) // tombada de lado
  root.add(panela)

  const corpoPanela = lathe(
    [[0, 0], [0.19, 0], [0.21, 0.05], [0.22, 0.24], [0.235, 0.27], [0.205, 0.27], [0.195, 0.24], [0.185, 0.05], [0, 0.045]],
    FERRO,
    { roughness: 0.3, metalness: 0.75 },
  )
  panela.add(corpoPanela)

  const caboPanela = cylinder(0.022, 0.022, 0.44, FERRO, { roughness: 0.32, metalness: 0.7 })
  caboPanela.rotation.z = Math.PI / 2
  caboPanela.position.set(0.44, 0.16, 0)
  panela.add(caboPanela)

  const ponteira = sphere(0.04, MADEIRA_ESC, { roughness: 0.7 })
  ponteira.position.set(0.67, 0.16, 0)
  panela.add(ponteira)

  // ---- YETI GIGANTE --------------------------------------------------------
  const yeti = new THREE.Group()
  yeti.position.set(0.82, RY, -0.38)
  yeti.rotation.y = -0.95 // olha (+z local) para a mesinha
  root.add(yeti)

  const quadril = sphere(0.5, YETI, { roughness: 0.88 })
  quadril.scale.set(1.05, 0.8, 1.1)
  quadril.position.set(0, 0.42, 0.06)
  yeti.add(quadril)

  const torso = capsule(0.52, 0.85, YETI, { roughness: 0.88 })
  torso.position.y = 1.25
  yeti.add(torso)

  // pernas dobradas para a frente: joelhos altos, pés enormes
  for (const side of [-1, 1]) {
    const coxa = capsule(0.29, 0.44, YETI, { roughness: 0.88 })
    coxa.position.set(side * 0.36, 0.32, 0.4)
    coxa.rotation.x = Math.PI / 2
    yeti.add(coxa)

    const canela = capsule(0.24, 0.3, YETI_ESC, { roughness: 0.88 })
    canela.position.set(side * 0.36, 0.26, 0.78)
    canela.rotation.x = Math.PI / 2
    yeti.add(canela)

    const pe = sphere(0.3, YETI_ESC, { roughness: 0.88 })
    pe.scale.set(0.85, 0.62, 1.15)
    pe.position.set(side * 0.36, 0.2, 1.0)
    yeti.add(pe)

    const sola = sphere(0.22, COURO, { roughness: 0.75 })
    sola.scale.set(0.8, 0.3, 1.0)
    sola.position.set(side * 0.36, 0.09, 1.06)
    yeti.add(sola)

    for (let d = 0; d < 3; d++) {
      const dedo = sphere(0.055, COURO, { roughness: 0.75 })
      dedo.position.set(side * (0.22 + d * 0.13), 0.16, 1.24)
      yeti.add(dedo)
    }

    // tufos de pelo nos ombros
    const tufo = puff(0.16, YETI_CLARO, 5, 40 + side, { roughness: 0.92 })
    tufo.position.set(side * 0.48, 1.82, 0.02)
    yeti.add(tufo)
  }

  // braço esquerdo apoiado no chão (o direito é a peça 'pata')
  const bracoE = capsule(0.19, 0.6, YETI, { roughness: 0.88 })
  bracoE.position.set(-0.66, 1.15, 0.18)
  bracoE.rotation.set(0.15, 0, 0.28)
  yeti.add(bracoE)

  const punhoE = sphere(0.26, YETI_ESC, { roughness: 0.88 })
  punhoE.position.set(-0.9, 0.45, 0.3)
  yeti.add(punhoE)

  // ---- barriga estufada (peça: cresce) -------------------------------------
  const barriga = new THREE.Group()
  barriga.position.set(0, 1.02, 0.3)
  yeti.add(barriga)

  const pancaBase = sphere(0.54, YETI_CLARO, { roughness: 0.86 })
  pancaBase.scale.set(1.02, 0.9, 0.95)
  barriga.add(pancaBase)

  const umbigo = sphere(0.05, YETI_ESC, { roughness: 0.9 })
  umbigo.position.set(0, -0.06, 0.5)
  barriga.add(umbigo)

  // ---- cabeça: olhos revirados de prazer -----------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 2.26, 0.06)
  yeti.add(cabeca)

  const cranio = sphere(0.44, YETI, { roughness: 0.88 })
  cranio.scale.set(1, 0.96, 1)
  cabeca.add(cranio)

  const coroa = puff(0.24, YETI_CLARO, 6, 55, { roughness: 0.92 })
  coroa.position.set(0, 0.34, -0.04)
  cabeca.add(coroa)

  const focinho = sphere(0.27, YETI_ESC, { roughness: 0.86 })
  focinho.scale.set(0.9, 0.72, 1.05)
  focinho.position.set(0, -0.11, 0.31)
  cabeca.add(focinho)

  const nariz = sphere(0.09, '#3a4450', { roughness: 0.3 })
  nariz.scale.set(1.2, 0.8, 1)
  nariz.position.set(0, 0.01, 0.5)
  cabeca.add(nariz)

  // boca aberta de satisfação
  const boca = sphere(0.15, '#5c2a30', { roughness: 0.5 })
  boca.scale.set(1.1, 0.72, 0.5)
  boca.position.set(0, -0.24, 0.42)
  cabeca.add(boca)

  for (const side of [-1, 1]) {
    const presa = cone(0.045, 0.11, '#f4f1e6', { roughness: 0.35 })
    presa.position.set(side * 0.1, -0.19, 0.47)
    presa.rotation.x = 0.25
    presa.rotation.z = Math.PI
    cabeca.add(presa)

    // olhos revirados: esclera achatada com a pupila lá em cima
    const esclera = sphere(0.105, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.18, 0.09, 0.35)
    esclera.scale.z = 0.6
    const pupila = sphere(0.048, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.18, 0.15, 0.41)
    cabeca.add(esclera, pupila)

    const palpebra = sphere(0.108, YETI, { roughness: 0.88 })
    palpebra.scale.set(1, 0.55, 0.62)
    palpebra.position.set(side * 0.18, 0.025, 0.352)
    cabeca.add(palpebra)

    const sobrancelha = capsule(0.028, 0.14, YETI_ESC, { roughness: 0.9 })
    sobrancelha.position.set(side * 0.19, 0.24, 0.36)
    sobrancelha.rotation.set(0, 0, Math.PI / 2 - side * 0.35)
    cabeca.add(sobrancelha)

    const orelha = capsule(0.05, 0.08, YETI_ESC, { roughness: 0.9 })
    orelha.position.set(side * 0.43, 0.06, -0.02)
    orelha.rotation.z = Math.PI / 2
    cabeca.add(orelha)
  }

  // ---- língua lambendo o beiço (dobradiça na boca) -------------------------
  const lingua = new THREE.Group()
  lingua.position.set(0, -0.26, 0.44)
  lingua.rotation.x = -2.2 // pose final: virada para cima, no beiço
  cabeca.add(lingua)

  const linguaMesh = capsule(0.075, 0.14, LINGUA, { roughness: 0.35 })
  linguaMesh.scale.set(1.25, 1, 0.55)
  linguaMesh.position.y = -0.12
  lingua.add(linguaMesh)

  // ---- tábua de madeira escura (filha do yeti: sob a pata) -----------------
  const tabua = new THREE.Group()
  tabua.position.set(1.16, 0, 0.1)
  tabua.rotation.y = -0.25
  yeti.add(tabua)

  const prancha = rbox(0.66, 0.06, 0.44, 0.025, MADEIRA_ESC, { roughness: 0.7 })
  prancha.position.y = 0.03
  tabua.add(prancha)

  const veio = rbox(0.5, 0.012, 0.05, 0.005, '#3a2818', { roughness: 0.7 })
  veio.position.y = 0.062
  tabua.add(veio)

  const alca = torus(0.055, 0.016, MADEIRA_ESC, { roughness: 0.7 })
  alca.rotation.y = Math.PI / 2
  alca.position.set(-0.36, 0.03, 0)
  tabua.add(alca)

  // ---- pata direita: telescopa do ombro, ergue e BATE ----------------------
  const pata = new THREE.Group()
  pata.position.set(0.6, 1.85, 0.05)
  pata.rotation.z = PATA_BAIXO // pose final: caída sobre a tábua
  yeti.add(pata)

  const braco = capsule(0.2, 0.52, YETI, { roughness: 0.88 })
  braco.position.y = -0.44
  pata.add(braco)

  const antebraco = capsule(0.18, 0.42, YETI, { roughness: 0.88 })
  antebraco.position.y = -1.0
  pata.add(antebraco)

  const punho = sphere(0.29, YETI_ESC, { roughness: 0.88 })
  punho.scale.set(1, 0.72, 1.15)
  punho.position.y = -1.42
  pata.add(punho)

  const palma = sphere(0.21, COURO, { roughness: 0.75 })
  palma.scale.set(0.95, 0.3, 1.0)
  palma.position.y = -1.55
  pata.add(palma)

  for (let d = 0; d < 4; d++) {
    const dedo = capsule(0.052, 0.08, YETI_ESC, { roughness: 0.88 })
    dedo.position.set(-0.15 + d * 0.1, -1.5, 0.28)
    dedo.rotation.x = Math.PI / 2
    pata.add(dedo)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'mesinha', group: 'mesa', object: mesinha },
    { name: 'panela', group: 'mesa', object: panela },
    { name: 'yeti', group: 'yeti', object: yeti },
    { name: 'cabeca', group: 'yeti', object: cabeca },
    { name: 'pata', group: 'yeti', object: pata },
    { name: 'tigela', group: 'gott', object: tigela },
    { name: 'barriga', group: 'gott', object: barriga },
    { name: 'lingua', group: 'gott', object: lingua },
    { name: 'tabua', group: 'tac', object: tabua },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma sala sobe do chão: assoalho de madeira e tapete vermelho-tijolo.',
    }),

    seq('mesinha-rise', 'mesinha', 1.9, 0.7, [riseFrom(RY, 0.9)], {
      ease: 'easeOut',
      caption: 'No meio dela, uma MESINHA minúscula de pés finos — e a panela de ferro tombada.',
    }),
    seq('panela-rise', 'panela', 2.05, 0.7, [riseFrom(RY, 0.9)], { ease: 'easeOut' }),

    seq('yeti-rise', 'yeti', 3.7, 0.9, [riseFrom(RY, 3.1)], {
      ease: 'easeOut',
      caption: 'E brota quem jantou: um YETI — IÉ-TE — porque "jätte" quer dizer GIGANTE mesmo.',
    }),
    seq('cabeca-sobe', 'cabeca', 3.95, 0.7, [ch('position.y', 1.35, 2.26)], { ease: 'easeOut' }),
    seq('pata-cresce', 'pata', 4.1, 0.7, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),

    seq(
      'tigela-cresce',
      'tigela',
      5.9,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'A mesinha bate no joelho dele — e a tigela, raspada até brilhar, sumiu na pata.',
      },
    ),
    seq(
      'barriga-estufa',
      'barriga',
      6.15,
      0.75,
      [ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1)],
      { ease: 'easeOut' },
    ),
    seq('lingua-lambe', 'lingua', 6.4, 0.6, [ch('rotation.x', -0.2, -2.2)], {
      caption: 'Ele revira os olhos, estufa a barriga e ruge: "DÊ, VÁR! IÉ-TE-GÓT!" (GÓT = GÓSTOSO).',
    }),

    seq('tabua-rise', 'tabua', 8.1, 0.7, [riseFrom(0, 0.75)], {
      ease: 'easeOut',
      caption: 'Ao lado da pata, uma tábua de madeira escura sobe do tapete…',
    }),
    seq('pata-ergue', 'pata', 9.3, 0.7, [ch('rotation.z', PATA_BAIXO, PATA_ALTO)], {
      ease: 'easeOut',
    }),

    seq('pata-bate', 'pata', 10.6, 0.35, [ch('rotation.z', PATA_ALTO, PATA_BAIXO)], {
      ease: 'easeIn',
      caption: '…e a pata desce: TAC! — Det var jättegott, tack!',
    }),
    seq('tabua-tranco', 'tabua', 10.9, 0.2, [ch('position.y', 0, 0.09)], { ease: 'easeOut' }),
    seq('tabua-pousa', 'tabua', 11.1, 0.35, [ch('position.y', 0.09, 0)], { ease: 'easeIn' }),
    seq('panela-pula', 'panela', 10.92, 0.3, [ch('position.y', RY, RY + 0.16)], { ease: 'easeOut' }),
    seq('panela-rola', 'panela', 11.22, 0.45, [
      ch('position.y', RY + 0.16, RY),
      ch('rotation.y', 0.4 - 0.5, 0.4),
    ], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.9, 3.15, 6.2], target: [0.1, 1.15, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-var-jattegott',
    contexto:
      'No fim da refeição, ao garçom, ou — mais importante — na casa de quem cozinhou para ele.',
    fraseFonte: 'Estava delicioso, obrigado!',
    fraseAlvo: 'Det var jättegott, tack!',
    pronuncia:
      "de var IÉT-te-got, tak ('jätte' com j = i: IÉT-te; 'gott' com g duro)",
    ponteSonora:
      "DÊ, VÁR! IÉ-TE-GÓT — TAC! (6 sílabas, tônica forte em IÉ; VÁR com R BRANDO à caipira, nunca o R raspado de fim de sílaba; IÉ-TE = YETI dito 'iéte' — e 'jätte' quer dizer GIGANTE mesmo; GÓT = o começo de GÓSTOSO, com g duro de 'gato', ó aberto e T seco)",
    historia:
      'O yeti do andar de cima desceu pro jantar, sentou numa mesinha que bate no joelho dele e raspou a tigela até ela brilhar. Ele aponta pro vazio e grunhe DÊ, VÁR!, revira os olhos, estufa a barriga e ruge IÉ-TE-GÓT! — porque jätte é GIGANTE e gott é GÓSTOSO. Aí bate a pata na tábua: TAC! e o lustre do vizinho cai.',
  },
  createScene,
  refine: { organic: ['yeti', 'cabeca', 'pata', 'barriga', 'lingua'] },
}

export default card
