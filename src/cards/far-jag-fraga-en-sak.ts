import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Får jag fråga en sak?" — FÔ(r)-IA... FRÔ-GA... EN SÁK?
 *
 * Serenata de vila, noite de lua. Lá em cima, debruçada na grade de ferro da
 * SACADA florida (SÁK), a GAzela (GA); lá embaixo, um panda-vermelho de
 * chapéu de palha caipira com o discurso escrito numa FÔIA de bambu — a mesma
 * folha verde-limão da alface de "Ursäkta, får jag komma förbi?" (o mesmo
 * 'får jag'). Ele trava, ergue a FRÔ (a flor, à caipira) e UM dedinho (EN).
 *
 * Layout: casa amarelo-ocre à esquerda com a sacada; à direita, o muro baixo
 * do jardim, um cipreste e a lua — o panda fica recortado contra o céu da
 * noite (ruivo sobre ocre sumiria). A câmera vem de frente, levemente à
 * esquerda: o panda vira para a sacada (esquerda-fundo) sem dar as costas.
 * Paleta: pedra cinza-azulada da noite, ocre apagado, verde-garrafa nas
 * portas, ferro preto. Acento saturado (verde-limão) reservado à FÔIA.
 */

const BORDA = '#34363e'
const REJUNTE = '#43464f'
const PARALELO = ['#7a7e88', '#6b6f79', '#868890'] // paralelepípedos (tons)
const LAJE = '#9a958c'
const OCRE = '#c39649'
const OCRE_ESC = '#a87d3b'
const TIJOLO = '#9a5338'
const SOCLO = '#77706a'
const CANTARIA = '#aaa296'
const TELHA = '#9b4a33'
const TELHA_ESC = '#7f3a28'
const PORTA = '#2f5a4a'
const PORTA_ESC = '#234536'
const VIDRO = '#8fa9b4'
const LATAO = '#c9a250'
const BREU = '#191a22'
const CORTINA = '#cfc2a8'
const FERRO = '#1b1c21'
const VASO = '#a65a3c'
const GERANIO = '#cf3b3b'
const GERANIO_ESC = '#a92c30'
const FOLHAGEM = '#3e6a3a'
const MURO = '#6c707a'
const MURO_PEDRA = ['#7a7d86', '#62666f', '#727680']
const HERA = '#34573a'
const CIPRESTE = '#253f2f'
const LUA = '#f7e7a6'
const LUA_MAR = '#e3cf88'
const LAMPIAO = '#ffc46b'

const GAZELA = '#c98c55'
const GAZELA_CLARA = '#f2e8d8'
const GAZELA_ESC = '#4e3222'
const CHIFRE = '#2f2620'
const CHIFRE_ANEL = '#45382e'

const RUIVO = '#b9542b'
const RUIVO_ESC = '#7a3119'
const CREME = '#ead2a4'
const PRETO = '#221c1c'
const BRANCO = '#f5f0e6'
const RUBOR = '#f1838b'
const PALHA = '#d8b468'
const PALHA_CLARA = '#ebcf8c'
const PALHA_ESC = '#ad8843'
const FITA = '#7a3326'

const FOLHA = '#86d13b' // acento: a FÔIA (mesmo verde-limão da alface da chinchila)
const FOLHA_ESC = '#6db52c'
const FOLHA_CLARA = '#d4f09a'
const TINTA = '#16200f'
const PETALA = '#fbfaf4'
const MIOLO = '#f1b21c'
const CAULE = '#4e7f39'

const FY = 0.15 // topo dos paralelepípedos
const WZ = -0.85 // face da fachada
const WT = 0.32 // espessura da parede
const HX0 = -2.28 // casa: de HX0 até a quina HX1
const HX1 = 0.12
const WTOP = 3.0 // beiral

// sacada (centro na face da parede)
const BX = -1.0
const BY = 1.42 // piso da sacada
const BW = 1.5
const BD = 0.6
const RAIL = 0.55 // altura do corrimão sobre o piso

// gazela no lado direito da sacada (perto do panda)
const GX = -0.88
const GZ = -0.66
const GRY = 0.35
const GS = 1.0

// panda-vermelho
const PX = 0.5
const PZ = 0.28
const PRY = -0.55
const PS = 1.08
const HEAD_Y = 1.2
const HEAD_UP: [number, number] = [-0.38, -0.38] // pose final: olha a sacada (x, y)
const HEAD_LEAF: [number, number] = [0.32, 0.42] // olhando a FÔIA

const SHOULDER_R = new THREE.Vector3(-0.22, 0.93, 0.02)
const ARM_REST: [number, number, number] = [-0.12, 0, -0.18]

const LUA_POS: [number, number, number] = [1.3, 2.62, -1.95]

/** Cápsula de a até b. */
function segment(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, roughness = 0.8) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, { roughness })
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Quatérnio cujo +y aponta para `y` e cujo +z fica o mais perto possível de `zHint`. */
function basis(y: THREE.Vector3, zHint: THREE.Vector3) {
  const Y = y.clone().normalize()
  const Z = zHint.clone().addScaledVector(Y, -zHint.dot(Y)).normalize()
  const X = new THREE.Vector3().crossVectors(Y, Z)
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z))
}

/** Paralelepípedos da rua: três tons, cada tom num mesh só. */
function calcamento() {
  const g = new THREE.Group()
  const rand = rng(808)
  const porTom: THREE.BufferGeometry[][] = [[], [], []]
  const PW = 0.21
  const PD = 0.165
  for (let row = 0; row < 40; row++) {
    const z = WZ + 0.5 + row * 0.19
    if (z > 2.6) break
    const off = row % 2 ? PW / 2 + 0.012 : 0
    for (let x = -2.6 + off; x < 2.6; x += PW + 0.024) {
      if (Math.hypot(x, z) > 2.44) continue
      const w = PW * (0.9 + rand() * 0.2)
      const geo = new RoundedBoxGeometry(w, 0.05, PD * (0.92 + rand() * 0.12), 2, 0.02)
      geo.rotateY((rand() - 0.5) * 0.08)
      geo.translate(x + (rand() - 0.5) * 0.02, FY - 0.025 + (rand() - 0.5) * 0.008, z + (rand() - 0.5) * 0.02)
      porTom[Math.floor(rand() * 3)].push(geo)
    }
  }
  porTom.forEach((geos, i) => {
    if (!geos.length) return
    const merged = mergeGeometries(geos)
    for (const geo of geos) geo.dispose()
    const mesh = new THREE.Mesh(merged, mat(PARALELO[i], { roughness: 0.82, size: 0.25 }))
    mesh.castShadow = true
    mesh.receiveShadow = true
    g.add(mesh)
  })
  return g
}

/** Folha de bambu comprida, de pé no plano xy (talo na origem, ponta em +y), rabiscada. */
function foiaDeBambu() {
  const g = new THREE.Group()
  const rand = rng(31)
  const perfil: [number, number][] = [
    [0, 0.03], [0.03, 0.07], [0.075, 0.17], [0.1, 0.28], [0.098, 0.38],
    [0.078, 0.5], [0.045, 0.6], [0.016, 0.67], [0, 0.71],
  ]
  const limbo = lathe(perfil, FOLHA, { roughness: 0.45 }, 32)
  limbo.scale.z = 0.13
  g.add(limbo)
  const largura = (y: number) => {
    for (let i = 1; i < perfil.length; i++) {
      const [r0, y0] = perfil[i - 1]
      const [r1, y1] = perfil[i]
      if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
    }
    return 0
  }
  // nervura central e duas laterais, paralelas como no bambu
  const nervura = capsule(0.007, 0.62, FOLHA_CLARA, { roughness: 0.4 })
  nervura.position.set(0, 0.37, 0.009)
  g.add(nervura)
  for (const s of [-1, 1]) {
    const lateral = rbox(0.006, 0.42, 0.004, 0.002, FOLHA_ESC, { roughness: 0.45 })
    lateral.position.set(s * 0.055, 0.33, 0.009)
    lateral.rotation.z = -s * 0.04
    g.add(lateral)
  }
  const talo = capsule(0.013, 0.09, FOLHA_ESC, { roughness: 0.45 })
  talo.position.y = 0.0
  g.add(talo)

  // o discurso: linhas de garrancho em zigue-zague, tinta preta
  const linhas = [0.16, 0.235, 0.31, 0.385, 0.46, 0.535]
  linhas.forEach((y, li) => {
    const meia = largura(y) * 0.72
    const n = Math.max(3, Math.round((meia * 2) / 0.024))
    const passo = (meia * 2) / n
    for (let k = 0; k < n; k++) {
      if (li === 2 && k === n - 2) continue // respiro entre palavras
      const traco = rbox(passo * 1.25, 0.008, 0.004, 0.002, TINTA, { roughness: 0.5 })
      traco.position.set(-meia + passo * (k + 0.5), y + (rand() - 0.5) * 0.008, 0.0135)
      traco.rotation.z = (k % 2 ? 1 : -1) * (0.55 + rand() * 0.25)
      g.add(traco)
    }
  })
  // uma linha riscada de nervoso
  const risco = rbox(largura(0.31) * 1.5, 0.011, 0.004, 0.003, TINTA, { roughness: 0.5 })
  risco.position.set(0, 0.31, 0.016)
  risco.rotation.z = 0.08
  g.add(risco)
  return g
}

/** Margarida: talo em +y a partir da origem, flor no topo virada para +z. */
function margarida() {
  const g = new THREE.Group()
  const L = 0.4
  const talo = cylinder(0.011, 0.013, L, CAULE, { roughness: 0.6 }, 12)
  talo.position.y = L / 2
  g.add(talo)
  const folhinha = sphere(0.05, CAULE, { roughness: 0.6 }, 16)
  folhinha.scale.set(0.45, 1, 0.12)
  folhinha.position.set(0.035, L * 0.45, 0)
  folhinha.rotation.z = -0.7
  g.add(folhinha)

  const flor = new THREE.Group()
  flor.position.y = L + 0.01
  g.add(flor)
  const N = 16
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    const petala = capsule(0.027, 0.085, PETALA, { roughness: 0.5 })
    petala.scale.z = 0.35
    petala.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, -0.004 + (i % 2) * 0.006)
    petala.rotation.z = a - Math.PI / 2
    flor.add(petala)
  }
  const miolo = sphere(0.055, MIOLO, { roughness: 0.75 }, 20)
  miolo.scale.z = 0.55
  miolo.position.z = 0.012
  flor.add(miolo)
  const base = sphere(0.04, CAULE, { roughness: 0.6 }, 16)
  base.position.z = -0.03
  base.scale.z = 0.6
  flor.add(base)
  return g
}

/** Chapéu de palha caipira de aba desfiada (origem no apoio da copa). */
function chapeuDePalha() {
  const g = new THREE.Group()
  const rand = rng(57)
  const aba = lathe(
    [[0.15, 0.035], [0.17, 0.0], [0.3, -0.006], [0.4, -0.026], [0.43, -0.022], [0.41, 0.0], [0.3, 0.018], [0.18, 0.04]],
    PALHA,
    { roughness: 0.85 },
    48,
  )
  g.add(aba)
  const copa = lathe(
    [[0.2, 0.0], [0.205, 0.08], [0.2, 0.15], [0.18, 0.205], [0.13, 0.235], [0.06, 0.225], [0, 0.215]],
    PALHA,
    { roughness: 0.85 },
    40,
  )
  g.add(copa)
  // amassado no topo da copa
  const amassado = sphere(0.07, PALHA_ESC, { roughness: 0.85 }, 16)
  amassado.scale.set(1.6, 0.25, 0.7)
  amassado.position.y = 0.226
  g.add(amassado)
  const fita = cylinder(0.207, 0.207, 0.048, FITA, { roughness: 0.75 }, 40)
  fita.position.y = 0.05
  g.add(fita)
  // trama da palha: anéis na aba e na copa
  for (const [r, y] of [[0.24, 0.022], [0.31, 0.012], [0.37, 0.0]] as const) {
    const anel = torus(r, 0.006, PALHA_ESC, { roughness: 0.85 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = y
    g.add(anel)
  }
  for (const y of [0.11, 0.165]) {
    const anel = torus(0.198 - (y - 0.11) * 0.25, 0.006, PALHA_ESC, { roughness: 0.85 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = y
    g.add(anel)
  }
  // aba desfiada: fiapos de palha saindo da borda, com falhas
  for (let i = 0; i < 64; i++) {
    if (rand() < 0.18) continue
    const a = (i / 64) * Math.PI * 2 + (rand() - 0.5) * 0.05
    const len = 0.03 + rand() * 0.06
    const fio = capsule(0.0065, len, rand() < 0.5 ? PALHA_CLARA : PALHA_ESC, { roughness: 0.85 })
    const haste = new THREE.Group()
    haste.position.set(Math.cos(a) * 0.415, -0.018, Math.sin(a) * 0.415)
    haste.rotation.y = -a
    haste.rotation.z = -Math.PI / 2 - 0.15 - rand() * 0.25
    fio.position.y = len / 2 + 0.006
    haste.add(fio)
    g.add(haste)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(4242)

  // ---- base: rua de paralelepípedos + calçada de lajes ---------------------
  const base = new THREE.Group()
  const borda = cylinder(2.62, 2.7, 0.1, BORDA, { roughness: 0.85 })
  borda.position.y = 0.05
  base.add(borda)
  const leito = cylinder(2.56, 2.6, 0.03, REJUNTE, { roughness: 0.95 })
  leito.position.y = 0.115
  base.add(leito)
  base.add(calcamento())
  // calçada de lajes junto à casa, com meio-fio
  for (let x = HX0 + 0.04; x < HX1 - 0.1; x += 0.48) {
    const laje = rbox(0.45, 0.06, 0.4, 0.02, LAJE, { roughness: 0.8 })
    laje.position.set(x + 0.22, FY + 0.005, WZ + 0.22)
    laje.rotation.y = (rand() - 0.5) * 0.03
    base.add(laje)
  }
  const meioFio = rbox(HX1 - HX0 + 0.1, 0.07, 0.08, 0.025, CANTARIA, { roughness: 0.75 })
  meioFio.position.set((HX0 + HX1) / 2, FY + 0.01, WZ + 0.45)
  base.add(meioFio)
  // pétalas de gerânio caídas na calçada
  for (const [x, z] of [[-0.55, -0.42], [-0.32, -0.5], [-0.68, -0.33]] as const) {
    const p = sphere(0.025, GERANIO, { roughness: 0.6 }, 12)
    p.scale.set(1, 0.25, 0.8)
    p.position.set(x, FY + 0.04, z)
    base.add(p)
  }
  root.add(base)

  // ---- parede: fachada ocre, porta verde, sacada-porta, muro e cipreste ----
  const parede = new THREE.Group()
  root.add(parede)
  const LEN = HX1 - HX0
  const CX = (HX0 + HX1) / 2
  const fachada = rbox(LEN, WTOP - FY, WT, 0.02, OCRE, { roughness: 0.9 })
  fachada.position.set(CX, (WTOP + FY) / 2, WZ - WT / 2)
  parede.add(fachada)
  const soclo = rbox(LEN + 0.03, 0.34, WT + 0.05, 0.02, SOCLO, { roughness: 0.85 })
  soclo.position.set(CX, FY + 0.17, WZ - WT / 2 + 0.025)
  parede.add(soclo)
  const cornija = rbox(LEN + 0.1, 0.1, WT + 0.14, 0.03, CANTARIA, { roughness: 0.75 })
  cornija.position.set(CX, WTOP - 0.02, WZ - WT / 2 + 0.07)
  parede.add(cornija)
  // telhas capa-canal: pontas redondas no beiral
  for (let x = HX0 + 0.02; x < HX1 + 0.04; x += 0.13) {
    const telha = cylinder(0.062, 0.062, 0.42, rand() < 0.5 ? TELHA : TELHA_ESC, { roughness: 0.7 }, 14)
    telha.rotation.x = Math.PI / 2
    telha.position.set(x, WTOP + 0.075, WZ - 0.1)
    parede.add(telha)
  }
  // cunhais de pedra na quina
  for (let i = 0; i < 11; i++) {
    const largo = i % 2 === 0
    const y = FY + 0.48 + i * 0.22
    if (y > WTOP - 0.15) break
    const pedra = rbox(largo ? 0.3 : 0.2, 0.19, WT + 0.03, 0.025, CANTARIA, { roughness: 0.8 })
    pedra.position.set(HX1 - (largo ? 0.14 : 0.09), y, WZ - WT / 2 + 0.012)
    parede.add(pedra)
  }
  // reboco descascado mostrando tijolos
  for (const [x, y, n] of [[-1.95, 0.85, 3], [-1.98, 2.62, 2]] as const) {
    const falha = rbox(0.32, 0.2, 0.012, 0.02, OCRE_ESC, { roughness: 0.95 })
    falha.position.set(x, y, WZ + 0.002)
    parede.add(falha)
    for (let k = 0; k < n; k++) {
      const tij = rbox(0.11, 0.045, 0.02, 0.008, TIJOLO, { roughness: 0.9 })
      tij.position.set(x - 0.08 + k * 0.08 + (k % 2) * 0.02, y - 0.05 + (k % 2) * 0.06, WZ + 0.008)
      parede.add(tij)
    }
  }

  // porta verde do térreo (embaixo da sacada)
  const PH = 1.06
  const portaT = rbox(0.6, PH, 0.06, 0.02, PORTA, { roughness: 0.6 })
  portaT.position.set(BX, FY + PH / 2, WZ - 0.005)
  parede.add(portaT)
  for (const [y, h] of [[FY + 0.3, 0.36], [FY + 0.78, 0.4]] as const) {
    for (const s of [-1, 1]) {
      const almofada = rbox(0.2, h, 0.03, 0.015, PORTA_ESC, { roughness: 0.6 })
      almofada.position.set(BX + s * 0.13, y, WZ + 0.03)
      parede.add(almofada)
    }
  }
  const macaneta = sphere(0.03, LATAO, { roughness: 0.3, metalness: 0.8 }, 16)
  macaneta.position.set(BX + 0.21, FY + 0.55, WZ + 0.05)
  parede.add(macaneta)
  for (const s of [-1, 1]) {
    const umbral = rbox(0.09, PH + 0.06, 0.06, 0.02, CANTARIA, { roughness: 0.8 })
    umbral.position.set(BX + s * 0.345, FY + (PH + 0.06) / 2, WZ + 0.01)
    parede.add(umbral)
  }
  const degrau = rbox(0.86, 0.07, 0.24, 0.02, CANTARIA, { roughness: 0.8 })
  degrau.position.set(BX, FY + 0.05, WZ + 0.12)
  parede.add(degrau)

  // porta da sacada: vão escuro, folhas abertas, cortina
  const DH = 1.12
  const vao = rbox(0.62, DH, 0.04, 0.01, BREU, { roughness: 0.9 })
  vao.position.set(BX, BY + DH / 2, WZ - 0.01)
  parede.add(vao)
  const cortina = new THREE.Group()
  cortina.position.set(BX - 0.18, BY + DH / 2, WZ + 0.02)
  for (let k = 0; k < 3; k++) {
    const dobra = capsule(0.035, DH - 0.12, CORTINA, { roughness: 0.9 })
    dobra.position.x = k * 0.055
    dobra.scale.z = 0.6
    cortina.add(dobra)
  }
  parede.add(cortina)
  for (const s of [-1, 1]) {
    const folha = rbox(0.3, DH - 0.04, 0.04, 0.015, PORTA, { roughness: 0.6 })
    folha.position.set(BX + s * 0.49, BY + DH / 2, WZ + 0.03)
    parede.add(folha)
    for (const y of [0.3, 0.62, 0.9]) {
      const vidro = rbox(0.2, 0.22, 0.012, 0.01, VIDRO, { roughness: 0.2, metalness: 0.2 })
      vidro.position.set(BX + s * 0.49, BY + y, WZ + 0.055)
      parede.add(vidro)
    }
    const ombreira = rbox(0.08, DH + 0.08, 0.06, 0.02, CANTARIA, { roughness: 0.8 })
    ombreira.position.set(BX + s * 0.35, BY + (DH + 0.08) / 2, WZ + 0.01)
    parede.add(ombreira)
  }
  const verga = rbox(0.86, 0.12, 0.08, 0.03, CANTARIA, { roughness: 0.8 })
  verga.position.set(BX, BY + DH + 0.08, WZ + 0.02)
  parede.add(verga)

  // lampião de parede, aceso
  const lampiao = new THREE.Group()
  lampiao.position.set(-1.98, 1.95, WZ)
  parede.add(lampiao)
  const suporte = rbox(0.03, 0.03, 0.22, 0.01, FERRO, { roughness: 0.4, metalness: 0.6 })
  suporte.position.set(0, 0.16, 0.11)
  lampiao.add(suporte)
  const chapeuLamp = cone(0.1, 0.09, FERRO, { roughness: 0.4, metalness: 0.6 }, 4)
  chapeuLamp.position.set(0, 0.16, 0.22)
  chapeuLamp.rotation.y = Math.PI / 4
  lampiao.add(chapeuLamp)
  const vidroLamp = cylinder(0.055, 0.045, 0.16, LAMPIAO, { emissive: LAMPIAO, emissiveIntensity: 1.4 }, 4)
  vidroLamp.position.set(0, 0.04, 0.22)
  vidroLamp.rotation.y = Math.PI / 4
  lampiao.add(vidroLamp)
  const fundoLamp = cylinder(0.05, 0.03, 0.04, FERRO, { roughness: 0.4, metalness: 0.6 }, 4)
  fundoLamp.position.set(0, -0.06, 0.22)
  fundoLamp.rotation.y = Math.PI / 4
  lampiao.add(fundoLamp)

  // muro baixo do jardim, à direita da quina
  const MX0 = HX1
  const MX1 = 2.22
  const MH = 0.82
  const muro = rbox(MX1 - MX0, MH, 0.3, 0.03, MURO, { roughness: 0.9 })
  muro.position.set((MX0 + MX1) / 2, FY + MH / 2, WZ - 0.2)
  parede.add(muro)
  const capa = rbox(MX1 - MX0 + 0.06, 0.08, 0.38, 0.03, CANTARIA, { roughness: 0.8 })
  capa.position.set((MX0 + MX1) / 2, FY + MH + 0.03, WZ - 0.2)
  parede.add(capa)
  for (let i = 0; i < 22; i++) {
    const w = 0.16 + rand() * 0.12
    const h = 0.1 + rand() * 0.07
    const x = MX0 + 0.12 + rand() * (MX1 - MX0 - 0.24)
    const y = FY + 0.1 + rand() * (MH - 0.2)
    const pedra = rbox(w, h, 0.04, 0.02, MURO_PEDRA[i % 3], { roughness: 0.9 })
    pedra.position.set(x, y, WZ - 0.05 + 0.005)
    parede.add(pedra)
  }
  for (const [x, s] of [[0.36, 0.16]] as const) {
    const hera = puff(s, HERA, 6, Math.round(x * 100), { roughness: 0.9 })
    hera.scale.set(1.4, 0.8, 0.7)
    hera.position.set(x, FY + MH + 0.05, WZ - 0.1)
    parede.add(hera)
    const cascata = puff(s * 0.7, HERA, 4, Math.round(x * 100) + 1, { roughness: 0.9 })
    cascata.scale.set(0.9, 1.3, 0.5)
    cascata.position.set(x + 0.08, FY + MH - 0.2, WZ - 0.02)
    parede.add(cascata)
  }
  // cipreste atrás do muro
  const cipreste = lathe(
    [[0, 0], [0.12, 0.05], [0.26, 0.4], [0.3, 0.8], [0.26, 1.25], [0.16, 1.7], [0.05, 2.0], [0, 2.08]],
    CIPRESTE,
    { roughness: 0.9 },
    20,
  )
  cipreste.position.set(1.95, FY, -1.5)
  parede.add(cipreste)

  // ---- lua cheia --------------------------------------------------------------
  const lua = new THREE.Group()
  lua.position.set(...LUA_POS)
  root.add(lua)
  const disco = sphere(0.33, LUA, { emissive: LUA, emissiveIntensity: 1.05 }, 40)
  lua.add(disco)
  for (const [x, y, r] of [[-0.1, 0.1, 0.07], [0.12, -0.05, 0.05], [0.02, -0.15, 0.04], [-0.14, -0.1, 0.035]] as const) {
    const mar = sphere(r, LUA_MAR, { emissive: LUA_MAR, emissiveIntensity: 0.85 }, 16)
    mar.scale.z = 0.3
    mar.position.set(x, y, Math.sqrt(Math.max(0, 0.33 * 0.33 - x * x - y * y)) - 0.004)
    lua.add(mar)
  }

  // ---- sacada: laje, mísulas, grade de ferro, floreira de gerânios -----------
  const sacada = new THREE.Group()
  sacada.position.set(BX, BY, WZ)
  root.add(sacada)
  const laje = rbox(BW, 0.1, BD, 0.03, CANTARIA, { roughness: 0.75 })
  laje.position.set(0, -0.05, BD / 2)
  sacada.add(laje)
  const friso = rbox(BW + 0.04, 0.04, 0.05, 0.015, LAJE, { roughness: 0.75 })
  friso.position.set(0, -0.11, BD - 0.02)
  sacada.add(friso)
  for (const s of [-1, 1]) {
    for (const [w, h, d, y] of [[0.16, 0.08, 0.46, -0.14], [0.13, 0.09, 0.32, -0.225], [0.1, 0.09, 0.18, -0.31]] as const) {
      const misula = rbox(w, h, d, 0.025, CANTARIA, { roughness: 0.8 })
      misula.position.set(s * 0.55, y, d / 2)
      sacada.add(misula)
    }
  }
  const ferro = { roughness: 0.45, metalness: 0.6 }
  const FZ = BD - 0.03
  const SXr = BW / 2 - 0.03
  // corrimão e barra de baixo: frente e laterais
  for (const [y, r] of [[RAIL, 0.024], [0.07, 0.015], [RAIL - 0.12, 0.012]] as const) {
    const frente = cylinder(r, r, BW - 0.06, FERRO, ferro, 12)
    frente.rotation.z = Math.PI / 2
    frente.position.set(0, y, FZ)
    sacada.add(frente)
    for (const s of [-1, 1]) {
      const lado = cylinder(r, r, FZ, FERRO, ferro, 12)
      lado.rotation.x = Math.PI / 2
      lado.position.set(s * SXr, y, FZ / 2)
      sacada.add(lado)
    }
  }
  for (const s of [-1, 1]) {
    const poste = cylinder(0.028, 0.028, RAIL, FERRO, ferro, 12)
    poste.position.set(s * SXr, RAIL / 2, FZ)
    sacada.add(poste)
    const pinha = sphere(0.042, FERRO, ferro, 16)
    pinha.position.set(s * SXr, RAIL + 0.035, FZ)
    sacada.add(pinha)
  }
  for (let x = -SXr + 0.1; x < SXr - 0.05; x += 0.1) {
    const barra = cylinder(0.011, 0.011, RAIL - 0.2, FERRO, ferro, 8)
    barra.position.set(x, 0.07 + (RAIL - 0.2) / 2, FZ)
    sacada.add(barra)
    const voluta = torus(0.045, 0.008, FERRO, ferro)
    voluta.position.set(x - 0.05, RAIL - 0.06, FZ)
    sacada.add(voluta)
  }
  for (const s of [-1, 1]) {
    for (let z = 0.1; z < FZ - 0.05; z += 0.1) {
      const barra = cylinder(0.011, 0.011, RAIL - 0.2, FERRO, ferro, 8)
      barra.position.set(s * SXr, 0.07 + (RAIL - 0.2) / 2, z)
      sacada.add(barra)
    }
  }
  // floreira pendurada por fora da grade, no lado esquerdo
  const floreira = new THREE.Group()
  floreira.position.set(-0.36, RAIL - 0.08, FZ + 0.1)
  sacada.add(floreira)
  const caixa = rbox(0.56, 0.16, 0.16, 0.03, VASO, { roughness: 0.7 })
  floreira.add(caixa)
  const borda2 = rbox(0.6, 0.03, 0.19, 0.012, '#8e4a30', { roughness: 0.7 })
  borda2.position.y = 0.08
  floreira.add(borda2)
  for (const s of [-1, 1]) {
    const gancho = torus(0.04, 0.008, FERRO, ferro)
    gancho.rotation.y = Math.PI / 2
    gancho.position.set(s * 0.2, 0.08, -0.08)
    floreira.add(gancho)
  }
  for (let i = 0; i < 6; i++) {
    const x = -0.22 + i * 0.088
    const folhas = puff(0.07, FOLHAGEM, 4, 70 + i, { roughness: 0.85 })
    folhas.scale.set(1, 0.6, 0.9)
    folhas.position.set(x, 0.1, (i % 2) * 0.03 - 0.01)
    floreira.add(folhas)
  }
  for (let i = 0; i < 5; i++) {
    const x = -0.2 + i * 0.1
    const buque = puff(0.042, i % 2 ? GERANIO : GERANIO_ESC, 5, 90 + i, { roughness: 0.6 })
    buque.position.set(x, 0.19 + (i % 2) * 0.05, 0.01 + (i % 3) * 0.02)
    floreira.add(buque)
  }

  // ---- gazela debruçada na grade -----------------------------------------------
  const gazela = new THREE.Group()
  gazela.position.set(GX, BY, GZ)
  gazela.rotation.y = GRY
  gazela.scale.setScalar(GS)
  root.add(gazela)
  const pelo = { roughness: 0.8 }
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  // patas traseiras em pé no piso da sacada (atrás da grade)
  for (const s of [-1, 1]) {
    gazela.add(segment(V(s * 0.08, 0.5, -0.2), V(s * 0.08, 0.06, -0.12), 0.042, GAZELA))
    const casco = sphere(0.04, GAZELA_ESC, pelo, 16)
    casco.scale.set(0.9, 0.7, 1.2)
    casco.position.set(s * 0.08, 0.03, -0.1)
    gazela.add(casco)
  }
  const anca = sphere(0.17, GAZELA, pelo)
  anca.scale.set(1.05, 1.1, 1.05)
  anca.position.set(0, 0.56, -0.18)
  gazela.add(anca)
  // tronco inclinado para a frente, peito apoiado sobre a grade
  gazela.add(segment(V(0, 0.6, -0.12), V(0, 0.8, 0.2), 0.15, GAZELA))
  const peito = sphere(0.155, GAZELA, pelo)
  peito.position.set(0, 0.82, 0.24)
  gazela.add(peito)
  gazela.add(segment(V(0, 0.52, -0.06), V(0, 0.7, 0.26), 0.1, GAZELA_CLARA))
  for (const s of [-1, 1]) {
    gazela.add(segment(V(s * 0.138, 0.6, -0.1), V(s * 0.138, 0.77, 0.2), 0.028, GAZELA_ESC))
  }
  const rabicho = capsule(0.025, 0.08, GAZELA_ESC, pelo)
  rabicho.position.set(0, 0.62, -0.35)
  rabicho.rotation.x = -0.4
  gazela.add(rabicho)
  // patas da frente apoiadas no corrimão, cascos pendendo por fora
  for (const s of [-1, 1]) {
    const ombro = V(s * 0.1, 0.8, 0.26)
    const cotovelo = V(s * 0.11, 0.6, 0.42)
    const pulso = V(s * 0.08, 0.6, 0.5)
    const casco = V(s * 0.08, 0.46, 0.53)
    gazela.add(segment(ombro, cotovelo, 0.045, GAZELA))
    gazela.add(segment(cotovelo, pulso, 0.038, GAZELA))
    gazela.add(segment(pulso, casco, 0.033, GAZELA))
    const ponta = sphere(0.036, GAZELA_ESC, pelo, 16)
    ponta.scale.set(0.9, 1.1, 0.9)
    ponta.position.copy(casco)
    gazela.add(ponta)
  }
  // pescoço longo esticado por cima da grade, curvado para o panda
  gazela.add(segment(V(0, 0.88, 0.28), V(0.05, 1.07, 0.48), 0.068, GAZELA))
  gazela.add(segment(V(0, 0.84, 0.31), V(0.05, 1.02, 0.47), 0.045, GAZELA_CLARA))

  // cabeça (sem peça própria: funde com o corpo; os chifres são peça à parte)
  const cabecaG = new THREE.Group()
  cabecaG.position.set(0.06, 1.12, 0.53)
  cabecaG.rotation.set(0.55, 0.4, 0.1)
  cabecaG.scale.setScalar(1.15)
  gazela.add(cabecaG)
  const cranioG = sphere(0.105, GAZELA, pelo)
  cranioG.scale.set(0.88, 0.95, 1.1)
  cabecaG.add(cranioG)
  const fuca = capsule(0.062, 0.12, GAZELA, pelo)
  fuca.rotation.x = Math.PI / 2 + 0.35
  fuca.position.set(0, -0.045, 0.1)
  cabecaG.add(fuca)
  const pontaFuca = sphere(0.055, GAZELA_CLARA, pelo, 20)
  pontaFuca.scale.set(1, 0.85, 1)
  pontaFuca.position.set(0, -0.09, 0.19)
  cabecaG.add(pontaFuca)
  const narizG = sphere(0.026, GAZELA_ESC, { roughness: 0.35 }, 16)
  narizG.scale.set(1.4, 0.8, 0.8)
  narizG.position.set(0, -0.08, 0.235)
  cabecaG.add(narizG)
  for (const s of [-1, 1]) {
    // olhos grandes, pretos e brilhantes, com cílios longos
    const olho = sphere(0.036, '#120d0b', { roughness: 0.12 }, 20)
    olho.scale.set(0.9, 1.05, 0.7)
    olho.position.set(s * 0.072, 0.03, 0.06)
    cabecaG.add(olho)
    const brilho = sphere(0.011, '#ffffff', { roughness: 0.2, emissive: '#ffffff', emissiveIntensity: 0.6 }, 10)
    brilho.position.set(s * 0.08 + 0.008, 0.045, 0.087)
    cabecaG.add(brilho)
    for (let k = 0; k < 3; k++) {
      const cilio = rbox(0.006, 0.03, 0.006, 0.002, '#120d0b', { roughness: 0.5 })
      cilio.position.set(s * (0.075 + k * 0.012), 0.066, 0.06 + 0.012)
      cilio.rotation.z = -s * (0.3 + k * 0.35)
      cilio.rotation.x = -0.3
      cabecaG.add(cilio)
    }
    // orelhas em folha
    const orelha = new THREE.Group()
    orelha.position.set(s * 0.075, 0.07, -0.04)
    orelha.rotation.set(-0.2, s * 0.3, -s * 0.95)
    cabecaG.add(orelha)
    const aba = sphere(0.06, GAZELA, pelo, 20)
    aba.scale.set(0.6, 1.6, 0.3)
    aba.position.y = 0.08
    orelha.add(aba)
    const dentro = sphere(0.045, GAZELA_CLARA, pelo, 16)
    dentro.scale.set(0.55, 1.45, 0.2)
    dentro.position.set(0, 0.08, 0.012)
    orelha.add(dentro)
  }

  // ---- chifres em lira, anelados (peça própria: finos demais para fundir) ---
  const chifres = new THREE.Group()
  chifres.position.set(0, 0.075, -0.025)
  cabecaG.add(chifres)
  for (const s of [-1, 1]) {
    const pts = [
      [0.03, 0, 0], [0.055, 0.08, -0.035], [0.088, 0.16, -0.06], [0.096, 0.24, -0.05],
      [0.08, 0.31, -0.015], [0.088, 0.36, 0.03],
    ].map(([x, y, z]) => new THREE.Vector3(s * x, y, z))
    for (let i = 0; i < pts.length - 1; i++) {
      const r = 0.021 - i * 0.0027
      chifres.add(segment(pts[i], pts[i + 1], r, CHIFRE, 0.5))
      if (i < 4) {
        for (const t of [0.35, 0.75]) {
          const anel = torus(r * 1.05, r * 0.32, CHIFRE_ANEL, { roughness: 0.5 })
          anel.position.copy(pts[i]).lerp(pts[i + 1], t)
          anel.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3().subVectors(pts[i + 1], pts[i]).normalize(),
          )
          chifres.add(anel)
        }
      }
    }
  }

  // ---- PANDA-VERMELHO em pé nas patas traseiras --------------------------------
  const panda = new THREE.Group()
  panda.position.set(PX, FY, PZ)
  panda.rotation.y = PRY
  panda.scale.setScalar(PS)
  root.add(panda)
  const fofo = { roughness: 0.85 }
  for (const s of [-1, 1]) {
    const pe = sphere(0.1, PRETO, fofo)
    pe.scale.set(0.85, 0.5, 1.35)
    pe.position.set(s * 0.14, 0.045, 0.07)
    panda.add(pe)
    const perna = capsule(0.105, 0.16, PRETO, fofo)
    perna.position.set(s * 0.14, 0.22, 0)
    panda.add(perna)
  }
  const quadril = sphere(0.3, RUIVO, fofo)
  quadril.scale.set(1, 0.92, 0.9)
  quadril.position.set(0, 0.45, -0.03)
  panda.add(quadril)
  const troncoP = capsule(0.235, 0.3, RUIVO, fofo)
  troncoP.position.set(0, 0.78, 0)
  panda.add(troncoP)
  // frente toda preta, do peito à barriga, como no panda-vermelho de verdade
  const frente = sphere(0.27, PRETO, fofo)
  frente.scale.set(0.8, 1.6, 0.68)
  frente.position.set(0, 0.64, 0.1)
  panda.add(frente)
  // braço esquerdo segurando a FÔIA
  const ombroE = new THREE.Vector3(0.22, 0.93, 0.02)
  const maoE = new THREE.Vector3(0.31, 0.66, 0.27)
  panda.add(segment(ombroE, maoE, 0.075, PRETO))
  const pataE = sphere(0.085, PRETO, fofo)
  pataE.position.copy(maoE)
  panda.add(pataE)
  // rabo grosso de anéis ruivos e creme, curvado pro lado
  const caminho = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.36, -0.24), new THREE.Vector3(0.24, 0.28, -0.4),
    new THREE.Vector3(0.48, 0.3, -0.4), new THREE.Vector3(0.66, 0.44, -0.27),
    new THREE.Vector3(0.74, 0.64, -0.12), new THREE.Vector3(0.72, 0.85, -0.02),
    new THREE.Vector3(0.64, 1.0, 0.03),
  ])
  const NR = 18
  for (let i = 0; i <= NR; i++) {
    const t = i / NR
    const p = caminho.getPoint(t)
    const r = 0.135 - t * 0.05
    const anel = Math.floor(t * 9) % 2 === 0
    const bola = sphere(r, anel ? RUIVO : CREME, fofo, 20)
    bola.position.copy(p)
    panda.add(bola)
  }

  // ---- cabeça do panda ----------------------------------------------------------
  const cabecaP = new THREE.Group()
  cabecaP.position.set(0, HEAD_Y, 0.03)
  cabecaP.rotation.set(HEAD_UP[0], HEAD_UP[1], 0)
  panda.add(cabecaP)
  const cranioP = sphere(0.27, RUIVO, fofo)
  cranioP.scale.set(1.12, 0.95, 0.95)
  cabecaP.add(cranioP)
  const focinho = sphere(0.12, BRANCO, fofo)
  focinho.scale.set(1.25, 0.85, 0.95)
  focinho.position.set(0, -0.09, 0.19)
  cabecaP.add(focinho)
  const nariz = sphere(0.042, PRETO, { roughness: 0.35 }, 20)
  nariz.scale.set(1.3, 0.9, 0.9)
  nariz.position.set(0, -0.05, 0.3)
  cabecaP.add(nariz)
  const boca = sphere(0.03, '#3a1717', { roughness: 0.6 }, 16)
  boca.scale.set(1.2, 0.75, 0.5)
  boca.position.set(0, -0.15, 0.28)
  cabecaP.add(boca)
  for (const s of [-1, 1]) {
    const bochecha = sphere(0.1, BRANCO, fofo)
    bochecha.scale.set(1, 0.85, 0.8)
    bochecha.position.set(s * 0.15, -0.07, 0.17)
    cabecaP.add(bochecha)
    const sobrancelha = sphere(0.045, BRANCO, fofo, 16)
    sobrancelha.scale.set(1.4, 0.7, 0.5)
    sobrancelha.position.set(s * 0.1, 0.12, 0.235)
    sobrancelha.rotation.z = -s * 0.35
    cabecaP.add(sobrancelha)
    const olho = sphere(0.042, '#140f0f', { roughness: 0.15 }, 20)
    olho.scale.z = 0.6
    olho.position.set(s * 0.095, 0.04, 0.235)
    cabecaP.add(olho)
    const brilho = sphere(0.013, '#ffffff', { roughness: 0.2, emissive: '#ffffff', emissiveIntensity: 0.6 }, 10)
    brilho.position.set(s * 0.095 + 0.012, 0.056, 0.262)
    cabecaP.add(brilho)
    const lagrima = capsule(0.017, 0.07, RUIVO_ESC, fofo)
    lagrima.position.set(s * 0.115, -0.04, 0.228)
    lagrima.rotation.z = s * 0.25
    cabecaP.add(lagrima)
    // orelhas pontudas de borda branca, espremidas sob a aba do chapéu
    const orelha = new THREE.Group()
    orelha.position.set(s * 0.22, 0.12, -0.03)
    orelha.rotation.set(0, s * 0.2, -s * 1.12)
    cabecaP.add(orelha)
    const borda = cone(0.1, 0.2, BRANCO, fofo, 20)
    borda.scale.z = 0.42
    borda.position.y = 0.08
    orelha.add(borda)
    const miolo = cone(0.07, 0.15, RUIVO_ESC, fofo, 20)
    miolo.scale.z = 0.4
    miolo.position.set(0, 0.065, 0.018)
    orelha.add(miolo)
  }

  // ---- bochechas coradas (aparecem no SÁK) ----------------------------------------
  const bochechas = new THREE.Group()
  cabecaP.add(bochechas)
  for (const s of [-1, 1]) {
    const rubor = sphere(0.05, RUBOR, { roughness: 0.6 }, 20)
    rubor.scale.set(1.3, 0.8, 0.45)
    rubor.position.set(s * 0.17, -0.075, 0.245)
    rubor.rotation.y = s * 0.55
    bochechas.add(rubor)
  }

  // ---- chapéu de palha caipira -------------------------------------------------
  const chapeu = chapeuDePalha()
  chapeu.position.set(0, 0.19, -0.01)
  chapeu.rotation.set(-0.14, 0, 0.08)
  cabecaP.add(chapeu)

  // ---- braço direito: ergue a FRÔ pra sacada ------------------------------------
  const bracoD = new THREE.Group()
  bracoD.position.copy(SHOULDER_R)
  panda.add(bracoD)
  const antebraco = capsule(0.075, 0.34, PRETO, fofo)
  antebraco.position.y = -0.2
  bracoD.add(antebraco)
  const pataD = sphere(0.088, PRETO, fofo)
  pataD.position.y = -0.44
  bracoD.add(pataD)

  // direção do braço (no espaço do panda): pra cima, pro lado da sacada
  const qPanda = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), PRY)
  const dirBraco = new THREE.Vector3(-0.62, 0.74, 0.18).normalize()
  const qBraco = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirBraco)
  const eBraco = new THREE.Euler().setFromQuaternion(qBraco)
  bracoD.rotation.copy(eBraco)
  const qBracoMundo = qPanda.clone().multiply(qBraco)
  const invBraco = qBracoMundo.clone().invert()
  const paraCamera = new THREE.Vector3(-0.1, 0.15, 1).normalize()

  // margarida na pata, talo seguindo o braço, flor virada para câmera e gazela
  const flor = margarida()
  flor.position.set(0, -0.47, 0.0)
  const dirBracoMundo = dirBraco.clone().applyQuaternion(qPanda)
  const taloMundo = dirBracoMundo.clone().add(new THREE.Vector3(-0.35, 0, 0))
  const faceMundo = paraCamera.clone().add(new THREE.Vector3(-0.6, 0.2, -0.3))
  flor.quaternion.copy(invBraco.clone().multiply(basis(taloMundo, faceMundo)))
  bracoD.add(flor)

  // UM dedinho erguido na pata (EN)
  const cimaLocal = new THREE.Vector3(0.05, 1, 0.2).normalize().applyQuaternion(invBraco)
  const dedoBase = new THREE.Group()
  dedoBase.position.set(0, -0.44, 0).addScaledVector(cimaLocal, 0.06)
  dedoBase.quaternion.copy(invBraco.clone().multiply(basis(new THREE.Vector3(0.05, 1, 0.2), paraCamera)))
  bracoD.add(dedoBase)
  const dedinho = new THREE.Group()
  dedoBase.add(dedinho)
  const dedo = capsule(0.034, 0.12, PRETO, fofo)
  dedo.position.y = 0.09
  dedinho.add(dedo)
  const unha = sphere(0.02, '#5a4a48', { roughness: 0.4 }, 12)
  unha.position.set(0, 0.18, 0.014)
  dedinho.add(unha)

  // ---- a FÔIA de bambu na pata esquerda ------------------------------------------
  const foia = foiaDeBambu()
  foia.position.copy(maoE).add(new THREE.Vector3(0.02, -0.02, 0.04))
  const foiaMundo = basis(new THREE.Vector3(0.75, 0.5, 0.2), paraCamera)
  foia.quaternion.copy(qPanda.clone().invert().multiply(foiaMundo))
  panda.add(foia)
  const FOIA_RZ = foia.rotation.z

  // ---- peças ------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'rua', object: base },
    { name: 'parede', group: 'rua', object: parede },
    { name: 'lua', group: 'rua', object: lua },
    { name: 'sacada', group: 'sacada', object: sacada },
    { name: 'gazela', group: 'gazela', object: gazela },
    { name: 'chifres', group: 'gazela', object: chifres },
    { name: 'panda', group: 'panda', object: panda },
    { name: 'cabecaPanda', group: 'panda', object: cabecaP },
    { name: 'chapeu', group: 'panda', object: chapeu },
    { name: 'foia', group: 'foia', object: foia },
    { name: 'bracoD', group: 'fro', object: bracoD },
    { name: 'margarida', group: 'fro', object: flor },
    { name: 'dedinho', group: 'en', object: dedinho },
    { name: 'bochechas', group: 'sak', object: bochechas },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const er = eBraco

  // ---- montagem ---------------------------------------------------------------
  const build = [
    seq('base-sobe', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Noite de lua numa vila: brota a rua de pedra, a casa amarelo-ocre e o muro do jardim.',
    }),
    seq('parede-sobe', 'parede', 0.3, 1.0, [riseFrom(0, 3.4)], { ease: 'easeOut' }),
    seq('lua-nasce', 'lua', 0.7, 1.3, [ch('position.y', LUA_POS[1] - 1.1, LUA_POS[1]), ...s3(0.3, 1)], {
      ease: 'easeOut',
    }),

    seq('sacada-brota', 'sacada', 2.0, 0.75, [ch('scale.z', 0.02, 1), ch('scale.x', 0.7, 1), ch('scale.y', 0.7, 1)], {
      ease: 'easeOut',
      caption: 'Lá em cima, uma SACADA florida: grade de ferro preta e gerânios vermelhos…',
    }),

    // sai pela porta da sacada (cascos por cima da grade) e se debruça
    seq('gazela-sai', 'gazela', 3.2, 0.65, [
      ch('position.z', GZ - 0.55, GZ), ch('position.y', BY, BY + 0.16), ch('rotation.x', -0.25, -0.1),
    ], {
      ease: 'easeOut',
      caption: '…e, debruçada na grade, a GAzela mais elegante da rua.',
    }),
    seq('gazela-debruca', 'gazela', 3.85, 0.35, [
      ch('position.y', BY + 0.16, BY), ch('rotation.x', -0.1, 0),
    ], { ease: 'easeInOut' }),
    seq('chifres-crescem', 'chifres', 3.6, 0.5, s3(0.01, 1), { ease: 'easeOut' }),

    seq('panda-sobe', 'panda', 4.9, 0.9, [riseFrom(FY, 1.9)], {
      ease: 'easeOut',
      caption: 'Lá embaixo, um panda-vermelho de chapéu de palha caipira veio fazer a pergunta da vida dele.',
    }),
    seq('cabeca-olha', 'cabecaPanda', 4.9, 0.9, [
      ch('rotation.x', 0.05, 0.05), ch('rotation.y', 0.25, 0.25),
    ]),
    seq('braco-repousa', 'bracoD', 4.9, 0.9, [
      ch('rotation.x', ARM_REST[0], ARM_REST[0]), ch('rotation.y', ARM_REST[1], ARM_REST[1]),
      ch('rotation.z', ARM_REST[2], ARM_REST[2]),
    ]),
    seq('chapeu-cai', 'chapeu', 5.5, 0.55, [
      ch('position.y', 0.75, 0.19), ch('rotation.z', 0.6, 0.08),
    ], { ease: 'easeIn' }),

    // FÔIA: o discurso escrito na folha
    seq('foia-abre', 'foia', 6.6, 0.5, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Passou a semana escrevendo o discurso numa FÔIA de bambu — mas, na hora H, olha a FÔIA e trava: FÔ-r\'IA…',
    }),
    seq('cabeca-le', 'cabecaPanda', 6.6, 0.5, [
      ch('rotation.x', 0.05, HEAD_LEAF[0]), ch('rotation.y', 0.25, HEAD_LEAF[1]),
    ], { ease: 'easeOut' }),
    seq('foia-treme-1', 'foia', 7.2, 0.18, [ch('rotation.z', FOIA_RZ, FOIA_RZ + 0.12)]),
    seq('foia-treme-2', 'foia', 7.38, 0.18, [ch('rotation.z', FOIA_RZ + 0.12, FOIA_RZ - 0.1)]),
    seq('foia-treme-3', 'foia', 7.56, 0.2, [ch('rotation.z', FOIA_RZ - 0.1, FOIA_RZ)]),

    // FRÔ... GA...
    seq('braco-ergue', 'bracoD', 8.5, 0.8, [
      ch('rotation.x', ARM_REST[0], er.x), ch('rotation.y', ARM_REST[1], er.y), ch('rotation.z', ARM_REST[2], er.z),
    ], {
      ease: 'easeOut',
      caption: 'Sem saber o que fazer, estende a FRÔ lá pro alto, pra GAzela: FRÔ… GA…',
    }),
    seq('margarida-abre', 'margarida', 8.6, 0.6, s3(0.01, 1), { ease: 'easeOut' }),
    seq('cabeca-sobe', 'cabecaPanda', 8.55, 0.7, [
      ch('rotation.x', HEAD_LEAF[0], HEAD_UP[0]), ch('rotation.y', HEAD_LEAF[1], HEAD_UP[1]),
    ], { ease: 'easeInOut' }),

    // EN...
    seq('dedinho-ergue', 'dedinho', 10.0, 0.4, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Ergue UM dedinho trêmulo — EN…',
    }),
    seq('dedinho-treme-1', 'dedinho', 10.45, 0.16, [ch('rotation.z', 0, 0.2)]),
    seq('dedinho-treme-2', 'dedinho', 10.61, 0.16, [ch('rotation.z', 0.2, -0.18)]),
    seq('dedinho-treme-3', 'dedinho', 10.77, 0.18, [ch('rotation.z', -0.18, 0)]),

    // SÁK...?
    seq('bochechas-coram', 'bochechas', 11.6, 0.5, s3(0.01, 1), {
      ease: 'easeOut',
      caption: '…e trava, mais vermelho que nunca, olhando a SACADA: SÁK…?',
    }),

    seq('margarida-oferece', 'margarida', 13.0, 0.25, s3(1, 1.15), {
      ease: 'easeOut',
      caption: 'Får jag fråga en sak? — Posso perguntar uma coisa?',
    }),
    seq('margarida-volta', 'margarida', 13.25, 0.3, s3(1.15, 1), { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.3, 2.0, 5.45], target: [-0.22, 1.6, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'far-jag-fraga-en-sak',
    contexto:
      "Abordando alguém: antes de parar um desconhecido na rua, no ponto de ônibus ou na loja; antes de interromper um colega concentrado; ao bater na porta do vizinho. O sueco valoriza não invadir o espaço alheio, e pedir licença pra perguntar abre a porta — a resposta quase sempre é 'Ja, visst!' (claro).",
    fraseFonte: 'Posso perguntar uma coisa?',
    fraseAlvo: 'Får jag fråga en sak?',
    pronuncia:
      "fô(r) ia FRÔÔ-ga en SÁÁK? ('får jag' sai quase uma palavra só, 'fô-r'ia', como em 'Får jag komma förbi?': Ô FECHADO e longo e um R de um toque só encostado no 'ia' — sem ele vira 'få', o infinitivo; 'fråga' com força no FRÔ, Ô FECHADO e LONGO (o å longo), R de um toque só colado no F como em 'fraco', G duro e -a fraquinho, sem R no fim; 'en' curtinho e sem nasal; 'sak' com A LONGO de 'pá' e K seco, sem 'ki'; força em FRÅ e SAK)",
    ponteSonora:
      "FÔ(r)-IA... FRÔ-GA... EN SÁK? (6 sílabas: fô-ria-FRÔÔ-ga-en-SÁÁK; força no FRÔ e no SÁK; FÔ(r)-IA é o MESMO 'får jag' da chinchila de 'Ursäkta, får jag komma förbi?': a FOLHA dita à caipira, 'FÔIA', com Ô FECHADO e longo e um toquezinho de R entre o FÔ e o IA, de um toque só, de 'cara' — é ele que faz 'får' (posso); sem ele sobra 'få', o infinitivo; o IA é o 'jag' sem força; FRÔ = a FLOR à caipira, 'FRÔ', do jeito que o Chico Bento fala: o L vira um R de UM toque só grudado no F, como em 'fraco' — nunca o RR soprado —, e o Ô é FECHADO e LONGO, o mesmo Ô do FÔIA logo antes: FÔ... FRÔ; nunca o Ó aberto de 'frota'; GA = o começo de GAZELA e só ele: G duro de 'gato', curtinho e sem força, colado no FRÔ — FRÔ-ga é UMA palavra, com a força toda no FRÔ; e para no A, sem R: depois de 'får jag' o verbo fica pelado — com R vira 'frågar' (pergunta), outra forma; EN = o 'en' (um) de sempre, o dedinho erguido de 'Har du tid en stund?' e o braço único de 'Ha en bra dag!': E curto e N de língua, sem o 'ẽi' nasal do português; SÁK = (UMA) SACADA cortada no C: só o SAC, mas esticado e com força — A LONGO de 'pá' e K seco, sem 'ki' —, nunca o 'sa-CÁ-da' com força no meio; 'en sak' é, ao pé da letra, 'uma coisa')",
    historia:
      "Noite de lua numa vila. Lá em cima, debruçada na SACADA florida, a GAzela mais elegante da rua; lá embaixo, um panda-vermelho de chapéu de palha caipira, que passou a semana escrevendo o discurso numa FÔIA de bambu. Na hora H, de nervoso, ele trava, olha a FÔIA e só consegue gaguejar — FÔ-r'IA... — e, sem saber o que fazer, estende a FRÔ lá pro alto, pra GAzela: FRÔ... GA... Ergue UM dedinho trêmulo — EN... — e trava, mais vermelho que nunca, olhando a SACADA: SÁK...? Posso perguntar uma coisa?",
  },
  createScene,
  refine: { organic: ['gazela', 'panda', 'cabecaPanda', 'bracoD'] },
}

export default card
