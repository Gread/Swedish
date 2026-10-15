import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag har missat bussen." — IÁ, RRÁR! MISS-AT... BUS-SEM!
 *
 * O pavão recém-coroado MISS ATRASO posava pra foto oficial no tapete
 * vermelho do ponto de ônibus. A ponta da faixa ficou presa no para-choque do
 * ônibus vermelho, que arrancou e RASGOU a faixa bem depois do T: no peito
 * sobrou MISS AT, e o resto vai esvoaçando atrás do ônibus. De coroa torta e
 * bico escancarado, ele larga o buquê e dispara atrás — o ônibus foi SEM ele.
 *
 * Diorama: calçada clara com tapete de passarela até o meio-fio e a câmera
 * do fotógrafo num tripé; à direita, a pista com o zigue-zague amarelo de
 * ponto de ônibus, e o ônibus se afastando de costas para a câmera (lanternas
 * acesas, fumaça, a tira da faixa esvoaçando no para-choque). Acento saturado
 * reservado ao vermelho do ÔNIBUS e às letras MISS AT — o par da ponte.
 */

// ---- paleta -----------------------------------------------------------------
const SOCO = '#4a4e55'
const ASFALTO = '#3e434b'
const CALCADA = '#c9c5bc'
const JUNTA = '#aaa59b'
const GUIA = '#b6b2aa'
const FAIXA_PISTA = '#e8e6df'
const ZIGUE = '#d9b23c'
const TAPETE = '#8a2a36'
const TAPETE_BORDA = '#6a1e29'
const OURO = '#d0a13c'
const AZUL = '#1d58c4'
const AZUL_ESC = '#163f93'
const VERDE_DORSO = '#2f7a55'
const ASA_CREME = '#cdb68a'
const ASA_CASTANHA = '#8a4a2b'
const CINZA_COXA = '#34405c'
const PERNA = '#9a8a78'
const BICO = '#d6c39c'
const TEAL = '#1fa3b3'
const LEQUE_FUNDO = '#1f5a3a'
const PENA = '#2f8a4f'
const PENA_CLARA = '#3f9c58'
const HASTE = '#c8b06a'
const OLHO_OURO = '#d6a83a'
const OLHO_TURQ = '#2ab3b0'
const OLHO_AZUL = '#2348b5'
const OLHO_NAVY = '#121c4a'
const CETIM = '#f6f2ea'
const LETRA = '#c8202e' // acento: as letras MISS AT (mesmo vermelho do ônibus)
const PRATA = '#eef1f4'
const ONIBUS = '#d3202f' // acento: o ônibus
const ONIBUS_MEIO = '#b81a27'
const ONIBUS_ESC = '#8f1520'
const VIDRO = '#1d2633'
const BORRACHA = '#1f2125'
const PARACHOQUE = '#2d3036'
const FUMACA = '#aeb3b8'

// ---- medidas ------------------------------------------------------------------
const RS = 2.85 // raio do diorama
const ROAD_Y = 0.13 // topo do asfalto
const GY = 0.2 // topo da calçada
const XC = 0.55 // linha do meio-fio
const CY = GY + 0.025 // topo do tapete
const TAPETE_Z = 0.3
const TAPETE_X0 = -2.3
const TAPETE_X1 = XC - 0.06

// pavão
const PX = -0.45
const PZ = 0.32
const PX_POSE = -0.6
const YAW = 0.45 // virado para o ônibus (pose final)
const YAW_POSE = 0.05 // posando para a foto
const NECK_YAW = 0.85 // pescoço torcido na direção do ônibus
const ASA_ALTA = 0.75 // asa do lado da câmera erguida no susto
const ASA_BAIXA = 2.5 // a mesma asa caída enquanto ele posa

// ônibus: origem no centro de baixo da TRASEIRA; a carroceria vai para -z
const BW = 1.15
const BH = 1.42
const BL = 1.6
const CHAO = 0.15 // vão livre
const BUS_S = 0.82 // menor = mais longe: ele já está indo embora
const BX = 1.38
const BZ = -0.62
const BX_PERTO = 1.18
const BZ_PERTO = 0.85 // parado no ponto, ao lado do fim do tapete
const BUS_YAW = -0.12 // sai do meio-fio puxando para a direita

const UP = new THREE.Vector3(0, 1, 0)
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b (pescoço, pernas, dedos). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = { roughness: 0.6 }) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(UP, d.clone().normalize())
  return m
}

/** Segmento de fita de a até b, com a largura ao longo de `w` (unitário, ⟂ ao segmento). */
function ribbonSeg(a: THREE.Vector3, b: THREE.Vector3, w: THREE.Vector3, width: number, thick: number, color: string) {
  const t = new THREE.Vector3().subVectors(b, a)
  const len = t.length()
  t.normalize()
  const n = new THREE.Vector3().crossVectors(w, t)
  const m = rbox(width, len + 0.02, thick, Math.min(0.006, thick / 2.2), color, { roughness: 0.35 })
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(w, t, n))
  m.position.copy(a).addScaledVector(t, len / 2)
  return m
}

/** Segmento de círculo à esquerda (x < xc), extrudado para cima. */
function sidewalk(r: number, xc: number, h: number, color: string) {
  const half = Math.sqrt(r * r - xc * xc)
  const a = Math.atan2(half, xc)
  const s = new THREE.Shape()
  s.moveTo(xc, -half)
  s.lineTo(xc, half)
  s.absarc(0, 0, r, a, Math.PI * 2 - a, false)
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 48 })
  geo.rotateX(-Math.PI / 2)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.9, size: r * 2 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Gomo de leque: coroa circular de r0 a r1, ângulos a0→a1 (rad, a partir de +x). */
function fanWeb(r0: number, r1: number, a0: number, a1: number, color: string) {
  const s = new THREE.Shape()
  s.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0)
  s.absarc(0, 0, r1, a0, a1, false)
  s.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0)
  s.absarc(0, 0, r0, a1, a0, true)
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.016, bevelEnabled: false, curveSegments: 24 })
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.7, size: r1 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Traço de letra entre dois pontos do plano xy (caixinha em pé). */
function seg(ax: number, ay: number, bx: number, by: number, t: number) {
  const len = Math.hypot(bx - ax, by - ay) + t
  const s = rbox(t, len, 0.012, 0.005, LETRA, { roughness: 0.45 })
  s.position.set((ax + bx) / 2, (ay + by) / 2, 0)
  s.rotation.z = Math.atan2(by - ay, bx - ax) - Math.PI / 2
  return s
}

type Glyph = 'M' | 'I' | 'S' | 'A' | 'T'

/** M I S A T em traço grosso; altura H, centradas na origem. */
function letter(which: Glyph, H: number) {
  const g = new THREE.Group()
  const t = H * 0.22
  const top = H / 2 - t / 2
  const bot = -H / 2 + t / 2
  if (which === 'M') {
    const w = H * 0.42
    g.add(seg(-w, bot, -w, top, t))
    g.add(seg(w, bot, w, top, t))
    g.add(seg(-w, top, 0, -H * 0.05, t * 0.9))
    g.add(seg(w, top, 0, -H * 0.05, t * 0.9))
  } else if (which === 'I') {
    g.add(seg(0, bot, 0, top, t))
    g.add(seg(-H * 0.16, top, H * 0.16, top, t * 0.9))
    g.add(seg(-H * 0.16, bot, H * 0.16, bot, t * 0.9))
  } else if (which === 'S') {
    // S de cantos chanfrados e ganchos nas pontas — não vira um 5
    const w = H * 0.3
    const c = H * 0.13
    const path: [number, number][] = [
      [w, top - c * 0.9], [w - c, top], [-w + c, top], [-w, top - c], [-w, c * 0.6], [-w + c, 0],
      [w - c, 0], [w, -c * 0.6], [w, bot + c], [w - c, bot], [-w + c, bot], [-w, bot + c * 0.9],
    ]
    for (let k = 0; k < path.length - 1; k++) {
      g.add(seg(path[k][0], path[k][1], path[k + 1][0], path[k + 1][1], t * 0.95))
    }
  } else if (which === 'A') {
    const w = H * 0.36
    g.add(seg(-w, -H / 2 + t * 0.3, 0, H / 2 - t * 0.3, t))
    g.add(seg(w, -H / 2 + t * 0.3, 0, H / 2 - t * 0.3, t))
    g.add(seg(-w * 0.5, -H * 0.12, w * 0.5, -H * 0.12, t * 0.85))
  } else {
    const w = H * 0.36
    g.add(seg(-w, top, w, top, t))
    g.add(seg(0, bot, 0, top, t))
  }
  return g
}

/** Pena do leque apontando para +y: haste, barba verde e o "olho" no fim. */
function feather(len: number, eyeR: number, eyeScale: number, light: boolean) {
  const g = new THREE.Group()
  const r0 = 0.1
  const rachis = cylinder(0.006, 0.008, len - r0, HASTE, { roughness: 0.5 }, 6)
  rachis.position.y = (len + r0) / 2
  g.add(rachis)

  const vane = sphere(1, light ? PENA_CLARA : PENA, { roughness: 0.6 }, 12)
  vane.scale.set(0.05 * eyeScale + 0.012, (len - r0) * 0.5, 0.012)
  vane.position.y = (len + r0) / 2
  g.add(vane)

  // olho: anéis concêntricos achatados, cada um um tiquinho à frente
  const rings: [string, number, number][] = [
    [OLHO_OURO, 0.085, 0.105],
    [OLHO_TURQ, 0.062, 0.08],
    [OLHO_AZUL, 0.042, 0.056],
    [OLHO_NAVY, 0.022, 0.03],
  ]
  rings.forEach(([color, rx, ry], i) => {
    const disc = sphere(1, color, { roughness: 0.35, detail: 0 }, 14)
    disc.scale.set(rx * eyeScale, ry * eyeScale, 0.008)
    disc.position.set(0, eyeR - i * 0.004 * eyeScale, 0.008 + i * 0.005)
    g.add(disc)
  })
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- base: asfalto + calçada + meio-fio -----------------------------------
  const base = new THREE.Group()

  const soco = cylinder(RS, RS + 0.07, 0.08, SOCO, { roughness: 0.85 })
  soco.position.y = 0.04
  base.add(soco)

  const asfalto = cylinder(RS - 0.02, RS, ROAD_Y - 0.08, ASFALTO, { roughness: 0.95 })
  asfalto.position.y = 0.08 + (ROAD_Y - 0.08) / 2
  base.add(asfalto)

  const calcada = sidewalk(RS - 0.02, XC, GY - ROAD_Y + 0.01, CALCADA)
  calcada.position.y = ROAD_Y - 0.01
  base.add(calcada)

  // juntas das placas de concreto
  for (let x = -2.2; x < XC - 0.1; x += 0.55) {
    const half = Math.sqrt(Math.max(0, (RS - 0.08) ** 2 - x * x))
    const j = rbox(0.022, 0.008, half * 2, 0.004, JUNTA, { roughness: 0.9 })
    j.position.set(x, GY + 0.002, 0)
    base.add(j)
  }
  for (let z = -2.2; z <= 2.21; z += 0.55) {
    const xl = -Math.sqrt(Math.max(0, (RS - 0.08) ** 2 - z * z))
    const len = XC - 0.08 - xl
    if (len <= 0.05) continue
    const j = rbox(len, 0.008, 0.022, 0.004, JUNTA, { roughness: 0.9 })
    j.position.set(xl + len / 2, GY + 0.002, z)
    base.add(j)
  }

  const halfCurb = Math.sqrt(RS * RS - XC * XC) - 0.06
  const guia = rbox(0.13, GY - ROAD_Y + 0.025, halfCurb * 2, 0.02, GUIA, { roughness: 0.8 })
  guia.position.set(XC, ROAD_Y + (GY - ROAD_Y + 0.025) / 2, 0)
  base.add(guia)

  // faixa tracejada da pista
  for (let z = -1.5; z <= 1.5; z += 0.6) {
    const dash = rbox(0.06, 0.008, 0.32, 0.004, FAIXA_PISTA, { roughness: 0.7 })
    dash.position.set(2.35, ROAD_Y + 0.004, z)
    base.add(dash)
  }

  // zigue-zague amarelo de ponto de ônibus, junto ao meio-fio
  const zz: [number, number][] = []
  for (let k = 0; k <= 9; k++) zz.push([k % 2 === 0 ? XC + 0.14 : XC + 0.36, -0.2 + k * 0.25])
  for (let k = 0; k < zz.length - 1; k++) {
    const [ax, az] = zz[k]
    const [bx, bz] = zz[k + 1]
    const len = Math.hypot(bx - ax, bz - az) + 0.035
    const z = rbox(0.035, 0.008, len, 0.004, ZIGUE, { roughness: 0.7 })
    z.position.set((ax + bx) / 2, ROAD_Y + 0.005, (az + bz) / 2)
    z.rotation.y = Math.atan2(bx - ax, bz - az)
    base.add(z)
  }

  // tampa de bueiro
  const bueiro = cylinder(0.17, 0.17, 0.012, '#2c3036', { roughness: 0.5, metalness: 0.6 })
  bueiro.position.set(1.9, ROAD_Y + 0.006, 1.45)
  base.add(bueiro)

  // câmera de fotógrafo num tripé (a "foto oficial"), à esquerda
  const tripe = new THREE.Group()
  tripe.position.set(-1.95, GY, 1.1)
  tripe.rotation.y = 2.25
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.3
    tripe.add(limb(v(Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22), v(0, 0.9, 0), 0.014, '#2b2d31', { roughness: 0.4 }))
  }
  const cam = rbox(0.24, 0.16, 0.14, 0.03, '#25272b', { roughness: 0.4 })
  cam.position.y = 1.0
  tripe.add(cam)
  const lente = cylinder(0.055, 0.06, 0.12, '#17181b', { roughness: 0.25 })
  lente.rotation.x = Math.PI / 2
  lente.position.set(0, 1.0, 0.12)
  tripe.add(lente)
  const flash = rbox(0.12, 0.07, 0.07, 0.015, '#e9ecef', { roughness: 0.3 })
  flash.position.set(0, 1.13, 0.0)
  tripe.add(flash)
  base.add(tripe)

  root.add(base)

  // ---- tapete vermelho de passarela (desenrola da esquerda até o meio-fio) --
  const tapete = new THREE.Group()
  tapete.position.set(TAPETE_X0, 0, TAPETE_Z)
  const TL = TAPETE_X1 - TAPETE_X0
  const pano = rbox(TL, 0.025, 0.86, 0.008, TAPETE, { roughness: 0.95 })
  pano.position.set(TL / 2, GY + 0.0125, 0)
  tapete.add(pano)
  for (const sz of [-1, 1]) {
    const borda = rbox(TL - 0.04, 0.008, 0.05, 0.004, TAPETE_BORDA, { roughness: 0.95 })
    borda.position.set(TL / 2, CY + 0.002, sz * 0.36)
    tapete.add(borda)
  }
  // pedestais dourados com cordão de veludo, na beira de trás do tapete
  for (const px of [0.35, 1.35]) {
    const pe = lathe([[0, 0], [0.09, 0], [0.09, 0.02], [0.03, 0.05], [0.022, 0.06], [0, 0.06]], OURO, { roughness: 0.3, metalness: 0.8 })
    pe.position.set(px, GY, -0.55)
    tapete.add(pe)
    const haste = cylinder(0.018, 0.018, 0.5, OURO, { roughness: 0.3, metalness: 0.8 })
    haste.position.set(px, GY + 0.3, -0.55)
    tapete.add(haste)
    const bola = sphere(0.035, OURO, { roughness: 0.3, metalness: 0.8 }, 16)
    bola.position.set(px, GY + 0.57, -0.55)
    tapete.add(bola)
  }
  const cordao = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.018, 8, 24, Math.PI),
    mat(TAPETE_BORDA, { roughness: 0.9 }),
  )
  cordao.rotation.z = Math.PI
  cordao.scale.y = 0.35
  cordao.position.set(0.85, GY + 0.52, -0.55)
  cordao.castShadow = true
  tapete.add(cordao)
  root.add(tapete)

  // ---- PAVÃO (origem nos pés, olhando para +z) ------------------------------
  const pavao = new THREE.Group()
  pavao.position.set(PX, CY, PZ)
  pavao.rotation.y = YAW
  root.add(pavao)

  // perna de apoio plantada no tapete
  const tornozelo = v(-0.12, 0.07, 0.07)
  pavao.add(limb(v(-0.11, 0.6, 0.0), tornozelo, 0.042, PERNA))
  for (const [dx, dz] of [[-0.09, 0.15], [0, 0.18], [0.09, 0.15], [0, -0.11]] as const) {
    pavao.add(limb(tornozelo, v(-0.12 + dx, 0.03, 0.07 + dz), 0.024, PERNA))
  }
  // a outra perna sobe com o joelho para a frente: largada da corrida
  const joelho = v(0.2, 0.52, 0.33)
  const pe = v(0.23, 0.3, 0.3)
  pavao.add(limb(v(0.12, 0.6, 0.02), joelho, 0.042, PERNA))
  pavao.add(limb(joelho, pe, 0.038, PERNA))
  for (const [dx, dz] of [[-0.07, 0.05], [0, 0.07], [0.07, 0.05]] as const) {
    pavao.add(limb(pe, v(0.23 + dx, 0.18, 0.3 + dz), 0.022, PERNA))
  }

  // tronco: inclinado para a frente a partir do quadril
  const tronco = new THREE.Group()
  tronco.position.set(0, 0.6, 0)
  tronco.rotation.x = 0.22
  pavao.add(tronco)

  const CENTRO = v(0, 0.33, 0.03)
  const RB = 0.4

  const peito = sphere(RB, AZUL, { roughness: 0.4 })
  peito.position.copy(CENTRO)
  tronco.add(peito)

  const dorso = sphere(0.3, VERDE_DORSO, { roughness: 0.55 })
  dorso.position.set(0, 0.32, -0.25)
  tronco.add(dorso)

  const ventre = sphere(0.24, CINZA_COXA, { roughness: 0.7 })
  ventre.position.set(0, 0.05, 0)
  tronco.add(ventre)

  for (const side of [-1, 1]) {
    const coxa = sphere(0.14, CINZA_COXA, { roughness: 0.75 })
    coxa.position.set(side * 0.13, 0.02, 0.0)
    tronco.add(coxa)
  }

  // asas abertas de frente: cobertura creme no ombro e as rêmiges castanhas
  // em leque na ponta, feito dedos. A do lado da câmera é peça própria (sobe
  // no susto e fica nítida, sem fundir); a do lado do ônibus fica caída,
  // atrás, sem sujar o perfil do bico.
  const asas: [number, [number, number, number]][] = [
    [-1, [0.25, -0.35, ASA_ALTA]],
    [1, [-2.3, Math.PI / 2, 0]], // dobrada junto ao corpo, apontando para trás
  ]
  let asa: THREE.Group = new THREE.Group()
  for (const [side, rot] of asas) {
    const umaAsa = new THREE.Group()
    umaAsa.position.set(side * (side < 0 ? 0.33 : 0.36), 0.5, 0.0)
    umaAsa.rotation.set(...rot)
    tronco.add(umaAsa)
    if (side < 0) asa = umaAsa
    const g = umaAsa
    const cobertura = sphere(0.2, ASA_CREME, { roughness: 0.8 })
    cobertura.scale.set(0.85, 1.05, 0.3)
    cobertura.position.set(0, 0.16, 0)
    g.add(cobertura)
    for (let k = 0; k < 4; k++) {
      const a = -0.25 + k * 0.32 // abre para o lado de fora
      const pena = sphere(1, ASA_CASTANHA, { roughness: 0.8 }, 16)
      pena.scale.set(0.055, 0.2, 0.04)
      pena.rotation.z = -side * a
      pena.position.set(side * Math.sin(a) * 0.17, 0.3 + Math.cos(a) * 0.17, -0.01)
      g.add(pena)
    }
  }

  // pescoço: cone torneado que nasce largo do peito, esticado para a frente
  // e torcido na direção do ônibus (YXZ: inclina e depois gira)
  const pescoco = new THREE.Group()
  pescoco.position.set(0, 0.6, 0.12)
  pescoco.rotation.order = 'YXZ'
  pescoco.rotation.set(0.32, NECK_YAW, 0)
  tronco.add(pescoco)
  const colo = lathe(
    [[0, -0.05], [0.24, -0.05], [0.235, 0.05], [0.19, 0.17], [0.148, 0.3], [0.124, 0.42], [0.116, 0.5], [0, 0.56]],
    AZUL,
    { roughness: 0.4 },
  )
  pescoco.add(colo)

  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.56, 0.05)
  cabeca.rotation.x = -0.42
  pescoco.add(cabeca)

  const HR = 0.18
  const cranio = sphere(HR, AZUL, { roughness: 0.4 })
  cabeca.add(cranio)

  const onHead = (az: number, el: number, r: number) =>
    v(r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az))

  for (const side of [-1, 1]) {
    // máscara branca de pavão: risca acima e mancha abaixo do olho
    const risca = capsule(0.013, 0.08, '#f4f1ea', { roughness: 0.5 })
    risca.position.copy(onHead(side * 0.95, 0.45, HR * 0.98))
    risca.rotation.set(0, side * 0.95, Math.PI / 2 - side * 0.15)
    cabeca.add(risca)
    const mancha = sphere(0.046, '#f4f1ea', { roughness: 0.5 }, 16)
    mancha.scale.set(0.35, 0.6, 1)
    mancha.position.copy(onHead(side * 1.0, -0.22, HR * 0.93))
    mancha.rotation.y = side * 1.0
    cabeca.add(mancha)

    // olho arregalado
    const olho = sphere(0.047, '#ffffff', { roughness: 0.25 }, 16)
    olho.position.copy(onHead(side * 0.9, 0.12, HR * 0.9))
    olho.rotation.y = side * 0.9
    olho.scale.z = 0.6
    cabeca.add(olho)
    const pupila = sphere(0.022, '#141414', { roughness: 0.2 }, 12)
    pupila.position.copy(onHead(side * 0.84, 0.14, HR * 1.09))
    cabeca.add(pupila)
    const brilho = sphere(0.007, '#ffffff', { roughness: 0.1 }, 8)
    brilho.position.copy(onHead(side * 0.81, 0.18, HR * 1.16))
    cabeca.add(brilho)
  }

  // bico de cima (fixo) + boca escura
  const bicoCima = cone(0.064, 0.2, BICO, { roughness: 0.4 })
  bicoCima.rotation.x = Math.PI / 2 - 0.08
  bicoCima.scale.set(0.85, 1, 0.75)
  bicoCima.position.set(0, 0.005, 0.24)
  cabeca.add(bicoCima)
  const boca = sphere(0.062, '#6e1c26', { roughness: 0.6 }, 16)
  boca.position.set(0, -0.05, 0.125)
  cabeca.add(boca)

  // penacho em leque atrás da coroa
  for (let k = 0; k < 6; k++) {
    const a = -0.6 + k * 0.2
    const lado = (k % 2 === 0 ? -1 : 1) * 0.14
    const base0 = v(0, 0.15, -0.07)
    const tip = v(Math.sin(lado) * 0.22, 0.15 + Math.cos(a) * 0.22, -0.07 + Math.sin(a) * 0.22)
    cabeca.add(limb(base0, tip, 0.007, AZUL_ESC, { roughness: 0.5 }))
    const ponta = sphere(0.027, TEAL, { roughness: 0.4 }, 12)
    ponta.scale.set(0.7, 1.15, 0.7)
    ponta.position.copy(tip)
    cabeca.add(ponta)
  }

  // ---- bico de baixo (peça: abre no grito) ----------------------------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.062, 0.135)
  bico.rotation.x = 0.85
  cabeca.add(bico)
  const bicoBaixo = cone(0.054, 0.18, BICO, { roughness: 0.4 })
  bicoBaixo.rotation.x = Math.PI / 2
  bicoBaixo.scale.set(0.8, 1, 0.55)
  bicoBaixo.position.set(0, 0, 0.095)
  bico.add(bicoBaixo)
  const lingua = capsule(0.02, 0.05, '#d77a86', { roughness: 0.5 })
  lingua.rotation.x = Math.PI / 2
  lingua.position.set(0, 0.016, 0.05)
  bico.add(lingua)

  // ---- coroinha prateada (peça: cai na cabeça e fica torta) -----------------
  const coroa = new THREE.Group()
  coroa.position.set(-0.03, 0.15, 0.04)
  coroa.rotation.set(-0.1, 0, 0.45)
  cabeca.add(coroa)
  const CR = 0.11
  const aro = lathe(
    [[CR - 0.012, 0], [CR, 0], [CR, 0.035], [CR - 0.012, 0.035], [CR - 0.012, 0]],
    PRATA,
    { roughness: 0.22, metalness: 0.35 },
  )
  coroa.add(aro)
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2
    const alto = k === 0 ? 0.1 : 0.065
    const ponta = cone(0.022, alto, PRATA, { roughness: 0.22, metalness: 0.35 }, 8)
    ponta.position.set(Math.sin(a) * (CR - 0.006), 0.035 + alto / 2, Math.cos(a) * (CR - 0.006))
    coroa.add(ponta)
    const bolinha = sphere(0.012, PRATA, { roughness: 0.22, metalness: 0.35 }, 8)
    bolinha.position.set(Math.sin(a) * (CR - 0.006), 0.035 + alto, Math.cos(a) * (CR - 0.006))
    coroa.add(bolinha)
    const gema = sphere(0.013, k === 0 ? '#ff6fa8' : '#bfe4ff', { roughness: 0.1 }, 8)
    gema.position.set(Math.sin(a) * (CR + 0.003), 0.018, Math.cos(a) * (CR + 0.003))
    coroa.add(gema)
  }

  // ---- faixa de Miss rasgada depois do T (peça) -----------------------------
  // anel em volta do peito, inclinado do ombro direito ao quadril esquerdo
  const faixa = new THREE.Group()
  faixa.position.copy(CENTRO)
  faixa.rotation.set(0, 0, -0.62)
  tronco.add(faixa)

  const RF = RB + 0.022 // raio interno da faixa
  const LARG = 0.16
  const LH = 0.105 // altura das letras
  const TEXT: (Glyph | ' ')[] = ['M', 'I', 'S', 'S', ' ', 'A', 'T']
  const ADV: Record<Glyph | ' ', number> = { M: 0.1, I: 0.055, S: 0.075, A: 0.085, T: 0.08, ' ': 0.05 }
  const RT = RF + 0.016
  const total = TEXT.reduce((s, c) => s + ADV[c], 0)
  const PHI_C = -0.36 // centro do texto (voltado para a câmera)
  let s0 = PHI_C * RT - total / 2
  let phiT = 0
  for (const c of TEXT) {
    const phi = (s0 + ADV[c] / 2) / RT
    s0 += ADV[c]
    if (c === ' ') continue
    const l = letter(c, LH)
    l.position.set(Math.sin(phi) * RT, 0, Math.cos(phi) * RT)
    l.rotation.y = phi
    faixa.add(l)
    phiT = phi
  }
  const PHI_RASGO = phiT + 0.1 // a faixa termina logo depois do T
  const GAP = 1.25 // o pedaço que o ônibus levou
  /** Arco da faixa: cetim (lathe) + debrum dourado nas duas bordas. */
  const arcoDeFaixa = (phi0: number, len: number) => {
    const g = new THREE.Group()
    const cetim = new THREE.Mesh(
      new THREE.LatheGeometry(
        [new THREE.Vector2(RF, -LARG / 2), new THREE.Vector2(RF + 0.012, -LARG / 2),
          new THREE.Vector2(RF + 0.012, LARG / 2), new THREE.Vector2(RF, LARG / 2),
          new THREE.Vector2(RF, -LARG / 2)],
        Math.max(8, Math.round(len * 10)),
        phi0,
        len,
      ),
      mat(CETIM, { roughness: 0.32, size: 0.4 }),
    )
    cetim.castShadow = true
    cetim.receiveShadow = true
    g.add(cetim)
    for (const sy of [-1, 1]) {
      // toro no mesmo arco do cetim (o toro começa em +x no plano xy)
      const debrum = new THREE.Mesh(
        new THREE.TorusGeometry(RF + 0.014, 0.006, 6, Math.max(8, Math.round(len * 10)), len),
        mat(OURO, { roughness: 0.3, metalness: 0.7 }),
      )
      debrum.rotation.set(-Math.PI / 2, 0, phi0 - Math.PI / 2)
      debrum.position.y = sy * (LARG / 2 - 0.008)
      g.add(debrum)
    }
    return g
  }
  faixa.add(arcoDeFaixa(PHI_RASGO + GAP, Math.PI * 2 - GAP))

  // ---- o pedaço "RASO" (peça): completa a faixa enquanto ele posa e é
  // arrancado pelo ônibus — some voando na direção dele
  const PHI_MEIO = PHI_RASGO + GAP / 2
  const meio = v(Math.sin(PHI_MEIO) * RF, 0, Math.cos(PHI_MEIO) * RF)
  const resto = new THREE.Group()
  resto.position.copy(meio)
  faixa.add(resto)
  const restoArco = arcoDeFaixa(PHI_RASGO - 0.005, GAP + 0.01)
  restoArco.position.copy(meio).multiplyScalar(-1)
  resto.add(restoArco)
  const tangente = v(Math.cos(PHI_MEIO), 0, -Math.sin(PHI_MEIO))
  const RESTO_FIM = meio.clone().addScaledVector(tangente, 0.45).addScaledVector(meio.clone().normalize(), 0.2)
  // ponta esfiapada (peça: aparece no rasgo): dentes de pano e fiapos
  const naFaixa = (phi: number, r: number, y: number) => v(Math.sin(phi) * r, y, Math.cos(phi) * r)
  const fiapos = new THREE.Group()
  const PONTA = naFaixa(PHI_RASGO, RF, 0)
  fiapos.position.copy(PONTA)
  faixa.add(fiapos)
  const noRasgo = (p: THREE.Vector3) => p.sub(PONTA)
  for (let k = 0; k < 4; k++) {
    const y = -LARG / 2 + 0.02 + k * ((LARG - 0.04) / 3)
    const dente = cone(0.02, 0.05, CETIM, { roughness: 0.32 }, 6)
    dente.position.copy(noRasgo(naFaixa(PHI_RASGO + 0.045 + (k % 2) * 0.035, RF + 0.006, y)))
    dente.rotation.set(0, PHI_RASGO, -Math.PI / 2)
    dente.scale.z = 0.3
    fiapos.add(dente)
  }
  for (let k = 0; k < 3; k++) {
    const y = -LARG / 2 + 0.03 + k * 0.05
    const a = noRasgo(naFaixa(PHI_RASGO + 0.03, RF + 0.01, y))
    const b = a.clone().add(v(0.03 + k * 0.015, -0.07 - k * 0.02, 0.02))
    fiapos.add(limb(a, b, 0.004, CETIM, { roughness: 0.4 }))
  }

  // ---- LEQUE da cauda (peça: abre para a foto) ------------------------------
  // preso no pavão, mas girado de volta para a câmera: o leque é o show
  const cauda = new THREE.Group()
  cauda.position.set(0, 0.98, -0.4)
  cauda.rotation.set(-0.12, -0.5, 0)
  pavao.add(cauda)

  const ABRE = (100 * Math.PI) / 180
  const web = fanWeb(0.1, 0.96, Math.PI / 2 - ABRE + 0.05, Math.PI / 2 + ABRE - 0.05, LEQUE_FUNDO)
  web.position.z = -0.03
  cauda.add(web)

  const rows = [
    { n: 15, len: 1.05, eye: 0.93, esc: 1.0, z: 0, off: false },
    { n: 13, len: 0.78, eye: 0.69, esc: 0.85, z: 0.022, off: true },
    { n: 9, len: 0.5, eye: 0.44, esc: 0.68, z: 0.044, off: false },
  ]
  for (const row of rows) {
    const spread = ABRE - 0.06
    for (let i = 0; i < row.n; i++) {
      const f = row.off ? (i + 0.5) / row.n : i / (row.n - 1)
      const theta = -spread + f * spread * 2
      const p = feather(row.len, row.eye, row.esc, i % 2 === 0)
      p.rotation.z = -theta
      p.position.z = row.z
      cauda.add(p)
    }
  }

  // ---- buquê de rosas (peça: cai no tapete) ---------------------------------
  const BUQUE: [number, number, number] = [-0.88, CY + 0.07, 0.74]
  const buque = new THREE.Group()
  buque.position.set(...BUQUE)
  buque.rotation.set(0, 0.6, 1.45)
  root.add(buque)
  const papel = cone(0.11, 0.3, '#efe6d2', { roughness: 0.8 }, 16)
  papel.rotation.x = Math.PI
  papel.position.y = -0.05
  buque.add(papel)
  const laco = torus(0.03, 0.012, '#e6a0b4', { roughness: 0.6 })
  laco.position.set(0, -0.12, 0.05)
  buque.add(laco)
  for (const [rx, rz, ry] of [[0, 0, 0.13], [0.07, 0.04, 0.11], [-0.07, 0.03, 0.11], [0.03, -0.07, 0.11], [-0.04, -0.06, 0.12]] as const) {
    const rosa = puff(0.04, '#b3203a', 4, 61 + Math.round(rx * 100), { roughness: 0.6 })
    rosa.position.set(rx, ry, rz)
    buque.add(rosa)
    const folha = sphere(0.035, '#3f7d46', { roughness: 0.7 }, 10)
    folha.scale.set(1, 0.3, 0.6)
    folha.position.set(rx * 1.5, ry - 0.04, rz * 1.5)
    folha.rotation.y = rand() * Math.PI
    buque.add(folha)
  }
  // pétala solta no tapete
  const petala = sphere(0.025, '#b3203a', { roughness: 0.6 }, 10)
  petala.scale.set(1, 0.25, 0.8)
  petala.position.set(0.25, -0.12, 0.1)
  buque.add(petala)

  // ---- ÔNIBUS vermelho se afastando (origem: base da traseira) --------------
  const onibus = new THREE.Group()
  onibus.position.set(BX, ROAD_Y, BZ)
  onibus.rotation.y = BUS_YAW
  onibus.scale.setScalar(BUS_S)
  root.add(onibus)

  const carroceria = rbox(BW, BH, BL, 0.11, ONIBUS, { roughness: 0.38 })
  carroceria.position.set(0, CHAO + BH / 2, -BL / 2)
  onibus.add(carroceria)

  // saia escura e teto com o ar-condicionado
  const saia = rbox(BW + 0.01, 0.12, BL - 0.1, 0.03, ONIBUS_ESC, { roughness: 0.5 })
  saia.position.set(0, CHAO + 0.06, -BL / 2)
  onibus.add(saia)
  const ar = rbox(BW * 0.62, 0.12, BL * 0.45, 0.05, '#e3e1dc', { roughness: 0.5 })
  ar.position.set(0, CHAO + BH + 0.05, -BL * 0.55)
  onibus.add(ar)

  // traseira: janela pequena no alto, tampa do motor com grade, lanternas
  const vidro = rbox(BW - 0.3, 0.36, 0.04, 0.05, VIDRO, { roughness: 0.12 })
  vidro.position.set(0, CHAO + 1.1, 0.003)
  onibus.add(vidro)
  const letreiro = rbox(0.42, 0.09, 0.02, 0.015, '#0e1013', { roughness: 0.3 })
  letreiro.position.set(-0.12, CHAO + 1.21, 0.026)
  onibus.add(letreiro)
  const led = rbox(0.32, 0.03, 0.012, 0.005, '#ffb43a', { emissive: '#ffa21f', emissiveIntensity: 1.4 })
  led.position.set(-0.12, CHAO + 1.21, 0.038)
  onibus.add(led)

  const tampa = rbox(BW - 0.42, 0.52, 0.03, 0.03, ONIBUS_MEIO, { roughness: 0.42 })
  tampa.position.set(0, CHAO + 0.55, 0.004)
  onibus.add(tampa)
  for (let k = 0; k < 5; k++) {
    const aleta = rbox(BW - 0.58, 0.028, 0.03, 0.01, ONIBUS_ESC, { roughness: 0.5 })
    aleta.position.set(0, CHAO + 0.4 + k * 0.075, 0.02)
    onibus.add(aleta)
  }

  for (const side of [-1, 1]) {
    const lx = side * (BW / 2 - 0.1)
    const moldura = rbox(0.17, 0.64, 0.03, 0.03, ONIBUS_ESC, { roughness: 0.4 })
    moldura.position.set(lx, CHAO + 0.6, 0.0)
    onibus.add(moldura)
    const lanterna = rbox(0.13, 0.36, 0.05, 0.03, '#d8121c', { emissive: '#e0101a', emissiveIntensity: 0.85 })
    lanterna.position.set(lx, CHAO + 0.54, 0.01)
    onibus.add(lanterna)
    const seta = rbox(0.13, 0.09, 0.05, 0.02, '#ffb02e', { emissive: '#ff9a1a', emissiveIntensity: 0.7 })
    seta.position.set(lx, CHAO + 0.8, 0.01)
    onibus.add(seta)
    const re = rbox(0.13, 0.06, 0.05, 0.02, '#f4f4f0', { roughness: 0.2 })
    re.position.set(lx, CHAO + 0.32, 0.01)
    onibus.add(re)
  }
  const parachoque = rbox(BW + 0.04, 0.14, 0.12, 0.04, PARACHOQUE, { roughness: 0.55 })
  parachoque.position.set(0, CHAO + 0.07, 0.02)
  onibus.add(parachoque)
  const placaCarro = rbox(0.3, 0.075, 0.02, 0.012, '#f2f2ee', { roughness: 0.4 })
  placaCarro.position.set(0, CHAO + 0.22, 0.022)
  onibus.add(placaCarro)
  const ue = rbox(0.04, 0.075, 0.022, 0.008, '#2a50a8', { roughness: 0.4 })
  ue.position.set(-0.13, CHAO + 0.22, 0.024)
  onibus.add(ue)
  const ESCAPE = v(-BW / 2 + 0.22, CHAO - 0.03, 0.04)
  const escape = cylinder(0.03, 0.03, 0.12, '#55595f', { roughness: 0.35, metalness: 0.7 }, 12)
  escape.rotation.x = Math.PI / 2
  escape.position.copy(ESCAPE)
  onibus.add(escape)

  // laterais: faixa de janelas escuras, rodas e a porta (lado direito)
  for (const side of [-1, 1]) {
    const janelas = rbox(0.02, 0.42, BL - 0.32, 0.02, VIDRO, { roughness: 0.12 })
    janelas.position.set(side * (BW / 2 + 0.002), CHAO + 0.98, -BL / 2 - 0.05)
    onibus.add(janelas)
    for (let k = 1; k < 3; k++) {
      const coluna = rbox(0.025, 0.44, 0.04, 0.01, ONIBUS, { roughness: 0.38 })
      coluna.position.set(side * (BW / 2 + 0.006), CHAO + 0.98, -0.16 - k * ((BL - 0.32) / 3))
      onibus.add(coluna)
    }
    for (const wz of [-0.32, -BL + 0.3]) {
      const roda = cylinder(0.17, 0.17, 0.15, BORRACHA, { roughness: 0.85 }, 24)
      roda.rotation.z = Math.PI / 2
      roda.position.set(side * (BW / 2 - 0.06), 0.17, wz)
      onibus.add(roda)
      const calota = cylinder(0.09, 0.09, 0.02, '#b9bec4', { roughness: 0.3, metalness: 0.8 }, 16)
      calota.rotation.z = Math.PI / 2
      calota.position.set(side * (BW / 2 + 0.02), 0.17, wz)
      onibus.add(calota)
    }
  }
  const porta = rbox(0.02, 0.86, 0.36, 0.02, VIDRO, { roughness: 0.15 })
  porta.position.set(BW / 2 + 0.004, CHAO + 0.55, -BL + 0.42)
  onibus.add(porta)

  // ---- a tira rasgada da faixa, presa no para-choque (peça) -----------------
  // esvoaça para trás e para o lado do pavão, de pé (a largura na vertical)
  const tira = new THREE.Group()
  tira.position.set(-BW / 2 + 0.12, CHAO + 0.1, 0.09)
  onibus.add(tira)
  const N = 9
  const pts: THREE.Vector3[] = []
  for (let k = 0; k <= N; k++) {
    const t = k / N
    pts.push(v(-0.8 * t, 0.6 * t + 0.09 * Math.sin(t * Math.PI * 2.6), 0.45 * t + 0.08 * Math.sin(t * Math.PI * 1.6)))
  }
  const WT = 0.17
  let wPrev = v(0, 1, 0)
  for (let k = 0; k < N; k++) {
    const t = new THREE.Vector3().subVectors(pts[k + 1], pts[k]).normalize()
    // largura ~vertical com uma torção suave ao longo da fita
    const w0 = UP.clone().addScaledVector(t, -UP.dot(t)).normalize()
    const tw = 0.45 * Math.sin((k / N) * Math.PI * 1.8)
    const w = w0.clone().applyAxisAngle(t, tw)
    wPrev = w
    tira.add(ribbonSeg(pts[k], pts[k + 1], w, WT, 0.014, CETIM))
    for (const sx of [-1, 1]) {
      const off = w.clone().multiplyScalar(sx * (WT / 2 - 0.004))
      tira.add(ribbonSeg(pts[k].clone().add(off), pts[k + 1].clone().add(off), w, 0.014, 0.02, OURO))
    }
  }
  // fim esfiapado da tira
  const fim = pts[N]
  const dirFim = new THREE.Vector3().subVectors(pts[N], pts[N - 1]).normalize()
  for (let k = 0; k < 4; k++) {
    const dente = cone(0.022, 0.06, CETIM, { roughness: 0.32 }, 6)
    dente.position.copy(fim).addScaledVector(wPrev, -WT / 2 + 0.02 + k * ((WT - 0.04) / 3)).addScaledVector(dirFim, 0.02 + (k % 2) * 0.02)
    dente.quaternion.setFromUnitVectors(UP, dirFim)
    dente.scale.z = 0.3
    tira.add(dente)
  }

  // ---- fumaça do escapamento (peça) ----------------------------------------
  onibus.updateMatrixWorld(true)
  const escapeMundo = onibus.localToWorld(ESCAPE.clone().add(v(0, 0, 0.08)))
  const fumaca = new THREE.Group()
  fumaca.position.copy(escapeMundo)
  root.add(fumaca)
  for (const [i, [fx, fy, fz, r]] of ([
    [-0.04, 0.05, 0.12, 0.08],
    [-0.16, 0.14, 0.36, 0.115],
    [-0.34, 0.27, 0.62, 0.15],
  ] as const).entries()) {
    const nuvem = puff(r, i === 0 ? '#9a9fa5' : FUMACA, 5, 71 + i, { roughness: 1 })
    nuvem.position.set(fx, fy, fz)
    fumaca.add(nuvem)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'calcada', object: base },
    { name: 'tapete', group: 'calcada', object: tapete },
    { name: 'pavao', group: 'miss', object: pavao },
    { name: 'cauda', group: 'miss', object: cauda },
    { name: 'asa', group: 'miss', object: asa },
    { name: 'faixa', group: 'miss', object: faixa },
    { name: 'resto', group: 'miss', object: resto },
    { name: 'fiapos', group: 'onibus', object: fiapos },
    { name: 'coroa', group: 'miss', object: coroa },
    { name: 'buque', group: 'miss', object: buque },
    { name: 'onibus', group: 'onibus', object: onibus },
    { name: 'tira', group: 'onibus', object: tira },
    { name: 'fumaca', group: 'onibus', object: fumaca },
    { name: 'bico', group: 'grito', object: bico },
  ]

  // o buquê na asa enquanto ele posa
  const BUQUE_MAO = v(-1.02, 1.05, 0.62)

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No ponto de ônibus, a calçada sobe do chão e um tapete vermelho desenrola até o meio-fio…',
    }),
    seq('tapete-desenrola', 'tapete', 0.45, 0.8, [ch('scale.x', 0.02, 1)], { ease: 'easeOut' }),

    seq('pavao-rise', 'pavao', 1.8, 0.85, [riseFrom(CY, 2.4)], {
      ease: 'easeOut',
      caption: '…para coroar a MISS ATRASO: um pavão de faixa, coroa e buquê.',
    }),
    seq('cauda-abre', 'cauda', 2.35, 0.8, [ch('scale.x', 0.05, 1), ch('scale.y', 0.55, 1)], { ease: 'easeOut' }),
    seq(
      'faixa-veste',
      'faixa',
      2.7,
      0.5,
      [ch('scale.x', 0.6, 1), ch('scale.y', 0.6, 1), ch('scale.z', 0.6, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'resto-veste',
      'resto',
      2.7,
      0.5,
      [ch('scale.x', 0.6, 1), ch('scale.y', 0.6, 1), ch('scale.z', 0.6, 1)],
      { ease: 'easeOut' },
    ),
    seq('coroa-cai', 'coroa', 2.95, 0.55, [ch('position.y', 0.62, 0.15)], { ease: 'easeIn' }),
    seq(
      'buque-surge',
      'buque',
      3.1,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('cauda-vibra', 'cauda', 3.3, 0.4, [ch('rotation.z', 0.06, 0)]),

    seq('onibus-rise', 'onibus', 4.3, 0.85, [riseFrom(ROAD_Y, 2.2)], {
      ease: 'easeOut',
      caption: 'Ele abre o leque pra foto oficial… e não vê a ponta da faixa presa no para-choque do ônibus.',
    }),
    seq(
      'tira-presa',
      'tira',
      4.75,
      0.45,
      [ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('onibus-arranca', 'onibus', 6.0, 1.3, [ch('position.z', BZ_PERTO, BZ)], {
      ease: 'easeIn',
      caption: 'O ônibus arranca soltando fumaça e a faixa RASGA bem depois do T: no peito sobra MISS AT.',
    }),
    seq('onibus-sai-do-meio-fio', 'onibus', 6.0, 1.3, [ch('position.x', BX_PERTO, BX)], { ease: 'easeIn' }),
    seq('tira-estica', 'tira', 6.0, 1.3, [ch('scale.x', 0.2, 1)], { ease: 'easeIn' }),
    seq('faixa-puxao', 'faixa', 6.2, 0.35, [ch('rotation.y', 0.12, 0)], { ease: 'easeOut' }),
    seq(
      'resto-arrancado',
      'resto',
      6.2,
      0.45,
      [
        ch('position.x', meio.x, RESTO_FIM.x), ch('position.z', meio.z, RESTO_FIM.z),
        ch('scale.x', 1, 0.01), ch('scale.y', 1, 0.01), ch('scale.z', 1, 0.01),
      ],
      { ease: 'easeIn' },
    ),
    seq(
      'fiapos-rasgo',
      'fiapos',
      6.45,
      0.3,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'fumaca-sai',
      'fumaca',
      7.2,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('pavao-vira', 'pavao', 8.3, 0.55, [ch('rotation.y', YAW_POSE, YAW)], {
      ease: 'easeOut',
      caption: 'IÁ, RRÁR! De coroa torta e bico escancarado, ele larga o buquê e dispara atrás: MISS-AT… BUS-SEM!',
    }),
    seq('pavao-dispara', 'pavao', 8.3, 0.55, [ch('position.x', PX_POSE, PX)], { ease: 'easeOut' }),
    seq('asa-ergue', 'asa', 8.3, 0.45, [ch('rotation.z', ASA_BAIXA, ASA_ALTA)], { ease: 'easeOut' }),
    seq('bico-grita', 'bico', 8.4, 0.35, [ch('rotation.x', 0, 0.85)], { ease: 'easeOut' }),
    seq('coroa-entorta', 'coroa', 8.45, 0.4, [ch('rotation.z', 0, 0.45)], { ease: 'easeOut' }),
    seq(
      'buque-cai',
      'buque',
      8.4,
      0.6,
      [
        ch('position.x', BUQUE_MAO.x, BUQUE[0]), ch('position.y', BUQUE_MAO.y, BUQUE[1]),
        ch('position.z', BUQUE_MAO.z, BUQUE[2]), ch('rotation.z', 0.3, 1.45),
      ],
      { ease: 'easeIn' },
    ),

    seq('tira-tremula', 'tira', 9.7, 0.8, [ch('rotation.x', 0.2, 0)], {
      caption: 'Jag har missat bussen. — Perdi o ônibus.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.75, 2.05, 4.3], target: [0.4, 1.1, -0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-har-missat-bussen',
    contexto:
      "Atraso: mensagem ou ligação pro trabalho, pra förskola ou pra quem está esperando — 'Jag har missat bussen, jag kommer lite senare' —, ou o desabafo no ponto vazio vendo as lanternas se afastarem.",
    fraseFonte: 'Perdi o ônibus.',
    fraseAlvo: 'Jag har missat bussen.',
    pronuncia:
      "iá rar MÍS-sat BÖS-sen ('jag' = iá; 'har' com h soprado e R brando — na fala corrida sai quase só 'rrá'; 'missat' com I curto, SS esticado e T seco no fim — sem ele fica 'missa', o infinitivo; 'bussen' = 'buss' + '-en' (O ônibus): U curto de bico puxando pra Ô, SS longo e -en fraquinho; força em MIS e BUSS)",
    ponteSonora:
      "IÁ, RRÁR! MISS-AT... BUS-SEM! (6 sílabas: iá-rrár-MÍS-sat-BÖS-sen; força no MÍS e no BÖS; IÁ, RRÁR é o 'jag har' de sempre — o MESMO de 'Jag har ett möte' e 'Jag har ont i magen', aqui o grito do pavão: I de ioga, nunca J chiado, e RRÁR com h soprado, A longo e R BRANDO no fim; MISS = a MISS do concurso, do jeito que o português já fala: I curto e SS esticado de cobra — é o 'miss' do inglês, perder; AT = o que SOBROU da faixa de MISS ATRASO depois que o ônibus a rasgou bem depois do T: A curto e fraquinho e T SECO de 'tatu', sem 'tchi' — é esse T que faz 'missat' (perdi); sem ele sobra 'missa', o infinitivo — e nada de MISSA de igreja: a faixa rasgou DEPOIS do T; BUS = o MESMO -BUS de ÔNIBUS de 'När går nästa buss?': curto, U de BICO puxando pra Ô, quase 'BÖS', SS esticado; SEM = o 'sem' de 'foi SEM mim', mas SEM NASALAR: E curtinho e fraco e N batido na língua — é o '-en' de 'bussen', O ônibus; nunca um SÊÊN longo e forte, que é o 'sen' (atrasado) de 'Förlåt, jag är lite sen')",
    historia:
      "Acabaram de coroar o pavão MISS ATRASO, o título mais cobiçado do ponto de ônibus: faixa de cetim, coroa e buquê. Ele abre o leque inteiro de penas pra foto oficial, posa de um lado, faz biquinho do outro... e não vê que a ponta da faixa ficou presa no para-choque do ônibus vermelho. A porta fecha, o ônibus arranca soltando fumacinha e a faixa RASGA bem depois do T: o ônibus leva o 'RASO' embora e no peito do pavão sobra só MISS AT. Ele solta o grito — IÁ, RRÁR! —, larga o buquê e dispara atrás, com a cauda arrastando no chão: MISS-AT... BUS-SEM! — a Miss Atraso ficou, e o ônibus foi SEM mim. Perdi o ônibus.",
  },
  createScene,
  refine: { organic: ['pavao'] },
}

export default card
