import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, rock, puff,
} from '../rig/helpers'
import type { MatOpts } from '../rig/helpers'

/**
 * "Ring 112!" — R-R-RING! ÉT! ÉT! T'VÔO!
 *
 * Madrugada na fazenda: os dois cilindros de ÉTER pegam fogo e as chamas
 * comem o -ER das etiquetas (sobra ÉT e ÉT). O ganso de guarda morde a corda
 * do sino e puxa — R-R-RING! — e decola de asas abertas: T'VÔO!
 *
 * A cena é o próprio número, lido da esquerda para a direita: cilindro,
 * cilindro, pescoço de ganso curvado em 2 → 1, 1, 2.
 */

const TERRA = '#5e4632'
const TERRA_CLARA = '#6f553d'
const TERRA_ESC = '#4a3726'
const PALHA = '#b99e62'
const FALU = '#7e2a20' // vermelho de galpão sueco, apagado pela noite
const FALU_ESC = '#5f1e17'
const CREME = '#d8ccb6'
const TELHADO = '#2f2b2e'
const ACO = '#6f8291' // aço pintado, cinza-azulado
const ACO_ESC = '#3e4852'
const LATAO = '#b8913f'
const ETIQUETA = '#f2ede1'
const TINTA = '#1e1b1a'
const CARVAO = '#2b221d'
const MADEIRA = '#4a3524'
const MADEIRA_ESC = '#38281b'
const BRONZE = '#b8862f'
const CORDA = '#cdb48a'
const GANSO = '#f5f2ea'
const GANSO_SOMBRA = '#dcd7cc'
const BICO = '#e88a35'
// acento saturado RESERVADO ao fogo (e ao som que ele dispara)
const FOGO_EXT = '#ff5a1c'
const FOGO_MEIO = '#ff9526'
const FOGO_NUCLEO = '#ffe26a'
const SOM = '#ffd23a'

const GY = 0.14 // topo do pátio
const CYL_R = 0.165
const CYL_H = 1.6 // corpo do cilindro (sem a válvula)
const LABEL_Y = 0.8 // centro da etiqueta, acima do pátio
const CYL1: [number, number] = [-1.5, 0.05]
const CYL2: [number, number] = [-0.98, 0.02]
const CAM: [number, number, number] = [-0.15, 1.95, 4.9]

// ganso: origem no centro do corpo, olhando para -x
const GOOSE_X = 0.35
const GOOSE_Z = 0.12
const Y_FLY = GY + 0.86 // pose final: patas fora do chão
const Y_STAND = GY + 0.52 // pousado (patas no pátio)

// pescoço em forma de 2 (coordenadas locais do ganso, plano xy)
const NECK_C = new THREE.Vector2(-0.17, 0.84)
const NECK_R = 0.33
const BEAK_ANGLE = 0.72 // cabeça girada: o bico aponta para baixo-esquerda

// sino
const BELL_TILT = 0.25
const CLAPPER = 0.42 // do pivô até a argola do badalo

/** Casca de cilindro aberta entre os ângulos a0..a1 (0 = +z, cresce para +x). */
function shell(r: number, h: number, a0: number, a1: number, color: string, opts: MatOpts = {}) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, h, 48, 1, true, a0, a1 - a0),
    mat(color, { size: h, ...opts }),
  )
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cápsula ligando dois pontos — elos do pescoço, corda, pernas. */
function link(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.012, 0.004, TINTA, { roughness: 0.7 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

const LH = 0.14 // altura da letra
const LW = 0.072 // largura da letra
const LT = 0.025 // espessura do traço

/** É, T, E, R — letras de traço grosso. */
function letter(which: 'É' | 'T' | 'E' | 'R') {
  const g = new THREE.Group()
  const top = LH / 2 - LT / 2
  if (which === 'É' || which === 'E') {
    g.add(stroke(LT, LH, -LW / 2 + LT / 2, 0))
    g.add(stroke(LW, LT, 0, top))
    g.add(stroke(LW * 0.82, LT, -LW * 0.09, 0))
    g.add(stroke(LW, LT, 0, -top))
    if (which === 'É') g.add(stroke(0.022, 0.058, 0.008, LH / 2 + 0.045, -0.75))
  } else if (which === 'T') {
    g.add(stroke(LW + 0.01, LT, 0, top))
    g.add(stroke(LT, LH, 0, 0))
  } else {
    g.add(stroke(LT, LH, -LW / 2 + LT / 2, 0))
    g.add(stroke(LW * 0.8, LT, -LW * 0.1, top))
    g.add(stroke(LW * 0.8, LT, -LW * 0.1, 0.004))
    g.add(stroke(LT, 0.062, LW / 2 - LT / 2, 0.038))
    g.add(stroke(LT, 0.085, LW / 2 - LT / 2 - 0.012, -0.045, 0.42))
  }
  return g
}

/** Ângulo (em torno de y) da direção do ponto (x,z) para a câmera. */
function facing(x: number, z: number) {
  return Math.atan2(CAM[0] - x, CAM[2] - z)
}

/** Cilindro de éter: corpo torneado, válvula de latão, etiqueta ÉTER. */
function makeCylinder(x: number, z: number) {
  const g = new THREE.Group()
  g.position.set(x, GY, z)

  const corpo = lathe(
    [
      [0, 0], [CYL_R - 0.03, 0], [CYL_R - 0.01, 0.015], [CYL_R, 0.06], [CYL_R, CYL_H - 0.28],
      [CYL_R - 0.008, CYL_H - 0.19], [CYL_R - 0.035, CYL_H - 0.12], [CYL_R - 0.08, CYL_H - 0.065],
      [0.068, CYL_H - 0.035], [0.064, CYL_H], [0, CYL_H],
    ],
    ACO,
    { roughness: 0.42, metalness: 0.35 },
  )
  g.add(corpo)

  // pé e ombro pintados
  const pe = cylinder(CYL_R + 0.012, CYL_R + 0.018, 0.07, ACO_ESC, { roughness: 0.5, metalness: 0.4 })
  pe.position.y = 0.035
  g.add(pe)
  const ombro = shell(CYL_R + 0.004, 0.09, 0, Math.PI * 2, ACO_ESC, { roughness: 0.45, metalness: 0.4 })
  ombro.position.y = CYL_H - 0.34
  g.add(ombro)
  for (const sy of [0.4, CYL_H - 0.36]) {
    const aro = torus(CYL_R + 0.004, 0.009, ACO_ESC, { roughness: 0.4, metalness: 0.6 })
    aro.rotation.x = Math.PI / 2
    aro.position.y = sy
    g.add(aro)
  }

  // válvula de latão com a saída lateral apontando para baixo-esquerda (a
  // "bandeirinha" do 1)
  const valvula = cylinder(0.05, 0.058, 0.11, LATAO, { roughness: 0.3, metalness: 0.8 })
  valvula.position.y = CYL_H + 0.05
  g.add(valvula)
  const bico = capsule(0.028, 0.1, LATAO, { roughness: 0.3, metalness: 0.8 })
  bico.position.set(-0.085, CYL_H + 0.06, 0)
  bico.rotation.z = Math.PI / 2 + 0.55
  g.add(bico)
  const volante = torus(0.055, 0.012, ACO_ESC, { roughness: 0.4, metalness: 0.6 })
  volante.rotation.x = Math.PI / 2
  volante.position.y = CYL_H + 0.12
  g.add(volante)
  for (const a of [0, Math.PI / 2]) {
    const raio = rbox(0.11, 0.012, 0.012, 0.004, ACO_ESC, { roughness: 0.4, metalness: 0.6 })
    raio.rotation.y = a
    raio.position.y = CYL_H + 0.12
    g.add(raio)
  }

  // etiqueta branca enrolada no corpo, com ÉTER — o ÉT de frente para a câmera
  const cam = facing(x, z)
  const pitch = 0.09 / (CYL_R + 0.009)
  const centro = cam + pitch // ÉT (1º e 2º glifos) centrado na câmera
  const etiqueta = shell(CYL_R + 0.003, 0.29, centro - 1.75, centro + 1.75, ETIQUETA, { roughness: 0.75 })
  etiqueta.position.y = LABEL_Y
  g.add(etiqueta)
  for (const [k, l] of (['É', 'T', 'E', 'R'] as const).entries()) {
    const a = centro + (k - 1.5) * pitch
    const glyph = letter(l)
    glyph.position.set(Math.sin(a) * (CYL_R + 0.009), LABEL_Y - 0.02, Math.cos(a) * (CYL_R + 0.009))
    glyph.rotation.y = a
    g.add(glyph)
  }
  return { group: g, centro }
}

/** O -ER queimado: casca carbonizada sobre o fim da etiqueta, com brasas. */
function makeScorch(x: number, z: number, centro: number, seed: number) {
  const g = new THREE.Group()
  g.position.set(x, 0, z) // filha de 'queimado', que fica na altura da etiqueta
  const rand = rng(seed)
  const a0 = centro - 0.01 // borda esquerda do queimado: logo depois do T
  const r = CYL_R + 0.022
  const H = 0.32
  const N = 7
  const hRow = H / N
  // faixas de carvão com início irregular: a borda roída pelo fogo, com uma
  // frente de brasa incandescente
  for (let i = 0; i < N; i++) {
    const y = -H / 2 + hRow * (i + 0.5)
    const ini = a0 + rand() * 0.07
    const placa = shell(r, hRow + 0.004, ini, a0 + 1.6, CARVAO, { roughness: 0.95 })
    placa.position.y = y
    g.add(placa)
    const frente = shell(r + 0.002, hRow + 0.004, ini - 0.03, ini + 0.012, FOGO_MEIO, {
      emissive: FOGO_EXT,
      emissiveIntensity: 1.5,
    })
    frente.position.y = y
    g.add(frente)
  }
  // fuligem marrom contornando a borda
  // (raio abaixo das letras: o T continua por cima da mancha)
  const fuligem = shell(CYL_R + 0.005, H, a0 - 0.2, a0 + 0.02, '#6b4a33', { roughness: 0.95 })
  g.add(fuligem)
  return g
}

/** Labareda: gotas torneadas em camadas, levemente tombadas pelo vento. */
function makeFire(x: number, z: number, seed: number, light: boolean) {
  const g = new THREE.Group()
  g.position.set(x, GY + CYL_H + 0.13, z)
  const rand = rng(seed)
  const gota = (s: number, color: string, emissive: string, k: number) => {
    const m = lathe(
      [[0, 0], [0.07, 0.02], [0.105, 0.08], [0.1, 0.17], [0.075, 0.27], [0.04, 0.37], [0.012, 0.45], [0, 0.48]],
      color,
      { emissive, emissiveIntensity: k },
      20,
    )
    m.scale.setScalar(s)
    m.castShadow = false
    return m
  }
  const nucleo = gota(0.75, FOGO_NUCLEO, '#ffd84a', 2.0)
  nucleo.position.set(0, 0.0, 0.05)
  nucleo.rotation.z = 0.1
  g.add(nucleo)
  const meio = gota(1.05, FOGO_MEIO, '#ff8a1e', 1.6)
  meio.position.z = 0.02
  meio.rotation.z = 0.14
  g.add(meio)
  const ext = gota(1.3, FOGO_EXT, '#ff4a12', 1.3)
  ext.position.set(0.0, -0.04, -0.01)
  ext.rotation.z = 0.2
  g.add(ext)
  // línguas laterais, curtas e coladas no corpo da chama
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rand()
    const l = gota(0.55 + rand() * 0.2, i % 2 ? FOGO_MEIO : FOGO_EXT, i % 2 ? '#ff8a1e' : '#ff4a12', 1.4)
    l.position.set(Math.cos(a) * 0.07, -0.02, Math.sin(a) * 0.07)
    l.rotation.set(Math.sin(a) * 0.22, 0, 0.3 - Math.cos(a) * 0.18)
    g.add(l)
  }
  // fagulhas
  for (let i = 0; i < 4; i++) {
    const f = sphere(0.016, FOGO_NUCLEO, { emissive: '#ffcc40', emissiveIntensity: 2 }, 10)
    f.castShadow = false
    f.position.set(-0.08 - rand() * 0.2, 0.5 + rand() * 0.2, (rand() - 0.5) * 0.15)
    g.add(f)
  }
  // fumaça escura subindo e tombando para a esquerda
  for (const [k, [dx, dy, r]] of ([[-0.16, 0.64, 0.085], [-0.32, 0.72, 0.11]] as const).entries()) {
    const fumo = puff(r, '#46454b', 5, seed * 10 + k, { roughness: 0.95 })
    fumo.position.set(dx, dy, -0.04)
    g.add(fumo)
  }
  if (light) {
    const luz = new THREE.PointLight('#ff8a3a', 2.2, 3.4, 1.6)
    luz.position.set(0.25, 0.25, 0.4)
    g.add(luz)
  }
  return g
}

/** Asa aberta: borda de ataque no eixo +y, membrana para +x, primárias em leque. */
function makeWing(seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const op = { roughness: 0.85 }
  const braco = capsule(0.06, 0.7, GANSO, op)
  braco.position.set(0.02, 0.4, 0)
  g.add(braco)
  const cobertura = sphere(0.25, GANSO, op)
  cobertura.scale.set(0.8, 1.7, 0.2)
  cobertura.position.set(0.17, 0.42, 0)
  g.add(cobertura)
  // secundárias: penas ovais sobrepostas na borda de fuga (festão)
  for (let i = 0; i < 6; i++) {
    const pena = sphere(0.12, GANSO_SOMBRA, op)
    pena.scale.set(1.3, 0.48, 0.18)
    pena.position.set(0.3, 0.07 + i * 0.12, 0)
    pena.rotation.z = -0.3 + i * 0.05
    g.add(pena)
  }
  // primárias: penas longas e afiladas abrindo em leque na ponta
  for (let i = 0; i < 6; i++) {
    const ang = -0.12 + i * 0.25 + (rand() - 0.5) * 0.04
    const meia = 0.25 - i * 0.012
    const pena = sphere(0.1, i < 2 ? GANSO : GANSO_SOMBRA, op)
    pena.scale.set(0.55, meia / 0.1, 0.22)
    pena.position.set(0.06 + Math.sin(ang) * (meia * 0.85), 0.76 + Math.cos(ang) * (meia * 0.85), 0)
    pena.rotation.z = -ang
    g.add(pena)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(112)

  // ---- pátio de terra batida -----------------------------------------------
  const base = new THREE.Group()
  const disco = cylinder(2.45, 2.55, 0.14, TERRA, { roughness: 0.95 })
  disco.position.y = 0.07
  base.add(disco)
  const borda = torus(2.47, 0.03, TERRA_ESC, { roughness: 0.95 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = GY - 0.01
  base.add(borda)
  // manchas de terra clara/escura
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const d = 0.6 + rand() * 1.5
    const mancha = sphere(0.22 + rand() * 0.2, i % 2 ? TERRA_CLARA : TERRA_ESC, { roughness: 0.95 })
    mancha.scale.y = 0.04
    mancha.position.set(Math.cos(a) * d, GY, Math.sin(a) * d)
    base.add(mancha)
  }
  // pedrinhas
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.2 + rand() * 1.0
    const pedra = rock(0.05 + rand() * 0.05, '#77706a', 30 + i, { roughness: 0.9 })
    pedra.position.set(Math.cos(a) * d, GY + 0.02, Math.sin(a) * d)
    base.add(pedra)
  }
  // palha espalhada
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2
    const d = 0.5 + rand() * 1.7
    const fio = capsule(0.008, 0.16 + rand() * 0.1, PALHA, { roughness: 0.9 })
    fio.rotation.set(Math.PI / 2, 0, rand() * Math.PI)
    fio.position.set(Math.cos(a) * d, GY + 0.008, Math.sin(a) * d)
    base.add(fio)
  }
  // penas soltas no pátio: o ganso de guarda mora aqui
  for (const [px, pz, rot] of [[0.12, 0.78, 0.6], [0.62, 1.12, -0.9], [-0.42, 1.25, 2.1]] as const) {
    const pena = new THREE.Group()
    pena.position.set(px, GY + 0.012, pz)
    pena.rotation.set(0, rot, 0.08)
    const vexilo = sphere(0.08, GANSO, { roughness: 0.85 })
    vexilo.scale.set(0.45, 0.12, 1.6)
    pena.add(vexilo)
    const raque = capsule(0.006, 0.27, GANSO_SOMBRA, { roughness: 0.6 })
    raque.rotation.x = Math.PI / 2
    raque.position.y = 0.006
    pena.add(raque)
    base.add(pena)
  }
  // fardo de feno no canto direito
  const fardo = new THREE.Group()
  fardo.position.set(1.72, GY, -0.62)
  fardo.rotation.y = -0.35
  const feno = rbox(0.7, 0.4, 0.42, 0.07, PALHA, { roughness: 0.95 })
  feno.position.y = 0.2
  fardo.add(feno)
  for (const fx of [-0.18, 0.18]) {
    const amarra = rbox(0.03, 0.41, 0.43, 0.012, '#8a6a3a', { roughness: 0.9 })
    amarra.position.set(fx, 0.2, 0)
    fardo.add(amarra)
  }
  base.add(fardo)
  // balde d'água esquecido, à esquerda na frente
  const balde = lathe(
    [[0, 0], [0.13, 0], [0.135, 0.02], [0.16, 0.26], [0.145, 0.26], [0.125, 0.03], [0, 0.03]],
    '#7c8790',
    { roughness: 0.35, metalness: 0.6 },
  )
  balde.position.set(-1.95, GY, 0.55)
  base.add(balde)
  const alca = torus(0.15, 0.008, '#5b646c', { roughness: 0.4, metalness: 0.6 })
  alca.position.set(-1.95, GY + 0.27, 0.55)
  alca.rotation.set(0.5, 0.4, 0)
  base.add(alca)
  root.add(base)

  // ---- parede do galpão vermelho -------------------------------------------
  const galpao = new THREE.Group()
  galpao.position.set(0, 0, -1.48)
  const WALL_W = 3.7
  const WALL_H = 2.05
  const parede = rbox(WALL_W, WALL_H, 0.12, 0.02, FALU, { roughness: 0.85 })
  parede.position.y = GY + WALL_H / 2
  galpao.add(parede)
  for (let i = 1; i < 18; i++) {
    const fresta = rbox(0.022, WALL_H - 0.04, 0.02, 0.006, FALU_ESC, { roughness: 0.9 })
    fresta.position.set(-WALL_W / 2 + i * (WALL_W / 18), GY + WALL_H / 2, 0.065)
    galpao.add(fresta)
  }
  for (const sx of [-1, 1]) {
    const quina = rbox(0.12, WALL_H + 0.02, 0.16, 0.02, CREME, { roughness: 0.75 })
    quina.position.set(sx * (WALL_W / 2 - 0.04), GY + WALL_H / 2, 0.02)
    galpao.add(quina)
  }
  const testeira = rbox(WALL_W + 0.1, 0.11, 0.17, 0.02, CREME, { roughness: 0.75 })
  testeira.position.set(0, GY + WALL_H, 0.03)
  galpao.add(testeira)
  const beiral = rbox(WALL_W + 0.3, 0.07, 0.6, 0.02, TELHADO, { roughness: 0.8 })
  beiral.position.set(0, GY + WALL_H + 0.17, -0.12)
  beiral.rotation.x = 0.42
  galpao.add(beiral)
  root.add(galpao)

  // ---- os dois cilindros de éter (1 e 1) -----------------------------------
  const c1 = makeCylinder(...CYL1)
  const c2 = makeCylinder(...CYL2)
  const cilindro1 = c1.group
  const cilindro2 = c2.group
  root.add(cilindro1, cilindro2)

  // as duas manchas numa peça só, com o pivô na altura das etiquetas: o
  // queimado cresce para cima e para baixo a partir da linha das letras
  const queimado = new THREE.Group()
  queimado.position.set(0, GY + LABEL_Y, 0)
  queimado.add(makeScorch(...CYL1, c1.centro, 7), makeScorch(...CYL2, c2.centro, 8))
  root.add(queimado)

  const fogo1 = makeFire(...CYL1, 3, true)
  const fogo2 = makeFire(...CYL2, 4, false)
  root.add(fogo1, fogo2)

  // ---- o GANSO de guarda ---------------------------------------------------
  const ganso = new THREE.Group()
  ganso.position.set(GOOSE_X, Y_FLY, GOOSE_Z)
  root.add(ganso)
  const pele = { roughness: 0.85 }

  const corpo = sphere(0.4, GANSO, pele)
  corpo.scale.set(1.35, 0.8, 0.85)
  ganso.add(corpo)
  const peito = sphere(0.29, GANSO, pele)
  peito.position.set(-0.36, 0.03, 0)
  ganso.add(peito)
  const barriga = sphere(0.3, GANSO_SOMBRA, pele)
  barriga.scale.set(1.5, 0.6, 0.85)
  barriga.position.set(0.05, -0.12, 0)
  ganso.add(barriga)
  const anca = sphere(0.27, GANSO, pele)
  anca.scale.set(1.2, 0.85, 0.95)
  anca.position.set(0.38, 0.04, 0)
  ganso.add(anca)
  const cauda = sphere(0.16, GANSO_SOMBRA, pele)
  cauda.scale.set(1.6, 0.55, 0.9)
  cauda.position.set(0.66, 0.14, 0)
  cauda.rotation.z = 0.4
  ganso.add(cauda)

  // pescoço: diagonal subindo do peito e arco por cima, o desenho do 2
  const dirDiag = new THREE.Vector2(Math.cos(-0.7), Math.sin(-0.7)) // ponto A no arco, a -40°
  const A = new THREE.Vector2(NECK_C.x + NECK_R * dirDiag.x, NECK_C.y + NECK_R * dirDiag.y)
  const tang = new THREE.Vector2(-dirDiag.y, dirDiag.x) // tangente do arco em A (anti-horário)
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 4; i++) {
    const k = 0.72 - i * 0.18
    pts.push(new THREE.Vector3(A.x - tang.x * k, A.y - tang.y * k, 0))
  }
  const ARC_END = 2.98
  for (let i = 1; i <= 12; i++) {
    const a = -0.7 + (ARC_END + 0.7) * (i / 12)
    pts.push(new THREE.Vector3(NECK_C.x + NECK_R * Math.cos(a), NECK_C.y + NECK_R * Math.sin(a), 0))
  }
  // elos longos e sobrepostos (cada um cobre dois passos): curva lisa, e cada
  // elo é grande o bastante para o Blender fundi-lo na pele em vez de tratá-lo
  // como detalhe solto
  for (let i = 0; i < pts.length - 1; i++) {
    const k = i / (pts.length - 2)
    const j = Math.min(i + 2, pts.length - 1)
    ganso.add(link(pts[i], pts[j], 0.125 - 0.037 * Math.min(1, k * 1.6), GANSO, pele))
  }

  // cabeça (olhando para baixo-esquerda: o gancho do 2)
  const cabeca = new THREE.Group()
  const hc = new THREE.Vector2(NECK_C.x + NECK_R * Math.cos(ARC_END), NECK_C.y + NECK_R * Math.sin(ARC_END))
  cabeca.position.set(hc.x - 0.02, hc.y - 0.02, 0)
  cabeca.rotation.z = BEAK_ANGLE
  ganso.add(cabeca)
  const cranio = sphere(0.115, GANSO, pele)
  cranio.scale.set(1.3, 1, 0.92)
  cranio.position.x = -0.03
  cabeca.add(cranio)
  for (const side of [-1, 1]) {
    const olho = sphere(0.034, '#ffffff', { roughness: 0.25 })
    olho.position.set(-0.05, 0.035, side * 0.088)
    olho.scale.z = 0.6
    const pupila = sphere(0.019, '#141414', { roughness: 0.2 })
    pupila.position.set(-0.06, 0.035, side * 0.105)
    const brilho = sphere(0.006, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 }, 8)
    brilho.position.set(-0.066, 0.043, side * 0.118)
    cabeca.add(olho, pupila, brilho)
  }
  // bico entreaberto mordendo a corda: cunhas torneadas, unha escura na ponta
  const perfilBico: [number, number][] = [
    [0, 0], [0.05, 0.005], [0.055, 0.04], [0.048, 0.1], [0.036, 0.16], [0.022, 0.198], [0, 0.208],
  ]
  const superior = lathe(perfilBico, BICO, { roughness: 0.4 }, 24)
  superior.scale.set(0.78, 1, 1)
  superior.rotation.z = Math.PI / 2 - 0.06
  superior.position.set(-0.1, 0.012, 0)
  cabeca.add(superior)
  const inferior = lathe(
    [[0, 0], [0.04, 0.005], [0.042, 0.04], [0.034, 0.1], [0.022, 0.15], [0, 0.165]],
    BICO,
    { roughness: 0.45 },
    24,
  )
  inferior.scale.set(0.6, 1, 0.92)
  inferior.rotation.z = Math.PI / 2 + 0.28
  inferior.position.set(-0.1, -0.03, 0)
  cabeca.add(inferior)
  const unha = sphere(0.022, '#3a2a22', { roughness: 0.4 })
  unha.scale.set(0.9, 0.65, 1)
  unha.position.set(-0.3, 0.02, 0)
  cabeca.add(unha)
  // narina
  for (const side of [-1, 1]) {
    const narina = sphere(0.008, '#8a4a1c', { roughness: 0.6 }, 8)
    narina.position.set(-0.17, 0.042, side * 0.025)
    cabeca.add(narina)
  }

  // patas laranja penduradas, já fora do chão
  for (const side of [-1, 1]) {
    const quadril = new THREE.Vector3(0.08 + side * 0.03, -0.24, side * 0.12)
    const joelho = new THREE.Vector3(0.18 + side * 0.02, -0.42, side * 0.13)
    ganso.add(link(quadril, joelho, 0.032, BICO, { roughness: 0.5 }))
    const pe = new THREE.Group()
    pe.position.copy(joelho)
    pe.rotation.set(0, 0, 0.9)
    for (let d = -1; d <= 1; d++) {
      const dedo = capsule(0.018, 0.13, BICO, { roughness: 0.5 })
      dedo.position.set(0, -0.08, d * 0.035)
      dedo.rotation.x = d * 0.3
      pe.add(dedo)
    }
    const membrana = sphere(0.075, BICO, { roughness: 0.55 })
    membrana.scale.set(0.25, 1.1, 0.85)
    membrana.position.set(0, -0.085, 0)
    pe.add(membrana)
    ganso.add(pe)
  }

  // asas: filhas do ganso, pivô no ombro
  const asaPerto = makeWing(5)
  asaPerto.position.set(0.24, 0.24, 0.17)
  asaPerto.rotation.set(0.5, 0, -0.75)
  ganso.add(asaPerto)
  const asaLonge = makeWing(9)
  asaLonge.position.set(0.24, 0.24, -0.17)
  asaLonge.rotation.set(-0.45, 0, -0.42)
  ganso.add(asaLonge)

  // ---- poste com braço e o sino --------------------------------------------
  ganso.updateMatrixWorld(true)
  root.updateMatrixWorld(true)
  // ponto onde o bico morde a corda (pose final, em voo)
  const mordida = cabeca.localToWorld(new THREE.Vector3(-0.24, -0.015, 0))
  const dropStand = Y_FLY - Y_STAND
  const clapper = new THREE.Vector3(mordida.x, mordida.y + 0.36, mordida.z)
  const pivot = new THREE.Vector3(
    clapper.x - CLAPPER * Math.sin(BELL_TILT),
    clapper.y + CLAPPER * Math.cos(BELL_TILT),
    clapper.z,
  )

  const POST: [number, number] = [0.98, -0.72]
  const ARM_Y = pivot.y + 0.1
  const poste = new THREE.Group()
  poste.position.set(POST[0], GY, POST[1])
  root.add(poste)
  const mastro = rbox(0.14, ARM_Y + 0.12 - GY, 0.14, 0.025, MADEIRA, { roughness: 0.85 })
  mastro.position.y = (ARM_Y + 0.12 - GY) / 2
  poste.add(mastro)
  const sapata = rbox(0.26, 0.08, 0.26, 0.02, MADEIRA_ESC, { roughness: 0.9 })
  sapata.position.y = 0.04
  poste.add(sapata)
  const capitel = rbox(0.18, 0.05, 0.18, 0.015, MADEIRA_ESC, { roughness: 0.85 })
  capitel.position.y = ARM_Y + 0.14 - GY
  poste.add(capitel)
  // braço até o pivô do sino (em coordenadas do poste)
  const fim = new THREE.Vector3(pivot.x - POST[0], ARM_Y - GY, pivot.z - POST[1])
  const ini = new THREE.Vector3(0, ARM_Y - GY, 0)
  const vao = new THREE.Vector3().subVectors(fim, ini)
  const comp = Math.hypot(vao.x, vao.z)
  const giro = Math.atan2(-vao.z, vao.x)
  const braco = rbox(comp + 0.14, 0.11, 0.11, 0.02, MADEIRA, { roughness: 0.85 })
  braco.position.set(vao.x / 2, ARM_Y - GY, vao.z / 2)
  braco.rotation.y = giro
  poste.add(braco)
  const maoFrancesa = rbox(0.5, 0.075, 0.075, 0.015, MADEIRA_ESC, { roughness: 0.85 })
  maoFrancesa.position.set(Math.cos(giro) * 0.17, ARM_Y - GY - 0.17, -Math.sin(giro) * 0.17)
  maoFrancesa.rotation.set(0, giro, Math.PI / 4)
  poste.add(maoFrancesa)
  // suporte de ferro do sino
  const garra = rbox(0.05, 0.12, 0.05, 0.01, '#3b3b3e', { roughness: 0.45, metalness: 0.6 })
  garra.position.set(fim.x, ARM_Y - GY - 0.07, fim.z)
  poste.add(garra)

  const sino = new THREE.Group()
  sino.position.copy(pivot)
  sino.rotation.z = BELL_TILT
  root.add(sino)
  const campana = lathe(
    [
      [0.0, -0.05], [0.07, -0.07], [0.1, -0.13], [0.12, -0.22], [0.165, -0.32], [0.19, -0.37],
      [0.215, -0.39], [0.222, -0.375], [0.2, -0.35], [0.16, -0.28], [0.135, -0.2],
      [0.125, -0.12], [0.105, -0.05], [0.07, -0.015], [0.0, 0.0],
    ],
    BRONZE,
    { roughness: 0.3, metalness: 0.75 },
    48,
  )
  ;(campana.material as THREE.Material).side = THREE.DoubleSide
  sino.add(campana)
  const cinta = torus(0.15, 0.012, '#8f6520', { roughness: 0.35, metalness: 0.75 })
  cinta.rotation.x = Math.PI / 2
  cinta.position.y = -0.27
  sino.add(cinta)
  const coroa = torus(0.035, 0.014, '#3b3b3e', { roughness: 0.45, metalness: 0.6 })
  coroa.position.y = 0.02
  sino.add(coroa)
  const haste = cylinder(0.01, 0.01, 0.3, '#3b3b3e', { roughness: 0.45, metalness: 0.6 })
  haste.position.y = -0.22
  sino.add(haste)
  const badalo = sphere(0.045, '#6e5a35', { roughness: 0.35, metalness: 0.7 })
  badalo.position.y = -CLAPPER + 0.04
  sino.add(badalo)

  // corda: peça própria, pendurada do badalo, reta para baixo e passando entre
  // as metades do bico (vertical: o bico desliza nela quando o ganso decola).
  // Não é filha do sino — o sino balança e a corda fica na boca do ganso.
  const corda = new THREE.Group()
  corda.position.copy(clapper)
  root.add(corda)
  const queda = clapper.y - (mordida.y - dropStand - 0.16)
  const fio = cylinder(0.02, 0.02, queda, CORDA, { roughness: 0.95 }, 16)
  fio.position.y = -queda / 2
  corda.add(fio)
  for (let i = 1; i < 8; i++) {
    const no = cylinder(0.023, 0.023, 0.012, '#a88f66', { roughness: 0.95 }, 12)
    no.position.y = -i * (queda / 8)
    corda.add(no)
  }
  const argola = torus(0.025, 0.008, '#3b3b3e', { roughness: 0.45, metalness: 0.6 })
  argola.position.y = 0.01
  corda.add(argola)
  const borla = puff(0.04, CORDA, 4, 77, { roughness: 0.95 })
  borla.position.y = -queda
  borla.scale.set(0.9, 1.3, 0.9)
  corda.add(borla)

  // ---- três arcos de som saindo do sino ------------------------------------
  const ondas = new THREE.Group()
  const centroSino = sino.localToWorld(new THREE.Vector3(0, -0.2, 0))
  ondas.position.copy(centroSino)
  root.add(ondas)
  for (const [k, r] of [0.3, 0.41, 0.52].entries()) {
    const span = 0.95 - k * 0.1
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.028, 10, 40, span),
      mat(SOM, { emissive: SOM, emissiveIntensity: 1.0, size: r }),
    )
    arco.rotation.z = 2.2 - span / 2
    ondas.add(arco)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'fazenda', object: base },
    { name: 'galpao', group: 'fazenda', object: galpao },
    { name: 'cilindro1', group: 'eter', object: cilindro1 },
    { name: 'cilindro2', group: 'eter', object: cilindro2 },
    { name: 'fogo1', group: 'fogo', object: fogo1 },
    { name: 'fogo2', group: 'fogo', object: fogo2 },
    { name: 'queimado', group: 'fogo', object: queimado },
    { name: 'ganso', group: 'ganso', object: ganso },
    { name: 'asaPerto', group: 'ganso', object: asaPerto },
    { name: 'asaLonge', group: 'ganso', object: asaLonge },
    { name: 'poste', group: 'sino', object: poste },
    { name: 'sino', group: 'sino', object: sino },
    { name: 'corda', group: 'sino', object: corda },
    { name: 'ondas', group: 'ring', object: ondas },
  ]

  // ---- montagem ------------------------------------------------------------
  const s3 = (v0: number, v1: number) => [ch('scale.x', v0, v1), ch('scale.y', v0, v1), ch('scale.z', v0, v1)]
  const FOLD_Z = -1.5
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Madrugada na fazenda: pátio de terra batida e o galpão vermelho.',
    }),
    seq('galpao-rise', 'galpao', 0.25, 0.9, [riseFrom(0, 2.4)], { ease: 'easeOut' }),

    seq('cil1-rise', 'cilindro1', 1.7, 0.75, [riseFrom(GY, 1.8)], {
      ease: 'easeOut',
      caption: 'No pátio, dois cilindros altos de ÉTER, lado a lado — feito dois 1.',
    }),
    seq('cil2-rise', 'cilindro2', 1.95, 0.75, [riseFrom(GY, 1.8)], { ease: 'easeOut' }),

    seq('fogo1-acende', 'fogo1', 3.5, 0.55, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Fogo! As chamas comem o -ER das etiquetas: sobra só ÉT… e ÉT.',
    }),
    seq('fogo2-acende', 'fogo2', 3.65, 0.55, s3(0.01, 1), { ease: 'easeOut' }),
    seq('queimado', 'queimado', 3.95, 0.9, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),

    seq('ganso-rise', 'ganso', 5.6, 0.85, [riseFrom(Y_STAND, 1.9)], {
      ease: 'easeOut',
      caption: 'O ganso de guarda vê a fumaça — ganso é alarme desde a Roma antiga.',
    }),

    seq('poste-rise', 'poste', 7.2, 0.8, [riseFrom(GY, 2.8)], {
      ease: 'easeOut',
      caption: 'Ele crava o bico na corda do sino de bronze…',
    }),
    seq('sino-desce', 'sino', 7.45, 0.75, [ch('position.y', pivot.y + 1.2, pivot.y), ...s3(0.3, 1)], {
      ease: 'easeOut',
    }),
    seq('corda-desce', 'corda', 8.05, 0.45, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),

    seq('ganso-puxa', 'ganso', 8.7, 0.2, [ch('rotation.z', 0, 0.07)], {
      ease: 'easeOut',
      caption: '…e puxa com tudo: R-R-RING! O sino treme — e o R treme junto, na ponta da língua.',
    }),
    seq('corda-puxa', 'corda', 8.7, 0.2, [ch('position.y', clapper.y, clapper.y - 0.06)], { ease: 'easeOut' }),
    seq('sino-bate-a', 'sino', 8.7, 0.25, [ch('rotation.z', BELL_TILT, -0.1)], { ease: 'easeOut' }),
    seq('ondas-a', 'ondas', 8.8, 0.35, s3(0.2, 1), { ease: 'easeOut' }),
    seq('ganso-solta', 'ganso', 8.9, 0.2, [ch('rotation.z', 0.07, 0)], { ease: 'easeIn' }),
    seq('corda-solta', 'corda', 8.9, 0.2, [ch('position.y', clapper.y - 0.06, clapper.y)], { ease: 'easeIn' }),
    seq('sino-bate-b', 'sino', 8.95, 0.3, [ch('rotation.z', -0.1, 0.55)], { ease: 'easeInOut' }),
    seq('ganso-puxa-b', 'ganso', 9.15, 0.2, [ch('rotation.z', 0, 0.07)], { ease: 'easeOut' }),
    seq('corda-puxa-b', 'corda', 9.15, 0.2, [ch('position.y', clapper.y, clapper.y - 0.06)], { ease: 'easeOut' }),
    seq('sino-bate-c', 'sino', 9.25, 0.3, [ch('rotation.z', 0.55, 0.0)], { ease: 'easeInOut' }),
    seq('ganso-solta-b', 'ganso', 9.35, 0.2, [ch('rotation.z', 0.07, 0)], { ease: 'easeIn' }),
    seq('corda-solta-b', 'corda', 9.35, 0.2, [ch('position.y', clapper.y - 0.06, clapper.y)], { ease: 'easeIn' }),
    seq('sino-bate-d', 'sino', 9.55, 0.35, [ch('rotation.z', 0.0, BELL_TILT)], { ease: 'easeOut' }),

    // as asas saem dobradas de dentro do corpo e abrem em leque
    seq('asaPerto-abre', 'asaPerto', 10.4, 0.65, [
      ch('rotation.z', FOLD_Z, -0.75), ch('rotation.x', -0.45, 0.5), ...s3(0.3, 1),
    ], {
      ease: 'easeOut',
      caption: "Abre as asas, curva o pescoço feito um 2 e decola rumo à cidade: T'VÔO!",
    }),
    seq('asaLonge-abre', 'asaLonge', 10.45, 0.65, [
      ch('rotation.z', FOLD_Z, -0.42), ch('rotation.x', 0.45, -0.45), ...s3(0.3, 1),
    ], { ease: 'easeOut' }),
    seq('ganso-decola', 'ganso', 10.55, 0.7, [ch('position.y', Y_STAND, Y_FLY)], { ease: 'easeOut' }),

    seq('ondas-pulsa', 'ondas', 11.9, 0.4, s3(0.75, 1), {
      ease: 'easeOut',
      caption: 'Cilindro, cilindro, pescoço de ganso: 1, 1, 2 — RING! ÉT! ÉT! TVÔ!',
    }),
    seq('fogo1-aviva', 'fogo1', 13.2, 0.4, [ch('scale.y', 0.85, 1)], {
      ease: 'easeOut',
      caption: 'Ring 112! — Liga pro 112!',
    }),
    seq('fogo2-aviva', 'fogo2', 13.25, 0.4, [ch('scale.y', 0.85, 1)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [-0.2, 1.46, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'ring-112',
    contexto:
      'Emergência: acidente, incêndio, alguém desacordado, crime acontecendo — gritado pra quem estiver perto enquanto você ajuda. Saúde sem risco de vida é 1177; polícia sem urgência, 114 14.',
    fraseFonte: 'Liga pro 112!',
    fraseAlvo: 'Ring 112!',
    pronuncia:
      "RING ÉT ÉT TVÔÔ ('ring' com R de ponta de língua — nunca o RR de garganta — e NG no nariz, sem estalar o G; o número vai dígito por dígito, 'ett ett två'; 'ett' = ÉT, É aberto e T seco; 'två' = TVÔ, Ô fechado e longo)",
    ponteSonora:
      "R-R-RING! ÉT! ÉT! T'VÔO! (4 batidas: ring-ét-ét-TVÔÔ; cada uma leva força, porque o número sai dígito por dígito, e a maior cai no TVÔÔ; RING = o MESMO RINGUE de 'Jag ringer dig senare', cortado no NG — aqui sozinho, sem o -er, porque é ORDEM: liga!; o R é o tremido do sino, R de PONTA DE LÍNGUA vibrando, o 'rrrr' de motorzinho de criança — por isso vem escrito R-R-R, separado: NÃO é o RR soprado de RRÁR e RRÜR das outras cartas, nem o RR de garganta de 'rato', que sopra um h e vira 'hing'; o NG fica no nariz, sem estalar o G e sem o 'gue'; ÉT = o ÉTER sem o -ER, o MESMO ÉT de 'Jag har ett möte' e do ÉTA! de 'Ett bord för två': É ABERTO de 'pé', curto, T seco, nunca 'étchi' — e vem DUAS vezes, porque o sueco fala o 112 dígito por dígito, 'ett ett två', nunca 'hundratolv'; contando é sempre ÉT, nunca o EN do dedinho; T'VÔO = o VÔO com T colado, o mesmo dos morceguinhos de 'Jag har två barn' e das cadeiras voadoras de 'Ett bord för två': UMA sílaba só, Ô FECHADO e longo)",
    historia:
      'Madrugada na fazenda: o ganso de guarda (ganso é alarme desde a Roma antiga) vê fumaça no galpão — os dois cilindros de ÉTER pegaram fogo, e as chamas já comeram o -ER das etiquetas: sobrou só ÉT e ÉT. Ele crava o bico na corda do sino e puxa com tudo: R-R-RING! — o sino treme, e o R treme junto, na ponta da língua. Aí abre as asas, curva o pescoço feito um 2 e decola rumo à cidade: T\'VÔO! Vista de cima, a cena já é o número — cilindro, cilindro, pescoço de ganso: 1, 1, 2 — e o recado vem na ordem: RING! ÉT! ÉT! TVÔ! Liga pro 112!',
  },
  createScene,
  refine: { organic: ['ganso', 'asaPerto', 'asaLonge'] },
}

export default card
