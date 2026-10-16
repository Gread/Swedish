import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag hör dig inte." — IÁ… RRÖR! DÊI… ÍNTE(gra)!
 *
 * No alto da catedral, em pleno temporal, a gárgula de pedra atende o
 * telefone do campanário. Ela é calha: a chuva entra pela nuca e sai
 * gargarejando pela boca escancarada — RRÖÖR, que HORROR! — e a voz do outro
 * lado se afoga. Ela aperta o fone numa orelha e dá um tapa na outra (DEI
 * tapa!), como quem tira água do ouvido — mas a orelha é de pedra ÍNTEgra,
 * maciça, sem furo: não sai água e não entra voz.
 *
 * Diorama: telhado de ardósia molhada, parapeito gótico de rosáceas cegas
 * atravessando o disco, pináculo à direita; a gárgula agachada no centro da
 * beira, asas de morcego abertas, o fio d'água (acento azul) caindo da boca
 * até a poça; telefone preto à esquerda com o fio espiral subindo ao fone.
 */

const SLATE = '#3c4452'
const SLATE_LIGHT = '#475162'
const SLATE_DARK = '#313845'
const PUDDLE = '#5c7590'
const WALL = '#686b72'
const WALL_DARK = '#4f525a'
const COPING = '#7a7d84'
const PIN = '#81848b'
const PIN_DARK = '#5d6068'
const MOSS = '#55703a'
const STONE = '#a7a196'       // a gárgula: pedra clara e quente
const STONE_DARK = '#857f75'
const STONE_LIGHT = '#bcb6aa'
const WING = '#5f5b55'
const WING_BONE = '#88837a'
const CLAW = '#5e5a54'
const MOUTH = '#2a2124'
const FANG = '#e2dccd'
const PHONE = '#1c1d22'
const CREAM = '#ece4d2'
const RING = '#d6dae1'
const RAIN = '#a8d2ef'
const WATER = '#1fa2f2'       // acento saturado RESERVADO: o fio d'água do gargarejo

const GY = 0.14               // topo do telhado
const WALL_TOP = 0.62
const PY = 0.72               // topo da cimalha do parapeito (onde a gárgula pisa)
const PZ = 0.12               // centro do parapeito em z
const COPE_FRONT = PZ + 0.37  // beira da cimalha
const G = new THREE.Vector3(0.0, PY, 0.08) // origem da gárgula

const ARM_REST = 1.3          // braço em repouso: pata sobre o joelho (rotation.x)
const SLAP_OUT = -0.75        // braço armado para o tapa (rotation.z)
const HEAD_TILT = 0.1

const UP = new THREE.Vector3(0, 1, 0)
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b: ossos, membros, cauda, dedos. */
function bone(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: { roughness?: number }) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = Math.max(0.001, dir.length())
  const m = capsule(r, len, color, { roughness: 0.9, ...opts })
  m.position.copy(a).addScaledVector(dir, 0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/** Orientação a partir de dois eixos (y manda, x é corrigido). */
function basis(xGuess: THREE.Vector3, y: THREE.Vector3) {
  const Y = y.clone().normalize()
  const Z = new THREE.Vector3().crossVectors(xGuess, Y).normalize()
  const X = new THREE.Vector3().crossVectors(Y, Z).normalize()
  return {
    X, Y, Z,
    q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)),
  }
}

/** Arco aberto de som, de frente para a câmera. */
function arc(r: number, tube: number, span: number, color: string) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 36, span), mat(color, { roughness: 0.5 }))
  m.castShadow = true
  return m
}

/** Asa de morcego de pedra: membrana recortada em arcos + ossos dos dedos. */
function makeWing(side: 1 | -1) {
  const g = new THREE.Group()
  const p = (x: number, y: number) => new THREE.Vector2(side * x, y)
  const O = p(0, 0)
  const W = p(0.52, 0.5)
  const F1 = p(1.0, 0.76)
  const F2 = p(1.14, 0.3)
  const F3 = p(0.94, -0.16)
  const T = p(0.2, -0.24)

  const s = new THREE.Shape()
  s.moveTo(O.x, O.y + 0.05)
  s.lineTo(W.x, W.y + 0.05)
  s.lineTo(F1.x, F1.y)
  s.quadraticCurveTo(side * 0.86, 0.52, F2.x, F2.y)
  s.quadraticCurveTo(side * 0.8, 0.1, F3.x, F3.y)
  s.quadraticCurveTo(side * 0.52, 0.0, T.x, T.y)
  s.lineTo(O.x, O.y - 0.04)
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 14,
  })
  geo.translate(0, 0, -0.015)
  const membrane = new THREE.Mesh(geo, mat(WING, { roughness: 0.85, size: 1 }))
  membrane.castShadow = true
  membrane.receiveShadow = true
  g.add(membrane)

  const v3 = (q: THREE.Vector2) => v(q.x, q.y, 0.03)
  g.add(bone(v3(O), v3(W), 0.05, WING_BONE))
  g.add(bone(v3(W), v3(F1), 0.032, WING_BONE))
  g.add(bone(v3(W), v3(F2), 0.03, WING_BONE))
  g.add(bone(v3(W), v3(F3), 0.028, WING_BONE))
  const knuckle = sphere(0.06, WING_BONE, { roughness: 0.9 })
  knuckle.position.copy(v3(W))
  g.add(knuckle)
  const hook = cone(0.03, 0.12, CLAW, { roughness: 0.6 })
  hook.position.set(W.x - side * 0.04, W.y + 0.1, 0.03)
  hook.rotation.z = side * 0.5
  g.add(hook)
  for (const F of [F1, F2, F3]) {
    const tip = cone(0.022, 0.07, CLAW, { roughness: 0.6 })
    const d = new THREE.Vector2().subVectors(F, W).normalize()
    tip.position.set(F.x + d.x * 0.03, F.y + d.y * 0.03, 0.03)
    tip.rotation.z = Math.atan2(d.y, d.x) - Math.PI / 2
    g.add(tip)
  }
  return g
}

/** Lâmina de orelha pontuda (folha em pé no plano xy), engrossada com chanfro. */
function leaf(k: number, depth: number, bevel: number) {
  const s = new THREE.Shape()
  s.moveTo(-0.13 * k, 0)
  s.quadraticCurveTo(-0.23 * k, 0.27 * k, 0.03 * k, 0.64 * k)
  s.quadraticCurveTo(0.18 * k, 0.28 * k, 0.13 * k, 0)
  s.quadraticCurveTo(0, -0.05 * k, -0.13 * k, 0)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 18,
  })
  geo.translate(0, 0, -depth / 2)
  return geo
}

/** Pata espalmada: palma achatada (normal = +z local), dedos em leque para +y. */
function openPaw() {
  const g = new THREE.Group()
  const palm = sphere(0.1, STONE, { roughness: 0.9 })
  palm.scale.set(1.1, 1.05, 0.5)
  g.add(palm)
  for (let i = 0; i < 4; i++) {
    const a = -0.72 + i * 0.44
    const base = v(Math.sin(a) * 0.07, Math.cos(a) * 0.08, 0)
    const tipP = v(Math.sin(a) * 0.19, Math.cos(a) * 0.2, -0.01)
    g.add(bone(base, tipP, 0.036, STONE))
    const claw = cone(0.024, 0.075, CLAW, { roughness: 0.6 })
    claw.position.copy(tipP).add(v(Math.sin(a) * 0.045, Math.cos(a) * 0.045, -0.01))
    claw.rotation.z = -a
    g.add(claw)
  }
  // polegar aberto, para baixo e para fora
  const thumbTip = v(0.17, -0.07, -0.01)
  g.add(bone(v(0.07, -0.03, 0), thumbTip, 0.03, STONE))
  const thumbClaw = cone(0.022, 0.065, CLAW, { roughness: 0.6 })
  thumbClaw.position.copy(thumbTip).add(v(0.04, -0.015, 0))
  thumbClaw.rotation.z = -Math.PI / 2 - 0.35
  g.add(thumbClaw)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- telhado de ardósia molhada + parapeito gótico -----------------------
  const base = new THREE.Group()

  const disk = cylinder(2.62, 2.7, 0.14, SLATE_DARK, { roughness: 0.6 })
  disk.position.y = 0.07
  base.add(disk)

  // lajes de ardósia: placas levemente desencontradas
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      const x = i * 0.6 + (j % 2 === 0 ? 0 : 0.3)
      const z = j * 0.6
      if (Math.hypot(x, z) > 2.25) continue
      const shade = [SLATE, SLATE_LIGHT, SLATE][Math.floor(rand() * 3)]
      const laje = rbox(0.56, 0.02, 0.56, 0.01, shade, { roughness: 0.4 })
      laje.position.set(x, GY + 0.005 + rand() * 0.008, z)
      laje.rotation.y = (rand() - 0.5) * 0.06
      base.add(laje)
    }
  }

  // poças: espelhos d'água rasos
  for (const [x, z, sx, sz] of [[-1.45, 1.25, 0.42, 0.26], [1.35, 1.45, 0.3, 0.2], [1.75, -0.95, 0.26, 0.18]] as const) {
    const poca = cylinder(1, 1, 0.012, PUDDLE, { roughness: 0.06, metalness: 0.2, detail: 0 })
    poca.scale.set(sx, 1, sz)
    poca.position.set(x, GY + 0.026, z)
    base.add(poca)
  }

  // o muro do parapeito
  const wall = rbox(3.6, WALL_TOP - GY, 0.6, 0.03, WALL, { roughness: 0.85 })
  wall.position.set(0, (WALL_TOP + GY) / 2, PZ)
  base.add(wall)
  // fiadas de pedra
  for (const y of [0.3, 0.46]) {
    const fiada = rbox(3.62, 0.018, 0.62, 0.008, WALL_DARK, { roughness: 0.9 })
    fiada.position.set(0, y, PZ)
    base.add(fiada)
  }
  // cimalha que pinga para fora
  const cope = rbox(3.72, PY - WALL_TOP, 0.74, 0.03, COPING, { roughness: 0.45 }) // pedra molhada
  cope.position.set(0, (PY + WALL_TOP) / 2, PZ)
  base.add(cope)

  // rosáceas cegas (quadrifólios) na face do muro
  for (const x of [-1.35, -0.68, 0.68, 1.35]) {
    const ros = new THREE.Group()
    ros.position.set(x, (WALL_TOP + GY) / 2 + 0.01, PZ + 0.3)
    const fundo = cylinder(0.15, 0.15, 0.02, WALL_DARK, { roughness: 0.9 })
    fundo.rotation.x = Math.PI / 2
    ros.add(fundo)
    const aro = torus(0.155, 0.024, COPING, { roughness: 0.8 })
    aro.position.z = 0.012
    ros.add(aro)
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + Math.PI / 4
      const lobo = torus(0.052, 0.014, COPING, { roughness: 0.8 })
      lobo.position.set(Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0.014)
      ros.add(lobo)
    }
    base.add(ros)
  }

  // tufos de musgo no pé do muro
  for (const [x, z, r, s] of [[-1.62, 0.5, 0.09, 3], [1.1, 0.48, 0.07, 4], [-0.42, 0.47, 0.06, 5]] as const) {
    const tufo = puff(r, MOSS, 4, s, { roughness: 0.95 })
    tufo.position.set(x, GY + r * 0.5, z)
    tufo.scale.y = 0.6
    base.add(tufo)
  }
  root.add(base)

  // ---- pináculo gótico à direita -------------------------------------------
  const pinaculo = new THREE.Group()
  pinaculo.position.set(1.48, PY, 0.05)
  root.add(pinaculo)

  const plinto = rbox(0.52, 0.1, 0.52, 0.02, PIN_DARK, { roughness: 0.8 })
  plinto.position.y = 0.05
  pinaculo.add(plinto)
  const fuste = rbox(0.4, 0.7, 0.4, 0.025, PIN, { roughness: 0.8 })
  fuste.position.y = 0.45
  pinaculo.add(fuste)
  // lancetas cegas em cada face
  for (let k = 0; k < 4; k++) {
    const face = new THREE.Group()
    face.rotation.y = (k * Math.PI) / 2
    const lanceta = rbox(0.13, 0.36, 0.03, 0.02, PIN_DARK, { roughness: 0.9 })
    lanceta.position.set(0, 0.42, 0.2)
    face.add(lanceta)
    const ogiva = cone(0.068, 0.12, PIN_DARK, { roughness: 0.9 }, 4)
    ogiva.rotation.y = Math.PI / 4
    ogiva.scale.z = 0.3
    ogiva.position.set(0, 0.64, 0.2)
    face.add(ogiva)
    pinaculo.add(face)
  }
  const cornija = rbox(0.48, 0.06, 0.48, 0.02, PIN_DARK, { roughness: 0.8 })
  cornija.position.y = 0.82
  pinaculo.add(cornija)
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const torreta = cone(0.045, 0.2, PIN, { roughness: 0.8 }, 4)
    torreta.position.set(sx * 0.2, 0.95, sz * 0.2)
    pinaculo.add(torreta)
  }
  const flecha = cone(0.26, 0.95, PIN, { roughness: 0.8 }, 4)
  flecha.rotation.y = Math.PI / 4
  flecha.position.y = 0.85 + 0.475
  pinaculo.add(flecha)
  // crochês ao longo das arestas da flecha
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2
    for (const t of [0.22, 0.48, 0.72]) {
      const croche = sphere(0.04, PIN, { roughness: 0.8 })
      const r = 0.26 * (1 - t) + 0.02
      croche.position.set(Math.cos(a) * r, 0.85 + t * 0.95, Math.sin(a) * r)
      pinaculo.add(croche)
    }
  }
  const remate = sphere(0.055, PIN, { roughness: 0.8 })
  remate.position.y = 1.84
  pinaculo.add(remate)
  const flor = cone(0.035, 0.12, PIN, { roughness: 0.8 })
  flor.position.y = 1.93
  pinaculo.add(flor)

  // ---- a gárgula: corpo agachado, pernas, cauda -----------------------------
  const gargula = new THREE.Group()
  gargula.position.copy(G)
  root.add(gargula)

  const quadril = sphere(0.3, STONE, { roughness: 0.9 })
  quadril.scale.set(1.15, 0.85, 1.0)
  quadril.position.set(0, 0.3, -0.12)
  gargula.add(quadril)
  gargula.add(bone(v(0, 0.42, -0.1), v(0, 0.84, 0.03), 0.26, STONE))
  const peito = sphere(0.27, STONE, { roughness: 0.9 })
  peito.scale.set(1.18, 0.95, 0.92)
  peito.position.set(0, 0.86, 0.05)
  gargula.add(peito)
  // placas da barriga
  for (const [y, z, w] of [[0.5, 0.17, 0.17], [0.62, 0.2, 0.2], [0.74, 0.23, 0.21]] as const) {
    const placa = capsule(0.035, w, STONE_LIGHT, { roughness: 0.9 })
    placa.rotation.z = Math.PI / 2
    placa.position.set(0, y, z)
    gargula.add(placa)
  }
  for (const sx of [-1, 1]) {
    const ombro = sphere(0.14, STONE, { roughness: 0.9 })
    ombro.position.set(sx * 0.3, 0.96, -0.01)
    gargula.add(ombro)
  }
  gargula.add(bone(v(0, 0.92, 0.02), v(0, 1.12, 0.2), 0.13, STONE))

  for (const sx of [-1, 1]) {
    const hip = v(sx * 0.2, 0.3, -0.05)
    const knee = v(sx * 0.33, 0.56, 0.27)
    const ankle = v(sx * 0.3, 0.12, 0.26)
    gargula.add(bone(hip, knee, 0.145, STONE))
    const joelho = sphere(0.13, STONE, { roughness: 0.9 })
    joelho.position.copy(knee)
    gargula.add(joelho)
    gargula.add(bone(knee, ankle, 0.105, STONE))
    const pe = sphere(0.14, STONE, { roughness: 0.9 })
    pe.scale.set(1.0, 0.5, 1.35)
    pe.position.set(sx * 0.3, 0.07, 0.31)
    gargula.add(pe)
    // dedos agarrados na beira da cimalha, garras para baixo
    for (const dx of [-0.08, 0, 0.08]) {
      const a = v(sx * 0.3 + dx, 0.07, 0.38)
      const b = v(sx * 0.3 + dx * 1.25, 0.05, COPE_FRONT - G.z + 0.03)
      gargula.add(bone(a, b, 0.035, STONE))
      const garra = cone(0.026, 0.09, CLAW, { roughness: 0.6 })
      garra.position.set(b.x, b.y - 0.06, b.z + 0.03)
      garra.rotation.x = Math.PI - 0.25
      gargula.add(garra)
    }
  }

  // cauda serpenteando sobre a cimalha, ponta de flecha
  const cauda = [v(0.05, 0.14, -0.32), v(0.38, 0.06, -0.3), v(0.72, 0.06, -0.2), v(0.98, 0.07, 0.02)]
  for (let i = 0; i < cauda.length - 1; i++) {
    gargula.add(bone(cauda[i], cauda[i + 1], 0.075 - i * 0.015, STONE))
  }
  const ponta = cone(0.09, 0.2, STONE_DARK, { roughness: 0.85 })
  ponta.scale.z = 0.35
  ponta.position.set(1.08, 0.09, 0.13)
  ponta.rotation.set(-Math.PI / 2, 0, 0)
  ponta.rotation.order = 'YXZ'
  ponta.rotation.y = -0.75
  gargula.add(ponta)

  // ---- asas de morcego abertas atrás das costas ----------------------------
  const asas = new THREE.Group()
  asas.position.set(0, 0.92, -0.22)
  gargula.add(asas)
  for (const side of [1, -1] as const) {
    const w = makeWing(side)
    w.position.x = side * 0.14
    w.rotation.order = 'YXZ'
    w.rotation.y = side * 0.5
    w.rotation.z = side * 0.08
    asas.add(w)
  }

  // ---- cabeça: chifres, olhos esbugalhados, boca escancarada ----------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.2, 0.3)
  cabeca.rotation.z = HEAD_TILT
  gargula.add(cabeca)

  const cranio = sphere(0.27, STONE, { roughness: 0.9 })
  cranio.scale.set(1.1, 0.95, 1.0)
  cranio.position.set(0, 0.02, -0.02)
  cabeca.add(cranio)
  for (const sx of [-1, 1]) {
    const bochecha = sphere(0.12, STONE, { roughness: 0.9 })
    bochecha.position.set(sx * 0.17, -0.1, 0.12)
    cabeca.add(bochecha)
  }
  const focinho = sphere(0.16, STONE, { roughness: 0.9 })
  focinho.scale.set(1.15, 0.62, 1.15)
  focinho.position.set(0, -0.04, 0.24)
  cabeca.add(focinho)
  const nariz = sphere(0.06, STONE_DARK, { roughness: 0.85 })
  nariz.scale.set(1.4, 0.7, 1.0)
  nariz.position.set(0, 0.0, 0.41)
  cabeca.add(nariz)
  for (const sx of [-1, 1]) {
    const narina = sphere(0.022, MOUTH, { roughness: 0.6 })
    narina.position.set(sx * 0.036, -0.005, 0.455)
    cabeca.add(narina)
  }
  const boca = sphere(0.14, MOUTH, { roughness: 0.6 })
  boca.scale.set(1.1, 1.0, 0.85)
  boca.position.set(0, -0.17, 0.25)
  cabeca.add(boca)
  const queixo = sphere(0.14, STONE, { roughness: 0.9 })
  queixo.scale.set(1.08, 0.5, 1.2)
  queixo.position.set(0, -0.36, 0.18)
  cabeca.add(queixo)
  for (const sx of [-1, 1]) {
    const presaCima = cone(0.03, 0.1, FANG, { roughness: 0.4 })
    presaCima.rotation.x = Math.PI
    presaCima.position.set(sx * 0.1, -0.17, 0.37)
    cabeca.add(presaCima)
    const presaBaixo = cone(0.026, 0.08, FANG, { roughness: 0.4 })
    presaBaixo.position.set(sx * 0.08, -0.27, 0.32)
    cabeca.add(presaBaixo)

    // olhos esbugalhados de horror: esclera grande, pupila minúscula, aro de pedra
    const olho = sphere(0.085, '#f4f1e8', { roughness: 0.25 })
    olho.scale.z = 0.8
    olho.position.set(sx * 0.11, 0.08, 0.2)
    cabeca.add(olho)
    const pupila = sphere(0.026, '#151515', { roughness: 0.2 })
    pupila.position.set(sx * 0.11, 0.08, 0.27)
    cabeca.add(pupila)
    const aro = torus(0.088, 0.02, STONE_DARK, { roughness: 0.9 })
    aro.position.set(sx * 0.11, 0.08, 0.215)
    cabeca.add(aro)
    // sobrancelhas de medo: ponta de dentro levantada
    cabeca.add(bone(v(sx * 0.22, 0.18, 0.16), v(sx * 0.06, 0.25, 0.22), 0.034, STONE_DARK))

    // chifres curtos e anelados
    const chifre = new THREE.Group()
    chifre.position.set(sx * 0.1, 0.24, -0.08)
    chifre.rotation.set(-0.7, 0, -sx * 0.3)
    const corno = cone(0.055, 0.2, STONE_DARK, { roughness: 0.8 })
    corno.position.y = 0.09
    chifre.add(corno)
    for (const y of [0.02, 0.07]) {
      const anel = torus(0.05 - y * 0.25, 0.012, STONE_DARK, { roughness: 0.8 })
      anel.rotation.x = Math.PI / 2
      anel.position.y = y
      chifre.add(anel)
    }
    cabeca.add(chifre)
  }

  // ---- orelhas grandes e pontudas de pedra MACIÇA ---------------------------
  const orelhas = new THREE.Group()
  cabeca.add(orelhas)
  const EAR_A = 0.6 // inclinação a partir da vertical
  for (const sx of [-1, 1]) {
    const orelha = new THREE.Group()
    orelha.position.set(sx * 0.25, 0.05, -0.04)
    orelha.rotation.order = 'YXZ'
    orelha.rotation.y = sx * 0.3
    orelha.rotation.x = -0.12
    orelha.rotation.z = -sx * EAR_A
    const lamina = new THREE.Mesh(leaf(1, 0.05, 0.026), mat(STONE, { roughness: 0.85, size: 0.6 }))
    lamina.castShadow = true
    lamina.receiveShadow = true
    orelha.add(lamina)
    // miolo cheio: relevo convexo de pedra onde deveria haver o buraco
    const miolo = new THREE.Mesh(leaf(0.58, 0.03, 0.016), mat(STONE_LIGHT, { roughness: 0.85, size: 0.4 }))
    miolo.position.set(0, 0.07, 0.05)
    miolo.castShadow = true
    orelha.add(miolo)
    orelhas.add(orelha)
  }

  // pontos de referência no espaço da gárgula
  root.updateMatrixWorld(true)
  const inG = (obj: THREE.Object3D, p: THREE.Vector3) =>
    gargula.worldToLocal(obj.localToWorld(p.clone()))
  const earDir = (sx: number) => {
    const o = orelhas.children[sx < 0 ? 0 : 1]
    const a = inG(o, v(0, 0, 0))
    const b = inG(o, v(0, 1, 0))
    return { root: a, dir: b.sub(a).normalize(), normal: inG(o, v(0, 0, 1)).sub(a).normalize() }
  }
  const earR = earDir(-1)
  const earL = earDir(1)
  const mouthG = inG(cabeca, v(0, -0.2, 0.38))

  // ---- fio d'água: sai da boca, faz a curva e despenca até a poça -----------
  const agua = new THREE.Group()
  agua.position.copy(mouthG)
  gargula.add(agua)
  const dropH = mouthG.y + G.y - GY
  const jato = new THREE.CatmullRomCurve3([
    v(0, 0.02, -0.06), v(0, -0.01, 0.06), v(0, -0.1, 0.12), v(0.01, -0.3, 0.14), v(-0.012, -dropH * 0.35, 0.135),
    v(0.012, -dropH * 0.65, 0.125), v(0, -dropH + 0.02, 0.12),
  ])
  const fio = new THREE.Mesh(new THREE.TubeGeometry(jato, 80, 0.05, 14, false), mat(WATER, { roughness: 0.08, detail: 0 }))
  fio.castShadow = true
  agua.add(fio)
  for (const [x, y, z, r] of [[0.06, -0.02, 0.08, 0.035], [-0.05, 0.02, 0.07, 0.028], [0.0, 0.05, 0.1, 0.022]] as const) {
    const bolha = sphere(r, '#d7efff', { roughness: 0.1, detail: 0 })
    bolha.position.set(x, y, z)
    agua.add(bolha)
  }
  // poça e coroa de respingos no chão
  const poca = cylinder(0.3, 0.3, 0.012, WATER, { roughness: 0.06, detail: 0 })
  poca.scale.z = 0.7
  poca.position.set(0, -dropH + 0.012, 0.12)
  agua.add(poca)
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.3
    const gota = sphere(0.028, WATER, { roughness: 0.08, detail: 0 })
    gota.position.set(Math.cos(a) * 0.13, -dropH + 0.07 + (k % 2) * 0.04, 0.12 + Math.sin(a) * 0.09)
    agua.add(gota)
  }

  // ---- braço do fone (direito da gárgula, esquerda da câmera) ---------------
  // fone encostado na raiz da orelha direita, descendo até o canto da boca
  const earEnd = earR.root.clone().add(v(-0.1, -0.03, 0.05))
  const mouthEnd = v(-0.26, 0.86, 0.52)
  const foneAxes = basis(v(1, 0, 0.1), new THREE.Vector3().subVectors(earEnd, mouthEnd))
  const foneC = earEnd.clone().add(mouthEnd).multiplyScalar(0.5)

  const SHOULDER_R = v(-0.3, 0.96, -0.01)
  const pataFone = new THREE.Group()
  pataFone.position.copy(SHOULDER_R)
  gargula.add(pataFone)
  {
    const L = (p: THREE.Vector3) => p.clone().sub(SHOULDER_R)
    const grip = foneC.clone().addScaledVector(foneAxes.X, -0.06)
    const palmC = grip.clone().addScaledVector(foneAxes.X, -0.07)
    const wrist = palmC.clone().addScaledVector(foneAxes.Y, -0.1).addScaledVector(foneAxes.X, -0.03)
    const elbow = v(-0.62, 0.72, 0.14)
    pataFone.add(bone(L(v(-0.3, 0.96, -0.01)), L(elbow), 0.09, STONE))
    const cotovelo = sphere(0.09, STONE, { roughness: 0.9 })
    cotovelo.position.copy(L(elbow))
    pataFone.add(cotovelo)
    pataFone.add(bone(L(elbow), L(wrist), 0.075, STONE))
    const palma = sphere(0.085, STONE, { roughness: 0.9 })
    palma.scale.set(0.55, 1.15, 1.0)
    palma.quaternion.copy(foneAxes.q)
    palma.position.copy(L(palmC))
    pataFone.add(palma)
    // dedos dando a volta no cabo do fone, por cima (lado da câmera)
    for (let i = 0; i < 4; i++) {
      const off = -0.075 + i * 0.05
      const at = (dx: number, dz: number) =>
        L(grip.clone().addScaledVector(foneAxes.Y, off).addScaledVector(foneAxes.X, dx).addScaledVector(foneAxes.Z, dz))
      const k1 = at(-0.07, 0.05)
      const k2 = at(0.0, 0.075)
      const k3 = at(0.06, 0.04)
      pataFone.add(bone(k1, k2, 0.028, STONE))
      pataFone.add(bone(k2, k3, 0.025, STONE))
    }
    pataFone.add(bone(
      L(palmC.clone().addScaledVector(foneAxes.Y, 0.06).addScaledVector(foneAxes.Z, -0.03)),
      L(grip.clone().addScaledVector(foneAxes.Y, 0.1).addScaledVector(foneAxes.Z, -0.04)),
      0.026, STONE,
    ))
  }

  // ---- fone preto + fio espiral até a base ----------------------------------
  const fone = new THREE.Group()
  fone.position.copy(foneC).add(G)
  fone.quaternion.copy(foneAxes.q)
  root.add(fone)
  {
    const half = earEnd.distanceTo(mouthEnd) / 2
    const cabo = capsule(0.04, half * 2 - 0.08, PHONE, { roughness: 0.25 })
    cabo.position.x = -0.06
    fone.add(cabo)
    for (const [y, rTop, h] of [[half, 0.078, 0.075], [-half, 0.07, 0.07]] as const) {
      const pescoco = bone(v(-0.06, y * 0.86, 0), v(-0.01, y, 0), 0.04, PHONE, { roughness: 0.25 })
      fone.add(pescoco)
      const concha = cylinder(rTop, 0.05, h, PHONE, { roughness: 0.25 })
      concha.rotation.z = -Math.PI / 2
      concha.position.set(0.0, y, 0)
      fone.add(concha)
    }
    // fio espiral: hélice ao redor de uma curva que pende e sobe até o fone
    const baseSide = v(-0.84, PY + 0.09, 0.28)
    const start = new THREE.Vector3().copy(mouthEnd).add(G).addScaledVector(foneAxes.Y, -0.03).addScaledVector(foneAxes.X, -0.08)
    const spine = new THREE.CatmullRomCurve3([
      start,
      start.clone().add(v(-0.06, -0.22, 0.12)),
      v(-0.6, 1.12, 0.72),
      v(-0.74, 0.9, 0.66),
      v(-0.84, 0.84, 0.48),
      baseSide,
    ])
    const N = 520
    const turns = 34
    const frames = spine.computeFrenetFrames(N, false)
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const a = t * turns * Math.PI * 2
      const p = spine.getPointAt(t)
      p.addScaledVector(frames.normals[i], Math.cos(a) * 0.028).addScaledVector(frames.binormals[i], Math.sin(a) * 0.028)
      pts.push(p)
    }
    const inv = fone.matrix.compose(fone.position, fone.quaternion, fone.scale).clone().invert()
    const local = pts.map((p) => p.applyMatrix4(inv))
    const fioEspiral = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(local), 1400, 0.009, 6, false),
      mat(PHONE, { roughness: 0.4, detail: 0 }),
    )
    fioEspiral.castShadow = true
    fone.add(fioEspiral)
  }

  // ---- base do telefone antigo no parapeito --------------------------------
  const telefone = new THREE.Group()
  telefone.position.set(-1.08, PY, 0.2)
  telefone.rotation.y = 0.3
  telefone.scale.setScalar(1.3)
  root.add(telefone)
  {
    const corpo = lathe(
      [[0, 0], [0.2, 0], [0.21, 0.02], [0.17, 0.16], [0.12, 0.2], [0, 0.2]],
      PHONE,
      { roughness: 0.25 },
      4,
    )
    corpo.rotation.y = Math.PI / 4
    corpo.scale.set(1, 1, 0.85)
    telefone.add(corpo)
    const disco = new THREE.Group()
    disco.position.set(0, 0.105, 0.125)
    disco.rotation.x = -0.75
    const placa = cylinder(0.085, 0.085, 0.015, CREAM, { roughness: 0.35 })
    placa.rotation.x = Math.PI / 2
    disco.add(placa)
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 1.6 + 0.6
      const furo = cylinder(0.013, 0.013, 0.02, '#3a3434', { roughness: 0.5 })
      furo.rotation.x = Math.PI / 2
      furo.position.set(Math.cos(a) * 0.058, Math.sin(a) * 0.058, 0.004)
      disco.add(furo)
    }
    const miolo = cylinder(0.03, 0.03, 0.025, PHONE, { roughness: 0.3 })
    miolo.rotation.x = Math.PI / 2
    disco.add(miolo)
    telefone.add(disco)
    // gancho vazio: o fone está na orelha
    for (const sx of [-1, 1]) {
      const garfo = rbox(0.04, 0.08, 0.05, 0.015, PHONE, { roughness: 0.25 })
      garfo.position.set(sx * 0.13, 0.22, -0.03)
      telefone.add(garfo)
    }
    const ponte = rbox(0.22, 0.03, 0.04, 0.012, PHONE, { roughness: 0.25 })
    ponte.position.set(0, 0.2, -0.03)
    telefone.add(ponte)
  }

  // ---- braço do tapa (esquerdo da gárgula, direita da câmera) ---------------
  const slapFingers = earL.dir.clone().add(v(0.45, 0, 0)).normalize()
  const slapBack = earL.normal.clone().add(v(0.35, 0, 0.35)).normalize()
  const pawAxes = basis(new THREE.Vector3().crossVectors(slapFingers, slapBack), slapFingers)
  const slapPalm = earL.root.clone().addScaledVector(earL.dir, 0.13).add(v(0.1, 0, 0.07))
  const SHOULDER_L = v(0.3, 0.96, -0.01)
  const pataTapa = new THREE.Group()
  pataTapa.position.copy(SHOULDER_L)
  gargula.add(pataTapa)
  {
    const L = (p: THREE.Vector3) => p.clone().sub(SHOULDER_L)
    // palma espalmada na parte de baixo da orelha, por fora: dedos abertos
    // escapam pela borda (contra a asa escura) e a ponta da orelha sobra acima
    const wrist = slapPalm.clone().addScaledVector(pawAxes.Y, -0.1)
    const elbow = v(0.66, 0.8, 0.12)
    pataTapa.add(bone(L(SHOULDER_L), L(elbow), 0.09, STONE))
    const cotovelo = sphere(0.09, STONE, { roughness: 0.9 })
    cotovelo.position.copy(L(elbow))
    pataTapa.add(cotovelo)
    pataTapa.add(bone(L(elbow), L(wrist), 0.075, STONE))
    const paw = openPaw()
    paw.quaternion.copy(pawAxes.q)
    paw.position.copy(L(slapPalm))
    pataTapa.add(paw)
  }

  // ---- marcas do tapa: traços de impacto --------------------------------------
  const impacto = new THREE.Group()
  impacto.position.copy(slapPalm).add(G).add(v(0.1, 0.04, 0.12))
  root.add(impacto)
  for (const a of [-0.55, 0, 0.55]) {
    const traco = rbox(0.13, 0.032, 0.032, 0.014, '#f1eee6', { roughness: 0.5 })
    traco.position.set(Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0)
    traco.rotation.z = a
    impacto.add(traco)
  }

  // ---- anéis de som: batem na orelha e voltam pra fora ----------------------
  const aneis = new THREE.Group()
  aneis.position.copy(earEnd).add(G).add(v(-0.02, 0.02, 0.12))
  root.add(aneis)
  const SPAN = 1.25
  for (const [i, r] of [0.24, 0.36, 0.48].entries()) {
    const a = arc(r, 0.022 - i * 0.002, SPAN, RING)
    a.rotation.z = Math.PI - SPAN / 2 + 0.15
    aneis.add(a)
  }

  // ---- chuva em diagonal ---------------------------------------------------
  const chuva = new THREE.Group()
  root.add(chuva)
  for (const [x, y, z] of [[-1.6, 1.75, 0.75], [-1.15, 2.2, 0.15], [0.95, 2.28, 0.6], [1.95, 1.5, 0.75]] as const) {
    const gota = new THREE.Group()
    gota.position.set(x, y, z)
    gota.rotation.z = 0.32 // vento empurra a chuva para a direita
    const corpo = sphere(0.055, RAIN, { roughness: 0.1, detail: 0 })
    gota.add(corpo)
    const bico = cone(0.053, 0.11, RAIN, { roughness: 0.1, detail: 0 })
    bico.position.y = 0.075
    gota.add(bico)
    const rastro = cylinder(0.008, 0.002, 0.3, RAIN, { roughness: 0.2, detail: 0 })
    rastro.position.y = 0.32
    gota.add(rastro)
    chuva.add(gota)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'parapeito', group: 'catedral', object: base },
    { name: 'pinaculo', group: 'catedral', object: pinaculo },
    { name: 'chuva', group: 'catedral', object: chuva },
    { name: 'gargula', group: 'gargula', object: gargula },
    { name: 'asas', group: 'gargula', object: asas },
    { name: 'cabeca', group: 'gargula', object: cabeca },
    { name: 'orelhas', group: 'gargula', object: orelhas },
    { name: 'telefone', group: 'telefone', object: telefone },
    { name: 'pata-fone', group: 'telefone', object: pataFone },
    { name: 'fone', group: 'telefone', object: fone },
    { name: 'agua', group: 'rror', object: agua },
    { name: 'aneis', group: 'voz', object: aneis },
    { name: 'pata-tapa', group: 'tapa', object: pataTapa },
    { name: 'impacto', group: 'tapa', object: impacto },
  ]

  // ---- montagem ------------------------------------------------------------
  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const telY = PY

  const build = [
    seq('parapeito-sobe', 'parapeito', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'No alto da catedral, em pleno temporal: um parapeito de pedra e a chuva caindo de lado.',
    }),
    seq('pinaculo-sobe', 'pinaculo', 0.3, 0.8, [riseFrom(PY, 2.2)], { ease: 'easeOut' }),
    seq('chuva-cai', 'chuva', 0.5, 0.8, [ch('position.y', 0.9, 0), ch('position.x', -0.3, 0)], { ease: 'easeOut' }),

    seq('gargula-sobe', 'gargula', 1.9, 0.9, [riseFrom(PY, 1.7)], {
      ease: 'easeOut',
      caption: 'Na beira, agachada, a GÁRGULA de pedra abre as asas de morcego…',
    }),
    seq('cabeca-ergue', 'cabeca', 1.9, 0.9, [ch('rotation.x', 0.5, 0)], { ease: 'easeOut' }),
    seq('fone-repousa', 'pata-fone', 1.9, 0.9, [ch('rotation.x', ARM_REST, ARM_REST)]),
    seq('tapa-repousa', 'pata-tapa', 1.9, 0.9, [ch('rotation.x', ARM_REST, ARM_REST)]),
    seq('orelhas-brotam', 'orelhas', 2.4, 0.45, s3(0.01, 1), { ease: 'easeOut' }),
    seq('asas-abrem', 'asas', 2.4, 0.65, [ch('scale.x', 0.05, 1), ch('scale.y', 0.3, 1)], { ease: 'easeOut' }),

    seq('telefone-sobe', 'telefone', 3.7, 0.5, [riseFrom(telY, 0.5)], {
      ease: 'easeOut',
      caption: 'TRIIIM! O telefone do campanário toca no parapeito. Ela atende: IÁ…?',
    }),
    seq('telefone-treme-1', 'telefone', 4.2, 0.1, [ch('rotation.z', 0, 0.12)]),
    seq('telefone-treme-2', 'telefone', 4.3, 0.1, [ch('rotation.z', 0.12, -0.12)]),
    seq('telefone-treme-3', 'telefone', 4.4, 0.1, [ch('rotation.z', -0.12, 0)]),
    seq('pata-fone-ergue', 'pata-fone', 4.6, 0.5, [ch('rotation.x', ARM_REST, 0)], { ease: 'easeInOut' }),
    seq('fone-na-orelha', 'fone', 4.85, 0.35, s3(0.01, 1), { ease: 'easeOut' }),

    seq('agua-jorra', 'agua', 5.9, 0.6, [ch('scale.y', 0.01, 1)], {
      ease: 'easeIn',
      caption: 'Ela é calha: a chuva entra pela nuca e sai gargarejando pela boca — RRÖÖR, RRÖÖR! Que HORROR!',
    }),
    seq('cabeca-gargareja-1', 'cabeca', 5.9, 0.2, [ch('rotation.z', HEAD_TILT, HEAD_TILT + 0.06)]),
    seq('cabeca-gargareja-2', 'cabeca', 6.1, 0.2, [ch('rotation.z', HEAD_TILT + 0.06, HEAD_TILT - 0.05)]),
    seq('cabeca-gargareja-3', 'cabeca', 6.3, 0.25, [ch('rotation.z', HEAD_TILT - 0.05, HEAD_TILT)]),

    seq('aneis-batem', 'aneis', 7.2, 0.5, s3(0.2, 1), {
      ease: 'easeOut',
      caption: 'A voz do outro lado bate na orelha e volta pra fora: não entra nada.',
    }),
    seq('aneis-voltam', 'aneis', 7.7, 0.3, s3(1, 1.12)),
    seq('aneis-assentam', 'aneis', 8.0, 0.25, s3(1.12, 1)),

    seq('pata-tapa-arma', 'pata-tapa', 9.0, 0.4, [ch('rotation.x', ARM_REST, 0), ch('rotation.z', 0, SLAP_OUT)], {
      ease: 'easeOut',
      caption: 'Ela inclina a cabeça e DÊI tapa na orelha, como quem tira água do ouvido…',
    }),
    seq('pata-tapa-1', 'pata-tapa', 9.4, 0.13, [ch('rotation.z', SLAP_OUT, 0)], { ease: 'easeIn' }),
    seq('impacto-estala', 'impacto', 9.53, 0.2, s3(0.2, 1), { ease: 'easeOut' }),
    seq('cabeca-tranco-1', 'cabeca', 9.53, 0.12, [ch('rotation.z', HEAD_TILT, HEAD_TILT + 0.1)], { ease: 'easeOut' }),
    seq('pata-tapa-volta', 'pata-tapa', 9.53, 0.18, [ch('rotation.z', 0, SLAP_OUT * 0.45)], { ease: 'easeOut' }),
    seq('cabeca-volta-1', 'cabeca', 9.65, 0.15, [ch('rotation.z', HEAD_TILT + 0.1, HEAD_TILT)]),
    seq('pata-tapa-2', 'pata-tapa', 9.71, 0.12, [ch('rotation.z', SLAP_OUT * 0.45, 0)], { ease: 'easeIn' }),
    seq('cabeca-tranco-2', 'cabeca', 9.83, 0.12, [ch('rotation.z', HEAD_TILT, HEAD_TILT + 0.08)], { ease: 'easeOut' }),
    seq('cabeca-volta-2', 'cabeca', 9.95, 0.2, [ch('rotation.z', HEAD_TILT + 0.08, HEAD_TILT)]),

    seq('orelhas-incham', 'orelhas', 10.9, 0.25, s3(1, 1.14), {
      ease: 'easeOut',
      caption: '…mas a orelha é de pedra ÍNTEgra, maciça, sem furo nenhum: não sai água e não entra voz.',
    }),
    seq('orelhas-assentam', 'orelhas', 11.15, 0.3, s3(1.14, 1)),

    seq('agua-golfa', 'agua', 12.1, 0.2, [ch('scale.x', 1, 1.35), ch('scale.z', 1, 1.35)], {
      ease: 'easeOut',
      caption: 'Jag hör dig inte. — Não estou te ouvindo.',
    }),
    seq('agua-normaliza', 'agua', 12.3, 0.35, [ch('scale.x', 1.35, 1), ch('scale.z', 1.35, 1)]),
    seq('aneis-final', 'aneis', 12.1, 0.25, s3(1, 1.1), { ease: 'easeOut' }),
    seq('aneis-final-2', 'aneis', 12.35, 0.3, s3(1.1, 1)),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 2.2, 4.75], target: [0.05, 1.4, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-hor-dig-inte',
    contexto:
      "Telefone: ligação falhando — trem entrando no túnel, metrô, vento no celular — ou reunião no Teams com o áudio cortando. Quase sempre vem em dupla com o 'Hallå?': 'Hallå? Jag hör dig inte!'; a pergunta irmã é 'Hör du mig?' (você está me ouvindo?).",
    fraseFonte: 'Não estou te ouvindo.',
    fraseAlvo: 'Jag hör dig inte.',
    pronuncia:
      "iá RRÖÖ(r)-dêi ÍN-te ('jag' = iá; 'hör' com h soprado e ö LONGO — boca de Ó redonda, em bico, com a língua empurrada pra frente; antes de R ele abre um pouquinho — e o R se derrete no D seguinte, língua dobrada pra trás: 'hör dig' sai quase 'rröö-dêi'; 'dig' = dêi, fraquinho; 'inte' com a força no ÍN, I curto e T seco, nunca 'íntchi')",
    ponteSonora:
      "IÁ... RRÖR! DÊI... ÍNTE(gra)! (5 sílabas: iá-RRÖÖ-dêi-ÍN-te; força no RRÖ e no ÍN; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado — com uma pausinha antes do RRÖR, pro sopro sair inteiro; RRÖR = o fim de HORROR, o berro da gárgula, que é também o gargarejo da chuva na garganta de pedra: o RR é o h soprado de 'hör', LEVE, de garganta aberta; a vogal é o MESMO RRÖ de AT-RRÖ-RA ('Vad kul att höra!') e de RRÖX ('Vi hörs!'), LONGO: boca de Ó redonda, em BICO, com a língua empurrada pra frente — antes de R ele abre um pouquinho, quase um É de bico; com o Ô fechado do 'horror' português sai 'hår', que é CABELO; o R do fim é BRANDO, de um toque só, e se derrete no D seguinte, língua dobrada pra trás: RRÖ-dêi, quase sem R — mas sem ele sobra 'hö', que é FENO; DÊI = o 'dig' de sempre, o mesmo DÊI de 'Jag ringer dig senare' e 'Jag saknar dig' — aqui é o DEI do tapa na orelha — 'DEI tapa!' —: UMA sílaba só, fraquinha, nunca 'de-i'; ÍNTE(gra) = o MESMO âncora de 'inte' da PRATA ÍNTEgra de 'Jag pratar inte så bra svenska' e do sorvete ÍNTEgro de 'Jag vet inte': força no ÍN, I curto, T seco de 'tatu', nunca 'íntchi', e corta o '-gra')",
    historia:
      'No alto da catedral, em pleno temporal, a gárgula de pedra atende o telefone do campanário. Ela é calha: a chuva entra pela nuca e sai gargarejando pela boca — RRÖÖR, RRÖÖR —, e a voz do outro lado se afoga no barulho. Que HORROR! Ela inclina a cabeça e bate na orelha, como quem tira água do ouvido depois da piscina — mas a orelha é de pedra ÍNTEGRA, maciça, sem furo nenhum: não sai água e não entra voz. Ela berra no fone: IÁ... RRÖR!... DEI tapa... ÍNTEgra! — não estou te ouvindo.',
  },
  createScene,
  refine: { organic: ['gargula', 'cabeca', 'pata-fone', 'pata-tapa'] },
}

export default card
