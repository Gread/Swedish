import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom,
  rbox, capsule, cylinder, sphere, cone, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Ta på dig mössan!" — TÁ, PÔ! DÊI… MOÇA-N!
 *
 * Menos vinte em Kiruna e o boneco de neve, todo metido, ergue o galho em
 * protesto: boneco de neve não sente frio! A touca-MOÇA — vermelha, listrada,
 * de tranças loiras — pula do varal (onde estava pendurada pelo pompom) e se
 * enterra na cabeça dele até a beira dos olhos. TÁ, PÔ! — DÊI!
 *
 * O vermelho da touca é o único acento saturado.
 */

type V3 = [number, number, number]

const NEVE = '#eef3f8'
const NEVE_BORDA = '#d9e3ec'
const NEVE_BOLA = '#f4f7fb'
const CARVAO = '#232327'
const GALHO = '#5e4128'
const MADEIRA = '#7a5a3c'
const PRENDEDOR = '#cfae7e'
const PINHO = '#2f5a45'
const CENOURA = '#e07b35'
const CENOURA_ESC = '#c4652a'
const LUVA = '#4f6f9a'
const VERMELHO = '#d42a2a' // acento RESERVADO: a touca-MOÇA
const VERMELHO_ESC = '#a91d22'
const BRANCO = '#f5f2ea'
const LOIRO = '#e9c46a'
const LOIRO_ESC = '#d4a94c'
const LACO = '#3a78c9'

const GY = 0.18 // topo da neve
const SX = -0.35
const SZ = 0.05
const BY = 0.66 // centro da bola de baixo
const TY = 1.52 // centro do tronco
const HY = 2.2 // centro da cabeça

// varal: corda entre os topos dos dois postes
const POST_A: V3 = [1.35, GY + 1.85, -1.35]
const POST_B: V3 = [2.05, GY + 1.85, 0.55]
const SAG = 0.14
function ropeAt(t: number): THREE.Vector3 {
  const a = new THREE.Vector3(...POST_A)
  const b = new THREE.Vector3(...POST_B)
  const p = a.lerp(b, t)
  p.y -= SAG * 4 * t * (1 - t)
  return p
}
const HANG = ropeAt(0.47)
const VX = HANG.x
const VY = HANG.y - 0.74 // touca pendurada pelo pompom
const VZ = HANG.z

const UP = new THREE.Vector3(0, 1, 0)
function rod(r: number, a: THREE.Vector3, b: THREE.Vector3, color: string) {
  const dir = b.clone().sub(a)
  const m = cylinder(r, r, dir.length(), color, { roughness: 0.9 }, 10)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

function prendedor(p: THREE.Vector3) {
  const g = new THREE.Group()
  g.position.copy(p)
  for (const s of [-1, 1]) {
    const half = rbox(0.022, 0.12, 0.03, 0.008, PRENDEDOR, { roughness: 0.7 })
    half.position.set(s * 0.013, -0.03, 0)
    g.add(half)
  }
  const mola = rbox(0.05, 0.016, 0.034, 0.005, '#9aa3ab', { roughness: 0.3, metalness: 0.7 })
  mola.position.y = -0.03
  g.add(mola)
  return g
}

function galho(side: number) {
  const g = new THREE.Group()
  const stick = capsule(0.03, 0.6, GALHO, { roughness: 0.85 })
  stick.position.y = 0.32
  g.add(stick)
  const lateral = capsule(0.017, 0.15, GALHO, { roughness: 0.85 })
  lateral.position.set(side * 0.06, 0.38, 0)
  lateral.rotation.z = -side * 0.7
  g.add(lateral)
  for (const a of [-0.55, 0, 0.55]) {
    const dedo = capsule(0.015, 0.1, GALHO, { roughness: 0.85 })
    dedo.position.set(-Math.sin(a) * 0.06, 0.7 + Math.cos(a) * 0.04, 0)
    dedo.rotation.z = a
    g.add(dedo)
  }
  return g
}

function trança(side: number) {
  const g = new THREE.Group()
  g.position.set(side * 0.37, 0.14, 0.05)
  g.rotation.z = side * 0.12
  const amarra = sphere(0.05, LOIRO_ESC, { roughness: 0.9 })
  g.add(amarra)
  for (let i = 0; i < 5; i++) {
    const lobo = sphere(0.058, i % 2 ? LOIRO_ESC : LOIRO, { roughness: 0.9 })
    lobo.scale.set(0.85, 1.25, 0.85)
    lobo.position.set((i % 2 ? 1 : -1) * 0.014, -0.07 - i * 0.075, 0)
    lobo.rotation.z = (i % 2 ? 1 : -1) * 0.35
    g.add(lobo)
  }
  const laco = new THREE.Group()
  laco.position.y = -0.46
  for (const s of [-1, 1]) {
    const asa = cone(0.035, 0.08, LACO, { roughness: 0.6 })
    asa.rotation.z = s * Math.PI / 2
    asa.position.x = -s * 0.04
    laco.add(asa)
  }
  const no = sphere(0.022, LACO, { roughness: 0.6 })
  laco.add(no)
  g.add(laco)
  const ponta = cone(0.04, 0.09, LOIRO, { roughness: 0.9 })
  ponta.rotation.z = Math.PI
  ponta.position.y = -0.52
  g.add(ponta)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- quintal nevado ------------------------------------------------------
  const base = new THREE.Group()
  const disco = cylinder(2.6, 2.68, 0.18, NEVE_BORDA, { roughness: 0.92 })
  disco.position.y = 0.09
  base.add(disco)
  const topo = cylinder(2.56, 2.6, 0.02, NEVE, { roughness: 0.92 })
  topo.position.y = GY - 0.01
  base.add(topo)
  const montes: [number, number, number, number][] = [
    [-1.9, -0.6, 0.34, 11], [0.6, -1.9, 0.4, 12], [-0.6, -2.0, 0.3, 13], [1.0, 1.6, 0.28, 14], [-1.7, 1.2, 0.26, 15],
  ]
  for (const [x, z, r, s] of montes) {
    const m = puff(r, NEVE, 6, s, { roughness: 0.92 })
    m.position.set(x, GY, z)
    m.scale.y = 0.4
    base.add(m)
  }
  for (const [x, z, h] of [[-1.85, -1.3, 1.6], [-1.15, -1.95, 1.25]] as const) {
    const pinho = new THREE.Group()
    pinho.position.set(x, GY, z)
    const tronco = cylinder(0.06, 0.08, 0.3, '#4a3524', { roughness: 0.9 })
    tronco.position.y = 0.15
    pinho.add(tronco)
    for (let i = 0; i < 3; i++) {
      const r = (0.55 - i * 0.14) * (h / 1.6)
      const c = cone(r, h * 0.42, PINHO, { roughness: 0.85 })
      c.position.y = 0.3 + i * h * 0.22 + h * 0.21
      pinho.add(c)
      const capa = cone(r * 0.62, h * 0.16, NEVE, { roughness: 0.9 })
      capa.position.y = c.position.y + h * 0.15
      pinho.add(capa)
    }
    base.add(pinho)
  }
  // pá de neve espetada
  const pa = new THREE.Group()
  pa.position.set(-1.65, GY, 0.85)
  pa.rotation.set(0.15, 0.5, 0.18)
  const cabo = cylinder(0.025, 0.025, 1.0, MADEIRA, { roughness: 0.8 })
  cabo.position.y = 0.55
  pa.add(cabo)
  const lamina = rbox(0.32, 0.3, 0.04, 0.02, '#5d7891', { roughness: 0.5, metalness: 0.4 })
  lamina.position.y = 0.05
  pa.add(lamina)
  const pega = rbox(0.16, 0.04, 0.04, 0.015, '#2f2f33', { roughness: 0.6 })
  pega.position.y = 1.05
  pa.add(pega)
  base.add(pa)
  root.add(base)

  // ---- varal ----------------------------------------------------------------
  const varal = new THREE.Group()
  for (const p of [POST_A, POST_B]) {
    const poste = cylinder(0.055, 0.065, 1.9, MADEIRA, { roughness: 0.85 })
    poste.position.set(p[0], GY + 0.95, p[2])
    varal.add(poste)
    const tampa = rbox(0.14, 0.05, 0.14, 0.02, '#5b4129', { roughness: 0.85 })
    tampa.position.set(p[0], GY + 1.92, p[2])
    varal.add(tampa)
    const monte = puff(0.18, NEVE, 5, 21, { roughness: 0.92 })
    monte.position.set(p[0], GY, p[2])
    monte.scale.y = 0.45
    varal.add(monte)
  }
  const N = 10
  for (let i = 0; i < N; i++) {
    varal.add(rod(0.012, ropeAt(i / N), ropeAt((i + 1) / N), '#e4ddcc'))
  }
  for (const t of [0.43, 0.51]) varal.add(prendedor(ropeAt(t)))
  // par de luvas penduradas
  for (const t of [0.74, 0.82]) {
    const p = ropeAt(t)
    varal.add(prendedor(p))
    const luva = new THREE.Group()
    luva.position.set(p.x, p.y - 0.19, p.z)
    luva.rotation.y = -1.2
    const mao = rbox(0.15, 0.2, 0.06, 0.05, LUVA, { roughness: 0.9 })
    luva.add(mao)
    const dedao = capsule(0.025, 0.06, LUVA, { roughness: 0.9 })
    dedao.position.set(0.085, -0.03, 0)
    dedao.rotation.z = -0.5
    luva.add(dedao)
    const punho = rbox(0.16, 0.05, 0.07, 0.02, BRANCO, { roughness: 0.9 })
    punho.position.y = 0.1
    luva.add(punho)
    varal.add(luva)
  }
  root.add(varal)

  // ---- boneco de neve -------------------------------------------------------
  const bolaBase = new THREE.Group()
  bolaBase.position.set(SX, BY, SZ)
  const b1 = sphere(0.6, NEVE_BOLA, { roughness: 0.9 }, 48)
  b1.scale.y = 0.9
  bolaBase.add(b1)
  root.add(bolaBase)

  const tronco = new THREE.Group()
  tronco.position.set(SX, TY, SZ)
  const b2 = sphere(0.45, NEVE_BOLA, { roughness: 0.9 }, 48)
  b2.scale.y = 0.93
  tronco.add(b2)
  for (const dy of [0.2, 0.02, -0.16]) {
    const z = Math.sqrt(Math.max(0, 0.45 * 0.45 - (dy / 0.93) ** 2))
    const botao = rock(0.05, CARVAO, 40 + Math.round(dy * 100), { roughness: 0.7 })
    botao.position.set(0, dy, z - 0.01)
    tronco.add(botao)
  }
  root.add(tronco)

  const cabeca = new THREE.Group()
  cabeca.position.set(SX, HY, SZ)
  const b3 = sphere(0.34, NEVE_BOLA, { roughness: 0.9 }, 48)
  cabeca.add(b3)
  for (const s of [-1, 1]) {
    const olho = rock(0.048, CARVAO, 50 + s, { roughness: 0.6 })
    olho.position.set(s * 0.115, 0.02, 0.31)
    cabeca.add(olho)
    const sobr = capsule(0.018, 0.1, CARVAO, { roughness: 0.7 })
    sobr.position.set(s * 0.12, 0.098, 0.305)
    sobr.rotation.z = Math.PI / 2 + s * 0.38
    cabeca.add(sobr)
  }
  // boca de carvão em bico emburrado: arco para baixo, o meio para a frente
  for (let i = -2; i <= 2; i++) {
    const x = i * 0.045
    const y = -0.165 - 0.035 * (i / 2) ** 2
    const z = Math.sqrt(Math.max(0, 0.34 * 0.34 - x * x - y * y)) + (Math.abs(i) < 2 ? 0.012 : 0)
    const pedra = rock(i === 0 ? 0.03 : 0.025, CARVAO, 60 + i, { roughness: 0.7 })
    pedra.position.set(x, y, z - 0.005)
    cabeca.add(pedra)
  }
  root.add(cabeca)

  const nariz = new THREE.Group()
  nariz.position.set(SX, HY - 0.04, SZ + 0.3)
  nariz.rotation.x = Math.PI / 2 + 0.12
  const cenoura = lathe(
    [[0, 0], [0.062, 0.01], [0.066, 0.04], [0.052, 0.14], [0.034, 0.24], [0.01, 0.33], [0, 0.335]],
    CENOURA,
    { roughness: 0.6 },
  )
  nariz.add(cenoura)
  for (const [y, r] of [[0.09, 0.06], [0.17, 0.047], [0.24, 0.034]] as const) {
    const anel = cylinder(r, r, 0.008, CENOURA_ESC, { roughness: 0.7 }, 20)
    anel.position.y = y
    nariz.add(anel)
  }
  root.add(nariz)

  // braço erguido em protesto (lado esquerdo da imagem) e o outro caído
  const bracoE = galho(-1)
  bracoE.position.set(SX - 0.38, TY + 0.12, SZ + 0.02)
  bracoE.rotation.z = 0.65
  root.add(bracoE)

  const bracoD = galho(1)
  bracoD.position.set(SX + 0.4, TY + 0.06, SZ)
  bracoD.rotation.z = -2.05
  root.add(bracoD)

  // ---- touca-MOÇA (origem = centro da cabeça) --------------------------------
  const touca = new THREE.Group()
  touca.position.set(SX, HY, SZ)
  const copaPerfil: [number, number][] = [
    [0.33, 0.25], [0.325, 0.33], [0.3, 0.42], [0.25, 0.5], [0.16, 0.565], [0.07, 0.595], [0, 0.6],
  ]
  const copa = lathe(copaPerfil, VERMELHO, { roughness: 0.88 })
  touca.add(copa)
  const rAt = (y: number) => {
    for (let i = 0; i < copaPerfil.length - 1; i++) {
      const [r0, y0] = copaPerfil[i]
      const [r1, y1] = copaPerfil[i + 1]
      if (y >= y0 && y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
    }
    return 0
  }
  for (const [y0, y1] of [[0.33, 0.375], [0.43, 0.47]] as const) {
    const pts: [number, number][] = []
    for (let k = 0; k <= 4; k++) {
      const y = y0 + ((y1 - y0) * k) / 4
      pts.push([rAt(y) + 0.006, y])
    }
    touca.add(lathe(pts, BRANCO, { roughness: 0.88 }))
  }
  const barra = lathe(
    [[0.315, 0.125], [0.35, 0.13], [0.368, 0.17], [0.37, 0.22], [0.36, 0.26], [0.32, 0.27]],
    VERMELHO,
    { roughness: 0.9 },
  )
  touca.add(barra)
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    const rib = capsule(0.011, 0.09, VERMELHO_ESC, { roughness: 0.9 })
    rib.position.set(Math.sin(a) * 0.366, 0.198, Math.cos(a) * 0.366)
    touca.add(rib)
  }
  const pompom = puff(0.1, BRANCO, 7, 77, { roughness: 0.95 })
  pompom.position.y = 0.67
  touca.add(pompom)
  root.add(touca)

  const trancas = new THREE.Group()
  trancas.add(trança(-1), trança(1))
  touca.add(trancas)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'quintal', object: base },
    { name: 'varal', group: 'quintal', object: varal },
    { name: 'touca', group: 'moca', object: touca },
    { name: 'trancas', group: 'moca', object: trancas },
    { name: 'bolaBase', group: 'boneco', object: bolaBase },
    { name: 'tronco', group: 'boneco', object: tronco },
    { name: 'cabeca', group: 'boneco', object: cabeca },
    { name: 'nariz', group: 'boneco', object: nariz },
    { name: 'bracoD', group: 'protesto', object: bracoD },
    { name: 'bracoE', group: 'protesto', object: bracoE },
  ]

  const S3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const AX = (SX + VX) / 2
  const AZ = (SZ + VZ) / 2
  const APEX = 3.15

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Menos vinte em Kiruna: um quintal coberto de neve, com um varal entre dois postes…',
    }),
    seq('varal-rise', 'varal', 0.35, 0.8, [riseFrom(0, 2.2)], { ease: 'easeOut' }),

    seq('touca-pendura', 'touca', 1.4, 0.5, [
      ...S3(0.01, 1),
      ch('position.x', VX, VX), ch('position.y', VY, VY), ch('position.z', VZ, VZ),
      ch('rotation.y', -2 * Math.PI - 0.5, -2 * Math.PI - 0.5),
    ], {
      ease: 'easeOut',
      caption: '…e no varal, pendurada pelo pompom, a MOÇA de tricô: touca vermelha de tranças loiras.',
    }),
    seq('trancas-pendura', 'trancas', 1.5, 0.5, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('bola-rola', 'bolaBase', 2.9, 0.9, [
      ch('position.x', SX - 1.6, SX), ch('rotation.z', 4, 0),
      ...S3(0.4, 1), ch('position.y', GY + 0.2, BY),
    ], {
      ease: 'easeOut',
      caption: 'Rola uma bola, cai outra, cai a cabeça: um boneco de neve todo metido.',
    }),
    seq('tronco-cai', 'tronco', 3.7, 0.45, [ch('position.y', TY + 1.6, TY)], { ease: 'easeIn' }),
    seq('cabeca-cai', 'cabeca', 4.15, 0.45, [ch('position.y', HY + 1.6, HY)], { ease: 'easeIn' }),
    seq('nariz-espeta', 'nariz', 4.6, 0.35, [ch('position.z', SZ + 1.0, SZ + 0.3), ...S3(0.01, 1)], { ease: 'easeOut' }),

    seq('bracoD-brota', 'bracoD', 5.0, 0.4, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),
    seq('bracoE-ergue', 'bracoE', 5.2, 0.5, [ch('rotation.z', 2.0, 0.85)], {
      ease: 'easeOut',
      caption: 'Ele ergue o galho em protesto: "boneco de neve não sente frio!"',
    }),
    seq('bracoE-sacode-a', 'bracoE', 5.7, 0.25, [ch('rotation.z', 0.85, 0.55)]),
    seq('bracoE-sacode-b', 'bracoE', 5.95, 0.25, [ch('rotation.z', 0.55, 0.85)]),
    seq('bracoE-sacode-c', 'bracoE', 6.2, 0.25, [ch('rotation.z', 0.85, 0.65)]),

    seq('touca-pula', 'touca', 7.0, 0.5, [
      ch('position.x', VX, AX), ch('position.y', VY, APEX), ch('position.z', VZ, AZ),
      ch('rotation.y', -2 * Math.PI - 0.5, -Math.PI), ch('rotation.z', 0, 0.5),
    ], {
      ease: 'easeOut',
      caption: 'Aí a MOÇA pula do varal e se enterra na cabeça dele até a beira dos olhos!',
    }),
    seq('touca-encaixa', 'touca', 7.5, 0.4, [
      ch('position.x', AX, SX), ch('position.y', APEX, HY), ch('position.z', AZ, SZ),
      ch('rotation.y', -Math.PI, 0), ch('rotation.z', 0.5, 0),
    ], { ease: 'easeIn' }),
    seq('touca-afunda', 'touca', 7.9, 0.12, [ch('scale.y', 1, 0.84), ch('scale.x', 1, 1.07), ch('scale.z', 1, 1.07)], { ease: 'easeOut' }),
    seq('touca-volta', 'touca', 8.02, 0.3, [ch('scale.y', 0.84, 1), ch('scale.x', 1.07, 1), ch('scale.z', 1.07, 1)], { ease: 'easeOut' }),

    seq('bracoE-bronca-a', 'bracoE', 8.4, 0.22, [ch('rotation.z', 0.65, 0.95)], {
      caption: '"TÁ, PÔ!", resmunga ele, de bico; "DÊI!", diz ela, satisfeita, balançando as tranças.',
    }),
    seq('bracoE-bronca-b', 'bracoE', 8.62, 0.3, [ch('rotation.z', 0.95, 0.65)]),
    seq('trancas-balanca-a', 'trancas', 8.9, 0.3, [ch('rotation.z', 0, 0.14)]),
    seq('trancas-balanca-b', 'trancas', 9.2, 0.35, [ch('rotation.z', 0.14, -0.1)]),
    seq('trancas-balanca-c', 'trancas', 9.55, 0.35, [ch('rotation.z', -0.1, 0)]),

    seq('nariz-final', 'nariz', 10.3, 0.4, [ch('rotation.x', Math.PI / 2 + 0.12, Math.PI / 2 + 0.12)], {
      caption: 'Ta på dig mössan! — Põe a touca!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.5, 5.6], target: [0.25, 1.55, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'ta-pa-dig-mossan',
    contexto:
      "Filhos: na porta de casa ou da förskola, de outubro a abril; os pedagogos repetem no pátio antes de liberar a criançada pra neve — e de pais pro adolescente que sai de cabeça descoberta a menos dez. Mesmo molde de 'Ta på dig jackan!': troque a peça — vantarna (as luvas), halsduken (o cachecol), skorna (os sapatos).",
    fraseFonte: 'Põe a touca!',
    fraseAlvo: 'Ta på dig mössan!',
    pronuncia:
      "ta PÔ dêi MÖS-san! ('ta på' é verbo com partícula e a força cai no PÔ: Ô fechado e longo; 'dig' na fala = dêi, uma sílaba só; 'mössan' com Ö CURTO — lábios em bico de Ô com a língua de Ê —, o S dobrado, segurado um instante, e o -an do artigo: 'mössa' é touca, 'mössan' é A touca; força no PÔ e no MÖ)",
    ponteSonora:
      "TÁ, PÔ! DÊI... MOÇA-N! (5 batidas: tá-PÔ-dêi-MÖS-san; tônicas no PÔ e no MÖ; TÁ, PÔ! DÊI = o MESMO 'ta på dig' do quati de 'Ta på dig jackan!': TÁ com A aberto e longo, PÔ com Ô FECHADO e a força (é verbo com partícula: ta PÅ), o resmungo inteiro de uma vez, e DÊI = o 'DEI!' satisfeito de quem acabou de fazer o serviço em você, UMA sílaba só, o 'dej' da fala; MOÇA-N = a touca-MOÇA de tranças, com o N do artigo colado no fim, igual ao N da JACA de IÁK-KAN ('jackan'): mössa = touca, mössan = A touca; a força fica no MÔ, como em 'moça' — nunca 'mo-SSÃ' —, e o N é de ponta de língua, sem nasal; o Ô é CURTO e leva o bico do Ô com a língua de Ê, o mesmo ö de 'snö', só que curtinho — sem a língua de Ê sai 'mossan', que é O MUSGO; o SS é dobrado: segure o S um instante antes de soltar o -an, MÖS-san)",
    historia:
      "Menos vinte em Kiruna, e o boneco de neve, todo metido, se recusa a pôr touca: 'boneco de neve não sente frio!'. Aí a MOÇA de tricô — uma touca vermelha com pompom e duas tranças loiras de lã — pula do varal e se enterra na cabeça dele até a beira dos olhos de carvão. 'TÁ, PÔ!', resmunga ele, de bico; 'DÊI!', diz ela, satisfeita, balançando as tranças. Na Suécia, até boneco de neve ouve: põe a touca!",
  },
  createScene,
}

export default card
