import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vad heter du?" — VÁ! RRÊÊ-ter... DÜ?
 *
 * Primeiro dia do curso de sueco. A recepção é um tanque turquesa e dele
 * emerge um NARVAL de prancheta na nadadeira: solta um VÁ! que espirra água
 * na sala inteira (poças no linóleo), pigarreia RRÊÊ-ter pelo respiradouro
 * (jato de vapor) e estica a presa até encostar a pontinha na etiqueta de nome
 * EM BRANCO do manequim — você: DÜ?
 *
 * Diorama: piso de linóleo verde-claro; tanque de azulejo branco à esquerda
 * com o narval erguido; manequim bege à direita, virado entre o narval e a
 * câmera; a presa cruza o quadro de um ao outro. Acento saturado reservado à
 * faixa vermelha das etiquetas de nome (a do peito é a chave da ponte).
 */

const GY = 0.16 // topo do linóleo

const LINO = '#b9d4aa'
const LINO_LINE = '#9fbf91'
const EDGE = '#5d6c57'
const TILE = '#eef1ee'
const TILE_LINE = '#cad7db'
const POOL_BAND = '#5bbfbb'
const RIM = '#fbfbf7'
const WATER = '#2fb1ad'
const PUDDLE = '#62c6c1'
const FOAM = '#e8f7f5'
const WHALE = '#8199a8'
const WHALE_DARK = '#4f6373'
const WHALE_BELLY = '#cfd9de'
const IVORY = '#f0e6c9'
const IVORY_GROOVE = '#c9b78c'
const BEIGE = '#e2c8a2'
const BEIGE_DARK = '#c7a77d'
const STEEL = '#454a50'
const CHROME = '#c3c9ce'
const DESK = '#c9a06a'
const DESK_DARK = '#a07a49'
const CLIPBOARD = '#8b5a33'
const PAPER = '#fbfaf4'
const INK = '#55606b'
const STEAM = '#f4f8fa'
const TAG_RED = '#e0322a' // acento saturado: as etiquetas de nome (a do peito é a ponte)

// tanque
const TX = -0.95
const TZ = -0.5
const TW = 2.15
const TD = 1.75
const TH = 0.62
const WALL = 0.14
const RIM_TOP = GY + TH + 0.05
const WY = GY + TH - 0.06 // superfície da água

// narval: ponto da água sob o corpo e rumo (gira em y, +x local = frente)
const NX = -1.05
const NZ = -0.55
const NROT = -0.22

// manequim
const MX = 1.28
const MZ = -0.02
const MROT = -0.8
const HIP = 0.6 // altura do quadril do manequim acima do piso

// prancheta no espaço do narval: na frente do peito, do lado da câmera
const CLIP_LOCAL = new THREE.Vector3(0.62, 0.62, 0.66)

const Z = new THREE.Vector3(0, 0, 1)
const Y = new THREE.Vector3(0, 1, 0)

/** Ponto na superfície de um elipsoide (centro c, semi-eixos a,b,cz) na direção d. */
function onEllipsoid(c: THREE.Vector3, a: number, b: number, cz: number, d: THREE.Vector3, inset = 0) {
  const n = d.clone().normalize()
  const t = 1 / Math.sqrt((n.x / a) ** 2 + (n.y / b) ** 2 + (n.z / cz) ** 2)
  return { p: c.clone().addScaledVector(n, t - inset), n }
}

/** Gira o objeto para que o +z local aponte na direção n. */
function orient(obj: THREE.Object3D, n: THREE.Vector3) {
  obj.quaternion.setFromUnitVectors(Z, n.clone().normalize())
}

/** Etiqueta de nome "HEJ": base vermelha, faixa no topo, campo branco embaixo. */
function nameTag(w: number, h: number, scribble: number) {
  const g = new THREE.Group()
  const back = rbox(w, h, 0.012, 0.018, TAG_RED, { roughness: 0.45 })
  g.add(back)
  const field = rbox(w * 0.9, h * 0.6, 0.006, 0.01, PAPER, { roughness: 0.6 })
  field.position.set(0, -h * 0.12, 0.008)
  g.add(field)
  // nome rabiscado à caneta (só nas etiquetas dos outros)
  if (scribble > 0) {
    const n = Math.round(2 + scribble * 2)
    for (let i = 0; i < n; i++) {
      const s = rbox(w * 0.14, 0.012, 0.004, 0.004, INK, { roughness: 0.6 })
      s.position.set(-w * 0.3 + i * w * 0.13, -h * 0.13 + (i % 2 ? 0.012 : -0.008), 0.012)
      s.rotation.z = i % 2 ? -0.5 : 0.55
      g.add(s)
    }
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- base: sala de aula com piso de linóleo ------------------------------
  const base = new THREE.Group()

  const plinth = cylinder(2.62, 2.7, 0.1, EDGE, { roughness: 0.85 })
  plinth.position.y = 0.05
  base.add(plinth)

  const lino = cylinder(2.56, 2.6, 0.06, LINO, { roughness: 0.55 })
  lino.position.y = 0.13
  base.add(lino)

  // juntas das placas de linóleo: cordas do disco nos dois sentidos
  for (let i = -4; i <= 4; i++) {
    const c = i * 0.56 + 0.12
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - c * c, 0.01))
    const lx = rbox(len, 0.008, 0.022, 0.004, LINO_LINE, { roughness: 0.6 })
    lx.position.set(0, GY + 0.002, c)
    base.add(lx)
    const lz = rbox(0.022, 0.008, len, 0.004, LINO_LINE, { roughness: 0.6 })
    lz.position.set(c, GY + 0.002, 0)
    base.add(lz)
  }

  // carteira escolar com livros e a bandeirinha sueca do curso
  const desk = new THREE.Group()
  desk.position.set(1.72, GY, -1.42)
  desk.rotation.y = -0.55
  const top = rbox(0.78, 0.045, 0.5, 0.02, DESK, { roughness: 0.6 })
  top.position.y = 0.6
  desk.add(top)
  const apron = rbox(0.7, 0.08, 0.42, 0.015, DESK_DARK, { roughness: 0.6 })
  apron.position.y = 0.54
  desk.add(apron)
  for (const px of [-0.33, 0.33]) {
    for (const pz of [-0.2, 0.2]) {
      const leg = cylinder(0.018, 0.018, 0.56, STEEL, { roughness: 0.35, metalness: 0.7 })
      leg.position.set(px, 0.28, pz)
      desk.add(leg)
    }
  }
  const books: [number, string][] = [[0.045, '#5f7fa3'], [0.04, '#d9a441'], [0.035, '#7a9a6a']]
  let by = 0.623
  for (const [bh, bc] of books) {
    const b = rbox(0.3, bh, 0.22, 0.012, bc, { roughness: 0.7 })
    b.position.set(-0.17, by + bh / 2, 0.02)
    b.rotation.y = (rand() - 0.5) * 0.3
    desk.add(b)
    by += bh
  }
  const cup = lathe([[0, 0], [0.055, 0], [0.06, 0.12], [0.052, 0.12], [0, 0.01]], '#e9e4da', { roughness: 0.4 })
  cup.position.set(0.22, 0.623, 0.05)
  desk.add(cup)
  const flagPole = cylinder(0.006, 0.006, 0.36, '#d9d4c8', { roughness: 0.5 })
  flagPole.position.set(0.22, 0.8, 0.05)
  desk.add(flagPole)
  const flag = rbox(0.16, 0.1, 0.008, 0.004, '#2f68a8', { roughness: 0.7 })
  flag.position.set(0.3, 0.92, 0.05)
  desk.add(flag)
  const crossV = rbox(0.022, 0.1, 0.01, 0.003, '#e8bf3a', { roughness: 0.7 })
  crossV.position.set(0.27, 0.92, 0.052)
  desk.add(crossV)
  const crossH = rbox(0.16, 0.02, 0.01, 0.003, '#e8bf3a', { roughness: 0.7 })
  crossH.position.set(0.3, 0.92, 0.052)
  desk.add(crossH)
  base.add(desk)

  // cadeira da carteira
  const chair = new THREE.Group()
  chair.position.set(2.05, GY, -0.72)
  chair.rotation.y = -2.2
  const seat = rbox(0.38, 0.04, 0.36, 0.02, '#4f7ea0', { roughness: 0.5 })
  seat.position.y = 0.4
  chair.add(seat)
  const back = rbox(0.38, 0.22, 0.035, 0.02, '#4f7ea0', { roughness: 0.5 })
  back.position.set(0, 0.66, -0.18)
  back.rotation.x = -0.1
  chair.add(back)
  for (const px of [-0.16, 0.16]) {
    for (const pz of [-0.15, 0.15]) {
      const leg = cylinder(0.014, 0.014, 0.4, STEEL, { roughness: 0.35, metalness: 0.7 })
      leg.position.set(px, 0.2, pz)
      chair.add(leg)
    }
    const post = cylinder(0.012, 0.012, 0.3, STEEL, { roughness: 0.35, metalness: 0.7 })
    post.position.set(px, 0.55, -0.17)
    chair.add(post)
  }
  base.add(chair)

  // vaso de planta no canto da frente
  const pot = lathe([[0, 0], [0.13, 0], [0.17, 0.24], [0.185, 0.25], [0.18, 0.28], [0, 0.27]], '#c0714a', { roughness: 0.75 })
  pot.scale.setScalar(0.9)
  pot.position.set(-2.05, GY, -1.35)
  base.add(pot)
  const leaves = puff(0.18, '#5e8f52', 6, 61, { roughness: 0.85 })
  leaves.position.set(-2.05, GY + 0.42, -1.35)
  base.add(leaves)

  root.add(base)

  // ---- tanque de azulejo com água turquesa ---------------------------------
  const tanque = new THREE.Group()

  const wallFB = (z: number) => {
    const w = rbox(TW, TH, WALL, 0.03, TILE, { roughness: 0.35 })
    w.position.set(TX, GY + TH / 2, z)
    return w
  }
  tanque.add(wallFB(TZ + TD / 2 - WALL / 2), wallFB(TZ - TD / 2 + WALL / 2))
  for (const s of [-1, 1]) {
    const w = rbox(WALL, TH, TD - 0.02, 0.03, TILE, { roughness: 0.35 })
    w.position.set(TX + s * (TW / 2 - WALL / 2), GY + TH / 2, TZ)
    tanque.add(w)
  }

  // água: bloco opaco até a superfície, liso e brilhante
  const water = rbox(TW - 2 * WALL + 0.02, WY - GY, TD - 2 * WALL + 0.02, 0.02, WATER, { roughness: 0.08 })
  water.position.set(TX, GY + (WY - GY) / 2, TZ)
  tanque.add(water)

  // borda branca arredondada
  const rimFB = (z: number) => {
    const r = rbox(TW + 0.06, 0.06, WALL + 0.06, 0.028, RIM, { roughness: 0.3 })
    r.position.set(TX, RIM_TOP - 0.03, z)
    return r
  }
  tanque.add(rimFB(TZ + TD / 2 - WALL / 2), rimFB(TZ - TD / 2 + WALL / 2))
  for (const s of [-1, 1]) {
    const r = rbox(WALL + 0.06, 0.06, TD + 0.06, 0.028, RIM, { roughness: 0.3 })
    r.position.set(TX + s * (TW / 2 - WALL / 2), RIM_TOP - 0.03, TZ)
    tanque.add(r)
  }

  // faixa de pastilhas turquesa logo abaixo da borda e juntas dos azulejos
  const frontZ = TZ + TD / 2 + 0.003
  const rightX = TX + TW / 2 + 0.003
  const band = rbox(TW - 0.04, 0.07, 0.01, 0.004, POOL_BAND, { roughness: 0.3 })
  band.position.set(TX, GY + TH - 0.07, frontZ)
  tanque.add(band)
  const bandR = rbox(0.01, 0.07, TD - 0.04, 0.004, POOL_BAND, { roughness: 0.3 })
  bandR.position.set(rightX, GY + TH - 0.07, TZ)
  tanque.add(bandR)
  for (const hy of [0.17, 0.36]) {
    const lf = rbox(TW - 0.06, 0.012, 0.008, 0.003, TILE_LINE, { roughness: 0.5 })
    lf.position.set(TX, GY + hy, frontZ)
    tanque.add(lf)
    const lr = rbox(0.008, 0.012, TD - 0.06, 0.003, TILE_LINE, { roughness: 0.5 })
    lr.position.set(rightX, GY + hy, TZ)
    tanque.add(lr)
  }
  for (let i = 1; i < 8; i++) {
    const vx = TX - TW / 2 + i * (TW / 8)
    const vf = rbox(0.012, TH - 0.12, 0.008, 0.003, TILE_LINE, { roughness: 0.5 })
    vf.position.set(vx, GY + (TH - 0.12) / 2 + 0.01, frontZ)
    tanque.add(vf)
  }
  for (let i = 1; i < 6; i++) {
    const vz = TZ - TD / 2 + i * (TD / 6)
    const vr = rbox(0.008, TH - 0.12, 0.012, 0.003, TILE_LINE, { roughness: 0.5 })
    vr.position.set(rightX, GY + (TH - 0.12) / 2 + 0.01, vz)
    tanque.add(vr)
  }

  // escadinha cromada de piscina na frente, à esquerda
  for (const lx of [TX - 0.78, TX - 0.48]) {
    const hook = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.018, 10, 24, Math.PI),
      mat(CHROME, { roughness: 0.2, metalness: 0.85 }),
    )
    hook.castShadow = true
    hook.rotation.y = Math.PI / 2
    hook.position.set(lx, RIM_TOP + 0.02, TZ + TD / 2 - 0.05)
    tanque.add(hook)
    const railOut = cylinder(0.018, 0.018, TH + 0.06, CHROME, { roughness: 0.2, metalness: 0.85 })
    railOut.position.set(lx, GY + (TH + 0.06) / 2 - 0.01, TZ + TD / 2 + 0.06)
    tanque.add(railOut)
  }
  for (const sy of [0.18, 0.4]) {
    const step = rbox(0.34, 0.022, 0.07, 0.01, CHROME, { roughness: 0.25, metalness: 0.8 })
    step.position.set(TX - 0.63, GY + sy, TZ + TD / 2 + 0.07)
    tanque.add(step)
  }

  root.add(tanque)

  // ---- NARVAL (+x local = frente; construído com o grupo na origem) --------
  const narval = new THREE.Group()

  // tronco inclinado para a frente, saindo da água
  const trunk = new THREE.Group()
  trunk.rotation.z = -0.2
  narval.add(trunk)
  const body = capsule(0.52, 1.1, WHALE, { roughness: 0.55 })
  body.position.y = 0.25
  trunk.add(body)
  const belly = sphere(0.45, WHALE_BELLY, { roughness: 0.6 })
  belly.scale.set(1, 1.55, 1)
  belly.position.set(0.12, 0.3, 0.04)
  trunk.add(belly)

  // manchas escuras achatadas rente à pele (pequenas: ficam nítidas por cima)
  const spotRand = rng(91)
  for (let i = 0; i < 26; i++) {
    const a = 0.7 + spotRand() * 2.2
    const y = -0.1 + spotRand() * 1.25
    const r = 0.028 + spotRand() * 0.03
    const nrm = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
    const spot = sphere(r, WHALE_DARK, { roughness: 0.6 })
    spot.position.set(nrm.x * 0.515, y, nrm.z * 0.515)
    orient(spot, nrm)
    spot.scale.set(1, 0.75 + spotRand() * 0.5, 0.3)
    trunk.add(spot)
  }

  // cabeça redonda + melão na testa + queixo claro
  const HEAD = new THREE.Vector3(0.38, 1.3, 0)
  const HA = 0.5
  const HB = 0.42
  const HC = 0.45
  const head = sphere(0.47, WHALE, { roughness: 0.55 })
  head.scale.set(HA / 0.47, HB / 0.47, HC / 0.47)
  head.position.copy(HEAD)
  narval.add(head)

  const MELON = new THREE.Vector3(0.66, 1.3, 0)
  const melon = sphere(0.33, WHALE, { roughness: 0.55 })
  melon.scale.set(1, 0.95, 1.05)
  melon.position.copy(MELON)
  narval.add(melon)

  const chin = sphere(0.27, WHALE_BELLY, { roughness: 0.6 })
  chin.position.set(0.64, 1.1, 0)
  chin.scale.set(1.05, 0.8, 1.1)
  narval.add(chin)

  for (const s of [-1, 1]) {
    const spot = sphere(0.05, WHALE_DARK, { roughness: 0.6 })
    const { p } = onEllipsoid(HEAD, HA, HB, HC, new THREE.Vector3(-0.4, 0.75, s * 0.55), 0.03)
    spot.position.copy(p)
    narval.add(spot)
  }

  // olhinhos pretos brilhantes, um de cada lado
  for (const s of [-1, 1]) {
    const { p, n } = onEllipsoid(HEAD, HA, HB, HC, new THREE.Vector3(0.62, 0.26, s * 0.74), 0.025)
    const eye = new THREE.Group()
    eye.position.copy(p)
    orient(eye, n)
    const ball = sphere(0.064, '#141619', { roughness: 0.15 })
    ball.scale.z = 0.7
    eye.add(ball)
    const glint = sphere(0.02, '#ffffff', { roughness: 0.1, emissive: '#ffffff', emissiveIntensity: 0.5 })
    glint.position.set(0.018, 0.022, 0.04)
    eye.add(glint)
    const lid = capsule(0.015, 0.07, WHALE_DARK, { roughness: 0.6 })
    lid.rotation.z = Math.PI / 2 + 0.3 // ponta da frente erguida: curiosa, não brava
    lid.position.set(-0.01, 0.105, 0.012)
    eye.add(lid)
    narval.add(eye)
  }

  // sorriso curto no lado que dá para a câmera
  {
    const { p, n } = onEllipsoid(MELON, 0.33, 0.31, 0.35, new THREE.Vector3(0.5, -0.3, 0.8), 0.01)
    const holder = new THREE.Group()
    holder.position.copy(p)
    orient(holder, n)
    const arc = 0.75 * Math.PI
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.017, 8, 24, arc),
      mat('#2c3238', { roughness: 0.5 }),
    )
    smile.rotation.z = -Math.PI / 2 - arc / 2
    holder.add(smile)
    narval.add(holder)
  }

  // respiradouro no alto da cabeça
  const BLOW = new THREE.Vector3(0.3, HEAD.y + HB - 0.02, 0)
  const blowhole = sphere(0.055, '#3b4954', { roughness: 0.5 })
  blowhole.scale.set(1.5, 0.35, 1)
  blowhole.position.copy(BLOW)
  narval.add(blowhole)

  // nadadeiras: a do lado da câmera segura a prancheta (peça própria, em
  // CLIP_LOCAL) — a ponta dobra por cima da quina esquerda da prancheta
  const finFar = capsule(0.11, 0.34, WHALE, { roughness: 0.55 })
  finFar.scale.set(1, 1, 0.45)
  finFar.position.set(0.3, 0.62, -0.5)
  finFar.rotation.set(-0.5, -0.25, -1.15)
  narval.add(finFar)
  {
    const from = new THREE.Vector3(0.12, 0.74, 0.44)
    const to = new THREE.Vector3(0.47, 0.6, 0.8)
    const dir = to.clone().sub(from)
    const fin = capsule(0.115, Math.max(0.01, dir.length() - 0.1), WHALE, { roughness: 0.55 })
    fin.position.copy(from).add(to).multiplyScalar(0.5)
    fin.quaternion.setFromUnitVectors(Y, dir.normalize())
    fin.scale.set(1, 1, 0.55)
    narval.add(fin)
    const tip = sphere(0.1, WHALE, { roughness: 0.55 })
    tip.scale.set(0.8, 1.15, 0.6)
    tip.position.copy(to)
    narval.add(tip)
  }

  // pose do narval no tanque
  narval.position.set(NX, WY, NZ)
  narval.rotation.y = NROT
  root.add(narval)

  // ---- manequim bege (você) -------------------------------------------------
  const manequim = new THREE.Group()
  manequim.position.set(MX, GY, MZ)
  manequim.rotation.y = MROT

  const foot = lathe(
    [[0, 0], [0.24, 0], [0.25, 0.025], [0.2, 0.055], [0.06, 0.07], [0, 0.07]],
    STEEL,
    { roughness: 0.35, metalness: 0.7 },
  )
  manequim.add(foot)
  const pole = cylinder(0.024, 0.024, HIP - 0.05, STEEL, { roughness: 0.3, metalness: 0.75 })
  pole.position.y = 0.05 + (HIP - 0.05) / 2
  manequim.add(pole)
  const collar = cylinder(0.05, 0.05, 0.05, STEEL, { roughness: 0.3, metalness: 0.75 })
  collar.position.y = HIP - 0.01
  manequim.add(collar)

  const torsoG = new THREE.Group()
  torsoG.position.y = HIP
  torsoG.scale.z = 0.68
  manequim.add(torsoG)
  const torso = lathe(
    [
      [0, 0], [0.17, 0], [0.2, 0.04], [0.195, 0.14], [0.168, 0.25], [0.19, 0.38],
      [0.225, 0.5], [0.236, 0.58], [0.22, 0.64], [0.16, 0.685], [0.075, 0.7], [0, 0.7],
    ],
    BEIGE,
    { roughness: 0.45 },
    48,
  )
  torsoG.add(torso)
  for (const [ry, rr] of [[0.25, 0.168], [0.02, 0.18]] as const) {
    const seam = torus(rr, 0.007, BEIGE_DARK, { roughness: 0.5 })
    seam.rotation.x = Math.PI / 2
    seam.position.y = ry
    torsoG.add(seam)
  }
  for (const s of [-1, 1]) {
    const shoulder = sphere(0.085, BEIGE, { roughness: 0.45 })
    shoulder.scale.set(0.9, 1.1, 0.95)
    shoulder.position.set(s * 0.215, HIP + 0.585, 0)
    manequim.add(shoulder)
    const cap = cylinder(0.06, 0.06, 0.012, BEIGE_DARK, { roughness: 0.5 })
    cap.rotation.z = Math.PI / 2
    cap.position.set(s * 0.29, HIP + 0.575, 0)
    manequim.add(cap)
  }
  const neck = cylinder(0.062, 0.075, 0.16, BEIGE, { roughness: 0.45 })
  neck.position.y = HIP + 0.76
  manequim.add(neck)
  const headM = sphere(0.15, BEIGE, { roughness: 0.4 })
  headM.scale.set(0.92, 1.2, 1)
  headM.position.y = HIP + 0.97
  manequim.add(headM)

  root.add(manequim)

  // ---- a SUA etiqueta: em branco, no peito do manequim ----------------------
  const TAG_Y = HIP + 0.47
  const TAG_Z = 0.222 * 0.68 + 0.012
  const etiqueta = new THREE.Group()
  etiqueta.position.set(0, TAG_Y, TAG_Z)
  etiqueta.rotation.x = -0.16
  etiqueta.add(nameTag(0.33, 0.24, 0))
  manequim.add(etiqueta)

  // ---- etiquetas dos outros, soltas sobre a borda --------------------------
  const etiquetas = new THREE.Group()
  const RIM_FRONT_Z = TZ + TD / 2 - WALL / 2
  etiquetas.position.set(TX + 0.55, RIM_TOP, RIM_FRONT_Z)
  const loose: [number, number, number][] = [[-0.26, 0.25, 0.7], [0.02, -0.18, 1.0], [0.3, 0.12, 0.5]]
  for (const [lx, yaw, sc] of loose) {
    const t = nameTag(0.2, 0.15, sc)
    t.rotation.set(-Math.PI / 2 + 0.22, 0, yaw)
    t.position.set(lx, 0.012, 0.01)
    etiquetas.add(t)
  }
  root.add(etiquetas)

  // ---- prancheta na nadadeira -----------------------------------------------
  root.updateMatrixWorld(true)
  const CLIP_AT = narval.localToWorld(CLIP_LOCAL.clone())
  const prancheta = new THREE.Group()
  prancheta.position.copy(CLIP_AT)
  prancheta.rotation.set(-0.18, 0.2, 0.12)
  const board = rbox(0.4, 0.52, 0.025, 0.03, CLIPBOARD, { roughness: 0.6 })
  prancheta.add(board)
  const sheet = rbox(0.34, 0.42, 0.008, 0.01, PAPER, { roughness: 0.75 })
  sheet.position.set(0, -0.03, 0.016)
  prancheta.add(sheet)
  const clip = rbox(0.17, 0.06, 0.03, 0.012, CHROME, { roughness: 0.25, metalness: 0.8 })
  clip.position.set(0, 0.24, 0.025)
  prancheta.add(clip)
  const clipRing = torus(0.03, 0.008, CHROME, { roughness: 0.25, metalness: 0.8 })
  clipRing.position.set(0, 0.275, 0.02)
  prancheta.add(clipRing)
  for (let i = 0; i < 5; i++) {
    const ly = 0.12 - i * 0.07
    const box = rbox(0.03, 0.03, 0.006, 0.004, INK, { roughness: 0.6 })
    box.position.set(-0.12, ly, 0.022)
    prancheta.add(box)
    const line = rbox(0.17 - (i % 3) * 0.03, 0.012, 0.004, 0.004, INK, { roughness: 0.6 })
    line.position.set(0.0 - (i % 3) * 0.015, ly, 0.022)
    prancheta.add(line)
  }
  root.add(prancheta)

  // ---- respingos do VÁ!: espuma em volta do narval e poças no linóleo ------
  const respingo = new THREE.Group()
  respingo.position.set(TX, 0, TZ)
  const foam = torus(0.6, 0.05, FOAM, { roughness: 0.5 })
  foam.rotation.x = Math.PI / 2
  foam.position.set(NX - TX + 0.08, WY + 0.01, NZ - TZ)
  respingo.add(foam)
  const ripple = torus(0.82, 0.022, '#8fd8d3', { roughness: 0.3 })
  ripple.rotation.x = Math.PI / 2
  ripple.position.set(NX - TX + 0.08, WY + 0.005, NZ - TZ)
  respingo.add(ripple)
  const puddles: [number, number, number][] = [
    [0.75, 1.25, 0.26], [1.45, 0.95, 0.2], [-0.55, 1.35, 0.22], [1.55, 0.25, 0.16], [0.2, 1.75, 0.13],
  ]
  for (const [px, pz, pr] of puddles) {
    for (let k = 0; k < 3; k++) {
      const r = pr * (k === 0 ? 1 : 0.55 + rand() * 0.25)
      const blob = cylinder(r, r, 0.012, PUDDLE, { roughness: 0.05 }, 28)
      const a = rand() * Math.PI * 2
      blob.position.set(px + (k ? Math.cos(a) * pr * 0.75 : 0), GY + 0.006, pz + (k ? Math.sin(a) * pr * 0.6 : 0))
      blob.scale.z = 0.7
      respingo.add(blob)
    }
  }
  for (let i = 0; i < 10; i++) {
    const drop = sphere(0.025 + rand() * 0.02, PUDDLE, { roughness: 0.05 })
    drop.scale.y = 0.5
    drop.position.set(0.3 + rand() * 1.6, GY + 0.01, 0.6 + rand() * 1.2)
    respingo.add(drop)
  }
  // gotas na borda do tanque
  for (let i = 0; i < 6; i++) {
    const drop = sphere(0.022 + rand() * 0.015, PUDDLE, { roughness: 0.05 })
    drop.scale.y = 0.6
    drop.position.set(0.15 + rand() * 0.75, RIM_TOP + 0.005, TD / 2 - WALL / 2 + (rand() - 0.5) * 0.1)
    respingo.add(drop)
  }
  root.add(respingo)

  // ---- jato de vapor do RRÊÊ-ter (do respiradouro para cima) ---------------
  const BLOW_W = narval.localToWorld(BLOW.clone())
  const vapor = new THREE.Group()
  vapor.position.copy(BLOW_W)
  const steamCol: [number, number, number, number][] = [
    [0, 0.07, 0.075, 1], [0.02, 0.24, 0.11, 2], [-0.02, 0.45, 0.15, 3],
  ]
  for (const [sx, sy, sr, seed] of steamCol) {
    const p = puff(sr, STEAM, 5, 70 + seed, { roughness: 0.95 })
    p.position.set(sx, sy, 0)
    vapor.add(p)
  }
  for (const s of [-1, 1]) {
    const wisp = puff(0.08, STEAM, 3, 80 + s, { roughness: 0.95 })
    wisp.position.set(s * 0.2, 0.5, 0.04)
    vapor.add(wisp)
  }
  root.add(vapor)

  // ---- a PRESA espiralada: da boca do narval até a etiqueta em branco -------
  root.updateMatrixWorld(true)
  const TUSK_BASE = narval.localToWorld(new THREE.Vector3(0.95, 1.27, 0.05))
  const TUSK_TIP = etiqueta.localToWorld(new THREE.Vector3(0, -0.03, 0.006))
  const tuskDir = TUSK_TIP.clone().sub(TUSK_BASE)
  const L = tuskDir.length()
  tuskDir.normalize()

  const presa = new THREE.Group()
  presa.position.copy(TUSK_BASE)
  presa.quaternion.setFromUnitVectors(Y, tuskDir)
  const R0 = 0.07
  const R1 = 0.007
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(R1, R0, L, 32, 24).translate(0, L / 2, 0),
    mat(IVORY, { roughness: 0.35 }),
  )
  shaft.castShadow = true
  shaft.receiveShadow = true
  presa.add(shaft)
  // sulco em espiral ao longo da presa
  const turns = 7
  const helixPts: THREE.Vector3[] = []
  for (let i = 0; i <= 160; i++) {
    const t = (i / 160) * 0.9
    const r = R0 + (R1 - R0) * t
    const a = t * turns * Math.PI * 2
    helixPts.push(new THREE.Vector3(Math.cos(a) * r, t * L, Math.sin(a) * r))
  }
  const groove = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts), 320, 0.011, 6, false),
    mat(IVORY_GROOVE, { roughness: 0.45 }),
  )
  groove.castShadow = true
  presa.add(groove)
  const gum = torus(0.075, 0.03, WHALE, { roughness: 0.55 })
  gum.rotation.x = Math.PI / 2
  gum.position.y = 0.02
  presa.add(gum)
  root.add(presa)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'tanque', group: 'sala', object: tanque },
    { name: 'manequim', group: 'voce', object: manequim },
    { name: 'etiqueta', group: 'voce', object: etiqueta },
    { name: 'etiquetas', group: 'voce', object: etiquetas },
    { name: 'narval', group: 'narval', object: narval },
    { name: 'prancheta', group: 'narval', object: prancheta },
    { name: 'respingo', group: 'va', object: respingo },
    { name: 'vapor', group: 'heter', object: vapor },
    { name: 'presa', group: 'du', object: presa },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const NARVAL_DEPTH = 2.3
  const CLIP_Y = CLIP_AT.y

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Primeiro dia do curso de sueco: a sala de aula brota do chão, com um tanque turquesa na recepção…',
    }),
    seq('tanque-rise', 'tanque', 0.25, 0.9, [riseFrom(0, 1.0)], { ease: 'easeOut' }),

    seq('manequim-rise', 'manequim', 1.9, 0.8, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'Todo mundo chega de etiqueta de nome no peito — e a SUA está em branco.',
    }),
    seq('etiqueta-pop', 'etiqueta', 2.55, 0.5, s3(0.01, 1), { ease: 'easeOut' }),
    seq('etiquetas-pop', 'etiquetas', 2.8, 0.5, s3(0.01, 1), { ease: 'easeOut' }),

    seq('narval-rise', 'narval', 3.9, 1.1, [riseFrom(WY, NARVAL_DEPTH)], {
      ease: 'easeOut',
      caption: 'Da água emerge a recepcionista: um NARVAL de quatro metros, de prancheta na nadadeira.',
    }),
    seq('prancheta-rise', 'prancheta', 3.9, 1.1, [riseFrom(CLIP_Y, NARVAL_DEPTH)], { ease: 'easeOut' }),

    seq('narval-pula', 'narval', 5.7, 0.3, [ch('position.y', WY, WY + 0.16)], {
      ease: 'easeOut',
      caption: 'Ele solta um VÁ! que espirra água na sala inteira…',
    }),
    seq('prancheta-pula', 'prancheta', 5.7, 0.3, [ch('position.y', CLIP_Y, CLIP_Y + 0.16)], { ease: 'easeOut' }),
    seq('narval-cai', 'narval', 6.0, 0.35, [ch('position.y', WY + 0.16, WY)], { ease: 'easeIn' }),
    seq('prancheta-cai', 'prancheta', 6.0, 0.35, [ch('position.y', CLIP_Y + 0.16, CLIP_Y)], { ease: 'easeIn' }),
    seq('respingo-espalha', 'respingo', 6.2, 0.6, [
      ch('scale.x', 0.25, 1), ch('scale.y', 0.2, 1), ch('scale.z', 0.25, 1),
    ], { ease: 'easeOut' }),

    seq('vapor-jato', 'vapor', 7.5, 0.9, s3(0.01, 1), {
      ease: 'easeOut',
      caption: '…e pigarreia pelo respiradouro: RRÊÊ-ter! — um jato de vapor que embaça os óculos de todo mundo.',
    }),

    seq('presa-estica', 'presa', 9.4, 1.1, [ch('scale.y', 0.02, 1)], {
      ease: 'easeOut',
      caption: 'Aí estica a presa de dois metros e encosta a pontinha na sua etiqueta vazia: DÜ?',
    }),
    seq('etiqueta-boop', 'etiqueta', 10.45, 0.18, s3(1, 1.18), { ease: 'easeOut' }),
    seq('etiqueta-volta', 'etiqueta', 10.63, 0.3, s3(1.18, 1), { ease: 'easeIn' }),

    seq('prancheta-anota', 'prancheta', 11.3, 0.6, [ch('rotation.z', 0.4, 0.12)], {
      ease: 'easeInOut',
      caption: 'Vad heter du? — Qual é o seu nome?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 2.4, 5.05], target: [0.1, 1.45, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-heter-du',
    contexto:
      "Apresentação: quando o outro não se apresentou — criança no parquinho ou na förskola, colega novo no curso de SFI, alguém na fila de atendimento, ou quando você esqueceu o nome de quem já conhece. Entre adultos o sueco costuma dizer o próprio nome primeiro ('Jag heter...') e esperar o seu.",
    fraseFonte: 'Qual é o seu nome?',
    fraseAlvo: 'Vad heter du?',
    pronuncia:
      "va RRÊÊ-ter dü? ('vad' = VÁ, o D não soa; 'heter' com H soprado — um RR carioca levinho, nunca vibrado — e Ê FECHADO e LONGO de 'você', com a força toda nele; o -ter é fraquinho e o R dele se funde com o D de 'du' num D de língua enrolada pra trás, como em 'Hur mår du?'; 'du' com bico de pato: dü)",
    ponteSonora:
      "VÁ! RRÊÊ-ter... DÜ? (4 sílabas: va-RRÊÊ-te-dü; a força TODA no RRÊÊ; VÁ é o MESMO 'vad' de 'VÁ, ASSADO?!', 'VÁ, CÜL!' e 'VÁ! É CLÓ-CAN' — um grito SEM R e sem adereço: com R vira 'var' (onde); RRÊÊ-ter é o MESMO 'heter' de 'Jag heter...' e 'Vad heter det på svenska?': o pigarro raspado, em que o RR é só o sopro do h, LEVE, nunca vibrado, com Ê FECHADO de 'você', longo, e o -ter curtinho, cujo R encosta no D e some dentro dele, língua enrolada pra trás, como o sueco funde o 'rd'; DÜ = o 'du' de CAN-DU, com BICO DE PATO, e é ele que separa esta carta de 'Vad heter det på svenska?': lá o alce aponta um OBJETO (DÊ, isso), aqui a presa do narval aponta VOCÊ (DÜ))",
    historia:
      'Primeiro dia do curso de sueco: todo mundo com etiqueta de nome no peito, e a sua em branco. A recepção é um tanque, e de dentro dele emerge um narval de quatro metros com uma prancheta na nadadeira. Ele solta um VÁ! que espirra água na sala inteira e depois pigarreia pelo respiradouro — RRÊÊÊ-ter! —, um jato de vapor que embaça os óculos de todo mundo. Aí estica a presa de dois metros e encosta a pontinha, devagar, bem no meio da sua etiqueta vazia: DÜ? — e VOCÊ, qual é o seu nome?',
  },
  createScene,
  refine: { organic: ['narval'] },
}

export default card
