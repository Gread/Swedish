import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, person,
  rbox, capsule, cylinder, sphere, lathe, torus, puff,
} from '../rig/helpers'

/**
 * "Det gör ont här." — consultório de brinquedo.
 * A marmota de jaleco manda DÊ! e gira a manivela enferrujada (iiiÖR) que baixa
 * um DEDO de espuma vermelha sobre o alvo-tambor. O tambor responde ÓNT!, a
 * folhinha de ONTEM descola e voa, e no ponto cutucado brota uma HERA: RRÉR.
 */

const MINT = '#a9d8c6'       // piso verde-menta
const MINT_DARK = '#7fb9a6'
const WHITE = '#f3f1ea'      // aro do piso + jaleco
const CREAM = '#e0d2b4'      // banquinho de exame
const FUR = '#a9763f'        // marmota
const FUR_LIGHT = '#c99a5f'
const RUST = '#b56a2c'       // manivela enferrujada
const STEEL = '#8d949c'      // braço articulado
const BRICK = '#b3554a'      // anéis do alvo (vermelho contido)
const FOAM = '#e0472f'       // ACENTO: o DEDO de espuma
const FOAM_DARK = '#b53521'
const IVY = '#4e8f3c'
const IVY_DARK = '#3c6f2e'
const INK = '#3b332c'

const GY = 0.18              // topo do piso do diorama
const STOOL_H = 0.74         // altura do banquinho
const DRUM_Y = GY + STOOL_H  // base do alvo-tambor = 0.92
const DRUM_TOP = DRUM_Y + 0.34
const POST_X = -0.55
const POST_Z = 0.45
const POST_H = 2.0
const BOOM_Y = GY + POST_H   // pivô do braço articulado = 2.18
const BOOM_LEN = 1.24
const BOOM_YAW = -0.22       // o braço avança para a frente da cena
const BOOM_REST = 0.1        // pose final do braço (levemente erguido)
const BOOM_POKE = -0.12      // ponto do cutucão
const DRUM_X = POST_X + BOOM_LEN * Math.cos(BOOM_YAW)
const DRUM_Z = POST_Z + BOOM_LEN * Math.sin(-BOOM_YAW)
const MARM_X = -1.45
const MARM_Z = 0.45
const FOLHA_Y = 1.12
// folhinha voando (pose final): à direita do dedo, de frente para a câmera
const FLY_X = DRUM_X + 0.85
const FLY_Y = 1.95
const FLY_Z = DRUM_Z + 0.75

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: piso verde-menta com aro branco ---------------------
  const base = new THREE.Group()

  const rim = cylinder(2.66, 2.72, 0.16, WHITE, { roughness: 0.45 })
  rim.position.y = 0.08
  base.add(rim)

  const floorDisc = cylinder(2.46, 2.5, 0.07, MINT, { roughness: 0.4 })
  floorDisc.position.y = 0.145
  base.add(floorDisc)

  const stripe = torus(1.86, 0.022, WHITE, { roughness: 0.4 })
  stripe.rotation.x = Math.PI / 2
  stripe.position.y = GY - 0.004
  base.add(stripe)

  // vaso com samambaia
  const pot = lathe(
    [[0, 0], [0.2, 0], [0.22, 0.05], [0.185, 0.26], [0.235, 0.32], [0.21, 0.36], [0, 0.36]],
    CREAM,
    { roughness: 0.5 },
  )
  pot.position.set(-1.95, GY, 1.25)
  pot.rotation.y = rand() * Math.PI
  base.add(pot)

  const fern = puff(0.24, IVY, 6, 41, { roughness: 0.88 })
  fern.position.set(-1.95, GY + 0.5, 1.25)
  base.add(fern)

  // lixeira de pedal
  const lixeira = new THREE.Group()
  lixeira.position.set(1.65, GY, -0.45)
  lixeira.rotation.y = rand() * Math.PI
  const canBody = cylinder(0.24, 0.21, 0.44, MINT_DARK, { roughness: 0.4 })
  canBody.position.y = 0.22
  const canLid = lathe(
    [[0, 0], [0.24, 0.01], [0.25, 0.05], [0.14, 0.09], [0, 0.1]],
    WHITE,
    { roughness: 0.35 },
  )
  canLid.position.y = 0.45
  const pedal = rbox(0.16, 0.05, 0.1, 0.02, STEEL, { roughness: 0.35, metalness: 0.6 })
  pedal.position.set(0, 0.04, 0.26)
  lixeira.add(canBody, canLid, pedal)
  base.add(lixeira)

  // rolo de gaze caído no chão
  const gaze = cylinder(0.11, 0.11, 0.13, WHITE, { roughness: 0.9 })
  gaze.position.set(-0.15, GY + 0.11, 1.35)
  gaze.rotation.set(Math.PI / 2, 0, rand() * Math.PI)
  base.add(gaze)

  // tira de esparadrapo solta ao lado da gaze
  const tape = rbox(0.34, 0.012, 0.07, 0.005, '#efe6d2', { roughness: 0.85 })
  tape.position.set(0.22, GY + 0.007, 1.42)
  tape.rotation.y = 0.5
  base.add(tape)

  root.add(base)

  // ---- banquinho de exame ---------------------------------------------------
  const pedestal = new THREE.Group()
  pedestal.position.set(DRUM_X, GY, DRUM_Z)

  const stool = lathe(
    [
      [0, 0], [0.4, 0], [0.42, 0.06], [0.15, 0.11], [0.12, 0.44],
      [0.3, 0.52], [0.44, 0.6], [0.46, 0.68], [0.34, 0.74], [0, 0.74],
    ],
    CREAM,
    { roughness: 0.55 },
  )
  pedestal.add(stool)

  const ring = torus(0.26, 0.028, STEEL, { roughness: 0.3, metalness: 0.7 })
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.2
  pedestal.add(ring)
  root.add(pedestal)

  // ---- alvo-tambor de anéis -------------------------------------------------
  const alvo = new THREE.Group()
  alvo.position.set(DRUM_X, DRUM_Y, DRUM_Z)

  const shell = cylinder(0.42, 0.44, 0.3, WHITE, { roughness: 0.5 })
  shell.position.y = 0.15
  alvo.add(shell)

  for (const hy of [0.05, 0.25]) {
    const hoop = torus(0.435, 0.022, RUST, { roughness: 0.45, metalness: 0.55 })
    hoop.rotation.x = Math.PI / 2
    hoop.position.y = hy
    alvo.add(hoop)
  }

  const head = cylinder(0.43, 0.43, 0.02, WHITE, { roughness: 0.35 })
  head.position.y = 0.31
  alvo.add(head)

  const ringRadii: [number, string][] = [
    [0.36, BRICK], [0.28, WHITE], [0.2, BRICK], [0.12, WHITE], [0.055, BRICK],
  ]
  ringRadii.forEach(([r, color], i) => {
    const disc = cylinder(r, r, 0.012, color, { roughness: 0.35 })
    disc.position.y = 0.322 + i * 0.004
    alvo.add(disc)
  })
  root.add(alvo)

  // ---- folhinha de ONTEM (pose construída = já voando) ----------------------
  const folhinha = new THREE.Group()
  folhinha.position.set(FLY_X, FLY_Y, FLY_Z)
  folhinha.rotation.set(-0.3, 0.4, 0.5)

  const sheet = rbox(0.3, 0.36, 0.018, 0.015, '#f6f0e0', { roughness: 0.75 })
  folhinha.add(sheet)
  const banner = rbox(0.3, 0.09, 0.022, 0.012, BRICK, { roughness: 0.55 })
  banner.position.y = 0.135
  folhinha.add(banner)
  const dateBar = rbox(0.17, 0.11, 0.024, 0.01, INK, { roughness: 0.6 })
  dateBar.position.y = -0.02
  folhinha.add(dateBar)
  const weekBar = rbox(0.2, 0.03, 0.024, 0.008, '#9a9186', { roughness: 0.6 })
  weekBar.position.y = -0.13
  folhinha.add(weekBar)
  for (const hx of [-0.08, 0.08]) {
    const hole = cylinder(0.017, 0.017, 0.03, INK, { roughness: 0.6 })
    hole.rotation.x = Math.PI / 2
    hole.position.set(hx, 0.165, 0)
    folhinha.add(hole)
  }
  root.add(folhinha)

  // ---- marmota gorducha de jaleco ------------------------------------------
  const marmota = person({ body: WHITE, skin: FUR, height: 1.45, armAngle: 0.5 })
  marmota.position.set(MARM_X, GY, MARM_Z)
  marmota.rotation.y = Math.PI / 2

  const torso = marmota.getObjectByName('body') as THREE.Mesh
  torso.scale.set(1.22, 1, 1.2)

  // barriga cor de pelo aparecendo sob o jaleco aberto
  const belly = capsule(0.17, 0.2, FUR_LIGHT, { roughness: 0.85 })
  belly.position.set(0, 0.34, 0.26)
  belly.scale.z = 0.5
  marmota.add(belly)

  // lapelas do jaleco
  for (const side of [-1, 1]) {
    const lapel = rbox(0.09, 0.3, 0.05, 0.02, '#e6e2d6', { roughness: 0.85 })
    lapel.position.set(side * 0.14, 0.53, 0.25)
    lapel.rotation.z = side * 0.24
    marmota.add(lapel)
  }

  // estetoscópio no pescoço
  const stetho = torus(0.16, 0.024, '#39434f', { roughness: 0.4 })
  stetho.rotation.x = 1.2
  stetho.position.set(0, 0.76, 0.06)
  stetho.scale.z = 0.7
  marmota.add(stetho)
  const bell = cylinder(0.055, 0.06, 0.03, STEEL, { roughness: 0.25, metalness: 0.8 })
  bell.rotation.x = 0.4
  bell.position.set(0.1, 0.6, 0.24)
  marmota.add(bell)

  // cabeça: focinho, dentões, orelhas pequenas e baixas
  const cabeca = marmota.getObjectByName('head') as THREE.Group
  const muzzle = sphere(0.13, FUR_LIGHT, { roughness: 0.8 })
  muzzle.position.set(0, -0.1, 0.22)
  muzzle.scale.set(1.15, 0.8, 0.95)
  cabeca.add(muzzle)

  const nose = sphere(0.042, '#3b2a22', { roughness: 0.3 })
  nose.position.set(0, -0.055, 0.32)
  cabeca.add(nose)

  for (const side of [-1, 1]) {
    const tooth = rbox(0.05, 0.08, 0.022, 0.008, '#f7f2e2', { roughness: 0.3 })
    tooth.position.set(side * 0.032, -0.185, 0.285)
    cabeca.add(tooth)

    const ear = sphere(0.075, FUR, { roughness: 0.8 })
    ear.position.set(side * 0.215, 0.13, -0.03)
    ear.scale.set(0.9, 1, 0.45)
    const inner = sphere(0.042, FUR_LIGHT, { roughness: 0.85 })
    inner.position.set(side * 0.02, 0, 0.04)
    ear.add(inner)
    cabeca.add(ear)
  }

  // patas para a frente, prontas para girar a roda
  for (const side of [-1, 1]) {
    const arm = marmota.getObjectByName(side < 0 ? 'armL' : 'armR') as THREE.Mesh
    arm.position.set(side * 0.345, 0.63, 0.14)
    arm.rotation.set(-1.95, 0, -side * 0.18)
  }
  root.add(marmota)

  // patas no mundo: a roda nasce exatamente onde elas param
  marmota.updateMatrixWorld(true)
  const pawL = new THREE.Vector3()
  const pawR = new THREE.Vector3()
  ;(marmota.getObjectByName('armL') as THREE.Mesh).children[0].getWorldPosition(pawL)
  ;(marmota.getObjectByName('armR') as THREE.Mesh).children[0].getWorldPosition(pawR)
  const wheelPos = pawL.clone().add(pawR).multiplyScalar(0.5)
  const rimR = pawL.distanceTo(pawR) / 2

  // ---- poste da máquina -----------------------------------------------------
  const poste = new THREE.Group()
  poste.position.set(POST_X, GY, POST_Z)

  const footPad = cylinder(0.3, 0.34, 0.07, STEEL, { roughness: 0.35, metalness: 0.65 })
  footPad.position.y = 0.035
  poste.add(footPad)

  const column = cylinder(0.09, 0.11, POST_H, STEEL, { roughness: 0.3, metalness: 0.7 })
  column.position.y = POST_H / 2
  poste.add(column)

  const bearing = rbox(0.24, 0.22, 0.24, 0.05, RUST, { roughness: 0.45, metalness: 0.55 })
  bearing.position.y = wheelPos.y - GY
  poste.add(bearing)

  const collar = sphere(0.14, STEEL, { roughness: 0.3, metalness: 0.7 })
  collar.position.y = POST_H
  poste.add(collar)
  root.add(poste)

  // ---- manivela enferrujada (roda + cabo) -----------------------------------
  const SPIN = -Math.PI * 4
  const manivela = new THREE.Group()
  manivela.position.copy(wheelPos)
  manivela.rotation.y = Math.PI / 2 // eixo local +z aponta para o poste
  manivela.rotation.z = SPIN        // pose final: duas voltas dadas

  const shaftLen = Math.abs(POST_X - wheelPos.x)
  const shaft = cylinder(0.05, 0.05, shaftLen, STEEL, { roughness: 0.3, metalness: 0.7 })
  shaft.rotation.x = Math.PI / 2
  shaft.position.z = shaftLen / 2
  manivela.add(shaft)

  const wheelRim = torus(rimR, 0.05, RUST, { roughness: 0.55, metalness: 0.55 })
  manivela.add(wheelRim)

  const hub = cylinder(0.075, 0.075, 0.12, RUST, { roughness: 0.55, metalness: 0.55 })
  hub.rotation.x = Math.PI / 2
  manivela.add(hub)

  for (let i = 0; i < 3; i++) {
    const spoke = rbox(0.05, rimR * 2 - 0.03, 0.05, 0.018, RUST, { roughness: 0.6, metalness: 0.5 })
    spoke.rotation.z = (i * Math.PI) / 3
    manivela.add(spoke)
  }

  // cabo: pega saliente na borda da roda
  const gripStem = cylinder(0.032, 0.032, 0.14, STEEL, { roughness: 0.3, metalness: 0.7 })
  gripStem.rotation.x = Math.PI / 2
  gripStem.position.set(rimR * 0.72, rimR * 0.72, -0.09)
  manivela.add(gripStem)
  const gripKnob = capsule(0.05, 0.09, INK, { roughness: 0.5 })
  gripKnob.rotation.x = Math.PI / 2
  gripKnob.position.set(rimR * 0.72, rimR * 0.72, -0.19)
  manivela.add(gripKnob)
  root.add(manivela)

  // ---- braço articulado (dobradiça no topo do poste) ------------------------
  const braco = new THREE.Group()
  braco.position.set(POST_X, BOOM_Y, POST_Z)
  braco.rotation.y = BOOM_YAW
  braco.rotation.z = BOOM_REST

  const shoulder = sphere(0.13, STEEL, { roughness: 0.3, metalness: 0.75 })
  braco.add(shoulder)

  const seg1 = rbox(0.62, 0.13, 0.14, 0.05, STEEL, { roughness: 0.3, metalness: 0.7 })
  seg1.position.x = 0.34
  braco.add(seg1)

  const elbow = sphere(0.14, RUST, { roughness: 0.45, metalness: 0.55 })
  elbow.position.x = 0.68
  braco.add(elbow)

  const seg2 = rbox(0.56, 0.11, 0.12, 0.045, STEEL, { roughness: 0.3, metalness: 0.7 })
  seg2.position.set(0.98, -0.02, 0)
  braco.add(seg2)

  const wristCollar = cylinder(0.11, 0.13, 0.1, RUST, { roughness: 0.45, metalness: 0.55 })
  wristCollar.position.set(BOOM_LEN, -0.05, 0)
  braco.add(wristCollar)
  root.add(braco)

  // ---- DEDO de espuma (acento) — telescopa do punho do braço ----------------
  const dedo = new THREE.Group()
  dedo.position.set(BOOM_LEN, -0.08, 0)
  dedo.rotation.z = 0.14
  braco.add(dedo)

  const cuff = cylinder(0.14, 0.16, 0.12, FOAM_DARK, { roughness: 0.92 })
  cuff.position.y = -0.06
  dedo.add(cuff)

  const cuffBand = torus(0.15, 0.022, WHITE, { roughness: 0.9 })
  cuffBand.rotation.x = Math.PI / 2
  cuffBand.position.y = -0.11
  dedo.add(cuffBand)

  const mitt = rbox(0.34, 0.34, 0.2, 0.09, FOAM, { roughness: 0.92 })
  mitt.position.y = -0.28
  dedo.add(mitt)

  // três dedos dobrados (nós) na base da mão de espuma
  for (const kx of [-0.115, -0.04, 0.035]) {
    const knuckle = capsule(0.055, 0.08, FOAM, { roughness: 0.92 })
    knuckle.rotation.x = Math.PI / 2
    knuckle.position.set(kx, -0.46, 0.035)
    dedo.add(knuckle)
  }
  // costura branca no punho da mão
  const seam = rbox(0.3, 0.02, 0.205, 0.008, '#f6d9cf', { roughness: 0.9 })
  seam.position.y = -0.14
  dedo.add(seam)

  const thumb = capsule(0.06, 0.12, FOAM, { roughness: 0.92 })
  thumb.position.set(-0.2, -0.3, 0.02)
  thumb.rotation.z = 0.75
  dedo.add(thumb)

  // o indicador apontado
  const FINGER_X = 0.11
  const finger = capsule(0.07, 0.26, FOAM, { roughness: 0.92 })
  finger.position.set(FINGER_X, -0.6, 0)
  dedo.add(finger)

  const nail = rbox(0.08, 0.1, 0.03, 0.012, '#f27a62', { roughness: 0.6 })
  nail.position.set(FINGER_X, -0.73, 0.06)
  dedo.add(nail)

  const tip = new THREE.Object3D()
  tip.position.set(FINGER_X, -0.81, 0)
  dedo.add(tip)

  // ---- HERA brotando no ponto do cutucão ------------------------------------
  // ponto do cutucão: ponta do indicador com o braço na pose de cutucar
  braco.rotation.z = BOOM_POKE
  braco.updateMatrixWorld(true)
  const tipWorld = new THREE.Vector3()
  tip.getWorldPosition(tipWorld)
  braco.rotation.z = BOOM_REST
  braco.updateMatrixWorld(true)
  const pokeX = tipWorld.x
  const pokeZ = tipWorld.z

  const hera = new THREE.Group()
  hera.position.set(pokeX, DRUM_TOP, pokeZ)

  const vine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.06, 0.15, 0.05),
    new THREE.Vector3(-0.05, 0.3, 0.02),
    new THREE.Vector3(0.08, 0.44, -0.05),
    new THREE.Vector3(0.02, 0.58, 0.01),
  ])
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(vine, 40, 0.026, 10, false),
    mat(IVY_DARK, { roughness: 0.85 }),
  )
  stem.castShadow = true
  stem.receiveShadow = true
  hera.add(stem)

  const leafSpots: [number, number, number, number][] = [
    [0.16, 0.12, 0.09, 0.5],
    [-0.16, 0.25, 0.02, -0.7],
    [0.17, 0.36, -0.09, 0.9],
    [-0.12, 0.48, 0.05, -0.4],
    [0.09, 0.6, 0.02, 0.2],
  ]
  for (const [lx, ly, lz, rot] of leafSpots) {
    const leaf = sphere(0.095, IVY, { roughness: 0.8 })
    leaf.position.set(lx, ly, lz)
    leaf.scale.set(1.15, 0.22, 1)
    leaf.rotation.set(0.25, rot, rot * 0.5)
    hera.add(leaf)
  }
  root.add(hera)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'consultorio', object: base },
    { name: 'marmota', group: 'marmota', object: marmota },
    { name: 'pedestal', group: 'alvo', object: pedestal },
    { name: 'alvo', group: 'alvo', object: alvo },
    { name: 'folhinha', group: 'alvo', object: folhinha },
    { name: 'poste', group: 'maquina', object: poste },
    { name: 'manivela', group: 'maquina', object: manivela },
    { name: 'braco', group: 'braco', object: braco },
    { name: 'dedo', group: 'braco', object: dedo },
    { name: 'hera', group: 'hera', object: hera },
  ]

  // ---- montagem -------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.85)], {
      ease: 'easeOut',
      caption: 'No consultório de brinquedo, o piso verde-menta brota do chão…',
    }),

    seq('marmota-rise', 'marmota', 1.9, 0.8, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: '…e sobe a marmota gorducha de jaleco, que já manda: DÊ!',
    }),

    seq('pedestal-rise', 'pedestal', 3.9, 0.7, [riseFrom(GY, 1.2)], {
      ease: 'easeOut',
      caption: 'Na banqueta de exame ela planta o alvo-tambor de anéis vermelhos.',
    }),
    seq('alvo-rise', 'alvo', 4.1, 0.7, [riseFrom(DRUM_Y, 1.5)], { ease: 'easeOut' }),
    seq(
      'folhinha-rise',
      'folhinha',
      4.3,
      0.6,
      [
        ch('position.x', DRUM_X, DRUM_X),
        ch('position.y', FOLHA_Y - 1.6, FOLHA_Y),
        ch('position.z', DRUM_Z + 0.46, DRUM_Z + 0.46),
        ch('rotation.x', -0.22, -0.22),
        ch('rotation.y', 0, 0),
        ch('rotation.z', 0, 0),
      ],
      { ease: 'easeOut' },
    ),

    seq('poste-rise', 'poste', 5.9, 0.8, [riseFrom(GY, 2.5)], { ease: 'easeOut' }),
    seq(
      'manivela-grow',
      'manivela',
      6.1,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('manivela-spin-a', 'manivela', 7.2, 0.9, [ch('rotation.z', 0, SPIN / 2)], {
      caption: 'Ela gira a manivela enferrujada com as duas patas — iiiÖR, iiiÖR…',
    }),
    seq('braco-unfold', 'braco', 7.4, 0.8, [ch('rotation.z', -1.45, BOOM_REST)]),
    seq(
      'dedo-grow',
      'dedo',
      8.4,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('manivela-spin-b', 'manivela', 9.6, 0.8, [ch('rotation.z', SPIN / 2, SPIN)]),

    seq('braco-poke', 'braco', 10.6, 0.5, [ch('rotation.z', BOOM_REST, BOOM_POKE)], {
      ease: 'easeIn',
      caption: 'O DEDO de espuma cutuca e o tambor responde ÓNT! — a folhinha de ONTEM descola e voa.',
    }),
    seq('marmota-bob-up', 'marmota', 10.7, 0.3, [ch('position.y', GY, GY + 0.07)], { ease: 'easeOut' }),
    seq('alvo-thump', 'alvo', 11.05, 0.28, [ch('position.y', DRUM_Y, DRUM_Y - 0.07)], { ease: 'easeIn' }),
    seq('marmota-bob-down', 'marmota', 11.05, 0.35, [ch('position.y', GY + 0.07, GY)], { ease: 'easeIn' }),
    seq(
      'folhinha-fly',
      'folhinha',
      11.15,
      1.0,
      [
        ch('position.x', DRUM_X, FLY_X),
        ch('position.y', FOLHA_Y, FLY_Y),
        ch('position.z', DRUM_Z + 0.46, FLY_Z),
        ch('rotation.x', -0.22, -0.3),
        ch('rotation.y', 0, 0.4),
        ch('rotation.z', 0, 0.5),
      ],
      { ease: 'easeOut' },
    ),
    seq('braco-back', 'braco', 11.3, 0.6, [ch('rotation.z', BOOM_POKE, BOOM_REST)], { ease: 'easeOut' }),
    seq('alvo-settle', 'alvo', 11.4, 0.45, [ch('position.y', DRUM_Y - 0.07, DRUM_Y)], { ease: 'easeOut' }),

    seq(
      'hera-grow',
      'hera',
      12.4,
      1.0,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'No ponto cutucado brota uma HERA e o H dela sopra RRÉR: Det gör ont här.',
      },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.45, 2.75, 4.7], target: [-0.1, 1.25, 0.35] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-gor-ont-har',
    contexto: 'Dentro da sala, apontando com o dedo enquanto o médico apalpa. Também no dentista.',
    fraseFonte: 'Dói aqui.',
    fraseAlvo: 'Det gör ont här.',
    pronuncia: "de iör ONT HÉR ('gör' começa com som de I: IÖR; 'här' com ä aberto)",
    ponteSonora:
      "DÊ! IÖR! ÓNT! RRÉR! (4 sílabas, tônicas em ÓNT e RRÉR; IÖR = 'gör' com G virando I de ioga, boca de Ô + língua de Ê e R BRANDO — se o I virar RR vira 'hör' (ouve), se virar K vira 'kör' (dirige); ÓNT com Ó ABERTO e N na língua, sem nasal; RRÉR = HERA sem o -a, mas o H NÃO é mudo: sopra como RR carioca, e o É é bem aberto; se fechar o É em Ô vira 'hår' (cabelo))",
    historia:
      'No consultório, a marmota de jaleco manda DÊ! e gira com as duas patas a manivela enferrujada — iiiÖR, iiiÖR — que baixa um DEDO de espuma vermelha do tamanho de um braço. O dedo cutuca o alvo-tambor e ele responde ÓNT!, tão fundo que descola a folhinha de ONTEM e ela sai voando. No ponto exato do cutucão brota na hora uma HERA verdinha — e o H dela sopra: RRÉR.',
  },
  createScene,
}

export default card
