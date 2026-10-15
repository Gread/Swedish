import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Det är fel pris." — DÊ É FÊL... P'RIS!
 *
 * No corredor do mercado, o rinoceronte lê a etiqueta gigante dos vidrinhos
 * de FEL (o mesmo vidro verde amargo de "Förlåt, det var mitt fel"): preço de
 * PARIS! Bufa DÊ É FÊL!, investe de cabeça baixa e o chifre arranca o A —
 * um disco redondo da etiqueta, espetado na ponta. Na prateleira sobra P◯RIS.
 *
 * Diorama: piso de ladrilho claro; prateleira de madeira clara ao fundo, à
 * direita, com cinco vidrinhos na tábua de cima e a etiqueta amarela furada
 * na de baixo; rinoceronte à esquerda, de cabeça baixa: investe contra a
 * etiqueta e depois se vira para o caixa (a câmera) com o A espetado no
 * chifre; um vidrinho caído derrama fel no chão; cestinha largada no corredor.
 */

const BASE = '#aeb4b8'
const TILE_A = '#dfe2e3'
const TILE_B = '#cdd2d5'
const WOOD = '#dcbd8f' // madeira clara
const WOOD_DARK = '#b8925f'
const BACK = '#4a5158' // fundo escuro da prateleira: o buraco lê como buraco
const RAIL = '#9ca3a9'
const RHINO = '#6e757b'
const RHINO_DARK = '#4f555a'
const HORN = '#e6d6b0'
const NAIL = '#d8c9a3'
const TAG = '#f2c01c' // amarelo de etiqueta de mercado
const TAG_DARK = '#d29f12'
const INK = '#2b2622'
const RED = '#d8302a' // acento: o A arrancado
const GLASS = '#3f6b3a' // o vidro de fel, igual ao de "Förlåt, det var mitt fel"
const FEL = '#a8e02a'
const LABEL = '#e8e2cf'
const CORK = '#b08048'
const SNORT = '#f3f4f2'
const BASKET = '#3f7d8c' // cestinha de plástico

const GY = 0.14 // topo do piso

// prateleira (gôndola) — frente = +z local
const SX = 1.2
const SZ = -0.85
const SYAW = -0.3
const SW = 1.85 // largura
const SD = 0.5 // profundidade
const SH = 1.92 // altura
const B1 = 0.62 // tábua de baixo (topo)
const B2 = 1.3 // tábua de cima (topo)

// etiqueta gigante — origem na borda de baixo, centro
const TW = 1.36
const TH = 0.58
const HX = -0.17 // centro do buraco do A
const HY = 0.29
const HR = 0.19
const LH = 0.3 // altura das letras
const T = 0.058 // traço das letras
const DEPTH = 0.026

// rinoceronte — frente = +z local
const RX = -1.3
const RZ = 0.1
const RYAW = 0.95 // pose final: virado para o caixa (a câmera)
const CHARGE_YAW = 1.95 // durante a investida: de frente para a etiqueta
const PITCH = 0.5 // cabeça baixa (pose final)
const READ_PITCH = 0.3
const YAW = -0.35 // cabeça vira um pouco para a câmera
const HORN_H = 0.7
const HORN_CURL = 0.26
const ESPETO = 0.74 // fração do chifre onde o disco do A está espetado
const CAM: [number, number, number] = [-0.12, 2.0, 4.75]

/** Traço de letra: caixinha de cantos arredondados no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0, color: string = INK) {
  const s = rbox(w, h, DEPTH, 0.012, color, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Arco de letra (bojo do P/R, curvas do S). */
function arc(r: number, len: number, x: number, y: number, rot: number, color: string = INK) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, T / 2, 10, 28, len),
    mat(color, { roughness: 0.5, size: r * 2 }),
  )
  m.position.set(x, y, 0)
  m.rotation.z = rot
  m.scale.z = DEPTH / T
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Letras de traço grosso, altura LH, centradas na origem. */
function letter(which: 'P' | 'R' | 'I' | 'S' | 'A', color: string = INK) {
  const g = new THREE.Group()
  const yt = LH / 2 - T / 2
  const yb = -0.005
  const rb = (yt - yb) / 2
  if (which === 'P' || which === 'R') {
    g.add(stroke(T, LH, -0.07, 0, 0, color))
    g.add(stroke(0.08, T, -0.035, yt, 0, color))
    g.add(stroke(0.08, T, -0.035, yb, 0, color))
    g.add(arc(rb, Math.PI, 0, (yt + yb) / 2, -Math.PI / 2, color))
    if (which === 'R') {
      const dx = 0.088
      const dy = -LH / 2 + 0.012 - yb
      g.add(stroke(T, Math.hypot(dx, dy) + 0.02, dx / 2 + 0.004, yb + dy / 2, Math.atan2(dx, -dy), color))
    }
  } else if (which === 'I') {
    g.add(stroke(T, LH, 0, 0, 0, color))
  } else if (which === 'S') {
    const r = (LH - T) / 4
    g.add(arc(r, 4.4, 0, r, 0.35, color))
    g.add(arc(r, 4.4, 0, -r, 0.35 + Math.PI, color))
  } else {
    const leg = Math.hypot(0.1, LH)
    const a = Math.atan2(0.1, LH)
    g.add(stroke(T, leg, -0.05, 0, -a, color))
    g.add(stroke(T, leg, 0.05, 0, a, color))
    g.add(stroke(0.11, T * 0.85, 0, -0.045, 0, color))
  }
  return g
}

/** Contorno arredondado, origem no meio da borda de baixo. */
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x0 = -w / 2
  const x1 = w / 2
  s.moveTo(x0 + r, 0)
  s.lineTo(x1 - r, 0)
  s.quadraticCurveTo(x1, 0, x1, r)
  s.lineTo(x1, h - r)
  s.quadraticCurveTo(x1, h, x1 - r, h)
  s.lineTo(x0 + r, h)
  s.quadraticCurveTo(x0, h, x0, h - r)
  s.lineTo(x0, r)
  s.quadraticCurveTo(x0, 0, x0 + r, 0)
  return s
}

/** Chifre curvo: cone com a ponta puxada para trás (−z), base em y=0. */
function hornMesh(r: number, h: number, curl: number, color: string) {
  const g = new THREE.ConeGeometry(r, h, 28, 12)
  g.translate(0, h / 2, 0)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / h
    p.setZ(i, p.getZ(i) - curl * h * t * t)
  }
  g.computeVertexNormals()
  const m = new THREE.Mesh(g, mat(color, { roughness: 0.42, size: h }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** O vidrinho de FEL — a mesma silhueta do vidro de "Förlåt, det var mitt fel". */
function makeJar(withCork = true) {
  const g = new THREE.Group()
  const s = 0.8
  const prof = (
    [
      [0, 0], [0.135, 0.008], [0.157, 0.055], [0.157, 0.26],
      [0.12, 0.32], [0.062, 0.365], [0.058, 0.44], [0.078, 0.468],
    ] as [number, number][]
  ).map(([r, y]) => [r * s, y * s] as [number, number])
  g.add(lathe(prof, GLASS, { roughness: 0.15 }))

  const label = rbox(0.17 * s, 0.15 * s, 0.02, 0.018 * s, LABEL, { roughness: 0.8 })
  label.position.set(0, 0.17 * s, 0.145 * s)
  g.add(label)
  const drop = sphere(0.048 * s, FEL, { roughness: 0.2 })
  drop.scale.set(1, 1.25, 0.35)
  drop.position.set(0, 0.17 * s, 0.158 * s)
  g.add(drop)

  if (withCork) {
    const cork = cylinder(0.05 * s, 0.058 * s, 0.1 * s, CORK, { roughness: 0.85 })
    cork.position.y = 0.5 * s
    g.add(cork)
  } else {
    const surface = cylinder(0.058 * s, 0.058 * s, 0.02, FEL, { roughness: 0.2 })
    surface.position.y = 0.452 * s
    g.add(surface)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- piso do mercado: ladrilho claro ---------------------------------------
  const piso = new THREE.Group()
  const disco = cylinder(2.62, 2.7, 0.13, BASE, { roughness: 0.7 })
  disco.position.y = 0.065
  piso.add(disco)
  const TILE = 0.5
  for (let i = -5; i <= 5; i++) {
    for (let j = -5; j <= 5; j++) {
      const cx = i * TILE
      const cz = j * TILE
      const far = Math.hypot(Math.abs(cx) + TILE / 2, Math.abs(cz) + TILE / 2)
      if (far > 2.58) continue
      const tile = rbox(TILE - 0.03, 0.014, TILE - 0.03, 0.006, (i + j) % 2 === 0 ? TILE_A : TILE_B, {
        roughness: 0.35,
      })
      tile.position.set(cx, GY - 0.007, cz)
      piso.add(tile)
    }
  }
  // cestinha de mercado largada no corredor
  const cesta = new THREE.Group()
  cesta.position.set(-1.55, GY, 1.05)
  cesta.rotation.y = -0.35
  const fundoCesta = rbox(0.5, 0.05, 0.34, 0.02, BASKET, { roughness: 0.45 })
  fundoCesta.position.y = 0.025
  cesta.add(fundoCesta)
  for (const [w, d, x, z] of [[0.5, 0.03, 0, 0.16], [0.5, 0.03, 0, -0.16], [0.03, 0.34, 0.25, 0], [0.03, 0.34, -0.25, 0]] as const) {
    const parede = rbox(w, 0.22, d, 0.012, BASKET, { roughness: 0.45 })
    parede.position.set(x, 0.12, z)
    cesta.add(parede)
  }
  for (const z of [-0.06, 0.06]) {
    const alca = torus(0.2, 0.014, '#2f3437', { roughness: 0.4 })
    alca.scale.y = 0.6
    alca.position.set(0, 0.23, z)
    cesta.add(alca)
  }
  const pao = capsule(0.06, 0.2, '#c99a5b', { roughness: 0.8 })
  pao.rotation.set(0.3, 0, Math.PI / 2 - 0.2)
  pao.position.set(-0.05, 0.2, 0.03)
  cesta.add(pao)
  const caixinha = rbox(0.12, 0.17, 0.08, 0.015, '#e9e4d6', { roughness: 0.6 })
  caixinha.position.set(0.13, 0.15, -0.05)
  caixinha.rotation.z = -0.2
  cesta.add(caixinha)
  piso.add(cesta)
  root.add(piso)

  // ---- prateleira de madeira clara -------------------------------------------
  const prateleira = new THREE.Group()
  prateleira.position.set(SX, GY, SZ)
  prateleira.rotation.y = SYAW

  for (const side of [-1, 1]) {
    const upright = rbox(0.08, SH, SD, 0.025, WOOD, { roughness: 0.6 })
    upright.position.set(side * (SW / 2 - 0.04), SH / 2, 0)
    prateleira.add(upright)
  }
  const fundo = rbox(SW - 0.1, SH - 0.08, 0.04, 0.01, BACK, { roughness: 0.75 })
  fundo.position.set(0, SH / 2, -SD / 2 + 0.03)
  prateleira.add(fundo)

  const armario = rbox(SW - 0.12, B1 - 0.05, SD - 0.05, 0.02, WOOD, { roughness: 0.6 })
  armario.position.set(0, (B1 - 0.05) / 2, -0.01)
  prateleira.add(armario)
  const rodape = rbox(SW - 0.1, 0.1, 0.03, 0.01, WOOD_DARK, { roughness: 0.6 })
  rodape.position.set(0, 0.05, SD / 2 - 0.02)
  prateleira.add(rodape)

  for (const by of [B1, B2]) {
    const tabua = rbox(SW - 0.1, 0.05, SD - 0.02, 0.015, WOOD, { roughness: 0.6 })
    tabua.position.set(0, by - 0.025, 0)
    prateleira.add(tabua)
    const trilho = rbox(SW - 0.1, 0.075, 0.03, 0.01, RAIL, { roughness: 0.35, metalness: 0.5 })
    trilho.position.set(0, by - 0.04, SD / 2)
    prateleira.add(trilho)
  }
  const coroa = rbox(SW + 0.02, 0.09, SD + 0.02, 0.03, WOOD_DARK, { roughness: 0.6 })
  coroa.position.set(0, SH, 0)
  prateleira.add(coroa)

  // etiquetinhas normais (brancas) no trilho de cima, sob cada vidro
  const JAR_XS = [-0.42, -0.14, 0.14, 0.42, 0.7]
  const SLOT_X = -0.7 // a vaga do vidro que caiu
  for (const x of [SLOT_X, ...JAR_XS]) {
    const tag = rbox(0.13, 0.06, 0.012, 0.006, '#f4f1e8', { roughness: 0.6 })
    tag.position.set(x, B2 - 0.04, SD / 2 + 0.02)
    prateleira.add(tag)
    const linha = rbox(0.07, 0.012, 0.006, 0.003, '#8a8f93', { roughness: 0.6 })
    linha.position.set(x, B2 - 0.035, SD / 2 + 0.028)
    prateleira.add(linha)
  }
  root.add(prateleira)

  // ---- cinco vidrinhos de FEL na tábua de cima (filhos da prateleira) --------
  const vidros = new THREE.Group()
  vidros.position.y = B2
  for (const x of JAR_XS) {
    const jar = makeJar()
    jar.position.set(x, 0, 0.02)
    jar.rotation.y = (rand() - 0.5) * 0.35
    vidros.add(jar)
  }
  prateleira.add(vidros)

  // ---- etiqueta gigante PARIS, já furada no A (filha da prateleira) ----------
  const etiqueta = new THREE.Group()
  etiqueta.position.set(0.06, B1 - 0.06, SD / 2 + 0.05)
  prateleira.add(etiqueta)

  const shape = roundedRect(TW, TH, 0.07)
  const furo = new THREE.Path()
  furo.absarc(HX, HY, HR, 0, Math.PI * 2, true)
  shape.holes.push(furo)
  const placaGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 28,
  })
  const placa = new THREE.Mesh(placaGeo, mat(TAG, { roughness: 0.45, size: TW }))
  placa.castShadow = true
  placa.receiveShadow = true
  etiqueta.add(placa)
  const FRONT = 0.04 // face da frente da placa

  // filete interno de acabamento
  const inset = 0.045
  for (const y of [inset, TH - inset]) {
    const f = rbox(TW - inset * 2, 0.014, 0.008, 0.004, TAG_DARK, { roughness: 0.5 })
    f.position.set(0, y, FRONT + 0.002)
    etiqueta.add(f)
  }
  for (const x of [-TW / 2 + inset, TW / 2 - inset]) {
    const f = rbox(0.014, TH - inset * 2, 0.008, 0.004, TAG_DARK, { roughness: 0.5 })
    f.position.set(x, TH / 2, FRONT + 0.002)
    etiqueta.add(f)
  }

  // P ◯ R I S
  const letras: ['P' | 'R' | 'I' | 'S', number][] = [['P', -0.48], ['R', 0.12], ['I', 0.31], ['S', 0.5]]
  for (const [l, x] of letras) {
    const g = letter(l)
    g.position.set(x, HY, FRONT + DEPTH / 2)
    etiqueta.add(g)
  }

  // pétalas rasgadas na borda do buraco, dobradas para trás (o chifre veio da frente)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.3
    const pivot = new THREE.Group()
    pivot.position.set(HX + Math.cos(a) * (HR - 0.004), HY + Math.sin(a) * (HR - 0.004), 0.015)
    pivot.rotation.z = a + Math.PI / 2
    const dobra = new THREE.Group()
    dobra.rotation.x = -0.9 - rand() * 0.4
    const petala = cone(0.035 + rand() * 0.015, 0.07 + rand() * 0.03, TAG, { roughness: 0.5 }, 3)
    petala.scale.z = 0.25
    petala.position.y = 0.04
    dobra.add(petala)
    pivot.add(dobra)
    etiqueta.add(pivot)
  }

  // presilhas no trilho
  for (const x of [-0.46, 0.46]) {
    const clip = rbox(0.08, 0.11, 0.07, 0.015, '#7d858c', { roughness: 0.35, metalness: 0.5 })
    clip.position.set(x, 0.03, -0.01)
    etiqueta.add(clip)
  }

  // ---- rinoceronte (frente = +z local) ----------------------------------------
  const rino = new THREE.Group()
  rino.position.set(RX, GY, RZ)
  rino.rotation.y = RYAW
  root.add(rino)

  const skin = { roughness: 0.8 }
  const torso = capsule(0.48, 0.7, RHINO, skin)
  torso.rotation.x = Math.PI / 2
  torso.position.set(0, 0.86, -0.05)
  torso.scale.set(0.92, 1, 1)
  rino.add(torso)

  const ombro = sphere(0.47, RHINO, skin)
  ombro.scale.set(0.95, 0.95, 0.85)
  ombro.position.set(0, 0.98, 0.36)
  rino.add(ombro)

  const anca = sphere(0.47, RHINO, skin)
  anca.scale.set(0.95, 0.95, 0.9)
  anca.position.set(0, 0.93, -0.5)
  rino.add(anca)

  const barriga = sphere(0.44, RHINO, skin)
  barriga.scale.set(0.95, 0.75, 1.45)
  barriga.position.set(0, 0.66, -0.05)
  rino.add(barriga)

  const pescoco = sphere(0.38, RHINO, skin)
  pescoco.scale.set(0.88, 1, 1)
  pescoco.position.set(0, 0.9, 0.76)
  rino.add(pescoco)

  // dobras da couraça: anéis que viram vincos na pele fundida
  for (const [z, r] of [[0.1, 0.032], [-0.3, 0.028]] as const) {
    const dobra = torus(0.445, r, '#666c71', skin)
    dobra.scale.set(1, 1.08, 1)
    dobra.position.set(0, 0.88, z)
    rino.add(dobra)
  }

  // patas: as da frente fincadas para a frente, as de trás empurrando
  for (const side of [-1, 1]) {
    for (const [z, tilt] of [[0.46, -0.16], [-0.52, 0.12]] as const) {
      const perna = capsule(0.165, 0.36, RHINO, skin)
      perna.position.set(side * 0.25, 0.38, z)
      perna.rotation.x = tilt
      rino.add(perna)
      const fz = z - Math.sin(tilt) * 0.33
      const pe = cylinder(0.17, 0.19, 0.13, '#62686d', skin)
      pe.position.set(side * 0.25, 0.065, fz)
      rino.add(pe)
      for (const k of [-1, 0, 1]) {
        const unha = sphere(0.046, NAIL, { roughness: 0.4 })
        unha.scale.set(1, 0.75, 0.6)
        unha.position.set(side * 0.25 + k * 0.095, 0.06, fz + 0.165 - Math.abs(k) * 0.03)
        rino.add(unha)
      }
    }
  }

  const rabo = capsule(0.03, 0.2, RHINO_DARK, skin)
  rabo.position.set(0, 0.95, -0.96)
  rabo.rotation.x = 0.45
  rino.add(rabo)
  const tufo = sphere(0.05, '#34383c', { roughness: 0.9 })
  tufo.scale.set(1, 1.3, 1)
  tufo.position.set(0, 0.82, -1.02)
  rino.add(tufo)

  // ---- cabeça (pivô no pescoço) -----------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.95, 0.88)
  cabeca.rotation.set(PITCH, YAW, 0)
  rino.add(cabeca)

  const cranio = sphere(0.33, RHINO, skin)
  cranio.scale.set(0.82, 0.92, 1.05)
  cranio.position.set(0, 0.04, 0.12)
  cabeca.add(cranio)

  const face = capsule(0.24, 0.32, RHINO, skin)
  face.rotation.x = Math.PI / 2
  face.scale.set(0.86, 1, 0.95)
  face.position.set(0, -0.04, 0.48)
  cabeca.add(face)

  const focinho = sphere(0.24, RHINO, skin)
  focinho.scale.set(0.95, 0.85, 0.85)
  focinho.position.set(0, -0.1, 0.78)
  cabeca.add(focinho)

  const beico = sphere(0.13, RHINO, skin)
  beico.scale.set(1.2, 0.65, 0.8)
  beico.position.set(0, -0.23, 0.9)
  cabeca.add(beico)

  const queixo = sphere(0.2, RHINO, skin)
  queixo.scale.set(0.8, 0.6, 1.2)
  queixo.position.set(0, -0.22, 0.55)
  cabeca.add(queixo)

  for (const side of [-1, 1]) {
    const narina = sphere(0.036, '#2e3236', { roughness: 0.4 })
    narina.scale.set(1, 0.7, 0.5)
    narina.position.set(side * 0.09, -0.1, 0.985)
    cabeca.add(narina)

    // orelhas deitadas para trás, de raiva
    const orelha = new THREE.Group()
    orelha.position.set(side * 0.19, 0.3, -0.06)
    orelha.rotation.set(-1.55, 0, -side * 0.3)
    const concha = capsule(0.065, 0.13, RHINO, skin)
    concha.position.y = 0.1
    orelha.add(concha)
    cabeca.add(orelha)

    // olhinhos bravos
    const esclera = sphere(0.066, '#ffffff', { roughness: 0.25 })
    esclera.scale.set(0.6, 1, 1)
    esclera.position.set(side * 0.2, 0.1, 0.4)
    const pupila = sphere(0.034, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.232, 0.092, 0.435)
    cabeca.add(esclera, pupila)

    const sobrancelha = rbox(0.04, 0.045, 0.19, 0.015, '#30353a', { roughness: 0.7 })
    sobrancelha.position.set(side * 0.22, 0.19, 0.4)
    sobrancelha.rotation.x = -0.4 // com a cabeça baixa, fica franzida: desce para o focinho
    cabeca.add(sobrancelha)
  }

  // ---- chifres (adereço rígido, não refinado) ---------------------------------
  const chifre = new THREE.Group()
  chifre.position.set(0, 0.06, 0.78)
  chifre.rotation.x = 0.12
  cabeca.add(chifre)
  chifre.add(hornMesh(0.15, HORN_H, HORN_CURL, HORN))
  const chifrinho = hornMesh(0.08, 0.2, 0.2, HORN)
  chifrinho.position.set(0, 0.06, -0.36)
  chifre.add(chifrinho)

  const espeto = new THREE.Object3D()
  espeto.position.set(0, ESPETO * HORN_H, -HORN_CURL * HORN_H * ESPETO * ESPETO)
  chifre.add(espeto)
  const ponta = new THREE.Object3D()
  ponta.position.set(0, HORN_H, -HORN_CURL * HORN_H)
  chifre.add(ponta)

  // ---- bufadas brancas saindo das narinas (filhas da cabeça) -----------------
  const bufos = new THREE.Group()
  cabeca.add(bufos)
  for (const side of [-1, 1]) {
    const jato = new THREE.Group()
    jato.position.set(side * 0.1, -0.12, 0.98)
    // aponta para fora e para a frente (com a cabeça baixa, sai rente ao chão)
    jato.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(side * 0.85, 0.55, 0.45).normalize(),
    )
    const cone1 = cone(0.06, 0.24, SNORT, { roughness: 0.9 })
    cone1.rotation.x = -Math.PI / 2 // ponta (+y) para trás, na narina
    cone1.position.z = 0.13
    jato.add(cone1)
    const nuvem = puff(0.075, SNORT, 5, 60 + side, { roughness: 0.9 })
    nuvem.position.z = 0.29
    jato.add(nuvem)
    bufos.add(jato)
  }

  // ---- poses de referência ---------------------------------------------------
  root.updateMatrixWorld(true)
  const holeW = etiqueta.localToWorld(new THREE.Vector3(HX, HY, 0.005))
  const tagE = new THREE.Euler().setFromQuaternion(etiqueta.getWorldQuaternion(new THREE.Quaternion()))

  /** Onde fica o ponto do espeto (no chifre) para uma pose do bicho. */
  const espetoAt = (x: number, z: number, yaw: number, pitch: number, hyaw: number) => {
    rino.position.set(x, GY, z)
    rino.rotation.y = yaw
    cabeca.rotation.set(pitch, hyaw, 0)
    rino.updateMatrixWorld(true)
    return espeto.getWorldPosition(new THREE.Vector3())
  }

  // impacto: de frente para a etiqueta, cabeça na altura certa para o espeto
  // cair no buraco; a posição do corpo sai do encaixe
  let IMPACT_PITCH = PITCH
  let best = Infinity
  for (let p = 0; p <= 1.4; p += 0.01) {
    const err = Math.abs(espetoAt(0, 0, CHARGE_YAW, p, 0).y - holeW.y)
    if (err < best) {
      best = err
      IMPACT_PITCH = p
    }
  }
  const e0 = espetoAt(0, 0, CHARGE_YAW, IMPACT_PITCH, 0)
  const IMPACT_X = holeW.x - e0.x
  const IMPACT_Z = holeW.z - e0.z
  const START_X = IMPACT_X - Math.sin(CHARGE_YAW) * 0.6
  const START_Z = IMPACT_Z - Math.cos(CHARGE_YAW) * 0.6

  // meio da virada (o A acompanha o chifre passando por aqui)
  const mid = (a: number, b: number) => (a + b) / 2
  const MID = espetoAt(mid(IMPACT_X, RX), mid(IMPACT_Z, RZ), mid(CHARGE_YAW, RYAW), mid(IMPACT_PITCH, PITCH), mid(0, YAW))

  // pose final (fica aplicada): virado para o caixa — você
  const espetoW = espetoAt(RX, RZ, RYAW, PITCH, YAW)
  const tipW = ponta.getWorldPosition(new THREE.Vector3())
  const hornDir = tipW.clone().sub(espetoW).normalize()

  // ---- o disco do A, arrancado da etiqueta e espetado no chifre --------------
  const letraA = new THREE.Group()
  const discoA = cylinder(HR - 0.012, HR - 0.012, 0.03, TAG, { roughness: 0.45 }, 40)
  discoA.rotation.x = Math.PI / 2
  discoA.position.z = 0.015
  letraA.add(discoA)
  const aroA = torus(HR - 0.012, 0.012, TAG_DARK, { roughness: 0.5 })
  aroA.position.z = 0.015
  letraA.add(aroA)
  const A = letter('A', RED)
  A.scale.setScalar(0.88)
  A.position.z = 0.03 + DEPTH / 2
  letraA.add(A)
  root.add(letraA)

  // pose final: encara a câmera (com um pouco do eixo do chifre), torto,
  // e o chifre passa pelo vão de baixo do A
  const toCam = new THREE.Vector3(...CAM).sub(espetoW).normalize()
  const normal = toCam.multiplyScalar(0.55).add(hornDir.clone().multiplyScalar(0.45)).normalize()
  letraA.position.copy(espetoW)
  letraA.lookAt(espetoW.clone().add(normal))
  letraA.rotateZ(-0.25)
  const pierce = new THREE.Vector3(0, 0.015, 0.015).applyQuaternion(letraA.quaternion)
  letraA.position.sub(pierce)
  const A_POS = letraA.position.clone()
  const A_ROT = letraA.rotation.clone()
  const A_MID = MID.clone().sub(pierce)

  // ---- farpas amarelas: o rastro do rasgo, saindo do buraco -------------------
  const farpas = new THREE.Group()
  root.add(farpas)
  // caídas no chão, logo abaixo do buraco
  const baseFarpas = etiqueta.localToWorld(new THREE.Vector3(HX, 0, 0.3))
  for (let i = 0; i < 5; i++) {
    const lasca = cone(0.045 + rand() * 0.02, 0.09 + rand() * 0.03, TAG, { roughness: 0.5 }, 3)
    lasca.scale.z = 0.22
    lasca.position.set(baseFarpas.x + (rand() - 0.5) * 0.6, GY + 0.012, baseFarpas.z + rand() * 0.3)
    lasca.rotation.set(-Math.PI / 2 + (rand() - 0.5) * 0.3, 0, rand() * Math.PI * 2)
    farpas.add(lasca)
  }

  // ---- vidrinho caído e poça de fel -------------------------------------------
  const slotW = prateleira.localToWorld(new THREE.Vector3(SLOT_X, B2, 0.02))
  const beiraW = prateleira.localToWorld(new THREE.Vector3(SLOT_X - 0.05, B2 + 0.02, SD / 2 + 0.55))
  const vidroCaido = makeJar(false)
  const CAIDO_POS = new THREE.Vector3(0.45, GY + 0.126, 0.75)
  const CAIDO_ROT = new THREE.Euler(0, -0.5, -Math.PI / 2)
  vidroCaido.position.copy(CAIDO_POS)
  vidroCaido.rotation.copy(CAIDO_ROT)
  root.add(vidroCaido)

  vidroCaido.updateMatrixWorld(true)
  const bocaW = vidroCaido.localToWorld(new THREE.Vector3(0, 0.39, 0))
  const poca = new THREE.Group()
  poca.position.set(bocaW.x + 0.22, GY + 0.004, bocaW.z + 0.08)
  const pool = cylinder(0.32, 0.3, 0.03, FEL, { roughness: 0.15 })
  pool.position.y = 0.015
  poca.add(pool)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.6
    const lobe = cylinder(0.13 + rand() * 0.07, 0.12, 0.026, FEL, { roughness: 0.15 })
    lobe.position.set(Math.cos(a) * 0.26, 0.013, Math.sin(a) * 0.26)
    poca.add(lobe)
  }
  for (let i = 0; i < 5; i++) {
    const a = rand() * Math.PI * 2
    const d = 0.45 + rand() * 0.3
    const pingo = sphere(0.025 + rand() * 0.025, FEL, { roughness: 0.15 })
    pingo.scale.y = 0.35
    pingo.position.set(Math.cos(a) * d, 0.012, Math.sin(a) * d)
    poca.add(pingo)
  }
  root.add(poca)

  // ---- peças -------------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'mercado', object: piso },
    { name: 'prateleira', group: 'mercado', object: prateleira },
    { name: 'vidros', group: 'fel', object: vidros },
    { name: 'vidroCaido', group: 'fel', object: vidroCaido },
    { name: 'etiqueta', group: 'paris', object: etiqueta },
    { name: 'letraA', group: 'paris', object: letraA },
    { name: 'rino', group: 'rino', object: rino },
    { name: 'cabeca', group: 'rino', object: cabeca },
    { name: 'chifre', group: 'rino', object: chifre },
    { name: 'bufos', group: 'bufo', object: bufos },
    { name: 'farpas', group: 'investida', object: farpas },
    { name: 'poca', group: 'investida', object: poca },
  ]

  const pop = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ----------------------------------------------------------------
  const HIT = 7.0
  const build = [
    seq('piso-rise', 'piso', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Brota um corredor de supermercado: piso claro e uma prateleira de madeira.',
    }),
    seq('prateleira-rise', 'prateleira', 0.15, 0.85, [riseFrom(GY, 2.1)], { ease: 'easeOut' }),

    seq('vidros-pop', 'vidros', 1.5, 0.6, pop(), {
      ease: 'easeOut',
      caption: 'Na tábua de cima, vidrinhos de FEL — aquele verde amargo, coisa baratinha.',
    }),
    seq('caido-pop', 'vidroCaido', 1.6, 0.6, pop(), { ease: 'easeOut' }),

    seq('etiqueta-pop', 'etiqueta', 2.9, 0.6, pop(), {
      ease: 'easeOut',
      caption: 'Mas a etiqueta gigante cobra preço de PARIS!',
    }),
    seq('a-pop', 'letraA', 2.9, 0.6, pop(), { ease: 'easeOut' }),

    seq('rino-rise', 'rino', 4.3, 0.9, [riseFrom(GY, 1.6)], {
      ease: 'easeOut',
      caption: 'Um rinoceronte lê a etiqueta… o amargo sobe até o chifre.',
    }),
    seq('cabeca-le', 'cabeca', 4.3, 0.9, [ch('rotation.x', 0.05, READ_PITCH)], { ease: 'easeInOut' }),
    seq('chifre-cresce', 'chifre', 4.9, 0.6, pop(0.05), { ease: 'easeOut' }),

    seq('bufos-pop', 'bufos', 5.7, 0.35, pop(), {
      ease: 'easeOut',
      caption: 'Ele bufa: DÊ É FÊL!',
    }),
    seq('bufos-pulsa', 'bufos', 6.15, 0.4, pop(0.55), { ease: 'easeOut' }),

    // investida: o chifre entra no buraco do A
    seq('rino-investe', 'rino', HIT - 0.4, 0.4, [
      ch('position.x', START_X, IMPACT_X),
      ch('position.z', START_Z, IMPACT_Z),
      ch('rotation.y', CHARGE_YAW, CHARGE_YAW),
    ], {
      ease: 'easeIn',
      caption: 'Abaixa a cabeça e investe: o chifre atravessa bem no A!',
    }),
    seq('cabeca-mira', 'cabeca', HIT - 0.4, 0.4, [
      ch('rotation.x', READ_PITCH, IMPACT_PITCH),
      ch('rotation.y', 0, 0),
    ], { ease: 'easeIn' }),
    // arranca o A e vira para o caixa
    seq('rino-vira', 'rino', HIT, 0.8, [
      ch('position.x', IMPACT_X, RX),
      ch('position.z', IMPACT_Z, RZ),
      ch('rotation.y', CHARGE_YAW, RYAW),
    ], {
      ease: 'easeInOut',
      caption: "O A sai espetado na ponta do chifre e ele se vira pro caixa: na etiqueta sobrou P'RIS — PRIS!",
    }),
    seq('cabeca-vira', 'cabeca', HIT, 0.8, [
      ch('rotation.x', IMPACT_PITCH, PITCH),
      ch('rotation.y', 0, YAW),
    ], { ease: 'easeInOut' }),
    seq('a-arranca', 'letraA', HIT, 0.4, [
      ch('position.x', holeW.x, A_MID.x),
      ch('position.y', holeW.y, A_MID.y),
      ch('position.z', holeW.z, A_MID.z),
      ch('rotation.x', tagE.x, mid(tagE.x, A_ROT.x)),
      ch('rotation.y', tagE.y, mid(tagE.y, A_ROT.y)),
      ch('rotation.z', tagE.z, mid(tagE.z, A_ROT.z)),
    ], { ease: 'easeIn' }),
    seq('a-acompanha', 'letraA', HIT + 0.4, 0.4, [
      ch('position.x', A_MID.x, A_POS.x),
      ch('position.y', A_MID.y, A_POS.y),
      ch('position.z', A_MID.z, A_POS.z),
      ch('rotation.x', mid(tagE.x, A_ROT.x), A_ROT.x),
      ch('rotation.y', mid(tagE.y, A_ROT.y), A_ROT.y),
      ch('rotation.z', mid(tagE.z, A_ROT.z), A_ROT.z),
    ], { ease: 'easeOut' }),
    seq('farpas-voam', 'farpas', HIT, 0.4, pop(), { ease: 'easeOut' }),

    // o tranco derruba um vidrinho
    // escorrega para fora da tábua e só então despenca (não atravessa a etiqueta)
    seq('caido-escorrega', 'vidroCaido', HIT + 0.1, 0.25, [
      ch('position.x', slotW.x, beiraW.x),
      ch('position.y', slotW.y, beiraW.y),
      ch('position.z', slotW.z, beiraW.z),
      ch('rotation.z', 0, -0.6),
      ch('rotation.y', 0, CAIDO_ROT.y * 0.4),
    ], { ease: 'easeOut' }),
    seq('caido-cai', 'vidroCaido', HIT + 0.35, 0.45, [
      ch('position.x', beiraW.x, CAIDO_POS.x),
      ch('position.y', beiraW.y, CAIDO_POS.y),
      ch('position.z', beiraW.z, CAIDO_POS.z),
      ch('rotation.z', -0.6, CAIDO_ROT.z),
      ch('rotation.y', CAIDO_ROT.y * 0.4, CAIDO_ROT.y),
    ], { ease: 'easeIn' }),
    seq('poca-espalha', 'poca', HIT + 0.8, 0.7, [ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
    }),

    seq('bufos-final', 'bufos', 9.3, 0.5, pop(0.5), {
      ease: 'easeOut',
      caption: 'Det är fel pris. — O preço está errado.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [-0.02, 0.85, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-fel-pris',
    contexto:
      "Mercado: no caixa do ICA, Coop ou Lidl, quando o valor que passou não bate com a etiqueta da prateleira — o clássico é a oferta (extrapris) que não entrou no sistema. Costuma vir junto: 'Det stod … kronor på hyllan' (na prateleira estava … coroas).",
    fraseFonte: 'O preço está errado.',
    fraseAlvo: 'Det är fel pris.',
    pronuncia:
      "dê é FÊL PRIIS ('det' = dê, o T não soa; 'är' = é, aberto e curto; 'fel' com Ê FECHADO e longo e L de verdade no fim, língua no céu da boca — nunca o 'féu' do português; 'pris' com R de um toque só, I longo e S sibilante, nunca o 'x' carioca; a força maior cai no FEL)",
    ponteSonora:
      "DÊ É FÊL... P'RIS! (4 sílabas: dê-é-FÊÊL-PRIIS; força no FÊL e no PRIS; DÊ É = o 'det är' de sempre, de 'Det är lugnt' e 'Det är akut': DÊ fechado e sem T, É aberto e curto; FÊL = o FEL, o líquido verde e amargo do vidro de 'Förlåt, det var mitt fel' — e em sueco 'fel' é justamente ERRADO —, mas dito com Ê FECHADO de 'você' e L DE VERDADE, a ponta da língua grudando no céu da boca: o português fala 'féu', com É aberto e o L virando U, e assim o sueco não reconhece; P'RIS = PARIS sem o A: o chifre arrancou o A, então o P cola direto no R — PRIS, uma sílaba só —, e o R é o de 'Paris' mesmo, um toque só, de 'caro'; o I fica LONGO e com a força que já tinha em 'Pa-RIS'; S de cobra no fim, nunca o 'Paríx' carioca)",
    historia:
      'No corredor do mercado, o rinoceronte pega um vidrinho de FEL — aquele verde amargo, coisa baratinha — e lê a etiqueta: preço de PARIS! O amargo sobe até o chifre e ele bufa: DÊ É FÊL! Abaixa a cabeça, investe contra a etiqueta e o chifre atravessa bem no A, que sai espetado na ponta. Na prateleira sobra só P·RIS, e ele aponta o chifre pro caixa: DÊ É FÊL... PRIS! — esse preço está errado.',
  },
  createScene,
  refine: { organic: ['rino', 'cabeca'] },
}

export default card
