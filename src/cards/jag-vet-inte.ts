import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag vet inte." — IÁ? sorVÊTE ÍNTEgro!
 *
 * Piquenique na grama: uma casquinha de SORVETE gigante num suporte, com a
 * bola rosa aparentemente ÍNTEGRA — mas com um túnel escuro aberto na
 * lateral. Do lado, sentada sobre o abdômen, uma formiga do tamanho de um
 * gato, de bigode rosa de morango, dá de ombros com as SEIS patas erguidas.
 * Trilha de migalhas rosa do suporte até ela. "Eu? Não sei de nada."
 *
 * Acento saturado reservado ao rosa-morango (bola, bigode, migalhas): é o
 * SORVETE (VÊT) que liga a culpada ao crime.
 */

const GRAMA = '#6f9a4f'
const GRAMA_ESC = '#5b8441'
const TERRA = '#7a5a3c'
const XADREZ_V = '#c4463d'
const XADREZ_B = '#f3ead8'
const WAFFLE = '#dba864'
const WAFFLE_ESC = '#b27b3c'
const MADEIRA = '#8a5a36'
const MADEIRA_ESC = '#6c4428'
const METAL = '#b9c0c8'
const ROSA = '#ff5c93' // acento: o sorvete
const ROSA_CLARO = '#ff9cbf'
const MORANGO = '#b3203f'
const TUNEL = '#2e0f18'
const FORMIGA = '#963a28'
const FORMIGA_ESC = '#6d2619'
const PRETO = '#2a201f'
const BRANCO = '#fbfaf5'

const GY = 0.16 // topo da grama
const TY = GY + 0.02 // topo da toalha

// casquinha
const CONE_X = -0.85
const CONE_Z = -0.15
const TIP_Y = TY + 0.32 // ponta da casquinha (dentro do suporte)
const CONE_H = 1.3
const CONE_R = 0.5
const BOLA_R = 0.64
const BOLA_Y = CONE_H + 0.48 // centro da bola, relativo à ponta

// formiga
const ANT_X = 0.82
const ANT_Z = 0.35

const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula estendida entre dois pontos (patas, antenas, trilhos). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const d = b.clone().sub(a)
  const len = d.length()
  const m = capsule(r, Math.max(0.001, len), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- grama + toalha xadrez ------------------------------------------------
  const toalha = new THREE.Group()

  const solo = cylinder(2.7, 2.78, 0.1, TERRA, { roughness: 0.9 })
  solo.position.y = 0.05
  toalha.add(solo)
  const grama = cylinder(2.68, 2.7, 0.06, GRAMA, { roughness: 0.92 })
  grama.position.y = GY - 0.03
  toalha.add(grama)

  // tufos e florzinhas na borda do gramado
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.2
    const r = 2.35 + rand() * 0.2
    const tufo = puff(0.12 + rand() * 0.05, i % 2 ? GRAMA : GRAMA_ESC, 4, 70 + i, { roughness: 0.92 })
    tufo.scale.y = 0.6
    tufo.position.set(Math.cos(a) * r, GY + 0.03, Math.sin(a) * r)
    toalha.add(tufo)
    if (i % 3 === 0) {
      const flor = sphere(0.045, i % 2 ? '#f5e27a' : '#ffffff', { roughness: 0.5 })
      flor.position.set(Math.cos(a) * r, GY + 0.12, Math.sin(a) * r)
      toalha.add(flor)
    }
  }

  // toalha: 7x7 quadrados alternados
  const pano = new THREE.Group()
  pano.rotation.y = 0.12
  pano.position.y = GY
  const N = 7
  const Q = 0.48
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const cor = (i + j) % 2 === 0 ? XADREZ_V : XADREZ_B
      const q = rbox(Q, 0.02, Q, 0.004, cor, { roughness: 0.9 })
      q.position.set((i - (N - 1) / 2) * Q, 0.01, (j - (N - 1) / 2) * Q)
      pano.add(q)
    }
  }
  // bainha costurada
  const bainha = rbox(N * Q + 0.06, 0.016, N * Q + 0.06, 0.008, XADREZ_V, { roughness: 0.9 })
  bainha.position.y = 0.004
  pano.add(bainha)
  toalha.add(pano)

  // guardanapo dobrado num canto
  const guardanapo = rbox(0.34, 0.03, 0.34, 0.01, '#f6d9e2', { roughness: 0.9 })
  guardanapo.position.set(-1.45, TY + 0.015, 1.15)
  guardanapo.rotation.y = 0.5
  toalha.add(guardanapo)

  root.add(toalha)

  // ---- colher de plástico caída --------------------------------------------
  const colher = new THREE.Group()
  colher.position.set(-0.05, TY, 1.25)
  colher.rotation.y = 0.55
  const caboColher = rbox(0.62, 0.025, 0.07, 0.012, BRANCO, { roughness: 0.3 })
  caboColher.position.set(0.18, 0.02, 0)
  colher.add(caboColher)
  const concha = sphere(0.13, BRANCO, { roughness: 0.3 })
  concha.scale.set(1.2, 0.28, 0.85)
  concha.position.set(-0.24, 0.035, 0)
  colher.add(concha)
  root.add(colher)

  // ---- suporte de madeira com aro de metal ---------------------------------
  const suporte = new THREE.Group()
  suporte.position.set(CONE_X, TY, CONE_Z)
  const pe = rbox(0.8, 0.12, 0.8, 0.04, MADEIRA, { roughness: 0.65 })
  pe.position.y = 0.06
  suporte.add(pe)
  const copo = lathe(
    [[0, 0], [0.16, 0], [0.13, 0.2], [0.11, 0.2], [0, 0.18]],
    MADEIRA_ESC,
    { roughness: 0.6 },
  )
  copo.position.y = 0.12
  suporte.add(copo)
  const aroY = 0.85
  const aroR = ((aroY - (TIP_Y - TY)) / CONE_H) * CONE_R + 0.03
  const aro = torus(aroR, 0.028, METAL, { roughness: 0.3, metalness: 0.8 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = aroY
  suporte.add(aro)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4
    const haste = limb(
      v(Math.cos(a) * 0.3, 0.12, Math.sin(a) * 0.3),
      v(Math.cos(a) * aroR, aroY, Math.sin(a) * aroR),
      0.022,
      METAL,
      { roughness: 0.3, metalness: 0.8 },
    )
    suporte.add(haste)
  }
  root.add(suporte)

  // ---- casquinha waffle (ponta para baixo) ---------------------------------
  const casquinha = new THREE.Group()
  casquinha.position.set(CONE_X, TIP_Y, CONE_Z)
  const corpoCone = lathe(
    [[0.015, 0], [CONE_R, CONE_H], [CONE_R + 0.02, CONE_H + 0.02], [0, CONE_H + 0.02]],
    WAFFLE,
    { roughness: 0.75 },
    48,
  )
  casquinha.add(corpoCone)
  const borda = torus(CONE_R + 0.01, 0.045, WAFFLE_ESC, { roughness: 0.7 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = CONE_H
  casquinha.add(borda)
  // grade do waffle: duas famílias de traços inclinados
  const surf = (h: number, a: number, out = 0.012) => {
    const r = (h / CONE_H) * CONE_R + out
    return v(Math.cos(a) * r, h, Math.sin(a) * r)
  }
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2
    for (const tw of [0.55, -0.55]) {
      casquinha.add(limb(surf(0.18, a), surf(CONE_H - 0.04, a + tw), 0.011, WAFFLE_ESC, { roughness: 0.8 }))
    }
  }
  root.add(casquinha)

  // ---- bola de sorvete rosa-morango ----------------------------------------
  const bola = new THREE.Group()
  bola.position.set(CONE_X, TIP_Y + BOLA_Y, CONE_Z)
  const massa = sphere(BOLA_R, ROSA, { roughness: 0.45 }, 48)
  massa.scale.y = 0.92
  bola.add(massa)
  // babado na base, onde a bola encontra a casquinha
  const babado = torus(CONE_R + 0.02, 0.11, ROSA, { roughness: 0.45 })
  babado.rotation.x = Math.PI / 2
  babado.position.y = CONE_H - BOLA_Y + 0.08
  bola.add(babado)
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + 0.2
    const gota = capsule(0.055, 0.1 + (k % 3) * 0.08, ROSA, { roughness: 0.45 })
    const r = CONE_R + 0.05
    gota.position.set(Math.cos(a) * r, CONE_H - BOLA_Y - 0.05 - (k % 3) * 0.04, Math.sin(a) * r)
    bola.add(gota)
  }
  // pedacinhos de morango na massa
  const tunelDir = v(0.72, -0.08, 0.69).normalize()
  for (let k = 0; k < 22; k++) {
    const d = v(rand() - 0.5, rand() * 0.9 - 0.15, rand() - 0.5).normalize()
    if (d.dot(tunelDir) > 0.72) continue
    const pedaco = sphere(0.045, MORANGO, { roughness: 0.4 })
    pedaco.scale.set(1, 0.6, 1)
    pedaco.position.copy(d).multiplyScalar(BOLA_R * 0.97)
    pedaco.position.y *= 0.92
    pedaco.quaternion.setFromUnitVectors(UP, d)
    bola.add(pedaco)
  }
  root.add(bola)

  // ---- boca do túnel (filha da bola) ----------------------------------------
  const tunel = new THREE.Group()
  tunel.position.copy(tunelDir).multiplyScalar(BOLA_R * 0.93)
  tunel.position.y *= 0.92
  tunel.quaternion.setFromUnitVectors(UP, tunelDir)
  const buraco = cylinder(0.24, 0.2, 0.16, TUNEL, { roughness: 0.95 })
  buraco.position.y = -0.02
  tunel.add(buraco)
  const fundo = sphere(0.2, '#1a070c', { roughness: 1 })
  fundo.scale.y = 0.5
  fundo.position.y = 0.04
  tunel.add(fundo)
  const beira = torus(0.25, 0.05, ROSA_CLARO, { roughness: 0.5 })
  beira.rotation.x = Math.PI / 2
  beira.position.y = 0.05
  tunel.add(beira)
  bola.add(tunel)

  // ---- trilha de migalhas: do suporte até a formiga --------------------------
  const migalhas = new THREE.Group()
  const p0 = v(CONE_X + 0.45, TY, CONE_Z + 0.35)
  const p1 = v(0.0, TY, 0.9)
  const p2 = v(ANT_X - 0.15, TY, ANT_Z + 0.45)
  const curva = new THREE.QuadraticBezierCurve3(p0, p1, p2)
  for (let k = 0; k <= 13; k++) {
    const p = curva.getPoint(k / 13)
    const r = 0.035 + rand() * 0.035
    const m = sphere(r, k % 3 === 0 ? ROSA_CLARO : ROSA, { roughness: 0.5 })
    m.scale.y = 0.75
    m.position.set(p.x + (rand() - 0.5) * 0.12, TY + r * 0.6, p.z + (rand() - 0.5) * 0.12)
    migalhas.add(m)
  }
  // umas gotas escorrendo do túnel pela bola
  for (let k = 0; k < 3; k++) {
    const d = tunelDir.clone().add(v(0.06 * (k - 1), -0.42 - k * 0.12, 0)).normalize()
    const g = sphere(0.05, ROSA_CLARO, { roughness: 0.45 })
    g.position.copy(d).multiplyScalar(BOLA_R * 0.97).add(bola.position)
    migalhas.add(g)
  }
  root.add(migalhas)

  // ---- FORMIGA sentada no abdômen --------------------------------------------
  const formiga = new THREE.Group()
  formiga.position.set(ANT_X, TY, ANT_Z)
  formiga.rotation.y = -0.95 // abdômen aponta para trás-direita: silhueta de formiga
  root.add(formiga)
  // tronco torcido de volta para a câmera (tórax, cabeça e patas)
  const tronco = new THREE.Group()
  tronco.rotation.y = 0.8
  formiga.add(tronco)

  const abdomen = sphere(0.48, FORMIGA, { roughness: 0.35 })
  abdomen.scale.set(0.92, 0.8, 1.3)
  abdomen.position.set(0, 0.38, -0.66)
  formiga.add(abdomen)
  const peciolo = sphere(0.13, FORMIGA_ESC, { roughness: 0.35 })
  peciolo.position.set(0, 0.5, -0.17)
  formiga.add(peciolo)
  const torax = capsule(0.2, 0.36, FORMIGA, { roughness: 0.35 })
  torax.position.set(0, 0.8, -0.04)
  torax.rotation.x = -0.15
  tronco.add(torax)
  const pescoco = sphere(0.11, FORMIGA_ESC, { roughness: 0.35 })
  pescoco.position.set(0, 1.08, 0)
  tronco.add(pescoco)

  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.4, 0.06)
  cabeca.rotation.set(0, 0.1, 0.12) // encara a câmera, inclinada: "eu?"
  tronco.add(cabeca)
  const cranio = sphere(0.38, FORMIGA, { roughness: 0.35 })
  cranio.scale.set(1.05, 0.95, 0.95)
  cabeca.add(cranio)
  for (const s of [-1, 1]) {
    const olho = sphere(0.12, '#ffffff', { roughness: 0.2 })
    olho.scale.set(1, 1.15, 0.6)
    olho.position.set(s * 0.15, 0.07, 0.31)
    cabeca.add(olho)
    // pupilas olhando para o lado, inocentes
    const pupila = sphere(0.055, '#151112', { roughness: 0.2 })
    pupila.position.set(s * 0.15 - 0.045, 0.1, 0.38)
    cabeca.add(pupila)
    const brilho = sphere(0.018, '#ffffff', { roughness: 0.1 })
    brilho.position.set(s * 0.15 - 0.03, 0.13, 0.41)
    cabeca.add(brilho)
    // sobrancelhas erguidas
    const sob = capsule(0.022, 0.1, FORMIGA_ESC, { roughness: 0.4 })
    sob.position.set(s * 0.16, 0.27, 0.3)
    sob.rotation.set(-0.3, 0, Math.PI / 2 + s * 0.35)
    cabeca.add(sob)
    // mandíbulas
    const mand = cone(0.05, 0.16, FORMIGA_ESC, { roughness: 0.4 })
    mand.position.set(s * 0.08, -0.27, 0.27)
    mand.rotation.set(Math.PI * 0.95, 0, s * 0.5)
    cabeca.add(mand)
  }
  const sorriso = capsule(0.018, 0.1, '#3a0f0a', { roughness: 0.5 })
  sorriso.position.set(0.02, -0.19, 0.355)
  sorriso.rotation.z = Math.PI / 2 - 0.15
  cabeca.add(sorriso)

  // ---- bigode rosa de sorvete (sobre as mandíbulas) -------------------------
  const bigode = new THREE.Group()
  bigode.position.set(0, -0.12, 0.34)
  for (const s of [-1, 1]) {
    const lado = capsule(0.045, 0.13, ROSA, { roughness: 0.45 })
    lado.position.set(s * 0.085, -0.005, 0)
    lado.rotation.z = Math.PI / 2 + s * 0.35
    bigode.add(lado)
    const ponta = sphere(0.04, ROSA, { roughness: 0.45 })
    ponta.position.set(s * 0.18, 0.035, -0.02)
    bigode.add(ponta)
  }
  const meio = sphere(0.05, ROSA, { roughness: 0.45 })
  meio.position.set(0, 0.012, 0.01)
  bigode.add(meio)
  // migalhinha no queixo
  const pingo = sphere(0.025, ROSA_CLARO, { roughness: 0.45 })
  pingo.position.set(-0.05, -0.17, 0.02)
  bigode.add(pingo)
  cabeca.add(bigode)

  // ---- antenas cotoveladas ---------------------------------------------------
  const antenas = new THREE.Group()
  antenas.position.set(0, 0.28, 0.12)
  for (const s of [-1, 1]) {
    const base = v(s * 0.1, 0, 0)
    const cotovelo = v(s * 0.24, 0.3, -0.02)
    const ponta = v(s * 0.46, 0.4, 0.14)
    antenas.add(limb(base, cotovelo, 0.026, PRETO, { roughness: 0.4 }))
    antenas.add(limb(cotovelo, ponta, 0.022, PRETO, { roughness: 0.4 }))
    const bolinha = sphere(0.045, PRETO, { roughness: 0.4 })
    bolinha.position.copy(ponta)
    antenas.add(bolinha)
  }
  cabeca.add(antenas)

  // ---- seis patas erguidas: o dar de ombros ---------------------------------
  // pivô no centro do tórax; cada lado gira em z para baixar/erguer as 3 patas
  const PIVO_Y = 0.82
  function lado(s: number) {
    const g = new THREE.Group()
    g.position.set(0, PIVO_Y, 0)
    const pernas: [number, number, number, number, number][] = [
      // [y quadril, z, ângulo do fêmur, ângulo da tíbia, comprimento]
      // dar de ombros: "cotovelo" para fora e para baixo, "antebraço" para cima
      [0.15, 0.1, -0.15, 1.05, 0.36],
      [0.0, 0.0, -0.4, 0.8, 0.38],
      [-0.15, -0.1, -0.65, 0.55, 0.36],
    ]
    for (const [y, z, af, at, L] of pernas) {
      const quadril = v(s * 0.15, y, z)
      const joelho = quadril.clone().add(v(s * Math.cos(af) * L, Math.sin(af) * L, z * 0.6))
      const pe = joelho.clone().add(v(s * Math.cos(at) * L, Math.sin(at) * L, z * 0.6))
      g.add(limb(quadril, joelho, 0.042, PRETO, { roughness: 0.4 }))
      g.add(limb(joelho, pe, 0.034, PRETO, { roughness: 0.4 }))
      const junta = sphere(0.052, PRETO, { roughness: 0.4 })
      junta.position.copy(joelho)
      g.add(junta)
      // "palma" virada para cima
      const palma = sphere(0.06, PRETO, { roughness: 0.4 })
      palma.scale.set(1.4, 0.5, 1.1)
      palma.position.copy(pe)
      g.add(palma)
    }
    return g
  }
  const patasE = lado(-1)
  const patasD = lado(1)
  tronco.add(patasE, patasD)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'toalha', group: 'piquenique', object: toalha },
    { name: 'colher', group: 'piquenique', object: colher },
    { name: 'suporte', group: 'sorvete', object: suporte },
    { name: 'casquinha', group: 'sorvete', object: casquinha },
    { name: 'bola', group: 'sorvete', object: bola },
    { name: 'formiga', group: 'formiga', object: formiga },
    { name: 'antenas', group: 'formiga', object: antenas },
    { name: 'bigode', group: 'bigode', object: bigode },
    { name: 'patasE', group: 'ombros', object: patasE },
    { name: 'patasD', group: 'ombros', object: patasD },
    { name: 'tunel', group: 'tunel', object: tunel },
    { name: 'migalhas', group: 'tunel', object: migalhas },
  ]

  const pop = (a: number) => [ch('scale.x', a, 1), ch('scale.y', a, 1), ch('scale.z', a, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('toalha-rise', 'toalha', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um piquenique na grama: toalha xadrez vermelha e branca…',
    }),
    seq('colher-cai', 'colher', 0.7, 0.5, [ch('position.y', TY + 0.6, TY)], { ease: 'easeIn' }),

    seq('suporte-rise', 'suporte', 1.7, 0.6, [riseFrom(TY, 0.9)], {
      ease: 'easeOut',
      caption: '…e num suporte, uma casquinha de SORVETE gigante. A bola rosa parece ÍNTEGRA.',
    }),
    seq('casquinha-rise', 'casquinha', 1.95, 0.7, [riseFrom(TIP_Y, 1.8)], { ease: 'easeOut' }),
    seq('bola-pousa', 'bola', 2.5, 0.6, [ch('position.y', TIP_Y + BOLA_Y + 1.2, TIP_Y + BOLA_Y), ...pop(0.6)], {
      ease: 'easeOut',
    }),

    seq('formiga-rise', 'formiga', 4.0, 0.8, [riseFrom(TY, 1.9)], {
      ease: 'easeOut',
      caption: 'Do lado, sentadinha, uma formiga do tamanho de um gato. Toda inocente.',
    }),
    seq('antenas-brotam', 'antenas', 4.6, 0.5, pop(0.05), { ease: 'easeOut' }),

    seq('bigode-aparece', 'bigode', 5.8, 0.5, pop(0.01), {
      ease: 'easeOut',
      caption: 'Mas tem um BIGODE rosa de morango na cara dela…',
    }),

    seq('ombros-E', 'patasE', 7.2, 0.6, [ch('rotation.z', 1.3, 0)], {
      ease: 'easeOut',
      caption: 'Ela dá de ombros com as SEIS patas: "IÁ? sorVÊTE ÍNTEgro!"',
    }),
    seq('ombros-D', 'patasD', 7.2, 0.6, [ch('rotation.z', -1.3, 0)], { ease: 'easeOut' }),

    seq('tunel-abre', 'tunel', 9.0, 0.5, pop(0.01), {
      ease: 'easeOut',
      caption: 'Só que a bola está oca: um TÚNEL do tamanho exato dela — e a trilha de migalhas.',
    }),
    seq('migalhas-rise', 'migalhas', 9.3, 0.6, [riseFrom(0, 0.15)], { ease: 'easeOut' }),

    seq('antenas-mexem', 'antenas', 10.9, 0.5, [ch('rotation.z', 0.3, 0)], {
      ease: 'easeInOut',
      caption: 'Jag vet inte. — Eu não sei.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.15, 5.5], target: [0.05, 1.35, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-vet-inte',
    contexto:
      "Resposta a qualquer pergunta que você não sabe responder: no trabalho, na rua, com as crianças. Também como 'sei lá' num papo informal.",
    fraseFonte: 'Eu não sei.',
    fraseAlvo: 'Jag vet inte.',
    pronuncia:
      "iá VÊT ÍN-te ('vet' com Ê FECHADO e longo, T seco que cola no 'inte'; na fala rápida sai 'iá vê-TÍN-te' ou só 'vet int'')",
    ponteSonora:
      "IÁ? sorVÊTE ÍNTEgro! (3 batidas: IÁ-VÊT-ÍNTE, tônicas em VÊ e ÍN; IÁ é o 'jag' de sempre, I de ioga; de SORVETE só fica o VÊT — o 'sor' cai, Ê FECHADO e LONGO como no próprio 'sorVÊte'; o T é DURO, de 'tatu', e emenda direto no ÍNTE: VÊ-TÍN-te — nunca o 'tchi' carioca de 'sorvetchi', e sem vogal sobrando no meio: se sobrar o -e vira 'vete', que é TRIGO; ÍNTEgro é o MESMO âncora de 'inte' das cartas 'Ursäkta, jag förstår inte' e 'Jag pratar inte så bra svenska' — força no ÍN, corta o '-gro')",
    historia:
      "Uma formiga do tamanho de um gato está ao lado de uma casquinha de SORVETE gigante, que parece ÍNTEGRA. O dono volta e encontra a formiga com um bigode rosa de morango. Ela dá de ombros com as SEIS patas ao mesmo tempo: 'IÁ? sorVÊTE ÍNTEgro!' — e com um peteleco da antena a bola desaba, oca por dentro, com um túnel do tamanho exato dela. Eu? Não sei de nada.",
  },
  createScene,
  refine: { organic: ['formiga'] },
}

export default card
