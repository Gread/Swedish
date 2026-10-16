import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, cylinder, sphere, cone, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Jag har tandvärk." — o encanador do porão ri nervoso (IÁ, RRÁR!), enfia a
 * chave de grifo vermelha na boca e vai aperTÁNDo o dente bambo feito porca de
 * sifão; a bochecha incha feito bola e, como faz em todo cano entupido, ele
 * enfia a câmera de inspeção na boca pra VER QUE estrago fez: o monitor em cima
 * da caixa de ferramentas mostra um dente vermelho latejando.
 *
 * Diorama: piso de cimento, parede de tijolos com dois canos de cobre em L (um
 * pingando). Encanador central de macacão laranja; a chave entra pela esquerda
 * (lado da bochecha inchada), o cabo da câmera sai pela direita até o monitor.
 */

const CEMENT = '#8e8b85'
const CRACK = '#605d58'
const MORTAR = '#a6978a'
const BRICKS = ['#77473a', '#80503f', '#6c4033', '#865743', '#734436']
const COPPER = '#c47b4a'
const COPPER_DARK = '#9c5d35'
const WATER = '#5ba9e4'
const GREEN = '#2e5847'
const GREEN_LIGHT = '#386a55'
const STEEL = '#9aa1a7'
const STEEL_DARK = '#5e656b'
const RUBBER = '#1b1d20'
const ORANGE = '#d9712f'
const ORANGE_DARK = '#b45a24'
const BELT = '#6a4428'
const BOOT = '#3d2d22'
const SKIN = '#e8c39e'
const CHEEK = '#ef9182'
const CAP = '#efb52c'
const CAP_DARK = '#d39a1f'
const BEARD = '#6d4a32'
const MOUTH = '#3a1519'
const TONGUE = '#c45e68'
const TOOTH = '#fbf7ec'
const STAR = '#ffd23f'
const RED = '#d8232a' // acento saturado RESERVADO: a chave de grifo e o dente do monitor

const GY = 0.18 // topo do piso
const W = 2.0 // meia-largura do diorama
const WALL_Z = -1.05 // face da parede
const PIPE_Z = WALL_Z + 0.1
const P_POS = new THREE.Vector3(-0.15, GY, 0.1)

function shade<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cilindro entre dois pontos (canos retos, cabos). */
function between(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const c = cylinder(r, r, a.distanceTo(b), color, opts, 20)
  c.position.copy(a).add(b).multiplyScalar(0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return c
}

/** Cotovelo de 90° (quarto de toro) centrado em c, girado em z. */
function elbow(c: THREE.Vector3, rz: number, R = 0.1, tube = 0.045) {
  const m = shade(
    new THREE.Mesh(
      new THREE.TorusGeometry(R, tube, 16, 20, Math.PI / 2),
      mat(COPPER, { roughness: 0.32, metalness: 0.75, size: 0.3 }),
    ),
  )
  m.position.copy(c)
  m.rotation.z = rz
  return m
}

/** Luva de emenda do cano. */
function coupling(p: THREE.Vector3, vertical: boolean) {
  const c = cylinder(0.058, 0.058, 0.07, COPPER_DARK, { roughness: 0.35, metalness: 0.75 }, 24)
  c.position.copy(p)
  if (!vertical) c.rotation.z = Math.PI / 2
  return c
}

/** Abraçadeira presa na parede. */
function clamp(p: THREE.Vector3, vertical: boolean) {
  const g = new THREE.Group()
  g.position.copy(p)
  const strap = torus(0.05, 0.012, STEEL_DARK, { roughness: 0.4, metalness: 0.6 })
  if (vertical) strap.rotation.x = Math.PI / 2
  else strap.rotation.y = Math.PI / 2
  g.add(strap)
  const foot = rbox(vertical ? 0.16 : 0.03, vertical ? 0.03 : 0.16, 0.05, 0.01, STEEL_DARK, {
    roughness: 0.4,
    metalness: 0.6,
  })
  foot.position.z = -0.06
  g.add(foot)
  return g
}

/** Gota d'água em pé (lágrima). */
function drop(s: number) {
  const d = lathe(
    [[0, 0], [0.028, 0.006], [0.04, 0.026], [0.036, 0.048], [0.022, 0.07], [0.008, 0.088], [0, 0.098]],
    WATER,
    { roughness: 0.08 },
    24,
  )
  d.scale.setScalar(s)
  return d
}

/** Estrela de 5 pontas extrudada, centrada no plano xy. */
function star(r: number) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.45 : r
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
    else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  s.closePath()
  const depth = r * 0.32
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: r * 0.1,
    bevelSize: r * 0.08,
    bevelSegments: 2,
  })
  geo.translate(0, 0, -depth / 2)
  return shade(new THREE.Mesh(geo, mat(STAR, { roughness: 0.4, emissive: STAR, emissiveIntensity: 0.35 })))
}

/**
 * Chave de grifo (Stillson) ao longo de +y local: empunhadura em 0, vão das
 * garras centrado em (0, L, 0), abertura virada para +x. Cabo vermelho,
 * cabeça de aço com porca serrilhada e dentes nas garras.
 */
function buildWrench(g: THREE.Group, L: number) {
  const y0 = -0.1
  const y1 = L - 0.13
  const cabo = rbox(0.075, y1 - y0, 0.034, 0.016, RED, { roughness: 0.3 })
  cabo.position.y = (y0 + y1) / 2
  g.add(cabo)
  // nervura central do cabo (perfil em I)
  const rib = rbox(0.03, (y1 - y0) * 0.78, 0.05, 0.012, '#b81c22', { roughness: 0.3 })
  rib.position.y = (y0 + y1) / 2 + 0.02
  g.add(rib)
  // furo de pendurar
  const hole = torus(0.018, 0.008, '#3b1012', { roughness: 0.5 })
  hole.position.set(0, y0 + 0.035, 0.018)
  g.add(hole)

  const metal = { roughness: 0.3, metalness: 0.75 }
  // corpo da cabeça (no lado -x, de onde saem as duas garras)
  const spine = rbox(0.05, 0.25, 0.052, 0.014, STEEL, metal)
  spine.position.set(-0.058, L - 0.06, 0)
  g.add(spine)
  // garra fixa (perto do cabo)
  const heel = rbox(0.115, 0.046, 0.052, 0.012, STEEL, metal)
  heel.position.set(-0.012, L - 0.062, 0)
  g.add(heel)
  // garra-gancho (ponta)
  const hook = rbox(0.13, 0.052, 0.052, 0.014, STEEL, metal)
  hook.position.set(-0.004, L + 0.064, 0)
  g.add(hook)
  // dentes das garras, virados para o vão
  for (let i = 0; i < 3; i++) {
    const x = -0.03 + i * 0.03
    const up = cone(0.011, 0.02, STEEL_DARK, metal, 8)
    up.position.set(x, L - 0.032, 0)
    g.add(up)
    const down = cone(0.011, 0.02, STEEL_DARK, metal, 8)
    down.rotation.z = Math.PI
    down.position.set(x, L + 0.032, 0)
    g.add(down)
  }
  // porca serrilhada de ajuste
  const nut = cylinder(0.042, 0.042, 0.064, STEEL_DARK, metal, 24)
  nut.position.set(-0.058, L - 0.155, 0)
  g.add(nut)
  for (const dy of [-0.02, 0, 0.02]) {
    const ridge = torus(0.042, 0.006, STEEL, metal)
    ridge.rotation.x = Math.PI / 2
    ridge.position.set(-0.058, L - 0.155 + dy, 0)
    g.add(ridge)
  }
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(77)

  // ---- piso de cimento -------------------------------------------------------
  const base = new THREE.Group()
  root.add(base)
  const slab = rbox(2 * W, 0.18, 2.5, 0.05, CEMENT, { roughness: 0.9 })
  slab.position.set(0, GY - 0.09, -0.05)
  base.add(slab)
  // rachaduras finas
  for (const [x, z, len, ry] of [[0.55, 0.85, 0.5, 0.4], [0.86, 0.7, 0.28, -0.6], [-1.15, 0.55, 0.42, -0.3]] as const) {
    const crack = rbox(len, 0.008, 0.018, 0.004, CRACK, { roughness: 1 })
    crack.position.set(x, GY + 0.002, z)
    crack.rotation.y = ry
    base.add(crack)
  }
  // ralo
  const drain = cylinder(0.13, 0.13, 0.012, STEEL_DARK, { roughness: 0.4, metalness: 0.6 }, 32)
  drain.position.set(-1.05, GY + 0.004, 0.42)
  base.add(drain)
  for (const dx of [-0.06, -0.02, 0.02, 0.06]) {
    const slot = rbox(0.018, 0.006, 0.17, 0.003, '#24262a', { roughness: 0.8 })
    slot.position.set(-1.05 + dx, GY + 0.011, 0.42)
    base.add(slot)
  }
  // poça sob as gotas
  const puddle = cylinder(0.26, 0.26, 0.008, WATER, { roughness: 0.06 }, 40)
  puddle.scale.z = 0.55
  puddle.position.set(-1.55, GY + 0.004, PIPE_Z + 0.12)
  base.add(puddle)

  // ---- parede de tijolos -----------------------------------------------------
  const parede = new THREE.Group()
  root.add(parede)
  const WALL_H = 2.3
  const mortar = rbox(2 * W, WALL_H, 0.16, 0.03, MORTAR, { roughness: 0.95 })
  mortar.position.set(0, GY + WALL_H / 2, WALL_Z - 0.08)
  parede.add(mortar)
  const BH = 0.13
  const BL = 0.34
  const GAP = 0.024
  for (let r = 0; GAP + (r + 1) * (BH + GAP) <= WALL_H; r++) {
    const y = GY + GAP + BH / 2 + r * (BH + GAP)
    const off = r % 2 ? (BL + GAP) / 2 : 0
    for (let x0 = -W - off + 0.012; x0 < W; x0 += BL + GAP) {
      const a = Math.max(x0, -W + 0.012)
      const b = Math.min(x0 + BL, W - 0.012)
      if (b - a < 0.07) continue
      const brick = rbox(b - a, BH, 0.05, 0.014, BRICKS[Math.floor(rand() * BRICKS.length)], {
        roughness: 0.92,
      })
      brick.position.set((a + b) / 2, y, WALL_Z + 0.012 + rand() * 0.008)
      parede.add(brick)
    }
  }

  // ---- canos de cobre em L ---------------------------------------------------
  const canos = new THREE.Group()
  root.add(canos)
  const cu = { roughness: 0.32, metalness: 0.75 }
  const TOP = GY + WALL_H + 0.02
  // cano A (esquerda, pingando): sai da lateral, dobra e sobe
  const yA = GY + 1.3
  canos.add(between(new THREE.Vector3(-W - 0.02, yA, PIPE_Z), new THREE.Vector3(-1.3, yA, PIPE_Z), 0.045, COPPER, cu))
  canos.add(elbow(new THREE.Vector3(-1.3, yA + 0.1, PIPE_Z), -Math.PI / 2))
  canos.add(between(new THREE.Vector3(-1.2, yA + 0.1, PIPE_Z), new THREE.Vector3(-1.2, TOP, PIPE_Z), 0.045, COPPER, cu))
  canos.add(coupling(new THREE.Vector3(-1.55, yA, PIPE_Z), false))
  canos.add(coupling(new THREE.Vector3(-1.2, yA + 0.65, PIPE_Z), true))
  canos.add(clamp(new THREE.Vector3(-1.85, yA, PIPE_Z), false))
  canos.add(clamp(new THREE.Vector3(-1.2, yA + 0.35, PIPE_Z), true))
  canos.add(clamp(new THREE.Vector3(-1.2, yA + 0.95, PIPE_Z), true))
  // cano B (direita): vem pela lateral, dobra e desce até o piso
  const yB = GY + 1.82
  canos.add(between(new THREE.Vector3(W + 0.02, yB, PIPE_Z), new THREE.Vector3(1.55, yB, PIPE_Z), 0.045, COPPER, cu))
  canos.add(elbow(new THREE.Vector3(1.55, yB - 0.1, PIPE_Z), Math.PI / 2))
  canos.add(between(new THREE.Vector3(1.45, yB - 0.1, PIPE_Z), new THREE.Vector3(1.45, GY + 0.03, PIPE_Z), 0.045, COPPER, cu))
  canos.add(coupling(new THREE.Vector3(1.45, GY + 1.05, PIPE_Z), true))
  canos.add(clamp(new THREE.Vector3(1.45, GY + 1.4, PIPE_Z), true))
  canos.add(clamp(new THREE.Vector3(1.85, yB, PIPE_Z), false))
  const flange = cylinder(0.09, 0.1, 0.04, COPPER_DARK, cu, 24)
  flange.position.set(1.45, GY + 0.02, PIPE_Z)
  canos.add(flange)
  // registro (volante de aço) no cano B
  const valve = new THREE.Group()
  valve.position.set(1.45, GY + 0.72, PIPE_Z + 0.06)
  const valveBody = cylinder(0.06, 0.06, 0.12, COPPER_DARK, cu, 20)
  valveBody.rotation.x = Math.PI / 2
  valve.add(valveBody)
  const wheel = torus(0.07, 0.014, STEEL_DARK, { roughness: 0.4, metalness: 0.6 })
  wheel.position.z = 0.08
  valve.add(wheel)
  for (const a of [0, Math.PI / 2]) {
    const spoke = rbox(0.14, 0.018, 0.018, 0.006, STEEL_DARK, { roughness: 0.4, metalness: 0.6 })
    spoke.rotation.z = a
    spoke.position.z = 0.08
    valve.add(spoke)
  }
  canos.add(valve)

  // ---- três gotas azuis ------------------------------------------------------
  const gotas = new THREE.Group()
  canos.add(gotas)
  for (const [y, s] of [[yA - 0.15, 1.0], [GY + 0.85, 0.9], [GY + 0.42, 0.85]] as const) {
    const d = drop(s)
    d.position.set(-1.55, y, PIPE_Z + 0.01)
    gotas.add(d)
  }

  // ---- encanador -------------------------------------------------------------
  const encanador = person({ body: ORANGE, skin: SKIN, height: 1.5, armAngle: 0.32 })
  encanador.position.copy(P_POS)
  encanador.rotation.y = 0.1
  root.add(encanador)

  for (const side of [-1, 1]) {
    const boot = rbox(0.17, 0.1, 0.27, 0.045, BOOT, { roughness: 0.7 })
    boot.position.set(side * 0.11, 0.05, 0.07)
    encanador.add(boot)
  }
  // macacão: peitilho com bolso, alças com botões, cinto de ferramentas
  const bib = rbox(0.3, 0.2, 0.04, 0.02, ORANGE, { roughness: 0.85 })
  bib.position.set(0, 0.58, 0.232)
  encanador.add(bib)
  const pocket = rbox(0.13, 0.085, 0.02, 0.01, ORANGE_DARK, { roughness: 0.85 })
  pocket.position.set(0.05, 0.57, 0.258)
  encanador.add(pocket)
  const pencil = cylinder(0.012, 0.012, 0.09, '#e8d27a', { roughness: 0.6 }, 10)
  pencil.position.set(0.02, 0.63, 0.258)
  pencil.rotation.z = 0.15
  encanador.add(pencil)
  for (const side of [-1, 1]) {
    const strap = rbox(0.055, 0.2, 0.03, 0.012, ORANGE_DARK, { roughness: 0.85 })
    strap.position.set(side * 0.115, 0.72, 0.19)
    strap.rotation.x = -0.55
    encanador.add(strap)
    const button = cylinder(0.022, 0.022, 0.014, STEEL, { roughness: 0.3, metalness: 0.7 }, 16)
    button.rotation.x = Math.PI / 2
    button.position.set(side * 0.115, 0.665, 0.258)
    encanador.add(button)
  }
  const belt = torus(0.262, 0.03, BELT, { roughness: 0.75 })
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.36
  belt.scale.set(1, 1.02, 1)
  encanador.add(belt)
  const buckle = rbox(0.075, 0.06, 0.02, 0.01, STEEL, { roughness: 0.3, metalness: 0.7 })
  buckle.position.set(0, 0.36, 0.29)
  encanador.add(buckle)
  for (const side of [-1, 1]) {
    const pouch = rbox(0.11, 0.13, 0.06, 0.02, BELT, { roughness: 0.75 })
    pouch.position.set(side * 0.2, 0.3, 0.18)
    pouch.rotation.y = side * 0.75
    encanador.add(pouch)
  }
  // martelo pendurado no cinto
  const hammer = new THREE.Group()
  hammer.position.set(0.27, 0.27, 0.02)
  hammer.rotation.z = 0.12
  const hHandle = cylinder(0.015, 0.015, 0.2, '#a47548', { roughness: 0.7 }, 10)
  hammer.add(hHandle)
  const hHead = rbox(0.1, 0.035, 0.035, 0.01, STEEL_DARK, { roughness: 0.35, metalness: 0.7 })
  hHead.position.y = -0.11
  hammer.add(hHead)
  encanador.add(hammer)

  const head = encanador.getObjectByName('head') as THREE.Group

  // barba rala: casca castanha no queixo e no maxilar
  const beard = shade(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 40, 20, Math.PI / 2 - 1.35, 2.7, 1.86, 0.98),
      mat(BEARD, { roughness: 1, size: 0.3 }),
    ),
  )
  beard.scale.set(1.02, 1, 1.05)
  head.add(beard)
  // sobrancelhas de dor (pontas de dentro erguidas)
  for (const side of [-1, 1]) {
    const brow = rbox(0.1, 0.022, 0.02, 0.009, '#4a3122', { roughness: 0.9 })
    brow.position.set(side * 0.105, 0.115, 0.255)
    brow.rotation.set(-0.2, side * 0.25, -side * 0.32)
    head.add(brow)
  }

  // boné amarelo (peça)
  const bone = new THREE.Group()
  head.add(bone)
  const dome = shade(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(CAP, { roughness: 0.8, size: 0.6 }),
    ),
  )
  dome.scale.set(1, 0.72, 1.03)
  dome.position.y = 0.1
  bone.add(dome)
  const band = torus(0.3, 0.014, CAP_DARK, { roughness: 0.8 })
  band.rotation.x = Math.PI / 2
  band.scale.set(1, 1.03, 1)
  band.position.y = 0.105
  bone.add(band)
  const brim = cylinder(0.2, 0.2, 0.024, CAP_DARK, { roughness: 0.8 }, 32)
  brim.scale.set(1, 1, 0.78)
  brim.position.set(0, 0.125, 0.27)
  brim.rotation.x = 0.1
  bone.add(brim)
  const knob = sphere(0.028, CAP_DARK, { roughness: 0.8 })
  knob.position.y = 0.315
  bone.add(knob)

  // boca escancarada (peça): fundo escuro, língua, dentes brancos grandes
  const boca = new THREE.Group()
  boca.position.set(0, -0.135, 0.235)
  head.add(boca)
  const cavity = sphere(0.1, MOUTH, { roughness: 0.6 })
  cavity.scale.set(1.15, 0.9, 0.55)
  boca.add(cavity)
  const tongue = sphere(0.06, TONGUE, { roughness: 0.5 })
  tongue.scale.set(1.3, 0.45, 0.8)
  tongue.position.set(0.015, -0.05, 0.02)
  boca.add(tongue)
  for (const x of [-0.03, 0.01, 0.05]) {
    const t = rbox(0.036, 0.045, 0.026, 0.01, TOOTH, { roughness: 0.25 })
    t.position.set(x, 0.055, 0.04)
    boca.add(t)
  }
  for (const x of [-0.035, 0.005, 0.045]) {
    const t = rbox(0.033, 0.034, 0.022, 0.009, TOOTH, { roughness: 0.25 })
    t.position.set(x, -0.058, 0.036)
    boca.add(t)
  }
  // o dente bambo, torto, que a chave aperta
  const bambo = rbox(0.046, 0.062, 0.03, 0.012, TOOTH, { roughness: 0.25 })
  bambo.position.set(-0.075, 0.025, 0.04)
  bambo.rotation.z = 0.22
  boca.add(bambo)

  // bochecha inchada (peça), do lado da chave
  const bochecha = new THREE.Group()
  bochecha.position.set(-0.2, -0.06, 0.12)
  head.add(bochecha)
  const bola = sphere(0.13, CHEEK, { roughness: 0.45 })
  bochecha.add(bola)
  const shine = sphere(0.03, '#fbd2c8', { roughness: 0.3 })
  shine.scale.set(1, 0.7, 0.4)
  shine.position.set(-0.03, 0.06, 0.115)
  bochecha.add(shine)

  // estrelinhas de dor saltando da bochecha (peça)
  const estrelas = new THREE.Group()
  estrelas.position.copy(bochecha.position)
  head.add(estrelas)
  for (const [ang, dist, r, rz] of [[100, 0.33, 0.06, 0.2], [132, 0.36, 0.068, -0.3], [160, 0.38, 0.055, 0.5], [188, 0.36, 0.05, -0.1]] as const) {
    const a = THREE.MathUtils.degToRad(ang)
    const st = star(r)
    st.position.set(Math.cos(a) * dist, Math.sin(a) * dist, 0.1)
    st.rotation.z = rz
    estrelas.add(st)
  }

  // ---- braço com a chave de grifo --------------------------------------------
  const braco = encanador.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(braco, 1.5)
  root.updateMatrixWorld(true)
  const shoulder = braco.getWorldPosition(new THREE.Vector3())
  const toothW = boca.localToWorld(bambo.position.clone())
  const wantHand = new THREE.Vector3(-0.64, GY + 0.42, 0.42)
  const armDir = wantHand.clone().sub(shoulder).normalize()
  const encQ = encanador.getWorldQuaternion(new THREE.Quaternion())
  braco.quaternion.copy(
    encQ.invert().multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), armDir)),
  )
  root.updateMatrixWorld(true)
  const hand = braco.children[0]
  const handW = hand.getWorldPosition(new THREE.Vector3())
  const ARM_X = braco.rotation.x

  const chave = new THREE.Group()
  chave.position.copy(hand.position)
  braco.add(chave)
  const L = toothW.distanceTo(handW)
  const yAx = toothW.clone().sub(handW).normalize()
  const toCam = new THREE.Vector3(0.1, 0.25, 1).normalize()
  const xAx = new THREE.Vector3().crossVectors(toCam, yAx).normalize()
  const zAx = new THREE.Vector3().crossVectors(xAx, yAx)
  const wrenchQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, yAx, zAx))
  const armQ = braco.getWorldQuaternion(new THREE.Quaternion())
  chave.quaternion.copy(armQ.invert().multiply(wrenchQ))
  buildWrench(chave, L)

  // braço direito: segura o cabo da câmera à frente do peito
  const bracoR = encanador.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  root.updateMatrixWorld(true)
  const shoulderR = bracoR.getWorldPosition(new THREE.Vector3())
  const dirR = new THREE.Vector3(0.3, GY + 0.5, 0.55).sub(shoulderR).normalize()
  const encQR = encanador.getWorldQuaternion(new THREE.Quaternion()).invert()
  bracoR.quaternion.copy(
    encQR.multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirR)),
  )
  root.updateMatrixWorld(true)
  const handR = bracoR.children[0].getWorldPosition(new THREE.Vector3())
  const ARMR_X = bracoR.rotation.x

  // ---- caixa de ferramentas + monitor ----------------------------------------
  const caixa = new THREE.Group()
  caixa.position.set(0.98, 0, 0.2)
  caixa.rotation.y = -0.28
  root.add(caixa)
  const metalG = { roughness: 0.42, metalness: 0.55 }
  const tb = rbox(0.74, 0.32, 0.4, 0.035, GREEN, metalG)
  tb.position.y = GY + 0.16
  caixa.add(tb)
  const lid = rbox(0.76, 0.08, 0.42, 0.03, GREEN_LIGHT, metalG)
  lid.position.y = GY + 0.36
  caixa.add(lid)
  const seam = rbox(0.765, 0.014, 0.425, 0.006, '#1f3a2f', { roughness: 0.6 })
  seam.position.y = GY + 0.318
  caixa.add(seam)
  for (const y of [GY + 0.09, GY + 0.2]) {
    const rib = rbox(0.6, 0.022, 0.012, 0.006, GREEN_LIGHT, metalG)
    rib.position.set(0, y, 0.203)
    caixa.add(rib)
  }
  for (const sx of [-0.24, 0.24]) {
    const latch = rbox(0.07, 0.09, 0.025, 0.01, STEEL, { roughness: 0.3, metalness: 0.75 })
    latch.position.set(sx, GY + 0.325, 0.215)
    caixa.add(latch)
  }
  for (const sx of [-0.16, 0.16]) {
    const post = rbox(0.04, 0.08, 0.04, 0.012, RUBBER, { roughness: 0.6 })
    post.position.set(sx, GY + 0.43, -0.11)
    caixa.add(post)
  }
  const handleBar = rbox(0.4, 0.045, 0.05, 0.02, RUBBER, { roughness: 0.6 })
  handleBar.position.set(0, GY + 0.48, -0.11)
  caixa.add(handleBar)

  const monitor = new THREE.Group()
  monitor.position.set(0, GY + 0.4, 0.07)
  monitor.rotation.x = -0.12
  caixa.add(monitor)
  const shell = rbox(0.54, 0.4, 0.07, 0.045, RUBBER, { roughness: 0.55 })
  shell.position.y = 0.22
  monitor.add(shell)
  const screen = rbox(0.45, 0.29, 0.012, 0.012, '#132b37', {
    roughness: 0.2,
    emissive: '#183c4c',
    emissiveIntensity: 0.55,
  })
  screen.position.set(0, 0.245, 0.033)
  monitor.add(screen)
  for (const [i, x] of [-0.13, -0.065, 0].entries()) {
    const btn = cylinder(0.014, 0.014, 0.014, i === 0 ? '#3bb06a' : STEEL_DARK, { roughness: 0.4 }, 12)
    btn.rotation.x = Math.PI / 2
    btn.position.set(x, 0.06, 0.036)
    monitor.add(btn)
  }
  for (const sx of [-0.2, 0.2]) {
    const foot = rbox(0.08, 0.03, 0.09, 0.012, '#2a2c30', { roughness: 0.7 })
    foot.position.set(sx, 0.015, 0)
    monitor.add(foot)
  }
  const stand = rbox(0.26, 0.26, 0.02, 0.01, '#2a2c30', { roughness: 0.6 })
  stand.position.set(0, 0.16, -0.09)
  stand.rotation.x = -0.4
  monitor.add(stand)

  // dente vermelho na tela (peça): coroa + raízes + risquinhos de latejo
  const dente = new THREE.Group()
  dente.position.set(0, 0.245, 0.042)
  monitor.add(dente)
  const glow = { roughness: 0.35, emissive: RED, emissiveIntensity: 0.7 }
  const crown = rbox(0.16, 0.08, 0.014, 0.03, RED, glow)
  crown.position.y = 0.02
  dente.add(crown)
  for (const side of [-1, 1]) {
    // cúspide arredondada no topo: a silhueta clássica de molar
    const cusp = rbox(0.08, 0.075, 0.014, 0.036, RED, glow)
    cusp.position.set(side * 0.04, 0.05, 0)
    dente.add(cusp)
    // raiz afunilada
    const raiz = cone(0.034, 0.085, RED, glow, 16)
    raiz.rotation.z = Math.PI + side * 0.2
    raiz.scale.z = 0.3
    raiz.position.set(side * 0.043, -0.045, 0)
    const ponta = sphere(0.012, RED, glow, 12)
    ponta.scale.z = 0.5
    ponta.position.set(side * 0.052, -0.084, 0)
    dente.add(ponta)
    dente.add(raiz)
    for (const k of [-1, 0, 1]) {
      const a = (side > 0 ? 0 : Math.PI) + k * 0.55
      const tick = rbox(0.04, 0.012, 0.01, 0.005, RED, glow)
      tick.position.set(Math.cos(a) * 0.15, 0.01 + Math.sin(a) * 0.105, 0)
      tick.rotation.z = a
      dente.add(tick)
    }
  }

  // ---- cabo da câmera de inspeção (peça): do monitor até a boca ---------------
  root.updateMatrixWorld(true)
  const plug = monitor.localToWorld(new THREE.Vector3(-0.27, 0.16, 0))
  const tip = head.localToWorld(new THREE.Vector3(0.1, -0.15, 0.27))
  const cabo = new THREE.Group()
  cabo.position.copy(plug)
  root.add(cabo)
  // o cabo passa pelo punho da mão direita, que vai alimentando a câmera
  const mid = plug.clone().lerp(handR, 0.5).add(new THREE.Vector3(0, -0.2, 0.08))
  const pts = [
    plug,
    plug.clone().add(new THREE.Vector3(-0.1, -0.1, 0.08)),
    mid,
    handR,
    tip.clone().add(new THREE.Vector3(0.07, -0.1, 0.08)),
    tip,
  ].map((p) => p.clone().sub(plug))
  const curve = new THREE.CatmullRomCurve3(pts)
  const wire = shade(
    new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.016, 10, false), mat('#17181a', { roughness: 0.5, size: 0.2 })),
  )
  cabo.add(wire)
  const plugBoot = cylinder(0.03, 0.024, 0.07, RUBBER, { roughness: 0.6 }, 16)
  plugBoot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(0))
  plugBoot.position.copy(curve.getPoint(0)).addScaledVector(curve.getTangent(0), 0.02)
  cabo.add(plugBoot)
  const endDir = curve.getTangent(1)
  const camHead = cylinder(0.026, 0.026, 0.07, STEEL, { roughness: 0.3, metalness: 0.75 }, 16)
  camHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endDir)
  camHead.position.copy(pts[5]).addScaledVector(endDir, 0.01)
  cabo.add(camHead)
  const lens = sphere(0.02, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 1.6 })
  lens.position.copy(pts[5]).addScaledVector(endDir, 0.05)
  cabo.add(lens)

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'parede', group: 'cenario', object: parede },
    { name: 'canos', group: 'canos', object: canos },
    { name: 'bracoR', group: 'encanador', object: bracoR },
    { name: 'encanador', group: 'encanador', object: encanador },
    { name: 'braco', group: 'encanador', object: braco },
    { name: 'bone', group: 'encanador', object: bone },
    { name: 'boca', group: 'riso', object: boca },
    { name: 'chave', group: 'chave', object: chave },
    { name: 'bochecha', group: 'dor', object: bochecha },
    { name: 'estrelas', group: 'dor', object: estrelas },
    { name: 'caixa', group: 'camera', object: caixa },
    { name: 'cabo', group: 'camera', object: cabo },
    { name: 'dente', group: 'tela', object: dente },
  ]

  const grow = (from: number, to: number) => [
    ch('scale.x', from, to),
    ch('scale.y', from, to),
    ch('scale.z', from, to),
  ]
  const ARM_LOW = ARM_X + 1.15
  const PUMP = ARM_X - 0.1

  // ---- montagem --------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Um porão de tijolos cheio de canos de cobre — e um deles pingando: pinga, pinga, pinga…',
    }),
    seq('parede-rise', 'parede', 0.3, 0.9, [riseFrom(0, 2.6)], { ease: 'easeOut' }),
    seq('canos-drop', 'canos', 1.0, 0.7, [ch('position.y', 1.6, 0)], { ease: 'easeOut' }),

    seq('encanador-rise', 'encanador', 2.4, 0.9, [riseFrom(GY, 1.7)], {
      ease: 'easeOut',
      caption: 'O dente de trás do encanador está bambo, balançando feito porca frouxa de sifão…',
    }),
    seq('braco-hold', 'braco', 2.4, 0.9, [ch('rotation.x', ARM_LOW, ARM_LOW)]),
    seq('bracoR-hold', 'bracoR', 2.4, 0.9, [ch('rotation.x', ARMR_X + 1.0, ARMR_X + 1.0)]),
    seq('bone-drop', 'bone', 3.1, 0.45, [ch('position.y', 0.6, 0), ch('rotation.z', 0.5, 0)], {
      ease: 'easeOut',
    }),

    seq('boca-abre', 'boca', 3.7, 0.35, [ch('scale.x', 0.5, 1), ch('scale.y', 0.1, 1)], {
      ease: 'easeOut',
      caption: '…e ele solta a risada nervosa de quem resolve tudo sozinho: IÁ, RRÁR!',
    }),

    seq('braco-raise', 'braco', 4.7, 0.7, [ch('rotation.x', ARM_LOW, ARM_X)], {
      ease: 'easeOut',
      caption: 'Enfia a chave de grifo vermelha na boca, morde o dente bambo…',
    }),
    seq('chave-grow', 'chave', 4.7, 0.5, grow(0.01, 1), { ease: 'easeOut' }),

    seq('pump-1', 'braco', 5.6, 0.25, [ch('rotation.x', ARM_X, PUMP)], {
      caption: '…e vai aperTÁNDo, aperTÁNDo, como se fosse um cano pingando!',
    }),
    seq('pump-2', 'braco', 5.85, 0.25, [ch('rotation.x', PUMP, ARM_X)]),
    seq('pump-3', 'braco', 6.1, 0.25, [ch('rotation.x', ARM_X, PUMP)]),
    seq('pump-4', 'braco', 6.35, 0.25, [ch('rotation.x', PUMP, ARM_X)]),

    seq('bochecha-incha', 'bochecha', 6.8, 0.35, grow(0.01, 1.25), {
      ease: 'easeOut',
      caption: 'A cada volta, uma pontada — e a bochecha incha feito uma bola!',
    }),
    seq('bochecha-assenta', 'bochecha', 7.15, 0.25, grow(1.25, 1)),
    seq('estrelas-pop', 'estrelas', 7.05, 0.5, [...grow(0.01, 1), ch('rotation.z', -0.8, 0)], {
      ease: 'easeOut',
    }),

    seq('caixa-rise', 'caixa', 8.1, 0.8, [riseFrom(0, 1.3)], {
      ease: 'easeOut',
      caption: 'Aí ele faz o que faz em todo cano entupido: enfia a câmera de inspeção na própria boca…',
    }),
    seq('cabo-grow', 'cabo', 8.9, 0.9, grow(0.01, 1), { ease: 'easeInOut' }),
    seq('bracoR-raise', 'bracoR', 8.9, 0.7, [ch('rotation.x', ARMR_X + 1.0, ARMR_X)], { ease: 'easeInOut' }),

    seq('dente-acende', 'dente', 10.0, 0.45, grow(0.01, 1), {
      ease: 'easeOut',
      caption: '…pra VER QUE estrago fez: no monitor, um dente vermelho, latejando.',
    }),
    seq('lateja-1', 'dente', 10.6, 0.25, grow(1, 1.2), { ease: 'easeOut' }),
    seq('lateja-2', 'dente', 10.85, 0.25, grow(1.2, 1)),
    seq('lateja-3', 'dente', 11.2, 0.25, grow(1, 1.2), {
      ease: 'easeOut',
      caption: 'Jag har tandvärk. — Estou com dor de dente.',
    }),
    seq('lateja-4', 'dente', 11.45, 0.3, grow(1.2, 1)),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 1.6, 2.95], target: [0.1, 0.97, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-tandvark',
    contexto:
      "Saúde: ao telefone com a Folktandvården ou um dentista particular, pedindo hora de emergência ('en akut tid'); na farmácia; ou explicando no trabalho por que você vai sair e está com a bochecha inchada.",
    fraseFonte: 'Estou com dor de dente.',
    fraseAlvo: 'Jag har tandvärk.',
    pronuncia:
      "iá rrar TÁND-värk ('jag' = iá; 'har' com h soprado e R brando, fraquinho mas presente; 'tandvärk' é UMA palavra só, com a força no TAND: A curto, ABERTO e ORAL — nada do 'tã' nasal do português —, N batido na ponta da língua e D leve fechando a sílaba; um acento menor no VÄRK, Ä bem aberto antes do R, quase A, e K seco no fim)",
    ponteSonora:
      "IÁ, RRÁR! (aper)TÁND(o)... VER QUE! (4 sílabas: iá-rrar-TÁND-värk; força principal no TÁND e um acento menor no VÉRK; IÁ, RRÁR = o 'jag har' de sempre — o MESMO de 'Jag har ont i magen' e 'Jag har huvudvärk': I de IOGA, nunca J chiado, h soprado leve, A longo e R BRANDO no fim — sem ele sobra 'ha', outro verbo; (aper)TÁND(o) = o APERTANDO da chave de grifo — só o pedaço forte, como o parTÍD(a) de 'tid': corte o APER da frente e o -O do fim e sobra TÁND, numa sílaba só; o A é ORAL, ABERTO e CURTO, de 'pá' — nada do 'tã' nasal do português —, com o N batido na ponta da língua e o D leve fechando seco; com T no lugar do D vira 'tant', que é TIA; e é o dente no SINGULAR, com A — no plural o A vira É: 'tänderna' é o TÉN-DER-NA do tubarão de 'Har du borstat tänderna?'; VER QUE = o MESMO 'värk' de 'Jag har huvudvärk' e 'Har du en värktablett?' — o 'VER QUE estrago' do encanador olhando pela câmera: VÉR com É ABERTO de 'pé' e R brando, e do QUE só o K seco, sem 'ki' no fim)",
    historia:
      'O dente de trás do encanador está bambo, balançando feito porca frouxa de sifão. Ele solta a risada nervosa de quem resolve tudo sozinho — IÁ, RRÁR! —, enfia a chave de grifo vermelha na boca e vai APERTANDO o dente como se fosse um cano pingando, com toda a força no TAN: aperTÁNDo, aperTÁNDo... A cada volta, uma pontada, e a bochecha incha feito uma bola. Aí ele faz o que faz em todo cano entupido: enfia a câmera de inspeção na própria boca pra VER QUE estrago fez — e o monitor em cima da caixa de ferramentas mostra um dente vermelho, latejando. Estou com dor de dente.',
  },
  createScene,
}

export default card
