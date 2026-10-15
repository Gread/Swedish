import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person,
} from '../rig/helpers'

/**
 * "Vilket väder, va?" — o VILão de capa espreme um sachê de KETchup
 * (VÍL+KET = VÍLKET) e manda você VÊ o céu (VÉ-der = väder). Lá em cima a
 * nuvem raivosa cospe granizo e sol no mesmo metro quadrado, e o guarda-chuva
 * vira do avesso. A placa de seta fecha com o VÁ.
 *
 * Diorama: calçada de laje molhada com poça, vilão à esquerda, nuvem vilã
 * suspensa à direita com sol espiando, guarda-chuva do avesso na poça e
 * placa-seta na frente.
 */

const CONCRETE = '#878d95'
const CONCRETE_DARK = '#565b63'
const GROUT = '#6b7078'
const PUDDLE = '#2e6b90'
const CAPE = '#242b49'
const CAPE_LIGHT = '#39416b'
const CLOTH = '#3a3f5c'
const SKIN = '#e8c39e'
const HAIR = '#2a2018'
const KETCHUP = '#cf3222' // acento saturado — reservado ao sachê de KETchup
const CLOUD = '#5f6771'
const CLOUD_DARK = '#4a515b'
const CLOUD_LIGHT = '#6e7681'
const ICE = '#cfe4ef'
const UMBRELLA = '#3b4a7a'
const UMBRELLA_LIGHT = '#5a6798'
const WOOD = '#8a6a42'
const STEEL = '#9aa1a8'
const SIGN = '#2f6b5e'
const SIGN_FACE = '#eaf0e7'
const SUN = '#f6c34a'

const GY = 0.18 // topo da calçada

// pose final das peças móveis (repetida nas sequences)
const CLOUD_Y = 2.15
const UMB_TILT = 0.18
const COPA_TILT = 0.1
const SIGN_TILT = 0.05

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: calçada encharcada ---------------------------------
  const base = new THREE.Group()

  const bed = cylinder(2.6, 2.7, 0.12, CONCRETE_DARK, { roughness: 0.92 })
  bed.position.y = 0.06
  base.add(bed)

  const pavement = cylinder(2.52, 2.6, 0.06, CONCRETE, { roughness: 0.85 })
  pavement.position.y = 0.15
  base.add(pavement)

  // juntas das lajes (lâminas finas: box é aceitável aqui)
  for (const [jx, jz, ja, jl] of [
    [0.1, 0.35, 0.0, 3.4],
    [0.1, 0.35, Math.PI / 2, 3.0],
    [-1.5, -0.7, Math.PI / 2, 1.6],
  ] as const) {
    const joint = rbox(jl, 0.014, 0.05, 0.006, GROUT, { roughness: 0.9 })
    joint.position.set(jx, GY - 0.002, jz)
    joint.rotation.y = ja
    base.add(joint)
  }

  // poça grande (o guarda-chuva fica plantado nela) + poça pequena
  const puddle = cylinder(0.94, 0.9, 0.02, PUDDLE, { roughness: 0.06 })
  puddle.position.set(1.25, GY + 0.01, 0.2)
  puddle.scale.z = 0.82
  base.add(puddle)

  const puddleRim = torus(0.94, 0.02, '#3d7fa6', { roughness: 0.2 })
  puddleRim.rotation.x = Math.PI / 2
  puddleRim.position.set(1.25, GY + 0.012, 0.2)
  puddleRim.scale.z = 0.82
  base.add(puddleRim)

  const puddleSmall = cylinder(0.44, 0.42, 0.02, PUDDLE, { roughness: 0.06 })
  puddleSmall.position.set(-1.85, GY + 0.01, -0.95)
  puddleSmall.scale.z = 0.7
  base.add(puddleSmall)

  // adereços de calçada: ralo, pedra solta, tufo de mato, folheto molhado
  const ralo = cylinder(0.3, 0.3, 0.045, '#4a4e54', { roughness: 0.35, metalness: 0.65 })
  ralo.position.set(-0.5, GY - 0.005, 1.55)
  base.add(ralo)
  for (let i = 0; i < 4; i++) {
    const bar = rbox(0.5, 0.02, 0.045, 0.008, '#3b3f45', { roughness: 0.4, metalness: 0.6 })
    bar.position.set(-0.5, GY + 0.02, 1.55 - 0.15 + i * 0.1)
    base.add(bar)
  }

  const pedra = rock(0.14, '#7d838a', 31, { roughness: 0.92 })
  pedra.position.set(1.95, GY + 0.05, -1.15)
  pedra.rotation.y = rand() * Math.PI
  base.add(pedra)

  const mato = puff(0.17, '#3f6b45', 5, 32, { roughness: 0.92 })
  mato.position.set(-2.15, GY + 0.1, 0.55)
  base.add(mato)

  const folheto = rbox(0.3, 0.012, 0.22, 0.01, '#d8d2c4', { roughness: 0.9 })
  folheto.position.set(0.55, GY + 0.008, 1.95)
  folheto.rotation.set(0.02, rand() * Math.PI, 0.03)
  base.add(folheto)

  const guimba = capsule(0.02, 0.07, '#e2dccd', { roughness: 0.9 })
  guimba.position.set(-1.15, GY + 0.02, 1.5)
  guimba.rotation.set(Math.PI / 2, 0, rand() * Math.PI)
  base.add(guimba)

  root.add(base)

  // ---- o VILão (VÍL) --------------------------------------------------------
  const vilao = new THREE.Group()
  vilao.position.set(-1.25, GY, 0.5)
  vilao.rotation.y = 1.45 // olha para o guarda-chuva/nuvem (olhos em +z local)

  const p = person({ body: CLOTH, skin: SKIN, height: 1.5, armAngle: 0.35 })
  vilao.add(p)

  const head = p.getObjectByName('head')!
  const armR = p.getObjectByName('armR')!
  const armL = p.getObjectByName('armL')!
  // O braço de person() gira em torno do próprio centro: para erguer de
  // verdade, cada braço é apontado a partir do ombro (pivô reposicionado).
  const aim = (arm: THREE.Object3D, shoulder: THREE.Vector3, dir: THREE.Vector3) => {
    const d = dir.clone().normalize()
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d)
    arm.position.copy(shoulder).addScaledVector(d, 0.2)
  }
  // braço de trás estende o sachê à frente do rosto, na altura da "janela"
  aim(armR, new THREE.Vector3(0.293, 0.7, 0), new THREE.Vector3(-0.05, 0.45, 0.6))
  // braço do lado da câmera aponta pro céu: "olha isso!"
  aim(armL, new THREE.Vector3(-0.293, 0.7, 0), new THREE.Vector3(-0.3, 0.9, 0.3))

  // capa: sólido de revolução achatado em z, pendurado atrás
  const capa = lathe(
    [[0.44, 0], [0.42, 0.1], [0.36, 0.35], [0.26, 0.6], [0.15, 0.76], [0.07, 0.82], [0, 0.84]],
    CAPE,
    { roughness: 0.9 },
  )
  capa.position.set(0, 0.03, -0.13)
  capa.scale.set(1, 1, 0.5)
  vilao.add(capa)

  const gola = torus(0.2, 0.055, CAPE_LIGHT, { roughness: 0.9 })
  gola.rotation.x = Math.PI / 2
  gola.position.set(0, 0.83, -0.04)
  vilao.add(gola)

  // capuz + bico do capuz na cabeça (rosto continua livre)
  const capuz = sphere(0.31, CAPE, { roughness: 0.9 })
  capuz.position.set(0, 0.06, -0.1)
  capuz.scale.set(1.02, 1, 1.05)
  head.add(capuz)

  const bico = cone(0.15, 0.34, CAPE, { roughness: 0.9 })
  bico.position.set(0, 0.2, -0.28)
  bico.rotation.x = -1.0
  head.add(bico)

  const bigode = capsule(0.024, 0.17, HAIR, { roughness: 0.85 })
  bigode.position.set(0, -0.1, 0.27)
  bigode.rotation.set(0.2, 0, Math.PI / 2)
  head.add(bigode)

  for (const side of [-1, 1]) {
    const brow = rbox(0.11, 0.028, 0.03, 0.012, HAIR, { roughness: 0.8 })
    brow.position.set(side * 0.108, 0.115, 0.245)
    brow.rotation.z = -side * 0.42
    head.add(brow)
  }

  root.add(vilao)

  // ---- o sachê de KETchup (acento) -----------------------------------------
  // fica exatamente na mão erguida do vilão (pose montada)
  vilao.updateMatrixWorld(true)
  const maoSache = new THREE.Vector3()
  armR.children[0].getWorldPosition(maoSache)
  const sache = new THREE.Group()
  sache.position.copy(maoSache).add(new THREE.Vector3(0.04, 0.12, 0))
  sache.rotation.set(0, 0.6, -0.5)
  const SACHE_Y = sache.position.y

  const pouch = rbox(0.26, 0.3, 0.075, 0.035, KETCHUP, { roughness: 0.32 })
  sache.add(pouch)

  for (const end of [-1, 1]) {
    const crimp = rbox(0.28, 0.05, 0.022, 0.008, '#e8dfd2', { roughness: 0.4 })
    crimp.position.y = end * 0.16
    sache.add(crimp)
  }

  const rotulo = rbox(0.18, 0.075, 0.02, 0.012, '#f3ece0', { roughness: 0.4 })
  rotulo.position.set(0, 0.02, 0.05)
  sache.add(rotulo)

  const listra = rbox(0.13, 0.022, 0.014, 0.006, KETCHUP, { roughness: 0.35 })
  listra.position.set(0, 0.02, 0.062)
  sache.add(listra)

  // canto rasgado por onde sai o jato
  const bico2 = cone(0.05, 0.1, '#e8dfd2', { roughness: 0.4 })
  bico2.position.set(0.1, 0.2, 0)
  bico2.rotation.z = -0.35
  sache.add(bico2)

  root.add(sache)

  // ---- o jato de ketchup, do bico até a barriga da nuvem --------------------
  sache.updateMatrixWorld(true)
  const jatoIni = sache.localToWorld(new THREE.Vector3(0.12, 0.24, 0))
  const jatoFim = new THREE.Vector3(0.3, 1.62, -0.3)
  const esguicho = new THREE.Group()
  esguicho.position.copy(jatoIni)

  // arco em parábola, do bico (origem local) até o respingo na nuvem
  const E = jatoFim.clone().sub(jatoIni)
  const arco = (t: number) =>
    E.clone().multiplyScalar(t).add(new THREE.Vector3(0, 4 * 0.42 * t * (1 - t), 0))
  const jatoCurve = new THREE.CatmullRomCurve3([0, 0.25, 0.5, 0.75, 1].map(arco))
  const jato = new THREE.Mesh(
    new THREE.TubeGeometry(jatoCurve, 48, 0.05, 12, false),
    mat(KETCHUP, { roughness: 0.3, size: 1.6 }),
  )
  jato.castShadow = true
  jato.receiveShadow = true
  esguicho.add(jato)

  const splat = sphere(0.17, KETCHUP, { roughness: 0.3 })
  splat.position.copy(E)
  splat.scale.set(1.1, 0.55, 1.1)
  esguicho.add(splat)

  // gotas pingando logo abaixo do arco
  for (const [t, dy, dr] of [[0.4, -0.2, 0.045], [0.7, -0.16, 0.036], [1.0, -0.24, 0.05]] as const) {
    const gota = sphere(dr, KETCHUP, { roughness: 0.3 })
    gota.position.copy(arco(t)).add(new THREE.Vector3(0.04, dy, 0))
    gota.scale.y = 1.35
    esguicho.add(gota)
  }
  root.add(esguicho)

  // ---- a nuvem vilã ---------------------------------------------------------
  const nuvem = new THREE.Group()
  nuvem.position.set(0.55, CLOUD_Y, -0.55)

  const corpo = puff(0.62, CLOUD, 7, 41, { roughness: 0.95 })
  nuvem.add(corpo)

  const lobeL = puff(0.4, CLOUD_LIGHT, 4, 42, { roughness: 0.95 })
  lobeL.position.set(-0.76, -0.08, 0.08)
  nuvem.add(lobeL)

  const lobeR = puff(0.34, CLOUD_LIGHT, 4, 43, { roughness: 0.95 })
  lobeR.position.set(0.74, -0.04, -0.06)
  nuvem.add(lobeR)

  const barriga = sphere(0.5, CLOUD_DARK, { roughness: 0.95 })
  barriga.position.set(0.03, -0.3, 0)
  barriga.scale.set(1.55, 0.48, 1.0)
  nuvem.add(barriga)

  // olhos da nuvem (esclera achatada + pupila) — as sobrancelhas são peça à parte
  // cada olho é pousado na superfície real da nuvem (os caroços do puff são
  // aleatórios e engoliam um dos olhos): raio de frente até bater na pele
  const pele = new THREE.Group()
  pele.add(corpo.clone(), lobeL.clone(), lobeR.clone(), barriga.clone())
  pele.updateMatrixWorld(true)
  const raio = new THREE.Raycaster()
  let faceZ = 0.62
  for (const side of [-1, 1]) {
    raio.set(new THREE.Vector3(side * 0.3, -0.14, 3), new THREE.Vector3(0, 0, -1))
    const hit = raio.intersectObject(pele, true)[0]
    if (hit) faceZ = Math.max(faceZ, hit.point.z)
  }
  for (const side of [-1, 1]) {
    const eye = sphere(0.13, '#f4f4ef', { roughness: 0.25 })
    eye.position.set(side * 0.3, -0.14, faceZ - 0.01)
    eye.scale.z = 0.55
    const pupil = sphere(0.06, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.3, -0.14, faceZ + 0.06)
    nuvem.add(eye, pupil)
  }

  // sol espiando no mesmo metro quadrado do granizo (grupo próprio: é luz,
  // não entra na pele refinada da nuvem)
  const sol = new THREE.Group()
  sol.position.set(1.22, 0.24, -0.2)
  sol.add(sphere(0.28, SUN, { emissive: SUN, emissiveIntensity: 1.2 }))
  for (let i = 0; i < 7; i++) {
    const raio = cone(0.05, 0.2, SUN, { emissive: SUN, emissiveIntensity: 1.0 })
    const a = (i / 7) * Math.PI * 2
    raio.position.set(Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0)
    raio.rotation.z = a - Math.PI / 2
    sol.add(raio)
  }
  nuvem.add(sol)
  root.add(nuvem)

  // sobrancelhas raivosas (peça própria, filha da nuvem)
  const sobrancelhas = new THREE.Group()
  sobrancelhas.position.set(0, -0.02, faceZ + 0.02)
  for (const side of [-1, 1]) {
    const brow = rbox(0.36, 0.1, 0.1, 0.04, '#1e2126', { roughness: 0.7 })
    brow.position.set(side * 0.31, 0.1, 0)
    brow.rotation.z = side * 0.48
    sobrancelhas.add(brow)
  }
  nuvem.add(sobrancelhas)

  // ---- granizo saindo da barriga da nuvem ----------------------------------
  const granizo = new THREE.Group()
  granizo.position.set(0.55, 1.66, -0.4)
  const hail = rng(57)
  for (let i = 0; i < 14; i++) {
    const shard = rock(0.045 + hail() * 0.035, ICE, 60 + i, { roughness: 0.15 })
    shard.position.set(
      (hail() - 0.5) * 1.7,
      -0.12 - i * 0.095 - hail() * 0.05,
      (hail() - 0.5) * 0.9,
    )
    shard.rotation.set(hail() * Math.PI, hail() * Math.PI, hail() * Math.PI)
    granizo.add(shard)
  }
  for (let i = 0; i < 5; i++) {
    const streak = capsule(0.011, 0.3, '#9fc6da', { roughness: 0.18 })
    streak.position.set((hail() - 0.5) * 1.6, -0.3 - hail() * 1.0, (hail() - 0.5) * 0.8)
    streak.rotation.z = 0.08
    granizo.add(streak)
  }
  root.add(granizo)

  // ---- guarda-chuva plantado na poça ---------------------------------------
  const guardaChuva = new THREE.Group()
  guardaChuva.position.set(1.4, GY, 0.45)
  guardaChuva.rotation.set(-0.08, 0, UMB_TILT)

  const haste = cylinder(0.032, 0.038, 0.95, STEEL, { roughness: 0.3, metalness: 0.7 })
  haste.position.y = 0.5
  guardaChuva.add(haste)

  const punho = cylinder(0.052, 0.052, 0.24, '#2c2f36', { roughness: 0.65 })
  punho.position.y = 0.14
  guardaChuva.add(punho)

  const anel = torus(0.045, 0.014, WOOD, { roughness: 0.6 })
  anel.rotation.x = Math.PI / 2
  anel.position.y = 0.28
  guardaChuva.add(anel)

  const ponteira = cone(0.04, 0.2, STEEL, { roughness: 0.25, metalness: 0.75 })
  ponteira.position.y = 1.07
  guardaChuva.add(ponteira)

  // copa: concha com o ápice no pivô e a boca virada para cima (pose final =
  // do avesso). rotation.x = PI é exatamente a cúpula normal, então o "vira do
  // avesso" é um giro de PI → 0 nesta peça.
  const copa = new THREE.Group()
  copa.position.y = 0.95
  copa.rotation.set(Math.PI, 0, COPA_TILT)

  const concha = lathe(
    [
      [0, 0], [0.18, 0.06], [0.36, 0.16], [0.52, 0.3], [0.6, 0.42], [0.615, 0.445],
      [0.575, 0.425], [0.5, 0.3], [0.34, 0.155], [0.16, 0.055], [0, 0.018],
    ],
    UMBRELLA,
    { roughness: 0.88 },
  )
  copa.add(concha)

  for (let i = 0; i < 8; i++) {
    const pivot = new THREE.Group()
    pivot.rotation.y = (i / 8) * Math.PI * 2
    const bent = i === 3 // uma vareta quebrada, torta pra fora
    const rib = capsule(0.016, 0.7, UMBRELLA_LIGHT, { roughness: 0.5 })
    rib.position.set(0.3, 0.22, 0)
    rib.rotation.z = bent ? -1.25 : -0.983
    pivot.add(rib)
    const tip = sphere(0.035, UMBRELLA_LIGHT, { roughness: 0.5 })
    tip.position.set(bent ? 0.68 : 0.6, bent ? 0.3 : 0.42, 0)
    pivot.add(tip)
    copa.add(pivot)
  }

  // granizo acumulado na concha virada
  for (const [bx, bz, br] of [[0.1, 0.08, 0.06], [-0.14, -0.05, 0.05], [0.02, -0.16, 0.055]] as const) {
    const ball = rock(br, ICE, 80 + br * 100, { roughness: 0.15 })
    ball.position.set(bx, 0.08, bz)
    copa.add(ball)
  }
  guardaChuva.add(copa)
  root.add(guardaChuva)

  // ---- placa-seta do VÁ -----------------------------------------------------
  const sinal = new THREE.Group()
  sinal.position.set(2.05, GY, 0.9)
  sinal.rotation.z = SIGN_TILT

  const poste = cylinder(0.045, 0.05, 1.5, STEEL, { roughness: 0.3, metalness: 0.65 })
  poste.position.y = 0.77
  sinal.add(poste)

  const placa = new THREE.Group()
  placa.position.y = 1.62
  placa.rotation.y = -0.5

  const chapa = rbox(0.52, 0.66, 0.06, 0.1, SIGN, { roughness: 0.35 })
  placa.add(chapa)

  const borda = rbox(0.44, 0.58, 0.02, 0.08, SIGN_FACE, { roughness: 0.4 })
  borda.position.z = 0.035
  placa.add(borda)

  const miolo = rbox(0.38, 0.52, 0.02, 0.07, SIGN, { roughness: 0.35 })
  miolo.position.z = 0.045
  placa.add(miolo)

  // a seta VÁ, apontando pro céu
  const setaHaste = rbox(0.11, 0.26, 0.02, 0.03, SIGN_FACE, { roughness: 0.4 })
  setaHaste.position.set(0, -0.11, 0.055)
  placa.add(setaHaste)

  const setaPonta = cone(0.16, 0.24, SIGN_FACE, { roughness: 0.4 })
  setaPonta.position.set(0, 0.14, 0.055)
  setaPonta.scale.z = 0.14
  placa.add(setaPonta)

  sinal.add(placa)
  root.add(sinal)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'vilao', group: 'vilao', object: vilao },
    { name: 'sache', group: 'ketchup', object: sache },
    { name: 'esguicho', group: 'ketchup', object: esguicho },
    { name: 'nuvem', group: 'tempo', object: nuvem },
    { name: 'sol', group: 'tempo', object: sol },
    { name: 'sobrancelhas', group: 'tempo', object: sobrancelhas },
    { name: 'granizo', group: 'granizo', object: granizo },
    { name: 'guardaChuva', group: 'granizo', object: guardaChuva },
    { name: 'copa', group: 'granizo', object: copa },
    { name: 'sinal', group: 'fecho', object: sinal },
  ]

  // ---- montagem -------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.75)], {
      ease: 'easeOut',
      caption: 'Calçada encharcada de novembro: a laje cinza e a poça brotam do chão…',
    }),

    seq('vilao-rise', 'vilao', 1.8, 0.8, [riseFrom(GY, 1.75)], {
      ease: 'easeOut',
      caption: '…e sobe um VILão de capa e bigode, parado ali do seu lado no ponto.',
    }),

    seq('sache-rise', 'sache', 3.6, 0.8, [riseFrom(SACHE_Y, 1.3)], {
      ease: 'easeOut',
      caption: '…ele saca um sachê de KETchup na sua janela: VÍL + KET = VÍLKET.',
    }),
    seq('sache-aperta', 'sache', 4.5, 0.4, [
      ch('scale.x', 1, 0.78),
      ch('scale.z', 1, 0.78),
      ch('scale.y', 1, 1.12),
    ]),
    seq('esguicho-jato', 'esguicho', 4.8, 0.7, [ch('scale.x', 0.04, 1)], { ease: 'easeOut' }),
    seq('sache-solta', 'sache', 4.95, 0.5, [
      ch('scale.x', 0.78, 1),
      ch('scale.z', 0.78, 1),
      ch('scale.y', 1.12, 1),
    ]),

    seq(
      'nuvem-condensa',
      'nuvem',
      5.6,
      0.9,
      [
        ch('scale.x', 0.02, 1),
        ch('scale.y', 0.02, 1),
        ch('scale.z', 0.02, 1),
        ch('position.y', 2.5, CLOUD_Y),
      ],
      {
        ease: 'easeOut',
        caption: '…e manda você VÊ o céu: lá condensa a NUVEM vilã — VÉ-der é o tempo.',
      },
    ),
    seq('sobrancelhas-fecham', 'sobrancelhas', 6.15, 0.6, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ]),
    seq('nuvem-bufa', 'nuvem', 6.9, 0.5, [ch('rotation.z', 0, 0.06)]),
    seq('nuvem-assenta', 'nuvem', 7.4, 0.5, [ch('rotation.z', 0.06, 0)]),

    seq('granizo-cai', 'granizo', 7.4, 0.8, [ch('scale.y', 0.02, 1)], {
      ease: 'easeOut',
      caption: '…a nuvem cospe GRANIZO e SOL no mesmo metro quadrado.',
    }),
    seq('chuva-rise', 'guardaChuva', 7.7, 0.8, [riseFrom(GY, 1.75)], { ease: 'easeOut' }),
    seq('copa-abre', 'copa', 8.0, 0.6, [
      ch('scale.x', 0.02, 1),
      ch('scale.y', 0.02, 1),
      ch('scale.z', 0.02, 1),
    ]),

    seq('copa-vira', 'copa', 9.2, 0.7, [
      ch('rotation.x', Math.PI, 0),
      ch('rotation.z', -0.1, COPA_TILT),
    ]),
    seq('chuva-tranco', 'guardaChuva', 9.4, 0.4, [ch('rotation.z', UMB_TILT, 0.32)]),
    seq('chuva-volta', 'guardaChuva', 9.8, 0.5, [ch('rotation.z', 0.32, UMB_TILT)]),

    seq('sinal-rise', 'sinal', 10.6, 0.8, [riseFrom(GY, 2.3)], {
      ease: 'easeOut',
      caption: 'Vilket väder, va? — "Que tempo, hein?" VÍL-KET VÉ-DER, VÁ?',
    }),
    seq('sinal-aponta', 'sinal', 11.5, 0.6, [ch('rotation.z', -0.1, SIGN_TILT)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.7, 5.4], target: [0.3, 1.35, -0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'vilket-vader-va',
    contexto:
      'Elevador, ponto de ônibus, lavanderia do prédio, fila do café — qualquer silêncio de 10 segundos ao lado de um conhecido.',
    fraseFonte: 'Que tempo, hein?',
    fraseAlvo: 'Vilket väder, va?',
    pronuncia: "VÍL-ket VÉ-der, va? ('d' bem leve, quase 'dh')",
    ponteSonora:
      "VÍL-ket VÉ-der, VÁ? (força em VÍL e em VÉ; VÉ aberto como em 'pé'; K DURO — nunca 'vilchet')",
    historia:
      'Um VILão de capa espreme um sachê de KETchup na sua janela e manda você olhar o céu. Lá fora, a nuvem cospe granizo e sol no mesmo metro quadrado, e seu guarda-chuva vira do avesso na hora.',
  },
  createScene,
  refine: { organic: ['nuvem'] },
}

export default card
