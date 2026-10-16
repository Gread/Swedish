import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Vill du följa med?" — VIL DÜ... (O)FÉLIA... MÊ(do)?
 *
 * Noite de São João na beira do rio. O boto-cor-de-rosa sobe da água de
 * chapéu branco — VIL, sedutor de lenda —, estica o bico até quase encostar no
 * nariz da moça tímida (DÜ!), chama pelo apelido (FÉLIA!) e aponta a
 * nadadeira pro fundo do rio, onde o baile continua: MÊ...? Tá com medo?
 *
 * Diorama: disco de rio azul-escuro com o reflexo da lua; margem de terra à
 * direita e ao fundo, com capim, taboas e a fogueira de toras cruzadas;
 * trapiche de tábuas sobre quatro estacas; Ofélia sentada na ponta, de
 * vestido azul-claro e coroa de flores; o boto, enorme, no meio da água, com
 * três anéis de onda em volta; à esquerda, onde a nadadeira aponta, um
 * redemoinho de onde sobem duas notas — o baile lá no fundo. O ROSA-CHICLETE é o único acento saturado: é o
 * boto (a ponte inteira sai dele).
 */

const SOLO = '#231d17'
const AGUA = '#163250'
const ONDA = '#6f9cc2'
const TERRA = '#5b3e28'
const CAPIM = '#3c5634'
const CAPIM_CLARO = '#52703f'
const PEDRA = '#5f6061'
const PEDRA_ESC = '#4b4c4e'
const TABUA = '#8a6139'
const TABUA_ESC = '#73502f'
const ESTACA = '#4a3421'
const TORA = '#5b3b23'
const TORA_CORTE = '#c9a272'
const FOGO = '#ff7a1c'
const FOGO_MIOLO = '#ffd04a'
const LUA = '#fbefc2'
const LUA_MANCHA = '#e9dba6'
const ROSA = '#ff5aa5' // acento saturado RESERVADO: o boto
const ROSA_CLARO = '#ffc2db'
const ROSA_ESC = '#e2468e'
const VINHO = '#5c1435'
const CHAPEU = '#f4f0e6'
const FITA = '#1f1c21'
const VESTIDO = '#a9cae6'
const VESTIDO_ESC = '#8bb2d6'
const PELE = '#ebc6a2'
const BOCHECHA = '#ee9c96'
const CABELO = '#5a3a24'
const RAMO = '#4d7a3c'
const FLOR_BRANCA = '#fbf8f0'
const FLOR_VERMELHA = '#d8403a'
const MIOLO = '#f2c94c'
const SAPATO = '#3b2a24'
const TABOA = '#587a3e'
const TABOA_CABECA = '#5a3a22'

const WY = 0.2 // superfície do rio
const BANK_TOP = 0.44 // topo da margem
const DECK = 0.58 // tampo do trapiche
const PIER_Z = 0.3
const PIER_X0 = 0.36 // ponta (sobre a água)
const PIER_X1 = 1.86 // raiz (na margem)
const PIER_W = 0.66

// Ofélia: origem no tampo do trapiche, virada para a água à frente
const OF_X = 0.74
const OF_Z = PIER_Z + 0.02
const OF_YAW = -0.64
const OF_LEAN = -0.08 // pose final: recuada, longe do bico
const OF_H = 1.3

// boto
const BOTO: [number, number, number] = [-0.46, WY, -0.1]
const BOTO_YAW = 0.7
const BOTO_LEAN = 0.08
const HEAD_K = 1.2 // cabeça graúda: é ela que conta a piada
const HEAD_YAW = 0.39 // pose final: bico parado a um dedo do nariz dela
const HEAD_PITCH = 0.25
const HEAD_Z = 0.14 // pescoço esticado
const REST_YAW = -0.1
const REST_PITCH = -0.18
const REST_Z = 0.04
const FIN_YAW = -0.2
const FIN_UP = 1.9 // pose final: nadadeira apontando o redemoinho do baile
const FIN_DOWN = 2.72
const HAT_Y = 0.19
const HAT_TILT = -0.12

const LUA_POS: [number, number, number] = [-1.85, 2.45, -2.3]
const BAILE: [number, number, number] = [-1.42, WY, 0.8] // onde o baile continua, lá no fundo
const NOTA = '#f6e6ad'
const FUNDO = '#0a1a2c'

function shaded<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Arco de toro (meia-lua): pálpebra de piscadela, sobrancelha arqueada. */
function arc(r: number, tube: number, color: string, angle = Math.PI) {
  return shaded(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 24, angle), mat(color, { roughness: 0.5, size: r * 2 })))
}

/** Cápsula de a até b (traço de boca, pernas). */
function limb(a: [number, number, number], b: [number, number, number], r: number, color: string) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const m = capsule(r, Math.max(0.001, va.distanceTo(vb)), color, { roughness: 0.5 })
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize())
  return m
}

/** Arco centrado no alto (∩), com abertura `angle`. */
function topArc(r: number, tube: number, color: string, angle: number) {
  const m = arc(r, tube, color, angle)
  m.rotation.z = (Math.PI - angle) / 2
  return m
}

/** Olho de sedutor: meia-pálpebra caída sobre a pupila e sobrancelha arqueada lá no alto. */
function olhoSedutor() {
  const g = new THREE.Group()
  const branco = sphere(0.075, '#ffffff', { roughness: 0.25 })
  branco.scale.z = 0.6
  g.add(branco)
  const pupila = sphere(0.034, '#1a1a1a', { roughness: 0.2 })
  pupila.scale.z = 0.5
  pupila.position.set(0.012, -0.02, 0.036)
  g.add(pupila)
  const brilho = sphere(0.009, '#ffffff', { roughness: 0.1 })
  brilho.position.set(0.022, -0.012, 0.052)
  g.add(brilho)
  const palpebra = sphere(0.08, ROSA, { roughness: 0.4 })
  palpebra.scale.set(1.05, 0.56, 0.68)
  palpebra.position.y = 0.04
  g.add(palpebra)
  const sobrancelha = topArc(0.066, 0.016, VINHO, 2.3)
  sobrancelha.position.set(0.005, 0.078, 0.012)
  sobrancelha.rotation.x = -0.35
  g.add(sobrancelha)
  return g
}

/** Piscadela: pálpebra fechada em ∩ com cílios na ponta de fora. */
function olhoPiscando(side: number) {
  const g = new THREE.Group()
  const fechado = sphere(0.072, ROSA, { roughness: 0.4 })
  fechado.scale.z = 0.6
  g.add(fechado)
  const linha = topArc(0.05, 0.013, VINHO, 2.5)
  linha.position.set(0, -0.025, 0.036)
  linha.rotation.x = -0.25
  g.add(linha)
  for (const [a, l] of [[0.25, 0.03], [0.6, 0.026]] as const) {
    const cilio = capsule(0.007, l, VINHO, { roughness: 0.5 })
    cilio.position.set(side * (0.052 + Math.sin(a) * 0.012), -0.012 + Math.cos(a) * 0.02, 0.03)
    cilio.rotation.z = -side * (0.9 + a)
    g.add(cilio)
  }
  return g
}

/** Colcheia (♪): cabeça oval inclinada, haste e bandeirola curva. */
function nota() {
  const g = new THREE.Group()
  const opts = { emissive: NOTA, emissiveIntensity: 0.35, roughness: 0.4 }
  const cabecaNota = sphere(0.055, NOTA, opts)
  cabecaNota.scale.set(1.3, 0.9, 0.6)
  cabecaNota.rotation.z = 0.45
  g.add(cabecaNota)
  const haste = cylinder(0.011, 0.011, 0.24, NOTA, opts, 10)
  haste.position.set(0.058, 0.12, 0)
  g.add(haste)
  const bandeira = capsule(0.013, 0.09, NOTA, opts)
  bandeira.position.set(0.09, 0.19, 0)
  bandeira.rotation.z = 0.75
  g.add(bandeira)
  return g
}

/** Chama: gota emissiva com miolo amarelo e ponta cônica. */
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

/** Contorno da margem (planta em x,z): arco da borda do disco + linha d'água. */
function bankShape() {
  const R = 2.49
  const a0 = THREE.MathUtils.degToRad(112)
  const a1 = THREE.MathUtils.degToRad(-40)
  const s = new THREE.Shape()
  // no Shape, y = -z do mundo (o extrude é girado para deitar no chão)
  s.moveTo(R * Math.cos(a0), R * Math.sin(a0))
  s.absarc(0, 0, R, a0, a1, true)
  const shore: [number, number][] = [
    [1.62, 1.22], [1.34, 0.72], [1.22, 0.18], [1.1, -0.42], [0.72, -0.94], [0.1, -1.3], [-0.55, -1.76],
  ]
  s.splineThru(shore.map(([x, z]) => new THREE.Vector2(x, -z)))
  s.lineTo(R * Math.cos(a0), R * Math.sin(a0))
  return s
}

/** Touceira de taboa: hastes finas com a espiga marrom no alto. */
function taboa(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  for (let i = 0; i < 3; i++) {
    const h = 0.42 + rand() * 0.22
    const x = (rand() - 0.5) * 0.12
    const z = (rand() - 0.5) * 0.12
    const tilt = (rand() - 0.5) * 0.2
    const haste = cylinder(0.009, 0.013, h, TABOA, { roughness: 0.8 }, 8)
    haste.position.set(x, h / 2, z)
    haste.rotation.z = tilt
    g.add(haste)
    const espiga = capsule(0.026, 0.08, TABOA_CABECA, { roughness: 0.9 })
    espiga.position.set(x - Math.sin(tilt) * (h - 0.08), h - 0.08, z)
    espiga.rotation.z = tilt
    g.add(espiga)
  }
  for (let i = 0; i < 4; i++) {
    const folha = cone(0.022, 0.36 + rand() * 0.14, CAPIM_CLARO, { roughness: 0.8 }, 6)
    folha.scale.z = 0.35
    folha.position.set((rand() - 0.5) * 0.14, 0.17, (rand() - 0.5) * 0.14)
    folha.rotation.set((rand() - 0.5) * 0.5, rand() * Math.PI, (rand() - 0.5) * 0.6)
    g.add(folha)
  }
  return g
}

/** Florzinha da coroa: miolo amarelo e cinco pétalas. */
function flor(color: string) {
  const g = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const petala = sphere(0.022, color, { roughness: 0.6 })
    petala.scale.set(1, 0.55, 1)
    petala.position.set(Math.cos(a) * 0.024, 0, Math.sin(a) * 0.024)
    g.add(petala)
  }
  const miolo = sphere(0.016, MIOLO, { roughness: 0.5 })
  miolo.position.y = 0.01
  g.add(miolo)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: o rio ---------------------------------------------------------
  const base = new THREE.Group()

  const solo = cylinder(2.62, 2.72, 0.12, SOLO, { roughness: 0.95 })
  solo.position.y = 0.06
  base.add(solo)

  const agua = cylinder(2.56, 2.6, 0.09, AGUA, { roughness: 0.42, detail: 0.35 }, 64)
  agua.position.y = WY - 0.045
  base.add(agua)

  root.add(base)

  // ---- margem: terra, capim, pedras e taboas -------------------------------
  const margem = new THREE.Group()

  const bankGeo = new THREE.ExtrudeGeometry(bankShape(), {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 3,
    curveSegments: 48,
  })
  bankGeo.rotateX(-Math.PI / 2)
  const terra = shaded(new THREE.Mesh(bankGeo, mat(TERRA, { roughness: 0.95, size: 2.5 })))
  terra.position.y = BANK_TOP - 0.28
  margem.add(terra)

  // tufos de capim espalhados pela margem
  const tufos: [number, number, number][] = [
    [2.05, -0.2, 0.15], [1.95, 0.75, 0.12], [1.15, -1.25, 0.14], [0.35, -1.62, 0.12],
    [2.1, -1.0, 0.11], [1.45, 1.35, 0.1], [-0.4, -2.0, 0.12], [1.3, -0.35, 0.09],
  ]
  for (const [x, z, r] of tufos) {
    const tufo = puff(r, rand() > 0.5 ? CAPIM : CAPIM_CLARO, 5, Math.floor(rand() * 90) + 3, { roughness: 0.92 })
    tufo.position.set(x, BANK_TOP + r * 0.2, z)
    tufo.scale.y = 0.55
    margem.add(tufo)
  }

  // pedras na linha d'água
  for (const [x, z, r] of [[1.36, 1.0, 0.11], [1.12, -0.62, 0.1], [0.42, -1.18, 0.12], [-0.25, -1.6, 0.09]] as const) {
    const pedra = rock(r, rand() > 0.5 ? PEDRA : PEDRA_ESC, Math.floor(rand() * 50) + 7, { roughness: 0.9 })
    pedra.position.set(x, WY + r * 0.35, z)
    pedra.scale.y = 0.7
    margem.add(pedra)
  }

  for (const [x, z, s] of [[1.42, 0.92, 7], [0.95, -0.82, 11], [0.05, -1.4, 13]] as const) {
    const t = taboa(s)
    t.position.set(x, WY, z)
    margem.add(t)
  }

  root.add(margem)

  // ---- fogueira de São João: toras cruzadas em quadrado --------------------
  const fogueira = new THREE.Group()
  fogueira.position.set(1.66, BANK_TOP, -0.86)

  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const pedra = sphere(0.065, i % 2 ? PEDRA : PEDRA_ESC, { roughness: 0.9 })
    pedra.scale.set(1.25, 0.7, 1)
    pedra.position.set(Math.cos(a) * 0.36, 0.03, Math.sin(a) * 0.36)
    pedra.rotation.y = -a
    fogueira.add(pedra)
  }
  for (let k = 0; k < 4; k++) {
    for (const s of [-1, 1]) {
      const tora = capsule(0.045, 0.4, TORA, { roughness: 0.85 })
      tora.rotation.set(Math.PI / 2, 0, k % 2 ? Math.PI / 2 : 0)
      const off = s * (0.15 - k * 0.012)
      if (k % 2) tora.position.set(off, 0.045 + k * 0.08, 0)
      else tora.position.set(0, 0.045 + k * 0.08, off)
      tora.rotation.y = 0
      fogueira.add(tora)
      // ponta cortada clara das toras
      for (const e of [-1, 1]) {
        const corte = cylinder(0.04, 0.04, 0.012, TORA_CORTE, { roughness: 0.8 }, 16)
        if (k % 2) {
          corte.rotation.x = Math.PI / 2
          corte.position.set(off, 0.045 + k * 0.08, e * 0.245)
        } else {
          corte.rotation.z = Math.PI / 2
          corte.position.set(e * 0.245, 0.045 + k * 0.08, off)
        }
        fogueira.add(corte)
      }
    }
  }
  const brasa = sphere(0.14, '#c2451a', { emissive: '#ff5a14', emissiveIntensity: 0.9 })
  brasa.scale.y = 0.4
  brasa.position.y = 0.06
  fogueira.add(brasa)
  for (const [x, z, s] of [[0, 0, 1.25], [-0.08, 0.06, 0.9], [0.09, -0.05, 0.85], [0.06, 0.09, 0.7], [-0.07, -0.08, 0.75]] as const) {
    const c = chama(0.1 * s, 0.5 * s)
    c.position.set(x, 0.12, z)
    fogueira.add(c)
  }
  for (const [x, y, z] of [[-0.12, 0.92, 0.04], [0.1, 1.06, -0.05], [0.02, 1.2, 0.08]] as const) {
    const fagulha = sphere(0.016, FOGO_MIOLO, { emissive: FOGO_MIOLO, emissiveIntensity: 2 })
    fagulha.position.set(x, y, z)
    fogueira.add(fagulha)
  }
  root.add(fogueira)

  // ---- lua cheia ao fundo --------------------------------------------------
  const lua = new THREE.Group()
  lua.position.set(...LUA_POS)
  lua.rotation.y = 0.22
  const disco = cylinder(0.38, 0.38, 0.06, LUA, { emissive: LUA, emissiveIntensity: 0.85 }, 48)
  disco.rotation.x = Math.PI / 2
  lua.add(disco)
  for (const [x, y, r] of [[-0.11, 0.1, 0.085], [0.13, -0.04, 0.06], [0.02, -0.19, 0.048], [0.16, 0.17, 0.04], [-0.17, -0.12, 0.035]] as const) {
    const mancha = cylinder(r, r, 0.012, LUA_MANCHA, { emissive: LUA_MANCHA, emissiveIntensity: 0.6 }, 24)
    mancha.rotation.x = Math.PI / 2
    mancha.position.set(x, y, 0.032)
    lua.add(mancha)
  }
  // a lua é céu, não objeto: não projeta sombra no palco
  lua.traverse((o) => { o.castShadow = false })
  root.add(lua)

  // ---- trapiche de tábuas sobre quatro estacas -----------------------------
  const trapiche = new THREE.Group()
  const len = PIER_X1 - PIER_X0
  const n = 10
  for (let i = 0; i < n; i++) {
    const tabua = rbox(len / n - 0.02, 0.05, PIER_W + (rand() - 0.5) * 0.04, 0.012, i % 3 === 1 ? TABUA_ESC : TABUA, { roughness: 0.85 })
    tabua.position.set(PIER_X0 + (i + 0.5) * (len / n), DECK - 0.025, PIER_Z + (rand() - 0.5) * 0.03)
    tabua.rotation.y = (rand() - 0.5) * 0.04
    trapiche.add(tabua)
  }
  for (const dz of [-0.26, 0.26]) {
    const longarina = rbox(len + 0.02, 0.09, 0.07, 0.02, ESTACA, { roughness: 0.85 })
    longarina.position.set(PIER_X0 + len / 2, DECK - 0.095, PIER_Z + dz)
    trapiche.add(longarina)
  }
  for (const x of [PIER_X0 + 0.07, PIER_X0 + 0.72]) {
    for (const dz of [-0.31, 0.31]) {
      const h = DECK + 0.06
      const estaca = cylinder(0.055, 0.062, h, ESTACA, { roughness: 0.9 }, 16)
      estaca.position.set(x, 0.05 + h / 2, PIER_Z + dz)
      trapiche.add(estaca)
      const topo = cylinder(0.05, 0.055, 0.014, TORA_CORTE, { roughness: 0.8 }, 16)
      topo.position.set(x, 0.05 + h + 0.007, PIER_Z + dz)
      trapiche.add(topo)
    }
  }
  root.add(trapiche)

  // ---- Ofélia, sentada na ponta do trapiche --------------------------------
  const ofelia = new THREE.Group()
  ofelia.position.set(OF_X, DECK, OF_Z)
  ofelia.rotation.order = 'YXZ'
  ofelia.rotation.set(OF_LEAN, OF_YAW, 0)
  root.add(ofelia)

  const moca = person({ body: VESTIDO, skin: PELE, height: OF_H, armAngle: 0.3 })
  moca.position.y = -0.16 // sentada: o quadril fica no tampo
  ofelia.add(moca)

  // saia em sino sobre as tábuas
  const saia = lathe(
    [[0, 0.004], [0.33, 0.004], [0.345, 0.025], [0.31, 0.1], [0.255, 0.19], [0.23, 0.24], [0, 0.24]],
    VESTIDO,
    { roughness: 0.85 },
  )
  ofelia.add(saia)
  const barra = torus(0.33, 0.018, VESTIDO_ESC, { roughness: 0.85 })
  barra.rotation.x = Math.PI / 2
  barra.position.y = 0.018
  ofelia.add(barra)

  // joelhos encolhidos (coxas cobertas pelo vestido), canelas e sapatilhas
  for (const s of [-1, 1]) {
    const coxa = capsule(0.085, 0.2, VESTIDO, { roughness: 0.85 })
    coxa.position.set(s * 0.1, 0.17, 0.17)
    coxa.rotation.x = 0.95
    ofelia.add(coxa)
    const joelho = sphere(0.09, VESTIDO, { roughness: 0.85 })
    joelho.position.set(s * 0.1, 0.24, 0.29)
    ofelia.add(joelho)
    const canela = capsule(0.052, 0.17, PELE)
    canela.position.set(s * 0.1, 0.13, 0.36)
    canela.rotation.x = -0.35
    ofelia.add(canela)
    const sapato = sphere(0.062, SAPATO, { roughness: 0.5 })
    sapato.scale.set(0.85, 0.6, 1.35)
    sapato.position.set(s * 0.1, 0.035, 0.42)
    ofelia.add(sapato)
  }

  // mãos no peito: braços pivotados no ombro, encurtados e cruzando para dentro
  const bodyH = OF_H * 0.52
  for (const name of ['armL', 'armR']) {
    const braco = moca.getObjectByName(name) as THREE.Mesh
    shoulderPivot(braco, OF_H)
    const side = name === 'armL' ? -1 : 1
    braco.scale.y = 0.78
    const mao = braco.children[0]
    mao.scale.y = 1 / 0.78
    const ombro = braco.position.clone()
    const alvo = new THREE.Vector3(side * 0.07, bodyH * 0.8, OF_H * 0.17 * 1.38)
    const dir = alvo.sub(ombro).normalize()
    braco.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir)
  }

  const cabecaMoca = moca.getObjectByName('head') as THREE.Group
  const hr = OF_H * 0.19
  cabecaMoca.rotation.set(0.32, 0.25, 0) // olha pra água, fugindo do bico

  // cabelo castanho comprido
  const capa = sphere(hr * 1.0, CABELO, { roughness: 0.8 })
  capa.scale.set(1.05, 1, 1.0)
  capa.position.set(0, hr * 0.3, -hr * 0.25)
  cabecaMoca.add(capa)
  const franja = sphere(hr * 0.55, CABELO, { roughness: 0.8 })
  franja.scale.set(1.45, 0.42, 0.62)
  franja.position.set(hr * 0.18, hr * 0.74, hr * 0.5)
  franja.rotation.z = 0.28
  cabecaMoca.add(franja)
  const longo = capsule(hr * 0.55, hr * 1.4, CABELO, { roughness: 0.8 })
  longo.scale.set(1.35, 1, 0.55)
  longo.position.set(0, -hr * 0.95, -hr * 0.66)
  longo.rotation.x = 0.12
  cabecaMoca.add(longo)
  for (const s of [-1, 1]) {
    const mecha = capsule(hr * 0.2, hr * 1.1, CABELO, { roughness: 0.8 })
    mecha.position.set(s * hr * 0.9, -hr * 0.5, hr * 0.05)
    mecha.rotation.z = s * 0.12
    cabecaMoca.add(mecha)
    const rubor = sphere(hr * 0.16, BOCHECHA, { roughness: 0.7 })
    rubor.scale.set(1.2, 0.7, 0.4)
    rubor.position.set(s * hr * 0.55, -hr * 0.18, hr * 0.8)
    cabecaMoca.add(rubor)
    const sobrancelha = capsule(hr * 0.045, hr * 0.22, CABELO, { roughness: 0.8 })
    sobrancelha.position.set(s * hr * 0.38, hr * 0.46, hr * 0.86)
    sobrancelha.rotation.z = Math.PI / 2 - s * 0.35 // pontas internas erguidas: aflita
    cabecaMoca.add(sobrancelha)
  }
  const boquinha = sphere(hr * 0.09, '#8a3a3a', { roughness: 0.6 })
  boquinha.scale.set(1, 1.2, 0.5)
  boquinha.position.set(0, -hr * 0.45, hr * 0.9)
  cabecaMoca.add(boquinha)

  // ---- coroa de flores brancas e vermelhas ---------------------------------
  const coroa = new THREE.Group()
  coroa.position.set(0, hr * 0.62, -hr * 0.2)
  coroa.rotation.x = -0.12
  cabecaMoca.add(coroa)
  const RC = hr * 1.04
  const ramo = torus(RC, 0.018, RAMO, { roughness: 0.8 })
  ramo.rotation.x = Math.PI / 2
  coroa.add(ramo)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3
    const f = flor(i % 2 ? FLOR_VERMELHA : FLOR_BRANCA)
    f.position.set(Math.cos(a) * RC, 0.022, Math.sin(a) * RC)
    f.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35)
    coroa.add(f)
    const folha = sphere(0.018, RAMO, { roughness: 0.8 })
    folha.scale.set(1.6, 0.5, 0.8)
    const b = a + Math.PI / 10
    folha.position.set(Math.cos(b) * RC, 0.008, Math.sin(b) * RC)
    folha.rotation.y = -b
    coroa.add(folha)
  }

  // ---- anéis de onda em volta do boto --------------------------------------
  const ondas = new THREE.Group()
  ondas.position.set(BOTO[0], WY + 0.004, BOTO[2])
  for (const [r, t] of [[0.52, 0.022], [0.76, 0.018], [0.98, 0.014]] as const) {
    const anel = torus(r, t, ONDA, { roughness: 0.3 })
    anel.rotation.x = Math.PI / 2
    anel.scale.z = 0.5
    ondas.add(anel)
  }
  root.add(ondas)

  // ---- o redemoinho do baile: luz lá do fundo e música subindo -------------
  const baile = new THREE.Group()
  baile.position.set(...BAILE)
  root.add(baile)
  const espiral: THREE.Vector3[] = []
  for (let i = 0; i <= 80; i++) {
    const t = i / 80
    const a = t * Math.PI * 4
    const r = 0.05 + t * 0.27
    espiral.push(new THREE.Vector3(Math.cos(a) * r, 0.004, Math.sin(a) * r))
  }
  const redemoinho = shaded(new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(espiral), 160, 0.013, 6, false),
    mat(ONDA, { roughness: 0.3, size: 0.6 }),
  ))
  redemoinho.rotation.y = Math.PI // a cauda da espiral foge dos anéis do boto
  baile.add(redemoinho)
  // olho do redemoinho: o rio afunda num poço escuro
  const poco = cylinder(0.075, 0.075, 0.01, FUNDO, { roughness: 0.2 }, 24)
  poco.position.y = 0.002
  baile.add(poco)
  const nota1 = nota()
  nota1.position.set(0.06, 0.3, -0.04)
  nota1.rotation.z = -0.15
  baile.add(nota1)
  const nota2 = nota()
  nota2.position.set(-0.18, 0.62, -0.16)
  nota2.rotation.z = 0.2
  nota2.scale.setScalar(1.2)
  baile.add(nota2)

  // ---- o boto-cor-de-rosa, em pé na água -----------------------------------
  const boto = new THREE.Group()
  boto.position.set(...BOTO)
  boto.rotation.order = 'YXZ'
  boto.rotation.set(BOTO_LEAN, BOTO_YAW, 0)
  root.add(boto)

  // corpo em pera: largo na linha d'água, afinando até o pescoço
  const quadril = sphere(0.41, ROSA, { roughness: 0.4 })
  quadril.scale.set(1, 0.75, 0.95)
  quadril.position.y = 0.08
  boto.add(quadril)
  const tronco = capsule(0.36, 0.5, ROSA, { roughness: 0.4 })
  tronco.position.y = 0.5
  boto.add(tronco)
  const peito = sphere(0.32, ROSA, { roughness: 0.4 })
  peito.position.set(0, 0.92, 0.04)
  boto.add(peito)
  const pescoco = capsule(0.24, 0.22, ROSA, { roughness: 0.4 })
  pescoco.position.set(0, 1.24, 0.07)
  pescoco.rotation.x = 0.3
  boto.add(pescoco)
  // barriga clara: peça própria (fora da pele fundida, para a borda ficar limpa)
  const barriga = sphere(0.3, ROSA_CLARO, { roughness: 0.45 })
  barriga.scale.set(0.95, 1.55, 0.62)
  barriga.position.set(0, 0.58, 0.2)
  boto.add(barriga)
  // crista dorsal baixa (o boto não tem barbatana alta)
  const crista = capsule(0.07, 0.4, ROSA_ESC, { roughness: 0.45 })
  crista.scale.set(0.7, 1, 1.4)
  crista.position.set(0, 0.72, -0.34)
  crista.rotation.x = -0.12
  boto.add(crista)
  // nadadeira de repouso, do lado da moça
  const nadadeiraR = sphere(0.18, ROSA, { roughness: 0.4 })
  nadadeiraR.scale.set(0.6, 1, 0.22)
  nadadeiraR.position.set(0.37, 0.7, 0.08)
  nadadeiraR.rotation.set(0.3, 0.3, 0.42)
  boto.add(nadadeiraR)

  // ---- nadadeira que aponta o fundo do rio (pivô no ombro) -----------------
  const nadadeira = new THREE.Group()
  nadadeira.position.set(-0.3, 0.98, 0.05)
  nadadeira.rotation.set(0, FIN_YAW, FIN_UP)
  boto.add(nadadeira)
  // pá larga e chata, afinando na ponta (face larga virada para a câmera)
  const pa = sphere(0.2, ROSA, { roughness: 0.4 })
  pa.scale.set(0.66, 1.45, 0.24)
  pa.position.y = 0.25
  nadadeira.add(pa)
  const ponta = sphere(0.085, ROSA, { roughness: 0.4 })
  ponta.scale.set(1, 1.3, 0.42)
  ponta.position.set(0.0, 0.5, 0)
  nadadeira.add(ponta)

  // ---- cabeça: melão saltado, bico comprido e fino, olhar de sedutor -------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.5, HEAD_Z)
  cabeca.rotation.order = 'YXZ'
  cabeca.rotation.set(HEAD_PITCH, HEAD_YAW, 0)
  cabeca.scale.setScalar(HEAD_K)
  boto.add(cabeca)

  const cranio = sphere(0.27, ROSA, { roughness: 0.4 })
  cranio.scale.set(0.95, 0.92, 1.0)
  cranio.position.set(0, 0.02, -0.02)
  cabeca.add(cranio)
  const melao = sphere(0.21, ROSA, { roughness: 0.4 })
  melao.scale.set(1, 0.95, 1)
  melao.position.set(0, 0.08, 0.12)
  cabeca.add(melao)
  const queixo = sphere(0.18, ROSA, { roughness: 0.4 })
  queixo.scale.set(1, 0.7, 1.2)
  queixo.position.set(0, -0.1, 0.14)
  cabeca.add(queixo)
  const bico = cylinder(0.04, 0.075, 0.6, ROSA, { roughness: 0.4 })
  bico.rotation.x = Math.PI / 2
  bico.position.set(0, -0.1, 0.55)
  cabeca.add(bico)
  const pontaBico = sphere(0.04, ROSA, { roughness: 0.4 })
  pontaBico.position.set(0, -0.1, 0.85)
  cabeca.add(pontaBico)

  // olhos na frente do melão (orientados pela normal da esfera)
  const placeEye = (eye: THREE.Object3D, az: number, el: number) => {
    const c = new THREE.Vector3(0, 0.08, 0.12)
    const n = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    eye.position.copy(c).addScaledVector(n, 0.21 * 0.9)
    eye.rotation.order = 'YXZ'
    eye.rotation.set(-el, az, 0)
    cabeca.add(eye)
  }
  // lado da câmera (-x): olho de sedutor; lado de lá (+x): a piscadela
  placeEye(olhoSedutor(), -0.62, 0.02)
  placeEye(olhoPiscando(1), 0.06, 0.04)

  // sorriso de canto ao longo do bico, virando para cima na bochecha
  cabeca.add(limb([-0.06, -0.152, 0.31], [-0.046, -0.14, 0.62], 0.012, VINHO))
  cabeca.add(limb([-0.06, -0.152, 0.31], [-0.108, -0.104, 0.25], 0.012, VINHO))

  // ---- chapéu branco de aba larga com fita preta ---------------------------
  const chapeu = new THREE.Group()
  chapeu.position.set(0, HAT_Y, 0.03)
  chapeu.rotation.set(HAT_TILT, 0, -0.2)
  chapeu.scale.setScalar(0.86)
  cabeca.add(chapeu)
  const aba = lathe(
    [[0.22, 0.0], [0.4, -0.01], [0.5, 0.02], [0.53, 0.055], [0.51, 0.062], [0.47, 0.036], [0.4, 0.02], [0.22, 0.032]],
    CHAPEU,
    { roughness: 0.65 },
    56,
  )
  chapeu.add(aba)
  const copa = lathe(
    [[0.27, 0.0], [0.285, 0.12], [0.27, 0.22], [0.22, 0.27], [0.12, 0.262], [0, 0.23]],
    CHAPEU,
    { roughness: 0.65 },
    48,
  )
  chapeu.add(copa)
  const fita = cylinder(0.292, 0.288, 0.07, FITA, { roughness: 0.5 }, 48)
  fita.position.y = 0.065
  chapeu.add(fita)
  const laco = rbox(0.05, 0.07, 0.1, 0.02, FITA, { roughness: 0.5 })
  laco.position.set(-0.29, 0.065, 0.04)
  chapeu.add(laco)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'rio', object: base },
    { name: 'margem', group: 'rio', object: margem },
    { name: 'lua', group: 'rio', object: lua },
    { name: 'trapiche', group: 'rio', object: trapiche },
    { name: 'fogueira', group: 'rio', object: fogueira },
    { name: 'ofelia', group: 'ofelia', object: ofelia },
    { name: 'coroa', group: 'ofelia', object: coroa },
    { name: 'ondas', group: 'boto', object: ondas },
    { name: 'boto', group: 'boto', object: boto },
    { name: 'barriga', group: 'boto', object: barriga },
    { name: 'cabeca', group: 'boto', object: cabeca },
    { name: 'nadadeira', group: 'boto', object: nadadeira },
    { name: 'chapeu', group: 'boto', object: chapeu },
    { name: 'baile', group: 'medo', object: baile },
  ]

  const scale3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Noite de São João na beira do rio: lua cheia, fogueira na margem e um trapiche na água escura.',
    }),
    seq('margem-rise', 'margem', 0.15, 0.8, [riseFrom(0, 0.7)], { ease: 'easeOut' }),
    seq('lua-sobe', 'lua', 0.5, 1.3, [ch('position.y', 1.3, LUA_POS[1])], { ease: 'easeOut' }),
    seq('trapiche-rise', 'trapiche', 1.0, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),
    seq('fogueira-acende', 'fogueira', 1.3, 0.7, scale3(0.01, 1), { ease: 'easeOut' }),

    seq('ofelia-rise', 'ofelia', 2.6, 0.8, [riseFrom(DECK, 1.1)], {
      ease: 'easeOut',
      caption: 'Na ponta do trapiche, a moça mais tímida da festa: OFÉLIA, de coroa de flores.',
    }),
    seq('coroa-pousa', 'coroa', 3.2, 0.6, [ch('position.y', hr * 0.62 + 0.35, hr * 0.62), ...scale3(0.01, 1)], {
      ease: 'easeOut',
    }),

    seq('ondas-abrem', 'ondas', 4.4, 1.0, [ch('scale.x', 0.15, 1), ch('scale.z', 0.15, 1)], {
      ease: 'easeOut',
      caption: 'Da água sobe o boto-cor-de-rosa de chapéu branco — sedutor de lenda e VIL como ele só.',
    }),
    seq('boto-sobe', 'boto', 4.5, 1.0, [riseFrom(WY, 2.1)], { ease: 'easeOut' }),
    seq('cabeca-surge', 'cabeca', 4.5, 1.0, [
      ch('rotation.x', -0.45, REST_PITCH), ch('rotation.y', REST_YAW, REST_YAW), ch('position.z', REST_Z, REST_Z),
    ], { ease: 'easeOut' }),
    seq('barriga-surge', 'barriga', 4.5, 1.0, [ch('scale.z', 0.3, 0.62)], { ease: 'easeOut' }),
    seq('nadadeira-surge', 'nadadeira', 4.5, 1.0, [ch('rotation.z', 2.3, FIN_DOWN)], { ease: 'easeOut' }),
    seq('chapeu-pousa', 'chapeu', 5.4, 0.7, [
      ch('position.y', HAT_Y + 0.9, HAT_Y), ch('rotation.y', -3.0, 0),
    ], { ease: 'easeOut' }),

    seq('cabeca-estica', 'cabeca', 6.6, 0.6, [
      ch('rotation.x', REST_PITCH, HEAD_PITCH), ch('rotation.y', REST_YAW, HEAD_YAW), ch('position.z', REST_Z, HEAD_Z),
    ], {
      ease: 'easeOut',
      caption: 'Ele estica o bico até quase encostar no nariz dela — DÜ! — e chama pelo apelido: FÉLIA!',
    }),
    seq('ofelia-recua', 'ofelia', 7.0, 0.5, [ch('rotation.x', 0.06, OF_LEAN)], { ease: 'easeOut' }),

    seq('nadadeira-aponta', 'nadadeira', 8.7, 0.7, [ch('rotation.z', FIN_DOWN, FIN_UP)], {
      ease: 'easeOut',
      caption: 'Ela encolhe os pés; ele aponta pro fundo do rio, onde o baile continua: MÊ…? Tá com medo?',
    }),

    seq('baile-surge', 'baile', 8.9, 0.8, [...scale3(0.01, 1)], { ease: 'easeOut' }),

    seq('chapeu-tira', 'chapeu', 10.5, 0.4, [ch('rotation.x', HAT_TILT, -0.55), ch('position.y', HAT_Y, HAT_Y + 0.08)], {
      ease: 'easeOut',
      caption: 'Vill du följa med? — Quer vir junto?',
    }),
    seq('chapeu-volta', 'chapeu', 10.95, 0.5, [ch('rotation.x', -0.55, HAT_TILT), ch('position.y', HAT_Y + 0.08, HAT_Y)], {
      ease: 'easeInOut',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.45, 4.75], target: [0.2, 1.2, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vill-du-folja-med',
    contexto:
      "Convite: de improviso, na hora de sair — alguém vai ao mercado, à fika, ao bar ou dar uma volta e chama quem está por perto: 'Jag ska till stan, vill du följa med?'. Também por mensagem: 'Vi ska på bio ikväll, vill du följa med?'.",
    fraseFonte: 'Quer vir junto?',
    fraseAlvo: 'Vill du följa med?',
    pronuncia:
      "vil dü föl-ia MÊÊ? ('vill' com I curto e L de verdade, língua no céu da boca; 'du' com Ü, bico de beijo e língua de I; 'följa' sai leve e rápido: Ö CURTO e aberto (boca de É com os lábios em bico), L de verdade e o 'ja' = 'ia', de ioga, numa sílaba só; 'med' é a partícula do verbo e leva a força da frase: MÊÊ, Ê fechado e longo, o D não soa)",
    ponteSonora:
      "VIL DÜ... (O)FÉLIA... MÊ(do)? (5 sílabas: vil-dü-föl-ia-MÊÊ; a força principal no MÊÊ — em verbo com partícula a pancada vai toda pra partícula, följa MED, como 'ta MED' e 'lämna tillBAka' —, e o FÉ-lia corre leve; VIL DÜ é o MESMO começo da bruxa de 'Vill du ha något att dricka?' e da avestruz de 'Vill du ha kvittot?': VIL com I curto e L DE VERDADE, língua no céu da boca — nunca 'viu' —, e DÜ com BICO DE PATO, o 'du' de CAN-DU (aqui é o bico do boto que aponta); (O)FÉLIA = OFÉLIA sem o O, do jeito que o boto chama, pelo apelido: FÉ-lia; o É aberto do nome já está quase no ö curto sueco — é só fazer BICO de beijo sem mexer a língua: é o MESMO FÖ do beijinho de 'Tack för hjälpen', CURTO; o LIA sai numa sílaba só, L DE VERDADE + I de ioga, FÖL-ia, nunca 'li-a' em dois pedaços; e não é o FÊ fechado do vidro de FEL de 'Det är fel pris'; MÊ(do) = MEDO sem o -DO, o MESMO MÊ de 'Vad jobbar du med?' e 'Kan jag betala med kort?' — e, como no MÊÊ(do) do gnu de 'Jag håller med' e no MÊÊ da cabra de 'Ta med, tack', aqui ele é partícula: Ê FECHADO, LONGO e com toda a força, D mudo)",
    historia:
      'Noite de São João na beira do rio: o boto-cor-de-rosa sobe à margem de chapéu branco — o disfarce de sempre — atrás da moça mais tímida da festa, OFÉLIA, de coroa de flores, sentada na ponta do trapiche. Sedutor de lenda e VIL como ele só, ele estica o bico até quase encostar no nariz dela — DÜ! — e chama pelo apelido: FÉLIA! Ela encolhe os pés, olhando a água escura, e o boto aponta a nadadeira pro fundo do rio, onde o baile continua: MÊ...? Tá com medo? O convite do boto é sempre o mesmo: quer vir junto?',
  },
  createScene,
  refine: { organic: ['boto', 'cabeca', 'nadadeira'] },
}

export default card
