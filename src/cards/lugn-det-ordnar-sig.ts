import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, torus, lathe, puff, person, shoulderPivot, mat,
} from '../rig/helpers'

/**
 * "Lugn, det ordnar sig." — LUNG(uento)! DÊ... ÔÔR-D'NAR... SÊI!
 *
 * A cozinha desabou em dia de visita. Da pia cheia d'água sobe a lula gigante
 * de avental: passa LUNGUENTO na testa do dono da casa (LUNG!), abre os dez
 * braços (DÊ!) e ORDENA tudo de uma vez — prateleira de volta na parede,
 * panelas nos ganchos, pratos empilhados — cantarolando ÔÔR-D'NAR... SÊI!
 *
 * Diorama: piso xadrez creme e azul-ardósia, parede creme ao fundo com azulejo
 * atrás da pia, armário sálvia com pia branca funda; a lula vermelho-alaranjada
 * no centro, o rapaz de camiseta mostarda no banquinho à esquerda e o lado
 * ainda bagunçado (panela tombada, pratos no chão) à direita, na frente.
 * Acento saturado RESERVADO: o azul-cobalto do pote de LUNGUENTO.
 */

const TILE_A = '#efebe2'
const TILE_B = '#7f95a8'
const GROUT = '#3f4a56'
const WALL = '#efe2c8'
const WALL_DARK = '#d8c7a6'
const SPLASH = '#dfe8ea'
const SAGE = '#93ab98'
const SAGE_DARK = '#7a937f'
const COUNTER = '#454c56'
const PORCELAIN = '#f4f2ec'
const WATER = '#9fd2e3'
const CHROME = '#c4cad0'
const WOOD = '#b07b45'
const WOOD_DARK = '#86592e'
const SQUID = '#dc6a43'
const SQUID_DARK = '#b8502f'
const SQUID_SPOT = '#a7432a'
const SUCKER = '#f7ece2'
const APRON = '#f6f3ec'
const APRON_TRIM = '#c9b79a'
const SHIRT = '#e5b13e'
const PANTS = '#44536b'
const SKIN = '#e7c19c'
const HAIR = '#4a3426'
const ACCENT = '#1d64dc' // acento saturado RESERVADO: o pote de LUNGUENTO

const GY = 0.16 // topo do piso
const WALL_Z = -1.75 // centro da parede (frente em -1.67)
const WALL_FRONT = WALL_Z + 0.08
const CAB_TOP = 1.0 // tampo do armário
const W = 1.13 // nível da água na pia
const S = new THREE.Vector3(0.15, W, -1.15) // centro da pia / da lula
const BOY = new THREE.Vector3(-1.12, GY, 0.32)
const BOY_ROT = 0.5
const BOY_H = 1.2
const SEAT = 0.44
const JAR = new THREE.Vector3(-0.36, 1.0, 0.5)
const SHELF = new THREE.Vector3(-1.15, 2.02, WALL_FRONT + 0.16)
const RAIL_Y = 2.14
const RAIL_Z = WALL_FRONT + 0.2
const PLATES = new THREE.Vector3(1.28, 1.12, -0.12)
const FALL = new THREE.Vector3(-1.45, GY + 0.27, WALL_FRONT + 0.3) // prateleira caída
const FALL_ROT = 0.5

/** Curva tubular afinando da base à ponta (braços e tentáculos da lula). */
function arm(
  points: [number, number, number][],
  r0: number,
  r1: number,
  opts: { club?: boolean; dab?: boolean } = {},
) {
  const g = new THREE.Group()
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p).sub(S)))
  const T = 72
  const R = 16
  const geo = new THREE.TubeGeometry(curve, T, 1, R, false)
  const radius = (t: number) => {
    let r = r0 + (r1 - r0) * Math.pow(t, 0.85)
    if (opts.club) r *= 1 + 0.85 * Math.exp(-((t - 0.87) ** 2) / 0.003)
    return r
  }
  const pos = geo.attributes.position
  const P = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= T; i++) {
    curve.getPointAt(i / T, P)
    const r = radius(i / T)
    for (let j = 0; j <= R; j++) {
      const k = i * (R + 1) + j
      v.fromBufferAttribute(pos, k).sub(P).multiplyScalar(r).add(P)
      pos.setXYZ(k, v.x, v.y, v.z)
    }
  }
  const tube = new THREE.Mesh(geo, mat(SQUID, { roughness: 0.5, size: 0.4 }))
  tube.castShadow = true
  tube.receiveShadow = true
  g.add(tube)

  const tip = sphere(radius(1), SQUID, { roughness: 0.5 }, 16)
  tip.position.copy(curve.getPointAt(1))
  g.add(tip)

  if (opts.dab) {
    const pomada = sphere(radius(1) * 1.25, '#fbfaf6', { roughness: 0.35 }, 16)
    pomada.position.copy(curve.getPointAt(0.985))
    g.add(pomada)
  }

  // ventosas: duas fileiras no lado que olha para a câmera
  const frames = geo as unknown as { normals: THREE.Vector3[]; binormals: THREE.Vector3[] }
  const view = new THREE.Vector3(0, 0.35, 1).normalize()
  const mid = Math.round(T * 0.6)
  const phi = Math.atan2(frames.binormals[mid].dot(view), frames.normals[mid].dot(view))
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = Math.round(T * 0.3); i < T * 0.95; i += 4) {
    const t = i / T
    curve.getPointAt(t, P)
    const r = radius(t)
    for (const off of [-0.5, 0.5]) {
      const a = phi + off
      const d = frames.normals[i].clone().multiplyScalar(Math.cos(a))
        .add(frames.binormals[i].clone().multiplyScalar(Math.sin(a)))
        .normalize()
      const ventosa = sphere(r * 0.34, SUCKER, { roughness: 0.45 }, 10)
      ventosa.position.copy(P).addScaledVector(d, r * 0.9)
      ventosa.quaternion.setFromUnitVectors(up, d)
      ventosa.scale.y = 0.45
      g.add(ventosa)
    }
  }
  return g
}

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.022, 0.006, ACCENT, { roughness: 0.4 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** L U N G — letras de traço grosso para o rótulo do pote. */
function letter(which: 'L' | 'U' | 'N' | 'G') {
  const g = new THREE.Group()
  const t = 0.024
  const h = 0.12
  const w = 0.078
  if (which === 'L') {
    g.add(stroke(t, h, -w / 2 + t / 2, 0))
    g.add(stroke(w * 0.62, t, -w * 0.19, -h / 2 + t / 2))
  } else if (which === 'U') {
    g.add(stroke(t, h, -w / 2 + t / 2, 0))
    g.add(stroke(t, h, w / 2 - t / 2, 0))
    g.add(stroke(w, t, 0, -h / 2 + t / 2))
  } else if (which === 'N') {
    g.add(stroke(t, h, -w / 2 + t / 2, 0))
    g.add(stroke(t, h, w / 2 - t / 2, 0))
    g.add(stroke(t * 0.95, h * 1.08, 0, 0, 0.55))
  } else {
    g.add(stroke(t, h, -w / 2 + t / 2, 0))
    g.add(stroke(w, t, 0, h / 2 - t / 2))
    g.add(stroke(w, t, 0, -h / 2 + t / 2))
    g.add(stroke(t, h * 0.45, w / 2 - t / 2, -h * 0.22))
    g.add(stroke(w * 0.45, t, w * 0.2, -h * 0.02))
  }
  return g
}

/** Panela de alumínio com cabo. */
function pan(r: number, h: number) {
  const g = new THREE.Group()
  const corpo = lathe(
    [[0, 0], [r * 0.92, 0], [r, h * 0.12], [r, h * 0.92], [r * 1.06, h], [r * 0.95, h], [r * 0.93, h * 0.12], [0, h * 0.1]],
    CHROME,
    { roughness: 0.28, metalness: 0.75 },
  )
  g.add(corpo)
  const cabo = rbox(0.34, 0.035, 0.05, 0.015, '#2f3338', { roughness: 0.5 })
  cabo.position.set(r + 0.15, h * 0.85, 0)
  g.add(cabo)
  const furo = torus(0.022, 0.009, '#2f3338', { roughness: 0.5 })
  furo.position.set(r + 0.28, h * 0.85, 0)
  furo.rotation.x = Math.PI / 2
  g.add(furo)
  return g
}

/** Prato branco com filete azul-ardósia. */
function plate(r: number) {
  const g = new THREE.Group()
  const disco = lathe(
    [[0, 0], [r * 0.6, 0], [r * 0.66, 0.012], [r, 0.03], [r * 0.98, 0.036], [r * 0.64, 0.018], [0, 0.016]],
    PORCELAIN,
    { roughness: 0.25 },
  )
  g.add(disco)
  const filete = torus(r * 0.86, 0.006, TILE_B, { roughness: 0.3 })
  filete.rotation.x = Math.PI / 2
  filete.position.y = 0.028
  g.add(filete)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: piso xadrez da cozinha -----------------------------------------
  const base = new THREE.Group()
  const laje = cylinder(2.62, 2.7, 0.12, GROUT, { roughness: 0.8 })
  laje.position.y = 0.06
  base.add(laje)
  const STEP = 0.44
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      const x = i * STEP
      const z = j * STEP
      if (Math.hypot(Math.abs(x) + STEP / 2, Math.abs(z) + STEP / 2) > 2.6) continue
      const ladrilho = rbox(STEP - 0.025, 0.04, STEP - 0.025, 0.01, (i + j) % 2 === 0 ? TILE_A : TILE_B, {
        roughness: 0.35,
      })
      ladrilho.position.set(x, GY - 0.02, z)
      base.add(ladrilho)
    }
  }
  const borda = torus(2.64, 0.05, '#2f3740', { roughness: 0.6 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.11
  base.add(borda)
  root.add(base)

  // ---- parede do fundo com azulejo atrás da pia ------------------------------
  const parede = new THREE.Group()
  const muro = rbox(3.6, 2.5, 0.16, 0.04, WALL, { roughness: 0.85 })
  muro.position.set(0, GY + 1.25, WALL_Z)
  parede.add(muro)
  const rodape = rbox(3.62, 0.12, 0.2, 0.03, WALL_DARK, { roughness: 0.8 })
  rodape.position.set(0, GY + 0.06, WALL_Z)
  parede.add(rodape)
  const moldura = rbox(3.66, 0.08, 0.22, 0.03, WALL_DARK, { roughness: 0.8 })
  moldura.position.set(0, GY + 2.5, WALL_Z)
  parede.add(moldura)
  const azulejo = rbox(2.1, 0.66, 0.03, 0.01, SPLASH, { roughness: 0.3 })
  azulejo.position.set(S.x, CAB_TOP + 0.33, WALL_FRONT + 0.015)
  parede.add(azulejo)
  for (let k = 1; k < 3; k++) {
    const rejunte = rbox(2.1, 0.012, 0.012, 0.004, '#b9c6ca', { roughness: 0.6 })
    rejunte.position.set(S.x, CAB_TOP + k * 0.22, WALL_FRONT + 0.032)
    parede.add(rejunte)
  }
  for (let k = -4; k <= 4; k++) {
    const rejunte = rbox(0.012, 0.66, 0.012, 0.004, '#b9c6ca', { roughness: 0.6 })
    rejunte.position.set(S.x + k * 0.233, CAB_TOP + 0.33, WALL_FRONT + 0.032)
    parede.add(rejunte)
  }
  // trilho dos ganchos das panelas (direita)
  const trilho = cylinder(0.02, 0.02, 1.15, '#2f3338', { roughness: 0.4, metalness: 0.7 })
  trilho.rotation.z = Math.PI / 2
  trilho.position.set(1.3, RAIL_Y, RAIL_Z)
  parede.add(trilho)
  for (const sx of [-1, 1]) {
    const suporte = cylinder(0.018, 0.018, RAIL_Z - WALL_FRONT, '#2f3338', { roughness: 0.4, metalness: 0.7 })
    suporte.rotation.x = Math.PI / 2
    suporte.position.set(1.3 + sx * 0.52, RAIL_Y, (RAIL_Z + WALL_FRONT) / 2)
    parede.add(suporte)
  }
  for (const hx of [0.95, 1.3, 1.65]) {
    const gancho = torus(0.035, 0.008, '#2f3338', { roughness: 0.4, metalness: 0.7 })
    gancho.position.set(hx, RAIL_Y - 0.04, RAIL_Z)
    gancho.rotation.y = Math.PI / 2
    parede.add(gancho)
  }
  // mãos-francesas da prateleira (ficaram na parede)
  for (const sx of [-1, 1]) {
    const mao = rbox(0.04, 0.2, 0.2, 0.01, '#2f3338', { roughness: 0.5, metalness: 0.5 })
    mao.position.set(SHELF.x + sx * 0.36, SHELF.y - 0.13, WALL_FRONT + 0.1)
    parede.add(mao)
  }
  root.add(parede)

  // ---- armário sálvia + pia branca funda cheia d'água ------------------------
  const pia = new THREE.Group()
  const CAB_W = 2.0
  const CAB_D = 0.9
  const CAB_H = CAB_TOP - GY - 0.05
  const armario = rbox(CAB_W, CAB_H, CAB_D, 0.04, SAGE, { roughness: 0.7 })
  armario.position.set(S.x, GY + CAB_H / 2, S.z)
  pia.add(armario)
  const tampo = rbox(CAB_W + 0.08, 0.06, CAB_D + 0.06, 0.02, COUNTER, { roughness: 0.4 })
  tampo.position.set(S.x, CAB_TOP - 0.03, S.z + 0.02)
  pia.add(tampo)
  // portas e puxadores
  for (const dx of [-0.75, -0.25, 0.25, 0.75]) {
    const porta = rbox(0.44, CAB_H - 0.2, 0.03, 0.02, SAGE_DARK, { roughness: 0.7 })
    porta.position.set(S.x + dx, GY + 0.04 + (CAB_H - 0.2) / 2 + 0.02, S.z + CAB_D / 2 + 0.01)
    pia.add(porta)
    const painel = rbox(0.32, CAB_H - 0.36, 0.02, 0.015, SAGE, { roughness: 0.7 })
    painel.position.set(S.x + dx, porta.position.y, S.z + CAB_D / 2 + 0.03)
    pia.add(painel)
    const puxador = sphere(0.028, CHROME, { roughness: 0.25, metalness: 0.8 }, 16)
    puxador.position.set(S.x + dx - Math.sign(dx) * 0.15, porta.position.y + 0.15, S.z + CAB_D / 2 + 0.05)
    pia.add(puxador)
  }
  // cuba de louça: quatro paredes + fundo, com a água quase na boca
  const CUBA_W = 1.04
  const CUBA_D = 0.76
  const CUBA_Y0 = CAB_TOP - 0.16
  const CUBA_H = 0.34
  const cubaCor = { roughness: 0.22 }
  for (const sz of [-1, 1]) {
    const lado = rbox(CUBA_W, CUBA_H, 0.06, 0.025, PORCELAIN, cubaCor)
    lado.position.set(S.x, CUBA_Y0 + CUBA_H / 2, S.z + sz * (CUBA_D / 2 - 0.03))
    pia.add(lado)
  }
  for (const sx of [-1, 1]) {
    const lado = rbox(0.06, CUBA_H, CUBA_D, 0.025, PORCELAIN, cubaCor)
    lado.position.set(S.x + sx * (CUBA_W / 2 - 0.03), CUBA_Y0 + CUBA_H / 2, S.z)
    pia.add(lado)
  }
  const agua = rbox(CUBA_W - 0.1, W - CUBA_Y0, CUBA_D - 0.1, 0.02, WATER, { roughness: 0.08 })
  agua.position.set(S.x, CUBA_Y0 + (W - CUBA_Y0) / 2, S.z)
  pia.add(agua)
  for (const [rr, sx, sz] of [[0.47, 0, 0.0], [0.07, -0.38, 0.22], [0.06, 0.4, 0.24]] as const) {
    const onda = torus(rr, 0.012, '#d9f0f7', { roughness: 0.1 })
    onda.rotation.x = Math.PI / 2
    onda.position.set(S.x + sx, W + 0.004, S.z + sz)
    onda.scale.set(1, 0.72, 1)
    pia.add(onda)
  }
  // torneira cromada no canto de trás
  const torneira = new THREE.Group()
  torneira.position.set(S.x + 0.62, CAB_TOP, S.z - 0.3)
  const haste = cylinder(0.035, 0.045, 0.34, CHROME, { roughness: 0.2, metalness: 0.85 })
  haste.position.y = 0.17
  torneira.add(haste)
  const bica = torus(0.12, 0.03, CHROME, { roughness: 0.2, metalness: 0.85 })
  bica.geometry.dispose()
  bica.geometry = new THREE.TorusGeometry(0.12, 0.03, 12, 24, Math.PI)
  bica.position.set(-0.12, 0.34, 0)
  torneira.add(bica)
  const registro = cylinder(0.05, 0.05, 0.04, CHROME, { roughness: 0.2, metalness: 0.85 })
  registro.position.set(0, 0.24, 0.06)
  registro.rotation.x = Math.PI / 2
  torneira.add(registro)
  pia.add(torneira)
  root.add(pia)

  // ---- lado bagunçado: panela tombada e pratos no chão -----------------------
  const bagunca = new THREE.Group()
  const panelaCaida = pan(0.17, 0.2)
  panelaCaida.position.set(1.5, GY + 0.17, 0.8)
  panelaCaida.rotation.order = 'YXZ'
  panelaCaida.rotation.set(Math.PI / 2 - 0.08, -0.6, 0)
  bagunca.add(panelaCaida)
  const pratoChao = plate(0.2)
  pratoChao.position.set(0.62, GY, 1.2)
  pratoChao.rotation.set(0.05, 0.4, 0.04)
  bagunca.add(pratoChao)
  const pratoTorto = plate(0.2)
  pratoTorto.position.set(1.05, GY + 0.16, 1.45)
  pratoTorto.rotation.set(-1.15, 0.5, 0.25)
  bagunca.add(pratoTorto)
  const caco = rbox(0.09, 0.015, 0.06, 0.005, PORCELAIN, { roughness: 0.25 })
  caco.position.set(0.88, GY + 0.008, 1.05)
  caco.rotation.y = rand() * Math.PI
  bagunca.add(caco)
  root.add(bagunca)

  // ---- rapaz no banquinho -----------------------------------------------------
  const rapaz = new THREE.Group()
  rapaz.position.copy(BOY)
  rapaz.rotation.y = BOY_ROT
  root.add(rapaz)

  const assento = cylinder(0.24, 0.24, 0.05, WOOD, { roughness: 0.6 })
  assento.position.y = SEAT - 0.025
  rapaz.add(assento)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4
    const perna = cylinder(0.022, 0.028, SEAT - 0.04, WOOD_DARK, { roughness: 0.6 })
    perna.position.set(Math.sin(a) * 0.15, (SEAT - 0.04) / 2, Math.cos(a) * 0.15)
    perna.rotation.set(Math.cos(a) * 0.12, 0, -Math.sin(a) * 0.12)
    rapaz.add(perna)
  }
  const anel = torus(0.15, 0.012, WOOD_DARK, { roughness: 0.6 })
  anel.rotation.x = Math.PI / 2
  anel.position.y = 0.16
  rapaz.add(anel)

  // pernas sentadas: coxas para a frente, canelas descendo ao piso
  for (const side of [-1, 1]) {
    const coxa = capsule(0.075, 0.24, PANTS, { roughness: 0.85 })
    coxa.position.set(side * 0.1, SEAT + 0.06, 0.16)
    coxa.rotation.x = Math.PI / 2
    rapaz.add(coxa)
    const canela = capsule(0.065, 0.26, PANTS, { roughness: 0.85 })
    canela.position.set(side * 0.11, SEAT - 0.14, 0.33)
    canela.rotation.x = 0.12
    rapaz.add(canela)
    const tenis = rbox(0.13, 0.08, 0.22, 0.035, '#f1eee6', { roughness: 0.6 })
    tenis.position.set(side * 0.11, 0.04, 0.39)
    rapaz.add(tenis)
    const sola = rbox(0.135, 0.025, 0.225, 0.01, '#3c4552', { roughness: 0.7 })
    sola.position.set(side * 0.11, 0.0125, 0.39)
    rapaz.add(sola)
  }

  const gente = person({ body: SHIRT, skin: SKIN, height: BOY_H, armAngle: 0.3 })
  gente.position.y = SEAT
  rapaz.add(gente)
  const cabeca = gente.getObjectByName('head') as THREE.Group
  const cabelo = puff(0.15, HAIR, 6, 12, { roughness: 0.9 })
  cabelo.position.set(0, 0.13, -0.04)
  cabelo.scale.set(1.25, 0.7, 1.15)
  cabeca.add(cabelo)
  const sorriso = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.011, 8, 16, Math.PI),
    mat('#7a3b2e', { roughness: 0.6 }),
  )
  sorriso.position.set(0, -0.085, 0.205)
  sorriso.rotation.z = Math.PI
  cabeca.add(sorriso)

  // braço do lado da lula: repousa na coxa
  const bracoDir = gente.getObjectByName('armR') as THREE.Object3D
  shoulderPivot(bracoDir, BOY_H)
  bracoDir.rotation.set(-0.75, 0, -0.12)
  // braço da frente (peça): sai da cabeça e desce para o colo
  const maoRapaz = gente.getObjectByName('armL') as THREE.Object3D
  shoulderPivot(maoRapaz, BOY_H)
  const MAO_FIM_X = -0.75
  const MAO_FIM_Z = 0.12
  maoRapaz.rotation.set(MAO_FIM_X, 0, MAO_FIM_Z)

  // ---- a lula gigante (corpo: cabeça, manto, nadadeiras, olhos) ---------------
  const lula = new THREE.Group()
  lula.position.copy(S)
  root.add(lula)

  const cabecaLula = sphere(0.4, SQUID, { roughness: 0.5 })
  cabecaLula.scale.set(1, 0.85, 0.9)
  cabecaLula.position.y = 0.2
  lula.add(cabecaLula)
  const manto = lathe(
    [
      [0, 0.28], [0.34, 0.3], [0.42, 0.5], [0.44, 0.8], [0.41, 1.1],
      [0.33, 1.38], [0.2, 1.62], [0.08, 1.8], [0, 1.86],
    ],
    SQUID,
    { roughness: 0.5 },
  )
  lula.add(manto)
  for (const side of [-1, 1]) {
    const nadadeira = sphere(0.26, SQUID_DARK, { roughness: 0.5 })
    nadadeira.scale.set(0.9, 0.55, 0.1)
    nadadeira.position.set(side * 0.24, 1.6, -0.02)
    nadadeira.rotation.z = side * 0.45
    lula.add(nadadeira)

    // olhos enormes e calmos, de pálpebra meio fechada
    const globo = sphere(0.18, SQUID, { roughness: 0.5 })
    globo.position.set(side * 0.21, 0.3, 0.2)
    lula.add(globo)
    const esclera = sphere(0.16, '#fffaf0', { roughness: 0.2 })
    esclera.position.set(side * 0.21, 0.3, 0.29)
    esclera.scale.z = 0.6
    lula.add(esclera)
    const pupila = sphere(0.085, '#1b1b24', { roughness: 0.2 })
    pupila.position.set(side * 0.2, 0.28, 0.37)
    pupila.scale.z = 0.6
    lula.add(pupila)
    const brilho = sphere(0.025, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.2 + 0.035, 0.31, 0.41)
    lula.add(brilho)
    const palpebra = sphere(0.168, SQUID_DARK, { roughness: 0.5 })
    palpebra.scale.set(1, 0.6, 0.66)
    palpebra.position.set(side * 0.21, 0.36, 0.29)
    palpebra.rotation.z = -side * 0.12
    lula.add(palpebra)
  }
  // pintinhas de cromatóforo no manto
  for (let k = 0; k < 9; k++) {
    const a = (rand() - 0.5) * 2.6
    const h = 0.55 + rand() * 0.9
    const rr = 0.44 - Math.max(0, h - 0.8) * 0.3
    const pinta = sphere(0.035 + rand() * 0.02, SQUID_SPOT, { roughness: 0.55 }, 12)
    pinta.position.set(Math.sin(a) * rr, h, Math.cos(a) * rr)
    pinta.scale.set(1, 1, 0.4)
    pinta.rotation.y = a
    lula.add(pinta)
  }

  // ---- avental branco amarrado no manto ---------------------------------------
  const avental = new THREE.Group()
  avental.position.copy(S)
  root.add(avental)
  const ARC = 2.0
  const pano = (rt: number, rb: number, h: number, y: number, arc: number, cor: string) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, 28, 1, true, -arc / 2, arc),
      mat(cor, { roughness: 0.9, size: 0.6 }),
    )
    ;(m.material as THREE.Material).side = THREE.DoubleSide
    m.castShadow = true
    m.receiveShadow = true
    m.position.y = y
    return m
  }
  avental.add(pano(0.462, 0.455, 0.42, 0.74, ARC, APRON)) // saia
  avental.add(pano(0.395, 0.44, 0.26, 1.08, ARC * 0.62, APRON)) // peitilho
  const cinta = torus(0.462, 0.028, APRON_TRIM, { roughness: 0.85 })
  cinta.rotation.x = Math.PI / 2
  cinta.position.y = 0.95
  avental.add(cinta)
  const barra = new THREE.Mesh(
    new THREE.TorusGeometry(0.458, 0.016, 8, 32, ARC),
    mat(APRON_TRIM, { roughness: 0.85 }),
  )
  barra.rotation.set(Math.PI / 2, 0, Math.PI / 2 - ARC / 2)
  barra.position.y = 0.53
  avental.add(barra)
  const bolso = rbox(0.24, 0.13, 0.03, 0.03, APRON_TRIM, { roughness: 0.85 })
  bolso.position.set(0, 0.7, 0.465)
  avental.add(bolso)
  const laco = puff(0.06, APRON_TRIM, 3, 7, { roughness: 0.85 })
  laco.position.set(0, 0.95, -0.48)
  avental.add(laco)

  // ---- braços que fazem o LUNG: um segura o pote, outro passa na testa --------
  const fwd = new THREE.Vector3(Math.sin(BOY_ROT), 0, Math.cos(BOY_ROT))
  const headY = BOY.y + SEAT + BOY_H * 0.52 + BOY_H * 0.19 * 0.85
  const testa = BOY.clone().setY(headY + 0.1).addScaledVector(fwd, 0.25)
  const bracoLung = new THREE.Group()
  bracoLung.position.copy(S)
  root.add(bracoLung)
  bracoLung.add(
    arm(
      [
        [S.x - 0.05, W + 0.12, S.z + 0.1],
        [S.x - 0.2, W + 0.15, S.z + 0.45],
        [S.x - 0.42, W + 0.55, S.z + 0.95],
        [testa.x + 0.55, testa.y + 0.3, testa.z - 0.05],
        [testa.x + 0.18, testa.y + 0.12, testa.z + 0.06],
        [testa.x + 0.03, testa.y, testa.z + 0.03],
      ],
      0.085,
      0.03,
      { dab: true },
    ),
  )
  bracoLung.add(
    arm(
      [
        [S.x - 0.1, W + 0.08, S.z + 0.1],
        [S.x - 0.25, W + 0.02, S.z + 0.42],
        [JAR.x + 0.12, JAR.y - 0.03, JAR.z - 0.45],
        [JAR.x + 0.05, JAR.y - 0.05, JAR.z - 0.05],
        [JAR.x - 0.2, JAR.y + 0.0, JAR.z + 0.08],
        [JAR.x - 0.25, JAR.y + 0.14, JAR.z + 0.05],
      ],
      0.09,
      0.03,
    ),
  )

  // ---- pote de LUNGUENTO (acento cobalto) -------------------------------------
  const pote = new THREE.Group()
  pote.position.copy(JAR)
  pote.rotation.y = 0.12
  root.add(pote)
  const JR = 0.2
  const JH = 0.2
  const vidro = lathe(
    [[0, 0], [JR * 0.9, 0], [JR, 0.03], [JR, JH - 0.02], [JR * 0.92, JH], [JR * 0.82, JH], [0, JH - 0.02]],
    PORCELAIN,
    { roughness: 0.25 },
  )
  pote.add(vidro)
  const creme = sphere(JR * 0.82, '#fdfcf8', { roughness: 0.4 })
  creme.scale.set(1, 0.22, 1)
  creme.position.y = JH - 0.01
  pote.add(creme)
  const faixa = cylinder(JR + 0.004, JR + 0.004, 0.02, ACCENT, { roughness: 0.35 })
  faixa.position.y = 0.03
  pote.add(faixa)
  const glyphs: ['L' | 'U' | 'N' | 'G', number][] = [['L', -0.48], ['U', -0.16], ['N', 0.16], ['G', 0.48]]
  for (const [gl, a] of glyphs) {
    const l = letter(gl)
    l.position.set(Math.sin(a) * (JR + 0.008), 0.115, Math.cos(a) * (JR + 0.008))
    l.rotation.y = a
    pote.add(l)
  }
  // tampa azul aberta, de pé atrás do pote
  const tampa = new THREE.Group()
  tampa.position.set(0.04, JH, -JR - 0.02)
  tampa.rotation.x = -2.55
  const disco = cylinder(JR + 0.015, JR + 0.015, 0.035, ACCENT, { roughness: 0.35 })
  disco.position.set(0, 0.025, JR + 0.02)
  tampa.add(disco)
  const aba = torus(JR + 0.02, 0.012, '#1650b4', { roughness: 0.35 })
  aba.rotation.x = Math.PI / 2
  aba.position.set(0, 0.0, JR + 0.02)
  tampa.add(aba)
  pote.add(tampa)

  // ---- os outros braços, abertos em leque (DÊ!) -------------------------------
  const bracos = new THREE.Group()
  bracos.position.copy(S)
  root.add(bracos)
  const P = (x: number, y: number, z: number): [number, number, number] => [x, y, z]
  // tentáculo 1: segura a prateleira de volta na parede
  bracos.add(arm([
    P(S.x - 0.15, W + 0.15, S.z + 0.05),
    P(S.x - 0.5, W + 0.3, S.z + 0.25),
    P(S.x - 0.9, W + 0.55, S.z + 0.2),
    P(SHELF.x + 0.25, SHELF.y - 0.3, SHELF.z + 0.12),
    P(SHELF.x - 0.05, SHELF.y - 0.1, SHELF.z + 0.05),
  ], 0.08, 0.035, { club: true }))
  // tentáculo 2: pendura a última panela no gancho
  bracos.add(arm([
    P(S.x + 0.15, W + 0.15, S.z + 0.05),
    P(S.x + 0.5, W + 0.3, S.z + 0.25),
    P(S.x + 0.95, W + 0.5, S.z + 0.25),
    P(1.6, RAIL_Y - 0.55, RAIL_Z + 0.25),
    P(1.68, RAIL_Y - 0.2, RAIL_Z + 0.08),
  ], 0.08, 0.032, { club: true }))
  // braço que equilibra a pilha de pratos
  bracos.add(arm([
    P(S.x + 0.12, W + 0.05, S.z + 0.12),
    P(S.x + 0.45, W + 0.0, S.z + 0.42),
    P(PLATES.x - 0.3, PLATES.y - 0.12, PLATES.z - 0.15),
    P(PLATES.x, PLATES.y - 0.06, PLATES.z),
    P(PLATES.x + 0.24, PLATES.y + 0.02, PLATES.z + 0.04),
    P(PLATES.x + 0.26, PLATES.y + 0.14, PLATES.z + 0.02),
  ], 0.09, 0.03))
  // braços que escorrem pela borda da pia, enrolando a ponta
  bracos.add(arm([
    P(S.x + 0.2, W + 0.05, S.z + 0.1),
    P(S.x + 0.42, W + 0.02, S.z + 0.42),
    P(S.x + 0.55, W - 0.25, S.z + 0.52),
    P(S.x + 0.52, W - 0.5, S.z + 0.56),
    P(S.x + 0.4, W - 0.48, S.z + 0.62),
  ], 0.085, 0.028))
  bracos.add(arm([
    P(S.x - 0.2, W + 0.05, S.z + 0.1),
    P(S.x - 0.5, W + 0.02, S.z + 0.35),
    P(S.x - 0.72, W - 0.2, S.z + 0.5),
    P(S.x - 0.78, W - 0.48, S.z + 0.55),
    P(S.x - 0.66, W - 0.56, S.z + 0.62),
  ], 0.085, 0.028))
  // braços que acenam no alto, de ponta enrolada
  bracos.add(arm([
    P(S.x + 0.22, W + 0.12, S.z),
    P(S.x + 0.6, W + 0.35, S.z + 0.05),
    P(S.x + 0.8, W + 0.85, S.z + 0.1),
    P(S.x + 0.72, W + 1.2, S.z + 0.15),
    P(S.x + 0.56, W + 1.18, S.z + 0.18),
    P(S.x + 0.6, W + 1.06, S.z + 0.2),
  ], 0.08, 0.026))
  bracos.add(arm([
    P(S.x - 0.22, W + 0.12, S.z),
    P(S.x - 0.6, W + 0.4, S.z + 0.05),
    P(S.x - 0.75, W + 0.95, S.z + 0.12),
    P(S.x - 0.62, W + 1.3, S.z + 0.15),
    P(S.x - 0.46, W + 1.26, S.z + 0.18),
    P(S.x - 0.5, W + 1.13, S.z + 0.2),
  ], 0.08, 0.026))
  // último braço deitado no tampo, à direita da cuba
  bracos.add(arm([
    P(S.x + 0.2, W + 0.05, S.z - 0.1),
    P(S.x + 0.6, W - 0.05, S.z - 0.2),
    P(S.x + 0.85, CAB_TOP + 0.06, S.z - 0.05),
    P(S.x + 0.9, CAB_TOP + 0.05, S.z + 0.25),
    P(S.x + 0.78, CAB_TOP + 0.05, S.z + 0.32),
  ], 0.08, 0.026))

  // ---- prateleira de volta na parede ------------------------------------------
  const prateleira = new THREE.Group()
  prateleira.position.copy(SHELF)
  root.add(prateleira)
  const tabua = rbox(1.0, 0.06, 0.3, 0.02, WOOD, { roughness: 0.6 })
  prateleira.add(tabua)
  const potes: [number, number, string][] = [[-0.36, 0.11, '#c25b3a'], [-0.18, 0.13, '#d9a441'], [0.0, 0.1, '#6f8f5a']]
  for (const [px, ph, cor] of potes) {
    const vidrinho = lathe(
      [[0, 0], [0.06, 0], [0.065, 0.02], [0.065, ph], [0.05, ph + 0.01], [0, ph + 0.01]],
      '#e9e4d8',
      { roughness: 0.3 },
    )
    vidrinho.position.set(px, 0.03, 0)
    prateleira.add(vidrinho)
    const tampinha = cylinder(0.055, 0.055, 0.035, cor, { roughness: 0.5 })
    tampinha.position.set(px, 0.03 + ph + 0.025, 0)
    prateleira.add(tampinha)
  }
  const caneca = lathe(
    [[0, 0], [0.075, 0], [0.08, 0.02], [0.078, 0.15], [0.068, 0.15], [0.068, 0.02], [0, 0.02]],
    TILE_B,
    { roughness: 0.35 },
  )
  caneca.position.set(0.3, 0.03, 0)
  const alca = torus(0.045, 0.013, TILE_B, { roughness: 0.35 })
  alca.position.set(0.1, 0.085, 0)
  caneca.add(alca)
  prateleira.add(caneca)

  // ---- três panelas penduradas nos ganchos ------------------------------------
  // a peça gira em torno do meio do trilho: as panelas brotam dele e balançam
  const panelas = new THREE.Group()
  panelas.position.set(1.3, RAIL_Y, RAIL_Z)
  root.add(panelas)
  // pendurada pelo furo do cabo: cabo para cima, boca para a câmera, fundo na parede
  const hang = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 0),
  )
  for (const [hx, r, h] of [[0.95, 0.15, 0.2], [1.3, 0.13, 0.17], [1.65, 0.12, 0.15]] as const) {
    const p = pan(r, h)
    p.quaternion.setFromRotationMatrix(hang)
    p.position.set(hx - 1.3, -0.05 - (r + 0.28), -h * 0.85)
    panelas.add(p)
  }

  // ---- pilha de pratos equilibrada na ponta de um braço -----------------------
  const pratos = new THREE.Group()
  pratos.position.copy(PLATES)
  root.add(pratos)
  for (let k = 0; k < 6; k++) {
    const pr = plate(0.19)
    pr.position.y = k * 0.034
    pr.rotation.y = rand() * Math.PI
    pratos.add(pr)
  }

  // ---- peças ------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cozinha', object: base },
    { name: 'parede', group: 'cozinha', object: parede },
    { name: 'pia', group: 'cozinha', object: pia },
    { name: 'bagunca', group: 'desastre', object: bagunca },
    { name: 'rapaz', group: 'rapaz', object: rapaz },
    { name: 'maoRapaz', group: 'rapaz', object: maoRapaz },
    { name: 'lula', group: 'lula', object: lula },
    { name: 'avental', group: 'lula', object: avental },
    { name: 'bracoLung', group: 'lung', object: bracoLung },
    { name: 'pote', group: 'lung', object: pote },
    { name: 'bracos', group: 'de', object: bracos },
    { name: 'prateleira', group: 'desastre', object: prateleira },
    { name: 'panelas', group: 'ordnar', object: panelas },
    { name: 'pratos', group: 'ordnar', object: pratos },
  ]

  const grow = (from = 0.05) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ---------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: "Dia de visita: uma cozinha de piso xadrez, pia funda cheia d'água…",
    }),
    seq('parede-rise', 'parede', 0.35, 0.8, [riseFrom(0, 2.8)], { ease: 'easeOut' }),
    seq('pia-rise', 'pia', 0.55, 0.8, [riseFrom(0, 1.2)], { ease: 'easeOut' }),

    seq('bagunca-cai', 'bagunca', 1.8, 0.55, [ch('position.y', 1.4, 0), ch('rotation.y', 0.5, 0)], {
      ease: 'easeIn',
      caption: '…e tudo desaba: a prateleira cai, panelas e pratos rolam pelo chão.',
    }),

    seq('prateleira-despenca', 'prateleira', 1.8, 0.55, [
      ch('position.x', SHELF.x, FALL.x),
      ch('position.y', SHELF.y, FALL.y),
      ch('position.z', SHELF.z, FALL.z),
      ch('rotation.z', 0, FALL_ROT),
    ], { ease: 'easeIn' }),

    seq('rapaz-rise', 'rapaz', 3.1, 0.7, [riseFrom(GY, 1.0)], {
      ease: 'easeOut',
      caption: 'O dono da casa senta no banquinho, de mãos na cabeça.',
    }),
    seq('mao-na-cabeca', 'maoRapaz', 3.1, 0.7, [ch('rotation.x', -0.2, -0.2), ch('rotation.z', 2.75, 2.75)]),

    seq('lula-sobe', 'lula', 4.5, 1.1, [riseFrom(S.y, 2.3)], {
      ease: 'easeOut',
      caption: "Da pia cheia d'água sobe a lula gigante, de avental, com o olhar mais calmo do mundo.",
    }),
    seq('avental-sobe', 'avental', 4.5, 1.1, [riseFrom(S.y, 2.3)], { ease: 'easeOut' }),

    seq('pote-surge', 'pote', 6.2, 0.5, grow(0.01), {
      ease: 'easeOut',
      caption: 'Ela molha a ponta de um braço no pote de LUNGUENTO e passa na testa dele: LUNG!',
    }),
    seq('bracoLung-estica', 'bracoLung', 6.3, 0.9, grow(), { ease: 'easeOut' }),
    seq('mao-desce', 'maoRapaz', 7.3, 0.6, [ch('rotation.x', -0.2, MAO_FIM_X), ch('rotation.z', 2.75, MAO_FIM_Z)], {
      caption: 'Ele respira fundo e baixa as mãos.',
    }),

    seq('bracos-abrem', 'bracos', 8.3, 0.9, grow(), {
      ease: 'easeOut',
      caption: 'Aí ela abre os dez braços: DÊ!',
    }),

    seq('prateleira-volta', 'prateleira', 9.5, 0.7, [
      ch('position.x', FALL.x, SHELF.x),
      ch('position.y', FALL.y, SHELF.y),
      ch('position.z', FALL.z, SHELF.z),
      ch('rotation.z', FALL_ROT, 0),
    ], {
      ease: 'easeOut',
      caption: 'Prateleira de volta na parede, panelas nos ganchos, pratos empilhados: ÔÔR-D\'NAR… SÊI!',
    }),
    seq('panelas-penduram', 'panelas', 9.8, 0.8, [...grow(), ch('rotation.z', 0.5, 0)], { ease: 'easeOut' }),
    seq('pratos-empilham', 'pratos', 10.1, 0.6, [ch('scale.y', 0.05, 1), ch('position.y', PLATES.y + 0.4, PLATES.y)], {
      ease: 'easeOut',
    }),

    seq('pote-pulsa', 'pote', 11.4, 0.25, [ch('scale.x', 1, 1.15), ch('scale.y', 1, 1.15), ch('scale.z', 1, 1.15)], {
      ease: 'easeOut',
      caption: 'Lugn, det ordnar sig. — Calma, vai dar tudo certo.',
    }),
    seq('pote-assenta', 'pote', 11.65, 0.3, [ch('scale.x', 1.15, 1), ch('scale.y', 1.15, 1), ch('scale.z', 1.15, 1)], {
      ease: 'easeInOut',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.6, 5.4], target: [0.05, 1.45, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'lugn-det-ordnar-sig',
    contexto:
      "Imprevistos: pra acalmar alguém, ou a si mesmo, quando algo dá errado — o ônibus não veio, o trem foi cancelado, o papel do Migrationsverket atrasou, a criança perdeu a luva no inverno. Também aparece como 'Ta det lugnt, det ordnar sig' (relaxa, isso se ajeita).",
    fraseFonte: 'Calma, vai dar tudo certo.',
    fraseAlvo: 'Lugn, det ordnar sig.',
    pronuncia:
      "LÚNGN, dê ÔÔD-nar sêi ('lugn' é uma sílaba só: L, um U curto de lábios redondos, puxando de leve pro Ö, e o GN não é 'gui-ne': a língua sobe no fundo da boca (o NG de 'manga' sem soltar o G) e fecha num N; 'det' = dê; 'ordnar' com a força no OR, que é Ô FECHADO e LONGO (é o som do å longo, apesar de escrito com O), e o RD sai junto: um D só, com a ponta da língua virada pra trás, sem R separado; o -nar é fraco, com R brando; 'sig' = SÊI, como 'mig' (MÊI) e 'dig' (DÊI); na fala rápida, o R de 'ordnar' encosta no S de 'sig' e os dois viram um X: ÔÔD-na-xêi)",
    ponteSonora:
      "LUNG(uento)! DÊ... ÔÔR-D'NAR... SÊI! (5 sílabas: LÚNGN-dê-ÔÔD-nar-sêi; força no LUNG e, a maior, no ÔÔR; LUNG = o começo do LUNGUENTO, o unguento de lula da receita dela: L + o UNG de 'unguento', com a língua subindo no fundo da boca no NG, SEM soltar o G nem o '-guento', e fechando num N de nariz: 'lungn', uma sílaba só, com o U curto e de lábios redondos. É parente do UNTA de 'Det är lugnt' (lá ele UNTA, aqui é o UNGUENTO), porque é a mesma palavra 'lugn', calma; DÊ = o 'det' de sempre, Ê fechado e sem T; ÔÔR-D'NAR = ORDENAR engolindo o E do meio, e é a mesma palavra: 'ordna' é pôr em ordem. Mas a força MUDA de lugar: em vez do NAR do português, ela cai no ÔÔR, comprido e de Ô FECHADO (o å longo, apesar de escrito com O), e o R mal soa: a língua vira pra trás e já bate no D; NAR fraco, R de um toque só; SÊI = 'sei', o mesmo molde de MÊI ('mig') e DÊI ('dig'), e 'ordnar sig' é ORDENAR-SE: 'det ordnar sig' = isso se ordena sozinho. Na fala rápida, o R do NAR encosta no S e sai um X: ÔÔD-na-XÊI)",
    historia:
      "Dia de visita, e a cozinha desaba: a prateleira despenca da parede, as panelas rolam pelo chão, os pratos se espalham, e o dono da casa senta num banquinho, de mãos na cabeça. Da pia cheia d'água sobe a lula gigante, de avental, enfia a ponta de um braço no seu pote de remédio pra tudo, o LUNGUENTO, e passa na testa dele: 'LUNG!'. Ele respira fundo. Aí ela abre os dez braços, 'DÊ!', e de uma vez só põe a prateleira de volta, pendura as panelas e empilha os pratos, cantarolando: 'ÔÔR-D'NAR... SÊI!'. Num minuto a bagunça se ordena sozinha: lugn, det ordnar sig.",
  },
  createScene,
  refine: { organic: ['lula'] },
}

export default card
