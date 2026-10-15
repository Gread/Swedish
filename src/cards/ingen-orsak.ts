import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Ingen orsak!" — ÍNG-EN? ÚÚÚ-XAK!
 *
 * O lobo mau se aposentou e virou ENFERMEIRO da floresta (touca branca com
 * cruz vermelha). A joaninha chega deitada no toco-maca com uma ÍNGUA roxa
 * brotando do casco (ÍNG-EN?). O lobo enche o peito e UIVA pra lua (ÚÚÚ) — e
 * corta o próprio uivo com uma tesourada: XAK! A íngua murcha num puf.
 *
 * Diorama: clareira de grama escura à noite, pinheiros ao fundo, lua crescente
 * no alto à esquerda; toco-maca de lençol branco à esquerda com a joaninha;
 * lobo cinza GRANDE sentado à direita, de perfil uivando para a lua, a tesoura
 * prateada aberta atravessando os anéis do uivo.
 */

const GRAMA = '#2c4a35'
const GRAMA_CLARA = '#3d6446'
const GRAMA_TUFO = '#4b7a50'
const TERRA = '#3b2d22'
const PINHO = '#1f3a2e'
const PINHO_CLARO = '#2b4d3b'
const CASCA = '#6e4a2e'
const CASCA_ESC = '#523521'
const LENCOL = '#f1efe8'
const LENCOL_SOMBRA = '#dcd8cc'
const JOANINHA = '#d2322b'
const PRETO = '#1c1a1f'
const INGUA = '#a23fe0' // acento reservado: a ÍNGUA (ÍNG-EN)
const INGUA_CLARA = '#c07af0'
const LOBO = '#8b919b'
const LOBO_ESC = '#626872'
const LOBO_CLARO = '#cfd2d8'
const BOCA = '#4a1d27'
const LINGUA = '#d9707f'
const TOUCA = '#f8f7f3'
const CRUZ = '#d8353a'
const PRATA = '#cdd5de'
const LUA = '#f4d873'
const UIVO = '#d6e6ff'

const FY = 0.14 // topo da grama
const TOCO: [number, number] = [-1.0, 0.42] // toco-maca (x, z)
const TY = FY + 0.55 // topo do toco
const JY = TY + 0.08 // joaninha deitada sobre o lençol
const LOBO_POS: [number, number] = [0.78, -0.2]
const LOBO_ROT = -0.85
const CABECA_Y = 1.64
const CABECA_Z = 0.2
// pose da cabeça: examinando a joaninha (meio do clipe) e uivando (final)
const EXAME_X = 0.38
const EXAME_Y = -0.4
const UIVO_X = -0.72
const UIVO_Y = -0.7
const ABERTA = 0.3 // abertura de cada lâmina da tesoura (rad)

/** Malha avulsa com sombra, no material padrão do app. */
function malha(geo: THREE.BufferGeometry, color: string, opts: Parameters<typeof mat>[1] = {}) {
  const m = new THREE.Mesh(geo, mat(color, opts))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Lua crescente extrudada: arco externo + arco interno deslocado (pontas finas). */
function crescente(r: number, depth: number) {
  const a0 = (70 * Math.PI) / 180
  const tipX = Math.cos(a0) * r
  const tipY = Math.sin(a0) * r
  const cx = r * 0.56
  const r2 = Math.hypot(tipX - cx, tipY)
  const aTop = Math.atan2(tipY, tipX - cx)
  const aBot = Math.atan2(-tipY, tipX - cx)
  const s = new THREE.Shape()
  s.moveTo(tipX, tipY)
  s.absarc(0, 0, r, a0, Math.PI * 2 - a0, false)
  s.absarc(cx, 0, r2, aBot, aTop, true)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.35,
    bevelSize: r * 0.06,
    bevelSegments: 4,
    curveSegments: 40,
  })
  geo.translate(0, 0, -depth / 2)
  return geo
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- clareira: grama escura, pinheiros, tufos, pedras, vaga-lumes ---------
  const base = new THREE.Group()

  const terra = cylinder(2.62, 2.7, 0.1, TERRA, { roughness: 0.9 })
  terra.position.y = 0.05
  base.add(terra)

  const grama = cylinder(2.58, 2.6, 0.05, GRAMA, { roughness: 0.95 })
  grama.position.y = 0.115
  base.add(grama)

  const clareira = cylinder(1.7, 1.75, 0.012, GRAMA_CLARA, { roughness: 0.95 })
  clareira.position.set(-0.1, FY + 0.003, 0.2)
  base.add(clareira)

  // tufos de capim (3 lâminas cada), longe do centro
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.55 + rand() * 0.85
    const tx = Math.cos(a) * d
    const tz = Math.sin(a) * d
    const tufo = new THREE.Group()
    tufo.position.set(tx, FY, tz)
    for (let k = 0; k < 3; k++) {
      const h = 0.16 + rand() * 0.12
      const lamina = cone(0.035, h, k === 1 ? GRAMA_TUFO : GRAMA_CLARA, { roughness: 0.9 }, 8)
      lamina.position.set((k - 1) * 0.045, h / 2, (rand() - 0.5) * 0.04)
      lamina.rotation.z = (k - 1) * 0.35
      tufo.add(lamina)
    }
    base.add(tufo)
  }

  // pinheiros ao fundo
  for (const [px, pz, h] of [[-2.05, -1.25, 1.9], [-1.25, -1.95, 2.3], [2.0, -1.35, 2.0], [1.15, -2.05, 1.6]] as const) {
    const pinho = new THREE.Group()
    pinho.position.set(px, FY, pz)
    const tronco = cylinder(0.07, 0.1, 0.4, CASCA_ESC, { roughness: 0.85 })
    tronco.position.y = 0.2
    pinho.add(tronco)
    for (let k = 0; k < 3; k++) {
      const r = (0.55 - k * 0.13) * (h / 2)
      const ch2 = h * (0.42 - k * 0.06)
      const copa = cone(r, ch2, k % 2 ? PINHO_CLARO : PINHO, { roughness: 0.85 }, 10)
      copa.position.y = 0.3 + k * h * 0.22 + ch2 / 2
      pinho.add(copa)
    }
    pinho.rotation.y = rand() * Math.PI
    base.add(pinho)
  }

  // pedras e cogumelos
  for (const [rx, rz, rr, sd] of [[1.85, 0.75, 0.17, 3], [-2.1, 0.45, 0.14, 5], [-0.3, 1.95, 0.12, 9]] as const) {
    const pedra = rock(rr, '#666d76', sd, { roughness: 0.8 })
    pedra.position.set(rx, FY + rr * 0.45, rz)
    base.add(pedra)
  }
  for (const [mx, mz, ms] of [[-1.85, 1.2, 1], [-1.65, 1.38, 0.7], [2.15, 0.15, 0.85]] as const) {
    const cogu = new THREE.Group()
    cogu.position.set(mx, FY, mz)
    cogu.scale.setScalar(ms)
    const pe = cylinder(0.035, 0.045, 0.14, '#efe6d2', { roughness: 0.7 })
    pe.position.y = 0.07
    cogu.add(pe)
    const chapeu = lathe([[0, 0.12], [0.11, 0.12], [0.12, 0.15], [0.08, 0.2], [0, 0.215]], '#c9a06b', { roughness: 0.6 })
    cogu.add(chapeu)
    base.add(cogu)
  }

  // maleta de primeiros socorros do lobo, no chão
  const maleta = new THREE.Group()
  maleta.position.set(1.75, FY, 1.0)
  maleta.rotation.y = -0.5
  const caixa = rbox(0.42, 0.28, 0.22, 0.05, TOUCA, { roughness: 0.5 })
  caixa.position.y = 0.14
  maleta.add(caixa)
  const alca = torus(0.08, 0.018, '#7c828c', { roughness: 0.4 })
  alca.position.y = 0.3
  maleta.add(alca)
  for (const [w, h] of [[0.14, 0.04], [0.04, 0.14]] as const) {
    const traco = rbox(w, h, 0.02, 0.008, CRUZ, { roughness: 0.5 })
    traco.position.set(0, 0.15, 0.115)
    maleta.add(traco)
  }
  base.add(maleta)

  // vaga-lumes
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.4 + rand() * 1.0
    const v = sphere(0.025, '#f2ff9a', { emissive: '#e8ff6a', emissiveIntensity: 1.6 }, 10)
    v.position.set(Math.cos(a) * d, FY + 0.35 + rand() * 0.9, Math.sin(a) * d - 0.3)
    base.add(v)
  }

  root.add(base)

  // ---- lua crescente + estrelas ---------------------------------------------
  const lua = new THREE.Group()
  lua.position.set(-1.35, 2.75, -1.2)
  lua.rotation.set(0, 0.25, -0.35)
  const crescenteM = malha(crescente(0.46, 0.12), LUA, {
    roughness: 0.6, emissive: '#f0c850', emissiveIntensity: 0.55, size: 0.9,
  })
  lua.add(crescenteM)
  for (const [sx, sy, sr] of [[0.75, 0.35, 0.05], [1.1, -0.15, 0.035], [-0.55, 0.55, 0.04], [0.4, 0.8, 0.03]] as const) {
    const estrela = sphere(sr, '#fff7d6', { emissive: '#fff0b0', emissiveIntensity: 1.5 }, 12)
    estrela.position.set(sx, sy, -0.05)
    lua.add(estrela)
  }
  root.add(lua)

  // ---- toco-maca ------------------------------------------------------------
  const toco = new THREE.Group()
  toco.position.set(TOCO[0], FY, TOCO[1])
  const tronco = lathe(
    [[0, 0], [0.6, 0], [0.55, 0.05], [0.5, 0.13], [0.47, 0.28], [0.47, 0.5], [0.49, 0.55], [0, 0.55]],
    CASCA,
    { roughness: 0.85 },
  )
  toco.add(tronco)
  // raízes
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3
    const raiz = capsule(0.07, 0.22, CASCA_ESC, { roughness: 0.85 })
    raiz.position.set(Math.cos(a) * 0.55, 0.05, Math.sin(a) * 0.55)
    raiz.rotation.set(0, -a, Math.PI / 2 - 0.35)
    toco.add(raiz)
  }
  // sulcos da casca
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2
    const sulco = rbox(0.035, 0.3, 0.03, 0.012, CASCA_ESC, { roughness: 0.9 })
    sulco.position.set(Math.cos(a) * 0.47, 0.3, Math.sin(a) * 0.47)
    sulco.rotation.y = -a
    toco.add(sulco)
  }
  root.add(toco)

  // ---- lençol branco sobre o toco -------------------------------------------
  const lencol = new THREE.Group()
  lencol.position.set(TOCO[0], TY, TOCO[1])
  lencol.rotation.y = 0.15
  const pano = lathe(
    [
      [0, 0.008], [0.5, 0.008], [0.525, -0.04], [0.54, -0.135], [0.585, -0.205],
      [0.6, -0.2], [0.56, -0.13], [0.545, -0.04], [0.52, 0.02], [0.46, 0.035], [0, 0.035],
    ],
    LENCOL,
    { roughness: 0.92 },
    48,
  )
  lencol.add(pano)
  // bainha costurada na barra
  const bainha = torus(0.595, 0.012, LENCOL_SOMBRA, { roughness: 0.9 })
  bainha.rotation.x = Math.PI / 2
  bainha.position.y = -0.2
  lencol.add(bainha)
  root.add(lencol)

  // ---- joaninha deitada (cabeça no travesseiro, olhando o lobo) -------------
  const joaninha = new THREE.Group()
  joaninha.position.set(TOCO[0], JY, TOCO[1])
  joaninha.rotation.y = 0.9
  joaninha.scale.setScalar(1.3)

  const ventre = sphere(0.25, PRETO, { roughness: 0.5 })
  ventre.scale.set(1, 0.38, 1.25)
  ventre.position.y = 0.06
  joaninha.add(ventre)

  const SHELL_C = new THREE.Vector3(0, 0.1, -0.03)
  const SHELL_R = new THREE.Vector3(0.29, 0.18, 0.35)
  const casco = sphere(1, JOANINHA, { roughness: 0.3, size: 0.6 })
  casco.scale.copy(SHELL_R)
  casco.position.copy(SHELL_C)
  joaninha.add(casco)

  // pintas sobre o casco (normal do elipsoide orienta cada uma)
  const zUp = new THREE.Vector3(0, 0, 1)
  for (const [u, v] of [[0.55, 0.5], [-0.55, 0.5], [0.75, -0.15], [-0.75, -0.15], [0.45, -0.75], [-0.45, -0.75]] as const) {
    const n = new THREE.Vector3(Math.sin(u) * Math.cos(v * 0.9), Math.cos(u) * 0.9, Math.sin(v))
    n.normalize()
    const p = new THREE.Vector3(n.x * SHELL_R.x, n.y * SHELL_R.y, n.z * SHELL_R.z).add(SHELL_C)
    const normal = new THREE.Vector3(n.x / SHELL_R.x, n.y / SHELL_R.y, n.z / SHELL_R.z).normalize()
    const pinta = sphere(0.055, PRETO, { roughness: 0.35 }, 16)
    pinta.scale.set(1, 1, 0.3)
    pinta.position.copy(p)
    pinta.quaternion.setFromUnitVectors(zUp, normal)
    joaninha.add(pinta)
  }
  // risca entre as asas (arco sobre o topo do casco)
  const risca = malha(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        Array.from({ length: 9 }, (_, i) => {
          const t = 0.2 + (i / 8) * (Math.PI - 0.4)
          return new THREE.Vector3(0, SHELL_C.y + Math.sin(t) * (SHELL_R.y + 0.004), SHELL_C.z - Math.cos(t) * (SHELL_R.z + 0.004))
        }),
      ),
      24, 0.012, 6, false,
    ),
    PRETO,
    { roughness: 0.4, size: 0.6 },
  )
  joaninha.add(risca)

  const cabecaJ = sphere(0.13, PRETO, { roughness: 0.45 })
  cabecaJ.scale.set(1.1, 0.9, 1)
  cabecaJ.position.set(0, 0.11, 0.36)
  joaninha.add(cabecaJ)
  for (const side of [-1, 1]) {
    const esclera = sphere(0.052, '#ffffff', { roughness: 0.25 }, 16)
    esclera.position.set(side * 0.06, 0.15, 0.45)
    esclera.scale.z = 0.7
    const pupila = sphere(0.026, '#111111', { roughness: 0.2 }, 12)
    pupila.position.set(side * 0.055, 0.17, 0.485)
    joaninha.add(esclera, pupila)

    const antena = capsule(0.012, 0.13, PRETO, { roughness: 0.4 })
    antena.position.set(side * 0.06, 0.26, 0.4)
    antena.rotation.set(-0.45, 0, -side * 0.45)
    const ponta = sphere(0.026, PRETO, { roughness: 0.4 }, 12)
    ponta.position.y = 0.08
    antena.add(ponta)
    joaninha.add(antena)

    for (let k = 0; k < 3; k++) {
      const perna = capsule(0.016, 0.07, PRETO, { roughness: 0.5 })
      perna.position.set(side * 0.26, 0.04, 0.14 - k * 0.15)
      perna.rotation.z = side * 1.25
      joaninha.add(perna)
    }
  }
  root.add(joaninha)

  // ---- ÍNGUA roxa brotando do casco (peça: incha e murcha) ------------------
  const ingua = new THREE.Group()
  ingua.position.set(0.03, SHELL_C.y + SHELL_R.y - 0.03, -0.08)
  ingua.scale.set(0.62, 0.42, 0.62) // pose final: murcha, amassada
  const bolha = sphere(0.2, INGUA, { roughness: 0.4 })
  bolha.position.y = 0.15
  bolha.scale.set(1, 0.92, 1)
  ingua.add(bolha)
  const caroco = sphere(0.1, INGUA_CLARA, { roughness: 0.4 })
  caroco.position.set(0.1, 0.25, 0.07)
  ingua.add(caroco)
  const carocoB = sphere(0.08, INGUA_CLARA, { roughness: 0.4 })
  carocoB.position.set(-0.1, 0.2, 0.09)
  ingua.add(carocoB)
  const raizIngua = sphere(0.12, INGUA, { roughness: 0.4 })
  raizIngua.scale.set(1.2, 0.5, 1.2)
  raizIngua.position.y = 0.02
  ingua.add(raizIngua)
  joaninha.add(ingua)

  // ---- LOBO cinza sentado ---------------------------------------------------
  const lobo = new THREE.Group()
  lobo.position.set(LOBO_POS[0], FY, LOBO_POS[1])
  lobo.rotation.y = LOBO_ROT

  const quadril = sphere(0.44, LOBO, { roughness: 0.88 })
  quadril.scale.set(1.05, 0.85, 1.15)
  quadril.position.set(0, 0.38, -0.14)
  lobo.add(quadril)

  const tronco2 = capsule(0.34, 0.6, LOBO, { roughness: 0.88 })
  tronco2.position.set(0, 0.98, 0.02)
  tronco2.rotation.x = 0.16
  lobo.add(tronco2)

  const dorso = sphere(0.3, LOBO_ESC, { roughness: 0.9 })
  dorso.scale.set(1, 1.5, 0.8)
  dorso.position.set(0, 0.95, -0.16)
  lobo.add(dorso)

  const peito = sphere(0.27, LOBO_CLARO, { roughness: 0.9 })
  peito.scale.set(1.0, 1.35, 0.7)
  peito.position.set(0, 1.02, 0.25)
  lobo.add(peito)

  const pescoco = capsule(0.23, 0.22, LOBO, { roughness: 0.88 })
  pescoco.position.set(0, 1.42, 0.12)
  pescoco.rotation.x = 0.35
  lobo.add(pescoco)

  const juba = puff(0.25, LOBO_CLARO, 6, 17, { roughness: 0.92 })
  juba.position.set(0, 1.32, 0.24)
  juba.scale.set(1.15, 1, 0.8)
  lobo.add(juba)

  for (const side of [-1, 1]) {
    const coxa = sphere(0.27, LOBO, { roughness: 0.88 })
    coxa.scale.set(0.75, 1, 1.15)
    coxa.position.set(side * 0.31, 0.3, 0.02)
    lobo.add(coxa)

    const pe = capsule(0.085, 0.22, LOBO_ESC, { roughness: 0.88 })
    pe.rotation.x = Math.PI / 2
    pe.position.set(side * 0.33, 0.085, 0.3)
    lobo.add(pe)
  }

  // pata da frente esquerda (lado de trás) apoiada no chão
  const pernaE = capsule(0.085, 0.6, LOBO, { roughness: 0.88 })
  pernaE.position.set(-0.2, 0.42, 0.34)
  lobo.add(pernaE)
  const pataE = sphere(0.1, LOBO_ESC, { roughness: 0.88 })
  pataE.scale.set(1, 0.6, 1.35)
  pataE.position.set(-0.2, 0.06, 0.4)
  lobo.add(pataE)

  // braço direito (lado da câmera) erguido segurando a tesoura
  const OMBRO = new THREE.Vector3(0.27, 1.2, 0.22)
  const PAW = new THREE.Vector3(-0.1, 1.72, 0.98)
  const braco = new THREE.Group()
  braco.position.copy(OMBRO)
  const dirBraco = PAW.clone().sub(OMBRO)
  const lenBraco = dirBraco.length()
  braco.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirBraco.normalize())
  const antebraco = capsule(0.09, lenBraco - 0.1, LOBO, { roughness: 0.88 })
  antebraco.position.y = -lenBraco / 2
  braco.add(antebraco)
  const pataD = sphere(0.11, LOBO_ESC, { roughness: 0.88 })
  pataD.scale.set(1, 1.15, 0.9)
  pataD.position.y = -lenBraco
  braco.add(pataD)
  lobo.add(braco)

  // rabo peludo enrolado no chão
  const rabo = capsule(0.12, 0.5, LOBO, { roughness: 0.9 })
  rabo.position.set(0.45, 0.14, -0.38)
  rabo.rotation.set(0, -0.5, Math.PI / 2)
  lobo.add(rabo)
  const ponteira = sphere(0.13, LOBO_CLARO, { roughness: 0.9 })
  ponteira.scale.set(1.3, 0.9, 0.9)
  ponteira.position.set(0.72, 0.14, -0.2)
  lobo.add(ponteira)

  root.add(lobo)

  // ---- cabeça do lobo (peça: examina a joaninha, depois uiva pro alto) ------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, CABECA_Y, CABECA_Z)
  cabeca.rotation.set(UIVO_X, UIVO_Y, 0, 'YXZ')
  cabeca.scale.setScalar(1.22)
  lobo.add(cabeca)

  const cranio = sphere(0.27, LOBO, { roughness: 0.88 })
  cranio.scale.set(1, 0.92, 1.05)
  cabeca.add(cranio)

  for (const side of [-1, 1]) {
    const bochecha = sphere(0.14, LOBO_CLARO, { roughness: 0.9 })
    bochecha.position.set(side * 0.19, -0.09, 0.06)
    cabeca.add(bochecha)

    const orelha = cone(0.095, 0.24, LOBO_ESC, { roughness: 0.88 }, 16)
    orelha.position.set(side * 0.16, 0.22, -0.1)
    orelha.rotation.set(-0.5, 0, -side * 0.25)
    cabeca.add(orelha)

    // olhos fechados de uivo sentido
    const olho = capsule(0.018, 0.07, PRETO, { roughness: 0.4 })
    olho.position.set(side * 0.13, 0.07, 0.235)
    olho.rotation.set(0, side * 0.5, Math.PI / 2 + side * 0.3)
    cabeca.add(olho)
  }

  const focinho = capsule(0.12, 0.32, LOBO, { roughness: 0.88 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.02, 0.36)
  cabeca.add(focinho)

  const nariz = sphere(0.065, PRETO, { roughness: 0.3 }, 16)
  nariz.scale.set(1.2, 0.85, 1)
  nariz.position.set(0, 0.04, 0.62)
  cabeca.add(nariz)

  const garganta = sphere(0.11, BOCA, { roughness: 0.5 })
  garganta.scale.set(0.85, 0.7, 1.4)
  garganta.position.set(0, -0.13, 0.32)
  cabeca.add(garganta)

  // mandíbula escancarada no uivo
  const mandibula = new THREE.Group()
  mandibula.position.set(0, -0.12, 0.14)
  mandibula.rotation.x = 0.55
  const queixo = capsule(0.085, 0.22, LOBO_CLARO, { roughness: 0.9 })
  queixo.rotation.x = Math.PI / 2
  queixo.position.z = 0.2
  mandibula.add(queixo)
  const lingua = capsule(0.055, 0.12, LINGUA, { roughness: 0.4 })
  lingua.rotation.x = Math.PI / 2
  lingua.scale.set(1.2, 1, 0.5)
  lingua.position.set(0, 0.07, 0.19)
  mandibula.add(lingua)
  cabeca.add(mandibula)

  for (const side of [-1, 1]) {
    const presa = cone(0.025, 0.07, '#f5f1e4', { roughness: 0.35 }, 12)
    presa.position.set(side * 0.07, -0.1, 0.48)
    presa.rotation.x = Math.PI
    cabeca.add(presa)
  }

  // ---- touca de enfermeiro (peça) -------------------------------------------
  const touca = new THREE.Group()
  touca.position.set(0, 0.24, 0.02)
  touca.rotation.x = 0.25
  const copa = rbox(0.34, 0.12, 0.3, 0.05, TOUCA, { roughness: 0.7 })
  copa.position.y = 0.04
  touca.add(copa)
  const aba = rbox(0.4, 0.16, 0.045, 0.02, TOUCA, { roughness: 0.7 })
  aba.position.set(0, 0.1, 0.15)
  aba.rotation.x = -0.25
  touca.add(aba)
  const dobra = rbox(0.4, 0.025, 0.05, 0.01, '#e4e1d8', { roughness: 0.7 })
  dobra.position.set(0, 0.025, 0.165)
  touca.add(dobra)
  // cruz vermelha na frente da aba e na lateral virada para a câmera
  for (const [w, h] of [[0.12, 0.035], [0.035, 0.12]] as const) {
    const frente = rbox(w, h, 0.02, 0.008, CRUZ, { roughness: 0.5 })
    frente.position.set(0, 0.105, 0.175)
    frente.rotation.x = -0.25
    touca.add(frente)
    const lado = rbox(0.02, h, w, 0.008, CRUZ, { roughness: 0.5 })
    lado.position.set(0.175, 0.045, 0)
    touca.add(lado)
  }
  cabeca.add(touca)

  // ---- uivo: anéis de som saindo da boca (peça) -----------------------------
  const uivo = new THREE.Group()
  uivo.position.set(0, -0.04, 0.62)
  const somOpts = { roughness: 0.4, emissive: '#a9c8ff', emissiveIntensity: 0.55 }
  // arcos ')))' no plano que encara a câmera, abrindo à frente do focinho
  const ARCO = 1.7
  for (const [apice, r] of [[0.16, 0.12], [0.4, 0.2], [0.66, 0.28]] as const) {
    const onda = malha(new THREE.TorusGeometry(r, 0.03, 12, 32, ARCO), UIVO, { ...somOpts, size: r * 2 })
    onda.rotation.set(0, -Math.PI / 2, -ARCO / 2)
    onda.position.z = apice - r
    uivo.add(onda)
    for (const sgn of [-1, 1]) {
      const ponta = sphere(0.03, UIVO, somOpts, 12)
      ponta.position.set(0, Math.sin((sgn * ARCO) / 2) * r, apice - r + Math.cos(ARCO / 2) * r)
      uivo.add(ponta)
    }
  }
  cabeca.add(uivo)

  // ---- tesoura prateada gigante (2 peças: uma lâmina cada) ------------------
  // suporte não-animado na pata; as lâminas giram em rotation.z no pino
  // eixo das lâminas: para cima, levemente inclinado; plano da tesoura de frente
  // para a câmera (direção da câmera no espaço local do lobo)
  const eixoY = new THREE.Vector3(-0.3, 1, 0.36).normalize()
  const paraCam = new THREE.Vector3(Math.sin(-LOBO_ROT), 0.15, Math.cos(-LOBO_ROT))
  const eixoX = new THREE.Vector3().crossVectors(eixoY, paraCam).normalize()
  const eixoZ = new THREE.Vector3().crossVectors(eixoX, eixoY)
  const suporte = new THREE.Group()
  suporte.position.copy(PAW).addScaledVector(eixoY, 0.17)
  suporte.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(eixoX, eixoY, eixoZ))
  const giro = new THREE.Group()
  suporte.add(giro)
  lobo.add(suporte)

  function folha(side: 1 | -1) {
    const g = new THREE.Group()
    g.rotation.z = side * ABERTA
    const lam = cone(0.085, 0.86, PRATA, { roughness: 0.3, metalness: 0.55 }, 24)
    lam.scale.z = 0.28
    lam.position.set(side * 0.03, 0.46, 0)
    g.add(lam)
    const dorsoL = rbox(0.03, 0.5, 0.03, 0.012, '#aab3bd', { roughness: 0.3, metalness: 0.55 })
    dorsoL.position.set(side * 0.06, 0.28, 0)
    dorsoL.rotation.z = side * 0.06
    g.add(dorsoL)
    const haste = rbox(0.04, 0.12, 0.035, 0.015, PRATA, { roughness: 0.3, metalness: 0.55 })
    haste.position.set(-side * 0.02, -0.06, 0)
    g.add(haste)
    const olhal = torus(0.075, 0.024, '#2d3138', { roughness: 0.45 })
    olhal.position.set(-side * 0.05, -0.18, 0)
    g.add(olhal)
    return g
  }
  const tesoura = folha(1)
  giro.add(tesoura)
  const lamina = folha(-1)
  giro.add(lamina)
  const pino = cylinder(0.03, 0.03, 0.07, '#7d8690', { roughness: 0.25, metalness: 0.9 }, 16)
  pino.rotation.x = Math.PI / 2
  tesoura.add(pino)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'clareira', object: base },
    { name: 'lua', group: 'clareira', object: lua },
    { name: 'toco', group: 'maca', object: toco },
    { name: 'lencol', group: 'maca', object: lencol },
    { name: 'joaninha', group: 'joaninha', object: joaninha },
    { name: 'ingua', group: 'joaninha', object: ingua },
    { name: 'lobo', group: 'lobo', object: lobo },
    { name: 'cabeca', group: 'lobo', object: cabeca },
    { name: 'touca', group: 'lobo', object: touca },
    { name: 'uivo', group: 'uivo', object: uivo },
    { name: 'tesoura', group: 'xak', object: tesoura },
    { name: 'lamina', group: 'xak', object: lamina },
  ]

  const pop = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  // ---- montagem -------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Uma clareira na floresta, à noite…',
    }),
    seq('lua-pop', 'lua', 0.5, 0.8, [...pop(0.01, 1), ch('rotation.z', -1.4, -0.35)], { ease: 'easeOut' }),

    seq('toco-rise', 'toco', 1.8, 0.7, [riseFrom(FY, 0.8)], {
      ease: 'easeOut',
      caption: 'No meio dela, um toco de árvore vira maca, com lençolzinho branco.',
    }),
    seq('lencol-cai', 'lencol', 2.2, 0.55, [ch('position.y', TY + 0.9, TY), ch('rotation.y', -0.6, 0.15)], {
      ease: 'easeIn',
    }),

    seq('joaninha-deita', 'joaninha', 3.4, 0.6, [ch('position.y', TY + 0.9, JY)], {
      ease: 'easeIn',
      caption: 'Chega a joaninha e se deita na maca, doente…',
    }),
    seq('ingua-incha', 'ingua', 4.3, 0.9, [ch('scale.x', 0.01, 1.25), ch('scale.y', 0.01, 1.25), ch('scale.z', 0.01, 1.25)], {
      ease: 'easeOut',
      caption: '…com uma ÍNGUA roxa enorme brotando do casco: ÍNG-EN?',
    }),

    seq('lobo-rise', 'lobo', 5.8, 1.0, [riseFrom(FY, 2.6)], {
      ease: 'easeOut',
      caption: 'O lobo mau se aposentou e virou enfermeiro da floresta…',
    }),
    seq('cabeca-examina', 'cabeca', 5.8, 1.0, [ch('rotation.x', 0, EXAME_X), ch('rotation.y', 0, EXAME_Y)], {
      ease: 'easeOut',
    }),
    seq('touca-cai', 'touca', 7.0, 0.55, [ch('position.y', 0.9, 0.24), ...pop(0.4, 1)], {
      ease: 'easeIn',
      caption: '…de touca branca. Ele examina a íngua: ÍNG-EN?',
    }),

    seq('cabeca-uiva', 'cabeca', 8.4, 0.7, [ch('rotation.x', EXAME_X, UIVO_X), ch('rotation.y', EXAME_Y, UIVO_Y)], {
      ease: 'easeInOut',
      caption: 'Enche o peito e uiva pra lua: ÚÚÚÚ…',
    }),
    seq('uivo-sai', 'uivo', 8.9, 1.2, [ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
    }),

    seq('tesoura-pop', 'tesoura', 10.3, 0.4, pop(0.01, 1), {
      ease: 'easeOut',
      caption: '…e corta o próprio uivo com a tesoura: XAK!',
    }),
    seq('lamina-pop', 'lamina', 10.3, 0.4, pop(0.01, 1), { ease: 'easeOut' }),
    seq('tesoura-fecha', 'tesoura', 10.85, 0.12, [ch('rotation.z', ABERTA, 0)], { ease: 'easeIn' }),
    seq('lamina-fecha', 'lamina', 10.85, 0.12, [ch('rotation.z', -ABERTA, 0)], { ease: 'easeIn' }),
    seq('tesoura-abre', 'tesoura', 11.05, 0.35, [ch('rotation.z', 0, ABERTA)], { ease: 'easeOut' }),
    seq('lamina-abre', 'lamina', 11.05, 0.35, [ch('rotation.z', 0, -ABERTA)], { ease: 'easeOut' }),

    seq('ingua-murcha', 'ingua', 11.2, 0.45, [ch('scale.x', 1.25, 0.62), ch('scale.y', 1.25, 0.42), ch('scale.z', 1.25, 0.62)], {
      ease: 'easeIn',
      caption: 'A íngua murcha num PUF! A joaninha agradece mil vezes… e o lobo só abana a pata.',
    }),
    seq('joaninha-pula', 'joaninha', 12.0, 0.25, [ch('position.y', JY, JY + 0.15)], { ease: 'easeOut' }),
    seq('joaninha-pousa', 'joaninha', 12.25, 0.3, [ch('position.y', JY + 0.15, JY)], { ease: 'easeIn' }),

    seq('fim', 'uivo', 13.0, 0.01, [ch('scale.x', 1, 1)], {
      caption: 'Ingen orsak! — De nada! / Não há de quê!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.2, 5.5], target: [-0.2, 1.5, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'ingen-orsak',
    contexto:
      "Resposta a um 'tack' — alguém agradece porque você segurou a porta, emprestou uma caneta, ajudou com a sacola.",
    fraseFonte: 'De nada! / Não há de quê!',
    fraseAlvo: 'Ingen orsak!',
    pronuncia:
      "ÍNG-en ÚU-xaak ('ng' como no fim de 'ping', sem estalar o G; o 'o' de 'orsak' é U LONGO e fechado, e o 'rs' vira X de xarope — nunca 'ÓR-sak' com O de 'orelha')",
    ponteSonora:
      "ÍNG-EN? ÚÚÚ-XAK! (4 sílabas; ÍNG-EN é a mesma ÍNGUA de 'Ingen fara' — ÍNG como no fim de 'ping', G quase sumindo, depois -EN; ÚÚÚ é o uivo do lobo: U LONGO e FECHADO, nunca 'ór' nem 'AU-u'; XAK é a tesourada que corta o uivo — X de xarope, porque o 'rs' sueco vira X, A comprido e K seco no fim, sem 'xáque' com vogal depois)",
    historia:
      'O lobo mau se aposentou e virou enfermeiro da floresta, de touca branca. Chega a joaninha com uma ÍNGUA roxa inchada brotando do casco, do tamanho dela. O lobo examina — ÍNG-EN? —, enche o peito, solta um uivo longo ÚÚÚÚ... e corta o próprio uivo com uma tesourada: XAK! A íngua murcha num puf. A joaninha agradece mil vezes e o lobo só abana a pata: ÍNGEN ÚUXAK — de nada, não há de quê.',
  },
  createScene,
  refine: { organic: ['joaninha', 'ingua', 'lobo', 'cabeca'] },
}

export default card
