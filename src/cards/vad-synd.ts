import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vad synd!" — VÁ, SÜND! O corvo é o SÍNDICO do prédio e passa o dia ouvindo
 * notícia ruim. Pra cada uma: um VÁ! rouco de corvo e o cargo dito de bico —
 * SÍND vira SÜND — e ele arranca uma PENA do peito de consolo. No fim do dia:
 * meio pelado, de crachá e prancheta, num monte de penas pretas. Que pena!
 *
 * Diorama: piso de lajota bege do salão de festas; mesa posta com toalha
 * xadrez e brigadeiros intocados (fundo à esquerda), cadeiras de plástico
 * empilhadas (fundo à direita), varal de bandeirinhas murchas atrás; no centro
 * o corvo GRANDE, crachá amarelo-ouro (o acento) no peito, pena no bico.
 */

const TILE = '#dcc9a4'
const GROUT = '#bba57e'
const SOIL = '#8f7a5c'
const WOOD = '#8a5a33'
const CLOTH = '#f2ebdd'
const CHECK = '#b9483f'
const SILVER = '#c9ced4'
const CHOC = '#4a2a1c'
const PAPER = '#f6f3ea'
const CHAIR = '#efeee8'
const POLE = '#7a6a58'
const CROW = '#262e42'        // preto-azulado do corpo
const CROW_WING = '#2f3851'
const CROW_HEAD = '#232a3c'
const BEAK = '#3c3f48'
const BEAK_LOW = '#4a4e58'
const LEG = '#3b3e46'
const SKIN = '#e0a19c'        // peito depenado
const FEATHER = '#222b45'
const QUILL = '#c9ccd4'
const INK = '#1d2233'
const ACCENT = '#f5b41a'      // acento RESERVADO: o crachá de SÍNDICO

const MURCHAS = ['#c99590', '#d4bf80', '#93b3a8', '#a99bc0', '#c9a27e']

const GY = 0.18               // topo do piso de lajota
const CROW_X = 0.05
const CROW_Z = 0.15
const HEAD_Y = 1.42           // pescoço (pivô da cabeça), no espaço do corvo
const HEAD_RX = 0.1           // pose final: cabeça um tico baixa
const HEAD_DIP = 0.95         // mergulho até o peito pra arrancar a pena
const HEAD_TILT = 0.13        // cabeça tombada de tristeza (pose final)

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.012, 0.004, INK, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

const LH = 0.1    // altura da letra
const LW = 0.062  // largura das letras largas
const LT = 0.021  // espessura do traço

/** S Í N D I C O — letras de traço grosso, legíveis a distância de diorama. */
function letter(which: 'S' | 'Í' | 'N' | 'D' | 'I' | 'C' | 'O') {
  const g = new THREE.Group()
  const hw = LW / 2
  const top = LH / 2 - LT / 2
  if (which === 'S') {
    g.add(stroke(LW, LT, 0, top))
    g.add(stroke(LW, LT, 0, 0))
    g.add(stroke(LW, LT, 0, -top))
    g.add(stroke(LT, LH / 2, -hw + LT / 2, LH / 4))
    g.add(stroke(LT, LH / 2, hw - LT / 2, -LH / 4))
  } else if (which === 'I' || which === 'Í') {
    g.add(stroke(LT, LH, 0, 0))
    if (which === 'Í') g.add(stroke(LT * 0.85, 0.036, 0.006, LH / 2 + 0.03, -0.6))
  } else if (which === 'N') {
    g.add(stroke(LT, LH, -hw + LT / 2, 0))
    g.add(stroke(LT, LH, hw - LT / 2, 0))
    g.add(stroke(LT, Math.hypot(LW - LT, LH) - 0.006, 0, 0, Math.atan2(LW - LT, LH)))
  } else if (which === 'D') {
    g.add(stroke(LT, LH, -hw + LT / 2, 0))
    g.add(stroke(LW - 0.02, LT, -0.01, top))
    g.add(stroke(LW - 0.02, LT, -0.01, -top))
    g.add(stroke(LT, LH - 0.04, hw - LT / 2, 0))
    g.add(stroke(LT, 0.032, hw - 0.015, top - 0.008, 0.785))
    g.add(stroke(LT, 0.032, hw - 0.015, -top + 0.008, -0.785))
  } else if (which === 'C') {
    g.add(stroke(LT, LH, -hw + LT / 2, 0))
    g.add(stroke(LW, LT, 0, top))
    g.add(stroke(LW, LT, 0, -top))
  } else {
    g.add(stroke(LT, LH, -hw + LT / 2, 0))
    g.add(stroke(LT, LH, hw - LT / 2, 0))
    g.add(stroke(LW, LT, 0, top))
    g.add(stroke(LW, LT, 0, -top))
  }
  return g
}

/**
 * Pena preta brilhante: palheta torneada e achatada (folha pontuda) com a
 * raque clara marcada na face e o canhão nu saindo da base. Cresce em +y a
 * partir da origem (o canhão), face virada pra +z.
 */
function makeFeather(len: number) {
  const g = new THREE.Group()
  const vane = lathe(
    [
      [0, 0], [len * 0.08, len * 0.05], [len * 0.15, len * 0.25], [len * 0.15, len * 0.5],
      [len * 0.11, len * 0.75], [len * 0.05, len * 0.93], [0, len],
    ],
    FEATHER,
    { roughness: 0.38 },
    20,
  )
  vane.scale.z = 0.22
  g.add(vane)
  const rachis = cylinder(len * 0.016, len * 0.01, len * 0.95, QUILL, { roughness: 0.4 }, 10)
  rachis.position.set(0, len * 0.4, len * 0.026)
  g.add(rachis)
  const calamus = cylinder(len * 0.02, len * 0.016, len * 0.14, QUILL, { roughness: 0.4 }, 10)
  calamus.position.y = -len * 0.05
  g.add(calamus)
  return g
}

/** Bandeirinha de festa junina: triângulo de pano pendurado pelo lado de cima. */
function flag(color: string) {
  const shape = new THREE.Shape()
  shape.moveTo(-0.1, 0)
  shape.lineTo(0.1, 0)
  shape.lineTo(0, -0.24)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false })
  geo.translate(0, 0, -0.006)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.9, size: 0.24 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cilindro fino ligando dois pontos (cordão do crachá, corda do varal). */
function cord(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = new THREE.Vector3().subVectors(b, a)
  const c = cylinder(r, r, d.length(), color, { roughness: 0.6 }, 12)
  c.position.copy(a).addScaledVector(d, 0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return c
}

/** Cadeira de plástico monobloco. */
function chair() {
  const g = new THREE.Group()
  const opts = { roughness: 0.42 }
  const seat = rbox(0.46, 0.04, 0.44, 0.016, CHAIR, opts)
  seat.position.y = 0.42
  g.add(seat)
  const back = rbox(0.46, 0.34, 0.035, 0.016, CHAIR, opts)
  back.position.set(0, 0.62, -0.22)
  back.rotation.x = -0.15
  g.add(back)
  for (const sy of [0.56, 0.68]) {
    const slot = rbox(0.3, 0.035, 0.01, 0.005, '#d6d4cc', opts)
    slot.position.set(0, sy, -0.2 + (sy - 0.62) * 0.15)
    slot.rotation.x = -0.15
    g.add(slot)
  }
  for (const side of [-1, 1]) {
    const arm = rbox(0.04, 0.03, 0.4, 0.012, CHAIR, opts)
    arm.position.set(side * 0.235, 0.58, -0.02)
    g.add(arm)
    const post = cylinder(0.018, 0.02, 0.15, CHAIR, opts, 12)
    post.position.set(side * 0.235, 0.5, 0.16)
    g.add(post)
    for (const fz of [-1, 1]) {
      const leg = cylinder(0.022, 0.03, 0.44, CHAIR, opts, 12)
      leg.position.set(side * 0.205, 0.21, fz * 0.19)
      leg.rotation.set(fz * 0.08, 0, -side * 0.08)
      g.add(leg)
    }
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: piso de lajota bege do salão de festas ------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, SOIL, { roughness: 0.9 })
  soil.position.y = 0.06
  base.add(soil)

  const floor = cylinder(2.55, 2.6, 0.06, TILE, { roughness: 0.55 })
  floor.position.y = 0.15
  base.add(floor)

  // rejunte: cordas do círculo nas duas direções
  for (let i = -5; i <= 5; i++) {
    const c = i * 0.46 + 0.12
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - c * c, 0.01))
    const lx = rbox(0.022, 0.008, len, 0.003, GROUT, { roughness: 0.8 })
    lx.position.set(c, GY + 0.002, 0)
    base.add(lx)
    const lz = rbox(len, 0.008, 0.022, 0.003, GROUT, { roughness: 0.8 })
    lz.position.set(0, GY + 0.002, c)
    base.add(lz)
  }

  const rodape = torus(2.57, 0.04, '#b29a72', { roughness: 0.6 })
  rodape.rotation.x = Math.PI / 2
  rodape.position.y = GY - 0.01
  base.add(rodape)

  // balão murcho largado no chão
  const balao = sphere(0.15, MURCHAS[0], { roughness: 0.4 })
  balao.scale.set(1, 0.32, 0.8)
  balao.position.set(1.3, GY + 0.045, 0.62)
  balao.rotation.y = 0.6
  base.add(balao)
  const no = cone(0.035, 0.06, MURCHAS[0], { roughness: 0.4 })
  no.rotation.z = Math.PI / 2
  no.position.set(1.46, GY + 0.03, 0.7)
  base.add(no)
  const fio = capsule(0.006, 0.38, '#e6e0d4', { roughness: 0.8 })
  fio.rotation.set(Math.PI / 2, 0, 1.2)
  fio.position.set(1.67, GY + 0.008, 0.79)
  base.add(fio)

  // chapeuzinho de festa tombado
  const chapeu = new THREE.Group()
  chapeu.position.set(-1.72, GY + 0.085, 0.95)
  chapeu.rotation.set(0, 0.7, Math.PI / 2 - 0.25)
  const cone1 = cone(0.09, 0.25, MURCHAS[3], { roughness: 0.7 })
  chapeu.add(cone1)
  for (const sy of [-0.06, 0.03]) {
    const faixa = torus(0.09 * (0.5 - sy / 0.25) + 0.004, 0.008, '#efe7d6', { roughness: 0.7 })
    faixa.rotation.x = Math.PI / 2
    faixa.position.y = sy
    chapeu.add(faixa)
  }
  const pompom = puff(0.035, '#efe7d6', 4, 9, { roughness: 0.9 })
  pompom.position.y = 0.13
  chapeu.add(pompom)
  base.add(chapeu)

  root.add(base)

  // ---- mesa posta que ninguém usou -----------------------------------------
  const TABLE_H = 0.72
  const mesa = new THREE.Group()
  mesa.position.set(-1.42, GY, -0.72)
  mesa.rotation.y = 0.3
  root.add(mesa)

  for (const lx of [-1, 1]) {
    for (const lz of [-1, 1]) {
      const perna = cylinder(0.035, 0.03, 0.62, WOOD, { roughness: 0.6 })
      perna.position.set(lx * 0.68, 0.31, lz * 0.24)
      mesa.add(perna)
    }
  }
  const tampo = rbox(1.5, 0.05, 0.6, 0.015, WOOD, { roughness: 0.6 })
  tampo.position.y = TABLE_H - 0.025
  mesa.add(tampo)

  // toalha xadrez: tampo + abas caindo nas laterais
  const CW = 1.58
  const CD = 0.68
  const toalha = rbox(CW, 0.024, CD, 0.008, CLOTH, { roughness: 0.85 })
  toalha.position.y = TABLE_H + 0.012
  mesa.add(toalha)
  const NX = 8
  const NZ = 4
  for (let i = 0; i < NX; i++) {
    for (let j = 0; j < NZ; j++) {
      if ((i + j) % 2) continue
      const q = rbox(CW / NX, 0.006, CD / NZ, 0.002, CHECK, { roughness: 0.85 })
      q.position.set(-CW / 2 + (i + 0.5) * (CW / NX), TABLE_H + 0.025, -CD / 2 + (j + 0.5) * (CD / NZ))
      mesa.add(q)
    }
  }
  const DROP = 0.2
  for (const fz of [-1, 1]) {
    const aba = rbox(CW, DROP, 0.012, 0.004, CLOTH, { roughness: 0.85 })
    aba.position.set(0, TABLE_H - DROP / 2 + 0.02, fz * (CD / 2 + 0.006))
    mesa.add(aba)
    for (let i = 0; i < NX; i++) {
      for (let r = 0; r < 2; r++) {
        if ((i + r) % 2) continue
        const q = rbox(CW / NX, DROP / 2, 0.005, 0.002, CHECK, { roughness: 0.85 })
        q.position.set(
          -CW / 2 + (i + 0.5) * (CW / NX),
          TABLE_H + 0.02 - (r + 0.5) * (DROP / 2),
          fz * (CD / 2 + 0.014),
        )
        mesa.add(q)
      }
    }
  }
  for (const fx of [-1, 1]) {
    const aba = rbox(0.012, DROP, CD, 0.004, CLOTH, { roughness: 0.85 })
    aba.position.set(fx * (CW / 2 + 0.006), TABLE_H - DROP / 2 + 0.02, 0)
    mesa.add(aba)
    for (let j = 0; j < NZ; j++) {
      for (let r = 0; r < 2; r++) {
        if ((j + r) % 2) continue
        const q = rbox(0.005, DROP / 2, CD / NZ, 0.002, CHECK, { roughness: 0.85 })
        q.position.set(
          fx * (CW / 2 + 0.014),
          TABLE_H + 0.02 - (r + 0.5) * (DROP / 2),
          -CD / 2 + (j + 0.5) * (CD / NZ),
        )
        mesa.add(q)
      }
    }
  }

  const TT = TABLE_H + 0.03 // em cima da toalha
  const bandeja = lathe(
    [[0, 0], [0.27, 0], [0.3, 0.02], [0.31, 0.04], [0.285, 0.035], [0, 0.012]],
    SILVER,
    { roughness: 0.25, metalness: 0.75 },
  )
  bandeja.position.set(0.18, TT, 0.02)
  mesa.add(bandeja)
  const docePos: [number, number][] = [[0, 0]]
  for (let k = 0; k < 6; k++) docePos.push([Math.cos(k * 1.047) * 0.17, Math.sin(k * 1.047) * 0.17])
  docePos.forEach(([dx, dz], k) => {
    const forminha = lathe(
      [[0, 0], [0.045, 0], [0.056, 0.032], [0.05, 0.032], [0.04, 0.006], [0, 0.006]],
      k % 2 ? '#e6b0bc' : '#f0e2c4',
      { roughness: 0.8 },
      18,
    )
    forminha.position.set(0.18 + dx, TT + 0.014, 0.02 + dz)
    mesa.add(forminha)
    const doce = puff(0.034, CHOC, 6, 40 + k, { roughness: 0.85 })
    doce.position.set(0.18 + dx, TT + 0.05, 0.02 + dz)
    mesa.add(doce)
  })

  // copinhos e pratinhos de papel, ainda empilhados
  for (let k = 0; k < 3; k++) {
    const copo = lathe(
      [[0, 0], [0.04, 0], [0.055, 0.12], [0.05, 0.12], [0.036, 0.008], [0, 0.008]],
      MURCHAS[(k + 1) % MURCHAS.length],
      { roughness: 0.5 },
      18,
    )
    copo.position.set(-0.42 + k * 0.012, TT + k * 0.022, 0.08)
    mesa.add(copo)
  }
  for (let k = 0; k < 5; k++) {
    const prato = cylinder(0.12, 0.1, 0.012, k % 2 ? '#efe7d6' : '#e8dcc2', { roughness: 0.7 })
    prato.position.set(-0.6, TT + 0.006 + k * 0.013, -0.12)
    mesa.add(prato)
  }

  // ---- cadeiras de plástico empilhadas -------------------------------------
  const cadeiras = new THREE.Group()
  cadeiras.position.set(1.58, GY, -0.78)
  cadeiras.rotation.y = -0.45
  for (let i = 0; i < 4; i++) {
    const c = chair()
    c.position.set(0, i * 0.085, -i * 0.025)
    cadeiras.add(c)
  }
  root.add(cadeiras)

  // ---- varal de bandeirinhas murchas ---------------------------------------
  const varal = new THREE.Group()
  varal.position.set(0, GY, -1.55)
  const POLE_H = 2.25
  const PX = 2.05
  for (const side of [-1, 1]) {
    const poste = cylinder(0.03, 0.036, POLE_H, POLE, { roughness: 0.6 })
    poste.position.set(side * PX, POLE_H / 2, 0)
    varal.add(poste)
    const pe = cylinder(0.12, 0.14, 0.05, POLE, { roughness: 0.6 })
    pe.position.set(side * PX, 0.025, 0)
    varal.add(pe)
    const bola = sphere(0.05, POLE, { roughness: 0.5 })
    bola.position.set(side * PX, POLE_H + 0.03, 0)
    varal.add(bola)
  }
  const ROPE_TOP = POLE_H - 0.06
  const SAG = 0.26
  const ropeY = (x: number) => ROPE_TOP - SAG * (1 - (x / PX) ** 2)
  const SEGS = 14
  for (let s = 0; s < SEGS; s++) {
    const x0 = -PX + (2 * PX * s) / SEGS
    const x1 = -PX + (2 * PX * (s + 1)) / SEGS
    varal.add(cord(new THREE.Vector3(x0, ropeY(x0), 0), new THREE.Vector3(x1, ropeY(x1), 0), 0.009, '#e9e1cf'))
  }
  const NF = 15
  for (let k = 0; k < NF; k++) {
    const x = -PX + 0.2 + (k * (2 * PX - 0.4)) / (NF - 1)
    const f = flag(MURCHAS[k % MURCHAS.length])
    f.position.set(x, ropeY(x), 0)
    // murchas: torcidas, caídas de lado, algumas encolhidas
    f.rotation.set(0.1 + rand() * 0.25, (rand() - 0.5) * 1.1, (rand() - 0.5) * 0.35)
    f.scale.set(1, 0.78 + rand() * 0.25, 1)
    varal.add(f)
  }
  // uma bandeirinha que já caiu no chão
  const caida = flag(MURCHAS[2])
  caida.position.set(1.62, 0.012, 0.35)
  caida.rotation.set(-Math.PI / 2, 0, 0.9)
  varal.add(caida)
  root.add(varal)

  // ---- CORVO SÍNDICO -------------------------------------------------------
  const corvo = new THREE.Group()
  corvo.position.set(CROW_X, GY, CROW_Z)
  root.add(corvo)

  const body = { roughness: 0.42 }
  // patas finas cinza-chumbo com dedos abertos
  for (const side of [-1, 1]) {
    const canela = cylinder(0.042, 0.04, 0.34, LEG, { roughness: 0.55 })
    canela.position.set(side * 0.16, 0.2, 0.02)
    corvo.add(canela)
    for (const a of [-0.45, 0, 0.45]) {
      const dedo = capsule(0.03, 0.12, LEG, { roughness: 0.55 })
      dedo.rotation.set(Math.PI / 2, a, 0, 'YXZ')
      dedo.position.set(side * 0.16 + Math.sin(a) * 0.1, 0.03, 0.02 + Math.cos(a) * 0.1)
      corvo.add(dedo)
    }
    const tras = capsule(0.028, 0.08, LEG, { roughness: 0.55 })
    tras.rotation.x = Math.PI / 2
    tras.position.set(side * 0.16, 0.03, -0.08)
    corvo.add(tras)
    // coxas emplumadas
    const coxa = sphere(0.2, CROW, body)
    coxa.scale.set(1, 1.1, 1)
    coxa.position.set(side * 0.17, 0.44, 0.01)
    corvo.add(coxa)
  }

  // corpo: ovo grande, um tico inclinado pra frente
  const tronco = sphere(0.5, CROW, body)
  tronco.scale.set(1, 1.22, 0.92)
  tronco.position.y = 0.92
  corvo.add(tronco)

  const pescoco = sphere(0.28, CROW, body)
  pescoco.position.set(0, 1.42, 0.02)
  corvo.add(pescoco)

  // peito depenado: manchas de pele rosada
  const surfZ = (x: number, y: number) =>
    0.46 * Math.sqrt(Math.max(0, 1 - (x / 0.5) ** 2 - ((y - 0.92) / 0.61) ** 2))
  const patches: [number, number, number][] = [[-0.17, 1.2, 0.11], [0.17, 1.1, 0.09], [0.03, 1.33, 0.08], [-0.33, 0.95, 0.08]]
  for (const [px, py, r] of patches) {
    // duas manchas sobrepostas: contorno irregular de pele arrancada
    for (const [dx, dy, k] of [[0, 0, 1], [r * 0.55 * (rand() - 0.5) * 2, -r * 0.5, 0.65]] as const) {
      const x = px + dx
      const y = py + dy
      const pele = sphere(r * k, SKIN, { roughness: 0.6 })
      pele.scale.set(1, 0.85, 0.28)
      pele.position.set(x, y, surfZ(x, y) - 0.014)
      pele.lookAt(new THREE.Vector3(x * 3, 0.92 + (y - 0.92) * 2.4, 3))
      corvo.add(pele)
    }
  }

  // cauda em leque pra trás e pra baixo
  for (let k = 0; k < 4; k++) {
    const t = k - 1.5
    const rem = capsule(0.07, 0.42, k % 2 ? CROW : CROW_WING, body)
    rem.scale.set(1.3, 1, 0.4)
    rem.rotation.set(1.05, 0, t * 0.16)
    rem.position.set(t * 0.1, 0.38, -0.62)
    corvo.add(rem)
  }

  // asas dobradas: ombro largo, meio e um leque de rêmiges caindo pra trás.
  // A direita (lado -x) cai desanimada; a esquerda (+x) se abre um tico por
  // cima da prancheta, apertando-a contra o corpo.
  function wing(side: number, out: number) {
    const ombro = sphere(0.3, CROW_WING, body)
    ombro.scale.set(0.32, 0.85, 0.82)
    ombro.position.set(side * (0.45 + out), 1.1, -0.03)
    ombro.rotation.z = side * 0.12
    corvo.add(ombro)
    const meio = sphere(0.25, CROW_WING, body)
    meio.scale.set(0.3, 1.05, 0.78)
    meio.position.set(side * (0.5 + out), 0.8, -0.07)
    meio.rotation.z = side * 0.08
    corvo.add(meio)
    for (let k = 0; k < 4; k++) {
      const remige = capsule(0.055, 0.3, k % 2 ? CROW_WING : '#36405c', body)
      remige.scale.set(0.45, 1, 1)
      remige.position.set(side * (0.53 + out + k * 0.008), 0.5 + k * 0.03, 0.04 - k * 0.085)
      remige.rotation.set(0.12 + k * 0.1, 0, side * 0.1)
      corvo.add(remige)
    }
  }
  wing(-1, 0)
  wing(1, 0.1)

  // ---- cabeça (pivô no pescoço): olhos tristes, bico grosso ----------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, HEAD_Y, 0.04)
  cabeca.rotation.set(HEAD_RX, 0, HEAD_TILT)
  corvo.add(cabeca)

  const cranio = sphere(0.31, CROW_HEAD, body)
  cranio.scale.set(0.95, 0.95, 1.05)
  cranio.position.set(0, 0.24, 0.02)
  cabeca.add(cranio)

  // bico: mandíbula de cima grossa e a de baixo menor
  const bicoSup = cone(0.115, 0.42, BEAK, { roughness: 0.3 })
  bicoSup.scale.set(0.85, 1, 1)
  bicoSup.rotation.x = Math.PI / 2 + 0.25
  bicoSup.position.set(0, 0.11, 0.48)
  cabeca.add(bicoSup)
  const bicoInf = cone(0.08, 0.32, BEAK_LOW, { roughness: 0.35 })
  bicoInf.scale.set(0.8, 1, 1)
  bicoInf.rotation.x = Math.PI / 2 + 0.42
  bicoInf.position.set(0, 0.02, 0.42)
  cabeca.add(bicoInf)
  // cerdas sobre a base do bico
  const cerdas = sphere(0.09, CROW_HEAD, body)
  cerdas.scale.set(1, 0.6, 1.1)
  cerdas.position.set(0, 0.2, 0.33)
  cabeca.add(cerdas)

  for (const side of [-1, 1]) {
    const esclera = sphere(0.085, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(side * 0.13, 0.3, 0.28)
    cabeca.add(esclera)
    // pupila olhando pra baixo e pro meio: triste
    const pupila = sphere(0.042, '#121212', { roughness: 0.2 })
    pupila.position.set(side * 0.118, 0.272, 0.323)
    cabeca.add(pupila)
    const brilho = sphere(0.012, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.118 + 0.014, 0.287, 0.36)
    cabeca.add(brilho)
    // pálpebra caída: canto de fora mais baixo
    const palpebra = sphere(0.092, CROW_HEAD, body)
    palpebra.scale.set(1.08, 0.6, 0.72)
    palpebra.position.set(side * 0.13, 0.338, 0.285)
    palpebra.rotation.z = -side * 0.4
    cabeca.add(palpebra)
    const sobrancelha = capsule(0.022, 0.1, '#4a5470', { roughness: 0.5 })
    sobrancelha.position.set(side * 0.13, 0.425, 0.27)
    sobrancelha.rotation.z = Math.PI / 2 - side * 0.45
    cabeca.add(sobrancelha)
  }

  // topete desgrenhado
  for (const [tx, tz, rz, rx] of [[-0.07, -0.02, 0.7, -0.7], [0.0, -0.06, 0.0, -0.95], [0.07, -0.02, -0.7, -0.7]] as const) {
    const tufo = capsule(0.05, 0.12, CROW_HEAD, body)
    tufo.scale.set(1, 1, 0.6)
    tufo.position.set(tx, 0.55, tz - 0.02)
    tufo.rotation.set(rx, 0, rz)
    cabeca.add(tufo)
  }

  // ---- pena recém-arrancada, presa no bico ---------------------------------
  const pena = new THREE.Group()
  pena.position.set(0.04, 0.045, 0.56)
  pena.rotation.set(0.15, 0, Math.PI / 2 + 0.35)
  pena.add(makeFeather(0.5))
  cabeca.add(pena)

  // ---- crachá de SÍNDICO (acento) ------------------------------------------
  const cracha = new THREE.Group()
  corvo.add(cracha)
  for (const side of [-1, 1]) {
    const a = new THREE.Vector3(side * 0.21, 1.38, 0.22)
    const m = new THREE.Vector3(side * 0.13, 1.16, 0.43)
    const b = new THREE.Vector3(side * 0.05, 0.92, 0.475)
    cracha.add(cord(a, m, 0.018, ACCENT), cord(m, b, 0.018, ACCENT))
  }
  const crachaPlaca = new THREE.Group()
  crachaPlaca.position.set(0, 0.8, 0.49)
  crachaPlaca.rotation.x = -0.08
  cracha.add(crachaPlaca)
  const moldura = rbox(0.58, 0.24, 0.022, 0.03, ACCENT, { roughness: 0.35 })
  crachaPlaca.add(moldura)
  const cartao = rbox(0.54, 0.2, 0.01, 0.018, '#fbfaf5', { roughness: 0.4 })
  cartao.position.z = 0.012
  crachaPlaca.add(cartao)
  const prendedor = rbox(0.07, 0.05, 0.03, 0.01, ACCENT, { roughness: 0.35 })
  prendedor.position.set(0, 0.13, 0.004)
  crachaPlaca.add(prendedor)

  const word: ['S' | 'Í' | 'N' | 'D' | 'I' | 'C' | 'O', number][] = []
  const widths = { S: LW, Í: LT, N: LW, D: LW, I: LT, C: LW * 0.9, O: LW }
  const GAP = 0.019
  const glyphs = ['S', 'Í', 'N', 'D', 'I', 'C', 'O'] as const
  const total = glyphs.reduce((s, g) => s + widths[g], 0) + GAP * (glyphs.length - 1)
  let cx = -total / 2
  for (const gch of glyphs) {
    word.push([gch, cx + widths[gch] / 2])
    cx += widths[gch] + GAP
  }
  for (const [gch, lx] of word) {
    const l = letter(gch)
    l.position.set(lx, -0.012, 0.022)
    crachaPlaca.add(l)
  }

  // ---- prancheta debaixo da asa esquerda -----------------------------------
  const prancheta = new THREE.Group()
  prancheta.position.set(0.54, 0.8, 0.17)
  prancheta.rotation.set(0, 0.97, -0.12)
  corvo.add(prancheta)
  const tabua = rbox(0.34, 0.46, 0.022, 0.025, '#a0703f', { roughness: 0.6 })
  prancheta.add(tabua)
  const folha = rbox(0.29, 0.37, 0.006, 0.004, PAPER, { roughness: 0.8 })
  folha.position.set(0, -0.025, 0.014)
  prancheta.add(folha)
  for (let k = 0; k < 6; k++) {
    const linha = rbox(k % 2 ? 0.16 : 0.2, 0.012, 0.004, 0.002, '#8d929c', { roughness: 0.8 })
    linha.position.set(-0.02 - (k % 2) * 0.02, 0.09 - k * 0.048, 0.018)
    prancheta.add(linha)
    // cada notícia ruim ticada com um xis
    for (const r of [0.785, -0.785]) {
      const x = rbox(0.034, 0.009, 0.004, 0.002, '#a4504a', { roughness: 0.8 })
      x.position.set(0.105, 0.09 - k * 0.048, 0.02)
      x.rotation.z = r
      prancheta.add(x)
    }
  }
  const clipe = rbox(0.14, 0.05, 0.03, 0.012, '#9aa1aa', { roughness: 0.3, metalness: 0.75 })
  clipe.position.set(0, 0.2, 0.016)
  prancheta.add(clipe)
  const argola = torus(0.03, 0.008, '#9aa1aa', { roughness: 0.3, metalness: 0.75 })
  argola.position.set(0, 0.235, 0.02)
  prancheta.add(argola)

  // ---- bilhetinhos de notícia ruim aos pés do corvo ------------------------
  const bilhetes = new THREE.Group()
  bilhetes.position.set(-0.62, GY, 0.92)
  bilhetes.scale.setScalar(1.3)
  for (let k = 0; k < 4; k++) {
    const b = new THREE.Group()
    b.position.set((rand() - 0.5) * 0.06, 0.005 + k * 0.01, (rand() - 0.5) * 0.06)
    b.rotation.y = rand() * Math.PI
    const papel = rbox(0.17, 0.008, 0.12, 0.003, k === 2 ? '#f3e7a6' : PAPER, { roughness: 0.85 })
    b.add(papel)
    for (let l = 0; l < 3; l++) {
      const tinta = rbox(0.11 - l * 0.02, 0.003, 0.01, 0.001, '#6f7e9c', { roughness: 0.8 })
      tinta.position.set(-0.01, 0.005, -0.03 + l * 0.03)
      b.add(tinta)
    }
    bilhetes.add(b)
  }
  for (const [bx, bz, ry] of [[0.2, -0.08, 0.5], [-0.17, 0.1, -0.7], [0.12, 0.17, 1.6]] as const) {
    const tenda = new THREE.Group()
    tenda.position.set(bx, 0, bz)
    tenda.rotation.y = ry
    for (const s of [-1, 1]) {
      const aba = rbox(0.15, 0.08, 0.006, 0.003, PAPER, { roughness: 0.85 })
      aba.position.set(0, 0.035, s * 0.022)
      aba.rotation.x = s * 0.55
      tenda.add(aba)
    }
    bilhetes.add(tenda)
  }
  root.add(bilhetes)

  // ---- monte de penas pretas: o corvo está em cima dele -------------------
  // Um miolo escuro baixo (só tapa as frestas) coberto por camadas de penas
  // soltas em ângulos variados, como um monte de folhas.
  const monte = new THREE.Group()
  monte.position.set(CROW_X, GY, CROW_Z + 0.08)
  const MR = 0.82
  const MH = 0.2
  const domeY = (r: number) => MH * Math.max(0, 1 - (r / MR) ** 2)
  const perfil: [number, number][] = [[0, 0]]
  for (let k = 8; k >= 0; k--) {
    const r = (MR * 0.72 * k) / 8
    perfil.push([r, Math.max(0.004, domeY(r / 0.72) * 0.75)])
  }
  const domo = lathe(perfil, '#151a28', { roughness: 0.7 }, 32)
  monte.add(domo)
  const legs = [new THREE.Vector2(-0.16, -0.06), new THREE.Vector2(0.16, -0.06)]
  const notesLocal = new THREE.Vector2(-0.62 - CROW_X, 0.92 - CROW_Z - 0.08)
  const N = 110
  for (let k = 0; k < N; k++) {
    const r = Math.sqrt((k + 0.5) / N) * (MR + 0.1)
    const a = k * 2.39996 + rand() * 0.4
    const p = new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)
    if (legs.some((l) => p.distanceTo(l) < 0.1)) continue
    if (p.distanceTo(notesLocal) < 0.26) continue
    const holder = new THREE.Group()
    holder.position.set(p.x, domeY(r) * (0.7 + rand() * 0.3) + 0.004, p.y)
    holder.rotation.y = rand() * Math.PI * 2
    const f = makeFeather(0.28 + rand() * 0.14)
    // penas soltas: umas deitadas, outras espetadas no monte
    f.rotation.set(-Math.PI / 2 + (rand() - 0.3) * 0.5, 0, (rand() - 0.5) * 0.9)
    f.position.y = -0.02
    holder.add(f)
    monte.add(holder)
  }
  root.add(monte)

  // ---- três penas caindo no ar ---------------------------------------------
  const penasAr = new THREE.Group()
  penasAr.position.set(CROW_X, GY, CROW_Z)
  for (const [fx, fy, fz, rx, ry, rz, len] of [
    [-0.82, 1.3, 0.42, 0.3, 0.2, 1.1, 0.34],
    [0.95, 1.18, 0.55, -0.2, -0.3, -0.7, 0.3],
    [-0.62, 0.62, 0.78, 0.6, 0.1, 2.2, 0.3],
  ] as const) {
    const f = makeFeather(len)
    f.position.set(fx, fy, fz)
    f.rotation.set(rx, ry, rz)
    penasAr.add(f)
  }
  root.add(penasAr)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'salao', object: base },
    { name: 'mesa', group: 'festa', object: mesa },
    { name: 'cadeiras', group: 'festa', object: cadeiras },
    { name: 'varal', group: 'festa', object: varal },
    { name: 'corvo', group: 'corvo', object: corvo },
    { name: 'cabeca', group: 'corvo', object: cabeca },
    { name: 'cracha', group: 'sindico', object: cracha },
    { name: 'prancheta', group: 'sindico', object: prancheta },
    { name: 'bilhetes', group: 'noticias', object: bilhetes },
    { name: 'pena', group: 'pena', object: pena },
    { name: 'penasAr', group: 'pena', object: penasAr },
    { name: 'monte', group: 'pena', object: monte },
  ]

  const pop = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Sobe o salão de festas do prédio: piso de lajota bege, vazio…',
    }),

    seq('mesa-rise', 'mesa', 1.3, 0.8, [riseFrom(GY, 1.0)], {
      ease: 'easeOut',
      caption: '…mesa posta, brigadeiro intocado, cadeiras empilhadas, bandeirinhas murchas: a festa foi cancelada.',
    }),
    seq('cadeiras-rise', 'cadeiras', 1.5, 0.8, [riseFrom(GY, 1.4)], { ease: 'easeOut' }),
    seq('varal-rise', 'varal', 1.7, 0.9, [riseFrom(GY, 2.6)], { ease: 'easeOut' }),

    seq('corvo-rise', 'corvo', 3.4, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Quem recebe a notícia é o SÍNDICO do prédio: um corvo preto enorme.',
    }),
    seq('cabeca-sobe', 'cabeca', 3.65, 0.7, [ch('position.y', 0.95, HEAD_Y)], { ease: 'easeOut' }),

    seq('cracha-pop', 'cracha', 5.0, 0.55, pop(), {
      ease: 'easeOut',
      caption: 'Crachá de SÍNDICO no peito, prancheta debaixo da asa.',
    }),
    seq('prancheta-entra', 'prancheta', 5.2, 0.6, [ch('position.z', 0.75, 0.17), ...pop(0.3)], {
      ease: 'easeOut',
    }),

    seq('bilhetes-caem', 'bilhetes', 6.5, 0.6, [ch('position.y', GY + 1.8, GY)], {
      ease: 'easeIn',
      caption: 'E chove notícia ruim: "choveu, a festa caiu", "não vou poder ir", "o elevador quebrou"…',
    }),

    seq('cabeca-mergulha', 'cabeca', 7.9, 0.45, [ch('rotation.x', HEAD_RX, HEAD_DIP)], {
      ease: 'easeInOut',
      caption: 'Pra cada uma: um VÁ! rouco de corvo e o cargo — SÍND… — que de bico sai SÜND!',
    }),
    seq('pena-arranca', 'pena', 8.3, 0.25, pop(), { ease: 'easeOut' }),
    seq('cabeca-ergue', 'cabeca', 8.55, 0.55, [ch('rotation.x', HEAD_DIP, HEAD_RX)], {
      ease: 'easeOut',
      caption: 'E a cada VÁ, SÜND! ele arranca uma PENA do peito e entrega de consolo.',
    }),
    seq('penas-caem', 'penasAr', 8.7, 1.4, [ch('position.y', GY + 0.6, GY), ch('rotation.y', -1.1, 0)], {
      ease: 'easeOut',
    }),
    seq('monte-cresce', 'monte', 9.1, 1.0, [
      ch('scale.x', 0.5, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.5, 1),
    ], { ease: 'easeOut' }),

    seq('cabeca-tomba', 'cabeca', 10.6, 0.8, [ch('rotation.z', 0, HEAD_TILT)], {
      ease: 'easeInOut',
      caption: 'Vad synd! — Poxa, que pena!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.3, 4.6], target: [0.05, 1.15, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-synd',
    contexto:
      "Social: quando alguém conta que não vai poder ir à festa, que o show esgotou, que o restaurante fechou, que a chuva estragou o passeio — o lamento educado de qualquer plano que não deu certo. Por mensagem também: 'Vad synd! Nästa gång då.'",
    fraseFonte: 'Poxa, que pena!',
    fraseAlvo: 'Vad synd!',
    pronuncia:
      "va SÜND ('vad' na fala vira só 'va': sem D e sem R — com R vira 'var', onde; 'synd' com Ü CURTO — lábios em bico de U e língua na posição do I —, a força toda nele, N de língua sem nasalizar e um D leve no fim, sem 'dji')",
    ponteSonora:
      "VÁ, SÜND! (2 batidas: va-SÜND; a força cai toda no SÜND; VÁ é o MESMO 'vad' de 'VÁ, CÜL!', 'VÁ, ASSADO?!' e 'ÓI! VÁ... CÁLT!' — aqui é o grasnado rouco do corvo: curto, SEM R (com R vira 'var', onde) e sem D; SÜND = o SÍNDICO cortado no D e dito DE BICO: corvo não tem lábio, só bico, e tudo o que ele fala sai em bico — a língua fica parada no I de SÍN e o bico empurra os lábios pra frente, e isso é o Ü, o mesmo truque do CHÜLD ('o Chile dito de bico') de 'Jag är förkyld' e do TÜ de 'tycker'; CURTO, nada de 'süünd' esticado; o N é de língua, sem o 'in' nasal do português; e o D fecha seco, a língua batendo atrás dos dentes, sem o '-ico' e sem 'dji': SÜND, uma sílaba só; sem o bico, com U chapado, sai 'sund', que é 'saudável')",
    historia:
      "O corvo é o SÍNDICO do prédio — crachá no peito, prancheta debaixo da asa — e síndico passa o dia ouvindo notícia ruim: 'Choveu, a festa do salão foi cancelada.' 'Desculpa, não vou poder ir.' 'O elevador quebrou de novo.' Pra cada uma ele tem o mesmo bordão: solta um VÁ! rouco de corvo e completa com o próprio cargo, SÍND! — só que, saindo de um bico, o I sai de bico também: SÜND! E a cada VÁ, SÜND! ele arranca uma PENA do peito e entrega de consolo. No fim do dia o síndico está pelado, de crachá e prancheta, em cima de um monte de penas pretas, no salão de festas vazio: poxa, que pena!",
  },
  createScene,
  refine: { organic: ['corvo', 'cabeca'] },
}

export default card
