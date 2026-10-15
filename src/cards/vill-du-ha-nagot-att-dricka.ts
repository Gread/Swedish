import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person, shoulderPivot, mat,
} from '../rig/helpers'

/**
 * "Vill du ha något att dricka?" — VIL DÜ RRÁ NÔT A DRÍCA?
 *
 * Na cozinha de pedra, a bruxa VIL de verruga aponta o dedo torto pra você
 * (DÜ?), solta UMA gargalhada — RRÁ! — que apaga as velas, e estende por cima
 * do caldeirão uma concha comprida com uma xícara fumegante para a bailarina
 * DRICA, que chega rodopiando na ponta do pé: NÔT, A DRICA?
 *
 * Acento saturado (verde-limão) reservado ao que se BEBE: a poção, as bolhas
 * e a fumacinha da xícara. A pele da bruxa é um verde sálvia apagado.
 */

const PEDRA = '#5d5568'
const PEDRA_ESC = '#3f3949'
const PEDRA_CLARA = '#6e667a'
const JUNTA = '#2c2733'
const FERRO = '#24222a'
const FERRO_CLARO = '#3a3842'
const LENHA = '#5a3b26'
const LENHA_ESC = '#3e281a'
const FOGO = '#ff7a1c'
const FOGO_MIOLO = '#ffd04a'
const LIMAO = '#9be81e' // acento: a bebida
const LIMAO_CLARO = '#c8ff6a'
const VESTIDO = '#3c2453'
const VESTIDO_ESC = '#2b183d'
const PELE_BRUXA = '#9fbf86'
const CHAPEU = '#1e1a24'
const OURO = '#e0b03a'
const CABELO_BRUXA = '#8f8b96'
const VERRUGA = '#6b4a2e'
const PORCELANA = '#f4f1ea'
const ROSA = '#f29ab8'
const ROSA_CLARO = '#f8c3d6'
const ROSA_ESC = '#d97a9d'
const PELE_DRICA = '#f0c8a4'
const CABELO_DRICA = '#5a3320'
const CERA = '#efe4cc'
const FUMACA = '#a9a3b0'

const GY = 0.18 // topo do piso de pedra

const BRUXA: [number, number, number] = [-1.0, GY, -0.5]
const BRUXA_ROT = 0.42
const BRUXA_ESCALA = 1.32

const CALD: [number, number, number] = [0.02, GY, 0.0]
const CALD_BASE = 0.2 // altura do fundo do caldeirão acima do piso
const CALD_ALTO = 0.6
const BOCA_Y = GY + CALD_BASE + CALD_ALTO // borda do caldeirão

const DRICA: [number, number, number] = [1.42, GY, 0.42]
const DRICA_ROT = -0.85
const DRICA_ESCALA = 0.92

// onde a xícara fica na ponta da concha (mundo)
const XICARA_ALVO = new THREE.Vector3(0.92, 1.42, 0.3)

/** Pedras do piso: lajotas arredondadas em grade irregular, dentro do disco. */
function piso(rand: () => number) {
  const g = new THREE.Group()
  const solo = cylinder(2.62, 2.72, 0.12, JUNTA, { roughness: 0.95 })
  solo.position.y = 0.06
  g.add(solo)
  const tampa = cylinder(2.56, 2.62, 0.05, PEDRA_ESC, { roughness: 0.95 })
  tampa.position.y = 0.135
  g.add(tampa)

  const passo = 0.52
  for (let ix = -5; ix <= 5; ix++) {
    for (let iz = -5; iz <= 5; iz++) {
      const x = ix * passo + (iz % 2 ? passo / 2 : 0) + (rand() - 0.5) * 0.06
      const z = iz * passo * 0.92 + (rand() - 0.5) * 0.06
      if (Math.hypot(x, z) > 2.28) continue
      const cores = [PEDRA, PEDRA_CLARA, PEDRA_ESC, PEDRA]
      const laje = rbox(
        passo - 0.06 + (rand() - 0.5) * 0.04,
        0.05,
        passo * 0.92 - 0.06,
        0.022,
        cores[Math.floor(rand() * cores.length)],
        { roughness: 0.9 },
      )
      laje.position.set(x, GY - 0.02 + rand() * 0.012, z)
      laje.rotation.y = (rand() - 0.5) * 0.08
      g.add(laje)
    }
  }
  return g
}

function vela(altura: number) {
  const g = new THREE.Group()
  const corpo = lathe(
    [[0, 0], [0.075, 0], [0.078, 0.02], [0.07, altura * 0.6], [0.072, altura - 0.02], [0.06, altura], [0, altura]],
    CERA,
    { roughness: 0.5 },
  )
  g.add(corpo)
  // pingos de cera escorrendo
  for (const [a, h] of [[0.4, 0.12], [2.3, 0.18], [4.1, 0.09]] as const) {
    const pingo = capsule(0.018, h, CERA, { roughness: 0.45 })
    pingo.position.set(Math.cos(a) * 0.07, altura - h / 2 - 0.02, Math.sin(a) * 0.07)
    g.add(pingo)
  }
  const pires = lathe(
    [[0, 0], [0.13, 0], [0.15, 0.025], [0.12, 0.03], [0, 0.02]],
    '#7d6a4a',
    { roughness: 0.4, metalness: 0.6 },
  )
  g.add(pires)
  const pavio = cylinder(0.008, 0.008, 0.05, '#1a1410', { roughness: 0.9 })
  pavio.position.y = altura + 0.02
  g.add(pavio)
  return g
}

function chama(r: number, h: number) {
  const g = new THREE.Group()
  const fora = sphere(r, FOGO, { emissive: FOGO, emissiveIntensity: 1.6 })
  fora.scale.set(1, h / r / 2, 1)
  fora.position.y = h * 0.45
  const dentro = sphere(r * 0.55, FOGO_MIOLO, { emissive: FOGO_MIOLO, emissiveIntensity: 1.8 })
  dentro.scale.set(1, h / r / 2, 1)
  dentro.position.y = h * 0.38
  const ponta = cone(r * 0.75, h * 0.5, FOGO, { emissive: FOGO, emissiveIntensity: 1.6 })
  ponta.position.y = h * 0.9
  g.add(fora, dentro, ponta)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: cozinha de pedra ---------------------------------------------
  const base = piso(rand)

  // vassoura encostada ao fundo
  const vassoura = new THREE.Group()
  vassoura.position.set(1.95, GY, -1.05)
  vassoura.rotation.set(0.12, -0.4, 0.28)
  const cabo = cylinder(0.025, 0.03, 1.5, LENHA, { roughness: 0.8 })
  cabo.position.y = 0.95
  vassoura.add(cabo)
  const palha = lathe(
    [[0, 0], [0.17, 0], [0.15, 0.12], [0.08, 0.3], [0.04, 0.36], [0, 0.36]],
    '#b8924a',
    { roughness: 0.95 },
  )
  vassoura.add(palha)
  const amarra = torus(0.07, 0.018, '#6b2f2f', { roughness: 0.8 })
  amarra.rotation.x = Math.PI / 2
  amarra.position.y = 0.3
  vassoura.add(amarra)
  base.add(vassoura)

  // frascos de ingredientes no chão
  for (const [x, z, cor, s] of [
    [-1.75, 0.95, '#7a4fa6', 1],
    [-1.98, 0.62, '#b0742e', 0.8],
    [-1.55, 1.25, '#4c6f8f', 0.7],
  ] as const) {
    const frasco = lathe(
      [[0, 0], [0.1, 0], [0.12, 0.05], [0.12, 0.17], [0.05, 0.24], [0.045, 0.3], [0.055, 0.31], [0, 0.31]],
      cor,
      { roughness: 0.2 },
    )
    frasco.scale.setScalar(s)
    frasco.position.set(x, GY, z)
    base.add(frasco)
    const rolha = cylinder(0.045, 0.04, 0.05, '#9a7a52', { roughness: 0.85 })
    rolha.scale.setScalar(s)
    rolha.position.set(x, GY + 0.33 * s, z)
    base.add(rolha)
  }

  const cogumelo = new THREE.Group()
  cogumelo.position.set(-1.25, GY, 1.15)
  const pe = cylinder(0.035, 0.045, 0.14, '#e8dcc4', { roughness: 0.8 })
  pe.position.y = 0.07
  const chapeuCog = sphere(0.1, '#8c3a3a', { roughness: 0.7 })
  chapeuCog.scale.y = 0.55
  chapeuCog.position.y = 0.15
  cogumelo.add(pe, chapeuCog)
  base.add(cogumelo)

  root.add(base)

  // ---- velas (corpos) + chamas (peça própria: se apagam no RRÁ) ------------
  const velas = new THREE.Group()
  const chamas = new THREE.Group()
  const fumaca = new THREE.Group()
  const lugaresVelas: [number, number, number][] = [
    [-2.0, 0.0, 0.42],
    [1.95, 0.75, 0.32],
    [-1.55, -1.4, 0.55],
  ]
  for (const [x, z, h] of lugaresVelas) {
    const v = vela(h)
    v.position.set(x, GY, z)
    velas.add(v)
    const c = chama(0.035, 0.11)
    c.position.set(x, GY + h + 0.035, z)
    chamas.add(c)
    // fiozinho de fumaça (aparece quando a chama se apaga)
    for (let k = 0; k < 3; k++) {
      const f = sphere(0.025 + k * 0.012, FUMACA, { roughness: 1 })
      f.position.set(x + Math.sin(k * 1.7) * 0.03, GY + h + 0.07 + k * 0.07, z)
      fumaca.add(f)
    }
  }
  root.add(velas, chamas, fumaca)

  // ---- fogueira sob o caldeirão -------------------------------------------
  const fogo = new THREE.Group()
  fogo.position.set(CALD[0], GY, CALD[2])
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const pedra = sphere(0.1, i % 2 ? PEDRA_CLARA : PEDRA, { roughness: 0.9 })
    pedra.scale.set(1.2, 0.7, 1)
    pedra.position.set(Math.cos(a) * 0.62, 0.05, Math.sin(a) * 0.62)
    pedra.rotation.y = -a
    fogo.add(pedra)
  }
  for (const a of [0.3, 1.35, 2.4]) {
    const tora = capsule(0.055, 0.7, i2c(a), { roughness: 0.85 })
    tora.rotation.set(Math.PI / 2, 0, a)
    tora.position.y = 0.06
    fogo.add(tora)
  }
  const brasa = sphere(0.22, '#c2451a', { emissive: '#ff5a14', emissiveIntensity: 0.9 })
  brasa.scale.y = 0.25
  brasa.position.y = 0.05
  fogo.add(brasa)
  for (const [x, z, s] of [[-0.3, 0.38, 0.9], [0.05, 0.5, 1.1], [0.38, 0.34, 0.85], [0.5, -0.1, 0.7], [-0.48, 0.0, 0.75]] as const) {
    const c = chama(0.09 * s, 0.42 * s)
    c.position.set(x, 0.05, z)
    fogo.add(c)
  }
  root.add(fogo)

  // ---- caldeirão preto ------------------------------------------------------
  const caldeirao = new THREE.Group()
  caldeirao.position.set(...CALD)
  const H = CALD_ALTO
  const corpoCald = lathe(
    [
      [0, 0], [0.2, 0.0], [0.4, 0.07], [0.52, 0.22], [0.55, 0.36], [0.5, 0.52],
      [0.42, 0.6], [0.43, H - 0.02], [0.47, H], [0.44, H + 0.02], [0.39, H - 0.03], [0.38, 0.56], [0, 0.5],
    ],
    FERRO,
    { roughness: 0.45, metalness: 0.6 },
    48,
  )
  corpoCald.position.y = CALD_BASE
  caldeirao.add(corpoCald)
  const borda = torus(0.45, 0.035, FERRO, { roughness: 0.6, metalness: 0.4 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = CALD_BASE + H
  caldeirao.add(borda)
  // três pés
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    const pe3 = cylinder(0.04, 0.06, CALD_BASE + 0.05, FERRO, { roughness: 0.45, metalness: 0.6 })
    pe3.position.set(Math.cos(a) * 0.32, (CALD_BASE + 0.05) / 2, Math.sin(a) * 0.32)
    caldeirao.add(pe3)
  }
  // alças laterais
  for (const side of [-1, 1]) {
    const alca = torus(0.08, 0.02, FERRO_CLARO, { roughness: 0.4, metalness: 0.7 })
    alca.position.set(side * 0.5, CALD_BASE + H - 0.12, 0)
    alca.rotation.y = Math.PI / 2
    caldeirao.add(alca)
  }
  // rebites no bojo
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    const rebite = sphere(0.022, FERRO_CLARO, { roughness: 0.4, metalness: 0.7 })
    rebite.position.set(Math.cos(a) * 0.548, CALD_BASE + 0.36, Math.sin(a) * 0.548)
    caldeirao.add(rebite)
  }
  root.add(caldeirao)

  // ---- poção verde-limão (sobe de dentro do caldeirão) ----------------------
  const pocao = new THREE.Group()
  pocao.position.set(CALD[0], 0, CALD[2])
  const superficie = cylinder(0.44, 0.38, 0.06, LIMAO, { emissive: LIMAO, emissiveIntensity: 0.35, roughness: 0.25 })
  superficie.position.y = BOCA_Y - 0.015
  pocao.add(superficie)
  const espuma = puff(0.13, LIMAO_CLARO, 6, 17, { roughness: 0.3 })
  espuma.scale.y = 0.5
  espuma.position.set(-0.12, BOCA_Y - 0.02, 0.08)
  pocao.add(espuma)
  // bolhas subindo
  for (const [x, y, z, r] of [
    [0.15, 0.06, 0.12, 0.07], [-0.2, 0.05, -0.1, 0.06], [0.05, 0.22, -0.05, 0.05],
    [-0.08, 0.36, 0.1, 0.038], [0.12, 0.5, 0.0, 0.028], [-0.02, 0.62, -0.06, 0.02],
  ] as const) {
    const bolha = sphere(r, LIMAO, { emissive: LIMAO, emissiveIntensity: 0.3, roughness: 0.15 })
    bolha.position.set(x, BOCA_Y + y, z)
    pocao.add(bolha)
  }
  // escorrido pela borda
  const escorrido = capsule(0.035, 0.12, LIMAO, { emissive: LIMAO, emissiveIntensity: 0.3, roughness: 0.25 })
  escorrido.position.set(0.3, BOCA_Y - 0.07, 0.33)
  escorrido.rotation.set(0.5, 0, -0.5)
  pocao.add(escorrido)
  root.add(pocao)

  // ---- bruxa VIL ------------------------------------------------------------
  const bruxa = person({ body: VESTIDO, skin: PELE_BRUXA, height: 1.5, armAngle: 0.3 })
  bruxa.position.set(...BRUXA)
  bruxa.rotation.y = BRUXA_ROT
  bruxa.scale.setScalar(BRUXA_ESCALA)

  // vestido em cone, com barra mais escura e cinto
  const saia = cone(0.46, 0.86, VESTIDO, { roughness: 0.9 })
  saia.position.y = 0.43
  bruxa.add(saia)
  const barra = torus(0.42, 0.04, VESTIDO_ESC, { roughness: 0.9 })
  barra.rotation.x = Math.PI / 2
  barra.position.y = 0.05
  bruxa.add(barra)
  const cinto = torus(0.235, 0.03, '#1c1222', { roughness: 0.8 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.46
  bruxa.add(cinto)

  const cabecaB = bruxa.getObjectByName('head') as THREE.Group
  // nariz comprido e adunco, com a verruga
  const nariz = cone(0.06, 0.3, PELE_BRUXA, { roughness: 0.7 })
  nariz.rotation.x = Math.PI / 2 + 0.38
  nariz.position.set(0, -0.04, 0.37)
  cabecaB.add(nariz)
  const verruga = sphere(0.038, VERRUGA, { roughness: 0.8 })
  verruga.position.set(0.04, -0.02, 0.4)
  cabecaB.add(verruga)
  // queixo pontudo
  const queixo = cone(0.07, 0.16, PELE_BRUXA, { roughness: 0.7 })
  queixo.rotation.x = Math.PI - 0.6
  queixo.position.set(0, -0.25, 0.17)
  cabecaB.add(queixo)
  // boca aberta da gargalhada, com um dente só
  const boca = sphere(0.075, '#2a1420', { roughness: 0.6 })
  boca.scale.set(1.25, 0.8, 0.5)
  boca.position.set(0, -0.16, 0.245)
  cabecaB.add(boca)
  const dente = rbox(0.03, 0.04, 0.02, 0.008, '#eee6c8', { roughness: 0.4 })
  dente.position.set(0.025, -0.125, 0.275)
  cabecaB.add(dente)
  // sobrancelhas franzidas (malvadas)
  for (const side of [-1, 1]) {
    const sob = capsule(0.018, 0.09, '#3b3640', { roughness: 0.8 })
    sob.position.set(side * 0.11, 0.13, 0.255)
    sob.rotation.z = Math.PI / 2 + side * 0.45
    cabecaB.add(sob)
    // cabelo grisalho escorrido dos lados
    for (let k = 0; k < 3; k++) {
      const mecha = capsule(0.03, 0.28 + k * 0.05, CABELO_BRUXA, { roughness: 0.9 })
      mecha.position.set(side * (0.24 + k * 0.025), -0.1 - k * 0.03, -0.05 - k * 0.07)
      mecha.rotation.z = side * 0.18
      cabecaB.add(mecha)
    }
  }

  // braço esquerdo: aponta o dedo torto pra câmera (DÜ?)
  const bracoDu = bruxa.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoDu, 1.5)
  bracoDu.rotation.set(-1.95, 0, -0.42)
  // dedo torto: duas falanges com a junta dobrada e unha preta
  const falange1 = capsule(0.03, 0.12, PELE_BRUXA, { roughness: 0.7 })
  falange1.position.set(0, -0.63, 0)
  bracoDu.add(falange1)
  const junta = sphere(0.036, PELE_BRUXA, { roughness: 0.7 })
  junta.position.set(0, -0.71, 0)
  bracoDu.add(junta)
  const falange2 = capsule(0.026, 0.1, PELE_BRUXA, { roughness: 0.7 })
  falange2.position.set(0.025, -0.78, 0)
  falange2.rotation.z = 0.45
  bracoDu.add(falange2)
  const unha = cone(0.024, 0.06, '#2a1f2e', { roughness: 0.4 })
  unha.position.set(0.055, -0.85, 0)
  unha.rotation.z = Math.PI + 0.45
  bracoDu.add(unha)

  // braço direito: segura a concha estendida
  const bracoConcha = bruxa.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoConcha, 1.5)
  bracoConcha.rotation.set(-0.5, 0, 1.4)

  root.add(bruxa)

  // ---- chapéu pontudo com fivela dourada -----------------------------------
  const chapeu = new THREE.Group()
  chapeu.position.set(0, 0.17, -0.02)
  chapeu.rotation.set(-0.08, 0, 0.1)
  cabecaB.add(chapeu)
  const aba = lathe(
    [[0, 0], [0.5, 0.0], [0.52, 0.02], [0.46, 0.035], [0.3, 0.05], [0, 0.05]],
    CHAPEU,
    { roughness: 0.75 },
  )
  chapeu.add(aba)
  const copa = lathe(
    [[0.29, 0], [0.27, 0.12], [0.2, 0.3], [0.13, 0.46], [0.07, 0.58], [0, 0.62]],
    CHAPEU,
    { roughness: 0.75 },
  )
  copa.position.y = 0.04
  chapeu.add(copa)
  const ponta = cone(0.075, 0.3, CHAPEU, { roughness: 0.75 })
  ponta.position.set(-0.1, 0.72, 0)
  ponta.rotation.z = 0.75
  chapeu.add(ponta)
  const fita = cylinder(0.285, 0.29, 0.07, '#3b2453', { roughness: 0.7 })
  fita.position.y = 0.09
  chapeu.add(fita)
  // fivela: moldura quadrada dourada na frente
  const fivela = new THREE.Group()
  fivela.position.set(0, 0.09, 0.29)
  for (const [w, h, x, y] of [[0.12, 0.022, 0, 0.045], [0.12, 0.022, 0, -0.045], [0.022, 0.11, -0.05, 0], [0.022, 0.11, 0.05, 0]] as const) {
    const lado = rbox(w, h, 0.02, 0.008, OURO, { roughness: 0.25, metalness: 0.85 })
    lado.position.set(x, y, 0)
    fivela.add(lado)
  }
  chapeu.add(fivela)

  // ---- concha comprida (pivô na mão direita da bruxa) -----------------------
  root.updateMatrixWorld(true)
  const mao = new THREE.Vector3()
  bracoConcha.children[0].getWorldPosition(mao)

  const dir = XICARA_ALVO.clone().sub(mao)
  const comprimento = dir.length()
  const pitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z))
  const yaw = Math.atan2(-dir.z, dir.x)

  const concha = new THREE.Group()
  concha.position.copy(mao)
  concha.rotation.set(0, yaw, pitch)
  const hasteLen = comprimento - 0.1
  const haste = cylinder(0.022, 0.026, hasteLen, '#8a8f96', { roughness: 0.3, metalness: 0.8 })
  haste.rotation.z = Math.PI / 2
  haste.position.x = hasteLen / 2 - 0.05
  concha.add(haste)
  const punho = capsule(0.04, 0.14, LENHA_ESC, { roughness: 0.7 })
  punho.rotation.z = Math.PI / 2
  punho.position.x = -0.02
  concha.add(punho)
  // a concha em si: tigelinha na ponta, desfaz o pitch para ficar nivelada
  const ponteira = new THREE.Group()
  ponteira.position.x = comprimento
  ponteira.rotation.z = -pitch
  concha.add(ponteira)
  const bacia = lathe(
    [[0, -0.1], [0.08, -0.09], [0.13, -0.05], [0.15, 0.0], [0.14, 0.005], [0.12, -0.04], [0.07, -0.075], [0, -0.08]],
    '#8a8f96',
    { roughness: 0.3, metalness: 0.8 },
  )
  ponteira.add(bacia)
  root.add(concha)

  // ---- xícara de porcelana com fumacinha verde (filha da concha) ------------
  const xicara = new THREE.Group()
  xicara.position.y = -0.06
  xicara.scale.setScalar(1.35)
  ponteira.add(xicara)
  const pires = lathe(
    [[0, 0], [0.1, 0], [0.13, 0.02], [0.14, 0.03], [0.1, 0.022], [0, 0.02]],
    PORCELANA,
    { roughness: 0.2 },
  )
  xicara.add(pires)
  const taca = lathe(
    [[0, 0.02], [0.045, 0.02], [0.07, 0.04], [0.095, 0.1], [0.105, 0.15], [0.095, 0.15], [0.085, 0.1], [0, 0.04]],
    PORCELANA,
    { roughness: 0.2 },
  )
  xicara.add(taca)
  const friso = torus(0.1, 0.008, OURO, { roughness: 0.3, metalness: 0.8 })
  friso.rotation.x = Math.PI / 2
  friso.position.y = 0.145
  xicara.add(friso)
  const asa = torus(0.035, 0.012, PORCELANA, { roughness: 0.2 })
  asa.position.set(0.0, 0.1, -0.1)
  asa.rotation.y = Math.PI / 2
  xicara.add(asa)
  const cha = cylinder(0.088, 0.088, 0.01, LIMAO, { emissive: LIMAO, emissiveIntensity: 0.4 })
  cha.position.y = 0.135
  xicara.add(cha)
  for (const [x, y, r] of [[0.0, 0.24, 0.05], [0.04, 0.34, 0.042], [-0.01, 0.44, 0.034], [0.03, 0.52, 0.025]] as const) {
    const vapor = sphere(r, LIMAO_CLARO, { emissive: LIMAO, emissiveIntensity: 0.25, roughness: 0.9 })
    vapor.position.set(x, y, 0)
    xicara.add(vapor)
  }

  // ---- bailarina DRICA na ponta do pé -------------------------------------
  const bailarina = new THREE.Group()
  bailarina.position.set(...DRICA)
  bailarina.rotation.y = DRICA_ROT
  bailarina.scale.setScalar(DRICA_ESCALA)

  const PERNA = 0.36 // o person() sobe isto; as pernas preenchem embaixo
  const drica = person({ body: ROSA, skin: PELE_DRICA, height: 1.5, armAngle: 0.3 })
  drica.position.y = PERNA
  bailarina.add(drica)
  const corpoD = drica.getObjectByName('body')
  if (corpoD) corpoD.visible = false

  // collant: tronco esguio
  const collant = capsule(0.17, 0.32, ROSA, { roughness: 0.55 })
  collant.position.y = PERNA + 0.52
  bailarina.add(collant)
  const quadril = sphere(0.16, ROSA, { roughness: 0.55 })
  quadril.scale.y = 0.7
  quadril.position.y = PERNA + 0.28
  bailarina.add(quadril)
  // tutu: discos em camadas
  for (const [r, y, cor] of [[0.5, 0.31, ROSA_CLARO], [0.44, 0.35, ROSA], [0.36, 0.385, ROSA_CLARO]] as const) {
    const camada = cylinder(r, r * 0.92, 0.05, cor, { roughness: 0.85 })
    camada.position.y = PERNA + y
    bailarina.add(camada)
  }
  const babado = torus(0.5, 0.03, ROSA_ESC, { roughness: 0.85 })
  babado.rotation.x = Math.PI / 2
  babado.position.y = PERNA + 0.3
  bailarina.add(babado)
  // perna de apoio, na ponta do pé
  const pernaApoio = capsule(0.05, PERNA + 0.12, PELE_DRICA, { roughness: 0.6 })
  pernaApoio.position.set(0.04, (PERNA + 0.3) / 2 + 0.03, 0)
  bailarina.add(pernaApoio)
  const sapatilha = cone(0.05, 0.13, ROSA_ESC, { roughness: 0.4 })
  sapatilha.rotation.x = Math.PI
  sapatilha.position.set(0.04, 0.065, 0)
  bailarina.add(sapatilha)
  // fitas da sapatilha
  const fitaS = torus(0.05, 0.01, ROSA_ESC, { roughness: 0.4 })
  fitaS.rotation.x = Math.PI / 2
  fitaS.position.set(0.04, 0.18, 0)
  bailarina.add(fitaS)
  // perna em arabesque: estendida para trás
  const arabesque = new THREE.Group()
  arabesque.position.set(-0.04, PERNA + 0.24, -0.02)
  arabesque.rotation.set(1.9, 0, 0.3)
  bailarina.add(arabesque)
  const pernaTras = capsule(0.05, 0.66, PELE_DRICA, { roughness: 0.6 })
  pernaTras.position.y = -0.37
  arabesque.add(pernaTras)
  const sapatilha2 = cone(0.05, 0.13, ROSA_ESC, { roughness: 0.4 })
  sapatilha2.rotation.x = Math.PI
  sapatilha2.position.y = -0.78
  arabesque.add(sapatilha2)

  // braços em arco: um sobe em coroa, o outro se estende para a xícara
  const bracoAlto = drica.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoAlto, 1.5)
  bracoAlto.rotation.set(0, 0, 2.55)
  const bracoPega = drica.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoPega, 1.5)
  bracoPega.rotation.set(-1.45, 0, -0.25)

  // cabelo em coque e rostinho
  const cabecaD = drica.getObjectByName('head') as THREE.Group
  const cabelo = sphere(0.295, CABELO_DRICA, { roughness: 0.8 })
  cabelo.scale.set(1.0, 0.95, 1.0)
  cabelo.position.set(0, 0.04, -0.045)
  cabecaD.add(cabelo)
  const coque = sphere(0.12, CABELO_DRICA, { roughness: 0.8 })
  coque.position.set(0, 0.3, -0.06)
  cabecaD.add(coque)
  const laco = torus(0.11, 0.02, ROSA_ESC, { roughness: 0.5 })
  laco.rotation.x = Math.PI / 2
  laco.position.set(0, 0.25, -0.06)
  cabecaD.add(laco)
  const sorriso = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.014, 10, 24, Math.PI),
    mat('#9a4a4a', { roughness: 0.6 }),
  )
  sorriso.rotation.z = Math.PI
  sorriso.position.set(0, -0.1, 0.262)
  cabecaD.add(sorriso)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.04, '#f2a0a0', { roughness: 0.7 })
    bochecha.scale.z = 0.4
    bochecha.position.set(side * 0.16, -0.06, 0.24)
    cabecaD.add(bochecha)
  }
  root.add(bailarina)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cozinha', object: base },
    { name: 'velas', group: 'cozinha', object: velas },
    { name: 'chamas', group: 'cozinha', object: chamas },
    { name: 'fogo', group: 'caldeirao', object: fogo },
    { name: 'caldeirao', group: 'caldeirao', object: caldeirao },
    { name: 'pocao', group: 'caldeirao', object: pocao },
    { name: 'bruxa', group: 'bruxa', object: bruxa },
    { name: 'chapeu', group: 'bruxa', object: chapeu },
    { name: 'bracoDu', group: 'du', object: bracoDu },
    { name: 'fumaca', group: 'rra', object: fumaca },
    { name: 'bailarina', group: 'drica', object: bailarina },
    { name: 'concha', group: 'not', object: concha },
    { name: 'xicara', group: 'not', object: xicara },
  ]

  const BY = BRUXA[1]
  const DX = DRICA[0]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma cozinha escura de pedra, iluminada só por velas…',
    }),
    seq('velas-rise', 'velas', 0.35, 0.7, [riseFrom(0, 0.8)], { ease: 'easeOut' }),
    seq('chamas-rise', 'chamas', 0.35, 0.7, [riseFrom(0, 0.8)], { ease: 'easeOut' }),

    seq('fogo-acende', 'fogo', 1.5, 0.6, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…uma fogueira acende, e em cima dela um caldeirão preto…',
    }),
    seq('caldeirao-rise', 'caldeirao', 1.8, 0.8, [riseFrom(GY, 1.1)], { ease: 'easeOut' }),
    seq('pocao-borbulha', 'pocao', 2.6, 0.8, [ch('position.y', -0.55, 0)], {
      ease: 'easeOut',
      caption: '…onde uma poção verde-limão borbulha e cospe fumaça.',
    }),

    seq('bruxa-rise', 'bruxa', 3.8, 0.9, [riseFrom(BY, 2.1)], {
      ease: 'easeOut',
      caption: 'Atrás dele surge uma bruxa VIL, de nariz torto e verruga.',
    }),
    seq('braco-guardado', 'bracoDu', 3.8, 0.9, [ch('rotation.x', 0, 0)]),
    seq(
      'chapeu-cai',
      'chapeu',
      4.4,
      0.6,
      [ch('position.y', 0.75, 0.17), ch('rotation.z', -0.5, 0.1)],
      { ease: 'easeOut' },
    ),

    seq('braco-aponta', 'bracoDu', 5.6, 0.6, [ch('rotation.x', 0, -1.95)], {
      ease: 'easeOut',
      caption: 'Ela aponta o dedo torto pra você: DÜ?',
    }),

    seq('bruxa-gargalha', 'bruxa', 7.0, 0.22, [ch('position.y', BY, BY + 0.12)], {
      ease: 'easeOut',
      caption: 'E solta UMA gargalhada só — RRÁ! — que apaga todas as velas.',
    }),
    seq('bruxa-assenta', 'bruxa', 7.22, 0.3, [ch('position.y', BY + 0.12, BY)], { ease: 'easeIn' }),
    seq('chamas-apagam', 'chamas', 7.1, 0.35, [ch('position.y', 0, -0.3)], { ease: 'easeIn' }),
    seq('fumaca-sobe', 'fumaca', 7.35, 0.8, [ch('position.y', -0.25, 0)], { ease: 'easeOut' }),

    seq(
      'bailarina-gira',
      'bailarina',
      8.6,
      1.3,
      [ch('position.x', 2.9, DX), ch('rotation.y', DRICA_ROT + Math.PI * 4, DRICA_ROT)],
      {
        ease: 'easeOut',
        caption: 'Entra rodopiando na ponta do pé a bailarina DRICA, morta de sede.',
      },
    ),

    seq('concha-ergue', 'concha', 10.4, 0.9, [ch('rotation.z', pitch - 0.55, pitch)], {
      ease: 'easeOut',
      caption: 'A bruxa ergue a concha do caldeirão, com uma xícara fumegante: NÔT, A DRICA?',
    }),
    seq('xicara-surge', 'xicara', 10.9, 0.5, [ch('scale.x', 0.01, 1.35), ch('scale.y', 0.01, 1.35), ch('scale.z', 0.01, 1.35)], {
      ease: 'easeOut',
    }),

    seq('concha-oferece', 'concha', 12.2, 0.5, [ch('rotation.z', pitch, pitch)], {
      caption: 'Vill du ha något att dricka? — Quer alguma coisa pra beber?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.2, 5.05], target: [0.15, 1.3, 0.0] },
  }
}

/** Tons alternados para as toras da fogueira. */
function i2c(a: number) {
  return a > 1 ? LENHA : LENHA_ESC
}

export const card: Card = {
  meta: {
    id: 'vill-du-ha-nagot-att-dricka',
    contexto:
      'Visita em casa: a primeira pergunta do anfitrião quando você tira o casaco. Também no escritório antes de reunião e em restaurante simples.',
    fraseFonte: 'Quer alguma coisa pra beber?',
    fraseAlvo: 'Vill du ha något att dricka?',
    pronuncia:
      "vil dü rrá nôt a DRÍK-ka? (a força principal cai no DRÍ; 'vill' com I curto e L de verdade; na fala 'något' vira 'nåt' = nôt, Ô fechado e sem força; 'du' com bico de pato; 'ha' com h soprado tipo RR carioca e A longo, mas sem pancada; o 'att' encolhe num 'a' rápido; 'dricka' com I curto e K dobrado)",
    ponteSonora:
      "VIL DÜ RRÁ NÔT A DRÍCA? (6 sílabas; a pancada forte é no DRÍ, o RRÁ vem esticado mas mais leve e o NÔT é rápido e sem força; VIL com L DE VERDADE, língua no céu da boca — se virar 'viu', some o L que o sueco tem; é o mesmo som do VILão de 'vilket', mas aqui SEM o 'que' e nunca VÍLIA, que é 'vilja': 'vill' é o quer curtinho; DÜ = o 'du' de CAN-DU, com bico de pato; RRÁ = UMA gargalhada só, o mesmo RRÁ soprado de 'Ha det bra', A longo; NÔT = o 'nåt' de 'något', Ô BEM FECHADO como na carta da farmácia — com bico de ö vira 'nöt', noz; A DRÍCA = 'att dricka' como se fala: o 'att' encolhe num 'a' e emenda no T de NÔT; DRICA é o apelido de Adriana, força no DRÍ, I curto, R de um toque só)",
    historia:
      'Na cozinha escura, uma bruxa VIL de verruga mexe um caldeirão verde que borbulha e cospe fumaça. Ela aponta o dedo torto pra você, DÜ?, e solta uma única gargalhada, RRÁ!, que apaga todas as velas. Antes que você responda, entra rodopiando a bailarina DRICA, morta de sede depois do ensaio, e a bruxa estende a concha fumegante com uma xícara de porcelana na ponta: NÔT, A DRICA? Até bruxa, na Suécia, oferece algo pra beber assim que a visita chega.',
  },
  createScene,
}

export default card
