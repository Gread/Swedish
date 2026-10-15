import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Vad heter det på svenska?" — VÁ, RRÊ-ter! DÊ PÔ SVÊNS-ka!
 *
 * Diorama de sala: você aponta pra uma cadeira sem saber o nome dela; o alce
 * SVEN raspa a garganta ("RRÊÊ" = heter) e sopra um PÔ azul-e-amarelo (på)
 * por cima. A cadeira tomba sob o pó e do pó ergue-se um balão de fala de
 * papelão gigante com a palavra sueca dentro: STOL.
 */

const GY = 0.2 // topo da base do diorama

const FLOOR = '#c9b189'
const FLOOR_TOP = '#ddc9a4'
const WOOD = '#9a6b3f'
const WOOD_DARK = '#6f4a2a'
const MOOSE = '#7a5333'
const MOOSE_DARK = '#5b3d24'
const MOOSE_LIGHT = '#9a7048'
const BONE = '#d9cdb4'
const SKIN = '#e8c39e'
const SHIRT = '#48607a'
const CARD = '#c8a97e'
const CARD_LIGHT = '#e3cfa8'
const INK = '#33465c'
// acento saturado, reservado ao PÔ (på): o par da bandeira sueca
const SWE_BLUE = '#1f6fc4'
const SWE_YELLOW = '#f6c423'

/** Traço de letra: tubo ao longo de uma polilinha no plano xy. */
function stroke(points: [number, number][], radius = 0.042) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y]) => new THREE.Vector3(x, y, 0)),
  )
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 48, radius, 10, false),
    mat(INK, { roughness: 0.6, size: 0.4 }),
  )
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(19)

  // ---- base do diorama: um pedaço de sala ----------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.6, 2.68, 0.14, FLOOR, { roughness: 0.85 })
  slab.position.y = 0.07
  base.add(slab)

  const boards = cylinder(2.52, 2.6, 0.06, FLOOR_TOP, { roughness: 0.75 })
  boards.position.y = 0.17
  base.add(boards)

  // tapete
  const rug = cylinder(0.95, 0.95, 0.025, '#a3705c', { roughness: 0.95 })
  rug.position.set(-1.25, GY + 0.012, 1.1)
  rug.scale.z = 0.72
  rug.rotation.y = rand() * Math.PI
  base.add(rug)

  // vaso com planta
  const vaso = lathe(
    [[0, 0], [0.17, 0], [0.19, 0.06], [0.16, 0.26], [0.185, 0.32], [0.16, 0.34], [0, 0.34]],
    '#a9704f',
    { roughness: 0.5 },
  )
  vaso.position.set(2.0, GY, 0.85)
  vaso.rotation.y = rand() * Math.PI
  const folhas = puff(0.24, '#4a7a45', 6, 41, { roughness: 0.9 })
  folhas.position.y = 0.5
  vaso.add(folhas)
  base.add(vaso)

  // caixa de papelão
  const caixa = rbox(0.42, 0.36, 0.36, 0.03, '#b08f63', { roughness: 0.9 })
  caixa.position.set(-2.05, GY + 0.18, -0.85)
  caixa.rotation.y = (rand() - 0.5) * 0.8
  const fita = rbox(0.44, 0.05, 0.04, 0.012, '#8d6f4b', { roughness: 0.85 })
  fita.position.y = 0.185
  caixa.add(fita)
  base.add(caixa)

  // pilha de livros
  const pilha = new THREE.Group()
  pilha.position.set(1.9, GY, -1.15)
  for (let i = 0; i < 3; i++) {
    const cores = ['#5d6f80', '#8a5a52', '#6b7a5a']
    const livro = rbox(0.4 - i * 0.03, 0.08, 0.28, 0.015, cores[i], { roughness: 0.8 })
    livro.position.y = 0.045 + i * 0.085
    livro.rotation.y = (rand() - 0.5) * 0.5
    pilha.add(livro)
  }
  base.add(pilha)

  root.add(base)

  // ---- a cadeira (o objeto sem nome) ---------------------------------------
  // pivô no pé esquerdo: a peça tomba girando em torno dele, sem furar o chão.
  const cadeira = new THREE.Group()
  cadeira.position.set(0.0, GY, 0.35)
  cadeira.rotation.y = 0.2
  cadeira.rotation.z = 1.35 // pose final: tombada

  const chairInner = new THREE.Group()
  chairInner.position.x = 0.28
  cadeira.add(chairInner)

  const assento = rbox(0.52, 0.08, 0.5, 0.025, WOOD, { roughness: 0.7 })
  assento.position.y = 0.46
  chairInner.add(assento)

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const perna = cylinder(0.032, 0.038, 0.44, WOOD_DARK, { roughness: 0.7 })
      perna.position.set(sx * 0.2, 0.22, sz * 0.19)
      chairInner.add(perna)
    }
    const montante = rbox(0.06, 0.52, 0.06, 0.02, WOOD_DARK, { roughness: 0.7 })
    montante.position.set(sx * 0.2, 0.74, -0.2)
    chairInner.add(montante)
  }
  for (const [ry, h] of [[0.76, 0.09], [0.94, 0.11]] as const) {
    const ripa = rbox(0.46, h, 0.05, 0.02, WOOD, { roughness: 0.7 })
    ripa.position.set(0, ry, -0.2)
    chairInner.add(ripa)
  }
  root.add(cadeira)

  // ---- você, apontando pra cadeira ------------------------------------------
  // grupo externo só pro tombo/inclinação; o interno guarda a direção do olhar.
  const pessoa = new THREE.Group()
  pessoa.position.set(-1.6, GY, 0.95)
  pessoa.rotation.z = -0.14 // pose final: inclinado para a frente, perguntando

  const corpo = new THREE.Group()
  corpo.rotation.y = 1.4 // de perfil, olhando para a cadeira (+x)
  pessoa.add(corpo)

  const eu = person({ body: SHIRT, skin: SKIN, height: 1.45, armAngle: 0.3 })
  corpo.add(eu)

  // braço do lado da câmera estendido, apontando pra cadeira. O pivô da
  // cápsula é o centro dela: desloca o braço para o ombro ficar no lugar.
  const bracoR = eu.getObjectByName('armL')!
  const ombro = 0.25 // meia-altura do braço até o ombro
  const ang = -1.4
  bracoR.rotation.set(ang, 0, 0.12)
  bracoR.position.y += ombro - ombro * Math.cos(ang)
  bracoR.position.z += -ombro * Math.sin(ang)
  const dedo = capsule(0.024, 0.1, SKIN, { roughness: 0.6 })
  dedo.position.y = -0.36
  bracoR.add(dedo)

  // gorro simples pra ler como "pessoa da casa"
  const gorro = lathe(
    [[0, 0], [0.29, 0], [0.3, 0.05], [0.26, 0.16], [0.16, 0.24], [0, 0.26]],
    '#7d4f56',
    { roughness: 0.9 },
  )
  gorro.position.y = 0.08
  eu.getObjectByName('head')!.add(gorro)
  root.add(pessoa)

  // ---- o alce Sven (olha para -x, na direção da cadeira) --------------------
  const alce = new THREE.Group()
  alce.position.set(1.55, GY, -0.2)
  alce.rotation.y = -1.22 // construído olhando para +z local

  const tronco = capsule(0.4, 0.72, MOOSE, { roughness: 0.85 })
  tronco.rotation.x = Math.PI / 2
  tronco.position.y = 1.0
  alce.add(tronco)

  const cernelha = sphere(0.32, MOOSE, { roughness: 0.85 })
  cernelha.position.set(0, 1.2, 0.26)
  cernelha.scale.set(0.92, 0.82, 1.1)
  alce.add(cernelha)

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      // coxa encorpada enterrada no tronco: a perna nasce do corpo
      const coxa = sphere(0.17, MOOSE, { roughness: 0.85 })
      coxa.position.set(sx * 0.24, 0.72, sz * 0.42)
      coxa.scale.set(0.8, 1.2, 1)
      alce.add(coxa)
      const perna = capsule(0.085, 0.52, MOOSE_DARK, { roughness: 0.85 })
      perna.position.set(sx * 0.26, 0.37, sz * 0.42)
      const casco = cylinder(0.09, 0.1, 0.09, '#3a2a1e', { roughness: 0.6 })
      casco.position.y = -0.3
      perna.add(casco)
      alce.add(perna)
    }
  }

  const rabo = capsule(0.06, 0.1, MOOSE_DARK, { roughness: 0.85 })
  rabo.position.set(0, 1.16, -0.74)
  rabo.rotation.x = 0.4
  alce.add(rabo)

  const pescoco = capsule(0.18, 0.36, MOOSE, { roughness: 0.85 })
  pescoco.position.set(0, 1.36, 0.4)
  pescoco.rotation.x = 0.45
  alce.add(pescoco)

  // cabeça: telescopa do pescoço na montagem
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.68, 0.72)

  const cranio = sphere(0.22, MOOSE, { roughness: 0.85 })
  cranio.scale.set(0.88, 1, 1.15)
  cabeca.add(cranio)

  const focinho = capsule(0.13, 0.16, MOOSE_LIGHT, { roughness: 0.85 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.1, 0.3)
  cabeca.add(focinho)

  const focinhoTopo = sphere(0.09, '#3a2a20', { roughness: 0.4 })
  focinhoTopo.position.set(0, -0.05, 0.48)
  focinhoTopo.scale.set(1.2, 0.85, 0.7)
  cabeca.add(focinhoTopo)

  const barbicha = capsule(0.05, 0.12, MOOSE_DARK, { roughness: 0.85 })
  barbicha.position.set(0, -0.3, 0.2)
  cabeca.add(barbicha)

  for (const side of [-1, 1]) {
    const esclera = sphere(0.058, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.15, 0.08, 0.16)
    esclera.scale.z = 0.6
    const pupila = sphere(0.028, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.15, 0.08, 0.21)
    cabeca.add(esclera, pupila)

    const orelha = capsule(0.05, 0.14, MOOSE, { roughness: 0.85 })
    orelha.position.set(side * 0.25, 0.06, -0.04)
    orelha.rotation.z = side * 0.95
    orelha.scale.z = 0.65
    cabeca.add(orelha)
  }
  alce.add(cabeca)

  // chifres em leque: brotam de dentro do crânio
  const chifres = new THREE.Group()
  chifres.position.set(0, 0.3, -0.02)
  for (const side of [-1, 1]) {
    const haste = cylinder(0.05, 0.062, 0.26, BONE, { roughness: 0.75 })
    haste.position.set(side * 0.15, -0.02, 0)
    haste.rotation.z = side * 0.55
    chifres.add(haste)

    const leque = new THREE.Group()
    leque.position.set(side * 0.34, 0.12, -0.02)
    leque.rotation.set(0, side * -0.25, side * 0.6) // palma inclinada pra cima

    // palma em concha (esfera achatada), não placa: lê como chifre de alce
    const palma = sphere(0.22, BONE, { roughness: 0.75 })
    palma.scale.set(1, 0.24, 0.85)
    leque.add(palma)
    // pontas ao longo da borda externa da palma
    for (let i = 0; i < 4; i++) {
      const ponta = cone(0.04, 0.2, BONE, { roughness: 0.75 }, 12)
      ponta.position.set(side * (0.06 + i * 0.05), 0.1, -0.15 + i * 0.1)
      ponta.rotation.z = -side * (0.1 + i * 0.08)
      leque.add(ponta)
    }
    chifres.add(leque)
  }
  cabeca.add(chifres)
  root.add(alce)

  // ---- o PÔ: jato azul-e-amarelo saindo do focinho --------------------------
  const po = new THREE.Group()
  po.position.set(0.5, 1.82, 0.16) // ponta do focinho, em mundo
  const prand = rng(23)
  for (let i = 0; i < 9; i++) {
    const t = i / 8
    const bola = puff(
      0.07 + 0.17 * t,
      i % 2 === 0 ? SWE_BLUE : SWE_YELLOW,
      5,
      30 + i,
      { roughness: 0.9 },
    )
    bola.position.set(
      -0.98 * t + (prand() - 0.5) * 0.12,
      -1.15 * t * t + (prand() - 0.5) * 0.08,
      0.22 * t + (prand() - 0.5) * 0.16,
    )
    po.add(bola)
  }
  // pó assentado: polvilha a cadeira e o chão em volta, sem escondê-la
  for (const [px, py, pz, pr, cor] of [
    [-1.45, -1.54, 0.55, 0.13, SWE_YELLOW],
    [-0.45, -1.56, 0.62, 0.11, SWE_BLUE],
    [-1.25, -1.5, -0.3, 0.16, SWE_BLUE],
    [-0.7, -1.52, -0.35, 0.14, SWE_YELLOW],
    [-1.6, -1.56, 0.1, 0.1, SWE_BLUE],
  ] as const) {
    const bola = puff(pr, cor, 5, 50 + Math.round(pr * 100), { roughness: 0.9 })
    bola.position.set(px, py, pz)
    po.add(bola)
  }
  root.add(po)

  // ---- o balão de fala de papelão -------------------------------------------
  const balao = new THREE.Group()
  balao.position.set(-0.62, 2.15, 0.3)
  balao.rotation.y = 0.12

  const casca = rbox(1.8, 1.1, 0.2, 0.16, CARD, { roughness: 0.9 })
  balao.add(casca)

  const painel = rbox(1.58, 0.88, 0.08, 0.06, CARD_LIGHT, { roughness: 0.85 })
  painel.position.z = 0.1
  balao.add(painel)

  const bico = cone(0.24, 0.55, CARD, { roughness: 0.9 })
  bico.position.set(0.14, -0.72, 0)
  bico.rotation.z = Math.PI + 0.22
  balao.add(bico)

  // presilhas de papelão nos cantos
  for (const sx of [-1, 1]) {
    const presilha = torus(0.07, 0.02, '#9c7c52', { roughness: 0.8 })
    presilha.position.set(sx * 0.78, 0.42, 0.11)
    balao.add(presilha)
  }
  root.add(balao)

  // ---- a palavra escrita dentro: STOL ---------------------------------------
  const palavra = new THREE.Group()
  palavra.position.set(0, 0.02, 0.17)
  balao.add(palavra)

  const letraS = new THREE.Group()
  letraS.position.x = -0.54
  letraS.add(stroke([
    [0.11, 0.16], [0.0, 0.21], [-0.11, 0.13], [0.01, 0.02],
    [0.11, -0.08], [0.0, -0.2], [-0.11, -0.15],
  ]))
  palavra.add(letraS)

  const letraT = new THREE.Group()
  letraT.position.x = -0.18
  letraT.add(stroke([[0, 0.2], [0, 0], [0, -0.2]]))
  letraT.add(stroke([[-0.13, 0.2], [0, 0.2], [0.13, 0.2]]))
  palavra.add(letraT)

  const letraO = torus(0.115, 0.042, INK, { roughness: 0.6 })
  letraO.position.set(0.18, 0, 0)
  letraO.scale.y = 1.7
  palavra.add(letraO)

  const letraL = new THREE.Group()
  letraL.position.x = 0.52
  letraL.add(stroke([[-0.08, 0.2], [-0.08, 0], [-0.08, -0.19]]))
  letraL.add(stroke([[-0.08, -0.19], [0.02, -0.19], [0.12, -0.19]]))
  palavra.add(letraL)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'cadeira', group: 'pergunta', object: cadeira },
    { name: 'pessoa', group: 'pergunta', object: pessoa },
    { name: 'alce', group: 'alce', object: alce },
    { name: 'cabeca', group: 'alce', object: cabeca },
    { name: 'chifres', group: 'alce', object: chifres },
    { name: 'po', group: 'po', object: po },
    { name: 'balao', group: 'balao', object: balao },
    { name: 'palavra', group: 'balao', object: palavra },
  ]

  // ---- montagem -------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Numa sala qualquer, o piso brota do chão…',
    }),

    seq('cadeira-rise', 'cadeira', 1.6, 0.8, [riseFrom(GY, 1.7)], {
      ease: 'easeOut',
      caption: 'VÁ! Você aponta pra cadeira e trava: como é que chama isso?',
    }),
    seq('pessoa-rise', 'pessoa', 1.8, 0.8, [riseFrom(GY, 1.9)], { ease: 'easeOut' }),
    seq('pessoa-aponta', 'pessoa', 2.9, 0.6, [ch('rotation.z', 0, -0.14)]),

    seq('alce-rise', 'alce', 3.5, 0.9, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: 'Sobe o alce SVEN, professor de sueco de graça, e raspa a garganta: RRÊÊ-ter!',
    }),
    seq('cabeca-pop', 'cabeca', 3.7, 0.7, [ch('position.y', 1.3, 1.68)], { ease: 'easeOut' }),
    seq(
      'chifres-brotam',
      'chifres',
      3.9,
      0.8,
      [
        ch('position.y', -0.06, 0.3),
        ch('scale.x', 0.25, 1), ch('scale.y', 0.25, 1), ch('scale.z', 0.25, 1),
      ],
      { ease: 'easeOut' },
    ),

    seq('cabeca-raspa', 'cabeca', 5.0, 0.5, [ch('rotation.x', 0, -0.32)]),
    seq('cabeca-sopra', 'cabeca', 5.5, 0.4, [ch('rotation.x', -0.32, 0.26)], { ease: 'easeIn' }),

    seq(
      'po-jato',
      'po',
      5.9,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'E sopra um PÔ azul-e-amarelo por cima dela: DÊ PÔ SVÊNS-ka!',
      },
    ),
    seq('cadeira-tomba', 'cadeira', 6.15, 0.7, [ch('rotation.z', 0, 1.35)], { ease: 'easeIn' }),
    seq('cabeca-volta', 'cabeca', 6.4, 0.6, [ch('rotation.x', 0.26, 0)], { ease: 'easeOut' }),

    seq(
      'balao-sobe',
      'balao',
      7.9,
      0.9,
      [
        ch('position.y', 0.55, 2.15),
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ],
      {
        ease: 'easeOut',
        caption: 'Do pó ergue-se um balão de papelão gigante…',
      },
    ),

    seq(
      'palavra-aparece',
      'palavra',
      9.4,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'Vad heter det på svenska? — "Como se diz isso em sueco?" (a cadeira é en STOL)',
      },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.55, 4.85], target: [0.2, 1.35, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-heter-det-pa-svenska',
    contexto: 'Apontando para um objeto no trabalho, no supermercado ou na casa de alguém.',
    fraseFonte: 'Como se diz isso em sueco?',
    fraseAlvo: 'Vad heter det på svenska?',
    pronuncia: "va HÊ-ter dê pô SVÊN-ska ('det' vira só 'dê'; 'å' = ô fechado de 'avô')",
    ponteSonora:
      "VÁ, RRÊ-ter! DÊ PÔ SVÊNS-ka! (RRÊ raspado, o MESMO 'heter' do card de apresentação; PÔ de boca redonda, nunca 'pó')",
    historia:
      'Você aponta pro objeto e o alce Sven raspa a garganta ("RRÊÊ") antes de soprar um PÔ azul-e-amarelo por cima dele. Do pó se ergue um balão de fala de papelão gigante com a palavra sueca escrita dentro.',
  },
  createScene,
  refine: { organic: ['alce', 'cabeca', 'chifres'] },
}

export default card
