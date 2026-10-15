import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, puff, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Jag mår bra, tack. Och du?" — IÁ, MÔR! BRÁ... TAC! Ó, DÜ?
 *
 * O astronauta volta pra Terra em pé no escudo térmico da cápsula, surfando a
 * reentrada no meio da BRASA. A esposa pergunta no rádio como ele está:
 * IÁ, MÔR! BRÁ-sa por fora, mas eu tô BRÁ! — TAC! no capacete — e aponta
 * direto pra você: Ó, DÜ?
 *
 * Diorama: a Terra lá embaixo (disco de oceano com continentes e duas nuvens),
 * painel de céu azul-escuro estrelado ao fundo; escudo em brasa como prancha,
 * cápsula prateada e rastro de chamas subindo pra trás e pra esquerda.
 */

const OCEAN_DEEP = '#16406e'
const OCEAN = '#2a6fae'
const LAND = '#5b8f4e'
const SAND = '#b89a62'
const ATMOS = '#9fd0ff'
const SKY_TOP = '#0b1530'
const SKY_LOW = '#1d2b5e'
const CLOUD = '#f3f6fa'
const SUIT = '#eceef2'
const SUIT_SHADE = '#c9ced6'
const TRIM = '#8d96a1'
const PATCH = '#2f5ea8'
const SKIN = '#e8c39e'
const SILVER = '#b9c0c8'
const CHAR = '#3a2c27'
const VISOR = '#c9a24a'
const RADIO = '#24262b'
const FLAME_RED = '#e0391b'
const FLAME_OR = '#ff8a1e'
const FLAME_CORE = '#ffd350'
const EMBER = '#ff5a12' // acento saturado RESERVADO: o escudo em BRASA

const GY = 0.18 // topo da Terra (base)
const S = new THREE.Vector3(0.05, 0.62, 0.2) // centro do escudo
const SHIELD_TILT_X = 0.1
const SHIELD_TILT_Z = -0.12
const ASTRO_Y = S.y + 0.09
// rastro da reentrada: de onde veio (atrás, acima e à esquerda)
const TRAIL = new THREE.Vector3(-0.62, 0.56, -0.56).normalize()
// vetor lateral do rastro (aponta pra +x/-z); a cápsula fica deslocada pra
// esquerda-frente para não sumir atrás das chamas, e vista de lado
const TRAIL_SIDE = new THREE.Vector3().crossVectors(TRAIL, new THREE.Vector3(0, 1, 0)).normalize()
const CAPSULE_POS = S.clone().addScaledVector(TRAIL, 2.0).addScaledVector(TRAIL_SIDE, -0.55)
const CAPSULE_DIR = TRAIL.clone().addScaledVector(TRAIL_SIDE, -0.6).normalize()

// poses dos braços (pivô no ombro via shoulderPivot; z+ gira a mão pra +x)
const ARM_L_DOWN = { x: 0, z: -0.35 }
const ARM_L_RADIO = { x: -0.3, z: -2.95 }
const ARM_R_DOWN = { x: 0, z: 0.35 }
const ARM_R_TAP = { x: 0, z: 2.95 }
const ARM_R_POINT = { x: -1.55, z: 0.34 }

/** Casca esférica aberta: polo em +z; thetaStart > 0 deixa um furo na frente. */
function shell(r: number, thetaStart: number, thetaLen: number, color: string, opts: Parameters<typeof mat>[1] = {}) {
  const geo = new THREE.SphereGeometry(r, 48, 32, 0, Math.PI * 2, thetaStart, thetaLen)
  geo.rotateX(Math.PI / 2)
  const m = mat(color, { ...opts, size: r * 2 })
  m.side = THREE.DoubleSide
  const mesh = new THREE.Mesh(geo, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Orienta um objeto para que seu +y local aponte na direção dada. */
function alongDir(obj: THREE.Object3D, dir: THREE.Vector3) {
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

function emissive(color: string, intensity = 0.9) {
  return { roughness: 0.6, emissive: color, emissiveIntensity: intensity }
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(47)

  // ---- a Terra lá embaixo ---------------------------------------------------
  const base = new THREE.Group()

  const deep = cylinder(2.62, 2.72, 0.12, OCEAN_DEEP, { roughness: 0.5 })
  deep.position.y = 0.06
  base.add(deep)

  const ocean = cylinder(2.55, 2.62, 0.06, OCEAN, { roughness: 0.35 })
  ocean.position.y = 0.15
  base.add(ocean)

  // halo da atmosfera na borda
  const halo = torus(2.6, 0.045, ATMOS, { roughness: 0.4 })
  halo.rotation.x = Math.PI / 2
  halo.position.y = GY
  base.add(halo)

  // continentes: placas achatadas e irregulares
  const lands: [number, number, number, number, string][] = [
    [-1.55, -0.35, 0.55, 3, LAND],
    [-1.2, 0.35, 0.38, 5, LAND],
    [1.45, 0.75, 0.5, 7, LAND],
    [1.75, 0.15, 0.3, 9, SAND],
    [0.6, -1.65, 0.42, 11, LAND],
    [-0.4, 1.7, 0.3, 13, SAND],
  ]
  for (const [lx, lz, lr, seed, color] of lands) {
    const land = puff(lr, color, 5, seed, { roughness: 0.85 })
    land.position.set(lx, GY - 0.02, lz)
    land.scale.y = 0.12
    land.rotation.y = rand() * Math.PI
    base.add(land)
  }
  root.add(base)

  // ---- céu azul-escuro de fundo (painel curvo estrelado) --------------------
  const ceu = new THREE.Group()
  const SKY_R = 2.7
  for (const [y0, h, color] of [[GY, 1.2, SKY_LOW], [GY + 1.2, 2.3, SKY_TOP]] as const) {
    const geo = new THREE.CylinderGeometry(SKY_R, SKY_R, h, 64, 1, true, Math.PI * 0.42, Math.PI * 1.16)
    const m = mat(color, { roughness: 0.95, detail: 0.3 })
    m.side = THREE.DoubleSide
    const wall = new THREE.Mesh(geo, m)
    wall.position.y = y0 + h / 2
    wall.receiveShadow = true
    ceu.add(wall)
  }
  // estrelas: pontinhos de luz espalhados na parte de cima
  for (let i = 0; i < 46; i++) {
    const a = Math.PI * (0.45 + rand() * 1.1)
    const y = GY + 1.35 + rand() * 2.0
    const star = sphere(0.012 + rand() * 0.018, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 1.2 }, 8)
    star.position.set(Math.sin(a) * (SKY_R - 0.03), y, Math.cos(a) * (SKY_R - 0.03))
    ceu.add(star)
  }
  root.add(ceu)

  // ---- duas nuvens lá embaixo ---------------------------------------------
  const nuvens = new THREE.Group()
  for (const [nx, ny, nz, r, seed] of [[-1.45, GY + 0.22, 0.95, 0.34, 21], [1.5, GY + 0.26, -0.35, 0.4, 27]] as const) {
    const n = puff(r, CLOUD, 7, seed, { roughness: 0.95 })
    n.position.set(nx, ny, nz)
    n.scale.set(1.7, 0.6, 1.0)
    nuvens.add(n)
  }
  root.add(nuvens)

  // ---- escudo térmico em brasa: a prancha ----------------------------------
  const escudo = new THREE.Group()
  escudo.position.copy(S)
  escudo.rotation.set(SHIELD_TILT_X, 0, SHIELD_TILT_Z)

  const dish = lathe(
    [[0, -0.13], [0.3, -0.115], [0.52, -0.07], [0.66, -0.01], [0.7, 0.03], [0.68, 0.07], [0, 0.07]],
    EMBER,
    { roughness: 0.5, emissive: EMBER, emissiveIntensity: 0.75 },
    56,
  )
  escudo.add(dish)
  // tampo chamuscado onde ele pisa, com rachaduras em brasa
  const deck = cylinder(0.5, 0.52, 0.03, CHAR, { roughness: 0.9 })
  deck.position.y = 0.08
  escudo.add(deck)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rand() * 0.4
    const crack = rbox(0.2 + rand() * 0.1, 0.012, 0.022, 0.006, FLAME_CORE, emissive(FLAME_OR, 1.1))
    crack.position.set(Math.cos(a) * 0.3, 0.097, Math.sin(a) * 0.3)
    crack.rotation.y = -a + (rand() - 0.5) * 0.6
    escudo.add(crack)
  }
  // anel de rebites prateados na borda
  const ring = torus(0.665, 0.022, SILVER, { roughness: 0.3, metalness: 0.75 })
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.065
  escudo.add(ring)
  root.add(escudo)

  // ---- cápsula cônica prateada logo atrás ----------------------------------
  const capsula = new THREE.Group()
  capsula.position.copy(CAPSULE_POS)
  alongDir(capsula, CAPSULE_DIR)
  capsula.scale.setScalar(0.78)

  const hull = lathe(
    [[0, 0], [0.42, 0.0], [0.44, 0.05], [0.4, 0.12], [0.2, 0.55], [0.15, 0.6], [0.15, 0.68], [0.09, 0.74], [0, 0.75]],
    SILVER,
    { roughness: 0.3, metalness: 0.7 },
  )
  capsula.add(hull)
  // fundo chamuscado da cápsula (o escudo dela virou prancha)
  const hot = cylinder(0.4, 0.42, 0.04, '#7a6e66', { roughness: 0.75 })
  hot.position.y = -0.01
  capsula.add(hot)
  // janelinha e escotilha
  const port = torus(0.075, 0.02, TRIM, { roughness: 0.3, metalness: 0.7 })
  port.position.set(0, 0.3, 0.33)
  port.rotation.x = -0.43
  capsula.add(port)
  const glass = sphere(0.07, '#1b2c4a', { roughness: 0.15 })
  glass.position.set(0, 0.3, 0.315)
  glass.scale.z = 0.4
  glass.rotation.x = -0.43
  capsula.add(glass)
  for (let i = 0; i < 4; i++) {
    const seam = torus(0.3 - i * 0.04, 0.008, TRIM, { roughness: 0.35, metalness: 0.7 })
    seam.rotation.x = Math.PI / 2
    seam.position.y = 0.16 + i * 0.1
    seam.scale.setScalar(1 + (i === 0 ? 0.12 : 0))
    capsula.add(seam)
  }
  root.add(capsula)

  // ---- rastro de chamas: sai do escudo e sobe pra trás ---------------------
  const chamas = new THREE.Group()
  chamas.position.copy(S)
  const side = new THREE.Vector3().crossVectors(TRAIL, new THREE.Vector3(0, 1, 0)).normalize()
  const up2 = new THREE.Vector3().crossVectors(side, TRAIL).normalize()
  // línguas de fogo saindo da borda de trás do escudo: [ângulo na borda, comprimento, raio, cor, brilho]
  const tongues: [number, number, number, string, number][] = [
    [0, 2.0, 0.36, FLAME_RED, 0.45],
    [0.75, 1.6, 0.3, FLAME_RED, 0.45],
    [-0.75, 1.65, 0.3, FLAME_RED, 0.45],
    [1.45, 1.1, 0.24, FLAME_OR, 0.5],
    [-1.45, 1.15, 0.24, FLAME_OR, 0.5],
    [0.38, 1.35, 0.26, FLAME_OR, 0.55],
    [-0.4, 1.3, 0.26, FLAME_OR, 0.55],
    [0.1, 0.95, 0.2, FLAME_CORE, 0.6],
    [-0.2, 0.8, 0.17, FLAME_CORE, 0.6],
  ]
  for (const [ang, len, r, color, k] of tongues) {
    // ponto na borda de trás do escudo (no plano lateral x "acima" do rastro)
    const rimPt = side.clone().multiplyScalar(Math.sin(ang) * 0.5)
      .addScaledVector(up2, (Math.cos(ang) - 0.6) * 0.32)
    const dir = TRAIL.clone().addScaledVector(side, Math.sin(ang) * 0.22)
      .addScaledVector(up2, Math.cos(ang) * 0.12).normalize()
    const flame = lathe(
      [[0, 0], [r * 0.75, len * 0.04], [r, len * 0.15], [r * 0.9, len * 0.34], [r * 0.55, len * 0.6],
        [r * 0.22, len * 0.84], [0, len]],
      color,
      emissive(color, k),
      28,
    )
    alongDir(flame, dir)
    flame.position.copy(rimPt).addScaledVector(TRAIL, 0.22)
    chamas.add(flame)
  }
  // fagulhas
  for (let i = 0; i < 12; i++) {
    const d = 0.6 + rand() * 1.6
    const spark = sphere(0.025 + rand() * 0.025, FLAME_CORE, emissive(FLAME_CORE, 1.3), 10)
    spark.position.copy(TRAIL.clone().multiplyScalar(d))
      .addScaledVector(side, (rand() - 0.5) * 1.1)
      .addScaledVector(up2, (rand() - 0.3) * 0.8)
    chamas.add(spark)
  }
  root.add(chamas)

  // ---- astronauta em pé sobre o escudo -------------------------------------
  const astronauta = person({ body: SUIT, skin: SKIN, height: 1.5, armAngle: 0.35 })
  astronauta.position.set(S.x, ASTRO_Y, S.z)
  astronauta.rotation.set(SHIELD_TILT_X * 0.6, 0.08, SHIELD_TILT_Z * 0.7)
  astronauta.scale.setScalar(1.12)

  // detalhes do traje: cinto, painel de controle no peito, emblema azul
  const belt = torus(0.262, 0.03, TRIM, { roughness: 0.5 })
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.28
  astronauta.add(belt)
  const chest = rbox(0.24, 0.15, 0.06, 0.02, SUIT_SHADE, { roughness: 0.5 })
  chest.position.set(0, 0.48, 0.24)
  chest.rotation.x = -0.12
  astronauta.add(chest)
  for (const [bx, color] of [[-0.07, '#d8443a'], [0, '#3fa45a'], [0.07, PATCH]] as const) {
    const btn = cylinder(0.022, 0.022, 0.02, color, { roughness: 0.4 }, 16)
    btn.rotation.x = Math.PI / 2 - 0.12
    btn.position.set(bx, 0.5, 0.275)
    astronauta.add(btn)
  }
  const patch = cylinder(0.05, 0.05, 0.015, PATCH, { roughness: 0.6 }, 24)
  patch.rotation.set(Math.PI / 2, 0, 0)
  patch.position.set(-0.13, 0.6, 0.2)
  patch.rotation.y = -0.5
  astronauta.add(patch)
  // botas
  for (const bx of [-0.11, 0.11]) {
    const boot = rbox(0.15, 0.08, 0.22, 0.035, TRIM, { roughness: 0.6 })
    boot.position.set(bx, 0.04, 0.05)
    astronauta.add(boot)
  }

  const head = astronauta.getObjectByName('head') as THREE.Group
  // sorriso tranquilo
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.017, 8, 20, Math.PI),
    mat('#6b2e26', { roughness: 0.6 }),
  )
  smile.rotation.z = Math.PI
  smile.position.set(0, -0.07, 0.262)
  head.add(smile)
  for (const sx of [-1, 1]) {
    const brow = rbox(0.08, 0.018, 0.02, 0.008, '#6b4a2e', { roughness: 0.7 })
    brow.position.set(sx * 0.105, 0.135, 0.255)
    brow.rotation.z = sx * -0.15
    head.add(brow)
  }

  // ---- mochila de oxigênio ---------------------------------------------------
  const mochila = new THREE.Group()
  mochila.position.set(0, 0.5, -0.3)
  const pack = rbox(0.42, 0.5, 0.2, 0.06, TRIM, { roughness: 0.55 })
  mochila.add(pack)
  for (const tx of [-0.12, 0.12]) {
    const tank = capsule(0.07, 0.28, SUIT_SHADE, { roughness: 0.4, metalness: 0.3 })
    tank.position.set(tx, 0.02, -0.12)
    mochila.add(tank)
  }
  const hose = torus(0.14, 0.022, '#5c636c', { roughness: 0.6 })
  hose.position.set(0.2, 0.2, 0.06)
  hose.rotation.y = Math.PI / 2
  mochila.add(hose)
  astronauta.add(mochila)

  // ---- capacete branco com viseira dourada levantada -----------------------
  const capacete = new THREE.Group()
  capacete.position.set(0, 0.02, -0.01)
  const HR = 0.4
  const OPEN = 0.82
  const dome = shell(HR, OPEN, Math.PI - OPEN, SUIT, { roughness: 0.3 })
  capacete.add(dome)
  const rim = torus(HR * Math.sin(OPEN), 0.035, SUIT_SHADE, { roughness: 0.35 })
  rim.position.z = HR * Math.cos(OPEN)
  capacete.add(rim)
  const neck = torus(0.24, 0.045, TRIM, { roughness: 0.4, metalness: 0.4 })
  neck.rotation.x = Math.PI / 2
  neck.position.y = -0.34
  capacete.add(neck)
  const visor = shell(HR * 1.04, 0, OPEN + 0.12, VISOR, { roughness: 0.2, metalness: 0.85 })
  visor.rotation.x = -1.0
  capacete.add(visor)
  // luzinhas laterais do capacete
  for (const sx of [-1, 1]) {
    const lamp = cylinder(0.05, 0.05, 0.06, SUIT_SHADE, { roughness: 0.4 }, 20)
    lamp.rotation.z = Math.PI / 2
    lamp.position.set(sx * HR * 0.97, 0.06, 0)
    capacete.add(lamp)
  }
  head.add(capacete)

  // ---- braço do rádio (esquerdo) e o rádio ---------------------------------
  const bracoL = astronauta.getObjectByName('armL') as THREE.Object3D
  shoulderPivot(bracoL, 1.5)
  bracoL.rotation.set(ARM_L_RADIO.x, 0, ARM_L_RADIO.z)
  const handL = bracoL.children[0]

  const radio = new THREE.Group()
  radio.position.set(0, -0.06, 0.02)
  radio.rotation.set(0, 0, Math.PI - 0.35)
  const radioBody = rbox(0.12, 0.24, 0.07, 0.025, RADIO, { roughness: 0.45 })
  radio.add(radioBody)
  const grill = rbox(0.08, 0.08, 0.012, 0.006, '#4a4e57', { roughness: 0.6 })
  grill.position.set(0, 0.04, 0.038)
  radio.add(grill)
  const led = sphere(0.014, '#5df07a', { emissive: '#5df07a', emissiveIntensity: 1.0 }, 10)
  led.position.set(0.035, -0.07, 0.038)
  radio.add(led)
  const antenna = cylinder(0.01, 0.014, 0.26, '#15161a', { roughness: 0.4 }, 12)
  antenna.position.set(-0.035, 0.24, 0)
  radio.add(antenna)
  const tip = sphere(0.02, '#15161a', { roughness: 0.4 }, 12)
  tip.position.set(-0.035, 0.37, 0)
  radio.add(tip)
  handL.add(radio)

  // ---- braço que aponta pra você (direito) ---------------------------------
  const bracoR = astronauta.getObjectByName('armR') as THREE.Object3D
  shoulderPivot(bracoR, 1.5)
  bracoR.rotation.set(ARM_R_POINT.x, 0, ARM_R_POINT.z)
  const handR = bracoR.children[0]
  const finger = capsule(0.036, 0.1, SKIN, { roughness: 0.6 })
  finger.position.set(0, -0.13, 0.0)
  handR.add(finger)

  root.add(astronauta)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'ceu', object: base },
    { name: 'ceu', group: 'ceu', object: ceu },
    { name: 'nuvens', group: 'ceu', object: nuvens },
    { name: 'escudo', group: 'reentrada', object: escudo },
    { name: 'capsula', group: 'reentrada', object: capsula },
    { name: 'chamas', group: 'reentrada', object: chamas },
    { name: 'astronauta', group: 'astronauta', object: astronauta },
    { name: 'mochila', group: 'astronauta', object: mochila },
    { name: 'capacete', group: 'astronauta', object: capacete },
    { name: 'bracoL', group: 'radio', object: bracoL },
    { name: 'radio', group: 'radio', object: radio },
    { name: 'bracoR', group: 'aponta', object: bracoR },
  ]

  // ---- montagem ------------------------------------------------------------
  const from = S.clone().addScaledVector(TRAIL, 2.6)
  const capFrom = CAPSULE_POS.clone().addScaledVector(TRAIL, 2.2)
  const scale3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Lá embaixo, a Terra; em volta, o céu escuro da reentrada…',
    }),
    seq('ceu-rise', 'ceu', 0.2, 0.9, [riseFrom(0, 3.6)], { ease: 'easeOut' }),
    seq('nuvens-in', 'nuvens', 0.6, 0.7, [...scale3(0.01, 1)], { ease: 'easeOut' }),

    seq('escudo-desce', 'escudo', 1.5, 1.0, [
      ch('position.x', from.x, S.x), ch('position.y', from.y, S.y), ch('position.z', from.z, S.z),
      ch('rotation.y', -2.4, 0),
    ], {
      ease: 'easeOut',
      caption: 'Um astronauta volta pra Terra SURFANDO o escudo térmico — tudo em BRASA!',
    }),
    seq('capsula-desce', 'capsula', 1.7, 1.0, [
      ch('position.x', capFrom.x, CAPSULE_POS.x), ch('position.y', capFrom.y, CAPSULE_POS.y),
      ch('position.z', capFrom.z, CAPSULE_POS.z),
    ], { ease: 'easeOut' }),
    seq('chamas-acendem', 'chamas', 2.2, 0.8, [...scale3(0.01, 1)], { ease: 'easeOut' }),

    seq('astronauta-pousa', 'astronauta', 3.2, 0.7, [ch('position.y', ASTRO_Y + 1.4, ASTRO_Y)], {
      ease: 'easeIn',
      caption: 'No rádio, a esposa pergunta desesperada como ele está…',
    }),
    seq('mochila-in', 'mochila', 3.5, 0.5, [...scale3(0.01, 1)], { ease: 'easeOut' }),
    seq('capacete-poe', 'capacete', 3.7, 0.6, [ch('position.y', 0.6, 0.02), ...scale3(0.3, 1)], { ease: 'easeOut' }),
    seq('bracoR-desce', 'bracoR', 3.2, 0.5, [ch('rotation.x', ARM_R_DOWN.x, ARM_R_DOWN.x), ch('rotation.z', ARM_R_DOWN.z, ARM_R_DOWN.z)]),

    seq('bracoL-sobe', 'bracoL', 4.6, 0.7, [
      ch('rotation.x', ARM_L_DOWN.x, ARM_L_RADIO.x), ch('rotation.z', ARM_L_DOWN.z, ARM_L_RADIO.z),
    ], {
      ease: 'easeOut',
      caption: 'Ele pega o rádio, de boa: IÁ, MÔR! — "sim, amor!"',
    }),
    seq('radio-in', 'radio', 4.5, 0.4, [...scale3(0.01, 1)], { ease: 'easeOut' }),

    seq('chamas-aviva', 'chamas', 6.1, 0.5, [...scale3(1, 1.18)], {
      ease: 'easeOut',
      caption: 'BRÁ-sa por fora… mas eu tô BRÁ!',
    }),
    seq('chamas-volta', 'chamas', 6.6, 0.6, [...scale3(1.18, 1)]),
    seq('escudo-balanca', 'escudo', 6.1, 0.55, [ch('rotation.z', SHIELD_TILT_Z, SHIELD_TILT_Z - 0.06)]),
    seq('escudo-assenta', 'escudo', 6.65, 0.55, [ch('rotation.z', SHIELD_TILT_Z - 0.06, SHIELD_TILT_Z)]),

    seq('bracoR-tap', 'bracoR', 7.7, 0.55, [
      ch('rotation.x', ARM_R_DOWN.x, ARM_R_TAP.x), ch('rotation.z', ARM_R_DOWN.z, ARM_R_TAP.z),
    ], {
      ease: 'easeIn',
      caption: '…e dá um TAC! no capacete: tá inteirinho.',
    }),
    seq('capacete-tac', 'capacete', 8.2, 0.15, [ch('position.y', 0.02, -0.03)], { ease: 'easeOut' }),
    seq('capacete-volta', 'capacete', 8.35, 0.3, [ch('position.y', -0.03, 0.02)], { ease: 'easeOut' }),

    seq('bracoR-aponta', 'bracoR', 9.3, 0.7, [
      ch('rotation.x', ARM_R_TAP.x, ARM_R_POINT.x), ch('rotation.z', ARM_R_TAP.z, ARM_R_POINT.z),
    ], {
      ease: 'easeOut',
      caption: 'Aí aponta direto pra você: Ó, DÜ? — e você, tá bem?',
    }),
    seq('astronauta-inclina', 'astronauta', 9.3, 0.7, [ch('rotation.x', 0, SHIELD_TILT_X * 0.6)], { ease: 'easeOut' }),

    seq('chamas-pulsa', 'chamas', 10.9, 0.45, [...scale3(1, 1.1)], {
      ease: 'easeOut',
      caption: 'Jag mår bra, tack. Och du? — Estou bem, obrigado. E você?',
    }),
    seq('chamas-assenta', 'chamas', 11.35, 0.6, [...scale3(1.1, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 2.15, 4.35], target: [-0.05, 1.32, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-mar-bra-tack-och-du',
    contexto: "Cumprimento: respondendo 'Hur mår du?' de colega, vizinho ou amigo — e devolvendo a pergunta.",
    fraseFonte: 'Estou bem, obrigado. E você?',
    fraseAlvo: 'Jag mår bra, tack. Och du?',
    pronuncia:
      "iá môr BRÁ, TAK. ó DÜ? ('jag' = iá, o -g não soa; 'mår' com Ô FECHADO; 'och' na fala é só Ó aberto, sem o K; 'du' com bico de pato)",
    ponteSonora:
      "IÁ, MÔR! BRÁ... TAC! Ó, DÜ? (6 sílabas, tônicas em MÔR, BRÁ, TAC e DÜ; IÁ é o 'jag' de sempre, I de ioga — nunca o J chiado de 'já'; MÔR = o 'mor' de 'amor', o MESMO MÔR de RUMOR na carta 'Hur mår du?', com Ô FECHADO e R final BRANDO à caipira, AUDÍVEL antes do BRÁ — se cair, sobra 'må', outro verbo; se fechar em U vira 'mor' (mãe); BRÁ = o BRÁ de BRASA, R brando e A longo, o mesmo 'bra' de 'låter bra'; TAC = o tapa do 'tack' de sempre; Ó aberto e curto é o 'och' da fala, sem K; DÜ com bico de pato)",
    historia:
      'O astronauta volta pra Terra em pé em cima do escudo térmico da cápsula, surfando a reentrada, com tudo em volta pegando fogo, em BRASA. No rádio, a esposa pergunta desesperada como ele está. Ele responde de boa: IÁ, MÔR! BRÁ-sa por fora, mas eu tô BRÁ! — e dá um TAC! no próprio capacete pra mostrar que está inteirinho. Aí aponta lá pra baixo, direto pra você: Ó, DÜ? — e você, tá bem?',
  },
  createScene,
}

export default card
