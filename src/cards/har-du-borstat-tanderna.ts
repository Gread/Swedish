import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'

/**
 * "Har du borstat tänderna?" — RRÁR-DÜ? BÓSH… TAT! TÉN-DER-NA?
 *
 * Dez da noite, na porta do banheiro: o tubarão BOSS do mar, de gravata
 * vermelha e corrente de ouro com a plaquinha BOSS, ruge (RRÁR!), espeta a
 * nadadeira no seu nariz (DÜ?), bate a outra na pia uma vez só (TAT!) — e no
 * sorriso de várias fileiras de dentes está entalado um TENDER de Natal
 * (TÉN-DER), preso NA dentadura do chefão.
 *
 * Diorama: piso em xadrez de azulejos azul-claros e brancos, parede de
 * azulejos brancos com listel azul, pia de coluna com espelho redondo de
 * moldura dourada, copo verde com escova amarela, banquinho infantil. O
 * laranja-dourado brilhante do tender é o único acento saturado.
 */

const PLINTO = '#35515f'
const REJUNTE = '#d3dfe3'
const AZULEJO_AZUL = '#a4cbe0'
const AZULEJO_BRANCO = '#f3f6f4'
const PAREDE = '#edf1ee'
const PAREDE_REJ = '#cfdbde'
const LISTEL = '#4f8fac'
const CAPA = '#d7e3e7'
const LOUCA = '#f7f7f3'
const CROMO = '#c3cbd1'
const OURO = '#ddb04c'
const VIDRO = '#bcd3dd'
const VERDE = '#4f9a6c'
const AMARELO = '#f2c230'
const MENTA = '#9fd0c0'
const TOALHA = '#e4d3b5'

const TUB = '#62798b'
const TUB_ESC = '#4a5e6f'
const BARRIGA = '#eef0eb'
const BOCA = '#3b1419'
const GENGIVA = '#a5404f'
const DENTE = '#fbf8ee'
const OLHO = '#111316'
const GRAVATA = '#a8262f'
const GRAVATA_ESC = '#7e1a24'
const LETRA = '#2a1d12'

const GLACE = '#f39a2c' // acento saturado RESERVADO: a casca dourada do TENDER
const RISCO = '#a3501c'
const CRAVO = '#3a2216'

const GY = 0.16 // topo dos azulejos do piso

// tubarão (origem no piso, olhando +z) — levemente virado para a pia
const SX = 0.22
const SZ = -0.42
const SROT = -0.45 // 3/4 de frente: a nadadeira dorsal aparece de perfil contra a parede

// pia de coluna encostada na parede
const PX = -1.15
const PZ = -0.95
const WZ = -1.5 // face da parede
const RIM_Y = 0.86 // topo da borda da cuba (local da pia)

// boca (local do tubarão)
const MY = 1.8
const MA = 0.44 // semi-largura
const MB = 0.24 // semi-altura

const CAM: [number, number, number] = [0.75, 2.3, 4.85]
const TARGET: [number, number, number] = [-0.02, 1.5, -0.5]

// ---- amostragem da superfície do corpo (para colar boca, gravata, corrente) --
const ray = new THREE.Raycaster()
const normalMat = new THREE.Matrix3()
interface Hit { p: THREE.Vector3; n: THREE.Vector3 }

function cast(targets: THREE.Object3D[], origin: THREE.Vector3, dir: THREE.Vector3): Hit {
  const d = dir.clone().normalize()
  ray.set(origin, d)
  const h = ray.intersectObjects(targets, false)[0]
  if (!h || !h.face) return { p: origin.clone(), n: d.negate() }
  normalMat.getNormalMatrix(h.object.matrixWorld)
  return { p: h.point.clone(), n: h.face.normal.clone().applyMatrix3(normalMat).normalize() }
}

/** Orienta o objeto com +z na normal e +y o mais perto possível de `up`. */
function orient(obj: THREE.Object3D, n: THREE.Vector3, up = new THREE.Vector3(0, 1, 0)) {
  const z = n.clone().normalize()
  const x = new THREE.Vector3().crossVectors(up, z).normalize()
  const y = new THREE.Vector3().crossVectors(z, x)
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
}

/**
 * Nadadeira peitoral: pendurada ao longo de -y no repouso; ordem YXZ para
 * rotation.x ser o "levantar" e rotation.y o rumo. Devolve as rotações que
 * apontam a ponta na direção d (no espaço do tubarão), mantendo a lâmina
 * deitada (largura na horizontal).
 */
function aim(d: THREE.Vector3) {
  const n = d.clone().normalize()
  return { x: -Math.acos(THREE.MathUtils.clamp(-n.y, -1, 1)), y: Math.atan2(n.x, n.z) }
}

function makeFin(len: number) {
  const g = new THREE.Group()
  g.rotation.order = 'YXZ'
  // lâmina: gira em torno do próprio eixo para mostrar a face larga à câmera
  const lamina = new THREE.Group()
  g.add(lamina)
  const blade = cone(0.25, len, TUB, { roughness: 0.5 })
  blade.rotation.x = Math.PI // ponta para -y
  blade.position.y = -len / 2 + 0.07
  blade.scale.z = 0.34
  lamina.add(blade)
  const pad = sphere(0.21, TUB, { roughness: 0.5 })
  pad.scale.set(1.1, 1.7, 0.4)
  pad.position.y = -0.24
  lamina.add(pad)
  return { g, lamina }
}

/** Gira a lâmina em torno do eixo da nadadeira até a face larga olhar o ponto `eye`. */
function faceToward(fin: THREE.Group, lamina: THREE.Object3D, eye: THREE.Vector3) {
  const q = new THREE.Quaternion().setFromEuler(fin.rotation)
  const axis = new THREE.Vector3(0, -1, 0).applyQuaternion(q)
  const c = eye.clone().sub(fin.position).normalize()
  c.addScaledVector(axis, -c.dot(axis)).normalize()
  c.applyQuaternion(q.invert())
  lamina.rotation.y = Math.atan2(c.x, c.z)
}

// ---- letras da plaquinha: traço grosso de tubo (arcos + barras) --------------
const LT = 0.013
const LR = 0.034

function arcStroke(start: number, arc: number, x: number, y: number) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(LR, LT, 8, 28, arc), mat(LETRA, { roughness: 0.5 }))
  m.rotation.z = start
  m.position.set(x, y, 0)
  m.castShadow = true
  return m
}

function barStroke(len: number, x: number, y: number, horizontal = false) {
  const c = capsule(LT, len, LETRA, { roughness: 0.5 })
  if (horizontal) c.rotation.z = Math.PI / 2
  c.position.set(x, y, 0)
  return c
}

function letter(which: 'B' | 'O' | 'S') {
  const g = new THREE.Group()
  if (which === 'B') {
    g.add(barStroke(4 * LR, -0.036, 0))
    for (const y of [2 * LR, 0, -2 * LR]) g.add(barStroke(0.036, -0.018, y, true))
    g.add(arcStroke(-Math.PI / 2, Math.PI, 0, LR))
    g.add(arcStroke(-Math.PI / 2, Math.PI, 0, -LR))
  } else if (which === 'O') {
    for (const x of [-LR, LR]) g.add(barStroke(2 * LR, x, 0))
    g.add(arcStroke(0, Math.PI, 0, LR))
    g.add(arcStroke(Math.PI, Math.PI, 0, -LR))
  } else {
    // S: arco de cima abre embaixo à direita, o de baixo abre em cima à esquerda
    g.add(arcStroke(0.5, Math.PI * 1.5 - 0.5, 0, LR))
    g.add(arcStroke(Math.PI * 7 / 6, Math.PI * 4 / 3, 0, -LR))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: piso de azulejos em xadrez ------------------------------------
  const base = new THREE.Group()

  const plinto = rbox(4.8, 0.14, 2.9, 0.05, PLINTO, { roughness: 0.6 })
  plinto.position.set(0, 0.07, -0.2)
  base.add(plinto)

  const rejunte = rbox(4.66, 0.012, 2.76, 0.005, REJUNTE, { roughness: 0.7 })
  rejunte.position.set(0, 0.146, -0.2)
  base.add(rejunte)

  const T = 0.386
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 7; j++) {
      const tile = rbox(T - 0.026, 0.012, T - 0.026, 0.006,
        (i + j) % 2 ? AZULEJO_AZUL : AZULEJO_BRANCO, { roughness: 0.28 })
      tile.position.set((i - 5.5) * T, GY - 0.006, (j - 3) * T - 0.2)
      base.add(tile)
    }
  }
  root.add(base)

  // ---- parede de azulejos brancos com listel azul e toalha -----------------
  const parede = new THREE.Group()
  const WH = 2.15

  const painel = rbox(4.8, WH, 0.16, 0.04, PAREDE, { roughness: 0.32 })
  painel.position.set(0, GY + WH / 2, WZ - 0.08)
  parede.add(painel)

  for (let k = 1; k * 0.3 < WH - 0.05; k++) {
    const linha = rbox(4.72, 0.014, 0.012, 0.004, PAREDE_REJ, { roughness: 0.6 })
    linha.position.set(0, GY + k * 0.3, WZ + 0.004)
    parede.add(linha)
  }
  for (let k = -7; k <= 7; k++) {
    const linha = rbox(0.014, WH - 0.06, 0.012, 0.004, PAREDE_REJ, { roughness: 0.6 })
    linha.position.set(k * 0.3 + 0.15, GY + WH / 2, WZ + 0.004)
    parede.add(linha)
  }

  const listel = rbox(4.78, 0.09, 0.04, 0.012, LISTEL, { roughness: 0.3 })
  listel.position.set(0, GY + 1.2, WZ + 0.012)
  parede.add(listel)

  const capa = rbox(4.86, 0.07, 0.24, 0.025, CAPA, { roughness: 0.4 })
  capa.position.set(0, GY + WH, WZ - 0.08)
  parede.add(capa)

  // porta-toalha cromado + toalha de areia com listras
  const TX = -2.02 // à esquerda do espelho: o lado direito fica limpo para as nadadeiras
  const TY = GY + 1.66
  const barraT = cylinder(0.017, 0.017, 0.62, CROMO, { roughness: 0.18, metalness: 0.85 })
  barraT.rotation.z = Math.PI / 2
  barraT.position.set(TX, TY, WZ + 0.1)
  parede.add(barraT)
  for (const s of [-1, 1]) {
    const haste = cylinder(0.013, 0.013, 0.1, CROMO, { roughness: 0.18, metalness: 0.85 })
    haste.rotation.x = Math.PI / 2
    haste.position.set(TX + s * 0.3, TY, WZ + 0.05)
    parede.add(haste)
  }
  const toalha = rbox(0.5, 0.74, 0.05, 0.025, TOALHA, { roughness: 0.95 })
  toalha.position.set(TX, TY - 0.35, WZ + 0.075)
  parede.add(toalha)
  const aba = rbox(0.52, 0.46, 0.045, 0.025, TOALHA, { roughness: 0.95 })
  aba.position.set(TX, TY - 0.21, WZ + 0.125)
  parede.add(aba)
  for (const y of [TY - 0.36, TY - 0.4]) {
    const listra = rbox(0.525, 0.022, 0.05, 0.008, LISTEL, { roughness: 0.95 })
    listra.position.set(TX, y, WZ + 0.13)
    parede.add(listra)
  }
  root.add(parede)

  // ---- pia de coluna -------------------------------------------------------
  const pia = new THREE.Group()
  pia.position.set(PX, GY, PZ)

  const coluna = lathe(
    [[0, 0], [0.2, 0], [0.21, 0.03], [0.16, 0.1], [0.12, 0.3], [0.125, 0.48], [0.2, 0.6], [0, 0.6]],
    LOUCA,
    { roughness: 0.22 },
  )
  pia.add(coluna)

  const cuba = lathe(
    [
      [0, 0.56], [0.2, 0.56], [0.33, 0.63], [0.41, 0.74], [0.43, 0.82], [0.415, RIM_Y],
      [0.385, RIM_Y], [0.37, 0.82], [0.3, 0.76], [0.15, 0.725], [0, 0.72],
    ],
    LOUCA,
    { roughness: 0.18 },
  )
  cuba.scale.set(1.12, 1, 0.9)
  pia.add(cuba)

  const ralo = cylinder(0.04, 0.04, 0.012, CROMO, { roughness: 0.2, metalness: 0.85 })
  ralo.position.y = 0.728
  pia.add(ralo)

  const LEDGE_Z = WZ - PZ + 0.12
  const prateleira = rbox(1.06, 0.06, 0.24, 0.025, LOUCA, { roughness: 0.2 })
  prateleira.position.set(0, RIM_Y - 0.02, LEDGE_Z)
  pia.add(prateleira)

  // torneira cromada com dois registros
  const TOP = RIM_Y + 0.01
  const tBase = cylinder(0.042, 0.048, 0.05, CROMO, { roughness: 0.15, metalness: 0.9 })
  tBase.position.set(0, TOP + 0.025, LEDGE_Z - 0.03)
  pia.add(tBase)
  const tCol = cylinder(0.027, 0.027, 0.16, CROMO, { roughness: 0.15, metalness: 0.9 })
  tCol.position.set(0, TOP + 0.12, LEDGE_Z - 0.03)
  pia.add(tCol)
  const bico = cylinder(0.022, 0.022, 0.18, CROMO, { roughness: 0.15, metalness: 0.9 })
  bico.rotation.x = Math.PI / 2
  bico.position.set(0, TOP + 0.19, LEDGE_Z + 0.06)
  pia.add(bico)
  const ponta = cylinder(0.027, 0.022, 0.04, CROMO, { roughness: 0.15, metalness: 0.9 })
  ponta.position.set(0, TOP + 0.17, LEDGE_Z + 0.14)
  pia.add(ponta)
  for (const [s, cor] of [[-1, '#c94a3f'], [1, '#3f7fc9']] as const) {
    const registro = sphere(0.038, CROMO, { roughness: 0.15, metalness: 0.9 })
    registro.position.set(s * 0.18, TOP + 0.04, LEDGE_Z - 0.02)
    pia.add(registro)
    const tampa = cylinder(0.017, 0.017, 0.012, cor, { roughness: 0.4 })
    tampa.position.set(s * 0.18, TOP + 0.078, LEDGE_Z - 0.02)
    pia.add(tampa)
  }

  // banquinho infantil na frente da pia (é pergunta de toda noite com criança)
  const banco = new THREE.Group()
  banco.position.set(0.05, 0, 0.72)
  banco.rotation.y = -0.15
  const assento = rbox(0.52, 0.06, 0.32, 0.03, MENTA, { roughness: 0.45 })
  assento.position.y = 0.22
  banco.add(assento)
  for (const s of [-1, 1]) {
    const lado = rbox(0.06, 0.2, 0.3, 0.025, MENTA, { roughness: 0.45 })
    lado.position.set(s * 0.21, 0.1, 0)
    banco.add(lado)
  }
  const pegada = rbox(0.18, 0.012, 0.1, 0.006, '#7fb7a5', { roughness: 0.6 })
  pegada.position.y = 0.256
  banco.add(pegada)
  pia.add(banco)
  root.add(pia)

  // ---- espelho redondo de moldura dourada ----------------------------------
  const espelho = new THREE.Group()
  espelho.position.set(PX, GY + 1.62, WZ + 0.04)

  const vidro = cylinder(0.34, 0.34, 0.02, VIDRO, { roughness: 0.08, metalness: 0.25 })
  vidro.rotation.x = Math.PI / 2
  espelho.add(vidro)
  const moldura = torus(0.345, 0.046, OURO, { roughness: 0.28, metalness: 0.75 })
  espelho.add(moldura)
  const enfeite = sphere(0.045, OURO, { roughness: 0.28, metalness: 0.75 })
  enfeite.position.y = 0.4
  espelho.add(enfeite)
  for (const [w, h, x, y] of [[0.045, 0.32, -0.08, 0.06], [0.026, 0.18, 0.04, 0.12]] as const) {
    const brilho = rbox(w, h, 0.008, 0.012, '#eef6f9', { roughness: 0.1 })
    brilho.position.set(x, y, 0.014)
    brilho.rotation.z = -0.7
    espelho.add(brilho)
  }
  root.add(espelho)

  // ---- copo verde com escova amarela (na prateleira) -----------------------
  const COPO_Y = GY + RIM_Y + 0.01
  const copo = new THREE.Group()
  copo.position.set(PX - 0.38, COPO_Y, PZ + LEDGE_Z)

  const caneca = lathe(
    [[0, 0], [0.07, 0], [0.076, 0.02], [0.086, 0.19], [0.078, 0.2], [0.07, 0.03], [0, 0.03]],
    VERDE,
    { roughness: 0.2 },
  )
  copo.add(caneca)

  const escova = new THREE.Group()
  escova.position.set(0, 0.04, 0)
  escova.rotation.set(0.1, 0, 0.3)
  const cabo = cylinder(0.013, 0.016, 0.34, AMARELO, { roughness: 0.3 })
  cabo.position.y = 0.17
  escova.add(cabo)
  const cabeca = rbox(0.032, 0.08, 0.026, 0.01, AMARELO, { roughness: 0.3 })
  cabeca.position.y = 0.37
  escova.add(cabeca)
  const cerdas = rbox(0.03, 0.066, 0.045, 0.008, '#f8f8f8', { roughness: 0.8 })
  cerdas.position.set(0, 0.372, 0.032)
  escova.add(cerdas)
  const tufo = rbox(0.031, 0.024, 0.047, 0.006, '#4f9fd8', { roughness: 0.8 })
  tufo.position.set(0, 0.395, 0.033)
  escova.add(tufo)
  copo.add(escova)

  // bisnaga de pasta deitada ao lado do copo
  const bisnaga = capsule(0.035, 0.18, '#f4f4f0', { roughness: 0.35 })
  bisnaga.scale.set(1, 1, 0.65)
  bisnaga.rotation.set(0, -0.4, Math.PI / 2)
  bisnaga.position.set(0.16, 0.026, 0.03)
  copo.add(bisnaga)
  const tampinha = cylinder(0.026, 0.026, 0.05, '#3f7fc9', { roughness: 0.4 })
  tampinha.rotation.set(0, -0.4, Math.PI / 2)
  tampinha.position.set(0.28, 0.026, 0.08)
  copo.add(tampinha)
  root.add(copo)

  // ---- TUBARÃO BOSS --------------------------------------------------------
  // montado na origem; posição/rotação só no fim (as amostras de superfície
  // ficam no espaço local dele)
  const tubarao = new THREE.Group()

  const skin: THREE.Mesh[] = []
  const add = (m: THREE.Mesh) => { tubarao.add(m); skin.push(m); return m }

  const alto = add(sphere(0.62, TUB, { roughness: 0.45 }))
  alto.scale.set(1, 1.12, 0.84)
  alto.position.set(0, 1.72, 0)

  const meio = add(sphere(0.48, TUB, { roughness: 0.45 }))
  meio.scale.set(1, 1.3, 0.88)
  meio.position.set(0, 1.08, -0.04)

  const pedunculo = add(capsule(0.18, 0.36, TUB, { roughness: 0.45 }))
  pedunculo.position.set(0, 0.42, -0.06)

  // focinho em ogiva: sobe e avança um pouco por cima da boca
  const focinho = add(sphere(0.44, TUB, { roughness: 0.45 }))
  focinho.scale.set(0.84, 1.1, 0.86)
  focinho.position.set(0, 2.3, 0.06)
  focinho.rotation.x = 0.18

  // barriga branca (peça à parte, fora da fusão: a linha da contrassombra fica
  // limpa): faixa do queixo até a cauda, na face virada pra câmera
  const barrigaG = new THREE.Group()
  tubarao.add(barrigaG)
  const addB = (m: THREE.Mesh) => { barrigaG.add(m); skin.push(m); return m }
  const peito = addB(sphere(0.5, BARRIGA, { roughness: 0.5 }))
  peito.scale.set(0.84, 0.6, 0.6)
  peito.position.set(0, 1.46, 0.23)

  const barriga = addB(sphere(0.5, BARRIGA, { roughness: 0.5 }))
  barriga.scale.set(0.7, 1.3, 0.6)
  barriga.position.set(0, 0.98, 0.17)

  const ventre = addB(sphere(0.2, BARRIGA, { roughness: 0.5 }))
  ventre.scale.set(0.8, 1.4, 0.75)
  ventre.position.set(0, 0.47, 0.04)

  // cauda: dois lobos em meia-lua abertos no chão, pontas curvadas pra cima
  for (const side of [-1, 1]) {
    const lobo = new THREE.Group()
    lobo.position.set(side * 0.1, 0.1, 0.02)
    lobo.rotation.set(0, -side * 0.3, side * 0.36)
    const pa = cylinder(0.04, 0.2, side > 0 ? 0.8 : 0.66, TUB, { roughness: 0.45 }) // ponta cega: o remesh não solta lasca
    pa.rotation.z = -side * Math.PI / 2
    pa.position.x = side * (side > 0 ? 0.4 : 0.33)
    pa.scale.set(0.55, 1, 1.25)
    lobo.add(pa)
    tubarao.add(lobo)
  }

  // nadadeira dorsal alta: perfil clássico (bordo de ataque convexo, bordo de
  // fuga côncavo), extrudado e com chanfro; base afundada nas costas
  {
    const s = new THREE.Shape()
    s.moveTo(-0.04, -0.28)
    s.lineTo(0, 0)
    s.quadraticCurveTo(0.12, 0.52, 0.56, 0.82)
    s.quadraticCurveTo(0.36, 0.42, 0.52, 0.0)
    s.lineTo(0.56, -0.28)
    s.closePath()
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.09, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 3, curveSegments: 16,
    })
    geo.translate(0, 0, -0.045)
    const dorsalG = new THREE.Group()
    dorsalG.position.set(0, 2.5, -0.24)
    dorsalG.rotation.x = -0.85
    const dorsal = new THREE.Mesh(geo, mat(TUB, { roughness: 0.45, size: 0.8 }))
    dorsal.rotation.y = Math.PI / 2
    dorsal.castShadow = true
    dorsal.receiveShadow = true
    dorsalG.add(dorsal)
    tubarao.add(dorsalG)
  }

  tubarao.updateMatrixWorld(true)
  const front = (x: number, y: number) =>
    cast(skin, new THREE.Vector3(x, y, 3), new THREE.Vector3(0, 0, -1))

  // espaço local do tubarão já na pose final (para mirar câmera e pia)
  const tubMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(SX, GY, SZ),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), SROT),
    new THREE.Vector3(1, 1, 1),
  )
  const toLocal = (v: THREE.Vector3) => v.clone().applyMatrix4(tubMatrix.clone().invert())
  const camLocal = toLocal(new THREE.Vector3(...CAM))

  // olhinhos pretos redondos (com brilho) e sobrancelha de chefe
  for (const side of [-1, 1]) {
    const h = front(side * 0.3, 2.14)
    const olho = sphere(0.068, OLHO, { roughness: 0.12 })
    olho.position.copy(h.p).addScaledVector(h.n, 0.012)
    tubarao.add(olho)
    const luz = sphere(0.018, '#ffffff', { roughness: 0.1 })
    const paraCam = camLocal.clone().sub(olho.position).normalize()
    luz.position.copy(olho.position).addScaledVector(paraCam, 0.056).add(new THREE.Vector3(0, 0.026, 0))
    tubarao.add(luz)
    const sobr = capsule(0.026, 0.12, TUB_ESC, { roughness: 0.5 })
    const hs = front(side * 0.29, 2.26)
    sobr.position.copy(hs.p).addScaledVector(hs.n, 0.01)
    sobr.rotation.z = Math.PI / 2 + side * 0.38
    tubarao.add(sobr)
  }

  // guelras: três fendas de cada lado, bem na lateral
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const yk = 1.6 - k * 0.1
      const dir = new THREE.Vector3(-side * 0.9, 0, -0.42)
      const h = cast(skin, new THREE.Vector3(0, yk, 0).addScaledVector(dir, -3), dir)
      const fenda = capsule(0.014, 0.13 - k * 0.015, '#3a4a58', { roughness: 0.6 })
      fenda.position.copy(h.p).addScaledVector(h.n, 0.004)
      fenda.rotation.z = side * 0.15
      tubarao.add(fenda)
    }
  }

  // ---- bocarra (peça): fundo escuro colado na pele, gengiva, 2 fileiras ------
  const z0 = front(0, MY).p.z
  const bocarra = new THREE.Group()
  bocarra.position.set(0, MY, 0)
  tubarao.add(bocarra)

  // fundo da boca: casca elíptica que acompanha a curvatura do corpo
  {
    const RINGS = 8
    const SEGS = 48
    const pos: number[] = []
    const idx: number[] = []
    for (let r = 0; r <= RINGS; r++) {
      for (let s = 0; s < SEGS; s++) {
        const k = (r / RINGS) * 1.02
        const a = (s / SEGS) * Math.PI * 2
        const x = Math.cos(a) * MA * k
        const y = Math.sin(a) * MB * k
        pos.push(x, y, front(x, MY + y).p.z + 0.03)
      }
    }
    for (let r = 0; r < RINGS; r++) {
      for (let s = 0; s < SEGS; s++) {
        const a = r * SEGS + s
        const b = r * SEGS + ((s + 1) % SEGS)
        const c = a + SEGS
        const d = b + SEGS
        idx.push(a, c, b, b, c, d) // face +z (para a câmera)
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setIndex(idx)
    geo.computeVertexNormals()
    const fundo = new THREE.Mesh(geo, mat(BOCA, { roughness: 0.7 }))
    fundo.receiveShadow = true
    bocarra.add(fundo)
  }

  // gengiva: tubo fechado sobre o contorno
  {
    const pts: THREE.Vector3[] = []
    for (let s = 0; s < 48; s++) {
      const a = (s / 48) * Math.PI * 2
      const x = Math.cos(a) * MA
      const y = Math.sin(a) * MB
      pts.push(new THREE.Vector3(x, y, front(x, MY + y).p.z + 0.028))
    }
    const labio = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.032, 10, true),
      mat(GENGIVA, { roughness: 0.45 }),
    )
    labio.castShadow = true
    labio.receiveShadow = true
    bocarra.add(labio)
  }

  // dentes triangulares: fileira da frente + fileira de trás intercalada
  const toothAt = (a: number, ka: number, kb: number, size: number, lift: number) => {
    const x = Math.cos(a) * MA * ka
    const y = Math.sin(a) * MB * kb
    const h = front(x, MY + y)
    const dir = new THREE.Vector3(-Math.cos(a) * 0.45, -Math.sin(a), 0).normalize()
    const dente = cone(0.044 * size, 0.13 * size, DENTE, { roughness: 0.28 })
    dente.scale.z = 0.45
    dente.rotation.order = 'YXZ'
    dente.rotation.y = Math.atan2(h.n.x, h.n.z)
    dente.rotation.z = Math.atan2(-dir.x, dir.y)
    dente.position.set(x + dir.x * 0.05 * size, y + dir.y * 0.05 * size, h.p.z + lift)
    bocarra.add(dente)
  }
  for (let i = 0; i < 9; i++) {
    const t = i / 8
    toothAt(THREE.MathUtils.lerp(0.4, Math.PI - 0.4, t), 0.95, 0.92, 1.3, 0.045)
    toothAt(THREE.MathUtils.lerp(Math.PI + 0.4, Math.PI * 2 - 0.4, t), 0.95, 0.92, 1.3, 0.045)
  }
  for (let i = 0; i < 8; i++) {
    const t = (i + 0.5) / 8
    toothAt(THREE.MathUtils.lerp(0.4, Math.PI - 0.4, t), 0.84, 0.66, 1.0, 0.03)
    toothAt(THREE.MathUtils.lerp(Math.PI + 0.4, Math.PI * 2 - 0.4, t), 0.84, 0.66, 1.0, 0.03)
  }

  // ---- TENDER de Natal entalado de canto a canto (peça) -----------------------
  const HA = 0.43
  const HB = 0.2
  const HC = 0.21
  const TZ = z0 - 0.09
  const tender = new THREE.Group()
  tender.position.set(0, MY + 0.005, TZ)
  tender.rotation.z = 0.05
  tubarao.add(tender)

  const presunto = sphere(1, GLACE, { roughness: 0.22, size: 0.6 })
  presunto.scale.set(HA, HB, HC)
  tender.add(presunto)

  const onHam = (x: number, y: number, lift: number) => {
    const q = 1 - (x * x) / (HA * HA) - (y * y) / (HB * HB)
    if (q <= 0) return null
    const z = HC * Math.sqrt(q)
    // normal do elipsoide
    const n = new THREE.Vector3(x / (HA * HA), y / (HB * HB), z / (HC * HC)).normalize()
    return new THREE.Vector3(x, y, z).addScaledVector(n, lift)
  }

  // riscos em losango: duas famílias de diagonais projetadas na casca
  const SLOPE = 0.62
  for (const sgn of [-1, 1]) {
    for (let b = -0.24; b <= 0.2401; b += 0.08) {
      const pts: THREE.Vector3[] = []
      for (let x = -HA; x <= HA; x += 0.01) {
        const y = sgn * SLOPE * x + b
        if ((x * x) / (HA * HA) + (y * y) / (HB * HB) > 0.92) continue
        const p = onHam(x, y, 0.003)
        if (p) pts.push(p)
      }
      if (pts.length < 4) continue
      const risco = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.0075, 6, false),
        mat(RISCO, { roughness: 0.4 }),
      )
      risco.castShadow = true
      tender.add(risco)
    }
  }
  // cravos no meio de cada losango
  for (let b1 = -0.2; b1 <= 0.2001; b1 += 0.08) {
    for (let b2 = -0.2; b2 <= 0.2001; b2 += 0.08) {
      // interseção de y = SLOPE x + b1 com y = -SLOPE x + b2
      const x = (b2 - b1) / (2 * SLOPE)
      const y = (b1 + b2) / 2
      if ((x * x) / (HA * HA) + (y * y) / (HB * HB) > 0.8) continue
      const p = onHam(x, y, 0.006)
      if (!p) continue
      const cravo = sphere(0.016, CRAVO, { roughness: 0.6 })
      cravo.position.copy(p)
      tender.add(cravo)
      const estrela = rbox(0.034, 0.009, 0.009, 0.003, CRAVO, { roughness: 0.6 })
      estrela.position.copy(p).add(new THREE.Vector3(0, 0, 0.008))
      estrela.rotation.z = 0.8
      tender.add(estrela)
    }
  }

  // raminho de azevinho: o "de Natal" do tender
  {
    const p = onHam(0.2, 0.05, 0.0)!
    const ramo = new THREE.Group()
    ramo.position.copy(p)
    ramo.rotation.set(-0.2, 0.35, 0)
    for (const s of [-1, 1]) {
      const folha = sphere(0.05, '#2f6b3a', { roughness: 0.4 })
      folha.scale.set(1.6, 0.55, 0.25)
      folha.position.set(s * 0.055, 0.012, 0.01)
      folha.rotation.z = s * 0.35
      ramo.add(folha)
    }
    for (const [bx, by] of [[0, 0.028], [-0.022, 0.006], [0.022, 0.008]] as const) {
      const baga = sphere(0.021, '#cf2b2b', { roughness: 0.25 })
      baga.position.set(bx, by, 0.03)
      ramo.add(baga)
    }
    tender.add(ramo)
  }

  // ---- gravata vermelha (peça; origem no nó, desenrola pra baixo) -------------
  const kn = front(0, 1.47)
  const gravata = new THREE.Group()
  gravata.position.copy(kn.p).addScaledVector(kn.n, 0.035)
  tubarao.add(gravata)

  const no = rbox(0.13, 0.11, 0.07, 0.03, GRAVATA, { roughness: 0.55 })
  orient(no, kn.n)
  gravata.add(no)

  const blade = (y1: number, y2: number, w: number) => {
    const a = front(0, y1)
    const b = front(0, y2)
    const pa = a.p.clone().addScaledVector(a.n, 0.03)
    const pb = b.p.clone().addScaledVector(b.n, 0.03)
    const len = pa.distanceTo(pb)
    const seg = rbox(w, len + 0.04, 0.03, 0.012, GRAVATA, { roughness: 0.55 })
    const up = pa.clone().sub(pb).normalize()
    const nAvg = a.n.clone().add(b.n).normalize()
    const x = new THREE.Vector3().crossVectors(up, nAvg).normalize()
    const z = new THREE.Vector3().crossVectors(x, up)
    seg.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, up, z))
    seg.position.copy(pa).add(pb).multiplyScalar(0.5).sub(gravata.position)
    // listras diagonais
    for (let k = 0; k < 3; k++) {
      const listra = rbox(w + 0.01, 0.022, 0.034, 0.006, GRAVATA_ESC, { roughness: 0.55 })
      listra.position.set(0, (k - 1) * len * 0.3, 0.002)
      listra.rotation.z = 0.55
      listra.scale.x = 0.98
      seg.add(listra)
    }
    gravata.add(seg)
    return { pb, z }
  }
  blade(1.42, 1.06, 0.13)
  const baixo = blade(1.06, 0.74, 0.16)
  const ponteira = rbox(0.115, 0.115, 0.03, 0.012, GRAVATA, { roughness: 0.55 })
  ponteira.position.copy(baixo.pb).sub(gravata.position)
  orient(ponteira, baixo.z)
  ponteira.rotateZ(Math.PI / 4)
  gravata.add(ponteira)

  // ---- corrente de ouro grossa com a plaquinha BOSS (peça) --------------------
  const corrente = new THREE.Group()
  tubarao.add(corrente)

  const CY0 = 1.07
  const CK = 1.75
  {
    const dense: { p: THREE.Vector3; n: THREE.Vector3 }[] = []
    for (let s = -0.45; s <= 0.4501; s += 0.006) {
      const h = front(s, CY0 + CK * s * s)
      dense.push({ p: h.p.clone().addScaledVector(h.n, 0.028), n: h.n })
    }
    let acc = 0
    let next = 0
    let k = 0
    for (let i = 1; i < dense.length; i++) {
      acc += dense[i].p.distanceTo(dense[i - 1].p)
      if (acc < next) continue
      next += 0.062
      const t = dense[Math.min(i + 1, dense.length - 1)].p.clone().sub(dense[i - 1].p).normalize()
      const n = dense[i].n.clone()
      n.addScaledVector(t, -n.dot(t)).normalize()
      const elo = torus(0.03, 0.011, OURO, { roughness: 0.25, metalness: 0.8 })
      elo.scale.x = 1.35
      const basis = k % 2 === 0
        ? new THREE.Matrix4().makeBasis(t, new THREE.Vector3().crossVectors(n, t), n)
        : new THREE.Matrix4().makeBasis(t, n, new THREE.Vector3().crossVectors(t, n))
      elo.quaternion.setFromRotationMatrix(basis)
      elo.position.copy(dense[i].p)
      corrente.add(elo)
      k++
    }
  }

  const placaHit = front(0, CY0 - 0.15)
  const placa = new THREE.Group()
  placa.position.copy(placaHit.p).addScaledVector(placaHit.n, 0.06)
  orient(placa, placaHit.n.clone().add(new THREE.Vector3(0, 0.12, 0)).normalize())
  corrente.add(placa)

  const chapa = rbox(0.56, 0.25, 0.045, 0.045, OURO, { roughness: 0.28, metalness: 0.7 })
  placa.add(chapa)
  const argola = torus(0.032, 0.011, OURO, { roughness: 0.25, metalness: 0.8 })
  argola.rotation.y = Math.PI / 2
  argola.position.set(0, 0.145, 0)
  placa.add(argola)
  const word: ['B' | 'O' | 'S', number][] = [['B', -0.17], ['O', -0.057], ['S', 0.057], ['S', 0.17]]
  for (const [g, lx] of word) {
    const l = letter(g)
    l.position.set(lx, 0, 0.026)
    placa.add(l)
  }

  // ---- nadadeiras peitorais (peças) ----------------------------------------

  // esquerda do tubarão (+x, o lado virado pra câmera): repousa caída e
  // depois espeta na sua direção — ~45° fora da linha de visada (para cima e
  // para a direita), senão a nadadeira some em escorço
  const OMBRO_A = new THREE.Vector3(0.5, 1.42, 0.1)
  const REST_A = aim(new THREE.Vector3(0.45, -0.85, 0.28))
  const POINT_A = (() => {
    const ombroW = OMBRO_A.clone().applyMatrix4(tubMatrix)
    const v = new THREE.Vector3(...CAM).sub(ombroW).normalize()
    const lado = new THREE.Vector3(1, 0.25, 0)
    lado.addScaledVector(v, -lado.dot(v)).normalize()
    const dW = v.multiplyScalar(Math.cos(0.72)).addScaledVector(lado, Math.sin(0.72))
    return aim(dW.applyAxisAngle(new THREE.Vector3(0, 1, 0), -SROT))
  })()
  const { g: finAponta, lamina: laminaA } = makeFin(1.05)
  finAponta.position.copy(OMBRO_A)
  finAponta.rotation.set(POINT_A.x, POINT_A.y, 0)
  faceToward(finAponta, laminaA, camLocal)
  tubarao.add(finAponta)

  // direita (-x): apoiada na borda da pia, atrás à esquerda
  const OMBRO_P = new THREE.Vector3(-0.5, 1.42, 0.06)
  const ang = 0.3
  const borda = toLocal(new THREE.Vector3(
    PX + Math.cos(ang) * 0.4 * 1.12,
    GY + RIM_Y + 0.05,
    PZ + Math.sin(ang) * 0.4 * 0.9,
  ))
  const toRim = borda.clone().sub(OMBRO_P)
  const REST_P = aim(toRim)
  const UP_P = aim(new THREE.Vector3(toRim.x, 0.25 * toRim.length(), toRim.z))
  const { g: finPia, lamina: laminaP } = makeFin(toRim.length() + 0.08)
  finPia.position.copy(OMBRO_P)
  finPia.rotation.set(REST_P.x, REST_P.y, 0)
  faceToward(finPia, laminaP, camLocal)
  tubarao.add(finPia)

  tubarao.position.set(SX, GY, SZ)
  tubarao.rotation.y = SROT
  root.add(tubarao)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'banheiro', object: base },
    { name: 'parede', group: 'banheiro', object: parede },
    { name: 'pia', group: 'pia', object: pia },
    { name: 'espelho', group: 'pia', object: espelho },
    { name: 'copo', group: 'pia', object: copo },
    { name: 'tubarao', group: 'tubarao', object: tubarao },
    { name: 'barriga', group: 'tubarao', object: barrigaG },
    { name: 'finAponta', group: 'tubarao', object: finAponta },
    { name: 'finPia', group: 'tubarao', object: finPia },
    { name: 'gravata', group: 'boss', object: gravata },
    { name: 'corrente', group: 'boss', object: corrente },
    { name: 'bocarra', group: 'rrar', object: bocarra },
    { name: 'tender', group: 'tender', object: tender },
  ]

  const s3 = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Dez da noite: sobe um banheiro de azulejos azul-claros e brancos.',
    }),
    seq('parede-rise', 'parede', 0.25, 0.9, [riseFrom(0, 2.5)], { ease: 'easeOut' }),

    seq('pia-rise', 'pia', 1.5, 0.8, [riseFrom(GY, 1.2)], {
      ease: 'easeOut',
      caption: 'A pia de coluna, o espelho de moldura dourada e a escova amarela esperando no copo.',
    }),
    seq('espelho-cresce', 'espelho', 1.8, 0.55, s3(0.01, 1), { ease: 'easeOut' }),
    seq('copo-cai', 'copo', 2.1, 0.5, [ch('position.y', COPO_Y + 0.7, COPO_Y)], { ease: 'easeIn' }),

    seq('tubarao-rise', 'tubarao', 3.2, 1.0, [riseFrom(GY, 3.1), ch('rotation.y', SROT - 1.6, SROT)], {
      ease: 'easeOut',
      caption: 'Na porta do banheiro, brota ele: o tubarão, em pé sobre a cauda…',
    }),
    seq('finAponta-cresce', 'finAponta', 3.65, 0.5, [
      ch('scale.y', 0.05, 1), ch('rotation.x', REST_A.x, REST_A.x), ch('rotation.y', REST_A.y, REST_A.y),
    ], { ease: 'easeOut' }),
    seq('finPia-cresce', 'finPia', 3.75, 0.5, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),

    seq('gravata-desce', 'gravata', 4.9, 0.6, [ch('scale.y', 0.05, 1)], {
      ease: 'easeOut',
      caption: '…de gravata vermelha e corrente de ouro no peito: é o BOSS do mar — BÓSH!',
    }),
    seq('corrente-cai', 'corrente', 5.25, 0.6, [ch('position.y', 1.1, 0)], { ease: 'easeIn' }),

    seq('bocarra-abre', 'bocarra', 6.7, 0.45, [ch('scale.y', 0.05, 1), ch('scale.x', 0.7, 1)], {
      ease: 'easeOut',
      caption: 'Ele solta um rugido curto — RRÁR! — e espeta a nadadeira no seu nariz: DÜ?',
    }),
    seq('finAponta-espeta', 'finAponta', 7.15, 0.5, [
      ch('rotation.x', REST_A.x, POINT_A.x), ch('rotation.y', REST_A.y, POINT_A.y),
    ], { ease: 'easeOut' }),

    seq('finPia-ergue', 'finPia', 8.6, 0.4, [ch('rotation.x', REST_P.x, UP_P.x), ch('rotation.y', REST_P.y, UP_P.y)], {
      ease: 'easeOut',
      caption: 'Enquanto espera, bate a outra nadadeira na pia, uma vez só, seco: TAT!',
    }),
    seq('finPia-bate', 'finPia', 9.1, 0.15, [ch('rotation.x', UP_P.x, REST_P.x), ch('rotation.y', UP_P.y, REST_P.y)], {
      ease: 'easeIn',
    }),
    seq('copo-pula', 'copo', 9.25, 0.14, [ch('position.y', COPO_Y, COPO_Y + 0.08)], { ease: 'easeOut' }),
    seq('copo-pousa', 'copo', 9.39, 0.2, [ch('position.y', COPO_Y + 0.08, COPO_Y)], { ease: 'easeIn' }),

    seq('tender-entala', 'tender', 10.3, 0.6, [...s3(0.01, 1), ch('position.z', TZ + 0.9, TZ)], {
      ease: 'easeOut',
      caption: 'Mas no sorriso de várias fileiras, entalado NA dentadura do chefão: um TENDER de Natal — TÉN-DER-NA!',
    }),

    seq('finAponta-recua', 'finAponta', 12.0, 0.22, [ch('rotation.x', POINT_A.x, POINT_A.x + 0.3)], {
      ease: 'easeOut',
      caption: 'Har du borstat tänderna? — Você escovou os dentes?',
    }),
    seq('finAponta-insiste', 'finAponta', 12.22, 0.28, [ch('rotation.x', POINT_A.x + 0.3, POINT_A.x)], {
      ease: 'easeIn',
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
    id: 'har-du-borstat-tanderna',
    contexto:
      'Família: toda noite antes de dormir e toda manhã, na porta do banheiro; também é a pergunta da tandsköterska na consulta da criança na Folktandvården.',
    fraseFonte: 'Você escovou os dentes?',
    fraseAlvo: 'Har du borstat tänderna?',
    pronuncia:
      "rrar-dü BÓSH-tat TÉN-de-na? ('har du' cola na fala: rrá-dü, h soprado e o R derretendo no d; 'borstat' com Ó aberto e curto e o 'rs' virando X: BÓSH-tat, com o T final; 'tänderna' com É aberto, e o 'rn' do fim derrete num N só: TÉN-de-na; força no BÓSH e no TÉN)",
    ponteSonora:
      "RRÁR-DÜ? BÓSH... TAT! TÉN-DER-NA? (7 batidas: rrar-dü-BÓSH-tat-TÉN-de-na; tônicas no BÓSH e no TÉN; RRÁR-DÜ = o 'har du' de sempre, o MESMO de 'Har du tid en stund?': o rugido curto com h soprado, A longo e R BRANDO que derrete direto no D, rrá-dü; sem esse R sobra 'ha', outro verbo; DÜ com BICO de pato; BÓSH = o BOSS do mar, dito como o carioca diz 'o boss tá...': Ó ABERTO e curto, e o S chiando em X de xarope porque vem um T atrás; é o 'rs' sueco, que sempre vira X (o mesmo de FEIXE-THOR, 'förstår', e de ÚÚÚ-XAK, 'orsak'); TAT = UMA batida seca da nadadeira na pia, T seco de 'tatu', nunca 'tchi', e esse T do fim não cai: 'borstat' (escovou), não 'borsta' (escovar); TÉN-DER = o TENDER de Natal, mas com É ABERTO de 'pé' e N na ponta da língua, sem o 'tẽ' nasal do português: é o 'tänder' (dentes); NA = o artigo colado no fim, agora no plural, 'OS dentes' (como o -N de 'skolan' e 'jackan'), e o R antes dele não soa: a ponta da língua já vai enrolada pra trás e cai direto no N, como o R que cai no T de CLÁR-T ('självklart'): TÉN-de-na)",
    historia:
      'Dez da noite, e na porta do banheiro está ele: o tubarão, o BOSS do mar, de gravata vermelha e corrente de ouro. Ele solta um rugido curto, RRÁR!, e espeta a nadadeira no seu nariz: DÜ? Enquanto espera a resposta, bate a outra nadadeira na pia, uma vez só, seco: TAT! Mas quando abre o sorriso de sete fileiras de dentes, lá está, entalado NA dentadura do próprio chefão, um TENDER de Natal inteiro, com cravo e tudo. E quem pergunta é ele: você escovou os dentes?',
  },
  createScene,
  refine: { organic: ['tubarao', 'finAponta', 'finPia'] },
}

export default card
