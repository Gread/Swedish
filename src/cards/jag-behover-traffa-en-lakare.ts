import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, type MatOpts,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag behöver träffa en läkare." — IÁ! BERRÔ: VER! TRÉFA... EN... (ge)LÉ-CA-re!
 *
 * Guerra de GELECA no pátio. O ciclope gigante solta o grito de guerra (IÁ!) de
 * punho erguido e uma bola verde-limão ACERTA em cheio o único olho dele
 * ('träffa' também é acertar o alvo). Ele BERRA "VER!", mas só tem TREVA: fiapos
 * de escuro escapam por baixo da geleca, a voz vira cochicho (TRÉFA), o outro
 * braço tateia o ar e o punho ergue UM dedo — um olho só, grudado de geLECA.
 * Só um LÉ-ca-re resolve.
 *
 * Diorama: grama sálvia com lajotas claras; pote rosa tombado à direita, tampa
 * amarela e poça escorrendo; balde de munição à esquerda; duas bolas cruzando o
 * fundo. O verde-limão saturado é RESERVADO à geleca.
 */

const SOIL = '#4a3a2b'
const GRASS = '#6f8f5c'
const GRASS_DARK = '#557245'
const STONE = '#c8bca7'
const BUSH = '#4d6e45'
const WOOD = '#a77446'
const WOOD_DARK = '#6e4a2c'
const SKIN = '#e2aa8c'
const SKIN_DARK = '#c98670'
const LEATHER = '#87532f'
const LEATHER_DARK = '#5e3820'
const ROPE = '#d1b27a'
const BROW = '#4a2e1f'
const MOUTH = '#4a1a22'
const TONGUE = '#c4576a'
const TEETH = '#f3ecd6'
const PINK = '#d98aa2'
const PINK_DARK = '#b86a84'
const LID = '#e9bf45'
const CREAM = '#efe6d4'
const SMOKE = '#44404f'
const LIME = '#b6ef2c' // acento saturado RESERVADO: a geleca

const GY = 0.18 // topo da grama
const CY_POS: [number, number, number] = [-0.05, GY, -0.35]
const SHOULDER_Y = 1.9
const HEAD_Y = 2.42

const JELLY: MatOpts = { roughness: 0.12 }

/** Cápsula ligando dois pontos — membros, alças, fiapos. */
function limb(
  r: number,
  a: [number, number, number],
  b: [number, number, number],
  color: string,
  opts?: MatOpts,
) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, dir.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

/** Anel (pulseira, braçadeira) em volta do segmento a→b, no ponto t. */
function cuff(
  r: number,
  tube: number,
  a: [number, number, number],
  b: [number, number, number],
  t: number,
  color: string,
) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const m = torus(r, tube, color, { roughness: 0.8 })
  m.position.copy(va).lerp(vb, t)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vb.clone().sub(va).normalize())
  return m
}

/**
 * Fiapo de treva: baforada de fumaça preta saindo de baixo da geleca — novelos
 * que crescem e se encavalam conforme se afastam da saída, como fumaça que
 * escapa e se expande (tubo liso lia como chifre).
 */
function plume(points: [number, number, number][], radii: number[], seed: number) {
  const g = new THREE.Group()
  points.forEach((p, i) => {
    const cloud = puff(radii[i], SMOKE, 6, seed + i * 7, { roughness: 0.95 })
    cloud.position.set(...p)
    cloud.scale.z = 0.7
    g.add(cloud)
  })
  return g
}

/** Bola de geleca voando, com rastro de gotas atrás (dir = de onde veio). */
function flyingBall(dir: [number, number, number], seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const ball = sphere(0.17, LIME, JELLY)
  ball.scale.set(1.12, 0.92, 0.95)
  g.add(ball)
  const d = new THREE.Vector3(...dir).normalize()
  for (const [k, r] of [[0.3, 0.1], [0.5, 0.07], [0.66, 0.045], [0.78, 0.03]] as const) {
    const drop = sphere(r, LIME, JELLY)
    drop.position.copy(d).multiplyScalar(k)
    drop.position.y += (rand() - 0.5) * 0.06
    drop.position.z += (rand() - 0.5) * 0.06
    g.add(drop)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: grama do pátio com lajotas ------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const grass = cylinder(2.55, 2.62, 0.07, GRASS, { roughness: 0.92 })
  grass.position.y = 0.145
  base.add(grass)

  // lajotas irregulares: o "pátio"
  const stones: [number, number, number][] = [
    [0.05, -0.2, 0.62], [-0.95, 0.55, 0.36], [0.95, 0.75, 0.42], [0.1, 1.15, 0.34],
    [-1.25, -0.6, 0.3], [1.3, -0.55, 0.33], [-0.55, 1.75, 0.26], [0.85, 1.7, 0.25],
  ]
  for (const [sx, sz, sr] of stones) {
    const s = cylinder(sr, sr * 1.04, 0.05, STONE, { roughness: 0.85 }, 7)
    s.position.set(sx, GY - 0.012, sz)
    s.rotation.y = rand() * Math.PI
    s.scale.set(1 + (rand() - 0.5) * 0.25, 1, 1 + (rand() - 0.5) * 0.25)
    base.add(s)
  }

  // tufos de grama na borda
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const rr = 1.9 + rand() * 0.45
    const tuft = new THREE.Group()
    tuft.position.set(Math.cos(a) * rr, GY, Math.sin(a) * rr)
    for (let k = 0; k < 4; k++) {
      const blade = cone(0.035, 0.18 + rand() * 0.1, GRASS_DARK, { roughness: 0.9 }, 6)
      blade.position.set((rand() - 0.5) * 0.1, 0.09, (rand() - 0.5) * 0.1)
      blade.rotation.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5)
      tuft.add(blade)
    }
    base.add(tuft)
  }

  // arbustos ao fundo
  for (const [bx, bz, br, bs] of [[-1.9, -1.15, 0.36, 7], [1.95, -1.05, 0.32, 9]] as const) {
    const bush = puff(br, BUSH, 6, bs, { roughness: 0.9 })
    bush.position.set(bx, GY + br * 0.7, bz)
    base.add(bush)
  }

  root.add(base)

  // ---- pote de geleca tombado + poça ---------------------------------------
  const pote = new THREE.Group()
  root.add(pote)

  const jar = new THREE.Group()
  jar.position.set(1.25, GY + 0.215, 0.85)
  jar.rotation.set(0, -0.55, Math.PI / 2 + 0.06) // deitado, boca para a esquerda-frente
  pote.add(jar)

  const jarBody = lathe(
    [[0, 0], [0.17, 0], [0.205, 0.03], [0.215, 0.26], [0.19, 0.31], [0.15, 0.34], [0.15, 0.4], [0, 0.4]],
    PINK,
    { roughness: 0.3 },
  )
  jar.add(jarBody)
  const rim = torus(0.152, 0.024, PINK_DARK, { roughness: 0.35 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.39
  jar.add(rim)
  const label = cylinder(0.219, 0.219, 0.13, CREAM, { roughness: 0.7 })
  label.position.y = 0.15
  jar.add(label)
  const labelDot = sphere(0.05, LIME, JELLY)
  labelDot.position.set(0, 0.15, 0.215)
  labelDot.scale.z = 0.4
  jar.add(labelDot)
  const plug = cylinder(0.14, 0.14, 0.03, LIME, JELLY)
  plug.position.y = 0.4
  jar.add(plug)

  const lid = new THREE.Group()
  lid.position.set(1.72, GY + 0.035, 0.35)
  lid.rotation.set(0.08, 0.4, -0.05)
  const lidTop = cylinder(0.2, 0.2, 0.07, LID, { roughness: 0.35 })
  lid.add(lidTop)
  const lidRidge = torus(0.2, 0.022, '#cf9f2c', { roughness: 0.4 })
  lidRidge.rotation.x = Math.PI / 2
  lid.add(lidRidge)
  pote.add(lid)

  // poça escorrendo da boca do pote para a frente-esquerda
  const spill: [number, number, number][] = [
    [0.93, 0.62, 0.17], [0.72, 0.5, 0.22], [0.46, 0.45, 0.25], [0.3, 0.62, 0.17], [0.55, 0.78, 0.14],
  ]
  for (const [px, pz, pr] of spill) {
    const blob = sphere(pr, LIME, JELLY)
    blob.scale.set(1, 0.16, 1)
    blob.position.set(px, GY + 0.012, pz)
    pote.add(blob)
  }
  // respingos de tiros perdidos
  for (const [px, pz, pr] of [[-0.9, 0.95, 0.12], [-0.25, 1.35, 0.08], [1.55, -0.05, 0.09]] as const) {
    const splat = sphere(pr, LIME, JELLY)
    splat.scale.set(1, 0.18, 1)
    splat.position.set(px, GY + 0.01, pz)
    pote.add(splat)
    for (let k = 0; k < 3; k++) {
      const a = rand() * Math.PI * 2
      const dot = sphere(pr * 0.3, LIME, JELLY)
      dot.scale.y = 0.4
      dot.position.set(px + Math.cos(a) * pr * 1.6, GY + 0.01, pz + Math.sin(a) * pr * 1.6)
      pote.add(dot)
    }
  }

  // balde de munição (madeira) com bolas de geleca
  const bucket = new THREE.Group()
  bucket.position.set(-1.55, GY, 0.85)
  const pail = lathe(
    [[0, 0], [0.2, 0], [0.24, 0.3], [0.255, 0.32], [0.22, 0.31], [0.19, 0.03], [0, 0.03]],
    WOOD,
    { roughness: 0.75 },
  )
  bucket.add(pail)
  for (const hy of [0.07, 0.24]) {
    const hoop = torus(hy < 0.1 ? 0.213 : 0.238, 0.016, WOOD_DARK, { roughness: 0.6 })
    hoop.rotation.x = Math.PI / 2
    hoop.position.y = hy
    bucket.add(hoop)
  }
  for (const [ax, ay, az] of [[-0.06, 0.3, 0.03], [0.08, 0.31, -0.04], [0.0, 0.4, 0.0]] as const) {
    const ammo = sphere(0.1, LIME, JELLY)
    ammo.position.set(ax, ay, az)
    bucket.add(ammo)
  }
  pote.add(bucket)

  // ---- CICLOPE GIGANTE -----------------------------------------------------
  const ciclope = new THREE.Group()
  ciclope.position.set(...CY_POS)
  ciclope.rotation.y = 0.12
  root.add(ciclope)

  // pernas grossas
  for (const side of [-1, 1]) {
    const hip: [number, number, number] = [side * 0.3, 1.0, 0]
    const knee: [number, number, number] = [side * 0.37, 0.55, 0.07]
    const ankle: [number, number, number] = [side * 0.39, 0.18, 0.03]
    ciclope.add(limb(0.21, hip, knee, SKIN, { roughness: 0.7 }))
    ciclope.add(limb(0.175, knee, ankle, SKIN, { roughness: 0.7 }))
    const kneeCap = sphere(0.2, SKIN, { roughness: 0.7 })
    kneeCap.position.set(...knee)
    ciclope.add(kneeCap)

    const foot = sphere(0.2, SKIN, { roughness: 0.7 })
    foot.scale.set(0.95, 0.55, 1.45)
    foot.position.set(side * 0.4, 0.1, 0.13)
    foot.rotation.y = side * 0.15
    ciclope.add(foot)
    for (let k = 0; k < 3; k++) {
      const toe = sphere(0.062, SKIN_DARK, { roughness: 0.7 })
      toe.position.set(side * 0.4 + (k - 1) * 0.1 + side * 0.04, 0.06, 0.4 - Math.abs(k - 1) * 0.03)
      ciclope.add(toe)
    }
    // sandália de couro: tira no tornozelo e tira no peito do pé
    const ankleStrap = torus(0.17, 0.03, LEATHER_DARK, { roughness: 0.8 })
    ankleStrap.rotation.x = Math.PI / 2
    ankleStrap.position.set(side * 0.39, 0.24, 0.03)
    ciclope.add(ankleStrap)
    const sole = rbox(0.42, 0.04, 0.66, 0.02, LEATHER_DARK, { roughness: 0.8 })
    sole.position.set(side * 0.4, 0.02, 0.15)
    sole.rotation.y = side * 0.15
    ciclope.add(sole)
  }

  // tronco: pera de gigante (pele)
  const pelvis = sphere(0.45, SKIN, { roughness: 0.7 })
  pelvis.scale.set(1.2, 0.8, 0.9)
  pelvis.position.y = 1.0
  ciclope.add(pelvis)

  const torso = lathe(
    [[0, 0.9], [0.5, 0.92], [0.6, 1.1], [0.64, 1.35], [0.6, 1.6], [0.55, 1.82], [0.38, 2.04], [0, 2.1]],
    SKIN,
    { roughness: 0.7 },
  )
  torso.scale.z = 0.8
  ciclope.add(torso)

  for (const side of [-1, 1]) {
    const shoulder = sphere(0.26, SKIN, { roughness: 0.7 })
    shoulder.position.set(side * 0.6, SHOULDER_Y - 0.02, 0)
    ciclope.add(shoulder)
  }

  // túnica de couro presa num ombro só
  const tunic = lathe(
    [[0, 0.74], [0.71, 0.74], [0.68, 0.9], [0.67, 1.1], [0.7, 1.33], [0.66, 1.58], [0.61, 1.72], [0, 1.72]],
    LEATHER,
    { roughness: 0.75 },
  )
  tunic.scale.z = 0.82
  ciclope.add(tunic)

  // barra em dentes de serra
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const tab = cone(0.1, 0.17, LEATHER, { roughness: 0.75 }, 12)
    tab.rotation.x = Math.PI
    tab.position.set(Math.cos(a) * 0.66, 0.67, Math.sin(a) * 0.66 * 0.82)
    ciclope.add(tab)
  }

  // alça sobre o ombro direito dele (-x)
  ciclope.add(limb(0.1, [-0.12, 1.66, 0.46], [-0.5, 2.1, 0.08], LEATHER, { roughness: 0.75 }))
  ciclope.add(limb(0.1, [-0.5, 2.1, 0.08], [-0.5, 2.08, -0.12], LEATHER, { roughness: 0.75 }))
  ciclope.add(limb(0.1, [-0.5, 2.08, -0.12], [-0.12, 1.66, -0.44], LEATHER, { roughness: 0.75 }))

  // cinto de corda com nó
  const belt = torus(0.69, 0.05, ROPE, { roughness: 0.9 })
  belt.rotation.x = Math.PI / 2
  belt.scale.set(1, 0.82, 1)
  belt.position.y = 1.2
  ciclope.add(belt)
  const knot = sphere(0.075, ROPE, { roughness: 0.9 })
  knot.position.set(0.3, 1.2, 0.52)
  ciclope.add(knot)
  ciclope.add(limb(0.03, [0.3, 1.16, 0.56], [0.26, 0.92, 0.6], ROPE, { roughness: 0.9 }))
  ciclope.add(limb(0.03, [0.34, 1.16, 0.55], [0.38, 0.95, 0.59], ROPE, { roughness: 0.9 }))

  // ---- cabeça careca de um olho só -----------------------------------------
  const head = new THREE.Group()
  head.position.set(0, HEAD_Y + 0.05, 0.05)
  head.rotation.x = -0.08 // queixo erguido no berro
  head.scale.setScalar(1.14) // cabeção: é nela que a história acontece
  ciclope.add(head)

  const skull = sphere(0.5, SKIN, { roughness: 0.65 })
  skull.scale.set(1, 1, 0.92)
  head.add(skull)

  const jaw = sphere(0.4, SKIN, { roughness: 0.65 })
  jaw.scale.set(1.12, 0.78, 1)
  jaw.position.set(0, -0.2, 0.08)
  head.add(jaw)

  for (const side of [-1, 1]) {
    const cheek = sphere(0.14, SKIN, { roughness: 0.65 })
    cheek.position.set(side * 0.26, -0.1, 0.33)
    head.add(cheek)

    const ear = sphere(0.13, SKIN_DARK, { roughness: 0.65 })
    ear.scale.set(0.45, 1, 0.8)
    ear.position.set(side * 0.5, 0.0, -0.02)
    head.add(ear)

    // sobrancelha única quebrada no meio: pontas internas pra cima (pavor)
    const brow = limb(0.045, [side * 0.03, 0.4, 0.4], [side * 0.27, 0.32, 0.37], BROW, { roughness: 0.9 })
    head.add(brow)
  }

  const browRidge = capsule(0.08, 0.36, SKIN, { roughness: 0.65 })
  browRidge.rotation.z = Math.PI / 2
  browRidge.position.set(0, 0.32, 0.33)
  head.add(browRidge)

  // o olho único (fica sob a geleca na pose final)
  const eye = sphere(0.155, '#ffffff', { roughness: 0.25 })
  eye.scale.z = 0.6
  eye.position.set(0, 0.12, 0.4)
  head.add(eye)
  const iris = sphere(0.085, '#4f7fb8', { roughness: 0.25 })
  iris.scale.z = 0.5
  iris.position.set(0, 0.12, 0.475)
  head.add(iris)
  const pupil = sphere(0.045, '#141414', { roughness: 0.2 })
  pupil.scale.z = 0.5
  pupil.position.set(0, 0.12, 0.505)
  head.add(pupil)

  const nose = sphere(0.1, SKIN_DARK, { roughness: 0.6 })
  nose.scale.set(0.95, 0.8, 1)
  nose.position.set(0, -0.12, 0.47)
  head.add(nose)

  // ---- boca escancarada (peça: abre no berro) ------------------------------
  const boca = new THREE.Group()
  boca.position.set(0, -0.3, 0.41)
  head.add(boca)

  const cavity = sphere(0.2, MOUTH, { roughness: 0.6 })
  cavity.scale.set(1.15, 0.85, 0.45)
  boca.add(cavity)
  const lip = torus(0.2, 0.035, SKIN_DARK, { roughness: 0.6 })
  lip.scale.set(1.15, 0.85, 1)
  lip.position.z = 0.02
  boca.add(lip)
  const tongue = sphere(0.11, TONGUE, { roughness: 0.45 })
  tongue.scale.set(1.25, 0.5, 0.8)
  tongue.position.set(0, -0.09, 0.04)
  boca.add(tongue)
  // dentes tortos
  for (const [tx, ty, tr, th] of [
    [-0.14, 0.11, 0.25, 0.07], [-0.05, 0.13, -0.12, 0.09], [0.05, 0.125, 0.2, 0.06], [0.14, 0.1, -0.3, 0.08],
    [-0.1, -0.11, -0.2, 0.07], [0.02, -0.125, 0.15, 0.06], [0.12, -0.1, -0.1, 0.075],
  ] as const) {
    const tooth = rbox(0.066, th + 0.01, 0.05, 0.022, TEETH, { roughness: 0.35 })
    tooth.position.set(tx, ty, 0.065)
    tooth.rotation.z = tr
    boca.add(tooth)
  }

  // ---- geleca no olho (peça: voa e gruda) ----------------------------------
  const geleca = new THREE.Group()
  geleca.position.set(0, 0.12, 0.47)
  head.add(geleca)

  const glob = sphere(0.22, LIME, JELLY)
  glob.scale.set(1.05, 0.95, 0.6)
  geleca.add(glob)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3
    const lump = sphere(0.06 + rand() * 0.03, LIME, JELLY)
    lump.position.set(Math.cos(a) * 0.2, Math.sin(a) * 0.18, -0.02)
    lump.scale.z = 0.6
    geleca.add(lump)
  }
  // três gotas escorrendo pela bochecha
  for (const [dx, y1, z1] of [[-0.24, -0.38, -0.08], [0.2, -0.3, -0.07], [0.3, -0.22, -0.12]] as const) {
    geleca.add(limb(0.035, [dx * 0.75, -0.1, 0.02], [dx, y1, z1], LIME, JELLY))
    const drop = sphere(0.052, LIME, JELLY)
    drop.position.set(dx, y1 - 0.02, z1)
    geleca.add(drop)
  }

  // ---- fiapos de treva escapando por baixo da geleca -----------------------
  const treva = new THREE.Group()
  treva.position.set(0, 0.12, 0.44)
  head.add(treva)
  // saem pela borda de baixo da bolota, contornam o rosto e sobem ondulando
  treva.add(plume([[-0.18, -0.12, 0.08], [-0.3, -0.1, 0.14], [-0.45, -0.02, 0.18], [-0.6, 0.08, 0.2], [-0.72, 0.18, 0.18]], [0.045, 0.07, 0.085, 0.065, 0.04], 3))
  treva.add(plume([[0.18, -0.13, 0.08], [0.3, -0.1, 0.14], [0.44, -0.03, 0.17], [0.58, 0.06, 0.18], [0.68, 0.14, 0.16]], [0.045, 0.065, 0.08, 0.06, 0.038], 5))
  treva.add(plume([[0.16, 0.16, 0.08], [0.26, 0.24, 0.14], [0.36, 0.31, 0.17]], [0.035, 0.05, 0.04], 9))

  // ---- braço erguido, punho fechado (o dedo é peça própria) ----------------
  const bracoUp = new THREE.Group()
  bracoUp.position.set(0.66, SHOULDER_Y, 0)
  ciclope.add(bracoUp)

  const uE: [number, number, number] = [0.45, 0.2, 0.05]
  const uW: [number, number, number] = [0.5, 0.66, 0.1]
  const uShoulder = sphere(0.24, SKIN, { roughness: 0.7 })
  bracoUp.add(uShoulder)
  bracoUp.add(limb(0.18, [0, 0, 0], uE, SKIN, { roughness: 0.7 }))
  const uElbow = sphere(0.165, SKIN, { roughness: 0.7 })
  uElbow.position.set(...uE)
  bracoUp.add(uElbow)
  bracoUp.add(limb(0.155, uE, uW, SKIN, { roughness: 0.7 }))
  bracoUp.add(cuff(0.155, 0.045, uE, uW, 0.72, LEATHER_DARK))
  const fist = sphere(0.165, SKIN, { roughness: 0.7 })
  fist.scale.set(1.0, 1.0, 0.85)
  fist.position.set(0.51, 0.8, 0.12)
  bracoUp.add(fist)
  // dedos dobrados virados para a câmera
  for (const [ky, kz] of [[0.86, 0.25], [0.78, 0.26], [0.7, 0.24]] as const) {
    bracoUp.add(limb(0.048, [0.44, ky, kz], [0.58, ky, kz - 0.01], SKIN, { roughness: 0.7 }))
  }
  bracoUp.add(limb(0.05, [0.37, 0.72, 0.16], [0.46, 0.68, 0.27], SKIN, { roughness: 0.7 })) // polegar

  // ---- UM dedo (peça: brota do punho) --------------------------------------
  const dedo = new THREE.Group()
  dedo.position.set(0.53, 0.92, 0.17)
  dedo.rotation.z = -0.08
  bracoUp.add(dedo)
  const finger = capsule(0.056, 0.2, SKIN, { roughness: 0.7 })
  finger.position.y = 0.13
  dedo.add(finger)
  const knuckle = sphere(0.06, SKIN, { roughness: 0.7 })
  knuckle.position.y = 0.14
  dedo.add(knuckle)
  const nail = rbox(0.06, 0.07, 0.02, 0.01, '#f0c8b8', { roughness: 0.3 })
  nail.position.set(0, 0.24, 0.045)
  dedo.add(nail)

  // ---- braço tateando o ar -------------------------------------------------
  const bracoFrente = new THREE.Group()
  bracoFrente.position.set(-0.66, SHOULDER_Y, 0)
  ciclope.add(bracoFrente)

  const fE: [number, number, number] = [-0.3, -0.38, 0.38]
  const fW: [number, number, number] = [-0.48, -0.42, 0.85]
  const fShoulder = sphere(0.24, SKIN, { roughness: 0.7 })
  bracoFrente.add(fShoulder)
  bracoFrente.add(limb(0.18, [0, 0, 0], fE, SKIN, { roughness: 0.7 }))
  const fElbow = sphere(0.165, SKIN, { roughness: 0.7 })
  fElbow.position.set(...fE)
  bracoFrente.add(fElbow)
  bracoFrente.add(limb(0.155, fE, fW, SKIN, { roughness: 0.7 }))
  bracoFrente.add(cuff(0.155, 0.045, fE, fW, 0.72, LEATHER_DARK))

  const hand = new THREE.Group()
  hand.position.set(-0.53, -0.43, 0.99)
  hand.rotation.y = Math.atan2(fW[0] - fE[0], fW[2] - fE[2])
  bracoFrente.add(hand)
  const palm = sphere(0.15, SKIN, { roughness: 0.7 })
  palm.scale.set(1.0, 0.5, 1.05)
  hand.add(palm)
  // dedos abertos em leque, tateando
  for (let k = 0; k < 4; k++) {
    const a = -0.42 + k * 0.28
    const bx = Math.sin(a) * 0.12
    const bz = Math.cos(a) * 0.12
    hand.add(limb(0.042, [bx, 0, bz], [Math.sin(a) * 0.32, -0.04 - k * 0.012, Math.cos(a) * 0.32], SKIN, { roughness: 0.7 }))
  }
  hand.add(limb(0.046, [0.1, 0.02, 0.0], [0.24, 0.06, 0.12], SKIN, { roughness: 0.7 })) // polegar

  // ---- duas bolas de geleca cruzando o fundo -------------------------------
  const BOLA1: [number, number, number] = [-1.65, 2.55, -1.15]
  const BOLA2: [number, number, number] = [1.75, 2.2, -1.25]
  const bola1 = flyingBall([-1, 0.45, -0.15], 3)
  bola1.position.set(...BOLA1)
  root.add(bola1)
  const bola2 = flyingBall([1, 0.35, -0.1], 7)
  bola2.position.set(...BOLA2)
  root.add(bola2)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'patio', object: base },
    { name: 'pote', group: 'patio', object: pote },
    { name: 'ciclope', group: 'ciclope', object: ciclope },
    { name: 'bracoUp', group: 'ciclope', object: bracoUp },
    { name: 'bracoFrente', group: 'ciclope', object: bracoFrente },
    { name: 'boca', group: 'ciclope', object: boca },
    { name: 'bola1', group: 'guerra', object: bola1 },
    { name: 'bola2', group: 'guerra', object: bola2 },
    { name: 'geleca', group: 'acerto', object: geleca },
    { name: 'treva', group: 'treva', object: treva },
    { name: 'dedo', group: 'um', object: dedo },
  ]

  const S = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const GEL = geleca.position.clone()
  const F_HANG = 1.15 // braço da frente pendurado ao lado do corpo

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Guerra de GELECA no pátio: brota a grama, e um pote tombado escorre verde-limão…',
    }),
    seq('pote-rise', 'pote', 0.3, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),

    seq('ciclope-rise', 'ciclope', 1.7, 1.0, [riseFrom(CY_POS[1], 3.4)], {
      ease: 'easeOut',
      caption: 'Do chão sobe um ciclope gigante, de punho erguido, e solta o grito de guerra: IÁ!',
    }),
    seq('bracoUp-soca', 'bracoUp', 1.7, 1.2, [ch('rotation.z', -0.9, 0)], { ease: 'easeOut' }),
    seq('bracoF-pende', 'bracoFrente', 1.7, 1.0, [ch('rotation.x', 0.7, F_HANG)], { ease: 'easeOut' }),
    seq('boca-ia', 'boca', 1.7, 1.1, [ch('scale.y', 0.15, 0.6), ch('scale.x', 0.7, 0.85)], { ease: 'easeOut' }),

    seq('bola1-voa', 'bola1', 3.2, 0.7, [
      ...S(0.3, 1), ch('position.x', BOLA1[0] - 1.4, BOLA1[0]), ch('position.y', BOLA1[1] + 0.5, BOLA1[1]),
    ], { ease: 'easeOut' }),
    seq('bola2-voa', 'bola2', 3.35, 0.7, [
      ...S(0.3, 1), ch('position.x', BOLA2[0] + 1.4, BOLA2[0]), ch('position.y', BOLA2[1] + 0.45, BOLA2[1]),
    ], { ease: 'easeOut' }),

    seq('geleca-voa', 'geleca', 3.6, 0.5, [
      ...S(0.55, 1), ch('position.z', GEL.z + 2.8, GEL.z), ch('position.y', GEL.y + 0.5, GEL.y),
    ], {
      ease: 'easeIn',
      caption: 'PLOFT! Uma bola de geleca ACERTA em cheio o único olho dele — e "träffa" também é acertar o alvo.',
    }),
    seq('ciclope-recua', 'ciclope', 4.1, 0.2, [ch('rotation.x', 0, -0.07)], { ease: 'easeOut' }),
    seq('ciclope-volta', 'ciclope', 4.3, 0.45, [ch('rotation.x', -0.07, 0)]),
    seq('geleca-esmaga', 'geleca', 4.1, 0.15, [ch('scale.x', 1, 1.22), ch('scale.y', 1, 0.82)], { ease: 'easeOut' }),
    seq('geleca-assenta', 'geleca', 4.25, 0.4, [ch('scale.x', 1.22, 1), ch('scale.y', 0.82, 1)]),

    seq('boca-berra', 'boca', 5.3, 0.45, [ch('scale.y', 0.6, 1), ch('scale.x', 0.85, 1)], {
      ease: 'easeOut',
      caption: 'Ele BERROU: VER! — mas na frente dele só tem TREVA.',
    }),

    seq('treva-escapa', 'treva', 6.8, 0.8, S(0.01, 1), {
      ease: 'easeOut',
      caption: 'Morrendo de medo do escuro, perde a voz e só COCHICHA: TRÉFA… (no cochicho, o V vira F).',
    }),
    seq('bracoF-estica', 'bracoFrente', 7.0, 0.8, [ch('rotation.x', F_HANG, 0)], { ease: 'easeOut' }),
    seq('bracoF-tateia-a', 'bracoFrente', 7.8, 0.5, [ch('rotation.y', 0, 0.3)]),
    seq('bracoF-tateia-b', 'bracoFrente', 8.3, 0.6, [ch('rotation.y', 0.3, -0.15)]),
    seq('bracoF-tateia-c', 'bracoFrente', 8.9, 0.5, [ch('rotation.y', -0.15, 0)]),

    seq('dedo-ergue', 'dedo', 9.0, 0.5, [ch('scale.y', 0.01, 1), ch('scale.x', 0.6, 1), ch('scale.z', 0.6, 1)], {
      ease: 'easeOut',
      caption: 'Ergue UM dedo — EN: é um olho só, e esse um está grudado de geLECA.',
    }),
    seq('bracoUp-enfatiza', 'bracoUp', 9.0, 0.3, [ch('rotation.z', 0, 0.1)], { ease: 'easeOut' }),
    seq('bracoUp-assenta', 'bracoUp', 9.3, 0.4, [ch('rotation.z', 0.1, 0)]),

    seq('ciclope-sacode-a', 'ciclope', 10.5, 0.2, [ch('rotation.z', 0, 0.05)], {
      caption: 'Puxa, sacode, esfrega… nada! Geleca no olho, só um médico descola: o LÉ-CA-re.',
    }),
    seq('ciclope-sacode-b', 'ciclope', 10.7, 0.3, [ch('rotation.z', 0.05, -0.05)]),
    seq('ciclope-sacode-c', 'ciclope', 11.0, 0.25, [ch('rotation.z', -0.05, 0)]),
    seq('treva-incha', 'treva', 10.5, 0.6, [ch('scale.y', 1, 1.15)], { ease: 'easeOut' }),

    seq('treva-assenta', 'treva', 12.0, 0.6, [ch('scale.y', 1.15, 1)], {
      caption: 'Jag behöver träffa en läkare. — Preciso ver um médico.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.9, 2.4, 6.1], target: [0.05, 1.6, -0.1] },
  }
}

export const card: Card = {
  refine: { organic: ['ciclope', 'bracoUp', 'bracoFrente', 'geleca'] },
  meta: {
    id: 'jag-behover-traffa-en-lakare',
    contexto:
      'Saúde: ao telefone com a vårdcentral ou o 1177, quando a enfermeira da triagem tenta resolver tudo com conselho por telefone; também na recepção do pronto-atendimento.',
    fraseFonte: 'Preciso ver um médico.',
    fraseAlvo: 'Jag behöver träffa en läkare.',
    pronuncia:
      "iá be-RRÖÖ-ver TRÉF-fa en LÉÉ-ka-re ('jag' = iá, o -g não soa; o h de 'behöver' é soprado como RR carioca e o ö é lábios de Ô com língua de Ê, longo; na fala corrida o -r de 'behöver' gruda no T de 'träffa'; 'träffa' com É aberto e F dobrado; 'en' curto e sem nasal; 'läkare' com É aberto e longo, força no LÉ e o '-kare' leve, de K duro)",
    ponteSonora:
      "IÁ! BERRÔ: VER! TRÉFA... EN... (ge)LÉ-CA-re! (10 sílabas: iá-be-RRÖÖ-ver-TRÉF-fa-en-LÉÉ-ka-re; tônicas em RRÖÖ, TRÉF e LÉÉ, a mais forte no LÉÉ; IÁ é o 'jag' de sempre, I de IOGA, nunca o J chiado de 'já'; BERRÔ: VER! = BERROU 'VER!' num fôlego só, e é o MESMO be-RRÖ-ver de 'Det är akut, jag behöver komma in idag': o BE é fraquinho, o RR carioca soprado é o h, e a força cai no RRÔ — sem o U do 'ou' e de BICO: lábios de Ô com língua de Ê, longo, o truque do TRÖTT e do MÖÖ-te; o VER vem grudado e sem força, mas com o R brando no fim — sem ele sobra 'behöva', o infinitivo; TRÉFA = a TREVA COCHICHADA: no cochicho o V perde a voz e vira F (sussurre 'treva' e ouça) — É ABERTO, como em 'treva', e o F sem voz e segurado (TRÉF-fa); é o mesmo TRÉ-fa de 'Trevligt att träffas!' (lá, TRÉ-fas, com S); dito com V em voz alta sai 'träva', que não existe e puxa pro TRÊV de 'trevligt', outra palavra — lá é V e Ê fechado, aqui é F e É aberto; EN = 'um', o mesmo dedinho erguido de 'Har du tid en stund?' e 'Ha en bra dag!' — aqui o dedo do ciclope —, curto, oral, N na língua; nunca ÉT, que é o 'ett' de contar; (ge)LÉ-CA-re = a GELECA sem o GE, com um -re no fim: força no LÉ, É ABERTO e LONGO (o mesmo É escancarado do LÉÉR de 'Jag lär mig svenska'), CA curto de K duro, e o -re fraquinho, R brando, como o -re de SÊNA-re ('senare') — mas obrigatório: sem ele sobra 'läka', o verbo curar; nunca 'le-CA-re')",
    historia:
      "Guerra de GELECA no pátio: o ciclope solta o grito de guerra — IÁ! — e se vira bem na hora em que uma bola verde ACERTA em cheio o único olho dele (e 'träffa', em sueco, também é acertar o alvo). Ele BERROU: VER! — mas na frente dele só tem TREVA, e o gigante, morrendo de medo do escuro, perde a voz: só consegue COCHICHAR 'tréfa...', e no cochicho o V sai sem voz, F. Ergue UM dedo pro alto: é UM olho só, e esse UM está grudado de geLECA. Puxa, sacode, esfrega e nada; agora só um médico resolve — o único que descola geLECA de olho de ciclope, o LÉ-ca-re.",
  },
  createScene,
}

export default card
