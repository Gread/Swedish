import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, cylinder, sphere, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Vilken film ska vi se?" — VIL? QUEN?... FILM(e)! SKA... VI... SÊ(de)!
 *
 * Saguão de cinema: piso xadrez vinho e preto, balcão da bomboniere ao fundo
 * com o copão de refrigerante listrado. No centro, um peixe-palhaço crítico de
 * cinema (de boina) num aquário redondo de rodinhas, com a água só até a
 * metade: encosta o focinho na pilha de latas de FILME, pergunta "O VIL...
 * QUEM é?", requebra a nadadeira no SKA, arregala os olhos — "eu VI!" — pro
 * copão e morre de SÊDE.
 *
 * Acento saturado: o vermelho vivo das listras do copo (SÊDE) — o resto do
 * vermelho do saguão é vinho apagado; o laranja é o próprio peixe.
 */

const PRETO_PISO = '#221c1e'
const VINHO = '#6f2430'
const BALCAO = '#7d2430'
const BALCAO_PAINEL = '#8f2d3a'
const BALCAO_ESC = '#3a1519'
const CREME = '#efe5d2'
const OURO = '#d4a24c'
const METAL = '#a3acb4'
const METAL_ESC = '#6d757d'
const BORRACHA = '#1d1c1f'
const PRATA = '#c9d0d6'
const LARANJA = '#f2731d'
const LARANJA_ESC = '#d65c12'
const BRANCO_PEIXE = '#fbf7f0'
const PRETO_PEIXE = '#191516'
const VERMELHO = '#e3322b' // acento: listras do copão (SÊDE)
const AMARELO = '#f6c945'

const GY = 0.16 // topo do piso xadrez
const TOPY = GY + 0.97 // tampo do balcão
const CART_X = 0.1
const CART_Z = 0.35
const PY = 0.28 // topo da plataforma do carrinho (local)
const BOWL_X = -0.45 // eixo do aquário (local do carrinho)
const R = 0.72 // raio do aquário
const BOWL_C = 0.613 // altura do centro da esfera acima do fundo
const WATER_H = 0.6 // nível final da água (pela metade)
const FISH_H = 0.57 // altura do centro do peixe acima do fundo do aquário
const FISH_YAW = -0.42
const FISH_TILT = 0.12

const FIN_LOW = 0.25 // nadadeira peitoral abaixada
const FIN_HIGH = -1.0 // erguida no passo de dança (pose final)

// ---- materiais transparentes ------------------------------------------------
function vidro(opacity: number, color = '#cdeeff') {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  })
}

/** Gomos verticais de um sólido torneado: listras de copo/balde de pipoca. */
function stripes(profile: [number, number][], color: string, count: number, grow = 1.012) {
  const g = new THREE.Group()
  const pts = profile.map(([r, y]) => new THREE.Vector2(r * grow, y))
  const width = (Math.PI * 2) / (count * 2)
  for (let i = 0; i < count; i++) {
    const geo = new THREE.LatheGeometry(pts, 6, i * width * 2, width)
    const m = new THREE.Mesh(geo, mat(color, { roughness: 0.35, size: 0.5 }))
    m.castShadow = true
    m.receiveShadow = true
    ;(m.material as THREE.Material).side = THREE.DoubleSide
    g.add(m)
  }
  return g
}

/** Nadadeira: lâmina laranja com borda preta (cópia maior, mais fina, atrás). */
function fin(outline: (s: THREE.Shape) => void, pivot: [number, number], edge = 1.13) {
  const g = new THREE.Group()
  const make = (depth: number, color: string, k: number) => {
    const shape = new THREE.Shape()
    outline(shape)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: depth * 0.4,
      bevelSize: depth * 0.4,
      bevelSegments: 2,
      curveSegments: 20,
    })
    geo.translate(-pivot[0], -pivot[1], -depth / 2)
    geo.scale(k, k, 1)
    geo.translate(pivot[0], pivot[1], 0)
    geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, mat(color, { roughness: 0.45, size: 0.4 }))
    m.castShadow = true
    m.receiveShadow = true
    return m
  }
  g.add(make(0.022, PRETO_PEIXE, edge))
  g.add(make(0.034, LARANJA, 1))
  return g
}

/** Faixa do peixe-palhaço: anel branco contornado de preto em volta do corpo. */
function band(x: number, w: number, ry: number, rz: number, y = 0) {
  const g = new THREE.Group()
  const preto = cylinder(1, 1, w + 0.05, PRETO_PEIXE, { roughness: 0.4 })
  preto.rotation.z = Math.PI / 2
  preto.scale.set(ry * 1.03, 1, rz * 1.035)
  const branco = cylinder(1, 1, w, BRANCO_PEIXE, { roughness: 0.4 })
  branco.rotation.z = Math.PI / 2
  branco.scale.set(ry * 1.06, 1, rz * 1.07)
  g.add(preto, branco)
  g.position.set(x, y, 0)
  return g
}

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number) {
  const s = rbox(w, h, 0.02, 0.006, VINHO, { roughness: 0.6 })
  s.position.set(x, y, 0)
  return s
}

/** F I L M — letras de traço grosso para a etiqueta da lata. */
function palavraFilm() {
  const g = new THREE.Group()
  const t = 0.026
  const h = 0.12
  // F
  g.add(stroke(t, h, -0.17, 0), stroke(0.07, t, -0.14, h / 2 - t / 2), stroke(0.055, t, -0.147, 0.004))
  // I
  g.add(stroke(t, h, -0.065, 0))
  // L
  g.add(stroke(t, h, 0.0, 0), stroke(0.065, t, 0.022, -h / 2 + t / 2))
  // M
  const m = new THREE.Group()
  m.add(stroke(t, h, -0.045, 0), stroke(t, h, 0.045, 0))
  const d1 = stroke(t, 0.075, -0.022, 0.022)
  d1.rotation.z = 0.55
  const d2 = stroke(t, 0.075, 0.022, 0.022)
  d2.rotation.z = -0.55
  m.add(d1, d2)
  m.position.x = 0.135
  g.add(m)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(71)

  // ---- saguão: piso xadrez vinho e preto -------------------------------------
  const base = new THREE.Group()
  const disco = cylinder(2.55, 2.62, 0.14, BALCAO_ESC, { roughness: 0.6 })
  disco.position.y = 0.07
  base.add(disco)
  const TILE = 0.46
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      const x = i * TILE
      const z = j * TILE
      if (Math.hypot(Math.abs(x) + TILE / 2, Math.abs(z) + TILE / 2) > 2.5) continue
      const cor = (i + j) % 2 === 0 ? VINHO : PRETO_PISO
      const ladrilho = rbox(TILE - 0.012, 0.02, TILE - 0.012, 0.006, cor, { roughness: 0.28 })
      ladrilho.position.set(x, GY - 0.01, z)
      base.add(ladrilho)
    }
  }
  const friso = torus(2.56, 0.03, OURO, { roughness: 0.3, metalness: 0.7 })
  friso.rotation.x = Math.PI / 2
  friso.position.y = 0.13
  base.add(friso)
  root.add(base)

  // ---- balcão da bomboniere ao fundo ----------------------------------------
  const balcao = new THREE.Group()
  balcao.position.set(0, GY, -1.4)
  root.add(balcao)

  const corpoBalcao = rbox(3.0, 0.88, 0.6, 0.05, BALCAO, { roughness: 0.5 })
  corpoBalcao.position.y = 0.48
  balcao.add(corpoBalcao)
  const rodape = rbox(2.92, 0.1, 0.55, 0.03, BALCAO_ESC, { roughness: 0.6 })
  rodape.position.y = 0.05
  balcao.add(rodape)
  const tampo = rbox(3.15, 0.07, 0.74, 0.03, CREME, { roughness: 0.3 })
  tampo.position.y = 0.935
  balcao.add(tampo)
  for (let i = -2; i <= 2; i++) {
    const painel = rbox(0.48, 0.5, 0.04, 0.03, BALCAO_PAINEL, { roughness: 0.45 })
    painel.position.set(i * 0.58, 0.44, 0.305)
    balcao.add(painel)
  }
  for (const y of [0.13, 0.78]) {
    const filete = rbox(2.98, 0.03, 0.03, 0.012, OURO, { roughness: 0.3, metalness: 0.7 })
    filete.position.set(0, y, 0.31)
    balcao.add(filete)
  }
  // lâmpadas de letreiro de cinema na borda do balcão
  for (let i = 0; i < 15; i++) {
    const lamp = sphere(0.028, '#fff1c8', { emissive: '#ffd27a', emissiveIntensity: 1.1 })
    lamp.position.set(-1.4 + i * 0.2, 0.86, 0.315)
    balcao.add(lamp)
  }
  // balde de pipoca à esquerda
  const BALDE: [number, number][] = [[0, 0], [0.13, 0], [0.14, 0.02], [0.19, 0.36], [0.17, 0.36], [0, 0.34]]
  const balde = new THREE.Group()
  balde.position.set(-1.0, 0.97, 0.02)
  balde.add(lathe(BALDE, CREME, { roughness: 0.5 }))
  balde.add(stripes(BALDE.slice(1, 4), BALCAO_PAINEL, 7))
  const pipoca = puff(0.15, '#fff3cf', 9, 12, { roughness: 0.9 })
  pipoca.position.y = 0.4
  pipoca.scale.set(1.15, 0.7, 1.15)
  balde.add(pipoca)
  balcao.add(balde)
  // caixinhas de bala
  for (const [bx, cor, rot] of [[-0.55, '#2f7f86', 0.2], [-0.32, '#d9a93a', -0.15]] as const) {
    const caixa = rbox(0.17, 0.24, 0.08, 0.02, cor, { roughness: 0.5 })
    caixa.position.set(bx, 0.97 + 0.12, 0.05)
    caixa.rotation.y = rot
    balcao.add(caixa)
  }

  // ---- copão de refrigerante (acento vermelho) — no balcão -------------------
  const copo = new THREE.Group()
  copo.position.set(1.0, TOPY, -1.35)
  root.add(copo)
  const COPO: [number, number][] = [[0, 0], [0.15, 0], [0.165, 0.02], [0.235, 0.62], [0, 0.6]]
  copo.add(lathe(COPO, '#fdfaf4', { roughness: 0.35 }))
  copo.add(stripes(COPO.slice(1, 4), VERMELHO, 8))
  const tampa = lathe([[0, 0.6], [0.25, 0.6], [0.255, 0.635], [0.2, 0.67], [0.05, 0.69], [0, 0.69]], '#fdfaf4', { roughness: 0.3 })
  copo.add(tampa)
  const canudo = new THREE.Group()
  canudo.position.set(0.05, 0.62, 0)
  const haste = cylinder(0.024, 0.024, 0.42, VERMELHO, { roughness: 0.3 })
  haste.position.y = 0.21
  canudo.add(haste)
  const dobra = sphere(0.024, VERMELHO, { roughness: 0.3 })
  dobra.position.y = 0.42
  canudo.add(dobra)
  const ponta = cylinder(0.024, 0.024, 0.2, VERMELHO, { roughness: 0.3 })
  ponta.rotation.z = Math.PI / 2 - 0.5
  ponta.position.set(-0.088, 0.468, 0)
  canudo.add(ponta)
  copo.add(canudo)
  // gotas de condensação: tá gelado
  for (let i = 0; i < 9; i++) {
    const a = 0.2 + rand() * 1.9
    const y = 0.12 + rand() * 0.42
    const r = 0.165 + (0.07 * y) / 0.62 + 0.012
    const gota = sphere(0.016, '#e8f6ff', { roughness: 0.05, metalness: 0.1 })
    gota.scale.set(0.8, 1.15, 0.6)
    gota.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    copo.add(gota)
  }

  // ---- carrinho de metal com rodinhas ---------------------------------------
  const carrinho = new THREE.Group()
  carrinho.position.set(CART_X, GY, CART_Z)
  root.add(carrinho)
  const plataforma = rbox(2.1, 0.08, 1.3, 0.03, METAL, { roughness: 0.35, metalness: 0.6 })
  plataforma.position.y = PY - 0.04
  carrinho.add(plataforma)
  for (const z of [-0.64, 0.64]) {
    const trilho = rbox(2.12, 0.05, 0.04, 0.018, METAL_ESC, { roughness: 0.35, metalness: 0.6 })
    trilho.position.set(0, PY + 0.015, z)
    carrinho.add(trilho)
  }
  for (const x of [-1.04, 1.04]) {
    const trilho = rbox(0.04, 0.05, 1.32, 0.018, METAL_ESC, { roughness: 0.35, metalness: 0.6 })
    trilho.position.set(x, PY + 0.015, 0)
    carrinho.add(trilho)
  }
  for (const x of [-0.88, 0.88]) {
    for (const z of [-0.5, 0.5]) {
      const giro = cylinder(0.06, 0.06, 0.025, METAL_ESC, { roughness: 0.35, metalness: 0.6 })
      giro.position.set(x, 0.185, z)
      carrinho.add(giro)
      for (const s of [-1, 1]) {
        const garfo = rbox(0.05, 0.12, 0.012, 0.005, METAL_ESC, { roughness: 0.35, metalness: 0.6 })
        garfo.position.set(x, 0.115, z + s * 0.04)
        carrinho.add(garfo)
      }
      const roda = cylinder(0.075, 0.075, 0.055, BORRACHA, { roughness: 0.8 })
      roda.rotation.x = Math.PI / 2
      roda.position.set(x, 0.075, z)
      carrinho.add(roda)
      const cubo = cylinder(0.03, 0.03, 0.062, METAL, { roughness: 0.3, metalness: 0.7 })
      cubo.rotation.x = Math.PI / 2
      cubo.position.set(x, 0.075, z)
      carrinho.add(cubo)
    }
  }

  // ---- aquário redondo (vidro) — filho do carrinho ---------------------------
  const aquario = new THREE.Group()
  aquario.position.set(BOWL_X, PY, 0)
  carrinho.add(aquario)
  const perfil: THREE.Vector2[] = []
  for (let i = 0; i <= 28; i++) {
    const th = 0.55 + ((Math.PI - 0.62 - 0.55) * i) / 28
    perfil.push(new THREE.Vector2(R * Math.sin(th), BOWL_C - R * Math.cos(th)))
  }
  const globo = new THREE.Mesh(new THREE.LatheGeometry(perfil, 64), vidro(0.2))
  aquario.add(globo)
  const fundo = new THREE.Mesh(new THREE.CylinderGeometry(0.378, 0.378, 0.03, 48), vidro(0.35))
  fundo.position.y = 0.015
  aquario.add(fundo)
  const borda = new THREE.Mesh(new THREE.TorusGeometry(R * Math.sin(Math.PI - 0.62), 0.024, 16, 64), vidro(0.5, '#e2f5ff'))
  borda.rotation.x = Math.PI / 2
  borda.position.y = BOWL_C + R * Math.cos(0.62)
  aquario.add(borda)
  // cascalho colorido no fundo
  const cascalho = ['#e7b6a5', '#a8cfd8', '#f0d48c', '#b9d6a8', '#f2ece0']
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(rand()) * 0.3
    const pedra = rock(0.045 + rand() * 0.02, cascalho[i % cascalho.length], 100 + i, { roughness: 0.6 })
    pedra.position.set(Math.cos(a) * d, 0.045, Math.sin(a) * d)
    pedra.scale.y = 0.6
    aquario.add(pedra)
  }
  // plantinha
  for (let i = 0; i < 3; i++) {
    const folha = cylinder(0.018, 0.026, 0.3 + i * 0.06, '#4f9a5a', { roughness: 0.6 })
    folha.position.set(-0.2 + i * 0.05, 0.15 + i * 0.03, -0.18)
    folha.rotation.set(0.1 * i, 0, 0.25 - i * 0.22)
    aquario.add(folha)
  }

  // ---- água (pela metade) — filha do aquário ---------------------------------
  const agua = new THREE.Group()
  aquario.add(agua)
  const perfilAgua: THREE.Vector2[] = [new THREE.Vector2(0, 0.032)]
  for (let i = 0; i <= 16; i++) {
    const h = 0.032 + ((WATER_H - 0.032) * i) / 16
    const yr = h - BOWL_C
    perfilAgua.push(new THREE.Vector2(Math.sqrt((R - 0.018) ** 2 - yr * yr), h))
  }
  perfilAgua.push(new THREE.Vector2(0, WATER_H))
  const aguaMat = new THREE.MeshPhysicalMaterial({
    color: '#58b8ea',
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  })
  agua.add(new THREE.Mesh(new THREE.LatheGeometry(perfilAgua, 64), aguaMat))

  // ---- latas de filme — filhas do carrinho, encostadas no aquário ------------
  const latas = new THREE.Group()
  latas.position.set(0.47, PY, 0.36)
  carrinho.add(latas)
  const CAN_H = 0.1
  for (let i = 0; i < 5; i++) {
    const lata = new THREE.Group()
    lata.position.set((rand() - 0.5) * 0.06, CAN_H / 2 + i * (CAN_H + 0.004), (rand() - 0.5) * 0.06)
    lata.rotation.set((rand() - 0.5) * 0.05, rand() * Math.PI, (rand() - 0.5) * 0.05)
    const corpo = cylinder(0.26, 0.26, CAN_H, PRATA, { roughness: 0.28, metalness: 0.75 }, 48)
    lata.add(corpo)
    const sulco = cylinder(0.263, 0.263, 0.014, METAL_ESC, { roughness: 0.35, metalness: 0.7 }, 48)
    lata.add(sulco)
    const aro = torus(0.235, 0.01, '#dfe4e8', { roughness: 0.25, metalness: 0.75 })
    aro.rotation.x = Math.PI / 2
    aro.position.y = CAN_H / 2
    lata.add(aro)
    if (i === 4) {
      // tampa de cima: cara de rolo de filme (cubo + 3 janelas)
      const cuboRolo = cylinder(0.06, 0.06, 0.012, METAL_ESC, { roughness: 0.3, metalness: 0.7 })
      cuboRolo.position.y = CAN_H / 2 + 0.004
      lata.add(cuboRolo)
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI * 2) / 3
        const janela = cylinder(0.055, 0.055, 0.01, '#3b3f44', { roughness: 0.4, metalness: 0.5 })
        janela.position.set(Math.cos(a) * 0.15, CAN_H / 2 + 0.003, Math.sin(a) * 0.15)
        lata.add(janela)
      }
    }
    latas.add(lata)
  }
  // etiqueta "FILM" colada de frente para a câmera
  const etiqueta = new THREE.Group()
  etiqueta.position.set(0.04, 0.2, 0.262)
  etiqueta.rotation.y = 0.12
  const papel = rbox(0.46, 0.17, 0.014, 0.01, CREME, { roughness: 0.75 })
  etiqueta.add(papel)
  const palavra = palavraFilm()
  palavra.position.z = 0.012
  etiqueta.add(palavra)
  latas.add(etiqueta)
  // película escapando da lata do meio e caindo na bandeja
  const pelicula = new THREE.Group()
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.24, 0.25, 0.08),
    new THREE.Vector3(0.36, 0.2, 0.18),
    new THREE.Vector3(0.4, 0.08, 0.3),
    new THREE.Vector3(0.36, 0.012, 0.44),
    new THREE.Vector3(0.18, 0.012, 0.5),
  ])
  const N = 18
  for (let i = 0; i < N; i++) {
    const p = curva.getPointAt((i + 0.5) / N)
    const tg = curva.getTangentAt((i + 0.5) / N)
    const quadro = rbox(0.075, 0.008, 0.06, 0.003, i % 2 ? '#2e211b' : '#3a2a22', { roughness: 0.4 })
    quadro.position.copy(p)
    quadro.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tg.normalize())
    const foto = rbox(0.05, 0.01, 0.034, 0.003, '#c98a3c', { roughness: 0.35 })
    quadro.add(foto)
    pelicula.add(quadro)
  }
  latas.add(pelicula)

  // ---- peixe-palhaço: rig parado; as peças nascem na origem dele ------------
  const fishRig = new THREE.Group()
  const ax = CART_X + BOWL_X
  fishRig.position.set(
    ax + Math.cos(FISH_YAW) * 0.05,
    GY + PY + FISH_H,
    CART_Z - Math.sin(FISH_YAW) * 0.05,
  )
  fishRig.rotation.set(0, FISH_YAW, FISH_TILT)
  root.add(fishRig)

  // corpo (orgânico): frente em +x, dorso em +y, flanco da câmera em +z
  const peixe = new THREE.Group()
  fishRig.add(peixe)
  const corpo = sphere(1, LARANJA, { roughness: 0.42 })
  corpo.scale.set(0.36, 0.27, 0.2)
  peixe.add(corpo)
  const cabecaPeixe = sphere(1, LARANJA, { roughness: 0.42 })
  cabecaPeixe.scale.set(0.22, 0.23, 0.19)
  cabecaPeixe.position.set(0.2, 0.0, 0)
  peixe.add(cabecaPeixe)
  const focinho = sphere(1, LARANJA, { roughness: 0.42 })
  focinho.scale.set(0.13, 0.12, 0.12)
  focinho.position.set(0.36, -0.035, 0)
  peixe.add(focinho)
  const pedunculo = sphere(1, LARANJA, { roughness: 0.42 })
  pedunculo.scale.set(0.16, 0.11, 0.08)
  pedunculo.position.set(-0.34, 0, 0)
  peixe.add(pedunculo)
  peixe.add(band(0.165, 0.07, 0.24, 0.19))
  peixe.add(band(-0.07, 0.085, 0.265, 0.197))
  peixe.add(band(-0.31, 0.05, 0.15, 0.11))

  // rosto: olhos grandes, boca aberta numa pergunta, boina de crítico
  const rosto = new THREE.Group()
  fishRig.add(rosto)
  const olhar = new THREE.Vector3(0.62, 0.18, 0.77).normalize()
  for (const side of [-1, 1]) {
    const c = new THREE.Vector3(0.31, 0.1, side * 0.12)
    const esclera = sphere(0.085, '#ffffff', { roughness: 0.2 })
    esclera.position.copy(c)
    const pupila = sphere(0.047, '#141214', { roughness: 0.15 })
    pupila.position.copy(c).addScaledVector(olhar, 0.052)
    const brilho = sphere(0.014, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 })
    brilho.position.copy(c).addScaledVector(olhar, 0.09).add(new THREE.Vector3(0.008, 0.02, 0))
    rosto.add(esclera, pupila, brilho)
  }
  const goela = sphere(1, '#5a1d1a', { roughness: 0.6 })
  goela.scale.set(0.05, 0.06, 0.06)
  goela.position.set(0.465, -0.04, 0)
  rosto.add(goela)
  const labios = torus(0.058, 0.024, LARANJA_ESC, { roughness: 0.4 })
  labios.rotation.y = Math.PI / 2
  labios.position.set(0.475, -0.04, 0)
  rosto.add(labios)
  const boina = new THREE.Group()
  boina.position.set(0.16, 0.255, 0)
  boina.rotation.z = 0.28
  const feltro = sphere(1, '#2b2a36', { roughness: 0.9 })
  feltro.scale.set(0.16, 0.05, 0.14)
  boina.add(feltro)
  const pino = cylinder(0.012, 0.016, 0.04, '#2b2a36', { roughness: 0.9 })
  pino.position.y = 0.06
  boina.add(pino)
  rosto.add(boina)

  // nadadeiras fixas: cauda, dorsal e a peitoral do lado de lá
  const nadadeiras = new THREE.Group()
  fishRig.add(nadadeiras)
  nadadeiras.add(fin((s) => {
    s.moveTo(-0.4, 0.07)
    s.quadraticCurveTo(-0.52, 0.22, -0.64, 0.18)
    s.quadraticCurveTo(-0.58, 0.0, -0.64, -0.18)
    s.quadraticCurveTo(-0.52, -0.22, -0.4, -0.07)
    s.closePath()
  }, [-0.42, 0]))
  nadadeiras.add(fin((s) => {
    s.moveTo(0.14, 0.18)
    s.quadraticCurveTo(0.07, 0.37, -0.04, 0.32)
    s.quadraticCurveTo(-0.12, 0.29, -0.16, 0.33)
    s.quadraticCurveTo(-0.27, 0.34, -0.31, 0.12)
    s.lineTo(0.14, 0.12)
    s.closePath()
  }, [-0.08, 0.16], 1.08))
  const peitoral = (s: THREE.Shape) => {
    s.moveTo(0, -0.04)
    s.quadraticCurveTo(-0.17, -0.13, -0.21, 0)
    s.quadraticCurveTo(-0.17, 0.13, 0, 0.04)
    s.closePath()
  }
  const peitoralLonge = new THREE.Group()
  peitoralLonge.position.set(0.12, -0.05, -0.18)
  peitoralLonge.rotation.set(0, -0.6, 0.15)
  peitoralLonge.add(fin(peitoral, [0, 0]))
  nadadeiras.add(peitoralLonge)

  // nadadeira peitoral do lado da câmera: requebra no SKA (gira na raiz)
  const nadadeira = new THREE.Group()
  nadadeira.position.set(0.12, -0.05, 0.18)
  nadadeira.rotation.set(0, 0.6, FIN_HIGH)
  nadadeira.add(fin(peitoral, [0, 0]))
  fishRig.add(nadadeira)

  // ---- "?" da pergunta: O VIL... QUEM é? -------------------------------------
  const pergunta = new THREE.Group()
  pergunta.position.set(-1.25, 1.95, 0.5)
  pergunta.rotation.y = 0.2
  root.add(pergunta)
  const arco = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.042, 16, 40, Math.PI * 1.5),
    mat(AMARELO, { roughness: 0.4, size: 0.3 }),
  )
  arco.castShadow = true
  arco.rotation.z = -Math.PI / 2
  arco.position.y = 0.1
  pergunta.add(arco)
  const haste2 = rbox(0.084, 0.11, 0.084, 0.03, AMARELO, { roughness: 0.4 })
  haste2.position.y = -0.07
  pergunta.add(haste2)
  const ponto = sphere(0.052, AMARELO, { roughness: 0.4 })
  ponto.position.y = -0.22
  pergunta.add(ponto)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'saguao', object: base },
    { name: 'balcao', group: 'saguao', object: balcao },
    { name: 'carrinho', group: 'aquario', object: carrinho },
    { name: 'aquario', group: 'aquario', object: aquario },
    { name: 'agua', group: 'aquario', object: agua },
    { name: 'peixe', group: 'peixe', object: peixe },
    { name: 'rosto', group: 'peixe', object: rosto },
    { name: 'nadadeiras', group: 'peixe', object: nadadeiras },
    { name: 'nadadeira', group: 'peixe', object: nadadeira },
    { name: 'pergunta', group: 'vil', object: pergunta },
    { name: 'latas', group: 'film', object: latas },
    { name: 'copo', group: 'se', object: copo },
  ]

  // ---- montagem ------------------------------------------------------------
  const ONE = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]
  const T_FISH = 3.1
  const T_VIL = 4.5
  const T_FILM = 6.0
  const T_SKA = 7.7
  const T_VI = 9.4
  const T_SE = 10.9
  const T_END = 12.4

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'O saguão do cinema sobe do chão: piso xadrez e o balcão da bomboniere.',
    }),
    seq('balcao-rise', 'balcao', 0.35, 0.8, [riseFrom(GY, 1.3)], { ease: 'easeOut' }),

    seq('carrinho-entra', 'carrinho', 1.5, 1.1, [ch('position.x', -3.6, CART_X)], {
      ease: 'easeOut',
      caption: 'Entra rolando um aquário redondo de rodinhas — com a água só até a metade.',
    }),
    seq('aquario-balanca', 'aquario', 1.5, 1.3, [ch('rotation.z', -0.14, 0)], { ease: 'easeOut' }),
    seq('agua-balanca', 'agua', 1.5, 1.5, [ch('rotation.z', 0.1, 0), ch('scale.y', 1.18, 1.18)], {
      ease: 'easeOut',
    }),

    seq('peixe-surge', 'peixe', T_FISH, 0.6, ONE(0.01, 1), {
      ease: 'easeOut',
      caption: 'Lá dentro, um peixe-palhaço de boina: o crítico de cinema mais exigente do saguão.',
    }),
    seq('rosto-surge', 'rosto', T_FISH, 0.6, ONE(0.01, 1), { ease: 'easeOut' }),
    seq('nadadeiras-surgem', 'nadadeiras', T_FISH, 0.6, ONE(0.01, 1), { ease: 'easeOut' }),
    seq('nadadeira-surge', 'nadadeira', T_FISH, 0.6, [...ONE(0.01, 1), ch('rotation.z', FIN_LOW, FIN_LOW)], {
      ease: 'easeOut',
    }),

    seq('pergunta-surge', 'pergunta', T_VIL, 0.6, [...ONE(0.01, 1), ch('position.y', 1.6, 1.95)], {
      ease: 'easeOut',
      caption: 'Pra escolher, ele só faz uma pergunta: "O VIL... QUEM é?" — VÍL-ken. Filme sem vilão ele nem olha.',
    }),

    seq('latas-caem', 'latas', T_FILM, 0.55, [ch('position.y', PY + 1.4, PY)], {
      ease: 'easeIn',
      caption: 'Ele encosta o focinho numa pilha de latas de FILME — FILM, numa sílaba só.',
    }),
    seq('latas-quicam', 'latas', T_FILM + 0.55, 0.2, [ch('scale.y', 0.85, 1)], { ease: 'easeOut' }),

    seq('ska-1', 'nadadeira', T_SKA, 0.3, [ch('rotation.z', FIN_LOW, FIN_HIGH)], {
      ease: 'easeOut',
      caption: 'A vinheta toca SKA e ele requebra a nadadeira no contratempo…',
    }),
    seq('ska-2', 'nadadeira', T_SKA + 0.35, 0.25, [ch('rotation.z', FIN_HIGH, -0.3)]),
    seq('ska-3', 'nadadeira', T_SKA + 0.65, 0.25, [ch('rotation.z', -0.3, FIN_HIGH)]),
    seq('ska-4', 'nadadeira', T_SKA + 0.95, 0.25, [ch('rotation.z', FIN_HIGH, -0.3)]),
    seq('ska-5', 'nadadeira', T_SKA + 1.25, 0.25, [ch('rotation.z', -0.3, FIN_HIGH)]),

    seq('copo-sobe', 'copo', T_VI, 0.7, [riseFrom(TOPY, 0.8), ...ONE(0.4, 1)], {
      ease: 'easeOut',
      caption: '…mas arregala os olhões — "eu VI!" — pro copão de refrigerante no balcão.',
    }),

    seq('agua-baixa', 'agua', T_SE, 0.8, [ch('scale.y', 1.18, 1)], {
      ease: 'easeInOut',
      caption: 'Com o aquário pela metade, bate uma SÊDE absurda de peixe: SÊ!',
    }),

    seq('pergunta-pula', 'pergunta', T_END, 0.35, [ch('position.y', 1.95, 2.1)], {
      ease: 'easeOut',
      caption: 'Vilken film ska vi se? — Que filme a gente vai ver?',
    }),
    seq('pergunta-volta', 'pergunta', T_END + 0.35, 0.35, [ch('position.y', 2.1, 1.95)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.9, 2.45, 4.6], target: [0.05, 1.05, -0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'vilken-film-ska-vi-se',
    contexto:
      "Lazer: no sofá, rolando a Netflix ou o SVT Play, ou na frente do cartaz do Filmstaden. É 'vilken' porque 'film' é palavra de 'en' (en film); com palavra de 'ett' vira 'vilket' (vilket spel?).",
    fraseFonte: 'Que filme a gente vai ver?',
    fraseAlvo: 'Vilken film ska vi se?',
    pronuncia:
      "VÍL-ken FÍLM ska vi SÊÊ ('vilken' com a força no VIL, I curto e L de verdade, e o -ken fraco, E curto e N sem nasalizar; 'film' numa sílaba só, I curto, L de verdade — nunca 'fiu-mi' — e o M fechando a boca; 'ska vi' colados e sem força; 'se' = SÊÊ, Ê fechado e longo, com a força da frase, e sem S no fim)",
    ponteSonora:
      "VIL? QUEN?... FILM(e)! SKA... VI... SÊ(de)! (6 sílabas: VÍL-ken-FÍLM-ska-vi-SÊÊ; força no VIL, no FILM e, a maior, no SÊÊ; VIL-QUEN = o MESMO 'vilken' de 'Vilken dag är det idag?': VIL com I curto e L DE VERDADE, nunca 'viu', e QUEN = o QUEM? sem o 'ẽi' nasal do português — K duro, E curto, N batido na língua —, fraquinho e GRUDADO no VIL: VÍL-ken, uma palavra só; aqui é o peixe perguntando 'o VIL... QUEM é?'; QUEN é só o SOM — o 'quem' sueco é 'vem' — e o K logo depois do L é o que separa 'vilken' (qual) de 'vill' (quer); FILM(e) = o FILME sem o -E, numa sílaba só: FÍLM, I curto, L DE VERDADE com a língua no céu da boca — nunca o 'FIU-mi' do português — e o M fechando a boca no fim; SKA = o MESMO SKA da bandinha jamaicana de 'Ska vi säga imorgon klockan tre?' e 'Vad ska vi göra?', colado e sem força; VI = o 'eu VI', o mesmo de 'Vi ses!', curto e sem força; SÊ(de) = a SEDE cortada no SÊ: Ê FECHADO, LONGO e com a força da frase — e SEM S no fim: com S vira o SEIS de 'Vi ses!', outra frase)",
    historia:
      "No saguão do cinema, um peixe-palhaço passeia num aquário redondo de rodinhas e encosta o focinho numa pilha de latas de FILME. Pra escolher, ele só faz uma pergunta: 'O VIL... QUEM é?' — filme sem vilão caprichado ele nem olha. A vinheta toca SKA e ele requebra a nadadeira no contratempo, mas aí arregala os olhões — 'eu VI!' — pro copão de refrigerante no balcão e, com o aquário pela metade, bate uma SÊDE absurda de peixe. Ele vira os olhões pra você: e aí, que filme a gente vai ver?",
  },
  createScene,
  refine: { organic: ['peixe'] },
}

export default card
