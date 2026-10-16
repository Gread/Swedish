import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  box, rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vilka papper behöver jag?" — VIL CA(nalha)... PÁ! PER(u)... BERRÔ: VER, IÁ?
 *
 * No guichê do Skatteverket, o PERU pergunta quais papéis precisa e leva
 * de resposta uma avalanche de formulários. Xinga (VIL CA…!), um bloco de
 * papel cai no bico e corta o 'canalha'; ele agarra a PÁ, cava até pôr o
 * peito pra fora e BERRA pra janelinha: VER! IÁ?
 *
 * Diorama: piso de linóleo bege; à direita, o guichê de madeira clara com a
 * janelinha de vidro e a fenda de passar papel; no centro-esquerda, a
 * montanha de formulários com o peru saindo até o peito, cauda em leque
 * atrás, pá vermelha erguida na asa e três arcos de berro rumo à janelinha.
 */

const LINO = '#d8c6a0'
const LINO_DARK = '#b59d74'
const LINO_SEAM = '#c7b28a'
const WOOD = '#d9b27e'
const WOOD_MID = '#c99e66'
const WOOD_DARK = '#94693f'
const INSIDE = '#3b4a5b'
const GLASS = '#d4ecf7'
const SIGN = '#2f4d72'
const PAPER = '#f7f5f0'
const PAPER_CORE = '#e9e5db'
const PAPER_BLUE = '#e3ebf2'
const PAPER_CREAM = '#f3ead3'
const PAPER_GREEN = '#e2e9d8'
const INK = '#8e9aa8'
const INK_HEAD = '#5d7594'
const BAND = '#b99a68' // cinta de papel pardo dos maços
const BRONZE = '#6b4a2e'
const BRONZE_DARK = '#46301e'
const COPPER = '#946339'
const TAIL = '#7d5636'
const TAIL_BAR = '#573b25'
const TAIL_BAND = '#2b1f17'
const TAIL_TIP = '#ecdcb6'
const WING_BAR = '#f1eee6'
const SKIN_BLUE = '#a8c5dc'
const LEG = '#c69a8c'
const WATTLE = '#c22f3f'
const BEAK = '#e8c35b'
const MOUTH = '#5a1d26'
const RING = '#dde4ea'
const FOLDER = '#e1c68c'
const FOLDER_BLUE = '#87a3c6'
const METAL = '#7d848c'
const HANDLE = '#c48f57'
const ACCENT = '#ee3b1f' // acento saturado RESERVADO: a lâmina da PÁ

const GY = 0.14 // topo do piso
const CAM: [number, number, number] = [-0.15, 2.6, 5.55]
const TARGET: [number, number, number] = [0.1, 1.5, 0.05]

// peru (e a montanha, centrada nele)
const TX = -0.62
const TZ = 0.0
const TYAW = 1.05 // peito virado para a frente-direita (rumo ao guichê)
const HEAD_YAW = 0.45 // a cabeça vira ainda mais: perfil berrando pra janelinha
const S = 1.2 // escala do peru: protagonista grande
const PY = GY - 0.3 // pose final: enterrado até o peito (as pernas somem no papel)
const SINK_Y = GY - 0.9 // soterrado pela avalanche: só a cabeça de fora

// guichê
const GX = 1.66
const GZ = 0.08
const GYAW = -1.15
const WIN_Y = 1.62 // centro da janelinha (local do guichê)

// asa: quanto ela golpeia (em torno do próprio z) a cada PÁ!
const ASA_DIG_SWING = 0.7

/** Perfil da montanha de papel: [raio, altura], da borda para o pico. */
const MOUND: [number, number][] = [
  [1.46, 0], [1.42, 0.05], [1.33, 0.1], [1.2, 0.18], [1.05, 0.31], [0.85, 0.48],
  [0.65, 0.65], [0.45, 0.79], [0.25, 0.9], [0, 0.95],
]

// corpo do peru (espaço local dele, antes da escala S)
const BODY_C = new THREE.Vector3(0, 0.95, -0.04)
const BODY_R = new THREE.Vector3(0.5, 0.45, 0.575)
const BREAST_C = new THREE.Vector3(0, 1.04, 0.3)
const BREAST_R = new THREE.Vector3(0.38, 0.4, 0.36)

/** O ponto (mundo) cai dentro do corpo/peito do peru na pose final? */
function insideTurkey(x: number, y: number, z: number) {
  const dx = x - TX
  const dz = z - TZ
  const lx = (dx * Math.cos(TYAW) - dz * Math.sin(TYAW)) / S
  const lz = (dx * Math.sin(TYAW) + dz * Math.cos(TYAW)) / S
  const ly = (y - PY) / S
  const e = (c: THREE.Vector3, r: THREE.Vector3) =>
    ((lx - c.x) / r.x) ** 2 + ((ly - c.y) / r.y) ** 2 + ((lz - c.z) / r.z) ** 2 < 1
  return e(BODY_C, BODY_R) || e(BREAST_C, BREAST_R)
}

function moundH(r: number) {
  if (r >= MOUND[0][0]) return 0
  for (let i = 0; i < MOUND.length - 1; i++) {
    const [r0, y0] = MOUND[i]
    const [r1, y1] = MOUND[i + 1]
    if (r <= r0 && r >= r1) return y0 + ((y1 - y0) * (r0 - r)) / (r0 - r1)
  }
  return MOUND[MOUND.length - 1][1]
}

const UP = new THREE.Vector3(0, 1, 0)

/** Normal da superfície da montanha no raio r, direção a. */
function moundNormal(r: number, a: number) {
  const s = (moundH(r + 0.03) - moundH(Math.max(0, r - 0.03))) / 0.06
  return new THREE.Vector3(-s * Math.cos(a), 1, -s * Math.sin(a)).normalize()
}

/** Folha de formulário deitada no plano xz (face para +y). */
function sheet(color: string, lines: boolean, w = 0.3, d = 0.22) {
  const g = new THREE.Group()
  g.add(rbox(w, 0.012, d, 0.005, color, { roughness: 0.85 }))
  if (lines) {
    const head = box(w * 0.5, 0.004, 0.03, INK_HEAD, { roughness: 0.8, detail: 0 })
    head.position.set(-w * 0.12, 0.007, -d * 0.3)
    g.add(head)
    for (let i = 0; i < 3; i++) {
      const l = box(w * (i === 2 ? 0.45 : 0.7), 0.003, 0.012, INK, { roughness: 0.9, detail: 0 })
      l.position.set(-w * (i === 2 ? 0.1 : 0), 0.007, -d * 0.08 + i * d * 0.17)
      g.add(l)
    }
  }
  return g
}

/** Maço de papel amarrado com cinta parda. */
function bundle(w = 0.32, h = 0.1, d = 0.24) {
  const g = new THREE.Group()
  const stack = rbox(w, h, d, 0.012, PAPER, { roughness: 0.8 })
  stack.position.y = h / 2
  g.add(stack)
  // bordas das folhas: frisos finos na lateral
  for (let i = 1; i < 4; i++) {
    const f = box(w + 0.004, 0.004, d + 0.004, PAPER_CORE, { roughness: 0.9, detail: 0 })
    f.position.y = (h * i) / 4
    g.add(f)
  }
  const cinta = rbox(0.06, h + 0.01, d + 0.01, 0.006, BAND, { roughness: 0.8 })
  cinta.position.y = h / 2
  g.add(cinta)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- base: piso de linóleo bege --------------------------------------------
  const base = new THREE.Group()
  const piso = cylinder(2.62, 2.7, 0.14, LINO, { roughness: 0.6 })
  piso.position.y = 0.07
  base.add(piso)
  const borda = torus(2.63, 0.035, LINO_DARK, { roughness: 0.6 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = GY - 0.005
  base.add(borda)
  // juntas das placas de linóleo
  for (let i = -3; i <= 3; i++) {
    const c = i * 0.72
    const meia = Math.sqrt(Math.max(0, 2.56 * 2.56 - c * c))
    const jx = box(meia * 2, 0.004, 0.014, LINO_SEAM, { roughness: 0.7, detail: 0 })
    jx.position.set(0, GY + 0.002, c)
    const jz = box(0.014, 0.004, meia * 2, LINO_SEAM, { roughness: 0.7, detail: 0 })
    jz.position.set(c, GY + 0.002, 0)
    base.add(jx, jz)
  }
  root.add(base)

  // ---- guichê de madeira clara ------------------------------------------------
  const guiche = new THREE.Group()
  guiche.position.set(GX, GY, GZ)
  guiche.rotation.y = GYAW
  root.add(guiche)

  const WD = 0.36 // espessura da parede
  const OW = 0.96 // vão da janelinha
  const OB = 1.2 // base do vão
  const OT = 2.0 // topo do vão
  const lower = rbox(1.8, OB, WD, 0.03, WOOD, { roughness: 0.6 })
  lower.position.y = OB / 2
  const upper = rbox(1.8, 2.5 - OT, WD, 0.03, WOOD, { roughness: 0.6 })
  upper.position.y = (OT + 2.5) / 2
  guiche.add(lower, upper)
  for (const side of [-1, 1]) {
    const pilar = rbox((1.8 - OW) / 2 + 0.02, OT - OB + 0.04, WD, 0.03, WOOD, { roughness: 0.6 })
    pilar.position.set(side * (OW / 2 + (1.8 - OW) / 4), (OB + OT) / 2, 0)
    guiche.add(pilar)
  }
  // fundo escuro do escritório, recuado atrás do vidro
  const fundo = rbox(OW + 0.04, OT - OB + 0.04, 0.04, 0.01, INSIDE, { roughness: 0.8 })
  fundo.position.set(0, (OB + OT) / 2, -0.14)
  guiche.add(fundo)
  // pilhas de papel lá dentro (de onde veio a avalanche)
  for (const [px, n] of [[-0.28, 4], [0.22, 3]] as const) {
    for (let k = 0; k < n; k++) {
      const p = rbox(0.3, 0.05, 0.16, 0.008, k % 2 ? PAPER_BLUE : PAPER, { roughness: 0.8 })
      p.position.set(px + (rand() - 0.5) * 0.04, OB + 0.03 + k * 0.05, -0.05)
      p.rotation.y = (rand() - 0.5) * 0.3
      guiche.add(p)
    }
  }
  // vidro (com a fenda de passar papel por baixo)
  const vidroMat = mat(GLASS, { roughness: 0.05, detail: 0 })
  vidroMat.transparent = true
  vidroMat.opacity = 0.28
  vidroMat.depthWrite = false
  const vidro = new THREE.Mesh(new THREE.BoxGeometry(OW, OT - OB - 0.13, 0.012), vidroMat)
  vidro.position.set(0, (OB + 0.13 + OT) / 2, 0.1)
  guiche.add(vidro)
  // furinhos de falar no vidro
  const fala = torus(0.07, 0.009, '#e9f3f8', { roughness: 0.3 })
  fala.position.set(0, WIN_Y + 0.02, 0.11)
  guiche.add(fala)
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2
    const furo = sphere(0.011, '#e9f3f8', { roughness: 0.3, detail: 0 })
    furo.position.set(Math.cos(a) * 0.035, WIN_Y + 0.02 + Math.sin(a) * 0.035, 0.108)
    guiche.add(furo)
  }
  // moldura do vão (madeira escura saltada)
  for (const [w, h, x, y] of [
    [OW + 0.12, 0.06, 0, OT + 0.02],
    [OW + 0.12, 0.05, 0, OB + 0.13],
    [0.06, OT - OB + 0.06, -OW / 2 - 0.02, (OB + OT) / 2],
    [0.06, OT - OB + 0.06, OW / 2 + 0.02, (OB + OT) / 2],
  ] as const) {
    const m = rbox(w, h, 0.06, 0.015, WOOD_DARK, { roughness: 0.55 })
    m.position.set(x, y, WD / 2 + 0.01)
    guiche.add(m)
  }
  // balcão (prateleira) saindo da parede, sob a fenda
  const balcao = rbox(1.95, 0.07, 0.48, 0.025, WOOD_DARK, { roughness: 0.5 })
  balcao.position.set(0, OB - 0.01, 0.2)
  guiche.add(balcao)
  // almofadas de madeira no painel de baixo
  for (const side of [-1, 1]) {
    const painel = rbox(0.72, 0.78, 0.03, 0.02, WOOD_MID, { roughness: 0.6 })
    painel.position.set(side * 0.42, 0.56, WD / 2 + 0.01)
    guiche.add(painel)
  }
  // rodapé
  const rodape = rbox(1.82, 0.1, 0.04, 0.015, WOOD_DARK, { roughness: 0.6 })
  rodape.position.set(0, 0.05, WD / 2 + 0.01)
  guiche.add(rodape)
  // placa azul com o pictograma de DOCUMENTO
  const placa = rbox(0.5, 0.3, 0.04, 0.03, SIGN, { roughness: 0.45 })
  placa.position.set(0, 2.24, WD / 2 + 0.02)
  guiche.add(placa)
  const doc = rbox(0.14, 0.19, 0.014, 0.012, '#f4f6f8', { roughness: 0.5 })
  doc.position.set(0, 2.24, WD / 2 + 0.045)
  guiche.add(doc)
  for (let k = 0; k < 3; k++) {
    const l = box(k === 2 ? 0.05 : 0.08, 0.016, 0.006, SIGN, { roughness: 0.5, detail: 0 })
    l.position.set(k === 2 ? -0.015 : 0, 2.28 - k * 0.04, WD / 2 + 0.054)
    guiche.add(l)
  }

  // ---- montanha de formulários ----------------------------------------------------
  const montanha = new THREE.Group()
  montanha.position.set(TX, GY, TZ)
  root.add(montanha)

  const nucleo = lathe(
    [[0, -0.03], [MOUND[0][0], -0.03], ...MOUND],
    PAPER_CORE,
    { roughness: 0.85 },
  )
  montanha.add(nucleo)

  const PAPERS = [PAPER, PAPER, PAPER, PAPER_BLUE, PAPER_CREAM, PAPER_GREEN]
  const spin = new THREE.Quaternion()
  for (let i = 0; i < 140; i++) {
    const r = 0.12 + Math.sqrt(rand()) * 1.3
    const a = rand() * Math.PI * 2
    const n = moundNormal(r, a)
    n.x += (rand() - 0.5) * 0.6
    n.z += (rand() - 0.5) * 0.6
    n.normalize()
    // a câmera vê o lado +z (e um pouco o +x): só ali vale desenhar linhas
    const front = Math.sin(a) > 0.15 || Math.cos(a) > 0.6
    const s = sheet(PAPERS[Math.floor(rand() * PAPERS.length)], front && rand() < 0.45, 0.34, 0.25)
    s.position.set(r * Math.cos(a), moundH(r) + 0.006 + rand() * 0.025, r * Math.sin(a))
    s.quaternion.setFromUnitVectors(UP, n).multiply(spin.setFromAxisAngle(UP, rand() * Math.PI * 2))
    montanha.add(s)
  }
  // pastas de arquivo (parda e azul) no meio da papelada
  for (let i = 0; i < 6; i++) {
    const r = 0.5 + rand() * 0.75
    const a = 0.5 + (i / 6) * Math.PI * 1.6 + rand() * 0.3
    const pasta = new THREE.Group()
    const cor = i % 3 === 1 ? FOLDER_BLUE : FOLDER
    const capa = rbox(0.38, 0.02, 0.28, 0.008, cor, { roughness: 0.75 })
    const aba = rbox(0.12, 0.02, 0.05, 0.008, cor, { roughness: 0.75 })
    aba.position.set(-0.09, 0, -0.16)
    const miolo = rbox(0.35, 0.03, 0.26, 0.006, PAPER, { roughness: 0.85 })
    miolo.position.y = -0.02
    pasta.add(capa, aba, miolo)
    pasta.position.set(r * Math.cos(a), moundH(r) + 0.03, r * Math.sin(a))
    pasta.quaternion.setFromUnitVectors(UP, moundNormal(r, a)).multiply(spin.setFromAxisAngle(UP, rand() * Math.PI * 2))
    montanha.add(pasta)
  }
  // papelada encostada no peru: a linha d'água do corpo some sob as folhas
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rand() * 0.15
    let r = 0.2
    while (r < 1.2 && insideTurkey(TX + r * Math.cos(a), GY + moundH(r) + 0.05, TZ + r * Math.sin(a))) r += 0.02
    const rr = r + 0.03 + rand() * 0.04
    const s = sheet(PAPERS[Math.floor(rand() * PAPERS.length)], rand() < 0.4, 0.34, 0.25)
    s.position.set(rr * Math.cos(a), moundH(rr) + 0.07 + rand() * 0.03, rr * Math.sin(a))
    const n = new THREE.Vector3(Math.cos(a), 0.75 + rand() * 0.4, Math.sin(a)).normalize()
    s.quaternion.setFromUnitVectors(UP, n).multiply(spin.setFromAxisAngle(UP, rand() * Math.PI * 2))
    montanha.add(s)
  }
  // maços amarrados e bolas de papel amassado
  for (let i = 0; i < 7; i++) {
    const r = 0.45 + rand() * 0.75
    const a = 0.2 + (i / 7) * Math.PI * 2 + rand() * 0.4
    const b = bundle()
    b.position.set(r * Math.cos(a), moundH(r) - 0.02, r * Math.sin(a))
    b.quaternion.setFromUnitVectors(UP, moundNormal(r, a)).multiply(spin.setFromAxisAngle(UP, rand() * Math.PI))
    montanha.add(b)
  }
  for (let i = 0; i < 6; i++) {
    const r = 0.5 + rand() * 0.8
    const a = rand() * Math.PI * 2
    const bola = puff(0.06, PAPER, 4, 70 + i, { roughness: 0.9 })
    bola.position.set(r * Math.cos(a), moundH(r) + 0.04, r * Math.sin(a))
    montanha.add(bola)
  }
  // folhas que escorregaram pro piso
  for (let i = 0; i < 30; i++) {
    // as primeiras cobrem o pé do monte (inclinadas), o resto escorregou pro piso
    const rim = i < 20
    const r = rim ? 1.32 + rand() * 0.14 : 1.55 + rand() * 0.35
    const a = rim ? (i / 20) * Math.PI * 2 + rand() * 0.3 : -0.7 + rand() * 2.9 // piso: mais na frente
    const s = sheet(PAPERS[Math.floor(rand() * PAPERS.length)], rand() < 0.5, 0.34, 0.25)
    if (rim) {
      s.position.set(r * Math.cos(a), moundH(r) + 0.02, r * Math.sin(a))
      s.quaternion.setFromUnitVectors(UP, moundNormal(r, a)).multiply(spin.setFromAxisAngle(UP, rand() * Math.PI * 2))
    } else {
      s.position.set(r * Math.cos(a), 0.008 + i * 0.0015, r * Math.sin(a))
      s.rotation.set((rand() - 0.5) * 0.06, rand() * Math.PI * 2, (rand() - 0.5) * 0.06)
    }
    montanha.add(s)
  }

  // ---- peru: corpo ---------------------------------------------------------------------
  const peru = new THREE.Group()
  peru.position.set(TX, PY, TZ)
  peru.rotation.y = TYAW
  peru.scale.setScalar(S)
  root.add(peru)

  // pernas e pés (somem no papel na pose final)
  for (const side of [-1, 1]) {
    const perna = capsule(0.055, 0.36, LEG, { roughness: 0.6 })
    perna.position.set(side * 0.17, 0.3, 0.02)
    peru.add(perna)
    for (const ang of [-0.55, 0, 0.55, Math.PI]) {
      const len = ang === Math.PI ? 0.06 : 0.11
      const dedo = capsule(0.025, len, LEG, { roughness: 0.6 })
      dedo.rotation.set(Math.PI / 2, ang, 0, 'YXZ')
      dedo.position.set(side * 0.17 + Math.sin(ang) * 0.08, 0.03, 0.02 + Math.cos(ang) * 0.08)
      peru.add(dedo)
    }
  }

  const corpo = sphere(0.5, BRONZE, { roughness: 0.7 })
  corpo.scale.set(BODY_R.x / 0.5, BODY_R.y / 0.5, BODY_R.z / 0.5)
  corpo.position.copy(BODY_C)
  peru.add(corpo)

  const peito = sphere(0.4, BRONZE, { roughness: 0.7 })
  peito.scale.set(BREAST_R.x / 0.4, BREAST_R.y / 0.4, BREAST_R.z / 0.4)
  peito.position.copy(BREAST_C)
  peru.add(peito)

  // base do pescoço: gola de penas que afina até a pele azul
  const pescoco = sphere(0.19, BRONZE, { roughness: 0.7 })
  pescoco.scale.set(0.8, 1.25, 0.8)
  pescoco.position.set(0, 1.36, 0.42)
  pescoco.rotation.x = 0.3
  peru.add(pescoco)

  // asa esquerda, dobrada do lado de lá
  const asaE = sphere(0.24, BRONZE_DARK, { roughness: 0.7 })
  asaE.scale.set(0.32, 0.62, 1.0)
  asaE.position.set(0.47, 1.0, -0.06)
  asaE.rotation.x = 0.25
  peru.add(asaE)

  // camadas de pena: lâminas grandes deitadas na superfície (o Blender funde
  // em relevo de plumagem, com faixas cobre/bronze)
  const zAxis = new THREE.Vector3(0, 0, 1)
  for (const [row, y] of [1.02, 1.22].entries()) {
    for (let k = 0; k < 5; k++) {
      const th = THREE.MathUtils.degToRad(122 + k * 27 + row * 13)
      const dy = (y - BODY_C.y) / BODY_R.y
      const kk = Math.sqrt(Math.max(0, 1 - dy * dy))
      const p = new THREE.Vector3(
        BODY_R.x * kk * Math.cos(th), y - BODY_C.y, BODY_R.z * kk * Math.sin(th),
      )
      const nrm = new THREE.Vector3(
        p.x / (BODY_R.x * BODY_R.x), p.y / (BODY_R.y * BODY_R.y), p.z / (BODY_R.z * BODY_R.z),
      ).normalize()
      const esc = sphere(0.18, row ? COPPER : BRONZE_DARK, { roughness: 0.6 })
      esc.scale.set(1, 0.7, 0.32)
      esc.position.copy(p).add(BODY_C)
      esc.quaternion.setFromUnitVectors(zAxis, nrm)
      peru.add(esc)
    }
  }

  // ---- cauda em leque (adereço rígido: penas finas listradas) -------------------------
  const cauda = new THREE.Group()
  cauda.position.set(0, 1.0, -0.42)
  cauda.rotation.set(-0.22, 0.17 - TYAW, 0, 'YXZ') // leque de frente pra câmera
  peru.add(cauda)
  const NF = 13
  for (let i = 0; i < NF; i++) {
    const a = THREE.MathUtils.degToRad(-96 + (192 * i) / (NF - 1))
    const pena = new THREE.Group()
    pena.rotation.z = -a
    pena.position.z = (i % 2) * 0.012
    cauda.add(pena)
    const L = 0.92
    const haste = rbox(0.21, L - 0.1, 0.03, 0.09, TAIL, { roughness: 0.65 })
    haste.position.y = 0.1 + (L - 0.1) / 2
    pena.add(haste)
    for (const by of [0.42, 0.58]) {
      const barra = rbox(0.214, 0.035, 0.034, 0.012, TAIL_BAR, { roughness: 0.65 })
      barra.position.y = by
      pena.add(barra)
    }
    const faixa = rbox(0.216, 0.07, 0.036, 0.015, TAIL_BAND, { roughness: 0.6 })
    faixa.position.y = L - 0.13
    pena.add(faixa)
    const ponta = rbox(0.218, 0.16, 0.035, 0.1, TAIL_TIP, { roughness: 0.7 })
    ponta.position.y = L - 0.03
    pena.add(ponta)
  }
  // coberteiras cobreadas por cima da base do leque
  for (let i = 0; i < 9; i++) {
    const a = THREE.MathUtils.degToRad(-80 + (160 * i) / 8)
    const cob = new THREE.Group()
    cob.rotation.z = -a
    cob.position.z = 0.04 + (i % 2) * 0.01
    cauda.add(cob)
    const c = rbox(0.2, 0.4, 0.035, 0.09, COPPER, { roughness: 0.6 })
    c.position.y = 0.26
    cob.add(c)
    const t = rbox(0.205, 0.07, 0.04, 0.03, BRONZE_DARK, { roughness: 0.6 })
    t.position.y = 0.44
    cob.add(t)
  }

  // ---- cabeça azulada e pelada (vira pra janelinha) -----------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.5, 0.52)
  cabeca.rotation.y = HEAD_YAW
  peru.add(cabeca)

  const pele = capsule(0.095, 0.3, SKIN_BLUE, { roughness: 0.55 })
  pele.position.set(0, 0.2, 0.02)
  pele.rotation.x = 0.15
  cabeca.add(pele)

  const cranio = sphere(0.2, SKIN_BLUE, { roughness: 0.55 })
  cranio.scale.set(0.85, 1.0, 1.1)
  cranio.position.set(0, 0.5, 0.08)
  cabeca.add(cranio)

  // bico amarelo escancarado: mandíbula de cima pra cima, a de baixo pra baixo
  const bicoSup = cone(0.085, 0.27, BEAK, { roughness: 0.4 })
  bicoSup.scale.x = 0.8
  bicoSup.position.set(0, 0.585, 0.365)
  bicoSup.rotation.x = Math.PI / 2 - 0.4
  cabeca.add(bicoSup)
  const bicoInf = cone(0.07, 0.22, BEAK, { roughness: 0.4 })
  bicoInf.scale.x = 0.8
  bicoInf.position.set(0, 0.365, 0.3)
  bicoInf.rotation.x = Math.PI / 2 + 0.85
  cabeca.add(bicoInf)
  const goela = sphere(0.085, MOUTH, { roughness: 0.5 })
  goela.scale.set(0.72, 1.25, 1)
  goela.position.set(0, 0.465, 0.27)
  cabeca.add(goela)
  const lingua = sphere(0.035, '#d9707a', { roughness: 0.4 })
  lingua.scale.set(0.8, 0.5, 1.4)
  lingua.position.set(0, 0.42, 0.31)
  cabeca.add(lingua)

  for (const side of [-1, 1]) {
    const olho = sphere(0.058, '#ffffff', { roughness: 0.25 })
    olho.scale.x = 0.55
    olho.position.set(side * 0.13, 0.56, 0.15)
    const pupila = sphere(0.031, '#151515', { roughness: 0.2 })
    pupila.position.set(side * 0.158, 0.56, 0.175)
    const brilho = sphere(0.01, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 })
    brilho.position.set(side * 0.176, 0.572, 0.18)
    // sobrancelha franzida: desce em direção ao bico
    const sob = capsule(0.02, 0.09, '#2c3540', { roughness: 0.6 })
    sob.position.set(side * 0.14, 0.64, 0.16)
    sob.rotation.x = Math.PI / 2 + 0.5
    cabeca.add(olho, pupila, brilho, sob)
  }

  // carúncula curta da testa, caindo sobre o bico pelo lado de lá
  const carunculaTesta = capsule(0.026, 0.09, WATTLE, { roughness: 0.5 })
  carunculaTesta.position.set(0.045, 0.6, 0.3)
  carunculaTesta.rotation.x = -0.9
  cabeca.add(carunculaTesta)
  for (const [x, y, z] of [[-0.06, 0.22, 0.1], [-0.02, 0.15, 0.11]] as const) {
    const verruga = sphere(0.038, WATTLE, { roughness: 0.5 })
    verruga.position.set(x, y, z)
    cabeca.add(verruga)
  }

  // ---- papo vermelho (estufa) ---------------------------------------------------------
  const papo = new THREE.Group()
  papo.position.set(0, 0.34, 0.15)
  cabeca.add(papo)
  const papo1 = sphere(0.15, WATTLE, { roughness: 0.45 })
  papo1.scale.set(0.78, 1.1, 0.95)
  papo1.position.set(0, -0.02, 0.0)
  const papo2 = sphere(0.1, WATTLE, { roughness: 0.45 })
  papo2.scale.set(0.85, 1, 0.9)
  papo2.position.set(0, -0.17, -0.02)
  papo.add(papo1, papo2)

  // ---- asa direita (lado da câmera), erguida com a pá ---------------------------------
  const asa = new THREE.Group()
  asa.position.set(-0.42, 1.3, 0.06)
  peru.add(asa)
  {
    // orientação em MUNDO: a asa sobe pra cima-esquerda da tela, com a face
    // larga das penas virada pra câmera; convertida para o espaço do peru
    const yW = new THREE.Vector3(-0.5, 0.85, 0.12).normalize()
    const xW = new THREE.Vector3(0, 0, -1).addScaledVector(yW, -yW.z).normalize()
    const zW = new THREE.Vector3().crossVectors(xW, yW)
    const qW = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xW, yW, zW))
    const qPeru = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, TYAW, 0))
    asa.quaternion.copy(qPeru.invert().multiply(qW))
  }
  const ASA_UP = asa.rotation.z
  const ASA_DIG = ASA_UP + ASA_DIG_SWING
  // braço-asa liso (y = ao longo da asa; x = face, oposta à câmera)
  const ombro = sphere(0.15, BRONZE, { roughness: 0.7 })
  ombro.scale.set(0.8, 1, 1)
  ombro.position.y = 0.02
  const braco = capsule(0.12, 0.36, BRONZE, { roughness: 0.7 })
  braco.scale.x = 0.75
  braco.position.y = 0.28
  asa.add(ombro, braco)
  // franja de rêmiges barradas (creme com barras escuras) no bordo de fuga
  for (let k = 0; k < 4; k++) {
    const L = 0.3 + k * 0.035
    const pena = new THREE.Group()
    pena.position.set(0.03, 0.12 + k * 0.12, -0.07)
    pena.rotation.x = -1.75 + k * 0.28
    asa.add(pena)
    const lam = rbox(0.03, L, 0.12, 0.055, WING_BAR, { roughness: 0.7 })
    lam.position.y = L / 2
    pena.add(lam)
    for (const f of [0.38, 0.62, 0.86]) {
      const barra = rbox(0.034, 0.04, 0.124, 0.015, TAIL_BAND, { roughness: 0.7 })
      barra.position.y = L * f
      pena.add(barra)
    }
  }

  // ---- pose final em mundo: pá, berro, bloco, folhas ---------------------------------
  root.updateMatrixWorld(true)

  // pá: cabo de madeira, lâmina vermelha, folhas espetadas
  const pa = new THREE.Group()
  asa.add(pa)
  {
    const grip = asa.localToWorld(new THREE.Vector3(0, 0.58, 0))
    const want = new THREE.Matrix4().compose(
      grip,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, -0.25, 0.16)),
      new THREE.Vector3(1, 1, 1),
    )
    const local = new THREE.Matrix4().copy(asa.matrixWorld).invert().multiply(want)
    local.decompose(pa.position, pa.quaternion, pa.scale)
    // mão de penas: palma atrás do cabo e três dedos-pena cruzando por cima
    // dele, do lado da câmera
    const mao = new THREE.Group()
    mao.position.copy(pa.position)
    mao.quaternion.copy(pa.quaternion)
    asa.add(mao)
    const palma = sphere(0.1, BRONZE, { roughness: 0.7 })
    palma.scale.set(1.0, 1.2, 0.6)
    palma.position.set(0, 0, -0.07)
    mao.add(palma)
    for (const [k, c] of [WING_BAR, BRONZE_DARK, WING_BAR].entries()) {
      const dedo = capsule(0.042, 0.11, c, { roughness: 0.7 })
      dedo.rotation.z = Math.PI / 2 - 0.15
      dedo.position.set(-0.01, 0.075 - k * 0.075, 0.045)
      mao.add(dedo)
    }
  }
  // a asa segura no alto do cabo: a ferramenta inteira desce em relação à pegada
  const ferramenta = new THREE.Group()
  ferramenta.position.y = -0.2
  pa.add(ferramenta)
  const cabo = cylinder(0.034, 0.034, 0.98, HANDLE, { roughness: 0.55 })
  ferramenta.add(cabo)
  const alcaD = torus(0.075, 0.022, HANDLE, { roughness: 0.55 })
  alcaD.position.y = -0.56
  ferramenta.add(alcaD)
  const travessa = cylinder(0.024, 0.024, 0.16, HANDLE, { roughness: 0.55 })
  travessa.rotation.z = Math.PI / 2
  travessa.position.y = -0.63
  ferramenta.add(travessa)
  const colar = cylinder(0.05, 0.042, 0.16, METAL, { roughness: 0.3, metalness: 0.7 })
  colar.position.y = 0.52
  ferramenta.add(colar)
  const lamina = new THREE.Shape()
  lamina.moveTo(-0.18, 0)
  lamina.lineTo(0.18, 0)
  lamina.lineTo(0.18, 0.22)
  lamina.quadraticCurveTo(0.17, 0.37, 0, 0.48)
  lamina.quadraticCurveTo(-0.17, 0.37, -0.18, 0.22)
  lamina.closePath()
  const laminaGeo = new THREE.ExtrudeGeometry(lamina, {
    depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 18,
  })
  laminaGeo.translate(0, 0, -0.01)
  const laminaMesh = new THREE.Mesh(laminaGeo, mat(ACCENT, { roughness: 0.32, size: 0.5 }))
  laminaMesh.castShadow = true
  laminaMesh.receiveShadow = true
  laminaMesh.position.y = 0.58
  ferramenta.add(laminaMesh)
  const dobra = cylinder(0.022, 0.022, 0.38, '#c22e18', { roughness: 0.35 })
  dobra.rotation.z = Math.PI / 2
  dobra.position.y = 0.59
  ferramenta.add(dobra)
  const lingueta = rbox(0.07, 0.2, 0.03, 0.012, METAL, { roughness: 0.3, metalness: 0.7 })
  lingueta.position.set(0, 0.66, -0.025)
  ferramenta.add(lingueta)
  for (const [y, rx, ry, rz, c] of [
    [0.96, 1.15, 0.5, 0.35, PAPER],
    [0.84, 1.35, -0.7, -0.4, PAPER_BLUE],
  ] as const) {
    const s = sheet(c, true, 0.26, 0.2)
    s.position.set(0, y, 0)
    s.rotation.set(rx, ry, rz)
    ferramenta.add(s)
  }

  // pontos-chave do berro
  const beakTip = cabeca.localToWorld(new THREE.Vector3(0, 0.47, 0.5))
  const beakTop = cabeca.localToWorld(new THREE.Vector3(0, 0.66, 0.4))
  const winC = guiche.localToWorld(new THREE.Vector3(0, WIN_Y, 0.12))
  const slot = guiche.localToWorld(new THREE.Vector3(0, OB + 0.07, 0.2))

  // três arcos de berro, concêntricos no bico, de frente pra câmera
  const aneis = new THREE.Group()
  aneis.position.copy(beakTip)
  root.add(aneis)
  {
    const plano = new THREE.Group()
    aneis.add(plano)
    plano.lookAt(new THREE.Vector3(...CAM))
    const d = winC.clone().sub(beakTip)
    const dl = d.clone().applyQuaternion(plano.quaternion.clone().invert())
    const phi = Math.atan2(dl.y, dl.x)
    const dist = d.length()
    for (const k of [0, 1, 2]) {
      const R = Math.min(0.24 + k * 0.24, dist * (0.25 + k * 0.24))
      const arc = Math.min(1.5, 0.36 / R + 0.25)
      const t = new THREE.Mesh(
        new THREE.TorusGeometry(R, 0.034, 12, 40, arc),
        mat(RING, { roughness: 0.4, size: R }),
      )
      t.castShadow = true
      t.rotation.z = phi - arc / 2
      plano.add(t)
      for (const ang of [phi - arc / 2, phi + arc / 2]) {
        const cap = sphere(0.034, RING, { roughness: 0.4 })
        cap.position.set(R * Math.cos(ang), R * Math.sin(ang), 0)
        plano.add(cap)
      }
    }
  }

  // quatro folhas voando, saídas da fenda do guichê
  const folhas = new THREE.Group()
  folhas.position.copy(slot)
  root.add(folhas)
  for (const [wx, wy, wz, rx, ry, rz, c] of [
    [1.15, 1.6, 0.8, 1.2, 0.3, 0.5, PAPER],
    [0.55, 2.55, 0.3, 1.25, -0.4, -0.3, PAPER_BLUE],
    [-0.1, 2.8, 0.1, 0.95, 0.5, 0.2, PAPER_CREAM],
    [1.35, 2.6, -0.05, 1.3, 0.2, -0.6, PAPER],
  ] as const) {
    const s = sheet(c, true)
    s.position.set(wx - slot.x, wy - slot.y, wz - slot.z)
    s.rotation.set(rx, ry, rz)
    folhas.add(s)
  }

  // bloco de papel que caiu no bico: repousa na montanha, na frente dele
  const BL_A = 0.75
  const BL_R = 0.98
  const bloco = new THREE.Group()
  bloco.position.set(
    TX + Math.cos(BL_A) * BL_R, GY + moundH(BL_R) + 0.01, TZ + Math.sin(BL_A) * BL_R,
  )
  root.add(bloco)
  {
    const inner = bundle(0.3, 0.12, 0.22)
    inner.quaternion.setFromUnitVectors(UP, moundNormal(BL_R, BL_A)).multiply(spin.setFromAxisAngle(UP, 0.5))
    bloco.add(inner)
  }
  // onde o bloco acerta o bico, com o peru ainda soterrado (SINK_Y)
  const BL_HIT = new THREE.Vector3(beakTop.x, beakTop.y - (PY - SINK_Y) - 0.02, beakTop.z)

  // ---- peças -------------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'guiche', object: base },
    { name: 'guiche', group: 'guiche', object: guiche },
    { name: 'peru', group: 'peru', object: peru },
    { name: 'cauda', group: 'peru', object: cauda },
    { name: 'cabeca', group: 'peru', object: cabeca },
    { name: 'papo', group: 'peru', object: papo },
    { name: 'asa', group: 'peru', object: asa },
    { name: 'montanha', group: 'avalanche', object: montanha },
    { name: 'folhas', group: 'avalanche', object: folhas },
    { name: 'bloco', group: 'vilca', object: bloco },
    { name: 'pa', group: 'pa', object: pa },
    { name: 'aneis', group: 'berro', object: aneis },
  ]

  const grow = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Skatteverket: piso de linóleo e o guichê de madeira, com a janelinha de vidro.',
    }),
    seq('guiche-rise', 'guiche', 0.35, 0.9, [riseFrom(GY, 2.7)], { ease: 'easeOut' }),

    seq('peru-chega', 'peru', 1.7, 0.85, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'Chega um PERU e pergunta pela janelinha: de quais papéis eu preciso?',
    }),
    seq('cauda-fechada', 'cauda', 1.9, 0.5, [ch('scale.x', 0.01, 0.35), ch('scale.y', 0.01, 0.6)], {
      ease: 'easeOut',
    }),
    seq('cabeca-vira', 'cabeca', 2.1, 0.5, [ch('rotation.y', 0, HEAD_YAW)], { ease: 'easeInOut' }),
    seq('papo-murcho', 'papo', 2.1, 0.4, grow(0.01, 0.5), { ease: 'easeOut' }),

    seq('folhas-saem', 'folhas', 3.7, 0.7, [...grow(0.01, 1), ch('rotation.y', -0.8, 0)], {
      ease: 'easeOut',
      caption: 'A resposta vem pela fenda: uma AVALANCHE de formulários, até soterrá-lo!',
    }),
    seq('montanha-sobe', 'montanha', 3.85, 0.9, [riseFrom(GY, 1.0)], { ease: 'easeOut' }),
    seq('peru-afunda', 'peru', 3.95, 0.8, [ch('position.y', GY, SINK_Y)], { ease: 'easeInOut' }),

    seq('papo-estufa', 'papo', 5.6, 0.6, grow(0.5, 1), {
      ease: 'easeOut',
      caption: 'Ele estufa o papo vermelho e começa a xingar: VIL CA…!',
    }),

    seq('bloco-cai', 'bloco', 6.6, 0.45, [
      ch('position.x', BL_HIT.x, BL_HIT.x),
      ch('position.y', BL_HIT.y + 2.6, BL_HIT.y),
      ch('position.z', BL_HIT.z, BL_HIT.z),
      ch('rotation.z', 0.9, 0.6),
    ], {
      ease: 'easeIn',
      caption: '…mas um bloco de papel despenca no bico e corta o "canalha" no meio.',
    }),
    seq('cabeca-tranco', 'cabeca', 7.05, 0.12, [ch('rotation.x', 0, 0.45)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', 7.17, 0.45, [ch('rotation.x', 0.45, 0)], { ease: 'easeInOut' }),
    seq('bloco-quica', 'bloco', 7.05, 0.55, [
      ch('position.x', BL_HIT.x, bloco.position.x),
      ch('position.y', BL_HIT.y, bloco.position.y),
      ch('position.z', BL_HIT.z, bloco.position.z),
      ch('rotation.z', 0.6, 0),
    ], { ease: 'easeOut' }),

    seq('pa-surge', 'pa', 8.1, 0.35, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Então agarra uma PÁ e cava — PÁ! PÁ! — até o PERU pôr o peito pra fora.',
    }),
    seq('asa-surge', 'asa', 8.1, 0.35, grow(0.01, 1), { ease: 'easeOut' }),
    seq('asa-cava1', 'asa', 8.5, 0.22, [ch('rotation.z', ASA_UP, ASA_DIG)], { ease: 'easeIn' }),
    seq('asa-volta1', 'asa', 8.72, 0.25, [ch('rotation.z', ASA_DIG, ASA_UP)], { ease: 'easeOut' }),
    seq('peru-sobe1', 'peru', 8.6, 0.32, [ch('position.y', SINK_Y, (SINK_Y + PY) / 2)], { ease: 'easeOut' }),
    seq('asa-cava2', 'asa', 9.0, 0.22, [ch('rotation.z', ASA_UP, ASA_DIG)], { ease: 'easeIn' }),
    seq('asa-volta2', 'asa', 9.22, 0.3, [ch('rotation.z', ASA_DIG, ASA_UP)], { ease: 'easeOut' }),
    seq('peru-sobe2', 'peru', 9.1, 0.36, [ch('position.y', (SINK_Y + PY) / 2, PY)], { ease: 'easeOut' }),

    seq('cauda-abre', 'cauda', 10.0, 0.45, [ch('scale.x', 0.35, 1), ch('scale.y', 0.6, 1)], {
      ease: 'easeOut',
      caption: 'Aí BERROU pra janelinha: VER! IÁ? — ele quer VER a lista dos papéis.',
    }),
    seq('aneis-berro', 'aneis', 10.15, 0.6, grow(0.01, 1), { ease: 'easeOut' }),

    seq('fim', 'peru', 11.15, 0.6, [ch('position.y', PY, PY)], {
      caption: 'Vilka papper behöver jag? — De quais papéis eu preciso?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'vilka-papper-behover-jag',
    contexto:
      'Antes de ir ao Skatteverket (personnummer, ID-kort, mudança de endereço), ao Migrationsverket, ao banco ou à matrícula da escola — por telefone ou no balcão, pra não chegar faltando documento. A resposta costuma vir em lista: pass, personbevis, anställningsavtal (contrato de trabalho)…',
    fraseFonte: 'De quais papéis eu preciso?',
    fraseAlvo: 'Vilka papper behöver jag?',
    pronuncia:
      "VÍL-ka PÁP-per be-RRÖÖ-ver iá? ('vilka' com a força no VIL, I curto e L de verdade — língua no céu da boca, nunca 'viu' —, K duro e o -ka fraquinho; 'papper' com a força no PAP, A curto, o P segurado um instante (é dobrado) e o -per fraco com R brando — sem esse R vira 'pappa', pai; 'behöver jag' = be-RRÖÖ-ver-iá: o mesmo 'behöver' de 'Jag behöver ett BankID', com o 'jag' depois do verbo porque é pergunta, fraquinho no fim)",
    ponteSonora:
      "VIL CA(nalha)... PÁ! PER(u)... BERRÔ: VER, IÁ? (8 sílabas: VÍL-ka-PÁP-per-be-RRÖÖ-ver-iá; força no VIL, no PÁ e no RRÔ; VIL = o VILÃO, o MESMO VIL da doninha de 'Vilket spår går tåget från?' (VIL QUE): I CURTO e L DE VERDADE, ponta da língua no céu da boca, nunca 'viu' — e, como lá, com um K logo atrás: é o K que separa 'vilka'/'vilket' (quais/qual) do 'vill' (quer) da bruxa vil e do VÍL-SE (perdido) do gótico de 'Jag har gått vilse'; CA = o xingamento que a pilha de papel cortou — 'VIL CA...nalha!' —: só o CA, K duro e SEM força, fraquinho do jeito que ele já é dentro de 'caNAlha'; PÁ = a PÁ do peru, com toda a força, A aberto e curto — nunca o PÔ fechado de 'på' —, e o P segurado um instante antes do próximo: é o P dobrado de 'papper'; PER(u) = o PERU sem o U, fraquinho, E curto e R brando no fim — é o -per de 'papper', e o R não cai: sem ele sobra 'pappa', que é PAI; BERRÔ: VER = BERROU 'VER!', o MESMO 'behöver' de 'Jag behöver ett BankID', de 'Det är akut' e do ciclope de 'Jag behöver träffa en läkare': BE fraquinho, RR soprado leve (é o h), força no RRÔ de BICO — lábios de Ô com língua de Ê, longo, sem o U do 'ou' —, e o VER fraco, com o R brando; IÁ = o 'jag' de sempre, I de IOGA, nunca J chiado, e fraquinho no fim: na pergunta ele vem DEPOIS do verbo)",
    historia:
      "No guichê do Skatteverket, o peru pergunta quais papéis precisa trazer, e pela janelinha alguém responde com uma avalanche: formulário em cima de formulário, até soterrá-lo. Ele estufa o papo vermelho e começa a xingar — VIL CA...! —, mas um bloco de papel despenca no bico e corta o 'canalha' no meio. Então agarra uma PÁ e cava — PÁ! PÁ! —, até o PERU pôr a cabeça pra fora. Aí BERROU pra janelinha: VER! IÁ? Ele quer VER, numa lista, de quais papéis precisa.",
  },
  createScene,
  refine: { organic: ['peru', 'cabeca', 'papo'] },
}

export default card
