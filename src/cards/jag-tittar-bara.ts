import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, shoulderPivot,
  rbox, cylinder, sphere, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Jag tittar bara." — na chocolateria da dona TITA, o mímico entra em pânico
 * com o "posso ajudar?": rompe o silêncio — IÁ! —, aponta o rótulo TÍTA-R…
 * e a BARRA de chocolate gigante — BÁRA! — e volta a olhar de binóculo,
 * sem comprar nada.
 *
 * O acento saturado (dourado) é reservado ao papel da barra com o nome TITA.
 */

const PLANK = '#5a3826'
const PLANK_LINE = '#3d2418'
const WOOD_DARK = '#3b2419'
const CHOC = '#5b3420'
const CHOC_LIGHT = '#6e4129'
const GOLD = '#e8b02c' // acento: papel dourado da barra (TITA)
const GOLD_DARK = '#c18d1d'
const LABEL = '#f6efe2'
const INK = '#4a2414'
const BRASS = '#c9a35a'
const GLASS = '#bfe0ee'
const BLACK = '#1f1d22'
const WHITE = '#f4f2ee'
const FACE = '#f2eee8'
const GLOVE = '#ffffff'
const RED = '#b83a35'

const GY = 0.18 // topo da base do diorama
const H = 1.65 // altura do mímico
const MIME: [number, number, number] = [-0.78, GY, 0.45]
const MIME_ROT = 0.55

const CASE_X = 0.72
const CASE_Z = -0.25
const PLINTH_H = 0.24
const GLASS_H = 1.55
const CASE_W = 1.2
const CASE_D = 0.78
const GLASS_Y0 = GY + PLINTH_H
const CASE_TOP = GLASS_Y0 + GLASS_H

const BAR_W = 0.82
const BAR_H = 1.36
const BAR_D = 0.14
const BAR_Y = GLASS_Y0 + 0.04 + BAR_H / 2
const PAPER_H = 0.62

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.025, 0.007, INK, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** T I T A — traço grosso, legível do ângulo da câmera. */
function letter(which: 'T' | 'I' | 'A') {
  const g = new THREE.Group()
  const t = 0.034
  const h = 0.17
  if (which === 'T') {
    g.add(stroke(0.13, t, 0, h / 2 - t / 2))
    g.add(stroke(t, h, 0, 0))
  } else if (which === 'I') {
    g.add(stroke(t, h, 0, 0))
  } else {
    g.add(stroke(t, h + 0.01, -0.032, 0, -0.33))
    g.add(stroke(t, h + 0.01, 0.032, 0, 0.33))
    g.add(stroke(0.07, 0.028, 0, -0.03))
  }
  return g
}

/** Bombom: trufa redonda num forminho de papel plissado. */
function bombom(color: string) {
  const g = new THREE.Group()
  const cup = lathe(
    [[0, 0], [0.07, 0], [0.085, 0.02], [0.1, 0.06], [0.094, 0.062], [0, 0.03]],
    '#6b3f27',
    { roughness: 0.8 },
    14,
  )
  g.add(cup)
  const ball = sphere(0.085, color, { roughness: 0.35 })
  ball.position.y = 0.1
  ball.scale.y = 0.92
  g.add(ball)
  const drizzle = torus(0.06, 0.012, '#f7f0e4', { roughness: 0.4 })
  drizzle.rotation.x = Math.PI / 2
  drizzle.position.y = 0.155
  g.add(drizzle)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: assoalho de tábuas cor de chocolate ----------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.32, 2.42, 0.12, '#2a1a12', { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)
  const floor = cylinder(2.25, 2.32, 0.07, PLANK, { roughness: 0.8 })
  floor.position.y = 0.145
  base.add(floor)
  for (const x of [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8]) {
    const len = 2 * Math.sqrt(Math.max(2.2 * 2.2 - x * x, 0.01))
    const line = rbox(0.04, 0.02, len, 0.008, PLANK_LINE, { roughness: 0.9 })
    line.position.set(x, GY + 0.002, 0)
    base.add(line)
  }
  root.add(base)

  // ---- loja: caixote de cacau e pilha de caixas de presente ----------------
  const loja = new THREE.Group()
  // latas redondas de chocolate empilhadas
  const tins = new THREE.Group()
  tins.position.set(1.62, GY, 0.45)
  tins.scale.setScalar(0.85)
  const tinDefs: [number, number, string, number, number][] = [
    [0.24, 0.16, '#3f6b6a', 0, 0],
    [0.2, 0.14, '#8c3b46', 0.02, 0.16],
    [0.15, 0.12, '#d8c7a2', -0.01, 0.3],
  ]
  for (const [r, h, c, dx, y] of tinDefs) {
    const tin = cylinder(r, r, h, c, { roughness: 0.4, metalness: 0.5 })
    tin.position.set(dx, y + h / 2, 0)
    tins.add(tin)
    const lid = cylinder(r + 0.012, r + 0.012, 0.03, '#d9b25e', { roughness: 0.3, metalness: 0.7 })
    lid.position.set(dx, y + h - 0.01, 0)
    tins.add(lid)
  }
  loja.add(tins)

  const gifts = new THREE.Group()
  gifts.position.set(-1.65, GY, -0.75)
  const giftDefs: [number, number, string, number][] = [
    [0.42, 0.22, '#7c3a4a', 0.11],
    [0.32, 0.18, '#3e5d4a', 0.31],
    [0.22, 0.14, '#d9c8a8', 0.47],
  ]
  for (const [w, h, c, y] of giftDefs) {
    const b = rbox(w, h, w * 0.85, 0.025, c, { roughness: 0.7 })
    b.position.y = y
    b.rotation.y = (rand() - 0.5) * 0.5
    gifts.add(b)
    const ribbon = rbox(w + 0.01, h + 0.01, 0.04, 0.01, '#e7d9b8', { roughness: 0.5 })
    ribbon.position.y = y
    ribbon.rotation.y = b.rotation.y
    gifts.add(ribbon)
  }
  loja.add(gifts)
  root.add(loja)

  // ---- vitrine de vidro -----------------------------------------------------
  const vitrine = new THREE.Group()
  vitrine.position.set(CASE_X, 0, CASE_Z)
  vitrine.rotation.y = -0.18

  const plinth = rbox(CASE_W + 0.1, PLINTH_H, CASE_D + 0.1, 0.035, WOOD_DARK, { roughness: 0.6 })
  plinth.position.y = GY + PLINTH_H / 2
  vitrine.add(plinth)
  const trim = rbox(CASE_W + 0.12, 0.04, CASE_D + 0.12, 0.015, BRASS, { roughness: 0.3, metalness: 0.8 })
  trim.position.y = GLASS_Y0 - 0.02
  vitrine.add(trim)

  const velvet = rbox(CASE_W - 0.02, 0.025, CASE_D - 0.02, 0.01, '#5a2430', { roughness: 0.95 })
  velvet.position.y = GLASS_Y0 + 0.012
  vitrine.add(velvet)

  const cap = rbox(CASE_W + 0.1, 0.07, CASE_D + 0.1, 0.03, WOOD_DARK, { roughness: 0.6 })
  cap.position.y = CASE_TOP + 0.035
  vitrine.add(cap)

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = cylinder(0.025, 0.025, GLASS_H, BRASS, { roughness: 0.3, metalness: 0.8 })
      post.position.set(sx * CASE_W / 2, GLASS_Y0 + GLASS_H / 2, sz * CASE_D / 2)
      vitrine.add(post)
    }
  }

  const glassMat = new THREE.MeshStandardMaterial({
    color: GLASS,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  })
  const pane = (w: number, d: number, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, GLASS_H, d), glassMat)
    m.position.set(x, GLASS_Y0 + GLASS_H / 2, z)
    m.renderOrder = 5
    return m
  }
  vitrine.add(pane(CASE_W, 0.012, 0, CASE_D / 2))
  vitrine.add(pane(CASE_W, 0.012, 0, -CASE_D / 2))
  vitrine.add(pane(0.012, CASE_D, -CASE_W / 2, 0))
  vitrine.add(pane(0.012, CASE_D, CASE_W / 2, 0))
  // reflexo na vidraça da frente: faixa clara diagonal
  const glint = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, GLASS_H * 0.8),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, depthWrite: false }),
  )
  glint.position.set(-0.36, GLASS_Y0 + GLASS_H * 0.55, CASE_D / 2 + 0.008)
  glint.rotation.z = -0.35
  glint.renderOrder = 6
  vitrine.add(glint)
  root.add(vitrine)

  // ---- barra de chocolate gigante, em pé ------------------------------------
  const barra = new THREE.Group()
  barra.position.set(CASE_X, BAR_Y, CASE_Z)
  barra.rotation.y = -0.18

  const slab = rbox(BAR_W, BAR_H, BAR_D, 0.03, CHOC, { roughness: 0.4 })
  barra.add(slab)
  const cols = 3
  const rows = 6
  const gw = (BAR_W - 0.08) / cols
  const gh = (BAR_H - 0.08) / rows
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const gomo = rbox(gw - 0.035, gh - 0.035, 0.05, 0.02, CHOC_LIGHT, { roughness: 0.35 })
      gomo.position.set(-BAR_W / 2 + 0.04 + gw * (c + 0.5), -BAR_H / 2 + 0.04 + gh * (r + 0.5), BAR_D / 2 + 0.01)
      barra.add(gomo)
    }
  }
  root.add(barra)

  // ---- papel dourado meio aberto na base da barra --------------------------
  const papel = new THREE.Group()
  papel.position.set(CASE_X, GLASS_Y0 + 0.02, CASE_Z)
  papel.rotation.y = -0.18
  const wrap = rbox(BAR_W + 0.05, PAPER_H, BAR_D + 0.1, 0.02, GOLD, { roughness: 0.3, metalness: 0.6 })
  wrap.position.y = PAPER_H / 2
  papel.add(wrap)
  // borda rasgada: dentes alternados na boca do papel
  for (let i = 0; i < 9; i++) {
    const tooth = rbox(0.07, 0.07, BAR_D + 0.1, 0.01, GOLD, { roughness: 0.3, metalness: 0.6 })
    tooth.position.set(-BAR_W / 2 + 0.03 + i * ((BAR_W - 0.02) / 8), PAPER_H + (i % 2 ? 0.0 : 0.012), 0)
    tooth.rotation.z = Math.PI / 4
    tooth.scale.y = 0.7 + (i % 3) * 0.2
    papel.add(tooth)
  }
  // aba descolada, dobrada para fora no lado direito
  const flap = rbox(0.26, 0.42, 0.012, 0.01, GOLD_DARK, { roughness: 0.3, metalness: 0.6 })
  flap.scale.set(0.8, 0.6, 1)
  flap.position.set(BAR_W / 2 - 0.02, PAPER_H + 0.08, BAR_D / 2 + 0.06)
  flap.rotation.set(0.35, 0, -0.45)
  papel.add(flap)
  root.add(papel)

  // ---- rótulo TITA no papel dourado ----------------------------------------
  const rotulo = new THREE.Group()
  rotulo.position.set(CASE_X, GLASS_Y0 + 0.02 + PAPER_H * 0.47, CASE_Z)
  rotulo.rotation.y = -0.18
  const plate = rbox(0.66, 0.28, 0.03, 0.05, LABEL, { roughness: 0.5 })
  plate.position.z = (BAR_D + 0.1) / 2 + 0.012
  rotulo.add(plate)
  const rim = rbox(0.6, 0.22, 0.02, 0.04, '#e3d3b4', { roughness: 0.5 })
  rim.position.z = (BAR_D + 0.1) / 2 + 0.022
  rotulo.add(rim)
  const glyphs: ['T' | 'I' | 'A', number][] = [['T', -0.19], ['I', -0.075], ['T', 0.04], ['A', 0.185]]
  for (const [gch, lx] of glyphs) {
    const l = letter(gch)
    l.position.set(lx, 0, (BAR_D + 0.1) / 2 + 0.036)
    rotulo.add(l)
  }
  root.add(rotulo)

  // ---- três bombons em cima da vitrine -------------------------------------
  const bombons = new THREE.Group()
  bombons.position.set(CASE_X, CASE_TOP + 0.07, CASE_Z)
  bombons.rotation.y = -0.18
  const bonbonDefs: [string, number, number][] = [['#e88aa6', -0.34, 0.12], ['#8fbf6a', 0, 0.16], ['#f0d35a', 0.34, 0.1]]
  for (const [c, x, z] of bonbonDefs) {
    const b = bombom(c)
    b.position.set(x, 0, z)
    bombons.add(b)
  }
  root.add(bombons)

  // ---- mímico ---------------------------------------------------------------
  const mimico = person({ body: BLACK, skin: FACE, height: H, armAngle: 0.25 })
  mimico.position.set(...MIME)
  mimico.rotation.y = MIME_ROT
  const bodyH = H * 0.52
  const bodyR = H * 0.17
  const headR = H * 0.19

  // contorno real do corpo esculpido numa altura y (para listras e
  // suspensórios abraçarem o tronco em vez de flutuar)
  const bodyMesh = mimico.getObjectByName('body') as THREE.Mesh
  const girth = (y: number) => {
    const pos = bodyMesh.geometry.attributes.position
    const ly = y - bodyMesh.position.y
    let rx = 0, zf = 0, zb = 0
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getY(i) - ly) > 0.02) continue
      rx = Math.max(rx, Math.abs(pos.getX(i)))
      zf = Math.max(zf, pos.getZ(i))
      zb = Math.max(zb, -pos.getZ(i))
    }
    return { rx: rx || bodyR, zf: zf || bodyR, zb: zb || bodyR }
  }

  // camisa listrada: faixas brancas no tronco, abraçando o contorno
  for (let i = 0; i < 4; i++) {
    const y = H * (0.25 + i * 0.05)
    const g = girth(y)
    const R = (g.rx + (g.zf + g.zb) / 2) / 2
    const stripe = torus(R, 0.016, WHITE, { roughness: 0.85 })
    stripe.rotation.x = Math.PI / 2
    stripe.scale.set(g.rx / R + 0.01, (g.zf + g.zb) / 2 / R + 0.01, 0.9)
    stripe.position.set(0, y, (g.zf - g.zb) / 2)
    mimico.add(stripe)
  }
  // suspensórios vermelhos: segmentos colados à frente do tronco
  for (const side of [-1, 1]) {
    const x = side * bodyR * 0.4
    const ys = [0.2, 0.25, 0.3, 0.35, 0.4, 0.44].map((k) => H * k)
    for (let i = 0; i < ys.length - 1; i++) {
      const y0 = ys[i], y1 = ys[i + 1]
      const z0 = girth(y0).zf, z1 = girth(y1).zf
      const len = Math.hypot(y1 - y0, z1 - z0)
      const seg = rbox(0.05, len + 0.02, 0.022, 0.01, RED, { roughness: 0.6 })
      seg.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2 + 0.006)
      seg.rotation.x = Math.atan2(z0 - z1, y1 - y0)
      mimico.add(seg)
    }
    const button = sphere(0.02, '#f0e2c0', { roughness: 0.3 })
    button.position.set(x, ys[0] + 0.01, girth(ys[0]).zf + 0.02)
    mimico.add(button)
  }

  // tecido preto liso: sem o grão de superfície que vira poeira no preto
  mimico.traverse((o) => {
    const m = o as THREE.Mesh
    const mt = m.material as THREE.MeshStandardMaterial | undefined
    if (m.isMesh && mt && new THREE.Color(BLACK).equals(mt.color)) {
      mt.roughness = 0.7
      mt.normalScale?.set(0.06, 0.06)
    }
  })

  const head = mimico.getObjectByName('head') as THREE.Group
  // lábios vermelhos arregalados num Ó
  const cavity = sphere(headR * 0.18, '#3a1416', { roughness: 0.7 })
  cavity.position.set(0, -headR * 0.42, headR * 0.8)
  head.add(cavity)
  const lips = torus(headR * 0.2, headR * 0.075, RED, { roughness: 0.35 })
  lips.position.set(0, -headR * 0.42, headR * 0.86)
  lips.scale.y = 1.2
  head.add(lips)
  // sobrancelhas pretas arqueadas, de susto
  for (const side of [-1, 1]) {
    const brow = rbox(headR * 0.32, headR * 0.06, 0.02, 0.01, BLACK, { roughness: 0.5 })
    brow.position.set(side * headR * 0.38, headR * 0.42, headR * 0.9)
    brow.rotation.z = side * -0.25
    head.add(brow)
  }

  // braços: pivô no ombro; pose final = binóculo diante dos olhos
  const arms: Record<'armL' | 'armR', THREE.Mesh> = {
    armL: mimico.getObjectByName('armL') as THREE.Mesh,
    armR: mimico.getObjectByName('armR') as THREE.Mesh,
  }
  const pose: Record<string, [number, number, number]> = {}
  const eyeY = bodyH + headR * 0.85 + headR * 0.12
  for (const name of ['armL', 'armR'] as const) {
    const arm = arms[name]
    const side = name === 'armL' ? -1 : 1
    shoulderPivot(arm, H)
    // listras na manga
    const apos = arm.geometry.attributes.position
    for (let i = 0; i < 3; i++) {
      const y = -0.15 - i * 0.12
      let r = 0
      for (let k = 0; k < apos.count; k++) {
        if (Math.abs(apos.getY(k) - y) < 0.015) r = Math.max(r, Math.hypot(apos.getX(k), apos.getZ(k)))
      }
      const s = torus((r || bodyR * 0.38) + 0.002, 0.012, WHITE, { roughness: 0.85 })
      s.rotation.x = Math.PI / 2
      s.position.y = y
      arm.add(s)
    }
    const target = new THREE.Vector3(side * headR * 0.36, eyeY, headR * 1.4)
    const dir = target.sub(arm.position).normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir)
    const e = new THREE.Euler().setFromQuaternion(q)
    arm.rotation.copy(e)
    pose[name] = [e.x, e.y, e.z]

    // luva em tubo: o "binóculo", apontado para a frente do mímico
    const hand = arm.children.find((c) => (c as THREE.Mesh).isMesh && c.position.y < -0.2) as THREE.Object3D
    const tube = lathe(
      [[0.04, 0], [0.062, 0], [0.068, 0.07], [0.062, 0.13], [0.04, 0.13], [0.04, 0]],
      GLOVE,
      { roughness: 0.6 },
      24,
    )
    const qInv = q.clone().invert()
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(qInv)
    tube.quaternion.copy(qInv).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2))
    tube.position.copy(hand.position).addScaledVector(fwd, 0.02)
    arm.add(tube)
    const cuff = torus(bodyR * 0.36, 0.02, GLOVE, { roughness: 0.6 })
    cuff.rotation.x = Math.PI / 2
    cuff.position.y = hand.position.y + 0.1
    arm.add(cuff)
  }
  root.add(mimico)

  // ---- boina preta (filha da cabeça) ----------------------------------------
  const boina = new THREE.Group()
  boina.position.set(0, headR * 0.72, -headR * 0.05)
  boina.rotation.set(-0.1, 0, 0.3)
  const beretBody = lathe(
    [[0, 0], [headR * 0.8, 0.0], [headR * 1.08, headR * 0.12], [headR * 1.1, headR * 0.24], [headR * 0.85, headR * 0.36], [headR * 0.35, headR * 0.42], [0, headR * 0.43]],
    BLACK,
    { roughness: 0.92 },
  )
  boina.add(beretBody)
  const stem = cylinder(0.012, 0.018, 0.06, BLACK, { roughness: 0.9 })
  stem.position.y = headR * 0.43 + 0.025
  boina.add(stem)
  head.add(boina)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'loja', object: base },
    { name: 'loja', group: 'loja', object: loja },
    { name: 'vitrine', group: 'vitrine', object: vitrine },
    { name: 'barra', group: 'barra', object: barra },
    { name: 'papel', group: 'papel', object: papel },
    { name: 'rotulo', group: 'papel', object: rotulo },
    { name: 'bombons', group: 'papel', object: bombons },
    { name: 'mimico', group: 'mimico', object: mimico },
    { name: 'boina', group: 'mimico', object: boina },
    { name: 'bracoL', group: 'binoculo', object: arms.armL },
    { name: 'bracoR', group: 'binoculo', object: arms.armR },
  ]

  const [lx, ly, lz] = pose.armL
  const [rx, ry, rz] = pose.armR
  const DOWN_L = 0.25
  const DOWN_R = -0.25
  // aponta o rótulo (à direita, à frente do mímico)
  const POINT: [number, number, number] = [-1.2, 0, 0.35]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Na chocolateria da dona TITA, brota o assoalho cor de chocolate…',
    }),
    seq('loja-rise', 'loja', 0.25, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),
    seq('vitrine-rise', 'vitrine', 0.9, 0.9, [riseFrom(0, 2.2)], {
      ease: 'easeOut',
      caption: '…e uma vitrine de vidro, alta como um armário.',
    }),
    seq('barra-rise', 'barra', 2.0, 1.0, [
      ch('scale.y', 0.02, 1), ch('position.y', GLASS_Y0 + 0.04, BAR_Y),
    ], {
      ease: 'easeOut',
      caption: 'Lá dentro, em pé, uma BARRA de chocolate do tamanho de uma porta.',
    }),
    seq('papel-embrulha', 'papel', 3.2, 0.7, [
      ch('scale.x', 1.4, 1), ch('scale.y', 0.05, 1), ch('scale.z', 1.4, 1),
    ], {
      ease: 'easeOut',
      caption: 'Embrulhada em papel dourado com o nome da dona: TITA.',
    }),
    seq('rotulo-pop', 'rotulo', 3.8, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('bombons-caem', 'bombons', 4.2, 0.6, [ch('position.y', CASE_TOP + 0.9, CASE_TOP + 0.07)], { ease: 'easeIn' }),

    seq('mimico-rise', 'mimico', 5.0, 0.8, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'A dona pergunta "posso ajudar?" e o mímico entra em pânico: mímico não fala!',
    }),
    seq('boina-poe', 'boina', 5.4, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('position.y', headR * 1.4, headR * 0.72),
    ], { ease: 'easeOut' }),

    seq('bracoR-aponta', 'bracoR', 6.6, 0.6, [
      ch('rotation.x', 0, POINT[0]), ch('rotation.y', 0, POINT[1]), ch('rotation.z', DOWN_R, POINT[2]),
    ], {
      ease: 'easeOut',
      caption: 'Pela primeira vez ele rompe o silêncio — IÁ! — e aponta o rótulo: TÍTA-R…',
    }),
    seq('mimico-pula', 'mimico', 6.6, 0.3, [ch('position.y', GY, GY + 0.08)], { ease: 'easeOut' }),
    seq('mimico-assenta', 'mimico', 6.9, 0.3, [ch('position.y', GY + 0.08, GY)], { ease: 'easeIn' }),
    seq('barra-balanca', 'barra', 8.0, 0.35, [ch('rotation.z', 0, 0.04)], {
      ease: 'easeOut',
      caption: '…e a barra: BÁRA!',
    }),
    seq('barra-assenta', 'barra', 8.35, 0.4, [ch('rotation.z', 0.04, 0)], { ease: 'easeInOut' }),

    seq('bracoL-binoculo', 'bracoL', 9.2, 0.8, [
      ch('rotation.x', 0, lx), ch('rotation.y', 0, ly), ch('rotation.z', DOWN_L, lz),
    ], {
      ease: 'easeInOut',
      caption: 'E volta a olhar de binóculo, sem comprar nada.',
    }),
    seq('bracoR-binoculo', 'bracoR', 9.2, 0.8, [
      ch('rotation.x', POINT[0], rx), ch('rotation.y', POINT[1], ry), ch('rotation.z', POINT[2], rz),
    ], { ease: 'easeInOut' }),

    seq('boina-ajeita', 'boina', 10.6, 0.5, [ch('rotation.z', 0.3, 0.3)], {
      caption: 'Jag tittar bara. — Só estou olhando.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 1.95, 4.25], target: [0.0, 1.15, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-tittar-bara',
    contexto:
      "Loja: quando o vendedor chega com 'Kan jag hjälpa dig?' (posso te ajudar?) ou 'Hittar du det du letar efter?' (está achando o que procura?). Ele sorri e te deixa em paz — não é falta de educação.",
    fraseFonte: 'Só estou olhando.',
    fraseAlvo: 'Jag tittar bara.',
    pronuncia:
      "iá TÍT-tar BÁA-ra ('jag' = iá; T duro de 'tatu', nunca 'tchi'; I curto e com força; o -R de 'tittar' é brando e emenda no B; 'bara' com A longo e R de 'cara')",
    ponteSonora:
      "IÁ... TÍTA-R BÁRA! (5 sílabas: iá-TÍT-tar-BÁA-ra; tônicas em TÍT e BÁ; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado; TÍTA = TITA, o apelido da dona da chocolateria (apelido de verdade, de tia e de vó), escrito no papel do chocolate artesanal dela, com T DURO de 'tatu' — nunca 'tchita' — e I CURTO, o T dobrado travando a língua; o R depois do TITA é OBRIGATÓRIO e BRANDO, de 'cara', e escorrega direto no B: TÍTAR-BÁRA — sem ele sobra 'titta', o infinitivo (olhar), em vez de 'tittar', estou olhando; BÁRA = a BARRA de chocolate, mas com R BRANDO de 'cara' — RR carioca daria 'baha' — e o A da frente longo: BÁÁ-ra)",
    historia:
      "Na chocolateria da dona TITA, ela se aproxima com o 'posso ajudar?' e o mímico entra em pânico: mímico não fala! Ele cola as luvas brancas numa vitrine invisível e faz binóculo com as mãos, encarando uma BARRA de chocolate do tamanho de uma porta, embrulhada em papel dourado com o nome da dona: TITA. Pela primeira vez na carreira ele rompe o silêncio — IÁ! —, aponta o rótulo, TÍTA-R..., e a barra, BÁRA!, e volta a olhar sem comprar nada. É a frase que diz ao vendedor sueco: tô só olhando.",
  },
  createScene,
}

export default card
