import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Var bor du?" — VÁR? BUR... DÜ?
 *
 * O vizinho novo é um gnomo de jardim que pesca com a VARA (VÁR) num BURACO
 * (BUR) do gramado — e do buraco sobe, fisgada pela chaminé, a casinha dele.
 * Com a casa ainda balançando no anzol, ele aponta o dedo pra VOCÊ: DÜ?
 *
 * Diorama: gramado redondo, buraco preto de borda de terra à direita, gnomo
 * atarracado à esquerda segurando a vara curvada; a linha desce da ponta até
 * a chaminé da casinha suspensa sobre o buraco, torrões voando por baixo.
 */

const GRASS = '#8cc063'
const GRASS_DARK = '#6fa34c'
const SOIL = '#6b4a30'
const SOIL_DARK = '#4a3220'
const HOLE = '#141010'
const COAT = '#3d68a8'
const COAT_DARK = '#2c4f84'
const SKIN = '#f0c9a4'
const NOSE = '#e79a8c'
const BEARD = '#f4f1ea'
const HAT = '#e0302a' // ACENTO saturado — o gorro do gnomo, o dono da casa
const HAT_DARK = '#b8231f'
const BLACK = '#24201f'
const BRASS = '#c9a250'
const ROD = '#d8b06a' // a mesma VARA bege-mel de 'Var kan jag köpa biljett?'
const CORK = '#9a6b3e'
const WALL = '#f2d47a'
const WALL_DARK = '#d9b85e'
const ROOF = '#a9533f'
const ROOF_DARK = '#8a4030'
const DOOR = '#4f8a4a'
const BRICK = '#9b5a45'
const CREAM = '#f6efe0'
const PANE = '#9cc6d8'
const MUSH = '#c8473a'

const GY = 0.16 // topo do gramado
const GNOME_POS: [number, number, number] = [-0.95, GY, 0.35]
const GNOME_ROT = 0.2
const GNOME_H = 1.5
const HOLE_POS: [number, number] = [1.05, 0.25]
const HOOK = new THREE.Vector3(1.05, 1.98, 0.25) // topo da chaminé (ponto do anzol)
const TIP = new THREE.Vector3(1.05, 2.5, 0.25) // ponta da vara, logo acima

/** Malha com sombra a partir de geometria crua + material padrão do app. */
function meshOf(geo: THREE.BufferGeometry, color: string, size: number, rough = 0.6) {
  const m = new THREE.Mesh(geo, mat(color, { roughness: rough, size }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Orienta um objeto para que seu +y local aponte ao longo de `dir`. */
function alongDir(o: THREE.Object3D, dir: THREE.Vector3) {
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- gramado ------------------------------------------------------------
  const gramado = new THREE.Group()

  const terra = cylinder(2.5, 2.6, 0.12, SOIL, { roughness: 0.95 })
  terra.position.y = 0.06
  gramado.add(terra)

  const relva = cylinder(2.48, 2.5, 0.05, GRASS, { roughness: 0.92 })
  relva.position.y = GY - 0.025
  gramado.add(relva)

  // tufos de grama espalhados (longe do buraco e dos pés do gnomo)
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.5 + rand() * 1.85
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (Math.hypot(x - HOLE_POS[0], z - HOLE_POS[1]) < 0.75) continue
    if (Math.hypot(x - GNOME_POS[0], z - GNOME_POS[2]) < 0.55) continue
    const tufo = new THREE.Group()
    tufo.position.set(x, GY, z)
    for (let k = 0; k < 3; k++) {
      const folha = cone(0.025, 0.13 + rand() * 0.06, k % 2 ? GRASS_DARK : GRASS, { roughness: 0.9 })
      folha.position.set((k - 1) * 0.03, 0.06, (rand() - 0.5) * 0.03)
      folha.rotation.z = (k - 1) * 0.35
      tufo.add(folha)
    }
    gramado.add(tufo)
  }

  // florzinhas brancas e pedrinhas
  for (const [fx, fz] of [[-1.75, 1.2], [0.15, 1.75], [1.95, -0.6], [-0.2, -1.6], [-1.9, -0.4]] as const) {
    const haste = cylinder(0.008, 0.008, 0.14, GRASS_DARK, { roughness: 0.8 }, 8)
    haste.position.set(fx, GY + 0.07, fz)
    gramado.add(haste)
    const flor = sphere(0.035, CREAM, { roughness: 0.6 })
    flor.scale.y = 0.6
    flor.position.set(fx, GY + 0.15, fz)
    gramado.add(flor)
    const miolo = sphere(0.016, '#f0c040', { roughness: 0.6 })
    miolo.position.set(fx, GY + 0.165, fz)
    gramado.add(miolo)
  }
  for (const [px, pz, s] of [[-0.1, 1.15, 0.1], [0.35, -1.0, 0.13], [-1.6, -1.2, 0.09]] as const) {
    const pedra = rock(s, '#9a958c', Math.round(px * 10 + 50), { roughness: 0.9 })
    pedra.scale.y = 0.6
    pedra.position.set(px, GY + s * 0.3, pz)
    gramado.add(pedra)
  }
  root.add(gramado)

  // ---- buraco redondo com borda de terra -----------------------------------
  const buraco = new THREE.Group()
  buraco.position.set(HOLE_POS[0], GY, HOLE_POS[1])

  const boca = cylinder(0.44, 0.44, 0.012, HOLE, { roughness: 1, detail: 0 })
  boca.position.y = 0.006
  buraco.add(boca)
  const borda = torus(0.47, 0.075, SOIL, { roughness: 0.95 })
  borda.rotation.x = Math.PI / 2
  borda.scale.z = 0.7
  borda.position.y = 0.02
  buraco.add(borda)
  // montinhos de terra revirada em volta
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.3
    const monte = puff(0.08, i % 2 ? SOIL : SOIL_DARK, 3, 60 + i, { roughness: 0.95 })
    monte.position.set(Math.cos(a) * 0.6, 0.02, Math.sin(a) * 0.56)
    monte.scale.y = 0.55
    buraco.add(monte)
  }
  root.add(buraco)

  // ---- cogumelo vermelho de bolinhas ---------------------------------------
  const cogumelo = new THREE.Group()
  cogumelo.position.set(1.95, GY, 0.95)

  const addShroom = (x: number, z: number, s: number) => {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    g.scale.setScalar(s)
    const pe = lathe([[0, 0], [0.07, 0], [0.06, 0.1], [0.05, 0.22], [0.055, 0.26], [0, 0.26]], CREAM, { roughness: 0.7 })
    g.add(pe)
    const chapeu = lathe(
      [[0, 0.22], [0.2, 0.22], [0.215, 0.25], [0.19, 0.32], [0.12, 0.38], [0, 0.4]],
      MUSH,
      { roughness: 0.45 },
    )
    g.add(chapeu)
    for (const [a, h, r] of [[0.3, 0.34, 0.12], [2.0, 0.33, 0.13], [3.9, 0.34, 0.12], [5.1, 0.29, 0.17], [1.1, 0.28, 0.18], [0, 0.39, 0]] as const) {
      const bolinha = sphere(0.03, CREAM, { roughness: 0.6 })
      bolinha.scale.y = 0.45
      bolinha.position.set(Math.cos(a) * r, h + 0.012, Math.sin(a) * r)
      bolinha.lookAt(new THREE.Vector3(0, 0.1, 0))
      g.add(bolinha)
    }
    cogumelo.add(g)
  }
  addShroom(0, 0, 1.15)
  addShroom(0.32, -0.18, 0.6)
  root.add(cogumelo)

  // ---- gnomo ---------------------------------------------------------------
  const gnomo = person({ body: COAT, skin: SKIN, height: GNOME_H, armAngle: 0.3 })
  gnomo.position.set(...GNOME_POS)
  gnomo.rotation.y = GNOME_ROT
  gnomo.scale.set(1.18, 1.0, 1.18) // atarracado

  // cinto preto com fivela
  const cinto = torus(0.262, 0.036, BLACK, { roughness: 0.6 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.36
  gnomo.add(cinto)
  const fivela = rbox(0.11, 0.09, 0.03, 0.015, BRASS, { roughness: 0.3, metalness: 0.7 })
  fivela.position.set(0, 0.36, 0.285)
  gnomo.add(fivela)
  // barra do casaco e botas
  const barra = torus(0.25, 0.03, COAT_DARK, { roughness: 0.8 })
  barra.rotation.x = Math.PI / 2
  barra.position.y = 0.12
  gnomo.add(barra)
  for (const side of [-1, 1]) {
    const bota = rbox(0.15, 0.12, 0.24, 0.05, '#5a3a24', { roughness: 0.75 })
    bota.position.set(side * 0.1, 0.06, 0.1)
    gnomo.add(bota)
  }

  const head = gnomo.getObjectByName('head') as THREE.Group

  // ---- barba volumosa + nariz-bolota ---------------------------------------
  const barba = new THREE.Group()
  head.add(barba)
  const barbaPuff = puff(0.17, BEARD, 7, 12, { roughness: 0.92 })
  barbaPuff.position.set(0, -0.2, 0.17)
  barbaPuff.scale.set(1.25, 1.25, 0.75)
  barba.add(barbaPuff)
  const ponta = puff(0.11, BEARD, 4, 13, { roughness: 0.92 })
  ponta.position.set(0, -0.38, 0.19)
  barba.add(ponta)
  const bigode = new THREE.Group()
  for (const side of [-1, 1]) {
    const fio = capsule(0.045, 0.09, BEARD, { roughness: 0.9 })
    fio.position.set(side * 0.075, -0.075, 0.27)
    fio.rotation.z = side * 1.15
    bigode.add(fio)
  }
  barba.add(bigode)
  const nariz = sphere(0.075, NOSE, { roughness: 0.5 })
  nariz.position.set(0, -0.015, 0.3)
  barba.add(nariz)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.05, '#f0a798', { roughness: 0.7 })
    bochecha.scale.z = 0.4
    bochecha.position.set(side * 0.16, -0.05, 0.225)
    barba.add(bochecha)
  }

  // ---- gorro vermelho pontudo bem alto -------------------------------------
  const gorro = new THREE.Group()
  gorro.position.set(0, 0.1, -0.01)
  head.add(gorro)
  const aba = torus(0.27, 0.05, HAT_DARK, { roughness: 0.85 })
  aba.rotation.x = Math.PI / 2
  gorro.add(aba)
  const copa = lathe(
    [[0.3, 0], [0.29, 0.12], [0.24, 0.3], [0.16, 0.52], [0.08, 0.72], [0.02, 0.86], [0, 0.88]],
    HAT,
    { roughness: 0.82 },
  )
  copa.rotation.z = -0.12
  gorro.add(copa)
  const pompom = sphere(0.045, HAT_DARK, { roughness: 0.85 })
  pompom.position.set(0.105, 0.87, 0)
  gorro.add(pompom)

  // ---- braços --------------------------------------------------------------
  const bracoVara = gnomo.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoVara, GNOME_H)
  bracoVara.rotation.set(-1.25, 0, 0.42) // à frente, segurando a vara na altura do peito

  const bracoAponta = gnomo.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoAponta, GNOME_H)
  const APONTA_X = -1.9
  const APONTA_Z = 0.0
  bracoAponta.rotation.set(APONTA_X, 0, APONTA_Z)
  // dedo indicador esticado (filho da mão, ao longo do braço)
  const maoAponta = bracoAponta.children[0]
  const dedo = capsule(0.036, 0.13, SKIN, { roughness: 0.6 })
  dedo.position.set(0, -0.15, 0.0)
  maoAponta.add(dedo)

  root.add(gnomo)

  // ---- vara de pescar curvada pelo peso -----------------------------------
  root.updateMatrixWorld(true)
  const maoVara = bracoVara.children[0]
  const BUTT = maoVara.getWorldPosition(new THREE.Vector3())

  const vara = new THREE.Group()
  vara.position.copy(BUTT)

  const tipLocal = TIP.clone().sub(BUTT)
  const curva = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.12, -0.1, 0.06), // um pouco atrás da mão: o cabo aparece
    tipLocal.clone().multiplyScalar(0.45).add(new THREE.Vector3(0, 0.95, 0)),
    tipLocal,
  )
  const SEG = 48
  const RAD = 10
  const tuboGeo = new THREE.TubeGeometry(curva, SEG, 1, RAD, false)
  {
    // afina a vara do cabo à ponta
    const pos = tuboGeo.attributes.position
    const v = new THREE.Vector3()
    const c = new THREE.Vector3()
    for (let i = 0; i <= SEG; i++) {
      curva.getPointAt(i / SEG, c)
      const r = THREE.MathUtils.lerp(0.04, 0.011, i / SEG)
      for (let j = 0; j <= RAD; j++) {
        const idx = i * (RAD + 1) + j
        v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(r).add(c)
        pos.setXYZ(idx, v.x, v.y, v.z)
      }
    }
    tuboGeo.computeVertexNormals()
  }
  vara.add(meshOf(tuboGeo, ROD, 2, 0.45))

  const tangenteCabo = curva.getTangentAt(0.06)
  const cabo = cylinder(0.055, 0.06, 0.3, CORK, { roughness: 0.9 })
  cabo.position.copy(curva.getPointAt(0.05))
  alongDir(cabo, tangenteCabo)
  vara.add(cabo)
  const ponteira = sphere(0.06, CORK, { roughness: 0.9 })
  ponteira.position.copy(curva.getPointAt(0))
  vara.add(ponteira)

  // carretilha logo acima do cabo, por baixo da vara
  const carretilha = new THREE.Group()
  carretilha.position.copy(curva.getPointAt(0.15))
  alongDir(carretilha, curva.getTangentAt(0.15))
  const tambor = cylinder(0.08, 0.08, 0.06, '#8b3f34', { roughness: 0.3 })
  tambor.rotation.z = Math.PI / 2
  tambor.position.set(0, 0, 0.1)
  carretilha.add(tambor)
  const suporte = rbox(0.03, 0.08, 0.08, 0.01, '#4a4a4a', { roughness: 0.3, metalness: 0.6 })
  suporte.position.set(0, 0, 0.05)
  carretilha.add(suporte)
  const manivela = capsule(0.013, 0.07, '#4a4a4a', { roughness: 0.3, metalness: 0.6 })
  manivela.position.set(0.06, 0.03, 0.1)
  manivela.rotation.z = 0.8
  carretilha.add(manivela)
  vara.add(carretilha)

  // passadores ao longo da vara
  for (const t of [0.4, 0.62, 0.8, 0.94]) {
    const passador = torus(0.03, 0.007, '#6d6d6d', { roughness: 0.3, metalness: 0.7 })
    passador.position.copy(curva.getPointAt(t))
    passador.position.y -= 0.03
    passador.lookAt(passador.position.clone().add(curva.getTangentAt(t)))
    vara.add(passador)
  }
  const ponteiraTip = sphere(0.018, '#6d6d6d', { roughness: 0.3, metalness: 0.7 })
  ponteiraTip.position.copy(tipLocal)
  vara.add(ponteiraTip)
  root.add(vara)

  // ---- linha esticada da ponta até a chaminé -------------------------------
  const linha = new THREE.Group()
  linha.position.copy(TIP)
  const LINE_L = TIP.y - HOOK.y + 0.04
  const fio = cylinder(0.007, 0.007, LINE_L, '#f4f2ea', { roughness: 0.4 }, 10)
  fio.position.y = -LINE_L / 2
  linha.add(fio)
  root.add(linha)

  // ---- casinha pendurada pela chaminé (origem = anzol) ---------------------
  const casa = new THREE.Group()
  casa.position.copy(HOOK)
  casa.rotation.z = 0.07 // ainda balançando

  const anzol = torus(0.06, 0.013, '#8e979c', { roughness: 0.25, metalness: 0.85 })
  anzol.position.y = -0.02
  casa.add(anzol)

  const chamine = rbox(0.14, 0.3, 0.14, 0.02, BRICK, { roughness: 0.8 })
  chamine.position.y = -0.18
  casa.add(chamine)
  const chamineTopo = rbox(0.18, 0.05, 0.18, 0.015, '#7e4636', { roughness: 0.8 })
  chamineTopo.position.y = -0.05
  casa.add(chamineTopo)

  const RIDGE = -0.3
  const A = 0.62
  const SLAB = 0.5
  for (const s of [-1, 1]) {
    const telhado = rbox(1.0, 0.07, SLAB, 0.025, ROOF, { roughness: 0.75 })
    telhado.rotation.x = s * A
    telhado.position.set(0, RIDGE - (SLAB / 2) * Math.sin(A), s * (SLAB / 2) * Math.cos(A))
    casa.add(telhado)
    // fiadas de telha: frisos escuros na água da frente
    if (s > 0) {
      for (const k of [0.13, 0.26, 0.39]) {
        const fiada = rbox(1.0, 0.02, 0.025, 0.008, ROOF_DARK, { roughness: 0.8 })
        fiada.rotation.x = A
        fiada.position.set(0, RIDGE - k * Math.sin(A) + 0.04, k * Math.cos(A) + 0.03)
        casa.add(fiada)
      }
    }
  }
  const cumeeira = cylinder(0.04, 0.04, 1.02, ROOF_DARK, { roughness: 0.75 })
  cumeeira.rotation.z = Math.PI / 2
  cumeeira.position.y = RIDGE + 0.02
  casa.add(cumeeira)

  const WALL_TOP = RIDGE - SLAB * Math.sin(A) + 0.04
  const WALL_H = 0.5
  const paredes = rbox(0.8, WALL_H, 0.62, 0.03, WALL, { roughness: 0.8 })
  paredes.position.y = WALL_TOP - WALL_H / 2
  casa.add(paredes)

  // empena (triângulo) preenchendo os lados sob o telhado
  const tri = new THREE.Shape()
  const halfD = 0.3
  const gableH = WALL_TOP < RIDGE ? RIDGE - WALL_TOP - 0.02 : 0.1
  tri.moveTo(-halfD, 0)
  tri.lineTo(halfD, 0)
  tri.lineTo(0, gableH)
  tri.closePath()
  const empenaGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.78, bevelEnabled: false })
  const empena = meshOf(empenaGeo, WALL_DARK, 0.8, 0.8)
  empena.rotation.y = Math.PI / 2
  empena.position.set(-0.39, WALL_TOP - 0.01, 0)
  casa.add(empena)

  const FRONT = 0.31
  const porta = rbox(0.17, 0.3, 0.035, 0.03, DOOR, { roughness: 0.6 })
  porta.position.set(-0.17, WALL_TOP - WALL_H + 0.15 + 0.02, FRONT)
  casa.add(porta)
  const macaneta = sphere(0.017, BRASS, { roughness: 0.3, metalness: 0.7 })
  macaneta.position.set(-0.11, WALL_TOP - WALL_H + 0.17, FRONT + 0.025)
  casa.add(macaneta)

  const janela = new THREE.Group()
  janela.position.set(0.17, WALL_TOP - 0.22, FRONT)
  const moldura = rbox(0.2, 0.2, 0.03, 0.02, CREAM, { roughness: 0.6 })
  janela.add(moldura)
  const vidro = rbox(0.15, 0.15, 0.02, 0.01, PANE, { roughness: 0.2 })
  vidro.position.z = 0.012
  janela.add(vidro)
  const travessaV = rbox(0.022, 0.15, 0.025, 0.006, CREAM, { roughness: 0.6 })
  travessaV.position.z = 0.02
  janela.add(travessaV)
  const travessaH = rbox(0.15, 0.022, 0.025, 0.006, CREAM, { roughness: 0.6 })
  travessaH.position.z = 0.02
  janela.add(travessaH)
  casa.add(janela)

  const alicerce = rbox(0.84, 0.05, 0.66, 0.02, '#9a958c', { roughness: 0.85 })
  alicerce.position.y = WALL_TOP - WALL_H - 0.02
  casa.add(alicerce)
  // torrão de terra e grama ainda grudados embaixo da casa
  const grudado = puff(0.14, SOIL, 5, 77, { roughness: 0.95 })
  grudado.scale.set(1.9, 0.5, 1.5)
  grudado.position.y = WALL_TOP - WALL_H - 0.08
  casa.add(grudado)
  for (const [gx, gz] of [[-0.3, 0.2], [0.28, -0.18], [0.1, 0.25]] as const) {
    const capim = cone(0.03, 0.12, GRASS_DARK, { roughness: 0.9 })
    capim.position.set(gx, WALL_TOP - WALL_H - 0.12, gz)
    capim.rotation.x = Math.PI
    casa.add(capim)
  }
  root.add(casa)
  const CASA_BOTTOM = HOOK.y + WALL_TOP - WALL_H - 0.12

  // ---- torrões de terra voando ---------------------------------------------
  const torroes = new THREE.Group()
  torroes.position.set(HOLE_POS[0], GY, HOLE_POS[1])
  const CLODS: [number, number, number, number][] = [
    [-0.62, CASA_BOTTOM - GY + 0.1, -0.05, 0.12],
    [0.62, CASA_BOTTOM - GY + 0.18, 0.0, 0.1],
    [0.2, CASA_BOTTOM - GY - 0.3, 0.1, 0.09],
    [-0.3, CASA_BOTTOM - GY - 0.45, 0.2, 0.06],
  ]
  CLODS.forEach(([x, y, z, s], i) => {
    const torrao = rock(s, i === 1 ? SOIL_DARK : SOIL, 90 + i, { roughness: 0.95 })
    torrao.position.set(x, y, z)
    torrao.rotation.set(rand() * 3, rand() * 3, rand() * 3)
    torroes.add(torrao)
    const migalha = sphere(s * 0.35, SOIL_DARK, { roughness: 0.95 })
    migalha.position.set(x * 0.7, y - s * 1.6, z)
    torroes.add(migalha)
  })
  root.add(torroes)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'gramado', group: 'jardim', object: gramado },
    { name: 'cogumelo', group: 'jardim', object: cogumelo },
    { name: 'gnomo', group: 'gnomo', object: gnomo },
    { name: 'barba', group: 'gnomo', object: barba },
    { name: 'gorro', group: 'gnomo', object: gorro },
    { name: 'vara', group: 'vara', object: vara },
    { name: 'linha', group: 'vara', object: linha },
    { name: 'buraco', group: 'buraco', object: buraco },
    { name: 'casa', group: 'casa', object: casa },
    { name: 'torroes', group: 'casa', object: torroes },
    { name: 'bracoAponta', group: 'du', object: bracoAponta },
  ]

  const s3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('gramado-rise', 'gramado', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um gramado de jardim brota do chão, com cogumelo vermelho e tudo…',
    }),
    seq('cogumelo-cresce', 'cogumelo', 0.5, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('gnomo-rise', 'gnomo', 1.5, 0.8, [riseFrom(GY, 1.8)], {
      ease: 'easeOut',
      caption: 'O vizinho novo é um gnomo de jardim, de barba branca e gorro vermelho.',
    }),
    seq('barba-cresce', 'barba', 1.9, 0.6, s3(0.01, 1), { ease: 'easeOut' }),
    seq('gorro-cresce', 'gorro', 2.05, 0.7, [...s3(0.01, 1), ch('position.y', 0.5, 0.1)], { ease: 'easeOut' }),

    seq('vara-telescopa', 'vara', 3.4, 0.9, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Ele passa o dia de VARA de pescar na mão — VÁR?',
    }),
    seq('linha-desce', 'linha', 4.2, 0.5, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('buraco-abre', 'buraco', 5.2, 0.6, [ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Só que não tem lago: a linha desce num BURACO redondo no gramado — BUR…',
    }),

    seq('casa-sobe', 'casa', 7.0, 0.9, [riseFrom(HOOK.y, 1.7), ch('rotation.z', 0.4, -0.18)], {
      ease: 'easeOut',
      caption: 'Você pergunta onde ele mora — e ele dá um puxão: do BURACO sobe a casinha dele, fisgada pela chaminé!',
    }),
    seq('torroes-voam', 'torroes', 7.25, 0.8, [riseFrom(0, 0.6), ...s3(0.2, 1)], { ease: 'easeOut' }),
    seq('casa-balanca', 'casa', 7.9, 0.7, [ch('rotation.z', -0.18, 0.14)], { ease: 'easeInOut' }),
    seq('casa-assenta', 'casa', 8.6, 0.7, [ch('rotation.z', 0.14, 0.07)], { ease: 'easeInOut' }),

    seq('braco-aponta', 'bracoAponta', 9.3, 0.6, [ch('rotation.x', 0, APONTA_X), ch('rotation.z', 0.3, APONTA_Z)], {
      ease: 'easeOut',
      caption: 'Com a casa balançando no anzol, ele aponta o dedo pra VOCÊ — DÜ? E você, mora onde?',
    }),

    seq('gorro-balanca', 'gorro', 11.0, 0.5, [ch('rotation.z', 0.12, 0)], {
      ease: 'easeOut',
      caption: 'Var bor du? — Onde você mora?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.05, 5.0], target: [0.2, 1.3, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-bor-du',
    contexto:
      "Small talk: colega novo, vizinho, outros pais na förskola ou no SFI — vem logo depois de 'Vad heter du?'. A resposta é 'Jag bor i …'.",
    fraseFonte: 'Onde você mora?',
    fraseAlvo: 'Var bor du?',
    pronuncia:
      "var BUUR dü? ('var' com R brando, de 'caro' — é ele que separa de 'vad'; 'bor' com U fechado e longo; o R de 'bor' encosta no D: 'bu-dü' com a língua enrolada; 'du' com bico)",
    ponteSonora:
      "VÁR? BUR... DÜ? (3 sílabas: var-BUUR-dü; tônica no BUR; VÁR é a VARA sem o -a — a mesma VARA de pescar de 'Var kan jag köpa biljett?' —, R BRANDO de 'caro' e AUDÍVEL: sem ele sobra VÁ, que é 'vad' (o quê), e a pergunta perde o sentido; BUR = o começo de BURACO parando no R — sem o -A (nada de 'bura') e com a força no BU, que em 'buraco' é fraco: U FECHADO e LONGO de URSO (é o 'o' sueco de 'bor', o mesmo BÚ de 'Hur bokar man tvättstugan?'), SEM o bico do Ü — com bico vira 'bur' (gaiola) —, e nunca 'bôr' de boca aberta, que vira 'bår' (maca); o R é BRANDO, à caipira, e encosta no D — 'bu(r)-dü' de língua enrolada, como o sueco funde o 'rd'; sem R nenhum sobra 'bo', o infinitivo; DÜ com BICO DE PATO, o 'du' de CAN-DU, dito apontando pra você)",
    historia:
      'O vizinho novo é um gnomo de jardim que passa o dia de VARA de pescar na mão — só que não tem lago nenhum: a linha desce direto num BURACO redondo no gramado. Você pergunta onde ele mora e ele dá um puxão de pescador: do BURACO sobe, fisgada pela chaminé, a casinha dele inteira, com porta e janela, espalhando torrão de terra pra todo lado. Com a casa ainda balançando no anzol, ele aponta o dedo gordinho pra VOCÊ — DÜ? — e devolve a pergunta: e você, mora onde?',
  },
  createScene,
}

export default card
