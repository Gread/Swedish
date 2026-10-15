import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Kan jag få menyn?" — CA-NIÁ, FÔ... me-NÜÜN?
 *
 * Bistrô de ladrilho xadrez. Você chama CANA, IÁ! e vem o chef francês de
 * bigode enrolado, com uma CANA-de-açúcar curtinha debaixo do braço no lugar
 * da baguete. Na outra mão ele ergue o cardápio da casa — um livrão de couro
 * vinho tão antigo que tem o N dourado de Napoleão na capa — e sopra de
 * bochechas estufadas um século de poeira: FÔÔ! A nuvem desce sobre a sua
 * mesa. Le me-NÜÜ… me-NÜÜN: o N é o artigo, O cardápio.
 *
 * Diorama: piso xadrez preto e branco, parede creme curva com lambri escuro e
 * lousa; mesinha redonda de toalha xadrez vermelha à direita; chef à esquerda
 * com o cardápio erguido entre os dois. O ouro é RESERVADO ao N.
 */

const PLINTH = '#3e2f25'
const GROUT = '#8f877b'
const TILE_W = '#ece5d6'
const TILE_B = '#2a2629'
const WALL = '#ead6a6'
const WALL_TRIM = '#f3e8cc'
const WOOD = '#5a3a25'
const WOOD_LIGHT = '#7a5236'
const SLATE = '#2d3b34'
const CHALK = '#e9e6dc'
const IRON = '#2f2c2e'
const CLOTH_R = '#b8453a'
const CLOTH_W = '#f3ede1'
const JACKET = '#f7f4ee'
const BUTTON = '#262329'
const SKIN = '#e8c39e'
const CHEEK = '#eba68c'
const HAIR = '#2a2220'
const LIPS = '#c7605a'
const FR_BLUE = '#2f4f8f'
const FR_RED = '#c0453b'
const CANE = '#a3b552'
const CANE_DARK = '#8da046'
const CANE_NODE = '#5e4a2a'
const CANE_WAX = '#dfe0b8'
const LEAF = '#5f913c'
const LEATHER = '#6b1d2a'
const LEATHER_DARK = '#4b1420'
const PAGES = '#efe3c4'
const BRONZE = '#5e4a32'
const DUST = '#b9b0a1'
const DUST_LIGHT = '#d2cabb'
const DUST_DARK = '#8f8676'
const GOLD = '#f2b52b' // acento saturado RESERVADO ao N de Napoleão

const GY = 0.16 // topo do piso
const S = 1.25 // escala do chef (person de altura 1.5 → ~1.9 + touca)
const CHEF: [number, number, number] = [-0.55, GY, -0.4]
const CHEF_YAW = 0.12
const TABLE: [number, number, number] = [1.0, GY, 0.48]
const TABLE_TOP = 0.72 // altura do tampo acima do piso

// braço do cardápio (rotation, pivô no ombro)
const ARM_REST_Z = -0.3
const ARM_UP_Z = 2.0
const ARM_UP_Y = -0.5

// dimensões do cardápio (em unidades locais do chef)
const MW = 0.62
const MH = 0.84
const MT = 0.1

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
function slab(
  poly: P2[],
  depth: number,
  color: string,
  opts: { roughness?: number; bevel?: number; detail?: number } = {},
) {
  const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)))
  const bevel = opts.bevel ?? 0.005
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  })
  const m = new THREE.Mesh(geo, mat(color, { roughness: opts.roughness ?? 0.4, size: 0.5, detail: opts.detail }))
  m.rotation.x = -Math.PI / 2
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Setor de anel extrudado para cima: paredes curvas, lambri, frisos. */
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
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 4,
  })
  const m = new THREE.Mesh(geo, mat(color, { roughness, size: height }))
  m.rotation.x = -Math.PI / 2 // shape (x, y) → mundo (x, -z): y>0 é o fundo
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Fatia de saia cilíndrica aberta (toalha caindo da mesa). */
function skirtPiece(r0: number, r1: number, h: number, t0: number, tl: number, color: string) {
  const geo = new THREE.CylinderGeometry(r0, r1, h, 4, 1, true, t0, tl)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.9, size: 0.3 }))
  m.material.side = THREE.DoubleSide
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Arco de toro (curvas do bigode, alças). */
function arc(r: number, tube: number, angle: number, color: string, roughness = 0.6) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 28, angle), mat(color, { roughness, size: r * 2 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Traço do N: barra dourada em relevo no plano xy. */
function goldStroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.035, Math.min(w, h) * 0.3, GOLD, { roughness: 0.28, metalness: 0.65 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base: piso xadrez do bistrô -----------------------------------------
  const base = new THREE.Group()

  const plinth = cylinder(2.62, 2.72, 0.12, PLINTH, { roughness: 0.8 })
  plinth.position.y = 0.06
  base.add(plinth)

  const grout = cylinder(2.52, 2.52, 0.03, GROUT, { roughness: 0.9 })
  grout.position.y = 0.135
  base.add(grout)

  const TS = 0.42 // passo dos ladrilhos
  const GAP = 0.022
  for (let i = -7; i <= 7; i++) {
    for (let j = -7; j <= 7; j++) {
      const cx = (i + 0.5) * TS
      const cz = (j + 0.5) * TS
      const h = TS / 2 - GAP / 2 - 0.005
      const sq: P2[] = [[cx - h, cz - h], [cx + h, cz - h], [cx + h, cz + h], [cx - h, cz + h]]
      const clipped = clipToCircle(sq, 2.44)
      if (clipped.length < 3) continue
      const tile = slab(clipped, 0.012, (i + j) % 2 === 0 ? TILE_W : TILE_B, {
        roughness: 0.32,
        detail: 0.25,
      })
      tile.position.y = GY - 0.012
      base.add(tile)
    }
  }

  // friso de latão escurecido na borda do piso
  const rim = torus(2.5, 0.035, WOOD, { roughness: 0.6 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = GY - 0.005
  base.add(rim)

  // vaso com buxo redondo (fundo direito, atrás da cadeira)
  const vaso = lathe(
    [[0, 0], [0.16, 0], [0.19, 0.05], [0.17, 0.3], [0.21, 0.34], [0.2, 0.37], [0.15, 0.33], [0, 0.32]],
    '#a8603f',
    { roughness: 0.6 },
  )
  vaso.position.set(1.95, GY, -0.75)
  base.add(vaso)
  const buxo = puff(0.3, '#4f7d46', 7, 37, { roughness: 0.9 })
  buxo.position.set(1.95, GY + 0.68, -0.75)
  base.add(buxo)

  // engradado de vinho (frente esquerda)
  const engradado = new THREE.Group()
  engradado.position.set(-1.5, GY, 0.7)
  engradado.rotation.y = 0.35 + rand() * 0.1
  const caixa = rbox(0.62, 0.3, 0.42, 0.025, '#8a6440', { roughness: 0.8 })
  caixa.position.y = 0.15
  engradado.add(caixa)
  for (const y of [0.08, 0.22]) {
    const ripa = rbox(0.64, 0.05, 0.44, 0.012, '#6f4f32', { roughness: 0.85 })
    ripa.position.y = y
    engradado.add(ripa)
  }
  for (const [k, bx] of [-0.2, -0.065, 0.07, 0.2].entries()) {
    const garrafa = lathe(
      [[0, 0], [0.055, 0], [0.058, 0.2], [0.03, 0.27], [0.022, 0.36], [0.026, 0.37], [0, 0.37]],
      k % 2 ? '#3d5a32' : '#5a2a2e',
      { roughness: 0.2 },
    )
    garrafa.position.set(bx, 0.12, (rand() - 0.5) * 0.08)
    garrafa.rotation.z = (rand() - 0.5) * 0.12
    engradado.add(garrafa)
  }
  base.add(engradado)

  root.add(base)

  // ---- parede creme curva, lambri escuro e lousa ----------------------------
  const parede = new THREE.Group()
  const A0 = Math.PI / 2 - 1.15
  const A1 = Math.PI / 2 + 1.15
  const WALL_H = 2.75

  const wall = arcWall(2.42, 2.56, WALL_H, A0, A1, WALL, 0.85)
  wall.position.y = 0.12
  parede.add(wall)

  const cornice = arcWall(2.36, 2.6, 0.08, A0 - 0.01, A1 + 0.01, WALL_TRIM, 0.6)
  cornice.position.y = 0.12 + WALL_H - 0.02
  parede.add(cornice)

  const lambri = arcWall(2.36, 2.43, 0.86, A0, A1, WOOD, 0.7)
  lambri.position.y = GY - 0.01
  parede.add(lambri)

  const rail = arcWall(2.32, 2.43, 0.06, A0, A1, WOOD_LIGHT, 0.6)
  rail.position.y = GY + 0.85
  parede.add(rail)

  // almofadas do lambri, viradas para o centro
  for (let k = -5; k <= 5; k++) {
    const a = Math.PI / 2 + k * 0.205
    const painel = rbox(0.38, 0.5, 0.03, 0.02, WOOD_LIGHT, { roughness: 0.65 })
    painel.position.set(Math.cos(a) * 2.35, GY + 0.43, -Math.sin(a) * 2.35)
    painel.rotation.y = a - Math.PI / 2
    parede.add(painel)
  }

  // lousa do bistrô atrás da touca (fundo escuro para o branco do chef)
  const lousa = new THREE.Group()
  const LA = Math.PI / 2 + 0.62
  lousa.position.set(Math.cos(LA) * 2.38, 1.78, -Math.sin(LA) * 2.38)
  lousa.rotation.y = LA - Math.PI / 2
  const moldura = rbox(1.15, 0.82, 0.05, 0.03, WOOD, { roughness: 0.7 })
  lousa.add(moldura)
  const ardosia = rbox(1.03, 0.7, 0.03, 0.015, SLATE, { roughness: 0.95 })
  ardosia.position.z = 0.018
  lousa.add(ardosia)
  // rabiscos de giz: linhas de prato do dia, sem letras
  for (const [k, w] of [0.62, 0.48, 0.7, 0.4, 0.55].entries()) {
    const linha = rbox(w, 0.022, 0.01, 0.008, CHALK, { roughness: 0.95 })
    linha.position.set(-0.36 + w / 2 + (k % 2) * 0.05, 0.24 - k * 0.12, 0.036)
    linha.rotation.z = (rand() - 0.5) * 0.05
    lousa.add(linha)
    const preco = rbox(0.06, 0.022, 0.01, 0.008, CHALK, { roughness: 0.95 })
    preco.position.set(0.4, 0.24 - k * 0.12, 0.036)
    lousa.add(preco)
  }
  parede.add(lousa)

  // arandelas de latão com globo aceso
  {
    const a = Math.PI / 2 + 1.02
    const arandela = new THREE.Group()
    arandela.position.set(Math.cos(a) * 2.4, 1.72, -Math.sin(a) * 2.4)
    arandela.rotation.y = a - Math.PI / 2
    const espelho = cylinder(0.07, 0.07, 0.03, '#a8874a', { roughness: 0.3, metalness: 0.7 })
    espelho.rotation.x = Math.PI / 2
    arandela.add(espelho)
    const haste = cylinder(0.018, 0.018, 0.16, '#a8874a', { roughness: 0.3, metalness: 0.7 })
    haste.rotation.x = Math.PI / 2
    haste.position.z = 0.08
    arandela.add(haste)
    const globo = sphere(0.1, '#fff1cf', { emissive: '#ffd58a', emissiveIntensity: 0.9 })
    globo.position.set(0, 0.06, 0.17)
    arandela.add(globo)
    parede.add(arandela)
  }

  root.add(parede)

  // ---- mesinha redonda de bistrô --------------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(TABLE[0], 0, TABLE[2])
  root.add(mesa)

  const pe = lathe(
    [[0, 0], [0.26, 0], [0.27, 0.02], [0.2, 0.05], [0.06, 0.09], [0.035, 0.14], [0.035, 0.6], [0.06, 0.64], [0.12, 0.66], [0, 0.66]],
    IRON,
    { roughness: 0.35, metalness: 0.6 },
  )
  pe.position.y = GY
  mesa.add(pe)

  const tampo = cylinder(0.46, 0.46, 0.04, '#6b4a30', { roughness: 0.6 })
  tampo.position.y = GY + TABLE_TOP - 0.03
  mesa.add(tampo)

  // toalha: disco branco com xadrez vermelho recortado no círculo
  const CR = 0.5
  const toalha = cylinder(CR, CR, 0.02, CLOTH_W, { roughness: 0.92 })
  toalha.position.y = GY + TABLE_TOP
  mesa.add(toalha)
  const CS = 0.125
  for (let i = -4; i <= 3; i++) {
    for (let j = -4; j <= 3; j++) {
      if ((i + j) % 2 === 0) continue
      const x0 = i * CS
      const z0 = j * CS
      const sq: P2[] = [[x0 + 0.004, z0 + 0.004], [x0 + CS - 0.004, z0 + 0.004], [x0 + CS - 0.004, z0 + CS - 0.004], [x0 + 0.004, z0 + CS - 0.004]]
      const clipped = clipToCircle(sq, CR - 0.006)
      if (clipped.length < 3) continue
      const quad = slab(clipped, 0.004, CLOTH_R, { roughness: 0.92, bevel: 0 })
      quad.position.y = GY + TABLE_TOP + 0.009
      mesa.add(quad)
    }
  }
  // saia da toalha em xadrez: duas fileiras de gomos alternados
  const NSEG = 24
  for (let row = 0; row < 2; row++) {
    for (let s = 0; s < NSEG; s++) {
      const color = (s + row) % 2 === 0 ? CLOTH_R : CLOTH_W
      const r0 = CR + 0.002 + row * 0.012
      const piece = skirtPiece(r0, r0 + 0.012, 0.07, (s / NSEG) * Math.PI * 2, (Math.PI * 2) / NSEG, color)
      piece.position.y = GY + TABLE_TOP - 0.035 - row * 0.07
      mesa.add(piece)
    }
  }

  // prato vazio com talheres: a mesa espera o cardápio
  const prato = lathe(
    [[0, 0], [0.1, 0], [0.12, 0.012], [0.17, 0.022], [0.18, 0.03], [0.16, 0.028], [0.11, 0.018], [0, 0.016]],
    '#fbf8f1',
    { roughness: 0.2 },
  )
  prato.position.set(-0.12, GY + TABLE_TOP + 0.012, 0.18)
  mesa.add(prato)
  for (const sx of [-1, 1]) {
    const talher = rbox(0.022, 0.008, 0.24, 0.004, '#b9bec4', { roughness: 0.25, metalness: 0.8 })
    talher.position.set(-0.12 + sx * 0.23, GY + TABLE_TOP + 0.016, 0.18)
    mesa.add(talher)
  }
  // garrafa-castiçal com vela e escorridos de cera
  const castical = new THREE.Group()
  castical.position.set(0.16, GY + TABLE_TOP + 0.01, -0.14)
  const garrafa = lathe(
    [[0, 0], [0.06, 0], [0.065, 0.03], [0.07, 0.17], [0.035, 0.24], [0.025, 0.3], [0.03, 0.31], [0, 0.31]],
    '#2f4a2c',
    { roughness: 0.18 },
  )
  castical.add(garrafa)
  const vela = cylinder(0.02, 0.022, 0.12, '#f4ecd8', { roughness: 0.6 })
  vela.position.y = 0.37
  castical.add(vela)
  const chama = sphere(0.022, '#ffd27a', { emissive: '#ffb347', emissiveIntensity: 1.4 })
  chama.scale.y = 1.7
  chama.position.y = 0.46
  castical.add(chama)
  for (const [k, a] of [0.4, 2.2, 4.1].entries()) {
    const cera = capsule(0.012, 0.05 + k * 0.03, '#f4ecd8', { roughness: 0.6 })
    cera.position.set(Math.cos(a) * 0.03, 0.27 - k * 0.02, Math.sin(a) * 0.03)
    castical.add(cera)
  }
  mesa.add(castical)

  // cadeira de bistrô (madeira curvada) virada para a mesa
  const cadeira = new THREE.Group()
  cadeira.position.set(0.72, GY, 0.2)
  cadeira.rotation.y = -Math.PI / 2 - 0.35
  const assento = cylinder(0.2, 0.2, 0.04, '#4a3020', { roughness: 0.6 })
  assento.position.y = 0.45
  cadeira.add(assento)
  const aro = torus(0.2, 0.018, WOOD, { roughness: 0.5 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.43
  cadeira.add(aro)
  for (const [lx, lz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]] as const) {
    const perna = cylinder(0.017, 0.014, 0.45, WOOD, { roughness: 0.5 })
    perna.position.set(lx, 0.225, lz)
    perna.rotation.set(lz * 0.25, 0, -lx * 0.25)
    cadeira.add(perna)
  }
  const anel = torus(0.15, 0.012, WOOD, { roughness: 0.5 })
  anel.rotation.x = Math.PI / 2
  anel.position.y = 0.18
  cadeira.add(anel)
  const encosto = torus(0.16, 0.02, WOOD, { roughness: 0.5 })
  encosto.position.set(0, 0.68, -0.19)
  encosto.scale.set(1, 1.3, 1)
  cadeira.add(encosto)
  for (const sx of [-1, 1]) {
    const montante = cylinder(0.018, 0.018, 0.36, WOOD, { roughness: 0.5 })
    montante.position.set(sx * 0.16, 0.6, -0.19)
    cadeira.add(montante)
  }
  mesa.add(cadeira)

  // ---- chef francês ----------------------------------------------------------
  const chef = person({ body: JACKET, skin: SKIN, height: 1.5, armAngle: 0.3 })
  chef.position.set(...CHEF)
  chef.rotation.y = CHEF_YAW
  chef.scale.setScalar(S)
  root.add(chef)

  // dólmã: fileira dupla de botões pretos e a aba transpassada
  for (const bx of [-0.085, 0.085]) {
    for (const by of [0.27, 0.38, 0.49]) {
      const botao = sphere(0.024, BUTTON, { roughness: 0.3 })
      botao.scale.z = 0.55
      botao.position.set(bx, by, 0.262)
      chef.add(botao)
    }
  }
  // avental envolvendo a frente do quadril, com cordão azul na cintura
  const avental = skirtPiece(0.268, 0.29, 0.26, -1.25, 2.5, '#efebe2')
  avental.position.y = 0.2
  chef.add(avental)
  const cordao = torus(0.262, 0.016, FR_BLUE, { roughness: 0.8 })
  cordao.rotation.x = Math.PI / 2
  cordao.position.y = 0.33
  chef.add(cordao)

  // lenço tricolor no pescoço
  const golaLenco = torus(0.16, 0.045, CLOTH_W, { roughness: 0.85 })
  golaLenco.rotation.x = Math.PI / 2
  golaLenco.position.y = 0.76
  chef.add(golaLenco)
  const no = sphere(0.055, FR_BLUE, { roughness: 0.85 })
  no.position.set(0, 0.73, 0.2)
  chef.add(no)
  for (const [k, color] of [FR_BLUE, CLOTH_W, FR_RED].entries()) {
    const faixa = rbox(0.06, 0.16, 0.025, 0.012, color, { roughness: 0.85 })
    faixa.position.set(-0.062 + k * 0.062, 0.63, 0.24)
    faixa.rotation.x = -0.35
    chef.add(faixa)
  }

  const head = chef.getObjectByName('head') as THREE.Group
  head.rotation.y = 0.32 // vira para o cardápio que ele sopra

  // ---- bigode de pontas enroladas + sobrancelhas ----------------------------
  const bigode = new THREE.Group()
  bigode.position.set(0, -0.075, 0.27)
  head.add(bigode)
  const meio = sphere(0.032, HAIR, { roughness: 0.55 })
  meio.scale.set(1.3, 0.9, 0.8)
  bigode.add(meio)
  for (const side of [-1, 1]) {
    // guidão: sai do meio para fora e afina, com a ponta virando um caracol
    // baixo, na lateral do rosto, longe dos olhos
    const lado = capsule(0.03, 0.1, HAIR, { roughness: 0.55 })
    lado.rotation.set(0, side * 0.35, -side * (Math.PI / 2 - 0.12))
    lado.position.set(side * 0.075, -0.005, -0.005)
    bigode.add(lado)
    const ponta = capsule(0.02, 0.06, HAIR, { roughness: 0.55 })
    ponta.rotation.set(0, side * 0.6, -side * (Math.PI / 2 - 0.44))
    ponta.position.set(side * 0.16, 0.025, -0.025)
    bigode.add(ponta)
    // caracol: a ponta entra por baixo, vai para fora, sobe e volta por cima
    const caracol = arc(0.026, 0.012, Math.PI * 1.55, HAIR, 0.55)
    caracol.position.set(side * 0.197, 0.072, -0.05)
    caracol.rotation.set(0, side * 0.75, side > 0 ? -Math.PI / 2 : -0.157)
    bigode.add(caracol)

    const sobrancelha = rbox(0.12, 0.03, 0.03, 0.013, HAIR, { roughness: 0.6 })
    sobrancelha.position.set(side * 0.11, 0.2, -0.04)
    sobrancelha.rotation.z = -side * 0.22
    bigode.add(sobrancelha)
  }

  // ---- bochechas estufadas e o bico de sopro (FÔÔ) ---------------------------
  const bochechas = new THREE.Group()
  bochechas.position.set(0, -0.1, 0.2)
  head.add(bochechas)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.092, CHEEK, { roughness: 0.6 })
    bochecha.scale.set(1, 0.92, 0.82)
    bochecha.position.set(side * 0.15, -0.06, -0.01)
    bochechas.add(bochecha)
  }
  const bico = torus(0.032, 0.02, LIPS, { roughness: 0.4 })
  bico.position.set(0.025, -0.06, 0.075)
  bico.rotation.y = 0.35
  bochechas.add(bico)
  const furo = sphere(0.026, '#4a2420', { roughness: 0.6 })
  furo.position.set(0.025, -0.06, 0.07)
  furo.scale.z = 0.5
  bochechas.add(furo)

  // ---- touca de chef alta e pregueada ---------------------------------------
  const touca = new THREE.Group()
  touca.position.set(0, 0.0, 0)
  head.add(touca)
  const faixaTouca = lathe(
    [[0.255, 0.16], [0.27, 0.17], [0.272, 0.31], [0.262, 0.32], [0, 0.32]],
    JACKET,
    { roughness: 0.75 },
  )
  touca.add(faixaTouca)
  const corpoTouca = lathe(
    [[0.255, 0.3], [0.29, 0.42], [0.33, 0.58], [0.355, 0.66], [0.33, 0.74], [0.24, 0.8], [0.12, 0.825], [0, 0.83]],
    '#fdfcf8',
    { roughness: 0.85 },
  )
  touca.add(corpoTouca)
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2
    const prega = capsule(0.022, 0.26, '#fdfcf8', { roughness: 0.85 })
    prega.position.set(Math.cos(a) * 0.3, 0.5, Math.sin(a) * 0.3)
    // inclina acompanhando o alargamento do corpo
    prega.rotation.set(Math.sin(a) * 0.27, 0, -Math.cos(a) * 0.27)
    touca.add(prega)
  }

  // ---- cana-de-açúcar debaixo do braço esquerdo -----------------------------
  const bracoL = chef.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoL, 1.5)
  bracoL.rotation.set(-0.3, 0, 0.22)

  const cana = new THREE.Group()
  cana.position.set(-0.4, 0.56, 0.12)
  cana.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-0.78, -0.1, 0.62).normalize(),
  )
  chef.add(cana)
  // gomos barrigudos (torneados) separados por nós salientes: cana, não alho-poró
  const CL = 1.1
  const nodes = 5
  const segL = CL / nodes
  for (let k = 0; k < nodes; k++) {
    const gomo = lathe(
      [[0.05, 0], [0.058, segL * 0.2], [0.06, segL * 0.5], [0.058, segL * 0.8], [0.05, segL]],
      k % 2 ? CANE : CANE_DARK,
      { roughness: 0.4 },
      20,
    )
    gomo.position.y = -CL / 2 - 0.2 + segL * k
    cana.add(gomo)
    const anelNo = torus(0.056, 0.02, CANE_NODE, { roughness: 0.5 })
    anelNo.rotation.x = Math.PI / 2
    anelNo.position.y = -CL / 2 - 0.2 + segL * k
    cana.add(anelNo)
    // faixa de cera clara logo acima de cada nó
    const cera = cylinder(0.054, 0.054, 0.03, CANE_WAX, { roughness: 0.6 }, 20)
    cera.position.y = -CL / 2 - 0.2 + segL * k + 0.032
    cana.add(cera)
    // gema do nó: o botãozinho que toda cana tem
    const gema = sphere(0.018, CANE_NODE, { roughness: 0.5 })
    gema.position.set(0.05 * (k % 2 ? 1 : -1), -CL / 2 - 0.2 + segL * k + 0.03, 0.03)
    cana.add(gema)
  }
  const corte = cylinder(0.05, 0.05, 0.012, '#e8dfb0', { roughness: 0.7 })
  corte.position.y = -CL / 2 - 0.2
  cana.add(corte)
  // tufo curto de folhas na ponta da frente
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4
    const folha = capsule(0.02, 0.16 + (k % 2) * 0.05, LEAF, { roughness: 0.7 })
    folha.scale.set(1, 1, 0.35)
    folha.position.set(Math.cos(a) * 0.04, CL / 2 - 0.2 + 0.09, Math.sin(a) * 0.04)
    folha.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6)
    cana.add(folha)
  }

  // ---- braço direito ergue o cardápio ---------------------------------------
  const bracoR = chef.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  bracoR.rotation.set(0, ARM_UP_Y, ARM_UP_Z)

  // ---- cardápio gigante de couro vinho -------------------------------------
  const cardapio = new THREE.Group()
  bracoR.add(cardapio)

  const capa = rbox(MW, MH, 0.03, 0.03, LEATHER, { roughness: 0.7 })
  capa.position.z = MT / 2 - 0.015
  cardapio.add(capa)
  const contracapa = rbox(MW, MH, 0.03, 0.03, LEATHER, { roughness: 0.7 })
  contracapa.position.z = -MT / 2 + 0.015
  cardapio.add(contracapa)
  const miolo = rbox(MW - 0.05, MH - 0.05, MT - 0.04, 0.01, PAGES, { roughness: 0.9 })
  miolo.position.x = 0.012
  cardapio.add(miolo)
  const lombada = cylinder(MT / 2 + 0.004, MT / 2 + 0.004, MH, LEATHER_DARK, { roughness: 0.7 })
  lombada.position.x = -MW / 2
  cardapio.add(lombada)
  for (const ly of [-0.28, 0, 0.28]) {
    const nervo = torus(MT / 2 + 0.006, 0.01, LEATHER_DARK, { roughness: 0.6 })
    nervo.rotation.x = Math.PI / 2
    nervo.position.set(-MW / 2, ly, 0)
    cardapio.add(nervo)
  }
  // moldura gravada na capa
  for (const [w, h, x, y] of [
    [MW - 0.12, 0.022, 0, MH / 2 - 0.07],
    [MW - 0.12, 0.022, 0, -MH / 2 + 0.07],
    [0.022, MH - 0.14, MW / 2 - 0.06, 0],
    [0.022, MH - 0.14, -MW / 2 + 0.06, 0],
  ] as const) {
    const friso = rbox(w, h, 0.012, 0.008, LEATHER_DARK, { roughness: 0.6 })
    friso.position.set(x, y, MT / 2 + 0.002)
    cardapio.add(friso)
  }
  // cantoneiras de bronze velho
  for (const cx of [-1, 1]) {
    for (const cy of [-1, 1]) {
      const canto = rbox(0.09, 0.09, MT + 0.012, 0.02, BRONZE, { roughness: 0.4, metalness: 0.6 })
      canto.position.set(cx * (MW / 2 - 0.03), cy * (MH / 2 - 0.03), 0)
      canto.rotation.z = Math.PI / 4
      cardapio.add(canto)
    }
  }
  // pó de século assentado na capa: montinhos nas bordas, longe do N
  for (const [k, [px, py]] of ([
    [0.2, 0.37], [-0.05, 0.385], [0.27, 0.12], [0.255, -0.3], [-0.2, -0.37],
  ] as const).entries()) {
    const po = sphere(0.026 + (k % 2) * 0.008, DUST, { roughness: 0.95 })
    po.scale.set(1.6, 0.6, 0.18)
    po.position.set(px, py, MT / 2 + 0.006)
    cardapio.add(po)
  }

  // fitilho marcador saindo de baixo
  const fitilho = rbox(0.035, 0.16, 0.008, 0.004, '#2f5a46', { roughness: 0.6 })
  fitilho.position.set(0.12, -MH / 2 - 0.06, 0)
  fitilho.rotation.z = 0.15
  cardapio.add(fitilho)

  // ---- o N dourado de Napoleão, em coroa de louros --------------------------
  const letraN = new THREE.Group()
  letraN.position.set(0.01, 0.03, MT / 2 + 0.015)
  cardapio.add(letraN)
  const NH = 0.3
  letraN.add(goldStroke(0.038, NH, -0.095, 0)) // haste fina esquerda
  letraN.add(goldStroke(0.038, NH, 0.095, 0)) // haste fina direita
  letraN.add(goldStroke(0.075, NH * 1.12, 0, 0, 0.56)) // diagonal grossa
  for (const [x, y] of [[-0.095, NH / 2], [-0.095, -NH / 2], [0.095, NH / 2]] as const) {
    letraN.add(goldStroke(0.1, 0.03, x, y)) // serifas
  }
  // louros: duas meias-coroas de folhas
  const WR = 0.26
  const LA0 = -Math.PI / 2 + 0.35
  const LSTEP = 0.29
  for (const side of [-1, 1]) {
    for (let k = 0; k < 8; k++) {
      const a = LA0 + k * LSTEP
      const folha = sphere(0.04, GOLD, { roughness: 0.3, metalness: 0.65 })
      folha.scale.set(0.5, 1, 0.35)
      const r = WR + (k % 2 ? 0.025 : -0.025)
      folha.position.set(side * Math.cos(a) * r, Math.sin(a) * r, 0)
      folha.rotation.z = side * (a + (k % 2 ? -0.5 : 0.5))
      letraN.add(folha)
    }
    const ramo = arc(WR, 0.009, LSTEP * 7, GOLD, 0.3)
    ramo.rotation.z = side > 0 ? LA0 : Math.PI - (LA0 + LSTEP * 7)
    letraN.add(ramo)
  }
  const laco = sphere(0.03, GOLD, { roughness: 0.3, metalness: 0.65 })
  laco.position.set(0, -WR - 0.005, 0)
  letraN.add(laco)

  // pose do cardápio: frente para a câmera, segurado pela borda de baixo
  root.updateMatrixWorld(true)
  {
    const desired = new THREE.Matrix4().compose(
      new THREE.Vector3(0.86, 1.37, 0.2), // em unidades locais do chef
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.15, -CHEF_YAW - 0.12, 0.07)),
      new THREE.Vector3(1, 1, 1),
    )
    bracoR.updateMatrix()
    const local = bracoR.matrix.clone().invert().multiply(desired)
    local.decompose(cardapio.position, cardapio.quaternion, cardapio.scale)
  }
  root.updateMatrixWorld(true)

  // ---- poeira: três nuvens saindo da capa (FÔÔ) ------------------------------
  const menuW = new THREE.Vector3()
  cardapio.getWorldPosition(menuW)
  // nuvem de poeira: bolotas em dois tons, achatadas embaixo, com grãos soltos
  const nuvem = (r: number, seed: number) => {
    const g = new THREE.Group()
    const rr = rng(seed)
    const core = sphere(r, DUST, { roughness: 0.95 })
    core.scale.y = 0.85
    g.add(core)
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + rr() * 0.5
      const lr = r * (0.42 + rr() * 0.3)
      const lump = sphere(lr, k % 3 ? DUST : DUST_LIGHT, { roughness: 0.95 })
      const up = rr() * 0.7 - 0.15
      lump.position.set(Math.cos(a) * r * 0.78, up * r, Math.sin(a) * r * 0.62)
      g.add(lump)
    }
    for (let k = 0; k < 7; k++) {
      const a = rr() * Math.PI * 2
      const grao = sphere(r * (0.06 + rr() * 0.05), DUST_DARK, { roughness: 0.95 }, 10)
      const d = r * (1.25 + rr() * 0.45)
      grao.position.set(Math.cos(a) * d, (rr() - 0.4) * r * 1.2, Math.sin(a) * d * 0.7)
      g.add(grao)
    }
    return g
  }
  const DUST_POS: [number, number, number][] = [
    [menuW.x + 0.44, menuW.y + 0.16, menuW.z + 0.12],
    [menuW.x + 0.74, menuW.y - 0.18, menuW.z + 0.3],
    [TABLE[0] + 0.12, GY + TABLE_TOP + 0.44, TABLE[2] - 0.05],
  ]
  const poeira1 = nuvem(0.15, 61)
  poeira1.position.set(...DUST_POS[0])
  root.add(poeira1)
  const poeira2 = nuvem(0.2, 62)
  poeira2.position.set(...DUST_POS[1])
  root.add(poeira2)
  const poeira3 = nuvem(0.25, 63)
  poeira3.position.set(...DUST_POS[2])
  poeira3.scale.set(1.3, 0.85, 1.15)
  root.add(poeira3)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'bistro', object: base },
    { name: 'parede', group: 'bistro', object: parede },
    { name: 'mesa', group: 'bistro', object: mesa },
    { name: 'chef', group: 'chef', object: chef },
    { name: 'bigode', group: 'chef', object: bigode },
    { name: 'touca', group: 'chef', object: touca },
    { name: 'cana', group: 'cana', object: cana },
    { name: 'bracoR', group: 'cardapio', object: bracoR },
    { name: 'cardapio', group: 'cardapio', object: cardapio },
    { name: 'bochechas', group: 'fo', object: bochechas },
    { name: 'poeira1', group: 'fo', object: poeira1 },
    { name: 'poeira2', group: 'fo', object: poeira2 },
    { name: 'poeira3', group: 'fo', object: poeira3 },
    { name: 'letraN', group: 'nyn', object: letraN },
  ]

  const caneQ = cana.position.clone()
  const p3s = poeira3.scale.clone()

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Num bistrô de ladrilho xadrez você senta… e ninguém traz o cardápio.',
    }),
    seq('parede-rise', 'parede', 0.25, 0.9, [riseFrom(0, 3.0)], { ease: 'easeOut' }),
    seq('mesa-rise', 'mesa', 0.9, 0.8, [riseFrom(0, 1.0)], { ease: 'easeOut' }),

    seq('chef-rise', 'chef', 2.2, 0.9, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: 'Você ergue a mão e chama: CANA, IÁ! — e vem o chef francês…',
    }),
    // o braço do cardápio é peça própria: brota do ombro junto com o chef
    seq('braco-brota', 'bracoR', 2.2, 0.9, [ch('scale.y', 0.3, 1)], { ease: 'easeOut' }),
    seq('bigode-pop', 'bigode', 2.85, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('touca-cai', 'touca', 3.05, 0.65, [
      ch('position.y', 0.9, 0), ch('rotation.z', 0.5, 0),
    ], { ease: 'easeOut', caption: '…de bigode enrolado e touca alta.' }),

    seq('cana-entra', 'cana', 4.3, 0.8, [
      ch('position.x', caneQ.x - 0.9, caneQ.x),
      ch('position.z', caneQ.z + 0.9, caneQ.z),
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Debaixo do braço, no lugar da baguete, uma CANA curtinha: CA-NIÁ!',
    }),

    seq('braco-ergue', 'bracoR', 5.9, 0.9, [
      ch('rotation.z', ARM_REST_Z, ARM_UP_Z), ch('rotation.y', 0, ARM_UP_Y),
    ], {
      ease: 'easeInOut',
      caption: 'Na outra mão, o cardápio da casa: um livrão de couro de séculos…',
    }),
    seq('cardapio-cresce', 'cardapio', 6.05, 0.8, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('bochechas-enchem', 'bochechas', 7.6, 0.45, [
      ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
    ], {
      ease: 'easeOut',
      caption: 'Ele enche as bochechas e sopra um século de poeira: FÔÔÔ!',
    }),
    seq('poeira1-sai', 'poeira1', 7.95, 0.6, [
      ch('position.x', DUST_POS[0][0] - 0.45, DUST_POS[0][0]),
      ch('scale.x', 0.1, 1), ch('scale.y', 0.1, 1), ch('scale.z', 0.1, 1),
    ], { ease: 'easeOut' }),
    seq('poeira2-sai', 'poeira2', 8.15, 0.7, [
      ch('position.x', DUST_POS[1][0] - 0.7, DUST_POS[1][0]),
      ch('position.y', DUST_POS[1][1] + 0.3, DUST_POS[1][1]),
      ch('scale.x', 0.1, 1), ch('scale.y', 0.1, 1), ch('scale.z', 0.1, 1),
    ], { ease: 'easeOut' }),
    seq('poeira3-desce', 'poeira3', 8.35, 0.9, [
      ch('position.x', DUST_POS[2][0] - 0.6, DUST_POS[2][0]),
      ch('position.y', DUST_POS[2][1] + 0.7, DUST_POS[2][1]),
      ch('scale.x', 0.1, p3s.x), ch('scale.y', 0.1, p3s.y), ch('scale.z', 0.1, p3s.z),
    ], { ease: 'easeOut' }),

    seq('n-brilha', 'letraN', 9.7, 0.7, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('rotation.z', -0.6, 0),
    ], {
      ease: 'easeOut',
      caption: 'Na capa, o N dourado de Napoleão: le me-NÜÜ… me-NÜÜN! — O cardápio.',
    }),
    seq('n-gira', 'letraN', 11.2, 0.9, [ch('rotation.y', Math.PI * 2, 0)], {
      ease: 'easeInOut',
      caption: 'Kan jag få menyn? — Pode me trazer o cardápio?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.2, 4.3], target: [0.3, 1.4, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-fa-menyn',
    contexto:
      'Restaurante e bar: ao sentar, quando ninguém trouxe o cardápio, ou de novo na hora da sobremesa. Com QR code na mesa, serve pra pedir o cardápio de papel.',
    fraseFonte: 'Pode me trazer o cardápio?',
    fraseAlvo: 'Kan jag få menyn?',
    pronuncia:
      "kan iá fô me-NÜÜN ('jag' = iá, o -g não soa; 'få' = fô, ô fechado e longo; a força cai no NÜÜN: o 'y' é Ü, com lábios de U em bico e língua de I, e é longo; o N final é o artigo e sempre soa)",
    ponteSonora:
      "CA-NIÁ, FÔ... me-NÜÜN? (5 sílabas: ca-niá-fô-me-NÜÜN; a força vai TODA pro NÜÜN; CA-NIÁ é a CANA + IÁ de 'Kan jag få en påse?', 'Kan jag betala med kort?' e 'Kan jag swisha?', emendado, com I de IOGA, nunca o J chiado de 'canja'; FÔ é o sopro de bochechas redondas de 'Kan vi få notan, tack?' (e o FÔ da galinha FÔfa): Ô FECHADO de 'avô', nunca 'fó'; me-NÜÜN é o MENU dito por um francês, e o U francês é EXATAMENTE o y sueco: lábios de U em bico de pato, língua de I, e LONGO; o 'me' vem fraquinho e rápido, nunca 'MÊ-nu' com força na frente; o N final é o N dourado de Napoleão: OBRIGATÓRIO, batido na ponta da língua, sem nasalar. Ele é o artigo 'o': sem ele sobra 'meny', UM cardápio qualquer)",
    historia:
      'No bistrô ninguém trouxe o cardápio, então você ergue a mão e chama: CANA, IÁ! Quem vem é o chef francês de bigode enrolado, que anda com uma cana-de-açúcar curtinha debaixo do braço no lugar da baguete e, debaixo do outro, o cardápio da casa: um livrão de couro tão antigo que ainda tem o N dourado de Napoleão na capa. Ele enche as bochechas e sopra um século de poeira, FÔÔ!, numa nuvem que cobre a mesa inteira. Quando a poeira baixa, ele faz o bico mais francês do mundo, le me-NÜÜ..., e crava o dedo no N dourado: me-NÜÜN! Pronto: O cardápio chegou à sua mesa.',
  },
  createScene,
  refine: { organic: ['poeira1', 'poeira2', 'poeira3'] },
}

export default card
