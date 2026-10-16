import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Det snöar!" — DÊ! SNOW... AR!
 *
 * Fim de outubro: o lemingue implorou neve ao céu (DÊ!) e o céu exagerou —
 * flocos do tamanho de pizzas despencam de uma nuvem cinza. Ele salta do
 * penhasco nevado e a prancha de SNOWboard voa no AR, girando, com o rastro
 * de neve espirrada saindo da beira do penhasco.
 *
 * Diorama: pedestal de ardósia com tampo de neve, penhasco arredondado à
 * esquerda com pinheiro de ponta nevada, nuvem chumbo no alto, três flocos
 * gigantes de seis pontas. O acento saturado é o TURQUESA da prancha (SNOW).
 */

const ARDOSIA = '#2f3640'
const NEVE = '#eef3f8'
const NEVE_SOMBRA = '#d6e0eb'
const ROCHA = '#5c6572'
const ROCHA_ESC = '#464d58'
const PINHO = '#2a5240'
const PINHO_ESC = '#203f33'
const TRONCO = '#5a3f2c'
const NUVEM = '#7b8492'
const NUVEM_ESC = '#69717e'
const GELO = '#f2f8ff'
const GELO_BRILHO = '#cfe6ff'
const TURQUESA = '#12b3ae' // acento: a prancha de SNOW
const TURQUESA_ESC = '#0b7f7b'
const AMARELO = '#f5c431'
const FIXACAO = '#2c3138'
const DOURADO = '#e0923a'
const DOURADO_CLARO = '#f1bb6c'
const PELO_PRETO = '#2a2421'
const ROSA = '#e8919b'
const BOCA = '#5a1f27'
const DENTE = '#fbf6ea'

const GY = 0.34 // superfície de neve do diorama
const CT = 1.05 // topo da rocha do penhasco
const CS = 1.25 // superfície de neve no alto do penhasco
const CX = -1.6 // centro do penhasco
const CZ = -0.2

// prancha: no penhasco (preparo) e no ar (pose final)
const P_CLIFF: [number, number, number] = [-1.45, CS + 0.03, 0.12]
const P_AR: [number, number, number] = [0.6, 1.78, 0.35]
const P_TILT_Z = 0.26
const P_TILT_X = 0.12
const P_APEX = 2.45

// braços: asas abertas (final) e erguidos pro céu (implorando)
const ASA = 0.45
const IMPLORA = 1.3

/** Floco de neve de seis pontas, deitado no plano xy (de frente para +z). */
function floco(r: number) {
  const g = new THREE.Group()
  const w = r * 0.13
  const t = r * 0.09
  const m = { roughness: 0.3, emissive: GELO_BRILHO, emissiveIntensity: 0.22 }
  const miolo = cylinder(r * 0.2, r * 0.2, t * 1.3, GELO, m, 6)
  miolo.rotation.x = Math.PI / 2
  g.add(miolo)
  for (let i = 0; i < 3; i++) {
    const braco = rbox(r * 2, w, t, w * 0.45, GELO, m)
    braco.rotation.z = (i * Math.PI) / 3
    g.add(braco)
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3
    for (const [d, L] of [[0.48, 0.38], [0.74, 0.24]] as const) {
      for (const s of [-1, 1]) {
        const ang = a + s * (Math.PI / 3)
        const galho = rbox(r * L, w * 0.8, t * 0.9, w * 0.35, GELO, m)
        galho.rotation.z = ang
        galho.position.set(
          Math.cos(a) * r * d + Math.cos(ang) * r * L * 0.5,
          Math.sin(a) * r * d + Math.sin(ang) * r * L * 0.5,
          0,
        )
        g.add(galho)
      }
    }
    const ponta = sphere(w * 0.72, GELO, m, 12)
    ponta.position.set(Math.cos(a) * r, Math.sin(a) * r, 0)
    g.add(ponta)
  }
  return g
}

/** Pinheiro em camadas, cada uma com a parte de cima nevada. */
function pinheiro(h: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const tronco = cylinder(h * 0.05, h * 0.07, h * 0.25, TRONCO, { roughness: 0.85 })
  tronco.position.y = h * 0.125
  g.add(tronco)
  const tiers = [[0.36, 0.42, 0.2], [0.28, 0.36, 0.44], [0.19, 0.3, 0.66]] as const
  tiers.forEach(([r, th, y], i) => {
    const copa = cone(h * r, h * th, i % 2 ? PINHO : PINHO_ESC, { roughness: 0.85 }, 9)
    copa.position.y = h * (y + th / 2)
    copa.rotation.y = rand() * Math.PI
    g.add(copa)
    const neve = cone(h * r * 0.72, h * th * 0.52, NEVE, { roughness: 0.75 }, 9)
    neve.position.y = h * (y + th - th * 0.26) + h * 0.012
    neve.rotation.y = copa.rotation.y
    g.add(neve)
  })
  return g
}

/** Prancha de snowboard: contorno com cintura, bico e rabo dobrados pra cima. */
function snowboardGeo() {
  const s = new THREE.Shape()
  const L = 0.55
  const W = 0.19
  s.moveTo(-L, -W)
  s.quadraticCurveTo(0, -W * 0.86, L, -W)
  s.absarc(L, 0, W, -Math.PI / 2, Math.PI / 2, false)
  s.quadraticCurveTo(0, W * 0.86, -L, W)
  s.absarc(-L, 0, W, Math.PI / 2, (3 * Math.PI) / 2, false)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 20,
  })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, -0.015, 0)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const ax = Math.abs(x)
    if (ax > 0.45) pos.setY(i, pos.getY(i) + 1.1 * (ax - 0.45) ** 2)
  }
  geo.computeVertexNormals()
  return geo
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- base: pedestal de ardósia com tampo de neve --------------------------
  const base = new THREE.Group()
  const pedestal = cylinder(2.72, 2.8, 0.24, ARDOSIA, { roughness: 0.8 })
  pedestal.position.y = 0.12
  base.add(pedestal)
  const tampo = lathe(
    [[0, 0.2], [2.64, 0.2], [2.73, 0.26], [2.7, 0.31], [2.5, GY], [0, GY]],
    NEVE,
    { roughness: 0.8 },
    64,
  )
  base.add(tampo)
  // montinhos de neve e pedras espiando
  for (const [x, z, r] of [[1.2, 1.5, 0.42], [2.0, 0.4, 0.38], [1.7, -1.5, 0.5], [-0.3, 1.9, 0.34], [0.4, -1.8, 0.45]] as const) {
    const monte = sphere(r, NEVE, { roughness: 0.8 })
    monte.scale.set(1.3, 0.32, 1)
    monte.position.set(x, GY - 0.02, z)
    monte.rotation.y = rand() * Math.PI
    base.add(monte)
  }
  for (const [x, z, r, s] of [[2.05, 1.05, 0.2, 3], [1.55, 1.75, 0.13, 5], [2.25, -0.55, 0.16, 8]] as const) {
    const pedra = rock(r, ROCHA, s, { roughness: 0.85 })
    pedra.position.set(x, GY + r * 0.25, z)
    base.add(pedra)
    const capa = sphere(r * 0.8, NEVE, { roughness: 0.8 })
    capa.scale.set(1, 0.4, 1)
    capa.position.set(x, GY + r * 0.85, z)
    base.add(capa)
  }
  const pinhoFundo = pinheiro(1.0, 12)
  pinhoFundo.position.set(1.95, GY - 0.02, -1.3)
  base.add(pinhoFundo)
  root.add(base)

  // ---- penhasco arredondado à esquerda ------------------------------------
  const penhasco = new THREE.Group()
  const nucleo = lathe(
    [[0, GY - 0.05], [1.12, GY - 0.05], [1.08, 0.5], [0.98, 0.78], [0.92, CT - 0.06], [0.86, CT], [0, CT]],
    ROCHA_ESC,
    { roughness: 0.9 },
    40,
  )
  nucleo.position.set(CX, 0, CZ)
  penhasco.add(nucleo)
  // pedras facetadas na face do penhasco
  for (let i = 0; i < 11; i++) {
    const a = -0.9 + (i / 10) * 2.6 // da frente-direita até a frente-esquerda
    const y = 0.45 + (i % 3) * 0.2
    const rr = 1.0 - (y - 0.45) * 0.15
    const pedra = rock(0.2 + rand() * 0.1, i % 2 ? ROCHA : ROCHA_ESC, 20 + i, { roughness: 0.88 })
    pedra.position.set(CX + Math.cos(a) * rr, y, CZ + Math.sin(a) * rr)
    pedra.rotation.set(rand() * 3, rand() * 3, rand() * 3)
    penhasco.add(pedra)
  }
  // capa de neve no alto, com beiral arredondado
  const capa = lathe(
    [[0, CT - 0.08], [0.9, CT - 0.08], [0.99, CT - 0.02], [1.0, CT + 0.06], [0.93, CT + 0.14], [0.6, CS - 0.01], [0, CS]],
    NEVE,
    { roughness: 0.78 },
    48,
  )
  capa.position.set(CX, 0, CZ)
  penhasco.add(capa)
  // neve escorrendo pela face
  for (const [a, len] of [[-0.55, 0.28], [0.1, 0.36], [0.65, 0.22], [1.2, 0.3], [-0.15, 0.18]] as const) {
    const pingo = capsule(0.07, len, NEVE, { roughness: 0.78 })
    pingo.position.set(CX + Math.cos(a) * 0.97, CT - len * 0.5, CZ + Math.sin(a) * 0.97)
    penhasco.add(pingo)
  }
  // monte de neve acumulado no pé do penhasco
  for (const [a, r] of [[0.0, 0.32], [0.6, 0.28], [-0.5, 0.3], [1.2, 0.26]] as const) {
    const monte = sphere(r, NEVE_SOMBRA, { roughness: 0.82 })
    monte.scale.set(1.25, 0.55, 1)
    monte.position.set(CX + Math.cos(a) * 1.12, GY, CZ + Math.sin(a) * 1.12)
    penhasco.add(monte)
  }
  root.add(penhasco)

  // ---- pinheiro na beira do penhasco --------------------------------------
  const pinho = pinheiro(1.15, 4)
  pinho.position.set(CX - 0.45, CS - 0.04, CZ - 0.42)
  root.add(pinho)

  // ---- nuvem chumbo no alto -----------------------------------------------
  const nuvem = new THREE.Group()
  for (const [x, y, z, r, s] of [
    [-1.55, -0.05, 0, 0.5, 1], [-0.7, 0.12, -0.05, 0.62, 2], [0.35, 0.18, 0, 0.66, 3],
    [1.35, 0.06, -0.05, 0.56, 4], [2.1, -0.08, 0.05, 0.42, 5], [-0.15, -0.12, 0.3, 0.45, 6],
    [0.95, -0.14, 0.32, 0.42, 7],
  ] as const) {
    const bolo = puff(r, s % 2 ? NUVEM : NUVEM_ESC, 5, 70 + s, { roughness: 0.95 })
    bolo.position.set(x, y, z)
    bolo.scale.set(1, 0.72, 0.8)
    nuvem.add(bolo)
  }
  nuvem.position.set(0.15, 3.55, -1.05)
  root.add(nuvem)

  // ---- neviscos: flocos miúdos no ar ---------------------------------------
  const neviscos = new THREE.Group()
  const randN = rng(91)
  let n = 0
  while (n < 26) {
    const x = -2.5 + randN() * 5
    const y = 0.75 + randN() * 2.5
    const z = -1.2 + randN() * 2.6
    // fora do volume do lemingue e do penhasco
    if (Math.abs(x - P_AR[0]) < 0.85 && y > 1.5 && y < 3.3 && Math.abs(z - P_AR[2]) < 0.8) continue
    if (x < -0.6 && y < 1.6) continue
    const floquinho = sphere(0.035 + randN() * 0.03, GELO, { emissive: GELO_BRILHO, emissiveIntensity: 0.3 }, 10)
    floquinho.position.set(x, y, z)
    neviscos.add(floquinho)
    n++
  }
  root.add(neviscos)

  // ---- flocos gigantes -----------------------------------------------------
  const flocos = [
    { r: 0.3, p: [-0.55, 2.5, 0.65], rot: [-0.2, 0.25, 0.3] },
    { r: 0.34, p: [1.95, 2.55, 0.05], rot: [-0.15, -0.35, 0.1] },
    { r: 0.28, p: [1.75, 1.05, 1.05], rot: [-0.35, -0.3, 0.5] },
  ].map(({ r, p, rot }) => {
    const f = floco(r)
    f.position.set(p[0], p[1], p[2])
    f.rotation.set(rot[0], rot[1], rot[2])
    root.add(f)
    return f
  })

  // ---- prancha de snowboard turquesa (com fixações) ------------------------
  const prancha = new THREE.Group()
  prancha.position.set(...P_AR)
  prancha.rotation.set(P_TILT_X, 0, P_TILT_Z)
  root.add(prancha)

  const tabua = new THREE.Mesh(snowboardGeo(), mat(TURQUESA, { roughness: 0.3, size: 1.5 }))
  tabua.castShadow = true
  tabua.receiveShadow = true
  prancha.add(tabua)
  // filete escuro na borda (a base) para a silhueta da prancha
  const baseTabua = new THREE.Mesh(snowboardGeo(), mat(TURQUESA_ESC, { roughness: 0.4, size: 1.5 }))
  baseTabua.scale.set(1.012, 1, 1.03)
  baseTabua.position.y = -0.012
  baseTabua.castShadow = true
  prancha.add(baseTabua)
  // faixa amarela em diagonal no bico e no rabo
  for (const sx of [-1, 1]) {
    const faixa = rbox(0.11, 0.012, 0.34, 0.004, AMARELO, { roughness: 0.35 })
    faixa.position.set(sx * 0.44, 0.028, 0)
    faixa.rotation.y = sx * 0.45
    prancha.add(faixa)
  }
  // fixações: placa + encosto + tira
  for (const sx of [-1, 1]) {
    const placa = rbox(0.2, 0.03, 0.3, 0.012, FIXACAO, { roughness: 0.5 })
    placa.position.set(sx * 0.24, 0.04, 0.02)
    prancha.add(placa)
    const encosto = rbox(0.16, 0.16, 0.035, 0.015, FIXACAO, { roughness: 0.5 })
    encosto.position.set(sx * 0.24, 0.12, -0.13)
    encosto.rotation.x = -0.2
    prancha.add(encosto)
    const tira = rbox(0.17, 0.04, 0.07, 0.015, AMARELO, { roughness: 0.45 })
    tira.position.set(sx * 0.24, 0.14, 0.06)
    prancha.add(tira)
  }

  // ---- LEMINGUE (filho da prancha: viaja com ela) --------------------------
  const lemingue = new THREE.Group()
  lemingue.position.set(0, 0.06, 0)
  lemingue.rotation.set(0.06, 0, -0.2)
  prancha.add(lemingue)

  for (const sx of [-1, 1]) {
    const pe = capsule(0.07, 0.12, ROSA, { roughness: 0.6 })
    pe.rotation.x = Math.PI / 2
    pe.position.set(sx * 0.24, 0.04, 0.06)
    lemingue.add(pe)
    const perna = capsule(0.1, 0.08, DOURADO, { roughness: 0.88 })
    perna.position.set(sx * 0.22, 0.15, 0.02)
    lemingue.add(perna)
  }
  const corpo = sphere(0.43, DOURADO, { roughness: 0.88 })
  corpo.scale.set(1.05, 0.98, 0.95)
  corpo.position.y = 0.52
  lemingue.add(corpo)
  const barriga = sphere(0.33, DOURADO_CLARO, { roughness: 0.88 })
  barriga.scale.set(1, 1.05, 0.9)
  barriga.position.set(0, 0.46, 0.15)
  lemingue.add(barriga)
  const manta = sphere(0.39, PELO_PRETO, { roughness: 0.9 })
  manta.scale.set(1.0, 0.9, 0.95)
  manta.position.set(0, 0.68, -0.13)
  lemingue.add(manta)
  const rabinho = sphere(0.06, DOURADO, { roughness: 0.88 })
  rabinho.position.set(0, 0.3, -0.42)
  lemingue.add(rabinho)

  // ---- cabeça de boca aberta, gritando de alegria --------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.0, 0.08)
  cabeca.rotation.x = -0.08
  lemingue.add(cabeca)

  const cranio = sphere(0.33, DOURADO, { roughness: 0.88 })
  cranio.scale.set(1.08, 0.95, 0.98)
  cabeca.add(cranio)
  const gorro = sphere(0.31, PELO_PRETO, { roughness: 0.9 })
  gorro.scale.set(1.08, 0.82, 1.0)
  gorro.position.set(0, 0.1, -0.07)
  cabeca.add(gorro)
  for (const sx of [-1, 1]) {
    const bochecha = sphere(0.14, DOURADO_CLARO, { roughness: 0.88 })
    bochecha.position.set(sx * 0.15, -0.1, 0.2)
    cabeca.add(bochecha)
    const orelha = sphere(0.075, DOURADO, { roughness: 0.88 })
    orelha.scale.set(0.6, 1, 0.8)
    orelha.position.set(sx * 0.28, 0.15, -0.02)
    cabeca.add(orelha)
    const olho = sphere(0.055, '#15110f', { roughness: 0.15 })
    olho.position.set(sx * 0.13, 0.07, 0.27)
    cabeca.add(olho)
    const brilho = sphere(0.017, '#ffffff', { roughness: 0.2 })
    brilho.position.set(sx * 0.13 + 0.018, 0.09, 0.318)
    cabeca.add(brilho)
    const dente = rbox(0.04, 0.06, 0.02, 0.008, DENTE, { roughness: 0.3 })
    dente.position.set(sx * 0.022, -0.105, 0.375)
    cabeca.add(dente)
  }
  const focinho = sphere(0.12, DOURADO_CLARO, { roughness: 0.86 })
  focinho.scale.set(1.1, 0.85, 0.9)
  focinho.position.set(0, -0.04, 0.28)
  cabeca.add(focinho)
  const nariz = sphere(0.04, ROSA, { roughness: 0.35 })
  nariz.position.set(0, 0.0, 0.385)
  cabeca.add(nariz)
  const boca = sphere(0.1, BOCA, { roughness: 0.5 })
  boca.scale.set(1.15, 0.95, 0.55)
  boca.position.set(0, -0.16, 0.32)
  cabeca.add(boca)
  const lingua = sphere(0.05, ROSA, { roughness: 0.4 })
  lingua.scale.set(1.2, 0.6, 1)
  lingua.position.set(0, -0.2, 0.35)
  cabeca.add(lingua)

  // ---- patinhas abertas como asas (pivô no ombro) --------------------------
  const bracos = [-1, 1].map((sx) => {
    const braco = new THREE.Group()
    braco.position.set(sx * 0.36, 0.64, 0.12)
    braco.rotation.z = sx * ASA
    const osso = capsule(0.085, 0.2, DOURADO, { roughness: 0.88 })
    osso.rotation.z = Math.PI / 2
    osso.position.x = sx * 0.16
    braco.add(osso)
    const mao = sphere(0.088, DOURADO_CLARO, { roughness: 0.86 })
    mao.position.x = sx * 0.33
    braco.add(mao)
    for (const dy of [-0.035, 0, 0.035]) {
      const garra = cone(0.018, 0.065, ROSA, { roughness: 0.4 }, 10)
      garra.rotation.z = -sx * Math.PI / 2
      garra.position.set(sx * 0.43, dy, 0.02)
      braco.add(garra)
    }
    lemingue.add(braco)
    return braco
  })

  // ---- rastro de neve espirrada: da beira do penhasco até a prancha ---------
  const rastro = new THREE.Group()
  const E = new THREE.Vector3(-0.68, CS - 0.06, 0.18) // beira do penhasco
  rastro.position.copy(E)
  root.add(rastro)
  {
    // rabo da prancha no mundo (pose final)
    const rabo = new THREE.Vector3(-0.72, 0, 0)
      .applyEuler(new THREE.Euler(P_TILT_X, 0, P_TILT_Z))
      .add(new THREE.Vector3(...P_AR))
      .sub(E)
    const ctrl = new THREE.Vector3(rabo.x * 0.35, rabo.y * 1.15 + 0.12, rabo.z * 0.5)
    const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), ctrl, rabo)
    const randR = rng(33)
    const N = 11
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1)
      const p = curva.getPoint(k)
      const r = 0.07 + Math.sin(k * Math.PI) * 0.05 + (1 - k) * 0.05
      const bolha = sphere(r, i % 3 ? NEVE : '#ffffff', { roughness: 0.75 }, 16)
      bolha.position.set(
        p.x + (randR() - 0.5) * 0.06,
        p.y + (randR() - 0.5) * 0.06,
        p.z + (randR() - 0.5) * 0.1,
      )
      rastro.add(bolha)
      // respingos soltos ao redor do rastro
      if (i % 2 === 0) {
        const gota = sphere(0.03 + randR() * 0.02, NEVE, { roughness: 0.75 }, 10)
        gota.position.set(p.x + (randR() - 0.5) * 0.3, p.y - 0.1 - randR() * 0.15, p.z + (randR() - 0.5) * 0.3)
        rastro.add(gota)
      }
    }
    // explosão de neve na beira
    const estouro = puff(0.15, NEVE, 5, 44, { roughness: 0.78 })
    estouro.position.set(0.02, 0.02, 0)
    rastro.add(estouro)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'penhasco', object: base },
    { name: 'penhasco', group: 'penhasco', object: penhasco },
    { name: 'pinheiro', group: 'penhasco', object: pinho },
    { name: 'prancha', group: 'lemingue', object: prancha },
    { name: 'lemingue', group: 'lemingue', object: lemingue },
    { name: 'cabeca', group: 'lemingue', object: cabeca },
    { name: 'bracoE', group: 'de', object: bracos[0] },
    { name: 'bracoD', group: 'de', object: bracos[1] },
    { name: 'nuvem', group: 'flocos', object: nuvem },
    { name: 'neviscos', group: 'flocos', object: neviscos },
    { name: 'floco1', group: 'flocos', object: flocos[0] },
    { name: 'floco2', group: 'flocos', object: flocos[1] },
    { name: 'floco3', group: 'flocos', object: flocos[2] },
    { name: 'rastro', group: 'salto', object: rastro },
  ]

  // ---- montagem ------------------------------------------------------------
  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const T = 7.3 // o salto
  const cair = (i: number, at: number) => {
    const f = flocos[i]
    return seq(`floco${i + 1}-cai`, `floco${i + 1}`, at, 1.0, [
      ch('position.y', f.position.y + 2.6, f.position.y),
      ch('rotation.z', f.rotation.z - 2.4, f.rotation.z),
    ], { ease: 'easeOut' })
  }

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Fim de outubro e nada de neve: um penhasco sobe do chão, com um pinheiro na beira.',
    }),
    seq('penhasco-rise', 'penhasco', 0.35, 0.9, [riseFrom(0, 1.4)], { ease: 'easeOut' }),
    seq('pinheiro-cresce', 'pinheiro', 1.0, 0.6, grow(), { ease: 'easeOut' }),

    seq('prancha-surge', 'prancha', 1.9, 0.5, [
      ...grow(),
      ch('position.x', P_CLIFF[0], P_CLIFF[0]),
      ch('position.y', P_CLIFF[1], P_CLIFF[1]),
      ch('position.z', P_CLIFF[2], P_CLIFF[2]),
      ch('rotation.x', 0, 0),
      ch('rotation.z', 0, 0),
    ], {
      ease: 'easeOut',
      caption: 'Lá em cima, um LEMINGUE gorducho chega com a prancha de snowboard turquesa…',
    }),
    seq('lemingue-surge', 'lemingue', 2.4, 0.6, grow(), { ease: 'easeOut' }),
    seq('cabeca-sobe', 'cabeca', 2.6, 0.5, [ch('position.y', 0.75, 1.0)], { ease: 'easeOut' }),
    seq('bracoE-surge', 'bracoE', 2.7, 0.4, grow(), { ease: 'easeOut' }),
    seq('bracoD-surge', 'bracoD', 2.7, 0.4, grow(), { ease: 'easeOut' }),

    seq('cabeca-olha-ceu', 'cabeca', 3.8, 0.6, [ch('rotation.x', -0.08, -0.45)], {
      caption: '…olha pro céu cinza e implora, de patinhas pro alto: "DÊ!"',
    }),
    seq('bracoE-implora', 'bracoE', 3.8, 0.6, [ch('rotation.z', -ASA, -IMPLORA)], { ease: 'easeOut' }),
    seq('bracoD-implora', 'bracoD', 3.8, 0.6, [ch('rotation.z', ASA, IMPLORA)], { ease: 'easeOut' }),

    seq('nuvem-chega', 'nuvem', 5.2, 0.7, [...grow(0.3), ch('position.y', 4.3, 3.55)], {
      ease: 'easeOut',
      caption: 'O céu dá — e dá demais: flocos do tamanho de pizzas despencam todos de uma vez!',
    }),
    seq('neviscos-caem', 'neviscos', 5.5, 1.4, [ch('position.y', 2.2, 0)], { ease: 'easeOut' }),
    cair(0, 5.6),
    cair(1, 5.85),
    cair(2, 6.1),

    seq('salto-x', 'prancha', T, 1.15, [
      ch('position.x', P_CLIFF[0], P_AR[0]),
      ch('position.z', P_CLIFF[2], P_AR[2]),
      ch('rotation.y', -Math.PI * 2, 0),
      ch('rotation.x', 0, P_TILT_X),
      ch('rotation.z', 0, P_TILT_Z),
    ], {
      ease: 'easeInOut',
      caption: 'Ele salta do penhasco: a prancha de SNOW voa no AR, girando entre os flocos gigantes!',
    }),
    seq('salto-sobe', 'prancha', T, 0.6, [ch('position.y', P_CLIFF[1], P_APEX)], { ease: 'easeOut' }),
    seq('salto-desce', 'prancha', T + 0.6, 0.55, [ch('position.y', P_APEX, P_AR[1])], { ease: 'easeInOut' }),
    seq('bracoE-asa', 'bracoE', T, 0.5, [ch('rotation.z', -IMPLORA, -ASA)], { ease: 'easeOut' }),
    seq('bracoD-asa', 'bracoD', T, 0.5, [ch('rotation.z', IMPLORA, ASA)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', T, 0.5, [ch('rotation.x', -0.45, -0.08)], { ease: 'easeOut' }),
    seq('rastro-espirra', 'rastro', T + 0.9, 0.6, grow(), { ease: 'easeOut' }),

    seq('cabeca-berra', 'cabeca', T + 2.0, 0.3, [ch('rotation.x', -0.08, -0.3)], {
      ease: 'easeOut',
      caption: 'Det snöar! — Está nevando!',
    }),
    seq('cabeca-assenta', 'cabeca', T + 2.3, 0.4, [ch('rotation.x', -0.3, -0.08)], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 3.0, 6.3], target: [0.05, 1.8, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-snoar',
    contexto:
      "Clima: a primeira neve do ano, em outubro ou novembro — alguém olha pela janela do escritório, da pré-escola ou do ônibus e anuncia 'Det snöar!', e as crianças correm pra fora. Também serve de desculpa no grupo do trabalho: com neve, o trem e o trânsito param.",
    fraseFonte: 'Está nevando!',
    fraseAlvo: 'Det snöar!',
    pronuncia:
      "dê SNÖÖ-ar! ('det' = dê, o T não soa; 'snöar' com o S colado direto no N — nada do 'is' que o brasileiro põe antes de S + consoante —, Ö LONGO e fechado: lábios em bico de Ô com a língua lá na frente, no lugar do Ê, bem esticado; o -ar fraquinho, A curto e R de um toque só, que é o presente — sem ele sobra 'snöa', o infinitivo; a força toda no SNÖ)",
    ponteSonora:
      "DÊ! SNOW... AR! (3 sílabas: dê-SNÖÖ-ar; a força toda no SNÖ; DÊ = o 'det' de sempre, o MESMO DÊ de 'Det regnar igen' e 'Det gör inget': Ê FECHADO e sem T — e aqui ele serve de apoio pro S: diga DÊS-NÔ num fôlego só, o S grudado no DÊ, porque o brasileiro tende a enfiar um 'is' antes de S + consoante ('dê is-nô'), e em sueco não há vogal nenhuma entre o S e o N; SNOW = o 'snow' de SNOWBOARD — e é a mesma palavra: snö é neve, prima do inglês snow —, mas SEM o U do fim do inglês (nada de 'snôu'): Ô FECHADO e LONGO, esticado, com os lábios no bico do Ô e a língua empurrada pra frente, no lugar do Ê — é o ö fechado, o mesmo be-RRÖ-ver de 'Jag behöver ett BankID'; AR = o AR onde a prancha voa: A curto e um R de UM toque só, de 'caro' — nunca o 'ah' carioca de fim de palavra —, fraquinho mas OBRIGATÓRIO: é o -ar do presente, o mesmo do NAR(iz) de 'Det regnar igen'; sem ele sobra 'snöa', o infinitivo)",
    historia:
      "Fim de outubro e nada de neve: o lemingue sobe no penhasco com a prancha de snowboard debaixo do braço, olha pro céu cinza e implora de patinhas juntas: 'DÊ!'. O céu dá — e dá demais: flocos do tamanho de pizzas despencam todos de uma vez. O lemingue salta do penhasco e a prancha de SNOW voa no AR, girando entre os flocos gigantes, enquanto ele berra de felicidade. SNOW no AR: está nevando!",
  },
  createScene,
  refine: { organic: ['lemingue', 'cabeca', 'bracoE', 'bracoD', 'nuvem'] },
}

export default card
