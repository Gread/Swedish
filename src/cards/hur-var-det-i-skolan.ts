import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, shoulderPivot, mat,
  rbox, cylinder, sphere, cone, torus, rock, puff, person,
} from '../rig/helpers'

/**
 * "Hur var det i skolan?" — RRÜR! VÁR... DÊ? IS-KÚÚ-LAN?
 *
 * Três da tarde, saída da ESCOLA: as portas azuis se abrem e lá vem o
 * zumbi-criança se arrastando, braço esticado, rosnando RRÜÜR. Na outra mão
 * ele ergue uma VARA comprida feito bandeira de rendição, com a prova
 * espetada na ponta e um DÊ vermelho enorme. E geme o nome do lugar de onde
 * acabou de sair, com um U de zumbi que não termina: IS-KUUUU-LAN…
 *
 * Diorama: calçada de lajotas cinza com faixas de grama, fachada baixa de
 * parede amarela e telhado vermelho, porta dupla azul aberta, placa ESCOLA.
 * Zumbi de pele verde-acinzentada, camiseta laranja rasgada, bermuda azul,
 * mochila escorregando de um ombro só.
 *
 * Acento saturado (vermelho vivo) RESERVADO ao D da prova.
 */

const SOIL = '#5a4532'
const GRASS = '#86b25c'
const GRASS_DARK = '#6d9a49'
const PAVE = '#bcb8af'
const PAVE_2 = '#b1ada4'
const CURB = '#cfcbc2'
const WALL = '#eac35c'
const WALL_DARK = '#cfa646'
const PLINTH = '#8e8a83'
const ROOF = '#a84b38'
const ROOF_DARK = '#8a3a2b'
const TRIM = '#f4f0e6'
const DOOR = '#3c69a6'
const DOOR_DARK = '#2d5189'
const GLASS = '#a7cbe0'
const INTERIOR = '#2b2723'
const INK = '#26324f'
const ZSKIN = '#9db58c'
const ZSKIN_DARK = '#7a9269'
const SHIRT = '#e2782f'
const SHORTS = '#35568c'
const SHOE = '#3a3532'
const HAIR = '#1f1c21'
const BRUISE = '#6b4a7e'
const BAG = '#8f4a44'
const BAG_DARK = '#6e3532'
const WOOD = '#8a5a32'
const WOOD_DARK = '#6b4325'
const PAPER = '#f8f5ec'
const LINE = '#bdb8ad'
const RED = '#e3191b' // acento reservado: o DÊ da prova

const GY = 0.16 // topo da grama
const SY = GY + 0.035 // topo das lajotas

// escola
const WALL_W = 3.4
const WALL_H = 1.45
const WALL_D = 0.7
const WALL_Z = -1.55 // centro
const FRONT = WALL_Z + WALL_D / 2 // fachada
const DOOR_X = -1.08
const DOOR_W = 0.72
const DOOR_H = 1.0
const SIGN_Y = GY + DOOR_H + 0.24

// zumbi
const ZX = 0.62
const ZZ = 0.8
const ZYAW = 0.42
const ZLEAN = 0.2
const ZS = 1.3
const ARM_R: [number, number] = [-1.78, 0.12] // braço esticado: [rotation.x, rotation.z]
const ARM_L: [number, number] = [0.55, -2.25] // braço que segura a vara

// vara: inclinação final
const VARA_TILT = 0.07

// mochila: de frente pra fora, balançando do ombro
const MOCHILA_YAW = 1.68
const MOCHILA_SWING = -0.32

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, color: string, rot = 0) {
  const s = rbox(w, h, 0.03, Math.min(w, h) * 0.3, color, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Arco de tubo (letras redondas): começa em `start` e gira `len` no sentido anti-horário. */
function arc(r: number, tube: number, start: number, len: number, color: string, opts = {}) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 36, len), mat(color, { roughness: 0.5, size: r * 2, ...opts }))
  m.rotation.z = start
  m.castShadow = true
  m.receiveShadow = true
  return m
}

const DEG = Math.PI / 180

/** E S C O L A — letras de traço grosso, 0.16 de altura. */
function letter(which: 'E' | 'S' | 'C' | 'O' | 'L' | 'A') {
  const g = new THREE.Group()
  const t = 0.032
  const h = 0.16
  const w = 0.105
  const top = h / 2 - t / 2
  const bot = -h / 2 + t / 2
  const left = -w / 2 + t / 2
  if (which === 'E') {
    g.add(stroke(t, h, left, 0, INK))
    g.add(stroke(w, t, 0, top, INK))
    g.add(stroke(w - 0.015, t, -0.007, 0, INK))
    g.add(stroke(w, t, 0, bot, INK))
  } else if (which === 'L') {
    g.add(stroke(t, h, left, 0, INK))
    g.add(stroke(w, t, 0, bot, INK))
  } else if (which === 'A') {
    g.add(stroke(t, h * 1.04, -0.028, 0, INK, -0.3))
    g.add(stroke(t, h * 1.04, 0.028, 0, INK, 0.3))
    g.add(stroke(0.064, 0.026, 0, -0.026, INK))
  } else if (which === 'O') {
    const o = arc((h - t) / 2, t / 2, 0, Math.PI * 2, INK)
    o.scale.x = 0.78
    g.add(o)
  } else if (which === 'C') {
    const c = arc((h - t) / 2, t / 2, 50 * DEG, 260 * DEG, INK)
    c.scale.x = 0.78
    g.add(c)
  } else {
    // S: duas barrigas empilhadas
    const r = (h - t) / 4
    const up = arc(r, t / 2, 20 * DEG, 250 * DEG, INK)
    up.position.y = r
    const dn = arc(r, t / 2, -160 * DEG, 250 * DEG, INK)
    dn.position.y = -r
    g.add(up, dn)
    g.scale.x = 1.15
  }
  g.scale.z = 0.7
  return g
}

/** Pinta um mesh por faixas de altura (cores por vértice, no espaço do grupo pai). */
function paintByY(mesh: THREE.Mesh, offsetY: number, pick: (y: number, z: number) => string) {
  const geo = mesh.geometry.clone()
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    c.set(pick(pos.getY(i) + offsetY, pos.getZ(i)))
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  mesh.geometry = geo
  const m = mat('#ffffff', { roughness: 0.75, size: 0.8 })
  m.vertexColors = true
  mesh.material = m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- base: grama + calçada de lajotas ------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.55, 2.65, 0.11, SOIL, { roughness: 0.95 })
  soil.position.y = 0.055
  base.add(soil)

  const grass = cylinder(2.5, 2.55, 0.05, GRASS, { roughness: 0.92 })
  grass.position.y = GY - 0.025
  base.add(grass)

  // calçada: faixa larga de lajotas entre a escola e a frente, recortada no disco
  const Z0 = -0.85
  const Z1 = 1.3
  const RMAX = 2.42
  const TILE = 0.47
  for (let ix = -5; ix <= 5; ix++) {
    for (let iz = 0; iz < 5; iz++) {
      const x = ix * TILE
      const z = Z0 + TILE / 2 + iz * TILE
      if (z + TILE / 2 > Z1 + 0.01) continue
      const far = Math.hypot(Math.abs(x) + TILE / 2, Math.max(Math.abs(z - TILE / 2), Math.abs(z + TILE / 2)))
      if (far > RMAX) continue
      const lajota = rbox(TILE - 0.03, 0.035, TILE - 0.03, 0.012, rand() < 0.5 ? PAVE : PAVE_2, { roughness: 0.85 })
      lajota.position.set(x, GY + 0.0175, z)
      base.add(lajota)
    }
  }
  // meio-fio claro nas bordas da calçada
  for (const z of [Z0 - 0.02, Z1 + 0.02]) {
    const half = Math.sqrt(RMAX * RMAX - z * z) - 0.1
    const curb = rbox(half * 2, 0.06, 0.07, 0.02, CURB, { roughness: 0.8 })
    curb.position.set(0, GY + 0.03, z)
    base.add(curb)
  }
  // caminho da porta até a calçada
  for (const z of [-1.0]) {
    const passo = rbox(0.62, 0.035, 0.22, 0.012, PAVE_2, { roughness: 0.85 })
    passo.position.set(DOOR_X, GY + 0.0175, z)
    base.add(passo)
  }

  // tufos de grama e folhas secas
  for (let i = 0; i < 10; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.9 + rand() * 0.45
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (z > Z0 - 0.1 && z < Z1 + 0.1) continue
    if (z > 1.4 && Math.abs(x) < 1.3) continue // nada solto no primeiro plano
    const tufo = puff(0.1 + rand() * 0.05, GRASS_DARK, 5, 80 + i, { roughness: 0.92 })
    tufo.scale.y = 0.5
    tufo.position.set(x, GY + 0.02, z)
    base.add(tufo)
  }
  for (let i = 0; i < 7; i++) {
    const folha = sphere(0.05, i % 2 ? '#d98a2b' : '#c9a23a', { roughness: 0.8 })
    folha.scale.set(1.3, 0.12, 0.8)
    folha.position.set(-2 + rand() * 4, SY + 0.005, Z0 + 0.2 + rand() * 1.8)
    folha.rotation.y = rand() * Math.PI
    if (Math.hypot(folha.position.x - ZX, folha.position.z - ZZ) < 0.55) continue
    base.add(folha)
  }
  const pedra = rock(0.12, '#9a958c', 7, { roughness: 0.9 })
  pedra.position.set(2.05, GY + 0.04, -0.95)
  base.add(pedra)

  root.add(base)

  // ---- escola: fachada amarela, telhado vermelho ---------------------------
  const escola = new THREE.Group()

  const plinth = rbox(WALL_W + 0.06, 0.16, WALL_D + 0.06, 0.03, PLINTH, { roughness: 0.85 })
  plinth.position.set(0, GY + 0.08, WALL_Z)
  escola.add(plinth)

  const wall = rbox(WALL_W, WALL_H, WALL_D, 0.03, WALL, { roughness: 0.85 })
  wall.position.set(0, GY + WALL_H / 2, WALL_Z)
  escola.add(wall)

  // cornija branca sob o beiral
  const cornice = rbox(WALL_W + 0.08, 0.07, WALL_D + 0.08, 0.025, TRIM, { roughness: 0.7 })
  cornice.position.set(0, GY + WALL_H - 0.02, WALL_Z)
  escola.add(cornice)

  // empena (triângulo) sob o telhado
  const HALF = WALL_D / 2 + 0.14
  const PITCH = 0.62
  const RISE = HALF * Math.tan(PITCH)
  const tri = new THREE.Shape([
    new THREE.Vector2(-WALL_D / 2, 0),
    new THREE.Vector2(WALL_D / 2, 0),
    new THREE.Vector2(0, (WALL_D / 2) * Math.tan(PITCH)),
  ])
  const gable = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tri, { depth: WALL_W - 0.02, bevelEnabled: false }),
    mat(WALL_DARK, { roughness: 0.85, size: 1 }),
  )
  gable.rotation.y = Math.PI / 2
  gable.position.set(-(WALL_W - 0.02) / 2, GY + WALL_H, WALL_Z)
  gable.castShadow = true
  gable.receiveShadow = true
  escola.add(gable)

  const ROOF_L = HALF / Math.cos(PITCH) + 0.02
  for (const side of [1, -1]) {
    const slab = rbox(WALL_W + 0.3, 0.09, ROOF_L, 0.03, side > 0 ? ROOF : ROOF_DARK, { roughness: 0.7 })
    slab.position.set(0, GY + WALL_H + RISE / 2 + 0.05, WALL_Z + (side * HALF) / 2)
    slab.rotation.x = side * PITCH
    escola.add(slab)
    // fiadas de telha: frisos ao longo do caimento
    for (let k = 1; k <= 3; k++) {
      const f = k / 4
      const fiada = rbox(WALL_W + 0.3, 0.03, 0.04, 0.012, ROOF_DARK, { roughness: 0.7 })
      fiada.position.set(
        0,
        GY + WALL_H + 0.1 + RISE * (1 - f),
        WALL_Z + side * HALF * f,
      )
      fiada.rotation.x = side * PITCH
      if (side > 0) escola.add(fiada)
    }
  }
  const ridge = cylinder(0.055, 0.055, WALL_W + 0.32, ROOF_DARK, { roughness: 0.7 })
  ridge.rotation.z = Math.PI / 2
  ridge.position.set(0, GY + WALL_H + RISE + 0.07, WALL_Z)
  escola.add(ridge)

  // janelas com moldura branca, cruzeta e peitoril
  const WIN_Y = GY + 0.78
  for (const wx of [-0.05, 0.7, 1.35]) {
    const frame = rbox(0.5, 0.56, 0.06, 0.02, TRIM, { roughness: 0.6 })
    frame.position.set(wx, WIN_Y, FRONT + 0.01)
    escola.add(frame)
    const glass = rbox(0.42, 0.48, 0.04, 0.01, GLASS, { roughness: 0.15 })
    glass.position.set(wx, WIN_Y, FRONT + 0.03)
    escola.add(glass)
    const mv = rbox(0.03, 0.48, 0.03, 0.01, TRIM, { roughness: 0.6 })
    mv.position.set(wx, WIN_Y, FRONT + 0.05)
    escola.add(mv)
    const mh = rbox(0.42, 0.03, 0.03, 0.01, TRIM, { roughness: 0.6 })
    mh.position.set(wx, WIN_Y + 0.04, FRONT + 0.05)
    escola.add(mh)
    const sill = rbox(0.58, 0.045, 0.1, 0.015, TRIM, { roughness: 0.6 })
    sill.position.set(wx, WIN_Y - 0.3, FRONT + 0.04)
    escola.add(sill)
  }
  // desenhos de criança colados no vidro: um sol e uma casinha
  const sol = cylinder(0.06, 0.06, 0.01, '#f2b632', { roughness: 0.6 })
  sol.rotation.x = Math.PI / 2
  sol.position.set(0.6, WIN_Y + 0.13, FRONT + 0.055)
  escola.add(sol)
  const casinha = rbox(0.09, 0.07, 0.01, 0.005, '#d9573f', { roughness: 0.6 })
  casinha.position.set(1.44, WIN_Y - 0.1, FRONT + 0.055)
  escola.add(casinha)

  // vão da porta: escuro, com batente branco
  const vao = rbox(DOOR_W, DOOR_H, 0.04, 0.01, INTERIOR, { roughness: 0.9 })
  vao.position.set(DOOR_X, GY + DOOR_H / 2, FRONT + 0.005)
  escola.add(vao)
  for (const side of [-1, 1]) {
    const jamb = rbox(0.06, DOOR_H + 0.06, 0.08, 0.015, TRIM, { roughness: 0.6 })
    jamb.position.set(DOOR_X + side * (DOOR_W / 2 + 0.03), GY + (DOOR_H + 0.06) / 2, FRONT + 0.02)
    escola.add(jamb)
  }
  const lintel = rbox(DOOR_W + 0.18, 0.07, 0.09, 0.02, TRIM, { roughness: 0.6 })
  lintel.position.set(DOOR_X, GY + DOOR_H + 0.035, FRONT + 0.02)
  escola.add(lintel)
  const degrau = rbox(DOOR_W + 0.24, 0.05, 0.24, 0.015, PLINTH, { roughness: 0.85 })
  degrau.position.set(DOOR_X, GY + 0.025, FRONT + 0.12)
  escola.add(degrau)

  // arbustos ao pé da fachada
  for (const [bx, s, seed] of [[-1.55, 0.2, 11], [0.35, 0.17, 12], [1.6, 0.22, 13]] as const) {
    const arbusto = puff(s, '#5f9145', 6, seed, { roughness: 0.9 })
    arbusto.position.set(bx, GY + s * 0.7, FRONT + 0.18)
    escola.add(arbusto)
  }

  root.add(escola)

  // ---- portas azuis (dobradiças nos batentes, abrem para fora) -------------
  function folha(sign: 1 | -1) {
    const g = new THREE.Group()
    g.position.set(DOOR_X - sign * (DOOR_W / 2), GY, FRONT + 0.03)
    const lw = DOOR_W / 2 - 0.01
    const leaf = rbox(lw, DOOR_H - 0.02, 0.05, 0.015, DOOR, { roughness: 0.5 })
    leaf.position.set(sign * (lw / 2), DOOR_H / 2, 0)
    g.add(leaf)
    const vidro = rbox(lw - 0.12, 0.34, 0.06, 0.012, GLASS, { roughness: 0.15 })
    vidro.position.set(sign * (lw / 2), DOOR_H * 0.7, 0)
    g.add(vidro)
    const almofada = rbox(lw - 0.12, 0.3, 0.06, 0.02, DOOR_DARK, { roughness: 0.5 })
    almofada.position.set(sign * (lw / 2), DOOR_H * 0.25, 0)
    g.add(almofada)
    const barra = cylinder(0.014, 0.014, 0.2, '#c9ced4', { roughness: 0.25, metalness: 0.8 })
    barra.position.set(sign * (lw - 0.06), DOOR_H * 0.48, 0.05)
    g.add(barra)
    return g
  }
  const PORTA_ABERTA = 1.25
  const portaE = folha(1)
  portaE.rotation.y = -PORTA_ABERTA
  root.add(portaE)
  const portaD = folha(-1)
  portaD.rotation.y = PORTA_ABERTA
  root.add(portaD)

  // ---- placa ESCOLA sobre a porta ------------------------------------------
  const placa = new THREE.Group()
  placa.position.set(DOOR_X, SIGN_Y, FRONT + 0.04)
  const quadro = rbox(1.0, 0.27, 0.05, 0.03, TRIM, { roughness: 0.55 })
  placa.add(quadro)
  const moldura = rbox(1.05, 0.32, 0.03, 0.04, DOOR_DARK, { roughness: 0.5 })
  moldura.position.z = -0.02
  placa.add(moldura)
  const glyphs = ['E', 'S', 'C', 'O', 'L', 'A'] as const
  glyphs.forEach((gl, i) => {
    const l = letter(gl)
    l.position.set(-0.36 + i * 0.144, 0, 0.03)
    placa.add(l)
  })
  root.add(placa)

  // ---- ZUMBI-CRIANÇA -------------------------------------------------------
  const zumbi = person({ body: SHIRT, skin: ZSKIN, height: 1.5, armAngle: 0.35 })
  zumbi.rotation.order = 'YXZ'
  zumbi.position.set(ZX, SY, ZZ)
  zumbi.rotation.set(ZLEAN, ZYAW, 0)
  zumbi.scale.setScalar(ZS)
  root.add(zumbi)

  // corpo pintado por faixas: tênis, canela verde, bermuda azul, camiseta
  const corpo = zumbi.getObjectByName('body') as THREE.Mesh
  paintByY(corpo, corpo.position.y, (y) => {
    if (y < 0.125) return SHOE
    if (y < 0.2) return ZSKIN
    if (y < 0.345) return SHORTS
    return SHIRT
  })

  // barras nítidas: bermuda sobre a canela, meia sobre o tênis
  const barraBermuda = torus(0.247, 0.022, SHORTS, { roughness: 0.75 })
  barraBermuda.rotation.x = Math.PI / 2
  barraBermuda.scale.z = 1.4
  barraBermuda.position.y = 0.2
  zumbi.add(barraBermuda)

  // barra da camiseta rasgada: tirinhas em zigue-zague caindo sobre a bermuda
  for (let i = 0; i < 13; i++) {
    const a = -2.2 + i * (4.4 / 12)
    const len = 0.05 + rand() * 0.06
    const tira = cone(0.04, len, SHIRT, { roughness: 0.75 }, 4)
    tira.scale.z = 0.3
    tira.rotation.order = 'YXZ'
    tira.rotation.set(Math.PI, a, 0)
    tira.position.set(Math.sin(a) * 0.262, 0.355 - len / 2, Math.cos(a) * 0.262)
    zumbi.add(tira)
  }

  // ---- cabeça: olheiras roxas, cabelo espetado ------------------------------
  const cabeca = zumbi.getObjectByName('head') as THREE.Group
  cabeca.rotation.set(-0.14, -0.3, 0.2) // pendida de lado, olhando pra você (câmera)

  // olhos: esclera amarelada, pupila miudinha e desencontrada
  let pupilN = 0
  for (const c of [...cabeca.children]) {
    const m = c as THREE.Mesh
    if (!m.isMesh) continue
    const color = (m.material as THREE.MeshStandardMaterial).color.getHexString()
    if (color === 'ffffff') (m.material as THREE.MeshStandardMaterial).color.set('#eeeac4')
    if (color === '1a1a1a') {
      m.scale.setScalar(0.62)
      m.position.y += pupilN++ === 0 ? 0.018 : -0.012
    }
  }
  for (const side of [-1, 1]) {
    const olheira = sphere(0.07, BRUISE, { roughness: 0.7 })
    olheira.scale.set(1.15, 0.6, 0.35)
    olheira.position.set(side * 0.108, -0.03, 0.245)
    cabeca.add(olheira)
  }

  const cabelo = new THREE.Group()
  cabeca.add(cabelo)
  // calota colada no crânio, deslocada pra cima e pra trás: só o cocuruto e a nuca
  const capa = sphere(0.293, HAIR, { roughness: 0.85 })
  capa.position.set(0, 0.06, -0.055)
  cabelo.add(capa)
  // mechas espetadas em todas as direções: coroa, laterais e franja
  const hr = rng(91)
  const UP = new THREE.Vector3(0, 1, 0)
  const spikeAt = (dir: THREE.Vector3, len: number, r: number) => {
    const spike = cone(r, len, HAIR, { roughness: 0.85 })
    spike.position.set(dir.x * 0.27, 0.06 + dir.y * 0.27, -0.055 + dir.z * 0.27)
    spike.quaternion.setFromUnitVectors(UP, dir)
    cabelo.add(spike)
  }
  // coroa e nuca: mechas grandes, desgrenhadas
  for (let ring = 0; ring < 2; ring++) {
    const n = ring === 0 ? 5 : 9
    for (let i = 0; i < n; i++) {
      const az = (i / n) * Math.PI * 2 + ring * 0.35 + (hr() - 0.5) * 0.4
      const el = (ring === 0 ? 1.05 : 0.5) + (hr() - 0.5) * 0.25
      if (ring === 1 && Math.cos(az) > 0.6) continue // a franja é à parte
      const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el) - 0.25).normalize()
      spikeAt(dir, 0.22 + hr() * 0.1, 0.085 + hr() * 0.02)
    }
  }
  spikeAt(new THREE.Vector3(0.1, 1, -0.15).normalize(), 0.3, 0.09)
  // franja: três pontas caindo da linha do cabelo sobre a testa
  for (const fx of [-0.11, 0.0, 0.11]) {
    const len = fx === 0 ? 0.15 : 0.12
    const dir = new THREE.Vector3(fx * 1.6, -0.6, 0.8).normalize()
    const spike = cone(0.058, len, HAIR, { roughness: 0.85 })
    const hz = Math.sqrt(Math.max(0, 0.081 - 0.04 - fx * fx)) - 0.005
    spike.position.set(fx, 0.205, hz).addScaledVector(dir, len * 0.3)
    spike.quaternion.setFromUnitVectors(UP, dir)
    cabelo.add(spike)
  }

  // ---- boca aberta no gemido (peça: abre no IS-KUUU-LAN) -------------------
  const boca = new THREE.Group()
  boca.position.set(0.0, -0.135, 0.245)
  boca.rotation.z = -0.12
  cabeca.add(boca)
  const cavidade = sphere(0.064, '#2a1316', { roughness: 0.7 })
  cavidade.scale.set(0.95, 1.3, 0.55)
  boca.add(cavidade)
  const labios = torus(0.064, 0.017, ZSKIN_DARK, { roughness: 0.6 })
  labios.scale.y = 1.3
  labios.position.z = 0.012
  boca.add(labios)
  const dente = rbox(0.032, 0.03, 0.02, 0.006, '#f1ecd8', { roughness: 0.4 })
  dente.position.set(-0.022, 0.06, 0.018)
  boca.add(dente)
  const lingua = sphere(0.035, '#8f4b5a', { roughness: 0.5 })
  lingua.scale.set(1.2, 0.55, 0.6)
  lingua.position.set(0, -0.05, 0.015)
  boca.add(lingua)

  // ---- braços: pele verde com manga curta laranja ---------------------------
  const bracoR = zumbi.getObjectByName('armR') as THREE.Mesh
  const bracoL = zumbi.getObjectByName('armL') as THREE.Mesh
  const maoR = bracoR.children[0] as THREE.Mesh
  const maoL = bracoL.children[0] as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  shoulderPivot(bracoL, 1.5)
  for (const b of [bracoR, bracoL]) {
    paintByY(b, 0, (y) => (y > -0.12 ? SHIRT : ZSKIN))
    // manga curta: barra nítida, com tirinhas rasgadas
    const manga = cylinder(0.122, 0.13, 0.12, SHIRT, { roughness: 0.75 })
    manga.position.y = -0.1
    b.add(manga)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3
      const len = 0.035 + rand() * 0.03
      const tira = cone(0.032, len, SHIRT, { roughness: 0.75 }, 4)
      tira.scale.z = 0.3
      tira.rotation.order = 'YXZ'
      tira.rotation.set(Math.PI, a, 0)
      tira.position.set(Math.sin(a) * 0.125, -0.16 - len / 2, Math.cos(a) * 0.125)
      b.add(tira)
    }
  }
  bracoR.rotation.set(ARM_R[0], 0, ARM_R[1])
  bracoL.rotation.set(ARM_L[0], 0, ARM_L[1])
  maoR.rotation.x = 0.7 // pulso caído de zumbi

  // ---- mochila escorregando do ombro esquerdo -------------------------------
  // pivô no alto do ombro; ordem ZYX: gira de frente (y) e balança feito pêndulo (z)
  const mochila = new THREE.Group()
  mochila.position.set(-0.27, 0.74, -0.06)
  mochila.rotation.order = 'ZYX'
  mochila.rotation.set(0, MOCHILA_YAW, MOCHILA_SWING)
  zumbi.add(mochila)
  const saco = rbox(0.34, 0.4, 0.17, 0.07, BAG, { roughness: 0.8 })
  saco.position.set(0, -0.33, -0.02)
  mochila.add(saco)
  const bolso = rbox(0.26, 0.16, 0.06, 0.035, BAG_DARK, { roughness: 0.8 })
  bolso.position.set(0, -0.4, -0.115)
  mochila.add(bolso)
  const ziper = rbox(0.24, 0.014, 0.02, 0.006, '#d9d2c4', { roughness: 0.5 })
  ziper.position.set(0, -0.32, -0.148)
  mochila.add(ziper)
  const alca = torus(0.16, 0.024, BAG_DARK, { roughness: 0.8 })
  alca.scale.set(1, 1, 0.55)
  alca.rotation.y = Math.PI / 2
  alca.position.set(0.08, -0.06, 0.1)
  mochila.add(alca)
  const solta = torus(0.13, 0.02, BAG_DARK, { roughness: 0.8 })
  solta.rotation.y = Math.PI / 2
  solta.scale.set(0.5, 1, 1)
  solta.position.set(-0.08, -0.5, 0.1)
  mochila.add(solta)

  // ---- rastro: marcas dos pés arrastados, da porta até o zumbi -------------
  const R0 = new THREE.Vector2(DOOR_X + 0.05, FRONT + 0.32)
  const R1 = new THREE.Vector2(ZX - 0.2, ZZ - 0.22)
  const RLEN = R0.distanceTo(R1)
  const rastro = new THREE.Group()
  rastro.position.set(R0.x, SY, R0.y)
  rastro.rotation.y = Math.atan2(R1.x - R0.x, R1.y - R0.y) - Math.PI / 2
  root.add(rastro)
  const rr = rng(33)
  for (const side of [-1, 1]) {
    let x = 0.05 + rr() * 0.08
    while (x < RLEN - 0.05) {
      const len = Math.min(0.18 + rr() * 0.14, RLEN - x)
      const risco = rbox(len, 0.008, 0.055, 0.004, '#7c776f', { roughness: 0.95 })
      risco.position.set(x + len / 2, 0.003, side * 0.12 + (rr() - 0.5) * 0.03)
      rastro.add(risco)
      x += len + 0.06 + rr() * 0.08
    }
  }

  // ---- vara: posição pela mão já posada -----------------------------------
  root.updateMatrixWorld(true)
  const HW = maoL.getWorldPosition(new THREE.Vector3())

  const vara = new THREE.Group()
  vara.position.copy(HW)
  vara.rotation.z = VARA_TILT
  root.add(vara)
  const haste = cylinder(0.034, 0.038, 1.95, WOOD, { roughness: 0.75 })
  haste.position.y = 0.5
  vara.add(haste)
  const ponta = cone(0.034, 0.12, WOOD_DARK, { roughness: 0.7 })
  ponta.position.y = 1.46
  vara.add(ponta)
  for (const ny of [-0.3, 0.62]) {
    const no = sphere(0.03, WOOD_DARK, { roughness: 0.8 })
    no.scale.set(1, 1.4, 1)
    no.position.set(0.03, ny, 0)
    vara.add(no)
  }

  // ---- prova espetada na ponta, com o DÊ enorme ----------------------------
  const prova = new THREE.Group()
  prova.position.set(0, 0.98, 0.055)
  prova.rotation.set(0, 0.16, -0.08)
  vara.add(prova)
  const folhaProva = rbox(0.62, 0.8, 0.016, 0.012, PAPER, { roughness: 0.75 })
  prova.add(folhaProva)
  // cabeçalho e questões
  for (const [lx, ly, lw] of [[-0.14, 0.32, 0.22], [0.15, 0.32, 0.16], [-0.06, -0.27, 0.38], [-0.1, -0.32, 0.3]] as const) {
    const linha = rbox(lw, 0.022, 0.01, 0.005, LINE, { roughness: 0.7 })
    linha.position.set(lx, ly, 0.011)
    prova.add(linha)
  }
  // xis vermelhos nas questões erradas
  for (const xy of [-0.27, -0.32]) {
    for (const r of [0.75, -0.75]) {
      const x = rbox(0.045, 0.012, 0.01, 0.004, RED, { roughness: 0.5 })
      x.position.set(0.22, xy, 0.012)
      x.rotation.z = r
      prova.add(x)
    }
  }
  // o DÊ: haste + barriga
  const D = new THREE.Group()
  D.position.set(-0.01, 0.02, 0.012)
  D.scale.z = 0.35
  const DR = 0.165
  const DT = 0.036
  const hasteD = rbox(DT * 2, DR * 2 + DT * 2, 0.04, 0.012, RED, { roughness: 0.45 })
  hasteD.position.x = -0.12
  D.add(hasteD)
  for (const s of [-1, 1]) {
    const barra = rbox(0.1, DT * 2, 0.04, 0.012, RED, { roughness: 0.45 })
    barra.position.set(-0.075, s * DR, 0)
    D.add(barra)
  }
  const barriga = arc(DR, DT, -Math.PI / 2, Math.PI, RED, { roughness: 0.45 })
  barriga.position.x = -0.03
  barriga.scale.x = 1.0
  D.add(barriga)
  prova.add(D)
  // tachinhas prendendo a folha na vara
  for (const ty of [0.36, -0.37]) {
    const tacha = sphere(0.022, '#c9ced4', { roughness: 0.3, metalness: 0.7 })
    tacha.scale.z = 0.5
    tacha.position.set(0, ty, 0.012)
    prova.add(tacha)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'escola', object: base },
    { name: 'escola', group: 'escola', object: escola },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'portaE', group: 'escola', object: portaE },
    { name: 'portaD', group: 'escola', object: portaD },
    { name: 'zumbi', group: 'zumbi', object: zumbi },
    { name: 'braco', group: 'zumbi', object: bracoR },
    { name: 'cabeca', group: 'zumbi', object: cabeca },
    { name: 'mochila', group: 'zumbi', object: mochila },
    { name: 'rastro', group: 'zumbi', object: rastro },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'prova', group: 'prova', object: prova },
    { name: 'boca', group: 'gemido', object: boca },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Três da tarde: brota uma calçada na frente de uma escola de parede amarela…',
    }),
    seq('escola-rise', 'escola', 0.25, 0.9, [riseFrom(0, 2.3)], { ease: 'easeOut' }),
    seq('portaE-rise', 'portaE', 0.25, 0.9, [riseFrom(GY, 2.3)], { ease: 'easeOut' }),
    seq('portaD-rise', 'portaD', 0.25, 0.9, [riseFrom(GY, 2.3)], { ease: 'easeOut' }),

    seq('placa-prega', 'placa', 1.5, 0.7, [...s3(0.01, 1), ch('rotation.z', 0.5, 0)], {
      ease: 'easeOut',
      caption: 'Na placa sobre a porta: ESCOLA — do jeito que a gente fala, IS-CÓ-LA.',
    }),

    seq('portaE-abre', 'portaE', 2.9, 0.8, [ch('rotation.y', 0, -PORTA_ABERTA)], {
      ease: 'easeOut',
      caption: 'O portão se abre…',
    }),
    seq('portaD-abre', 'portaD', 2.95, 0.8, [ch('rotation.y', 0, PORTA_ABERTA)], { ease: 'easeOut' }),

    seq('zumbi-sai', 'zumbi', 3.6, 1.6, [
      ch('position.x', DOOR_X, ZX), ch('position.z', FRONT + 0.12, ZZ),
      ch('rotation.y', 0.6, ZYAW), ...s3(0.4, ZS),
    ], {
      ease: 'easeOut',
      caption: '…e lá vem ele se arrastando: o zumbi, de braço esticado, rosnando RRÜÜR…',
    }),
    seq('rastro-cresce', 'rastro', 3.7, 1.5, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),
    seq('zumbi-ginga-a', 'zumbi', 3.6, 0.8, [ch('rotation.z', 0, 0.09)]),
    seq('zumbi-ginga-b', 'zumbi', 4.4, 0.8, [ch('rotation.z', 0.09, 0)]),
    seq('braco-estica', 'braco', 3.6, 1.2, [ch('rotation.x', -0.2, ARM_R[0])], { ease: 'easeOut' }),
    seq('cabeca-pende', 'cabeca', 3.6, 1.6, [ch('rotation.z', -0.15, 0.2)], { ease: 'easeInOut' }),
    seq('mochila-vem', 'mochila', 3.6, 0.1, [ch('scale.x', 1, 1)]),
    seq('boca-rosna', 'boca', 3.6, 0.9, [ch('scale.y', 0.2, 0.55), ch('scale.x', 0.7, 0.8)], { ease: 'easeOut' }),
    seq('mochila-escorrega', 'mochila', 4.9, 0.8, [ch('rotation.z', 0.15, MOCHILA_SWING), ch('position.y', 0.8, 0.74)], {
      ease: 'easeOut',
    }),

    seq('vara-ergue', 'vara', 6.2, 0.9, [riseFrom(HW.y, 2.2)], {
      ease: 'easeOut',
      caption: 'Na outra mão ele ergue uma VARA comprida — VÁR — feito bandeira de rendição…',
    }),

    seq('prova-abre', 'prova', 7.7, 0.7, [...s3(0.01, 1), ch('rotation.z', 1.4, -0.08)], {
      ease: 'easeOut',
      caption: '…com a prova espetada na ponta: um DÊ vermelho enorme. DÊ?',
    }),
    seq('vara-acena-a', 'vara', 8.5, 0.45, [ch('rotation.z', VARA_TILT, VARA_TILT - 0.12)]),
    seq('vara-acena-b', 'vara', 8.95, 0.45, [ch('rotation.z', VARA_TILT - 0.12, VARA_TILT + 0.06)]),
    seq('vara-acena-c', 'vara', 9.4, 0.45, [ch('rotation.z', VARA_TILT + 0.06, VARA_TILT)]),

    seq('boca-geme', 'boca', 10.2, 0.9, [ch('scale.y', 0.55, 1), ch('scale.x', 0.8, 1)], {
      ease: 'easeOut',
      caption: 'E geme o nome do lugar de onde saiu, com um U que não acaba: IS-KUUUU-LAN…',
    }),
    seq('cabeca-geme', 'cabeca', 10.2, 0.9, [ch('rotation.x', 0.05, -0.14)], { ease: 'easeOut' }),

    seq('braco-sobe', 'braco', 11.7, 0.4, [ch('rotation.x', ARM_R[0], ARM_R[0] - 0.12)], {
      caption: 'Hur var det i skolan? — Como foi na escola?',
    }),
    seq('braco-desce', 'braco', 12.1, 0.5, [ch('rotation.x', ARM_R[0] - 0.12, ARM_R[0])]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 1.95, 6.3], target: [0.05, 1.6, 0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'hur-var-det-i-skolan',
    contexto:
      "Família: buscando o filho na skola ou no fritids, no carro de volta pra casa, no jantar — é a pergunta de todo fim de tarde, e a resposta clássica da criança é um 'Bra.' seco. Pra creche se usa 'på': 'Hur var det på förskolan?'.",
    fraseFonte: 'Como foi na escola?',
    fraseAlvo: 'Hur var det i skolan?',
    pronuncia:
      "rrür VÁR dê i SKÚU-lan? ('hur' com h soprado tipo rr carioca e U de BICO, quase Ü; 'var' = VÁR, A longo e R brando, que na fala rápida muita gente engole: 'hu va de'; 'det' = dê; 'i' = i curto; 'skolan' com o 'o' longo sueco, que soa U FECHADO: SKÚU-lan, nunca o 'skó' aberto de 'escola'; o -an do fim é o artigo colado, 'a escola'; força principal no SKÚU)",
    ponteSonora:
      "RRÜR! VÁR... DÊ? IS-KÚÚ-LAN? (6 batidas: rrür-vár-dê-is-KÚÚ-lan; tônica forte no KÚÚ; RRÜR é o rosnado do zumbi E o 'hur' de sempre, o MESMO RRÜR de 'Hur kommer jag till Storgatan?' e 'Hur bokar man tvättstugan?': h soprado como RR carioca, vogal de BICO (lábios de U, língua de I, nunca o U chapado de 'urso') e R final BRANDO; VÁR = a VARA sem o -a, a mesma de 'Var bor du?' e 'Var kan jag köpa biljett?' (aqui 'var' quer dizer 'foi', mas a palavra é a mesma): A longo e R BRANDO e AUDÍVEL, porque sem ele sobra VÁ, que é 'vad' (o quê); DÊ = a nota D da prova, Ê FECHADO, o 'det' de sempre, e SOZINHO: colado no I vira DÊI, que nas cartas é 'dig'; IS-KÚÚ-LAN = a ESCOLA do jeito que o brasileiro fala, 'iscola', e esse I que a gente põe antes do S é justamente o 'i' (= na) sueco, de graça; o S é de 'sapo', sibilante, nunca o X chiado do carioca ('ishcola'); só que gemida por um zumbi: o Ó aberto vira um UUU fechado e comprido (é o 'o' longo sueco, o mesmo BÚ de 'bokar' e STÚR de 'stor'), e o -A do fim se arrasta num N, que é o artigo colado no FIM: skola = escola, skolan = A escola; N com a ponta da língua, sem virar o 'lã' nasal)",
    historia:
      'Três da tarde: o portão da ESCOLA se abre e lá vem ele se arrastando, o zumbi, de mochila num ombro só, um braço esticado pra frente, rosnando sem parar: RRÜÜR... Na outra mão ele ergue uma VARA comprida, feito bandeira branca de rendição, com a prova espetada na ponta e um DÊ vermelho enorme no meio da folha. Ele nem precisava abrir a boca, mas abre, e geme o nome do lugar de onde acabou de sair, com um U de zumbi que não termina nunca: IS-KUUUU-LAN... E você pergunta assim mesmo: como foi na escola?',
  },
  createScene,
}

export default card
