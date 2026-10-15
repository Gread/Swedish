import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag har feber." — IÁ, RRÁR... FÊ-BER!
 *
 * A naja é bicho de SANGUE FRIO e nunca sentiu calor — hoje ela sobe do cesto
 * FERVENDO: bolsa de gelo na cabeça, bochechas vermelhas, ondas de calor
 * subindo do corpo. IÁ! de susto, um bafo quente de dragão no lugar do chiado
 * (RRÁR!) e um termômetro atravessado entre as presas, que trava a língua e
 * empurra o R pro fim: FÊ-BER! O bulbo estoura no vermelho.
 *
 * Diorama: piso de ladrilho azul-petróleo, tapete redondo vinho com borda
 * dourada, cesto de vime em espiral com a tampa caída, flauta largada.
 *
 * Acento saturado reservado ao objeto da ponte: o BULBO VERMELHO do termômetro.
 */

const TILE = '#2d5a5d'
const TILE_DARK = '#234648'
const GROUT = '#1b3537'
const RUG = '#7c2b2c'
const RUG_DARK = '#5f1f22'
const GOLD = '#d2a447'
const GOLD_DARK = '#a77d2e'
const WICKER = '#dcc08a'
const WICKER_DARK = '#c3a266'
const STITCH = '#7d5a32'
const WOOD = '#6a4126'
const WOOD_LIGHT = '#8b5a33'
const SNAKE = '#d6a326'
const SNAKE_DARK = '#b88a1c'
const BELLY = '#f0dda0'
const SPOT = '#74491f'
const CHEEK = '#e2604f'
const ICE = '#9fd2f0'
const ICE_DARK = '#5fa6d6'
const ICE_LINE = '#eef8fd'
const METAL = '#b9c0c6'
const HEAT = '#f2883a'
const PUFF = '#f7a865'
const GLASS = '#e8f4fa'
const RED = '#ff2a17' // acento reservado: o bulbo/coluna do termômetro

const GY = 0.17 // topo do tapete
const BASKET: [number, number, number] = [0, GY, -0.15]
const BASKET_H = 0.54

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b (espinhas de cobra, tubos, varetas). */
function segment(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: Parameters<typeof capsule>[3]) {
  const m = capsule(r, Math.max(a.distanceTo(b), 1e-3), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize())
  return m
}

/** Orienta uma peça chata: face (+z) na normal n, eixo y ao longo de up. */
function orient(m: THREE.Object3D, n: THREE.Vector3, up: THREE.Vector3) {
  const z = n.clone().normalize()
  const y = up.clone().sub(z.clone().multiplyScalar(up.dot(z))).normalize()
  const x = y.clone().cross(z)
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
}

/** Raio externo do perfil do cesto na altura y (interpolação linear). */
const BASKET_PROFILE: [number, number][] = [
  [0.5, 0.0], [0.58, 0.05], [0.625, 0.15], [0.64, 0.27], [0.625, 0.39], [0.59, 0.48], [0.565, 0.54],
]
function basketRadius(y: number) {
  for (let i = 0; i < BASKET_PROFILE.length - 1; i++) {
    const [r0, y0] = BASKET_PROFILE[i]
    const [r1, y1] = BASKET_PROFILE[i + 1]
    if (y <= y1) return THREE.MathUtils.lerp(r0, r1, (y - y0) / (y1 - y0))
  }
  return BASKET_PROFILE[BASKET_PROFILE.length - 1][0]
}

/** Ondinha de calor: tubo senoidal vertical com pontas arredondadas. */
function heatWave(height: number, amp: number, phase: number) {
  const g = new THREE.Group()
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 16; i++) {
    const y = (i / 16) * height
    pts.push(V(Math.sin(phase + (y / height) * Math.PI * 2.4) * amp, y, 0))
  }
  const r = 0.024
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 10, false),
    mat(HEAT, { emissive: HEAT, emissiveIntensity: 0.55, roughness: 0.4 }),
  )
  m.castShadow = true
  g.add(m)
  for (const p of [pts[0], pts[pts.length - 1]]) {
    const cap = sphere(r, HEAT, { emissive: HEAT, emissiveIntensity: 0.55, roughness: 0.4 }, 12)
    cap.position.copy(p)
    g.add(cap)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: ladrilho azul-petróleo + tapete vinho de borda dourada ----------
  const tapete = new THREE.Group()

  const slab = cylinder(2.55, 2.62, 0.1, TILE_DARK, { roughness: 0.6 })
  slab.position.y = 0.05
  tapete.add(slab)

  // ladrilhos: quadrados dentro do disco, com rejunte escuro por baixo
  const grout = cylinder(2.5, 2.5, 0.012, GROUT, { roughness: 0.9 })
  grout.position.y = 0.104
  tapete.add(grout)
  const T = 0.5
  for (let ix = -5; ix <= 5; ix++) {
    for (let iz = -5; iz <= 5; iz++) {
      const x = ix * T
      const z = iz * T
      if (Math.hypot(Math.abs(x) + T * 0.5, Math.abs(z) + T * 0.5) > 2.5) continue
      if (Math.hypot(x, z) < 1.55) continue // escondido pelo tapete
      const tile = rbox(T - 0.035, 0.03, T - 0.035, 0.012, (ix + iz) % 2 === 0 ? TILE : TILE_DARK, { roughness: 0.35 })
      tile.position.set(x, 0.11, z)
      tapete.add(tile)
    }
  }

  const rug = cylinder(1.78, 1.8, 0.05, RUG, { roughness: 0.93 })
  rug.position.y = GY - 0.025
  tapete.add(rug)

  const borda = torus(1.76, 0.045, GOLD, { roughness: 0.6 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = GY - 0.01
  tapete.add(borda)

  const faixa = torus(1.52, 0.022, GOLD_DARK, { roughness: 0.7 })
  faixa.rotation.x = Math.PI / 2
  faixa.position.y = GY + 0.002
  tapete.add(faixa)

  const medalhao = cylinder(1.05, 1.05, 0.008, RUG_DARK, { roughness: 0.93 })
  medalhao.position.y = GY + 0.004
  tapete.add(medalhao)

  // losangos dourados entre as faixas
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const los = rbox(0.11, 0.012, 0.11, 0.01, GOLD, { roughness: 0.6 })
    los.position.set(Math.cos(a) * 1.3, GY + 0.006, Math.sin(a) * 1.3)
    los.rotation.y = Math.PI / 4 - a
    tapete.add(los)
  }

  // franjas na borda
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    const fr = rbox(0.025, 0.012, 0.09, 0.005, '#e8d6a8', { roughness: 0.9 })
    fr.position.set(Math.cos(a) * 1.86, 0.113, Math.sin(a) * 1.86)
    fr.rotation.y = -a + Math.PI / 2
    tapete.add(fr)
  }

  // tigelinha de latão com moedas (o chapéu do encantador), na beira
  const tigela = lathe(
    [[0, 0], [0.12, 0], [0.18, 0.04], [0.21, 0.1], [0.2, 0.11], [0.17, 0.06], [0.1, 0.03], [0, 0.03]],
    GOLD,
    { roughness: 0.25, metalness: 0.8 },
  )
  tigela.position.set(1.05, GY - 0.01, 1.05)
  tapete.add(tigela)
  for (let i = 0; i < 4; i++) {
    const moeda = cylinder(0.04, 0.04, 0.012, '#e7c25a', { roughness: 0.25, metalness: 0.85 })
    moeda.position.set(1.05 + (rand() - 0.5) * 0.12, GY + 0.035 + i * 0.008, 1.05 + (rand() - 0.5) * 0.12)
    moeda.rotation.set((rand() - 0.5) * 0.4, 0, (rand() - 0.5) * 0.4)
    tapete.add(moeda)
  }

  // almofada no fundo
  const almofada = rbox(0.55, 0.16, 0.5, 0.08, '#3f6d4f', { roughness: 0.92 })
  almofada.position.set(-1.65, 0.19, -0.9)
  almofada.rotation.y = 0.5
  tapete.add(almofada)
  const borla = sphere(0.04, GOLD, { roughness: 0.6 })
  borla.position.set(-1.38, 0.2, -0.74)
  tapete.add(borla)

  root.add(tapete)

  // ---- cesto de vime em espiral ---------------------------------------------
  const cesto = new THREE.Group()
  cesto.position.set(...BASKET)
  root.add(cesto)

  const casca = lathe(
    [
      [0, 0], ...BASKET_PROFILE,
      [0.53, 0.54], [0.555, 0.46], [0.59, 0.3], [0.56, 0.12], [0.5, 0.08], [0, 0.08],
    ],
    WICKER_DARK,
    { roughness: 0.85 },
  )
  cesto.add(casca)

  // as voltas da espiral: anéis empilhados, alternando tons, com uma faixa vinho
  let k = 0
  for (let y = 0.04; y <= 0.5; y += 0.062, k++) {
    const cor = k === 4 ? RUG : k % 2 === 0 ? WICKER : '#d0b27a'
    const anel = torus(basketRadius(y) - 0.008, 0.034, cor, { roughness: 0.85 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = y
    cesto.add(anel)
  }
  const aro = torus(0.555, 0.045, WICKER_DARK, { roughness: 0.8 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = BASKET_H
  cesto.add(aro)

  // pontos de costura escuros atravessando as voltas
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2 + rand() * 0.05
    const y = 0.07 + (i % 7) * 0.062
    const r = basketRadius(y) + 0.025
    const ponto = rbox(0.018, 0.06, 0.016, 0.006, STITCH, { roughness: 0.85 })
    ponto.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    ponto.rotation.y = -a + Math.PI / 2
    ponto.rotation.z = 0.35
    cesto.add(ponto)
  }

  // fundo escuro de dentro (sombra do interior)
  const fundo = cylinder(0.5, 0.5, 0.01, '#3a2a1a', { roughness: 0.95 })
  fundo.position.y = 0.3
  cesto.add(fundo)

  // ---- tampa caída de lado, tombada no tapete --------------------------------
  // apoiada na barriga do cesto de um lado, com a outra borda no tapete
  const TAMPA_POS: [number, number, number] = [1.17, GY + 0.06, 0.05]
  const TAMPA_ROT: [number, number, number] = [0, 0, -0.13]
  const tampa = new THREE.Group()
  tampa.position.set(...TAMPA_POS)
  tampa.rotation.set(...TAMPA_ROT)
  root.add(tampa)

  const domo = lathe(
    [[0, 0.02], [0.58, 0.02], [0.6, 0.05], [0.55, 0.12], [0.4, 0.19], [0.2, 0.225], [0, 0.23]],
    WICKER_DARK,
    { roughness: 0.85 },
  )
  tampa.add(domo)
  for (const [rr, yy, cor] of [
    [0.56, 0.06, WICKER], [0.5, 0.11, '#d0b27a'], [0.41, 0.16, RUG], [0.3, 0.2, WICKER], [0.17, 0.222, '#d0b27a'],
  ] as const) {
    const anel = torus(rr, 0.03, cor, { roughness: 0.85 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = yy
    tampa.add(anel)
  }
  const pegador = sphere(0.075, WOOD, { roughness: 0.5 })
  pegador.scale.y = 0.8
  pegador.position.y = 0.27
  tampa.add(pegador)

  // ---- flauta de encantador largada no tapete --------------------------------
  const FLAUTA_Y = GY + 0.15
  const flauta = new THREE.Group()
  flauta.position.set(-0.92, FLAUTA_Y, 0.82)
  flauta.rotation.set(0, 0.45, -0.2)
  root.add(flauta)

  const bocal = cylinder(0.028, 0.034, 0.36, WOOD, { roughness: 0.45 })
  bocal.rotation.z = Math.PI / 2
  bocal.position.x = -0.32
  flauta.add(bocal)
  const ponteira = cylinder(0.042, 0.03, 0.05, GOLD, { roughness: 0.3, metalness: 0.75 })
  ponteira.rotation.z = Math.PI / 2
  ponteira.position.x = -0.52
  flauta.add(ponteira)

  const cabaca = lathe(
    [[0, -0.2], [0.07, -0.19], [0.14, -0.12], [0.155, -0.02], [0.13, 0.08], [0.07, 0.15], [0.035, 0.2], [0, 0.2]],
    WOOD_LIGHT,
    { roughness: 0.4 },
  )
  cabaca.rotation.z = -Math.PI / 2
  cabaca.position.x = 0
  flauta.add(cabaca)
  for (const [x, rr] of [[-0.15, 0.04], [0.13, 0.12]] as const) {
    const anel = torus(rr, 0.016, GOLD, { roughness: 0.3, metalness: 0.75 })
    anel.rotation.y = Math.PI / 2
    anel.position.x = x
    flauta.add(anel)
  }

  for (const side of [-1, 1]) {
    const cano = cylinder(0.026, 0.026, 0.42, WOOD, { roughness: 0.45 })
    cano.rotation.z = Math.PI / 2
    cano.position.set(0.38, -0.03, side * 0.032)
    flauta.add(cano)
    const sino = cylinder(0.042, 0.027, 0.06, GOLD, { roughness: 0.3, metalness: 0.75 })
    sino.rotation.z = Math.PI / 2
    sino.position.set(0.61, -0.03, side * 0.032)
    flauta.add(sino)
    for (let h = 0; h < 3; h++) {
      const furo = sphere(0.011, '#2a1a10', { roughness: 0.6 }, 10)
      furo.position.set(0.28 + h * 0.08, -0.004, side * 0.032)
      flauta.add(furo)
    }
  }

  // ---- NAJA: espiral no cesto + pescoço em S --------------------------------
  const naja = new THREE.Group()
  naja.position.set(...BASKET)
  root.add(naja)

  // volta enrolada dentro do cesto, aparecendo acima do aro
  const COIL_Y = 0.52
  const COIL_R = 0.31
  const espiral = torus(COIL_R, 0.15, SNAKE, { roughness: 0.55 })
  espiral.rotation.x = Math.PI / 2
  espiral.position.y = COIL_Y
  naja.add(espiral)

  // ponta da cauda pendurada por cima do aro, do lado esquerdo
  const cauda = new THREE.CatmullRomCurve3([
    V(-0.24, COIL_Y + 0.04, -0.18), V(-0.48, COIL_Y + 0.13, -0.12), V(-0.63, COIL_Y + 0.05, -0.05),
    V(-0.68, COIL_Y - 0.14, 0.0), V(-0.67, COIL_Y - 0.28, 0.03),
  ])
  // tubo afinando até a ponta (a base fica enterrada na volta enrolada)
  const TUB = 40
  const RAD = 16
  const caudaGeo = new THREE.TubeGeometry(cauda, TUB, 1, RAD, false)
  const cpos = caudaGeo.attributes.position
  const cv = new THREE.Vector3()
  for (let i = 0; i < cpos.count; i++) {
    const t = Math.floor(i / (RAD + 1)) / TUB
    const c = cauda.getPointAt(t)
    const r = THREE.MathUtils.lerp(0.13, 0.008, Math.pow(t, 1.1))
    cv.fromBufferAttribute(cpos, i).sub(c).multiplyScalar(r).add(c)
    cpos.setXYZ(i, cv.x, cv.y, cv.z)
  }
  caudaGeo.computeVertexNormals()
  const caudaMesh = new THREE.Mesh(caudaGeo, mat(SNAKE, { roughness: 0.55, size: 0.5 }))
  caudaMesh.castShadow = true
  caudaMesh.receiveShadow = true
  naja.add(caudaMesh)

  // espinha erguida: sai da volta (frente-direita), S em x, termina no queixo
  const espinha: [number, number, number, number][] = [
    [0.22, COIL_Y, 0.2, 0.155],
    [0.36, 0.76, 0.24, 0.155],
    [0.3, 1.0, 0.26, 0.15],
    [0.06, 1.18, 0.27, 0.145],
    [-0.1, 1.38, 0.27, 0.14],
    [-0.06, 1.58, 0.28, 0.135],
    [0.0, 1.76, 0.29, 0.13],
    [0.0, 1.92, 0.31, 0.13],
  ]
  const curva = new THREE.CatmullRomCurve3(espinha.map(([x, y, z]) => V(x, y, z)))
  const raio = (t: number) => {
    const f = t * (espinha.length - 1)
    const i = Math.min(espinha.length - 2, Math.floor(f))
    return THREE.MathUtils.lerp(espinha[i][3], espinha[i + 1][3], f - i)
  }
  const N = 26
  const frente = (t: number) => {
    const tan = curva.getTangent(t)
    const f = V(0, 0.1, 1)
    return f.sub(tan.clone().multiplyScalar(f.dot(tan))).normalize()
  }
  for (let i = 0; i < N; i++) {
    const t0 = i / N
    const t1 = (i + 1) / N
    naja.add(segment(curva.getPoint(t0), curva.getPoint(t1), raio(t0), SNAKE, { roughness: 0.55 }))
  }

  // escamas ventrais creme: placas sobrepostas na frente da parte erguida
  // (detalhe nítido por cima da pele — o refine não as funde)
  for (let t = 0.3; t <= 0.985; t += 0.032) {
    const r = raio(t)
    const f = frente(t)
    const placa = sphere(1, BELLY, { roughness: 0.5, size: 0.2 }, 20)
    placa.scale.set(r * 0.64, 0.09, r * 0.34)
    placa.position.copy(curva.getPoint(t)).add(f.clone().multiplyScalar(r * 0.8))
    // eixo y local ao longo da espinha, z para a frente
    orient(placa, f, curva.getTangent(t))
    naja.add(placa)
  }

  // losangos marrons nas laterais do corpo (alternando os lados)
  for (let i = 0; i < 12; i++) {
    const t = 0.06 + i * 0.075
    const p = curva.getPoint(t)
    const tan = curva.getTangent(t)
    const ang = (i % 2 === 0 ? 1 : -1) * 1.15
    const n = frente(t).applyAxisAngle(tan, ang)
    const los = rbox(0.1, 0.1, 0.024, 0.01, SPOT, { roughness: 0.6 })
    los.position.copy(p).add(n.clone().multiplyScalar(raio(t) * 0.99))
    orient(los, n, tan)
    los.rotateZ(Math.PI / 4)
    naja.add(los)
  }
  // e uma fileira no topo da volta enrolada
  for (let i = 0; i < 7; i++) {
    const a = -1.2 - i * 0.72
    const p = V(Math.cos(a) * COIL_R, COIL_Y + 0.143, Math.sin(a) * COIL_R)
    const los = rbox(0.1, 0.1, 0.03, 0.012, SPOT, { roughness: 0.6 })
    los.position.copy(p)
    orient(los, V(0, 1, 0), V(-Math.sin(a), 0, Math.cos(a)))
    los.rotateZ(Math.PI / 4)
    naja.add(los)
  }

  // ---- capelo: o leque aberto atrás do pescoço --------------------------------
  const CAPELO_Y = 1.66
  const capelo = new THREE.Group()
  capelo.position.set(-0.02, CAPELO_Y, 0.15)
  naja.add(capelo)

  const leque = sphere(0.5, SNAKE, { roughness: 0.55 })
  leque.scale.set(0.9, 1.0, 0.17)
  capelo.add(leque)
  for (const side of [-1, 1]) {
    // bordas do leque curvando para a frente
    const aba = sphere(0.3, SNAKE, { roughness: 0.55 })
    aba.scale.set(0.5, 1.15, 0.2)
    aba.position.set(side * 0.3, 0.02, 0.04)
    aba.rotation.y = -side * 0.55
    capelo.add(aba)
  }
  const ventre = sphere(0.38, BELLY, { roughness: 0.5 })
  ventre.scale.set(0.82, 0.95, 0.15)
  ventre.position.set(0, 0.0, 0.045)
  capelo.add(ventre)
  // desenho de óculos marrom: duas lentes (anel marrom, miolo creme) nas abas
  for (const side of [-1, 1]) {
    const lente = sphere(0.1, SPOT, { roughness: 0.6 })
    lente.scale.set(1, 1.1, 0.3)
    lente.position.set(side * 0.29, -0.06, 0.085)
    lente.rotation.y = side * 0.5
    capelo.add(lente)
    const miolo = sphere(0.055, BELLY, { roughness: 0.5 })
    miolo.scale.set(1, 1.1, 0.4)
    miolo.position.set(side * 0.3, -0.06, 0.11)
    miolo.rotation.y = side * 0.5
    capelo.add(miolo)
  }

  // ---- cabeça: bochechas, olhos semicerrados ---------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 2.02, 0.36)
  cabeca.scale.setScalar(1.18) // cabeça de personagem: o rosto precisa ler de longe
  naja.add(cabeca)

  const cranio = sphere(0.2, SNAKE, { roughness: 0.5 })
  cranio.scale.set(1.2, 0.74, 1.3)
  cranio.position.set(0, 0.02, 0.0)
  cabeca.add(cranio)

  const focinho = sphere(0.15, SNAKE, { roughness: 0.5 })
  focinho.scale.set(1.12, 0.62, 1.0)
  focinho.position.set(0, 0.0, 0.18)
  cabeca.add(focinho)

  const queixo = sphere(0.15, BELLY, { roughness: 0.5 })
  queixo.scale.set(1.05, 0.42, 1.12)
  queixo.position.set(0, -0.12, 0.1)
  cabeca.add(queixo)

  // boca entreaberta: o escuro onde o termômetro entra
  const boca = sphere(0.12, '#5a1f1c', { roughness: 0.6 })
  boca.scale.set(1.25, 0.32, 0.9)
  boca.position.set(0, -0.08, 0.17)
  cabeca.add(boca)

  for (const side of [-1, 1]) {
    // olho grande, saltado da testa, virado um pouco para fora
    const olho = new THREE.Group()
    olho.position.set(side * 0.125, 0.07, 0.185)
    olho.rotation.y = side * 0.3
    cabeca.add(olho)
    const esclera = sphere(0.068, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.75
    olho.add(esclera)
    const pupila = sphere(0.034, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(-side * 0.008, -0.022, 0.044)
    olho.add(pupila)
    const reflexo = sphere(0.01, '#ffffff', { roughness: 0.1 }, 10)
    reflexo.position.set(-side * 0.004, -0.008, 0.075)
    olho.add(reflexo)
    // pálpebra pesada: meia casca descendo pela frente do olho (febre)
    const palpebra = new THREE.Mesh(
      new THREE.SphereGeometry(0.073, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(SNAKE_DARK, { roughness: 0.5, size: 0.15 }),
    )
    palpebra.castShadow = true
    palpebra.scale.z = 0.8
    palpebra.rotation.x = 0.42
    olho.add(palpebra)
    const narina = sphere(0.016, '#3a2614', { roughness: 0.5 }, 10)
    narina.position.set(side * 0.05, 0.03, 0.33)
    cabeca.add(narina)
  }

  // ---- bochechas vermelhas de febre -----------------------------------------
  const bochechas = new THREE.Group()
  cabeca.add(bochechas)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.055, CHEEK, { roughness: 0.6 })
    bochecha.scale.set(1.0, 0.62, 0.4)
    bochecha.position.set(side * 0.19, -0.005, 0.14)
    bochecha.rotation.y = side * 0.75
    bochechas.add(bochecha)
  }

  // ---- bolsa de gelo xadrez equilibrada no topo da cabeça ---------------------
  const BOLSA_Y = 0.2
  const bolsa = new THREE.Group()
  bolsa.position.set(0.02, BOLSA_Y, -0.02)
  bolsa.rotation.set(0.1, 0, 0.22)
  cabeca.add(bolsa)

  const saco = new THREE.Group()
  saco.scale.set(1, 0.48, 1)
  bolsa.add(saco)
  const pano = sphere(0.22, ICE, { roughness: 0.75 })
  saco.add(pano)
  // xadrez: meridianos e paralelos sobre o pano
  for (let i = 0; i < 4; i++) {
    const m = torus(0.222, 0.012, i % 2 === 0 ? ICE_LINE : ICE_DARK, { roughness: 0.75 })
    m.rotation.y = (i * Math.PI) / 4
    saco.add(m)
  }
  for (const [yy, cor] of [[0.0, ICE_LINE], [0.11, ICE_DARK], [-0.11, ICE_DARK], [0.18, ICE_LINE]] as const) {
    const rr = Math.sqrt(0.222 * 0.222 - yy * yy)
    const p = torus(rr, 0.012, cor, { roughness: 0.75 })
    p.rotation.x = Math.PI / 2
    p.position.y = yy
    saco.add(p)
  }
  const gargalo = cylinder(0.06, 0.075, 0.05, ICE_DARK, { roughness: 0.7 })
  gargalo.position.y = 0.115
  bolsa.add(gargalo)
  const tampinha = cylinder(0.075, 0.075, 0.06, METAL, { roughness: 0.25, metalness: 0.85 })
  tampinha.position.y = 0.165
  bolsa.add(tampinha)
  for (const yy of [0.145, 0.185]) {
    const friso = torus(0.076, 0.008, '#8e979e', { roughness: 0.3, metalness: 0.8 })
    friso.rotation.x = Math.PI / 2
    friso.position.y = yy
    bolsa.add(friso)
  }

  // ---- presas mordendo o termômetro ------------------------------------------
  const presas = new THREE.Group()
  presas.position.set(0, -0.06, 0.28)
  cabeca.add(presas)
  for (const side of [-1, 1]) {
    const presa = cone(0.02, 0.085, '#fbf7ec', { roughness: 0.3 })
    presa.rotation.x = Math.PI
    presa.position.set(side * 0.065, -0.035, 0)
    presas.add(presa)
  }

  // ---- termômetro de vidro atravessado na boca --------------------------------
  const TERMO_POS: [number, number, number] = [0.25, -0.11, 0.22]
  const termometro = new THREE.Group()
  termometro.position.set(...TERMO_POS)
  termometro.rotation.set(0, -0.3, 0.14)
  cabeca.add(termometro)

  const vidroMat = new THREE.MeshPhysicalMaterial({
    color: GLASS, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.42,
    clearcoat: 1, clearcoatRoughness: 0.1, depthWrite: false,
  })
  const vidro = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.92, 8, 20), vidroMat)
  vidro.rotation.z = Math.PI / 2
  vidro.position.x = -0.02
  termometro.add(vidro)

  const coluna = cylinder(0.013, 0.013, 0.9, RED, { emissive: RED, emissiveIntensity: 0.9 })
  coluna.rotation.z = Math.PI / 2
  coluna.position.x = 0.02
  termometro.add(coluna)

  const fundoEscala = rbox(0.82, 0.05, 0.01, 0.005, '#f7f3ea', { roughness: 0.5 })
  fundoEscala.position.set(-0.04, 0, -0.022)
  termometro.add(fundoEscala)
  for (let i = 0; i < 12; i++) {
    const longo = i % 3 === 0
    const risco = rbox(0.008, longo ? 0.05 : 0.03, 0.006, 0.002, '#2c2c2c', { roughness: 0.5 })
    risco.position.set(-0.4 + i * 0.065, longo ? 0.0 : 0.01, 0.03)
    termometro.add(risco)
  }
  const capa = cylinder(0.038, 0.038, 0.05, METAL, { roughness: 0.25, metalness: 0.85 })
  capa.rotation.z = Math.PI / 2
  capa.position.x = -0.51
  termometro.add(capa)

  const BULBO_X = 0.52
  const bulbo = sphere(0.075, RED, { emissive: RED, emissiveIntensity: 1.3, roughness: 0.15 })
  bulbo.position.x = BULBO_X
  termometro.add(bulbo)
  const brilho = sphere(0.022, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 1 }, 12)
  brilho.position.set(BULBO_X - 0.025, 0.035, 0.055)
  termometro.add(brilho)
  const luz = new THREE.PointLight('#ff5a3a', 2.2, 1.6, 2)
  luz.position.set(BULBO_X, 0, 0.12)
  termometro.add(luz)

  // ---- estouro: raios e gotas saltando do bulbo -------------------------------
  const estouro = new THREE.Group()
  estouro.position.x = BULBO_X
  termometro.add(estouro)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2
    const raioE = cone(0.024, 0.13, i % 2 === 0 ? RED : '#ff8a2a', {
      emissive: i % 2 === 0 ? RED : '#ff8a2a', emissiveIntensity: 1.1,
    }, 12)
    const d = 0.15 + (i % 2) * 0.03
    raioE.position.set(Math.cos(a) * d, Math.sin(a) * d, 0.03)
    raioE.rotation.z = a - Math.PI / 2
    estouro.add(raioE)
  }
  for (const [x, y, r] of [[0.2, 0.17, 0.022], [0.26, -0.05, 0.018], [0.1, -0.22, 0.02], [-0.05, 0.25, 0.016]] as const) {
    const gota = sphere(r, RED, { emissive: RED, emissiveIntensity: 1.0 }, 12)
    gota.position.set(x, y, 0.04)
    estouro.add(gota)
  }

  // ---- baforada quente saindo do canto da boca ---------------------------------
  const bafo = new THREE.Group()
  bafo.position.set(-0.34, 0.02, 0.16)
  cabeca.add(bafo)
  for (const [x, y, z, r, s] of [
    [0, 0, 0, 0.085, 3], [-0.13, 0.1, 0.02, 0.068, 5], [-0.22, 0.22, 0.03, 0.05, 7],
  ] as const) {
    const nuvem = puff(r, PUFF, 5, s, { roughness: 0.9, emissive: '#f08a3a', emissiveIntensity: 0.22 })
    nuvem.position.set(x, y, z)
    bafo.add(nuvem)
  }

  // ---- três ondinhas de calor subindo do corpo ---------------------------------
  const ondas = new THREE.Group()
  naja.add(ondas)
  for (const [x, y, z, h, ph] of [
    [-0.6, 0.98, 0.3, 0.5, 0], [0.66, 1.08, 0.32, 0.48, 1.2], [0.78, 0.6, 0.4, 0.38, 2.1],
  ] as const) {
    const onda = heatWave(h, 0.045, ph)
    onda.position.set(x, y, z)
    ondas.add(onda)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'tapete', group: 'chao', object: tapete },
    { name: 'cesto', group: 'cesto', object: cesto },
    { name: 'tampa', group: 'cesto', object: tampa },
    { name: 'flauta', group: 'cesto', object: flauta },
    { name: 'naja', group: 'naja', object: naja },
    { name: 'capelo', group: 'naja', object: capelo },
    { name: 'cabeca', group: 'naja', object: cabeca },
    { name: 'bolsa', group: 'fervendo', object: bolsa },
    { name: 'bochechas', group: 'fervendo', object: bochechas },
    { name: 'ondas', group: 'fervendo', object: ondas },
    { name: 'bafo', group: 'rrar', object: bafo },
    { name: 'termometro', group: 'feber', object: termometro },
    { name: 'presas', group: 'feber', object: presas },
    { name: 'estouro', group: 'estouro', object: estouro },
  ]

  const s3 = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('tapete-sobe', 'tapete', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Um tapete redondo vinho, de borda dourada: o palco do encantador de serpentes.',
    }),

    seq('cesto-sobe', 'cesto', 1.2, 0.8, [riseFrom(BASKET[1], 0.9)], {
      ease: 'easeOut',
      caption: 'O cesto de vime da naja — a tampa salta, e a flauta fica largada no tapete: hoje não tem dança.',
    }),
    seq('tampa-salta', 'tampa', 2.0, 0.35, [
      ch('position.x', BASKET[0], 0.7), ch('position.y', GY + BASKET_H, GY + 0.95), ch('position.z', BASKET[2], 0.0),
      ch('rotation.x', 0, 0.5), ch('rotation.z', 0, -0.6),
    ], { ease: 'easeOut' }),
    seq('tampa-cai', 'tampa', 2.35, 0.45, [
      ch('position.x', 0.7, TAMPA_POS[0]), ch('position.y', GY + 0.95, TAMPA_POS[1]), ch('position.z', 0.0, TAMPA_POS[2]),
      ch('rotation.x', 0.5, TAMPA_ROT[0]), ch('rotation.z', -0.6, TAMPA_ROT[2]),
    ], { ease: 'easeIn' }),
    seq('flauta-rola', 'flauta', 2.2, 0.7, [riseFrom(FLAUTA_Y, 0.7), ch('rotation.y', 1.4, 0.45)], {
      ease: 'easeOut',
    }),

    seq('naja-sobe', 'naja', 3.4, 1.1, [riseFrom(BASKET[1], 2.0), ch('position.z', BASKET[2] - 0.22, BASKET[2])], {
      ease: 'easeOut',
      caption: 'Do cesto sobe a NAJA — bicho de SANGUE FRIO, que nunca na vida sentiu calor.',
    }),
    seq('cabeca-ergue', 'cabeca', 3.4, 1.3, [ch('rotation.x', 0.6, 0)], { ease: 'easeOut' }),
    seq('capelo-abre', 'capelo', 4.3, 0.6, [ch('scale.x', 0.12, 1)], { ease: 'easeOut' }),

    seq('bolsa-cai', 'bolsa', 5.5, 0.45, [ch('position.y', 1.4, BOLSA_Y)], {
      ease: 'easeIn',
      caption: 'Mas hoje ela está FERVENDO: bolsa de gelo na cabeça, bochechas vermelhas, calor subindo do corpo.',
    }),
    seq('bolsa-amassa', 'bolsa', 5.95, 0.15, [ch('scale.y', 1, 0.7)], { ease: 'easeOut' }),
    seq('bolsa-assenta', 'bolsa', 6.1, 0.3, [ch('scale.y', 0.7, 1)], { ease: 'easeOut' }),
    seq('bochechas-coram', 'bochechas', 6.1, 0.5, s3(0.01, 1), { ease: 'easeOut' }),
    seq('ondas-sobem', 'ondas', 6.3, 0.8, [ch('position.y', -0.5, 0), ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('cabeca-susto', 'cabeca', 7.6, 0.22, [ch('rotation.x', 0, -0.38)], {
      ease: 'easeOut',
      caption: 'IÁ! — ela leva um susto com o próprio calor…',
    }),
    seq('cabeca-volta', 'cabeca', 8.5, 0.35, [ch('rotation.x', -0.38, 0)], { ease: 'easeInOut' }),
    seq('bafo-sopra', 'bafo', 8.5, 0.7, [...s3(0.01, 1), ch('position.x', -0.2, -0.34), ch('position.y', -0.06, 0.02)], {
      ease: 'easeOut',
      caption: '…e em vez do chiado de cobra sai um bafo quente de dragão: RRÁR!',
    }),

    seq('termometro-entra', 'termometro', 10.0, 0.6, [
      ch('position.x', 1.7, TERMO_POS[0]), ch('rotation.z', 0.9, 0.14),
    ], {
      ease: 'easeOut',
      caption: 'Tenta dizer FEBRE, mas o termômetro trava a língua, a boca não abre o É e o R escorrega pro fim: FÊ-BER!',
    }),
    seq('presas-mordem', 'presas', 10.6, 0.3, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('estouro-explode', 'estouro', 11.7, 0.3, s3(0.01, 1.35), {
      ease: 'easeOut',
      caption: 'O bulbo estoura no vermelho: se até a cobra de sangue frio está com febre, a coisa é séria.',
    }),
    seq('estouro-assenta', 'estouro', 12.0, 0.3, s3(1.35, 1), { ease: 'easeInOut' }),

    seq('cabeca-tomba', 'cabeca', 13.2, 0.6, [ch('rotation.z', 0, 0.1)], {
      ease: 'easeInOut',
      caption: 'Jag har feber. — Estou com febre.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.6, 5.3], target: [0.05, 1.32, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-feber',
    contexto:
      "Saúde: ligando pro trabalho de manhã, falando com o 1177 ou no apotek. Com criança: 'Hon har feber' — e a förskola costuma pedir um dia inteiro sem febre antes de ela voltar.",
    fraseFonte: 'Estou com febre.',
    fraseAlvo: 'Jag har feber.',
    pronuncia:
      "iá rar FÊÊ-ber ('har' com h soprado e R brando no fim; 'feber' com Ê FECHADO e longo — nada do É aberto de 'febre' — e o R no FIM da palavra; o '-ber' é curtinho)",
    ponteSonora:
      "IÁ, RRÁR... FÊ-BER! (4 sílabas: iá-rrár-FÊÊ-ber; força no FÊÊ; IÁ é o 'jag' de sempre, I de IOGA, nunca J chiado; RRÁR = o BAFO QUENTE de febre que a naja solta no lugar do chiado de cobra, o MESMO RRÁR de 'Jag har ont i magen', 'Jag har ett möte' e 'Jag har missat bussen': h soprado de RR carioca, A longo e R BRANDO no fim, AUDÍVEL — sem esse R sobra 'ha', outro verbo (por isso nada de 'há' do português, que é mudo e sem R); FÊ-BER = a FEBRE com o R escorregado pro FIM, F-E-B-E-R, nunca 'fé-bri': com o termômetro atravessado na boca a língua não faz o 'bre' e o R desliza pra depois do E; o FÊ é FECHADO, o de 'você', e LONGO — o termômetro também não deixa a boca escancarar o É aberto de 'febre' — e leva a força; o -ber sai curtinho e fraco, com o R brando bem no fim)",
    historia:
      'A naja é bicho de SANGUE FRIO: nunca na vida sentiu calor. Hoje, dentro do cesto, ela está FERVENDO — bolsa de gelo na cabeça, bochechas vermelhas e um termômetro atravessado entre as presas; a flauta do encantador ficou largada no tapete, porque hoje não tem dança. Ela solta um IÁ! de susto com o próprio calor e, em vez do chiado de cobra, sai pela boca um bafo quente de dragão: RRÁR! Tenta dizer FEBRE, mas o termômetro trava a língua, a boca não abre o É e o R escorrega pro fim: FÊ-BER! O bulbo do termômetro estoura no vermelho — se até a cobra de sangue frio está com febre, a coisa é séria.',
  },
  createScene,
  refine: { organic: ['naja', 'capelo', 'cabeca'] },
}

export default card
