import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Ursäkta, får jag komma förbi?" — ÜÜÜ... CHEQUE-ta! FÔ(r)-IA... CÓ-MA! FOBI(a)!
 *
 * Fim da sessão, luzes acesas, fileira apertada do cinema. Uma CHINCHILA do
 * tamanho de uma poltrona tapa a passagem. O CHEQUE de desculpas (o mesmo de
 * "Ursäkta, jag förstår inte" e "Ursäkta att jag stör": papel creme, moldura
 * verde, Ü grande) não comove; a FOLHA de alface (FÔ-IA) sim — CÓ-MA! Mas ela
 * tem FOBIA de gente perto: arregala os olhos e solta o pelo todo de uma vez.
 * Pose final: chinchilinha pelada e rosada encolhida na poltrona, mastigando
 * a alface, ao lado da montanha de pelo cinza no meio da passagem.
 *
 * Layout: as poltronas olham para -x (a tela fica à esquerda); a câmera vem
 * da frente-esquerda e a chinchila se vira para ela (você é a câmera).
 * Paleta: carpete vinho, poltronas azul-marinho, pele rosada, pelo cinza-
 * azulado. Acento saturado (verde-limão) reservado à FOLHA de alface.
 */

const BORDA = '#3b1a21'
const CARPETE = '#7a2c38'
const AZUL = '#2f4578'
const AZUL_ESC = '#23345d'
const CASCO = '#161c30'
const BRACO = '#1d2232'
const PALCO = '#2a1a20'
const MOLDURA = '#111318'
const TELA = '#f3f6ff'
const CORTINA = '#5c1e2a'
const CORTINA_ESC = '#4a1722'
const AMBAR = '#ffb347'
const PELE = '#eba79f'
const PELE_CLARA = '#f4c0b6'
const PELE_ESC = '#d98a86'
const ORELHA_IN = '#df7d8a'
const NARIZ = '#c86f7a'
const DENTE = '#f2e3b8'
const OLHO = '#121016'
const PELO = '#8f96a2'
const PELO_CLARO = '#adb3bc'
const PELO_ESC = '#737a87'
const PELO_CAUDA = '#5d6470'
const ALFACE = '#86d13b' // acento: a FOLHA de alface (FÔ-IA)
const ALFACE_ESC = '#6db52c'
const ALFACE_CLARO = '#d4f09a'
const PAPEL = '#fbf8ee'
const VERDE = '#3c8a5f'
const VERMELHO = '#b8443c'
const BRANCO = '#f3efe6'
const MILHO = '#f5e2a6'

const FY = 0.16 // topo do carpete
const SX = 0.55 // centro (x) das poltronas da nossa fileira
const PITCH = 1.1 // distância entre poltronas
const SEATS_Z = [-PITCH, 0, PITCH]
const CUSHION_Y = FY + 0.6 // topo do assento

// chinchila (pose final): sentada encolhida na poltrona do meio
const CH_X = SX - 0.06
const CH_RY = -0.5 // vira para a câmera (você)
const CH_SCALE = 1.25
const HEAD_RX = 0.06
const HEAD_RY = 0.12

// montanha de pelo: começa vestindo a chinchila, termina na passagem
const FUR_X0 = -0.05
const FUR_S0: [number, number, number] = [1.35, 1.4, 0.85]
const MX = -0.62
const MZ = -0.85

// alface (filha da chinchila): pose final na boca, entre as patinhas
const LEAF: [number, number, number] = [0.1, 0.44, 0.36]
const LEAF_RX = -0.15
const LEAF_RZ = 0.55
const LEAF_HOVER: [number, number, number] = [0.05, 0.62, 0.95]

// cheque: pose final caído e escorado no pé da montanha de pelo
const CQ: [number, number, number] = [-0.72, FY + 0.01, 0.3]
const CQ_RX = -0.62
const CQ_RY = -0.3
const CQ_RZ = 0.1
const CQ_PELO: [number, number, number] = [-0.6, 0.62, 0.84] // grudado na bola de pelo

/** Cápsula de a até b (caudas, braços). */
function segment(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, roughness = 0.6) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, { roughness })
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/** Poltrona de cinema olhando para -x; dobrada = assento levantado (vazia). */
function poltrona(dobrada: boolean) {
  const g = new THREE.Group()

  const pe = rbox(0.4, 0.36, 0.46, 0.05, CASCO, { roughness: 0.5 })
  pe.position.set(0.14, 0.18, 0)
  g.add(pe)

  // assento basculante: dobradiça na traseira
  const assento = new THREE.Group()
  assento.position.set(0.3, 0.5, 0)
  if (dobrada) assento.rotation.z = -1.32
  g.add(assento)
  const almofada = rbox(0.74, 0.17, 0.84, 0.07, AZUL, { roughness: 0.85 })
  almofada.position.set(-0.36, 0.01, 0)
  assento.add(almofada)
  const rolo = capsule(0.095, 0.66, AZUL, { roughness: 0.85 })
  rolo.rotation.x = Math.PI / 2
  rolo.position.set(-0.7, 0.0, 0)
  assento.add(rolo)
  const cascoA = rbox(0.7, 0.05, 0.8, 0.02, CASCO, { roughness: 0.45 })
  cascoA.position.set(-0.36, -0.1, 0)
  assento.add(cascoA)
  const costura = rbox(0.6, 0.012, 0.02, 0.005, AZUL_ESC, { roughness: 0.8 })
  costura.position.set(-0.36, 0.1, 0)
  assento.add(costura)

  // encosto inclinado para trás
  const encosto = new THREE.Group()
  encosto.position.set(0.38, 0.48, 0)
  encosto.rotation.z = -0.13
  g.add(encosto)
  const estofado = rbox(0.2, 1.0, 0.86, 0.09, AZUL, { roughness: 0.85 })
  estofado.position.set(0, 0.5, 0)
  encosto.add(estofado)
  const costas = rbox(0.09, 1.04, 0.9, 0.04, CASCO, { roughness: 0.45 })
  costas.position.set(0.11, 0.5, 0)
  encosto.add(costas)
  const cabeceira = rbox(0.09, 0.26, 0.72, 0.06, AZUL, { roughness: 0.85 })
  cabeceira.position.set(-0.11, 0.84, 0)
  encosto.add(cabeceira)
  for (const z of [-0.17, 0.17]) {
    const gomo = rbox(0.02, 0.5, 0.022, 0.008, AZUL_ESC, { roughness: 0.85 })
    gomo.position.set(-0.105, 0.38, z)
    encosto.add(gomo)
  }
  return g
}

/** Braço entre poltronas: painel, apoio e porta-copo na ponta. */
function bracoPoltrona(luz: number) {
  const g = new THREE.Group()
  const painel = rbox(0.66, 0.62, 0.09, 0.03, CASCO, { roughness: 0.45 })
  painel.position.set(0.08, 0.31, 0)
  g.add(painel)
  const apoio = rbox(0.86, 0.07, 0.15, 0.035, BRACO, { roughness: 0.5 })
  apoio.position.set(-0.02, 0.75, 0)
  g.add(apoio)
  const aro = torus(0.07, 0.02, BRACO, { roughness: 0.4 })
  aro.rotation.x = Math.PI / 2
  aro.position.set(-0.5, 0.77, 0)
  g.add(aro)
  const fundo = cylinder(0.068, 0.06, 0.1, '#0c0e14', { roughness: 0.6 })
  fundo.position.set(-0.5, 0.73, 0)
  g.add(fundo)
  if (luz) {
    // luz de corredor na lateral da ponta da fileira
    const lampada = rbox(0.14, 0.05, 0.02, 0.01, AMBAR, { emissive: AMBAR, emissiveIntensity: 1.2 })
    lampada.position.set(-0.08, 0.14, luz * 0.05)
    g.add(lampada)
  }
  return g
}

/** Copo de refrigerante no porta-copo. */
function copo() {
  const g = new THREE.Group()
  const corpo = lathe([[0, 0], [0.055, 0], [0.075, 0.24], [0, 0.24]], '#e8ecf1', { roughness: 0.4 })
  g.add(corpo)
  const faixa = lathe([[0.066, 0.1], [0.071, 0.17], [0.0, 0.17], [0, 0.1]], '#3d6fb6', { roughness: 0.4 })
  g.add(faixa)
  const tampa = cylinder(0.079, 0.079, 0.02, '#f6f7f9', { roughness: 0.35 })
  tampa.position.y = 0.25
  g.add(tampa)
  const canudo = cylinder(0.011, 0.011, 0.2, VERMELHO, { roughness: 0.4 })
  canudo.position.set(0.015, 0.33, 0)
  canudo.rotation.z = -0.15
  g.add(canudo)
  return g
}

/** Traço de letra no cheque (tinta verde). */
function stroke(w: number, h: number, x: number, y: number) {
  const s = rbox(w, h, 0.012, 0.004, VERDE, { roughness: 0.6 })
  s.position.set(x, y, 0)
  return s
}

/** O cheque das cartas de "ursäkta": creme, moldura verde, Ü, rabisco azul. */
function cheque() {
  const g = new THREE.Group()
  const CW = 0.66
  const CH = 0.32
  const papel = rbox(CW, CH, 0.018, 0.012, PAPEL, { roughness: 0.6, detail: 0.3 })
  papel.position.y = CH / 2
  g.add(papel)
  const moldura = new THREE.Group()
  moldura.position.set(0, CH / 2, 0.012)
  g.add(moldura)
  for (const [w, h, x, y] of [
    [CW - 0.05, 0.02, 0, CH / 2 - 0.032],
    [CW - 0.05, 0.02, 0, -CH / 2 + 0.032],
    [0.02, CH - 0.064, -CW / 2 + 0.032, 0],
    [0.02, CH - 0.064, CW / 2 - 0.032, 0],
  ] as const) {
    const fio = rbox(w, h, 0.008, 0.004, VERDE, { roughness: 0.6 })
    fio.position.set(x, y, 0)
    moldura.add(fio)
  }
  const letraU = new THREE.Group()
  letraU.position.set(-0.19, CH / 2 - 0.03, 0.016)
  letraU.add(stroke(0.036, 0.15, -0.062, 0))
  letraU.add(stroke(0.036, 0.15, 0.062, 0))
  letraU.add(stroke(0.16, 0.036, 0, -0.075))
  letraU.add(stroke(0.04, 0.04, -0.045, 0.115))
  letraU.add(stroke(0.04, 0.04, 0.045, 0.115))
  g.add(letraU)
  for (const [lw, lx, ly] of [[0.27, 0.15, 0.24], [0.27, 0.15, 0.17], [0.2, 0.185, 0.09]] as const) {
    const linha = rbox(lw, 0.013, 0.006, 0.003, '#8a9a8f', { roughness: 0.6 })
    linha.position.set(lx, ly, 0.013)
    g.add(linha)
  }
  const rabisco = torus(0.036, 0.007, '#2c4a8a', { roughness: 0.5 })
  rabisco.scale.set(1.6, 0.6, 1)
  rabisco.position.set(0.18, 0.115, 0.016)
  g.add(rabisco)
  return g
}

/** Folha de alface ondulada, de pé no plano xy, talo para baixo. */
function folhaDeAlface() {
  const g = new THREE.Group()
  const rand = rng(77)
  const limbo = sphere(0.2, ALFACE, { roughness: 0.45 })
  limbo.scale.set(0.85, 1.12, 0.12)
  g.add(limbo)
  // borda crespa: abas finas em volta da metade de cima, viradas para frente
  // e para trás alternadamente em torno da tangente (ondulado de alface)
  for (let i = 0; i < 15; i++) {
    const a = -0.35 + (i / 14) * (Math.PI + 0.7)
    const aba = sphere(0.085, i % 2 ? ALFACE : ALFACE_ESC, { roughness: 0.45 })
    aba.scale.set(1, 0.9, 0.16)
    aba.rotation.order = 'ZYX'
    aba.rotation.set(0, (i % 2 ? 1 : -1) * (0.45 + rand() * 0.15), a)
    aba.position.set(Math.cos(a) * 0.15, 0.01 + Math.sin(a) * 0.2, 0)
    g.add(aba)
  }
  const talo = capsule(0.02, 0.34, ALFACE_CLARO, { roughness: 0.4 })
  talo.position.set(0, -0.04, 0.03)
  g.add(talo)
  for (const [y, s] of [[0.0, 1], [0.0, -1], [0.1, 1], [0.1, -1], [-0.1, 1], [-0.1, -1]] as const) {
    const nervura = rbox(0.12, 0.012, 0.01, 0.005, ALFACE_CLARO, { roughness: 0.4 })
    nervura.position.set(s * 0.06, y + 0.03, 0.03)
    nervura.rotation.z = s * 0.55
    g.add(nervura)
  }
  return g
}

/** Tufo de pelo: gota afilada ao longo de +y, de 0 até len. */
function tufo(len: number, r: number, color: string) {
  return lathe(
    [[0, 0], [r * 0.8, len * 0.08], [r, len * 0.3], [r * 0.72, len * 0.62], [r * 0.3, len * 0.88], [0, len]],
    color,
    { roughness: 0.95 },
    10,
  )
}

/** Montanha de pelo cinza fofo (origem no chão, centro da base). */
function montanhaDePelo() {
  const g = new THREE.Group()
  const rand = rng(915)
  const fofo = { roughness: 0.95 }
  const Y = new THREE.Vector3(0, 1, 0)

  // miolo macio: bolotas grandes que se fundem num monte
  const centro = new THREE.Vector3(0, 0.36, 0)
  const raios = new THREE.Vector3(0.78, 0.62, 0.9)
  const nucleo = sphere(1, PELO_ESC, fofo, 24)
  nucleo.scale.copy(raios).multiplyScalar(0.92)
  nucleo.position.copy(centro)
  g.add(nucleo)
  for (const [x, y, z, r] of [
    [0.32, 0.34, 0.38, 0.42], [-0.34, 0.32, 0.3, 0.4], [0.28, 0.36, -0.4, 0.4],
    [-0.3, 0.34, -0.38, 0.42], [0.05, 0.62, 0.0, 0.45],
  ] as const) {
    const bolo = sphere(r, PELO_ESC, fofo, 24)
    bolo.position.set(x, y, z)
    g.add(bolo)
  }

  // pelagem: flocos miúdos cobrindo o monte, clareando para o cume
  for (let i = 0; i < 120; i++) {
    const a = rand() * Math.PI * 2
    const b = Math.asin(Math.min(1, -0.15 + rand() * 1.15))
    const dir = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b))
    const r = 0.1 + rand() * 0.06
    const p = centro.clone().add(dir.clone().multiply(raios))
    p.y = Math.max(r * 0.7, p.y)
    const h = p.y + (rand() - 0.5) * 0.3
    const cor = h > 0.78 ? PELO_CLARO : h > 0.4 ? PELO : PELO_ESC
    const floco = sphere(r, cor, fofo, 16)
    floco.position.copy(p)
    g.add(floco)
  }
  // fiapos macios no contorno, pendendo para baixo
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2
    const b = 0.1 + rand() * 0.9
    const dir = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b))
    const p = centro.clone().add(dir.clone().multiply(raios).multiplyScalar(1.06))
    const n = new THREE.Vector3(dir.x / raios.x, dir.y / raios.y, dir.z / raios.z).normalize()
    const eixo = n.clone().add(new THREE.Vector3(0, -0.6, 0)).normalize()
    const t = tufo(0.15, 0.06, b > 0.6 ? PELO_CLARO : PELO)
    t.position.copy(p).addScaledVector(n, -0.05)
    t.quaternion.setFromUnitVectors(Y, eixo)
    g.add(t)
  }

  // a cauda peluda da chinchila: escorre do cume e se enrola no carpete
  const caminho = [
    new THREE.Vector3(-0.1, 0.92, -0.3), new THREE.Vector3(0.06, 1.02, 0.02),
    new THREE.Vector3(0.18, 0.94, 0.36), new THREE.Vector3(0.28, 0.72, 0.66),
    new THREE.Vector3(0.34, 0.42, 0.9), new THREE.Vector3(0.38, 0.14, 1.08),
    new THREE.Vector3(0.52, 0.1, 1.3), new THREE.Vector3(0.74, 0.11, 1.4),
  ]
  for (let i = 0; i < caminho.length - 1; i++) {
    const r = 0.1 - i * 0.004
    g.add(segment(caminho[i], caminho[i + 1], r, PELO_CAUDA, 0.95))
    for (let k = 0; k < 3; k++) {
      const p = caminho[i].clone().lerp(caminho[i + 1], (k + 0.5) / 3)
      const bola = sphere(r * (0.85 + rand() * 0.3), k % 2 ? PELO_CAUDA : '#6b7380', fofo, 16)
      bola.position.set(p.x + (rand() - 0.5) * 0.09, p.y + r * 0.4, p.z + (rand() - 0.5) * 0.09)
      g.add(bola)
    }
  }
  const ponta = puff(0.12, '#dfe2e7', 5, 77, fofo)
  ponta.position.copy(caminho[caminho.length - 1]).add(new THREE.Vector3(0.08, 0.02, 0.02))
  g.add(ponta)

  // chumaços soltos no chão em volta
  for (const [x, z, r] of [[0.95, -0.35, 0.08], [-0.9, 0.55, 0.08], [-0.5, -0.95, 0.07], [0.95, 0.55, 0.07]] as const) {
    const chumaco = puff(r, PELO_CLARO, 3, Math.round(x * 100 + 7), fofo)
    chumaco.position.set(x, r * 0.7, z)
    g.add(chumaco)
  }
  return g
}

/** Balde de pipoca listrado (de pé, origem no centro do fundo). */
function baldeDePipoca() {
  const g = new THREE.Group()
  const perfil = [
    [0.0, 0.0], [0.13, 0.0], [0.19, 0.44], [0.2, 0.45], [0.182, 0.44], [0.122, 0.02], [0.0, 0.02],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  const N = 12
  for (let i = 0; i < N; i++) {
    const geo = new THREE.LatheGeometry(perfil, 3, (i / N) * Math.PI * 2, (Math.PI * 2) / N)
    const m = new THREE.Mesh(geo, mat(i % 2 ? VERMELHO : BRANCO, { roughness: 0.55, size: 0.4 }))
    m.castShadow = true
    m.receiveShadow = true
    g.add(m)
  }
  const aro = torus(0.195, 0.014, BRANCO, { roughness: 0.5 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.445
  g.add(aro)
  const rand = rng(41)
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const r = rand() * 0.12
    const flor = puff(0.032, i % 3 ? MILHO : '#fff4cf', 3, 50 + i, { roughness: 0.8 })
    flor.position.set(Math.cos(a) * r, 0.42 + rand() * 0.03, Math.sin(a) * r)
    g.add(flor)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(5150)

  // ---- base: carpete vinho do cinema ----------------------------------------
  const base = new THREE.Group()
  const borda = cylinder(2.62, 2.7, 0.1, BORDA, { roughness: 0.85 })
  borda.position.y = 0.05
  base.add(borda)
  const carpete = cylinder(2.56, 2.6, 0.06, CARPETE, { roughness: 0.95 })
  carpete.position.y = 0.13
  base.add(carpete)
  // trilho de luz de corredor no chão, ao longo da passagem
  const trilho = rbox(0.09, 0.025, 3.7, 0.012, '#24161b', { roughness: 0.6 })
  trilho.position.set(-1.3, FY + 0.012, 0)
  base.add(trilho)
  for (let i = -4; i <= 4; i++) {
    const led = cylinder(0.022, 0.022, 0.012, AMBAR, { emissive: AMBAR, emissiveIntensity: 1.2 }, 16)
    led.position.set(-1.3, FY + 0.028, i * 0.4)
    base.add(led)
  }
  root.add(base)

  // ---- nossa fileira: três poltronas azul-marinho ----------------------------
  const poltronas = new THREE.Group()
  SEATS_Z.forEach((z) => {
    const p = poltrona(z !== 0)
    p.position.set(SX, 0, z)
    poltronas.add(p)
  })
  const bracosZ = [-1.5 * PITCH, -0.5 * PITCH, 0.5 * PITCH, 1.5 * PITCH]
  bracosZ.forEach((z, i) => {
    const b = bracoPoltrona(i === 0 ? -1 : i === bracosZ.length - 1 ? 1 : 0)
    b.position.set(SX, 0, z)
    poltronas.add(b)
  })
  const refri = copo()
  refri.position.set(SX - 0.5, 0.71, 1.5 * PITCH)
  poltronas.add(refri)
  poltronas.position.y = FY
  root.add(poltronas)

  // ---- fileira da frente: só os encostos, mais baixos ------------------------
  const fileira = new THREE.Group()
  fileira.position.y = FY
  for (const z of [-PITCH, 0]) {
    const e = new THREE.Group()
    e.position.set(-1.62, 0, z)
    e.rotation.z = -0.1
    fileira.add(e)
    const estofado = rbox(0.18, 0.86, 0.86, 0.08, AZUL, { roughness: 0.85 })
    estofado.position.set(-0.08, 0.5, 0)
    e.add(estofado)
    const costas = rbox(0.09, 0.9, 0.9, 0.04, CASCO, { roughness: 0.45 })
    costas.position.set(0.05, 0.5, 0)
    e.add(costas)
    const topo = capsule(0.07, 0.72, AZUL, { roughness: 0.85 })
    topo.rotation.x = Math.PI / 2
    topo.position.set(-0.03, 0.96, 0)
    e.add(topo)
  }
  for (const z of [-1.5 * PITCH, -0.5 * PITCH, 0.5 * PITCH]) {
    const apoio = rbox(0.5, 0.06, 0.13, 0.03, BRACO, { roughness: 0.5 })
    apoio.position.set(-1.82, 0.62, z)
    fileira.add(apoio)
    const painel = rbox(0.4, 0.58, 0.08, 0.03, CASCO, { roughness: 0.45 })
    painel.position.set(-1.82, 0.29, z)
    fileira.add(painel)
  }
  root.add(fileira)

  // ---- tela do cinema, acesa, com palco e cortinas ---------------------------
  const tela = new THREE.Group()
  tela.position.set(-1.4, FY, -1.6)
  tela.rotation.y = -0.93
  root.add(tela)
  const palco = rbox(0.42, 0.56, 2.0, 0.04, PALCO, { roughness: 0.8 })
  palco.position.set(-0.05, 0.28, 0)
  tela.add(palco)
  const quadro = rbox(0.1, 1.36, 1.8, 0.03, MOLDURA, { roughness: 0.6 })
  quadro.position.set(0, 1.27, 0)
  tela.add(quadro)
  const luz = rbox(0.04, 1.16, 1.6, 0.02, TELA, { emissive: '#e6edff', emissiveIntensity: 0.95 })
  luz.position.set(0.06, 1.27, 0)
  tela.add(luz)
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const dobra = cylinder(0.075, 0.085, 1.68, k % 2 ? CORTINA : CORTINA_ESC, { roughness: 0.9 })
      dobra.position.set(0.04 + (k % 2) * 0.04, 0.56 + 0.84, side * (0.94 + k * 0.1))
      tela.add(dobra)
    }
  }
  const bambinela = rbox(0.22, 0.24, 2.3, 0.06, CORTINA, { roughness: 0.9 })
  bambinela.position.set(0.06, 2.06, 0)
  tela.add(bambinela)

  // ---- balde de pipoca tombado no carpete ------------------------------------
  const pipoca = new THREE.Group()
  pipoca.position.set(-1.05, 0, 0.95)
  root.add(pipoca)
  const balde = baldeDePipoca()
  balde.position.set(0, FY + 0.17, 0)
  balde.rotation.set(1.42, 0.0, -0.6) // boca virada para a passagem
  pipoca.add(balde)
  for (let i = 0; i < 12; i++) {
    const a = 0.6 + rand() * 0.75
    const r = 0.5 + rand() * 0.42
    const flor = puff(0.035, i % 3 ? MILHO : '#fff4cf', 3, 60 + i, { roughness: 0.8 })
    flor.position.set(Math.cos(a) * r, FY + 0.03, Math.sin(a) * r)
    pipoca.add(flor)
  }

  // ---- CHINCHILA pelada, encolhida na poltrona -------------------------------
  const chinchila = new THREE.Group()
  chinchila.position.set(CH_X, CUSHION_Y, 0.02)
  chinchila.rotation.y = CH_RY
  chinchila.scale.setScalar(CH_SCALE)
  root.add(chinchila)

  const quadril = sphere(0.2, PELE, { roughness: 0.6 })
  quadril.scale.set(1.15, 0.8, 1.05)
  quadril.position.set(0, 0.14, -0.05)
  chinchila.add(quadril)
  const tronco = capsule(0.145, 0.26, PELE, { roughness: 0.6 })
  tronco.position.set(0, 0.38, 0)
  tronco.rotation.x = 0.25
  chinchila.add(tronco)
  const barriga = sphere(0.135, PELE_CLARA, { roughness: 0.6 })
  barriga.scale.set(1, 1.15, 0.75)
  barriga.position.set(0, 0.3, 0.09)
  chinchila.add(barriga)
  // costelinhas aparecendo: magrela de dar dó
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const costela = new THREE.Mesh(
        new THREE.TorusGeometry(0.152 - k * 0.006, 0.011, 8, 20, 0.85),
        mat(PELE_ESC, { roughness: 0.6, size: 0.3 }),
      )
      costela.castShadow = true
      costela.rotation.x = Math.PI / 2
      const arco = new THREE.Group()
      arco.position.set(0, 0.5 - k * 0.055, 0.04 + k * 0.012)
      arco.rotation.y = side > 0 ? -0.4 : -(Math.PI - 0.4 - 0.85)
      arco.add(costela)
      chinchila.add(arco)
    }
  }
  for (const side of [-1, 1]) {
    const coxa = sphere(0.13, PELE, { roughness: 0.6 })
    coxa.scale.set(0.72, 0.85, 1.35)
    coxa.position.set(side * 0.16, 0.14, 0.1)
    chinchila.add(coxa)
    const pe = capsule(0.045, 0.2, PELE_ESC, { roughness: 0.6 })
    pe.rotation.x = Math.PI / 2
    pe.position.set(side * 0.16, 0.035, 0.28)
    chinchila.add(pe)
    for (let d = -1; d <= 1; d++) {
      const dedo = sphere(0.022, PELE_ESC, { roughness: 0.6 })
      dedo.position.set(side * 0.16 + d * 0.03, 0.03, 0.41)
      chinchila.add(dedo)
    }
    // bracinhos magros segurando a folha
    const ombro = new THREE.Vector3(side * 0.12, 0.5, 0.05)
    const mao = new THREE.Vector3(side * 0.12, 0.42, 0.33)
    chinchila.add(segment(ombro, mao, 0.038, PELE))
    const pata = sphere(0.045, PELE_ESC, { roughness: 0.6 })
    pata.scale.set(1, 0.85, 1)
    pata.position.copy(mao)
    chinchila.add(pata)
  }
  // rabo pelado e fino: contorna o corpo e pende pela frente do assento
  const rabo = [
    new THREE.Vector3(0.08, 0.06, -0.22), new THREE.Vector3(-0.2, 0.03, -0.18),
    new THREE.Vector3(-0.32, 0.02, 0.02), new THREE.Vector3(-0.38, 0.0, 0.2),
    new THREE.Vector3(-0.44, -0.18, 0.26), new THREE.Vector3(-0.47, -0.38, 0.27),
  ]
  for (let i = 0; i < rabo.length - 1; i++) {
    chinchila.add(segment(rabo[i], rabo[i + 1], 0.03 - i * 0.003, PELE_ESC))
  }
  // o único tufo de pelo que ficou: na ponta do rabo
  const pontaRabo = puff(0.045, PELO, 3, 21, { roughness: 0.95 })
  pontaRabo.position.copy(rabo[rabo.length - 1])
  chinchila.add(pontaRabo)

  // ---- cabeça: orelhas redondas enormes --------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.74, 0.07)
  cabeca.rotation.set(HEAD_RX, HEAD_RY, 0.07)
  chinchila.add(cabeca)

  // orelhas: peça própria (finas demais para fundir na pele da cabeça)
  const orelhas = new THREE.Group()
  cabeca.add(orelhas)

  const cranio = sphere(0.27, PELE, { roughness: 0.6 })
  cranio.scale.set(1.1, 0.98, 0.98)
  cabeca.add(cranio)
  const focinho = sphere(0.14, PELE, { roughness: 0.6 })
  focinho.scale.set(1.2, 0.82, 0.78)
  focinho.position.set(0, -0.1, 0.2)
  cabeca.add(focinho)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.125, PELE, { roughness: 0.6 })
    bochecha.position.set(side * 0.135, -0.11, 0.13)
    cabeca.add(bochecha)

    const orelha = new THREE.Group()
    orelha.position.set(side * 0.16, 0.2, -0.06)
    orelha.rotation.set(-0.1, side * 0.28, -side * 0.34)
    orelhas.add(orelha)
    const aba = sphere(0.22, PELE, { roughness: 0.6 })
    aba.scale.set(1, 1.1, 0.3)
    aba.position.y = 0.19
    orelha.add(aba)
    const concha = sphere(0.16, ORELHA_IN, { roughness: 0.6 })
    concha.scale.set(1, 1.08, 0.16)
    concha.position.set(0, 0.18, 0.058)
    orelha.add(concha)

    // sobrancelhas de pavor (ponta de dentro erguida)
    const sobr = capsule(0.016, 0.07, PELE_ESC, { roughness: 0.6 })
    sobr.rotation.z = Math.PI / 2 - side * 0.5
    sobr.position.set(side * 0.11, 0.17, 0.215)
    cabeca.add(sobr)

    const dente = rbox(0.03, 0.05, 0.016, 0.006, DENTE, { roughness: 0.35 })
    dente.position.set(side * 0.017, -0.18, 0.3)
    cabeca.add(dente)
  }
  const nariz = sphere(0.035, NARIZ, { roughness: 0.4 })
  nariz.scale.set(1.3, 0.8, 0.8)
  nariz.position.set(0, -0.05, 0.315)
  cabeca.add(nariz)
  const boca = sphere(0.05, '#5a2a33', { roughness: 0.6 })
  boca.scale.set(1.4, 0.6, 0.6)
  boca.position.set(0, -0.2, 0.27)
  cabeca.add(boca)
  // o último tufinho de pelo que sobrou no cocuruto
  const topete = puff(0.05, PELO, 3, 33, { roughness: 0.95 })
  topete.position.set(0.02, 0.25, 0.04)
  cabeca.add(topete)

  // ---- olhos pretos (arregalam na FOBIA) -------------------------------------
  const olhos = new THREE.Group()
  cabeca.add(olhos)
  for (const side of [-1, 1]) {
    const olho = new THREE.Group()
    olho.position.set(side * 0.12, 0.05, 0.2)
    olho.rotation.y = side * 0.32
    olhos.add(olho)
    const esclera = sphere(0.1, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    olho.add(esclera)
    const iris = sphere(0.062, OLHO, { roughness: 0.15 })
    iris.scale.z = 0.55
    iris.position.z = 0.035
    olho.add(iris)
    const brilho = sphere(0.018, '#ffffff', { roughness: 0.2, emissive: '#ffffff', emissiveIntensity: 0.5 })
    brilho.position.set(0.02, 0.024, 0.07)
    olho.add(brilho)
  }

  // ---- bigodes brancos longos -------------------------------------------------
  const bigodes = new THREE.Group()
  bigodes.position.set(0, -0.09, 0.27)
  cabeca.add(bigodes)
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      // o fio vai de 0 a -0.44 no y da haste; a rotação o deita para fora
      const haste = new THREE.Group()
      haste.position.set(side * 0.09, -k * 0.025, -0.02)
      haste.rotation.set(0, side * 0.35, side * (Math.PI / 2 - 0.18 + k * 0.18))
      const fio = cylinder(0.006, 0.004, 0.44, '#f6f3ee', { roughness: 0.4 })
      fio.position.y = -0.22
      haste.add(fio)
      bigodes.add(haste)
    }
  }

  // ---- folha de alface entre as patinhas, saindo da boca ---------------------
  const alface = folhaDeAlface()
  alface.position.set(...LEAF)
  alface.rotation.set(LEAF_RX, 0, LEAF_RZ)
  alface.scale.setScalar(0.85)
  chinchila.add(alface)

  // ---- montanha de pelo cinza no meio da passagem ----------------------------
  const pelo = montanhaDePelo()
  pelo.position.set(MX, FY, MZ)
  root.add(pelo)

  // ---- cheque caído, escorado no pé do monte ---------------------------------
  const chq = cheque()
  chq.rotation.order = 'YXZ'
  chq.position.set(...CQ)
  chq.rotation.set(CQ_RX, CQ_RY, CQ_RZ)
  root.add(chq)

  // ---- peças ------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cinema', object: base },
    { name: 'poltronas', group: 'cinema', object: poltronas },
    { name: 'fileira', group: 'cinema', object: fileira },
    { name: 'tela', group: 'cinema', object: tela },
    { name: 'pipoca', group: 'cinema', object: pipoca },
    { name: 'pelo', group: 'chinchila', object: pelo },
    { name: 'chinchila', group: 'chinchila', object: chinchila },
    { name: 'cabeca', group: 'chinchila', object: cabeca },
    { name: 'orelhas', group: 'chinchila', object: orelhas },
    { name: 'olhos', group: 'chinchila', object: olhos },
    { name: 'bigodes', group: 'chinchila', object: bigodes },
    { name: 'cheque', group: 'cheque', object: chq },
    { name: 'alface', group: 'alface', object: alface },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem ---------------------------------------------------------------
  const build = [
    seq('base-sobe', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'A sessão acabou e as luzes acenderam: a fileira apertada de um cinema.',
    }),
    seq('poltronas-sobem', 'poltronas', 0.25, 0.8, [riseFrom(FY, 1.8)], { ease: 'easeOut' }),
    seq('fileira-sobe', 'fileira', 0.4, 0.8, [riseFrom(FY, 1.4)], { ease: 'easeOut' }),
    seq('tela-acende', 'tela', 0.6, 0.8, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),
    seq('pipoca-sobe', 'pipoca', 0.9, 0.6, [riseFrom(0, 0.8)], { ease: 'easeOut' }),

    // a chinchila gorda tapa a passagem
    seq('pelo-sobe', 'pelo', 2.0, 0.9, [
      riseFrom(FY, 2.0),
      ch('position.x', FUR_X0, FUR_X0), ch('position.z', 0, 0),
      ch('scale.x', FUR_S0[0], FUR_S0[0]), ch('scale.y', FUR_S0[1], FUR_S0[1]), ch('scale.z', FUR_S0[2], FUR_S0[2]),
    ], {
      ease: 'easeOut',
      caption: 'Entre você e o corredor, uma CHINCHILA do tamanho de uma poltrona: uma bola de pelo cinza que tapa a passagem.',
    }),
    seq('chinchila-sobe', 'chinchila', 2.1, 0.85, [riseFrom(CUSHION_Y, 1.9)], { ease: 'easeOut' }),
    seq('cabeca-vira', 'cabeca', 2.5, 0.6, [ch('rotation.y', 0.8, HEAD_RY)]),
    seq('orelhas-abrem', 'orelhas', 2.45, 0.5, s3(0.3, 1), { ease: 'easeOut' }),
    seq('olhos-tedio', 'olhos', 2.1, 0.4, [ch('scale.y', 0.3, 0.3), ch('scale.x', 0.9, 0.9)]),
    seq('bigodes-saem', 'bigodes', 2.7, 0.5, s3(0.05, 1), { ease: 'easeOut' }),

    // o cheque não comove
    seq('cheque-chega', 'cheque', 3.8, 0.8, [
      ch('position.x', -1.1, -0.1), ch('position.y', 2.4, 1.35), ch('position.z', 3.3, 0.95),
      ch('rotation.x', -0.3, 0), ch('rotation.y', -0.7, CQ_RY), ch('rotation.z', 0.5, 0.06),
    ], {
      ease: 'easeOut',
      caption: 'Você solta o gemido de sempre — ÜÜÜ… — e estende o CHEQUE-ta. Ela nem pisca.',
    }),
    // ignorado, o cheque cai e fica grudado no pelo dela
    seq('cheque-gruda', 'cheque', 5.2, 0.6, [
      ch('position.x', -0.1, CQ_PELO[0]), ch('position.y', 1.35, CQ_PELO[1]), ch('position.z', 0.95, CQ_PELO[2]),
      ch('rotation.x', 0, -0.3), ch('rotation.z', 0.06, 0.28),
    ], { ease: 'easeIn' }),

    // a FOLHA de alface
    seq('alface-chega', 'alface', 6.4, 0.7, [
      ch('position.x', 0.5, LEAF_HOVER[0]), ch('position.y', 1.5, LEAF_HOVER[1]), ch('position.z', 2.8, LEAF_HOVER[2]),
    ], {
      ease: 'easeOut',
      caption: 'Então você tira da bolsa uma FOLHA de alface e balança na frente do focinho: FÔ(r)-IA!…',
    }),
    seq('alface-balanca-1', 'alface', 7.1, 0.3, [ch('rotation.z', LEAF_RZ, -0.3)]),
    seq('alface-balanca-2', 'alface', 7.4, 0.3, [ch('rotation.z', -0.3, LEAF_RZ)]),
    seq('alface-boca', 'alface', 8.1, 0.35, [
      ch('position.x', LEAF_HOVER[0], LEAF[0]), ch('position.y', LEAF_HOVER[1], LEAF[1]), ch('position.z', LEAF_HOVER[2], LEAF[2]),
    ], { ease: 'easeIn', caption: '…CÓ-MA! E ela abocanha.' }),
    seq('cabeca-morde', 'cabeca', 8.1, 0.2, [ch('rotation.x', HEAD_RX, HEAD_RX + 0.28)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', 8.3, 0.3, [ch('rotation.x', HEAD_RX + 0.28, HEAD_RX)]),

    // FOBIA: o pelo cai todo de uma vez
    seq('olhos-arregalam', 'olhos', 9.4, 0.25, [ch('scale.y', 0.3, 1), ch('scale.x', 0.9, 1)], {
      ease: 'easeOut',
      caption: 'Mas ela tem FOBIA de gente tão perto: arregala os olhos e solta o pelo todo de uma vez só!',
    }),
    seq('chinchila-pula', 'chinchila', 9.55, 0.2, [ch('position.y', CUSHION_Y, CUSHION_Y + 0.25)], { ease: 'easeOut' }),
    seq('chinchila-encolhe', 'chinchila', 9.75, 0.3, [ch('position.y', CUSHION_Y + 0.25, CUSHION_Y)], { ease: 'easeIn' }),
    seq('pelo-cai', 'pelo', 9.6, 0.75, [
      ch('position.x', FUR_X0, MX), ch('position.z', 0, MZ),
      ch('scale.x', FUR_S0[0], 1), ch('scale.y', FUR_S0[1], 1), ch('scale.z', FUR_S0[2], 1),
    ]),
    seq('cheque-escorrega', 'cheque', 9.7, 0.7, [
      ch('position.x', CQ_PELO[0], CQ[0]), ch('position.y', CQ_PELO[1], CQ[1]), ch('position.z', CQ_PELO[2], CQ[2]),
      ch('rotation.x', -0.3, CQ_RX), ch('rotation.z', 0.28, CQ_RZ),
    ]),
    seq('pipoca-tranco', 'pipoca', 10.3, 0.15, [ch('position.y', 0, 0.08)], { ease: 'easeOut' }),
    seq('pipoca-pousa', 'pipoca', 10.45, 0.2, [ch('position.y', 0.08, 0)], { ease: 'easeIn' }),

    seq('bigodes-tremem', 'bigodes', 11.3, 0.25, [ch('rotation.z', 0, 0.12)], {
      caption: 'Sobra uma chinchilinha pelada mastigando alface, e você passa por cima do monte de pelo: ÜÜÜ… CHEQUE-ta! FÔ(r)-IA… CÓ-MA! FOBI(a)!',
    }),
    seq('bigodes-param', 'bigodes', 11.55, 0.25, [ch('rotation.z', 0.12, 0)]),
    seq('alface-mastiga', 'alface', 12.6, 0.5, [ch('rotation.x', LEAF_RX - 0.15, LEAF_RX)], {
      caption: 'Ursäkta, får jag komma förbi? — Com licença, posso passar?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-1.45, 2.75, 4.4], target: [-0.08, 1.1, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'ursakta-far-jag-komma-forbi',
    contexto:
      "Lugares apertados: no corredor do ônibus ou do trem, entre as gôndolas estreitas do ICA, na porta do metrô lotado, na fileira do cinema — sempre que alguém está no caminho. Dita baixinho; a pessoa se encolhe com um 'Javisst!' (claro).",
    fraseFonte: 'Com licença, posso passar?',
    fraseAlvo: 'Ursäkta, får jag komma förbi?',
    pronuncia:
      "ÜÜ-shék-ta, fô(r) ia KÓM-ma fö-BÍÍ? ('ursäkta' como sempre: ÜÜ longo com bico, o 'rs' vira CH, -ta fraquinho; 'får jag' sai quase uma palavra só, 'fô-r'ia': FÔ com Ô FECHADO e longo e um R de um toque só, de 'cara', encostado no 'ia' — na fala rápida ele fica levíssimo, mas é ele que faz 'får' (posso) e não 'få', o infinitivo; 'komma' com Ó ABERTO e M demorado; 'förbi' tem a força no FIM: fö-BÍÍ, Ö curtinho de bico e I longo)",
    ponteSonora:
      "ÜÜÜ... CHEQUE-ta! FÔ(r)-IA... CÓ-MA! FOBI(a)! (9 sílabas: ÜÜ-shék-ta-fô-ia-KÓM-ma-fö-BÍ; força no ÜÜ, no CÓ e, mais que tudo, no BÍ; ÜÜÜ... CHEQUE-ta é o MESMO 'ursäkta' de 'Ursäkta, jag förstår inte' e 'Ursäkta att jag stör': gemido envergonhado LONGO e de bico, depois CHÉK-ta numa palavra só, sem o 'i' de 'chéki', -ta fraquinho; FÔ(r)-IA = FOLHA dita à caipira, 'FÔIA', sem o LH: Ô FECHADO e longo, o mesmo Ô de 'få' — mas com um toquezinho de R entre o FÔ e o IA, de um toque só, de 'cara' (fô-r'ia, nunca o RR raspado): na fala rápida ele fica levíssimo, só que é ele que faz 'får' (posso); sem ele sobra 'få', o infinitivo de 'Kan jag få menyn?'; o IA é o 'jag' de sempre, só que sem força; CÓ-MA = 'COMA!', do verbo comer, irmão do CÓ-MER de 'Jag kommer från Brasilien' e o mesmo CÓ-MA de 'Det är akut': Ó ABERTO do 'CÓME!' que a gente grita ('come logo!'), de 'cópia', nunca o 'cô' nasal de 'coma', e M demorado; FOBI(a) = FOBIA sem o -A, com a força no BÍ igualzinho ao português; só o FO ganha BICO — é o MESMO FÖ do beijinho de 'Tack för hjälpen': lábios de beijo com língua de É, curtinho — e o I é LONGO: fö-BÍÍ; com O de boca aberta sai 'fobi', que em sueco é a própria fobia: é o bico que faz 'förbi')",
    historia:
      'A sessão acabou, as luzes acenderam e você precisa sair — mas na fileira apertada do cinema, entre você e o corredor, tem uma chinchila do tamanho de uma poltrona: uma bola de pelo cinza que tapa a passagem de encosto a encosto. Você solta o gemido de sempre, ÜÜÜ..., e estende o CHEQUE-ta: ela nem pisca. Então tira da bolsa uma FOLHA de alface e balança na frente do focinho: FÔ-IA! ... CÓ-MA! Ela abocanha — mas tem FOBIA de gente tão perto: arregala os olhos e, como chinchila assustada faz de verdade, solta o pelo de uma vez só. Sobra uma chinchilinha magrela mastigando alface encolhida na poltrona, e você passa por cima da montanha de pelo até o corredor.',
  },
  createScene,
  refine: { organic: ['chinchila', 'cabeca', 'pelo'] },
}

export default card
