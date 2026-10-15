import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, person,
  rbox, capsule, cylinder, sphere, lathe, torus, puff,
} from '../rig/helpers'

/**
 * "Var ligger toaletten?" — o VAR sueco revisa é onde fica o banheiro.
 *
 * Diorama: gramado de estádio com o círculo central; árbitro à esquerda
 * desenhando o quadrado do VAR no ar; telão preto no poste à direita, que
 * LIGA e acende um R gigante; do replay salta um vaso sanitário reluzente
 * com a placa do T colada no R — LÍGUE-R + TOALÉT-EN.
 */

const GRAMA = '#3f8a3a'
const GRAMA_ESCURA = '#356f31'
const TERRA = '#5c4a33'
const METAL = '#8a9099'
const METAL_ESCURO = '#5f666e'
const TELA = '#181c22'
const MOLDURA = '#343a42'
const PRETO = '#2b3038'
const OCRE = '#b8912f'
const SKIN = '#e8c39e'
const CAMISA = '#c05c3a'
const CERAMICA = '#f2f0ea'
const AZUL = '#2f6fd0' // acento reservado: a TOALETE (tampa, água, placa do T)
const LUZ_TELA = '#dfe9ff'

const GY = 0.18 // topo do gramado

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: gramado do estádio -------------------------------
  const base = new THREE.Group()

  const solo = cylinder(2.6, 2.72, 0.12, TERRA, { roughness: 0.95 })
  solo.position.y = 0.06
  base.add(solo)

  const grama = cylinder(2.54, 2.6, 0.07, GRAMA, { roughness: 0.92 })
  grama.position.y = 0.145
  base.add(grama)

  // faixas de corte do cortador (listras claras/escuras), presas dentro do disco
  for (let i = -2; i <= 2; i++) {
    if (i % 2 === 0) continue
    const x = i * 0.85
    const half = Math.sqrt(Math.max(0, 2.45 * 2.45 - (Math.abs(x) + 0.42) ** 2))
    const listra = rbox(0.85, 0.01, half * 2, 0.004, GRAMA_ESCURA, { roughness: 0.92 })
    listra.position.set(x, GY + 0.002, 0)
    base.add(listra)
  }

  // círculo central em cal branca
  const circulo = torus(0.92, 0.022, '#eceae2', { roughness: 0.85 })
  circulo.rotation.x = Math.PI / 2
  circulo.position.set(-0.45, GY + 0.008, 0.4)
  base.add(circulo)

  const marca = cylinder(0.07, 0.07, 0.012, '#eceae2', { roughness: 0.85 })
  marca.position.set(-0.45, GY + 0.006, 0.4)
  base.add(marca)

  // bola parada perto do círculo
  const bola = sphere(0.13, '#efece2', { roughness: 0.45 })
  bola.position.set(0.15, GY + 0.13, 1.28)
  for (let i = 0; i < 4; i++) {
    const gomo = sphere(0.045, '#2b3038', { roughness: 0.5 })
    const a = rand() * Math.PI * 2
    const b = (rand() - 0.5) * 1.4
    gomo.position.set(
      Math.cos(a) * Math.cos(b) * 0.12,
      Math.sin(b) * 0.12,
      Math.sin(a) * Math.cos(b) * 0.12,
    )
    gomo.scale.set(1, 0.5, 1)
    bola.add(gomo)
  }
  base.add(bola)

  // bandeirinha de escanteio
  const mastro = cylinder(0.02, 0.026, 0.72, '#e8e4da', { roughness: 0.6 })
  mastro.position.set(-2.05, GY + 0.36, -0.95)
  mastro.rotation.z = (rand() - 0.5) * 0.12
  const bandeira = rbox(0.22, 0.15, 0.02, 0.02, CAMISA, { roughness: 0.9 })
  bandeira.position.set(0.12, 0.3, 0)
  mastro.add(bandeira)
  base.add(mastro)

  // arbustos fora do campo
  const arbustoA = puff(0.2, '#33682e', 6, 31, { roughness: 0.92 })
  arbustoA.position.set(-1.55, GY + 0.13, -1.85)
  base.add(arbustoA)

  const arbustoB = puff(0.15, '#3a7433', 5, 32, { roughness: 0.92 })
  arbustoB.position.set(2.05, GY + 0.1, 0.95)
  base.add(arbustoB)

  root.add(base)

  // ---- torre do telão (poste + telão), virada para a câmera ----------------
  const torre = new THREE.Group()
  torre.position.set(1.55, GY, -0.35)
  torre.rotation.y = -0.42
  root.add(torre)

  const poste = new THREE.Group()

  const sapata = rbox(0.78, 0.14, 0.66, 0.05, METAL_ESCURO, { roughness: 0.65 })
  sapata.position.y = 0.07
  poste.add(sapata)

  for (const side of [-1, 1]) {
    const perna = cylinder(0.075, 0.1, 1.22, METAL, { roughness: 0.35, metalness: 0.55 })
    perna.position.set(side * 0.42, 0.75, 0)
    poste.add(perna)
  }
  const travessa = rbox(0.9, 0.09, 0.1, 0.03, METAL, { roughness: 0.35, metalness: 0.55 })
  travessa.position.y = 0.72
  poste.add(travessa)

  const cruzeta = rbox(0.98, 0.06, 0.08, 0.025, METAL_ESCURO, { roughness: 0.4, metalness: 0.5 })
  cruzeta.position.y = 1.05
  cruzeta.rotation.z = 0.34
  poste.add(cruzeta)
  torre.add(poste)

  // telão: painel preto com moldura e viseira
  const telao = new THREE.Group()
  telao.position.y = 1.85
  torre.add(telao)

  const moldura = rbox(2.06, 1.36, 0.2, 0.07, MOLDURA, { roughness: 0.45 })
  telao.add(moldura)

  const tela = rbox(1.86, 1.16, 0.08, 0.02, TELA, { roughness: 0.16 })
  tela.position.z = 0.11
  telao.add(tela)

  const viseira = rbox(2.14, 0.07, 0.42, 0.03, MOLDURA, { roughness: 0.5 })
  viseira.position.set(0, 0.72, 0.16)
  viseira.rotation.x = 0.28
  telao.add(viseira)

  for (const side of [-1, 1]) {
    const parafuso = sphere(0.05, METAL, { roughness: 0.3, metalness: 0.7 })
    parafuso.position.set(side * 0.94, -0.6, 0.09)
    telao.add(parafuso)
  }

  // ---- o R gigante que acende na tela --------------------------------------
  const letraR = new THREE.Group()
  letraR.position.set(-0.2, -0.02, 0.17)
  const glifo = new THREE.Group() // escala do glifo fica aqui: letraR anima scale 0→1
  glifo.scale.setScalar(1.3)
  letraR.add(glifo)

  const haste = rbox(0.11, 0.68, 0.07, 0.025, LUZ_TELA, {
    emissive: LUZ_TELA,
    emissiveIntensity: 1.2,
  })
  haste.position.x = -0.17
  glifo.add(haste)

  const barriga = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.058, 16, 32, Math.PI),
    mat(LUZ_TELA, { emissive: LUZ_TELA, emissiveIntensity: 1.2 }),
  )
  barriga.castShadow = true
  barriga.rotation.z = -Math.PI / 2
  barriga.position.set(-0.12, 0.17, 0)
  glifo.add(barriga)

  const travessaR = rbox(0.16, 0.09, 0.07, 0.02, LUZ_TELA, {
    emissive: LUZ_TELA,
    emissiveIntensity: 1.2,
  })
  travessaR.position.set(-0.09, 0.34, 0)
  glifo.add(travessaR)
  const travessaMeio = rbox(0.1, 0.11, 0.07, 0.02, LUZ_TELA, {
    emissive: LUZ_TELA,
    emissiveIntensity: 1.2,
  })
  travessaMeio.position.set(-0.12, 0.0, 0)
  glifo.add(travessaMeio)

  // perna diagonal: do pé da barriga (esq.) até a base (dir.)
  const perna = rbox(0.11, 0.42, 0.07, 0.025, LUZ_TELA, {
    emissive: LUZ_TELA,
    emissiveIntensity: 1.2,
  })
  perna.position.set(-0.01, -0.165, 0)
  perna.rotation.z = 0.475
  glifo.add(perna)
  telao.add(letraR)

  // ---- placa do banheiro: o T colado no R ----------------------------------
  const placaT = new THREE.Group()
  placaT.position.set(0.42, -0.02, 0.19)

  const chapa = rbox(0.5, 0.62, 0.08, 0.05, AZUL, { roughness: 0.32 })
  placaT.add(chapa)

  const tVert = rbox(0.1, 0.34, 0.05, 0.02, '#f4f2ec', { roughness: 0.4 })
  tVert.position.set(0, -0.06, 0.06)
  placaT.add(tVert)

  const tHoriz = rbox(0.3, 0.1, 0.05, 0.02, '#f4f2ec', { roughness: 0.4 })
  tHoriz.position.set(0, 0.15, 0.06)
  placaT.add(tHoriz)
  telao.add(placaT)

  // ---- árbitro (olha para o telão, olhos em +z local) ----------------------
  const arbitro = person({ body: PRETO, skin: SKIN, height: 1.5, armAngle: 0.5 })
  arbitro.position.set(-1.45, GY, 0.45)
  arbitro.rotation.y = 1.45

  // braços erguidos à frente, desenhando o quadrado
  const bracoE = arbitro.getObjectByName('armL')!
  bracoE.rotation.set(-2.0, 0, 0.3)
  const bracoD = arbitro.getObjectByName('armR')!
  bracoD.rotation.set(-2.0, 0, -0.3)

  // faixa amarela do uniforme
  const faixaUniforme = cylinder(0.263, 0.263, 0.17, OCRE, { roughness: 0.9 })
  faixaUniforme.position.y = 0.42
  arbitro.add(faixaUniforme)

  // apito pendurado no pescoço
  const cordao = torus(0.1, 0.014, '#1f2228', { roughness: 0.9 })
  cordao.position.y = 0.76
  cordao.rotation.x = Math.PI / 2 - 0.35
  arbitro.add(cordao)
  const apito = capsule(0.032, 0.06, '#e0dcd2', { roughness: 0.4 })
  apito.position.set(0, 0.68, 0.13)
  apito.rotation.x = Math.PI / 2
  arbitro.add(apito)

  // cabelo curto na cabeça do person()
  const cabelo = sphere(0.288, '#2a211c', { roughness: 0.85 })
  cabelo.scale.set(1, 0.66, 1)
  cabelo.position.y = 0.1
  arbitro.getObjectByName('head')!.add(cabelo)
  root.add(arbitro)

  // ---- quadrado do VAR desenhado no ar (filho do árbitro) ------------------
  const quadrado = new THREE.Group()
  quadrado.position.set(0.02, 0.7, 0.34)
  quadrado.rotation.y = -0.5

  for (const sy of [-1, 1]) {
    const barra = rbox(0.68, 0.055, 0.055, 0.025, '#f2f4f8', {
      emissive: '#dbe6ff',
      emissiveIntensity: 0.9,
    })
    barra.position.y = sy * 0.23
    quadrado.add(barra)
  }
  for (const sx of [-1, 1]) {
    const barra = rbox(0.055, 0.51, 0.055, 0.025, '#f2f4f8', {
      emissive: '#dbe6ff',
      emissiveIntensity: 0.9,
    })
    barra.position.x = sx * 0.31
    quadrado.add(barra)
  }
  arbitro.add(quadrado)

  // ---- jogador de pernas cruzadas -----------------------------------------
  const jogador = new THREE.Group()
  jogador.position.set(-0.35, GY, -1.5)
  jogador.rotation.y = 1.03

  const corpoJogador = person({ body: CAMISA, skin: SKIN, height: 1.2, armAngle: 0.12 })
  corpoJogador.position.y = 0.56
  jogador.add(corpoJogador)

  const shorts = capsule(0.2, 0.1, '#efece4', { roughness: 0.9 })
  shorts.position.y = 0.58
  jogador.add(shorts)

  // pernas cruzadas, uma passando na frente da outra
  const pernas: [number, number, number, number][] = [
    [-0.07, 0.29, 0.0, 0.24],
    [0.09, 0.28, 0.13, -0.4],
  ]
  for (const [px, py, pz, rz] of pernas) {
    const coxa = capsule(0.082, 0.36, SKIN, { roughness: 0.8 })
    coxa.position.set(px, py, pz)
    coxa.rotation.z = rz
    const meiao = capsule(0.086, 0.12, CAMISA, { roughness: 0.9 })
    meiao.position.y = -0.16
    coxa.add(meiao)
    const chuteira = rbox(0.11, 0.07, 0.22, 0.03, '#22252b', { roughness: 0.55 })
    chuteira.position.set(0, -0.26, 0.05)
    chuteira.rotation.z = -rz
    coxa.add(chuteira)
    jogador.add(coxa)
  }
  root.add(jogador)

  // ---- o vaso sanitário que salta do replay --------------------------------
  const vaso = new THREE.Group()
  vaso.position.set(0.7, 1.05, 0.75)
  vaso.rotation.y = 0.55

  const bacia = lathe(
    [
      [0.17, 0], [0.19, 0.05], [0.14, 0.15], [0.12, 0.3], [0.18, 0.42],
      [0.26, 0.5], [0.29, 0.55], [0.27, 0.58], [0.23, 0.55], [0.2, 0.5],
      [0.12, 0.42], [0.06, 0.4], [0, 0.39],
    ],
    CERAMICA,
    { roughness: 0.14 },
  )
  bacia.position.z = 0.05
  bacia.scale.z = 1.2
  vaso.add(bacia)

  const agua = cylinder(0.16, 0.15, 0.03, AZUL, { roughness: 0.1 })
  agua.position.set(0, 0.42, 0.05)
  agua.scale.z = 1.2
  vaso.add(agua)

  const caixa = rbox(0.46, 0.46, 0.22, 0.05, CERAMICA, { roughness: 0.14 })
  caixa.position.set(0, 0.72, -0.34)
  vaso.add(caixa)

  const tampaCaixa = rbox(0.5, 0.06, 0.26, 0.02, CERAMICA, { roughness: 0.14 })
  tampaCaixa.position.set(0, 0.98, -0.34)
  vaso.add(tampaCaixa)

  const botao = cylinder(0.06, 0.06, 0.03, METAL, { roughness: 0.25, metalness: 0.7 })
  botao.position.set(0, 1.02, -0.34)
  vaso.add(botao)
  root.add(vaso)

  // tampa azul: dobradiça na traseira da bacia
  const tampa = new THREE.Group()
  tampa.position.set(0, 0.6, -0.16)
  tampa.rotation.x = -1.5 // aberta, encostada na caixa: a bacia fica à vista
  const tabua = rbox(0.46, 0.055, 0.6, 0.025, AZUL, { roughness: 0.3 })
  tabua.position.z = 0.3
  tampa.add(tabua)
  const dobradica = cylinder(0.028, 0.028, 0.3, METAL, { roughness: 0.25, metalness: 0.7 })
  dobradica.rotation.z = Math.PI / 2
  tampa.add(dobradica)
  vaso.add(tampa)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'poste', group: 'estadio', object: poste },
    { name: 'telao', group: 'estadio', object: telao },
    { name: 'jogador', group: 'campo', object: jogador },
    { name: 'arbitro', group: 'campo', object: arbitro },
    { name: 'quadrado', group: 'var', object: quadrado },
    { name: 'letraR', group: 'var', object: letraR },
    { name: 'vaso', group: 'banheiro', object: vaso },
    { name: 'placaT', group: 'banheiro', object: placaT },
    { name: 'tampa', group: 'banheiro', object: tampa },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.85)], {
      ease: 'easeOut',
      caption: 'Jogo parado: o gramado do estádio brota em silêncio…',
    }),

    seq('poste-rise', 'poste', 1.8, 0.8, [riseFrom(0, 1.5)], {
      ease: 'easeOut',
      caption: '…e sobe o poste do telão gigante à beira do campo.',
    }),
    seq(
      'telao-unfold',
      'telao',
      2.05,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('jogador-rise', 'jogador', 3.7, 0.85, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'O jogador cruza as pernas, desesperado — o árbitro para tudo…',
    }),
    seq('arbitro-rise', 'arbitro', 3.9, 0.85, [riseFrom(GY, 1.8)], { ease: 'easeOut' }),

    seq(
      'quadrado-draw',
      'quadrado',
      5.5,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: '…e desenha o quadrado no ar: VAR!' },
    ),
    seq(
      'letraR-on',
      'letraR',
      6.4,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: 'O telão LIGA e acende um R enorme — LÍGUE-R…' },
    ),

    seq(
      'vaso-jump',
      'vaso',
      8.0,
      0.9,
      [
        ch('position.x', 1.55, 0.7),
        ch('position.y', 2.03, 1.22),
        ch('position.z', -0.3, 0.75),
        ch('scale.x', 0.01, 1),
        ch('scale.y', 0.01, 1),
        ch('scale.z', 0.01, 1),
        ch('rotation.y', -0.9, 0.55),
      ],
      {
        ease: 'easeOut',
        caption: '…e no replay salta um vaso reluzente, com o T colado no R: TOALÉT-EN!',
      },
    ),
    seq('tampa-hold', 'tampa', 8.0, 0.9, [ch('rotation.x', 0, 0)]),
    seq(
      'placaT-pop',
      'placaT',
      8.3,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('vaso-settle', 'vaso', 8.9, 0.6, [ch('position.y', 1.22, 1.05)]),

    seq('tampa-open', 'tampa', 9.6, 0.7, [ch('rotation.x', 0, -1.5)], {
      ease: 'easeOut',
      caption: 'Var ligger toaletten? — "Onde fica o banheiro?"',
    }),
    seq('jogador-lean', 'jogador', 9.8, 0.6, [ch('rotation.z', 0, 0.14)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.15, 2.85, 5.7], target: [0.15, 1.3, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-ligger-toaletten',
    contexto: 'Café, restaurante, shopping, consultório, casa de amigos.',
    fraseFonte: 'Onde fica o banheiro?',
    fraseAlvo: 'Var ligger toaletten?',
    pronuncia: "var LÍG-ger to-a-LÊT-ten (g duro de 'gato'; acento em 'LET')",
    ponteSonora:
      "VAR! LÍGUE-R TOALÉT-EN! (sem o 'O' no meio: o R de LÍGUER emenda direto no T de TOALETE, sem respiro)",
    historia:
      'Jogo parado, estádio em silêncio: o jogador cruza as pernas desesperado e o árbitro desenha o quadrado do VAR no ar. O telão LIGA — e em vez do replay do gol aparece, em 4K e giro lento, um vaso sanitário reluzente. O VAR na Suécia revisa é onde fica o banheiro.',
  },
  createScene,
}

export default card
