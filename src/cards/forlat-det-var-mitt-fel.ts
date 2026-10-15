import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, cylinder, sphere, cone, torus, lathe, rock, person,
} from '../rig/helpers'

/**
 * "Förlåt, det var mitt fel." — o pedreiro FURA-LOTE (för-låt) enfia a broca
 * laranja gigante no lote do vizinho, DÊ VAR (det var), veste a camiseta
 * MITO com o O arrancado (MIT' = mitt) e estende o vidro rachado de FEL,
 * o líquido verde amargo, que entorna no chão.
 *
 * Diorama: canteiro de obra. Broca fincada na cratera à esquerda-fundo,
 * pedreiro cabisbaixo à direita-frente derramando o fel numa poça.
 */

const SOIL = '#7a5636'
const SOIL_DARK = '#4a3324'
const GRIT = '#8f7d63'
const WOOD = '#8a6a42'
const BOARD = '#d9c9a8'
const ORANGE = '#d1671f' // laranja de obra: broca e cone
const STEEL = '#c3c9cf'
const STEEL_DARK = '#5b6169'
const HELMET = '#dba31a'
const SHIRT = '#e6e2d8'
const SKIN = '#e8c39e'
const GLASS = '#3f6b3a'
const INK = '#3a2f26'
const FEL = '#a8e02a' // ACENTO saturado, reservado ao FEL

const GY = 0.16 // topo da base do diorama
const VIDRO_TILT = 0.95 // o vidro tomba para a frente, entornando

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  /** Barra de letra: tudo que é texto no diorama é feito destas. */
  const bar = (w: number, h: number, d = 0.025, color: string | number = INK) =>
    rbox(w, h, d, 0.007, color, { roughness: 0.6 })

  // ---- base do diorama: o LOTE de terra --------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.45, 2.55, 0.16, SOIL, { roughness: 0.95 })
  soil.position.y = 0.08
  base.add(soil)

  const grit = cylinder(2.3, 2.38, 0.04, GRIT, { roughness: 0.92 })
  grit.position.y = 0.14
  base.add(grit)

  // adereços de canteiro, espalhados com rng fixo
  const bricks = new THREE.Group()
  bricks.position.set(1.62, GY, -1.35)
  bricks.rotation.y = 0.4
  for (let i = 0; i < 6; i++) {
    const b = rbox(0.24, 0.085, 0.12, 0.016, '#a5502f', { roughness: 0.85 })
    b.position.set((rand() - 0.5) * 0.05, 0.045 + i * 0.088, (rand() - 0.5) * 0.04)
    b.rotation.y = (rand() - 0.5) * 0.3
    bricks.add(b)
  }
  base.add(bricks)

  const rubbleA = rock(0.19, '#8d9296', 31, { roughness: 0.92 })
  rubbleA.position.set(-2.02, GY + 0.08, 0.42)
  rubbleA.rotation.y = rand() * Math.PI
  base.add(rubbleA)

  const rubbleB = rock(0.11, '#7e8489', 32, { roughness: 0.92 })
  rubbleB.position.set(0.28, GY + 0.05, -1.82)
  rubbleB.rotation.y = rand() * Math.PI
  base.add(rubbleB)

  const coneObra = new THREE.Group()
  coneObra.position.set(-0.55, GY, 1.05)
  const conePad = rbox(0.36, 0.05, 0.36, 0.02, ORANGE, { roughness: 0.45 })
  conePad.position.y = 0.025
  const coneBody = cone(0.16, 0.44, ORANGE, { roughness: 0.45 })
  coneBody.position.y = 0.27
  const coneBand = cylinder(0.113, 0.129, 0.08, '#f0ece2', { roughness: 0.5 })
  coneBand.position.y = 0.29
  coneObra.add(conePad, coneBody, coneBand)
  base.add(coneObra)

  const cement = rbox(0.4, 0.17, 0.26, 0.07, '#cfc6b2', { roughness: 0.95 })
  cement.position.set(-1.25, GY + 0.085, 1.3)
  cement.rotation.set(0.06, 0.55, 0.12)
  base.add(cement)

  root.add(base)

  // ---- placa do LOTE ---------------------------------------------------
  const placa = new THREE.Group()
  placa.position.set(-1.95, GY, 0.98)
  placa.rotation.y = 0.45

  const post = cylinder(0.05, 0.058, 1.02, WOOD, { roughness: 0.75 })
  post.position.y = 0.51
  placa.add(post)

  const board = rbox(0.78, 0.36, 0.05, 0.025, BOARD, { roughness: 0.7 })
  board.position.y = 1.05
  placa.add(board)

  const word = new THREE.Group()
  word.position.set(0, 1.05, 0.031)
  // L
  const l1 = bar(0.03, 0.15); l1.position.set(-0.258, 0, 0)
  const l2 = bar(0.088, 0.03); l2.position.set(-0.215, -0.06, 0)
  // O
  const o1 = torus(0.058, 0.018, INK, { roughness: 0.6 }); o1.position.set(-0.075, 0, 0)
  // T
  const t1 = bar(0.1, 0.03); t1.position.set(0.075, 0.06, 0)
  const t2 = bar(0.03, 0.15); t2.position.set(0.075, 0, 0)
  // E
  const e1 = bar(0.03, 0.15); e1.position.set(0.2, 0, 0)
  const e2 = bar(0.078, 0.028); e2.position.set(0.243, 0.061, 0)
  const e3 = bar(0.066, 0.026); e3.position.set(0.237, 0, 0)
  const e4 = bar(0.078, 0.028); e4.position.set(0.243, -0.061, 0)
  word.add(l1, l2, o1, t1, t2, e1, e2, e3, e4)
  placa.add(word)

  root.add(placa)

  // ---- cratera do furo -------------------------------------------------
  const cratera = new THREE.Group()
  cratera.position.set(-1.15, GY, -0.55)

  const hole = cylinder(0.44, 0.3, 0.18, '#241a13', { roughness: 0.95 })
  hole.position.y = -0.07
  cratera.add(hole)

  const rim = torus(0.53, 0.15, SOIL_DARK, { roughness: 0.95 })
  rim.rotation.x = -Math.PI / 2
  rim.scale.y = 0.5
  rim.position.y = 0.02
  cratera.add(rim)

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rand()
    const clod = rock(0.07 + rand() * 0.06, SOIL_DARK, 40 + i, { roughness: 0.95 })
    clod.position.set(Math.cos(a) * (0.68 + rand() * 0.24), 0.05, Math.sin(a) * (0.68 + rand() * 0.24))
    clod.rotation.y = rand() * Math.PI
    cratera.add(clod)
  }
  root.add(cratera)

  // ---- broca laranja gigante fincada -----------------------------------
  // grupo externo só gira em Y (a cravada); a inclinação mora no filho
  const broca = new THREE.Group()
  broca.position.set(-1.15, 0.11, -0.55)
  broca.rotation.y = 2.4

  const tilt = new THREE.Group()
  tilt.rotation.z = 0.26
  broca.add(tilt)

  const tip = cone(0.17, 0.45, STEEL, { roughness: 0.2, metalness: 0.9 })
  tip.rotation.x = Math.PI
  tip.position.y = 0.225
  tilt.add(tip)

  const shaft = cylinder(0.155, 0.17, 1.6, ORANGE, { roughness: 0.4 })
  shaft.position.y = 1.25
  tilt.add(shaft)

  for (const phase of [0, Math.PI]) {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 56; i++) {
      const k = i / 56
      const a = phase + k * Math.PI * 5
      const r = 0.178 - k * 0.022
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0.44 + k * 1.52, Math.sin(a) * r))
    }
    const flute = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.032, 8, false),
      mat(STEEL, { roughness: 0.25, metalness: 0.85, size: 1.6 }),
    )
    flute.castShadow = true
    flute.receiveShadow = true
    tilt.add(flute)
  }

  const collar = cylinder(0.195, 0.195, 0.1, STEEL_DARK, { roughness: 0.3, metalness: 0.7 })
  collar.position.y = 2.1
  tilt.add(collar)

  const shank = rbox(0.2, 0.42, 0.2, 0.03, STEEL_DARK, { roughness: 0.3, metalness: 0.7 })
  shank.position.y = 2.34
  tilt.add(shank)

  root.add(broca)

  // ---- pedreiro cabisbaixo ---------------------------------------------
  const pedreiro = person({ body: SHIRT, skin: SKIN, height: 1.5, armAngle: 0.42 })
  pedreiro.position.set(0.55, GY, 0.2)
  pedreiro.rotation.y = -0.32

  const bodyH = 1.5 * 0.52 // 0.78
  const bodyR = 1.5 * 0.17 // 0.255

  const belt = torus(0.245, 0.042, '#5a4028', { roughness: 0.85 })
  belt.rotation.x = -Math.PI / 2
  belt.position.y = 0.3
  pedreiro.add(belt)

  const pouch = rbox(0.19, 0.21, 0.11, 0.035, '#6b4a2c', { roughness: 0.85 })
  pouch.position.set(0.23, 0.24, 0.13)
  pouch.rotation.y = -0.35
  pedreiro.add(pouch)

  const head = pedreiro.getObjectByName('head')!
  head.rotation.x = 0.28 // cabisbaixo, assumindo a culpa

  const armR = pedreiro.getObjectByName('armR')!
  armR.position.set(bodyR * 1.2, bodyH * 0.66, 0.1)
  armR.rotation.set(-1.15, 0, 0.42) // estende o vidro à frente e para o lado (longe do MITO)

  const armL = pedreiro.getObjectByName('armL')!
  armL.rotation.set(0.18, 0, 0.3)

  root.add(pedreiro)

  // ---- capacete amarelo (cresce na cabeça) -----------------------------
  const capacete = new THREE.Group()
  capacete.position.y = 0.06
  const shell = lathe(
    [
      [0, -0.01], [0.33, -0.01], [0.36, 0.015], [0.3, 0.038],
      [0.29, 0.09], [0.24, 0.17], [0.14, 0.23], [0, 0.245],
    ],
    HELMET,
    { roughness: 0.35 },
  )
  capacete.add(shell)
  const crest = rbox(0.05, 0.05, 0.34, 0.02, '#c8901a', { roughness: 0.35 })
  crest.position.y = 0.2
  capacete.add(crest)
  head.add(capacete)

  // ---- camiseta MIT(O) rasgada -----------------------------------------
  const mito = new THREE.Group()
  mito.position.set(-0.02, 0.5, 0.245)

  const tbar = (w: number, h: number, color: string | number = '#39434d') => bar(w, h, 0.022, color)
  // M
  const m1 = tbar(0.026, 0.13); m1.position.set(-0.2, 0, 0)
  const m2 = tbar(0.026, 0.13); m2.position.set(-0.11, 0, 0)
  const m3 = tbar(0.024, 0.082); m3.position.set(-0.177, 0.026, 0.004); m3.rotation.z = 0.62
  const m4 = tbar(0.024, 0.082); m4.position.set(-0.133, 0.026, 0.004); m4.rotation.z = -0.62
  // I
  const i1 = tbar(0.026, 0.13); i1.position.set(-0.048, 0, 0)
  // T
  const tt1 = tbar(0.096, 0.026); tt1.position.set(0.035, 0.052, 0)
  const tt2 = tbar(0.026, 0.13); tt2.position.set(0.035, 0, 0)
  mito.add(m1, m2, m3, m4, i1, tt1, tt2)

  // o buraco escuro deixado pelo O arrancado
  const rasgo = rbox(0.15, 0.17, 0.014, 0.012, '#3d3b36', { roughness: 0.9 })
  rasgo.position.set(0.17, -0.005, -0.006)
  rasgo.rotation.z = 0.22
  mito.add(rasgo)

  // o retalho pendurado, com o O já mutilado
  const patch = new THREE.Group()
  patch.position.set(0.215, -0.035, 0.012)
  patch.rotation.z = -0.7
  const cloth = rbox(0.16, 0.18, 0.02, 0.012, SHIRT, { roughness: 0.9 })
  patch.add(cloth)
  const brokenO = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.017, 10, 28, Math.PI * 1.3),
    mat('#39434d', { roughness: 0.6, size: 0.12 }),
  )
  brokenO.castShadow = true
  brokenO.position.z = 0.018
  brokenO.rotation.z = 0.8
  patch.add(brokenO)
  mito.add(patch)

  pedreiro.add(mito)

  // ---- o vidro de FEL, rachado ------------------------------------------
  const vidro = new THREE.Group()
  vidro.rotation.set(0, -0.32, -VIDRO_TILT) // tomba de lado, para fora do corpo

  const flask = lathe(
    [
      [0, 0], [0.135, 0.008], [0.157, 0.055], [0.157, 0.26],
      [0.12, 0.32], [0.062, 0.365], [0.058, 0.44], [0.078, 0.468],
    ],
    GLASS,
    { roughness: 0.15 },
  )
  vidro.add(flask)

  // tampa o gargalo aberto com o próprio fel
  const surface = cylinder(0.058, 0.058, 0.02, FEL, { roughness: 0.2 })
  surface.position.y = 0.452
  vidro.add(surface)

  const label = rbox(0.17, 0.15, 0.02, 0.022, '#e8e2cf', { roughness: 0.8 })
  label.position.set(0, 0.17, 0.145)
  vidro.add(label)
  const drop = sphere(0.048, FEL, { roughness: 0.2 })
  drop.scale.set(1, 1.25, 0.35)
  drop.position.set(0, 0.17, 0.158)
  vidro.add(drop)

  // trinca: três lascas escuras que se encontram
  const crackSpecs: [number, number, number, number][] = [
    [0.1, 0.29, 0.115, 0.45],
    [0.145, 0.19, 0.06, -0.35],
    [0.06, 0.13, 0.15, 1.05],
  ]
  for (const [cx, cy, cz, rz] of crackSpecs) {
    const crack = rbox(0.011, 0.15, 0.011, 0.004, '#1c2a1a', { roughness: 0.4 })
    crack.position.set(cx, cy, cz)
    crack.rotation.set(0.2, 0, rz)
    vidro.add(crack)
  }

  const cork = cylinder(0.052, 0.06, 0.1, '#b08048', { roughness: 0.85 })
  cork.position.set(0.055, 0.53, 0.03)
  cork.rotation.z = -0.55
  vidro.add(cork)

  // o vidro fica na mão direita: a mão segura a lateral do frasco
  pedreiro.updateMatrixWorld(true)
  const handW = new THREE.Vector3()
  armR.children[0].getWorldPosition(handW)
  const grip = new THREE.Vector3(-0.12, 0.16, 0).applyEuler(vidro.rotation)
  vidro.position.copy(handW).sub(grip)
  const VIDRO_Y = vidro.position.y
  root.add(vidro)

  // boca do gargalo no mundo (pose tombada)
  vidro.updateMatrixWorld(true)
  const mouthW = new THREE.Vector3(0, 0.47, 0)
  vidro.localToWorld(mouthW)
  const fallH = mouthW.y - GY

  // ---- jato de fel (pivô no gargalo: cresce para baixo) ------------------
  const jato = new THREE.Group()
  jato.position.copy(mouthW)
  const stream = cylinder(0.04, 0.075, fallH, FEL, { roughness: 0.2 })
  stream.position.y = -fallH / 2
  jato.add(stream)
  for (const [dx, k, dz, r] of [[0.07, 0.3, 0.05, 0.035], [-0.06, 0.65, -0.04, 0.028]] as const) {
    const bead = sphere(r, FEL, { roughness: 0.2 })
    bead.position.set(dx, -fallH * k, dz)
    jato.add(bead)
  }
  root.add(jato)

  // ---- poça verde-limão com respingos ------------------------------------
  const poca = new THREE.Group()
  poca.position.set(mouthW.x, GY + 0.005, mouthW.z)

  const pool = cylinder(0.46, 0.42, 0.035, FEL, { roughness: 0.15 })
  pool.position.y = 0.018
  poca.add(pool)

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.6
    const lobe = cylinder(0.19 + rand() * 0.09, 0.17, 0.03, FEL, { roughness: 0.15 })
    lobe.position.set(Math.cos(a) * 0.36, 0.016, Math.sin(a) * 0.36)
    poca.add(lobe)
  }
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2
    const d = 0.6 + rand() * 0.42
    const splash = sphere(0.03 + rand() * 0.032, FEL, { roughness: 0.15 })
    splash.scale.y = 0.35
    splash.position.set(Math.cos(a) * d, 0.014, Math.sin(a) * d)
    poca.add(splash)
  }
  root.add(poca)

  // ---- peças -------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'lote', object: base },
    { name: 'placa', group: 'lote', object: placa },
    { name: 'cratera', group: 'furo', object: cratera },
    { name: 'broca', group: 'furo', object: broca },
    { name: 'pedreiro', group: 'pedreiro', object: pedreiro },
    { name: 'capacete', group: 'pedreiro', object: capacete },
    { name: 'mito', group: 'mito', object: mito },
    { name: 'vidro', group: 'fel', object: vidro },
    { name: 'jato', group: 'fel', object: jato },
    { name: 'poca', group: 'fel', object: poca },
  ]

  // ---- montagem ----------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Brota um LOTE de terra: o canteiro de obra do vizinho.',
    }),
    seq('placa-rise', 'placa', 0.15, 0.8, [riseFrom(GY, 1.5)], { ease: 'easeOut' }),

    seq(
      'cratera-grow',
      'cratera',
      1.9,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: 'Abre-se um buraco no lote errado…' },
    ),
    seq('broca-rise', 'broca', 2.1, 0.9, [riseFrom(0.42, 3.0)], { ease: 'easeOut' }),
    seq('broca-crava', 'broca', 3.05, 0.7, [ch('position.y', 0.42, 0.11), ch('rotation.y', 0, 2.4)], {
      ease: 'easeIn',
      caption: 'A broca gigante FURA o LOTE do outro — FUR-LÔT! (förlåt)',
    }),

    seq('pedreiro-rise', 'pedreiro', 4.9, 0.9, [riseFrom(GY, 1.95)], {
      ease: 'easeOut',
      caption: 'O pedreiro sai do buraco, cabisbaixo: DÊ VAR… (det var)',
    }),
    seq(
      'capacete-pop',
      'capacete',
      5.15,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq(
      'mito-pop',
      'mito',
      7.0,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: "Na camiseta, MITO com o O arrancado: MIT'! (mitt = meu)" },
    ),

    seq('vidro-rise', 'vidro', 9.0, 0.8, [riseFrom(VIDRO_Y, 1.35)], {
      ease: 'easeOut',
      caption: 'Ele estende o vidro rachado de FÊL, o verde amargo de trinta anos.',
    }),
    seq('vidro-tomba', 'vidro', 10.0, 0.7, [ch('rotation.z', 0, -VIDRO_TILT)]),
    seq('jato-corre', 'jato', 10.45, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeIn' }),
    seq(
      'poca-espalha',
      'poca',
      10.9,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'Förlåt, det var mitt fel. — "Desculpa, foi culpa minha."',
      },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.6, 5.25], target: [-0.3, 1.15, 0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'forlat-det-var-mitt-fel',
    contexto: 'Esbarrou em alguém, atrasou uma entrega, esqueceu o lixo da vez, errou no trabalho.',
    fraseFonte: 'Desculpa, foi culpa minha.',
    fraseAlvo: 'Förlåt, det var mitt fel.',
    pronuncia: "för-LÔT, de var mit FÊL (o 't' de 'det' é mudo: soa 'de')",
    ponteSonora:
      "FUR-LÔT! DÊ VAR... MIT' FÊL! (LÔT sem vogal depois do T; VAR com R audível; MIT' é MITO com o O arrancado — trave a língua no T)",
    historia:
      'O pedreiro FURA-LOTE enfia a broca no lote do vizinho e estoura o vidro de FEL, o líquido verde amargo guardado há trinta anos. Ele veste uma camiseta escrita MITO com o O rasgado fora, e estende o vidro rachado, cabisbaixo, assumindo a culpa.',
  },
  createScene,
}

export default card
