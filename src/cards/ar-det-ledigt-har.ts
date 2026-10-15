import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Är det ledigt här?" — É DÊ LÊÊ-DIT', RRÉR?
 *
 * Ônibus lotado: sobra UM banco, guardado por um jornal dobrado. Uma fada
 * de vestido lilás pousa no encosto arrastando uma sacola enorme, LÊ o
 * jornal de boquinha fechada (LÊÊ), ergue a varinha — DIT'! dito e feito — o
 * jornal vira faísca e do assento brota uma HERA em forma de seta: RRÉR, aqui.
 *
 * Diorama: piso cinza-chumbo com faixa amarela, parede lateral com janela de
 * céu à esquerda (o banco da janela), banco vago no corredor com a fada no
 * encosto, barra amarela de apoio no corredor.
 */

const FLOOR = '#44484e'
const FLOOR_DOT = '#3a3d42'
const STRIPE = '#e2b53a'
const WALL = '#dcd7cb'
const GASKET = '#2f3236'
const SKY = '#8cc4ec'
const CLOUD = '#f4f7fa'
const SEAT = '#2f6670'        // azul-petróleo
const MOQ = ['#d9a441', '#c8553d', '#7fb3b8'] // pontinhos da moquete
const METAL = '#a6adb4'
const POLE = '#e0b531'
const PAPER = '#dedbd2'
const INK = '#55575c'
const LILAC = '#b58bd8'
const LILAC_LIGHT = '#d8c0ee'
const SKIN = '#f0cfae'
const HAIR = '#7a4a2a'
const WING = '#bfe2ff'
const BAG = '#b6473c'
const BAG_DARK = '#8e352d'
const GOLD = '#ffcf3f'
const IVY = '#35c43c'          // acento saturado RESERVADO: a hera-seta (RRÉR, aqui)
const IVY_DARK = '#1f8a2a'

const GY = 0.16                 // topo do piso
const SEAT_W = 0.66
const CUSH_TOP = GY + 0.5       // topo do assento
const SEAT_Z = 0.0              // centro do assento
const BACK_Z = -0.3             // encosto
const BACK_TOP = CUSH_TOP + 0.74
const VAGO_X = 0.42             // banco do corredor (vago)
const JANELA_X = -0.3           // banco da janela
const WALL_X = -0.78
const POLE_X = 1.32
const POLE_Z = -0.42

const FH = 0.82                 // altura da fada
const FADA_X = VAGO_X + 0.17
const FADA_Y = BACK_TOP + 0.02
const FADA_Z = BACK_Z

/** Uma flor da tiara: cinco pétalas brancas e miolo amarelo. */
function flower(r: number) {
  const g = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const p = sphere(r, '#ffffff', { roughness: 0.5 })
    p.position.set(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, 0)
    p.scale.z = 0.5
    g.add(p)
  }
  const c = sphere(r * 0.7, '#f3c33b', { roughness: 0.5 })
  c.position.z = r * 0.25
  g.add(c)
  return g
}

/** Folha de hera: coração achatado (dois lóbulos + ponta). */
function ivyLeaf(s: number, color = IVY) {
  const g = new THREE.Group()
  for (const side of [-1, 1]) {
    const lobe = sphere(s * 0.55, color, { roughness: 0.45 })
    lobe.position.set(side * s * 0.38, 0, 0)
    lobe.scale.z = 0.28
    g.add(lobe)
  }
  const tip = cone(s * 0.62, s * 0.9, color, { roughness: 0.45 })
  tip.position.y = -s * 0.42
  tip.rotation.z = Math.PI
  tip.scale.z = 0.28
  g.add(tip)
  return g
}

/** Estrelinha de faísca: dois losangos cruzados + miolo brilhante. */
function sparkle(s: number) {
  const g = new THREE.Group()
  const m = mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.9, roughness: 0.3 })
  for (const rot of [0, Math.PI / 2]) {
    const ray = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), m)
    ray.scale.set(s * 0.28, s, s * 0.18)
    ray.rotation.z = rot
    g.add(ray)
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(s * 0.3, 16, 16), m)
  g.add(core)
  return g
}

/** Um banco de ônibus: assento, encosto estofado, moquete e armação. */
function busSeat(rand: () => number) {
  const g = new THREE.Group()

  const cushion = rbox(SEAT_W, 0.13, 0.56, 0.06, SEAT, { roughness: 0.9 })
  cushion.position.set(0, CUSH_TOP - 0.065, SEAT_Z)
  g.add(cushion)

  const shell = rbox(SEAT_W + 0.02, 0.06, 0.58, 0.025, '#3a3f45', { roughness: 0.5 })
  shell.position.set(0, CUSH_TOP - 0.15, SEAT_Z - 0.01)
  g.add(shell)

  const back = new THREE.Group()
  back.position.set(0, CUSH_TOP, BACK_Z)
  back.rotation.x = -0.1
  const pad = rbox(SEAT_W, 0.76, 0.14, 0.06, SEAT, { roughness: 0.9 })
  pad.position.y = 0.38
  back.add(pad)
  const backShell = rbox(SEAT_W + 0.02, 0.78, 0.06, 0.03, '#3a3f45', { roughness: 0.5 })
  backShell.position.set(0, 0.38, -0.08)
  back.add(backShell)
  // pontinhos coloridos da moquete na face do encosto
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 6; j++) {
      const dot = rbox(0.045, 0.045, 0.012, 0.01, MOQ[(i + j) % 3], { roughness: 0.9 })
      dot.position.set(-0.22 + i * 0.147 + (rand() - 0.5) * 0.02, 0.1 + j * 0.112, 0.072)
      dot.rotation.z = Math.PI / 4
      back.add(dot)
    }
  }
  g.add(back)

  // pedestal de metal
  const post = cylinder(0.04, 0.05, CUSH_TOP - 0.18 - GY, METAL, { roughness: 0.3, metalness: 0.75 })
  post.position.set(0, GY + (CUSH_TOP - 0.18 - GY) / 2, SEAT_Z - 0.05)
  g.add(post)
  const foot = rbox(0.42, 0.04, 0.32, 0.02, '#3a3f45', { roughness: 0.5 })
  foot.position.set(0, GY + 0.02, SEAT_Z - 0.05)
  g.add(foot)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- piso do ônibus ------------------------------------------------------
  const piso = new THREE.Group()
  const disc = cylinder(2.45, 2.55, 0.12, '#2e3034', { roughness: 0.8 })
  disc.position.y = 0.06
  piso.add(disc)
  const top = cylinder(2.4, 2.45, 0.05, FLOOR, { roughness: 0.85 })
  top.position.y = GY - 0.025
  piso.add(top)
  // pastilhas antiderrapantes
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      const x = i * 0.34 + (j % 2) * 0.17
      const z = j * 0.34
      if (x * x + z * z > 2.2 * 2.2) continue
      const stud = cylinder(0.05, 0.05, 0.012, FLOOR_DOT, { roughness: 0.7 }, 16)
      stud.position.set(x, GY + 0.004, z)
      piso.add(stud)
    }
  }
  // faixa amarela de segurança na beira do degrau
  const faixa = rbox(3.6, 0.02, 0.14, 0.01, STRIPE, { roughness: 0.6 })
  faixa.position.set(0.25, GY + 0.01, 1.35)
  piso.add(faixa)
  root.add(piso)

  // ---- parede lateral com janela -------------------------------------------
  const parede = new THREE.Group()
  parede.position.set(WALL_X, 0, -0.25)
  const WL = 2.5     // comprimento ao longo de z
  const WIN_B = 1.02 // base da janela
  const WIN_T = 2.12 // topo da janela
  const lower = rbox(0.12, WIN_B - GY, WL, 0.03, WALL, { roughness: 0.7 })
  lower.position.set(0, GY + (WIN_B - GY) / 2, 0)
  parede.add(lower)
  const upper = rbox(0.12, 0.22, WL, 0.03, WALL, { roughness: 0.7 })
  upper.position.set(0, WIN_T + 0.11, 0)
  parede.add(upper)
  for (const s of [-1, 1]) {
    const jamb = rbox(0.12, WIN_T - WIN_B, 0.16, 0.03, WALL, { roughness: 0.7 })
    jamb.position.set(0, (WIN_B + WIN_T) / 2, s * (WL / 2 - 0.08))
    parede.add(jamb)
  }
  // céu e nuvens
  const sky = rbox(0.03, WIN_T - WIN_B, WL - 0.2, 0.01, SKY, { roughness: 0.6, emissive: SKY, emissiveIntensity: 0.35 })
  sky.position.set(-0.04, (WIN_B + WIN_T) / 2, 0)
  parede.add(sky)
  for (const [cz, cy, s] of [[-0.6, 1.78, 0.13], [0.45, 1.45, 0.1], [0.85, 1.9, 0.08]] as const) {
    const c = puff(s, CLOUD, 5, Math.round(cz * 10 + 40), { roughness: 0.9 })
    c.position.set(-0.01, cy, cz)
    c.scale.set(0.25, 0.8, 1.6)
    parede.add(c)
  }
  // borracha da janela e montante
  const gaskets: [number, number, number, number][] = [
    [0.05, WL - 0.28, 0, WIN_B + 0.03],
    [0.05, WL - 0.28, 0, WIN_T - 0.03],
  ]
  for (const [h, l, z, y] of gaskets) {
    const g = rbox(0.06, h, l, 0.02, GASKET, { roughness: 0.6 })
    g.position.set(0.04, y, z)
    parede.add(g)
  }
  const mullion = rbox(0.06, WIN_T - WIN_B, 0.05, 0.02, GASKET, { roughness: 0.6 })
  mullion.position.set(0.04, (WIN_B + WIN_T) / 2, 0.1)
  parede.add(mullion)
  // trilho de apoio e botão de parada na parede
  const handrail = cylinder(0.022, 0.022, WL - 0.4, POLE, { roughness: 0.35 })
  handrail.rotation.x = Math.PI / 2
  handrail.position.set(0.12, WIN_B - 0.08, 0)
  parede.add(handrail)
  const btnBox = rbox(0.04, 0.12, 0.09, 0.02, '#e7e3d8', { roughness: 0.5 })
  btnBox.position.set(0.08, 0.86, 0.95)
  parede.add(btnBox)
  const btn = cylinder(0.03, 0.03, 0.03, '#c8553d', { roughness: 0.4 }, 20)
  btn.rotation.z = Math.PI / 2
  btn.position.set(0.11, 0.86, 0.95)
  parede.add(btn)
  root.add(parede)

  // ---- dois bancos ---------------------------------------------------------
  const bancos = new THREE.Group()
  const bJanela = busSeat(rand)
  bJanela.position.x = JANELA_X
  bancos.add(bJanela)
  const bVago = busSeat(rand)
  bVago.position.x = VAGO_X
  bancos.add(bVago)
  // alça de apoio cromada no canto do corredor
  const grab = torus(0.07, 0.016, METAL, { roughness: 0.25, metalness: 0.8 })
  grab.position.set(VAGO_X + SEAT_W / 2 - 0.02, BACK_TOP + 0.02, BACK_Z - 0.06)
  grab.rotation.y = Math.PI / 2
  bancos.add(grab)
  root.add(bancos)

  // ---- barra de apoio amarela ----------------------------------------------
  const barra = new THREE.Group()
  barra.position.set(POLE_X, 0, POLE_Z)
  const tube = cylinder(0.045, 0.045, 2.35, POLE, { roughness: 0.35 })
  tube.position.y = GY + 1.175
  barra.add(tube)
  const flange = cylinder(0.09, 0.11, 0.05, METAL, { roughness: 0.3, metalness: 0.75 })
  flange.position.y = GY + 0.025
  barra.add(flange)
  const stopBtn = rbox(0.13, 0.17, 0.12, 0.04, '#e7e3d8', { roughness: 0.5 })
  stopBtn.position.set(0, 1.25, 0)
  barra.add(stopBtn)
  const stopRed = cylinder(0.04, 0.04, 0.03, '#c8553d', { roughness: 0.4 }, 20)
  stopRed.rotation.x = Math.PI / 2
  stopRed.position.set(0, 1.25, 0.065)
  barra.add(stopRed)
  root.add(barra)

  // ---- jornal dobrado no assento vago --------------------------------------
  const JORNAL_Y = CUSH_TOP + 0.02
  const jornal = new THREE.Group()
  jornal.position.set(VAGO_X + 0.04, JORNAL_Y, SEAT_Z + 0.08)
  jornal.rotation.y = 0.35
  jornal.scale.setScalar(1.2)
  const sheetB = rbox(0.42, 0.018, 0.3, 0.008, '#cfccc2', { roughness: 0.85 })
  jornal.add(sheetB)
  const sheetT = rbox(0.4, 0.018, 0.29, 0.008, PAPER, { roughness: 0.85 })
  sheetT.position.set(0.005, 0.018, 0)
  jornal.add(sheetT)
  // manchete, foto e colunas
  const head1 = rbox(0.32, 0.008, 0.045, 0.003, INK, { roughness: 0.8 })
  head1.position.set(0, 0.03, -0.09)
  jornal.add(head1)
  const photo = rbox(0.12, 0.008, 0.11, 0.003, '#8a8f96', { roughness: 0.8 })
  photo.position.set(-0.11, 0.03, 0.03)
  jornal.add(photo)
  for (let k = 0; k < 4; k++) {
    const col = rbox(0.17, 0.006, 0.014, 0.002, '#8e9096', { roughness: 0.8 })
    col.position.set(0.08, 0.03, -0.015 + k * 0.035)
    jornal.add(col)
  }
  root.add(jornal)

  // ---- faíscas douradas saindo do jornal -----------------------------------
  const faiscas = new THREE.Group()
  faiscas.position.set(VAGO_X + 0.04, JORNAL_Y + 0.05, SEAT_Z + 0.08)
  const sparkSpots: [number, number, number, number][] = [
    [-0.16, 0.08, 0.26, 0.065], [0.3, 0.22, 0.32, 0.07], [0.12, 0.34, 0.3, 0.05],
    [0.34, 0.04, 0.28, 0.055], [0.16, 0.5, 0.38, 0.045], [0.02, 0.12, 0.36, 0.045],
    [0.42, 0.16, 0.36, 0.04], [-0.08, 0.26, 0.34, 0.04],
  ]
  for (const [x, y, z, s] of sparkSpots) {
    const sp = sparkle(s)
    sp.position.set(x, y, z)
    sp.rotation.z = rand() * Math.PI
    faiscas.add(sp)
  }
  // lascas de papel subindo
  for (let k = 0; k < 5; k++) {
    const flake = rbox(0.06, 0.006, 0.045, 0.003, PAPER, { roughness: 0.85 })
    flake.position.set(-0.05 + k * 0.1, 0.1 + rand() * 0.3, 0.12 + rand() * 0.18)
    flake.rotation.set(rand() * 1.2, rand() * 3, rand() * 1.2)
    faiscas.add(flake)
  }
  root.add(faiscas)

  // ---- hera brotando do assento em forma de seta ---------------------------
  // haste sobe pela esquerda do assento, faz a curva por cima e desce numa
  // ponta de seta grande apontando para o assento: RRÉR, AQUI.
  const hera = new THREE.Group()
  hera.position.set(VAGO_X, CUSH_TOP, SEAT_Z + 0.12)
  const STEM_X = -0.28
  const ARC_R = 0.15
  const RISE = 0.56
  const STEM_R = 0.03
  const stemUp = cylinder(STEM_R, STEM_R * 1.25, RISE, IVY_DARK, { roughness: 0.6 })
  stemUp.position.set(STEM_X, RISE / 2, 0)
  hera.add(stemUp)
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(ARC_R, STEM_R, 12, 32, Math.PI),
    mat(IVY_DARK, { roughness: 0.6, size: 0.4 }),
  )
  arc.castShadow = true
  arc.position.set(STEM_X + ARC_R, RISE, 0)
  hera.add(arc)
  const DOWN = 0.12
  const AX = STEM_X + ARC_R * 2
  const stemDown = cylinder(STEM_R, STEM_R, DOWN + 0.02, IVY_DARK, { roughness: 0.6 })
  stemDown.position.set(AX, RISE - DOWN / 2, 0)
  hera.add(stemDown)
  // ponta da seta: losango largo e chato, de frente para a câmera
  const ARROW_H = 0.26
  const head = cone(0.17, ARROW_H, IVY, { roughness: 0.4 }, 4)
  head.rotation.set(Math.PI, Math.PI / 4, 0)
  head.position.set(AX, RISE - DOWN - ARROW_H / 2, 0)
  head.scale.set(1, 1, 0.38)
  hera.add(head)
  // folhinhas ao longo da haste e da curva (pequenas: a seta é que manda)
  const LEAF = '#2a9a32'
  const leafSpots: [number, number, number, number][] = [
    [STEM_X + 0.05, 0.1, -1.0, 0.07], [STEM_X - 0.05, 0.22, 1.0, 0.075],
    [STEM_X + 0.05, 0.34, -1.0, 0.07], [STEM_X - 0.05, 0.46, 1.0, 0.075],
    [STEM_X + 0.02, RISE + 0.13, 0.5, 0.065], [AX + 0.02, RISE + 0.13, -0.5, 0.065],
  ]
  for (const [x, y, rz, s] of leafSpots) {
    const lf = ivyLeaf(s, LEAF)
    lf.position.set(x, y, 0)
    lf.rotation.z = rz
    hera.add(lf)
  }
  // raiz: tufinho no estofado
  const root0 = puff(0.055, IVY_DARK, 4, 7, { roughness: 0.6 })
  root0.position.set(STEM_X, 0.02, 0)
  root0.scale.y = 0.5
  hera.add(root0)
  root.add(hera)

  // ---- fada ----------------------------------------------------------------
  const fada = new THREE.Group()
  fada.position.set(FADA_X, FADA_Y, FADA_Z)
  fada.rotation.y = -0.15
  root.add(fada)

  const corpo = person({ body: LILAC, skin: SKIN, height: FH, armAngle: 0.35 })
  fada.add(corpo)

  // vestido em sino com babado
  const dress = lathe(
    [[0, 0.01], [0.27, 0.01], [0.275, 0.04], [0.22, 0.14], [0.17, 0.24], [0.148, 0.31], [0, 0.31]],
    LILAC,
    { roughness: 0.75 },
  )
  corpo.add(dress)
  const frill = torus(0.262, 0.028, LILAC_LIGHT, { roughness: 0.8 })
  frill.rotation.x = Math.PI / 2
  frill.position.y = 0.035
  corpo.add(frill)
  const sash = torus(0.15, 0.022, LILAC_LIGHT, { roughness: 0.8 })
  sash.rotation.x = Math.PI / 2
  sash.position.y = 0.3
  corpo.add(sash)

  const cabeca = corpo.getObjectByName('head') as THREE.Group
  const HR = FH * 0.19
  // cabelo: calota atrás da linha do rosto + coque no topo
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(HR * 1.06, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42),
    mat(HAIR, { roughness: 0.8, size: 0.3 }),
  )
  hairCap.castShadow = true
  hairCap.rotation.x = -0.55
  hairCap.position.y = 0.01
  cabeca.add(hairCap)
  const backHair = sphere(HR * 0.98, HAIR, { roughness: 0.8 })
  backHair.position.set(0, 0.0, -0.035)
  backHair.scale.set(1.02, 0.95, 0.85)
  cabeca.add(backHair)
  const bun = sphere(HR * 0.5, HAIR, { roughness: 0.8 })
  bun.position.set(0, HR * 1.05, -HR * 0.25)
  cabeca.add(bun)
  // tiara de florzinhas brancas
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45
    const f = flower(0.016)
    f.position.set(Math.sin(a) * HR * 0.95, HR * 0.72, Math.cos(a) * HR * 0.62)
    f.rotation.set(-0.6, a, 0)
    cabeca.add(f)
  }
  // bochechas e boquinha fechada (LÊÊ)
  for (const side of [-1, 1]) {
    const cheek = sphere(HR * 0.17, '#eea0a0', { roughness: 0.7 })
    cheek.position.set(side * HR * 0.55, -HR * 0.2, HR * 0.78)
    cheek.scale.z = 0.4
    cabeca.add(cheek)
  }
  const mouth = sphere(HR * 0.1, '#a14a4a', { roughness: 0.6 })
  mouth.position.set(0, -HR * 0.38, HR * 0.9)
  mouth.scale.set(1.3, 0.7, 0.5)
  cabeca.add(mouth)

  // braço da varinha (esquerdo da fada, lado do assento): pivô no ombro
  const bracoVarinha = corpo.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoVarinha, FH)
  const HAND_Y = -FH * 0.52 * 0.32 - 0.19 * FH
  const varinha = new THREE.Group()
  varinha.position.set(0, HAND_Y, 0.01)
  const stick = cylinder(0.011, 0.014, 0.34, '#f4efe4', { roughness: 0.35 })
  stick.position.y = -0.17
  varinha.add(stick)
  const star = new THREE.Group()
  star.position.y = -0.37
  const starMat = mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.55, roughness: 0.3 })
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2
    const pt = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.075, 4), starMat)
    pt.position.set(Math.sin(a) * 0.045, Math.cos(a) * 0.045, 0)
    pt.rotation.z = -a
    pt.scale.z = 0.5
    star.add(pt)
  }
  const starCore = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), starMat)
  starCore.scale.z = 0.6
  star.add(starCore)
  star.rotation.x = -Math.PI / 2
  varinha.add(star)
  bracoVarinha.add(varinha)
  // pose final: braço estendido para frente e para baixo, rumo ao assento
  const ARM_X = -0.95
  const ARM_Z = 0.05
  bracoVarinha.rotation.x = ARM_X
  bracoVarinha.rotation.z = ARM_Z

  // braço da sacola (lado do corredor), quase reto, puxado pelo peso
  const bracoSacola = corpo.getObjectByName('armR') as THREE.Mesh
  bracoSacola.rotation.z = -0.22
  const sacola = new THREE.Group()
  sacola.position.set(0.02, -FH * 0.52 * 0.32 - 0.02, 0.02)
  sacola.rotation.z = 0.22
  const BAG_W = 0.42
  const BAG_H = 0.5
  const bagBody = rbox(BAG_W, BAG_H, 0.24, 0.04, BAG, { roughness: 0.7 })
  bagBody.position.y = -0.19 - BAG_H / 2
  sacola.add(bagBody)
  const bagFold = rbox(BAG_W + 0.01, 0.05, 0.25, 0.02, BAG_DARK, { roughness: 0.7 })
  bagFold.position.y = -0.19 - 0.03
  sacola.add(bagFold)
  for (const s of [-1, 1]) {
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.012, 8, 24, Math.PI),
      mat(BAG_DARK, { roughness: 0.7, size: 0.15 }),
    )
    handle.castShadow = true
    handle.position.set(0, -0.2, s * 0.06)
    handle.scale.y = 2.4
    sacola.add(handle)
  }
  // compras espiando: baguete e um maço de verdura
  const baguete = capsule(0.04, 0.3, '#d9a75e', { roughness: 0.7 })
  baguete.position.set(-0.11, -0.17, -0.04)
  baguete.rotation.z = 0.35
  sacola.add(baguete)
  const verdura = puff(0.07, '#6e9b4a', 4, 12, { roughness: 0.85 })
  verdura.position.set(0.12, -0.19, -0.02)
  sacola.add(verdura)
  bracoSacola.add(sacola)

  // ---- quatro asas translúcidas --------------------------------------------
  const asas = new THREE.Group()
  asas.position.set(FADA_X, FADA_Y + FH * 0.42, FADA_Z - 0.12)
  asas.rotation.y = -0.15
  const wingMat = mat(WING, { roughness: 0.2, detail: 0 })
  wingMat.transparent = true
  wingMat.opacity = 0.55
  wingMat.depthWrite = false
  const rimMat = mat('#e9f5ff', { roughness: 0.3, detail: 0 })
  for (const side of [-1, 1]) {
    for (const [len, wid, angUp, y] of [[0.38, 0.21, 0.6, 0.06], [0.26, 0.14, -0.45, -0.05]] as const) {
      const wing = new THREE.Group()
      wing.position.set(side * 0.04, y, 0)
      wing.rotation.set(0, -side * 0.3, side * angUp)
      const membrane = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), wingMat)
      membrane.scale.set(len / 2, wid / 2, 0.012)
      membrane.position.x = side * len / 2
      wing.add(membrane)
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.018, 8, 40), rimMat)
      rim.scale.set(len / 2, wid / 2, 1)
      rim.position.x = side * len / 2
      wing.add(rim)
      asas.add(wing)
    }
  }
  root.add(asas)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'onibus', object: piso },
    { name: 'parede', group: 'onibus', object: parede },
    { name: 'bancos', group: 'bancos', object: bancos },
    { name: 'barra', group: 'bancos', object: barra },
    { name: 'jornal', group: 'jornal', object: jornal },
    { name: 'fada', group: 'fada', object: fada },
    { name: 'asas', group: 'fada', object: asas },
    { name: 'sacola', group: 'fada', object: sacola },
    { name: 'bracoVarinha', group: 'varinha', object: bracoVarinha },
    { name: 'faiscas', group: 'magia', object: faiscas },
    { name: 'hera', group: 'hera', object: hera },
  ]

  // ---- montagem ------------------------------------------------------------
  const FX0 = FADA_X + 1.6
  const FY0 = FADA_Y + 0.9
  const AY = FADA_Y + FH * 0.42
  const build = [
    seq('piso-rise', 'piso', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Ônibus lotado no fim da tarde…',
    }),
    seq('parede-rise', 'parede', 0.2, 0.9, [riseFrom(0, 2.4)], { ease: 'easeOut' }),

    seq('bancos-rise', 'bancos', 1.1, 0.8, [riseFrom(0, 1.5)], {
      ease: 'easeOut',
      caption: 'Sobra UM banco vago — mas tem um jornal dobrado em cima, guardando lugar.',
    }),
    seq('barra-rise', 'barra', 1.3, 0.8, [riseFrom(0, 2.6)], { ease: 'easeOut' }),
    seq('jornal-cai', 'jornal', 1.8, 0.7, [
      ch('position.y', JORNAL_Y + 0.9, JORNAL_Y), ch('rotation.y', -0.9, 0.35), ch('rotation.z', 0.6, 0),
    ], { ease: 'easeOut' }),

    seq('fada-voa', 'fada', 3.0, 1.3, [
      ch('position.x', FX0, FADA_X), ch('position.y', FY0, FADA_Y), ch('rotation.z', 0.35, 0),
    ], {
      ease: 'easeOut',
      caption: 'Uma fada do tamanho de um palmo chega voando, arrastando uma sacola três vezes maior que ela.',
    }),
    seq('asas-voa', 'asas', 3.0, 1.3, [
      ch('position.x', FX0, FADA_X), ch('position.y', FY0 + FH * 0.42, AY),
    ], { ease: 'easeOut' }),
    seq('asas-bate-a', 'asas', 3.0, 0.3, [ch('scale.x', 1, 0.35)]),
    seq('asas-bate-b', 'asas', 3.3, 0.3, [ch('scale.x', 0.35, 1)]),
    seq('asas-bate-c', 'asas', 3.6, 0.3, [ch('scale.x', 1, 0.35)]),
    seq('asas-bate-d', 'asas', 3.9, 0.4, [ch('scale.x', 0.35, 1)]),
    seq('sacola-balanca', 'sacola', 3.0, 1.5, [ch('rotation.z', -0.5, 0.22)], { ease: 'easeOut' }),

    seq('fada-le', 'fada', 4.6, 0.6, [ch('rotation.x', 0, 0.3)], {
      ease: 'easeOut',
      caption: 'Pousa no encosto e LÊ a manchete, de boquinha fechada: LÊÊ… nenhum nome de dono.',
    }),
    seq('fada-ergue', 'fada', 6.0, 0.4, [ch('rotation.x', 0.3, 0)], { ease: 'easeOut' }),

    seq('varinha-ergue', 'bracoVarinha', 6.0, 0.5, [
      ch('rotation.x', 0, -2.7), ch('rotation.z', 0.35, 0.1),
    ], {
      ease: 'easeOut',
      caption: "Ergue a varinha — DIT'! Dito e feito: o jornal vira faísca.",
    }),
    seq('varinha-aponta', 'bracoVarinha', 6.6, 0.4, [
      ch('rotation.x', -2.7, ARM_X), ch('rotation.z', 0.1, ARM_Z),
    ], { ease: 'easeIn' }),
    seq('jornal-desfaz', 'jornal', 7.0, 0.6, [
      ch('scale.x', 1.2, 0.95), ch('scale.z', 1.2, 0.95), ch('rotation.y', 0.35, 0.55),
    ], { ease: 'easeOut' }),
    seq('faiscas-estoura', 'faiscas', 7.0, 0.7, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1), ch('rotation.y', -1.2, 0),
    ], { ease: 'easeOut' }),

    seq('hera-brota', 'hera', 8.1, 1.0, [
      ch('scale.y', 0.01, 1.08), ch('scale.x', 0.4, 1), ch('scale.z', 0.4, 1),
    ], {
      ease: 'easeOut',
      caption: 'Do assento brota uma HERA em forma de seta, apontando: RRÉR — aqui!',
    }),
    seq('hera-assenta', 'hera', 9.1, 0.4, [ch('scale.y', 1.08, 1)]),

    seq('asas-final-a', 'asas', 10.0, 0.3, [ch('scale.x', 1, 0.5)], {
      caption: 'Är det ledigt här? — Esse lugar está livre?',
    }),
    seq('asas-final-b', 'asas', 10.3, 0.4, [ch('scale.x', 0.5, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.15, 2.2, 3.85], target: [0.15, 1.22, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'ar-det-ledigt-har',
    contexto:
      "Transporte: no ônibus, trem, café ou sala de espera lotados, apontando pro lugar vago ao lado de alguém — às vezes com uma bolsa em cima. Resposta: 'Ja, det är ledigt' ou 'Nej, det är upptaget'.",
    fraseFonte: 'Esse lugar está livre?',
    fraseAlvo: 'Är det ledigt här?',
    pronuncia:
      "é dê LÊÊ-dit RRÉR ('det' com o t mudo; 'ledigt' com Ê fechado e longo, o g some e sobra só o T; 'här' com h soprado e ä bem aberto)",
    ponteSonora:
      "É DÊ LÊÊ-DIT', RRÉR? (5 sílabas: é-dê-LÊÊ-dit-RRÉR; tônicas em LÊÊ e RRÉR; É DÊ = o 'är det' de 'Är det till höger eller till vänster?' — a pergunta começa pelo verbo: É aberto e curto, DÊ fechado, o T de 'det' mudo; LÊÊ = 'lê', do verbo ler, exatamente como o português já diz — Ê FECHADO de 'você', boquinha quase fechada, só que bem LONGO, e é nele que cai a força; é o OPOSTO do palhaço de 'Jag lär mig svenska', que lê de boca ESCANCARADA de nojo (LÉÉR, É aberto de chulé): a fada lê de boquinha fechada e sai 'le-', o palhaço escancara e sai 'lär'; DIT' = DITO sem o -O, o 'dito e feito' da varinha: D de 'dado', nunca 'dji', e T seco no fim — o -gt de 'ledigt' na fala vira só T; RRÉR = a HERA soprada, o mesmo 'här' de 'Det gör ont här': H nada mudo, É bem aberto, R brando)",
    historia:
      "Ônibus lotado no fim da tarde. Uma fada do tamanho de um palmo voa arrastando uma sacola de compras três vezes maior que ela e acha UM banco vago — mas com um jornal dobrado em cima, guardando lugar. Ela pousa no encosto e LÊ a manchete em voz alta, devagarinho e de boquinha fechada: LÊÊ... nenhum nome de dono. Ergue a varinha — DIT'! dito e feito — o jornal vira faísca e do assento brota uma HERA em forma de seta, apontando: RRÉR, aqui. Educada, ainda pergunta pro corredor antes de sentar: É DÊ LÊÊ-DIT', RRÉR? — esse lugar está livre?",
  },
  createScene,
}

export default card
