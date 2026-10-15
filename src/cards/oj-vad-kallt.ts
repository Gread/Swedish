import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Oj, vad kallt!" — ÓI! VÁ... CÁLT!
 *
 * O saci pulou da mata brasileira direto num campo de neve sueco, descalço e
 * com o seu único pé. A sola encosta no gelo: ÓI! (o Ó aberto de 'dói').
 * Manda o redemoinho levá-lo de volta — VÁ! — e o redemoinho congela num pião
 * de gelo. A cuia de CALDO fervendo vira pedra na mão, com a colher em pé, e
 * a palavra encolhe de frio numa sílaba seca: CÁLT!
 *
 * Diorama: campo de neve com montes e pinheiro nevado ao fundo; o saci no
 * centro, numa perna só afundada até o tornozelo, abraçando o peito com um
 * braço e estendendo a cuia com o outro; à esquerda, o pião de gelo com folhas
 * da mata presas dentro. Acento laranja RESERVADO ao caldo congelado.
 */

const SNOW = '#eef4f9'
const SNOW_SHADE = '#d3e0ec'
const ICE = '#a8c2d8'
const ICE_CLEAR = '#bfe6f6'
const FROST = '#e8f6ff'
const PINE = '#2f5248'
const BARK = '#5a4630'
const STONE = '#6c747d'
const SKIN = '#5a3826'
const SHORTS = '#d4c29a'
const SHORTS_DARK = '#bfa97c'
const ROPE = '#9b7b4c'
const CAP = '#ad2f27' // carapuça: o vermelho do saci, escuro para não brigar com o caldo
const CAP_DARK = '#86231d'
const CLAY = '#9a5636'
const GOURD = '#7b4a24'
const GOURD_LIGHT = '#c08a4e'
const WOOD = '#c99a5e'
const LEAF = '#4f9a3c'
const COLD = '#8fd2ff'
const CALDO = '#ec7417' // acento saturado RESERVADO: o CALDO congelado (CÁLT)
const CALDO_LIGHT = '#f6a25a'

const GY = 0.18 // topo da neve
const H = 1.5 // altura do person() do saci
const SLIM = 0.78 // saci é magrinho: afina o tronco da peça-base
const LEG = 0.5 // perna visível acima da neve
const SX = 0.2
const SZ = 0.2
const CAP_Y = 0.12 // assento da carapuça na cabeça
const CAM: [number, number, number] = [0.3, 1.78, 4.0]
const RED_S = 1.2 // escala do pião de gelo

// braços (pivô no ombro): repouso pendurado → pose final
const ABRACO_X = -1.0
const ABRACO_Z = 0.75
const CUIA_X = -0.93
const CUIA_Z = 0.93
const CUIA_S = 1.2 // a cuia é a protagonista do CÁLT: um pouco maior que o natural

/** Abeto nevado: tronco + três saias de cone com capa branca. */
function spruce(scale: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)

  const trunk = cylinder(0.05 * scale, 0.065 * scale, 0.3 * scale, BARK, { roughness: 0.85 })
  trunk.position.y = 0.15 * scale
  g.add(trunk)

  const tiers: [number, number, number][] = [
    [0.36, 0.46, 0.3],
    [0.28, 0.4, 0.56],
    [0.19, 0.32, 0.8],
  ]
  for (const [r, h, y] of tiers) {
    const skirt = cone(r * scale, h * scale, PINE, { roughness: 0.9 })
    skirt.position.y = y * scale
    skirt.rotation.y = rand() * Math.PI
    g.add(skirt)

    const cap = cone(r * 0.62 * scale, h * 0.42 * scale, SNOW, { roughness: 0.9 })
    cap.position.y = (y + h * 0.3) * scale
    g.add(cap)
  }
  return g
}

/**
 * Tubo afunilado ao longo de uma curva (raio r0 → r1): carapuça mole, fumaça
 * e vapor congelados. As normais originais do tubo seguem valendo (o afunilado
 * é suave), então não há costura.
 */
function taper(
  points: [number, number, number][],
  r0: number,
  r1: number,
  color: string,
  opts: Parameters<typeof mat>[1] = {},
  segs = 48,
  radial = 20,
) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
  const geo = new THREE.TubeGeometry(curve, segs, 1, radial, false)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    curve.getPointAt(t, c)
    const r = r0 + (r1 - r0) * Math.pow(t, 0.85)
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c)
      pos.setXYZ(k, v.x, v.y, v.z)
    }
  }
  const mesh = new THREE.Mesh(geo, mat(color, { size: r0 * 4, ...opts }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Estrelinha de dor/frio de cinco pontas, em relevo (+z = frente). */
function star(r: number) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.46
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
    else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: r * 0.22,
    bevelEnabled: true,
    bevelThickness: r * 0.12,
    bevelSize: r * 0.1,
    bevelSegments: 2,
  })
  geo.center()
  const m = new THREE.Mesh(geo, mat(COLD, { emissive: '#4fb4ff', emissiveIntensity: 0.55, roughness: 0.3 }))
  m.castShadow = true
  return m
}

/** Pingente de gelo apontando para baixo (ponta em y = -h). */
function icicle(r: number, h: number) {
  const c = cone(r, h, FROST, { roughness: 0.15 })
  c.rotation.x = Math.PI
  c.position.y = -h / 2
  const g = new THREE.Group()
  g.add(c)
  return g
}

function translucent(mesh: THREE.Mesh, opacity: number) {
  const m = mesh.material as THREE.MeshStandardMaterial
  m.transparent = true
  m.opacity = opacity
  m.depthWrite = false
  mesh.castShadow = false
  return mesh
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base do diorama: campo de neve --------------------------------------
  const base = new THREE.Group()

  const ice = cylinder(2.62, 2.72, 0.12, ICE, { roughness: 0.35 })
  ice.position.y = 0.06
  base.add(ice)

  const snow = cylinder(2.55, 2.62, 0.07, SNOW, { roughness: 0.92 })
  snow.position.y = 0.145
  base.add(snow)

  // montes de neve arredondados
  for (const [dx, dz, r, seed] of [
    [-1.95, 0.75, 0.42, 31],
    [1.75, 0.9, 0.36, 32],
    [-0.55, 1.75, 0.26, 33],
    [0.95, -1.75, 0.4, 34],
    [-1.55, -1.55, 0.34, 35],
  ] as const) {
    const drift = puff(r, SNOW, 5, seed, { roughness: 0.92 })
    drift.position.set(dx, GY - r * 0.5, dz)
    drift.scale.set(1.3, 0.55, 1.15)
    base.add(drift)
  }

  // sombra azulada de congeira (dá relevo ao branco)
  const shade = cylinder(0.7, 0.75, 0.012, SNOW_SHADE, { roughness: 0.95 })
  shade.position.set(-1.2, GY + 0.004, -0.4)
  shade.scale.z = 0.7
  base.add(shade)

  for (const [dx, dz, r, seed] of [
    [2.1, -0.35, 0.17, 41],
    [-2.25, -0.2, 0.13, 42],
    [1.25, 1.85, 0.11, 43],
  ] as const) {
    const stone = rock(r, STONE, seed, { roughness: 0.9 })
    stone.position.set(dx, GY - r * 0.3, dz)
    stone.rotation.y = rand() * Math.PI
    base.add(stone)
    const topping = puff(r * 0.55, SNOW, 3, seed + 10, { roughness: 0.92 })
    topping.position.set(dx, GY + r * 0.55, dz)
    topping.scale.y = 0.45
    base.add(topping)
  }

  root.add(base)

  // ---- pinheiros nevados ao fundo ------------------------------------------
  const pinheiro = new THREE.Group()
  const treeA = spruce(1.35, 51)
  treeA.position.set(1.85, GY - 0.02, -1.55)
  pinheiro.add(treeA)
  const treeB = spruce(1.05, 52)
  treeB.position.set(-1.95, GY - 0.02, -1.25)
  pinheiro.add(treeB)
  root.add(pinheiro)

  // ---- o saci ---------------------------------------------------------------
  const saci = new THREE.Group()
  saci.position.set(SX, 0, SZ)
  root.add(saci)

  // a perna única, comprida e magrinha, entrando na neve
  const perna = capsule(0.068, LEG + 0.1, SKIN, { roughness: 0.6 })
  perna.position.y = GY + (LEG + 0.1) / 2 - 0.05
  saci.add(perna)

  const p = person({ body: SKIN, skin: SKIN, height: H, armAngle: 0.15 })
  p.position.y = GY + LEG
  saci.add(p)

  // magrinho: tronco afinado, braços acompanham
  const tronco = p.getObjectByName('body') as THREE.Mesh
  tronco.scale.set(SLIM, 1, SLIM * 1.05)
  for (const n of ['armL', 'armR']) {
    const arm = p.getObjectByName(n)!
    arm.position.x *= SLIM * 1.03
    arm.scale.set(0.85, 1, 0.85)
  }

  // calção de algodão cru com cordão — boca reta, esconde os pés da peça-base
  const CR = 0.17 * H * SLIM + 0.02
  const calcao = lathe(
    [
      [0, 0.0], [CR - 0.07, 0.0], [CR + 0.02, 0.03], [CR + 0.045, 0.1],
      [CR + 0.035, 0.2], [CR + 0.006, 0.3], [0, 0.3],
    ],
    SHORTS,
    { roughness: 0.88 },
  )
  p.add(calcao)
  // barra desfiada: franjas de pano pendendo da boca do calção
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.1
    const fio = cone(0.034, 0.04 + (i % 3) * 0.012, SHORTS, { roughness: 0.9 })
    fio.rotation.x = Math.PI
    fio.position.set(Math.sin(a) * (CR + 0.012), 0.0, Math.cos(a) * (CR + 0.012))
    fio.scale.z = 0.5
    fio.rotation.y = a
    p.add(fio)
  }
  const remendo = rbox(0.1, 0.09, 0.02, 0.02, SHORTS_DARK, { roughness: 0.9 })
  remendo.position.set(-0.1, 0.12, CR + 0.005)
  remendo.rotation.set(0, -0.35, 0.2)
  p.add(remendo)
  const cordao = torus(CR + 0.01, 0.02, ROPE, { roughness: 0.85 })
  cordao.rotation.x = Math.PI / 2
  cordao.position.y = 0.29
  p.add(cordao)
  for (const s of [-1, 1]) {
    const ponta = capsule(0.012, 0.08, ROPE, { roughness: 0.85 })
    ponta.position.set(s * 0.03, 0.235, CR + 0.008)
    ponta.rotation.z = s * 0.25
    p.add(ponta)
  }

  const head = p.getObjectByName('head') as THREE.Group

  // boca batendo os dentes
  const boca = rbox(0.17, 0.1, 0.05, 0.03, '#2a1712', { roughness: 0.6 })
  boca.position.set(0.0, -0.13, 0.238)
  boca.rotation.x = -0.25
  head.add(boca)
  for (const dy of [0.026, -0.028]) {
    const fileira = new THREE.Group()
    fileira.position.set(0.0, -0.13 + dy, 0.262 - dy * 0.25)
    fileira.rotation.x = -0.25
    for (let k = -2; k <= 2; k++) {
      const dente = rbox(0.026, 0.026, 0.02, 0.008, '#f6f2ea', { roughness: 0.3 })
      dente.position.x = k * 0.028
      fileira.add(dente)
    }
    head.add(fileira)
  }
  // sobrancelhas aflitas (pontas de dentro erguidas)
  for (const s of [-1, 1]) {
    const sob = capsule(0.018, 0.09, '#1e120c', { roughness: 0.8 })
    sob.position.set(s * 0.105, 0.128, 0.252)
    sob.rotation.set(0, 0, Math.PI / 2 - s * 0.45)
    head.add(sob)
  }

  // cachimbo de barro no canto da boca (lado esquerdo da tela)
  const cachimbo = new THREE.Group()
  cachimbo.position.set(-0.07, -0.14, 0.25)
  head.add(cachimbo)
  const PIPE_END = new THREE.Vector3(-0.27, -0.06, 0.16)
  const haste = cylinder(0.014, 0.017, PIPE_END.length(), '#6b3f26', { roughness: 0.6 })
  haste.position.copy(PIPE_END).multiplyScalar(0.5)
  haste.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), PIPE_END.clone().normalize())
  cachimbo.add(haste)
  const fornilho = lathe(
    [[0, 0], [0.045, 0], [0.062, 0.035], [0.064, 0.1], [0.05, 0.106], [0.047, 0.035], [0, 0.03]],
    CLAY,
    { roughness: 0.7 },
  )
  fornilho.position.set(PIPE_END.x - 0.01, PIPE_END.y - 0.03, PIPE_END.z)
  cachimbo.add(fornilho)

  // ---- carapuça vermelha mole, ponta caída e cristais de gelo --------------
  const carapuca = new THREE.Group()
  carapuca.position.set(0, CAP_Y, -0.03)
  carapuca.rotation.set(-0.18, 0, -0.1)
  head.add(carapuca)

  const TIP: [number, number, number] = [0.3, 0.17, 0.0]
  const pano = taper(
    [[0, 0.0, 0], [0, 0.12, -0.02], [0.03, 0.24, -0.04], [0.1, 0.32, -0.04], [0.19, 0.32, -0.02],
      [0.26, 0.25, -0.01], TIP],
    0.268,
    0.018,
    CAP,
    { roughness: 0.88 },
  )
  carapuca.add(pano)
  const bainha = torus(0.266, 0.04, CAP_DARK, { roughness: 0.88 })
  bainha.rotation.x = Math.PI / 2
  bainha.position.y = 0.02
  carapuca.add(bainha)
  const pingo = sphere(0.022, CAP, { roughness: 0.88 })
  pingo.position.set(...TIP)
  carapuca.add(pingo)

  // pingentes de gelo na bainha da frente e na ponta caída
  for (const [a, h] of [[-1.0, 0.06], [-0.5, 0.09], [0.05, 0.07], [0.55, 0.1], [1.05, 0.06]] as const) {
    const pg = icicle(0.016, h)
    pg.position.set(Math.sin(a) * 0.268, -0.01, Math.cos(a) * 0.268)
    carapuca.add(pg)
  }
  const pgPonta = icicle(0.015, 0.08)
  pgPonta.position.set(TIP[0], TIP[1] - 0.02, TIP[2])
  carapuca.add(pgPonta)
  // geada salpicada no pano
  for (const [x, y, z] of [[-0.16, 0.1, 0.17], [0.09, 0.17, 0.15], [0.15, 0.3, 0.03], [-0.05, 0.25, 0.08]] as const) {
    const cristal = new THREE.Mesh(new THREE.OctahedronGeometry(0.026), mat(FROST, { roughness: 0.2 }))
    cristal.position.set(x, y, z)
    cristal.rotation.set(rand(), rand(), rand())
    carapuca.add(cristal)
  }

  // ---- braço que abraça o peito ----------------------------------------------
  const bracoAbraco = p.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoAbraco, H)
  bracoAbraco.rotation.set(ABRACO_X, 0, ABRACO_Z)

  // ---- braço que estende a cuia ----------------------------------------------
  const bracoCuia = p.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoCuia, H)
  bracoCuia.rotation.set(CUIA_X, 0, CUIA_Z)

  // ---- a cuia de caldo congelado (filha da mão: fica em pé no mundo) -------
  const cuia = new THREE.Group()
  const inv = new THREE.Quaternion().setFromEuler(bracoCuia.rotation).invert()
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(inv)
  const HAND = -0.19 * H - 0.32 * H * 0.52
  cuia.position.set(0, HAND, 0).addScaledVector(up, 0.07)
  cuia.quaternion.copy(inv)
  cuia.scale.setScalar(CUIA_S)
  bracoCuia.add(cuia)

  const casca = lathe(
    [
      [0, 0], [0.09, 0.006], [0.17, 0.045], [0.218, 0.1], [0.232, 0.16], [0.226, 0.2],
      [0.208, 0.206], [0.206, 0.17], [0.19, 0.1], [0.12, 0.05], [0, 0.04],
    ],
    GOURD,
    { roughness: 0.32 },
  )
  cuia.add(casca)
  const aro = torus(0.217, 0.013, GOURD_LIGHT, { roughness: 0.4 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.203
  cuia.add(aro)
  // faixa entalhada da cuia: losangos claros em volta
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const los = rbox(0.04, 0.04, 0.012, 0.006, GOURD_LIGHT, { roughness: 0.5 })
    los.position.set(Math.sin(a) * 0.229, 0.135, Math.cos(a) * 0.229)
    los.rotation.set(0, a, Math.PI / 4)
    cuia.add(los)
  }

  // o caldo virou um bloco: domo laranja vitrificado
  const bloco = lathe(
    [[0, 0.12], [0.206, 0.12], [0.209, 0.2], [0.195, 0.245], [0.13, 0.272], [0, 0.28]],
    CALDO,
    { roughness: 0.22 },
  )
  cuia.add(bloco)
  const vidrado = lathe(
    [[0.16, 0.255], [0.1, 0.275], [0, 0.284]],
    CALDO_LIGHT,
    { roughness: 0.12 },
  )
  cuia.add(vidrado)
  // pedacinhos da roça presos no gelo: mandioca e cheiro-verde
  for (const [x, z, c, s] of [
    [-0.09, 0.08, '#f3e3b8', 0.04], [0.11, -0.05, '#f3e3b8', 0.035],
    [-0.02, -0.11, '#3f8a3a', 0.025], [0.07, 0.12, '#3f8a3a', 0.022],
  ] as const) {
    const pedaco = rbox(s, s * 0.7, s, s * 0.25, c, { roughness: 0.5 })
    pedaco.position.set(x, 0.268 - Math.hypot(x, z) * 0.12, z)
    pedaco.rotation.y = rand() * Math.PI
    cuia.add(pedaco)
  }
  // escorrido congelado pela borda, de frente para a câmera
  const escorrido = capsule(0.028, 0.1, CALDO, { roughness: 0.22 })
  escorrido.position.set(0.05, 0.165, 0.222)
  escorrido.rotation.x = 0.18
  cuia.add(escorrido)
  const pgCaldo = icicle(0.022, 0.07)
  pgCaldo.position.set(0.05, 0.1, 0.232)
  cuia.add(pgCaldo)
  // o vapor do caldo fervendo congelou em caracóis
  for (const [sx, seed] of [[-1, 0], [1, 1]] as const) {
    const fio = taper(
      [[sx * 0.07, 0.27, 0.0], [sx * 0.1, 0.36, 0.02], [sx * 0.05, 0.44, 0.04],
        [sx * 0.09, 0.52 + seed * 0.04, 0.03]],
      0.03,
      0.01,
      FROST,
      { roughness: 0.25 },
      24,
      12,
    )
    cuia.add(fio)
  }

  // colher de pau presa em pé no bloco
  const colher = new THREE.Group()
  colher.position.set(-0.04, 0.27, -0.03)
  colher.rotation.set(-0.12, 0, -0.16)
  cuia.add(colher)
  const cabo = cylinder(0.022, 0.026, 0.46, WOOD, { roughness: 0.6 })
  cabo.position.y = 0.2
  colher.add(cabo)
  const ponteira = sphere(0.032, WOOD, { roughness: 0.6 })
  ponteira.position.y = 0.43
  colher.add(ponteira)
  const colarinho = torus(0.032, 0.014, CALDO, { roughness: 0.22 })
  colarinho.rotation.x = Math.PI / 2
  colarinho.position.y = 0.005
  colher.add(colarinho)

  // ---- fumaça do cachimbo congelada em bolinhas ----------------------------
  const fumaca = new THREE.Group()
  fumaca.position.set(-0.07 - 0.28, -0.14 + 0.02, 0.25 + 0.16)
  head.add(fumaca)
  for (const [i, [x, y, z, r]] of ([
    [0, 0.06, 0, 0.035], [-0.04, 0.13, 0.0, 0.045], [-0.05, 0.22, -0.01, 0.055],
    [-0.11, 0.31, -0.02, 0.063], [-0.13, 0.42, -0.03, 0.072],
  ] as const).entries()) {
    const bola = sphere(r, '#f4f8fb', { roughness: 0.35 })
    bola.position.set(x, y, z)
    fumaca.add(bola)
    if (i > 0) {
      const brilho = sphere(r * 0.25, '#ffffff', { roughness: 0.1 })
      brilho.position.set(x + r * 0.45, y + r * 0.45, z + r * 0.6)
      fumaca.add(brilho)
    }
  }

  // ---- nuvenzinha de vapor saindo da boca (CÁLT!) --------------------------
  // sai do canto direito da boca e sobe na diagonal, sem tapar o rosto
  const vapor = new THREE.Group()
  vapor.position.set(0.07, -0.12, 0.27)
  head.add(vapor)
  for (const [x, y, z, r, s] of [
    [0.08, 0.0, 0.06, 0.045, 77], [0.17, 0.05, 0.1, 0.06, 78], [0.27, 0.12, 0.12, 0.075, 79],
  ] as const) {
    const nuvem = puff(r, '#ffffff', 4, s, { roughness: 0.9 })
    nuvem.position.set(x, y, z)
    nuvem.scale.set(1.2, 0.85, 0.9)
    nuvem.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) translucent(m, 0.8)
    })
    vapor.add(nuvem)
  }

  // ---- ÓI!: tornozelo afundado e estrelinhas de frio -----------------------
  const frio = new THREE.Group()
  frio.position.set(SX, GY, SZ)
  root.add(frio)

  const gola = torus(0.13, 0.055, SNOW, { roughness: 0.92 })
  gola.rotation.x = Math.PI / 2
  gola.position.y = 0.01
  gola.scale.z = 0.8
  frio.add(gola)
  for (const [a, s] of [[0.5, 61], [2.4, 62], [4.2, 63]] as const) {
    const torrao = puff(0.06, SNOW, 3, s, { roughness: 0.92 })
    torrao.position.set(Math.cos(a) * 0.2, 0.03, Math.sin(a) * 0.2)
    torrao.scale.y = 0.6
    frio.add(torrao)
  }
  const estrelas: THREE.Mesh[] = []
  for (const [a, y, r] of [
    [-1.45, 0.16, 0.075], [-0.8, 0.33, 0.09], [0.0, 0.42, 0.075], [0.8, 0.31, 0.09], [1.45, 0.14, 0.07],
  ] as const) {
    const st = star(r)
    st.position.set(Math.sin(a) * 0.36, y, Math.cos(a) * 0.36)
    frio.add(st)
    estrelas.push(st)
  }
  // risquinhos de tremedeira dos dois lados do corpo: ( (  saci  ) )
  const ARC = 1.0
  for (const [cx, cy, side] of [[-0.12, 0.98, -1], [0.12, 0.72, 1]] as const) {
    for (const r of [0.3, 0.4]) {
      const risco = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.016, 8, 24, ARC),
        mat('#d6ecff', { roughness: 0.4, emissive: '#9fd4ff', emissiveIntensity: 0.25 }),
      )
      risco.position.set(cx, cy, 0.05)
      risco.rotation.z = (side < 0 ? Math.PI : 0) - ARC / 2
      frio.add(risco)
    }
  }

  // ---- o redemoinho virou pião de gelo -------------------------------------
  const redemoinho = new THREE.Group()
  redemoinho.position.set(-1.1, GY, -0.05)
  redemoinho.scale.setScalar(RED_S)
  root.add(redemoinho)

  const piao = new THREE.Group()
  piao.rotation.set(0.1, 0, 0.2) // congelado no meio do giro, inclinado
  redemoinho.add(piao)

  const corpoPiao = lathe(
    [[0, 0], [0.06, 0.08], [0.16, 0.3], [0.27, 0.56], [0.36, 0.8], [0.41, 0.95],
      [0.4, 1.02], [0.3, 1.08], [0.12, 1.12], [0, 1.13]],
    ICE_CLEAR,
    { roughness: 0.08, metalness: 0.1 },
  )
  translucent(corpoPiao, 0.62)
  piao.add(corpoPiao)
  const nucleo = lathe(
    [[0, 0.06], [0.05, 0.2], [0.15, 0.55], [0.23, 0.9], [0.18, 1.0], [0, 1.03]],
    '#ffffff',
    { roughness: 0.6 },
  )
  translucent(nucleo, 0.3)
  piao.add(nucleo)

  // espiral do vento, presa na superfície do gelo
  const espiral: [number, number, number][] = []
  for (let i = 0; i <= 64; i++) {
    const t = i / 64
    const y = 0.06 + t * 0.98
    const rr = 0.04 + 0.385 * Math.pow(t, 0.95)
    const a = t * Math.PI * 2 * 3.2
    espiral.push([Math.cos(a) * rr, y, Math.sin(a) * rr])
  }
  piao.add(taper(espiral, 0.018, 0.034, '#eaf8ff', { roughness: 0.2 }, 160, 10))

  // pega do pião: botão de gelo no topo
  const botao = cylinder(0.07, 0.09, 0.1, ICE_CLEAR, { roughness: 0.1, metalness: 0.1 })
  botao.position.y = 1.16
  piao.add(botao)
  const botaoTopo = sphere(0.07, ICE_CLEAR, { roughness: 0.1 })
  botaoTopo.position.y = 1.21
  botaoTopo.scale.y = 0.6
  piao.add(botaoTopo)

  // folhas da mata brasileira presas no gelo
  for (const [x, y, z, ry, rz] of [
    [0.12, 0.45, 0.12, 0.4, 0.6], [-0.15, 0.7, 0.1, -0.5, -0.4], [0.2, 0.85, -0.05, 1.2, 0.9],
    [-0.04, 0.28, 0.05, 2.0, 0.2],
  ] as const) {
    const folha = sphere(0.075, LEAF, { roughness: 0.6 })
    folha.scale.set(0.45, 1, 0.12)
    folha.position.set(x, y, z)
    folha.rotation.set(0, ry, rz)
    piao.add(folha)
  }
  const graveto = cylinder(0.01, 0.012, 0.26, '#6a4a2c', { roughness: 0.8 })
  graveto.position.set(0.0, 0.6, -0.08)
  graveto.rotation.set(0.3, 0, 1.0)
  piao.add(graveto)

  // a ponta fincada num montinho de neve, lascas de gelo em volta
  const montinho = puff(0.13, SNOW, 4, 81, { roughness: 0.92 })
  montinho.scale.y = 0.45
  montinho.position.y = 0.0
  redemoinho.add(montinho)
  for (const [a, r, s] of [[0.6, 0.06, 82], [2.3, 0.05, 83], [4.0, 0.07, 84]] as const) {
    const lasca = rock(r, ICE_CLEAR, s, { roughness: 0.1 })
    lasca.position.set(Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3)
    redemoinho.add(lasca)
  }

  // estrelas viradas para a câmera
  root.updateMatrixWorld(true)
  const camV = new THREE.Vector3(...CAM)
  for (const st of estrelas) st.lookAt(camV)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'neve', object: base },
    { name: 'pinheiro', group: 'neve', object: pinheiro },
    { name: 'saci', group: 'saci', object: saci },
    { name: 'carapuca', group: 'saci', object: carapuca },
    { name: 'frio', group: 'oi', object: frio },
    { name: 'bracoAbraco', group: 'oi', object: bracoAbraco },
    { name: 'redemoinho', group: 'va', object: redemoinho },
    { name: 'bracoCuia', group: 'caldo', object: bracoCuia },
    { name: 'cuia', group: 'caldo', object: cuia },
    { name: 'colher', group: 'caldo', object: colher },
    { name: 'fumaca', group: 'calt', object: fumaca },
    { name: 'vapor', group: 'calt', object: vapor },
  ]

  const grow = (from = 0.01, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Campo de neve na Suécia: o branco sobe do chão, pinheiro e tudo.',
    }),
    seq('pinheiro-rise', 'pinheiro', 0.3, 0.8, [riseFrom(0, 2.2)], { ease: 'easeOut' }),

    seq('saci-cai', 'saci', 1.7, 0.6, [ch('position.y', 2.6, 0)], {
      ease: 'easeIn',
      caption: 'O saci pula da mata brasileira direto na neve sueca — descalço, e com UM pé só.',
    }),
    // os braços são peças próprias: aparecem com o corpo, pendurados
    seq('braco-cuia-repouso', 'bracoCuia', 1.7, 0.01, [ch('rotation.x', 0, 0), ch('rotation.z', 0.12, 0.12)]),
    seq('braco-abraco-repouso', 'bracoAbraco', 1.7, 0.01, [ch('rotation.x', 0, 0), ch('rotation.z', -0.12, -0.12)]),
    seq('carapuca-cai', 'carapuca', 2.25, 0.5, [ch('position.y', CAP_Y + 0.9, CAP_Y)], { ease: 'easeIn' }),

    // ÓI!
    seq('saci-pula', 'saci', 3.4, 0.18, [ch('position.y', 0, 0.16)], {
      ease: 'easeOut',
      caption: 'A sola encosta no gelo: ÓI! — o Ó aberto de quem diz "dói".',
    }),
    seq('saci-volta', 'saci', 3.58, 0.25, [ch('position.y', 0.16, 0)], { ease: 'easeIn' }),
    seq('frio-estoura', 'frio', 3.5, 0.5, grow(), { ease: 'easeOut' }),
    seq('braco-abraca', 'bracoAbraco', 3.6, 0.6, [
      ch('rotation.x', 0, ABRACO_X), ch('rotation.z', -0.12, ABRACO_Z),
    ], { ease: 'easeOut' }),

    // VÁ!
    seq('redemoinho-gira', 'redemoinho', 5.3, 1.5, [
      ...grow(0.05, RED_S),
      ch('rotation.y', -Math.PI * 8, 0),
    ], {
      ease: 'easeOut',
      caption: 'Ele manda o redemoinho levá-lo de volta: VÁ! — e o redemoinho congela num pião de gelo.',
    }),

    // CALDO
    seq('braco-ergue', 'bracoCuia', 7.6, 0.7, [
      ch('rotation.x', 0, CUIA_X), ch('rotation.z', 0.12, CUIA_Z),
    ], {
      ease: 'easeOut',
      caption: 'Último recurso: a cuia de CALDO fervendo que ele trouxe da roça…',
    }),
    seq('cuia-aparece', 'cuia', 7.6, 0.6, grow(0.01, CUIA_S), { ease: 'easeOut' }),
    seq('colher-crava', 'colher', 8.9, 0.45, [ch('position.y', 0.27 + 0.7, 0.27)], {
      ease: 'easeIn',
      caption: '…vira pedra na mão dele, com a colher presa em pé.',
    }),

    // CÁLT!
    seq('fumaca-congela', 'fumaca', 10.3, 0.5, grow(), {
      ease: 'easeOut',
      caption: 'Ele tenta dizer CALDO, mas a língua gruda no L e só sai um estalo seco: CÁLT!',
    }),
    seq('vapor-sai', 'vapor', 10.45, 0.5, grow(), { ease: 'easeOut' }),

    // tremedeira final
    seq('treme-a', 'saci', 12.0, 0.12, [ch('rotation.z', 0, 0.035)], {
      caption: 'Oj, vad kallt! — Nossa, que frio!',
    }),
    seq('treme-b', 'saci', 12.12, 0.14, [ch('rotation.z', 0.035, -0.035)]),
    seq('treme-c', 'saci', 12.26, 0.14, [ch('rotation.z', -0.035, 0.025)]),
    seq('treme-d', 'saci', 12.4, 0.14, [ch('rotation.z', 0.025, 0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [0.0, 1.17, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'oj-vad-kallt',
    contexto:
      "Clima: saindo de casa em janeiro, entrando no carro gelado, pondo o pé no lago em pleno junho — o comentário universal de ponto de ônibus e de elevador. O molde 'Oj, vad + adjetivo!' rende sem fim: 'Oj, vad fint!', 'Oj, vad gott!', 'Oj, vad varmt!'.",
    fraseFonte: 'Nossa, que frio!',
    fraseAlvo: 'Oj, vad kallt!',
    pronuncia:
      "ÓI, va KÁLT! ('oj' = ÓI com Ó ABERTO, como em 'dói' — não o 'ôi' fechado do cumprimento; 'vad' perde o d: VÁ, sem R; 'kallt' com A curto, L de verdade e T seco no fim — nunca 'CÁU-tchi'; a força cai no KALLT)",
    ponteSonora:
      "ÓI! VÁ... CÁLT! (3 batidas: ói-va-KÁLT; a força cai no CÁLT; ÓI = o ÓI de 'DÓI', Ó ABERTO — nunca o 'ôi' fechado do cumprimento, nem o Ô comprido e triste de 'Åh, vad tråkigt'; VÁ = o 'vad' de sempre, o mesmo de 'VÁ, CÜL!' — sem D e sem R, senão vira 'var' (onde); CÁLT = o CALDO congelado, o mesmo de 'Det är kallt i lägenheten': o frio encolhe a palavra numa sílaba só, dura — A curto, L DE VERDADE (o brasileiro fala 'CÁU-do'; aqui a ponta da língua GRUDA no céu da boca de tanto frio, como na história, e é isso que faz o L: nunca 'cáu') e o D endurece num T SECO no fim, a língua se soltando do céu da boca num estalo, sem 'tchi'; esse T é obrigatório: sem ele sobra 'kall', a forma de 'handen är kall' (a mão está fria); no 'que frio!' é sempre kallT, como em 'det är kallt')",
    historia:
      "O saci pulou da mata brasileira direto num monte de neve sueca, de pé descalço — e ele só tem um pé. A sola encosta no gelo: ÓI!, o ÓI de quem diz 'dói'. Ele manda o redemoinho levá-lo de volta, VÁ!, mas o redemoinho congela num pião de gelo. Último recurso: a cuia de CALDO fervendo que trouxe da roça — que vira pedra na mão dele, com a colher em pé. Ele tenta dizer 'CALDO', mas o frio encolhe a palavra numa sílaba só: a ponta da língua gruda no céu da boca no L e só se solta num estalo seco, CÁLT! Nossa, que frio!",
  },
  createScene,
}

export default card
