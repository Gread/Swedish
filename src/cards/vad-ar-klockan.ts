import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Vad är klockan?" — VÁ! É CLÓ-CAN!
 *
 * Praia ao entardecer. O mergulhador sai da água sem ideia da hora; na pedra,
 * um caranguejo-relojoeiro conta as horas ESTALANDO a garra desproporcional
 * (CLÓ-CAN! CLÓ-CAN!) e agita a bandeirinha verde gritando VÁ! É…?
 *
 * REGRA DA CENA: não existe mostrador, ponteiro, disco de relógio nem número
 * em lugar nenhum — a hora é contada só em estalos de garra.
 */

const SAND = '#c9b696'
const SAND_WET = '#a4906f'
const SEA = '#2f8f97'
const SEA_DEEP = '#22707a'
const FOAM = '#e9f1ec'
const STONE = '#5c636b'
const STONE_DARK = '#494f57'
const CRAB = '#c2652c'
const CRAB_DARK = '#a0501f'
const CORAL = '#f2603c' // acento saturado: A GARRA que estala as horas
const CLAW_TIP = '#3b2219' // pontas escuras de pinça de caranguejo
const NAVY = '#26406e'
const NAVY_DARK = '#1b2f52'
const SKIN = '#e8c39e'
const GREEN = '#3f8f4a'
const STEEL = '#93a7b4'
const GOLD = '#dfb54e'
const WEED = '#3a6f4a'

const SEA_Y = 0.14 // topo da lâmina d'água
const GY = 0.24 // topo da areia
const SAND_CZ = 0.55 // a ilha de areia é deslocada: o mar sobra ao fundo

const CRAB_POS: [number, number, number] = [1.2, 0.66, -0.45]
const DIVER_POS: [number, number, number] = [-0.95, GY, 0.55]

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: mar ao fundo, areia molhada na frente ---------------
  const base = new THREE.Group()

  const water = cylinder(2.62, 2.7, 0.14, SEA, { roughness: 0.2 })
  water.position.y = 0.07
  base.add(water)

  // duas cristas baixas dão leitura de lâmina d'água sem virar espelho
  for (const [wx, wz, wr] of [[-0.55, -2.15, 1.5], [0.85, -1.85, 1.1]] as const) {
    const crest = capsule(0.05, wr, SEA_DEEP, { roughness: 0.25 })
    crest.rotation.z = Math.PI / 2
    crest.rotation.y = (rand() - 0.5) * 0.5
    crest.position.set(wx, SEA_Y - 0.01, wz)
    crest.scale.y = 1
    base.add(crest)
  }

  const sand = cylinder(2.0, 2.06, 0.1, SAND, { roughness: 0.92 })
  sand.position.set(0, SEA_Y + 0.05, SAND_CZ)
  base.add(sand)

  // faixa de areia molhada logo abaixo da linha da maré
  const wet = cylinder(1.86, 1.9, 0.02, SAND_WET, { roughness: 0.55 })
  wet.position.set(0, GY - 0.004, SAND_CZ - 0.16)
  base.add(wet)

  // espuma na borda: puffs achatados ao longo do arco que encosta no mar
  for (const t of [-0.72, -0.36, 0, 0.36, 0.72]) {
    const a = Math.PI + t
    const f = puff(0.15 + rand() * 0.05, FOAM, 5, 30 + Math.round(t * 10), { roughness: 0.8 })
    f.position.set(Math.sin(a) * 1.97, GY - 0.02, SAND_CZ + Math.cos(a) * 1.97)
    f.scale.set(1, 0.4, 0.8)
    base.add(f)
  }

  // adereços de praia espalhados com rng fixo
  for (const [sx, sz, ss, seed] of [
    [-1.55, 1.05, 1.0, 41],
    [0.55, 1.75, 0.75, 42],
  ] as const) {
    const shell = lathe(
      [[0, 0], [0.1, 0.02], [0.16, 0.06], [0.12, 0.11], [0.05, 0.13], [0, 0.12]],
      '#efe2cf',
      { roughness: 0.35 },
    )
    shell.position.set(sx, GY, sz)
    shell.rotation.set(0.4 + rand() * 0.3, rand() * Math.PI, 0.25)
    shell.scale.setScalar(ss)
    shell.userData.seed = seed
    base.add(shell)
  }

  // estrela do mar
  const star = new THREE.Group()
  star.position.set(-0.55, GY + 0.01, 1.55)
  star.rotation.y = rand() * Math.PI
  for (let i = 0; i < 5; i++) {
    const arm = capsule(0.045, 0.16, '#b8785f', { roughness: 0.85 })
    const a = (i / 5) * Math.PI * 2
    arm.position.set(Math.sin(a) * 0.11, 0.03, Math.cos(a) * 0.11)
    arm.rotation.set(Math.cos(a) * 1.35, 0, -Math.sin(a) * 1.35)
    star.add(arm)
  }
  base.add(star)

  // algas na beira d'água + pedrinhas
  for (const [gx, gz, gh, gseed] of [
    [-1.9, -0.75, 0.34, 51],
    [1.75, -0.55, 0.26, 52],
    [1.35, -1.35, 0.3, 53],
  ] as const) {
    const weed = capsule(0.035, gh, WEED, { roughness: 0.9 })
    weed.position.set(gx, GY + gh * 0.4, gz)
    weed.rotation.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.7)
    weed.userData.seed = gseed
    base.add(weed)
  }
  for (const [px, pz, pr, pseed] of [
    [-1.15, -0.35, 0.11, 61],
    [1.9, 1.0, 0.08, 62],
  ] as const) {
    const pebble = sphere(pr, STONE_DARK, { roughness: 0.9 })
    pebble.position.set(px, GY + pr * 0.25, pz)
    pebble.rotation.y = rand() * Math.PI
    pebble.scale.set(1.2, 0.55, 0.9)
    pebble.userData.seed = pseed
    base.add(pebble)
  }
  root.add(base)

  // ---- pedra chata onde o caranguejo se empoleira --------------------------
  const pedra = new THREE.Group()
  pedra.position.set(CRAB_POS[0], GY, CRAB_POS[2])

  // laje arredondada (perfil torneado): pedra lisa de praia, não estilhaço
  const slab = lathe(
    [[0, 0], [0.6, 0], [0.7, 0.06], [0.74, 0.17], [0.69, 0.29], [0.55, 0.38], [0.3, 0.42], [0, 0.43]],
    STONE,
    { roughness: 0.88 },
    28,
  )
  slab.scale.set(1.12, 1, 0.92)
  pedra.add(slab)

  // faixa úmida na base da laje (contato com a areia)
  const slabWet = lathe([[0, 0], [0.76, 0], [0.8, 0.03], [0, 0.04]], STONE_DARK, { roughness: 0.6 }, 28)
  slabWet.scale.set(1.12, 1, 0.92)
  slabWet.position.y = -0.01
  pedra.add(slabWet)

  const slabLow = sphere(0.3, STONE_DARK, { roughness: 0.9 })
  slabLow.position.set(-0.74, 0.06, 0.42)
  slabLow.scale.set(1.1, 0.42, 0.85)
  pedra.add(slabLow)

  const barnacle = sphere(0.1, '#7a8188', { roughness: 0.95 })
  barnacle.position.set(0.5, 0.33, -0.28)
  barnacle.scale.y = 0.55
  pedra.add(barnacle)
  root.add(pedra)

  // ---- caranguejo-relojoeiro (olha para o mergulhador, +z local) -----------
  const caranguejo = new THREE.Group()
  caranguejo.position.set(CRAB_POS[0], CRAB_POS[1], CRAB_POS[2])
  caranguejo.rotation.y = Math.atan2(DIVER_POS[0] - CRAB_POS[0], DIVER_POS[2] - CRAB_POS[2])

  const carapaca = sphere(0.36, CRAB, { roughness: 0.5 })
  carapaca.position.y = 0.16
  carapaca.scale.set(1.3, 0.72, 1.05)
  caranguejo.add(carapaca)

  const rimShell = capsule(0.05, 0.62, CRAB_DARK, { roughness: 0.6 })
  rimShell.rotation.z = Math.PI / 2
  rimShell.position.set(0, 0.06, 0.19)
  caranguejo.add(rimShell)

  const boca = rbox(0.14, 0.045, 0.04, 0.018, '#5c2a12', { roughness: 0.6 })
  boca.position.set(0, 0.05, 0.36)
  caranguejo.add(boca)

  // seis perninhas em arco (sobem da carapaça até o joelho e descem até a
  // pedra): saem visivelmente de baixo do casco, em leque
  for (const side of [-1, 1]) {
    for (const lz of [-0.24, 0.0, 0.24]) {
      const legRig = new THREE.Group()
      legRig.position.set(side * 0.3, 0, lz)
      legRig.rotation.y = side * lz * 1.3
      const thigh = capsule(0.04, 0.2, CRAB_DARK, { roughness: 0.6 })
      thigh.position.set(side * 0.2, 0.15, 0)
      thigh.rotation.z = -side * 1.1
      const knee = sphere(0.045, CRAB_DARK, { roughness: 0.6 })
      knee.position.set(side * 0.3, 0.2, 0)
      const shin = capsule(0.034, 0.25, CRAB_DARK, { roughness: 0.6 })
      shin.position.set(side * 0.35, 0.05, 0)
      shin.rotation.z = side * 0.32
      legRig.add(thigh, knee, shin)
      caranguejo.add(legRig)
    }
  }

  // olhinhos em talo
  for (const side of [-1, 1]) {
    const stalk = cylinder(0.028, 0.034, 0.2, CRAB, { roughness: 0.55 })
    stalk.position.set(side * 0.13, 0.38, 0.16)
    stalk.rotation.z = -side * 0.12
    caranguejo.add(stalk)

    const eye = sphere(0.072, '#ffffff', { roughness: 0.22 })
    eye.position.set(side * 0.15, 0.5, 0.17)
    eye.scale.z = 0.72
    const pupil = sphere(0.034, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.155, 0.505, 0.235)
    caranguejo.add(eye, pupil)
  }

  // garrinha (a pequena) — segura a bandeirinha
  const garrinha = new THREE.Group()
  garrinha.position.set(-0.42, 0.13, 0.2)
  garrinha.rotation.z = 0.55
  const garrinhaArm = capsule(0.05, 0.16, CRAB, { roughness: 0.55 })
  garrinhaArm.position.y = 0.11
  garrinha.add(garrinhaArm)
  const garrinhaJawA = rbox(0.18, 0.06, 0.08, 0.025, CORAL, { roughness: 0.45 })
  garrinhaJawA.position.set(-0.08, 0.24, 0)
  garrinhaJawA.rotation.z = 0.3
  const garrinhaJawB = rbox(0.17, 0.055, 0.075, 0.024, CORAL, { roughness: 0.45 })
  garrinhaJawB.position.set(-0.08, 0.3, 0)
  garrinhaJawB.rotation.z = -0.12
  garrinha.add(garrinhaJawA, garrinhaJawB)
  caranguejo.add(garrinha)
  root.add(caranguejo)

  // ---- A GARRA GIGANTE: o "relógio" da cena — só estalos, zero mostrador ---
  const garra = new THREE.Group()
  garra.position.set(0.42, 0.12, 0.14)
  garra.rotation.z = -0.3 // pose final: erguida, inclinada pra fora
  // gira o plano da pinça para a câmera: a abertura da pinça lê de frente,
  // em vez de ficar de perfil (de perfil ela parecia um bico de pato)
  garra.rotation.y = 0.95

  const upperArm = capsule(0.09, 0.24, CRAB, { roughness: 0.5 })
  upperArm.position.y = 0.2
  garra.add(upperArm)

  const elbow = sphere(0.11, CRAB_DARK, { roughness: 0.55 })
  elbow.position.y = 0.38
  garra.add(elbow)

  const foreArm = capsule(0.105, 0.16, CORAL, { roughness: 0.4 })
  foreArm.position.y = 0.53
  garra.add(foreArm)

  const palm = sphere(0.22, CORAL, { roughness: 0.4 })
  palm.position.y = 0.7
  palm.scale.set(1.15, 1.0, 0.7)
  garra.add(palm)

  // dedo fixo (mandíbula de baixo)
  const dedoFixo = rbox(0.46, 0.14, 0.19, 0.055, CORAL, { roughness: 0.4 })
  dedoFixo.position.set(0.26, 0.62, 0)
  dedoFixo.rotation.z = -0.14
  garra.add(dedoFixo)
  const dedoFixoTip = cone(0.075, 0.16, CLAW_TIP, { roughness: 0.35 })
  dedoFixoTip.position.set(0.5, 0.585, 0)
  dedoFixoTip.rotation.z = -Math.PI / 2 - 0.14
  garra.add(dedoFixoTip)
  // dentes serrilhados na borda interna: lê como pinça, não como bico
  for (let i = 0; i < 4; i++) {
    const tooth = cone(0.028, 0.07, '#f7d9b8', { roughness: 0.4 }, 10)
    tooth.position.set(0.12 + i * 0.09, 0.7 - i * 0.013, 0)
    tooth.rotation.z = -0.14
    garra.add(tooth)
  }

  // dedo móvel: peça própria, a que ESTALA (CLÓ-CAN)
  const pinca = new THREE.Group()
  pinca.position.set(0.04, 0.78, 0)
  pinca.rotation.z = 0.5 // pose final: pinça semiaberta
  const jaw = rbox(0.44, 0.13, 0.18, 0.05, CORAL, { roughness: 0.4 })
  jaw.position.set(0.23, 0.0, 0)
  pinca.add(jaw)
  const jawTip = cone(0.07, 0.15, CLAW_TIP, { roughness: 0.35 })
  jawTip.position.set(0.46, -0.02, 0)
  jawTip.rotation.z = -Math.PI / 2
  pinca.add(jawTip)
  for (let i = 0; i < 4; i++) {
    const tooth = cone(0.026, 0.065, '#f7d9b8', { roughness: 0.4 }, 10)
    tooth.position.set(0.1 + i * 0.09, -0.08, 0)
    tooth.rotation.z = Math.PI
    pinca.add(tooth)
  }
  const knuckle = sphere(0.085, CORAL, { roughness: 0.45 })
  pinca.add(knuckle)
  garra.add(pinca)
  caranguejo.add(garra)

  // ---- bandeirinha verde de largada ---------------------------------------
  const bandeira = new THREE.Group()
  bandeira.position.set(-0.56, 0.4, 0.28)
  const pole = cylinder(0.017, 0.02, 0.5, '#e6dccb', { roughness: 0.6 })
  pole.position.y = 0.25
  bandeira.add(pole)
  const cloth = rbox(0.32, 0.22, 0.02, 0.012, GREEN, { roughness: 0.9 })
  cloth.position.set(0.17, 0.4, 0.01)
  cloth.rotation.z = -0.06
  bandeira.add(cloth)
  const clothFold = rbox(0.3, 0.05, 0.018, 0.008, '#347a3e', { roughness: 0.9 })
  clothFold.position.set(0.17, 0.33, 0.02)
  bandeira.add(clothFold)
  const finialTop = sphere(0.032, '#e6dccb', { roughness: 0.5 })
  finialTop.position.y = 0.51
  bandeira.add(finialTop)
  caranguejo.add(bandeira)

  // ---- mergulhador encharcado ---------------------------------------------
  const mergulhador = person({ body: NAVY, skin: SKIN, height: 1.5, armAngle: 0.42 })
  mergulhador.position.set(DIVER_POS[0], DIVER_POS[1], DIVER_POS[2])
  mergulhador.rotation.y = 1.75 // virado para o caranguejo, de perfil pra câmera

  const head = mergulhador.getObjectByName('head')!

  // capacete: aro de vigia (rosto continua visível) + calota + respiro
  const crown = sphere(0.3, STEEL, { roughness: 0.3, metalness: 0.75 })
  crown.position.y = 0.13
  crown.scale.y = 0.62
  head.add(crown)

  const portRim = torus(0.2, 0.032, STEEL, { roughness: 0.28, metalness: 0.8 })
  portRim.position.set(0, 0.02, 0.24)
  head.add(portRim)

  const collar = cylinder(0.23, 0.27, 0.09, STEEL, { roughness: 0.32, metalness: 0.75 })
  collar.position.y = -0.25
  head.add(collar)

  const valve = capsule(0.045, 0.08, STEEL, { roughness: 0.3, metalness: 0.75 })
  valve.position.set(-0.23, 0.12, -0.1)
  valve.rotation.z = 0.9
  head.add(valve)

  // nadadeiras + cinto de lastro
  for (const side of [-1, 1]) {
    const fin = rbox(0.24, 0.07, 0.46, 0.035, NAVY_DARK, { roughness: 0.6 })
    fin.position.set(side * 0.14, 0.05, 0.2)
    fin.rotation.y = side * 0.16
    mergulhador.add(fin)
  }
  const belt = cylinder(0.27, 0.27, 0.08, NAVY_DARK, { roughness: 0.8 })
  belt.position.y = 0.42
  mergulhador.add(belt)

  // gotas escorrendo: ele saiu do mar agora
  for (const [dx, dy, dz] of [
    [0.2, 0.62, 0.2],
    [-0.22, 0.5, 0.16],
    [0.06, 0.34, 0.26],
  ] as const) {
    const drop = sphere(0.032, SEA, { roughness: 0.15 })
    drop.position.set(dx, dy, dz)
    drop.scale.y = 1.5
    mergulhador.add(drop)
  }
  root.add(mergulhador)

  // ---- trio de bolhas subindo ---------------------------------------------
  const bolhas = new THREE.Group()
  bolhas.position.set(-0.6, 2.05, 0.46)
  for (const [bx, by, bz, br] of [
    [0, 0, 0, 0.075],
    [0.09, 0.22, 0.04, 0.055],
    [-0.05, 0.42, -0.03, 0.04],
  ] as const) {
    const bubble = sphere(br, '#cfeaf0', { roughness: 0.1 })
    bubble.position.set(bx, by, bz)
    bolhas.add(bubble)
  }
  root.add(bolhas)

  // ---- ponto de interrogação dourado flutuando -----------------------------
  const interrogacao = new THREE.Group()
  interrogacao.position.set(-0.3, 2.25, 0.3)
  interrogacao.rotation.y = 0.2

  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.17, 0.16, 0),
    new THREE.Vector3(-0.16, 0.31, 0),
    new THREE.Vector3(-0.03, 0.39, 0),
    new THREE.Vector3(0.11, 0.31, 0),
    new THREE.Vector3(0.1, 0.16, 0),
    new THREE.Vector3(0.0, 0.06, 0),
    new THREE.Vector3(-0.01, -0.08, 0),
  ])
  const hook = new THREE.Mesh(
    new THREE.TubeGeometry(hookCurve, 40, 0.05, 12, false),
    mat(GOLD, { roughness: 0.25, metalness: 0.7 }),
  )
  hook.castShadow = true
  hook.receiveShadow = true
  interrogacao.add(hook)

  const hookCap = sphere(0.05, GOLD, { roughness: 0.25, metalness: 0.7 })
  hookCap.position.set(-0.17, 0.16, 0)
  interrogacao.add(hookCap)

  const dot = sphere(0.07, GOLD, { roughness: 0.25, metalness: 0.7 })
  dot.position.set(-0.01, -0.22, 0)
  interrogacao.add(dot)
  root.add(interrogacao)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'praia', object: base },
    { name: 'pedra', group: 'praia', object: pedra },
    { name: 'mergulhador', group: 'mergulhador', object: mergulhador },
    { name: 'bolhas', group: 'mergulhador', object: bolhas },
    { name: 'caranguejo', group: 'caranguejo', object: caranguejo },
    { name: 'garra', group: 'caranguejo', object: garra },
    { name: 'pinca', group: 'caranguejo', object: pinca },
    { name: 'bandeira', group: 'largada', object: bandeira },
    { name: 'interrogacao', group: 'largada', object: interrogacao },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'A maré recua e brota a praia: areia molhada, espuma na borda.',
    }),
    seq('pedra-rise', 'pedra', 0.2, 0.7, [riseFrom(GY, 1.0)], { ease: 'easeOut' }),

    seq('mergulhador-rise', 'mergulhador', 2.0, 0.8, [riseFrom(GY, 2.1)], {
      ease: 'easeOut',
      caption: 'Você sai do mar encharcado e não faz ideia da hora.',
    }),
    seq(
      'bolhas-sobem',
      'bolhas',
      2.25,
      0.9,
      [
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
        ch('position.y', 1.2, 2.05),
      ],
      { ease: 'easeOut' },
    ),

    seq('caranguejo-rise', 'caranguejo', 3.9, 0.8, [riseFrom(CRAB_POS[1], 1.6)], {
      ease: 'easeOut',
      caption: 'Na pedra só há um caranguejo — nenhum mostrador, nenhum ponteiro.',
    }),
    seq(
      'garra-cresce',
      'garra',
      4.1,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('pinca-abre', 'pinca', 4.4, 0.6, [ch('rotation.z', 0.03, 0.5)], { ease: 'easeOut' }),

    // ---- os estalos: a hora é contada em batidas de garra -------------------
    seq('garra-arma-1', 'garra', 5.9, 0.5, [ch('rotation.z', -0.3, -0.62)], {
      caption: 'Ele responde batendo a garra desproporcional: CLÓ-CAN!',
    }),
    seq('garra-bate-1', 'garra', 6.4, 0.28, [ch('rotation.z', -0.62, -0.14)], { ease: 'easeIn' }),
    seq('pinca-estala-1', 'pinca', 6.5, 0.16, [ch('rotation.z', 0.5, 0.05)], { ease: 'easeIn' }),
    seq('pinca-solta-1', 'pinca', 6.66, 0.24, [ch('rotation.z', 0.05, 0.5)], { ease: 'easeOut' }),
    seq('garra-volta-1', 'garra', 6.7, 0.3, [ch('rotation.z', -0.14, -0.3)], { ease: 'easeOut' }),

    seq('garra-arma-2', 'garra', 7.1, 0.4, [ch('rotation.z', -0.3, -0.62)], {
      caption: 'CLÓ-CAN! CLÓ-CAN! — uma batida por hora, e você conta os estalos.',
    }),
    seq('garra-bate-2', 'garra', 7.5, 0.26, [ch('rotation.z', -0.62, -0.14)], { ease: 'easeIn' }),
    seq('pinca-estala-2', 'pinca', 7.6, 0.16, [ch('rotation.z', 0.5, 0.05)], { ease: 'easeIn' }),
    seq('pinca-solta-2', 'pinca', 7.76, 0.24, [ch('rotation.z', 0.05, 0.5)], { ease: 'easeOut' }),
    seq('garra-volta-2', 'garra', 7.8, 0.3, [ch('rotation.z', -0.14, -0.3)], { ease: 'easeOut' }),

    // ---- a bandeirinha e a pergunta ----------------------------------------
    seq(
      'bandeira-cresce',
      'bandeira',
      8.6,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'E agita a bandeirinha verde gritando VÁ! É…? — seu barco já está saindo.',
      },
    ),
    seq(
      'interrogacao-cresce',
      'interrogacao',
      8.85,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('bandeira-acena-a', 'bandeira', 9.25, 0.35, [ch('rotation.z', 0, 0.38)]),
    seq('bandeira-acena-b', 'bandeira', 9.6, 0.4, [ch('rotation.z', 0.38, -0.26)]),
    seq('bandeira-acena-c', 'bandeira', 10.0, 0.4, [ch('rotation.z', -0.26, 0)], { ease: 'easeOut' }),

    seq('interrogacao-flutua', 'interrogacao', 10.5, 0.8, [ch('position.y', 2.05, 2.25)], {
      ease: 'easeOut',
      caption: 'Vad är klockan? — VÁ É CLÓ-CAN: "Que horas são?"',
    }),
    seq('garra-saluta', 'garra', 10.6, 0.7, [ch('rotation.z', -0.3, -0.48)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 2.55, 5.05], target: [0.3, 1.32, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-ar-klockan',
    contexto: 'Na rua, no trabalho, na fila — pergunta neutra a qualquer pessoa.',
    fraseFonte: 'Que horas são?',
    fraseAlvo: 'Vad är klockan?',
    pronuncia: "va é KLÓ-kan? ('vad' perde o d)",
    ponteSonora:
      "VÁ! É CLÓ-CAN! (4 sílabas, tônica única em CLÓ com Ó BEM ABERTO. Nenhum R na frase inteira, nem brando nem carioca. 'vad' = VÁ com o d mudo; 'är' = É aberto e curto; 'klockan' = CLÓ-CAN, o estalo seco de uma garra fechando)",
    historia:
      'Você sai do mar e não faz ideia da hora: na praia só há um caranguejo empoleirado numa pedra, e ele responde perguntas batendo a garra desproporcional — CLÓ-CAN! CLÓ-CAN! — uma batida por hora. Enquanto você conta os estalos, ele agita a bandeirinha verde e grita VÁ! É…?, porque o seu barco já está saindo.',
  },
  createScene,
  refine: { organic: ['caranguejo', 'garra', 'pinca'] },
}

export default card
