import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person, shoulderPivot,
} from '../rig/helpers'

/**
 * "Har ni något vegetariskt?" — RRÁR-NI... NÔT... VÊ-GA... TÁÁ-RISC-T?!
 *
 * Arrastaram o curupira pra um rodízio. Pés virados pra trás, ele tropeça na
 * porta, rala a canela e entra com a bisnaga de ÁRNICA (RRÁR-NI). Na mesa, um
 * leitão assado de maçã na boca. No quadro de giz, a única opção sem bicho —
 * VEGANO — TÁ RISCADA com um traço branco grosso. O cabelo de fogo sobe e ele
 * aponta o quadro, indignado.
 *
 * Diorama: assoalho escuro do restaurante; mesa de toalha vermelha com a
 * travessa e o leitão à esquerda; curupira no centro, virado pro quadro;
 * cavalete com o quadro-negro à direita.
 */

const PISO = '#3a291c'
const PISO_LINHA = '#271a11'
const PISO_CLARO = '#46321f'
const TOALHA = '#9c3a30'
const TOALHA_ESC = '#7e2c25'
const MADEIRA = '#c9a26b'      // cavalete
const MADEIRA_ESC = '#8d6a3e'
const MESA_PE = '#4b3423'
const PRATA = '#c3c8cc'
const LEITAO = '#b4682c'
const LEITAO_ESC = '#8a4a1d'
const MACA = '#c8252b'
const LOUSA = '#27322d'
const MOLDURA = '#7a5a36'
const GIZ = '#e6e4da'
const GIZ_FRACO = '#7f8a83'
const PELE = '#6f8a3c'         // verde-musgo do curupira
const PELE_ESC = '#55702c'
const FOLHA = '#2f7a35'
const FOLHA_CLARA = '#43943f'
const ROXO = '#6a3d8f'
const ARNICA = '#e9c33f'
const TAMPA = '#2e8a46'
const FOGO_A = '#e2401b'       // acento saturado: o cabelo de fogo
const FOGO_B = '#ff7a1a'
const FOGO_C = '#ffc93a'

const GY = 0.16 // topo do assoalho
const MESA_H = 0.74
const PIG_S = 1.22 // travessa + leitão um pouco maiores que o natural: lê de longe
const MESA = new THREE.Vector3(-1.5, GY, -0.3)
const CUR = new THREE.Vector3(-0.1, GY, 0.45)
const CUR_ROT = 0.85 // curupira virado pro quadro (à direita)
const CUR_S = 1.36
const EASEL = new THREE.Vector3(1.45, GY, -0.35)
const EASEL_ROT = -0.42
const EASEL_TILT = -0.11
const BOARD_Y = 1.5 // centro do quadro, no referencial do cavalete
const WORD_Y = -0.06 // linha do VEGANO no quadro

// pose final dos braços (pivô no ombro)
const APONTA: [number, number, number] = [0, -0.5, 1.68]
const ARNICA_POSE: [number, number, number] = [-1.2, 0, -0.62]

/** Traço de giz: caixinha arredondada em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0, color = GIZ) {
  const s = rbox(w, h, 0.016, 0.006, color, { roughness: 0.95 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** V E G A N O — letras de giz de traço grosso, legíveis de longe. */
function letter(which: 'V' | 'E' | 'G' | 'A' | 'N' | 'O') {
  const g = new THREE.Group()
  const t = 0.036
  const H = 0.2
  const hy = H / 2 - t / 2
  if (which === 'V') {
    g.add(stroke(t, H * 1.04, -0.032, 0, 0.3))
    g.add(stroke(t, H * 1.04, 0.032, 0, -0.3))
  } else if (which === 'E') {
    g.add(stroke(t, H, -0.05, 0))
    g.add(stroke(0.12, t, 0.005, hy))
    g.add(stroke(0.09, t, -0.01, 0))
    g.add(stroke(0.12, t, 0.005, -hy))
  } else if (which === 'G') {
    g.add(stroke(t, H, -0.05, 0))
    g.add(stroke(0.12, t, 0.005, hy))
    g.add(stroke(0.12, t, 0.005, -hy))
    g.add(stroke(t, 0.1, 0.05, -0.045))
    g.add(stroke(0.055, t, 0.035, -0.005))
  } else if (which === 'A') {
    g.add(stroke(t, H * 1.04, -0.031, 0, -0.3))
    g.add(stroke(t, H * 1.04, 0.031, 0, 0.3))
    g.add(stroke(0.075, t * 0.9, 0, -0.03))
  } else if (which === 'N') {
    g.add(stroke(t, H, -0.05, 0))
    g.add(stroke(t, H, 0.05, 0))
    g.add(stroke(t, H * 1.08, 0, 0, 0.45))
  } else {
    // O redondo de giz: anel achatado, nada de retângulo (que lê como D)
    const anel = torus(0.064, t / 2, GIZ, { roughness: 0.95 })
    anel.scale.set(1, 1.42, 0.3)
    g.add(anel)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- base: assoalho de tábuas escuras do rodízio --------------------------
  const base = new THREE.Group()
  const solo = cylinder(2.62, 2.72, 0.1, '#2a1e15', { roughness: 0.95 })
  solo.position.y = 0.05
  base.add(solo)
  const piso = cylinder(2.56, 2.62, 0.06, PISO, { roughness: 0.8 })
  piso.position.y = 0.13
  base.add(piso)
  for (let i = -4; i <= 4; i++) {
    const z = i * 0.56
    const meia = Math.sqrt(Math.max(2.5 * 2.5 - z * z, 0.01))
    const ripa = rbox(meia * 2, 0.012, 0.5, 0.005, i % 2 === 0 ? PISO : PISO_CLARO, { roughness: 0.8 })
    ripa.position.set(0, GY + 0.004, z)
    base.add(ripa)
    const fresta = rbox(meia * 2, 0.014, 0.03, 0.006, PISO_LINHA, { roughness: 0.9 })
    fresta.position.set(0, GY + 0.005, z + 0.28)
    if (Math.abs(z + 0.28) < 2.45) base.add(fresta)
  }
  // cadeira encostada na mesa (contexto de restaurante)
  const cadeira = new THREE.Group()
  cadeira.position.set(-1.85, GY, 0.55)
  cadeira.rotation.y = 0.5 + rand() * 0.1
  const assento = rbox(0.46, 0.06, 0.44, 0.02, MESA_PE, { roughness: 0.7 })
  assento.position.y = 0.46
  cadeira.add(assento)
  for (const px of [-1, 1]) {
    for (const pz of [-1, 1]) {
      const perna = cylinder(0.022, 0.026, 0.46, MESA_PE, { roughness: 0.7 })
      perna.position.set(px * 0.19, 0.23, pz * 0.18)
      cadeira.add(perna)
    }
    const montante = cylinder(0.022, 0.022, 0.5, MESA_PE, { roughness: 0.7 })
    montante.position.set(px * 0.19, 0.73, 0.19)
    cadeira.add(montante)
  }
  const encosto = rbox(0.42, 0.16, 0.04, 0.02, MESA_PE, { roughness: 0.7 })
  encosto.position.set(0, 0.88, 0.19)
  cadeira.add(encosto)
  base.add(cadeira)
  root.add(base)

  // ---- mesa quadrada de toalha vermelha -------------------------------------
  const mesa = new THREE.Group()
  mesa.position.copy(MESA)
  mesa.rotation.y = 0.25
  const tampo = rbox(1.0, 0.05, 0.9, 0.02, MESA_PE, { roughness: 0.7 })
  tampo.position.y = MESA_H - 0.04
  mesa.add(tampo)
  for (const px of [-1, 1]) {
    for (const pz of [-1, 1]) {
      const perna = rbox(0.07, MESA_H - 0.06, 0.07, 0.02, MESA_PE, { roughness: 0.7 })
      perna.position.set(px * 0.42, (MESA_H - 0.06) / 2, pz * 0.37)
      mesa.add(perna)
    }
  }
  // toalha: tampo de pano + abas caindo nos quatro lados
  const pano = rbox(1.1, 0.03, 1.0, 0.012, TOALHA, { roughness: 0.92 })
  pano.position.y = MESA_H
  mesa.add(pano)
  const ABA = 0.26
  for (const [w, d, x, z] of [
    [1.12, 0.025, 0, 0.5], [1.12, 0.025, 0, -0.5], [0.025, 1.02, 0.55, 0], [0.025, 1.02, -0.55, 0],
  ] as const) {
    const aba = rbox(w, ABA, d, 0.01, TOALHA, { roughness: 0.92 })
    aba.position.set(x, MESA_H - ABA / 2 + 0.01, z)
    mesa.add(aba)
  }
  // barra xadrez da toalha
  for (const z of [-0.51, 0.51]) {
    for (let k = -4; k <= 4; k += 2) {
      const q = rbox(0.11, 0.06, 0.02, 0.008, TOALHA_ESC, { roughness: 0.92 })
      q.position.set(k * 0.12, MESA_H - ABA + 0.05, z)
      mesa.add(q)
    }
  }
  // garfo e faca ao lado da travessa
  for (const [fx, cor] of [[-0.42, '#b9bec2'], [-0.36, '#b9bec2']] as const) {
    const talher = rbox(0.025, 0.012, 0.3, 0.005, cor, { roughness: 0.3, metalness: 0.7 })
    talher.position.set(fx, MESA_H + 0.022, 0.18)
    mesa.add(talher)
  }
  root.add(mesa)

  // ---- travessa oval prateada ----------------------------------------------
  const TOPO = MESA_H + 0.016
  const travessa = new THREE.Group()
  travessa.position.set(MESA.x + 0.05, GY + TOPO, MESA.z + 0.02)
  travessa.rotation.y = -0.55
  travessa.scale.setScalar(PIG_S)
  const prato = lathe(
    [[0, 0], [0.3, 0], [0.36, 0.025], [0.42, 0.055], [0.4, 0.062], [0.33, 0.035], [0.28, 0.022], [0, 0.022]],
    PRATA,
    { roughness: 0.25, metalness: 0.85 },
    48,
  )
  prato.scale.set(1, 1, 0.66)
  travessa.add(prato)
  // folhinhas de guarnição
  for (const [gx, gz] of [[-0.3, 0.1], [-0.28, -0.12], [0.3, -0.13]] as const) {
    const verde = puff(0.04, '#4f8d3c', 3, 70 + gx * 10, { roughness: 0.8 })
    verde.position.set(gx, 0.04, gz)
    verde.scale.y = 0.5
    travessa.add(verde)
  }
  root.add(travessa)

  // ---- leitão assado (orgânico): cabeça para +x local ------------------------
  const leitao = new THREE.Group()
  leitao.position.copy(travessa.position).add(new THREE.Vector3(0, 0.02, 0))
  leitao.rotation.y = travessa.rotation.y
  leitao.scale.setScalar(PIG_S)
  const lCorpo = sphere(0.17, LEITAO, { roughness: 0.4 })
  lCorpo.scale.set(1.55, 0.85, 0.95)
  lCorpo.position.set(-0.04, 0.14, 0)
  leitao.add(lCorpo)
  const lCabeca = sphere(0.12, LEITAO, { roughness: 0.4 })
  lCabeca.position.set(0.24, 0.16, 0)
  leitao.add(lCabeca)
  const lFocinho = cylinder(0.062, 0.075, 0.1, LEITAO, { roughness: 0.4 })
  lFocinho.rotation.z = Math.PI / 2
  lFocinho.position.set(0.35, 0.17, 0)
  leitao.add(lFocinho)
  const lNariz = cylinder(0.058, 0.058, 0.02, LEITAO_ESC, { roughness: 0.4 })
  lNariz.rotation.z = Math.PI / 2
  lNariz.position.set(0.405, 0.17, 0)
  leitao.add(lNariz)
  for (const s of [-1, 1]) {
    const orelha = cone(0.055, 0.1, LEITAO_ESC, { roughness: 0.45 })
    orelha.position.set(0.22, 0.27, s * 0.07)
    orelha.rotation.set(s * 0.3, 0, -0.7)
    leitao.add(orelha)
    const olho = capsule(0.01, 0.035, '#3a1e10', { roughness: 0.5 })
    olho.rotation.x = Math.PI / 2
    olho.rotation.y = 0.3
    olho.position.set(0.3, 0.205, s * 0.075)
    leitao.add(olho)
    // patinhas dobradas sob o corpo
    const frente = capsule(0.042, 0.11, LEITAO, { roughness: 0.4 })
    frente.rotation.z = Math.PI / 2
    frente.position.set(0.17, 0.05, s * 0.09)
    leitao.add(frente)
    const patraseira = capsule(0.045, 0.12, LEITAO, { roughness: 0.4 })
    patraseira.rotation.z = Math.PI / 2
    patraseira.position.set(-0.27, 0.05, s * 0.09)
    leitao.add(patraseira)
  }
  const rabo = torus(0.032, 0.012, LEITAO_ESC, { roughness: 0.45 })
  rabo.position.set(-0.31, 0.2, 0)
  rabo.rotation.y = Math.PI / 2
  leitao.add(rabo)
  root.add(leitao)

  // ---- maçã vermelha na boca do leitão -------------------------------------
  const maca = new THREE.Group()
  maca.position.copy(leitao.position).add(
    new THREE.Vector3(0.43, 0.105, 0).multiplyScalar(PIG_S).applyAxisAngle(new THREE.Vector3(0, 1, 0), leitao.rotation.y),
  )
  maca.scale.setScalar(PIG_S)
  const fruta = sphere(0.066, MACA, { roughness: 0.3 })
  fruta.scale.set(1, 0.92, 1)
  maca.add(fruta)
  const cabinho = cylinder(0.006, 0.008, 0.04, '#5a3a1e', { roughness: 0.7 })
  cabinho.position.y = 0.072
  maca.add(cabinho)
  const folhinha = sphere(0.022, '#4f8d3c', { roughness: 0.6 })
  folhinha.scale.set(1.5, 0.3, 0.8)
  folhinha.position.set(0.022, 0.08, 0)
  maca.add(folhinha)
  root.add(maca)

  // ---- cavalete de madeira clara -------------------------------------------
  const cavalete = new THREE.Group()
  cavalete.position.copy(EASEL)
  cavalete.rotation.set(EASEL_TILT, EASEL_ROT, 0, 'YXZ')
  for (const s of [-1, 1]) {
    const perna = rbox(0.065, 2.12, 0.05, 0.02, MADEIRA, { roughness: 0.65 })
    perna.position.set(s * 0.5, 1.04, 0)
    perna.rotation.z = s * 0.06
    cavalete.add(perna)
  }
  const tras = rbox(0.06, 1.95, 0.05, 0.02, MADEIRA_ESC, { roughness: 0.7 })
  tras.position.set(0, 0.95, -0.42)
  tras.rotation.x = 0.42
  cavalete.add(tras)
  const aparador = rbox(1.32, 0.05, 0.14, 0.015, MADEIRA, { roughness: 0.65 })
  aparador.position.set(0, BOARD_Y - 0.5, 0.05)
  cavalete.add(aparador)
  const travaCima = rbox(0.9, 0.05, 0.05, 0.015, MADEIRA, { roughness: 0.65 })
  travaCima.position.set(0, BOARD_Y + 0.49, -0.02)
  cavalete.add(travaCima)
  // giz e apagador no aparador
  const giz = cylinder(0.012, 0.012, 0.09, '#f2f0e8', { roughness: 0.95 })
  giz.rotation.z = Math.PI / 2
  giz.position.set(0.35, BOARD_Y - 0.465, 0.07)
  cavalete.add(giz)
  const apagador = rbox(0.14, 0.04, 0.06, 0.012, '#9a7b52', { roughness: 0.8 })
  apagador.position.set(-0.38, BOARD_Y - 0.455, 0.06)
  cavalete.add(apagador)
  root.add(cavalete)

  // ---- quadro-negro com VEGANO ---------------------------------------------
  const quadro = new THREE.Group()
  quadro.position.copy(EASEL)
  quadro.rotation.set(EASEL_TILT, EASEL_ROT, 0, 'YXZ')
  const lousaFace = new THREE.Group()
  lousaFace.position.set(0, BOARD_Y, 0.05)
  quadro.add(lousaFace)
  const moldura = rbox(1.28, 0.94, 0.05, 0.025, MOLDURA, { roughness: 0.7 })
  lousaFace.add(moldura)
  const lousa = rbox(1.16, 0.82, 0.02, 0.01, LOUSA, { roughness: 0.9, detail: 1.6 })
  lousa.position.z = 0.022
  lousaFace.add(lousa)
  const letras = new THREE.Group()
  letras.position.set(0, 0, 0.034)
  lousaFace.add(letras)
  // "pratos" do cardápio: rabiscos de giz mais fracos, sem palavras
  for (const [ly, lens] of [[0.27, [0.22, 0.14, 0.18]], [0.15, [0.16, 0.24, 0.1]], [-0.27, [0.2, 0.12, 0.2]]] as const) {
    let x = -0.42
    for (const w of lens) {
      letras.add(stroke(w, 0.022, x + w / 2, ly, 0, GIZ_FRACO))
      x += w + 0.05
    }
    letras.add(stroke(0.06, 0.022, 0.42, ly, 0, GIZ_FRACO))
  }
  const palavra: ['V' | 'E' | 'G' | 'A' | 'N' | 'O', number][] = [
    ['V', -0.425], ['E', -0.255], ['G', -0.085], ['A', 0.085], ['N', 0.255], ['O', 0.425],
  ]
  for (const [glyph, lx] of palavra) {
    const l = letter(glyph)
    l.position.set(lx, WORD_Y, 0)
    letras.add(l)
  }
  root.add(quadro)

  // ---- o RISCO de giz que corta o VEGANO (pivô na ponta esquerda) ----------
  const RISCO_L = 1.08
  const risco = new THREE.Group()
  const rAnchor = new THREE.Vector3(-RISCO_L / 2, BOARD_Y + WORD_Y - 0.05, 0.05 + 0.05)
  rAnchor.applyEuler(new THREE.Euler(EASEL_TILT, EASEL_ROT, 0, 'YXZ')).add(EASEL)
  risco.position.copy(rAnchor)
  risco.rotation.set(EASEL_TILT, EASEL_ROT, 0.1, 'YXZ')
  const tracoRisco = rbox(RISCO_L, 0.06, 0.02, 0.01, '#ffffff', {
    roughness: 0.9, emissive: '#ffffff', emissiveIntensity: 0.25,
  })
  tracoRisco.position.x = RISCO_L / 2
  risco.add(tracoRisco)
  root.add(risco)

  // ---- curupira (person) ---------------------------------------------------
  const curupira = person({ body: PELE, skin: PELE, height: 1.5, armAngle: 0.35 })
  curupira.position.copy(CUR)
  curupira.rotation.y = CUR_ROT
  curupira.scale.setScalar(CUR_S)
  const HR = 1.5 * 0.19

  // tanga de folhas na cintura
  const tanga = new THREE.Group()
  tanga.position.y = 0.3
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const folha = sphere(0.075, i % 2 === 0 ? FOLHA : FOLHA_CLARA, { roughness: 0.7 })
    folha.scale.set(0.58, 1.35, 0.24)
    folha.position.set(Math.sin(a) * 0.262, -0.03, Math.cos(a) * 0.262)
    folha.rotation.set(0.2, a, 0, 'YXZ')
    tanga.add(folha)
  }
  const cinto = torus(0.258, 0.022, '#6b4a2a', { roughness: 0.85 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.04
  tanga.add(cinto)
  curupira.add(tanga)

  // pés VIRADOS PRA TRÁS: calcanhar na frente, dedos atrás
  for (const s of [-1, 1]) {
    const pe = sphere(0.115, PELE, { roughness: 0.6 })
    pe.scale.set(0.85, 0.52, 2.3)
    pe.position.set(s * 0.12, 0.055, -0.26)
    curupira.add(pe)
    const calcanhar = sphere(0.062, PELE_ESC, { roughness: 0.6 })
    calcanhar.position.set(s * 0.12, 0.06, 0.17)
    curupira.add(calcanhar)
    for (let d = 0; d < 4; d++) {
      const dedo = sphere(0.038, PELE_ESC, { roughness: 0.6 })
      dedo.position.set(s * 0.12 + (d - 1.5) * 0.05, 0.04, -0.5 + Math.abs(d - 1.5) * 0.025)
      curupira.add(dedo)
      const unha = sphere(0.022, '#d9d2a8', { roughness: 0.4 })
      unha.scale.set(1, 0.45, 0.9)
      unha.position.copy(dedo.position).add(new THREE.Vector3(0, 0.03, -0.012))
      curupira.add(unha)
    }
  }

  // cabeça: sobrancelhas bravas, boca berrando, orelhas pontudas
  const cabeca = curupira.getObjectByName('head') as THREE.Group
  for (const s of [-1, 1]) {
    const sobr = rbox(0.13, 0.034, 0.04, 0.015, '#2f3a17', { roughness: 0.7 })
    sobr.position.set(s * 0.105, HR * 0.4, HR * 0.86)
    sobr.rotation.set(-0.2, s * 0.3, s * 0.38)
    cabeca.add(sobr)
    const orelha = cone(0.05, 0.13, PELE, { roughness: 0.6 })
    orelha.position.set(s * HR * 0.95, 0.03, -0.02)
    orelha.rotation.z = -s * 1.15
    cabeca.add(orelha)
  }
  const boca = sphere(0.062, '#3a1414', { roughness: 0.6 })
  boca.scale.set(1.25, 0.95, 0.5)
  boca.position.set(0, -HR * 0.42, HR * 0.84)
  cabeca.add(boca)
  const lingua = sphere(0.03, '#c55a5a', { roughness: 0.5 })
  lingua.scale.set(1.4, 0.6, 0.6)
  lingua.position.set(0, -HR * 0.52, HR * 0.86)
  cabeca.add(lingua)
  root.add(curupira)

  // ---- cabeleira de fogo (filha da cabeça; sobe a partir do couro) ----------
  const cabelo = new THREE.Group()
  cabelo.position.set(0, HR * 0.45, -0.02)
  cabeca.add(cabelo)
  const fogoMat = (c: string, k: number) => mat(c, { emissive: c, emissiveIntensity: k, roughness: 0.5 })
  const touca = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.02, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), fogoMat(FOGO_A, 0.35))
  touca.position.y = -HR * 0.38
  touca.rotation.x = -0.3
  cabelo.add(touca)
  const chamas: [number, number, number, number, number, string, number][] = [
    // x, z, altura, raio, inclinação, cor, brilho
    [0, -0.02, 0.62, 0.15, 0, FOGO_A, 0.4],
    [-0.14, 0.02, 0.46, 0.12, 0.35, FOGO_A, 0.4],
    [0.14, 0.02, 0.48, 0.12, -0.35, FOGO_A, 0.4],
    [-0.08, -0.12, 0.5, 0.12, 0.2, FOGO_A, 0.4],
    [0.09, -0.12, 0.52, 0.12, -0.2, FOGO_A, 0.4],
    [-0.22, -0.06, 0.3, 0.09, 0.6, FOGO_B, 0.5],
    [0.22, -0.06, 0.3, 0.09, -0.6, FOGO_B, 0.5],
    [0, 0.1, 0.42, 0.1, -0.1, FOGO_B, 0.55],
    [-0.06, 0.04, 0.4, 0.08, 0.15, FOGO_C, 0.7],
    [0.07, 0.0, 0.34, 0.07, -0.18, FOGO_C, 0.7],
  ]
  for (const [x, z, h, r, inc, c, k] of chamas) {
    // língua de fogo em gota: barriga larga embaixo, ponta fina em cima
    const perfil = [[0, 0], [r * 0.7, 0.05 * h], [r, 0.2 * h], [r * 0.86, 0.42 * h], [r * 0.48, 0.7 * h], [r * 0.14, 0.92 * h], [0, h]]
      .map(([px, py]) => new THREE.Vector2(px, py))
    const chama = new THREE.Mesh(new THREE.LatheGeometry(perfil, 24), fogoMat(c, k))
    chama.position.set(x, 0.02, z)
    chama.rotation.z = inc
    chama.rotation.x = z < -0.05 ? -0.2 : z > 0.05 ? 0.15 : 0
    chama.castShadow = true
    cabelo.add(chama)
  }

  // ---- mancha roxa na canela -------------------------------------------------
  const mancha = new THREE.Group()
  mancha.position.set(Math.sin(-0.95) * 0.215, 0.135, Math.cos(-0.95) * 0.215)
  mancha.rotation.set(0.35, -0.95, 0, 'YXZ')
  curupira.add(mancha)
  for (const [mx, my, mr, c] of [[0, 0, 0.055, ROXO], [0.03, -0.025, 0.04, '#55306f'], [-0.025, 0.02, 0.03, '#8d62b0']] as const) {
    const m = sphere(mr, c, { roughness: 0.6 })
    m.scale.z = 0.2
    m.position.set(mx, my, 0.004)
    mancha.add(m)
  }

  // ---- braço direito: aponta o quadro --------------------------------------
  const bracoR = curupira.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  const HAND_Y = -1.5 * 0.52 * 0.32 - 0.19 * 1.5
  const dedo = capsule(0.028, 0.1, PELE, { roughness: 0.6 })
  dedo.position.set(0, HAND_Y - 0.11, 0.0)
  bracoR.add(dedo)
  bracoR.rotation.set(...APONTA)

  // ---- braço esquerdo: bisnaga de arnica -----------------------------------
  const bracoL = curupira.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoL, 1.5)
  bracoL.rotation.set(...ARNICA_POSE)
  const arnica = new THREE.Group()
  arnica.position.set(0.0, HAND_Y - 0.02, 0.07)
  arnica.rotation.set(1.25, 0, 0.35)
  bracoL.add(arnica)
  const tubo = lathe(
    [[0, -0.16], [0.06, -0.16], [0.064, -0.1], [0.056, 0.06], [0.04, 0.13], [0.025, 0.145], [0.024, 0.16], [0, 0.16]],
    ARNICA,
    { roughness: 0.35 },
  )
  tubo.scale.set(1, 1, 0.65)
  arnica.add(tubo)
  const dobra = rbox(0.14, 0.03, 0.026, 0.008, '#d2a92e', { roughness: 0.4 })
  dobra.position.y = -0.17
  arnica.add(dobra)
  const tampa = cylinder(0.036, 0.036, 0.065, TAMPA, { roughness: 0.4 })
  tampa.position.y = 0.19
  arnica.add(tampa)
  const rotulo = rbox(0.08, 0.1, 0.01, 0.008, '#ffffff', { roughness: 0.5 })
  rotulo.position.set(0, -0.02, 0.04)
  arnica.add(rotulo)
  const flor = sphere(0.02, '#f08a24', { roughness: 0.5 })
  flor.position.set(0, -0.015, 0.047)
  flor.scale.z = 0.4
  arnica.add(flor)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'rodizio', object: base },
    { name: 'mesa', group: 'rodizio', object: mesa },
    { name: 'curupira', group: 'curupira', object: curupira },
    { name: 'mancha', group: 'curupira', object: mancha },
    { name: 'bracoL', group: 'arnica', object: bracoL },
    { name: 'arnica', group: 'arnica', object: arnica },
    { name: 'travessa', group: 'leitao', object: travessa },
    { name: 'leitao', group: 'leitao', object: leitao },
    { name: 'maca', group: 'leitao', object: maca },
    { name: 'cavalete', group: 'quadro', object: cavalete },
    { name: 'quadro', group: 'quadro', object: quadro },
    { name: 'risco', group: 'risco', object: risco },
    { name: 'cabelo', group: 'indignado', object: cabelo },
    { name: 'bracoR', group: 'indignado', object: bracoR },
  ]

  // ---- montagem ------------------------------------------------------------
  const MACA_Y = maca.position.y
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Arrastaram o curupira, guardião dos bichos da mata, pra um RODÍZIO…',
    }),
    seq('mesa-rise', 'mesa', 0.25, 0.8, [riseFrom(MESA.y, 1.2)], { ease: 'easeOut' }),

    seq('curupira-entra', 'curupira', 1.5, 0.8, [
      riseFrom(CUR.y, 2.2), ch('rotation.y', CUR_ROT - 0.5, CUR_ROT),
    ], {
      ease: 'easeOut',
      caption: 'Com os PÉS VIRADOS PRA TRÁS, ele tropeça logo na porta…',
    }),
    seq('curupira-tropeca', 'curupira', 2.4, 0.35, [ch('rotation.z', 0, -0.2)], { ease: 'easeOut' }),
    seq('curupira-recupera', 'curupira', 2.75, 0.4, [ch('rotation.z', -0.2, 0)], { ease: 'easeIn' }),
    seq('bracoR-repouso', 'bracoR', 1.5, 0.6, [
      ch('rotation.x', 0, 0), ch('rotation.y', 0, 0), ch('rotation.z', -0.35, -0.35),
    ]),
    seq('bracoL-repouso', 'bracoL', 1.5, 0.6, [
      ch('rotation.x', 0, 0), ch('rotation.z', 0.35, 0.35),
    ]),
    seq('cabelo-acende', 'cabelo', 1.75, 0.6, [
      ch('scale.x', 0.6, 0.6), ch('scale.y', 0.01, 0.45), ch('scale.z', 0.6, 0.6),
    ], { ease: 'easeOut' }),
    seq('mancha-surge', 'mancha', 3.1, 0.45, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut', caption: '…e rala a canela: fica uma MANCHA ROXA.' }),

    seq('bracoL-ergue', 'bracoL', 4.0, 0.6, [
      ch('rotation.x', 0, ARNICA_POSE[0]), ch('rotation.z', 0.35, ARNICA_POSE[2]),
    ], {
      ease: 'easeOut',
      caption: 'Entra esfregando ÁRNICA, bufando de dor: RRÁR-NI!',
    }),
    seq('arnica-surge', 'arnica', 4.15, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('arnica-esfrega', 'arnica', 4.7, 0.5, [ch('rotation.z', 0.75, 0.35)], { ease: 'easeInOut' }),

    seq('travessa-pousa', 'travessa', 5.6, 0.6, [
      ch('position.y', travessa.position.y + 0.9, travessa.position.y),
      ch('scale.x', 0.01, PIG_S), ch('scale.y', 0.01, PIG_S), ch('scale.z', 0.01, PIG_S),
    ], {
      ease: 'easeOut',
      caption: 'Na mesa pousa um LEITÃO ASSADO de maçã na boca — vizinho dele lá do mato!',
    }),
    seq('leitao-pousa', 'leitao', 5.75, 0.6, [
      ch('position.y', leitao.position.y + 0.9, leitao.position.y),
      ch('scale.x', 0.01, PIG_S), ch('scale.y', 0.01, PIG_S), ch('scale.z', 0.01, PIG_S),
    ], { ease: 'easeOut' }),
    seq('maca-encaixa', 'maca', 6.3, 0.4, [
      ch('position.y', MACA_Y + 0.35, MACA_Y),
      ch('scale.x', 0.01, PIG_S), ch('scale.y', 0.01, PIG_S), ch('scale.z', 0.01, PIG_S),
    ], { ease: 'easeIn' }),

    seq('cavalete-rise', 'cavalete', 7.2, 0.7, [riseFrom(EASEL.y, 2.4)], {
      ease: 'easeOut',
      caption: 'Desesperado, ele procura no quadro de giz a única opção sem bicho: o prato VEGANO…',
    }),
    seq('quadro-rise', 'quadro', 7.35, 0.7, [riseFrom(EASEL.y, 2.4)], { ease: 'easeOut' }),

    seq('risco-traca', 'risco', 8.6, 0.45, [ch('scale.x', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…e ele TÁ RISCADO! Um traço de giz bem no meio.',
    }),

    seq('cabelo-sobe', 'cabelo', 9.6, 0.6, [
      ch('scale.x', 0.6, 1), ch('scale.y', 0.45, 1), ch('scale.z', 0.6, 1),
    ], {
      ease: 'easeOut',
      caption: 'O cabelo de fogo sobe meio metro e ele aponta: RRÁR-NI… NÔT… VÊ-GA… TÁÁ-RISC-T?!',
    }),
    seq('braco-aponta', 'bracoR', 9.7, 0.5, [
      ch('rotation.x', 0, APONTA[0]), ch('rotation.y', 0, APONTA[1]), ch('rotation.z', -0.35, APONTA[2]),
    ], { ease: 'easeOut' }),
    seq('curupira-pula', 'curupira', 9.65, 0.25, [ch('position.y', CUR.y, CUR.y + 0.12)], { ease: 'easeOut' }),
    seq('curupira-desce', 'curupira', 9.9, 0.25, [ch('position.y', CUR.y + 0.12, CUR.y)], { ease: 'easeIn' }),

    seq('risco-pisca', 'risco', 11.0, 0.5, [ch('scale.y', 1.4, 1)], {
      caption: 'Har ni något vegetariskt? — Vocês têm alguma coisa vegetariana?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.15, 5.0], target: [0.05, 1.28, -0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'har-ni-nagot-vegetariskt',
    contexto:
      "Restaurante: no balcão do almoço do dia (dagens lunch), na cantina do trabalho ou numa festa com bufê. Muito cardápio sueco já traz a linha 'Dagens vegetariska' — mas nem sempre está à vista. O molde 'Har ni något ___?' serve pra tudo: 'glutenfritt', 'laktosfritt'.",
    fraseFonte: 'Vocês têm alguma coisa vegetariana?',
    fraseAlvo: 'Har ni något vegetariskt?',
    pronuncia:
      "rrar ni nôt ve-ge-TÁÁ-riskt? ('har' com h soprado e R brando; 'ni' = vocês, I limpo e sem força; 'något' na fala vira 'nåt' = NÔT, Ô fechado e sem força; 'vegetariskt' com G DURO de 'gato' — nunca o J de 'vegetariano' —, as duas primeiras sílabas leves e rápidas, a força no TÁ com A longo, R de um toque só, e o -skt final seco, sem vogal: o -t é obrigatório depois de 'något')",
    ponteSonora:
      "RRÁR-NI... NÔT... VÊ-GA... TÁÁ-RISC-T?! (7 sílabas: rrar-ni-nôt-ve-ge-TÁÁ-riskt; a força toda no TÁÁ; RRÁR-NI = a ÁRNICA sem o -ca, o MESMO de 'Har ni något receptfritt mot det här?' e 'Har ni den i en annan storlek?' — h SOPRADO na frente, como RR carioca leve, A longo e R brando colado no NI; NÔT = o 'nåt' de 'något', o MESMO da farmácia e da bruxa de 'Vill du ha något att dricka?': Ô BEM FECHADO de 'avô', curto e sem força — com bico de ö vira 'nöt', noz; VÊ-GA = o VEGANO cortado antes do -NO, e com o G DURO de 'gato' — é exatamente o G que o sueco usa aqui; a armadilha é o 'vegetariano' português, com J; no vegano a força caía no GA, aqui NÃO: as duas sílabas correm fraquinhas, e o GA sai apagado, quase GUE; TÁÁ-RISC = o 'TÁ RISCADO!' indignado do curupira dito como UMA palavra só, sem respiro entre o TÁ e o RISC: assim o R cai ENTRE vogais e sai brando, um toque só, de 'caro' — separado ('tá... riscado') ele estoura no RR de 'rua', que aqui o sueco não tem; o TÁÁ vem esticado e com TODA a força da frase — é aí que o sueco bate, vege-TÁÁ-riskt, nunca 'vegeta-RÍS'; do RISCADO só fica o RISC, fraquinho: I curto, S de cobra e K seco; T = o giz que para seco no fim do risco: é o -t do neutro, obrigatório depois de 'något' (o mesmo -T de 'Det är kallt'); nada de vogal no fim — nunca 'ris-ki-tchi')",
    historia:
      'Arrastaram o curupira, guardião dos bichos da mata, pra um rodízio. Com os pés virados pra trás, ele tropeça logo na porta, rala a canela e entra esfregando ÁRNICA, bufando de dor: RRÁR-NI! Na mesa pousa um leitão assado de maçã na boca — vizinho dele lá do mato. Desesperado, ele procura no quadro de giz a ÚNICA opção sem bicho, o prato VEGANO — e ela TÁ RISCADA, com um traço de giz bem no meio! O cabelo de fogo sobe meio metro e ele aponta o quadro, indignado, num fôlego só: RRÁR-NI... NÔT... VÊ-GA... TÁÁÁ-RISC-T?! Vocês têm alguma coisa vegetariana?',
  },
  createScene,
  refine: { organic: ['leitao'] },
}

export default card
