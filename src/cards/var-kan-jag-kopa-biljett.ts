import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Var kan jag köpa biljett?" — VAR CA-NIÁ, XÊPA BIL-IÉT?
 *
 * Diorama: cais de tábuas claras sobre água escura. O caixote da XEPA (feira)
 * com peixes prateados no gelo; um cano galvanizado fincado em pé de onde
 * telescopa a VARA bege-mel; da ponta desce a linha e sobe no anzol um
 * BIL-IÉT amarelo do tamanho de um tapete, pingando salmoura. O pelicano de
 * bico-bolsa levanta o bico pra engolir o bilhete inteiro.
 *
 * Aqui bilhete não se compra, se pesca.
 */

const WOOD = '#c2a273' // tábuas do cais (matiz quente)
const WOOD_DARK = '#9a7c53'
const WATER = '#2c5560' // água (matiz frio)
const CRATE = '#6f8a6a' // caixote verde desbotado (matiz de apoio)
const CRATE_DARK = '#577054'
const GALV = '#b9c1c5' // cano galvanizado
const BIRD = '#e6e3da'
const BIRD_SHADE = '#c9c4b8'
const BEAK = '#cf8244'
const FISH = '#c3ccd2'
const ROD = '#d8b06a'
const TICKET = '#f4c111' // ACENTO saturado — reservado ao BIL-IÉT
const TICKET_DARK = '#c98f0d'

const GY = 0.28 // topo do tablado do cais

// Layout: caixote na frente-esquerda, bilhete pendurado logo atrás/acima dele
// (o caixote fica à vista), cano no fundo entre bilhete e pelicano.
const CRATE_POS: [number, number] = [-0.72, 0.78]
const TICKET_POS: [number, number, number] = [-0.62, 1.78, 0.12]
const TICKET_ROT: [number, number, number] = [0, 0.22, -0.06]
const CANO_POS: [number, number] = [0.55, -0.42]
const CANO_H = 1.3
// ilhós do bilhete (local 0, 0.68) em mundo; a ponta da vara fica logo acima
const EYELET = new THREE.Vector3(0, 0.68, 0)
  .applyEuler(new THREE.Euler(...TICKET_ROT))
  .add(new THREE.Vector3(...TICKET_POS))
const TIP = new THREE.Vector3(EYELET.x, EYELET.y + 0.486, EYELET.z + 0.02)
const BUTT = new THREE.Vector3(CANO_POS[0], GY + CANO_H - 0.06, CANO_POS[1])

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base do diorama: água + cais de tábuas -------------------------------
  const base = new THREE.Group()

  const water = cylinder(2.6, 2.66, 0.16, WATER, { roughness: 0.14 })
  water.position.y = 0.08
  base.add(water)

  const rim = cylinder(2.66, 2.72, 0.06, '#3d4a52', { roughness: 0.9 })
  rim.position.y = 0.03
  base.add(rim)

  // tablado: 7 tábuas com fresta entre elas
  for (let i = 0; i < 7; i++) {
    const plank = rbox(0.42, 0.13, 2.9, 0.03, i % 2 === 0 ? WOOD : WOOD_DARK, { roughness: 0.75 })
    plank.position.set(-1.32 + i * 0.44, GY - 0.065, 0)
    plank.rotation.y = (rand() - 0.5) * 0.012
    base.add(plank)
  }
  // travessas sob as tábuas
  for (const tz of [-1.15, 1.15]) {
    const beam = rbox(3.15, 0.11, 0.22, 0.03, WOOD_DARK, { roughness: 0.8 })
    beam.position.set(0.14, 0.155, tz)
    base.add(beam)
  }
  // estacas do cais afundando na água
  for (const [px, pz] of [[-1.32, -1.15], [1.6, -1.15], [-1.32, 1.15], [1.6, 1.15]] as const) {
    const pile = cylinder(0.11, 0.13, 0.34, WOOD_DARK, { roughness: 0.85 })
    pile.position.set(px, 0.05, pz)
    base.add(pile)
  }

  // adereços de ambientação (rng fixo)
  const coilA = torus(0.17, 0.035, '#b7a077', { roughness: 0.9 })
  coilA.rotation.x = -Math.PI / 2
  coilA.position.set(1.02, GY + 0.035, 1.05)
  coilA.rotation.z = rand() * Math.PI
  base.add(coilA)
  const coilB = torus(0.12, 0.03, '#a89168', { roughness: 0.9 })
  coilB.rotation.x = -Math.PI / 2
  coilB.position.set(1.02, GY + 0.075, 1.05)
  coilB.rotation.z = rand() * Math.PI
  base.add(coilB)

  const balde = lathe(
    [[0, 0], [0.15, 0], [0.17, 0.1], [0.2, 0.3], [0.205, 0.32], [0.185, 0.32], [0.155, 0.1], [0.14, 0.01], [0, 0.01]],
    '#8fa3ac',
    { roughness: 0.35, metalness: 0.55 },
  )
  balde.position.set(-1.42, GY, -1.02)
  balde.rotation.y = rand() * Math.PI
  base.add(balde)

  const pedraA = rock(0.19, '#7d868c', 21, { roughness: 0.92 })
  pedraA.position.set(-2.0, 0.11, -0.75)
  pedraA.rotation.y = rand() * Math.PI
  base.add(pedraA)

  const pedraB = rock(0.12, '#6e777d', 22, { roughness: 0.92 })
  pedraB.position.set(1.98, 0.09, 1.3)
  pedraB.rotation.y = rand() * Math.PI
  base.add(pedraB)

  const alga = puff(0.15, '#3c6b4f', 5, 23, { roughness: 0.9 })
  alga.position.set(2.05, 0.14, -0.95)
  base.add(alga)

  root.add(base)

  // ---- caixote da XEPA ------------------------------------------------------
  const caixote = new THREE.Group()
  caixote.position.set(CRATE_POS[0], GY, CRATE_POS[1])
  caixote.rotation.y = 0.3

  const CW = 0.82
  const CD = 0.6
  const CH = 0.55

  const fundo = rbox(CW, 0.06, CD, 0.02, CRATE_DARK, { roughness: 0.85 })
  fundo.position.y = 0.03
  caixote.add(fundo)

  for (const sx of [-1, 1]) {
    const post = rbox(0.07, CH, 0.07, 0.02, CRATE_DARK, { roughness: 0.85 })
    post.position.set(sx * (CW / 2 - 0.035), CH / 2, CD / 2 - 0.035)
    caixote.add(post)
    const post2 = post.clone()
    post2.position.z = -(CD / 2 - 0.035)
    caixote.add(post2)
  }
  // ripas horizontais nas quatro faces, com fresta
  for (const y of [0.13, 0.3, 0.47]) {
    for (const sz of [-1, 1]) {
      const ripa = rbox(CW, 0.11, 0.05, 0.018, CRATE, { roughness: 0.85 })
      ripa.position.set(0, y, sz * (CD / 2 - 0.02))
      caixote.add(ripa)
    }
    for (const sx of [-1, 1]) {
      const ripa = rbox(0.05, 0.11, CD, 0.018, CRATE, { roughness: 0.85 })
      ripa.position.set(sx * (CW / 2 - 0.02), y, 0)
      caixote.add(ripa)
    }
  }
  // gelo picado dentro
  for (let i = 0; i < 7; i++) {
    const ice = rock(0.075 + rand() * 0.04, '#dfeaee', 30 + i, { roughness: 0.25 })
    ice.position.set((rand() - 0.5) * 0.6, 0.44 + rand() * 0.05, (rand() - 0.5) * 0.42)
    ice.rotation.y = rand() * Math.PI
    caixote.add(ice)
  }
  root.add(caixote)

  // ---- três peixes prateados no gelo ---------------------------------------
  const peixes = new THREE.Group()
  peixes.position.set(CRATE_POS[0], GY + 0.5, CRATE_POS[1])
  peixes.rotation.y = 0.3

  const poses: [number, number, number][] = [
    [-0.2, 0.05, 0.1],
    [0.06, 0.06, -0.08],
    [0.25, 0.045, 0.13],
  ]
  poses.forEach(([fx, fy, fz], i) => {
    const peixe = new THREE.Group()
    peixe.position.set(fx, fy, fz)
    peixe.rotation.y = -0.5 + i * 0.55 + (rand() - 0.5) * 0.3
    peixe.rotation.z = 0.06

    const corpo = capsule(0.075, 0.24, FISH, { roughness: 0.28, metalness: 0.3 })
    corpo.rotation.z = Math.PI / 2
    corpo.scale.set(1, 1, 0.72)
    peixe.add(corpo)

    const cauda = cone(0.075, 0.11, '#a9b4bc', { roughness: 0.35 })
    cauda.position.x = -0.22
    cauda.rotation.z = Math.PI / 2
    cauda.scale.z = 0.35
    peixe.add(cauda)

    const olho = sphere(0.016, '#1c1c1c', { roughness: 0.2 })
    olho.position.set(0.15, 0.03, 0.05)
    peixe.add(olho)

    peixes.add(peixe)
  })
  root.add(peixes)

  // ---- pelicano pescador (olha para o bilhete, +z local) --------------------
  const pelicano = new THREE.Group()
  pelicano.position.set(1.2, GY, 0.2)
  pelicano.rotation.y = -1.3 // perfil virado pro bilhete, um tico pra câmera

  for (const side of [-1, 1]) {
    const perna = capsule(0.052, 0.24, BEAK, { roughness: 0.6 })
    perna.position.set(side * 0.13, 0.2, side > 0 ? 0.08 : -0.03)
    perna.rotation.x = side > 0 ? -0.12 : 0.08
    pelicano.add(perna)

    // pé palmado
    const pe = rbox(0.2, 0.045, 0.24, 0.02, BEAK, { roughness: 0.6 })
    pe.position.set(side * 0.13, 0.03, (side > 0 ? 0.08 : -0.03) + 0.09)
    pelicano.add(pe)
    for (const t of [-1, 0, 1]) {
      const dedo = capsule(0.02, 0.08, BEAK, { roughness: 0.6 })
      dedo.position.set(side * 0.13 + t * 0.06, 0.03, (side > 0 ? 0.08 : -0.03) + 0.2)
      dedo.rotation.x = Math.PI / 2
      pelicano.add(dedo)
    }
  }

  const corpo = capsule(0.31, 0.34, BIRD, { roughness: 0.82 })
  corpo.position.set(0, 0.72, 0.02)
  corpo.rotation.x = 0.22
  corpo.scale.z = 0.9
  pelicano.add(corpo)

  const peito = capsule(0.19, 0.16, '#f2efe7', { roughness: 0.85 })
  peito.position.set(0, 0.68, 0.23)
  peito.scale.z = 0.5
  pelicano.add(peito)

  for (const side of [-1, 1]) {
    const asa = capsule(0.13, 0.42, BIRD_SHADE, { roughness: 0.85 })
    asa.position.set(side * 0.28, 0.74, -0.02)
    asa.rotation.set(0.28, 0, side * 0.12)
    asa.scale.x = 0.45
    pelicano.add(asa)
  }

  // cauda curta e achatada (cone aberto lia como megafone)
  const cauda = capsule(0.11, 0.24, BIRD_SHADE, { roughness: 0.85 })
  cauda.position.set(0, 0.56, -0.36)
  cauda.rotation.x = 1.15
  cauda.scale.set(1.5, 1, 0.45)
  pelicano.add(cauda)

  const pescoco = capsule(0.1, 0.3, BIRD, { roughness: 0.82 })
  pescoco.position.set(0, 1.12, 0.13)
  pescoco.rotation.x = -0.3
  pelicano.add(pescoco)

  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.36, 0.22)
  const cranio = sphere(0.17, BIRD, { roughness: 0.8 })
  cranio.scale.set(0.95, 1, 1.05)
  cabeca.add(cranio)
  const topete = puff(0.07, BIRD_SHADE, 4, 41, { roughness: 0.88 })
  topete.position.set(0, 0.15, -0.05)
  cabeca.add(topete)
  for (const side of [-1, 1]) {
    const eye = sphere(0.045, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.085, 0.045, 0.135)
    eye.scale.z = 0.6
    const pupil = sphere(0.021, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.088, 0.045, 0.166)
    cabeca.add(eye, pupil)
  }
  pelicano.add(cabeca)
  root.add(pelicano)

  // ---- bico laranja comprido com a bolsa inflada (peça própria) -------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.01, 0.14)
  bico.rotation.x = -0.15

  const mandibula = lathe(
    [[0, 0], [0.085, 0.02], [0.075, 0.24], [0.055, 0.44], [0.03, 0.6], [0.012, 0.66], [0, 0.66]],
    BEAK,
    { roughness: 0.45 },
  )
  mandibula.rotation.x = Math.PI / 2
  mandibula.scale.y = 1
  bico.add(mandibula)

  const cume = capsule(0.022, 0.5, '#b96d33', { roughness: 0.4 })
  cume.position.set(0, 0.055, 0.3)
  cume.rotation.x = Math.PI / 2
  bico.add(cume)

  const gancho = sphere(0.03, '#b96d33', { roughness: 0.4 })
  gancho.position.set(0, 0.005, 0.65)
  bico.add(gancho)

  // a bolsa: esfera achatada e inflada sob o bico
  const bolsa = sphere(0.16, '#e0a05c', { roughness: 0.55 })
  bolsa.position.set(0, -0.11, 0.24)
  bolsa.scale.set(0.85, 0.95, 1.9)
  bico.add(bolsa)
  const bolsaBorda = torus(0.09, 0.018, '#b96d33', { roughness: 0.45 })
  bolsaBorda.rotation.x = Math.PI / 2 - 0.2
  bolsaBorda.position.set(0, -0.06, 0.3)
  bolsaBorda.scale.set(1, 1.5, 1)
  bico.add(bolsaBorda)

  cabeca.add(bico)

  // ---- cano galvanizado fincado em pé ---------------------------------------
  const cano = new THREE.Group()
  cano.position.set(CANO_POS[0], GY, CANO_POS[1])

  const tubo = cylinder(0.085, 0.09, CANO_H, GALV, { roughness: 0.38, metalness: 0.5 })
  tubo.position.y = CANO_H / 2
  cano.add(tubo)
  const flange = cylinder(0.17, 0.19, 0.06, '#7f888d', { roughness: 0.3, metalness: 0.7 })
  flange.position.y = 0.03
  cano.add(flange)
  const bocal = cylinder(0.105, 0.1, 0.08, '#8e979c', { roughness: 0.28, metalness: 0.8 })
  bocal.position.y = CANO_H
  cano.add(bocal)
  for (const y of [0.4, 0.85]) {
    const anel = torus(0.095, 0.016, '#7f888d', { roughness: 0.3, metalness: 0.7 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = y
    cano.add(anel)
  }
  root.add(cano)

  // ---- vara de pescar: telescopa para fora do cano --------------------------
  const vara = new THREE.Group()
  // eixo +y local da boca do cano até a ponta (TIP), sobre o ilhós do bilhete
  const rodDir = TIP.clone().sub(BUTT)
  const ROD_L = rodDir.length()
  vara.position.copy(BUTT)
  vara.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rodDir.normalize())

  const haste = cylinder(0.02, 0.052, ROD_L, ROD, { roughness: 0.5 })
  haste.position.y = ROD_L / 2
  vara.add(haste)

  const punho = cylinder(0.062, 0.066, 0.3, '#7d5a33', { roughness: 0.85 })
  punho.position.y = 0.2
  vara.add(punho)

  const carretilha = cylinder(0.085, 0.085, 0.06, '#8b3f34', { roughness: 0.3 })
  carretilha.rotation.z = Math.PI / 2
  carretilha.position.set(0.1, 0.42, 0)
  vara.add(carretilha)
  const manivela = capsule(0.014, 0.08, '#4a4a4a', { roughness: 0.3, metalness: 0.6 })
  manivela.position.set(0.15, 0.48, 0)
  manivela.rotation.z = 0.6
  vara.add(manivela)

  for (const y of [ROD_L * 0.48, ROD_L * 0.75, ROD_L * 0.95]) {
    const passador = torus(0.035, 0.008, '#6d6d6d', { roughness: 0.3, metalness: 0.7 })
    passador.position.set(0, y, 0.04)
    passador.rotation.y = Math.PI / 2
    vara.add(passador)
  }
  root.add(vara)

  // ---- linha e anzol --------------------------------------------------------
  const linha = new THREE.Group()
  linha.position.copy(TIP)

  const fio = cylinder(0.007, 0.007, 0.42, '#f0efe6', { roughness: 0.4 }, 10)
  fio.position.y = -0.21
  linha.add(fio)

  const anzol = torus(0.05, 0.013, '#8e979c', { roughness: 0.25, metalness: 0.85 })
  anzol.position.y = -0.46
  anzol.rotation.y = 0.4
  linha.add(anzol)
  root.add(linha)

  // ---- o BIL-IÉT amarelo gigante, pingando salmoura -------------------------
  const bilhete = new THREE.Group()
  bilhete.position.set(...TICKET_POS)
  bilhete.rotation.set(...TICKET_ROT)

  const folha = rbox(1.05, 1.5, 0.05, 0.03, TICKET, { roughness: 0.55 })
  bilhete.add(folha)

  const faixa = rbox(1.02, 0.2, 0.055, 0.02, TICKET_DARK, { roughness: 0.5 })
  faixa.position.y = 0.26
  bilhete.add(faixa)
  for (const y of [-0.06, -0.24, -0.42]) {
    const linhaTexto = rbox(0.66, 0.075, 0.055, 0.02, '#a8780b', { roughness: 0.5 })
    linhaTexto.position.set(-0.12, y, 0)
    bilhete.add(linhaTexto)
  }
  // picote lateral
  for (let i = 0; i < 9; i++) {
    const furo = sphere(0.028, TICKET_DARK, { roughness: 0.5 })
    furo.position.set(0.4, 0.56 - i * 0.14, 0.028)
    bilhete.add(furo)
  }
  // furo do anzol
  const ilhos = torus(0.06, 0.022, '#5f4a12', { roughness: 0.45 })
  ilhos.position.set(0, 0.68, 0)
  bilhete.add(ilhos)

  // salmoura pingando da borda de baixo
  for (const [dx, dy] of [[-0.34, -0.86], [-0.02, -0.95], [0.3, -0.83]] as const) {
    const gota = sphere(0.045, '#8fc6cc', { roughness: 0.1 })
    gota.position.set(dx, dy, 0)
    gota.scale.set(0.75, 1.5, 0.75)
    bilhete.add(gota)
  }
  root.add(bilhete)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cais', object: base },
    { name: 'caixote', group: 'xepa', object: caixote },
    { name: 'peixes', group: 'xepa', object: peixes },
    { name: 'pelicano', group: 'pelicano', object: pelicano },
    { name: 'bico', group: 'pelicano', object: bico },
    { name: 'cano', group: 'vara', object: cano },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'linha', group: 'vara', object: linha },
    { name: 'bilhete', group: 'bilhete', object: bilhete },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'Você quer bilhete, mas o cais só tem tábua, água e cheiro de peixe.',
    }),

    seq('caixote-rise', 'caixote', 1.8, 0.7, [riseFrom(GY, 1.1)], {
      ease: 'easeOut',
      caption: 'Do tablado sobe o caixote da XEPA da feira — nada de guichê, só gelo.',
    }),
    seq('peixes-rise', 'peixes', 1.95, 0.6, [riseFrom(GY + 0.5, 1.3)], { ease: 'easeOut' }),

    seq('pelicano-rise', 'pelicano', 3.6, 0.8, [riseFrom(GY, 2.3)], {
      ease: 'easeOut',
      caption: 'Entra o pelicano de bico-bolsa: ele te empresta a VARA.',
    }),
    seq(
      'bico-grow',
      'bico',
      3.85,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('cano-rise', 'cano', 5.5, 0.7, [riseFrom(GY, 1.6)], { ease: 'easeOut' }),
    seq('vara-telescopa', 'vara', 5.75, 0.8, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'A VARA telescopa do cano fincado e você fisga gritando CA-NIÁ!',
    }),
    seq('linha-desce', 'linha', 6.55, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('bilhete-fisgado', 'bilhete', 7.4, 0.9, [riseFrom(TICKET_POS[1], 2.45)], {
      ease: 'easeOut',
      caption: 'E do caixote sobe no anzol um BIL-IÉT amarelo do tamanho de um tapete.',
    }),

    seq('bilhete-balanco', 'bilhete', 8.6, 0.5, [ch('rotation.z', -0.06, 0.11)]),
    seq('pelicano-puxa', 'pelicano', 8.7, 0.4, [ch('rotation.x', 0, -0.13)], { ease: 'easeOut' }),
    seq('bilhete-assenta', 'bilhete', 9.1, 0.7, [ch('rotation.z', 0.11, -0.06)]),
    seq('pelicano-volta', 'pelicano', 9.1, 0.5, [ch('rotation.x', -0.13, 0)]),

    seq('bico-abre', 'bico', 10.0, 0.6, [ch('rotation.x', -0.15, -0.85)], {
      ease: 'easeOut',
      caption: 'Var kan jag köpa biljett? — "Onde eu compro bilhete?" (VAR CA-NIÁ, XÊPA BIL-IÉT?)',
    }),
    seq('bico-engole', 'bico', 10.6, 0.7, [ch('rotation.x', -0.85, -0.15)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 3.0, 5.9], target: [0.05, 1.35, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-kan-jag-kopa-biljett',
    contexto:
      "Em estação, terminal ou dentro do ônibus. A resposta vem como 'i appen', 'i automaten' ou 'på Pressbyrån'.",
    fraseFonte: 'Onde eu compro bilhete?',
    fraseAlvo: 'Var kan jag köpa biljett?',
    pronuncia: "VAR kan iá CHÊ-pa bil-YÉT? ('kö' = 'chê' com ch tcheco; 'lj' = 'i')",
    ponteSonora:
      "VAR CA-NIÁ, XÊPA BIL-IÉT? (7 sílabas; VAR = a VARA sem o -a, R brando; CA-NIÁ emenda 'kan jag' sem nasalizar; XÊPA = a xepa da feira com bico — o 'kö' é ch tcheco; BIL-IÉT com lj = i de ioga e peso na última)",
    historia:
      'Você quer comprar bilhete e o cais só tem caixote de peixe. Um pelicano de bico-bolsa te empresta a VARA fincada no cano, você fisga gritando CA-NIÁ!, e do caixote da XEPA sobe no anzol um BIL-IÉT amarelo do tamanho de um tapete, pingando salmoura — o pelicano abre a bolsa do bico e engole o bilhete inteiro pra guardar. Aqui bilhete não se compra, se pesca.',
  },
  createScene,
  refine: { organic: ['pelicano'] },
}

export default card
