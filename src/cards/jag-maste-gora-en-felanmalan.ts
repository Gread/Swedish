import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Jag måste göra en felanmälan." — o corredor alagou: você tem que MOSTRAR
 * (MÔS-TE, sem o R) a poça para IÔRA, a coruja-zeladora empoleirada no cano.
 * Ela ergue a chave inglesa e bate duas vezes: FÊ-LAN! MÉ-LAN! — e o papel do
 * chamado sai da parede já carimbado.
 *
 * Diorama: piso de corredor com poça azul, pia de louça jorrando em arco,
 * cano cinza atravessando a cena com braçadeiras, coruja marrom-tabaco de
 * sobrancelhas bravas e molho de chaves, chave inglesa azul-aço (o acento),
 * dois pares de anéis brancos no cano e o chamado saindo do nicho da parede.
 */

const CONCRETE = '#4d565f'
const TILE = '#79848f'
const WALL = '#ded5c3'
const CERAMIC = '#f2efe8'
const WATER = '#8fd0e6'
const TOBACCO = '#8a5a32'
const TOBACCO_L = '#b3803f'
const FACE = '#d9bd90'
const BEAK = '#d9963c'
const BRASS = '#c8922e'
const STEEL = '#6d7883'
const ACCENT = '#2f7ec9' // reservado: a CHAVE INGLESA que bate FÊ-LAN / MÉ-LAN
const ACCENT_DARK = '#1f5a91'

const GY = 0.2 // topo do piso do diorama
const PIPE_Y = 1.55 // eixo do cano
const PIPE_Z = -1.0
const PIPE_R = 0.13
const PERCH = PIPE_Y + PIPE_R // 1.68 — topo do cano, onde a coruja pousa

// pivô da chave (a garra da coruja), e a geometria que decide onde ela bate
const CH_X = 0.94
const CH_Y = 2.12
const CH_Z = -0.6
const CH_ARM = 1.0 // distância do pivô ao centro do bloco da chave
const CH_HIT = Math.acos((CH_Y - 1.72) / CH_ARM) // ângulo em que o bloco toca o cano
const HIT_L = CH_X - CH_ARM * Math.sin(CH_HIT) // FÊ-LAN, à esquerda
const HIT_R = CH_X + CH_ARM * Math.sin(CH_HIT) // MÉ-LAN, à direita

// poses da chave (rotation.z). A segunda batida cruza POR CIMA (valor < -PI)
// para o cabo não varar o cano no meio do caminho.
const CH_UP = -2.2
const CH_STRIKE_L = -CH_HIT
const CH_UP2 = -2.05
const CH_STRIKE_R = -2 * Math.PI + CH_HIT

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: piso do corredor + poça + adereços ----------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.6, 2.68, 0.16, CONCRETE, { roughness: 0.95 })
  slab.position.y = 0.08
  base.add(slab)

  const tiles = cylinder(2.54, 2.58, 0.04, TILE, { roughness: 0.5 })
  tiles.position.y = 0.18
  base.add(tiles)

  // rejunte: fitas finas cruzando o piso
  for (const gx of [-1.4, -0.2, 1.0, 2.0]) {
    const grout = rbox(0.035, 0.012, 4.6, 0.005, '#3f4952', { roughness: 0.9 })
    grout.position.set(gx, GY - 0.004, 0)
    base.add(grout)
  }
  for (const gz of [-0.9, 0.4, 1.5]) {
    const grout = rbox(4.6, 0.012, 0.035, 0.005, '#3f4952', { roughness: 0.9 })
    grout.position.set(0, GY - 0.004, gz)
    base.add(grout)
  }

  // a POÇA: lâminas de água envidraçadas, quase sem rugosidade
  const puddle: [number, number, number][] = [
    [-0.7, 0.15, 0.52],
    [-1.05, -0.02, 0.36],
    [-0.34, 0.34, 0.33],
    [-0.78, 0.55, 0.26],
    [-1.28, 0.36, 0.2],
  ]
  for (const [px, pz, pr] of puddle) {
    const pool = cylinder(pr, pr * 0.94, 0.022, WATER, { roughness: 0.06 })
    pool.position.set(px, GY + 0.011, pz)
    base.add(pool)
  }
  for (let i = 0; i < 2; i++) {
    const ripple = torus(0.22 + i * 0.14, 0.012, '#c8ebf6', { roughness: 0.08 })
    ripple.rotation.x = Math.PI / 2
    ripple.position.set(-0.7 + (rand() - 0.5) * 0.2, GY + 0.026, 0.15 + (rand() - 0.5) * 0.2)
    base.add(ripple)
  }
  for (let i = 0; i < 3; i++) {
    const drop = sphere(0.035 + rand() * 0.025, WATER, { roughness: 0.06 })
    drop.scale.y = 0.5
    drop.position.set(-0.2 + rand() * 1.1, GY + 0.02, 0.55 + rand() * 0.7)
    base.add(drop)
  }

  // ralo do corredor
  const drainRing = torus(0.11, 0.022, '#41505c', { roughness: 0.6, metalness: 0.55 })
  drainRing.rotation.x = Math.PI / 2
  drainRing.position.set(0.45, GY + 0.012, 1.05)
  base.add(drainRing)
  const drainHole = cylinder(0.095, 0.095, 0.02, '#20272e', { roughness: 0.9 })
  drainHole.position.set(0.45, GY + 0.005, 1.05)
  base.add(drainHole)

  // balde do zelador
  const bucket = lathe(
    [[0, 0], [0.17, 0], [0.19, 0.05], [0.225, 0.28], [0.205, 0.28], [0.175, 0.06], [0, 0.04]],
    '#4d5964',
    { roughness: 0.4 },
  )
  bucket.position.set(1.92, GY, 0.82)
  bucket.rotation.y = rand() * Math.PI
  base.add(bucket)
  const bail = torus(0.19, 0.014, STEEL, { roughness: 0.3, metalness: 0.8 })
  bail.position.set(1.92, GY + 0.26, 0.82)
  bail.rotation.y = 0.4
  base.add(bail)

  // esfregão encostado
  const mop = new THREE.Group()
  mop.position.set(-2.08, GY, -0.5)
  mop.rotation.set(-0.1, 0, 0.24)
  const stick = cylinder(0.022, 0.026, 0.95, '#8a6a42', { roughness: 0.75 })
  stick.position.y = 0.55
  mop.add(stick)
  const mopHead = puff(0.13, '#c9c2b0', 5, 31, { roughness: 0.92 })
  mopHead.position.y = 0.09
  mopHead.scale.y = 0.8
  mop.add(mopHead)
  base.add(mop)

  // lascas de concreto soltas
  for (const [rx, rz, rr, rs] of [[1.45, 1.6, 0.11, 41], [-1.9, 1.05, 0.08, 42]] as const) {
    const chunk = rock(rr, '#5b6570', rs, { roughness: 0.95 })
    chunk.position.set(rx, GY + rr * 0.5, rz)
    chunk.rotation.y = rand() * Math.PI
    base.add(chunk)
  }
  root.add(base)

  // ---- parede do corredor, com o nicho do chamado --------------------------
  const parede = new THREE.Group()
  parede.position.set(0, GY, -1.5)

  const wallSlab = rbox(4.2, 2.5, 0.16, 0.05, WALL, { roughness: 0.88 })
  wallSlab.position.y = 1.25
  parede.add(wallSlab)

  const skirting = rbox(4.22, 0.16, 0.2, 0.03, '#b7ab95', { roughness: 0.8 })
  skirting.position.y = 0.08
  parede.add(skirting)

  // nicho de onde sai o papel
  const niche = rbox(0.52, 0.66, 0.04, 0.02, '#33383d', { roughness: 0.9 })
  niche.position.set(0.55, 0.85, 0.081)
  parede.add(niche)
  const nicheLip = rbox(0.6, 0.05, 0.06, 0.02, '#c4b9a3', { roughness: 0.8 })
  nicheLip.position.set(0.55, 0.5, 0.1)
  parede.add(nicheLip)

  // placa de aviso do prédio, para a parede não ficar vazia
  const sign = rbox(0.4, 0.28, 0.03, 0.015, '#9fb0bd', { roughness: 0.45 })
  sign.position.set(-1.5, 1.65, 0.09)
  parede.add(sign)
  for (let i = 0; i < 3; i++) {
    const line = rbox(0.26, 0.028, 0.012, 0.006, '#4a5560', { roughness: 0.5 })
    line.position.set(-1.5, 1.72 - i * 0.07, 0.105)
    parede.add(line)
  }
  root.add(parede)

  // ---- a pia que virou chafariz --------------------------------------------
  const pia = new THREE.Group()
  pia.position.set(-1.55, GY, -0.55)
  pia.rotation.y = 0.45

  const pedestal = lathe(
    [[0, 0], [0.24, 0], [0.22, 0.08], [0.14, 0.3], [0.13, 0.62], [0.17, 0.76], [0.24, 0.8], [0, 0.8]],
    CERAMIC,
    { roughness: 0.15 },
  )
  pia.add(pedestal)

  const basin = lathe(
    [
      [0, 0.78], [0.18, 0.78], [0.32, 0.84], [0.4, 0.98], [0.42, 1.05],
      [0.35, 1.05], [0.34, 0.98], [0.27, 0.88], [0.1, 0.86], [0, 0.86],
    ],
    CERAMIC,
    { roughness: 0.15 },
  )
  pia.add(basin)

  // torneira curvada de metal
  const faucetCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.0, -0.26),
    new THREE.Vector3(0, 1.34, -0.26),
    new THREE.Vector3(0, 1.46, -0.14),
    new THREE.Vector3(0, 1.43, 0.02),
    new THREE.Vector3(0, 1.3, 0.06),
  ])
  const faucet = new THREE.Mesh(
    new THREE.TubeGeometry(faucetCurve, 40, 0.036, 14, false),
    mat(STEEL, { roughness: 0.2, metalness: 0.9, size: 0.5 }),
  )
  faucet.castShadow = true
  faucet.receiveShadow = true
  pia.add(faucet)

  const faucetBase = cylinder(0.075, 0.085, 0.08, STEEL, { roughness: 0.2, metalness: 0.9 })
  faucetBase.position.set(0, 1.0, -0.26)
  pia.add(faucetBase)
  for (const side of [-1, 1]) {
    const knob = cylinder(0.05, 0.06, 0.05, STEEL, { roughness: 0.2, metalness: 0.9 })
    knob.position.set(side * 0.22, 1.0, -0.2)
    pia.add(knob)
    const cap = sphere(0.035, ACCENT_DARK, { roughness: 0.3 })
    cap.position.set(side * 0.22, 1.04, -0.2)
    pia.add(cap)
  }
  root.add(pia)

  // ---- o jato em arco (cresce da ponta da torneira) -------------------------
  // ponta da torneira em coordenadas do root, já com a rotação da pia
  const tipLocal = new THREE.Vector3(0, 1.3, 0.06).applyEuler(pia.rotation).add(pia.position)
  const jato = new THREE.Group()
  jato.position.copy(tipLocal)

  const jetCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.21, -0.05, 0.16),
    new THREE.Vector3(0.44, -0.35, 0.34),
    new THREE.Vector3(0.65, -0.79, 0.5),
    new THREE.Vector3(0.83, -1.29, 0.65),
  ])
  const jet = new THREE.Mesh(
    new THREE.TubeGeometry(jetCurve, 60, 0.05, 12, false),
    mat(WATER, { roughness: 0.06, size: 1.6 }),
  )
  jet.castShadow = true
  jet.receiveShadow = true
  jato.add(jet)

  for (let i = 0; i < 5; i++) {
    const splash = sphere(0.032 + rand() * 0.03, '#c8ebf6', { roughness: 0.06 })
    splash.position.set(
      0.78 + (rand() - 0.5) * 0.36,
      -1.24 + rand() * 0.22,
      0.62 + (rand() - 0.5) * 0.32,
    )
    jato.add(splash)
  }
  root.add(jato)

  // ---- o CANO que atravessa a cena -----------------------------------------
  const cano = new THREE.Group()
  cano.position.set(0, 0, PIPE_Z)

  const pipe = cylinder(PIPE_R, PIPE_R, 4.7, STEEL, { roughness: 0.55, metalness: 0.35 })
  pipe.rotation.z = Math.PI / 2
  pipe.position.y = PIPE_Y
  cano.add(pipe)

  // cotovelo + prumada subindo para o teto
  const elbow = sphere(PIPE_R * 1.16, STEEL, { roughness: 0.55, metalness: 0.35 })
  elbow.position.set(-2.2, PIPE_Y, 0)
  cano.add(elbow)
  const riser = cylinder(PIPE_R, PIPE_R, 0.9, STEEL, { roughness: 0.55, metalness: 0.35 })
  riser.position.set(-2.2, PIPE_Y + 0.45, 0)
  cano.add(riser)

  // flanges e braçadeiras presas na parede
  for (const bx of [-1.65, 0.95, 2.05]) {
    const clamp = torus(PIPE_R + 0.045, 0.045, '#3f4952', { roughness: 0.5, metalness: 0.5 })
    clamp.rotation.y = Math.PI / 2
    clamp.position.set(bx, PIPE_Y, 0)
    cano.add(clamp)

    const strut = rbox(0.085, 0.085, 0.52, 0.02, '#3f4952', { roughness: 0.6, metalness: 0.4 })
    strut.position.set(bx, PIPE_Y, -0.28)
    cano.add(strut)
  }
  for (const fx of [-0.75, 1.55]) {
    const flange = cylinder(PIPE_R + 0.05, PIPE_R + 0.05, 0.07, '#5b6570', { roughness: 0.5, metalness: 0.4 })
    flange.rotation.z = Math.PI / 2
    flange.position.set(fx, PIPE_Y, 0)
    cano.add(flange)
  }
  root.add(cano)

  // ---- IÔRA, a coruja-zeladora ---------------------------------------------
  const coruja = new THREE.Group()
  coruja.position.set(1.35, PERCH, PIPE_Z)
  coruja.rotation.y = -0.85 // olha para a poça (olhos em +z local)

  for (const side of [-1, 1]) {
    const foot = capsule(0.05, 0.1, BEAK, { roughness: 0.6 })
    foot.rotation.x = Math.PI / 2
    foot.position.set(side * 0.13, 0.05, 0.05)
    coruja.add(foot)
    for (const toe of [-1, 0, 1]) {
      const claw = sphere(0.032, BEAK, { roughness: 0.55 })
      claw.position.set(side * 0.13 + toe * 0.045, 0.04, 0.13)
      coruja.add(claw)
    }
  }

  const owlBody = capsule(0.27, 0.2, TOBACCO, { roughness: 0.9 })
  owlBody.position.y = 0.41
  coruja.add(owlBody)

  const belly = sphere(0.19, TOBACCO_L, { roughness: 0.9 })
  belly.position.set(0, 0.36, 0.2)
  belly.scale.set(1.0, 1.25, 0.45)
  coruja.add(belly)

  // asa direita colada; asa esquerda esticada à frente, segurando a chave
  const wingR = capsule(0.075, 0.3, '#734829', { roughness: 0.9 })
  wingR.position.set(0.26, 0.42, 0.0)
  wingR.rotation.z = -0.12
  wingR.scale.z = 0.55
  coruja.add(wingR)

  const wingL = capsule(0.075, 0.34, '#734829', { roughness: 0.9 })
  wingL.position.set(-0.27, 0.46, 0.16)
  wingL.rotation.set(-0.95, 0, 0.28)
  wingL.scale.z = 0.6
  coruja.add(wingL)

  // molho de chaves dourado no peito
  const keys = new THREE.Group()
  keys.position.set(0, 0.32, 0.34)
  const ring = torus(0.075, 0.014, BRASS, { roughness: 0.3, metalness: 0.75 })
  keys.add(ring)
  for (const [kx, ka] of [[-0.05, -0.3], [0.0, 0.05], [0.055, 0.35]] as const) {
    const key = new THREE.Group()
    key.position.set(kx, -0.07, 0)
    key.rotation.z = ka
    const shaft = rbox(0.026, 0.14, 0.012, 0.005, BRASS, { roughness: 0.3, metalness: 0.75 })
    shaft.position.y = -0.07
    key.add(shaft)
    const bit = rbox(0.05, 0.03, 0.012, 0.005, BRASS, { roughness: 0.3, metalness: 0.75 })
    bit.position.set(0.022, -0.125, 0)
    key.add(bit)
    keys.add(key)
  }
  coruja.add(keys)

  // cabeça inclinada para baixo: ela examina a poça
  const owlHead = new THREE.Group()
  owlHead.position.y = 0.72
  owlHead.rotation.x = 0.2

  const skull = sphere(0.245, TOBACCO, { roughness: 0.9 })
  skull.scale.set(1.12, 0.95, 1.0)
  owlHead.add(skull)

  const disc = sphere(0.2, FACE, { roughness: 0.9 })
  disc.position.set(0, -0.01, 0.14)
  disc.scale.set(1.18, 1.0, 0.5)
  owlHead.add(disc)

  for (const side of [-1, 1]) {
    const eye = sphere(0.085, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.105, 0.02, 0.2)
    eye.scale.z = 0.6
    const pupil = sphere(0.042, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.105, 0.015, 0.25)
    owlHead.add(eye, pupil)

    // sobrancelhas bravas: ponta interna caída
    const brow = rbox(0.16, 0.036, 0.05, 0.014, '#5a3820', { roughness: 0.9 })
    brow.position.set(side * 0.115, 0.135, 0.2)
    brow.rotation.z = side * 0.45
    owlHead.add(brow)

    const tuft = cone(0.06, 0.22, TOBACCO, { roughness: 0.9 })
    tuft.position.set(side * 0.17, 0.24, -0.02)
    tuft.rotation.set(-0.15, 0, side * 0.4)
    owlHead.add(tuft)
  }

  const beak = cone(0.06, 0.17, BEAK, { roughness: 0.5 })
  beak.rotation.x = Math.PI / 2
  beak.position.set(0, -0.1, 0.25)
  owlHead.add(beak)
  coruja.add(owlHead)
  root.add(coruja)

  // ---- a CHAVE INGLESA (acento saturado) -----------------------------------
  const chave = new THREE.Group()
  chave.position.set(CH_X, CH_Y, CH_Z)
  chave.rotation.z = CH_STRIKE_R // pose final: encostada no cano após MÉ-LAN

  // garra segurando o cabo (lê como a pata da coruja)
  const grip = sphere(0.1, BEAK, { roughness: 0.55 })
  chave.add(grip)
  for (const side of [-1, 1]) {
    const finger = capsule(0.028, 0.07, BEAK, { roughness: 0.55 })
    finger.position.set(side * 0.06, -0.05, 0.06)
    finger.rotation.z = side * 0.5
    chave.add(finger)
  }

  const handle = cylinder(0.045, 0.055, 0.78, ACCENT, { roughness: 0.35, metalness: 0.45 })
  handle.position.y = -0.42
  chave.add(handle)

  const knurl = cylinder(0.062, 0.062, 0.18, ACCENT_DARK, { roughness: 0.55 })
  knurl.position.y = -0.24
  chave.add(knurl)

  const neck = rbox(0.11, 0.2, 0.12, 0.03, ACCENT, { roughness: 0.35, metalness: 0.45 })
  neck.position.y = -0.87
  chave.add(neck)

  // bloco da cabeça: fundo, para abraçar o cano lá atrás
  const jawBlock = rbox(0.22, 0.18, 0.46, 0.05, ACCENT, { roughness: 0.35, metalness: 0.45 })
  jawBlock.position.set(0, -1.0, -0.21)
  chave.add(jawBlock)

  const jawFixed = rbox(0.075, 0.22, 0.46, 0.025, ACCENT, { roughness: 0.35, metalness: 0.45 })
  jawFixed.position.set(0.1, -1.14, -0.21)
  chave.add(jawFixed)

  const jawMobile = rbox(0.075, 0.15, 0.46, 0.025, '#8fb9dd', { roughness: 0.3, metalness: 0.55 })
  jawMobile.position.set(-0.08, -1.1, -0.21)
  chave.add(jawMobile)

  const worm = cylinder(0.05, 0.05, 0.14, STEEL, { roughness: 0.25, metalness: 0.85 })
  worm.rotation.z = Math.PI / 2
  worm.position.set(-0.01, -0.93, -0.21)
  chave.add(worm)
  root.add(chave)

  // ---- FÊ-LAN e MÉ-LAN: anéis de som no cano -------------------------------
  const felan = new THREE.Group()
  felan.position.set(HIT_L, PIPE_Y, PIPE_Z)
  for (const rx of [-0.13, 0.13]) {
    const rIng = torus(0.27, 0.042, '#ffffff', { emissive: '#dff2ff', emissiveIntensity: 0.9 })
    rIng.rotation.y = Math.PI / 2
    rIng.position.x = rx
    felan.add(rIng)
  }
  root.add(felan)

  const melan = new THREE.Group()
  melan.position.set(HIT_R, PIPE_Y, PIPE_Z)
  for (const rx of [-0.1, 0.1]) {
    const rIng = torus(0.2, 0.032, '#ffffff', { emissive: '#dff2ff', emissiveIntensity: 0.9 })
    rIng.rotation.y = Math.PI / 2
    rIng.position.x = rx
    melan.add(rIng)
  }
  root.add(melan)

  // ---- o chamado carimbado saindo da parede --------------------------------
  const papel = new THREE.Group()
  // construída na pose final (já para fora do nicho); a montagem a puxa de dentro
  papel.position.set(0.55, 1.05, -1.18)
  papel.rotation.z = -0.12

  const sheet = rbox(0.44, 0.58, 0.02, 0.008, '#f6f2e6', { roughness: 0.75 })
  papel.add(sheet)
  for (let i = 0; i < 5; i++) {
    const line = rbox(0.3 - (i % 2) * 0.08, 0.024, 0.008, 0.004, '#8c8577', { roughness: 0.7 })
    line.position.set(-0.03, 0.2 - i * 0.075, 0.014)
    papel.add(line)
  }
  const stampRing = torus(0.1, 0.018, '#c94f3d', { roughness: 0.6 })
  stampRing.position.set(0.07, -0.15, 0.016)
  stampRing.rotation.z = 0.3
  papel.add(stampRing)
  const stampBar = rbox(0.15, 0.035, 0.01, 0.006, '#c94f3d', { roughness: 0.6 })
  stampBar.position.set(0.07, -0.15, 0.018)
  stampBar.rotation.z = 0.3
  papel.add(stampBar)
  root.add(papel)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'parede', group: 'cenario', object: parede },
    { name: 'pia', group: 'pia', object: pia },
    { name: 'jato', group: 'pia', object: jato },
    { name: 'cano', group: 'cano', object: cano },
    { name: 'coruja', group: 'coruja', object: coruja },
    { name: 'chave', group: 'coruja', object: chave },
    { name: 'felan', group: 'batidas', object: felan },
    { name: 'melan', group: 'batidas', object: melan },
    { name: 'papel', group: 'papel', object: papel },
  ]

  const grow = (from = 0.01) => [
    ch('scale.x', from, 1),
    ch('scale.y', from, 1),
    ch('scale.z', from, 1),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 1.45)], {
      ease: 'easeOut',
      caption: 'O corredor alagou: a POÇA azul escorre pelo piso do prédio…',
    }),
    seq('parede-rise', 'parede', 0.35, 0.95, [riseFrom(GY, 2.9)], { ease: 'easeOut' }),

    seq('pia-rise', 'pia', 2.0, 0.85, [riseFrom(GY, 1.95)], {
      ease: 'easeOut',
      caption: '…a torneira virou chafariz, e você precisa MOSTRAR a poça: MÔS-TE!, sem o R.',
    }),
    seq('jato-grow', 'jato', 2.25, 0.7, grow(), { ease: 'easeOut' }),

    seq('cano-rise', 'cano', 4.0, 0.9, [riseFrom(0, 2.65)], { ease: 'easeOut' }),

    seq('coruja-rise', 'coruja', 5.6, 0.85, [riseFrom(PERCH, 2.95)], {
      ease: 'easeOut',
      caption: 'No CANO pousa IÔRA, a coruja-zeladora — I de IOGA, Ô dito com bico; nunca GÔ-ra.',
    }),
    seq('chave-rise', 'chave', 5.8, 0.85, [riseFrom(CH_Y, 3.2)], { ease: 'easeOut' }),

    // primeira batida: FÊ-LAN
    seq('chave-fe', 'chave', 7.3, 0.45, [ch('rotation.z', CH_UP, CH_STRIKE_L)], {
      ease: 'easeIn',
      caption: 'Ela ergue a chave inglesa e bate no cano: FÊ-LAN!',
    }),
    seq('felan-pop', 'felan', 7.6, 0.55, grow(), { ease: 'easeOut' }),
    seq('coruja-bob-a', 'coruja', 7.62, 0.2, [ch('position.y', PERCH, PERCH - 0.07)], { ease: 'easeIn' }),
    seq('coruja-bob-b', 'coruja', 7.82, 0.28, [ch('position.y', PERCH - 0.07, PERCH)], { ease: 'easeOut' }),

    seq('chave-recuo', 'chave', 8.0, 0.55, [ch('rotation.z', CH_STRIKE_L, CH_UP2)], { ease: 'easeOut' }),

    // segunda batida: MÉ-LAN (cruza por cima do cano)
    seq('chave-me', 'chave', 8.65, 0.65, [ch('rotation.z', CH_UP2, CH_STRIKE_R)], {
      ease: 'easeIn',
      caption: 'E de novo, bem aberto: MÉ-LAN! — fe-lan-mä-lan, quatro batidas no cano.',
    }),
    seq('melan-pop', 'melan', 9.2, 0.55, grow(), { ease: 'easeOut' }),
    seq('coruja-bob-c', 'coruja', 9.22, 0.2, [ch('position.y', PERCH, PERCH - 0.07)], { ease: 'easeIn' }),
    seq('coruja-bob-d', 'coruja', 9.42, 0.28, [ch('position.y', PERCH - 0.07, PERCH)], { ease: 'easeOut' }),

    seq('papel-sai', 'papel', 9.9, 0.8, [ch('position.z', -1.55, -1.18)], {
      ease: 'easeOut',
      caption: 'Da parede sai o chamado já carimbado: Jag måste göra en felanmälan.',
    }),
    seq('papel-inclina', 'papel', 10.2, 0.6, [ch('rotation.z', 0, -0.12)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 3.05, 5.7], target: [0.05, 1.2, -0.35] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-maste-gora-en-felanmalan',
    contexto:
      'Falando com o hyresvärd quando a torneira vaza, o aquecedor não esquenta ou a fechadura emperra.',
    fraseFonte: 'Preciso abrir um chamado de manutenção.',
    fraseAlvo: 'Jag måste göra en felanmälan.',
    pronuncia:
      "iá MÓS-te IÖ-ra en FÉL-an-mé-lan ('göra' começa com som de I; 'å' de måste = ó fechado)",
    ponteSonora:
      "IÁ MÔS-TE IÔRA EN FÊ-LAN-MÉ-LAN (10 sílabas, picos em MÔS, IÔ e FÊ; 'måste' = MÔS-TE, com Ô FECHADO de 'avô' e um -TE fraquinho no fim: é 'mostre' SEM O R — se sair MOS-TRA você inventa uma palavra que não existe em sueco; IÔRA começa com I de IOGA, jamais G duro, e o Ô é dito com BICO, que é o ö; FÊ-LAN-MÉ-LAN nas quatro batidas, FÊ fechado, MÉ bem aberto e nenhum dos dois LAN nasalado)",
    historia:
      'Sua torneira virou chafariz e melou o corredor, mas na Suécia nada se conserta sozinho: você precisa MOSTRAR a poça pra IÔRA, a coruja-zeladora empoleirada no cano — só que o grito é MÔS-TE!, sem o R (e se você disser GÔ-ra em vez de IÔRA ela finge que não é com ela). Ela examina a poça, ergue a chave inglesa e bate duas vezes no cano: FÊ-LAN! MÉ-LAN! Na segunda batida o papel do chamado sai da parede já carimbado.',
  },
  createScene,
}

export default card
