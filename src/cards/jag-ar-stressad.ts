import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag är stressad." — IÁ! É-STRÉS-SAD(o)!
 *
 * Na cozinha, em vez de lavar a louça, um diabo-da-tasmânia tenta manter
 * seis pratos girando em seis varetas e pula feito doido de uma pra outra.
 * Berra IÁ!, tenta avisar "É ESTRESSADO!", mas só o começo sai com força —
 * É-STRÉS…! — e o fim sai num sopro: …sad. O último prato, redondo feito um
 * O, despenca e se espatifa: lá se foi o -O. Na placa ficou ESTRESSAD.
 *
 * Diorama: piso de ladrilhos azuis e brancos, parede amarelo-manteiga com
 * barrado de azulejo, pia à esquerda com a pilha torta de louça; seis varetas
 * em arco; o diabo no meio do pulo agarrado às duas do centro; cacos ao pé da
 * vareta vazia e a placa de cavalete na frente. O laranja é RESERVADO ao
 * prato-O (o que cai e quebra).
 */

const PLINTH = '#3b3430'
const GROUT = '#b7c0c7'
const TILE_W = '#eef0ec'
const TILE_B = '#3d6ea8'
const WALL = '#efd9a2'
const WALL_TRIM = '#f6ead0'
const SPLASH = '#f3f1ea'
const SPLASH_LINE = '#cdd3d6'
const WOOD = '#c08a55'
const WOOD_DARK = '#8e5f36'
const STONE = '#e2ddd3'
const PORCELAIN = '#f7f5f0'
const STEEL = '#c9ced4'
const IRON = '#3a3f47'
const BRASS = '#c9a250'
const COBALT = '#2f5fa8'
const STAIN = '#8a6a3a'
const SPIN = '#d8e6f2'
const FUR = '#2b272e'
const FUR_SOFT = '#3a353d'
const BAND = '#efe9dd'
const EAR = '#e0848f'
const EAR_IN = '#c25e6c'
const MOUTH = '#7a2431'
const TONGUE = '#e07a86'
const TOOTH = '#f8f4ea'
const NOSE = '#cf7683'
const CLAW = '#e8e0cf'
const SWEAT = '#8fd0f5'
const SIGN = '#5a3a24'
const SIGN_TRIM = '#7d5434'
const CREAM = '#f4e8d0'
const ORANGE = '#f2652a' // acento saturado RESERVADO: o prato-O que cai e quebra
const ORANGE_RIM = '#fbe2c6'

const GY = 0.16 // topo do piso

// diabo: origem no pé que pende; no ar, no meio do pulo
const DEV: [number, number, number] = [-0.1, GY + 0.4, 0.22]
const DEV_YAW = 0.1
const DEV_TILT = 0.05
const DEV_S = 1.12

// varetas livres (x, z, altura); 3 e 4 são posicionadas nas patas do diabo
const ROD1: [number, number, number] = [-2.12, 0.05, 1.9]
const ROD2: [number, number, number] = [-1.72, -0.6, 2.2]
const ROD3_H = 2.5
const ROD4_H = 2.56
const ROD5: [number, number, number] = [1.32, -0.7, 2.15]
const ROD6: [number, number, number] = [1.74, 0.46, 1.95] // a vazia
const ROD6_LEAN = -0.1

// cacos do prato-O, ao pé da vareta vazia
const SHARDS: [number, number, number] = [1.5, GY, 1.06]

// placa de cavalete
const SIGN_POS: [number, number, number] = [0.28, GY, 1.36]
const SIGN_YAW = -0.14

const PLATE_R = 0.24
const PLATE_PROFILE: [number, number][] = [
  [0, 0], [0.11, 0], [0.13, 0.01], [0.2, 0.032], [0.235, 0.05], [0.24, 0.056],
  [0.228, 0.058], [0.195, 0.042], [0.125, 0.024], [0, 0.022],
]

type P2 = [number, number]

/** Recorta um polígono convexo pelo círculo de raio R (Sutherland–Hodgman). */
function clipToCircle(poly: P2[], R: number, sides = 96): P2[] {
  let out = poly
  for (let i = 0; i < sides && out.length; i++) {
    const a0 = (i / sides) * Math.PI * 2
    const a1 = ((i + 1) / sides) * Math.PI * 2
    const A: P2 = [Math.cos(a0) * R, Math.sin(a0) * R]
    const B: P2 = [Math.cos(a1) * R, Math.sin(a1) * R]
    const inside = (p: P2) => (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]) >= 0
    const cross = (p: P2, q: P2): P2 => {
      const dx = q[0] - p[0]
      const dy = q[1] - p[1]
      const ex = B[0] - A[0]
      const ey = B[1] - A[1]
      const t = (ex * (A[1] - p[1]) - ey * (A[0] - p[0])) / (ex * dy - ey * dx)
      return [p[0] + dx * t, p[1] + dy * t]
    }
    const input = out
    out = []
    for (let k = 0; k < input.length; k++) {
      const cur = input[k]
      const prev = input[(k + input.length - 1) % input.length]
      if (inside(cur)) {
        if (!inside(prev)) out.push(cross(prev, cur))
        out.push(cur)
      } else if (inside(prev)) {
        out.push(cross(prev, cur))
      }
    }
  }
  return out
}

/** Laje deitada (polígono no plano xz, extrudado para cima), cantos suaves. */
function slab(poly: P2[], depth: number, color: string, roughness = 0.3) {
  const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)))
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  })
  const m = new THREE.Mesh(geo, mat(color, { roughness, size: 0.5, detail: 0.25 }))
  m.rotation.x = -Math.PI / 2
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Setor de anel extrudado para cima: parede curva, barrado, frisos. */
function arcWall(rIn: number, rOut: number, height: number, a0: number, a1: number, color: string, roughness = 0.8) {
  const shape = new THREE.Shape()
  const n = 48
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    const p = new THREE.Vector2(Math.cos(a) * rOut, Math.sin(a) * rOut)
    if (i === 0) shape.moveTo(p.x, p.y)
    else shape.lineTo(p.x, p.y)
  }
  for (let i = n; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / n
    shape.lineTo(Math.cos(a) * rIn, Math.sin(a) * rIn)
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    curveSegments: 4,
  })
  const m = new THREE.Mesh(geo, mat(color, { roughness, size: height }))
  m.rotation.x = -Math.PI / 2 // shape (x, y) → mundo (x, -z): y>0 é o fundo
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Arco de toro (traços de giro, ponteiros, alças). */
function arc(r: number, tube: number, angle: number, color: string, opts: { roughness?: number; metalness?: number } = {}) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 8, 28, angle),
    mat(color, { roughness: opts.roughness ?? 0.5, metalness: opts.metalness, size: r * 2 }),
  )
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cápsula esticada entre dois pontos (membros do diabo). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const m = capsule(r, Math.max(len, 0.001), color, { roughness: 0.9 })
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Prato raso com friso: louça branca de borda azul (ou o prato-O). */
function plate(color: string, rim: string, spin = false) {
  const g = new THREE.Group()
  g.add(lathe(PLATE_PROFILE, color, { roughness: 0.18 }))
  const ring = torus(0.2, 0.012, rim, { roughness: 0.25 })
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.046
  g.add(ring)
  const inner = torus(0.125, 0.006, rim, { roughness: 0.25 })
  inner.rotation.x = Math.PI / 2
  inner.position.y = 0.027
  g.add(inner)
  if (spin) {
    // traços de giro: dois arcos claros em volta, no plano do prato
    for (const k of [0, 1]) {
      const trail = arc(PLATE_R + 0.07, 0.014, 1.5, SPIN, { roughness: 0.4 })
      trail.rotation.set(Math.PI / 2, 0, k * Math.PI + 0.4)
      trail.position.y = 0.03
      g.add(trail)
    }
  }
  return g
}

/** Vareta prateada com base pesada; prato girando no topo (opcional). */
function makeRod(h: number, plateTilt: [number, number] | null) {
  const g = new THREE.Group()
  const stand = lathe(
    [[0, 0], [0.17, 0], [0.175, 0.02], [0.14, 0.045], [0.06, 0.07], [0.045, 0.11], [0, 0.11]],
    IRON,
    { roughness: 0.35, metalness: 0.6 },
  )
  g.add(stand)
  const pole = cylinder(0.02, 0.022, h, STEEL, { roughness: 0.22, metalness: 0.85 }, 12)
  pole.position.y = h / 2
  g.add(pole)
  const tip = sphere(0.026, STEEL, { roughness: 0.22, metalness: 0.85 }, 12)
  tip.position.y = h
  g.add(tip)
  if (plateTilt) {
    const p = plate(PORCELAIN, COBALT, true)
    p.position.y = h + 0.004
    p.rotation.set(plateTilt[0], 0, plateTilt[1])
    g.add(p)
  }
  return g
}

/** Traço de letra da placa: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.008, CREAM, { roughness: 0.6 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** E S T R A D — letras de traço grosso, legíveis a distância de diorama. */
function letter(which: 'E' | 'S' | 'T' | 'R' | 'A' | 'D') {
  const g = new THREE.Group()
  const t = 0.036
  const W = 0.12
  const hw = W / 2
  const H = 0.21
  const hh = H / 2
  if (which === 'E') {
    g.add(stroke(t, H, -hw + t / 2, 0))
    g.add(stroke(W, t, 0, hh - t / 2))
    g.add(stroke(W * 0.82, t, -W * 0.09, 0))
    g.add(stroke(W, t, 0, -hh + t / 2))
  } else if (which === 'S') {
    g.add(stroke(W, t, 0, hh - t / 2))
    g.add(stroke(t, hh, -hw + t / 2, hh / 2))
    g.add(stroke(W, t, 0, 0))
    g.add(stroke(t, hh, hw - t / 2, -hh / 2))
    g.add(stroke(W, t, 0, -hh + t / 2))
  } else if (which === 'T') {
    g.add(stroke(W + 0.01, t, 0, hh - t / 2))
    g.add(stroke(t, H, 0, 0))
  } else if (which === 'R') {
    g.add(stroke(t, H, -hw + t / 2, 0))
    g.add(stroke(W - 0.012, t, -0.006, hh - t / 2))
    g.add(stroke(W - 0.012, t, -0.006, 0.004))
    g.add(stroke(t, hh, hw - t / 2, hh / 2))
    g.add(stroke(t, 0.12, 0.026, -0.05, 0.48))
  } else if (which === 'A') {
    g.add(stroke(t, 0.222, -0.031, 0, -0.27))
    g.add(stroke(t, 0.222, 0.031, 0, 0.27))
    g.add(stroke(0.07, t * 0.85, 0, -0.03))
  } else {
    g.add(stroke(t, H, -hw + t / 2, 0))
    g.add(stroke(W * 0.72, t, -hw + W * 0.36, hh - t / 2))
    g.add(stroke(W * 0.72, t, -hw + W * 0.36, -hh + t / 2))
    g.add(stroke(t, H * 0.52, hw - t / 2, 0))
    g.add(stroke(t, 0.06, 0.034, 0.068, 0.62))
    g.add(stroke(t, 0.06, 0.034, -0.068, -0.62))
  }
  return g
}

/** Caco do prato-O: fatia torneada do prato, com seu pedaço de friso. */
function shard(phi0: number, phiLen: number) {
  const g = new THREE.Group()
  const pts = PLATE_PROFILE.map(([r, y]) => new THREE.Vector2(r, y))
  const m = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 14, phi0, phiLen),
    mat(ORANGE, { roughness: 0.18, size: 0.4 }),
  )
  m.material.side = THREE.DoubleSide
  m.castShadow = true
  m.receiveShadow = true
  g.add(m)
  // friso: arco de toro deitado, girado para cobrir o mesmo setor do lathe
  // (lathe: ângulo φ em (sen φ, cos φ); toro deitado: ângulo u em (cos u, sen u))
  const ringPivot = new THREE.Group()
  ringPivot.rotation.y = phi0 + phiLen * 0.95 - Math.PI / 2
  ringPivot.position.y = 0.046
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.012, 8, 16, phiLen * 0.9),
    mat(ORANGE_RIM, { roughness: 0.25, size: 0.4 }),
  )
  ring.rotation.x = Math.PI / 2
  ringPivot.add(ring)
  g.add(ringPivot)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: piso de ladrilhos azuis e brancos ------------------------------
  const base = new THREE.Group()

  const plinth = cylinder(2.62, 2.72, 0.12, PLINTH, { roughness: 0.8 })
  plinth.position.y = 0.06
  base.add(plinth)

  const grout = cylinder(2.52, 2.52, 0.03, GROUT, { roughness: 0.9 })
  grout.position.y = 0.135
  base.add(grout)

  const TS = 0.42
  const GAP = 0.022
  for (let i = -7; i <= 7; i++) {
    for (let j = -7; j <= 7; j++) {
      const cx = (i + 0.5) * TS
      const cz = (j + 0.5) * TS
      const h = TS / 2 - GAP / 2 - 0.005
      const sq: P2[] = [[cx - h, cz - h], [cx + h, cz - h], [cx + h, cz + h], [cx - h, cz + h]]
      const clipped = clipToCircle(sq, 2.44)
      if (clipped.length < 3) continue
      const tile = slab(clipped, 0.012, (i + j) % 2 === 0 ? TILE_W : TILE_B)
      tile.position.y = GY - 0.012
      base.add(tile)
    }
  }

  const rim = torus(2.5, 0.035, WOOD_DARK, { roughness: 0.6 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = GY - 0.005
  base.add(rim)

  // pano de prato embolado e esponja (frente esquerda)
  const pano = new THREE.Group()
  pano.position.set(-1.68, GY, 1.0)
  pano.rotation.y = 0.6
  const tecido = rbox(0.5, 0.05, 0.34, 0.025, '#f1ece2', { roughness: 0.92 })
  tecido.position.y = 0.025
  tecido.rotation.z = 0.04
  pano.add(tecido)
  for (const k of [-1, 0, 1]) {
    const lista = rbox(0.5, 0.054, 0.045, 0.02, COBALT, { roughness: 0.92 })
    lista.position.set(0, 0.026, k * 0.11)
    lista.rotation.z = 0.04
    pano.add(lista)
  }
  const dobra = capsule(0.045, 0.3, '#f1ece2', { roughness: 0.92 })
  dobra.rotation.set(Math.PI / 2, 0, 0.2)
  dobra.position.set(0.18, 0.06, 0.02)
  pano.add(dobra)
  base.add(pano)

  const balde = new THREE.Group()
  balde.position.set(-1.12, GY, 1.2)
  const caneco = lathe(
    [[0, 0], [0.19, 0], [0.2, 0.02], [0.24, 0.34], [0.25, 0.36], [0.23, 0.36], [0.215, 0.05], [0, 0.05]],
    '#7fa7c9',
    { roughness: 0.35 },
  )
  balde.add(caneco)
  const espuma = puff(0.17, '#f7fbff', 6, 19, { roughness: 0.6 })
  espuma.position.y = 0.36
  espuma.scale.y = 0.55
  balde.add(espuma)
  const alca = arc(0.24, 0.012, Math.PI, IRON, { roughness: 0.4, metalness: 0.6 })
  alca.position.y = 0.34
  alca.rotation.y = 0.6
  balde.add(alca)
  base.add(balde)

  root.add(base)

  // ---- pia: parede, barrado de azulejo, bancada e a pilha torta de louça ----
  const pia = new THREE.Group()
  const A0 = Math.PI / 2 - 1.3
  const A1 = Math.PI / 2 + 1.3
  const WALL_H = 2.8

  const wall = arcWall(2.42, 2.56, WALL_H, A0, A1, WALL, 0.85)
  wall.position.y = 0.12
  pia.add(wall)

  const cornice = arcWall(2.37, 2.6, 0.08, A0 - 0.01, A1 + 0.01, WALL_TRIM, 0.6)
  cornice.position.y = 0.12 + WALL_H - 0.02
  pia.add(cornice)

  const splash = arcWall(2.37, 2.43, 0.95, A0, A1, SPLASH, 0.3)
  splash.position.y = GY - 0.01
  pia.add(splash)
  // rejunte do barrado: linhas verticais e horizontais
  for (let a = A0 + 0.09; a < A1 - 0.05; a += 0.1) {
    const v = rbox(0.012, 0.92, 0.012, 0.004, SPLASH_LINE, { roughness: 0.8 })
    v.position.set(Math.cos(a) * 2.365, GY + 0.46, -Math.sin(a) * 2.365)
    v.rotation.y = a - Math.PI / 2
    pia.add(v)
  }
  for (const y of [0.24, 0.48, 0.72]) {
    const hz = arcWall(2.36, 2.37, 0.012, A0, A1, SPLASH_LINE, 0.8)
    hz.position.y = GY + y
    pia.add(hz)
  }
  const band = arcWall(2.34, 2.44, 0.07, A0, A1, TILE_B, 0.35)
  band.position.y = GY + 0.94
  pia.add(band)

  // relógio de parede: o prazo apertando
  {
    const a = Math.PI / 2 - 0.38
    const relogio = new THREE.Group()
    relogio.position.set(Math.cos(a) * 2.38, 1.95, -Math.sin(a) * 2.38)
    relogio.rotation.y = a - Math.PI / 2
    const caixa = cylinder(0.25, 0.25, 0.06, COBALT, { roughness: 0.4 })
    caixa.rotation.x = Math.PI / 2
    relogio.add(caixa)
    const mostrador = cylinder(0.21, 0.21, 0.02, '#fbf8ef', { roughness: 0.3 })
    mostrador.rotation.x = Math.PI / 2
    mostrador.position.z = 0.03
    relogio.add(mostrador)
    for (let k = 0; k < 12; k++) {
      const ang = (k / 12) * Math.PI * 2
      const marca = rbox(0.016, k % 3 === 0 ? 0.05 : 0.03, 0.01, 0.004, IRON, { roughness: 0.5 })
      marca.position.set(Math.sin(ang) * 0.17, Math.cos(ang) * 0.17, 0.045)
      marca.rotation.z = -ang
      relogio.add(marca)
    }
    const hora = rbox(0.024, 0.11, 0.012, 0.006, IRON, { roughness: 0.5 })
    hora.position.set(0.028, 0.045, 0.05)
    hora.rotation.z = -0.55
    relogio.add(hora)
    const minuto = rbox(0.018, 0.16, 0.012, 0.006, IRON, { roughness: 0.5 })
    minuto.position.set(-0.012, 0.075, 0.056)
    minuto.rotation.z = 0.15
    relogio.add(minuto)
    const pino = sphere(0.02, IRON, { roughness: 0.4 })
    pino.position.z = 0.06
    relogio.add(pino)
    pia.add(relogio)
  }

  // bancada com a pia, encostada na parede à esquerda
  const bancada = new THREE.Group()
  const BA = Math.PI / 2 + 0.84
  bancada.position.set(Math.cos(BA) * 2.02, GY, -Math.sin(BA) * 2.02)
  bancada.rotation.y = BA - Math.PI / 2
  pia.add(bancada)

  const CW = 1.25
  const CH = 0.86
  const armario = rbox(CW, CH - 0.06, 0.6, 0.03, WOOD, { roughness: 0.65 })
  armario.position.y = (CH - 0.06) / 2
  bancada.add(armario)
  for (const sx of [-1, 1]) {
    const porta = rbox(CW / 2 - 0.06, CH - 0.22, 0.03, 0.02, '#cf9a63', { roughness: 0.6 })
    porta.position.set(sx * (CW / 4), (CH - 0.06) / 2 + 0.02, 0.305)
    bancada.add(porta)
    const puxador = sphere(0.025, BRASS, { roughness: 0.3, metalness: 0.75 })
    puxador.position.set(sx * 0.07, CH * 0.62, 0.33)
    bancada.add(puxador)
  }
  const rodape = rbox(CW - 0.04, 0.06, 0.55, 0.02, WOOD_DARK, { roughness: 0.8 })
  rodape.position.set(0, 0.03, -0.01)
  bancada.add(rodape)
  const tampo = rbox(CW + 0.08, 0.06, 0.66, 0.02, STONE, { roughness: 0.35 })
  tampo.position.set(0, CH - 0.03, 0.01)
  bancada.add(tampo)

  // cuba branca (à direita da bancada) e torneira cromada
  const cuba = rbox(0.56, 0.12, 0.42, 0.04, PORCELAIN, { roughness: 0.15 })
  cuba.position.set(0.24, CH + 0.04, 0.03)
  bancada.add(cuba)
  const fundo = rbox(0.46, 0.02, 0.32, 0.03, '#c9ccd0', { roughness: 0.3 })
  fundo.position.set(0.24, CH + 0.095, 0.03)
  bancada.add(fundo)
  const torneira = new THREE.Group()
  torneira.position.set(0.24, CH, -0.24)
  const cano = cylinder(0.025, 0.03, 0.3, STEEL, { roughness: 0.2, metalness: 0.85 })
  cano.position.y = 0.15
  torneira.add(cano)
  const bico = arc(0.1, 0.022, Math.PI, STEEL, { roughness: 0.2, metalness: 0.85 })
  bico.rotation.y = Math.PI / 2
  bico.position.set(0, 0.3, 0.1)
  torneira.add(bico)
  for (const sx of [-1, 1]) {
    const registro = cylinder(0.035, 0.035, 0.05, STEEL, { roughness: 0.2, metalness: 0.85 })
    registro.position.set(sx * 0.12, 0.04, 0)
    torneira.add(registro)
  }
  bancada.add(torneira)

  // pilha torta de louça suja, à esquerda da cuba
  const pilha = new THREE.Group()
  pilha.position.set(-0.32, CH, 0.04)
  let lean = 0
  let dx = 0
  const N_PILHA = 12
  for (let k = 0; k < N_PILHA; k++) {
    const p = new THREE.Group()
    p.add(lathe(PLATE_PROFILE, PORCELAIN, { roughness: 0.2 }))
    const ring = torus(0.2, 0.011, COBALT, { roughness: 0.25 })
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.046
    p.add(ring)
    dx += 0.008 + k * 0.004 + rand() * 0.012
    lean += 0.02 + rand() * 0.03
    p.position.set(dx, 0.02 + k * 0.055, (rand() - 0.5) * 0.05)
    p.rotation.set((rand() - 0.5) * 0.08, rand() * 3, -lean * 0.6)
    p.scale.setScalar(0.85)
    if (k % 3 === 1) {
      const sujeira = sphere(0.04, STAIN, { roughness: 0.8 })
      sujeira.scale.set(1.4, 0.35, 1)
      sujeira.position.set(0.09, 0.06, 0.04)
      p.add(sujeira)
    }
    pilha.add(p)
  }
  const xicara = lathe(
    [[0, 0], [0.06, 0], [0.065, 0.02], [0.07, 0.11], [0.075, 0.12], [0.062, 0.115], [0.058, 0.03], [0, 0.03]],
    PORCELAIN,
    { roughness: 0.18 },
  )
  xicara.position.set(dx + 0.04, 0.02 + N_PILHA * 0.055, 0)
  xicara.rotation.z = -0.35
  const asa = torus(0.04, 0.011, PORCELAIN, { roughness: 0.18 })
  asa.position.set(0.075, 0.06, 0)
  xicara.add(asa)
  pilha.add(xicara)
  // panela encostada na pilha, cabo para fora
  const panela = lathe(
    [[0, 0], [0.15, 0], [0.16, 0.02], [0.165, 0.14], [0.175, 0.15], [0.155, 0.15], [0.15, 0.03], [0, 0.03]],
    '#5f6670',
    { roughness: 0.3, metalness: 0.7 },
  )
  panela.position.set(-0.3, 0, 0.0)
  const caboPanela = cylinder(0.018, 0.018, 0.28, '#2b2b2b', { roughness: 0.5 })
  caboPanela.rotation.z = Math.PI / 2
  caboPanela.position.set(-0.3, 0.12, 0)
  panela.add(caboPanela)
  pilha.add(panela)
  bancada.add(pilha)

  root.add(pia)

  // ---- DIABO-DA-TASMÂNIA no meio do pulo -----------------------------------
  const diabo = new THREE.Group()
  diabo.position.set(...DEV)
  diabo.rotation.set(0, DEV_YAW, DEV_TILT)
  diabo.scale.setScalar(DEV_S)
  root.add(diabo)

  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

  const quadril = sphere(0.38, FUR, { roughness: 0.9 })
  quadril.scale.set(1.05, 0.85, 0.95)
  quadril.position.set(0, 0.52, -0.02)
  diabo.add(quadril)

  const barriga = sphere(0.42, FUR, { roughness: 0.9 })
  barriga.scale.set(1, 1.05, 0.92)
  barriga.position.set(0, 0.76, 0)
  diabo.add(barriga)

  const peito = sphere(0.37, FUR, { roughness: 0.9 })
  peito.scale.set(1.12, 0.85, 0.9)
  peito.position.set(0, 1.0, 0)
  diabo.add(peito)

  // faixa branca no peito: um V raso de lado a lado
  for (const side of [-1, 1]) {
    const faixa = limb(V(0, 0.9, 0.37), V(side * 0.33, 1.0, 0.24), 0.065, BAND)
    diabo.add(faixa)
  }

  // cabeça larga
  const cranio = sphere(0.34, FUR, { roughness: 0.9 })
  cranio.scale.set(1.2, 0.92, 1.0)
  cranio.position.set(0, 1.34, 0.05)
  diabo.add(cranio)

  for (const side of [-1, 1]) {
    const bochecha = sphere(0.19, FUR, { roughness: 0.9 })
    bochecha.position.set(side * 0.25, 1.24, 0.15)
    diabo.add(bochecha)
  }

  // focinho de cima e queixo: a boca escancarada fica entre os dois
  const focinho = sphere(0.2, FUR_SOFT, { roughness: 0.88 })
  focinho.scale.set(1.15, 0.62, 1.05)
  focinho.position.set(0, 1.33, 0.3)
  diabo.add(focinho)

  const queixo = sphere(0.17, FUR_SOFT, { roughness: 0.88 })
  queixo.scale.set(1.12, 0.5, 1.0)
  queixo.position.set(0, 1.07, 0.27)
  diabo.add(queixo)

  const boca = sphere(0.16, MOUTH, { roughness: 0.6 })
  boca.scale.set(1.15, 0.85, 0.5)
  boca.position.set(0, 1.2, 0.36)
  diabo.add(boca)

  const lingua = capsule(0.05, 0.06, TONGUE, { roughness: 0.4 })
  lingua.rotation.z = Math.PI / 2
  lingua.scale.set(0.9, 1.2, 0.6)
  lingua.position.set(0, 1.14, 0.38)
  diabo.add(lingua)

  // dentes brancos pontudos: fileira de cima (para baixo) e de baixo (para cima)
  for (const [k, x] of [-0.13, -0.065, 0, 0.065, 0.13].entries()) {
    const canino = k === 0 || k === 4
    const d = cone(canino ? 0.026 : 0.02, canino ? 0.085 : 0.055, TOOTH, { roughness: 0.3 })
    d.rotation.x = Math.PI
    d.position.set(x, canino ? 1.2 : 1.21, 0.47 - Math.abs(x) * 0.45)
    diabo.add(d)
  }
  for (const x of [-0.1, -0.035, 0.035, 0.1]) {
    const d = cone(0.019, 0.05, TOOTH, { roughness: 0.3 })
    d.position.set(x, 1.15, 0.435 - Math.abs(x) * 0.4)
    diabo.add(d)
  }

  const nariz = sphere(0.06, NOSE, { roughness: 0.35 })
  nariz.scale.set(1.25, 0.8, 1)
  nariz.position.set(0, 1.4, 0.5)
  diabo.add(nariz)

  // olhos arregalados, pupilas miúdas de pânico
  for (const side of [-1, 1]) {
    const esclera = sphere(0.085, '#ffffff', { roughness: 0.25 })
    esclera.scale.set(1, 1.22, 0.6)
    esclera.position.set(side * 0.15, 1.5, 0.35)
    diabo.add(esclera)
    // pupilas miúdas, cada uma pra um lado: olhar de quem pirou
    const pupila = sphere(0.026, '#141414', { roughness: 0.2 })
    pupila.position.set(side * 0.15 + side * 0.022, 1.5 + (side > 0 ? 0.025 : -0.01), 0.402)
    diabo.add(pupila)

    // orelhas redondas rosadas (ficam vermelhas de estresse)
    const orelha = sphere(0.13, EAR, { roughness: 0.7 })
    orelha.scale.set(1, 1.05, 0.42)
    orelha.position.set(side * 0.36, 1.62, -0.02)
    orelha.rotation.z = -side * 0.45
    diabo.add(orelha)
    const dentro = sphere(0.085, EAR_IN, { roughness: 0.7 })
    dentro.scale.set(1, 1.05, 0.3)
    dentro.position.set(side * 0.36, 1.61, 0.025)
    dentro.rotation.z = -side * 0.45
    diabo.add(dentro)
  }

  // pelo do cocuruto arrepiado
  for (const [k, x] of [-0.12, 0, 0.12].entries()) {
    const tufo = cone(0.06, 0.16, FUR, { roughness: 0.9 })
    tufo.position.set(x, 1.63, -0.02 + (k === 1 ? 0.02 : 0))
    tufo.rotation.z = -x * 2.4
    tufo.rotation.x = -0.25
    diabo.add(tufo)
  }

  // braços esticados até as varetas; patas fechadas em volta delas
  const PAW_L = V(-0.84, 1.16, -0.16)
  const PAW_R = V(0.84, 1.2, -0.16)
  for (const [side, paw] of [[-1, PAW_L], [1, PAW_R]] as const) {
    const ombro = V(side * 0.36, 1.02, 0.0)
    const cotovelo = V(side * 0.62, 1.04, -0.06)
    diabo.add(limb(ombro, cotovelo, 0.11, FUR))
    diabo.add(limb(cotovelo, paw.clone().add(V(-side * 0.06, 0, 0.02)), 0.095, FUR))
    const mao = sphere(0.1, FUR_SOFT, { roughness: 0.88 })
    mao.scale.set(0.9, 1.05, 0.95)
    mao.position.copy(paw).add(V(0, 0, 0.02))
    diabo.add(mao)
    for (const dy of [-0.05, 0, 0.05]) {
      const garra = cone(0.016, 0.05, CLAW, { roughness: 0.4 })
      garra.position.set(paw.x + side * 0.02, paw.y + dy, paw.z + 0.11)
      garra.rotation.x = Math.PI / 2
      diabo.add(garra)
    }
  }

  // pernas no meio do pulo: a esquerda estica pra baixo, a direita sobe com o
  // joelho pra frente — a pata de trás no ar
  {
    const quadE = V(-0.2, 0.42, 0.02)
    const tornoE = V(-0.27, 0.16, 0.02)
    diabo.add(limb(quadE, tornoE, 0.125, FUR))
    const peE = sphere(0.12, FUR_SOFT, { roughness: 0.88 })
    peE.scale.set(0.9, 0.55, 1.45)
    peE.position.set(-0.28, 0.07, 0.1)
    peE.rotation.x = 0.5
    diabo.add(peE)
    for (const dx2 of [-0.05, 0, 0.05]) {
      const garra = cone(0.016, 0.045, CLAW, { roughness: 0.4 })
      garra.position.set(-0.28 + dx2, 0.0, 0.25)
      garra.rotation.x = Math.PI / 2 + 0.5
      diabo.add(garra)
    }

    const quadD = V(0.2, 0.46, 0.08)
    const joelhoD = V(0.3, 0.6, 0.4)
    diabo.add(limb(quadD, joelhoD, 0.13, FUR))
    const tornoD = V(0.33, 0.36, 0.48)
    diabo.add(limb(joelhoD, tornoD, 0.1, FUR))
    const peD = sphere(0.12, FUR_SOFT, { roughness: 0.88 })
    peD.scale.set(0.9, 0.55, 1.45)
    peD.position.set(0.34, 0.3, 0.58)
    peD.rotation.x = 0.35
    diabo.add(peD)
    for (const dx2 of [-0.05, 0, 0.05]) {
      const garra = cone(0.016, 0.045, CLAW, { roughness: 0.4 })
      garra.position.set(0.34 + dx2, 0.25, 0.74)
      garra.rotation.x = Math.PI / 2 + 0.35
      diabo.add(garra)
    }
  }

  const rabo = capsule(0.1, 0.26, FUR, { roughness: 0.9 })
  rabo.position.set(0.04, 0.42, -0.42)
  rabo.rotation.x = -1.05
  diabo.add(rabo)

  // ---- varetas: 3 e 4 passam exatamente pelas patas do diabo -----------------
  diabo.updateMatrixWorld(true)
  const wl = diabo.localToWorld(PAW_L.clone())
  const wr = diabo.localToWorld(PAW_R.clone())

  const vareta1 = makeRod(ROD1[2], [0.34, -0.2])
  vareta1.position.set(ROD1[0], GY, ROD1[1])
  root.add(vareta1)

  const vareta2 = makeRod(ROD2[2], [0.3, 0.2])
  vareta2.position.set(ROD2[0], GY, ROD2[1])
  root.add(vareta2)

  const vareta3 = makeRod(ROD3_H, [0.36, 0.14])
  vareta3.position.set(wl.x, GY, wl.z)
  root.add(vareta3)

  const vareta4 = makeRod(ROD4_H, [0.34, -0.16])
  vareta4.position.set(wr.x, GY, wr.z)
  root.add(vareta4)

  const vareta5 = makeRod(ROD5[2], [0.32, -0.18])
  vareta5.position.set(ROD5[0], GY, ROD5[1])
  root.add(vareta5)

  // a vazia: inclinada, ainda balançando (traços de balanço perto da ponta)
  const vazia = makeRod(ROD6[2], null)
  vazia.position.set(ROD6[0], GY, ROD6[1])
  vazia.rotation.z = ROD6_LEAN
  for (const side of [-1, 1]) {
    const balanco = arc(0.16, 0.011, 0.9, SPIN, { roughness: 0.4 })
    balanco.position.set(0, ROD6[2] - 0.3, 0)
    balanco.rotation.z = side > 0 ? -0.45 : Math.PI - 0.45
    vazia.add(balanco)
  }
  root.add(vazia)

  // ---- o prato-O: cai da vareta vazia (pose final: sumido nos cacos) --------
  const O_TOP = GY + ROD6[2] + 0.004
  const pratoO = plate(ORANGE, ORANGE_RIM, true)
  pratoO.position.set(SHARDS[0], GY + 0.03, SHARDS[2])
  pratoO.rotation.set(2.2, 0, -0.6)
  pratoO.scale.setScalar(0.001)
  root.add(pratoO)

  // ---- cacos: o prato-O em três pedaços, ao pé da vareta vazia --------------
  const cacos = new THREE.Group()
  cacos.position.set(...SHARDS)
  cacos.scale.setScalar(1.3)
  root.add(cacos)
  const pedacos: [number, number, number, number, number, number][] = [
    // phi0, phiLen, dx, dz, yaw, tombo
    [0.2, 2.0, -0.16, 0.08, 0.3, 0],
    [2.35, 1.9, 0.17, 0.12, -0.5, 0],
    [4.4, 1.7, 0.04, -0.17, 0.9, Math.PI],
  ]
  for (const [p0, pl, px, pz, yaw, flip] of pedacos) {
    const s = shard(p0, pl)
    s.position.set(px, flip ? 0.06 : 0.005, pz)
    s.rotation.set(flip, yaw, flip ? 0 : 0.05)
    cacos.add(s)
  }
  for (const [px, pz] of [[0.28, -0.04], [-0.25, -0.12], [0.2, 0.28], [-0.18, 0.26]] as const) {
    const lasca = rbox(0.05, 0.016, 0.035, 0.006, ORANGE, { roughness: 0.2 })
    lasca.position.set(px, 0.01, pz)
    lasca.rotation.y = rand() * Math.PI
    cacos.add(lasca)
  }

  // ---- gotas de suor voando em volta da cabeça -----------------------------
  const headWorld = diabo.localToWorld(V(0, 1.38, 0.1))
  const suor = new THREE.Group()
  suor.position.copy(headWorld)
  root.add(suor)
  const gotas: [number, number, number][] = [
    // ângulo no plano da câmera, distância, profundidade
    [0.35, 0.62, 0.05], [0.95, 0.6, 0.1], [1.55, 0.58, -0.05],
    [2.2, 0.62, 0.08], [2.75, 0.6, 0.0], [-0.25, 0.66, 0.1], [3.4, 0.64, 0.05],
  ]
  for (const [ang, dist, dz] of gotas) {
    const gota = new THREE.Group()
    gota.position.set(Math.cos(ang) * dist, Math.sin(ang) * dist * 0.85 + 0.12, dz)
    // a ponta da gota aponta para a cabeça (de onde ela saiu)
    gota.rotation.z = ang + Math.PI / 2
    const bolha = sphere(0.05, SWEAT, { roughness: 0.08 })
    gota.add(bolha)
    const ponta = cone(0.046, 0.09, SWEAT, { roughness: 0.08 })
    ponta.position.y = 0.055
    ponta.rotation.z = Math.PI
    ponta.rotation.x = Math.PI
    gota.add(ponta)
    suor.add(gota)
  }

  // ---- placa de cavalete: ESTRESSAD ----------------------------------------
  const placa = new THREE.Group()
  placa.position.set(...SIGN_POS)
  placa.rotation.y = SIGN_YAW
  root.add(placa)

  const WORD = ['E', 'S', 'T', 'R', 'E', 'S', 'S', 'A', 'D'] as const
  const PITCH = 0.148
  const BW = WORD.length * PITCH + 0.16
  const BH = 0.36
  const LEAN = 0.3
  const LEG = 0.5

  const frente = new THREE.Group()
  frente.rotation.x = -LEAN
  placa.add(frente)
  const tabua = rbox(BW, BH, 0.04, 0.02, SIGN, { roughness: 0.8 })
  tabua.position.y = LEG - BH / 2 - 0.02
  frente.add(tabua)
  for (const sx of [-1, 1]) {
    const montante = rbox(0.06, LEG, 0.06, 0.02, SIGN_TRIM, { roughness: 0.75 })
    montante.position.set(sx * (BW / 2 + 0.03), LEG / 2, 0)
    frente.add(montante)
  }
  for (const yy of [LEG - 0.02, LEG - BH - 0.02]) {
    const friso = rbox(BW + 0.12, 0.04, 0.06, 0.015, SIGN_TRIM, { roughness: 0.75 })
    friso.position.set(0, yy, 0.005)
    frente.add(friso)
  }
  for (const [k, ch2] of WORD.entries()) {
    const l = letter(ch2)
    l.position.set((k - (WORD.length - 1) / 2) * PITCH, LEG - BH / 2 - 0.02, 0.032)
    frente.add(l)
  }
  const tras = new THREE.Group()
  tras.position.z = -2 * LEG * Math.sin(LEAN)
  tras.rotation.x = LEAN
  placa.add(tras)
  const costas = rbox(BW, BH, 0.03, 0.02, SIGN_TRIM, { roughness: 0.8 })
  costas.position.y = LEG - BH / 2 - 0.02
  tras.add(costas)
  for (const sx of [-1, 1]) {
    const montante = rbox(0.06, LEG, 0.06, 0.02, SIGN_TRIM, { roughness: 0.75 })
    montante.position.set(sx * (BW / 2 + 0.03), LEG / 2, 0)
    tras.add(montante)
  }
  const dobradica = cylinder(0.025, 0.025, BW + 0.16, IRON, { roughness: 0.4, metalness: 0.6 })
  dobradica.rotation.z = Math.PI / 2
  dobradica.position.set(0, LEG * Math.cos(LEAN), -LEG * Math.sin(LEAN))
  placa.add(dobradica)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cozinha', object: base },
    { name: 'pia', group: 'cozinha', object: pia },
    { name: 'vareta1', group: 'varetas', object: vareta1 },
    { name: 'vareta2', group: 'varetas', object: vareta2 },
    { name: 'vareta3', group: 'varetas', object: vareta3 },
    { name: 'vareta4', group: 'varetas', object: vareta4 },
    { name: 'vareta5', group: 'varetas', object: vareta5 },
    { name: 'vazia', group: 'varetas', object: vazia },
    { name: 'pratoO', group: 'varetas', object: pratoO },
    { name: 'diabo', group: 'diabo', object: diabo },
    { name: 'suor', group: 'grito', object: suor },
    { name: 'cacos', group: 'queda', object: cacos },
    { name: 'placa', group: 'placa', object: placa },
  ]

  // ---- montagem ------------------------------------------------------------
  const grow = (a = 0.01, b = 1) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const DY = DEV[1]

  const build = [
    // 1. a cozinha
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Numa cozinha de ladrilhos azuis, a pia transborda de louça suja…',
    }),
    seq('pia-rise', 'pia', 0.3, 0.95, [riseFrom(0, 3.0)], { ease: 'easeOut' }),

    // 2. as seis varetas, cada uma com um prato girando
    seq('vareta1-cresce', 'vareta1', 1.7, 0.6, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…mas em vez de lavar, alguém fincou SEIS varetas, com um prato girando em cada uma.',
    }),
    seq('vareta2-cresce', 'vareta2', 1.95, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('vareta3-cresce', 'vareta3', 2.2, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('vareta4-cresce', 'vareta4', 2.45, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('vareta5-cresce', 'vareta5', 2.7, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('vazia-cresce', 'vazia', 2.95, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('pratoO-surge', 'pratoO', 3.45, 0.4, grow(0.01, 1), { ease: 'easeOut' }),

    // 3. o diabo pula pra dentro, agarrado nas varetas do meio
    seq('diabo-salta', 'diabo', 4.3, 0.6, [ch('position.y', DY - 2.0, DY + 0.42)], {
      ease: 'easeOut',
      caption: 'Um diabo-da-tasmânia pula feito doido de vareta em vareta e berra: IÁ!',
    }),
    seq('diabo-desce', 'diabo', 4.9, 0.35, [ch('position.y', DY + 0.42, DY - 0.1)], { ease: 'easeIn' }),
    seq('diabo-repica', 'diabo', 5.25, 0.35, [ch('position.y', DY - 0.1, DY + 0.18)], { ease: 'easeOut' }),
    seq('diabo-assenta', 'diabo', 5.6, 0.3, [ch('position.y', DY + 0.18, DY)]),

    // 4. o grito: só o começo sai com força
    seq('suor-jorra', 'suor', 6.3, 0.45, grow(0.2, 1.15), {
      ease: 'easeOut',
      caption: "Ele tenta avisar 'É ESTRESSADO!', mas só o começo sai com toda a força: É-STRÉS…!",
    }),
    seq('suor-assenta', 'suor', 6.75, 0.3, grow(1.15, 1)),
    seq('diabo-treme-a', 'diabo', 6.3, 0.18, [ch('position.y', DY, DY + 0.1)], { ease: 'easeOut' }),
    seq('diabo-treme-b', 'diabo', 6.48, 0.18, [ch('position.y', DY + 0.1, DY)], { ease: 'easeIn' }),
    seq('diabo-treme-c', 'diabo', 6.66, 0.18, [ch('position.y', DY, DY + 0.07)], { ease: 'easeOut' }),
    seq('diabo-treme-d', 'diabo', 6.84, 0.2, [ch('position.y', DY + 0.07, DY)], { ease: 'easeIn' }),

    // 5. o fim sai num sopro… e o prato-O despenca
    seq('pratoO-bambeia', 'pratoO', 7.6, 0.6, [ch('rotation.x', 0.2, 0.55), ch('rotation.z', 0.15, -0.35)], {
      caption: '…e o fim já sai sem fôlego, num sopro fraquinho: …SAD. Lá em cima, o último prato bambeia…',
    }),
    seq('pratoO-cai', 'pratoO', 8.2, 0.55, [
      ch('position.x', ROD6[0], SHARDS[0]),
      ch('position.y', O_TOP, GY + 0.03),
      ch('position.z', ROD6[1], SHARDS[2]),
      ch('rotation.x', 0.55, 2.2),
      ch('rotation.z', -0.35, -0.6),
    ], { ease: 'easeIn' }),
    seq('vazia-balanca-a', 'vazia', 8.2, 0.3, [ch('rotation.z', 0, -0.24)], { ease: 'easeOut' }),
    seq('vazia-balanca-b', 'vazia', 8.5, 0.4, [ch('rotation.z', -0.24, 0.12)]),
    seq('vazia-balanca-c', 'vazia', 8.9, 0.45, [ch('rotation.z', 0.12, ROD6_LEAN)]),
    seq('pratoO-some', 'pratoO', 8.75, 0.08, grow(1, 0.001), { ease: 'linear' }),
    seq('cacos-estilhaca', 'cacos', 8.75, 0.45, grow(0.4, 1.3), {
      ease: 'easeOut',
      caption: '…despenca e se espatifa: redondo feito um O, levou embora o -O de ESTRESSADO.',
    }),

    // 6. a placa
    seq('placa-rise', 'placa', 10.0, 0.7, [riseFrom(GY, 0.9)], {
      ease: 'easeOut',
      caption: 'Na placa ficou só ESTRESSAD: ele está estressado.',
    }),
    seq('placa-balanca', 'placa', 10.7, 0.3, [ch('rotation.z', 0, 0.05)], { ease: 'easeOut' }),
    seq('placa-assenta', 'placa', 11.0, 0.35, [ch('rotation.z', 0.05, 0)]),

    // 7. a frase
    seq('diabo-pula-a', 'diabo', 11.7, 0.25, [ch('position.y', DY, DY + 0.12)], {
      ease: 'easeOut',
      caption: 'Jag är stressad. — Estou estressado.',
    }),
    seq('diabo-pula-b', 'diabo', 11.95, 0.3, [ch('position.y', DY + 0.12, DY)], { ease: 'easeIn' }),
    seq('suor-pulsa-a', 'suor', 11.7, 0.25, grow(1, 1.12), { ease: 'easeOut' }),
    seq('suor-pulsa-b', 'suor', 11.95, 0.3, grow(1.12, 1)),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.58, 5.5], target: [0.1, 1.32, 0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-stressad',
    contexto:
      "Trabalho perto do prazo, explicando por que vai pular a fika ('Jag är lite stressad just nu'); a correria da manhã em casa; na vårdcentral, quando o cansaço vira problema.",
    fraseFonte: 'Estou estressado.',
    fraseAlvo: 'Jag är stressad.',
    pronuncia:
      "iá é STRÉS-sad ('jag' = iá; 'är' = é; 'stressad' começa direto no S, sem 'is' na frente — o É do 'är' já faz esse papel; força no STRÉS, É aberto e curto, S comprido; o '-sad' do fim é fraquinho, A curto e D leve — nunca 'es-tre-SSÁ-do')",
    ponteSonora:
      "IÁ! É-STRÉS-SAD(o)! (4 batidas: iá-é-STRÉS-sad; a força cai TODA no STRÉS; IÁ é o 'jag' de sempre, I de IOGA; É-STRÉS = 'är stressad' dito como o português 'é estressado' emendado: o É do 'är' engole o 'es' do começo — 'é-is-tres' vira É-STRÉS, um É só, com o S já grudado no T, sem 'is' (o mesmo S colado do SSS-CÔL de 'Skål' e do vento de STUND); STRÉS com É ABERTO e curto, o TRÉ de 'esTRÉsse' — é aqui que bate a pancada, não no SA; SAD = o resto, rápido e fraco, A curto e D leve: o -O de 'estressado' caiu e quebrou; mas o D fica — sem ele vira 'stressa', o verbo (correr, se apressar))",
    historia:
      "Na cozinha, em vez de lavar a louça, o diabo-da-tasmânia tenta manter seis pratos girando em seis varetas e pula feito doido de uma vareta pra outra. Ele berra IÁ! e tenta avisar 'É ESTRESSADO!', mas só o começo sai com toda a força que sobrou: É-STRÉS...! O fim já sai sem fôlego, num sopro: ...sad. É que o último prato, redondo feito a letra O, despencou da vareta e se espatifou no chão, levando embora o -O de ESTRESSADO. Na placa ficou só ESTRESSAD: ele está estressado.",
  },
  createScene,
  refine: { organic: ['diabo'] },
}

export default card
