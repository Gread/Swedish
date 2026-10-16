import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Har du en värktablett?" — RRÁR-DÜ… EN… VER QUE TA-BLÉT(e)?
 *
 * Trilha de terra vermelha do cerrado. A EMA chega mancando, de perna
 * enfaixada (tropeçou no cupinzeiro do fundo), solta um rugidinho soprado
 * (RRÁR!), aponta o bico pra você (DÜ?), ergue UM dedo do pé (EN) e mergulha
 * o pescoço comprido na sua mochila aberta pra VER QUE TABLETE tem lá —
 * e sai com uma cartela GIGANTE de comprimidos no bico.
 *
 * A ema fica de perfil 3/4 (lado direito para a câmera): o dedo erguido do
 * pé plantado fica à vista, e a perna enfaixada, erguida, aparece à frente.
 */

const TERRA = '#a94f33'
const TERRA_ESC = '#8a4029'
const TRILHA = '#c97b52'
const TRILHA_ESC = '#bb6c45'
const PEGADA = '#86412a'
const CAPIM = '#cfae5c'
const CAPIM_ESC = '#a3863f'
const PEDRA = '#7b6656'
const CUPIM = '#8d5a3b'
const CUPIM_ESC = '#3a2416'
const CASCA = '#5a4231'
const COPA = '#43633a'
const COPA_ESC = '#33502d'
const EMA = '#7a7063'
const EMA_ESC = '#5a5147'
const EMA_CLARO = '#948a7b'
const COLAR = '#433d37'
const PERNA = '#8f8a82'
const UNHA = '#38332f'
const BICO = '#dab55c'
const BICO_ESC = '#a8863b'
const ATADURA = '#f3efe4'
const MOCHILA = '#3f6f95'
const MOCHILA_ESC = '#2c5272'
const FORRO = '#152230'
const FIVELA = '#2a2e34'
const PRATA = '#cfd5dd'
const PILULA = '#f8f6f0'
const ACENTO = '#e5402a' // reservado: a faixa da cartela (o TABLETE)

const GY = 0.16 // topo do chão do diorama

// a ema: posição e guinada (olha pra frente-direita, lado direito pra câmera)
const EMA_X = -0.5
const EMA_Z = -0.3
const YAW = 1.05

// pescoço: base no peito; pose de "DÜ" (erguido, bico pra câmera) e final
const NECK_BASE: [number, number, number] = [0, 1.2, 0.34]
const PESC_ERGUIDO_X = -0.62
const PESC_VIRADO_Y = -0.85
const PESC_FUNDO_X = 0.12

const DEDO_ERGUIDO = -0.95

/** Coordenada local da ema (frente = +z) → mundo. */
function toWorld(x: number, y: number, z: number): [number, number, number] {
  const c = Math.cos(YAW)
  const s = Math.sin(YAW)
  return [EMA_X + x * c + z * s, GY + y, EMA_Z - x * s + z * c]
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const UP = V(0, 1, 0)

/** Cápsula ligando dois pontos — pernas, dedos, gomos do pescoço, penas. */
function between(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, roughness = 0.9) {
  const d = new THREE.Vector3().subVectors(b, a)
  const len = Math.max(0.001, d.length())
  const m = capsule(r, len, color, { roughness })
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Tufo de capim seco: lâminas finas abertas em leque. */
function tufo(seed: number, h = 0.3) {
  const g = new THREE.Group()
  const rand = rng(seed)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand()
    const hh = h * (0.65 + rand() * 0.5)
    const lamina = cone(0.022, hh, i % 3 === 0 ? CAPIM_ESC : CAPIM, { roughness: 0.85 }, 6)
    lamina.position.set(Math.cos(a) * 0.04, hh / 2, Math.sin(a) * 0.04)
    lamina.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45)
    g.add(lamina)
  }
  return g
}

/** Pegada de três dedos da ema na trilha. */
function pegada(x: number, z: number, yaw: number) {
  const g = new THREE.Group()
  for (const a of [-0.5, 0, 0.5]) {
    const sulco = rbox(0.035, 0.012, 0.16, 0.006, PEGADA, { roughness: 0.95 })
    sulco.position.set(Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08)
    sulco.rotation.y = a
    g.add(sulco)
  }
  g.position.set(x, GY + 0.012, z)
  g.rotation.y = yaw
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- chão: terra vermelha do cerrado + trilha mais clara -----------------
  const chao = new THREE.Group()

  const laje = cylinder(2.62, 2.72, 0.12, TERRA_ESC, { roughness: 0.95 })
  laje.position.y = 0.06
  chao.add(laje)

  const terra = cylinder(2.54, 2.6, 0.05, TERRA, { roughness: 0.95 })
  terra.position.y = 0.135
  chao.add(terra)

  // trilha: manchas achatadas de terra batida na direção em que a ema anda
  const dx = Math.sin(YAW)
  const dz = Math.cos(YAW)
  for (let t = -2.2; t <= 2.2; t += 0.36) {
    const x = -0.05 + dx * t
    const z = 0.05 + dz * t
    if (Math.hypot(x, z) > 2.05) continue
    const mancha = cylinder(0.42, 0.44, 0.014, Math.round(t * 10) % 2 === 0 ? TRILHA : TRILHA_ESC, {
      roughness: 0.95,
    })
    mancha.scale.z = 0.62
    mancha.position.set(x, GY + 0.002, z)
    mancha.rotation.y = YAW + Math.PI / 2 + (rand() - 0.5) * 0.3
    chao.add(mancha)
  }

  // pegadas da corredora na trilha, atrás dela
  for (const [lx, lz] of [[0.12, -0.95], [-0.12, -1.55], [0.1, -2.1]] as const) {
    const [wx, , wz] = toWorld(lx, 0, lz)
    if (Math.hypot(wx, wz) < 2.3) chao.add(pegada(wx, wz, YAW))
  }

  // pedrinhas
  for (const [px, pz, pr, ps] of [
    [-2.05, 0.95, 0.13, 3],
    [1.95, 0.85, 0.1, 5],
    [0.25, -1.95, 0.12, 7],
    [-0.35, 1.75, 0.08, 9],
  ] as const) {
    const pedra = rock(pr, PEDRA, ps, { roughness: 0.85 })
    pedra.position.set(px, GY + pr * 0.4, pz)
    chao.add(pedra)
  }

  root.add(chao)

  // ---- capim seco espalhado na borda ----------------------------------------
  const capim = new THREE.Group()
  const tufos: [number, number, number][] = [
    [-2.1, 0.45, 0.32], [-1.55, 1.45, 0.28], [-0.85, 1.95, 0.24], [1.3, 1.75, 0.26],
    [2.05, 0.2, 0.32], [1.95, -1.0, 0.3], [0.6, -1.85, 0.3], [-0.55, -1.75, 0.34],
    [-2.15, -0.55, 0.3], [0.35, 1.25, 0.18], [-1.25, 0.6, 0.2],
  ]
  tufos.forEach(([x, z, h], i) => {
    const t = tufo(60 + i, h)
    t.position.set(x, GY, z)
    t.rotation.y = rand() * Math.PI
    capim.add(t)
  })
  root.add(capim)

  // ---- cupinzeiro em torre (fundo, à esquerda) ------------------------------
  const cupinzeiro = new THREE.Group()
  cupinzeiro.position.set(-1.5, GY, -1.35)

  const torre = lathe(
    [
      [0, 0], [0.46, 0], [0.44, 0.12], [0.38, 0.3], [0.35, 0.5], [0.3, 0.72],
      [0.24, 0.92], [0.17, 1.1], [0.1, 1.25], [0.04, 1.34], [0, 1.35],
    ],
    CUPIM,
    { roughness: 0.95 },
  )
  cupinzeiro.add(torre)

  const torrinha = lathe(
    [[0, 0], [0.26, 0], [0.24, 0.15], [0.19, 0.38], [0.12, 0.58], [0.05, 0.7], [0, 0.71]],
    CUPIM,
    { roughness: 0.95 },
  )
  torrinha.position.set(0.36, 0, 0.16)
  cupinzeiro.add(torrinha)

  for (const [bx, by, bz, br, bs] of [
    [-0.36, 0.1, 0.12, 0.2, 11], [0.1, 0.08, 0.4, 0.17, 12], [-0.18, 0.55, 0.22, 0.14, 13],
    [0.2, 0.85, 0.08, 0.11, 14], [-0.3, 0.12, -0.3, 0.2, 15],
  ] as const) {
    const torrao = rock(br, CUPIM, bs, { roughness: 0.95 })
    torrao.position.set(bx, by, bz)
    cupinzeiro.add(torrao)
  }

  // buraquinhos dos cupins
  for (const [hx, hy, hz] of [[0.06, 0.42, 0.36], [-0.12, 0.78, 0.24], [0.42, 0.3, 0.37]] as const) {
    const furo = sphere(0.035, CUPIM_ESC, { roughness: 0.9 })
    furo.scale.set(1, 1.3, 0.5)
    furo.position.set(hx, hy, hz)
    cupinzeiro.add(furo)
  }
  root.add(cupinzeiro)

  // ---- arvorezinha de tronco retorcido (fundo, à direita) -------------------
  const arvore = new THREE.Group()
  arvore.position.set(1.6, GY, -1.2)

  const tronco: [THREE.Vector3, THREE.Vector3, number][] = [
    [V(0, 0, 0), V(0.1, 0.36, 0.03), 0.1],
    [V(0.1, 0.36, 0.03), V(-0.06, 0.7, 0), 0.09],
    [V(-0.06, 0.7, 0), V(0.08, 0.98, -0.03), 0.08],
    [V(0.08, 0.98, -0.03), V(-0.3, 1.28, 0.06), 0.055],
    [V(0.08, 0.98, -0.03), V(0.4, 1.24, -0.04), 0.055],
    [V(-0.06, 0.7, 0), V(-0.32, 0.88, 0.08), 0.045],
  ]
  for (const [a, b, r] of tronco) {
    arvore.add(between(a, b, r, CASCA, 0.95))
  }
  for (const n of [V(0.1, 0.36, 0.03), V(-0.06, 0.7, 0), V(0.08, 0.98, -0.03)]) {
    const no = sphere(0.1, CASCA, { roughness: 0.95 })
    no.position.copy(n)
    arvore.add(no)
  }
  const raiz = cylinder(0.12, 0.17, 0.08, CASCA, { roughness: 0.95 })
  raiz.position.y = 0.04
  arvore.add(raiz)

  for (const [cx, cy, cz, cr, cs, cc] of [
    [-0.36, 1.42, 0.06, 0.28, 31, COPA],
    [0.44, 1.38, -0.05, 0.26, 32, COPA_ESC],
    [0.04, 1.6, -0.06, 0.3, 33, COPA],
    [-0.4, 0.98, 0.1, 0.13, 34, COPA_ESC],
  ] as const) {
    const copa = puff(cr, cc, 6, cs, { roughness: 0.9 })
    copa.position.set(cx, cy, cz)
    copa.scale.y = 0.8
    arvore.add(copa)
  }
  root.add(arvore)

  // ---- mochila de trilha azul, aberta no chão ------------------------------
  const mochila = new THREE.Group()
  const [mx, , mz] = toWorld(0, 0, 1.42)
  mochila.position.set(mx, GY, mz)
  mochila.rotation.y = -0.22

  const saco = rbox(0.48, 0.46, 0.3, 0.09, MOCHILA, { roughness: 0.8 })
  saco.position.y = 0.23
  mochila.add(saco)

  const fundo = rbox(0.5, 0.08, 0.32, 0.035, MOCHILA_ESC, { roughness: 0.85 })
  fundo.position.y = 0.04
  mochila.add(fundo)

  const bolso = rbox(0.34, 0.2, 0.08, 0.04, MOCHILA_ESC, { roughness: 0.8 })
  bolso.position.set(0, 0.17, 0.15)
  mochila.add(bolso)

  const ziper = rbox(0.28, 0.012, 0.012, 0.004, '#c8ccd2', { roughness: 0.4, metalness: 0.5 })
  ziper.position.set(0, 0.245, 0.192)
  mochila.add(ziper)

  const puxador = rbox(0.022, 0.05, 0.012, 0.005, FIVELA, { roughness: 0.4 })
  puxador.position.set(0.1, 0.225, 0.2)
  mochila.add(puxador)

  // boca aberta: forro escuro + golinha de tecido em volta
  const forro = rbox(0.38, 0.02, 0.21, 0.01, FORRO, { roughness: 0.9 })
  forro.position.y = 0.455
  mochila.add(forro)

  for (const [gx, gz, gw, gd] of [[0, 0.125, 0.44, 0.035], [0, -0.125, 0.44, 0.035]] as const) {
    const gola = rbox(gw, 0.07, gd, 0.015, MOCHILA, { roughness: 0.85 })
    gola.position.set(gx, 0.475, gz)
    mochila.add(gola)
  }
  for (const side of [-1, 1]) {
    const gola = rbox(0.035, 0.07, 0.25, 0.015, MOCHILA, { roughness: 0.85 })
    gola.position.set(side * 0.205, 0.475, 0)
    mochila.add(gola)

    // bolso lateral com garrafinha
    const lateral = rbox(0.06, 0.18, 0.2, 0.025, MOCHILA_ESC, { roughness: 0.85 })
    lateral.position.set(side * 0.255, 0.13, 0)
    mochila.add(lateral)
  }
  const garrafa = lathe(
    [[0, 0], [0.055, 0], [0.058, 0.2], [0.04, 0.24], [0.03, 0.27], [0, 0.27]],
    '#5f7f6f',
    { roughness: 0.35, metalness: 0.5 },
  )
  garrafa.position.set(0.27, 0.06, 0)
  mochila.add(garrafa)
  const tampinha = cylinder(0.032, 0.032, 0.04, '#2f3a35', { roughness: 0.5 })
  tampinha.position.set(0.27, 0.345, 0)
  mochila.add(tampinha)

  // aba virada pra trás (dobradiça na borda de trás da boca)
  const aba = new THREE.Group()
  aba.position.set(0, 0.49, -0.15)
  aba.rotation.x = -1.2
  const abaPano = rbox(0.46, 0.035, 0.3, 0.015, MOCHILA, { roughness: 0.8 })
  abaPano.position.z = -0.15
  aba.add(abaPano)
  for (const side of [-1, 1]) {
    const tira = rbox(0.045, 0.012, 0.3, 0.005, MOCHILA_ESC, { roughness: 0.8 })
    tira.position.set(side * 0.12, 0.022, -0.17)
    aba.add(tira)
    const fivela = rbox(0.065, 0.02, 0.05, 0.008, FIVELA, { roughness: 0.4 })
    fivela.position.set(side * 0.12, 0.03, -0.3)
    aba.add(fivela)
  }
  mochila.add(aba)
  root.add(mochila)

  // ---- a EMA: corpo, plumagem, pernas (orgânica) ----------------------------
  const ema = new THREE.Group()
  ema.position.set(EMA_X, GY, EMA_Z)
  ema.rotation.y = YAW

  const corpo = sphere(0.42, EMA, { roughness: 0.9 })
  corpo.scale.set(0.84, 0.78, 1.15)
  corpo.position.set(0, 1.0, -0.04)
  ema.add(corpo)

  const peito = sphere(0.25, EMA, { roughness: 0.9 })
  peito.scale.set(1, 1.05, 0.9)
  peito.position.set(0, 0.98, 0.28)
  ema.add(peito)

  const colar = sphere(0.165, COLAR, { roughness: 0.9 })
  colar.scale.set(1, 1.1, 1)
  colar.position.set(...NECK_BASE)
  ema.add(colar)

  // asas caídas dos lados, com plumas desgrenhadas na borda
  for (const side of [-1, 1]) {
    const asa = sphere(0.3, EMA_ESC, { roughness: 0.92 })
    asa.scale.set(0.34, 0.62, 1.05)
    asa.position.set(side * 0.3, 1.04, -0.1)
    asa.rotation.x = 0.25
    ema.add(asa)
    for (let i = 0; i < 4; i++) {
      const z = 0.12 - i * 0.16
      const a = V(side * 0.33, 0.86 - i * 0.02, z)
      const b = V(side * (0.39 + rand() * 0.04), 0.7 - rand() * 0.05, z - 0.08 - rand() * 0.04)
      ema.add(between(a, b, 0.07 + rand() * 0.015, i % 2 ? EMA : EMA_ESC, 0.92))
    }
  }

  // saia de penas pendentes em volta da barriga
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2
    const sx = Math.sin(a)
    const cz = Math.cos(a)
    const topo = V(sx * 0.29, 0.86, cz * 0.41 - 0.04)
    const ponta = V(sx * 0.33, 0.68 - rand() * 0.06, cz * 0.47 - 0.04)
    ema.add(between(topo, ponta, 0.092 + rand() * 0.015, i % 3 === 0 ? EMA_ESC : EMA, 0.92))
  }

  // penacho caído na traseira
  const traseira = sphere(0.26, EMA_ESC, { roughness: 0.92 })
  traseira.scale.set(0.95, 0.8, 0.75)
  traseira.position.set(0, 0.95, -0.42)
  ema.add(traseira)
  for (const tx of [-0.11, 0.11]) {
    ema.add(between(V(tx * 0.6, 0.96, -0.5), V(tx, 0.78, -0.6), 0.1, EMA_ESC, 0.92))
  }

  // tufos arrepiados nas costas
  for (const [ax, ay, az, bx, by, bz] of [
    [0.05, 1.28, -0.12, 0.08, 1.35, -0.24],
    [-0.08, 1.26, -0.26, -0.12, 1.31, -0.37],
    [0.12, 1.2, -0.33, 0.17, 1.24, -0.44],
  ] as const) {
    ema.add(between(V(ax, ay, az), V(bx, by, bz), 0.06, EMA, 0.92))
  }

  // perna direita (perto da câmera), plantada
  {
    const x = -0.16
    ema.add(between(V(x, 0.96, 0.02), V(x, 0.72, 0.03), 0.105, EMA, 0.9)) // coxa emplumada
    const H = V(x, 0.74, 0.03)
    const J = V(x, 0.42, -0.07)
    const F = V(x, 0.07, 0.04)
    ema.add(between(H, J, 0.058, PERNA, 0.7))
    const calcanhar = sphere(0.068, PERNA, { roughness: 0.7 })
    calcanhar.position.copy(J)
    ema.add(calcanhar)
    ema.add(between(J, F, 0.05, PERNA, 0.7))
    const pe = sphere(0.075, PERNA, { roughness: 0.7 })
    pe.scale.set(1, 0.6, 1.1)
    pe.position.set(x, 0.05, 0.05)
    ema.add(pe)
    // dois dedos no chão (o do meio é a peça 'dedo')
    for (const a of [-0.6, 0.6]) {
      const base = V(x, 0.04, 0.07)
      const tip = V(x + Math.sin(a) * 0.17, 0.035, 0.07 + Math.cos(a) * 0.17)
      ema.add(between(base, tip, 0.036, PERNA, 0.7))
      const unha = cone(0.026, 0.06, UNHA, { roughness: 0.4 })
      unha.position.set(x + Math.sin(a) * 0.22, 0.03, 0.07 + Math.cos(a) * 0.22)
      unha.rotation.set(Math.PI / 2, 0, -a)
      ema.add(unha)
    }
  }

  // perna esquerda (longe), machucada: erguida, pé pendurado no ar
  const LJ = V(0.17, 0.5, 0.24)
  const LF = V(0.17, 0.26, 0.1)
  {
    const x = 0.17
    ema.add(between(V(0.16, 0.96, 0.04), V(x, 0.74, 0.08), 0.105, EMA, 0.9))
    const H = V(x, 0.74, 0.08)
    ema.add(between(H, LJ, 0.058, PERNA, 0.7))
    const calcanhar = sphere(0.068, PERNA, { roughness: 0.7 })
    calcanhar.position.copy(LJ)
    ema.add(calcanhar)
    ema.add(between(LJ, LF, 0.05, PERNA, 0.7))
    // dedos encolhidos, apontando pra baixo
    for (const a of [-0.5, 0, 0.5]) {
      const tip = V(x + Math.sin(a) * 0.09, 0.12, 0.1 + Math.cos(a) * 0.1)
      ema.add(between(V(x, 0.24, 0.12), tip, 0.032, PERNA, 0.7))
    }
  }
  root.add(ema)

  // ---- atadura branca na perna machucada (filha da ema) ---------------------
  const atadura = new THREE.Group()
  atadura.position.copy(LJ).add(LF).multiplyScalar(0.5)
  atadura.quaternion.setFromUnitVectors(UP, new THREE.Vector3().subVectors(LF, LJ).normalize())
  {
    const faixa = capsule(0.078, 0.13, ATADURA, { roughness: 0.92 })
    atadura.add(faixa)
    for (const y of [-0.075, -0.025, 0.025, 0.075]) {
      const volta = torus(0.079, 0.014, ATADURA, { roughness: 0.92 })
      volta.rotation.x = Math.PI / 2
      volta.rotation.y = 0.2
      volta.position.y = y
      atadura.add(volta)
    }
    const ponta = rbox(0.05, 0.13, 0.014, 0.006, ATADURA, { roughness: 0.92 })
    ponta.position.set(-0.07, -0.02, 0.03)
    ponta.rotation.set(0.2, 0.3, 0.35)
    atadura.add(ponta)
  }
  ema.add(atadura)

  // ---- o dedo do pé erguido: EN (filho da ema) ------------------------------
  const dedo = new THREE.Group()
  dedo.position.set(-0.16, 0.045, 0.08)
  dedo.rotation.x = DEDO_ERGUIDO
  {
    dedo.add(between(V(0, 0, 0), V(0, 0, 0.23), 0.045, PERNA, 0.7))
    const junta = sphere(0.05, PERNA, { roughness: 0.7 })
    junta.position.z = 0.12
    dedo.add(junta)
    const unha = cone(0.035, 0.09, UNHA, { roughness: 0.4 })
    unha.rotation.x = Math.PI / 2
    unha.position.z = 0.31
    dedo.add(unha)
  }
  ema.add(dedo)

  // ---- pescoço comprido + cabeça (filho da ema; gira pela base) -------------
  const pescoco = new THREE.Group()
  pescoco.position.set(...NECK_BASE)
  pescoco.rotation.order = 'YXZ'

  const curva = new THREE.CatmullRomCurve3([
    V(0, 0, 0),
    V(0, 0.3, 0.1),
    V(0, 0.5, 0.35),
    V(0, 0.54, 0.64),
    V(0, 0.38, 0.9),
    V(0, 0.08, 1.0),
    V(0, -0.2, 1.0),
  ])
  const pts = curva.getPoints(18)
  for (let i = 0; i < pts.length - 1; i++) {
    const k = i / (pts.length - 2)
    const r = 0.095 + (0.058 - 0.095) * k
    pescoco.add(between(pts[i], pts[i + 1], r, k < 0.08 ? COLAR : EMA_CLARO, 0.9))
  }

  const cabeca = new THREE.Group()
  cabeca.position.set(0, -0.27, 1.0)
  cabeca.rotation.x = 1.2 // bico pra baixo, dentro da mochila
  pescoco.add(cabeca)

  const cranio = sphere(0.1, EMA_CLARO, { roughness: 0.85 })
  cranio.scale.set(0.85, 0.9, 1.15)
  cabeca.add(cranio)

  const bico = sphere(0.1, BICO, { roughness: 0.45 })
  bico.scale.set(0.5, 0.2, 1.05)
  bico.position.set(0, -0.025, 0.14)
  cabeca.add(bico)

  const boca = rbox(0.1, 0.006, 0.17, 0.003, BICO_ESC, { roughness: 0.5 })
  boca.position.set(0, -0.03, 0.14)
  cabeca.add(boca)

  for (const side of [-1, 1]) {
    const narina = sphere(0.009, '#3a3020', { roughness: 0.5 })
    narina.position.set(side * 0.022, -0.008, 0.18)
    cabeca.add(narina)

    // olho grande e arregalado, de lado
    const esclera = sphere(0.05, '#ffffff', { roughness: 0.25 })
    esclera.scale.x = 0.6
    esclera.position.set(side * 0.068, 0.035, 0.015)
    const pupila = sphere(0.024, '#151515', { roughness: 0.2 })
    pupila.position.set(side * 0.095, 0.035, 0.03)
    const brilho = sphere(0.008, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.112, 0.046, 0.04)
    cabeca.add(esclera, pupila, brilho)
  }

  // topete desgrenhado
  for (const [tx, tz, ty] of [[0, -0.06, 0.12], [0.03, -0.1, 0.09], [-0.03, -0.1, 0.1]] as const) {
    cabeca.add(between(V(0, 0.06, -0.04), V(tx, ty + 0.03, tz - 0.06), 0.018, EMA, 0.9))
  }
  ema.add(pescoco)

  // ---- cartela GIGANTE de comprimidos (acento) ------------------------------
  const cartela = new THREE.Group()
  const [cx, cy, cz] = toWorld(0, 0.5, 1.41)
  cartela.position.set(cx, cy, cz)
  cartela.rotation.set(-0.12, -0.2, 0.14)
  cartela.scale.setScalar(1.15)
  {
    const folha = rbox(0.36, 0.52, 0.03, 0.025, PRATA, { roughness: 0.25, metalness: 0.85 })
    cartela.add(folha)

    const faixa = rbox(0.33, 0.06, 0.01, 0.004, ACENTO, { roughness: 0.4 })
    faixa.position.set(0, 0.205, 0.017)
    cartela.add(faixa)

    // picote entre as bolhas
    for (const y of [0.04, -0.09]) {
      const picote = rbox(0.33, 0.007, 0.006, 0.002, '#98a0aa', { roughness: 0.4, metalness: 0.6 })
      picote.position.set(0, y, 0.017)
      cartela.add(picote)
    }
    const picoteV = rbox(0.007, 0.39, 0.006, 0.002, '#98a0aa', { roughness: 0.4, metalness: 0.6 })
    picoteV.position.set(0, -0.045, 0.017)
    cartela.add(picoteV)

    for (const y of [0.105, -0.025, -0.155]) {
      for (const x of [-0.085, 0.085]) {
        const bolha = torus(0.056, 0.009, '#e6eaef', { roughness: 0.2 })
        bolha.position.set(x, y, 0.016)
        cartela.add(bolha)

        const pilula = lathe(
          [[0, -0.018], [0.044, -0.018], [0.052, -0.008], [0.052, 0.008], [0.044, 0.018], [0, 0.018]],
          PILULA,
          { roughness: 0.5 },
        )
        pilula.rotation.x = Math.PI / 2
        pilula.position.set(x, y, 0.034)
        cartela.add(pilula)

        const risco = rbox(0.07, 0.007, 0.004, 0.002, '#d8d4c8', { roughness: 0.6 })
        risco.position.set(x, y, 0.053)
        cartela.add(risco)
      }
    }
  }
  root.add(cartela)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'chao', group: 'cerrado', object: chao },
    { name: 'capim', group: 'cerrado', object: capim },
    { name: 'cupinzeiro', group: 'cerrado', object: cupinzeiro },
    { name: 'arvore', group: 'cerrado', object: arvore },
    { name: 'mochila', group: 'mochila', object: mochila },
    { name: 'aba', group: 'mochila', object: aba },
    { name: 'ema', group: 'ema', object: ema },
    { name: 'atadura', group: 'ema', object: atadura },
    { name: 'pescoco', group: 'ema', object: pescoco },
    { name: 'dedo', group: 'en', object: dedo },
    { name: 'cartela', group: 'tablete', object: cartela },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('chao-rise', 'chao', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma trilha de terra vermelha no cerrado: cupinzeiro em torre e arvorezinha de tronco torto.',
    }),
    seq('capim-cresce', 'capim', 0.5, 0.7, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),
    seq('cupinzeiro-rise', 'cupinzeiro', 0.6, 0.8, [riseFrom(GY, 1.6)], { ease: 'easeOut' }),
    seq('arvore-rise', 'arvore', 0.9, 0.8, [riseFrom(GY, 2.1)], { ease: 'easeOut' }),

    seq('mochila-cai', 'mochila', 2.2, 0.55, [ch('position.y', GY + 1.4, GY)], {
      ease: 'easeIn',
      caption: 'No meio da trilha, a SUA mochila azul, largada no chão…',
    }),
    seq('aba-abre', 'aba', 2.2, 1.2, [ch('rotation.x', Math.PI, -1.2)], { ease: 'easeInOut' }),

    seq('ema-rise', 'ema', 3.6, 1.0, [riseFrom(GY, 2.4), ch('rotation.z', 0.18, 0)], {
      ease: 'easeOut',
      caption: 'Chega a EMA, a corredora do campo — mancando, de perna enfaixada: tropeçou no cupinzeiro.',
    }),
    seq('dedo-chega', 'dedo', 3.6, 0.1, [ch('rotation.x', 0, 0)]),
    seq('pescoco-cresce', 'pescoco', 3.8, 0.8, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('atadura-enrola', 'atadura', 4.4, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('pescoco-aponta', 'pescoco', 5.9, 0.7, [
      ch('rotation.y', 0, PESC_VIRADO_Y),
      ch('rotation.x', PESC_ERGUIDO_X - 0.15, PESC_ERGUIDO_X),
    ], {
      ease: 'easeOut',
      caption: 'Ela solta um rugidinho soprado — RRÁR! — e aponta o bico bem pra você: DÜ?',
    }),

    seq('dedo-ergue', 'dedo', 7.6, 0.5, [ch('rotation.x', 0, DEDO_ERGUIDO)], {
      ease: 'easeOut',
      caption: 'Ergue UM dedo do pé — EN, um só…',
    }),

    seq('pescoco-mergulha', 'pescoco', 9.0, 1.1, [
      ch('rotation.x', PESC_ERGUIDO_X, PESC_FUNDO_X),
      ch('rotation.y', PESC_VIRADO_Y, 0),
    ], {
      caption: '…e mergulha o pescoço na sua mochila pra VER QUE TA-BLÉT(e) você tem aí dentro.',
    }),

    seq('cartela-sai', 'cartela', 10.5, 0.8, [
      ch('position.y', cy - 0.32, cy),
      ch('rotation.z', -0.15, 0.3),
    ], {
      ease: 'easeOut',
      caption: 'Sai de lá com uma cartela GIGANTE de comprimidos presa no bico!',
    }),
    seq('pescoco-puxa', 'pescoco', 10.5, 0.8, [ch('rotation.x', PESC_FUNDO_X, 0)], { ease: 'easeOut' }),

    seq('cartela-balanca', 'cartela', 12.0, 0.6, [ch('rotation.z', 0.3, 0.14)], {
      caption: 'Har du en värktablett? — Você tem um comprimido pra dor?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 1.9, 4.0], target: [0.02, 1.02, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'har-du-en-varktablett',
    contexto:
      'Saúde: pedindo a um colega, amigo ou parceiro quando bate a dor de cabeça; muita gente na Suécia carrega analgésico na bolsa. Na farmácia (e até no supermercado) os nomes que você vai ouvir são Alvedon (paracetamol) e Ipren (ibuprofeno).',
    fraseFonte: 'Você tem um comprimido pra dor?',
    fraseAlvo: 'Har du en värktablett?',
    pronuncia:
      "rrar dü en VÄRK-ta-blètt? ('har du' sai num bloco: h soprado, A longo e o R brando derretendo no D — rrá-dü —, com o Ü de bico; 'en' curto, oral, N na ponta da língua; 'värktablett' é UMA palavra só, com a força no VÄRK — Ä bem aberto antes do R, quase A, e K seco — e um acento menor no BLETT, É aberto e curto, com o T segurado; o 'ta' do meio sai fraquinho)",
    ponteSonora:
      "RRÁR-DÜ... EN... VER QUE TA-BLÉT(e)? (6 sílabas: rrar-dü-en-VÉRK-ta-blett; força maior no VÉRK e um apoio no BLÉT; RRÁR-DÜ = o 'har du' de sempre, o MESMO de 'Har du tid en stund?' e 'Har du lust att ses?': o rugidinho soprado (h), A longo e o R BRANDO derretendo direto no D, rrá-dü — sem esse R sobra 'ha', outro verbo; DÜ com BICO DE PATO, o 'du' de CAN-DU — aqui é o bico da ema apontando pra você; EN = 'um', o MESMO dedinho erguido de 'Har du tid en stund?' e 'Jag behöver träffa en läkare' — aqui UM dedo do pé da ema —, curto, oral, N na ponta da língua; nunca ÉT, que é o 'ett'; VER QUE = o MESMO 'värk' (dor) de 'Jag har huvudvärk' e 'Jag har tandvärk': VÉR com É ABERTO de 'pé', R brando, e do QUE só o K seco, sem 'ki' — e a força maior da palavra cai AQUI, no VÉRK; TA-BLÉT(e) = o TABLETE sem o -e final: o TA fraquinho e o BLÉT com o É aberto que o português já faz (ta-BLÉ-te), curto, com o T segurado fechando seco — nunca 'ta-BLÉ-tchi'; tudo emendado é UMA palavra só: VÉRK-ta-blett)",
    historia:
      'Você está numa trilha do cerrado quando a ema — a corredora mais rápida do campo — chega mancando, de perna enfaixada depois de tropeçar num cupinzeiro. Para do seu lado, solta um rugidinho soprado — RRÁR! — e aponta o bico bem pra você: DÜ? Ergue UM dedo do pé, EN, e mergulha o pescoço compridíssimo na sua mochila aberta no chão pra VER QUE TABLETE você tem lá dentro. Sai de lá com uma cartela gigante de comprimidos no bico e engole tudo de uma vez, com papel prateado e tudo: você tem um comprimido pra dor?',
  },
  createScene,
  refine: { organic: ['ema', 'pescoco', 'cupinzeiro'] },
}

export default card
