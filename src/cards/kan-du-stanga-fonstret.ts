import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Kan du stänga fönstret?" — CAN-DU... STÉNG-A... FFF-ÔNSTR... ÉT(a)?
 *
 * Fevereiro, -15 °C: a janela escancarada virou a bocarra de um MONSTRO de
 * gelo (pingentes de dentes, olhos de gelo, cortina vermelha de língua) que
 * sopra o bafo FFFFF... ÔNSTR! na SAMBISTA de paetê e costeiro de plumas,
 * que cruza os braços batendo os dentes. O vermelho saturado é RESERVADO à
 * língua-cortina do monstro.
 */

const SOIL = '#3a2c20'
const WOOD_A = '#b98a55'
const WOOD_B = '#a5774a'
const WOOD_C = '#c69a64'
const WALL = '#e6d6b8'
const WALL_TRIM = '#cdb894'
const FRAME = '#f3f1ec'
const ICE = '#a9dcf0'
const ICE_DEEP = '#5fa9d2'
const NIGHT = '#1f2f52'
const SNOW = '#f4f8fb'
const CURTAIN = '#d0243a' // acento saturado: a língua do monstro
const SKIN = '#a8714c'
const GOLD = '#d9a93a'
const PINK = '#e9a0c0'
const YELLOW = '#f0d68a'
const LIPS = '#6a3d8f'
const HAIR = '#2e2019'

const GY = 0.18
const WZ = -1.3 // centro da parede
const WX = -1.05 // centro da janela
const WY0 = 0.95
const WY1 = 2.3
const WYC = (WY0 + WY1) / 2
const SAMBA: [number, number, number] = [0.85, GY, 0.05]
const LEAF_OPEN = 1.15

function tube(points: [number, number, number][], r: number, color: string, opts: Parameters<typeof mat>[1] = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, r, 12, false), mat(color, { ...opts, size: 1 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function flake(size: number) {
  const g = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const arm = rbox(size, 0.022, 0.022, 0.009, SNOW, { roughness: 0.4 })
    arm.rotation.z = (i * Math.PI) / 3
    g.add(arm)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(77)

  // ---- chão: tacos em trama de cesto -------------------------------------
  const chao = new THREE.Group()
  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.95 })
  soil.position.y = 0.06
  chao.add(soil)
  const disc = cylinder(2.56, 2.62, 0.05, WOOD_B, { roughness: 0.8 })
  disc.position.y = GY - 0.045
  chao.add(disc)
  const protos = [WOOD_A, WOOD_B, WOOD_C].map((c) => rbox(0.4, 0.025, 0.13, 0.01, c, { roughness: 0.7 }))
  const CELL = 0.42
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      const cx = i * CELL
      const cz = j * CELL
      if (Math.hypot(cx, cz) > 2.3 || cz < WZ + 0.05) continue
      for (let k = -1; k <= 1; k++) {
        const s = protos[Math.floor(rand() * 3)].clone()
        if ((i + j) % 2 === 0) s.position.set(cx, GY - 0.0125, cz + k * 0.138)
        else {
          s.rotation.y = Math.PI / 2
          s.position.set(cx + k * 0.138, GY - 0.0125, cz)
        }
        chao.add(s)
      }
    }
  }
  root.add(chao)

  // ---- parede bege com o vão da janela ------------------------------------
  const parede = new THREE.Group()
  const TOPW = 3.05
  const wallPiece = (x0: number, x1: number, y0: number, y1: number) => {
    const p = rbox(x1 - x0, y1 - y0, 0.16, 0.02, WALL, { roughness: 0.85 })
    p.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ)
    parede.add(p)
  }
  wallPiece(-2.25, WX - 0.55, GY, TOPW)
  wallPiece(WX + 0.55, 2.25, GY, TOPW)
  wallPiece(WX - 0.55, WX + 0.55, GY, WY0)
  wallPiece(WX - 0.55, WX + 0.55, WY1, TOPW)
  const rodape = rbox(4.5, 0.12, 0.05, 0.02, WALL_TRIM, { roughness: 0.7 })
  rodape.position.set(0, GY + 0.06, WZ + 0.1)
  parede.add(rodape)
  // a noite de inverno lá fora: o fundo da garganta do monstro
  const night = rbox(1.5, 1.7, 0.05, 0.02, NIGHT, { roughness: 0.9 })
  night.position.set(WX, WYC, WZ - 0.35)
  parede.add(night)
  for (let i = 0; i < 6; i++) {
    const f = flake(0.08)
    f.position.set(WX - 0.4 + rand() * 0.8, WY0 + 0.2 + rand() * 1.0, WZ - 0.3)
    parede.add(f)
  }
  // quadrinho de sol tropical: a saudade da sambista
  const quadro = rbox(0.5, 0.4, 0.04, 0.02, '#8a6a45', { roughness: 0.6 })
  quadro.position.set(1.65, 2.55, WZ + 0.1)
  const tela = rbox(0.42, 0.32, 0.02, 0.01, '#7fc6e0', { roughness: 0.8 })
  tela.position.z = 0.02
  quadro.add(tela)
  const sol = cylinder(0.08, 0.08, 0.02, '#f2b52b', { roughness: 0.6 })
  sol.rotation.x = Math.PI / 2
  sol.position.set(0.08, 0.04, 0.035)
  quadro.add(sol)
  parede.add(quadro)
  root.add(parede)

  // ---- moldura branca da janela -------------------------------------------
  const janela = new THREE.Group()
  janela.position.set(WX, WYC, WZ)
  const H = WY1 - WY0
  for (const sx of [-1, 1]) {
    const post = rbox(0.1, H + 0.2, 0.26, 0.03, FRAME, { roughness: 0.4 })
    post.position.set(sx * 0.6, 0, 0.06)
    janela.add(post)
  }
  const lintel = rbox(1.3, 0.1, 0.26, 0.03, FRAME, { roughness: 0.4 })
  lintel.position.set(0, H / 2 + 0.05, 0.06)
  janela.add(lintel)
  const sill = rbox(1.36, 0.08, 0.38, 0.03, FRAME, { roughness: 0.4 })
  sill.position.set(0, -H / 2 - 0.04, 0.1)
  janela.add(sill)
  const snowCap = rbox(1.32, 0.08, 0.2, 0.04, SNOW, { roughness: 0.9 })
  snowCap.position.set(0, H / 2 + 0.13, 0.1)
  janela.add(snowCap)
  root.add(janela)

  // ---- folhas de vidro escancaradas ---------------------------------------
  const glassMat = mat('#cfeaf5', { roughness: 0.08, detail: 0 })
  glassMat.transparent = true
  glassMat.opacity = 0.35
  const makeLeaf = (side: -1 | 1) => {
    const g = new THREE.Group()
    g.position.set(WX + side * 0.52, WYC, WZ + 0.14)
    const off = -side * 0.26
    for (const sx of [-1, 1]) {
      const st = rbox(0.06, 1.3, 0.06, 0.02, FRAME, { roughness: 0.4 })
      st.position.set(off + sx * 0.23, 0, 0)
      g.add(st)
    }
    for (const sy of [-1, 0, 1]) {
      const rail = rbox(0.52, 0.06, 0.06, 0.02, FRAME, { roughness: 0.4 })
      rail.position.set(off, sy * 0.62, 0)
      g.add(rail)
    }
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.2, 0.015), glassMat)
    glass.position.set(off, 0, 0)
    g.add(glass)
    const frost = puff(0.08, SNOW, 4, 5 + side, { roughness: 0.9 })
    frost.position.set(off - side * 0.15, -0.55, 0.03)
    frost.scale.z = 0.4
    g.add(frost)
    g.rotation.y = side * LEAF_OPEN
    root.add(g)
    return g
  }
  const folhaL = makeLeaf(-1)
  const folhaR = makeLeaf(1)

  // ---- pingentes de gelo: os dentes ---------------------------------------
  const dentes = new THREE.Group()
  dentes.position.set(WX, WY1, WZ + 0.2)
  const lens = [0.22, 0.34, 0.26, 0.4, 0.28, 0.36, 0.2]
  lens.forEach((len, i) => {
    const ic = cone(0.06, len, ICE, { roughness: 0.15 })
    ic.rotation.x = Math.PI
    ic.position.set(-0.45 + i * 0.15, -len / 2, 0)
    dentes.add(ic)
  })
  for (const x of [-0.47, -0.35, 0.35, 0.47]) {
    const t = cone(0.05, 0.2, ICE, { roughness: 0.15 })
    t.position.set(x, -H + 0.1, 0.02)
    dentes.add(t)
  }
  root.add(dentes)

  // ---- olhos de gelo acima da moldura -------------------------------------
  const olhos = new THREE.Group()
  olhos.position.set(WX, 2.65, WZ + 0.1)
  for (const side of [-1, 1]) {
    const eye = sphere(0.17, '#eaf7fd', { roughness: 0.2 })
    eye.position.set(side * 0.3, 0, 0)
    eye.scale.z = 0.55
    olhos.add(eye)
    const iris = sphere(0.1, ICE_DEEP, { roughness: 0.2 })
    iris.position.set(side * 0.3 + 0.05, -0.03, 0.06)
    iris.scale.z = 0.5
    olhos.add(iris)
    const pupil = sphere(0.055, '#14203a', { roughness: 0.2 })
    pupil.position.set(side * 0.3 + 0.06, -0.035, 0.09)
    pupil.scale.z = 0.5
    olhos.add(pupil)
    const glint = sphere(0.02, '#ffffff', { roughness: 0.1 })
    glint.position.set(side * 0.3 + 0.03, 0.01, 0.115)
    olhos.add(glint)
    const brow = rbox(0.34, 0.07, 0.08, 0.03, ICE_DEEP, { roughness: 0.2 })
    brow.position.set(side * 0.3, 0.21, 0.04)
    brow.rotation.z = side * 0.3
    olhos.add(brow)
  }
  root.add(olhos)

  // ---- cortina vermelha que sai como língua -------------------------------
  const lingua = new THREE.Group()
  lingua.position.set(WX, WY0 + 0.02, WZ + 0.05)
  const path: [number, number, number][] = [
    [0, 0.04, -0.1], [0, 0.08, 0.2], [0.03, -0.12, 0.42], [0.08, -0.5, 0.6],
    [0.14, -0.71, 0.85], [0.3, -0.72, 1.2], [0.5, -0.7, 1.5], [0.66, -0.6, 1.7], [0.66, -0.47, 1.62],
  ]
  for (const dx of [-0.18, -0.06, 0.06, 0.18]) {
    lingua.add(tube(path.map(([x, y, z]) => [x + dx, y, z] as [number, number, number]), 0.075, CURTAIN, { roughness: 0.85 }))
  }
  root.add(lingua)

  // ---- vento gelado em faixas com flocos + montes de neve -----------------
  const vento = new THREE.Group()
  vento.position.set(WX, WYC, WZ + 0.2)
  const gusts: [number, number, number][] = [[0.35, 1.55, 0.35], [-0.1, 1.75, 0.9], [0.4, 1.8, -0.25]]
  for (const [y0, dx, dy] of gusts) {
    const pts: [number, number, number][] = []
    for (let k = 0; k <= 6; k++) {
      const t = k / 6
      pts.push([t * dx, y0 + Math.sin(t * Math.PI * 2) * 0.1 + t * dy * 0.3, t * 1.25])
    }
    const [ex, ey, ez] = pts[pts.length - 1]
    for (let k = 1; k <= 8; k++) {
      const a = -Math.PI / 2 + (k / 8) * Math.PI * 1.6
      const r = 0.16 * (1 - k / 12)
      pts.push([ex + Math.cos(a) * r * 0.8, ey + 0.16 + Math.sin(a) * r, ez + Math.cos(a) * r * 0.4])
    }
    vento.add(tube(pts, 0.035, '#cdeaf7', { roughness: 0.3 }))
  }
  for (let i = 0; i < 9; i++) {
    const f = flake(0.1 + rand() * 0.06)
    f.position.set(0.2 + rand() * 1.5, -0.1 + rand() * 1.0, 0.2 + rand() * 1.0)
    f.rotation.z = rand()
    vento.add(f)
  }
  for (const [x, z, r] of [[-0.5, -0.95, 0.22], [0.42, -0.85, 0.18]] as const) {
    const pile = puff(r, SNOW, 5, 9, { roughness: 0.9 })
    pile.position.set(x, GY - WYC + r * 0.3, z - (WZ + 0.2))
    pile.scale.y = 0.5
    vento.add(pile)
  }
  root.add(vento)

  // ---- sambista ------------------------------------------------------------
  const sambista = new THREE.Group()
  sambista.position.set(...SAMBA)
  sambista.rotation.y = -0.2
  sambista.scale.setScalar(1.15)
  const p = person({ body: SKIN, skin: SKIN, height: 1.5, armAngle: 0.45 })
  sambista.add(p)

  const goldOpts = { roughness: 0.3, metalness: 0.6 }
  const topBand = torus(0.262, 0.03, GOLD, goldOpts)
  topBand.rotation.x = Math.PI / 2
  topBand.position.y = 0.56
  p.add(topBand)
  for (const sx of [-1, 1]) {
    const cup = sphere(0.1, GOLD, goldOpts)
    cup.position.set(sx * 0.1, 0.58, 0.2)
    cup.scale.set(1, 0.8, 0.55)
    p.add(cup)
  }
  const bottom = torus(0.258, 0.045, GOLD, goldOpts)
  bottom.rotation.x = Math.PI / 2
  bottom.position.y = 0.24
  p.add(bottom)
  for (let i = 0; i < 7; i++) {
    const a = -0.9 + i * 0.3
    const tassel = capsule(0.018, 0.14, GOLD, goldOpts)
    tassel.position.set(Math.sin(a) * 0.27, 0.14, Math.cos(a) * 0.27)
    p.add(tassel)
  }

  const head = p.getObjectByName('head') as THREE.Group
  const teeth = rbox(0.13, 0.045, 0.03, 0.012, '#ffffff', { roughness: 0.3 })
  teeth.position.set(0, -0.12, 0.262)
  head.add(teeth)
  const lips = torus(0.075, 0.022, LIPS, { roughness: 0.5 })
  lips.position.set(0, -0.12, 0.258)
  lips.scale.y = 0.55
  head.add(lips)
  const hair = puff(0.2, HAIR, 5, 13, { roughness: 0.9 })
  hair.position.set(0, 0.05, -0.12)
  hair.scale.set(1.4, 1.2, 1)
  head.add(hair)
  const coroa = new THREE.Group()
  coroa.position.y = 0.2
  coroa.rotation.x = -0.12
  coroa.add(lathe([[0.2, 0], [0.215, 0.1], [0.2, 0.1], [0.185, 0]], GOLD, goldOpts))
  for (let i = 0; i < 5; i++) {
    const a = -1.0 + i * 0.5
    const spike = cone(0.035, 0.12, GOLD, goldOpts)
    spike.position.set(Math.sin(a) * 0.205, 0.15, Math.cos(a) * 0.205)
    coroa.add(spike)
    const gem = sphere(0.025, i % 2 ? PINK : ICE_DEEP, { roughness: 0.15 })
    gem.position.set(Math.sin(a) * 0.218, 0.05, Math.cos(a) * 0.218)
    coroa.add(gem)
  }
  head.add(coroa)

  const bracoL = p.getObjectByName('armL') as THREE.Object3D
  const bracoR = p.getObjectByName('armR') as THREE.Object3D
  shoulderPivot(bracoL, 1.5)
  shoulderPivot(bracoR, 1.5)
  bracoL.rotation.set(-1.1, 0, 0.95)
  bracoR.rotation.set(-1.3, 0, -0.95)
  root.add(sambista)

  // ---- costeiro de plumas com pontas congeladas ---------------------------
  const costeiro = new THREE.Group()
  costeiro.position.set(0, 0.62, -0.3)
  const plume = (angle: number, len: number, color: string, z: number) => {
    const g = new THREE.Group()
    g.rotation.z = angle
    g.position.z = z
    const f = capsule(0.085, len, color, { roughness: 0.9 })
    f.position.y = len / 2 + 0.12
    f.scale.set(1.5, 1, 0.35)
    g.add(f)
    const tip = capsule(0.09, 0.1, SNOW, { roughness: 0.6 })
    tip.position.y = len + 0.2
    tip.scale.set(1.5, 1, 0.38)
    g.add(tip)
    const spike = cone(0.03, 0.12, SNOW, { roughness: 0.4 })
    spike.position.y = len + 0.33
    g.add(spike)
    costeiro.add(g)
  }
  for (let i = 0; i < 11; i++) {
    const a = -1.4 + i * 0.28
    plume(a, 1.05 - Math.abs(a) * 0.15, i % 2 ? YELLOW : PINK, -0.05)
  }
  for (let i = 0; i < 9; i++) {
    const a = -1.2 + i * 0.3
    plume(a, 0.7, i % 2 ? PINK : YELLOW, 0.02)
  }
  const pack = rbox(0.42, 0.36, 0.12, 0.04, GOLD, goldOpts)
  pack.position.z = 0.06
  costeiro.add(pack)
  sambista.add(costeiro)

  // ---- pandeiro caído com geada -------------------------------------------
  const pandeiro = new THREE.Group()
  pandeiro.position.set(0.05, GY + 0.04, 1.05)
  pandeiro.rotation.set(0.25, 0.4, 0.1)
  pandeiro.add(lathe([[0.25, -0.04], [0.25, 0.04], [0.22, 0.04], [0.22, -0.04]], '#8a5a32', { roughness: 0.6 }))
  const pele = cylinder(0.225, 0.225, 0.01, '#efe6d2', { roughness: 0.8 })
  pele.position.y = 0.035
  pandeiro.add(pele)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const jingle = cylinder(0.04, 0.04, 0.015, '#c9cdd2', { roughness: 0.3, metalness: 0.8 })
    jingle.rotation.x = Math.PI / 2
    jingle.rotation.y = a
    jingle.position.set(Math.sin(a) * 0.255, 0, Math.cos(a) * 0.255)
    pandeiro.add(jingle)
  }
  for (let i = 0; i < 3; i++) {
    const g = puff(0.06, SNOW, 4, 20 + i, { roughness: 0.9 })
    g.position.set(-0.1 + i * 0.1, 0.045, -0.05 + (i % 2) * 0.1)
    g.scale.y = 0.35
    pandeiro.add(g)
  }
  root.add(pandeiro)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'chao', group: 'sala', object: chao },
    { name: 'parede', group: 'sala', object: parede },
    { name: 'janela', group: 'janela', object: janela },
    { name: 'folhaL', group: 'janela', object: folhaL },
    { name: 'folhaR', group: 'janela', object: folhaR },
    { name: 'dentes', group: 'monstro', object: dentes },
    { name: 'olhos', group: 'monstro', object: olhos },
    { name: 'lingua', group: 'monstro', object: lingua },
    { name: 'vento', group: 'sopro', object: vento },
    { name: 'sambista', group: 'sambista', object: sambista },
    { name: 'bracoL', group: 'sambista', object: bracoL },
    { name: 'bracoR', group: 'sambista', object: bracoR },
    { name: 'costeiro', group: 'sambista', object: costeiro },
    { name: 'pandeiro', group: 'frio', object: pandeiro },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  const build = [
    seq('chao-rise', 'chao', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Fevereiro, quinze graus abaixo de zero: brota a sala de tacos…',
    }),
    seq('parede-rise', 'parede', 0.25, 0.9, [riseFrom(0, 3.2)], { ease: 'easeOut' }),

    seq('janela-pop', 'janela', 1.4, 0.6, grow(), {
      ease: 'easeOut',
      caption: '…e alguém deixou a JANELA escancarada.',
    }),
    seq('folhaL-abre', 'folhaL', 1.7, 0.8, [ch('rotation.y', 0, -LEAF_OPEN)], { ease: 'easeOut' }),
    seq('folhaR-abre', 'folhaR', 1.8, 0.8, [ch('rotation.y', 0, LEAF_OPEN)], { ease: 'easeOut' }),

    seq('dentes-crescem', 'dentes', 3.0, 0.7, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Ela vira a bocarra de um MONSTRO de gelo: pingentes de dentes, cortina de língua.',
    }),
    seq('olhos-abrem', 'olhos', 3.3, 0.5, grow(), { ease: 'easeOut' }),
    seq('lingua-sai', 'lingua', 3.8, 0.9, grow(), { ease: 'easeOut' }),

    seq('vento-sopra', 'vento', 5.0, 1.0, grow(), {
      ease: 'easeOut',
      caption: 'O monstro sopra o bafo gelado pela sala: FFFFF… ÔNSTR!',
    }),

    seq('sambista-rise', 'sambista', 6.4, 0.8, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'Na frente dele, a SAMBISTA ensaia de paetê, coroa e costeiro de plumas…',
    }),
    seq('bracoL-ergue', 'bracoL', 6.4, 0.6, [ch('rotation.x', 0, 0), ch('rotation.z', -2.4, -2.4)]),
    seq('bracoR-ergue', 'bracoR', 6.4, 0.6, [ch('rotation.x', 0, 0), ch('rotation.z', 2.4, 2.4)]),
    seq('costeiro-abre', 'costeiro', 6.9, 0.8, [ch('scale.x', 0.01, 1), ch('scale.y', 0.3, 1)], { ease: 'easeOut' }),

    seq('bracoL-cruza', 'bracoL', 8.4, 0.7, [ch('rotation.x', 0, -1.1), ch('rotation.z', -2.4, 0.95)], {
      ease: 'easeInOut',
      caption: '…que congelam espetadas. Batendo os dentes, ela cruza os braços: CAN-DU… STÉNG-A?',
    }),
    seq('bracoR-cruza', 'bracoR', 8.4, 0.7, [ch('rotation.x', 0, -1.3), ch('rotation.z', 2.4, -0.95)], {
      ease: 'easeInOut',
    }),
    seq('pandeiro-cai', 'pandeiro', 8.5, 0.6, [
      ch('position.y', GY + 1.1, GY + 0.04), ch('rotation.z', 1.2, 0.1),
    ], { ease: 'easeIn' }),

    seq('sambista-treme', 'sambista', 10.0, 0.5, [ch('position.x', SAMBA[0] + 0.03, SAMBA[0])], {
      caption: 'Você bate a janela — STÉNG! — e ela suspira de alívio: ÉTA!',
    }),
    seq('olhos-piscam', 'olhos', 11.3, 0.5, [ch('scale.y', 0.6, 1)], {
      ease: 'easeOut',
      caption: 'Kan du stänga fönstret? — Você pode fechar a janela?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.15, 5.5], target: [-0.1, 1.45, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-du-stanga-fonstret',
    contexto:
      "Casa: em casa, no escritório, no ônibus ou no trem quando entra o vento gelado — ou, no verão, mosquito. Os suecos adoram 'vädra' (arejar) com a janela escancarada até no inverno, e essa é a frase pra negociar sem brigar. O contrário: 'Kan du öppna fönstret?'.",
    fraseFonte: 'Você pode fechar a janela?',
    fraseAlvo: 'Kan du stänga fönstret?',
    pronuncia:
      "kan-dü STÉNG-a FÖNS-tret? ('kan du' = kan-dü, sem o 'ã' nasal e com o DU de bico, lábios de U e língua de I; 'stänga' com o S colado no T, sem 'is' na frente, É ABERTO e curto, NG no fundo da boca sem estalar o G, e o -a fraquinho — é o verbo pelado depois de 'kan du'; com -er seria 'stänger', 'fecha'; 'fönstret' com a força no FÖN — Ö curto, lábios redondos com a língua pra frente —, N na língua sem nasal, e o -stret num bloco só: S, T e R grudados, R de um toque, E curto e T seco no fim; é 'fönster' (janela) com o artigo '-et' colado e o E do meio engolido)",
    ponteSonora:
      "CAN-DU... STÉNG-A... FFF-ÔNSTR... ÉT(a)? (6 sílabas: kan-dü-STÉNG-a-FÖNS-tret; força no STÉNG e no FÖNS; CAN-DU = o 'kan du' de sempre — C+A+N como em 'cana', sem o glide de 'quando', e o DU com BICO DE PATO (Ü), o MESMO de 'Kan du hjälpa mig?' e 'Kan du ringa tillbaka?'; STÉNG = o MESMO estrondo de FECHAR de 'När stänger ni?' — lá a porta de aço da loja, aqui a janela batendo: o SSS gruda direto no TÉNG, numa sílaba só, sem 'is' na frente, É ABERTO e CURTO, e o NG fica no fundo da boca, sem estalar o G (nada de 'stén-gui'); A = o tremidinho fraco do vidro depois da pancada: é o -a do verbo pelado depois de 'kan du' — com o -ER de 'stänger' vira 'fecha', e sem nada vira a ordem 'stäng!'; FFF-ÔNSTR = o MONSTRO da janela soprando o bafo gelado FFFFF por cima do próprio M: o sopro engole o M e sobra F-ÔNSTR, com a força no FÔN e a boca redonda de Ô com a língua pra frente, quase É — é o ö sueco; o N fica na língua, sem o 'õ' nasal de 'monstro' (a ponta da língua encosta atrás dos dentes antes do S), e o STR sai grudado, como o brasileiro já fala em 'monSTRo', com R de um toque só; o -O de 'monstro' NÃO vem: no lugar dele entra ÉT(a) = o 'ÉTA!' de alívio da sambista com o A engolido, o MESMO ÉT do ÉTA!/ÉTER de 'ett' ('Jag har ett möte', 'Ett bord för två'): É aberto, curto e T seco, colado no R — FÖNS-trét; é o artigo neutro grudado no fim: 'fönster' (janela) + '-et' = 'fönstret', A janela, e o E do meio de 'fönster' some)",
    historia:
      "Fevereiro, quinze graus abaixo de zero, e a SAMBISTA ensaia na sala de fantasia completa: paetê, salto e um costeiro de plumas de dois metros. Alguém deixou a janela escancarada, e ela virou a bocarra de um MONSTRO de gelo — pingentes de dentes, cortina de língua — soprando um bafo gelado FFFFF... ÔNSTR! direto nas plumas, que congelam espetadas. Ela não alcança o trinco, porque o costeiro entala no batente, e grita pra você batendo os dentes: 'CAN-DU... STÉNG-A?' Você empurra, a janela bate com o estrondo da porta de aço — STÉNG! —, e a sambista solta um 'ÉTA!' de alívio: pode fechar a janela?",
  },
  createScene,
}

export default card
