import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom,
  rbox, capsule, cylinder, sphere, torus, lathe, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Tack detsamma!" — TAC! DÊ-SÁMA!
 *
 * Sexta-feira no dojo: o pergaminho HELG desce do teto desejando bom fim de
 * semana. O samurai fecha o leque num estalo (TAC!) e faz a reverência mais
 * funda da vida pro espelho gigante (DÊ-SÁMA!) — e o reflexo devolve tudo
 * igualzinho: o mesmo TAC, a mesma reverência. O desejo voltou inteiro.
 *
 * Diorama: tatame em placas, parede de shoji ao fundo com o pergaminho, o
 * samurai à esquerda em perfil, o espelho de moldura escura à direita. O
 * reflexo é uma cópia espelhada em tons claros, achatada contra o vidro (lê
 * como imagem, não como segundo boneco), curvada de volta para o samurai.
 */

const BASE_WOOD = '#3a2a1e'
const TATAMI = '#bdb877'
const TATAMI_ALT = '#b1ac69'
const HERI = '#2d3a2e'
const WOOD_DARK = '#3b2a1f'
const WOOD = '#5b4130'
const PAPER = '#efe6d1'
const KUMIKO = '#4a3727'
const SCROLL_PAPER = '#f6efdc'
const BROCADE = '#2f4a5f'
const INK = '#1f1b1a'
const GLASS = '#c3d0da'
const GLASS_LINE = '#aebdc9'
const GOLD = '#f2b52b' // acento saturado RESERVADO: o leque que faz TAC

interface Palette {
  armor: string
  lacing: string
  hakama: string
  sleeve: string
  skin: string
  hair: string
  fan: string
  fanRib: string
  saya: string
  tsuka: string
}

const REAL: Palette = {
  armor: '#a9332c',
  lacing: '#2a2226',
  hakama: '#2f3443',
  sleeve: '#262a3a',
  skin: '#e8c39e',
  hair: '#18161a',
  fan: GOLD,
  fanRib: '#b5821a',
  saya: '#1d1b1e',
  tsuka: '#e9e0cc',
}

// o reflexo: mesmos objetos, tons lavados de prata (imagem no vidro)
const MIRROR: Palette = {
  armor: '#e2a49c',
  lacing: '#9a909b',
  hakama: '#9ca4b8',
  sleeve: '#929ab0',
  skin: '#f6e2cf',
  hair: '#6c7180',
  fan: '#f4e2a8',
  fanRib: '#d8c48c',
  saya: '#7f8494',
  tsuka: '#f4efe4',
}

const GY = 0.2 // topo do tatame
const PIV = 0.46 // quadril: pivô da reverência
const BOW = 0.85 // a reverência mais funda da vida
const SAM: [number, number, number] = [-0.82, GY, 0.12]
const SAM_SCALE = 1.22
const MIR: [number, number, number] = [0.9, GY, -0.36]
const MIR_ROT = -0.15
const PANE_W = 1.18
const PANE_H = 1.6
const PANE_Y = 0.2 // base do vidro, acima do tatame
const REFL_K = 0.96
const SHOULDER = 0.19 * 1.5 // deslocamento do pivô de shoulderPivot()
const SCROLL_TOP = 2.47
const SCROLL_X = -1.28

/** Traço de pincel grosso: caixinha fina no plano xy. */
function stroke(w: number, h: number, x: number, y: number) {
  const s = rbox(w, h, 0.014, 0.008, INK, { roughness: 0.7 })
  s.position.set(x, y, 0)
  return s
}

/** H E L G — letras de traço grosso empilhadas no pergaminho vertical. */
function letter(which: 'H' | 'E' | 'L' | 'G') {
  const g = new THREE.Group()
  const t = 0.036
  const h = 0.17
  const top = h / 2 - t / 2
  if (which === 'H') {
    g.add(stroke(t, h, -0.048, 0), stroke(t, h, 0.048, 0), stroke(0.09, t, 0, 0))
  } else if (which === 'E') {
    g.add(stroke(t, h, -0.048, 0))
    g.add(stroke(0.11, t, 0.008, top), stroke(0.085, t, -0.004, 0), stroke(0.11, t, 0.008, -top))
  } else if (which === 'L') {
    g.add(stroke(t, h, -0.048, 0), stroke(0.11, t, 0.008, -top))
  } else {
    g.add(stroke(t, h, -0.048, 0))
    g.add(stroke(0.11, t, 0.008, top), stroke(0.11, t, 0.008, -top))
    g.add(stroke(t, 0.075, 0.048, -0.042), stroke(0.055, t, 0.03, -0.004))
  }
  return g
}

/**
 * Samurai virado para +z, pés em y=0. `tronco` gira em rotation.x no quadril
 * (a reverência); `leque` é filho da mão; `katana` presa na faixa da cintura.
 */
function makeSamurai(p: Palette) {
  const root = new THREE.Group()

  // ---- da cintura pra baixo: hakama + saia de lâminas (kusazuri) ----------
  const hakama = lathe(
    [[0, 0], [0.37, 0], [0.38, 0.03], [0.34, 0.18], [0.29, 0.36], [0.25, 0.47], [0, 0.47]],
    p.hakama,
    { roughness: 0.9 },
  )
  root.add(hakama)
  const hem = torus(0.365, 0.02, p.lacing, { roughness: 0.85 })
  hem.rotation.x = Math.PI / 2
  hem.position.y = 0.035
  root.add(hem)

  // pés de tabi + zori aparecendo na barra
  for (const side of [-1, 1]) {
    const sole = rbox(0.13, 0.03, 0.26, 0.012, '#6b5238', { roughness: 0.85 })
    sole.position.set(side * 0.12, 0.015, 0.26)
    root.add(sole)
    const tabi = rbox(0.11, 0.08, 0.2, 0.04, '#e9e4da', { roughness: 0.85 })
    tabi.position.set(side * 0.12, 0.065, 0.27)
    root.add(tabi)
  }

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    const lame = new THREE.Group()
    lame.rotation.y = a
    const plate = rbox(0.2, 0.25, 0.04, 0.015, p.armor, { roughness: 0.35 })
    plate.position.set(0, 0.34, 0.3)
    plate.rotation.x = 0.22
    lame.add(plate)
    for (const ly of [0.29, 0.38]) {
      const lace = rbox(0.19, 0.016, 0.012, 0.005, p.lacing, { roughness: 0.8 })
      lace.position.set(0, ly, 0.3 + (0.47 - ly) * 0.22 + 0.01)
      lace.rotation.x = 0.22
      lame.add(lace)
    }
    root.add(lame)
  }

  const obi = torus(0.255, 0.045, p.lacing, { roughness: 0.85 })
  obi.rotation.x = Math.PI / 2
  obi.position.y = PIV
  root.add(obi)

  // ---- katana na cintura (lado esquerdo do samurai = +x local) ------------
  const katana = new THREE.Group()
  katana.position.set(0.3, PIV, 0.02)
  katana.rotation.x = -0.32 // cabo pra frente e pra cima
  const saya = capsule(0.03, 0.7, p.saya, { roughness: 0.25 })
  saya.rotation.x = Math.PI / 2
  saya.position.z = -0.3
  katana.add(saya)
  const kojiri = sphere(0.036, '#5a4a32', { roughness: 0.35, metalness: 0.6 })
  kojiri.position.z = -0.68
  katana.add(kojiri)
  const tsuba = cylinder(0.07, 0.07, 0.022, '#5a4a32', { roughness: 0.35, metalness: 0.6 })
  tsuba.rotation.x = Math.PI / 2
  tsuba.position.z = 0.08
  katana.add(tsuba)
  const tsuka = capsule(0.029, 0.2, p.tsuka, { roughness: 0.7 })
  tsuka.rotation.x = Math.PI / 2
  tsuka.position.z = 0.215
  katana.add(tsuka)
  for (let i = 0; i < 4; i++) {
    const wrap = torus(0.031, 0.011, p.saya, { roughness: 0.7 })
    wrap.position.z = 0.13 + i * 0.055
    katana.add(wrap)
  }
  root.add(katana)

  // ---- tronco: person() com armadura, gira no quadril ---------------------
  const tronco = new THREE.Group()
  tronco.position.y = PIV
  root.add(tronco)

  const body = person({ body: p.sleeve, skin: p.skin, height: 1.5, armAngle: 0.12 })
  body.position.y = -PIV
  tronco.add(body)
  // o corpo inteiro do person() iria girar com os pés: a armadura faz o torso
  const bodyMesh = body.getObjectByName('body')
  if (bodyMesh) bodyMesh.visible = false

  const doo = lathe(
    [[0, -0.05], [0.235, -0.05], [0.25, 0.04], [0.27, 0.15], [0.276, 0.24], [0.25, 0.31], [0.15, 0.345], [0, 0.35]],
    p.armor,
    { roughness: 0.32 },
  )
  tronco.add(doo)
  for (const [ly, r] of [[0.0, 0.252], [0.075, 0.262], [0.15, 0.272]] as const) {
    const lace = torus(r, 0.012, p.lacing, { roughness: 0.8 })
    lace.rotation.x = Math.PI / 2
    lace.position.y = ly
    tronco.add(lace)
  }
  // placa do peito (munaita)
  const chest = rbox(0.3, 0.1, 0.05, 0.02, p.lacing, { roughness: 0.4 })
  chest.position.set(0, 0.27, 0.22)
  chest.rotation.x = -0.35
  tronco.add(chest)

  const neck = cylinder(0.09, 0.1, 0.12, p.skin, { roughness: 0.6 })
  neck.position.y = 0.37
  tronco.add(neck)

  const head = body.getObjectByName('head') as THREE.Group
  // cabelo: capa preta no alto/atrás + coque no topo
  const hair = sphere(0.27, p.hair, { roughness: 0.7 })
  hair.position.set(0, 0.11, -0.07)
  hair.scale.set(1.06, 0.82, 1.0)
  head.add(hair)
  const bun = capsule(0.055, 0.12, p.hair, { roughness: 0.6 })
  bun.rotation.x = Math.PI / 2 - 0.25
  bun.position.set(0, 0.33, 0.0)
  head.add(bun)
  const tie = torus(0.05, 0.016, p.lacing, { roughness: 0.6 })
  tie.position.set(0, 0.32, -0.07)
  head.add(tie)
  // bigode e sobrancelhas grossas
  for (const side of [-1, 1]) {
    const mus = capsule(0.018, 0.1, p.hair, { roughness: 0.6 })
    mus.rotation.z = side * 1.15
    mus.position.set(side * 0.06, -0.095, 0.262)
    head.add(mus)
    const brow = rbox(0.11, 0.028, 0.03, 0.012, p.hair, { roughness: 0.6 })
    brow.position.set(side * 0.11, 0.11, 0.245)
    brow.rotation.z = -side * 0.25
    head.add(brow)
  }
  // boca aberta: DÊ-SÁMA!
  const mouth = sphere(0.045, '#4a2420', { roughness: 0.7 })
  mouth.position.set(0, -0.15, 0.245)
  mouth.scale.set(1, 0.8, 0.6)
  head.add(mouth)

  // braços com mangas escuras + ombreiras (sode)
  for (const name of ['armL', 'armR']) {
    const arm = body.getObjectByName(name) as THREE.Mesh
    const side = name === 'armL' ? -1 : 1
    shoulderPivot(arm, 1.5) // pivô no ombro: daqui pra baixo, y relativo ao ombro
    arm.rotation.x = side < 0 ? -0.6 : -0.12 // a mão do leque vem à frente
    const sode = rbox(0.05, 0.25, 0.24, 0.02, p.armor, { roughness: 0.35 })
    sode.position.set(side * 0.1, 0.1 - SHOULDER, 0)
    sode.rotation.z = side * 0.18
    arm.add(sode)
    for (const ly of [0.05, 0.15]) {
      const lace = rbox(0.012, 0.016, 0.22, 0.005, p.lacing, { roughness: 0.8 })
      lace.position.set(side * 0.13, ly - 0.005 - SHOULDER, 0)
      lace.rotation.z = side * 0.18
      arm.add(lace)
    }
  }

  // ---- leque fechado na mão do lado de fora (-x local) --------------------
  const armL = body.getObjectByName('armL') as THREE.Object3D
  const leque = new THREE.Group()
  leque.position.set(0, -0.3 - SHOULDER, 0.04)
  leque.rotation.x = 1.25 // aponta pra frente, um pouco pra baixo
  armL.add(leque)
  const blades = rbox(0.075, 0.46, 0.05, 0.018, p.fan, { roughness: 0.3, metalness: 0.5 })
  blades.position.y = 0.2
  leque.add(blades)
  for (const sx of [-1, 1]) {
    const rib = rbox(0.014, 0.46, 0.054, 0.005, p.fanRib, { roughness: 0.35, metalness: 0.5 })
    rib.position.set(sx * 0.033, 0.2, 0)
    leque.add(rib)
  }
  // dobras do leque: sulcos ao longo das varetas
  for (const gx of [-0.012, 0.012]) {
    const groove = rbox(0.006, 0.4, 0.056, 0.002, p.fanRib, { roughness: 0.4, metalness: 0.5 })
    groove.position.set(gx, 0.22, 0)
    leque.add(groove)
  }
  const tassel = capsule(0.018, 0.08, p.lacing, { roughness: 0.8 })
  tassel.position.set(0, -0.08, 0)
  leque.add(tassel)
  const rivet = cylinder(0.02, 0.02, 0.07, p.lacing, { roughness: 0.4 })
  rivet.rotation.z = Math.PI / 2
  rivet.position.y = -0.02
  leque.add(rivet)

  return { root, tronco, leque, katana }
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: plataforma de madeira + tatame em placas ----------------------
  const base = new THREE.Group()
  const plat = cylinder(2.62, 2.72, 0.14, BASE_WOOD, { roughness: 0.8 })
  plat.position.y = 0.07
  base.add(plat)

  // placas de tatame (2:1) com a faixa escura (heri) nas bordas longas
  const MAT_L = 1.3
  const MAT_W = 0.65
  const mats: [number, number, boolean][] = [] // [x, z, comprido em x]
  for (const x of [-MAT_L, 0, MAT_L]) mats.push([x, -1.2 + MAT_W / 2, true])
  for (let i = 0; i < 6; i++) mats.push([-1.95 + MAT_W / 2 + i * MAT_W, -1.2 + MAT_W + MAT_L / 2, false])
  for (const x of [-MAT_L, 0, MAT_L]) mats.push([x, -1.2 + MAT_W + MAT_L + MAT_W / 2, true])
  mats.forEach(([x, z, alongX], i) => {
    const w = alongX ? MAT_L : MAT_W
    const d = alongX ? MAT_W : MAT_L
    const m = rbox(w - 0.02, 0.06, d - 0.02, 0.012, i % 2 ? TATAMI : TATAMI_ALT, { roughness: 0.9 })
    m.position.set(x, GY - 0.03, z)
    base.add(m)
    for (const s of [-1, 1]) {
      const heri = rbox(alongX ? w - 0.03 : 0.045, 0.008, alongX ? 0.045 : d - 0.03, 0.004, HERI, { roughness: 0.85 })
      heri.position.set(
        x + (alongX ? 0 : s * (w / 2 - 0.035)),
        GY + 0.002,
        z + (alongX ? s * (d / 2 - 0.035) : 0),
      )
      base.add(heri)
    }
  })
  root.add(base)

  // ---- parede de shoji ao fundo --------------------------------------------
  const parede = new THREE.Group()
  const WALL_Z = -1.32
  const WALL_H = 2.3
  for (const px of [-1.95, -0.65, 0.65, 1.95]) {
    const post = rbox(0.12, WALL_H + 0.1, 0.13, 0.02, WOOD_DARK, { roughness: 0.75 })
    post.position.set(px, GY + (WALL_H + 0.1) / 2, WALL_Z)
    parede.add(post)
  }
  const lintel = rbox(4.06, 0.15, 0.15, 0.03, WOOD_DARK, { roughness: 0.75 })
  lintel.position.set(0, GY + WALL_H + 0.06, WALL_Z)
  parede.add(lintel)
  for (const cx of [-1.3, 0, 1.3]) {
    const koshi = rbox(1.2, 0.32, 0.07, 0.015, WOOD, { roughness: 0.75 })
    koshi.position.set(cx, GY + 0.16, WALL_Z)
    parede.add(koshi)
    const paper = rbox(1.18, WALL_H - 0.36, 0.03, 0.01, PAPER, { roughness: 0.92 })
    paper.position.set(cx, GY + 0.32 + (WALL_H - 0.36) / 2, WALL_Z)
    parede.add(paper)
    for (let k = 1; k <= 3; k++) {
      const v = rbox(0.022, WALL_H - 0.36, 0.024, 0.006, KUMIKO, { roughness: 0.8 })
      v.position.set(cx - 0.59 + k * 0.295, GY + 0.32 + (WALL_H - 0.36) / 2, WALL_Z + 0.02)
      parede.add(v)
    }
    for (let k = 1; k <= 4; k++) {
      const hz = rbox(1.18, 0.022, 0.024, 0.006, KUMIKO, { roughness: 0.8 })
      hz.position.set(cx, GY + 0.32 + k * ((WALL_H - 0.36) / 5), WALL_Z + 0.02)
      parede.add(hz)
    }
  }
  root.add(parede)

  // ---- pergaminho HELG (pivô no gancho: desce do teto e balança) -----------
  const pergaminho = new THREE.Group()
  pergaminho.position.set(SCROLL_X, SCROLL_TOP, WALL_Z + 0.09)
  const hook = cylinder(0.018, 0.018, 0.06, '#8a7a5a', { roughness: 0.4, metalness: 0.6 })
  hook.rotation.x = Math.PI / 2
  hook.position.set(0, 0, -0.03)
  pergaminho.add(hook)
  for (const s of [-1, 1]) {
    const cord = cylinder(0.008, 0.008, 0.2, '#6b5a3c', { roughness: 0.9 })
    cord.position.set(s * 0.12, -0.08, 0)
    cord.rotation.z = s * 1.0
    pergaminho.add(cord)
  }
  const rod = cylinder(0.022, 0.022, 0.6, WOOD_DARK, { roughness: 0.6 })
  rod.rotation.z = Math.PI / 2
  rod.position.y = -0.15
  pergaminho.add(rod)
  const SC_H = 1.1
  const brocade = rbox(0.54, SC_H, 0.012, 0.006, BROCADE, { roughness: 0.75 })
  brocade.position.y = -0.15 - SC_H / 2
  pergaminho.add(brocade)
  const scrollPaper = rbox(0.42, SC_H - 0.26, 0.014, 0.006, SCROLL_PAPER, { roughness: 0.85 })
  scrollPaper.position.set(0, -0.15 - SC_H / 2 + 0.02, 0.008)
  pergaminho.add(scrollPaper)
  const glyphs: ['H' | 'E' | 'L' | 'G', number][] = [['H', 0], ['E', 1], ['L', 2], ['G', 3]]
  for (const [gl, i] of glyphs) {
    const l = letter(gl)
    l.position.set(0, -0.15 - 0.24 - i * 0.2, 0.018)
    pergaminho.add(l)
  }
  // selo vermelho-tijolo apagado (não compete com o leque)
  const seal = rbox(0.05, 0.05, 0.012, 0.006, '#9a4a3c', { roughness: 0.7 })
  seal.position.set(0.12, -0.15 - SC_H + 0.2, 0.018)
  pergaminho.add(seal)
  const roller = cylinder(0.034, 0.034, 0.56, WOOD_DARK, { roughness: 0.6 })
  roller.rotation.z = Math.PI / 2
  roller.position.y = -0.15 - SC_H
  pergaminho.add(roller)
  for (const s of [-1, 1]) {
    const knob = sphere(0.045, '#c9b48a', { roughness: 0.4 })
    knob.position.set(s * 0.3, -0.15 - SC_H, 0)
    pergaminho.add(knob)
  }
  root.add(pergaminho)

  // ---- espelho gigante em pé -----------------------------------------------
  const espelho = new THREE.Group()
  espelho.position.set(...MIR)
  espelho.rotation.y = MIR_ROT
  const FW = PANE_W + 0.24
  const backing = rbox(FW, PANE_H + 0.2, 0.05, 0.02, WOOD_DARK, { roughness: 0.7 })
  backing.position.set(0, PANE_Y + PANE_H / 2, -0.1)
  espelho.add(backing)
  const pane = rbox(PANE_W + 0.02, PANE_H + 0.02, 0.02, 0.005, GLASS, { roughness: 0.15, metalness: 0.25 })
  pane.position.set(0, PANE_Y + PANE_H / 2, -0.07)
  espelho.add(pane)
  // o dojo refletido no vidro: tatame e a grade do shoji ao fundo
  const reflFloor = rbox(PANE_W, 0.2, 0.012, 0.004, '#cfd3ad', { roughness: 0.6 })
  reflFloor.position.set(0, PANE_Y + 0.1, -0.055)
  espelho.add(reflFloor)
  for (const lx of [-0.3, 0.3]) {
    const gv = rbox(0.016, PANE_H - 0.2, 0.01, 0.004, GLASS_LINE, { roughness: 0.4 })
    gv.position.set(lx, PANE_Y + 0.2 + (PANE_H - 0.2) / 2, -0.056)
    espelho.add(gv)
  }
  for (const ly of [0.75, 1.25]) {
    const gh = rbox(PANE_W, 0.016, 0.01, 0.004, GLASS_LINE, { roughness: 0.4 })
    gh.position.set(0, PANE_Y + ly, -0.056)
    espelho.add(gh)
  }
  // moldura funda de madeira escura
  for (const s of [-1, 1]) {
    const side = rbox(0.13, PANE_H + 0.42, 0.3, 0.03, WOOD_DARK, { roughness: 0.6 })
    side.position.set(s * (PANE_W / 2 + 0.065), (PANE_H + 0.42) / 2, 0.04)
    espelho.add(side)
    const foot = rbox(0.17, 0.1, 0.62, 0.04, WOOD_DARK, { roughness: 0.6 })
    foot.position.set(s * (PANE_W / 2 + 0.065), 0.05, 0.04)
    espelho.add(foot)
  }
  const bottomRail = rbox(PANE_W + 0.02, 0.12, 0.3, 0.03, WOOD_DARK, { roughness: 0.6 })
  bottomRail.position.set(0, PANE_Y - 0.06, 0.04)
  espelho.add(bottomRail)
  const topRail = rbox(PANE_W + 0.02, 0.12, 0.3, 0.03, WOOD_DARK, { roughness: 0.6 })
  topRail.position.set(0, PANE_Y + PANE_H + 0.06, 0.04)
  espelho.add(topRail)
  const crest = rbox(FW + 0.3, 0.09, 0.36, 0.04, WOOD, { roughness: 0.6 })
  crest.position.set(0, PANE_Y + PANE_H + 0.165, 0.04)
  espelho.add(crest)
  // brilhos no vidro (na frente do reflexo, nos cantos)
  for (const [gx, gy, len, w] of [
    [-0.36, PANE_H - 0.3, 0.42, 0.05],
    [-0.24, PANE_H - 0.22, 0.24, 0.025],
    [0.38, 0.55, 0.3, 0.035],
  ] as const) {
    const glint = rbox(w, len, 0.008, 0.004, '#f6fbff', { roughness: 0.1 })
    glint.position.set(gx, PANE_Y + gy, 0.15)
    glint.rotation.z = -0.75
    espelho.add(glint)
  }
  root.add(espelho)

  // ---- samurai (perfil, olhando +x para o espelho) -------------------------
  const sam = makeSamurai(REAL)
  const samurai = sam.root
  samurai.position.set(...SAM)
  samurai.rotation.y = Math.PI / 2 - 0.25 // um tico virado pra câmera
  samurai.scale.setScalar(SAM_SCALE)
  sam.tronco.rotation.x = BOW
  root.add(samurai)

  // ---- reflexo: cópia espelhada, achatada contra o vidro --------------------
  const reflexo = new THREE.Group()
  reflexo.position.set(0.12, PANE_Y, 0.02)
  espelho.add(reflexo)
  const refl = makeSamurai(MIRROR)
  // de perfil olhando -x (de volta pro samurai); scale.x negativo = espelhado
  refl.root.rotation.y = -Math.PI / 2
  refl.root.scale.set(-0.3 * REFL_K, REFL_K, REFL_K)
  refl.tronco.rotation.x = BOW
  // bainha mais inclinada: a ponta some atrás da moldura em vez de vazar
  refl.katana.rotation.x = -0.62
  reflexo.add(refl.root)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'dojo', object: base },
    { name: 'parede', group: 'dojo', object: parede },
    { name: 'pergaminho', group: 'pergaminho', object: pergaminho },
    { name: 'samurai', group: 'samurai', object: samurai },
    { name: 'tronco', group: 'samurai', object: sam.tronco },
    { name: 'katana', group: 'samurai', object: sam.katana },
    { name: 'espelho', group: 'samurai', object: espelho },
    { name: 'leque', group: 'tac', object: sam.leque },
    { name: 'reflexo', group: 'reflexo', object: reflexo },
    { name: 'reflexoTronco', group: 'reflexo', object: refl.tronco },
    { name: 'reflexoLeque', group: 'reflexo', object: refl.leque },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Sexta-feira no dojo: brota o tatame verde-palha, placa por placa…',
    }),
    seq('parede-rise', 'parede', 0.25, 0.9, [riseFrom(0, 2.6)], { ease: 'easeOut' }),

    seq('pergaminho-desce', 'pergaminho', 1.6, 1.0, [ch('position.y', SCROLL_TOP + 2.6, SCROLL_TOP)], {
      ease: 'easeOut',
      caption: "…e um pergaminho desce do teto desejando 'Trevlig HELG!' — bom fim de semana!",
    }),
    seq('pergaminho-balanca', 'pergaminho', 2.6, 0.5, [ch('rotation.z', 0.12, -0.06)]),
    seq('pergaminho-assenta', 'pergaminho', 3.1, 0.5, [ch('rotation.z', -0.06, 0)]),

    seq('samurai-rise', 'samurai', 3.5, 0.85, [riseFrom(SAM[1], 1.9)], {
      ease: 'easeOut',
      caption: 'Do tatame sobe o samurai de armadura vermelha, de frente pro espelho gigante.',
    }),
    seq('tronco-ergue', 'tronco', 3.5, 0.85, [ch('rotation.x', -0.12, 0)], { ease: 'easeOut' }),
    seq('katana-encaixa', 'katana', 3.9, 0.5, [ch('position.z', 0.5, 0.02)], { ease: 'easeOut' }),
    seq('espelho-rise', 'espelho', 3.75, 0.9, [riseFrom(MIR[1], 2.4)], { ease: 'easeOut' }),

    seq('leque-aparece', 'leque', 5.2, 0.35, [...grow(), ch('rotation.x', -0.6, -0.6)], {
      ease: 'easeOut',
      caption: 'Ele ergue o leque dourado… e fecha num estalo: TAC!',
    }),
    seq('leque-tac', 'leque', 5.75, 0.16, [ch('rotation.x', -0.6, 1.25)], { ease: 'easeIn' }),

    seq('reverencia', 'tronco', 6.4, 1.1, [ch('rotation.x', 0, BOW)], {
      ease: 'easeInOut',
      caption: 'E faz a reverência mais funda da vida pro espelho, com a honra máxima: DÊ-SÁMA!',
    }),

    seq('reflexo-surge', 'reflexo', 8.1, 0.6, grow(), {
      ease: 'easeOut',
      caption: 'O reflexo devolve TUDO igualzinho: o mesmo TAC…',
    }),
    seq('reflexo-ergue', 'reflexoTronco', 8.1, 0.6, [ch('rotation.x', 0, 0)]),
    seq('reflexo-leque-ergue', 'reflexoLeque', 8.1, 0.6, [ch('rotation.x', -0.6, -0.6)]),
    seq('reflexo-tac', 'reflexoLeque', 8.8, 0.16, [ch('rotation.x', -0.6, 1.25)], { ease: 'easeIn' }),
    seq('reflexo-reverencia', 'reflexoTronco', 9.3, 1.1, [ch('rotation.x', 0, BOW)], {
      ease: 'easeInOut',
      caption: '…a mesma reverência, o mesmo DÊ-SÁMA! O desejo voltou inteiro.',
    }),

    seq('pergaminho-fim', 'pergaminho', 10.9, 0.9, [ch('rotation.z', 0, 0)], {
      caption: 'Tack detsamma! — Obrigado, igualmente!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.05, 1.72, 4.5], target: [0.0, 1.1, -0.35] },
  }
}

export const card: Card = {
  meta: {
    id: 'tack-detsamma',
    contexto:
      "Resposta a qualquer bom desejo ('Trevlig helg!', 'Ha en bra dag!', 'God jul!') — na saída do trabalho, no caixa, com o vizinho.",
    fraseFonte: 'Obrigado, igualmente!',
    fraseAlvo: 'Tack detsamma!',
    pronuncia:
      "tak de-SÁM-ma (o T de 'det' some na fala: sai 'desamma'; força no SÁM, com o M demorado; 'tack' com A curto e K seco)",
    ponteSonora:
      "TAC! DÊ-SÁMA! (3 batidas; TAC é o mesmo tapa sonoro de 'tack' das outras cartas — aqui o estalo do leque fechando; DÊ-SÁMA é o honorífico de anime, 'Senhor Dê', dito num fôlego só: o T de 'det' não aparece, DÊ curto e fechado, força no SÁ — A ABERTO, de boca escancarada, SEM o 'sã' nasal que o português põe antes de M — e o M bem demorado: SÁM-MA; e 'samma' quer dizer 'o mesmo' de verdade)",
    historia:
      "Sexta-feira no dojo: um pergaminho desce do teto desejando 'Trevlig helg!' ao samurai. Ele fecha o leque num estalo — TAC! — e faz a reverência mais funda da vida pro espelho gigante, chamando o reflexo com a honra máxima: DÊ-SÁMA! O reflexo devolve TUDO igualzinho: o mesmo TAC, a mesma reverência, o mesmo DÊ-SÁMA. O desejo voltou inteiro — obrigado, igualmente.",
  },
  createScene,
}

export default card
