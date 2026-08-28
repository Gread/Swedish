import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, person,
  rbox, capsule, cylinder, sphere, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Ingen fara!" — na balada, o SAPO infla uma ÍNGUA roxa gigante no papo
 * (ÍNG-EN?!) e a placa amarela de PERIGO despenca; ao bater no chão vira uma
 * nota musical FÁ dourada (FÁ-RA!). O DJ solta o beat e o sapo relaxa.
 *
 * Diorama: pista de dança xadrez rosa-neon/roxo, caixas de som e picapes ao
 * fundo à direita, bola de espelhos pendurada num mastro à esquerda, sapo
 * verde-limão à frente encarando a placa que cai e vira a nota.
 */

const ROXO = '#5c2b86'
const ROXO_ESCURO = '#2a1440'
const ROSA = '#d1408a'
const ROSA_NEON = '#ff4fa3'
const LIMA = '#8cc63f'
const LIMA_CLARA = '#c8e08a'
const LIMA_ESCURA = '#4f7a1f'
const PAPO = '#7b3fa0'
const PAPO_CLARO = '#9b5cc4'
const PRETO = '#17171d'
const CROMO = '#cdd6e0'
const AMARELO = '#e3c02c'
const DOURADO = '#f0b429' // acento reservado: a nota FÁ
const PELE = '#e8c39e'

const FY = 0.2 // topo da pista (superfície onde tudo se apoia)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: a pista de dança ---------------------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.6, 2.68, 0.14, ROXO_ESCURO, { roughness: 0.85 })
  slab.position.y = 0.07
  base.add(slab)

  // xadrez rosa-neon x roxo, recortado no disco
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const x = (i - 2) * 0.88
      const z = (j - 2) * 0.88
      if (Math.hypot(x, z) > 2.15) continue
      const even = (i + j) % 2 === 0
      const tile = rbox(0.8, 0.06, 0.8, 0.025, even ? ROSA : ROXO, { roughness: 0.16 })
      tile.position.set(x, 0.17, z)
      base.add(tile)
    }
  }

  // fita de neon na borda da pista
  const neon = torus(2.62, 0.05, ROSA_NEON, { emissive: ROSA_NEON, emissiveIntensity: 1.1 })
  neon.rotation.x = Math.PI / 2
  neon.position.y = 0.12
  base.add(neon)

  // adereços de ambientação (rng fixo)
  for (const [px, pz, r] of [[-1.55, 1.5, 0.24], [1.9, 0.95, 0.18]] as const) {
    const fumaca = puff(r, '#c8b6e2', 5, 31 + Math.round(px * 10), { roughness: 0.95 })
    fumaca.position.set(px, FY + r * 0.55, pz)
    fumaca.rotation.y = rand() * Math.PI
    base.add(fumaca)
  }

  const engradado = rbox(0.52, 0.44, 0.42, 0.04, PRETO, { roughness: 0.6 })
  engradado.position.set(-2.0, FY + 0.22, -0.75)
  engradado.rotation.y = -0.4 + rand() * 0.2
  base.add(engradado)

  const copo = lathe(
    [[0, 0], [0.09, 0], [0.1, 0.03], [0.075, 0.05], [0.085, 0.2], [0.075, 0.2]],
    '#e6f2ff',
    { roughness: 0.14 },
  )
  copo.position.set(-2.0, FY + 0.44, -0.75)
  copo.rotation.y = rand() * Math.PI
  base.add(copo)

  root.add(base)

  // ---- som: caixas empilhadas + picapes ------------------------------------
  const som = new THREE.Group()
  som.position.set(1.75, FY, -1.55)
  som.rotation.y = -0.8

  for (const [ly, lh] of [[0.42, 0.84], [1.24, 0.78]] as const) {
    const caixa = rbox(0.86, lh, 0.5, 0.05, PRETO, { roughness: 0.55 })
    caixa.position.y = ly
    som.add(caixa)

    const cone = cylinder(0.2, 0.26, 0.06, '#2e2e38', { roughness: 0.7 })
    cone.rotation.x = Math.PI / 2
    cone.position.set(0, ly + 0.06, 0.26)
    som.add(cone)

    const centro = sphere(0.08, ROSA_NEON, { roughness: 0.35 })
    centro.position.set(0, ly + 0.06, 0.29)
    som.add(centro)
  }

  const tweeter = cylinder(0.11, 0.11, 0.07, CROMO, { roughness: 0.2, metalness: 0.9 })
  tweeter.rotation.x = Math.PI / 2
  tweeter.position.set(0, 1.55, 0.26)
  som.add(tweeter)

  // mesa de picapes na frente das caixas
  const mesa = rbox(1.4, 0.1, 0.56, 0.04, '#2b2f3a', { roughness: 0.5 })
  mesa.position.set(-0.15, 0.9, 0.92)
  som.add(mesa)
  for (const side of [-1, 1]) {
    const perna = cylinder(0.05, 0.05, 0.85, '#3a3f4c', { roughness: 0.45 })
    perna.position.set(-0.15 + side * 0.58, 0.43, 0.92)
    som.add(perna)

    const prato = cylinder(0.22, 0.22, 0.035, PRETO, { roughness: 0.45 })
    prato.position.set(-0.15 + side * 0.42, 0.97, 0.92)
    som.add(prato)

    const label = cylinder(0.08, 0.08, 0.045, ROSA, { roughness: 0.5 })
    label.position.set(-0.15 + side * 0.42, 0.975, 0.92)
    som.add(label)
  }
  root.add(som)

  // ---- mastro + bola de espelhos -------------------------------------------
  const mastro = new THREE.Group()
  mastro.position.set(-1.95, FY, -1.5)

  const posteBola = cylinder(0.06, 0.08, 2.7, '#3a3f4c', { roughness: 0.35, metalness: 0.6 })
  posteBola.position.y = 1.35
  mastro.add(posteBola)

  const peBola = cylinder(0.34, 0.4, 0.09, '#2b2f3a', { roughness: 0.5 })
  peBola.position.y = 0.045
  mastro.add(peBola)

  const braco = cylinder(0.05, 0.05, 1.25, '#3a3f4c', { roughness: 0.35, metalness: 0.6 })
  braco.rotation.z = -Math.PI / 2
  braco.position.set(0.62, 2.66, 0)
  mastro.add(braco)

  const cabo = cylinder(0.014, 0.014, 0.24, '#20242c', { roughness: 0.8 })
  cabo.position.set(1.22, 2.54, 0)
  mastro.add(cabo)
  root.add(mastro)

  // a bola é peça própria (gira sozinha no fim)
  const bola = new THREE.Group()
  bola.position.set(1.22, 2.13, 0)
  bola.rotation.y = 2.4
  const esfera = sphere(0.29, CROMO, { roughness: 0.15, metalness: 0.9 })
  bola.add(esfera)
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2
    const b = (rand() - 0.5) * Math.PI * 0.9
    const faceta = rbox(0.11, 0.11, 0.02, 0.01, '#f2f7ff', { roughness: 0.1, metalness: 0.85 })
    faceta.position.set(
      Math.cos(a) * Math.cos(b) * 0.29,
      Math.sin(b) * 0.29,
      Math.sin(a) * Math.cos(b) * 0.29,
    )
    faceta.lookAt(0, 0, 0)
    bola.add(faceta)
  }
  mastro.add(bola)

  // ---- DJ nas picapes ------------------------------------------------------
  const dj = person({ body: '#2b2f3a', skin: PELE, height: 1.5, armAngle: 1.05 })
  dj.position.set(2.05, FY, -1.9)
  dj.rotation.y = -0.75

  const cabecaDj = dj.getObjectByName('head')!
  const arco = torus(0.3, 0.038, PRETO, { roughness: 0.5 })
  arco.position.y = 0.03
  cabecaDj.add(arco)
  for (const side of [-1, 1]) {
    const concha = rbox(0.1, 0.17, 0.15, 0.05, PRETO, { roughness: 0.5 })
    concha.position.set(side * 0.29, 0.0, 0)
    cabecaDj.add(concha)
  }
  const bone = lathe(
    [[0, 0.15], [0.2, 0.145], [0.29, 0.09], [0.3, 0.03], [0.3, 0.0], [0, 0.0]],
    ROSA,
    { roughness: 0.75 },
  )
  bone.position.y = 0.1
  cabecaDj.add(bone)
  root.add(dj)

  // ---- sapo ----------------------------------------------------------------
  const sapo = new THREE.Group()
  sapo.position.set(-0.75, FY, 0.5)
  sapo.rotation.set(0, 1.6, 0.1) // olha para a placa; leve inclinação relaxada final

  const corpo = capsule(0.36, 0.22, LIMA, { roughness: 0.6 })
  corpo.position.y = 0.46
  corpo.scale.z = 1.12
  sapo.add(corpo)

  const barriga = sphere(0.23, LIMA_CLARA, { roughness: 0.65 })
  barriga.position.set(0, 0.42, 0.27)
  barriga.scale.z = 0.5
  sapo.add(barriga)

  const cabeca = sphere(0.31, LIMA, { roughness: 0.6 })
  cabeca.position.set(0, 0.86, 0.08)
  cabeca.scale.set(1.08, 0.86, 1.05)
  sapo.add(cabeca)

  const boca = capsule(0.022, 0.3, LIMA_ESCURA, { roughness: 0.55 })
  boca.rotation.z = Math.PI / 2
  boca.position.set(0, 0.79, 0.3)
  sapo.add(boca)

  for (const side of [-1, 1]) {
    const bulbo = sphere(0.145, LIMA, { roughness: 0.6 })
    bulbo.position.set(side * 0.16, 1.02, 0.09)
    sapo.add(bulbo)

    const esclera = sphere(0.1, '#ffffff', { roughness: 0.22 })
    esclera.position.set(side * 0.165, 1.06, 0.19)
    esclera.scale.z = 0.65
    const pupila = sphere(0.048, '#111111', { roughness: 0.2 })
    pupila.position.set(side * 0.165, 1.07, 0.26)
    sapo.add(esclera, pupila)

    const coxa = sphere(0.18, LIMA, { roughness: 0.6 })
    coxa.position.set(side * 0.31, 0.27, -0.04)
    coxa.scale.set(0.8, 1, 1.25)
    sapo.add(coxa)

    const pe = capsule(0.07, 0.2, LIMA, { roughness: 0.62 })
    pe.rotation.x = Math.PI / 2
    pe.position.set(side * 0.27, 0.09, 0.26)
    sapo.add(pe)

    const braco = capsule(0.058, 0.16, LIMA, { roughness: 0.6 })
    braco.position.set(side * 0.35, 0.5, 0.15)
    braco.rotation.set(0.3, 0, -side * 0.35)
    const mao = sphere(0.07, LIMA, { roughness: 0.62 })
    mao.position.y = -0.13
    braco.add(mao)
    sapo.add(braco)
  }
  root.add(sapo)

  // ---- papo: a ÍNGUA roxa (peça própria, filha do sapo) ---------------------
  const papo = new THREE.Group()
  papo.position.set(0, 0.66, 0.24)
  papo.scale.setScalar(0.34) // pose final: murcho, o sapo já relaxou
  const bolsa = sphere(0.3, PAPO, { roughness: 0.55 })
  bolsa.scale.set(1, 0.88, 0.95)
  papo.add(bolsa)
  const inchaco = sphere(0.11, PAPO_CLARO, { roughness: 0.5 })
  inchaco.position.set(0.09, 0.11, 0.21)
  papo.add(inchaco)
  const inchacoB = sphere(0.075, PAPO_CLARO, { roughness: 0.5 })
  inchacoB.position.set(-0.12, 0.02, 0.22)
  papo.add(inchacoB)
  sapo.add(papo)

  // ---- poste da placa ------------------------------------------------------
  const poste = new THREE.Group()
  poste.position.set(1.25, FY, 0.3)
  const haste = cylinder(0.045, 0.055, 1.35, '#8d949c', { roughness: 0.3, metalness: 0.7 })
  haste.position.y = 0.675
  poste.add(haste)
  const flange = cylinder(0.22, 0.26, 0.06, '#6f767e', { roughness: 0.4, metalness: 0.6 })
  flange.position.y = 0.03
  poste.add(flange)
  root.add(poste)

  // ---- placa triangular de PERIGO -----------------------------------------
  // pose final: caída de cara para cima no chão (rotation.x = -PI/2)
  const placa = new THREE.Group()
  placa.position.set(1.25, FY + 0.05, 0.3)
  placa.rotation.set(-Math.PI / 2, 0, 0.3)

  const borda = cylinder(0.48, 0.48, 0.05, PRETO, { roughness: 0.5 }, 3)
  borda.rotation.x = -Math.PI / 2
  placa.add(borda)

  const face = cylinder(0.4, 0.4, 0.075, AMARELO, { roughness: 0.45 }, 3)
  face.rotation.x = -Math.PI / 2
  face.position.set(0, 0.015, 0.01)
  placa.add(face)

  const barra = rbox(0.085, 0.24, 0.05, 0.03, PRETO, { roughness: 0.5 })
  barra.position.set(0, 0.07, 0.05)
  placa.add(barra)
  const ponto = sphere(0.055, PRETO, { roughness: 0.5 })
  ponto.position.set(0, -0.11, 0.05)
  placa.add(ponto)
  root.add(placa)

  // ---- nota musical FÁ dourada (acento) ------------------------------------
  const nota = new THREE.Group()
  nota.position.set(1.25, FY, 0.3)
  nota.rotation.y = 0.25

  const cabecaNota = cylinder(0.25, 0.25, 0.1, DOURADO, { roughness: 0.2, metalness: 0.9 })
  cabecaNota.position.set(-0.16, 0.05, 0.3)
  cabecaNota.scale.x = 1.25
  cabecaNota.rotation.y = 0.5
  nota.add(cabecaNota)

  const haste2 = rbox(0.08, 0.09, 0.95, 0.03, DOURADO, { roughness: 0.2, metalness: 0.9 })
  haste2.position.set(0.02, 0.05, -0.14)
  nota.add(haste2)

  const bandeira = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.02, 0.05, -0.6),
        new THREE.Vector3(0.24, 0.05, -0.48),
        new THREE.Vector3(0.3, 0.05, -0.24),
        new THREE.Vector3(0.2, 0.05, -0.08),
      ]),
      28,
      0.055,
      10,
      false,
    ),
    mat(DOURADO, { roughness: 0.2, metalness: 0.9, size: 0.7 }),
  )
  bandeira.castShadow = true
  bandeira.receiveShadow = true
  nota.add(bandeira)

  const halo = torus(0.66, 0.035, '#ffd76a', { emissive: '#ffb02e', emissiveIntensity: 1.2 })
  halo.rotation.x = Math.PI / 2
  halo.position.y = 0.02
  nota.add(halo)
  root.add(nota)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'pista', object: base },
    { name: 'som', group: 'pista', object: som },
    { name: 'mastro', group: 'palco', object: mastro },
    { name: 'bola', group: 'palco', object: bola },
    { name: 'dj', group: 'palco', object: dj },
    { name: 'sapo', group: 'sapo', object: sapo },
    { name: 'papo', group: 'sapo', object: papo },
    { name: 'poste', group: 'perigo', object: poste },
    { name: 'placa', group: 'perigo', object: placa },
    { name: 'nota', group: 'nota', object: nota },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'A pista de dança neon acende e o som toma conta da balada…',
    }),
    seq('som-rise', 'som', 0.25, 0.9, [riseFrom(FY, 2.3)], { ease: 'easeOut' }),

    seq('mastro-rise', 'mastro', 1.85, 0.9, [riseFrom(FY, 3.2)], { ease: 'easeOut' }),
    seq(
      'bola-pop',
      'bola',
      2.05,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('dj-rise', 'dj', 2.2, 0.9, [riseFrom(FY, 1.9)], { ease: 'easeOut' }),

    seq('sapo-rise', 'sapo', 3.7, 0.9, [riseFrom(FY, 1.6)], {
      ease: 'easeOut',
      caption: 'O sapo entra na pista e todo mundo se assusta…',
    }),
    seq('sapo-hop-up', 'sapo', 4.6, 0.45, [ch('position.y', FY, FY + 0.16)], { ease: 'easeOut' }),
    seq('sapo-hop-down', 'sapo', 5.05, 0.4, [ch('position.y', FY + 0.16, FY)], { ease: 'easeIn' }),

    seq(
      'papo-inflate',
      'papo',
      5.5,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…com uma ÍNGUA roxa gigante inflando o papo: ÍNG-EN?!',
      },
    ),

    seq('poste-rise', 'poste', 7.0, 0.8, [riseFrom(FY, 1.8)], { ease: 'easeOut' }),
    seq(
      'placa-pop',
      'placa',
      7.2,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq(
      'placa-fall',
      'placa',
      8.6,
      0.7,
      [
        ch('position.y', 1.78, FY + 0.05),
        ch('rotation.x', 0, -Math.PI / 2),
        ch('rotation.z', 0, 0.3),
      ],
      { ease: 'easeIn', caption: 'A placa amarela de PERIGO despenca da parede…' },
    ),
    seq('sapo-jolt-up', 'sapo', 9.15, 0.35, [ch('position.y', FY, FY + 0.22)], { ease: 'easeOut' }),
    seq('sapo-jolt-down', 'sapo', 9.5, 0.4, [ch('position.y', FY + 0.22, FY)], { ease: 'easeIn' }),

    seq(
      'placa-vira',
      'placa',
      9.55,
      0.45,
      [ch('scale.x', 1, 0.01), ch('scale.y', 1, 0.01), ch('scale.z', 1, 0.01)],
    ),
    seq(
      'nota-grow',
      'nota',
      9.75,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…e ao bater no chão vira uma inofensiva nota FÁ dourada: FÁ-RA!',
      },
    ),
    seq('nota-spin', 'nota', 9.75, 0.8, [ch('rotation.y', -0.9, 0.25)], { ease: 'easeOut' }),

    seq('bola-spin', 'bola', 10.4, 1.4, [ch('rotation.y', 0, 2.4)]),
    seq('dj-beat-up', 'dj', 10.55, 0.4, [ch('position.y', FY, FY + 0.14)], { ease: 'easeOut' }),
    seq('dj-beat-down', 'dj', 10.95, 0.4, [ch('position.y', FY + 0.14, FY)], { ease: 'easeIn' }),

    seq(
      'papo-deflate',
      'papo',
      11.05,
      0.7,
      [ch('scale.x', 1, 0.34), ch('scale.y', 1, 0.34), ch('scale.z', 1, 0.34)],
      { caption: 'Ingen fara! — "Não tem problema!" (ÍNG-EN? FÁ-RA!)' },
    ),
    seq('sapo-relax', 'sapo', 11.3, 0.7, [ch('rotation.z', 0, 0.1)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 3.1, 6.4], target: [0.2, 1.0, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'ingen-fara',
    contexto: 'Alguém pisa no seu pé, chega atrasado, derruba algo ou pede desculpa por qualquer coisa.',
    fraseFonte: 'Não tem problema!',
    fraseAlvo: 'Ingen fara!',
    pronuncia: "ING-en FÁ-ra ('ng' como em 'tango', não nasalize)",
    ponteSonora:
      "ÍNG-EN? FÁ-RA! (ÍNG como o fim de 'ping', com o G quase sumindo, depois -EN; FÁ-RA com R de 'cara', um toque só, jamais RR)",
    historia:
      'O sapo entra na balada com uma íngua roxa gigante inflando o papo e todo mundo se assusta. A placa amarela de PERIGO despenca da parede e, ao bater no chão, vira uma inofensiva nota musical FÁ dourada. O DJ solta o beat e o sapo relaxa.',
  },
  createScene,
}

export default card
