import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, puff, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Skynda dig!" — RUIM DA… DÊI!
 *
 * Sete e quarenta, e você ainda está congelado na cadeira da cozinha, colher
 * no ar, perna dura esticada pra frente. Entrou pela janela um URUBU-médico:
 * de estetoscópio no pescoço, encosta a campânula no seu joelho e decreta,
 * de olho no almoço: RUIM DA… perna! — e, satisfeito com o susto: DÊI!
 *
 * Leitura da esquerda para a direita: mesa com o cereal intocado → você
 * congelado → a perna esticada → o urubu (contra a janela clara). O acento
 * saturado é reservado à MEIA listrada da perna diagnosticada.
 */

const PLINTO = '#6b5646'
const PISO = '#eeece6'
const PISO_CINZA = '#aab0b6'
const PAREDE = '#efe2c3'
const BARRADO = '#a9c3b4'
const BRANCO = '#f7f5ef'
const MADEIRA = '#a0764a'
const CEU = '#a8d3ee'
const MESA = '#f3f1eb'
const MESA_SOMBRA = '#dcd8ce'
const CADEIRA = '#a94a3d'
const CADEIRA_ESC = '#87392f'
const TIGELA = '#3f6fb0'
const LEITE = '#f7f3e8'
const CEREAL = '#eeb935'
const MOLETOM = '#e3843a'
const MOLETOM_ESC = '#c46b2a'
const CALCA = '#3b4864'
const CALCA_ESC = '#2f3a52'
const PELE = '#e8c39e'
const CABELO = '#4a3226'
const MEIA_BRANCA = '#f6f2ea'
const MEIA = '#e3262e' // acento saturado RESERVADO: a meia da perna diagnosticada
const MOCHILA = '#5e9150'
const MOCHILA_ESC = '#4a7740'
const CASACO = '#5b7896'
const URUBU = '#27262b'
const URUBU_PENA = '#323036'
const URUBU_PELE = '#8c8587'
const URUBU_RUGA = '#76706f'
const BICO = '#eadfb5'
const PATA = '#8f8a86'
const GARRA = '#2c2a29'
const METAL = '#d3d8de'
const TUBO = '#b9bfc7'
const ESCURO = '#2a2a2e'

const FY = 0.14 // topo do piso
const WALL_Z = -1.79 // face da parede do fundo

// você: sentado, virado para a direita-frente (para o urubu)
const SEAT = FY + 0.47
const PX = -0.72
const PZ = -0.12
const PROT = 1.25
const ARM_X = -1.45 // braço da colher erguido à frente
const ARM_Z = 0.3
const LEG_X = -0.05 // perna esticada (canela na horizontal, levemente erguida)
const LEG_BENT = Math.PI / 2

// urubu
const UX = 0.62
const UZ = -0.1
const UROT = -0.8

// mesa e mochila
const TABLE: [number, number, number] = [-1.55, FY, -0.72]
const BAG: [number, number, number] = [-1.22, FY, 0.28]
const BAG_ROT_Z = 0

const CAM: [number, number, number] = [0.05, 1.55, 3.25]

/** Cone que se curva ao longo do comprimento: bico adunco, garras, unhas. */
function bentCone(r: number, h: number, bend: number, color: string, opts: { roughness?: number } = {}) {
  const geo = new THREE.ConeGeometry(r, h, 20, 12)
  geo.translate(0, h / 2, 0)
  if (bend !== 0) {
    const R = h / bend
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const phi = y / R
      pos.setXYZ(i, x, R * Math.sin(phi) - z * Math.sin(phi), R * (1 - Math.cos(phi)) + z * Math.cos(phi))
    }
    geo.computeVertexNormals()
  }
  const m = new THREE.Mesh(geo, mat(color, { roughness: opts.roughness ?? 0.4, size: h }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Tubo que passa por pontos (mangueira do estetoscópio, hastes). */
function tubo(points: THREE.Vector3[], r: number, color: string, opts: { roughness?: number; metalness?: number } = {}) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geo = new THREE.TubeGeometry(curve, 64, r, 12, false)
  const m = new THREE.Mesh(
    geo,
    mat(color, { roughness: opts.roughness ?? 0.35, metalness: opts.metalness ?? 0.3, size: curve.getLength() }),
  )
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/**
 * Asa de urubu ao longo de -y (do ombro à ponta), corda em z (bordo de ataque
 * em +z), achatada em x: braço grosso no bordo, coberteiras em escamas,
 * secundárias em tiras sobrepostas e os "dedos" das primárias.
 */
function makeWing(len: number) {
  const g = new THREE.Group()

  const braco = capsule(0.055, len * 0.6, URUBU, { roughness: 0.75 })
  braco.position.set(0, -len * 0.33, 0.12)
  g.add(braco)

  const cob = sphere(1, URUBU, { roughness: 0.75 })
  cob.scale.set(0.08, len * 0.3, 0.17)
  cob.position.set(0, -len * 0.3, 0.04)
  g.add(cob)

  for (let k = 0; k < 4; k++) {
    const escama = sphere(0.075, URUBU_PENA, { roughness: 0.78 })
    escama.scale.set(0.75, 1, 1.1)
    escama.position.set(0, -len * (0.14 + k * 0.13), -0.03)
    g.add(escama)
  }

  for (let k = 0; k < 6; k++) {
    const pena = rbox(0.035, 0.13, 0.32, 0.03, URUBU_PENA, { roughness: 0.78 })
    pena.position.set(0, -len * (0.12 + k * 0.095), -0.1)
    pena.rotation.x = -k * 0.06
    g.add(pena)
  }

  // primárias: dedos longos, finos e afilados, abertos em leque
  for (let i = 0; i < 7; i++) {
    const dedo = new THREE.Group()
    dedo.position.set(0, -len * 0.62, 0.13 - i * 0.042)
    dedo.rotation.x = (i - 3) * 0.085
    const comp = len * (0.42 - Math.abs(i - 2) * 0.03)
    const lamina = rbox(0.018, comp, 0.052, 0.016, URUBU_PENA, { roughness: 0.75 })
    lamina.position.y = -comp / 2
    dedo.add(lamina)
    g.add(dedo)
  }
  return g
}

/**
 * Orienta a asa: eixo comprido (−y local) ao longo de `along` e a face larga
 * virada o mais possível para `facing` (a câmera), bordo de ataque para cima.
 */
function orientWing(wing: THREE.Object3D, along: THREE.Vector3, facing: THREE.Vector3) {
  const L = along.clone().normalize()
  const Y = L.clone().negate()
  const Z = new THREE.Vector3().crossVectors(facing, L).normalize()
  if (Z.y < 0) Z.negate()
  const X = new THREE.Vector3().crossVectors(Y, Z).normalize()
  wing.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z))
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- cozinha: plinto, piso xadrez, parede com janela e gancho -------------
  const base = new THREE.Group()

  const plinto = rbox(4.75, 0.09, 3.85, 0.04, PLINTO, { roughness: 0.7 })
  plinto.position.set(0, 0.045, -0.1)
  base.add(plinto)

  const piso = rbox(4.6, 0.07, 3.7, 0.03, PISO, { roughness: 0.35 })
  piso.position.set(0, FY - 0.035, -0.1)
  base.add(piso)

  const TILE = 0.46
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 0) continue
      const ladrilho = rbox(TILE - 0.02, 0.012, TILE - 0.02, 0.005, PISO_CINZA, { roughness: 0.35 })
      ladrilho.position.set(-2.07 + i * TILE, FY + 0.002, -1.72 + j * TILE)
      base.add(ladrilho)
    }
  }

  const parede = rbox(4.6, 2.5, 0.16, 0.04, PAREDE, { roughness: 0.85 })
  parede.position.set(0, FY + 1.25, WALL_Z - 0.08)
  base.add(parede)

  const barrado = rbox(4.6, 0.85, 0.02, 0.008, BARRADO, { roughness: 0.6 })
  barrado.position.set(0, FY + 0.425, WALL_Z + 0.01)
  base.add(barrado)

  const friso = rbox(4.6, 0.05, 0.04, 0.015, BRANCO, { roughness: 0.5 })
  friso.position.set(0, FY + 0.86, WALL_Z + 0.02)
  base.add(friso)

  const rodape = rbox(4.6, 0.1, 0.03, 0.01, BRANCO, { roughness: 0.5 })
  rodape.position.set(0, FY + 0.05, WALL_Z + 0.025)
  base.add(rodape)

  // janela aberta por onde o urubu entrou
  {
    const JX = 0.9
    const JY = FY + 1.62
    const W = 1.0
    const H = 1.0
    const ceu = rbox(W - 0.06, H - 0.06, 0.01, 0.004, CEU, { emissive: '#9fcde9', emissiveIntensity: 0.45 })
    ceu.position.set(JX, JY, WALL_Z + 0.006)
    base.add(ceu)
    for (const [cx, cy, s] of [[-0.22, 0.2, 0.09], [0.18, -0.05, 0.07]] as const) {
      const nuvem = puff(s, '#ffffff', 4, 90 + Math.round(cx * 10), { emissive: '#eef6fb', emissiveIntensity: 0.4 })
      nuvem.scale.set(1.6, 0.6, 0.3)
      nuvem.position.set(JX + cx, JY + cy, WALL_Z + 0.02)
      base.add(nuvem)
    }
    for (const [w, h, x, y] of [
      [W + 0.08, 0.08, 0, H / 2], [W + 0.08, 0.08, 0, -H / 2],
      [0.08, H, -W / 2, 0], [0.08, H, W / 2, 0],
    ] as const) {
      const barra = rbox(w, h, 0.08, 0.02, BRANCO, { roughness: 0.4 })
      barra.position.set(JX + x, JY + y, WALL_Z + 0.04)
      base.add(barra)
    }
    const peitoril = rbox(W + 0.2, 0.05, 0.2, 0.02, BRANCO, { roughness: 0.4 })
    peitoril.position.set(JX, JY - H / 2 - 0.03, WALL_Z + 0.1)
    base.add(peitoril)

    // folhas abertas para dentro, dobradiças nas laterais
    for (const side of [-1, 1]) {
      const folha = new THREE.Group()
      folha.position.set(JX + side * (W / 2 - 0.04), JY, WALL_Z + 0.06)
      folha.rotation.y = side * 1.15
      const LW = W / 2 - 0.04
      const vidro = rbox(LW - 0.06, H - 0.14, 0.012, 0.004, '#d6ebf5', { roughness: 0.08 })
      vidro.position.set(-side * LW / 2, 0, 0)
      folha.add(vidro)
      for (const [w, h, x, y] of [
        [LW, 0.05, -side * LW / 2, (H - 0.1) / 2], [LW, 0.05, -side * LW / 2, -(H - 0.1) / 2],
        [0.05, H - 0.1, -side * 0.025, 0], [0.05, H - 0.1, -side * (LW - 0.025), 0],
      ] as const) {
        const caixilho = rbox(w, h, 0.04, 0.012, BRANCO, { roughness: 0.4 })
        caixilho.position.set(x, y, 0)
        folha.add(caixilho)
      }
      base.add(folha)
    }

    // vasinho de ervas no peitoril
    const vaso = lathe(
      [[0, 0], [0.07, 0], [0.085, 0.1], [0.09, 0.12], [0.075, 0.115], [0, 0.11]],
      '#b8663f',
      { roughness: 0.6 },
    )
    vaso.position.set(JX + 0.38, JY - H / 2 - 0.005, WALL_Z + 0.12)
    base.add(vaso)
    const erva = puff(0.08, '#5f8f45', 5, 77, { roughness: 0.85 })
    erva.position.set(JX + 0.38, JY - H / 2 + 0.17, WALL_Z + 0.12)
    base.add(erva)
  }

  // gancho com o casaco (pronto para sair… menos você)
  {
    const gancho = new THREE.Group()
    gancho.position.set(-1.95, FY + 1.68, WALL_Z + 0.02)
    const tabua = rbox(0.5, 0.08, 0.04, 0.015, MADEIRA, { roughness: 0.6 })
    gancho.add(tabua)
    for (const gx of [-0.14, 0.14]) {
      const pino = cylinder(0.018, 0.018, 0.1, MADEIRA, { roughness: 0.5 })
      pino.rotation.x = Math.PI / 2
      pino.position.set(gx, 0, 0.06)
      gancho.add(pino)
    }
    const casaco = new THREE.Group()
    casaco.position.set(-0.14, -0.04, 0.08)
    const ombros = capsule(0.07, 0.22, CASACO, { roughness: 0.85 })
    ombros.rotation.z = Math.PI / 2
    ombros.position.y = -0.09
    casaco.add(ombros)
    const corpoC = rbox(0.36, 0.55, 0.1, 0.05, CASACO, { roughness: 0.85 })
    corpoC.position.y = -0.38
    casaco.add(corpoC)
    for (const side of [-1, 1]) {
      const manga = capsule(0.055, 0.4, CASACO, { roughness: 0.85 })
      manga.position.set(side * 0.18, -0.34, 0.01)
      manga.rotation.z = side * 0.08
      casaco.add(manga)
    }
    for (const by of [-0.22, -0.36, -0.5]) {
      const botao = sphere(0.018, '#2f3b4a', { roughness: 0.4 })
      botao.position.set(0.03, by, 0.055)
      casaco.add(botao)
    }
    gancho.add(casaco)
    base.add(gancho)
  }
  root.add(base)

  // ---- relógio de parede: 7h40 ----------------------------------------------
  const relogio = new THREE.Group()
  relogio.position.set(-0.2, FY + 1.95, WALL_Z + 0.03)
  {
    const aro = torus(0.22, 0.035, '#3c4048', { roughness: 0.4, metalness: 0.5 })
    relogio.add(aro)
    const mostrador = cylinder(0.22, 0.22, 0.03, '#fbf7ee', { roughness: 0.4 })
    mostrador.rotation.x = Math.PI / 2
    relogio.add(mostrador)
    for (let k = 0; k < 12; k++) {
      const grosso = k % 3 === 0
      const marca = rbox(grosso ? 0.026 : 0.016, grosso ? 0.055 : 0.04, 0.012, 0.004, ESCURO, { roughness: 0.5 })
      const a = (k * Math.PI) / 6
      marca.position.set(Math.sin(a) * 0.168, Math.cos(a) * 0.168, 0.02)
      marca.rotation.z = -a
      relogio.add(marca)
    }
    const horas = new THREE.Group()
    horas.rotation.z = -((7 + 40 / 60) / 12) * Math.PI * 2
    const ph = rbox(0.032, 0.11, 0.012, 0.008, ESCURO, { roughness: 0.5 })
    ph.position.set(0, 0.045, 0.03)
    horas.add(ph)
    relogio.add(horas)
    const minutos = new THREE.Group()
    minutos.rotation.z = -(40 / 60) * Math.PI * 2
    const pm = rbox(0.022, 0.165, 0.012, 0.006, ESCURO, { roughness: 0.5 })
    pm.position.set(0, 0.07, 0.042)
    minutos.add(pm)
    relogio.add(minutos)
    const centro = sphere(0.02, ESCURO, { roughness: 0.4 })
    centro.position.z = 0.05
    relogio.add(centro)
  }
  root.add(relogio)

  // ---- mesa branca + leite ---------------------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(...TABLE)
  mesa.rotation.y = 0.12
  {
    const tampo = rbox(0.95, 0.06, 0.95, 0.025, MESA, { roughness: 0.35 })
    tampo.position.y = 0.75
    mesa.add(tampo)
    const saia = rbox(0.86, 0.09, 0.86, 0.02, MESA_SOMBRA, { roughness: 0.45 })
    saia.position.y = 0.675
    mesa.add(saia)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pe = cylinder(0.036, 0.026, 0.64, MESA, { roughness: 0.4 })
        pe.position.set(sx * 0.39, 0.32, sz * 0.39)
        mesa.add(pe)
      }
    }
    const jogo = rbox(0.42, 0.01, 0.34, 0.005, '#c5d6e4', { roughness: 0.8 })
    jogo.position.set(0.2, 0.785, 0.2)
    mesa.add(jogo)

    // caixinha de leite com telhadinho
    const leite = new THREE.Group()
    leite.position.set(-0.16, 0.78, -0.18)
    leite.rotation.y = 0.5
    const caixa = rbox(0.16, 0.26, 0.16, 0.012, BRANCO, { roughness: 0.5 })
    caixa.position.y = 0.13
    leite.add(caixa)
    const faixa = rbox(0.165, 0.08, 0.165, 0.01, '#3f6fb0', { roughness: 0.5 })
    faixa.position.y = 0.12
    leite.add(faixa)
    for (const side of [-1, 1]) {
      const telha = rbox(0.165, 0.11, 0.012, 0.004, BRANCO, { roughness: 0.5 })
      telha.position.set(0, 0.29, side * 0.04)
      telha.rotation.x = side * 0.62
      leite.add(telha)
    }
    const crista = rbox(0.165, 0.04, 0.025, 0.006, BRANCO, { roughness: 0.5 })
    crista.position.y = 0.345
    leite.add(crista)
    mesa.add(leite)
  }
  root.add(mesa)

  // ---- tigela azul de cereal intocada (filha da mesa) ------------------------
  const tigela = new THREE.Group()
  tigela.position.set(0.2, 0.79, 0.2)
  {
    const cuia = lathe(
      [
        [0, 0], [0.08, 0], [0.13, 0.03], [0.16, 0.08], [0.17, 0.115],
        [0.155, 0.12], [0.145, 0.085], [0.115, 0.04], [0.06, 0.025], [0, 0.022],
      ],
      TIGELA,
      { roughness: 0.25 },
    )
    tigela.add(cuia)
    const leiteT = cylinder(0.148, 0.148, 0.012, LEITE, { roughness: 0.3 })
    leiteT.position.y = 0.1
    tigela.add(leiteT)
    for (let i = 0; i < 16; i++) {
      const anel = torus(0.024, 0.011, CEREAL, { roughness: 0.7 })
      const a = rand() * Math.PI * 2
      const d = Math.sqrt(rand()) * 0.11
      const monte = 0.03 * (1 - d / 0.11)
      anel.position.set(Math.cos(a) * d, 0.112 + monte + rand() * 0.012, Math.sin(a) * d)
      anel.rotation.set(Math.PI / 2 + (rand() - 0.5) * 0.9, rand() * 3, (rand() - 0.5) * 0.9)
      tigela.add(anel)
    }
  }
  mesa.add(tigela)

  // ---- cadeira vermelha -------------------------------------------------------
  const fwd = new THREE.Vector3(Math.sin(PROT), 0, Math.cos(PROT))
  const cadeira = new THREE.Group()
  cadeira.position.set(PX - fwd.x * 0.05, FY, PZ - fwd.z * 0.05)
  cadeira.rotation.y = PROT
  {
    const assento = rbox(0.56, 0.06, 0.54, 0.025, CADEIRA, { roughness: 0.5 })
    assento.position.y = SEAT - FY - 0.03
    cadeira.add(assento)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pe = cylinder(0.03, 0.022, SEAT - FY - 0.06, CADEIRA_ESC, { roughness: 0.5 })
        pe.position.set(sx * 0.235, (SEAT - FY - 0.06) / 2, sz * 0.225)
        cadeira.add(pe)
      }
      const poste = cylinder(0.026, 0.03, 0.62, CADEIRA, { roughness: 0.5 })
      poste.position.set(sx * 0.235, SEAT - FY + 0.29, -0.25)
      cadeira.add(poste)
    }
    const travessa = rbox(0.6, 0.15, 0.05, 0.022, CADEIRA, { roughness: 0.5 })
    travessa.position.set(0, SEAT - FY + 0.55, -0.25)
    cadeira.add(travessa)
    const ripa = rbox(0.48, 0.06, 0.035, 0.015, CADEIRA, { roughness: 0.5 })
    ripa.position.set(0, SEAT - FY + 0.3, -0.25)
    cadeira.add(ripa)
    const trave = cylinder(0.016, 0.016, 0.46, CADEIRA_ESC, { roughness: 0.5 })
    trave.rotation.z = Math.PI / 2
    trave.position.set(0, 0.14, 0.225)
    cadeira.add(trave)
  }
  root.add(cadeira)

  // ---- VOCÊ, congelado ---------------------------------------------------------
  const voce = new THREE.Group()
  voce.position.set(PX, SEAT, PZ)
  voce.rotation.y = PROT
  const corpo = person({ body: MOLETOM, skin: PELE, height: 1.5, armAngle: 0.22 })
  voce.add(corpo)

  // moletom: capuz, bolso canguru e cordões
  const capuz = sphere(0.17, MOLETOM_ESC, { roughness: 0.9 })
  capuz.scale.set(1.35, 0.55, 0.85)
  capuz.position.set(0, 0.76, -0.17)
  corpo.add(capuz)
  const bolso = rbox(0.3, 0.14, 0.05, 0.022, MOLETOM_ESC, { roughness: 0.9 })
  bolso.position.set(0, 0.3, 0.232)
  corpo.add(bolso)
  for (const side of [-1, 1]) {
    const cordao = capsule(0.011, 0.11, MEIA_BRANCA, { roughness: 0.6 })
    cordao.position.set(side * 0.055, 0.6, 0.245)
    corpo.add(cordao)
  }

  // cabeça virada para a câmera: olhar parado, boca reta
  const cabecaP = corpo.getObjectByName('head') as THREE.Group
  cabecaP.rotation.y = -0.4
  const cabelo = sphere(0.29, CABELO, { roughness: 0.85 })
  cabelo.scale.set(1.03, 0.72, 1.05)
  cabelo.position.set(0, 0.11, -0.04)
  cabecaP.add(cabelo)
  const franja = puff(0.09, CABELO, 4, 13, { roughness: 0.85 })
  franja.scale.set(1.6, 0.6, 0.8)
  franja.position.set(0.04, 0.2, 0.19)
  cabecaP.add(franja)
  // boquinha entreaberta: o "travou" de quem esqueceu de piscar
  const boca = sphere(0.032, '#6a2f2a', { roughness: 0.6 })
  boca.scale.set(0.85, 1.15, 0.45)
  boca.position.set(0, -0.13, 0.262)
  cabecaP.add(boca)

  // braço da colher (lado da câmera): pivô no ombro, erguido e parado no ar
  const colher = corpo.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(colher, 1.5)
  colher.rotation.x = ARM_X
  colher.rotation.z = ARM_Z
  {
    const HAND_Y = -(0.52 * 0.32 + 0.19) * 1.5
    const talher = new THREE.Group()
    talher.position.set(0, HAND_Y - 0.06, 0.03)
    talher.rotation.x = -0.5
    const cabo = cylinder(0.013, 0.016, 0.26, METAL, { roughness: 0.2, metalness: 0.85 })
    cabo.rotation.x = Math.PI / 2
    cabo.position.z = 0.1
    talher.add(cabo)
    const concha = sphere(0.055, METAL, { roughness: 0.2, metalness: 0.85 })
    concha.scale.set(0.8, 1.05, 0.32)
    concha.position.set(0, 0, 0.26)
    talher.add(concha)
    for (const [cx, cy] of [[-0.015, 0.01], [0.018, -0.012], [0, 0.03]] as const) {
      const anel = torus(0.016, 0.008, CEREAL, { roughness: 0.7 })
      anel.position.set(cx, cy, 0.285)
      anel.rotation.set(rand() - 0.5, rand() - 0.5, rand())
      talher.add(anel)
    }
    colher.add(talher)
  }
  // o outro braço descansa na coxa
  const bracoR = corpo.getObjectByName('armR') as THREE.Mesh
  bracoR.rotation.x = -0.55

  // coxas na horizontal sobre o assento
  for (const side of [-1, 1]) {
    const coxa = capsule(0.105, 0.28, CALCA, { roughness: 0.85 })
    coxa.rotation.x = Math.PI / 2
    coxa.position.set(side * 0.125, 0.06, 0.2)
    voce.add(coxa)
  }
  // perna de trás: dobrada, pé no chão
  {
    const KX = 0.125
    const KZ = 0.42
    const joelho = sphere(0.1, CALCA, { roughness: 0.85 })
    joelho.position.set(KX, 0.06, KZ)
    voce.add(joelho)
    const canela = capsule(0.088, 0.16, CALCA, { roughness: 0.85 })
    canela.position.set(KX, -0.07, KZ)
    voce.add(canela)
    const barra = cylinder(0.098, 0.098, 0.05, CALCA_ESC, { roughness: 0.85 })
    barra.position.set(KX, -0.18, KZ)
    voce.add(barra)
    for (let i = 0; i < 5; i++) {
      const listra = cylinder(0.08, 0.08, 0.036, i % 2 === 0 ? MEIA : MEIA_BRANCA, { roughness: 0.85 })
      listra.position.set(KX, -0.225 - i * 0.036, KZ)
      voce.add(listra)
    }
    const pe = capsule(0.07, 0.12, MEIA_BRANCA, { roughness: 0.85 })
    pe.rotation.x = Math.PI / 2
    pe.position.set(KX, (FY + 0.07) - SEAT, KZ + 0.06)
    voce.add(pe)
    const ponta = sphere(0.068, MEIA, { roughness: 0.85 })
    ponta.position.set(KX, (FY + 0.07) - SEAT, KZ + 0.17)
    voce.add(ponta)
  }
  root.add(voce)

  // ---- a PERNA esticada (pivô no joelho; canela ao longo de +z) --------------
  const perna = new THREE.Group()
  perna.position.set(-0.125, 0.06, 0.42)
  perna.rotation.x = LEG_X
  {
    const joelho = sphere(0.1, CALCA, { roughness: 0.85 })
    perna.add(joelho)
    const canela = capsule(0.088, 0.16, CALCA, { roughness: 0.85 })
    canela.rotation.x = Math.PI / 2
    canela.position.z = 0.13
    perna.add(canela)
    const barra = cylinder(0.098, 0.098, 0.05, CALCA_ESC, { roughness: 0.85 })
    barra.rotation.x = Math.PI / 2
    barra.position.z = 0.24
    perna.add(barra)
    for (let i = 0; i < 5; i++) {
      const listra = cylinder(0.08, 0.08, 0.036, i % 2 === 0 ? MEIA : MEIA_BRANCA, { roughness: 0.85 })
      listra.rotation.x = Math.PI / 2
      listra.position.z = 0.283 + i * 0.036
      perna.add(listra)
    }
    // pé de meia, dedos para cima (rígido feito estátua)
    const calcanhar = sphere(0.078, MEIA_BRANCA, { roughness: 0.85 })
    calcanhar.position.z = 0.46
    perna.add(calcanhar)
    const pe = capsule(0.072, 0.12, MEIA_BRANCA, { roughness: 0.85 })
    pe.position.set(0, 0.09, 0.475)
    perna.add(pe)
    const anelPe = torus(0.073, 0.014, MEIA, { roughness: 0.85 })
    anelPe.rotation.x = Math.PI / 2
    anelPe.position.set(0, 0.08, 0.475)
    perna.add(anelPe)
    const ponta = sphere(0.07, MEIA, { roughness: 0.85 })
    ponta.position.set(0, 0.17, 0.475)
    perna.add(ponta)
  }
  voce.add(perna)

  // ---- mochila verde caída ao pé da cadeira ----------------------------------
  const mochila = new THREE.Group()
  mochila.position.set(...BAG)
  mochila.rotation.set(0, -2.2, BAG_ROT_Z)
  {
    // caída de costas no chão: bolso da frente para cima e as duas alças de
    // ombro escapando por baixo, esparramadas no piso
    const deitada = new THREE.Group()
    deitada.rotation.x = -Math.PI / 2
    deitada.position.y = 0.012
    const corpoM = rbox(0.44, 0.52, 0.22, 0.09, MOCHILA, { roughness: 0.8 })
    corpoM.position.set(0, 0.26, 0.11)
    deitada.add(corpoM)
    const bolsoM = rbox(0.34, 0.25, 0.08, 0.05, MOCHILA_ESC, { roughness: 0.8 })
    bolsoM.position.set(0, 0.17, 0.24)
    deitada.add(bolsoM)
    const ziper = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.008, 6, 24, Math.PI),
      mat('#d8d4c8', { roughness: 0.4, size: 0.3 }),
    )
    ziper.scale.set(1, 0.55, 1)
    ziper.position.set(0, 0.2, 0.282)
    deitada.add(ziper)
    const puxador = rbox(0.026, 0.06, 0.014, 0.006, '#d8d4c8', { roughness: 0.4 })
    puxador.position.set(0.13, 0.215, 0.29)
    puxador.rotation.z = 0.5
    deitada.add(puxador)
    const refletivo = rbox(0.16, 0.035, 0.012, 0.006, '#ece6d2', { roughness: 0.3 })
    refletivo.position.set(0, 0.1, 0.282)
    deitada.add(refletivo)
    const alca = torus(0.065, 0.018, MOCHILA_ESC, { roughness: 0.8 })
    alca.position.set(0, 0.52, 0.11)
    deitada.add(alca)
    for (const side of [-1, 1]) {
      const tira = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.03, 10, 24, Math.PI),
        mat(MOCHILA_ESC, { roughness: 0.85, size: 0.3 }),
      )
      tira.castShadow = true
      tira.receiveShadow = true
      tira.rotation.z = Math.PI + side * 0.25
      tira.scale.set(1, 1.25, 0.45)
      tira.position.set(side * 0.11, 0.06, -0.0)
      deitada.add(tira)
      const fivela = rbox(0.075, 0.035, 0.02, 0.008, '#d8d4c8', { roughness: 0.4 })
      fivela.position.set(side * 0.11 + side * Math.sin(side * 0.25) * 0.16, -0.1, 0.012)
      deitada.add(fivela)
    }
    mochila.add(deitada)
  }
  root.add(mochila)

  // ---- URUBU-MÉDICO (olha para +z local) ------------------------------------
  const urubu = new THREE.Group()
  urubu.position.set(UX, FY, UZ)
  urubu.rotation.y = UROT
  {
    const corpoU = sphere(0.38, URUBU, { roughness: 0.72 })
    corpoU.scale.set(0.95, 1.3, 1.05)
    corpoU.position.set(0, 0.74, -0.08)
    corpoU.rotation.x = 0.55
    urubu.add(corpoU)

    const rufo = puff(0.16, URUBU_PENA, 7, 11, { roughness: 0.85 })
    rufo.scale.set(1.2, 0.75, 1.1)
    rufo.position.set(0, 1.15, 0.2)
    urubu.add(rufo)

    // manto de penas nas costas: escamas largas que o refino funde em relevo
    for (const [mx, my, mz] of [[-0.17, 1.02, -0.08], [0.17, 1.02, -0.08], [0, 0.95, -0.24], [-0.19, 0.8, -0.3], [0.19, 0.8, -0.3]] as const) {
      const manto = sphere(0.16, URUBU_PENA, { roughness: 0.78 })
      manto.scale.set(1, 0.55, 1.1)
      manto.position.set(mx, my, mz)
      manto.rotation.x = 0.6
      urubu.add(manto)
    }

    // cauda em leque, para trás e para baixo
    const cauda = new THREE.Group()
    cauda.position.set(0, 0.56, -0.42)
    cauda.rotation.x = 1.2
    for (const k of [-1, 0, 1]) {
      const pena = rbox(0.11, 0.38, 0.04, 0.02, URUBU_PENA, { roughness: 0.75 })
      pena.position.set(k * 0.07, -0.18, 0)
      pena.rotation.z = k * 0.22
      cauda.add(pena)
    }
    urubu.add(cauda)

    // coxas emplumadas, tarsos e pés cinza de dedos compridos
    for (const side of [-1, 1]) {
      const coxa = sphere(0.12, URUBU, { roughness: 0.75 })
      coxa.scale.set(1, 1.3, 1)
      coxa.position.set(side * 0.13, 0.38, 0.04)
      urubu.add(coxa)
      const tarso = capsule(0.045, 0.14, PATA, { roughness: 0.7 })
      tarso.position.set(side * 0.13, 0.16, 0.06)
      urubu.add(tarso)
      for (const a of [-0.45, 0, 0.45]) {
        const dedo = capsule(0.03, 0.15, PATA, { roughness: 0.7 })
        dedo.rotation.set(Math.PI / 2, 0, 0)
        const dx = Math.sin(a) * 0.11
        const dz = Math.cos(a) * 0.11
        dedo.position.set(side * 0.13 + dx, 0.03, 0.06 + dz)
        dedo.rotation.y = a
        urubu.add(dedo)
        const unha = bentCone(0.022, 0.07, 1.4, GARRA, { roughness: 0.4 })
        unha.rotation.set(Math.PI / 2, a, 0)
        unha.position.set(side * 0.13 + Math.sin(a) * 0.2, 0.035, 0.06 + Math.cos(a) * 0.2)
        urubu.add(unha)
      }
      const tras = capsule(0.026, 0.07, PATA, { roughness: 0.7 })
      tras.rotation.x = Math.PI / 2
      tras.position.set(side * 0.13, 0.03, -0.04)
      urubu.add(tras)
    }

    // pescoço pelado + cabeça enrugada, virados para o joelho
    const cab = new THREE.Group()
    cab.position.set(0, 1.24, 0.32)
    cab.rotation.set(0.28, -0.4, 0)
    cab.scale.setScalar(1.35)
    const pescoco = capsule(0.085, 0.14, URUBU_PELE, { roughness: 0.8 })
    pescoco.position.set(0, 0.05, 0.03)
    pescoco.rotation.x = 0.35
    cab.add(pescoco)
    for (const ry of [0.0, 0.07]) {
      const ruga = torus(0.085, 0.02, URUBU_RUGA, { roughness: 0.85 })
      ruga.rotation.x = Math.PI / 2 + 0.35
      ruga.position.set(0, ry, ry * 0.4)
      cab.add(ruga)
    }
    const cranio = sphere(0.145, URUBU_PELE, { roughness: 0.8 })
    cranio.scale.set(0.92, 0.92, 1.12)
    cranio.position.set(0, 0.18, 0.1)
    cab.add(cranio)
    for (const [rz, ry] of [[0.03, 0.29], [0.11, 0.295], [0.19, 0.27]] as const) {
      const dobra = capsule(0.014, 0.1, URUBU_RUGA, { roughness: 0.85 })
      dobra.rotation.z = Math.PI / 2
      dobra.position.set(0, ry, rz)
      cab.add(dobra)
    }
    const cera = capsule(0.05, 0.05, '#5a5456', { roughness: 0.6 })
    cera.rotation.x = Math.PI / 2
    cera.position.set(0, 0.17, 0.25)
    cab.add(cera)
    for (const side of [-1, 1]) {
      const narina = sphere(0.013, '#1d1b1c', { roughness: 0.5 })
      narina.position.set(side * 0.03, 0.18, 0.285)
      cab.add(narina)
    }
    const bicoSup = bentCone(0.052, 0.2, 1.5, BICO, { roughness: 0.35 })
    bicoSup.rotation.x = Math.PI / 2
    bicoSup.position.set(0, 0.175, 0.27)
    cab.add(bicoSup)
    const bicoInf = bentCone(0.036, 0.11, 0.3, BICO, { roughness: 0.35 })
    bicoInf.rotation.x = Math.PI / 2
    bicoInf.position.set(0, 0.13, 0.27)
    cab.add(bicoInf)
    for (const side of [-1, 1]) {
      const olho = sphere(0.042, '#ffffff', { roughness: 0.25 })
      olho.scale.z = 0.6
      olho.position.set(side * 0.078, 0.22, 0.18)
      cab.add(olho)
      const pupila = sphere(0.021, '#1a1a1a', { roughness: 0.2 })
      pupila.position.set(side * 0.08, 0.218, 0.205)
      cab.add(pupila)
      const sobrancelha = capsule(0.02, 0.07, '#5e5759', { roughness: 0.8 })
      sobrancelha.rotation.z = Math.PI / 2 - side * 0.4
      sobrancelha.position.set(side * 0.078, 0.268, 0.18)
      cab.add(sobrancelha)
    }
    cab.name = 'cabUrubu'
    urubu.add(cab)
  }
  root.add(urubu)

  // asa de cá (lado da câmera): meio aberta, caída para o lado
  // (pivô no ombro: a batida gira em torno do eixo frente-trás do urubu)
  const asaE = new THREE.Group()
  asaE.position.set(0.3, 1.04, -0.02)
  urubu.add(asaE)

  // ---- geometria do diagnóstico: joelho → espaço do urubu --------------------
  root.updateMatrixWorld(true)
  const joelhoTopo = perna.localToWorld(new THREE.Vector3(0, 0.1, 0.0))
  const C = urubu.worldToLocal(joelhoTopo.clone()).add(new THREE.Vector3(0, 0.018, 0))
  const cab = urubu.getObjectByName('cabUrubu')!
  const orelhas = [-1, 1].map((s) =>
    urubu.worldToLocal(cab.localToWorld(new THREE.Vector3(s * 0.125, 0.17, 0.05))),
  )

  // asa de lá: estendida do ombro até o joelho, segurando a campânula
  const S = new THREE.Vector3(-0.3, 1.04, -0.02)
  const T = C.clone().add(new THREE.Vector3(0, 0.07, 0))
  const dist = S.distanceTo(T)
  const asa = makeWing((dist - 0.03) / 0.93)
  asa.position.copy(S)
  urubu.add(asa)
  const cam = urubu.worldToLocal(new THREE.Vector3(...CAM))
  orientWing(asa, T.clone().sub(S), cam.clone().sub(S).normalize())

  // asa de cá: aberta e caída para o lado, face larga para a câmera
  const asaEInner = makeWing(0.88)
  asaE.add(asaEInner)
  orientWing(asaEInner, new THREE.Vector3(0.65, -0.7, -0.1), cam.clone().sub(asaE.position).normalize())

  // ---- estetoscópio (origem na junção do Y, no peito do urubu) ----------------
  const J = new THREE.Vector3(0, 1.0, 0.4)
  const esteto = new THREE.Group()
  esteto.position.copy(J)
  {
    const rel = (v: THREE.Vector3) => v.clone().sub(J)
    for (const [i, s] of [-1, 1].entries()) {
      const E = orelhas[i]
      const haste = tubo(
        [
          rel(E),
          rel(E.clone().add(new THREE.Vector3(s * 0.05, -0.06, 0.02))),
          rel(new THREE.Vector3(s * 0.12, 1.22, 0.3)),
          rel(J.clone().add(new THREE.Vector3(s * 0.03, 0.05, 0))),
          new THREE.Vector3(0, 0, 0),
        ],
        0.012,
        METAL,
        { roughness: 0.2, metalness: 0.85 },
      )
      esteto.add(haste)
      const ponteira = sphere(0.022, ESCURO, { roughness: 0.5 })
      ponteira.position.copy(rel(E))
      esteto.add(ponteira)
    }
    const juncao = sphere(0.03, METAL, { roughness: 0.2, metalness: 0.85 })
    esteto.add(juncao)
    const mid = J.clone().lerp(C, 0.55).add(new THREE.Vector3(0, -0.12, 0.05))
    const mangueira = tubo(
      [
        new THREE.Vector3(0, 0, 0),
        rel(J.clone().add(new THREE.Vector3(-0.03, -0.18, 0.08))),
        rel(mid),
        rel(C.clone().add(new THREE.Vector3(0, 0.15, 0))),
        rel(C.clone().add(new THREE.Vector3(0, 0.04, 0))),
      ],
      0.02,
      TUBO,
    )
    esteto.add(mangueira)
    const campanula = cylinder(0.068, 0.068, 0.034, METAL, { roughness: 0.18, metalness: 0.9 })
    campanula.position.copy(rel(C))
    esteto.add(campanula)
    const aro = torus(0.068, 0.012, METAL, { roughness: 0.18, metalness: 0.9 })
    aro.rotation.x = Math.PI / 2
    aro.position.copy(rel(C)).add(new THREE.Vector3(0, -0.012, 0))
    esteto.add(aro)
    const haste = cylinder(0.016, 0.016, 0.06, METAL, { roughness: 0.18, metalness: 0.9 })
    haste.position.copy(rel(C)).add(new THREE.Vector3(0, 0.045, 0))
    esteto.add(haste)
  }
  urubu.add(esteto)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cozinha', object: base },
    { name: 'relogio', group: 'cozinha', object: relogio },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'tigela', group: 'mesa', object: tigela },
    { name: 'cadeira', group: 'mesa', object: cadeira },
    { name: 'voce', group: 'voce', object: voce },
    { name: 'colher', group: 'voce', object: colher },
    { name: 'perna', group: 'voce', object: perna },
    { name: 'urubu', group: 'urubu', object: urubu },
    { name: 'asaE', group: 'urubu', object: asaE },
    { name: 'asa', group: 'diagnostico', object: asa },
    { name: 'esteto', group: 'diagnostico', object: esteto },
    { name: 'mochila', group: 'dei', object: mochila },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Sete e quarenta da manhã: sobe a cozinha, casaco no gancho, relógio correndo…',
    }),
    seq('relogio-pop', 'relogio', 0.6, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('mesa-rise', 'mesa', 1.5, 0.7, [riseFrom(FY, 1.2)], {
      ease: 'easeOut',
      caption: '…e na mesa, a tigela de cereal amarelo, intocada.',
    }),
    seq('cadeira-rise', 'cadeira', 1.65, 0.7, [riseFrom(FY, 1.0)], { ease: 'easeOut' }),
    seq('tigela-pop', 'tigela', 2.1, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('voce-senta', 'voce', 3.0, 0.7, [ch('position.y', SEAT + 0.9, SEAT)], {
      ease: 'easeOut',
      caption: 'Você ainda está ali, de colher no ar, sem piscar — duro feito estátua.',
    }),
    seq('perna-dobra', 'perna', 3.0, 0.7, [ch('rotation.x', 1.1, LEG_BENT)], { ease: 'easeOut' }),
    seq('colher-ergue', 'colher', 3.0, 1.1, [ch('rotation.x', -0.2, ARM_X)], { ease: 'easeOut' }),

    seq('perna-estica', 'perna', 4.8, 0.5, [ch('rotation.x', LEG_BENT, -0.22)], {
      ease: 'easeOut',
      caption: 'A perna, esticada pra frente, não mexe nem a pau.',
    }),
    seq('perna-trava', 'perna', 5.3, 0.35, [ch('rotation.x', -0.22, LEG_X)]),

    seq('urubu-entra', 'urubu', 6.3, 1.1, [
      ch('position.x', 0.9, UX), ch('position.y', FY + 1.5, FY), ch('position.z', -1.6, UZ),
      ch('scale.x', 0.45, 1), ch('scale.y', 0.45, 1), ch('scale.z', 0.45, 1),
      ch('rotation.x', 0.5, 0), ch('rotation.y', -1.6, UROT),
    ], {
      ease: 'easeOut',
      caption: 'Tão parado que pela janela entra um urubu-médico…',
    }),
    seq('asaE-bate', 'asaE', 6.3, 0.45, [ch('rotation.z', 1.3, -0.35)]),
    seq('asaE-pousa', 'asaE', 6.75, 0.65, [ch('rotation.z', -0.35, 0)], { ease: 'easeOut' }),

    seq('asa-estende', 'asa', 7.9, 0.7, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: '…põe o estetoscópio no seu joelho e decreta, de olho no almoço: RUIM DA… perna!',
    }),
    seq('esteto-cresce', 'esteto', 8.0, 0.8, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('mochila-cai', 'mochila', 9.7, 0.5, [
      ch('position.y', FY + 1.5, BAG[1]), ch('rotation.z', BAG_ROT_Z + 1.6, BAG_ROT_Z),
    ], {
      ease: 'easeIn',
      caption: 'Você pula da cadeira, ele te enfia a mochila com uma bicada, todo satisfeito: DÊI!',
    }),
    seq('urubu-pulo', 'urubu', 9.85, 0.25, [ch('position.y', FY, FY + 0.07)], { ease: 'easeOut' }),
    seq('urubu-assenta', 'urubu', 10.1, 0.25, [ch('position.y', FY + 0.07, FY)], { ease: 'easeIn' }),

    seq('relogio-tique', 'relogio', 11.0, 0.4, [
      ch('scale.x', 1.25, 1), ch('scale.y', 1.25, 1), ch('scale.z', 1.25, 1),
    ], {
      ease: 'easeOut',
      caption: 'Skynda dig! — Anda logo! / Rápido!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [0.0, 1.0, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'skynda-dig',
    contexto:
      "Família: de manhã a caminho da förskola, no supermercado, atravessando a rua, quando o ônibus já está no ponto — é o 'anda logo!' sueco. Mais suave: 'Skynda på lite'; mais urgente: 'Skynda dig, vi är sena!'.",
    fraseFonte: 'Anda logo! / Rápido!',
    fraseAlvo: 'Skynda dig!',
    pronuncia:
      "RRÜN-da dêi! ('sk' antes de y soa como o 'sj': um sopro forte e raspado, tipo rr carioca com os lábios em bico, o mesmo de 'sjuk' e 'skicka'; 'y' = Ü curto, lábios de U e língua de I; N de verdade antes do d; 'dig' na fala = dêi; força no RRÜN)",
    ponteSonora:
      "RUIM DA... DÊI! (3 batidas: RRÜN-da-dêi; força no RRÜN; RUIM DA = o 'RUIM DA perna' do diagnóstico do urubu, sem a perna; o R de começo de palavra já sai soprado à carioca, e esse sopro é o 'sk' antes de Y: FORTE, raspado e já com os lábios em bico, o MESMO sopro de RRÜÜK ('sjuk') e RRÍCA ('skicka'), bem mais forte que o h leve de RRÜR ('hur') e RRÁR ('har'); o pulo do gato: o RUIM do português traz o U e o I em fila, e aqui você aperta os dois num som SÓ e CURTO, lábios no bico do U e língua no lugar do I: é o Ü, o y sueco, o mesmo de TÜ ('tycker') e LÜ ('lycka'); nunca 'ru-ÍM' em duas sílabas, que cria uma sílaba a mais; o N é de verdade, ponta da língua no céu da boca, sem o nasal do português, e emenda direto no DA, fraquinho; e repare: RRÜR ('hur') acaba em R, RRÜN-DA tem N e DA; DÊI = o 'DEI!' satisfeito de serviço feito em você, o mesmo DÊI de 'Ta på dig jackan!' e de 'Kom in och sätt dig!': 'dig', uma sílaba só)",
    historia:
      'Sete e quarenta, casaco no gancho, e você ainda está sentado na frente do cereal, de colher no ar, sem piscar. Tão parado que entra pela janela da cozinha um urubu de estetoscópio no pescoço: encosta o aparelho na sua perna, que não mexe nem a pau, e dá o diagnóstico já de olho no almoço: RUIM DA PERNA... Você pula da cadeira na hora, ele enfia a mochila nas suas costas com uma bicada e te empurra porta afora, todo satisfeito com o susto: DEI! Anda logo!',
  },
  createScene,
  refine: { organic: ['urubu', 'asaE', 'asa'] },
}

export default card
