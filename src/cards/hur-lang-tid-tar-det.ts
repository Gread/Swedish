import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, mat,
  box, rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Hur lång tid tar det?" — RRÜR?! LÓNG... (par)TÍD... TAR-DÊ?
 *
 * Sala de espera do Skatteverket às quatro da tarde. A garça pegou senha às
 * oito e o painel continua no 001. Ela bufa pelo bico (RRÜR, dois anéis de
 * fumaça), estica o pescoço LONG, LONGUÍSSIMO, por cima dos postes da fila até
 * a linha de largada, onde a bandeira quadriculada da parTÍDa segue erguida —
 * e pela janela larga o sol já afunda no Mälaren: é TAR-DÊ.
 *
 * Composição: a garça de perfil à direita, o pescoço cortando a janela na
 * horizontal (branco contra o céu do entardecer), a cabeça à esquerda sobre a
 * bandeira. O acento laranja saturado é reservado ao SOL (a TARDE).
 * Diferente de 'Hur långt är det?' (hamster na trilha em T, ao ar livre):
 * aqui é interior, burocracia, e o LONG é um pescoço — sem T.
 */

const LINO = '#9eabb6'
const LINO_ESC = '#86949f'
const LINO_BORDA = '#5b6672'
const PAREDE = '#eadcbf'
const LAMBRI = '#b9c4c4'
const LAMBRI_ESC = '#a3b0b1'
const RODAPE = '#6f7d84'
const CAIXILHO = '#f4f2ec'
const AGUA = '#3f4a7c'
const ILHA = '#4b3f63'
const CIDADE = '#45385a'
const SOL = '#ff7417' // acento: o sol da TARDE
const SOL_HALO = '#ffb067'
const BRANCO = '#f6f6f2'
const BRANCO_SOMBRA = '#e4e8ec'
const AMARELO = '#e8bf55' // bico e pernas
const IRIS = '#f0c02c'
const PRETO = '#1f2125'
const XADREZ = '#f1f0ea'
const CROMO = '#d3d8de'
const FITA = '#2f4a7d'
const LED = '#ff3a2e'
const LED_APAGADO = '#261b1c'
const FUMACA = '#aeb4bd'
const PAPEL = '#f3ecd9'

const GY = 0.16 // topo do linóleo

// parede do fundo e janela larga
const WZ = -1.2 // face da frente da parede
const WT = 0.12
const WALL_X = 2.18
const WALL_TOP = 3.2
const WX0 = -2.0
const WX1 = 1.15
const WY0 = 0.95
const WY1 = 2.5
const OUT_Z = WZ - WT - 0.1 // plano do céu lá fora
const HORIZON = 1.2

// sol: desce de trás da parede até ficar meio afundado no horizonte
const SUN_X = -0.5
const SUN_Z = OUT_Z + 0.02
const SUN_TOP = 2.78
const SUN_R = 0.24

// garça (de perfil, olhando para -x)
const HX = 1.0
const HZ = 0.15
const ELBOW = new THREE.Vector3(-0.78, 1.72, 0) // onde o pescoço vira horizontal
const NECK_L = 1.4
const S0 = 0.14 // pescoço "normal", antes de esticar
const HEAD_DX = -0.09
const HEAD_DY = 0.03
const HEAD_X0 = ELBOW.x - S0 * NECK_L + HEAD_DX
const HEAD_X1 = ELBOW.x - NECK_L + HEAD_DX
const HEAD_Y = ELBOW.y + HEAD_DY
const HEAD_TILT = 0.28 // bico inclinado para baixo, olhando a bandeira

// fila: postes, linha de largada, bandeira
const POSTS: [number, number][] = [[0.2, 0.6], [-0.47, -0.45], [-1.14, 0.6]]
const LINE_X = -1.6
const LINE_Z0 = -1.02
const LINE_N = 21
const SQ_LINE = 0.11
const FLAG_X = -1.92
const FLAG_Z = -0.32
const POLE_H = 1.3

const CAM: [number, number, number] = [-0.45, 1.74, 4.4]
const TARGET: [number, number, number] = [-0.08, 1.28, 0]

const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b (pernas, dedos). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/**
 * Tubo liso que afina de r0 a r1 ao longo de uma curva (o S do pescoço).
 * Fica aberto nas pontas — escondidas no peito e na junta do pescoço —, então
 * o refino o trata como detalhe e ele continua liso, sem o relevo de argila.
 */
function taperTube(pts: THREE.Vector3[], r0: number, r1: number, color: string, opts: MatOpts) {
  const curve = new THREE.CatmullRomCurve3(pts)
  const segs = 40
  const radial = 18
  const geo = new THREE.TubeGeometry(curve, segs, 1, radial, false)
  const pos = geo.attributes.position
  const c = new THREE.Vector3()
  const p = new THREE.Vector3()
  for (let i = 0; i <= segs; i++) {
    curve.getPointAt(i / segs, c)
    const r = r0 + (r1 - r0) * (i / segs)
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j
      p.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c)
      pos.setXYZ(k, p.x, p.y, p.z)
    }
  }
  pos.needsUpdate = true
  geo.computeBoundingSphere()
  const m = new THREE.Mesh(geo, mat(color, { ...opts, size: 0.6 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Dígito de sete segmentos (só 0 e 1): acesos em vermelho, apagados em fantasma. */
function digit(n: 0 | 1) {
  const g = new THREE.Group()
  const W = 0.12
  const H = 0.2
  const T = 0.026
  const segs: Record<string, [number, number, number, number]> = {
    a: [0, H / 2, W - T * 0.5, T],
    g: [0, 0, W - T * 0.5, T],
    d: [0, -H / 2, W - T * 0.5, T],
    f: [-W / 2, H / 4, T, H / 2 - T * 0.5],
    b: [W / 2, H / 4, T, H / 2 - T * 0.5],
    e: [-W / 2, -H / 4, T, H / 2 - T * 0.5],
    c: [W / 2, -H / 4, T, H / 2 - T * 0.5],
  }
  const on = n === 0 ? 'abcdef' : 'bc'
  for (const [k, [x, y, w, h]] of Object.entries(segs)) {
    const lit = on.includes(k)
    const s = lit
      ? rbox(w, h, 0.012, 0.006, LED, { emissive: LED, emissiveIntensity: 1.3 })
      : rbox(w, h, 0.008, 0.004, LED_APAGADO, { roughness: 0.6 })
    s.position.set(x, y, lit ? 0.004 : 0)
    g.add(s)
  }
  return g
}

/** Poste de fila: base pesada, haste cromada, cabeçote do cassete da fita. */
function stanchion() {
  const g = new THREE.Group()
  const pe = lathe(
    [[0, 0], [0.16, 0], [0.165, 0.018], [0.12, 0.04], [0.045, 0.055], [0, 0.055]],
    '#8a929b',
    { roughness: 0.35, metalness: 0.7 },
  )
  g.add(pe)
  const haste = cylinder(0.024, 0.026, 0.84, CROMO, { roughness: 0.32, metalness: 0.6 })
  haste.position.y = 0.055 + 0.42
  g.add(haste)
  const cabecote = cylinder(0.045, 0.045, 0.11, CROMO, { roughness: 0.32, metalness: 0.6 })
  cabecote.position.y = 0.93
  g.add(cabecote)
  const tampa = sphere(0.045, CROMO, { roughness: 0.32, metalness: 0.6 })
  tampa.scale.y = 0.45
  tampa.position.y = 0.985
  g.add(tampa)
  const anel = torus(0.046, 0.008, '#7d858f', { roughness: 0.3, metalness: 0.8 })
  anel.rotation.x = Math.PI / 2
  anel.position.y = 0.875
  g.add(anel)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- sala de espera: piso de linóleo, parede, janela larga --------------
  const base = new THREE.Group()

  const laje = cylinder(2.62, 2.7, 0.12, LINO_BORDA, { roughness: 0.8 })
  laje.position.y = 0.06
  base.add(laje)
  const lino = cylinder(2.56, 2.58, 0.04, LINO, { roughness: 0.55 })
  lino.position.y = GY - 0.02
  base.add(lino)

  // juntas das placas de linóleo (cordas do disco, sem sair dele)
  for (let i = -4; i <= 4; i++) {
    const c = i * 0.58
    const half = Math.sqrt(Math.max(0.01, 2.5 * 2.5 - c * c))
    const jx = rbox(half * 2, 0.006, 0.016, 0.003, LINO_ESC, { roughness: 0.7 })
    jx.position.set(0, GY + 0.002, c)
    base.add(jx)
    const jz = rbox(0.016, 0.006, half * 2, 0.003, LINO_ESC, { roughness: 0.7 })
    jz.position.set(c, GY + 0.002, 0)
    base.add(jz)
  }

  // parede: lambri cinza-esverdeado embaixo, creme em cima, vão da janela
  const WCZ = WZ - WT / 2
  const lambri = box(WALL_X * 2, WY0 - GY, WT, LAMBRI, { roughness: 0.75 })
  lambri.position.set(0, GY + (WY0 - GY) / 2, WCZ)
  base.add(lambri)
  const esq = box(WX0 + WALL_X, WALL_TOP - WY0, WT, PAREDE, { roughness: 0.85 })
  esq.position.set((-WALL_X + WX0) / 2, WY0 + (WALL_TOP - WY0) / 2, WCZ)
  base.add(esq)
  const dir = box(WALL_X - WX1, WALL_TOP - WY0, WT, PAREDE, { roughness: 0.85 })
  dir.position.set((WALL_X + WX1) / 2, WY0 + (WALL_TOP - WY0) / 2, WCZ)
  base.add(dir)
  const topo = box(WX1 - WX0, WALL_TOP - WY1, WT, PAREDE, { roughness: 0.85 })
  topo.position.set((WX0 + WX1) / 2, WY1 + (WALL_TOP - WY1) / 2, WCZ)
  base.add(topo)

  // frisos: rodapé, faixas do lambri e o peitoril que corre a parede toda
  const rodape = rbox(WALL_X * 2, 0.1, 0.04, 0.012, RODAPE, { roughness: 0.6 })
  rodape.position.set(0, GY + 0.05, WZ + 0.02)
  base.add(rodape)
  for (let i = 0; i < 9; i++) {
    const x = -WALL_X + 0.24 + i * ((WALL_X * 2 - 0.48) / 8)
    const ripa = rbox(0.018, WY0 - GY - 0.2, 0.012, 0.005, LAMBRI_ESC, { roughness: 0.75 })
    ripa.position.set(x, GY + 0.1 + (WY0 - GY - 0.2) / 2, WZ + 0.006)
    base.add(ripa)
  }
  const peitoril = rbox(WALL_X * 2, 0.05, 0.12, 0.018, CAIXILHO, { roughness: 0.45 })
  peitoril.position.set(0, WY0 - 0.01, WZ + 0.045)
  base.add(peitoril)

  // caixilho branco: moldura, dois montantes
  const W = WX1 - WX0
  const H = WY1 - WY0
  const molduraTopo = rbox(W + 0.16, 0.08, 0.05, 0.02, CAIXILHO, { roughness: 0.45 })
  molduraTopo.position.set((WX0 + WX1) / 2, WY1 + 0.04, WZ + 0.02)
  base.add(molduraTopo)
  for (const x of [WX0 - 0.04, WX1 + 0.04]) {
    const lado = rbox(0.08, H + 0.02, 0.05, 0.02, CAIXILHO, { roughness: 0.45 })
    lado.position.set(x, WY0 + H / 2, WZ + 0.02)
    base.add(lado)
  }
  for (const k of [1, 2]) {
    const montante = rbox(0.055, H, 0.06, 0.015, CAIXILHO, { roughness: 0.45 })
    montante.position.set(WX0 + (W * k) / 3, WY0 + H / 2, WCZ)
    base.add(montante)
  }
  const travessa = rbox(W, 0.05, 0.06, 0.015, CAIXILHO, { roughness: 0.45 })
  travessa.position.set((WX0 + WX1) / 2, WY0 + 0.025, WCZ)
  base.add(travessa)

  // lá fora: céu do entardecer em faixas, água do Mälaren, ilha, a cidade
  const ceu = ['#f6b46c', '#f09872', '#d97c7e', '#b06c8e', '#86679c', '#5f5e98', '#47538c']
  const bandH = (WY1 + 0.15 - HORIZON + 0.05) / ceu.length
  ceu.forEach((cor, i) => {
    const faixa = box(W + 0.4, bandH + 0.004, 0.02, cor, { emissive: cor, emissiveIntensity: 0.45 })
    faixa.position.set((WX0 + WX1) / 2, HORIZON - 0.05 + bandH * (i + 0.5), OUT_Z)
    base.add(faixa)
  })
  const agua = box(W + 0.4, HORIZON - WY0 + 0.1, 0.02, AGUA, { emissive: AGUA, emissiveIntensity: 0.2 })
  agua.position.set((WX0 + WX1) / 2, (HORIZON + WY0 - 0.1) / 2, OUT_Z + 0.06)
  base.add(agua)
  // ilha baixa à esquerda (atrás de onde a bandeira se recorta)
  const ilha = sphere(0.5, ILHA, { roughness: 0.9, detail: 0 })
  ilha.scale.set(1.3, 0.16, 0.05)
  ilha.position.set(-1.55, HORIZON, OUT_Z + 0.04)
  base.add(ilha)
  // casario de Estocolmo à direita, com uma torre de pináculo
  const predios: [number, number, number][] = [
    [0.28, 0.2, 0.14], [0.47, 0.18, 0.24], [0.64, 0.16, 0.17], [0.84, 0.22, 0.28], [1.06, 0.24, 0.2],
  ]
  for (const [x, w, h] of predios) {
    const p = box(w, h, 0.02, CIDADE, { roughness: 0.9, detail: 0 })
    p.position.set(x, HORIZON + h / 2 - 0.01, OUT_Z + 0.05)
    base.add(p)
  }
  const torre = box(0.07, 0.36, 0.02, CIDADE, { roughness: 0.9, detail: 0 })
  torre.position.set(0.66, HORIZON + 0.18, OUT_Z + 0.045)
  base.add(torre)
  const pinaculo = cone(0.05, 0.14, CIDADE, { roughness: 0.9, detail: 0 }, 4)
  pinaculo.position.set(0.66, HORIZON + 0.43, OUT_Z + 0.045)
  base.add(pinaculo)
  for (const [x, y] of [[0.47, 1.37], [0.84, 1.42], [1.0, 1.33], [0.3, 1.27]] as const) {
    const luz = box(0.03, 0.03, 0.01, '#ffd27a', { emissive: '#ffcf70', emissiveIntensity: 0.9 })
    luz.position.set(x, y, OUT_Z + 0.062)
    base.add(luz)
  }

  // senhas velhas amassadas no chão
  for (const [x, z, s] of [[1.55, 0.62, 1], [0.72, 0.92, 2], [1.95, 0.05, 3]] as const) {
    const bola = puff(0.035, PAPEL, 3, s, { roughness: 0.8 })
    bola.position.set(x, GY + 0.03, z)
    base.add(bola)
  }

  root.add(base)

  // ---- linha de largada quadriculada (desenrola do fundo para a frente) ---
  const linha = new THREE.Group()
  linha.position.set(LINE_X, 0, LINE_Z0)
  const faixaLinha = rbox(SQ_LINE * 2 + 0.03, 0.008, SQ_LINE * LINE_N + 0.03, 0.004, XADREZ, { roughness: 0.5 })
  faixaLinha.position.set(0, GY + 0.004, (SQ_LINE * LINE_N) / 2)
  linha.add(faixaLinha)
  for (let r = 0; r < LINE_N; r++) {
    const quad = rbox(SQ_LINE, 0.011, SQ_LINE, 0.003, PRETO, { roughness: 0.5 })
    quad.position.set((r % 2 === 0 ? -1 : 1) * SQ_LINE * 0.5, GY + 0.005, (r + 0.5) * SQ_LINE)
    linha.add(quad)
  }
  root.add(linha)

  // ---- postes de fila com a fita em zigue-zague ---------------------------
  const postes = new THREE.Group()
  for (const [x, z] of POSTS) {
    const p = stanchion()
    p.position.set(x, GY, z)
    postes.add(p)
  }
  for (let i = 0; i < POSTS.length - 1; i++) {
    const [ax, az] = POSTS[i]
    const [bx, bz] = POSTS[i + 1]
    const dx = bx - ax
    const dz = bz - az
    const len = Math.hypot(dx, dz)
    const fita = rbox(len - 0.08, 0.05, 0.008, 0.003, FITA, { roughness: 0.6 })
    fita.position.set((ax + bx) / 2, GY + 0.9, (az + bz) / 2)
    fita.rotation.y = Math.atan2(-dz, dx)
    postes.add(fita)
  }
  root.add(postes)

  // ---- painel de senha: 001 em vermelho -----------------------------------
  const painel = new THREE.Group()
  painel.position.set(1.68, 2.02, WZ + 0.06)
  const caixa = rbox(0.68, 0.34, 0.08, 0.03, PRETO, { roughness: 0.4 })
  painel.add(caixa)
  const visor = rbox(0.6, 0.26, 0.01, 0.01, '#0d0e10', { roughness: 0.25 })
  visor.position.z = 0.04
  painel.add(visor)
  ;([0, 0, 1] as const).forEach((n, i) => {
    const d = digit(n)
    d.position.set(-0.17 + i * 0.17, 0, 0.047)
    painel.add(d)
  })
  for (const sx of [-1, 1]) {
    const suporte = rbox(0.05, 0.05, 0.08, 0.01, '#3a3d42', { roughness: 0.5, metalness: 0.5 })
    suporte.position.set(sx * 0.22, 0, -0.07)
    painel.add(suporte)
  }
  root.add(painel)

  // ---- a GARÇA (de perfil, olhando para -x) -------------------------------
  const garca = new THREE.Group()
  garca.position.set(HX, GY, HZ)
  root.add(garca)

  const pena = { roughness: 0.7 }

  // corpo esguio: fuso inclinado (peito alto, cauda baixa)
  const tronco = sphere(0.3, BRANCO, pena)
  tronco.scale.set(1.65, 0.86, 0.76)
  tronco.position.set(0.08, 1.06, 0)
  tronco.rotation.z = -0.3
  garca.add(tronco)

  const peito = sphere(0.17, BRANCO, pena)
  peito.position.set(-0.22, 1.1, 0)
  garca.add(peito)

  const barriga = sphere(0.18, BRANCO, pena)
  barriga.scale.set(1.35, 0.75, 0.9)
  barriga.position.set(0.02, 0.92, 0)
  garca.add(barriga)

  // asas dobradas, rentes ao corpo, e as primárias longas por cima da cauda
  for (const side of [-1, 1]) {
    const asa = sphere(0.27, BRANCO_SOMBRA, pena)
    asa.scale.set(1.62, 0.68, 0.28)
    asa.position.set(0.13, 1.07, side * 0.165)
    asa.rotation.z = -0.27
    garca.add(asa)

    const primarias = capsule(0.045, 0.38, BRANCO_SOMBRA, pena)
    primarias.scale.set(1, 1, 0.45)
    primarias.rotation.z = -Math.PI / 2 - 0.36
    primarias.position.set(0.58, 0.94, side * 0.12)
    garca.add(primarias)
  }

  const cauda = sphere(0.12, BRANCO_SOMBRA, pena)
  cauda.scale.set(1.35, 0.42, 0.85)
  cauda.position.set(0.58, 0.9, 0)
  cauda.rotation.z = -0.4
  garca.add(cauda)

  // o S do pescoço, do peito até a junta onde ele vira horizontal
  const sNeck = taperTube(
    [v(-0.3, 1.1), v(-0.4, 1.33), v(-0.42, 1.53), v(-0.5, 1.67), v(-0.64, 1.72), ELBOW.clone()],
    0.095, 0.065, BRANCO, pena,
  )
  garca.add(sNeck)
  // colarinho de penas na raiz do pescoço: a pele fundida abraça o tubo e a
  // emenda vira um anel em volta do pescoço, não um vinco ao longo do peito
  garca.add(limb(v(-0.29, 1.08), v(-0.39, 1.29), 0.115, BRANCO, pena))

  // coxas emplumadas
  const coxaApoio = sphere(0.1, BRANCO, pena)
  coxaApoio.position.set(0.05, 0.84, -0.07)
  garca.add(coxaApoio)
  const coxaDobrada = sphere(0.1, BRANCO, pena)
  coxaDobrada.position.set(-0.06, 0.85, 0.08)
  garca.add(coxaDobrada)

  // ---- pernas amarelas + senha: peça rígida à parte (finas demais para o
  // refino, e o bake de oclusão sob a barriga as deixaria pretas)
  const pernas = new THREE.Group()
  garca.add(pernas)

  // perna de apoio (lado de trás): tíbia, junta, tarso e dedos abertos
  const pernaOpts = { roughness: 0.5 }
  const jApoio = v(0.1, 0.44, -0.07)
  pernas.add(limb(v(0.06, 0.8, -0.07), jApoio, 0.026, AMARELO, pernaOpts))
  const juntaApoio = sphere(0.034, AMARELO, pernaOpts)
  juntaApoio.position.copy(jApoio)
  pernas.add(juntaApoio)
  const pe = v(0.04, 0.035, -0.07)
  pernas.add(limb(jApoio, pe, 0.024, AMARELO, pernaOpts))
  for (const [tx, tz] of [[-0.15, -0.07], [-0.11, 0.05], [-0.11, -0.19], [0.13, -0.07]] as const) {
    pernas.add(limb(v(0.04, 0.018, -0.07), v(tx, 0.016, tz), 0.014, AMARELO, pernaOpts))
  }

  // perna dobrada (lado da câmera) segurando o papelzinho da senha
  const jDobra = v(-0.16, 0.56, 0.16)
  pernas.add(limb(v(-0.06, 0.8, 0.1), jDobra, 0.026, AMARELO, pernaOpts))
  const juntaDobra = sphere(0.034, AMARELO, pernaOpts)
  juntaDobra.position.copy(jDobra)
  pernas.add(juntaDobra)
  const peDobra = v(-0.4, 0.68, 0.19)
  pernas.add(limb(jDobra, peDobra, 0.024, AMARELO, pernaOpts))

  const senha = new THREE.Group()
  senha.position.set(-0.48, 0.73, 0.21)
  senha.rotation.z = 0.22
  const papel = rbox(0.13, 0.18, 0.006, 0.008, PAPEL, { roughness: 0.7 })
  senha.add(papel)
  for (const [y, w] of [[0.045, 0.07], [0.0, 0.08], [-0.045, 0.05]] as const) {
    const impresso = rbox(w, 0.016, 0.004, 0.003, '#55504a', { roughness: 0.7 })
    impresso.position.set(0, y, 0.004)
    senha.add(impresso)
  }
  pernas.add(senha)
  for (const [tx, ty] of [[-0.47, 0.76], [-0.5, 0.71], [-0.46, 0.665]] as const) {
    pernas.add(limb(peDobra, v(tx, ty, 0.226), 0.012, AMARELO, pernaOpts))
  }

  // ---- pescoço horizontal: estica a partir da junta -----------------------
  const pescoco = new THREE.Group()
  pescoco.position.copy(ELBOW)
  garca.add(pescoco)
  const haste = cylinder(0.05, 0.064, NECK_L, BRANCO, pena)
  haste.rotation.z = Math.PI / 2
  haste.position.x = -NECK_L / 2
  pescoco.add(haste)
  const junta = sphere(0.065, BRANCO, pena)
  pescoco.add(junta)
  const ponta = sphere(0.05, BRANCO, pena)
  ponta.position.x = -NECK_L
  pescoco.add(ponta)

  // ---- cabeça: bico amarelo entreaberto, olho de impaciência --------------
  const cabeca = new THREE.Group()
  cabeca.position.set(HEAD_X1, HEAD_Y, 0)
  cabeca.rotation.z = HEAD_TILT
  garca.add(cabeca)

  const cranio = sphere(0.13, BRANCO, pena)
  cranio.scale.set(1.3, 0.92, 0.85)
  cabeca.add(cranio)
  const bochecha = sphere(0.085, BRANCO, pena)
  bochecha.position.set(-0.09, -0.03, 0)
  cabeca.add(bochecha)

  // bico-adaga: mandíbula de cima reta, a de baixo caída (bico entreaberto)
  const BASE_BICO = -0.14
  const bicoSup = cone(0.05, 0.5, AMARELO, { roughness: 0.35 })
  bicoSup.rotation.z = Math.PI / 2
  bicoSup.scale.set(0.85, 1, 0.75)
  bicoSup.position.set(BASE_BICO - 0.25, 0.016, 0)
  cabeca.add(bicoSup)
  const ABRE = 0.17
  const bicoInf = cone(0.04, 0.44, '#d9a93f', { roughness: 0.4 })
  bicoInf.rotation.z = Math.PI / 2 + ABRE
  bicoInf.scale.set(0.85, 1, 0.75)
  bicoInf.position.set(BASE_BICO + 0.01 - Math.cos(ABRE) * 0.22, -0.022 - Math.sin(ABRE) * 0.22, 0)
  cabeca.add(bicoInf)
  const boca = sphere(0.03, '#6a3030', { roughness: 0.6 })
  boca.scale.set(2.6, 0.7, 0.75)
  boca.position.set(-0.22, -0.022, 0)
  cabeca.add(boca)

  // olho amarelo com pálpebra caída e sobrancelha franzida (lado da câmera)
  const iris = sphere(0.036, IRIS, { roughness: 0.25 })
  iris.scale.z = 0.55
  iris.position.set(-0.045, 0.03, 0.093)
  cabeca.add(iris)
  const pupila = sphere(0.017, '#121212', { roughness: 0.2 })
  pupila.position.set(-0.054, 0.027, 0.111)
  cabeca.add(pupila)
  const brilho = sphere(0.007, '#ffffff', { roughness: 0.1 })
  brilho.position.set(-0.06, 0.04, 0.12)
  cabeca.add(brilho)
  const palpebra = sphere(0.039, BRANCO, pena)
  palpebra.scale.set(1.1, 0.55, 0.62)
  palpebra.position.set(-0.045, 0.053, 0.094)
  palpebra.rotation.z = 0.35
  cabeca.add(palpebra)
  const sobrancelha = capsule(0.012, 0.065, '#c9d0d7', { roughness: 0.6 })
  sobrancelha.rotation.z = Math.PI / 2 + 0.4
  sobrancelha.position.set(-0.045, 0.088, 0.088)
  cabeca.add(sobrancelha)

  // penachos da nuca
  for (const [z, a] of [[-0.025, 0.4], [0.025, 0.52]] as const) {
    const ini = v(0.13, 0.04, z)
    cabeca.add(limb(ini, ini.clone().add(v(Math.cos(a) * 0.2, -Math.sin(a) * 0.2, 0)), 0.011, BRANCO, pena))
  }

  // ---- o bufo: dois anéis de fumaça subindo do bico -----------------------
  const bufo = new THREE.Group()
  bufo.position.set(-0.27, 0.0, 0)
  bufo.rotation.z = -HEAD_TILT // anéis alinhados com o mundo, não com o bico
  cabeca.add(bufo)
  const anel1 = torus(0.05, 0.016, FUMACA, { roughness: 0.95 })
  anel1.position.set(0.02, 0.17, 0.03)
  anel1.rotation.set(0.15, 0.35, 0.2)
  bufo.add(anel1)
  const anel2 = torus(0.075, 0.02, FUMACA, { roughness: 0.95 })
  anel2.position.set(0.08, 0.36, 0.05)
  anel2.rotation.set(-0.1, 0.4, -0.25)
  bufo.add(anel2)

  // ---- bandeira quadriculada da parTÍDa -----------------------------------
  const bandeira = new THREE.Group()
  bandeira.position.set(FLAG_X, GY, FLAG_Z)
  root.add(bandeira)
  const pedestal = lathe(
    [[0, 0], [0.13, 0], [0.135, 0.02], [0.1, 0.045], [0.03, 0.06], [0, 0.06]],
    '#3a3d42',
    { roughness: 0.4, metalness: 0.6 },
  )
  bandeira.add(pedestal)
  const mastro = cylinder(0.018, 0.02, POLE_H, PRETO, { roughness: 0.35, metalness: 0.6 })
  mastro.position.y = 0.05 + POLE_H / 2
  bandeira.add(mastro)
  const ponteira = sphere(0.032, CROMO, { roughness: 0.2, metalness: 0.85 })
  ponteira.position.y = 0.05 + POLE_H + 0.02
  bandeira.add(ponteira)

  // pano em pregas: 4 colunas de 3 quadrados, voando para a direita (sob o bico)
  const SQ = 0.125
  const pano = new THREE.Group()
  pano.position.set(0.012, 0.05 + POLE_H - 0.03, 0)
  bandeira.add(pano)
  const dobras = [0.38, -0.32, 0.34, -0.26]
  let px = 0
  let pz = 0
  dobras.forEach((a, c) => {
    const sx = Math.cos(a) * SQ
    const sz = -Math.sin(a) * SQ
    const cx = px + sx / 2
    const cz = pz + sz / 2
    const tira = rbox(SQ + 0.008, SQ * 3, 0.008, 0.003, XADREZ, { roughness: 0.75 })
    tira.position.set(cx, -SQ * 1.5, cz)
    tira.rotation.y = a
    pano.add(tira)
    for (let r = 0; r < 3; r++) {
      if ((c + r) % 2 !== 0) continue
      const quad = rbox(SQ + 0.008, SQ, 0.014, 0.003, PRETO, { roughness: 0.75 })
      quad.position.set(cx, -SQ * (r + 0.5), cz)
      quad.rotation.y = a
      pano.add(quad)
    }
    px += sx
    pz += sz
  })

  // ---- o sol da TARDE (acento) e o reflexo na água -----------------------
  const sol = new THREE.Group()
  sol.position.set(SUN_X, HORIZON, SUN_Z)
  root.add(sol)
  const disco = cylinder(SUN_R, SUN_R, 0.02, SOL, { emissive: SOL, emissiveIntensity: 1.15 }, 48)
  disco.rotation.x = Math.PI / 2
  sol.add(disco)
  const halo = cylinder(SUN_R * 1.5, SUN_R * 1.5, 0.01, SOL_HALO, { emissive: SOL_HALO, emissiveIntensity: 0.55 }, 48)
  halo.rotation.x = Math.PI / 2
  halo.position.z = -0.012
  sol.add(halo)

  const reflexo = new THREE.Group()
  reflexo.position.set(SUN_X, 0, OUT_Z + 0.075)
  root.add(reflexo)
  for (const [y, w] of [[HORIZON - 0.05, 0.36], [HORIZON - 0.11, 0.26], [HORIZON - 0.17, 0.16], [HORIZON - 0.22, 0.08]] as const) {
    const brilhoAgua = rbox(w, 0.022, 0.006, 0.008, '#ff9a4a', { emissive: '#ff9a4a', emissiveIntensity: 0.9 })
    brilhoAgua.position.y = y
    reflexo.add(brilhoAgua)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'linha', group: 'fila', object: linha },
    { name: 'postes', group: 'fila', object: postes },
    { name: 'painel', group: 'fila', object: painel },
    { name: 'garca', group: 'garca', object: garca },
    { name: 'pernas', group: 'garca', object: pernas },
    { name: 'pescoco', group: 'garca', object: pescoco },
    { name: 'cabeca', group: 'garca', object: cabeca },
    { name: 'bufo', group: 'bufo', object: bufo },
    { name: 'bandeira', group: 'partida', object: bandeira },
    { name: 'sol', group: 'tarde', object: sol },
    { name: 'reflexo', group: 'tarde', object: reflexo },
  ]

  // ---- montagem ------------------------------------------------------------
  const NECK_AT = 5.8
  const NECK_DUR = 1.5
  const build = [
    seq('base-sobe', 'base', 0, 0.9, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Sala de espera do Skatteverket: piso de linóleo, parede creme e uma janela larga.',
    }),

    seq('linha-pinta', 'linha', 1.3, 0.7, [ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'A fila serpenteia entre postes até a linha de largada. E o painel de senha? Parado no 001.',
    }),
    seq('postes-sobem', 'postes', 1.35, 0.7, [riseFrom(0, 1.2)], { ease: 'easeOut' }),
    seq('painel-acende', 'painel', 1.7, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('garca-sobe', 'garca', 3.0, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'No fim da fila, a garça: numa perna só, com a senha das oito da manhã na outra.',
    }),
    seq('pernas-surgem', 'pernas', 3.0, 0.9, [ch('position.y', 0, 0)]),
    seq('pescoco-surge', 'pescoco', 3.0, 0.9, [ch('scale.x', S0, S0)]),
    seq('cabeca-surge', 'cabeca', 3.0, 0.9, [
      ch('position.x', HEAD_X0, HEAD_X0), ch('rotation.z', -0.45, -0.1),
    ], { ease: 'easeOut' }),

    seq('bufo-sai', 'bufo', 4.5, 0.7, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'O painel não anda. Ela solta um bufo pelo bico: RRÜR?!',
    }),

    seq('pescoco-estica', 'pescoco', NECK_AT, NECK_DUR, [ch('scale.x', S0, 1)], {
      ease: 'easeInOut',
      caption: 'E estica o pescoço LONG, LONGUÍSSIMO, por cima dos postes da fila inteira…',
    }),
    seq('cabeca-vai', 'cabeca', NECK_AT, NECK_DUR, [
      ch('position.x', HEAD_X0, HEAD_X1), ch('rotation.z', -0.1, HEAD_TILT),
    ], { ease: 'easeInOut' }),

    seq('bandeira-sobe', 'bandeira', 7.7, 0.7, [riseFrom(GY, 1.8)], {
      ease: 'easeOut',
      caption: '…até a largada: a bandeira quadriculada da parTÍDa continua erguida — o atendimento nem largou!',
    }),
    seq('bandeira-tremula-a', 'bandeira', 8.4, 0.35, [ch('rotation.y', 0, 0.45)], { ease: 'easeOut' }),
    seq('bandeira-tremula-b', 'bandeira', 8.75, 0.45, [ch('rotation.y', 0.45, -0.25)]),
    seq('bandeira-tremula-c', 'bandeira', 9.2, 0.4, [ch('rotation.y', -0.25, 0)], { ease: 'easeOut' }),

    seq('sol-se-poe', 'sol', 10.0, 1.6, [ch('position.y', SUN_TOP, HORIZON)], {
      ease: 'easeInOut',
      caption: 'Pela janela, o sol já afunda na água: é TAR-DÊ.',
    }),
    seq('reflexo-abre', 'reflexo', 11.3, 0.5, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),

    seq('cabeca-pergunta', 'cabeca', 12.1, 0.6, [ch('rotation.x', 0, 0.25)], {
      ease: 'easeOut',
      caption: 'Hur lång tid tar det? — Quanto tempo demora?',
    }),
  ]

  cabeca.rotation.x = 0.25

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'hur-lang-tid-tar-det',
    contexto:
      "Burocracia: no servicekontor do Skatteverket, no Migrationsverket, na polícia (passaporte), no banco ou na oficina — quanto tempo leva o processo, o atendimento ou o conserto. A resposta costuma vir no mesmo molde: 'Det tar ungefär två veckor' (leva umas duas semanas).",
    fraseFonte: 'Quanto tempo demora?',
    fraseAlvo: 'Hur lång tid tar det?',
    pronuncia:
      "rrür lóng TÍÍD tar dê? ('hur' com h soprado, Ü de bico — lábios de U, língua de I — e o R brando quase sumindo antes do L; 'lång' com Ó ABERTO e CURTO de 'só' — nunca o 'lõ' nasal de 'longo' — e o NG no fundo da boca, sem 'gui'; 'tid' com T seco de 'tatu' (nunca 'tchi'), I LONGO e D leve; a força da pergunta fica no LÓNG e no TÍD; 'tar det' sai num bloco só e fraco: o R de 'tar' enrola a língua pra trás e se funde no D — é o 'rd' sueco, um 'ta-dê' de língua dobrada —, e 'det' = dê, sem T)",
    ponteSonora:
      "RRÜR?! LÓNG... (par)TÍD... TAR-DÊ? (5 sílabas: rrür-LÓNG-TÍÍD-tar-dê; força no LÓNG e no TÍD, e o TAR-DÊ sai junto e fraquinho; RRÜR é o 'hur' de sempre — o MESMO de 'Hur kommer jag till Storgatan?', 'Hur bokar man tvättstugan?' e 'Hur långt är det?' —, aqui o bufo que sai pelo BICO da garça: RR soprado leve (é o h), Ü DE BICO — lábios de U, língua de I, nunca o U chapado de 'urso' — e o R brando do fim quase some, derretendo no L; LÓNG = o pescoço LONGUÍSSIMO, o MESMO LONG da Sâmara de 'Kan du prata lite långsammare?', dito como o 'long' de 'long neck': Ó ABERTO e CURTO de 'só', nunca o 'lõ' nasal e fechado de 'longo', e o NG no fundo da boca, sem soltar 'gui'; e aqui o LONG vem SEM T colado: o T que soa logo depois já é o começo do TÍD — LONG-T, com o T grudado, é a trilha do hamster de 'Hur långt är det?' (longe); pescoço LONG + parTÍD é TEMPO; TÍD = o parTÍD(a) da bandeira quadriculada, a MESMA ponte de 'Har du tid en stund?', 'Smaklig måltid' e 'Jag skulle vilja boka en tid': só o pedaço forte, T SECO de 'tatu' (nunca 'tchi'), I LONGO e D leve; TAR-DÊ = a TARDE do pôr do sol, mas dita do jeito que o sueco emenda 'tar det': o TAR com o R CAIPIRA de 'porta', a língua enrolada pra trás que cai direto no D — é o 'rd' sueco, o mesmo do BÚR'D de 'Ett bord för två' —, e o DÊ com D DURO e Ê FECHADO, o DÊ do 'det' de sempre: pense em 'tar' + 'dê', duas pecinhas coladas, e não na palavra 'tarde' do dia a dia, que no Rio e em São Paulo sai 'TÁH-dji', soprando o R e chiando o D; o R não pode sumir — sem ele sobra 'ta det', que é 'pega isso!' —, mas o TARDE inteiro vem fraco: a pergunta já gastou a força no LÓNG TÍD)",
    historia:
      'A garça pegou senha às oito da manhã no Skatteverket e, às quatro da tarde, o painel continua parado no número 1. Ela solta um bufo pelo bico — RRÜR?! — e estica o pescoço LONG, LONGUÍSSIMO, por cima dos postes da fila inteira, até a linha de largada lá na frente: a bandeira quadriculada da parTÍDa continua erguida, o atendimento nem largou! Devagar, ela recolhe o pescoço e olha pela janela: o sol está se pondo, já é TARDE. E ela só quer saber uma coisa: quanto tempo, afinal, isso vai demorar?',
  },
  createScene,
  refine: { organic: ['garca', 'cabeca'] },
}

export default card
