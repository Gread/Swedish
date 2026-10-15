import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'

/**
 * "Jag har bott här i sju år." — IÁ RRÁR… BÓT' RRÉ-RI… RRÜÜ ÔR!
 *
 * Um golfinho mora há tanto tempo na banheira de um apartamento sueco que já
 * perdeu a conta (IÁ RRÁR = eu HÁ…). A galocha largada no primeiro dia virou
 * vaso: da BOTA (BÓT') brotou uma HERA (RRÉR) que subiu até o teto. Todo
 * aniversário da mudança ele guincha — I! —, estica o bico e sopra FORTE —
 * RRÜÜ! — cuspindo uma moeda de OURO (ÔR) na borda. Seis na pilha + a que voa
 * = sete anos.
 *
 * Diorama: piso de azulejo branco, parede de azulejo azul-claro, banheira
 * branca de pés de bronze no centro com o golfinho erguido de perfil, bico
 * apontando para a pilha de moedas na borda direita; bota preta com a hera
 * à esquerda subindo até a cornija.
 */

const TILE = '#eef0ee'
const GROUT = '#a9b0b3'
const WALL = '#b9d7e6'
const WALL_ALT = '#a9cbdd'
const WALL_GROUT = '#8fa9b6'
const CORNICE = '#f4f3ee'
const ENAMEL = '#f7f6f1'
const ENAMEL_SH = '#e3e4e0'
const BRONZE = '#a7814b'
const WATER = '#5bb7c2'
const WATER_LIGHT = '#8fd3d9'
const DOLPHIN = '#7590a6'
const DOLPHIN_DARK = '#5d768b'
const BELLY = '#cdd8e0'
const JAW = '#b9c8d4'
const EYE = '#16191c'
const RUBBER = '#22252a'
const RUBBER_SOLE = '#141619'
const SOIL = '#4a3526'
const IVY = '#3f7a3a'
const IVY_LIGHT = '#5f9a48'
const STEM = '#4d5f2c'
const TOWEL = '#d48a78'
const TOWEL_DARK = '#b8705f'
const MAT = '#c9b7a0'
const GOLD = '#f5b512' // acento saturado RESERVADO às moedas de ouro (ÔR)
const GOLD_DARK = '#d18f07'

const FY = 0.12 // topo do piso
const WALL_Z = -1.55
const WALL_H = 2.62
const WALL_FACE = WALL_Z + 0.06
const TUB_X = 0.05
const TUB_SX = 1.85 // alongamento da banheira (lathe oval)
const TUB_Y = FY + 0.16 // fundo da banheira (sobre os pés)
const RIM_Y = TUB_Y + 0.68
const WATER_Y = TUB_Y + 0.5
const DOLPHIN_X = -0.42
const BOOT: [number, number, number] = [-1.62, FY, -1.08]
const BOOT_TOP = 0.58
const PILE: [number, number, number] = [TUB_X + 1.02, RIM_Y, 0.0]
const COIN_R = 0.1
const COIN_T = 0.034
const FLY: [number, number, number] = [0.8, 1.42, 0.06]

/** Haste cilíndrica entre dois pontos (galhos da hera). */
function stemBetween(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = new THREE.Vector3().subVectors(b, a)
  const s = cylinder(r * 0.8, r, d.length(), color, { roughness: 0.8 }, 10)
  s.position.copy(a).addScaledVector(d, 0.5)
  s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return s
}

/** Folha de hera: três lóbulos achatados, de face para a câmera. */
function leaf(color: string, size: number) {
  const g = new THREE.Group()
  const mid = sphere(size, color, { roughness: 0.55 }, 14)
  mid.scale.set(0.8, 1.05, 0.22)
  mid.position.y = size * 0.25
  g.add(mid)
  for (const side of [-1, 1]) {
    const lobe = sphere(size * 0.7, color, { roughness: 0.55 }, 12)
    lobe.scale.set(1, 0.8, 0.22)
    lobe.position.set(side * size * 0.55, -size * 0.1, -0.005)
    g.add(lobe)
  }
  return g
}

/** Moeda de ouro deitada (eixo y), com aro e relevo central. */
function coin() {
  const g = new THREE.Group()
  const disc = cylinder(COIN_R, COIN_R, COIN_T, GOLD, { roughness: 0.3, metalness: 0.6, emissive: GOLD_DARK, emissiveIntensity: 0.35 }, 28)
  g.add(disc)
  for (const sy of [-1, 1]) {
    const rim = torus(COIN_R * 0.8, 0.008, GOLD_DARK, { roughness: 0.3, metalness: 0.85 })
    rim.rotation.x = Math.PI / 2
    rim.position.y = sy * COIN_T * 0.5
    g.add(rim)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(77)

  // ---- piso de azulejo branco ----------------------------------------------
  const piso = new THREE.Group()
  const disco = cylinder(2.62, 2.7, FY, GROUT, { roughness: 0.7 })
  disco.position.y = FY / 2 - 0.004
  piso.add(disco)
  const T = 0.42
  for (let ix = -6; ix <= 6; ix++) {
    for (let iz = -6; iz <= 6; iz++) {
      const x = ix * T
      const z = iz * T
      const far = Math.hypot(Math.abs(x) + T / 2, Math.abs(z) + T / 2)
      if (far > 2.6) continue
      const t = rbox(T - 0.025, 0.02, T - 0.025, 0.008, TILE, { roughness: 0.3 })
      t.position.set(x, FY - 0.006, z)
      piso.add(t)
    }
  }
  // tapetinho de banho na frente da banheira
  const tapete = rbox(1.0, 0.03, 0.5, 0.05, MAT, { roughness: 0.95 })
  tapete.position.set(TUB_X - 0.15, FY + 0.016, 1.12)
  tapete.rotation.y = 0.06
  piso.add(tapete)
  root.add(piso)

  // ---- parede de azulejos azul-claros + cornija (o "teto") -----------------
  const parede = new THREE.Group()
  const halfW = Math.sqrt(2.6 * 2.6 - WALL_Z * WALL_Z) - 0.05
  const painel = rbox(halfW * 2, WALL_H, 0.12, 0.03, WALL_GROUT, { roughness: 0.7 })
  painel.position.set(0, FY + WALL_H / 2, WALL_Z)
  parede.add(painel)
  const W = 0.3
  const cols = Math.floor((halfW * 2) / W)
  const rows = Math.floor((WALL_H - 0.2) / W)
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cor = (c + r) % 5 === 0 ? WALL_ALT : WALL
      const t = rbox(W - 0.022, W - 0.022, 0.03, 0.008, cor, { roughness: 0.25 })
      t.position.set(-halfW + W / 2 + c * W + ((halfW * 2) % W) / 2, FY + W / 2 + 0.02 + r * W, WALL_FACE + 0.01)
      parede.add(t)
    }
  }
  const cornija = rbox(halfW * 2 + 0.08, 0.14, 0.22, 0.04, CORNICE, { roughness: 0.5 })
  cornija.position.set(0, FY + WALL_H - 0.02, WALL_Z + 0.05)
  parede.add(cornija)
  const rodape = rbox(halfW * 2, 0.1, 0.16, 0.03, CORNICE, { roughness: 0.5 })
  rodape.position.set(0, FY + 0.05, WALL_Z + 0.06)
  parede.add(rodape)
  root.add(parede)

  // ---- toalha pendurada à direita ------------------------------------------
  const toalha = new THREE.Group()
  toalha.position.set(1.55, FY + 1.55, WALL_FACE + 0.06)
  const barra = cylinder(0.022, 0.022, 0.7, '#c8ccd0', { roughness: 0.25, metalness: 0.8 })
  barra.rotation.z = Math.PI / 2
  barra.position.z = 0.06
  toalha.add(barra)
  for (const sx of [-1, 1]) {
    const suporte = cylinder(0.025, 0.025, 0.08, '#c8ccd0', { roughness: 0.25, metalness: 0.8 })
    suporte.rotation.x = Math.PI / 2
    suporte.position.set(sx * 0.33, 0, 0.02)
    toalha.add(suporte)
  }
  const pano = rbox(0.5, 0.72, 0.06, 0.03, TOWEL, { roughness: 0.95 })
  pano.position.set(0, -0.32, 0.08)
  toalha.add(pano)
  for (const fy of [-0.56, -0.62]) {
    const faixa = rbox(0.51, 0.025, 0.065, 0.01, TOWEL_DARK, { roughness: 0.95 })
    faixa.position.set(0, fy, 0.08)
    toalha.add(faixa)
  }
  root.add(toalha)

  // ---- banheira branca com pés de bronze -----------------------------------
  const banheira = new THREE.Group()
  banheira.position.set(TUB_X, 0, 0)
  const casco = lathe(
    [
      [0, 0], [0.4, 0], [0.48, 0.06], [0.53, 0.3], [0.57, 0.6], [0.6, 0.64],
      [0.6, 0.68], [0.55, 0.69], [0.52, 0.64], [0.49, 0.36], [0.44, 0.1], [0.36, 0.07], [0, 0.07],
    ],
    ENAMEL,
    { roughness: 0.18 },
    56,
  )
  casco.scale.set(TUB_SX, 1, 1)
  casco.position.y = TUB_Y
  banheira.add(casco)
  // friso na base do casco
  const friso = torus(0.46, 0.022, ENAMEL_SH, { roughness: 0.3 })
  friso.rotation.x = Math.PI / 2
  friso.scale.set(TUB_SX, 1, 1)
  friso.position.y = TUB_Y + 0.05
  banheira.add(friso)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pe = new THREE.Group()
      pe.position.set(sx * 0.62, FY, sz * 0.27)
      const perna = lathe([[0, 0.06], [0.05, 0.08], [0.04, 0.14], [0.065, 0.2], [0, 0.21]], BRONZE, {
        roughness: 0.3, metalness: 0.75,
      })
      pe.add(perna)
      const garra = sphere(0.07, BRONZE, { roughness: 0.3, metalness: 0.75 }, 18)
      garra.scale.set(1.1, 0.6, 1.1)
      garra.position.y = 0.045
      pe.add(garra)
      for (let k = -1; k <= 1; k++) {
        const dedo = sphere(0.03, BRONZE, { roughness: 0.3, metalness: 0.75 }, 12)
        dedo.position.set(sx * 0.06 + k * 0.0, 0.02, k * 0.045)
        pe.add(dedo)
      }
      banheira.add(pe)
    }
  }
  // torneira de bronze na ponta esquerda
  const torneira = new THREE.Group()
  torneira.position.set(0.3, RIM_Y, -0.5)
  const cano = cylinder(0.03, 0.03, 0.22, BRONZE, { roughness: 0.3, metalness: 0.75 })
  cano.position.y = 0.11
  torneira.add(cano)
  const bico = capsule(0.026, 0.14, BRONZE, { roughness: 0.3, metalness: 0.75 })
  bico.rotation.x = Math.PI / 2
  bico.position.set(0, 0.22, 0.08)
  torneira.add(bico)
  for (const sz of [-1, 1]) {
    const registro = cylinder(0.04, 0.04, 0.025, BRONZE, { roughness: 0.3, metalness: 0.75 })
    registro.position.set(sz * 0.08, 0.18, 0)
    torneira.add(registro)
  }
  banheira.add(torneira)
  root.add(banheira)

  // ---- água turquesa -------------------------------------------------------
  const agua = new THREE.Group()
  agua.position.set(TUB_X, WATER_Y, 0)
  const lamina = cylinder(0.52, 0.52, 0.05, WATER, { roughness: 0.08 }, 48)
  lamina.scale.set(TUB_SX, 1, 1)
  agua.add(lamina)
  // ondinhas em volta do golfinho
  for (const [r, y] of [[0.34, 0.03], [0.44, 0.028]] as const) {
    const onda = torus(r, 0.018, WATER_LIGHT, { roughness: 0.1 })
    onda.rotation.x = Math.PI / 2
    onda.scale.set(1.15, 0.85, 1)
    onda.position.set(DOLPHIN_X - TUB_X, y, 0)
    agua.add(onda)
  }
  root.add(agua)

  // ---- GOLFINHO erguido, de perfil, bico para a direita --------------------
  const golfinho = new THREE.Group()
  golfinho.position.set(DOLPHIN_X, WATER_Y, 0)
  root.add(golfinho)

  // tronco esguio, levemente inclinado para trás (de pé na cauda)
  const torso = capsule(0.29, 0.8, DOLPHIN, { roughness: 0.35 })
  torso.position.set(-0.02, 0.36, 0)
  torso.rotation.z = 0.1
  golfinho.add(torso)

  const barriga = sphere(0.25, BELLY, { roughness: 0.4 })
  barriga.scale.set(0.55, 2.0, 0.85)
  barriga.position.set(0.19, 0.4, 0)
  golfinho.add(barriga)

  // cabeça arredondada que nasce do tronco sem pescoço
  const cabeca = sphere(0.27, DOLPHIN, { roughness: 0.35 })
  cabeca.scale.set(1.15, 1.0, 0.92)
  cabeca.position.set(0.02, 0.98, 0)
  golfinho.add(cabeca)

  const melao = sphere(0.2, DOLPHIN, { roughness: 0.35 })
  melao.scale.set(1.05, 0.95, 0.95)
  melao.position.set(0.17, 1.04, 0)
  golfinho.add(melao)

  // bico (rostro) curto e grosso, esticado na direção da pilha
  const rostro = capsule(0.075, 0.2, DOLPHIN, { roughness: 0.35 })
  rostro.rotation.z = -Math.PI / 2 - 0.15
  rostro.position.set(0.42, 0.92, 0)
  golfinho.add(rostro)

  const mandibula = capsule(0.066, 0.2, JAW, { roughness: 0.4 })
  mandibula.rotation.z = -Math.PI / 2 - 0.22
  mandibula.position.set(0.39, 0.86, 0)
  golfinho.add(mandibula)

  const garganta = sphere(0.17, JAW, { roughness: 0.4 })
  garganta.scale.set(0.9, 0.85, 0.85)
  garganta.position.set(0.13, 0.8, 0)
  golfinho.add(garganta)

  // dorso escuro (capa) nas costas
  const capa = capsule(0.2, 0.75, DOLPHIN_DARK, { roughness: 0.35 })
  capa.position.set(-0.11, 0.6, 0)
  capa.rotation.z = 0.12
  golfinho.add(capa)

  // nadadeira dorsal em gancho, voltada para trás
  const dorsal = cone(0.15, 0.42, DOLPHIN_DARK, { roughness: 0.35 })
  dorsal.scale.set(1, 1, 0.32)
  dorsal.rotation.z = 1.25
  dorsal.position.set(-0.38, 0.62, 0)
  golfinho.add(dorsal)
  const dorsalPonta = cone(0.07, 0.2, DOLPHIN_DARK, { roughness: 0.35 })
  dorsalPonta.scale.set(1, 1, 0.32)
  dorsalPonta.rotation.z = 1.85
  dorsalPonta.position.set(-0.56, 0.62, 0)
  golfinho.add(dorsalPonta)

  // nadadeiras peitorais abertas
  for (const sz of [-1, 1]) {
    const peitoral = capsule(0.07, 0.24, DOLPHIN_DARK, { roughness: 0.35 })
    peitoral.scale.set(1.5, 1, 0.45)
    peitoral.position.set(0.1, 0.42, sz * 0.36)
    peitoral.rotation.set(sz * 1.15, 0, -0.6)
    golfinho.add(peitoral)

    const olho = sphere(0.048, EYE, { roughness: 0.15 })
    olho.position.set(0.24, 1.0, sz * 0.2)
    golfinho.add(olho)
  }

  // ---- sopro: cone translúcido saindo da ponta do bico ---------------------
  const sopro = new THREE.Group()
  const SOPRO_X = DOLPHIN_X + 0.6
  const SOPRO_Y = WATER_Y + 0.85
  sopro.position.set(SOPRO_X, SOPRO_Y, 0.02)
  sopro.rotation.z = -0.32
  const jato = cone(0.13, 0.46, '#ffffff', { detail: 0 })
  jato.rotation.z = Math.PI / 2
  jato.position.x = 0.23
  jato.castShadow = false
  const jm = jato.material as THREE.MeshStandardMaterial
  jm.transparent = true
  jm.opacity = 0.6
  jm.depthWrite = false
  sopro.add(jato)
  for (let i = 0; i < 4; i++) {
    const tufo = sphere(0.035 + i * 0.012, '#ffffff', { detail: 0 }, 12)
    tufo.position.set(0.12 + i * 0.12, (rand() - 0.5) * 0.12, (rand() - 0.5) * 0.1)
    tufo.castShadow = false
    const tm = tufo.material as THREE.MeshStandardMaterial
    tm.transparent = true
    tm.opacity = 0.6
    tm.depthWrite = false
    sopro.add(tufo)
  }
  root.add(sopro)

  // ---- moeda voando --------------------------------------------------------
  const moeda = new THREE.Group()
  moeda.position.set(...FLY)
  moeda.rotation.set(Math.PI / 2 - 0.25, 0.35, 0)
  moeda.add(coin())
  const brilho = sphere(0.025, '#fff6d0', { emissive: '#ffe9a3', emissiveIntensity: 1.3 }, 12)
  brilho.position.set(0.06, 0.03, 0.05)
  moeda.add(brilho)
  root.add(moeda)

  // ---- pilha de seis moedas na borda ---------------------------------------
  const pilha = new THREE.Group()
  pilha.position.set(...PILE)
  for (let i = 0; i < 6; i++) {
    const c = coin()
    c.position.set((rand() - 0.5) * 0.025, COIN_T / 2 + i * (COIN_T + 0.002), (rand() - 0.5) * 0.025)
    c.rotation.y = rand() * Math.PI
    pilha.add(c)
  }
  root.add(pilha)

  // ---- bota de borracha preta ----------------------------------------------
  const bota = new THREE.Group()
  bota.position.set(...BOOT)
  bota.rotation.y = 0.35
  const sola = rbox(0.46, 0.05, 0.22, 0.02, RUBBER_SOLE, { roughness: 0.7 })
  sola.position.set(0.08, 0.025, 0)
  bota.add(sola)
  const pe = capsule(0.1, 0.24, RUBBER, { roughness: 0.32 })
  pe.rotation.z = Math.PI / 2
  pe.scale.set(1, 1, 1.05)
  pe.position.set(0.12, 0.1, 0)
  bota.add(pe)
  const canoBota = lathe(
    [[0, 0.04], [0.12, 0.04], [0.125, 0.2], [0.13, 0.5], [0.14, 0.56], [0.15, BOOT_TOP], [0.125, BOOT_TOP], [0.115, 0.5], [0, 0.5]],
    RUBBER,
    { roughness: 0.32 },
  )
  bota.add(canoBota)
  const virola = torus(0.14, 0.014, RUBBER_SOLE, { roughness: 0.5 })
  virola.rotation.x = Math.PI / 2
  virola.position.y = BOOT_TOP - 0.005
  bota.add(virola)
  const terra = cylinder(0.122, 0.122, 0.02, SOIL, { roughness: 0.95 })
  terra.position.y = BOOT_TOP - 0.03
  bota.add(terra)
  const alca = torus(0.04, 0.012, RUBBER_SOLE, { roughness: 0.5 })
  alca.position.set(-0.14, BOOT_TOP - 0.06, 0)
  alca.rotation.y = Math.PI / 2
  bota.add(alca)
  root.add(bota)

  // ---- hera subindo da bota até a cornija ----------------------------------
  const hera = new THREE.Group()
  hera.position.set(BOOT[0], FY + BOOT_TOP - 0.02, BOOT[2])
  const zw = WALL_FACE + 0.05 - BOOT[2] // z local rente à parede
  const topY = WALL_H - 0.12 - BOOT_TOP
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  const tronco = [
    V(0, 0, 0), V(0.06, 0.22, zw * 0.6), V(-0.04, 0.55, zw), V(0.08, 0.95, zw),
    V(-0.05, 1.35, zw), V(0.07, 1.7, zw), V(0.0, topY, zw),
  ]
  const ramos: THREE.Vector3[][] = [
    tronco,
    [V(0.0, topY, zw), V(0.4, topY + 0.04, zw), V(0.85, topY - 0.02, zw), V(1.3, topY + 0.03, zw), V(1.7, topY - 0.05, zw)],
    [V(0.0, topY, zw), V(-0.3, topY - 0.02, zw), V(-0.55, topY + 0.02, zw)],
    [V(0.08, 0.95, zw), V(0.35, 1.1, zw), V(0.55, 1.05, zw)],
    [V(-0.05, 1.35, zw), V(-0.3, 1.5, zw), V(-0.42, 1.42, zw)],
    [V(1.3, topY + 0.03, zw), V(1.42, topY - 0.3, zw), V(1.36, topY - 0.55, zw)],
  ]
  ramos.forEach((ramo, ri) => {
    for (let i = 0; i < ramo.length - 1; i++) {
      hera.add(stemBetween(ramo[i], ramo[i + 1], ri === 0 ? 0.022 : 0.015, STEM))
      // folhas ao longo de cada segmento
      const n = ri === 0 && i === 0 ? 1 : 2
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n
        const p = ramo[i].clone().lerp(ramo[i + 1], t)
        const f = leaf(rand() > 0.45 ? IVY : IVY_LIGHT, 0.06 + rand() * 0.03)
        const side = (i + k) % 2 === 0 ? 1 : -1
        f.position.set(p.x + side * 0.06, p.y + (rand() - 0.3) * 0.06, p.z + 0.03)
        f.rotation.z = side * (0.5 + rand() * 0.6)
        hera.add(f)
      }
    }
  })
  root.add(hera)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'banheiro', object: piso },
    { name: 'parede', group: 'banheiro', object: parede },
    { name: 'toalha', group: 'banheiro', object: toalha },
    { name: 'banheira', group: 'banheira', object: banheira },
    { name: 'agua', group: 'banheira', object: agua },
    { name: 'golfinho', group: 'golfinho', object: golfinho },
    { name: 'bota', group: 'bota', object: bota },
    { name: 'hera', group: 'hera', object: hera },
    { name: 'pilha', group: 'ouro', object: pilha },
    { name: 'sopro', group: 'sopro', object: sopro },
    { name: 'moeda', group: 'sopro', object: moeda },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('piso-rise', 'piso', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Sobe do chão um banheiro sueco: azulejo branco no piso, azul-claro na parede.',
    }),
    seq('parede-rise', 'parede', 0.2, 0.9, [riseFrom(0, 2.8)], { ease: 'easeOut' }),
    seq('toalha-cai', 'toalha', 0.8, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('banheira-rise', 'banheira', 1.6, 0.8, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'No meio, uma banheira branca de pés dourados, cheia d\'água.',
    }),
    seq('agua-enche', 'agua', 2.1, 0.6, [ch('position.y', TUB_Y + 0.1, WATER_Y)], { ease: 'easeOut' }),

    seq('golfinho-rise', 'golfinho', 3.1, 1.0, [riseFrom(WATER_Y, 1.75)], {
      ease: 'easeOut',
      caption: 'Dela emerge o morador — um golfinho que já perdeu a conta: IÁ RRÁR… eu HÁ…',
    }),

    seq('bota-rise', 'bota', 5.0, 0.6, [riseFrom(FY, 0.7)], {
      ease: 'easeOut',
      caption: 'No canto, a galocha largada no primeiro dia: uma BOTA — BÓT\'…',
    }),
    seq(
      'hera-cresce',
      'hera',
      6.2,
      1.2,
      [ch('scale.y', 0.01, 1), ch('scale.x', 0.3, 1)],
      {
        ease: 'easeOut',
        caption: '…virou vaso: dela brotou uma HERA — RRÉR — que já subiu até o teto.',
      },
    ),

    seq('pilha-rise', 'pilha', 7.8, 0.6, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Na borda, seis moedas de OURO: uma a cada aniversário da mudança.',
    }),

    seq('golfinho-inspira', 'golfinho', 9.0, 0.5, [ch('rotation.z', 0, 0.16)], {
      ease: 'easeOut',
      caption: 'Hoje faz mais um ano: um guinchinho — I! — e ele estica o BICO…',
    }),
    seq('golfinho-sopra', 'golfinho', 9.6, 0.25, [ch('rotation.z', 0.16, 0)], { ease: 'easeIn' }),
    seq(
      'sopro-sai',
      'sopro',
      9.75,
      0.35,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1)],
      { ease: 'easeOut', caption: '…e sopra com toda a força: RRÜÜ! — voa a sétima moeda de OURO: ÔR!' },
    ),
    seq(
      'moeda-voa',
      'moeda',
      9.8,
      0.55,
      [
        ch('position.x', SOPRO_X + 0.05, FLY[0]),
        ch('position.y', SOPRO_Y, FLY[1]),
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ],
      { ease: 'easeOut' },
    ),
    seq('moeda-gira', 'moeda', 10.4, 1.0, [ch('rotation.y', 0.35 - Math.PI * 2, 0.35)], {
      ease: 'easeOut',
      caption: 'Jag har bott här i sju år. — Moro aqui há sete anos.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 1.95, 4.5], target: [0.0, 1.28, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-bott-har-i-sju-ar',
    contexto:
      "Conversa sobre origem: logo depois de 'Jag kommer från Brasilien' vem 'Hur länge har du bott här?'. Troque o número.",
    fraseFonte: 'Moro aqui há sete anos.',
    fraseAlvo: 'Jag har bott här i sju år.',
    pronuncia:
      "iá rrar BÓT rrér i RRÜÜ ÔR ('har' e 'här' com o h soprado leve tipo RR carioca e R final brando; 'bott' com Ó ABERTO e CURTO, T segurado — com ô fechado e longo vira 'båt', barco; 'sju' = o sopro FORTE do 'sj', raspado e com ü de bico, longo — mais forte que o h de 'har/här'; 'år' com ô fechado)",
    ponteSonora:
      "IÁ RRÁR... BÓT' RRÉ-RI... RRÜÜ ÔR! (7 sílabas: iá-rrar-BÓT-rrér-i-RRÜÜ-ÔR; tônicas em BÓT, RRÜÜ e ÔR; IÁ RRÁR = 'eu HÁ...' — o HÁ de 'há sete anos', com o h soprado LEVE em RR carioca e R final BRANDO, o mesmo RRÁR de 'Jag har ont i magen'; BÓT' é a BOTA sem o -a, Ó ABERTO e CURTO, com o T segurado um instante (tt) — com ô fechado e longo sai 'båt' (barco); RRÉR é a HERA sem o -a com o h soprado leve, o mesmo de 'Det gör ont här', e o R dela emenda no I — o guinchinho do golfinho: RRÉ-RI; RRÜÜ é o sopro do 'sj', o MESMO de RRÜÜK ('sjuk') mas SEM o K — com K vira 'doente'; esse sopro é FORTE e raspado, com o BICO já esticado, bem mais forte que o h leve de 'har/här' — fraquinho ele vira 'hu'; ÔR é o OURO sem o -o, Ô FECHADO, o mesmo 'år' do oito-de-ouro de 'Jag har två barn')",
    historia:
      'Um golfinho mora há tanto tempo na banheira de um apartamento sueco que ele mesmo perdeu a conta: IÁ RRÁR... — eu HÁ... A galocha que alguém largou no canto no primeiro dia virou vaso: da BOTA brotou uma HERA que já subiu até o teto. E todo ano, no aniversário da mudança, ele solta um guinchinho — I! —, estica o BICO e sopra com toda a força — RRÜÜ! —, disparando uma moeda de OURO pela boca até a borda da banheira. A pilha já tem sete moedas: sete anos morando aqui.',
  },
  createScene,
  refine: { organic: ['golfinho'] },
}

export default card
