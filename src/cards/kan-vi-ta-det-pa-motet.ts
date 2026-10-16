import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Kan vi ta det på mötet?" — CA-VI... TÁ, DÊ, PÔ... MÖÖ-TE-T?
 *
 * Um colega empurra o PEPINO da semana pra cima de um touro nelore sueco, de
 * crachá. Ele raspa o casco no carpete, CAVANDO (CA-VI, CA-VI), mas respira
 * fundo, resmunga TÁ, DÊ, PÔ! e leva o pepino na boca até a sala de reunião,
 * onde o METEORO de 'Jag har ett möte' já espera na cabeceira da mesa em T:
 * MÖÖ-TE-T. Isso a gente resolve na reunião.
 *
 * Diorama: carpete cinza-azulado de escritório; batente de madeira com a porta
 * aberta para o corredor, atrás e à esquerda; o touro na porta, de lado para a
 * sala e de cara para a câmera, com o casco erguido sobre o sulco; a mesa
 * branca em T entra na sala com a perna apontando para ele, e o meteoro em
 * brasa — o mesmo de 'Jag har ett möte' — sentado na cabeceira, do outro lado.
 */

const CARPET = '#5f6d7f'
const CARPET_ALT = '#576577'
const RIM = '#39404a'
const LINO = '#c9c3b8' // piso do corredor
const GROOVE = '#2b323c'
const GROOVE_RIM = '#7a889b'
const DUST = '#e2d3b0'
const WOOD = '#b98a55'
const WOOD_DARK = '#8c6237'
const WALL = '#4f6a64'
const WALL_DARK = '#3f5752'
const WHITE = '#f3f2ee'
const TABLE_EDGE = '#c9ccd0'
const STEEL = '#9aa1a8'
const CHAIR = '#8b929b'
const CHAIR_DARK = '#5d636b'
const BULL = '#ece9e3'
const BULL_SHADE = '#d6d2cb'
const BULL_GREY = '#d3cfc8' // cangote e corcova levemente acinzentados do nelore
const MUZZLE = '#3d3c40'
const HOOF = '#2a292c'
const HORN = '#4a494e'
const EAR_IN = '#e2b0a6'
const CUKE = '#3f7d2d'
const CUKE_DARK = '#2c5e20'
const CUKE_STRIPE = '#86b65a'
const BADGE = '#2f6bc9'
const LANYARD = '#b8433b'
const STONE = '#3b3735'
const STONE_DARK = '#2a2726'
const EMBER = '#ff6410' // acento saturado, RESERVADO ao meteoro (rachaduras e cauda)
const EMBER_HOT = '#ffb31f'
const WATER = '#a9d8ef'

const GY = 0.18 // topo do carpete
const BULL_POS: [number, number] = [-1.15, 0.1]
const BULL_YAW = 1.35 // o touro (+z local) vem da porta, na diagonal, rumo à frente da mesa
const HEAD_YAW = 0.65 // yaw ABSOLUTO da cabeça: vira para a câmera
const HEAD_PITCH = 0.0 // pose final: cabeça baixa, pepino pousado na perna do T
const HEAD_PITCH_UP = -0.32 // cabeça erguida, marchando com o pepino
const CASCO_REST = -0.35 // pata dianteira erguida para a frente (pose final)
const CASCO_BACK = 0.3 // fim da raspada, pata puxada para trás
const DOOR_POS: [number, number] = [-1.5, -1.2]
const DOOR_YAW = 0.55
const TABLE_YAW = 0.78 // a perna do T aponta para o touro; a cabeceira fica ao fundo, à direita
const STEM_LEN = 1.75
const STEM_W = 0.64
const BAR_D = 0.56
const BAR_L = 2.1
const CUKE_R = 0.12
const CHAIRS_AT = [0.62, 1.07, 1.5] // ao longo da perna do T
const SEAT_Y = 0.42 // assento, no espaço da cadeira
const MET_R = 0.42
const MET_Y = SEAT_Y + MET_R * 0.86
const MET_TILT = -0.22

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula esticada entre dois pontos (pernas, pescoço, cauda). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  const m = capsule(r, Math.max(0.001, len), color, { roughness: 0.85, ...opts })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

/** Orienta o eixo `axis` local do objeto ao longo de `dir`. */
function aim(o: THREE.Object3D, dir: THREE.Vector3, axis = new THREE.Vector3(0, 1, 0)) {
  o.quaternion.setFromUnitVectors(axis, dir.clone().normalize())
}

/** Carpete de escritório em placas, com fibra salpicada, em textura de canvas. */
function carpetTexture() {
  const n = 10
  const px = 72
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = n * px
  const ctx = canvas.getContext('2d')!
  const r = rng(3)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? CARPET : CARPET_ALT
      ctx.fillRect(i * px, j * px, px, px)
    }
  }
  for (let k = 0; k < 9000; k++) {
    const l = 0.32 + r() * 0.2
    ctx.fillStyle = `rgba(${r() < 0.5 ? '210,220,235' : '40,48,60'},${0.1 + r() * 0.1})`
    ctx.fillRect(r() * n * px, r() * n * px, 2, 2 + l)
  }
  ctx.strokeStyle = 'rgba(40,46,56,0.45)'
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

/** Cadeira cinza de reunião; o assento olha para +z local. */
function makeChair() {
  const g = new THREE.Group()
  const seat = rbox(0.5, 0.07, 0.46, 0.03, CHAIR, { roughness: 0.6 })
  seat.position.y = SEAT_Y - 0.035
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
  const rand = rng(61)

  // ---- base: carpete de escritório + faixa de corredor ----------------------
  const base = new THREE.Group()
  const plinth = cylinder(2.5, 2.58, 0.12, RIM, { roughness: 0.7 })
  plinth.position.y = 0.06
  base.add(plinth)

  const carpetMat = new THREE.MeshStandardMaterial({ map: carpetTexture(), roughness: 0.95, metalness: 0 })
  const carpet = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.06, 64), [
    new THREE.MeshStandardMaterial({ color: '#4a5260', roughness: 0.9 }),
    carpetMat,
    carpetMat,
  ])
  carpet.receiveShadow = true
  carpet.position.y = GY - 0.03
  base.add(carpet)

  // corredor: o pedaço do disco atrás da parede da porta, em piso vinílico
  {
    const dirX = new THREE.Vector2(Math.cos(DOOR_YAW), -Math.sin(DOOR_YAW)) // ao longo da parede
    const nrm = new THREE.Vector2(-Math.sin(DOOR_YAW), -Math.cos(DOOR_YAW)) // para o corredor
    const c = new THREE.Vector2(DOOR_POS[0], DOOR_POS[1])
    const R = 2.42
    // interseções da linha da parede com a borda do disco
    const b = 2 * c.dot(dirX)
    const cc = c.lengthSq() - R * R
    const disc = Math.sqrt(b * b - 4 * cc)
    const t1 = (-b - disc) / 2
    const t2 = (-b + disc) / 2
    const p1 = c.clone().addScaledVector(dirX, t1)
    const p2 = c.clone().addScaledVector(dirX, t2)
    const a1 = Math.atan2(p1.y, p1.x)
    let a2 = Math.atan2(p2.y, p2.x)
    // arco pelo lado do corredor
    const mid = c.clone().addScaledVector(nrm, 1)
    const am = Math.atan2(mid.y, mid.x)
    const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const inArc = (from: number, to: number, x: number) => norm(x - from) <= norm(to - from)
    const ccw = inArc(a1, a2, am)
    if (!ccw) a2 = a1 - norm(a1 - a2)
    else a2 = a1 + norm(a2 - a1)
    const shape = new THREE.Shape()
    shape.moveTo(p1.x, -p1.y)
    const steps = 24
    for (let i = 1; i <= steps; i++) {
      const a = a1 + ((a2 - a1) * i) / steps
      shape.lineTo(Math.cos(a) * R, -Math.sin(a) * R)
    }
    shape.lineTo(p1.x, -p1.y)
    const geo = new THREE.ShapeGeometry(shape)
    const lino = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: LINO, roughness: 0.45 }))
    lino.rotation.x = -Math.PI / 2
    lino.position.y = GY + 0.004
    lino.receiveShadow = true
    base.add(lino)
  }

  root.add(base)

  // ---- batente de madeira + porta aberta + tocos de parede ------------------
  const porta = new THREE.Group()
  porta.position.set(DOOR_POS[0], GY, DOOR_POS[1])
  porta.rotation.y = DOOR_YAW
  const OPEN_W = 1.25
  const OPEN_H = 2.0
  const POST = 0.1
  for (const s of [-1, 1]) {
    const post = rbox(POST, OPEN_H + POST, 0.2, 0.02, WOOD, { roughness: 0.55 })
    post.position.set(s * (OPEN_W / 2 + POST / 2), (OPEN_H + POST) / 2, 0)
    porta.add(post)
    // toco de parede verde-acinzentado de cada lado
    const wall = rbox(0.5, OPEN_H + 0.28, 0.14, 0.02, WALL, { roughness: 0.8 })
    wall.position.set(s * (OPEN_W / 2 + POST + 0.25), (OPEN_H + 0.28) / 2, 0)
    porta.add(wall)
    const skirting = rbox(0.5, 0.08, 0.16, 0.01, WALL_DARK, { roughness: 0.6 })
    skirting.position.set(s * (OPEN_W / 2 + POST + 0.25), 0.04, 0)
    porta.add(skirting)
  }
  // interruptor de luz no toco da direita
  const interruptor = rbox(0.09, 0.13, 0.02, 0.012, '#ecebe6', { roughness: 0.5 })
  interruptor.position.set(OPEN_W / 2 + POST + 0.2, 1.1, 0.08)
  porta.add(interruptor)
  const tecla = rbox(0.04, 0.06, 0.012, 0.006, '#d5d3cc', { roughness: 0.5 })
  tecla.position.set(OPEN_W / 2 + POST + 0.2, 1.1, 0.095)
  porta.add(tecla)
  // relógio de parede marcando duas horas: a reunião de sempre
  const relogio = new THREE.Group()
  relogio.position.set(OPEN_W / 2 + POST + 0.25, 1.72, 0.08)
  const aro = cylinder(0.15, 0.15, 0.04, '#3a3d44', { roughness: 0.4 }, 32)
  aro.rotation.x = Math.PI / 2
  relogio.add(aro)
  const mostrador = cylinder(0.125, 0.125, 0.012, '#fbfaf5', { roughness: 0.4 }, 32)
  mostrador.rotation.x = Math.PI / 2
  mostrador.position.z = 0.018
  relogio.add(mostrador)
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * Math.PI * 2
    const marca = rbox(0.012, k % 3 === 0 ? 0.03 : 0.016, 0.006, 0.003, '#2a2a2a', { roughness: 0.5 })
    marca.position.set(Math.sin(ang) * 0.1, Math.cos(ang) * 0.1, 0.026)
    marca.rotation.z = -ang
    relogio.add(marca)
  }
  const horas = rbox(0.016, 0.06, 0.008, 0.004, '#1f1f1f', { roughness: 0.5 })
  horas.position.set(Math.sin(Math.PI / 3) * 0.03, Math.cos(Math.PI / 3) * 0.03, 0.03)
  horas.rotation.z = -Math.PI / 3
  relogio.add(horas)
  const minutos = rbox(0.012, 0.085, 0.008, 0.004, '#1f1f1f', { roughness: 0.5 })
  minutos.position.set(0, 0.0425, 0.032)
  relogio.add(minutos)
  porta.add(relogio)

  const lintel = rbox(OPEN_W + POST * 2, POST, 0.2, 0.02, WOOD, { roughness: 0.55 })
  lintel.position.set(0, OPEN_H + POST / 2, 0)
  porta.add(lintel)
  const header = rbox(OPEN_W + POST * 2 + 1.0, 0.18, 0.14, 0.02, WALL, { roughness: 0.8 })
  header.position.set(0, OPEN_H + POST + 0.09, 0)
  porta.add(header)
  const threshold = rbox(OPEN_W, 0.02, 0.22, 0.008, WOOD_DARK, { roughness: 0.5 })
  threshold.position.set(0, 0.01, 0)
  porta.add(threshold)
  // folha da porta, aberta para dentro da sala (dobradiça no batente esquerdo)
  const leaf = new THREE.Group()
  leaf.position.set(-OPEN_W / 2, 0, 0.06)
  leaf.rotation.y = -1.25 // aberta para dentro da sala
  const slab = rbox(OPEN_W - 0.04, OPEN_H - 0.03, 0.06, 0.02, WOOD, { roughness: 0.5 })
  slab.position.set((OPEN_W - 0.04) / 2, (OPEN_H - 0.03) / 2, 0)
  leaf.add(slab)
  for (const sy of [0.55, 1.45]) {
    const panel = rbox(OPEN_W - 0.34, 0.6, 0.02, 0.01, WOOD_DARK, { roughness: 0.55 })
    panel.position.set((OPEN_W - 0.04) / 2, sy, 0.035)
    leaf.add(panel)
  }
  const handle = rbox(0.14, 0.03, 0.03, 0.012, STEEL, { roughness: 0.25, metalness: 0.85 })
  handle.position.set(OPEN_W - 0.17, 1.0, 0.07)
  leaf.add(handle)
  const handleBase = rbox(0.04, 0.12, 0.02, 0.008, STEEL, { roughness: 0.25, metalness: 0.85 })
  handleBase.position.set(OPEN_W - 0.12, 1.0, 0.045)
  leaf.add(handleBase)
  porta.add(leaf)
  root.add(porta)

  // ---- TOURO NELORE ----------------------------------------------------------
  const touro = new THREE.Group()
  touro.position.set(BULL_POS[0], GY, BULL_POS[1])
  touro.rotation.y = BULL_YAW
  root.add(touro)

  const tronco = capsule(0.38, 0.8, BULL, { roughness: 0.85 })
  tronco.rotation.x = Math.PI / 2
  tronco.position.set(0, 0.98, -0.05)
  touro.add(tronco)
  const peito = sphere(0.43, BULL, { roughness: 0.85 })
  peito.scale.set(0.92, 1.0, 0.95)
  peito.position.set(0, 1.0, 0.42)
  touro.add(peito)
  const anca = sphere(0.39, BULL, { roughness: 0.85 })
  anca.scale.set(0.92, 0.98, 0.95)
  anca.position.set(0, 1.02, -0.52)
  touro.add(anca)
  const barriga = sphere(0.34, BULL_SHADE, { roughness: 0.85 })
  barriga.scale.set(0.95, 0.75, 1.5)
  barriga.position.set(0, 0.8, 0.0)
  touro.add(barriga)

  // corcova alta no cangote (cupim) — cinza do nelore
  const cupim = sphere(0.27, BULL_GREY, { roughness: 0.85 })
  cupim.scale.set(0.66, 1.05, 0.95)
  cupim.position.set(0, 1.44, 0.3)
  cupim.rotation.x = -0.3
  touro.add(cupim)
  const cupimBase = sphere(0.3, BULL_GREY, { roughness: 0.85 })
  cupimBase.scale.set(0.85, 0.6, 1.2)
  cupimBase.position.set(0, 1.26, 0.38)
  touro.add(cupimBase)

  // pescoço grosso, descendo para a frente
  const NECK_END = v(0, 1.08, 0.88)
  touro.add(limb(v(0, 1.18, 0.5), NECK_END, 0.27, BULL_GREY))
  const nuca = sphere(0.27, BULL_GREY, { roughness: 0.85 })
  nuca.position.copy(NECK_END)
  touro.add(nuca)

  // barbela pendurada sob o pescoço e o peito
  const barbela = sphere(0.28, BULL_SHADE, { roughness: 0.85 })
  barbela.scale.set(0.32, 1.05, 1.15)
  barbela.position.set(0, 0.72, 0.7)
  touro.add(barbela)
  const barbela2 = sphere(0.2, BULL_SHADE, { roughness: 0.85 })
  barbela2.scale.set(0.3, 1.1, 1)
  barbela2.position.set(0, 0.78, 0.9)
  touro.add(barbela2)

  // pernas: três apoiadas (a dianteira direita é a peça 'casco')
  const legs: [number, number, boolean][] = [[0.2, 0.45, true], [0.2, -0.55, false], [-0.2, -0.55, false]]
  for (const [x, z, front] of legs) {
    const top = v(x, front ? 0.86 : 0.9, z)
    const knee = v(x, 0.44, z + (front ? 0.02 : -0.1))
    const ankle = v(x, 0.13, z + (front ? 0.03 : -0.02))
    touro.add(limb(top, knee, front ? 0.13 : 0.15, BULL))
    touro.add(limb(knee, ankle, 0.085, BULL))
    const joelho = sphere(0.1, BULL, { roughness: 0.85 })
    joelho.position.copy(knee)
    touro.add(joelho)
    const casco = cylinder(0.085, 0.105, 0.13, HOOF, { roughness: 0.5 })
    casco.position.set(ankle.x, 0.065, ankle.z + 0.02)
    touro.add(casco)
  }

  // cauda com vassoura preta
  touro.add(limb(v(0, 1.2, -0.86), v(0, 0.55, -0.98), 0.04, BULL_SHADE))
  const vassoura = sphere(0.075, HOOF, { roughness: 0.95 })
  vassoura.scale.set(1, 1.9, 1)
  vassoura.position.set(0, 0.46, -0.99)
  touro.add(vassoura)

  // ---- pata dianteira direita: raspa o carpete ------------------------------
  const casco = new THREE.Group()
  casco.position.set(-0.2, 0.86, 0.45)
  casco.rotation.x = CASCO_REST
  touro.add(casco)
  {
    // joelho dobrado: canela recolhida para trás, casco de bico para baixo
    const knee = v(0, -0.36, 0.16)
    const ankle = v(0, -0.58, -0.04)
    casco.add(limb(v(0, 0, 0), knee, 0.13, BULL))
    casco.add(limb(knee, ankle, 0.085, BULL))
    const joelho = sphere(0.1, BULL, { roughness: 0.85 })
    joelho.position.copy(knee)
    casco.add(joelho)
    const unha = cylinder(0.085, 0.105, 0.13, HOOF, { roughness: 0.5 })
    unha.position.set(0, -0.65, -0.1)
    unha.rotation.x = -0.75
    casco.add(unha)
  }

  // ---- sulco cavado no carpete + nuvenzinha de poeira -----------------------
  const sulco = new THREE.Group()
  sulco.position.set(-0.24, 0.0, 0.32)
  touro.add(sulco)
  {
    // vala escura com o pelo do carpete levantado nas bordas
    const vala = sphere(0.1, GROOVE, { roughness: 0.95 })
    vala.scale.set(1.1, 0.1, 3.4)
    sulco.add(vala)
    for (const s of [-1, 1]) {
      const borda = capsule(0.04, 0.56, GROOVE_RIM, { roughness: 0.95 })
      borda.rotation.x = Math.PI / 2
      borda.scale.set(1, 1, 0.55)
      borda.position.set(s * 0.13, 0.012, 0)
      sulco.add(borda)
    }
    const fiapos = rng(11)
    for (let i = 0; i < 7; i++) {
      const tufo = sphere(0.028, GROOVE_RIM, { roughness: 0.95 }, 12)
      tufo.position.set((fiapos() - 0.5) * 0.34, 0.015, -0.36 - fiapos() * 0.14)
      sulco.add(tufo)
    }
    // nuvenzinha de poeira bege levantada para trás do casco
    const nuvens: [number, number, number, number, number][] = [
      [-0.04, 0.08, -0.36, 0.075, 3], [-0.14, 0.15, -0.46, 0.06, 4], [0.06, 0.17, -0.44, 0.05, 5],
      [-0.08, 0.26, -0.54, 0.04, 6],
    ]
    for (const [x, y, z, r, seed] of nuvens) {
      const nuvem = puff(r, DUST, 5, seed, { roughness: 0.95 })
      nuvem.position.set(x, y, z)
      nuvem.scale.set(1.25, 0.85, 1.1)
      nuvem.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (m) { m.transparent = true; m.opacity = 0.82 }
      })
      sulco.add(nuvem)
    }
    const graos = rng(29)
    for (let i = 0; i < 8; i++) {
      const grao = sphere(0.014, DUST, { roughness: 0.9 }, 8)
      grao.position.set((graos() - 0.5) * 0.4, 0.2 + graos() * 0.3, -0.45 - graos() * 0.35)
      sulco.add(grao)
    }
  }

  // ---- crachá azul no cordão vermelho ---------------------------------------
  // pivô no cordão em volta do pescoço: o cartão balança a partir dali
  const cracha = new THREE.Group()
  cracha.position.set(0, 1.02, 0.78)
  touro.add(cracha)
  {
    const cordao = torus(0.31, 0.022, LANYARD, { roughness: 0.6 })
    cordao.rotation.set(Math.PI / 2 - 0.9, 0, 0)
    cracha.add(cordao)
    // o cartão escorregou para o ombro direito, o lado da câmera
    const fita = limb(v(-0.2, -0.2, 0.02), v(-0.36, -0.3, -0.16), 0.016, LANYARD, { roughness: 0.6 })
    cracha.add(fita)
    const cartao = new THREE.Group()
    cartao.position.set(-0.4, -0.42, -0.2)
    cartao.rotation.set(-0.05, -1.25, 0.1)
    const card = rbox(0.24, 0.3, 0.025, 0.02, BADGE, { roughness: 0.4 })
    cartao.add(card)
    const foto = rbox(0.1, 0.11, 0.008, 0.01, '#e9eef6', { roughness: 0.5 })
    foto.position.set(0, 0.05, 0.015)
    cartao.add(foto)
    const silhueta = sphere(0.03, '#7a8aa3', { roughness: 0.5 })
    silhueta.scale.z = 0.3
    silhueta.position.set(0, 0.06, 0.02)
    cartao.add(silhueta)
    for (const [w, y] of [[0.16, -0.05], [0.11, -0.09]] as const) {
      const linha = rbox(w, 0.018, 0.006, 0.004, '#dfe7f5', { roughness: 0.5 })
      linha.position.set(0, y, 0.015)
      cartao.add(linha)
    }
    const presilha = rbox(0.05, 0.03, 0.02, 0.008, STEEL, { roughness: 0.3, metalness: 0.8 })
    presilha.position.set(0, 0.16, 0)
    cartao.add(presilha)
    cracha.add(cartao)
  }

  // ---- cabeça: cara de touro decidido, virada para a câmera -----------------
  const cabeca = new THREE.Group()
  cabeca.position.copy(NECK_END)
  cabeca.rotation.order = 'YXZ'
  cabeca.rotation.y = HEAD_YAW - BULL_YAW
  cabeca.rotation.x = HEAD_PITCH
  cabeca.scale.setScalar(1.2)
  touro.add(cabeca)

  const cranio = sphere(0.25, BULL, { roughness: 0.85 })
  cranio.scale.set(1.08, 0.95, 1.0)
  cranio.position.set(0, 0.1, 0.12)
  cabeca.add(cranio)
  const cara = capsule(0.17, 0.16, BULL, { roughness: 0.85 })
  cara.rotation.x = Math.PI / 2 + 0.55
  cara.position.set(0, -0.04, 0.3)
  cabeca.add(cara)
  const focinho = sphere(0.165, MUZZLE, { roughness: 0.55 })
  focinho.scale.set(1.15, 0.82, 0.9)
  focinho.position.set(0, -0.16, 0.45)
  cabeca.add(focinho)
  const queixo = sphere(0.12, BULL_SHADE, { roughness: 0.85 })
  queixo.scale.set(1.0, 0.6, 1.1)
  queixo.position.set(0, -0.33, 0.36)
  cabeca.add(queixo)

  // argola de latão no focinho: o selo de touro bravo
  const argola = torus(0.06, 0.014, '#c9a14a', { roughness: 0.3, metalness: 0.8 })
  argola.rotation.y = Math.PI / 2
  argola.position.set(0, -0.19, 0.6)
  cabeca.add(argola)

  for (const s of [-1, 1]) {
    const narina = sphere(0.032, '#1c1b1d', { roughness: 0.4 })
    narina.scale.set(1, 0.7, 0.6)
    narina.position.set(s * 0.075, -0.13, 0.59)
    cabeca.add(narina)

    // olhos grandes, com sobrancelha franzida de quem está a ponto de investir
    const olho = sphere(0.07, '#ffffff', { roughness: 0.25 })
    olho.scale.set(1, 1, 0.6)
    olho.position.set(s * 0.15, 0.1, 0.33)
    cabeca.add(olho)
    const pupila = sphere(0.034, '#141414', { roughness: 0.2 })
    pupila.position.set(s * 0.145, 0.095, 0.375)
    cabeca.add(pupila)
    const brilho = sphere(0.01, '#ffffff', { roughness: 0.1 })
    brilho.position.set(s * 0.135, 0.11, 0.395)
    cabeca.add(brilho)
    const sobrancelha = capsule(0.022, 0.11, '#7e7a75', { roughness: 0.8 })
    sobrancelha.rotation.z = Math.PI / 2 + s * 0.45
    sobrancelha.position.set(s * 0.15, 0.2, 0.35)
    cabeca.add(sobrancelha)

    // orelha de nelore: folha comprida, caída para o lado
    const orelha = new THREE.Group()
    orelha.position.set(s * 0.26, 0.1, 0.02)
    orelha.rotation.set(0, 0, -s * 0.45)
    const lobo = sphere(0.1, BULL, { roughness: 0.85 })
    lobo.scale.set(1.9, 0.38, 0.8)
    lobo.position.x = s * 0.14
    orelha.add(lobo)
    const dentro = sphere(0.07, EAR_IN, { roughness: 0.7 })
    dentro.scale.set(1.9, 0.22, 0.65)
    dentro.position.set(s * 0.15, -0.012, 0.03)
    orelha.add(dentro)
    cabeca.add(orelha)

    // chifres curtos e grossos, cinza-escuros: base para fora, ponta para cima
    const chifreBase = limb(v(s * 0.16, 0.24, 0.06), v(s * 0.3, 0.3, 0.06), 0.06, HORN, { roughness: 0.45 })
    cabeca.add(chifreBase)
    const ponta = cone(0.058, 0.18, HORN, { roughness: 0.4 })
    ponta.position.set(s * 0.34, 0.39, 0.06)
    ponta.rotation.z = -s * 0.45
    cabeca.add(ponta)
  }

  // ---- pepino gigante atravessado na boca ----------------------------------
  const pepino = new THREE.Group()
  pepino.position.set(0, -0.26, 0.42)
  pepino.rotation.set(0, 0, 0.0)
  cabeca.add(pepino)
  {
    const corpo = capsule(CUKE_R, 0.78, CUKE, { roughness: 0.45 })
    corpo.rotation.z = Math.PI / 2
    pepino.add(corpo)
    // listras claras correndo ao comprido
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const listra = capsule(0.014, 0.66, CUKE_STRIPE, { roughness: 0.5 })
      listra.rotation.z = Math.PI / 2
      listra.position.set(0, Math.cos(a) * (CUKE_R - 0.006), Math.sin(a) * (CUKE_R - 0.006))
      pepino.add(listra)
    }
    // verruguinhas
    const ver = rng(17)
    for (let i = 0; i < 26; i++) {
      const a = ver() * Math.PI * 2
      const x = (ver() - 0.5) * 0.82
      const w = sphere(0.016, CUKE_DARK, { roughness: 0.5 }, 10)
      w.position.set(x, Math.cos(a) * CUKE_R, Math.sin(a) * CUKE_R)
      pepino.add(w)
    }
    // talo numa ponta, florzinha seca na outra
    const talo = cylinder(0.03, 0.045, 0.08, '#6b6a2e', { roughness: 0.7 })
    talo.rotation.z = Math.PI / 2
    talo.position.x = 0.53
    pepino.add(talo)
    const flor = sphere(0.04, '#d9cf6a', { roughness: 0.7 })
    flor.scale.set(0.6, 1, 1)
    flor.position.x = -0.51
    pepino.add(flor)
  }

  // ---- mesa branca em T -----------------------------------------------------
  // a perna do T aponta para o touro; a posição sai do pepino na boca dele,
  // para ele ficar pousado na ponta da perna do T
  touro.updateMatrixWorld(true)
  root.updateMatrixWorld(true)
  const cukeW = new THREE.Vector3()
  pepino.getWorldPosition(cukeW)
  const TABLE_H = THREE.MathUtils.clamp(cukeW.y - CUKE_R - GY + 0.01, 0.6, 0.8)
  const stemDir = v(Math.cos(TABLE_YAW), 0, -Math.sin(TABLE_YAW))
  const stemSide = v(Math.sin(TABLE_YAW), 0, Math.cos(TABLE_YAW))
  const FOOT_AT = 0.22 // o pepino fica pousado a esta distância da ponta da perna
  const tablePos = cukeW.clone()
    .addScaledVector(stemDir, -FOOT_AT)
    .addScaledVector(stemSide, -0.1)
  tablePos.y = GY

  const mesa = new THREE.Group()
  mesa.position.copy(tablePos)
  mesa.rotation.y = TABLE_YAW
  root.add(mesa)
  {
    const H = TABLE_H
    const stem = rbox(STEM_LEN + 0.05, 0.05, STEM_W, 0.02, WHITE, { roughness: 0.3 })
    stem.position.set((STEM_LEN + 0.05) / 2, H - 0.025, 0)
    mesa.add(stem)
    const bar = rbox(BAR_D, 0.05, BAR_L, 0.02, WHITE, { roughness: 0.3 })
    bar.position.set(STEM_LEN + BAR_D / 2, H - 0.025, 0)
    mesa.add(bar)
    // borda cinza por baixo do tampo
    const stemEdge = rbox(STEM_LEN, 0.04, STEM_W - 0.04, 0.015, TABLE_EDGE, { roughness: 0.4 })
    stemEdge.position.set(STEM_LEN / 2 + 0.02, H - 0.065, 0)
    mesa.add(stemEdge)
    const barEdge = rbox(BAR_D - 0.04, 0.04, BAR_L - 0.04, 0.015, TABLE_EDGE, { roughness: 0.4 })
    barEdge.position.set(STEM_LEN + BAR_D / 2, H - 0.065, 0)
    mesa.add(barEdge)
    // pés de aço: painel na ponta da perna, colunas nas pontas da barra
    const footPanel = rbox(0.05, H - 0.08, STEM_W - 0.16, 0.015, STEEL, { roughness: 0.3, metalness: 0.7 })
    footPanel.position.set(0.12, (H - 0.08) / 2, 0)
    mesa.add(footPanel)
    for (const s of [-1, 1]) {
      const col = rbox(BAR_D - 0.16, H - 0.08, 0.05, 0.015, STEEL, { roughness: 0.3, metalness: 0.7 })
      col.position.set(STEM_LEN + BAR_D / 2, (H - 0.08) / 2, s * (BAR_L / 2 - 0.1))
      mesa.add(col)
    }
    // papéis e canetas na frente das cadeiras, jarra d'água na cabeceira
    for (const x of CHAIRS_AT) {
      const bloco = rbox(0.28, 0.015, 0.22, 0.006, '#f7f3e6', { roughness: 0.85 })
      bloco.position.set(x, H + 0.008, 0.14)
      bloco.rotation.y = (rand() - 0.5) * 0.3
      mesa.add(bloco)
      const caneta = capsule(0.008, 0.13, '#2f3a4d', { roughness: 0.4 })
      caneta.rotation.set(0, 0.4, Math.PI / 2)
      caneta.position.set(x + 0.04, H + 0.012, 0.02)
      mesa.add(caneta)
    }
    const jarra = lathe(
      [[0, 0], [0.09, 0], [0.105, 0.03], [0.105, 0.19], [0.09, 0.25], [0.078, 0.28], [0.09, 0.3], [0.08, 0.305], [0.068, 0.285], [0, 0.28]],
      WATER,
      { roughness: 0.08 },
    )
    jarra.position.set(STEM_LEN + 0.24, H, -0.78)
    mesa.add(jarra)
    for (const z of [-0.4, 0.95]) {
      const copo = lathe(
        [[0, 0], [0.042, 0], [0.056, 0.12], [0.049, 0.12], [0.037, 0.012], [0, 0.012]],
        '#dcecf3',
        { roughness: 0.08 },
      )
      copo.position.set(STEM_LEN + 0.22, H, z)
      mesa.add(copo)
    }
  }

  // ---- três cadeiras ao longo da perna do T + a da cabeceira ----------------
  const cadeiras = new THREE.Group()
  cadeiras.position.copy(tablePos)
  cadeiras.rotation.y = TABLE_YAW
  root.add(cadeiras)
  // do lado da frente da perna do T, viradas para a mesa
  for (const x of CHAIRS_AT) {
    const c = makeChair()
    c.scale.setScalar(0.9)
    c.position.set(x, 0, STEM_W / 2 + 0.16)
    c.rotation.y = Math.PI
    cadeiras.add(c)
  }
  const HEAD_SEAT = STEM_LEN + BAR_D + 0.4
  {
    const c = makeChair()
    c.position.set(HEAD_SEAT, 0, 0)
    c.rotation.y = -Math.PI / 2
    cadeiras.add(c)
  }

  // ---- METEORO (o mesmo de 'Jag har ett möte') ------------------------------
  const metPos = tablePos.clone().addScaledVector(stemDir, HEAD_SEAT - 0.04)
  const meteoro = new THREE.Group()
  meteoro.position.set(metPos.x, GY + MET_Y, metPos.z)
  meteoro.rotation.order = 'YXZ'
  meteoro.rotation.y = -0.75 // a cara (+z local) olha para o touro e a câmera
  meteoro.rotation.x = MET_TILT // e se ergue um pouco por cima da mesa
  root.add(meteoro)

  const stoneGeo = new THREE.IcosahedronGeometry(MET_R, 2)
  {
    const pos = stoneGeo.attributes.position
    const p = new THREE.Vector3()
    const offsets = new Map<string, number>()
    const r = rng(7)
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i)
      const key = `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`
      let k = offsets.get(key)
      if (k === undefined) offsets.set(key, (k = 1 + (r() - 0.5) * 0.14))
      p.multiplyScalar(k)
      pos.setXYZ(i, p.x, p.y, p.z)
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
    // o meteoro está na cena: o raio precisa sair do frame do mundo
    const origin = meteoro.localToWorld(d.clone().multiplyScalar(2))
    const target = meteoro.localToWorld(new THREE.Vector3())
    ray.set(origin, target.sub(origin).normalize())
    const hit = ray.intersectObject(stone, false)[0]
    const p = hit ? meteoro.worldToLocal(hit.point.clone()) : d.clone().multiplyScalar(MET_R)
    return { p, n: d }
  }
  meteoro.updateMatrixWorld(true)

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

  // rachaduras em brasa
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
      d.addScaledVector(tangent, 0.2).normalize()
      tangent.applyAxisAngle(d, (crackRand() - 0.5) * 1.8).projectOnPlane(d).normalize()
    }
  }

  // carinha: olhos grandes e sorriso de quem já esperava a pauta
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

  const glow = new THREE.PointLight(EMBER, 2.2, 2.6, 2)
  glow.position.set(0, 0.1, 0.6)
  meteoro.add(glow)

  // ---- cauda de fogo subindo do meteoro ------------------------------------
  const cauda = new THREE.Group()
  cauda.position.set(0, MET_R * 0.2, -0.08)
  cauda.rotation.set(-0.15, 0, -0.32)
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

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'porta', group: 'sala', object: porta },
    { name: 'touro', group: 'touro', object: touro },
    { name: 'cabeca', group: 'touro', object: cabeca },
    { name: 'casco', group: 'touro', object: casco },
    { name: 'cracha', group: 'touro', object: cracha },
    { name: 'pepino', group: 'pepino', object: pepino },
    { name: 'sulco', group: 'cavar', object: sulco },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'cadeiras', group: 'mesa', object: cadeiras },
    { name: 'meteoro', group: 'meteoro', object: meteoro },
    { name: 'cauda', group: 'meteoro', object: cauda },
  ]

  // ---- montagem ------------------------------------------------------------
  const P = pepino.position.clone()
  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Escritório: carpete cinza-azulado e, no fundo, a porta aberta pro corredor.',
    }),
    seq('porta-rise', 'porta', 0.3, 0.8, [riseFrom(GY, 2.4)], { ease: 'easeOut' }),

    seq('touro-rise', 'touro', 1.3, 0.9, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'Na porta, um touro nelore de corcova e barbela — funcionário da casa, de crachá e tudo.',
    }),
    seq('cabeca-ergue', 'cabeca', 1.3, 0.9, [ch('rotation.x', 0.6, HEAD_PITCH_UP)], { ease: 'easeOut' }),
    seq('casco-entra', 'casco', 1.3, 0.9, [ch('rotation.x', 0, CASCO_REST)], { ease: 'easeOut' }),
    seq('cracha-balanca', 'cracha', 1.3, 1.2, [ch('rotation.x', -0.3, 0)], { ease: 'easeOut' }),

    seq('pepino-chega', 'pepino', 2.9, 0.8, [
      ch('position.x', -1.6, P.x), ch('position.y', 0.5, P.y - 0.05), ch('position.z', 0.9, P.z + 0.32),
      ch('rotation.z', 2.4, 0.15),
      ...s3(0.4, 1),
    ], {
      ease: 'easeOut',
      caption: 'Um colega empurra pra cima dele um pepino gigante — o pepino da semana.',
    }),

    seq('casco-raspa-1', 'casco', 4.3, 0.35, [ch('rotation.x', CASCO_REST, CASCO_BACK)], {
      ease: 'easeInOut',
      caption: 'O touro raspa o casco no carpete, CAVANDO um sulco: CA-VI, CA-VI… pronto pra investir!',
    }),
    seq('sulco-abre', 'sulco', 4.4, 0.9, [ch('scale.z', 0.05, 1), ch('scale.x', 0.5, 1), ch('scale.y', 0.2, 1)], { ease: 'easeOut' }),
    seq('casco-volta-1', 'casco', 4.65, 0.3, [ch('rotation.x', CASCO_BACK, CASCO_REST)], { ease: 'easeInOut' }),
    seq('casco-raspa-2', 'casco', 4.95, 0.35, [ch('rotation.x', CASCO_REST, CASCO_BACK)], { ease: 'easeInOut' }),
    seq('casco-volta-2', 'casco', 5.3, 0.35, [ch('rotation.x', CASCO_BACK, CASCO_REST)], { ease: 'easeOut' }),

    seq('cabeca-resmunga', 'cabeca', 6.2, 0.5, [ch('rotation.z', 0, 0.14)], {
      ease: 'easeInOut',
      caption: 'Mas é um touro sueco: respira fundo, resmunga TÁ, DÊ, PÔ! e abocanha o pepino.',
    }),
    seq('cabeca-resmunga-2', 'cabeca', 6.7, 0.5, [ch('rotation.z', 0.14, 0)], { ease: 'easeInOut' }),
    seq('pepino-abocanha', 'pepino', 6.75, 0.45, [
      ch('position.y', P.y - 0.05, P.y), ch('position.z', P.z + 0.32, P.z), ch('rotation.z', 0.15, 0),
    ], { ease: 'easeInOut' }),

    seq('mesa-rise', 'mesa', 7.7, 0.8, [riseFrom(GY, 1.2)], {
      ease: 'easeOut',
      caption: 'E marcha com o problema pra sala de reunião, até a mesa branca em forma de T.',
    }),
    seq('cadeiras-rise', 'cadeiras', 7.95, 0.8, [riseFrom(GY, 1.3)], { ease: 'easeOut' }),

    seq('meteoro-cai', 'meteoro', 9.1, 0.8, [
      ch('position.y', 4.4, GY + MET_Y), ch('rotation.x', -1.4, MET_TILT),
    ], {
      ease: 'easeIn',
      caption: 'Na cabeceira já espera o METEORO de "Jag har ett möte" — a reunião de sempre.',
    }),
    seq('cauda-acende', 'cauda', 9.1, 0.35, s3(0.01, 1)),
    seq('meteoro-amassa', 'meteoro', 9.9, 0.15, [ch('scale.y', 1, 0.82), ch('scale.x', 1, 1.1)], { ease: 'easeOut' }),
    seq('meteoro-volta', 'meteoro', 10.05, 0.35, [ch('scale.y', 0.82, 1), ch('scale.x', 1.1, 1)], { ease: 'easeOut' }),

    seq('cabeca-pousa', 'cabeca', 10.8, 0.7, [ch('rotation.x', HEAD_PITCH_UP, HEAD_PITCH)], {
      ease: 'easeInOut',
      caption: 'E entrega o problema na perna do T, diante do convidado de sempre: MÖÖ-TE-T!',
    }),

    seq('cauda-aviva', 'cauda', 12.0, 0.35, s3(1, 1.15), {
      ease: 'easeOut',
      caption: 'Kan vi ta det på mötet? — Podemos tratar disso na reunião?',
    }),
    seq('cauda-assenta', 'cauda', 12.35, 0.45, s3(1.15, 1), { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.45, 4.35], target: [-0.02, 0.98, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-vi-ta-det-pa-motet',
    contexto:
      'Trabalho: quando alguém puxa um assunto grande no corredor, na fila do café ou no chat, e você quer discutir com o grupo todo; pra adiar sem dizer não. Primo de \'Kan vi skjuta på det?\' (dá pra adiar?).',
    fraseFonte: 'Podemos tratar disso na reunião?',
    fraseAlvo: 'Kan vi ta det på mötet?',
    pronuncia:
      "ka vi TÁ dê pô MÖÖ-tet? ('kan vi' emenda e o N quase some: ka-vi, sem força; 'ta' com A longo e aberto, com força; 'det' = dê; 'på' = pô, Ô fechado e fraco; 'mötet' com a força no MÖ, Ö longo e fechado — língua de Ê, lábios de Ô em bico —, e T seco no fim, sem 'tchi': o -t é o artigo, 'A reunião')",
    ponteSonora:
      "CA-VI... TÁ, DÊ, PÔ... MÖÖ-TE-T? (7 batidas: ka-vi-TÁ-dê-pô-MÖÖ-tet; força no TÁ e, a maior, no MÖÖ; CA-VI é o MESMO 'kan vi' de 'Kan vi få notan, tack?' e 'Kan vi dela på notan?': CAVE lido à brasileira, KÁ-vi — aqui é o casco do touro CAVANDO o carpete; rápido e sem força, e o N de 'kan' some na fala, igual em sueco; TÁ = o 'ta' de sempre, o mesmo TÁ? DÊ! do canguru de 'Kan du ta det en gång till?': A ABERTO e longo, com força — é o verbo 'pegar'; DÊ, PÔ = o MESMO 'det på' da pata rica de 'Kan du skicka det på mejl?': DÊ fechado = 'det', PÔ de boca redonda, Ô FECHADO = 'på', nunca 'pó'; os dois rapidinhos e SEM força — aqui 'på' é só 'na', não é partícula de verbo; 'TÁ, DÊ, PÔ!' sai num resmungo só, o 'tá, me dá isso, pô!' do touro; MÖÖ-TE-T = o METE(oro) de 'Jag har ett möte' — a reunião de sempre —, com a força no MÊ dito de BICO, o beijinho da cientista: língua de Ê, lábios de Ô, LONGO — nunca o MÉT aberto e curto da META do galo de 'Jag är mätt', que é 'satisfeito'; o -TE fraquinho, de T duro, nunca 'tchi'; e um T SECO no fim, que é o artigo sueco colado, como o N de IÁK-KAN: möte = UMA reunião, mötet = A reunião (a de terça, a de sempre); a pista é a mesa da sala, que é em T; sem esse T fica 'på möte', que soa errado)",
    historia:
      'No corredor, um colega empurra pra cima do touro nelore um PEPINO gigante — o pepino da semana. O touro raspa o casco no carpete, CAVANDO um sulco — CA-VI, CA-VI —, pronto pra investir. Mas é um touro sueco: respira fundo, resmunga TÁ, DÊ, PÔ!, abocanha o pepino e marcha pra sala de reunião, onde o METEORO de \'Jag har ett möte\' já espera na cabeceira da mesa em T. Ele deposita o problema bem na perna do T, diante do convidado de sempre: MÖÖ-TE-T. Isso a gente resolve na reunião.',
  },
  createScene,
  refine: { organic: ['touro', 'cabeca', 'casco'] },
}

export default card
