import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Jag har ett möte." — IÁ, RRÁR! ÉT... MÖÖ-te!
 *
 * A cientista maluca tem reunião marcada às duas com um METEORO. Gargalhada
 * de vilã (IÁ, RRÁR!), frasco de ÉTER destampado, o teto estoura no meio do
 * "METE…!" e o meteoro aterrissa sentadinho na cadeira do outro lado da mesa
 * de reunião. Ela manda um beijinho de bico: MÖÖ-te.
 *
 * Diorama: piso xadrez de laboratório, mesa redonda branca com jarra, copinhos
 * e um relógio marcando 2h; cientista à esquerda, meteoro à direita, um de
 * frente para o outro e os dois abertos para a câmera.
 */

const TILE_DARK = '#26272b'
const TILE_LIGHT = '#e9e6df'
const RIM = '#3a3d44'
const WHITE = '#f3f2ee'
const COAT = '#f1f0ea'
const COAT_SHADE = '#d9d8d2'
const SKIN = '#efc9a4'
const HAIR = '#f7f7f4'
const GOGGLE = '#4fae68'
const GOGGLE_DARK = '#2c5a3a'
const CHAIR = '#8b929b'
const CHAIR_DARK = '#5d636b'
const STEEL = '#9aa1a8'
const GLASS_BLUE = '#3f8fd6'
const WATER = '#a9d8ef'
const LIPS = '#e8517f'
const STONE = '#3b3735'
const STONE_DARK = '#2a2726'
const EMBER = '#ff6410' // acento saturado, RESERVADO ao meteoro (rachaduras e cauda)
const EMBER_HOT = '#ffb31f'

const GY = 0.18 // topo da base do diorama
const TABLE_TOP = GY + 0.62
const TABLE: [number, number] = [0, -0.15]
const SCI: [number, number] = [-0.98, -0.12]
const SCI_ROT = 0.85
const SEAT_Y = GY + 0.42
const MET: [number, number] = [1.0, -0.12]
const MET_R = 0.42
const MET_Y = SEAT_Y + MET_R * 0.86
const HEART: [number, number, number] = [0.12, 1.6, 0.15]

/** Piso xadrez em textura de canvas, aplicado na tampa do disco. */
function checkerTexture() {
  const n = 12
  const px = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = n * px
  const ctx = canvas.getContext('2d')!
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? TILE_DARK : TILE_LIGHT
      ctx.fillRect(i * px, j * px, px, px)
    }
  }
  // rejunte fino
  ctx.strokeStyle = '#8f8b84'
  ctx.lineWidth = 2
  for (let i = 0; i <= n; i++) {
    ctx.beginPath(); ctx.moveTo(i * px, 0); ctx.lineTo(i * px, n * px); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i * px); ctx.lineTo(n * px, i * px); ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Orienta o eixo `axis` local do objeto ao longo de `dir`. */
function aim(o: THREE.Object3D, dir: THREE.Vector3, axis = new THREE.Vector3(0, 1, 0)) {
  o.quaternion.setFromUnitVectors(axis, dir.clone().normalize())
}

/** Cadeira cinza de reunião; o assento olha para +z local. */
function makeChair() {
  const g = new THREE.Group()
  const seat = rbox(0.5, 0.07, 0.46, 0.03, CHAIR, { roughness: 0.6 })
  seat.position.y = 0.42 - 0.035
  g.add(seat)
  const back = rbox(0.5, 0.48, 0.06, 0.03, CHAIR, { roughness: 0.6 })
  back.position.set(0, 0.72, -0.22)
  back.rotation.x = -0.1
  g.add(back)
  const backRail = rbox(0.42, 0.06, 0.07, 0.025, CHAIR_DARK, { roughness: 0.5 })
  backRail.position.set(0, 0.86, -0.235)
  backRail.rotation.x = -0.1
  g.add(backRail)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = cylinder(0.022, 0.018, 0.4, STEEL, { roughness: 0.3, metalness: 0.75 })
      leg.position.set(sx * 0.21, 0.2, sz * 0.19)
      g.add(leg)
    }
    const post = cylinder(0.02, 0.02, 0.36, STEEL, { roughness: 0.3, metalness: 0.75 })
    post.position.set(sx * 0.19, 0.58, -0.21)
    g.add(post)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(47)

  // ---- base: piso xadrez de laboratório ------------------------------------
  const base = new THREE.Group()
  const plinth = cylinder(2.5, 2.58, 0.12, RIM, { roughness: 0.7 })
  plinth.position.y = 0.06
  base.add(plinth)

  const floorMat = new THREE.MeshStandardMaterial({ map: checkerTexture(), roughness: 0.35, metalness: 0.02 })
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.06, 64), [
    new THREE.MeshStandardMaterial({ color: '#4a4d55', roughness: 0.6 }),
    floorMat,
    floorMat,
  ])
  floor.receiveShadow = true
  floor.position.y = GY - 0.03
  base.add(floor)

  // bancada do laboratório ao fundo, à esquerda: tubos de ensaio coloridos
  const bench = new THREE.Group()
  bench.position.set(-1.65, GY, -1.25)
  bench.rotation.y = 0.5
  const benchTop = rbox(0.9, 0.06, 0.45, 0.02, '#2f3a44', { roughness: 0.4 })
  benchTop.position.y = 0.6
  bench.add(benchTop)
  const benchBody = rbox(0.84, 0.56, 0.4, 0.03, '#c9ccd0', { roughness: 0.55 })
  benchBody.position.y = 0.29
  bench.add(benchBody)
  for (const dx of [-0.2, 0.2]) {
    const door = rbox(0.36, 0.44, 0.02, 0.015, '#b6babf', { roughness: 0.55 })
    door.position.set(dx, 0.3, 0.205)
    bench.add(door)
    const knob = sphere(0.02, STEEL, { roughness: 0.3, metalness: 0.8 })
    knob.position.set(dx + (dx < 0 ? 0.13 : -0.13), 0.4, 0.22)
    bench.add(knob)
  }
  const rack = rbox(0.4, 0.05, 0.12, 0.015, '#8a6a4a', { roughness: 0.7 })
  rack.position.set(-0.12, 0.7, 0)
  bench.add(rack)
  ;['#8bd16a', '#b07be0', '#f2d14b', '#6ec3e8'].forEach((c, i) => {
    const tube = capsule(0.028, 0.16, '#dfe9ef', { roughness: 0.1 })
    tube.position.set(-0.27 + i * 0.1, 0.74, 0)
    bench.add(tube)
    const liquid = capsule(0.024, 0.06, c, { roughness: 0.2 })
    liquid.position.set(-0.27 + i * 0.1, 0.69, 0)
    bench.add(liquid)
  })
  const bulb = lathe(
    [[0, 0], [0.09, 0.01], [0.12, 0.08], [0.1, 0.16], [0.03, 0.2], [0.03, 0.3], [0, 0.3]],
    '#c66bd6',
    { roughness: 0.15 },
  )
  bulb.position.set(0.26, 0.63, 0.02)
  bench.add(bulb)
  base.add(bench)

  // carrinho com caderno de atas, ao fundo à direita
  const cart = new THREE.Group()
  cart.position.set(1.75, GY, -1.2)
  cart.rotation.y = -0.55
  for (const sy of [0.12, 0.5]) {
    const shelf = rbox(0.6, 0.04, 0.4, 0.015, '#c9ccd0', { roughness: 0.5 })
    shelf.position.y = sy
    cart.add(shelf)
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pole = cylinder(0.015, 0.015, 0.5, STEEL, { roughness: 0.3, metalness: 0.8 })
      pole.position.set(sx * 0.27, 0.27, sz * 0.17)
      cart.add(pole)
    }
  }
  const binder = rbox(0.34, 0.05, 0.26, 0.012, '#c0453a', { roughness: 0.7 })
  binder.position.set(-0.05, 0.545, 0)
  binder.rotation.y = 0.2
  cart.add(binder)
  const papers = rbox(0.3, 0.04, 0.22, 0.008, '#f1eee6', { roughness: 0.9 })
  papers.position.set(0.05, 0.16, 0.02)
  cart.add(papers)
  base.add(cart)

  root.add(base)

  // ---- mesa redonda branca de reunião --------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(TABLE[0], 0, TABLE[1])
  const top = cylinder(0.6, 0.6, 0.05, WHITE, { roughness: 0.3 })
  top.position.y = TABLE_TOP - 0.025
  mesa.add(top)
  const edge = torus(0.6, 0.026, '#d8d7d2', { roughness: 0.35 })
  edge.rotation.x = Math.PI / 2
  edge.position.y = TABLE_TOP - 0.03
  mesa.add(edge)
  const pedestal = lathe(
    [[0.07, GY], [0.06, GY + 0.2], [0.055, TABLE_TOP - 0.12], [0.12, TABLE_TOP - 0.06], [0, TABLE_TOP - 0.05]],
    '#c8c9cc',
    { roughness: 0.3, metalness: 0.6 },
  )
  mesa.add(pedestal)
  const foot = lathe(
    [[0, GY], [0.32, GY], [0.33, GY + 0.02], [0.2, GY + 0.05], [0.07, GY + 0.07], [0, GY + 0.07]],
    '#c8c9cc',
    { roughness: 0.3, metalness: 0.6 },
  )
  mesa.add(foot)
  root.add(mesa)

  // ---- jarra, copinhos e relógio das duas ----------------------------------
  const servico = new THREE.Group()
  servico.position.set(TABLE[0], TABLE_TOP, TABLE[1])

  const jarra = new THREE.Group()
  jarra.position.set(0.02, 0, -0.28)
  const jug = lathe(
    [[0, 0], [0.1, 0], [0.115, 0.03], [0.115, 0.2], [0.1, 0.27], [0.085, 0.3], [0.1, 0.33], [0.09, 0.335], [0.075, 0.31], [0, 0.3]],
    WATER,
    { roughness: 0.08 },
  )
  jarra.add(jug)
  const waterLine = torus(0.114, 0.008, '#6fb6dc', { roughness: 0.1 })
  waterLine.rotation.x = Math.PI / 2
  waterLine.position.y = 0.17
  jarra.add(waterLine)
  const jugHandle = torus(0.085, 0.017, WATER, { roughness: 0.08 })
  jugHandle.position.set(-0.12, 0.17, 0)
  jugHandle.scale.set(0.7, 1, 1)
  jarra.add(jugHandle)
  const spout = cone(0.035, 0.08, WATER, { roughness: 0.08 })
  spout.position.set(0.1, 0.32, 0)
  spout.rotation.z = -1.2
  jarra.add(spout)
  servico.add(jarra)

  for (const [cx, cz] of [[-0.3, 0.02], [0.32, 0.02]] as const) {
    const cup = lathe(
      [[0, 0], [0.045, 0], [0.062, 0.13], [0.054, 0.13], [0.04, 0.012], [0, 0.012]],
      '#dcecf3',
      { roughness: 0.08 },
    )
    cup.position.set(cx, 0, cz)
    servico.add(cup)
    const water = cylinder(0.052, 0.044, 0.07, WATER, { roughness: 0.1 })
    water.position.set(cx, 0.045, cz)
    servico.add(water)
  }

  // relógio de mesa virado para a câmera: duas horas
  const relogio = new THREE.Group()
  relogio.position.set(0.0, 0.0, 0.3)
  relogio.rotation.x = -0.25
  const clockBody = cylinder(0.14, 0.14, 0.06, '#c0453a', { roughness: 0.5 })
  clockBody.rotation.x = Math.PI / 2
  clockBody.position.y = 0.15
  relogio.add(clockBody)
  const dial = cylinder(0.118, 0.118, 0.012, '#fbfaf5', { roughness: 0.4 })
  dial.rotation.x = Math.PI / 2
  dial.position.set(0, 0.15, 0.032)
  relogio.add(dial)
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const tick = rbox(0.012, k % 3 === 0 ? 0.03 : 0.018, 0.006, 0.003, '#2a2a2a', { roughness: 0.5 })
    tick.position.set(Math.sin(a) * 0.098, 0.15 + Math.cos(a) * 0.098, 0.04)
    tick.rotation.z = -a
    relogio.add(tick)
  }
  // ponteiro das horas no 2 (60°) e dos minutos no 12
  const hourHand = rbox(0.016, 0.06, 0.008, 0.004, '#1f1f1f', { roughness: 0.5 })
  hourHand.position.set(Math.sin(Math.PI / 3) * 0.03, 0.15 + Math.cos(Math.PI / 3) * 0.03, 0.044)
  hourHand.rotation.z = -Math.PI / 3
  relogio.add(hourHand)
  const minHand = rbox(0.012, 0.085, 0.008, 0.004, '#1f1f1f', { roughness: 0.5 })
  minHand.position.set(0, 0.15 + 0.0425, 0.046)
  relogio.add(minHand)
  const pin = sphere(0.012, '#1f1f1f', { roughness: 0.4 })
  pin.position.set(0, 0.15, 0.05)
  relogio.add(pin)
  for (const s of [-1, 1]) {
    const bell = sphere(0.05, '#d4a640', { roughness: 0.3, metalness: 0.7 })
    bell.scale.y = 0.6
    bell.position.set(s * 0.09, 0.29, -0.01)
    relogio.add(bell)
    const leg = cylinder(0.012, 0.012, 0.06, '#d4a640', { roughness: 0.3, metalness: 0.7 })
    leg.position.set(s * 0.08, 0.03, 0)
    leg.rotation.z = s * 0.4
    relogio.add(leg)
  }
  servico.add(relogio)
  root.add(servico)

  // ---- duas cadeiras cinza --------------------------------------------------
  const cadeiras = new THREE.Group()
  const chairMet = makeChair()
  chairMet.position.set(MET[0] + 0.08, GY, MET[1] - 0.04)
  chairMet.rotation.y = -Math.PI / 2 + 0.25 // assento olhando para a mesa (−x)
  cadeiras.add(chairMet)
  const chairSci = makeChair()
  chairSci.position.set(-1.55, GY, -0.7)
  chairSci.rotation.y = Math.PI / 2 - 0.5 // empurrada para trás, atrás da cientista
  cadeiras.add(chairSci)
  root.add(cadeiras)

  // ---- cientista maluca ----------------------------------------------------
  const cientista = person({ body: COAT, skin: SKIN, height: 1.5, armAngle: 0.35 })
  cientista.position.set(SCI[0], GY, SCI[1])
  cientista.rotation.y = SCI_ROT
  cientista.scale.setScalar(1.12)

  // jaleco comprido: aba que desce do quadril quase até o chão
  const coatTail = lathe(
    [[0.29, 0.1], [0.3, 0.16], [0.285, 0.3], [0.265, 0.42], [0.25, 0.46]],
    COAT,
    { roughness: 0.75 },
  )
  cientista.add(coatTail)
  const hem = torus(0.292, 0.012, COAT_SHADE, { roughness: 0.75 })
  hem.rotation.x = Math.PI / 2
  hem.position.y = 0.105
  cientista.add(hem)
  // gravata roxa entre as lapelas
  const tie = rbox(0.06, 0.2, 0.02, 0.01, '#6a4fa0', { roughness: 0.6 })
  tie.position.set(0, 0.6, 0.245)
  tie.rotation.x = -0.15
  cientista.add(tie)
  const knot = rbox(0.06, 0.045, 0.03, 0.012, '#5a3f8e', { roughness: 0.6 })
  knot.position.set(0, 0.71, 0.24)
  cientista.add(knot)
  for (const s of [-1, 1]) {
    const lapel = rbox(0.07, 0.24, 0.02, 0.01, COAT_SHADE, { roughness: 0.75 })
    lapel.position.set(s * 0.075, 0.6, 0.245)
    lapel.rotation.set(-0.15, 0, s * 0.3)
    cientista.add(lapel)
  }
  for (let b = 0; b < 3; b++) {
    const button = sphere(0.016, '#bdbdb6', { roughness: 0.4 })
    button.position.set(0.06, 0.24 + b * 0.09, 0.262)
    cientista.add(button)
  }
  const pocket = rbox(0.11, 0.09, 0.02, 0.01, COAT_SHADE, { roughness: 0.75 })
  pocket.position.set(-0.13, 0.52, 0.23)
  pocket.rotation.y = -0.4
  cientista.add(pocket)
  ;['#c0453a', '#3f6fd6'].forEach((c, i) => {
    const pen = cylinder(0.01, 0.01, 0.1, c, { roughness: 0.4 })
    pen.position.set(-0.155 + i * 0.03, 0.58, 0.22)
    cientista.add(pen)
  })

  const head = cientista.getObjectByName('head') as THREE.Group
  const HR = 0.285

  // cabelo branco eletrizado: espetos irradiando da parte de cima e de trás
  const cabelo = new THREE.Group()
  const hairCore = puff(HR * 0.72, HAIR, 6, 12, { roughness: 0.85 })
  hairCore.position.set(0, HR * 0.38, -HR * 0.25)
  cabelo.add(hairCore)
  const hairRand = rng(91)
  for (let i = 0; i < 22; i++) {
    const phi = hairRand() * Math.PI * 2
    const up = 0.15 + hairRand() * 0.85
    const dir = new THREE.Vector3(Math.cos(phi) * Math.sqrt(1 - up * up), up, Math.sin(phi) * Math.sqrt(1 - up * up))
    if (dir.z > 0.35 && dir.y < 0.75) dir.z = -dir.z // nada de franja cobrindo o rosto
    const len = 0.2 + hairRand() * 0.14
    const spike = cone(0.055, len, HAIR, { roughness: 0.85 }, 12)
    aim(spike, dir)
    spike.position.copy(dir.clone().multiplyScalar(HR * 0.88 + len * 0.42))
    spike.position.y += HR * 0.08
    cabelo.add(spike)
  }
  head.add(cabelo)

  // óculos de proteção verdes empurrados para a testa
  const oculos = new THREE.Group()
  oculos.position.set(0, HR * 0.5, HR * 0.72)
  oculos.rotation.x = -0.55
  for (const s of [-1, 1]) {
    const rimG = torus(0.068, 0.022, GOGGLE_DARK, { roughness: 0.45 })
    rimG.position.set(s * 0.085, 0, 0)
    oculos.add(rimG)
    const lens = cylinder(0.066, 0.066, 0.02, GOGGLE, { roughness: 0.12 })
    lens.rotation.x = Math.PI / 2
    lens.position.set(s * 0.085, 0, 0.005)
    oculos.add(lens)
    const shine = sphere(0.016, '#e8fff0', { roughness: 0.1 })
    shine.position.set(s * 0.085 - 0.025, 0.025, 0.02)
    oculos.add(shine)
  }
  const bridge = rbox(0.05, 0.025, 0.025, 0.01, GOGGLE_DARK, { roughness: 0.45 })
  oculos.add(bridge)
  head.add(oculos)
  const strap = torus(HR * 1.0, 0.016, GOGGLE_DARK, { roughness: 0.6 })
  strap.rotation.x = Math.PI / 2 - 0.45
  strap.position.y = HR * 0.36
  head.add(strap)

  // bico de beijo (rosa), virado para o meteoro
  const bico = new THREE.Group()
  bico.position.set(0, -HR * 0.38, HR * 0.86)
  const lipUpper = capsule(0.04, 0.03, LIPS, { roughness: 0.35 })
  lipUpper.rotation.z = Math.PI / 2
  lipUpper.position.set(0, 0.022, 0.03)
  bico.add(lipUpper)
  const lipLower = capsule(0.04, 0.03, LIPS, { roughness: 0.35 })
  lipLower.rotation.z = Math.PI / 2
  lipLower.position.set(0, -0.022, 0.03)
  bico.add(lipLower)
  const pucker = cylinder(0.045, 0.055, 0.07, LIPS, { roughness: 0.35 })
  pucker.rotation.x = Math.PI / 2
  pucker.position.z = 0.02
  bico.add(pucker)
  const hole = sphere(0.018, '#7a2340', { roughness: 0.5 })
  hole.position.z = 0.058
  hole.scale.z = 0.4
  bico.add(hole)
  head.add(bico)

  // sobrancelhas arqueadas de vilã encantada
  for (const s of [-1, 1]) {
    const brow = rbox(0.09, 0.022, 0.02, 0.01, '#bdbab2', { roughness: 0.8 })
    brow.position.set(s * HR * 0.38, HR * 0.33, HR * 0.86)
    brow.rotation.z = s * -0.3
    head.add(brow)
  }

  // braço esquerdo (lado da câmera) ergue o frasco de éter
  const ARM_UP = -2.35
  const bracoL = cientista.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoL, 1.5)
  bracoL.rotation.z = ARM_UP
  const handL = bracoL.children[0]

  const frasco = new THREE.Group()
  frasco.position.copy(handL.position)
  frasco.rotation.z = -ARM_UP // de pé no mundo quando o braço está erguido
  const flaskBody = new THREE.Group()
  flaskBody.position.y = -0.17
  const flask = lathe(
    [[0, 0], [0.12, 0], [0.135, 0.02], [0.13, 0.05], [0.055, 0.2], [0.036, 0.23], [0.036, 0.31], [0.048, 0.32], [0.044, 0.335], [0.03, 0.33], [0, 0.31]],
    GLASS_BLUE,
    { roughness: 0.08 },
  )
  flaskBody.add(flask)
  const liquid = lathe(
    [[0, 0.005], [0.125, 0.005], [0.13, 0.04], [0.105, 0.09], [0, 0.09]],
    '#7cc6ff',
    { roughness: 0.15 },
  )
  liquid.scale.setScalar(1.02)
  flaskBody.add(liquid)
  const label = rbox(0.09, 0.05, 0.012, 0.008, '#f4efe2', { roughness: 0.7 })
  label.position.set(0, 0.06, 0.1)
  label.rotation.x = -0.6
  flaskBody.add(label)
  frasco.add(flaskBody)
  bracoL.add(frasco)

  // rolha que saltou
  const rolha = cylinder(0.04, 0.032, 0.06, '#b0835a', { roughness: 0.8 })
  rolha.position.set(0.12, 0.27, 0.05)
  rolha.rotation.z = 0.9
  frasco.add(rolha)

  // três nuvens de éter subindo do gargalo
  const eter = new THREE.Group()
  eter.position.y = 0.19
  const clouds: [number, number, number, number][] = [
    [0.02, 0.1, 0.0, 0.085],
    [0.1, 0.25, 0.02, 0.11],
    [0.24, 0.39, 0.04, 0.13],
  ]
  clouds.forEach(([x, y, z, r], i) => {
    const c = puff(r, '#f8fbff', 5, 60 + i, { roughness: 0.95 })
    c.position.set(x, y, z)
    eter.add(c)
  })
  frasco.add(eter)

  // braço direito: aberto, anunciando a visita
  const bracoR = cientista.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  bracoR.rotation.z = 1.25

  root.add(cientista)

  // ---- METEORO -------------------------------------------------------------
  const meteoro = new THREE.Group()
  meteoro.position.set(MET[0], MET_Y, MET[1])
  meteoro.rotation.y = -0.95 // a cara (+z local) olha para a cientista e a câmera

  const stoneGeo = new THREE.IcosahedronGeometry(MET_R, 2)
  {
    const pos = stoneGeo.attributes.position
    const v = new THREE.Vector3()
    const offsets = new Map<string, number>()
    const r = rng(7)
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
      let k = offsets.get(key)
      if (k === undefined) offsets.set(key, (k = 1 + (r() - 0.5) * 0.14))
      v.multiplyScalar(k)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    stoneGeo.computeVertexNormals()
  }
  const stone = rock(MET_R, STONE, 7, { roughness: 0.9 })
  stone.geometry.dispose()
  stone.geometry = stoneGeo
  stone.scale.set(1.06, 0.94, 1)
  meteoro.add(stone)
  stone.updateMatrixWorld(true)

  const ray = new THREE.Raycaster()
  /** Ponto e normal na superfície da rocha na direção `dir` (frame do meteoro). */
  const surface = (dir: THREE.Vector3) => {
    const d = dir.clone().normalize()
    ray.set(d.clone().multiplyScalar(2), d.clone().negate())
    const hit = ray.intersectObject(stone, false)[0]
    const p = hit ? hit.point : d.clone().multiplyScalar(MET_R)
    return { p, n: d }
  }

  // crateras: anel escuro + fundo afundado
  const craterDirs: [number, number, number, number][] = [
    [0.75, 0.45, 0.2, 0.09], [-0.2, 0.75, -0.5, 0.11], [0.55, -0.2, -0.75, 0.1],
    [-0.8, 0.2, -0.3, 0.08], [0.15, -0.55, 0.75, 0.06], [-0.55, 0.45, 0.55, 0.07],
    [0.9, -0.3, 0.3, 0.06],
  ]
  for (const [x, y, z, r] of craterDirs) {
    const { p, n } = surface(new THREE.Vector3(x, y, z))
    const ring = torus(r, r * 0.3, '#4a4542', { roughness: 0.95, flat: true })
    aim(ring, n, new THREE.Vector3(0, 0, 1))
    ring.scale.z = 0.45
    ring.position.copy(p).addScaledVector(n, -0.012)
    meteoro.add(ring)
    const pit = sphere(r * 0.95, STONE_DARK, { roughness: 0.95 })
    pit.scale.set(1, 1, 0.35)
    aim(pit, n, new THREE.Vector3(0, 0, 1))
    pit.position.copy(p).addScaledVector(n, -0.01)
    meteoro.add(pit)
  }

  // rachaduras em brasa: zigue-zagues emissivos rente à superfície
  const crackRand = rng(19)
  const crackStarts: [number, number, number][] = [
    [0.3, 0.2, 0.9], [-0.7, -0.3, 0.4], [0.6, 0.6, -0.4], [-0.3, -0.6, -0.6],
    [0.85, 0.05, -0.1], [-0.2, 0.9, 0.2], [0.1, -0.85, 0.2],
  ]
  for (const start of crackStarts) {
    const d = new THREE.Vector3(...start).normalize()
    const tangent = new THREE.Vector3(crackRand() - 0.5, crackRand() - 0.5, crackRand() - 0.5).cross(d).normalize()
    for (let s = 0; s < 3; s++) {
      const { p, n } = surface(d)
      const seg = capsule(0.012, 0.09, EMBER, { emissive: EMBER, emissiveIntensity: 1.5 })
      seg.position.copy(p).addScaledVector(n, 0.002)
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
      meteoro.add(seg)
      // avança pela superfície e quebra a direção
      d.addScaledVector(tangent, 0.2).normalize()
      tangent.applyAxisAngle(d, (crackRand() - 0.5) * 1.8).projectOnPlane(d).normalize()
    }
  }

  // carinha: olhos grandes encantados e sorriso
  for (const s of [-1, 1]) {
    const { p, n } = surface(new THREE.Vector3(s * 0.32, 0.22, 0.92))
    const eye = sphere(0.075, '#ffffff', { roughness: 0.25 })
    eye.scale.z = 0.55
    aim(eye, n, new THREE.Vector3(0, 0, 1))
    eye.position.copy(p).addScaledVector(n, 0.01)
    meteoro.add(eye)
    const pupil = sphere(0.036, '#141414', { roughness: 0.2 })
    pupil.position.copy(p).addScaledVector(n, 0.045)
    pupil.position.x -= 0.012
    meteoro.add(pupil)
    const glint = sphere(0.012, '#ffffff', { roughness: 0.1 })
    glint.position.copy(pupil.position).addScaledVector(n, 0.03)
    glint.position.y += 0.014
    glint.position.x += 0.01
    meteoro.add(glint)
  }
  {
    const { p, n } = surface(new THREE.Vector3(0, -0.12, 1))
    const smile = torus(0.075, 0.016, '#1c1a19', { roughness: 0.6 })
    ;(smile.geometry as THREE.TorusGeometry).dispose()
    smile.geometry = new THREE.TorusGeometry(0.075, 0.016, 12, 24, Math.PI)
    aim(smile, n, new THREE.Vector3(0, 0, 1))
    smile.rotateZ(Math.PI)
    smile.position.copy(p).addScaledVector(n, 0.012)
    meteoro.add(smile)
    for (const s of [-1, 1]) {
      const blush = sphere(0.045, '#ff8a5c', { emissive: '#ff6a3a', emissiveIntensity: 0.6 })
      blush.scale.set(1, 0.6, 0.3)
      const q = surface(new THREE.Vector3(s * 0.55, -0.05, 0.82))
      aim(blush, q.n, new THREE.Vector3(0, 0, 1))
      blush.position.copy(q.p).addScaledVector(q.n, 0.004)
      meteoro.add(blush)
    }
  }

  // brilho quente que lambe a mesa
  const glow = new THREE.PointLight(EMBER, 2.2, 2.6, 2)
  glow.position.set(0, 0.1, 0.6)
  meteoro.add(glow)

  root.add(meteoro)

  // ---- cauda de fogo subindo do meteoro (filha dele: cai junto) -------------
  const cauda = new THREE.Group()
  cauda.position.set(0, MET_R * 0.2, -0.08)
  cauda.rotation.set(-0.15, 0, -0.32)
  // labareda estilizada: gota laranja grande, núcleo amarelo e línguas
  // menores em leque — fogo de desenho, saturado, sem virar casquinha
  const drop = (h: number, w: number): [number, number][] => [
    [0, 0], [w * 0.75, h * 0.05], [w, h * 0.2], [w * 0.92, h * 0.4],
    [w * 0.62, h * 0.65], [w * 0.28, h * 0.87], [0, h],
  ]
  const fireMat = { emissive: EMBER, emissiveIntensity: 0.75, roughness: 0.6 }
  const hotMat = { emissive: EMBER_HOT, emissiveIntensity: 0.9, roughness: 0.6 }
  const bigFlame = lathe(drop(1.05, 0.36), EMBER, fireMat, 28)
  bigFlame.position.y = -0.12
  cauda.add(bigFlame)
  const coreFlame = lathe(drop(0.7, 0.24), EMBER_HOT, hotMat, 24)
  coreFlame.position.set(0, -0.05, 0.14)
  cauda.add(coreFlame)
  const tongues: [number, number, number, number, number][] = [
    // x, y, z, inclinação, altura
    [-0.26, 0.05, 0.05, 0.55, 0.55],
    [0.27, 0.0, 0.0, -0.5, 0.6],
    [-0.12, 0.25, -0.12, 0.25, 0.75],
    [0.16, 0.3, 0.1, -0.3, 0.6],
  ]
  for (const [x, y, z, tilt, h] of tongues) {
    const t = lathe(drop(h, h * 0.3), EMBER, fireMat, 16)
    t.position.set(x, y, z)
    t.rotation.z = tilt
    cauda.add(t)
  }
  const flameRand = rng(5)
  for (let i = 0; i < 6; i++) {
    const spark = sphere(0.022 + flameRand() * 0.018, EMBER_HOT, { emissive: EMBER_HOT, emissiveIntensity: 1.4 }, 10)
    const a = flameRand() * Math.PI * 2
    spark.position.set(Math.cos(a) * 0.42, 0.35 + flameRand() * 0.8, Math.sin(a) * 0.3)
    cauda.add(spark)
  }
  meteoro.add(cauda)

  // ---- escombros do teto no chão -------------------------------------------
  const escombros = new THREE.Group()
  const debris: [number, number, number][] = [
    [1.6, 0.35, 0.07], [0.62, 0.42, 0.05], [1.45, 0.72, 0.045], [1.65, -0.55, 0.06],
  ]
  debris.forEach(([x, z, r], i) => {
    const chunk = rock(r, i % 2 ? STONE : '#5a5450', 70 + i, { roughness: 0.9 })
    chunk.position.set(x, GY + r * 0.6, z)
    escombros.add(chunk)
    const plaster = rbox(r * 2.2, r * 0.5, r * 1.6, r * 0.2, '#e4e0d6', { roughness: 0.9 })
    plaster.position.set(x + (rand() - 0.5) * 0.3, GY + r * 0.25, z + 0.12)
    plaster.rotation.set(rand() * 0.3, rand() * Math.PI, rand() * 0.3)
    escombros.add(plaster)
  })
  root.add(escombros)

  // ---- coraçãozinho do beijo, a caminho do meteoro --------------------------
  const coracao = new THREE.Group()
  coracao.position.set(...HEART)
  coracao.rotation.set(0, 0.1, -0.2)
  for (const s of [-1, 1]) {
    const lobe = sphere(0.075, LIPS, { roughness: 0.3 })
    lobe.position.set(s * 0.058, 0.03, 0)
    lobe.scale.z = 0.7
    coracao.add(lobe)
  }
  const tip = cone(0.112, 0.15, LIPS, { roughness: 0.3 })
  tip.rotation.z = Math.PI
  tip.position.y = -0.06
  tip.scale.z = 0.62
  coracao.add(tip)
  root.add(coracao)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'lab', object: base },
    { name: 'mesa', group: 'lab', object: mesa },
    { name: 'cadeiras', group: 'lab', object: cadeiras },
    { name: 'servico', group: 'mesa', object: servico },
    { name: 'cientista', group: 'cientista', object: cientista },
    { name: 'bracoL', group: 'eter', object: bracoL },
    { name: 'frasco', group: 'eter', object: frasco },
    { name: 'eter', group: 'eter', object: eter },
    { name: 'bracoR', group: 'meteoro', object: bracoR },
    { name: 'meteoro', group: 'meteoro', object: meteoro },
    { name: 'cauda', group: 'meteoro', object: cauda },
    { name: 'escombros', group: 'meteoro', object: escombros },
    { name: 'bico', group: 'beijo', object: bico },
    { name: 'coracao', group: 'beijo', object: coracao },
  ]

  // ---- montagem ------------------------------------------------------------
  const sciY = GY
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No laboratório, a mesa de reunião já está posta: tem reunião marcada às duas…',
    }),
    seq('mesa-rise', 'mesa', 0.25, 0.8, [riseFrom(0, 1.2)], { ease: 'easeOut' }),
    seq('cadeiras-rise', 'cadeiras', 0.45, 0.8, [riseFrom(0, 1.2)], { ease: 'easeOut' }),
    seq('servico-cai', 'servico', 1.0, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('cientista-rise', 'cientista', 1.8, 0.8, [riseFrom(sciY, 1.9)], {
      ease: 'easeOut',
      caption: 'A cientista maluca chega e solta a gargalhada de vilã: IÁ, RRÁR!',
    }),
    seq('ri-a', 'cientista', 2.7, 0.25, [ch('rotation.z', 0, 0.07)], { ease: 'easeInOut' }),
    seq('ri-b', 'cientista', 2.95, 0.25, [ch('rotation.z', 0.07, -0.07)], { ease: 'easeInOut' }),
    seq('ri-c', 'cientista', 3.2, 0.25, [ch('rotation.z', -0.07, 0.05)], { ease: 'easeInOut' }),
    seq('ri-d', 'cientista', 3.45, 0.25, [ch('rotation.z', 0.05, 0)], { ease: 'easeInOut' }),

    seq('bracoL-ergue', 'bracoL', 3.9, 0.7, [ch('rotation.z', 0.35, ARM_UP)], {
      ease: 'easeOut',
      caption: 'Ela ergue um frasco e destampa o ÉTER pra perfumar a sala: ÉT…',
    }),
    seq('frasco-surge', 'frasco', 3.9, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('eter-sobe', 'eter', 4.7, 0.9, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('position.y', 0.02, 0.19),
    ], { ease: 'easeOut' }),

    seq('bracoR-abre', 'bracoR', 6.0, 0.5, [ch('rotation.z', -0.35, 1.25)], {
      ease: 'easeOut',
      caption: 'O teto estoura! Ela abre os braços pra anunciar a visita: "METE…!"',
    }),
    seq('cauda-acende', 'cauda', 6.1, 0.3, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ]),
    seq('meteoro-cai', 'meteoro', 6.1, 0.9, [
      ch('position.y', 4.6, MET_Y), ch('position.x', 2.2, MET[0]), ch('rotation.x', -1.4, 0),
    ], { ease: 'easeIn' }),
    seq('meteoro-amassa', 'meteoro', 7.0, 0.15, [ch('scale.y', 1, 0.8), ch('scale.x', 1, 1.12)], { ease: 'easeOut' }),
    seq('meteoro-volta', 'meteoro', 7.15, 0.35, [ch('scale.y', 0.8, 1), ch('scale.x', 1.12, 1)], { ease: 'easeOut' }),
    seq('escombros-caem', 'escombros', 7.0, 0.4, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('sentadinho', 'meteoro', 7.6, 0.6, [ch('rotation.y', -0.6, -0.95)], {
      ease: 'easeInOut',
      caption: '…e o METEORO aterrissa sentadinho na cadeira em frente. A visita chegou!',
    }),

    seq('bico-faz', 'bico', 9.0, 0.4, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Encantada, ela manda um beijinho de bico pro meteoro: MÖÖ-te!',
    }),
    seq('coracao-voa', 'coracao', 9.3, 0.9, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('position.x', -0.55, HEART[0]), ch('position.y', 1.5, HEART[1]),
    ], { ease: 'easeOut' }),

    seq('coracao-pulsa', 'coracao', 10.6, 0.5, [ch('rotation.z', 0, -0.2)], {
      ease: 'easeInOut',
      caption: 'Jag har ett möte. — Tenho uma reunião.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 2.05, 4.0], target: [0.05, 1.3, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-ett-mote',
    contexto:
      'Trabalho: pra sair de uma conversa no corredor, recusar uma ligação, explicar por que não pode agora; é também o status padrão no Teams e na agenda do escritório.',
    fraseFonte: 'Tenho uma reunião.',
    fraseAlvo: 'Jag har ett möte.',
    pronuncia:
      "iá rár et MÖÖ-te ('jag' = iá; 'har' com h soprado e R brando que emenda no 'ett': rá-rét; 'möte' com Ö longo — boca de Ô, língua de Ê — e um -te fraquinho)",
    ponteSonora:
      "IÁ, RRÁR! ÉT... MÖÖ-te! (5 sílabas: iá-rrár-ét-MÖÖ-te; tônica forte no MÖÖ; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado; RRÁR é a gargalhada soprada — o MESMO RRÁR de 'Jag har ont i magen' e 'Har du tid en stund?': h soprado como RR carioca e R final BRANDO, que já escorrega pro É seguinte (rrá-rét) — sem esse R sobra 'ha', outro verbo; ÉT = o ÉTER sem o -ER, a força já é no É: É ABERTO, curto, e T seco — é o 'ett', a mesma vogal do SÉT de 'sätt dig'; MÖÖ-te = o grito 'METE(oro)!' que o estrondo cortou no meio: sobram só as duas primeiras sílabas e a força passa pro MÊ — MÊ-te, nunca me-TE —, e esse MÊ sai no BEIJINHO DE BICO que ela manda pra visita: língua de Ê, lábios de Ô, e LONGO, o mesmo truque do FÖÖ de 'födelsedagen' e do TRÖTT; sem o bico sai um 'mête' que o sueco não reconhece; o -te é fraquinho e de T duro, nunca 'tchi' — e é -TE, nunca -TA: 'möta' é o verbo 'encontrar', não a reunião)",
    historia:
      "A cientista maluca não pode atender ninguém hoje: tem reunião marcada às duas — com um METEORO. Na hora certa ela solta a gargalhada de vilã, IÁ, RRÁR!, e destampa um frasco de ÉTER pra perfumar a sala. Quando o teto estoura, ela abre os braços pra anunciar a visita — 'METE...!' — e o resto da palavra some no estrondo. O METEORO aterrissa sentadinho na cadeira em frente a ela, do outro lado da jarra d'água e dos copinhos da mesa de reunião, e ela, encantada, manda um beijinho de bico pra ele: MÖÖ-te. Se alguém bater na porta agora, a resposta é uma só: estou numa reunião.",
  },
  createScene,
}

export default card
