import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Kan du prata lite långsammare?" — a garçonete SÂMARA, tartaruga de pescoço
 * LONGUÍSSIMO, serve UMA sílaba por vez num pratinho dourado, sob a cúpula de
 * PRATA, com o broche "LITE" no peito.
 *
 * Diorama: salão do restaurante mais chique de Estocolmo — tapete bordô, mesa
 * redonda com toalha, lustre de velas acima; a tartaruga à esquerda estica o
 * pescoço por cima da mesa e ergue a cúpula revelando a sílaba solitária.
 */

const CARPET = '#7a2f36'
const CARPET_LIGHT = '#96434a'
const WOOD = '#5f4028'
const WOOD_LIGHT = '#8a6a42'
const SHELL = '#2f5d3f'
const SCUTE = '#3f7a4e'
const LIMB = '#7aa85f'
const CREAM = '#f0e9dc'
const SILVER = '#c9ced6'
const BRASS = '#c8922e'
const GOLD = '#f0b429' // acento reservado: o PRATINHO dourado
const INK = '#2b2823'
const BLUE = '#2f5f9e'

const GY = 0.18 // topo do tapete
const TOP = 1.11 // topo da mesa posta (mundo)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: salão -------------------------------------------
  const base = new THREE.Group()

  const floor = cylinder(2.55, 2.68, 0.14, '#4a3b30', { roughness: 0.9 })
  floor.position.y = 0.07
  base.add(floor)

  const carpet = cylinder(2.42, 2.5, 0.05, CARPET, { roughness: 0.95 })
  carpet.position.y = 0.16
  base.add(carpet)

  const medallion = cylinder(1.15, 1.15, 0.014, CARPET_LIGHT, { roughness: 0.95 })
  medallion.position.set(0.35, 0.19, 0.05)
  base.add(medallion)

  // palmeira de canto
  const palm = new THREE.Group()
  palm.position.set(-1.95, GY, -0.95)
  const vase = lathe(
    [[0.17, 0], [0.21, 0.05], [0.22, 0.2], [0.17, 0.3], [0.19, 0.34]],
    '#6f5a46',
    { roughness: 0.65 },
  )
  const trunk = cylinder(0.045, 0.06, 0.3, '#5b4a35', { roughness: 0.8 })
  trunk.position.y = 0.44
  const fronds = puff(0.24, '#3d6f43', 6, 31, { roughness: 0.85 })
  fronds.position.y = 0.62
  fronds.rotation.y = rand() * Math.PI
  palm.add(vase, trunk, fronds)
  base.add(palm)

  // vasinho do outro lado
  const potB = new THREE.Group()
  potB.position.set(1.95, GY, -0.8)
  const vaseB = lathe(
    [[0.12, 0], [0.15, 0.04], [0.14, 0.18], [0.12, 0.22]],
    '#7a6450',
    { roughness: 0.65 },
  )
  const leavesB = puff(0.16, '#46804a', 5, 32, { roughness: 0.85 })
  leavesB.position.y = 0.34
  leavesB.rotation.y = rand() * Math.PI
  potB.add(vaseB, leavesB)
  base.add(potB)

  // cadeira do salão
  const chair = new THREE.Group()
  chair.position.set(1.72, GY, 0.95)
  chair.rotation.y = -0.65 + (rand() - 0.5) * 0.2
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = cylinder(0.026, 0.03, 0.44, WOOD, { roughness: 0.75 })
      leg.position.set(sx * 0.17, 0.22, sz * 0.17)
      chair.add(leg)
    }
  }
  const seat = rbox(0.45, 0.06, 0.45, 0.02, WOOD_LIGHT, { roughness: 0.75 })
  seat.position.y = 0.47
  chair.add(seat)
  const cushion = rbox(0.38, 0.05, 0.38, 0.02, CARPET_LIGHT, { roughness: 0.92 })
  cushion.position.y = 0.52
  chair.add(cushion)
  for (const sx of [-1, 1]) {
    const post = cylinder(0.026, 0.026, 0.46, WOOD, { roughness: 0.75 })
    post.position.set(sx * 0.18, 0.73, -0.19)
    chair.add(post)
  }
  const rail = rbox(0.42, 0.08, 0.06, 0.025, WOOD_LIGHT, { roughness: 0.75 })
  rail.position.set(0, 0.93, -0.19)
  chair.add(rail)
  base.add(chair)

  root.add(base)

  // ---- mesa posta --------------------------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(0.55, GY, 0)

  const foot = lathe(
    [[0.36, 0], [0.34, 0.04], [0.16, 0.1], [0.11, 0.15]],
    WOOD,
    { roughness: 0.7 },
  )
  mesa.add(foot)

  const column = cylinder(0.1, 0.12, 0.76, WOOD, { roughness: 0.7 })
  column.position.y = 0.52
  mesa.add(column)

  const slab = cylinder(0.8, 0.8, 0.05, WOOD_LIGHT, { roughness: 0.7 })
  slab.position.y = 0.885
  mesa.add(slab)

  const cloth = lathe(
    [
      [0.88, 0.14], [0.865, 0.34], [0.845, 0.62], [0.855, 0.84],
      [0.82, 0.905], [0.55, 0.928], [0, 0.932],
    ],
    CREAM,
    { roughness: 0.84 }, // sem sheen: o reflexo do ambiente virava um risco vertical na borda
  )
  mesa.add(cloth)

  const napkin = rbox(0.2, 0.055, 0.13, 0.02, CREAM, { roughness: 0.92 })
  napkin.position.set(0.3, 0.955, 0.32)
  napkin.rotation.y = 0.42
  mesa.add(napkin)

  const knife = rbox(0.024, 0.014, 0.22, 0.006, SILVER, { roughness: 0.2, metalness: 0.85 })
  knife.position.set(-0.3, 0.94, 0.42)
  knife.rotation.y = 1.25 // deitada de lado: lê faca, não palito
  mesa.add(knife)

  const glass = new THREE.Group()
  glass.position.set(-0.02, 0.932, 0.38)
  const glassFoot = lathe(
    [[0, 0], [0.1, 0.008], [0.095, 0.022], [0.02, 0.03]],
    '#dbe6ea',
    { roughness: 0.12 },
  )
  const glassStem = cylinder(0.018, 0.018, 0.14, '#dbe6ea', { roughness: 0.12 })
  glassStem.position.y = 0.1
  const glassBowl = lathe(
    [[0.02, 0], [0.07, 0.05], [0.105, 0.14], [0.108, 0.22]],
    '#dbe6ea',
    { roughness: 0.12 },
  )
  glassBowl.position.y = 0.17
  const wine = lathe(
    [[0, 0], [0.06, 0.035], [0.078, 0.07]],
    '#7d2334',
    { roughness: 0.2 },
  )
  wine.position.y = 0.2
  glass.add(glassFoot, glassStem, glassBowl, wine)
  mesa.add(glass)

  root.add(mesa)

  // ---- lustre (desce do teto, fora de quadro) ----------------------------
  const lustre = new THREE.Group()
  lustre.position.set(0.55, 2.95, 0)

  const rosette = lathe(
    [[0.16, 0], [0.14, 0.03], [0.05, 0.06], [0.03, 0.07]],
    BRASS,
    { roughness: 0.3, metalness: 0.7 },
  )
  rosette.rotation.x = Math.PI
  lustre.add(rosette)

  const chain = cylinder(0.026, 0.026, 0.62, '#6b5326', { roughness: 0.4, metalness: 0.6 })
  chain.position.y = -0.34
  lustre.add(chain)

  const fixture = new THREE.Group()
  fixture.position.y = -0.7
  lustre.add(fixture)

  const stem = lathe(
    [[0.03, -0.06], [0.11, 0.02], [0.13, 0.1], [0.07, 0.2], [0.03, 0.26]],
    BRASS,
    { roughness: 0.3, metalness: 0.7 },
  )
  fixture.add(stem)

  const ring = torus(0.34, 0.035, BRASS, { roughness: 0.3, metalness: 0.7 })
  ring.rotation.x = Math.PI / 2
  fixture.add(ring)

  const finial = sphere(0.075, BRASS, { roughness: 0.3, metalness: 0.7 })
  finial.position.y = -0.14
  fixture.add(finial)

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const cx = Math.cos(a) * 0.34
    const cz = Math.sin(a) * 0.34

    const arm = cylinder(0.022, 0.022, 0.3, BRASS, { roughness: 0.3, metalness: 0.7 })
    arm.position.set(cx * 0.5, 0.02, cz * 0.5)
    arm.rotation.z = Math.PI / 2
    arm.rotation.y = -a
    fixture.add(arm)

    const candle = cylinder(0.032, 0.036, 0.17, CREAM, { roughness: 0.85 })
    candle.position.set(cx, 0.115, cz)
    fixture.add(candle)

    const flame = cone(0.035, 0.12, '#ffd88a', {
      emissive: '#ff9a3c',
      emissiveIntensity: 1.3,
    })
    flame.position.set(cx, 0.26, cz)
    fixture.add(flame)

    const drop = cone(0.045, 0.14, '#dde7ee', { roughness: 0.12 })
    drop.position.set(cx * 0.82, -0.11, cz * 0.82)
    drop.rotation.x = Math.PI
    fixture.add(drop)
  }
  root.add(lustre)

  // ---- SÂMARA: casco, patas, gola de garçonete ---------------------------
  const corpo = new THREE.Group()
  corpo.position.set(-1.15, GY, 0.35)
  corpo.rotation.y = 1.812 // olha para o pratinho (+z local aponta para a mesa)

  const plastron = cylinder(0.6, 0.56, 0.11, '#c9b072', { roughness: 0.8 })
  plastron.position.y = 0.075
  corpo.add(plastron)

  const shell = lathe(
    [
      [0.62, 0.06], [0.605, 0.16], [0.53, 0.3], [0.4, 0.44],
      [0.22, 0.52], [0, 0.55],
    ],
    SHELL,
    { roughness: 0.75 },
  )
  corpo.add(shell)

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3
    const scute = sphere(0.135, SCUTE, { roughness: 0.7 })
    scute.position.set(Math.cos(a) * 0.4, 0.34 + rand() * 0.02, Math.sin(a) * 0.4)
    scute.scale.set(1, 0.34, 1)
    corpo.add(scute)
  }
  const crown = sphere(0.16, SCUTE, { roughness: 0.7 })
  crown.position.y = 0.53
  crown.scale.set(1, 0.3, 1)
  corpo.add(crown)

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = capsule(0.1, 0.1, LIMB, { roughness: 0.8 })
      leg.position.set(sx * 0.4, 0.15, sz * 0.34)
      corpo.add(leg)
      const toe = sphere(0.095, LIMB, { roughness: 0.8 })
      toe.position.set(sx * 0.4, 0.06, sz * 0.42)
      corpo.add(toe)
    }
  }

  const tail = cone(0.09, 0.28, LIMB, { roughness: 0.8 })
  tail.position.set(0, 0.24, -0.6)
  tail.rotation.x = -1.95
  corpo.add(tail)

  // gola + gravata-borboleta de garçonete, na saída do pescoço
  const collar = torus(0.175, 0.038, CREAM, { roughness: 0.9 })
  collar.rotation.x = Math.PI / 2 - 0.12
  collar.position.set(0, 0.4, 0.4)
  corpo.add(collar)

  for (const side of [-1, 1]) {
    const wing = cone(0.062, 0.14, INK, { roughness: 0.6 })
    wing.position.set(side * 0.085, 0.47, 0.44)
    wing.rotation.z = side * Math.PI / 2
    corpo.add(wing)
  }
  const knot = sphere(0.038, INK, { roughness: 0.6 })
  knot.position.set(0, 0.47, 0.45)
  corpo.add(knot)

  root.add(corpo)

  // ---- broche redondo "LITE" no peito ------------------------------------
  // Na frente-lateral do casco, do lado da câmera (a frente da tartaruga
  // aponta para a mesa), inclinado com a curva do casco.
  const BROCHE_A = 2.6 // ângulo no plano xz local do casco
  const broche = new THREE.Group()
  broche.position.set(Math.cos(BROCHE_A) * 0.47, 0.45, Math.sin(BROCHE_A) * 0.47)
  broche.rotation.order = 'YXZ'
  broche.rotation.y = Math.atan2(Math.cos(BROCHE_A), Math.sin(BROCHE_A))
  broche.rotation.x = -0.55

  const brocheDisc = cylinder(0.155, 0.155, 0.03, '#efe3cd', { roughness: 0.35 })
  brocheDisc.rotation.x = Math.PI / 2
  broche.add(brocheDisc)

  const brocheRim = torus(0.158, 0.026, BRASS, { roughness: 0.25, metalness: 0.85 })
  broche.add(brocheRim)

  // letras L-I-T-E em traços: [cx, cy, w, h]
  const H = 0.085
  const T = 0.02
  const strokes: [number, number, number, number][] = [
    // L
    [-0.105 + T / 2, 0, T, H],
    [-0.105 + 0.023, -H / 2 + T / 2, 0.046, T],
    // I
    [-0.04, 0, T, H],
    // T
    [0.017, H / 2 - T / 2, 0.054, T],
    [0.017, 0, T, H],
    // E
    [0.06 + T / 2, 0, T, H],
    [0.06 + 0.022, H / 2 - T / 2, 0.044, T],
    [0.06 + 0.019, 0, 0.038, T],
    [0.06 + 0.022, -H / 2 + T / 2, 0.044, T],
  ]
  for (const [cx, cy, w, h] of strokes) {
    const stroke = rbox(w, h, 0.014, 0.005, INK, { roughness: 0.5 })
    stroke.position.set(cx - 0.004, cy, 0.022)
    broche.add(stroke)
  }
  corpo.add(broche)

  // ---- pescoço LONGUÍSSIMO, arco de cápsulas -----------------------------
  const pescoco = new THREE.Group()
  pescoco.position.set(0, 0.36, 0.38)

  const spine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.58, 0.04),
    new THREE.Vector3(0, 1.06, 0.22),
    new THREE.Vector3(0, 1.22, 0.56),
    new THREE.Vector3(0, 0.9, 0.8),
  ])
  const SEGMENTS = 16
  const spinePts = spine.getPoints(SEGMENTS)
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < SEGMENTS; i++) {
    const a = spinePts[i]
    const b = spinePts[i + 1]
    const dir = new THREE.Vector3().subVectors(b, a)
    const len = dir.length()
    const t = i / (SEGMENTS - 1)
    const r = 0.155 - 0.06 * t
    const link = capsule(r, len, LIMB, { roughness: 0.8 })
    link.position.copy(a).addScaledVector(dir, 0.5)
    link.quaternion.setFromUnitVectors(up, dir.clone().normalize())
    pescoco.add(link)

    if (i % 3 === 1) {
      const wrinkle = torus(r * 1.02, r * 0.16, '#6c9852', { roughness: 0.85 })
      wrinkle.position.copy(a)
      wrinkle.quaternion.copy(link.quaternion)
      wrinkle.rotateX(Math.PI / 2)
      pescoco.add(wrinkle)
    }
  }
  corpo.add(pescoco)

  // ---- cabeça curvada sobre o pratinho -----------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.26, 1.18)
  cabeca.rotation.x = -1.02 // pose final: já inclinada sobre o prato

  const skull = sphere(0.2, LIMB, { roughness: 0.78 })
  skull.scale.set(0.95, 0.85, 1.15)
  cabeca.add(skull)

  const snout = sphere(0.135, '#8ab86c', { roughness: 0.78 })
  snout.position.set(0, -0.035, 0.17)
  snout.scale.set(0.88, 0.72, 1.05)
  cabeca.add(snout)

  const beak = rbox(0.13, 0.03, 0.1, 0.012, '#c9b072', { roughness: 0.6 })
  beak.position.set(0, -0.085, 0.23)
  cabeca.add(beak)

  for (const side of [-1, 1]) {
    const nostril = sphere(0.014, INK, { roughness: 0.4 })
    nostril.position.set(side * 0.04, -0.02, 0.29)
    cabeca.add(nostril)

    const eye = sphere(0.058, '#ffffff', { roughness: 0.22 })
    eye.position.set(side * 0.105, 0.065, 0.16)
    eye.scale.z = 0.6
    const pupil = sphere(0.028, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.108, 0.062, 0.2)
    cabeca.add(eye, pupil)

    const lid = capsule(0.03, 0.07, SCUTE, { roughness: 0.8 })
    lid.position.set(side * 0.105, 0.115, 0.15)
    lid.rotation.z = Math.PI / 2
    lid.scale.set(1, 1, 0.7)
    cabeca.add(lid)
  }
  corpo.add(cabeca)

  // ---- pratinho dourado (telescopa por dentro da mesa) -------------------
  const pratinho = new THREE.Group()
  pratinho.position.set(0.27, TOP, 0)

  // prato maciço (sem interior de lathe visto pelo avesso): aba larga + rim
  const dish = cylinder(0.3, 0.17, 0.05, GOLD, { roughness: 0.32, metalness: 0.45 })
  dish.position.y = 0.035
  pratinho.add(dish)

  const dishRim = torus(0.29, 0.018, BRASS, { roughness: 0.28, metalness: 0.6 })
  dishRim.rotation.x = Math.PI / 2
  dishRim.position.y = 0.06
  pratinho.add(dishRim)

  const dishFoot = cylinder(0.15, 0.13, 0.02, BRASS, { roughness: 0.3, metalness: 0.6 })
  dishFoot.position.y = 0.0
  pratinho.add(dishFoot)
  root.add(pratinho)

  // ---- sílaba solitária azul --------------------------------------------
  const silaba = new THREE.Group()
  silaba.position.set(0.27, TOP + 0.085, 0)
  silaba.rotation.y = 0.15

  const tile = rbox(0.24, 0.05, 0.17, 0.022, BLUE, { roughness: 0.35 })
  silaba.add(tile)
  // "LI" deitado no ladrilho, legível de cima
  const glyphs: [number, number, number, number][] = [
    [-0.055, 0, 0.024, 0.1], // L haste
    [-0.032, 0.038, 0.07, 0.024], // L pé (lado da câmera)
    [0.065, 0, 0.024, 0.1], // I
  ]
  for (const [gx, gz, w, d] of glyphs) {
    const glyph = rbox(w, 0.014, d, 0.006, CREAM, { roughness: 0.5 })
    glyph.position.set(gx, 0.03, gz)
    silaba.add(glyph)
  }
  root.add(silaba)

  // ---- cúpula de PRATA (erguida ao lado, pose final) ---------------------
  const cupula = new THREE.Group()
  cupula.position.set(0.62, TOP + 0.51, 0)

  const cloche = lathe(
    [
      [0.29, 0], [0.295, 0.05], [0.27, 0.16], [0.19, 0.27],
      [0.08, 0.32], [0, 0.325],
    ],
    SILVER,
    { roughness: 0.18, metalness: 0.9 },
  )
  cupula.add(cloche)

  const knobStem = cylinder(0.022, 0.028, 0.06, SILVER, { roughness: 0.18, metalness: 0.9 })
  knobStem.position.y = 0.35
  cupula.add(knobStem)

  const knob = sphere(0.055, SILVER, { roughness: 0.18, metalness: 0.9 })
  knob.position.y = 0.4
  cupula.add(knob)
  root.add(cupula)

  // ---- peças -------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'salao', object: base },
    { name: 'mesa', group: 'salao', object: mesa },
    { name: 'lustre', group: 'lustre', object: lustre },
    { name: 'corpo', group: 'samara', object: corpo },
    { name: 'broche', group: 'samara', object: broche },
    { name: 'pescoco', group: 'samara', object: pescoco },
    { name: 'cabeca', group: 'samara', object: cabeca },
    { name: 'pratinho', group: 'servico', object: pratinho },
    { name: 'cupula', group: 'servico', object: cupula },
    { name: 'silaba', group: 'silaba', object: silaba },
  ]

  // ---- montagem ----------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.85, [riseFrom(0, 1.4)], {
      ease: 'easeOut',
      caption: 'Sobe do chão o salão do restaurante mais chique de Estocolmo…',
    }),
    seq('mesa-rise', 'mesa', 0.2, 0.85, [riseFrom(GY, 1.35)], { ease: 'easeOut' }),

    seq(
      'lustre-grow',
      'lustre',
      2.0,
      0.85,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: '…o lustre desce do teto sobre a mesa posta.' },
    ),

    seq('corpo-rise', 'corpo', 3.6, 0.9, [riseFrom(GY, 1.15)], {
      ease: 'easeOut',
      caption: 'A garçonete é SÂMARA — CAN-DU? — uma tartaruga de gravatinha.',
    }),
    seq(
      'broche-pop',
      'broche',
      3.8,
      0.55,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq(
      'pescoco-grow',
      'pescoco',
      5.3,
      1.0,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'O pescoço dela é LONGUÍSSIMO (LÔNG) e se estica sobre a mesa…',
      },
    ),
    seq(
      'cabeca-out',
      'cabeca',
      5.45,
      1.0,
      [ch('position.y', 0.36, 1.26), ch('position.z', 0.38, 1.18)],
      { ease: 'easeOut' },
    ),

    seq('pratinho-rise', 'pratinho', 7.1, 0.7, [ch('position.y', 0.6, TOP)], {
      ease: 'easeOut',
      caption: '…e ela serve num pratinho dourado, tampado com a cúpula de PRATA (PRÁ-TA).',
    }),
    seq(
      'cupula-grow',
      'cupula',
      7.25,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq(
      'cupula-lift',
      'cupula',
      8.8,
      0.85,
      [ch('position.y', TOP + 0.07, TOP + 0.51), ch('position.x', 0.27, 0.62)],
      {
        caption:
          'Ergue a PRATA: sai UMA sílaba só, um pouquinho — LÍ-TE. Kan du prata lite långsammare?',
      },
    ),
    seq(
      'silaba-pop',
      'silaba',
      8.95,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('cabeca-tilt', 'cabeca', 10.4, 0.7, [ch('rotation.x', -0.85, -1.02)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.6, 2.95, 5.0], target: [-0.1, 1.4, 0.1] },
  }
}

export const card: Card = {
  refine: { organic: ['corpo', 'pescoco', 'cabeca'] },
  meta: {
    id: 'kan-du-prata-lite-langsammare',
    contexto:
      'No telefone, no balcão da vårdcentral, com colega que dispara sueco em velocidade normal.',
    fraseFonte: 'Você pode falar um pouco mais devagar?',
    fraseAlvo: 'Kan du prata lite långsammare?',
    pronuncia:
      "kan du PRÂ-ta LÍ-te LÔNG-sam-ma-re ('lite' com i longo; 'ng' nasal como em 'tango')",
    ponteSonora:
      '"CAN-DU PRÁ-TA LÍ-TE... LÔNG SÂ-ma-ra!" (CAN-DU é C+A+N, sem o glide de \'quando\'; SÂ-ma-ra proparoxítona)',
    historia:
      'A garçonete do restaurante mais chique de Estocolmo é SÂMARA, uma tartaruga de pescoço LONGUÍSSIMO. No peito dela um broche diz "PRA TÁ LITE" — pra ficar leve. Ela serve UMA sílaba por vez num pratinho dourado: quanto mais longo o pescoço, mais devagar sai a sílaba.',
  },
  createScene,
}

export default card
