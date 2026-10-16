import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Jag är törstig." — IÁ! É… TÓRC(e)-TI(gela)!
 *
 * Leito de rio seco, lama rachada em placas, sol enorme. A sucuri verde-oliva
 * deita o corpo na lama, ergue o rabo atrás da tigela e se TORCE em espiral
 * apertada por cima da TIGELA de barro vazia; da ponta do rabo pinga uma
 * única gota azul (o acento saturado). Cabeça larga erguida, língua pra fora.
 */

const GAP = '#5b3d26'
const MUD = ['#c9a274', '#c09968', '#d1ad80', '#bb9263']
const ROCHA = '#8d8a84'
const TRONCO = '#9c8b74'
const TRONCO_CLARO = '#c8b796'
const PALHA = '#c9b16a'
const OLIVA = '#6b7a3a'
const OLIVA_ESC = '#55622c'
const BARRIGA = '#c2b468'
const MANCHA = '#23261a'
const BARRO = '#b8693c'
const BARRO_ESC = '#924d2b'
const CREME = '#e6cfa6'
const LINGUA = '#c8303a'
const OLHO = '#e8c330'
const SOL = '#ffd54a'
const GOTA = '#1e8cff' // acento reservado: a gota única

const GY = 0.15 // topo das placas de lama
const BOWL = new THREE.Vector3(0, GY, 0.3)

/** Tubo afunilado ao longo de [u0,u1] da curva, com normais radiais. */
function tubeAlong(
  curve: THREE.CatmullRomCurve3,
  frames: { normals: THREE.Vector3[]; binormals: THREE.Vector3[] },
  total: number,
  u0: number,
  u1: number,
  segs: number,
  radial: number,
  rFn: (u: number) => number,
  origin: THREE.Vector3,
) {
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= segs; i++) {
    const u = u0 + ((u1 - u0) * i) / segs
    const P = curve.getPointAt(u)
    const k = Math.min(total, Math.round(u * total))
    const N = frames.normals[k]
    const B = frames.binormals[k]
    const r = rFn(u)
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2
      const s = Math.sin(v)
      const c = -Math.cos(v)
      const n = new THREE.Vector3(c * N.x + s * B.x, c * N.y + s * B.y, c * N.z + s * B.z).normalize()
      pos.push(P.x + r * n.x - origin.x, P.y + r * n.y - origin.y, P.z + r * n.z - origin.z)
      nor.push(n.x, n.y, n.z)
      uv.push(i / segs, j / radial)
    }
  }
  for (let i = 1; i <= segs; i++) {
    for (let j = 1; j <= radial; j++) {
      const a = (radial + 1) * (i - 1) + (j - 1)
      const b = (radial + 1) * i + (j - 1)
      const c = (radial + 1) * i + j
      const d = (radial + 1) * (i - 1) + j
      idx.push(a, b, d, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  const m = new THREE.Mesh(g, mat(OLIVA, { roughness: 0.6, size: 0.4 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- leito seco: lama rachada em placas -----------------------------------
  const chao = new THREE.Group()
  const disco = cylinder(2.5, 2.58, 0.12, GAP, { roughness: 0.95 })
  disco.position.y = 0.06
  chao.add(disco)
  const sp = 0.5
  for (let row = -6; row <= 6; row++) {
    for (let col = -6; col <= 6; col++) {
      const x = col * sp + (row % 2 ? sp / 2 : 0) + (rand() - 0.5) * 0.06
      const z = row * sp * 0.866 + (rand() - 0.5) * 0.06
      if (Math.hypot(x, z) > 2.3) continue
      const R = 0.25 + rand() * 0.02
      const placa = cylinder(R, R * 1.02, 0.04, MUD[Math.floor(rand() * MUD.length)], { roughness: 0.92 }, 6)
      placa.position.set(x, GY - 0.02, z)
      placa.rotation.y = Math.PI / 6 + (rand() - 0.5) * 0.25
      placa.rotation.x = (rand() - 0.5) * 0.05
      chao.add(placa)
    }
  }
  // tufos de capim seco e seixos
  for (const [x, z] of [[-1.9, 0.6], [1.95, 0.75], [-1.5, 1.5], [1.6, -1.35]] as const) {
    const tufo = new THREE.Group()
    tufo.position.set(x, GY, z)
    for (let i = 0; i < 6; i++) {
      const fio = cone(0.025, 0.28 + rand() * 0.12, PALHA, { roughness: 0.9 }, 6)
      fio.position.set((rand() - 0.5) * 0.12, 0.15, (rand() - 0.5) * 0.12)
      fio.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6)
      tufo.add(fio)
    }
    chao.add(tufo)
  }
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.3 + rand() * 0.8
    const seixo = rock(0.05 + rand() * 0.04, '#a39c90', 10 + i)
    seixo.position.set(Math.cos(a) * d, GY + 0.02, Math.sin(a) * d)
    chao.add(seixo)
  }
  root.add(chao)

  // ---- fundo: pedras e tronco seco ------------------------------------------
  const fundo = new THREE.Group()
  const p1 = rock(0.36, ROCHA, 3)
  p1.position.set(1.35, GY + 0.18, -1.25)
  p1.scale.set(1.1, 0.8, 1)
  const p2 = rock(0.24, '#7f7c77', 7)
  p2.position.set(1.85, GY + 0.12, -0.7)
  fundo.add(p1, p2)
  const tronco = new THREE.Group()
  tronco.position.set(-1.25, GY + 0.15, -1.15)
  tronco.rotation.y = 0.45
  const tora = cylinder(0.15, 0.18, 1.5, TRONCO, { roughness: 0.85 })
  tora.rotation.z = Math.PI / 2
  tronco.add(tora)
  for (const sx of [-1, 1]) {
    const anel = cylinder(sx < 0 ? 0.14 : 0.17, sx < 0 ? 0.14 : 0.17, 0.02, TRONCO_CLARO, { roughness: 0.8 })
    anel.rotation.z = Math.PI / 2
    anel.position.x = sx * 0.75
    tronco.add(anel)
  }
  for (const [x, rz] of [[-0.3, 0.4], [0.35, -0.5]] as const) {
    const galho = cylinder(0.035, 0.05, 0.4, TRONCO, { roughness: 0.85 })
    galho.position.set(x, 0.28, 0)
    galho.rotation.z = rz
    tronco.add(galho)
  }
  fundo.add(tronco)
  root.add(fundo)

  // ---- sol enorme ------------------------------------------------------------
  const sol = new THREE.Group()
  sol.position.set(-1.55, 2.5, -2.2)
  const disc = sphere(0.45, SOL, { emissive: SOL, emissiveIntensity: 1.1 })
  sol.add(disc)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const raio = cone(0.06, 0.22, SOL, { emissive: SOL, emissiveIntensity: 0.9 }, 8)
    raio.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0)
    raio.rotation.z = a - Math.PI / 2
    sol.add(raio)
  }
  root.add(sol)

  // ---- tigela de barro vazia -----------------------------------------------
  const tigela = new THREE.Group()
  tigela.position.copy(BOWL)
  const cuia = lathe(
    [[0, 0], [0.25, 0], [0.33, 0.04], [0.4, 0.15], [0.43, 0.26], [0.44, 0.3], [0.41, 0.31], [0.38, 0.26], [0.36, 0.16], [0.3, 0.08], [0.2, 0.06], [0, 0.06]],
    BARRO,
    { roughness: 0.75 },
  )
  tigela.add(cuia)
  const aro = torus(0.425, 0.022, BARRO_ESC, { roughness: 0.7 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.305
  tigela.add(aro)
  const faixa = torus(0.418, 0.014, CREME, { roughness: 0.7 })
  faixa.rotation.x = Math.PI / 2
  faixa.position.y = 0.2
  tigela.add(faixa)
  const fundoSeco = cylinder(0.2, 0.2, 0.01, '#c98a5a', { roughness: 0.9 })
  fundoSeco.position.y = 0.065
  tigela.add(fundoSeco)
  root.add(tigela)

  // ---- sucuri: curva cabeça → chão → coluna → espiral → rabo -----------------
  const HEAD = new THREE.Vector3(0.98, 0.92, 0.85)
  const pts: THREE.Vector3[] = [
    HEAD.clone(),
    new THREE.Vector3(1.08, 0.62, 0.62),
    new THREE.Vector3(1.12, GY + 0.1, 0.25),
    new THREE.Vector3(0.95, GY + 0.1, -0.3),
    new THREE.Vector3(0.5, GY + 0.1, -0.62),
    new THREE.Vector3(0.0, GY + 0.12, -0.6),
    new THREE.Vector3(-0.18, 0.5, -0.42),
    new THREE.Vector3(-0.14, 1.1, -0.3),
    new THREE.Vector3(-0.06, 1.55, -0.18),
  ]
  const TURNS = 3
  const NSP = 36
  let spiralStart = pts.length
  for (let i = 0; i <= NSP; i++) {
    const t = i / NSP
    const phi = t * TURNS * Math.PI * 2
    const r = 0.4 - 0.24 * t
    const y = 1.7 - 0.72 * t
    pts.push(new THREE.Vector3(BOWL.x + r * Math.sin(phi), y, BOWL.z - r * Math.cos(phi)))
  }
  spiralStart = spiralStart + 0
  pts.push(new THREE.Vector3(BOWL.x + 0.06, 0.88, BOWL.z - 0.06))
  pts.push(new THREE.Vector3(BOWL.x, 0.78, BOWL.z))
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const TOTAL = 600
  const frames = curve.computeFrenetFrames(TOTAL, false)

  // u do início da espiral (ponto mais próximo de pts[spiralStart])
  let uSplit = 0.5
  let best = Infinity
  for (let i = 0; i <= 400; i++) {
    const u = i / 400
    const d = curve.getPointAt(u).distanceTo(pts[spiralStart])
    if (d < best) { best = d; uSplit = u }
  }
  const rFn = (u: number) => {
    if (u < 0.08) return 0.08 + (0.04 * u) / 0.08
    if (u < uSplit) return 0.12
    const t = (u - uSplit) / (1 - uSplit)
    return 0.12 - 0.1 * Math.pow(t, 1.3)
  }

  const ZERO = new THREE.Vector3()
  const corpo = new THREE.Group()
  corpo.add(tubeAlong(curve, frames, TOTAL, 0, uSplit, 160, 20, rFn, ZERO))

  const junta = curve.getPointAt(uSplit)
  const espiral = new THREE.Group()
  espiral.position.copy(junta)
  espiral.add(tubeAlong(curve, frames, TOTAL, uSplit, 1, 220, 20, rFn, junta))

  // manchas pretas ovais ao longo do corpo
  const manchaMat = mat(MANCHA, { roughness: 0.6, size: 0.1 })
  const manchaGeo = new THREE.SphereGeometry(1, 14, 10)
  for (let i = 0; i < 70; i++) {
    const u = 0.03 + (i / 70) * 0.94
    const k = Math.min(TOTAL, Math.round(u * TOTAL))
    const N = frames.normals[k]
    const B = frames.binormals[k]
    const T = frames.tangents[k]
    const r = rFn(u)
    const a = (i % 2 ? 1.1 : -1.1) + i * 0.35
    const out = N.clone().multiplyScalar(-Math.cos(a)).addScaledVector(B, Math.sin(a)).normalize()
    const side = new THREE.Vector3().crossVectors(out, T).normalize()
    const P = curve.getPointAt(u).addScaledVector(out, r * 0.93)
    const m = new THREE.Mesh(manchaGeo, manchaMat)
    m.castShadow = true
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, out, T))
    m.scale.set(r * 0.42, r * 0.18, r * 0.62)
    if (u < uSplit) {
      m.position.copy(P)
      corpo.add(m)
    } else {
      m.position.copy(P.sub(junta))
      espiral.add(m)
    }
  }
  root.add(corpo, espiral)

  // ---- cabeça larga, olhos amarelos meio fechados ----------------------------
  const cabeca = new THREE.Group()
  cabeca.position.copy(HEAD)
  const dir = new THREE.Vector3(-0.55, -0.2, 0.8).normalize()
  cabeca.lookAt(HEAD.clone().add(dir))
  cabeca.position.addScaledVector(dir, 0.1)
  const cranio = sphere(0.17, OLIVA, { roughness: 0.6 })
  cranio.scale.set(1.15, 0.62, 1.3)
  cabeca.add(cranio)
  const focinho = sphere(0.13, OLIVA, { roughness: 0.6 })
  focinho.scale.set(1.05, 0.55, 1.15)
  focinho.position.set(0, -0.01, 0.17)
  cabeca.add(focinho)
  const queixo = sphere(0.14, BARRIGA, { roughness: 0.65 })
  queixo.scale.set(1.0, 0.35, 1.3)
  queixo.position.set(0, -0.08, 0.1)
  cabeca.add(queixo)
  const boca = sphere(0.06, '#4a1f22', { roughness: 0.5 })
  boca.scale.set(1.3, 0.4, 0.6)
  boca.position.set(0, -0.06, 0.3)
  cabeca.add(boca)
  for (const s of [-1, 1]) {
    const olho = sphere(0.045, OLHO, { roughness: 0.25 })
    olho.position.set(s * 0.12, 0.07, 0.08)
    const pupila = capsule(0.008, 0.03, '#111111', { roughness: 0.2 })
    pupila.position.set(s * 0.13, 0.07, 0.12)
    const palpebra = sphere(0.048, OLIVA_ESC, { roughness: 0.6 })
    palpebra.scale.set(1.05, 0.6, 1.05)
    palpebra.position.set(s * 0.12, 0.1, 0.08)
    const listra = capsule(0.018, 0.14, MANCHA, { roughness: 0.6 })
    listra.rotation.x = Math.PI / 2
    listra.position.set(s * 0.15, 0.04, -0.06)
    const narina = sphere(0.012, '#1a1a1a', { roughness: 0.4 })
    narina.position.set(s * 0.05, 0.04, 0.3)
    cabeca.add(olho, pupila, palpebra, listra, narina)
  }
  root.add(cabeca)

  // ---- língua bifurcada caída --------------------------------------------------
  const lingua = new THREE.Group()
  lingua.position.set(0, -0.07, 0.31)
  lingua.rotation.x = 0.9 // caída pra frente e pra baixo
  cabeca.add(lingua)
  const haste = capsule(0.016, 0.13, LINGUA, { roughness: 0.35 })
  haste.position.y = -0.08
  lingua.add(haste)
  for (const s of [-1, 1]) {
    const ponta = capsule(0.011, 0.05, LINGUA, { roughness: 0.35 })
    ponta.position.set(s * 0.018, -0.18, 0)
    ponta.rotation.z = s * 0.4
    lingua.add(ponta)
  }

  // ---- a gota única ------------------------------------------------------------
  const GOTA_Y = 0.6
  const gota = new THREE.Group()
  gota.position.set(BOWL.x, GOTA_Y, BOWL.z)
  const pingo = lathe(
    [[0, 0], [0.03, 0.008], [0.045, 0.03], [0.042, 0.055], [0.028, 0.08], [0.012, 0.1], [0, 0.115]],
    GOTA,
    { roughness: 0.1, emissive: GOTA, emissiveIntensity: 0.35 },
  )
  pingo.scale.setScalar(1.3)
  gota.add(pingo)
  const brilho = sphere(0.012, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 1 })
  brilho.position.set(0.02, 0.06, 0.04)
  gota.add(brilho)
  root.add(gota)

  // pedrinha decorativa de rbox (tábua de pedra) ao lado da tigela, acabamento
  const laje = rbox(0.34, 0.06, 0.24, 0.03, '#a59a8a', { roughness: 0.85 })
  laje.position.set(-0.75, GY + 0.03, 0.75)
  laje.rotation.y = 0.5
  chao.add(laje)
  const capim = puff(0.1, '#9c9a55', 4, 9, { roughness: 0.9 })
  capim.position.set(-0.75, GY + 0.1, 0.75)
  chao.add(capim)

  const parts = [
    { name: 'chao', group: 'rio', object: chao },
    { name: 'fundo', group: 'rio', object: fundo },
    { name: 'sol', group: 'rio', object: sol },
    { name: 'tigela', group: 'tigela', object: tigela },
    { name: 'corpo', group: 'sucuri', object: corpo },
    { name: 'cabeca', group: 'sucuri', object: cabeca },
    { name: 'espiral', group: 'torce', object: espiral },
    { name: 'gota', group: 'gota', object: gota },
    { name: 'lingua', group: 'gota', object: lingua },
  ]

  const solY = sol.position.y
  const cabY = cabeca.position.y
  const build = [
    seq('chao-rise', 'chao', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'O rio secou: o leito virou lama rachada em placas.',
    }),
    seq('fundo-rise', 'fundo', 0.3, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),
    seq('sol-sobe', 'sol', 0.6, 1.2, [ch('position.y', solY - 1.6, solY)], {
      ease: 'easeOut',
      caption: 'E lá em cima, um sol enorme, sem nenhuma nuvem.',
    }),
    seq('tigela-rise', 'tigela', 2.4, 0.7, [riseFrom(GY, 0.8)], {
      ease: 'easeOut',
      caption: 'No meio do leito, uma TIGELA de barro — vazia.',
    }),
    seq('corpo-rise', 'corpo', 3.9, 0.9, [riseFrom(0, 1.8)], {
      ease: 'easeOut',
      caption: 'A sucuri, cobra-d\'água que nunca passou um dia sem nadar, está esturricada: IÁ! É…',
    }),
    seq('cabeca-rise', 'cabeca', 4.1, 0.8, [ch('position.y', cabY - 1.8, cabY)], { ease: 'easeOut' }),
    seq('espiral-torce', 'espiral', 6.0, 1.1, [
      ch('scale.y', 0.05, 1),
      ch('scale.x', 0.6, 1),
      ch('scale.z', 0.6, 1),
    ], {
      ease: 'easeOut',
      caption: '…e se TORCE inteira, feito pano de chão, por cima da TIGELA: TÓRC… TI!',
    }),
    seq('gota-nasce', 'gota', 8.0, 0.4, [
      ch('position.y', 0.72, 0.72),
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut', caption: 'Pinga uma gota. Uma só.' }),
    seq('gota-cai', 'gota', 8.5, 0.5, [ch('position.y', 0.72, GOTA_Y)], { ease: 'easeIn' }),
    seq('lingua-cai', 'lingua', 9.4, 0.6, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Língua pra fora, olhando a tigela quase seca…',
    }),
    seq('lingua-pende', 'lingua', 10.6, 0.6, [ch('rotation.x', 0.6, 0.9)], {
      ease: 'easeInOut',
      caption: 'Jag är törstig. — Estou com sede.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.7, 5.2], target: [0, 1.0, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-torstig',
    contexto:
      "Depois do treino, numa trilha de verão, na casa de alguém ou — principalmente — de criança no banco de trás do carro. A resposta típica é 'Vill du ha vatten?', e a água da torneira (kranvatten) é ótima.",
    fraseFonte: 'Estou com sede.',
    fraseAlvo: 'Jag är törstig.',
    pronuncia:
      "iá é TÖSH-ti ('jag' = iá; 'är' = é, aberto e curto; 'törstig' com toda a força no TÖ — Ö CURTO e meio aberto: lábios redondos de Ó com a língua lá na frente, de É —; o R e o S se fundem num X de 'xarope', como em 'förstår' e 'personnummer', e o T vem colado e seco, nunca 'tchi'; o -ig final quase some na fala: um 'ti' rápido, no máximo com um G leve)",
    ponteSonora:
      "IÁ! É... TÓRC(e)-TI(gela)! (4 sílabas: iá-é-TÖSH-ti; a força toda no TÓR; IÁ é o 'jag' de sempre, o MESMO de 'Jag är hungrig', 'Jag är trött' e 'Jag är mätt' — I de IOGA, nunca o J chiado de 'já'; É = 'är', aberto e curto; TÓRC(e) = o TORCE, a coisa que a sucuri faz melhor, cortado antes do -E: o português já diz 'TÓR-ce' com Ó ABERTO e a força no lugar certo — mantenha os lábios redondos do Ó e jogue a língua pra frente, pro É: é o ö curto, o mesmo do TRÖTT da treta de beicinho de 'Jag är trött', que lá se chega pelo outro lado; MAS não confunda as duas: em 'trött' (cansado) o R vem ANTES da vogal, TRE-ta; aqui vem DEPOIS, TÓR-ce; o R é o R CAIPIRA, de língua enrolada pra trás — e o S sai SEM desenrolar a língua: R e S se fundem num X chiado de 'xarope', que é exatamente o 'rs' sueco, o mesmo do FEIXE-THOR de 'Jag förstår'; nunca o RR soprado carioca, que dá 'tóh-se'; e sem o -E: nada de vogal entre o chiado e o T; TI(gela) = só o começo da TIGELA, colado e fraquinho, com T SECO de 'tatu' — nunca o 'tchi' com que a gente fala 'tigela' —; o -GELA não entra, e o G de 'törstig' é tão fraco que pode sumir: TÖSH-ti)",
    historia:
      "O rio secou e a sucuri, cobra-d'água que nunca passou um dia sem nadar, está esturricada no meio da lama rachada. Ela solta um sibilo rouco — IÁ! É... — e faz o que sabe fazer: se TORCE inteira, feito pano de chão, em espiral, por cima de uma TIGELA de barro vazia, pra tirar do próprio corpo qualquer resto de água. TÓRC... TI! Pinga uma gota. Uma só. Ela fica de língua pra fora, olhando a tigela quase seca: está morrendo de sede.",
  },
  createScene,
}

export default card
