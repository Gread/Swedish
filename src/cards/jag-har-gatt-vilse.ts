import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Jag har gått vilse." — IÁ, RRÁR! GÓT... VÍL-SE!
 *
 * Expedição na selva, sol de quarenta graus, e o explorador é GÓTICO: safári
 * todo preto, capacete colonial preto de fita roxa, pó branco no rosto, batom
 * preto e bigodinho torcido de VILÃO. Debaixo da sombrinha de renda, ele dá de
 * cara com um anel fechado de pegadas — as dele: andou em círculo. A bússola
 * gira feito ventilador, a maquiagem escorre e ele berra: o GÓTICO VIL SE
 * perdeu.
 *
 * Diorama: clareira de terra vermelha batida cercada de palmeiras; explorador
 * grande no centro, dentro do anel de pegadas; sombrinha erguida à esquerda,
 * bússola na frente do peito à direita e o sol emissivo no alto, à direita.
 * Acento saturado RESERVADO à agulha vermelha da bússola (o "se perdeu").
 */

// ---- paleta -----------------------------------------------------------------
const SOLO = '#5a3324'
const TERRA = '#a65b3b'
const TERRA_ESC = '#91503a'
const FOLHA = '#377d3d'
const FOLHA_CLARA = '#4b9446'
const FOLHA_ESC = '#285f31'
const CAULE = '#6b7a32'
const TRONCO = '#86643f'
const TRONCO_ESC = '#6a4c2f'
const PEDRA = '#8b7d6e'
const PRETO = '#2b2631' // safári preto, puxado pro roxo pra ler volume
const PRETO_FUNDO = '#18151b'
const CARVAO = '#3e3747'
const PO = '#f1ece7' // rosto empoado
const ROXO = '#6d4a8f' // fita do capacete, olheiras
const PRATA = '#c5c8ce'
const RENDA = '#2d2634'
const RENDA_CLARA = '#7d7189'
const OURO = '#d6a338'
const MOSTRADOR = '#f3e9d2'
const VERMELHO = '#e3261c' // acento saturado RESERVADO: a agulha da bússola
const SUOR = '#7cc6ef'
const PEGADA = '#2a1c1a'
const SOL = '#ffd84a'

const GY = 0.2 // topo da clareira
const S = 1.2 // escala do explorador (person de 1.5 → 1.8)
const AGULHA_Z = 2.35 // pose final da agulha: torta, apontando pra lugar nenhum
const BRACO_E = -2.36 // braço esquerdo erguido segurando a sombrinha
const SUN: [number, number, number] = [1.6, 2.42, -1.9]

/** Fronde de palmeira: nervura em arco ao longo de +x, folíolos dos dois lados. */
function fronde(len: number, seed: number, color: string) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const N = 9
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    pts.push(new THREE.Vector3(t * len, len * (0.55 * t - 0.75 * t * t), 0))
  }
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < N; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const d = b.clone().sub(a)
    const r0 = 0.024 * (1 - (i / N) * 0.7)
    const r1 = 0.024 * (1 - ((i + 1) / N) * 0.7)
    const seg = cylinder(r1, r0, d.length() + 0.01, CAULE, { roughness: 0.7 }, 10)
    seg.position.copy(a).add(b).multiplyScalar(0.5)
    seg.quaternion.setFromUnitVectors(up, d.normalize())
    g.add(seg)
  }
  for (let i = 1; i < N; i++) {
    const t = i / N
    const L = len * 0.34 * Math.sin(Math.PI * (0.18 + 0.72 * t))
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.copy(pts[i])
      // lâmina em pé no plano xy crescendo em +y: Rz varre pra ponta, Rx
      // deita para ±z e deixa cair
      pivot.rotation.set(side * (Math.PI / 2 + 0.3 + t * 0.45 + rand() * 0.1), 0, -0.55)
      const blade = cone(0.06, L, color, { roughness: 0.6 }, 12)
      blade.scale.z = 0.16
      blade.position.y = L / 2
      pivot.add(blade)
      g.add(pivot)
    }
  }
  return g
}

/** Touceira de frondes saindo do chão (ou do topo de um tronco). */
function coroa(n: number, len: number, seed: number, azStart: number, azSpan: number, elev: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const cores = [FOLHA, FOLHA_CLARA, FOLHA_ESC]
  for (let i = 0; i < n; i++) {
    const f = fronde(len * (0.85 + rand() * 0.3), seed * 10 + i, cores[i % 3])
    const az = azStart + (n === 1 ? 0 : (i / (n - 1)) * azSpan) + (rand() - 0.5) * 0.25
    f.rotation.set(0, az, elev + (rand() - 0.5) * 0.35)
    g.add(f)
  }
  return g
}

/** Palmeira: tronco de gomos inclinado + coroa de frondes. */
function palmeira(height: number, lean: number, seed: number, len: number) {
  const g = new THREE.Group()
  const gomos = 7
  const h = height / gomos
  let x = 0
  let y = 0
  for (let i = 0; i < gomos; i++) {
    const r = 0.13 - i * 0.008
    const gomo = cylinder(r * 0.82, r, h * 1.05, i % 2 ? TRONCO : TRONCO_ESC, { roughness: 0.85 }, 14)
    const tilt = lean * (i / gomos)
    gomo.position.set(x + Math.sin(tilt) * h * 0.5, y + Math.cos(tilt) * h * 0.5, 0)
    gomo.rotation.z = -tilt
    g.add(gomo)
    x += Math.sin(tilt) * h
    y += Math.cos(tilt) * h
  }
  const topo = coroa(7, len, seed, 0, Math.PI * 2 * (6 / 7), 0.25)
  topo.position.set(x, y, 0)
  g.add(topo)
  for (const [cx, cz] of [[0.07, 0.05], [-0.06, 0.06], [0.0, -0.08]] as const) {
    const coco = sphere(0.075, '#5b4228', { roughness: 0.7 })
    coco.position.set(x + cx, y - 0.08, cz)
    g.add(coco)
  }
  return g
}

/** Gota de suor: corpo redondo + rabicho apontando de volta pra testa. */
function gota() {
  const g = new THREE.Group()
  const bola = sphere(0.042, SUOR, { roughness: 0.12 })
  g.add(bola)
  const rabo = cone(0.04, 0.09, SUOR, { roughness: 0.12 }, 16)
  rabo.rotation.x = Math.PI
  rabo.position.y = -0.05
  g.add(rabo)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(31)

  // ---- clareira de terra batida -------------------------------------------
  const chao = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.14, SOLO, { roughness: 0.95 })
  soil.position.y = 0.07
  chao.add(soil)

  const clareira = cylinder(2.52, 2.6, 0.06, TERRA, { roughness: 0.92 })
  clareira.position.y = GY - 0.03
  chao.add(clareira)

  // manchas de terra mais escura, fora do anel de pegadas
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand() * 0.5
    const r = 1.55 + rand() * 0.6
    const mancha = sphere(0.22 + rand() * 0.12, TERRA_ESC, { roughness: 0.95 })
    mancha.scale.set(1.5, 0.05, 1)
    mancha.rotation.y = rand() * Math.PI
    mancha.position.set(Math.cos(a) * r, GY, Math.sin(a) * r)
    chao.add(mancha)
  }

  // capim na borda da clareira
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 + rand() * 0.1
    const r = 2.38 + rand() * 0.12
    const tufo = new THREE.Group()
    tufo.position.set(Math.cos(a) * r, GY, Math.sin(a) * r)
    for (let k = 0; k < 3; k++) {
      const hh = 0.16 + rand() * 0.12
      const fio = cone(0.03, hh, k % 2 ? FOLHA : FOLHA_ESC, { roughness: 0.8 }, 6)
      fio.position.set((rand() - 0.5) * 0.08, hh / 2, (rand() - 0.5) * 0.08)
      fio.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6)
      tufo.add(fio)
    }
    chao.add(tufo)
  }

  for (const [px, pz, pr, ps] of [[-2.0, 1.1, 0.16, 3], [1.75, 1.55, 0.12, 5], [2.15, -0.2, 0.18, 7], [-1.25, 1.95, 0.1, 9]] as const) {
    const pedra = rock(pr, PEDRA, ps, { roughness: 0.9 })
    pedra.position.set(px, GY + pr * 0.4, pz)
    pedra.rotation.y = rand() * Math.PI
    chao.add(pedra)
  }
  root.add(chao)

  // ---- selva em volta: palmeiras e touceiras ------------------------------
  const folhagem = new THREE.Group()

  // à esquerda, inclinada pra fora: a coroa não briga com a sombrinha
  const palmaE = palmeira(1.55, -0.4, 3, 1.15)
  palmaE.position.set(-1.85, GY, -1.25)
  palmaE.rotation.y = -0.25
  folhagem.add(palmaE)

  const palmaD = palmeira(1.35, -0.3, 7, 1.1)
  palmaD.position.set(1.55, GY, -1.75)
  palmaD.rotation.y = -0.3
  folhagem.add(palmaD)

  // touceiras baixas: fundo, laterais e cantos da frente (sem tapar as pegadas)
  for (const [tx, tz, n, len, seed, az, span, el] of [
    [0.25, -2.15, 6, 1.15, 11, 0.2, 2.6, 0.85],
    [-2.2, -0.2, 5, 0.95, 13, -0.8, 2.2, 0.7],
    [2.25, -0.45, 5, 0.9, 17, 1.8, 2.4, 0.7],
    [-2.0, 1.25, 4, 0.7, 19, -1.2, 2.2, 0.55],
    [2.05, 1.2, 4, 0.7, 23, 1.6, 2.4, 0.55],
  ] as const) {
    const t = coroa(n, len, seed, az, span, el)
    t.position.set(tx, GY, tz)
    folhagem.add(t)
  }
  root.add(folhagem)

  // ---- sol de rachar --------------------------------------------------------
  const sol = new THREE.Group()
  sol.position.set(...SUN)
  sol.rotation.y = Math.atan2(0.4 - SUN[0], 5.2 - SUN[2])

  const nucleo = sphere(0.3, SOL, { emissive: '#ffc21a', emissiveIntensity: 1.25, roughness: 0.4 })
  sol.add(nucleo)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const raio = cone(0.055, i % 2 ? 0.16 : 0.24, '#ffb52a', { emissive: '#ffa21a', emissiveIntensity: 1.1 }, 12)
    const rr = i % 2 ? 0.43 : 0.47
    raio.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0)
    raio.rotation.z = a - Math.PI / 2
    sol.add(raio)
  }
  root.add(sol)

  // ---- anel fechado de pegadas de bota ---------------------------------------
  const pegadas = new THREE.Group()
  pegadas.position.y = GY + 0.004
  const NP = 16
  const RP = 1.12
  for (let i = 0; i < NP; i++) {
    const a = (i / NP) * Math.PI * 2
    const side = i % 2 ? 1 : -1
    const r = RP + side * 0.075
    const pe = new THREE.Group()
    pe.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
    pe.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a))
    const sola = sphere(0.075, PEGADA, { roughness: 0.95 })
    sola.scale.set(0.8, 0.07, 1.3)
    sola.position.z = 0.05
    pe.add(sola)
    const salto = sphere(0.058, PEGADA, { roughness: 0.95 })
    salto.scale.set(0.85, 0.07, 0.75)
    salto.position.z = -0.105
    pe.add(salto)
    pegadas.add(pe)
  }
  root.add(pegadas)

  // ---- explorador gótico -------------------------------------------------------
  const explorador = new THREE.Group()
  explorador.position.set(0, GY, 0)
  explorador.rotation.y = 0.08
  explorador.scale.setScalar(S)
  root.add(explorador)

  const corpo = person({ body: PRETO, skin: PO, height: 1.5, armAngle: 0.35 })
  corpo.position.y = 0.12
  explorador.add(corpo)

  // coturnos de verniz: cano, biqueira comprida, sola grossa e fivela de prata
  for (const side of [-1, 1]) {
    const cano = cylinder(0.088, 0.095, 0.18, PRETO_FUNDO, { roughness: 0.3 })
    cano.position.set(side * 0.125, 0.13, -0.01)
    explorador.add(cano)
    const bota = capsule(0.072, 0.16, PRETO_FUNDO, { roughness: 0.28 })
    bota.rotation.x = Math.PI / 2
    bota.scale.x = 1.1
    bota.position.set(side * 0.125, 0.082, 0.08)
    explorador.add(bota)
    const sola = rbox(0.17, 0.045, 0.34, 0.02, CARVAO, { roughness: 0.8 })
    sola.position.set(side * 0.125, 0.0225, 0.07)
    explorador.add(sola)
    const fivela = rbox(0.065, 0.05, 0.02, 0.008, PRATA, { roughness: 0.25, metalness: 0.85 })
    fivela.position.set(side * 0.125, 0.16, 0.088)
    explorador.add(fivela)
  }

  // cinto de tachinhas
  const cinto = torus(0.258, 0.034, PRETO_FUNDO, { roughness: 0.4 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.25
  corpo.add(cinto)
  for (let i = 0; i < 9; i++) {
    const a = -1.25 + (i / 8) * 2.5
    if (Math.abs(a) < 0.2) continue // fivela no meio
    const tacha = sphere(0.017, PRATA, { roughness: 0.2, metalness: 0.9 })
    tacha.position.set(Math.sin(a) * 0.288, 0.25, Math.cos(a) * 0.288)
    corpo.add(tacha)
  }
  const fivelaCinto = rbox(0.09, 0.07, 0.025, 0.012, PRATA, { roughness: 0.2, metalness: 0.9 })
  fivelaCinto.position.set(0, 0.25, 0.292)
  corpo.add(fivelaCinto)

  // corrente gótica pendurada no cinto
  for (let k = 0; k < 5; k++) {
    const t = k / 4
    const elo = torus(0.022, 0.006, PRATA, { roughness: 0.25, metalness: 0.85 })
    const a = 0.45 + t * 0.75
    elo.position.set(Math.sin(a) * 0.29, 0.22 - Math.sin(t * Math.PI) * 0.07, Math.cos(a) * 0.29)
    elo.rotation.set(0, a, k % 2 ? Math.PI / 2 : 0)
    corpo.add(elo)
  }

  // bolsos de safári com botão de prata
  for (const side of [-1, 1]) {
    const bolso = rbox(0.1, 0.09, 0.03, 0.012, CARVAO, { roughness: 0.85 })
    bolso.position.set(side * 0.105, 0.5, 0.232)
    bolso.rotation.y = side * 0.42
    corpo.add(bolso)
    const aba = rbox(0.11, 0.03, 0.035, 0.01, PRETO_FUNDO, { roughness: 0.8 })
    aba.position.set(side * 0.107, 0.548, 0.236)
    aba.rotation.y = side * 0.42
    corpo.add(aba)
    const botao = sphere(0.012, PRATA, { roughness: 0.2, metalness: 0.9 })
    botao.position.set(side * 0.112, 0.535, 0.252)
    corpo.add(botao)
  }

  // ---- rosto: pó branco, olheiras roxas, rímel escorrendo, batom preto -------
  const head = corpo.getObjectByName('head') as THREE.Group

  // profundidades medidas na cabeça-base (bases.glb): tudo encostado na pele
  for (const side of [-1, 1]) {
    const olheira = sphere(0.05, ROXO, { roughness: 0.6 })
    olheira.scale.set(1.25, 0.42, 0.4)
    olheira.position.set(side * 0.108, -0.028, 0.232)
    head.add(olheira)

    const sobrancelha = rbox(0.11, 0.026, 0.03, 0.01, PRETO_FUNDO, { roughness: 0.7 })
    sobrancelha.position.set(side * 0.105, 0.108, 0.248)
    sobrancelha.rotation.set(0, side * 0.45, side * 0.32)
    head.add(sobrancelha)

    // rímel escorrendo pelas bochechas (a maquiagem derrete no calor)
    for (const [dx, len, dz] of [[0.168, 0.07, 0.19]] as const) {
      const rimel = capsule(0.0095, len, PRETO_FUNDO, { roughness: 0.35 })
      rimel.position.set(side * dx, -0.045 - len / 2, dz)
      head.add(rimel)
      const pingo = sphere(0.0145, PRETO_FUNDO, { roughness: 0.35 })
      pingo.position.set(side * dx, -0.045 - len - 0.006, dz)
      head.add(pingo)
    }

    // cabelo preto liso caindo até os ombros, emoldurando o rosto
    for (const [mx, mz, len] of [[0.255, -0.01, 0.3], [0.27, -0.11, 0.34], [0.22, -0.2, 0.36]] as const) {
      const mecha = capsule(0.045, len, PRETO_FUNDO, { roughness: 0.7 })
      mecha.position.set(side * mx, -0.04 - len * 0.25, mz)
      mecha.rotation.z = side * 0.06
      head.add(mecha)
    }
  }
  const nuca = sphere(0.27, PRETO_FUNDO, { roughness: 0.75 })
  nuca.scale.set(1.05, 1.05, 0.85)
  nuca.position.set(0, 0.0, -0.1)
  head.add(nuca)

  // boca escancarada berrando, de batom preto (inclinada como o queixo)
  const boca = new THREE.Group()
  boca.position.set(0, -0.185, 0.228)
  boca.rotation.x = 0.4
  head.add(boca)
  const garganta = sphere(0.05, '#3b1220', { roughness: 0.7 })
  garganta.scale.set(1, 1.25, 0.55)
  boca.add(garganta)
  const labios = torus(0.05, 0.017, PRETO_FUNDO, { roughness: 0.22 })
  labios.scale.set(1, 1.2, 1)
  labios.position.z = 0.01
  boca.add(labios)
  const dentes = rbox(0.064, 0.018, 0.02, 0.008, '#f6f3ea', { roughness: 0.3 })
  dentes.position.set(0, 0.04, 0.008)
  boca.add(dentes)
  const lingua = sphere(0.027, '#9b3a4a', { roughness: 0.6 })
  lingua.scale.set(1.3, 0.6, 0.8)
  lingua.position.set(0, -0.038, 0.005)
  boca.add(lingua)

  // ---- bigodinho de vilão, pontas torcidas pra cima ---------------------------
  // fio fino caindo para os lados, acompanhando a bochecha, e terminando num
  // gancho que sobe por fora
  const bigode = new THREE.Group()
  bigode.position.set(0, -0.092, 0.268)
  head.add(bigode)
  const no = sphere(0.021, PRETO_FUNDO, { roughness: 0.45 })
  no.scale.set(1.3, 0.8, 0.8)
  bigode.add(no)
  const RC = 0.024
  for (const side of [-1, 1]) {
    const fio = capsule(0.016, 0.085, PRETO_FUNDO, { roughness: 0.45 })
    fio.rotation.set(0, side * 0.25, -side * (Math.PI / 2 + 0.2))
    fio.position.set(side * 0.056, -0.011, -0.007)
    bigode.add(fio)
    const caracol = new THREE.Mesh(
      new THREE.TorusGeometry(RC, 0.009, 8, 28, Math.PI * 0.95),
      mat(PRETO_FUNDO, { roughness: 0.45 }),
    )
    caracol.castShadow = true
    // começa embaixo (na ponta do fio), sobe por fora e vira pra dentro no alto
    caracol.rotation.set(0, (side < 0 ? Math.PI : 0) + side * 0.35, -Math.PI / 2)
    caracol.position.set(side * 0.1, -0.02 + RC, -0.024)
    bigode.add(caracol)
    const fim = -Math.PI / 2 + Math.PI * 0.95
    const ponta = sphere(0.0105, PRETO_FUNDO, { roughness: 0.45 })
    ponta.position.set(side * (0.1 + Math.cos(fim) * RC * Math.cos(0.35)), -0.02 + RC + Math.sin(fim) * RC, -0.024 - Math.cos(fim) * RC * Math.sin(0.35))
    bigode.add(ponta)
  }

  // ---- capacete colonial preto de fita roxa ----------------------------------
  // perfil de sino: copa arredondada que desce contínua até a aba caída
  const capacete = new THREE.Group()
  capacete.position.set(0, 0.135, -0.02)
  capacete.rotation.set(-0.24, 0, 0.08)
  head.add(capacete)
  const casco = lathe(
    [
      [0.43, -0.098], [0.452, -0.092], [0.442, -0.06], [0.415, -0.02], [0.375, 0.016],
      [0.335, 0.042], [0.308, 0.075], [0.298, 0.13], [0.28, 0.195], [0.238, 0.258],
      [0.17, 0.302], [0.085, 0.325], [0, 0.33],
    ],
    PRETO,
    { roughness: 0.45 },
  )
  ;(casco.material as THREE.Material).side = THREE.DoubleSide
  casco.scale.set(0.95, 1, 1.2)
  capacete.add(casco)
  const fita = torus(0.302, 0.028, ROXO, { roughness: 0.6 })
  fita.rotation.x = Math.PI / 2
  fita.scale.set(0.95, 1.2, 1)
  fita.position.y = 0.088
  capacete.add(fita)
  const botaoTopo = sphere(0.032, PRETO_FUNDO, { roughness: 0.35 })
  botaoTopo.scale.y = 0.6
  botaoTopo.position.y = 0.33
  capacete.add(botaoTopo)

  // ---- suor voando da testa -------------------------------------------------
  const suor = new THREE.Group()
  head.add(suor)
  const up = new THREE.Vector3(0, 1, 0)
  for (const p of [[0.5, 0.12, 0.2], [0.6, -0.06, 0.12], [0.54, 0.34, 0.12], [-0.44, -0.1, 0.3], [0.36, -0.02, 0.38]] as const) {
    const g = gota()
    const v = new THREE.Vector3(...p)
    g.position.copy(v)
    g.quaternion.setFromUnitVectors(up, v.clone().normalize())
    suor.add(g)
  }

  // ---- braços: esquerdo ergue a sombrinha, direito estende a bússola ----------
  const bracoE = corpo.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoE, 1.5)
  bracoE.rotation.z = BRACO_E
  const bracoD = corpo.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoD, 1.5)
  bracoD.rotation.set(-1.15, 0, 0.12)

  // posição das mãos (no referencial do corpo) para pendurar os adereços
  corpo.updateMatrixWorld(true)
  const maoE = new THREE.Vector3()
  const maoD = new THREE.Vector3()
  bracoE.children[0].getWorldPosition(maoE)
  bracoD.children[0].getWorldPosition(maoD)
  corpo.worldToLocal(maoE)
  corpo.worldToLocal(maoD)

  // ---- sombrinha de renda preta ------------------------------------------------
  const sombrinha = new THREE.Group()
  sombrinha.position.copy(maoE)
  sombrinha.rotation.set(0.3, 0, 0.2)
  corpo.add(sombrinha)

  const gancho = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.016, 10, 24, Math.PI),
    mat(PRETO_FUNDO, { roughness: 0.3 }),
  )
  gancho.castShadow = true
  gancho.rotation.z = Math.PI
  gancho.position.set(0.05, -0.1, 0)
  sombrinha.add(gancho)
  const haste = cylinder(0.014, 0.014, 0.8, CARVAO, { roughness: 0.35, metalness: 0.5 })
  haste.position.y = 0.3
  sombrinha.add(haste)

  const CY = 0.5 // base da cúpula
  const cupula = lathe(
    [[0.54, -0.03], [0.45, 0.04], [0.31, 0.12], [0.15, 0.18], [0, 0.2]],
    RENDA,
    { roughness: 0.75 },
  )
  ;(cupula.material as THREE.Material).side = THREE.DoubleSide
  cupula.position.y = CY
  sombrinha.add(cupula)

  // babado de renda: laçadas em meia-lua penduradas na borda, cada uma com
  // um ilhós — o recorte clássico de renda
  const NF = 20
  const laco = mat(RENDA_CLARA, { roughness: 0.7 })
  for (let i = 0; i < NF; i++) {
    const a = ((i + 0.5) / NF) * Math.PI * 2
    const rr = 0.545
    const meiaLua = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.009, 6, 18, Math.PI), laco)
    meiaLua.castShadow = true
    // arco no plano vertical tangente à borda, pendurado pra baixo
    meiaLua.position.set(Math.cos(a) * rr, CY - 0.03, Math.sin(a) * rr)
    meiaLua.rotation.set(0, Math.PI / 2 - a, Math.PI)
    sombrinha.add(meiaLua)
    const ilhos = torus(0.02, 0.006, RENDA_CLARA, { roughness: 0.7 })
    ilhos.position.set(Math.cos(a) * (rr + 0.004), CY - 0.075, Math.sin(a) * (rr + 0.004))
    ilhos.rotation.y = Math.PI / 2 - a
    sombrinha.add(ilhos)
  }
  // desenho de renda na cúpula: fileiras de ilhós finos deitados na superfície
  // e dois fios concêntricos
  const zAxis = new THREE.Vector3(0, 0, 1)
  for (const [rr, yy, n, size, slope] of [
    [0.44, 0.04, 20, 0.024, 0.6],
    [0.33, 0.106, 15, 0.03, 0.5],
    [0.2, 0.163, 9, 0.028, 0.35],
  ] as const) {
    for (let i = 0; i < n; i++) {
      const a = ((i + (rr > 0.4 ? 0.5 : 0)) / n) * Math.PI * 2
      const flor = torus(size, 0.0055, RENDA_CLARA, { roughness: 0.7 })
      flor.position.set(Math.cos(a) * rr, CY + yy + 0.008, Math.sin(a) * rr)
      const nrm = new THREE.Vector3(Math.cos(a) * slope, 1, Math.sin(a) * slope).normalize()
      flor.quaternion.setFromUnitVectors(zAxis, nrm)
      sombrinha.add(flor)
    }
  }
  for (const [rr, yy] of [[0.385, 0.08], [0.265, 0.14]] as const) {
    const fioRenda = torus(rr, 0.005, RENDA_CLARA, { roughness: 0.7 })
    fioRenda.rotation.x = Math.PI / 2
    fioRenda.position.y = CY + yy + 0.006
    sombrinha.add(fioRenda)
  }
  // varetas por baixo e ponteiras de prata na borda
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const ponteira = sphere(0.017, PRATA, { roughness: 0.25, metalness: 0.85 })
    ponteira.position.set(Math.cos(a) * 0.54, CY - 0.035, Math.sin(a) * 0.54)
    sombrinha.add(ponteira)
    const de = new THREE.Vector3(0, CY - 0.18, 0)
    const ate = new THREE.Vector3(Math.cos(a) * 0.3, CY + 0.1, Math.sin(a) * 0.3)
    const dv = ate.clone().sub(de)
    const vareta = cylinder(0.006, 0.006, dv.length(), CARVAO, { roughness: 0.4, metalness: 0.5 }, 6)
    vareta.position.copy(de).add(ate).multiplyScalar(0.5)
    vareta.quaternion.setFromUnitVectors(up, dv.normalize())
    sombrinha.add(vareta)
  }
  const remate = cone(0.022, 0.09, PRETO_FUNDO, { roughness: 0.3 }, 12)
  remate.position.y = CY + 0.24
  sombrinha.add(remate)

  // ---- bússola dourada grande ---------------------------------------------------
  const bussola = new THREE.Group()
  bussola.position.set(maoD.x - 0.01, maoD.y + 0.16, maoD.z + 0.04)
  bussola.rotation.set(-0.42, -0.12, 0.08)
  corpo.add(bussola)

  const caixa = cylinder(0.19, 0.19, 0.06, OURO, { roughness: 0.28, metalness: 0.85 })
  caixa.rotation.x = Math.PI / 2
  bussola.add(caixa)
  const aro = torus(0.19, 0.026, OURO, { roughness: 0.25, metalness: 0.85 })
  aro.position.z = 0.03
  bussola.add(aro)
  const mostrador = cylinder(0.165, 0.165, 0.012, MOSTRADOR, { roughness: 0.4 })
  mostrador.rotation.x = Math.PI / 2
  mostrador.position.z = 0.03
  bussola.add(mostrador)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const longo = i % 4 === 0
    const marca = rbox(longo ? 0.016 : 0.01, longo ? 0.045 : 0.026, 0.006, 0.003, '#4a3b2a', { roughness: 0.6 })
    const rr = longo ? 0.125 : 0.135
    marca.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0.039)
    marca.rotation.z = a - Math.PI / 2
    bussola.add(marca)
  }
  const argola = torus(0.042, 0.013, OURO, { roughness: 0.25, metalness: 0.85 })
  argola.position.set(0, 0.235, 0)
  argola.rotation.y = Math.PI / 2
  bussola.add(argola)
  const coroaBussola = cylinder(0.022, 0.022, 0.04, OURO, { roughness: 0.25, metalness: 0.85 })
  coroaBussola.position.y = 0.205
  bussola.add(coroaBussola)

  // agulha torta + rastros de giro (giram juntos)
  const agulha = new THREE.Group()
  agulha.position.z = 0.046
  agulha.rotation.z = AGULHA_Z
  bussola.add(agulha)

  const norte = new THREE.Group()
  norte.rotation.z = 0.42 // a dobra: as duas metades não se alinham mais
  agulha.add(norte)
  const pontaN = cone(0.036, 0.15, VERMELHO, { roughness: 0.35 }, 4)
  pontaN.scale.z = 0.35
  pontaN.position.y = 0.075
  norte.add(pontaN)
  const sul = new THREE.Group()
  sul.rotation.z = -0.3
  agulha.add(sul)
  const pontaS = cone(0.032, 0.12, '#e9e2d4', { roughness: 0.4 }, 4)
  pontaS.scale.z = 0.35
  pontaS.rotation.z = Math.PI
  pontaS.position.y = -0.06
  sul.add(pontaS)
  const pino = sphere(0.022, OURO, { roughness: 0.25, metalness: 0.85 })
  pino.position.z = 0.01
  agulha.add(pino)

  for (const k of [0, 1]) {
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(0.245, 0.011, 8, 32, 1.7),
      mat('#fff4dc', { roughness: 0.5 }),
    )
    arco.rotation.z = k * Math.PI
    agulha.add(arco)
    const seta = cone(0.026, 0.06, '#fff4dc', { roughness: 0.5 }, 12)
    const a = k * Math.PI + 1.7
    seta.position.set(Math.cos(a) * 0.245, Math.sin(a) * 0.245, 0)
    seta.rotation.z = a
    agulha.add(seta)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'chao', group: 'clareira', object: chao },
    { name: 'folhagem', group: 'clareira', object: folhagem },
    { name: 'sol', group: 'clareira', object: sol },
    { name: 'explorador', group: 'gotico', object: explorador },
    { name: 'bracoE', group: 'gotico', object: bracoE },
    { name: 'bracoD', group: 'gotico', object: bracoD },
    { name: 'capacete', group: 'gotico', object: capacete },
    { name: 'bigode', group: 'vilao', object: bigode },
    { name: 'sombrinha', group: 'sombrinha', object: sombrinha },
    { name: 'pegadas', group: 'pegadas', object: pegadas },
    { name: 'bussola', group: 'bussola', object: bussola },
    { name: 'agulha', group: 'bussola', object: agulha },
    { name: 'suor', group: 'bussola', object: suor },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const EY = GY

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('chao-rise', 'chao', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Selva, sol de quarenta graus: no meio das palmeiras, uma clareira de terra vermelha…',
    }),
    seq('folhagem-rise', 'folhagem', 0.25, 1.0, [riseFrom(0, 2.8)], { ease: 'easeOut' }),
    seq('sol-sobe', 'sol', 0.6, 1.0, [
      ch('position.y', 1.4, SUN[1]), ch('rotation.z', -1.4, 0), ...grow(0.3),
    ], { ease: 'easeOut' }),

    seq('explorador-rise', 'explorador', 1.9, 0.85, [riseFrom(EY, 2.4)], {
      ease: 'easeOut',
      caption: '…e surge o explorador mais GÓTICO da expedição: safári todo preto, pó branco no rosto, batom preto.',
    }),
    seq('bracoE-pende', 'bracoE', 1.9, 0.85, [ch('rotation.z', 0.35, 0.35)]),
    seq('bracoD-pende', 'bracoD', 1.9, 0.85, [ch('rotation.x', 0, 0), ch('rotation.z', -0.35, -0.35)]),
    seq('capacete-cai', 'capacete', 2.65, 0.45, [
      ch('position.y', 0.95, 0.135), ch('rotation.z', 0.7, 0.08),
    ], { ease: 'easeIn' }),

    seq('bigode-brota', 'bigode', 3.7, 0.6, [...grow(), ch('rotation.z', 0.9, 0)], {
      ease: 'easeOut',
      caption: 'Bigodinho torcido de VILÃO de novela: o GÓTICO VIL.',
    }),

    seq('bracoE-ergue', 'bracoE', 5.1, 0.6, [ch('rotation.z', 0.35, BRACO_E)], {
      ease: 'easeOut',
      caption: 'Três dias atrás do Templo Perdido, debaixo da sombrinha de renda preta…',
    }),
    seq('sombrinha-abre', 'sombrinha', 5.5, 0.7, [
      ch('scale.x', 0.12, 1), ch('scale.y', 0.75, 1), ch('scale.z', 0.12, 1),
      ch('rotation.y', -2.5, 0),
    ], { ease: 'easeOut' }),

    seq('pegadas-surgem', 'pegadas', 6.9, 1.1, [
      ch('scale.x', 0.05, 1), ch('scale.z', 0.05, 1), ch('rotation.y', -2.2, 0),
    ], {
      ease: 'easeOut',
      caption: '…até que ele dá de cara com um anel de pegadas: as DELE. Andou em círculo!',
    }),

    seq('bracoD-estende', 'bracoD', 8.5, 0.5, [ch('rotation.x', 0, -1.15), ch('rotation.z', -0.35, 0.12)], {
      ease: 'easeOut',
      caption: 'A bússola gira feito ventilador, a maquiagem escorre: o GÓTICO VIL SE perdeu!',
    }),
    seq('bussola-surge', 'bussola', 8.75, 0.45, grow(), { ease: 'easeOut' }),
    seq('agulha-gira', 'agulha', 8.9, 1.5, [
      ch('rotation.z', AGULHA_Z - 10 * Math.PI, AGULHA_Z), ...grow(0.3),
    ], { ease: 'easeOut' }),
    seq('suor-espirra', 'suor', 9.2, 0.5, grow(0.3), { ease: 'easeOut' }),

    seq('explorador-pula', 'explorador', 10.5, 0.25, [ch('position.y', EY, EY + 0.14)], {
      ease: 'easeOut',
      caption: 'E ele berra pra selva inteira: IÁ, RRÁR! GÓT… VÍL-SE!',
    }),
    seq('explorador-assenta', 'explorador', 10.75, 0.3, [ch('position.y', EY + 0.14, EY)], { ease: 'easeIn' }),
    seq('suor-de-novo', 'suor', 10.5, 0.25, [
      ch('scale.x', 1, 1.25), ch('scale.y', 1, 1.25), ch('scale.z', 1, 1.25),
    ], { ease: 'easeOut' }),
    seq('suor-volta', 'suor', 10.75, 0.3, [
      ch('scale.x', 1.25, 1), ch('scale.y', 1.25, 1), ch('scale.z', 1.25, 1),
    ]),

    seq('agulha-desembesta', 'agulha', 11.4, 1.0, [ch('rotation.z', AGULHA_Z - 4 * Math.PI, AGULHA_Z)], {
      ease: 'easeOut',
      caption: 'Jag har gått vilse. — Eu me perdi.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.75, 4.7], target: [0.1, 1.22, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-gatt-vilse',
    contexto:
      "Perdido: na trilha do bosque — a Suécia é metade mato: Skåneleden, Kungsleden, o bosque do bairro na época de cogumelo —, numa cidade nova, no labirinto de um shopping ou da loja de móveis, de carro sem sinal no celular. Dito a um passante ou ao telefone pra quem vem te buscar; e é o que se pergunta a uma criança sozinha no mercado: 'Har du gått vilse?'",
    fraseFonte: 'Eu me perdi.',
    fraseAlvo: 'Jag har gått vilse.',
    pronuncia:
      "iá rar gót VÍL-se ('jag' = iá; 'har' com h soprado e R brando, que escorrega no G; 'gått' com G duro de 'gato', Ó ABERTO e CURTO — é o å curto, como em 'måste' — e T seco: soa igualzinho a 'gott'; 'vilse' com a força no VÍL, I curto e L de verdade, com a língua no céu da boca — nunca 'viu-se' —, e o -se curtinho e fraco, com E, nunca 'si'; não estique nem acentue o -se: 'vill SÊ', separado e com Ê longo, é 'quer ver')",
    ponteSonora:
      "IÁ, RRÁR! GÓT... VÍL-SE! (5 sílabas: iá-rrar-GÓT-VÍL-se; força no GÓT e, maior, no VÍL; IÁ, RRÁR é o 'jag har' de sempre — o MESMO de 'Jag har missat bussen' e 'Jag har tappat min plånbok': I de IOGA, nunca J chiado, RR soprado leve, A longo e R BRANDO no fim, que aqui escorrega direto no G; GÓT = o GÓTICO cortado logo depois do T: G duro de 'gato', Ó ABERTO e CURTO — é o å CURTO, o mesmo Ó de 'måste' e 'låst' — e T seco, sem 'tchi'; é exatamente o GÓT de 'Sov gott' e de 'Det var jättegott': 'gått' (ido) e 'gott' (gostoso) soam IGUAIS; e nunca o GÔ FECHADO e sem T da GOTA de 'Jag måste gå nu' — aquilo é 'gå', o infinitivo; VIL = o MESMO VIL de 'Vill du ha...?' e 'Vilket...': I curto e L DE VERDADE, língua no céu da boca — se virar 'viu', o L some; SE = o SE de 'SE perdeu', curtinho, fraco e colado no VIL, com E no fim (como o -te de 'måste'), nunca 'si'; não estique nem dê força ao SE: 'vill SÊ', separado, é 'quer ver'; juntando: 'o GÓTICO VIL SE perdeu' — corte o -ICO e o PERDEU, e sobra o sueco)",
    historia:
      "Expedição na selva, sol de quarenta graus — e o explorador é GÓTICO: roupa de safári toda preta, capacete colonial pintado de preto, pó branco no rosto, batom preto e um bigodinho torcido de VILÃO de novela. Ele partiu atrás do Templo Perdido, andou três dias com a sombrinha de renda aberta e, de repente, dá de cara com uma trilha de pegadas... as dele mesmo: andou o tempo todo em círculo. A bússola gira feito ventilador, a maquiagem escorre, e ele berra pra selva inteira: IÁ, RRÁR! O GÓTICO VIL SE perdeu — eu me perdi.",
  },
  createScene,
}

export default card
