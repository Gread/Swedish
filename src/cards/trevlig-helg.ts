import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Trevlig helg!" — TRÊV-LI RRÉLI.
 *
 * Diorama: laje de prédio ao entardecer. A dona da laje (rosa, óculos escuros)
 * liga a HÉLICE de drone que ergue o TRÊVO de quatro folhas gigante como
 * guarda-sol. A hélice trava no meio do giro — o nome dela fica pela metade,
 * RRÉLI — e ela se joga na espreguiçadeira listrada com o copo de suco.
 */

const CONCRETE = '#b3ada0'
const CONCRETE_DARK = '#8e887c'
const MURETA = '#c2bcae'
const COPING = '#a49d90'
const TERRACOTA = '#b5623c'
const WOOD = '#8a6a42'
const CREAM = '#f0ebe0'
const GRASS = '#4f9c3a'
const LIME = '#8ec63f'
const PINK = '#c85585'
const SKIN = '#e8c39e'
const HAIR = '#b9b3ad'
const CHROME = '#c9ccd1'
const ACCENT = '#f0821e' // reservado à HÉLICE — o objeto da ponte sonora

const GY = 0.18 // topo da laje
const TILT = 0.42 // inclinação do cabo do guarda-sol (para -x, sobre a cadeira)
const TILT_X = 0.38 // e para a câmera: o trevo mostra as quatro folhas de frente
const POT_X = 0.42
const POT_Z = -0.85
const STEM_Y = GY + 0.44 // boca do vaso: onde a haste nasce

/** Ponto a `d` unidades ao longo do eixo inclinado do cabo (Euler XYZ: z, depois x). */
function onAxis(d: number): [number, number, number] {
  return [
    POT_X - Math.sin(TILT) * d,
    STEM_Y + Math.cos(TILT) * Math.cos(TILT_X) * d,
    POT_Z + Math.cos(TILT) * Math.sin(TILT_X) * d,
  ]
}

const LEAF_D = 1.72
const PROP_D = 1.95

const CHAIR_POS: [number, number, number] = [-0.95, GY, -0.2]
const CHAIR_YAW = 1.05

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- laje do prédio ------------------------------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.6, 2.66, 0.12, CONCRETE_DARK, { roughness: 0.9 })
  slab.position.y = 0.06
  base.add(slab)

  const floor = cylinder(2.54, 2.6, 0.07, CONCRETE, { roughness: 0.85 })
  floor.position.y = 0.145
  base.add(floor)

  // mureta: arco de blocos cobrindo a metade de trás da laje
  const MURETA_R = 2.3
  for (let i = 0; i < 11; i++) {
    const a = 1.02 + (i / 10) * 4.24
    const block = rbox(0.94, 0.42, 0.16, 0.05, MURETA, { roughness: 0.85 })
    block.position.set(Math.sin(a) * MURETA_R, GY + 0.21, Math.cos(a) * MURETA_R)
    block.rotation.y = a
    const cap = rbox(0.98, 0.07, 0.22, 0.03, COPING, { roughness: 0.8 })
    cap.position.y = 0.245
    block.add(cap)
    base.add(block)
  }

  // adereços de laje, espalhados com rng fixo
  const vent = rbox(0.52, 0.34, 0.46, 0.06, '#6f7379', { roughness: 0.55 })
  vent.position.set(-1.62, GY + 0.17, -1.28)
  vent.rotation.y = 0.35 + rand() * 0.3
  for (let i = 0; i < 3; i++) {
    const slat = rbox(0.36, 0.03, 0.02, 0.01, '#4a4e54', { roughness: 0.5 })
    slat.position.set(0, 0.08 - i * 0.08, 0.235)
    vent.add(slat)
  }
  base.add(vent)

  const hose = new THREE.Group()
  hose.position.set(1.5, GY + 0.05, 0.45)
  hose.rotation.y = rand() * Math.PI
  for (const [r, off] of [[0.25, 0], [0.17, 0.03]] as const) {
    const coil = torus(r, 0.045, '#2f6b4a', { roughness: 0.6 })
    coil.rotation.x = Math.PI / 2
    coil.position.y = off
    hose.add(coil)
  }
  base.add(hose)

  for (const [px, pz, seed] of [[-2.02, 0.42, 31], [1.05, -1.86, 32]] as const) {
    const potinho = cylinder(0.14, 0.11, 0.2, TERRACOTA, { roughness: 0.8 })
    potinho.position.set(px, GY + 0.1, pz)
    potinho.rotation.y = rand() * Math.PI
    const mato = puff(0.17, '#3f7d33', 5, seed, { roughness: 0.9 })
    mato.position.y = 0.16
    potinho.add(mato)
    base.add(potinho)
  }
  root.add(base)

  // ---- vaso de barro: de onde nasce o cabo do trevo ------------------------
  const vaso = new THREE.Group()
  vaso.position.set(POT_X, GY, POT_Z)

  const barro = lathe(
    [
      [0, 0], [0.26, 0], [0.3, 0.1], [0.25, 0.44], [0.3, 0.5],
      [0.3, 0.56], [0.24, 0.56], [0.24, 0.5], [0.2, 0.44], [0, 0.44],
    ],
    TERRACOTA,
    { roughness: 0.8 },
  )
  vaso.add(barro)

  const terra = cylinder(0.2, 0.2, 0.05, '#4a3b2c', { roughness: 0.95 })
  terra.position.y = 0.43
  vaso.add(terra)

  for (const [sx, sz] of [[0.1, 0.08], [-0.09, -0.06]] as const) {
    const seixo = sphere(0.045, '#8d9296', { roughness: 0.85 })
    seixo.position.set(sx, 0.46, sz)
    vaso.add(seixo)
  }
  root.add(vaso)

  // ---- espreguiçadeira listrada --------------------------------------------
  const espreguicadeira = new THREE.Group()
  espreguicadeira.position.set(...CHAIR_POS)
  espreguicadeira.rotation.y = CHAIR_YAW

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pe = cylinder(0.032, 0.04, 0.36, WOOD, { roughness: 0.75 })
      pe.position.set(sx * 0.28, 0.18, sz * 0.4)
      espreguicadeira.add(pe)
    }
    const rail = rbox(0.06, 0.06, 1.02, 0.025, WOOD, { roughness: 0.75 })
    rail.position.set(sx * 0.3, 0.37, 0)
    espreguicadeira.add(rail)
  }
  for (const sz of [-1, 1]) {
    const travessa = rbox(0.66, 0.06, 0.06, 0.025, WOOD, { roughness: 0.75 })
    travessa.position.set(0, 0.37, sz * 0.4)
    espreguicadeira.add(travessa)
  }

  for (let i = 0; i < 7; i++) {
    const ripa = rbox(0.56, 0.05, 0.115, 0.022, i % 2 ? TERRACOTA : CREAM, { roughness: 0.9 })
    ripa.position.set(0, 0.4, -0.42 + i * 0.145)
    espreguicadeira.add(ripa)
  }

  const encosto = new THREE.Group()
  encosto.position.set(0, 0.38, -0.48)
  encosto.rotation.x = -0.62
  for (const sx of [-1, 1]) {
    const rail = rbox(0.055, 0.74, 0.055, 0.022, WOOD, { roughness: 0.75 })
    rail.position.set(sx * 0.3, 0.37, 0)
    encosto.add(rail)
  }
  for (let i = 0; i < 5; i++) {
    const ripa = rbox(0.56, 0.115, 0.05, 0.022, i % 2 ? CREAM : TERRACOTA, { roughness: 0.9 })
    ripa.position.set(0, 0.1 + i * 0.15, 0)
    encosto.add(ripa)
  }
  const topo = rbox(0.66, 0.06, 0.06, 0.025, WOOD, { roughness: 0.75 })
  topo.position.set(0, 0.75, 0)
  encosto.add(topo)
  espreguicadeira.add(encosto)
  root.add(espreguicadeira)

  // ---- a dona da laje (pose final: recostada na espreguiçadeira) -----------
  // mount alinhado à cadeira: assim o recosto gira no eixo curto da cadeira
  const donaMount = new THREE.Group()
  donaMount.position.set(...CHAIR_POS)
  donaMount.rotation.y = CHAIR_YAW
  root.add(donaMount)

  const dona = person({ body: PINK, skin: SKIN, height: 1.45, armAngle: 0.62 })
  dona.position.set(0, 0.4, 0.38)
  dona.rotation.x = -1.0
  donaMount.add(dona)

  const cabeca = dona.getObjectByName('head')!

  const cabelo = sphere(0.288, HAIR, { roughness: 0.9 })
  cabelo.position.set(0, 0.045, -0.08)
  cabelo.scale.set(1, 0.98, 1)
  cabeca.add(cabelo)

  const coque = sphere(0.125, HAIR, { roughness: 0.9 })
  coque.position.set(0, 0.215, -0.235)
  cabeca.add(coque)

  const laco = torus(0.085, 0.024, PINK, { roughness: 0.9 })
  laco.position.set(0, 0.16, -0.2)
  laco.rotation.x = 1.1
  cabeca.add(laco)

  // óculos escuros: peça própria, cresce no rosto
  const oculos = new THREE.Group()
  for (const side of [-1, 1]) {
    const lente = rbox(0.2, 0.145, 0.035, 0.03, '#22252a', { roughness: 0.12 })
    lente.position.set(side * 0.115, 0.045, 0.235)
    oculos.add(lente)

    const haste = rbox(0.03, 0.03, 0.2, 0.012, '#3a3f46', { roughness: 0.3 })
    haste.position.set(side * 0.205, 0.055, 0.115)
    haste.rotation.y = side * 0.3
    oculos.add(haste)
  }
  const ponte = rbox(0.1, 0.035, 0.03, 0.012, '#3a3f46', { roughness: 0.3 })
  ponte.position.set(0, 0.058, 0.248)
  oculos.add(ponte)
  cabeca.add(oculos)

  // ---- cabo do guarda-sol (haste do trevo) ---------------------------------
  const haste = new THREE.Group()
  haste.position.set(POT_X, STEM_Y, POT_Z)
  haste.rotation.set(TILT_X, 0, TILT)

  const cabo = cylinder(0.055, 0.08, 1.86, GRASS, { roughness: 0.75 })
  cabo.position.y = 0.93
  haste.add(cabo)

  const colar = cylinder(0.1, 0.11, 0.09, GRASS, { roughness: 0.7 })
  colar.position.y = 0.06
  haste.add(colar)
  root.add(haste)

  // ---- quatro folhas verde-limão -------------------------------------------
  const folhas = new THREE.Group()
  folhas.position.set(...onAxis(LEAF_D))
  folhas.rotation.set(TILT_X, 0, TILT)

  const miolo = sphere(0.17, GRASS, { roughness: 0.7 })
  miolo.scale.set(1, 0.5, 1)
  folhas.add(miolo)

  for (let i = 0; i < 4; i++) {
    const folha = new THREE.Group()
    folha.rotation.y = i * (Math.PI / 2) + 0.35
    folha.rotation.x = 0.18

    for (const sx of [-1, 1]) {
      const lobo = sphere(0.42, LIME, { roughness: 0.7 })
      lobo.position.set(sx * 0.27, 0, 0.5)
      lobo.scale.set(1, 0.14, 1.05)
      folha.add(lobo)
    }
    const junta = sphere(0.34, LIME, { roughness: 0.7 })
    junta.position.set(0, 0, 0.18)
    junta.scale.set(1, 0.14, 1)
    folha.add(junta)

    const nervura = cylinder(0.022, 0.03, 0.5, GRASS, { roughness: 0.75 })
    nervura.position.set(0, 0.02, 0.3)
    nervura.rotation.x = Math.PI / 2
    folha.add(nervura)

    folhas.add(folha)
  }
  root.add(folhas)

  // ---- a HÉLICE de drone (acento) ------------------------------------------
  // mount inclinado: o giro acontece no eixo do cabo, não no eixo do mundo
  const heliceMount = new THREE.Group()
  heliceMount.position.set(...onAxis(PROP_D))
  heliceMount.rotation.set(TILT_X, 0, TILT)
  root.add(heliceMount)

  const helice = new THREE.Group()
  helice.rotation.y = 23.05 // pose final: travada no meio do giro
  heliceMount.add(helice)

  const luva = cylinder(0.085, 0.1, 0.16, CHROME, { roughness: 0.22, metalness: 0.9 })
  luva.position.y = -0.1
  helice.add(luva)

  const cubo = cylinder(0.1, 0.09, 0.11, CHROME, { roughness: 0.2, metalness: 0.9 })
  cubo.position.y = 0.02
  helice.add(cubo)

  const ogiva = cone(0.085, 0.15, ACCENT, { roughness: 0.35 })
  ogiva.position.y = 0.13
  helice.add(ogiva)

  for (const sx of [-1, 1]) {
    const pa = rbox(0.86, 0.045, 0.25, 0.02, ACCENT, { roughness: 0.35 })
    pa.position.set(sx * 0.47, 0.02, 0)
    pa.rotation.x = 0.32
    helice.add(pa)

    const ponta = sphere(0.055, ACCENT, { roughness: 0.35 })
    ponta.position.set(sx * 0.9, 0.02, 0)
    ponta.scale.set(0.6, 0.4, 1.3)
    helice.add(ponta)
  }

  // ---- copo de suco --------------------------------------------------------
  const copo = new THREE.Group()
  copo.position.set(-0.22, GY, 0.42)
  copo.scale.setScalar(1.25)

  const vidro = lathe(
    [
      [0, 0], [0.1, 0], [0.108, 0.04], [0.128, 0.3],
      [0.12, 0.3], [0.1, 0.04], [0.092, 0.02], [0, 0.02],
    ],
    '#dfe9ee',
    { roughness: 0.08, detail: 0 },
  )
  const vidroMat = vidro.material as THREE.MeshStandardMaterial
  vidroMat.transparent = true
  vidroMat.opacity = 0.38
  vidroMat.depthWrite = false
  vidro.castShadow = false
  copo.add(vidro)

  const suco = cylinder(0.108, 0.09, 0.2, '#c94f3d', { roughness: 0.3 })
  suco.position.y = 0.13
  copo.add(suco)

  const limao = cylinder(0.075, 0.075, 0.022, LIME, { roughness: 0.5 })
  limao.rotation.x = Math.PI / 2
  limao.rotation.y = 0.5
  limao.position.set(-0.1, 0.29, 0.05)
  copo.add(limao)

  const canudo = cylinder(0.017, 0.017, 0.44, CREAM, { roughness: 0.4 })
  canudo.position.set(0.045, 0.29, 0)
  canudo.rotation.z = -0.3
  copo.add(canudo)
  root.add(copo)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'laje', object: base },
    { name: 'vaso', group: 'laje', object: vaso },
    { name: 'espreguicadeira', group: 'movel', object: espreguicadeira },
    { name: 'dona', group: 'dona', object: dona },
    { name: 'oculos', group: 'dona', object: oculos },
    { name: 'helice', group: 'trevo', object: helice },
    { name: 'haste', group: 'trevo', object: haste },
    { name: 'folhas', group: 'trevo', object: folhas },
    { name: 'copo', group: 'final', object: copo },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.95)], {
      caption: 'Sexta-feira ao entardecer: a laje do prédio brota do chão…',
    }),
    seq('vaso-rise', 'vaso', 0.2, 0.7, [riseFrom(GY, 1.0)]),

    seq('cadeira-rise', 'espreguicadeira', 2.0, 0.8, [riseFrom(GY, 1.45)]),

    seq('dona-rise', 'dona', 3.8, 0.8, [ch('position.y', -1.9, 0)], {
      caption: '…sobe a dona da laje na espreguiçadeira listrada — é o ritual dela.',
    }),
    seq(
      'oculos-pop',
      'oculos',
      3.95,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
    ),

    seq(
      'helice-rise',
      'helice',
      5.6,
      0.9,
      [ch('position.y', -3.0, 0), ch('scale.x', 0.22, 1)],
      { caption: 'Ela liga a HÉLICE do drone, que sobe pelo cabo e o ergue…' },
    ),
    seq('haste-grow', 'haste', 5.8, 0.8, [ch('scale.y', 0.01, 1)]),

    seq('helice-spin1', 'helice', 6.8, 0.8, [ch('rotation.y', 0, 9.4)]),
    seq(
      'folhas-abrir',
      'folhas',
      7.2,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { caption: '…e abre o TRÊVO gigante de quatro folhas (TRÊV, o final de KIEV).' },
    ),
    seq('helice-spin2', 'helice', 7.6, 0.9, [ch('rotation.y', 9.4, 22.0)]),

    seq('helice-trava', 'helice', 8.5, 0.6, [ch('rotation.y', 22.0, 23.3)], {
      caption: 'A HÉLICE trava no meio do giro — o nome dela fica pela metade: RRÉLI!',
    }),
    seq('helice-tranco', 'helice', 9.1, 0.35, [ch('rotation.y', 23.3, 23.05)]),

    seq(
      'dona-joga',
      'dona',
      10.1,
      0.7,
      [
        ch('position.x', -0.78, 0),
        ch('position.y', 0, 0.4),
        ch('position.z', 1.25, 0.38),
        ch('rotation.x', 0, -1.0),
        ch('rotation.y', 0.15, 0),
      ],
      { caption: 'Ela se joga debaixo do trevo: TRÊV-LI RRÉLI — Trevlig helg!' },
    ),
    seq('copo-rise', 'copo', 11.0, 0.7, [riseFrom(GY, 1.0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.55, 5.0], target: [-0.3, 1.22, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'trevlig-helg',
    contexto: 'Sexta-feira ao sair do trabalho, no caixa do supermercado, na última mensagem da semana.',
    fraseFonte: 'Bom fim de semana!',
    fraseAlvo: 'Trevlig helg!',
    pronuncia: "TRÊV-li RRÉLI ('h' aspirado tipo 'rr'; o 'g' final soa como 'i' curto)",
    ponteSonora:
      "TRÊV-LI RRÉLI! (TRÊV colado como o final de KIEV; RRÉLI = 'hélice' cortada antes do -CE, com R raspado carioca)",
    historia:
      'Toda sexta a dona da laje sobe com uma HÉLICE de drone que ergue o trevo-guarda-sol gigante. A hélice trava no meio do giro — por isso o nome dela fica pela metade, RRÉLI — e ela se joga na espreguiçadeira debaixo do trevo.',
  },
  createScene,
}

export default card
