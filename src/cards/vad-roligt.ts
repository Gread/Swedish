import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vad roligt!" — VÁ, (pi)RÚÚ-LIT(o)!
 *
 * Mesa de festa: alguém finca num vaso de balinhas um PIRULITO de espiral
 * maior que o periquito. O periquito verde-limão escapa da gaiola dourada,
 * se agarra de lado na borda do disco e grita VÁ! — e repete o doce do jeito
 * torto dele: piRÚÚ-LIT! piRÚÚ-LIT!
 *
 * Diorama: toalha xadrez rosa e branca, gaiola dourada aberta ao fundo à
 * esquerda, vaso de vidro com balinhas no centro, pirulito gigante (o ÚNICO
 * elemento de cores saturadas: é o RÚÚ-LIT) e o periquito à direita do disco.
 */

const CLOTH = '#fbf4f1'
const CLOTH_PINK = '#f1a9c0'
const PINK_DEEP = '#de7f9f'
const WOOD = '#9a6a42'
const GOLD = '#c99a3e'
const GOLD_DARK = '#a77a2c'
const GLASS = '#dceff4'

// pirulito: o acento saturado
const CANDY = ['#e3263b', '#ffc21a', '#17a35f', '#2a6bd8']
const CANDY_WHITE = '#fff8ec'
const RIBBON = '#d42240'

// periquito
const LIME = '#9fd13a'
const LIME_LIGHT = '#c0e45a'
const WING_Y = '#dfe46a'
const BAR = '#1d2214'
const HEAD_Y = '#f8dc3c'
const TAIL = '#203f8e'
const FEET = '#c9a3a0'
const BEAK = '#e6e0d2'
const CERE = '#4f78d0'
const CHEEK = '#3550c4'
const MOUTH = '#4e1220'
const SOUND = '#fff0a0'

const TY = 0.2 // topo da toalha

// vaso + pirulito
const VX = -0.15
const VZ = 0.15
const STICK_Y0 = TY + 0.08
const CY = 1.95 // centro do disco
const R = 0.8 // raio do disco

// gaiola
const CGX = -1.5
const CGZ = -1.0
const CR = 0.6
const N_BARS = 18
const DOOR_A = (2 * Math.PI * 3) / N_BARS // poste da dobradiça
const DOOR_B = (2 * Math.PI * 5) / N_BARS // poste do trinco
const CAGE_H = 1.3
const DOOR_Y0 = 0.14
const DOOR_Y1 = 0.7

// ponto onde as patinhas agarram a borda do disco
const GRIP_A = -0.2
const BIRD_S = 1.2 // periquito grandão: é o protagonista
const GRIP: [number, number, number] = [VX + R * Math.cos(GRIP_A), CY + R * Math.sin(GRIP_A), VZ]
const BIRD_RY = -Math.PI / 2 + 0.38 // barriga pro disco, um tico virado pra câmera
const HEAD_RY = 1.25 // cabeça virada pra câmera

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- mesa de festa: toalha xadrez rosa e branca --------------------------
  const mesa = new THREE.Group()

  const tampo = cylinder(2.5, 2.5, 0.1, WOOD, { roughness: 0.6 })
  tampo.position.y = 0.05
  mesa.add(tampo)

  const toalha = cylinder(2.6, 2.72, 0.2, CLOTH, { roughness: 0.9 })
  toalha.position.y = 0.1
  mesa.add(toalha)

  // xadrez: quadrados rosa só onde cabem inteiros no disco
  const S = 0.42
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      if ((i + j) % 2 !== 0) continue
      const cx = i * S
      const cz = j * S
      const far = Math.hypot(Math.abs(cx) + S / 2, Math.abs(cz) + S / 2)
      if (far > 2.55) continue
      const tile = rbox(S, 0.012, S, 0.004, CLOTH_PINK, { roughness: 0.9 })
      tile.position.set(cx, TY + 0.006, cz)
      mesa.add(tile)
    }
  }

  const bainha = torus(2.61, 0.035, PINK_DEEP, { roughness: 0.85 })
  bainha.rotation.x = Math.PI / 2
  bainha.position.y = TY - 0.01
  mesa.add(bainha)

  // babadinho de bolinhas rosa na barra da toalha
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2
    const bola = sphere(0.055, k % 2 === 0 ? CLOTH_PINK : PINK_DEEP, { roughness: 0.85 })
    bola.position.set(Math.cos(a) * 2.72, 0.03, Math.sin(a) * 2.72)
    mesa.add(bola)
  }
  root.add(mesa)

  // ---- enfeites de festa: cupcake, chapeuzinho, presente, confete ----------
  const festa = new THREE.Group()

  const cupcake = new THREE.Group()
  cupcake.position.set(-1.55, TY, 1.25)
  const forminha = lathe(
    [[0, 0], [0.2, 0], [0.27, 0.24], [0.25, 0.25], [0, 0.24]],
    '#b9a3e0',
    { roughness: 0.75 },
    18,
  )
  cupcake.add(forminha)
  const cobertura = puff(0.2, '#fff1f5', 6, 61, { roughness: 0.5 })
  cobertura.position.y = 0.34
  cobertura.scale.set(1.15, 0.8, 1.15)
  cupcake.add(cobertura)
  const cereja = sphere(0.07, '#d8344a', { roughness: 0.25 })
  cereja.position.y = 0.52
  cupcake.add(cereja)
  for (let k = 0; k < 10; k++) {
    const a = rand() * Math.PI * 2
    const granulado = capsule(0.012, 0.04, ['#8fd8c4', '#b9a3e0', '#f1a9c0', '#f6d36b'][k % 4], {
      roughness: 0.5,
    })
    granulado.position.set(Math.cos(a) * 0.17, 0.39 + rand() * 0.06, Math.sin(a) * 0.17)
    granulado.rotation.set(rand() * 3, rand() * 3, rand() * 3)
    cupcake.add(granulado)
  }
  festa.add(cupcake)

  const chapeu = new THREE.Group()
  chapeu.position.set(1.95, TY, 1.05)
  chapeu.rotation.set(0, 0, 0.15)
  const cone1 = cone(0.22, 0.6, '#8fd8c4', { roughness: 0.6 })
  cone1.position.y = 0.3
  chapeu.add(cone1)
  for (const [fy, fr] of [[0.12, 0.178], [0.3, 0.115], [0.46, 0.06]] as const) {
    const faixa = torus(fr, 0.022, '#ffffff', { roughness: 0.6 })
    faixa.rotation.x = Math.PI / 2
    faixa.position.y = fy
    chapeu.add(faixa)
  }
  const pompom = puff(0.075, '#fff1f5', 5, 62, { roughness: 0.9 })
  pompom.position.y = 0.62
  chapeu.add(pompom)
  festa.add(chapeu)

  const presente = new THREE.Group()
  presente.position.set(1.75, TY, -1.25)
  presente.rotation.y = 0.5
  const caixa = rbox(0.5, 0.42, 0.5, 0.03, '#b9a3e0', { roughness: 0.6 })
  caixa.position.y = 0.21
  presente.add(caixa)
  for (const ry of [0, Math.PI / 2]) {
    const fita = rbox(0.1, 0.44, 0.52, 0.02, '#fff1f5', { roughness: 0.5 })
    fita.position.y = 0.21
    fita.rotation.y = ry
    presente.add(fita)
  }
  for (const s of [-1, 1]) {
    const alca = torus(0.08, 0.025, '#fff1f5', { roughness: 0.5 })
    alca.position.set(s * 0.08, 0.48, 0)
    alca.rotation.z = s * 0.5
    presente.add(alca)
  }
  festa.add(presente)

  const confeteCores = ['#8fd8c4', '#b9a3e0', '#f6d36b', '#f1a9c0', '#9fd0f0']
  for (let k = 0; k < 26; k++) {
    const a = rand() * Math.PI * 2
    const r = 1.0 + rand() * 1.4
    const conf = rbox(0.09, 0.012, 0.06, 0.005, confeteCores[k % confeteCores.length], {
      roughness: 0.5,
    })
    conf.position.set(Math.cos(a) * r, TY + 0.012, Math.sin(a) * r)
    conf.rotation.y = rand() * Math.PI
    festa.add(conf)
  }
  // balinhas soltas que caíram do vaso
  for (const [bx, bz, c] of [[0.55, 0.85, '#f6d36b'], [0.75, 0.55, '#8fd8c4'], [-0.75, 0.95, '#f1a9c0']] as const) {
    const bala = sphere(0.065, c, { roughness: 0.3 })
    bala.position.set(bx, TY + 0.06, bz)
    festa.add(bala)
  }
  root.add(festa)

  // ---- gaiola redonda dourada ao fundo -------------------------------------
  const gaiola = new THREE.Group()
  gaiola.position.set(CGX, TY, CGZ)

  const bandeja = lathe(
    [[0, 0], [CR + 0.08, 0], [CR + 0.1, 0.05], [CR + 0.06, 0.13], [CR - 0.02, 0.14], [0, 0.13]],
    GOLD_DARK,
    { roughness: 0.35, metalness: 0.8 },
  )
  gaiola.add(bandeja)

  for (const ry of [0.14, DOOR_Y1, CAGE_H]) {
    const anel = torus(CR, 0.02, GOLD, { roughness: 0.3, metalness: 0.85 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = ry
    gaiola.add(anel)
  }

  for (let k = 0; k < N_BARS; k++) {
    const a = (k / N_BARS) * Math.PI * 2
    const isDoorGap = k === 4 // barra cortada na abertura da portinhola
    const y0 = isDoorGap ? DOOR_Y1 : 0.14
    const h = CAGE_H - y0
    const barra = cylinder(0.013, 0.013, h, GOLD, { roughness: 0.3, metalness: 0.85 }, 8)
    barra.position.set(Math.cos(a) * CR, y0 + h / 2, Math.sin(a) * CR)
    gaiola.add(barra)
  }

  // cúpula: meridianos em meio-arco
  for (let k = 0; k < 4; k++) {
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(CR, 0.014, 8, 32, Math.PI),
      mat(GOLD, { roughness: 0.3, metalness: 0.85, size: 1.2 }),
    )
    arco.castShadow = true
    arco.scale.y = 0.75
    arco.position.y = CAGE_H
    arco.rotation.y = (k * Math.PI) / 4
    gaiola.add(arco)
  }
  const topo = sphere(0.06, GOLD, { roughness: 0.3, metalness: 0.85 })
  topo.position.y = CAGE_H + CR * 0.75
  gaiola.add(topo)
  const argola = torus(0.09, 0.018, GOLD, { roughness: 0.3, metalness: 0.85 })
  argola.position.y = CAGE_H + CR * 0.75 + 0.13
  gaiola.add(argola)

  // poleiro e balanço lá dentro
  const poleiroIn = cylinder(0.025, 0.025, CR * 1.9, WOOD, { roughness: 0.7 })
  poleiroIn.rotation.z = Math.PI / 2
  poleiroIn.position.y = 0.55
  gaiola.add(poleiroIn)
  const balanco = torus(0.2, 0.012, GOLD, { roughness: 0.3, metalness: 0.85 })
  balanco.position.set(0, 1.0, 0)
  gaiola.add(balanco)
  const comedouro = lathe([[0, 0], [0.1, 0], [0.12, 0.08], [0.1, 0.08], [0, 0.03]], '#8fd8c4', { roughness: 0.5 })
  comedouro.position.set(-0.2, 0.14, -0.2)
  gaiola.add(comedouro)
  root.add(gaiola)

  // ---- portinhola: dobradiça no poste A, escancarada pra fora --------------
  const pA = new THREE.Vector3(Math.cos(DOOR_A) * CR, DOOR_Y0, Math.sin(DOOR_A) * CR)
  const pB = new THREE.Vector3(Math.cos(DOOR_B) * CR, DOOR_Y0, Math.sin(DOOR_B) * CR)
  const DOOR_W = pA.distanceTo(pB)
  const DOOR_H = DOOR_Y1 - DOOR_Y0 - 0.03
  const DOOR_CLOSED = Math.atan2(-(pB.z - pA.z), pB.x - pA.x)
  const DOOR_OPEN = DOOR_CLOSED + 1.15

  const portinhola = new THREE.Group()
  portinhola.position.copy(pA)
  portinhola.rotation.y = DOOR_OPEN
  gaiola.add(portinhola)
  for (const x of [0.02, DOOR_W / 2, DOOR_W - 0.02]) {
    const v = cylinder(0.013, 0.013, DOOR_H, GOLD, { roughness: 0.3, metalness: 0.85 }, 8)
    v.position.set(x, DOOR_H / 2 + 0.02, 0)
    portinhola.add(v)
  }
  for (const y of [0.02, DOOR_H + 0.02]) {
    const hz = cylinder(0.016, 0.016, DOOR_W, GOLD, { roughness: 0.3, metalness: 0.85 }, 8)
    hz.rotation.z = Math.PI / 2
    hz.position.set(DOOR_W / 2, y, 0)
    portinhola.add(hz)
  }
  const trinco = torus(0.035, 0.012, GOLD, { roughness: 0.3, metalness: 0.85 })
  trinco.position.set(DOOR_W - 0.01, DOOR_H * 0.55, 0.02)
  portinhola.add(trinco)

  // ---- vaso de vidro baixo cheio de balinhas -------------------------------
  const vaso = new THREE.Group()
  vaso.position.set(VX, TY, VZ)

  const vidro = lathe(
    [
      [0, 0], [0.3, 0], [0.36, 0.04], [0.43, 0.2], [0.45, 0.38], [0.48, 0.44],
      [0.45, 0.45], [0.42, 0.39], [0.4, 0.2], [0.33, 0.06], [0, 0.05],
    ],
    GLASS,
    { roughness: 0.05, detail: 0 },
    48,
  )
  const vm = vidro.material as THREE.MeshStandardMaterial
  vm.transparent = true
  vm.opacity = 0.32
  vm.depthWrite = false
  vidro.castShadow = false
  vaso.add(vidro)

  const borda = torus(0.465, 0.018, '#f2fbfd', { roughness: 0.1 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.445
  vaso.add(borda)

  const balaCores = ['#f1a9c0', '#f6d36b', '#8fd8c4', '#b9a3e0', '#9fd0f0', '#f4a36b', '#ffffff']
  for (let k = 0; k < 70; k++) {
    const y = 0.09 + rand() * 0.36
    const raioMax = Math.min(0.36, 0.3 + y * 0.3) - 0.06
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * raioMax
    const bala = sphere(0.058 + rand() * 0.02, balaCores[k % balaCores.length], { roughness: 0.3 }, 14)
    bala.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    vaso.add(bala)
  }
  // montinho de balas transbordando no topo
  for (let k = 0; k < 14; k++) {
    const a = rand() * Math.PI * 2
    const r = rand() * 0.3
    const bala = sphere(0.065, balaCores[(k + 3) % balaCores.length], { roughness: 0.3 }, 14)
    bala.position.set(Math.cos(a) * r, 0.47 + (0.3 - r) * 0.25, Math.sin(a) * r)
    vaso.add(bala)
  }
  root.add(vaso)

  // ---- palito branco comprido (cresce de dentro do vaso) -------------------
  const palito = new THREE.Group()
  palito.position.set(VX, STICK_Y0, VZ)
  const STICK_L = CY - STICK_Y0
  const haste = cylinder(0.045, 0.045, STICK_L, '#f7f2e8', { roughness: 0.65 }, 16)
  haste.position.y = STICK_L / 2
  palito.add(haste)
  root.add(palito)

  // ---- disco gigante do pirulito: 4 espirais coloridas entrelaçadas --------
  const pirulito = new THREE.Group()
  pirulito.position.set(VX, CY, VZ)

  const fundo = cylinder(R, R, 0.1, CANDY_WHITE, { roughness: 0.2 }, 64)
  fundo.rotation.x = Math.PI / 2
  pirulito.add(fundo)

  const TURNS = 2.4
  const THETA_MAX = TURNS * Math.PI * 2
  const R_IN = R * 0.94
  const TUBE = (R_IN / TURNS / 4) * 0.56
  for (let arm = 0; arm < 4; arm++) {
    const pts: THREE.Vector3[] = []
    for (let s = 0; s <= 140; s++) {
      const th = (s / 140) * THETA_MAX
      const r = (th / THETA_MAX) * R_IN
      const ang = th + (arm * Math.PI) / 2
      pts.push(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, 0.04))
    }
    const curve = new THREE.CatmullRomCurve3(pts)
    const geo = new THREE.TubeGeometry(curve, 220, TUBE, 10, false)
    const faixa = new THREE.Mesh(geo, mat(CANDY[arm], { roughness: 0.18, size: 1.6 }))
    faixa.castShadow = true
    faixa.receiveShadow = true
    pirulito.add(faixa)
  }
  const miolo = sphere(0.075, CANDY_WHITE, { roughness: 0.2 })
  miolo.position.z = 0.05
  miolo.scale.z = 0.6
  pirulito.add(miolo)

  const aro = torus(R, 0.06, CANDY_WHITE, { roughness: 0.2 })
  pirulito.add(aro)
  root.add(pirulito)

  // ---- laço de fita vermelha logo abaixo do disco --------------------------
  const laco = new THREE.Group()
  laco.position.set(VX, CY - R - 0.13, VZ + 0.02)

  const volta = torus(0.055, 0.022, RIBBON, { roughness: 0.35 })
  volta.rotation.x = Math.PI / 2
  laco.add(volta)
  const no = sphere(0.06, RIBBON, { roughness: 0.35 })
  no.position.z = 0.05
  no.scale.set(1, 0.9, 0.7)
  laco.add(no)
  for (const s of [-1, 1]) {
    const orelha = torus(0.1, 0.035, RIBBON, { roughness: 0.35 })
    orelha.position.set(s * 0.13, 0.02, 0.05)
    orelha.scale.set(1, 0.6, 0.6)
    orelha.rotation.z = s * 0.25
    laco.add(orelha)
    const ponta = rbox(0.07, 0.24, 0.02, 0.01, RIBBON, { roughness: 0.35 })
    ponta.position.set(s * 0.06, -0.13, 0.06)
    ponta.rotation.z = s * 0.35
    laco.add(ponta)
  }
  root.add(laco)

  // ---- periquito: origem no ponto onde as patinhas agarram a borda ---------
  // local +z = barriga (virada pro disco); local +x = lado que a câmera vê
  const periquito = new THREE.Group()
  periquito.position.set(...GRIP)
  periquito.rotation.y = BIRD_RY
  periquito.scale.setScalar(BIRD_S)

  const corpo = capsule(0.21, 0.34, LIME, { roughness: 0.6 })
  corpo.position.set(0, 0.5, -0.2)
  corpo.rotation.x = 0.18
  periquito.add(corpo)

  const peito = sphere(0.18, LIME_LIGHT, { roughness: 0.6 })
  peito.position.set(0, 0.5, -0.1)
  peito.scale.set(0.95, 1.35, 0.7)
  periquito.add(peito)

  // asas: base preta com faixas verde-amareladas por cima — sobra a listra preta
  for (const side of [-1, 1]) {
    const asa = new THREE.Group()
    asa.position.set(side * 0.17, 0.66, -0.3)
    asa.rotation.x = 0.28
    const baseAsa = sphere(1, WING_Y, { roughness: 0.6 })
    baseAsa.scale.set(0.055, 0.32, 0.15)
    baseAsa.position.set(0, -0.2, 0)
    asa.add(baseAsa)
    // listrinhas pretas onduladas: faixas finas atravessando a asa
    for (let k = 0; k < 6; k++) {
      const listra = sphere(1, BAR, { roughness: 0.6 })
      const y = -0.03 - k * 0.07
      const w = 0.15 * Math.sqrt(Math.max(0.05, 1 - ((y + 0.2) / 0.32) ** 2))
      listra.scale.set(0.034, 0.013, w * 0.92)
      listra.position.set(side * 0.03, y, 0)
      listra.rotation.x = 0.18 * (k % 2 === 0 ? 1 : -1)
      asa.add(listra)
    }
    // rêmiges escuras na ponta
    const remige = capsule(0.05, 0.22, '#2e3a22', { roughness: 0.6 })
    remige.scale.x = 0.5
    remige.position.set(side * 0.01, -0.5, -0.02)
    asa.add(remige)
    periquito.add(asa)
  }

  // cauda comprida e fina azul-escura, apontando pra baixo
  for (const s of [-1, 1]) {
    const pena = capsule(0.034, 0.66, TAIL, { roughness: 0.55 })
    pena.position.set(s * 0.025, -0.06, -0.38)
    pena.rotation.set(0.22, 0, s * 0.03)
    pena.scale.x = 0.8
    periquito.add(pena)
  }

  // patinhas: pernas curtas e dedos em arco abraçando o aro do disco
  for (const [fy, flip] of [[-0.05, 0], [0.11, 1]] as const) {
    const perna = capsule(0.032, 0.1, FEET, { roughness: 0.6 })
    perna.position.set(0, fy + 0.08, -0.11)
    perna.rotation.x = -0.9
    periquito.add(perna)
    const dedos = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.024, 8, 20, Math.PI * 1.35),
      mat(FEET, { roughness: 0.6, size: 0.2 }),
    )
    dedos.castShadow = true
    dedos.rotation.set(Math.PI / 2, 0, Math.PI * 0.82 + flip * 0.1)
    dedos.position.y = fy
    periquito.add(dedos)
  }
  root.add(periquito)

  // ---- cabeça amarela com o bico escancarado -------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.98, -0.14)
  cabeca.rotation.order = 'YXZ'
  cabeca.rotation.set(-0.28, HEAD_RY, 0)
  cabeca.scale.setScalar(1.15)
  periquito.add(cabeca)

  const cranio = sphere(0.2, HEAD_Y, { roughness: 0.6 })
  cranio.scale.set(0.95, 1, 1)
  cabeca.add(cranio)

  // nuca verde com listrinhas (o barrado do periquito sobe pela nuca)
  const nuca = sphere(0.185, LIME, { roughness: 0.6 })
  nuca.position.set(0, 0.0, -0.05)
  nuca.scale.set(0.96, 0.95, 0.9)
  cabeca.add(nuca)

  for (const s of [-1, 1]) {
    const aroOlho = sphere(0.05, '#ffffff', { roughness: 0.25 })
    aroOlho.position.set(s * 0.11, 0.06, 0.14)
    aroOlho.scale.z = 0.6
    const pupila = sphere(0.034, '#141414', { roughness: 0.15 })
    pupila.position.set(s * 0.115, 0.065, 0.165)
    const brilho = sphere(0.011, '#ffffff', { roughness: 0.1 })
    brilho.position.set(s * 0.105 + 0.012, 0.08, 0.195)
    cabeca.add(aroOlho, pupila, brilho)

    const bochecha = sphere(0.04, CHEEK, { roughness: 0.5 })
    bochecha.position.set(s * 0.135, -0.075, 0.1)
    bochecha.scale.set(0.6, 1, 0.9)
    cabeca.add(bochecha)
  }

  // pintinhas pretas na garganta
  for (const [px, py, pz] of [[-0.1, -0.13, 0.11], [-0.05, -0.17, 0.07], [0.05, -0.17, 0.07], [0.1, -0.13, 0.11]] as const) {
    const pinta = sphere(0.024, '#151515', { roughness: 0.5 })
    pinta.position.set(px, py, pz)
    cabeca.add(pinta)
  }

  const cera = sphere(0.04, CERE, { roughness: 0.45 })
  cera.position.set(0, 0.015, 0.185)
  cera.scale.set(1.3, 0.7, 0.8)
  cabeca.add(cera)

  // bico curvo aberto: superior pra frente/baixo, inferior caído
  const bicoSup = cone(0.085, 0.2, BEAK, { roughness: 0.4 })
  bicoSup.rotation.x = Math.PI / 2 + 0.55
  bicoSup.position.set(0, -0.045, 0.25)
  cabeca.add(bicoSup)
  const bicoInf = cone(0.062, 0.13, '#cfc7b6', { roughness: 0.4 })
  bicoInf.rotation.x = Math.PI - 0.38
  bicoInf.position.set(0, -0.185, 0.17)
  cabeca.add(bicoInf)
  const boca = sphere(0.058, MOUTH, { roughness: 0.4 })
  boca.position.set(0, -0.12, 0.2)
  boca.scale.set(0.9, 0.95, 0.55)
  cabeca.add(boca)

  // ---- três anéis de som saindo do bico: o VÁ! -----------------------------
  root.updateMatrixWorld(true)
  const bicoBase = cabeca.localToWorld(new THREE.Vector3(0, -0.08, 0.2))
  const centro = cabeca.localToWorld(new THREE.Vector3(0, 0, 0))
  const dir = bicoBase.clone().sub(centro).normalize()
  // empurra a direção do grito pra cima e pra câmera, longe do disco
  dir.add(new THREE.Vector3(0.9, 0.3, 0.6)).normalize()

  const sons: THREE.Group[] = []
  for (let k = 0; k < 3; k++) {
    const g = new THREE.Group()
    const dist = 0.5 + k * 0.25
    g.position.copy(bicoBase).addScaledVector(dir, dist)
    g.lookAt(g.position.clone().add(dir))
    const anel = torus(0.08 + k * 0.05, 0.022, SOUND, { emissive: '#ffd84a', emissiveIntensity: 0.45, roughness: 0.4 })
    g.add(anel)
    root.add(g)
    sons.push(g)
  }

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'festa', group: 'mesa', object: festa },
    { name: 'gaiola', group: 'gaiola', object: gaiola },
    { name: 'portinhola', group: 'gaiola', object: portinhola },
    { name: 'vaso', group: 'vaso', object: vaso },
    { name: 'palito', group: 'pirulito', object: palito },
    { name: 'pirulito', group: 'pirulito', object: pirulito },
    { name: 'laco', group: 'pirulito', object: laco },
    { name: 'periquito', group: 'periquito', object: periquito },
    { name: 'cabeca', group: 'periquito', object: cabeca },
    { name: 'som1', group: 'va', object: sons[0] },
    { name: 'som2', group: 'va', object: sons[1] },
    { name: 'som3', group: 'va', object: sons[2] },
  ]

  // voo: sai da portinhola, sobe pela frente da gaiola e pousa na borda
  const doorWorld = new THREE.Vector3(
    CGX + Math.cos((DOOR_A + DOOR_B) / 2) * (CR + 0.15),
    TY + 0.45,
    CGZ + Math.sin((DOOR_A + DOOR_B) / 2) * (CR + 0.15),
  )
  const MID: [number, number, number] = [-0.95, 3.25, 1.0]
  const pop = (part: string, at: number, from = 0.01, to = 1) =>
    seq(`${part}-pop-${at}`, part, at, 0.35, [
      ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
    ], { ease: 'easeOut' })

  const build = [
    seq('mesa-rise', 'mesa', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Uma mesa de festa sobe: toalha xadrez rosa e branca, cupcake e confete.',
    }),
    seq('festa-rise', 'festa', 0.35, 0.7, [riseFrom(0, 0.5)], { ease: 'easeOut' }),

    seq('gaiola-rise', 'gaiola', 1.5, 0.8, [riseFrom(TY, 2.2)], {
      ease: 'easeOut',
      caption: 'Ao fundo, a gaiola dourada de um PERIQUITO falador.',
    }),
    seq('portinhola-fechada', 'portinhola', 1.5, 0.8, [ch('rotation.y', DOOR_CLOSED, DOOR_CLOSED)]),

    seq('vaso-rise', 'vaso', 2.9, 0.7, [riseFrom(TY, 0.9)], {
      ease: 'easeOut',
      caption: 'Bem ao lado da gaiola, alguém põe um vaso de vidro cheio de balinhas…',
    }),

    seq('palito-cresce', 'palito', 4.1, 0.6, [ch('scale.y', 0.02, 1)], {
      ease: 'easeOut',
      caption: '…e finca nele um PIRULITO de espiral gigante, maior que o próprio periquito!',
    }),
    seq('pirulito-gira', 'pirulito', 4.5, 1.0, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('rotation.z', -Math.PI * 3, 0),
    ], { ease: 'easeOut' }),
    seq('laco-pop', 'laco', 5.3, 0.4, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('portinhola-abre', 'portinhola', 6.3, 0.5, [ch('rotation.y', DOOR_CLOSED, DOOR_OPEN)], {
      ease: 'easeOut',
      caption: 'A portinhola se escancara…',
    }),

    seq('periquito-sai', 'periquito', 6.9, 0.6, [
      ch('position.x', doorWorld.x, MID[0]),
      ch('position.y', doorWorld.y, MID[1]),
      ch('position.z', doorWorld.z, MID[2]),
      ch('scale.x', 0.3, 0.85 * BIRD_S), ch('scale.y', 0.3, 0.85 * BIRD_S), ch('scale.z', 0.3, 0.85 * BIRD_S),
      ch('rotation.y', BIRD_RY + 1.4, BIRD_RY + 0.6),
    ], {
      ease: 'easeOut',
      caption: '…e o periquito voa direto pro doce e se agarra de lado na borda do disco.',
    }),
    seq('cabeca-junto', 'cabeca', 6.9, 0.1, [ch('rotation.y', 0, 0)]),
    seq('periquito-pousa', 'periquito', 7.5, 0.55, [
      ch('position.x', MID[0], GRIP[0]),
      ch('position.y', MID[1], GRIP[1]),
      ch('position.z', MID[2], GRIP[2]),
      ch('scale.x', 0.85 * BIRD_S, BIRD_S), ch('scale.y', 0.85 * BIRD_S, BIRD_S), ch('scale.z', 0.85 * BIRD_S, BIRD_S),
      ch('rotation.y', BIRD_RY + 0.6, BIRD_RY),
    ], { ease: 'easeInOut' }),

    seq('cabeca-vira', 'cabeca', 8.6, 0.4, [ch('rotation.y', 0, HEAD_RY)], {
      ease: 'easeOut',
      caption: 'Ele vira pra você e solta um VÁ! agudo de alegria…',
    }),
    pop('som1', 8.95),
    pop('som2', 9.1),
    pop('som3', 9.25),

    seq('cabeca-repete', 'cabeca', 10.2, 0.3, [ch('rotation.x', -0.05, -0.28)], {
      ease: 'easeOut',
      caption: '…e repete o nome do doce do jeito dele, com a força no RU: piRÚÚ-LIT! piRÚÚ-LIT!',
    }),
    pop('som1', 10.3, 0.5, 1),
    pop('som2', 10.42, 0.5, 1),
    pop('som3', 10.54, 0.5, 1),

    seq('pirulito-roda', 'pirulito', 11.6, 1.4, [ch('rotation.z', Math.PI * 2, 0)], {
      ease: 'easeInOut',
      caption: 'Vad roligt! — Que legal! / Que divertido!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.75, 2.55, 6.0], target: [0.3, 1.78, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-roligt',
    contexto:
      "Conversa: reação a boa notícia ou convite — o colega vai ser pai, a amiga passou na prova de direção (uppkörningen), o filho chega da förskola com um desenho, alguém te chama pra fika ou pra um passeio no fim de semana. No passado, ao se despedir depois de um encontro: 'Det var roligt!' (foi divertido).",
    fraseFonte: 'Que legal! / Que divertido!',
    fraseAlvo: 'Vad roligt!',
    pronuncia:
      "va RÚÚ-lit! ('vad' = VÁ, o D não soa, e na fala emenda direto: va-RÚÚ-lit; 'roligt' com a força no RO, que é um U LONGO de bico fechado (o 'o' longo sueco), com R de um toque só, como em 'caro', nunca o RR de 'rato'; o -ligt sai fraquinho e curto: o G não soa e o T fecha seco, 'lit', nunca 'litchi')",
    ponteSonora:
      "VÁ, (pi)RÚÚ-LIT(o)! (3 sílabas: va-RÚÚ-lit; a força TODA no RÚÚ; VÁ = o 'vad' de sempre, o MESMO de 'VÁ, CÜL!', 'VÁ, SÜND!' e 'ÓI! VÁ... CÁLT!', aqui o pio agudo do periquito: curto, sem D, e sem R próprio; RÚÚ-LIT = o PIRULITO sem o PI e sem o -O, e com a força MUDADA de lugar, do jeito torto que o periquito fala: no português ela cai no LI (piru-LI-to), aqui ela vem pro RU, esticado, que é o 'o' longo sueco: U de bico fechado, nunca o Ô de 'rolo'. O R vem do meio do piRUlito e por isso é BRANDO, um toque de língua: emende o VÁ no RU sem pausa (va-RÚÚ), pra ele não virar o RR soprado de 'rua'. Esse R é do 'roligt', não do 'vad': o VÁ continua o grito sem R. LIT fraquinho, com o T seco fechando, nunca 'litchi'. E não confunda com o ÚÚ-ROLI do salsicha ('Jag är orolig'): lá a força vem ANTES, no uivo, e é preocupação; aqui ela cai no próprio RU, e é festa)",
    historia:
      "Na festa de aniversário, alguém finca no vaso de balas, bem ao lado da gaiola, um pirulito de espiral maior que o próprio periquito. Ele escancara a portinhola, solta um 'VÁ!' agudo de alegria e, como todo periquito falador, repete o nome do doce do jeito dele, esticando o RU e engolindo o resto: 'piRÚÚÚ-LIT! piRÚÚÚ-LIT!'. Depois se agarra na borda do disco e começa a lamber, girando junto com a espiral colorida. Nunca se viu passarinho mais feliz: vad roligt!",
  },
  createScene,
  refine: { organic: ['periquito', 'cabeca'] },
}

export default card
