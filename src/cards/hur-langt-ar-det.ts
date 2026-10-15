import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Hur långt är det?" — RRÜR?! LÓNG-TÉ DÊ?
 *
 * Um hamster foi sozinho até o ponto de ônibus, dentro da bola de corrida
 * transparente, pela trilha de terra — e a trilha é um T LONGUÍSSIMO (LONG T):
 * a perna corre reta até o fundo, a parada fica lá na barra de cima, pequena
 * feito um grão de milho. Ele freia, gruda o focinho no plástico e pergunta.
 *
 * Perspectiva forçada: a perna do T afina e os pinheiros encolhem com a
 * distância, para o fundo do diorama parecer o horizonte. O acento amarelo é
 * reservado ao disco da parada — o fim do T, onde o olho tem de chegar.
 */

const GRAMA = '#93c46c'
const GRAMA_ESC = '#7fb25c'
const TERRA_BORDA = '#7a5236'
const TRILHA = '#dcc391'
const TRILHA_ESC = '#c2a46f'
const PINHO = '#2f5d3d'
const PINHO_CLARO = '#3d7049'
const TRONCO = '#6b4a32'
const MADEIRA = '#96613a'
const MADEIRA_ESC = '#74472a'
const CARAMELO = '#d8903e'
const CARAMELO_ESC = '#b8742c'
const CREME = '#f5e6c8'
const ROSA = '#eba2a1'
const ROSA_ESC = '#d9737f'
const BOLA = '#cfe9f7'
const BOLA_ARO = '#7dbfe6'
const POEIRA = '#e0cfab'
const SUOR = '#8fd2f7'
const METAL = '#8d959e'
const AMARELO = '#ffc61a' // acento: o disco da parada, lá no fim do T

const GY = 0.2 // topo do gramado
const ZF = 2.62 // começo da perna do T (frente da cena)
const ZB = -1.95 // fim da perna, onde ela encontra a barra
const BAR_D = 0.3 // "largura" da barra (fina: está longe)
const BAR_Z = ZB - BAR_D / 2 + 0.03
const BAR_HX = 1.45
const W0 = 1.3 // largura da trilha na frente
const W1 = 0.28 // largura lá no fundo
const R = 0.72 // raio da bola
const BX = -0.55
const BZ = 1.3
const BALL_Z0 = 2.55 // a bola surge na ponta da trilha e vem rolando
const LEAN = 0.28 // inclinação do corpo grudado no plástico
const STOP_X = 1.3 // a parada fica na ponta do braço direito da barra
const STOP_Z = BAR_Z - 0.3

const CAM: [number, number, number] = [0.65, 3.2, 4.3]
const TARGET: [number, number, number] = [-0.15, 0.2, -0.5]
// yaw final do hamster: corpo 3/4 para a câmera, cabeça quase de perfil virada
// para o fundo do T, de queixo erguido — na tela, o focinho aponta a parada
const CAM_AZ = Math.atan2(CAM[0] - BX, CAM[2] - BZ)
const FACE_BODY = CAM_AZ + 1.15
const FACE_HEAD = CAM_AZ + 1.45
const PITCH = 0.62

/** Laje plana (perfil no plano xz) com bordas chanfradas: trilhas de terra. */
function slab(shape: THREE.Shape, color: string, h = 0.03) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.014,
    bevelSegments: 2,
    curveSegments: 10,
  })
  geo.rotateX(-Math.PI / 2) // shape (x, y) → mundo (x, -z); espessura para +y
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.95, size: 1.2 }))
  m.receiveShadow = true
  return m
}

/** Trapézio da perna do T: largura w0 em y=0, w1 em y=len. */
function trapezio(w0: number, w1: number, len: number) {
  const s = new THREE.Shape()
  s.moveTo(-w0 / 2, 0)
  s.lineTo(w0 / 2, 0)
  s.lineTo(w1 / 2, len)
  s.lineTo(-w1 / 2, len)
  s.closePath()
  return s
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

/** Pinheirinho: tronco + três cones empilhados, altura ≈ 1.06·s. */
function pinheiro(s: number, seed: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const tronco = cylinder(0.05 * s, 0.065 * s, 0.24 * s, TRONCO, { roughness: 0.85 })
  tronco.position.y = 0.12 * s
  g.add(tronco)
  const camadas: [number, number, number][] = [[0.36, 0.52, 0.44], [0.28, 0.44, 0.67], [0.19, 0.34, 0.9]]
  camadas.forEach(([r, h, y], i) => {
    const c = cone(r * s, h * s, i % 2 === 0 ? PINHO : PINHO_CLARO, { roughness: 0.85 }, 9)
    c.position.y = y * s
    c.rotation.y = rand() * Math.PI
    g.add(c)
  })
  g.rotation.set((rand() - 0.5) * 0.08, rand() * Math.PI, (rand() - 0.5) * 0.08)
  return g
}

/** Gota de suor: esfera + bico cônico apontando para `up` local. */
function gota(r: number) {
  const g = new THREE.Group()
  const perfil: [number, number][] = [
    [0, -1], [0.5, -0.87], [0.85, -0.5], [1, 0], [0.92, 0.42], [0.66, 0.92], [0.34, 1.45], [0, 2.05],
  ]
  g.add(lathe(perfil.map(([x, y]) => [x * r, y * r] as [number, number]), SUOR, { roughness: 0.12 }, 24))
  const brilho = sphere(r * 0.26, '#ffffff', { roughness: 0.1 })
  brilho.position.set(-r * 0.35, r * 0.3, r * 0.78)
  g.add(brilho)
  return g
}

/** Capsula ligando dois pontos (no espaço do pai). */
function osso(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const dir = b.clone().sub(a)
  const len = dir.length()
  const c = capsule(r, Math.max(0.001, len), color, { roughness: 0.85 })
  c.position.copy(a).add(b).multiplyScalar(0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return c
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(5150)

  // ---- base: gramado verde-claro sobre a borda de terra ---------------------
  const base = new THREE.Group()
  const terra = cylinder(2.76, 2.86, 0.14, TERRA_BORDA, { roughness: 0.95 })
  terra.position.y = 0.07
  base.add(terra)
  const grama = cylinder(2.74, 2.76, 0.07, GRAMA, { roughness: 0.92 })
  grama.position.y = GY - 0.035
  base.add(grama)

  // manchas de grama mais escura
  for (const [mx, mz, mr] of [[-1.6, 0.4, 0.55], [1.5, -0.6, 0.6], [-0.9, -1.4, 0.45], [1.3, 1.5, 0.4]] as const) {
    const mancha = cylinder(mr, mr, 0.01, GRAMA_ESC, { roughness: 0.92 })
    mancha.position.set(mx, GY + 0.002, mz)
    mancha.scale.z = 0.7
    base.add(mancha)
  }

  // tufos de capim, florzinhas e pedrinhas (longe da trilha)
  const longeDaTrilha = (x: number, z: number) => {
    const t = (ZF - z) / (ZF - ZB)
    const hw = (W0 + (W1 - W0) * Math.min(1, Math.max(0, t))) / 2
    return Math.abs(x) > hw + 0.25 && Math.abs(z - BAR_Z) > 0.35
  }
  let n = 0
  while (n < 26) {
    const a = rand() * Math.PI * 2
    const rr = 0.6 + rand() * 1.95
    const x = Math.cos(a) * rr
    const z = Math.sin(a) * rr
    if (!longeDaTrilha(x, z)) continue
    n++
    const tufo = new THREE.Group()
    tufo.position.set(x, GY, z)
    for (let k = 0; k < 3; k++) {
      const folha = cone(0.025, 0.13 + rand() * 0.06, k % 2 ? GRAMA_ESC : '#6fa34f', { roughness: 0.9 }, 6)
      folha.position.set((rand() - 0.5) * 0.06, 0.06, (rand() - 0.5) * 0.06)
      folha.rotation.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5)
      tufo.add(folha)
    }
    if (n % 3 === 0) {
      const flor = sphere(0.035, n % 2 ? '#ffffff' : '#f2a7c3', { roughness: 0.6 })
      flor.position.y = 0.17
      tufo.add(flor)
    }
    base.add(tufo)
  }
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2
    const rr = 1.4 + rand() * 1.1
    const x = Math.cos(a) * rr
    const z = Math.sin(a) * rr
    if (!longeDaTrilha(x, z)) continue
    const pedra = rock(0.06 + rand() * 0.06, '#9a9488', 60 + i, { roughness: 0.9 })
    pedra.position.set(x, GY + 0.02, z)
    base.add(pedra)
  }
  root.add(base)

  // ---- perna do T: trilha de terra que afina até o fundo --------------------
  const perna = new THREE.Group()
  perna.position.set(0, GY - 0.02, ZF)
  const LEN = ZF - ZB + 0.08
  const pernaBorda = slab(trapezio(W0 + 0.08, W1 + 0.05, LEN), TRILHA_ESC, 0.022)
  pernaBorda.position.y = -0.004
  perna.add(pernaBorda)
  const pernaTopo = slab(trapezio(W0, W1, LEN), TRILHA)
  perna.add(pernaTopo)
  // pedrinhas na terra, menores lá no fundo
  for (let i = 0; i < 16; i++) {
    const t = rand() * 0.92
    const hw = (W0 + (W1 - W0) * t) / 2
    const pz = -t * LEN
    const px = (rand() - 0.5) * 2 * hw * 0.8
    const s = 1 - t * 0.7
    const pedrinha = rock(0.028 * s, i % 2 ? '#b39b70' : '#a89377', 80 + i, { roughness: 0.9 })
    pedrinha.position.set(px, 0.04, pz)
    pedrinha.scale.y = 0.6
    perna.add(pedrinha)
  }
  root.add(perna)

  // ---- barra do T: atravessada lá no fundo ----------------------------------
  const barra = new THREE.Group()
  barra.position.set(0, GY - 0.024, BAR_Z)
  const barraBorda = slab(estadio(BAR_HX + 0.02, BAR_D / 2 + 0.03), TRILHA_ESC, 0.022)
  barraBorda.position.y = -0.004
  barra.add(barraBorda)
  barra.add(slab(estadio(BAR_HX, BAR_D / 2), TRILHA))
  root.add(barra)

  // ---- duas fileiras de pinheirinhos, cada vez menores ----------------------
  const pinheiros = new THREE.Group()
  const fila = (side: number, ts: number[], seed0: number, afasta: number) => {
    ts.forEach((t, i) => {
      const z = ZF - t * (ZF - ZB)
      const hw = (W0 + (W1 - W0) * t) / 2
      const s = 0.95 - 0.68 * t
      const p = pinheiro(s, seed0 + i)
      p.position.set(side * (hw + 0.14 + afasta + 0.3 * s), GY, z)
      pinheiros.add(p)
    })
  }
  fila(-1, [0.5, 0.61, 0.71, 0.8, 0.88, 0.95], 300, 0.05)
  fila(1, [0.58, 0.72, 0.84, 0.94], 400, 0.3)
  // primeiro plano à direita: um pinheiro maior (o começo da perspectiva)
  for (const [fx, fz, fs, seed] of [[1.95, 0.95, 0.8, 610]] as const) {
    const p = pinheiro(fs, seed)
    p.position.set(fx, GY, fz)
    pinheiros.add(p)
  }
  // horizonte: pinheirinhos minúsculos atrás da barra
  for (const [hx, hs] of [[-1.3, 0.28], [-0.95, 0.22], [-0.55, 0.27], [-0.15, 0.22], [0.4, 0.25], [0.72, 0.21]] as const) {
    const p = pinheiro(hs, 500 + Math.round(hx * 10))
    const borda = -Math.sqrt(2.62 * 2.62 - hx * hx) + 0.12 // não sair do gramado
    p.position.set(hx, GY, Math.max(BAR_Z - 0.42 - Math.abs(hx) * 0.06, borda))
    pinheiros.add(p)
  }
  root.add(pinheiros)

  // ---- parada de ônibus minúscula, no fim do T ------------------------------
  const parada = new THREE.Group()
  parada.position.set(STOP_X, GY, STOP_Z)
  const viradaCam = Math.atan2(CAM[0] - STOP_X, CAM[2] - STOP_Z)
  const poste = cylinder(0.014, 0.017, 0.42, METAL, { roughness: 0.3, metalness: 0.6 })
  poste.position.y = 0.21
  parada.add(poste)
  const placaOnibus = new THREE.Group()
  placaOnibus.position.y = 0.43
  placaOnibus.rotation.y = viradaCam
  const disco = cylinder(0.095, 0.095, 0.022, AMARELO, { roughness: 0.35, emissive: AMARELO, emissiveIntensity: 0.25 })
  disco.rotation.x = Math.PI / 2
  placaOnibus.add(disco)
  const aroDisco = torus(0.095, 0.009, '#3f5f45', { roughness: 0.5 })
  placaOnibus.add(aroDisco)
  const onibus = rbox(0.1, 0.05, 0.008, 0.012, '#2e4a3a', { roughness: 0.5 })
  onibus.position.set(0, 0.008, 0.013)
  placaOnibus.add(onibus)
  for (const rx of [-0.03, 0.03]) {
    const roda = sphere(0.012, '#2e4a3a', { roughness: 0.5 })
    roda.position.set(rx, -0.022, 0.013)
    placaOnibus.add(roda)
  }
  parada.add(placaOnibus)
  // abriguinho ao lado
  const abrigo = new THREE.Group()
  abrigo.position.set(-0.3, 0, -0.02)
  abrigo.rotation.y = viradaCam * 0.6
  const teto = rbox(0.36, 0.025, 0.17, 0.008, '#55626e', { roughness: 0.5 })
  teto.position.y = 0.3
  abrigo.add(teto)
  for (const sx of [-0.16, 0.16]) {
    const pilar = cylinder(0.008, 0.008, 0.29, '#55626e', { roughness: 0.5, metalness: 0.4 })
    pilar.position.set(sx, 0.145, -0.06)
    abrigo.add(pilar)
  }
  const fundo = rbox(0.32, 0.19, 0.012, 0.004, '#a9cfe0', { roughness: 0.2 })
  fundo.position.set(0, 0.17, -0.065)
  abrigo.add(fundo)
  const banco = rbox(0.24, 0.018, 0.05, 0.006, MADEIRA, { roughness: 0.7 })
  banco.position.set(0, 0.08, -0.03)
  abrigo.add(banco)
  parada.add(abrigo)
  root.add(parada)

  // ---- placa de madeira em forma de T, ao lado do hamster -------------------
  const placa = new THREE.Group()
  const PX = -1.8
  const PZ = 0.38
  placa.position.set(PX, GY, PZ)
  placa.rotation.y = Math.atan2(CAM[0] - PX, CAM[2] - PZ)
  const haste = rbox(0.18, 1.2, 0.11, 0.035, MADEIRA, { roughness: 0.8 })
  haste.position.y = 0.57
  placa.add(haste)
  const travessa = rbox(0.74, 0.2, 0.12, 0.045, MADEIRA, { roughness: 0.8 })
  travessa.position.y = 1.25
  placa.add(travessa)
  // veios da madeira e pregos
  for (const vx of [-0.035, 0.04]) {
    const veio = rbox(0.012, 0.85, 0.008, 0.004, MADEIRA_ESC, { roughness: 0.85 })
    veio.position.set(vx, 0.6, 0.057)
    placa.add(veio)
  }
  for (const [vy, vw, vx] of [[1.21, 0.54, -0.04], [1.29, 0.44, 0.07]] as const) {
    const veio = rbox(vw, 0.012, 0.008, 0.004, MADEIRA_ESC, { roughness: 0.85 })
    veio.position.set(vx, vy, 0.062)
    placa.add(veio)
  }
  for (const nx of [-0.05, 0.05]) {
    const prego = sphere(0.016, '#5d6166', { roughness: 0.35, metalness: 0.7 })
    prego.position.set(nx, 1.2, 0.064)
    placa.add(prego)
  }
  const monte = sphere(0.19, TRILHA_ESC, { roughness: 0.95 })
  monte.scale.set(1, 0.3, 1)
  placa.add(monte)
  root.add(placa)

  // ---- bola de hamster transparente ----------------------------------------
  const bola = new THREE.Group()
  bola.position.set(BX, GY + R, BZ)

  const plastico = (side: THREE.Side, opacity: number) =>
    new THREE.MeshStandardMaterial({
      color: BOLA,
      roughness: 0.05,
      metalness: 0.05,
      transparent: true,
      opacity,
      depthWrite: false,
      side,
    })
  const casca = new THREE.Mesh(new THREE.SphereGeometry(R - 0.01, 48, 32), plastico(THREE.BackSide, 0.16))
  casca.renderOrder = 4
  bola.add(casca)
  const cascaFora = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), plastico(THREE.FrontSide, 0.24))
  cascaFora.renderOrder = 7
  bola.add(cascaFora)

  // costura das duas metades + fendas de ventilação em faixas paralelas
  const aroMat = new THREE.MeshStandardMaterial({
    color: BOLA_ARO, roughness: 0.2, transparent: true, opacity: 0.7, depthWrite: false,
  })
  // a costura fica quase de frente para a câmera: aparece como uma elipse
  // rente ao contorno da bola, sem cruzar o rosto do hamster
  const faixa = new THREE.Group()
  const paraCam = new THREE.Vector3(CAM[0] - BX, CAM[1] - (GY + R), CAM[2] - BZ).normalize()
  const ladoCam = new THREE.Vector3().crossVectors(paraCam, new THREE.Vector3(0, 1, 0)).normalize()
  const normalCostura = paraCam.clone().applyAxisAngle(ladoCam, 0.62)
  faixa.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalCostura)
  const costura = new THREE.Mesh(new THREE.TorusGeometry(R + 0.004, 0.022, 12, 64), aroMat)
  costura.renderOrder = 6
  faixa.add(costura)
  const fendaMat = new THREE.MeshStandardMaterial({
    color: '#e9f6fd', roughness: 0.2, transparent: true, opacity: 0.55, depthWrite: false,
  })
  for (const phi of [-0.3, 0.3]) {
    for (let i = 0; i < 14; i++) {
      const th = (i / 14) * Math.PI * 2
      const fenda = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.08, 4, 8), fendaMat)
      const rr = (R + 0.002) * Math.cos(phi)
      fenda.position.set(rr * Math.cos(th), rr * Math.sin(th), (R + 0.002) * Math.sin(phi))
      fenda.rotation.z = th
      fenda.renderOrder = 6
      faixa.add(fenda)
    }
  }
  bola.add(faixa)

  // reflexos: um arco largo e um pontinho, do lado da luz
  const brilhoMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.32, depthWrite: false })
  const arco = new THREE.Mesh(new THREE.SphereGeometry(R + 0.006, 24, 12, 0.15, 0.55, 0.42, 0.32), brilhoMat)
  arco.renderOrder = 8
  bola.add(arco)
  const ponto = new THREE.Mesh(
    new THREE.SphereGeometry(R + 0.007, 12, 8, 0.95, 0.12, 0.5, 0.1),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }),
  )
  ponto.renderOrder = 8
  bola.add(ponto)
  root.add(bola)

  // ---- hamster: em pé nas patas de trás, inclinado contra o plástico --------
  const hamster = new THREE.Group()
  hamster.rotation.order = 'YXZ' // rotation.x inclina no referencial dele
  hamster.position.set(BX, GY + 0.06, BZ)
  hamster.rotation.y = FACE_BODY
  root.add(hamster)

  const corpo = new THREE.Group()
  corpo.rotation.x = LEAN
  hamster.add(corpo)

  const quadril = sphere(0.34, CARAMELO, { roughness: 0.88 })
  quadril.scale.set(1, 1, 0.95)
  quadril.position.set(0, 0.36, 0)
  corpo.add(quadril)
  const costas = sphere(0.29, CARAMELO_ESC, { roughness: 0.88 })
  costas.scale.set(0.92, 1.05, 0.62)
  costas.position.set(0, 0.5, -0.14)
  corpo.add(costas)
  const peito = sphere(0.27, CARAMELO, { roughness: 0.88 })
  peito.position.set(0, 0.62, 0.04)
  corpo.add(peito)
  const barriga = sphere(0.3, CREME, { roughness: 0.9 })
  barriga.scale.set(0.82, 1.0, 0.55)
  barriga.position.set(0, 0.42, 0.17)
  corpo.add(barriga)
  const peitoClaro = sphere(0.2, CREME, { roughness: 0.9 })
  peitoClaro.scale.set(0.85, 1, 0.55)
  peitoClaro.position.set(0, 0.64, 0.16)
  corpo.add(peitoClaro)
  for (const side of [-1, 1]) {
    const coxa = sphere(0.17, CARAMELO, { roughness: 0.88 })
    coxa.position.set(side * 0.21, 0.2, -0.02)
    corpo.add(coxa)
    const pe = sphere(0.075, ROSA, { roughness: 0.8 })
    pe.scale.set(0.8, 0.45, 1.4)
    pe.position.set(side * 0.15, 0.03, 0.12)
    corpo.add(pe)
  }
  const rabinho = sphere(0.05, CARAMELO, { roughness: 0.88 })
  rabinho.position.set(0, 0.18, -0.33)
  corpo.add(rabinho)

  // ---- cabeça (peça própria: refina separada do corpo) ----------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.86, 0.15).applyAxisAngle(new THREE.Vector3(1, 0, 0), LEAN) // pescoço
  cabeca.rotation.order = 'YXZ'
  cabeca.rotation.y = FACE_HEAD - FACE_BODY // vira para o fundo do T
  cabeca.rotation.x = -PITCH // queixo erguido
  hamster.add(cabeca)

  const cranio = sphere(0.27, CARAMELO, { roughness: 0.88 })
  cranio.scale.set(1, 0.92, 1)
  cabeca.add(cranio)
  const SNOUT_R = 0.14
  const focinho = sphere(SNOUT_R, CREME, { roughness: 0.88 })
  focinho.scale.set(1, 0.85, 0.75) // frente achatada contra o plástico
  focinho.position.set(0, -0.06, 0.235)
  cabeca.add(focinho)
  const queixo = sphere(0.085, CREME, { roughness: 0.9 })
  queixo.position.set(0, -0.18, 0.13)
  cabeca.add(queixo)
  for (const side of [-1, 1]) {
    // bochechas murchas: pequenas e caídas, sem estufar
    const bochecha = sphere(0.1, CREME, { roughness: 0.9 })
    bochecha.scale.set(0.8, 1.2, 0.8)
    bochecha.position.set(side * 0.175, -0.16, 0.07)
    cabeca.add(bochecha)
    const orelha = sphere(0.095, CARAMELO, { roughness: 0.88 })
    orelha.scale.set(1, 1.05, 0.42)
    orelha.position.set(side * 0.165, 0.22, -0.05)
    orelha.rotation.set(0, side * 0.45, -side * 0.3)
    cabeca.add(orelha)
    const orelhaDentro = sphere(0.064, ROSA, { roughness: 0.8 })
    orelhaDentro.scale.set(1, 1, 0.3)
    orelhaDentro.position.set(side * 0.172, 0.22, -0.02)
    orelhaDentro.rotation.copy(orelha.rotation)
    cabeca.add(orelhaDentro)
  }

  // ---- rosto: detalhes nítidos (não refinados) ------------------------------
  const rosto = new THREE.Group()
  cabeca.add(rosto)
  const FRENTE = 0.235 + SNOUT_R * 0.75 // frente achatada do focinho
  const nariz = sphere(0.042, ROSA_ESC, { roughness: 0.4 })
  nariz.scale.set(1.2, 0.85, 0.45)
  nariz.position.set(0, -0.025, FRENTE - 0.006)
  rosto.add(nariz)
  for (const side of [-1, 1]) {
    const olho = sphere(0.062, '#17110f', { roughness: 0.12 })
    olho.position.set(side * 0.14, 0.04, 0.2)
    rosto.add(olho)
    const reflexo = sphere(0.017, '#ffffff', { roughness: 0.1 })
    reflexo.position.set(side * 0.15, 0.065, 0.252)
    rosto.add(reflexo)
    // pálpebra caída de cansaço
    const palpebra = sphere(0.067, CARAMELO, { roughness: 0.85 })
    palpebra.scale.set(1.05, 0.58, 1.0)
    palpebra.position.set(side * 0.14, 0.088, 0.205)
    rosto.add(palpebra)
    // bigodes varridos para trás pelo plástico
    for (let k = 0; k < 3; k++) {
      const a = new THREE.Vector3(side * 0.09, -0.05 - k * 0.024, FRENTE - 0.06)
      const b = a.clone().add(new THREE.Vector3(side * 0.16, 0.03 - k * 0.035, -0.07))
      rosto.add(osso(a, b, 0.005, '#f6efe2'))
    }
  }
  // boca aberta de quem ofega, com dentinhos e língua
  const boca = sphere(0.042, '#5a2a2c', { roughness: 0.6 })
  boca.scale.set(1.1, 0.8, 0.6)
  boca.position.set(0, -0.15, 0.29)
  rosto.add(boca)
  for (const dx of [-0.011, 0.011]) {
    const dente = rbox(0.018, 0.03, 0.01, 0.004, '#fbf6ea', { roughness: 0.3 })
    dente.position.set(dx, -0.128, 0.322)
    rosto.add(dente)
  }
  const lingua = sphere(0.026, '#ee8796', { roughness: 0.4 })
  lingua.scale.set(1, 0.5, 1.2)
  lingua.position.set(0, -0.172, 0.305)
  rosto.add(lingua)

  // ---- encaixe: focinho no plástico, patinhas espalmadas --------------------
  const centro = new THREE.Vector3(BX, GY + R, BZ)
  root.updateMatrixWorld(true)
  const ponta = focinho.localToWorld(new THREE.Vector3(0, 0, SNOUT_R)) // frente da esfera escalada
  cabeca.translateZ(R - 0.018 - ponta.distanceTo(centro))
  root.updateMatrixWorld(true)

  const MEIO = (FACE_BODY + FACE_HEAD) / 2
  const olharMundo = new THREE.Vector3(Math.sin(MEIO), 0, Math.cos(MEIO))
  for (const side of [-1, 1]) {
    const dir = olharMundo.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), side * 0.45)
    dir.y = -0.12
    dir.normalize()
    const alvo = centro.clone().addScaledVector(dir, R - 0.07)
    const palma = corpo.worldToLocal(alvo)
    const ombro = new THREE.Vector3(side * 0.17, 0.66, 0.12)
    corpo.add(osso(ombro, palma, 0.062, CARAMELO))
    const pata = sphere(0.062, ROSA, { roughness: 0.8 })
    pata.scale.set(1.1, 1.1, 0.7)
    pata.position.copy(palma)
    pata.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      palma.clone().sub(ombro).normalize(),
    ))
    corpo.add(pata)
  }

  // ---- gotas de suor saltando da testa -------------------------------------
  // Filhas do hamster (não da cabeça erguida): saltam para cima e para trás,
  // onde a câmera, que olha de cima, as vê fora da silhueta da cabeça.
  const testa = hamster.worldToLocal(cabeca.localToWorld(new THREE.Vector3(0, 0.2, 0.05)))
  const suor = new THREE.Group()
  suor.position.copy(testa)
  hamster.add(suor)
  for (const [dx, dy, dz, r] of [[-0.06, 0.2, -0.24, 0.048], [0.04, 0.08, -0.36, 0.04]] as const) {
    const g = gota(r)
    g.position.set(dx, dy, dz)
    // bico apontando de volta para a testa, de onde a gota saltou
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), g.position.clone().negate().normalize())
    suor.add(g)
  }

  // ---- nuvenzinhas de poeira atrás da bola ----------------------------------
  const poeira = new THREE.Group()
  poeira.position.set(BX - 0.3, GY, BZ + 0.5)
  for (const [px, py, pz, pr, seed] of [
    [0, 0.09, 0, 0.13, 11],
    [-0.32, 0.07, 0.12, 0.1, 12],
    [-0.58, 0.05, 0.2, 0.07, 13],
  ] as const) {
    const nuvem = puff(pr, POEIRA, 4, seed, { roughness: 0.95 })
    nuvem.position.set(px, py, pz)
    nuvem.scale.set(1.25, 0.6, 1)
    poeira.add(nuvem)
  }
  root.add(poeira)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'gramado', object: base },
    { name: 'perna', group: 'trilha', object: perna },
    { name: 'barra', group: 'trilha', object: barra },
    { name: 'pinheiros', group: 'trilha', object: pinheiros },
    { name: 'parada', group: 'parada', object: parada },
    { name: 'bola', group: 'bola', object: bola },
    { name: 'hamster', group: 'bola', object: hamster },
    { name: 'cabeca', group: 'bola', object: cabeca },
    { name: 'rosto', group: 'bola', object: rosto },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'poeira', group: 'freio', object: poeira },
    { name: 'suor', group: 'ofego', object: suor },
  ]

  // ---- montagem ------------------------------------------------------------
  const ROLL = (BALL_Z0 - BZ) / R // rolar sem deslizar: ângulo = distância / raio
  const SUOR_Y = suor.position.y
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um gramado verde brota do chão…',
    }),

    seq('perna-corre', 'perna', 0.9, 1.5, [ch('scale.z', 0.02, 1)], {
      caption: '…e uma trilha de terra corre reta, reta, até sumir lá no fundo — onde vira a barra de um T.',
    }),
    seq('pinheiros-rise', 'pinheiros', 1.2, 1.1, [riseFrom(0, 1.3)], { ease: 'easeOut' }),
    seq('barra-abre', 'barra', 2.3, 0.6, [ch('scale.x', 0.02, 1)], { ease: 'easeOut' }),

    seq(
      'parada-surge',
      'parada',
      3.3,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'Na barra do T fica a parada de ônibus — lá longe, pequena feito um grão de milho.',
      },
    ),

    seq('bola-rola', 'bola', 5.0, 1.9, [ch('position.z', BALL_Z0, BZ), ch('rotation.x', ROLL, 0)], {
      ease: 'easeOut',
      caption: 'O hamster resolveu ir sozinho, na bola de corrida, rolando pela trilha: RRÜÜR… RRÜÜR…',
    }),
    seq('hamster-corre', 'hamster', 5.0, 1.9, [ch('position.z', BALL_Z0, BZ)], { ease: 'easeOut' }),
    seq('bola-surge', 'bola', 5.0, 0.3, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
    }),
    seq('hamster-surge', 'hamster', 5.0, 0.3, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
    }),

    seq('placa-rise', 'placa', 7.2, 0.7, [riseFrom(GY, 1.6)], {
      ease: 'easeOut',
      caption: 'Na entrada, uma placa de madeira em T — e a trilha tem a mesma forma: um T LONGUÍSSIMO, um LONG T.',
    }),
    seq('placa-balanca', 'placa', 7.9, 0.5, [ch('rotation.z', 0.1, 0)]),

    seq('bola-freia', 'bola', 9.0, 0.25, [ch('position.z', BZ, BZ - 0.06), ch('rotation.x', 0, -0.09)], {
      ease: 'easeOut',
      caption: 'Ele freia, as bochechas murchas de cansaço, gruda o focinho no plástico e mede aquele LONG T sem fim…',
    }),
    seq('bola-assenta', 'bola', 9.25, 0.45, [ch('position.z', BZ - 0.06, BZ), ch('rotation.x', -0.09, 0)]),
    seq('hamster-gruda', 'hamster', 9.0, 0.3, [ch('rotation.x', -0.3, 0)], { ease: 'easeOut' }),
    seq('hamster-vira', 'hamster', 9.0, 0.6, [ch('rotation.y', Math.PI, FACE_BODY)]),
    seq(
      'poeira-sobe',
      'poeira',
      9.05,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq(
      'suor-salta',
      'suor',
      10.7,
      0.45,
      [
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
        ch('position.y', SUOR_Y - 0.12, SUOR_Y),
      ],
      {
        ease: 'easeOut',
        caption: '…e pergunta, ofegante, com o T já colado no É: RRÜR?! LÓNG-TÉ DÊ?',
      },
    ),
    seq('suor-pinga', 'suor', 12.0, 0.6, [ch('rotation.z', 0.18, 0)], {
      caption: 'Hur långt är det? — É longe? / Quanto falta até lá?',
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
    id: 'hur-langt-ar-det',
    contexto:
      "Direções: pedindo informação na rua ou na estação, ao motorista ou a um colega — quanto falta até a loja, a parada, o lago — antes de decidir se vai a pé, de bicicleta ou de ônibus. Atenção à resposta: 'två mil' são 20 km — a 'mil' sueca vale 10 km.",
    fraseFonte: 'É longe? / Quanto falta até lá?',
    fraseAlvo: 'Hur långt är det?',
    pronuncia:
      "rrü LÓNGT é dê? ('hur' com h soprado tipo RR carioca e Ü de bico; o -r final quase some antes do L; 'långt' com Ó ABERTO e CURTO — o å curto, como em 'åtta' —, NG nasal sem estalar o G e um T seco que gruda no 'är': LÓNG-té; 'är' = é (na fala, quase só 'e'); 'det' = dê; a força da frase cai no LÓNGT)",
    ponteSonora:
      "RRÜR?! LÓNG-TÉ DÊ? (4 batidas: rrü-LÓNG-té-dê, força TODA no LÓNG; RRÜR é o 'hur' de sempre — o MESMO de 'Hur kommer jag till Storgatan?' e 'Hur bokar man tvättstugan?', o RRÜ de 'Hur mår du?': RR soprado de carioca (é o h), Ü de BICO — lábios de U, língua de I, nunca o U chapado de 'urso' — e o R final BRANDO, que quase some antes do L; LÓNG-T = o 'LONG T' da cena, um T LONGUÍSSIMO: LONG é o mesmo LONG do pescoço LONGUÍSSIMO da Sâmara em 'Kan du prata lite långsammare?', mas dito como o 'long' de 'long neck' — Ó ABERTO e CURTO de 'só' (é o å curto, sempre curto antes de NG: o mesmo do CÓ de 'kommer' e do ÓTA de 'åtta'), nunca o 'lõ' nasal e fechado de 'longo'; a língua fecha no fundo, NG de 'ping', e o G não estala nem vira 'gui'; o T é o T DA TRILHA, e é ele que faz 'långt' (longe): sem ele sobra 'lång', que é 'comprido, alto' — o pescoço da Sâmara NÃO tem T, a trilha do hamster tem; é só a consoante, seca, de 'tatu' — nunca a letra 'tê' nem 'tchi' —, e pra não escorregar ele já sai GRUDADO na vogal seguinte, que é o 'är': LÓNG-TÉ, do mesmo jeito que 'ont i' vira ÓN-TI em 'Jag har ont i magen'; TÉ DÊ = esse T + o 'är det' de 'Är det ledigt här?' e 'Är det till höger eller till vänster?': É aberto e curto (é o 'är'), DÊ fechado, o T de 'det' mudo; o TÉ sai fraco — quem leva a força é o LÓNG, nunca 'long-TÉ')",
    historia:
      'O hamster resolveu ir até o ponto de ônibus por conta própria, dentro da bola de corrida transparente, e lá vai ela rolando pela trilha de terra: RRÜÜR... RRÜÜR... Na entrada, uma placa de madeira em forma de T mostra o caminho — e a trilha inteira tem a mesma forma, só que é um T LONGUÍSSIMO: a perna corre reta até sumir no horizonte, e a parada fica lá na barra de cima, pequena feito um grão de milho. Ele freia, as bochechas murchas de cansaço, gruda o focinho no plástico, mede com os olhos aquele LONG T sem fim e pergunta, ofegante, com o T já colado no É: RRÜR?! LÓNG-TÉ DÊ? — quanto falta até lá, é longe?',
  },
  createScene,
  refine: { organic: ['hamster', 'cabeca'] },
}

export default card
