import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Smaklig måltid!" — SMÁÁC-LI MÔL-TIID!
 *
 * Deque de madeira à beira-mar. Uma BALEIA-chef azul-marinho de touca branca
 * serviu o banquete numa mesa comprida de toalha xadrez. Com uma nadadeira
 * ela faz o beijo de chef nos beiços (SMÁÁC!, estrelinhas douradas), pelo
 * respiradouro jorra um arco de MÔLHO marrom que cai certinho na travessa, e
 * com a outra nadadeira baixa a bandeira VERDE de largada: parTÍDa!
 *
 * Acento saturado reservado: a bandeira verde (TIID); o molho é marrom
 * brilhante e as estrelas são a única luz própria da cena.
 */

const MAR = '#4f8fa3'
const MAR_ESC = '#3c7488'
const ESPUMA = '#e8f1f2'
const DEQUE = '#d2b083'
const DEQUE_ESC = '#b8935f'
const ESTACA = '#7a5a3c'
const CORDA = '#cdb689'
const TOALHA = '#f4efe6'
const XADREZ = '#b8433f'
const MESA = '#8a6040'
const LOUCA = '#f7f5f0'
const BALEIA = '#2f4f7d'
const BALEIA_ESC = '#243d62'
const BARRIGA = '#efe2c4'
const SULCO = '#cdb48a'
const BEICO = '#c45f6c'
const MOLHO = '#6a3816'
const MOLHO_CLARO = '#8a4d22'
const VERDE = '#1fb34a' // acento: a bandeira de largada (parTÍDa)
const OURO = '#ffd23a'

const DY = 0.22 // topo do deque
const MESA_Z = 1.08
const MESA_H = 0.42 // altura do tampo acima do deque

// corpo da baleia: elipsoide sentado no deque
const BC = new THREE.Vector3(0, 1.38, -0.35)
const BR = new THREE.Vector3(1.0, 1.2, 0.85)

/** ponto na superfície do corpo na direção (aprox.) d */
function naPele(dx: number, dy: number, dz: number) {
  const d = new THREE.Vector3(dx, dy, dz).normalize()
  return new THREE.Vector3(BC.x + d.x * BR.x, BC.y + d.y * BR.y, BC.z + d.z * BR.z)
}

const OMBRO_E = new THREE.Vector3(-0.95, 1.26, -0.22)
const OMBRO_D = new THREE.Vector3(0.95, 1.26, -0.22)
const BEICOS = naPele(0, 0.24, 0.97)

// nadadeira da bandeira: repouso, erguida e pose final (rotation.z)
const BAND_REPOUSO = 0.3
const BAND_ALTO = 2.85
const BAND_FINAL = 2.3

function setShadow(m: THREE.Mesh) {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Nadadeira peitoral: remo achatado pendurado do ombro (ao longo de -y). */
function nadadeira(len: number) {
  const g = new THREE.Group()
  const remo = capsule(0.17, len - 0.34, BALEIA, { roughness: 0.5 })
  remo.scale.set(1.15, 1, 0.45)
  remo.position.y = -len / 2
  g.add(remo)
  const ponta = sphere(0.13, BALEIA_ESC, { roughness: 0.5 })
  ponta.scale.set(1.1, 1.2, 0.5)
  ponta.position.y = -len + 0.16
  g.add(ponta)
  return g
}

function estrela(r: number) {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    if (i === 0) shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
    else shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: r * 0.25,
    bevelEnabled: true,
    bevelThickness: r * 0.1,
    bevelSize: r * 0.1,
    bevelSegments: 2,
  })
  geo.center()
  return setShadow(new THREE.Mesh(geo, mat(OURO, { emissive: '#ffbf1a', emissiveIntensity: 1.3, roughness: 0.3 })))
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- deque à beira-mar ---------------------------------------------------
  const deque = new THREE.Group()

  const mar = cylinder(2.75, 2.8, 0.1, MAR, { roughness: 0.18 })
  mar.position.y = 0.05
  deque.add(mar)
  // espuma batendo nas bordas do deque: tufos baixos e pequenos
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.2
    const espuma = puff(0.07 + rand() * 0.04, ESPUMA, 4, 60 + i, { roughness: 0.6 })
    espuma.scale.y = 0.45
    espuma.position.set(Math.cos(a) * 2.36, 0.1, Math.sin(a) * 2.36)
    deque.add(espuma)
  }
  const anel = torus(2.62, 0.025, MAR_ESC, { roughness: 0.3 })
  anel.rotation.x = Math.PI / 2
  anel.position.y = 0.1
  deque.add(anel)

  const tablado = cylinder(2.3, 2.3, 0.1, DEQUE_ESC, { roughness: 0.8 })
  tablado.position.y = DY - 0.06
  deque.add(tablado)
  for (let i = -6; i <= 6; i++) {
    const z = i * 0.35
    const meia = Math.sqrt(Math.max(0, 2.26 * 2.26 - (Math.abs(z) + 0.17) ** 2))
    if (meia < 0.2) continue
    const ripa = rbox(meia * 2, 0.04, 0.32, 0.015, i % 2 === 0 ? DEQUE : '#c9a473', { roughness: 0.8 })
    ripa.position.set(0, DY - 0.02, z)
    deque.add(ripa)
  }

  // estacas e corda na borda de trás
  const estacas: THREE.Vector3[] = []
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + 0.35 + i * ((Math.PI - 0.7) / 4)
    const p = new THREE.Vector3(Math.cos(a) * 2.18, 0, Math.sin(a) * 2.18)
    estacas.push(p)
    const estaca = cylinder(0.09, 0.1, 0.75, ESTACA, { roughness: 0.85 })
    estaca.position.set(p.x, 0.37, p.z)
    deque.add(estaca)
    const topo = sphere(0.095, ESTACA, { roughness: 0.85 })
    topo.scale.y = 0.5
    topo.position.set(p.x, 0.75, p.z)
    deque.add(topo)
  }
  for (let i = 0; i < estacas.length - 1; i++) {
    const a = estacas[i]
    const b = estacas[i + 1]
    const meio = a.clone().lerp(b, 0.5)
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(a.x, 0.66, a.z),
      new THREE.Vector3(meio.x, 0.52, meio.z),
      new THREE.Vector3(b.x, 0.66, b.z),
    ])
    deque.add(setShadow(new THREE.Mesh(new THREE.TubeGeometry(curva, 16, 0.022, 8, false), mat(CORDA, { roughness: 0.9 }))))
  }

  root.add(deque)

  // ---- mesa comprida e baixa com toalha xadrez -----------------------------
  const mesa = new THREE.Group()
  mesa.position.set(0, DY, MESA_Z)
  root.add(mesa)

  const W = 3.1
  const D = 0.78
  for (const px of [-1, 1]) {
    for (const pz of [-1, 1]) {
      const perna = cylinder(0.04, 0.05, MESA_H, MESA, { roughness: 0.6 })
      perna.position.set(px * (W / 2 - 0.15), MESA_H / 2, pz * (D / 2 - 0.1))
      mesa.add(perna)
    }
  }
  const tampo = rbox(W, 0.05, D, 0.02, MESA, { roughness: 0.6 })
  tampo.position.y = MESA_H - 0.025
  mesa.add(tampo)

  // toalha: tampo + saia caída na frente e nos lados
  const toalha = rbox(W + 0.08, 0.025, D + 0.08, 0.01, TOALHA, { roughness: 0.9 })
  toalha.position.y = MESA_H + 0.012
  mesa.add(toalha)
  const SAIA = 0.24
  const saiaF = rbox(W + 0.08, SAIA, 0.025, 0.01, TOALHA, { roughness: 0.9 })
  saiaF.position.set(0, MESA_H - SAIA / 2 + 0.02, D / 2 + 0.045)
  mesa.add(saiaF)
  for (const s of [-1, 1]) {
    const saiaL = rbox(0.025, SAIA, D + 0.08, 0.01, TOALHA, { roughness: 0.9 })
    saiaL.position.set(s * (W / 2 + 0.045), MESA_H - SAIA / 2 + 0.02, 0)
    mesa.add(saiaL)
  }
  // quadrados vermelhos (xadrez) — geometria e material compartilhados
  const Q = (W + 0.08) / 16
  const matXadrez = mat(XADREZ, { roughness: 0.9, size: Q })
  const geoTopo = new THREE.BoxGeometry(Q, 0.006, Q)
  const nz = Math.round((D + 0.08) / Q)
  for (let ix = 0; ix < 16; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      if ((ix + iz) % 2) continue
      const q = new THREE.Mesh(geoTopo, matXadrez)
      q.receiveShadow = true
      q.position.set(-(W + 0.08) / 2 + Q * (ix + 0.5), MESA_H + 0.026, -(D + 0.08) / 2 + Q * (iz + 0.5))
      mesa.add(q)
    }
  }
  const geoSaia = new THREE.BoxGeometry(Q, Q, 0.006)
  for (let ix = 0; ix < 16; ix++) {
    for (let iy = 0; iy < 2; iy++) {
      if ((ix + iy) % 2) continue
      const q = new THREE.Mesh(geoSaia, matXadrez)
      q.receiveShadow = true
      q.position.set(-(W + 0.08) / 2 + Q * (ix + 0.5), MESA_H + 0.02 - Q * (iy + 0.5), D / 2 + 0.06)
      mesa.add(q)
    }
  }

  // pratos, talheres e pãezinhos do banquete (lado direito da mesa)
  const TT = MESA_H + 0.03
  for (const [px, pz] of [[0.35, 0.12], [1.1, 0.05]] as const) {
    const prato = lathe(
      [[0, 0], [0.12, 0], [0.15, 0.015], [0.2, 0.035], [0.19, 0.04], [0.14, 0.022], [0, 0.018]],
      LOUCA,
      { roughness: 0.25 },
    )
    prato.position.set(px, TT, pz)
    mesa.add(prato)
    const garfo = rbox(0.025, 0.012, 0.26, 0.005, '#c8cdd2', { roughness: 0.3, metalness: 0.7 })
    garfo.position.set(px - 0.27, TT + 0.006, pz)
    mesa.add(garfo)
    const faca = rbox(0.03, 0.012, 0.28, 0.005, '#c8cdd2', { roughness: 0.3, metalness: 0.7 })
    faca.position.set(px + 0.27, TT + 0.006, pz)
    mesa.add(faca)
    const copo = lathe([[0, 0], [0.05, 0], [0.055, 0.02], [0.065, 0.16], [0.058, 0.16], [0.048, 0.025], [0, 0.02]], '#cfe3ea', { roughness: 0.15 })
    copo.position.set(px + 0.2, TT, pz - 0.25)
    mesa.add(copo)
  }
  for (const [bx, bz] of [[0.35, 0.1], [1.1, 0.04]] as const) {
    const pao = sphere(0.075, '#c98b4a', { roughness: 0.7 })
    pao.scale.set(1.3, 0.7, 1)
    pao.position.set(bx, TT + 0.06, bz)
    mesa.add(pao)
  }
  const cesto = lathe([[0, 0], [0.12, 0], [0.16, 0.08], [0.15, 0.09], [0.11, 0.015], [0, 0.012]], '#a87a45', { roughness: 0.85 })
  cesto.position.set(-0.25, TT, -0.18)
  mesa.add(cesto)
  for (let i = 0; i < 3; i++) {
    const pao = sphere(0.06, '#c98b4a', { roughness: 0.7 })
    pao.scale.set(1.3, 0.75, 1)
    pao.position.set(-0.25 + (i - 1) * 0.08, TT + 0.08, -0.18 + (i % 2) * 0.04)
    mesa.add(pao)
  }

  // ---- travessa funda branca (filha da mesa) ------------------------------
  const PLATTER_X = -1.0
  const travessa = new THREE.Group()
  travessa.position.set(PLATTER_X, MESA_H + 0.03, 0.02)
  mesa.add(travessa)
  const funda = lathe(
    [
      [0, 0], [0.2, 0], [0.24, 0.02], [0.3, 0.09], [0.36, 0.14], [0.37, 0.155],
      [0.35, 0.155], [0.28, 0.11], [0.22, 0.05], [0.18, 0.035], [0, 0.03],
    ],
    LOUCA,
    { roughness: 0.22 },
  )
  funda.scale.set(1.3, 1, 0.9)
  travessa.add(funda)
  const filete = torus(0.36, 0.008, '#3f6f9a', { roughness: 0.3 })
  filete.rotation.x = Math.PI / 2
  filete.scale.set(1.3, 0.9, 1)
  filete.position.y = 0.152
  travessa.add(filete)

  // ---- poça de molho na travessa (peça própria) ---------------------------
  const molho = new THREE.Group()
  molho.position.set(PLATTER_X, MESA_H + 0.03, 0.02)
  mesa.add(molho)
  const poca = sphere(0.29, MOLHO, { roughness: 0.1 })
  poca.scale.set(1.28, 0.12, 0.86)
  poca.position.y = 0.09
  molho.add(poca)
  for (const [sx, sz, r] of [[0.1, 0.04, 0.035], [-0.12, -0.05, 0.03], [0.02, -0.08, 0.025], [-0.05, 0.08, 0.028]] as const) {
    const respingo = sphere(r, MOLHO_CLARO, { roughness: 0.1 })
    respingo.position.set(sx, 0.12, sz)
    molho.add(respingo)
  }

  // ---- BALEIA-CHEF -----------------------------------------------------------
  const baleia = new THREE.Group()
  root.add(baleia)

  const corpo = sphere(1, BALEIA, { roughness: 0.45 }, 48)
  corpo.scale.copy(BR)
  corpo.position.copy(BC)
  baleia.add(corpo)

  const BB = new THREE.Vector3(0, 1.1, -0.18)
  const BBR = new THREE.Vector3(0.8, 0.9, 0.8)
  // barriga creme: peça rígida própria (fora do refine), sobreposta à pele
  const barriga = new THREE.Group()
  baleia.add(barriga)
  const panca = sphere(1, BARRIGA, { roughness: 0.5 }, 48)
  panca.scale.copy(BBR)
  panca.position.copy(BB)
  barriga.add(panca)

  // sulcos horizontais da barriga (as listras), em arco acompanhando a pele
  const ARC = Math.PI * 0.42
  for (const y of [0.52, 0.68, 0.84, 1.0, 1.16, 1.32]) {
    const s = Math.sqrt(1 - ((y - BB.y) / BBR.y) ** 2)
    const geo = new THREE.TorusGeometry(1, 0.025, 8, 28, ARC)
    geo.rotateZ(Math.PI / 2 - ARC / 2)
    geo.rotateX(Math.PI / 2)
    const sulco = setShadow(new THREE.Mesh(geo, mat(SULCO, { roughness: 0.7, size: 0.6 })))
    sulco.scale.set(BBR.x * s * 1.005, 1, BBR.z * s * 1.005)
    sulco.position.set(0, y, BB.z)
    barriga.add(sulco)
  }

  // cauda curvada para trás e para cima (lado esquerdo da tela)
  const cauda = capsule(0.24, 0.7, BALEIA, { roughness: 0.45 })
  cauda.position.set(-0.95, 0.42, -0.95)
  cauda.rotation.set(0, 0.55, 1.2)
  baleia.add(cauda)
  const pedunculo = capsule(0.16, 0.36, BALEIA, { roughness: 0.45 })
  pedunculo.position.set(-1.42, 0.72, -1.2)
  pedunculo.rotation.set(0, 0.55, 0.5)
  baleia.add(pedunculo)
  for (const s of [-1, 1]) {
    const lobo = sphere(0.3, BALEIA_ESC, { roughness: 0.45 })
    lobo.scale.set(1.25, 0.42, 0.18)
    lobo.position.set(-1.55 + s * 0.22, 1.0 + s * 0.06, -1.27)
    lobo.rotation.set(0, 0.55, s * 0.55)
    baleia.add(lobo)
  }

  // olhos
  for (const side of [-1, 1]) {
    const p = naPele(side * 0.6, 0.56, 0.58)
    const esclera = sphere(0.13, '#ffffff', { roughness: 0.25 })
    esclera.position.copy(p)
    esclera.scale.z = 0.6
    baleia.add(esclera)
    const pupila = sphere(0.07, '#151515', { roughness: 0.2 })
    pupila.position.set(p.x - side * 0.01, p.y + 0.01, p.z + 0.07)
    baleia.add(pupila)
    const brilho = sphere(0.024, '#ffffff', { roughness: 0.1 })
    brilho.position.set(p.x + 0.03, p.y + 0.05, p.z + 0.11)
    baleia.add(brilho)
    const sobrancelha = capsule(0.022, 0.12, BALEIA_ESC, { roughness: 0.5 })
    const ps = naPele(side * 0.58, 0.72, 0.5)
    sobrancelha.position.copy(ps)
    sobrancelha.rotation.set(0, 0, Math.PI / 2 + side * 0.3)
    baleia.add(sobrancelha)
    const bochecha = sphere(0.1, '#d98a95', { roughness: 0.6 })
    const pb = naPele(side * 0.48, 0.3, 0.87)
    bochecha.scale.set(1.2, 0.7, 0.4)
    bochecha.position.copy(pb)
    baleia.add(bochecha)
  }

  // beiços em bico (o beijo de chef)
  const bico = torus(0.07, 0.042, BEICO, { roughness: 0.4 })
  bico.position.set(BEICOS.x, BEICOS.y, BEICOS.z + 0.02)
  bico.scale.set(1.2, 0.85, 1)
  baleia.add(bico)
  const bicoMiolo = sphere(0.04, '#7a2f3a', { roughness: 0.4 })
  bicoMiolo.position.set(BEICOS.x, BEICOS.y, BEICOS.z + 0.02)
  baleia.add(bicoMiolo)

  // respiradouro
  const RESP = naPele(-0.45, 0.85, 0.3)
  const furo = sphere(0.09, '#162a44', { roughness: 0.4 })
  furo.scale.set(1.3, 0.4, 0.8)
  furo.position.copy(RESP)
  baleia.add(furo)

  // ---- touca de chef --------------------------------------------------------
  const touca = new THREE.Group()
  touca.position.set(0.14, 2.58, -0.45)
  touca.rotation.z = -0.12
  root.add(touca)
  const faixa = cylinder(0.36, 0.34, 0.26, '#f3f1ec', { roughness: 0.85 })
  faixa.position.y = 0.06
  touca.add(faixa)
  const copa = puff(0.33, '#fbfaf6', 7, 12, { roughness: 0.85 })
  copa.scale.set(1.25, 1.05, 1.25)
  copa.position.y = 0.42
  touca.add(copa)

  // ---- nadadeira do beijo de chef (esquerda da tela) -----------------------
  const nadadeiraBeijo = new THREE.Group()
  nadadeiraBeijo.position.copy(OMBRO_E)
  const alvoBeijo = new THREE.Vector3(BEICOS.x - 0.04, BEICOS.y - 0.03, BEICOS.z + 0.16)
  const dirBeijo = alvoBeijo.clone().sub(OMBRO_E)
  nadadeiraBeijo.add(nadadeira(dirBeijo.length()))
  const qBeijo = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dirBeijo.clone().normalize())
  const eBeijo = new THREE.Euler().setFromQuaternion(qBeijo)
  nadadeiraBeijo.rotation.copy(eBeijo)
  root.add(nadadeiraBeijo)

  // ---- estrelinhas do SMÁÁC -------------------------------------------------
  const estrelas = new THREE.Group()
  estrelas.position.set(BEICOS.x, BEICOS.y, BEICOS.z)
  root.add(estrelas)
  for (const [x, y, z, r, rz] of [
    [0.3, 0.14, 0.32, 0.1, 0.2],
    [0.58, -0.04, 0.26, 0.075, -0.25],
    [0.8, 0.16, 0.12, 0.085, 0.4],
  ] as const) {
    const e = estrela(r)
    e.position.set(x, y, z)
    e.rotation.z = rz
    estrelas.add(e)
  }

  // ---- arco de molho do respiradouro até a travessa -------------------------
  const jato = new THREE.Group()
  jato.position.copy(RESP)
  root.add(jato)
  const destino = new THREE.Vector3(PLATTER_X, DY + MESA_H + 0.13, MESA_Z + 0.02).sub(RESP)
  const caminho = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.08, 0.32, 0.04),
    new THREE.Vector3(-0.3, 0.55, 0.2),
    new THREE.Vector3(-0.6, 0.48, 0.45),
    new THREE.Vector3(-0.78, 0.05, 0.75),
    new THREE.Vector3(-0.72, -0.8, 1.0),
    destino,
  ])
  const fio = setShadow(new THREE.Mesh(new THREE.TubeGeometry(caminho, 80, 0.065, 14, false), mat(MOLHO, { roughness: 0.12 })))
  jato.add(fio)
  const jorro = lathe([[0, 0], [0.13, 0], [0.1, 0.05], [0.075, 0.12], [0, 0.13]], MOLHO, { roughness: 0.12 })
  jorro.position.set(0, -0.03, 0)
  jato.add(jorro)
  for (const [t, ox, oy, oz, r] of [
    [0.38, 0.12, 0.1, 0.05, 0.05],
    [0.55, 0.14, -0.05, -0.08, 0.042],
    [0.7, -0.12, 0.0, 0.08, 0.045],
    [0.84, 0.1, 0.0, -0.06, 0.038],
  ] as const) {
    const p = caminho.getPoint(t)
    const gota = sphere(r, MOLHO_CLARO, { roughness: 0.12 })
    gota.scale.y = 1.35
    gota.position.set(p.x + ox, p.y + oy, p.z + oz)
    jato.add(gota)
  }

  // ---- nadadeira da bandeira (direita da tela) ------------------------------
  const nadadeiraBandeira = new THREE.Group()
  nadadeiraBandeira.position.copy(OMBRO_D)
  nadadeiraBandeira.rotation.set(-0.25, 0, BAND_FINAL)
  const LEN_B = 0.82
  nadadeiraBandeira.add(nadadeira(LEN_B))
  root.add(nadadeiraBandeira)

  const bandeira = new THREE.Group()
  bandeira.position.set(0, -LEN_B + 0.14, 0)
  bandeira.rotation.z = -BAND_FINAL - 0.12
  nadadeiraBandeira.add(bandeira)
  const mastro = cylinder(0.025, 0.025, 1.25, '#e9e4da', { roughness: 0.4 })
  mastro.position.y = 0.38
  bandeira.add(mastro)
  const ponteira = sphere(0.05, '#d7b04a', { roughness: 0.3, metalness: 0.7 })
  ponteira.position.y = 1.02
  bandeira.add(ponteira)
  // pano em duas abas levemente dobradas (tremulando)
  const aba1 = rbox(0.3, 0.42, 0.025, 0.01, VERDE, { roughness: 0.75 })
  aba1.position.set(0.17, 0.76, 0.02)
  aba1.rotation.y = -0.25
  bandeira.add(aba1)
  const aba2 = rbox(0.3, 0.4, 0.025, 0.01, VERDE, { roughness: 0.75 })
  aba2.position.set(0.45, 0.75, 0.0)
  aba2.rotation.y = 0.2
  bandeira.add(aba2)
  const listra = rbox(0.58, 0.05, 0.03, 0.01, '#f4f1e6', { roughness: 0.75 })
  listra.position.set(0.31, 0.62, 0.025)
  bandeira.add(listra)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'deque', group: 'deque', object: deque },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'travessa', group: 'mesa', object: travessa },
    { name: 'baleia', group: 'baleia', object: baleia },
    { name: 'barriga', group: 'baleia', object: barriga },
    { name: 'touca', group: 'baleia', object: touca },
    { name: 'nadadeiraBeijo', group: 'smac', object: nadadeiraBeijo },
    { name: 'estrelas', group: 'smac', object: estrelas },
    { name: 'jato', group: 'molho', object: jato },
    { name: 'molho', group: 'molho', object: molho },
    { name: 'nadadeiraBandeira', group: 'largada', object: nadadeiraBandeira },
    { name: 'bandeira', group: 'largada', object: bandeira },
  ]

  // ---- montagem ------------------------------------------------------------
  const pop = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const toucaY = touca.position.y

  const build = [
    seq('deque-rise', 'deque', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Um deque de madeira sobe à beira-mar.',
    }),

    seq('mesa-rise', 'mesa', 1.2, 0.7, [riseFrom(DY, 0.9)], {
      ease: 'easeOut',
      caption: 'Nele, uma mesa comprida de toalha xadrez: o banquete está servido.',
    }),
    seq('travessa-pop', 'travessa', 1.7, 0.5, pop(), { ease: 'easeOut' }),

    seq('baleia-rise', 'baleia', 2.8, 1.0, [riseFrom(0, 2.8)], {
      ease: 'easeOut',
      caption: 'Quem serviu foi a chef: uma BALEIA azul de barriga listrada…',
    }),
    seq('touca-cai', 'touca', 3.9, 0.6, [ch('position.y', toucaY + 1.4, toucaY), ch('rotation.z', 0.5, -0.12)], {
      ease: 'easeOut',
      caption: '…de touca branca de chef.',
    }),

    seq('beijo-x', 'nadadeiraBeijo', 5.2, 0.6, [ch('rotation.x', 0, eBeijo.x)], { ease: 'easeInOut' }),
    seq('beijo-y', 'nadadeiraBeijo', 5.2, 0.6, [ch('rotation.y', 0, eBeijo.y)], { ease: 'easeInOut' }),
    seq('beijo-z', 'nadadeiraBeijo', 5.2, 0.6, [ch('rotation.z', -0.3, eBeijo.z)], {
      ease: 'easeInOut',
      caption: 'Ela leva a nadadeira aos beiços e estala o beijo de chef: SMÁÁC!…',
    }),
    seq('estrelas-pop', 'estrelas', 5.85, 0.45, [...pop(), ch('rotation.z', -0.8, 0)], {
      ease: 'easeOut',
      caption: '…e o finalzinho escorrega num -LI: SMÁÁC-LI!',
    }),

    seq('jato-cresce', 'jato', 7.4, 0.9, pop(), {
      ease: 'easeOut',
      caption: 'Aí abre o respiradouro e jorra um gêiser de MÔLHO marrom…',
    }),
    seq('molho-enche', 'molho', 8.2, 0.5, [ch('scale.x', 0.2, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.2, 1)], {
      ease: 'easeOut',
      caption: '…que cai certinho na travessa: MÔL!',
    }),

    seq('band-ergue', 'nadadeiraBandeira', 9.6, 0.6, [ch('rotation.z', BAND_REPOUSO, BAND_ALTO)], {
      ease: 'easeOut',
      caption: 'Com o molho ainda pingando, ela ergue a bandeira verde de largada…',
    }),
    seq('bandeira-pop', 'bandeira', 9.7, 0.45, pop(), { ease: 'easeOut' }),
    seq('band-baixa', 'nadadeiraBandeira', 10.9, 0.3, [ch('rotation.z', BAND_ALTO, BAND_FINAL)], {
      ease: 'easeIn',
      caption: '…e BAIXA: é dada a parTÍDa! SMÁÁC-LI MÔL-TIID!',
    }),
    seq('estrelas-brilham', 'estrelas', 12.0, 0.4, [ch('scale.x', 1.3, 1), ch('scale.y', 1.3, 1), ch('scale.z', 1.3, 1)], {
      ease: 'easeOut',
      caption: 'Smaklig måltid! — Bom apetite!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 2.55, 6.6], target: [0.05, 1.5, 0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'smaklig-maltid',
    contexto:
      "À mesa: quem serviu ou o anfitrião diz quando todos já sentaram, antes da primeira garfada — também no lunchrum do trabalho. A resposta é 'Tack, detsamma!'.",
    fraseFonte: 'Bom apetite!',
    fraseAlvo: 'Smaklig måltid!',
    pronuncia:
      "SMÁA-kli MÔL-tiid ('smaklig' com A longo e o -g mudo, igual ao 'trevlig' = TRÊV-li; 'måltid' com Ô fechado e longo e força no MÔL; 'tid' com T seco e I longo, nunca 'tchi')",
    ponteSonora:
      "SMÁÁC-LI MÔL-TIID! (4 sílabas, tônicas em SMÁ e MÔL; SMÁÁC = o estalo do beijo de chef, com A LONGO e o S grudado no M — nada de 'is' na frente; -LI é o mesmo -lig mudo de TRÊV-LI ('trevlig'), fraquinho e sem G; MÔL = o MÔ de MÔLHO, Ô FECHADO de 'avô', e o LH do molho achatado num L DE VERDADE (ponta da língua no céu da boca, logo atrás dos dentes) que já encosta no T seguinte: MÔL-TIID, sem vogal no meio — nunca 'MÔU' nem 'MÔ-lhe-tid'; é o mesmo L final do CÔL de 'skål'; TIID = o TÍD de parTÍDa, a mesma ponte de 'boka en tid', com T seco de 'tatu', nunca 'tchi', I longo e D leve; a força principal fica no MÔL, o TIID vem esticado mas mais fraco)",
    historia:
      'Num deque à beira-mar, uma baleia-chef de touca branca serviu o banquete numa mesa comprida. Ela leva a ponta da nadadeira aos beiços e estala o beijo de chef mais alto do oceano: SMÁÁC!, e o finalzinho escorrega num -LI. Aí abre o respiradouro e, em vez de água, jorra um gêiser de MÔLHO marrom que cai certinho na travessa. Com o molho ainda pingando, ela baixa a bandeira verde de largada: é dada a parTÍDa! Agora todo mundo pode atacar: bom apetite.',
  },
  createScene,
  refine: { organic: ['baleia', 'touca', 'nadadeiraBeijo', 'nadadeiraBandeira'] },
}

export default card
