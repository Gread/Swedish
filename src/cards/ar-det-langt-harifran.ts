import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, rock, puff,
} from '../rig/helpers'

/**
 * "Är det långt härifrån?" — É DÊ... LÓNG-T... RRÉ-RI-FRÔN?
 *
 * Na saída da vila, um husky atrelado ao trenó para na BARRA de uma trilha de
 * neve batida em forma de T — e a PERNA do T (o LONG T) corre até sumir no
 * horizonte. No trenó, a trouxa: uma FRONHA estufada com um pau espetado em
 * pé, enrolado de HERA arrancada do muro de casa (HERA + I + FRONHA =
 * härifrån, daqui). Ele arregala os olhos azuis e pergunta pra gente.
 *
 * Perspectiva forçada: a perna afina e os pinheiros encolhem até o fundo do
 * diorama, que vira horizonte. O acento saturado é o verde vivo da HERA.
 */

const NEVE = '#eef3f8'
const NEVE_SOMBRA = '#dbe4ee'
const BORDA = '#5d6b78'
const TRILHA = '#97abc2'
const TRILHA_BORDA = '#bac8d8'
const PINHO = '#28513a'
const PINHO_CLARO = '#346247'
const TRONCO = '#5e4330'
const MADEIRA = '#d8b07a'
const MADEIRA_ESC = '#b58a55'
const FRONHA = '#f7f5f0'
const FRONHA_SOMBRA = '#e4e0d6'
const CORDA = '#7a5232'
const PAU = '#7b5634'
const HERA = '#2f9a45' // acento: a HERA enrolada no pau
const HERA_ESC = '#1f6e31'
const CINZA = '#6f7a88'
const CINZA_ESC = '#55606d'
const BRANCO = '#f3f5f7'
const AZUL_OLHO = '#36a6f2'
const NARIZ = '#24262b'
const ARREIO = '#c63a30'

const GY = 0.2 // topo da neve
const BAR_Z = 1.0 // eixo da barra do T (na frente)
const BAR_X = 0.35 // centro da barra
const BAR_HX = 1.75
const BAR_HD = 0.38
const LEG_F = BAR_Z - BAR_HD + 0.05 // começo da perna
const LEG_B = -2.6 // fim da perna, lá no "horizonte"
const LEG_XF = 0.85 // centro da perna na frente
const LEG_XB = 0.5 // centro da perna no fundo
const LEG_WF = 0.95
const LEG_WB = 0.08

const HX = -0.1 // husky
const HZ = 1.02
const HUSKY_YAW = Math.PI / 2 - 0.4 // corpo andando para +x, um pouco virado à câmera
const HEAD_YAW = -0.8 // cabeça virada para a câmera
const HEAD_TILT = 0.16 // cabeça inclinada de quem pergunta
// trenó atrás do husky, na mesma linha (vem da vila, lá atrás à esquerda)
const SLED_GAP = 1.72
const SX = HX - SLED_GAP * Math.sin(HUSKY_YAW)
const SZ = HZ - SLED_GAP * Math.cos(HUSKY_YAW)
const SLED_YAW = HUSKY_YAW - Math.PI / 2
const DECK = 0.3 // topo do estrado do trenó (local)
const FRONHA_Y = DECK + 0.19
const PAU_Y = DECK + 0.05

/** Laje plana com bordas chanfradas (shape no plano xz do mundo). */
function slab(shape: THREE.Shape, color: string, h = 0.03) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.014,
    bevelSegments: 2,
    curveSegments: 12,
  })
  geo.rotateX(-Math.PI / 2) // shape (x, y) → mundo (x, -z)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.95, size: 1.2 }))
  m.receiveShadow = true
  return m
}

/** Estádio (retângulo de pontas redondas) centrado na origem. */
function estadio(hx: number, hd: number) {
  const s = new THREE.Shape()
  s.moveTo(-hx, -hd)
  s.lineTo(hx, -hd)
  s.absarc(hx, 0, hd, -Math.PI / 2, Math.PI / 2, false)
  s.lineTo(-hx, hd)
  s.absarc(-hx, 0, hd, Math.PI / 2, (3 * Math.PI) / 2, false)
  return s
}

/** Perna do T em coordenadas do mundo (x, z) → shape (x, -z). */
function pernaShape(extra: number) {
  const s = new THREE.Shape()
  const wf = LEG_WF / 2 + extra
  const wb = LEG_WB / 2 + extra * 0.4
  s.moveTo(LEG_XF - wf, -LEG_F)
  s.lineTo(LEG_XF + wf, -LEG_F)
  s.lineTo(LEG_XB + wb, -LEG_B)
  s.lineTo(LEG_XB - wb, -LEG_B)
  s.closePath()
  return s
}

/** Pinheiro com neve nas pontas: altura ≈ 1.1·s. */
function pinheiro(s: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const tronco = cylinder(0.05 * s, 0.07 * s, 0.26 * s, TRONCO, { roughness: 0.85 })
  tronco.position.y = 0.13 * s
  g.add(tronco)
  const camadas: [number, number, number][] = [[0.4, 0.5, 0.45], [0.31, 0.44, 0.68], [0.21, 0.36, 0.9]]
  camadas.forEach(([r, h, y], i) => {
    const c = cone(r * s, h * s, i % 2 === 0 ? PINHO : PINHO_CLARO, { roughness: 0.85 }, 9)
    c.position.y = y * s
    c.rotation.y = rand() * Math.PI
    g.add(c)
    const neve = cone(r * s * 0.55, h * s * 0.42, NEVE, { roughness: 0.9 }, 9)
    neve.position.y = y * s + h * s * 0.3
    neve.rotation.y = c.rotation.y
    g.add(neve)
  })
  g.rotation.set((rand() - 0.5) * 0.06, rand() * Math.PI, (rand() - 0.5) * 0.06)
  return g
}

/** Cilindro ligando dois pontos (no espaço do pai). */
function haste(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const dir = b.clone().sub(a)
  const len = dir.length()
  const c = cylinder(r, r, len, color, { roughness: 0.7 }, 12)
  c.position.copy(a).add(b).multiplyScalar(0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return c
}

/** Tubo ao longo de pontos (esquis curvos, cipó da hera). */
function tubo(pts: THREE.Vector3[], r: number, color: string, segs = 48) {
  const curve = new THREE.CatmullRomCurve3(pts)
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, r, 10, false), mat(color, { roughness: 0.6, size: 0.6 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Folha de hera: três lóbulos achatados, de frente para +z local. */
function folhaHera(s: number, cor: string) {
  const g = new THREE.Group()
  const lobos: [number, number, number][] = [[0, 0.035, 1], [-0.035, -0.005, 0.8], [0.035, -0.005, 0.8]]
  for (const [lx, ly, k] of lobos) {
    const l = sphere(0.04 * s * k, cor, { roughness: 0.45 }, 14)
    l.scale.set(1, 1, 0.3)
    l.position.set(lx * s, ly * s, 0)
    g.add(l)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(7311)

  // ---- base: disco de neve sobre borda de pedra -----------------------------
  const base = new THREE.Group()
  const borda = cylinder(2.78, 2.88, 0.14, BORDA, { roughness: 0.9 })
  borda.position.y = 0.07
  base.add(borda)
  const neve = cylinder(2.76, 2.79, 0.07, NEVE, { roughness: 0.92 })
  neve.position.y = GY - 0.035
  base.add(neve)
  // beiral de neve caindo pela borda
  const beiral = torus(2.76, 0.05, NEVE, { roughness: 0.92 })
  beiral.rotation.x = Math.PI / 2
  beiral.position.y = GY - 0.01
  base.add(beiral)

  // montes de neve e pedrinhas longe da trilha
  const longeDaTrilha = (x: number, z: number) => {
    if (Math.abs(z - BAR_Z) < BAR_HD + 0.3 && Math.abs(x - BAR_X) < BAR_HX + 0.5) return false
    const t = (LEG_F - z) / (LEG_F - LEG_B)
    if (t < -0.1 || t > 1.05) return true
    const cx = LEG_XF + (LEG_XB - LEG_XF) * t
    const hw = (LEG_WF + (LEG_WB - LEG_WF) * t) / 2
    return Math.abs(x - cx) > hw + 0.3
  }
  let n = 0
  while (n < 14) {
    const a = rand() * Math.PI * 2
    const rr = 1.0 + rand() * 1.55
    const x = Math.cos(a) * rr
    const z = Math.sin(a) * rr
    if (!longeDaTrilha(x, z)) continue
    if (x < -0.8 && z < 0.6 && z > -1.0) continue // lugar do trenó
    n++
    const monte = puff(0.13 + rand() * 0.12, n % 3 ? NEVE : NEVE_SOMBRA, 4, 200 + n, { roughness: 0.92 })
    monte.position.set(x, GY, z)
    monte.scale.y = 0.45
    base.add(monte)
  }
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2
    const rr = 1.5 + rand() * 1.0
    const x = Math.cos(a) * rr
    const z = Math.sin(a) * rr
    if (!longeDaTrilha(x, z)) continue
    const pedra = rock(0.07 + rand() * 0.05, '#7f8892', 40 + i, { roughness: 0.9 })
    pedra.position.set(x, GY + 0.02, z)
    base.add(pedra)
    const capa = sphere(0.06, NEVE, { roughness: 0.9 }, 12)
    capa.scale.set(1.1, 0.4, 1.1)
    capa.position.set(x, GY + 0.08, z)
    base.add(capa)
  }
  root.add(base)

  // ---- barra do T: aos pés do husky ----------------------------------------
  const barra = new THREE.Group()
  barra.position.set(BAR_X, GY - 0.02, BAR_Z)
  const barraBorda = slab(estadio(BAR_HX + 0.04, BAR_HD + 0.05), TRILHA_BORDA, 0.022)
  barraBorda.position.y = -0.004
  barra.add(barraBorda)
  barra.add(slab(estadio(BAR_HX, BAR_HD), TRILHA))
  // pegadas de patinha na neve batida, vindas da vila
  for (let i = 0; i < 7; i++) {
    const pegada = cylinder(0.035, 0.035, 0.01, '#8499b1', { roughness: 0.95 }, 12)
    pegada.scale.z = 1.3
    pegada.position.set(-1.6 + i * 0.2, 0.035, (i % 2 ? 1 : -1) * 0.09 - 0.12)
    barra.add(pegada)
  }
  root.add(barra)

  // ---- perna do T: corre até sumir no horizonte ----------------------------
  const perna = new THREE.Group()
  perna.position.y = GY - 0.024
  const pernaBorda = slab(pernaShape(0.05), TRILHA_BORDA, 0.022)
  pernaBorda.position.y = -0.004
  perna.add(pernaBorda)
  perna.add(slab(pernaShape(0), TRILHA))
  // sulcos dos esquis, que também afinam com a distância
  for (const k of [-0.22, 0.22]) {
    const a = new THREE.Vector3(LEG_XF + k * LEG_WF, 0.04, LEG_F - 0.1)
    const b = new THREE.Vector3(LEG_XB + k * LEG_WB, 0.04, LEG_B + 0.2)
    const sulco = haste(a, b, 0.014, '#93a5b9')
    sulco.scale.set(1, 1, 0.5)
    perna.add(sulco)
  }
  root.add(perna)

  // ---- pinheiros ao lado da perna (encolhem com a distância) ---------------
  const pinheiros = new THREE.Group()
  const p1 = pinheiro(1.0, 11)
  p1.position.set(1.75, GY, -0.75)
  pinheiros.add(p1)
  const p2 = pinheiro(0.65, 12)
  p2.position.set(-0.1, GY, -1.75)
  pinheiros.add(p2)
  for (const [px, pz, ps, seed] of [[1.35, -1.6, 0.5, 13], [-0.15, -2.2, 0.32, 14], [0.95, -2.45, 0.24, 15], [1.45, -2.15, 0.3, 16]] as const) {
    const p = pinheiro(ps, seed)
    p.position.set(px, GY, pz)
    pinheiros.add(p)
  }
  root.add(pinheiros)

  // ---- trenó de madeira clara ----------------------------------------------
  const treno = new THREE.Group()
  treno.position.set(SX, GY, SZ)
  treno.rotation.y = SLED_YAW
  for (const z of [-0.27, 0.27]) {
    const esqui = tubo(
      [
        new THREE.Vector3(-0.66, 0.03, z),
        new THREE.Vector3(0.1, 0.03, z),
        new THREE.Vector3(0.52, 0.035, z),
        new THREE.Vector3(0.7, 0.1, z),
        new THREE.Vector3(0.76, 0.24, z),
        new THREE.Vector3(0.68, 0.34, z),
      ],
      0.028,
      MADEIRA_ESC,
    )
    esqui.scale.set(1, 1, 1)
    treno.add(esqui)
    for (const x of [-0.5, -0.05, 0.4]) {
      const pe = cylinder(0.022, 0.022, DECK - 0.06, MADEIRA_ESC, { roughness: 0.6 }, 10)
      pe.position.set(x, (DECK - 0.03) / 2 + 0.03, z)
      treno.add(pe)
    }
    // corrimão lateral
    const corrimao = cylinder(0.02, 0.02, 1.0, MADEIRA_ESC, { roughness: 0.6 }, 10)
    corrimao.rotation.z = Math.PI / 2
    corrimao.position.set(-0.08, DECK + 0.16, z)
    treno.add(corrimao)
    for (const x of [-0.55, 0.38]) {
      const poste = cylinder(0.018, 0.018, 0.16, MADEIRA_ESC, { roughness: 0.6 }, 10)
      poste.position.set(x, DECK + 0.08, z)
      treno.add(poste)
    }
    // guidão atrás
    const guia = cylinder(0.024, 0.024, 0.62, MADEIRA_ESC, { roughness: 0.6 }, 10)
    guia.position.set(-0.64, DECK + 0.28, z)
    guia.rotation.z = 0.18
    treno.add(guia)
  }
  const guidao = cylinder(0.026, 0.026, 0.62, MADEIRA_ESC, { roughness: 0.6 }, 10)
  guidao.rotation.x = Math.PI / 2
  guidao.position.set(-0.69, DECK + 0.58, 0)
  treno.add(guidao)
  // estrado de ripas
  for (let i = 0; i < 6; i++) {
    const ripa = rbox(0.17, 0.035, 0.64, 0.012, i % 2 ? MADEIRA : '#e2bd8a', { roughness: 0.6 })
    ripa.position.set(-0.52 + i * 0.19, DECK - 0.018, 0)
    treno.add(ripa)
  }
  root.add(treno)

  // ---- fronha estufada amarrada com corda ----------------------------------
  const fronha = new THREE.Group()
  fronha.position.set(-0.02, FRONHA_Y, 0)
  const saco = rbox(0.86, 0.38, 0.54, 0.18, FRONHA, { roughness: 0.88 })
  fronha.add(saco)
  const babado = rbox(0.06, 0.34, 0.5, 0.025, FRONHA_SOMBRA, { roughness: 0.88 })
  babado.position.x = -0.44
  fronha.add(babado)
  for (const cx of [-0.22, 0.22]) {
    const corda = torus(0.3, 0.022, CORDA, { roughness: 0.85 })
    corda.rotation.y = Math.PI / 2
    corda.scale.set(0.95, 0.68, 1)
    corda.position.set(cx, -0.01, 0)
    fronha.add(corda)
  }
  const no = sphere(0.04, CORDA, { roughness: 0.85 }, 12)
  no.position.set(0.22, 0.2, 0.06)
  fronha.add(no)
  treno.add(fronha)

  // ---- pau espetado em pé no meio da fronha --------------------------------
  const PAU_H = 1.25
  const pau = new THREE.Group()
  pau.position.set(0.0, PAU_Y, 0)
  const vara = cylinder(0.034, 0.042, PAU_H, PAU, { roughness: 0.8 }, 14)
  vara.position.y = PAU_H / 2
  pau.add(vara)
  const ponta = sphere(0.036, PAU, { roughness: 0.8 }, 12)
  ponta.position.y = PAU_H
  pau.add(ponta)
  const galho = cylinder(0.014, 0.02, 0.14, PAU, { roughness: 0.8 }, 8)
  galho.position.set(0.05, PAU_H * 0.72, 0)
  galho.rotation.z = -0.8
  pau.add(galho)
  treno.add(pau)

  // ---- hera enrolada no pau, da base ao topo -------------------------------
  const hera = new THREE.Group()
  hera.position.set(0.0, FRONHA_Y + 0.17, 0)
  const HERA_H = PAU_H - (FRONHA_Y + 0.17 - PAU_Y) + 0.02
  const voltas = 3.2
  const cipoPts: THREE.Vector3[] = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    const a = t * voltas * Math.PI * 2
    cipoPts.push(new THREE.Vector3(Math.cos(a) * 0.05, t * HERA_H, Math.sin(a) * 0.05))
  }
  hera.add(tubo(cipoPts, 0.012, HERA_ESC, 120))
  const NF = 17
  for (let i = 0; i < NF; i++) {
    const t = (i + 0.4) / NF
    const a = t * voltas * Math.PI * 2 + 0.3
    const s = 1.25 - t * 0.35
    const folha = folhaHera(s * 1.35, i % 3 === 0 ? HERA_ESC : HERA)
    folha.position.set(Math.cos(a) * 0.1, t * HERA_H, Math.sin(a) * 0.1)
    // a folha olha para fora do pau
    folha.rotation.y = Math.PI / 2 - a
    folha.rotation.x = -0.35
    hera.add(folha)
  }
  treno.add(hera)

  // ---- HUSKY: corpo cinza e branco -----------------------------------------
  const husky = new THREE.Group()
  husky.position.set(HX, GY, HZ)
  husky.rotation.y = HUSKY_YAW
  root.add(husky)

  const dorso = capsule(0.3, 0.62, CINZA, { roughness: 0.88 })
  dorso.rotation.x = Math.PI / 2
  dorso.position.set(0, 0.82, -0.02)
  husky.add(dorso)
  const peito = sphere(0.3, BRANCO, { roughness: 0.88 })
  peito.scale.set(0.95, 1.05, 0.9)
  peito.position.set(0, 0.74, 0.42)
  husky.add(peito)
  const barriga = capsule(0.24, 0.5, BRANCO, { roughness: 0.88 })
  barriga.rotation.x = Math.PI / 2
  barriga.position.set(0, 0.68, 0.0)
  husky.add(barriga)
  const anca = sphere(0.3, CINZA, { roughness: 0.88 })
  anca.position.set(0, 0.84, -0.38)
  husky.add(anca)
  const pescoco = capsule(0.19, 0.24, CINZA, { roughness: 0.88 })
  pescoco.position.set(0, 1.08, 0.5)
  pescoco.rotation.x = 0.55
  husky.add(pescoco)
  const papo = sphere(0.17, BRANCO, { roughness: 0.88 })
  papo.position.set(0, 0.98, 0.6)
  husky.add(papo)

  for (const side of [-1, 1]) {
    // patas da frente
    const pf = capsule(0.085, 0.46, BRANCO, { roughness: 0.88 })
    pf.position.set(side * 0.16, 0.34, 0.42)
    husky.add(pf)
    const ombro = sphere(0.15, CINZA, { roughness: 0.88 })
    ombro.position.set(side * 0.16, 0.72, 0.36)
    husky.add(ombro)
    // patas de trás: coxa cinza + canela branca
    const coxa = sphere(0.18, CINZA, { roughness: 0.88 })
    coxa.scale.set(0.8, 1.15, 1)
    coxa.position.set(side * 0.18, 0.64, -0.4)
    husky.add(coxa)
    const pt = capsule(0.085, 0.36, BRANCO, { roughness: 0.88 })
    pt.position.set(side * 0.18, 0.3, -0.44)
    pt.rotation.x = -0.12
    husky.add(pt)
    for (const pz of [0.47, -0.42]) {
      const pe = sphere(0.1, BRANCO, { roughness: 0.88 })
      pe.scale.set(0.95, 0.55, 1.3)
      pe.position.set(side * (pz > 0 ? 0.16 : 0.18), 0.055, pz)
      husky.add(pe)
    }
  }

  // ---- arreio vermelho (filho do husky, peça rígida) -----------------------
  const arreio = new THREE.Group()
  const cintaPeito = torus(0.31, 0.026, ARREIO, { roughness: 0.6 })
  cintaPeito.position.set(0, 0.8, 0.24)
  cintaPeito.scale.set(1.02, 1.0, 1)
  arreio.add(cintaPeito)
  const cintaBarriga = torus(0.3, 0.026, ARREIO, { roughness: 0.6 })
  cintaBarriga.position.set(0, 0.8, -0.18)
  cintaBarriga.scale.set(1.04, 0.98, 1)
  arreio.add(cintaBarriga)
  const lombo = rbox(0.09, 0.03, 0.5, 0.012, ARREIO, { roughness: 0.6 })
  lombo.position.set(0, 1.115, 0.03)
  arreio.add(lombo)
  const coleira = torus(0.19, 0.03, ARREIO, { roughness: 0.6 })
  coleira.position.set(0, 1.06, 0.55)
  coleira.rotation.x = 0.55
  arreio.add(coleira)
  const fivela = rbox(0.06, 0.05, 0.02, 0.01, '#c9ccd1', { roughness: 0.3, metalness: 0.7 })
  fivela.position.set(0, 1.115, 0.3)
  arreio.add(fivela)
  husky.add(arreio)

  // tirantes até a frente do trenó (calculados no mundo, trazidos ao local)
  husky.updateMatrixWorld(true)
  treno.updateMatrixWorld(true)
  const inv = new THREE.Matrix4().copy(husky.matrixWorld).invert()
  for (const z of [-0.2, 0.2]) {
    const a = new THREE.Vector3(0.24 * Math.sign(z), 0.74, -0.2)
    const bWorld = new THREE.Vector3(0.68, 0.3, z).applyMatrix4(treno.matrixWorld)
    const b = bWorld.applyMatrix4(inv)
    arreio.add(haste(a, b, 0.016, ARREIO))
  }

  // ---- cabeça: máscara cinza, olhos azuis arregalados, orelhas em pé -------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.32, 0.68)
  cabeca.rotation.set(-0.12, HEAD_YAW, HEAD_TILT)
  husky.add(cabeca)

  const cranio = sphere(0.25, CINZA, { roughness: 0.88 })
  cranio.scale.set(1.05, 0.95, 1)
  cabeca.add(cranio)
  const bochechas = sphere(0.22, BRANCO, { roughness: 0.88 })
  bochechas.scale.set(1.12, 0.78, 0.95)
  bochechas.position.set(0, -0.08, 0.06)
  cabeca.add(bochechas)
  const focinho = capsule(0.1, 0.14, BRANCO, { roughness: 0.88 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.09, 0.26)
  cabeca.add(focinho)
  const testa = capsule(0.05, 0.12, CINZA_ESC, { roughness: 0.88 })
  testa.rotation.x = Math.PI / 2 - 0.5
  testa.position.set(0, 0.06, 0.23)
  cabeca.add(testa)
  const nariz = sphere(0.05, NARIZ, { roughness: 0.3 })
  nariz.scale.set(1.15, 0.85, 1)
  nariz.position.set(0, -0.06, 0.42)
  cabeca.add(nariz)
  const boca = sphere(0.055, '#3a2328', { roughness: 0.5 })
  boca.scale.set(1.2, 0.7, 0.6)
  boca.position.set(0, -0.17, 0.34)
  cabeca.add(boca)

  for (const side of [-1, 1]) {
    const esclera = sphere(0.075, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.55
    esclera.position.set(side * 0.105, 0.04, 0.215)
    const iris = sphere(0.05, AZUL_OLHO, { roughness: 0.2 })
    iris.scale.z = 0.45
    iris.position.set(side * 0.105, 0.04, 0.245)
    const pupila = sphere(0.024, '#111214', { roughness: 0.2 })
    pupila.scale.z = 0.5
    pupila.position.set(side * 0.105, 0.04, 0.262)
    const brilho = sphere(0.011, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.105 + 0.018, 0.06, 0.27)
    cabeca.add(esclera, iris, pupila, brilho)
    // sobrancelha branca erguida (espanto)
    const sobr = capsule(0.022, 0.06, BRANCO, { roughness: 0.88 })
    sobr.rotation.z = Math.PI / 2 - side * 0.35
    sobr.position.set(side * 0.11, 0.15, 0.2)
    cabeca.add(sobr)
    // orelhas triangulares em pé
    const orelha = cone(0.09, 0.22, CINZA_ESC, { roughness: 0.88 }, 16)
    orelha.scale.z = 0.55
    orelha.position.set(side * 0.14, 0.27, -0.03)
    orelha.rotation.z = -side * 0.22
    cabeca.add(orelha)
    const dentroOrelha = cone(0.055, 0.15, '#e8c9c4', { roughness: 0.9 }, 12)
    dentroOrelha.scale.z = 0.4
    dentroOrelha.position.set(side * 0.138, 0.255, 0.0)
    dentroOrelha.rotation.z = -side * 0.22
    cabeca.add(dentroOrelha)
  }

  // ---- rabo peludo enrolado por cima das costas -----------------------------
  const rabo = new THREE.Group()
  rabo.position.set(0, 0.98, -0.62)
  husky.add(rabo)
  const raboPts: [number, number, number, number][] = [
    [0, 0, 0, 0.1], [0, 0.12, -0.07, 0.11], [0, 0.26, -0.06, 0.12], [0, 0.36, 0.04, 0.12],
    [0, 0.38, 0.17, 0.11], [0, 0.31, 0.27, 0.1],
  ]
  raboPts.forEach(([x, y, z, r], i) => {
    const bola = sphere(r, i >= 4 ? BRANCO : CINZA, { roughness: 0.9 })
    bola.position.set(x, y, z)
    rabo.add(bola)
  })

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'neve', object: base },
    { name: 'barra', group: 'trilha', object: barra },
    { name: 'perna', group: 'trilha', object: perna },
    { name: 'pinheiros', group: 'trilha', object: pinheiros },
    { name: 'treno', group: 'treno', object: treno },
    { name: 'fronha', group: 'treno', object: fronha },
    { name: 'pau', group: 'hera', object: pau },
    { name: 'hera', group: 'hera', object: hera },
    { name: 'husky', group: 'husky', object: husky },
    { name: 'cabeca', group: 'husky', object: cabeca },
    { name: 'rabo', group: 'husky', object: rabo },
    { name: 'arreio', group: 'husky', object: arreio },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Na saída da vila, tudo coberto de neve…',
    }),

    seq('barra-abre', 'barra', 1.4, 0.6, [ch('scale.x', 0.02, 1)], {
      ease: 'easeOut',
      caption: 'Uma trilha batida desenha um T: a barra aqui na frente…',
    }),
    seq('perna-estica', 'perna', 2.4, 1.1, [ch('scale.z', 0.02, 1), ch('position.z', LEG_F * 0.98, 0)], {
      ease: 'easeInOut',
      caption: '…e a perna, LONGUÍSSIMA, sumindo no horizonte: um LONG T.',
    }),
    seq('pinheiros-rise', 'pinheiros', 2.9, 0.8, [riseFrom(0, 1.6)], { ease: 'easeOut' }),

    seq('treno-rise', 'treno', 4.3, 0.7, [riseFrom(GY, 1.0)], {
      ease: 'easeOut',
      caption: 'Na barra, um trenó com a trouxa de viagem: uma FRONHA estufada.',
    }),
    seq(
      'fronha-estufa',
      'fronha',
      4.7,
      0.6,
      [ch('scale.x', 0.2, 1), ch('scale.y', 0.2, 1), ch('scale.z', 0.2, 1)],
      { ease: 'easeOut' },
    ),

    seq('pau-espeta', 'pau', 5.8, 0.5, [ch('position.y', PAU_Y + 1.4, PAU_Y)], {
      ease: 'easeIn',
      caption: 'Espetado nela, um pau em pé — enrolado na HERA do muro de casa: RRÉ-RI-FRÔN.',
    }),
    seq('hera-cresce', 'hera', 6.4, 1.0, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),

    seq('husky-rise', 'husky', 7.8, 0.8, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'Atrelado ao trenó, o husky olha a trilha sem fim e arregala os olhos: É DÊ… LONG T?!',
    }),
    seq('arreio-aperta', 'arreio', 8.1, 0.5, [ch('scale.x', 1.4, 1), ch('scale.y', 1.4, 1)], { ease: 'easeOut' }),
    seq('rabo-enrola', 'rabo', 8.3, 0.6, [ch('rotation.x', 1.4, 0)], { ease: 'easeOut' }),
    seq('cabeca-vira', 'cabeca', 8.4, 0.9, [ch('rotation.y', 0, HEAD_YAW)], { ease: 'easeInOut' }),

    seq('cabeca-pergunta', 'cabeca', 10.0, 0.5, [ch('rotation.z', 0, HEAD_TILT)], {
      ease: 'easeOut',
      caption: 'Är det långt härifrån? — É longe daqui?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.6, 3.0, 3.85], target: [-0.3, 0.55, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'ar-det-langt-harifran',
    contexto:
      "Rua: pedindo direção a quem passa, na recepção do hotel, no ponto de ônibus ou combinando de ir a pé a algum lugar — 'Är det långt härifrån till stationen?'. Resposta típica: 'Nej, det är fem minuter att gå' ou 'Ja, ta bussen hellre'.",
    fraseFonte: 'É longe daqui?',
    fraseAlvo: 'Är det långt härifrån?',
    pronuncia:
      "é dê LÓNGT RRÉÉ-ri-frôn? ('är det' = é-dê, fraquinho, o T de 'det' mudo; 'långt' com Ó ABERTO e CURTO de 'só' — nunca o 'lõ' nasal de 'longo' —, NG no fundo da boca sem soltar 'gui', e T seco no fim: sem o T vira 'lång', comprido; 'härifrån' é 'här' + 'i' + 'från' colados numa palavra só: a força no HÄR — h soprado, É aberto e longo —, o -ri- fraquinho com R brando, e o -frôn com um acento menor, Ô FECHADO e N na língua, sem nasal)",
    ponteSonora:
      "É DÊ LÓNG-T... RRÉ-RI-FRÔN(ha)? (6 sílabas: é-dê-LÓNGT-RRÉÉ-ri-frôn; força no LÓNG e no RRÉ, com um acento menor no FRÔN; É DÊ = o 'är det' de sempre, o MESMO de 'Är det ledigt här?' e 'Är det starkt?': a pergunta começa pelo verbo, É aberto e curto, DÊ fechado e fraco, o T de 'det' mudo; LÓNG-T = o MESMO LONG T da trilha do hamster de 'Hur långt är det?': o 'long' de 'long neck', Ó ABERTO e CURTO de 'só', nunca o 'lõ' nasal e fechado de 'longo', o NG no fundo da boca sem soltar 'gui', e o T DA TRILHA seco no fim, de 'tatu' — é ele que faz 'långt' (longe); sem ele sobra 'lång' (comprido), o pescoço da garça de 'Hur lång tid tar det?'; RRÉ-RI = a HERA de sempre, a mesma de 'Det gör ont här' e 'Jag har bott här i sju år', soprada leve, É aberto e longo, e o R brando dela emenda no I do pau espetado: RRÉ-RI, 'här' + 'i'; FRÔN(ha) = o MESMO I-FRÔN do ninja de 'Var kommer du ifrån?': a FRONHA sem o -nha, Ô FECHADO e sem nasal, N na língua — fronha com pau em I espetado é 'ifrån'; aqui o pau vem enrolado de hera: HERA + I + FRONHA = 'härifrån', daqui)",
    historia:
      'O husky resolveu partir de trenó e, antes de sair, arrancou um ramo de HERA do muro de casa e enrolou no pau que espetou em pé na trouxa — uma FRONHA estufada —, pra nunca esquecer de onde saiu. Na saída da vila, a trilha de neve à frente é um T LONGUÍSSIMO: a barra do T está ali, aos pés dele, e a perna some no horizonte. Ele arregala os olhos azuis, olha a trilha, olha a fronha de hera e gagueja: É DÊ... LONG T?! Antes do primeiro passo, ele precisa saber: é longe daqui?',
  },
  createScene,
  refine: { organic: ['husky', 'cabeca', 'rabo'] },
}

export default card
